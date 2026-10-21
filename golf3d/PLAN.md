# Loft Links — open work, in order of impact

What is worth doing next and why, ordered by how much of it a player would
notice. Same job as [`car/PLAN.md`](../car/PLAN.md) does for the cost
calculator: a place for the ideas that came up while working on something else,
so they are not rediscovered from scratch every time.

The architecture, the authoring vocabulary and the verification recipes are not
here — they live in [README.md](README.md) and [CLAUDE.md](CLAUDE.md). This file
holds only what has *not* been done, plus the findings that would otherwise have
to be worked out again.

---

## 0. The course rehaul — approved, in progress

The props are good now and the holes under them are not: the owner's verdict
was "the long game is a bit boring, and some of the mini maps as well", and
every item below was agreed as the plan for it. Work them in order, one at a
time, each one merged before the next starts.

**How it is measured.** `node golf3d/tools/par-check.mjs` has the bot play a
course and prints its card. The bot is a perfect player (it never overdraws
and it picks its weight out of thousands of simulated shots), so its card is a
reading of a hole's *shape*, not of how hard it is for a person. What it showed
at the start (v1.61.0), and it was nearly the same with the old 6° driver:

| Course | Bot | Par | |
| --- | --- | --- | --- |
| Ashdown Park | 11 | 23 | −12 |
| Whinstone Links | 10 | 24 | −14 |
| Dunmore Heath | 13 | 24 | −11 |
| Redstone Canyon | 9 | 25 | −16 |
| Seaside Green | 7 | 20 | −13 |

Nearly every long hole is drive-and-putt: a full drive runs about 38 on a
fairway and more off the bluff tees, and the par 4s are 31 to 40 long. And
**Long Meadow's premise is broken** — "a belt of sand no club carries" — since
the 10° driver carries 19.

