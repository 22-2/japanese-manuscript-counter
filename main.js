'use strict';

const obsidian = require('obsidian');

const CELLS_PER_LINE = 20;
const LINES_PER_PAGE = 20;
const CELLS_PER_PAGE = CELLS_PER_LINE * LINES_PER_PAGE;

const DEFAULT_SETTINGS = {
    showStatusBar: true,
    showSelectionCount: true,
    showTooltip: true,
    removeMarkdownSyntax: true
};

class ManuscriptCounter {
    constructor(settings = DEFAULT_SETTINGS) {
        this.settings = settings;
        this.gyotoKinsoku = '\u3001\u3002\uFF09\u300D\u300F\u3011';
        this.gyomatsuKinsoku = '\uFF08\u300C\u300E\u3010';
    }

    countManuscriptCells(text, debugMode = false) {
        if (!text || text.trim() === '') return this.createEmptyResult();

        const cleanText = this.settings.removeMarkdownSyntax
            ? this.removeMarkdownSyntax(text)
            : text;
        const paragraphs = cleanText.split(/\n\n+/);
        let totalCells = 0;
        let totalChars = 0;
        let totalLines = 0;
        let paragraphCount = 0;
        const allDebugInfo = [];

        for (const paragraph of paragraphs) {
            if (paragraph.trim() === '') continue;

            paragraphCount++;
            const result = this.countParagraphCells(paragraph, debugMode);
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

        // 段落間の空白行をカウント（段落数 - 1 = 空白行の数）
        const emptyLines = Math.max(paragraphCount - 1, 0);
        totalLines += emptyLines;
        totalCells += emptyLines * CELLS_PER_LINE;

        const manuscriptPages = Math.floor(totalLines / LINES_PER_PAGE);
        const manuscriptLines = totalLines % LINES_PER_PAGE;

        return {
            totalCells,
            characters: totalChars,
            totalLines,
            paragraphs: paragraphCount,
            manuscripts: totalCells / CELLS_PER_PAGE,
            manuscriptPages,
            manuscriptLines,
            debugInfo: allDebugInfo,
            emptyParagraphs: emptyLines
        };
    }

    createEmptyResult() {
        return {
            totalCells: 0,
            characters: 0,
            totalLines: 0,
            paragraphs: 0,
            manuscripts: 0,
            manuscriptPages: 0,
            manuscriptLines: 0,
            debugInfo: [],
            emptyParagraphs: 0
        };
    }

    countParagraphCells(paragraph, debugMode = false) {
        let currentLine = 0;
        let totalChars = 0;
        let lines = 1;
        let currentLineText = '';
        const debugInfo = [];
        const chars = Array.from(paragraph);

        for (let i = 0; i < chars.length; i++) {
            const char = chars[i];

            if (char === '\n') {
                // 0文字の改行は行数にカウントしない
                if (currentLine > 0) {
                    this.addDebugLine(debugInfo, debugMode, lines, currentLineText, currentLine, '改行');
                    currentLineText = '';
                    lines++;
                    currentLine = 0;
                } else if (debugMode) {
                    // デバッグモードでは0文字の改行も記録するが、行数は増やさない
                    this.addDebugLine(debugInfo, true, lines, currentLineText, 0, '空改行（カウントなし）');
                }
                continue;
            }

            const charWidth = this.getCharWidth(char);
            totalChars += charWidth === 1 ? 1 : 0.5;

            // 現在の文字を追加すると20文字ちょうどになる場合
            if (currentLine + charWidth === CELLS_PER_LINE) {
                // 次の文字が行頭禁則文字かチェック
                if (i + 1 < chars.length && this.gyotoKinsoku.includes(chars[i + 1])) {
                    // 現在の文字と次の行頭禁則文字を両方とも現在の行に追加（21文字の行になる）
                    currentLine += charWidth;
                    if (debugMode) currentLineText += char;

                    // 次の文字（行頭禁則文字）も処理
                    i++;
                    const nextChar = chars[i];
                    const nextCharWidth = this.getCharWidth(nextChar);
                    totalChars += nextCharWidth === 1 ? 1 : 0.5;
                    currentLine += nextCharWidth;
                    if (debugMode) currentLineText += nextChar;

                    this.addDebugLine(
                        debugInfo,
                        debugMode,
                        lines,
                        currentLineText,
                        currentLine,
                        `20字+行頭禁則: ${nextChar}`
                    );
                    currentLineText = '';

                    // 次の文字があるかチェックしてから改行
                    if (i + 1 < chars.length) {
                        lines++;
                        currentLine = 0;
                    }
                } else {
                    // 通常通り現在の行に追加（20文字で改行）
                    currentLine += charWidth;
                    if (debugMode) currentLineText += char;
                    this.addDebugLine(debugInfo, debugMode, lines, currentLineText, currentLine, '20文字で改行');
                    currentLineText = '';

                    // 次の文字があるかチェックしてから改行
                    if (i + 1 < chars.length) {
                        lines++;
                        currentLine = 0;
                    }
                }
            } else if (currentLine + charWidth > CELLS_PER_LINE) {
                // 20文字を超える場合
                const isGyotoKinsoku = this.gyotoKinsoku.includes(char);
                const isGyomatsuKinsoku = this.gyomatsuKinsoku.includes(char);

                if (isGyotoKinsoku) {
                    // 行頭禁則文字は現在の行に追加してから改行（21文字の行になる）
                    currentLine += charWidth;
                    if (debugMode) currentLineText += char;
                    this.addDebugLine(debugInfo, debugMode, lines, currentLineText, currentLine, `行頭禁則: ${char}`);
                    currentLineText = '';

                    // 次の文字があるかチェックしてから改行
                    if (i + 1 < chars.length) {
                        lines++;
                        currentLine = 0;
                    }
                } else if (isGyomatsuKinsoku) {
                    // 行末禁則文字は次の行に送る
                    this.addDebugLine(debugInfo, debugMode, lines, currentLineText, currentLine, '行末禁則');
                    currentLineText = debugMode ? char : '';
                    lines++;
                    currentLine = charWidth;
                } else {
                    // 通常の文字は次の行に送る
                    this.addDebugLine(debugInfo, debugMode, lines, currentLineText, currentLine, '20文字超過');
                    currentLineText = debugMode ? char : '';
                    lines++;
                    currentLine = charWidth;
                }
            } else {
                // 20文字未満の場合は通常通り追加
                currentLine += charWidth;
                if (debugMode) currentLineText += char;
            }
        }

        // 最後の行が残っている場合のみデバッグ情報に追加
        if (debugMode && currentLineText && currentLine > 0) {
            this.addDebugLine(debugInfo, true, lines, currentLineText, currentLine, '最終行');
        }

        const totalCells = totalChars + lines;
        return {
            cells: Math.ceil(totalCells),
            characters: totalChars,
            lines,
            debugInfo: debugMode ? debugInfo : null
        };
    }

    addDebugLine(debugInfo, debugMode, lineNum, text, charCount, reason) {
        if (!debugMode) return;

        debugInfo.push({ lineNum, text, charCount, reason });
    }

    getCharWidth(char) {
        const code = char.charCodeAt(0);
        return (code >= 0x20 && code <= 0x7E) || (code >= 0xFF61 && code <= 0xFF9F)
            ? 0.5
            : 1;
    }

    removeMarkdownSyntax(text) {
        let cleaned = text;

        cleaned = cleaned.replace(/^#{1,6}\s+/gm, '');
        cleaned = cleaned.replace(/(\*\*|__)(.*?)\1/g, '$2');
        cleaned = cleaned.replace(/(\*|_)(.*?)\1/g, '$2');
        cleaned = cleaned.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
        cleaned = cleaned.replace(/!\[([^\]]*)\]\([^\)]+\)/g, '');
        cleaned = cleaned.replace(/```[\s\S]*?```/g, '');
        cleaned = cleaned.replace(/`([^`]+)`/g, '$1');
        cleaned = cleaned.replace(/^[\*\-\+]\s+/gm, '');
        cleaned = cleaned.replace(/^\d+\.\s+/gm, '');
        cleaned = cleaned.replace(/^>\s+/gm, '');
        cleaned = cleaned.replace(/^(\*{3,}|-{3,}|_{3,})$/gm, '');
        cleaned = cleaned.replace(/<[^>]+>/g, '');

        return cleaned;
    }
}

class JapaneseManuscriptCounterSettingTab extends obsidian.PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display() {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl('h2', { text: '原稿用紙カウンター' });
        containerEl.createEl('p', {
            text: 'ステータスバーの表示と文字数のカウント方法を設定できます。'
        });

        containerEl.createEl('h3', { text: '表示設定' });
        this.addToggleSetting(
            'showStatusBar',
            'ステータスバーに表示',
            '文字数と原稿用紙換算をステータスバーに表示します。'
        );
        this.addToggleSetting(
            'showSelectionCount',
            '選択範囲のカウントを表示',
            'テキストを選択したとき、選択範囲と文書全体のカウントを表示します。'
        );
        this.addToggleSetting(
            'showTooltip',
            '詳細なツールチップを表示',
            'ステータスバーにマウスカーソルを合わせたとき、行数やマス数などを表示します。'
        );

        containerEl.createEl('h3', { text: 'カウント設定' });
        this.addToggleSetting(
            'removeMarkdownSyntax',
            'Markdown記法を除外',
            '見出し、装飾、リンクなどのMarkdown記法を文字数に含めません。'
        );
    }

    addToggleSetting(key, name, description) {
        new obsidian.Setting(this.containerEl)
            .setName(name)
            .setDesc(description)
            .addToggle((toggle) => {
                toggle
                    .setValue(this.plugin.settings[key])
                    .onChange((value) => {
                        this.plugin.settings[key] = value;
                        return this.plugin.saveSettings();
                    });
            });
    }
}

class JapaneseManuscriptCounterPlugin extends obsidian.Plugin {
    async onload() {
        this.settings = {
            ...DEFAULT_SETTINGS,
            ...(await this.loadData())
        };
        this.counter = new ManuscriptCounter(this.settings);
        this.statusBarItem = this.addStatusBarItem();
        this.statusBarItem.setText('');

        this.addSettingTab(new JapaneseManuscriptCounterSettingTab(this.app, this));
        this.registerCommands();
        this.registerEvents();
        this.updateCurrentCount();
    }

    registerCommands() {
        this.addCommand({
            id: 'show-count-details',
            name: 'カウント詳細を表示（デバッグ）',
            editorCallback: (editor) => this.showCountDetails(editor)
        });
    }

    registerEvents() {
        this.registerEvent(
            this.app.workspace.on('editor-change', (editor) => this.updateCount(editor))
        );
        this.registerEvent(
            this.app.workspace.on('active-leaf-change', () => this.updateCurrentCount())
        );
        this.registerInterval(window.setInterval(() => this.updateCurrentCount(), 300));
    }

    async saveSettings() {
        await this.saveData(this.settings);
        this.updateCurrentCount();
    }

    showCountDetails(editor) {
        const result = this.counter.countManuscriptCells(editor.getValue(), true);
        const modal = new obsidian.Modal(this.app);

        modal.titleEl.setText('原稿用紙カウント詳細');
        modal.contentEl.addClass('manuscript-counter-debug-modal');
        modal.contentEl.setText(this.buildCountDetails(result));
        modal.open();
    }

    buildCountDetails(result) {
        let content = [
            '=== カウント詳細 ===',
            '',
            `総文字数: ${result.characters}`,
            `総行数: ${result.totalLines}`,
            `総マス数: ${result.totalCells}`,
            `段落数: ${result.paragraphs}`,
            `空行数: ${result.emptyParagraphs}`,
            `原稿用紙: ${this.formatManuscriptCount(result)}`,
            '',
            '=== 各行の詳細 ===',
            ''
        ].join('\n');

        for (const paragraph of result.debugInfo ?? []) {
            content += `【段落 ${paragraph.paragraphNum}】（${paragraph.lineCount}行）\n`;
            for (const line of paragraph.lines) {
                content += `行${line.lineNum} (${line.charCount}文字): ${line.text}\n`;
                content += `  → ${line.reason}\n`;
            }
            content += '\n';
        }

        return content;
    }

    updateCurrentCount() {
        if (!this.settings.showStatusBar) {
            this.statusBarItem.hide();
            return;
        }

        this.statusBarItem.show();
        const view = this.app.workspace.getActiveViewOfType(obsidian.MarkdownView);
        if (view) {
            this.updateCount(view.editor);
        } else {
            this.statusBarItem.setText('');
        }
    }

    updateCount(editor) {
        if (!this.settings.showStatusBar) return;

        const fullResult = this.counter.countManuscriptCells(editor.getValue());
        const selectedText = editor.getSelection();
        const selectionResult = this.settings.showSelectionCount && selectedText?.length > 0
            ? this.counter.countManuscriptCells(selectedText)
            : null;
        const fullManuscript = this.formatManuscriptCount(fullResult);
        const displayText = selectionResult
            ? `選択: ${selectionResult.characters}文字 (${this.formatManuscriptCount(selectionResult)}) | 全体: ${fullResult.characters}文字 (${fullManuscript})`
            : `${fullResult.characters}文字 (${fullManuscript})`;
        const tooltipText = selectionResult
            ? `[選択範囲]\n${this.formatResultDetails(selectionResult)}\n\n[全体]\n${this.formatResultDetails(fullResult)}`
            : this.formatResultDetails(fullResult);

        this.statusBarItem.setText(displayText);
        this.updateTooltip(tooltipText);
    }

    formatResultDetails(result) {
        return [
            `文字数: ${result.characters}`,
            `マス数: ${result.totalCells}`,
            `段落数: ${result.paragraphs}`,
            `行数: ${result.totalLines}`,
            `原稿用紙: ${this.formatManuscriptCount(result)}`
        ].join('\n');
    }

    updateTooltip(text) {
        if (this.settings.showTooltip) {
            this.statusBarItem.setAttr('title', text);
        } else {
            this.statusBarItem.removeAttribute('title');
        }
    }

    formatManuscriptCount(result) {
        if (result.manuscriptPages === 0) return `${result.manuscriptLines}行`;
        if (result.manuscriptLines === 0) return `${result.manuscriptPages}枚`;
        return `${result.manuscriptPages}枚と${result.manuscriptLines}行`;
    }
}

module.exports = JapaneseManuscriptCounterPlugin;
