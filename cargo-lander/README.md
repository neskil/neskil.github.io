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
| `index.html` | Page shell: all DOM/UI (menus, HUD, overlays, mobile controls), all CSS, and the bootstrap script. Loads the four JS files in order. |
| `audio.js` | `CargoAudioController` — a Web Audio API synthesizer. Generates all sound *procedurally* (no audio files): thruster rumble, collisions, explosions, warning beeps, success arpeggios, and an ambient music drone. Exposes global `CargoAudio`. |
| `shaders.js` | `ShaderOverlay` — a WebGL layer drawn on the `#webglCanvas` on top of the main canvas. Renders glowing particles (point sprites) and the procedural "out-of-bounds monster" (a raymarched noisy blob in a fragment shader). Falls back to Canvas2D in `game.js` if WebGL is unavailable. |
| `physics.js` | `CargoPhysics` — the custom 2D physics engine. Terrain generation, lander integration & collision, cargo-box physics (terrain / deck / box-to-box), the drone winch constraint, magnetic deck, gravity wells, particles, and the chasing monster. No rendering here. |
| `game.js` | `CargoGame` — the orchestrator. Level & upgrade definitions, the `requestAnimationFrame` loop, input handling, camera, economy/progression (localStorage), HUD updates, win/lose flow, and **all Canvas2D rendering** (terrain, lander, boxes, hubs, minimap, monster fallback, menu background). Exposes global `game`. |

### Load order matters
`index.html` loads them as `audio.js → shaders.js → physics.js → game.js`, then
calls `game.init('cargoCanvas')`. `game` depends on `CargoPhysics`, `ShaderOverlay`,
and `CargoAudio` all being defined first.

### How the pieces talk
- `game.update()` builds an `inputState` object from `game.keys`/mouse and calls
  `physics.update(dt, levelConfig, inputState)`.
- `physics` mutates `lander`, `boxes`, `particles`, `monster`.
- `game.draw()` reads physics state and renders it; particles + monster are handed
  to `shaders.render(physics, camera)` (or drawn on Canvas2D as a fallback).
- Both `game` and `physics` call into global `CargoAudio` for SFX.

### Key concepts
- **Vehicles**: `basic` (upright arcade), `advanced` (mouse-aimed full rotation),
  `drone` (auto-hover + extendable winch for the "Needle's Eye" level).
- **Cargo types**: `normal`, `red`, `blue`, `green` — must be delivered to a hub of
  the matching `type`.
- **Economy**: `globalCash` + `upgrades` persist in `localStorage`
  (`cargoLanderCash`, `cargoLanderUpgrades`). `missionBudget` is per-mission.
- **dt**: the loop normalizes delta time to 60 fps (`dt = elapsedMs / 16.666`), so
  most physics constants are "per 60fps-frame".


## Verification
Changes were verified live against the local static server: the menu renders the
fully-styled pilot-license card populated from `localStorage`, the Audio settings
modal opens with controls synced to the real mute/volume state, and the browser
console + on-screen error logger report no errors.

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

## Next steps / potential improvements

| Priority | Feature |
|----------|---------|
| High | **Level Geometry Refactor** — Extract procedural terrain formulas out of `physics.js` and move them into level configuration objects so they are fully data-driven. |
| High | **True 2D Terrain Collision** — Move away from 1-height-per-X-coordinate heightmaps to allow for full 2D cave systems, overhangs, and tunnels. |
| High | **Base geometry** — HQ and pads need structure, depth, ambient lights |
| High | **NPC trucks** — cab + wheels + flatbed; can carry and drop cargo |
| Medium | **Monster head lerp** — mouth angle snaps too fast; needs smoothed `targetAngle` interpolation |
| Medium | **Space mountains** — floating rock obstacles |
| Medium | **Minimap resize** — radar should reflect actual level dimensions |
| Medium | **Flora & fauna** — terrain surface decorations (alien plants, critters) |
| Medium | **Upgrade verification** — audit all 6 upgrade types end-to-end |
| Low | **More levels** — larger maps, escalating difficulty, new hazards |
| Low | **Procedural map generator** — runtime terrain + pad placement |


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
| System | File | Approx. Lines |
|---|---|---|
| Level definitions (5 levels) | game.js | 3–160 |
| Upgrade catalog | game.js | 143–149 |
| `startLevel()` — init mission state | game.js | 614–680 |
| RAF loop / `update()` — timer, overtime, physics tick | game.js | 930–1010 |
| `checkCargoDelivery()` — delivery scoring | game.js | 1138–1194 |
| `updateHUD()` — fuel/hull bars, time display | game.js | 840–900 |
| Damage flash overlay (canvas) | game.js | ~1510 |
| `drawParallax()` — sky gradient | game.js | ~2200 |
| `drawLake()` — L1 only, terrain-clipped | game.js | ~2310 |
| `drawGroundParallax()` — subsurface layers | game.js | ~2450 |
| `drawTerrain()` — fill, edge, grass tufts (L1) / noise (others) | game.js | ~2480 |
| `drawSourcingDepot()` — HQ pad + cargo warehouse | game.js | ~2720 |
| `drawDeliveryHubs()` — receiving warehouse + crane | game.js | ~3000 |
| `drawLander()` — full truck + drone rendering, legs, flames | game.js | ~2950–3320 |
| `drawAmbientTraffic()` + `_drawFreighterTruck()` + `_drawPickupTruck()` | game.js | ~3680–3830 |
| `drawMonster()` — segmented creature, arms, mouth | game.js | ~1940–2200 |
| `spawnLander()` — lander initial state | physics.js | 147–190 |
| `applyControls()` — drone/basic/advanced input | physics.js | 370–500 |
| `applyGravityAndWind()` | physics.js | 521–540 |
| Leg spring decay | physics.js | ~584 |
| Landing / crash detection | physics.js | 600–700 |
| Monster spawn + integral-speed AI | physics.js | 309–370 |
| `updateAmbientTraffic()` — truck spawn logic | physics.js | 1055–1150 |

## Physics Notes
- Thruster: **slow spool-up, instant cut-off** (`enginePower = 0` immediately on key release)
- Side thrusters: `lander.strafePower` (-1..1), same instant-cut behaviour
- Out-of-bounds (monster trigger): left/right beyond ±500, **and also upward beyond y < -600**
- Moving gravity well: `gravityWellTime` phase, `orbitRadius` from well config, exposed as `gravityWellPos`
- Leg spring: `lander.legCompress` set on landing (`speed * 0.6`), decays only when `landed===true`
- Ambient traffic: `physics.ambientTraffic[]`, max 5, models: `'freighter'` | `'pickup'`
- Drone rope: grappleX = `lander.x - sin(angle) * (ropeLength + height/2)` — swings OPPOSITE to tilt
- Monster speed: base 0.25 + `speedIntegral * 0.55` (integral builds when lander escapes)

## Rendering Notes
- Side-thruster gradient must be anchored at the flame's x position (`flameX`), NOT at 0
- Menu background mock lander needs all fields: `deckWidth`, `deckOffset`, `basketHeight`, `fuel`, `strafePower`
- `shadeColor(hex, amount)` helper defined in game.js for color tinting
- Terrain drawn with level palette; background gradient also uses level palette
- Grass tufts (L1): x positions snapped to `Math.floor(startX/10)*10` to prevent camera-jitter

## Pilot Rank System
Score = `(ownedUpgradeLevels / 15) * 0.55 + (levelsMastered / numLevels) * 0.45`
"Mastered" = highscore ≥ 5000 on that level. Tiers: F → E → D → C → B → A → S

