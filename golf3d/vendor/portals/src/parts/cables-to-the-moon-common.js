// CABLES TO THE MOON: what every piece of this world shares.
// One set of uniforms (the sun, the fill, the air, the bend of the forest as we climb), one GLSL chunk (noise, the
// bend, the swells of the roof, the air, the shading of a leaf, ribbons never drawn narrower than 1.6 pixels),
// the frame of the main cable, a small mesh accumulator, and the one way a part takes a stream of chance.
//
// THE CLIMB. The flight really rises about 350 m. To make it feel like leaving the air, the whole forest is
//   y = roof(x, z, t) - drop(x, z),   drop = sink + k r^2 / (1 + sqrt(1 - k^2 r^2)),   r = |xz - Q|
// which is a sphere of radius 1/k whose top is at Q (ahead of the flight) lowered by `sink`. k and sink are smooth
// functions of u set by the world file; with k = 0 and sink = 0 the forest is flat. Every shader that draws
// something standing on the roof subtracts cmDrop(), so nothing swims against anything else.
import * as THREE from 'three';
import { makeRng, hashSeed } from '../kit/core.js';

export const DEG = Math.PI / 180;
// A PART'S STREAM OF CHANCE is handed to it by the world file (its STREAMS). There is no silent fallback: a part
// that is not handed one writes a plain console error, the name goes into shared.missing (the world's fact
// streamsMissing), and the part builds with a stream made from the visit's seed and the stream's own name. (The
// climber alone in its viewer has no world to hand it anything: there, quiet, the same streams from the seed.)
export function cmStream(shared, given, name, ctx, quiet = false) {
  if (given) return given;
  if (!quiet) { console.error('cables-to-the-moon: the stream "' + name + '" was not handed to its part; it is made here from the seed and that name'); if (shared) (shared.missing = shared.missing || []).push(name); }
  return makeRng(hashSeed((shared?.visit ?? ctx?.seed ?? 0) + ':' + name));
}
export const C = (hex, k = 1) => new THREE.Color(hex).multiplyScalar(k);
export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
export const fract = (x) => x - Math.floor(x);

// ---------------------------------------------------------------- the main cable's frame
// P: its root on the anchor peak; d: up the cable (24 degrees); n: its upward normal; X: to the right (or, in a
// mirrored visit, to the left: then every "x beside the cable" in this world is mirrored with it).
// A frame belongs to one visit (two visits can be alive at once), so it is made, never shared between builds.
export const CABLE_L = 700;
// (mend V) CABLE_FALL: the share of the cable's length, from its foot, over which it takes the land's fall (105 m),
// so that its foot stays in the hill as the hill sinks. The one number of it: the frame's fall() and the cable
// hair's program (the web part) read it.
export const CABLE_FALL = 0.15;
// thickness (radius) along it: 14 m thick at the root, 9 m by s 300, 6 m at the ring
export const cableRadius = (s) => (s < 300 ? lerp(7, 4.5, clamp(s / 300, 0, 1)) : lerp(4.5, 3, clamp((s - 300) / 400, 0, 1)));
export const CABLE_D = new THREE.Vector3(0, 0.407, -0.914).normalize(), CABLE_N = new THREE.Vector3(0, 0.914, 0.407).normalize();
export function makeFrame(mx = 1) {
  const _v = new THREE.Vector3();
  const F = {
    mx, P: new THREE.Vector3(0, 95, -400), d: CABLE_D.clone(), X: new THREE.Vector3(mx, 0, 0), n: CABLE_N.clone(), L: CABLE_L, radius: cableRadius,
    at(s, x, m, out = new THREE.Vector3()) { return out.copy(F.P).addScaledVector(F.d, s).addScaledVector(F.X, x).addScaledVector(F.n, m); },
    // the frame as a matrix: local +x = X, +y = n, -z = d (up the cable), origin at s along it
    matrix(s, out = new THREE.Matrix4()) {
      const o = F.at(s, 0, 0, _v);
      return out.set(F.X.x, F.n.x, -F.d.x, o.x, F.X.y, F.n.y, -F.d.y, o.y, F.X.z, F.n.z, -F.d.z, o.z, 0, 0, 0, 1);
    },
    // world -> (s, x, m)
    coords(p, out = new THREE.Vector3()) { _v.copy(p).sub(F.P); return out.set(_v.dot(F.d), _v.dot(F.X), _v.dot(F.n)); },
  };
  // the hub: the ring all the cables are tied into, square to the main cable, which meets its rim at the upper right
  F.hub = { H: F.at(701, -18.4, -13.8), R: 23, r: 2.5, s: 701, x: -18.4, m: -13.8 };
  // (mend V, V1) THE CABLE AS IT IS DRAWN, SAID ONCE: its mesh (the web part) is built from these, and whatever
  // holds the cable (the climber's hands, its new strand's end) stands by these, so hand and rope cannot part.
  //   stations   the metres along it at which its mesh has a ring: from 30 m under its foot every 1.5 m to its
  //              90th metre, then 62 rings to the ring's rim. The mesh is straight between two rings.
  //   fall(s)    the share of the land's fall it takes at s: all of it at the foot and under it, none past
  //              CABLE_FALL of its length.
  //   course(s)  its middle at s before the land falls: above the foot the frame's own line; under the foot it
  //              turns down into the hill.
  //   girth(s)   its radius at s (it thins under the foot).
  //   sunk(s, drop)  the metres its DRAWN middle at s has sunk, straight down: each ring sinks by its own share
  //              of the land's fall at its own place (drop(x, z): the land's fall as the frame has it now; the
  //              sum ROPE_VERT does), and the mesh is straight between two rings. Exactly nought wherever the
  //              two rings about s take none of the fall.
  //   offset(s, drop, out)  where that drawn middle stands from the frame's line at s, in world metres: the sink,
  //              and under the foot the turn down into the hill as well. (The cable's dip under the hands is
  //              not in it: DIP_GLSL adds that, to mesh and hand alike.)
  const ST = []; for (let s = -30; s < 90; s += 1.5) ST.push(s); for (let i = 0; i <= 61; i++) ST.push(lerp(90, CABLE_L, i / 61));
  const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3();
  F.stations = ST;
  F.fall = (s) => 1 - sstep(0, CABLE_FALL, s / CABLE_L);
  F.course = (s, out = new THREE.Vector3()) => { const along = s >= 0 ? s : -8 * (1 - Math.exp(s / 8)); F.at(along, 0, 0, out); if (s < 0) out.y -= along - s; return out; };
  F.girth = (s) => cableRadius(Math.max(s, 0)) * (1 - 0.25 * sstep(0, -30, s));
  // (the two rings about s: the lower one's place in the list, and how far s stands between them)
  const about = (s) => { let lo = 0, hi = ST.length - 2; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (ST[m] <= s) lo = m; else hi = m - 1; } return lo; };
  const between = (s, lo) => clamp((s - ST[lo]) / (ST[lo + 1] - ST[lo]), 0, 1);
  const ringSunk = (i, drop) => { F.course(ST[i], _c); return drop(_c.x, _c.z) * F.fall(ST[i]); };
  F.sunk = (s, drop) => { const lo = about(s); return lerp(ringSunk(lo, drop), ringSunk(lo + 1, drop), between(s, lo)); };
  F.offset = (s, drop, out = new THREE.Vector3()) => {
    out.set(0, -F.sunk(s, drop), 0); if (s >= 0) return out;
    const lo = about(s); F.course(ST[lo], _a).sub(F.at(ST[lo], 0, 0, _c)); F.course(ST[lo + 1], _b).sub(F.at(ST[lo + 1], 0, 0, _c));
    return out.add(_a.lerp(_b, between(s, lo))); };
  return F;
}

