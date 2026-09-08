# Pocket Links

A 2D mini golf game with four courses on one field — an eighteen, a six and
two nines — plus a fifth that is generated from a seed and is different every
time you ask for one.
Canvas, plain ES5-flavoured JavaScript, no build step and no dependencies —
same as everything else here, open `index.html` and it runs.

## Files

| Path | What it is |
| --- | --- |
| `index.html` | Page shell: scoreboard, canvas, banner, scorecard modal. |
| `style.css` | Page chrome. The course itself is all canvas. |
| `js/config.js` | Every tuning constant. Nothing else holds a magic number. |
| `js/courses.js` | Every hand-built course, as data. |
| `js/generator.js` | Courses dealt from a seed. See [The draw](#the-draw). |
| `js/physics.js` | The simulation. No DOM, no canvas, pure. |
| `js/scoring.js` | Scorecard arithmetic and the save file. |
| `js/audio.js` | Synthesised sound effects — no audio files to ship. |
| `js/render.js` | All drawing, plus the (visual-only) particle system. |
| `js/game.js` | Loop, input, and what a shot means. |
| `level-editor.html` | Visual hole editor. See [The editor](#the-editor). |
| `editor/editor.js` | All of it. Runs on the game's own modules, owns no copy of any of them. |
| `editor/editor.css` | Sidebar chrome. The green in there is the game's renderer. |
| `tests.html` | Headless test harness. Open it; green is green. |

## The four courses

`GOLF.COURSES` is a rack of cards, each `{ id, name, blurb, holes }`, and
`GOLF.COURSE` is whichever one is being played. Everything downstream — the
loop, the scorecard, the editor, the suite — reads `GOLF.COURSE` and never
learns there was a choice; `GOLF.selectCourse(id)` is the one place that
changes, and it answers `null` for an id that is not on the rack, which is
the whole handling a stale stored preference needs.

Only the *first* position on the rack is load-bearing. The card at the head
of it keeps the bare save keys (see [Saving](#saving)), so moving something
else to the front would quietly take over a record a player already has.
Everything else about the order is taste: the eighteen, then the short card,
then the two that assume you have played one of the others.

- **The Old Eighteen** is the course this game has always been: one idea per
  hole on the front nine, the same vocabulary played straight at you on the
  back.
- **The Short Six** is the card for the twenty minutes you actually have.
  Par two or three all the way round, nothing hidden, the whole of every hole
  visible from the tee — a wide gate, a bunker sat on the straight line, a
  causeway with a rink in front of it, one slow bar to time, a gentle tilt,
  and a close that puts three of those together. It is the one to hand
  somebody who has never played the thing.
- **The Tidewater Nine** puts water on all nine, which is the only hazard
  that does not slow the ball or push it about — it takes the shot off you
  and asks for it again. That makes it a course about weight rather than
  about lines, and it is why the crossings are wide: ninety pixels at the
  tightest and mostly a hundred and twenty, because a hole that punishes a
  miss with a stroke cannot also demand a thread. The two slopes on it drain
  into rough rather than into the lakes, for the same reason nothing else
  does — a hazard with no shot in it is not a hazard, it is a tax.
- **The Wild Nine** assumes you have played it. Nothing new is in the
  vocabulary — a room whose only door faces the far cushion, a lattice of
  posts with no straight line through it, two hills breaking opposite ways,
  bars that sweep the fairway, a zigzag of bridges, a green that sheds
  everything you leave on it, a staircase funnel, an iced slalom, and one of
  everything to close. What *is* new is which of the physics they lean on:
  a moving wall does not only block, it pushes (physics.js adds the wall's
  own velocity along the contact normal, so a gate cannot swallow a resting
  ball), and Wiper Blades is the first hole to make that the point rather
  than a safety valve.

Three of those nine started out with a free way round the obstacle they were
built on — over the top of the funnel, up the side lane of the lattice, along
the cushion past the wipers. None of them is walled off. They are all lined
with **rough** instead, which is the same answer hole one gives: the short
line has to be earned, the long one costs a stroke's worth of roll and
nothing more.

**The die deals a card you did not choose.** The 🎲 chip (or `D`, or
`?course=random` as a link) picks a course off the rack at random and starts
it. It never deals the one already under you — a press that changed nothing
would read as a broken button rather than as luck — so it goes through
exactly the path the picker does and lands you on the same tee a refresh
would: a random *choice*, not a random *round*.

**A course switch is not destructive and does not ask.** Each course keeps
its own round in progress and its own record, under keys qualified by the
course id — see [Saving](#saving) — so leaving one mid-round and coming back
puts you on the tee of the hole you left, which is the same promise a refresh
makes. Six holes, nine and eighteen are not comparable totals, which is the
other half of why the save file is split: a six-hole round would take the
eighteen-hole record the first time anyone played one.

## The draw

`generator.js` deals a ninth-hole card nobody has played: nine holes built
from a seed, legal by construction, and checked before they are handed over.
The ✦ chip (or `G`) deals a new one; `?seed=<base36>` deals a named one, and
so does anything else you put in that parameter — `?seed=birthday` hashes to
a seed like everything that is not one already. The seed is shown in the
tagline and remembered, so a refresh gives you the course you were playing
rather than a new one.

Three decisions carry the design.

**A hole is a line with bands across it.** Every generated hole is built in a
frame — an *along* axis running tee to cup, a *cross* axis at right angles to
it — and every feature is a band laid across the cross axis somewhere along
the way. That is not a limitation of the vocabulary, it is what makes the
result playable without simulating it: a band that always leaves a mouth in
it can always be got through, so a hole made of such bands has a way from the
tee to the cup by construction rather than by luck. It also means a feature
is written once and works four ways — the along axis runs left to right,
right to left, up the field or down it, and nothing inside a builder knows
which.

Each builder is also handed *where the straight line from the tee to the cup
crosses its band*, which is the difference between a hazard and scenery. The
ones that block put themselves on that line (a bunker, a dogleg's blocker,
two posts to be putted between); the ones with a way through put their mouth
beside it, far enough that the straight shot does not simply go through the
gap and near enough that the answer is a correction rather than a different
hole. The first draft ignored the line, and it produced nine fields with
something interesting happening in the corner of each.

**Rules are checked, not remembered.** `GOLF.validateHole` is the rule book
out of `tests.html` — thicknesses, post radii, tee and cup clearance, gates
that stray off the field or seal it shut — as a function rather than as a
page of assertions. The generator runs it on every hole it builds and
re-rolls the ones that fail. The suite runs *the same function* over the
shipped rack, which is the pin that stops the two drifting apart: break a
rule in one place and both go red. A `strict` pass adds what a hand-built
hole is allowed to argue with and a generated one is not — nothing solid
inside a slope zone, a collar of rough wide enough to catch what a slope
sheds, no cup or tee on a hill. Crown Green puts the cup inside its own
crown and means it; a generator doing that by accident is a hole that never
comes to rest.

**One feature per hole, dealt from a shuffled deck.** There are nine
features and nine holes, and each is used exactly once, which is what
guarantees a card carries every hazard the game has. Drawn independently, a
draw with no water on it would turn up sooner or later — and that is a field,
not a course. Trimmings (a collar of rough, a bunker, a rink, two posts) are
drawn freely on top, up to three bands a hole; a hole played up the field
gets one, because after the tee and the cup have had their clearance there
is one band's worth of room left in 640px.

Par is counted rather than played: the length of the hole, how many bands
are on it, and whether any of them is one of the four that really cost a
stroke. Running the bot at boot to measure par would be a second and a half
of a phone's time to learn what arithmetic already knows.

**A draw is not a course you can hold a record on.** No two of them are the
same field, so a best round across them would measure which seeds were kind
rather than who played well — the card says `record: false` and the game
reads that off the card rather than off a list of ids. The round in progress
*is* kept, because losing an evening to a refresh is a different thing, and
the seed goes into the stored round: a card written for one draw is never
offered to the next.

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

**Four rules a new hole has to respect** — on either course; a rule the second
course is exempt from is a rule the second course will break — all asserted in
`tests.html` rather than left to memory:

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
  integral a substep is exact at any dt, and the only difference left between
  30Hz and 120Hz is *when the ball is noticed to have stopped* — bounded by one
  frame at `STOP_SPEED`, which is 0.47px, and asserted at exactly that rather
  than at a round number that happened to hold.
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

The arrow gives you the line, and a faint ray runs on from its head to the edge
of the field. There is no trajectory preview.

There used to be one: the renderer cloned the world, ran 0.6 seconds forward and
dashed the ball's real path on screen, stopping at the first bounce. Between that
and a pull-back band drawn to the length of the power, the screen answered the
only two questions a golf shot is made of — how far will this go, and where does
it come off that wall. Both are gone, and `physics.previewPath` with them.

What went too far was the replacement: an arrow of exactly one length made a
gentle tap and a full swing look identical, and lining a putt up across a 960px
field off a 100px arrow asked the player to extend a line by eye that the screen
could simply draw. So two things came back, neither of them a prediction:

- **The ray**, which is pure direction. It does not stop at a wall, because
  where the ball comes off a wall is the question the hole is asking.
- **A little length.** The arrow runs 54px to 108px while the ball rolls up to
  1250px — a twelfth of the scale of the thing it is hinting at, on a
  square-root curve that spends most of its travel in the bottom half of the
  dial where the touch shots live. You can see that this shot is harder than
  the last one. You cannot read a distance off it.

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

Both meters carry two more marks. Quarter ticks, because a bar with nothing on
it can be read as "some" and "a lot" but not as "just over a third". And a gold
mark at **the weight of your last shot on this hole** — without a number on the
dial, "a bit harder than that one" is the only language the player has for
weight, and this is what gives them it. The mark is as often under the bright
fill as beyond it, which is why it is gold with a dark halo rather than gold:
one colour has to read against everything the bar can put behind it.

## The overswing

The dial runs past what you can control. Everything up to `SAFE_POWER` goes
exactly where the arrow points and is the whole of the old game — 1080 coasts
about 1180px, more than the 960px field, so every hole stays reachable in one
clean shot. The last fifth is borrowed distance: 1400 reaches about 1530px and
pays for it in accuracy, `physics.spread` opening from nothing at the line to
±0.13rad — about 7.5°, or ±52px over a 400px carry — at the top.

Three things make it a choice rather than a trick:

- **The curve is quadratic**, so the boundary is not a cliff. A quarter of the
  way into the overswing costs under a tenth of the full spread; the last
  sliver costs everything.
- **The cone is drawn before you commit**, to scale, in the moment you are
  deciding how far to pull — and the meters mark where the safe zone ends, on
  the ring and in hatching on the bar.
- **The draw bunches in the middle.** `scatter` squares the signed offset, so
  half of all shots land inside a quarter of the cone. A uniform draw would put
  the ball on the edge as often as on the line, which reads as the game taking
  the shot away from you rather than as a shot you did not quite control.

The randomness lives in the *caller*, never in `physics.js`. `spread(power)`
and `scatter(power, u)` are both pure — `u` is a uniform sample handed in — so
the game draws from `Math.random`, the bot from its seeded PRNG, and the tests
from whatever they need to prove. Nothing downstream of `launch` knows a die
was rolled, which is what keeps the integrator's determinism, the frame-rate
tests and the reproducible bot intact. The bot overswings on the same terms the
player does: one with a truer stroke than the game allows would sign off holes
that are only finishable by a shot nobody can reliably play.

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
one, so the card is written to the round key after every hole and the game
resumes there on load — one key per course, so switching cards mid-round
leaves each of them where it was. What is not stored is the hole you were standing
on — no ball position, no stroke count, no clock for the moving gates.
Serialising the whole world would mean trusting it to still be legal after a
course edit; resuming at the tee of that hole is a rule that fits in a sentence
and cannot be wrong. You get the hole back, not the lie.

A stored card is discarded rather than trusted when it is corrupt, when its
index is off the end of the course, when the round never actually started, or
when it was written for a course with a different number of holes — which is
what happened to every nine-hole save the day this became eighteen. That last
check is a belt to the braces of the per-course keys rather than the thing
that separates the two cards: a card from the Wild Nine is never offered to
the eighteen in the first place, because it is not under the eighteen's key.

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
round trip over every shipped hole on every course, the checks passing
everything that ships and catching three holes deliberately broken, and
undo/redo. It is
a real feature linked from the game, so unlike `tests.html` it stays
indexable; the self-test overlay only appears with the query string.

## Tests

Open `tests.html`. 645 assertions covering geometry, the integrator, the four
surfaces, the overswing, the course data on every course, the generator, the
scorecard, the per-course save keys and the resumable round, in about two
seconds.

The generated courses are held to the shipped ones' standard and then some.
Twelve fixed seeds — fixed, because a suite that fails one run in fifty is a
suite nobody believes — go through the strict rule book, the hazard-coverage
rule and the par check; eight of them are played by the bot, hole by hole,
and six are shot at from every angle to prove that nothing generated hangs,
escapes the field or ends up inside a wall. The shipped rack is run through
`GOLF.validateHole` in the same section, which is what keeps the generator's
copy of the rules and this file's copy honest with each other.

Everything about the course data is checked for every course on the rack, not
for whichever one `GOLF.COURSE` points at — a rule the second course is exempt
from is a rule the second course will break. The hole counts themselves are
pinned rather than derived — by course id, not by rack position, since the
order is taste and the length of a card is not — because the stored round is
validated against them: changing one has to be a deliberate edit in two
places.

The one worth knowing about is the **bot**: a greedy player tries a fan of
candidate shots on every hole, keeps the one that finishes nearest the cup, and
plays the course. If a hole is sealed off, unreachable, or has a cup buried
where nothing can settle, the bot never holes out and the suite goes red. Its
candidates include a random wait before striking — the moving-gate holes are only
solvable with timing, and a bot that always fires at `t=0` would report a false
failure.

Three things keep it from being a "sometimes red" test nobody trusts:

- **A seed per hole**, not one stream down the course — and per hole *within*
  its course, so adding a whole second card does not reshuffle the eighteen.
  Sharing a stream means editing the second hole reshuffles the shots every
  later hole is played with, so a change here turns a hole there red — a report
  about the PRNG, not about the course. The three checks that do share a stream
  (resting position, shot length, escapes) walk the rack in order with the
  eighteen first, for the same reason.
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
card's stat chip.

Both are qualified by the course being played, and the first course on the
rack keeps the bare key: the Old Eighteen goes on writing `miniGolf.round.v1`
and `miniGolf.save.v1`, and the Wild Nine writes `miniGolf.round.v1.wild` and
`miniGolf.save.v1.wild`. That is what leaves a record a player already has
where they left it, and what lets the landing page go on reading
`miniGolf.save.v1` without knowing there is a rack at all. Which one you were
last on is remembered separately, under `miniGolf.course.v1`; `?course=<id>`
overrides it, `?course=random` deals one, and an id that is on neither list
is ignored rather than fatal. The procedural card keeps its seed under
`miniGolf.draw.v1` and its round under `miniGolf.round.v1.draw` — with the
seed inside the round, so a re-roll is not offered the scorecard of the draw
before it — and never writes a record at all. (The editor keeps its work in progress under
`miniGolf.editor.v1` and hands a playtest over in session storage under
`miniGolf.playtest.v1`; neither goes near either of them, and a playtest is
locked out of both the record and the round in progress — a one-hole round of
three strokes would otherwise beat any real eighteen-hole score, and starting
one would throw away the round you had going.)
Mute state lives separately under `miniGolf.muted`. Both writes are wrapped —
a browser with storage disabled should cost you your records, not your round.
