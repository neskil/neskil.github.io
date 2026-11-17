# Portals, vendored

Part of **Portals** by Ethan Mollick — https://github.com/emollick/ai-portals,
release s8f (November 2026) — copied here unmodified: the whole repository,
all 471 worlds, its engine, kit and copy of three.js r170 (see below for the
two files that are not here as they were).

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

**All of it, since Loft Links v1.177.0.** Until then this folder held the
engine, the kit and the seventeen worlds the World Tour plays in. It now holds
the whole of upstream's release s8f as it stands in the repository — all 471
worlds and their set pieces (`src/worlds`, `src/parts`), the rides,
companions, styles and page UI, the gallery thumbnails (`thumbs/`), the
design notes (`design/`), the release tools (`tools/`) and its `package.json` —
because Endless (`../../js/endless.js`) rides through every one of them, and
because the rest is worth having to hand. Two files are not copied as they
were: upstream's `README.md` is here as `README.upstream.md` (this file is
the README), and its `index.html`, the Portals site's own page, is left out —
it is not a page of this site and the site checks would rightly fail it.

`js/portal-worlds.js` is the registry (`src/worlds/index.js`) as plain data
for the classic scripts; `node golf3d/tools/portal-index.mjs` writes it. After
dropping in a newer release, run that and bump the game's version.

The World Tour's own holes are placed in seventeen of the worlds by
`js/portals.js → PLACES`.
