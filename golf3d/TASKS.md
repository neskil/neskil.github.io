# Loft Links (golf3d) — Task Tracker

A living tracking document for enhancements, feature ideas, and architectural improvements to Loft Links.

---

## Active Task: Decor System

- [x] **1. Decor Framework & Data Architecture**
  - [x] Define `decor(kind, x, z, y, opts)`, `buoy`, `piling`, `bench`, `boat`, `bin` helpers in [`js/courses.js`](js/courses.js)
  - [x] Ensure `hole.decor` list is preserved during `build(hole)` and cleanly passed through
  - [x] Add rendering pipeline `addDecor(group, item, theme)` in [`js/render.js`](js/render.js)
  - [x] Add materials and geometry templates for coastal / environment props:
    - **Buoy**: floating bobber in water with bobbing angle, red/yellow body, white reflective stripe, top mast and lantern
    - **Piling (Dolphin)**: cluster of 3 timber mooring pilings with rope wrap in water or shallows
    - **Bench**: wooden slatted seat with backrest and cast-iron frame on promenade/fairway flank
    - **Bin**: park/course waste receptacle with metal lid
    - **Rowboat / Skiff**: wooden dinghy with tapered bow, interior thwarts, and oars floating at water level
  - [x] Seed initial decor onto *Seaside Green* (all 6 holes: Sea Legs, The Bend, The Zigzag, Low Tide, The Horseshoe, The Jetty) to turn floating slabs into an authentic coastal putting links
  - [x] Add headless assertions in [`tests.html`](tests.html) to verify decor integrity (valid kinds, finite coordinates, clear of tee and cup)
  - [x] Bump `G3.VERSION` to `1.46.0` and sync cache-busting `?v=1.46.0` across `index.html`, `level-editor.html`, and `turntable.html`
  - [x] Verify all three suites pass: `ui-tests.html` (29 passed), `shader-tests.html` (127 passed), `tests.html` (2,469 passed)

---

## Roadmap & Suggestions Backlog

### A. Environment & Atmosphere
- [ ] **Decor System** *(Active)*: Non-collidable visual props (buoys, pilings, benches, boats, flags) dressing the empty water and horizon around mini and crazy golf courses.
- [ ] **Distant Horizon Elements**: Subtle low-poly silhouettes or shorelines beyond the water boundary for coastal themes.
- [ ] **Water Splash & Ripple Decor**: Ambient ripples around waterborne pilings or buoys.

### B. Course Geometry & Green Sculpting
- [ ] **The "Dish" Primitive**: Sunk-floor gathering greens / punchbowls that blend flush with incoming fairway lanes without illegal rim steps or repose violations (ref: [`PLAN.md`](PLAN.md#L44-L70)).
- [ ] **Green Reading Aids (Contour Beads)**: Animated gradient dots or subtle contour lines over green pads when the putter is selected, making subtle breaks legible without camera guesswork.
- [ ] **Multi-Path & Bank Shot Geometry**: Visual guide markers or bank mirrors on crazy golf bounce holes.

### C. Bag & Club Information Ergonomics
- [ ] **Carry vs. Total Distance on Cards**: Replace abstract loft/power numbers with estimated flat-ground carry and total rollout yardage (ref: [`PLAN.md`](PLAN.md#L87-L97)).
- [ ] **Visualize `bite` (Backspin)**: Distinct icon or badge on clubs with first-bounce bite (like the Checker) so players know it sticks where it lands.
- [ ] **Compact Mobile Cards**: Reduce card footprint on mobile viewports so 3D clubheads remain in view (ref: [`PLAN.md`](PLAN.md#L71-L86)).
- [ ] **Keyboard Navigation for Bag**: Roving `tabindex` and arrow key navigation across open club row (ref: [`PLAN.md`](PLAN.md#L98-L106)).

### D. Gameplay Feel & Player Feedback ("Juice")
- [ ] **Hole-in-One / Ace Fanfare**: Distinct banner, celebratory audio jingle, and scorecard ace emblem instead of generic birdie/under-par message (ref: [`PLAN.md`](PLAN.md#L109-L110)).
- [ ] **Near-Miss / Clutch Camera**: Cinematic slow-motion or dynamic camera zoom when a putt slows within 1 unit of the cup on a direct line.
- [ ] **Shot Tracer / Trajectory Ghost**: Faint decaying ribbon or dotted arc showing the flight path of the previous shot.

### E. Game Modes & Replayability
- [ ] **Driving Range / Free Practice Mode**: Sandbox tee where players can drop balls and test shots with any club without scorecard penalties.
- [ ] **Pass-and-Play Local Multiplayer**: 2–4 players taking turns on the same device with color-coded balls and combined match scorecard.
- [ ] **Ghost Ball / Best Run Comparison**: Visual replay or ghost trail showing your personal best shot on that hole.
- [ ] **1-Click Level Editor Sharing**: Export custom holes as a compressed URL parameter or shareable code snippet from [`level-editor.html`](level-editor.html).

---

## User Requests Log
*(New requests and notes from discussion will be appended here)*
- **2026-10-03**: Started task file; prioritize Decor System.