// ---------------------------------------------------------------- the roof of the forest (JS mirror of the GLSL below)
export const ROOF_Y = -1.0;                 // mean top of the leaves (the swells reach about 4.5 m above it)
// THE AIR'S NUMBERS (no frame changes them): clear air 0.001 a metre at the leaves, scale height 320 m; the seed
// haze that lies on the roof 0.0012 a metre at the leaves, scale height 55 m
export const AIR_H = 320, AIR_RHO = 0.001, HAZE_H = 55, HAZE_RHO = 0.0012;
// THE LARGE RELIEF of the roof (metres): the forest lies on the land's own long ridges and basins (two swells about
// 1,000 and 800 m long, 5 and 3.5 m high; none within 60 m of our hill's middle), and round our hill, whose roots
// lift the roof, a ridge stands 1.87 of the hill's own radii out (8 m up) with a hollow beyond it 3.02 radii out
// (8 m down): the roots of a wider hill reach farther. k: the visit's hill radius over 112.5 m (the middle of what
// a visit can deal), so with the middle hill they stand 210 and 340 m out. shared.hump() carries the visit's k.
export function relief(x, z, k = 1) {
  const r0 = Math.hypot(x, z + 400), r = r0 / k, ring = sstep(140, 190, r) * (1 - sstep(400, 470, r));
  return sstep(60, 190, r0) * (5.0 * Math.sin(x * 0.0052 + z * 0.0031 + 0.9) + 3.5 * Math.sin(x * -0.0041 + z * 0.0067 + 2.2)) - 8.0 * ring * Math.sin(Math.PI * (r - 275) / 130);
}
export function hump(x, z, t, k = 1) {
  const qx = x + 34 * Math.sin(z * 0.0131 + 1.3), qz = z + 34 * Math.sin(x * 0.0117 + 4.1);
  let h = 2.0 * Math.sin(qx * 0.0171 + qz * 0.0102 + 0.6) + 1.4 * Math.sin(qx * -0.0143 + qz * 0.0297 + 2.9)
    + 1.0 * Math.sin(qx * 0.0431 + qz * -0.0284 + 4.4) + 0.5 * Math.sin(qx * 0.0612 + qz * 0.0571 + 1.1);
  h += 0.7 * Math.sin(x * 0.031 + z * 0.034 - t * 0.55) + 0.4 * Math.sin(x * -0.052 + z * 0.047 - t * 0.8 + 2.0);
  return ROOF_Y + h + relief(x, z, k);
}
// THE CROWNS' OWN SITES. The painted roof is crown beside crown (cmCrown in the GLSL below): one crown to a cell of
// 34 m, each at its own place in its cell, the whole pattern pulled about by up to 10 m. These are the same sums
// in JS, float for float, so that a built crown can stand exactly where the painting has one.
const f32 = Math.fround, fr1 = (x) => x - Math.floor(x);
function jH(x, y) {
  let px = fr1(f32(f32(x) * f32(0.1031))), py = fr1(f32(f32(y) * f32(0.1030)));
  const d = f32(f32(px * f32(py + f32(33.33))) + f32(py * f32(px + f32(33.33)))); px = f32(px + d); py = f32(py + d);
  return fr1(f32(f32(px + py) * px));
}
function jH2(x, y) {
  let qx = fr1(f32(f32(x) * f32(0.1031))), qy = fr1(f32(f32(y) * f32(0.1030))), qz = fr1(f32(f32(x) * f32(0.0973)));
  const d = f32(f32(f32(qx * f32(qy + f32(33.33))) + f32(qy * f32(qz + f32(33.33)))) + f32(qz * f32(qx + f32(33.33)))); qx = f32(qx + d); qy = f32(qy + d); qz = f32(qz + d);
  return [fr1(f32(f32(qx + qy) * qz)), fr1(f32(f32(qx + qz) * qy))];
}
function jN(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y); let fx = x - ix, fy = y - iy; fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
  return lerp(lerp(jH(ix, iy), jH(ix + 1, iy), fx), lerp(jH(ix, iy + 1), jH(ix + 1, iy + 1), fx), fy);
}
// every crown of the pattern whose cell lies in the box x0..x1, z0..z1 (metres): { x, z: its middle in the world;
// id: the pattern's own number for it; r: half the way to the nearest crown beside it (metres: the line between
// two crowns lies there); room: half the mean way to the next three; nx, nz: the nearest neighbour's middle }
export function crownSites(x0, x1, z0, z1) {
  const i0 = Math.floor((x0 - 10) / 34 + 13) - 1, i1 = Math.floor((x1 + 10) / 34 + 13) + 1, j0 = Math.floor((z0 - 10) / 34 + 13) - 1, j1 = Math.floor((z1 + 10) / 34 + 13) + 1;
  const W = i1 - i0 + 3, at = (i, j) => (j - j0 + 1) * W + (i - i0 + 1), all = new Array(W * (j1 - j0 + 3));
  for (let j = j0 - 1; j <= j1 + 1; j++) for (let i = i0 - 1; i <= i1 + 1; i++) {
    const o = jH2(i, j), tx = (i + o[0] - 13) * 34, tz = (j + o[1] - 13) * 34; let x = tx, z = tz;
    // its place in the world: where the pulled-about ground comes to this point of the pattern
    for (let k = 0; k < 10; k++) { const wx = 20 * (jN(x * 0.023, z * 0.023) - 0.5), wz = 20 * (jN(x * 0.023 + 9.3, z * 0.023 + 9.3) - 0.5); x = tx - wx; z = tz - wz; }
    all[at(i, j)] = { x, z, qx: i + o[0], qz: j + o[1], id: jH(i + 7.7, j + 7.7) };   // (qx, qz: its site in the pattern's own cells)
  }
  const out = [];
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
    const s = all[at(i, j)], ds = []; let best = Infinity, nb = null;
    for (let b = -1; b <= 1; b++) for (let a = -1; a <= 1; a++) { if (!a && !b) continue; const q = all[at(i + a, j + b)], d = Math.hypot(q.qx - s.qx, q.qz - s.qz); ds.push(d); if (d < best) { best = d; nb = q; } }
    ds.sort((a, b) => a - b);
    out.push({ x: s.x, z: s.z, id: s.id, qx: s.qx, qz: s.qz, r: 17 * best, room: 17 * (ds[1] + ds[2] + ds[3]) / 3, nx: nb.x, nz: nb.z });
  }
  return out;
}
// THE HEIGHT OF A CROWN'S TOP over the roof's swell, by the pattern's own number for it (the GLSL cmTop is the same
// sum): most crowns low (0 to 6 m, by the square of a number of theirs), one in 25 EMERGENT, 10 to 16 m up. The
// painted roof and the built crowns both take it, so a crown is as tall painted as built.
// THE ONE RULE OF A CROWN'S SIZE (the GLSL cmSize is the same sum; the painted crowns and the built crowns both
// call it): how much of the room the pattern gives it a crown's dome fills, by its own number and its site: 0.72
// to 1.28; a lesser tree 0.62 of that (one in ten), and in DRIFTS (a pattern of the place some 250 m across, read
// at the crown's own site) up to seven in ten are lesser trees, down to 0.48; the one in 25 that stands over the
// rest 1.5. A dome is never wider than its room, so past 1 it only fills its room more squarely.
const jF = (x, y) => 0.55 * jN(x, y) + 0.28 * jN(x * 2.03 + 17.3, y * 2.03 + 17.3) + 0.17 * jN(x * 4.1 + 31.7, y * 4.1 + 31.7);
export function crownSize(id, qx, qz) {
  if (fr1(id * 91.73) < 0.04) return 1.5;
  const drift = sstep(0.5, 0.68, jF(qx * 0.136 + 41, qz * 0.136 + 41));
  return lerp(0.72, 1.28, fr1(id * 17.3)) * (fr1(id * 53.9) < lerp(0.1, 0.7, drift) ? lerp(0.62, 0.48, drift) : 1);
}
export const crownTop = (id) => { const h3 = fr1(id * 13.37); return fr1(id * 91.73) < 0.04 ? 10 + 6 * h3 : 6 * h3 * h3; };
// the painted roof at a point (the GLSL cmRoof: the same sums): the swell, the crown's top on
// it, the gap between crowns 7 m under the swell. k: the visit's hill radius over 112.5 m
export function roofAt(x, z, t = 0, k = 1) {
  const qx = (x + 20 * (jN(x * 0.023, z * 0.023) - 0.5)) / 34 + 13, qz = (z + 20 * (jN(x * 0.023 + 9.3, z * 0.023 + 9.3) - 0.5)) / 34 + 13, nx = Math.floor(qx), nz = Math.floor(qz);
  let d1 = 64, id = 0, sx = 0, sz = 0;
  for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const o = jH2(nx + i, nz + j), rx = nx + i + o[0] - qx, rz = nz + j + o[1] - qz, d = rx * rx + rz * rz; if (d < d1) { d1 = d; id = jH(nx + i + 7.7, nz + j + 7.7); sx = nx + i + o[0]; sz = nz + j + o[1]; } }
  const size = crownSize(id, sx, sz), side = clamp(2.3 * d1 / (size * size), 0, 1);
  return hump(x, z, t, k) + crownTop(id) * (1 - side) - 7 * side;
}
// the anchor peak: the canopy drawn up like cloth under a tent pole. peaks: [{ x, z, h, r, p }]
// (pk.lumps, on the far hills only: shoulders and second humps beside the top, each { x, z in the hill's own radius,
// k of its height, s its spread }: the hill's own form, the same from every place)
export function peakLump(pk, ux, uz) {
  let s = 0; const r01 = Math.hypot(ux, uz);
  for (const L of pk.lumps ?? []) { const dx = ux - L.x, dz = uz - L.z; s += pk.h * L.k * Math.exp(-(dx * dx + dz * dz) / (2 * L.s * L.s)); }
  return s * Math.min(Math.max((1 - r01) / 0.4, 0), 1);
}
export function peakH(pk, x, z) { const r = Math.hypot(x - pk.x, z - pk.z); return r >= pk.r ? 0 : pk.h * Math.pow(1 - r / pk.r, pk.p) + peakLump(pk, (x - pk.x) / pk.r, (z - pk.z) / pk.r); }

