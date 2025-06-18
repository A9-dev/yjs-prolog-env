import * as Y from "yjs";
import logger from "./logger";
import SWIPL from "swipl-wasm";
import { PrologYArrayItem } from "./types";

class PrologBuilder {
  private ydoc: Y.Doc;
  private yarray: Y.Array<PrologYArrayItem>;
  private swiplEngine: any;
  private isInitialised: boolean = false;

  /**
   * Private constructor. Use `PrologBuilder.init()` to create an instance.
   */
  constructor(ydoc: Y.Doc, yarray: Y.Array<PrologYArrayItem>) {
    this.ydoc = ydoc;
    this.yarray = yarray;
  }

  /**
   * Asynchronously creates and initializes a PrologBuilder instance.
   * Must be used instead of the constructor.
   */
  public static async init(
    ydoc: Y.Doc,
    yarray: Y.Array<PrologYArrayItem>
  ): Promise<PrologBuilder> {
    logger.debug(
      { ydoc, yarray },
      "Initializing PrologBuilder with Yjs document and array"
    );
    const builder = new PrologBuilder(ydoc, yarray);

    builder.setupYjsObserver();

    try {
      builder.swiplEngine = await SWIPL({ arguments: ["-q"] });
      logger.info("Blank SWIPL engine initialised in PrologBuilder");
      await builder.buildPrologKnowledgeBase();
      builder.isInitialised = true;
    } catch (err) {
      logger.error({ error: err }, "Failed to initialize SWIPL engine");
      throw err;
    }

    return builder;
  }

  /**
   * Ensure the PrologBuilder is fully initialized before using.
   */
  private ensureInitialised() {
    if (!this.isInitialised) {
      throw new Error(
        "PrologBuilder not initialized. Use PrologBuilder.init() and await it before calling methods."
      );
    }
  }

  /**
   * Sets up an observer on the Yjs document to rebuild the Prolog knowledge base
   * whenever the Yjs array is updated.
   */
  private setupYjsObserver() {
    this.ydoc.on("update", async () => {
      logger.debug("Yjs document updated - triggering Prolog build process");
      try {
        await this.buildPrologKnowledgeBase();
        logger.info("Prolog knowledge base rebuilt successfully");
        //! Run custom logic here if implementing a bespoke service
      } catch (err) {
        logger.error({ error: err }, "Error during Prolog build or query");
      }
    });
  }

  /**
   * Rebuilds the Prolog knowledge base from the Yjs array.
   * This is called automatically when the Yjs document updates.
   */
  private async buildPrologKnowledgeBase(): Promise<void> {
    const contents = this.yarray.toArray();
    logger.info(
      { fileCount: contents.length },
      "Rebuilding Prolog knowledge base from file entries"
    );
    logger.debug(
      { contents },
      "Contents of Yjs array before building Prolog knowledge base"
    );
    try {
      const engine: any = await SWIPL({ arguments: ["-q"] });
      logger.debug("SWIPL engine initialized");

      let prologSource = "";

      for (const entry of contents) {
        const prolog = entry.prolog;
        if (prolog) {
          prologSource += prolog + "\n";
        } else {
          logger.warn({ entry }, "Skipping entry with missing Prolog content");
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

  /**
   * Queries the SWIPL engine with a Prolog query string.
   * Returns the result of the query or null if an error occurs.
   */
  public async querySwiplEngine(query: string): Promise<any> {
    this.ensureInitialised();
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

  /**
   * Adds a new Prolog rule to the SWIPL engine.
   * This can be used to dynamically extend the Prolog knowledge base.
   */
  public async addRule(rule: string): Promise<void> {
    this.ensureInitialised();
    if (!this.swiplEngine) {
      throw new Error("SWIPL engine not initialized");
    }
    this.swiplEngine.prolog.load_string(rule);
  }
}

export default PrologBuilder;
