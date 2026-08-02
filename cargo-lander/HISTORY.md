# CargoLander — History & Archived Plans

Reverse-chronological archive of shipped work, resolved bug sagas, and executed
plans. **Current-state documentation lives in [README.md](README.md); agent
workflow and standing instructions in [CLAUDE.md](CLAUDE.md).** Nothing in this
file is a live TODO — open work is tracked in the README's "TODO / Open
backlog" section.

---

## 2026-08-02 — L5 rebuilt as a traffic-dodging city; traffic pathfinding precomputed (v0.20.0)

**L5 replaced.** "The Needle's Eye" was a crystal-cavern winch-drop level whose
premise didn't exist in its geometry. The "shaft" was a downward wedge in the
ceiling polygon, not an enclosed passage: there was no vertical throat, so the
lander could fly around the "funnel" and set cargo down by hand. The winch, the
narrowing and the side alcove were all decorative. Rather than retrofit terrain
to support the mechanic, it was replaced with **L5: Rush Hour** — a neon
downtown built around ambient traffic as the primary obstacle
(`backgroundType:'city'`, `ambientTrafficRate:5`).

The design hinge is that traffic altitude is set by *roof heights*, not by
`ambientTrafficMinY/MaxY` alone: trucks hold `min(baseY, highestTerrainAhead -
140)`. Roofs at y:560-700 put the lane at ~420-500, i.e. directly over every pad
on the map, so the player is in traffic the moment they lift off. A comms needle
at x:2300 deliberately yanks eastbound trucks up over the Skyport approach so
they come diving back down across it. Two hubs at two altitudes give two routes:
the rooftop Skyport through the lanes, and the Undercity Dock down in the old
canal district under them, taxed by an L-shaped security-beam grid instead.
**The level must never gain a ceiling terrain polygon** — `obstacleHeight` takes
the min y of every segment in range, so a ceiling makes the clearance altitude
hugely negative and every truck climbs into it (the same reason L4 sets
`ambientTrafficRate:0`). Altitude is capped by the existing police mechanic.

**Traffic pathfinding precomputed.** `updateAmbientTraffic()` had every truck
re-derive its own path each frame — a scan of every entry in `segments` inside a
500px directional lookahead — recomputing an answer that cannot change, since
terrain is static. `buildTrafficLanes()` (physics/atmosphere.js) now bakes it
into two 25px-bucketed lookup tables at first use, one per heading, holding the
clearance altitude directly. An obstacle spanning `[x0,x1]` is in an eastbound
truck's window exactly when `x0-500 <= x <= x1` (and `x0 <= x <= x1+500`
westbound), so the build is a plain interval fill — no sliding window. Per-frame
cost drops to one array index. Invalidated by nulling `trafficLanes` (initLevel,
and collision.js when a fragile segment shatters).

A first attempt used per-bucket ranges plus a sliding-window minimum and leaked
obstacles up to two buckets outside the true window — L5's needle bled 680px
into a position it shouldn't have reached at all. Two tests now pin the tables
to the scan they replaced, with the old code as the reference implementation:
across all 10 levels the tables are **exactly** equal at every sample point, and
between samples the only deviation is 25px quantisation of where a step lands
(bounded by the step, and invisible against a lagged controller capped at 3px per
frame). Dev panel gained **Show Traffic Lanes**, drawing both directional
profiles, the config band, and each truck's steer-to line;
`probe-screenshot.html?lanes=1` and `&script=trafficSim` expose the same
headlessly.

Also removed: the scan's second pass over `this.engine.world.bodies` for
"buildings, pads". `CargoPhysics` has never had an `engine` property (the Matter
world is `matterEngine`/`matterWorld`), so that pass was dead on every level
since it was written — the same silent-no-op class as L9's unrendered `'comms'`
building. It must not be "fixed" by repointing it at `matterWorld`: that world
holds the three enclosure walls, whose bodies extend to `bounds.min.y` ≈ -1.5 ×
levelHeight, and feeding those into the clearance min would launch every truck
near a map edge into the stratosphere. Pads sit on roofs already covered by
`segments`, so nothing was lost.

---

## 2026-08-02 — L4 Anomaly Zone was unclearable; night ops + sonar ping (v0.19.15)

Reported as "lower gravity on level 4", then "the burning hazard needs to be a
lot slower and not as wide, currently impossible".

