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

class PrologBuilder {
  private ydoc: Y.Doc;
  private yarray: Y.Array<FileEntry>;
  private logger: pino.Logger; // This will be our class-specific child logger

  constructor(ydoc: Y.Doc, yarray: Y.Array<FileEntry>) {
    this.ydoc = ydoc;
    this.yarray = yarray;
    // Create a child logger, injecting 'module: PrologBuilder' into every log from this instance
    this.logger = baseLogger.child({ module: "PrologBuilder" });

    this.logger.debug("Initializing PrologBuilder");
    this.setupYjsObserver();
  }

  private setupYjsObserver() {
    // Listen for any updates on the Yjs document
    this.ydoc.on("update", () => {
      this.logger.debug(
        "Yjs document updated - triggering Prolog build process"
      );
      this.buildPrologKnowledgeBase();
    });
    // Trigger an initial build if there's already data in the Yjs array
    if (this.yarray.length > 0) {
      this.logger.debug(
        "Initial Yjs array has content, triggering initial Prolog build."
      );
      this.buildPrologKnowledgeBase();
    }
  }

  private buildPrologKnowledgeBase(): void {
    const contents = this.yarray.toArray();
    this.logger.info(
      { totalFiles: contents.length },
      "Yjs array changed, rebuilding knowledge base."
    );

    // This is the core logic where you would transform the JSON data
    // from 'contents' into Prolog facts or rules.
    // For this example, we're simply logging the structured data.
    const mappedContents = contents.map((entry, index) => ({
      index: index + 1,
      fileName: entry.fileName,
      action: entry.action,
      timestamp: entry.timestamp,
      content: entry.content, // This 'content' would be converted into Prolog terms
    }));

    this.logger.info(
      {
        contents: mappedContents,
      },
      "Current Yjs array state for Prolog knowledge base:"
    );

    // Example: You might write generated Prolog facts to a file:
    // const prologFacts = contents.map(entry => `json_file('${entry.fileName}', '${entry.filePath}', ${JSON.stringify(entry.content)}).`).join('\n');
    // fs.writeFile('knowledge_base.pl', prologFacts);
  }

  public getArrayContents(): FileEntry[] {
    return this.yarray.toArray();
  }
}

export default PrologBuilder;
