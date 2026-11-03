import { describe, expect, it } from 'vitest';
import { appendDominio, duracao, linhaLuta, linhaTedio, linhaTwisters, linhaUnha } from '../src/log';
import { baralho, TWISTERS } from '../src/data/twisters';
import { comReserva, itensDaNota, limpaNota } from '../src/data/notas';

const when = new Date(2026, 10, 2, 9, 5);

describe('appendDominio', () => {
	it('creates the section before the Registro heading', () => {
		const out = appendDominio('## Oração\n\nx\n\n## Registro do Vault\n\ny\n', '- a');
		expect(out).toBe('## Oração\n\nx\n\n## Domínio\n\n- a\n\n## Registro do Vault\n\ny\n');
	});
	it('creates the section at the end without Registro', () => {
		expect(appendDominio('## Oração\n\nx\n', '- a')).toBe('## Oração\n\nx\n\n## Domínio\n\n- a\n');
	});
	it('appends inside an existing section, touching nothing else', () => {
		const out = appendDominio('## Domínio\n\n- a\n\n## Outra\n\nz\n', '- b');
		expect(out).toBe('## Domínio\n\n- a\n- b\n\n## Outra\n\nz\n');
	});
	it('tolerates trailing spaces and ignores headings inside code blocks', () => {
		const nota = '# Dia\n\n```md\n## Registro do Vault\n```\n\ntexto\n\n## Registro do Vault \n\n- y\n';
		const out = appendDominio(nota, '- a');
		expect(out).toContain('```md\n## Registro do Vault\n```');
		expect(out).toContain('- a\n\n## Registro do Vault \n');
	});
	it('writes into a custom section', () => {
		const out = appendDominio('## Luta\n\n## Fim\n', '- a', '## Luta');
		expect(out).toBe('## Luta\n\n- a\n\n## Fim\n');
	});
});

describe('honest durations', () => {
	it('never rounds a short fight up to the planned time', () => {
		expect(duracao(30)).toBe('less than a minute');
		expect(duracao(60)).toBe('1 minute');
		expect(duracao(119)).toBe('2 minutes');
		expect(duracao(300)).toBe('5 minutes');
	});
	it('logs the real time, resisted or not', () => {
		expect(linhaLuta(when, 'Social media', 600, 'resisted')).toBe('- 09h05: Fought the urge to social media. Surfed it for 10 minutes. The wave passed.');
		expect(linhaLuta(when, 'Social media', 45, 'gavein')).toBe('- 09h05: Fought the urge to social media. Gave in after less than a minute. No guilt: I start again now.');
	});
});

describe('lines', () => {
	it('uses natural language, no emoji', () => {
		expect(linhaUnha(when, 'boredom at the computer')).toContain('The trigger was boredom at the computer.');
		expect(linhaUnha(when, '')).not.toContain('trigger');
		expect(linhaTwisters(when, 300, 6)).toBe('- 09h05: Practiced tongue twisters for 5 minutes: 6 twisters out loud.');
		expect(linhaTedio(when, '20 push-ups', 300)).toBe('- 09h05: Felt bored and, instead of the screen, did this for 5 minutes: 20 push-ups.');
	});
});

describe('baralho', () => {
	it('brings every tongue twister, without repeating', () => {
		const b = baralho();
		expect(b).toHaveLength(TWISTERS.length);
		expect(new Set(b).size).toBe(TWISTERS.length);
		expect(TWISTERS.length).toBeGreaterThanOrEqual(15);
	});
});

describe('notas', () => {
	it('reads bullet lines', () => {
		expect(itensDaNota('texto\n- A\n* B\n')).toEqual(['A', 'B']);
	});
	it('strips frontmatter and the first heading', () => {
		expect(limpaNota('---\ntags: x\n---\n# Titulo\n\nbody\n')).toBe('body');
	});
	it('falls back when the note list is empty', () => {
		expect(comReserva([], [1, 2])).toEqual([1, 2]);
		expect(comReserva(['a'], ['b'])).toEqual(['a']);
	});
});
