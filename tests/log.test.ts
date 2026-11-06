import { describe, expect, it } from 'vitest';
import { appendSection, DEFAULT_SECTION, durationLabel, boredomLine, fightLine, nailsLine, twistersLine } from '../src/log';
import { shuffleDeck, TWISTERS } from '../src/data/twisters';
import { bulletsFromNote, stripNoteChrome, withFallback } from '../src/data/notas';

const when = new Date(2026, 10, 2, 9, 5);

describe('appendSection', () => {
	it('creates the section before the Registro heading', () => {
		const out = appendSection('## Oração\n\nx\n\n## Registro do Vault\n\ny\n', '- a');
		expect(out).toBe('## Oração\n\nx\n\n## Not Today\n\n- a\n\n## Registro do Vault\n\ny\n');
	});
	it('creates the section at the end without Registro', () => {
		expect(appendSection('## Oração\n\nx\n', '- a')).toBe('## Oração\n\nx\n\n## Not Today\n\n- a\n');
	});
	it('appends inside an existing section, touching nothing else', () => {
		const out = appendSection('## Not Today\n\n- a\n\n## Outra\n\nz\n', '- b');
		expect(out).toBe('## Not Today\n\n- a\n- b\n\n## Outra\n\nz\n');
	});
	it('tolerates trailing spaces and ignores headings inside code blocks', () => {
		const note = '# Day\n\n```md\n## Registro do Vault\n```\n\ntext\n\n## Registro do Vault \n\n- y\n';
		const out = appendSection(note, '- a');
		expect(out).toContain('```md\n## Registro do Vault\n```');
		expect(out).toContain('- a\n\n## Registro do Vault \n');
	});
	it('writes into a custom section', () => {
		const out = appendSection('## Luta\n\n## Fim\n', '- a', '## Luta');
		expect(out).toBe('## Luta\n\n- a\n\n## Fim\n');
	});
	it('exposes the default section constant', () => {
		expect(DEFAULT_SECTION).toBe('## Not Today');
	});
});

describe('honest durations', () => {
	it('never rounds a short fight up to the planned time', () => {
		expect(durationLabel(30)).toBe('less than a minute');
		expect(durationLabel(60)).toBe('1 minute');
		expect(durationLabel(119)).toBe('2 minutes');
		expect(durationLabel(300)).toBe('5 minutes');
	});
	it('logs the real time, resisted or not', () => {
		expect(fightLine(when, 'Social media', 600, 'resisted')).toBe('- 09h05: Fought the urge to social media. Surfed it for 10 minutes. The wave passed.');
		expect(fightLine(when, 'Social media', 45, 'gavein')).toBe('- 09h05: Fought the urge to social media. Gave in after less than a minute. No guilt: I start again now.');
	});
});

describe('lines', () => {
	it('uses natural language, no emoji', () => {
		expect(nailsLine(when, 'boredom at the computer')).toContain('The trigger was boredom at the computer.');
		expect(nailsLine(when, '')).not.toContain('trigger');
		expect(twistersLine(when, 300, 6)).toBe('- 09h05: Practiced tongue twisters for 5 minutes: 6 twisters out loud.');
		expect(boredomLine(when, '20 push-ups', 300)).toBe('- 09h05: Felt bored and, instead of the screen, did this for 5 minutes: 20 push-ups.');
	});
});

describe('shuffleDeck', () => {
	it('brings every tongue twister, without repeating', () => {
		const deck = shuffleDeck();
		expect(deck).toHaveLength(TWISTERS.length);
		expect(new Set(deck).size).toBe(TWISTERS.length);
		expect(TWISTERS.length).toBeGreaterThanOrEqual(15);
	});
});

describe('note helpers', () => {
	it('reads bullet lines', () => {
		expect(bulletsFromNote('text\n- A\n* B\n')).toEqual(['A', 'B']);
	});
	it('strips frontmatter, the first heading and the authorship callout', () => {
		expect(stripNoteChrome('---\ntags: x\n---\n# Title\n\nbody\n')).toBe('body');
		const note = '---\ntags: x\n---\n# Title\n\n> [!info] Nota gerada por IA\n> content\n\nthe verse.\n';
		expect(stripNoteChrome(note)).toBe('the verse.');
	});
	it('falls back when the note list is empty', () => {
		expect(withFallback([], ['b'])).toEqual(['b']);
		expect(withFallback(['a'], ['b'])).toEqual(['a']);
	});
});
