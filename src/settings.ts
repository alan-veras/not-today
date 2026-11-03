import { App, PluginSettingTab, Setting, normalizePath } from 'obsidian';
import { ESCOLHAS_VAZIAS, Escolhas, VICES } from './data/vices';
import type DominioPlugin from './main';

export interface Settings {
	/** Daily notes folder; `{{YYYY}}` expands to the year. Empty = follow the core Daily notes plugin. */
	dailyFolder: string;
	/** Heading of the section where the log lines are written. */
	secao: string;
	/** Note with one tongue twister per bullet. Empty = built-in list. */
	twistersNote: string;
	/** Note with boredom activities, one per bullet, "- Title :: how to do it". Empty = built-in list. */
	activitiesNote: string;
	/** Note shown as a card during the fight (a verse, a sentence, whatever keeps you steady). */
	encouragementNote: string;
	fundingUrl: string;
	escolhas: Escolhas;
}

export const DEFAULTS: Settings = {
	dailyFolder: '',
	secao: '## Domínio',
	twistersNote: '',
	activitiesNote: '',
	encouragementNote: '',
	fundingUrl: '',
	escolhas: ESCOLHAS_VAZIAS,
};

export class DominioSettingTab extends PluginSettingTab {
	constructor(app: App, private readonly plugin: DominioPlugin) {
		super(app, plugin);
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl).setName('The fight').setHeading();

		this.secaoVices();
		this.secaoNotas();
		this.secaoDiario();

		const apoio = new Setting(containerEl).setName('Support this plugin').setDesc('If Domínio helped you fight, a coffee keeps it alive.');
		if (this.plugin.settings.fundingUrl) {
			apoio.addButton((b) => b.setButtonText('Buy me a coffee').setCta().onClick(() => window.open(this.plugin.settings.fundingUrl)));
		}
	}

	private secaoVices(): void {
		const { containerEl } = this;
		containerEl.createEl('p', {
			text: 'Mark the vices you are fighting. One tap on the panic button starts the fight: surf the urge, do the countermeasure, and the outcome goes to your daily note.',
			cls: 'setting-item-description',
		});

		for (const v of VICES) {
			const ligado = this.plugin.settings.escolhas.selecionados.includes(v.id);
			const linha = new Setting(containerEl)
				.setName(v.name)
				.setDesc(v.counter);
			linha.addToggle((t) => t.setValue(ligado).onChange(async (val) => {
				const sel = this.plugin.settings.escolhas.selecionados;
				this.plugin.settings.escolhas.selecionados = val ? [...sel, v.id] : sel.filter((id) => id !== v.id);
				await this.plugin.saveSettings();
				this.display();
			}));
			if (ligado) {
				new Setting(containerEl)
					.setName(`${v.name}: minutes`)
					.setDesc('How long the urge surf lasts.')
					.addText((t) => {
						t.inputEl.type = 'number';
						t.inputEl.min = '1';
						t.setValue(String(this.plugin.settings.escolhas.overrides[v.id]?.minutes ?? v.minutes));
						t.onChange(async (val) => {
							const m = Math.max(1, Number(val) || 1);
							this.plugin.settings.escolhas.overrides[v.id] = {
								...this.plugin.settings.escolhas.overrides[v.id],
								minutes: m,
							};
							await this.plugin.saveSettings();
						});
					});
				new Setting(containerEl)
					.setName(`${v.name}: countermeasure`)
					.setDesc('Your own words, in place of the built-in one.')
					.addTextArea((t) => {
						t.inputEl.rows = 2;
						t.setValue(this.plugin.settings.escolhas.overrides[v.id]?.counter ?? '');
						t.setPlaceholder(v.counter);
						t.onChange(async (val) => {
							this.plugin.settings.escolhas.overrides[v.id] = {
								...this.plugin.settings.escolhas.overrides[v.id],
								counter: val.trim(),
							};
							await this.plugin.saveSettings();
						});
					});
			}
		}

		new Setting(containerEl).setName('Custom vices').setHeading();
		this.plugin.settings.escolhas.custom.forEach((v, i) => {
			new Setting(containerEl)
				.setName(v.name || `Vice ${i + 1}`)
				.setDesc(`${v.counter} (${v.minutes} min)`)
				.addButton((b) => b.setIcon('trash').setTooltip('Remove').onClick(async () => {
					this.plugin.settings.escolhas.custom = this.plugin.settings.escolhas.custom.filter((_, j) => j !== i);
					await this.plugin.saveSettings();
					this.display();
				}));
		});
		new Setting(containerEl)
			.setName('Add a custom vice')
			.setDesc('Anything the library does not cover, with your own countermeasure.')
			.addButton((b) => b.setButtonText('Add').onClick(async () => {
				this.plugin.settings.escolhas.custom.push({
					id: `custom-${Date.now()}`,
					name: 'New vice',
					counter: 'Describe what you do instead.',
					minutes: 5,
					icon: 'shield',
				});
				await this.plugin.saveSettings();
				this.display();
			}));
	}

	private secaoNotas(): void {
		const { containerEl } = this;
		new Setting(containerEl).setName('Your content').setHeading();

		new Setting(containerEl)
			.setName('Tongue twisters note')
			.setDesc('One twister per bullet. Empty uses the built-in English list.')
			.addText((t) => this.campoNota(t, 'twistersNote'));

		new Setting(containerEl)
			.setName('Boredom activities note')
			.setDesc('One per bullet, format "- Title :: how to do it". Empty uses the built-in list.')
			.addText((t) => this.campoNota(t, 'activitiesNote'));

		new Setting(containerEl)
			.setName('Encouragement note')
			.setDesc('Shown during every fight: a verse, a sentence, whatever keeps you steady.')
			.addText((t) => this.campoNota(t, 'encouragementNote'));
	}

	private campoNota(t: import('obsidian').TextComponent, campo: keyof Settings): void {
		t.setPlaceholder('path/to/note.md');
		t.setValue(this.plugin.settings[campo] as string);
		t.onChange(async (val) => {
			(this.plugin.settings[campo] as string) = val.trim();
			await this.plugin.saveSettings();
		});
	}

	private secaoDiario(): void {
		const { containerEl } = this;
		new Setting(containerEl).setName('Daily note').setHeading();

		new Setting(containerEl)
			.setName('Daily notes folder')
			.setDesc('Empty follows the core Daily notes plugin. Supports {{YYYY}}.')
			.addText((t) => this.campoNota(t, 'dailyFolder'));

		new Setting(containerEl)
			.setName('Section heading')
			.setDesc('Where the lines are written in the daily note.')
			.addText((t) => this.campoNota(t, 'secao'));
	}
}

export function dailyFolderFor(app: App, template: string, day: Date): string {
	if (template.trim()) return normalizePath(template.replace(/\{\{YYYY\}\}/g, String(day.getFullYear())));
	const dn = (app as unknown as { internalPlugins?: { getEnabledPluginById?: (id: string) => { options?: { folder?: string } } } })
		.internalPlugins?.getEnabledPluginById?.('daily-notes');
	return normalizePath(dn?.options?.folder || 'Daily Notes');
}
