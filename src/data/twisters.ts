/** From easiest to hardest. The first ones warm the mouth up; the last ones need the whole mouth. */
export const TWISTERS: string[] = [
	'Toy boat. Toy boat. Toy boat.',
	'Red lorry, yellow lorry, red lorry, yellow lorry.',
	'She sells seashells by the seashore.',
	'Unique New York, unique New York.',
	'Irish wristwatch, Irish wristwatch.',
	'Six slippery snails slid slowly seaward.',
	'Peter Piper picked a peck of pickled peppers.',
	'Betty Botter bought some butter, but the butter was bitter.',
	'How much wood would a woodchuck chuck if a woodchuck could chuck wood?',
	'Fuzzy Wuzzy was a bear, Fuzzy Wuzzy had no hair.',
	'Three thin thieves thought a thousand thoughts.',
	'A proper copper coffee pot.',
	'The sixth sick sheikh\'s sixth sheep\'s sick.',
	'Brisk brave brigadiers brandished broad bright blades.',
	'Nine nice night nurses nursing nicely.',
	'Fresh French fried fly fritters.',
	'Knife and a fork, bottle and a cork, that is the way you spell New York.',
	'I slit the sheet, the sheet I slit, and on the slitted sheet I sit.',
	'Imagine an imaginary menagerie manager imagining managing an imaginary menagerie.',
	'Pad kid poured the curd pulled cod.',
];

/** Shuffled deck (Fisher-Yates): everything shows up before anything repeats. */
export function shuffleDeck<T = string>(list: T[] = TWISTERS as unknown as T[], rnd: () => number = Math.random): T[] {
	const deck = [...list];
	for (let i = deck.length - 1; i > 0; i--) {
		const j = Math.floor(rnd() * (i + 1));
		[deck[i], deck[j]] = [deck[j]!, deck[i]!];
	}
	return deck;
}
