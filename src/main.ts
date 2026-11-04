import { Notice, Plugin, TFile, normalizePath } from 'obsidian';
import { NotTodayModal } from './view/NotTodayModal';
import { appendSection, DEFAULT_SECTION } from './log';
import { dailyFolderFor, DEFAULTS, migrateSettings, NotTodaySettingTab, Settings } from './settings';
import { stripNoteChrome } from './data/notas';

const ymd = (d: Date): string =>
	`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export default class NotTodayPlugin extends Plugin {
	settings: Settings = structuredClone(DEFAULTS);

	async onload(): Promise<void> {
		this.settings = migrateSettings(await this.loadData());
		this.addRibbonIcon('shield', 'Not today', () => void this.openPanic());
		this.addCommand({
			id: 'open',
			name: 'Open the panic button',
			callback: () => void this.openPanic(),
		});
		this.addSettingTab(new NotTodaySettingTab(this.app, this));
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}

	private async dailyFile(day: Date): Promise<TFile | null> {
		const folder = await dailyFolderFor(this.app, this.settings.dailyFolder, day);
		return this.app.vault.getFileByPath(normalizePath(`${folder}/${ymd(day)}.md`));
	}

	private async openPanic(): Promise<void> {
		const encouragement = await this.encouragementText();
		new NotTodayModal(this.app, this, encouragement).open();
	}

	async readNote(path: string): Promise<string | null> {
		const file = this.app.vault.getFileByPath(normalizePath(path));
		return file ? this.app.vault.cachedRead(file) : null;
	}

	/** The encouragement card shown during every fight; empty when no note is set. */
	private async encouragementText(): Promise<string> {
		const path = this.settings.encouragementNote.trim();
		if (!path) return '';
		const text = await this.readNote(path);
		return text ? stripNoteChrome(text) : '';
	}

	/** Writes the line to today's daily note; warns (no throw) when the daily does not exist. */
	async logLine(line: string): Promise<boolean> {
		const file = await this.dailyFile(new Date());
		if (!file) {
			new Notice("Today's daily note does not exist yet. Open the day first, then try again.");
			return false;
		}
		await this.app.vault.process(file, (cur) => appendSection(cur, line, this.settings.section || DEFAULT_SECTION));
		return true;
	}
}
