// THE GYRE: hero set piece of "Every Wingbeat Stays".
// A crane-like bird of 64 m span climbs anticlockwise round a 320 m needle of rock; every 1.6 s it leaves
// itself behind as a solid shell, so its last ninety wingbeats stand in the air as a spiral arcade of wings:
// chrome yellow at the top where the bird is now, through orange, vermilion and magenta to ultramarine at
// the foot, where the oldest shells come apart into fluttering triangles. Three ribbons (both wingtips and
// the bill) thread every shell. Forty swifts perch on the older shells as a scale cue.
//
// LOCAL SPACE  origin on the ground at the needle's axis, +Y up. North is -Z, east is +X: the camera of the
//   brief enters from +Z (the "front"), the sun stands to the west (-X).
// SIZE         radius ~150 m (helix radius 110 m + 32 m of wing), height ~340 m.
// CLOCK        one world clock t (seconds). The world calls hero.setProgress(u) every frame (t = 42 u);
//   until it does, the piece runs on the time passed to update(). hero.setClock(t) sets t directly.
//   Every shell, ribbon vertex and perched swift is a pure function of t, so scrubbing t is exact and nothing pops.
//   Bird: position (110 cos a, 250 + 1.5625 t, -110 sin a), a = a0 + 2 pi t / 25.6, so that at u 0.97 it is
//   due SOUTH of the needle heading due EAST (see anchors.portalSeat). hero.birdAt(t, target) gives its place.
// STYLE        cut coloured planes: flat opaque unlit triangles with ink edges, no fog, no lights, no bloom.
//   Colours are authored as on-screen hexes and pre-compensated through the inverse ACES curve (tone()).
// OPTS         palette  [now, vermilion, magenta, ultramarine, teal, cream, ink] hex strings (the brief's by default)
//              detail   0.6..1: thins only the perched swifts and the ribbon steps (never the bird or the 90 shells)
//              variant  'crane' | 'condor' | 'frigate' (picked per seed: crane 60 %, the others 20 % each)
//              needle   false to leave the rock needle out (default true)
//              exposure the post exposure the world will use (default 1), for the colour compensation
//              shells   number of past selves, 20..90 (default 90); swifts false leaves the perched swifts out
//              climb    1 (default) or -1: the helix descends; with object.scale.z = -1 it also turns the other way
//              y0, phase  start height and angle offset of the helix; depthK tone-step strength (default 0.16)
//              ribbonMaxFrac  widest a line of force may draw, as a share of the frame height (default 0.009)
//              ribbonLife  seconds a line of force lasts (default 40); mids  five hexes for the mid role (default hue x 0.72)
//              farHue  how far the mid, complement and cream faces lean to the hue beyond ~600 m (default 0.8)
//              comps  five hexes for the complement role, by band (null = worked out); ribbons false = no lines of force
//              crumble  how many of the oldest shells are coming apart (default 14); blueFrom  life at which the last band begins (default 0.77); bands  all four band borders, as shares of the trail's life
// FLIGHT       flightPlan(hero) returns the brief's route as control points with the world-clock time for each;
//              tools: shots/every-wingbeat-stays/dev/clear.mjs measures the clearance to every shell along it.
// PER SEED     bird variant, the needle's strata, shelves and cleft, feather role patterns, a small beat-phase shift.
// HOOKS        setProgress(u) | setClock(t); setSky(warmHex, coolHex, sunDir) for the tone-step depth colours;
//              birdAt(t, v3) and headingAt(t, v3) for pois; uniforms (uLineW ink width in px, uBack back-face tone).
// COST         ~90k triangles (shells ~860 x 90, living bird ~3.6k, ribbons 3.6k, needle ~1.6k, swifts 0.6k),
//              5 draw calls, no lights, no textures, build ~100 ms. Nothing is frustum culled (all motion is in
//              the vertex shader), so it draws whenever the group is visible.
// LIGHTING     none: it ignores scene lights and fog by design. It wants post bloom 0 (cream is authored at ~0.9 on
//              screen and will halo under bloom), exposure 1, and a pale sky behind it; old blue shells want straw
//              ground behind them.
// ANCHORS      see the block above `anchors` near the foot of buildHero.
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const TAU = Math.PI * 2;
const DEFAULT_PALETTE = ['#F3C52E', '#E24A2A', '#B5347C', '#2747A8', '#1E8C72', '#F2E7D0', '#221F2A'];
export const GYRE = { R: 110, Y0: 250, CLIMB: 1.5625, PERIOD: 25.6, D: 1.6, N: 90, BEAT: 1.44, BANK: 0.2443, T_END: 42 };

// ---- colour: on-screen hex -> linear scene value that the post chain (x exposure / 0.6, ACES) maps back to it
const M_IN = [[0.59719, 0.35458, 0.04823], [0.07600, 0.90834, 0.01566], [0.02840, 0.13383, 0.83777]];
const M_OUT = [[1.60475, -0.53108, -0.07367], [-0.10208, 1.10813, -0.00605], [-0.00327, -0.07276, 1.07602]];
const inv3 = (m) => {
  const [[a, b, c], [d, e, f], [g, h, i]] = m, A = e * i - f * h, B = -(d * i - f * g), C = d * h - e * g;
  const det = a * A + b * B + c * C;
  return [[A / det, -(b * i - c * h) / det, (b * f - c * e) / det], [B / det, (a * i - c * g) / det, -(a * f - c * d) / det], [C / det, -(a * h - b * g) / det, (a * e - b * d) / det]];
};
const mul3 = (m, v) => [m[0][0] * v[0] + m[0][1] * v[1] + m[0][2] * v[2], m[1][0] * v[0] + m[1][1] * v[1] + m[1][2] * v[2], m[2][0] * v[0] + m[2][1] * v[1] + m[2][2] * v[2]];
const M_IN_I = inv3(M_IN), M_OUT_I = inv3(M_OUT);
const fitInv = (y) => { // inverse of RRTAndODTFit, per channel
  y = clamp(y, 0, 0.98);
  const A = 1 - 0.983729 * y, B = 0.0245786 - 0.4329510 * y, C = -(0.000090537 + 0.238081 * y);
  return (-B + Math.sqrt(Math.max(B * B - 4 * A * C, 0))) / (2 * A);
};
export function makeTone(exposure) {
  return (hex, mul = 1) => {
    const c = hex.isColor ? hex.clone() : new THREE.Color(hex);             // linear target on screen
    const v = mul3(M_IN_I, mul3(M_OUT_I, [c.r * mul, c.g * mul, c.b * mul]).map(fitInv));
    const k = 0.6 / Math.max(exposure, 0.05);
    return new THREE.Color(Math.max(v[0], 0.002) * k, Math.max(v[1], 0.002) * k, Math.max(v[2], 0.002) * k);
  };
}

// ---- triangle soup builder: non-indexed, with barycentrics (hidden-edge mask), role, segment, pivot, centroid
// seg types: 0 body, 1 neck/head, 2 tail blade j, 3 inner wing, 4 hand, 5 primary j, 6 leg
function makeSoup(rng) {
  const P = [], B = [], INFO = [], PIV = [], CEN = [], EXT = [];
  let cur = { seg: 0, j: 0, side: 0, pivot: [0, 0, 0], tint: 0 };
  const push = (a, b, c, role, hide, hint) => {
    if (hint) { // wind so the face normal agrees with the hint (front = upper / outer side)
      const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
      const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      if (nx * hint[0] + ny * hint[1] + nz * hint[2] < 0) { const t = b; b = c; c = t; hide = (hide & 4) | ((hide & 1) << 1) | ((hide & 2) >> 1); }
    }
    const cx = (a[0] + b[0] + c[0]) / 3, cy = (a[1] + b[1] + c[1]) / 3, cz = (a[2] + b[2] + c[2]) / 3, seed = rng();
    P.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
    // hide (bit mask): 1 hides edge a-c (opposite b), 2 hides edge a-b (opposite c), 4 hides edge b-c (opposite a)
    const hx = hide & 4 ? 1 : 0, hy = hide & 1 ? 1 : 0, hz = hide & 2 ? 1 : 0;
    B.push(1, hy, hz, hx, 1, hz, hx, hy, 1);
    for (let k = 0; k < 3; k++) {
      INFO.push(cur.seg, cur.j, cur.side, role);
      PIV.push(cur.pivot[0], cur.pivot[1], cur.pivot[2]);
      CEN.push(cx, cy, cz, seed);
      EXT.push(cur.tint);
    }
  };
  return {
    rng,
    set(o) { cur = { ...cur, ...o }; },
    tri(a, b, c, role, hint, hide = 0) { push(a, b, c, role, hide, hint); },
    quad(a, b, c, d, role, hint, role2 = role) { push(a, b, c, role, 1, hint); push(a, c, d, role2, 2, hint); },
    count: () => P.length / 9,
    geometry(instanced) {
      const g = instanced ? new THREE.InstancedBufferGeometry() : new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
      g.setAttribute('aBary', new THREE.Float32BufferAttribute(B, 3));
      g.setAttribute('aInfo', new THREE.Float32BufferAttribute(INFO, 4));
      g.setAttribute('aPivot', new THREE.Float32BufferAttribute(PIV, 3));
      g.setAttribute('aCen', new THREE.Float32BufferAttribute(CEN, 4));
      g.setAttribute('aTint', new THREE.Float32BufferAttribute(EXT, 1));
      return g;
    },
  };
}

