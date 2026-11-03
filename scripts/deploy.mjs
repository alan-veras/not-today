import { copyFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
const vault = process.env.DOMINIO_VAULT ?? '/home/alanv/Trabalhos/Obsidian/second-brain';
const target = join(vault, '.obsidian', 'plugins', 'dominio');
mkdirSync(target, { recursive: true });
for (const file of ['main.js', 'manifest.json', 'styles.css']) copyFileSync(file, join(target, file));
process.stdout.write(`Domínio copiado para ${target}\n`);
