# Pocket Links

A 2D mini golf game with seven courses of six holes, climbing from a walled
garden to a volcano — plus one more that is generated from a seed and is
different every time you ask for one. Each course is a place with a trick of
its own: parkland corners and posts, the sea's water, a wood's hills and
sweeping bars, a meadow's tunnels, a mountain's avalanche chutes and a
volcano's lava and geysers — and the first card walks through all of those
places in six holes, with an ace to find on every one. A first visit is handed
that card and a reason to finish it; every hole gives up to three stars, and
stars open the next card. Up to four can play on one screen. Any course can be
dressed in any of eleven biomes, autumn, winter, desert and a moonlit night
among them. A hole may run on the slant, bend round a curve, rise over a hill
and have a windmill in the middle of it.
Canvas, plain ES5-flavoured JavaScript, no build step and no dependencies —
same as everything else here, open `index.html` and it runs.

## Files

| Path | What it is |
| --- | --- |
| `index.html` | Page shell: bar, scoreboard, canvas, banner, course picker and scorecard modals. |
| `style.css` | Page chrome. The course itself is all canvas. |
| `js/config.js` | Every tuning constant. Nothing else holds a magic number. |
| `js/courses.js` | Every hand-built course, as data. |
| `js/generator.js` | Courses dealt from a seed. See [The draw](#the-draw). |
| `js/physics.js` | The simulation. No DOM, no canvas, pure. |
| `js/bot.js` | The caddie: plans a line to the cup over simulated shots. Pure. See [The caddie](#the-caddie-autoplay). |
| `js/scoring.js` | Scorecard arithmetic, the pick-up, stars and the save file. |
| `js/progress.js` | Which courses are open, and the lessons a first round teaches. See [Starting up](#starting-up-and-the-stars). |
| `js/audio.js` | Synthesised sound effects and each biome's soundscape — no audio files to ship. |
| `js/scenery.js` | The biomes, hazard outlines and where decoration goes. Draws nothing. See [Biomes](#biomes-and-what-a-hole-is-drawn-as). |
| `js/plan.js` | Flat hole thumbnails for the course picker. Nothing on the board reads it. |
| `js/landscape.js` | The place: turf, hazards, walls, posts, trees, weather, the rim — and the cached layers. |
| `js/props.js` | Curved walls, blocks and what stands in them (beds, hedges, rocks, sandcastles, a windmill, a fan), hills, the wind, and the tracks gates run in. See [Curves, blocks, hills and props](#curves-blocks-hills-and-props). |
| `js/water.js` | The water's surface, as a WebGL shader over a depth field, with the 2D picture as its fallback. See [Water](#water). |
| `js/ambience.js` | What lives over the course — snow, leaves, birds, fireflies — and the dark of the night biome. Stateless, driven by the clock. |
| `js/render.js` | The frame: ball, cup, tunnels, aim, effects, and the order everything is laid down in. |
| `js/game.js` | Loop, input, what a shot means, the title screen and the party. |
| `level-editor.html` | Visual hole editor. See [The editor](#the-editor). |
| `editor/editor.js` | All of it. Runs on the game's own modules, owns no copy of any of them. |
| `editor/editor.css` | Sidebar chrome. The green in there is the game's renderer. |
| `tests.html` | Headless test harness for the logic. Open it; green is green. |
| `ui-tests.html` | The same, for the page — the bar, the ☰ panel, the picker, the title, a party, the turned and side layouts. |

## The seven courses

`GOLF.COURSES` is a rack of cards, each `{ id, name, blurb, holes }`, and
`GOLF.COURSE` is whichever one is being played. Everything downstream — the
loop, the scorecard, the editor, the suite — reads `GOLF.COURSE` and never
learns there was a choice; `GOLF.selectCourse(id)` is the one place that
changes, and it answers `null` for an id that is not on the rack, which is
the whole handling a stale stored preference needs.

**The rack is a ladder.** Every card is six holes, drawn in a place of its own
and built round one thing that place does, and the order is the order the
stars open them — `unlock` on each card: the Short Six from the start, then the
Old Course at 4, Tidewater at 10, the Wild Six at 18, the Warren at 26,
Avalanche Pass at 34 and Ember Ridge at 42, and the draw, which the generator
puts last, at 50. Each threshold is about a third of the stars the cards above
it can give, so finishing holes is enough and playing them well is quicker.
Inside a card the holes get harder as they go, and par is the honest short
measure of that: the suite pins that par never falls going down a card, and
that the thresholds never fall going down the rack, so the picker reads top to
bottom as a climb. No position on the rack is load-bearing: the save keys
follow `GOLF.BARE_KEY_COURSE` by id (see [Saving](#saving)).

- **The Short Six** is the card a first visit is handed, and the trailer for
  everything after it: six short holes, each set in a different place in the
  order the rack climbs through them — a walled **Garden Gate**, a parkland
  dogleg (**Bank Holiday**) whose outside corner is a curve to ride, a beach of
  **Sandcastles** with the sea behind the cup, a **Molehill** in a wood, **The
  Windmill** in a meadow with a tunnel through its door, and a **Snow Cannon**
  blowing across a mountain piste onto a frozen tarn. Each hole meets its
  place's idea gently and alone. Par is two or three, set for the safe way
  round, and every hole has an ace in it for the player who reads it — a
  weight, a bank, a door, a wind. See [Designing a hole](#designing-a-hole).
- **The Old Course** (parkland) is what the game always was, boiled down to
  the six that were each a different idea: up the field through a bunker,
  round a corner, a table of posts, the cushions, two doors to time, and a
  room whose only door faces away. Walls and posts and nothing else — the
  angles are the hazard, and since its second pass it has the angles to bank
  off: a neck of grass through the bunker, a bank board at the corner, a
  pinball table with a dome, a curved rail over a hedge and a round keep. The
  first four have an ace for the player who reads the angle; the last two are
  honest par fours played in stages.
- **The Tidewater Six** (seaside) puts water on every hole, which is the only
  hazard that does not slow the ball or push it about — it takes the shot off
  you and asks for it again. That makes it a course about weight rather than
  about lines, and it is why the crossings are wide: ninety pixels at the
  tightest and mostly a hundred and twenty, because a hole that punishes a
  miss with a stroke cannot also demand a thread. Ducks and Drakes is the one
  hole built on the skip: a creek cushion to cushion, a footbridge at the far
  end that costs a stroke, and a short way straight over for a hard, flat ball.
- **The Wild Six** (woodland) is where the ground moves the ball: hills
  breaking opposite ways, a hill that runs back at you, a green that sheds
  everything you leave on it, a funnel, a lattice of posts, and the one
  mechanic that arrives here rather than being recombined — a moving wall does
  not only block, it pushes (physics.js adds the wall's own velocity along the
  contact normal, so a gate cannot swallow a resting ball), and Wiper Blades
  makes that the hole.
- **The Warren** (meadow) is the card built on a door: a **tunnel**, two
  mouths that run both ways and keep the shot. Whatever speed and heading the
  ball goes down one mouth with, it comes up the other with, and each hole
  reads a different consequence off that sentence — that weight survives the
  trip (Snow Globe, a cup shut in a box of ice), that heading survives it too
  and is the thing to aim (Crossed Wires), and that a door can be a trap as
  easily as a shortcut (Snakes and Ladders). Every hole on it has one, and the
  suite says so.
- **Avalanche Pass** (alpine) is the card of the clock. A chute is a lane down
  the mountain, and every few seconds a slide comes down it and carries off
  whatever it is over — into a drift if you are lucky, into a crevasse if you
  are not. It is a band you can watch coming, with smoke and a trickle at the
  head of the chute a second before, and the gap behind it is the shot: one
  chute to learn on, a chute that runs out into a crevasse with a long way
  round over its head, two lanes of traffic running opposite ways on different
  clocks, and a summit reached by a hairpin through an avalanche gully — with
  a frozen tarn and an iced slalom between them.
- **Ember Ridge** (volcanic) is the last card and the one most made of
  choices. **Lava** is water that never lets a ball skip, so every crossing is
  a risk taken or a long way round, and **geysers** are the risk: a vent blows
  for a second in every three, and a ball rolling over it then is thrown up
  and over whatever is beyond — the lava channel, the moat round an island,
  the river. Every hole has a safe way that costs strokes and a quick way that
  costs nerve, and par is set for the player who takes one chance in the
  round, not all of them. Every hole on it has lava, and the suite says so.

**What went, and why.** The rack used to be fifty-one holes over five cards —
an eighteen and a six that both taught the basics, and three nines that
recombined them — and a good share were the same idea twice: an island green
on three cards, four straight holes through a gap, three different
one-of-everything closers that were nearly the same picture, and slopes,
gates and causeways in pairs and threes. Every hole that was another hole
again is gone; what stayed is the best one of each idea, put on the card
whose place it belongs to, and the new cards are built round hazards nothing
else on the rack has. Nine holes in ten also used to be teed off on the left
and holed on the right, which reads as one corridor however the furniture
changes, so a few of the holes that stayed are played the other way round —
`mirror()` in courses.js flips a hole as it is defined, so its data and its
comments still describe it as designed — and the new ones run up the field,
down it, on the diagonal and round a hairpin. The suite pins that every card
is played in at least two directions.

**The Short Six and the Old Course were rebuilt a second time** when the
vocabulary grew curves, blocks and hills, because both were still a field of
grass with a few boxes in it, and a box is the least interesting thing a ball
can meet. The other five cards have not had that pass yet.

Three of the holes started out with a free way round the obstacle they were
built on — over the top of the funnel, up the side lane of the lattice, along
the cushion past the wipers. None of them is walled off. They are all lined
with **rough** instead: the short line has to be earned, the long one costs a
stroke's worth of roll and nothing more.

**The die deals a card you did not choose.** The 🎲 in the picker (or `D`, or
`?course=random` as a link) picks a course off the rack at random and starts
it. It never deals the one already under you — a press that changed nothing
would read as a broken button rather than as luck — so it goes through
exactly the path the picker does and lands you on the same tee a refresh
would: a random *choice*, not a random *round*.

**A course switch is not destructive and does not ask.** Each course keeps
its own round in progress and its own record, under keys qualified by the
course id — see [Saving](#saving) — so leaving one mid-round and coming back
puts you on the tee of the hole you left, which is the same promise a refresh
makes. Two cards are not comparable totals even at the same length, which is
the other half of why the save file is split: a round of the Short Six would
take the Old Course's record the first time anyone played one.

## Designing a hole

What makes one hole a pleasure and another a chore is the hardest question
the game has, and the second pass on the first two cards was built on the
answers that hold up — from golf architecture, from people who build adventure
golf courses for a living, and from game level design:

- **A safe way and a bold way.** Alister MacKenzie's rule for a golf hole was
  that it should be strategic rather than penal: a choice, not a punishment.
  Adventure golf builders say the same thing in their trade's words — every
  hole wants a route that rewards a skilled, deliberate shot and a forgiving
  one that still lets a beginner succeed, and that pair is what makes a course
  worth playing twice. Here the forgiving route is par; the bold one is an
  ace, and it is always a *shot* — a weight against water behind the cup, a
  bank board, a curve to ride, a door to find, a wind to aim into — never a
  fluke. Par is set for the safe way, so the stars are there for anybody who
  finishes and the aces for anybody who looks.
- **No straight line.** A hole with a straight path from the tee to the cup
  asks one question, once. Players of mini golf games say it plainly: holes
  that are straight don't require much thought. So the line is broken — by a
  bed, a hedge, a mound, a mill — and what breaks it is something to bank off,
  ride round or curve past rather than a wall to walk round.
- **One idea, met alone, then combined.** Nintendo builds a level as an idea
  introduced where it is safe, developed, twisted and dropped
  (*kishōtenketsu*). A card is the same at a larger size: the Short Six meets
  each place's idea on a hole of its own — sand and water where they cost
  least, a hill before hills move, a wind with nothing else to think about —
  and the cards after it put them together.
- **Fair and readable.** A hazard the player cannot see coming is a trick
  played on them. Every hazard here says what it does before it does it: the
  gate runs in a track, the wind blows out of a fan, the hill is shaded like a
  hill and has a mole on it, the tunnel goes through a windmill's door. A
  force with no cause in sight reads as the game cheating, which is why the
  suite will not let a wind ship without its fan.
- **Variety and rhythm.** Holes differ in length, shape, direction and
  difficulty, and a hard hole sits beside an easy one — MacKenzie's "modest
  holes and heroic ones". Not every hole has to have an ace: The Keep and
  Sliding Doors are played in stages, and that is a different pleasure from a
  hole played in one stroke.
- **A place, not a diagram.** Theming is what makes a course remembered. The
  first card walks through every biome the rack is set in, so a first visit
  has seen where the game goes before it has finished one card.

Two tools in the scratch work for the pass are worth rebuilding if a card is
redesigned again: a sweep of every angle and weight from the tee, which says
whether an ace exists and how wide its window is, and the caddie's search,
which says what par is. A tutorial hole's ace window is a few degrees across;
a skill hole's is a degree and a narrow band of weight.

## Starting up, and the stars

A first visit used to open on the first tee of the old eighteen with a page of
reference text under it, which is a fine way to meet a game you already know
and a poor way to meet one you do not. It now does what a game has done since
there were arcades: a title, how far you have got, and the obvious next thing
under one press.

**The title screen** (`#title`) is a dialog over the board rather than a page
of its own. The hole it is offering is already drawn behind it, so its play
button is not a promise but a picture: *Start here — The Short Six* for a
first visit, *Continue* when there is a round under way, *Tee off* otherwise,
and *Continue party* when one is. Under it sit the stars you have, the course
they open next and how many more it costs. Esc brings it back with nothing
else open — the pause key every game has — and so does the ★ chip. A link
that names a course, a seed or a playtest has already answered its question
and goes straight to the tee.

**Stars are read, not stored.** Every hole gives three for beating par, two
for matching it, one for getting the ball down at all and none for a pick-up
(see [The pick-up](#the-pick-up)). They come off a per-hole best kept in each
course's own save file and written the moment a hole is holed — so a hole
played from a plan in the picker counts as much as one played on the way
round — and `progress.js` sums them. There is one record of how well you
played a hole and one way to read it; nothing can disagree with the
scorecard. The draw holds no record and so gives no stars, and nor does a
party. Under par rather than an ace for the third star, because on a par two
those are the same thing and on a par four they are not, and a star you can
only get by luck is not a goal. The picker shows each hole's stars on its plan,
which is the level select every game with stars has and the reason to go back
to the hole you bogeyed rather than on to the next card.

**Courses open on stars.** `unlock` on a card is the stars it asks for; the
Short Six asks for none. The hole that crosses a threshold says so on
its banner, and the course is then *granted* — written down by id — so a door
the stars opened stays open whatever happens to the thresholds later. Starting
a course grants it too, for the same reason. A locked card in the picker still
shows everything it holds, plans included, because what is coming is the
reason to keep going; it says what it costs and how far off that is, and its
plans cannot be pressed.

Three things keep the ladder a nudge rather than a wall:

- **Nothing a player had is taken away.** A browser with any of the old keys
  and no progress record is a *veteran* — every course open, the first stroke
  not shown again, every old hazard already met — because locking a card on
  somebody with a record on it would be the game forgetting them. The
  check runs before anything on the page writes a key of its own; the draw's
  seed is remembered on every load, and a first visit would otherwise look
  like a second.
- **A link is a key.** `?course=wild` opens the Wild Six for whoever it was
  sent to, and `?seed=` opens the draw. Somebody wanted you on that card.
- **The picker carries a way past.** *Open every course* under the list, for
  the visitor who came to look rather than to climb. Two presses, because it
  cannot be taken back and one stray tap on a phone should not spend
  somebody's progression for them.

**Starting over** is on the title screen, as two quiet links under the hint,
because they are two different wishes. *Replay the intro* is "show me again":
the ghost stroke and every hazard lesson come back, on the first tee of the
starter course, and nothing earned goes anywhere. *Reset progress* is "let me
climb it again": two presses, like opening every course, and then every star,
record and round in progress is cleared and the page boots again in place as a
first visit — not a veteran, so the ladder is locked again. It leaves the sound
setting, the scenery and a hole half-built in the editor alone; none of
them is progress. Before
it existed the only way to see the intro twice was to clear the site's data,
which also cleared everything else.

**The first round teaches itself.** On the very first tee a ghost fingertip
lands on the ball, pulls back away from the flag and lets go while a gold
arrow runs out the other way — drawn on the canvas by `render.drawCoach`, so it
sits on the ball it is about at any scale — with a line in the corner that says
the same thing for whichever hand is holding the device. It loops until the
first real shot and never comes back. Each hazard is then said once, on the
first tee where it is in play, in a card that never takes a press and goes
with the shot: two at most, because a tee that explains five things has
explained none of them. A wind is told apart from a slope here — the same
pull, but the fan is the thing to read — and a hill is a lesson of its own.
The card sits wherever on the *screen* is furthest
from both the tee and the cup — a corner if one is clear, otherwise the middle
of an edge — and moves if the board turns under it.

## The pick-up

A hole allows par + `STROKE_ALLOWANCE` (three) strokes. Miss with the last of
them and you pick up and write down one more. Friction ends every shot, but
nothing used to end a *hole*, and the twelfth putt on a par two is not a harder
version of the game — it is the game refusing to let you play the next one.
It is also what stops one player holding up a party. The last stroke still
matters: holed, it is a triple bogey; missed, it is the pick-up.

Because a pick-up is always exactly one past the limit, a score above the limit
can only mean a ball that never dropped, which is how the stars tell the two
apart without the save file having to say which it was. The allowance is on the
scoreboard beside the count (`2/5`), because a rule you find out about by
running into it reads as the game cheating, and the last stroke is announced
before you take it.

## A party

Pass-and-play for two to four, from the title screen. The rule is the one most
mini golf is played by: everybody plays the hole out in turn, from the tee, and
the best score on a hole has the honour on the next — ties keep the order they
had. Each player has a ball of their own colour (`PLAYER_COLORS`, picked to
stand off the turf, the sand and each other, and rimmed so the blue one still
reads on ice), the running order sits in a strip under the scoreboard with the
player who is up lit, and the banner hands the hole on by name. The last putt
of a hole shows the whole group's scores on it.

Only one ball is ever on the field, so nothing about the simulation knows there
is more than one player. A party is a running order and one card per name, and
`state.scores` is pointed at whichever card is up — which is why the scoreboard,
the totals and the hole-out code needed no party version of their own. In a
party the restart chip puts the ball back on the tee and keeps the strokes: a
restart that wiped the count would be a mulligan only the player holding the
phone could take.

A party is nobody's record and gives no stars. It is saved after every turn
under its own key, so a refresh, a locked phone or a quick solo hole in between
costs nobody their round; leaving it for a solo course keeps it, and the title
offers it back. The roster is remembered between parties, because the people
round a phone on a Friday are usually the people round it the Friday after.

## The caddie: autoplay

🤖 **Autoplay**, in the bar (or <kbd>A</kbd>), hands the club to `js/bot.js`
and it plays — from wherever your ball is standing, and then **on**: the next
hole when this one drops, and the next open course down the rack when the card
runs out. Press it again, or <kbd>Esc</kbd>, to take the club back. It is
Loft Links' caddie brought across, and it behaves the same way: it stands over
the ball, the arrow swings round to the line it chose, the ring winds up to the
weight, and only then does it putt — through the same `takeShot` a released
finger goes through, so what you watch is a shot the game played.

**It plans whole lines, not single shots.** The bot in `tests.html` already
knew why: greed has local minima, and a mini golf course is made of them. So
each read of the hole is a search, a stroke-depth at a time, for the fewest
strokes to the cup — the suite's search, with two things added so it fits in a
frame rather than in a test run:

- **A walking map.** A flood out from the cup over a 10px grid, round the
  walls, posts and water and through tunnels for nothing, once per hole. It is
  the ruler lies are ranked by, because straight-line distance is exactly the
  wrong one on the holes that need a search: a ball the far side of a long
  wall is inches from the cup and a whole leg away from it.
- **A beam.** Every lie one stroke on is kept (one per 48px cell, twice for the
  gates), but only the `BEAM` nearest on foot are searched on from. Without it
  the second stroke alone is a hundred lies and the budget is spent before the
  third is tried — which is the whole of Stepping Stones.

Between them a read is a few hundred simulated shots and tens of milliseconds;
the worst on the rack is under half a second, and it is said under a toast.

**It never overswings.** Past `SAFE_POWER` the line is the dice's, and a plan
the dice then move is not a plan. The safe zone already coasts further than the
field is long, so there is no hole it cannot reach — the suite plays the whole
dial because it asks a different question, whether a hole *can* be finished,
not whether it can be finished on purpose.

**The roll is stepped at `SIM_DT` while it has the club**, and the strike is
checked before every step rather than once a frame. `advance` subdivides by
speed, not to a clock, so a frame of any other length is a slightly different
roll; fixed steps make the game's roll the plan's roll to the last bit. That
is what lets it keep the line it found — it plays it a shot at a time and only
reads the hole again when the ball is not where the plan said, or when there
is no time left to address the next shot before the instant it was timed for
(a gate that shoved the ball, a dialog held open, a splash). And it is what
lets it time a gate: later shots are planned on the beat the game really keeps
between them, `BOT_PAUSE + BOT_TURN + BOT_WIND + BOT_SLACK`, and struck on that
instant to the step.

**It costs you the session's records.** Once the caddie has had the club,
nothing reaches the save file until the page is reloaded — no best, no stars,
no doors opened, no round in progress — and the card says so. The course it
walks onto keeps the round you left there, and the lessons and the first-tee
ghost are kept for you. It is the whole sitting rather than the round because
by the time a card is written there is no telling whose holes those were.
Autoplay is for a round on your own: a party plays its own shots, and starting
one takes the club back. In the editor's playtest it plays the one hole and
hands the club back.

## The bar, and the picker behind it

The bar used to be eight controls laid flat: a `<select>` of courses, a die,
a draw, restart, card, editor, sound, fullscreen. On a phone that ran off the
end of the row, and on a laptop it was a wall of chrome standing between the
player and the board. Three of the eight were about *which course*, which is
a question big enough to have a page of its own.

So it is seven chips and a ⛶ now — 🤖 Autoplay is the newest — and on a compact
screen — a phone, a coarse pointer, a short window, or fullscreen on anything —
all seven fold behind ☰. Fullscreen stays out there, because it is the one control worth
reaching for with a shot half aimed. `compact-ui` on `<body>` is the switch;
off it, `.topbar-menu` is `display: contents` and the chips are simply the row
they always were, so nothing has to be undone.

**The picker** (`#menu`, `C` or the ⛳ chip) is what replaced the `<select>`.
A menu of names is the one control that can say nothing about what it is
offering: not how long a round is, not what is on the field, not what you
last went round it in, not whether a round of yours is already waiting — and
it cannot offer a *hole* at all, only a course. The dialog is one card per
course, and every hole on every card is a plan you can press:

- **The head** starts that course where you left it, which is exactly what
  choosing it from the old menu did.
- **A plan** starts a fresh round on that hole. Not a resumed one: a card
  with the first six holes filled in and a player who teed off on the seventh
  is a total that means nothing.
- **The draw's card** carries a ✦ Re-deal, because it is the one card on the
  rack that can be replaced rather than merely chosen. It also says *not
  recorded* rather than showing an empty best — a rule, not a record nobody
  has managed.

The plans are `plan.js`, and they are a second drawing of the hole rather
than a small screenshot of it. `render.js` paints mown stripes, turf speckle,
rake lines, a waving pennant and a vignette; none of that survives being
shrunk to eighty pixels, where it is noise on top of the one thing the
picture has to say. So the plan is flat — no texture, no clock, hazards
pushed further apart in colour than the board's are, and the tee and the pin
drawn far larger than life because a ball is three quarters of a pixel at
that size. It reads the hole's own arrays, so it cannot disagree about what
is on the field; what it does not know is *time*, which is why a moving gate
is drawn at rest under hazard stripes instead of somewhere it happens to be.

Each plan is cached by course, hole and pixel size — the draw's key carries
its seed as well, since two draws are two courses under one id — so the
second opening of the picker rasterises nothing. On a phone every card but
the one you are standing on starts folded: fifty-one plans laid flat is four
screens of scrolling before you reach the last card, and the head above each
fold is still a one-tap start.

## The draw

`generator.js` deals a ninth-hole card nobody has played: nine holes built
from a seed, legal by construction, and checked before they are handed over.
The ✦ Re-deal button on the draw's own card in the picker (or `G`) deals a
new one; `?seed=<base36>` deals a named one, and
so does anything else you put in that parameter — `?seed=birthday` hashes to
a seed like everything that is not one already. The seed is shown in the
tagline and remembered, so a refresh gives you the course you were playing
rather than a new one.

Four decisions carry the design.

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

**And about a third of them are not a line at all.** Nine corridors on one
card is nine of the same hole wearing different furniture, and the shape of a
hole is the first thing you read off the screen. So a frame also carries a
*window* on its cross axis rather than the whole of it, and that one change
buys a second shape: a long wall down the field with one end left open, the
tee behind it and the cup round the end. Each leg is a frame of its own,
windowed on its own lane, so every builder written for the full field works
inside a lane without knowing it is in one — see [The elbow](#the-elbow).

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

## The elbow

Two ways round the wall. A **bend** puts the cup near the mouth, so the way to
it is to carry on down the lane and turn once. A **hairpin** puts it back at
the closed end of the far lane: out the whole length of the field, round, and
the whole length back. Both are dealt, about evenly.

Three things make it work.

**A lane cannot hold everything.** A lane is half the field wide, and the
vocabulary was written for the whole of it — a sweeping bar needs 470px of
cross axis to swing in and has nowhere to go in a 280px corridor. So every
feature declares the cross extent it needs (`minV`) and a lane draws only from
the ones that fit. At the full width of the field none of them is ever
refused, which is why a straight hole is built exactly as it was.

**The mouth is the band's mouth, one size up.** A band across a corridor is
playable because it always leaves a way through; the elbow is playable for the
same reason, with the gap at the end of the wall as the way through. Nothing
may be built within a band's clearance of it, so the corner is open by
construction rather than by luck.

**The shape is checked, not assumed.** The straight line from the tee to the
cup has to actually run into the wall. Without that check the generator
happily deals a tee and a cup that can see each other over the end of it,
which is a wall standing beside a hole rather than a hole built round a wall.

The hairpin cost something to have, and it is the interesting part. The bot in
`tests.html` used to find its way by getting nearer the cup, and a hairpin
asks a player to spend the entire way out getting further away — so the bot
could finish a bend and could not finish a hairpin at all, and reported the
shape as unplayable. The choices were to drop the shape, to stop asking the
bot whether the hole can be finished, or to make the bot plan. It plans now:
see [Tests](#tests).

## How a hole is built

A hole is axis-aligned rectangles, round posts and two points:

```js
{
    name: 'Island Green', blurb: '…', par: 3,
    tee:  { x: 130, y: 320 },
    hole: { x: 780, y: 320 },
    walls:   [ { x, y, w, h, move? } ],  // solid; `move` makes it oscillate
    water:   [ { x, y, w, h } ],         // splash, one penalty stroke, replay the shot — or a skip, if fast
    sand:    [ { x, y, w, h } ],         // heavy friction
    rough:   [ { x, y, w, h } ],         // half the roll of grass
    ice:     [ { x, y, w, h } ],         // almost none — ~3x the roll of grass
    bumpers: [ { x, y, r } ],            // round, and bouncier than a wall
    slopes:  [ { x, y, w, h, ax, ay } ], // constant acceleration, i.e. a breaking green
    tunnels: [ { x, y, tx, ty } ],       // two mouths, both ways: same speed, same heading out
    rails:   [ { x, y, tx, ty, w } ],    // a wall at any angle: its spine and its thickness
    lava:    [ { x, y, w, h } ],         // water nothing skips: any pace, a stroke and a replay
    avalanches: [ { x, y, w, h, dir, every, at } ], // a chute: a slide down it every `every` seconds
    vents:   [ { x, y, every, at, run } ], // a geyser: blowing `run` seconds of every `every`
    arcs:    [ { x, y, r, from, to, w } ],  // a curved wall: an arc, from/to in degrees clockwise from right
    blocks:  [ { pts, w, look } ],          // a solid shape: its outline, its kerb, what stands in it
    hills:   [ { x, y, r, a } ]             // round ground: a mound if a > 0, a bowl if a < 0
}
```

A hole may also name a `theme` — one of the biomes — which it wears instead
of its course's, and a slope may carry `wind: true`, which changes what it
looks like and nothing about what it does.

A hole lists only the hazards it uses; a normaliser at the foot of
`courses.js` fills in the rest as empty arrays from `GOLF.HAZARD_KEYS`, so
nothing downstream has to ask whether a list exists. Water, lava, sand, rough
and ice may also be polygons — `poly(x0, y0, x1, y1, …)` — for a bank or a
bunker that runs on the slant; `chute(…)` and `vent(…)` are the helpers for
the other two. `arc(…)`, `block(look, pts, w)`, `mound(…)` and `bowl(…)` write
the newest shapes, and `smooth(pts)` and `oval(…)` save writing a curve out
corner by corner: `smooth` cuts every corner of an outline in two, twice over
(Chaikin's corner cutting), so a hexagon of six numbers becomes a pebble with
no corner a ball can find. The helpers are `GOLF.helpers` to anything else
that writes a hole down, the suite included.

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

It grew first by two shapes, chosen to keep both promises. **A rail** is
a wall at any angle, collided as a capsule: the closest point on a segment is a
clamp and a dot product, so it costs what a box costs and is as easy to see is
right, and it is round at both ends because a capsule is — a square end drawn
over a round one would bounce the ball off a corner nobody can see. **A
polygon zone** is only ever asked whether a point is inside it, which is a
crossing count. Walls do not get polygons (a wall at an angle is a rail) and
slopes do not either, because a slope's rules about where it sheds are written
for edges that run with the axes.

Before them a diagonal had to be faked. The Chute's two arms were ten
overlapping steps, each lapping the next so there was no seam to slip through,
and they threw the ball off their corners in directions the funnel never
meant; they are two rails now. The Narrows was six rectangles and looked it —
a diagram of a staircase rather than a causeway — and its lakes are two
polygons. Its risers are steep on purpose: at forty-five degrees the three
landings line up into one band a straight putt can thread, which is a
different and easier hole.

Then by three more, and none of them is a new collision test. **A curve** is a
chain of rails laid round an arc; **a block** is a polygon whose every edge is
a rail; **a hill** is a slope that is round. See [Curves, blocks, hills and
props](#curves-blocks-hills-and-props).

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
- **A rail is at least 20px thick, and a polygon at least 20px across** —
  measured as twice its area over its perimeter, which is a strip's width and
  a disc's diameter. Both are counted wherever a wall or a lake is: a tee or a
  cup on a rail, a mouth beside one, a rail inside a slope.
- **A tunnel mouth needs room to be a mouth.** A ball's width and a half of
  clear grass round it over the whole of any gate's travel, nowhere on a slope
  (a ball the hill held over a mouth would go down it without being played),
  off the tee, well off the cup, off every other mouth, and the two ends of a
  tunnel far enough apart to be going somewhere. `validateHole` holds the
  rules and the editor carries a port of them.
- **A slide has to be something you can wait out.** Every point of a chute
  lies clear for `AVALANCHE_CLEAR` seconds of each cycle, one slide is gone
  from a chute before the next sets off (`every` at least the time a slide
  takes to run its length), and the tee and the cup stand off every chute — a
  ball teed up in a slide's path would be carried off before it was played.
- **A vent is a disc of open ground.** Blowing for part of its cycle and
  resting for the rest, on the field, clear of walls, posts, water and lava (a
  ball that rolls onto it has to be able to), off slopes and chutes, off the
  tee, well off the cup and off every tunnel mouth.
- **A curve sweeps forwards and stays open** — `to` past `from` by no more
  than a full turn, and a radius wider than the wall is thick — and **a block
  has three corners on the field**. Both are rails underneath, so every rail
  rule holds for them too: 20px thick, off the tee and the cup, clear of every
  tunnel mouth and vent.
- **A hill reaches nothing it could hold the ball against.** Like a slope, it
  pulls for as long as the ball is on it, so its disc keeps off the cushion
  and off every wall, post, rail and block; the tee is off it, and so are the
  tunnel mouths and vents.
- **A wind has a fan at its head, and a windmill's sails reach nothing a hole
  is about.** The first because a force with no cause in sight reads as the
  game cheating; the second because the sails are the one prop drawn over the
  ball, so they keep clear of the tee, the cup and every tunnel mouth.

## Avalanches, lava and geysers

The two newest cards are built on three shapes, each chosen for what it asks
of the player rather than for how it looks.

**A chute** is a rectangle with a downhill — `dir`, one of down, up, left or
right on the field — and a clock: every `every` seconds from `at`, a slide
sets off from its head and runs its length at `AVALANCHE_SPEED`, a band of
snow `AVALANCHE_LEN` deep. Whatever the band is over it takes to its own pace
(at `AVALANCHE_GRIP`, so being caught is plain to see) and carries out of the
foot, into whatever the hole put there: a drift, a crevasse, the cushion. It
is a band rather than the whole chute switching on because a band can be
watched coming — and for `AVALANCHE_WARN` seconds before each one the head of
the chute smokes and trickles, which is the beat the shot is timed on. A ball
inside the band is not at rest, the way a ball on a slope is not, but the band
always passes, so a chute can run to a cushion without the hole ever hanging.
A ball left lying in a chute is not safe there: the next slide takes it,
played or not, the way a gate shoves a resting ball. It is the one hazard that
hands the ball speed, and it is allowed to for the reason a moving gate is —
it is a moving thing pushing — and it ends because the band moves on.

**Lava** is water with the skip taken away: a ball whose centre reaches it is
gone whatever its pace, a stroke and a replay from where it was played, said
with a hiss and a flare instead of a splash. That one difference is what makes
it a hazard of its own rather than water in a different colour — a creek of
water can be skipped by a hard enough ball, a channel of lava never can — and
it is why every crossing on Ember Ridge is a choice between a long way round
and a geyser.

**A geyser** is a vent that blows for `run` seconds of every `every`. A ball
rolling over it while it blows is thrown up for `VENT_AIR` seconds and carries
on in the air on the line it had, over everything on the ground — lava, water,
sand, slopes — until the air drops it; walls still stop it. A ball rolling
over it while it is quiet rolls over a grate. Nothing is added to its speed:
the vent lifts, it does not push, so the rule that nothing hands the ball
energy holds here as it does at the skip, and the suite watches every substep
of a hop to be sure. How far the ball flies is how fast it arrived, so the
quick line over a channel is two judgements at once — when, and how hard. A
ball resting on a vent is juggled while it blows and left where it was.

All three are functions of the world's clock and nothing else, which is what
lets the bot and the suite plan through them exactly as they plan through a
gate: the search waits a random beat before each shot, and a slide or an
eruption is wherever the clock says it is.

## Curves, blocks, hills and props

The first two cards were a field of grass with boxes in it, and a box is the
least interesting thing a ball can meet: it sends the ball back the way a
mirror does, at one of two angles. Three shapes give a hole geometry instead,
and every one is built out of what the physics already knew.

**A curve** (`arcs`) is a wall bent round an arc, laid as a chain of rails no
more than eight degrees or 32px long. Each link ends where the next begins and
a rail is round at both ends, so the chain has no seam to slip through and no
corner to bounce off, and at eight degrees a link stands at most a pixel off
the true curve. It is what a box cannot be: every point of it is a cushion at a
different angle, so where a ball meets it is the line it gets, and a ball sent
along the inside of one *rides* it round — the outside of Bank Holiday's turn
carries a firm putt round the corner and up to the flag. It is drawn as one
band in the biome's own wall, not as its links.

**A block** (`blocks`) is a solid shape: a polygon whose every edge is a rail
`w` thick. The ball only ever meets the edge, so the inside is somewhere it
can never be, and that is where the picture puts something — a flower bed
edged in the biome's own brick or timber and planted with what grows there, a
copse when it is big, a clipped hedge, a rock, a sandcastle, a windmill, a
fan. `look` is read by the renderer and nothing else. Blocks are what shape a
field: beds round off its corners, a copse is the inside of a dogleg, a hedge
cut as a diamond sits on the straight line. A ball inside one is impossible
rather than merely unlikely — the suite fires at them and checks — and the
caddie's walking map counts a block's hollow as solid.

**A hill** (`hills`) is round ground: level at its middle and at its rim and
steepest halfway out, where it pulls the ball `|a|` px/s² away from the middle
(a mound) or towards it (a bowl). The profile is a cosine, so the pull is a
sine of the distance out and nothing jumps as the ball rolls on or off it. A
mound's shoulder is a curve you can aim with — Molehill's ace bends round
one — and a bowl round a cup gathers a ball that arrives about right, which is
why the first hole anybody plays has one. It is shaded pixel by pixel from the
same light the walls are lit by, with contours closer where it is steep and the
slope's chevrons pointing downhill round it.

A bowl is where a ball can come to rest on a hill, at the bottom, and that
needed one change to the physics: the rest check used to skip slope zones
outright, and now it asks how hard the ground pulls where the ball is. Below
`REST_PULL` — `STOP_SPEED` times the grass's drag, the pull that could never
roll a ball faster than `STOP_SPEED` however long it was left — a ball may
stop. Every slope on the rack pulls ten times that, so nothing rests on a slope
any more than it did; the level bottom of a bowl lets a ball settle.

**A wind** is a slope with `wind: true`. The ball meets exactly what it meets
on a slope; what the player is shown is a pale lane with streaks blowing down
it, and a fan — a block with `look: 'fan'` — standing at its head with its
rotor spinning and a chevron on its housing pointing downwind. On the
mountain the fan is a snow cannon. A tilt in a top-down game is a convention
you have to be told; air pouring out of a fan is not.

**Props explain hazards.** A force with no cause in sight reads as the game
cheating, so the hazards that do something invisible are given a reason to be
seen doing it: the wind blows out of a fan; a moving gate runs in a track sunk
in the grass under its whole travel, rails and end stops, so it is known for
a gate before it is ever seen moving; a mound on grass has a molehill at its
peak and the mole that dug it; a tunnel that runs through a windmill has a
gravel path from each mouth to the mill's doors. The windmill's sails are the
one prop drawn over the ball, and like a tree's crown they go thin when the
ball rolls under them — and the suite keeps them clear of the tee, the cup and
every mouth.

What does not move is painted into the cached layers — hills and tracks into
the ground, curves and blocks into the still walls — and what does is drawn
live: the streaks, a fan's rotor, a windmill's sails, all still under
`prefers-reduced-motion`.

## Biomes, and what a hole is drawn as

A field of flat blue rectangles is a diagram of a hole rather than a place,
and seven courses in one palette are one course wearing seven names. So each
card is drawn in a biome — the Short Six in a walled **garden**, the Old
Course in **parkland**, Tidewater by the **seaside**, the Wild Six in
**woodland**, the Warren in a **meadow**, Avalanche Pass on the **alpine**
mountain and Ember Ridge on a **volcanic** one — and the draw takes one from
its seed. Nothing about play depends on the biome: the mountain's chutes and
the volcano's lava and geysers are hazards in the hole's data, and they are
drawn as themselves in whatever biome the hole is dressed in. A biome is a turf colour, a water (a pond with reeds and
lily pads and, on a big one, a duck; a stream; the sea, with surf), a sand, a
rough, a wall material (timber, brick, driftwood, logs, a clipped hedge), a
bumper cap (brass, a flowerpot, a buoy, a toadstool, a hay bale), the rim of
the course, the trees beside it and the flowers, leaves or shells in its
grass. `scenery.js` holds all of it as data; `landscape.js` draws it.

**A hole may wear a biome of its own.** The Short Six walks through six of
them, one a hole, in the order the rack climbs — so `themeOf(course, hole)`
answers the hole's `theme` first and the card's after. The letterbox, the
soundscape and the plan in the picker follow the hole; the Scenery row still
puts every hole of every course in one biome when it is asked to.

**Alpine** is granite walls and rim, boulders with snow on them for posts,
snow pines, deep snow for the bunkers and a glacial tarn with a skin of ice;
**volcanic** is black basalt cracked with heat, obsidian posts, ash bunkers,
charred pines, a hot spring for its water, embers rising and ash coming down,
and a rumble under it all.

Four more exist only to be chosen: **autumn** (stone walls, maples, pumpkins,
leaves on the pond), **winter** (snowy logs, snow pines, a snowman for a post,
a skin of ice on the water), **desert** (sandstone, acacias, cacti, a
tumbleweed) and **moonlit**, a night course lit by lanterns round the cushion
and posts that glow, with the moon on the water. The **Scenery** row in the
course picker — or `S` — puts any course in any of the eleven, or back in its
own; the choice is kept in `miniGolf.scenery.v1` and survives Reset progress,
which is about the player's record, not their taste.

**A biome is alive.** `ambience.js` draws what moves through it from the
clock alone, so there is nothing to step and nothing to save: snow, falling
leaves, petals, dandelion fluff, dust, ash, embers, fireflies and butterflies in the air
over the ball (thinning as they pass it), and the shadows of birds and gulls,
or a tumbleweed, on the ground under it. Under `prefers-reduced-motion` only
the night's lamps and dark are left. Each biome has a soundscape to go with it
— a looped bed of filtered noise (wind, the sea, the volcano's rumble) and
calls dropped in at random (birds, gulls, crickets, an owl, crows, a
woodpecker, lava blurting) — on its own quiet bus,
started by the first sound the player makes, stopped by the mute switch and a
hidden tab.

**A hazard is drawn as one shape.** A lake built of six overlapping boxes used
to be drawn as six boxes, with a seam wherever two met. `scenery.outline`
merges a zone list into the loops that bound its union — rectangles on the
grid of their own edges, every polygon a loop of its own, islands as holes —
and the renderer draws that as one path with its corners rounded off. The
rounding is a few pixels of picture at a corner and nothing else; the physics
tests the rectangles and polygons themselves, which is the bargain the
bunkers' 34px corners have always made. The suite checks, on every shipped
list and a handful of draws, that the outline covers exactly the union's
area. A zone that runs to the cushion is pushed past it for the picture only,
so a lake that meets the edge has no shore along it.

**Flowers grow at the edges.** A fairway carpeted in blooms is a lawn nobody
mows, and it fights the ball for the eye. The showy decals — flowers, leaves,
shells — are planted only in the border (`scenery.border`): the rough, a band
along the cushion and the foot of the walls. The open fairway gets at most a
handful of faint lawn kinds (clover, a stray leaf), drawn at half strength.

**Decoration may never hide anything.** Flat things — flowers in patches,
fallen leaves, shells, lily pads, reeds at the water's edge — go only where
they are out of the way: never in a hazard they are not part of, never near
the tee, the cup or a tunnel mouth. The only thing drawn *over* the ball is
the crown of a tree standing just off the course and reaching in over its
edge, and those are held further still from everything a hole is about, and
go thin when the ball rolls under one. All of it is placed from a seed made of
the hole itself, so a hole wears the same flowers every time and the board
does not shimmer on a replay, and the suite holds every hole to those rules.

**Light comes from the top left of the screen, and height faces the viewer.**
Walls, rails and posts are blocks: a shadow down and right, a lit top, and a
near face showing below the top on screen. The top stays exactly on the
footprint, so nothing about where the ball can go moves — and because the
near face hangs towards the viewer and the ball is drawn after every wall, a
ball is never hidden behind one. On a turned phone every one of those offsets
is turned with the board (`landscape.sv`), so the light still comes from the
top left of the glass. Two soft cloud shadows drift over everything, still
under `prefers-reduced-motion`.

**What does not move is painted once.** The ground — turf, the green, rough,
bunkers, ice, slopes, chutes, vents, decals and the beds of the water and the
lava — and every wall that holds still are cached per hole, biome,
orientation and resolution; only the water's and the lava's surfaces, the
slides and the eruptions, gates, posts, the ball, trees and clouds are drawn
live. The lava's crust is a plate to a cell drifting round a home of its own,
so it creeps without anything being stepped or stored; a slide and a plume
are drawn off the world's clock, not the screen's, because where they are is
a fact of play. The
still-wall layer is cropped to where the walls are, because a field-sized
image of transparent pixels blitted every frame was the most expensive thing
on the page. On a software rasteriser this makes the heaviest hole about half
again the old frame on a laptop and level with it on most, and the editor,
whose hole changes under the mouse, is handed no cache key and draws live.

## Water

The water is the one place realism and the cartoon meet. `water.js` draws its
surface with a small WebGL fragment shader into a canvas of its own, which the
board then draws inside the water's outline:

- **The real part** comes from a depth field: `scenery.shoreField` measures,
  on a 4px grid, how far each point is from the shore. From that the shader
  gets the colour deepening away from the bank, the bed seen refracted through
  the shallows, caustic light on it, the bank's shadow, the sky by height on
  the screen, and sparkles where the sun — or the moon — catches a facet.
- **The cartoon part** is drawn over it: a crisp band of foam at the shore with
  a line that breathes, broken crest strokes, surf on the sea, and rings that
  spread when the ball goes in. Winter lays a skin of ice over the lot.

The water also sits below the grass: its surface is the outline pushed down
the screen (`landscape.bankDepth`), so the far bank shows a face of earth
above the waterline. Without WebGL the old 2D surface is drawn instead, and
the board looks as it did.

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
- **A ball at rest on a slope is not at rest.** The stop threshold has to ask
  how hard the ground pulls where the ball is, or the ball hangs on the
  hillside — which is the whole reason a slope may not reach something it can
  pin the ball against, per the hole rules above. Below `REST_PULL` it may
  stop, and that is the only place it may: on the flat, and at the level
  bottom of a bowl. See [Curves, blocks, hills and
  props](#curves-blocks-hills-and-props).

The cup is the one place the ball has a height. Everywhere else `z` is its
radius and nothing reads it; over the cup (`physics.cup`) the ball is a sphere
falling under `CUP_GRAVITY`, and the cup is a hole with a lip:

- **A funnel** `CUP_BEVEL` wide falls `CUP_FALL` to the lip. It is the ground,
  not a force, so what it gives a slow ball rolling in is paid for in height —
  and a ball dying on it topples in.
- **The lip** is a circle the ball's sphere touches, in the plane through the
  cup's centre and the ball's. A ball can lean on it, roll round it, and spiral
  in or spin out; hitting it harder than `RIM_KNOCK` is a knock that bounces
  (`RIM_RESTITUTION`) and takes pace off (`RIM_KEEP`), which is how a firm putt
  at the middle drops off the back of the cup and a firmer one hops out over
  it. Riding the lip scrubs speed (`RIM_DRAG`).
- **It is in** once the ball's centre is a `CUP_DOWN` share of its radius below
  the lip; until then the cup's wall holds it. A ball may not come to rest in
  the air or on the funnel (`physics.grounded`).

The knock is never allowed to add speed: the push out of the lip is paid for
from the ball's speed and the result is capped at the speed before, so the
invariant below holds at the cup too, to within a step's worth of slack. The
renderer follows `z` — a ball dropping in sinks down the screen, darker, the
near side of the cup covering it; a ball hopping out rises and leaves its
shadow on the turf — and a knock is heard as a short tock. Off the cup the
ball still rolls in three dimensions for the eye: its dimples and an
alignment line are fixed to a sphere the renderer turns about the axis a
rolling ball turns about (`render.roll`), fading to a blur at pace rather than
strobing backwards. A ball hit far too
hard runs straight past, and often rolls back in off the cushion, which is a
feature.

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

**Water skips a fast ball.** A ball that reaches water at `SKIP_SPEED` or more
skips off the top like a flat stone: it keeps `SKIP_KEEP` of its speed and is in
the air for a time that grows with the speed it arrived at, so a hop's length
goes with the square of it. In the air (`world.air`) it is over everything on
the ground — no slope pulls it, no surface holds it, and no tunnel, cup or water
can take it — but walls still stop it. Where it comes down is asked the same
question again, so a hard enough ball chains two skips; anything slower sinks
where it came down, and the replay is still from where it was hit. The tuning
keeps water as water: a firm shot from the tee clears a creek of 40 to 80px, and
about 175px is the most anything will cross, from the very edge of a pond with
the dial in the overswing. `SKIP_KEEP` under 1 is how a skip keeps the invariant
above, and the suite watches every substep of a skip chain for the speed ticking
up. The bot needed nothing new for it, for the same reason as tunnels below.

Tunnels keep that invariant by changing nothing about the shot but where it
is: the ball's centre over a mouth moves it to the other one with its velocity
untouched. Two guards make that safe. A ball that has just come out of a mouth,
or was struck from inside one, has that mouth *latched* until it has left it —
without the latch the far end's catch would send it straight back. And only a
ball that is going somewhere can fall in: a splash puts the ball back where the
shot was played from, which may be inside a mouth, and a ball sitting at rest
there must not go down it unplayed.

## Aiming

The arrow gives you the line, and a faint ray runs on from its head for
`AIM_GUIDE_LEN` and fades out. There is no trajectory preview.

There used to be one: the renderer cloned the world, ran 0.6 seconds forward and
dashed the ball's real path on screen, stopping at the first bounce. Between that
and a pull-back band drawn to the length of the power, the screen answered the
only two questions a golf shot is made of — how far will this go, and where does
it come off that wall. Both are gone, and `physics.previewPath` with them.

What went too far was the replacement: an arrow of exactly one length made a
gentle tap and a full swing look identical. So two things came back, neither
of them a prediction:

- **The ray**, which is pure direction, and short. It once ran to the edge of
  the field, on the argument that extending a line by eye is something the
  screen could simply do — but a ruled line across the hole is the putt read
  for you, and all that was left was to lay it on the cup. It now carries the
  arrow's direction about a hand's width further and leaves the rest of the
  line to be judged.
- **A little length.** The arrow runs 54px to 108px while the ball rolls up to
  1600px — a fifteenth of the scale of the thing it is hinting at, on a
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

## What a shot says back

The ball is small and a phone is smaller, so the things that happen to it are
said out loud as well as drawn:

- **A lip-out is called.** Over the rim, too fast to be taken, and out the
  other side — on a small screen that looks exactly like a ball that missed
  the cup, and the near thing is half the fun. A ball that stops within a
  whisker of the rim gets *So close*.
- **A drop says what it was made of.** The banner names the notable part of
  the shot that went in — a bank shot, two cushions, off the post, through the
  tunnel, from downtown — two at most, because a story beats a receipt.
- **A skip is called.** Each one ripples, throws a wake of spray and plips a
  note higher than the last; the ball rises and its shadow falls away while
  it is in the air. Coming down dry after one says *Skipped across!*, and a
  drop that skipped on its way says so in the banner.
- **A knock is felt where it happened.** The physics hands back the hardest
  contact of each frame (`events.impact`: the point, the normal and the speed
  the ball arrived at along it), so chips fly off the wall at the spot it was
  hit, the ball flattens against it for a moment, and the click is measured by
  how square the hit was rather than how fast the ball was going.
- **The strike shows its weight.** A ring off the ball grows with the swing,
  the divot with it, and the hard ones whoosh; past the safe line a hot second
  ring and a small kick say *overswing* before the ball shows it.
- **A splash goes under.** A crown of spray, three ripples going out one after
  another, and the ball sinking out of sight before the replay.
- **A hard knock jolts the frame**, a few pixels for a fraction of a second,
  and a splash and an overswing do too. Not under `prefers-reduced-motion`.
- **A phone buzzes** on a drop, a splash, a bumper and a door opening, on the
  phones that can (`navigator.vibrate`). The mute chip silences it with the
  sound: it is the one switch a player has for "stop making things happen to
  me".

## The overswing

The dial runs past what you can control. Everything up to `SAFE_POWER` goes
exactly where the arrow points and is the whole of the old game — 1134 coasts
about 1240px, more than the 960px field, so every hole stays reachable in one
clean shot. The last fifth is borrowed distance: 1470 reaches about 1605px and
pays for it in accuracy, `physics.spread` opening from nothing at the line to
±0.13rad — about 7.5°, or ±52px over a 400px carry — at the top.

Three things make it a choice rather than a trick:

- **The curve is quadratic**, so the boundary is not a cliff. A quarter of the
  way into the overswing costs under a tenth of the full spread; the last
  sliver costs everything.
- **The cone is drawn before you commit**, to scale, in the moment you are
  deciding how far to pull — and the meters mark where the safe zone ends, on
  the ring and in hatching on the bar. Its edges run on past the short guide
  (`AIM_CONE_LEN` against `AIM_GUIDE_LEN`) so the warning cannot be missed;
  its centre line stops with the guide.
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

**Upright, the board turns.** A phone held upright has a screen the wrong
shape for a 3:2 field: fitted flat, the board was a strip 260px tall across the
top of a tall glass. Turned a quarter round it is half as big again, so it
turns — the tee end, the left of nearly every hole, goes to the bottom of the
screen and the shot is played up it, the way a phone golf game is held. Nothing
in the world changes: `resize()` rotates the context and `toWorld()` undoes it
for the pointer, and the only thing on the field told which way up the screen
is, is the flagstick, which stands up. It turns only when that buys more than
a tenth in scale, so a roughly square window does not flip as it is dragged.
The phone's scoreboard and meter tighten for the same reason — every pixel of
chrome above the board is one the board cannot have.

**A shot starts wherever the thumb lands — on the board or off it.** The drag
is measured from where the finger went down, not from the ball, so nothing
needs the press to be on the canvas. It used to have to be, and on a turned
phone that was exactly wrong: the tee is at the bottom of the board, the
pull-back runs down from it, and the thumb that makes it lands on the meter or
the blank strip under the board — which took the touch and did nothing. Now
the letterbox round the board and the meter always count, and when the page
fits the screen (`is-tight`, `is-side` or fullscreen — `html.drag-anywhere`,
set by `resize()`) so does the page itself, with `touch-action: none` so the
browser does not take the pull for a scroll and cancel it. The bar, the
scoreboard and the banner never start a shot; the modals' lists still scroll,
because `touch-action` starts over at a scrolling box.

**On its side, the chrome stands beside the board.** A phone in landscape is
about 340px tall, and stacked, the bar and the scoreboard took half of it and
left the board at its minimum size with the page scrolling under the thumb —
the posture the old hint told players to turn to was the one that played
worst. Any window that short and wide (`is-side`) lays the bar, the scoreboard
and the meter out in a column on the right and gives the board the full height:
on a 750×342 phone that is 485×324 instead of 288×192. Its height budget is
the screen less the padding, never the board's own top edge — the stage is
centred against the column, so a small board sits lower, which would leave less
room and keep it small: an answer that agrees with itself and is wrong.

**Reduced motion switches transitions off, not merely down.** The usual rule
— a duration of 0.01ms on `*` — turns every property into a transition,
because `transition-property` defaults to `all`, and that included the canvas's
width and height: a board resized between two frames was left at its old size
for exactly the players who had asked for less motion.

**Fullscreen** (the ⛶ button, or `F`) puts the wrap into the Fullscreen API —
the scoreboard is part of the game, so it goes too; the reference text does
not. Only what is inside the fullscreen element is drawn, and the menu, title,
party and scorecard modals live beside the wrap, on the body — so they are
moved into the wrap as it goes fullscreen and back out after, or a round
finished in fullscreen opens a scorecard nobody can see. Two measurements
differ in there. The wrap centres its content, so the board's top edge on the
screen moves with the board's own size — a small board sits low and stays
small, a big one sits high and grew a little on every resize — and the height
budget counts the chrome above the board from the top of the wrap's content
instead. And the wrap has padding of its own, which `clientWidth` includes:
asked for that width, the canvas was squeezed by its `max-width` and the board
drawn narrower than it is tall. On a phone the fullscreen frame is no wider
than the page's, so fullscreen is never the smaller board. The backing store is capped at three device pixels per world pixel, or a
4K monitor at `devicePixelRatio` 2 would ask for a ten-megapixel canvas sixty
times a second.

## The round in progress

Even six holes is a sitting, and a browser tab is a fragile place to keep
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
what happened to every round in progress on the eighteen and the nines the day
the rack became seven sixes. That last check is a belt to the braces of the
per-course keys rather than the thing that separates the cards: a card from
the Wild Six is never offered to the Old Course in the first place, because it
is not under the Old Course's key.

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

A tunnel is the one shape that is two things: drag from one mouth to the other
to lay it, grab either mouth to move that end alone (`0` picks the tool). A
**rail** is laid the same way (`L`), from one end to the other, and can be
grabbed by either end or by its middle. Any water, lava, sand, rough or ice
can be turned into a **polygon** from the inspector — *Make it a polygon*
gives it four corners to drag anywhere, *+ corner* splits its longest edge,
*Square it* puts it back. **Lava** (`H`) is drawn like water; a **chute** (`A`)
is a rectangle with its downhill, its period and its first slide set in the
inspector; a **geyser** (`Y`) is a click, with when and for how long it blows
beside it. The checks hold all three to the rule book's rules for them.

A **curve** (`C`) is dragged out from its centre: it starts as the top half
of a circle, its angles and thickness are in the inspector, and the grip
halfway round it sets the radius. A **block** (`B`) is dragged out as a
rectangle and is four corners from the start; its look — bed, tree, hedge,
rock, castle, windmill, fan — is a menu, *+ corner* splits its longest edge
and *Round it* cuts every corner in two. A **hill** (`M`) is dragged out from
its centre like a post, a mound until its pull is made negative. A slope can
be ticked as *wind*, and the **Biome** menu beside the hole's name gives a hole
a place of its own. The checks drop a ball on every hill as they do on every
slope and wait for it to stop.

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
and would beat any real round's record the first time anyone tried a
draft.

`level-editor.html?runTests=1` runs the editor's own tests — the export/parse
round trip over every shipped hole on every course and over a hole that uses
every new shape, the checks passing everything that ships and catching a
dozen holes deliberately broken, and undo/redo. It is
a real feature linked from the game, so unlike `tests.html` it stays
indexable; the self-test overlay only appears with the query string.

## Tests

Two harnesses, and the runner finds both.

Open `tests.html`. 871 assertions covering geometry, the integrator, the four
surfaces, the overswing, skipping, tunnels, avalanche chutes, lava and
geysers, rails and polygons, curves, blocks, hills and wind, the cup in three
dimensions, scenery in every biome, the props that explain the hazards, the course data
on every course, the generator, the scorecard, the pick-up and the stars,
progression and starting over, the per-course save keys and the resumable
round, in a few seconds — most of them
the bot's, which now searches for a way round every hole on the rack and every
hole of twelve draws. The bot needed nothing new for tunnels: it plans over
simulated shots, and a shot down a tunnel is a simulated shot.

Open `ui-tests.html` for the other half: 175 assertions about the *page* — the
bar, the modals in fullscreen, the picker, the title screen on a first visit, locks and the way past
them, stars on the banner and the plans, a door opening, a three-player party
from roster to honour to resume, the board turned for an upright phone and
laid out beside its column for one on its side, replaying the intro and
resetting progress, the Scenery row and its soundscapes, the aim's guide
running out short, the ball's roll, and every hole of every course drawn through the real
renderer, flat and turned, in every biome. The last two narrow the frame
and ask the board to fit again; the turned one sends world points through the
canvas's own transform and back through `toWorld`, which is the check that the
pointer lands where the drawing puts things. It
loads `index.html` in a frame with the cross-origin tags stripped out — no
font stylesheet, no analytics, so nothing waits on a network — and then
presses things. Unlike `golf3d/ui-tests.html` it keeps the page's own scripts:
there is no WebGL here, so the real game boots in a frame in milliseconds and
the picker can be opened, pressed and measured rather than merely read.

It exists because two of the bugs found while building the picker were
invisible to every assertion in the other file, and neither was a broken
rule — both were working rules landing on an element nobody was looking at:

- `.chip-menu { display: none }` was written *above* `.chip { display:
  inline-flex }`. Both are one class deep, so the later rule won and ☰ stood
  in the bar on a desktop, beside the five chips it exists to replace.
- A plan drawn into a folded strip is drawn against a zero-width box and then
  cached at that size, so unfolding the strip showed a row of one-pixel
  smears that no amount of redrawing would replace.

Transitions are killed in the frame rather than waited out: most of what is
read is read just after a class was added, and an element mid-transition
reports the state it is *leaving* — which would have passed both of the
above. The suite also snapshots every `miniGolf.*` key before it starts and
puts them back at the end, so opening it costs you a second and not a record.

The generated courses are held to the shipped ones' standard and then some.
Twelve fixed seeds — fixed, because a suite that fails one run in fifty is a
suite nobody believes — go through the strict rule book, the hazard-coverage
rule, the par check and the shape count (a draw that dealt nine corridors
would pass every other rule and still be nine of the same hole); eight of them are played by the bot, hole by hole,
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
places. The shape of the rack is pinned the same way: no two holes share a
name (the save file remaps by name), par never falls going down a card, every
card is played in at least two directions and uses at least four kinds of
hazard, every kind of hazard is in play somewhere on the rack, every hole of
the Warren has a tunnel and every hole of Ember Ridge has lava, and the
starter walks through a different biome on every hole, each one a place the
rack goes and the first its own.

The one worth knowing about is the **bot**, and it searches rather than plays.
The field is bucketed into 48px cells; the tee is where the search starts;
every state fans out candidate shots and records the cell each one comes to
rest in. Cells come off the queue in stroke order, so the first putt that
drops is the fewest strokes the search found, and the line behind it is real —
every edge is a simulated shot played from where the one before it left the
ball. If a hole is sealed off, unreachable, or has a cup buried where nothing
can settle, nothing the search tries ever drops and the suite goes red.

It used to be a greedy player: fan out shots, keep the one that finished
nearest the cup, play it. Greed has local minima and a mini golf course is
*made* of them — the wall you have to play away from, the moat you have to go
round — so it carried a hack for exactly that (when a turn bought no ground,
take an arbitrary candidate rather than the best one), and the hack got it
round a dogleg and no further. A hole built round a long wall asks the player
to spend a whole leg getting further from the cup, and the greedy bot could
not finish one at all. That is what the [elbow](#the-elbow) needed, and
searching is the honest way to give it: the bot is allowed to be a better
*planner* than a greedy walk, because a player looking at the screen is one.

What has not changed is the stroke. Power, aim spread, the wait before
striking and the overswing scatter are the player's, exactly as before — a bot
with a truer stroke than the game allows would sign off holes only finishable
by a shot nobody can reliably play. So the claim the suite makes is unchanged:
there exists a sequence of shots a player could hit that finishes this hole.

Three things keep it from being a "sometimes red" test nobody trusts:

- **A seed per hole**, not one stream down the course — and per hole *within*
  its course, so adding a whole card does not reshuffle the others.
  Sharing a stream means editing the second hole reshuffles the shots every
  later hole is played with, so a change here turns a hole there red — a report
  about the PRNG, not about the course. The three checks that do share a stream
  (resting position, shot length, escapes) walk the rack in order, for the
  same reason.
- **A random wait before striking.** The moving-gate holes are only solvable
  with timing, and a bot that always fires at `t=0` would report a false
  failure. For the same reason a cell may be expanded twice rather than once:
  the first arrival fixes the clock as well as the position, and a cell that is
  a dead end at one phase of a sweeping bar is a way through at another.
- **A second attempt per hole.** The claim under test is that the hole is
  finishable, not that this search got lucky. The greedy walk needed three
  goes; a search that has swept the reachable field once rarely changes its
  mind on the second sweep.

Being pure logic, `tests.html` needs no canvas and no AudioContext. It is
excluded from search results by both `robots.txt` and its own `noindex`, per the
rule in the root README.

## Saving

Two keys carry a round. `miniGolf.round.v1` is the one in progress, described
above; `miniGolf.save.v1` is the record — best round, that round's card, rounds
played and a running ace count. The landing page reads the record for the
card's stat chip.

Both are qualified by the course being played, and one course keeps the bare
key — `GOLF.BARE_KEY_COURSE`, the Old Course, by id rather than by where it
stands on the rack: it goes on writing `miniGolf.round.v1` and
`miniGolf.save.v1`, and the Wild Six writes `miniGolf.round.v1.wild` and
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
three strokes would otherwise beat any real round's score, and starting
one would throw away the round you had going.)
The save file also carries `holes`, the best score made on each hole, which the
stars are read off; a save from before it existed starts from its best round's
card, so a returning player is handed the stars they already earned. And it
carries `names`, the holes of the card it was written for, because a card can
be rebuilt under it: when the rack became seven sixes the eighteen lost twelve
holes and three nines lost three each, and the holes that stayed moved. A save
read against a card whose names differ is remapped name by name — a best on
Pinball stays a best on Pinball wherever Pinball now stands — and drops its
best round, which was over a card that no longer exists; a save from before
names were kept is read as written for the card as it was then
(`scoring.LEGACY`). That is also why no two holes on the rack may share a
name.
Progression — the courses granted or opened wholesale, the lessons seen,
whether the first stroke has been shown, whether this browser is a veteran's —
lives under `miniGolf.progress.v1`, a party in progress under
`miniGolf.party.v1` (course, seed, roster, cards and whose turn it is; a party
written for one draw is not offered to the next), and the last roster under
`miniGolf.players.v1`. Mute state lives separately under `miniGolf.muted`, and
the chosen scenery under `miniGolf.scenery.v1`. Both writes are wrapped —
a browser with storage disabled should cost you your records, not your round.
