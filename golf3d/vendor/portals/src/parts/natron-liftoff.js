// THE LIFTOFF WAVE - hero set piece for the world "natron-liftoff" (Lake Natron, lesser flamingos).
//
// A band of ~8,800 flamingos standing in crimson brine. A trigger line (the FRONT) sweeps along the band:
// ahead of it the birds stop feeding, raise their necks, turn upwind, open their wings and run nine
// pattering steps over 7 m (each footfall a white crown that settles into a ring, the planted foot
// exactly still while the body passes over it); at the front they lift, climb to cruise heights of 2-28 m
// and fly on at 15 m/s with necks out and legs trailing, wings flashing black and scarlet out of step.
// Seen from behind the front it is a breaking wave of rising birds; when the camera gains on it the sheet
// closes over the wings. Every bird near the axis is doubled in the water by a projected mirror copy.
// A courting block of ~150 marchers wheels shoulder to shoulder near the start of the band.
// Everything is posed in vertex shaders from per-instance attributes and ONE number, the front station.
//
// LOCAL SPACE  y = 0 is the water surface. Default axis: straight, the band runs from z = +length/2
//   (station 0) to z = -length/2; the plane flies toward -Z, right = +X, left = -X, so "front" (+Z) is
//   the side it is first seen from. Birds fly toward -Z. With opts.path the band is laid along that path
//   instead (hero-local x,z == path x,z; put hero.object at the water level, unrotated).
// SIZE   flown band `length` 640 m x 40-70 m wide, plus a far band of impostors `tail` 420 m beyond it;
//   fliers cruise at 2-28 m. hero.extent = { length, tail, halfWidth 35, radius 330, height 30 } is the true
//   size. hero.radius (36), height (16) and center (band middle, y 5) deliberately frame only the heart of
//   the wave, so the set-piece viewer orbits at bird-reading distance instead of 800 m away.
// COST   defaults ~147k triangles, 8 draw calls (as flown by the world, with 640 near birds and outliers: ~250k)
//        (near birds 250 x 164, mid birds 1120 x 56, far impostors 7400 x 2,
//   mirror copies 600 x 28 + 2000 impostor mirrors, splash/ring sprites 3600 x 2, water sheet), no lights,
//   no textures, ~100 ms build.
// LIGHT  Custom shaders, linear HDR, scene fog. Lit by uniforms: warm white sun from behind-left
//   (default toward (-0.80, 0.31, 0.51), 18 deg up), pale sky fill, rose bounce from the water. On its first
//   update the piece adopts the scene's first DirectionalLight and HemisphereLight unless opts.light is
//   given; hero.setLight({ sunDir, sunColor, sky, ground }) (colours premultiplied by intensity, the same
//   shape as kit fauna lights, so F.lightFrom(scene) works). Bloom: only splash crowns reach ~1.6.
//
// OPTS   palette  7 hex strings in brief order: crimson water, deep water, flamingo pink, scarlet covert,
//                 salt white, pale sky, cone grey
//        length (640), tail (420), front speed vF (34 m/s: metres of front travel per second of bird clock)
//        path + pathFrom: a makePath and the path distance where station 0 lies (band follows the path)
//        counts { near, mid, far, mirror, sprites }   density 0.6-1.3 scales mid/far
//        hour 'morning'|'dawn'|'evening'|'moon'  (default light only), weather 'calm'|'rains'|'noon' (water
//                 ripple and haze of the built-in sheet), season 'october'|'december'|'dry' (bird density)
//        water: false omits the built-in crimson mirror sheet (then draw your own lake at y = 0; the
//                 mirror copies lie 2 cm above y = 0 and blend over whatever is there)
//        light { sunDir, sunColor, sky, ground }, skyHorizon, skyZenith (colours the water reflects)
//        marchStation, marchGap: station of the marching block and the gap between it and the axis (m)
//        outliers { mid, far, from, horn, keep(x,z) }: birds that never take off: feeding groups beside the
//                 approach (stations from..0, returned as hero.outlierGroups) and the crescent's other horn
// HERO API
//   hero.setFront(s)      station (metres from the band's start) of the LIFTOFF line. Birds at station
//                         s + 48 m start their run, at s + 75 m they look up. In the world:
//                         hero.setFront(cameraPathDistance - pathFrom + lead), lead ~90 m for the wave
//                         (wall of risers 45 m ahead), easing to ~35 m to close the sheet over the wings.
//                         Keep lead >= 30 m: nearer than that, risers cross the plane's height close by.
//   hero.uniforms.uOver   (station from, to): between these the highest near-axis fliers are not pushed out of the
//                         corridor but lift half a second early and cruise at 14-16 m, passing OVER the camera.
//   hero.setProgress(p)   0..1 -> front from -160 m to length + 60 m (same thing, normalised).
//   If neither is ever called the front free-runs on the update() time as a demo (the set-piece viewer):
//   it sweeps the band every 40 s and is 40 m past the band's middle at t = 12 s.
//   hero.frontAt(camS, lead), hero.uniforms, hero.stats, hero.setLight(light)
// ANCHORS (local space)
//   portalSeat  { position, facing, radius 7 }: ring centre, lowest edge in the water, at station length-60,
//               facing back up the band. Standing birds keep 10 m off it; fliers peel to >= 16 m either side.
//   flyThrough  ordered points along the axis at 5-6.5 m: no bird flies within 7 m of the axis (16 m in
//               the last 170 m: the lane), standing birds are under 1 m tall.
//   lane { from, to, halfWidth 15 }, marchers { center, radius, station }, viewpoints { entry, wave, lane },
//   axisAt(s) -> { x, z, yaw, k }, bandStart, bandEnd, sunDir, waterY
// Added for the fix pass (all optional):
//   stragglers { count, from, to, jit(station, rng) }  late low runners near the axis, still pattering under the nose
//   outliers.avoid [s0, s1]   no random outlier group inside that station range
//   outliers.pool { s, lat, r, n, size, minLat }   a feeding group of greater flamingos (size > 1.12 reads paler)
//   escorts N   two dynamic draws (birds + mirrors) posed by the world: hero.escorts.set(i, x, y, z, yaw, pitch, size, rate), commit()
//   uniforms uOverH (overhead cruise height, spread), uPinkV (far legs fade to pink so distant birds do not read scarlet)
// Added for the second pass (all optional):
//   uniforms.uPush (far, near metres)  fliers are pushed out of the flight corridor by DISTANCE from the eye, not by
//                 time since liftoff: they rise in the corridor as a full curtain and only peel aside within
//                 `far`..`near` metres of the camera (and inside the lane), so the wave is never hollow in the middle
//   stragglers    may be an array of blocks { count, from, to, lat [lo, hi], cruise [lo, hi], jit(station, rng) }
//   calm { count, from, to, lat [lo, hi], hold }   small near-tier parties that go on feeding as the wave passes
//   wall { count, from, to, lat, high }   extra mid-tier birds close to the axis; the `high` share cruises 10-13 m
//   marchCount, marchRadius, marchHold (extra seconds before the block runs), marchLead (arc offset)
//   counts.midMirror   that many of the most central mid birds get an impostor mirror (taken from counts.farMirror)
//   birds carry a back-light and rim term (sun through the wings when the eye looks up-sun)
// Added for the fourth pass (all optional):
//   calm and wall may be arrays of blocks; outliers.pool takes along / across (how far the party spreads, in radii)
//   uniforms.uRim (rim gain, through-the-feathers gain): raise both when the sun stands ahead of the beam
//   mirrorClip { pars, uniforms }: GLSL defining float mirrorOnWater(vec2 xz) (under 0.5 = no reflection there), used by
//                 the mesh mirrors (flock and escorts) so that no reflection is drawn on dry crust
// Added for the fifth pass (all optional):
//   outliers.place [{ s, lat, size, beh, tier }]: standing birds set down one by one (they never take off): the world lays
//                 its wading parties with these, by station and metres right of the axis. tier 'mid' uses the mid mesh (for the far birds of a party)
//   calmPlace [{ s, lat, hold, beh, size }]: calm feeders set down one by one (they lift long after the plane has gone)
//   wall blocks take cruise [lo, hi], jit(station, rng) and latMin: mid-tier late runners beside the route
//   outliers.minLat: how close to the route a random outlier group may stand; adjust(bird): see above pack()
// Added for the tenth pass: a standing outlier carries s0 (its station) and, in a random group, grp (the group's entry in
//   hero.outlierGroups, with s, lat, r): opts.adjust may move a whole group and its pool together. export BIRD_CLOCK.
// Added for the eleventh pass: escorts.set takes a bird clock, a behaviour and the metres run, so an escort may stand in the
//   band, look up, run and lift like any other bird (the world's first risers); opts.spriteBirds draws their footfalls. Soft
//   ripple rings (FRAG_SPLASH). The near tier's wings by the eye's distance: two colours cut feather by feather, a notched
//   trailing edge, fingered primaries, a slight camber (VERT_BIRD, FRAG_BIRD).
import * as THREE from 'three';

// The bird's clock, as VERT_BIRD runs it (seconds of bird clock before liftoff at which it looks up and starts its run;
// its climb takes `climb` seconds and `climbPerM` more for every metre of cruise height). For worlds that time things by it.
export const BIRD_CLOCK = { alert: 2.3, run: 1.4, climb: 1.3, climbPerM: 0.09 };

const DEFAULT_PALETTE = ['#9E1B2C', '#5C0F1E', '#F3A0B4', '#D81E3A', '#F2EEE6', '#CBDDE3', '#6E6F73'];
const TAU = Math.PI * 2;

