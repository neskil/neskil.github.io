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
- **SwiftShader (headless) renders this at about 10 fps.** Real devices
  manage 60; touch screens are capped at a pixel ratio of 1.5. The action
  camera's timing is in flight seconds, so it still cuts at the right
  moments when frames are slow.
- **The fold preview flies one throw** (`TEST_THROW` in `js/preview.js`).
  Showing the player's own aim from the Fly step as well would tie the two
  steps together.
- **The paper does not bend.** The flutter in the 3D view is a roll and
  pitch shake on a rigid model; wings that flex up under load (the `FLEX`
  of the lateral model) would be the next thing to draw.

## Findings about the folding

- **A mirrored fold's halves are made together**, planned on the sheet as
  it was, which is also what the table animates (`mirroredPlans`). Made one
  after the other, the second half could pick up the first half's flap
  wherever the two reached over the middle, and the plane came out lopsided.
- **Steps keep the exact points they were folded at.** Rounded to half a
  millimetre, the sheet re-folded from the list differed from the one just
  animated about half the time. Only share links round, to 0.01 mm.
- **"Joined" is still worked out from geometry**: two layers whose edges
  line up count as one piece of paper. That is right for creases and wrong
  for two loose flaps that happen to meet edge to edge. Mirrored folds can
  no longer be fooled by it; a one-sided fold across such a seam still
  could. Tracking which facets a crease really joins is the fix if it shows
  up.

## Findings about the pitch

- **Stalled planes used to glide backwards.** Two things together: the
  pitching moment was clamped at 1.6 × the stall angle, so past it there was
  hardly anything turning the nose back into the airflow; and `cmq` was
  −8 to −20, several times what the wing can give. At 2 m/s the nose
  turned at about 0.2 rad/s, so after a stall or a ceiling bonk the plane
  kept its nose up while it fell, and flew tail first back towards the
  thrower. Now `pitchCoefficient` holds all the way round (past the stall a
  flat plate whose push moves aft as it turns broadside, to the
  three-quarter chord flying backwards) and `cmq` comes from where the wing
  is (strip theory, doubled for the air the sheet carries round: −1 to
  −3). A stalled plane drops its nose, dives and swoops out of it.
- **With honest pitch damping, trim matters.** The old damping held the
  throw's attitude, which is what made every design glide whatever its
  elevator. Now each flies at the lift its balance and elevator trim it
  to: the dart, nose-heavy, wants its trailing edge up; the Nakamura flies
  flat and stalls with any up elevator. `DESIGNS[].elevator` is what each
  is set to when chosen. `cd0` went back down to 0.026; best throws are
  16–22 m (dart to Nakamura).
- **The pitch damping is stepped implicitly** in both models. At throwing
  speed it is stiff next to a sheet's tiny inertia; stepped explicitly the
  pitch rate flipped sign every step.
- **Landings.** Steeper than about 50°, a plane digs in (keeps 15 % of its
  speed, `touchSpeed`); flatter, it skids on at half. It then settles flat
  over a few hundredths of a second (`settle`), in 2D and 3D alike, so the
  side view of a straight 3D flight still matches the 2D one sample for
  sample. A wing in ground effect makes less induced drag (`groundEffect`).

## Findings from building the 3D flight

- **A flat sheet no longer "tumbles".** It rears up, stalls and drops short,
  which is what the test asserts.
- **The raster leaned left.** Cell centres sat exactly on the sheet's edges
  (±105 mm), and the inside test counts one edge but not the other.
  `analyze()` now samples on even millimetres, so symmetric designs are
  exactly symmetric. A dead-band of 0.3 mm on `rollArm` absorbs what is left
  (the glider's nose fold).
- **Lateral tuning lives in two places:** `FLEX` (18°, the levelling) in
  `flight.js` and `CLR` (0.25) in `flight3d.js`. A plane turns as hard as it
  is lifting, so the curve follows the trim: on the default throw a 10° bank
  curves a dart (elevator 0.5) about 0.85 m and a Wide Glider (flat) about
  0.9 m; a Nakamura, flying long and slow, goes about 2.4 m, and 15° puts it
  into the wall.
- **A deeper keel adds to a lopsided plane's veer.** More side area below the
  CG works against the dihedral. Winglets take most of the veer out.
- **The office desks are real** (`furnish()`): a throw that curves into the
  wall lands on them or bumps them. They go after a mission's own desks, so
  `landedOn` indices hold.
