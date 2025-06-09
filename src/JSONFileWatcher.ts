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
    console.log("[DEBUG] Initializing JSONFileWatcher");
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
    console.log("[DEBUG] JSONFileWatcher initialized");
  }

  private setupWatcher() {
    console.log(`[DEBUG] Starting to watch folder: ${this.targetFolder}`);

    this.watcher = chokidar.watch(".", {
      // Watch the target folder, but only react to .json files
      cwd: this.targetFolder,
      atomic: true,
      awaitWriteFinish: true,
      ignored: (f, stats) => !!stats && stats.isFile() && !f.endsWith(".json"),
      usePolling: true,
      interval: 100,
      ...this.options,
    });

    console.log(
      "[DEBUG] Absolute target folder path:",
      path.resolve(this.targetFolder)
    );

    this.watcher
      .on("add", (filePath) => this.handleFileAdd(filePath))
      .on("change", (filePath) => this.handleFileChange(filePath))
      .on("unlink", (filePath) => this.handleFileRemove(filePath))
      .on("error", (error) => console.error("[DEBUG] Watcher error:", error))
      .on("ready", () =>
        console.log("[DEBUG] Initial scan complete. Ready for changes.")
      )
      .on("all", (event, filePath) => {
        console.log(`[DEBUG] Event: ${event}, File: ${filePath}`);
      });
  }

  private setupYjsObserver() {
    this.ydoc.on("update", () => {
      console.log("[DEBUG] Y.js document received an update");
      this.printCurrentState();
    });
  }

  private async handleFileAdd(filePath: string) {
    console.log(`[DEBUG] New JSON file detected: ${filePath}`);
    await this.processJSONFile(filePath, "add");
  }

  private async handleFileChange(filePath: string) {
    console.log(`[DEBUG] JSON file changed: ${filePath}`);
    await this.processJSONFile(filePath, "change");
  }

  private async handleFileRemove(filePath: string) {
    console.log(`[DEBUG] JSON file removed: ${filePath}`);
    const fileName = path.basename(filePath);
    this.processedFiles.delete(fileName);

    const arrayData = this.yarray.toArray();
    const indexToRemove = arrayData.findIndex(
      (item) => item.fileName === fileName
    );

    if (indexToRemove !== -1) {
      this.yarray.delete(indexToRemove, 1);
      console.log(`[DEBUG] Removed ${fileName} from Y.js array`);
    } else {
      console.log(
        `[DEBUG] Tried to remove ${fileName} but it was not found in Y.js array`
      );
    }
  }

  private async processJSONFile(filePath: string, action: "add" | "change") {
    try {
      console.log(
        `[DEBUG] Processing file: ${filePath} with action: ${action}`
      );
      const fileName = path.basename(filePath);
      const fileContent = await fs.readFile(filePath, "utf8");
      console.log(`[DEBUG] Read content from ${filePath}`);
      const jsonData = JSON.parse(fileContent);
      console.log(`[DEBUG] Parsed JSON data from ${filePath}`);

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
          console.log(
            `[DEBUG] Updated ${fileName} in Y.js array at index ${existingIndex}`
          );
        } else {
          this.yarray.push([fileEntry]);
          console.log(
            `[DEBUG] Added ${fileName} to Y.js array (not found for update)`
          );
        }
      } else {
        this.yarray.push([fileEntry]);
        console.log(`[DEBUG] Added ${fileName} to Y.js array`);
      }

      this.processedFiles.add(fileName);
      console.log(
        `[DEBUG] Processed files set updated:`,
        Array.from(this.processedFiles)
      );
    } catch (error: any) {
      console.error(`[DEBUG] Error processing ${filePath}:`, error.message);
    }
  }

  public getArrayContents(): FileEntry[] {
    console.log("[DEBUG] getArrayContents called");
    return this.yarray.toArray();
  }

  public getYDoc(): Y.Doc {
    console.log("[DEBUG] getYDoc called");
    return this.ydoc;
  }

  public stop(): void {
    if (this.watcher) {
      this.watcher.close();
      console.log("[DEBUG] File watcher stopped");
    } else {
      console.log("[DEBUG] File watcher was not running");
    }
  }

  public printCurrentState(): void {
    console.log("\n=== Current Y.js Array State ===");
    const contents = this.getArrayContents();
    console.log(`[DEBUG] Total entries: ${contents.length}`);
    contents.forEach((entry, index) => {
      console.log(
        `${index + 1}. ${entry.fileName} (${entry.action} at ${
          entry.timestamp
        })`
      );
    });
    console.log("================================\n");
  }
}

export default JSONFileWatcher;