// ---- bird anatomy (bird space: +Z nose, +Y up, X span; side = +1 right wing, -1 left). Rest pose = wings level.
const UP = [0, 1, 0], DOWN = [0, -1, 0];
const add = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
const mix3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

// One flat feather blade: narrow leading vane (hue), wide trailing vane (complement), cream tip, pointed.
// root: quill base; dir: unit, along the shaft; lead: unit, toward the leading vane; n: lengthwise sections.
function feather(S, root, dir, lead, L, w, o = {}) {
  const n = o.n ?? 2, roll = o.roll ?? 0.12, tip = o.tipRole ?? 3, lr = o.leadRole ?? 0, tr = o.trailRole ?? 2;
  const notch = o.notch ?? 0, rng = o.rng;
  const prof = (t) => 0.42 + 0.58 * Math.sin(Math.min(t * 2.4, 1) * Math.PI * 0.5) - 0.5 * smoothstep(0.55, 1, t); // width profile
  const at = (t, v) => { // v: +1 leading rim, 0 shaft, -1 trailing rim
    const wv = (v > 0 ? 0.48 : 0.52) * w * prof(t);
    const p = add(add(root, dir, L * t), lead, v * wv);
    p[1] -= (v < 0 ? roll * wv : -roll * 0.4 * wv * v) + (o.droop ?? 0) * t * t * L; return p;
  };
  const tEnd = 0.8, tipP = add(root, dir, L); tipP[1] -= (o.droop ?? 0) * L;
  let pl = at(0, 0.5), ps = at(0, 0), pt = at(0, -0.5);
  for (let i = 1; i <= n; i++) {
    const t = (i / n) * tEnd, l = at(t, 1), s = at(t, 0);
    const tr1 = at(t, -1);
    S.quad(pl, l, s, ps, lr, UP);
    if (notch > 0 && i > 1) { // serrated trailing edge: the vane splits into barbs on the living bird
      const tm = t - (0.5 / n) * tEnd, cut = at(tm, -(1 - notch * (0.6 + 0.4 * rng())));
      S.tri(ps, pt, cut, tr, UP, 1); S.tri(ps, cut, s, tr, UP, 6); S.tri(s, cut, tr1, tr, UP, 2);
    } else S.quad(ps, s, tr1, pt, tr, UP);
    pl = l; ps = s; pt = tr1;
  }
  S.tri(pl, tipP, ps, tip, UP, 0); S.tri(ps, tipP, pt, o.tipRole2 ?? tip, UP, 0);
}

// A wedge slab between two chord stations (leading edge front face cream, top hue, underside complement).
// a/b: leading-edge points (inner, outer); ca/cb: chord lengths back along -Z; da/db: leading-edge depths.
function wedge(S, a, b, ca, cb, da, db, roles = [0, 2, 3]) {
  const aT = add(a, UP, da * 0.4), aB = add(a, UP, -da * 0.6), bT = add(b, UP, db * 0.4), bB = add(b, UP, -db * 0.6);
  const aR = [a[0], a[1] - da * 0.1, a[2] - ca], bR = [b[0], b[1] - db * 0.1, b[2] - cb];
  S.quad(aT, bT, bR, aR, roles[0], UP);          // top
  S.quad(aB, bB, bR, aR, roles[1], DOWN);        // underside
  S.quad(aT, bT, bB, aB, roles[2], [0, 0, 1]);   // leading face
  return { aR, bR, aT, bT, aB, bB };
}

const VARIANTS = {
  crane: { neck: 1, tail: (k) => 15 - 2.2 * k * k, tailW: 1.5, chord: 1, primW: 1.25, primL: [9, 9.6, 10.3, 11, 11.8, 12.6, 13.4, 14, 13.6, 12.4, 10.6], spread: 1.35, legs: true, bill: 4.3, sweep: 1.8 },
  condor: { neck: 0.5, tail: (k) => 8 - 1.2 * k * k, tailW: 2.0, chord: 1.35, primW: 1.7, primL: [8, 8.4, 9, 9.8, 10.8, 12, 13, 13.6, 13.6, 13, 11.6], spread: 1.62, legs: false, bill: 2.4, sweep: 0.6 },
  frigate: { neck: 0.6, tail: (k) => 7 + 12 * k * k, tailW: 1.2, chord: 0.78, primW: 1.05, primL: [8, 8.8, 9.8, 11, 12.2, 13.4, 14.4, 15, 15, 14, 12], spread: 1.0, legs: false, bill: 5.2, sweep: 3.4 },
};

// Loft closed rings of points into quads; role(i, k) gives the role of side k between ring i and i+1.
function loft(S, rings, axis, role) {
  for (let i = 0; i < rings.length - 1; i++) {
    const A = rings[i], Bn = rings[i + 1], n = A.length;
    for (let k = 0; k < n; k++) {
      const a = A[k], b = A[(k + 1) % n], c = Bn[(k + 1) % n], d = Bn[k];
      const mid = [(a[0] + b[0] + c[0] + d[0]) / 4, (a[1] + b[1] + c[1] + d[1]) / 4, (a[2] + b[2] + c[2] + d[2]) / 4];
      const ax = mix3(axis[i], axis[i + 1], 0.5), r = role(i, k);
      S.quad(a, b, c, d, r, [mid[0] - ax[0], mid[1] - ax[1], mid[2] - ax[2]], Array.isArray(r) ? r[1] : r);
    }
  }
}

