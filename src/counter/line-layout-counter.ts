import { removeMarkdownSyntax } from "src/counter/markdown";
import type { Counter, CounterOptions, CountResult, DebugLine } from "src/counter/types";
import {
  createCountResult,
  createEmptyResult,
  getLineLayoutWidth,
  normalizeLineEndings,
  splitGraphemes,
} from "src/counter/utils";
import type { ManuscriptPreset } from "src/presets/presets";

const LINE_HEAD_KINSOKU = new Set(Array.from("、。，．！？：；?!)]}〕〉》」』】）］｝»’”"));
const LINE_END_KINSOKU = new Set(Array.from("（［｛([{〔〈《「『【〘〖〝‘“"));

interface LayoutLine {
  text: string;
  width: number;
}

function startsWithKinsokuCharacter(grapheme: string, characters: Set<string>): boolean {
  const firstCharacter = Array.from(grapheme)[0];
  return firstCharacter ? characters.has(firstCharacter) : false;
}

function isLineHeadKinsoku(grapheme: string): boolean {
  return startsWithKinsokuCharacter(grapheme, LINE_HEAD_KINSOKU);
}

function isLineEndKinsoku(grapheme: string): boolean {
  return startsWithKinsokuCharacter(grapheme, LINE_END_KINSOKU);
}

function layoutSourceLine(text: string, lineCapacity: number): LayoutLine[] {
  const graphemes = splitGraphemes(text);
  if (graphemes.length === 0) return [];

  const lines: LayoutLine[] = [];
  let currentGraphemes: string[] = [];
  let currentWidth = 0;

  const flushLine = (): void => {
    if (currentGraphemes.length === 0) return;

    lines.push({
      text: currentGraphemes.join(""),
      width: currentWidth,
    });
    currentGraphemes = [];
    currentWidth = 0;
  };

  let index = 0;
  while (index < graphemes.length) {
    const grapheme = graphemes[index];
    const width = getLineLayoutWidth(grapheme);

    if (width === 0) {
      currentGraphemes.push(grapheme);
      index++;
      continue;
    }

    if (currentGraphemes.length === 0) {
      currentGraphemes.push(grapheme);
      currentWidth = width;
      index++;
      continue;
    }

    const hasFollowingGrapheme = index + 1 < graphemes.length;

    // Opening brackets should not become the last character of a line when
    // there is still content to place after them.
    if (
      hasFollowingGrapheme &&
      isLineEndKinsoku(grapheme) &&
      !isLineHeadKinsoku(grapheme) &&
      currentWidth + width >= lineCapacity
    ) {
      flushLine();
      continue;
    }

    if (currentWidth + width <= lineCapacity) {
      currentGraphemes.push(grapheme);
      currentWidth += width;
      index++;

      // Keep a line-head kinsoku character with the preceding line. It is
      // flushed on the next iteration, allowing the line to hang slightly.
      if (
        currentWidth === lineCapacity &&
        index < graphemes.length &&
        !isLineHeadKinsoku(graphemes[index])
      ) {
        flushLine();
      }
      continue;
    }

    // If an opening bracket would otherwise end the current line, move it to
    // the next line together with the character that caused the overflow.
    const lastGrapheme = currentGraphemes[currentGraphemes.length - 1];
    if (currentGraphemes.length > 1 && isLineEndKinsoku(lastGrapheme)) {
      currentGraphemes.pop();
      currentWidth -= getLineLayoutWidth(lastGrapheme);
      flushLine();
      currentGraphemes.push(lastGrapheme);
      currentWidth = getLineLayoutWidth(lastGrapheme);
      continue;
    }

    if (isLineHeadKinsoku(grapheme)) {
      // Japanese layout permits a closing punctuation mark to hang at the
      // end of the previous line rather than starting the next line.
      currentGraphemes.push(grapheme);
      currentWidth += width;
      index++;
      flushLine();
      continue;
    }

    flushLine();
  }

  flushLine();
  return lines;
}

export class LineLayoutCounter implements Counter {
  constructor(
    private readonly preset: ManuscriptPreset,
    private readonly options: CounterOptions,
  ) {}

  count(text: string, debugMode = false): CountResult {
    if (text.length === 0) return createEmptyResult();

    const cleanText = this.options.removeMarkdownSyntax ? removeMarkdownSyntax(text) : text;
    if (cleanText.length === 0) return createEmptyResult();
    const normalizedText = normalizeLineEndings(cleanText);
    const sourceLines = this.preset.forceLineBreaks
      ? normalizedText.split("\n")
      : [normalizedText.replace(/\n/g, "")];
    const lineCapacity = this.preset.charactersPerLine * 2;
    const debugInfo: CountResult["debugInfo"] = [];
    let currentDebugLines: DebugLine[] = [];
    let currentDebugLineCount = 0;
    let paragraphCount = 0;
    let emptyLines = 0;
    let totalChars = 0;
    let totalLines = 0;
    let inParagraph = false;

    const flushDebugParagraph = (): void => {
      if (currentDebugLines.length === 0) return;

      debugInfo.push({
        paragraphNum: debugInfo.length + 1,
        lines: currentDebugLines,
        lineCount: currentDebugLineCount,
      });
      currentDebugLines = [];
      currentDebugLineCount = 0;
    };

    for (const sourceLine of sourceLines) {
      const isBlankLine = sourceLine.length === 0;

      if (isBlankLine) {
        flushDebugParagraph();
        inParagraph = false;
        if (this.preset.countBlankLines) {
          emptyLines++;
          totalLines++;
        }
        continue;
      }

      if (!inParagraph) {
        paragraphCount++;
        inParagraph = true;
      }

      const layoutLines = layoutSourceLine(sourceLine, lineCapacity);
      const lineCharacters = layoutLines.reduce((total, line) => total + line.width, 0);
      const firstUsedLine = totalLines + 1;

      totalChars += lineCharacters / 2;
      totalLines += layoutLines.length;
      currentDebugLineCount += layoutLines.length;

      if (debugMode) {
        layoutLines.forEach((line, lineIndex) => {
          currentDebugLines.push({
            lineNum: firstUsedLine + lineIndex,
            text: line.text,
            charCount: line.width / 2,
            reason:
              layoutLines.length > 1
                ? `${this.preset.charactersPerLine}字相当で${layoutLines.length}行に折り返し`
                : "強制改行",
          });
        });
      }
    }

    flushDebugParagraph();

    return createCountResult(
      Math.ceil(totalChars + totalLines),
      totalChars,
      totalLines,
      paragraphCount,
      emptyLines,
      this.preset.linesPerPage,
      debugMode ? debugInfo : [],
    );
  }
}
