# Paper Plane Glider — the 3D throw

The Fly step today is a side-on 2D room: `flight.js` models pitch only (x, y,
pitch) and `flyview.js` draws it on a canvas. This plan replaces it with a 3D
throw: a 3D room, a plane that can roll and turn, and aiming left and right.
A lopsided fold should veer, a banked throw should curve, and the existing
missions should still work.

The work is split into **two tracks that run in parallel in separate
sessions**. They meet at one contract, `js/flight3d.js`. Track A (the
physics) is done: `fly3d` is the real 6-DOF model, with the exports the stub
had. Tick the boxes as you go.

---

## The contract (`js/flight3d.js`)

Both tracks code against this. Change it only by agreement: edit this
section in the same commit.

**World axes, metres:** `x` down the room (the throw direction), `y` up, `z`
to the thrower's right. Right-handed, `y` up — three.js's own convention, so
positions go straight into `object.position`. The hand is at `(0,
ROOM3D.release, 0)`.

**Body axes:** forward `+x`, up `+y`, right wing `+z` when level and heading
down the room. Orientation is a unit quaternion `[w, x, y, z]` from body to
world; the identity is level flight straight down the room. In three.js:
`mesh.quaternion.set(qx, qy, qz, qw)`.

**From `model.js` millimetres to body metres:** `buildModel` uses X across
(right wing +), Y along (nose at small Y), Z up. The body point is
`[(info.cgY - Y) / 1000, (Z + keel * 0.35) / 1000, X / 1000]`, so the origin
is roughly the centre of gravity. That mapping flips handedness, so use
`side: DoubleSide` (or reverse the winding).

```js
export const ROOM3D = { length: 24, width: 6, ceiling: 3.2, release: 1.6 };  // z ∈ [-3, 3]; walls at both ends too
export const AIM_LIMITS = { angle: [-15, 60], speed: [2, 12], yaw: [-20, 20], bank: [-40, 40] };
export const SAMPLE3D;                       // seconds between path samples (= 6 * DT = 1/40)
export const DESK_HALF = 0.8;                // a pad with no z0/z1 spans -0.8 … 0.8

fly3d(plane, aim, world = null, maxTime = 30) → {
    distance,        // x where it came to rest, m
    offset,          // z where it came to rest, m (+ = right)
    time,            // airtime until first touchdown, s
    maxHeight, stalls, bonks,
    walls,           // times it hit something side-on: a wall, a pillar, the side of a desk
    landedOn,        // index into world.pads, or null
    hoops,           // bool per world.hoops
    path,            // [[x, y, z, qw, qx, qy, qz], ...] every SAMPLE3D
}
// aim = { angle (deg, up +), speed (m/s), yaw (deg, + = right), bank (deg, + = right wing down) }

samplePath(path, t) → { x, y, z, q: [w, x, y, z], done }   // interpolated pose at t seconds
inBin3d(result, bin) → bool                                 // rest point inside { x, z, width }
MISSIONS3D                                                  // the 3D-only missions, same shape as MISSIONS
rotate(q, v), launch3d(plane, aim), step3d(s, plane, dt, world)   // for an aim preview or a live replay
```

The 3D-only missions live in `MISSIONS3D`, not `MISSIONS`, so the 2D
page never lists a mission it can't do; the 3D view shows
`[...MISSIONS, ...MISSIONS3D]`.

**World objects** (all optional; a missing `z` means 0, the centre line):

| Key | Shape | Notes |
| --- | --- | --- |
| `hoops: [{ x, y, z, r }]` | ring facing down the room | pass = crossing the plane `x = hoop.x` within `r` of `(y, z)` |
| `pads: [{ x0, x1, z0, z1, y }]` | desk top | missing `z0/z1` → `-0.8 … 0.8` |
| `bin: { x, z, width }` | open cylinder, radius `width / 2` | landed in = rest point inside the circle |
| `fans: [{ x, z, width, height, up }]` | upward air column, radius `width / 2` | |
| `pillars: [{ x, z, r }]` | floor-to-ceiling column | new; solid, the plane stops dead |

`dailyChallenge(date)` in `flight.js` gains `binZ`, and fans gain `z`.
`inBin(distance, challenge, offset)` checks by distance alone when `offset`
is left out (the 2D page) and by the rest point when it is passed
(`r.offset`). `MISSIONS[i].check(result, world)` takes a `fly()` or a
`fly3d()` result.

**Stays as it is:** `flight.js` `fly()` remains the 2D reference. Tests
compare against it, and the live "flies about N m" estimate in the Fold step
keeps using it because it is cheap.

---

## Track A — physics and missions

Owns `js/flight3d.js`, `js/flight.js`, `js/fold.js` and the physics checks in
`tests.html`. No DOM, no three.js.

- [x] **Lateral numbers from the folds.** `makePlane` (via `lateral()` in
      `flight.js`) folds each raster cell into 3D the way `model.js` does and
      derives:
      - roll and yaw inertia from the raster (like the pitch inertia today);
      - `clBeta`, roll from sideslip: the dihedral (flown as 18°, see below)
        plus winglets above the CG, minus the keel below it;
      - `cnBeta`, weathervaning, from the keel area behind the CG;
      - `cyBeta`, side force from keel area over wing area;
      - `clp` and `cnr`, roll and yaw damping;
      - `rollArm`, the sideways gap between the centre of lift and the CG;
      - `sweepRoll`, the extra levelling a swept wing gets, in proportion to the
        lift coefficient.
