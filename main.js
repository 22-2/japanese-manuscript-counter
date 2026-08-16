"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => JapaneseManuscriptCounterPlugin
});
module.exports = __toCommonJS(main_exports);

// src/plugin.ts
var import_obsidian2 = require("obsidian");

// src/counter/markdown.ts
function removeMarkdownSyntax(text) {
  let cleaned = text;
  cleaned = cleaned.replace(/^#{1,6}\s+/gm, "");
  cleaned = cleaned.replace(/(\*\*|__)(.*?)\1/g, "$2");
  cleaned = cleaned.replace(/(\*|_)(.*?)\1/g, "$2");
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1");
  cleaned = cleaned.replace(/!\[([^\]]*)\]\([^\)]+\)/g, "");
  cleaned = cleaned.replace(/```[\s\S]*?```/g, "");
  cleaned = cleaned.replace(/`([^`]+)`/g, "$1");
  cleaned = cleaned.replace(/^[\*\-\+]\s+/gm, "");
  cleaned = cleaned.replace(/^\d+\.\s+/gm, "");
  cleaned = cleaned.replace(/^>\s+/gm, "");
  cleaned = cleaned.replace(/^(\*{3,}|-{3,}|_{3,})$/gm, "");
  cleaned = cleaned.replace(/<[^>]+>/g, "");
  return cleaned;
}

// src/counter/utils.ts
function getCharWidth(char) {
  const code = char.charCodeAt(0);
  return code >= 32 && code <= 126 || code >= 65377 && code <= 65439 ? 0.5 : 1;
}
function createEmptyResult() {
  return {
    totalCells: 0,
    characters: 0,
    totalLines: 0,
    paragraphs: 0,
    emptyParagraphs: 0,
    pageCount: 0,
    fullPages: 0,
    remainingLines: 0,
    debugInfo: []
  };
}
function createCountResult(totalCells, characters, totalLines, paragraphs, emptyParagraphs, linesPerPage, debugInfo) {
  return {
    totalCells,
    characters,
    totalLines,
    paragraphs,
    emptyParagraphs,
    pageCount: totalLines / linesPerPage,
    fullPages: Math.floor(totalLines / linesPerPage),
    remainingLines: totalLines % linesPerPage,
    debugInfo
  };
}
function addDebugLine(debugInfo, debugMode, lineNum, text, charCount, reason) {
  if (!debugMode) return;
  debugInfo.push({ lineNum, text, charCount, reason });
}
function normalizeLineEndings(text) {
  return text.replace(/\r\n?/g, "\n");
}

// src/counter/legacy-manuscript-counter.ts
var CELLS_PER_LINE = 20;
var LINES_PER_PAGE = 20;
var GYOTO_KINSOKU = "\u3001\u3002\uFF09\u300D\u300F\u3011";
var GYOMATSU_KINSOKU = "\uFF08\u300C\u300E\u3010";
var LegacyManuscriptCounter = class {
  constructor(options) {
    this.options = options;
  }
  options;
  count(text, debugMode = false) {
    if (!text || text.trim() === "") return createEmptyResult();
    const cleanText = this.options.removeMarkdownSyntax ? removeMarkdownSyntax(text) : text;
    const paragraphs = cleanText.split(/\n\n+/);
    let totalCells = 0;
    let totalChars = 0;
    let totalLines = 0;
    let paragraphCount = 0;
    const allDebugInfo = [];
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
          lineCount: result.lines
        });
      }
    }
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
      allDebugInfo
    );
  }
  countParagraph(paragraph, debugMode) {
    let currentLine = 0;
    let totalChars = 0;
    let lines = 1;
    let currentLineText = "";
    const debugInfo = [];
    const chars = Array.from(paragraph);
    for (let i = 0; i < chars.length; i++) {
      const char = chars[i];
      if (char === "\n") {
        if (currentLine > 0) {
          addDebugLine(debugInfo, debugMode, lines, currentLineText, currentLine, "\u6539\u884C");
          currentLineText = "";
          lines++;
          currentLine = 0;
        } else if (debugMode) {
          addDebugLine(debugInfo, true, lines, currentLineText, 0, "\u7A7A\u6539\u884C\uFF08\u30AB\u30A6\u30F3\u30C8\u306A\u3057\uFF09");
        }
        continue;
      }
      const charWidth = getCharWidth(char);
      totalChars += charWidth === 1 ? 1 : 0.5;
      if (currentLine + charWidth === CELLS_PER_LINE) {
        if (i + 1 < chars.length && GYOTO_KINSOKU.includes(chars[i + 1])) {
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
            `20\u5B57+\u884C\u982D\u7981\u5247: ${nextChar}`
          );
          currentLineText = "";
          if (i + 1 < chars.length) {
            lines++;
            currentLine = 0;
          }
        } else {
          currentLine += charWidth;
          if (debugMode) currentLineText += char;
          addDebugLine(debugInfo, debugMode, lines, currentLineText, currentLine, "20\u6587\u5B57\u3067\u6539\u884C");
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
            `\u884C\u982D\u7981\u5247: ${char}`
          );
          currentLineText = "";
          if (i + 1 < chars.length) {
            lines++;
            currentLine = 0;
          }
        } else if (isGyomatsuKinsoku) {
          addDebugLine(debugInfo, debugMode, lines, currentLineText, currentLine, "\u884C\u672B\u7981\u5247");
          currentLineText = debugMode ? char : "";
          lines++;
          currentLine = charWidth;
        } else {
          addDebugLine(debugInfo, debugMode, lines, currentLineText, currentLine, "20\u6587\u5B57\u8D85\u904E");
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
      addDebugLine(debugInfo, true, lines, currentLineText, currentLine, "\u6700\u7D42\u884C");
    }
    return {
      cells: Math.ceil(totalChars + lines),
      characters: totalChars,
      lines,
      debugInfo: debugMode ? debugInfo : null
    };
  }
};

// src/counter/line-layout-counter.ts
var LineLayoutCounter = class {
  constructor(preset, options) {
    this.preset = preset;
    this.options = options;
  }
  preset;
  options;
  count(text, debugMode = false) {
    if (text.length === 0) return createEmptyResult();
    const cleanText = this.options.removeMarkdownSyntax ? removeMarkdownSyntax(text) : text;
    if (cleanText.length === 0) return createEmptyResult();
    const normalizedText = normalizeLineEndings(cleanText);
    const sourceLines = this.preset.forceLineBreaks ? normalizedText.split("\n") : [normalizedText.replace(/\n/g, "")];
    const debugInfo = [];
    let currentDebugLines = [];
    let currentDebugLineCount = 0;
    let paragraphCount = 0;
    let emptyLines = 0;
    let totalChars = 0;
    let totalLines = 0;
    let inParagraph = false;
    const flushDebugParagraph = () => {
      if (currentDebugLines.length === 0) return;
      debugInfo.push({
        paragraphNum: debugInfo.length + 1,
        lines: currentDebugLines,
        lineCount: currentDebugLineCount
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
          reason: wrappedLines > 1 ? `${this.preset.charactersPerLine}\u5B57\u76F8\u5F53\u3067${wrappedLines}\u884C\u306B\u6298\u308A\u8FD4\u3057` : "\u5F37\u5236\u6539\u884C"
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
      debugMode ? debugInfo : []
    );
  }
};

// src/counter/factory.ts
function createCounter(preset, options) {
  if (preset.engine === "line-layout") {
    return new LineLayoutCounter(preset, options);
  }
  return new LegacyManuscriptCounter(options);
}

// src/presets/formatting.ts
function formatPageCount(result, preset) {
  if (preset.pageDisplay === "decimal") {
    return `${result.pageCount.toFixed(1)}${preset.pageUnit}\uFF08${preset.statusLabel}\uFF09`;
  }
  if (result.fullPages === 0) return `${result.remainingLines}\u884C`;
  if (result.remainingLines === 0) return `${result.fullPages}\u679A`;
  return `${result.fullPages}\u679A\u3068${result.remainingLines}\u884C`;
}
function formatResultLabel(result, preset) {
  if (preset.pageDisplay === "decimal") {
    return formatPageCount(result, preset);
  }
  return `${result.characters}\u6587\u5B57 (${formatPageCount(result, preset)})`;
}
function isWithinPageRange(result, preset) {
  if (!preset.pageRange) return true;
  return result.pageCount >= preset.pageRange.min && result.pageCount <= preset.pageRange.max;
}
function formatCompliance(result, preset) {
  if (!preset.pageRange) return "";
  return isWithinPageRange(result, preset) ? "\u30FB\u898F\u5B9A\u5185" : "\u30FB\u26A0 \u898F\u5B9A\u5916";
}
function formatStatusText(fullResult, selectionResult, preset) {
  const fullLabel = formatResultLabel(fullResult, preset);
  if (selectionResult) {
    return `\u9078\u629E: ${formatResultLabel(selectionResult, preset)} | \u5168\u4F53: ${fullLabel}${formatCompliance(fullResult, preset)}`;
  }
  return `${fullLabel}${formatCompliance(fullResult, preset)}`;
}

// src/presets/presets.ts
var MANUSCRIPT_PRESET = {
  id: "manuscript-20x20",
  name: "\u539F\u7A3F\u7528\u7D19 20\xD720",
  statusLabel: "\u539F\u7A3F\u7528\u7D19 20\xD720",
  engine: "manuscript",
  charactersPerLine: 20,
  linesPerPage: 20,
  forceLineBreaks: false,
  countBlankLines: true,
  pageUnit: "\u679A",
  pageDisplay: "manuscript"
};
var GA_BUNKO_PRESET = {
  id: "ga-bunko-42x34",
  name: "GA\u6587\u5EAB 42\xD734",
  statusLabel: "GA 42\xD734",
  engine: "line-layout",
  charactersPerLine: 42,
  linesPerPage: 34,
  forceLineBreaks: true,
  countBlankLines: true,
  pageUnit: "\u9801",
  pageDisplay: "decimal",
  pageRange: {
    min: 80,
    max: 130
  }
};
var PRESETS = [MANUSCRIPT_PRESET, GA_BUNKO_PRESET];
var DEFAULT_PRESET_ID = MANUSCRIPT_PRESET.id;
function getPreset(id) {
  return PRESETS.find((preset) => preset.id === id) ?? MANUSCRIPT_PRESET;
}

// src/settings/settings-tab.ts
var import_obsidian = require("obsidian");

// src/settings/settings.ts
var DEFAULT_SETTINGS = {
  presetId: DEFAULT_PRESET_ID,
  showStatusBar: true,
  showSelectionCount: true,
  showTooltip: true,
  removeMarkdownSyntax: true
};
function normalizeSettings(data) {
  const saved = data && typeof data === "object" ? data : {};
  return {
    presetId: getPreset(typeof saved.presetId === "string" ? saved.presetId : void 0).id,
    showStatusBar: typeof saved.showStatusBar === "boolean" ? saved.showStatusBar : DEFAULT_SETTINGS.showStatusBar,
    showSelectionCount: typeof saved.showSelectionCount === "boolean" ? saved.showSelectionCount : DEFAULT_SETTINGS.showSelectionCount,
    showTooltip: typeof saved.showTooltip === "boolean" ? saved.showTooltip : DEFAULT_SETTINGS.showTooltip,
    removeMarkdownSyntax: typeof saved.removeMarkdownSyntax === "boolean" ? saved.removeMarkdownSyntax : DEFAULT_SETTINGS.removeMarkdownSyntax
  };
}

// src/settings/settings-tab.ts
var JapaneseManuscriptCounterSettingTab = class extends import_obsidian.PluginSettingTab {
  plugin;
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  async setControlValue(key, value) {
    await super.setControlValue(key, value);
    this.plugin.onSettingsChanged();
  }
  getSettingDefinitions() {
    return [
      {
        name: "\u30D7\u30EA\u30BB\u30C3\u30C8",
        desc: "\u6587\u7AE0\u306E\u6298\u308A\u8FD4\u3057\u3068\u30DA\u30FC\u30B8\u63DB\u7B97\u306B\u4F7F\u7528\u3059\u308B\u30EB\u30FC\u30EB\u3092\u9078\u629E\u3057\u307E\u3059\u3002",
        control: {
          type: "dropdown",
          key: "presetId",
          defaultValue: DEFAULT_SETTINGS.presetId,
          options: Object.fromEntries(PRESETS.map((preset) => [preset.id, preset.name]))
        }
      },
      {
        name: "\u8868\u793A\u8A2D\u5B9A",
        items: [
          {
            name: "\u30B9\u30C6\u30FC\u30BF\u30B9\u30D0\u30FC\u306B\u8868\u793A",
            desc: "\u30AB\u30A6\u30F3\u30C8\u7D50\u679C\u3092\u30B9\u30C6\u30FC\u30BF\u30B9\u30D0\u30FC\u306B\u8868\u793A\u3057\u307E\u3059\u3002",
            control: {
              type: "toggle",
              key: "showStatusBar",
              defaultValue: DEFAULT_SETTINGS.showStatusBar
            }
          },
          {
            name: "\u9078\u629E\u7BC4\u56F2\u306E\u30AB\u30A6\u30F3\u30C8\u3092\u8868\u793A",
            desc: "\u30C6\u30AD\u30B9\u30C8\u9078\u629E\u6642\u306B\u9078\u629E\u7BC4\u56F2\u306E\u7D50\u679C\u3092\u8868\u793A\u3057\u307E\u3059\u3002",
            control: {
              type: "toggle",
              key: "showSelectionCount",
              defaultValue: DEFAULT_SETTINGS.showSelectionCount
            }
          },
          {
            name: "\u8A73\u7D30\u306A\u30C4\u30FC\u30EB\u30C1\u30C3\u30D7\u3092\u8868\u793A",
            desc: "\u30B9\u30C6\u30FC\u30BF\u30B9\u30D0\u30FC\u306B\u8A73\u7D30\u306A\u30AB\u30A6\u30F3\u30C8\u60C5\u5831\u3092\u8868\u793A\u3057\u307E\u3059\u3002",
            control: {
              type: "toggle",
              key: "showTooltip",
              defaultValue: DEFAULT_SETTINGS.showTooltip
            }
          }
        ]
      },
      {
        name: "\u30AB\u30A6\u30F3\u30C8\u8A2D\u5B9A",
        items: [
          {
            name: "Markdown\u8A18\u6CD5\u3092\u9664\u5916",
            desc: "\u898B\u51FA\u3057\u3001\u88C5\u98FE\u3001\u30EA\u30F3\u30AF\u306A\u3069\u3092\u6587\u5B57\u6570\u306B\u542B\u3081\u307E\u305B\u3093\u3002",
            control: {
              type: "toggle",
              key: "removeMarkdownSyntax",
              defaultValue: DEFAULT_SETTINGS.removeMarkdownSyntax
            }
          }
        ]
      }
    ];
  }
};

// src/plugin.ts
var WARNING_CLASS = "plugin-japanese-manuscript-counter-warning";
var JapaneseManuscriptCounterPlugin = class extends import_obsidian2.Plugin {
  counter;
  statusBarItem;
  async onload() {
    this.settings = normalizeSettings(await this.loadData());
    this.counter = this.createCounter();
    this.statusBarItem = this.addStatusBarItem();
    this.statusBarItem.textContent = "";
    this.addSettingTab(new JapaneseManuscriptCounterSettingTab(this.app, this));
    this.registerCommands();
    this.registerEvents();
    this.updateCurrentCount();
  }
  onSettingsChanged() {
    this.counter = this.createCounter();
    this.updateCurrentCount();
  }
  createCounter() {
    return createCounter(getPreset(this.settings.presetId), this.settings);
  }
  getActivePreset() {
    return getPreset(this.settings.presetId);
  }
  registerCommands() {
    this.addCommand({
      id: "show-count-details",
      name: "\u30AB\u30A6\u30F3\u30C8\u8A73\u7D30\u3092\u8868\u793A\uFF08\u30C7\u30D0\u30C3\u30B0\uFF09",
      editorCallback: (editor) => this.showCountDetails(editor)
    });
  }
  registerEvents() {
    this.registerEvent(
      this.app.workspace.on("editor-change", (editor) => this.updateCount(editor))
    );
    this.registerEvent(
      this.app.workspace.on("active-leaf-change", () => this.updateCurrentCount())
    );
    this.registerInterval(window.setInterval(() => this.updateCurrentCount(), 300));
  }
  showCountDetails(editor) {
    const result = this.counter.count(editor.getValue(), true);
    const modal = new import_obsidian2.Modal(this.app);
    modal.titleEl.textContent = "\u539F\u7A3F\u7528\u7D19\u30AB\u30A6\u30F3\u30C8\u8A73\u7D30";
    modal.contentEl.classList.add("manuscript-counter-debug-modal");
    modal.contentEl.textContent = this.buildCountDetails(result);
    modal.open();
  }
  buildCountDetails(result) {
    const preset = this.getActivePreset();
    let content = [
      "=== \u30AB\u30A6\u30F3\u30C8\u8A73\u7D30 ===",
      "",
      `\u30D7\u30EA\u30BB\u30C3\u30C8: ${preset.name}`,
      `\u7DCF\u6587\u5B57\u6570: ${result.characters}`,
      `\u7DCF\u884C\u6570: ${result.totalLines}`,
      `\u7DCF\u30DE\u30B9\u6570: ${result.totalCells}`,
      `\u6BB5\u843D\u6570: ${result.paragraphs}`,
      `\u7A7A\u884C\u6570: ${result.emptyParagraphs}`,
      `\u30DA\u30FC\u30B8: ${formatPageCount(result, preset)}`,
      "",
      "=== \u5404\u884C\u306E\u8A73\u7D30 ===",
      ""
    ].join("\n");
    for (const paragraph of result.debugInfo) {
      content += `\u3010\u6BB5\u843D ${paragraph.paragraphNum}\u3011\uFF08${paragraph.lineCount}\u884C\uFF09
