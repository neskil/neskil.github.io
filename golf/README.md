# Pocket Links

An eighteen-hole 2D mini golf game. Canvas, plain ES5-flavoured JavaScript, no
build step and no dependencies — same as everything else here, open
`index.html` and it runs.

## Files

| Path | What it is |
| --- | --- |
| `index.html` | Page shell: scoreboard, canvas, banner, scorecard modal. |
| `style.css` | Page chrome. The course itself is all canvas. |
| `js/config.js` | Every tuning constant. Nothing else holds a magic number. |
| `js/courses.js` | The eighteen holes, as data. |
| `js/physics.js` | The simulation. No DOM, no canvas, pure. |
| `js/scoring.js` | Scorecard arithmetic and the save file. |
| `js/audio.js` | Synthesised sound effects — no audio files to ship. |
| `js/render.js` | All drawing, plus the (visual-only) particle system. |
| `js/game.js` | Loop, input, and what a shot means. |
| `tests.html` | Headless test harness. Open it; green is green. |

## How a hole is built

A hole is axis-aligned rectangles, round posts and two points:

```js
{
    name: 'Island Green', blurb: '…', par: 3,
    tee:  { x: 130, y: 320 },
    hole: { x: 780, y: 320 },
    walls:   [ { x, y, w, h, move? } ],  // solid; `move` makes it oscillate
    water:   [ { x, y, w, h } ],         // splash, one penalty stroke, replay the shot
    sand:    [ { x, y, w, h } ],         // heavy friction
    ice:     [ { x, y, w, h } ],         // almost none — ~3x the roll of grass
    bumpers: [ { x, y, r } ],            // round, and bouncier than a wall
    slopes:  [ { x, y, w, h, ax, ay } ]  // constant acceleration, i.e. a breaking green
}
```

A hole lists only the hazards it uses; a normaliser at the foot of
`courses.js` fills in the rest as empty arrays, so nothing downstream has to
ask whether a list exists.

`move` takes `{ axis, amp, speed, phase }`. On `y` it is a gate that rises and
falls; on `x` it is a door that slides. A door is worth one note: hang it so
the *shut* position is one end of its travel rather than the middle. A sine
spends most of its time near its extremes, so a door parked mid-swing over its
doorway is open almost always and the gate is scenery.

That vocabulary is deliberately small. Circle-vs-AABB and circle-vs-circle are
the two collision tests cheap enough to run at 24 substeps and simple enough to
be obviously correct, so the interesting shapes come from arranging boxes and
posts — a dogleg is one big blocker, an island green is a moat with a gap in it,
a pocket is six posts with one mouth — rather than from richer geometry.

The field is a fixed 960×640 world that the canvas scales to fit, so every
constant means the same thing on a phone and on a desktop.

**Four rules a new hole has to respect**, all asserted in `tests.html` rather
than left to memory:

- **No rectangle thinner than 20px, and no bumper under `BUMPER_MIN_R`.**
  Substepping caps ball travel at half a radius (~3.75px) per step, which is
  what stops the ball tunnelling through an obstacle. Anything smaller is
  outside that guarantee.
- **A moving gate must always leave a gap**, measured along the axis it travels
  on. It is easy to write an amplitude that seals the field shut at one phase of
  the sine and only fails for players with bad timing.
- **A slope must not reach a cushion or a wall it can press the ball against.**
  A ball at rest on a slope is not at rest (see below), so the rest check skips
  slope zones — and a ball pinned at the foot of one would rattle there for
  ever and never hand the hole back. Hole 7 ends its slope at the shoreline of
  the lake for exactly this reason.
- **Every full-power shot has to settle inside `MAX_SHOT_SECONDS`.** Friction is
  the only thing that ends a shot. Ice triples a roll and bumpers keep it alive,
  so the two together are where a hole could quietly stop being playable; the
  suite reports the slowest shot on the course.

## The physics, and the one thing worth protecting

`advance(world, dt)` is the only integrator. The game loop calls it once per
frame with a real frame time; the tests call it at a fixed 1/120. It subdivides
whatever `dt` it is handed into steps small enough that the ball cannot cross a
wall between samples.

