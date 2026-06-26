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
- `this.lander.deckWidth = 80` → `hw = 40` used throughout for layout
- `currentPad` set when speed ≤ 2.0, angle ≤ 8°, proximity check; also used proximity check for cargo dispense
- Level color themes: each level has `palette: { skyTop, skyMid, skyBot, terrainFill, rockEdge, rockGlow, fog }`
- `rockGlow` is a **partial CSS rgba string** like `'rgba(34,197,94,'` — append opacity e.g. `${pal.rockGlow}0.10)`
- `localStorage` keys: `cargoLanderCash`, `cargoLanderUpgrades`, `cargoLanderCareer`, `cargoLanderHighscores`

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
- [ ] Mobile viewport: canvas needs to scale down on narrow screens (CSS transform scale on `#game-container` based on window.innerWidth)
- [ ] Space mountains: floating rock obstacles (static `floatingRocks[]` in physics, drawn in game.js after terrain)
- [ ] Radar/minimap: should grow both vertically and horizontally as level height/width increases (currently fixed-size)

### Medium priority
- [ ] Flora/fauna: visual decoration elements (cacti, space algae, alien critters on terrain surface)
- [ ] Improve mouse aiming for basic & advanced lander (task #1)
- [ ] Fix jagged/flickering terrain edges on redraw (task #2)
- [ ] Verify all upgrades work correctly (task #6)

### Low priority / future
- [ ] More levels with larger maps + escalating difficulty (task #4)
- [ ] Procedural map generator (task #5)

## Recent Completed Features (this session)
- Level color palettes (5 levels, sky gradient + terrain + rock glow)
- Instant thruster cut-off (physics.js)
- Fly upward = OOB trigger (same monster spawn as left/right)
- Moving gravity well (orbits base position, phase-driven)
- Leg spring bounce on landing
- Space truck traffic: both directions, tilt-and-fly-off-into-space behavior
- Side thruster gradient fix (was invisible due to misanchored gradient)
- Mission panel: larger text (12-13px vs 9-11px before)
- Pilot rank: now based on upgrade progress + per-level 5000+ score mastery
