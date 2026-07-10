# CargoLander History & Changelogs


## Checklist — 2026-07-05 late-night pass

- [x] **Water bodies now have a real bounce** — `physics.js applyWaterBounce()`.
      Hitting the surface with downward speed rebounds the lander (0.55
      restitution) with a splash burst; staying submerged applies mild
      buoyancy + drag so it settles into a bob. Previously `waterBodies` were
      purely decorative despite a comment claiming they were used for
      "hazard, water body" zone membership.
- [x] **Cargo dispense retuned** — was spawning almost immediately (0.9s) and
      capping at 6 on deck; now 2.5s base delay with a steeper escalation
      (+1s/box instead of +0.5s) and a cap of 4.
- [x] **Shield reworked into a real damage-mitigation mechanic.** Previously
      `shieldRegen` only slowly healed hull integrity directly — no
      absorption, no visual feedback loop. Added `physics.js applyDamage()`
      as the single entry point for all hit sources (terrain impact, hazard
      zones, lasers, ambient-traffic collision, water hazard drift — 7 call
      sites total), which:
      - drains a depletable `lander.shieldCharge` (`50 × shieldRegen level`)
        to *mitigate* 65% of each hit rather than block it outright, so a
        shielded hit still costs some hull;
      - once `shieldCharge` hits 0, subsequent hits pass straight through to
        hull until it recharges (slow passive regen, gated behind the
        existing hull-regen tick);
      - flags `shieldAbsorbedThisHit` for the frame a hit is (at least
        partially) absorbed, which `checkCargoDamage()` now checks — deck
        cargo isn't flung off from a hit the shield successfully cushioned.
      - Shield **visual** rewritten: was a flat filled circle; now a layered
        radial gradient (transparent center → glow toward the rim), a
        blurred outer halo (`ctx.filter = 'blur(4px)'`), a bright rim edge,
        and a specular shine arc — brightness/rim pulse react to
        `shieldHitFlash` on impact and to the current charge ratio.

## Checklist — 2026-07-05 evening UX/bugfix batch

Tracked here per-request so a future session can pick up anything left open.
All items below were addressed in this batch unless marked otherwise.

- [x] Dev Panel: added "Unlock All Missions" checkbox (`game.devUnlockAll`,
      `game.setDevUnlockAll()`) that bypasses `isLevelUnlocked()`. Also added the
      missing L9 dev jump button (only L1–L8 existed).
- [x] Upgrade audit: found and fixed two upgrades that were purchasable but had
      **no effect** — `winchExtender` was never applied to rope length (now
      `+50` world units per level in `physics.js spawnLander()`), and
      `shieldRegen`'s regen tick *and* its bubble visual both read
      `this.career?.upgrades?.[...]` instead of `this.upgrades?.[...]`, so the
      shield never worked despite being purchasable. Both fixed. Other 4
      upgrades (thrusterEfficiency, boostMode, magneticDeck, hullPlating)
      verified already wired up correctly.
