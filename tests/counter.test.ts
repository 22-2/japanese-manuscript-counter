import { LegacyManuscriptCounter } from "src/counter/legacy-manuscript-counter";
import { LineLayoutCounter } from "src/counter/line-layout-counter";
import { isWithinPageRange } from "src/presets/formatting";
import { GA_BUNKO_PRESET } from "src/presets/presets";
import { describe, expect, it } from "vitest";

const options = { removeMarkdownSyntax: true };

function makeLines(count: number): string {
  return Array.from({ length: count }, () => "あ").join("\n");
}

describe("LegacyManuscriptCounter", () => {
  const counter = new LegacyManuscriptCounter(options);

  it("keeps the existing 20×20 counting behavior", () => {
    const result = counter.count("あ".repeat(20));

    expect(result.characters).toBe(20);
    expect(result.totalCells).toBe(21);
    expect(result.totalLines).toBe(1);
    expect(result.pageCount).toBe(0.05);
    expect(result.fullPages).toBe(0);
    expect(result.remainingLines).toBe(1);
  });

  it("preserves markdown removal as a setting", () => {
    const withoutMarkdown = new LegacyManuscriptCounter({ removeMarkdownSyntax: false });

    expect(counter.count("# 見出し").characters).toBe(3);
    expect(withoutMarkdown.count("# 見出し").characters).toBe(4);
  });
});

describe("LineLayoutCounter", () => {
  const counter = new LineLayoutCounter(GA_BUNKO_PRESET, options);

  it("wraps at 42 full-width-equivalent characters", () => {
    expect(counter.count("あ".repeat(42)).totalLines).toBe(1);
    expect(counter.count("あ".repeat(43)).totalLines).toBe(2);
    expect(counter.count("a".repeat(84)).totalLines).toBe(1);
    expect(counter.count("a".repeat(85)).totalLines).toBe(2);
  });

  it("keeps grapheme clusters together", () => {
    const result = counter.count(`${"あ".repeat(41)}👩‍💻あ`, true);

    expect(result.totalLines).toBe(2);
    expect(result.debugInfo[0].lines[0].text).toBe(`${"あ".repeat(41)}👩‍💻`);

    expect(counter.count(`${"あ".repeat(41)}か\u3099`).totalLines).toBe(1);
  });

  it("applies Japanese line-head and line-end kinsoku", () => {
    const closingResult = counter.count(`${"あ".repeat(42)}。あ`, true);
    const openingResult = counter.count(`${"あ".repeat(41)}（あ`, true);

    expect(closingResult.totalLines).toBe(2);
    expect(closingResult.debugInfo[0].lines[0].text.endsWith("。")).toBe(true);
    expect(openingResult.totalLines).toBe(2);
    expect(openingResult.debugInfo[0].lines[1].text.startsWith("（")).toBe(true);
  });

  it("treats line breaks and blank lines as used lines", () => {
    const result = counter.count("本文\n\n続き");

    expect(result.totalLines).toBe(3);
    expect(result.emptyParagraphs).toBe(1);
    expect(result.paragraphs).toBe(2);
  });

  it("normalizes CRLF line endings", () => {
    expect(counter.count("本文\r\n続き").totalLines).toBe(2);
  });

  it("uses the rounded page count for the page range", () => {
    expect(counter.count(makeLines(80 * 34)).pageCount).toBe(80);
    expect(counter.count(makeLines(130 * 34)).pageCount).toBe(130);

    const justBelowMinimum = counter.count(makeLines(80 * 34 - 1));
    const justAboveMaximum = counter.count(makeLines(130 * 34 + 1));

    expect(justBelowMinimum.pageCount).toBeLessThan(80);
    expect(isWithinPageRange(justBelowMinimum, GA_BUNKO_PRESET)).toBe(true);
    expect(justAboveMaximum.pageCount).toBeGreaterThan(130);
    expect(isWithinPageRange(justAboveMaximum, GA_BUNKO_PRESET)).toBe(false);
  });

  it("returns zero for an empty document", () => {
    expect(counter.count("")).toMatchObject({
      totalLines: 0,
      pageCount: 0,
      emptyParagraphs: 0,
    });
  });
});