// ---------- one flamingo, three levels of detail ----------
// Model space: nose +Z, up +Y, body +X is the bird's left. aPart = (part, a, b, c):
// 0 body (rigid) | 1 neck ribbon (t, signed radius) | 2 head and bill (along, up, signed radius)
// 3,4 leg ribbons (t, signed half width) | 5,6 wings (span u, chord z offset)
function birdGeometry(lod, K, rng) {
  const P = [], N = [], C1 = [], C2 = [], A = [], I = [], solid = [];
  const vert = (p, n, c1, c2, a) => { P.push(p[0], p[1], p[2]); N.push(n[0], n[1], n[2]); C1.push(c1.r, c1.g, c1.b); C2.push(c2.r, c2.g, c2.b); A.push(a[0], a[1], a[2], a[3]); return P.length / 3 - 1; };
  const tri = (a, b, c, fix) => { I.push(a, b, c); solid.push(fix ? 1 : 0); };
  const quad = (a, b, c, d, fix) => { tri(a, b, c, fix); tri(a, c, d, fix); };
  const mixc = (a, b, t) => a.clone().lerp(b, t);
  const jit = (c, amt) => c.clone().multiplyScalar(1 + (rng() - 0.5) * amt);
  // body
  const rows = lod < 0 ? [[-0.27, 0.006, 0.006, 0.04], [-0.228, 0.03, 0.025, 0.031], [-0.175, 0.057, 0.047, 0.019], [-0.11, 0.086, 0.071, 0.006], [-0.04, 0.106, 0.087, -0.003], [0.03, 0.111, 0.091, -0.006], [0.09, 0.099, 0.081, 0.003], [0.14, 0.073, 0.061, 0.018], [0.178, 0.043, 0.039, 0.032], [0.2, 0.027, 0.027, 0.039]]
    : lod === 0 ? [[-0.27, 0.006, 0.006, 0.04], [-0.18, 0.05, 0.042, 0.02], [-0.08, 0.096, 0.078, 0], [0.01, 0.112, 0.092, -0.006], [0.09, 0.098, 0.08, 0.004], [0.155, 0.058, 0.05, 0.024], [0.2, 0.026, 0.026, 0.038]]
    : lod === 1 ? [[-0.27, 0.006, 0.006, 0.04], [-0.1, 0.09, 0.074, 0.004], [0.07, 0.108, 0.088, 0], [0.2, 0.028, 0.028, 0.036]]
      : [[-0.27, 0.006, 0.006, 0.04], [0.0, 0.11, 0.09, 0], [0.2, 0.028, 0.028, 0.036]];
  const sides = lod < 0 ? 10 : lod === 0 ? 6 : lod === 1 ? 4 : 3;
  const ring0 = [];
  for (let r = 0; r < rows.length; r++) {
    const [z, ry, rx, yo] = rows[r]; const start = P.length / 3; ring0.push(start);
    for (let j = 0; j < sides; j++) {
      const a = (j + 0.5) / sides * TAU, sx = Math.sin(a), cy = Math.cos(a);
      const c = mixc(mixc(K.belly, K.pink, cy * 0.5 + 0.5), K.rose, Math.max(0, -z * 2.2) * 0.5);
      const nl = Math.hypot(sx * ry, cy * rx) || 1;
      vert([sx * rx, yo + cy * ry * (cy < 0 ? 1.08 : 1), z], [sx * ry / nl, cy * rx / nl, r === 0 ? -0.6 : r === rows.length - 1 ? 0.6 : 0], jit(c, 0.08), c, [0, 0, 0, 0]);
    }
  }
  for (let r = 0; r < rows.length - 1; r++) for (let j = 0; j < sides; j++) {
    const a = ring0[r] + j, b = ring0[r] + (j + 1) % sides, c = ring0[r + 1] + (j + 1) % sides, d = ring0[r + 1] + j;
    quad(a, b, c, d, true);
  }
  // neck ribbon
  const nN = lod < 0 ? 12 : lod === 0 ? 7 : lod === 1 ? 3 : 2; let prev = null;
  for (let i = 0; i <= nN; i++) {
    const t = i / nN, rad = 0.036 - 0.015 * t + 0.01 * Math.max(0, 1 - t * 5);
    const c = mixc(K.pink, K.pale, t * 0.7);
    const a = vert([0, 0.035 + 0.45 * t, 0.15], [0, 0, 1], c, c, [1, t, rad, 0]);
    const b = vert([0, 0.035 + 0.45 * t, 0.15], [0, 0, 1], c, c, [1, t, -rad, 0]);
    if (prev) quad(prev[0], prev[1], b, a, false); prev = [a, b];
  }
  // head and bent bill: [along, up, radius, colour]
  const hp = lod <= 0 ? [[0, 0, 0.021, K.pale], [0.032, 0.013, 0.036, K.pale], [0.066, 0.008, 0.033, K.pink], [0.094, -0.004, 0.025, K.bill], [0.124, -0.032, 0.019, K.bill], [0.142, -0.07, 0.006, K.black]]
    : lod === 1 ? [[0, 0, 0.021, K.pale], [0.042, 0.013, 0.036, K.pale], [0.094, -0.004, 0.025, K.bill], [0.142, -0.07, 0.007, K.black]]
      : [[0, 0, 0.02, K.pale], [0.05, 0.008, 0.03, K.pink], [0.13, -0.06, 0.008, K.bill]];
  prev = null;
  for (const h of hp) {
    const a = vert([0, 0.5, 0.2 + h[0]], [0, 0, 1], h[3], h[3], [2, h[0], h[1], h[2]]);
    const b = vert([0, 0.5, 0.2 + h[0]], [0, 0, 1], h[3], h[3], [2, h[0], h[1], -h[2]]);
    if (prev) quad(prev[0], prev[1], b, a, false); prev = [a, b];
  }
  // legs: hip - ankle knob - foot paddle
  const lp = lod <= 0 ? [[0, 0.013], [0.25, 0.009], [0.47, 0.011], [0.5, 0.015], [0.53, 0.01], [0.93, 0.008], [0.95, 0.024], [1, 0.016]]
    : lod === 1 ? [[0, 0.012], [0.5, 0.013], [0.94, 0.009], [1, 0.02]] : [[0, 0.013], [1, 0.013]];
  for (let leg = 3; leg <= 4; leg++) {
    prev = null;
    for (const l of lp) {
      const c = l[0] > 0.94 || Math.abs(l[0] - 0.5) < 0.02 ? K.legDark : K.leg;
      const a = vert([leg === 3 ? 0.045 : -0.045, -0.06 - 0.5 * l[0], -0.02], [0, 0, 1], c, c, [leg, l[0], l[1], 0]);
      const b = vert([leg === 3 ? 0.045 : -0.045, -0.06 - 0.5 * l[0], -0.02], [0, 0, 1], c, c, [leg, l[0], -l[1], 0]);
      if (prev) quad(prev[0], prev[1], b, a, false); prev = [a, b];
    }
  }
  // wings: upper side pink coverts, scarlet band, black flight feathers; under side scarlet and black
  const us = lod < 0 ? [0, 0.1, 0.2, 0.31, 0.42, 0.53, 0.64, 0.75, 0.85, 0.93, 1] : lod === 0 ? [0, 0.2, 0.42, 0.64, 0.84, 1] : lod === 1 ? [0, 0.45, 1] : [0, 1];
  const cs = lod < 0 ? [1, 0.45, -0.25, -1] : lod === 0 ? [1, 0, -1] : [1, -1];
  for (let w = 5; w <= 6; w++) {
    const side = w === 5 ? 1 : -1, grid = [];
    for (let i = 0; i < us.length; i++) {
      // the half chord narrows over the outer half of the wing to a small rounded tip (a blade from any side, never a slab)
      const u = us[i], tp = Math.max(u - 0.3, 0) / 0.7, hc = 0.115 * (1 - 0.5 * u) * Math.max(Math.pow(1 - tp * tp, 0.7), 0.16), zc0 = 0.03 - 0.08 * u - 0.035 * tp * tp; grid.push([]);
      for (const cr of cs) {
        let top, und;
        if (cr > 0.5) { top = u < 0.5 ? mixc(K.pink, K.scarlet, 0.35 + u) : mixc(K.scarlet, K.black, (u - 0.5) * 2); und = u < 0.62 ? K.scarlet : mixc(K.scarlet, K.black, (u - 0.62) * 2.6); }
        else if (cr > -0.5) { top = u < 0.3 ? K.pink : u < 0.58 ? mixc(K.pink, K.scarlet, (u - 0.3) * 3.5) : K.black; und = u < 0.5 ? mixc(K.scarlet, K.crimson, 0.3) : K.black; }
        else { top = u < 0.1 ? K.rose : K.black; und = u < 0.1 ? K.scarlet : K.black; }
        if (lod > 0 && cr > 0.5) { top = u < 0.7 ? mixc(K.pink, K.scarlet, 0.5 + u * 0.5) : K.black; und = u < 0.7 ? K.scarlet : K.black; }
        if (lod < 0) {   // the hero bird: scarlet and pink coverts over the fore wing, black flight feathers behind and at the hand
          if (cr > 0.5) { top = u < 0.55 ? mixc(K.pink, K.scarlet, 0.3 + u) : mixc(K.scarlet, K.black, Math.min(1, (u - 0.55) * 3)); und = u < 0.66 ? K.scarlet : mixc(K.scarlet, K.black, Math.min(1, (u - 0.66) * 4)); }
          else if (cr > 0.2) { top = u < 0.22 ? K.pink : u < 0.6 ? mixc(K.pink, K.scarlet, (u - 0.22) * 2.6) : mixc(K.scarlet, K.black, Math.min(1, (u - 0.6) * 5)); und = u < 0.58 ? mixc(K.scarlet, K.crimson, 0.25) : mixc(K.scarlet, K.black, Math.min(1, (u - 0.58) * 5)); }
          else if (cr > -0.5) { top = u < 0.12 ? K.rose : K.black; und = u < 0.12 ? K.scarlet : K.black; }
        }
        const zc = zc0 + cr * hc;
        grid[i].push(vert([side * (0.06 + u * 0.5), 0.05, zc], [0, 1, 0], top, und, [w, u, zc, cr]));
      }
    }
    for (let i = 0; i < us.length - 1; i++) for (let j = 0; j < cs.length - 1; j++) quad(grid[i][j], grid[i + 1][j], grid[i + 1][j + 1], grid[i][j + 1], true);
  }
  // make solid faces wind outward (front face = along the vertex normals)
  const va = new THREE.Vector3(), vb = new THREE.Vector3(), vc = new THREE.Vector3(), fn = new THREE.Vector3();
  for (let t = 0; t < I.length; t += 3) {
    if (!solid[t / 3]) continue;
    const a = I[t], b = I[t + 1], c = I[t + 2];
    va.set(P[a * 3], P[a * 3 + 1], P[a * 3 + 2]); vb.set(P[b * 3], P[b * 3 + 1], P[b * 3 + 2]); vc.set(P[c * 3], P[c * 3 + 1], P[c * 3 + 2]);
    fn.copy(vb).sub(va).cross(vc.sub(va));
    const d = fn.x * (N[a * 3] + N[b * 3] + N[c * 3]) + fn.y * (N[a * 3 + 1] + N[b * 3 + 1] + N[c * 3 + 1]) + fn.z * (N[a * 3 + 2] + N[b * 3 + 2] + N[c * 3 + 2]);
    if (d < 0) { I[t + 1] = c; I[t + 2] = b; }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(C1, 3));
  g.setAttribute('aCol2', new THREE.Float32BufferAttribute(C2, 3));
  g.setAttribute('aPart', new THREE.Float32BufferAttribute(A, 4));
  g.setIndex(I);
  return g;
}

function quadGeometry() {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  return g;
}

// base geometry + per-instance attribute arrays -> InstancedBufferGeometry
function instanced(base, attrs, count) {
  const g = new THREE.InstancedBufferGeometry();
  g.index = base.index;
  for (const k in base.attributes) g.setAttribute(k, base.attributes[k]);
  for (const k in attrs) g.setAttribute(k, new THREE.InstancedBufferAttribute(attrs[k].subarray(0, count * 4), 4));
  g.instanceCount = count;
  return g;
}

// ---------- shaders ----------
// One state function for every draw: where a bird is and what it is doing, from its instance attributes,
// the front station and (for wingbeats and idle fidgets only) time.
const GLSL_BIRD = /* glsl */`
uniform float uTime, uFront, uVF, uPix, uMarchW, uRipple;
uniform vec3 uCam;
uniform vec4 uLane;   // lane start station, lane full station, corridor half width, lane half width
uniform vec2 uOver;   // stations between which the highest fliers near the axis may pass OVER it (the camera rides below them)
uniform vec2 uOverH;  // cruise height of those over-fliers: base, range (the world keeps the base 5.69 m above its route at the eye)
uniform vec2 uPush;   // fliers in the corridor are moved aside as the eye comes within these distances of them: far, near (m)
attribute vec4 iPos;  // ground x, ground z, flight yaw, path curvature (right +)
attribute vec4 iA;    // station, seed, cruise height, lateral offset from the axis (right +)
attribute vec4 iB;    // behaviour (0 feed 1 stand 2 one-leg rest 3 preen 4 march), size, jitter s, rest yaw
attribute vec4 iC;    // marchers: circle centre x, z, radius, start angle
const float TR = 1.4;
const float ACC = 7.143;
float bTb, bD, bAir, bAlert, bOpen, bSize, bYaw, bPitch, bSeed, bBeh, bMd, bRunW, bFlap, bCy, bSy, bCp, bSp, bMarch, bNeckFly, bDist, bPale;
vec3 bPos; vec2 bFwd, bG, bF0;
float hash1(float n){ return fract(sin(n*127.1 + 3.7)*43758.5453); }
float travel(float rt){ float t1 = min(rt, 2.1); return 0.5*ACC*t1*t1 + 15.0*max(rt - 2.1, 0.0); }
#ifdef ESCORT
// escorts: birds the world places every frame (iPos = x, y, z, yaw; iA = pitch, seed, bird clock, behaviour; iB = 0, size,
// flap rate, metres run). The bird clock is seconds before (-) or after (+) liftoff, as for every bird of the band: far
// below zero it stands and feeds, then looks up, opens its wings and runs (the world moves it; "metres run" plants
// its feet), above zero it flies. An ordinary escort is given 5: in full flight.
void evalBird(){
  bSeed = iA.y; bBeh = iA.w; bSize = iB.y; bPale = smoothstep(1.12, 1.3, iB.y); bTb = iA.z; bMarch = 0.; bMd = 0.; bG = iPos.xz;
  bAlert = smoothstep(-2.3, -1.7, bTb); bOpen = smoothstep(-1.75, -1.25, bTb); bD = iB.w; bRunW = smoothstep(0., 0.5, bD);
  bAir = smoothstep(0., 0.6, bTb); bNeckFly = smoothstep(-1.4, -0.5, bTb);
  bF0 = vec2(sin(iPos.w), cos(iPos.w)); bFwd = bF0; bYaw = iPos.w; bPitch = iA.x;
  bPos = iPos.xyz; bDist = distance(uCam, bPos);
  bSize *= smoothstep(1.2, 3.2, bDist);
  bFlap = uTime*6.2832*(2.9 + hash1(bSeed*3.1)*0.5)*iB.z + bSeed*61.;
  bPos.y -= sin(bFlap)*0.035*bAir;
  bCy = cos(bYaw); bSy = sin(bYaw); bCp = cos(bPitch); bSp = sin(bPitch);
}
#else
void evalBird(){
  float s = iA.x; bSeed = iA.y; bBeh = iB.x; bSize = iB.y; bPale = smoothstep(1.12, 1.3, iB.y);
  float low = 1. - smoothstep(2.0, 2.6, iA.z);     // stragglers that skim under the plane: never pushed out of the corridor
  float over = smoothstep(8.5, 9.5, iA.z)*step(uOver.x, s)*step(s, uOver.y)*step(abs(iA.w), 13.5);
  bTb = (uFront - s)/uVF - iB.z + 0.5*over;      // the over-fliers are the first to go, so they are well up when the camera arrives
  vec2 G = iPos.xy; float restYaw = iB.w;
  bMarch = step(0.5, iC.z); bMd = 0.;
  if (iC.z > 0.5) {
    float clk = min(uFront/uVF, s/uVF + iB.z - 2.3);
    float a = iC.w + uMarchW*clk;
    G = iC.xy + iC.z*vec2(cos(a), sin(a)); restYaw = -a; bMd = uMarchW*iC.z*clk;
  }
  bG = G;
  bAlert = smoothstep(-2.3, -1.7, bTb);
  float turn = smoothstep(-2.2, -1.5, bTb);
  bOpen = smoothstep(-1.75, -1.25, bTb);
  bD = travel(max(bTb + TR, 0.));
  bRunW = smoothstep(0., 0.5, bD);
  bAir = smoothstep(0., 0.6, bTb);
  bNeckFly = smoothstep(-1.4, -0.5, bTb);
  float cruise = mix(iA.z, uOverH.x + uOverH.y*hash1(bSeed*3.7), over), Tc = 1.3 + cruise*0.09;
  float x = clamp(bTb/Tc, 0., 1.);
  float hgt = cruise*x*x*(3. - 2.*x);
  float rate = cruise*6.*x*(1. - x)/Tc;
  float hd = iPos.z; vec2 f0 = vec2(sin(hd), cos(hd)); vec2 r0 = vec2(-f0.y, f0.x); bF0 = f0;
  float lat = iA.w, sg = lat >= 0. ? 1. : -1.;
  float minLat = mix(uLane.z*(1. - over), uLane.w, smoothstep(uLane.x, uLane.y, s + bD))*(1. - low);
  float latNow = lat + (hash1(bSeed*7.3) - .5)*0.14*max(bD - 7., 0.) + sin(uTime*0.45 + bSeed*40.)*0.5*bAir;
  // Far ahead of the eye the corridor is full of risers (the wall has no notch); a bird only peels aside as the eye
  // closes on it, and in the lane before the ring it has peeled aside for good.
  vec2 Pf = G + f0*bD + r0*((latNow - lat) + 0.5*iPos.w*bD*bD);
  float nearEye = 1. - smoothstep(uPush.y, uPush.x, distance(Pf, uCam.xz));
  float inLane = smoothstep(uLane.x, uLane.y, s + bD);
  float push = sg*max(minLat - sg*latNow, 0.)*1.6*max(nearEye, inLane)*smoothstep(0., 0.6, bTb);
  vec2 P = Pf + r0*push;
  vec2 fw = normalize(f0 + r0*(iPos.w*bD));
  float flyYaw = atan(fw.x, fw.y);
  float dy = mod(flyYaw - restYaw + 3.14159265, 6.2831853) - 3.14159265;
  bYaw = restYaw + dy*turn; bFwd = fw;
  float bob = sin(uTime*0.9 + bSeed*17.)*0.3*smoothstep(0.3, 2.2, bTb);
  bPos = vec3(P.x, mix(0.50, 0.45, bRunW)*bSize + hgt + bob, P.y);
  bPitch = mix(mix(0.14, -0.04, bRunW), atan(rate, 15.)*0.8 + 0.03, bAir);
  bDist = distance(uCam, bPos);
  bSize *= smoothstep(1.2, 3.2, bDist);
  bFlap = uTime*6.2832*(2.9 + hash1(bSeed*3.1)*0.5) + bSeed*61.;
  bPos.y -= sin(bFlap)*0.035*bAir;
  bCy = cos(bYaw); bSy = sin(bYaw); bCp = cos(bPitch); bSp = sin(bPitch);
}
#endif
vec3 rotB(vec3 q){ float y = q.y*bCp + q.z*bSp; float z = q.z*bCp - q.y*bSp; return vec3(q.x*bCy + z*bSy, y, -q.x*bSy + z*bCy); }
vec3 toW(vec3 q){ return bPos + rotB(q*bSize); }
// planar mirror: the point's reflection, slid along the eye ray onto the water plane (so depth testing still works)
vec3 mirrorP(vec3 w, out float fade){
  float hh = max(w.y, 0.);
  vec3 m = vec3(w.x, -hh, w.z);
  m.xz += vec2(sin(w.z*1.7 + uTime*1.3 + hh*1.9), cos(w.x*1.9 - uTime*1.1 + hh*2.3))*(0.03 + 0.07*hh)*uRipple;
  float ch = max(uCam.y, 0.05);
  vec3 pw = uCam + (m - uCam)*(ch/(ch + hh));
  float dm = length(pw.xz - uCam.xz);
  pw.y = 0.02 + 0.0005*dm;
  fade = (1. - smoothstep(200., 460., dm))*smoothstep(0.02, 0.5, ch)*(1. - 0.45*smoothstep(8., 30., hh));
  return pw;
}
// planted foot: body distance d, cycle length C, half stance a, phase offset -> (foot ahead of body, lift 0..1)
vec2 footCycle(float d, float C, float a, float off){
  float c = d/C + off; float k = floor(c + 0.5); float x = (c - k)*C;
  float w = clamp(x > 0. ? (x - a)/(C - 2.*a) : 1. - (-a - x)/(C - 2.*a), 0., 1.);
  float sw = w*w*(3. - 2.*w);
  bool st = abs(x) <= a;
  return vec2(st ? -x : mix(-a, a, sw), st ? 0. : sin(3.14159*w));
}
`;

