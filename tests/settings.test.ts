import { describe, expect, it } from 'vitest';
import type { App } from 'obsidian';
import { dailyFolderFor, DEFAULTS, migrateSettings } from '../src/settings';

describe('migrateSettings', () => {
	it('keeps defaults when nothing is stored', () => {
		expect(migrateSettings(null)).toEqual(DEFAULTS);
		expect(migrateSettings(undefined)).toEqual(DEFAULTS);
	});
	it('maps the pre-0.2 keys (secao, escolhas) onto the current shape', () => {
		const old = {
			dailyFolder: '1_bujo/{{YYYY}}/Daily Log',
			secao: '## Domínio',
			encouragementNote: 'Encouragement.md',
			escolhas: { selecionados: ['nail-biting'], custom: [{ id: 't', name: 'Tentação', counter: 'Sing.', minutes: 10, icon: 'waves' }], overrides: {} },
		};
		const s = migrateSettings(old);
		expect(s.section).toBe('## Domínio');
		expect(s.dailyFolder).toBe('1_bujo/{{YYYY}}/Daily Log');
		expect(s.vices.selected).toEqual(['nail-biting']);
		expect(s.vices.custom[0]!.name).toBe('Tentação');
	});
	it('passes the current shape through untouched', () => {
		const current = { ...DEFAULTS, section: '## Fights', vices: { selected: ['gaming'], custom: [], overrides: { gaming: { minutes: 7 } } } };
		expect(migrateSettings(current)).toEqual(current);
	});
	it('drops junk instead of trusting the file', () => {
		const s = migrateSettings({ secao: 42, escolhas: { selecionados: 'nope', custom: [null, { name: 'x' }] } });
		expect(s.section).toBe(DEFAULTS.section);
		expect(s.vices.selected).toEqual([]);
		expect(s.vices.custom).toEqual([]);
	});
});

describe('dailyFolderFor', () => {
	const day = new Date(2026, 10, 4);
	const appReading = (content: string): App =>
		({ vault: { adapter: { read: async () => content } } }) as unknown as App;

	it('expands {{YYYY}} in the configured template', async () => {
		const folder = await dailyFolderFor(appReading('{}'), '1_bujo/{{YYYY}}/Daily Log', day);
		expect(folder).toBe('1_bujo/2026/Daily Log');
	});
	it('follows the core Daily notes config when no template is set', async () => {
		const folder = await dailyFolderFor(appReading('{"folder":"Journal/Daily"}'), '', day);
		expect(folder).toBe('Journal/Daily');
	});
	it('falls back to Daily Notes when the config is missing or broken', async () => {
		const broken = { vault: { adapter: { read: async () => { throw new Error('missing'); } } } } as unknown as App;
		expect(await dailyFolderFor(broken, '', day)).toBe('Daily Notes');
		expect(await dailyFolderFor(appReading('not json'), '', day)).toBe('Daily Notes');
	});
});
