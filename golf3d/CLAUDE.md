# Working in `golf3d/` — Loft Links

Three six-hole courses of 3D mini golf. Vendored three.js r128, ES5-flavoured
plain JavaScript, no build step, no dependencies. Open `index.html` and it runs.

Read [`README.md`](README.md) for why the game is the way it is — the bag, the
courses, the weather, the reasoning behind the shapes. Read this file before
changing anything.

## Where to go for what

Find the row, open the file. Every file also opens with a header saying what it
owns and what it may not touch.

| If you are changing… | Go to |
| --- | --- |
| how far a club hits, friction, gravity, cup size, any number at all | `js/config.js` |
| how the ball moves, bounces, settles or drops | `js/physics.js` |
| a hole's shape, a new hole, a new course | `js/courses.js` |
| what a score is called, the save file | `js/scoring.js` |
| a sound | `js/audio.js` |
| which sky a hole gets, wind, rain, mist, motes | `js/weather.js` |
| bloom, light shafts, tone mapping, the colour grade | `js/postfx.js` |
| a course's colours, or how weather tints them | `js/render/palette.js` |
| what a surface looks like (grass, sand, wood, rock) | `js/render/textures.js` |
| the sky dome and its clouds | `js/render/sky.js` |
| the sea and the ponds | `js/render/water.js` |
| the meshes a hole is made of — pads, rails, cup, pin, lights | `js/render/hole.js` |
| the aim wedge, the power ring, the predicted path | `js/render/aim.js` |
| the ball's trail, splashes, divots, sand sprays | `js/render/effects.js` |
| the camera, the frame order, what the renderer holds | `js/render.js` |
| how a club or the bag is modelled | `js/bag/models.js` |
| where the clubs stand, the open row, picking one | `js/bag.js` |
| the scoreboard, the overlay, modals, the club panel, any DOM | `js/game/hud.js` |
| what a shot costs, the round, input, the loop | `js/game.js` |
| page markup, script load order, the cache-bust version | `index.html` |

**Jump straight to a hole**: `index.html?course=quarry&hole=4&weather=rain`.
Course ids are `seaside`, `quarry`, `works`; weather ids are the keys of
`KINDS` in `js/weather.js`. This is how you get to hole 14 without playing
thirteen, and it is what the test scripts use.

## Non-negotiables

1. **`physics.js` never touches THREE, the DOM or the game.** It is a pure
   function of a world object. `tests.html` plays whole rounds with no WebGL
   context at all, and `render-tests.html` asserts the rule directly — if a
   change needs a `THREE.Vector3` to decide where a ball goes, the logic is in
   the wrong file.
2. **`config.js` holds every number.** No other file may grow a magic constant.
   The tests reason about the same figures the game runs on precisely because
   there is only one copy of them.
3. **A moving wall is drawn from `physics.wallBox()`** — the same call the
   collision solver makes. A blade you can see and a blade you can hit cannot
   be allowed to drift apart. `render-tests.html` checks this every run.
4. **The aim preview is the real simulation.** `render/aim.js` draws
   `physics.previewPath()`, which clones the world and runs it forward. It is a
   promise about what the ball will do — never correct it by eye.
5. **`state` lives in `game.js` and nowhere else.** `game/hud.js` gets a
   read-only accessor and a three-function `api`; `render.js` gets a world and
   an aim, a frame at a time. Nothing outside `game.js` writes a stroke, a
   score or a ball position.
6. **`game/hud.js` decides nothing.** It reads the game and writes the DOM. If
   a change there could alter what a stroke costs, it belongs in `game.js`.
7. **Weather never reaches the simulation.** Wind does not push the ball and
   rain does not slow it — a personal best has to mean the same thing whatever
   the sky was doing.
8. **No build step, no bundler, no framework.** Plain `<script>` tags, one IIFE
   per file, one `window.G3` namespace — per the workspace rules in `.agents/`.

## Load order is the dependency graph

The `<script>` block in `index.html` is grouped and ordered deliberately: **a
module may use anything above it and nothing below it.** There is no bundler to
work it out, so a new file needs a tag in the right group.

```
the rules    config → physics → courses → scoring       (no THREE, no DOM)
the senses   audio → postfx → weather
the picture  render/palette → textures → sky → water → hole → aim → effects
             → bag/models → bag → render
the game     game/hud → game
```

## Before you commit

Two test pages, because they need different things. Run both:

```sh
for page in tests.html render-tests.html; do
  chromium --headless=new --disable-gpu --no-sandbox \
    --use-gl=swiftshader --enable-unsafe-swiftshader \
    --virtual-time-budget=180000 --dump-dom "file://$(pwd)/golf3d/$page" \
  | grep -oE 'id="summary" class="(ok|bad)">[^<]*|class="fail">[^<]*'
done
```

Expect `✓ 421 passed` and `✓ 70 passed`. Any `FAIL:` line is a failure.

- **`tests.html`** is the rules: physics, courses, scoring, and a bot that
  plays all eighteen holes out of the real bag to prove they are solvable. It
  loads **no** THREE at all, deliberately, so it breaks loudly if `physics.js`
  ever reaches for one.
- **`render-tests.html`** is the wiring: it boots the whole render stack
  against a real WebGL context, builds every hole under every theme and sky,
  and draws a frame in every aim state including the zero-power one the game
  sits in between shots. This page exists because a green `tests.html` once
  shipped alongside a completely black canvas — an uncaught throw in
  `updateAim` killed `frame()` before its own draw call. Logic tests cannot see
  that. This one can.

Then load `index.html` and check the console is clean. Two network errors for
Google Fonts and gtag are expected over `file://` and are not code faults.

If you touched the DOM chrome, also play a hole: the tests prove the layers,
not the buttons.

## Before you push

**Bump the version in two places, to the same value:**

- the `?v=` on every script tag in `index.html` — it is one number for the
  whole game, not one per file, so this is a single find-and-replace
- `G3.VERSION` in `js/config.js`

GitHub Pages caches aggressively; skip this and players get yesterday's game
with today's HTML, which fails in ways that look like ghosts.

## Gotchas

- **`previewPath()` returns `[]` below `MIN_POWER`.** `launch()` refuses a
  shot that small, so anything asking for a preview has to clamp first — see
  the top of the preview block in `render/aim.js`. An unclamped zero is what
  put the black canvas on screen.
- **A hole owns its meshes, materials *and* textures.** `holeMesh.build()`
  hands back `b.textures`; `buildHole()` disposes them with the group. Anything
  new a hole makes goes on that list, or it leaks one per hole for the rest of
  the round.
- **The copy block at the end of `buildHole()` is the seam.** It is the one
  place `render.js` and `render/hole.js` meet. A new thing the frame loop has
  to animate needs a line there and nowhere else.
- **Textures that outlive a hole live in `R.tex`, made once in `init()`.** The
  grass is not one of them: it is tinted per theme, so it is made per hole and
  disposed with it.
- **Two scoreboards carry the same figures.** The top bar and `#stage-hud`.
  `hud.sync()` writes both together — update one by hand and they will
  disagree in fullscreen, which is where only the second one is visible.
- **`syncCompact()` is the only place that decides the layout is compact.** The
  stylesheet asks the same three questions in its media queries. Change one and
  change the other, or the topbar's two modes will disagree.
- **Adding a club is two files.** An entry in `CONFIG.CLUBS`, plus a length in
  `LENGTHS` and a branch in `buildHead()` in `js/bag/models.js`. Then it
  appears in the bag, in the fan, with a label, pickable, with no markup and no
  CSS. `render-tests.html` fails if a configured club has no model.
- **Adding a course is two files.** An array of holes and an entry in
  `G3.COURSES` in `courses.js`, plus a palette in `render/palette.js` under the
  same theme name. `weather.js`'s `BY_THEME` decides what skies it can have.
- **A hole must be solvable out of the bag.** The carries in `README.md` are a
  design constraint: a hole asking for more air than the four clubs have must
  offer a way round — a bridge, a ramp, a bank. `tests.html` measures the
  carries rather than trusting the table, and the bot plays every hole with
  real clubs, so a hole that cannot be played will fail the suite rather than
  reach a player.
- **Friction is `pow(k, dt)`, not a per-frame subtraction.** That is what makes
  a 144Hz monitor and a 30fps phone roll the ball the same distance, and what
  lets the tests step at a fixed dt and trust the answer. Do not "simplify" it.
- **`advance()` is the only integrator.** The loop, the renderer and the tests
  all call it. Never grow a second copy.
- **The bag is furniture, not course.** Both rigs ride at fixed offsets in
  *camera* space. Nothing in `bag.js` may become something the ball can hit.
- **postfx is optional.** `postfx.init()` returns false on a context that
  cannot have it and the renderer draws straight to the canvas. Everything
  downstream must still be a complete game.

## Save schema

`loftLinks.save.v1`, read and written by `js/scoring.js`. Keep it backwards
compatible — a player's record of a course they have already beaten is the one
thing here that cannot be regenerated.
