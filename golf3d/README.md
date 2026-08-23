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
| `js/audio.js` | Synthesised sound effects and the weather's sound bed — no audio files to ship. |
| `js/weather.js` | The sky each hole gets, the wind everything answers to, and the rain, mist and motes. |
| `js/postfx.js` | What happens to the picture after the course is drawn: bloom, light shafts, tone mapping, grade. |
| `js/render.js` | The course, in three.js. Procedural textures, no images. |
| `js/bag.js` | The club picker: a modelled bag that rides in front of the camera. |
| `js/game.js` | Loop, input, and what a shot means. |
| `vendor/three.min.js` | three.js r128, vendored. |
| `tests.html` | Headless test harness. Open it; green is green. |

## The bag

Four clubs, in `config.js`. A club is a loft and a ceiling on power and that is
the whole of it — the simulation never hears the word "club", it is handed a
launch angle and a speed exactly as before.

| Club | Loft | Full swing | Carry | Total | What it is for |
| --- | --- | --- | --- | --- | --- |
| Putter | 0° | 10.5 | — | 8.5 | Rolls flat and true. Full power is still a tap, which is what makes it the club you can aim. |
| Driver | 4° | 28 | 6.1 | 24.8 | The reach club: longer than any hole here, and it skips off the tee on the way. |
| Chipper | 22° | 14 | 7.5 | 16.9 | Hops a rail — apex about three quarters of a unit — and keeps running. |
| Wedge | 42° | 11.5 | 7.3 | 14.3 | The high one: apex over a unit and a half, clears anything the courses put in the way, and does not run far when it lands. |

Carry and total are measured on flat grass at a full swing, in world units.
They are the numbers the courses are built against, and the last column is why
the bag has four entries and not one: each club is longest at exactly one job.

The driver takes the lion's share of every power increase, deliberately: the
lofted clubs are what fly over the *design* of a hole, so their carries are held
down while the driver's reach goes up. Even so the bag has grown into the
courses — at seven and a half units of carry a wedge will now fly most of the
water here, which turns the bridges and the ramps from requirements into
choices. That is the trade for shots that feel worth hitting, and the number to
turn if it ever goes too far is the wedge's, not the driver's. The carry figures
are a design constraint rather than a curiosity: **a hole asking for more air
than the bag has must offer a way round** — a bridge, a ramp, a bank. `tests.html` measures the carry rather than
trusting this table, and the bot plays every hole out of this bag rather than
with any loft the physics would accept, so "the courses are solvable" means
solvable with the clubs a player actually has.

Picking a club keeps the power already loaded, as a fraction of the
swing. Swapping mid-aim is meant to be a comparison, not a reset.

### The picker

The bag sits low in the corner with half of it below the bottom of the screen —
enough to say "your clubs are here" and small enough to ignore. Click it and the
*clubs* come out: they travel to the middle of the view, line up with their
heads at eye level and their shafts running out of frame, and turn slowly on
their own axes so the face can be read from every side. The course dims behind
them, the club under the pointer is named and explained above, and clicking one
takes it and drops them back in the bag.

The bag stays where it is while that happens, which is why there are two rigs:
one parked in the corner holding the bag, one that travels holding the clubs.

It is furniture rather than course — both rigs ride at fixed offsets in *camera*
space, so nothing here ever occludes the hole, has to be played around, or
pretends to be something the ball could hit. That is why it lives in `bag.js`
and not in `render.js`: one file draws the world the simulation knows about, the
other draws a thing the simulation has never heard of.

It is built from `CONFIG.CLUBS`, so a fifth club would appear in the bag, in
the fan, with a label, pickable, with no markup and no CSS. Each head is turned
by that club's own loft, which means the difference between the driver and the
wedge is not a caption — it is the angle of the face you are looking at.

