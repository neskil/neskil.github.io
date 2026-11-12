# Portals, vendored

Part of **Portals** by Ethan Mollick — https://github.com/emollick/ai-portals,
release s8f (November 2026) — copied here unmodified: its engine (`src/core`),
its shared kit (`src/kit`), twelve of its 471 worlds (`src/worlds`, with their
set pieces in `src/parts`) and its copy of three.js r170 (`vendor/three`).

Loft Links plays each hole of its World Tour inside one of these worlds:
`../../js/backdrop.mjs` builds the world with this engine and draws it behind
the hole. Nothing here is edited, so a newer release can be dropped in.

**Licence.** Portals is under Creative Commons
Attribution-NonCommercial-ShareAlike 4.0 International ([LICENSE](LICENSE)):
it may be shared and built on for non-commercial purposes, with credit, and
what is built on it carries the same licence. That applies to this folder and
to the code written to adapt it (`js/backdrop.mjs`). three.js and the short
functions listed in [THIRD-PARTY-NOTICES.txt](THIRD-PARTY-NOTICES.txt) keep
their own terms (MIT and others); the upstream README's "License and credits"
section names further borrowed shaders.

The worlds used: `breakfast-table`, `world-turtle`, `storm-bands`,
`kelp-cathedral`, `carnival-on-the-frozen-river`, `spore-rain`, `long-library`,
`stairway-everywhere`, `the-toppling`, `airbrush-black-hole`, `cloud-armada`,
`obsidian-forge`. To add one, copy its file from upstream `src/worlds` along
with everything it imports, and name it in `js/portals.js → PLACES`.
