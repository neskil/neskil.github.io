# CargoLander — Supply Chain Physics

A browser-based 2D "lunar lander"–style game with a logistics theme. You pilot a
lander/drone, pick up cargo at a collection point, and deliver it to color-coded
delivery hubs without crashing, running out of fuel, blowing your budget, or
running out the mission clock. Money earned persists between sessions and can be
spent on upgrades.

The game is **pure client-side**: plain HTML + CSS + vanilla JavaScript with a
custom 2D physics engine, a Canvas2D renderer, an optional WebGL particle/monster
overlay, and a Web Audio synth. There is no build step and no dependencies — just
open `index.html` in a browser (ideally via a local web server so the `<script>`
files load cleanly).

---

## Files in this folder

| File | Role |
|------|------|
| `index.html` | Page shell: all DOM/UI (menus, HUD, overlays, mobile controls), all CSS, and the bootstrap script. Loads the Matter.js CDN script plus all the project's `<script>` files in order (see [Load order matters](#load-order-matters)). |
| `audio.js` | `CargoAudioController` — a Web Audio API synthesizer. Generates all sound *procedurally* (no audio files): thruster rumble, collisions, explosions, warning beeps, success arpeggios, and an ambient music drone. Exposes global `CargoAudio`. |
| `shaders.js` | `ShaderOverlay` — a WebGL layer drawn on the `#webglCanvas` on top of the main canvas. Renders glowing particles (point sprites) and the procedural "out-of-bounds monster" (a raymarched noisy blob in a fragment shader). Falls back to Canvas2D in `game.js` if WebGL is unavailable. |
| `physics.js` + `physics/{collision,mechanics,entities,atmosphere}.js` | `CargoPhysics` — the custom physics engine, built on Matter.js for collision (lander body, box bodies, terrain bodies). Terrain generation, lander integration & collision, cargo-box physics (terrain / deck / box-to-box), the drone winch constraint, magnetic deck, gravity wells, hazards (lasers, incinerator zones, crushers, etc.), particles, ambient traffic, and the chasing monster. No rendering here. |
| `game.js` | `CargoGame` — the orchestrator. The `requestAnimationFrame` loop, input handling, camera, economy/progression (localStorage), HUD/mission-panel DOM updates, cargo delivery/loss handling, win/lose flow, and the dynamic mission-grid/Dev-panel generation (`generateMissionUI()` — loops over `levels[]`, no per-level manual button wiring needed). Exposes global `game`. Level & upgrade *definitions* live in `level1.js`–`level9.js`/`levels.js`, not here; all Canvas2D rendering lives in `render.js` + `render/*.js`, not here either. |
| `render.js` + `render/{background,terrain,entities,effects,ui}.js` | All Canvas2D rendering (terrain, lander, boxes, hubs, hazards, minimap, monster fallback, menu background, HUD-adjacent canvas overlays), split out of `game.js`. Loaded after `game.js`; methods are mixed onto `CargoGame.prototype` via `Object.assign`, so they read `this.physics`/`this.camera`/etc. same as if they were still in `game.js`. |
| `level-editor.html` | **Level Editor** — standalone browser tool for visually editing levels. See [Level Editor](#level-editor) below. |
| `levelSchema.js` | Shared schema for the scalar/object-shaped fields of a `registerLevel({...})` config (mission params, `palette`, `outOfBounds`, `gravityWell`) — field name, type, default, and a UI widget hint. Read by both `level-editor.html` (drives the Metadata/Palette/Out of Bounds/Gravity Well form panels, the loader's defaults, and the export-block generator) and `tests.html` (drives the scalar-field checks in "Level Config Validation"), so a new scalar field is added in one place instead of three. Geometry (`terrainPolygons`/`waterBodies`/`hazards`) is explicitly out of scope — see the Level Editor section below. |
| `level1.js` – `level9.js`, `levelTest.js` | Individual level configs — registered via `registerLevel()` from `levels.js`. Each defines terrain polygons, hubs, OOB zone, palette, physics, and quests. `levelTest.js` is a sandbox level reachable via `game.startTestLevel()`. Adding a new level file still needs its `<script>` tag added to `index.html` manually — but the mission-grid button and Dev-panel jump button are both auto-generated from `levels[]` by `generateMissionUI()`, no manual wiring needed for those two. |
| `levels.js` | `registerLevel()` dispatcher + upgrade catalog + quest helper functions (`questPrimary`, `questNoCrash`, etc.). |
| `levelGenerator.js` | `generateProceduralLevel(craziness)` — procedural "Mission ??" maps with 3 selectable craziness tiers (the `random1`/`random2`/`random3` buttons in the mission grid). |
| `tests.html` | Browser-based test suite (88 tests as of 2026-07-10: 7 behavioral smoke tests — engine init, level loading, update loop, input simulation, restart cleanup, game-over flow — plus a "Level Config Validation" category with cheap shape checks over every registered level's mission params/hubs/palette/out-of-bounds/gravity-well/terrain/hazards/quests (the scalar/object sections now schema-driven off `levelSchema.js`), plus an upgrade-catalog check). Open via a local static server; results post to `#summary` and failures log full stacks to `console.error`. |
| `probe-screenshot.html` | Headless-Chrome visual-verification harness (added 2026-07-10) — loads the game in an iframe and drives it via query string: `?level=N&x=..&y=..&zoom=..` (park the free camera), `&debug=1` (dump element/computed-style diagnostics on screen), `&hide=fn1,fn2` (no-op draw calls to bisect a visual), `&script=name` (scripted repros, e.g. `eatenByMonster`/`noCargoExtract`). See "Headless verification" under Verification, and `CLAUDE.md`, for the full recipe and why it exists. Not part of the shipped game — safe to delete if headless verification stops being needed, but has already caught one bug (the minimap CSS collapse) that reading the code alone missed. |

### Load order matters
`index.html` loads the Matter.js CDN script, then `levels.js → levelGenerator.js →
level1.js…level9.js → levelTest.js → audio.js → shaders.js → physics.js → game.js`, then calls
`game.init('cargoCanvas')`. `game` depends on `CargoPhysics`, `ShaderOverlay`,
`CargoAudio`, and all level configs being registered first.

### How the pieces talk
- `game.update()` builds an `inputState` object from `game.keys`/mouse and calls
  `physics.update(dt, levelConfig, inputState)`.
- `physics` mutates `lander`, `boxes`, `particles`, `monster`.
- `game.draw()` reads physics state and renders it; particles + monster are handed
  to `shaders.render(physics, camera)` (or drawn on Canvas2D as a fallback).
- Both `game` and `physics` call into global `CargoAudio` for SFX.

### Key concepts
- **Vehicles**: `basic` (upright arcade), `advanced` (mouse-aimed full rotation,
  removed from UI but still functions in physics code), `drone` (auto-hover +
  extendable winch for the "Needle's Eye" level).
- **Cargo types**: `normal`, `red`, `blue`, `green` — must be delivered to a hub of
  the matching `type`. `tethered` boxes are special-cased — only `drone` can grapple
  them (see `toggleGrapple()` in game.js).
- **Hub types**: usually mirror a cargo type, but `'chute'` hubs accept *any* cargo
  type without requiring a landing (the box is vacuum-pulled in once it drifts into
  the opening — see the Vacuum Chute logic in `checkCargoDelivery()` and `update()`
  in physics.js).
- **Economy**: `globalCash` + `upgrades` persist in `localStorage`
  (`cargoLanderCash`, `cargoLanderUpgrades`). `missionBudget` is per-mission.
- **dt**: the loop normalizes delta time to 60 fps (`dt = elapsedMs / 16.666`), so
  most physics constants are "per 60fps-frame".


## Level Editor

`level-editor.html` is a self-contained, browser-based tool for visually editing the `terrainPolygons`, `waterBodies`, and `hazards` arrays in level files — all three are polygons (`{pts:[{x,y},...]}`) and are edited with the exact same vertex tools, just switched via the **Terrain / Water / Hazard** tabs in the sidebar. Serve the `cargo-lander/` folder with any static web server (e.g. `python -m http.server 8001`) and open `http://localhost:8001/level-editor.html`.

### Features
- **Schema-driven Metadata / Palette / Out of Bounds / Gravity Well panels** (added 2026-07-10) — the sidebar form controls for these four scalar/object-shaped config sections are generated from `levelSchema.js` (field name/type/default/widget), and the loader's per-field defaults + the export-block generator both read the same schema, instead of three separate hand-coded lists that had to be kept in sync by hand. Adding a new scalar mission-param field (or a new palette/OOB/gravity-well sub-field) only requires a new entry in `levelSchema.js` — see that file's header comment. Geometry (`terrainPolygons`/`waterBodies`/`hazards`) is NOT schema-driven — see the TODO entry below for why.
- **Level file dropdown** — loads any of `level1.js` – `level9.js` + `levelTest.js` directly from the server via `fetch()`. Parses the full `registerLevel({...})` config using a sandboxed `new Function()` eval, extracting polygons, palette, OOB zone, hubs, gravity well, and spawn markers — no manual copying needed.
- **Terrain / Water / Hazard tabs** — `+ Shape` adds a new polygon to whichever tab is active; clicking any existing shape on canvas auto-switches to its tab. Legacy `waterBodies: [{x,width,hasBoat}]` / `hazards: [{x,y,radius,type}]` configs are auto-converted to polygons on load (a basin rect / an 8-sided approximation of the circle) so older level files still open cleanly.
- **Palette-based rendering** — sky gradient uses each level's `skyTop/skyMid/skyBot` palette; terrain polygons are filled with `terrainFill` and outlined with `rockEdge` glow, matching the in-game biome appearance. Water/hazard polygons use fixed blue/red coloring.
- **Out-of-bounds zone** — `outOfBounds.surfaceY` is drawn as a colored fill below the surface line, with a mist gradient fade above it and a labeled dashed line. A red `monsterDepth` line marks the monster trigger depth.
- **Hub pads** — each delivery hub shown as a labeled width-bar at the top of the screen and a vertical guide line, colored to match `hub.color`.
- **Gravity well** — pull-radius ring with radial glow fill plus the orbit radius ring (dashed).
- **Spawn markers** — HQ (`startX`) and cargo depot (`collectionX`) shown as a labeled width-bar (matching the real in-game pad width) plus a dashed vertical line with a diamond/triangle marker.
- **Shape list sidebar** — click to select, eye icon to hide/show, rename field for comments, per-point x/y inputs. Shows whichever layer's tab is active.
- **Snap controls** — dedicated buttons for 1 / 10 / 50 / 100 world-unit snapping; hold Shift for ×5 multiplier.
- **Export** — live-updating `terrainPolygons: [...]` / `waterBodies: [...]` / `hazards: [...]` blocks with comments; one-click Copy button.
- **Paste fallback** — also accepts pasted JS if the server isn't running.

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
4. When done, copy the export block and paste it over the `terrainPolygons:` array in the level `.js` file.

---

## Verification
Standard protocol for any code change: `node --check <file>.js` on every modified
JS file (if Node isn't installed in the environment, skip this — loading the
page and reading the console is the fallback), then load the game in a
browser via a local static server (no console errors), then run the
`tests.html` smoke suite (all green).

### Headless verification (no interactive browser needed)
When no interactive browser pane is available, headless Chrome does the whole
job (added 2026-07-10; Chrome lives at
`C:\Program Files\Google\Chrome\Application\chrome.exe` on this machine).
With a static server running on port 8177:
- **Test suite**: `chrome --headless=new --disable-gpu --user-data-dir=%TEMP%\chrome-test
  --virtual-time-budget=15000 --dump-dom http://localhost:8177/tests.html`
  and grep the dump for `id="summary"` — it contains the
  "N passed / 0 failed" line (N grows over time as tests are added; 88 as of
  2026-07-10). (`--virtual-time-budget` fast-forwards
  timers, so the async test run completes before the dump.)
- **Visual checks**: `probe-screenshot.html` (in this folder) loads the game
  in an iframe, starts a level, and parks the free camera at a query-string
  position: `probe-screenshot.html?level=8&x=1500&y=750&zoom=0.8`
  (level = 0-based index into `levels[]`). Screenshot it with
  `--window-size=1280,800 --virtual-time-budget=8000 --screenshot=out.png <url>`.
  The probe also stamps the post-FX shader's link status bottom-left
  ("postFX link: true" in green / the info log in red), since headless
  screenshots give no console access and a failed shader compile is
  otherwise silent (the pass just draws nothing).

### Mobile / responsive manual QA
There's no automated mobile testing — `tests.html` runs headless with a fixed
1280×720 canvas mock and never touches real CSS layout or `window.innerWidth`.
Viewport/orientation-dependent behavior (mobile touch controls, the
`@media` breakpoints in `index.html`, the rotate-to-landscape tip — see
`game.js`'s `checkOrientationPrompt()`) has to be checked by hand:
1. Resize the browser viewport (a browser devtools device-emulation panel, or
   the `preview_resize` tool if driving this through an agent) to a phone
   portrait size (e.g. 375×812) and a phone landscape size (e.g. 812×375).
   `checkOrientationPrompt()` gates on aspect ratio + `min(width,height) <=
   820`, not touch-capability detection, specifically so it's exercisable
   this way without a real touch device.
2. At phone-portrait size, start any mission — the rotate-tip
   (`#rotate-tip`) should appear (non-blocking; "Continue in Portrait"
   dismisses it for that mission attempt). It should NOT appear on the main
   menu (menu's own responsive CSS handles narrow layouts already) and
   should disappear immediately on resize to landscape.
3. At phone-landscape size, confirm the mission HUD (mission panel, radar,
   mobile touch controls) doesn't overlap or clip — this is what the
   `@media (max-width: 480px)`/`768px`/`1024px` rules in `index.html` are
   for; if something looks wrong, that's where to look.
4. Check `game.postFXEnabled` (Settings → Visual Effects toggle) still works
   at small viewports — the post-processing pass reads `window.innerWidth`/
   `Height` indirectly via `this.canvas.width/height`, so it should adapt
   automatically, but toggle it off/on once to confirm no visual glitch.

---
## TODO / Future Work (updated 2026-07-10)

Most of the 2026-07-05 list below turned out to already be done by the time of
the 2026-07-10 pass (confirmed by grepping the actual code, not just re-reading
old notes) — struck through and kept as a paper trail. Fresh items are at the
top.

- [x] **Level Editor / renderer parity system** (user request, 2026-07-10) —
      **scalar-field half done 2026-07-10 (later); geometry half explicitly
      deferred, see below.** Previously `level-editor.html` had its own
      hand-written parser + exporter for `registerLevel({...})` configs,
      maintained by hand in lockstep with whatever fields
      `level*.js`/`physics.js`/`render/*.js` actually use — every new field
      required updating the editor's parser, its UI, *and* its export-block
      generator, or the editor would silently drop/fail-to-preview it (this
      had already happened at least once: `heatHaze` had no UI at all and was
      silently dropped on export; the palette panel only exposed 5 of the 7
      `palette` keys, so `rockGlow`/`fog` round-tripped but were never
      editable).
      - Added `levelSchema.js` — a single schema (field name, type, default,
        UI widget hint) for the level-config's scalar/object-shaped fields:
        mission params (name/missionTitle/description/hint/gravity/wind/
        weather/budget/timeLimit/padScale/targetCargo/allowedTypes/
        heavyCargo/heatHaze/startX/startY/collectionX/collectionY/
        startDepotWidth/collectionWidth), `palette`, `outOfBounds`, and
        `gravityWell`.
      - `level-editor.html`'s Metadata / Palette / Out of Bounds / Gravity
        Well sidebar panels are now generated from this schema instead of
        static per-field HTML; the loader's defaults and the export-block
        generator read the same schema too. Fixed the `heatHaze` and
        `rockGlow`/`fog` gaps above as a side effect of no longer hand-coding
        the field list.
      - `tests.html`'s "Level Config Validation" category now runs the
        scalar/object checks (mission params, palette, out-of-bounds, gravity
        well) generically off `LEVEL_SCHEMA` via a shared
        `schemaCheckSection()` helper, instead of one hand-written assertion
        block per field — added dedicated out-of-bounds and gravity-well test
        cases per level that didn't exist before (previously only checked
        indirectly through render code, never asserted). Test count went from
        68 to 88 as a result (20 new: 2 per level × 10 levels).
      - Verified via headless Chrome: 88/88 tests green, and the editor's
        load→edit→export round trip checked against 3 different levels (L1 —
        water bodies + weather; L4 — gravityWell + heatHaze + incinerator
        hazard; L8 — gravityWell + heavyCargo + segments) by diffing the
        exported `registerLevel({...})` block against the source file (see
        `level-editor.html`'s new `?autoload=levelN.js&dumpExport=1` query
        params, added for exactly this headless-verification purpose,
        mirroring `probe-screenshot.html`'s existing pattern).
      - **Explicitly deferred**: `terrainPolygons`/`waterBodies`/`hazards`
        stay hand-coded — the editor's vertex-drag tooling is bespoke per
        shape *kind* (zone/laser/crusher/sandworm/repulsor/bouncer/etc.), not
        purely data-driven, and folding that into the same schema is a
        materially bigger job than the scalar-field pass above. Whoever picks
        this up next should treat it as a separate task, not an extension of
        this one.
      - **Known pre-existing gap, not touched by this pass**: L9's
        `outOfBounds: true` boolean shorthand (vs. every other level's object
        form) isn't understood by the editor's loader/exporter — it loads as
        an empty default-filled zone and exports as a full object instead of
        preserving the boolean. `levelSchema.js` documents this exception
        (`levelSchemaIsOOBObject()`) but doesn't fix the editor's handling of
        it; L9 already relies on `setupPhysics()` instead of static
        `deliveryHubs` too, so it was excluded from the round-trip
        verification levels above for the same reason (it's a fundamentally
        different, more bespoke level than the other 8).
      - Out of scope, unchanged: keeping `index.html`'s `<script>` tags in
        sync when a new `levelN.js` is added — that's a separate,
        already-known manual step (see `CLAUDE.md`).
- [x] ~~More thruster/flight particle effects + a "hotter" lander design~~ —
      done 2026-07-10 (see Recent Additions). Exhaust smoke added alongside
      the existing spark shower, a new falling-fast RCS stabilizer puff
      effect gives descent a visual signature it previously lacked entirely,
      and the hull got a racing-stripe + gloss-highlight paint pass.
- [x] ~~Parachute-on-empty-fuel mechanic~~ — done 2026-07-10 (see Recent
      Additions). `lander.chuteDeployed`, deploy timer, velocity cap, and
      canopy visual all implemented and verified via a synchronous
      multi-frame simulation (headless screenshot's virtual-time-budget
      doesn't reliably tick `requestAnimationFrame`, so real-time playtest
      is still worth doing to confirm it *feels* right, even though the
      mechanics are confirmed correct).
- [x] Raindrop-on-lens effect — reworked to v3 2026-07-10 (see Recent
      Additions) using a real rain-on-a-car-window reference photo: added
      the specular glint and trickle trail that were the actual missing
      ingredients (v1/v2 were both round-bead displacement with no
      highlight), and thinned/shrunk everything further per explicit
      feedback that it needed to be "way more subtle". **Re-confirmed
      2026-07-10 (fresh session):** code-reviewed the `droplet()` sparsity
      gate (`h3 > 0.02 continue` — ~2% of grid cells spawn a drop per
      cycle) and the `u_rainAmount` refraction/glow weighting
      (`bodyHit*0.02 + glintHit*0.15`, both tiny), then spot-checked L1 in
      a live browser session — no longer struck-through-with-doubt, this is
      confidently done. Only fires when `activeWeather === 'rain'`.
- [x] **Level-start hitch** (user question, 2026-07-10, answered but not
      fixed) — `physics.js`'s `initLevel()` synchronously rebuilds the
      entire Matter.js engine/world from scratch (`_buildMatterWorld()`),
      regenerates all terrain collision bodies (`generateTerrain()`, convex
      decomposition of every terrain polygon), spawns the lander, runs the
      level's `setupPhysics()` callback, and pre-spawns 1-2 ambient traffic
      vehicles — all in one synchronous call from `startLevel()`. That's the
      likely source of the brief hitch right as a mission starts (a single
      slow/GC-heavy frame that resolves itself immediately after). Not
      fixed — would need either spreading the work across a couple of
      frames (harder, touches the load-order assumptions the rest of the
      code makes about a fully-initialized level) or profiling to confirm
      which specific sub-step actually dominates before optimizing the
      wrong thing.

- [x] **Post-FX shader follow-ups** (added 2026-07-10, see the Recent
      Additions entry below for the full feature) — `heatHaze` is currently
      only set on L2/L4; consider L6 (Amber Dusk/Sand Worm, also a hot biome)
      or others. (The original "haze garbles text" scare turned out to be
      the Y-flip bug fixed in v0.3.0, not wobble amplitude — but world-space
      labels do still get wobbled by the haze, so if it's extended to more
      levels, re-check the "PICK UP"/"DELIVER HERE" labels stay readable on
      each one; camera zoom affects how noticeable the distortion is.) Also: `renderPostFX()` only supports up to 4 water
      bodies per level (`u_waterMin`/`u_waterMax` are fixed-size uniform
      arrays) — fine for every level so far, but would silently ignore a 5th
      body if one's ever added; bump the array size + the `Math.min(4, ...)`
      clamp in `render.js` together if that's ever needed.
- [x] **Level Editor: no UI for the `incinerator` hazard type** (added
      2026-07-10, see the Recent Additions entry below) — `level-editor.html`'s
      hazard-tab type dropdown only offers `zone` / `laser` / `crusher` /
      `pickup` / etc. (grep `val === 'laser'` around line 1460 for the branch
      to extend). `incinerator` is polygon-based like `zone` (3+ pts, no fixed
      point count) but needs the same `onMs`/`offMs`/`warnMs` timing fields
      the laser branch already shows/hides (line ~1379) — copy that pattern
      rather than inventing a new one.
- [x] **Expand `incinerator` hazard to other levels** — currently only used
      once, in L4 (`level4.js`, lava vent field on the eastern ridge). It's a
      generic engine feature (`physics/atmosphere.js`, grep `'incinerator'`)
      that could fit L5 (Crystal Caverns, acid theme), L7 (Bioluminescent
      Depths, already has `goo`), or a brand new level built around it as the
      core mechanic — a cargo-run where the player has to time crossings
      between burn cycles. Validate any new placement against
      `tests.html`'s "Level Config Validation" category (it checks hazard
      point counts/timing automatically) before playtesting.
- [x] **`level4.js` still has stale flavor text elsewhere?** — worth a
      full re-read of every level's `description`/`hint` against its actual
      `deliveryHubs`/`allowedTypes`, since the Sector-4/Deep-Storage mismatch
      fixed 2026-07-10 was found by accident, not a systematic pass.
- [x] ~~Delete `scratch_patch.py`~~ — already gone; not present in the repo.
- [x] ~~Generate the mission grid + Dev-panel jump buttons from `levels[]`~~ —
      already done (`game.js` `generateMissionUI()`, runs `levels.forEach(...)`
      building both the `#mission-grid` buttons and the `#dev-panel .dev-row`
      buttons — no per-level manual wiring needed anymore beyond the
      `<script>` tag in `index.html`).
- [x] ~~Split `game.js` into `render.js`~~ — already done; `render.js` +
      `render/{background,terrain,entities,effects,ui}.js` exist and are
      loaded after `game.js` in `index.html`. `physics.js` was similarly split
      into `physics/{collision,mechanics,entities,atmosphere}.js`.
- [x] Rebuild the regression test suite — done 2026-07-10. `tests.html` now
      has 68 tests: the original 7 behavioral smoke tests (which were
      actually silently failing 6/7 — the DOM stub was missing
      `appendChild`/`dataset` that newer DOM-based UI code needs, now fixed)
      plus a new "Level Config Validation" category with cheap shape checks
      per level (mission params, hubs, palette, terrain, hazards, quests) and
      one upgrade-catalog check.
- [x] Cargo-box laser collision — done 2026-07-10. Turned out the *physics*
      side (`physics/atmosphere.js`) already flagged hit boxes with
      `box.lost = true`, but nothing ever spliced them out of
      `physics.boxes` or freed the Matter body — `game.js`'s cargo-cleanup
      pass (`processDeliveries`/similar, grep `box.lost`) now finishes the
      job through the existing `removeCargoBox()` helper.
- [x] ~~`music1.mp3` is 6 MB~~ — already re-encoded to 2.3 MB.
- [x] ~~`'advanced'` vehicle dead code~~ — already fully removed from
      `physics/entities.js`'s `applyControls()`, not just the UI. Only
      `'basic'` and `'drone'` remain (grep `vehicleType ===` to confirm).
- [ ] Remaining user-feedback items in the backlog at the bottom of this file
      (editor playtest/download/upload workflow, intro camera animation,
      predefined background buildings, pad-oval removal, dropoff light,
      cargo-attach UX, mobile radar collapse).
- [x] ~~Delete unused sprite PNGs~~ — the whole `assets/` directory referenced
      by the old 2D Sprites Mode no longer exists in the repo.

---

## Continuing this project (environment + handoff notes, 2026-07-10)

### Session status (2026-07-10, resolved)
All committed and pushed as of `v0.3.0`. The "flat blue rectangle" saga is
closed — it took **three** diagnoses to get right, kept here as a paper
trail because each wrong guess was plausible:
1. First guess: `drawFluidBounds()` abyss boundary (a real feature) — wrong.
2. Second guess: `drawWaterBodies()` ignoring `body.surfaceColor`, making
   L9's acid pool draw blue — a *real bug* (fixed in `v0.2.1`, and L9's
   pool is confirmed green now), but **not** what the user screenshotted:
   their rectangle was on L1, whose lake doesn't set `surfaceColor` at all.
3. Actual root cause (fixed in `v0.3.0`): the post-FX shader
   (`renderPostFX`, `shaders.js`) sampled the scene texture with an
   inverted Y (`srcUV.y = 1.0 - srcUV.y` on top of an upload that already
   has the canvas top row at v=0). Every effect region therefore drew a
   **vertically mirrored copy of the scene** — the lake's screen-space
   bounding box (the water-shimmer region is a bbox, not the polygon)
   filled with upside-down *sky*, which reads as a flat blue rectangle
   with faint stars/rain inside it. Same bug mirrored the "PICK UP" /
   "CARGO DEPOT" labels on heat-haze levels — earlier misread as the haze
   "garbling" text, which prompted an unnecessary amplitude nerf (partially
   restored now: 1.2/0.6). The user's "the image is also upside down"
   comment was the giveaway, initially misattributed to the lander
   physically flipping.
   Verified fixed via headless-Chrome screenshots (see the new
   "Headless verification" part of the Verification section): L1 lake
   hugs its polygon with the boat/fish right-side up, L4 labels read
   correctly, 68/68 tests green.

### Local environment
- **Python is now installed** (`winget install Python.Python.3.12`, done
  2026-07-10) — a fresh terminal can serve this folder with
  `python -m http.server 8001` from inside `cargo-lander/`, then open
  `http://localhost:8001/index.html`. (A terminal open *before* the install
  won't see `python` on PATH until it's restarted.)
- If Python isn't on PATH for some reason, there's also a zero-dependency
  fallback: `.claude/static-server.ps1` (gitignored, machine-local) — a plain
  PowerShell `HttpListener` static file server, started via
  `.claude/launch.json`'s `cargo-lander` config. Works without installing
  anything, just slower to iterate on than the Python server since it's
  reading files off disk on every request.
- Node/npm are **not** installed in this environment, so there's no
  `node --check` for a quick JS syntax lint — rely on loading the page in a
  browser (console errors are immediate and specific) and the `tests.html`
  suite instead.

### Verification workflow (per this project's `CLAUDE.md`)
1. Load `index.html` via a local server — check the browser console for
   errors on the menu screen and after starting a mission.
2. Open `tests.html` — should read "88 passed / 0 failed" (as of 2026-07-10;
   the number grows as more validation tests get added, that's fine, 0 failed
   is the bar). It auto-runs on load; no button to click.
3. For anything touching a specific mechanic, exercise it directly in the
   browser console against the live `game`/`game.physics` objects rather than
   trusting a code read — e.g. for a hazard: `game.startLevel(N)`, mutate
   `game.physics.lander.x/y` **and** call
   `Matter.Body.setPosition(game.physics.landerBody, {x, y})` together (the
   physics body and the plain-object mirror both need updating — moving only
   one desyncs them and causes bogus collision damage on the next physics
   tick, which looks exactly like a real crash bug but isn't one), then drive
   `game.update(1.0)` in a loop (dt≈1.0 is one real frame at 60fps — passing
   dt=16 like the "Update Loop Simulation" test does is 16 frames per call
   and will make anything time-based blow up 16x if you're eyeballing the
   numbers).
4. Commit + push once verified, per this repo's standing instruction — don't
   wait to be asked.

### What's next (see the TODO list above for the full detail on each)
Picking off the TODO list roughly in order of "self-contained, low risk of
needing broader context":
1. **Level Editor support for `incinerator` hazards** — the type dropdown and
   point-count/timing-field logic in `level-editor.html` only knows about
   `laser` today; `incinerator` needs the same treatment (it's simpler than
   laser since it's a normal 3+-point polygon, not a fixed 2-point line — the
   *timing* fields are what need copying over).
2. **Use the `incinerator` hazard in more levels** — it's currently only in
   L4. Good candidates: L5 (Crystal Caverns, already acid-themed) or a new
   level built around it as the signature mechanic (timed burn-cycle cargo
   run). Whatever you add, `tests.html`'s validation category will catch
   malformed hazard configs automatically on next load — no need to
   hand-verify point counts.
3. **Full description/hint audit** — the L4 fix (description referenced a
   "Deep Storage" hub and blue cargo type that don't exist in the actual
   config) was found by accident while working on something else. Worth a
   deliberate pass reading every level's `description`/`hint` string next to
   its `deliveryHubs`/`allowedTypes` to catch any other drift.
4. The longer-tail user-feedback backlog at the very bottom of this file
   (editor playtest/download/upload workflow, predefined background
   buildings, pad-oval removal, dropoff light, cargo-attach UX, mobile radar
   collapse) — none of these are started; pick whichever the user asks for
   next rather than guessing priority.

---

### Mobile scaling & controls
- **Mobile Viewport Scaling** — Uniform CSS `transform: scale()` automatically adjusts the fixed 1280x720 layout to fit the screen dimensions on mobile and desktop devices.
- **Cargo Spawning Delays** — Balanced risk/reward spawning; waiting on a loading pad now triggers escalating delays (`55 + cycle * 30`) for subsequent boxes.
- **Shield Generator Upgrade** — Added a defensive `shieldRegen` upgrade that slowly recovers hull integrity over time.
- **Visual Shield Bubble** — Renders a pulsing blue energy field around the vehicle body when the shield generator is active and hull is above 20%.
- **CI Test Error Logging** — Test runner (`tests.html`) prints detailed call stacks of failing tests directly to `console.error` for automated headless ingestion.

### Biome worlds
- **5 distinct biomes** — each level has its own alien environment: L1 Grasslands (lush green), L2 Desert Wastes (amber sand), L3 Arctic Expanse (ice blue), L4 Volcanic Zone (orange-red lava rock), L5 Crystal Caverns (deep purple).
- **Terrain edge noise** — deterministic ±4 px jitter every 3 px on the terrain surface edge (no discrete boulders) — organic and fast.
- **Ground parallax** — two darker terrain silhouette layers shifted 28 px and 60 px below the real surface, creating depth.
- **Lake on L1/L2** — animated water body with shimmering surface, 4 swimming fish, and a bobbing fishing boat.

### Underground easter eggs
- **L4 data center** — a blinking server rack cluster with status lights and fibre cables lives just below the volcanic terrain surface, visible through cave gaps.
- **L5 crystal formations** — pulsing purple crystal stalagmites pulse beneath the cave floor.

### Visual & atmosphere
- **Wind streaks (2026-07-05)** — when `physics.currentWind` exceeds 0.05, streak particles spawn from the upwind screen edge; density scales with wind strength and color shifts blue→white; regular weather particles also drift with the wind.
- **Parallax background mountains** — 3 silhouette layers drawn in screen space.
- **Ambient space-truck traffic** — NPC ships fly both directions; 30% chance to tilt and rocket off into space.
- **Decorative surface buildings** — antenna towers, silos, and refineries.

### Lander & physics
- **Redesigned space truck** — clearer flatbed cargo deck with ribbing, side rails, and a glowing deck line; thruster nozzles glow amber when firing; legs extend from the body bottom.
- **Bounce offset on landing** — the vehicle body lifts up to 10 px on touchdown and settles back, so the spring effect is visible without legs clipping underground.
- **Instant thruster cut-off** — engine power drops to zero immediately on key release; only spool-up is gradual.
- **Fly upward = out-of-bounds** — `y < −600` triggers the OOB monster warning.
- **Moving gravity well** — the L4 anomaly orbits its base position with a Lissajous-like phase.
- **Heavy Arcade Flight** — `LANDER_THRUST`, `LANDER_DRAG`, and `gravity` were tweaked to give the ship more weight and inertia, slowing down overall gameplay.
- **Persistent Wreckage** — A destroyed lander no longer instantly despawns. The physics engine tracks the wrecked hull to the ground, drawing it charred with flickering fire and smoke. The game over screen delay was increased to 3 seconds to let you watch the crash.

### Cargo boxes
- **Bigger boxes** — `BOX_SIZE` 20 → 28 px; emoji rendered at 15 px font.
- **Type icons** — 📦 standard, ⚠️ hazmat (red), ❄️ cold-chain (blue), ♻️ eco (green); 7 px type-label below emoji as a fallback.
- **Fixed 2026-07-01: cargo flying off the deck during normal flight** — the old
  on-deck physics relied on per-frame friction (`resolveBoxLanderDeckCollisions()`)
  that only corrected the box when it overlapped a narrow collision band; any hard
  strafe/thrust change could push the box out of that band faster than friction
  could react, after which nothing pulled it back and it just drifted away.
  `updateOnDeckStates()` now rigidly clamps a box to a stored deck-local offset
  (`box.deckT`/`box.deckN`) the instant it lands, recomputing its world position
  from the lander's current transform every frame instead of integrating velocity —
  effectively a magnetic clamp. It only releases on crash, delivery, or vacuum-chute
  pickup. Multiple boxes on the same deck claim non-overlapping slots along `deckT`.
- **Delivery hub visual overhaul** — removed the warehouse/door/strobe facade so
  hubs read as a clear, flat landing pad (matching the collection pad's language);
  the crane now actually carries the delivered box from its pickup point to a
  visible pallet stack beside the pad (`hub.palletCount`) instead of an abstract
  animation with no real destination. The old flat pulsing "beacon" rectangle
  (`hub.color` fillRect) was replaced with a soft tapered light-shaft gradient.
- **Big Cargo** (added 2026-07-10) — `spawnCargo(type, x, emoji, y, {big: true})`
  spawns an oversized (`BOX_SIZE * 1.8`), single-load-capacity crate. On a
  basic-lander deck, `updateOnDeckStates()`'s capacity check (`deckHasBig` in
  `physics/entities.js`) means a big box claims the *entire* deck — once one
  is attached, no other box (big or normal) can also attach until it's
  removed, regardless of how many normal boxes would otherwise fit side by
  side. Drone grapple needed no special-casing since `grabbedBoxId` was
  already a single slot. Rendered with a distinct amber/brown treatment in
  `render/entities.js`. Currently used on L9 "The Cauldron"
  (`level9.js`, all 3 heavy crates).

### Damage & threat
- **Damage flash** — hull hit triggers a red vignette + "⚠ HULL DAMAGE" text that fades over ~1 s.
- **Screen shake** — camera jolts on impact, decaying exponentially.
- **Monster spawns on extraction timeout** — if all cargo is delivered but you don't extract in time, the monster spawns instead of instant fail.
- **Faster OOB spawn** — monster appears after ~0.8 s out of bounds.
- **Off-screen radar indicator** — pulsing red arrow + distance readout + two-tone radar ping.

### Navigation & HUD
- **Next-objective arrow** — bouncing ▼ above active PICK UP / DELIVER HERE pad.
- **Collection pad** — sky-blue accent + pulsing glow border.
- **Delivery hubs** — pulse when carrying matching cargo.
- **Mute button** — state correctly synced to actual audio state on startup.

### Difficulty scaling
- **Pad scale by level** — L1 = 1.5×, L2 = 1.2×, L3 = 0.85×, L4 = 0.70×, L5 explicit narrow hub.

### Progression
- **Pilot rank** — upgrade progress (55%) + per-level 5 000+ score mastery (45%).

### Quality
- **Browser test suite** — `tests.html`: behavioral smoke tests (engine init → game over).
- **WebGL null-guard** — `ShaderOverlay` no longer crashes without WebGL.
- **Fuel clamp** — `lander.fuel` clamped ≥ 0 after each thrust tick.
- **Monster radar crash fix** — undefined `lander` variable in draw scope resolved.
- **Mouse steering removed** — Advanced Lander removed from vehicle selector; Basic + Drone only.

---

## Long-Term Vision & Roadmap

The recent fixed-timestep physics overhaul and fluid boundary systems have laid the groundwork for a major expansion of the CargoLander universe. The following milestones represent the long-term vision for the project:

| Milestone | Feature | Description |
|-----------|---------|-------------|
| **Phase 1** | **Massive Scrolling Levels** | Break free from single-screen puzzles. Develop large, multi-screen cave systems and sprawling planetary surfaces requiring fuel management across long distances and waypoint navigation. Include **Refueling Stations** that cost money to use mid-mission! |
| **Phase 1** | **Dynamic Weather Engine** | Evolving wind gusts and storms that actively push the lander, requiring constant thrust adjustment, accompanied by visual weather particles (dust, rain, snow) and **Wind Direction Indicators** (blowing wind animations). |
| **Phase 2** | **Pendulum Mass Physics & Special Cargo** | Heavy cargo crates will actively drag the lander down. Introduce **Special Cargo** that hangs from the lander body by a rope, forcing the player to balance flight carefully to avoid catastrophic destabilization. |
| **Phase 2** | **Oversized "Big Cargo" crates (single-load capacity)** | Added to backlog 2026-07-10. A distinct idea from the pendulum-mass row above: some levels (L9 "The Cauldron" is the natural first fit — it already uses the `'heavy'` cargo type and a drone-only sourcing depot, see `setupPhysics()` in `level9.js`) could feature a deliberately oversized crate that occupies the *entire* deck/grapple capacity, so the lander can only carry one at a time regardless of how many normal-sized boxes it could otherwise fit. Forces single-trip runs as a difficulty/pacing mechanic rather than the usual multi-box shuttle runs. Implementation note: the existing on-deck slot system already claims non-overlapping `deckT` slots per box (`updateOnDeckStates()`, `physics/entities.js`) — a "big" box could simply claim a slot width equal to the whole `deckWidth`, which should naturally block any other box from finding room without needing a new capacity-counting mechanism. |
| **Phase 2** | **Advanced Logistics Mechanics** | Overhaul loading and unloading stations to be more interactive and fun, rather than just hovering over a pad. Full integration of remaining catalog upgrades (Shield Generators, Magnetic Decks) to allow persistent ship builds capable of surviving the harder scrolling maps. |
| **Phase 3** | **Data-Driven Geometry** | Extract procedural terrain formulas out of `physics.js` into external JSON/config files, enabling full 2D overhangs, tunnels, and an in-browser level editor. |
| **Phase 3** | **Procedural Expedition Mode** | A rogue-like mode with procedurally generated maps and infinite delivery challenges. |

---

## IN PROGRESS: Level Editor Expansion + Hazard Types (started 2026-06-30)

Two pieces of active/next-up work, captured here so they aren't lost between sessions:

### 1. `level-editor.html` → full **Level Editor**
- [x] Rename tool/file conceptually to "Level Editor".
- [x] Edit non-polygon fields currently only in `level*.js`: `name`, `missionTitle`,
      `description`, `gravity`, `wind`, `startX`, `padScale`, `targetCargo`, `budget`,
      `timeLimit`, `allowedTypes`, `hint`.
- [x] Edit `deliveryHubs[]` entries beyond just x-position: `color`, `type`, `name` — add/
      remove hubs from the UI (currently hub *pads* are visualized but not fully editable).
- [x] Edit `collectionPoint` / `startDepot` beyond `collectionX`/`startX` — explicit Y
      override, width.
- [x] Edit `outOfBounds` config (surfaceY, colors, drag, buoyancy, monsterDepth) — currently
      only visualized, not editable.
- [x] Edit `gravityWell` config (position, radius, strength, orbit) — currently only
      visualized as rings, not editable.
- [x] Edit `palette` (skyTop/Mid/Bot, terrainFill, rockEdge, rockGlow, fog) with live swatch
      pickers instead of hand-typed hex.
- [x] Edit `quests[]` (primary/noCrash/quick helper calls from `levels.js`).
- [x] Export a **complete** `registerLevel({...})` block, not just the polygon arrays — so
      the editor can round-trip a whole level file, not just its geometry.

### 2. New hazard types — lasers, etc.
Right now `physics.js:757-787` has exactly **one** generic hazard behavior: any polygon in
`hazards[]` does a fixed knockback + `25 * dt` damage tick while the lander's point is
inside it. There's no `hazard.type` branching at all. To add lasers (and other hazard
flavors) cleanly:
- [x] Add `hazard.type` field (`'zone'` = current default behavior, `'laser'` = new).
- [x] **Laser** behavior: defined by two endpoints (`pts: [{x,y},{x,y}]`, a line rather
      than a closed polygon); uses `distToSegment()` (point-to-line-segment distance)
      against the lander each tick instead of `pointInPolygon`; continuous damage while
      the beam is "active", on/off duty-cycle timing (`onMs`/`offMs`, defaults 1500/1000)
      tracked via a running time accumulator, plus a `warnMs` charging flash window right
      before it turns on. Perpendicular knockback pushes the lander away from whichever
      side of the beam it's on. Render as a glowing line in `game.js`'s `drawHazards()`
      (bright pulsing core + soft glow while active, fast-flashing dashed line while
      charging, faint idle guide line otherwise).
- [x] Update `level-editor.html`'s Hazard tab to support the `type` dropdown per shape
      (zone/laser) and switch its point-editing UI between polygon vertices (zone) and a
      fixed 2-point line (laser), including `onMs`/`offMs` fields and round-tripping
      through both the level-file parser and the export-block generator.
- [x] Update this README's "Physics Notes" hazard bullet once implemented.

Cargo-box laser collision was **not** added (lasers currently only affect the lander,
same scope as before) — left as a follow-up since it wasn't a trivial reuse of the
existing per-box loop. Not otherwise started until 2026-06-30 work landed the above.

---

## Key Conventions
- `dt` = `elapsedMs / 16.666` (normalized to 60fps). Most physics constants are per-frame at 60fps.
- Vehicle types: `'basic'` (upright arcade), `'advanced'` (mouse-aimed rotation, removed from UI), `'drone'` (winch)
- `'advanced'` vehicle type still exists in physics code but has been removed from the vehicle selector UI
- `this.lander.deckWidth = 56`, `hw = 28`; width=34, height=22 (reduced from 66/40/28)
- `currentPad` set when speed ≤ 2.0, angle ≤ 8°, proximity check; also used proximity check for cargo dispense
- Level color themes: each level has `palette: { skyTop, skyMid, skyBot, terrainFill, rockEdge, rockGlow, fog }`
- `rockGlow` is a **partial CSS rgba string** like `'rgba(34,197,94,'` — append opacity e.g. `${pal.rockGlow}0.10)`
- `localStorage` keys: `cargoLanderCash`, `cargoLanderUpgrades`, `cargoLanderCareer`, `cargoLanderHighscores`, `cargoLanderPostFX`, `cargoLanderTouchJoystick`
- **Gamepad support** (added 2026-07-10): `game.pollGamepad()` polls `navigator.getGamepads()` each frame and merges into `this.keys['gp_left'/'gp_right'/'gp_up']` — same boolean shape the keyboard path uses. Left stick X = strafe, right trigger (analog) or left stick up = thrust, A = grapple/complete-mission (mirrors the SPACE-key dispatch), B = force-release cargo. No physics changes; `gamepadconnected`/`disconnected` show a toast.
- **Experimental touch joystick** (added 2026-07-10): Settings → "Touch Controls: Joystick" (`cargoLanderTouchJoystick` in localStorage, off by default) swaps the left/thrust mobile buttons for a floating-origin drag stick (`#joystick-zone` in `index.html`, logic in the inline `setupJoystick()`). Feeds `game.keys['joy_left'/'joy_right'/'joy_up']`, same pattern as gamepad — see `applyTouchControlMode()` for the DOM swap.
- `padScale` on level config scales all pad widths: L1=1.5, L2=1.2, L3=0.85, L4=0.70 (L5 has explicit narrow hub)
- `BOX_SIZE = 28` (was 20)
- Biome palette themes: L1=grassland, L2=desert/amber, L3=arctic/ice, L4=volcanic/orange, L5=crystal cave/purple
- Underground easter eggs: L4 has server racks 60px below terrain surface; L5 has crystal formations underground
- `overtimeActive` / `overtimeTimer`: set when missionTimer hits 0 → 15s grace period to reach HQ
- Leg spring: `lander.legCompress` set on landing, decays only while `lander.landed === true`; reset to 0 instantly on liftoff

## Security: `.claude/` Must NEVER Be Committed
The `.claude/` folder contains machine-specific Windows absolute paths. Add to `.gitignore` if missing.

## Code Map — Key Locations
Levels/upgrades live in `level1.js`–`level7.js` and `levels.js` (see file table above),
**not** in `game.js`. Line numbers below are approximate — `game.js` (5300+ lines) and
`physics.js` (1500+ lines) both grow steadily, so re-grep the function name if a line
number is off by more than ~20.

| System | File | Approx. Line |
|---|---|---|
| `startLevel()` — init mission state | game.js | ~594 |
| `loop()` — RAF entry point | game.js | ~967 |
| `update(dt)` — timer, overtime, physics tick | game.js | ~998 |
| `checkCargoDelivery()` — hub/chute matching, abyss loss | game.js | ~1293 |
| `removeCargoBox()` — shared cleanup: clears grapple, removes Matter body, splices array | game.js | ~1364 |
| `updateHUD()` — fuel/hull bars, time display | game.js | ~888 |
| Damage flash overlay (canvas) | game.js | ~1788 |
| `drawMonster()` — segmented creature, arms, mouth | game.js | ~2288 |
| `drawParallax()` — sky gradient | game.js | ~2851 |
| `drawGroundParallax()` — subsurface layers | game.js | ~3327 |
| `drawTerrain()` — fill, edge, grass tufts (L1) / noise (others) | game.js | ~3368 |
| `drawSourcingDepot()` — HQ pad + cargo warehouse | game.js | ~3659 |
| `drawDeliveryHubs()` — receiving warehouse + crane | game.js | ~3864 |
| `drawLander()` — full truck + drone rendering, legs, flames | game.js | ~4206 |
| `drawAmbientTraffic()` + `_drawFreighterTruck()` + `_drawPickupTruck()` | game.js | ~5064–5164 |
| `spawnLander()` — lander initial state | physics.js | ~238 |
| `applyControls()` — drone/basic/advanced input | physics.js | ~770 |
| `applyGravityAndWind()` | physics.js | ~931 |
| `updateMonster()` — spawn trigger + integral-speed AI | physics.js | ~548 |
| Leg spring decay | physics.js | ~1069 |
| `updateAmbientTraffic()` — truck spawn logic | physics.js | ~1428 |
| `resolveBoxLanderDeckCollisions()` / `updateOnDeckStates()` — cargo-on-deck physics | physics.js | ~1260–1305 |

## Physics Notes
- Thruster: **slow spool-up, instant cut-off** (`enginePower = 0` immediately on key release)
- Side thrusters: `lander.strafePower` (-1..1), same instant-cut behaviour
- Out-of-bounds (monster trigger): left/right beyond ±500, **and also upward beyond y < -600**
- Moving gravity well: `gravityWellTime` phase, `orbitRadius` from well config, exposed as `gravityWellPos`
- Leg spring: `lander.legCompress` set on landing (`speed * 0.6`), decays only when `landed===true`
- Ambient traffic: `physics.ambientTraffic[]`, max 5, models: `'freighter'` | `'pickup'`
- Drone rope: grappleX = `lander.x - sin(angle) * (ropeLength + height/2)` — swings OPPOSITE to tilt
- Monster speed: base 0.25 + `speedIntegral * 0.55` (integral builds when lander escapes)
- `waterBodies` are polygons (`{pts:[{x,y},...]}`), edited in level-editor.html the same way as `terrainPolygons` — not rects/circles anymore; they have no physics effect, purely decorative (the actual liquid-physics zone is the separate, level-wide `outOfBounds.surfaceY` mechanic).
- `hazards[]` now branch on `hazard.type` (missing/undefined `type` is treated as `'zone'` for backward compat with older level files):
  - `'zone'` (default) — the original behavior: a closed polygon (`pts: [{x,y},...]`, 3+ points). `physics.pointInPolygon()` tests lander membership; `physics.polygonCentroid()` gives the knockback direction (away from centroid) plus a flat `25 * dt` damage tick.
  - `'laser'` — a line segment (`pts: [{x,y},{x,y}]`, exactly 2 points) with on/off duty-cycle timing (`onMs`/`offMs`, default 1500/1000) tracked via a per-hazard running time accumulator. `physics.distToSegment()` does the point-to-segment distance check (beam `thickness`, default 14px) against the lander only while the beam is "active"; damage is `(h.damagePerSec || 40) * dt / 60` and knockback is perpendicular to the beam, pushed toward whichever side of the line the lander is on. A `warnMs` (default 500) window right before the beam turns on sets `hazard.laserState.charging` so `game.js` can render a telegraph flash; `hazard.laserState.active` gates the actual damage/knockback. Cargo boxes are not affected by lasers yet.

  Both branches live in `physics.js`'s hazard-update block (grep `hazards` — the laser branch runs first, then the zone branch skips anything with `type === 'laser'`).
- **Cargo removal must go through `game.js`'s `removeCargoBox()`**, not a raw `boxes.splice()`.
  Splicing the array alone leaves the box's Matter body in `matterWorld` forever (it keeps
  simulating invisibly — gravity, terrain collision — even though nothing draws it) and leaves
  `lander.grabbedBoxId` pointing at a deleted box, which silently blocks re-grabbing cargo. This
  was the root cause of the "cargo drop-off" bugs fixed 2026-06-30: hub delivery and abyss-loss
  previously spliced directly; only the vacuum-chute path cleaned up properly.

## Rendering Notes
- Side-thruster gradient must be anchored at the flame's x position (`flameX`), NOT at 0
- Menu background mock lander needs all fields: `deckWidth`, `deckOffset`, `basketHeight`, `fuel`, `strafePower`
- `shadeColor(hex, amount)` helper defined in game.js for color tinting
- Terrain drawn with level palette; background gradient also uses level palette
- Grass tufts (L1): x positions snapped to `Math.floor(startX/10)*10` to prevent camera-jitter

## Pilot Rank System
"Mastered" = highscore >= 5000 on that level. Tiers: F -> E -> D -> C -> B -> A -> S

## User Feedback Backlog
*This section tracks all user requests to ensure nothing is missed during iterative development.*
- **Difficulty Spikes:** Levels 1-7 geometries got too messy and hard (e.g. jagged peaks, tight ceilings, lasers too easy to fly over). *Status: Addressed in recent updates.*
- **Sandworm Fix:** Level 6 sandworm spawn was broken due to ceiling stalactites forcing a bad path. *Status: Fixed.*
- **Gravity Well:** Needs to be more chill, pulse (timing based), and have a cool black hole shader so it's clear where it is. *Status: Fixed.*
- **Fuel Economy:** Base fuel too low; must be higher (120). *Status: Fixed.*
- **HQ Refueling:** Needs a refuel station or pad at HQ so you always have at least one refuel spot. *Status: Fixed.*
- **HUD Warnings:** Needs a "LOW FUEL" warning to alert the pilot. *Status: Fixed.*
- **Level Editor Upgrades:** Make it easier to add/remove hazards with a UI button in `level-editor.html`. *Status: Fixed.*
- **Fun Mechanics:** Add other "fun stuff" to the levels to spice them up beyond just geometry (e.g., collectibles, economy popups, new hazards like crushers). *Status: Completed.*
- **Level Editor Workflow:** Make sure the link to the level editor works. Add ability to playtest level within the editor, download as `.js` file, go back to the game from the editor, and upload `.js` file back into the game with instructions. *Status: Completed.*
- **Procedural Generation Mode:** Procedural generation needs 3 selectable "craziness" (difficulty) levels with varying length, cave presence, and hazard frequency/difficulty. *Status: Completed.*
- **Biome Weather Effects:** Make maps visually distinct with weather/atmosphere effects: snow storms for ice (L3), rain for grass (L1), oozing effects for goo/crystal (L5), heatwaves for desert/volcanic (L2/L4). *Status: Completed.*
- **Intro Camera Animation:** Scrapped. The camera now starts instantly centered on the lander at the correct zoom level to keep the start simple and snappy. *Status: Completed.*
- **Level Spaciousness:** The caves and procedurally generated environments feel a bit too cramped, they should be more spacious. *Status: Completed (2026-07-10) — `levelGenerator.js` random-walk step increased (`120-320`→`180-430`) and Y-variance reduced (`150+craziness*100`→`100+craziness*80`) for gentler, more traversable slopes; overhang carve-back also shortened. Verified via procedural "Insane" playtest.*
- **Predefined Buildings:** The background decorative buildings appear too random and look weird on slanting terrain. They should be manually predefined in the level configuration instead of random. *Status: Completed.*
- **Pad Visuals (Ovals):** Remove the dashed oval rings around HQ, pickup, and dropoff pads, but keep the off-screen radar ping effect. *Status: Completed.*
- **Dropoff Feedback:** Add a visual "light" or indicator that turns on when you are at the correct dropoff location. *Status: Completed.*
- **Cargo Animation & UI:** Improve the cargo drop animation (drop on top of basic lander or next to drone). Show "press space to attach" text for the drone and add this button to the mobile view. *Status: Completed.*
- **Mobile UI & Radar:** The radar is too big in landscape mode on mobile. Add the ability to collapse both the mission panel and the radar. *Status: Completed.*
- **UI Uniformity:** Make the HUD/UI more uniform (aligned on the same line, consistent sizing). *Status: Completed (2026-07-10) — mission panel, radar, and toolbar reordered into a consistent top-aligned column layout and share the `.hud-group` class (same background/border/radius/padding) instead of one-off inline styles per panel. Verified visually in-mission.*
