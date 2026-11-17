// THE GRAMOPHONE: hero set piece of "seventy-eight-in-the-rain", built 1,200 times life size.
//
// One machine in two parts. A mahogany cabinet (480 x 480 m, deck at y 225) carries a felt-edged
// platter and a black shellac record 300 m across that really turns (0.39 rad/s clockwise seen from
// above, 30 m/s under the needle): grooves as derivative-antialiased rings with an anisotropic
// bow-tie of sky glare, 40:1 streak noise, racing dust specks and instanced rain beads, the mirrored
// veranda opening with its sky rift, a gold smear of the horn's underside, a travelling four-lobed
// warp and a coloured label with gold rings and dots. From the back bracket a brass tone arm reaches
// forward-left to the soundbox (brass drum, ringed mica diaphragm, two knurled thumbscrews, steel
// needle with a silver wake) and a morning-glory horn of ten fluted petals with a rolled, scalloped
// rim rises forward at 30 degrees, beaded with rain that creeps down the flutes and drips off the lip.
//
// SPACE    Origin = the table top under the spindle (room coordinates of the brief), +Y up, front
//          (the garden) = +Z. radius ~345 m (cabinet corner), height ~525 m (top of the horn rim).
//          The lace table top (1,300 m across, opts.table) is included because it grounds the piece.
// LIGHT    No scene lights are used. Every material is a ShaderMaterial that reflects an ANALYTIC
//          VERANDA (bright opening toward +Z with a sky rift and thrashing garden band, balustrade,
//          dark roof, plaster wall with a cobalt dado behind, pale cloth below) in STAGE space, so the
//          reflections turn with hero.object when the world rotates its stage. It expects a soft bright
//          front key and dim back; hero.setLook({ sky, rift, garden, roof, wall, dado, cloth, keyDir,
//          keyColor, ambient }) retunes it (hex / THREE.Color; keyDir = direction TOWARD the key in
//          stage space). Looks 'day' (downpour), 'golden' (sun-shower) and 'night' (blue dusk) are
//          built in: opts.hour or ctx.vary.hour picks one. Fog is honoured. hero.setFlash(0..1) flares
//          every bead, groove and brass highlight (the rare lightning). Bloom should only catch the
//          rift glints: keep threshold ~0.9.
// OPTS     palette  : 7 hex strings of the brief (shellac, pewter, silver, brass, cobalt, green, label)
//          hour     : 'day' | 'golden' | 'night' | 'dawn' | 'any' (default ctx.vary.hour)
//          label    : hex for the label (default: seeded pick of red / peacock blue / old gold)
//          table    : false to leave out the lace table top; beads: multiplier for bead counts
//          mirror   : strength of the sky mirrored in the shellac (default 0.55)
//          density  : default ctx.vary.density, scales beads and dust
// PROGRESS Nothing runs on wall-clock except ambient loops (spin, creep of beads, drips, quiver).
//          hero.setNeedle(r)   needle radius from the spindle, 82 (start) .. 70 (end of ride); the arm
//                              swings about the back bracket. Add a 2 m jolt here for the skipped groove.
//          hero.setProgress(u) = setNeedle(82 - 12 u), u in 0..1, for worlds that prefer one number.
//          hero.warpAt(time)   height (m) of the record surface under the needle right now: lower the
//                              stage by it during the ride (the arm already rides it).
//          hero.setDrip(p)     the one scripted drip: p 0..0.5 it swells on the lip at anchors.dripLip,
//                              0.5..1 it falls to anchors.dripLanding (0 hides it). Nine other drips loop.
//          hero.setHop(h)      lifts the needle h metres off the shellac (the jolt of a skipped groove).
//          hero.warpAtXZ(time, x, z)  height of the record's surface at a stage-space point (for things riding it).
//          hero.setFlash(f), hero.setLook(look), hero.uniforms (shared uniform bag; uFlow scales the
//          creep of the horn beads, uBeadAmt the rain beads drawn in the brass and wood shaders, uThroatCol the
//          warm light on the collar at the throat, uBandGold 0.5..1 how far the bands of garden and sky that slide
//          down the flutes are gilded: 1 = pale gold, never grey). hero.recordUniforms (uMirror, uDeep: how far plain cloud
//          sinks into the black mirror) and hero.beadUniforms.record / .horn (uGlint, uLens, uBody, uMirrorB,
//          uRimA) are there for a world that wants to retune them per look.
// BEADS    Instanced spherical caps, 1 to 5 m across on the record: a dark clear body, a dark meniscus at the
//          contact line, one hard glint, a thin crescent of sky on the far limb and a faint upside-down image
//          of the opening on the near flank. Far ones shrink to glints.
// BELL     Inside, the ten flutes are shaded as form (bright worn crests, bronze beds, one flank of each rib in
//          shade). Each flute is a hollow mirror holding a warped fisheye of the veranda's opening (uMirK scales it);
//          chased braid bands, ruled rib lines and shell fans are engraved in the brass; the music runs up the bore as
//          rings of light from the collar (uRingK); the collar round the portal burns with uThroatCol.
//          Beads inside are small clear domes with a hard gold glint, capped in size on screen.
// ANCHORS  (hero-local = stage space)
//   spindle        (0,240,0) top centre of the record.   recordY 240, recordRadius 150, labelRadius 45
//   needle         Vector3 of the needle tip at radius 82 (it moves with setNeedle; needleAt(r) gives it)
//   soundbox       centre of the drum; soundboxTop its upper rim + thumbscrew (about y 284)
//   rideEye        a good eye point for the ride: behind and above the soundbox, looking +Z
//   entry          (-84,268,-156) the brief's entry point, flying +Z
//   bracket        (0,262,-215) top of the back bracket (arm pivot)
//   hornMouth      (0,400,-34) centre of the mouth plane;  hornAxis: unit vector throat -> mouth
//   hornThroat     (0,290,-225) the narrow end of the bore (not flown)
//   portalSeat     { position, normal (toward the mouth, the side the camera comes from), radius 16, depth 0.42 }
//                  0.42 of the way up the bore, 128 m inside the mouth, where the bore is 22 m in radius: a turned
//                  collar closes the gap round the portal and burns with its light; a dark plug lies behind it.
//   flyThrough     ordered points: (0,470,87) on the axis 140 m out, the mouth centre, then down the
//                  axis to the portal seat. Clearance to the brass: 118 m at the mouth, 21 m at the seat
//                  (the brief waives the corridor rule inside the horn; stay on the axis).
//   hummingbird    upper right rim of the mouth, 12 m off the brass (hover point for the world's bird)
//   lowerLip       lowest point of the rim (drips fall from here onto the record at dripLanding)
//   crank          hub of the crank on the +X side;  grille: centre of the governor grille on the deck
//   viewpoints     { hero70: eye for the u 0.70 frame, look70: its target, ride: rideEye }
//   keepOut        [{ center, radius }] spheres for path planning (cabinet, bell, soundbox)
// COST     165-195k triangles (the two bead sets scale with density x quality.detail and are capped),
//          11 draw calls, 8 shader programs, no lights, no textures, no render targets; build ~150 ms.
// VIEWER   opts.view = 'ride' | 'rec' | 'horn' | 'in' | 'cab' frames one part closely in the set-piece viewer.
// EXPORTS  buildHero, plus the geometry helpers (grid, lathe, tube, place, merge, lin, mul, mixc), hornPoint and
//          the analytic-veranda GLSL (GLSL_ROOM) so the world can shade its own things in the same light.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const TAU = Math.PI * 2;
const DEFAULT_PALETTE = ['#0B0B0E', '#8F9BA1', '#DCE4E6', '#C8983A', '#2C4F93', '#2E5B45', '#B3261E'];
const REC_Y = 240, REC_R = 150, LABEL_R = 45, SPIN = 0.39;
const THROAT = new THREE.Vector3(0, 290, -225), MOUTH = new THREE.Vector3(0, 400, -34);
const HORN_LEN = THROAT.distanceTo(MOUTH), AXIS = MOUTH.clone().sub(THROAT).normalize();
const PIVOT = new THREE.Vector3(0, 268, -215);
const PETALS = 10;
// the portal sits part of the way up the bore, where it is 22 m across, inside a turned collar: the dark narrow
// neck behind it is never flown
const SEAT_T = 0.42, SEAT_R = 16, SEAT = THROAT.clone().addScaledVector(AXIS, SEAT_T * HORN_LEN);