**Gravity.** L4 sat at `0.22` — far and away the heaviest level (next is L2 at
`0.16`, most are `0.12`) and outside `levelSchema.js`'s recommended `0.10 -
0.15` band. Lowered to `0.15`. The drifting gravwell is the level's gravity
gimmick; the baseline didn't need to carry it too.

**The vent.** The incinerator sits in the corridor between the Ground polygon's
underside (y≈390) and Polygon 2's roof (y≈615) — the only route west into The
Hollow. Its polygon spanned x140–460, which is the corridor's *entire* 320px
opening, so an active flare sealed the passage wall-to-wall. Timing was
`onMs:1500 / offMs:1000` with no `warnMs`, so the default 600ms charge warning
ate most of the gap: 400ms of clear air to cross 320px, on 60% duty. Not
survivable — the report was accurate.

Now `onMs:1400 / offMs:4200 / warnMs:900` (period 2.5s → 5.6s, duty 60% → 25%,
clear window 400ms → 3300ms) and the polygon is halved to x230–390, leaving
~90px of clearance either side inside the corridor. It still seals top-to-bottom
while lit, so it's a timing gate, not a wall.

**Regression guard.** `tests.html`'s hazards test now asserts every timed
laser/incinerator leaves `offMs - warnMs >= 900ms` of clear-and-unwarned air,
using the same `?? default` warnMs the physics uses — the failure mode here was
a config that reads fine field-by-field but is impossible in combination.
Verified it fails on the old `offMs:1000` before re-fixing.

**Night ops.** L4 is an unlit volcanic cavern, so it got `night: true` (second
level to use it after L10) — darkness overlay, lander spotlight, objective beam,
and the periodic lander sonar sweep that reveals terrain silhouettes. Paired
with a `radarPingZone` centred on the vent (`310,490`, r 340, amber `249,115,22`
to match the palette's `rockEdge`), since in the dark the vent is otherwise
invisible until it flares in your face. `hint` rewritten to teach both.

Verified with `run-tests.sh` (142 passed / 0 failed) plus probe screenshots of
the corridor (vent vs. corridor width) and of the night overlay at HQ.

---

## 2026-07-30 — Fullscreen button threw a red error banner on iPhone (v0.19.14)

Reported as "full screen gives error message on iphone". The message was
index.html's own `#error-log` debug banner — a full-width red block over the top
of the game reading *"Uncaught TypeError:
document.documentElement.requestFullscreen is not a function"* plus a stack
trace.

**Cause.** iPhone Safari implements no element Fullscreen API at all — only
`HTMLVideoElement.webkitEnterFullscreen()`. So on iPhone
`document.documentElement.requestFullscreen` is `undefined`, and
`toggleFullscreen()` called it unconditionally. A missing method throws a
*synchronous* TypeError rather than returning a rejected promise, so the
`.catch()` that was already there could never see it. The throw escaped the
inline `onclick`, hit `window.onerror`, and painted the banner. `document
.fullscreenElement` is also undefined there, so the guard always chose the
enable branch. iPad Safari *does* support element fullscreen (prefixed), so this
had to be feature detection, not a platform sniff.

**Fix.** `fullscreenApi()` resolves the standard and `webkit`/`ms` prefixed
request/exit/element triples; `toggleFullscreen()` bails with a notification
chip when there's no request method, wraps the call in try/catch (a request can
also be refused outright by an iframe permissions policy), and only attaches
`.catch()` when the call actually returned a promise — prefixed implementations
return undefined. `updateFullscreenAvailability()`, called from `init()`, hides
both fullscreen buttons where the API is absent, so iPhone players aren't
offered a control that can't work. The in-HUD button gained an id
(`hud-fullscreen-btn`) so it can be targeted.

Verified with a new `probe-screenshot.html?script=fullscreenUnsupported` repro:
it deletes the three request methods and **clicks the real button**, since the
symptom depends on the exception escaping the inline onclick inside the iframe —
calling `game.toggleFullscreen()` from the probe's own context throws in the
parent and shows no banner either way, which briefly made the fix look verified
when it wasn't. Screenshots confirm the banner before and its absence after.
Four unit tests cover unsupported / prefixed-only / refused / button-hiding;
three fail against the old implementation. 142/142 pass.

---

## 2026-07-28 — Winding-order cleanup + deploy hygiene (v0.19.10)

Follow-up review after v0.19.9. That fix normalised polygon winding in the
physics surface scan, but the same raw `p1.x < p2.x` floor test was duplicated
in three more places, all still reading reverse-wound polygons upside down.

- **Edge glow drew the wrong rim** (`render/terrain.js`). L1's floating island
  is wound opposite to its ground, so the crisp outline traced the island's
  underside while the top rim — the part you can actually land on — was left
  unlit. Visible in-game, confirmed by screenshot before/after.
- **Spike hazards would point into the rock**. The triangle normal is derived
  from endpoint order, so a reverse-wound polygon's teeth grow inward. Correct
  today only because both spike-bearing polygons happen to be wound the right
  way — a trap for the next level author, not a live bug.
- **Grass/shadow extent** came off the underside edges for the same reason.
- **`invisibleEdge` marked different edges in physics vs rendering.**
  `generateTerrain()` normalised by reversing the vertex *list*, which slides
  every per-point flag one edge along, while the renderer read the raw order.
  A reverse-wound polygon using `invisibleEdge` would have had its collision
  gap and its visual gap in different places. Both now swap endpoints per edge
  instead, so a flag stays on the edge that starts at it.

All four now go through `polygonIsReversed()`. The stroke loop additionally
walks reverse-wound polygons back-to-front so consecutive floor edges still
chain head-to-tail — endpoint-swapping alone unchains them and the `drawing`
flag then strokes a phantom segment.

**Root cause, fixed at source**: the level editor never normalised winding at
all, so drawing a polygon the "wrong" way shipped broken data. `buildOut()` now
emits the canonical winding, shifting the per-point flags to compensate for the
reversal (an editor self-test pins that bookkeeping — a plain `.reverse()`
fails it).

