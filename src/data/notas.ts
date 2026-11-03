/** Helpers to read user content from vault notes. */

/** Bullet lines ("- item" or "* item") of a note; the rest (title, prose) is ignored. */
export function itensDaNota(texto: string): string[] {
	return texto.split('\n')
		.map((l) => /^\s*[-*]\s+(.+?)\s*$/.exec(l)?.[1])
		.filter((x): x is string => !!x);
}

/** Strips frontmatter and the first H1, so a note can be shown raw in a card. */
export function limpaNota(texto: string): string {
	let t = texto.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '');
	t = t.replace(/^#\s+[^\n]*\n/, '');
	return t.trim();
}

/** Uses the note's list when it has items; otherwise falls back to the built-in. */
export function comReserva<T>(daNota: T[], reserva: T[]): T[] {
	return daNota.length ? daNota : reserva;
}