// ---------------------------------------------------------------- shared uniforms
export function makeShared(P = {}) {
  const az = (P.sunAz ?? -38) * DEG * (P.mirror ? -1 : 1), el = (P.sunEl ?? 15) * DEG;
  const sunDir = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el));
  const U = {
    uTime: { value: 0 }, uPx: { value: 0.002 },
    uSunDir: { value: sunDir }, uSunCol: { value: C(P.sunCol ?? '#FFE2A6', P.sunI ?? 3.4) },
    // the fill: the sky's and the ground's colour at the roof, and at the ring's rim (B); a point takes the mix
    // for ITS OWN height (cmAmb). uAirK: the roof's level, the air's scale height, 1 - exp(-(rim - roof) / that)
    uHemiSky: { value: C('#E6D69C', 1.2) }, uHemiGnd: { value: C('#2F5E22', 1.2) },
    uHemiSkyB: { value: C('#3A3050', 0.6) }, uHemiGndB: { value: C('#2F5E22', 0.95) }, uAirK: { value: new THREE.Vector4(ROOF_Y, AIR_H, 0.662, 0) },
    // (uFogCol: the sky's own colour at the horizon at the eye's height: the colour the clear air takes round a
    // thing as high as the ring's rim. uLandAir: the colour of the thick air that lies on the land, lit by the
    // sun that stands still (mend S: the world file's AIR_HOLD says its law): the colour the air takes round a
    // thing at the leaves. A thing between takes the mix for its own height (cmAirCol). uHazeCol: the roof's
    // haze and steam, that same air: the world file sets all three each frame)
    uFogCol: { value: C('#E9D796') }, uLandAir: { value: C('#E9D796') }, uHazeCol: { value: C('#F2DC9A') },
    // THE AIR: its density at the roof (clear air, then the seed haze that lies on the roof), the clear air's
    // scale height, and the eye's height over the roof (the one number of it that a frame changes)
    uFog: { value: new THREE.Vector4(AIR_RHO, HAZE_RHO, AIR_H, 16) },
    uRingK: { value: (P.hillR ?? 112.5) / 112.5 },
    uBend: { value: new THREE.Vector4(0, -3600, 0, 0) },                // Q.x, Q.z, k = 1 / radius, sink
    // the anchor hills, for the shade each throws on the roof: (x, z, height, radius); a height of 0 is no hill
    uHills: { value: Array.from({ length: 10 }, () => new THREE.Vector4(0, 0, 0, 1)) },
    uLeafA: { value: C(P.leafA ?? '#5E9B2E') }, uLeafB: { value: C(P.leafB ?? '#3F7F2A') },
    uLeafT: { value: C(P.leafT ?? '#9FD23C') }, uLeafD: { value: C(P.leafD ?? '#173A1C') },
  };
  // the same drop on the CPU (for things placed by JS each frame)
  const drop = (x, z) => { const b = U.uBend.value, qx = x - b.x, qz = z - b.y, r2 = qx * qx + qz * qz, k = b.z; return b.w + k * r2 / (1 + Math.sqrt(Math.max(1 - k * k * r2, 0))); };
  // away: the pass beside the cable lies on the side of it away from the sun's bearing (the body between us and the sun)
  const cable = makeFrame((P.mirror ? -1 : 1) * (P.away ? -1 : 1));
  // the roof's height for THIS visit (its ridge and hollow stand by its own hill's radius)
  const ringK = U.uRingK.value, humpV = (x, z, t = 0) => hump(x, z, t, ringK);
  // (roof: the painted roof itself, crowns and gaps and all: what a thing that stands on the roof stands on)
  return { U, sunDir, drop, cable, hub: cable.hub, hump: humpV, roof: (x, z, t = 0) => roofAt(x, z, t, ringK), ringK };
}
export const withShared = (U, own = {}) => ({ ...U, ...own });

