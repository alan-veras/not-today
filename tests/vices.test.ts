import { describe, expect, it } from 'vitest';
import { ESCOLHAS_VAZIAS, VICES, vicesAtivos } from '../src/data/vices';

describe('vice library', () => {
	it('is valid: unique ids, real countermeasures, positive minutes', () => {
		const ids = VICES.map((v) => v.id);
		expect(new Set(ids).size).toBe(ids.length);
		for (const v of VICES) {
			expect(v.counter.trim()).not.toBe('');
			expect(v.minutes).toBeGreaterThanOrEqual(1);
		}
	});
	it('covers the classic fights, with no faith content in the code', () => {
		const texto = VICES.map((v) => `${v.name} ${v.counter}`).join(' ').toLowerCase();
		expect(texto).toContain('nail');
		expect(texto).not.toMatch(/hymn|jesus|bibl|versículo|scripture/);
	});
	it('activates only the selected, honoring overrides, customs last', () => {
		const ativos = vicesAtivos({
			selecionados: ['nail-biting', 'gaming'],
			custom: [{ id: 'c1', name: 'Ice cream', counter: 'Drink water first.', minutes: 5, icon: 'shield' }],
			overrides: { gaming: { minutes: 7 } },
		});
		expect(ativos.map((v) => v.id)).toEqual(['nail-biting', 'gaming', 'c1']);
		expect(ativos.find((v) => v.id === 'gaming')!.minutes).toBe(7);
	});
	it('drops empty customs; an empty checklist activates nothing', () => {
		expect(vicesAtivos(ESCOLHAS_VAZIAS)).toEqual([]);
		const e = { ...ESCOLHAS_VAZIAS, custom: [{ id: 'x', name: '', counter: 'y', minutes: 5, icon: 'i' }] };
		expect(vicesAtivos(e)).toEqual([]);
	});
});
