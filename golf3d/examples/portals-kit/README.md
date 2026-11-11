# Portals kit on three.js r128

A worked example, not part of the game: three pieces of the shared toolbox from
[emollick/ai-portals](https://github.com/emollick/ai-portals) — the sky and
clouds (`kit/sky.js`), a gull flock and a koi school (`kit/fauna*.js`) — running
on Loft Links' own vendored three.js **r128**. Open `index.html` over a local
server (modules do not load from `file://`).

## Attribution

The files in `kit/` are copied **unmodified** from `src/kit/` of
[ai-portals](https://github.com/emollick/ai-portals) by **Ethan Mollick**
(release s8f, 9 Nov 2026), written by AI agents under his direction, and are
used here under the
[Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International](LICENSE)
license (CC BY-NC-SA 4.0; the full text is in `LICENSE` beside this file).
This site is a personal, non-commercial portfolio. Anything derived from these
files must keep the same license and the same credit. Some pieces inside them
keep terms of their own (three.js and short shader functions under MIT, Hash
without Sine, Shadertoy caustics): see ai-portals' `THIRD-PARTY-NOTICES.txt`,
which is not copied here — read it upstream before borrowing further.

Everything else in this folder (`index.html`, `three-shim.js`, this file) is
this repo's own glue.

## How it works

- `kit/` imports `three` as an ES module; r128 only ships a classic script that
  sets `window.THREE`. `index.html` loads that script first, then an import map
  sends `three` to `three-shim.js`, which re-exports the names the kit uses
  from the global.
- r128 lacks three names that arrived later (`SRGBColorSpace`,
  `LinearSRGBColorSpace`, `NoColorSpace`); the shim declares them as their
  string values. That is the whole version gap for these files.
- The kit is the 11 files `sky.js`, `fauna.js`, `fauna/*` and `flora.js` need
  and nothing more; `water.js`, `terrain/` and the 713 world parts are not
  copied.
- To take more of the kit: copy its files unmodified, add any new `three` names
  to the shim, and run the page.
