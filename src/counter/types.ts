export interface DebugLine {
  lineNum: number;
  text: string;
  charCount: number;
  reason: string;
}

export interface DebugParagraph {
  paragraphNum: number;
  lines: DebugLine[];
  lineCount: number;
}

export interface CountResult {
  totalCells: number;
  characters: number;
  totalLines: number;
  paragraphs: number;
  emptyParagraphs: number;
  pageCount: number;
  fullPages: number;
  remainingLines: number;
  debugInfo: DebugParagraph[];
}

export interface CounterOptions {
  removeMarkdownSyntax: boolean;
}

export interface Counter {
  count(text: string, debugMode?: boolean): CountResult;
}
