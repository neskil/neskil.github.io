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
- Vehicle types: `'basic'` (upright arcade), `'advanced'` (mouse-aimed rotation), `'drone'` (winch)
- `this.lander.deckWidth = 66` → `hw = 33` used throughout for layout (width 40, height 28)
- `currentPad` set when speed ≤ 2.0, angle ≤ 8°, proximity check; also used proximity check for cargo dispense
- Level color themes: each level has `palette: { skyTop, skyMid, skyBot, terrainFill, rockEdge, rockGlow, fog }`
- `rockGlow` is a **partial CSS rgba string** like `'rgba(34,197,94,'` — append opacity e.g. `${pal.rockGlow}0.10)`
- `localStorage` keys: `cargoLanderCash`, `cargoLanderUpgrades`, `cargoLanderCareer`, `cargoLanderHighscores`
- `padScale` on level config scales all pad widths: L1=1.5, L2=1.2, L3=0.85, L4=0.70 (L5 has explicit narrow hub)

## Security: `.claude/` Must NEVER Be Committed
The `.claude/` folder contains machine-specific Windows absolute paths. Add to `.gitignore` if missing.

## Physics Notes
- Thruster: **slow spool-up, instant cut-off** (`enginePower = 0` immediately on key release)
- Side thrusters: `lander.strafePower` (-1..1), same instant-cut behaviour
- Out-of-bounds (monster trigger): left/right beyond ±500, **and also upward beyond y < -600**
- Moving gravity well: `gravityWellTime` phase, `orbitRadius` from well config, exposed as `gravityWellPos`
- Leg spring: `lander.legCompress` set on landing (`speed * 0.5`), decays at `0.04/frame`
- Ambient traffic: `physics.ambientTraffic[]`, max 5, can `flyingOff` (tilt + accelerate away)

## Rendering Notes
- Side-thruster gradient must be anchored at the flame's x position (`flameX`), NOT at 0
- Menu background mock lander needs all fields: `deckWidth`, `deckOffset`, `basketHeight`, `fuel`, `strafePower`
- `shadeColor(hex, amount)` helper defined in game.js for color tinting
- Terrain drawn with level palette; background gradient also uses level palette

## Pilot Rank System
Score = `(ownedUpgradeLevels / 13) * 0.55 + (levelsMastered / numLevels) * 0.45`
"Mastered" = highscore ≥ 5000 on that level. Tiers: F → E → D → C → B → A → S

## Pending Tasks / Ideas
### High priority
- [ ] Mobile viewport: CSS `transform: scale()` on `#game-container` based on `window.innerWidth`
- [ ] Cargo spawning countdown: stand still on pad → cargo spawns with increasing delays (risk/reward)
- [ ] Cargo boxes: bigger, show emoji/label, more visual personality
- [ ] NPC trucks: look like real trucks (cab, wheels, flat bed), can carry/drop cargo
- [ ] Base geometry: HQ + pads need more visual interest (structure, depth, lights)

### Medium priority
- [ ] Monster head rotation: mouth snaps too fast to lander direction, needs smoothed angle lerp
- [ ] Space mountains: floating rock obstacles (`floatingRocks[]` in physics, drawn after terrain)
- [ ] Radar/minimap: grow both axes as level height/width increases
- [ ] Flora/fauna: terrain surface decorations (alien plants, critters)
- [ ] Improve mouse aiming for basic & advanced lander
- [ ] Verify all upgrades work correctly

### Low priority / future
- [ ] More levels with larger maps + escalating difficulty
- [ ] Procedural map generator

## Recent Completed Features
- Level color palettes (5 levels, sky gradient + terrain + rock glow)
- Instant thruster cut-off, fly-up = OOB trigger, moving gravity well, leg spring on landing
- Space truck traffic: both directions, tilt-and-fly-off-into-space, varied hull colors
- Pilot rank: upgrade progress (55%) + per-level 5000+ score mastery (45%)
- Mission panel: larger text; separate mute button; nav header top margin
- Parallax background mountains (3 layers, palette-derived colors)
- Lake on L1/L2: animated water, 4 swimming fish, bobbing fishing boat
- Next-objective arrow: bouncing ▼ above active PICK UP or DELIVER HERE pad
- Collection pad: sky-blue accent + pulsing glow; delivery hubs pulse when carrying matching cargo
- Terrain edge: rounded boulder shapes + surface shadow band (replaced sharp triangle spikes)
- Monster after extraction timer: if all cargo delivered but not extracted, monster spawns instead of instant fail
- OOB monster spawns faster (0.8s instead of 2s)
- Off-screen monster radar: pulsing red arrow + distance label at screen edge; `playRadarPing()` beep
- Pad scaling by level: L1=1.5×, L2=1.2×, L3=0.85×, L4=0.70× (landing gets harder each level)
- Player truck smaller: width 40/height 28/deckWidth 66 (was 48/32/80)
- Leg spring bounce only on actual pads (not raw terrain collisions)
- Browser test suite: 133 tests across all systems (tests.html)
- Fixes: WebGL null-guard in ShaderOverlay, fuel underflow clamp
