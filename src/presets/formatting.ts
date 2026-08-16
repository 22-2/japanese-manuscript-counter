import type { CountResult } from "src/counter/types";
import type { ManuscriptPreset } from "src/presets/presets";

export function formatPageCount(result: CountResult, preset: ManuscriptPreset): string {
  if (preset.pageDisplay === "decimal") {
    return `${result.pageCount.toFixed(1)}${preset.pageUnit}（${preset.statusLabel}）`;
  }

  if (result.fullPages === 0) return `${result.remainingLines}行`;
  if (result.remainingLines === 0) return `${result.fullPages}枚`;
  return `${result.fullPages}枚と${result.remainingLines}行`;
}

export function formatResultLabel(result: CountResult, preset: ManuscriptPreset): string {
  if (preset.pageDisplay === "decimal") {
    return formatPageCount(result, preset);
  }

  return `${result.characters}文字 (${formatPageCount(result, preset)})`;
}

export function isWithinPageRange(result: CountResult, preset: ManuscriptPreset): boolean {
  if (!preset.pageRange) return true;

  return result.pageCount >= preset.pageRange.min && result.pageCount <= preset.pageRange.max;
}

export function formatCompliance(result: CountResult, preset: ManuscriptPreset): string {
  if (!preset.pageRange) return "";

  return isWithinPageRange(result, preset) ? "・規定内" : "・⚠ 規定外";
}

export function formatStatusText(
  fullResult: CountResult,
  selectionResult: CountResult | null,
  preset: ManuscriptPreset,
): string {
  const fullLabel = formatResultLabel(fullResult, preset);

  if (selectionResult) {
    return `選択: ${formatResultLabel(selectionResult, preset)} | 全体: ${fullLabel}${formatCompliance(fullResult, preset)}`;
  }

  return `${fullLabel}${formatCompliance(fullResult, preset)}`;
}
