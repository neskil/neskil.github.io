# Paper Plane Glider — open work

The 3D throw is done. It was built as two tracks: the physics
(`js/flight3d.js`, with the lateral numbers in `js/flight.js`) and the office
(`js/flyview3d.js`, three.js from `vendor/`). This file holds what is still
worth doing, ordered by how much a player would notice. It also keeps what
was learned building it, so nobody has to work it out again.

The axes, the path format and the mapping from `model.js` millimetres to the
plane's body live in the header comments of `flight3d.js` and `flyview3d.js`.
Read those before changing either.

---

## 1. Aiming the angle on a phone

From behind (the default camera), a drag sets power and direction. The
throw's angle needs the slider or the arrow keys, and on a phone the slider
is below the room. Worth trying:

- a second finger moving up and down for the angle;
- a short upward flick at the end of the drag.

The side camera already takes angle and power from a drag, as the 2D view
did.

## 2. More of the room in the missions

Every mission object faces down the room. Ideas:

- hoops turned sideways (`hoops[].facing`), so a curve has to pass through
  them;
- a slalom between two pillars;
- a target on a desk against the wall;
- a pillar on some days' daily bin.

`MISSIONS3D` and the feasibility search in `tests.html` are where they go.
The search is coarse on purpose (it has to run in the suite), so keep new
missions at about 1 throw in 500 or easier.

## 3. Smaller things

- **The 2D fallback can't show the sideways offset.** Results still say
  "1.1 m left". A small top-down strip under the side view would show it.
- **The best-throw ghost is free mode only.** Missions could keep their own
  best per mission.
- **A tumbling sheet just rotates.** Paper flutters; a little roll noise in
  the view when it is stalled would read better than a rigid spin.
- **SwiftShader (headless) renders this at about 10 fps.** Real devices
  manage 60. If a slow phone struggles, cap the pixel ratio at 1.5.

## Findings from building the 3D flight

- **The pitch damping was explicit and unstable.** At throwing speed, `cmq`
  is stiff next to a sheet's tiny inertia. The pitch rate flipped sign every
  step (±60 rad/s, at the cap), which silently ate energy. It is now stepped
  implicitly in both models. To keep the old calibration, `cd0` went from
  0.024 to 0.034: best throws are 17–21 m again.
- **A flat sheet no longer "tumbles".** That tumble was the same flicker. It
  rears up, stalls and drops short, which is what the test now asserts.
- **The raster leaned left.** Cell centres sat exactly on the sheet's edges
  (±105 mm), and the inside test counts one edge but not the other.
  `analyze()` now samples on even millimetres, so symmetric designs are
  exactly symmetric. A dead-band of 0.3 mm on `rollArm` absorbs what is left
  (the glider's nose fold).
- **Lateral tuning lives in two places:** `FLEX` (18°, the levelling) in
  `flight.js` and `CLR` (0.25) in `flight3d.js`. With them, a 10° bank curves a
  dart about 0.35 m and a glider about 1.7 m; 20° puts a glider into the wall.
  Darts fly straight, gliders curve.
- **A deeper keel adds to a lopsided plane's veer.** More side area below the
  CG works against the dihedral. Winglets take most of the veer out.
- **The office desks are real** (`furnish()`): a throw that curves into the
  wall lands on them or bumps them. They go after a mission's own desks, so
  `landedOn` indices hold.
