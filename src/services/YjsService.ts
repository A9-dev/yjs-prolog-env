import * as Y from "yjs";
import { VerifiableCredential } from "verifiable-credential-toolkit";

class YjsService {
  private yDoc: Y.Doc;
  private yarray: Y.Array<VerifiableCredential>;

  constructor(yDoc: Y.Doc, yarray: Y.Array<VerifiableCredential>) {
    this.yDoc = yDoc;
    this.yarray = yarray;
  }

  public addItem(item: VerifiableCredential): void {
    this.yarray.push([item]);
  }

  public getDoc(): Y.Doc {
    return this.yDoc;
  }

  public getArray(): Y.Array<VerifiableCredential> {
    return this.yarray;
  }

  public destroy(): void {
    this.yDoc.destroy();
  }
}

export default YjsService;