const VERT_BIRD = /* glsl */`
${GLSL_BIRD}
attribute vec4 aPart; attribute vec3 aCol2;
uniform vec3 uPinkV;
varying vec3 vCol, vCol2, vN, vV, vWg; varying vec4 vFlag; varying float vPale, vNearK; varying vec2 vMq;
#include <fog_pars_vertex>
void neckCtl(out vec3 p1, out vec3 p2, out vec3 p3, out float phi){
  float tA = uTime*(0.5 + hash1(bSeed*9.1)*0.4) + bSeed*90.;
  float feed = bBeh < 0.5 ? smoothstep(-0.6, -0.2, sin(tA*0.37)) : 0.;
  float rest = (bBeh > 1.5 && bBeh < 2.5) ? 1. : 0.;
  float preen = (bBeh > 2.5 && bBeh < 3.5) ? smoothstep(-0.3, 0.3, sin(tA*0.5)) : 0.;
  float sx = hash1(bSeed*5.7) > .5 ? 1. : -1.;
  p1 = vec3(0., 0.02, 0.36); p2 = vec3(0., 0.30, 0.02); p3 = vec3(sin(tA*0.8)*0.03, 0.46, 0.17); phi = -0.3 + sin(tA*1.3)*0.15;
  p1 = mix(p1, vec3(0., 0.03, 0.30), rest); p2 = mix(p2, vec3(0., 0.22, 0.), rest); p3 = mix(p3, vec3(0., 0.31, 0.12), rest);
  p1 = mix(p1, vec3(0., 0.10, 0.30), preen); p2 = mix(p2, vec3(sx*0.10, 0.30, 0.05), preen); p3 = mix(p3, vec3(sx*0.09, 0.12 + sin(tA*5.)*0.02, -0.06), preen); phi = mix(phi, -1.9, preen);
  float sw = sin(tA*2.6)*0.07;
  p1 = mix(p1, vec3(0., 0.12, 0.36), feed); p2 = mix(p2, vec3(sw*0.5, -0.18, 0.44), feed); p3 = mix(p3, vec3(sw, -0.47, 0.30), feed); phi = mix(phi, -2.5, feed);
  float tall = max(bMarch, bAlert);
  float fl = sin(uTime*6.5 + floor(bSeed*4.)*1.57), flag = bMarch*(1. - bAlert)*fl/sqrt(fl*fl + 0.12)*0.075;
  p1 = mix(p1, vec3(0., 0.02, 0.33), tall); p2 = mix(p2, vec3(0., 0.30, 0.11), tall); p3 = mix(p3, vec3(flag, 0.55, 0.15), tall); phi = mix(phi, -0.2, tall);
  p1 = mix(p1, vec3(0., 0.03, 0.33), bNeckFly); p2 = mix(p2, vec3(0., 0.025, 0.50), bNeckFly); p3 = mix(p3, vec3(0., 0., 0.66), bNeckFly); phi = mix(phi, -0.12, bNeckFly);
}
// camera-facing ribbon: centre cw, world tangent tw, signed half width
vec3 ribbon(vec3 cw, vec3 tw, float rad, out vec3 nW){
  vec3 vd = uCam - cw; float dist = max(length(vd), 1e-3);
  vec3 sd = cross(tw, vd); sd /= max(length(sd), 1e-4);
  float sg = rad >= 0. ? 1. : -1.;
  nW = normalize(vd/dist + sd*sg*0.9);
  return cw + sd*sg*max(abs(rad)*bSize, 0.75*uPix*dist);
}
void main(){
  evalBird();
  float part = aPart.x; vec3 wpos, nW; vFlag = vec4(0.); float legFar = 0.; vWg = vec3(0.);
  if (part < 0.5) { wpos = toW(position); nW = rotB(normal); vWg = vec3(position.z, position.y, abs(position.x)); }      // the body's own coordinates, for its plumage
  else if (part < 2.5) {
    vec3 p0 = vec3(0., 0.035, 0.15), p1, p2, p3; float phi; neckCtl(p1, p2, p3, phi);
    vec3 c, tg; float rad;
    if (part < 1.5) {
      float t = aPart.y, m = 1. - t;
      c = m*m*m*p0 + 3.*m*m*t*p1 + 3.*m*t*t*p2 + t*t*t*p3;
      tg = 3.*m*m*(p1 - p0) + 6.*m*t*(p2 - p1) + 3.*t*t*(p3 - p2) + vec3(0., 0., 1e-4);
      rad = aPart.z;
    } else {
      vec3 hd = vec3(0., sin(phi), cos(phi)), hu = vec3(0., cos(phi), -sin(phi));
      c = p3 + hd*aPart.y + hu*aPart.z; tg = hd; rad = aPart.w;
    }
    wpos = ribbon(toW(c), rotB(tg), rad, nW); vFlag.x = 1.;
  }
  else if (part < 4.5) {
    float ls = part < 3.5 ? 1. : -1.;
    vec3 hipW = toW(vec3(0.045*ls, -0.06, -0.02));
    vec3 bx = vec3(bCy, 0., -bSy), f3 = vec3(bSy, 0., bCy), base = vec3(bPos.x, 0., bPos.z);
    float sx = hash1(bSeed*5.7) > .5 ? 1. : -1.;
    float off = ls > 0. ? 0. : 0.5;
    vec3 stand = base + bx*(0.045*ls*bSize) - f3*(0.02*bSize); stand.y = -0.06*bSize;
    if (bMarch > 0.5) { vec2 fm = footCycle(bMd, 0.8, 0.22, off); stand += f3*fm.x; stand.y += fm.y*0.1; }
    float lifted = (bBeh > 1.5 && bBeh < 2.5 && ls*sx > 0.) ? 1. - bAlert : 0.;
    stand = mix(stand, hipW + (vec3(0., -0.15, 0.) + f3*0.04)*bSize, lifted);
    vec2 fr = footCycle(bD, 1.56, 0.3, off);
    vec3 run = base + f3*fr.x + bx*(0.04*ls*bSize); run.y = fr.y*0.2*bSize;
    vec3 trail = toW(vec3(0.03*ls, -0.085, -0.535));
    vec3 foot = mix(mix(stand, run, bRunW), trail, smoothstep(0.02, 0.6, bTb));
    float L1 = 0.265*bSize;
    vec3 v = foot - hipW; float dist = clamp(length(v), 1e-3, 2.*L1*0.999); vec3 dir = v/max(length(v), 1e-3);
    foot = hipW + dir*dist;
    vec3 bk = -f3 + dir*dot(f3, dir); bk /= max(length(bk), 1e-3);
    vec3 knee = hipW + dir*(dist*0.5) + bk*sqrt(max(L1*L1 - dist*dist*0.25, 0.));
    float t = aPart.y;
    vec3 c = t < 0.5 ? mix(hipW, knee, t*2.) : mix(knee, foot, t*2. - 1.);
    vec3 tg = t < 0.5 ? knee - hipW : foot - knee; tg += vec3(0., 1e-4, 0.);
    wpos = ribbon(c, tg, aPart.z, nW); vFlag.x = 1.;
    legFar = smoothstep(22., 80., bDist);     // far legs are hairlines: let them take the body's pink, not a red of their own
  }
  else {
    float ws = part < 5.5 ? 1. : -1.; float u = aPart.y, zc = aPart.z;
    float amp = mix(0.95, 0.78, bAir);
    float th1 = amp*sin(bFlap) + 0.12, th2 = amp*0.8*sin(bFlap - 1.0) - 0.15;
    float u2 = max(u - 0.42, 0.);
    vec3 open = vec3(ws*(0.065 + 0.5*((u - u2)*cos(th1) + u2*cos(th1 + th2))), 0.05 + 0.5*((u - u2)*sin(th1) + u2*sin(th1 + th2)), zc + 0.02);
    float tho = u > 0.42 ? th1 + th2 : th1;
    vec3 fold = vec3(ws*(0.088 - 0.036*u), 0.04 + aPart.w*0.0575*(1. - 0.5*u) - 0.015*u, 0.07 - u*0.33);
    // behaviour 5: a standing bird stretches one wing out and down, slowly, and folds it again
    float tS = uTime*(0.5 + hash1(bSeed*9.1)*0.4) + bSeed*90.;
    float str = (bBeh > 4.5 && bBeh < 5.5 && ws*(hash1(bSeed*5.7) > .5 ? 1. : -1.) > 0.) ? smoothstep(0.1, 0.8, sin(tS*0.33))*(1. - bAlert)*(1. - bOpen) : 0.;
    if (str > 0.) {
      float s1 = -0.5 + 0.04*sin(tS*1.7), s2 = -0.3;
      open = mix(open, vec3(ws*(0.065 + 0.5*((u - u2)*cos(s1) + u2*cos(s1 + s2))), 0.05 + 0.5*((u - u2)*sin(s1) + u2*sin(s1 + s2)), zc - 0.05 - 0.1*u), str);
      tho = mix(tho, u > 0.42 ? s1 + s2 : s1, str);
    }
    float wOpen = max(bOpen, str);
    // a slight camber: the open wing arches along its chord (leading and trailing edges a little below the line
    // between them), and its normal follows, so the light falls off across it as over a feathered vault
    float cam = 0.03*(1. - aPart.w*aPart.w)*(1. - 0.6*u);
    open += vec3(-ws*sin(tho), cos(tho), 0.)*cam;
    wpos = toW(mix(fold, open, wOpen));
    nW = rotB(normalize(mix(vec3(ws, 0.25, 0.), vec3(-ws*sin(tho), cos(tho), 0.5*aPart.w*(1. - 0.5*u)), wOpen)));
    vFlag.y = 1.; vFlag.z = (1. - wOpen)*0.8;
    vWg = vec3(u, aPart.w, wOpen);   // span, chord (-1 trailing edge .. 1 leading edge), how far open
  }
  vCol = mix(color, uPinkV, legFar*0.75); vCol2 = aCol2; vN = nW; vPale = bPale; vV = uCam - wpos; vMq = wpos.xz;
  vNearK = 1. - smoothstep(15., 28., bDist);      // the near tier, by the eye's distance: the wings show their feathers
#ifdef MIRROR
  float fd; wpos = mirrorP(wpos, fd); vFlag.w = fd; vMq = wpos.xz;
#endif
  vec4 mvPosition = viewMatrix*modelMatrix*vec4(wpos, 1.);
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;

const FRAG_BIRD = /* glsl */`
uniform vec3 uSunDir, uSunColor, uSkyColor, uGroundColor, uPink, uDeep, uSalt, uScarlet;
uniform vec2 uRim;      // gain of the rim light, gain of the light through the feathers
varying vec3 vCol, vCol2, vN, vV, vWg; varying vec4 vFlag; varying float vPale, vNearK; varying vec2 vMq;
#include <fog_pars_fragment>
//MIRROR_CLIP_PARS
#ifdef MIRROR
uniform vec3 uCam; uniform float uTime;
float mrH(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x*p.y); }
float mrN(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3. - 2.*f);
  return mix(mix(mrH(i), mrH(i + vec2(1., 0.)), f.x), mix(mrH(i + vec2(0., 1.)), mrH(i + vec2(1., 1.)), f.x), f.y); }
