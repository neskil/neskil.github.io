# Loft Links

Seven six-hole courses of 3D golf: five of mini golf, one — Ashdown Park — of
the long game with fairways, rough, bunkers, a lake and trees, and one —
Whinstone Links — of open rolling country with no fences on it anywhere.
three.js (vendored, r128), plain ES5-flavoured JavaScript, no build step and no
other dependencies — same as everything else here, open `index.html` and it
runs.

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
| `js/courses.js` | The forty-two holes, as data, plus the rail generator, the band layout the parkland course is written in, and the dune fields the links is made of. |
| `js/physics.js` | The simulation. No three.js, no DOM, pure. |
| `js/scoring.js` | Scorecard arithmetic and the save file. |
| `js/audio.js` | Synthesised sound effects, the weather's sound bed, the mute and the tab-out — no audio files to ship. |
| `js/music.js` | The house band: a smooth jazz quartet, synthesised a bar at a time. |
| `js/themes.js` | What each course looks like: a palette per theme, and nothing else. |
| `js/textures.js` | Every texture, drawn into a canvas at load, and the rule that keeps them shared. |
| `js/shaders.js` | The shaders written by hand rather than by three.js: the sky, the water, and the turf spliced into three.js's own. |
| `js/weather.js` | The sky each hole gets, the wind everything answers to, and the rain, mist and motes. |
| `js/postfx.js` | What happens to the picture after the course is drawn: bloom, light shafts, tone mapping, grade. |
| `js/render.js` | The course, in three.js: geometry, lights, camera and the frame. |
| `js/bag.js` | The club picker: a modelled bag that rides in front of the camera. |
| `js/debug.js` | The course inspector — `?debug=1`, or <kbd>G</kbd>. The tool for building a hole. |
| `js/game.js` | Loop, input, and what a shot means. |
| `vendor/three.min.js` | three.js r128, vendored. |
| `tests.html` | Headless test harness. Open it; green is green. |

The three files above `weather.js` in that list are three of the four different
jobs the renderer used to do in one file. Picking colours, drawing a texture,
writing GLSL and placing a mesh are not the same activity, and none of them
should require scrolling through the other three: `themes.js` is where a course's
palette lives, `textures.js` owns every canvas the game draws into *and* the
rule that keeps one grass serving a whole course, and `shaders.js` holds the
places where the answer is GLSL rather than a property. What is left in
`render.js` is the part that actually builds a hole.

## The bag

Five clubs, in `config.js`. A club is a loft and a ceiling on power and that is
the whole of it — the simulation never hears the word "club", it is handed a
launch angle and a speed exactly as before.

| Club | Loft | Full swing | Carry | Apex | Total on green | What it is for |
| --- | --- | --- | --- | --- | --- | --- |
| Putter | 0° | 10.5 | — | — | 8.5 | Rolls flat and true. Full power is still a tap, which is what makes it the club you can aim. |
| Driver | 4° | 32 | 8.0 | 0.30 | 29.6 | The reach club. Barely off the ground, and almost all of its length is roll. |
| 7 Iron | 16° | 18 | 9.5 | 0.83 | 21.6 | The long approach: three quarters of a driver, and it *carries* three quarters of that. |
| Chipper | 22° | 14 | 7.5 | 0.91 | 16.9 | Hops a rail and keeps running. The all-rounder. |
| Wedge | 42° | 11.5 | 7.3 | 1.79 | 14.3 | The high one: clears anything the courses put in the way, and does not run far when it lands. |

The iron is the newest and the odd one out, because it is the only club picked
for its **carry** rather than its length. Everything else in the bag either
runs (the driver is eight units of flight and twenty of roll) or stops (the
wedge goes up rather than out); nothing could fly more than about seven and a
half units of water, which put a hard ceiling on what a hazard could be. The
iron flies nine and a half and still runs when it lands, and an island green
became possible the day it was added. Out of rough it goes *further* than the
driver, for the same reason — it spends the distance in the air, where the long
grass cannot reach it.

Carry and total are measured on flat grass at a full swing, in world units.
They are the numbers the courses are built against, and the last column is why
the bag has four entries and not one: each club is longest at exactly one job.

The driver takes the lion's share of every power increase, deliberately: the
lofted clubs are what fly over the *design* of a hole, so their carries are held
down while the driver's reach goes up. On the first three courses that made the
bridges and the ramps into choices rather than requirements — at seven and a
half units of carry a wedge flies most of the water at Seaside. Tidewater Reach
and Highland Steps were built the other way round, from the carries outward:
they take the ground away and let the numbers in this table decide what is
reachable, which is why so many of their holes have no route along the floor at
all.

Either way the carry figures are a design constraint rather than a curiosity:
**a hole asking for more air than the bag has is not a hard hole, it is a
broken one**, and the only way in the game to tell those apart is to play it.
So `tests.html` measures the carry rather than trusting this table, and the bot
plays every hole out of this bag rather than with any loft the physics would
accept — "the courses are solvable" means solvable with the clubs a player
actually has. The two numbers to turn if any of it ever goes too far are the
wedge's carry and its apex, not the driver's.

Picking a club keeps the power already loaded, as a fraction of the
swing. Swapping mid-aim is meant to be a comparison, not a reset.

### The overdraw

The meter does not stop at a full swing. The last `OVERDRAW` of it — 30%, so
the track runs to 130% of whatever club is in hand — is real extra power, and
the only way to get more out of a club than it has. A driver wound to the end
of the track leaves at 36.4 rather than 28.

What it costs is the promise. The trade is deliberately lopsided in both
directions:

| | inside a full swing | past one |
| --- | --- | --- |
| base power | the meter, exactly | the meter, exactly — it keeps counting |
| spray | **none at all** | up to ±7° of line and ±16% of weight |
| how it grows | — | exponentially, not with the meter |

The first half is what makes the second half interesting. **Nothing at or under
100% sprays by anything**, so a full swing is a shot you can aim at a gap and
land in it, every time, and the cone drawn in front of the ball is the whole
truth. Past 100% the two spray figures climb on `(e^kt - 1) / (e^k - 1)` with
`k = SPRAY_CURVE`: half the overdraw buys about a sixth of the trouble, and the
last quarter of it buys more than the first three put together. So a sliver past
a full swing is close to free, 115% is a shot with a bit of a wobble in it, and
130% is a thrash nobody can aim — which is exactly the shape a decision should
have. There is no cliff to memorise, only a curve to feel.

Three details worth keeping:

- **The line and the weight are two draws.** `sprayShot` calls its random source
  twice, so a bad one can be pulled *and* caught thin — one mistake, not the
  same mistake twice.
- **It is measured per club, not in raw power.** `overdraw(power, ceiling)` is 0
  at the club's ceiling and 1 at the end of its overdraw, so thrashing a putter
  and thrashing a driver are the same mistake told in the same numbers.
- **The dice are rolled in `game.shoot()`, nowhere else.** `physics.launch()` is
  as deterministic as it ever was, which is what lets the preview ask the same
  module how wide the spread is without ever rolling any — the cone in front of
  the ball is drawn from `spray()`, and the shot is played from `sprayShot()`.
  The tests hand `sprayShot` a fixed source and check the corners.

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

### Why it still looked like a bin