- [ ] **"Unload drone" as an R&D upgrade** — not implemented. The ask is
      ambiguous: the drone's mid-air cargo release (`toggleGrapple()`) is a
      core mechanic several missions require (e.g. L5 The Needle's Eye);
      gating it behind a purchasable upgrade risks soft-locking new players
      who haven't bought it yet. Needs product clarification on what the new
      upgrade should actually do (a QoL improvement to release, vs. gating
      the ability itself) before implementing.
- [x] Procedural missions simplified from 3 hardcoded buttons
      (Normal/Crazy/Insane) to one "Procedural Mission" entry that opens a
      difficulty slider (`#procedural-config-screen`,
      `game.openProceduralConfig()`). `generateProceduralLevel(craziness)`
      itself still only supports 3 discrete tiers — the slider snaps to them
      rather than truly continuous difficulty (would need generator changes).
- [x] Level editor OOB boundary — **already worked**, just not obviously:
      `oob-surfaceY` / `oob-monsterDepth` number inputs in the Out of Bounds
      panel write straight into `S.oob` and the export block. No drag-to-set
      handle on the canvas though (would match the tool's other editing
      patterns better) — left as a nice-to-have.
- [x] Tutorial messages restyled as small chips docked under the mission
      panel (`drawNotifications()`) instead of large center-screen banners;
      non-tutorial messages (crash warnings, "Level Started", etc.) unchanged.
- [x] Cargo/Budget/Time text was crowding the divider above it in the mission
      panel — added breathing room (`drawQuestPanel()`).
- [x] Default UI Scale confirmed already 100% in code
      (`this.uiScale = ... || 1.0`); any other value seen was a leftover
      localStorage value from prior testing, not a code default.
- [x] Level-start camera intro was panning from the map's top-center to the
      lander *while* zooming in (looked like two separate motions) — now a
      pure zoom-in with the camera already centered on the start position.
- [x] Options dropdown: fixed labels wrapping to two lines (`white-space:
      nowrap` + widened the dropdown), and changed it from right-anchored
      (hugging the screen edge) to left-anchored under the icon row.
- [x] Gravity well toned down **twice** — the first pass only touched the
      Canvas2D fallback (`drawGravityWell()`); a separate bug
      (`this.shaderOverlay`, which was never assigned — the real property is
      `this.shaders`) meant the Canvas2D version *always* drew on top of the
      WebGL shader instead of only as its fallback, so both were rendering
      simultaneously. Fixed the property name and toned down the WebGL
      shader's own pulse intensity in `shaders.js`.
- [x] Anomaly Zone (L4, gravity well): weather (`ash`) was already configured
      but now also gets pulled toward the well as it drifts by, so the ash
      visually spirals into the black hole instead of the two systems
      looking unrelated.
- [x] Locked-mission "tooltip" — the 🔒 badge text under each locked mission
      button already serves this; no separate hover tooltip was added.
- [x] Removed "TEST: Sandbox" from the personal-best payouts list in the menu.
- [x] Explosion effect overhauled: was 60 uniform particles; now a staged
      burst — a bright flash core, a hot fireball layer, dark ballistic
      debris chunks, and slow long-lived smoke that lingers well after the
      fire fades — plus a stronger screen shake on death specifically (kept
      pure Canvas2D particles rather than pulling in a library, to stay
      consistent with the project's zero-dependency approach).

---

## TODO / Future Work (updated 2026-07-10)

Most of the 2026-07-05 list below turned out to already be done by the time of
the 2026-07-10 pass (confirmed by grepping the actual code, not just re-reading
old notes) — struck through and kept as a paper trail. Fresh items are at the
top.

- [x] **Level Editor / renderer parity system** (user request, 2026-07-10) —
      **scalar-field half done 2026-07-10 (later); geometry half explicitly
      deferred, see below.** Previously `level-editor.html` had its own
      hand-written parser + exporter for `registerLevel({...})` configs,
      maintained by hand in lockstep with whatever fields
      `level*.js`/`physics.js`/`render/*.js` actually use — every new field
      required updating the editor's parser, its UI, *and* its export-block
      generator, or the editor would silently drop/fail-to-preview it (this
      had already happened at least once: `heatHaze` had no UI at all and was
      silently dropped on export; the palette panel only exposed 5 of the 7
      `palette` keys, so `rockGlow`/`fog` round-tripped but were never
      editable).
      - Added `levelSchema.js` — a single schema (field name, type, default,
        UI widget hint) for the level-config's scalar/object-shaped fields:
        mission params (name/missionTitle/description/hint/gravity/wind/
        weather/budget/timeLimit/padScale/targetCargo/allowedTypes/
        heavyCargo/heatHaze/startX/startY/collectionX/collectionY/
        startDepotWidth/collectionWidth), `palette`, `outOfBounds`, and
        `gravityWell`.
      - `level-editor.html`'s Metadata / Palette / Out of Bounds / Gravity
        Well sidebar panels are now generated from this schema instead of
        static per-field HTML; the loader's defaults and the export-block
        generator read the same schema too. Fixed the `heatHaze` and
        `rockGlow`/`fog` gaps above as a side effect of no longer hand-coding
        the field list.
      - `tests.html`'s "Level Config Validation" category now runs the
        scalar/object checks (mission params, palette, out-of-bounds, gravity
        well) generically off `LEVEL_SCHEMA` via a shared
        `schemaCheckSection()` helper, instead of one hand-written assertion
        block per field — added dedicated out-of-bounds and gravity-well test
        cases per level that didn't exist before (previously only checked
        indirectly through render code, never asserted). Test count went from
        68 to 88 as a result (20 new: 2 per level × 10 levels).
      - Verified via headless Chrome: 88/88 tests green, and the editor's
        load→edit→export round trip checked against 3 different levels (L1 —
        water bodies + weather; L4 — gravityWell + heatHaze + incinerator
        hazard; L8 — gravityWell + heavyCargo + segments) by diffing the
        exported `registerLevel({...})` block against the source file (see
        `level-editor.html`'s new `?autoload=levelN.js&dumpExport=1` query
        params, added for exactly this headless-verification purpose,
        mirroring `probe-screenshot.html`'s existing pattern).
      - **Explicitly deferred**: `terrainPolygons`/`waterBodies`/`hazards`
        stay hand-coded — the editor's vertex-drag tooling is bespoke per
        shape *kind* (zone/laser/crusher/sandworm/repulsor/bouncer/etc.), not
        purely data-driven, and folding that into the same schema is a
        materially bigger job than the scalar-field pass above. Whoever picks
        this up next should treat it as a separate task, not an extension of
        this one.
      - **Known pre-existing gap, not touched by this pass**: L9's
        `outOfBounds: true` boolean shorthand (vs. every other level's object
        form) isn't understood by the editor's loader/exporter — it loads as
        an empty default-filled zone and exports as a full object instead of
        preserving the boolean. `levelSchema.js` documents this exception
        (`levelSchemaIsOOBObject()`) but doesn't fix the editor's handling of
        it; L9 already relies on `setupPhysics()` instead of static
        `deliveryHubs` too, so it was excluded from the round-trip
        verification levels above for the same reason (it's a fundamentally
        different, more bespoke level than the other 8).
      - Out of scope, unchanged: keeping `index.html`'s `<script>` tags in
        sync when a new `levelN.js` is added — that's a separate,
        already-known manual step (see `CLAUDE.md`).
- [x] ~~More thruster/flight particle effects + a "hotter" lander design~~ —
      done 2026-07-10 (see Recent Additions). Exhaust smoke added alongside
      the existing spark shower, a new falling-fast RCS stabilizer puff
      effect gives descent a visual signature it previously lacked entirely,
      and the hull got a racing-stripe + gloss-highlight paint pass.
- [x] ~~Parachute-on-empty-fuel mechanic~~ — done 2026-07-10 (see Recent
      Additions). `lander.chuteDeployed`, deploy timer, velocity cap, and
      canopy visual all implemented and verified via a synchronous
      multi-frame simulation (headless screenshot's virtual-time-budget
      doesn't reliably tick `requestAnimationFrame`, so real-time playtest
      is still worth doing to confirm it *feels* right, even though the
      mechanics are confirmed correct).
- [x] Raindrop-on-lens effect — reworked to v3 2026-07-10 (see Recent
      Additions) using a real rain-on-a-car-window reference photo: added
      the specular glint and trickle trail that were the actual missing
      ingredients (v1/v2 were both round-bead displacement with no
      highlight), and thinned/shrunk everything further per explicit
      feedback that it needed to be "way more subtle". Not struck through
      with full confidence — this is the third iteration on the same
      feedback ("not great" → "way more subtle"), so it's worth a fresh
      look before assuming it's landed.
- [ ] **Level-start hitch** (user question, 2026-07-10, answered but not
      fixed) — `physics.js`'s `initLevel()` synchronously rebuilds the
      entire Matter.js engine/world from scratch (`_buildMatterWorld()`),
      regenerates all terrain collision bodies (`generateTerrain()`, convex
      decomposition of every terrain polygon), spawns the lander, runs the
      level's `setupPhysics()` callback, and pre-spawns 1-2 ambient traffic
      vehicles — all in one synchronous call from `startLevel()`. That's the
      likely source of the brief hitch right as a mission starts (a single
      slow/GC-heavy frame that resolves itself immediately after). Not
      fixed — would need either spreading the work across a couple of
      frames (harder, touches the load-order assumptions the rest of the
      code makes about a fully-initialized level) or profiling to confirm
      which specific sub-step actually dominates before optimizing the
      wrong thing.

- [ ] **Post-FX shader follow-ups** (added 2026-07-10, see the Recent
      Additions entry below for the full feature) — `heatHaze` is currently
      only set on L2/L4; consider L6 (Amber Dusk/Sand Worm, also a hot biome)
      or others. (The original "haze garbles text" scare turned out to be
      the Y-flip bug fixed in v0.3.0, not wobble amplitude — but world-space
      labels do still get wobbled by the haze, so if it's extended to more
      levels, re-check the "PICK UP"/"DELIVER HERE" labels stay readable on
      each one; camera zoom affects how noticeable the distortion is.) Also: `renderPostFX()` only supports up to 4 water
      bodies per level (`u_waterMin`/`u_waterMax` are fixed-size uniform
      arrays) — fine for every level so far, but would silently ignore a 5th
      body if one's ever added; bump the array size + the `Math.min(4, ...)`
      clamp in `render.js` together if that's ever needed.
- [ ] **Level Editor: no UI for the `incinerator` hazard type** (added
      2026-07-10, see the Recent Additions entry below) — `level-editor.html`'s
      hazard-tab type dropdown only offers `zone` / `laser` / `crusher` /
      `pickup` / etc. (grep `val === 'laser'` around line 1460 for the branch
      to extend). `incinerator` is polygon-based like `zone` (3+ pts, no fixed
      point count) but needs the same `onMs`/`offMs`/`warnMs` timing fields
      the laser branch already shows/hides (line ~1379) — copy that pattern
      rather than inventing a new one.
- [ ] **Expand `incinerator` hazard to other levels** — currently only used
      once, in L4 (`level4.js`, lava vent field on the eastern ridge). It's a
      generic engine feature (`physics/atmosphere.js`, grep `'incinerator'`)
      that could fit L5 (Crystal Caverns, acid theme), L7 (Bioluminescent
      Depths, already has `goo`), or a brand new level built around it as the
      core mechanic — a cargo-run where the player has to time crossings
      between burn cycles. Validate any new placement against
      `tests.html`'s "Level Config Validation" category (it checks hazard
      point counts/timing automatically) before playtesting.
- [ ] **`level4.js` still has stale flavor text elsewhere?** — worth a
      full re-read of every level's `description`/`hint` against its actual
      `deliveryHubs`/`allowedTypes`, since the Sector-4/Deep-Storage mismatch
      fixed 2026-07-10 was found by accident, not a systematic pass.
- [x] ~~Delete `scratch_patch.py`~~ — already gone; not present in the repo.
- [x] ~~Generate the mission grid + Dev-panel jump buttons from `levels[]`~~ —
      already done (`game.js` `generateMissionUI()`, runs `levels.forEach(...)`
      building both the `#mission-grid` buttons and the `#dev-panel .dev-row`
      buttons — no per-level manual wiring needed anymore beyond the
      `<script>` tag in `index.html`).
- [x] ~~Split `game.js` into `render.js`~~ — already done; `render.js` +
      `render/{background,terrain,entities,effects,ui}.js` exist and are
      loaded after `game.js` in `index.html`. `physics.js` was similarly split
      into `physics/{collision,mechanics,entities,atmosphere}.js`.
- [x] Rebuild the regression test suite — done 2026-07-10. `tests.html` now
      has 68 tests: the original 7 behavioral smoke tests (which were
      actually silently failing 6/7 — the DOM stub was missing
      `appendChild`/`dataset` that newer DOM-based UI code needs, now fixed)
      plus a new "Level Config Validation" category with cheap shape checks
      per level (mission params, hubs, palette, terrain, hazards, quests) and
      one upgrade-catalog check.
- [x] Cargo-box laser collision — done 2026-07-10. Turned out the *physics*
      side (`physics/atmosphere.js`) already flagged hit boxes with
      `box.lost = true`, but nothing ever spliced them out of
      `physics.boxes` or freed the Matter body — `game.js`'s cargo-cleanup
      pass (`processDeliveries`/similar, grep `box.lost`) now finishes the
      job through the existing `removeCargoBox()` helper.
- [x] ~~`music1.mp3` is 6 MB~~ — already re-encoded to 2.3 MB.
- [x] ~~`'advanced'` vehicle dead code~~ — already fully removed from
      `physics/entities.js`'s `applyControls()`, not just the UI. Only
      `'basic'` and `'drone'` remain (grep `vehicleType ===` to confirm).
- [ ] Remaining user-feedback items in the backlog at the bottom of this file
      (editor playtest/download/upload workflow, intro camera animation,
      predefined background buildings, pad-oval removal, dropoff light,
      cargo-attach UX, mobile radar collapse).
- [x] ~~Delete unused sprite PNGs~~ — the whole `assets/` directory referenced
      by the old 2D Sprites Mode no longer exists in the repo.

---

## Continuing this project (environment + handoff notes, 2026-07-10)

### Session status (2026-07-10, resolved)
All committed and pushed as of `v0.3.0`. The "flat blue rectangle" saga is
closed — it took **three** diagnoses to get right, kept here as a paper
trail because each wrong guess was plausible:
1. First guess: `drawFluidBounds()` abyss boundary (a real feature) — wrong.
2. Second guess: `drawWaterBodies()` ignoring `body.surfaceColor`, making
   L9's acid pool draw blue — a *real bug* (fixed in `v0.2.1`, and L9's
   pool is confirmed green now), but **not** what the user screenshotted:
   their rectangle was on L1, whose lake doesn't set `surfaceColor` at all.
