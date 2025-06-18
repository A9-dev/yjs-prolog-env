import * as Y from "yjs";
import { PrologYArrayItem } from "./types";

export const ydoc = new Y.Doc();
export const yarray = ydoc.getArray<PrologYArrayItem>("jsonContents");
