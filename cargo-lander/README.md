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
