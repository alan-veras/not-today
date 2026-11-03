import { describe, expect, it } from 'vitest';
import { atividades, atividadesDaNota, sortear } from '../src/data/boredom';

describe('boredom', () => {
	it('ships a built-in list with no faith content', () => {
		const lista = atividades();
		expect(lista.length).toBeGreaterThanOrEqual(15);
		const texto = lista.map((a) => `${a.titulo} ${a.como}`).join(' ').toLowerCase();
		expect(texto).not.toMatch(/provérbios|proverbs|hino|hymn|versículo|scripture|god|deus/);
	});
	it('parses the user note, one activity per bullet', () => {
		expect(atividadesDaNota('# Minhas\n\n- 20 flexões :: do jeito que conseguir\n\nparágrafo solto\n'))
			.toEqual([{ titulo: '20 flexões', como: 'do jeito que conseguir' }]);
	});
	it('never repeats the previous one', () => {
		const lista = atividades();
		for (let i = 0; i < 100; i++) expect(sortear(lista, '20 push-ups').titulo).not.toBe('20 push-ups');
	});
	it('draws from the whole list', () => {
		const lista = atividades();
		expect(sortear(lista, undefined, () => 0)).toBe(lista[0]);
		expect(sortear(lista, undefined, () => 0.999)).toBe(lista[lista.length - 1]);
	});
});