function buildBody(S, V, hi) {
  // keeled body: 6-gon ring (ridge, right shoulder, right flank, keel, left flank, left shoulder)
  S.set({ seg: 0, j: 0, side: 0, pivot: [0, 0, 0] });
  const st = [[-6.4, 0.45, 0.5, 0.5], [-4.2, 1.15, 1.0, 1.2], [-1.2, 1.75, 1.45, 2.0], [1.6, 2.15, 1.7, 2.9], [4.2, 1.8, 1.5, 2.1], [6.3, 0.95, 0.95, 1.0]];
  const ring = ([z, w, h, k]) => [[0, h, z], [w, 0.35 * h, z + 0.2], [0.72 * w, -0.5 * k, z], [0, -k, z + 0.5], [-0.72 * w, -0.5 * k, z], [-w, 0.35 * h, z + 0.2]];
  const bodyRole = (i, k) => (k === 0 ? (i === 2 ? 3 : 0) : k === 5 ? (i === 2 ? 3 : 1) : k === 1 ? (i % 2 ? 0 : 1) : k === 4 ? 1 : k === 2 ? 2 : (i % 2 ? 2 : 1));
  loft(S, st.map(ring), st.map((s) => [0, 0, s[0]]), bodyRole);
  const tail = ring(st[0]); for (let k = 0; k < 6; k++) S.tri(tail[k], tail[(k + 1) % 6], [0, 0, -7.4], 2, [tail[k][0], tail[k][1], -1], 0);
  // neck: diamond section, striped; head wedge with crown patch; blade bill
  const nk = V.neck, nb = [0, 0.7, 6.3];
  S.set({ seg: 1, pivot: nb });
  const ns = [[0.7, 6.3, 0.95], [1.5 * nk + 0.3, 6.3 + 3.2 * nk, 0.62], [2.1 * nk + 0.2, 6.3 + 6.2 * nk, 0.5], [1.9 * nk + 0.3, 6.3 + 8.9 * nk, 0.55], [2.0 * nk + 0.3, 6.3 + 8.9 * nk + 1.3, 0.85], [1.6 * nk + 0.3, 6.3 + 8.9 * nk + 2.5, 0.36]];
  const nring = ([y, z, r]) => [[0, y + r, z], [r * 0.8, y, z], [0, y - r * 1.15, z], [-r * 0.8, y, z]];
  loft(S, ns.map(nring), ns.map((s) => [0, s[0], s[1]]), (i, k) => (i === 3 ? (k === 0 || k === 3 ? 2 : 3) : i === 4 ? (k < 1 || k > 2 ? 0 : 1) : (k === 0 ? 0 : k === 3 ? 1 : (i % 2 ? 3 : 2))));
  const hb = ns[5], bt = [0, hb[0] - 0.5, hb[1] + V.bill], br = nring(hb);
  S.tri(br[0], br[1], bt, 3, [1, 1, 0], 0); S.tri(br[1], br[2], bt, 4, [1, -1, 0], 0);
  S.tri(br[2], br[3], bt, 4, [-1, -1, 0], 0); S.tri(br[3], br[0], bt, 3, [-1, 1, 0], 0);
  { // crest: three blades swept back off the crown, the silhouette's signature
    const c = ns[4];
    for (let q = 0; q < 3; q++) feather(S, [(q - 1) * 0.22, c[0] + 0.7, c[1] - 0.1], [(q - 1) * 0.16, 0.42 - 0.1 * Math.abs(q - 1), -0.9], [q < 1 ? -1 : 1, 0, 0], 3.4 - 0.8 * Math.abs(q - 1), 0.5, { n: 1, roll: 0, leadRole: q === 1 ? 3 : 0, trailRole: 2, tipRole: 4 });
  }
  S.set({ seg: 0, pivot: [0, 0, 0] });
  for (let i = 0; i < (hi ? 5 : 3); i++) for (const sx of [1, -1]) { // mantle: scales shingled down the back
    const t = i / (hi ? 5 : 3), z = lerp(4.4, -3.6, t);
    feather(S, [sx * 0.25, lerp(1.62, 1.2, t) + 0.12, z], [sx * 0.34, -0.1, -0.93], [sx, 0, 0], hi ? 3.0 : 4.2, 1.5, { n: 1, roll: 0.5, leadRole: i % 2 ? 0 : 1, trailRole: i % 2 ? 2 : 1, tipRole: 3 });
  }
  S.set({ seg: 1, pivot: nb });
  if (hi) { // eye on the living bird
    const e = ns[4];
    for (const sx of [1, -1]) S.tri([sx * 0.72, e[0] + 0.25, e[1] - 0.2], [sx * 0.72, e[0] - 0.15, e[1] + 0.3], [sx * 0.6, e[0] + 0.3, e[1] + 0.55], 4, [sx, 0, 0], 0);
  }
  // legs trailing under the tail (cranes fly with them stretched out behind)
  if (V.legs) for (const sx of [1, -1]) {
    S.set({ seg: 6, side: sx, pivot: [sx * 0.6, -1.0, -3] });
    const p0 = [sx * 0.6, -1.0, -3], p1 = [sx * 0.75, -1.5, -11.5], p2 = [sx * 0.8, -1.35, -18.5], w = 0.32;
    S.quad(add(p0, [0, 1, 0], w), add(p1, [0, 1, 0], w * 0.7), add(p1, [sx, -0.6, 0], w * 0.7), add(p0, [sx, -0.6, 0], w * 1.4), 1, [sx, 0.3, 0]);
    S.quad(add(p0, [0, 1, 0], w), add(p1, [0, 1, 0], w * 0.7), add(p1, [-sx, -0.6, 0], w * 0.7), add(p0, [-sx, -0.6, 0], w * 1.4), 2, [-sx, 0.3, 0]);
    S.quad(add(p1, [0, 1, 0], w * 0.7), add(p2, [0, 1, 0], w * 0.3), add(p2, [sx, -0.6, 0], w * 0.5), add(p1, [sx, -0.6, 0], w * 0.7), 4, [sx, 0.3, 0]);
    S.quad(add(p1, [0, 1, 0], w * 0.7), add(p2, [0, 1, 0], w * 0.3), add(p2, [-sx, -0.6, 0], w * 0.5), add(p1, [-sx, -0.6, 0], w * 0.7), 4, [-sx, 0.3, 0]);
    for (const t of [-1, 0, 1]) S.tri(add(p2, [0, 1, 0], 0.1), add(p2, [sx * 0.1 + t * 0.5, -0.25 * Math.abs(t) - 0.1, -1.5], 1), add(p2, [t * 0.25, -0.3, -0.2], 1), 3, UP, 0);
  }
  // tail fan: blades built straight back, fanned in the vertex shader about the tail root
  const tr = [0, 0.15, -5.6];
  for (let j = 0; j < 9; j++) {
    const k = (j - 4) / 4, L = V.tail(Math.abs(k));
    S.set({ seg: 2, j, side: 0, pivot: tr });
    const root = [k * 0.5, 0.15 - 0.07 * Math.abs(j - 4) + (j % 2) * 0.05, -5.6];
    feather(S, root, [0, 0, -1], [k >= 0 ? 1 : -1, 0, 0], L, V.tailW, { n: hi ? 4 : 2, roll: 0.1, notch: hi ? 0.35 : 0, rng: S.rng, leadRole: 0, trailRole: j % 2 ? 2 : 1, tipRole: j === 4 ? 2 : 3 });
  }
  return { bill: bt, neckBase: nb, tailRoot: tr };
}

const SHOULDER = [1.45, 0.95, 5.0], WRIST = [13.6, 0.95, 4.3];
function buildWing(S, V, s, hi) {
  const m = (p) => [p[0] * s, p[1], p[2]];
  const ch = V.chord, sw = V.sweep;
  // ---- inner wing (arm): two wedge sections, stepped coverts, 9 secondaries
  S.set({ seg: 3, j: 0, side: s, pivot: m(SHOULDER) });
  const mid = [7.4, 0.95, 5.0 + 0.25], secs = [[SHOULDER, mid, 4.3 * ch, 3.9 * ch, 1.4, 1.3], [mid, WRIST, 3.9 * ch, 3.4 * ch, 1.3, 1.15]];
  const trail = [];
  secs.forEach(([a, b, ca, cb, da, db], q) => {
    const w = wedge(S, m(a), m(b), ca, cb, da, db, [q ? 0 : 1, q ? 1 : 2, 3]);
    trail.push([w.aR, w.bR]);
  });
  S.tri(m([0.9, 1.2, 3.6]), m(add(SHOULDER, UP, 0.56)), m([SHOULDER[0], 0.8, 5.0 - 4.3 * ch]), 1, UP, 0);   // shoulder fairing onto the back
  // coverts: rows of short scales stepping down and back off the wedge's trailing line
  const armLen = WRIST[0] - SHOULDER[0];
  const rows = hi ? 3 : 2, per = hi ? 12 : 6;
  for (let r = 0; r < rows; r++) for (let i = 0; i < per; i++) {
    const t = (i + 0.5) / per, x = SHOULDER[0] + t * armLen, c = lerp(4.3, 3.4, t) * ch;
    const root = m([x, 0.82 - 0.14 * r, lerp(5.0, 4.3, t) + 0.25 * Math.sin(t * Math.PI) - c * (0.62 + 0.3 * r)]);
    feather(S, root, [s * 0.05, 0, -1], [s, 0, 0], (2.6 - 0.25 * r) * ch, (armLen / per) * 1.12, { n: 1, roll: 0.08, leadRole: 0, trailRole: (i + r) % 2 ? 1 : 0, tipRole: r === rows - 1 ? 3 : (i % 3 ? 1 : 2) });
  }
  for (let i = 0; i < 9; i++) {
    const t = (i + 0.5) / 9, x = SHOULDER[0] + 0.3 + t * (armLen - 0.2), c = lerp(4.3, 3.4, t) * ch, th = lerp(-0.1, 0.2, t);
    const root = m([x, 0.5, lerp(5.0, 4.3, t) - c - 1.2 * ch]);
    feather(S, root, [s * Math.sin(th), 0, -Math.cos(th)], [s * Math.cos(th), 0, Math.sin(th)], lerp(7.2, 8.6, t) * (0.8 + 0.2 * ch), 1.55, { n: hi ? 4 : 2, notch: hi ? 0.3 : 0, rng: S.rng, roll: 0.13, leadRole: 0, trailRole: i % 2 ? 1 : 2 });
  }
  // ---- hand: wedge to the tip, one covert row, alula
  S.set({ seg: 4, pivot: m(WRIST) });
  const HT = [19.6, 0.95, 4.3 - sw];
  wedge(S, m(WRIST), m(HT), 3.4 * ch, 1.5 * ch, 1.15, 0.5, [0, 1, 3]);
  S.tri(m(add(HT, UP, 0.2)), m(add(HT, [1.5, 0, -0.9], 1)), m([HT[0], HT[1], HT[2] - 1.5 * ch]), 3, UP, 0);       // tip cap
  feather(S, m(add(WRIST, [0.3, 0.5, 0.2], 1)), [s * 0.96, 0, -0.28], [s * 0.28, 0, 0.96], 3.4, 0.8, { n: 1, roll: 0, leadRole: 3, trailRole: 1, tipRole: 4 }); // alula
  const hper = hi ? 7 : 4;
  for (let i = 0; i < hper; i++) {
    const t = (i + 0.5) / hper, x = lerp(WRIST[0], HT[0], t), c = lerp(3.4, 1.5, t) * ch, th = lerp(0.15, 0.7, t);
    const root = m([x, 0.8, lerp(WRIST[2], HT[2], t) - c * 0.7]);
    feather(S, root, [s * Math.sin(th), 0, -Math.cos(th)], [s * Math.cos(th), 0, Math.sin(th)], 2.8 * ch, ((HT[0] - WRIST[0]) / hper) * 1.2, { n: 1, roll: 0.08, leadRole: 0, trailRole: i % 2 ? 1 : 0, tipRole: 3 });
  }
  // ---- 11 primaries, separate, fanned from pointing back at the wrist to pointing out at the tip
  let tip = null;
  for (let j = 0; j < 11; j++) {
    const t = j / 10, th = lerp(0.24, V.spread, Math.pow(t, 0.85));
    const c = lerp(3.4, 1.5, t) * ch, root = [lerp(WRIST[0] + 0.4, HT[0] + 0.5, t), 0.62 - 0.02 * j, lerp(WRIST[2], HT[2], t) - c * (1 - 0.45 * t) + 0.3];
    S.set({ seg: 5, j, pivot: m(root) });
    const dir = [s * Math.sin(th), 0, -Math.cos(th)], lead = [s * Math.cos(th), 0, Math.sin(th)], L = V.primL[j];
    feather(S, m(root), dir, lead, L, V.primW * (1 - 0.18 * t), { n: hi ? 5 : 2, notch: hi ? 0.28 : 0, rng: S.rng, roll: 0.16, droop: 0.004, leadRole: j % 4 === 3 ? 1 : 0, tipRole: hi ? 4 : 3, tipRole2: hi ? 4 : (j % 2 ? 3 : 2) });
    if (j === 7) tip = { pos: add(m(root), dir, L), pivot: m(root), j };
  }
  return tip;
}