#endif
void main(){
  vec3 N = normalize(vN + vec3(0., 1e-4, 0.));
  vec3 alb = vCol;
  if (vFlag.x < 0.5 && !gl_FrontFacing) { N = -N; alb = vCol2; }
  alb = mix(alb, uPink, vFlag.z);
  float fwB = fwidth(clamp(vWg.x, -0.3, 0.25)*24.);      // taken here, outside the branch
  if (vFlag.x < 0.5 && vFlag.y < 0.5) {
    // the body's plumage, from its own coordinates (tail -0.27 .. breast 0.2, belly -0.11 .. back 0.11): a paler belly,
    // a darker rose line where the folded coverts and scapulars meet the flank, soft scalloped feather rows over the
    // back, a darker rump. Low in contrast, and only while a feather row is wider than a pixel.
    float bz = clamp(vWg.x, -0.3, 0.25), by = clamp(vWg.y, -0.15, 0.15), det = 1. - smoothstep(0.2, 0.7, fwB);
    float lineY = 0.012 - 0.1*bz;
    alb = mix(alb, mix(alb, uSalt, 0.55), 0.5*smoothstep(0.01, -0.07, by - lineY));
    float flank = smoothstep(0.03, 0.06, vWg.z)*smoothstep(-0.24, -0.16, bz)*(1. - smoothstep(0.08, 0.15, bz));
    alb *= 1. - 0.3*flank*det*(1. - smoothstep(0.004, 0.016, abs(by - lineY)));
    float rows = abs(fract(bz*24. + 0.35*sin(by*70. + vWg.z*40.)) - 0.5)*2.;
    alb *= 1. - 0.13*det*smoothstep(0., 0.03, by - lineY)*smoothstep(0.6, 0.95, rows)*(1. - smoothstep(0.1, 0.17, bz));
    alb *= 1. - 0.12*smoothstep(-0.14, -0.25, bz);
  }
  // close to the lens the spread wing shows its feathers: flight feathers with pale shafts and dark gaps, two scalloped
  // rows of coverts, rounded feather tips along the trailing edge and fingered primaries at the tip
  float fu = vWg.x*26., fwU = fwidth(fu);
  float wU = clamp(vWg.x, 0., 1.), wC = clamp(vWg.y, -1., 1.), fwC = fwidth(wC);      // span, chord (held to their own ranges), taken outside the branch
  if (vFlag.y > 0.5) {
    // THE NEAR TIER'S WINGS (by the eye's distance, vNearK): the lesser flamingo's two colours cut feather by feather.
    // Coverts over the fore wing (above: pink at the shoulder and the leading edge, a scarlet band down the middle of
    // the wing; below: scarlet all over), a clear, stepped break to black flight feathers behind them and over the
    // whole hand, a trailing edge notched between the tips of nine secondaries, the primaries parted into fingers.
    float nearW = vNearK*vWg.z;
    if (nearW > 0.01) {
      float cb = mix(mix(-0.12, 0.2, smoothstep(0.08, 0.5, wU)), 1.1, smoothstep(0.5, 0.86, wU)) + 0.1*(abs(fract(wU*12.) - 0.5) - 0.25);
      float aaC = max(0.035, 1.2*fwC), blk = smoothstep(-aaC, aaC, cb - wC);
      float band = smoothstep(0.06, 0.26, wU)*(1. - 0.6*smoothstep(0.35, 0.95, wC))*(0.75 + 0.25*smoothstep(0.3, 0.7, abs(fract(wU*12. + 0.5) - 0.5)*2.));
      vec3 cov = gl_FrontFacing ? mix(uPink, uScarlet, 0.25 + 0.75*band) : mix(uScarlet, uScarlet*vec3(0.8, 0.55, 0.6), 0.6*(1. - band));
      vec3 fl = vec3(0.02, 0.017, 0.022)*(1. + 1.2*smoothstep(0.75, 1., 1. - abs(fract(wU*9.) - 0.5)*2.)*(1. - smoothstep(0.7, 0.9, wU)));      // a paler shaft down each flight feather
      alb = mix(alb, mix(cov, fl, blk), nearW);
      float sN = abs(fract(wU*9.) - 0.5)*2.;
      if (wC < -1. + nearW*0.55*sN*sN*(1. - smoothstep(0.74, 0.9, wU))) discard;                       // the notch between two secondaries' tips
      if (abs(fract(wC*1.7 + 0.15) - 0.5)*2. > 1. - 0.6*nearW*smoothstep(0.76, 0.96, wU)) discard;      // the slots between the primaries
    }
    float det = (1. - smoothstep(0.22, 0.6, fwU))*vWg.z;
    float sF = abs(fract(fu) - 0.5)*2.;
    float aft = 1. - smoothstep(-0.35, 0.15, vWg.y);
    alb *= 1. - det*aft*0.34*smoothstep(0.7, 0.96, sF);
    alb += det*aft*0.035*(1. - smoothstep(0., 0.16, sF));
    float row = abs(fract(vWg.y*1.5 + 0.25 + 0.1*sin(fu*3.14159)) - 0.5)*2.;
    alb *= 1. - det*(1. - aft)*0.17*smoothstep(0.72, 0.96, row);
    float edge = -1. + det*(0.2*sF*sF + 0.55*smoothstep(0.84, 1., vWg.x)*smoothstep(0.45, 1., sF));
    if (vWg.y < edge - 0.002) discard;
    // the wing ends in a rounded tip at any range and from any side, never a square block
    float tu = clamp(vWg.x - 0.9, 0., 0.1)/0.1, tc = clamp(vWg.y, -1., 1.);
    if (tu*tu + tc*tc > 1.02) discard;
  }
  alb = mix(alb, uSalt*vec3(1.02, 0.86, 0.87), vPale*0.36*smoothstep(0.2, 0.4, alb.g));   // greater flamingos: taller and far paler
  float ndl = dot(N, uSunDir);
  float dif = clamp((ndl + 0.3)/1.3, 0., 1.);
  vec3 hemi = mix(uGroundColor, uSkyColor, N.y*.5 + .5)*1.3;
  vec3 c = alb*(hemi + uSunColor*dif)*0.3183;
  c += alb*uSunColor*(vFlag.y*0.4*max(-ndl, 0.)*0.3183);
  c *= 0.86 + 0.28*clamp(N.y*.5 + .5, 0., 1.);
  // seen against the light the feathers glow through and the outline catches the sun
  vec3 V = normalize(vV + vec3(0., 1e-4, 0.));
  float back = max(dot(-V, uSunDir), 0.), fres = 1. - abs(dot(N, V)); fres *= fres*fres;
  c += alb*uSunColor*0.3183*(0.5*uRim.y*back*back*(0.3 + 0.7*vFlag.y) + 0.45*uRim.x*fres*smoothstep(-0.3, 0.5, back + 0.25*N.y));
#ifdef MIRROR
#ifdef MCLIP
  if (mirrorOnWater(vMq) < 0.5) discard;      // brine mirrors; dry crust does not
#endif
  // A reflection in the brine is the bird's own shape upside down, but darker than the bird and stained by the water,
  // broken into strokes by the ripple and strongest where the eye meets the sheet at a low angle. Close to the eye it is
  // seen steeply, so the brine shows through it: dark crimson there, a rose stroke far off.
  vec3 Vm = uCam - vec3(vMq.x, 0., vMq.y); float dm = max(length(Vm), 1e-3), mF = 1. - clamp(Vm.y/dm, 0., 1.), mF2 = mF*mF;
  float Fm = 0.03 + 0.9*mF2*mF2*sqrt(mF);
  float brk = smoothstep(0.2, 0.6, mrN(vMq*5.5 + uTime*vec2(1.3, 0.9)) + 0.4*mrN(vMq*14. - uTime*1.7));
  float farM = smoothstep(14., 48., dm);
  vec3 stain = c*vec3(1., 0.5, 0.55);
  vec3 mc = mix(uDeep*0.5 + stain*0.3, mix(uDeep, c*vec3(1., 0.74, 0.78), 0.66), farM);
  gl_FragColor = vec4(mc, vFlag.w*mix(0.45 + 0.55*Fm, 0.95, farM)*mix(1., brk, mix(0.55, 0.25, farM)));
#else
  gl_FragColor = vec4(c, 1.);
#endif
  #include <fog_fragment>
}`;

// far tier: a two-triangle billboard that draws a flamingo (standing, feeding, running or flying) as 2D shapes
const VERT_FAR = /* glsl */`
${GLSL_BIRD}
uniform vec3 uSunDir;
varying vec2 vUv; varying vec4 vAx, vWg, vNk, vLg; varying float vDif, vFade;
#include <fog_pars_vertex>
void main(){
  evalBird();
  vec3 vd = uCam - bPos; float dist = max(length(vd), 1e-3); vec3 vn = vd/dist;
  vec3 rgt = cross(vec3(0., 1., 0.), vn); rgt /= max(length(rgt), 1e-4);
  vec3 up = cross(vn, rgt);
  float px = uPix*dist, R = 0.78*max(bSize, 0.01), sc = max(R, 2.5*px);
  vec3 f3 = rotB(vec3(0., 0., 1.)), l3 = rotB(vec3(1., 0., 0.)), u3 = rotB(vec3(0., 1., 0.));
  vec2 ax = vec2(dot(f3, rgt), dot(f3, up));
  float th = 0.85*sin(bFlap) + 0.1;
  vec3 wl = l3*cos(th) + u3*sin(th), wr = -l3*cos(th) + u3*sin(th);
  vWg = vec4(dot(wl, rgt), dot(wl, up), dot(wr, rgt), dot(wr, up))*0.5*bOpen;
  vec2 U = vec2(0., max(up.y, 0.2));
  float tA = uTime*(0.5 + hash1(bSeed*9.1)*0.4) + bSeed*90.;
  float feed = (bBeh < 0.5 ? smoothstep(-0.6, -0.2, sin(tA*0.37)) : 0.)*(1. - bAlert);
  float tall = mix(0.46, 0.56, max(bAlert, bMarch));
  vec2 mid = mix(mix(ax*0.30 + U*0.12, ax*0.38 - U*0.08, feed), ax*0.42, bNeckFly);
  vec2 head = mix(mix(ax*0.17 + U*tall, ax*(0.32 + 0.05*sin(tA*2.6)) - U*0.45, feed), ax*0.74, bNeckFly);
  vNk = vec4(mid, head);
  float trail = smoothstep(0.02, 0.6, bTb);
  float runPh = bRunW*(1. - trail);
  vLg = vec4(mix(-U*0.56 - ax*0.02, -ax*0.66, trail), runPh*(0.5 + 0.5*sin(bD*8.05)), px/sc*0.78);
  vAx = vec4(ax, bOpen, bNeckFly);
  float sdn = dot(normalize(vn + vec3(0., 0.35, 0.)), uSunDir);
  vDif = max(clamp((sdn + 0.3)/1.3, 0., 1.), 0.36 + 0.3*sdn);      // a bird is round: seen across the light, half of it is lit
  vUv = position.xy;
  vec3 wpos = bPos + (rgt*position.x + up*position.y)*sc; vFade = 1.;
#ifdef MIRROR
  float fd; wpos = mirrorP(wpos, fd); vFade = fd;
#endif
  vec4 mvPosition = viewMatrix*modelMatrix*vec4(wpos, 1.);
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;

const FRAG_FAR = /* glsl */`
uniform vec3 uSunColor, uSkyColor, uGroundColor, uPink, uScarlet, uSalt, uDeep;
varying vec2 vUv; varying vec4 vAx, vWg, vNk, vLg; varying float vDif, vFade;
#include <fog_pars_fragment>
float sdSeg(vec2 p, vec2 a, vec2 b){ vec2 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba)/max(dot(ba, ba), 1e-6), 0., 1.); return length(pa - ba*h); }
void main(){
  vec2 p = vUv*0.78; float px = vLg.w, fly = vAx.w;
  vec2 ax = vAx.xy; float al = length(ax); vec2 an = ax/max(al, 1e-3); vec2 pn = vec2(-an.y, an.x);
  if (pn.y < 0.) pn = -pn;
  float La = 0.1 + 0.13*al;
  vec2 bp = vec2(dot(p, an)/La, dot(p, pn)/0.1);
  bp.y *= bp.y < 0. ? 0.94 : 1.1;
  float dBody = length(bp) - 1.;
  float farK = smoothstep(0.05, 0.2, px);                       // sprite only a few pixels tall: a pink body, no fat red legs
  bp /= 1. + 0.9*farK; dBody = length(bp) - 1.;
  float thin = max(0.013, px*0.55*(1. - 0.75*farK));
  vec2 nb = ax*0.14 + pn*0.02;
  float dNeck = min(sdSeg(p, nb, vNk.xy), sdSeg(p, vNk.xy, vNk.zw)) - max(0.017, px*0.55);
  float dHead = length(p - vNk.zw) - max(0.03, px*0.65);
  vec2 billEnd = vNk.zw + an*(0.05 + 0.04*al) - vec2(0., 0.05)*(1. - fly);
  float dBill = sdSeg(p, vNk.zw, billEnd) - max(0.014, px*0.5);
  vec2 lo = an*(0.035*al)*(1. - fly) + vec2(0.012, 0.)*(1. - fly);
  float dLeg = min(sdSeg(p, -ax*0.04 + lo, vLg.xy + lo), sdSeg(p, -ax*0.04 - lo, vLg.xy - lo)) - thin;
  float tl = clamp(dot(p, vWg.xy)/max(dot(vWg.xy, vWg.xy), 1e-5), 0., 1.);
  float tr = clamp(dot(p, vWg.zw)/max(dot(vWg.zw, vWg.zw), 1e-5), 0., 1.);
  float wRad = max(0.075*vAx.z, px*0.6);
  float dWl = length(p - vWg.xy*tl) - wRad*(1. - 0.55*tl);
  float dWr = length(p - vWg.zw*tr) - wRad*(1. - 0.55*tr);
  float dSplash = length((p - vec2(0., -0.5))*vec2(0.62, 1.4)) - max(0.2, 2.0*px)*vLg.z;
  vec3 alb = uPink; float d = 1., up = clamp(p.y*4., -1., 1.);
  if (dLeg < 0.) { alb = mix(uPink, uScarlet, 0.3*(1. - farK))*mix(0.85, 1., farK); d = dLeg; }
  if (dNeck < 0.) { alb = mix(uPink, uSalt, 0.12); d = dNeck; up = 0.3; }
  if (dBill < 0.) { alb = mix(uScarlet*0.35, vec3(0.02), smoothstep(0.03, 0.07, length(p - vNk.zw))); d = dBill; }
  if (dHead < 0.) { alb = mix(uPink, uSalt, 0.2); d = dHead; up = 0.4; }
  if (dBody < 0.) {
    alb = uPink; d = dBody; up = clamp(bp.y, -1., 1.);
    if (vAx.z < 0.5 && bp.y > -0.45 && bp.y < 0.1 && bp.x < 0.15 && bp.x > -0.8) alb = mix(uPink, uScarlet, 0.2);
    if (bp.x < -0.78) alb = mix(uPink, vec3(0.03), 0.6*(1. - vAx.z));
  }
  if (vAx.z > 0.05) {
    if (dWl < 0.) { alb = tl > 0.58 ? vec3(0.02) : mix(uPink, uScarlet, 0.15 + tl); d = dWl; up = 0.2; }
    if (dWr < 0.) { alb = tr > 0.58 ? vec3(0.02) : mix(uPink, uScarlet, 0.15 + tr); d = dWr; up = 0.2; }
  }
  vec3 c = alb*(mix(uGroundColor, uSkyColor, 0.5 + 0.4*up)*1.3 + uSunColor*vDif*(0.8 + 0.2*up))*0.3183;
  if (dSplash < 0. && vLg.z > 0.02) { c = uSalt*1.25; d = dSplash; }
  if (d > 0.) discard;
#ifdef MIRROR
  gl_FragColor = vec4(mix(uDeep, c*vec3(1., 0.74, 0.78), 0.68), 0.92*vFade);
#else
  gl_FragColor = vec4(c, 1.);
#endif
  #include <fog_fragment>
}`;

// splash crowns (slots 0,1) and rings (slots 2,3): each slot shows the latest footfall of its parity
const VERT_SPLASH = /* glsl */`
${GLSL_BIRD}
attribute vec4 iS;
varying vec2 vUv; varying vec3 vK, vRg; varying vec2 vSq;
#include <fog_pars_vertex>
void main(){
  evalBird();
  float slot = iS.x, j = mod(slot, 2.), ring = step(1.5, slot);
  float nMax = min(floor((bD + 0.3)/0.78), 9.);
  float n = nMax - mod(nMax - j, 2.);
  float dT = max(0.78*n - 0.3, 0.01);
  float age = bTb + TR - sqrt(2.*dT/ACC);
  vec2 r0 = vec2(-bF0.y, bF0.x);
  vec2 fp = bG + bF0*(0.78*n) + r0*((mod(n, 2.) > 0.5 ? 1. : -1.)*0.04 + 0.5*iPos.w*(0.78*n)*(0.78*n));      // along the bird's own curve
  float on = step(0.5, n)*step(0., age);
  vec3 wpos; float alpha, size;
  vec3 vd = uCam - vec3(fp.x, 0., fp.y); float dist = max(length(vd), 1e-3);
  if (ring < 0.5) {
    float a = clamp(age/0.4, 0., 1.);
    size = (0.1 + 0.17*sqrt(a))*bSize; alpha = on*(1. - a*a);
    vec3 rgt = cross(vec3(0., 1., 0.), vd); rgt /= max(length(rgt), 1e-4);
    size = max(size, 2.3*uPix*dist);
    wpos = vec3(fp.x, 0., fp.y) + rgt*(position.x*size) + vec3(0., (position.y + 1.)*size*(0.45 + 0.6*a), 0.);
  } else {
    float a = clamp(age/1.5, 0., 1.);
    size = 0.2 + 1.15*sqrt(a); alpha = on*(1. - a)*(1. - a)*0.5;
    if (bTb < -2.3) {   // idle: slow rings round a wading leg
      float ph = fract(uTime*0.33 + bSeed*7. + j*0.5);
      size = 0.1 + 0.95*ph; alpha = 0.45*(1. - ph)*smoothstep(0., 0.15, ph); fp = bPos.xz;
    }
    wpos = vec3(fp.x + position.x*size, 0.03 + 0.0004*dist, fp.y + position.y*size);
  }
  alpha *= 1. - smoothstep(260., 420., dist);
  if (alpha < 0.004) wpos = vec3(fp.x, -5., fp.y);
  vUv = position.xy; vK = vec3(ring, alpha, bSeed*40. + n); vSq = fp; vRg = vec3(wpos.xz, max(size, 0.05));      // where this point of a ring lies on the water, and the ring's radius in metres
  vec4 mvPosition = viewMatrix*modelMatrix*vec4(wpos, 1.);
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;

const FRAG_SPLASH = /* glsl */`
uniform vec3 uSalt, uSkyColor, uDeep; uniform float uTime;
varying vec2 vUv; varying vec3 vK, vRg; varying vec2 vSq;
float spH(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x*p.y); }
float spN(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3. - 2.*f);
  return mix(mix(spH(i), spH(i + vec2(1., 0.)), f.x), mix(spH(i + vec2(0., 1.)), spH(i + vec2(1., 1.)), f.x), f.y); }
