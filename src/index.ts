import { promises as fs } from "fs";
import * as Y from "yjs";
import JSONFileWatcher from "./JSONFileWatcher";
import PrologBuilder from "./PrologBuilder";
import logger from "./logger"; // Import the base logger for main.ts specific logs

async function main() {
  const targetFolder = "./watched_json_files";

  try {
    // Ensure the target folder exists, creating it if it doesn't
    await fs.mkdir(targetFolder, { recursive: true });
    logger.info({ targetFolder }, "Target folder ready");
  } catch (error: any) {
    logger.error({ err: error }, "Failed to create target folder");
    return;
  }

  // Initialize the shared Yjs Doc and Array instances
  const ydoc = new Y.Doc();
  const yarray = ydoc.getArray<any>("jsonContents"); // Using 'any' for now, consider a more specific type if your JSON has a fixed schema

  // Instantiate the JSONFileWatcher, passing it the target folder and the Yjs instances
  const watcher = new JSONFileWatcher(targetFolder, ydoc, yarray);
  // Instantiate the PrologBuilder, passing it the same Yjs instances so it can observe changes
  const prologBuilder = new PrologBuilder(ydoc, yarray);

  // The 'prologBuilder' variable is intentionally kept alive for its side effects (the Yjs observer).
  // The 'void' operator tells TypeScript that we are not using the value, which suppresses the "value never read" warning.
  void prologBuilder;

  // Set up graceful shutdown on SIGINT (Ctrl+C)
  process.on("SIGINT", () => {
    logger.info("Received SIGINT, shutting down gracefully...");
    watcher.stop(); // Stop the file watcher gracefully
    // The PrologBuilder is a passive observer, so no explicit stop method is needed for it
    process.exit(0); // Exit the process
  });

  logger.info("File watcher and Prolog builder running – modify JSON files in the watched folder");
  logger.info("Press Ctrl+C to stop");
}

// Execute the main function and log any unhandled errors
main().catch((err) => logger.error({ err }, "Unhandled error in main"));