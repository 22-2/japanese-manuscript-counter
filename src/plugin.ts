import { MarkdownView, Modal, Plugin } from "obsidian";
import type { Editor } from "obsidian";
import { createCounter } from "./counter/factory";
import type { Counter, CountResult } from "./counter/types";
import { formatPageCount, formatStatusText, isWithinPageRange } from "./presets/formatting";
import { getPreset } from "./presets/presets";
import type { ManuscriptPreset } from "./presets/presets";
import { JapaneseManuscriptCounterSettingTab } from "./settings/settings-tab";
import { DEFAULT_SETTINGS, normalizeSettings } from "./settings/settings";
import type { PluginSettings } from "./settings/settings";

const WARNING_CLASS = "plugin-japanese-manuscript-counter-warning";

export default class JapaneseManuscriptCounterPlugin extends Plugin {
  declare settings: PluginSettings;
  counter!: Counter;
  statusBarItem!: HTMLElement;

  async onload(): Promise<void> {
    this.settings = normalizeSettings(await this.loadData());
    this.counter = this.createCounter();
    this.statusBarItem = this.addStatusBarItem();
    this.statusBarItem.textContent = "";

    this.addSettingTab(new JapaneseManuscriptCounterSettingTab(this.app, this));
    this.registerCommands();
    this.registerEvents();
    this.updateCurrentCount();
  }

  onSettingsChanged(): void {
    this.counter = this.createCounter();
    this.updateCurrentCount();
  }

  private createCounter(): Counter {
    return createCounter(getPreset(this.settings.presetId), this.settings);
  }

  private getActivePreset(): ManuscriptPreset {
    return getPreset(this.settings.presetId);
  }

  private registerCommands(): void {
    this.addCommand({
      id: "show-count-details",
      name: "カウント詳細を表示（デバッグ）",
      editorCallback: (editor) => this.showCountDetails(editor),
    });
  }

  private registerEvents(): void {
    this.registerEvent(
      this.app.workspace.on("editor-change", (editor) => this.updateCount(editor)),
    );
    this.registerEvent(
      this.app.workspace.on("active-leaf-change", () => this.updateCurrentCount()),
    );
    this.registerInterval(window.setInterval(() => this.updateCurrentCount(), 3000));
  }

  private showCountDetails(editor: Editor): void {
    const result = this.counter.count(editor.getValue(), true);
    const modal = new Modal(this.app);

    modal.titleEl.textContent = "原稿用紙カウント詳細";
    modal.contentEl.classList.add("manuscript-counter-debug-modal");
    modal.contentEl.textContent = this.buildCountDetails(result);
    modal.open();
  }

  private buildCountDetails(result: CountResult): string {
    const preset = this.getActivePreset();
    let content = [
      "=== カウント詳細 ===",
      "",
      `プリセット: ${preset.name}`,
      `総文字数: ${result.characters}`,
      `総行数: ${result.totalLines}`,
      `総マス数: ${result.totalCells}`,
      `段落数: ${result.paragraphs}`,
      `空行数: ${result.emptyParagraphs}`,
      `ページ: ${formatPageCount(result, preset)}`,
      "",
      "=== 各行の詳細 ===",
      "",
    ].join("\n");

    for (const paragraph of result.debugInfo) {
      content += `【段落 ${paragraph.paragraphNum}】（${paragraph.lineCount}行）\n`;
      for (const line of paragraph.lines) {
        content += `行${line.lineNum} (${line.charCount}文字): ${line.text}\n`;
        content += `  → ${line.reason}\n`;
      }
      content += "\n";
    }

    return content;
  }

  private updateCurrentCount(): void {
    if (!this.settings.showStatusBar) {
      this.statusBarItem.style.display = "none";
      return;
    }

    this.statusBarItem.style.display = "";
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (view) {
      this.updateCount(view.editor);
    } else {
      this.statusBarItem.textContent = "";
      this.statusBarItem.classList.remove(WARNING_CLASS);
    }
  }

  private updateCount(editor: Editor): void {
    if (!this.settings.showStatusBar) return;

    const preset = this.getActivePreset();
    const fullResult = this.counter.count(editor.getValue());
    const selectedText = editor.getSelection();
    const selectionResult =
      this.settings.showSelectionCount && selectedText.length > 0
        ? this.counter.count(selectedText)
        : null;

    const displayText = formatStatusText(fullResult, selectionResult, preset);
    const tooltipText = selectionResult
      ? `[選択範囲]\n${this.formatResultDetails(selectionResult, preset)}\n\n[全体]\n${this.formatResultDetails(fullResult, preset)}`
      : this.formatResultDetails(fullResult, preset);

    this.statusBarItem.textContent = displayText;
    this.updateTooltip(tooltipText);
    this.updateWarningState(fullResult, preset);
  }

  private formatResultDetails(result: CountResult, preset: ManuscriptPreset): string {
    const details = [
      `プリセット: ${preset.name}`,
      `文字数: ${result.characters}`,
      `マス数: ${result.totalCells}`,
      `段落数: ${result.paragraphs}`,
      `空行数: ${result.emptyParagraphs}`,
      `使用行数: ${result.totalLines}`,
      `ページ: ${formatPageCount(result, preset)}`,
    ];

    if (preset.pageRange) {
      details.push(`判定: ${isWithinPageRange(result, preset) ? "規定内" : "⚠ 規定外"}`);
    }

    return details.join("\n");
  }

  private updateTooltip(text: string): void {
    if (this.settings.showTooltip) {
      this.statusBarItem.setAttribute("title", text);
    } else {
      this.statusBarItem.removeAttribute("title");
    }
  }

  private updateWarningState(result: CountResult, preset: ManuscriptPreset): void {
    this.statusBarItem.classList.toggle(
      WARNING_CLASS,
      Boolean(preset.pageRange && !isWithinPageRange(result, preset)),
    );
  }
}