The row that comes out is **measured, not tuned**. One row of four at a fixed
size fits a laptop and runs off both edges of a phone held upright, because the
frustum is half as wide as it is tall there and the row was a constant. So
`fitOpen` divides instead: the frustum's two half-extents at the depth the clubs
come to, against the block's own two half-extents from the layout, scaled to
whichever binds. What is left of the screen after the panel naming the club and
the power meter have taken theirs is measured in the DOM and handed over
(`setBand`), because how tall a paragraph is at a given font on a given phone is
not something the renderer could work out. A row is what the clubs are *for* —
four heads side by side, compared at a glance — so it is what they get wherever
the screen allows; below a floor where the heads stop being tellable apart it
wraps into a grid, with its labels a full label apart since only a single row
can stagger them into two heights.

The first version was drawn from memory and came out looking like a bin, so the
second is built to the real thing's numbers: a cart bag is about **35 inches
tall with a 9–10.5 inch cuff** and fourteen full-length dividers — nearly four
times as tall as it is wide, where mine had been under two — and it holds a
**45 inch driver, 35.5 inch wedges and a 34 inch putter**. Those lengths are
why the driver towers over the other heads and the putter barely clears the
cuff, and why the labels stagger themselves without being told to.

References: [golf bag sizes](https://golfersauthority.com/how-tall-is-a-golf-bag/)
and [cuff and divider counts](https://www.moresports.com/blogs/the-extra-mile/what-size-golf-bag-do-i-need)
for the bag; [standard club lengths](https://www.hirekogolf.com/hireko-standard-length-golf-club-chart)
for the clubs.

### Modelling the heads

The heads went through three versions and only the third is any good, which is
worth writing down because the first two failed for reasons that look like
opinions and are not.

**Stacked boxes** read as four grey blocks. **Extruded outlines with bevelled
edges** gave them silhouettes but a club head is a curved volume, and the best
an extrusion can do is a rounded brick — the driver came out a slab and the
irons came out L-shapes. What they are now:

- **Driver** — a sphere pushed into shape: squashed to 60% height, swelling
  wider toward the back so it pears, and sliced off flat at `x = 0.040` where
  the face goes. One warp loop, and it is a curved volume rather than an
  impression of one. The face plate is sized to the slice (28mm across, 20mm
  tall) so it sits flush instead of standing proud as a rim.
- **Irons** — a bevelled extrusion is right here, because a blade genuinely is
  a flat outline: a topline running out to a rounded toe, a sole, a heel. Behind
  it sits a **muscle** — a second extrusion hugging the sole from heel to toe,
  which is where the weight in a real iron is and what stops a blade reading as
  a butter knife. As a box bolted to the back it read as a step; following the
  sole, it reads as an iron.
- **Putter** — a mallet: a wide, low, rounded slab with wings swept back behind
  the face, a dark insert across the face, a sight line on the crown, and a
  plumber's neck rather than a shaft pushed into the middle.

Sizes are the real ones. The USGA caps a driver head at **127mm heel to toe and
71mm tall** and a 460cc head sits right on that limit; an iron blade is about
**76mm heel to toe**; a mallet is about **105mm across and 55mm front to back**.

Everything is built in the head's own frame, and **that frame is the club as it
stands in a bag** — grip down in the well, head up where it can be seen and
clicked. The origin is where the shaft ends, `+Y` runs on past it to the sole,
`+X` is the way the face looks, and `Z` is heel to toe with the head hung out to
`+Z` from a hosel at `z = 0`. That last part is the bug the rebuild fixed: the
heads had been floating a couple of centimetres beside their shafts, because
nothing in the model sat where the shaft actually ended. A real head hangs off
its heel, and the hosel is the thing that says so.

The clubs are also **splayed** in the closed bag — each turned a little on its
own axis — for the same reason. Heads that hang to one side of their shafts
hide behind each other if four of them stand dead straight in a bunch.

References: [USGA head-size limits](https://www.usga.org/equipment-standards/equipment-rules-2019/equipment-rules/equipment-rules.html),
and photographs of a driver from above (the pear), an iron from the face (the
topline and toe) and a mallet from above (the wings) — the three views the
three shapes are drawn from.

*Not* a downloaded model, and that was a decision rather than an oversight: it
would need a loader (`GLTFLoader` is not vendored, and vendoring one for four
club heads is a lot of kilobytes), a licence that can be verified and carried in
the repo, and a binary asset in a project whose rule everywhere else is that
textures and geometry are generated at load. CC0 model kits exist and would
work; the trade is a build-time dependency and an asset directory against about
two hundred lines of maths, and at this size the maths wins.

Three details worth keeping.

Clubs are picked by **which head is nearest the click on screen**, not by a ray
through their hit boxes: the row is seen at an angle while it is moving, so the
shafts overlap in depth and a ray aimed squarely at one head can pass through
its neighbour's box on the way.

The open row is aligned on the **heads**, not the grips — `-len` puts every head
at the same height — because a club is 45 inches of shaft and four of head, and
the head is the entire thing being chosen between. The different lengths still
show where they belong, which is standing in the bag.

And nothing in that row may be **scaled**. Marking the club in hand with a 1.08
size bump lifted its head four times further than the lift meant to: scaling a
club scales its length, and the row is aligned on the far end of it. It is
marked with a glow and a word in the panel instead.

The names live in the DOM, above the clubs, rather than on sprites in the scene.
Text belongs in text: it stays crisp, it can be read by a screen reader, and it
was the part that looked cheap when it floated over the course.

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
- **The pin stands in the cup**, which is where a pin stands. It used to be
  planted beside it, on the grounds that a flagstick down the middle of a hole
  this size is something the ball ought to hit and would instead pass straight
  through — an honest dodge that made every hole look wrong. The honest fix is
  the one a real unattended pin makes for itself: **it is not vertical**. A
  flagstick dropped into a cup rests against the far wall of the liner and
  leans away, and leaning it away *along the line of play* puts everything
  above the first few centimetres out of the ball's path. Run the numbers: at
  the height of a rolling ball the pole is 0.135 units off the cup's centre, on
  the far side, and the ball would have to get its centre past the middle of
  the hole to touch it — by which point it is already falling. What is left in
  the way is the base, down in the mouth of the cup, and the pin is still
  scenery rather than simulation: nothing stops the ball, so when one drops the
  pin rattles instead, which is what your ear is expecting under the cup sound.

On a tilted green the liner is sunk vertically, so one side of the rim sits
proud of the grass. That is not a bug and it is not corrected: it is what a real
cup on a slope does.

## The strike

Three separate things, in the order you do them: **aim, load, swing.**

**Dragging the course only moves the view.** Sideways turns the aim, and the
camera with it; up and down tilts the camera between looking along the shot and
looking down onto it. No gesture out on the glass can cost a stroke, which is
what lets you drag as much as you like while you read the hole — and it is the
answer to the camera angle you could not change before.

**Power is loaded on the meter**, which is a real slider: press anywhere along
it, drag to trim, tab to it and use the arrows, `Home` and `End`. It is exact,
repeatable, and independent of the aim, so correcting one never disturbs the
other.

**Swing plays the shot**, and nothing else does — the button, or `space`. It is
disabled while there is nothing loaded and while the ball is still rolling, so
it says what the game will accept rather than swallowing the press. The `‹` and
`›` buttons beside it nudge the aim by a hair, which is the part a drag is too
coarse for on a short putt.

This replaced a slingshot — press, pull away, let go. It read well with a mouse,
but it fused aim and power into one throw you could not correct: every
adjustment to one was an adjustment to both, and a finger leaving the glass a
pixel early was a played stroke. Two fingers still mean pinch-to-zoom, and a
pinch now interrupts a look drag rather than throwing away a loaded shot; the
pinch holds the input until every finger is off the glass, so a leftover thumb
cannot start turning the camera on its own.

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
  degrees, and the ball drags a **tail** behind it;
- and when it drops, the **pin rattles** — nothing stopped the ball on the way
  past it, so the least the pin can do is admit it happened.

None of that is in `physics.js`. The simulation is handed a yaw, a speed and a
loft exactly as it was before.

## The chrome

Everything the player can reach lives in `index.html` and is wired in
`game.js`; there is no framework and no state library, because there are about
a dozen pieces of state and they all fit in one object.

The rule the chrome is built to: **a thing that only needs saying once should
only be said once**, and everything else should be one press away rather than
permanently on screen. A phone is 400 points wide and the course is the point.

- **The topbar** is one row and never more than one. Overview and fullscreen
  stay out where a thumb can reach them mid-shot; Courses, restart, the card,
  the rules and sound fold behind ☰ — a real menu that shuts on a press
  outside it, on `Escape`, and on picking anything out of it. Wide enough for
  all seven and the wrapper drops out of the layout entirely
  (`display: contents`) and the chips sit in the row as before.
- **Compact chrome** is on wherever the immersive layout is — a narrow window, a
  touch screen, or fullscreen on anything — and `game.js` decides it in one
  place (`syncCompact`) so the bar's two modes cannot disagree with the
  stylesheet's. In it the topbar stops standing above the canvas and starts
  floating over it on a scrim, which is worth 50 to 90 points of course; the
  scrim itself takes no presses, so a drag that starts on it still turns the
  camera. Toggling it resizes the renderer, because the canvas has just been
  handed the height the bar was standing in.
- **The hole card** says what a hole is — name, blurb, par, distance, sky — when
  the hole loads, and then leaves: four and a half seconds, or the moment you
  touch the course, whichever comes first. It used to be a line of text pinned
  under the hole's name for the whole round. The name in the scoreboard and the
  overlay's drawer both ask for it back.
- **The overlay** inside the stage carries the four figures that move during a
  shot — hole, par, strokes, distance — on one line, and the three that merely
  describe the hole behind a caret: name, blurb, and the sky, which is also the
  button that changes it.
- **How to play** opens by itself on a first visit — before the course picker,
  which appears when the rules are closed — and after that lives behind the `?`
  button and `H`. The flag is one key in `localStorage`.
- **Fullscreen** (`F`, or the ⛶ button) goes fullscreen on the *viewport*, not
  the document, so the canvas and every overlay inside it come along and the
  page chrome does not. The scoreboard above the canvas is gone in that mode,
  and the compact overlay takes over. The one-off offer to use it sits out of
  the play area and times out rather than waiting to be dismissed.
- **To cup** in the scoreboard counts down live while the ball rolls. It is the
  number the club choice is actually about.
- The **club picker** is the modelled bag described above. What is left in the
  DOM is the panel above the row, which names whatever is under the pointer;
  opening it hides everything else floating over the course, because four
  turning clubs are hard enough to read without an overlay on top of them.
- **The reminders below the fold** — the controls and what the course is made
  of — are `<details>` panels. They are worth having and not worth a screenful.

## Weather

Every hole has a sky of its own, and it is the same sky every time you come
back to it. Eight kinds — clear, fair, overcast, drizzle, rain, mist, golden
hour and a dust haze — each of which is a cloud cover, a fog distance, two
light intensities, a colour to pull the sky and the horizon towards, and a
colour grade. Courses draw from their own list: a quarry does not get sea mist
and the works, which is already after dark, does not get a golden hour.

**None of it touches the simulation.** Wind does not push the ball, rain does
not slow it, and a hole in the mist plays exactly as it does in the sun. That
is the point: the weather changes what a hole *feels* like without changing
what it *costs*, so a personal best still means the same thing whatever the sky
was doing. `physics.js` has never heard of `weather.js` and `tests.html` does
not load it.

**It is dealt, not rolled.** The kinds are shuffled once per course off a seed
made from the course id, and the holes are dealt off the top of that deck — so
a six-hole round sees six different skies, in an order that is the same one
every time. The first version hashed the hole number and took it modulo the
list, which is the obvious thing and was wrong: six samples of a six-way choice
repeat about as often as they do not, and a course whose first two holes are
both *Clear* reads as a course with no weather in it at all. One rule sits on
top of the deal — **hole one always gets a sky you can see it in**, because it
is what is behind the course picker on a first visit and opening a round in the
rain is a poor advertisement.

`?weather=rain` fixes it for a whole round, and `W` cycles through what the
current course can plausibly do. Changing it rebuilds the hole rather than
tweening, because half of the weather is uniforms and would tween beautifully
and the other half is baked into materials and would not.

### The wind

One vector — a bearing that wanders and a speed that gusts, three sines with
periods that do not divide into each other — and everything answers to it:

- **the flag**, which is the only instrument on the course telling you what the
  air is doing. It streams downwind, ripples faster and deeper in a gust, and
  on a still day the whole sheet sags towards the ground. The readout under the
  hole name is the same number the cloth is answering to.
- **the rain**, which slants with it, and the **motes** — pollen over a summer
  green, grit over the quarry — which drift with it.
- **the sea**, which gets choppier as it gets up, and the **clouds**, which
  ride it a good deal faster because they are a long way off the ground.
- **the sound bed**: one looping second of brown noise through two filters, a
  narrow lowpass for the air and a bandpass up in the sibilance for the rain,
  with the wind's cutoff and gain on slow LFOs so it breathes instead of
  sitting there. It never restarts — changing the weather ramps the gains and
  leaves the loop running, which is why a squall can arrive without a click.

### What each kind is made of

- **Rain** is a shader. Each drop is a two-vertex segment and the vertex shader
  falls it, wraps it in a box that follows the camera, slants it into the wind
  and stretches the tail along the direction it is going. The buffer is written
  once and never touched again; the only thing crossing the bus per frame is
  the clock. It also lands on the water — see below — and wets the ground,
  which is one number handed to every pad material: darker, and shinier.
- **Mist** is four buckled sheets at ankle, knee and waist height turning
  against each other. Flat ones were the first attempt and a dead-flat sheet
  crossing a raised green cuts it in a dead-straight line; a couple of sines
  through the vertices make that intersection a wandering edge, which is what
  fog against an object actually looks like.
- **Birds** are two triangles apiece, hinged down the middle and flapped by
  moving four vertices. A flock costs less than one of the rails and it is what
  stops a clear sky reading as a painted ceiling.

## Rendering

`render.js` is the only file that knows three.js exists. Everything it draws
comes from the same data the simulation reads: pads are boxes sheared by the
pad's own gradient (a shear keeps the vertical edges vertical, so a tilted pad
still meets its neighbours), and a pad's underside reaches the surrounding
ground so a raised green reads as a plateau rather than a slab in mid-air.
Boards are the exception and stay thin — a jetty should look like a plank, not
a causeway.

Textures are drawn into canvases at load: grass, sand, planks and rock. No
image files to ship and no requests to fail.
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

### The sky

A two-stop gradient, which was fine until you looked up. It is now the one
genuinely expensive shader in the game and it earns it, because everything the
weather does above the horizon happens in there.

**Clouds are noise, not geometry.** The view ray is dropped onto a flat sheet a
long way overhead — divide the direction by its own height and you have where
it crosses — and five octaves of value noise are sampled at that point.
Coverage is a threshold on the noise, so one uniform takes the sky from clear
to solid, and drifting the sample point with the wind moves the weather across
the course without moving a vertex. They are shaded by sampling the *same*
noise a short way towards the sun and comparing: where the field rises towards
the light the cloud is lit, where it falls it is in its own shadow. Two texture
reads, and it looks like a cloud.

Two details are load-bearing. The **fine octaves fade out towards the horizon**,
weighted by how much room they have left and renormalised so the mean does not
move: the projection stretches without limit as the ray flattens, and by the
horizon one pixel would span several periods of the top octave and the sky
would turn to static. It is a level-of-detail scheme in four lines and it is
also, by happy accident, what distance does to a real cloud — you stop seeing
the small stuff first. And **how far up the horizon haze reaches is the
weather's business**: a clear day gets the last few degrees, a sea fog gets a
third of the sky. Without that, thick fog swallows the water and then stops
dead at a horizon with a hard-edged cloud deck sitting on it.

The night course gets **stars**: a hash grid on the sphere's own angles, one
cell in twenty holding one, each twinkling on a period of its own — and its
clouds are multiplied down, because a white cloud over a night sky reads as a
hole in it.

### The water

A blue box with a scrolling ripple texture on it, which from a low camera read
as lino. It is now a shader, and the thing that makes it read as water is not
the waves — it is **Fresnel**: water is nearly a mirror at a grazing angle and
nearly transparent looking down, so the horizon takes the colour of the sky and
the near edge keeps the colour of the water. Everything else is secondary to
that one term.

The surface is five directional waves summed and differentiated analytically —
no normal map to tile, nothing to align to a shore, about a dozen instructions
— travelling on the wind vector, so the sea gets rougher when the flag does.
Every frequency and bearing in there is picked *not* to divide into the others:
harmonic trains on similar bearings beat into a plaid that reads as a tiled
texture the moment the camera goes overhead, which is exactly the thing this
replaced. Rain lands on it as well: a hash grid picks a drop per cell and a
ring expands out of it, tilting the normal as it goes.

### Light

Three lights, and the weather sets all three. The sun changes most — an
overcast takes it to a fifth and hands the difference to the sky, the golden
hour drops it towards the horizon and warms it — and its shadow **softens** with
the cloud rather than merely fading, because a sharp shadow under a solid
overcast is the loudest possible way to tell a player that the sky is a
picture. The third is a fill from the opposite side, tinted the same colour as
the sky: without it the shaded face of every rail is flat ambient and the hole
reads as a diagram.

One thing worth knowing before touching any of this. **The lit materials in
this game hand three.js an sRGB hex as if it were a linear albedo**, and have
always looked the way they look because of it — that is the palette. The two
unlit shaders, the sky and the water, have no lighting to bring them back down,
so they convert their colours properly. The exception inside the exception is
the **fog colour, which is deliberately left unconverted in both**: it is the
colour the sky has to *match*, and what it is matching is three.js's own fog on
the lit materials. Convert it and the sky ends a visibly different colour from
the ground it is meeting — a seam straight across the middle of the picture.

### After the course is drawn

`postfx.js` renders the scene into an offscreen buffer and turns it into the
image with one full-screen pass: bloom, shafts of light out of the sun, a
filmic shoulder so a white rail in full sun rolls off instead of clipping, the
weather's colour grade, a vignette, and a little grain to stop the sky banding.

- **The renderer's own tone mapping and output encoding are switched off** and
  this file does both at the end instead — otherwise the picture would be
  tone-mapped on the way into the buffer and graded on a value that had already
  been squashed, and the sky, a raw `ShaderMaterial` that three.js does not
  decorate with the tone-mapping chunk, would be the one thing in frame that
  had missed the treatment.
- **Bloom is two blurs.** One half-resolution pass gives a tight halo that reads
  as a mistake; a second at quarter resolution underneath gives the broad glow
  that reads as light.
- **The light shafts are free.** Marching the already-blurred bright pass
  towards the sun is the cheap version of god rays — the expensive part,
  isolating what is bright, has been paid for by the bloom. They fade out as
  the sun leaves the frame rather than switching off, and go to nothing when it
  is behind the camera, because `project()` gives a mirrored answer there and
  rays converging on a phantom is the one artefact a player would notice.
- **It measures itself.** A machine that cannot hold about 32fps with the whole
  chain loses the shafts, then the bloom, and keeps the grade — which is the
  part doing most of the work anyway. Two seconds of grace first, so a phone is
  not demoted for the frames it spends compiling shaders. Nothing to configure.
- **Multisampling moves into the buffer** on WebGL2, because rendering into one
  throws away the canvas's own — a jagged rail in exchange for a nicer sky is
  not a trade.

The camera is never flown directly. It sits behind the ball looking down the aim
line, which is what makes "drag left, aim left" true from any angle, and
`V` lifts it to an overview that fits the hole's bounding box in frame.

## Tests

Open `tests.html`. 423 assertions covering the surfaces, the collision
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
loads `config.js`, `physics.js`, `courses.js` and `scoring.js` and nothing else
— the weather, the renderer and the post chain are all absent from it, which is
the strongest statement available that none of them can change a score.

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
overview, <kbd>F</kbd> fullscreen, <kbd>R</kbd> restart the hole, <kbd>W</kbd>
the weather, <kbd>H</kbd> the rules, <kbd>M</kbd> sound. Scroll or pinch to
zoom.

## Query parameters

`?course=seaside|quarry|works` starts a round directly, skipping the picker,
`&hole=1..6` jumps to a hole, and
`&weather=clear|fair|overcast|drizzle|rain|mist|golden|dust` fixes the sky for
the round. Handy for screenshots and for linking someone at the hole you are
complaining about, in the weather you were complaining about it in.
