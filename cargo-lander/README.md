# CargoLander — Supply Chain Physics

A browser-based 2D "lunar lander"–style game with a logistics theme. You pilot a
lander/drone, pick up cargo at a collection point, and deliver it to color-coded
delivery hubs without crashing, running out of fuel, blowing your budget, or
running out the mission clock. Money earned persists between sessions and can be
spent on upgrades.

The game is **pure client-side**: plain HTML + CSS + vanilla JavaScript with a
custom 2D physics engine (built on a vendored Matter.js for collision), a
Canvas2D renderer, an optional WebGL particle/post-FX overlay, and a Web Audio
synth. No build step, no CDN, no network dependencies — serve the folder with
any static server and open `index.html`.

Doc map: **this file** = current state of the code. **[CLAUDE.md](CLAUDE.md)** =
agent workflow & standing instructions. **[HISTORY.md](HISTORY.md)** = shipped
work, resolved bug sagas, archived plans. Open work lives in
[TODO / Open backlog](#todo--open-backlog) below.

---

## Architecture

One global object graph, no modules/bundler — plain `<script>` tags in a fixed
order. Three singletons talk to each other:

- `game` (`CargoGame`, `game.js` + `game/*.js` + `render.js` + `render/*.js`) —
  orchestrator: RAF loop, input, camera, economy/progression, DOM UI, and all
  Canvas2D drawing.
- `game.physics` (`CargoPhysics`, `physics.js` + `physics/*.js`) — simulation
  only, no rendering: terrain, lander, cargo boxes, hazards, monster, particles.
- `CargoAudio` (`audio.js`) — procedural Web Audio synth, no audio files
  (music tracks in `music/` are the exception).

Both `game.js` and `physics.js` declare a class whose **prototype is extended
by mixin files** (`Object.assign(CargoGame.prototype, {...})`) loaded after it —
so a method you can't find in the class file lives in one of its `game/` or
`render/` siblings. Per-frame flow:

- `game.update()` builds an `inputState` from `game.keys` (keyboard, gamepad
  `gp_*`, touch-joystick `joy_*` — all the same boolean-key shape) and calls
  `physics.update(dt, levelConfig, inputState)`.
- `physics` mutates `lander`, `boxes`, `particles`, `monster`.
- `game.draw()` (render.js) reads physics state and renders; particles +
  monster + post-FX are handed to `shaders` (WebGL) with a Canvas2D fallback.
- Both `game` and `physics` call into global `CargoAudio` for SFX.

## Files

| File | Role |
|------|------|
| `index.html` | Page shell: all DOM/UI (menus, HUD, overlays, mobile controls), all CSS, touch-joystick logic (`setupJoystick()`), and the bootstrap script. Loads every `<script>` in order (see below). |
| `vendor/matter.min.js` | Vendored Matter.js 0.19.0 (collision engine). Local so the game and tests work offline / without CDN access. |
| `game.js` | `CargoGame` core: state + constructor, `init()`, the RAF `loop()`/`update(dt)`, mission lifecycle (`startLevel`/`completeMission`/`failMission`/`respawnLander`), camera, grapple. Exposes global `game` (instantiated at the end of `render.js`). |
| `game/input.js` | Keyboard/mouse listeners (`setupEventListeners`), gamepad polling (`pollGamepad`). |
| `game/menu.js` | Menu-screen DOM: mission grid (`generateMissionUI` — auto-generated from `levels[]`, no per-level wiring), main-menu refresh, pilot career/rank, settings modal, vehicle select, procedural-mission config, upgrade shop, custom-level upload, dev panel. |
| `game/hud.js` | In-mission DOM UI: `updateHUD`, mission/quest panel (`updateMissionPanel`), notification chips (`addMessage`), HUD collapse + UI scale. |
| `game/cargo.js` | Cargo delivery & economy: `checkCargoDelivery` (hub/chute matching, abyss loss), `removeCargoBox` (the **only** correct way to delete a box — see Physics Notes), payouts, box fire state, delivery/explosion FX. |
| `render.js` + `render/{background,terrain,entities,effects,ui}.js` | All Canvas2D rendering, mixed onto `CargoGame.prototype`. `render.js` ends with `window.game = new CargoGame()`. |
| `physics.js` + `physics/{collision,mechanics,entities,atmosphere}.js` | `CargoPhysics` — custom engine on Matter.js bodies: terrain generation, lander integration, cargo-box physics, drone winch, gravity wells, hazards, water bounce, monster, ambient traffic. No rendering. |
| `shaders.js` | `ShaderOverlay` — WebGL layer on `#webglCanvas`: glowing particles, the raymarched OOB monster, and the post-FX pass (`renderPostFX`: heat haze, water shimmer, gravity lensing, rain-on-lens). Canvas2D fallbacks exist for particles/monster. |
| `audio.js` | `CargoAudioController` — procedural Web Audio synth: thrusters, collisions, explosions, warnings, arpeggios, ambient drone. Exposes global `CargoAudio`. |
| `levels.js` | `registerLevel()` dispatcher + quest helper functions (`questPrimary`, `questNoCrash`, …). |
| `upgrades.js` | Upgrade catalog. |
| `level1.js` – `level10.js`, `levelTest.js` | Individual level configs (terrain polygons, hubs, OOB zone, palette, physics params, quests). `levelTest.js` is a sandbox reachable via `game.startTestLevel()`. **A new `levelN.js` needs its `<script>` tag added to `index.html`, `tests.html`, and the level-editor's dropdown manually** — everything else (mission-grid button, dev-panel jump) is auto-generated. |
| `levelGenerator.js` | `generateProceduralLevel(craziness)` — procedural "Mission ??" maps, 3 craziness tiers. |
| `levels/collectibleTypes.js` | `COLLECTIBLE_TYPES` registry for mid-air flythrough pickups (`cash`, `fuel`, …). Read generically by `physics/atmosphere.js` (award logic), `render/entities.js` (token visual), and the level editor's Entities panel — add a new pickup type here once instead of touching all three. |
| `levelSchema.js` | Shared schema (name/type/default/widget) for the scalar/object level-config fields (mission params, `palette`, `outOfBounds`, `worldBounds`, `gravityWell`). Drives `level-editor.html`'s form panels, loader defaults, and export blocks, *and* `tests.html`'s validation checks — add a scalar field once, in the schema. Geometry (`terrainPolygons`/`waterBodies`/`hazards`) is deliberately out of scope. |
| `level-editor.html` | Standalone visual level editor. See [Level Editor](#level-editor). |
| `tests.html` | Browser test suite (142 tests): behavioral smoke tests + schema-driven "Level Config Validation" over every registered level. Auto-runs on load; results in `#summary`, failure stacks to `console.error`. |
| `probe-screenshot.html` | Headless visual-verification harness — see [Verification](#verification). Not part of the shipped game. |

### Load order matters
`index.html` loads `vendor/matter.min.js`, then `upgrades.js →
levels.js → levelGenerator.js → level1…10.js → levelTest.js →
collectibleTypes.js → audio.js →
shaders.js → physics.js → physics/*.js → game.js → game/*.js → render.js →
render/*.js`. Class files must precede their prototype-mixin files;
`render.js` instantiates `window.game`, so every mixin must load before it;
the bootstrap script then calls `game.init('cargoCanvas')`.

### Key concepts
- **Vehicles**: `basic` (upright arcade) and `drone` (auto-hover + extendable
  winch, required for tethered cargo). A legacy `advanced` type is fully
  removed.
- **Cargo types**: `normal`, `red`, `blue`, `green` — must be delivered to a
  hub of the matching `type`. `tethered` boxes can only be grappled by the
  drone (`toggleGrapple()` in game.js). `{big: true}` boxes occupy the entire
  deck (single-load capacity).
- **Hub types**: usually mirror a cargo type; `'chute'` hubs vacuum-pull any
  cargo type in without a landing (see `checkCargoDelivery()` in
  `game/cargo.js` and the chute logic in physics).
- **Economy**: `globalCash` + `upgrades` persist in `localStorage`;
  `missionBudget` is per-mission and doubles as the crash/refuel resource.
- **dt**: the loop normalizes delta time to 60 fps (`dt = elapsedMs / 16.666`),
  so most physics constants are "per 60fps-frame".
- **Collectibles**: mid-air "flythrough" pickups (`collectibles: [{type, x, y, ...}]`
  in a level config) — fly the lander body through one to collect it, no
  winch/landing needed. Types (`cash`, `fuel`) are defined once in
  `levels/collectibleTypes.js` (color, icon, resource, award amount field,
  pickup message); `physics/atmosphere.js` (award logic) and
  `render/entities.js` (token visual) both read that same registry generically,
  and the level editor's Entities panel lists/add-buttons/exports them too.
  **To add a new pickup type**, add one entry to `COLLECTIBLE_TYPES` — no
  other file needs a new branch unless the type wants a bespoke visual (set
  `draw(ctx, c)` on its registry entry to override the default token look).

---

## Level Editor

`level-editor.html` is a self-contained, browser-based tool for visually editing the `terrainPolygons`, `waterBodies`, and `hazards` arrays in level files — all three are polygons (`{pts:[{x,y},...]}`) and are edited with the exact same vertex tools, just switched via the **Terrain / Water / Hazard** tabs in the sidebar. Serve the `cargo-lander/` folder with any static web server (e.g. `python3 -m http.server 8001`) and open `http://localhost:8001/level-editor.html`.

### Features
- **Schema-driven Metadata / Palette / Out of Bounds / Gravity Well panels** — generated from `levelSchema.js`; the loader's defaults and the export-block generator read the same schema. Adding a new scalar field only requires a schema entry (see that file's header comment). Geometry is NOT schema-driven (bespoke per-shape-kind vertex tooling) — see the backlog.
- **Level file dropdown** — loads any `level1.js`–`level10.js` + `levelTest.js` from the server via `fetch()`, parsing the full `registerLevel({...})` config with a sandboxed `new Function()` eval. L9's `outOfBounds: true` boolean shorthand round-trips verbatim.
- **Terrain / Water / Hazard tabs** — `+ Shape` adds a polygon to the active tab; clicking a shape on canvas auto-switches to its tab. Legacy rect/circle configs are auto-converted to polygons on load.
- **Hazard types** — per-shape `type` dropdown (zone / laser / incinerator / crusher / pickup / …); the point-editing UI switches between polygon vertices and the laser's fixed 2-point line, with `onMs`/`offMs`/`warnMs` timing fields where applicable.
- **Palette-based rendering** — sky gradient and terrain fills use each level's palette, matching in-game biome appearance.
- **Overlays** — OOB fluid surface line, world-boundary bands (per-edge tinted band + dashed line labeled with its action; faint tint only in preview mode), hub pads as labeled width-bars + guide lines, gravity-well pull/orbit rings, HQ + cargo-depot spawn markers.
- **Collectibles** — Entities panel has one `+ <Type>` button per entry in `COLLECTIBLE_TYPES` (`levels/collectibleTypes.js`); markers are draggable free-floating tokens (no terrain snapping) with a sidebar list for x/y/amount and delete.
- **Shape list sidebar** — select, hide/show, rename, per-point x/y inputs.
- **Snap controls** — 1 / 10 / 50 / 100 world-unit snapping; Shift = ×5.
- **Export** — live-updating complete `registerLevel({...})` block with one-click Copy; also a playtest button, `.js` download, and upload-back-into-the-game flow.
- **Paste fallback** — accepts pasted JS if the server isn't running.
- **Headless hooks** — `?autoload=levelN.js&dumpExport=1&openPanels=1` for scripted round-trip verification.

### Keyboard shortcuts
| Key | Action |
|-----|--------|
| `S` | Select mode (drag vertices) |
| `A` | Add-points mode (click to insert on nearest edge) |
| `P` | Pan mode |
| `F` | Fit view to polygons + OOB surface |
| `Del` / `Backspace` | Delete selected point |
| Scroll | Zoom |
| Alt + drag | Pan in any mode |

### Workflow
1. Pick a level from the dropdown and click **Load from server**.
2. Select a polygon from the sidebar list.
3. Drag vertices to reshape, or use **Add pts** mode to insert new points.
4. Copy the export block over the arrays in the level `.js` file (or download).

---

## Verification

**One command runs everything:** `./run-tests.sh` (bash; auto-detects
Chrome/Chromium and python, serves the folder itself, exits non-zero on any
failure). It runs, in order:
1. **Boot smoke** — `syntax-check.html`: loads every game script in
   `index.html`'s order, fails on any parse/load error, and asserts core
   globals plus one method per prototype-mixin file (catches a broken file
   AND a mixin that silently never attached). Keep its script list in sync
   with `index.html` when adding files.
2. **Test suite** — `tests.html` must report **0 failed**.
3. **Editor self-tests** — `level-editor.html?runTests=1` (undo/redo logic).
4. **Editor export round-trip** — `?autoload=level1.js&dumpExport=1`.
5. **Game boot probe** — `probe-screenshot.html` renders L1 and stamps the
   post-FX shader link status (implies the full script chain boots).
6. **Landing-page cache-bust** — the repo-root `index.html`'s link into the
   game must carry `?v=<CargoGame.VERSION>`. Checked here rather than in
   `tests.html` because it sits above that suite's web root.

Standard protocol for any code change: run `./run-tests.sh`, then for
anything touching a specific mechanic, exercise it against the live
`game`/`game.physics` objects rather than trusting a code read. Gotchas:
move the lander by setting `game.physics.lander.x/y` **and**
`Matter.Body.setPosition(game.physics.landerBody, {x,y})` together (moving
only one desyncs them → bogus collision damage); drive `game.update(1.0)`
in a loop (dt≈1.0 = one 60fps frame).

### Headless verification (no interactive browser needed)
Any headless Chromium works (`chrome`, `chromium`, or a Playwright
`headless_shell`); substitute the binary your environment has. With a static
server on port 8177:
- **Test suite**:
  `<chromium> --headless=new --disable-gpu --virtual-time-budget=15000 --dump-dom http://localhost:8177/tests.html`
  then grep the dump for `id="summary"` ("N passed / 0 failed").
  `--virtual-time-budget` fast-forwards timers so the async run finishes
  before the dump. Sandboxed Linux environments may also need
  `--no-sandbox --user-data-dir=/tmp/chrome-test`.
- **Visual checks**: `probe-screenshot.html` loads the game in an iframe and
  is driven by query string: `?level=N&x=..&y=..&zoom=..` parks the free
  camera (N is a **0-based** index into `levels[]`); `&debug=1` dumps
  element/computed-style diagnostics on-screen (this is what caught the
  invisible-minimap CSS bug); `&hide=fn1,fn2` no-ops draw calls to bisect a
  visual; `&script=name` runs a scripted repro (add new ones there for future
  bug hunts). Screenshot with
  `--window-size=1280,800 --virtual-time-budget=8000 --screenshot=out.png "<url>"`
  and read the PNG. The probe stamps the post-FX shader's link status
  bottom-left in every shot, since a failed WebGL compile is otherwise silent.
- **Editor round-trip**: `level-editor.html?autoload=levelN.js&dumpExport=1`
  dumps the export block for diffing against the source file.
- Caveat: `--virtual-time-budget` doesn't reliably tick
  `requestAnimationFrame`, so multi-frame *mechanics* need a synchronous sim
  loop (see `probe-screenshot.html`'s `parachuteSim` script for the pattern),
  not a screenshot.

### Mobile / responsive manual QA
`tests.html` runs against a fixed-size canvas mock and never touches real
layout, so viewport-dependent behavior is checked by hand with devtools device
emulation:
1. Phone portrait (e.g. 375×812): starting a mission should show the
   rotate-tip (`#rotate-tip`, non-blocking, gated on aspect ratio +
   `min(w,h) <= 820` — deliberately exercisable without a touch device). Not
   on the menu; disappears on rotate to landscape.
2. Phone landscape (e.g. 812×375): mission HUD (mission panel, radar, touch
   controls) must not overlap or clip — the `@media (max-width: 480/768/1024px)`
   rules in `index.html` are where to look if it does.
3. Toggle Settings → Visual Effects off/on once at a small viewport to
   confirm the post-FX pass adapts.
4. **iPhone has no Fullscreen API** (only iPad does, prefixed), so both
   fullscreen buttons are hidden there by `updateFullscreenAvailability()`
   (`game/menu.js`, called from `init()`). Their absence on an iPhone is
   correct, not a regression. Repro the unsupported path anywhere with
   `probe-screenshot.html?script=fullscreenUnsupported` — it must render no red
   `#error-log` banner.

Touch *feel* (joystick drag, button sizing) can only be validated on real
hardware — both the joystick and gamepad mappings still await a
real-device pass.

---

## TODO / Open backlog

Self-contained, in rough value-per-risk order:

- [ ] **Refueling stations** — generalize the HQ refuel into a level-config
      field `refuelPads: [{x, width, pricePerUnit}]`: landing on one refuels
      at cost from `missionBudget`, HUD toast + pump SFX. Add to
      `levelSchema.js` (editor + tests pick it up for free), place on the
      longest maps (L8/L9), add a validation test.
- [ ] **Level-start hitch** — `physics.js initLevel()` synchronously rebuilds
      the Matter world, convex-decomposes all terrain, spawns lander +
      traffic. **Profile first** (`performance.now()` around the sub-steps,
      L1 vs L8/L9), then fix only the dominant cost. Candidate wins in order:
      cache convex decompositions per level; defer ambient-traffic pre-spawn
      a few frames; only then consider spreading `initLevel()` across frames
      (touchy — code assumes a fully-initialized level after `startLevel()`).
      *2026-07-28 note*: attempted headless — useless, `--virtual-time-budget`
      freezes `performance.now()` so every level timed 0.0ms. What the geometry
      says: the levels are small (heaviest is L2 at 106 vertices / 210 Matter
      bodies; L8 is only 28/60), so terrain decomposition is an unlikely
      culprit and ambient traffic is the better first suspect. **Needs a real
      browser profile** — don't optimise off the structural guess above.
- [ ] **Pendulum-mass special cargo** — a box hanging from the *basic* lander
      by a rope (reuse the drone winch's Matter constraint pattern). Flag
      `cargo: 'pendulum'`; delivery = lower the box onto the pad. Introduce on
      one level (or a new L10 — remember the `<script>` tag). Lives or dies
      on feel; tune swing damping in a real playtest.
- [ ] **Sound polish pass** — missing procedural cues: refuel pump, big-cargo
      clamp thunk, pendulum rope creak, escalating low-fuel heartbeat below
      15%. Keep each ~20 lines matching existing `audio.js` patterns.
- [ ] **Massive scrolling level** (roadmap flagship) — one hand-built level
      3–4× L8's width around fuel management: multiple refuel pads, a
      waypoint hub chain (fakeable with `setupPhysics()` callbacks like L9),
      minimap as primary nav. Gate: refuel pads first. Check with the user
      before starting.
- [ ] **Procedural Expedition mode** — rogue-like run of procedural maps with
      one shared fuel/hull/cash pool, run summary, per-run highscore. Big UI
      surface — sketch the flow and confirm with the user before coding.
- [ ] **Editor geometry schema-driving** — fold `terrainPolygons`/
      `waterBodies`/`hazards` into `levelSchema.js`. Deliberately deferred:
      the vertex tooling is bespoke per shape kind; treat as its own project.
- [ ] **L8 return-gauntlet escalation** — speed up/flip laser phases after
      final delivery ("defense grid alerted"). Needs an engine hook for
      quest-triggered hazard state; none exists today.

**Parked (needs user input, don't start unprompted)**: "unload drone as R&D
upgrade" (ambiguous, soft-lock risk); bumping the 4-water-body post-FX uniform
limit (no level needs it — bump the array size *and* the `Math.min(4, ...)`
clamp in `render.js` together); automated mobile testing (manual QA above is
the process).

### Long-term vision (remaining phases)

| Feature | Description |
|---------|-------------|
| **Massive scrolling levels** | Multi-screen cave systems / planetary surfaces with fuel management across distances, waypoint navigation, paid refueling stations. |
| **Pendulum mass physics** | Rope-hung special cargo that destabilizes flight (see backlog). |
| **Advanced logistics** | More interactive loading/unloading than pad-hovering; persistent ship builds for the harder maps. |
| **Procedural Expedition mode** | Rogue-like infinite-delivery runs (see backlog). |
| **Night ops levels** | Darkened scene + lander spotlight cone, ambient hub/hazard glows. **In progress** — see [PLAN.md](PLAN.md). |

Everything earlier in the original roadmap (dynamic weather, Big Cargo,
biomes, upgrades integration, in-browser level editor) has shipped — see
HISTORY.md.

### Idea parking lot (not scheduled — grab one if you want a self-contained task)

Unsorted, no priority implied. Each is scoped enough to pick up cold; grep the
named files/functions before starting, they may have moved.

**Retention / progression**
- Per-level 3-star medals (Delivered All / No Damage / Time Par), stored per
  level, shown on the mission grid (`generateMissionUI()` in `game/menu.js`)
  and victory screen.
- Post-mission debrief: fuel/damage/cargo/time summary + one contextual tip
  on failure (`failMission(reason)` already has the cause).
- Daily Challenge: date-seeded `levelGenerator.js` map (mulberry32 of
  `YYYY-MM-DD`), shared by all players that day, streak counter.
- Ghost replay of your own best run per level (record `{x,y,angle,thrust}` at
  ~10Hz, redraw translucent on top of a live attempt).
- Career stats page (lifetime missions/cargo/crashes/earnings), next to pilot
  rank in the menu.

**Accessibility / QoL**
- Assist options: stability auto-level + gentle gravity toggle, disables
  highscore/medal recording for that run.
- Colorblind-safe cargo/hub glyphs (shape stamped on top of the color).
- Separate music/SFX volume sliders (`audio.js` currently mixes both).
- Pause menu with one-tap "Restart mission" (re-charges the entry fee).
- Save export/import as a copy-paste code, bundling the `cargoLander*`
  localStorage keys — cross-device progress with zero backend.

**Economy**
- Contract board: pick a mission modifier before launch (storm surcharge,
  heavy load, no-damage bonus) for a payout multiplier.
- Mission insurance: pay extra up front, partial refund on failure.
- Police speeding fines: existing ambient police traffic gets a
  `speedLimit` level field and a small fine for flying past it too fast.

**Content / mechanics**
- New hazard type `fan` — directional wind-tunnel zone pushing lander +
  cargo along a configured vector.
- Cargo behavior flags `fragile` (damaged/destroyed by hard landings) and
  `expiresSec` (perishable, countdown ring).
- Fuel leak below ~30% hull integrity — gives the mid-mission repair action
  a reason to exist outside of crashes.
- Dynamic music intensity: crossfade between calm/tense tracks in
  `music/` based on a computed per-second danger score.
- Shareable level codes: base64 the editor's export block for copy-paste
  sharing, paste-to-import next to the existing custom-level upload flow.
- Level editor undo/redo (ctrl-z / ctrl-shift-z): editor state lives in one
  global `S` object with no history stack today. Snapshot-based approach —
  push a `JSON.stringify(S)` before each discrete mutation (not every
  mousemove during a drag; snapshot on drag-start so a single drag is one
  undo step), pop + restore + re-`draw()`/`updateOut()` on ctrl-z. Moderate
  effort: state is small and serializable, but the ~20+ mutation entry
  points (`setCfg`, `setOOB`, `setGW`, point drag/delete/spawn) all need
  wiring.

**Hygiene**
- *(resolved)* `level10.js` missing from `tests.html`'s script list — it is in
  both lists now, and the "Deploy Hygiene" test category enforces that the two
  pages stay version-locked to `CargoGame.VERSION`.

---

## Key Conventions
- `dt` = `elapsedMs / 16.666` (normalized to 60fps); physics constants are per-frame at 60fps.
- Vehicle types: `'basic'` (upright arcade), `'drone'` (winch). `'advanced'` is fully removed.
- `this.lander.deckWidth = 56`, `hw = 28`; body width=34, height=22.
- `currentPad` set when speed ≤ 2.0, angle ≤ 8°, proximity check; cargo dispense uses the same proximity check.
- Level palettes: `palette: { skyTop, skyMid, skyBot, terrainFill, rockEdge, rockGlow, fog }`.
- `rockGlow` is a **partial CSS rgba string** like `'rgba(34,197,94,'` — append opacity: `${pal.rockGlow}0.10)`.
- `localStorage` keys: `cargoLanderCash`, `cargoLanderUpgrades`, `cargoLanderCareer`, `cargoLanderHighscores`, `cargoLanderVehicle`, `cargoLanderPostFX`, `cargoLanderTouchJoystick`, `cargo_lander_ui_scale`.
- Input paths all merge into the same boolean `game.keys` map: keyboard, gamepad (`gp_left/right/up`, `game/input.js pollGamepad()`), touch joystick (`joy_*`, `setupJoystick()` in `index.html`, enabled via Settings).
- Vitals panel (`#vitals-panel`) is a CSS-grid gauge cluster (fuel with E/F markers, hull, shield) with quarter-tick overlays; the shield row only renders when the `shieldRegen` upgrade is owned (`updateHUD` in `game/hud.js`).
- Mission panel is tap-to-collapse (`toggleMissionPanel` in `game/hud.js`): on phone-sized viewports it auto-shrinks to a time/budget/cargo chip ~5s after mission start and after each mission event (delivery, bonus result, overtime), re-expanding on the next event. `isSmallViewport()` (height ≤ 500 or width ≤ 480) is kept in sync with the "Compact HUD" CSS media query in `index.html`, which also shrinks `.hud-group` padding and renders the radar smaller + translucent. Probe harness takes `&vw=&vh=` to screenshot these layouts headlessly.
- **Terrain polygon winding**: an edge is a *floor* (landable surface, glowing
  outline, collision normal, spike direction) when it runs left-to-right in the
  polygon's normalised order — `polygonIsReversed()` in `physics/collision.js`
  decides that once from the shoelace sum, and every consumer swaps that edge's
  endpoints rather than reversing the vertex list, so per-point `invisibleEdge`
  / `edgeHazard` flags stay on the edge that starts at them. Level files may be
  authored either way (L1's ground and L1's island disagree); the editor emits
  the canonical winding. **Never reintroduce a bare `p1.x < p2.x` test on raw
  vertex order** — that reads reverse-wound polygons upside down, which is how
  v0.19.9 buried L1's HQ under the map.
- `padScale` on level config scales all pad widths (L1=1.5 … L4=0.70).
- `BOX_SIZE = 28`; big cargo = `BOX_SIZE * 1.8`, claims the whole deck.
- `overtimeActive`/`overtimeTimer`: mission timer at 0 → 15s grace period to reach HQ; auto-extraction pays only if all cargo was delivered.
- Leg spring: `lander.legCompress` set on landing (`speed * 0.6`), decays only while `landed === true`, reset instantly on liftoff.
- Bump `CargoGame.VERSION` (top of `game.js`) on every user-visible change — see CLAUDE.md.

## Code Map — where things live

Line numbers rot; these are file-level pointers — grep the function name within
the file. The class files are small; the bulk is in the mixins.

| System | Location |
|---|---|
| Game state, constructor, `init()` | `game.js` |
| RAF `loop()` / `update(dt)` — a thin ordered sequence of `update*` phase methods (mission clock, physics tick, camera, auto-load, crash handling, …) defined right below it | `game.js` |
| Mission lifecycle: `startLevel`, `completeMission`, `failMission`, `respawnLander` | `game.js` |
| Grapple (`toggleGrapple`), refuel/repair/self-destruct dev actions | `game.js` |
| Keyboard/mouse listeners, gamepad polling | `game/input.js` |
| Mission grid, menus, settings, shop, vehicle select, dev panel | `game/menu.js` |
| `updateHUD`, `updateMissionPanel`, `addMessage`, UI scale/collapse | `game/hud.js` |
| `checkCargoDelivery`, `removeCargoBox`, payouts, explosion FX | `game/cargo.js` |
| Frame composition (`draw()`), post-FX region setup, `shadeColor` helper | `render.js` |
| Sky/parallax, weather, ambient traffic drawing | `render/background.js` |
| Terrain, water, gravity well, mist/fluid bounds, underground | `render/terrain.js` |
| Hazards, cargo boxes, background buildings, collectibles | `render/entities.js` |
| Pad base (`drawPadBase`), HQ depot, delivery hubs + hub styles (crane/house/depot/silo) | `render/pads.js` |
| The lander/drone vehicle drawing | `render/lander.js` |
| Sandworm, police interceptors, OOB monster | `render/creatures.js` |
| Particles | `render/effects.js` |
| Minimap, radar ping, objective arrow, notifications, wind indicator | `render/ui.js` |
| `initLevel`, Matter world build, terrain generation, `update()` | `physics.js` |
| Lander spawn/controls/integration, damage & shield, cargo boxes, on-deck clamp | `physics/entities.js` |
| Polygon/segment collision helpers | `physics/collision.js` |
| Water bounce, gravity well pull | `physics/mechanics.js` |
| Gravity/wind, monster AI, ambient traffic, police, particles, hazard ticks | `physics/atmosphere.js` |
| Mid-air collectible pickup collision/award (`updateParticles`, generic over `COLLECTIBLE_TYPES`) | `physics/atmosphere.js` |
| Particle/monster WebGL overlay + post-FX pass (`renderPostFX`) | `shaders.js` |
| Level registry, quest helpers | `levels.js` |
| Upgrade catalog | `upgrades.js` |
| Scalar level-config schema (editor + tests) | `levelSchema.js` |
| Mid-air collectible **type registry** (`cash`/`fuel`/…) — shared by physics, rendering, and the editor | `levels/collectibleTypes.js` |

## Physics Notes
- Thruster: **slow spool-up, instant cut-off** (`enginePower = 0` immediately on key release). Side thrusters: `lander.strafePower` (-1..1), same instant cut.
- World boundaries: per-edge thresholds + actions in `worldBounds` (`ceilingY`/`lateralMargin`/`bottomY` with `pushback`/`destroy`/`lose_cargo`/`monster`/`police`). `bottomY` with `monster` (the default) is the classic sink-too-deep worm strike — it absorbed the old `outOfBounds.monsterDepth`. Separately, lingering ~4s past the warning-vignette margins (±1000 lateral, y < −500, or below terrain) also summons the monster; hard-action edges tighten those margins to the configured edge.
- Moving gravity well: `gravityWellTime` phase + `orbitRadius` from config, exposed as `gravityWellPos`.
- Drone rope: grappleX = `lander.x - sin(angle) * (ropeLength + height/2)` — swings OPPOSITE to tilt.
- Monster speed: base 0.25 + `speedIntegral * 0.55` (integral builds when the lander escapes).
- Parachute: fuel at 0 while airborne → `chuteTimer` deploys after ~1s; vx drag + vy capped toward ~2.2 (survivable-ish impact by design).
- Shield: `applyDamage()` (`physics/entities.js`) is the single entry point for all hit sources; depletable `shieldCharge` mitigates 65% per hit; `shieldAbsorbedThisHit` protects deck cargo from being flung.
- **On-deck cargo is rigidly clamped**, not friction-simulated: `updateOnDeckStates()` stores a deck-local offset (`box.deckT`/`deckN`) on landing and recomputes world position from the lander transform each frame. Releases only on crash, delivery, or chute pickup. Boxes claim non-overlapping `deckT` slots; a `big` box claims the entire deck.
- `waterBodies` are decorative polygons (`{pts:[...]}`); the actual liquid-physics zone is the level-wide `outOfBounds.surfaceY` mechanic (bounce/buoyancy via `applyWaterBounce()`).
- `hazards[]` branch on `hazard.type` (undefined = `'zone'`):
  - `'zone'` — closed polygon, membership via `pointInPolygon()`, knockback from centroid + `25 * dt` damage tick.
  - `'laser'` — 2-point line with `onMs`/`offMs` duty cycle (+ `warnMs` charging telegraph); `distToSegment()` vs. beam `thickness` (default 14px) while active; perpendicular knockback; `damagePerSec` (default 40). Destroys cargo boxes too (`box.lost`).
  - `'incinerator'` — polygon zone with the laser's charge→active duty cycle; damages the lander and instantly destroys cargo inside.
  - Plus `crusher`, `pickup`, sandworm-related types — grep `hazard.type` in `physics/atmosphere.js`.
- **Cargo removal must go through `removeCargoBox()`** (`game/cargo.js`), never a raw `boxes.splice()` — splicing alone leaves the Matter body simulating invisibly forever and can leave `grabbedBoxId` pointing at a deleted box, silently blocking re-grabs.

## Rendering Notes
- Side-thruster gradient must be anchored at the flame's x position (`flameX`), NOT at 0.
- Menu background mock lander needs all fields: `deckWidth`, `deckOffset`, `basketHeight`, `fuel`, `strafePower`.
- `shadeColor(hex, amount)` helper lives at the bottom of `render.js`.
- Terrain + background gradient use the level palette; sky gradient is cached and only rebuilt when size/palette changes.
- Grass tufts (L1): x positions snapped to 10px grid to prevent camera-jitter shimmer.
- Underground easter eggs (`drawUnderground` in `render/terrain.js`): L4 has blinking server racks below the surface, L5 has pulsing crystal formations — visible through cave gaps.
- Buildings: only `antenna`/`silo`/`refinery` types have draw branches in `drawBuildings()` — an unknown type renders nothing, silently.
- Post-FX (`renderPostFX` in `shaders.js`): full-scene texture sample, so world-space text labels get distorted by heat haze — re-check label readability when enabling `heatHaze` on a new level. Max 4 water-shimmer bodies per level (fixed-size uniforms).

## Pilot Rank System
"Mastered" = highscore ≥ 5000 on a level. Progress = 55% upgrades owned + 45% levels mastered. Tiers: F → E → D → C → B → A → S.

## Security: `.claude/` must never be committed
The `.claude/` folder contains machine-specific absolute paths and local
settings. It's in `.gitignore` — keep it that way.