**The line for the long game:** the bot's tee shot on a par 4 leaves at least
eight units (an approach's worth) and on a par 5 at least twenty, and never
finishes on the green. `tests.html` holds every course in its `REBUILT` list to
that ("the drive leaves a real second shot"); a course joins the list on the
commit that rebuilds it. The card is *not* the line: a perfect player holes
approaches, and on a par 3 with an open front it rolls an ace in with exact
weight, so a rebuilt course still comes in around ten under.

**What Ashdown taught (v1.62.0), for the rest of the long game:**

- **Grass lands soft now** (`CONFIG.LANDING`, fairway and rough only). Before
  it, a drive's first hop was a third of its carry and cleared any hazard laid
  across a landing zone. Every distance on the long courses changed with it:
  a full drive is 31.5 on fairway and 24 out of rough (README → "Ashdown Park"
  has the table).
- **A bluff is worth ten units of carry.** Four units of fall turns 19 into
  about 30. Put the trouble where a drive *off that tee* comes down, and make a
  hazard across the line at least seven deep so the first hop does not clear
  it.
- **A row seam through an inlay, or a tree inside one, fails the suite** —
  "every inlay lies flush" and "nothing grows out of a bunker". Keep bunkers
  and greens inside one flat row, and treelines clear of every disc.
- **The fog now keeps the whole hole in clear air on a clear day**
  (`render.js → fogClear`), and the turntable's overhead views lift it the way
  the game's map does — so a plan view shows the hole. That was item 6.
- **From Dunmore (v1.63.0):** *an uphill fairway kills the driver* — on a
  climb of about 0.2 a drive lands almost at once and goes about 13 units, not
  30, so a climbing par 4 is three shots even for the bot; that wants a club
  or physics answer, not a layout one. *`ravine()` builds at absolute y = 0*,
  ignoring the row level, so the rows before one must finish at exactly 0.
  *Water goes in a `null` cell in a flat row*, its rect 0.4–0.5 under the
  lowest bank (tilt included). *A row with two fairways in it gets ruled edges*
  rather than a mown ribbon. And *the bot scores sand like fairway*, so a
  bunker stops a drive without shaping the bot's line — only water and a gorge
  do; a hole whose decision is a bunker is not measured by `par-check`.
- **From Whinstone (v1.64.0):** *a pond in a dogleg's corner can only be
  carried from a raised tee* — the line across a corner meets the water at a
  slant, so it crosses far more of it than the pond's own depth; a three-unit
  dune under the tee is worth about six units of drive. *Raise a links tee with
  a `hill` under it, not a raised row* — a row's `y` runs the full width and
  made a tabletop of the whole property. `moor` had been ignoring every hole's
  `grad` (fixed), and takes inlaid greens now. Still open, cosmetic: water is
  a hard-edged rectangle, which reads as a box on a links; a fairway row
  ending square against rough draws a dark ragged line from above.
- **From Redstone (v1.65.0):** *the canyon theme's desert plane sat at −1.1,
  above the canyon floors at about −2*, so every canyon read as a box a unit
  deep and a ball on a floor was invisible; `surroundY` is −2.7 now, in line
  with the other rock courses. *Water there has to fill a gap lip to lip*
  rather than sit on a floor (the audit calls that `water-over-land`). *A
  raised row cell is a true cliff* — `[17, rgh, MESA]` at 3.2 cannot be flown,
  which is what makes Redstone's dogleg real. *Bluffs are stronger than the
  rule of thumb above*: two units of fall already gives about 34 of carry,
  3.2 gives about 39. And *a drive that only just clears a canyon lands on the
  far bank's upslope and stops dead*.
- **The loop**: `tools/par-check.mjs <course>` for the shape, `tests.html` for
  the geometry, `tools/turntable.mjs <course> --views tee,plan,hero` for the
  picture. A hole takes a few rounds of all three.

### The long game

1. **Holes that fit the bag.** Lengthen the par 4s and 5s to what the driver
   now does (a par 4 around 50–60, a par 5 around 75–90), and put the trouble
   where a full drive lands rather than where a 6° skim used to stop. Fix Long
   Meadow's belt so it is a lay-up again.
2. **Real doglegs.** Nearly every hole points straight at the flag. A few
   genuine bends with something in the corner — trees, a canyon, water — so
   cutting it is a wager and going round it costs a shot.
3. **Two routes per hole.** A safe wide side and a short side past trouble.
   Redstone's *Long Way Round* and Ashdown's *Homeward* already do this, and
   they are the best long holes.
4. **More water.** Four of twenty-four long holes have any. A creek across the
   fairway at driving distance, a pond guarding one side of a green.
5. **Greens that differ.** Long thin ones, two-tier ones, raised ones, ones in a
   bowl (`dish`, the Punchbowl), ones behind a bunker, so each approach is its
   own shot.
6. **Less fog on a clear day.** From above, the haze makes every hole look like
   every other; the ground has shape now and the fog hides it.

Order of work: ~~Ashdown Park first, by hand, to settle the recipe~~ (done,
v1.62.0 — all six holes rebuilt: a burn across the landing zone on the
opener, Long Meadow's belt a lay-up again, The Elbow a real dogleg round a
pond, more water on four holes); then ~~Whinstone~~ (done, v1.64.0 — pots splitting
the landing zones, a burn across The Punchbowl, a long thin green on The
Sandhill, Burnside a dogleg round a pool, Elbow Point's green out on the
point), ~~Dunmore~~ (done, v1.63.0 —
the bells on Bell Heather, a dogleg over a burn on Gorse Corner, a long thin
green on The Beacon, an 87-unit Long Ling with a burn to lay up short of) and
~~Redstone~~ (done, v1.65.0 — a canyon where the drive comes down on First
Cut, a green strung along the lip on The Rim, a flooded canyon under Stone
Bridge, and Redstone a dogleg round a mesa no club clears). **All four long
courses are rebuilt and held to the drive line.**

### Mini golf

**Done first, and it was the biggest single fix (v1.66.0): mini golf has its
own bag.** Putter and mallet, plus the pitch and wedge on `needsLoft` holes
(`CONFIG.MINI_BAG` / `MINI_LOFT_BAG`). With the long game's bag the bot played
two dozen mini holes with the *driver* and flew the wedges over the designs.
Six holes were re-tagged to say what they are about. **Still open: Deadlift**
keeps the long bag and is flown with the driver against its own comment — with
the mallet the pads do lift a rolled ball a step at a time, but a greedy bot
runs past the second pad and jams on the riser; the hole wants redesigning so
the pad sits against the riser. Seaside's findings: the mallet's reach after a
bank (~10 units) is what sizes an ace line; a green slope over about 0.03 makes
a ball creep rather than stop; blurbs' left/right can be mirrored from what the
tee shows (Sea Legs' was).

7. ~~**Seaside Green**~~ (done, v1.66.0 — Harbour Gate replaces The Zigzag with
   one slow gate, The Bend's top leg is a slipway, every hole has an ace line;
   it still *looks* like flat rectangles, which §0's curved surfaces would fix).
   **Seaside Green is the plainest course and it is the first one.** Six flat
   rectangles with rails, no slope and nothing that moves. A gentle tilt on one
   green and one slow gate would give it life without making it hard.
8. **Single-trick holes** — The Letterbox, Bumper City, The Sweeper and others —
   get a second thing to read: a slope near the cup, a bank shot that saves a
   stroke.
9. **An ace line on every mini hole.** On most of them the right play is two
   safe putts; one risky line per hole that can drop makes every tee worth a
   go. §2's "the bot could prove a hole is ace-able" is the check for it.

### Next: curved surfaces — started (v1.67.0)

Built: curved ground (`trough` and `channel`: a hump's profile along a line or
round an arc, one code path in `padHeight`/`padGrad`, derivative-checked in
the suite) and curved rails (`arc`, chords of `bank`). **Halfpipe** on Quarry
is a real half-pipe now; v1.68.0 put a banked turn on Quarry's
**Switchback** (one `channel` shared by the ramp and the shelf, so the seam is
one surface) and made Apogee's **The Crater** one smooth bowl instead of a
nine-pad `bowl` — which also fixed its rails, stepped at three heights in the
owner's phone screenshot. A suite rule holds curved pads to meeting their
neighbours at every interior seam. Still to do: curved corners where a square
one reads as a diagram (an `arc` rail in the corners of The Bend, The
Horseshoe and the crazy courses).

The owner's ask after the rehaul. Every wall is a straight box and nearly all
ground is flat or a gentle hump, which is most of why a mini course reads as
rectangles from above. Wanted: **curved rails** (an arc a ball runs round, built
from short boxes or solved as a true arc), **banked turns** (a corner whose
floor rises toward the outside so pace carries a ball round it), and
**half-pipes / loops** where the ground itself curves. The physics already
solves rotated boxes and humped ground; an arc rail is the cheap first step,
and a banked floor is `padHeight` learning a curved profile.

### Then: Challenge mode (the owner's idea) — built (v1.70.0)

Six function surfaces dealt with random cups, a hover-platform tee, glass
floors, the neon theme with its grid and its own grade, and the effects
(sparks, light rings, a neon tail). README → "Challenge mode". Open: more
recipes (a spiral, a Möbius-ish twist, moving waves — `ph` driven by time is
one line in `fieldAt` and one in the bot's waits), a daily seed everybody
shares, and the deal's seed shown on the card so a good one can be replayed.

The original ask, kept for reference:

Weird mathematical surfaces — sine waves, ripples, saddles, wave
interference — with the cup placed at random on each play, and the shot taken
either from the surface or from a hovering platform above it. Tron or
vaporwave to look at: a dark ground drawn as a glowing grid, neon edges, a
sunset gradient sky. The pieces: a surface term that is a *function* rather
than a sum of humps (`padHeight` + `padGrad` learning `wave`/`ripple`/`saddle`
terms, the same way they learned spines), a seeded random cup that the bot
proves is reachable and that sits on ground that holds a ball, a platform tee
(a small raised pad with nothing under it), a theme of its own, and a mode in
the picker.

### After the rehaul

- **A more fun swing.** The meter and the gate work; they are not yet a thing
  people enjoy doing for its own sake.
- **Mini golf and the long game as two games.** They share one bag and one set
  of physics and they want different ones — the bot drives The Bend and The
  Zigzag with the *driver*. Separate bags (a mini bag of putter, pitch and
  wedge) and, where it helps, separate tuning (`ROLL`, `HOLD`, bounce) per
  group.

## 1. The picker is sized by its cards, not its clubs

`fitOpen` measures the block from the card's own `half` and `tail` — so the
card, not the club, is what the arrangement is fitting, and the head is the
entire thing being chosen between. v1.38.0 pushed further this way
on purpose: the figures on a phone were nine pixels tall, and a loft you cannot
read is not a reading, so the card grew and the grid card spends its width on
the numbers. The heads did not shrink — the scale is what it was — but the
ratio is now about 0.29 of card against 0.10 of head.

Worth trying: a **compact card** when the band the row is allowed is short —
the name and the colour chip only, with the loft and power drawings appearing
on the club under the pointer. That keeps "five clubs compared at a glance"
(which is the whole design) while letting the heads take the room back. The two
card shapes are already there to hang a third off (`CARDS` in `bag.js`).

## 2. Smaller things & feature backlog

- **The bot could prove a hole is ace-able**, not only solvable, on the holes
  where that is the design. Sea Legs is the first hole where the ace *is* the
  point, and nothing measures that it stays available.
- **The bag models pockets, a strap and a foot ring** that are below the bottom
  of the screen on every window anybody uses. Either move them into the band
  that shows or stop building them.
- **`tests.html` walks greens on a 0.3 grid** and misses peaks between samples
  (see §1). A finer grid, or sampling at each hump's own steepest radius.
- **Pass-and-play local multiplayer**: 2–4 players taking turns with color-coded balls.
- **1-click level editor sharing**: export custom holes as a compressed URL or snippet.

---

## Done recently

Kept short, and only where it explains a constraint above.

- **The showcase is what a new game plays** (v1.59.0) — README → "The
  showcase". One constraint worth keeping: **anything cached by course id and
  hole number has to be handed the hole's *home* course**, not `'showcase'`.
  The plans are cached that way, so hole 3 of one deal would have been drawn
  as hole 3 of the last; `game.js → holeRef` is the one place that answers it.

- **Mini golf is flat again** (v1.58.0) — README → "Relief on a drawn hole".
  `contour` is opt-in (`rolling: true`) and one hole asks for it. The humps
  were safe — the tests proved every rail and step stayed put — but safe is
  not a reason: a lane whose putt breaks for nothing the hole built is a lane
  with one more thing to read and nothing to read it off. A hole that wants
  ground to play has to say what the ground is *for*.

- **Every drawn hole has a world round it** (v1.57.0) — README → "The worlds
  round the drawn holes". Two placement findings worth keeping. **A prop's
  size counts at the camera corridor as much as at the hole**: the first pass
  kept every crater's *centre* out of the shot and a three-unit crater reached
  in anyway. And **landmarks go ahead, not round**: on a random bearing the
  lighthouse was behind the player on most holes, because a portrait phone
  sees a narrow wedge; and ahead but close, it filled the top of the frame —
  a mini hole is fifteen units long, so "a little beyond the flag" is still on
  top of you. Thirty to sixty units out is where they read as a skyline.

- **The long game came alive** (v1.56.0): hummocks in the rough, a dressing of
  props on every open hole, birds, ducks, butterflies and trees that sway —
  README → "The life on the long game". Two constraints worth keeping. **A
  hummock adds to whatever slope is already there**, and the first pass only
  asked about the row's tilt: one landed on a massif's flank and made rough a
  ball rolls off. Placement now asks the ground's own slope. **Generated props
  are not decor**: decor is authored and the editor shows it, so the dressing
  is a list of its own that the editor never sees and every build regenerates.
  Distance plates were tried and left out: they lie on the line of play,
  which is exactly where a non-solid thing is a lie. Still open: §1 above,
  the same life for the drawn holes, which wants a different answer (a model
  on a table does not have birds circling it).

- **Fairways are mown, not ruled** (v1.54.0). The seam between a fairway and
  its rough is a curve now (README → "mow"), on all four long courses. The
  constraint worth keeping: **a pad's x and w are still the cell it was
  written as**, and the curve lives only in the shared `west`/`east` edge.
  Widening the box instead looked simpler and would have broken three things
  at once — the plane `padHeight` hangs off `pad.x`, the editor's snapshot of a
  loaded hole (it copies rectangles), and every bounding-box overlap check in
  the audit and the suite. What is still square: the canyon cuts on Redstone,
  and the fairway edges that run along a cut or a lake, which keep their
  straight line on purpose.

- **The long game stopped being square** (v1.52.0). Two findings worth keeping.
  **The grass on a tilted terrain pad was tilted twice**: `addShells` sheared
  every shell by the pad's `sx`/`sz`, including the ones cloned from the
  terrain surface, which `padHeight` had already tilted. On every row written
  with a fall, half the mat sank under its own ground and the bare pad texture
  showed as a pale, hard-edged band across the hole — the "overlapping
  textures". Only the flat outlines get the shear now. And **an inlay has to be
  flush or it is a different surface**: every long-game green and bunker is an
  oval `inlay` now (README → "Round greens and oval bunkers"), and the reason
  three greens moved a unit or so is that their old rectangles had a rise in
  them, which a flat disc would have been buried under. Still square: the
  canyon cuts on Redstone, which are `ravine` rectangles.

- **Gathering greens, club telemetry, keyboard roving tabindex, ace banner, tee minimaps, and driving range** (v1.50.0).
  - Added `dish(cx, cz, outer, flat, depth, y)` constructor in `courses.js`
    to author nine-pad gathering greens with outer rims flush to the fairway and
    sunken flat floors around the cup, held within repose limits.
  - Added carry and total roll distances to `CLUBS` and `EXTRA_CLUBS` in
    `config.js`, displayed on 3D club cards in `bag.js` alongside a gold
    `BITE 78%` badge for the Checker.
  - Added roving `tabindex` and arrow key navigation (`ArrowLeft`/`ArrowRight`/
    `Home`/`End`/`Enter`/`Space`) across the open club picker with DOM stats readout.
  - Added celebratory "ACE!" announcement banner with gold trim and glow for
    1-stroke holes in one.
  - Added white tee box marker and red flag pin cup indicator on course picker
    minimaps in `minimap.js`.
  - Added full Driving Range sandbox practice mode (`G3.RANGE_COURSE`, id `'range'`)
    with distance markers, unlimited balls, toast shot telemetry, and dedicated scorecard view.

- **Visual decor system for course atmosphere** (v1.46.0). Added
  `decor(kind, x, z, y, opts)` and helper constructors (`buoy`, `piling`,
  `bench`, `boat`, `bin`) in `courses.js`, rendered via `addDecor` in
  `render.js`. Solid props (`tree`, `crag`) must stand on legal ground and
  collide with balls; decor props are purely visual, placed off the pads with
  an explicit `y` to dress the water and horizon. Initial decor seeded across
  Seaside Green (Sea Legs, The Bend, The Zigzag, Low Tide, The Horseshoe, The
  Jetty), and asserted in `tests.html`.

- **Two more courses: Apogee Yard and Redstone Canyon** (v1.45.0). A hundred
  and two holes now, and three findings worth keeping. **A ravine that runs
  *along* a hole cannot cross a row that climbs** — the cut is authored at
  absolute heights and a tilted row carries its level into the next one, so the
  lip ends up units below the fairway beside it and the canyon becomes a trench
  nothing escapes; height on those holes comes from the field, and a cross-fall
  is the one tilt safe to lay over a cut, because it lifts the canyon too.
  **A landform inside a tilted row spends the repose twice** — already written
  down for the parkland courses and it caught four holes here, one of them a
  hollow centred on a cup. And **a new theme needs its own weather list or it
  inherits the seaside's**, which put drizzle on the moon; the turntable, not
  the suites, is what showed that `golden` and `dust` photograph a lunar yard
  as a tan desert with a lawn on it.

- **Demo mode, and the caddie out of hiding** (v1.41.0). The page no longer
  opens on the course list: the bot plays a course under a title card until
  somebody touches something, and comes back to it when the list is left alone
  for `DEMO_IDLE` — README → "Demo mode: the game playing itself". Three
  constraints came out of building it and are worth keeping: a demo may only
  take back a screen with no stroke on it (so `idleReady` reads the round
  rather than the clock); nothing it plays may reach the card, which is why a
  demo course ends in `demoNext` and never in `finishRound`; and anything that
  gives a `hidden` element a `display` has to say `[hidden] { display: none }`
  too, or the element does not go away — the card sat over a live round for a
  release because of exactly that.

  Four things came out of watching it run. The caddie now winds up — the aim
  turns and the meter fills before it swings, and the plan is made for the
  world that wind-up will land in, so a gate's beat still holds. The demo has a
  camera of its own (`R.cam.mode === 'demo'`): stood back to hold the hole,
  turning slowly round it, walking towards the ball on holes too long to frame.
  The flyover's one cut is covered by a fade and its ease is smootherstep, both
  because the complaint about it was frame-to-frame speed rather than shape.
  And 🤖 Autoplay is an ordinary chip in the menu now: the typed code and the
  nine-hole unlock are gone, with `BOT_KEY`, `BOT_CODE` and `HOLES_KEY`.

- **The long game stopped standing on a plinth** (v1.42.0). An open hole's
  ground now falls away to the country around it over a bank whose length comes
  from its own height, read off the hole a bearing at a time. It was the last of
  the turntable's three findings below, held back as a design call rather than a
  fault; the call went the obvious way once two parkland sheets were put side by
  side. README → "The skirt" owns the two things it depends on.
- **The turntable, and the geometry audit** (v1.34.0). Eighty-four holes drawn
  from eight angles as fourteen contact sheets, with machine-checked findings
  printed under each row — README → "The pictures, which neither suite can see".
  It found three things and the suites could not have found any of them: thirteen
  ponds standing proud of the ground as slabs of water with four dark flanks
  (fixed — a pond gets a rim of the ground it is cut into), sixteen stones piled
  on other stones and two swallowed by the hump under them (fixed — `crags` rolls
  again rather than dropping a stone where one already is, and a prop grows
  rather than lifting where the ground rises across it), and the long game
  standing on a plinth, which was a design question rather than a fault and is
  the entry above.

- **Sea Legs is a bounce hole** (v1.32.0). One lane, one baffle in from the east
  rail, and a rail across the far corner at forty-five degrees that turns a
  north-bound ball due east onto the pin. It replaced a flat six-by-fifteen slab
  with two staggered bars — the plainest possible first impression of the game.
  §2 above is what stopped the first attempt, which was a punchbowl green.
- **The picker dims the course behind the clubs rather than in front of them**
  (v1.32.0), marks the club in hand with a halo and a card of its own, names
  each club's number key on its card, and stands the row three quarters round so
  the faces are visible.
- **The card is the thing you press, and it is legible on a phone** (v1.38.0).
  `pick` measures the card's own rectangle rather than answering only to the
  head above it; the cards hang from the shaft at one height instead of from
  five differently-shaped heads; the arrangement is chosen by measuring every
  shape the bag could take rather than by halving until something fits; and the
  shot controls stand down while the picker is up, which is most of the bottom
  third of a phone held sideways. §3, §4 and §5 are what is left.
