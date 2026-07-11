# CargoLander — Improvement Plan (written 2026-07-11)

Execution plan for the next wave of work. Written to be executed item-by-item
by an agent. **Read [CLAUDE.md](CLAUDE.md) first** — its standing instructions
apply to every item here: `node --check` each modified file, run
[tests.html](tests.html) to **0 failed**, exercise new mechanics against the
live `game`/`game.physics` objects, bump `CargoGame.VERSION`, then commit and
push. One item = one commit (or one small branch for M/L items). Check items
off here (`[x]`) as they land; when the plan is done, archive it into
HISTORY.md per the project convention.

Effort: S = under half a day, M = 1–2 days, L = multi-day.
Do the tiers in order; within a tier, order is a suggestion.

---

## Tier 0 — Hygiene & unfinished business (do first, all S)

### 0.1 Register `level10.js` in tests.html  `[ ]`
`level10.js` (L10: The Crystal Caves) is loaded by `index.html` (script tag
~line 2233) but **missing from `tests.html`** (its level scripts stop at
`level9.js`, ~line 309). The suite's schema-driven "Level Config Validation"
iterates `levels[]`, so L10 is silently never validated — this violates the
project's own "add to both files" rule (CLAUDE.md).
- Add `<script src="level10.js"></script>` after level9's tag in `tests.html`.
- Run the suite; fix any L10 validation failures it surfaces (that's the point).
- **Verify**: tests.html reports 0 failed and the level-validation category
  now covers L10.

### 0.2 Retire TODO.txt and fix doc rot  `[ ]`
Every item in [TODO.txt](TODO.txt) has shipped (verified in code):
upgrade cost scaling (`game/menu.js` ~line 437, `basePrice * 1.5^level`);
entry fee + budget risked from `globalCash` (`game.js` ~lines 376–379);
repo-man game-over below −$5000 + first-negative bank warning
(`game/menu.js` ~lines 73–92, `repo-man-modal`, `negative-cash-warning`);
shield regen delay w/ 5s blink (`physics/entities.js` ~line 165
`shieldDelay = 300`, blink in `game/hud.js` ~line 179); tutorial modal
(`index.html` `#tutorial-modal`); vehicle models on select buttons (item 0.3).
- Delete TODO.txt; add a short HISTORY.md entry noting all its items shipped.
- README fixes: file table says "level1.js – level9.js" → include level10.js;
  add level10 to the load-order paragraph.
- **Verify**: README/HISTORY render sensibly; no code changes, no version bump.

### 0.3 Finish & commit the WIP "Vehicle License" picker  `[ ]`
Uncommitted diff in `game.js`, `game/menu.js`, `index.html`: a main-menu
vehicle picker with animated lander canvases (sway + occasional thruster
puffs via `drawVehicleCanvases(dt)` called from `update()` while in menu).
- Review the diff as-is. Watch two things: (a) `renderModel` swaps `this.ctx`
  and stubs `this.physics.lander` — confirm menu-time animation can never run
  while a mission is active or leave a stub lander behind when one starts;
  (b) it uses `Date.now()` for animation phase — fine, but make sure the
  large hidden canvases (`canvas-vehicle-*-large`) aren't wasting per-frame
  draws (the diff's own comment says they're hidden by default — skip them
  unless their modal is open).
- **Verify**: menu shows both animated vehicles; start a mission with each;
  tests 0 failed. Commit with a minor version bump.

---

## Tier 1 — Existing backlog, now concretized (README backlog items — the
README's entries remain the source of truth; extra detail here)

### 1.1 Refueling stations  `[ ]`  (M) — gates item 3.1
Per README backlog: level-config `refuelPads: [{x, width, pricePerUnit}]`.
- Add the field to `levelSchema.js` (editor + validation pick it up free).
- Generalize the HQ refuel logic (`game.js` ~lines 977–984: refuel while
  landed, cost from `missionBudget`) into a pad-based check; HQ becomes the
  degenerate case.
- Render pads in `render/entities.js` (reuse hub-pad drawing w/ a ⛽ marker);
  HUD toast on refuel start/stop (`addMessage` in `game/hud.js`); pump SFX in
  `audio.js` (~20-line pattern like existing cues).
- Place 1–2 pads on L8, L9, L10 (longest maps). Add a behavioral test.
- **Verify**: land on a pad with partial fuel → fuel rises, budget falls at
  `pricePerUnit`; stops at full or at budget 0; tests 0 failed.

### 1.2 Level-start hitch — profile, then fix only the dominant cost  `[ ]`  (M)
Per README backlog. `performance.now()` around `initLevel()` sub-steps
(Matter world build, convex decomposition, traffic pre-spawn), L1 vs L8/L9/L10.
Candidate fixes in order: cache convex decompositions per level; defer
ambient-traffic pre-spawn a few frames. Do **not** spread `initLevel()`
across frames without explicit approval (code assumes fully-initialized
level after `startLevel()`).
- **Verify**: measured before/after numbers in the commit message; tests green.

### 1.3 Sound polish pass  `[ ]`  (S–M)
Per README backlog: refuel pump (pairs with 1.1), big-cargo clamp thunk
(hook `updateOnDeckStates()` big-box claim), escalating low-fuel heartbeat
below 15% (tempo scales as fuel → 0), pendulum rope creak (only if 1.4 ships).
Each ~20 lines in `audio.js` matching existing synth patterns.
- **Verify**: trigger each cue in a live session; no console errors.

### 1.4 Pendulum-mass special cargo  `[ ]`  (M–L)
Per README backlog: `cargo: 'pendulum'` — box hangs from the *basic* lander
on a rope (reuse the drone winch's Matter constraint pattern in
`physics/entities.js`); delivery = lower the box onto the pad. Introduce on
one level. Lives or dies on feel — tune swing damping in a real playtest and
flag for the user to feel-test before calling it done.

### 1.5 L8 return-gauntlet escalation  `[ ]`  (M)
Per README backlog: after the final delivery, speed up / phase-flip the laser
gauntlet ("defense grid alerted"). Needs a small engine hook for
quest-triggered hazard state: e.g. a level-config callback
`onAllDelivered(physics)` invoked from `checkCargoDelivery()`
(`game/cargo.js`) that may mutate `hazard.onMs/offMs/phase`. L9 already uses
`setupPhysics()` callbacks — follow that pattern.
- **Verify**: scripted repro in `probe-screenshot.html` (`&script=`) showing
  changed laser timing post-delivery; tests green.

---

## Tier 2 — New high-impact items (best value-per-risk from this review)

### 2.1 Per-level medals (3-star system)  `[ ]`  (M)
Each mission grades three medals: **Delivered All**, **No Damage**
(`hadCrash === false` and no `applyDamage` hits — track a flag), **Time Par**
(finish with ≥25% of `timeLimit` left). Store per-level best medals in
localStorage (`cargoLanderMedals`), render ★★★ on the mission grid buttons
(`generateMissionUI()` in `game/menu.js`) and on the victory screen
(`completeMission()` in `game.js`). Optionally fold medal count into the
pilot-rank formula (`game/menu.js` ~line 168) alongside highscores.
- **Why**: turns 10 finished levels into 30 replayable goals — biggest
  retention win available for the effort.
- **Verify**: earn/miss each medal in live play; localStorage survives
  reload; new behavioral test for the grading function.

### 2.2 Post-mission debrief ("why did I fail / how did I do")  `[ ]`  (S–M)
The victory/game-over screens show payout lines only. Add a compact debrief:
fuel used, damage taken (and its top source — track source tag in
`applyDamage()`), cargo lost, time used, medal results (2.1). On failure,
lead with the cause (`failMission(reason)` already has it) plus one
contextual tip (e.g. death by laser → "lasers telegraph with a charge glow —
wait out the cycle").
- **Why**: converts frustrating deaths into learnable ones; cheap because the
  stats mostly exist on `game`/`lander` already.

### 2.3 Daily Challenge (seeded procedural mission)  `[ ]`  (M)
`levelGenerator.js` already makes "Mission ??" maps. Add a date-seeded PRNG
(mulberry32 of `YYYY-MM-DD`) so everyone gets the same map each day; a
"Daily Challenge" card on the menu; localStorage for daily best + streak
counter (`cargoLanderDaily`). One attempt counts for score; free retries
allowed but flagged. Pure client-side.
- **Why**: a reason to open the game every day; reuses the generator wholesale.
- **Verify**: same date string ⇒ identical level (test the seeded generator
  determinism in tests.html); streak increments across simulated days.

### 2.4 Ghost replay of your best run  `[ ]`  (M–L)
Record `{x, y, angle, thrust}` at ~10 Hz during a mission (few KB); if the
run sets a level highscore, persist it (`cargoLanderGhost_<level>`). On
replay, draw a translucent lander (reuse `drawLander` with alpha) following
the recorded path, interpolated. Toggle in settings.
- **Why**: makes highscore-chasing tangible; pairs with 2.1's Time Par medal.
- **Risk**: memory/size — cap recording length; skip on procedural levels.

### 2.5 Assist options (accessibility)  `[ ]`  (S)
Settings toggles: **Stability Assist** (auto-level toward angle 0 when no
input, like the drone's auto-hover but for basic) and **Gentle Gravity**
(×0.8). Active assists disable highscore/medal recording for the run (show a
small "ASSIST" tag on the HUD). Wire into `inputState`/lander integration in
`physics/entities.js` + settings modal in `game/menu.js`.
- **Why**: the early difficulty cliff is the biggest funnel leak for new
  players; this is the cheapest fix that doesn't touch level design.

### 2.6 New cargo behavior flags: fragile & timed  `[ ]`  (M)
Two level-config cargo flags, same pattern as `{big: true}`:
- `fragile: true` — box takes damage from hard landings/impacts (reuse the
  impact-speed check from lander damage); destroyed above a threshold; pays
  a premium. Visual: cracks overlay by damage tier.
- `expiresSec: N` — perishable; countdown ring drawn over the box
  (`render/entities.js`); worthless (or lost) at 0.
Add to a couple of existing levels' cargo lists + schema/tests.
- **Why**: multiplies challenge variety with zero new level geometry.

### 2.7 Shareable level codes (editor ↔ game)  `[ ]`  (S–M)
The editor already exports a full `registerLevel({...})` block and the game
has a custom-level upload flow (`game/menu.js`). Add copy-paste **share
codes**: JSON → `LZ`-less `btoa(encodeURIComponent(json))` string with a
`CLV1:` prefix; "Copy share code" in the editor, "Paste share code" next to
the upload button in the game. Pure client-side sharing via Discord/email.
- **Why**: community content loop with ~zero new surface; the hard parts
  (export/import/validation) already exist.

---

## Tier 3 — Big bets (plan/confirm with the user before starting; L)

- **3.1 Massive scrolling level** — README's roadmap flagship. Gated on 1.1
  (refuel pads). 3–4× L8 width, fuel-management core, waypoint hub chain
  (L9's `setupPhysics()` pattern), minimap as primary nav. **Check with the
  user before starting.**
- **3.2 Procedural Expedition mode** — rogue-like run of procedural maps,
  shared fuel/hull/cash pool, run summary + per-run highscore. Big UI
  surface; sketch the flow and confirm with the user first. Pairs naturally
  with 2.3's seeded generator.
- **3.3 Editor geometry schema-driving** — fold terrain/water/hazard polygons
  into `levelSchema.js`. Deliberately deferred (bespoke vertex tooling);
  treat as its own project.

**Parked (unchanged from README)**: unload-drone R&D upgrade; 4-water-body
uniform bump; automated mobile testing.

---

## Suggested first-week order

1. **0.1** level10 in tests.html (smallest possible fix, may surface real bugs)
2. **0.3** commit the vehicle-picker WIP (clear the working tree)
3. **0.2** retire TODO.txt + doc fixes
4. **2.5** assist options (cheap, big funnel win)
5. **2.2** post-mission debrief
6. **1.1** refueling stations (unlocks the flagship level later)
7. **2.1** medals (biggest retention item; ends the week on a feature)