// ---------------------------------------------------------------- geometry helpers
// Parametric grid: fn(u, v, o) with u, v in 0..1 fills o.p (xyz), o.c (rgb) and o.d (4 data values).
// The normal points along dP/du x dP/dv. Duplicate a row (same v position twice) for a hard edge.
function grid(nU, nV, wrapU, fn) {
  const G = gridBegin(nU, nV, wrapU);
  gridRows(G, fn, 0, nV);
  const g = gridEnd(G);
  g.computeVertexNormals();
  return g;
}
// The same grid for a large surface, a few rows at a time: tick() hands the page back in between.
async function gridSteps(nU, nV, wrapU, fn, tick, rows = 4) {
  const G = gridBegin(nU, nV, wrapU);
  for (let j = 0; j <= nV; j += rows) { gridRows(G, fn, j, Math.min(j + rows - 1, nV)); await tick(); }
  const g = gridEnd(G);
  await tick();
  g.computeVertexNormals();
  return g;
}
function gridBegin(nU, nV, wrapU) {
  const cols = wrapU ? nU : nU + 1, n = cols * (nV + 1);
  return { nU, nV, wrapU, cols, pos: new Float32Array(n * 3), col: new Float32Array(n * 3), dat: new Float32Array(n * 4), o: { p: [0, 0, 0], c: [1, 1, 1], d: [0, 0, 0, 0] } };
}
function gridRows({ nU, nV, cols, pos, col, dat, o }, fn, j0, j1) {
  for (let j = j0; j <= j1; j++) for (let i = 0; i < cols; i++) {
    const k = j * cols + i;
    o.d[0] = o.d[1] = o.d[2] = o.d[3] = 0; o.c[0] = o.c[1] = o.c[2] = 1;
    fn(i / nU, j / nV, o, i, j);
    pos[k * 3] = o.p[0]; pos[k * 3 + 1] = o.p[1]; pos[k * 3 + 2] = o.p[2];
    col[k * 3] = o.c[0]; col[k * 3 + 1] = o.c[1]; col[k * 3 + 2] = o.c[2];
    dat[k * 4] = o.d[0]; dat[k * 4 + 1] = o.d[1]; dat[k * 4 + 2] = o.d[2]; dat[k * 4 + 3] = o.d[3];
  }
}
function gridEnd({ nU, nV, wrapU, cols, pos, col, dat }) {
  const idx = new Uint32Array(nU * nV * 6);
  let q = 0;
  for (let j = 0; j < nV; j++) for (let i = 0; i < nU; i++) {
    const i1 = wrapU ? (i + 1) % nU : i + 1;
    const a = j * cols + i, b = j * cols + i1, c = (j + 1) * cols + i, d = (j + 1) * cols + i1;
    idx[q++] = a; idx[q++] = b; idx[q++] = c; idx[q++] = b; idx[q++] = d; idx[q++] = c;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setAttribute('aData', new THREE.BufferAttribute(dat, 4));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  return g;
}

// Lathe about +Y. profile = [[radius, y], ...] traced from the TOP downward for outward normals.
// o: seg, sq (superellipse exponent: 2 round, 8+ square with soft corners), flutes { n, depth, y0, y1 },
//    color(v, th, y) -> [r,g,b], data [4] or data(v, th, y, out),
//    tick (build with gridSteps: the result is then a promise)
function lathe(profile, o = {}) {
  const seg = o.seg || 32, sq = o.sq || 2, nV = profile.length - 1;
  const base = o.color, fl = o.flutes;
  const fn = (u, v, out, i, j) => {
    const th = u * TAU, pr = profile[j];
    let r = pr[0];
    const cx = Math.cos(th), sz = Math.sin(th);
    if (sq !== 2) r *= Math.pow(Math.pow(Math.abs(cx), sq) + Math.pow(Math.abs(sz), sq), -1 / sq);
    if (fl && pr[1] >= fl.y0 && pr[1] <= fl.y1) r *= 1 - fl.depth * Math.pow(Math.abs(Math.sin(th * fl.n * 0.5)), fl.pow || 1.6);
    out.p[0] = cx * r; out.p[1] = pr[1]; out.p[2] = sz * r;
    if (base) { const c = base(v, th, pr[1]); out.c[0] = c[0]; out.c[1] = c[1]; out.c[2] = c[2]; }
    if (typeof o.data === 'function') o.data(v, th, pr[1], out.d);
    else if (o.data) { out.d[0] = o.data[0]; out.d[1] = o.data[1]; out.d[2] = o.data[2]; out.d[3] = o.data[3]; }
  };
  return o.tick ? gridSteps(seg, nV, true, fn, o.tick) : grid(seg, nV, true, fn);
}

// Tube along a list of points. radius(t) may go to 0 at the ends to close them.
function tube(points, radius, o = {}) {
  const nA = o.along || 48, nR = o.around || 14;
  const curve = new THREE.CatmullRomCurve3(points.map((p) => (p.isVector3 ? p : new THREE.Vector3(p[0], p[1], p[2]))), false, 'centripetal');
  const fr = curve.computeFrenetFrames(nA, false);
  const P = new THREE.Vector3();
  return grid(nR, nA, true, (u, v, out, i, j) => {
    curve.getPointAt(v, P);
    const N = fr.normals[j], B = fr.binormals[j], r = radius(v), a = u * TAU, ca = Math.cos(a), sa = Math.sin(a);
    out.p[0] = P.x + r * (ca * N.x + sa * B.x); out.p[1] = P.y + r * (ca * N.y + sa * B.y); out.p[2] = P.z + r * (ca * N.z + sa * B.z);
    if (o.color) { const c = o.color(v, a); out.c[0] = c[0]; out.c[1] = c[1]; out.c[2] = c[2]; }
    if (o.data) { out.d[0] = o.data[0]; out.d[1] = o.data[1]; out.d[2] = o.data[2]; out.d[3] = o.data[3]; }
  });
}

// place a geometry: rotate so its +Y lies along `dir`, then move to `at`
const _q = new THREE.Quaternion(), _m = new THREE.Matrix4(), _up = new THREE.Vector3(0, 1, 0), _one = new THREE.Vector3(1, 1, 1);
function place(g, at, dir, twist = 0) {
  if (twist) g.rotateY(twist);
  if (dir) { _q.setFromUnitVectors(_up, dir.clone().normalize()); g.applyMatrix4(_m.compose(new THREE.Vector3(), _q, _one)); }
  g.translate(at.x, at.y, at.z);
  return g;
}
function merge(list) {
  const g = mergeGeometries(list, false);
  for (const x of list) x.dispose();
  return g;
}
const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
const mul = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

// a bead of water: a spherical cap (contact angle ~64 degrees), base on y = 0, base radius 1, height `h`,
// with exact sphere normals so one hard glint can sit on it
function domeGeometry(h = 0.62) {
  const S = 10, RS = (1 + h * h) / (2 * h), cy = h - RS, phiMax = Math.asin(Math.min(1, 1 / RS));
  const p = [0, h, 0], nr = [0, 1, 0], idx = [], rings = [0.4, 0.76, 1];
  for (let r = 0; r < rings.length; r++) for (let i = 0; i < S; i++) {
    const a = (i / S) * TAU + r * 0.31, ph = phiMax * rings[r], sp = Math.sin(ph), cp = Math.cos(ph);
    p.push(RS * sp * Math.cos(a), Math.max(0, cy + RS * cp), RS * sp * Math.sin(a));
    nr.push(sp * Math.cos(a), cp, sp * Math.sin(a));
  }
  for (let i = 0; i < S; i++) {
    const j = (i + 1) % S;
    idx.push(0, 1 + j, 1 + i);
    for (let r = 0; r < rings.length - 1; r++) {
      const a = 1 + r * S + i, b = 1 + r * S + j, c = 1 + (r + 1) * S + i, d = 1 + (r + 1) * S + j;
      idx.push(a, b, d, a, d, c);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nr, 3));
  g.setIndex(idx);
  return g;
}

// ---------------------------------------------------------------- the horn's surface (JS twin of the GLSL below)
// s: 0 throat .. 1 mouth plane (.. 1.08 over the rolled rim), th: angle round the axis.
const HX = new THREE.Vector3(1, 0, 0), HY = new THREE.Vector3().crossVectors(AXIS, HX).normalize();   // HY points up-and-back
function hornRadius(s) { const t = Math.min(s, 1); return 9 + 116 * (0.2 * t + 0.8 * Math.pow(t, 3.1)); }
function hornPoint(s, th, out) {
  const t = Math.min(s, 1), pet = Math.pow(Math.abs(Math.cos(th * PETALS * 0.5)), 0.72);
  const amp = 0.02 + 0.115 * t * t + 0.085 * Math.sin(Math.PI * t);
  let r = hornRadius(s) * (1 - amp + amp * 1.5 * pet), ax = t * HORN_LEN + 9 * t * t * t * (pet - 0.5);
  if (s > 1) { const k = (s - 1) / 0.08, a = k * Math.PI * 1.25, rr = 4.2 + 1.6 * pet; r += rr * Math.sin(a); ax += -rr * (1 - Math.cos(a)); }
  const c = Math.cos(th), sn = Math.sin(th);
  out.x = THROAT.x + AXIS.x * ax + r * (c * HX.x + sn * HY.x);
  out.y = THROAT.y + AXIS.y * ax + r * (c * HX.y + sn * HY.y);
  out.z = THROAT.z + AXIS.z * ax + r * (c * HX.z + sn * HY.z);
  return out;
}

// ---------------------------------------------------------------- shaders: the analytic veranda
const GLSL_ROOM = /* glsl */`
uniform mat3 uStageInv; uniform vec3 uStagePos;
uniform vec3 uSkyCol, uRiftCol, uGardenCol, uRoofCol, uWallCol, uDadoCol, uClothCol, uKeyDir, uKeyCol, uAmbCol;
uniform float uFlash, uTime;
float h11(float n){ n = fract(n*.1031); n *= n + 33.33; n *= n + n; return fract(n); }
float h21(vec2 p){ vec3 p3 = fract(vec3(p.xyx)*.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y)*p3.z); }
float h31(vec3 p){ p = fract(p*.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y)*p.z); }
float n11(float x){ float i = floor(x), f = fract(x); f = f*f*(3.-2.*f); return mix(h11(i), h11(i+1.), f); }
float n21(vec2 x){ vec2 i = floor(x), f = fract(x); f = f*f*(3.-2.*f);
  return mix(mix(h21(i), h21(i+vec2(1.,0.)), f.x), mix(h21(i+vec2(0.,1.)), h21(i+vec2(1.,1.)), f.x), f.y); }
// what a surface sees in stage-space direction d; rough 0 mirror .. 1 blurred
vec3 roomEnv(vec3 d, float rough){
  float e = d.y, hl = max(length(d.xz), 1e-4);
  vec2 h = d.xz/hl;
  float az = h.x, sf = .025 + rough*.45;
  float front = smoothstep(-.12 - sf, .22 + sf, h.y);
  float cl = sin(az*5. + e*9. + uTime*.05)*sin(az*11. - e*17. + 1.7)*.5 + .5;
  vec3 sky = uSkyCol*(.66 + .46*cl*(1.-rough));
  float de = e - .09;
  float rift = exp(-de*de/(.004 + rough*.05))*exp(-az*az/(.16 + rough*.3))*step(0., h.y);
  sky += uRiftCol*rift;
  // above the rift the cloud is torn into a paler seam: the wedge of light that lies along the shellac
  float seam = exp(-az*az/(.010 + .05*e*e + rough*.2))*smoothstep(.02, .14, e)*(1. - smoothstep(.34, .72, e))*step(0., h.y);
  sky += uRiftCol*seam*.6*(.7 + .5*cl);
  float tree = .15 + .06*sin(az*13. + sin(uTime*1.3 + az*4.)*.7) + .035*sin(az*37. + uTime*2.3) + .02*sin(az*71. - uTime*3.1);
  float gm = 1. - smoothstep(tree - .02 - sf*.5, tree + .02 + sf*.5, e);
  sky = mix(sky, uGardenCol*(.7 + .5*n11(az*23. + uTime*.4)), gm*.86);
  sky *= 1. + .10*(1.-rough)*sin(az*90. + sin(e*40. - uTime*9.)*2.);
  float bal = smoothstep(-.20 - sf, -.15 + sf, e);
  vec3 c = mix(uWallCol*.3*(.55 + .45*step(.5, fract(az*16.))), sky, bal);
  // the posts of the open front stand dark against the sky
  float pz = h.x/max(h.y, .2);
  float pp = abs(fract((pz + .5)/.769 + .5) - .5)*.769;
  c = mix(c, uWallCol*(.34 + .2*e), (1. - smoothstep(.04 - sf*.2, .064 + sf*.6, pp))*step(.2, h.y)*.92);
  float dado = smoothstep(.10 - sf, .13 + sf, e);
  vec3 dd = uDadoCol*(.42 + .2*sin(az*26.)*sin(e*34.)) + uWallCol*.3*(.4 + .6*step(.8, fract(az*6.5)));
  dd = mix(uWallCol*.42*(.8 + .3*n11(az*9.)), dd, smoothstep(-.06 - sf, -.03 + sf, e));
  float door = (1. - smoothstep(.06, .08 + sf, abs(abs(az) - .42)))*(1. - smoothstep(.30 - sf, .33 + sf, e))*step(h.y, 0.);
  vec3 wall = mix(mix(dd, uWallCol*(.8 + .2*e), dado), uGardenCol*.55*(.7 + .3*step(.5, fract(e*40.))), door);
  c = mix(wall, c, front);
  float roof = smoothstep(.44 - sf, .52 + sf, e);
  vec3 rf = uRoofCol*(.85 + .3*smoothstep(.25, .75, abs(fract(d.x/max(e, .2)*1.5) - .5)*2.)*(1. - rough)) + uSkyCol*.06*front;
  c = mix(c, rf, roof);
  float dn = 1. - smoothstep(-.52 - sf, -.30 + sf, e);
  c = mix(c, uClothCol*(.55 + .45*front), dn);
  return c*(1. + uFlash*3.);
}
// soft daylight arriving on a matte surface with stage-space normal n
vec3 roomIrr(vec3 n){
  float f = clamp(n.z*.5 + .5, 0., 1.), up = n.y*.5 + .5;
  return (uSkyCol*(.07 + .5*f*f)*(.55 + .45*up) + uSkyCol*.2*max(n.y, 0.) + uClothCol*.16*(1.-up) + uKeyCol*max(dot(n, uKeyDir), 0.) + uAmbCol)*(1. + uFlash*3.);
}
// rain beads that sit on a surface: object-space cell noise. returns xyz = normal push, w = mask
vec4 beadField(vec3 p, float cell, float amount, float px){
  vec3 q = p/cell, i = floor(q), f = fract(q) - .5;
  float k = h31(i);
  vec3 o = (vec3(h31(i + 7.3), h31(i + 13.9), h31(i + 21.1)) - .5)*.5;
  float rr = .08 + .16*h31(i + 3.7), dd = length(f - o);
  float m = (1. - smoothstep(rr*.82, rr, dd))*step(1. - amount, k)*(1. - smoothstep(.2, .8, px/(rr*cell)));
  return vec4((f - o)/rr, m);
}
`;

const VERT_STD = (fogPars, fogVert) => /* glsl */`
attribute vec4 aData;
varying vec3 vWPos, vWNrm, vCol, vOPos; varying vec4 vData;
${fogPars}
void main(){
  vCol = color; vData = aData; vOPos = position;
  vec4 wp = modelMatrix*vec4(position, 1.);
  vWPos = wp.xyz; vWNrm = mat3(modelMatrix)*normal;
  vec4 mvPosition = viewMatrix*wp;
  gl_Position = projectionMatrix*mvPosition;
  ${fogVert}
}`;

// Brass / nickel / mica. color = F0 tint, aData = (roughness, wear or mica radius, horn depth s or -1, mica flag)
const FRAG_BRASS = (fogPars) => /* glsl */`
varying vec3 vWPos, vWNrm, vCol, vOPos; varying vec4 vData;
uniform vec3 uHornAxis, uThroat, uHX, uHY, uThroatCol; uniform float uSwell, uBeadAmt, uBandGold, uSeat, uRingK, uMirK; uniform mat4 modelMatrix;
${GLSL_ROOM}
${fogPars}
// engraving: an incised line of half-width w about d = 0 (aa = one pixel in the same units)
float cut(float d, float w, float aa){ return 1. - smoothstep(w, w + aa, abs(d)); }
// a chased band round the bore at depth c: two ruled lines each side and a braid of two crossing waves between
float chase(float dpv, float c, float ang, float aa){
  float hw = .019, w = (dpv - c)/hw, lw = .12, a1 = aa/hw*1.2;
  float edge = cut(abs(w) - 1., lw, a1) + cut(abs(w) - 1.34, lw*.6, a1);
  float wave = sin(ang*12.5663706);
  float braid = (cut(w - .62*wave, lw*1.5, a1) + cut(w + .62*wave, lw*1.5, a1))*step(abs(w), 1.);
  float pearl = (1. - smoothstep(.16, .16 + a1, length(vec2((fract(ang*2. + .25) - .5)*1.6, w))))*step(abs(w), 1.);
  return clamp(edge + braid + pearl, 0., 1.)*(1. - smoothstep(.45, 1.5, a1/lw));
}
void main(){
  vec3 N = normalize(vWNrm);
  bool back = !gl_FrontFacing;
  if(back) N = -N;
  vec3 V = normalize(cameraPosition - vWPos);
  vec3 Ns = normalize(uStageInv*N), Vs = normalize(uStageInv*V);
  float rough = vData.x, wear = vData.y, depth = vData.z, mica = step(.5, vData.w);
  float inside = (back && depth > -.5) ? 1. : 0.;
  vec3 F0 = vCol;
  float px = length(fwidth(vOPos));
  // lacquer: slow mottling, pale wear on the ribs, tarnish, polishing scratches
  float mot = n21(vOPos.xy*.07 + vOPos.z*.05)*.6 + n21(vOPos.zy*.31 + 9.)*.4;
  float w = clamp(wear*(1. - mica)*(.6 + .8*mot), 0., 1.);
  F0 = mix(F0*(.82 + .3*mot), mix(F0, vec3(.90, .80, .56), .38), w);
  float tar = smoothstep(.5, .9, n21(vOPos.xz*.06 + vOPos.y*.05 + 3.)*.6 + n21(vOPos.zy*.23 + vOPos.x*.19)*.4)*(1. - mica)*mix(1., .35, step(-.5, depth));
  float scr = n21(vec2(dot(vOPos, vec3(6.1, 2.7, 4.3)), dot(vOPos, vec3(.13, -.21, .16))))*.6 + n21(vec2(dot(vOPos, vec3(-3.3, 5.9, 2.1)), dot(vOPos, vec3(.17, .09, -.2))))*.4;
  float nearK = 1. - smoothstep(.02, .12, px);
  F0 *= mix(vec3(1.), vec3(.66, .5, .36), tar*.42);
  rough = clamp(rough + .18*w + .05*mot + .16*tar + .10*(scr - .5)*nearK, .02, 1.);
  Ns = normalize(Ns + (vec3(n21(vOPos.yz*1.9), n21(vOPos.zx*1.9 + 5.), n21(vOPos.xy*1.9 + 9.)) - .5)*.035*nearK*(1. - mica));
  // mica diaphragm: target rings that flutter
  float rings = 0.;
  float rr = wear*9.;
  float fw = max(fwidth(rr), 1e-4);
  if(mica > .5){
    rings = smoothstep(.5 - fw, .5 + fw, abs(fract(rr) - .5)*2.);
    float fl = sin(wear*46. - uTime*31.)*.5 + sin(wear*17. + uTime*23.)*.5;
    Ns = normalize(Ns + vec3(0., 1., 0.)*fl*.07*(1. - wear) + vec3(.06, 0., .04)*sin(uTime*37.)*(1. - wear));
    F0 = mix(vec3(.42, .37, .26), vec3(.70, .66, .52), rings);
    rough = .06;
  }
  // rain beads lying on the metal
  vec4 bd = beadField(vOPos, 2.6, uBeadAmt*(1. - mica), px);
  vec4 bd2 = beadField(vOPos + 11.3, .9, uBeadAmt*.7*(1. - mica), px);
  float bm = max(bd.w, bd2.w);
  vec3 bn = bd.w > bd2.w ? bd.xyz : bd2.xyz;
  Ns = normalize(Ns + uStageInv*(mat3(modelMatrix)*bn)*.8*bm);
  rough = mix(rough, .03, bm);
  float ndv = max(dot(Ns, Vs), 0.);
  vec3 R = reflect(-Vs, Ns);
  float fr = 1. - ndv; fr = fr*fr*fr*fr*fr;
  vec3 F = F0 + (1. - F0)*fr;
  vec3 env = roomEnv(R, rough);
  env = mix(vec3(dot(env, vec3(.3, .55, .15))), env, .5);            // a grey sky must not turn the gold olive
  // streaks stretched along the flutes (the garden smeared down each rib)
  float st = n21(vec2(vOPos.x*.9 + vOPos.z*.4, depth*5.))*.6 + n21(vec2(vOPos.x*2.9 - vOPos.y*1.3, depth*11.))*.4;
  env *= mix(1., .78 + .44*st, step(-.5, depth)*(1. - bm));
  vec3 col;
  if(inside > .5){
    // inside the bell: ten flutes like the ribs of a gold canyon. Light fails with depth from pale gold to deep
    // bronze; worn crests stand bright, the beds sink, one flank of every rib lies in its own shade. Each flute is a
    // long hollow mirror: the opening behind the viewer (sky rift, thrashing garden, posts, balustrade, cloth) lies
    // in it warped and stretched; chased bands and shell fans are cut into the brass; and the music comes up the
    // bore as rings of light from the collar where the portal sits.
    float dp = max(depth, 0.);
    float dq = clamp((dp - uSeat)/(1. - uSeat), 0., 1.);              // 0 at the collar .. 1 at the mouth
    float lit = mix(.36, 1., pow(dq, 1.2));
    float lum = dot(uSkyCol, vec3(.3, .55, .15));
    vec3 q = vOPos - uThroat;
    vec3 qr = q - uHornAxis*dot(q, uHornAxis);
    float rr0 = max(length(qr), 1.);
    vec3 rad = qr/rr0;
    float th = atan(dot(qr, uHY), dot(qr, uHX) + 1e-4);
    float a10 = (th/6.2831853 + .5)*10. + .5;
    float fx = fract(a10) - .5, fid = floor(a10);                     // across one flute (0 = its bed), and which flute
    float ridge = 1. - pow(abs(cos(th*5.)), .72);                     // 0 in the bed .. 1 on the rib that stands into the bore
    float crest = smoothstep(.3, .96, ridge), bed = 1. - smoothstep(0., .55, ridge);
    vec3 et = cross(uHornAxis, rad);
    float flank = clamp(dot(Ns, et)*3.2, -1., 1.);
    float deep = 1. - .55*dq;                                         // the relief reads harder the deeper we are
    vec3 gold = F0*vec3(1.18, 1.1, .9);
    float form = mix(1., .42, bed*deep)*(1. + 1.05*crest)*(1. + .7*flank*(1. - .6*crest));
    vec3 glow = mix(gold, gold*vec3(.78, .46, .24), bed*deep*.9)*lum*.46*form*(.84 + .3*mot);
    // the veranda in the brass: a fisheye of the opening, bent again by every flute
    // (round the rim the cloth and the balustrade, then the thrashing garden, then the sky with its rift and the
    // posts as dark spokes; each flute holds its own strip of it, turned by where the flute stands round the bore)
    float thr = atan(dot(qr, uHX), dot(qr, uHY) + 1e-4);              // 0 at the top petal
    float mA = thr*.3 + fx*(.95 + .4*flank*flank), mE = mix(.47, -.13, smoothstep(.4, 1., dq)) + .04*flank - .05*cos(thr);
    vec3 md = vec3(sin(mA)*cos(mE), sin(mE), cos(mA)*cos(mE));
    vec3 mir = roomEnv(md, .17 + .1*crest);
    mir = mix(vec3(dot(mir, vec3(.3, .55, .15))), mir, 1.25);
    vec3 tintG = mix(vec3(1.), gold*1.5, .4 + .55*uBandGold);
    float mw = smoothstep(.34, .66, dq)*(1. - .45*crest)*uMirK;
    glow = mix(glow, max(mir, 0.)*tintG*(.6 + .32*form)*(.82 + .26*st), mw*.8);
    float shim = .5 + .5*sin(dp*38. - uSwell*6.2832);
    glow *= 1. + .3*shim*shim*shim*crest;
    float run = max(sin(dp*17. + uTime*1.15 + fid*2.4), 0.); run *= run; run *= run; run *= run;
    glow += gold*lum*.45*run*crest*(.75 + .25*dq);
    float out1 = smoothstep(.2, .85, dot(R, uHornAxis));
    // brass tints what it mirrors: the silver sky lies on the petals as pale gold, never as grey
    col = mix(glow, env*mix(F, F0*1.25, .7)*mix(vec3(1.), F0*1.3, .6), out1*.8)*lit;
    col *= mix(vec3(.8, .45, .22), vec3(1.), sqrt(lit));
    // engraving: chased bands round the bore, a ruled line each side of every rib, a shell fan in each bed at the rim
    float dD = px/${HORN_LEN.toFixed(1)}, dA = px/rr0*1.5915;
    float e0 = chase(dp, uSeat + .08, a10, dD) + chase(dp, .66, a10, dD) + chase(dp, .835, a10, dD) + chase(dp, .955, a10, dD)*.8;
    float e1 = chase(dp + .0026, uSeat + .08, a10, dD) + chase(dp + .0026, .66, a10, dD) + chase(dp + .0026, .835, a10, dD);
    float ribl = cut(abs(fx) - .405, .011, dA)*(1. - smoothstep(.45, 1.5, dA/.011))*smoothstep(.02, .1, dq);
    float fanw = (fx/.3)*(fx/.3);
    float fan = cut(fract(fx*26.) - .5, .14, dA*26.)*(1. - smoothstep(.45, 1.5, dA*26./.14))*step(abs(fx), .3)
      *smoothstep(.862 + .05*fanw, .868 + .05*fanw, dp)*(1. - smoothstep(.925 - .03*fanw, .93 - .03*fanw, dp));
    float eng = clamp(e0 + ribl + fan*.8, 0., 1.);
    col *= 1. - .52*eng;
    col += gold*lum*lit*.34*clamp(e1 - e0, 0., 1.);
    // the music: rings of light that leave the collar and run up the bore, some loud, some soft
    float ph = uTime*.8 - dq*2.3 - .03*ridge;
    float rid = floor(ph), rf = fract(ph);
    float loud = .3 + .7*h11(rid*1.37 + 2.)*(.55 + .45*step(.5, fract(rid*.5)));
    float rq = (rf - .5)/.034;
    float ringL = exp(-rq*rq)*loud*smoothstep(.0, .08, dq)*(1. - .4*dq)*uRingK;
    col *= 1. + 2.4*ringL*(.6 + .5*crest + .2*flank);
    col += mix(uThroatCol*1.2, gold*lum, .6)*ringL*.55*(.5 + .6*crest);
    // the collar: the bore's last few metres burn with what lies beyond the portal, and its warmth creeps up the ribs
    float far = smoothstep(45., 260., length(cameraPosition - (modelMatrix*vec4(uThroat + uHornAxis*(uSeat*${HORN_LEN.toFixed(1)}), 1.)).xyz));
    col += uThroatCol*exp(-dq*11.)*(.55 + .5*crest + .2*flank)*(.7 + .3*mot)*(1. + .8*far);
    col += uThroatCol*vec3(1., .86, .62)*exp(-dq/.15)*.32*(.4 + .6*far)*(.5 + .6*crest + .2*flank);
  } else {
    col = env*F*mix(vec3(1.), F0*1.35, .4) + F0*roomIrr(Ns)*.17;
    vec3 H = normalize(uKeyDir + Vs);
    float sp = max(dot(Ns, H), 0.);
    col += uKeyCol*F*pow(sp, mix(260., 12., rough))*mix(2.2, .3, rough);
    // the collar round the portal (aData.w = -1): turned brass that burns with the light beyond it
    float ck = step(vData.w, -.5);
    if(ck > .5){
      vec3 q = vOPos - uThroat;
      vec3 qr = q - uHornAxis*dot(q, uHornAxis);
      float rc = length(qr);
      vec3 rad = qr/max(rc, 1.);
      float inw = clamp(-dot(Ns, rad)*.75 + .45, 0., 1.), turn = .8 + .2*sin(rc*5.2);
      float beadr = .75 + .25*sin(atan(dot(qr, uHY), dot(qr, uHX) + 1e-4)*60.)*step(21.6, rc)*step(rc, 23.4);
      col = col*.35 + uThroatCol*(.34 + 1.5*inw*inw + .5*(1. - smoothstep(${SEAT_R.toFixed(1)}, ${(SEAT_R + 5).toFixed(1)}, rc)))*turn*beadr*(.8 + .3*mot)*(1. + uFlash*2.);
    }
  }
  if(mica > .5) col = mix(vec3(.50, .37, .19), vec3(.80, .70, .46), rings)*roomIrr(Ns)*1.15 + env*(.10 + .9*fr);
  col += bm*uRiftCol*.10*smoothstep(.0, .6, R.z)*(1. + uFlash*4.);
  gl_FragColor = vec4(fxApplyFog(col), 1.);
}`;

// ---------------------------------------------------------------- shaders: the record
const GLSL_WARP = /* glsl */`
uniform float uWarp;
float warpH(vec2 p){
  float r = max(length(p), 1e-3);
  float c = p.x/r, s = p.y/r;
  float s2 = 2.*s*c, c2 = c*c - s*s, s4 = 2.*s2*c2, c4 = c2*c2 - s2*s2, s8 = 2.*s4*c4, c8 = c4*c4 - s4*s4;
  return uWarp*(min(r, 150.)/82.)*(.78*s4 + .22*(s8*.2675 + c8*.9636));
}`;
// JS twin of warpH (th = angle of the point in record space)
function warpJS(r, th, amp) { return amp * (Math.min(r, 150) / 82) * (0.78 * Math.sin(4 * th) + 0.22 * Math.sin(8 * th + 1.3)); }

const VERT_RECORD = (fogPars, fogVert) => /* glsl */`
varying vec3 vWPos, vWNrm, vOPos;
${GLSL_WARP}
${fogPars}
void main(){
  vec3 p = position;
  vOPos = p;
  float h = warpH(p.xz);
  vec3 n = normalize(vec3(h - warpH(p.xz + vec2(1., 0.)), 1., h - warpH(p.xz + vec2(0., 1.))));
  p.y += h;
  n = normalize(mix(n, normal, step(.5, abs(normal.x) + abs(normal.z))));
  vec4 wp = modelMatrix*vec4(p, 1.);
  vWPos = wp.xyz; vWNrm = mat3(modelMatrix)*n;
  vec4 mvPosition = viewMatrix*wp;
  gl_Position = projectionMatrix*mvPosition;
  ${fogVert}
}`;

const FRAG_RECORD = (fogPars) => /* glsl */`
varying vec3 vWPos, vWNrm, vOPos;
uniform vec3 uShellac, uLabel, uGold, uHornC, uBoxC, uSpark;
uniform float uHornR, uBoxR, uDust, uMirror, uDeep;
uniform mat3 uRecToStage;
${GLSL_ROOM}
${fogPars}
// value noise that wraps every K cells along x (so the polar seam does not show)
float nwrap(vec2 x, float K){ vec2 i = floor(x), f = fract(x); f = f*f*(3.-2.*f);
  float i0 = mod(i.x, K), i1 = mod(i.x + 1., K);
  return mix(mix(h21(vec2(i0, i.y)), h21(vec2(i1, i.y)), f.x), mix(h21(vec2(i0, i.y + 1.)), h21(vec2(i1, i.y + 1.)), f.x), f.y); }
// reflection of a brass ball (the horn's underside, the soundbox) seen from P along R
float ball(vec3 P, vec3 R, vec3 C, float rad){
  vec3 oc = C - P; float b = dot(oc, R); float d2 = dot(oc, oc) - b*b;
  return step(0., b)*(1. - smoothstep(rad*rad*.55, rad*rad, d2));
}
vec3 seen(vec3 P, vec3 R, float rough){
  vec3 c = roomEnv(R, rough);
  float lum = dot(uSkyCol, vec3(.3, .55, .15));
  // shellac is a black mirror: plain cloud sinks into it, only the rift and its seam lie on it as light
  c *= mix(uDeep, 1., smoothstep(.8, 2.1, dot(c, vec3(.3, .55, .15))/max(lum, .02)));
  float hb = ball(P, R, uHornC, uHornR);
  c = mix(c, uGold*lum*(.16 + .5*hb*hb)*(1. + uFlash*2.), hb*.94);
  float sb = ball(P, R, uBoxC, uBoxR);
  c = mix(c, uGold*lum*.42, sb*.9);
  return c;
}
void main(){
  vec2 p = vOPos.xz;
  float r = length(p);
  vec2 rd = p/max(r, 1e-3), tg = vec2(-rd.y, rd.x);
  float ang = atan(p.y, p.x + step(r, 1e-3));
  float a01 = ang/6.2831853 + .5;
  vec3 N = normalize(vWNrm), V = normalize(cameraPosition - vWPos);
  vec3 Ns = normalize(uStageInv*N), Vs = normalize(uStageInv*V), Ps = uStageInv*(vWPos - uStagePos);
  vec3 Ts = uRecToStage*vec3(tg.x, 0., tg.y), Rs = uRecToStage*vec3(rd.x, 0., rd.y);
  float top = step(.5, N.y);
  // zones
  float gz = smoothstep(62., 62.6, r)*(1. - smoothstep(145.4, 146., r));          // the cut band
  float leadIn = smoothstep(146., 146.4, r);
  // grooves: antialiased rings, fading to their mean where they are finer than a pixel
  float g = r/.3;
  float fw = max(fwidth(g), 1e-4);
  float vis = 1. - smoothstep(.35, 1.1, fw);
  float tri = abs(fract(g) - .5)*2.;
  float wall = mix(.5, smoothstep(.42 - fw, .42 + fw, tri), vis)*gz;
  // a few wide spiral lines in the lead-in and run-out
  float g2 = r/3.2 + a01;
  float fw2 = max(fwidth(r/3.2), 1e-4);
  float sp2 = (1. - smoothstep(.06, .06 + fw2*1.5, abs(fract(g2) - .5)*2.))*(1. - gz)*step(LABELR, r);
  // loud and quiet passages: concentric bands of different sheen
  float band = n11(r*.23)*.55 + n11(r*.71 + 7.)*.3 + n11(r*2.3)*.15;
  // streak noise, 40:1 along the groove
  float st = nwrap(vec2(a01*48., r*1.9), 48.)*.55 + nwrap(vec2(a01*160., r*5.3), 160.)*.45;
  float scr = smoothstep(.83, .93, nwrap(vec2(a01*24., r*3.1 + 40.), 24.))*.5;
  // dust specks riding the disc
  vec2 dc = vec2(a01*700., r/1.1), di = floor(dc), df = fract(dc) - .5;
  float dk = h21(di);
  vec2 dof = (vec2(h21(di + 5.1), h21(di + 9.7)) - .5)*.5;
  vec2 dv = (df - dof)*vec2(6.2831853*r/700., 1.1);
  float dr = .09 + .16*h21(di + 2.3);
  float speck = (1. - smoothstep(dr*.6, dr, length(dv)))*step(1. - .045*uDust, dk)*step(LABELR, r);
  speck *= 1. - smoothstep(.1, .34, length(fwidth(p)));               // finer than a pixel they are gone, not white pinpricks
  float ndv = max(dot(Ns, Vs), 0.);
  float fr = 1. - ndv; float fr2 = fr*fr; fr = fr2*fr2*fr;
  float F = .055 + .945*fr;
  // warp bends the mirror: the normal already carries it
  vec3 R = reflect(-Vs, Ns);
  vec3 mirror = seen(Ps, R, .015 + .05*wall);
  // groove flanks fan the reflection across the radius: the bow-tie of sky glare
  vec3 fan = vec3(0.);
  float tk = -.75;
  for(int k = 0; k < 4; k++){
    vec3 nn = normalize(Ns + Rs*tk);
    fan += seen(Ps, reflect(-Vs, nn), .22);
    tk += .5;
  }
  fan *= .25;
  float sheen = (.35 + 1.1*band)*(.55 + .9*st);
  vec3 col = uShellac*(.5 + .5*roomIrr(Ns));
  col += mirror*F*(1. - .4*wall)*(1. - .35*scr)*uMirror;
  col += fan*wall*(.008 + .34*F)*sheen*mix(uMirror, 1., .3);
  // the grooves themselves: fine silver lines that stream even where the mirror is black
  col += uSkyCol*gz*smoothstep(.6, .92, st)*(.0035 + .03*F)*(.4 + band);
  // anisotropic glint of the key along the grooves
  vec3 H = normalize(uKeyDir + Vs);
  float th = dot(Ts, H);
  float an = pow(max(1. - th*th, 0.), 90.)*max(dot(Ns, uKeyDir), 0.);
  col += (uKeyCol + uRiftCol*.25)*an*gz*(.10 + .25*band)*(.5 + st);
  // seen from well above, the mirror shows only the dark roof: there the grooves throw the whole open front back as
  // a soft bow-tie of sky across the disc, banded by the loud and quiet passages
  float steep = smoothstep(.34, .72, ndv);
  vec3 Hb = normalize(vec3(0., .34, .94) + Vs);
  float tb = dot(Ts, Hb), bow = max(1. - tb*tb, 0.);
  bow *= bow; bow *= bow; bow *= bow; bow = bow*bow*bow;
  col += (uSkyCol*.8 + uRiftCol*.1)*gz*steep*(bow*(.035 + .15*band)*(.5 + .8*st) + .004 + .012*band*band)*(1. + uFlash*3.);
  col += sp2*mirror*.35 + scr*gz*uSkyCol*.012*(.5 + F*3.);
  col += speck*(uSkyCol*.09 + uSpark)*(.6 + 2.*F)*(1. + uFlash*4.);
  // raised bead at the rim
  float rim = smoothstep(148.2, 149.2, r);
  col = mix(col, uShellac + mirror*F*.6 + fan*.12, rim*.6);
  // the label: paper with gold rings and dots, a turning shore
  float lr = r/LABELR;
  float fl = max(fwidth(lr), 1e-4);
  if(r < LABELR + .5){
    float la = smoothstep(LABELR + .5, LABELR - .1, r + .5)*top;
    float paper = .82 + .18*n21(p*1.7) - .10*n21(p*.21);
    vec3 lab = uLabel*paper*roomIrr(Ns)*1.25;
    float gring = (1. - smoothstep(.012, .012 + fl, abs(lr - .93))) + (1. - smoothstep(.006, .006 + fl, abs(lr - .885)))
      + (1. - smoothstep(.008, .008 + fl, abs(lr - .36))) + (1. - smoothstep(.02, .02 + fl, abs(lr - .155)));
    float da = fract(a01*28.) - .5;
    float dots = 1. - smoothstep(.022, .022 + fl, length(vec2(da*6.2831853*lr/28., lr - .80)));
    float bars = step(.3, fract(a01*9. + .13*floor(lr*14.)))*step(.45, fract(lr*14.))*step(.46, lr)*step(lr, .72)
      *step(.35, h21(vec2(floor(lr*14.), floor(a01*9. + .13*floor(lr*14.)))));
    float tw = step(.12, abs(a01 - .5))*(1. - smoothstep(.07, .07 + fl, abs(lr - .56)))*0.;
    float gold = clamp(gring + dots + tw, 0., 1.);
    lab = mix(lab, lab*.55 + uGold*roomIrr(Ns)*.25, bars*.8);
    lab = mix(lab, uGold*(roomEnv(R, .3)*.9 + roomIrr(Ns)*.25), gold);
    lab += mirror*F*.10;
    float hole = 1. - smoothstep(3.3, 3.8, r);
    lab = mix(lab, vec3(.004), hole);
    col = mix(col, lab, la);
  }
  gl_FragColor = vec4(fxApplyFog(col), 1.);
}`.replace(/LABELR/g, LABEL_R.toFixed(1));

// ---------------------------------------------------------------- shaders: rain beads (instanced domes)
// aBead = (r or s, angle, size (negative: inside the horn), seed (>= 2: a drip falling from the lower lip))
const GLSL_HORN = /* glsl */`
uniform vec3 uThroat, uHornAxis, uHX, uHY;
vec3 hornPoint(float s, float th){
  float t = min(s, 1.), pet = pow(abs(cos(th*${(PETALS * 0.5).toFixed(1)})), .72);
  float amp = .02 + .115*t*t + .085*sin(3.14159265*t);
  float r = (9. + 116.*(.2*t + .8*pow(t, 3.1)))*(1. - amp + amp*1.5*pet), ax = t*${HORN_LEN.toFixed(3)} + 9.*t*t*t*(pet - .5);
  if(s > 1.){ float a = (s - 1.)/.08*3.927, rr = 4.2 + 1.6*pet; r += rr*sin(a); ax -= rr*(1. - cos(a)); }
  return uThroat + uHornAxis*ax + r*(cos(th)*uHX + sin(th)*uHY);
}`;
const VERT_BEAD = (horn, fogPars, fogVert) => /* glsl */`
attribute vec4 aBead;
varying vec3 vWPos, vWNrm; varying float vSeed, vLit, vRad, vIn;
uniform float uTime, uFlow, uDrip;
${horn ? GLSL_HORN : GLSL_WARP}
${fogPars}
void main(){
  float sz = abs(aBead.z), seed = aBead.w;
  vec3 p, n;
  vSeed = seed; vLit = 1.; vIn = 0.; vRad = length(position.xz)*(1. - step(2., seed));
#ifdef HORN
  if(seed < 2.){
    float inside = step(aBead.z, 0.);
    float lo = .06, hi = 1.0;
    float ph = fract((aBead.x - lo)/(hi - lo) - (uTime + .7*sin(uTime*.8 + seed*40.))*.006*(.3 + seed)*uFlow);
    float s = lo + ph*(hi - lo);
    sz *= smoothstep(0., .05, ph)*(1. - smoothstep(.95, 1., ph));
    vLit = mix(1., mix(.11, 1., pow(s, 1.9)), inside);
    vIn = inside;
    // inside the bell a bead is never wider than about a tenth of a flute, and runs a little long down the bore
    float tb = min(s, 1.);
    sz = mix(sz, min(sz*.8, .03*(9. + 116.*(.2*tb + .8*pow(tb, 3.1)))), inside);
    vec3 P0 = hornPoint(s, aBead.y);
    // close to the eye a bead inside the bell stays a drop, never a disc
    float bdist = length(cameraPosition - (modelMatrix*vec4(P0, 1.)).xyz);
    sz = mix(sz, min(sz, max(bdist*.017, .12)), inside);
    vec3 tu = normalize(hornPoint(s, aBead.y + .012) - P0), tv = normalize(hornPoint(s + .004, aBead.y) - P0);
    vec3 nn = normalize(cross(tu, tv))*(1. - 2.*inside);
    // a bead shows only from its own side of the brass (the far side's beads must not print through as flat rings)
    sz *= smoothstep(0., 1.5, dot(cameraPosition - (modelMatrix*vec4(P0, 1.)).xyz, mat3(modelMatrix)*nn));
    p = P0 + sz*(tu*position.x + nn*position.y*mix(1., 1.5, inside) + tv*position.z*mix(1.35, 1.4, inside));
    n = normalize(tu*normal.x + nn*normal.y + tv*normal.z);
  } else {
    // a drip: swells on the lower lip, lets go, falls to the record and starts again
    float ph = seed > 3. ? clamp(uDrip, 0., 1.) : fract(uTime/4. + seed*1.37);
    vec3 P0 = hornPoint(1.045, aBead.y) - vec3(0., 4.6, 0.);
    float grow = smoothstep(0., .5, ph), tf = max(ph - .5, 0.)*4.;
    float fall = 20.*tf*tf;
    float gone = 1. - step(aBead.x, fall);
    vec3 q = vec3(position.x, position.y/.62 - .5, position.z);
    float rad = mix(1., .5, step(q.y, -.2));
    q.xz *= rad; q.y *= 1.5 + .5*step(.5, ph);
    p = P0 + vec3(0., -fall, 0.) + q*sz*grow*gone;
    n = normalize(vec3(normal.x, normal.y*.5 + .1, normal.z));
  }
#else
  float c = cos(aBead.y), s = sin(aBead.y);
  vec2 xz = aBead.x*vec2(c, s);
  p = vec3(xz.x, warpH(xz), xz.y) + position*sz;
  n = normal;
#endif
  vec4 wp = modelMatrix*vec4(p, 1.);
  vWPos = wp.xyz; vWNrm = mat3(modelMatrix)*n;
  vec4 mvPosition = viewMatrix*wp;
  gl_Position = projectionMatrix*mvPosition;
  ${fogVert}
}`;
const FRAG_BEAD = (fogPars) => /* glsl */`
varying vec3 vWPos, vWNrm; varying float vSeed, vLit, vRad, vIn;
uniform vec3 uUnder, uHornAxis; uniform float uGlint, uLens, uBody, uMirrorB, uRimA;
${GLSL_ROOM}
${fogPars}
void main(){
  vec3 N = normalize(vWNrm), V = normalize(cameraPosition - vWPos);
  vec3 Ns = normalize(uStageInv*N), Vs = normalize(uStageInv*V);
  float ndv = max(dot(Ns, Vs), 0.);
  float fr = 1. - ndv; float fr2 = fr*fr; fr = fr2*fr2*fr2*fr;
  float F = .02 + .98*fr;
  float drip = step(2., vSeed);
  float lumS = max(dot(uSkyCol, vec3(.3, .55, .15)), .02);
  // the skin of the drop mirrors the room, but on water this dark only the bright things register:
  // a thin crescent of sky on the limb that faces the opening
  vec3 refl = roomEnv(reflect(-Vs, Ns), .02);
  refl *= mix(.3, 1., smoothstep(.7, 1.9, dot(refl, vec3(.3, .55, .15))/lumS));
  // inside the bell a bead mirrors brass, brightest where it faces the mouth
  refl = mix(refl, uUnder*lumS*(1.2 + 3.2*max(dot(reflect(-Vs, Ns), uHornAxis), 0.)), vIn*.75);
  // the drop as a lens: the opening, small and upside down, on the flank turned away from it
  vec2 q = Ns.xz;
  vec3 ld = normalize(vec3(-q.x*1.7, .2 + (q.y + .45)*1.3, 1.));
  float lm = smoothstep(.1, .3, -q.y)*(1. - smoothstep(.6, .82, -q.y))*(1. - smoothstep(.2, .5, abs(q.x)))*(1. - drip);
  vec3 lens = roomEnv(ld, .1)*lm*uLens;
  // on brass the lens also gathers the opening's light into a warm crescent
  vec3 Lk = normalize(vec3(uKeyDir.x*.5, .35, max(uKeyDir.z, .2) + .6));
  Lk = normalize(mix(Lk, uHornAxis, vIn));                              // in the bore the light comes down from the mouth
  float ca = max(dot(Ns, -Lk)*.5 + .5, 0.); ca = ca*ca; ca = ca*ca*smoothstep(0., .4, ndv);
  vec3 under = mix(uUnder, vec3(.2, .22, .24), drip);
  float rim = smoothstep(mix(.7, .9, vIn), .99, vRad);                 // the dark meniscus where it meets the surface
  vec3 col = refl*F*uMirrorB + (lens + under*ca*1.3*roomIrr(vec3(0., .6, .8))*(1. + 2.4*vIn))*(1. - F)*(1. - rim);
  col *= mix(vLit, max(vLit, .5)*.55, vIn);                            // clear water over brass: a dark body
  // one hard glint of the sky; it softens and dims as the drop shrinks to less than a few pixels
  float nw = length(fwidth(Ns));
  float ex = clamp(2.6/(nw*nw + 1e-5), 24., 640.);
  vec3 H = normalize(Lk + Vs);
  float sp = pow(max(dot(Ns, H), 0.), ex)*sqrt(ex/640.);
  // seen from well above and far off, a bead's glint fades with its size on screen and varies from bead to bead
  float small = clamp(.24/(nw + 1e-4), 0., 1.);
  sp *= mix(1., small*small*(.25 + 1.5*fract(vSeed*7.31)), smoothstep(.3, .62, Vs.y)*(1. - vIn));
  col += mix(uSkyCol*.9 + uRiftCol*.5, vec3(1., .84, .5)*max(lumS, .5)*4.4, vIn)*sp*uGlint*(1. + uFlash*5.)*mix(sqrt(vLit), 1., vIn);
  // and a bright crescent of gathered light on the flank away from the mouth
  col += vIn*vec3(1., .74, .34)*lumS*ca*.55*(1. - rim);
  col += uSkyCol*ca*.08*uFlash*5.;
  float a = clamp(mix(mix(uBody, .42, vIn), mix(uRimA, .6, vIn), rim) + drip*.3, 0., .95);
  float fg = fxFog();
  gl_FragColor = vec4(mix(col, fogColorOr0()*a, fg), a);
}`;

// ---------------------------------------------------------------- shaders: mahogany, felt, lace
// aData.x: 0 mahogany, 1 felt (vertex colour), 2 dark well.  aData.y: baked shade 0..1 (1 = open)
const FRAG_WOOD = (fogPars) => /* glsl */`
varying vec3 vWPos, vWNrm, vCol, vOPos; varying vec4 vData;
uniform float uBeadAmt; uniform mat4 modelMatrix;
${GLSL_ROOM}
${fogPars}
void main(){
  vec3 N = normalize(vWNrm), V = normalize(cameraPosition - vWPos);
  vec3 Ns = normalize(uStageInv*N), Vs = normalize(uStageInv*V);
  vec3 an = abs(Ns);
  float mat = vData.x, shade = vData.y;
  float px = length(fwidth(vOPos));
  vec3 col;
  if(mat < .5){
    // ribbon-grained mahogany under varnish
    vec2 g = an.y > .6 ? vOPos.zx : (an.x > an.z ? vec2(vOPos.z, vOPos.y) : vec2(vOPos.x, vOPos.y));   // (across, along)
    float side = 1. - step(.6, an.y);
    // inset panel on each side: a moulded groove and a book-matched field
    float pd = max(abs(g.x) - 168., abs(g.y - 119.) - 62.);
    float groove = (1. - smoothstep(0., 3.2, abs(pd)))*side;
    float inner = step(pd, 0.)*side;
    float gx = g.x*mix(1., -1., inner*step(g.x, 0.)) + inner*37.;
    float wob = n21(vec2(gx*.035, g.y*.006))*7. + n21(vec2(gx*.11, g.y*.012))*2.6 + n21(vec2(gx*.4, g.y*.03))*1.2;
    float rib = sin(gx*.42 + wob);
    float chat = .5 + .5*rib*clamp(dot(Vs, vec3(.6, .2, .7))*1.6, -1., 1.);
    float pore = n21(vec2(gx*5.3, g.y*.16))*.6 + n21(vec2(gx*14., g.y*.5))*.4;
    float fig = n21(vec2(gx*.02 + 3., g.y*.02));
    vec3 alb = vCol*(.74 + .42*chat)*(.72 + .42*pore)*(.75 + .5*fig);
    alb = mix(alb, alb*vec3(.5, .42, .4), smoothstep(.62, .9, pore)*.6);
    alb *= 1. - .62*groove;
    Ns = normalize(Ns + vec3(0., .5, 0.)*groove*sign(pd)*side);
    vec4 bd = beadField(vOPos, 3.1, uBeadAmt, px);
    vec4 bd2 = beadField(vOPos + 5.7, 1.2, uBeadAmt*.8, px);
    float bm = max(bd.w, bd2.w);
    vec3 bn = bd.w > bd2.w ? bd.xyz : bd2.xyz;
    // old rain spots: dull rings where earlier drops dried
    float spot = smoothstep(.55, .75, n21(vOPos.xz*.09 + vOPos.y*.07))*.35;
    Ns = normalize(Ns + uStageInv*(mat3(modelMatrix)*bn)*.8*bm);
    float ndv = max(dot(Ns, Vs), 0.);
    float fr = 1. - ndv; float fr2 = fr*fr; fr = fr2*fr2*fr;
    float F = .045 + .955*fr;
    vec3 R = reflect(-Vs, Ns);
    float rough = mix(.10 + .25*spot + .1*pore, .03, bm);
    col = alb*roomIrr(Ns)*(1. - .25*bm) + roomEnv(R, rough)*F*(.85 - .4*spot);
    col += bm*uSkyCol*.05;
  } else if(mat < 1.5){
    float fz = n21(vOPos.xz*3.1)*.5 + n21(vOPos.xz*9.7 + vOPos.y*4.)*.5;
    float ndv = max(dot(Ns, Vs), 0.);
    col = vCol*(.7 + .5*fz)*roomIrr(Ns)*(1. + .8*(1. - ndv)*(1. - ndv));
  } else {
    col = vCol*roomIrr(Ns)*.3;
  }
  col *= mix(.22, 1., shade);
  gl_FragColor = vec4(fxApplyFog(col), 1.);
}`;

const FRAG_LACE = (fogPars) => /* glsl */`
varying vec3 vWPos, vWNrm, vCol, vOPos; varying vec4 vData;
${GLSL_ROOM}
${fogPars}
void main(){
  vec3 N = normalize(vWNrm), V = normalize(cameraPosition - vWPos);
  vec3 Ns = normalize(uStageInv*N);
  vec2 p = vOPos.xz;
  float r = length(p);
  float fwp = max(fwidth(p.x) + fwidth(p.y), 1e-4);
  float a01 = atan(p.y, p.x + step(r, 1e-3))/6.2831853 + .5;
  // openwork: a fine net, flower medallions on a diamond grid, a scalloped border of big eyelets
  vec2 q = vec2(p.x + p.y, p.x - p.y)*.7071;
  vec2 nc = abs(fract(q/3.4) - .5);
  float net = smoothstep(.24 - fwp*.3, .24 + fwp*.3, max(nc.x, nc.y));          // 1 = thread
  net = mix(.74, net, 1. - smoothstep(.5, 2.2, fwp));
  vec2 mc = q/46., mi = floor(mc), mf = (fract(mc) - .5)*46.;
  float mr = length(mf), ma = atan(mf.y, mf.x + step(mr, 1e-3));
  float petal = mr - (9. + 7.*abs(cos(ma*3.)));
  float solid = 1. - smoothstep(-1., 1. + fwp, petal);                          // flower of cloth
  float eye = (1. - smoothstep(2.6, 3.2 + fwp, mr))*(1. - smoothstep(.8, 3.5, fwp));
  float ringm = 1. - smoothstep(.9, 1.4 + fwp, abs(mr - 20.));
  float cloth = max(max(net, solid), ringm)*(1. - eye);
  float br = 650. - r;
  float border = step(br, 60.);
  float eyelet = (1. - smoothstep(4., 5. + fwp, length(vec2((fract(a01*72.) - .5)*6.2831853*r/72., br - 34.))))*(1. - smoothstep(1.2, 5., fwp));
  float bandm = max(1. - smoothstep(1.2, 2. + fwp, abs(br - 52.)), 1. - smoothstep(1.2, 2. + fwp, abs(br - 16.)));
  cloth = mix(cloth, max(max(net*.9, bandm), step(br, 12.))*(1. - eyelet), border);
  float weave = .9 + .1*n21(p*2.3) - .08*n21(p*.03) + .06*sin(p.x*.011 + 1.)*sin(p.y*.013);
  vec3 irr = roomIrr(Ns);
  vec3 wood = vec3(.16, .075, .05)*irr;
  vec3 col = mix(wood, vCol*weave*irr, cloth);
  // the cabinet and its feet stand on it: soft contact shadow, and a long soft one away from the opening
  vec2 bd = abs(p) - 226.;
  float d = length(max(bd, 0.)) + min(max(bd.x, bd.y), 0.);
  float sh = 1. - .72*exp(-max(d, 0.)/26.) - .22*exp(-max(d, 0.)/140.)*step(p.y, 260.);
  sh *= 1. - .25*(1. - smoothstep(0., 520., length(p - vec2(0., -330.))));
  col *= clamp(sh, 0.05, 1.);
  gl_FragColor = vec4(fxApplyFog(col), 1.);
}`;

// the needle's wake: a small silver V dragged downstream on the shellac (additive)
const FRAG_WAKE = (fogPars) => /* glsl */`
varying vec3 vWPos, vWNrm, vCol, vOPos; varying vec4 vData;
${GLSL_ROOM}
${fogPars}
void main(){
  vec2 uv = vData.xy;                       // x: -1..1 across, y: 0 at the needle .. 1 downstream
  float w = .06 + .9*uv.y;
  float arm = exp(-pow(abs(abs(uv.x) - w*.8)/(.05 + .12*uv.y), 2.));
  float rip = .6 + .4*sin(uv.y*46. - uTime*26. + abs(uv.x)*9.);
  float core = exp(-uv.x*uv.x/(.004 + .02*uv.y))*exp(-uv.y*7.);
  float a = (arm*rip*(1. - uv.y)*(1. - uv.y)*.55 + core*1.2)*smoothstep(0., .03, uv.y);
  vec3 col = (uSkyCol*.5 + uRiftCol*.12)*a*(1. + uFlash*4.);
  gl_FragColor = vec4(col*(1. - fxFog()), 1.);
}`;

// ---------------------------------------------------------------- geometry: horn
async function buildHornGeometry(B) {
  const P = new THREE.Vector3(), nU = PETALS * 24, nMain = 62, nRim = 8, nV = nMain + nRim;
  const tint = []; for (let i = 0; i < PETALS; i++) tint.push(0.9 + 0.2 * B.rng());
  return gridSteps(nU, nV, true, (u, v, o, i, j) => {
    const th = u * TAU;
    const s = j <= nMain ? 0.0 + Math.pow(j / nMain, 0.85) : 1 + ((j - nMain) / nRim) * 0.08;
    hornPoint(s, th, P);
    o.p[0] = P.x; o.p[1] = P.y; o.p[2] = P.z;
    const pet = Math.pow(Math.abs(Math.cos(th * PETALS * 0.5)), 0.72);
    const k = Math.floor(((th / TAU) * PETALS + 0.5)) % PETALS;
    const t = Math.min(s, 1), tarnish = 0.72 + 0.28 * t + 0.08 * B.noise.n2(th * 3, s * 7);
    const c = mul(B.brass, tarnish * tint[k]);
    o.c[0] = c[0]; o.c[1] = c[1]; o.c[2] = c[2];
    o.d[0] = 0.13 + 0.05 * (1 - t);                                       // roughness
    o.d[1] = clamp(Math.pow(1 - pet, 2.6) * 0.9 + (s > 1 ? 0.55 : 0) + 0.25 * Math.max(0, B.noise.n2(th * 9, s * 30)), 0, 1);   // wear on ribs and rim
    o.d[2] = t; o.d[3] = 0;
  }, B.tick);                                                             // 17,000 points: a few rows at a time
}

// ---------------------------------------------------------------- geometry: cabinet (mahogany, felt, dark wells)
async function buildCabinetGeometry(B) {
  const parts = [], W = B.wood, n = B.noise;
  const wcol = (k = 1) => (v, th, y) => mul(W, k * (0.88 + 0.16 * n.n2(th * 2.1, y * 0.02)));
  const shadeY = (v, th, y, d) => { d[0] = 0; d[1] = clamp(0.35 + (y - 10) / 70, 0.35, 1) * (y > 199 && y < 214 ? 0.8 : 1); };
  // carcass: deck, cornice, body, plinth as one soft-cornered square lathe (traced from the deck centre down)
  const prof = [[0, 225], [150, 225], [236, 225], [236, 225], [247, 224.4], [253, 221.5], [254, 217], [254, 217], [250, 215.5], [249, 211], [244, 208.5],
    [241, 204], [241, 204], [237, 202.5], [236, 198], [236, 198], [236, 150], [236, 90], [236, 46], [236, 46], [238, 44.5], [243, 39], [246, 33], [246, 33],
    [251, 31.5], [252, 20], [251, 13], [247, 10.5], [247, 10.5], [200, 10], [0, 10]];
  const carcass = await lathe(prof, { seg: 144, sq: 13, color: wcol(1), data: shadeY, tick: B.tick });   // the largest piece here: shaped in steps
  await B.tick();
  parts.push(carcass.rotateY(Math.PI / 4 * 0));
  await B.tick();
  // fluted corner posts with turned capitals and bases
  const post = [[0, 198], [15, 198], [22, 197], [23.5, 194], [23.5, 190], [21, 189], [20, 185], [22.5, 183], [22.5, 181], [19.5, 180], [19, 176],
    [19, 120], [19.4, 70], [19.6, 64], [22.5, 63], [22.5, 60], [20.5, 59], [21.5, 54], [24.5, 52], [25, 47], [25, 46], [0, 46]];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    parts.push(lathe(post, { seg: 28, flutes: { n: 14, depth: 0.13, y0: 64, y1: 176, pow: 1.3 }, color: wcol(0.9), data: shadeY }).translate(sx * 226, 0, sz * 226));
    await B.tick();
    // bun feet
    parts.push(lathe([[0, 12], [26, 12], [31, 10], [33, 6.5], [31, 2.5], [24, 0], [0, 0]], { seg: 20, color: wcol(0.7), data: [0, 0.45, 0, 0] }).translate(sx * 206, 0, sz * 206));
    await B.tick();
  }
  // platter: a turned wooden hub ring hidden under the felt, and the green felt itself with a soft edge
  const felt = B.felt;
  parts.push(lathe([[0, 233.4], [150, 233.4], [152.6, 233.2], [153.6, 232.3], [153.6, 231.2]], { seg: 96,
    color: (v, th) => mul(felt, 0.85 + 0.2 * n.n2(th * 20, v * 9)), data: [1, 1, 0, 0] }));
  await B.tick();
  // the dark well under the governor grille
  parts.push(lathe([[0, 225.4], [25.6, 225.4]], { seg: 24, color: () => [0.05, 0.03, 0.02], data: [2, 0.6, 0, 0] }).translate(B.grille.x, 0, B.grille.z));
  const g = merge(parts);
  return g;
}

