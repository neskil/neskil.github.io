# Repo Cleanup & Efficiency Backlog

Discoveries from the November 2026 repo sweep, ordered by impact. Phase 2 (`cargo-lander` portraits → 512×512 WebP, unused `golf3d/assets/models/*.obj|*.mtl|colormap.png` removed) and Phase 5 (156 merged remote branches >2w old, 9 merged local branches, 8 clean merged worktrees pruned) have already landed.

## 1. Deduplicate vendored Three.js (~3.56 MB saved + cross-app caching)

- `three.min.js` (r128, 589.3 KB, SHA-256 `7AE04663...`) is duplicated byte-for-byte in **7** folders:
  `3d-engine-poc/vendor/`, `cargo-packer/vendor/`, `golf3d/vendor/`, `paper-plane/vendor/`, `terrarium/vendor/`, `viz-poc/vendor/`, `wow/vendor/`.
- `OrbitControls.js` (26.8 KB) is duplicated identically in `3d-engine-poc/vendor/` and `cargo-packer/vendor/`.
- **Action**: Move one copy of each to a shared `/vendor/` at repo root and point the `<script>` / dynamic loader tags (`paper-plane/js/app.js`, `wow/index.html`) to `../vendor/...` (works over both `file://` and HTTP) or `/vendor/...`. Keep `golf3d/vendor/portals/vendor/three/three.module.min.js` separate (ES module build, different version/shape).

## 2. Remaining media optimization (~4–6 MB potential)

- **`cargo-lander/music/`** (5 MP3s, **6.02 MB** total; `music1.mp3` is 2.35 MB): re-encode at 96–112 kbps MP3 (or VBR `-q:a 6`) once `ffmpeg` is available; filenames stay identical.
- **`assets/og/`** (PNGs, 1200×630, **>7 MB** total — e.g. `home.png` 991 KB, `erosion.png` 792 KB, `car.png` 692 KB, `wow.png` 575 KB): optimize with `pngquant` / `oxipng` while keeping 1200×630 PNG format for social scrapers.

## 3. De-monolithize large single-file HTML shells

- Root `index.html` is **~340+ KB (>6,600 lines)** with ~106 KB of inline `<style>`, ~118 KB of inline `<script>`, and 82 inline `<svg>`s (~44 KB). Extracting the main CSS to `style.css` and deferred JS to `js/` enables browser caching across visits and simplifies edits (keep the tiny theme/perf-tier head script inline to avoid FOUC).
- Same pattern applies to `cargo-lander/index.html` (~146 KB), `car/index.html` (~134 KB), and `converter/index.html` (~93 KB).

## 4. Speed up headless test suite (`tools/run-tests.mjs`)

- Baseline prior to the newest 5 suites was 19 suites in ~50–60s (`CONCURRENCY = 3`, alphabetical order). Four suites dominate wall-clock time:
  - `golf3d/tests.html` (~43s)
  - `golf/tests.html` (~31s)
  - `golf3d/shader-tests.html` (~18s)
  - `golf/ui-tests.html` (~18s)
- **Action**:
  1. Schedule known slow suites longest-first in `tools/run-tests.mjs` instead of alphabetical order, and raise default `CONCURRENCY` (e.g. `Math.min(6, os.cpus().length)`).
  2. Profile `golf/tests.html` (45 `simulate` loops) and `golf3d/tests.html` for redundant simulation steps, and replace `setTimeout(..., 10)` polling in `golf/ui-tests.html` with `requestAnimationFrame` / event-driven waits.

## 5. Remaining git & branch hygiene

- **18 unmerged remote branches** older than `2026-10-30` (mostly July–Oct `claude/*` sessions) were left intact in case any contain unmerged experiments; review with `git log origin/master..origin/<branch>` before deleting.
- **5 local worktrees** were skipped during cleanup because they were unmerged or had uncommitted changes (`physics_based_placement_experiment`, `repo_cleanup_efficiency_plan`, `repo_status_and_review_plan`, and detached `.claude/worktrees/cargo-lander-fifth-map-6ceb97` / `level-5-fog-difficulty-431702`).
