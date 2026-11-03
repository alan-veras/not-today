/**
 * The built-in vice library. The countermeasures follow what behavioral research
 * keeps repeating: the urge rises, peaks and falls (urge surfing), the fix is an
 * incompatible competing response (habit reversal), and putting friction plus
 * delay between the feeling and the act does most of the work.
 */

export interface Vice {
	/** Stable id, survives renames and settings edits. */
	id: string;
	/** Short name shown in the menu and written to the daily log. */
	name: string;
	/** What to do instead, shown during the fight. */
	counter: string;
	/** Urge-surf length in minutes. */
	minutes: number;
	/** Menu icon (Lucide). */
	icon: string;
	/** 'fists' runs the nail-biting competing-response flow instead of the surf. */
	kind?: 'fists';
}

export const VICES: Vice[] = [
	{ id: 'social-media', name: 'Social media', counter: 'Put the phone in another room and surf the wave. The first minutes are the worst; it fades on its own.', minutes: 10, icon: 'smartphone' },
	{ id: 'nail-biting', name: 'Nail biting', counter: 'Notice what you were feeling and close your fists beside your body, without hurting yourself.', minutes: 1, icon: 'hand', kind: 'fists' },
	{ id: 'junk-food', name: 'Junk food', counter: 'Drink a full glass of water first, then stay the wave. Cravings peak and drop within minutes.', minutes: 10, icon: 'cookie' },
	{ id: 'porn', name: 'Porn', counter: 'Stand up and leave the room. Surf the wave: it peaks and falls. Keep your hands and voice busy.', minutes: 10, icon: 'ban' },
	{ id: 'smoking', name: 'Smoking or vaping', counter: 'Delay: the craving peaks in minutes. Drink water slowly, breathe deep, keep your hands busy.', minutes: 5, icon: 'cigarette' },
	{ id: 'alcohol', name: 'Alcohol', counter: 'Name out loud what you are feeling, then leave the place where the drink is. The wave falls.', minutes: 10, icon: 'wine' },
	{ id: 'gaming', name: 'Gaming', counter: 'Set the game down and walk once around the house before deciding. Decide after, not during.', minutes: 5, icon: 'gamepad-2' },
	{ id: 'impulse-buying', name: 'Impulse buying', counter: 'Leave the item in the cart and surf the wave. If the urge survives these minutes, decide then.', minutes: 10, icon: 'shopping-cart' },
	{ id: 'procrastination', name: 'Procrastination', counter: 'Do the smallest first step of the task for these minutes. Starting is what kills the urge.', minutes: 5, icon: 'timer' },
	{ id: 'binge', name: 'Binge watching', counter: 'Pause the episode. Stretch, drink water, look out of a window for a while, then decide.', minutes: 5, icon: 'tv' },
	{ id: 'anger', name: 'Anger', counter: 'Unclench your jaw, drop your shoulders and breathe out slowly before you speak. Count the wave down.', minutes: 2, icon: 'flame' },
	{ id: 'self-criticism', name: 'Self-criticism', counter: 'Write the harsh thought down, then answer it out loud the way you would answer a friend.', minutes: 3, icon: 'heart-crack' },
];

export interface Escolhas {
	/** Ids of built-in vices the user is fighting. */
	selecionados: string[];
	/** Vices the user created. */
	custom: Vice[];
	/** Edits the user made to built-in vices. */
	overrides: Record<string, Partial<Pick<Vice, 'name' | 'counter' | 'minutes'>>>;
}

export const ESCOLHAS_VAZIAS: Escolhas = { selecionados: [], custom: [], overrides: {} };

/** The active fight list, in a stable order: built-ins first (library order), then customs. */
export function vicesAtivos(e: Escolhas): Vice[] {
	const built = VICES
		.filter((v) => e.selecionados.includes(v.id))
		.map((v) => ({ ...v, ...(e.overrides[v.id] ?? {}) }));
	return [...built, ...e.custom.filter((v) => v.minutes > 0 && v.name.trim() && v.counter.trim())];
}

export function vicePorId(e: Escolhas, id: string): Vice | undefined {
	return vicesAtivos(e).find((v) => v.id === id);
}
