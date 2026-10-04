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
