import * as Y from "yjs";
import { PrologYArrayItem } from "../types";

class YjsService {
  private yDoc: Y.Doc;
  private yarray: Y.Array<PrologYArrayItem>;

  constructor(yDoc: Y.Doc, yarray: Y.Array<PrologYArrayItem>) {
    this.yDoc = yDoc;
    this.yarray = yarray;
  }

  public addItem(item: PrologYArrayItem): void {
    this.yarray.push([item]);
  }

  public getDoc(): Y.Doc {
    return this.yDoc;
  }

  public getArray(): Y.Array<PrologYArrayItem> {
    return this.yarray;
  }

  public destroy(): void {
    this.yDoc.destroy();
  }
}

export default YjsService;
