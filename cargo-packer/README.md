# Cargo Packer 3D — Container Loading & 3D Bin Packing Simulator

A 3D interactive demonstration and educational visualizer for container loading
and 3D bin-packing heuristics (3D-BPP / CLP).

Built with vanilla JavaScript and Three.js (r128). Zero build step, zero package dependencies.

---

## 1. Overview & Architecture

### The One Rule
> **`core/` never imports or references THREE.**

All packing algorithms, coordinate calculations, collision checks, support tests,
and Center of Gravity metrics live in `core/` as pure data and functions.
Everything dealing with WebGL, meshes, shaders, and cameras lives in `render/`.

This clean decoupling is what allows the entire algorithmic engine to be tested
headlessly in under a second in `tests.html` without requiring a WebGL context.

### Directory Structure

```
cargo-packer/
├── index.html            # Main application shell & entry point
├── tests.html            # Headless unit test harness for core/ logic
├── PLAN.md               # Engineering roadmap & specification
├── CLAUDE.md             # Developer workflow & standing instructions
├── README.md             # This document
│
├── core/                 # Pure algorithms — NO THREE, NO DOM
│   ├── types.js          # Container specs (20ft, 40ft, Pallet), box items, 6-axis rotation
│   ├── collision.js      # AABB intersection, boundary containment, support ratio calculation
│   ├── metrics.js        # Volume fill %, weight, Center of Gravity (CoG), axle load balance
│   ├── extremePoints.js  # Extreme Point (EP) packing heuristic with projection
│   ├── wallBuilding.js   # Wall-building (layer by layer, back-to-front) heuristic
│   ├── firstFit.js       # First-Fit Decreasing (FFD) shelf/slab baseline
│   ├── moreHeuristics.js # Deepest-Bottom-Left, Next-Fit, Floor Only, Random Drop
│   ├── algorithms.js     # The one registry of algorithms the UI, showdown and tests read
│   └── manifests.js      # Scenario type tables, buildManifest, compareAlgorithms
│
├── render/               # Three.js 3D WebGL rendering
│   ├── textures.js       # Procedural canvas textures (carton tape, wood crates, corrugated steel)
│   ├── scene.js          # Camera rigs, lighting, floor grid, OrbitControls
│   ├── container.js      # 3D models for ISO container & EUR-pallet (cutaway glass / wireframe)
│   ├── boxes.js          # Procedural box meshes with drop-in easing animation
│   ├── yard.js           # Scenery: concrete apron, bay markings, forklift, pallets, cones, container stacks
│   └── visualizers.js    # Glowing Extreme Point anchors, 3D CoG target & plumbline
│
├── game/                 # State management & audio
│   ├── controller.js     # State machine: step forward/back, play/pause, speed control
│   └── audio.js          # Procedural Web Audio API sound synthesis (thuds, clicks, chimes)
│
├── ui/                   # DOM interface
│   ├── ui.js             # Binds HUD diagnostics, playback dock, scenario/algo selectors, cargo editor
│   ├── tourContent.js    # Guided-tour articles, one per algorithm
│   └── tour.js           # Stages tour chapters: step, camera flight, highlights
│
├── styles/               # CSS styles
│   ├── tokens.css        # Palette, typography, dark slate glassmorphism tokens
│   └── app.css           # Responsive layout, CoG radar crosshair, playback bar
│
└── vendor/               # Shared vendor libraries
    ├── three.min.js      # Three.js r128
    └── OrbitControls.js  # Camera navigation
```

---

## 2. Algorithms Demonstrated

1. **Extreme Points (EP) Heuristic**:
   * Evaluates candidate 3D corner coordinates generated at $(x+w, y, z)$, $(x, y+h, z)$, and $(x, y, z+d)$.
   * Projects coordinates against surrounding box surfaces to prevent orphaned spaces.
   * Multi-criteria scoring evaluates candidate placements prioritizing low $Z$ (back of container), low $Y$ (gravity), low $X$, and maximum contact area.

2. **Wall-Building (Back-to-Front)**:
   * Emulates traditional maritime stevedores packing vertical transverse slices across the container width before stepping forward along the length.
   * Maximizes structural stability during transit.

3. **First-Fit Decreasing (Shelf / Slab)**:
   * Greedy 2D/3D generalization sorting boxes by height and creating horizontal tiers.
   * Highlights the classic trade-off of trapped headspace void above uneven boxes.

4. **Deepest-Bottom-Left** (Karabulut & İnceoğlu, 2004): each box goes to the
   deepest, then lowest, then left-most admissible corner. No scoring, no
   projection; often the densest of the lot.

5. **Balanced Load**: packs for weight balance instead of density. Heaviest
   first, each box goes where the load's centre of gravity stays closest to
   mid-container (plus a pull to the middle and a preference for low spots).
   Real loads are spread evenly by *weight*, not by gaps: gaps let cargo shift.
   Every other loader packs against the bulkhead and ends in "imbalance
   hazard"; this one ends centred. Spots are tried cheapest-bound-first from a
   heap, against a floor-plan grid of placed boxes, so it stays near a second
   on the largest loads.

And three that are there to lose:

6. **Next-Fit (Unsorted)**: arrival order, never revisits a row or layer.
   Shows what sorting buys.
