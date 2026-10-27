#!/bin/sh
# Packages, signs and installs Lumen on a Samsung TV with the official Tizen tools, inside Docker
# (no Tizen Studio needed). It signs with the developer certificate that comes with the image.
#
# Before: the TV is on, in Developer Mode, with this computer's IP as "Host PC IP".
# Usage:  sh scripts/install.sh <TV_IP>
#         TMDB_KEY=your_key sh scripts/install.sh <TV_IP>   (optional: movie and show images)
set -eu
cd "$(dirname "$0")/.."

TV_IP="${1:-${TV_IP:-}}"
IMAGE="vitalets/tizen-webos-sdk:3.0"
# Do not change it: the TV would treat it as a different app (and your settings would be lost).
APP_ID="GlassLnch1.Glass"

if [ -z "$TV_IP" ]; then
    echo "Usage: sh scripts/install.sh <TV_IP>"
    echo "You can see the TV IP in Settings > General > Network > Network Status > IP Settings."
    exit 1
fi
if ! command -v docker >/dev/null 2>&1; then
    echo "Docker is not installed. Install Docker Desktop (or OrbStack on a Mac) and try again."
    exit 1
fi

# Optional TMDB key: saved in src/js/config.local.js (ignored by git) and packaged with the app.
if [ -n "${TMDB_KEY:-}" ]; then
    printf "window.GLASS_LOCAL = {\n    tmdbKey: '%s'\n};\n" "$TMDB_KEY" > src/js/config.local.js
    echo "TMDB key saved in src/js/config.local.js"
fi
[ -f src/js/config.local.js ] || cp src/js/config.local.example.js src/js/config.local.js

mkdir -p dist

docker run --rm --platform linux/amd64 \
    -v "$PWD/src":/app:ro \
    -v "$PWD/dist":/out \
    -v glass-tizen-home:/home/developer \
    "$IMAGE" bash -c "
        set -e
        rm -rf /tmp/app && cp -r /app /tmp/app
        rm -f /out/Lumen.wgt
        tizen package -t wgt -o /out -- /tmp/app
        # Over Wi-Fi the TV sometimes takes a while to accept the first connection.
        sdb start-server >/dev/null 2>&1
        for i in 1 2 3 4 5; do sdb connect $TV_IP:26101 | grep -q '^connected' && break; sleep 3; done
        sdb devices | grep -q '$TV_IP' || {
            echo 'Could not connect to the TV ($TV_IP:26101).'
            echo 'Check that it is on, in Developer Mode, and that Host PC IP is the IP of this computer.'
            exit 1
        }
        tizen install -s $TV_IP:26101 --name Lumen.wgt -- /out
        tizen run -s $TV_IP:26101 -p $APP_ID
    "

echo "Done: Lumen is installed and open on the TV."
