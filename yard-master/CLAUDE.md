# Working in `yard-master/`

Read [`README.md`](README.md) for the architecture and [`PLAN.md`](PLAN.md) for
the game design before changing anything here.

## Non-negotiables

1. **`core/` never imports or references THREE.** If a change needs a
   `THREE.Vector3` to decide whether something is legal, the logic is in the
   wrong layer. `tests.html` loads `core/` and `missions/` with no WebGL context
   and will break loudly if this slips.
2. **Grid↔world conversion lives only in `render/yard.js`.** No other file should
   multiply by `CELL_X`.
3. **Missions are data.** A new mission is an object in `missions/campaign.js`,
   not code. If a mission needs code, the missing piece is a rule.
4. **Par is derived, never authored.** `Scoring.parFor()` computes it from the
   manifest. Do not add hand-tuned target volumes.
5. **No build step, no bundler, no framework.** Plain `<script>` tags, IIFEs,
   one `window.Cargo3D` namespace — per the workspace rules in `.agents/`.

## Before you push

Stamp the build, so the live page says which version it is:

```sh
yard-master/tools/stamp-build.sh && git commit -am "chore(3d): stamp build"
```

The chip in the top bar reads `version.js` and shows that commit as plain text.
It names the commit that was HEAD when the script ran — a file cannot contain
its own hash, so the stamp always trails by the stamp commit itself. That is the
useful end of the trade: it names the change you are looking for, not the
bookkeeping.

## Before you commit

Run the tests. They are fast and they cover the parts that are easy to break:

```sh
for page in tests.html physics-tests.html; do
  chrome --headless=new --disable-gpu --no-sandbox --virtual-time-budget=90000 \
    --dump-dom "file:///$(pwd)/$page" | grep -oE 'ALL TESTS PASSED[^<]*|FAILED — [^<]*'
done
```

`tests.html` covers `core/` and `missions/` with no THREE loaded at all — that is
deliberate, so it breaks loudly if `core/` ever reaches for THREE. The solver
needs THREE's maths, so it gets its own page, `physics-tests.html`. Do not merge
the two.

Then load `index.html` and check the console is clean. Two network errors for
Google Fonts and gtag are expected over `file://` and are not code faults.

If you touched placement, scoring or a rule, also play a mission end to end —
the tests prove the logic, not the wiring.

## Gotchas

- **Rotation is 0 or 1.** 180° and 270° produce identical footprints, so the
  controller only tracks two states. Meshes rotate `Math.PI / 2` when `rot` is
  odd.
- **A rotated mask is a quarter turn, not a transpose.** `footprint()` maps
  `[dx, dz] → [dz, cells[0]-1-dx]`. The two agree for every rectangle and for
  the T; they disagree for the L, where a transpose is the mirror image. Since
  the mesh is turned by `rotation.y`, a transposed mask puts the grid's notch on
  the opposite corner from the drawn one.
- **A mesh may carry an array of materials.** A container has one per face and a
  machinery module has one for its caps and one for its walls. Anything walking
  `child.material` has to handle both — `materialsOf()` in
  `render/containers.js` is the only place that should be deciding which.
  `makeTranslucent()` is there for the modes that hover a real unit as a ghost.
- **Skins are greyscale, liveries are `material.color`.** `render/textures.js`
  paints wear and rivets in near-white so `setHeatmap()` can keep recolouring
  shells by setting `.color`. Anything that must keep its own colour through the
  heatmap sets `material.userData.fixedColor`. Carrier lettering therefore
  cannot live in the wall skin — it is its own decal plane, tagged `isSkin` so
  X-ray fades it with the shell.
- **Textures are shared and never disposed.** One set serves the whole yard.
  `disposeGroup()` frees materials, and a three.js material does not dispose its
  maps, so this is safe — but it also means you must not mutate a skin's
  `repeat` in place. `applySkin()` memoises a clone per tiling for that reason.
- **The environment map is per weather preset.** Nothing in r128 scales
  `scene.environment` globally, so `Weather.set()` swaps the whole sky. Drop
  that and the night yard is lit like noon. Raising a material's `metalness`
  past ~0.5 now means it will mirror that sky — which is what fixed the tank,
  and what turned the floodlight masts into glowing white sticks until they came
  back down to 0.35.
- **The env map *is* the ambient light.** `ambient` and `hemi` are deliberately
  low in every preset. The values that looked right before there was a painted
  sky stack on top of one and bleach the yard white — if a preset looks washed
  out, that is the first thing to check, not the fog.
- **A preset's fog colour must equal its sky's horizon band.** The dome is drawn
  with `fog: false` — at 300 m an exponential fog swallows it whole — so the
  blend between fogged ground and painted sky is painted by hand, in the stop
  just below `v = 0.5`. Change one without the other and the horizon grows a
  visible seam right across the picture.
- **`scene.background` cannot hold an equirect texture in r128.** It takes a
  colour or a cube map; anything else is stretched across the screen and does
  not turn with the camera. Hence the sky *dome* in `scene.js`. The background
  colour is still set as a fallback nobody sees.
- **The skyline is baked.** `Skyline.bake()` collapses ~100 silhouettes into one
  positions-only mesh after `build()` runs, so anything added to `build()` is
  automatically merged — but nothing can be moved or recoloured individually
  afterwards. The one knob is `setTint()`, on the shared material.
- **Weather and terminal are independent.** `Weather.set()` owns light, fog, sky
  and skyline tint; `SceneView.setTerminal()` owns paint. They are applied in
  either order and must never touch the same property. Mission mode sets both;
  every other mode leaves the terminal at its default, and `MissionMode.exit()`
  hands it back.
