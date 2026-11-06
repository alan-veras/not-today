/** Helpers to read user content from vault notes. */

/** Strips frontmatter, the first H1 and the authorship callout right after it, so a note can be shown raw in a card. */
export function stripNoteChrome(text: string): string {
	let lines = text.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '').split('\n');
	if (lines[0]?.startsWith('# ')) lines = lines.slice(1);
	while (lines.length && lines[0]!.trim() === '') lines.shift();
	if (lines[0]?.startsWith('>')) {
		let i = 0;
		while (i < lines.length && lines[i]!.startsWith('>')) i++;
		lines = lines.slice(i);
	}
	return lines.join('\n').trim();
}

/** Uses the note's list when it has items; otherwise falls back to the built-in. */
export function withFallback<T>(fromNote: T[], fallback: T[]): T[] {
	return fromNote.length ? fromNote : fallback;
}
