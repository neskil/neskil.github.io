# Cargo Yard — what this is, and what to do with it

**Status: parked variant. Not the main game.** `3d-engine-poc/index.html`
serves **Yard Master**; this folder serves a second, independent take on the
same brief, reachable from Yard Master's main menu. It is here to be
compared and harvested, not to be shipped as-is.

Read this before touching anything in `cargo-yard/`. Then
[`README.md`](README.md) for the architecture and [`PLAN.md`](PLAN.md) for
the design reasoning.

## How this happened

Two sessions were asked the same thing — *line missions, stack the crates
like 3D Tetris, lowest total volume wins, keep the sandbox* — and neither
knew about the other. Both delivered a complete game. They converged
remarkably: identical scoring rule (axis-aligned bounding volume, par
derived from the manifest rather than authored), the same hard split between
rules-that-are-pure-data and everything that touches THREE, twelve linear
missions, headless tests over the logic layer.

Yard Master won the folder because it landed on `master` first and the
maintainer had already spent real time merging it. That is the whole reason.
It is not a judgement that this build is worse.

The original branch history is at `9ffe57f` (the pre-restructure
`3d-engine-poc/js/**` layout, before this was moved into `cargo-yard/`).

## What is actually different

Everything below is the honest list. Most of it is a wash; two rows are not.

| | Yard Master (`../`) | Cargo Yard (here) |
| --- | --- | --- |
| **Piece shapes** | rectangular footprints — `cells: [2, 1]`, `[4, 1]`, `[2, 2]` | **polycubes** — containers *plus* L/J/S/T/O bundles and genuinely 3D step/tower/corner shapes |
| **Balance** | medal multipliers authored per mission | **enforced by the test suite** — two reference players replay all twelve missions every run |
| Namespace / layout | `Cargo3D`, `core/` `game/` `render/` `missions/` `ui/` | `CY`, flat `js/` with a documented load order |
| Logic→UI | direct calls from controllers | an event bus (`CY.emit` / `CY.on`) |
| Contract economy | kept, as an optional sandbox layer | dropped |
| Rules | 7 named rules incl. `hazmatGap`, `departureOrder` | 4 hard + 2 soft; no hazmat, priority-tag instead of departure day |
| Rotation states | 2 (footprints are rectangles) | 4, deduplicated per shape |
| Cell | 3.05 × 3.05 m square | 3.05 × 2.60 m — narrower across, so the aisle slack is only where a real yard has it |

**Yard Master is ahead on rules and on the economy. This build is ahead on
piece geometry and on balance being provable.** That is the summary.

## The two things worth harvesting

### 1. Polycube pieces — this is the "3D Tetris" the brief asked for

Yard Master's crates are rectangles, so every piece is an I or an O. The
interesting Tetris shapes — the ones where rotation is a real decision and a
badly-placed L poisons a column — only exist here.

Yard Master's `PLAN.md` already anticipates this: *"The grid API takes an
arbitrary cell mask, not a width/height pair, so L-shaped and stepped pieces
can be added later without touching the placement code."* So the port is
mostly a data change plus rotation.

What to lift, in order:

- `js/config.js` → the `CY.PIECES` catalogue. A piece is
  `cells: [[x, y, z], …]` in local space, normalised to the origin. Note the
  `y` component: `kTower`, `kStep` and `kTripod` are two tiers tall, which is
  what stops the shape set collapsing back into flat pentominoes.
- `js/grid.js` → `rotate()`, `normalise()`, `span()`, `orientations()`.
  `orientations()` is the one that matters: it deduplicates the four Y
  rotations by shape, so a 2×1 line reports two states and a 2×2 block
  reports one, and the rotate button can honestly say when it does nothing.
- `js/grid.js` → `underside()` and `supportRatio()`. A rectangle's underside
  is its whole footprint; a polycube's is only the cells with nothing of
  their own beneath them. Yard Master's support check assumes the former and
  will silently mis-score a tower without this.

Costs: Yard Master's `rot` is 0-or-1 and its meshes rotate `Math.PI / 2` on
odd — that becomes 0..3. Its `restTier()` and `departureOrder` column scan
both assume a rectangular footprint and need the cell mask threaded through.

### 2. The balance harness

`tests.html` runs two reference players over every mission, every test run:

- a **naive** first-legal-cell player, which must be able to *finish* each
  mission — this proves no mission can deadlock the queue; and
- a **greedy** minimise-the-bounding-box player, which must clear **bronze**
  everywhere — this proves the ladder can never lock a player out — and must
  not sweep gold, so three stars still means something.

The point is that medal thresholds stop being a thing anyone maintains. Edit
a manifest, run the tests, and if a mission stopped being clearable you are
told immediately instead of finding out from a player. One mission (`m4`)
carries its own multipliers precisely *because* the harness proved the
default was unreachable for its shape mix — that is the mechanism working,
not a fudge.

This ports cleanly and is independent of the piece question. It is the
cheaper of the two and probably the one to do first.

## What not to bother porting

- **The event bus.** It is tidier, but Yard Master's direct wiring works and
  swapping it is churn with no player-visible result.
- **The soft-rule penalties** (buried priority, reefer without a plug).
  Yard Master's `departureOrder` and `reeferEdge` cover the same ground as
  *hard* rules, which is a defensible design choice — refusing a placement
  teaches faster than charging for it. Do not port both systems.
- **The mission ladder.** Yard Master's twelve are better paced and its
  rules richer. This one's missions exist to exercise this one's rules.
- **The renderer.** Same ideas, no advantage: cached geometry, a generated
  corrugation texture instead of ~50 rib meshes, manual disposal.

## If the decision is to delete this

Fine — the two harvestable pieces are described above precisely enough to
rebuild from this document alone, and the code stays in git history at
`9ffe57f`. Remove `3d-engine-poc/cargo-yard/`, the `.menu-variant` block in
`3d-engine-poc/index.html`, and the matching rules in
`3d-engine-poc/styles/menu.css`.

## Ground rules while it is parked

- **It must not touch Yard Master.** Its save key is `cy.progress.v1`;
  Yard Master's is `cargo3d.save.v1`, which the portfolio landing page reads.
  Keep them apart.
- It shares `../vendor/` and nothing else.
- Its own tests still have to pass — see [`README.md`](README.md). A parked
  build that has quietly rotted is worth nothing to the comparison.
