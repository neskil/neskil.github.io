# Pocket Links

A nine-hole 2D mini golf game. Canvas, plain ES5-flavoured JavaScript, no build
step and no dependencies — same as everything else here, open `index.html` and
it runs.

## Files

| Path | What it is |
| --- | --- |
| `index.html` | Page shell: scoreboard, canvas, banner, scorecard modal. |
| `style.css` | Page chrome. The course itself is all canvas. |
| `js/config.js` | Every tuning constant. Nothing else holds a magic number. |
| `js/courses.js` | The nine holes, as data. |
| `js/physics.js` | The simulation. No DOM, no canvas, pure. |
| `js/scoring.js` | Scorecard arithmetic and the save file. |
| `js/audio.js` | Synthesised sound effects — no audio files to ship. |
| `js/render.js` | All drawing, plus the (visual-only) particle system. |
| `js/game.js` | Loop, input, and what a shot means. |
| `tests.html` | Headless test harness. Open it; green is green. |

## How a hole is built

A hole is axis-aligned rectangles and two points:

```js
{
    name: 'Island Green', blurb: '…', par: 3,
    tee:  { x: 130, y: 320 },
    hole: { x: 780, y: 320 },
    walls:  [ { x, y, w, h, move? } ],   // solid; `move` makes it oscillate
    water:  [ { x, y, w, h } ],          // splash, one penalty stroke, replay the shot
    sand:   [ { x, y, w, h } ],          // heavy friction
    slopes: [ { x, y, w, h, ax, ay } ]   // constant acceleration, i.e. a breaking green
}
```

That vocabulary is deliberately small. Circle-vs-AABB is the one collision test
cheap enough to run at 24 substeps and simple enough to be obviously correct, so
the interesting shapes come from arranging boxes — a dogleg is one big blocker, an
island green is a moat with a gap in it — rather than from richer geometry.

The field is a fixed 960×640 world that the canvas scales to fit, so every
constant means the same thing on a phone and on a desktop.

**Two rules a new hole has to respect**, both asserted in `tests.html` rather
than left to memory:

- **No rectangle thinner than 20px.** Substepping caps ball travel at half a
  radius (~3.75px) per step, which is what stops the ball tunnelling through a
  wall. A thinner wall is outside that guarantee.
- **A moving gate must always leave a gap.** It is easy to write an amplitude
  that seals the field shut at one phase of the sine and only fails for players
  with bad timing.

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
  exclude slope zones or the ball hangs on the hillside.

The cup pulls the ball inward while it is over the rim and only captures below
`CAPTURE_SPEED`, which is what makes a slow ball on a bad line still drop and a
fast one curl around the lip and come out the far side. A ball hit far too hard
runs straight past — and often rolls back in off the cushion, which is a feature.

## Tests

Open `tests.html`. 147 assertions covering geometry, the integrator, the course
data and the scorecard, in about 200ms.

The one worth knowing about is the **bot**: a greedy player tries a fan of
candidate shots on every hole, keeps the one that finishes nearest the cup, and
plays the course. If a hole is sealed off, unreachable, or has a cup buried
where nothing can settle, the bot never holes out and the suite goes red. It
runs off a seeded PRNG, so a failure is reproducible rather than "sometimes
red", and its candidates include a random wait before striking — the
moving-gate holes are only solvable with timing, and a bot that always fires at
`t=0` would report a false failure.

Being pure logic, `tests.html` needs no canvas and no AudioContext. It is
excluded from search results by both `robots.txt` and its own `noindex`, per the
rule in the root README.

## Saving

One key, `miniGolf.save.v1`: best round, that round's card, rounds played and a
running ace count. The landing page reads the same key for the card's stat chip.
Mute state lives separately under `miniGolf.muted`. Both writes are wrapped —
a browser with storage disabled should cost you your records, not your round.
