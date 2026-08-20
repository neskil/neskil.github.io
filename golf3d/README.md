# Loft Links

Three six-hole courses of 3D mini golf. three.js (vendored, r128), plain
ES5-flavoured JavaScript, no build step and no other dependencies — same as
everything else here, open `index.html` and it runs.

It is a deliberate sibling of [Pocket Links](../golf/README.md) next door: same
module split, same scoring vocabulary, same rule that the physics is pure and
lives in exactly one file. The difference is a third axis, and everything that
falls out of it — height, ledges, carries, and a bag of clubs to deal with
them.

## Files

| Path | What it is |
| --- | --- |
| `index.html` | Page shell: scoreboard, canvas, power/loft controls, banner, course picker, scorecard. |
| `style.css` | Page chrome. The course itself is all WebGL. |
| `js/config.js` | Every tuning constant. Nothing else holds a magic number. |
| `js/courses.js` | The eighteen holes, as data, plus the rail generator. |
| `js/physics.js` | The simulation. No three.js, no DOM, pure. |
| `js/scoring.js` | Scorecard arithmetic and the save file. |
| `js/audio.js` | Synthesised sound effects — no audio files to ship. |
| `js/render.js` | The only file that touches three.js. Procedural textures, no images. |
| `js/game.js` | Loop, input, and what a shot means. |
| `vendor/three.min.js` | three.js r128, vendored. |
| `tests.html` | Headless test harness. Open it; green is green. |

## The bag

Four clubs, in `config.js`. A club is a loft and a ceiling on power and that is
the whole of it — the simulation never hears the word "club", it is handed a
launch angle and a speed exactly as before.

| Club | Loft | Full swing | Carry | Total | What it is for |
| --- | --- | --- | --- | --- | --- |
| Putter | 0° | 8.5 | — | 6.9 | Rolls flat and true. Full power is still a tap, which is what makes it the club you can aim. |
| Driver | 4° | 22 | 3.7 | 19.2 | The reach club: nineteen units, and it skips off the tee on the way. |
| Chipper | 22° | 12 | 5.5 | 13.7 | Hops a rail — apex about half a unit — and keeps running. |
| Wedge | 42° | 10 | 5.5 | 11.3 | The high one: apex over a unit, clears anything the courses put in the way, and does not run far when it lands. |

Carry and total are measured on flat grass at a full swing, in world units.
They are the numbers the courses are built against, and the last column is why
the bag has four entries and not one: each club is longest at exactly one job.

Only the driver got the extra power when the swings were made bigger, and that
was deliberate: a wedge that carries eight units flies over the design of half
the course, and the bridges and ramps stop being choices. The carry figures are
a design constraint, not a curiosity: **no club flies much
past five and a half units**, so a hole asking for more air than that has to offer a way
round — a bridge, a ramp, a bank. `tests.html` measures the carry rather than
trusting this table, and the bot plays every hole out of this bag rather than
with any loft the physics would accept, so "the courses are solvable" means
solvable with the clubs a player actually has.

Picking a club keeps the power you had already pulled back, as a fraction of the
swing. Swapping mid-aim is meant to be a comparison, not a reset.

## The model, in one paragraph

A hole is a set of **pads** — axis-aligned patches of ground, flat or tilted.
While the ball is grounded it lives exactly on the pad under it and only x/z are
integrated: the height comes from the pad and the pad's gradient supplies the
acceleration, which is why a breaking green and a ramp are the same piece of
code. When the ground falls away — a ledge, the lip of a ramp, a lofted shot —
the ball goes **airborne**, gravity takes over, and it lands on whatever pad it
meets. **Walls** are boxes with a base and a top, so a ball above a rail flies
over it and one under a raised beam rolls beneath. The **cup** is a genuine hole
cut through the pad, with an edge to catch and a shaft to fall down. That is the
whole model, and it is small on purpose: circle-vs-box in the xz plane is the
one collision test cheap enough to run at 32 substeps and simple enough to be
obviously correct.

## How a hole is built

```js
{
    name: 'The Cannon', blurb: '…', par: 3,
    tee: { x: 3, z: 1.5 },              // y is filled in from the pad below
    cup: { x: 3.5, z: 12.6 },
    pads: [ pad(x, z, w, d, y, kind, sx, sz) ],   // the cup is cut into one of these
    water: [ rect(x, z, w, d, y) ],
    gaps:  [ rect(…) ],                 // where *not* to build a rail
    extra: [ wall(…), slider(…), spinner(…) ]
}
```

