import { promises as fs } from "fs";
import path from "path";
import chokidar, { FSWatcher } from "chokidar";
import * as Y from "yjs";
import baseLogger from "./logger"; // Import the base logger
import pino from "pino"; // Import pino for type definition

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
  private logger: pino.Logger; // This will be our class-specific child logger

  constructor(targetFolder: string, ydoc: Y.Doc, yarray: Y.Array<FileEntry>) {
    this.targetFolder = targetFolder;
    this.ydoc = ydoc;
    this.yarray = yarray;
    this.options = {
      ignoreInitial: false,
      persistent: true,
    };

    this.processedFiles = new Set();
    // Create a child logger, injecting 'module: JSONFileWatcher' into every log from this instance
    this.logger = baseLogger.child({ module: "JSONFileWatcher" });

    this.logger.debug("Initializing JSONFileWatcher");

    this.setupWatcher();

    this.logger.info({ targetFolder }, "Watcher initialized");
  }

  private setupWatcher() {
    const absPath = path.resolve(this.targetFolder);
    this.logger.info({ folder: absPath }, "Watching folder for JSON changes");

    this.watcher = chokidar.watch(".", {
      cwd: this.targetFolder,
      atomic: true,
      awaitWriteFinish: true,
      ignored: (f, stats) => !!stats && stats.isFile() && !f.endsWith(".json"), // Only watch JSON files
      usePolling: true,
      interval: 300,
      ...this.options,
    });

    this.watcher
      .on("add", (filePath) => this.handleFileAdd(filePath))
      .on("change", (filePath) => this.handleFileChange(filePath))
      // .on("unlink", (filePath) => this.handleFileRemove(filePath)) // Uncomment to re-enable removal
      .on("error", (error) =>
        this.logger.error({ err: error }, "Watcher encountered an error")
      )
      .on("ready", () =>
        this.logger.info("Initial scan complete. Ready for file changes")
      )
      .on("all", (event, filePath) => {
        this.logger.debug({ event, filePath }, "File system event");
      });
  }

  private async handleFileAdd(filePath: string) {
    const absFilePath = path.resolve(this.targetFolder, filePath);
    this.logger.info({ absFilePath: absFilePath }, "New file detected");
    await this.processJSONFile(absFilePath, "add");
  }

  private async handleFileChange(filePath: string) {
    const absFilePath = path.resolve(this.targetFolder, filePath);
    this.logger.info({ absFilePath }, "File modified");
    await this.processJSONFile(absFilePath, "change");
  }

  // private async handleFileRemove(filePath: string) {
  //   const fileName = path.resolve(this.targetFolder, filePath);
  //   this.processedFiles.delete(fileName);

  //   const index = this.yarray
  //     .toArray()
  //     .findIndex((entry) => entry.fileName === fileName);

  //   if (index !== -1) {
  //     this.yarray.delete(index, 1);
  //     this.logger.info({ fileName }, "Removed file from Yjs array");
  //   } else {
  //     this.logger.warn({ fileName }, "File not found in Yjs array during removal");
  //   }
  // }

  private async processJSONFile(filePath: string, action: "add" | "change") {
    const fileName = path.resolve(this.targetFolder, filePath);

    try {
      this.logger.info({ filePath, action }, "Processing JSON file");
      const fileContent = await fs.readFile(filePath, "utf8");
      const jsonData = JSON.parse(fileContent);

      const fileEntry: FileEntry = {
        fileName,
        filePath,
        content: jsonData,
        timestamp: new Date().toISOString(),
        action,
      };

      // Check if the file already exists in the Yjs array by its absolute path
      const existingIndex = this.yarray
        .toArray()
        .findIndex((item) => item.fileName === fileName);

      if (existingIndex !== -1) {
        // If found, update the existing entry (useful for 'change' events)
        this.yarray.delete(existingIndex, 1);
        this.yarray.insert(existingIndex, [fileEntry]);
        this.logger.debug({ fileName }, "Updated entry in Yjs array");
      } else {
        // Otherwise, add it as a new entry
        this.yarray.push([fileEntry]);
        this.logger.debug({ fileName }, "Added new entry to Yjs array");
      }

      this.processedFiles.add(fileName); // Track processed files by their absolute path
    } catch (error: any) {
      this.logger.error({ fileName, err: error }, "Failed to process JSON file");
    }
  }

  public stop(): void {
    if (this.watcher) {
      this.watcher.close();
      this.logger.info("Stopped file watcher");
    } else {
      this.logger.warn("Watcher was not running when stop() called");
    }
  }
}

export default JSONFileWatcher;