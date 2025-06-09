import { promises as fs } from "fs";
import JSONFileWatcher from "./JSONFileWatcher";
import logger from "./logger";

async function main() {
  const targetFolder = "./watched_json_files";

  try {
    await fs.mkdir(targetFolder, { recursive: true });
    logger.info({ targetFolder }, "Target folder ready");
  } catch (error: any) {
    logger.error({ err: error }, "Failed to create target folder");
    return;
  }

  const watcher = new JSONFileWatcher(targetFolder);

  const stateInterval = setInterval(() => {
    watcher.printCurrentState();
  }, 10000);

  process.on("SIGINT", () => {
    logger.info("Received SIGINT, shutting down gracefully...");
    clearInterval(stateInterval);
    watcher.stop();
    process.exit(0);
  });

  logger.info("File watcher running – modify JSON files in the watched folder");
  logger.info("Press Ctrl+C to stop");
}

main().catch((err) => logger.error({ err }, "Unhandled error in main"));