// ---------------------------------------------------------------- GLSL shared by every shader of this world
// the main cable's bark (its strands' own colour): the rope is drawn with it (the web part), and no thread of the
// web is ever brighter than this bark lit full by the sun (cmThreadCap below)
export const ROPE_BARK = '#4E5842';
const ROPE_REF = C(ROPE_BARK, 0.85);
// THE STEAM'S COLOUR IS THE HAZE'S OWN, DIMMED BY THIS (mend S: 0.7; it was 0.46). The steam lies between the far
// wood and the air on the world's edge: at 0.46 it was darker than both wherever the air was not the day's gold
// (a brown band under the edge of the sky, a maroon plain from the height). At 0.7 it is lighter than the lit
// wood's mean at every state of the sky and still under the haze and under white on every channel. Tuned on
// the whole field: the land's lightness by distance, counted in the page on seeds 7, 3 and 2 (the report).
export const STEAM_DIM = 0.7;
export const CM_GLSL = /* glsl */`
uniform float uTime, uPx;
uniform vec3 uSunDir, uSunCol, uHemiSky, uHemiGnd, uHemiSkyB, uHemiGndB, uFogCol, uLandAir, uHazeCol, uLeafA, uLeafB, uLeafT, uLeafD;
uniform vec4 uFog, uBend, uAirK;
uniform vec4 uHills[10];
uniform float uRingK;
float cmH(vec2 p){ p = fract(p*vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y)*p.x); }
vec2 cmH2(vec2 p){ vec3 q = fract(vec3(p.xyx)*vec3(0.1031, 0.1030, 0.0973)); q += dot(q, q.yzx + 33.33); return fract((q.xx + q.yz)*q.zy); }
float cmH3(vec3 p){ p = fract(p*0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y)*p.z); }
float cmN(vec2 p){
  vec2 i = floor(p), f = fract(p); f = f*f*(3.0 - 2.0*f);
  return mix(mix(cmH(i), cmH(i + vec2(1.,0.)), f.x), mix(cmH(i + vec2(0.,1.)), cmH(i + vec2(1.,1.)), f.x), f.y);
}
float cmN3(vec3 p){
  vec3 i = floor(p), f = fract(p); f = f*f*(3.0 - 2.0*f);
  float a = mix(mix(cmH3(i), cmH3(i + vec3(1.,0.,0.)), f.x), mix(cmH3(i + vec3(0.,1.,0.)), cmH3(i + vec3(1.,1.,0.)), f.x), f.y);
  float b = mix(mix(cmH3(i + vec3(0.,0.,1.)), cmH3(i + vec3(1.,0.,1.)), f.x), mix(cmH3(i + vec3(0.,1.,1.)), cmH3(i + vec3(1.,1.,1.)), f.x), f.y);
  return mix(a, b, f.z);
}
float cmF(vec2 p){ return 0.55*cmN(p) + 0.28*cmN(p*2.03 + 17.3) + 0.17*cmN(p*4.1 + 31.7); }
float cmF3(vec3 p){ return 0.55*cmN3(p) + 0.28*cmN3(p*2.03 + 17.3) + 0.17*cmN3(p*4.1 + 31.7); }
// how far the forest has fallen away under the point (x, z): see the head of the common file
float cmDrop(vec2 xz){ vec2 q = xz - uBend.xy; float r2 = dot(q, q), k = uBend.z; return uBend.w + k*r2/(1.0 + sqrt(max(1.0 - k*k*r2, 0.0))); }
// the large relief of the roof (the JS function relief() is the same sum)
float cmRelief(vec2 p){
  float r0 = length(p - vec2(0.0, -400.0)), r = r0/max(uRingK, 0.5), ring = smoothstep(140.0, 190.0, r)*(1.0 - smoothstep(400.0, 470.0, r));
  return smoothstep(60.0, 190.0, r0)*(5.0*sin(dot(p, vec2(0.0052, 0.0031)) + 0.9) + 3.5*sin(dot(p, vec2(-0.0041, 0.0067)) + 2.2)) - 8.0*ring*sin(3.14159265*(r - 275.0)/130.0);
}
// the swells of the roof (the JS function hump() is the same sum)
float cmHump(vec2 p, float t){
  vec2 q = p + 34.0*vec2(sin(p.y*0.0131 + 1.3), sin(p.x*0.0117 + 4.1));
  float h = 2.0*sin(dot(q, vec2(0.0171, 0.0102)) + 0.6) + 1.4*sin(dot(q, vec2(-0.0143, 0.0297)) + 2.9)
          + 1.0*sin(dot(q, vec2(0.0431, -0.0284)) + 4.4) + 0.5*sin(dot(q, vec2(0.0612, 0.0571)) + 1.1);
  h += 0.7*sin(dot(p, vec2(0.031, 0.034)) - t*0.55) + 0.4*sin(dot(p, vec2(-0.052, 0.047)) - t*0.8 + 2.0);
  return ${ROOF_Y.toFixed(1)} + h + cmRelief(p);
}
// THE CROWNS. The roof is crown beside crown, about 34 m across, never in rows. x = distance to the nearest
// crown's middle (in crowns), y = how much nearer it is than the next one (0 on the line between two crowns),
// zw = the way to that middle (in crowns); id: that crown's own number
// (sq: that crown's site in the pattern's own cells, the same all over the crown)
vec4 cmCrownQ(vec2 p, out float id, out vec2 sq){
  vec2 q = (p + 20.0*vec2(cmN(p*0.023) - 0.5, cmN(p*0.023 + 9.3) - 0.5))/34.0 + 13.0;
  vec2 n = floor(q), f = fract(q); float d1 = 8.0, d2 = 8.0; vec2 r1 = vec2(0.0); id = 0.0; sq = n;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 g = vec2(float(i), float(j)), o = cmH2(n + g), r = g + o - f; float d = dot(r, r);
    if (d < d1) { d2 = d1; d1 = d; r1 = r; id = cmH(n + g + 7.7); sq = n + g + o; } else if (d < d2) d2 = d;
  }
  return vec4(sqrt(d1), sqrt(d2) - sqrt(d1), r1);
}
vec4 cmCrown(vec2 p, out float id){ vec2 sq; return cmCrownQ(p, id, sq); }
// THE ONE RULE OF A CROWN'S SIZE (the JS crownSize is the same sum): see there
float cmSize(float id, vec2 sq){
  if (fract(id*91.73) < 0.04) return 1.5;
  float drift = smoothstep(0.5, 0.68, cmF(sq*0.136 + 41.0));
  return mix(0.72, 1.28, fract(id*17.3))*(fract(id*53.9) < mix(0.1, 0.7, drift) ? mix(0.62, 0.48, drift) : 1.0);
}
// how far down a crown's side a point lies, 0 on its top .. 1 in the dark between crowns
float cmSide(float f1){ return clamp(2.3*f1*f1, 0.0, 1.0); }
// how high a crown's top stands over the swell (m), by its own number: most low, one in 25 emergent (the JS
// crownTop is the same sum)
float cmTop(float id){ float h3 = fract(id*13.37); return fract(id*91.73) < 0.04 ? 10.0 + 6.0*h3 : 6.0*h3*h3; }
// the roof itself: the swells, each crown's top standing its own height on them, the gaps between crowns 7 m
// under the swell: THE SAME AT EVERY DISTANCE. Everything that stands on the roof stands on this, so its height
// reads no eye. cmCrownH is the crowns' relief alone (its mean over the roof is -2.7 m, measured over 641,160 points of 36 km2); only the painted sheet
// flattens it, in its own vertex shader, where its own mesh is too coarse to carry a crown (the forest part).
// (mend P, H3: THE RELIEF CALLS THE ONE RULE OF SIZE: a lesser crown's dome is as small in the relief as it is
// painted and built; the JS roofAt is the same sum)
float cmCrownH(vec2 p){ float id; vec2 sq; vec4 c = cmCrownQ(p, id, sq); float s = cmSide(c.x/cmSize(id, sq)); return cmTop(id)*(1.0 - s) - 7.0*s; }
float cmRoof(vec2 p, float t){ return cmHump(p, t) + cmCrownH(p); }
// gusts running over the leaves: 0..1, bands about 60 m wide moving with the wind
float cmGust(vec2 p, float t){ float g = cmN(p*0.021 + vec2(t*0.21, -t*0.13)); return smoothstep(0.42, 0.85, g); }
// how far the air has thinned at the height y (0 at the roof .. 1 at the ring's rim): the world file's thinning()
float cmThin(float y){ return clamp((1.0 - exp(-max(y - uAirK.x, 0.0)/max(uAirK.y, 1.0)))/max(uAirK.z, 1e-3), 0.0, 1.0); }
// THE FILL a point gets is the sky's colour at THAT POINT's own height (y: its height in the world)
vec3 cmAmbAt(vec3 n, float y){ float a = cmThin(y); return mix(mix(uHemiGnd, uHemiGndB, a), mix(uHemiSky, uHemiSkyB, a), 0.5 + 0.5*n.y); }
// (every fragment shader of this world carries its point's place in the world as vW). THE LAND'S SINK IS NOT A
// HEIGHT: a thing that stands on the roof takes the fill for the height it had before the land sank under it.
// Its shader says so before this chunk: CM_FOLLOW 1.0, or the share of the land's fall its point takes.
#ifndef CM_FOLLOW
#define CM_FOLLOW 0.0
#endif
#define cmAmb(n) cmAmbAt(n, vW.y + (CM_FOLLOW)*cmDrop(vW.xz))
// (mend T, T3) THE SUN LIGHTS WHAT STANDS BEFORE IT, AND HARDER WITH HEIGHT. ONE LAW OF THE LIGHT, declared here,
// for everything that stands or flies in the air (the cables, the ring, the climbers, their limbs, pods and
// hair, the threads' cap, the fliers): by the SUN'S DIRECTION and by THE THING'S OWN HEIGHT over the leaves
// (cmThin: the air's one thinning, 0 at the leaves, 1 at the height of the ring's rim and above). It reads no
// eye. (The wood's leaves stand at the leaves' level: their light is the leaf's own, cmLeaf.)
//   cmSunAt    the sun on a lit face: its own colour and strength at the leaves; at the rim and above 1.5 of
//              it on red, 1.36 on green, 1.12 on blue (1.39 times as light, and warmer): the raw sun, with no
//              air before it.
//   cmLitAt    how much of it a face takes whose normal makes ndl with the sun's direction: low in the air
//              the soft wrap it always had (((ndl + 0.3) / 1.3) squared: the air's own scatter lights a face
//              turned a little from the sun); as the air thins the wrap narrows, to ((ndl + 0.16) / 1.16)
//              squared: the line between the lit side and the shaded side is sharper.
//   cmBounceAt the forest's green light from below on the shaded side: whole at the leaves, 0.75 of it at
//              the rim and above (0.35 and a wrap of 0.08 were tried first: the climber's under side, seen
//              from the road below it, went to a black shape). The fill (cmAmb) goes to the sky's own dark there, as it did: so a shaded
//              side high up goes toward the dark of the sky, with the roof's green still in it: never black.
#define CM_SUN_RAW vec3(1.5, 1.36, 1.12)
vec3 cmSunAt(float h){ return uSunCol*mix(vec3(1.0), CM_SUN_RAW, cmThin(h)); }
float cmLitAt(float ndl, float h){ float w = mix(0.3, 0.16, cmThin(h)), d = clamp((ndl + w)/(1.0 + w), 0.0, 1.0); return d*d; }
float cmBounceAt(float h){ return mix(1.0, 0.75, cmThin(h)); }
#define cmSunL cmSunAt(vW.y + (CM_FOLLOW)*cmDrop(vW.xz))
#define cmLitL(ndl) cmLitAt(ndl, vW.y + (CM_FOLLOW)*cmDrop(vW.xz))
#define cmBounceL cmBounceAt(vW.y + (CM_FOLLOW)*cmDrop(vW.xz))
// (mend T, T3) HIGH UP A SHADED SIDE GOES TOWARD THE DARK OF THE SKY, NEVER A FLAT BLACK BAR. Low down the air
// that stands before a thing lifts its dark (cmAir); above the air nothing does, and a rope's dark bark in
// shade fell under the picture's own black (the engine's grade shows a linear 0.045 and all under it as
// black): a flat black bar on the sky. So a shaded side is never drawn darker than CM_DEEP, a dark ash
// violet (the sky's own dark seen in a bark's shade: under the sky's colour there on every channel), by
// the share of the air UNDER THE THING (cmThin of its own height: nothing of it at the leaves, all of it
// at the ring's rim), and by the thing's own form (its grooves' and yarns' openness: the caller's), coming
// down to that floor smoothly, as the leaf's does (the forest part's cnDeep). CM_DEEP was set on the whole
// field by the grade's black: at the rim the floor shows as 6 to 35 of 255 (a first trial, 0.066, 0.06, 0.08,
// showed as 50 to 60: the ring's ropes went steel blue).
#define CM_DEEP vec3(0.057, 0.055, 0.061)
vec3 cmDeepAt(vec3 col, float h, float form){
  vec3 f = max(CM_DEEP*(cmThin(h)*form), vec3(1e-5)), x = 8.0*(col - f)/f;
  return f + 0.125*f*mix(log(1.0 + exp(min(x, vec3(20.0)))), x, step(vec3(20.0), x));
}
#define cmDeepL(col, form) cmDeepAt(col, vW.y + (CM_FOLLOW)*cmDrop(vW.xz), form)
// THE LIGHT OF A THREAD OF THE WEB (mend R, V1: one law, declared here, for the web's strands and for the new
// strand the climber pays out). Nothing of a thread shines of itself. h: the thread's own height over the
// leaves' level under it.
//   cmThreadDull  what it has without the sun: half the fill from below at its height and a little of its own
//                 pale green (the sky's light and the roof's: all a thread has in the night).
//   cmThreadSun   how much of the sun it can catch, as a brightness (never the sun's colour: what it catches
//                 it gives back in its own pale green-silver): 0.3 of the sun's, times the thick air's share
//                 at its height (cmThin, the fill's own measure: whole at the leaves, nothing at the height of
//                 the ring's rim).
//   cmThreadCap   A THREAD IS NEVER BRIGHTER THAN THE LIT ROPE BESIDE IT: its colour is held under the
//                 brightness of the main cable's bark lit full by the same sun (the rope's own sum: 0.72 of
//                 three quarters of the sun, the fill at the thread's height and the roof's light from
//                 below). A glint or a bead is a paler run on the strand; no strand is a bright wire.
vec3 cmThreadDull(float h){ return (cmAmbAt(vec3(0.0, -0.4, 0.0), h) + vec3(0.10, 0.12, 0.06))*0.5; }
float cmThreadSun(float h){ return dot(uSunCol, vec3(0.3, 0.5, 0.2))*0.3*(1.0 - cmThin(h)); }
vec3 cmThreadCap(vec3 col, float h){
  vec3 ropeLit = vec3(${ROPE_REF.r.toFixed(4)}, ${ROPE_REF.g.toFixed(4)}, ${ROPE_REF.b.toFixed(4)})*0.72*(cmSunAt(h)*0.75 + cmAmbAt(vec3(0.0, 0.0, 1.0), h)*0.6 + cmBounceAt(h)*vec3(0.42, 0.47, 0.3)*dot(uSunCol, vec3(0.33))*0.48);
  return col*min(1.0, dot(ropeLit, vec3(0.3, 0.5, 0.2))/max(dot(col, vec3(0.3, 0.5, 0.2)), 1e-4));
}
// THE PIXEL'S FOOTPRINT (antialiasing; declared once, here, for every part of this world): the metres of a
// thing's own surface that one pixel covers, from the screen derivatives of the thing's own place (fragment
// shaders only). A pattern smaller than a few pixels goes to its mean by this and by nothing else (a painted
// crown's round: to the mean of what the ray sees of it, see WHICH REACH below): no tone,
// shade, relief or presence of any thing goes by metres from the eye. What does read the eye's place: the air
// along the ray (cmAir, cmHaze below: fog), the sky's far plane, and a thread or far rope
// never drawn narrower than 1.6 pixels (0.8 of a pixel to each side of its middle); a thread is dimmed by as much as it is widened (a web strand by the power 1.5 of that, its beads by that itself: the web part),
// a rope is not: it stays solid (cmRibbon, the web part's rope: vertex shaders, the eye's depth times the pixel's angle).
// WHICH REACH (mend R: said once, here, as it is). A pixel covers a patch of a surface with two reaches, one
// along the screen's x and one along its y; seen edge-on the two differ many times over.
//   cmPx     THE MEAN OF THE TWO (the root of their product): the limbs, the pods, the ropes, the boughs, the
//            leaves and the fliers go by it.
//   cmPxMax  THE LARGER OF THE TWO: the hero's hide (and the second's) goes by it, and the roof's sheet goes by
//            its own larger reach on the map (the forest part's fw, widened by the same ratio): on a surface
//            that turns edge-on to the eye no pattern is left hard along the short reach.
//   and THE CROWNS PAINTED ON THE ROOF ARE RELIEF DRAWN BY THE RAY (mend T; the forest part, SHEET_FRAG): a
//   crown's round goes by THE PIXEL'S REACH ON THAT RELIEF, fr = 1/(1/fw + 0.12/fs) (fw, fs: the sheet's
//   larger and smaller reach on the map; a crown's cap stands 0.12 of its width over the crown before it,
//   and the cap is what a flat ray sees of it): whole while fr is under 0.4 of 34 m and at its mean past 0.8
//   of it: crisp while a crown is more than two and a half pixels across, at its mean under one and a
//   quarter. (Mend R faded the round by the smaller reach alone, whole only past 34 pixels: gone.) It is a
//   footprint fade to the MEAN; a picture three times as high keeps the rounds three times as far.
//   THE MEAN OF A CROWN'S ROUND IS THE MEAN OF WHAT THE RAY SEES OF IT, LIGHT AS WELL AS SHADE (the forest
//   part's cnMean, declared once there and counted: seven faces of a dome under the leaf's own light, each
//   side with the whole round's turn-to-the-sun factor and the mean of its lit-through edge; the grain's
//   light goes to its mean over its own spread of tilts the same way: cnLeafG). Mend S2's two numbers
//   (CN_MEAN, CN_MEAN_TOPS) gave back the shade alone: gone.
//   (mend S) On the roof's sheet the land's larger patterns go to their means by the sheet's larger reach
//   too: the swells' light and shade (150 m), the ranks (520 m), the long valleys (600 m): each whole while
//   the reach is under a quarter of its size and at its mean past 0.8 of it. A fade to the MEAN, by the
//   footprint: never a reach round the eye.
#define cmPx(w) sqrt(max(length(dFdx(w)), 1e-5)*max(length(dFdy(w)), 1e-5))
#define cmPxMax(w) max(length(dFdx(w)), length(dFdy(w)))
// THE AIR HAS THREE LAWS, all by the ray from the eye to a thing (fog): the clear air (cmAir), the seed haze
// (the first lines of cmHaze) and the steam's far-air line (the lines marked AIR in cmHaze; stated at cmSteam
// below; its last line loses the far land in the sky's own colour, so the land has no edge). The first two are two things in one air, each a function of a POINT's own height with one constant at the roof that no frame
// changes: clear air (uFog.x a metre at the leaves, thinning by e every uFog.z = 320 m) and the gold seed haze
// that lies on the roof (uFog.y a metre at the leaves, thinning by e every ${HAZE_H.toFixed(1)} m). What dims a thing is the
// air along the ray from the eye to it. Things in the sky are dimmed by the clear air (the density at the middle
// height of the ray, times its length); things standing on the roof by the haze (its density summed exactly
// along the ray: seen from high over it the ray crosses the layer steeply and the land shows; seen from within
// it the far roof is lost).
// (mend S) THE COLOUR THE AIR TAKES ROUND A THING IS THE AIR'S AT THE THING'S OWN HEIGHT (y: its height in the
// world before the land's sink): the lit air of the land at the leaves (uLandAir), the sky's own colour at the
// horizon as the eye has it (uFogCol) at the height of the ring's rim, by the air's one thinning between. THE
// LAND STANDS IN FULL DAY AT EVERY HEIGHT OF THE EYE: the sun stands still; the sky darkens because we climb
// out of the air, and the air that lies on the land below us is as lit as it was.
vec3 cmAirCol(float y){ return mix(uLandAir, uFogCol, cmThin(y)); }
vec3 cmAir(vec3 col, vec3 p){
  float dist = length(p - cameraPosition);
  float hm = max(0.5*(p.y + cmDrop(p.xz) + uFog.w), 0.0);
  float x = uFog.x*dist*exp(-hm/max(uFog.z, 1.0));
  return mix(col, cmAirCol(p.y + cmDrop(p.xz)), 1.0 - exp(-x*x));
}
// THE STEAM OF THE HOT FOREST, the same thing at every height: banks of steam lying on the roof, with gaps,
// the hills and the high crowns standing out of them. cmSteam(p): how much steam lies where a thing stands, a
// pattern of the PLACE (banks about a kilometre across, 0.2 in a gap to 0.7 in a bank), thinning upward from
// 25 m over the roof by e every 60 m, so a hill's top stands clear of it. Its colour is a warm pale gold, 0.7
// of the haze's own (STEAM_DIM; 0.81 toward the sun at the most: under white on every channel); toward the sun's bearing it is a
// sixth brighter at the most. THE AIR'S OWN LAW BY THE RAY (fog; the lines marked AIR below): a far thing takes
// the steam's colour by the clear air's density, its mean along the ray, coming on softly (CM_SOFT, below: no
// ring where it begins); and never more of it than the steam that lies where the thing stands
// (the cap: many thin layers along a long look never add up to more than that). AND THE LAND HAS NO EDGE: past
// the banks the same air, by the same measure along the ray a quarter longer, takes every thing on the roof
// wholly into the colour of the land's own lit air (cmAirCol at the thing's height: for the land, uLandAir): the
// forest runs out as crowns, paler with distance. HOW FAR THE LAW REACHES (the land's share of that colour):
// seen from the roof a tenth at 0.7 km, half at 1.8 km, 0.99 of it by 4.5 km; seen from the road's end,
// by the ring (the eye 539 m over the roof AS IT HAS SUNK there; made true in mend V: this note named the
// eye 518 m over the roof, which these reaches are not for) a tenth at 1.2 km, half at 3.4 km,
// 0.99 of it by 8.9 km. All of it lies within the land's own mesh
// (12 km: the forest part's makeCanopy) and before the world's limb, and the sky part paints that same
// colour on the limb and under it: no line, no rim, no bare band.
float cmSteam(vec3 p){
  // (the banks drift down the wind, 7 m a second, and are torn: a finer pattern drawn out along the wind)
  vec2 q = p.xz - uTime*vec2(7.0, 2.2);
  float bank = smoothstep(0.3, 0.62, 0.7*cmF(q*0.00045 + 13.0) + 0.3*cmF(vec2(q.x*0.0011 + q.y*0.0003, q.y*0.0031 - q.x*0.0009) + 5.0));
  return mix(0.2, 0.7, bank)*exp(-max(p.y + cmDrop(p.xz) - 25.0, 0.0)/60.0);
}
vec3 cmSteamCol(vec2 rd){
  float sunA = 0.5 + 0.5*dot(rd, uSunDir.xz/max(length(uSunDir.xz), 1e-4));
  return uHazeCol*${STEAM_DIM.toFixed(2)}*(1.0 + 0.16*sunA*sunA*sunA);
}
// (mend T, T1 d) CM_SOFT: THE FAR AIR COMES ON SOFTLY. Its share was 1 - exp(-x^5) of the air's measure x along
// the ray: nothing, and then all of it within a doubling of the distance: seen from the height the green
// land ended at a ring round the place under the eye, a disc with a rim, and from low down at a straight
// pale edge. It is 1 - exp(-(x / CM_SOFT)^2) now: HALF AT THE SAME DISTANCE AS BEFORE (CM_SOFT 1.117: the
// fifth root of ln 2 over its square root), a tenth of it at 0.39 of that distance and 0.99 of it at 2.6
// times it. One number for the steam's line and the air's; the air's measure and its colours are mend S's.
#define CM_SOFT 1.117
vec3 cmHaze(vec3 col, vec3 p, float k){
  float dist = length(p - cameraPosition);
  float hp = max(p.y + cmDrop(p.xz), 0.0)/${HAZE_H.toFixed(1)}, he = max(uFog.w, 0.0)/${HAZE_H.toFixed(1)}, dh = he - hp;
  float F = abs(dh) > 1e-3 ? (exp(-hp) - exp(-he))/dh : exp(-hp);
  float x = uFog.y*dist*k*clamp(F, 0.0, 1.0);
  col = mix(col, uHazeCol, 1.0 - exp(-x*x));
  float ap = max(p.y + cmDrop(p.xz), 0.0)/max(uFog.z, 1.0), ae = max(uFog.w, 0.0)/max(uFog.z, 1.0), da = ae - ap;
  float Fa = abs(da) > 1e-3 ? (exp(-ap) - exp(-ae))/da : exp(-ap);
  float xa = 0.7*uFog.x*dist*clamp(Fa, 0.0, 1.0)/CM_SOFT;                                         // AIR
  vec2 rd = (p.xz - cameraPosition.xz)/max(length(p.xz - cameraPosition.xz), 1e-3);            // AIR (the ray's bearing)
  col = mix(col, cmSteamCol(rd), (1.0 - exp(-xa*xa))*cmSteam(p));                               // AIR, capped by the steam of the place
  float xb = xa/1.25;                                                                             // AIR
  return mix(col, cmAirCol(p.y + cmDrop(p.xz)), 1.0 - exp(-xb*xb));                               // AIR: the far land is lost in the land's own lit air
}
// THE SHADE OF THE HILLS on the roof (a rule of the place: the sun stands 15 degrees up on the visit's bearing).
// A hill h high and r wide with a hollow flank throws a wedge away from the sun, h/tan(15 deg) long from its
// middle, as wide at a metres from the middle as the hill is at the height the sun's ray has there.
float cmHillShade(vec2 p){
  vec2 sx = uSunDir.xz/max(length(uSunDir.xz), 1e-4); float sh = 0.0;
  for (int i = 0; i < 10; i++) {
    vec4 hl = uHills[i]; if (hl.z < 1.0) continue;
    vec2 q = p - hl.xy; float a = -dot(q, sx), c = abs(q.x*sx.y - q.y*sx.x), Ls = 3.73*hl.z;
    if (a <= 0.0 || a >= Ls || c >= hl.w) continue;
    float w = hl.w*(1.0 - sqrt(clamp(a/Ls, 0.0, 1.0)));
    sh = max(sh, (1.0 - smoothstep(0.55*w, w + 4.0, c))*smoothstep(0.0, 0.25*hl.w, a)*(1.0 - smoothstep(0.75*Ls, Ls, a)));
  }
  return sh;
}
// A LEAF. n: its upper normal, v: unit vector to the eye, tone 0..1, thin 0..1 (how much light comes through),
// ao 1 open .. 0 buried, wax: strength of the sheen. Lit faces are green, faces the sun is behind are stained glass.
vec3 cmLeaf(vec3 n, vec3 v, float tone, float thin, float ao, float wax){
  vec3 nf = dot(n, v) < 0.0 ? -n : n;
  float ndl = dot(nf, uSunDir);
  vec3 alb = mix(uLeafA, uLeafB, tone);
  // the forest stands in its own thick bright air however high we are, and a leaf throws back green before gold:
  // its fill is the forest's daylight, and the sun on it is half the sun's colour, half its brightness in leaf green
  vec3 sunL = mix(uSunCol, dot(uSunCol, vec3(0.3, 0.5, 0.2))*vec3(0.86, 1.0, 0.58), 0.5);
  vec3 fill = mix(vec3(0.035, 0.14, 0.02), vec3(0.86, 0.78, 0.42), 0.5 + 0.5*nf.y);
  vec3 col = mix(uLeafD*1.6, alb, 0.25 + 0.75*ao)*(sunL*max(ndl, 0.0)*0.42 + fill*0.62)*(0.35 + 0.65*ao);
  float toward = clamp(dot(-v, uSunDir), 0.0, 1.0);
  float thr = thin*clamp(0.2 - ndl*2.2, 0.0, 1.0)*(0.22 + 0.78*toward*toward);
  col += uLeafT*uSunCol*thr*0.34*(0.4 + 0.6*ao);
  vec3 h = uSunDir + v; h /= max(length(h), 1e-3);
  float sp = pow(clamp(dot(nf, h), 0.0, 1.0), 110.0)*smoothstep(0.0, 0.08, ndl);
  col += uSunCol*sp*wax*0.2;
  return col;
}
`;
// vertex-shader only: a ribbon that faces the eye and is
// never drawn narrower than 1.6 pixels (0.8 of a pixel to each side of its middle) and dimmed by as much as it is widened.
// c: centre (world), t: tangent (world), side: -1 / +1, w: half width in metres; k: true width / drawn width
export const CM_RIBBON = /* glsl */`
vec4 cmRibbon(vec3 c, vec3 t, float side, float w, out float k){
  vec4 mv = viewMatrix*vec4(c, 1.0);
  vec3 tv = mat3(viewMatrix)*t;
  vec3 sd = cross(tv, mv.xyz); sd /= max(length(sd), 1e-5);
  float wd = max(w, uPx*0.8*max(-mv.z, 0.1));
  k = w/wd;
  mv.xyz += sd*side*wd;
  return mv;
}
`;