- **pad** — `kind` picks the friction: `green`, `wood` (bridges and ramps: slick,
  you carry your speed), `sand` (a bunker eats a shot), `rough`. `sx`/`sz` tilt
  it. Pads must not overlap unless one is clearly a bridge above another;
  two pads fighting for the same point would make the surface lookup depend on
  array order, and `tests.html` asserts they never do.
- **water** — a rectangle with a surface height. There is no pad above it, so
  the ball falls in: splash, one stroke, replay the shot from where it was
  played.
- **wall** — a box. `yaw` turns it, `move` slides it on a sine, `spin` rotates
  it. A `spinner` is a blade authored the way you think about it (middle,
  length, thickness); a `slider` is a gate.

**Rails are generated, not authored.** `enclose()` walks the boundary of the pad
union and puts a rail on every edge that has no neighbouring pad at roughly the
same height, so a hole is drawn by listing its floor and the fences follow.
Where a hole wants an open edge — a shoreline, a ledge, a drop — it lists a
`gaps` rectangle and no rail is built inside it. Getting this wrong is the most
likely way to break a new hole, which is why the tests check that the tee and
the cup are clear of walls and that the bot can still finish.

**Three rules a new hole has to respect**, all asserted in `tests.html` rather
than left to memory:

- **Something has to be on the line between the tee and the cup.** A wall, a
  hazard, a change of surface, a slope, a step, or ground narrow enough that
  missing costs you the ball. A hole you can finish by aiming at the flag and
  letting go is a corridor, not a hole. The test walks that line and says which
  of those it found, so a failure names the dud.

- **No wall thinner than 0.24 units.** Substepping caps ball travel at half a
  radius (0.08) per step, which is what stops the ball tunnelling through a
  wall. A thinner wall is outside that guarantee.
- **A moving gate or blade must let the ball past.** Not at every phase — a
  sweeper's whole job is to block the line and then move off it — but the tests
  walk the line each obstacle sits on at 24 phases of its cycle and require the
  way through to be open for at least a third of them, with a window wide
  enough to aim at.

One more, learned the hard way: an uphill ramp costs far more speed than it
looks. Rolling drag takes `-ln(k)` off the ball's speed per unit travelled
(about 1.2/unit on grass) and the climb takes `√(2gh)` on top, so a ramp at the
far end of a long run-up can be unreachable at full power. Put ramps near the
tee, or expect the hole to take two shots.

## The physics, and the things worth protecting

`advance(world, dt)` is the only integrator. The game loop calls it once per
frame with a real frame time; the tests call it at a fixed 1/120. It subdivides
whatever `dt` it is handed into steps small enough that the ball cannot cross a
wall between samples.

Nothing else may integrate. If the render layer or the game loop grew its own
copy, a dropped frame could change a score.

Details that are easy to get wrong and are pinned by tests:

- **Rolling costs `-ln(k)` of speed per unit travelled** — about 1.2/unit on
  grass. That is the number behind every distance in this game: a full driver
  at 17 runs out after some fourteen units, and a ramp at the far end of a long
  run-up may be unclimbable however hard you hit it.
- **Rolling uses the closed form of exponential drag**, not "decay the velocity,
  then move at the new velocity". The shortcut carries an O(dt) bias which the
  substep cap hides at speed and stops hiding below walking pace. With the
  integral, the same shot lands within 0.02 units at 30Hz or 120Hz.
- **A ball at rest on a slope is not at rest** — but a ball that has been slow
  for a while on one has found something to lean on, and is allowed to stop.
  Without the first half the ball hangs on a hillside; without the second, a
  shot on a tilted green never ends.
- **A moving wall's mesh comes from `physics.wallBox()`**, the same function the
  collision solver calls. The blade you see and the blade you hit cannot drift
  apart, however the movement is later retuned.
- **The clock runs while you aim.** Gates slide and blades turn whether or not
  the ball is moving, so the predicted path is drawn from the clock the shot
  will actually be played on.

## The cup

The cup is a hole, not a rule. There is no capture test, no radius that counts
as holed and no pull toward the middle — three pieces of geometry, and the rest
falls out of them.

- **The ground is missing.** `surfaceUnder()` hands back the floor of the cup,
  a cup's depth down, for any point inside the rim. A ball whose centre crosses
  the rim runs out of support and falls, exactly as it would over any other
  edge.
