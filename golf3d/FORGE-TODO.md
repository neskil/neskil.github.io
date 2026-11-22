# The map forge — work in progress

A handoff for whichever session picks this up. The work is on branch
`ccr-852d36fc-74tmv7`, **not merged to `master`** (it is unfinished). Delete
this file when the forge has shipped and its contents are in README/HANDOFF.

## What the owner asked for (2026-11-22, in his words, condensed)

"Figure out a good technique to make maps from the Portals maps, so we can
create a bunch more; I'll later sort out which are good, you get that
feedback and adjust the technique." A **dev mode** where unapproved "new
maps" live; play them **systematically, one after another**, with a
**quick form after each** whose answers give good feedback for improving
the maps; saved in the browser (localStorage) with an **export**.

His answers to the four questions asked before starting:

| Question | Answer |
| --- | --- |
| How does feedback get back? | **A Copy button**: all feedback as text, pasted into a Claude chat. |
| Batch size | **12 maps** per batch. |
| Where do they live? | **A "Dev mode" switch at the bottom of the ☰ menu**; when on, a "New maps" entry. Normal players never see them. |
| Technique | **"Fit the world's shape"**: read each world's ground and lay the hole along its land (sculpted holes, like The Nave / The Sugar Gate), not placed mini holes. |

He said: once started, finish the task.

## The design

1. **`tools/forge-sample.mjs`** (written, works): loads a Portals world
   through the game in headless Chromium (borrows the `carnival` tour hole's
   page and swaps its world via a request intercept on `js/portals.js`; no
   file changes), works out the world's scale the way `backdrop.mjs →
   autoScale` does, and samples the ground (`G3.backdrop.groundAt`) over
   candidate patches: rectangles W × (back + L) golf units, origin `ahead`
   scale-units in front of the flight's point at `u`, +z along the flight's
   heading turned by `turn`. Try it: `node golf3d/tools/forge-sample.mjs
   hill-of-round-doors` (needs `python3 -m http.server 8899` at the repo root).
2. **`js/forge.js`** (written, not yet loaded anywhere or tested): DOM-free.
   Turns `G3.FORGE` data (from `js/forge-maps.js`) into holes with
   `G3.portals.world()`: a `ghost` fairway pad carrying the baked `grid`,
   inlays for tee, fairway strips and green, `place.at` for the exact anchor
   (backdrop sculpts the world to the grid automatically, render.js reads the
   grid off the ghost pad). Themes are Endless's stand-in palette with grass
   tinted to the world's tone. Registers `courseById('forge')` (the batch,
   in order) and `forge-<id>` (one map). Holds the dev switch
   (`loftLinks.devMode`) and the verdicts (`loftLinks.forgeNotes`, keyed
   `<batch>:<id>`), the form's choices (`ISSUES`, `VERDICTS`) and
   `exportText()`.
3. **`tools/forge.mjs`** (TO WRITE): the generator.
   - Pool: `G3.PORTAL_INDEX` minus worlds that have a tour hole, seeded
     shuffle; skip media `space` (no ground). Sample 3 at a time in parallel.
   - Per world: `samplePatches` with us 0.2–0.8 step 0.15, turns −0.5/0/0.5.
     Score a patch: misses ≤ 2%, relief in golf units near `recipe.relief`
     (start 1.6, accept 0.5–4.5), steepest cell slope after smoothing ≤
     `recipe.maxSlope` (0.55), flight ≥ 2 golf units over the tee.
   - Bake: golf height = (world − min)/scale + 0.1; `recipe.smooth` passes of
     a 3×3 blur; level the tee (r0 1.2, r1 2.2) at its own height.
   - Cup: candidates in the far part of the patch (z 0.55–0.92 L, |x| ≤ W/2 − 3,
     step 1.5); for each, level a green (r0 1.6, r1 3.2), build with
     `G3.forge.holeOf`, play `G3.bot.play(h, 10, bag)` and a narrowed
     `G3.lab.sweep` (`from/to` ±60° round the cup's bearing, step 4, 10
     weights, `moments: [0]`). Keep the cup whose ace share is nearest
     `recipe.ace` (0.3%) with the bot holing out; prefer `G3.lab.straight`
     null. Par 3 if the bot needs ≤ 2, else 4. Bag LOFT.
   - Strips: one or two fairway rectangles along tee → cup (paint only).
   - Deliberately vary the recipe across the 12 (length, relief, scale) and
     record the variation in each map's `gen`, so the feedback can say which
     settings win.
   - Write `js/forge-maps.js`: `G3.FORGE = { batch, recipe, maps: [{ id
     ('b1-01'…), title, world, u, at: { x, z, y, yaw, scale }, grid: { x0, z0,
     d, nx, nz, h }, tee, cup, par, bag, strips, gen, metrics }] }`.
   - Vet: every map holes out (bot ≤ par + 2), nothing stuck (the
     stuck-sweep recipe: shots from the tee, then try to escape every rest
     spot with `P.escapes`), cup level; look at each live
     (`?course=forge&hole=N&live=1`, the scratch `shot.mjs` recipe in the
     session: portrait 540×900, tutorial key `loftLinks.tutorial` = `done`).
4. **UI in `game.js` / `index.html` / `style.css`** (TO DO):
   - A `Dev mode` chip at the **bottom of the ☰ menu** (after the About fold
     in `#topbar-menu`), `aria-pressed`, toggles `G3.forge.setDev`.
   - When on: a `New maps` chip in `.tm-primary` (or the top of the menu)
     opening a modal `#forge`: batch number, a list of the 12 with status
     (rated verdict or "not played"), **Play next unrated** (loads course
     `forge` at `G3.forge.nextUnrated()`), **Copy feedback**
     (`navigator.clipboard.writeText(G3.forge.exportText())` with a
     select-the-textarea fallback), and Clear.
   - **The form**, modal `#forge-form`, opened when a forge hole is holed
     out, and from a **Rate / skip** button for a hole you give up on:
     verdict (Keep / Keep if fixed / Drop), Fun 1–5, Difficulty (too easy …
     too hard, 1–5), Looks 1–5, issue chips (`G3.forge.ISSUES`), a one-line
     note, strokes taken filled in. Save → `G3.forge.note(id, …)` → next
     unrated map. Big touch targets; it is played on a phone.
   - Hook: where the game advances after a hole (`game.js`, the function
     that calls `throughPortal(...)` / `loadHole(state.holeIndex + 1)` around
     line 3090): if `state.course.isForge` and no note yet, open the form
     first. `finishRound` should not write records for the forge course.
