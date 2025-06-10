import { promises as fs } from "fs";
import * as Y from "yjs";
import JSONFileWatcher from "./JSONFileWatcher";
import PrologBuilder from "./PrologBuilder";
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

  const ydoc = new Y.Doc();
  const yarray = ydoc.getArray<any>("jsonContents");

  const watcher = new JSONFileWatcher(targetFolder, ydoc, yarray);
  const prologBuilder = new PrologBuilder(ydoc, yarray);

  void prologBuilder;

  process.on("SIGINT", () => {
    logger.info("Received SIGINT, shutting down gracefully...");
    watcher.stop();
    process.exit(0);
  });

  logger.info(
    "File watcher and Prolog builder running – modify JSON files in the watched folder"
  );
  logger.info("Press Ctrl+C to stop");
}

main().catch((err) => logger.error({ err }, "Unhandled error in main"));
