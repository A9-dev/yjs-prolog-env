import { promises as fs } from "fs";
import path from "path";
import chokidar, { FSWatcher } from "chokidar";
import * as Y from "yjs";
import logger from "./logger";

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

  constructor(targetFolder: string, ) {
    this.targetFolder = targetFolder;
    this.ydoc = new Y.Doc();
    this.yarray = this.ydoc.getArray<FileEntry>("jsonContents");
    this.options = {
      ignoreInitial: false,
      persistent: true,
    };

    this.processedFiles = new Set();

    logger.debug("Initializing JSONFileWatcher");

    this.setupWatcher();
    this.setupYjsObserver();

    logger.info({ targetFolder }, "Watcher initialized");
  }

  private setupWatcher() {
    const absPath = path.resolve(this.targetFolder);
    logger.info({ folder: absPath }, "Watching folder for JSON changes");

    this.watcher = chokidar.watch(".", {
      cwd: this.targetFolder,
      atomic: true,
      awaitWriteFinish: true,
      ignored: (f, stats) => !!stats && stats.isFile() && !f.endsWith(".json"),
      usePolling: true,
      interval: 100,
      ...this.options,
    });

    this.watcher
      .on("add", (filePath) => this.handleFileAdd(filePath))
      .on("change", (filePath) => this.handleFileChange(filePath))
      .on("unlink", (filePath) => this.handleFileRemove(filePath))
      .on("error", (error) =>
        logger.error({ err: error }, "Watcher encountered an error")
      )
      .on("ready", () =>
        logger.info("Initial scan complete. Ready for file changes")
      )
      .on("all", (event, filePath) => {
        logger.debug({ event, filePath }, "File system event");
      });
  }

  private setupYjsObserver() {
    this.ydoc.on("update", () => {
      logger.debug("Yjs document updated");
      this.printCurrentState();
    });
  }

  private async handleFileAdd(filePath: string) {
    logger.info({ filePath }, "New file detected");
    await this.processJSONFile(filePath, "add");
  }

  private async handleFileChange(filePath: string) {
    logger.info({ filePath }, "File modified");
    await this.processJSONFile(filePath, "change");
  }

  private async handleFileRemove(filePath: string) {
    const fileName = path.basename(filePath);
    this.processedFiles.delete(fileName);

    const index = this.yarray
      .toArray()
      .findIndex((entry) => entry.fileName === fileName);

    if (index !== -1) {
      this.yarray.delete(index, 1);
      logger.info({ fileName }, "Removed file from Yjs array");
    } else {
      logger.warn({ fileName }, "File not found in Yjs array during removal");
    }
  }

  private async processJSONFile(filePath: string, action: "add" | "change") {
    const fileName = path.basename(filePath);

    try {
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
          logger.debug({ fileName }, "Updated entry in Yjs array");
        } else {
          this.yarray.push([fileEntry]);
          logger.warn(
            { fileName },
            "Change detected but entry not found. Added new entry."
          );
        }
      } else {
        this.yarray.push([fileEntry]);
        logger.debug({ fileName }, "Added new entry to Yjs array");
      }

      this.processedFiles.add(fileName);
    } catch (error: any) {
      logger.error({ fileName, err: error }, "Failed to process JSON file");
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
      logger.info("Stopped file watcher");
    } else {
      logger.warn("Watcher was not running when stop() called");
    }
  }

  public printCurrentState(): void {
    const contents = this.getArrayContents();

    const mappedContents = contents.map((entry, index) => ({
      index: index + 1,
      fileName: entry.fileName,
      action: entry.action,
      timestamp: entry.timestamp,
      content: entry.content,
    }));

    logger.info(
      {
        total: contents.length,
        contents: mappedContents,
      },
      "Current Yjs array state:"
    );
  }
}

export default JSONFileWatcher;
