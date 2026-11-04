import { describe, expect, it } from 'vitest';
import { EMPTY_SELECTION, VICES, activeVices } from '../src/data/vices';

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
		const text = VICES.map((v) => `${v.name} ${v.counter}`).join(' ').toLowerCase();
		expect(text).toContain('nail');
		expect(text).not.toMatch(/hymn|jesus|bibl|versículo|scripture/);
	});
	it('activates only the selected, honoring overrides, customs last', () => {
		const active = activeVices({
			selected: ['nail-biting', 'gaming'],
			custom: [{ id: 'c1', name: 'Ice cream', counter: 'Drink water first.', minutes: 5, icon: 'shield' }],
			overrides: { gaming: { minutes: 7 } },
		});
		expect(active.map((v) => v.id)).toEqual(['nail-biting', 'gaming', 'c1']);
		expect(active.find((v) => v.id === 'gaming')!.minutes).toBe(7);
	});
	it('drops empty customs; an empty checklist activates nothing', () => {
		expect(activeVices(EMPTY_SELECTION)).toEqual([]);
		const selection = { ...EMPTY_SELECTION, custom: [{ id: 'x', name: '', counter: 'y', minutes: 5, icon: 'i' }] };
		expect(activeVices(selection)).toEqual([]);
	});
});
