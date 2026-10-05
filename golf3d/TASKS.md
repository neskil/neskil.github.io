# Loft Links — Feature Task Tracking

Tracking implementation progress for requested features and physics enhancements.

## Task List

- [x] **1. Gathering Green Physics (`dish` landform)**
  - Implemented `dish(cx, cz, outer, flat, depth, y)` constructor in `golf3d/js/courses.js` and exported in `G3.authoring`.
  - Generates 9 contiguous rectangular pads: flat sunken floor around cup, 4 sloped quadrant banks (N/S/E/W), and 4 bilinear corner banks.
  - Outer rim meets surrounding ground level `y`, floor sunken smoothly by `depth`, slopes stay safely within `CONFIG.HOLD.green` (0.18).
  - Verified with comprehensive unit tests in `golf3d/tests.html` asserting pad counts, surface heights, repose limits, and downhill gathering roll.

- [x] **2. Carry & Total Distance + Bite Representation on Club Cards (Task 3 from PLAN.md)**
  - Added measured `carry` and `total` distance properties to all default and extra clubs in `golf3d/js/config.js`.
  - Updated 3D club cards in `golf3d/js/bag.js` (`sideBySideFigures`, `stackedFigures`, and `labelTexture` band) to show `CARRY` and `TOTAL` figures in metres.
  - Added dedicated gold `BITE 78%` badge to the Checker club card with distinctive backspin styling.
  - Added carry and rollout tracking to `golf3d/js/physics.js` (`w.firstLand`, `w.carry`).

- [x] **3. Keyboard Navigation for Club Picker (Task 4 from PLAN.md)**
  - Added accessible `.picker-clubs` container in `golf3d/index.html` with roving tabindex buttons (`tabindex="0"` on focused/hovered club, `tabindex="-1"` on others).
  - Wired Arrow keys (`ArrowLeft`, `ArrowRight`, `ArrowUp`, `ArrowDown`), `Home`, `End`, `Enter`, `Space`, and `Escape` for rapid keyboard club picking while bag is open.
  - Synchronized roving focus with 3D bag hovering (`G3.bag.setHover`) and selection.
  - Enhanced picker DOM text with full stats readout including carry, roll, and bite percentage.

- [x] **4. Ace Announcement Banner**
  - Updated `holeComplete()` in `golf3d/js/game.js` to celebrate 1-stroke hole-in-one with dedicated "ACE!" headline and "Hole in one · 1 stroke · par X" subtitle.
  - Added `.banner.ace` styling in `golf3d/style.css` featuring shimmering golden border, radiant amber glow, and celebratory typography.

- [x] **5. Tee Indicator on Course-Picker Minimaps**
  - Updated `golf3d/js/minimap.js` (`render()`) to draw a crisp white tee box marker with tee peg dot and a bright red flag pin cup marker.
  - Renders across all 102 holes in the course picker cards, live HUD minimap, and hole preview cards.

- [x] **6. Driving Range / Free Practice Mode**
  - Created practice sandbox course (`G3.RANGE_COURSE`, id `'range'`) in `golf3d/js/courses.js` with tee deck, fairway, rough, practice bunkers, and target greens.
  - Defaults to Driver in hand with the complete 7-club bag available.
  - Accessible via topbar button (`#btn-range`), menu header (`#menu-btn-range`), or keyboard shortcut (`T`).
  - Automatic ball reset after each shot with distance toast reporting (`🎯 Driver · 124.5m · carry 85.2m`).
  - Scorecard displays practice summary and statistics rather than competitive par scoring.

## Decor and Environment Tracking

- [x] **Decor Prop Pipeline (`courses.js` & `render.js`)**
  - Authoring helpers: `buoy`, `piling`, `bench`, `boat`, `sailboat`, `bin`.
  - Non-solid, pure visual dressing; does not collide with or alter ball physics.
  - Safe disposal management via `disposeGroup()` on hole transitions.
  - Full headless validation in `tests.html` (`VALID_DECOR`, coordinates check, cup/tee clearance).
- [x] **Free 3D Asset Integration (CC0 Public Domain)**
  - Kenney Watercraft Kit models downloaded directly into `golf3d/assets/models/` (`LICENSE.txt` CC0 1.0 Universal).
  - Built `golf3d/js/models.js` storing vertex positions, normals, and vertex colors mapped from palette.
  - Works 100% offline, zero build step, and over `file://` with no CORS restrictions or runtime async loader dependencies.
  - Replaced crude procedural box/cone boat with authentic rowboat, dinghy, and single-masted sailboat models.
- [x] **Expanded 3D Asset Library (Kenney Kits - CC0 Public Domain)**
  - Added new models into `golf3d/assets/models/`: `palm.obj`, `pine.obj`, `barrel.obj`, `crate.obj`, `sign.obj`, `windmill.obj`.
  - Stored pre-parsed vertex positions, normals, and vertex colors in `golf3d/js/models.js`.
  - Added authoring helpers in `courses.js` (`palm`, `pine`, `barrel`, `crate`, `sign`, `windmill`) and exposed on `G3.authoring`.
- [x] **Contextual Elevation Snapping & Tasteful Decor Placements**
  - Automatic surface top and water elevation detection in `render.js` (`P.surfaceTop` / `P.waterAt` / `theme.surroundY`).
  - Removed unnatural placements (open sea windmill, floating sea palms, crates floating in open ocean without a dock).
  - Thematically distributed decor: nautical maritime composition for Seaside Green, Dutch windmill & crates for Windmill Works, tropical palms & lagoon boats for Tidewater Reach, canyon pines & mining crates for Quarry Ridge, tee amenities & parkland pines for Ashdown Park.
- [x] **Full Level Editor Decor Support (`level-editor.html` & `editor/editor.js`)**
  - Added all 12 decor prop kinds (`buoy`, `piling`, `bench`, `boat`, `sailboat`, `bin`, `barrel`, `crate`, `palm`, `pine`, `sign`, `windmill`) to tool dropdown and inspector picker.
  - Distinct 2D plan canvas vector renderings for every prop with selection orientation indicators.
  - Auto-detected default elevation on stamp placement + one-click "Auto-snap elevation" button in inspector.
  - Quick yaw angle preset buttons (0°, 45°, 90°, 180°, 270°) and keyboard shortcuts (`D` to equip decor tool, `R` to rotate selected in edit mode).
  - Clean export via `decorCall` generating concise helper syntax and validation in `runChecks()`.
- [ ] **Gentle Ambient Motion**
  - Subtle wave bobbing for floating watercraft and buoys in `render.js`.
