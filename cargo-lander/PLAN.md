# Cargo-Lander — Next Steps Execution Plan

Written 2026-07-10 for execution by a Claude (Sonnet) session. Each task is
self-contained: scope, files, concrete steps, and a verification recipe.
Work them **in order within a phase**; phases 1→3 are ordered by
value-per-risk. Do NOT start a Phase 3 task before Phase 1 is done unless the
user says so.

## Ground rules (read first, every session)

- Read `CLAUDE.md` and the README's **Verification** section before touching
  code. The standing instruction applies: test → fix → commit → push, and bump
  `CargoGame.VERSION` in `game.js` on every user-visible change.
- Verification baseline for every task below (referred to as **[VERIFY]**):
  1. Serve the folder: `python -m http.server 8177` from `cargo-lander/`.
  2. `tests.html` must report **0 failed** (88 tests as of 2026-07-10; the
     count may grow). Headless: `chrome --headless=new --disable-gpu
     --user-data-dir=%TEMP%\chrome-test --virtual-time-budget=15000
     --dump-dom http://localhost:8177/tests.html` and grep for `id="summary"`.
  3. Load `index.html`, start a mission, check console for errors.
  4. For visual work, screenshot via `probe-screenshot.html?level=N&x=..&y=..`
     (see README "Headless verification").
- The physics loop normalizes dt to 60fps frames (`dt = ms/16.666`) — new
  physics constants are per-60fps-frame. Cargo removal must go through
  `removeCargoBox()` in `game.js`, never a raw `boxes.splice()`.
- When a task here is finished, check it off in this file in the same commit.

---

## Phase 0 — Verification & cleanup sweep (small, do first)

- [ ] **0.1 Confirm the "Planned" backlog items actually landed.** The last
      commit (`182986c`) claims level spacing, incinerator-in-editor, UI
      updates, and physics optimization. Cross-check the two README backlog
      rows still marked *Planned* — **Level Spaciousness** and **UI
      Uniformity** — against the actual code/game. Play L3/L6 and a
      procedural map: are caves noticeably more spacious? Is the HUD aligned
      and consistently sized? Update the README backlog statuses to match
      reality; file anything still missing as a note under the relevant task
      below. No code change expected unless something regressed.
- [ ] **0.2 Playtest the raindrop-on-lens v3 effect.** Third iteration on the
      same "too much" feedback (README TODO). Start L1 (rain weather), watch
      the lens drops for ~60s at default zoom. If it still draws attention,
      reduce spawn rate/opacity ~30% in the raindrop code (grep `raindrop`
      in `render/effects.js` / `shaders.js`) and screenshot before/after.
      Otherwise mark the README TODO as confidently done.
- [x] **0.3 Flavor-text audit.** Done 2026-07-10 — fixed L1 (quest text said
      "3 cargo", config/hint both say 2), L3 (hint never mentioned the two
      laser hazards guarding the summit gap), L5 (hint omitted the laser +
      incinerator near the winch shaft), L7 (hint omitted the two 40dmg/sec
      laser gauntlets), L9 (quest text called the hub "the Suspended Hub",
      actual hub is named "Cauldron Hub" via `createDeliveryHub()`). L2/L4/
      L6/L8/levelTest already accurate. 88/88 tests still green. For each of `level1.js`–`level9.js` +
      `levelTest.js`, read `description`/`hint`/`missionTitle` next to the
      level's actual `deliveryHubs`, `allowedTypes`, hazards, and mechanics.
      The L4 "Deep Storage" drift was found by accident; do the systematic
      pass. Fix any mismatches. [VERIFY] (the config-validation tests will
      re-check shapes automatically).
- [x] **0.4 Root README refresh.** Already done — root `README.md` now has a
      proper project index (was "testing"). `old_README.md` is gone from disk
      (removed prior to this pass). `README.md` at repo root says just
      "testing". Replace with a short index: what lives at neskil.github.io,
      link to `cargo-lander/` (the flagship), one line each for the other
      folders (`games/`, `math/`, `converter/`, `supply-chain/`, `cv/`).
      Also consider deleting `old_README.md` (169 KB UTF-16 relic; its
      content is superseded by `cargo-lander/README.md`) — ask the user
      before deleting if in doubt.

## Phase 1 — Gameplay value: quick wins from the existing backlog

- [ ] **1.1 Big Cargo (oversized single-load crates).** Already spec'd in the
      README roadmap (Phase 2 table, "Oversized Big Cargo crates" row) with
      an implementation note: the on-deck slot system (`updateOnDeckStates()`
      in `physics/entities.js`) claims non-overlapping `deckT` slots per box —
      a `big` box claims a slot width equal to the whole `deckWidth`, which
      naturally blocks other boxes. Steps:
      1. Add a `big: true` (or `size: 'big'`) flag to the cargo-box spawn
         config; render it visibly larger (`BOX_SIZE * ~1.8`) with its own
         icon in `render/entities.js`.
      2. Slot claim = full `deckWidth`; also block the drone winch from
         grappling a second box while a big one is attached.
      3. Wire it into **L9 "The Cauldron"** first (it already uses `'heavy'`
         cargo and a drone-only depot via `setupPhysics()` in `level9.js`).
      4. Add a config-validation test in `tests.html` plus a behavioral test:
         spawn big box on deck → attempt second box → second box must not
         find a slot.
      [VERIFY], plus a real playthrough of L9.
