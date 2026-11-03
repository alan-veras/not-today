import { App, KeymapEventHandler, Modal, Notice, setIcon } from 'obsidian';
import type DominioPlugin from '../main';
import { Atividade, atividades, atividadesDaNota, sortear } from '../data/boredom';
import { baralho, TWISTERS } from '../data/twisters';
import { comReserva, itensDaNota } from '../data/notas';
import { VICES, Vice, vicesAtivos } from '../data/vices';
import { linhaLuta, linhaTedio, linhaTwisters, linhaUnha } from '../log';

const UNHA_SEG = 60;
const TWISTER_TROCA_SEG = 20;
const TWISTERS_MIN = 5;
const TEDIO_MIN = 5;

const fmt = (s: number): string => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

interface Opcao { icon: string; titulo: string; sub: string; abrir: () => void }

/**
 * One window, a few screens: the panic menu, the fight (with a timer) and the end.
 * Visual follows the Lembro panel pattern: icon list, big number, muted secondary text.
 */
export class DominioModal extends Modal {
	private timer = 0;
	private extras: number[] = [];
	private teclas: KeymapEventHandler | null = null;
	/** Reference instant of the running chronometer, for honest durations in the log. */
	private cronInicio = 0;
	/** Guards against double clicks writing the line twice. */
	private registrando = false;
	private encouragem: string;

	constructor(
		app: App,
		private readonly plugin: DominioPlugin,
		encouragem: string,
	) {
		super(app);
		this.encouragem = encouragem;
	}

	onOpen(): void {
		this.modalEl.addClass('dominio-modal');
		if (vicesAtivos(this.plugin.settings.escolhas).length === 0) this.checklist(false);
		else this.menu();
	}

	onClose(): void {
		this.limpar();
		this.contentEl.empty();
	}

	private limpar(): void {
		window.clearInterval(this.timer);
		this.extras.forEach((id) => window.clearInterval(id));
		this.extras = [];
		if (this.teclas) {
			this.scope.unregister(this.teclas);
			this.teclas = null;
		}
	}

	/** New screen: clears timers and pending writes, header with back (except on the menu). */
	private tela(titulo: string, voltar = true): HTMLElement {
		this.limpar();
		this.registrando = false;
		this.contentEl.empty();
		this.contentEl.addClass('dominio');
		const head = this.contentEl.createDiv({ cls: 'dominio-head' });
		if (voltar) {
			const b = head.createEl('button', { cls: 'clickable-icon dominio-back', attr: { 'aria-label': 'Back' } });
			setIcon(b, 'arrow-left');
			b.onclick = () => this.menu();
		}
		head.createSpan({ cls: 'dominio-title', text: titulo });
		return this.contentEl.createDiv({ cls: 'dominio-body' });
	}

	private async salvar(): Promise<void> {
		await this.plugin.saveSettings();
	}