5. **Load order**: `js/forge-maps.js` then `js/forge.js` after `js/endless.js`
   in `index.html` (and `tests.html`). Bump the version on all four pages
   (`index.html`, `level-editor.html`, `turntable.html`, `hole-lab.html`)
   per `golf3d/CLAUDE.md`; only `index.html` needs the forge scripts.
6. **Tests** (`tests.html`, a FORGE section): every forged map builds, its
   tee and cup are on the ground, the cup is level, the bot holes out within
   par + 2; `exportText` includes each map; notes round-trip through
   localStorage. `ui-tests.html` must stay green with the new markup.
7. **Docs**: README (a "The forge" section: the technique, the recipe, the
   feedback loop and how to run a new batch), HANDOFF, this file deleted.
8. **Ship**: suites green, screenshots of the dev panel, the form and a few
   forged holes live, version bump, `--no-ff` merge to `master`, re-verify,
   push.

## The loop after shipping

The owner plays the batch, taps Copy feedback and pastes it to Claude.
Claude reads verdicts and issues against each map's `gen`, moves the recipe
(e.g. many `bumpy` → more smoothing, lower `maxSlope`; `edges` → wider paint
strips or a kerb; `long`/`short` → L; `flat` → higher target relief), runs
`node golf3d/tools/forge.mjs --batch 2`, and keeps any `keep` maps by moving
them into the World Tour (`portals.js`, a `PLACES` entry, its grid into
`tour-ground.js`).

## State at the time of writing

- Done: `tools/forge-sample.mjs` (tried on glider-country, hill-of-round-doors,
  chinar-water-terraces: works; relief ranges 0 to 6.7 golf units),
  `js/forge.js` (untested).
- Not done: everything from step 3 on.
- `master` is at v1.209.0 (three new tour holes, shipped earlier in the same
  session); the forge should go out as v1.210.0 or past whatever `master` has.
