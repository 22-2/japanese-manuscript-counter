import { describe, expect, it } from "vitest";
import { matchesTagFilter, parseTagFilter } from "src/settings/tag-filter";

describe("tag filter", () => {
  it("parses multiple tags with or without a hash", () => {
    expect(parseTagFilter("#小説, GA文庫, #小説")).toEqual(["#小説", "#ga文庫"]);
  });

  it("matches any configured tag", () => {
    expect(matchesTagFilter(["#日常", "#GA文庫"], "#小説, ga文庫")).toBe(true);
    expect(matchesTagFilter(["#日常"], "#小説, ga文庫")).toBe(false);
  });

  it("does not match an empty filter when filtering is enabled", () => {
    expect(matchesTagFilter(null, "")).toBe(false);
    expect(matchesTagFilter([], "  ,、\n")).toBe(false);
  });

  it("shows every note when filtering is disabled", () => {
    expect(matchesTagFilter(null, "#小説", false)).toBe(true);
    expect(matchesTagFilter([], "#小説", false)).toBe(true);
  });

  it("hides the status bar when tags are unavailable", () => {
    expect(matchesTagFilter(null, "#小説")).toBe(false);
  });
});
