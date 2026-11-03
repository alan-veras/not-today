export const SECAO = '## Domínio';
const REGISTRO_RE = /^## Registro do Vault\b/;
const FENCE_RE = /^[ \t]*(```|~~~)/;

export function hhmm(d: Date): string {
	return `${String(d.getHours()).padStart(2, '0')}h${String(d.getMinutes()).padStart(2, '0')}`;
}

/** Honest duration for log lines: a fight cut short never logs the planned time. */
export function duracao(seg: number): string {
	if (seg < 60) return 'less than a minute';
	const m = Math.round(seg / 60);
	return m === 1 ? '1 minute' : `${m} minutes`;
}

export type Onda = 'resisted' | 'gavein';

export function linhaLuta(when: Date, vice: string, seg: number, resultado: Onda): string {
	const n = vice.toLowerCase();
	return resultado === 'resisted'
		? `- ${hhmm(when)}: Fought the urge to ${n}. Surfed it for ${duracao(seg)}. The wave passed.`
		: `- ${hhmm(when)}: Fought the urge to ${n}. Gave in after ${duracao(seg)}. No guilt: I start again now.`;
}

export function linhaUnha(when: Date, gatilho: string): string {
	const g = gatilho.trim() ? ` The trigger was ${gatilho.trim()}.` : '';
	return `- ${hhmm(when)}: Wanted to bite my nails.${g} Closed my fists for 1 minute.`;
}

export function linhaTwisters(when: Date, seg: number, quantos: number): string {
	return `- ${hhmm(when)}: Practiced tongue twisters for ${duracao(seg)}: ${quantos} twisters out loud.`;
}

export function linhaTedio(when: Date, atividade: string, seg: number): string {
	return `- ${hhmm(when)}: Felt bored and, instead of the screen, did this for ${duracao(seg)}: ${atividade.charAt(0).toLowerCase()}${atividade.slice(1)}.`;
}

function escapeRe(s: string): string {
	return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** First index of a heading line, ignoring what lives inside fenced code blocks. */
function buscarLinha(lines: string[], re: RegExp, desde: number): number {
	let fence = false;
	for (let i = desde; i < lines.length; i++) {
		if (FENCE_RE.test(lines[i]!)) { fence = !fence; continue; }
		if (!fence && re.test(lines[i]!)) return i;
	}
	return -1;
}

/**
 * Appends the line to the section (created if missing), before the Registro heading when present.
 * Tolerates trailing spaces on headings and ignores headings inside code blocks.
 */
export function appendDominio(md: string, line: string, section: string = SECAO): string {
	const lines = md.split('\n');
	const secRe = new RegExp(`^${escapeRe(section)}[ \\t]*$`);
	const secIdx = buscarLinha(lines, secRe, 0);

	if (secIdx < 0) {
		const regIdx = buscarLinha(lines, REGISTRO_RE, 0);
		if (regIdx >= 0) {
			const prev = regIdx > 0 ? lines[regIdx - 1]!.trim() : '';
			const bloco = prev === '' ? [section, '', line, ''] : ['', section, '', line, ''];
			lines.splice(regIdx, 0, ...bloco);
		} else return `${md.replace(/\s*$/, '')}\n\n${section}\n\n${line}\n`;
		return lines.join('\n');
	}

	let fence = false;
	let end = lines.length;
	for (let i = secIdx + 1; i < lines.length; i++) {
		if (FENCE_RE.test(lines[i]!)) { fence = !fence; continue; }
		if (!fence && /^#{1,6} /.test(lines[i]!)) { end = i; break; }
	}
	let ins = end;
	while (ins > secIdx + 1 && lines[ins - 1]!.trim() === '') ins--;
	if (ins === secIdx + 1 && (lines.length === end || lines[secIdx + 1]!.trim() === '')) {
		lines.splice(ins, 0, '', line);
	} else {
		lines.splice(ins, 0, line);
	}
	return lines.join('\n');
}
