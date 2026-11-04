import { App, KeymapEventHandler, Modal, Notice, setIcon } from 'obsidian';
import type NotTodayPlugin from '../main';
import { activitiesFromNote, builtinActivities, drawOne } from '../data/boredom';
import { shuffleDeck, TWISTERS } from '../data/twisters';
import { bulletsFromNote, withFallback } from '../data/notas';
import { activeVices, Vice, VICES } from '../data/vices';
import { boredomLine, fightLine, nailsLine, twistersLine } from '../log';

const FISTS_SECONDS = 60;
const TWISTER_SWITCH_SECONDS = 20;
const TWISTERS_MINUTES = 5;
const BOREDOM_MINUTES = 5;

const fmt = (s: number): string => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

interface MenuOption { icon: string; title: string; sub: string; open: () => void }

/**
 * One window, a few screens: the panic menu, the fight (with a timer) and the end.
 * Visual follows the Lembro panel pattern: icon list, big number, muted secondary text.
 */
export class NotTodayModal extends Modal {
	private timer = 0;
	private extraTimers: number[] = [];
	private keyHandler: KeymapEventHandler | null = null;
	/** Reference instant of the running chronometer, for honest durations in the log. */
	private timerStart = 0;
	/** Guards against double clicks writing the line twice. */
	private saving = false;
	private readonly encouragement: string;

	constructor(
		app: App,
		private readonly plugin: NotTodayPlugin,
		encouragement: string,
	) {
		super(app);
		this.encouragement = encouragement;
	}

	onOpen(): void {
		this.modalEl.addClass('not-today-modal');
		if (activeVices(this.plugin.settings.vices).length === 0) this.checklist(false);
		else this.menu();
	}

	onClose(): void {
		this.teardown();
		this.contentEl.empty();
	}

	private teardown(): void {
		window.clearInterval(this.timer);
		this.extraTimers.forEach((id) => window.clearInterval(id));
		this.extraTimers = [];
		if (this.keyHandler) {
			this.scope.unregister(this.keyHandler);
			this.keyHandler = null;
		}
	}

	/** New screen: clears timers and pending writes, header with back (except on the menu). */
	private openScreen(title: string, back = true): HTMLElement {
		this.teardown();
		this.saving = false;
		this.contentEl.empty();
		this.contentEl.addClass('not-today');
		const head = this.contentEl.createDiv({ cls: 'not-today-head' });
		if (back) {
			const b = head.createEl('button', { cls: 'clickable-icon not-today-back', attr: { 'aria-label': 'Back' } });
			setIcon(b, 'arrow-left');
			b.onclick = () => this.menu();
		}
		head.createSpan({ cls: 'not-today-title', text: title });
		return this.contentEl.createDiv({ cls: 'not-today-body' });
	}

