import { DEFAULT_PRESET_ID, getPreset } from "../presets/presets";
import type { CounterOptions } from "../counter/types";
import type { PresetId } from "../presets/presets";

export interface PluginSettings extends CounterOptions {
  presetId: PresetId;
  showStatusBar: boolean;
  enableStatusBarTagFilter: boolean;
  statusBarTags: string;
  showSelectionCount: boolean;
  showTooltip: boolean;
}

export const DEFAULT_SETTINGS: PluginSettings = {
  presetId: DEFAULT_PRESET_ID,
  showStatusBar: true,
  enableStatusBarTagFilter: false,
  statusBarTags: "",
  showSelectionCount: true,
  showTooltip: true,
  removeMarkdownSyntax: true,
};

export function normalizeSettings(data: unknown): PluginSettings {
  const saved = data && typeof data === "object" ? (data as Partial<PluginSettings>) : {};

  return {
    presetId: getPreset(typeof saved.presetId === "string" ? saved.presetId : undefined).id,
    showStatusBar:
      typeof saved.showStatusBar === "boolean"
        ? saved.showStatusBar
        : DEFAULT_SETTINGS.showStatusBar,
    enableStatusBarTagFilter:
      typeof saved.enableStatusBarTagFilter === "boolean"
        ? saved.enableStatusBarTagFilter
        : DEFAULT_SETTINGS.enableStatusBarTagFilter,
    statusBarTags:
      typeof saved.statusBarTags === "string"
        ? saved.statusBarTags
        : DEFAULT_SETTINGS.statusBarTags,
    showSelectionCount:
      typeof saved.showSelectionCount === "boolean"
        ? saved.showSelectionCount
        : DEFAULT_SETTINGS.showSelectionCount,
    showTooltip:
      typeof saved.showTooltip === "boolean" ? saved.showTooltip : DEFAULT_SETTINGS.showTooltip,
    removeMarkdownSyntax:
      typeof saved.removeMarkdownSyntax === "boolean"
        ? saved.removeMarkdownSyntax
        : DEFAULT_SETTINGS.removeMarkdownSyntax,
  };
}
