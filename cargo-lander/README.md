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
| `physics.js` | `CargoPhysics` — the custom physics engine, built on Matter.js for collision (lander body, box bodies, terrain bodies). Terrain generation, lander integration & collision, cargo-box physics (terrain / deck / box-to-box), the drone winch constraint, magnetic deck, gravity wells, particles, and the chasing monster. No rendering here. |
| `game.js` | `CargoGame` — the orchestrator (5300+ lines). The `requestAnimationFrame` loop, input handling, camera, economy/progression (localStorage), HUD updates, cargo delivery/loss handling, win/lose flow, and **all Canvas2D rendering** (terrain, lander, boxes, hubs, minimap, monster fallback, menu background). Exposes global `game`. Level & upgrade *definitions* live in `level1.js`–`level8.js`/`levels.js`, not here. |
| `level-editor.html` | **Level Editor** — standalone browser tool for visually editing levels. See [Level Editor](#level-editor) below. |
| `level1.js` – `level8.js`, `levelTest.js` | Individual level configs — registered via `registerLevel()` from `levels.js`. Each defines terrain polygons, hubs, OOB zone, palette, physics, and quests. `levelTest.js` is a sandbox level reachable via `game.startTestLevel()`. **Adding a new level file also requires manually wiring it into `index.html`**: its `<script>` tag, a button in the hardcoded `#mission-grid`, and a Dev-panel jump button — none of that is generated from `levels[]`. |
| `levels.js` | `registerLevel()` dispatcher + upgrade catalog + quest helper functions (`questPrimary`, `questNoCrash`, etc.). |
| `tests.html` | Browser-based test suite (166 tests as of 2026-06) covering level configs, physics init, draw-method existence, upgrades, etc. Open directly in a browser via a local static server; results post to `#summary` and failures log full stacks to `console.error`. Some tests are stale relative to the current implementation (see [Known Issues](#known-issues)). |

### Load order matters
`index.html` loads the Matter.js CDN script, then `levels.js → level1.js…level8.js →
levelTest.js → audio.js → shaders.js → physics.js → game.js`, then calls
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
- **Level file dropdown** — loads any of `level1.js` – `level7.js` + `levelTest.js` directly from the server via `fetch()`. Parses the full `registerLevel({...})` config using a sandboxed `new Function()` eval, extracting polygons, palette, OOB zone, hubs, gravity well, and spawn markers — no manual copying needed.
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
Changes were verified live against the local static server: the menu renders the
fully-styled pilot-license card populated from `localStorage`, the Audio settings
modal opens with controls synced to the real mute/volume state, and the browser
console + on-screen error logger report no errors.

---



---

## Recent additions

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
- **Browser test suite** — `tests.html`: 133 tests across all systems.
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
- `localStorage` keys: `cargoLanderCash`, `cargoLanderUpgrades`, `cargoLanderCareer`, `cargoLanderHighscores`
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
Score = `(ownedUpgradeLevels / 15) * 0.55 + (levelsMastered / numLevels) * 0.45`
"Mastered" = highscore ≥ 5000 on that level. Tiers: F → E → D → C → B → A → S

