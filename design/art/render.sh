#!/bin/sh
# Renderiza as artes do carrossel da home em public/img/<slug>-art.jpg (pt-BR)
# e <slug>-art-en.jpg (inglês). Uso: design/art/render.sh [slug...]
set -e
cd "$(dirname "$0")"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
OUT=../../public/img
TMP=$(mktemp -d)
for f in ${@:-*.html}; do
  slug=$(basename "$f" .html)
  for lang in pt en; do
    suffix=$([ "$lang" = en ] && echo "-en" || true)
    hash=$([ "$lang" = en ] && echo "#en" || true)
    "$CHROME" --headless=new --hide-scrollbars --force-device-scale-factor=1 --window-size=1200,1200 \
      --virtual-time-budget=4000 --screenshot="$TMP/$slug$suffix.png" "file://$PWD/$slug.html$hash" 2>/dev/null
    sips -s format jpeg -s formatOptions 84 "$TMP/$slug$suffix.png" --out "$OUT/$slug-art$suffix.jpg" >/dev/null
    echo "$OUT/$slug-art$suffix.jpg"
  done
done
rm -rf "$TMP"