- **The atmosphere vocabulary lives in `core/`.** `Constants.WEATHER_KEYS` is
  what `missionSchema` validates against, because `tests.html` has no `render/`.
  `render/weather.js` checks itself against that list on load and warns if the
  two drift.
- **`restTier()` returns three things:** a tier index, `null` when the footprint
  is off the bay, and `-1` when the stack would exceed the bay height. Check for
  all three.
- **Undo assumes strict queue order.** `PlacementController` places units in
  manifest order, so `grid.lastPlacement().unit === units[index - 1]`. If a
  future mode allows out-of-order placement, undo needs a real move stack.
- **`departureOrder` reads columns, not the support chain.** Anything in the
  columns below counts as buried. That is deliberate — it is what a player can
  see and reason about.
- **Keyboard is shared.** The reach stacker binds WASD globally and gates on
  `enabled`; the placement controller binds R/Z/Esc and gates on `attached`.
  Enable exactly one.
- **Physics never runs on the frame delta.** `PhysicsWorld.update()` accumulates
  real time and steps at a fixed 1/120 s. The overlap correction divides by the
  step, so handing the solver a raw `delta` means one short frame launches the
  whole yard. If you are tempted to "simplify" that back to a variable step, do
  it and run `physics-tests.html` — the tower ends up 17 km in the air.
- **Solver iterations are not a tuning knob.** Dropping
  `PhysicsWorld.iterations` below about 8 stops support impulses propagating up
  a stack, and towers lean over instead of standing. At 1 it fails 11
  assertions.
- **`support:1` is not physics and never will be.** It counts occupied cells
  under a footprint. Real physics lives in `game/physics.js`, beside the grid,
  because `core/` may not touch THREE. Do not try to reconcile them.
- **Sleeping bodies are static.** A sleeping body contributes zero inverse mass
  to a contact. Anything that should push one must wake it first — see
  `pairContacts()`, which only wakes for a partner that is actually moving.
- **A container's length runs along X.** `render/containers.js` draws it that
  way and the grid agrees — a 40ft at rotation 0 spans four cells in X. So
  `RigidBox` is `sizeX = spec.length`, `sizeZ = spec.width`, named by axis on
  purpose. Reading `spec.width` as the X extent gives every container a hitbox
  turned ninety degrees from the one on screen, which looks like stacks melting
  into each other and neighbours shoving each other aside.
- **A tier is taller than a container.** `TIER_H` is 2.90 m, a 20ft is 2.59 m,
  so the lattice leaves 31 cm of air per tier and a simulated stack legitimately
  sinks onto itself — more the higher it goes. `missionPhysics.js` allows for
  that per body; a flat drift tolerance condemns every tall stack as collapsed.
- **A placement owns a tier *span*, not a tier.** `place()` sets
  `tierTop === tier`, but a unit that came down is reseated across every tier its
  wreck occupies, so `tierTop > tier`. Anything walking a placement's cells has
  to loop `tier..tierTop` — see `releaseCells()` and `isBuried()`. Reading
  `placement.tier` alone leaves half a wreck welded into the lattice.
- **A collapse costs the envelope, not the cargo.** Nothing is despawned and no
  ground is blocked; the container stays where it fell and keeps counting. The
  score suffers because the envelope stretches around it. If you find yourself
  adding a lava floor back, the penalty you want already exists.
- **Reseat every wreck's release before any wreck's claim.** `finishCollapse()`
  frees all the fallen placements' cells first and only then reseats them. One
  loop doing both means the first wreck is measured against the second's
  pre-collapse footprint and ends up holding no ground at all.
- **`physics` is a rule core/ cannot decide.** Its `check()` always passes. The
  verdict needs the solver, which needs THREE, so `game/missionPhysics.js`
  enforces it after the placement. The entry in `RULES` exists so the mission
  card and briefing describe it like any other regulation.
- **Dispose meshes.** `ContainerMeshes.disposeGroup()` on anything removed from
  the scene — modes are entered and exited repeatedly in one page life.
- **Cascade's lock grace is shorter than its fall step** (0.6 s against 1.5 s at
  level 1). So one `tick()` longer than the grace will both land a piece and
  lock it in the same call. That is correct at 60 fps and wrong in a test that
  hands `tick()` one large delta — step in frame-sized deltas instead.
- **A layer clear mints new placement ids.** `clearTiers()` tears the survivors
  down and places them again a tier lower, so the ids change. The event carries
  `moved: [{from, to}]` for exactly that reason, and `YardView.reseatUnit()`
  re-keys the mesh. Anything else holding a placement id across a clear is stale.
- **A responsive rule that shows something must not carry an id.** The rule that
  folds a collapsed toolbar section is class-only
  (`.toolbar-section.collapsible:not(.is-open) > …`), so anything it has to hide
  must be reachable at that specificity. `#cascade-toolbar .touch-console
  { display: grid }` outranked it and left the gesture pads on screen underneath
  a chip that said the section was shut.
- **The gesture pads must own their gestures.** `.control-bar` sets
  `touch-action: pan-y` so the bar itself can be scrolled, and that claims a
  vertical drag before `ui/touchpad.js` sees it. `.touch-pad` sets
  `touch-action: none` for exactly that reason; drop it and the piece moves left
  and right but never forward or back, only on a real touchscreen.
- **Only Cascade implements `setPaused`.** `MenuUI.syncPause()` calls it on
  whichever mode is live whenever a panel opens or closes; every other mode is
  turn-based and quite happily keeps running behind the pause overlay.

## Save schema

`cargo3d.save.v1` is read by `core/storage.js` and by `index.html`'s `loadHighScores()` to populate the `#stat-yard-master` chip on the main portfolio landing card (`#card-yard-master`). Keep the save schema backwards compatible.
