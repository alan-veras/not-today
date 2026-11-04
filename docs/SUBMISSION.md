# Submissão do Not Today à loja do Obsidian

Passo a passo do que falta, tudo que depende de conta sua. O código e a infra estão prontos: lint oficial zerado, 28 testes, build limpo, `versions.json`, LICENSE 0-BSD e workflow de release.

## 1. Repo público no GitHub

```bash
cd "/home/alanv/Trabalhos/Freelancer/Obsidian Plugins/dominio"
gh repo create not-today --public --source=. --push
```

## 2. Release 0.2.0

O workflow `.github/workflows/releases.yml` roda a cada tag e anexa `main.js`, `manifest.json` e `styles.css` à release:

```bash
git tag 0.2.0
git push origin 0.2.0
```

Conferir na aba Actions que o release saiu com os três arquivos.

## 3. Demo

```bash
./demo/gravar-demo.sh
```

Com a máquina livre (o script abre uma segunda janela do Obsidian e filma só ela). O `demo/demo.gif` entra no README (há um marcador no lugar) e o `demo-raw.mp4` serve para divulgar. Rodar `npm run deploy` depois não é preciso (nada muda no vault).

## 4. PR de submissão

Fork de `obsidianmd/obsidian-releases`, editar `community-plugins.json` (ordem alfabética por id) e abrir a PR:

```json
{
	"id": "dominio",
	"name": "Not Today",
	"author": "Alan Veras",
	"description": "A panic button for urges: surf the wave, fight any vice with a countermeasure, and log the fight to your daily note.",
	"repo": "SEU-USUARIO/not-today"
}
```

Ajustar `repo` para o caminho real do passo 1. A descrição já está em conformidade (113 caracteres, termina com ponto, sem emoji). Revisar contra as guidelines antes de abrir: https://docs.obsidian.md/plugins/releasing/plugin-guidelines

## Estado de conformidade

- ESLint oficial (`eslint-plugin-obsidianmd`): **0 erros, 0 warnings**.
- Sem API privada (`app.internalPlugins` removido; pasta de dailies lida de `daily-notes.json` via adapter com `configDir`).
- Settings 100% na API declarativa (1.13+), então a busca de settings funciona.
- Sem hotkey padrão (regra da loja): o comando "Open the panic button" espera o usuário ligar um atalho.
- Sem rede, sem eval, sem `innerHTML`; dados não saem do vault; disclaimer de não-substituição de terapia no README.
- Pendência conhecida: testar no celular (`isDesktopOnly: false`) antes ou logo depois da submissão.
