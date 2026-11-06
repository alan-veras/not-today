export const DEFAULT_SECTION = '## Not Today';
const REGISTRO_RE = /^## Registro do Vault\b/;
const FENCE_RE = /^[ \t]*(```|~~~)/;

export function hhmm(d: Date): string {
	return `${String(d.getHours()).padStart(2, '0')}h${String(d.getMinutes()).padStart(2, '0')}`;
}

/** Honest duration for log lines: a fight cut short never logs the planned time. */
export function durationLabel(seconds: number): string {
	if (seconds < 60) return 'less than a minute';
	const m = Math.round(seconds / 60);
	return m === 1 ? '1 minute' : `${m} minutes`;
}

export type Outcome = 'resisted' | 'gavein';

export function fightLine(when: Date, vice: string, seconds: number, outcome: Outcome): string {
	const name = vice.toLowerCase();
	return outcome === 'resisted'
		? `- ${hhmm(when)}: Fought the urge to ${name}. Surfed it for ${durationLabel(seconds)}. The wave passed.`
		: `- ${hhmm(when)}: Fought the urge to ${name}. Gave in after ${durationLabel(seconds)}. No guilt: I start again now.`;
}

export function nailsLine(when: Date, trigger: string): string {
	const t = trigger.trim() ? ` The trigger was ${trigger.trim()}.` : '';
	return `- ${hhmm(when)}: Wanted to bite my nails.${t} Closed my fists for 1 minute.`;
}

export function twistersLine(when: Date, seconds: number, count: number): string {
	return `- ${hhmm(when)}: Practiced tongue twisters for ${durationLabel(seconds)}: ${count} twisters out loud.`;
}

export function boredomLine(when: Date, activity: string, seconds: number): string {
	const a = `${activity.charAt(0).toLowerCase()}${activity.slice(1)}`;
	return `- ${hhmm(when)}: Felt bored and, instead of the screen, did this for ${durationLabel(seconds)}: ${a}.`;
}

function escapeRegExp(s: string): string {
	return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** First index of a heading line, ignoring what lives inside fenced code blocks. */
function findHeadingLine(lines: string[], re: RegExp, from: number): number {
	let fence = false;
	for (let i = from; i < lines.length; i++) {
		if (FENCE_RE.test(lines[i]!)) { fence = !fence; continue; }
		if (!fence && re.test(lines[i]!)) return i;
	}
	return -1;
}

/**
 * Appends the line to the daily section (created if missing), before the Registro
 * heading when present. Tolerates trailing spaces on headings and ignores headings
 * inside code blocks.
 */
export function appendSection(md: string, line: string, section: string = DEFAULT_SECTION): string {
	const lines = md.split('\n');
	const sectionRe = new RegExp(`^${escapeRegExp(section)}[ \\t]*$`);
	const sectionIdx = findHeadingLine(lines, sectionRe, 0);

	if (sectionIdx < 0) {
		const registroIdx = findHeadingLine(lines, REGISTRO_RE, 0);
		if (registroIdx >= 0) {
			const prev = registroIdx > 0 ? lines[registroIdx - 1]!.trim() : '';
			const block = prev === '' ? [section, '', line, ''] : ['', section, '', line, ''];
			lines.splice(registroIdx, 0, ...block);
		} else return `${md.replace(/\s*$/, '')}\n\n${section}\n\n${line}\n`;
		return lines.join('\n');
	}

	let fence = false;
	let end = lines.length;
	for (let i = sectionIdx + 1; i < lines.length; i++) {
		if (FENCE_RE.test(lines[i]!)) { fence = !fence; continue; }
		if (!fence && /^#{1,6} /.test(lines[i]!)) { end = i; break; }
	}
	let insert = end;
	while (insert > sectionIdx + 1 && lines[insert - 1]!.trim() === '') insert--;
	if (insert === sectionIdx + 1 && (lines.length === end || lines[sectionIdx + 1]!.trim() === '')) {
		lines.splice(insert, 0, '', line);
	} else {
		lines.splice(insert, 0, line);
	}
	return lines.join('\n');
}
