// src/yjsInstance.ts
import * as Y from "yjs";

export const ydoc = new Y.Doc();
export const yarray = ydoc.getArray<any>("jsonContents");
