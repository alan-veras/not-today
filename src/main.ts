import { Notice, Plugin, TFile, normalizePath } from 'obsidian';
import { DominioModal } from './view/DominioModal';
import { appendDominio, SECAO } from './log';
import { DEFAULTS, DominioSettingTab, dailyFolderFor, Settings } from './settings';
import { limpaNota } from './data/notas';
import { ESCOLHAS_VAZIAS } from './data/vices';

const ymd = (d: Date): string =>
	`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export default class DominioPlugin extends Plugin {
	settings: Settings = structuredClone(DEFAULTS);

	async onload(): Promise<void> {
		this.settings = Object.assign(structuredClone(DEFAULTS), (await this.loadData()) as Partial<Settings> | null);
		this.settings.escolhas = Object.assign(structuredClone(ESCOLHAS_VAZIAS), this.settings.escolhas ?? {});
		this.addRibbonIcon('shield', 'Domínio', () => void this.abrir());
		this.addCommand({
			id: 'abrir',
			name: 'Open Domínio',
			hotkeys: [{ modifiers: ['Mod', 'Alt'], key: 'F' }],
			callback: () => void this.abrir(),
		});
		this.addSettingTab(new DominioSettingTab(this.app, this));
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}

	private dailyFile(day: Date): TFile | null {
		const folder = dailyFolderFor(this.app, this.settings.dailyFolder, day);
		return this.app.vault.getFileByPath(normalizePath(`${folder}/${ymd(day)}.md`));
	}

	private async abrir(): Promise<void> {
		const encouragem = await this.textoEncoragem();
		new DominioModal(this.app, this, encouragem).open();
	}

	async lerNota(path: string): Promise<string | null> {
		const f = this.app.vault.getFileByPath(normalizePath(path));
		return f ? this.app.vault.cachedRead(f) : null;
	}

	/** The encouragement card shown during every fight; empty when no note is set. */
	private async textoEncoragem(): Promise<string> {
		const p = this.settings.encouragementNote.trim();
		if (!p) return '';
		const txt = await this.lerNota(p);
		return txt ? limpaNota(txt) : '';
	}

	/** Writes the line to today's daily note; warns (no throw) when the daily does not exist. */
	async registrarLinha(line: string): Promise<boolean> {
		const file = this.dailyFile(new Date());
		if (!file) {
			new Notice("Today's daily note does not exist yet. Open the day first, then try again.");
			return false;
		}
		await this.app.vault.process(file, (cur) => appendDominio(cur, line, this.settings.secao || SECAO));
		return true;
	}
}
