import { describe, expect, it } from 'vitest';
import { activitiesFromNote, builtinActivities, drawOne } from '../src/data/boredom';

describe('boredom', () => {
	it('ships a built-in list with no faith content', () => {
		const list = builtinActivities();
		expect(list.length).toBeGreaterThanOrEqual(15);
		const text = list.map((a) => `${a.title} ${a.how}`).join(' ').toLowerCase();
		expect(text).not.toMatch(/provérbios|proverbs|hino|hymn|versículo|scripture|god|deus/);
	});
	it('parses the user note, one activity per bullet', () => {
		expect(activitiesFromNote('# Minhas\n\n- 20 flexões :: do jeito que conseguir\n\nparágrafo solto\n'))
			.toEqual([{ title: '20 flexões', how: 'do jeito que conseguir' }]);
	});
	it('never repeats the previous one', () => {
		const list = builtinActivities();
		for (let i = 0; i < 100; i++) expect(drawOne(list, '20 push-ups').title).not.toBe('20 push-ups');
	});
	it('draws from the whole list', () => {
		const list = builtinActivities();
		expect(drawOne(list, undefined, () => 0)).toBe(list[0]);
		expect(drawOne(list, undefined, () => 0.999)).toBe(list[list.length - 1]);
	});
});
