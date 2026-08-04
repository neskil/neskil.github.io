# Working in `3d-engine-poc/`

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
3d-engine-poc/tools/stamp-build.sh && git commit -am "chore(3d): stamp build"
```

The chip in the top bar reads `version.js` and links to that commit on GitHub.
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
- **Dispose meshes.** `ContainerMeshes.disposeGroup()` on anything removed from
  the scene — modes are entered and exited repeatedly in one page life.

## Save schema

`cargo3d.save.v1` is read by `core/storage.js` and by `index.html`'s `loadHighScores()` to populate the `#stat-3d-poc` chip on the main portfolio landing card (`#card-3d-poc`). Keep the save schema backwards compatible.
