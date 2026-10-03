# Loft Links — Tasks & Feature Suggestions

Tracking feature ideas, suggestions, and active implementations for **Loft Links** (`golf3d`).

---

## 1. Decor & Scenery System

*Transforming courses from abstract geometric lanes into vibrant, immersive environments.*

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
- [ ] **Foliage & Tree Variety**
  - Add low-poly palms for coastal holes (`seaside`, `tidewater`).
  - Pine/evergreen variations for mountain & quarry courses.
- [ ] **Nautical & Course Dressings**
  - Pier moorings, dock cleats, ropes, lighthouses on coastal courses.
  - Windmill machinery details and gears on crazy golf holes.
- [ ] **Gentle Ambient Motion**
  - Subtle wave bobbing for floating watercraft and buoys in `render.js`.

---

## 2. Audio & Atmosphere

*Adding rich environmental audio to match the weather system.*

- [ ] **Coastal & Water Audio**
  - Soft lap of waves and surf audio on Seaside Green, Tidewater, and Millrace.
- [ ] **Wind & Weather Ambiance**
  - Wind rush/howling that scales with the hole's wind speed.
  - Distant thunder rumbles during storm weather presets.
- [ ] **Surface Ball Rolling Sounds**
  - Wood clatter across boardwalks/jetties, hollow clank over metal plates.

---

## 3. Gameplay & Course Design

- [ ] **Gathering Greens / Sunk "Dish"**
  - Authoring helper `dish()` providing a smooth rim without step-downs to create mini-golf gathering bowls (see `PLAN.md`).
- [ ] **Interactive Scenery Elements**
  - Chimes or bells that ring when struck by a high lofted shot.
- [ ] **Course Expansion**
  - Adding decor props across more holes in Tidewater, Quarry, and Whinstone.

---

## 4. UI, Camera & Controls

- [ ] **Compact Bag Cards on Narrow Screens**
  - Adaptive club head vs card metric on small mobile screens.
- [ ] **Ball Tracer / Shot Arch Arc**
  - Optional visual tracer trail behind aerial shots.
- [ ] **Free Inspection / Drone Cam**
  - Orbit inspection view around hole props.
