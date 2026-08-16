import { Plugin, PluginSettingTab } from "obsidian";
import type { App, SettingDefinitionItem } from "obsidian";
import { PRESETS } from "../presets/presets";
import { DEFAULT_SETTINGS } from "./settings";
import type { PluginSettings } from "./settings";

export interface SettingsPlugin {
  settings: PluginSettings;
  onSettingsChanged(): void;
}

export class JapaneseManuscriptCounterSettingTab extends PluginSettingTab {
  private readonly plugin: SettingsPlugin;

  constructor(app: App, plugin: SettingsPlugin) {
    super(app, plugin as unknown as Plugin);
    this.plugin = plugin;
  }

  async setControlValue(key: string, value: unknown): Promise<void> {
    await super.setControlValue(key, value);
    this.plugin.onSettingsChanged();
  }

  getSettingDefinitions(): SettingDefinitionItem[] {
    return [
      {
        name: "プリセット",
        desc: "文章の折り返しとページ換算に使用するルールを選択します。",
        control: {
          type: "dropdown",
          key: "presetId",
          defaultValue: DEFAULT_SETTINGS.presetId,
          options: Object.fromEntries(PRESETS.map((preset) => [preset.id, preset.name])),
        },
      },
      {
        type: "group",
        heading: "表示設定",
        items: [
          {
            name: "ステータスバーに表示",
            desc: "カウント結果をステータスバーに表示します。",
            control: {
              type: "toggle",
              key: "showStatusBar",
              defaultValue: DEFAULT_SETTINGS.showStatusBar,
            },
          },
          {
            name: "対象タグ",
            desc: "カンマ区切りで複数指定できます。空欄ならすべてのノートで表示します。",
            control: {
              type: "text",
              key: "statusBarTags",
              defaultValue: DEFAULT_SETTINGS.statusBarTags,
              placeholder: "#小説, #GA文庫",
            },
          },
          {
            name: "選択範囲のカウントを表示",
            desc: "テキスト選択時に選択範囲の結果を表示します。",
            control: {
              type: "toggle",
              key: "showSelectionCount",
              defaultValue: DEFAULT_SETTINGS.showSelectionCount,
            },
          },
          {
            name: "詳細なツールチップを表示",
            desc: "ステータスバーに詳細なカウント情報を表示します。",
            control: {
              type: "toggle",
              key: "showTooltip",
              defaultValue: DEFAULT_SETTINGS.showTooltip,
            },
          },
        ],
      },
      {
        type: "group",
        heading: "カウント設定",
        items: [
          {
            name: "Markdown記法を除外",
            desc: "見出し、装飾、リンクなどを文字数に含めません。",
            control: {
              type: "toggle",
              key: "removeMarkdownSyntax",
              defaultValue: DEFAULT_SETTINGS.removeMarkdownSyntax,
            },
          },
        ],
      },
    ];
  }
}
