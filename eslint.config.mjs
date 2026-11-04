import { defineConfig } from 'eslint/config';
import obsidianmd from 'eslint-plugin-obsidianmd';

export default defineConfig([
	...obsidianmd.configs.recommended,
	{
		ignores: ['tests/mocks/**', 'main.js'],
		languageOptions: {
			parserOptions: {
				projectService: {
					allowDefaultProject: ['eslint.config.*', 'vitest.config.*'],
				},
			},
		},
	},
]);
