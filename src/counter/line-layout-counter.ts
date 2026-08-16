import { removeMarkdownSyntax } from "./markdown";
import { createCountResult, createEmptyResult, getCharWidth, normalizeLineEndings } from "./utils";
import type { ManuscriptPreset } from "../presets/presets";
import type { Counter, CounterOptions, CountResult, DebugLine } from "./types";

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

    for (const line of sourceLines) {
      const isBlankLine = line.length === 0;

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

      const characters = Array.from(line);
      const lineCharacters = characters.reduce((total, char) => total + getCharWidth(char), 0);
      const wrappedLines = Math.max(1, Math.ceil(lineCharacters / this.preset.charactersPerLine));
      const firstUsedLine = totalLines + 1;

      totalChars += lineCharacters;
      totalLines += wrappedLines;
      currentDebugLineCount += wrappedLines;

      if (debugMode) {
        currentDebugLines.push({
          lineNum: firstUsedLine,
          text: line,
          charCount: lineCharacters,
          reason:
            wrappedLines > 1
              ? `${this.preset.charactersPerLine}字相当で${wrappedLines}行に折り返し`
              : "強制改行",
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
