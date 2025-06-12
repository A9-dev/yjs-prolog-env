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
        logger.info("Prolog knowledge base rebuilt successfully");
        await this.runExampleQueries();
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
      logger.debug("SWIPL engine initialized");

      let prologSource = "";

      for (const entry of contents) {
        const prolog = entry.content?.prolog;
        if (prolog) {
          prologSource += prolog + "\n";
        } else {
          logger.warn(
            { fileName: entry.fileName },
            "Skipping file with missing Prolog content"
          );
        }
      }

      if (!prologSource.trim()) {
        logger.warn("No valid Prolog content found; skipping engine load");
        return;
      }

      logger.debug(
        { lineCount: prologSource.split("\n").length },
        "Compiled Prolog source ready for engine load"
      );

      try {
        engine.prolog.load_string(prologSource);
        logger.info("Prolog content successfully loaded into engine");
      } catch (err) {
        logger.error(
          { error: err },
          "Failed to load Prolog content into engine"
        );
        return;
      }

      try {
        this.swiplEngine = engine;
        logger.info("SWIPL engine assigned to instance");
      } catch (err) {
        logger.error(
          { error: err },
          "Failed to assign SWIPL engine to instance"
        );
      }
    } catch (err) {
      logger.error({ error: err }, "SWIPL engine initialization failed");
    }
  }

  private async querySwiplEngine(query: string): Promise<any> {
    if (!this.swiplEngine) {
      logger.warn("SWIPL engine not initialized. Skipping query.");
      return null;
    }

    try {
      const result = this.swiplEngine.prolog.query(query).once();
      return result;
    } catch (err) {
      logger.error({ error: err, query }, "Error during Prolog query");
      return null;
    }
  }

  private async runExampleQueries(): Promise<void> {
    const exampleQueries = [
      "path(a, h, P).",
      "member(X, [a,b,c]).",
      "ancestor(alice, george).",
      "solve(Houses).",
    ];

    for (const query of exampleQueries) {
      try {
        const result = await this.querySwiplEngine(query);
        logger.info(
          { result: JSON.stringify(result) },
          `Example query result: ${query}`
        );
      } catch (err) {
        logger.error({ error: err, query }, `Error in example query: ${query}`);
      }
    }
  }
}

export default PrologBuilder;