// ---------------------------------------------------------------- geometry: fixed brass (bracket, elbow, collars, platter rim, spindle, grille, crank plate)
async function buildBrassGeometry(B) {
  const parts = [], br = B.brass, ni = B.nickel, n = B.noise;
  const bc = (k = 1, c = br) => (v, th, y) => mul(c, k * (0.9 + 0.14 * n.n3(th * 1.7, y * 0.3, k * 7)));
  const D = (rough, wear = 0.1) => [rough, wear, -1, 0];
  // platter rim (nickel) and the spindle
  parts.push(lathe([[153.9, 231.2], [154.6, 230.5], [154.6, 228.6], [153.2, 228], [153.2, 227.3], [149, 226.8], [149, 225]], { seg: 96, color: bc(1, ni), data: D(0.14) }));
  parts.push(lathe([[0, 249.5], [1.6, 249.3], [2.7, 248.4], [3.1, 247], [3.1, 240.2], [5.6, 240.1], [5.9, 239.6]], { seg: 16, color: bc(1.05, ni), data: D(0.08) }));
  await B.tick();
  // back bracket: flanged foot, turned column, boss
  const col = [[0, 46], [11, 46], [14.5, 44.6], [15.6, 41.5], [15.6, 38.5], [13.4, 37.6], [12.6, 34], [12.2, 24], [12.6, 21], [15.4, 20.2], [16, 18], [16, 15.6],
    [13.6, 14.8], [13.2, 11], [14.5, 8.5], [22, 5.4], [29, 4.4], [31, 2.6], [31, 0]];
  parts.push(lathe(col, { seg: 28, color: bc(0.95), data: D(0.16, 0.25) }).translate(0, 225, -215));
  await B.tick();
  for (let i = 0; i < 4; i++) {   // four slotted screws on the flange
    const a = Math.PI / 4 + i * Math.PI / 2;
    parts.push(lathe([[0, 2.1], [2.2, 2], [3.2, 1.2], [3.4, 0]], { seg: 10, color: bc(1.05, ni), data: D(0.2) }).translate(Math.cos(a) * 24.5, 229.4, -215 + Math.sin(a) * 24.5));
  }
  await B.tick();
  // elbow from the bracket to the horn's throat, with a beaded collar on the throat
  const A = THROAT.clone().addScaledVector(AXIS, -9);
  parts.push(tube([A, [0, 277.5, -240], [0, 268.5, -235.5], [0, 262.5, -224], [0, 262, -215]], (t) => 10.4 - 1.2 * Math.sin(t * Math.PI) + (t > 0.97 ? -(t - 0.97) * 120 : 0),
    { along: 30, around: 18, color: (v, a) => mul(br, 0.82 + 0.12 * n.n2(v * 9, a * 2)), data: D(0.17, 0.2) }));
  await B.tick();
  parts.push(place(lathe([[9.3, 7], [11.2, 6.4], [12, 4.5], [12, 2.5], [10.6, 1.8], [10.4, -3], [12.6, -4], [13.4, -6], [12.6, -8], [10.6, -9], [10.4, -13]],
    { seg: 28, color: bc(1), data: D(0.13, 0.3) }), THROAT, AXIS));
  await B.tick();
  // a dark plug just behind the portal seat, so the ring between portal and throat shows only shadow
  parts.push(place(lathe([[0, 0], [9.9, 0]], { seg: 20, color: () => [0.012, 0.007, 0.004], data: [1, 0, -1, 0] }), THROAT.clone().addScaledVector(AXIS, -2.5), AXIS));
  // the collar round the portal: a turned ring that closes the bore between the portal's rim and the flutes, and a
  // dark plug behind it
  parts.push(place(lathe([[SEAT_R + 0.35, -0.6], [SEAT_R + 0.4, 1.3], [SEAT_R + 1.1, 2.5], [SEAT_R + 2.2, 3], [SEAT_R + 3.4, 2.5], [SEAT_R + 4, 1.5], [SEAT_R + 4.6, 1.4], [SEAT_R + 5.6, 2.3], [SEAT_R + 6.6, 2.6], [SEAT_R + 7.6, 2.2], [SEAT_R + 8.4, 1.2], [SEAT_R + 9.9, 0.6]],
    { seg: 80, color: bc(1), data: [0.16, 0.3, -1, -1] }), SEAT, AXIS));
  parts.push(place(lathe([[0, 0], [SEAT_R + 9.5, 0]], { seg: 24, color: () => [0.012, 0.007, 0.004], data: [1, 0, -1, 0] }), SEAT.clone().addScaledVector(AXIS, -2.2), AXIS));
  await B.tick();
  // governor grille on the deck: rim, two rings, six spokes
  const G = B.grille;
  parts.push(lathe([[25, 225.4], [25, 237.6], [25, 237.6], [26.4, 238.8], [29, 239.2], [31, 238.4], [31.8, 236.4], [31.8, 229], [33.4, 228], [34, 226.4], [34, 225]],
    { seg: 32, color: bc(1), data: D(0.15, 0.3) }).translate(G.x, 0, G.z));
  await B.tick();
  for (const rr of [8, 16.5]) parts.push(lathe([[rr - 1.3, 237.8], [rr, 238.7], [rr + 1.3, 237.8]], { seg: 24, color: bc(0.95), data: D(0.18) }).translate(G.x, 0, G.z));
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU, c = Math.cos(a), s = Math.sin(a);
    parts.push(tube([[G.x + c * 2, 238.2, G.z + s * 2], [G.x + c * 12, 238.3, G.z + s * 12], [G.x + c * 25.5, 238.2, G.z + s * 25.5]], () => 1.05, { along: 2, around: 6, color: () => mul(br, 0.9), data: D(0.2) }));
  }
  parts.push(lathe([[0, 240], [2.6, 239.6], [3.6, 238.2]], { seg: 10, color: bc(1.05), data: D(0.12) }).translate(G.x, 0, G.z));
  await B.tick();
  // crank escutcheon on the +X side and a keyhole plate on the front
  parts.push(place(lathe([[0, 3.2], [9, 3.2], [11, 2.6], [12, 1.4], [18, 1.1], [20.5, 0]], { seg: 24, color: bc(1), data: D(0.16, 0.35) }), new THREE.Vector3(236, B.crank.y, B.crank.z), new THREE.Vector3(1, 0, 0)));
  parts.push(place(lathe([[0, 1.6], [5.5, 1.5], [8.5, .9], [9.5, 0]], { seg: 20, sq: 3.2, color: bc(0.95), data: D(0.2, 0.4) }).scale(1, 1, 1.5), new THREE.Vector3(0, 172, 236), new THREE.Vector3(0, 0, 1)));
  await B.tick();
  return merge(parts);
}