3. Actual root cause (fixed in `v0.3.0`): the post-FX shader
   (`renderPostFX`, `shaders.js`) sampled the scene texture with an
   inverted Y (`srcUV.y = 1.0 - srcUV.y` on top of an upload that already
   has the canvas top row at v=0). Every effect region therefore drew a
   **vertically mirrored copy of the scene** — the lake's screen-space
   bounding box (the water-shimmer region is a bbox, not the polygon)
   filled with upside-down *sky*, which reads as a flat blue rectangle
   with faint stars/rain inside it. Same bug mirrored the "PICK UP" /
   "CARGO DEPOT" labels on heat-haze levels — earlier misread as the haze
   "garbling" text, which prompted an unnecessary amplitude nerf (partially
   restored now: 1.2/0.6). The user's "the image is also upside down"
   comment was the giveaway, initially misattributed to the lander
   physically flipping.
   Verified fixed via headless-Chrome screenshots (see the new
   "Headless verification" part of the Verification section): L1 lake
   hugs its polygon with the boat/fish right-side up, L4 labels read
   correctly, 68/68 tests green.

### Local environment
- **Python is now installed** (`winget install Python.Python.3.12`, done
  2026-07-10) — a fresh terminal can serve this folder with
  `python -m http.server 8001` from inside `cargo-lander/`, then open
  `http://localhost:8001/index.html`. (A terminal open *before* the install
  won't see `python` on PATH until it's restarted.)
