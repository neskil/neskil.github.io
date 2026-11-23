# Forge feedback — what to do with it

For Claude, when the owner pastes a block starting `FORGE FEEDBACK`. It is
copied out of Loft Links (☰ → Dev menu → Copy new) from their
phone, where they played the forge's batch of new holes and rated each one, and
possibly some released holes too. The technique, the recipe and the tools are
in [README.md → "The forge"](README.md#the-forge-new-tour-holes-made-by-a-tool-and-rated-in-dev-mode).
Read that first, and `golf3d/CLAUDE.md` for how work ships (merged to
`master` and pushed: they can only see what is live).

## Reading the block

One line per map:

```
b1-03 · <title> · <world> · par 3 · gen {L, relief, got, slope, u, turn, scale, smooth} · <verdict> · fun 4/5 · difficulty 2 · look 3/5 · took 3 (par 3) · issues edges,bumpy · note: …
```

From batch 2 on the id is followed by the map's rating key, e.g.
`b2-03 [forge:1x9k2ab]`: a hash of everything the map is, so a map that has
changed since it was rated is a different map with a different key, and a
rating is always about the version that was played. Batch 1's maps are
keyed `1:<id>`.

- **verdict**: `keep` (move it into the World Tour), `fix` (keep it, but the
  issues and note say what is wrong), `drop`.
- **fun / look**: 1–5. **difficulty**: 1 too easy … 3 right … 5 too hard.
- **issues**, each named for what it moves:

| Issue | Means | Move |
| --- | --- | --- |
| `edges` | couldn't see where the hole was | the hole needs marking (nothing is painted on a sculpted world). Since v1.214.0 a pin tag points at the flag (README → "Where the flag is"); if it still comes back, the next step is a kerb, posts or a painted edge — a code change, not a recipe number |
| `bumpy` | ground too bumpy | `smooth` up, `maxSlope` down |
| `flat` | too flat, boring | `relief` up, `reliefMin` up |
| `long` / `short` | length | `L` down / up |
| `hard` / `easy` | difficulty | `ace` up / down (target ace share), `L`, `relief` |
| `clip` | clipping or floating | the world's things on the hole, which the ball rolls through: compare with `gen.clutter` (batch 2 on), raise or lower `stand`, `bump`, `lane` (README → "Clutter"). Otherwise a sculpt or anchor fault: `tools/forge-sculpt.mjs <id> --map` shows where the drawn ground leaves the played one, then look at that world live (`?course=forge-<id>&live=1`) |
| `stuck` | ball got stuck | a vetting gap: run the stuck sweep on that map and tighten `vet()` |
| `camera` | bad view | the tee's heading (`turn`) or `ahead`; perhaps prefer `turn: 0` |
| `ugly` | paint looked wrong | the palette (`themeFor` in `js/forge.js`) |
| `nice-spot` | great place in the world | keep forging from that kind of world and that `u` |

- `RELEASED MAPS` lines rate holes already in the game (`released:<course>:<n>`
  is `courseById(course).holes[n]`, e.g. `world-maelstrom:0`): treat them as
  bug reports and design notes on those holes, the way HANDOFF.md's list is.
- `(older)` lines are earlier batches still in their browser.
- Lines may end with play stats (`played 3 · best 2 (-1) · avg 2.7 · gave up 1 ·
  cards 4,2,x`): what they actually scored there, across every play.
- A copy carries only notes not sent before (the header says how many were
  left out); a forge map already sent shows as `(sent already: <verdict>)`.
  Don't treat a missing note as a change of mind.

## What to do

1. **Sum it up for them first**: what they liked and why, what failed, which
   recipe settings (`gen`) the keeps and drops share. Two or three lines a
   map at most.
2. **Keeps** → the World Tour. A keep's note usually still asks for
   something; do it first with `tools/forge-finish.mjs` (README → "Finishing
   by hand": move the cup or tee, flood a hollow, measure), whose `--tour
   <id>` writes the grid and prints the place and pads. Then: the map's `grid` into `js/tour-ground.js`
   (`G3.TOUR_GROUND['<id>']`), a `PLACES` entry (`world`, `u`, `at`, `reach`)
   and a hole in `js/portals.js` built like The Nave (a `ghost` pad on the
   grid, inlays), a palette in `THEMES` and a `SCENES` alias in
   `js/worlds.js`. Give it a real name and blurb, and run `tools/portal-check.mjs`.
3. **Fix** → do what the note says to that map: by hand with
   `tools/forge-finish.mjs` when it is the cup, the tee or water, or re-forge
   that world (`--first <ids>` puts it at the head of the next batch) when it
   is the length or the ground. A fixed map is a new map with a new key, so it
   comes back in the next batch to be rated again rather than going straight
   into the tour.
4. **Move the recipe** by what the issues say (table above), in `RECIPE` in
   `tools/forge.mjs`, and write down in README → "The forge" what changed and
   why. Code changes (marking edges, the camera) are fine too.
5. **Forge the next batch**: `node golf3d/tools/forge.mjs --batch <n+1>`
   (needs `python3 -m http.server 8899` at the repo root, ~40 minutes), look
   at each map live, run the suites, bump the version, merge to `master`, push.
6. **Released-map notes**: fix what is broken, and add what is a design
   question to HANDOFF.md.