**Deploy hygiene.** Nothing enforced the version-bump ritual, and it had
drifted: at v0.19.8 `index.html` was current while `tests.html` was still on
0.19.7, meaning the suite was exercising cached JS while reporting green. New
"Deploy Hygiene" test parses both pages and asserts every local `<script src>`
carries `?v=CargoGame.VERSION` (vendor/ exempt). The repo-root landing page
lives above the suite's web root, so `run-tests.sh` gained a sixth check for
its link — which turned out to have no `?v=` at all despite CLAUDE.md calling
for one. Also `chmod +x run-tests.sh`: it was committed non-executable, so the
`./run-tests.sh` every agent is told to run first failed outright.

Three new engine tests: floor edges must have open air directly above them on
every level (geometric truth, not self-consistency); reversing a polygon's
vertex order must change nothing observable; plus the editor flag-shift test.
All were confirmed to fail against the pre-fix code. 138/138 pass.

---

## 2026-07-27 — L1's HQ (and every other L1 pad) buried under the map (v0.19.9)

Reported as "something happened with the HQ on level 1, it broke the map".
Every auto-snapped pad on L1 — HQ, the cargo depot and Verdant Depot — was
sitting at y≈1340 instead of on the hills, i.e. below the level's own
`worldBounds.bottomY` of 1050, with the lander spawning down there with them.

**Cause.** v0.19.6 (`fix(l4): ... fix cargo pickup surface detection on level
4`) made `getPolygonSurfaceY()` winding-agnostic, dropping the `p1.x < p2.x`
test that had restricted the scan to upward-facing floor segments. L1's ground
polygon closes with one flat edge running right-to-left from `{1640,1350}` back
to `{-960,1330}` — the polygon's underside. Once direction stopped mattering
that edge counted as a floor, and being the deepest one at every x it won the
`maxSurfaceY` scan for the whole level.

**Fix.** Restored the direction-sensitive test and instead normalised each
polygon's winding first, reusing the signed-area check `generateTerrain()`
already ran on the same polygons (extracted as `polygonWindingSum()`, now
shared by both so they can't drift). Polygons authored the other way round —
L4's ridge, which is what v0.19.6 was chasing — get their endpoints swapped per
edge rather than the vertex list reversed, so each edge keeps the
`invisibleEdge` flag of the point that owns it.

L1's pads snap to y=770 / 420 / 700 again (the terrain vertices they sit
between), and L4's cargo pickup still works. Guarded by two new tests: one
asserts no auto-snapped pad on any level lands below its `worldBounds.bottomY`,
the other pins L1's three pads to their vertices. Both were confirmed to fail
against the reintroduced bug; 135/135 pass with the fix.

---

## 2026-07-11 — Night Ops rework: sonar ping + objective beam (v0.10.1)

User feedback on v0.10.0: the flashlight cone followed `lander.angle` so it
only ever pointed up(ish), and the overall look wasn't dark/tense enough.
Reworked `render/night.js`:
- **Tight lander glow** (radius 210 → 120 world px) and darker overlay
  (alpha 0.86 → 0.90) — the rest of the level is now genuinely hard to see.
- **Objective beam replaces the angle-following cone**: a narrow (~9°
  half-angle, 460 px) searchlight aimed at the next objective — mirrors
  `drawNextObjectiveArrow()`'s target logic (all delivered → HQ; empty deck
  → collection point; else the hub matching the first on-deck box) via a
  shared-logic helper `_nightObjectiveTarget()`.
- **Sonar ping**: every 5.2 s an annulus wavefront expands from the lander
  (0→1500 world px over 2.4 s), punched out of the darkness so terrain
  silhouettes are briefly revealed as it sweeps; hazards light up
  individually while the wavefront passes within 140 px of them (laser/
  crusher midpoint or polygon centroid). Hubs keep a constant faint glow.
- Verified by canvas alpha sampling: beam direction matches
  `atan2(target - lander)` (lit at 260 px along the beam, dark opposite);
  mid-travel ping ring reads lit on the wavefront and dark again inside it;
  L10's two crushers confirmed to have 2-pt `pts` so the reveal path fires.
  97/97 tests, 0 console errors. Feel-tuning by eye still pending (same
  caveat as v0.10.0).

---

## 2026-07-11 — Night Ops: darkness overlay + lander spotlight (v0.10.0)

