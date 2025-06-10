import * as Y from "yjs";
import logger from "./logger";

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

  constructor(ydoc: Y.Doc, yarray: Y.Array<FileEntry>) {
    this.ydoc = ydoc;
    this.yarray = yarray;
    logger.debug("Initializing PrologBuilder");
    this.setupYjsObserver();
  }

  private setupYjsObserver() {
    this.ydoc.on("update", () => {
      logger.debug("Yjs document updated - triggering Prolog build process");
      this.buildPrologKnowledgeBase();
    });
    if (this.yarray.length > 0) {
      logger.debug(
        "Initial Yjs array has content, triggering initial Prolog build."
      );
      this.buildPrologKnowledgeBase();
    }
  }

  private buildPrologKnowledgeBase(): void {
    const contents = this.yarray.toArray();
    logger.info(
      { totalFiles: contents.length },
      "Yjs array changed, rebuilding knowledge base."
    );
    const mappedContents = contents.map((entry, index) => ({
      index: index + 1,
      fileName: entry.fileName,
      action: entry.action,
      timestamp: entry.timestamp,
      content: entry.content,
    }));
    logger.info(
      {
        contents: mappedContents,
      },
      "Current Yjs array state for Prolog knowledge base:"
    );
  }

  public getArrayContents(): FileEntry[] {
    return this.yarray.toArray();
  }
}

export default PrologBuilder;
