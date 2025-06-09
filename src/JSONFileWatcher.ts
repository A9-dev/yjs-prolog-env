import { promises as fs } from "fs";
import path from "path";
import chokidar, { FSWatcher } from "chokidar";
import * as Y from "yjs";

interface FileEntry {
  fileName: string;
  filePath: string;
  content: any;
  timestamp: string;
  action: "add" | "change";
}

interface WatcherOptions {
  ignoreInitial?: boolean;
  persistent?: boolean;
}

class JSONFileWatcher {
  private targetFolder: string;
  private ydoc: Y.Doc;
  private yarray: Y.Array<FileEntry>;
  private options: WatcherOptions;
  private processedFiles: Set<string>;
  private watcher?: FSWatcher;

  constructor(targetFolder: string, options: WatcherOptions = {}) {
    this.targetFolder = targetFolder;
    this.ydoc = new Y.Doc();
    this.yarray = this.ydoc.getArray<FileEntry>("jsonContents");
    this.options = {
      ignoreInitial: false,
      persistent: true,
      ...options,
    };

    this.processedFiles = new Set();

    this.setupWatcher();
    this.setupYjsObserver();
  }

  private setupWatcher() {
    console.log(`Starting to watch folder: ${this.targetFolder}`);

    this.watcher = chokidar.watch(
      path.join(this.targetFolder, "*.json"),
      this.options
    );

    this.watcher
      .on("add", (filePath) => this.handleFileAdd(filePath))
      .on("change", (filePath) => this.handleFileChange(filePath))
      .on("unlink", (filePath) => this.handleFileRemove(filePath))
      .on("error", (error) => console.error("Watcher error:", error))
      .on("ready", () =>
        console.log("Initial scan complete. Ready for changes.")
      );
  }

  private setupYjsObserver() {
    this.yarray.observe((event) => {
      console.log("Y.js array updated:");
      event.changes.added.forEach((item) => {
        console.log("Added:", item.content.getContent()[0]);
      });
      event.changes.deleted.forEach(() => {
        console.log("Removed item");
      });
    });
  }

  private async handleFileAdd(filePath: string) {
    console.log(`New JSON file detected: ${filePath}`);
    await this.processJSONFile(filePath, "add");
  }

  private async handleFileChange(filePath: string) {
    console.log(`JSON file changed: ${filePath}`);
    await this.processJSONFile(filePath, "change");
  }

  private async handleFileRemove(filePath: string) {
    console.log(`JSON file removed: ${filePath}`);
    const fileName = path.basename(filePath);
    this.processedFiles.delete(fileName);

    const arrayData = this.yarray.toArray();
    const indexToRemove = arrayData.findIndex(
      (item) => item.fileName === fileName
    );

    if (indexToRemove !== -1) {
      this.yarray.delete(indexToRemove, 1);
      console.log(`Removed ${fileName} from Y.js array`);
    }
  }

  private async processJSONFile(filePath: string, action: "add" | "change") {
    try {
      const fileName = path.basename(filePath);
      const fileContent = await fs.readFile(filePath, "utf8");
      const jsonData = JSON.parse(fileContent);

      const fileEntry: FileEntry = {
        fileName,
        filePath,
        content: jsonData,
        timestamp: new Date().toISOString(),
        action,
      };

      if (action === "change" && this.processedFiles.has(fileName)) {
        const arrayData = this.yarray.toArray();
        const existingIndex = arrayData.findIndex(
          (item) => item.fileName === fileName
        );

        if (existingIndex !== -1) {
          this.yarray.delete(existingIndex, 1);
          this.yarray.insert(existingIndex, [fileEntry]);
          console.log(`Updated ${fileName} in Y.js array`);
        } else {
          this.yarray.push([fileEntry]);
          console.log(`Added ${fileName} to Y.js array (not found for update)`);
        }
      } else {
        this.yarray.push([fileEntry]);
        console.log(`Added ${fileName} to Y.js array`);
      }

      this.processedFiles.add(fileName);
    } catch (error: any) {
      console.error(`Error processing ${filePath}:`, error.message);
    }
  }

  public getArrayContents(): FileEntry[] {
    return this.yarray.toArray();
  }

  public getYDoc(): Y.Doc {
    return this.ydoc;
  }

  public stop(): void {
    if (this.watcher) {
      this.watcher.close();
      console.log("File watcher stopped");
    }
  }

  public printCurrentState(): void {
    console.log("\n=== Current Y.js Array State ===");
    const contents = this.getArrayContents();
    console.log(`Total entries: ${contents.length}`);
    contents.forEach((entry, index) => {
      console.log(
        `${index + 1}. ${entry.fileName} (${entry.action} at ${entry.timestamp})`
      );
    });
    console.log("================================\n");
  }
}

export default JSONFileWatcher;