7. **Floor Only**: one layer, no stacking, no turning boxes.
8. **Random Drop**: shuffled, random spots, lowered until it lands. Seeded,
   so a run is repeatable.

All eight obey the same physical rules (inside, no overlap, ≥60% supported)
and are registered in `core/algorithms.js`; adding one is an entry there plus
its file, and the sidebar, compare pickers, showdown and tests pick it up.

### Showdown ranking

Most volume loaded wins, then most boxes; when everything fits, the load that
leaves the most room wins — least floor length used in a container, lowest
stack on a pallet — then the denser block.

### Cargo editor

Each fixed scenario is a type table in `core/manifests.js` (name, size,
weight, default count); `buildManifest` turns a table plus counts into items,
and the defaults reproduce the original manifests exactly. The editor in the
left panel sets counts per type (or the item count for the random scenario),
with ×½, ×2 and Reset. There is no ceiling: any whole number goes.

### Background packing

Every solve packs with every algorithm, in a Web Worker
(`core/solveWorker.js`, which `importScripts` the same `core/` files; they
attach to `self.CargoPacker`, which is the window on a page). Results stream
back one algorithm at a time: the one on screen first, then the compare
pane's, then the quick ones, the slow ones (`slow: true` in the registry)
last. The Showdown ranks whatever has finished (`rankAlgorithms`) and marks the
rest as packing; switching to a finished algorithm is instant. A new edit
terminates a worker still on an older load. Where workers cannot start (a page
opened from `file://`), the same sequence runs on the page, yielding between
algorithms. A 1,200-item load packs in about 5 s with the page never stalling
more than ~0.1 s.

Big loads stay renderable because carton textures are shared (six label
variants per kind of box, rather than a 512² canvas per box), and each step
records at most 600 candidate spots for the visualizer (`snapshotPoints`;
placement never depends on it). Extreme Points' anchor-point bookkeeping
uses a floor-plan bucket grid and skips spots whose best possible score cannot
win: exact (same placements as before, checked on 207 loads) and about 3×
faster.

### Physical stacking rule

Every algorithm places a box only where it rests on the floor or on boxes
already placed, with at least 60% of its base supported. First-Fit and
Wall-Building build in layers (shelves, wall tiers) that open at the height of
the previous layer's tallest box; a box is lowered from that line onto what is
actually beneath it (`Collision.restingHeight`) rather than left hanging over
the shorter boxes. `tests.html` packs every preset plus a dozen random seeds
with each algorithm and fails if any box breaks this.

### Showdown & side-by-side compare

All three algorithms run on every load. The **Algorithm Showdown** ranks them
by volume loaded, then boxes loaded, then *density* — cargo volume over the
volume of the block it occupies — since most presets fit entirely and tie on
fill. **Compare** (top bar, or "Watch top two side by side") splits the view in
two: one camera drawn twice with scissor viewports, a separate cargo group per
side, both stepped in lockstep. The panes sit between the side panels on
desktop and stack top/bottom on portrait screens. `?compare=<algoId>` opens it
directly.

### Guided tours

"Guided tour: how it works" in the algorithm card opens a short article for
that algorithm. Each chapter is data in `ui/tourContent.js` (step, camera
pose, highlights, text with live `{placeholders}`), and `ui/tour.js` stages it:
jumps the packing to the step and drops the last box in, flies the camera
(`SceneManager.flyTo`, cancelled the moment the user grabs the view), and
shows anchor points, an outline, or the patches a box rests on
(`Visualizers.showSupport`). Steps are positions (`'35%'`, `'end'`,
`'firstStacked'`, `'partlySupported'`…) rather than numbers, so the tours read
correctly on edited cargo. Arrow keys and Esc work; `?tour=<algoId>` opens one.

### Scenery & fullscreen

The container stands in a loading yard (`render/yard.js`): concrete with a
painted bay and hatched door apron, open doors carrying the owner code, ISO
type and weights panel, line livery on the solid walls, and props around it.
Props are kept out of the sightlines the camera presets look through (the glass
side, the open doors) — the forklift crosses *behind* the bulkhead for that
reason. Everything is procedural (canvas textures, Three.js primitives); there
are no image assets. The yard is rebuilt only when the footprint changes, not
when the wall mode does.

The fullscreen button uses the Fullscreen API and hides the side panels; it is
hidden where the API is missing (iPhone Safari). The app is sized in `dvh` with
safe-area insets so the playback dock stays above mobile browser toolbars.

---

## 3. Industrial Metrics

* **Volume Utilization %**: $m^3$ packed vs total internal container envelope.
* **Payload Mass**: Real-time weight tracking against the container's structural payload rating (e.g. 28,200 kg for a 20ft ISO container).
* **Center of Gravity (CoG) & Axle Load**: 2D radar display showing lateral (L/R) and longitudinal (F/B) weight balance, warning when uneven loading risks highway rollover or vessel listing.
* **Support Ratio**: Real-world constraint ensuring boxes do not hover in mid-air (minimum 60% supported base).

---

## 4. Verification

Run the test harness:
```sh
node tools/run-tests.mjs cargo-packer
node tools/check-site.mjs
```