Nothing else may integrate. If the render layer or the game loop grew its own
copy, a dropped frame could change a score.

Two details that are easy to get wrong and are pinned by tests:

- **Rolling uses the closed form of exponential drag**, not "decay the velocity,
  then move at the new velocity". The shortcut carries an O(dt) bias which the
  substep cap hides at speed and stops hiding below ~110px/s, where it quietly
  rolls the ball a couple of pixels short at 30Hz versus 120Hz. With the
  integral the same shot lands within 0.15px at either rate.
- **A ball at rest on a slope is not at rest.** The stop threshold has to
  exclude slope zones or the ball hangs on the hillside — which is the whole
  reason a slope may not reach something it can pin the ball against, per the
  hole rules above.

The cup pulls the ball inward while it is over the rim and only captures below
`CAPTURE_SPEED`, which is what makes a slow ball on a bad line still drop and a
fast one curl around the lip and come out the far side. A ball hit far too hard
runs straight past — and often rolls back in off the cushion, which is a feature.

One invariant the hazards are built around: **nothing may hand the ball energy.**
Every coefficient in the simulation is under 1, bumpers included
(`BUMPER_RESTITUTION`), because friction is the only thing that ends a shot and
the game loop has no timeout — it simply waits for the ball to stop. A bumper
that returned more than it received would let a ball wedged between a post and a
wall rattle for ever, and the hole would never return to the aim phase. There is
a test that watches every substep of a shot into a bumper and fails if the speed
ever ticks upward.

## Aiming

The arrow gives you the line. It is the same length at full power and at a tap,
and there is no trajectory preview.

There used to be one: the renderer cloned the world, ran 0.6 seconds forward and
dashed the ball's real path on screen, stopping at the first bounce. Between that
and a pull-back band drawn to the length of the power, the screen answered the
only two questions a golf shot is made of — how far will this go, and where does
it come off that wall. Both are gone, and `physics.previewPath` with them.

What remains is the arc around the ball, which is a dial rather than a distance,
and which a keyboard player needs because they have no drag in their hand to
feel. Judging what the dial means in pixels is the game.

## Tests

Open `tests.html`. 269 assertions covering geometry, the integrator, the hazards,
the course data and the scorecard, in about 700ms.

The one worth knowing about is the **bot**: a greedy player tries a fan of
candidate shots on every hole, keeps the one that finishes nearest the cup, and
plays the course. If a hole is sealed off, unreachable, or has a cup buried
where nothing can settle, the bot never holes out and the suite goes red. Its
candidates include a random wait before striking — the moving-gate holes are only
solvable with timing, and a bot that always fires at `t=0` would report a false
failure.

Three things keep it from being a "sometimes red" test nobody trusts:

- **A seed per hole**, not one stream down the course. Sharing a stream means
  editing the second hole reshuffles the shots every later hole is played with,
  so a change here turns a hole there red — a report about the PRNG, not about
  the course.
- **An escape from local minima.** Nearest-the-cup is greedy and a mini golf
  course is made of local minima: the wall you have to play away from, the moat
  you have to go round. When a turn buys no ground the bot takes an arbitrary
  candidate instead of the best one. Without it, the bot reports doglegs and
  island greens as unplayable, which is how Bank Shot and Island Green used to
  pass only by luck of the one shared seed.
- **A few attempts per hole.** The claim under test is that the hole is
  finishable, not that this bot is good at it. Three attempts took the false-red
  rate to zero over 360 randomised runs of the course.

Being pure logic, `tests.html` needs no canvas and no AudioContext. It is
excluded from search results by both `robots.txt` and its own `noindex`, per the
rule in the root README.

## Saving

One key, `miniGolf.save.v1`: best round, that round's card, rounds played and a
running ace count. The landing page reads the same key for the card's stat chip.
Mute state lives separately under `miniGolf.muted`. Both writes are wrapped —
a browser with storage disabled should cost you your records, not your round.
