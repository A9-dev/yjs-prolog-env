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

  constructor(targetFolder: string, ydoc: Y.Doc, yarray: Y.Array<FileEntry>) {
    this.targetFolder = targetFolder;
    this.ydoc = ydoc;
    this.yarray = yarray;
    this.options = {
      ignoreInitial: false,
      persistent: true,
    };
    this.processedFiles = new Set();
    logger.debug("Initializing JSONFileWatcher");
    this.setupWatcher();
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
      interval: 300,
      ...this.options,
    });
    this.watcher
      .on("add", (filePath) => this.handleFileAdd(filePath))
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

  private async handleFileAdd(filePath: string) {
    const absFilePath = path.resolve(this.targetFolder, filePath);
    logger.info({ absFilePath: absFilePath }, "New file detected");
    await this.processJSONFile(absFilePath, "add");
  }

  private async processJSONFile(filePath: string, action: "add" | "change") {
    const fileName = path.resolve(this.targetFolder, filePath);
    try {
      logger.info({ filePath, action }, "Processing JSON file");
      const fileContent = await fs.readFile(filePath, "utf8");
      const jsonData = JSON.parse(fileContent);
      const fileEntry: FileEntry = {
        fileName,
        filePath,
        content: jsonData,
        timestamp: new Date().toISOString(),
        action,
      };
      const existingIndex = this.yarray
        .toArray()
        .findIndex((item) => item.fileName === fileName);
      if (existingIndex !== -1) {
        this.yarray.delete(existingIndex, 1);
        this.yarray.insert(existingIndex, [fileEntry]);
        logger.debug({ fileName }, "Updated entry in Yjs array");
      } else {
        this.yarray.push([fileEntry]);
        logger.debug({ fileName }, "Added new entry to Yjs array");
      }
      this.processedFiles.add(fileName);
    } catch (error: any) {
      logger.error({ fileName, err: error }, "Failed to process JSON file");
    }
  }

  public stop(): void {
    if (this.watcher) {
      this.watcher.close();
      logger.info("Stopped file watcher");
    } else {
      logger.warn("Watcher was not running when stop() called");
    }
  }
}

export default JSONFileWatcher;