// crank: shaft, arm and turned ebony grip, built about its hub on the local X axis (it turns about X)
function buildCrankGeometry(B) {
  const parts = [], br = B.brass, n = B.noise, X = new THREE.Vector3(1, 0, 0), O = new THREE.Vector3();
  const D = (rough, wear = 0.2) => [rough, wear, -1, 0];
  parts.push(place(lathe([[0, 34], [4.4, 33.6], [5.2, 32], [5.2, 4], [7.5, 3], [7.5, 0]], { seg: 14, color: () => mul(br, 0.95), data: D(0.15) }), O, X));
  parts.push(tube([[31, 0, 0], [33, -12, 0], [36, -40, 0], [37, -62, 0]], (t) => 4.6 - 1.2 * Math.sin(t * Math.PI) + (t < 0.04 || t > 0.96 ? -1.5 : 0),
    { along: 14, around: 10, color: (v, a) => mul(br, 0.9 + 0.1 * n.n2(v * 6, a)), data: D(0.16, 0.3) }));
  parts.push(place(lathe([[0, 7], [5.6, 6.4], [6.6, 4], [6.6, -3], [5, -4.4], [0, -4.6]], { seg: 14, color: () => br, data: D(0.14) }), new THREE.Vector3(32, 0, 0), X));
  parts.push(place(lathe([[0, 38], [3.2, 37.6], [5.2, 35.5], [6.4, 30], [5.4, 20], [5, 12], [6.2, 6], [6.6, 3], [5, 1.4], [3.6, 0], [3.4, -4], [6, -5], [6, -7], [0, -7]],
    { seg: 16, color: (v, th, y) => (y > 0.5 ? mul([0.05, 0.03, 0.025], 0.8 + 0.4 * n.n2(th * 3, y)) : br), data: (v, th, y, d) => { d[0] = y > 0.5 ? 0.35 : 0.15; d[1] = 0.1; d[2] = -1; d[3] = 0; } }),
    new THREE.Vector3(39, -62, 0), X));
  return merge(parts);
}