	/** First-run checklist: pick the vices you are fighting. */
	private checklist(fromMenu: boolean): void {
		const body = this.openScreen('What do you want to fight?', fromMenu);
		body.createDiv({ cls: 'not-today-lead', text: 'Tick the vices you are fighting. Each one becomes a one-tap button on the panic screen.' });
		const boxes = new Map<string, HTMLInputElement>();
		for (const vice of VICES) {
			const row = body.createDiv({ cls: 'not-today-row', attr: { tabindex: '0', role: 'checkbox' } });
			setIcon(row.createDiv({ cls: 'not-today-row-icon' }), vice.icon);
			const text = row.createDiv({ cls: 'not-today-row-t' });
			text.createDiv({ cls: 'not-today-row-title', text: vice.name });
			text.createDiv({ cls: 'not-today-muted not-today-small', text: vice.counter });
			const box = row.createEl('input', { type: 'checkbox', cls: 'not-today-check' });
			box.checked = this.plugin.settings.vices.selected.includes(vice.id);
			boxes.set(vice.id, box);
			row.setAttribute('aria-checked', String(box.checked));
			const toggle = (): void => {
				box.checked = !box.checked;
				row.setAttribute('aria-checked', String(box.checked));
			};
			row.onclick = toggle;
			row.onkeydown = (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggle(); } };
		}
		body.createDiv({ cls: 'not-today-muted not-today-small', text: 'Custom vices, durations and countermeasures live in Settings, under Not Today.' });
		this.buttons(body, [[fromMenu ? 'Back' : 'Start fighting', async () => {
			this.plugin.settings.vices.selected = VICES.filter((v) => boxes.get(v.id)?.checked).map((v) => v.id);
			await this.plugin.saveSettings();
			this.menu();
		}, !fromMenu]]);
	}

	private menu(): void {
		const body = this.openScreen('Not Today', false);
		body.createDiv({ cls: 'not-today-lead', text: 'Panic button. Pick your fight.' });
		const vices = activeVices(this.plugin.settings.vices);
		const options: MenuOption[] = [
			...vices.map<MenuOption>((vice) => ({
				icon: vice.icon,
				title: vice.name,
				sub: vice.counter,
				open: () => (vice.kind === 'fists' ? this.fists(vice) : this.fight(vice)),
			})),
			{ icon: 'battery-low', title: 'Boredom', sub: 'Roll something concrete to do right now', open: () => void this.boredom() },
			{ icon: 'mic', title: 'Tongue twisters', sub: `${TWISTERS_MINUTES} minutes of slow, loud speech practice`, open: () => void this.twisters() },
			{ icon: 'list-plus', title: 'Change my vices', sub: 'Add or remove what you are fighting', open: () => this.checklist(true) },
		];
		const list = body.createDiv({ cls: 'not-today-list' });
		options.forEach((option, i) => {
			const row = list.createDiv({ cls: 'not-today-row', attr: { tabindex: '0', role: 'button' } });
			setIcon(row.createDiv({ cls: 'not-today-row-icon' }), option.icon);
			const text = row.createDiv({ cls: 'not-today-row-t' });
			text.createDiv({ cls: 'not-today-row-title', text: option.title });
			text.createDiv({ cls: 'not-today-muted not-today-small', text: option.sub });
			row.createEl('kbd', { cls: 'not-today-kbd', text: String(i + 1) });
			row.onclick = option.open;
			row.onkeydown = (e) => { if (e.key === 'Enter') option.open(); };
		});
		this.keyHandler = this.scope.register([], null, (e) => {
			const option = options[Number(e.key) - 1];
			if (!option) return true;
			option.open();
			return false;
		});
	}

	/** Big number with a draining bar; calls `onEnd` at zero. Timestamp-based, so throttling never lies. */
	private runTimer(el: HTMLElement, seconds: number, onEnd: () => void): void {
		const endAt = Date.now() + seconds * 1000;
		this.timerStart = Date.now();
		const box = el.createDiv({ cls: 'not-today-clock' });
		const num = box.createDiv({ cls: 'not-today-big', text: fmt(seconds) });
		const fill = box.createDiv({ cls: 'not-today-bar' }).createEl('i');
		let lastShown = -1;
		this.timer = window.setInterval(() => {
			const remaining = Math.max(0, Math.round((endAt - Date.now()) / 1000));
			if (remaining !== lastShown) {
				lastShown = remaining;
				num.setText(fmt(remaining));
				fill.style.width = `${(remaining / seconds) * 100}%`;
			}
			if (remaining <= 0) { window.clearInterval(this.timer); onEnd(); }
		}, 250);
	}

	/** Seconds elapsed since the running chronometer started. */
	private elapsedSeconds(): number {
		return this.timerStart ? Math.max(0, Math.round((Date.now() - this.timerStart) / 1000)) : 0;
	}

	private buttons(el: HTMLElement, defs: [string, () => void, boolean?][]): void {
		const row = el.createDiv({ cls: 'not-today-buttons' });
		for (const [text, fn, cta] of defs) {
			row.createEl('button', { text, cls: cta ? 'mod-cta' : '' }).onclick = fn;
		}
	}

	/** End screen; writes the line first, guards double clicks and write errors. */
	private async finish(line: string, icon: string, title: string, subtitle: string, okNote: string): Promise<void> {
		if (this.saving) return;
		this.saving = true;
		let written: boolean;
		try {
			written = await this.plugin.logLine(line);
		} catch {
			new Notice('Could not write to the daily note.');
			written = false;
		}
		const body = this.openScreen(title);
		const end = body.createDiv({ cls: 'not-today-end' });
		setIcon(end.createDiv({ cls: 'not-today-end-icon' }), icon);
		end.createDiv({ cls: 'not-today-lead', text: subtitle });
		end.createDiv({ cls: 'not-today-muted not-today-small', text: written ? okNote : 'The line was not written: check the daily note exists.' });
		this.buttons(end, [['Back', () => this.menu()], ['Close', () => this.close(), true]]);
	}

	// Urge surfing: stay with the urge without acting. It rises, peaks and falls.
	private fight(vice: Vice): void {
		const body = this.openScreen(vice.name);
		this.runTimer(body, vice.minutes * 60, () => void this.finish(
			fightLine(new Date(), vice.name, this.elapsedSeconds() || vice.minutes * 60, 'resisted'),
			'shield-check',
			'The wave passed',
			'You stayed firm until the end.',
			"Written to today's daily note.",
		));
		body.createDiv({ cls: 'not-today-muted not-today-center', text: 'The urge rises, peaks and falls. You do not have to fight it, only stay until it passes.' });
		const card = body.createDiv({ cls: 'not-today-card' });
		card.createDiv({ cls: 'not-today-tag', text: 'Countermeasure' });
		card.createDiv({ cls: 'not-today-card-title not-today-phrase', text: vice.counter });
		if (this.encouragement) {
			const encouragementCard = body.createDiv({ cls: 'not-today-card' });
			encouragementCard.createDiv({ cls: 'not-today-tag', text: 'For you' });
			encouragementCard.createDiv({ cls: 'not-today-letra', text: this.encouragement });
		}
		this.buttons(body, [['I gave in', () => void this.finish(
			fightLine(new Date(), vice.name, this.elapsedSeconds(), 'gavein'),
			'sunrise',
			'It is okay',
			'No guilt. The next wave starts now.',
			"Written to today's daily note.",
		)]]);
	}

	// Habit reversal: notice the trigger, then one minute of an incompatible response.
	private fists(vice: Vice): void {
		const body = this.openScreen(vice.name);
		body.createDiv({ cls: 'not-today-lead', text: 'First, notice.' });
		body.createDiv({ cls: 'not-today-label', text: 'What were you feeling or doing?' });
		const input = body.createEl('input', { type: 'text', cls: 'not-today-input', placeholder: 'boredom at the computer, anxiety, watching a video…' });
		window.setTimeout(() => input.focus(), 0);
		const start = (): void => {
			const trigger = input.value;
			const screen = this.openScreen(vice.name);
			this.runTimer(screen, FISTS_SECONDS, () => void this.finish(
				nailsLine(new Date(), trigger), 'hand', 'Well done', 'One minute of closed fists.', "Written to today's daily note.",
			));
			screen.createDiv({ cls: 'not-today-muted not-today-center', text: 'Arms beside your body, fists closed firmly, without hurting yourself. Breathe deep and hold.' });
		};
		input.onkeydown = (e) => { if (e.key === 'Enter') start(); };
		this.buttons(body, [['Start', start, true]]);
	}

	// Boredom: one click and something concrete comes out to replace the screen.
	private async boredom(previous?: string): Promise<void> {
		const notePath = this.plugin.settings.activitiesNote.trim();
		const fromNote = notePath ? activitiesFromNote((await this.plugin.readNote(notePath)) ?? '') : [];
		const activity = drawOne(withFallback(fromNote, builtinActivities()), previous);
		const body = this.openScreen('Boredom');
		const card = body.createDiv({ cls: 'not-today-card' });
		card.createDiv({ cls: 'not-today-tag', text: 'Do it now' });
		card.createDiv({ cls: 'not-today-card-title', text: activity.title });
		card.createDiv({ cls: 'not-today-letra not-today-muted', text: activity.how });
		body.createDiv({ cls: 'not-today-muted not-today-center not-today-small', text: `Just ${BOREDOM_MINUTES} minutes. If after that you do not want to continue, roll another one.` });
		const finishBoredom = (): void => void this.finish(
			boredomLine(new Date(), activity.title, this.elapsedSeconds() || BOREDOM_MINUTES * 60),
			'sparkles', 'Done', 'You traded the screen for something concrete.', "Written to today's daily note.",
		);
		const start = (): void => {
			const screen = this.openScreen(activity.title);
			this.runTimer(screen, BOREDOM_MINUTES * 60, finishBoredom);
			screen.createDiv({ cls: 'not-today-muted not-today-center', text: activity.how });
			this.buttons(screen, [['Roll another', () => void this.boredom(activity.title)], ['I am done', finishBoredom, true]]);
		};
		this.buttons(body, [['Roll another', () => void this.boredom(activity.title)], ['Start', start, true]]);
	}

	private async twisters(): Promise<void> {
		const body = this.openScreen('Tongue twisters');
		const notePath = this.plugin.settings.twistersNote.trim();
		const fromNote = notePath ? bulletsFromNote((await this.plugin.readNote(notePath)) ?? '') : [];
		const deck = shuffleDeck(withFallback(fromNote, TWISTERS));
		let count = 0;
		const finishTwisters = (): void => void this.finish(
			twistersLine(new Date(), this.elapsedSeconds() || TWISTERS_MINUTES * 60, count),
			'mic', 'Practice done', 'Listen to the recording and notice what improved.', "Written to today's daily note.",
		);
		this.runTimer(body, TWISTERS_MINUTES * 60, finishTwisters);
		const card = body.createDiv({ cls: 'not-today-card' });
		const tag = card.createDiv({ cls: 'not-today-tag' });
		const title = card.createDiv({ cls: 'not-today-card-title not-today-phrase' });
		let sinceSwitch = 0;
		const next = (): void => {
			title.setText(deck[count % deck.length]!);
			count += 1;
			tag.setText(`Twister ${count}`);
			sinceSwitch = 0;
		};
		next();
		const switcher = window.setInterval(() => { sinceSwitch += 1; if (sinceSwitch >= TWISTER_SWITCH_SECONDS) next(); }, 1000);
		this.extraTimers.push(switcher);
		const steps = body.createEl('ol', { cls: 'not-today-steps' });
		for (const step of [
			'Warm up: breathe deep and vibrate your lips and tongue.',
			`Read slowly, exaggerating the mouth. The sentence switches by itself every ${TWISTER_SWITCH_SECONDS} seconds.`,
			'Record yourself and listen. The ear catches what the mouth hides.',
		]) steps.createEl('li', { text: step });
		this.buttons(body, [['Next', next], ['I am done', finishTwisters, true]]);
	}
}
