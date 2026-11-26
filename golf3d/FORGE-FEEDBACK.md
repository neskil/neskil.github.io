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
| `edges` | couldn't see where the hole was | the hole needs marking. Since v1.214.0 a pin tag points at the flag (README → "Where the flag is"), and since v1.222.0 a forged map's tee, fairway and green are painted on the world (`paint`, README → "Batch 4"); if it still comes back, the next step is a kerb or posts — a code change, not a recipe number |
| `bumpy` | ground too bumpy | `smooth` up, `maxSlope` down |
| `flat` | the ground has no shape (until v1.229.0 the chip read "Too flat / boring" and was ticked for `dull` too: read old ones by their note) | `relief` up, `reliefMin` up — but see "What five batches taught" first: raising relief has never fixed a `flat` |
| `dull` | nothing to decide, no challenge (since v1.229.0) | not height: what the hole asks — `rough`/`fairwayW`, hazards a person reaches (`wet`), the cup by the bot with hands (`overPar`) |
| `layout` | the tee or the cup is in the wrong place (since v1.229.0) | `forge-finish --tee/--cup` on that map, or `pin`'s choice if it recurs |
| `long` / `short` | length | `L` down / up |
| `hard` / `easy` | difficulty | `ace` up / down (target ace share), `L`, `relief` |
| `clip` | clipping or floating | the world's things on the hole, which the ball rolls through: compare with `gen.clutter` (batch 2 on), raise or lower `stand`, `bump`, `lane` (README → "Clutter"). Since batch 4 the middles of them are hard (`solid`, `gen.solid`): a `clip` there is a trunk struck where nothing is drawn, or a crown rolled through. Otherwise a sculpt or anchor fault: `tools/forge-sculpt.mjs <id> --map` shows where the drawn ground leaves the played one, then look at that world live (`?course=forge-<id>&live=1`) |
| `fell` | the ball fell through the ground (since v1.229.0; before, a `clip` with a note) | a fault, never a recipe number. b4-06's was the patch's edge, where the played ground stopped and the drawn world ran on (`hole.edge` now). Find where with shots over every line and club, not only towards the cup (`vet()` only looks at where balls stop) |
| `stuck` | ball got stuck | a vetting gap: run the stuck sweep on that map and tighten `vet()` |
| `camera` | bad view | the tee's heading (`turn`) or `ahead`; perhaps prefer `turn: 0` |
| `paint` | the fairway or green paint looks wrong (since v1.229.0; before, `ugly`) | `render.js` → the plate's paint, which takes its colour from the world's own picture. Look at it on a dark, a bright and a busy world before shipping |
| `ugly` | the spot looks bad (until v1.229.0 also the paint: read old ones by their note) | the patch (`u`, `turn`) or the stand-in palette (`themeFor` in `js/forge.js`) |
| `mini` | better as mini golf here (since v1.229.0) | forge that world on a `mini` lean |
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

## What five batches taught

