import { App, PluginSettingTab, SettingDefinition, SettingDefinitionItem, SettingGroup, normalizePath } from 'obsidian';
import { EMPTY_SELECTION, Vice, ViceSelection, VICES } from './data/vices';
import type NotTodayPlugin from './main';

export interface Settings {
	/** Daily notes folder; `{{YYYY}}` expands to the year. Empty = follow the core Daily notes plugin. */
	dailyFolder: string;
	/** Heading of the section where the log lines are written. */
	section: string;
	/** Note with one tongue twister per bullet. Empty = built-in list. */
	twistersNote: string;
	/** Note with boredom activities, one per bullet, "- Title :: how to do it". Empty = built-in list. */
	activitiesNote: string;
	/** Note shown as a card during the fight (a verse, a sentence, whatever keeps you steady). */
	encouragementNote: string;
	fundingUrl: string;
	vices: ViceSelection;
}

export const DEFAULTS: Settings = {
	dailyFolder: '',
	section: '## Not Today',
	twistersNote: '',
	activitiesNote: '',
	encouragementNote: '',
	fundingUrl: '',
	vices: EMPTY_SELECTION,
};

/** Accepts pre-0.2 settings (`secao`, `escolhas.selecionados`) and maps them onto the current shape. */
export function migrateSettings(raw: unknown): Settings {
	const settings: Settings = structuredClone(DEFAULTS);
	if (!raw || typeof raw !== 'object') return settings;
	const r = raw as Record<string, unknown>;
	for (const key of ['dailyFolder', 'twistersNote', 'activitiesNote', 'encouragementNote', 'fundingUrl'] as const) {
		if (typeof r[key] === 'string') settings[key] = r[key] as string;
	}
	if (typeof r.section === 'string' && r.section) settings.section = r.section;
	else if (typeof r.secao === 'string' && r.secao) settings.section = r.secao;
	const v = (r.vices ?? r.escolhas) as Record<string, unknown> | undefined;
	if (v && typeof v === 'object') {
		const selected = v.selected ?? v.selecionados;
		settings.vices = {
			selected: Array.isArray(selected) ? selected.filter((x): x is string => typeof x === 'string') : [],
			custom: Array.isArray(v.custom)
				? (v.custom as Vice[]).filter((c) => !!c && typeof c.id === 'string' && typeof c.name === 'string')
				: [],
			overrides: (v.overrides && typeof v.overrides === 'object' ? v.overrides : {}) as ViceSelection['overrides'],
		};
	}
	return settings;
}

/** Daily folder: the configured template ({{YYYY}} expands), else the core Daily notes folder, else "Daily Notes". */
export async function dailyFolderFor(app: App, template: string, day: Date): Promise<string> {
	if (template.trim()) return normalizePath(template.replace(/\{\{YYYY\}\}/g, String(day.getFullYear())));
	try {
		const raw = await app.vault.adapter.read(`${app.vault.configDir}/daily-notes.json`);
		const folder = (JSON.parse(raw) as { folder?: string }).folder;
		if (folder) return normalizePath(folder);
	} catch { /* core default below */ }
	return normalizePath('Daily Notes');
}

export class NotTodaySettingTab extends PluginSettingTab {
	constructor(app: App, private readonly plugin: NotTodayPlugin) {
		super(app, plugin);
	}

	/** The whole tab, declarative: Obsidian renders it and feeds search from the same definitions. */
	getSettingDefinitions(): SettingDefinitionItem[] {
		return [
			{ type: 'group', heading: 'The fight', items: [
				{ name: 'The fight', render: (_setting, group) => { this.intro(group); } },
				...VICES.flatMap((vice) => this.viceRows(vice)),
				...this.plugin.settings.vices.custom.map((vice) => this.customRow(vice)),
				this.addCustomRow(),
				{ name: 'Support this plugin', render: (setting) => {
					setting.setName('Support this plugin').setDesc('If this plugin helped you fight, a coffee keeps it alive.');
					if (this.plugin.settings.fundingUrl) {
						setting.addButton((b) => b.setButtonText('Buy me a coffee').setCta().onClick(() => window.open(this.plugin.settings.fundingUrl)));
					}
				} },
			] },
			{ type: 'group', heading: 'Your content', items: [
				this.textRow('Tongue twisters note', 'One twister per bullet. Empty uses the built-in list.', 'twistersNote', 'path/to/note.md'),
				this.textRow('Boredom activities note', 'One per bullet: title on the left, how on the right, separated by two colons.', 'activitiesNote', 'path/to/note.md'),
				this.textRow('Encouragement note', 'Shown during every fight: a verse, a sentence, whatever keeps you steady.', 'encouragementNote', 'path/to/note.md'),
			] },
			{ type: 'group', heading: 'Daily note', items: [
				this.textRow('Daily notes folder', 'Empty follows the core Daily notes plugin. Supports {{YYYY}}.', 'dailyFolder', 'Journal/Daily Notes'),
				this.textRow('Section heading', 'Where the lines are written in the daily note.', 'section', '## Not Today'),
			] },
		];
	}