`;
      for (const line of paragraph.lines) {
        content += `\u884C${line.lineNum} (${line.charCount}\u6587\u5B57): ${line.text}
`;
        content += `  \u2192 ${line.reason}
`;
      }
      content += "\n";
    }
    return content;
  }
  updateCurrentCount() {
    if (!this.settings.showStatusBar) {
      this.statusBarItem.style.display = "none";
      return;
    }
    this.statusBarItem.style.display = "";
    const view = this.app.workspace.getActiveViewOfType(import_obsidian2.MarkdownView);
    if (view) {
      this.updateCount(view.editor);
    } else {
      this.statusBarItem.textContent = "";
      this.statusBarItem.classList.remove(WARNING_CLASS);
    }
  }
  updateCount(editor) {
    if (!this.settings.showStatusBar) return;
    const preset = this.getActivePreset();
    const fullResult = this.counter.count(editor.getValue());
    const selectedText = editor.getSelection();
    const selectionResult = this.settings.showSelectionCount && selectedText.length > 0 ? this.counter.count(selectedText) : null;
    const displayText = formatStatusText(fullResult, selectionResult, preset);
    const tooltipText = selectionResult ? `[\u9078\u629E\u7BC4\u56F2]
${this.formatResultDetails(selectionResult, preset)}

