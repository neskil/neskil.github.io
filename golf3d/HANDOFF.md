# Handoff — the World Tour, where it stands

For whoever picks this up next. It is the state of one long piece of work —
the World Tour: golf holes played inside worlds from Ethan Mollick's Portals —
written at the point it was handed over (v1.158.0). The rules of the repo are
in [`../.agents/AGENTS.md`](../.agents/AGENTS.md) and [CLAUDE.md](CLAUDE.md);
how everything works is in [README.md](README.md) → "The World Tour". This
file is only: what the owner has asked for, what he said about each thing he
played, what is known to be unfinished, and how to look at any of it. Delete
it when its list is empty.

## What the owner wants, in his words

He plays on a phone (portrait, 60–120 fps with a live world) and sends
screenshots. His standing asks, each quoted from a message:

- "find striking places in the worlds and sculpt unique golf holes onto them",
  some long, some short; "ensure that the courses melt in with the world, and
  feel free to also edit the worlds."
- "The new maps didn't impress me in their design" → every hole needs one
  thing only it does, **and a skill ceiling**: "simple and hard to ace. No
  skill ceiling / challenge" was his verdict on a hole where every tee shot
  finished on the same spot.
- "the mini maps are easier to fit within the world as backgrounds" — a small
  placed hole standing in a world reads well; a big hole draped on terrain is
  where every bug has been.
- "too much out of bounds white markers" on the old courses; he liked a hole
  whose shape is the land's.
