import { LineLayoutCounter } from "src/counter/line-layout-counter";
import { formatPageCount, formatStatusText, isWithinPageRange } from "src/presets/formatting";
import { GA_BUNKO_PRESET } from "src/presets/presets";
import { describe, expect, it } from "vitest";

function makeLines(count: number): string {
  return Array.from({ length: count }, () => "あ").join("\n");
}

describe("GA文庫 status formatting", () => {
  const counter = new LineLayoutCounter(GA_BUNKO_PRESET, {
    removeMarkdownSyntax: true,
  });

  it("formats the requested in-range status text", () => {
    const result = counter.count(makeLines(3346));

    expect(formatPageCount(result, GA_BUNKO_PRESET)).toBe("99頁（GA 42×34）");
    expect(formatStatusText(result, null, GA_BUNKO_PRESET)).toBe("99頁（GA 42×34）・規定内");
    expect(isWithinPageRange(result, GA_BUNKO_PRESET)).toBe(true);
  });

  it("rounds a partial minimum page up for compliance", () => {
    const result = counter.count(makeLines(80 * 34 - 1));

    expect(formatPageCount(result, GA_BUNKO_PRESET)).toBe("80頁（GA 42×34）");
    expect(isWithinPageRange(result, GA_BUNKO_PRESET)).toBe(true);
  });

  it("marks pages outside the inclusive range as warnings", () => {
    const result = counter.count(makeLines(130 * 34 + 1));

    expect(formatStatusText(result, null, GA_BUNKO_PRESET)).toContain("⚠ 規定外");
    expect(isWithinPageRange(result, GA_BUNKO_PRESET)).toBe(false);
  });
});
