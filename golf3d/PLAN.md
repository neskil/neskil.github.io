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

## 1. A drawn hole has nothing around it

A mini golf hole is a slab of green floating in the sea with an entirely empty
horizon. The long game has trees and rocks and looks like a place; the twenty-four
mini and crazy holes look like a model on a table, and the first one anybody
plays is the worst case of it.

**Why it is not just a matter of adding `crag()` calls.** Two assertions in
`tests.html` close that door, and both are right:

- *"every tree and rock stands on the ground under it"* — `surfaceTop` returns
  nothing off the pads, so anything placed in the water fails outright.
- *"nothing grows or stands out of a bunker or a green"* — so it cannot go on
  the hole either.

Between them, scenery on a drawn hole has nowhere legal to stand, and that is
the correct answer for `tree` and `crag`, which are **solid** — they are things
the ball hits. What is missing is the other kind: a **`decor` list** of props
that the renderer draws and the simulation has never heard of, placed off the
pads with an explicit `y` (there is no ground under them to be seated on). A
buoy, a marker post, a rowing boat pulled up on the shallows, a bench, a bin, a
bucket of range balls. `bag.js` is the precedent — a whole file of things drawn
but not simulated — and the test above would then say what it means: *solid*
scenery stands on the ground, decor does not have to.

The long game's version of this — a table with a visible edge — is now the
skirt (README → "The skirt"). This one is the other half and the harder half:
there is nothing standing *on* the table.

## 2. Mini golf cannot have a gathering green

A punchbowl — a low rim all round the cup, so a ball with the right weight
gathers and a hot one comes back off the far side — is the most satisfying
thing in mini golf and is currently unbuildable at this scale. Two constraints
collide:

- `CUP_FLAT` is 1.25 and the test holds it to 1e-9, so a rim hump of radius `r`
  has to stand at least `1.25 + r` from the pin, and it reaches `1.25 + 2r`
  the other way. The green has to be about `2.5 + 4r` across before a rim fits
  on it at all.
- Height comes from `a` and gradient from `a·π/2r`, and `contour` has already
  spent 0.075 of the 0.18 a green will hold. So the rim has to be shallow *and*
  wide, and a mini green is not wide.

Measured on a 7.4 x 7.2 green with `ring(cup, 2.45, 1.05, 0.075, 9)`: the rim
is 0.08 tall — a quarter of a ball — and the worst gradient anywhere on the
green is already 0.189, over the 0.18 a green holds. (The suite passes it: that
check walks a 0.3 grid and steps over the peak. Worth tightening on its own
merits.)

`bowl()` is not the answer either — it is an *island*, its outer rim standing
proud of whatever is beside it, which is what Tidewater's crater wants and what
a green blended into a lane does not. What is missing is a **`dish`**: the same
nine-pad trick, but with the rim at the height of the ground it meets and the
floor sunk below it, so it can be laid into a lane without a step.

## 3. The picker is sized by its cards, not its clubs

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

## 4. The card says loft and power; the courses are built on carry

README → "The bag" says it outright: carry and total on flat grass are the
numbers the holes are designed against, and the two figures on the card are
loft and full swing. A player deciding whether a wedge clears the water is
being shown neither of the numbers that answer it.

And `bite` — the checker's whole reason to exist, the one club that lands and
stops — has **no representation anywhere on the card**. A club whose entire
point is invisible in the picker is a club nobody will choose on purpose.

## 5. The clubs are not reachable from the keyboard, only *by* it

The number keys take a club, and that is now on every card. But the open row
itself has no keyboard model: no focus, no arrow-key walk along it, nothing a
screen reader can move through. The DOM panel above describes whichever club is
under the *pointer*, so with no pointer there is nothing to describe. A roving
tabindex over a list of five buttons, mirrored to `bag.setHover`, would make the
picker as usable as the rest of the chrome.

## 6. Smaller things

- **An ace should say so.** Hole one is now built to be holed in one and the
  banner does not distinguish it from any other birdie.
- **The course-picker plans do not show the tee.** `minimap` draws the ground
  and the cup; where you start is half of reading a hole from the picker.
- **The bot could prove a hole is ace-able**, not only solvable, on the holes
  where that is the design. Sea Legs is the first hole where the ace *is* the
  point, and nothing measures that it stays available.
- **The bag models pockets, a strap and a foot ring** that are below the bottom
  of the screen on every window anybody uses. Either move them into the band
  that shows or stop building them.
- **`tests.html` walks greens on a 0.3 grid** and misses peaks between samples
  (see §2). A finer grid, or sampling at each hump's own steepest radius.

---

## Done recently

Kept short, and only where it explains a constraint above.

- **Two more courses: Apogee Yard and Redstone Canyon** (v1.44.0). A hundred
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
