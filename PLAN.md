# Repo Cleanup & Efficiency Backlog

Discoveries from the November 2026 repo sweep, ordered by impact. Phase 2 (`cargo-lander` portraits → 512×512 WebP, unused `golf3d/assets/models/*.obj|*.mtl|colormap.png` removed) and Phase 5 (156 merged remote branches >2w old, 9 merged local branches, 8 clean merged worktrees pruned) have already landed.

## 1. ~~Deduplicate vendored Three.js (~3.56 MB saved + cross-app caching)~~ (done)

- Consolidated `three.min.js` (589.3 KB) and `OrbitControls.js` (26.8 KB) into root `/vendor/` across all 7 apps (`3d-engine-poc`, `cargo-packer`, `golf3d`, `paper-plane`, `terrarium`, `viz-poc`, `wow`), keeping `golf3d/vendor/portals/vendor/three/three.module.min.js` separate.

## 2. Remaining media optimization (~4–6 MB potential)

- **`cargo-lander/music/`** (5 MP3s, **6.02 MB** total; `music1.mp3` is 2.35 MB): re-encode at 96–112 kbps MP3 (or VBR `-q:a 6`) once `ffmpeg` is available; filenames stay identical.
- **`assets/og/`** (PNGs, 1200×630, **>7 MB** total — e.g. `home.png` 991 KB, `erosion.png` 792 KB, `wow.png` 575 KB; `car.png` regenerated at 104 KB): optimize with `pngquant` / `oxipng` while keeping 1200×630 PNG format for social scrapers.
- **`cv/index.html` profile image** (done): switched from `../surprise/cv_legacy/images/image.jpg` (1.46 MB) to `../assets/portrait.webp` (9.9 KB).

## 3. De-monolithize large single-file HTML shells

- ~~Root `index.html`~~ (done): extracted `style.css` and `js/home.js`, keeping the tiny theme/perf-tier head script inline to avoid FOUC.
- Same pattern applies to `cargo-lander/index.html` (~146 KB), `car/index.html` (~134 KB), and `converter/index.html` (~93 KB).

## 4. Speed up headless test suite (`tools/run-tests.mjs`)

- Baseline prior to the newest suites was 19 suites in ~50–60s (`CONCURRENCY = 3`, alphabetical order). Four suites dominate wall-clock time:
  - `golf3d/tests.html` (~43s)
  - `golf/tests.html` (~31s)
  - `golf3d/shader-tests.html` (~18s)
  - `golf/ui-tests.html` (~18s)
- **Action**:
  1. ~~Schedule known slow suites longest-first in `tools/run-tests.mjs` instead of alphabetical order, and raise default `CONCURRENCY`~~ (done — `HEAVY_SUITES` scheduled first with `CONCURRENCY = 4`, plus `*-check.html` harnesses and `viz-poc/tests.html` added to discovery).
  2. Profile `golf/tests.html` (45 `simulate` loops) and `golf3d/tests.html` for redundant simulation steps, and replace `setTimeout(..., 10)` polling in `golf/ui-tests.html` with `requestAnimationFrame` / event-driven waits.

## 5. Remaining git & branch hygiene

- **18 unmerged remote branches** older than `2026-10-30` (mostly July–Oct `claude/*` sessions) were left intact in case any contain unmerged experiments; review with `git log origin/master..origin/<branch>` before deleting.
- **5 local worktrees** were skipped during cleanup because they were unmerged or had uncommitted changes (`physics_based_placement_experiment`, `repo_cleanup_efficiency_plan`, `repo_status_and_review_plan`, and detached `.claude/worktrees/cargo-lander-fifth-map-6ceb97` / `level-5-fog-difficulty-431702`).
