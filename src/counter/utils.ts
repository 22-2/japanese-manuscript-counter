import * as eastAsianWidth from "eastasianwidth";
import type { CountResult, DebugLine } from "src/counter/types";

const MARK_PATTERN = /^\p{Mark}$/u;
const EMOJI_PATTERN = /\p{Extended_Pictographic}/u;
const REGIONAL_INDICATOR_PATTERN = /^\p{Regional_Indicator}$/u;
const DEFAULT_IGNORABLE_PATTERN = /^\p{Default_Ignorable_Code_Point}$/u;

const graphemeSegmenter =
  typeof Intl !== "undefined" && typeof Intl.Segmenter !== "undefined"
    ? new Intl.Segmenter(undefined, { granularity: "grapheme" })
    : null;

export function getCharWidth(char: string): number {
  const code = char.codePointAt(0) ?? 0;

  return (code >= 0x20 && code <= 0x7e) || (code >= 0xff61 && code <= 0xff9f) ? 0.5 : 1;
}

export function splitGraphemes(text: string): string[] {
  if (!graphemeSegmenter) return Array.from(text);

  return Array.from(graphemeSegmenter.segment(text), ({ segment }) => segment);
}

function isZeroWidthCodePoint(char: string): boolean {
  return MARK_PATTERN.test(char) || DEFAULT_IGNORABLE_PATTERN.test(char);
}

/**
 * Returns the width used by the line-layout engine.
 *
 * A half-width character consumes one unit and a full-width character
 * consumes two units. A grapheme cluster is kept together so that emoji,
 * combining marks, and emoji sequences cannot be split across lines.
 */
export function getLineLayoutWidth(grapheme: string): number {
  const codePoints = Array.from(grapheme);
  if (codePoints.length === 0) return 0;

  if (
    codePoints.some((char) => EMOJI_PATTERN.test(char)) ||
    codePoints.some((char) => REGIONAL_INDICATOR_PATTERN.test(char)) ||
    codePoints.includes("\u20e3")
  ) {
    return 2;
  }

  return codePoints.reduce(
    (width, char) =>
      width + (isZeroWidthCodePoint(char) ? 0 : eastAsianWidth.characterLength(char)),
    0,
  );
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
