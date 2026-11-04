# Not Today

A panic button for the moment an urge hits. Tap the shield icon, pick your fight, and the plugin holds you through it: the urge rises, peaks and falls, and you only need to stay until it passes.

[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20me%20a%20coffee-Donate-yellow)](https://www.buymeacoffee.com/alanveras)

<!-- Demo GIF: run demo/gravar-demo.sh and add assets here -->

## How it works

1. **On first open**, tick the vices you are fighting (social media, nail biting, junk food, porn, smoking, alcohol, gaming, impulse buying, procrastination, binge watching, anger, self-criticism). You can add your own custom vices with your own countermeasures in the settings.
2. **When the urge hits**, open the panic button (bind any hotkey you like to the "Open the panic button" command, or tap the shield icon in the ribbon) and tap the vice. The fight starts immediately.
3. **Surf the wave.** A timer runs the urge-surf length while the screen shows your countermeasure and, if you set one, an encouragement note of your own. You do not have to fight the feeling, only stay until it passes.
4. **The outcome is logged** as one honest line in today's daily note, under a `## Domínio` heading by default (configurable), including how long you actually lasted. Gave in after two minutes? It says two minutes. No guilt, no shame: the next wave starts now.

## The tools

| Tool | What it does |
|---|---|
| **Vice fight** | Urge surf with your countermeasure on screen; log with the real duration |
| **Nail biting** | Habit reversal: notice the trigger, then one minute of closed fists |
| **Boredom** | Rolls one concrete thing to do instead of the screen (20 options, or your own list) |
| **Tongue twisters** | 5 minutes of slow, loud speech practice with rotating twisters |

## Why it works

Not Today is built on techniques with published evidence, not on willpower sermons:

- **Friction and delay** — inserting a pause before an automatic action is the strongest lever measured: the [one sec study (PNAS, 2023)](https://www.pnas.org/doi/10.1073/pnas.2213114120) cut app openings by 57% over six weeks. The panic button is exactly that pause.
- **Urge surfing** — urges rise, peak and fall; staying until the wave passes is the core of Mindfulness-Based Relapse Prevention, with small but significant effects on craving in [meta-analysis](https://pmc.ncbi.nlm.nih.gov/articles/PMC5636047).
- **Habit reversal training** — for nail biting, the awareness-plus-competing-response flow the plugin runs is [the most effective known treatment](https://pubmed.ncbi.nlm.nih.gov/12590622).
- **Honest self-monitoring** — the log records what actually happened, resisted or not, because tracking only works when the data is true.

Digital self-control tools as a category were rated "convincing" in the [ProSocial Design evidence review](https://www.prosocialdesign.org/blog/we-find-it-convincing-that-digital-self-control-apps-work-heres-what-that-means). This plugin is a tool, not a treatment: no app replaces a therapist, a doctor, a support group or the people around you.

## Make it yours

Everything personal lives in your vault, not in the plugin:

- **Countermeasures** can be rewritten in your own words, per vice, in the settings.
- **Encouragement note**: any note of yours (a verse, a sentence) shown during every fight.
- **Boredom list** and **tongue twisters** can come from your own notes.
- **Daily section**: lines are written under a `## Domínio` heading in today's daily note.

## Install

Get it from Obsidian's Community plugins (search for **Not Today**), or manually: download `main.js`, `manifest.json` and `styles.css` from the [latest release](../../releases) into `<vault>/.obsidian/plugins/not-today/`.

## License

[0-BSD](LICENSE). Free for any use.