[\u5168\u4F53]
${this.formatResultDetails(fullResult, preset)}` : this.formatResultDetails(fullResult, preset);
    this.statusBarItem.textContent = displayText;
    this.updateTooltip(tooltipText);
    this.updateWarningState(fullResult, preset);
  }
  formatResultDetails(result, preset) {
    const details = [
      `\u30D7\u30EA\u30BB\u30C3\u30C8: ${preset.name}`,
      `\u6587\u5B57\u6570: ${result.characters}`,
      `\u30DE\u30B9\u6570: ${result.totalCells}`,
      `\u6BB5\u843D\u6570: ${result.paragraphs}`,
      `\u7A7A\u884C\u6570: ${result.emptyParagraphs}`,
      `\u4F7F\u7528\u884C\u6570: ${result.totalLines}`,
      `\u30DA\u30FC\u30B8: ${formatPageCount(result, preset)}`
    ];
    if (preset.pageRange) {
      details.push(`\u5224\u5B9A: ${isWithinPageRange(result, preset) ? "\u898F\u5B9A\u5185" : "\u26A0 \u898F\u5B9A\u5916"}`);
    }
    return details.join("\n");
  }
  updateTooltip(text) {
    if (this.settings.showTooltip) {
      this.statusBarItem.setAttribute("title", text);
    } else {
      this.statusBarItem.removeAttribute("title");
    }
  }
  updateWarningState(result, preset) {
    this.statusBarItem.classList.toggle(
      WARNING_CLASS,
      Boolean(preset.pageRange && !isWithinPageRange(result, preset))
    );
  }
};