- [x] **6-DOF integrator.** Position, velocity, quaternion and body rates
      `(p, q, r)`; the same `DT = 1/240`. Angle of attack and sideslip come
      from the body-frame air velocity. Lift, drag and pitch reuse
      `coefficients()` and the 2D pitch-moment terms unchanged.
- [x] **Room.**
      - Ceiling bonk as in 2D.
      - Side walls at `z = ±3`: bounce with heavy loss and count `walls`.
      - Pillars stop the plane.
      - Desks as boxes (land on top, bump the side); floor slide with friction.
      - Fans as columns.
      - `bin` checked at the rest point.
- [x] **Throw.** `yaw` turns the launch velocity and heading. `bank` rolls the
      plane about its forward axis at release.
- [x] **Regression: 3D equals 2D.** A symmetric design thrown with
      `yaw = bank = 0` must stay on `z = 0` within 1 cm, and its distance
      must be within 3% of `fly()` for dart, glider and nakamura at 5–8
      angles and speeds. That keeps every existing mission and the
      calibration valid. Do this first, before any tuning.
- [x] **Behaviour checks:**
      - a lopsided free fold turns towards its smaller wing;
      - a banked throw curves the way it is banked and lands off-centre;
      - winglets reduce the veer (a deeper keel *adds* to it: more side area
        below the CG works against the dihedral);
      - no energy is gained without a fan;
      - walls keep `|z| ≤ 3`;
      - the quaternion stays unit length;
      - a flat sheet still stalls and drops short.
- [x] **Missions.** The existing ones keep `z = 0` by default and still
      pass in 3D. There are two 3D-only ones in `MISSIONS3D`:
      - *Off to the side*: a hoop at `z = 1.2`.
      - *Round the pillar*: a pillar in the line of the bin at
        `(11, 0.4)`, so you have to curve it, without touching a wall. About
        1 throw in 500 of a coarse search does it, as hard as *Twenty
        metres*.

      The daily bin gets `binZ ∈ [-1.5, 1.5]`. Extend the feasibility search
      in `tests.html` over `yaw` and `bank` and assert that every mission and
      a sample of daily bins can be beaten with a guided design.
- [x] Replace the stub's body with the real model, keeping the exports.

**Findings along the way** (worth knowing before touching the physics):

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

## Track B — the 3D room, the throw and the release

Owns `vendor/`, `js/flyview3d.js`, `js/app.js`, `index.html`, `style.css`
and the site wiring. Put any checks in their own block at the end of
`tests.html` so the merge stays trivial.

- [ ] **three.js.** Copy `terrarium/vendor/three.min.js` (r128, the UMD
      build that sets `window.THREE`; `cargo-packer/` has the same file) into
      `paper-plane/vendor/`. Load it only when the Fly step first opens, not
      on page load.
- [ ] **`FlyView3D`.** It has the same surface as `FlyView`: `setPlane`,
      `setWorld`, `setAim`, `throwIt`, `visible`, and hooks `onAim`,
      `onThrow`, `onLanded`, `ghost`. app.js can then pick either view with
      one line.
- [ ] **The room.**
      - Floor with metre tape marks.
      - Windows down one wall, ceiling light panels.
      - Desks and the bin, fans with a visible draft, hoops as rings,
        pillars.
      - A low-poly scene with one hemisphere and one directional light. No
        real-time shadows: use a blob shadow under the plane, since it is
        what makes height readable.
- [ ] **The plane.** Built from `buildModel` polygons with the body mapping
      above, white paper with the blue-tinted back face like the 2D model,
      and thin dark edges. It is rebuilt when the folds or the trim change.
- [ ] **Cameras.**
      - Chase, the default: behind and above, smoothed, looking slightly
        ahead.
      - Side: the old view, now in 3D.
      - Top-down.

      A camera button cycles them, and the choice is remembered.
- [ ] **The trail and ghost.** A dashed trail of the flight, a faint trail of
      your best for this mission or daily bin, and a landing marker with the
      distance.
- [ ] **Aiming.**
      - Drag back from the hand: vertical sets the angle, horizontal sets
        `yaw`, and the length sets the speed.
      - A wrist dial (or Q/E) sets `bank`.
      - Arrow keys and Space work too.
      - An aim arc shows the first metre of the throw.
      - Saved aim gains `yaw` and `bank`; share links gain them too.
- [ ] **Fallback.** No WebGL means the 2D `FlyView`, fed `fly3d` with its
      path projected to `(x, y)` and the pitch taken from the quaternion.
- [ ] **Polish.**
      - Slow-motion instant replay.
      - Reduced motion: no camera swing, cut instead.
      - On a phone: under 2.5 MB downloaded, steady 60 fps on a mid phone.
- [ ] **Release.** Do this last, after both tracks are merged:
      - Reshoot `assets/og/paper-plane.png` and the preview webp(s).
      - Update the landing card copy ("throw it in 3D"), the README row and
        the page's description, OG and JSON-LD (keep them identical).
      - Run `run-tests` and `check-site`, then merge to master and push.

---

## Order and merging

- Each track merges to master on its own once both checks are green. The
  stub means either can land first without breaking the page.
- Whoever lands second runs the full suite on the merged result before
  pushing.
- Release (end of Track B) waits until both are in.
- The risky part is the lateral tuning in Track A. With too little
  `clBeta`/`cnBeta` every plane spirals into the floor; with too much, a
  lopsided fold flies straight. Tune against the behaviour checks, not by
  eye.