function buildBird(rng, variant, hi) {
  const S = makeSoup(rng), V = VARIANTS[variant] || VARIANTS.crane;
  const body = buildBody(S, V, hi);
  const tipR = buildWing(S, V, 1, hi), tipL = buildWing(S, V, -1, hi);
  return { S, bill: body.bill, neckBase: body.neckBase, tipR, tipL };
}

// ---- shaders. One family: flat colour per face, ink edge, tone-step depth; no lights, no fog, no textures.
export const GLSL_MOTION = /* glsl */`
  uniform float uT, uA0, uBeatOff, uSpread, uClimb, uY0;
  const float TAU = 6.2831853;
  vec3 rotX(vec3 p, float a){ float c=cos(a), s=sin(a); return vec3(p.x, p.y*c-p.z*s, p.y*s+p.z*c); }
  vec3 rotY(vec3 p, float a){ float c=cos(a), s=sin(a); return vec3(p.x*c+p.z*s, p.y, -p.x*s+p.z*c); }
  vec3 rotZ(vec3 p, float a){ float c=cos(a), s=sin(a); return vec3(p.x*c-p.y*s, p.x*s+p.y*c, p.z); }
  // rigid pose of one segment at wingbeat phase ph (0..1). info = (segment, index j, side, role)
  vec3 pose(vec3 p, vec4 info, vec3 piv, float ph){
    float seg = info.x, j = info.y, s = info.z;
    float w = TAU*ph, sn = sin(w), cs = cos(w);
    float sh = 0.12 + 0.62*sn;                 // shoulder
    float wr = 0.36*sin(w - 1.2);              // wrist lags the arm
    float swp = 0.35*max(cs, 0.);              // hand sweeps back on the upstroke
    vec3 S = vec3(1.45*s, 0.95, 5.0), W = vec3(13.6*s, 0.95, 4.3);
    if (seg > 4.5 && seg < 5.5) {              // primary j: fans, pitches, tips bend
      float pt = 0.3*cs;
      p -= piv; p = rotY(p, -s*j*uSpread*(1. + 0.5*cs)); p = rotX(p, pt*(1. - j*0.07)); p = rotZ(p, -s*pt*j*0.07); p += piv;
    }
    if (seg > 3.5 && seg < 5.5) { p -= W; p = rotY(p, s*swp); p = rotZ(p, s*wr); p += W; }
    if (seg > 2.5 && seg < 5.5) { p -= S; p = rotZ(p, s*sh); p += S; }
    if (seg > 1.5 && seg < 2.5) { p -= piv; p = rotY(p, -(j - 4.)*0.25*(0.5 + 0.2*cs)); p = rotX(p, -0.14*sn); p += piv; }
    if (seg > 0.5 && seg < 1.5) { p -= piv; p = rotX(p, 0.07*sn); p += piv; }
    if (seg > 5.5) { p -= piv; p = rotX(p, -0.05*sn); p += piv; }
    p.y -= 0.8*sn;                             // the body heaves against the wings
    return p;
  }
  vec3 birdPos(float te){ float a = uA0 + TAU*te/25.6; return vec3(110.*cos(a), uY0 + 1.5625*uClimb*te, -110.*sin(a)); }
  // bird space -> hero space at time te: nose along the helix tangent, banked 14 degrees toward the needle
  vec3 place(vec3 p, float te){
    float a = uA0 + TAU*te/25.6;
    vec3 fwd = vec3(-sin(a)*26.998, 1.5625*uClimb, -cos(a)*26.998) / 27.0432;
    vec3 r0 = vec3(cos(a), 0., -sin(a)), u0 = cross(r0, fwd);
    vec3 right = r0*0.9703 + u0*0.2419, up = u0*0.9703 - r0*0.2419;
    return birdPos(te) + right*p.x + up*p.y + fwd*p.z;
  }
`;
export const GLSL_COLOUR = /* glsl */`
  uniform vec3 uHue[5], uMid[5], uComp[5], uCream, uInk, uSkyWarm, uSkyCool, uSunDir;
  uniform float uAges[4], uDepthK, uDis, uFarHue;
  // colour is time: the hue band of a face of this age. Each border is crossed in half a second.
  vec3 ageColour(float age, float role){
    float k1 = smoothstep(uAges[0], uAges[0]+0.5, age), k2 = smoothstep(uAges[1], uAges[1]+0.5, age);
    float k3 = smoothstep(uAges[2], uAges[2]+0.5, age), k4 = smoothstep(uAges[3], uAges[3]+0.5, age);
    vec3 h = mix(mix(mix(mix(uHue[0], uHue[1], k1), uHue[2], k2), uHue[3], k3), uHue[4], k4);
    vec3 m = mix(mix(mix(mix(uMid[0], uMid[1], k1), uMid[2], k2), uMid[3], k3), uMid[4], k4);
    vec3 c = mix(mix(mix(mix(uComp[0], uComp[1], k1), uComp[2], k2), uComp[3], k3), uComp[4], k4);
    vec3 col = role < 0.5 ? h : role < 1.5 ? m : role < 2.5 ? c : role < 3.5 ? uCream : uInk;
    return col;
  }
  // distance is tone steps: n steps toward the sky tone, borders at 250, 600, 1200, 2400 m
  float depthSteps(float d){ return smoothstep(250., 290., d) + smoothstep(600., 640., d) + smoothstep(1200., 1240., d) + smoothstep(2400., 2440., d); }
  vec3 skyTone(vec3 fromCam){ float k = dot(fromCam.xz, uSunDir.xz) / max(length(fromCam.xz), 1.); return mix(uSkyCool, uSkyWarm, smoothstep(-0.15, 0.15, k)); }
`;
export const GLSL_INK = /* glsl */`
  uniform vec3 uInkF; uniform float uLineW, uBack;
  // thin ink edge from barycentrics; faces too small for a line are darkened by the line's average instead
  vec3 inked(vec3 col, vec3 bary, float lighten, vec3 sky){
    vec3 fw = max(fwidth(bary), vec3(0.00001));
    vec3 e3 = bary / fw; float e = min(e3.x, min(e3.y, e3.z));
    float px = 0.33 / max(fw.x, max(fw.y, fw.z));
    float ls = clamp(px/6. - 0.5, 0., 1.);
    float line = 1. - smoothstep(uLineW - 0.5, uLineW + 0.5, e);
    vec3 ink = mix(uInkF, sky, lighten);
    if (!gl_FrontFacing) col *= uBack;
    return mix(col*(1. - 0.12*(1. - ls)), ink, line*ls);
  }
`;

