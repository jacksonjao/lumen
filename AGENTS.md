# Instructions for AI coding assistants

Lumen is a launcher web app for Samsung Tizen TVs (plain HTML, CSS and JavaScript in `src/`, no build step).
These notes help Claude Code, Codex and similar assistants install it for a user.

## Installing on the user's TV

1. Ask the user for the **TV IP** if they did not give it. Explain where to find it:
   Settings > General > Network > Network Status > IP Settings.
2. Make sure the user turned on **Developer Mode** on the TV with this computer's IP as **Host PC IP**,
   and restarted the TV. Only the user can do this (Apps > press 1 2 3 4 5 on the remote). Tell them
   this computer's local IP so they can type it.
3. Check that Docker is installed and running (`docker info`). If not, ask the user to install
   Docker Desktop (or OrbStack on a Mac). Do not install it without asking.
4. Run `sh scripts/install.sh <TV_IP>`. The first run downloads a large Docker image and can
   take several minutes. On Apple Silicon the image runs under emulation; that is expected.
5. Optional TMDB key (movie and show images): the user gets a free key at themoviedb.org > Settings > API.
   Prefer that the user writes it into `src/js/config.local.js` themselves (copy
   `src/js/config.local.example.js`). If they give it to you, run
   `TMDB_KEY=<key> sh scripts/install.sh <TV_IP>`. Never commit `config.local.js` and never print the key.

## Common errors

- `Could not connect to the TV`: Developer Mode is off, Host PC IP is wrong, or the TV was not restarted
  after changing it. Port 26101 must be reachable.
- Certificate or signature errors on install: newer TVs (2021+) can require a Samsung certificate made
  in Tizen Studio for that TV. Explain this to the user; it cannot be fixed from this script.

## Rules for code changes

- The TV browser is **Chromium 56**: no CSS Grid, no flexbox `gap`, no `inset`, no `clamp()`, no
  `backdrop-filter`. JavaScript must be ES2016 (check with `npx acorn --ecma2016 src/js/*.js`).
- Animate only `transform` and `opacity`.
- Do not change the app id `GlassLnch1.Glass` in `src/config.xml`: the TV would treat it as a new app.
- Try changes with `node scripts/serve.mjs` (http://localhost:8080; arrows, Enter, Esc; S opens the screen saver)
  before installing.
- All UI texts live in `src/js/i18n.js` (9 languages). Add new keys in every language.