// ---------------------------------------------------------------- a small mesh accumulator
// position, normal and any number of named float attributes: geo.attr('aE', 4) then pass { aE: [a, b, c, d] } to v()
export class Geo {
  constructor(attrs = {}) { this.p = []; this.n = []; this.i = []; this.count = 0; this.names = Object.keys(attrs); this.sizes = attrs; this.a = {}; for (const k of this.names) this.a[k] = []; this.cur = {}; for (const k of this.names) this.cur[k] = new Array(attrs[k]).fill(0); }
  set(name, ...vals) { this.cur[name] = vals; return this; }
  v(x, y, z, nx = 0, ny = 1, nz = 0) {
    this.p.push(x, y, z); this.n.push(nx, ny, nz);
    for (const k of this.names) { const c = this.cur[k], a = this.a[k]; for (let j = 0; j < this.sizes[k]; j++) a.push(c[j] ?? 0); }
    return this.count++;
  }
  tri(a, b, c) { this.i.push(a, b, c); }
  quad(a, b, c, d) { this.i.push(a, b, c, a, c, d); }
  // rings of `sides + 1` vertices already pushed one after another from index `base`: stitch `rings` of them
  stitch(base, rings, sides, flip = false) {
    for (let j = 0; j < rings - 1; j++) for (let k = 0; k < sides; k++) {
      const a = base + j * (sides + 1) + k, b = a + sides + 1;
      if (flip) this.i.push(a, a + 1, b, a + 1, b + 1, b); else this.i.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }
  geometry(computeNormals = false) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    for (const k of this.names) g.setAttribute(k, new THREE.Float32BufferAttribute(this.a[k], this.sizes[k]));
    g.setIndex(this.count > 65535 ? new THREE.Uint32BufferAttribute(this.i, 1) : new THREE.Uint16BufferAttribute(this.i, 1));
    if (computeNormals) g.computeVertexNormals();
    return g;
  }
  get triangles() { return this.i.length / 3; }
}
// an explicit bounding sphere (things posed in the vertex shader cannot be measured from their attributes)
export const bound = (g, x, y, z, r) => { g.boundingSphere = new THREE.Sphere(new THREE.Vector3(x, y, z), r); return g; };

// ---------------------------------------------------------------- the thrum of the main cable
// grips: 7 x (s on the cable, weight 0..1, seconds since it took hold, sag in metres). The cable sags under each
// planted hand, and a wave 90 m long leaves each new hold both ways. Same sum in JS and GLSL.
export function cableDip(s, G) {
  let y = 0;
  for (let i = 0; i < G.length; i++) {
    const g = G[i], ds = Math.abs(s - g.x), ph = ds - 60 * g.z;
    y -= g.y * g.w * Math.exp(-ds / 38);
    y += 0.6 * g.y * Math.exp(-g.z * 0.3) * Math.exp(-ph * ph / 2025) * Math.sin(ph * 0.0698);
  }
  return y;
}
export const DIP_GLSL = /* glsl */`
uniform vec4 uGr[7];
float cmCableDip(float s){
  float y = 0.0;
  for (int i = 0; i < 7; i++) {
    vec4 g = uGr[i]; float ds = abs(s - g.x), ph = ds - 60.0*g.z;
    y -= g.y*g.w*exp(-ds/38.0);
    y += 0.6*g.y*exp(-g.z*0.3)*exp(-ph*ph/2025.0)*sin(ph*0.0698);
  }
  return y;
}
`;
