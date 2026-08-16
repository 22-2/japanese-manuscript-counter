export type CounterEngine = "manuscript" | "line-layout";
export type PageDisplay = "manuscript" | "decimal";
export type PresetId = "manuscript-20x20" | "ga-bunko-42x34";

export interface ManuscriptPreset {
  id: PresetId;
  name: string;
  statusLabel: string;
  engine: CounterEngine;
  charactersPerLine: number;
  linesPerPage: number;
  forceLineBreaks: boolean;
  countBlankLines: boolean;
  pageUnit: "枚" | "頁";
  pageDisplay: PageDisplay;
  pageRange?: {
    min: number;
    max: number;
  };
}

export const MANUSCRIPT_PRESET: ManuscriptPreset = {
  id: "manuscript-20x20",
  name: "原稿用紙 20×20",
  statusLabel: "原稿用紙 20×20",
  engine: "manuscript",
  charactersPerLine: 20,
  linesPerPage: 20,
  forceLineBreaks: false,
  countBlankLines: true,
  pageUnit: "枚",
  pageDisplay: "manuscript",
};

export const GA_BUNKO_PRESET: ManuscriptPreset = {
  id: "ga-bunko-42x34",
  name: "GA文庫 42×34",
  statusLabel: "GA 42×34",
  engine: "line-layout",
  charactersPerLine: 42,
  linesPerPage: 34,
  forceLineBreaks: true,
  countBlankLines: true,
  pageUnit: "頁",
  pageDisplay: "decimal",
  pageRange: {
    min: 80,
    max: 130,
  },
};

export const PRESETS: readonly ManuscriptPreset[] = [MANUSCRIPT_PRESET, GA_BUNKO_PRESET];

export const DEFAULT_PRESET_ID: PresetId = MANUSCRIPT_PRESET.id;

export function getPreset(id: string | undefined): ManuscriptPreset {
  return PRESETS.find((preset) => preset.id === id) ?? MANUSCRIPT_PRESET;
}
