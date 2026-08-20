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
| `level-editor.html` | Visual hole editor. See [The editor](#the-editor). |
| `editor/editor.js` | All of it. Runs on the game's own modules, owns no copy of any of them. |
| `editor/editor.css` | Sidebar chrome. The green in there is the game's renderer. |
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
    rough:   [ { x, y, w, h } ],         // half the roll of grass
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

There are four surfaces, and they are one lookup rather than a blend — sand
first, then ice, then rough, then grass. Rough is the one worth arguing for:
before it, a hole was binary, on the fairway or in the bunker, and the only way
to shape a line was to wall it in. Halving the roll costs a wide shot a stroke's
worth of distance and nothing more, which is what lets hole one teach you to
stay off the cushions without ever taking a stroke off you for it.

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

What remains is the power meter, which is a dial rather than a distance, and
which a keyboard player needs because they have no drag in their hand to feel.
Judging what the dial means in pixels is the game.

It is shown twice, on purpose. The ring around the ball is where the eye
already is; the bar under the board is the same value at ten times the size,
for the phone where your own thumb is over the ball. The bar sits *under* the
board rather than over it because as an overlay it always covered something
that mattered — pinned to the bottom it hid the ball on the hole teed off down
there, and flipped to the top it hid the cup on that same hole. Neither meter
carries a number.

The bar's gradient is laid across the whole track and clipped back to the
current power, not painted into a box that grows. Stretching one gradient into
a shrinking box repaints every level a different colour every frame — half
power would be red at half power and amber at full — and a meter whose colours
move is not a meter.

## The screen

The board is a fixed 960×640 world scaled to fit whatever room there is, on
**both** axes. It used to scale on width alone, which is right until the window
is wider than it is tall — then a 3:2 board sized to the width runs off the
bottom and you play the first two thirds of the hole. The smaller ratio wins
and the leftover space becomes letterboxing, which is why the stage centres its
canvas and paints its own background.

The height budget is the viewport minus the chrome above the board, the page's
own bottom padding, and the power meter. When what is left would squeeze the
board below 70% of its natural height, the keyboard hints and the hazard key
stand down and give it their pixels — on a 1440×700 laptop that is the
difference between a 595px board and a 780px one. The measurement of those
elements is cached from when they were last visible, because the decision to
hide them has to be answerable while they are `display: none` or it oscillates.

**Fullscreen** (the ⛶ button, or `F`) puts the wrap into the Fullscreen API —
the scoreboard is part of the game, so it goes too; the reference text does
not. The backing store is capped at three device pixels per world pixel, or a
4K monitor at `devicePixelRatio` 2 would ask for a ten-megapixel canvas sixty
times a second.

## The round in progress

Eighteen holes is a long sitting and a browser tab is a fragile place to keep
one, so the card is written to `miniGolf.round.v1` after every hole and the
game resumes there on load. What is not stored is the hole you were standing
on — no ball position, no stroke count, no clock for the moving gates.
Serialising the whole world would mean trusting it to still be legal after a
course edit; resuming at the tee of that hole is a rule that fits in a sentence
and cannot be wrong. You get the hole back, not the lie.

A stored card is discarded rather than trusted when it is corrupt, when its
index is off the end of the course, when the round never actually started, or
when it was written for a course with a different number of holes — which is
what happened to every nine-hole save the day this became eighteen.

## The editor

`level-editor.html` builds a hole by dragging rectangles about, and is linked
from the game's top bar. It runs on `config.js`, `physics.js` and `render.js`
directly, which is the whole design:

- **The green is the game's renderer.** `GOLF.render.frame` draws the editor
  canvas, so the picture is not an approximation of the hole — it *is* the
  hole, mower stripes, rake lines, swinging gates and all. There is no second
  drawing routine to drift out of step with the first.
- **Play mode is the game's integrator.** Toggle to Play and putt: same
  `advance()`, same constants, same slingshot drag, same water penalty. What
  is missing is the scorecard, because one hole is not a round.
- **The checks are the suite's rules**, ported one for one out of
  `tests.html` — thicknesses, post radii, tee and cup clearance, pinched
  posts, gates that stray off the field or seal it shut. Two of them the
  suite states as prose and measures rather than asserts per hole, and the
  editor runs them as well: that a ball left anywhere on a slope always comes
  to rest, and that a fan of full-power shots all settle inside
  `MAX_SHOT_SECONDS`. **+ Bot** is the suite's greedy bot, three attempts at
  the hole; it reports the strokes it needed, which is a decent first guess
  at par.

The slope check is worth a note, since it is the one the geometry cannot
answer. The rule — *a slope must not reach a cushion or a wall it can press
the ball against* — is about a failure the shape of the rectangles does not
show: a ball inside a slope zone is never counted as at rest, so a ball
pinned at the foot of one rattles there for ever and the hole never hands
itself back. Rather than guess, the editor drops a ball at nine points across
each slope and watches whether it ever stops. A slope with `ax` and `ay` both
zero fails it too, and should: nothing moves the ball and nothing lets it
rest.

Everything else is what you would expect. Drag a shape tool across the green
to draw one, drag it or its grips to reshape, snap at 1/5/10/20 with shift for
×5 and alt for off, undo the lot with Ctrl+Z. Moving walls show dashed ghosts
at both ends of their travel, which is the pair of positions that decides
whether a gate is a gate or a wall. Work in progress autosaves to
`miniGolf.editor.v1`; nothing else in the editor touches storage.

**Export** emits the hole in exactly the shape `courses.js` is written in —
the `r()` and `post()` helpers, `-Math.PI / 2` rather than `-1.571`, lists
left out when the hole does not use them — so it pastes straight into
`GOLF.COURSE`. **Import** reads the same thing back, with or without the
helpers, braces or a trailing comma. **Playtest** hands the hole to the game
through session storage and opens `index.html?playtest=1`, which swaps
`GOLF.COURSE` for that one hole before `game.js` boots. That round is scored
and shown but never written down: a one-hole round is three or four strokes
and would beat any real eighteen-hole record the first time anyone tried a
draft.

`level-editor.html?runTests=1` runs the editor's own tests — the export/parse
round trip over all eighteen shipped holes, the checks passing everything
that ships and catching three holes deliberately broken, and undo/redo. It is
a real feature linked from the game, so unlike `tests.html` it stays
indexable; the self-test overlay only appears with the query string.

## Tests

Open `tests.html`. 284 assertions covering geometry, the integrator, the four
surfaces, the course data, the scorecard and the resumable round, in about
750ms.

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

Two keys carry a round. `miniGolf.round.v1` is the one in progress, described
above; `miniGolf.save.v1` is the record — best round, that round's card, rounds
played and a running ace count. The landing page reads the record for the
card's stat chip. (The editor keeps its work in progress under
`miniGolf.editor.v1` and hands a playtest over in session storage under
`miniGolf.playtest.v1`; neither goes near either of them, and a playtest is
locked out of both the record and the round in progress — a one-hole round of
three strokes would otherwise beat any real eighteen-hole score, and starting
one would throw away the round you had going.)
Mute state lives separately under `miniGolf.muted`. Both writes are wrapped —
a browser with storage disabled should cost you your records, not your round.
