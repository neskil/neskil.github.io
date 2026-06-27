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

---

## Bugs found & fixed

All issues below were found during review and have since been **fixed**. The
descriptions document what was wrong and what changed, so the history is clear.

### 1. ✅ Settings + pilot-license UI was wired to functions that didn't exist
`index.html` called several `game.*` methods that were **not defined** in `game.js`,
so each threw `TypeError` (and tripped the on-screen error logger): `openSettings`,
`closeSettings`, `toggleMuteFromCheckbox`, `setMusicVolume`, `setSFXVolume`,
`updatePilotName`, `confirmResetCareer`. The pilot-card stats (`lc-cash`,
`lc-deliveries`, `lc-missions`, `lc-crashes`), highscore list (`hs-list`), and
per-mission badges (`hs-badge-0..4`) were also never populated.

**Fix:** implemented all seven methods in `game.js`, plus persistent career state
(`this.career` = `{pilotName, totalDeliveries, missionsComplete, crashes}` and
`this.highscores`, both in `localStorage`) and a `refreshMenuUI()` that fills the
license card, upgrade chips, highscore list, and badges. `refreshMenuUI()` is called
from `init()` and `goToMenu()`. Deliveries/crashes/missions are now incremented at
the right moments (`checkCargoDelivery`, the crash handler, `completeMission`), and
`completeMission` records a per-mission best payout.

### 2. ✅ The whole right-hand menu column had no CSS
The pilot-license / highscores markup used classes absent from the `<style>` block
(`.menu-panes`, `.pilot-card`, `.stat-grid`, `.highscores-card`, `.btn-career`, …).

**Fix:** added a complete stylesheet block for the menu panes, pilot license card,
stat cells, upgrade chips, highscore rows, and career buttons (theme-consistent
glassmorphism), including a single-column fallback under 768px.

### 3. ✅ Thruster sound never played — typo
`game.js` checked `lander.thrustingActive` (always `undefined`); physics only sets
`lander.thrusting`. **Fix:** corrected to `lander.thrusting`, so engine SFX play.

### 4. ✅ Magnetic Deck upgrade never activated
`physics.js` gated the pull on `vehicleType === 'lander'`, but real types are
`'basic'`/`'advanced'`/`'drone'`. **Fix:** changed to `vehicleType !== 'drone'`, so
the upgrade now works on the basic and advanced landers (it doesn't apply to the
drone, which uses the winch instead).

### 5. ✅ "Replay" / "Next Mission" / "Restart" reset you to the Basic lander
`startLevel` defaulted its `vehicleType` to `'basic'`, and Replay/Next/Restart passed
no vehicle, discarding the player's choice (worst for the drone-only Mission 5).
**Fix:** added `this.currentVehicle`, set it whenever a level starts, and defaulted
`startLevel(idx, vehicleType = this.currentVehicle || 'basic')` so the chosen vehicle
carries across replays and mission transitions.

### 6. ✅ Victory "Play Again" used the wrong property
The handler was `game.cash=0; game.startLevel(0)` — `cash` isn't a real property.
**Fix:** changed to `game.startLevel(0)` (which now also hides the victory screen) and
the "Main Menu" button to `game.goToMenu()`. Persistent career cash is intentionally
kept (it's a career save); use **Reset Career** to wipe progress.

### 7. ✅ Mute state vs. settings UI were out of sync
The game starts muted, but the settings checkbox defaulted to unchecked.
**Fix:** `openSettings()` now syncs the checkbox and volume sliders to the live audio
state before showing the modal; `toggleMuteFromCheckbox()` drives a new
`CargoAudio.setMuted(bool)` helper in `audio.js`.

### Minor / cleanup (all fixed)
- Removed the dead `document.getElementById('fail-screen')` lookups in `goToMenu()`
  and `startLevel()` (the element id is `game-over-screen`).
- `CargoAudio.playUnload()` is now actually used — it plays on a successful delivery.
- Removed the unused `const dx = box.x - hub.x;` in `checkCargoDelivery()`.
- Added a divide-by-zero guard (`|| 1`) to `getTerrainSlope()`.

> Note: the legacy `toggleMute()` method on `game` still exists but is unused — the
> ⚙️ Audio button opens the settings modal instead. Left in place as a harmless
> programmatic toggle; safe to remove later.

---

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
| High | **Base geometry** — HQ and pads need structure, depth, ambient lights |
| High | **NPC trucks** — cab + wheels + flatbed; can carry and drop cargo |
| Medium | **Monster head lerp** — mouth angle snaps too fast; needs smoothed `targetAngle` interpolation |
| Medium | **Space mountains** — floating rock obstacles |
| Medium | **Minimap resize** — radar should reflect actual level dimensions |
| Medium | **Flora & fauna** — terrain surface decorations (alien plants, critters) |
| Medium | **Upgrade verification** — audit all 6 upgrade types end-to-end |
| Low | **More levels** — larger maps, escalating difficulty, new hazards |
| Low | **Procedural map generator** — runtime terrain + pad placement |
