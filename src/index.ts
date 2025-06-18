import { promises as fs } from "fs";
import path from "path";
import JSONFileWatcher from "./JSONFileWatcher";
import PrologEnvironment from "./PrologBuilder";
import PrologQueryService from "./services/PrologQueryService";
import setupRoutes from "./api";
import errorHandler from "./middleware/errorHandler";
import logger from "./logger";
import express from "express";
import YjsService from "./services/YjsService";
import { ydoc, yarray } from "./yjsInstance";

async function main() {
  const targetFolder = path.resolve("./watched_json_files");

  try {
    await fs.mkdir(targetFolder, { recursive: true });
    logger.info({ targetFolder }, "Target folder ready");
  } catch (error: any) {
    logger.error({ err: error }, "Failed to create target folder");
    return;
  }

  // Start JSON watcher and Prolog builder
  const yjsService = new YjsService(ydoc, yarray);
  const jsonFileWatcher = new JSONFileWatcher(targetFolder, yjsService);
  const prologEnvironment = await PrologEnvironment.init(yjsService);
  const prologQueryService = new PrologQueryService(prologEnvironment);

  // Start Express server
  const app = express();
  const port = process.env.PORT || 3000;

  app.use(express.json());
  app.use("/api", setupRoutes(prologQueryService, yjsService));
  app.use(errorHandler);

  app.listen(port, () => {
    logger.info(`API server listening on http://localhost:${port}`);
  });

  // Graceful shutdown
  process.on("SIGINT", () => {
    logger.info("Received SIGINT, shutting down gracefully...");
    jsonFileWatcher.stop();
    process.exit(0);
  });

  logger.info("System initialized: file watcher and API server are active");
}

main().catch((err) => {
  logger.error({ err }, "Unhandled error in main");
});