	/** First-run checklist: pick the vices you are fighting. */
	private checklist(fromMenu: boolean): void {
		const body = this.tela('What do you want to fight?', fromMenu);
		body.createDiv({ cls: 'dominio-lead', text: 'Tick the vices you are fighting. Each one becomes a one-tap button on the panic screen.' });
		const marcados = new Set(this.plugin.settings.escolhas.selecionados);
		const caixas = new Map<string, HTMLInputElement>();
		for (const v of VICES) {
			const row = body.createDiv({ cls: 'dominio-row', attr: { tabindex: '0', role: 'checkbox' } });
			setIcon(row.createDiv({ cls: 'dominio-row-icon' }), v.icon);
			const t = row.createDiv({ cls: 'dominio-row-t' });
			t.createDiv({ cls: 'dominio-row-title', text: v.name });
			t.createDiv({ cls: 'dominio-muted dominio-small', text: v.counter });
			const box = row.createEl('input', { type: 'checkbox', cls: 'dominio-check' });
			box.checked = marcados.has(v.id);
			box.style.pointerEvents = 'none';
			caixas.set(v.id, box);
			const trocar = (): void => {
				box.checked = !box.checked;
				row.setAttribute('aria-checked', String(box.checked));
			};
			row.setAttribute('aria-checked', String(box.checked));
			row.onclick = trocar;
			row.onkeydown = (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); trocar(); } };
		}
		body.createDiv({ cls: 'dominio-muted dominio-small', text: 'Custom vices, durations and countermeasures live in Settings, under Domínio.' });
		this.botoes(body, [[fromMenu ? 'Back' : 'Start fighting', async () => {
			this.plugin.settings.escolhas.selecionados = VICES.filter((v) => caixas.get(v.id)?.checked).map((v) => v.id);
			await this.salvar();
			this.menu();
		}, !fromMenu]]);
	}

	private menu(): void {
		const body = this.tela('Domínio', false);
		body.createDiv({ cls: 'dominio-lead', text: 'Panic button. Pick your fight.' });
		const vices = vicesAtivos(this.plugin.settings.escolhas);
		const opcoes: Opcao[] = [
			...vices.map<Opcao>((v) => ({
				icon: v.icon,
				titulo: v.name,
				sub: v.counter,
				abrir: () => (v.kind === 'fists' ? this.punhos(v) : this.luta(v)),
			})),
			{ icon: 'battery-low', titulo: 'Boredom', sub: 'Roll something concrete to do right now', abrir: () => this.tedio() },
			{ icon: 'mic', titulo: 'Tongue twisters', sub: `${TWISTERS_MIN} minutes of slow, loud speech practice`, abrir: () => this.twisters() },
			{ icon: 'list-plus', titulo: 'Change my vices', sub: 'Add or remove what you are fighting', abrir: () => this.checklist(true) },
		];
		const lista = body.createDiv({ cls: 'dominio-list' });
		opcoes.forEach((o, i) => {
			const row = lista.createDiv({ cls: 'dominio-row', attr: { tabindex: '0', role: 'button' } });
			setIcon(row.createDiv({ cls: 'dominio-row-icon' }), o.icon);
			const t = row.createDiv({ cls: 'dominio-row-t' });
			t.createDiv({ cls: 'dominio-row-title', text: o.titulo });
			t.createDiv({ cls: 'dominio-muted dominio-small', text: o.sub });
			row.createEl('kbd', { cls: 'dominio-kbd', text: String(i + 1) });
			row.onclick = o.abrir;
			row.onkeydown = (e) => { if (e.key === 'Enter') o.abrir(); };
		});
		this.teclas = this.scope.register([], null, (e) => {
			const o = opcoes[Number(e.key) - 1];
			if (!o) return true;
			o.abrir();
			return false;
		});
	}

	/** Big number with a draining bar; calls `fim` at zero. Timestamp-based, so throttling never lies. */
	private cronometro(el: HTMLElement, segundos: number, fim: () => void): void {
		const fimEm = Date.now() + segundos * 1000;
		this.cronInicio = Date.now();
		const box = el.createDiv({ cls: 'dominio-clock' });
		const num = box.createDiv({ cls: 'dominio-big', text: fmt(segundos) });
		const fill = box.createDiv({ cls: 'dominio-bar' }).createEl('i');
		let ultimo = -1;
		this.timer = window.setInterval(() => {
			const resta = Math.max(0, Math.round((fimEm - Date.now()) / 1000));
			if (resta !== ultimo) {
				ultimo = resta;
				num.setText(fmt(resta));
				fill.style.width = `${(resta / segundos) * 100}%`;
			}
			if (resta <= 0) { window.clearInterval(this.timer); fim(); }
		}, 250);
	}

	/** Seconds elapsed since the running chronometer started. */
	private segundosReais(): number {
		return this.cronInicio ? Math.max(0, Math.round((Date.now() - this.cronInicio) / 1000)) : 0;
	}

	private botoes(el: HTMLElement, lista: [string, () => void, boolean?][]): void {
		const row = el.createDiv({ cls: 'dominio-buttons' });
		for (const [txt, fn, cta] of lista) {
			const b = row.createEl('button', { text: txt, cls: cta ? 'mod-cta' : '' });
			b.onclick = fn;
		}
	}

	/** End screen; writes the line first, guards double clicks and write errors. */
	private async fim(line: string, icon: string, titulo: string, sub: string, okExtra: string): Promise<void> {
		if (this.registrando) return;
		this.registrando = true;
		let ok: boolean;
		try {
			ok = await this.plugin.registrarLinha(line);
		} catch {
			new Notice('Could not write to the daily note.');
			ok = false;
		}
		const body = this.tela(titulo);
		const end = body.createDiv({ cls: 'dominio-end' });
		setIcon(end.createDiv({ cls: 'dominio-end-icon' }), icon);
		end.createDiv({ cls: 'dominio-lead', text: sub });
		end.createDiv({ cls: 'dominio-muted dominio-small', text: ok ? okExtra : 'The line was not written: check the daily note exists.' });
		this.botoes(end, [['Back', () => this.menu()], ['Close', () => this.close(), true]]);
	}

	// Urge surfing: stay with the urge without acting. It rises, peaks and falls.
	private luta(v: Vice): void {
		const body = this.tela(v.name);
		this.cronometro(body, v.minutes * 60, () => void this.fim(
			linhaLuta(new Date(), v.name, this.segundosReais() || v.minutes * 60, 'resisted'),
			'shield-check',
			'The wave passed',
			'You stayed firm until the end.',
			`Written to today's daily note.`,
		));
		body.createDiv({ cls: 'dominio-muted dominio-center', text: 'The urge rises, peaks and falls. You do not have to fight it, only stay until it passes.' });
		const card = body.createDiv({ cls: 'dominio-card' });
		card.createDiv({ cls: 'dominio-tag', text: 'Countermeasure' });
		card.createDiv({ cls: 'dominio-card-title dominio-frase', text: v.counter });
		if (this.encouragem) {
			const e = body.createDiv({ cls: 'dominio-card' });
			e.createDiv({ cls: 'dominio-tag', text: 'For you' });
			e.createDiv({ cls: 'dominio-letra', text: this.encouragem });
		}
		this.botoes(body, [['I gave in', () => void this.fim(
			linhaLuta(new Date(), v.name, this.segundosReais(), 'gavein'),
			'sunrise',
			'It is okay',
			'No guilt. The next wave starts now.',
			`Written to today's daily note.`,
		)]]);
	}

	// Habit reversal: notice the trigger, then one minute of an incompatible response.
	private punhos(v: Vice): void {
		const body = this.tela(v.name);
		body.createDiv({ cls: 'dominio-lead', text: 'First, notice.' });
		body.createDiv({ cls: 'dominio-label', text: 'What were you feeling or doing?' });
		const input = body.createEl('input', { type: 'text', cls: 'dominio-input', placeholder: 'boredom at the computer, anxiety, watching a video…' });
		window.setTimeout(() => input.focus(), 0);
		const ir = (): void => {
			const g = input.value;
			const b = this.tela(v.name);
			this.cronometro(b, UNHA_SEG, () => void this.fim(
				linhaUnha(new Date(), g), 'hand', 'Well done', 'One minute of closed fists.', `Written to today's daily note.`,
			));
			b.createDiv({ cls: 'dominio-muted dominio-center', text: 'Arms beside your body, fists closed firmly, without hurting yourself. Breathe deep and hold.' });
		};
		input.onkeydown = (e) => { if (e.key === 'Enter') ir(); };
		this.botoes(body, [['Start', ir, true]]);
	}

	// Boredom: one click and something concrete comes out to replace the screen.
	private async tedio(anterior?: string): Promise<void> {
		const nota = this.plugin.settings.activitiesNote.trim();
		const daNota = nota ? atividadesDaNota((await this.plugin.lerNota(nota)) ?? '') : [];
		const lista: Atividade[] = comReserva(daNota, atividades());
		const a = sortear(lista, anterior);
		const body = this.tela('Boredom');
		const card = body.createDiv({ cls: 'dominio-card' });
		card.createDiv({ cls: 'dominio-tag', text: 'Do it now' });
		card.createDiv({ cls: 'dominio-card-title', text: a.titulo });
		card.createDiv({ cls: 'dominio-letra dominio-muted', text: a.como });
		body.createDiv({ cls: 'dominio-muted dominio-center dominio-small', text: `Just ${TEDIO_MIN} minutes. If after that you do not want to continue, roll another one.` });
		const fimTedio = (): void => void this.fim(
			linhaTedio(new Date(), a.titulo, this.segundosReais() || TEDIO_MIN * 60),
			'sparkles', 'Done', 'You traded the screen for something concrete.', `Written to today's daily note.`,
		);
		const comecar = (): void => {
			const b = this.tela(a.titulo);
			this.cronometro(b, TEDIO_MIN * 60, fimTedio);
			b.createDiv({ cls: 'dominio-muted dominio-center', text: a.como });
			this.botoes(b, [['Roll another', () => void this.tedio(a.titulo)], ['I am done', fimTedio, true]]);
		};
		this.botoes(body, [['Roll another', () => void this.tedio(a.titulo)], ['Start', comecar, true]]);
	}

	private async twisters(): Promise<void> {
		const body = this.tela('Tongue twisters');
		const nota = this.plugin.settings.twistersNote.trim();
		const daNota = nota ? itensDaNota((await this.plugin.lerNota(nota)) ?? '') : [];
		const cartas = baralho(comReserva(daNota, TWISTERS));
		let n = 0;
		const feito = (): void => void this.fim(
			linhaTwisters(new Date(), this.segundosReais() || TWISTERS_MIN * 60, n),
			'mic', 'Practice done', 'Listen to the recording and notice what improved.', `Written to today's daily note.`,
		);
		this.cronometro(body, TWISTERS_MIN * 60, feito);
		const card = body.createDiv({ cls: 'dominio-card' });
		const tag = card.createDiv({ cls: 'dominio-tag' });
		const titulo = card.createDiv({ cls: 'dominio-card-title dominio-frase' });
		let desde = 0;
		const proxima = (): void => {
			titulo.setText(cartas[n % cartas.length]!);
			n += 1;
			tag.setText(`Twister ${n}`);
			desde = 0;
		};
		proxima();
		const troca = window.setInterval(() => { desde += 1; if (desde >= TWISTER_TROCA_SEG) proxima(); }, 1000);
		this.extras.push(troca);
		const passos = body.createEl('ol', { cls: 'dominio-steps' });
		for (const p of [
			'Warm up: breathe deep and vibrate your lips and tongue.',
			`Read slowly, exaggerating the mouth. The sentence switches by itself every ${TWISTER_TROCA_SEG} seconds.`,
			'Record yourself and listen. The ear catches what the mouth hides.',
		]) passos.createEl('li', { text: p });
		this.botoes(body, [['Next', proxima], ['I am done', feito, true]]);
	}
}