// three governor balls on sprung arms, turning about +Y under the grille
function buildGovernorGeometry(B) {
  const parts = [], br = B.brass;
  parts.push(lathe([[0, 9], [1.8, 8.6], [2.2, 0], [5, -1], [5, -2.4], [0, -2.6]], { seg: 10, color: () => mul(br, 0.8), data: [0.2, 0.2, -1, 0] }));
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * TAU, c = Math.cos(a), s = Math.sin(a);
    parts.push(lathe([[0, 5.2], [2.6, 4.5], [4.5, 2.6], [5.2, 0], [4.5, -2.6], [2.6, -4.5], [0, -5.2]], { seg: 12, color: () => mul(br, 1.05), data: [0.1, 0.1, -1, 0] }).translate(c * 15, 3, s * 15));
    parts.push(tube([[c * 2, 8, s * 2], [c * 9, 6.5, s * 9], [c * 15, 3, s * 15]], () => 0.9, { along: 3, around: 6, color: () => mul(B.nickel, 0.9), data: [0.2, 0, -1, 0] }));
  }
  return merge(parts);
}

// ---------------------------------------------------------------- geometry: tone arm, soundbox and needle (coordinates relative to PIVOT)
const NEEDLE0 = new THREE.Vector3(-82, REC_Y, 0);
const BOX_F = new THREE.Vector3(-0.906, 0, -0.423);                    // the mica faces this way (out and back, toward the arriving eye)
const BOX_T = new THREE.Vector3(-0.423, 0, 0.906);                     // in the diaphragm plane, level
const NEEDLE_U = new THREE.Vector3(-0.2115, 0.866, 0.453).normalize(); // from the tip up the needle (it trails by 30 degrees)
const BOX_C = NEEDLE0.clone().addScaledVector(NEEDLE_U, 32);
async function buildArmGeometry(B) {
  const parts = [], br = B.brass, ni = B.nickel, n = B.noise;
  const L = (v) => v.clone().sub(PIVOT), UP = new THREE.Vector3(0, 1, 0);
  const D = (rough, wear = 0.15) => [rough, wear, -1, 0];
  const bc = (k = 1, c = br) => (v, th, y) => mul(c, k * (0.9 + 0.14 * n.n3(th * 1.9, y * 0.4, k * 5)));
  // swivel collar on the bracket
  parts.push(lathe([[0, 12], [7, 12], [9.6, 10.6], [10.6, 8], [10.6, 2], [12.6, 1], [13.2, -1.5], [12.6, -4], [10.6, -5], [10.6, -9], [9, -10.5]], { seg: 24, color: bc(1), data: D(0.15, 0.3) }));
  await B.tick();
  // the arm: a tapered tube with a ferrule at each end, turning back into the soundbox's neck
  const C = BOX_C, neck = C.clone().addScaledVector(BOX_F, -10.5);
  const pts = [new THREE.Vector3(0, 268, -215), new THREE.Vector3(-3, 270, -198), new THREE.Vector3(-18, 272, -125), new THREE.Vector3(-37, 272.6, -44),
    new THREE.Vector3(-48, 272, 0), new THREE.Vector3(-55.5, 270.6, 20.5), new THREE.Vector3(-66.5, 269, 26.5).lerp(C.clone().addScaledVector(BOX_F, -25), 0.6), neck].map(L);
  parts.push(tube(pts, (t) => 7 - 2.1 * t + (t > 0.9 ? 0.5 * smoothstep(0.9, 0.93, t) : 0) + (t < 0.06 ? 0.8 : 0) + 0.8 * Math.exp(-(((t - 0.13) / 0.006) ** 2)) + 0.7 * Math.exp(-(((t - 0.145) / 0.003) ** 2)) + 0.7 * Math.exp(-(((t - 0.6) / 0.005) ** 2)) + 0.6 * Math.exp(-(((t - 0.86) / 0.005) ** 2)),
    { along: 150, around: 16, color: (v, a) => mul(br, 0.86 + 0.14 * n.n2(v * 22, a * 1.5) + 0.05 * Math.sin(v * 400)), data: D(0.15, 0.22) }));
  await B.tick();
  // soundbox drum, axis along BOX_F: mica face, bezel, knurled rim, back plate and neck
  const micaData = (v, th, y, d) => { d[0] = 0.08; d[2] = -1; d[3] = 0; d[1] = 0.2; };
  parts.push(place(lathe([[11.4, 3.3], [12.2, 4.9], [13.6, 5.5], [15, 4.9], [15.5, 3.6], [15.5, 3.6], [15.5, -3.6], [15.5, -3.6], [15, -4.9], [13.4, -5.5], [12.4, -5.5], [12.4, -6.2], [10.6, -6.2], [10.6, -5.6], [9.2, -5.6], [9.2, -6.4], [7.4, -6.6], [6.4, -7.4], [6.1, -9], [6.6, -9.4], [6.6, -10.2], [5.6, -10.6], [5.6, -11], [0, -11]],
    { seg: 144, flutes: { n: 72, depth: 0.03, y0: -3.61, y1: 3.61, pow: 1 }, color: bc(1), data: micaData }), L(C), BOX_F));
  await B.tick();
  parts.push(place(lathe([[0, 3.1], [1.5, 3.1], [3, 3.1], [4.5, 3.1], [6, 3.1], [7.5, 3.1], [9, 3.1], [10.4, 3.1], [11.5, 3.1]],
    { seg: 60, color: () => [0.6, 0.55, 0.42], data: (v, th, y, d) => { d[0] = 0.06; d[1] = v; d[2] = -1; d[3] = 1; } }), L(C), BOX_F));
  parts.push(place(lathe([[0, 5.2], [1.3, 5], [1.9, 4.2], [2.4, 3.1]], { seg: 12, color: bc(1.1), data: D(0.1) }), L(C), BOX_F));
  await B.tick();
  // stylus bar from the diaphragm's centre down to the chuck, its two pivot screws, the chuck
  const front = (k) => NEEDLE0.clone().addScaledVector(NEEDLE_U, k).addScaledVector(BOX_F, 4.6);
  parts.push(tube([L(C.clone().addScaledVector(BOX_F, 4.9)), L(front(24)), L(front(18)), L(NEEDLE0.clone().addScaledVector(NEEDLE_U, 15.5).addScaledVector(BOX_F, 1.5))],
    (t) => 0.9 + 0.9 * t, { along: 8, around: 8, color: () => mul(ni, 0.9), data: D(0.12) }));
  for (const sgn of [-1, 1]) parts.push(place(lathe([[0, 2.4], [1.7, 2.2], [2, 1.4], [2, 0]], { seg: 10, color: bc(1, ni), data: D(0.15) }),
    L(NEEDLE0.clone().addScaledVector(NEEDLE_U, 17.4).addScaledVector(BOX_T, sgn * 4.4).addScaledVector(BOX_F, 4.2)), BOX_F));
  parts.push(place(lathe([[0, 5.6], [2.7, 5.3], [3.3, 4], [3.3, 0.6], [2.5, -0.4], [1.5, -1]], { seg: 12, sq: 4, color: bc(0.95), data: D(0.16, 0.3) }), L(NEEDLE0.clone().addScaledVector(NEEDLE_U, 13.2)), NEEDLE_U));
  // the steel needle
  parts.push(place(lathe([[0, 14.2], [1.05, 14], [1.05, 5.2], [0.8, 2.6], [0.42, 0.9], [0.1, 0]], { seg: 10, color: (v) => mul(ni, 0.85 + 0.3 * v), data: D(0.07, 0) }), L(NEEDLE0), NEEDLE_U));
  await B.tick();
  // knurled thumbscrews: the needle clamp (pointing back at the rider) and the one on top of the rim
  const knob = (s) => lathe([[0, 8], [3.4, 7.8], [4.2, 7], [4.2, 7], [4.2, 3.8], [4.2, 3.8], [3.2, 3.2], [1.5, 3], [1.3, 0]].map((p) => [p[0] * s, p[1] * s]),
    { seg: 40, flutes: { n: 20, depth: 0.1, y0: 3.79 * s, y1: 7.01 * s, pow: 1 }, color: bc(1.05), data: D(0.14, 0.4) });
  parts.push(place(knob(1), L(NEEDLE0.clone().addScaledVector(NEEDLE_U, 15.4).addScaledVector(BOX_T, -2.6)), BOX_T.clone().multiplyScalar(-1)));
  parts.push(place(knob(1.15), L(C.clone().addScaledVector(UP, 14.6)), UP));
  await B.tick();
  // three small screws round the bezel
  for (let i = 0; i < 3; i++) {
    const a = 0.9 + (i / 3) * TAU;
    parts.push(place(lathe([[0, 0.8], [0.9, 0.75], [1.25, 0.45], [1.35, 0]], { seg: 12, color: bc(1, ni), data: D(0.15) }),
      L(C.clone().addScaledVector(BOX_T, Math.cos(a) * 13.6).addScaledVector(UP, Math.sin(a) * 13.6).addScaledVector(BOX_F, 5.2)), BOX_F));
  }
  await B.tick();
  return merge(parts);
}
// flat fan on the shellac downstream of the needle (the record runs toward -Z there)
function buildWakeGeometry() {
  const L = NEEDLE0.clone().sub(PIVOT);
  return grid(8, 10, false, (u, v, o) => {
    const x = u * 2 - 1, len = 46 * v;
    o.p[0] = L.x + x * (0.6 + 7.5 * v); o.p[1] = L.y + 0.22; o.p[2] = L.z - len;
    o.d[0] = x; o.d[1] = v;
  });
}
// the record: disc, raised rim bead and edge. Local y 0 = playing surface.
function buildRecordGeometry() {
  const prof = [[3.3, 0], [10, 0], [20, 0], [32, 0], [LABEL_R, 0], [54, 0], [62, 0], [72, 0], [82, 0], [92, 0], [102, 0], [112, 0], [122, 0], [132, 0], [140, 0], [146, 0], [148.3, 0],
    [149.1, 0.45], [149.8, 0.3], [150, -0.3], [150, -0.3], [150, -1.6], [149.2, -2.2]];
  const g = lathe(prof, { seg: 160 });
  g.deleteAttribute('color'); g.deleteAttribute('aData');
  return g;
}
function beadGeometry(count, fill) {
  const d = domeGeometry(0.62), g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', d.getAttribute('position')); g.setAttribute('normal', d.getAttribute('normal')); g.setIndex(d.getIndex());
  const a = new Float32Array(count * 4), o = [0, 0, 0, 0];
  for (let i = 0; i < count; i++) { fill(i, o); a[i * 4] = o[0]; a[i * 4 + 1] = o[1]; a[i * 4 + 2] = o[2]; a[i * 4 + 3] = o[3]; }
  g.setAttribute('aBead', new THREE.InstancedBufferAttribute(a, 4));
  g.instanceCount = count;
  return g;
}

