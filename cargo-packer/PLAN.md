# Cargo Packer 3D — Plan & Task List

An interactive 3D visualizer and demonstrator for operations research cargo-packing
and 3D bin-packing algorithms (3D-BPP / Container Loading Problem).

Forked from the 3D rendering foundation of Yard Master (`3d-engine-poc/`),
adapting its Three.js setup, camera rigs, procedural materials, and modular
architecture into an educational, tactile, algorithm-driven container loading
demonstration.

---

## 1. Vision & Goals

1. **Demystify NP-hard 3D packing**: Let users watch how different algorithms
   (Extreme Points, Wall Building, First-Fit Decreasing, and Simulated Annealing)
   tackle the complex spatial puzzle of filling a 3D container or pallet.
2. **Visual, step-by-step playback**: Show *why* an algorithm made a choice—render
   candidate anchor points, highlight the candidate box trying positions, and
   drop it into place with smooth motion and audio feedback.
3. **Real industrial constraints**: Move beyond pure geometric volume packing by
   measuring and visualizing:
   - **Center of Gravity (CoG) & Axle Load**: Longitude and lateral balance to
     prevent truck rollover or vessel listing.
   - **Support & Overhang Rules**: Preventing boxes from hovering or tipping into
     thin air.
   - **Fragility & Stack Weight**: Heavy machinery cannot rest on lightweight cartons.
   - **Orientation Locks**: "This side up" vs. 6-way rotation.
4. **Interactive playground**: Preset industrial manifests (E-Commerce parcels,
   FMCG pallets, Heavy machinery) plus a custom box manifest generator.
5. **Architectural integrity**: Strict separation between `core/` (pure logic &
   algorithms, zero Three.js, 100% headless-tested) and `render/` (Three.js WebGL
   scene, cutaway container, shaders, particle effects, UI).

---

## 2. System Architecture

```
cargo-packer/
├── index.html            # Main application DOM shell & script loader
├── tests.html            # Headless test suite for core/ algorithms (no WebGL)
├── PLAN.md               # This planning & task tracking document
├── CLAUDE.md             # Standing agent instructions & verification commands
├── README.md             # Project documentation & algorithm guide
│
├── core/                 # Pure algorithms & logic — NO THREE, NO DOM
│   ├── types.js          # Box, Container, Orientation, Manifest definitions
│   ├── extremePoints.js  # Extreme Point (EP) 3D heuristic packing algorithm
│   ├── wallBuilding.js   # Layer / Wall-building (back-to-front) algorithm
│   ├── firstFit.js       # First-Fit Decreasing (FFD) shelf/slab baseline
│   ├── metaheuristic.js  # Genetic / Simulated Annealing order search
│   ├── physicsRules.js   # Support ratio, stack weight, CoG calculation
│   └── manifests.js      # Benchmark manifests (FMCG, E-Commerce, Heavy, etc.)
│
├── render/               # Three.js rendering (adapted from 3d-engine-poc)
│   ├── scene.js          # Renderer, camera rigs, lighting, sky, floor
│   ├── containerFrame.js # 20ft/40ft ISO container & EUR-pallet meshes (cutaway/glass)
│   ├── cargoMeshes.js    # Procedural carton, wood crate, drum, and machinery meshes
│   ├── visualGuides.js   # Glowing anchor points (EPs), CoG crosshair, ghost box
│   └── animation.js      # Smooth drop-in animations, placement effects
│
├── game/                 # Controller, playback state & playback loop
│   ├── controller.js     # Step, Play, Pause, Speed, Algorithm swap, Reset
│   └── audio.js          # Procedural sound synthesis (thuds, clicks, chimes)
│
├── ui/                   # DOM controls, metrics & HUD
│   ├── dashboard.js      # Volume fill %, weight, CoG gauge, elapsed compute time
│   ├── controls.js       # Playback bar (Play/Pause, Step, Speed slider)
│   ├── manifestView.js   # Cargo manifest list (remaining vs placed items)
│   └── inspector.js      # Hover/click inspect box details (weight, dimensions, support)
│
├── styles/               # CSS styling (tokens, glassmorphism, responsive)
│   ├── tokens.css        # Palette, typography, layout tokens
│   ├── app.css           # Container view & layout
│   └── hud.css           # Metric gauges, glass cards, controls
│
└── vendor/               # Shared vendor libraries (copied from 3d-engine-poc)
    ├── three.min.js      # Three.js (r128)
    └── OrbitControls.js  # Camera orbit/pan/zoom
```

