# CargoLander — Claude Code Context

## Project Summary
Pure vanilla HTML/CSS/JS browser game. No build step, no dependencies.
- `index.html` — page shell, all CSS, DOM/UI, mobile controls
- `audio.js` — Web Audio synth (no audio files)
- `shaders.js` — WebGL particle overlay (`ShaderOverlay` class)
- `physics.js` — `CargoPhysics`: terrain, lander, cargo, monster, gravity wells, particles
- `game.js` — `CargoGame`: level/upgrade defs, RAF loop, input, camera, Canvas2D rendering, economy

Load order: `audio.js → shaders.js → physics.js → game.js`, then `game.init('cargoCanvas')`.

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

## Pending Tasks / Ideas
### High priority
- [ ] Crane pickup/delivery animation: cargo box physically lifted/lowered by crane arm

### Medium priority
- [ ] Monster head rotation: mouth snaps too fast to lander direction, needs smoothed angle lerp
- [ ] Space mountains: floating rock obstacles (`floatingRocks[]` in physics, drawn after terrain)
- [ ] Radar/minimap: grow both axes as level height/width increases
- [ ] Flora/fauna: terrain surface decorations (alien plants, critters)
- [ ] Improve mouse aiming for basic & advanced lander
- [ ] Verify all upgrades work correctly
- [ ] NPC trucks: some carry + drop cargo boxes in the world

### Low priority / future
- [ ] More levels with larger maps + escalating difficulty
- [ ] Procedural map generator

## Recent Completed Features
- **Mobile Viewport Scaling**: CSS `transform: scale()` automatically scales the fixed 1280x720 layout to fit the browser viewport width/height on mobile and desktop screens.
- **Cargo Spawning Delays**: Stands still on loading pad → cargo spawns with escalating delays (`55 + cycle * 30`) to balance risk/reward.
- **Shield Generator Upgrade**: Adds a defensive `shieldRegen` upgrade to the catalog which slowly recovers hull integrity.
- **Visual Shield Bubble**: Renders a pulsing blue energy bubble around the lander when the shield generator is active and integrity is > 20%.
- **CI Test Error Logging**: Test suite (`tests.html`) logs individual test failures with stack/category/name details to `console.error`.
- Biome-themed level palettes (grassland/desert/ice/volcanic/crystal cave)
- Damage flash: stronger red vignette + top/bottom bars + HULL DAMAGE text + screen shake
- HUD: renamed "Shield" → "Hull"; overtime timer blinks red when active
- Mission overtime: timer=0 → 15s grace period, monster chases, land at HQ to complete safely
- Monster: spawn delay 0.8s → 2.5s; integral speed accumulator (faster the longer you escape); prominent claw arms with 3-tine grips
- NPC trucks: two models (freighter + space pickup/F-150); varying speed/size; pickup can carry cargo box
- Cargo warehouse: corrugated building + loading dock doors + animated crane on collection pad
- Receiving warehouse + animated crane on every delivery hub
- Lake (L1 only): terrain-following clip path, ripples, fish, fishing boat with red bobber
- Grass tufts (L1): static world-space V-blades instead of jittery noise edge
- Lander: spawns 90px above HQ, lands=false at spawn (spring legs work on first touchdown)
- Lander: smaller body (deckWidth 66→56, w40→34, h28→22)
- Leg spring: decays only when grounded; instantly extended when airborne (no mid-flight animation)
- Drone rope: direction fixed — swings opposite to acceleration direction
- Underground easter eggs: data center visible through L4 cave terrain; crystal formations on L5
- Cargo box visual improvements: BOX_SIZE 20→28, type-specific emoji
- Level color palettes (5 levels, sky gradient + terrain + rock glow)
- Space truck traffic: both directions, tilt-and-fly-off-into-space, varied hull colors
- Pilot rank: upgrade progress (55%) + per-level 5000+ score mastery (45%)
- Parallax background mountains (3 layers, palette-derived colors)
- Next-objective arrow: bouncing ▼ above active PICK UP or DELIVER HERE pad
- Off-screen monster radar: pulsing red arrow + distance label; `playRadarPing()` beep
- Browser test suite: 133 tests across all systems (tests.html)