// ---------------------------------------------------------------- looks (downpour, sun-shower, blue dusk)
function makeLook(hour, pal) {
  const c = (hex, k = 1) => new THREE.Color(hex).multiplyScalar(k);
  const silver = pal[2], pewter = pal[1], cobalt = pal[4], green = pal[5];
  if (hour === 'golden') return {
    sky: new THREE.Color(1.0, 0.80, 0.56).multiplyScalar(1.05), rift: new THREE.Color(1.0, 0.60, 0.22).multiplyScalar(3.4),
    garden: c(green, 0.5).lerp(new THREE.Color(0.35, 0.25, 0.08), 0.35), roof: new THREE.Color(0.07, 0.04, 0.03), wall: c(pewter, 0.5).lerp(new THREE.Color(0.5, 0.35, 0.2), 0.4),
    dado: c(cobalt, 0.7), cloth: new THREE.Color(0.85, 0.74, 0.58).multiplyScalar(0.62), keyDir: new THREE.Vector3(-0.72, 0.3, 0.62).normalize(),
    keyColor: new THREE.Color(1.0, 0.62, 0.26).multiplyScalar(1.25), ambient: c(pewter, 0.05), spark: new THREE.Color(0.2, 0.12, 0.03) };
  if (hour === 'night' || hour === 'dawn') return {
    sky: new THREE.Color(0.15, 0.26, 0.60), rift: new THREE.Color(1.0, 0.42, 0.30).multiplyScalar(2.1),
    garden: new THREE.Color(0.03, 0.07, 0.09), roof: new THREE.Color(0.022, 0.018, 0.03), wall: c(pewter, 0.2).lerp(c(cobalt, 0.35), 0.5),
    dado: c(cobalt, 0.42), cloth: new THREE.Color(0.30, 0.36, 0.56).multiplyScalar(0.6), keyDir: new THREE.Vector3(0, 0.42, 0.9).normalize(),
    keyColor: new THREE.Color(0.25, 0.35, 0.7).multiplyScalar(0.4), ambient: new THREE.Color(0.03, 0.04, 0.075), spark: new THREE.Color(0.05, 0.22, 0.04) };
  return {
    sky: c(silver, 1.22), rift: new THREE.Color(1.0, 1.0, 0.94).multiplyScalar(2.5), garden: c(green, 0.5).lerp(c(pewter, 0.62), 0.6), roof: new THREE.Color(0.055, 0.036, 0.03),
    wall: c(pewter, 0.5), dado: c(cobalt, 0.85), cloth: c(silver, 0.6), keyDir: new THREE.Vector3(0, 0.45, 0.9).normalize(), keyColor: c(silver, 0.24), ambient: c(pewter, 0.055),
    spark: new THREE.Color(0, 0, 0) };
}

