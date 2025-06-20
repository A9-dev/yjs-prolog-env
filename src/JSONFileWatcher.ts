import { promises as fs } from "fs";
import path from "path";
import chokidar, { FSWatcher } from "chokidar";
import logger from "./logger";
import YjsService from "./services/YjsService";
import { VerifiableCredential } from "verifiable-credential-toolkit";

interface WatcherOptions {
  ignoreInitial?: boolean;
  persistent?: boolean;
}

class JSONFileWatcher {
  private targetFolder: string;
  private yjsService: YjsService;
  private options: WatcherOptions;
  private watcher?: FSWatcher;

  constructor(targetFolder: string, yjsService: YjsService) {
    this.targetFolder = targetFolder;
    this.yjsService = yjsService;
    this.options = {
      ignoreInitial: false,
      persistent: true,
    };
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

  /**
   * Handles the addition of a new JSON file to the yarray.
   * @param filePath Path of the newly added JSON file
   */
  private async handleFileAdd(filePath: string) {
    const absFilePath = path.resolve(this.targetFolder, filePath);
    logger.info({ absFilePath: absFilePath }, "New file detected");
    try {
      const fileContent = await fs.readFile(absFilePath, "utf-8");
      const jsonData = JSON.parse(fileContent);

      logger.debug(
        { filePath: absFilePath, prolog: jsonData.prolog },
        "Valid prolog rule found in JSON file"
      );

      const verifiableCredential: VerifiableCredential =
        jsonData as VerifiableCredential;
      this.yjsService.addItem(verifiableCredential);
      logger.info(
        { filePath: absFilePath },
        "Added new item to Yjs array from JSON file"
      );
    } catch (error) {
      logger.error(
        { filePath: absFilePath, err: error },
        "Failed to read or parse JSON file"
      );
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
