/**
 * What to do when bored, with no hobby, no company and no game: just your body,
 * your house and your hands. Everything is active, with a clear start, and fits
 * in five minutes. Hunger, thirst and tiredness often dress up as boredom.
 */

export interface Atividade {
	titulo: string;
	como: string;
}

export function atividades(): Atividade[] {
	return [
		// Body
		{ titulo: '20 push-ups', como: 'Any way you can, even on your knees. If you still have breath, do another set.' },
		{ titulo: '50 jumping jacks', como: 'Without stopping, counting out loud. The heart speeds up and the mood changes.' },
		{ titulo: 'Squats until tired', como: 'Slow down, fast up. Count how many you did and try to beat it tomorrow.' },
		{ titulo: 'Plank', como: 'Hold as long as you can, watching the clock. Write the time down.' },
		{ titulo: 'Stretch the whole body', como: 'From the neck to the feet, 20 seconds per part, breathing deep.' },
		{ titulo: 'Wash your face with cold water', como: 'Face and neck under cold water for 30 seconds. Or take a quick cold shower.' },
		{ titulo: 'Drink a glass of water and eat something', como: 'Hunger and thirst sometimes dress up as boredom.' },
		{ titulo: 'Lie down with no screen for 10 minutes', como: 'Phone in another room. If it is real tiredness, sleep: it is not solved with stimulus.' },

		// Place
		{ titulo: 'Step outside for 10 minutes', como: 'No destination. Walk to the corner and back, looking at what is around you.' },
		{ titulo: 'Go somewhere with people', como: 'A bakery, a square, a market. You do not need to talk to anyone, just be near people.' },
		{ titulo: 'Change rooms', como: 'Take what you were doing to another part of the house. The trigger usually lives in the place.' },

		// Hands and house
		{ titulo: 'Tidy one surface', como: 'A table, a drawer or the bed. Just one, until it looks nice.' },
		{ titulo: 'Wash the dishes', como: 'All of them that are in the sink. Water, busy hands, one thing finished.' },
		{ titulo: 'Draw what is in front of you', como: 'Paper and pen, 5 minutes, no erasing. It does not need to be good.' },

		// Mouth and mind
		{ titulo: 'Practice tongue twisters', como: 'Slow, exaggerating the mouth, and record yourself. It is the Tongue twisters option.' },
		{ titulo: 'Narrate what you are doing', como: 'Out loud, like a narrator, describe the room and what you will do next.' },
		{ titulo: 'One 5-minute task', como: 'The smallest thing you are postponing today. Sometimes boredom is a task running away.' },
		{ titulo: 'Write what you are feeling', como: 'Five lines, unedited. Putting it into words already takes strength away from the feeling.' },
		{ titulo: 'Learn a new word', como: 'Open a dictionary on any page, pick one word and use it in three sentences out loud.' },
		{ titulo: 'Read one page out loud', como: 'Any book, standing up, slowly, articulating every word. At the end, answer in one sentence: what did it ask of you?' },
	];
}

/** Lines of the user's note: "- Title :: how to do it". Everything else is ignored. */
export function atividadesDaNota(texto: string): Atividade[] {
	return texto.split('\n')
		.map((l) => /^\s*[-*]\s+(.+?)\s*$/.exec(l)?.[1] ?? '')
		.filter((item) => item.includes('::'))
		.map((item) => {
			const [titulo, ...resto] = item.split('::');
			return { titulo: titulo!.trim(), como: resto.join('::').trim() };
		})
		.filter((a) => a.titulo && a.como);
}

/** Draws an activity, never repeating the previous one. */
export function sortear(lista: Atividade[], anterior?: string, rnd: () => number = Math.random): Atividade {
	const pool = lista.length > 1 ? lista.filter((a) => a.titulo !== anterior) : lista;
	return pool[Math.floor(rnd() * pool.length)] ?? lista[0]!;
}
