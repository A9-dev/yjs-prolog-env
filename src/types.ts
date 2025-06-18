interface FileEntry {
  fileName: string;
  filePath: string;
  prolog: any;
  timestamp: string;
}

interface APIRule {
  prolog: string;
  timestamp: string;
}

type PrologYArrayItem = FileEntry | APIRule;

export { FileEntry, APIRule, PrologYArrayItem };
