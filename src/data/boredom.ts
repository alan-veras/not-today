/**
 * What to do when bored, with no hobby, no company and no game: just your body,
 * your house and your hands. Everything is active, with a clear start, and fits
 * in five minutes. Hunger, thirst and tiredness often dress up as boredom.
 */

export interface Activity {
	title: string;
	how: string;
}

export function builtinActivities(): Activity[] {
	return [
		// Body
		{ title: '20 push-ups', how: 'Any way you can, even on your knees. If you still have breath, do another set.' },
		{ title: '50 jumping jacks', how: 'Without stopping, counting out loud. The heart speeds up and the mood changes.' },
		{ title: 'Squats until tired', how: 'Slow down, fast up. Count how many you did and try to beat it tomorrow.' },
		{ title: 'Plank', how: 'Hold as long as you can, watching the clock. Write the time down.' },
		{ title: 'Stretch the whole body', how: 'From the neck to the feet, 20 seconds per part, breathing deep.' },
		{ title: 'Wash your face with cold water', how: 'Face and neck under cold water for 30 seconds. Or take a quick cold shower.' },
		{ title: 'Drink a glass of water and eat something', how: 'Hunger and thirst sometimes dress up as boredom.' },
		{ title: 'Lie down with no screen for 10 minutes', how: 'Phone in another room. If it is real tiredness, sleep: it is not solved with stimulus.' },

		// Place
		{ title: 'Step outside for 10 minutes', how: 'No destination. Walk to the corner and back, looking at what is around you.' },
		{ title: 'Go somewhere with people', how: 'A bakery, a square, a market. You do not need to talk to anyone, just be near people.' },
		{ title: 'Change rooms', how: 'Take what you were doing to another part of the house. The trigger usually lives in the place.' },

		// Hands and house
		{ title: 'Tidy one surface', how: 'A table, a drawer or the bed. Just one, until it looks nice.' },
		{ title: 'Wash the dishes', how: 'All of them that are in the sink. Water, busy hands, one thing finished.' },
		{ title: 'Draw what is in front of you', how: 'Paper and pen, 5 minutes, no erasing. It does not need to be good.' },

		// Mouth and mind
		{ title: 'Narrate what you are doing', how: 'Out loud, like a narrator, describe the room and what you will do next.' },
		{ title: 'One 5-minute task', how: 'The smallest thing you are postponing today. Sometimes boredom is a task running away.' },
		{ title: 'Write what you are feeling', how: 'Five lines, unedited. Putting it into words already takes strength away from the feeling.' },
		{ title: 'Learn a new word', how: 'Open a dictionary on any page, pick one word and use it in three sentences out loud.' },
		{ title: 'Read one page out loud', how: 'Any book, standing up, slowly, articulating every word. At the end, answer in one sentence: what did it ask of you?' },
	];
}

/** Lines of the user's note: "- Title :: how to do it". Everything else is ignored. */
export function activitiesFromNote(text: string): Activity[] {
	return text.split('\n')
		.map((l) => /^\s*[-*]\s+(.+?)\s*$/.exec(l)?.[1] ?? '')
		.filter((item) => item.includes('::'))
		.map((item) => {
			const [title, ...rest] = item.split('::');
			return { title: title!.trim(), how: rest.join('::').trim() };
		})
		.filter((a) => a.title && a.how);
}

/** Draws an activity, never repeating the previous one. */
export function drawOne(list: Activity[], previous?: string, rnd: () => number = Math.random): Activity {
	const pool = list.length > 1 ? list.filter((a) => a.title !== previous) : list;
	return pool[Math.floor(rnd() * pool.length)] ?? list[0]!;
}