New level-config flag `night: true` (`levelSchema.js`, alongside `heatHaze`)
retrofitted onto **L10: The Crystal Caves** — the outpost's lights are down,
so you fly the cave gauntlet on the lander's own spotlight.
- New mixin `render/night.js` (`drawNightOverlay()`): an offscreen canvas
  filled with a dark overlay, then `destination-out` punches a soft radial
  glow + forward-facing flashlight cone around the lander (oriented by
  `lander.angle`, matching `drawLander()`'s own rotation convention), plus
  smaller fixed ambient glows around delivery hubs and hazards (laser
  midpoint / polygon centroid via the existing `polygonCentroid()` helper)
  so the map is never fully unreadable outside the cone.
- Composites after the WebGL post-FX/particle passes, before the HUD-layer
  draws (wind indicator, minimap, vignettes) — the minimap draws to a
  separate `#radar-canvas` element so it's unaffected by construction, and
  the overlay doesn't depend on Settings → Visual Effects being on.
- Purely a rendering feature — no physics/gameplay changes.
- Verified via direct canvas alpha/pixel sampling (screenshot tooling was
  down this session): the darkness canvas correctly reads alpha 1 (fully
  lit) at the lander and full authored opacity in a far corner with the
  expected soft falloff between; a fixed terrain point measurably darkens
  with `night: true` vs `false` on the same level; non-night levels (L1)
  render completely unaffected. `tests.html` 97/97, 0 console errors.
- **Not yet done**: an eyeballed visual pass to tune the light radius/cone
  angle/darkness alpha for feel — the mechanism is confirmed correct, the
  numbers are unverified by eye. See PLAN.md step 6 for specifics before
  archiving this plan further.

---

## 2026-07-11 — TODO.txt retired (v0.9.3)

`TODO.txt` was the game owner's original wishlist; audited against the code
and every item had already shipped, so the file was deleted rather than left
to rot:
- Upgrade cost scaling by tier — `basePrice * 1.5^level` (`game/menu.js`).
- Mission budget risked from `globalCash` (entry fee + budget deducted at
  launch, `startLevel()` in `game.js`).
- Repo-man game-over below −$5000 (resets upgrades, keeps highscores, resets
  to starting cash) + a one-time warning on first going negative
  (`game/menu.js`, `repo-man-modal` / `negative-cash-warning`).
- Help box / tutorial modal (`#tutorial-modal` in `index.html`).
- Vehicle models rendered live on the vehicle-select buttons (the "Vehicle
  License" picker, `drawVehicleCanvases()` in `game/menu.js`).
- Shield regen delay with a 5s blink after taking a hit (`lander.shieldDelay`
  in `physics/entities.js`, blink in `game/hud.js`).

---

## 2026-07-11 — Vitals gauge cluster + shield gauge (v0.9.0)

User report: FUEL/HULL bars misaligned (the flex-wrap layout wrapped on
narrow screens), wanted car-style E→F markers, tick indicators, icons, and a
shield readout for the upgrade.
- **`#vitals-panel` rebuilt as a CSS grid gauge cluster** (icon+label | E |
  bar | F columns, `display:contents` row wrappers) — rows stay pixel-aligned
  at any width. Icons: ⛽ fuel, 🔧 hull, 🛡️ shield.
- **E / F end-markers** on the fuel gauge and **quarter-tank tick marks**
  (CSS `repeating-linear-gradient` overlay) on every gauge.
- **Shield charge gauge** — row hidden until the Shield Generator upgrade is
  owned; fill tracks `lander.shieldCharge`, flashes bright while a hit is
  being absorbed (`shieldHitFlash`). Blue→purple gradient fill.
- LOW FUEL warning moved to a full-width row under the gauges (was inline,
  contributing to the wrap misalignment). `toggleUI()`'s show-HUD path
  restores the panel as `grid` (was hardcoded `flex`).
- `probe-screenshot.html` gained a `&script=shieldGauge` repro (upgrade
  owned, partial fuel/hull/shield) for headless verification.

---

## 2026-07-11 — Mobile HUD compaction (v0.8.0)

User report (with phone screenshot): HUD fine on desktop but eats a third of a
phone screen; mission panel "bloated", level name doesn't need to be visible
all the time; wants other-games-style mission card that auto-hides.
- **Mission panel is now tap-to-collapse** — collapsed form is a slim chip
  (`▸ time · budget · 📦 n/m`, no level name). On phone-sized viewports it
  auto-collapses ~5s after mission start and re-expands (then re-collapses)
  on mission events: a delivery, a bonus quest resolving, overtime starting.
  Manually opening pins it open; manually closing re-arms auto behavior.
  Desktop starts expanded and stays (tap-toggle available everywhere).
- **Compact HUD media query** (`@media (max-height: 500px), (max-width:
  480px)` in `index.html`): tighter `.hud-group` padding/gaps/margins, radar
  scaled 260×160 → 170×105 CSS px and made translucent (opacity 0.62),
  smaller utility buttons/gauges. `isSmallViewport()` in `game/hud.js` uses
  the same thresholds so JS auto-collapse and CSS compaction trigger
  together.
- `probe-screenshot.html` gained `&vw=&vh=` params to size the game iframe
  (was hardcoded 1280×800) so responsive layouts can be screenshot-verified
  headlessly; verified at 900×420 (chip + compact HUD) and 1380×860
  (unchanged desktop layout), 89/89 tests green.

---

## 2026-07-11 — Architecture & docs consolidation pass (v0.7.6)

- **Vendored Matter.js** (`vendor/matter.min.js`, 0.19.0 from npm) — `index.html`
  and `tests.html` previously loaded it from the cdnjs CDN, a hard runtime
  dependency that broke the game *and* the whole test suite in any environment
  without CDN access (offline, proxied sandboxes — found because this session's
  proxy 403'd cdnjs, failing 3 tests with `Matter is not defined`).
- **Split `game.js` (2437 → ~1200 lines) into `game/` mixin modules**, same
  `Object.assign(CargoGame.prototype, {...})` pattern `render/*.js` already
  used: `game/input.js` (keyboard/mouse listeners, gamepad polling),
  `game/menu.js` (menu screens, settings, upgrade shop, vehicle select,
  procedural config, dev panel), `game/hud.js` (in-mission HUD, mission panel,
  notifications, UI scale/collapse), `game/cargo.js` (delivery checks,
  `removeCargoBox`, payouts, box fire, delivery/explosion FX). Core loop,
  mission lifecycle, camera, and grapple stay in `game.js`. Load order:
  `game.js → game/* → render.js` (render.js instantiates `window.game`, so
  mixins land before the constructor ever runs).
- **Docs consolidated for agent navigability**: executed plans (`PLAN.md`,
  `LEVEL-IMPROVEMENT-PLAN.md`) archived into this file and deleted; README
  rewritten as current-state-only (changelog sections moved here); CLAUDE.md
  made environment-agnostic (the old headless recipe hardcoded a Windows
  Chrome path); `.agents/AGENTS.md` refreshed (referenced a nonexistent
  `/space-trucking/` project).

---

## Archived plan — "Next Steps Execution Plan" (was PLAN.md, written 2026-07-10)

Final status at archive time (2026-07-11): Phase 0 complete (4/4), Phase 1
4/5, Phase 2 2/5, Phase 3 not started. `tests.html` 89/89. **Still-open items
(1.2 refuel pads, 2.1 level-start hitch, 2.2 pendulum cargo, 2.3 sound polish,
Phase 3 bets) moved to README "TODO / Open backlog"** — what follows is the
record of the completed items.

### Phase 0 — verification & cleanup sweep (all done 2026-07-10)
- **0.1 Backlog audit**: confirmed the "Planned" README rows had actually
  landed in code (`levelGenerator.js` spacious-caves retune, `.hud-group`
  HUD-uniformity class), not just in docs. 89/89 tests green.
- **0.2 Raindrop-on-lens v3 playtest**: verified via probe screenshot +
  shader-source review (`h3 > 0.02` sparsity gate, tiny refraction/glint
  weights). Deliberately near-invisible in a static screenshot — that's the
  requested subtlety.
- **0.3 Flavor-text audit**: fixed L1 (quest said "3 cargo", config says 2),
  L3 (hint omitted the twin lasers), L5 (hint omitted laser + incinerator),
  L7 (hint omitted the two laser gauntlets), L9 (quest named a nonexistent
  "Suspended Hub"; real hub is "Cauldron Hub"). L2/L4/L6/L8 were accurate.
- **0.4 Root README refresh**: root `README.md` got a proper project index
  (was literally the word "testing").

### Phase 1 — gameplay quick wins
- **1.1 Big Cargo (done)**: `spawnCargo(..., {big: true})` — `BOX_SIZE * 1.8`,
  mass 2.2, 🏗️ icon, claims the entire deck (`deckHasBig` capacity check in
  `updateOnDeckStates()`, `physics/entities.js`); a big box always sits
  dead-center. Fixed two latent bugs found on the way: the landing-detection
  window and `deckN`/render size were keyed to the global small `BOX_SIZE`
  instead of each box's own half-size. Drone needed no changes
  (`grabbedBoxId` was already single-slot). Wired into L9's three heavy
  crates; behavioral test added (88 → 89 tests).
- **1.3 heatHaze on L6**: already set in `level6.js`; verified labels stay
  readable via probe screenshot.
- **1.4 Editor: preserve L9's `outOfBounds: true` shorthand (done)**: the old
  exporter emitted an empty `outOfBounds: {}` for it (`Object.entries(true)`
  is `[]`). `applyConfig()` now tracks `S.oobIsBoolean` and the exporter
  round-trips the boolean verbatim; editing any OOB field clears the flag.
- **1.5 Mobile touch buttons dead before fullscreen (done)**: root cause was
  CSS `100vh` (which ignores mobile browser chrome) vs. the JS-sized canvas
  (`window.innerHeight`) — bottom-anchored touch buttons sat under the
  browser toolbar. Fixed with `height: 100dvh` fallback +
  `env(safe-area-inset-bottom)`. Also removed a duplicate never-bound
  `#mobile-controls` div and an orphaned `#fullscreen-prompt` modal.

### Phase 2 — feel & performance
- **2.4 Experimental touch joystick (done)**: Settings → "Touch Controls:
  Joystick" (`cargoLanderTouchJoystick`, off by default) swaps the
  left/thrust buttons for a floating-origin drag stick (`#joystick-zone`,
  `setupJoystick()` in `index.html`), feeding `game.keys['joy_*']` — same
  boolean-key shape as keyboard/gamepad, zero physics changes. Real
  touch-hardware feel test still pending.
- **2.5 Gamepad support (done)**: `pollGamepad()` in `game/input.js` merges
  left-stick X + right trigger into `keys['gp_*']`; A mirrors SPACE
  (extract/grapple), B force-releases cargo; connect/disconnect toasts.
  Start=pause dropped — the game has no pause state to hook into. Real
  hardware test still pending.

---

## Archived plan — "Level Improvement Plan L2–L9" (executed 2026-07-10, v0.6.8 → v0.7.0)

High-level design plan for improving levels 2–9 against L1 as the benchmark
(organic terrain, environmental storytelling, one clear skill test per level,
loop-shaped routes). The identified anti-patterns: boxy low-vertex terrain,
laser overuse diluting hazard identity (target order: wind L3 → gravity well
L4 → winch+first laser L5 → worm L6 → fuel/distance L7 → laser gauntlet L8 →
everything L9), dead space, and difficulty-ordering wobbles.

**Every level L2–L9 got its planned pass, one commit per level**, verified via
`tests.html` (89/89 throughout) + headless probe screenshots. Notable
deviations from the written plan:
- L4 `targetCargo` raised 3→4 (two hubs, keeps L2's 2-per-hub sorting feel).
- L4/L7/L9 water bodies are flavor-only (default drag/buoyancy), not scripted
  hazards.
- L8's "escalate the return gauntlet after final delivery" stretch goal was
  **not** implemented — no engine hook exists for quest-triggered hazard
  state; noted as a possible follow-up.
- Bug found in passing: L9's left-shelf tower had `type: 'comms'`, which has
  no render branch in `drawBuildings()` — invisible in-game with zero errors.
  Swapped to `'antenna'`.

---

## Archived from README (2026-07-10 state)

### The "flat blue rectangle" saga (resolved in v0.3.0)
Kept as a paper trail because each wrong diagnosis was plausible:
1. First guess: `drawFluidBounds()` abyss boundary (a real feature) — wrong.
2. Second guess: `drawWaterBodies()` ignoring `body.surfaceColor` (a real bug,
   fixed in v0.2.1 — L9's acid pool was drawing blue) — but not what the user
   screenshotted; their rectangle was on L1, whose lake sets no
   `surfaceColor`.
3. Actual root cause: the post-FX shader (`renderPostFX`, `shaders.js`)
   sampled the scene texture with an inverted Y on top of an upload that
   already had the top row at v=0 — every effect region drew a **vertically
   mirrored copy of the scene**. The lake's screen-space bbox filled with
   upside-down sky reads as a flat blue rectangle. The same bug mirrored the
   "PICK UP"/"DELIVER HERE" labels on heat-haze levels, earlier misread as
   haze "garbling" text (which had prompted an unnecessary amplitude nerf,
   later partially restored to 1.2/0.6). The user's "the image is also upside
   down" comment was the giveaway.

### Completed TODO ledger (2026-07-05 → 2026-07-10)
All of these are done and verified in code (not just in notes):
- Level Editor / renderer parity, scalar-field half: `levelSchema.js` drives
  the editor's Metadata/Palette/OOB/Gravity Well panels, loader defaults,
  export blocks, and `tests.html`'s validation checks from one schema. Fixed
  `heatHaze` (no editor UI, silently dropped on export) and
  `rockGlow`/`fog` (not editable) as side effects. Geometry deliberately NOT
  schema-driven (bespoke per-shape-kind vertex tooling) — still open, see
  README backlog.
- Thruster smoke + falling-fast RCS puffs; racing-stripe/gloss lander paint.
- Parachute-on-empty-fuel (`lander.chuteDeployed`, ~1s deploy, vy capped
  ~2.2 — risky-but-survivable impact speed by design).
- Rain-on-lens v3 (specular glint + trickle trails were the missing
  ingredients; kept deliberately sparse/subtle per feedback).
- Level-start hitch *diagnosed* (synchronous `initLevel()` Matter-world
  rebuild + convex decomposition) — fix still open, see README backlog.
- Post-FX follow-ups: heatHaze extended to L6; `renderPostFX()` supports max
  4 water bodies per level (fixed-size uniform arrays — bump both the array
  size and the `Math.min(4, ...)` clamp in `render.js` if ever needed).
- Editor UI for the `incinerator` hazard type; incinerator used on L4.
- Mission grid + dev-panel buttons generated from `levels[]`
  (`generateMissionUI()`).
- `game.js` split into `render.js` + `render/*.js`; `physics.js` split into
  `physics/*.js` (2026-07-11 pass later split `game/*.js` too).
- Test suite rebuilt 7 → 68 → 89 tests: the original DOM stub was missing
  `appendChild`/`dataset`, so 6 of 7 behavioral tests had been silently
  failing; added the schema-driven "Level Config Validation" category (caught
  L9's missing `budget`/`palette`).
- Cargo-box laser collision cleanup: `physics/atmosphere.js` flagged
  `box.lost` but nothing removed the box; `game.js`'s cleanup pass now routes
  it through `removeCargoBox()`.
- `music1.mp3` re-encoded 6 MB → 2.3 MB; `'advanced'` vehicle dead code fully
  removed; unused sprite PNGs (old 2D Sprites Mode) removed.

### Completed user-feedback backlog (all shipped)
Difficulty spikes in L1–L7 geometry eased; L6 sandworm spawn fixed; gravity
well made chill/pulsing with black-hole shader; base fuel raised to 120; HQ
refuel pad; LOW FUEL warning; editor add/remove-hazard buttons; "fun stuff"
pass (collectibles, economy popups, crushers); editor playtest/download/
upload workflow + game↔editor links; procedural mode with 3 craziness tiers;
biome weather (snow L3, rain L1, ooze L5, heat L2/L4); intro camera animation
scrapped in favor of instant start; spacious-caves generator retune
(step 180–430, reduced Y-variance); predefined background buildings replacing
random placement; pad dashed ovals removed (radar ping kept); dropoff
active-light indicator; cargo drop animation + "press space to attach" +
mobile button; mobile radar/mission-panel collapse; HUD uniformity
(`.hud-group` shared styling).

---

## 2026-07-10 — shared level-config schema for the editor + test suite (v0.5.0)
- **Added `levelSchema.js`** — a single schema (field name, type, default, UI
  widget hint) for the scalar/object-shaped fields of a `registerLevel({...})`
  config: mission params, `palette`, `outOfBounds`, `gravityWell`. Previously
  `level-editor.html` maintained its own hand-written parser/UI/exporter for
  these fields, kept in sync with the game and with `tests.html`'s validation
  assertions entirely by memory, and had already drifted (`heatHaze` had no
  editor UI at all and was silently dropped on export; `palette.rockGlow`/
  `palette.fog` round-tripped but weren't editable).
- **`level-editor.html`**'s Metadata/Palette/Out of Bounds/Gravity Well sidebar
  panels, the loader's per-field defaults, and the export-block generator are
  now all driven by `levelSchema.js`. Added headless-verification hooks
  (`?autoload=levelN.js&dumpExport=1&openPanels=1`), mirroring
  `probe-screenshot.html`'s pattern.
- **`tests.html`** validates the scalar/object sections generically against
  `LEVEL_SCHEMA` via `schemaCheckSection()`, plus new per-level out-of-bounds
  and gravity-well cases. Test count: 68 → 88.
- **Built by a background agent** in a separate git worktree, merged via
  rebase.

## 2026-07-10 — parachute mechanic, thruster FX, lander paint, rain v3
- **Parachute-on-empty-fuel** — `chuteTimer` in `applyGravityAndWind()`
  (`physics/atmosphere.js`) deploys after ~1s of fuel-out freefall; extra vx
  drag + asymptotic vy cap toward ~2.2 (≈12 damage on impact — often
  survivable, by design). Canopy + swaying suspension lines in
  `drawLander()`, counter-rotating 65% against hull tilt. Verified with a
  synchronous 90-frame sim (`probe-screenshot.html`'s `parachuteSim` script)
  since `--virtual-time-budget` doesn't reliably tick rAF.
- **Thruster smoke + falling-fast RCS puffs** (`physics/entities.js`) — smoke
  trails the main flame; cyan stabilizer puffs fire from the hull top when
  falling fast (`vy > 3.5`) without thrust. Shares the global 300-particle
  cap.
- **"Hot rod" paint pass** — center racing stripe tinted to the existing trim
  color + glossy top-edge highlight, layered onto the existing body shapes.
- **Rain droplets v3** — reworked from a real rain-on-car-window reference:
  the missing ingredients were a specular glint per drop and tapering trickle
  trails under ~40% of drops. Kept far sparser/fainter than the reference per
  "way more subtle" feedback.
- **L3 weather fixed `'rain'` → `'snow'`** — an ice biome was raining; the
  name-based fallback in `startLevel()` never ran because the explicit config
  always won.

## 2026-07-10 — minimap fix, gameplay-fairness bugs, rain v2
- **Fixed the radar minimap being invisible** — a global
  `canvas { position: absolute; width:100%; height:100%; }` rule (meant for
  the two full-screen game canvases) matched `#radar-canvas` too, collapsing
  `#radar-container` to 2×2px with zero console errors. Caught only by the
  headless `&debug=1` computed-style probe. Fixed with a `#radar-canvas`
  override at its native 260×160.
- **Fixed a reward exploit** — the overtime auto-extraction path called
  `completeMission()` without checking deliveries, so limping home with 0
  cargo still paid full reward. The `allDelivered` check now lives inside
  `completeMission()` itself; failing it routes to `failMission()`.
- **Monster devour = hard mission failure** — `lander.eatenByMonster` now
  branches the crash handler to `failMission("Consumed by the anomaly.")`
  instead of the recoverable-crash path. Other crash sources unchanged.
- **Rain droplets v2** — thinned the field, elongated beads (superseded by
  v3, above).
- **Headless-Chrome verification workflow formalized** — standing instruction
  added to CLAUDE.md after the minimap catch; `probe-screenshot.html` gained
  `&debug=1`, `&hide=fn1,fn2`, and `&script=name` (scripted repros:
  `eatenByMonster`, `noCargoExtract`).

## 2026-07-10 — post-FX Y-flip fix + rain droplets on the lens
- **Fixed the post-FX pass rendering effect regions vertically mirrored** —
  the real root cause of the "flat blue rectangle over the L1 lake" (see the
  saga above). One line: the fragment shader flipped `srcUV.y` on an upload
  that already had the top row at v=0.
- **Rain droplets on the camera lens** — two screen-space procedural droplet
  layers (hash-per-cell, 130px/61px grids) that trickle and refract an
  inverted mini-image of the scene with a rim highlight. Active only on
  `weather: 'rain'` levels; gated by the Settings → Visual Effects toggle.
  Tunables live in the `droplet()` GLSL helper + `u_rainAmount` block in
  `shaders.js`.
- **Heat-haze amplitude partially restored** (0.8/0.4 → 1.2/0.6) — the
  "garbled labels" that prompted the nerf were the Y-flip, not wobble.
- **`probe-screenshot.html` added** — headless visual-verification harness.

## 2026-07-10 — auto-scaled mobile UI default
- **`uiScale` picks a first-run default from viewport size**
  (`computeDefaultUIScale()`): ≤420px tall → 72%, ≤480px shortest side → 80%,
  ≤820px → 90%, else 100%. Only the first-run default — a saved
  `cargo_lander_ui_scale` value always wins.

## 2026-07-10 — GPU post-processing shaders + mobile rotate tip
- **New WebGL post-processing pass** (`renderPostFX()` in `shaders.js`, wired
  from `render.js`) — uploads the drawn Canvas2D scene as a texture and
  redraws a warped version where an effect region is active; untouched areas
  stay transparent. Three effects share one shader program:
  - **Heat haze** — screen-wide sine UV wobble, per-level `heatHaze: true`
    flag (L2, L4, later L6). World-space text labels do get wobbled — a real
    trade-off of full-scene sampling.
  - **Water shimmer** — localized distortion per water body's screen-space
    bbox (max 4/level), automatic on any level with water.
  - **Gravity lensing** — pulls sampled pixels toward `gravityWellPos`,
    deliberately subtle.
  - Toggleable via Settings ("Visual Effects", `cargoLanderPostFX`); skips
    the texture upload when off or when a level has no applicable effects.
- **Fixed L9's acid pool never rendering** — used the old `{x,y,w,h}` rect
  shape but `drawWaterBodies()` only reads `pts` polygons; silently skipped.
  Converted to a 4-point polygon.
- **Rotate-to-landscape tip** (`#rotate-tip`, `checkOrientationPrompt()`) —
  non-blocking overlay on portrait phone-sized viewports during a mission.
  Gated on aspect ratio + `min(w,h) <= 820` (not touch detection) so it's
  exercisable by resizing a desktop browser. Re-arms per `startLevel()`,
  never re-shows mid-mission once dismissed.

## 2026-07-10 — incinerator hazard, laser cargo cleanup, test suite rebuild
- **New `incinerator` hazard type** (`physics/atmosphere.js`,
  `render/entities.js`) — a polygon zone with the laser's charge → active
  duty cycle; damages the lander and instantly destroys cargo caught inside.
  Renders idle/charging/active states mirroring the laser's language. Demoed
  as L4's lava vent field.
- **Fixed laser hazards not cleaning up destroyed cargo** — `box.lost` was
  set but nothing removed the box or freed its Matter body; the cleanup pass
  now routes through `removeCargoBox()`.
- **`tests.html` rebuilt 7 → 68 tests** — fixed the DOM stub (6 of 7 tests
  had been silently failing), added the "Level Config Validation" category;
  caught L9's missing `budget` and `palette`.
- **Fixed stale `level4.js` description** — referenced a hub and cargo type
  that don't exist; rewritten around the actual incinerator mechanic.

## 2026-07-05 — late-night pass
- **Water bodies got a real bounce** — `applyWaterBounce()`: 0.55 restitution
  rebound with splash, mild buoyancy + drag while submerged.
- **Cargo dispense retuned** — 2.5s base delay (was 0.9s), +1s/box
  escalation, cap 4 (was 6).
- **Shield reworked into real damage mitigation** — `applyDamage()` is now
  the single entry point for all 7 hit sources; a depletable
  `lander.shieldCharge` (50 × level) mitigates 65% of each hit, passes
  everything through at 0 charge, regens slowly. `shieldAbsorbedThisHit`
  keeps deck cargo from being flung by cushioned hits. Visual rewritten:
  layered radial gradient, blurred halo, rim edge, specular arc reacting to
  hits and charge.

## 2026-07-05 — evening UX/bugfix batch
- Dev Panel: "Unlock All Missions" checkbox (`devUnlockAll`); added the
  missing L9 jump button.
- Upgrade audit: `winchExtender` was never applied to rope length (now +50
  units/level) and `shieldRegen` read the wrong object path
  (`career?.upgrades` vs `upgrades`) so the shield never worked. Both fixed;
  the other 4 upgrades were verified correctly wired.
- Procedural missions: 3 hardcoded buttons → one entry with a difficulty
  slider (snaps to the generator's 3 discrete tiers).
- Tutorial messages restyled as chips under the mission panel; mission-panel
  spacing fix; level-start camera is now a pure zoom-in; options dropdown
  wrap/anchor fixes.
- Gravity well toned down **twice** — second pass found `this.shaderOverlay`
  (never assigned; real property `this.shaders`) meant the Canvas2D fallback
  always drew on top of the WebGL shader. Ash weather now spirals into the
  L4 well.
- Explosion effect overhauled: staged burst (flash core, fireball, ballistic
  debris, lingering smoke) + stronger death shake; pure Canvas2D, zero deps.
- "Unload drone as R&D upgrade" — **not** implemented; ambiguous ask with
  soft-lock risk (release is a core mechanic L5 requires). Still parked, see
  README backlog.

## 2026-07-05 — afternoon UX/perf pass
- **Mission progression gating** — `isLevelUnlocked(idx)` requires a
  highscore on the previous mission; dev-panel jumps bypass.
- **2D Sprites Mode removed** — vector lander was the only reachable path.
- **OOB mist fix** — intensity was driven by the camera edge, not the lander.
- **Wind HUD scales with UI Scale**; wind readout exponentially smoothed.
- **Monster fixes**: spawns using real on-screen half-extents; lingers ~1.5s
  after eating; `spawnLander()` clears monster/OOB-timer/sandworm state so
  respawns aren't instantly re-eaten.
- **Ambient traffic fixes**: spawn-Y spread with min-gap retry; evasive
  maneuver made dt-scaled, cooldown-gated, bounded, and probabilistic (60%).
- **Weather/wind perf** — hard caps (120 weather particles / 70 wind
  streaks); neither system ever touched Matter.js.