The numbers above are right and the model was still wrong, for three reasons
that had nothing to do with proportion. All three are worth writing down
because each one looks like a taste problem and is in fact a bug.

**The colours were being brightened twice.** three.js at r128 hands a material
colour straight to the shader and then encodes the finished frame to sRGB on
the way out, so a colour *written* dark is *lit* as though it were much lighter
and then leaves lighter still. Black leather at `#2a3138` came off the screen
as a mid grey; four heads in three different greys all arrived the same shade
of white, and the whole bag read as a beige bucket lit by a studio flash. Every
colour in `bag.js` now goes through `ink()` — `convertSRGBToLinear` — at the
point it is written, and the canvas textures declare `sRGBEncoding` so they are
decoded the same way. What is written is now what shows. The specular colours
went with them: white highlights on every metal were what turned four club
heads into four white blobs, and chrome reflects the sky it is standing under,
not a flash.

**The mouth was a lid.** A `CylinderGeometry` is capped at both ends by default,
and the bag's body and its cuff were two solid discs lying across the opening.
The clubs came *through* that lid rather than standing in the bag, which is
most of what made it read as sticks in a bin. Both are open-ended now, and what
the mouth shows is a lining — painted rather than lit, bright at the rim and
dark at the bottom of the well, because nothing in the scene lights the inside
of a bag and a flat tone reads as a hole cut in it rather than as a depth.

**Everything that said "golf bag" was below the cut.** The bag stands mostly off
the bottom of the screen on purpose, and the pocket, the strap, the foot ring
and the accent band were all down in the part nobody sees: what showed was a
dark cylinder. The band, the panel, a maker's patch and a carry handle now live
in the hand's width above the cuff that is actually on screen, and the patch is
turned to face the camera rather than centred on the bag's nominal front —
the rig is deliberately twisted off-axis, so a patch centred on local `+z`
spends half of itself round the side.

Two smaller things came out of the same pass. The clubs bunch tighter and lean
less, because the old spread put the outer two grips within a centimetre of the
wall and the lean then carried their shafts out across the bag's own silhouette
— two clubs in a bag and two propped against it. And each club's **ferrule**,
the collar between shaft and head, is now that club's own colour: it is the one
part of a club that is allowed to be any colour at all, it sits above the cuff
on a shut bag, and it means five clubs bunched in the mouth are five colours
rather than four silhouettes. The same four colours name the club on its card.

### What a club's card says

Each club carries its own card the whole time the row is open, so five clubs are
compared at a glance rather than one at a time. Two versions of that card are
worth contrasting.

The first gave each club a **typeface** of its own — the driver in a heavy sans,
the wedge in an italic serif, the chipper in a monospace — on the theory that
four faces would read as four personalities. Four faces on four cards standing
side by side read as four different games. A club is already told apart by its
colour and by the shape of the head above the card; the type's only job is to be
read at a glance from across a phone, and the face that does that best is the one
the rest of the page is set in. So it is one typeface in two weights now —
Outfit for words, JetBrains Mono for figures — and the colour carries the
personality on its own.

The second problem was the two figures. `pwr 14 · loft 22°` is the data with the
meaning left off: 14 is in units nobody outside `physics.js` has ever seen, and a
number of degrees is only a picture if you already have the picture. Both are
drawn now as well as written:

- **Loft** is the face itself, set at the club's real angle, with the line the
  ball leaves on coming off it. A wedge's card shows a face lying right back and
  a line going up; a putter's shows a face standing straight and a line along the
  ground. A face and a launch line are one rotation seen twice, which is the
  point of drawing both.
- **Power** is a bar filled against the biggest club in the bag, so "the driver
  is the reach club" is a length rather than a claim — the driver's bar is full
  and everything else is measured off it.

The figures stay underneath for anyone who wants them, and the same two, written
out rather than abbreviated, are in the DOM panel above the row where a screen
reader can reach them.

One last detail, and it is the reason the type never looked like the page's even
before any of the above: a canvas draws with whatever font the browser has *at
the moment `fillText` runs*, and the web font arrives a heartbeat after the first
frame. Every card was being baked in the fallback face and kept it for the rest
of the round. `document.fonts.ready` now redraws the four cards and the bag's
patch once, which costs five canvases, once.

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
hide behind each other if five of them stand dead straight in a bunch.

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

## The courses

Seven, six holes each, and they are meant to be played in the order they are
listed — the picker is a difficulty curve as much as a menu.

| Course | Theme | What it is about |
| --- | --- | --- |
| Seaside Green | `seaside` | Flat-ish holes by the water. Pace, and a first bridge to fly if you would rather not walk it. |
| Quarry Ridge | `quarry` | Ramps, ledges and a long way down. Height as a hazard. |
| Windmill Works | `works` | Gates and blades, after dark. Timing. |
| Tidewater Reach | `lagoon` | The loft course. Almost nothing here can be reached along the floor. |
| Highland Steps | `highland` | The same lesson from the other side: things in the way rather than things missing, and the ground handed back as a tool. |
| Ashdown Park | `parkland` | Not mini golf at all: the long game, where the hole is longer than one swing and the fairway is a place you are trying to be. |
| Whinstone Links | `links` | No fences, no flat lies and no straight edges. The ground is the hazard. |

Tidewater and Highland are why the bag has more than two clubs. Every hole on
Tidewater is built round the one thing a chip can do that a putt cannot —
leave the ground — and each asks for it differently: **Stepping Stones** is
two carries onto islands whose kerbs the driver cannot clear; **Short Side**
puts sand across the front, a kerb on the green and two metres of room behind
the pin; **The Letterbox** is four walls and no door; **Tabletop** puts the
green a metre up with nothing to run up, which is a shot only the wedge owns;
**The Reach** finishes in a crater that gathers whatever lands in it. And then
**Under the Boardwalk**, which is the joke at the course's expense: a bar too
tall to fly, standing high enough off the ground that a putt runs under it. The
club that has answered every other hole is suddenly the wrong one; land it
short of the bar and let it run.

Highland turns the same screw with ground instead of water. **Stairway** is
three steps with no ramp — a wall you cannot climb is a wall you have to hop.
**Over the Top** is a wall nothing goes round and one club goes over.
**Crown** runs a ramp up to a shoulder that stops short of the summit, and the
last step up is yours to fly. The other three keep a flat answer on purpose,
because a course where every shot is the same shot is not varied, it is
uniform: **The Backboard** bricks up the front door and leaves a bank to throw
the ball at, **Two Roads** offers a long low road under a beam or a short high
one you have to chip onto first, and **The Gorge** will let you lay up at the
lip and blast it across for the price of a stroke.

