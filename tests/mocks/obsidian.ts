/** Minimal stand-in for the obsidian module under vitest: only what the pure functions touch. */
export function normalizePath(p: string): string {
	return p.replace(/\/+/g, '/').replace(/\/$/, '');
}

export class Setting {
	constructor(_containerEl?: unknown) {}
	setName(): this { return this; }
	setDesc(): this { return this; }
	setHeading(): this { return this; }
	addText(): this { return this; }
	addTextArea(): this { return this; }
	addToggle(): this { return this; }
	addButton(): this { return this; }
}

export class PluginSettingTab {
	constructor(_app?: unknown, _plugin?: unknown) {}
	display(): void {}
}