//SPLASH_CLIP_PARS
#include <fog_pars_fragment>
void main(){
  float a; vec3 c;
  float rr = length(vUv), fw = fwidth(rr);       // taken here, outside the branch
  #ifdef MCLIP
  if (mirrorOnWater(vSq) < 0.5) discard;         // a foot that comes down on dry crust throws no spray and leaves no ring
  #endif
  if (vK.x < 0.5) {
    // a burst of spray, not a fan: thin uneven jets broken into beads close to; one soft fleck far off
    float r = length(vUv*vec2(1., 0.85)), ang = atan(vUv.x, vUv.y + 1.3);
    float jets = 0.5 + 0.5*sin(ang*17. + vK.z), beads = 0.5 + 0.5*sin(r*13. - vK.z*2.3 + ang*5.);
    float fan = 1. - smoothstep(0.45, 1., abs(vUv.x)/(0.3 + 0.45*(clamp(vUv.y, -1., 1.) + 1.)));      // narrow at the foot, opening upward
    // close to: separate jets and beads with gaps between (never a soft ball); far off: one low white fleck lying on the waterline
    float jet = smoothstep(0.5, 0.92, jets*0.7 + beads*0.45)*(1. - smoothstep(0.2, 1., r))*fan*smoothstep(-1., -0.7, vUv.y)*0.85;
    float fleck = 0.55*(1. - smoothstep(0.25, 1., length(vec2(vUv.x*1.15, (vUv.y + 0.72)*3.4))));
    a = mix(jet, fleck, smoothstep(0.06, 0.22, fw));
    c = uSalt*1.2;
  } else {
    // SOFT RINGS: a swell riding outward from the footfall: a light crest with a dark trough inside it, a weaker crest
    // and trough inside those. The crest is a hand wide on the water (never drawn under a pixel and a half: below that
    // it pales instead of thinning to a hairline); the brine's own ripple bends it and breaks it into arcs (noise on
    // the water where the ring lies, so rings that overlap are broken together and their crests and troughs lie
    // softly over one another); it fades outward with age (the vertex shader's alpha). No closed hairline circle.
    float sz = clamp(vRg.z, 0.05, 4.);
    float n1 = spN(vRg.xy*2.3 + uTime*vec2(0.5, 0.3)), n2 = spN(vRg.xy*5.3 - uTime*vec2(0.4, 0.6));
    float n0 = spN(vRg.xy*0.9 + uTime*vec2(0.17, -0.11) + 7.);
    float rw = clamp(rr + (0.3*(n0 - 0.5) + 0.12*(n1 - 0.5) + 0.04*(n2 - 0.5))/sz, 0., 1.5);      // the ring's across coordinate, bent by the ripple and held to its own range
    float w0 = 0.13/sz, w = clamp(max(w0, 1.6*fw), 0.02, 0.36);
    float soft = clamp(w0/w, 0.22, 1.);
    float x1 = clamp((rw - 0.8)/w, -8., 8.);
    float crest = exp(-x1*x1) + 0.16*exp(-(x1 + 3.1)*(x1 + 3.1));
    float trough = exp(-(x1 + 1.55)*(x1 + 1.55)) + 0.16*exp(-(x1 + 4.6)*(x1 + 4.6));
    float arc = smoothstep(0.36, 0.62, spN(vRg.xy*0.8 + vK.z*0.37) + 0.5*(n1 - 0.5))*(0.5 + 0.5*smoothstep(0.25, 0.6, n2));
    float la = crest*arc, da = trough*arc;
    a = clamp(0.66*la + 0.6*da, 0., 0.68)*soft*(1. - smoothstep(0.9, 1., rr));
    c = mix(uDeep*0.5, mix(uSkyColor*0.3183, uSalt, 0.4)*0.8, clamp(la/max(la + da, 1e-3), 0., 1.));
  }
  a *= vK.y;
  if (a < 0.003) discard;
  gl_FragColor = vec4(c, a);
  #include <fog_fragment>
}`;

// built-in crimson mirror: brine body colour, analytic sky reflection, ripples, drifting cat's paws, scum lines
const VERT_WATER = /* glsl */`
varying vec3 vP;
#include <fog_pars_vertex>
void main(){
  vP = position;
  vec4 mvPosition = viewMatrix*modelMatrix*vec4(position, 1.);
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;

const FRAG_WATER = /* glsl */`
uniform vec3 uCam, uShallow, uDeep, uSkyHor, uSkyZen, uSunDir, uSunColor, uSalt;
uniform float uTime, uRipple, uLum;
varying vec3 vP;
#include <fog_pars_fragment>
float h2(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x*p.y); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3. - 2.*f);
  return mix(mix(h2(i), h2(i + vec2(1., 0.)), f.x), mix(h2(i + vec2(0., 1.)), h2(i + vec2(1., 1.)), f.x), f.y); }
float rip(vec2 q){ return vn(q*2.1 + uTime*vec2(0.21, 0.13)) + 0.5*vn(q*5.3 - uTime*vec2(0.17, 0.26)); }
void main(){
  vec3 V = uCam - vP; float dist = max(length(V), 1e-3); V /= dist;
  vec2 q = vP.xz;
  float paw = smoothstep(0.5, 0.78, vn(q*0.03 + uTime*vec2(0.022, 0.013)));
  float r0 = rip(q); vec2 g = vec2(rip(q + vec2(0.3, 0.)) - r0, rip(q + vec2(0., 0.3)) - r0);
  float amp = uRipple*(0.1 + 0.75*paw)/(1. + dist*0.06);
  vec3 N = normalize(vec3(-g.x*amp, 1., -g.y*amp));
  float cv = clamp(dot(N, V), 0., 1.), m = 1. - cv;
  float F = 0.03 + 0.97*m*m*m*m*m;
  vec3 R = reflect(-V, N);
  vec3 sky = mix(uSkyHor, uSkyZen, sqrt(clamp(R.y, 0., 1.)));
  float mot = 0.55*vn(q*0.018) + 0.3*vn(q*0.09 + 7.) + 0.15*vn(q*0.6);
  vec3 body = mix(uDeep, uShallow, smoothstep(0.3, 0.95, mot))*uLum;
  body *= 0.92 + 0.16*vn(q*vec2(0.012, 0.11) + vec2(uTime*0.006, 0.));
  vec3 c = mix(body, sky, F) + paw*0.03*sky;
  float sp = max(dot(R, uSunDir), 0.); sp *= sp; sp *= sp; sp *= sp; sp *= sp; sp *= sp;
  c += uSunColor*sp*sp*0.05;
  gl_FragColor = vec4(c, 1.);
  #include <fog_fragment>
}`;

const HOURS = {
  morning: { sunDir: [-0.824, 0.309, 0.476], sunColor: '#fff0dc', sunI: 2.8, sky: null, skyI: 1.3, bounce: 0.9 },
  dawn: { sunDir: [-0.86, 0.06, 0.5], sunColor: '#ffb48a', sunI: 2.5, sky: '#d9bccb', skyI: 1.0, bounce: 0.8 },
  evening: { sunDir: [0.83, 0.2, 0.5], sunColor: '#ffc890', sunI: 2.7, sky: '#c9c4d6', skyI: 1.1, bounce: 0.85 },
  moon: { sunDir: [-0.6, 0.55, 0.45], sunColor: '#b8c8ff', sunI: 0.6, sky: '#3a4468', skyI: 0.6, bounce: 0.3 },
};

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('natron-liftoff') : ctx.rng;
  const noise = ctx.noise;
  const detail = ctx.quality?.detail ?? 1;
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE).map((h) => new THREE.Color(h));
  const [cCrimson, cDeep, cPinkRaw, cScarletRaw, cSalt, cSky] = pal;
  const mixc = (a, b, t) => a.clone().lerp(b, t);
  const hueShift = rng.range(-0.012, 0.012);   // per-visit: a slightly rosier or more salmon flock
  const cPink = cPinkRaw.clone().multiplyScalar(0.82).offsetHSL(hueShift, 0, 0);
  const cScarlet = cScarletRaw.clone().multiplyScalar(0.88);
  const K = {
    pink: cPink, pale: mixc(cPink, cSalt, 0.3), belly: mixc(cPink, cSalt, 0.14), rose: mixc(cPink, cScarlet, 0.4),
    scarlet: cScarlet, crimson: mixc(cScarlet, cCrimson, 0.6), black: new THREE.Color(0.016, 0.014, 0.018),
    bill: mixc(cDeep, cScarlet, 0.35), leg: mixc(cPink, cScarlet, 0.34).multiplyScalar(0.9), legDark: mixc(cScarlet, cDeep, 0.5),
  };

  // ----- the band's axis -----
  const L = opts.length ?? 640, tail = opts.tail ?? 420, vF = opts.vF ?? 34;
  let axisAt;
  if (opts.path) {
    const p0 = opts.pathFrom ?? 0, _p = new THREE.Vector3(), _t = new THREE.Vector3();
    const yawAt = (s) => { opts.path.tangentAtDist(p0 + s, _t); return Math.atan2(_t.x, _t.z); };
    axisAt = (s) => {
      opts.path.posAtDist(p0 + s, _p); const yaw = yawAt(s);
      let dy = yawAt(s + 5) - yawAt(s - 5); dy = ((dy + Math.PI) % TAU + TAU) % TAU - Math.PI;
      return { x: _p.x, z: _p.z, yaw, k: -dy / 10 };
    };
  } else axisAt = (s) => ({ x: 0, z: L / 2 - s, yaw: Math.PI, k: 0 });
  const ground = (s, lat) => { const a = axisAt(s); a.x += -Math.cos(a.yaw) * lat; a.z += Math.sin(a.yaw) * lat; return a; };
  const wOff = rng.range(0, 100), cOff = rng.range(0, 100);
  const halfW = (s) => THREE.MathUtils.clamp(27 + 8 * noise.n2(s * 0.005, wOff), 20, 35) * THREE.MathUtils.smoothstep(s, -20, 50);
  const sP = L - 60;                                   // portal seat station
  const seat = axisAt(sP);
  const season = opts.season || 'october', weather = opts.weather || 'calm';
  const dens = (opts.density ?? 1) * (season === 'dry' ? 0.85 : season === 'december' ? 0.92 : 1);
  const cnt = Object.assign({ near: 250, mid: 1120, far: 7400, mirror: 600, sprites: 900, farMirror: 2000 }, opts.counts || {});
  cnt.mid = Math.round(cnt.mid * Math.min(1.3, dens) * (0.7 + 0.3 * detail)); cnt.far = Math.round(cnt.far * Math.min(1.3, dens) * (0.5 + 0.5 * detail));

  // marching block: an annular sector wheeling round a point left of the axis
  const mSt0 = rng.range(70, 120), mR = opts.marchRadius ?? rng.range(12, 14.5), mGap0 = rng.range(13.5, 16);
  const mSt = opts.marchStation ?? mSt0, mLat = -(mR + (opts.marchGap ?? mGap0));
  const mC = ground(mSt, mLat);
  const mAxis = Math.atan2(Math.sin(mC.yaw), -Math.cos(mC.yaw));   // angle from the centre toward the axis
  const marchW = 0.8 / mR;

  // ----- scatter -----
  const taken = new Set();
  const feedBias = rng.range(0.45, 0.62), yawOff = rng.range(0, 10);
  // The birds the world sets down one by one (opts.calmPlace, outliers.place) are dealt from a stream of their own, made
  // from the world's seed and a name: it stands outside the shared stream (no number of it is drawn to make it), so it is
  // newer than every fork of that stream down to the last ('hero-lod'), and however many birds the world sets down, no
  // other family's deal moves.
  const heroRng = rng, placedRng = ctx.core && ctx.core.makeRng ? ctx.core.makeRng('natron-liftoff:placed:' + ((ctx.seed ?? 0) >>> 0)) : (rng.fork ? rng.fork('placed') : rng);
  function makeBird(s, lat, rng = heroRng) {      // rng: the stream this bird's family is dealt from (the shared one unless a family brings its own)
    const g = ground(s, lat), r = rng();
    const b = rng();
    return {
      x: g.x, z: g.z, yaw: g.yaw, k: g.k, s, lat, seed: rng(), cruise: Math.abs(lat) < 13 ? 2.5 + 11 * Math.pow(r, 1.2) : 2 + 26 * Math.pow(r, 1.5),
      beh: b < feedBias ? 0 : b < feedBias + 0.16 ? 1 : b < feedBias + 0.3 ? 2 : 3,
      size: rng.range(0.86, 1.02), jit: rng.range(0, 0.6), restYaw: noise.n2(g.x * 0.02 + yawOff, g.z * 0.02) * 2.5 + rng.range(-0.9, 0.9) + g.yaw, march: null,
    };
  }
  async function scatter(n, sLo, sHi, latFn, spacing) {
    const out = []; let tries = n * 60;
    while (out.length < n && tries-- > 0) {
      if ((tries & 127) === 0) await ctx.yield?.();   // hand the page back every 128 tries
      const s = rng.range(sLo, sHi), hw = halfW(Math.min(s, L)), lat = latFn(hw, s);
      if (lat === null) continue;
      const g = ground(s, lat);
      const clump = 0.5 + 0.5 * noise.fbm2(g.x * 0.028 + cOff, g.z * 0.028, 3);
      const edge = 1 - THREE.MathUtils.smoothstep(Math.abs(lat) / Math.max(hw, 1), 0.7, 1.35);
      if (rng() > edge * (0.2 + 0.8 * THREE.MathUtils.smoothstep(clump, 0.3, 0.62))) continue;
      if (Math.hypot(g.x - seat.x, g.z - seat.z) < 10) continue;
      if (Math.hypot(g.x - mC.x, g.z - mC.z) < mR + 5) continue;
      if (spacing) { const key = Math.round(g.x / spacing) + ':' + Math.round(g.z / spacing); if (taken.has(key)) continue; taken.add(key); }
      out.push(makeBird(s, lat));
    }
    return out;
  }
  const nb = opts.nearBias;   // [from, to, share]: that share of the near tier stands between those stations
  const near = nb ? (await scatter(Math.round(cnt.near * (1 - nb[2])), 5, L + 30, () => rng.range(-13, 13), 0.8)).concat(await scatter(Math.round(cnt.near * nb[2]), nb[0], nb[1], () => rng.range(-13, 13), 0.8))
    : await scatter(cnt.near, 5, L + 30, () => rng.range(-13, 13), 0.8);
  // stragglers (opts.stragglers = { count, from, to, jit(s) }): late runners close to the axis. They are still pattering
  // across the water as the plane comes over them, then skim on at 1-2 m, under the wheels, and are never pushed aside
  // by the shader (the world may lay one further out at its build).
  if (opts.stragglers) {
    const sr = rng.fork ? rng.fork('stragglers') : rng;
    for (const o of Array.isArray(opts.stragglers) ? opts.stragglers : [opts.stragglers]) {
      const lat0 = o.lat ? o.lat[0] : 0.6, lat1 = o.lat ? o.lat[1] : 10, c0 = o.cruise ? o.cruise[0] : 1.1, c1 = o.cruise ? o.cruise[1] : 2.0;
      for (let i = 0, tries = o.count * 20; i < o.count && tries > 0; tries--) {
        const st = sr.range(o.from, o.to), lat = (sr() < 0.5 ? -1 : 1) * (lat0 + (lat1 - lat0) * Math.pow(sr(), 0.8));
        const g = ground(st, lat), key = Math.round(g.x / 1.1) + ':' + Math.round(g.z / 1.1);
        if (taken.has(key) || Math.hypot(g.x - seat.x, g.z - seat.z) < 9) continue; taken.add(key);
        const b = makeBird(st, lat); b.cruise = c0 + (c1 - c0) * sr(); b.jit = o.jit(st, sr); b.beh = sr() < 0.7 ? 0 : 1; near.push(b); i++;
      }
    }
  }
  // calm feeders (opts.calm = { count, from, to, lat [lo, hi], hold [lo, hi] s }): small parties beside the axis that go on
  // feeding while the wave runs past them; they only look up when the plane is long gone
  for (const o of opts.calm ? (Array.isArray(opts.calm) ? opts.calm : [opts.calm]) : []) {
    const cr = rng.fork ? rng.fork('calm') : rng, lat0 = o.lat ? o.lat[0] : 6.6, lat1 = o.lat ? o.lat[1] : 11.5, h0 = o.hold ? o.hold[0] : 4.2, h1 = o.hold ? o.hold[1] : 5.2;
    for (let i = 0, tries = o.count * 30; i < o.count && tries > 0;) {
      const cs = cr.range(o.from, o.to), cl = (cr() < 0.5 ? -1 : 1) * cr.range(lat0 + 0.8, lat1 - 0.8), n = Math.min(o.count - i, cr.int(2, 4));
      for (let k = 0; k < n && tries > 0; tries--) {
        const st = cs + cr.range(-2.2, 2.2), lat = cl + cr.range(-1.3, 1.3);
        if (Math.abs(lat) < lat0) continue;
        const g = ground(st, lat), key = Math.round(g.x / 1.1) + ':' + Math.round(g.z / 1.1);
        if (taken.has(key)) continue; taken.add(key);
        const b = makeBird(st, lat); b.jit = cr.range(h0, h1); b.beh = [0, 0, 3, 0, 1][(i + k) % 5]; b.cruise = 12 + 8 * cr(); near.push(b); k++; i++;
      }
    }
  }
  for (const q of opts.calmPlace || []) {
    const g = ground(q.s, q.lat), key = Math.round(g.x / 1.1) + ':' + Math.round(g.z / 1.1);
    taken.add(key);
    const b = makeBird(q.s, q.lat, placedRng); b.jit = q.hold ?? 4.7; b.beh = q.beh ?? 0; b.cruise = 12 + 6 * b.seed; if (q.size) b.size = q.size; near.push(b);
  }
  await ctx.yield?.();
  const nMarch = opts.marchCount ? Math.round(opts.marchCount) : Math.min(150, Math.round(cnt.mid * 0.12)), mRows = opts.marchCount ? 9 : 6;
  const mid = await scatter(cnt.mid - (opts.marchCount ? 0 : nMarch), 0, L + 40, (hw) => (rng() + rng() - 1) * hw * 1.15, 0.8);
  // the wall (opts.wall = { count, from, to, lat }): extra risers standing close to the axis where the wave is watched from
  // behind, so the curtain has no notch down its middle; most of them are high fliers that pass over the eye
  for (const o of opts.wall ? (Array.isArray(opts.wall) ? opts.wall : [opts.wall]) : []) {
    const wr = rng.fork ? rng.fork('wall') : rng, wl = o.lat ?? 15;
    for (let i = 0, tries = o.count * 12; i < o.count && tries > 0; tries--) {
      if ((tries & 127) === 0) await ctx.yield?.();
      const st = wr.range(o.from, o.to), lat = wr.range(-wl, wl);
      if (Math.abs(lat) < (o.latMin ?? 1.2)) continue;
      const g = ground(st, lat), key = Math.round(g.x / 0.8) + ':' + Math.round(g.z / 0.8);
      if (taken.has(key)) continue; taken.add(key);
      const b = makeBird(st, lat);
      if (o.cruise) { b.cruise = o.cruise[0] + (o.cruise[1] - o.cruise[0]) * wr(); if (o.jit) b.jit = o.jit(st, wr); b.beh = wr() < 0.7 ? 0 : 1; }
      else if (wr() < (o.high ?? 0.55)) b.cruise = 9.7 + 3.5 * wr(); else if (o.low) b.cruise = 2.0 + o.low * Math.pow(wr(), 2.2);
      mid.push(b); i++;
    }
  }
  const cols = Math.ceil(nMarch / mRows), mHold = opts.marchHold ?? 0, mIn = opts.marchCount ? 4 : 2;
  for (let i = 0; i < nMarch; i++) {
    const row = i % mRows, col = Math.floor(i / mRows), b = makeBird(mSt, mLat);
    const r = mR - mIn + row * 0.8 + rng.range(-0.08, 0.08), a0 = mAxis - (opts.marchLead ?? 0.9) + (col - cols / 2) * 0.66 / mR + rng.range(-0.006, 0.006);
    b.march = [mC.x, mC.z, r, a0]; b.beh = 4; b.jit = mHold + rng.range(0, 0.35); b.seed = (row % 4) / 4 + rng() * 0.2; b.size = rng.range(0.92, 1.0);
    mid.push(b);
  }
  await ctx.yield?.();
  const nBand = Math.round(cnt.far * 0.6);
  const far = (await scatter(nBand, -10, L + 20, (hw) => { const l = rng.range(-1.7, 1.7) * hw; return Math.abs(l) < 16 ? null : l; }, 0))
    .concat(await scatter(cnt.far - nBand, L, L + tail, (hw, s) => (rng() < (s - L) / tail * 0.7 ? null : rng.range(-1.5, 1.5) * hw), 0));
  await ctx.yield?.();
  // outliers (opts.outliers = { mid, far, from, horn }): birds outside the flown band that never take off (their station
  // is out of the front's reach): feeding groups beside the approach, and the crescent's other horn as far impostors.
  const outMid = [], outGroups = [], OUT_S = 1e5;
  if (opts.outliers) {
    const o = opts.outliers, from = o.from ?? -300, nGroups = Math.max(4, Math.round((o.mid ?? 0) / 16));
    const idle = (s, lat, r) => { const b = makeBird(s, lat, r); b.s = OUT_S; b.s0 = s; b.cruise = 3; return b; };      // s0: the station it stands at (s is out of the front's reach)
    let guard = (o.mid ?? 0) * 30;
    for (let gI = 0; gI < nGroups && outMid.length < (o.mid ?? 0); gI++) {
      let gs = gI === 0 ? from + 24 : gI === 1 ? from + 46 : rng.range(from + 30, -6);
      if (o.avoid && gs > o.avoid[0] && gs < o.avoid[1]) gs = o.avoid[0] - (gs - o.avoid[0]) * 0.6 - 8;   // keep clear of the world's own pool
      const side = gI === 0 ? 1 : gI === 1 ? -1 : (rng() < 0.5 ? -1 : 1);
      const gl = side * (gI < 2 ? rng.range(10, 13) : 9 + 26 * Math.pow(rng(), 1.7)), gr = rng.range(2.5, 7), n = gI < 2 ? 14 : rng.int(8, 24);
      const grp = { x: 0, z: 0, r: gr, s: gs, lat: gl }; { const gg = ground(gs, gl); grp.x = gg.x; grp.z = gg.z; outGroups.push(grp); }      // s, lat: where the group stands by the axis (opts.adjust may move the whole group, see bird.grp)
      for (let k = 0; k < n && guard-- > 0; k++) {
        const s = gs + rng.gauss() * gr * 1.4, lat = gl + rng.gauss() * gr;
        if (Math.abs(lat) < (o.minLat ?? 6.8) || s < from + 14) { k--; continue; }
        const g = ground(s, lat), key = Math.round(g.x / 0.8) + ':' + Math.round(g.z / 0.8);
        if (taken.has(key)) continue; taken.add(key);
        { const b = idle(s, lat); b.grp = grp; outMid.push(b); }
      }
    }
    // the pool party (o.pool = { s, lat, r, n, size }): greater flamingos, taller and paler, feeding close beside the approach
    for (const q of o.pool ? (Array.isArray(o.pool) ? o.pool : [o.pool]) : []) {
      const pr = rng.fork ? rng.fork('pool') : rng;
      { const gg = ground(q.s, q.lat); outGroups.push({ x: gg.x, z: gg.z, r: q.r, pool: true, open: !!q.open }); }
      for (let k = 0, tries = q.n * 30; k < q.n && tries > 0; tries--) {
        const a = pr.range(0, TAU), rr = Math.sqrt(pr()) * q.r, s = q.s + Math.cos(a) * rr * (q.along ?? 1.5), lat = q.lat + Math.sin(a) * rr * (q.across ?? 0.8);
        if (Math.abs(lat) < (q.minLat ?? 6.4)) continue;
        const g = ground(s, lat), key = Math.round(g.x / 1.3) + ':' + Math.round(g.z / 1.3);
        if (taken.has(key)) continue; taken.add(key);
        const b = idle(s, lat); b.size = (q.size ?? 1.5) * pr.range(0.94, 1.06); b.beh = [1, 0, 3, 1, 2, 0, 1, 3, 0, 1][k % 10]; near.push(b); k++;
      }
    }
    // birds set down one by one (o.place): the world's wading parties (dealt from their own stream, like opts.calmPlace)
    for (const q of o.place || []) {
      const g = ground(q.s, q.lat); taken.add(Math.round(g.x / 0.8) + ':' + Math.round(g.z / 0.8));
      const b = idle(q.s, q.lat, placedRng); b.placed = 1; b.size = q.size ?? 0.95; b.beh = q.beh ?? 0; if (q.yaw !== undefined) b.restYaw = g.yaw + q.yaw;
      if (q.tier === 'mid') outMid.push(b); else near.push(b);
    }
    await ctx.yield?.();
    const a0 = axisAt(0), fx0 = Math.sin(a0.yaw), fz0 = Math.cos(a0.yaw), lx = Math.cos(a0.yaw), lz = -Math.sin(a0.yaw);   // forward, left
    const horn = o.horn ?? 700, nHorn = Math.round((o.far ?? 0) * 0.8);
    for (let i = 0, tries = nHorn * 8; i < nHorn && tries > 0; tries--) {
      if ((tries & 255) === 0) await ctx.yield?.();
      const d = 28 + Math.pow(rng(), 0.8) * horn, w = (rng() + rng() - 1) * (30 - 12 * d / horn), fwd = 0.00045 * d * d + w - 8;
      const x = a0.x + lx * d + fx0 * fwd, z = a0.z + lz * d + fz0 * fwd;
      if (0.5 + 0.5 * noise.fbm2(x * 0.03 + cOff, z * 0.03, 2) < 0.3 + 0.25 * rng()) continue;
      const b = idle(0, 0); b.x = x; b.z = z; b.yaw = a0.yaw; b.restYaw = rng.range(0, TAU); far.push(b); i++;
    }
    for (let gI = 0, nG = Math.round((o.far ?? 0) * 0.2 / 30); gI < nG; gI++) {   // loose far parties out on the leads
      const gs = rng.range(from, L), gl = (rng() < 0.6 ? 1 : -1) * rng.range(60, 260), gr = rng.range(6, 16);
      for (let k = 0; k < 30; k++) far.push(idle(gs + rng.gauss() * gr * 2, gl + rng.gauss() * gr));
    }
    await ctx.yield?.();
    if (typeof o.keep === 'function') {
      for (let i = far.length - 1; i >= 0; i--) {
        if (far[i].s === OUT_S && !o.keep(far[i].x, far[i].z)) far.splice(i, 1);
        if ((i & 127) === 0) await ctx.yield?.();
      }
    }
    for (const b of outMid) mid.push(b);
  }
  await ctx.yield?.();

  // opts.adjust(bird): the world's last word on where a standing bird stands (it may move b.x, b.z); it draws no random numbers
  if (typeof opts.adjust === 'function') {
    for (let i = 0; i < near.length; i++) { opts.adjust(near[i]); if ((i & 63) === 63) await ctx.yield?.(); }
    for (let i = 0; i < mid.length; i++) { opts.adjust(mid[i]); if ((i & 63) === 63) await ctx.yield?.(); }
  }
  function pack(list, slots) {
    const n = list.length * (slots || 1);
    const a = { iPos: new Float32Array(n * 4), iA: new Float32Array(n * 4), iB: new Float32Array(n * 4), iC: new Float32Array(n * 4) };
    if (slots) a.iS = new Float32Array(n * 4);
    let o = 0;
    for (const b of list) for (let k = 0; k < (slots || 1); k++, o += 4) {
      a.iPos[o] = b.x; a.iPos[o + 1] = b.z; a.iPos[o + 2] = b.yaw; a.iPos[o + 3] = b.k;
      a.iA[o] = b.s; a.iA[o + 1] = b.seed; a.iA[o + 2] = b.cruise; a.iA[o + 3] = b.lat;
      a.iB[o] = b.beh; a.iB[o + 1] = b.size; a.iB[o + 2] = b.jit; a.iB[o + 3] = b.restYaw;
      if (b.march) { a.iC[o] = b.march[0]; a.iC[o + 1] = b.march[1]; a.iC[o + 2] = b.march[2]; a.iC[o + 3] = b.march[3]; }
      if (slots) a.iS[o] = k;
    }
    return { attrs: a, count: n };
  }
  const byLat = mid.filter((b) => !b.march && b.s !== OUT_S).sort((p, q) => Math.abs(p.lat) - Math.abs(q.lat));
  outMid.sort((p, q) => Math.abs(p.lat) - Math.abs(q.lat));
  const marchers = mid.filter((b) => b.march);
  const nOutM = Math.min(outMid.length, 140);
  const mirrorList = outMid.slice(0, nOutM).concat(near, marchers, byLat).slice(0, cnt.mirror + nOutM);
  const nOwn = (opts.spriteBirds || []).length;      // the world's own runners take their sprites out of the same pool: its size does not grow
  const spriteList = outMid.slice(0, nOutM).concat(near, byLat).slice(0, Math.max(cnt.sprites + nOutM - nOwn, 0));
  // opts.spriteBirds [{ x, z, yaw, s, size, seed }]: birds the world poses itself (escorts that stand and run before they
  // fly): only their footfalls, crowns and rings are drawn here, from the same clock and stride as every other bird's
  for (const q of opts.spriteBirds || []) spriteList.push({ x: q.x, z: q.z, yaw: q.yaw, k: 0, s: q.s, lat: 20, seed: q.seed ?? 0.5, cruise: 3, beh: 1, size: q.size ?? 1, jit: 0, restYaw: q.yaw, march: null });
  await ctx.yield?.();
  // impostor reflections: the mid birds nearest the axis first (they have no mesh mirror), then the far tier
  const farMirrorList = byLat.slice(0, Math.min(cnt.midMirror ?? 0, byLat.length)).concat(far.filter((b) => b.s < L + 20 && b.s !== OUT_S).sort((p, q) => Math.abs(p.lat) - Math.abs(q.lat))).slice(0, cnt.farMirror);

  // ----- uniforms shared by every draw -----
  const hour = HOURS[opts.hour] || HOURS.morning, lightIn = opts.light || null;
  const bounce = mixc(cPinkRaw, cCrimson, 0.5);
  const U = {
    uTime: { value: 0 }, uFront: { value: -160 }, uVF: { value: vF }, uPix: { value: 0.0027 }, uMarchW: { value: marchW },
    uRipple: { value: weather === 'rains' ? 0.7 : weather === 'noon' ? 0.4 : 0.22 }, uCam: { value: new THREE.Vector3(0, 6, L) },
    uLane: { value: new THREE.Vector4(sP - 230, sP - 130, 7, 16) }, uPush: { value: new THREE.Vector2(36, 15) }, uOver: { value: new THREE.Vector2(1e9, -1e9) }, uOverH: { value: new THREE.Vector2(14, 2) },
    uSunDir: { value: new THREE.Vector3().fromArray(hour.sunDir).normalize() },
    uSunColor: { value: new THREE.Color(hour.sunColor).multiplyScalar(hour.sunI) },
    uSkyColor: { value: (hour.sky ? new THREE.Color(hour.sky) : cSky.clone()).multiplyScalar(hour.skyI) },
    uGroundColor: { value: bounce.clone().multiplyScalar(hour.bounce) },
    uPink: { value: cPink }, uPinkV: { value: cPink }, uScarlet: { value: cScarlet }, uSalt: { value: cSalt.clone().multiplyScalar(0.9) }, uDeep: { value: cDeep.clone() },
    uRim: { value: new THREE.Vector2(1, 1) },
    uShallow: { value: cCrimson.clone() }, uSkyHor: { value: new THREE.Color(opts.skyHorizon || '#e4ecee') },
    uSkyZen: { value: new THREE.Color(opts.skyZenith || '#8eaec4') }, uLum: { value: opts.hour === 'moon' ? 0.3 : 0.85 },
  };
  let adopt = !lightIn;
  function setLight(l) {
    if (!l) return;
    const col = (c, i) => (c && c.isColor ? c.clone() : new THREE.Color(c)).multiplyScalar(i ?? 1);
    if (l.sunDir) { const d = l.sunDir; (d.isVector3 ? U.uSunDir.value.copy(d) : U.uSunDir.value.fromArray(d)).normalize(); }
    if (l.sunColor !== undefined) U.uSunColor.value.copy(col(l.sunColor, l.sunIntensity));
    if (l.sky !== undefined) U.uSkyColor.value.copy(col(l.sky, l.skyIntensity));
    if (l.ground !== undefined) U.uGroundColor.value.copy(col(l.ground, l.groundIntensity));
  }
  if (lightIn) setLight(lightIn);

  // ----- draws -----
  const object = new THREE.Group(); object.name = 'natron-liftoff-hero';
  const fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
  const mat = (o) => new THREE.ShaderMaterial(Object.assign({ fog: true }, o, { uniforms: { ...fogU(), ...U } }));
  const add = (geo, material, order, name) => {
    const m = new THREE.Mesh(geo, material); m.frustumCulled = false; m.renderOrder = order; m.name = name; m.matrixAutoUpdate = false; object.add(m); return m;
  };
  const stats = { birds: near.length + mid.length + far.length, triangles: 0, calls: 0 };
  const count = (geo, n) => { stats.triangles += geo.index.count / 3 * n; stats.calls++; };

  const matBird = mat({ vertexShader: VERT_BIRD, fragmentShader: FRAG_BIRD, vertexColors: true, side: THREE.DoubleSide });
  await ctx.yield?.();
  const gNear = birdGeometry(0, K, rng), gMid = birdGeometry(1, K, rng), gLow = birdGeometry(2, K, rng), gQuad = quadGeometry();
  await ctx.yield?.();
  const gHero = birdGeometry(-1, K, rng.fork ? rng.fork('hero-lod') : rng);
  await ctx.yield?.();
  let pk = pack(near); add(instanced(gNear, pk.attrs, pk.count), matBird, 0, 'near'); count(gNear, pk.count);
  pk = pack(mid); add(instanced(gMid, pk.attrs, pk.count), matBird, 0, 'mid'); count(gMid, pk.count);
  await ctx.yield?.();
  const matFar = mat({ vertexShader: VERT_FAR, fragmentShader: FRAG_FAR });
  pk = pack(far); add(instanced(gQuad, pk.attrs, pk.count), matFar, 0, 'far'); count(gQuad, pk.count);
  await ctx.yield?.();
  // opts.mirrorClip = { pars: GLSL that defines float mirrorOnWater(vec2 xz), uniforms }: the world says where a reflection may lie
  const clip = opts.mirrorClip || null, fragMirror = clip ? FRAG_BIRD.replace('//MIRROR_CLIP_PARS', clip.pars) : FRAG_BIRD;
  if (clip) Object.assign(U, clip.uniforms);
  const mDef = (o) => (clip ? Object.assign({ MCLIP: 1 }, o) : o);
  const matMirror = mat({ vertexShader: VERT_BIRD, fragmentShader: fragMirror, vertexColors: true, side: THREE.DoubleSide, defines: mDef({ MIRROR: 1 }),
    transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -8 });
  pk = pack(mirrorList); add(instanced(gLow, pk.attrs, pk.count), matMirror, 1, 'mirror'); count(gLow, pk.count);
  await ctx.yield?.();
  const matFarMirror = mat({ vertexShader: VERT_FAR, fragmentShader: FRAG_FAR, defines: { MIRROR: 1 }, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -8 });
  pk = pack(farMirrorList); add(instanced(gQuad, pk.attrs, pk.count), matFarMirror, 1, 'farMirror'); count(gQuad, pk.count);
  await ctx.yield?.();
  // escorts: birds the world flies beside and over the cockpit, placed every frame (see hero.escorts)
  const nEsc = Math.max(0, Math.round(opts.escorts ?? 0));
  let escorts = null;
  if (nEsc > 0) {
    const eP = new Float32Array(nEsc * 4), eA = new Float32Array(nEsc * 4), eB = new Float32Array(nEsc * 4);
    for (let i = 0; i < nEsc; i++) { eP[i * 4 + 1] = -50; eA[i * 4 + 1] = rng(); eA[i * 4 + 2] = 5; eA[i * 4 + 3] = 1; eB[i * 4 + 1] = 0.95; eB[i * 4 + 2] = 1; eB[i * 4 + 3] = 60; }
    const eGeo = (base) => {
      const g = new THREE.InstancedBufferGeometry(); g.index = base.index;
      for (const k in base.attributes) g.setAttribute(k, base.attributes[k]);
      const attrs = [new THREE.InstancedBufferAttribute(eP, 4), new THREE.InstancedBufferAttribute(eA, 4), new THREE.InstancedBufferAttribute(eB, 4)];
      for (const a of attrs) a.setUsage(THREE.DynamicDrawUsage);
      g.setAttribute('iPos', attrs[0]); g.setAttribute('iA', attrs[1]); g.setAttribute('iB', attrs[2]); g.instanceCount = nEsc; return { g, attrs };
    };
    const e1 = eGeo(gHero), e2 = eGeo(gLow);      // the mirror copy is a dark dab on the brine: the lightest mesh carries it
    add(e1.g, mat({ vertexShader: VERT_BIRD, fragmentShader: FRAG_BIRD, vertexColors: true, side: THREE.DoubleSide, defines: { ESCORT: 1 } }), 0, 'escorts'); count(gHero, nEsc);
    add(e2.g, mat({ vertexShader: VERT_BIRD, fragmentShader: fragMirror, vertexColors: true, side: THREE.DoubleSide, defines: mDef({ MIRROR: 1, ESCORT: 1 }),
      transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -8 }), 1, 'escortMirror'); count(gLow, nEsc);
    escorts = {
      count: nEsc,
      // place escort i: world position, yaw (0 = +Z), pitch, size (over 1.3 = a greater flamingo), wingbeat rate factor; and for
      // a bird still on the water: its clock (seconds to liftoff, negative), its standing behaviour, the metres it has run
      set(i, x, y, z, yaw, pitch, size, rate, clock, beh, run) { const o = i * 4; eP[o] = x; eP[o + 1] = y; eP[o + 2] = z; eP[o + 3] = yaw; eA[o] = pitch; eA[o + 2] = clock ?? 5; eA[o + 3] = beh ?? 1; eB[o + 1] = size; eB[o + 2] = rate ?? 1; eB[o + 3] = run ?? 60; },
      commit() { for (const a of e1.attrs) a.needsUpdate = true; for (const a of e2.attrs) a.needsUpdate = true; },
    };
  }
  const matSplash = mat({ vertexShader: VERT_SPLASH, fragmentShader: clip ? FRAG_SPLASH.replace('//SPLASH_CLIP_PARS', clip.pars) : FRAG_SPLASH, defines: mDef({}), transparent: true, depthWrite: false, side: THREE.DoubleSide });
  pk = pack(spriteList, 4); add(instanced(gQuad, pk.attrs, pk.count), matSplash, 2, 'splash'); count(gQuad, pk.count);
  await ctx.yield?.();
  if (opts.water !== false) {
    const mid0 = axisAt(L / 2);
    const gW = new THREE.CircleGeometry(3600, 72); gW.rotateX(-Math.PI / 2); gW.translate(mid0.x, 0, mid0.z);
    add(gW, mat({ vertexShader: VERT_WATER, fragmentShader: FRAG_WATER }), -1, 'water'); count(gW, 1);
  }

  // ----- anchors -----
  const fwdAt = (a) => [Math.sin(a.yaw), 0, Math.cos(a.yaw)];
  const P = (s, y, lat = 0) => { const g = ground(s, lat); return [g.x, y, g.z]; };
  const flyThrough = [];
  for (let s = -140; s < sP - 1; s += 70) flyThrough.push(P(s, s < 0 ? 5 - s * 0.02 : s < 200 ? 5 : s < 420 ? 5.5 + (s - 200) / 220 * 0.5 : 6.5));
  flyThrough.push(P(sP - 60, 6.5), P(sP, 6.5));
  const sf = fwdAt(seat);
  const anchors = {
    portalSeat: { position: [seat.x, 7, seat.z], facing: [-sf[0], 0, -sf[2]], radius: 7, station: sP },
    flyThrough,
    lane: { from: sP - 130, to: sP + 40, halfWidth: 15 },
    marchers: { center: [mC.x, 0.9, mC.z], radius: mR, station: mSt, side: -1, block: [mC.x + mR * Math.cos(mAxis - (opts.marchLead ?? 0.9)), 0.9, mC.z + mR * Math.sin(mAxis - (opts.marchLead ?? 0.9))] },
    viewpoints: { entry: P(-140, 7.8), wave: P(L * 0.4, 5.5), lane: P(sP - 60, 6.5), marchPass: P(mSt, 3) },
    axisAt, bandStart: P(0, 0), bandEnd: P(L, 0), tailEnd: P(L + tail, 0), waterY: 0, sunDir: U.uSunDir.value,
  };

  // ----- the clock -----
  let frontSet = false, first = true;
  const setFront = (s) => { frontSet = true; U.uFront.value = s; };
  const _v = new THREE.Vector3(), _s = new THREE.Vector2(), _c = new THREE.Color();
  const cMid = axisAt(L / 2);
  const radius = 36, height = 16, center = new THREE.Vector3(cMid.x, 5, cMid.z);   // framing of the wave's heart; full size in `extent`

  function update(dt, time, camera) {
    if (first) {
      first = false; object.updateMatrixWorld(true);
      let root = object; while (root.parent) root = root.parent;
      if (adopt) {
        let sun = null, hemi = null;
        root.traverse((o) => { if (o.isDirectionalLight && !sun) sun = o; else if (o.isHemisphereLight && !hemi) hemi = o; });
        if (sun) { U.uSunDir.value.copy(sun.position).sub(sun.target.position).normalize(); U.uSunColor.value.copy(sun.color).multiplyScalar(sun.intensity); }
        if (hemi) {
          U.uSkyColor.value.copy(hemi.color).multiplyScalar(hemi.intensity * 1.2);
          U.uGroundColor.value.copy(bounce).multiplyScalar(0.55 + 0.35 * hemi.intensity).lerp(_c.copy(hemi.groundColor).multiplyScalar(hemi.intensity), 0.25);
        }
      }
      if (!opts.skyHorizon && root.fog && root.fog.color) U.uSkyHor.value.copy(root.fog.color);
    }
    U.uTime.value = time;
    if (!frontSet) U.uFront.value = -150 + ((time * 24 + 222) % (L + 330));   // demo sweep until the world takes over
    if (camera) {
      object.updateWorldMatrix(true, false);
      U.uCam.value.copy(object.worldToLocal(_v.setFromMatrixPosition(camera.matrixWorld)));
      const h = ctx.renderer ? ctx.renderer.getDrawingBufferSize(_s).y : 1080;
      U.uPix.value = 2 / (Math.max(camera.projectionMatrix.elements[5], 0.05) * Math.max(h, 1));
    }
  }

  return {
    object, radius, height, center, anchors, update, dispose() {}, ground: false, groundY: 0,
    setFront, setProgress: (p) => setFront(-160 + (L + 220) * Math.min(Math.max(p, 0), 1)),
    frontAt: (camStation, lead = 90) => camStation + lead,
    setLight: (l) => { adopt = false; setLight(l); }, uniforms: U, stats, length: L, vF,
    extent: { length: L, tail, halfWidth: 35, radius: L / 2 + 10, height: 30 },
    outlierGroups: outGroups, escorts,
    layout: { near: near.length, mid: mid.length, far: far.length, mirror: mirrorList.length, splashSprites: spriteList.length * 4 },
  };
}