	private intro(group: SettingGroup): void {
		group.listEl.createEl('p', {
			text: 'Mark the vices you are fighting. One tap on the panic button starts the fight: surf the urge, do the countermeasure, and the outcome goes to your daily note.',
			cls: 'setting-item-description',
		});
	}

	private viceRows(vice: Vice): SettingDefinition[] {
		const isSelected = (): boolean => this.plugin.settings.vices.selected.includes(vice.id);
		return [
			{ name: vice.name, desc: vice.counter, render: (setting) => {
				setting.addToggle((t) => t.setValue(isSelected()).onChange(async (val) => {
					const selected = this.plugin.settings.vices.selected;
					this.plugin.settings.vices.selected = val ? [...selected, vice.id] : selected.filter((id) => id !== vice.id);
					await this.plugin.saveSettings();
					this.update();
				}));
			} },
			{ name: `${vice.name}: minutes`, desc: 'How long the urge surf lasts.', visible: isSelected, render: (setting) => {
				setting.addText((t) => {
					t.inputEl.type = 'number';
					t.inputEl.min = '1';
					t.setValue(String(this.plugin.settings.vices.overrides[vice.id]?.minutes ?? vice.minutes));
					t.onChange(async (val) => {
						this.plugin.settings.vices.overrides[vice.id] = {
							...this.plugin.settings.vices.overrides[vice.id],
							minutes: Math.max(1, Number(val) || 1),
						};
						await this.plugin.saveSettings();
					});
				});
			} },
			{ name: `${vice.name}: countermeasure`, desc: 'Your own words, in place of the built-in one.', visible: isSelected, render: (setting) => {
				setting.addTextArea((t) => {
					t.inputEl.rows = 2;
					t.setPlaceholder(vice.counter);
					t.setValue(this.plugin.settings.vices.overrides[vice.id]?.counter ?? '');
					t.onChange(async (val) => {
						this.plugin.settings.vices.overrides[vice.id] = {
							...this.plugin.settings.vices.overrides[vice.id],
							counter: val.trim(),
						};
						await this.plugin.saveSettings();
					});
				});
			} },
		];
	}

	private customRow(vice: Vice): SettingDefinition {
		return { name: vice.name || 'Custom vice', desc: `${vice.counter} (${vice.minutes} min)`, render: (setting) => {
			setting.addButton((b) => b.setIcon('trash').setTooltip('Remove').onClick(async () => {
				this.plugin.settings.vices.custom = this.plugin.settings.vices.custom.filter((c) => c.id !== vice.id);
				await this.plugin.saveSettings();
				this.update();
			}));
		} };
	}

	private addCustomRow(): SettingDefinition {
		return { name: 'Add a custom vice', desc: 'Anything the library does not cover, with your own countermeasure.', render: (setting) => {
			setting.addButton((b) => b.setButtonText('Add').onClick(async () => {
				this.plugin.settings.vices.custom.push({
					id: `custom-${Date.now()}`,
					name: 'New vice',
					counter: 'Describe what you do instead.',
					minutes: 5,
					icon: 'shield',
				});
				await this.plugin.saveSettings();
				this.update();
			}));
		} };
	}

	private textRow(name: string, desc: string, key: 'dailyFolder' | 'section' | 'twistersNote' | 'activitiesNote' | 'encouragementNote', placeholder: string): SettingDefinition {
		return { name, desc, render: (setting) => {
			setting.addText((t) => {
				t.setPlaceholder(placeholder);
				t.setValue(this.plugin.settings[key]);
				t.onChange(async (val) => {
					this.plugin.settings[key] = val.trim();
					await this.plugin.saveSettings();
				});
			});
		} };
	}
}