- [ ] **1.2 Refueling stations (roadmap Phase 1, small slice).** HQ refueling
      already exists (backlog: "Fixed"). Generalize it: a level config field
      `refuelPads: [{x, width, pricePerUnit}]` — landing on one refuels at
      `pricePerUnit` deducted from `missionBudget`, with a HUD toast and pump
      SFX (reuse an existing `CargoAudio` cue). Schema: add the field to
      `levelSchema.js` so the editor and tests pick it up for free. Place one
      pad on the two longest maps (check which levels have the widest world
      bounds — likely L8/L9). Add a validation test. [VERIFY].
- [ ] **1.3 heatHaze on L6 (post-FX follow-up).** Set `heatHaze` in
      `level6.js` (Amber Dusk / Sand Worm — hot biome). Then screenshot the
      "PICK UP"/"DELIVER HERE" world-space labels at typical zoom
      (`probe-screenshot.html?level=5&...`) and confirm they stay readable —
      the haze wobbles world-space text (README post-FX notes). If unreadable,
      lower amplitude for that level rather than globally. [VERIFY].
- [ ] **1.4 Editor: preserve L9's `outOfBounds: true` shorthand.** Known gap:
      the editor's loader/exporter turns L9's boolean shorthand into a full
      default-filled object. In `level-editor.html`'s loader, detect
      `outOfBounds === true`, set a `S.oobIsBoolean` flag, and have the
      export-block generator emit `outOfBounds: true` verbatim when the flag
      is set and no OOB field was edited (any edit converts to object form —
      that's fine, just deliberate). Verify with the editor's headless
      round-trip: `level-editor.html?autoload=level9.js&dumpExport=1` and
      diff against the source. [VERIFY].

- [x] **1.5 Fix mobile touch buttons before fullscreen (user-reported bug,
      2026-07-10).** **Root cause found and fixed 2026-07-10:** `body` and
      `#game-container` used `height: 100vh`, and `#mobile-controls` is
      `position: absolute; bottom: 20px` inside that container. Mobile
      browsers report `100vh` as the height *without* their address-bar/
      toolbar chrome subtracted, while the canvas itself is sized off
      `window.innerHeight` (JS, which already accounts for the visible
      area) — so on a non-fullscreen mobile page the CSS box (and anything
      bottom-anchored inside it, i.e. the touch buttons) extended past the
      actually-visible viewport, into the region the browser's own chrome
      was covering. Fullscreen removes that chrome, `100vh` becomes
      accurate, and the buttons "start working" — but they were never
      broken, just off-screen/under the toolbar. Fixed by adding
      `height: 100dvh` (dynamic viewport height, modern-browser-supported,
      falls back to the existing `100vh` line above it) to both rules, plus
      `env(safe-area-inset-bottom)` clearance on `#mobile-controls` for
      notched devices while in there. Also found and removed two pieces of
      dead markup discovered while tracing this: a second, never-bound
      `#mobile-controls` div (duplicate ID — `document.getElementById`
      always resolves to the first one, so `setupMobileControls()` was
      always binding the live block; the second had nicer button styling
      but no HUD-toggle button, so it was left dead rather than swapped in)
      and an orphaned `#fullscreen-prompt` modal with no JS ever wiring up
      its Yes/No buttons or showing it. [VERIFY] — 88/88 tests green, no
      console errors, phone-portrait (375×812) menu/HUD screenshot checked.
      True on-device touch confirmation still pending (this environment has
      no real touch hardware) — flagged as a note for whoever next has a
      physical phone handy.

## Phase 2 — Feel & performance

- [ ] **2.1 Profile then fix the level-start hitch.** Diagnosed but not fixed
      (README TODO): `physics.js initLevel()` synchronously rebuilds the
      Matter world, decomposes all terrain polygons, spawns lander + ambient
      traffic. **Profile first** — wrap the sub-steps
      (`_buildMatterWorld()`, `generateTerrain()`, `setupPhysics()`, traffic
      pre-spawn) in `performance.now()` timers, log a table on level start,
      and check L1 (simple) vs L8/L9 (complex) in the browser. Then fix only
      the dominant cost. Likely cheap wins, in preference order:
      (a) cache convex decompositions per level (terrain polygons are static
      per level file — keyed by level name, invalidated never); (b) defer
      ambient-traffic pre-spawn by a few frames; (c) only then consider
      spreading `initLevel()` across frames (touchy — rest of the code
      assumes a fully-initialized level after `startLevel()`). Record the
      before/after timings in the commit message. [VERIFY] + confirm no
      hitch by feel on L8.
- [ ] **2.2 Pendulum-mass special cargo (roadmap Phase 2).** A cargo box that
      hangs from the *basic* lander by a rope (the drone winch constraint in
      `physics.js` is the reference implementation — reuse the same
      Matter.js constraint pattern, don't invent a new one). Flag:
      `cargo: 'pendulum'` in level config / spawn table. Behavior: box dangles
      below the hull, swings with inertia, and its mass tugs the lander
      (this is the roadmap's "forces the player to balance flight" hook).
      Delivery = lower the box onto the hub pad (same touch check boxes
      already use). Introduce on ONE level or a new L10 rather than
      retrofitting everywhere; if adding `level10.js`, remember the manual
      `<script>` tag in `index.html` (mission-grid button is auto-generated).
      Add validation + a behavioral test (spawn pendulum box, step the sim,
      assert the constraint length holds). [VERIFY] + real playtest — this
      one lives or dies on feel; tune swing damping until it's fun, not
      punishing.
- [ ] **2.3 Sound polish pass.** The synth (`audio.js`) covers thrust,
      crash, delivery. Missing cues worth adding (all procedural, no files):
      refuel pump (1.2), big-cargo clamp thunk (1.1), pendulum rope creak on
      high swing (2.2), and a distinct low-fuel heartbeat that escalates
      below 15%. Keep each under ~20 lines of synth code, matching existing
      patterns in `audio.js`. [VERIFY] by ear in the browser.

- [ ] **2.4 Experimental virtual joystick for mobile (user request,
      2026-07-10).** Alternative to the button pad: a touch joystick —
      left-half drag = virtual stick controlling thrust (up) and strafe
      (left/right), right-half tap = action (grapple/attach), matching the
      existing button semantics. Implement as a Settings toggle
      ("Touch controls: Buttons / Joystick (experimental)") persisted in
      `localStorage`, defaulting to Buttons — do NOT replace the buttons.
      Render the stick base + nub on the canvas (`render/ui.js`) at the
      initial touch point (floating origin), feed values into the same
      `inputState` object `game.update()` already builds, no physics
      changes. Dead zone ~15%, and thrust should map analog (stick
      deflection → partial `enginePower`) if the input path allows it —
      otherwise threshold to on/off first and note the analog follow-up.
      Depends on 1.5 (touch handling must work pre-fullscreen first).
      Manual mobile QA + [VERIFY].
- [ ] **2.5 Gamepad (Xbox controller) support (user request, 2026-07-10).**
      Use the standard Gamepad API (`navigator.getGamepads()`, polled once
      per frame in `game.update()` — it's poll-based, no events needed for
      sticks/triggers). Mapping (standard layout): left stick X = strafe,
      right trigger (`buttons[7].value`, analog) = thrust, A = grapple/
      attach, B = release, Start = pause, with left stick up as an
      alternate thrust for pads without analog triggers. Merge into the
      same `inputState` alongside keyboard (gamepad active = last input
      wins, no mode switch needed). Show a small "🎮 controller connected"
      toast on the `gamepadconnected` event. Keep it ~100 lines in one
      place (`game.js` input section). Test with a real controller if
      available; otherwise verify no-regression with [VERIFY] and leave a
      note that hardware testing is pending.

## Phase 3 — Bigger bets (each needs a user check-in before starting)

- [ ] **3.1 Massive scrolling level (roadmap Phase 1 flagship).** One new
      hand-built level (`level10.js` or `level11.js`) that's 3–4× the world
      width of L8, built around fuel management: multiple refuel pads (1.2),
      waypoint-style hub chain (deliver at A unlocks cargo at B — can be
      faked with `setupPhysics()` callbacks like L9 does), and the minimap
      as the primary nav tool. Build the geometry in `level-editor.html`,
      export, playtest. Gate: do 1.2 first.
- [ ] **3.2 Procedural Expedition mode (roadmap Phase 3).** Rogue-like
      wrapper around `levelGenerator.js`: run = sequence of procedural maps
      with one shared fuel/hull/cash pool, persistent until death; a run
      summary screen; highscore per run in `localStorage`
      (`cargoLanderExpedition`). Big UI surface — sketch the flow in a short
      design note and confirm with the user before coding.
- [ ] **3.3 Editor geometry schema-driving.** Explicitly deferred in the
      README for good reason (per-shape-kind bespoke tooling). Treat as its
      own project; re-read the README's "Level Editor / renderer parity"
      entry first. Low priority unless editor work is on the menu anyway.

## Explicitly parked (do not do without the user asking)

- "Unload drone as R&D upgrade" — needs product clarification (soft-lock
  risk, see README TODO).
- Bumping the 4-water-body post-FX uniform limit — no level needs it yet;
  the README documents where to change it if one ever does.
- Mobile automated testing — manual QA recipe in the README is the process.
