#!/usr/bin/env bash
# Grava a demo do Domínio sem tocar no seu Obsidian: abre uma SEGUNDA instância
# (perfil próprio, forçada em X11) no vault demo, filma só a janela dela e corta
# um GIF para o README. Rode quando a máquina estiver livre.
#
# Uso:  ./demo/gravar-demo.sh          (grava e gera demo/demo-raw.mp4 + demo/demo.gif)
set -uo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"
DEMO="$REPO/demo-vault"
OUT="$REPO/demo"
PROFILE="/tmp/dominio-obsidian-profile"
ASAR="/usr/lib/obsidian/app.asar"
ELECTRON="$(command -v electron || command -v electron43 || true)"
[ -n "$ELECTRON" ] || { echo "Electron do Obsidian não encontrado (ajuste ASAR/ELECTRON no topo do script)"; exit 1; }
mkdir -p "$OUT"

mkdir -p "$DEMO/.obsidian/plugins/dominio" "$DEMO/Daily Notes"
cp "$REPO/main.js" "$REPO/manifest.json" "$REPO/styles.css" "$DEMO/.obsidian/plugins/dominio/"
[ -f "$DEMO/.obsidian/community-plugins.json" ] || printf '["dominio"]\n' > "$DEMO/.obsidian/community-plugins.json"
[ -f "$DEMO/.obsidian/plugins/dominio/data.json" ] || cat > "$DEMO/.obsidian/plugins/dominio/data.json" <<'EOF'
{
	"dailyFolder": "Daily Notes",
	"secao": "## Domínio",
	"twistersNote": "",
	"activitiesNote": "",
	"encouragementNote": "Encouragement.md",
	"fundingUrl": "",
	"escolhas": {
		"selecionados": ["social-media", "procrastination", "nail-biting"],
		"custom": [],
		"overrides": { "social-media": { "minutes": 1 }, "procrastination": { "minutes": 1 } }
	}
}
EOF
printf '# Encouragement\n\nThis wave will pass. You have outlasted every wave so far.\n' > "$DEMO/Encouragement.md"
DIA="$(date +%F)"
[ -f "$DEMO/Daily Notes/$DIA.md" ] || printf '# %s\n\n## Diario\n\nDemo day.\n' "$DIA" > "$DEMO/Daily Notes/$DIA.md"

export DISPLAY="${DISPLAY:-:0}"
"$ELECTRON" "$ASAR" --user-data-dir="$PROFILE" --ozone-platform=x11 "obsidian://open?path=$DEMO" >/dev/null 2>&1 &

WIN=""
for i in $(seq 1 30); do
	WIN="$(xdotool search --name "dominio-demo-vault" 2>/dev/null | tail -1)"
	[ -n "$WIN" ] && break
	[ "$i" = 12 ] && echo "Se a janela abriu pedindo confiança, clique 'Trust author and enable plugins'."
	sleep 2
done
[ -n "$WIN" ] || { echo "Janela do vault demo não apareceu; abra o vault manualmente e rode de novo."; exit 1; }
xdotool windowactivate "$WIN" 2>/dev/null
sleep 1
eval "$(xdotool getwindowgeometry --shell "$WIN")"
echo
echo "Gravando a janela ${WIDTH}x${HEIGHT}+${X}+${Y}. Ctrl+C para parar e gerar o GIF."
echo
echo "Roteiro (~90s):"
echo "  1. Ctrl+Alt+F abre o menu de pânico; deixe o menu em cena por 5s"
echo "  2. clique em Social media e espere o cronômetro de 1 minuto terminar (a onda passa)"
echo "  3. Back, Boredom, Start, espere ~15s, I am done (mostra o tempo real no log)"
echo "  4. Back, Tongue twisters, Next duas vezes, I am done"
echo "  5. feche o modal e abra a daily (Daily Notes) para mostrar as linhas em ## Domínio"
ffmpeg -y -f x11grab -framerate 30 -video_size "${WIDTH}x${HEIGHT}" -i ":0.0+${X},${Y}" \
	-c:v libx264 -preset veryfast -crf 22 -pix_fmt yuv420p "$OUT/demo-raw.mp4" || true
[ -s "$OUT/demo-raw.mp4" ] || { echo "Gravação vazia."; exit 1; }
ffmpeg -y -i "$OUT/demo-raw.mp4" \
	-vf "crop=560:640:iw/2-280:ih/2-320,fps=12,scale=480:-1:flags=lanczos,split[a][b];[a]palettegen[p];[b][p]paletteuse" \
	"$OUT/demo.gif" || true
echo "Pronto: $OUT/demo-raw.mp4 e $OUT/demo.gif (o GIF vai para o README, o MP4 para a loja/redes)."