const VERT_MOVER = /* glsl */`
  attribute vec3 aBary, aPivot; attribute vec4 aInfo, aCen; attribute float aTint;
  uniform float uYoung;
  #if defined(SHELL) || defined(PERCH)
    attribute float aI;
  #endif
  varying vec3 vBary, vCol, vSky; varying float vLight;
  ${GLSL_MOTION}
  ${GLSL_COLOUR}
  void main(){
    float n = floor(uT/1.6);
    #if defined(PERCH)
      float idx = 46. + mod(n - aI + 240., 24.);       // a row keeps to one physical shell while it is magenta
      float te = (n - idx)*1.6;
    #elif defined(SHELL)
      float te = (n - aI)*1.6;                          // quantised per slot: an echo never moves
    #else
      float te = uT;
    #endif
    float age = uT - te;
    float ph = fract(te/1.44 + uBeatOff);
    vec3 P = place(pose(position, aInfo, aPivot, ph), te);
    float role = aInfo.w, colAge = age;
    #if defined(PERCH)
      vec3 C = place(pose(aCen.xyz, aInfo, aPivot, ph), te);
      float k = smoothstep(73.6, 76.6, age)*(1. - smoothstep(107., 110., age));   // arrive and leave by shrinking
      P = C + (P - C)*k; colAge = 0.;
    #elif defined(SHELL)
      vec3 C = place(pose(aCen.xyz, aInfo, aPivot, ph), te);
      float seed = aCen.w;
      float d = clamp((age - uDis - 8.*seed)/9., 0., 1.);                        // old shells come apart face by face
      // one face in eight lets go as a loose triangle of 2 to 6 m, turning into an even three-cornered piece as it
      // leaves; the rest fold away where they are, so the cloud is separate triangles and not a burst of feather slivers
      float keep = step(fract(seed*13.7), 0.13), corner = float(gl_VertexID - 3*(gl_VertexID/3));
      vec3 ax = normalize(vec3(sin(seed*40.), 0.6, cos(seed*40.)));
      vec3 e1 = normalize(cross(ax, vec3(0.3, 1., 0.2))), e2 = cross(ax, e1);
      float ca3 = corner*2.0944, sz = 1.3 + 2.2*fract(seed*29.3);
      vec3 v = mix(P - C, (e1*cos(ca3) + e2*sin(ca3))*sz, smoothstep(0., 0.22, d)*keep);
      float ang = 5.*d, ca = cos(ang), sa = sin(ang);
      v = v*ca + cross(e1, v)*sa + e1*dot(e1, v)*(1. - ca);                       // tumbling about an axis in its own plane
      v *= (1. - smoothstep(0.75, 1., d)) * mix(1. - smoothstep(0.02, 0.3, d), 1., keep);
      P = C + v + vec3(4.*d*sin(3.*d + 6.*seed), -6.*d - 28.*d*d, 4.*d*cos(2.*d + 6.*seed));
    #endif
    vec4 cw = modelMatrix * vec4(birdPos(te), 1.);
    float dcam = distance(cw.xyz, cameraPosition), st = depthSteps(dcam);
    vec3 col = ageColour(colAge, role);
    #if defined(SHELL)
      // the living bird alone wears the colour of now. Every self of the first band stands a clear step under it from a
      // fifth of a second after its birth: hue and mid faces most of the way to the next band's, cream edges to the hue.
      // So beside the bird a self is plainly a second bird of another colour, never a second pair of its own wings.
      // (Only within some 300 m: from afar the top turn of the stair keeps the clean colour of now.)
      float yng = uYoung * smoothstep(0., 0.2, age) * (1. - smoothstep(uAges[0] - 1.5, uAges[0] + 0.5, age)) * (1. - smoothstep(260., 430., dcam));
      if (role < 1.5) col = mix(col, ageColour(uAges[0] + 1., role), 0.85*yng);
      else if (role > 2.5 && role < 3.5) col = mix(col, ageColour(0., 0.), 0.85*yng);
      col *= 1. - 0.16*yng;
    #endif
    // far off a face is a few pixels and its roles average to brown: the mid, complement and cream lean to the hue
    if (role > 0.5 && role < 3.5) col = mix(col, ageColour(colAge, 0.), uFarHue * smoothstep(360., 620., dcam));
    col *= 1. + aTint;
    vSky = skyTone(cw.xyz - cameraPosition); vLight = uDepthK*min(st, 1.);                // one tone step at most: the Gyre must hold its colour
    vCol = mix(col, vSky, vLight); vBary = aBary;
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(P, 1.);
  }
`;
const FRAG_FLAT = /* glsl */`
  varying vec3 vBary, vCol, vSky; varying float vLight;
  ${GLSL_INK}
  void main(){ gl_FragColor = vec4(inked(vCol, vBary, vLight, vSky), 1.); }
`;
const VERT_STILL = /* glsl */`
  attribute vec3 aBary, aColor; attribute vec4 aCen;
  varying vec3 vBary, vCol, vSky; varying float vLight;
  ${GLSL_COLOUR}
  void main(){
    vec4 cw = modelMatrix * vec4(0., aCen.y, 0., 1.);
    float st = depthSteps(distance(cw.xyz, cameraPosition));
    vSky = skyTone(cw.xyz - cameraPosition); vLight = 0.16*st;
    vCol = mix(aColor, vSky, vLight); vBary = aBary;
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.);
  }
`;
// ribbons: three strips (right wingtip, left wingtip, bill) whose vertices sit at absolute times uStep apart (24 to
// a wingbeat, so the scallops are round at any distance). Painted lines of force: the clean hue of the shells they
// thread, born as a point at the wingtip, thinning with age, never wider than uMaxPx (a share of the frame height),
// thinning to nothing right by the lens, and from far off only the newest stretch shows, paler than the wings.
const VERT_RIBBON = /* glsl */`
  attribute float aK, aSide, aWhich;
  uniform vec4 uRInfo[3]; uniform vec3 uRPos[3], uRPiv[3]; uniform vec2 uRes; uniform float uStep, uLife, uMinPx, uMaxPx;
  varying vec3 vCol; varying float vV, vPx;
  ${GLSL_MOTION}
  ${GLSL_COLOUR}
  vec3 track(int w, float tk){ return place(pose(uRPos[w], uRInfo[w], uRPiv[w], fract(tk/1.44 + uBeatOff)), tk); }
  void main(){
    int w = int(aWhich + 0.5);
    float tk = aK < 0.5 ? uT : (floor(uT/uStep) - (aK - 1.))*uStep;      // the head grows with the bird
    float age = max(uT - tk, 0.);
    mat4 mv = viewMatrix * modelMatrix;
    vec4 a = mv * vec4(track(w, tk), 1.);
    vec4 cf = projectionMatrix * (mv * vec4(track(w, tk + 0.04), 1.)), cb = projectionMatrix * (mv * vec4(track(w, tk - 0.04), 1.));
    vec4 ca = projectionMatrix * a;
    vec2 sf = cf.xy / max(abs(cf.w), 0.001), sb = cb.xy / max(abs(cb.w), 0.001);
    vec2 dir = (sf - sb) * uRes; float dl = length(dir);
    vec2 nrm = dl > 0.0001 ? vec2(-dir.y, dir.x) / dl : vec2(0., 1.);
    float dist = max(-a.z, 0.5);
    float wpx = clamp(0.35 * uRes.y * projectionMatrix[1][1] / dist * 0.5, uMinPx, uMaxPx);   // half-width: 0.7 m wide, floor and cap in pixels
    float life = mix(uLife, min(uLife, 9.), smoothstep(320., 640., dist));                   // far off, only the newest stretch
    wpx *= smoothstep(0.25, 1.5, age) * mix(1., 0.45, clamp(age / max(life, 1.), 0., 1.)) * (1. - smoothstep(life * 0.72, life, age));
    if (aWhich > 1.5) wpx *= smoothstep(1.6, 4.5, age);                                       // the bill's line begins a body length behind the bird: never drawn through it
    wpx *= smoothstep(14., 55., dist);                                                       // a trace passing by the lens thins away: no line crosses the frame edge to edge
    wpx *= step(0.45 * uMinPx, wpx);                                                         // never a sub-pixel hair: it ends cleanly
    ca.xy += nrm * aSide * wpx / uRes * ca.w;
    float st = depthSteps(dist);
    vec3 sky = skyTone((modelMatrix * vec4(birdPos(tk), 1.)).xyz - cameraPosition);
    vCol = mix(ageColour(age, aWhich > 1.5 ? 3. : 0.), sky, clamp(uDepthK*min(st, 1.) + 0.45*smoothstep(260., 620., dist), 0., 0.7));
    vV = aSide; vPx = wpx;
    gl_Position = ca;
  }
`;
const FRAG_RIBBON = /* glsl */`
  uniform vec3 uInkF; varying vec3 vCol; varying float vV, vPx;
  void main(){
    float edge = smoothstep(vPx - 2.2, vPx - 1.0, abs(vV)*vPx) * step(5., vPx);   // ink rims once the band is wide enough
    gl_FragColor = vec4(mix(vCol, uInkF, edge), 1.);
  }
`;

