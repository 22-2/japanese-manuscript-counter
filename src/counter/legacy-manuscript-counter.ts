import { removeMarkdownSyntax } from "src/counter/markdown";
import { addDebugLine, createCountResult, createEmptyResult, getCharWidth } from "src/counter/utils";
import type { Counter, CounterOptions, CountResult, DebugLine } from "src/counter/types";

const CELLS_PER_LINE = 20;
const LINES_PER_PAGE = 20;
const GYOTO_KINSOKU = "\u3001\u3002\uFF09\u300D\u300F\u3011";
const GYOMATSU_KINSOKU = "\uFF08\u300C\u300E\u3010";

interface ParagraphResult {
  cells: number;
  characters: number;
  lines: number;
  debugInfo: DebugLine[] | null;
}

export class LegacyManuscriptCounter implements Counter {
  constructor(private readonly options: CounterOptions) {}

  count(text: string, debugMode = false): CountResult {
    if (!text || text.trim() === "") return createEmptyResult();

    const cleanText = this.options.removeMarkdownSyntax ? removeMarkdownSyntax(text) : text;
    const paragraphs = cleanText.split(/\n\n+/);
    let totalCells = 0;
    let totalChars = 0;
    let totalLines = 0;
    let paragraphCount = 0;
    const allDebugInfo: CountResult["debugInfo"] = [];

    for (const paragraph of paragraphs) {
      if (paragraph.trim() === "") continue;

      paragraphCount++;
      const result = this.countParagraph(paragraph, debugMode);
      totalCells += result.cells;
      totalChars += result.characters;
      totalLines += result.lines;

      if (debugMode && result.debugInfo) {
        allDebugInfo.push({
          paragraphNum: paragraphCount,
          lines: result.debugInfo,
          lineCount: result.lines,
        });
      }
    }

    // 段落間の空白行をカウント（段落数 - 1 = 空白行の数）
    const emptyLines = Math.max(paragraphCount - 1, 0);
    totalLines += emptyLines;
    totalCells += emptyLines * CELLS_PER_LINE;

    return createCountResult(
      totalCells,
      totalChars,
      totalLines,
      paragraphCount,
      emptyLines,
      LINES_PER_PAGE,
      allDebugInfo,
    );
  }

  private countParagraph(paragraph: string, debugMode: boolean): ParagraphResult {
    let currentLine = 0;
    let totalChars = 0;
    let lines = 1;
    let currentLineText = "";
    const debugInfo: DebugLine[] = [];
    const chars = Array.from(paragraph);

    for (let i = 0; i < chars.length; i++) {
      const char = chars[i];

      if (char === "\n") {
        // 0文字の改行は行数にカウントしない
        if (currentLine > 0) {
          addDebugLine(debugInfo, debugMode, lines, currentLineText, currentLine, "改行");
          currentLineText = "";
          lines++;
          currentLine = 0;
        } else if (debugMode) {
          // デバッグモードでは0文字の改行も記録するが、行数は増やさない
          addDebugLine(debugInfo, true, lines, currentLineText, 0, "空改行（カウントなし）");
        }
        continue;
      }

      const charWidth = getCharWidth(char);
      totalChars += charWidth === 1 ? 1 : 0.5;

      // 現在の文字を追加すると20文字ちょうどになる場合
      if (currentLine + charWidth === CELLS_PER_LINE) {
        // 次の文字が行頭禁則文字かチェック
        if (i + 1 < chars.length && GYOTO_KINSOKU.includes(chars[i + 1])) {
          // 現在の文字と次の行頭禁則文字を両方とも現在の行に追加（21文字の行になる）
          currentLine += charWidth;
          if (debugMode) currentLineText += char;

          i++;
          const nextChar = chars[i];
          const nextCharWidth = getCharWidth(nextChar);
          totalChars += nextCharWidth === 1 ? 1 : 0.5;
          currentLine += nextCharWidth;
          if (debugMode) currentLineText += nextChar;

          addDebugLine(
            debugInfo,
            debugMode,
            lines,
            currentLineText,
            currentLine,
            `20字+行頭禁則: ${nextChar}`,
          );
          currentLineText = "";

          if (i + 1 < chars.length) {
            lines++;
            currentLine = 0;
          }
        } else {
          currentLine += charWidth;
          if (debugMode) currentLineText += char;
          addDebugLine(debugInfo, debugMode, lines, currentLineText, currentLine, "20文字で改行");
          currentLineText = "";

          if (i + 1 < chars.length) {
            lines++;
            currentLine = 0;
          }
        }
      } else if (currentLine + charWidth > CELLS_PER_LINE) {
        const isGyotoKinsoku = GYOTO_KINSOKU.includes(char);
        const isGyomatsuKinsoku = GYOMATSU_KINSOKU.includes(char);

        if (isGyotoKinsoku) {
          currentLine += charWidth;
          if (debugMode) currentLineText += char;
          addDebugLine(
            debugInfo,
            debugMode,
            lines,
            currentLineText,
            currentLine,
            `行頭禁則: ${char}`,
          );
          currentLineText = "";

          if (i + 1 < chars.length) {
            lines++;
            currentLine = 0;
          }
        } else if (isGyomatsuKinsoku) {
          addDebugLine(debugInfo, debugMode, lines, currentLineText, currentLine, "行末禁則");
          currentLineText = debugMode ? char : "";
          lines++;
          currentLine = charWidth;
        } else {
          addDebugLine(debugInfo, debugMode, lines, currentLineText, currentLine, "20文字超過");
          currentLineText = debugMode ? char : "";
          lines++;
          currentLine = charWidth;
        }
      } else {
        currentLine += charWidth;
        if (debugMode) currentLineText += char;
      }
    }

    if (debugMode && currentLineText && currentLine > 0) {
      addDebugLine(debugInfo, true, lines, currentLineText, currentLine, "最終行");
    }

    return {
      cells: Math.ceil(totalChars + lines),
      characters: totalChars,
      lines,
      debugInfo: debugMode ? debugInfo : null,
    };
  }
}
