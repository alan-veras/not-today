import { copyFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
const vault = process.env.NOT_TODAY_VAULT ?? '/home/alanv/Trabalhos/Obsidian/second-brain';
const target = join(vault, '.obsidian', 'plugins', 'not-today');
mkdirSync(target, { recursive: true });
for (const file of ['main.js', 'manifest.json', 'styles.css']) copyFileSync(file, join(target, file));
process.stdout.write(`Not Today copiado para ${target}\n`);