Standing lessons, from batches 1 to 4 and the copy that sent batch 4 back
(v1.229.0, the owner: "Lots of recurring issues, take some general
learnings please"). Read them before moving a recipe number: every one is a
loop that went round more than once before it was seen.

1. **Measure a hole by the bot with hands, not by the perfect bot.** All
   four batches came back `easy` or difficulty 1–2, and three recipe moves
   in a row (longer, steeper, stricter par) did not shift it. The reason
   was the measuring stick: cups were chosen for the perfect bot, which
   strikes every ball where it means to and played every par four of batch
   4 in two strokes, so it could not tell one cup from another. The bot with
   `CONFIG.BOT_HANDS` (`tools/human-check.mjs`) averaged 3.1 on every one of
   them. The forge chooses cups by it now (`hands`, `overPar`), and each
   map carries its average (`gen.hands`) and its balls wet or out a round
   (`gen.wet`). Read them against the owner's own cards: across batch 4 the
   owner averaged about one and a half strokes over the bot with hands
   (glowwood: five against 3.1) and still rated the hole difficulty 1, while
   the two they rated "right" were eights and nines. So their difficulty is
   felt in what the hole asks more than in the score, and relabelling par to
   what the bot scores (`honest`, tried and turned off: it made a 330-metre
   par three) answers the wrong question.
2. **`flat` and `easy` meant "nothing is asked", not "no height".** Relief
   went up three times; the steepest maps were drops. What asks something
   is a fairway worth hitting (`rough` off it since batch 5), hazards a
   person actually reaches — `gen.wet`, the bot with hands' balls wet or out
   a round, not the old `risk` share of tee shots fanned over every club,
   which read 9–27% on maps where a person found trouble 0.0–0.3 times a
   round — trunks, and a green with a reason to be where it is.
3. **The world is the draw: never paint over it.** The fun maps were the
   good-looking ones (fun 4 came with look 4–5), and anything foreign laid
   on a world reads `ugly`: batch 4's turf-green fairway came back ugly on
   six of nine maps. Colours come from the world's own picture now. Look at
   any change to the paint on a dark world, a bright one and a busy one
   (glowwood, the House of Four Seasons' snow, the Tree City's leaves), not
   on one.
4. **A copy plays about ten maps, from the top.** Batch 2's first copy
   played none, its second 5 of 17, batch 3's 13 of 20, batch 4's 9 of 21.
   So a batch is ten to fourteen maps; the fixes and the new recipe go
   first; a carried-over map is carried once: a map passed over unplayed
   twice is dropped (its world can still be forged again on a later recipe).
5. **A fix that comes back `fix` twice is not converging.** Glowwood, the
   Tree City, the House of Four Seasons, Red Sails and the moor were each
   re-forged two or three times and came back `fix` each time with a
   similar map. After a second `fix`, finish it by hand to what the note
   says (`forge-finish`), or retire it. A `fix` rated fun 2 or less with look
   2 or less is a drop in all but name.
6. **The patch is all the ground there is.** The world drawn round a hole
   runs on past its grid, and a ball rolled off the edge fell through it
   (b4-06, "Ball fell thru world": a third of tee shots over every line and
   club left that patch). It is out at the edge now (`hole.edge`). Any new
   assumption about where the ground is gets tested with shots in every
   direction, not only towards the cup.
7. **A note outranks a chip.** Chips were ticked for what was closest: `flat`
   for "no challenge", `ugly` for the paint. The form was split in v1.229.0
   (`dull`, `paint`, `layout`, `fell`, `mini`), and where a chip and a note
   disagree, do what the note says. If a kind of note keeps coming without
   a chip for it, add the chip (`G3.forge.ISSUES`): the owner has said the
   form may change whenever better feedback needs it.
8. **A world's water is not ground.** The sampler read a sea, a lake or a
   pool as ground whenever it was solid enough to draw, and the bed under it
   whenever it was see-through: Red Sails was played on its sea in batch 2
   (rated fun 1, three fixes, dropped), and the first run of batch 5 laid
   three of its five new maps on water — the Tower's sea, the Mountain's
   tarn (tee on the bed, under the water), the Chinar Terraces' pool. Since
   v1.229.0 `forge-sample.mjs` marks water (`wet`: Portals' kit names its
   water, most worlds name theirs, and a flat see-through shader sheet is a
   pool), and the forge treats it as the world's things: out where a ball
   stops, never under the tee, the green or the landing, and a patch more
   than `wetMax` (30%) water is turned down. If a forged hole still looks
   wet from the tee, its water is unnamed: look at it before shipping.
9. **Variety.** Since v1.229.0 about one map in four is a mini-golf hole in
   its world (the owner: "some of the new maps can be mini golf style for
   the worlds as well"), forged on a `mini` lean.

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
   why. Code changes (marking edges, the camera) are fine too. Before
   moving a number, check the lessons above: if an issue has come back after
   the number was moved once already, the number is probably not the cause.
5. **Forge the next batch**: `node golf3d/tools/forge.mjs --batch <n+1>`
   (needs `python3 -m http.server 8899` at the repo root, ~40 minutes), look
   at each map live, run the suites, bump the version, merge to `master`, push.
   Ten to fourteen maps (lesson 4), and check each new map's `gen.hands`
   against its par (lesson 1).
6. **Released-map notes**: fix what is broken, and add what is a design
   question to HANDOFF.md.

**When the batch comes back unplayed** (every forge line `(not rated)`, no
play stats, as batch 2's first copy did in v1.219.0): there is nothing to move
the recipe by, and forging replaces `js/forge-maps.js`, so the unplayed batch
would go with it. Keep the batch; do the released-map notes; a `fix` that is a
re-forge goes on the end of the batch as the next id (README → "Batch 2's
copy"), and say plainly that the batch is still waiting.

**When only part of it was played** (batch 2's second copy, v1.221.0: five
of seventeen rated, the first five): move the recipe by those, and forge the
next batch with the unplayed maps carried over by `--keep` — the same maps
under the same keys, so nothing waiting to be rated is lost — after the new
ones, so the new recipe is what is played first (README → "Batch 3").
A map that was carried over once already and is still unplayed is dropped
rather than carried again (lesson 4: batch 4 carried seven of batch 3's for
the second time, and none was reached).