---

## 3. Algorithm Specifications

### 3.1 Extreme Point (EP) Heuristic (Modern Benchmark)
- **Concept**: When a box of size $(w, h, d)$ is placed at $(x, y, z)$, it generates
  potential corner points where future boxes can be snuggly anchored:
  - $EP_1 = (x + w, y, z)$
  - $EP_2 = (x, y + h, z)$
  - $EP_3 = (x, y, z + d)$
- **Pruning & Projection**: EPs that fall inside existing boxes are projected onto
  surrounding box surfaces to prevent lost placement opportunities.
- **Evaluation Function**:
  Candidate placements are evaluated by a weighted scoring vector:
  $$\text{Score} = w_1 \cdot z + w_2 \cdot y + w_3 \cdot x + w_4 \cdot \text{wastedSpace}$$
  (prioritizing lowest $Y$ for gravity, deepest $Z$ for back-to-front packing, and
  maximum contact surface area).

### 3.2 Wall-Building Heuristic
- **Concept**: Emulates human stevedores loading a maritime container. The container
  length ($Z$) is divided into transverse vertical "walls" or slices of depth $D_{wall}$.
- **Methodology**:
  - Select an initial tier depth based on remaining prominent box sizes.
  - Fill the wall layer in $(X, Y)$ using 2D strip packing.
  - Advance the wall cursor along $Z$ once the current slice is packed.
  - Excellent for structural stability and transit securing; highlights the
    trade-off of residual voids when cargo dimensions vary.

### 3.3 First-Fit Decreasing (FFD Shelf / Slab)
- **Concept**: The classic 1D/2D generalization to 3D.
- **Methodology**:
  - Sort boxes by height or volume descending.
  - Create horizontal "floors" or "shelves" at height $Y_k$.
  - Pack boxes onto the active floor using standard 2D First-Fit.
  - When no more boxes fit on the floor, open a new floor above the tallest box
    in the previous floor.
  - Serves as the greedy, intuitive baseline to show how naive shelf algorithms
    waste vertical headspace.

### 3.4 Metaheuristic Search (Simulated Annealing)
- **Concept**: The packing quality of heuristics depends heavily on input box
  sequence and allowed rotation permutations.
- **Methodology**:
  - Permutes the queue of unplaced items using swap, reverse, and insert moves.
  - Temperature schedule allows downhill moves early, converging on an optimal
    packing sequence.
  - Displays a live generation counter and efficiency curve ($64\% \to 78\% \to 89\%$).

---

## 4. Phase-by-Phase Task Roadmap

### Phase 1: Foundation & Asset Scaffolding
- [x] **1.1 Directory Setup**: Create `/cargo-packer/` structure (`core/`, `render/`, `game/`, `ui/`, `styles/`, `vendor/`).
- [x] **1.2 Vendor Assets**: Vendor `three.min.js` (r128) and `OrbitControls.js`.
- [x] **1.3 Test Harness**: Create `tests.html` with `<div id="summary">` (no Three.js, discovered by `run-tests.mjs`).
- [x] **1.4 Style Tokens**: Port theme tokens (Outfit, Inter, dark slate `#0f172a`, glassmorphism, accent cyan/amber).

### Phase 2: Core Algorithm Engine (`core/`)
- [x] **2.1 Data Models & Types**: Define `ContainerSpec` (20ft, 40ft, EUR-Pallet), `BoxSpec`, `Placement`, and `Orientation6`.
- [x] **2.2 Geometric Collision & Containment**: Pure math bounding-box intersection, container boundary checks, and support calculations.
- [x] **2.3 Extreme Point Heuristic**: Implement EP generation, projection, scoring, and placement loop.
- [x] **2.4 Wall-Building Heuristic**: Implement transverse layer slicing and back-to-front fill.
- [x] **2.5 First-Fit Shelf Baseline**: Implement shelf-based slab packing.
- [x] **2.6 Industrial Rules & Physics Validation**:
  - Center of Gravity $(CoG_x, CoG_y, CoG_z)$ and lateral balance calculation.
  - Support area ratio (e.g. minimum 60% of base supported).
  - Weight and payload distribution.
