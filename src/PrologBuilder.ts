import * as Y from "yjs";
import logger from "./logger";
import SWIPL from "swipl-wasm";

interface FileEntry {
  fileName: string;
  filePath: string;
  content: any;
  timestamp: string;
  action: "add" | "change";
}

class PrologBuilder {
  private ydoc: Y.Doc;
  private yarray: Y.Array<FileEntry>;
  private swiplEngine: any;

  constructor(ydoc: Y.Doc, yarray: Y.Array<FileEntry>) {
    this.ydoc = ydoc;
    this.yarray = yarray;
    logger.debug("Initializing PrologBuilder");
    this.setupYjsObserver();
  }

  private setupYjsObserver() {
    this.ydoc.on("update", async () => {
      logger.debug("Yjs document updated - triggering Prolog build process");
      try {
        await this.buildPrologKnowledgeBase();
        logger.info("Prolog knowledge base built, proceeding to query");

        const result = await this.querySwiplEngine("solve(Houses).");
        logger.info({ result }, "Prolog query result:");
      } catch (err) {
        logger.error({ error: err }, "Error during Prolog build or query");
      }
    });
  }

  private async buildPrologKnowledgeBase(): Promise<void> {
    const contents = this.yarray.toArray();
    logger.info(
      { fileCount: contents.length },
      "Rebuilding Prolog knowledge base from file entries"
    );

    try {
      const engine: any = await SWIPL({ arguments: ["-q"] });
      logger.debug("Initialized new SWIPL engine");

      let prologSource = "";

      for (const entry of contents) {
        if (entry.content?.prolog) {
          logger.debug(
            { fileName: entry.fileName },
            "Appending Prolog content"
          );
          prologSource += entry.content.prolog + "\n";
        } else {
          logger.warn(
            { fileName: entry.fileName },
            "Skipping file: missing Prolog content"
          );
        }
      }

      try {
        engine.prolog.load_string(prologSource);
        logger.info("Loaded Prolog content into engine");
      } catch (err) {
        logger.error(
          { error: err },
          "Error loading Prolog content into engine"
        );
        return;
      }

      try {
        this.swiplEngine = await Promise.resolve(engine);
        logger.info("SWIPL engine successfully assigned to instance");
      } catch (err) {
        logger.error({ error: err }, "Failed to assign SWIPL engine");
      }
    } catch (err) {
      logger.error({ error: err }, "Failed to initialize SWIPL engine");
    }
  }
  private async querySwiplEngine(query: string): Promise<any> {
    if (!this.swiplEngine) {
      logger.warn("SWIPL engine not initialized. Skipping query.");
      return null;
    }

    try {
      const result = this.swiplEngine.prolog.query(query).once();
      logger.debug({ query, result }, "Prolog query result");
      return result;
    } catch (err) {
      logger.error({ error: err, query }, "Error during Prolog query");
      return null;
    }
  }
}

export default PrologBuilder;
