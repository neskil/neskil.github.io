# CargoLander — Plan: Night Ops Levels + Lander Spotlight

Single-feature execution plan. **Read [CLAUDE.md](CLAUDE.md) first** — its
standing instructions apply: `node --check` each modified file, run
[tests.html](tests.html) to **0 failed**, exercise the new mechanic against
the live `game`/`game.physics` objects, bump `CargoGame.VERSION`, then commit
and push. Check steps off (`[x]`) as they land; when done, archive this file's
summary into HISTORY.md and delete it, per project convention.

Other ideas surfaced during this review were moved to README.md → "Long-term
vision" instead of kept here — this plan is scoped to night ops only.

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

## Implementation steps

### 1. Schema + level flag  `[ ]`
- Add `night` (boolean, default `false`) to `levelSchema.js` so the level
  editor and `tests.html`'s schema-driven validation pick it up for free —
  follow the existing pattern for boolean scalar fields (e.g. how
  `outOfBounds: true` shorthand or similar flags are declared).
- Add `night: true` to the chosen level's config (see Design decisions).

### 2. Darkness overlay  `[ ]`
- In `render.js`'s frame composition (`draw()`), after normal scene rendering
  (terrain, hubs, entities, particles) but before HUD/UI draws, if
  `levelConfig.night` is true: draw a full-canvas dark overlay
  (e.g. `rgba(5, 8, 20, 0.82)`ish — tune by eye) using
  `ctx.globalCompositeOperation = 'source-over'` on an offscreen canvas/layer
  so it can be selectively punched through in step 3. A second canvas layer
  (or an offscreen `OffscreenCanvas`/temp canvas sized to match) is simplest:
  draw darkness there, punch holes with `destination-out`, then
  `drawImage` that layer onto the main canvas in one composite.
- Respect the existing post-FX pipeline order (`shaders.js`
  `renderPostFX`) — the darkness layer should sit **under** UI/HUD but can
  be full-scene like other post-FX; check whether it needs to happen before
  or after `renderPostFX` by testing (heat haze/water shimmer sampling the
  scene — darkness probably wants to be part of the sampled scene, i.e.
  applied before post-FX, not after).

### 3. Lander spotlight cone  `[ ]`
- On the darkness layer, punch a light shape at the lander's screen position
  each frame: `ctx.globalCompositeOperation = 'destination-out'`, draw a
  soft-edged radial gradient (bright alpha at center fading to 0) centered on
  the lander, plus an optional forward-facing cone (a filled arc/triangle
  oriented by `lander.angle` and, if using the drone, its facing) for a
  "flashlight" feel rather than a plain radius. Use `lander.x/y` transformed
  to screen space the same way other entities are (reuse the camera
  transform already applied for `render/entities.js` draws).
- Radius/cone-angle should be tunable constants near the top of the
  darkness-draw code (e.g. `NIGHT_LIGHT_RADIUS`, `NIGHT_CONE_ANGLE`) — this
  will need eyeball tuning in a live playtest, don't hardcode magic numbers
  inline without naming them.

### 4. Ambient glows for hubs/hazards  `[ ]`
- Also punch smaller, fixed, dimmer holes (or additive glow draws) around
  delivery hubs and active hazards (lasers/incinerators already have glow-ish
  rendering — check `render/entities.js`/`render/terrain.js` for existing
  glow patterns to reuse rather than invent a new one) so they're always
  faintly visible even outside the lander's cone. Keep these noticeably
  dimmer/smaller than the lander's own light — they're wayfinding aids, not
  a way to trivialize the darkness.

### 5. Readability pass  `[ ]`
- Re-check world-space text labels (mission markers, hub labels) for
  legibility against the dark overlay — README's Rendering Notes already
  flags that post-FX (heat haze) can distort labels; darkness has a similar
  "check labels after adding this pass" risk. Bump label contrast/add a
  subtle glow/stroke if needed.
- Confirm the minimap/radar (`render/ui.js`) is unaffected by the darkness
  layer (it should read the same regardless of in-world lighting) — if it's
  drawn as part of the main scene pass instead of as a separate HUD layer,
  make sure the overlay doesn't accidentally dim it too.

### 6. Verification  `[ ]`
- `node --check` every modified file.
- `tests.html` → 0 failed, including the new schema field's validation.
- Live playtest: start the chosen night-flagged level, confirm terrain is
  legible only near the lander, hubs/hazards give a faint always-visible
  glow, and the cone follows lander rotation.
- `probe-screenshot.html?level=<idx>&debug=1` screenshots of the night level
  from a couple of camera positions — visually confirm darkness + spotlight
  render correctly headlessly (this is the project's standard way to catch
  invisible-render bugs without a live browser).
- Toggle Settings → Visual Effects off/on once at night to confirm nothing
  about the darkness layer depends on post-FX being enabled (or, if it
  intentionally does, that turning post-FX off doesn't leave the scene
  pitch black with no fallback).

### 7. Ship it  `[ ]`
- Bump `CargoGame.VERSION` (minor — new visible feature).
- Commit, push. Add a short HISTORY.md entry once merged (per CLAUDE.md
  standing instructions), and note in this file which level got the flag.

## Explicitly out of scope for this plan
- A dedicated new `level11.js` night level (follow-up, not required to ship
  night ops).
- Per-hazard/per-hub independent light sources beyond the fixed ambient glow.
- Any gameplay/physics changes (visibility-based hazard difficulty, fuel
  cost changes, etc.) — this is a rendering-only feature for now.
