# Loft Links

Three six-hole courses of 3D mini golf. three.js (vendored, r128), plain
ES5-flavoured JavaScript, no build step and no other dependencies — same as
everything else here, open `index.html` and it runs.

It is a deliberate sibling of [Pocket Links](../golf/README.md) next door: same
module split, same scoring vocabulary, same rule that the physics is pure and
lives in exactly one file. The difference is a third axis, and everything that
falls out of it.

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

## The model, in one paragraph

A hole is a set of **pads** — axis-aligned patches of ground, flat or tilted.
While the ball is grounded it lives exactly on the pad under it and only x/z are
integrated: the height comes from the pad and the pad's gradient supplies the
acceleration, which is why a breaking green and a ramp are the same piece of
code. When the ground falls away — a ledge, the lip of a ramp, a lofted shot —
the ball goes **airborne**, gravity takes over, and it lands on whatever pad it
meets. **Walls** are boxes with a base and a top, so a ball above a rail flies
over it and one under a raised beam rolls beneath. That is the whole model, and
it is small on purpose: circle-vs-box in the xz plane is the one collision test
cheap enough to run at 32 substeps and simple enough to be obviously correct.

## How a hole is built

```js
{
    name: 'The Cannon', blurb: '…', par: 3,
    tee: { x: 3, z: 1.5 },              // y is filled in from the pad below
    cup: { x: 3.5, z: 12.6 },
    pads: [ pad(x, z, w, d, y, kind, sx, sz) ],
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

**Two rules a new hole has to respect**, both asserted in `tests.html` rather
than left to memory:

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

The cup pulls the ball inward while it is over the rim and only captures below
`CAPTURE_SPEED`, which is what makes a slow ball on a bad line still drop and a
fast one horseshoe out the far side. There is a height test too, so a lofted
ball flying over the cup is not swallowed in mid-air.

## Rendering

`render.js` is the only file that knows three.js exists. Everything it draws
comes from the same data the simulation reads: pads are boxes sheared by the
pad's own gradient (a shear keeps the vertical edges vertical, so a tilted pad
still meets its neighbours), and a pad's underside reaches the surrounding
ground so a raised green reads as a plateau rather than a slab in mid-air.
Boards are the exception and stay thin — a jetty should look like a plank, not
a causeway.

Textures are drawn into canvases at load: grass with mow stripes, sand, planks,
rock, and an opaque ripple map for water. No image files to ship and no requests
to fail. Each of the three courses is a theme: sky gradient, fog colour matched
to the horizon so the ground plane fades instead of ending in a line, sun angle,
palette.

The camera is never flown directly. It sits behind the ball looking down the aim
line, which is what makes "drag left, aim left" true from any angle, and
`V` lifts it to an overview that fits the hole's bounding box in frame.

## Tests

Open `tests.html`. 322 assertions covering the surfaces, the collision
geometry, the integrator, all eighteen holes of course data and the scorecard,
in about a second.

The one worth knowing about is the **bot**: a greedy player fans out candidate
shots on every hole, keeps the one that finishes nearest the cup, and plays all
eighteen. If a hole is sealed off, unreachable, or has a cup buried where
nothing can settle, the bot never holes out and the suite goes red. It runs off
a seeded PRNG, so a failure is reproducible rather than "sometimes red", its
candidates include a wait before striking (the timing holes are only solvable
with one, and a bot that always fires at `t=0` would report a false failure),
and a chosen shot has to actually go somewhere — without that rule the greedy
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

## Query parameters

`?course=seaside|quarry|works` starts a round directly, skipping the picker, and
`&hole=1..6` jumps to a hole. Handy for screenshots and for linking someone at
the hole you are complaining about.