// ---------------------------------------------------------------- the hero
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork('gramophone'), noise = ctx.noise;
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE).slice();
  const detail = ctx.quality?.detail ?? 1;
  const density = opts.density ?? ctx.vary?.density ?? 1;
  const hour = opts.hour ?? ctx.vary?.hour ?? 'day';
  const look = makeLook(hour, pal);
  // per-seed character: label colour, warmth of the lacquer, tone of the mahogany, hand of the warp
  const labelHex = opts.label ?? rng.pick([pal[6], pal[6], pal[6], '#1F6F8B', '#A8842C']);
  const warm = rng.range(0, 1);
  const brass = mixc(lin(pal[3]), [0.96, 0.68, 0.25], 0.46 + 0.12 * warm);
  const B = {
    rng, noise, brass, nickel: [0.74, 0.76, 0.74],
    wood: mul(mixc([0.40, 0.105, 0.05], [0.33, 0.12, 0.07], rng()), rng.range(0.9, 1.15)),
    felt: mul(lin(pal[5]), 1.1), grille: new THREE.Vector3(186, 225, 186), crank: new THREE.Vector3(240, 128, 46),
    tick: () => ctx.yield?.(),                                              // hands the page back between pieces of geometry
  };
  const warpAmp = 3 * rng.range(0.92, 1.08), spin0 = rng.range(0, TAU);

  // shared uniforms: the analytic veranda, in stage space
  const U = {
    uStageInv: { value: new THREE.Matrix3() }, uStagePos: { value: new THREE.Vector3() },
    uSkyCol: { value: look.sky.clone() }, uRiftCol: { value: look.rift.clone() }, uGardenCol: { value: look.garden.clone() }, uRoofCol: { value: look.roof.clone() },
    uWallCol: { value: look.wall.clone() }, uDadoCol: { value: look.dado.clone() }, uClothCol: { value: look.cloth.clone() }, uKeyDir: { value: look.keyDir.clone() },
    uKeyCol: { value: look.keyColor.clone() }, uAmbCol: { value: look.ambient.clone() }, uFlash: { value: 0 }, uTime: { value: 0 },
    uHornAxis: { value: AXIS.clone() }, uSwell: { value: 0 }, uBeadAmt: { value: clamp(0.34 * density, 0.1, 0.6) }, uWarp: { value: warpAmp },
    uThroat: { value: THROAT.clone() }, uHX: { value: HX.clone() }, uHY: { value: HY.clone() }, uFlow: { value: 1 }, uDrip: { value: 0 },
    uSeat: { value: SEAT_T }, uRingK: { value: 1 }, uMirK: { value: 1 },
    uSpark: { value: look.spark.clone() }, uThroatCol: { value: new THREE.Color(1.0, 0.72, 0.36).multiplyScalar(0.8) }, uBandGold: { value: 0.5 },
  };
  const fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
  const FPV = '#include <fog_pars_vertex>', FV = '#include <fog_vertex>';
  const FPF = /* glsl */`
#include <fog_pars_fragment>
float fxFog(){
#ifdef USE_FOG
  #ifdef FOG_EXP2
  return 1. - exp(-fogDensity*fogDensity*vFogDepth*vFogDepth);
  #else
  return smoothstep(fogNear, fogFar, vFogDepth);
  #endif
#else
  return 0.;
#endif
}
vec3 fxApplyFog(vec3 c){
#ifdef USE_FOG
  return mix(c, fogColor, fxFog());
#else
  return c;
#endif
}
vec3 fogColorOr0(){
#ifdef USE_FOG
  return fogColor;
#else
  return vec3(0.);
#endif
}`;
  const mat = (vs, fs, own = {}, extra = {}) => new THREE.ShaderMaterial({ uniforms: { ...fogU(), ...U, ...own }, vertexShader: vs, fragmentShader: fs, fog: true, ...extra });
  const root = new THREE.Group(); root.name = 'gramophone';
  const mats = [];
  const add = (parent, geo, m, name) => { const o = new THREE.Mesh(geo, m); o.name = name; parent.add(o); mats.push(m); return o; };

  // ---- materials
  const BEAD_BLEND = { transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor };
  const brassMat = mat(VERT_STD(FPV, FV), FRAG_BRASS(FPF), {}, { vertexColors: true });
  const hornMat = mat(VERT_STD(FPV, FV), FRAG_BRASS(FPF), {}, { vertexColors: true, side: THREE.DoubleSide });
  const woodMat = mat(VERT_STD(FPV, FV), FRAG_WOOD(FPF), {}, { vertexColors: true });

  // ---- cabinet, fixed brass
  await ctx.yield?.();
  add(root, await buildCabinetGeometry(B), woodMat, 'cabinet');
  await ctx.yield?.();
  add(root, await buildBrassGeometry(B), brassMat, 'brass');
  await ctx.yield?.();

  // ---- horn (its own group so it can tremble)
  const hornGroup = new THREE.Group(); root.add(hornGroup);
  add(hornGroup, await buildHornGeometry(B), hornMat, 'horn');
  await ctx.yield?.();

  // ---- record and its beads
  const labelC = new THREE.Color(labelHex);
  const recUniforms = {
    uShellac: { value: new THREE.Color(pal[0]).multiplyScalar(0.6) }, uLabel: { value: labelC }, uGold: { value: new THREE.Color(brass[0], brass[1], brass[2]) },
    uHornC: { value: new THREE.Vector3(0, 372, -70) }, uHornR: { value: 108 }, uBoxC: { value: BOX_C.clone() }, uBoxR: { value: 14 }, uDust: { value: clamp(density, 0.5, 1.5) },
    uRecToStage: { value: new THREE.Matrix3() }, uMirror: { value: opts.mirror ?? 0.6 }, uDeep: { value: opts.deep ?? 0.22 },
  };
  const record = add(root, buildRecordGeometry(), mat(VERT_RECORD(FPV, FV), FRAG_RECORD(FPF), recUniforms), 'record');
  record.position.y = REC_Y;
  await ctx.yield?.();
  const bRng = rng.fork('beads');
  const nRec = Math.min(1250, Math.max(200, Math.round(1000 * density * detail * (opts.beads ?? 1))));
  const recBeads = beadGeometry(nRec, (i, o) => {
    const onLabel = bRng() < 0.07;
    o[0] = onLabel ? bRng.range(6, LABEL_R - 2) : Math.sqrt(lerp(48 * 48, 148 * 148, bRng()));
    o[1] = bRng() * TAU;
    const k = bRng();
    o[2] = 0.5 + 1.9 * Math.pow(k, 2.4) + (bRng() < 0.03 ? 0.7 : 0);
    o[3] = bRng();
  });
  const recBeadMesh = add(record, recBeads, mat(VERT_BEAD(false, FPV, FV), FRAG_BEAD(FPF), { uUnder: { value: new THREE.Color(0.006, 0.0065, 0.008) }, uGlint: { value: 8 }, uLens: { value: 0.22 }, uBody: { value: 0.55 }, uMirrorB: { value: 0.7 }, uRimA: { value: 0.93 } }, BEAD_BLEND), 'recordBeads');
  recBeadMesh.frustumCulled = false; recBeadMesh.renderOrder = 1;
  await ctx.yield?.();

  // ---- beads creeping on the horn, and drips off the lower lip
  const hRng = rng.fork('hornbeads'), P = new THREE.Vector3();
  const nHorn = Math.min(950, Math.max(150, Math.round(800 * density * detail * (opts.beads ?? 1)))), nDrip = 9;
  const thScript = Math.PI + 0.75;                                  // the lip over open shellac ahead and to the right of the soundbox (x = -98)
  const hornBeads = beadGeometry(nHorn + nDrip + 1, (i, o) => {
    if (i < nHorn) {
      o[0] = lerp(0.08, 1, Math.pow(hRng(), 0.6));
      const seam = (Math.floor(hRng() * PETALS) + 0.5) / PETALS * TAU;
      o[1] = hRng() < 0.55 ? seam + hRng.gauss() * 0.035 : hRng() * TAU;
      const k = hRng();
      o[2] = (0.32 + 1.25 * k * k) * (0.5 + 0.7 * o[0]) * (hRng() < 0.5 ? -1 : 1);
      o[3] = hRng() * 0.999;
    } else {
      const scripted = i === nHorn + nDrip;
      const th = scripted ? thScript : -Math.PI / 2 + hRng.range(-1.05, 1.05);
      hornPoint(1.045, th, P);
      o[0] = P.y - 4.6 - REC_Y - 0.6; o[1] = th; o[2] = scripted ? 2.6 : hRng.range(1.3, 2.1); o[3] = scripted ? 3.5 : 2 + hRng() * 0.99;
    }
  });
  const hornBeadMat = mat(VERT_BEAD(true, FPV, FV), FRAG_BEAD(FPF), { uUnder: { value: new THREE.Color(brass[0], brass[1], brass[2]).multiplyScalar(0.55) }, uGlint: { value: 3.2 }, uLens: { value: 0.1 }, uBody: { value: 0.1 }, uMirrorB: { value: 1.2 }, uRimA: { value: 0.5 } },
    { defines: { HORN: 1 }, side: THREE.DoubleSide, ...BEAD_BLEND });
  const hornBeadMesh = add(hornGroup, hornBeads, hornBeadMat, 'hornBeads');
  hornBeadMesh.frustumCulled = false; hornBeadMesh.renderOrder = 1;
  await ctx.yield?.();

  // ---- tone arm, soundbox, needle and wake (swing about the back bracket)
  const arm = new THREE.Group(); arm.position.copy(PIVOT); arm.rotation.order = 'YXZ'; root.add(arm);
  const armG = await buildArmGeometry(B);
  await ctx.yield?.();
  add(arm, armG, brassMat, 'toneArm');
  const wake = add(arm, buildWakeGeometry(), mat(VERT_STD(FPV, FV), FRAG_WAKE(FPF), {}, { vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }), 'wake');
  wake.renderOrder = 2;
  await ctx.yield?.();

  // ---- crank and governor
  const crank = add(root, buildCrankGeometry(B), brassMat, 'crank'); crank.position.copy(B.crank);
  const governor = add(root, buildGovernorGeometry(B), brassMat, 'governor'); governor.position.set(B.grille.x, 228.2, B.grille.z);
  await ctx.yield?.();

  // ---- lace table top
  if (opts.table !== false) {
    const cloth = lin(pal[2]);
    const tg = lathe([[0, 0], [120, 0], [240, 0], [360, 0], [480, 0], [560, 0], [620, 0], [648, 0], [650, -1.2], [650, -1.2], [650, -9], [646, -16]],
      { seg: 96, color: (v, th) => mul(cloth, 0.8 + 0.05 * noise.n2(th * 3, v * 4)) });
    add(root, tg, mat(VERT_STD(FPV, FV), FRAG_LACE(FPF), {}, { vertexColors: true }), 'lace');
  }
  await ctx.yield?.();

  // ---- needle kinematics: swing the arm about the bracket so the tip sits at radius r from the spindle
  const n0 = NEEDLE0.clone().sub(PIVOT), tip = new THREE.Vector3(), boxNow = new THREE.Vector3();
  const tipAt = (delta, out) => {
    const c = Math.cos(delta), s = Math.sin(delta);
    return out.set(PIVOT.x + n0.x * c + n0.z * s, REC_Y, PIVOT.z - n0.x * s + n0.z * c);
  };
  const swingFor = (r) => {
    let lo = -0.03, hi = 0.14;
    for (let i = 0; i < 22; i++) { const m = (lo + hi) / 2; tipAt(m, tip); if (Math.hypot(tip.x, tip.z) > r) lo = m; else hi = m; }
    return (lo + hi) / 2;
  };
  let needleR = 82, swing = swingFor(82), lastTime = 0, hop = 0;
  const recAngle = (time) => spin0 - SPIN * time;
  const warpAt = (time, r = needleR) => {
    tipAt(swingFor(r), tip);
    const a = recAngle(time), c = Math.cos(a), s = Math.sin(a);
    const xl = tip.x * c - tip.z * s, zl = tip.x * s + tip.z * c;
    return warpJS(Math.hypot(xl, zl), Math.atan2(zl, xl), warpAmp);
  };
  const needleAt = (r, out = new THREE.Vector3()) => tipAt(swingFor(r), out);

  // ---- anchors
  const mouthUp = MOUTH.clone().addScaledVector(HY, 125), lowerLip = MOUTH.clone().addScaledVector(HY, -125);
  const hum = hornPoint(1.0, 0.95, new THREE.Vector3()).addScaledVector(AXIS, 14).add(new THREE.Vector3(8, 6, 0));
  const scriptedLip = hornPoint(1.045, thScript, new THREE.Vector3());
  const anchors = {
    spindle: new THREE.Vector3(0, REC_Y, 0), recordY: REC_Y, recordRadius: REC_R, labelRadius: LABEL_R,
    needle: NEEDLE0.clone(), needleAt, soundbox: BOX_C.clone(), soundboxTop: BOX_C.clone().add(new THREE.Vector3(0, 24, 0)),
    rideEye: new THREE.Vector3(-80, 290, -22), entry: new THREE.Vector3(-84, 268, -156), bracket: new THREE.Vector3(0, 262, -215),
    hornMouth: MOUTH.clone(), hornAxis: AXIS.clone(), hornThroat: THROAT.clone(), hornTop: mouthUp,
    portalSeat: { position: SEAT.clone(), normal: AXIS.clone(), radius: SEAT_R, depth: SEAT_T },
    flyThrough: [MOUTH.clone().addScaledVector(AXIS, 140), MOUTH.clone().addScaledVector(AXIS, 60), MOUTH.clone(), SEAT.clone().addScaledVector(AXIS, 60), SEAT.clone()],
    hummingbird: hum, lowerLip, dripLip: scriptedLip, dripLanding: new THREE.Vector3(scriptedLip.x, REC_Y, scriptedLip.z),
    crank: B.crank.clone(), grille: B.grille.clone().setY(239),
    viewpoints: { hero70: new THREE.Vector3(0, 470, 87), look70: new THREE.Vector3(0, 372, -60), ride: new THREE.Vector3(-80, 290, -22) },
    keepOut: [{ center: new THREE.Vector3(0, 118, 0), radius: 345 }, { center: new THREE.Vector3(0, 385, -75), radius: 135 }, { center: BOX_C.clone(), radius: 20 }],
  };

  // ---- viewer aid: opts.view frames one part in the set-piece viewer (the world never sets it)
  let radius = 345, height = 525, center = new THREE.Vector3(0, 300, -40);
  const view = opts.view;
  if (view === 'ride') { radius = 9; height = 34; center = BOX_C.clone(); }
  else if (view === 'rec') { radius = 26; height = 44; center = new THREE.Vector3(-58, REC_Y, 24); }
  else if (view === 'horn') { radius = 78; height = 110; center = MOUTH.clone().addScaledVector(AXIS, 20); }
  else if (view === 'in') { radius = 20; height = 114; center = THROAT.clone().addScaledVector(AXIS, 62); }
  else if (view === 'cab') { radius = 150; height = 200; center = new THREE.Vector3(120, 215, 120); }

  const m4 = new THREE.Matrix4(), e1 = new THREE.Euler();
  const hero = {
    object: root, radius, height, center, anchors, ground: opts.table === false, groundY: 0, uniforms: U, look,
    setNeedle(r) { needleR = clamp(r, 52, 148); swing = swingFor(needleR); },
    setProgress(u) { hero.setNeedle(82 - 12 * clamp(u, 0, 1)); },
    setFlash(f) { U.uFlash.value = Math.max(0, f); },
    setHop(h) { hop = Math.max(0, h); },
    setDrip(ph) { U.uDrip.value = clamp(ph, 0, 1); },
    // the looping drips keep off a line flown under the lip (points in stage space): a drip whose fall line stands nearer
    // the line than `clear` plus the drop's own length moves along the lower lip by the least turn to a place that clears
    // the line, is not inside another drip (the scripted one among them), is low enough for the drop to reach the record
    // (the fall carries 80 m in a cycle) and is not over the tone arm, the soundbox or the needle anywhere in the needle's
    // travel; it falls there. A drip that found no such place would stay as it was (the lower lip is 235 m across, some
    // 340 m along its rim: none does). The page is handed back before each drip's search
    async clearDrips(line, clear) {
      const at = hornBeads.getAttribute('aBead'), a = at.array, mid = -Math.PI / 2, Q = new THREE.Vector3();
      const off = (th, need) => {
        hornPoint(1.045, th, P);
        for (const q of line) if (q.y < P.y + need && q.y > REC_Y - need && (q.x - P.x) * (q.x - P.x) + (q.z - P.z) * (q.z - P.z) < need * need) return false;
        return true;
      };
      // plan cells of 2 m under the tone arm, the soundbox and the needle, the needle at eight radii 3 m apart, from 82 down to 61
      let cells = null;
      const brass = (r) => {
        if (!cells) {
          cells = new Set(); const ap = armG.getAttribute('position');
          for (let rr = 82; rr >= 61; rr -= 3) { const d = swingFor(rr), c = Math.cos(d), s = Math.sin(d); for (let v = 0; v < ap.count; v++) { const x = ap.getX(v), z = ap.getZ(v), wz = PIVOT.z - x * s + z * c; if (wz > -40) cells.add(Math.round((PIVOT.x + x * c + z * s) / 2) * 4096 + Math.round(wz / 2)); } }
        }
        const n = Math.ceil(r / 2) + 1, ix = Math.round(P.x / 2), iz = Math.round(P.z / 2);
        for (let i = -n; i <= n; i++) for (let j = -n; j <= n; j++) if (cells.has((ix + i) * 4096 + iz + j) && Math.hypot((ix + i) * 2 - P.x, (iz + j) * 2 - P.z) < r + 1.5) return true;
        return false;
      };
      const place = (i, th, need) => {
        if (Math.abs(th - mid) > 1.05 || !off(th, need) || P.y - 4.6 - REC_Y - 0.6 > 80 || brass(a[i * 4 + 2])) return false;
        for (let j = nHorn; j <= nHorn + nDrip; j++) if (j !== i && hornPoint(1.045, a[j * 4 + 1], Q).distanceTo(P) < a[i * 4 + 2] + a[j * 4 + 2]) return false;
        return true;
      };
      for (let i = nHorn; i < nHorn + nDrip; i++) {
        const th0 = a[i * 4 + 1], need = clear + 2 * a[i * 4 + 2];
        if (off(th0, need)) continue;
        await ctx.yield?.();
        for (let d = 0.002; d <= 2.1; d += 0.002) {
          const th = place(i, th0 - d, need) ? th0 - d : place(i, th0 + d, need) ? th0 + d : null;
          if (th === null) continue;
          hornPoint(1.045, th, P); a[i * 4] = P.y - 4.6 - REC_Y - 0.6; a[i * 4 + 1] = th;
          break;
        }
      }
      at.needsUpdate = true;
    },
    setLook(l = {}) {
      const set = (u, v) => { if (v != null) u.value.set(v); };
      set(U.uSkyCol, l.sky); set(U.uRiftCol, l.rift); set(U.uGardenCol, l.garden); set(U.uRoofCol, l.roof); set(U.uWallCol, l.wall); set(U.uDadoCol, l.dado);
      set(U.uClothCol, l.cloth); set(U.uKeyCol, l.keyColor); set(U.uAmbCol, l.ambient); set(U.uSpark, l.spark);
      if (l.keyDir) U.uKeyDir.value.copy(l.keyDir).normalize();
      if (l.rain != null) U.uBeadAmt.value = clamp(0.34 * l.rain, 0, 0.7);
    },
    recordUniforms: recUniforms, beadUniforms: { record: recBeadMesh.material.uniforms, horn: hornBeadMat.uniforms },
    warpAt, needleAt, recordAngle: recAngle, warpAmplitude: warpAmp, labelColor: labelHex, hour,
    // height (m) of the record's surface above recordY at a stage-space point (x, z) right now
    warpAtXZ(time, x, z) { const a = recAngle(time), c = Math.cos(a), sn = Math.sin(a), xl = x * c - z * sn, zl = x * sn + z * c; return warpJS(Math.hypot(xl, zl), Math.atan2(zl, xl), warpAmp); },
    update(dt, time) {
      lastTime = time;
      U.uTime.value = time % 4000;
      root.updateWorldMatrix(true, false);
      U.uStageInv.value.setFromMatrix4(root.matrixWorld).invert();
      U.uStagePos.value.setFromMatrixPosition(root.matrixWorld);
      // the record turns; the warp rides with it
      const a = recAngle(time);
      record.rotation.y = a;
      recUniforms.uRecToStage.value.setFromMatrix4(m4.makeRotationFromEuler(e1.set(0, a, 0)));
      U.uSwell.value = ((time * SPIN * 4) / TAU) % 1;
      // the arm rides the swell and quivers; the soundbox's reflection follows it
      const h = warpAt(time) + hop;
      arm.rotation.y = swing + 0.0006 * Math.sin(time * 61) * Math.sin(time * 7.3);
      arm.rotation.x = -Math.atan2(h, 215) + 0.0004 * Math.sin(time * 47);
      tipAt(swing, tip);
      boxNow.copy(BOX_C).sub(NEEDLE0).applyAxisAngle(_up, swing).add(tip); boxNow.y += h;
      recUniforms.uBoxC.value.copy(boxNow);
      // machinery
      crank.rotation.x = -time * 0.55;
      governor.rotation.y = time * 5.2;
      // the bell trembles with the music
      const tr = Math.sin(time * 33) * Math.sin(time * 5.1 + 1) + 0.5 * Math.sin(time * 71);
      hornGroup.position.set(0.035 * tr, 0.05 * Math.sin(time * 41) * Math.sin(time * 3.3), 0);
      hornGroup.rotation.z = 0.00035 * tr;
    },
    dispose() {},
    stats: { buildMs: 0 },
  };
  hero.update(0, 0);
  return hero;
}

export { grid, lathe, tube, place, merge, lin, mul, mixc, hornPoint, GLSL_ROOM };