const srgbMul = (hex, k) => { const c = new THREE.Color(hex); const h = c.getHexString(); const v = [0, 2, 4].map((i) => clamp(parseInt(h.slice(i, i + 2), 16) / 255 * k, 0, 1)); return new THREE.Color().setRGB(v[0], v[1], v[2], THREE.SRGBColorSpace); };
const srgbMix = (a, b, t) => { const A = new THREE.Color(a).getHexString(), Bh = new THREE.Color(b).getHexString(); const v = [0, 2, 4].map((i) => lerp(parseInt(A.slice(i, i + 2), 16), parseInt(Bh.slice(i, i + 2), 16), t) / 255); return new THREE.Color().setRGB(v[0], v[1], v[2], THREE.SRGBColorSpace); };
function complementOf(hex) { const c = new THREE.Color(hex), h = {}; c.getHSL(h, THREE.SRGBColorSpace); return new THREE.Color().setHSL((h.h + 0.5) % 1, 0.45, 0.4, THREE.SRGBColorSpace); }

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('gyre') : ctx.rng;
  const pal = (opts.palette && opts.palette.length >= 7) ? opts.palette : DEFAULT_PALETTE;
  const isDefault = pal.every((h, i) => String(h).toUpperCase() === DEFAULT_PALETTE[i]);
  const detail = clamp(opts.detail ?? ctx.quality?.detail ?? 1, 0.6, 1);
  const variant = opts.variant || (() => { const r = rng(); return r < 0.6 ? 'crane' : r < 0.8 ? 'condor' : 'frigate'; })();
  const tone = makeTone(opts.exposure ?? 1);
  const G = { ...GYRE, N: Math.round(clamp(opts.shells ?? GYRE.N, 20, GYRE.N)) }, T97 = opts.ringTime ?? 40.0;   // FIX2: the bird crosses the ring on a shell's own instant (25 x 1.6 s), so one whole self stands exactly over the ring
  const a0 = -Math.PI / 2 - TAU * T97 / G.PERIOD;            // at u 0.97 the bird is due south, heading east
  const ribbonLife = clamp(opts.ribbonLife ?? 40, 6, 60), ribbonMax = opts.ribbonMaxFrac ?? 0.009;   // seconds a line of force lasts; its widest, as a share of the frame height
  const beatOff = 0.5 + rng.range(-0.04, 0.04);              // keeps the shells over the last leg in their high V

  // hue bands by age: now, orange, vermilion, magenta, ultramarine; each with a mid and a complement
  const hues = [pal[0], srgbMix(pal[0], pal[1], 0.55), pal[1], pal[2], pal[3]].map((h) => new THREE.Color(h));
  const comps = opts.comps ? opts.comps.map((h, i) => (h ? new THREE.Color(h) : complementOf(hues[i]))) : isDefault ? ['#5B4A86', '#1F6E86', pal[4], '#2F8A4E', '#C4622A'].map((h) => new THREE.Color(h)) : hues.map(complementOf);
  const cream = new THREE.Color(pal[5]), ink = new THREE.Color(pal[6]);
  const U = {
    uT: { value: 12 }, uClimb: { value: opts.climb ?? 1 }, uY0: { value: opts.y0 ?? G.Y0 }, uDepthK: { value: opts.depthK ?? 0.16 }, uDis: { value: (G.N - clamp(opts.crumble ?? 14, 6, 40)) * G.D }, uA0: { value: a0 + (opts.phase ?? 0) }, uBeatOff: { value: beatOff }, uSpread: { value: 0.05 },
    uHue: { value: hues.map((c) => tone(c)) }, uMid: { value: hues.map((c, i) => tone(opts.mids?.[i] ? new THREE.Color(opts.mids[i]) : srgbMul(c, 0.72))) }, uFarHue: { value: opts.farHue ?? 0.8 }, uComp: { value: comps.map((c) => tone(c)) },
    uCream: { value: tone(cream) }, uInk: { value: tone(ink) }, uInkF: { value: tone(ink) },
    uAges: { value: (opts.bands ?? [0.09, 0.16, 0.495, opts.blueFrom ?? 0.77]).map((f) => f * G.N * G.D) },
    uSkyWarm: { value: tone('#EBD9A8') }, uSkyCool: { value: tone('#4F9F92') }, uSunDir: { value: new THREE.Vector3(-1, 0.53, 0).normalize() },
    uLineW: { value: 1.4 }, uBack: { value: 0.8 },
    uYoung: { value: opts.young ?? 1 },
    uRes: { value: new THREE.Vector2(1280, 720) }, uStep: { value: 0.06 }, uMinPx: { value: 0.75 }, uMaxPx: { value: 2 }, uLife: { value: ribbonLife },
    uRInfo: { value: [] }, uRPos: { value: [] }, uRPiv: { value: [] },
  };
  const mat = (defines, vs = VERT_MOVER, fs = FRAG_FLAT) => new THREE.ShaderMaterial({
    uniforms: U, defines, vertexShader: vs, fragmentShader: fs, side: THREE.DoubleSide, fog: false, toneMapped: false,
  });
  const object = new THREE.Group(); object.name = 'gyre';
  const addMesh = (geo, m, name, order = 0) => { const mesh = new THREE.Mesh(geo, m); mesh.name = name; mesh.frustumCulled = false; mesh.renderOrder = order; object.add(mesh); return mesh; };

  // ---- ninety shells (one instanced draw) and the living bird (a finer cut of the same anatomy)
  await ctx.yield?.();
  const lo = buildBird(rng.fork ? rng.fork('shell') : rng, variant, false);
  await ctx.yield?.();
  const shellGeo = lo.S.geometry(true);
  const aI = new Float32Array(G.N); for (let i = 0; i < G.N; i++) aI[i] = i;
  shellGeo.setAttribute('aI', new THREE.InstancedBufferAttribute(aI, 1));
  shellGeo.instanceCount = G.N;
  addMesh(shellGeo, mat({ SHELL: 1 }), 'shells');
  await ctx.yield?.();
  const hiB = buildBird(rng.fork ? rng.fork('live') : rng, variant, true);
  await ctx.yield?.();
  addMesh(hiB.S.geometry(false), mat({ LIVE: 1 }), 'bird');
  await ctx.yield?.();

  // ---- three ribbons: both wingtips and the bill
  const tracks = [lo.tipR, lo.tipL, { pos: lo.bill, pivot: lo.neckBase, j: 0, seg: 1, side: 0 }];
  U.uRInfo.value = tracks.map((t, i) => new THREE.Vector4(t.seg ?? 5, t.j, i === 0 ? 1 : i === 1 ? -1 : 0, 0));
  U.uRPos.value = tracks.map((t) => new THREE.Vector3(...t.pos));
  U.uRPiv.value = tracks.map((t) => new THREE.Vector3(...t.pivot));
  if (opts.ribbons !== false) {
    const step = detail < 0.75 ? 0.09 : 0.06, nseg = Math.ceil(ribbonLife / step) + 1;         // 16 or 24 vertices to a wingbeat
    U.uStep.value = step;
    const k = [], sd = [], wh = [], idx = [], pos = [];
    for (let w = 0; w < 3; w++) {
      const base = k.length;
      for (let i = 0; i <= nseg; i++) { k.push(i, i); sd.push(-1, 1); wh.push(w, w); pos.push(0, 0, 0, 0, 0, 0); }
      for (let i = 0; i < nseg; i++) { const a = base + i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('aK', new THREE.Float32BufferAttribute(k, 1));
    g.setAttribute('aSide', new THREE.Float32BufferAttribute(sd, 1));
    g.setAttribute('aWhich', new THREE.Float32BufferAttribute(wh, 1));
    g.setIndex(idx);
    addMesh(g, mat({}, VERT_RIBBON, FRAG_RIBBON), 'ribbons');
  }
  await ctx.yield?.();
  const parts = { shellTris: lo.S.count(), birdTris: hiB.S.count() };
  // ---- the needle: 320 m of stepped strata, 46 m at the foot, a cleft summit 8 m across
  if (opts.needle !== false) {
    await ctx.yield?.();
    const ng = buildNeedle(rng.fork ? rng.fork('needle') : rng, tone, pal);
    parts.needleTris = ng.attributes.position.count / 3;
    addMesh(ng, mat({}, VERT_STILL, FRAG_FLAT), 'needle');
    await ctx.yield?.();
  }
  // ---- forty swifts perched in rows along the leading edges of the magenta shells: still, so single; alive, so yellow
  if (opts.swifts !== false) {
    const S = makeSoup(rng.fork ? rng.fork('swifts') : rng), rowOf = [], perch = [], per = Math.max(3, Math.round(5 * detail));
    for (let r = 0; r < 8; r++) for (let i = 0; i < per; i++) {
      const sd = r % 3 === 2 ? -1 : 1, x = sd * (3.2 + i * 1.9 + (r % 2) * 0.8 + rng.range(-0.3, 0.3)), t = (Math.abs(x) - SHOULDER[0]) / (WRIST[0] - SHOULDER[0]);
      const o = [x, 1.5 - 0.06 * t, lerp(5.2, 4.5, t) - 0.25], sc = rng.range(0.9, 1.15), yaw = rng.range(-0.5, 0.5), cy = Math.cos(yaw), sy = Math.sin(yaw), n0 = S.count();
      const q = (px, py, pz) => [o[0] + (px * cy + pz * sy) * sc, o[1] + py * sc, o[2] + (-px * sy + pz * cy) * sc];
      S.set({ seg: 3, j: 0, side: sd, pivot: [SHOULDER[0] * sd, SHOULDER[1], SHOULDER[2]] });
      const nose = q(0, 0.42, 0.42), crown = q(0, 0.56, 0.12), back = q(0, 0.4, -0.3), tail = q(0, 0.16, -0.62), keel = q(0, 0.1, 0.05);
      for (const sx of [1, -1]) {
        const fl = q(sx * 0.17, 0.3, 0.02);
        S.tri(nose, crown, fl, 0, [sx, 0.5, 0]); S.tri(crown, back, fl, sx > 0 ? 0 : 1, [sx, 0.5, 0]); S.tri(back, tail, fl, 1, [sx, 0.3, 0]);
        S.tri(nose, fl, keel, 3, [sx, -0.5, 0]); S.tri(fl, tail, keel, 1, [sx, -0.5, 0]);
        S.tri(q(sx * 0.16, 0.44, 0.12), q(sx * 0.2, 0.3, -0.25), q(-sx * 0.08, 0.2, -1.15), 2, [sx, 1, 0]);   // folded sickle wing, crossing the tail
        S.tri(tail, q(sx * 0.16, 0.14, -0.95), q(sx * 0.02, 0.15, -0.7), 4, UP);                              // tail fork
      }
      S.tri(nose, q(0.03, 0.4, 0.4), q(0, 0.37, 0.62), 4, [1, 0, 0]);                                         // bill
      for (let k = n0; k < S.count(); k++) { rowOf.push(r * 3, r * 3, r * 3); perch.push(o, o, o); }
    }
    const g = S.geometry(false), cen = g.attributes.aCen;
    // every vertex of a swift shrinks about its own feet (aCen = perch point)
    for (let v = 0; v < cen.count; v++) cen.setXYZ(v, perch[v][0], perch[v][1], perch[v][2]);
    g.setAttribute('aI', new THREE.Float32BufferAttribute(rowOf, 1));
    parts.swiftTris = S.count();
    addMesh(g, mat({ PERCH: 1 }), 'swifts');
  }

  // ---- clock, helpers, anchors
  let clock = null;
  const birdAt = (t, target = new THREE.Vector3()) => { const a = a0 + TAU * t / G.PERIOD; return target.set(G.R * Math.cos(a), G.Y0 + G.CLIMB * t, -G.R * Math.sin(a)); };
  const headingAt = (t, target = new THREE.Vector3()) => { const a = a0 + TAU * t / G.PERIOD; return target.set(-Math.sin(a), 0.0579, -Math.cos(a)).normalize(); };
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const seatY = Math.round(birdAt(T97).y - (opts.seatDrop ?? 11.6));
  // ANCHORS (hero-local metres; the clock is t = 42 u, so every point below is exact for that journey)
  //   portalSeat   centre of the 14 m ring: 11 m under the helix spine where the bird is at u 0.97, due SOUTH of the
  //                needle (+Z), facing along +X (the brief's "due east" is the direction of flight there, the needle
  //                and its cleft summit on the left, the sun (-X) dead astern). `forward` is the direction of travel.
  //   finalLeg     the last straight: 150 m due east along the tangent at y seatY, through the ring and 60 m beyond.
  //                The shells laid over it (born t 36.8, 38.4, 40.0) are held in their high V by the beat phase.
  //   arcade       leg D (t 23.5..29): points 10 m under the spine of the turn below the living bird (shell wings
  //                overhead, keels ~7 m above the line). Slide in from outside (larger radius) and leave outward.
  //   beside       the brief's leg E (t 30..36): 20 m off the outer wingtip, 8 m above its back (flightPlan now flies
  //                LEG_E instead: further out, level with the keel and a second behind, so the bird is against sky).
  //   climb        leg C: a 100 degree arc at radius 190 m outside the wings, y 48 -> 237, ending by the arcade entry.
  //   entry        the brief's first frame: 760 m south at y 56, looking at `center`.
  //   summit       the needle's cleft top. basin: radius inside which loose triangles fall (keep ground below y 20).
  const arcade = [], beside = [], climb = [];
  for (let t = 23.5; t <= 29.01; t += 1.1) arcade.push(birdAt(t - G.PERIOD).add(V3(0, -10, 0)));
  for (let t = 30; t <= 36.01; t += 1.2) { const p = birdAt(t - 0.5), r = (G.R + 52) / G.R; beside.push(V3(p.x * r, birdAt(t).y + 8, p.z * r)); }
  { const aEnd = a0 + TAU * (23.5 - G.PERIOD) / G.PERIOD; for (let i = 0; i <= 6; i++) { const a = aEnd - (1 - i / 6) * 1.745; climb.push(V3(190 * Math.cos(a), lerp(48, 237, i / 6), -190 * Math.sin(a))); } }
  const anchors = {
    portalSeat: { position: V3(0, seatY, G.R), forward: V3(1, 0, 0), radius: 7 },
    finalLeg: [V3(-150, seatY, G.R), V3(-75, seatY, G.R), V3(0, seatY, G.R), V3(60, seatY, G.R)],
    flyThrough: [...arcade, ...beside, V3(-150, seatY, G.R), V3(0, seatY, G.R)],
    arcade, beside, climb,
    entry: { position: V3(0, 56, 760), lookAt: V3(0, 170, 0) },
    summit: V3(0, 320, 0), basinRadius: 250, helixRadius: G.R, wingReach: 34,
  };
  const size = new THREE.Vector2();
  const hero = {
    object, radius: 150, height: 340, center: V3(0, 170, 0), anchors, parts, variant,
    uniforms: U, birdAt, headingAt,
    setProgress(u) { clock = G.T_END * u; },        // world clock t = 42 u (call every frame)
    setClock(t) { clock = t; },
    setSky(warm, cool, sunDir) { if (warm) U.uSkyWarm.value = tone(warm); if (cool) U.uSkyCool.value = tone(cool); if (sunDir) U.uSunDir.value.copy(sunDir).normalize(); },
    update(dt, time, camera) {
      U.uT.value = clock ?? time;
      if (ctx.renderer?.getDrawingBufferSize) { ctx.renderer.getDrawingBufferSize(size); if (size.x > 0) { U.uRes.value.copy(size); U.uMinPx.value = clamp(size.y / 600, 1.5, 3) * 0.5; U.uMaxPx.value = Math.max(size.y * ribbonMax * 0.5, U.uMinPx.value * 1.6); } }   // half-widths
    },
    dispose() {},
    ground: true, groundY: 0,
  };
  return hero;
}

// ---- still things: flat colour per face, baked from a facing class (never chrome yellow or vermilion)
export function stillSoup() {
  const P = [], B = [], C = [], CEN = [];
  const push = (a, b, c, col, hide, hint) => {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    let n = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx];
    if (hint && n[0] * hint[0] + n[1] * hint[1] + n[2] * hint[2] < 0) { const t = b; b = c; c = t; n = [-n[0], -n[1], -n[2]]; if (hide === 1) hide = 2; else if (hide === 2) hide = 1; }
    const k = typeof col === 'function' ? col(n) : col;
    P.push(...a, ...b, ...c);
    const hx = hide === 3 ? 1 : 0, hy = hide === 1 ? 1 : 0, hz = hide === 2 ? 1 : 0;
    B.push(1, hy, hz, hx, 1, hz, hx, hy, 1);
    for (let i = 0; i < 3; i++) { C.push(k.r, k.g, k.b); CEN.push(0, 160, 0, 0); }
  };
  return {
    tri(a, b, c, col, hint) { push(a, b, c, col, 0, hint); },
    quad(a, b, c, d, col, hint) { push(a, b, c, col, 1, hint); push(a, c, d, col, 2, hint); },
    geometry() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
      g.setAttribute('aBary', new THREE.Float32BufferAttribute(B, 3));
      g.setAttribute('aColor', new THREE.Float32BufferAttribute(C, 3));
      g.setAttribute('aCen', new THREE.Float32BufferAttribute(CEN, 4));
      return g;
    },
  };
}

