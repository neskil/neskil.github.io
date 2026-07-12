# CargoLander — Plan: Hygiene Sweep + Night Ops Levels

Execution plan. **Read [CLAUDE.md](CLAUDE.md) first** — its standing
instructions apply to every item here: `node --check` each modified file, run
[tests.html](tests.html) to **0 failed**, exercise new mechanics against the
live `game`/`game.physics` objects, bump `CargoGame.VERSION`, then commit and
push. One item = one commit. Check steps off (`[x]`) as they land; when done,
archive a summary into HISTORY.md and delete this file, per project
convention.

Other ideas surfaced during this review were moved to README.md → "Long-term
vision" / "Idea parking lot" instead of kept here — this plan is scoped to
the Tier 0 hygiene items plus night ops.

Do Tier 0 first (small, independent, no dependencies between them) — then
the night-ops feature.

---

## Tier 0 — Hygiene & unfinished business (do first, all S)

### 0.1 Register `level10.js` in tests.html  `[x]` (done, commit `c19f422`)
`level10.js` (L10: The Crystal Caves) was loaded by `index.html` but missing
from `tests.html`'s script list, so its config silently skipped the
schema-driven "Level Config Validation" category. Fixed by adding the
`<script>` tag; L10 passes validation cleanly (89 → 97 tests, since each
level contributes several validation sub-tests).

While verifying this in a live browser, also found and fixed two more bugs
in the same area (same commit):
- **Touch controls visible before entering a level** — `index.html`'s
  `@media (max-width: 768px) { #mobile-controls { display: flex; } }` forced
  the ◀▶ GRAB 🔥 flight buttons visible on any narrow viewport — including
  the main menu, and on non-touch desktop windows resized narrow — fighting
  the JS logic (`updateMobileControlsVisibility()` in `game.js`) that's
  supposed to gate them on `isTouchDevice && gameState === 'playing'`. Removed
  the CSS override; JS is now the sole source of truth. Also added a
  synchronous call to `updateMobileControlsVisibility()` in `init()` so
  there's no flash before the first RAF tick.