- If Python isn't on PATH for some reason, there's also a zero-dependency
  fallback: `.claude/static-server.ps1` (gitignored, machine-local) — a plain
  PowerShell `HttpListener` static file server, started via
  `.claude/launch.json`'s `cargo-lander` config. Works without installing
  anything, just slower to iterate on than the Python server since it's
  reading files off disk on every request.
- Node/npm are **not** installed in this environment, so there's no
  `node --check` for a quick JS syntax lint — rely on loading the page in a
  browser (console errors are immediate and specific) and the `tests.html`
  suite instead.

### Verification workflow (per this project's `CLAUDE.md`)
1. Load `index.html` via a local server — check the browser console for
   errors on the menu screen and after starting a mission.
2. Open `tests.html` — should read "88 passed / 0 failed" (as of 2026-07-10;
   the number grows as more validation tests get added, that's fine, 0 failed
   is the bar). It auto-runs on load; no button to click.
3. For anything touching a specific mechanic, exercise it directly in the
   browser console against the live `game`/`game.physics` objects rather than
   trusting a code read — e.g. for a hazard: `game.startLevel(N)`, mutate
   `game.physics.lander.x/y` **and** call
   `Matter.Body.setPosition(game.physics.landerBody, {x, y})` together (the
   physics body and the plain-object mirror both need updating — moving only
   one desyncs them and causes bogus collision damage on the next physics
   tick, which looks exactly like a real crash bug but isn't one), then drive
   `game.update(1.0)` in a loop (dt≈1.0 is one real frame at 60fps — passing
   dt=16 like the "Update Loop Simulation" test does is 16 frames per call
   and will make anything time-based blow up 16x if you're eyeballing the
   numbers).
4. Commit + push once verified, per this repo's standing instruction — don't
   wait to be asked.

### What's next (see the TODO list above for the full detail on each)
Picking off the TODO list roughly in order of "self-contained, low risk of
needing broader context":
1. **Level Editor support for `incinerator` hazards** — the type dropdown and
   point-count/timing-field logic in `level-editor.html` only knows about
   `laser` today; `incinerator` needs the same treatment (it's simpler than
   laser since it's a normal 3+-point polygon, not a fixed 2-point line — the
   *timing* fields are what need copying over).
2. **Use the `incinerator` hazard in more levels** — it's currently only in
   L4. Good candidates: L5 (Crystal Caverns, already acid-themed) or a new
   level built around it as the signature mechanic (timed burn-cycle cargo
   run). Whatever you add, `tests.html`'s validation category will catch
   malformed hazard configs automatically on next load — no need to
   hand-verify point counts.
3. **Full description/hint audit** — the L4 fix (description referenced a
   "Deep Storage" hub and blue cargo type that don't exist in the actual
   config) was found by accident while working on something else. Worth a
   deliberate pass reading every level's `description`/`hint` string next to
   its `deliveryHubs`/`allowedTypes` to catch any other drift.
4. The longer-tail user-feedback backlog at the very bottom of this file
   (editor playtest/download/upload workflow, predefined background
   buildings, pad-oval removal, dropoff light, cargo-attach UX, mobile radar
   collapse) — none of these are started; pick whichever the user asks for
   next rather than guessing priority.

---

## Recent additions

### 2026-07-10 (latest): shared level-config schema for the editor + test suite (v0.5.0)
- **Added `levelSchema.js`** — a single schema (field name, type, default, UI
  widget hint) for the scalar/object-shaped fields of a `registerLevel({...})`
  config: mission params, `palette`, `outOfBounds`, `gravityWell`. Solves the
  "Level Editor / renderer parity system" TODO's scalar-field half (see that
  entry, now checked off, for the full writeup) — previously `level-editor.html`
  maintained its own hand-written parser/UI/exporter for these fields, kept in
  sync with the game and with `tests.html`'s validation assertions entirely by
  memory, and had already drifted (`heatHaze` had no editor UI at all and was
  silently dropped on export; `palette.rockGlow`/`palette.fog` round-tripped
  but weren't editable).
- **`level-editor.html`**'s Metadata/Palette/Out of Bounds/Gravity Well sidebar
  panels, the loader's per-field defaults, and the export-block generator are
  now all driven by `levelSchema.js` instead of three separate hand-coded field
  lists — fixed the `heatHaze`/`rockGlow`/`fog` gaps above as a side effect.
  Also added a small headless-verification hook
  (`?autoload=levelN.js&dumpExport=1&openPanels=1` query params, mirroring
  `probe-screenshot.html`'s existing pattern) since there was no interactive
  browser available to click through the load→edit→export flow by hand.
- **`tests.html`**'s "Level Config Validation" category now checks the
  scalar/object sections generically against `LEVEL_SCHEMA` via a shared
  `schemaCheckSection()` helper, and gained dedicated per-level out-of-bounds
  and gravity-well test cases that didn't exist before. Test count: 68 → 88.
- **Deferred, by design**: geometry (`terrainPolygons`/`waterBodies`/`hazards`)
  is NOT schema-driven — the editor's vertex-drag tooling is bespoke per shape
  kind, and folding that in is a separate, materially larger task. See the
  TODO entry for the full scope note, including one known pre-existing gap
  (L9's `outOfBounds: true` boolean shorthand) left unfixed by this pass.
- Verified: 88/88 tests green (headless Chrome, `--dump-dom` +
  `id="summary"`), plus a load→edit→export round-trip check against L1/L4/L8
  (screenshots + exported-text diffs against the source `.js` files) — no
  console errors in any of the headless runs. `CargoGame.VERSION` bumped to
  `0.5.0` (feature addition, per the standing version-bump instruction).
- **This was built by a background agent** dispatched in a separate git
  worktree while the parachute/thruster/rain-v3 work below happened in the
  main session — merged back via `git rebase` once both finished.

### 2026-07-10 (final push): parachute mechanic, thruster FX, lander paint, rain v3
- **Parachute-on-empty-fuel mechanic** — if fuel hits 0 while airborne, a
  `chuteTimer` (`physics/atmosphere.js` `applyGravityAndWind()`) accumulates
  and, after ~1s (60 frames), sets `lander.chuteDeployed = true`. While
  deployed, extra drag on `vx` and an asymptotic velocity cap pull `vy`
  toward ~2.2 (the impact speed the existing damage formula puts at ~12
  damage — risky but often survivable, matching the "might survive if
  you're lucky" ask rather than a guaranteed save). Canopy + swaying
  suspension-line visual in `render/entities.js`'s `drawLander()`,
  counter-rotating 65% against hull tilt so it doesn't look welded to a
  banking ship. Both the timer/deploy trigger and the velocity-cap curve
  were verified with a synchronous 90-frame simulation (headless
  screenshot's `--virtual-time-budget` doesn't reliably tick
  `requestAnimationFrame`, so a real multi-frame test needed to manually
  drive `applyGravityAndWind()` in a loop instead — see
  `probe-screenshot.html`'s `parachuteSim` script) — confirmed `vy` decaying
  8.0 → 2.63 over 90 frames with `chuteDeployed` flipping true right on
  schedule at frame 61.
- **Thruster smoke + falling-fast RCS puffs** (`physics/entities.js`,
  alongside the existing "Universal Exhaust particles" spark spawner) —
  smoke particles (gray, larger, slower, longer-lived) now trail the main
  flame alongside the sparks; a separate low-frequency spawner fires small
  cyan stabilizer puffs from the top of the hull whenever the ship is
  falling fast (`vy > 3.5`) without thrusting, giving descent a visual
  signature it previously had none of at all (only the upward main flame
  had any effect). Shares the existing global 300-particle cap
  (`updateParticles()`), so this can't grow unbounded even under sustained
  full-power thrust.
- **"Hot rod" lander paint pass** (`render/entities.js`'s truck-body
  branch of `drawLander()`) — a center racing stripe (tinted to the same
  critical/heavy/normal trim color the hull outline already uses, so it
  reads as one paint job) plus a thin glossy top-edge highlight. Kept
  layered onto the existing body shapes rather than restructuring the
  vehicle art, to stay a tasteful evolution rather than a jarring redesign.
- **Rain droplets v3** — reworked from a real reference photo (rain on a
  car window) after v1/v2 both read as "not great"/flat. The missing
  ingredients turned out to be a specular glint (a small bright highlight
  per drop) and a tapering trickle trail beneath ~40% of drops — round
  beads with only refraction, no highlight, don't read as "wet glass" no
  matter how the displacement math is tuned. Explicitly kept far sparser
  and fainter than the reference (a heavy-rain windshield close-up) per
  direct feedback that it needs to be "way more subtle" — this is a
  gameplay overlay the player has to see through, not a photo.
- **L3 (Glacial Peaks) weather fixed from `'rain'` to `'snow'`** — an ice
  biome was raining. `startLevel()`'s own weather-inference fallback
  (`game.js`, grep `'Glacial'`) already special-cases level names
  containing "Glacial" to snow, but never ran because L3's explicit
  `weather` config always took precedence over the fallback. One-line fix,
  found while looking at the "Biome Weather Effects" backlog item.
- **Background agent dispatched** for the level-editor/renderer schema
  parity system (see the TODO entry above for the full spec) — running in
  a separate git worktree, results to be reviewed and merged in a follow-up
  once it completes.

### 2026-07-10 (even later): minimap fix, gameplay-fairness bugs, rain v2
- **Fixed the radar minimap being invisible** (user report: "Where have the
  minimap gone?") — a global `canvas { position: absolute; width:100%;
  height:100%; }` CSS rule (meant for the two full-screen game canvases)
  matched every `<canvas>` on the page, including `#radar-canvas`. Pulling
  it out of flow with no sized positioned ancestor to resolve `100%`
  against made `#radar-container` (its only in-flow content) collapse to
  2×2px — just its own border — with `display` still reporting `flex` and
  zero console errors, so it was easy to misread as "hidden" when it was
  actually "sized to nothing." Pre-existing bug, unrelated to this
  session's other changes; not caught until the headless-Chrome `&debug=1`
  probe dumped computed styles (see `probe-screenshot.html` /
  the Verification section). Fixed with a `#radar-canvas` override
  restoring static positioning at its native 260×160 size.
- **Fixed a reward exploit**: `completeMission()` only checked that the
  lander was landed at the HQ pad — not that cargo was actually delivered.
  The manual Extract button/spacebar were already gated correctly by the
  *UI* (hidden/no-op until `deliveredCount >= targetCargo`), but the
  overtime countdown's auto-extraction path (`update()`, "safe extraction")
  called `completeMission()` unconditionally the moment the player reached
  HQ — so running the clock out and limping home with 0 cargo delivered
  still paid a full "Extraction Successful!" reward. Fixed by moving the
  `allDelivered` check into `completeMission()` itself, the one place every
  caller goes through, instead of relying on each caller to pre-check.
  Failing this check now routes to `failMission("Extracted without
  completing deliveries.")` — no reward.
- **Being eaten by the OOB monster is now a hard mission failure**, not a
  respawnable crash (user request: "if lander is eaten after time is up =
  you should lose the level"). Previously the monster's lethal-contact
  check just called the same `triggerExplosion()` as any terrain/hazard
  hit, which `game.js`'s crash handler treats as recoverable (-$400,
  "Press R to deploy replacement", keep playing). Devoured now sets
  `lander.eatenByMonster` (`physics/atmosphere.js`, at the contact check)
  and `game.js`'s crash handler branches on it straight to
  `failMission("Consumed by the anomaly.")` — no budget deduction (nothing
  left to spend it on), no respawn screen. Other crash sources (terrain,
  hazards, ambient traffic) are unaffected — still respawnable as before.
- **Rain droplets v2** — per direct playtest feedback ("wasn't that great"),
  thinned the field (roughly a third of cells now carry a bead, was half)
  and elongated each bead vertically so it reads as a trickling drop rather
  than a floating circle. Flagged in the TODO list for a possible full
  redesign if this iteration still doesn't land.
- **Headless-Chrome verification workflow formalized** — added a standing
  instruction in `CLAUDE.md` (with the full recipe) after it caught the
  minimap bug that a code-only read-through had missed entirely.
  `probe-screenshot.html` gained `&debug=1` (element/computed-style dump),
  `&hide=fn1,fn2` (no-op specific draw calls to bisect a visual), and
  `&script=name` (scripted repros — `eatenByMonster` and `noCargoExtract`
  were added to verify the two gameplay fixes above without needing to
  actually fly a mission to trigger them).

### 2026-07-10 (latest): post-FX Y-flip fix + rain droplets on the lens
- **Fixed the post-FX pass rendering effect regions vertically mirrored** —
  the real root cause of the "flat blue rectangle over the L1 lake" (see the
  Session status note above for the full three-diagnosis paper trail). One
  line: the fragment shader flipped `srcUV.y` even though the canvas
  texture upload already puts the top row at v=0, so every touched pixel
  sampled the scene upside down.
- **Rain droplets on the camera lens** (user request: "the raindrops on the
  screen effect you see in some racing games") — new effect in the same
  post-FX shader, active on any level with `weather: 'rain'` (currently L1
  Verdant Basin and L3 Glacial Peaks). Two screen-space layers of procedural
  droplets (hash-per-cell, ~half the cells occupied, 130px and 61px grids)
  that slowly trickle down the screen and wrap; each bead refracts an
  inverted mini-image of the scene behind it (`offset += -d * 1.8`) with a
  rim-lit highlight so it reads as a wet glass bead. Costs nothing on
  non-rain levels (uniform gates it; the pass itself is skipped when no
  effect is active) and turns off with the existing Settings → Visual
  Effects toggle. Tunables live in the `droplet()` GLSL helper + the
  `u_rainAmount` block in `shaders.js`: cell sizes, radii (8.0/4.0), trickle
  speed (`0.012 + 0.035 * h1`), occupancy (`h3 > 0.5` = skip).
- **Heat-haze amplitude partially restored** (0.8/0.4 → 1.2/0.6) — the
  "garbled labels" that prompted the original nerf were actually the Y-flip
  mirroring the text, not wobble strength.
- **`probe-screenshot.html` added** — headless-Chrome visual-verification
  harness, documented in the Verification section.

### 2026-07-10 (later): auto-scaled mobile UI default
- **`uiScale` now picks a sensible first-run default from viewport size**
  instead of always defaulting to 100% (`game.js` `computeDefaultUIScale()`).
  The HUD panels are absolutely positioned at a fixed base size — only
  fonts/padding shrink via the existing `@media` rules — so on a phone or a
  short mobile-landscape window, 100% was overlapping/running off-screen
  well before a new player would find the manual slider in Settings to fix
  it themselves. Tiers: ≤420px tall → 72%, ≤480px shortest side → 80%,
  ≤820px shortest side → 90%, otherwise 100% (unchanged desktop default).
  Only affects the *first-run* default — once any value is saved to
  `localStorage` (`cargo_lander_ui_scale`), the manual slider always wins,
  verified by setting it explicitly at a small viewport and confirming it
  survives a reload rather than being overridden back down.

### 2026-07-10 (later): GPU post-processing shaders + mobile rotate tip
- **New WebGL post-processing pass** (`shaders.js` `renderPostFX()`, wired
  into `render.js`'s `draw()`) — a distinct pass from the existing
  particle/gravity-glow overlay. It uploads the already-drawn Canvas2D scene
  as a texture (`gl.texImage2D(..., this.canvas)`) and redraws a warped
  version of it wherever an effect region is active, leaving everything else
  fully transparent so the untouched scene shows through unmodified via
  normal alpha compositing. Three effects share one shader program (an
  `if`/loop per effect type on a single fragment shader, not three separate
  programs):
  - **Heat haze** — a gentle screen-wide sine-wave UV wobble, gated by a new
    per-level `heatHaze: true` flag (set on L2 Desert and L4 Volcanic).
    Tuned down from an initial pass that was strong enough to visibly garble
    the "PICK UP"/"DELIVER HERE" world-space text labels (they're drawn in
    the same pass this samples, so they get distorted right along with the
    terrain — a real trade-off of doing this as one full-scene texture
    sample rather than a masked/layered approach).
  - **Water shimmer** — a localized wave distortion confined to each water
    body's screen-space bounding box (up to 4 per level, computed in
    `render.js` from `physics.waterBodies` + camera transform each frame).
    Applies automatically to any level with water, no per-level flag needed.
  - **Gravity lensing** — pulls sampled pixels toward `physics.gravityWellPos`
    within its radius, a cheap stand-in for gravitational lensing that makes
    the black hole visibly bend whatever's behind it (terrain, stars)
    instead of just glowing on top of it. Kept deliberately subtle to match
    this project's established preference for a restrained gravity well (see
    the "toned down twice" note further down this file).
  - **Toggleable** via a new Settings checkbox ("Visual Effects") — persisted
    to `localStorage` (`cargoLanderPostFX`) as `game.postFXEnabled`. Skips
    the texture upload entirely when off, and also short-circuits per-frame
    if a level has no water/heat-haze/gravity-well at all, so it costs
    nothing on levels that don't use it even when the setting is on.
- **Fixed L9's acid pool never rendering** — found while wiring up water
  shimmer. `level9.js`'s water body used the old `{x,y,w,h}` rect shape, but
  `drawWaterBodies()` (`render/terrain.js`) only ever reads the `pts`-polygon
  shape — no crash, it was just silently skipped every frame. Converted to
  an equivalent 4-point polygon.
- **Rotate-to-landscape tip** (`#rotate-tip` in `index.html`,
  `game.js`'s `checkOrientationPrompt()`/`dismissRotateTip()`) — a
  non-blocking overlay shown while a mission is active on a portrait,
  phone/small-tablet-sized viewport (`innerHeight > innerWidth` AND
  `min(innerWidth,innerHeight) <= 820`). Deliberately gated on aspect ratio
  rather than touch-capability detection (`'ontouchstart' in window`, used
  elsewhere in the file for the mobile control buttons) — touch detection is
  unreliable across hybrid devices, and aspect-ratio gating means the
  behavior can be exercised by resizing a desktop browser, not just on a
  real phone. Re-arms on every `startLevel()` call (so it isn't permanently
  silenced by one dismissal) but never re-shows mid-mission once dismissed.
  Listens to both `resize` and `orientationchange` (the latter fires
  slightly earlier on some mobile browsers).

### 2026-07-10: incinerator hazard, laser cargo cleanup, test suite rebuild
- **New `incinerator` hazard type** (`physics/atmosphere.js`, `render/entities.js`,
  wired into `level4.js`) — a polygon zone (unlike the laser's line segment)
  that pulses through the same charge → active duty cycle. While active it
  damages the lander (knockback away from centroid + `damagePerSec` hull
  loss) and instantly destroys any cargo box caught inside
  (`box.lost = true`, cleaned up by `game.js`). Renders as a faint dashed
  outline when idle, a flashing telegraph fill when charging, and a bright
  pulsing fill with rising embers when active — mirrors the laser's
  idle/charging/active render language for visual consistency. Demoed as a
  lava vent field on L4's eastern ridge.
- **Fixed laser hazards not cleaning up destroyed cargo** — `physics.js` was
  already flagging hit boxes with `box.lost = true` (and had been since the
  original laser implementation), but nothing ever spliced them out of
  `physics.boxes` or freed their Matter body/grapple state, so a box "lost"
  to a laser kept silently simulating forever. `game.js`'s existing
  cargo-cleanup pass (the same one that handles abyss-fall and stale-cargo
  loss) now also handles `box.lost` through the shared `removeCargoBox()`
  helper.
- **`tests.html` rebuilt from 7 tests to 68** — the original DOM stub
  (`document.getElementById` mock) was missing `appendChild`/`dataset`/etc.
  that the DOM-based notification and mission-panel code needs, so 6 of the
  7 original behavioral tests had been silently failing. Fixed the stub, then
  added a new "Level Config Validation" category: cheap shape checks over
  every registered level's mission params, delivery hubs, palette, terrain
  geometry, hazards, and quests, plus an upgrade-catalog check. Caught two
  real gaps in `level9.js` (missing `budget` and `palette`, silently falling
  back to generic defaults) which are now fixed with values matching the
  level's "Cavernous Void" theme and its position as the hardest mission.
- **Fixed stale `level4.js` description** — referenced a "Deep Storage" hub
  and blue cargo deliveries that don't exist in the level's actual
  `deliveryHubs`/`allowedTypes` (which only has one "Sector 4" hub taking
  `normal` cargo). Rewritten to describe the actual mechanic (the new
  incinerator vent field) instead.

### 2026-07-05 (afternoon): UX/perf pass
- **Mission progression gating** — `game.isLevelUnlocked(idx)` requires the previous
  numbered mission to have a highscore entry before its mission-grid button is
  clickable (`.locked-mission` styling + `disabled`). Dev Panel's direct
  `game.startLevel(i)` jump buttons intentionally bypass this. Procedural/custom
  levels are always available.
- **2D Sprites Mode removed** — `loadSprites()` (6 image loads + a per-pixel
  chroma-key/crop scan on every boot, `useSprites`, and the settings-modal
  checkbox were deleted; the vector-drawn lander was always the only reachable
  render path in practice. See TODO for the now-orphaned PNG assets.
- **Out-of-bounds mist fix** — `drawMistEdges()` intensity was driven by how far
  the *camera edge* peeked past the level bounds, not the lander. Since the start
  pad usually sits near world x=0, this made the mist appear at near-full
  intensity the moment almost any mission started. Now driven by the lander's
  actual distance past the boundary.
- **Gravity well toned down** — accretion rings: 4→3, slower cycle, ~2x lower
  peak alpha, thinner strokes.
- **Wind HUD scales with UI Scale** — `drawWindIndicator()` was the one on-canvas
  HUD element that never applied `this.uiScale`, so it stayed a fixed size while
  the minimap/quest panel/DOM panels all scaled.
- **Monster fixes**: spawns using the actual on-screen half-extents
  (`physics.viewHalfW/H`, set from `game.js` each frame) instead of a fixed
  world-space offset, so it no longer pops in visibly at low zoom; lingers for a
  minimum ~1.5s beat after eating the lander before diving away (was able to
  vanish almost instantly); and `spawnLander()` now clears `monster` /
  `outOfBoundsTimer` / `sandWorm` so respawning with R after an out-of-bounds
  death doesn't get eaten again by the still-active monster from the previous life.
- **Ambient traffic fixes**: the sky-spawn Y was clamped to a single floor on
  tall-terrain levels, stacking every truck on the same flight line — now spread
  over a band with a minimum-gap retry against active trucks. The "evasive
  maneuver" had no `dt` scaling and re-applied a full velocity kick every frame
  the lander stayed close, escalating into violent unbounded evasion within a
  few frames; now a single cooldown-gated, bounded nudge, and only ~60% of
  trucks react at all (`evasive` flag).
- **Wind readout smoothing** — the HUD number/arrows/gust label tracked the raw
  gust sine-wave directly and read as jittery; now exponentially smoothed.
- **Weather/wind perf** — confirmed neither `weatherParticles` nor `windStreaks`
  has ever used Matter.js (both are plain per-frame array updates); added hard
  caps (120 / 70) so a runaway zoom or wind spike can't grow them unbounded.