function buildNeedle(rng, tone, pal) {
  const S = stillSoup(), M = 11;
  const light = tone('#E9DDC2'), mid = tone('#D3C49C'), lee = tone('#B7ABBF'), top = tone(pal[5]);
  const violet = tone('#5B4A86'), teal = tone(pal[4]), dusk = tone('#3F3A5E');
  const light2 = tone('#DCCFAF'), mid2 = tone('#C2B48E'), lee2 = tone('#A79BB6'), deep = tone('#8D80AA'), deep2 = tone('#7C6FA0');
  // facing class from the face normal: sunward (west, -X) light, flanks mid, lee side violet-grey, ledges cream
  const facing = (band, alt) => (n) => {
    const l = Math.hypot(n[0], n[1], n[2]) || 1, up = n[1] / l, sun = (-n[0] * 0.85 + n[2] * 0.25) / l;
    if (up > 0.6) return top;
    if (band) return sun > -0.15 ? band : dusk;
    return sun > 0.35 ? (alt ? light2 : light) : sun > -0.3 ? (alt ? mid2 : mid) : sun > -0.8 ? (alt ? lee2 : lee) : (alt ? deep2 : deep);
  };
  const colA = []; for (let k = 0; k < M; k++) colA.push((k + rng.range(-0.32, 0.32)) / M * TAU);
  const colR = colA.map(() => rng.range(0.8, 1.18));
  const radius = (y) => 4.2 + 18.8 * Math.pow(1 - clamp(y / 286, 0, 1), 1.35) + 5 * Math.pow(1 - clamp(y / 60, 0, 1), 2);
  let twist = rng.range(0, TAU), y = -6, prev = null;
  const ring = (yy, r, tw, wob) => colA.map((a, k) => [Math.cos(a + tw) * r * (colR[k] + wob[k]), yy, Math.sin(a + tw) * r * (colR[k] + wob[k])]);
  let wob = colA.map(() => 0), bandN = 0;
  while (y < 284) {
    const thin = bandN > 1 && rng.chance(0.36), h = thin ? rng.range(2.5, 5) : rng.range(8, 19) * (y < 40 ? 0.7 : 1);
    const y1 = Math.min(y + h, 286), step = thin ? rng.range(0.8, 1.8) : rng.range(-1.6, 0.9);
    const r0 = radius(y) + step, r1 = radius(y1) + step - (thin ? 0 : rng.range(0, 0.6));
    const bandCol = thin ? (rng.chance(0.55) ? violet : teal) : null;
    const A = ring(y, r0, twist, wob), Bn = ring(y1, r1, twist + rng.range(-0.03, 0.03), wob);
    if (prev) for (let k = 0; k < M; k++) { const k2 = (k + 1) % M; S.quad(prev[k], prev[k2], A[k2], A[k], facing(null), [0, r0 > radius(y) ? -1 : 1, 0]); } // ledge
    for (let k = 0; k < M; k++) { const k2 = (k + 1) % M; S.quad(A[k], A[k2], Bn[k2], Bn[k], facing(bandCol, (bandN + (k % 4 === 0 ? 1 : 0)) % 2), [A[k][0] + A[k2][0], 0, A[k][2] + A[k2][2]]); }
    // a shelf or a fin now and then: tertiary breakup that catches a cream top and a violet lee
    if (!thin && rng.chance(0.55)) {
      const k = rng.int(0, M - 1), k2 = (k + 1) % M, out = rng.range(2.5, 6) * (0.5 + r0 / 26), yy = lerp(y, y1, rng.range(0.2, 0.7)), th = rng.range(1.5, 4);
      const a = mix3(A[k], Bn[k], 0.5), b = mix3(A[k2], Bn[k2], 0.5); a[1] = b[1] = yy;
      const mx = (a[0] + b[0]) / 2, mz = (a[2] + b[2]) / 2, ml = Math.hypot(mx, mz) || 1, o = [mx / ml * out, 0, mz / ml * out];
      const c = [mx + o[0], yy - th * 0.3, mz + o[2]], a2 = [a[0], yy - th * 2.2, a[2]], b2 = [b[0], yy - th * 2.2, b[2]];
      S.tri(a, b, c, facing(null), UP); S.tri(a, c, a2, facing(null), [a[0] - b[0], 0, a[2] - b[2]]); S.tri(b, c, b2, facing(null), [b[0] - a[0], 0, b[2] - a[2]]); S.tri(a2, b2, c, facing(null), [o[0], -out, o[2]]);
    }
    wob = wob.map((w) => clamp(w + rng.range(-0.05, 0.05), -0.14, 0.14));
    twist += rng.range(-0.05, 0.09); prev = Bn; y = y1; bandN++;
  }
  // cleft summit: the shaft ends in a saddle and two unequal horns
  const cx = prev.reduce((s, p) => s + p[0], 0) / M, cz = prev.reduce((s, p) => s + p[2], 0) / M;
  for (let k = 0; k < M; k++) S.tri(prev[k], prev[(k + 1) % M], [cx, 289, cz], top, UP);
  const ca = rng.range(0, TAU);
  [[1, 320, 3.3], [-1, 309, 2.7]].forEach(([sg, yTop, r]) => {
    const ox = Math.cos(ca) * sg * 2.9, oz = Math.sin(ca) * sg * 2.9, rings = [], ys = [280, 296, yTop - 7];
    ys.forEach((yy, i) => { const rr = r * (1 - i * 0.24), sh = 1 + i * 0.22; rings.push([0, 1, 2, 3, 4].map((q) => { const a = ca + q / 5 * TAU + i * 0.25; return [ox * sh + Math.cos(a) * rr, yy, oz * sh + Math.sin(a) * rr]; })); });
    for (let i = 0; i < 2; i++) for (let q = 0; q < 5; q++) { const q2 = (q + 1) % 5; S.quad(rings[i][q], rings[i][q2], rings[i + 1][q2], rings[i + 1][q], facing(i === 1 && sg > 0 ? violet : null), [rings[i][q][0] + rings[i][q2][0] - 2 * ox, 0, rings[i][q][2] + rings[i][q2][2] - 2 * oz]); }
    const tipP = [ox * 1.75, yTop, oz * 1.75];
    for (let q = 0; q < 5; q++) { const q2 = (q + 1) % 5; S.tri(rings[2][q], rings[2][q2], tipP, facing(null), [rings[2][q][0] + rings[2][q2][0] - 2 * ox * 1.44, 0.4, rings[2][q][2] + rings[2][q2][2] - 2 * oz * 1.44]); }
  });
  return S.geometry();
}