- **`tests.html`'s Canvas2D mock was missing `ellipse`/`roundRect`/`rect`/
  `setLineDash`** — every menu refresh (`refreshMenuUI()` → the vehicle-license
  picker's `drawVehicleCanvases()` → `drawLander()`) threw a `TypeError`
  against the stub context, caught and logged as "Failed to draw menu lander"
  on every single test run. Filled in the stub's missing methods
  (`_makeCanvas2DStub()` in `tests.html`) — console is now clean.
- **Verify** (done): `tests.html` → 97/97 passed, 0 console errors; live
  playtest confirms controls hidden on menu, correctly shown mid-mission on
  a touch device.

### 0.2 Retire TODO.txt and fix doc rot  `[x]` (done)
Every item in TODO.txt had shipped (verified in code): upgrade cost scaling
(`game/menu.js` ~line 437, `basePrice * 1.5^level`); entry fee + budget
risked from `globalCash` (`game.js` ~lines 376–379); repo-man game-over below
−$5000 + first-negative bank warning (`game/menu.js` ~lines 73–92,
`repo-man-modal`, `negative-cash-warning`); shield regen delay w/ 5s blink
(`physics/entities.js` ~line 165 `shieldDelay = 300`, blink in `game/hud.js`
~line 179); tutorial modal (`index.html` `#tutorial-modal`); vehicle models
on select buttons (see 0.3 — already landed).
- Deleted `TODO.txt`; added a HISTORY.md entry ("TODO.txt retired") listing
  what each item maps to in the code.
- README fixes: file table and load-order paragraph now say `level10.js`
  instead of stopping at `level9.js`; the level-editor's `<script>`-tag
  reminder now also mentions `tests.html` and the editor's own dropdown
  (both were missing L10 too — see below).
- **Extra fix found while doing this**: `level-editor.html`'s "Load Level"
  dropdown (`#lsel`) also stopped at `level9.js` — L10 was unreachable from
  the editor's server-load flow (paste-fallback still worked). Added the
  `level10.js` option.
- **Verify**: `tests.html` still 97/97, 0 console errors (doc/dropdown-only
  change, no runtime code touched); editor HTML confirmed to serve the new
  option.

### 0.3 Finish & commit the WIP "Vehicle License" picker  `[x]` (already landed)
This was an uncommitted diff at the time this plan was first drafted; it has
since been committed (commit `07d4173`, "implement first-time startup pilot
portrait selector..." and related menu/UI commits). **No action needed** —
left here only so the history of this plan is legible. If picking this back
up ever seems relevant, sanity-check `drawVehicleCanvases()` in
`game/menu.js`: (a) `renderModel` swaps `this.ctx` and stubs
`this.physics.lander` — confirm menu-time animation can never run while a
mission is active or leave a stub lander behind when one starts; (b) it uses
`Date.now()` for animation phase — fine, but the large hidden canvases
(`canvas-vehicle-*-large`) should skip per-frame draws while their modal is
closed.

---

## Feature summary

A level-config flag (`night: true`) that renders the mission in near-darkness:
sky/terrain dimmed via a screen-space darkness overlay, a cone of light
punched out around the lander that moves/rotates with it, and soft ambient
glows around hubs/hazards/lit landmarks so the map stays navigable without
fully defeating the darkness. Pure rendering feature — **no physics or
gameplay-rule changes**, so risk is low and it's fully driven by
`render.js`/`render/*.js`.

## Design decisions (resolve before/while implementing — use best judgment,
these aren't blocking questions for the user)

- **Which level(s)?** Don't create a new `level11.js` for this pass — retrofit
  the flag onto **one existing atmospheric level** first (L5 "crystal"/cave
  biome or L10 Crystal Caves are natural fits since they're already
  underground-themed) by adding `night: true` to its config. This keeps the
  change reviewable in one level instead of a level + a new registration.
  A dedicated night level/L11 is a good Tier-3-style follow-up once the
  rendering itself is proven, not part of this plan.
- **Light source**: only the **lander** casts light for v1 (not hubs/hazards
  independently) — hubs/hazards get a small fixed-radius ambient glow so
  they're never *fully* invisible, but the lander's cone is the primary way
  players see terrain. This is what makes "careful flying" the challenge.
- **Vehicle difference**: `drone` and `basic` share the same spotlight cone
  parameters for v1 — don't special-case per vehicle unless playtesting says
  it's needed.

## Implementation steps — all done, shipped as v0.10.0

### 1. Schema + level flag  `[x]`
- Added `night` (boolean, default `false`) to `levelSchema.js`, same pattern
  as `heatHaze` — editor + `tests.html` validation pick it up for free.
- Retrofitted `night: true` onto **L10: The Crystal Caves** (`level10.js`)
  per the Design decisions above; also tweaked its `description` to mention
  the outpost being dark for flavor-text accuracy.

### 2. Darkness overlay  `[x]`
- New mixin file `render/night.js` (`drawNightOverlay()`), registered in
  `index.html` and `tests.html` right after `render/effects.js`. Uses a
  lazily-created/resized offscreen canvas (`this._nightCanvas`): fill with
  `rgba(4, 7, 18, 0.86)`, then `destination-out` punches for the light
  sources, then one `drawImage` onto the main canvas.
- Placed the call in `render.js`'s `draw()` **after** the WebGL particle/
  monster pass and **before** the HUD-layer draws (wind indicator, minimap,
  vignettes, damage flash, version counter) — i.e. after post-FX, not before.
  Deviates from the plan's original "before post-FX so it's sampled by heat
  haze" suggestion: simpler and lower-risk, and L10 doesn't use `heatHaze`
  anyway so there's no live case where this ordering matters yet. Revisit if
  a future night level also wants heat haze.

### 3. Lander spotlight cone  `[x]`
- Radial glow (`NIGHT_LIGHT_RADIUS = 210` world px) + a forward flashlight
  cone (`NIGHT_CONE_LENGTH = 340`, `NIGHT_CONE_HALF_ANGLE = 0.42` rad ≈ 24°),
  oriented by `lander.angle` matching `drawLander()`'s own rotation
  convention (nose-up at angle 0, confirmed by reading `render/entities.js`
  line ~1223). Both scale with `camera.zoom` via the same world→screen
  transform pattern already used for water-body post-FX rects in `render.js`.
  Named constants at the top of `drawNightOverlay()`, ready for tuning.

### 4. Ambient glows for hubs/hazards  `[x]`
- Hubs (`this.physics.deliveryHubs`) and hazards (`this.physics.hazards`,
  midpoint for 2-point lasers / `this.physics.polygonCentroid()` for
  polygon zones — both pre-existing helpers, reused not reinvented) each get
  a fixed `NIGHT_AMBIENT_RADIUS = 70` glow, alpha 0.45–0.55 — visibly dimmer
  than the lander's own alpha-1 light.

### 5. Readability pass  `[x]`
- Minimap draws to a separate `#radar-canvas` DOM element (`drawMinimap()`),
  confirmed unaffected by construction — the overlay only ever touches the
  main game `ctx`.
- World-space labels weren't specifically re-styled; L10 has no dense label
  clutter near hazards. Flagged as a follow-up if a denser night level is
  built later (see Explicitly out of scope).

### 6. Verification  `[x]`
- `tests.html`: 89 → 97 passed (L10 registration, tracked separately as
  PLAN 0.1) → still 97/97 after this feature, 0 console errors.
- Live-verified via direct canvas pixel/alpha sampling (screenshot tooling
  was unavailable this session): `_nightCanvas` alpha reads 1 (fully
  punched) at the lander's exact screen position, 219 (full authored
  opacity) in a far corner, with correct soft falloff in between; the final
  composited frame is measurably darker at a fixed terrain point with
  `night: true` vs `false`; toggling `night` off on the same level restores
  normal brightness immediately (no leak/residue); L1 (a non-night level)
  renders completely unaffected. The overlay composites unconditionally
  after the post-FX block, so it doesn't depend on Settings → Visual Effects
  being on.
- Did **not** get a visual (pixel-eyeballed) screenshot confirmation this
  session — the browser screenshot tool was failing/timing out throughout
  (unrelated to this code; `read_console`/`javascript_exec` worked
  throughout). **Recommended next step for whoever picks this up**: grab a
  real screenshot (`probe-screenshot.html?level=9&x=..&y=..&zoom=..` or just
  playing L10 live) to eyeball-tune `NIGHT_LIGHT_RADIUS` /
  `NIGHT_CONE_LENGTH` / `NIGHT_CONE_HALF_ANGLE` / the darkness alpha — the
  pixel-sampling verification confirms the mechanism works correctly, not
  that the numbers feel good to fly with.

### 7. Ship it  `[x]`
- Bumped `CargoGame.VERSION` 0.9.3 → **0.10.0** (minor — new visible
  feature). Committed, pushed. HISTORY.md entry added.

## Explicitly out of scope for this plan
- A dedicated new `level11.js` night level (follow-up, not required to ship
  night ops).
- Per-hazard/per-hub independent light sources beyond the fixed ambient glow.
- Any gameplay/physics changes (visibility-based hazard difficulty, fuel
  cost changes, etc.) — this is a rendering-only feature for now.
