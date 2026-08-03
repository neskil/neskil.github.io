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

## Before you commit

Run the tests. They are fast and they cover the parts that are easy to break:

```sh
chrome --headless=new --disable-gpu --no-sandbox --virtual-time-budget=8000 \
  --dump-dom "file:///$(pwd)/tests.html" | grep -oE 'ALL TESTS PASSED[^<]*|FAILED [^<]*'
```

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
- **Dispose meshes.** `ContainerMeshes.disposeGroup()` on anything removed from
  the scene — modes are entered and exited repeatedly in one page life.

## The parked variant in `cargo-yard/`

`cargo-yard/` is a **second, independent implementation of this same brief**,
built in a parallel session that did not know this one existed. It is linked
from the main menu and is there to be compared and harvested — not shipped,
not extended, and not merged over the top of this build.

Read [`cargo-yard/HANDOVER.md`](cargo-yard/HANDOVER.md) before you touch it or
decide its fate. The short version:

- It converged on the same scoring rule and the same core/render split, so
  most of it is a wash.
- Two things it has that this build does not: **polycube pieces** (real
  Tetris shapes — L/J/S/T/O plus 3D step/tower/corner — where our crates are
  rectangles), and a **balance harness** that proves every mission stays
  finishable and clearable instead of trusting authored multipliers.
- Everything else — its event bus, its soft-rule penalties, its mission
  ladder, its renderer — is either equivalent or worse than what is here.

Rules while it stays parked:

- **It must not reach into this build.** Its save key is `cy.progress.v1`;
  ours is `cargo3d.save.v1` and the landing page reads it. Keep them apart.
- It shares `../vendor/` and nothing else. No cross-imports either way.
- Changes here do not have to keep it working — but if you break it
  knowingly, say so in `cargo-yard/HANDOVER.md` rather than leaving a rotted
  build behind a menu link.

## Save schema

`cargo3d.save.v1` is read by the portfolio landing page (`../index.html`,
`loadHighScores()`). Changing its shape means changing that too.