- **The rim is an edge**, not a circle drawn on the grass: the ball is a sphere,
  so what it can touch is the nearest point of the rim *circle*, and the
  collision is sphere-against-that-point.
- **The shaft is a cylinder** with a floor of its own, high-friction, so a ball
  that drops in settles instead of rattling.

Everything the old capture rule used to fake now happens on its own. A ball
whose centre is still outside the rim is resting on it and rolls past. A slow
ball crossing the rim drops, and the inside of the edge nudges it toward the
middle. A fast one is only a few centimetres down by the time it reaches the far
edge, catches it on the way through, and is thrown up and out — a lip-out
nobody wrote. "Holed" is then a statement about geometry: the ball is under the
rim and has not the vertical speed to climb back out.

Because none of it is tuned, the pace the hole accepts is a *measurement*, not a
setting — `tests.html` prints the range and would notice it changing. From ten
units out the cup currently takes about half the useful swing range, and
anything faster rides the lip.

Two consequences worth knowing:

- **The cup must sit clear of the edge of its pad** — the rim is a full circle
  in the physics and a hole punched out of one slab in the renderer, and a cup
  overhanging the edge of its pad would be neither. Asserted per hole.
- **The pin stands beside the cup, not in it.** A flagstick down the middle of
  a hole this size is something the ball ought to hit, and it would go straight
  through — better to put it where the lie is honest and the mouth is open. It
  is the one thing on the course that is scenery rather than simulation.

On a tilted green the liner is sunk vertically, so one side of the rim sits
proud of the grass. That is not a bug and it is not corrected: it is what a real
cup on a slope does.

## The strike

One gesture: press anywhere, pull *away* from where the ball should go, let go.
Two decisions make that feel like a catapult rather than a pair of sliders.

**Power is the length of the pull, not its vertical part.** Pulling in any
direction loads the shot, and the aim falls out of the angle for free — which is
a full turn of aim in one gesture, without ever touching the camera.

**The camera holds still for the whole pull.** It used to swing one-to-one with
sideways drag, which spun the world under your thumb at exactly the moment you
were trying to be precise; now it keeps the yaw it had when the pull began and
eases in behind the shot once the ball is away.

**One finger owns the shot.** The pull follows the pointer that started it and
no other, from press to release. A second finger landing while a pull is loaded
is ignored — it is almost always the hand holding the phone, and the pull it
used to throw away was worth more than the zoom it would have started. With
nothing loaded there is nothing to lose, so two fingers mean pinch, and the
pinch holds the input until every finger is off the glass, which is what stops
the aim jumping when one thumb comes up before the other. Anything that cancels
a pull — a pinch that takes it, a `pointercancel` from the system — puts the aim
back exactly where the pull found it, rather than leaving the meter stuck at the
number it died on.

**The aim line rides through one wall.** `previewPath` normally stops where the
shot stops being a shot — a landing, the water, the cup — because drawing the
whole roll would turn the game into a calculator. A rail is the exception: if
you are lined up against one then the rail *is* the shot, so the path carries on
through the first ricochet, the window opens 60% further to give the way out
room to be read, and the point where it turns is tagged. The renderer draws that
tag as a fat dot in the power colour and dims everything after it, so a bank
shot reads as two legs rather than one odd curve. A second wall inside the same
window is where honest prediction ends, and that is where it stops.

Everything else is feedback, and all of it is scaled by the same fraction of the
swing:

- a **band** stretching back behind the ball, the part of a catapult you can see
  straining;
- a **ring** round the ball that fills as the power winds on, green through
  amber to red;
- a **ratchet** — one tick per tenth — so a long pull *sounds* like a long pull;
- the **overswing mark** at 85%, past which the meter turns and pulses;
- on release, a **divot** of whatever the ball was sitting on, a **camera
  flinch**, and a strike with a low thump under it that only shows up on a big
  one;
- while the ball is quick, the camera **drifts back** and the lens opens a few
  degrees, and the ball drags a **tail** behind it.

None of that is in `physics.js`. The simulation is handed a yaw, a speed and a
loft exactly as it was before.

## The chrome

Everything the player can reach lives in `index.html` and is wired in
`game.js`; there is no framework and no state library, because there are about
a dozen pieces of state and they all fit in one object.