Which holes are which is not a matter of taste in the tests: the ones that must
be flown carry `needsLoft: true` and are replayed by the bot with the lofted
clubs taken away (see [Tests](#tests)).

### Ashdown Park

The sixth course is the long game, and it is the same game — same solver, same
pads, same walls, same bag. What changes is that a hole is now longer than one
swing, so where the ball *stops* starts to matter as much as where it is going.

The numbers it is built against, measured off a flat lie at full power:

| | Putter | Driver | Chipper | Wedge |
| --- | --- | --- | --- | --- |
| Green | 8.5 | 24.7 | 16.9 | 14.2 |
| Fairway | 6.8 | 21.3 | 15.6 | 13.4 |
| Rough | 3.6 | 15.0 | 13.1 | 11.8 |
| Sand | 1.9 | 11.5 | 11.7 | 10.9 |

So a par 3 is about thirteen units and one full club; a par 4 is around thirty
— a drive and a pitch; the par 5 is forty-eight, which is three shots, or two
and an argument with a cross bunker. Missing the fairway does not lose the
ball. It loses the club you wanted to hit next, which is a better punishment
because you have to keep playing with it.

The other thing worth knowing is the carry. Nothing in the bag flies further
than about 7.6 units before its first bounce (the chipper, flat out) and
nothing gets higher than about 1.6 (the wedge). Both numbers are load-bearing:
**Over the Water** puts a pond four units deep on the line to the pin, which
only a full swing clears, and the dry route is a tee shot aimed well right of
the flag. And the oak on the inside of **The Elbow** cannot be flown by any
club that exists, which is what makes a dogleg a dogleg rather than a
suggestion.

| Hole | Par | What it asks |
| --- | --- | --- |
| Opening Drive | 4 | A bunker sitting exactly on the line from the tee to the flag. Putt the approach and you are in it. |
| Over the Water | 3 | Full club over the pond, or a safe one out to the right and a longer putt. |
| Long Meadow | 5 | Two drivers reach a cross bunker sixty units out. Lay up with a chipper and it is a simple three-shot hole. |
| The Elbow | 4 | Turns left around a tree. Play right off the tee or bounce off it. |
| Short Stuff | 3 | A five-unit green ringed by sand. One full club, and no half measures. |
| Homeward | 4 | Water down the whole right side, and sand across the front of the green. |

Trees are real: the trunk is a wall the ball bounces off, and the canopy over
it is drawn by `render.js` from a hash of where the tree stands, so a treeline
is a treeline rather than a row of identical bollards, and it is the same one
every time the hole is loaded. The canopy is not solid, because nothing in the
bag can reach it — a solid one would only mean the ball stopping in mid-air.

### Whinstone Links

The seventh course is the one that stopped being a floor plan. Everything
before it is rectangles of ground with fences round them; this is a single
piece of rolling country running past the fog in every direction, and what
keeps you on the hole is a line of white stakes.

Three things had to exist for it, and each of them is small:

**Ground that curves.** A pad may carry a list of humps — `{ cx, cz, r, a }`,
a rise of `a` fading to nothing at radius `r` — and its height is the plane
plus all of them. The profile is a raised cosine, `a·(cos πt + 1)/2`, chosen
because it is flat at the top *and* flat where it meets the ground: a crease at
the summit would be a ridge the ball feels and nobody drew, and a crease at the
foot would be a step at the bottom of every hill on the course. Negative `a` is
a hollow, and overlapping humps simply add, which is how a dune field is
written.

Nothing else in the solver changed, because the solver only ever asked the
ground two questions — how high is it here, and which way does it fall — and
the second one now comes from `padGrad` instead of from a pad's own tilt. A
ramp, a breaking green and a sandhill are still one code path. `tests.html`
checks the gradient against a finite difference of the height at four hundred
points across two overlapping humps, which is the one thing that could silently
be wrong: get it backwards and the ball rolls uphill on a picture of a slope.

**Friction that holds.** Until this course the only friction in the game was
drag — proportional to speed, and therefore *zero* at zero speed, which says
nothing whatever about a ball that has stopped. A ball could never rest on a
slope, because gravity always wins against nothing, and the game papered over
it with a timer that froze anything slow for long enough. That is why a ball
used to sit halfway up a ramp looking like a bug: it was one.

`CONFIG.HOLD` is the second number — the steepest gradient each surface will
hold a stopped ball on, which is the tangent of an angle of repose. A slow ball
is at rest when its lie is inside that and otherwise keeps creeping downhill
until it finds somewhere that is. This is what makes a hump a hazard rather
than decoration, and it is the difference between terrain you look at and
terrain you play.

The green's figure is 0.18, which is steep for a green and is not a free
choice: the cup on Tidewater's **Short Side** sits on a lie of 0.16, and a
green that will not hold a ball beside its own hole is a green nobody can putt
on. There is an assertion to that effect over every cup in the game. Two older
holes were quietly fixed by the change — **Step Up**'s blurb has always
promised that half measures roll back to you, and until now they stopped on the
ramp instead.

**A boundary that is a rule.** With no fence and no cliff, nothing physical
stops the ball, so out of bounds is `hole.fence`: a rectangle, checked once,
when the ball comes to rest. Cross the line and come back and you are fine,
which is what a white stake means. The stakes themselves are scenery and the
ball goes straight through them, because a stake that bounced it back would be
a wall telling a lie about the rule it is there to mark.

The greens are discs — `circle()` — laid *into* the ground rather than cut out
of it, which needed the one genuine exception to "pads must not overlap": a pad
marked `inlay` wins a height tie in `surfaceUnder`. It is a safe exception
because an inlay only ever changes what the ground is *made of* underfoot,
never where it is, and the tests walk every overlap to insist on exactly that.
The alternative was cutting a circular hole in a rectangle, and there is no
rectangle that does that.

| Hole | Par | What it asks |
| --- | --- | --- |
| The Whins | 4 | Rolling the whole way, and a bunker sitting on the line at driving distance. |
| The Ait | 3 | An island green in a ring of water. Seven units of carry and no way to lay up. |
| The Punchbowl | 4 | A ring of humps round the green: anything on the banks comes back down to it. |
| Stake and Ditch | 3 | Out of bounds tight down the right for the whole hole. |
| Elbow Point | 5 | A dogleg left. Cutting the corner means carrying ground that is not the golf course. |
| Home Ground | 4 | A dogleg right, and ground that throws a straight drive off the line. Not a bug. |

**A dogleg with nothing to bend it.** There are no trees on a links and no room
for a hazard big enough to turn a hole, so what bends these two is the boundary
itself: `fence` may be a *list* of rectangles, in-bounds is inside any of them,
and two overlapping rectangles make an L whose inside corner is simply not the
golf course. The stakes know it — a stake is skipped where its edge falls
inside another rectangle, because the line through the middle of an elbow is
not a boundary and a row of posts across it would be describing a wall that is
not there. You may still fly the corner. That is the trade, and it is the same
one a real dogleg offers.

**An island needed a club.** Until the 7 iron nothing in the bag carried more
than about seven and a half units, which put a ceiling on every water hazard in
the game — all of them are short ones. The Ait's burn is seven units of carry
from the tee and there is no lay-up, because the ground beyond it is the island
and there is nothing else to aim at. A full chipper, a full wedge and most of
an iron all get there; take much off any of them and carry falls away with the
*square* of the speed while roll only falls away with the speed, so a shot that
is a club short is not a bit short, it is wet.

The dune fields are generated rather than placed, from a seed per hole, so a
hole is different from its neighbours and identical on every load — nothing in
`courses.js` may ever call `Math.random`, because a course that reshuffles
itself is a course the tests cannot make any statement about. `dunes()` is
asked for a *gradient* rather than a height, since gradient is the number
`HOLD` is compared against and therefore the number that decides how the ground
plays; the amplitude follows from the radius. It also takes a list of circles to
keep out of, because a green wants flat ground and so does a tee.

What that ends up worth, measured: the same driver from nine spots across a
fairway runs anywhere from 12 to 26 units where flat ground gives 21, and
finishes up to twelve units off the line it was aimed down.

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

- **pad** — `kind` picks the friction *and* the angle of repose: `green` (the
  quickest, and the least willing to hold a ball on a slope), `fairway` (mown
  longer, so a driver runs about a fifth less), `wood` (bridges and ramps:
  slick, you carry your speed, and a ball left on one goes back down it),
  `sand` (a bunker eats a shot and holds whatever lands in it), `rough`.
  `sx`/`sz` tilt it, `bumps` curve it, `r` makes it a disc. Pads must not
  overlap unless one is clearly a bridge above another or one is an `inlay`;
  anything else fighting for the same point would make the surface lookup
  depend on array order, and `tests.html` asserts it never does.
- **water** — a rectangle with a surface height. There is no pad above it, so
  the ball falls in: splash, one stroke, replay the shot from where it was
  played.
- **wall** — a box. `yaw` turns it, `move` slides it on a sine, `spin` rotates
  it. A `spinner` is a blade authored the way you think about it (middle,
  length, thickness); a `slider` is a gate.
- **beam** — a bar on two posts, and the one obstacle in the game that punishes
  loft instead of rewarding it: the underside clears a resting ball's crown and
  the first hop after a chip, so a putt goes under; the top is out of reach of
  the highest club in the bag, so nothing flies it. Put one in front of a green
  and the wedge becomes the wrong answer. The posts are real walls, not
  scenery — partly for the rule that the ball must hit what you can see, and
  partly because they do the explaining: a bar hanging in mid-air reads as a
  wall from the tee however carefully it is lit, and a bar on two legs reads as
  a doorway, which is the one thing the player has to understand before taking
  the shot.
- **pen** — four walls round a rectangle: no door, so the only way in is over
  the top and down.
- **bowl** — a funnel green in nine pads: a flat floor, four ramps up to a rim,
  and four corners that are *the two ramps beside them added together*. That
  last part is the whole trick — a corner built as the sum of its neighbours
  meets both of them exactly, so the nine tile without a single step for the
  ball to stub its toe on. The cup goes in the flat floor, because the mouth has
  to sit a clear radius inside one pad and a cup on a seam would not.

- **bands** — how Ashdown Park is written, because a full-size hole is not a
  lane but a stack of strips. A row is a depth followed by cells laid west to
  east: `[width, kind]`, or `[width, kind, y]` for a bunker sunk below the
  grass, or `[width, null]` for a hole in the ground where a lake goes.

  ```js
  pads: bands(0, [
      [5,  [4, rgh], [9, fwy], [7, rgh]],                    // the tee
      [13, [4, rgh], [9, fwy], [7, rgh]],
      [4,  [4, rgh], [6, fwy], [3, snd, DIP], [7, rgh]],     // and a bunker
      [9,  [5, rgh], [11, grn], [4, rgh]]                    // the green
  ])
  ```

  Rows are how a hole is *written*, not how it is drawn: identical cells in
  consecutive rows are glued back into one pad afterwards, which takes Long
  Meadow from twenty-nine slabs to nineteen and removes a seam neither the
  physics nor the eye could find. Cells of different kinds at the same height
  are neighbours, so no rail is built between a fairway and its rough — the
  only rails a parkland hole gets are the boundary fence round the outside,
  which is what a real course has too.
- **tree** — a trunk that is a real wall, authored by its middle, with a canopy
  the renderer puts on top. Only the trunk is solid: no club in the bag lifts a
  ball much above 1.6 units, so a tree is a thing you go round, and a solid
  canopy would only mean the ball stopping in mid-air. `treeline()` puts a
  stand of them along a line.
- **bumps** — humps on a pad, so the ground curves. `hill()` is one,
  `ring()` a circle of them (a punchbowl, or a dell), `dunes()` a seeded field.
  See [Whinstone Links](#whinstone-links).
- **circle** — a disc pad, and an inlay: laid into whatever it is standing on
  rather than cut out of it. Round greens and round bunkers.
- **open / fence** — an open hole gets no generated rails at all, and a `fence`
  rectangle instead: the ball is out of bounds if it comes to *rest* outside
  it. Marked on the ground with white stakes, which are scenery.

**Rails are generated, not authored.** `enclose()` walks the boundary of the pad
union and puts a rail on every edge that has no neighbouring pad at roughly the
same height, so a hole is drawn by listing its floor and the fences follow.
Where a hole wants an open edge — a shoreline, a ledge, a drop — it lists a
`gaps` rectangle and no rail is built inside it. `shore()` grows a water
rectangle into one of those; `brink()` does the same for a step you are meant to
be able to fall off, which is the difference between "land it on the table" and
"bounce it off the kerb and hope". Getting this wrong is the most
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

### The inspector

`?debug=1`, or <kbd>G</kbd> at any time. This is the tool for doing the above.

For a long while building a hole meant writing coordinates, loading the page
and squinting at a green field. There was no way to tell a pad's edge from a
rail's, no way to see which rails `enclose()` had decided to build for you, and
no way at all to answer the question you actually have while authoring, which
is *what are the coordinates of that corner*. `tests.html` can say a hole is
broken. It cannot say where anything is.

So `debug.js` draws the hole out of the same data the solver reads:

- **pads**, washed in alternating colours and outlined on their own surface,
  tilt and all. The wash alternates **by index rather than by kind**, which
  looks like the wrong choice and is not: what a pad is made of is already on
  the screen — grass is green, sand is sand — and what is not on the screen is
  where one pad ends and the next begins. Two greens meeting are invisible
  until they are tinted differently, and that seam is the thing worth looking
  at, because it is where a hole either tiles cleanly or trips the ball.
- **walls**, as the boxes the solver collides with, placed from
  `physics.wallBox()` at the current clock — so a gate's outline slides with
  the gate and a blade's turns with the blade. A mesh that had drifted from its
  box would show up here as two rectangles instead of one.
- **generated rails in blue and authored `extra` walls in pink**, which is the
  quickest way to see that `enclose()` has fenced off an edge you meant to
  leave open, or left one open you meant to fence.
- **water, gaps, the tee, and the cup with the clearance the tests want round
  it**, plus a **metre grid through the origin**, because every number in
  `courses.js` is a measurement from there.

And then the part that does the real work: **the pointer reads out where it is
on the course**, against the pads themselves rather than a flat plane, so the
number is right on a ramp too. Point at a corner and you have the `x` and `z`
to type. That is the whole authoring loop — look at the hole, point at where
the thing should go, read the numbers, write them down — and it is the
difference between building a hole and guessing at one.

`G3.debug.dump()` prints the current hole back out in the form `courses.js`
writes one in — the pads, the water, the gaps, the `extra` walls, the tee and
the cup, and not the rails, since those are generated and printing them would
turn a hole that follows its own floor into a hole with forty boxes nailed to
it. It prints primitives rather than sugar: a `beam()` comes back out as the
three walls it is.

The panel also **lints the hole** against the rules above that can be checked
without playing it: a wall thinner than 0.24, a cup too close to its pad edge,
a tee or a cup buried in a wall, and two pads fighting for the same ground. Those same rules are asserted
in `tests.html` and **`tests.html` is still the authority** — it also *plays*
the hole, which is the only check that really matters and the only one that
cannot be done in a panel. What is here is the subset that can answer back in
the same second you make the mistake.

None of it costs a normal frame anything: the overlay does not exist until the
inspector is switched on.

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
- **A pad is a surface, not a solid — except from the side.** The ground is a
  set of quads with nothing underneath them, which is exactly what makes
  bridges work and exactly what lets a ball fly *into* the side of a step and
  sail on through the hillside, out of the world beneath it. So the airborne
  step has one extra test: if there is nothing to stand on at the ball's own
  height and yet there is ground at the point, the ball's centre is inside
  something, and the height it started the step at says which way it got in. A
  centre that was above that ground came down onto the top of it and lands; a
  centre that was below it flew into the face, and bounces off one axis at a
  time like the kerb backstop on the ground. That same condition tells a cliff
  from a bridge — under a bridge there is a pad *below* the ball, and it never
  fires. Without it a terrace swallows balls and a raised green can be holed
  from underneath.

  **The centre, not the crown.** Reading "inside a face" off the top of the
  ball leaves a radius-deep band around every riser in which the centre is
  already under the surface and nothing has fired — so a shot that grazes the
  lip of a step slips in through the last few centimetres, and from in there
  undoing the step is no help, because the step before was inside too. It sinks
  until it is out of the world. A ball that is inside a face and cannot be
  backed out of it is therefore shoved through the nearest edge of the pad it
  is under, which is the one thing that guarantees the hillside always has an
  outside.
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
  that drops in settles instead of rattling — and **it is open from above and
  nowhere else**. That last clause is not decoration. The shaft is modelled as a
  cylinder with no sides above the rim, which is fine as long as the only way to
  reach it is across the green; give a hole a raised green with an open edge — a
  tabletop, a summit, the wall of a crater — and there is suddenly air under the
  putting surface, and a ball can fly *beneath* it, arrive inside the mouth on
  the way past, and be counted as holed from below. So the shaft only accepts a
  ball that has been over it with its centre at or above the rim. A putt
  crossing the lip qualifies; a lob dropping in qualifies; a shot passing under
  the green does not, and takes the splash it earned. The permission clears the
  moment the ball is out of reach of the rim again, so a lip-out cannot bank
  it.

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
other. It also runs **past** a full swing — see [the overdraw](#the-overdraw).

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

**And it is a cone, not a line.** What is drawn in front of the ball is one
simulated flight with a cone opened around it, and the width of that cone is
exactly how little the game is promising: `physics.spray()` says how far off
line and off weight this particular swing can come out, the renderer opens the
cone by that much, and inside a full swing — where the spray is nil — it is a
narrow wedge that means *exactly here*. Past a full swing it flares, and the
mouth of it is the miss you are risking.

It also **stops**. The path is walked in ground distance rather than in
simulation time, cut at `CONE_RANGE` units in front of the ball, and faded out
over the last stretch of whatever it drew, so it ends by going quiet rather than
by being chopped off. A driver's roll is longer than that cutoff on purpose: a
preview that ran the length of the hole was a promise about where the ball would
stop, and it was never able to keep one. The arrowhead — the landing, or the
first rail — is drawn **only when it falls inside the cone**, so its absence is
the game saying it does not know.

This replaced a plane: two power-perturbed arcs, a bit light and a bit heavy,
with a quad strip between them. That said something true about how coarse a
thumb on a meter is and nothing at all about the shot being played, and it cost
three runs of the simulation to say it. The cone costs one.

Everything else is feedback, and all of it is scaled by the same fraction of the
swing:

- a **band** stretching back behind the ball, the part of a catapult you can see
  straining;
- a **ring** round the ball that fills as the power winds on, green through
  amber to red;
- a **ratchet** — one tick per tenth — so a long pull *sounds* like a long pull;
- the **overswing mark** at 85%, past which the meter turns and pulses, and the
  **full-swing line** at 100%, past which it is hatched red;
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

- **The topbar** is one row and never more than one. The view and fullscreen
  stay out where a thumb can reach them mid-shot; Courses, restart, the card,
  the rules, sound and the music fold behind ☰ — a real menu that shuts on a
  press outside it, on `Escape`, and on picking anything out of it. Wide enough
  for all eight and the wrapper drops out of the layout entirely
  (`display: contents`) and the chips sit in the row as before. The view chip
  names the seat the camera is in rather than the one the press would take you
  to, and carries a `min-width` so the bar does not shuffle sideways when the
  name changes length. It is also the *only* thing that names it: switching
  seats used to raise a toast as well, which put the word Overview in a pill a
  thumb's width from the chip that had just started saying Overview — the same
  label twice, across the top of the course, for the one change on screen that
  announces itself.
- **Compact chrome** is on wherever the immersive layout is — a narrow window, a
  touch screen, or fullscreen on anything — and `game.js` decides it in one
  place (`syncCompact`) so the bar's two modes cannot disagree with the
  stylesheet's. In it the topbar stops standing above the canvas and starts
  floating over it on a scrim, which is worth 50 to 90 points of course; the
  scrim itself takes no presses, so a drag that starts on it still turns the
  camera. Toggling it resizes the renderer, because the canvas has just been
  handed the height the bar was standing in.
- **The hole card** says what a hole is — name, blurb, par, distance, sky — when
  the hole loads, and then leaves: three and a half seconds, or the moment you
  touch the course, whichever comes first. It used to be a line of text pinned
  under the hole's name for the whole round, and after that a panel a third of
  the way down the middle of the course in title-card type — an introduction
  standing on the hole it was introducing, which on a phone is the hole. Now it
  is a note in the corner: tucked under the overlay it belongs to, the same
  width, at caption size, with the course-and-hole line dropped because both the
  overlay and the scoreboard already carry it. Held sideways, where there is no
  room for a third line, the sentence about the hole goes too and the name and
  the numbers stay. Nothing is lost by shrinking it — the name in the scoreboard
  and the overlay's drawer both ask for all of it back.
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

### The view dial

The camera used to have exactly one place to be: behind the ball, on the aim
line, because that is what makes *drag left, aim left* true from any angle. It
still does that — but it meant the only way to look at a hole from the side was
to point the shot at the side, and put it back afterwards from memory.

So the two are separate numbers now. `cam.yaw` is the aim, set from
`state.aim.yaw` every frame the way it always was. `cam.view` is how far round
the ball the player has walked from there, and `updateCamera` subtracts one
from the other — subtracts, because `view` is measured the way a player walks
and yaw the way the world turns underneath them. Zero is straight behind the
ball; half a turn either way stands in front of it looking back down the shot.
Nothing else in the game reads it: the physics, the preview cone and the aim
wedge all still hang off `aim.yaw` alone, so a side-on view cannot change where
a ball goes.

The control for it sits above the power meter — the same shape, because it is
the same kind of thing: press anywhere to stand there, drag to walk round, and
the knob is *where you are*, so sliding it right stands you to the right of the
line and the shot lies away to the left of the screen. The ⌖ in the middle of
the track walks it straight back and levels the pitch with it; the zoom is left
alone, being its own control. It lights up whenever there is anything to undo.

#### The lock

The dial answers *how far round the ball am I standing*. The padlock beside it
answers **round from what** — and that is the last piece of the same problem.

Unlocked, the reference is the aim, so turning the shot turns the camera with
it. That is the game's own habit and the right one while you are playing a
shot: left is always left. It is the wrong one the moment you stop playing and
start reading. On the overview it is actively hostile — a drag to aim swings
the entire hole round underneath you, so there is no way to look at the map and
aim at the same time, which is most of what an overview is for. Locked, the
reference is `cam.bearing`, a fixed direction in the world, and the shot turns
under a camera that stays put.

It is one expression in `updateCamera`:

```js
var yaw = (c.lock ? c.bearing : c.yaw) - c.view;
```

Two things are worth keeping if this is ever rebuilt:

- **Neither locking nor unlocking may move the picture.** Locking is easy: the
  bearing it freezes at is the one it is already looking along. Unlocking is
  the interesting half, because the aim has been turning the whole time the
  lock was on, and handing the camera back to it would snap the view round by
  however far the shot has travelled. So that drift is folded into the dial
  instead — which is exactly what the dial means, *how far off the aim line you
  are now standing* — wrapped to half a turn either way first, because the
  dial's two ends are the same place and a raw difference of four radians would
  clamp rather than wrap. `render.setLock` returns the offset to adopt and
  `game.setView` does the clamping, so there is one place that decides what the
  dial may hold.
- **The lock changes what the dial is measured from, not what it means.** The
  readout says `Locked · 45° right` rather than a different number, because the
  number is still the dial's own — 45° round from the reference — and only the
  reference has changed. The knob dims while locked, since it is no longer
  showing something the player is holding.

The seat still does its job either way: follow still follows the ball down the
course, it simply stops swinging round with the aim. Straightening (`0`) takes
the lock off with it — straight means straight behind the ball, and a locked
camera is standing wherever the shot has since turned away from — and so does a
new hole, along with the pitch and the seat.

Two details are worth keeping if this is ever rebuilt:

- **The press is taken on the dial, not the track.** The ⌖ covers the middle of
  the track, which is exactly where the knob rests when the view is straight —
  and a control you cannot start dragging from its resting position is no
  control at all. So a press that lands on the ⌖ is a reset until it has
  travelled six pixels, and a drag from there on; the button's click is
  swallowed once that happens.
- **A new hole straightens it**, along with the pitch, the seat and the lock. An
  angle is a thing you chose for the hole in front of you, and the next hole is
  not that hole.

The dial is an offset on the *seat*, not a replacement for it: `V` picks which
of [three cameras](#the-three-cameras) you are sitting in and this walks you
round from wherever that puts you. Straight is behind the ball in follow and
square across the shot side on, and the dial turns either of them — and the
overview with them, so a hole looked at from one end stays looked at from that
end.

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
  It also runs at about a third of the level it used to; see below.

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

`render.js` is the only file that draws the course. (It is not the only one
that knows three.js exists — `bag.js`, `weather.js` and `postfx.js` do too, and
that is the point of them being separate files: one draws the world the
simulation knows about, and the others draw furniture, air and the picture
afterwards.) Everything it draws comes from the same data the simulation
reads: pads are boxes sheared by the
pad's own gradient (a shear keeps the vertical edges vertical, so a tilted pad
still meets its neighbours), and a pad's underside reaches the surrounding
ground so a raised green reads as a plateau rather than a slab in mid-air.
Boards are the exception and stay thin — a jetty should look like a plank, not
a causeway.

A pad standing on *another pad* is the second exception, and it had to be
found the hard way. courses.js says what a pad is and never what is underneath
it, so the underside reached the surrounding ground whatever was in between —
which on Tabletop, whose green is a metre up on an apron that runs beneath it,
meant a metre and a half of side wall driven straight down through the apron:
two surfaces crossing inside each other, and a seam flickering along the
intersection wherever the depth buffer could not choose between them. From the
overview, the one view that puts a raised green against the ground beside it in
every frame, that seam was the first thing the eye found. So the slab stops at
the first surface below it instead — the highest pad whose footprint this one
overlaps, measured across the overlap rather than at a centre that may not be
inside it, so a ramp underneath is read where it actually passes, and a pad
with a cup in it is never cut shorter than the cup is deep. A pad over water,
or over nothing, finds no support and reaches the surround exactly as before.
Of the eighty-six pads on the five courses exactly one is affected, which is
the point: this is a fix for a case the data allows and the author used once.

Textures are drawn into canvases at load: grass, sand, planks and rock. No
image files to ship and no requests to fail.

**A surface texture is shared, and the tiling lives in the geometry** — and it
is anchored to the world, not to the pad. It used
to be the other way round, and that is worth writing down because it looked
right. Each pad cloned its own copy of the grass with `repeat` set to that
pad's size — which is one GPU texture per pad, so The Reach, at eleven pads,
uploaded twenty-three 512² canvases and threw all of them away on the next
hole. But the tiling is a property of the *pad*, not of the texture, so it now
lives where the pad does: the UVs are scaled when the geometry is built, and
one texture serves every pad of a kind at every size. `textures.SCALE` is the
one number the two halves have to agree on, which is why it sits in
`textures.js` next to the textures rather than in `render.js` next to the
geometry. The same argument applies to the materials, so there is now one per
surface kind and one per coat of paint, rather than one per pad and one per
rail. On The Reach that is 23 textures and 59 materials down to 3 and 20, and
a hole that builds in a third of the time. The grass is redrawn when the
*theme* changes rather than when the hole does, which is most of that: it is a
512² canvas with five thousand blade strokes in it, and six holes of a course
were each paying for their own copy of the same one.

Anchoring those UVs to the world rather than to the pad came later and is the
subject of [the mower](#the-mower) below: a pad-anchored tiling restarts its
pattern at every seam, which on a green means the mow bands stop and start
again at each join.

The exception that proves the rule is the green's bump map, which tiles finer
than its colour map. That is a *ratio* rather than a pad size — a constant —
so it is the one texture that still carries a `repeat`.

The green is the one surface the camera is always looking at, so it gets the
most attention — mow bands with a soft seam, broad mottling so the tiling does
not show as a grid, a mat of blade strokes, and a bump map of the same blades so
the light rakes across it. It is also the only surface on Phong rather than
Lambert; a little sheen is the difference between mown grass and green paint.

### The grass stands up

All of that is a picture painted flat, and a painted picture of grass stops
convincing anybody the moment the camera drops to ball height: the green has no
silhouette, and its edge against a rail is a razor line. So the greens are
**shell textured** — the oldest trick for drawing fur in real time, and the one
technique in here that is not a texture.

The pad's own outline is drawn again six times at rising heights, all six
within twelve centimetres of the surface, each wearing the same blade sheet.
What makes it work is one channel: **the sheet's alpha is a height field**, and
layer *n* of *N* keeps a texel only where alpha ≥ n/N. Every shell up the stack
keeps fewer blades than the one below, the tips are the last thing left, and
what the camera looks through is a field of blades with air between them.

**A blade is a smear, not a stroke.** The first version drew each blade as a
line of constant alpha, and that is exactly why it read as speckle: a stroke
with one alpha value is either wholly in a layer or wholly out of it, so every
shell was the same mat with fewer dots in it and nothing ever tapered. What a
blade actually occupies is a smear — at height *y* it stands at its root plus
its lean times *y*, narrowing as it goes — so the texel at the root end belongs
to the bottom of the blade and the texel at the far end to its tip. Which means
**alpha has to climb along the blade**, from nothing at the root to the blade's
full height at the tip, while the blade narrows. Do that and a low shell keeps
the whole smear, a high one keeps only the tip, and the mat tapers and leans at
the same time, for free.

That is one tapered triangle under a gradient per blade, ten thousand of them,
and ten thousand `createLinearGradient` calls is a quarter of a second. So the
blade is drawn *once* into a small sprite and stamped — rotated, scaled, and
with `globalAlpha` set to its height, which scales the whole ramp and so sets
the blade's height in one number. Under the blades is the **thatch**: strands
two texels wide and four tall written straight into an `ImageData`, dense
enough to hide the ground and low enough in the height field that only the
bottom shell keeps any of it. A million texels through `putImageData` is forty
milliseconds; forty thousand more little fills is not.

**None of it depends on the theme.** The blades are a pale neutral green and
the course's own colour arrives as the material's, so the sheets are built once
at start-up (about a tenth of a second) and never rebuilt — where the first
version redrew them on every change of course.

#### The mower

A golf green is striped, and the stripes are not paint: a mower goes up one
pass and back down the next, and the blades lie the way they were last driven
over. Shell texturing can say that directly, so the sheet's top half is combed
one way and its bottom half the other, and a tile is exactly two passes of the
mower across.

For that to mean anything the sheet has to know where it is, so **the pad UVs
are anchored to the world rather than to the pad** — the world x and z divided
by the tile size, written from the vertex positions rather than scaled from
whatever UVs the geometry arrived with. Every seam disappears: the bands run
unbroken across a hole instead of restarting at each pad edge, two pads of the
same size stop being copies of each other, and a box, an extruded slab and a
plane all come out agreeing with each other, which they did not before. The
green's colour map got the same treatment and the same band width, so the
stripes survive into the distance after the shells have mipped away.
`textures.MOW` is the one number the three of them have to agree on.

#### The turf shader

The rest is four fragments of GLSL spliced into three.js's own Lambert with
`onBeforeCompile` (`shaders.js`, `TURF_*`), at `<alphatest_fragment>` —
the last moment before the cut-out is decided and the first at which the map
has been sampled. It buys three things a texture cannot, because all three need
to know where in the *world* a fragment is rather than where in the tile:

- **Patches.** Two octaves of value noise scale the height field, so turf grows
  thick in some places and thin in others at a scale far larger than any tile —
  which is also the thing that stops a repeating sheet reading as a repeating
  sheet.
- **The mower's light.** The comb is in the sheet, but a comb on flat planes
  changes only the silhouette, and most of what you see in a striped green is
  the light coming back differently off blades leaning towards you and away.
  That is a few percent of brightness alternating every `MOW`, and it is worth
  more than the comb it is drawn on top of.
- **Colour that is not one colour**, from the same noise, quietly.

One uniform, `mowK` — π over the mower's width — because writing 3.59 in two
files is how two files stop agreeing.

#### What it costs

Very little, in the two ways that matter. The shells are **opaque with a
cut-out**, not blended: `alphaTest` writes depth, so six layers sort themselves
and cost six opaque draws rather than a sorted transparent pass. And they obey
the same rule as every other surface — one material per layer per kind, shared
by every pad wearing it — so a hole with a dozen greens has six shell
materials, not seventy-two. Mipmapping gives the level of detail for free: the
alpha averages down with distance until it stops clearing the cutoff, and a
green across the course quietly goes back to being the flat texture it always
was. A coarse-pointer device gets four layers and a half-resolution sheet.

The wind moves them: each shell is offset along the wind's own bearing by the
cube of its height above the roots — the roots barely move and the tips do all
of the leaning, which is how a blade bends — and the sine that drives it
carries the pad's position *down* the wind in its phase, so a gust crosses the
hole as a wave rather than every green waving in unison. It is the same wind
vector the flag reads, and like the flag it touches nothing the ball does. A
full gale bends the mat by half its own height and no further; past that the
top of the stack visibly slides off the bottom of it, which is the one way this
technique gives itself away.

The rough is the same code with a wilder lean, twice the height and no comb —
long grass lies every way at once. The fairway sits between the two: the
green's own sheets and the green's own colour map, tiled about twice as big so
the mow bands come out wider, half again as tall, and darkened by its material.
Three grasses, one set of blades, and what tells them apart is height and
stripe width — which is what tells them apart on a real course too.

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

### The three cameras

The camera is never flown directly. It is placed off the aim line, which is
what makes "drag left, aim left" true from any of the three seats `V` walks
between — and each of them is turned, in place, by the
[view dial](#the-view-dial): `cam.mode` is which seat, `cam.view` is how far
round from it the player has walked, and `updateCamera` is where the two meet.

- **Follow**, behind the ball and down the shot. The one you play from, and the
  one a new hole always starts in.
- **Side on**, square across the shot and low — about fourteen degrees above
  it, and the seat where the dial starts from a quarter turn rather than none. This game has a third axis and a bag of clubs with lofts in it, and from
  behind the ball the *height* of a shot is the one thing you cannot read: a
  wedge that clears the rail and a wedge that hits it look identical until it
  lands. From over here they do not. It looks at a point down the aim line
  rather than at the ball, so the ball sits at the edge of the frame and the
  ground it has to cross fills the rest. Which side it stands on is whichever
  is further *out* of the hole — the view is across the course rather than
  through a rail — and it only swaps when the other side is clearly better,
  because a choice that tips over on a hair sends the camera sweeping through
  the ball every time the aim turns.
- **Overview**, backed off along the aim line far enough to fit the hole's
  bounding radius inside the narrower of the two frustum half-angles.

**The overview lifts the weather.** It used to be worthless on half the courses
and worse than worthless on a misty one: the fog distances are the theme's,
scaled by the weather (`buildHole`), and both are chosen for a camera standing
*on* the course rather than forty units above it — so the map of a hole in mist
was a grey rectangle, seen through four sheets of ground fog and whatever rain
was falling. Rather than special-case the weather, the camera lifts it.
`R.lift` runs 0 to 1 with the view and eases over about a second, and three
things ride on it: the fog's near and far are pushed out past whatever distance
the map is standing back at (`Math.max`, so a clear day is untouched — it never
*adds* fog), the rain and the mist banks thin to a seventh of themselves
(`weather.setAtmosphere`), and the markers come up — a ring under the ball,
pulsing slowly because from up there the ball is four pixels across, and two
rings at the cup, the outer one breathing half a turn behind it so the two ends
of the shot are never both at their faintest. All of them are drawn with the
depth test off, so a ridge between them hides neither.

The cup used to get a beacon as well: an open cylinder four metres tall
standing in the hole, unlit, drawn through everything. Straight down it was
invisible, which is the only angle it was ever designed for; from the tilt the
overview actually sits at it was a fat yellow post beside the pin — taller than
the pin, brighter than the flag, and passing through every rail between it and
the camera, because the depth test was off. The flagstick already marks the cup
and is the right height for it, so the beacon is gone and the outer ring does
its job from the ground.

None of it touches the hole. The weather is exactly what it was the moment you
drop back behind the ball, the water reads the same lifted fog as the lit
materials so the sea cannot go grey while the greens beside it stay clear, and
the simulation has never heard of any of this.

### What a frame does not do

The most expensive thing in a frame is not the picture, it is the **shot
preview**: a run of the simulation, up to a second, at a hundred and twenty
steps a second (three runs, until the plane became a cone). On Double Doors with a putter in hand that is about six
milliseconds of a desktop's frame and rather more than a whole frame of a
phone's — and it was being paid on every frame the player spent looking at a
shot they had not touched.

So it is computed when the shot changes and not otherwise. What the path
depends on is small and knowable: where the ball is, where it is aimed, how
hard, at what loft, and — only on a hole with a gate or a blade on it — the
clock, because those keep moving while you stand still.

Exactly six of the forty-two holes have anything moving, and all six are
Windmill Works. On the other thirty-six that is a run of the simulation per
*aim* rather than one per frame — measured at 3 in 120 frames against 360 — so
six of the seven courses now pay nothing at all to stand and look. On Windmill Works
the clock is compared at 24Hz instead of at the frame rate. The gate itself
still slides every frame, placed by `syncMovers` from the solver's own clock;
what refreshes at 24Hz is the translucent band of the prediction, which is the
one thing on screen already allowed to snap, since a hair's difference in
timing is what turns "through the gap" into "off the gate".

Almost nothing has to be invalidated by hand, which is the part that makes it
safe. The geometry the preview writes into is persistent, so a frame that skips
the work leaves the last answer on screen — and the last answer is still the
right one, because the inputs it was computed from are exactly what is being
compared against. The one deliberate invalidation is a new hole, where the
world the numbers described has been replaced underneath them.

Three smaller things in the same spirit. The camera lerp, the ball's spin axis
and the wind are **scratch objects** rather than fresh ones each frame. The two
readouts refreshed on the frame rather than on the shot — the distance to the
cup and the wind speed — **compare before they write**, because writing the
string that is already there is a layout the browser did not need to do. And
the bag, which is a still object once it is shut, **stops easing** until one of
the four things that can move it says otherwise.

## Tests

Open `tests.html`. 897 assertions covering the surfaces, the collision
geometry, the cup, the integrator, the bag, all forty-two holes of course data
and the scorecard, in a few seconds.

The one worth knowing about is the **bot**: a greedy player fans out candidate
shots on every hole, keeps the one that finishes nearest the cup, and plays all
thirty. If a hole is sealed off, unreachable, or has a cup buried where
nothing can settle, the bot never holes out and the suite goes red. It is
deterministic, so a failure is reproducible rather than "sometimes red", it
plays out of the same five clubs the player gets, its candidates include a wait
before striking (the timing holes are only solvable with one, and a bot that
always fires at `t=0` would report a false failure), and a chosen shot has to
actually go somewhere — without that rule the greedy
player parks in a corner where every legal shot looks worse than standing still
and plays the same nothing until it runs out of strokes.

Then it plays some of them again **out of half a bag.** A hole flagged
`needsLoft` exists to be flown, and a hole like that which turns out to have a
quiet route along the floor has lost its point — usually because a rail moved or
a step got shorter, and always without anyone noticing. So the same bot replays
those eight holes with only the clubs that keep the ball down, and has to *fail*
on every one. It is a stronger statement than "the wedge works here": it is
"nothing else does". Holes without the flag are free to have a flat answer, and
several deliberately do — Under the Boardwalk wants one, The Backboard's bank
and Two Roads' low road are the whole point of those holes, and The Gorge will
let you lay up and blast it for the price of a stroke.

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
under `loftLinks.muted` — and *absent* there means muted, which is how a first
visit is silent — with the band's own switch under `loftLinks.music`. Both writes are wrapped — a browser with storage
disabled should cost you your records, not your round.

## Sound

Three rules, all of them about not being the tab somebody is hunting for.

**It starts muted.** A game that begins talking to a room is a game that gets
closed, so a first visit is silent and the speaker chip is the invitation.
After that the choice is remembered whichever way it went, and unmuting is also
the gesture that finally creates the `AudioContext` — browsers will not start
one before a gesture, and a suspended one warns on every load.

**Nothing plays into a tab you are not looking at.** Everything — effects, bed
and band alike — goes through one master gain, and that is the only thing the
mute, the fade and the duck have to touch. `visibilitychange` and the window's
own focus drop it to nothing over a tenth of a second (a hard cut clicks) and
then suspend the whole context, which stops the bed's loop, the band's clock
and the audio thread with it. Alt-tabbing counts: the tab is still visible, and
it is still the same "I am not here".

**There is a band.** `music.js` is a smooth jazz quartet with no audio files in
it: a Rhodes comping two or three chords a bar and never on the beat, an
upright walking quarter notes and approaching each new root chromatically,
brushes — a swirl on two and four, a ride in swung eighths — and a horn that is
silent most of the time, because a melody playing continuously over a game is a
melody you will mute inside a minute. The chart is sixteen hand-written bars in
F, as MIDI numbers: a voicing written out is one line to read, and a chord
engine is a file to maintain. A convolver over a second of decaying noise puts
them all in the same room, and a compressor keeps the bar where everything
lands at once from poking out of the mix.

**Timing is scheduled, never fired from a timer.** A `setInterval` looks a bar
ahead and books every note against `ctx.currentTime`; the interval only has to
be roughly punctual and Web Audio places the note exactly. It is also why a
throttled background tab cannot make it stumble — a suspended context stops its
clock, so on the way back the band drops whatever backlog accrued and comes in
on the next bar rather than playing it all at once.

<kbd>M</kbd> is sound, <kbd>J</kbd> is the band on its own. Two switches rather
than one, because "sound" and "music" being the same control is how you end up
with neither: some people want a hole with weather on it and nothing else.

## Controls

Drag back from the ball and let go; drag sideways to swing the aim, and the
camera swings with it. Where the camera stands *relative to* that aim is the
[view dial](#the-view-dial), not the drag. Keys: <kbd>←</kbd><kbd>→</kbd> aim,
<kbd>↑</kbd><kbd>↓</kbd> power (<kbd>End</kbd> a full swing, <kbd>shift</kbd>
+<kbd>End</kbd> the overdraw), <kbd>1</kbd>–<kbd>4</kbd> club (<kbd>C</kbd>
cycles), <kbd>space</kbd> hit, <kbd>shift</kbd> for fine control, <kbd>V</kbd>
the seat — follow, side on, overview — <kbd>,</kbd><kbd>.</kbd> walk the view
round the ball, <kbd>L</kbd> lock it where it is, <kbd>0</kbd> straighten it,
<kbd>F</kbd> fullscreen, <kbd>R</kbd> restart the hole, <kbd>W</kbd> the
weather, <kbd>H</kbd> the rules, <kbd>M</kbd> sound, <kbd>J</kbd> the music,
<kbd>G</kbd> the course inspector. Scroll or pinch to zoom.

## Query parameters

`?course=seaside|quarry|works|tidewater|highland` starts a round directly,
skipping the picker, `&hole=1..6` jumps to a hole, and
`&weather=clear|fair|overcast|drizzle|rain|mist|golden|dust` fixes the sky for
the round. Handy for screenshots and for linking someone at the hole you are
complaining about, in the weather you were complaining about it in.

`&debug=1` opens the [course inspector](#the-inspector) with the hole, which is
how you would start a session spent building one. <kbd>G</kbd> does the same
thing at any point without reloading.
