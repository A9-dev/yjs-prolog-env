import * as Y from "yjs";
import { VerifiableCredential } from "verifiable-credential-toolkit";

export const ydoc = new Y.Doc();
export const yarray = ydoc.getArray<VerifiableCredential>("jsonContents");