- **How to play** opens by itself on a first visit — before the course picker,
  which appears when the rules are closed — and after that lives behind the `?`
  button and `H`. The flag is one key in `localStorage`.
- **Fullscreen** (`F`, or the ⛶ button) goes fullscreen on the *stage*, not the
  document, so the canvas and every overlay inside it come along and the page
  chrome does not. The scoreboard above the canvas is gone in that mode, so a
  compact hole/par/strokes/distance strip appears inside the stage instead.
- **To cup** in the scoreboard counts down live while the ball rolls. It is the
  number the club choice is actually about.
- The **club bar** is generated from `CONFIG.CLUBS`, so a fifth club would need
  no markup and no CSS.

## Rendering

`render.js` is the only file that knows three.js exists. Everything it draws
comes from the same data the simulation reads: pads are boxes sheared by the
pad's own gradient (a shear keeps the vertical edges vertical, so a tilted pad
still meets its neighbours), and a pad's underside reaches the surrounding
ground so a raised green reads as a plateau rather than a slab in mid-air.
Boards are the exception and stay thin — a jetty should look like a plank, not
a causeway.

Textures are drawn into canvases at load: grass, sand, planks, rock, and an
opaque ripple map for water. No image files to ship and no requests to fail.
The green is the one surface the camera is always looking at, so it gets the
most attention — mow bands with a soft seam, broad mottling so the tiling does
not show as a grid, a mat of blade strokes, and a bump map of the same blades so
the light rakes across it. It is also the only surface on Phong rather than
Lambert; a little sheen is the difference between mown grass and green paint.
The ball gets its dimples the same way, as a hex grid of soft circles used as a
bump map — a few thousand triangles saved on the one object the camera is always
closest to. Each of the three courses is a theme: sky gradient, fog colour matched
to the horizon so the ground plane fades instead of ending in a line, sun angle,
palette.

The camera is never flown directly. It sits behind the ball looking down the aim
line, which is what makes "drag left, aim left" true from any angle, and
`V` lifts it to an overview that fits the hole's bounding box in frame.

## Tests

Open `tests.html`. 414 assertions covering the surfaces, the collision
geometry, the cup, the integrator, the bag, all eighteen holes of course data
and the scorecard, in about a second.

The one worth knowing about is the **bot**: a greedy player fans out candidate
shots on every hole, keeps the one that finishes nearest the cup, and plays all
eighteen. If a hole is sealed off, unreachable, or has a cup buried where
nothing can settle, the bot never holes out and the suite goes red. It runs off
a seeded PRNG, so a failure is reproducible rather than "sometimes red", it
plays out of the same four clubs the player gets, its candidates include a wait
before striking (the timing holes are only solvable with one, and a bot that
always fires at `t=0` would report a false failure), and a chosen shot has to
actually go somewhere — without that rule the greedy
player parks in a corner where every legal shot looks worse than standing still
and plays the same nothing until it runs out of strokes.

Being pure logic, `tests.html` needs no WebGL, no canvas and no AudioContext. It
is excluded from search results by both `robots.txt` and its own `noindex`, per
the rule in the root README.

## Saving

One key, `loftLinks.save.v1`: per-course best round, that round's card and
rounds played, plus a global round count and ace tally. Records are kept per
course because a personal best at Seaside Green says nothing about Windmill
Works, and merging them would just reward playing the easy one. The landing
page reads the same key for the card's stat chip. Mute state lives separately
under `loftLinks.muted`. Both writes are wrapped — a browser with storage
disabled should cost you your records, not your round.

## Controls

Drag back from the ball and let go; drag sideways to swing the aim, and the
camera swings with it. Keys: <kbd>←</kbd><kbd>→</kbd> aim,
<kbd>↑</kbd><kbd>↓</kbd> power, <kbd>1</kbd>–<kbd>4</kbd> club (<kbd>C</kbd>
cycles), <kbd>space</kbd> hit, <kbd>shift</kbd> for fine control, <kbd>V</kbd>
overview, <kbd>F</kbd> fullscreen, <kbd>R</kbd> restart the hole, <kbd>H</kbd>
the rules, <kbd>M</kbd> sound. Scroll or pinch to zoom.

## Query parameters

`?course=seaside|quarry|works` starts a round directly, skipping the picker, and
`&hole=1..6` jumps to a hole. Handy for screenshots and for linking someone at
the hole you are complaining about.
