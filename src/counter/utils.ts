import type { CountResult, DebugLine } from "./types";

export function getCharWidth(char: string): number {
  const code = char.charCodeAt(0);

  return (code >= 0x20 && code <= 0x7e) || (code >= 0xff61 && code <= 0xff9f) ? 0.5 : 1;
}

export function createEmptyResult(): CountResult {
  return {
    totalCells: 0,
    characters: 0,
    totalLines: 0,
    paragraphs: 0,
    emptyParagraphs: 0,
    pageCount: 0,
    fullPages: 0,
    remainingLines: 0,
    debugInfo: [],
  };
}

export function createCountResult(
  totalCells: number,
  characters: number,
  totalLines: number,
  paragraphs: number,
  emptyParagraphs: number,
  linesPerPage: number,
  debugInfo: CountResult["debugInfo"],
): CountResult {
  return {
    totalCells,
    characters,
    totalLines,
    paragraphs,
    emptyParagraphs,
    pageCount: totalLines / linesPerPage,
    fullPages: Math.floor(totalLines / linesPerPage),
    remainingLines: totalLines % linesPerPage,
    debugInfo,
  };
}

export function addDebugLine(
  debugInfo: DebugLine[],
  debugMode: boolean,
  lineNum: number,
  text: string,
  charCount: number,
  reason: string,
): void {
  if (!debugMode) return;

  debugInfo.push({ lineNum, text, charCount, reason });
}

export function normalizeLineEndings(text: string): string {
  return text.replace(/\r\n?/g, "\n");
}
