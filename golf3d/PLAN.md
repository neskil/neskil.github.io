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

§6 is the same complaint from the other end and about the other twelve holes:
this one is that there is nothing standing on the table, that one is that the
long game's table has a visible edge.

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

## 6. The long game stands on a plinth

Every non-tee view on the turntable's sheets for Ashdown Park, Whinstone Links
and Dunmore Heath shows the same thing: a slab of country with a vertical edge,
standing two to three units above a flat plane of nothing. The graze view is
where it is worst — a green wedge on a tan floor, with the cut running the whole
width of the picture — and the tee view is the one angle that never shows it,
which is exactly why it survived this long.

`commons` already solved the version of this *inside* a hole: the margins belong
to the rows, so the country leaves the property at the height and tilt of the row
it continues and there is no step at the stakes. What it does not do is get from
there to `theme.surroundY`, and the drop is taken in one edge.

The fix is the same idea one ring further out — a **skirt**: the boundary
rectangle grown by some units, falling from the course's own edge height to the
surround over that distance, in the surround's material. `addSurround` already
builds a disc with relief on it and would be the place. Two things to watch: the
skirt has to read off the *edge* height rather than a single number, because a
hole that climbs four units has a different edge height on each side; and the
ridges (`addRidges`) are sunk `RIDGE_SINK` below the surround for a reason, so
raising the ground near the course must not lift their feet out of it.

The mini and crazy courses do not want this. A slab in the sea is the house
style there and reads as a model on a table on purpose — §1 is about what stands
*on* the table, not about hiding its edge.

## 7. Smaller things

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

- **The turntable, and the geometry audit** (v1.34.0). Eighty-four holes drawn
  from eight angles as fourteen contact sheets, with machine-checked findings
  printed under each row — README → "The pictures, which neither suite can see".
  It found three things and the suites could not have found any of them: thirteen
  ponds standing proud of the ground as slabs of water with four dark flanks
  (fixed — a pond gets a rim of the ground it is cut into), sixteen stones piled
  on other stones and two swallowed by the hump under them (fixed — `crags` rolls
  again rather than dropping a stone where one already is, and a prop grows
  rather than lifting where the ground rises across it), and §6 above, which is
  a design question rather than a fault.

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
