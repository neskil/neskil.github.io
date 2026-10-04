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