- "some animation would be cool if it triggered by passing some checkpoint" —
  done once (the Marble Run's dominoes); he would like more.
- The picker "from a gaming perspective": one level-select grid, new and old
  maps equally pickable, big touch targets.

## Every tour hole, and the last thing said about it

| Hole (`?world=`) | Kind | State |
| --- | --- | --- |
| The Butter Knife (`breakfast`) | placed | "completely broken" (v1.157.0): it stood in the toast rack, and after The Sugar Gate the cloth was still pressed to that hole's shape. Now placed exactly on a clear patch of cloth (`place.at`, scale 1.4) and a world is un-sculpted between holes. **Not yet seen by him.** |
| Across the Shell (`turtle`) | sculpted | "a lot better geometry wise but still hard with all the hills and a bit weird geometry between the hills that you get stuck on". The line of play is groomed now (`tools/groom-ground.mjs`), the dip filled. **Not yet seen.** |
| Balloon Hop (`gasgiant`) | placed | "clipping the geometry": it sat in the cloud deck. Lifted clear (`lift`). **Not yet seen.** |
| Slack Water (`abyss`) | placed | "too easy with pitch and impossible with mallet. Needs redesign, but world background is cool." Redesigned: two currents across the line and a slack bank between; putters only. **Not yet seen.** |
| The Sugar Gate (`table`) | sculpted, `press: false` | "cool and works, but a little off with the table cloth going up on the things on the table". The cloth is no longer pressed, the green is off the teapot. **Not yet seen.** |
| The Marble Run (`attic`) | placed, has an event | Redesigned in v1.157.0 with the hatch and the dominoes. No word since. |
| Loop and Rink (`carnival`) | placed | "This kind of world was cool… worked okay at least in its placement, but still a little bugged." The river ice is flat at 0 with banks at 3 — a sculpt candidate. |
| The Iron River (`ironriver`), The Nave (`nave`) | sculpted | Not played since the merge was rebuilt (v1.157.0). The fairway paint reads as a grey road on the forge. |
| The Fairy Ring, The Orrery, Three Doors Down, The Three-Body Problem, Deck to Deck, The Forge | placed | Never commented on. Each should be measured with `tools/tee-sweep.mjs` for the Marble Run's fault (every cell the same). `spore-rain` gives almost no ground to `world-ground.mjs`, even with `--any`. |
| Five new worlds (below) | placed | A single pass, written and measured but **never looked at on a phone**. |

## How a hole and its world are joined — the three attempts

1. Sheets laid over the world: hovered. 2. Half-transparent sheets ("veils"):
still hovered. 3. **v1.157.0, what is there now:** the world's ground is moved
to the hole's baked heights (`backdrop.mjs → sculpt`), instanced props are
cleared off the strips, tee and fairway are paint in the plate shader
(`render.js → addWorldPlate`, the decals), only the green is drawn. v1.158.0
made that reversible (`unsculpt`), because two holes share the breakfast
table, and added `place.press` (off for a laid table) and `place.reach` (how
far land may be moved, for a groomed hole).

What follows from 3, and is the main lever now: **the bake no longer has to
match the world, the world is made to match the bake.** So a sculpted hole can
be *designed* — groomed, levelled, a dip filled — and the picture follows.
The limits: only broad, upward-facing, non-instanced meshes are moved; a
shader-displaced surface (the turtle's sea, the gas giant's clouds) is not.

## Known faults and loose ends

- Fairway paint is a rounded rectangle per pad, six at most.
- `R.liveK` adapts by frame rate; on the owner's phone it now holds full
  resolution. If a world looks blocky again, it is that (README → "The
  world's resolution follows the frame rate").
- The live checks here ran on SwiftShader at 1–2 fps. Nothing in the suites
  sees a live world. **His phone is the only real test**; ship small and ask.
- The hole editor does not know any of this, by his decision.
- `spore-rain`, and any world whose ground is a shader: no bake.
- The carnival's river and the kelp trench both have more hole in them.

## How to look at things

```sh
python3 -m http.server 8899                      # repo root; it dies now and then, curl it first
node golf3d/tools/world-shot.mjs /tmp/s turtle '{"dist":9,"pitch":0.46}' '{"dist":40,"pitch":0.8}'
node golf3d/tools/world-shot.mjs /tmp/s attic '{"dist":12,"pitch":0.5}' play     # the world's event
node golf3d/tools/tee-sweep.mjs abyss mallet 1 9 0.5 25    # where every line and weight finishes
node golf3d/tools/shot-path.mjs attic putter 82 0.7 6      # one shot, point by point
node golf3d/tools/portal-check.mjs abyss                   # caddie's card, ace share, verdict
node golf3d/tools/world-ground.mjs table --any             # a world's ground as a height map
node golf3d/tools/bake-ground.mjs …                        # → js/tour-ground.js + the place.at
node golf3d/tools/groom-ground.mjs turtle --print          # the baked plan; --path … to groom
```

`?world=<id>&live=1` opens one hole in its world and pins the resolution.
`G3.backdrop.debug()` gives the anchor and scale; `G3.backdrop.info.sculpt`
how many vertices moved and props cleared. A tee-sweep table in which every
cell is the same number is a hole with no skill in it; a diagonal band of
small numbers with ACE inside it is one with a line to find.

To add a Portals world: copy `src/worlds/<id>.js` and `src/parts/<id>*.js`
from upstream release s8f into `vendor/portals/src/` unmodified, list it in
`vendor/portals/README.md`, add the hole, a theme and a `PLACES` entry in
`js/portals.js`, and a `SCENES` alias in `js/worlds.js` (the fallback set
piece — a test insists on one).

## The owner's ideas waiting their turn

- **The transition between worlds** (asked after v1.159.1): "improve the
  transition animation. Perhaps the camera can sweep down into the hole
  (which is portal-esque) and play the current animation to hide the
  loading between worlds." What happens now: on the sink, `throughPortal`
  closes the stage on the next world's sky (`.portal-wipe`), and
  `holdForWorld` keeps it closed with the next hole's name until the world
  is drawn (up to 20 s). The idea: on the sink the camera dives down the
  cup — the cup is the portal — and the dive hands over to the existing
  wipe, which then hides the build. Pieces: a camera path in `render.js`
  from the seat to just under the cup's lip (the flyover's machinery,
  `flyover.js`, already flies keyed paths); a dark disc over the cup as the
  "inside"; and the wipe's opening as the arrival.
- **Preloading:** only the next world's *files* are fetched, 4 s into the
  current hole (`holdForWorld` → `backdrop.fetch`); nothing is built in
  advance, so the wait between holes is the build itself (a few seconds
  on a phone). Building the next world while this one plays would mean two
  worlds in memory and the frame rate of both at once. A cheaper step: start
  the build at the sink, during the celebration and the dive, so the wipe
  has less to hide.

## What I would do next, in order

1. Send him the five fixes above and wait for the phone.
2. Sweep the six never-commented placed holes for a skill line; redesign any
   that is flat, one per merge, the way the Marble Run and Slack Water were.
3. A second world event (the carnival's skater, the forge's hammer, the
   library's orrery are all on the world's clock already: `place.event`).
4. Sculpt the carnival's river: ice at 0, banks at 3, and the fair along it.
5. Fairway paint from a polygon or a distance field instead of rectangles.

## Five new worlds

Chosen from Portals' 471 for being small places with one strong object in
them — the kind he said fits — and each hole is one mechanic the tour did
not have. Designs first; what was actually built is in `js/portals.js`.

| Hole (`?world=`) | Portals world | The one thing |
| --- | --- | --- |
| **Shoot the Rapids** (`rapids`) | `paper-boat-rapids` | A river that runs *with* the shot and faster than a putt: three reaches, each quicker, and the green is a still pool off the last one. Too little and the river takes you past it over the fall; the putt is aimed at the bank above the pool and the water does the rest. |
| **The Level Crossing** (`railway`) | `attic-railway` | A straight putt over two tracks with a train on each, running opposite ways at different speeds. One gap is easy to time; both in one putt is the ace. |
| **Île Flottante** (`custard`) | `islands-in-custard` | Meringue islands (fast) in custard (very slow, not out). Island to island round the long way, or straight through the custard with everything you have. |
| **The Stepped Side** (`pyramid`) | `pyramid-of-khufu` | Four courses of stone, each a ball-drop higher, with a ramp on alternate ends. Run the ramps and it is a zig-zag of three putts; pitch a course at a time; or one wedge to the cap, which is two metres square. |
| **Dry Dock** (`drydock`) | `moon-in-dry-dock` | A sixth of a g. One pitch across the dock from gantry to gantry that hangs for four seconds, to a deck with a back wall to play off. Everything goes six times as far as the hand expects. |

## After the handoff was written

- **The Orrery** (`orrery`): "borderline cruel" — three arms at three
  speeds covering the whole table, the hub on the straight line, the edge
  of the table off the world. Rebuilt in v1.160.0: one arm hinged at the
  spindle that swings over to the right and back (`A.flipper` with `hinge`),
  a rim of kerbs round the table, the flag right of the hub. Measured over
  seven moments of the swing (the scratch `moments` recipe: `G3.lab.sweep`
  with `moments: [0..6]`), aces come only while the arm is on the left.
  `portal-check` samples two moments and calls it a closer (0.06%); the
  open half of the swing is nearer 0.5%. **Not yet seen by him.**
- **The Fairy Ring** (`mushroom`): "quite broken also" — on his phone the
  flight search put the hole under a fallen leaf and inside a mushroom's
  gills. Pinned to `u: 0.9`, a clear patch by a log (scale 0.5). A world
  with no `u` is searched for a spot, and the search can land differently
  on another device; **pin `u` on every placed hole** the same way when it
  is next looked at.
- **The five new worlds** are in (`rapids`, `railway`, `custard`, `pyramid`,
  `drydock`), with the Portals files copied unmodified. Measured with the
  tools but not looked at live, and each still wants its `u` pinned after
  a look (`world-shot.mjs`, or the scratch recipe: load `?world=<id>&live=1`,
  `Object.assign(G3.render.state.place, {u: …}); G3.backdrop.reanchor()`).
  All five were loaded live once (SwiftShader) and build and look right;
  `u` is pinned on four, `pyramid` is not yet. Île Flottante became a
  chipping hole (custard is sand) because no surface is slow and still
  playable — a real `custard` surface would need a FRICTION entry and a
  texture. The rapids', custard's and pyramid's ace shares are 0: the bold
  lines are within a yard in a tee-sweep but want a pin moved to hold them.