// ---- the flight of the brief, built from the anchors: control points with the world-clock time (t = 0..42) the
// camera should be there. The world turns this into its path and a monotone u -> t map, so the meetings stay exact
// whatever the path's length. Legs: A/B level run north along a crest, C the climbing arc outside the wings
// (spiralling in at its top), D the arcade under one turn of shells, E out and up beside the living bird, F the tangent.
// FIX2: the pass beside the bird is three pictures, not one. LEG_E rides abeam (a touch ahead, so its newest selves
// stand behind it in depth), 58 m outside the helix and 18 m under the keel (u 0.72-0.80: the bird on open sky); then
// swings WIDE, to 90 m outside, while the bird goes on round (u 0.84-0.90: the bird at a quarter of the frame, its
// selves stepping back to the left, the ring beyond its bill, the lower turn of the stair below); the detour is what
// lets the bird reach the ring ahead of us, so on the last straight it is whole above the ring, not over our heads.
const LEG_E = [[30.7, 0.3, 70, -22], [31.8, 0.0, 67, -20], [32.9, -0.2, 66, -19], [34.0, -0.1, 74, -16], [35.2, 0.3, 88, -13], [36.4, 0.9, 90, -9]];
const LEG_F = [[-170, 3, 92], [-135, 1, 107], [-95, 0, 110], [-50, 0, 110]];
export function flightPlan(hero, o = {}) {
  const A = hero.anchors, G = GYRE, pts = [], add = (x, y, z, t) => pts.push({ p: new THREE.Vector3(x, y, z), t });
  const z0 = o.entryZ ?? 660, a0 = hero.uniforms.uA0.value;
  add(0, 56, z0, 0); add(0, 56, z0 - 70, null); add(0, 55.5, z0 - 170, null); add(4, 50, z0 - 300, null); add(20, 48, 262, null);
  // C: 100 degrees at radius 190, 48 -> 237 m, then in under the wings
  const aEnd = a0 + TAU * (23.5 - G.PERIOD) / G.PERIOD;
  const ring = (da, r, y, t) => { const a = aEnd + da; add(r * Math.cos(a), y, -r * Math.sin(a), t); };
  const rc = o.climbRadius ?? 164;                      // 20 m off the wingtips: the arcade ahead stays inside the frame
  ring(-1.745, rc + 4, 48, 12.5); ring(-1.42, rc, 80, null); ring(-1.10, rc, 116, null); ring(-0.80, rc, 152, null); ring(-0.52, rc - 2, 186, null);
  ring(-0.27, rc - 10, 214, null); ring(-0.08, 134, 231, null);
  for (let i = 0; i < A.arcade.length - (o.arcadeSkip ?? 1); i++) { const q = A.arcade[i]; add(q.x, q.y + (o.arcadeDrop ?? -8), q.z, 23.5 + 1.1 * i); }
  { // the way out: one more point on the turn's own angle, further out and higher, timed to rise between two shells
    const [dt, r, dy] = o.exit ?? [0.1, 150, -16], b = hero.birdAt(29 + dt - G.PERIOD), k = r / G.R;
    add(b.x * k, b.y + dy, b.z * k, 29 + dt);
  }
  // E: out between two shells, wide, then up ABEAM of the living bird (a third of a second behind it), 50 m outside
  // the helix and 20 m under its keel. Any place behind the bird puts its newest shell nearer the lens than the bird
  // itself for half of every 1.6 s; abeam, the shell is born at the bird and left behind to the left, never nearer.
  // From below, the banked bird shows its whole underside against the sky at every phase of the beat, the ring
  // beyond and below its bill
  // each row: [clock t, seconds of the bird's track behind it, metres outside the helix, metres above its back]
  const E = o.E ?? LEG_E;
  for (const [t, lag, out, dy] of E) { const b = hero.birdAt(t - lag), r = (G.R + out) / G.R; add(b.x * r, hero.birdAt(t).y + dy, b.z * r, t); }
  const sy = A.portalSeat.position.y;
  for (const [x, dy, z] of (o.F ?? LEG_F)) add(x, sy + dy, z, null);
  add(0, sy, 110, o.tEnd ?? 45.7);
  return pts;
}