- [x] **2.7 Manifest Presets**: E-commerce heterogeneous mix, FMCG uniform cartons, Industrial heavy cargo, and pallet tests.
- [x] **2.8 Headless Unit Tests**: Comprehensive test suite in `tests.html` testing determinism, collision-freedom, and bounds for all algorithms (35 assertions passing).

### Phase 3: 3D WebGL Visualization (`render/`)
- [x] **3.1 Scene & Camera Rigs**: Set up scene with soft directional lighting, shadows, grid floor, and orbit camera presets (Iso, Front Cutaway, Top-down, Rear).
- [x] **3.2 Container Shell & Cutaways**:
  - Build procedural 20ft / 40ft container frame (corner castings, corrugated walls, floor).
  - Implement cutaway / translucent side walls toggle so interior boxes are clearly visible.
  - Build EUR-pallet wooden base model.
- [x] **3.3 Box Meshes & Materials**:
  - Procedural corrugated cardboard cartons with taped seams and label decals.
  - Wooden industrial crates and steel drums with accent color coding.
  - Selection / highlight / x-ray hover materials.
- [x] **3.4 Algorithm Visual Guides**:
  - Render glowing candidate Extreme Points (small colored spheres/crosshairs).
  - 3D Center of Gravity marker with plumbline and floor target disk.
  - Ghost preview box trying locations.
- [x] **3.5 Placement Animations**: Smooth drop-in easing animation on step forward.

### Phase 4: Playback Controller & UI (`game/` & `ui/`)
- [x] **4.1 Playback State Machine**: State management (`IDLE`, `PLAYING`, `PAUSED`, `STEPPING`).
- [x] **4.2 Playback Bar**: Play, Pause, Step Forward, Step Back, Reset, Jump to End, and Speed Slider (0.5x, 1x, 5x, Instant).
- [x] **4.3 Metrics Dashboard (HUD)**:
  - Real-time Volume Utilization gauge (% filled, $m^3$ packed vs total).
  - Weight breakdown (total kg vs max container payload).
  - Axle / CoG balance indicator (2D radar crosshair graphic showing deviation from center, status pill).
  - Placed count vs remaining manifest count.
- [x] **4.4 Algorithm & Scenario Switcher**: Buttons to compare algorithms (EP, Wall-Building, First-Fit) on the same manifest.
- [x] **4.5 Procedural Audio**: Tactile thud and click sound effects on box placement using Web Audio API (can be muted).

### Phase 5: Verification, Polish & Site Integration
- [x] **5.1 Test Verification**: Run `node tools/run-tests.mjs cargo-packer` to verify 100% green test passes (35/35 passing).
- [x] **5.2 Site Standards Check**: Run `node tools/check-site.mjs` (ensure viewport meta, analytics tag `G-9GP823TGLB`, robots/sitemap entries).
- [x] **5.3 Mobile & Responsive Layout**: Responsive layout with collapsible drawers on smaller screens.
- [x] **5.4 Homepage Flip Card**: Add `#card-cargo-packer` card to root `index.html` grid.

---

## 5. Architectural Invariants & Non-Negotiables

1. **`core/` never imports THREE or accesses the DOM.**
   All packing heuristics operate solely on numbers and coordinates. This guarantees headless CI execution in under 1 second.
2. **Determinism**: Given the same manifest, seed, and algorithm parameters, the packing result must be 100% bit-for-bit identical across runs and machines.
3. **No Overlaps**: $AABB_A \cap AABB_B = \emptyset$ for every placed pair of boxes. Checked by unit tests and runtime visual assertions.
4. **Zero Build Step**: Pure client-side ES6 modules/IIFEs served directly by GitHub Pages.
