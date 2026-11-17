// THE POLE THAT MUST NOT FALL: the great machine (track, cart, cradle, hinge, mast) and the style kit of
// the dawn print in flat inks. Read design/sb/newworld4/ptf-law.md first: it overrides everything here.
// kit: none; this file takes only makeRng from src/kit/core.js.
//
// AXES (the law's, not the usual "front toward +Z"): x east, y up, z south; the track runs along z through
// the origin; the mast leans north or south, so its broad side is seen from the west or the east. Place
// hero.object at the world's origin, unturned.
//
// THE CLOCK (plain functions of the time passed to update(); nothing reads u or the lens):
//   lean(t) radians, + = crown south;  cart(t) the hinge's z in metres;  cartSpeed(t);  mastPoint(s, t);
//   sisterPose(t, phase, L);  learnerPose(t, offset, out, ends) -> { angle, cart, phase, dust, side };
//   fallAngle(seconds), fallTime(), lieAngle();
//   constants PERIOD, TERMS, SUN, MAST_L, HINGE_Y, LEARNER.
//
// makeStyle(ctx, opts) -> one object the whole world shares (pass it back as opts.style):
//   edition 'first' | 'cold' | 'red' (opts.edition, else one draw from a fork of ctx.rng): inks and sky bands only
//   palette  linear THREE.Colors: salt, saltShade, shadow, redLead, redLeadShade, bone, boneShade, iron,
//            ironShade, brass, brassShade, timber, timberShade, periwinkle, plates[3], joint, brine, bands[6]
//            (bands[0] the highest and coolest .. bands[5] the horizon's), sun, ring1, ring2, far, range[2],
//            barUnder, barTop
//   inks     { lit, shade } pairs for the batcher: salt, red, bone, iron, brass, timber, cap
//   materials.ink       the one body material: a face shows its lit ink if its own normal faces the sun, else
//                       its shade ink; both inks ride on the vertices (attributes ink, shade), unlit, no fog
//   materials.inkWave   the same, plus attribute wave (vec3) * sin(uTime * 5 + phase): pennants, storks' wings
//   materials.inkFloor  the same, no depth written, both sides: floor layers and the sky
//   materials.shadow    one opaque shadow ink; the vertex is carried by its own body matrix, then through the
//                       flat-shadow matrix of the plane y 0 and the one fixed sun direction SUN (style.shadowMatrix);
//                       no depth written
//   uniforms { uSun, uTime, uShadow, uFlat };  update(dt, time) sets uTime (call it every frame)
//   order    fixed renderOrders: sky, floor, joints, brine, crust, shadow, body
//   batch(proxy?) -> Batch: tri, quad, box, bar, cyl, ball, slab, triW, quadW2, geometry(), await geometryIn(ctx); every face flat,
//                    two inks; a proxy batch keeps positions only (for shadows)
//   mesh(batchOrGeometry, material?)   shadowOf(batch | geometry | mesh)   pale(inkPair, f)   pair(lit, shade)
//   flat(hex)   shadowPoint(p)   makeSky({ radius, bars, moon })   await makeFloor({ radius, cell, count, rng }) (it hands
//   back to the page between its parts, so it gives a promise of the mesh)
//   buildLearnerParts(style, { pale, low }) and buildSisterParts(style, { pale }) (module exports) give the
//   geometries and shadow proxies of a learner (a plain cart on wheels on a track with a buffer post at each end, one
//   plain pole on one pin) and of a low sister in the same hand.
//
// buildHero(ctx, opts) -> { object, radius 230, height 535, center, anchors, style, parts, update(dt, time), ... }
//   opts.style     the shared style (else one is made from ctx and opts.palette / opts.edition)
//   opts.palette   seven hex strings in the brief's order: salt, salt shade, shadow, red lead, bone, iron shade, brass
//   opts.detail    0.6..1 (default ctx.quality.detail): thins the rivets only
//   opts.sky, opts.floor   default true: a preview sky (opts.skyRadius, default 5200) and plate floor are added
//                  to the hero's group; a world that builds its own passes false for both
//   opts.moon      the crescent in the preview sky (default ctx.vary.rare)
//   opts.storkScale  the storks' size against the 3.5 m span they are built at (default 1): the ring birds and the two
//                  standing in the nest
//   opts.flights   the ovals the storks' wedges fly: [{ oval: { x, y, z, dx, dz, len, r, speed, rise }, wedges: [[its
//                  place round the oval as a share 0..1, birds], ...], scale, gap }]. An oval is a straight of len m
//                  from (x, z) along the unit heading (dx, dz), a half round of radius r to its right, the straight
//                  back and a half round; the wedges are banked in the half rounds. Without it one oval beside the
//                  way out's last straight, south of the crown (opts.stringOval moves it, opts.stringGap sets the gap
//                  at scale 1) with three wedges
//   update(dt, time) poses everything from time alone: the cart group's z, the mast group's turn about the
//   hinge, 32 wheels, 8 coupling rods, dust puffs (scaled to nothing unless the cart is fast), storks.
//   Shadows are proxy meshes under the same groups as their bodies, so they move because the bodies move.
//   anchors (local = world): hinge, crown, ball, galleries, trackEnds, cartHalf, portalSeat { position, travel,
//   radius }, viewpoints, shadowFoot, shadowCrown, storkRings, storkFlights [{ length, reach, at(q, out) }].
//   Cost: about 58k triangles and 13 draw calls with the preview sky and floor (about 45k and 11 without);
//   no lights, no textures; four materials (instanced meshes compile their own variants of ink and inkWave).
import * as THREE from 'three';
import { makeRng } from '../kit/core.js';

// ---------------------------------------------------------------- the place in numbers (constants)
export const PERIOD = 120, W = (2 * Math.PI) / PERIOD, G = 9.81, MAST_L = 480, HINGE_Y = 44;
const DEG = Math.PI / 180;
// toward the sun: bearing 10 degrees north of east, 8 degrees up (x east, y up, z south)
export const SUN = new THREE.Vector3(Math.cos(8 * DEG) * Math.cos(10 * DEG), Math.sin(8 * DEG), -Math.cos(8 * DEG) * Math.sin(10 * DEG));
// the typed terms of the clock law: k (odd), amplitude in degrees, phase in radians
export const TERMS = [[5, 5.7, 0.0], [15, -0.40, 0.0], [3, 0.65, 0.4], [7, 0.55, 1.3]];

// lean of the great mast in radians at clock time t (seconds); positive = the crown leans south (+z)
export function lean(t) {
  let s = 0;
  for (let i = 0; i < TERMS.length; i++) { const k = TERMS[i]; s += k[1] * DEG * Math.sin(k[0] * W * t + k[2]); }
  return s;
}
// the hinge's z in metres at clock time t: the pole-on-a-cart answer to lean(t), term by term
export function cart(t) {
  let s = 0;
  for (let i = 0; i < TERMS.length; i++) { const k = TERMS[i], w = k[0] * W; s -= (G / (w * w) + (2 * MAST_L) / 3) * k[1] * DEG * Math.sin(w * t + k[2]); }
  return s;
}
// the cart's speed in m/s (the derivative of cart)
export function cartSpeed(t) {
  let s = 0;
  for (let i = 0; i < TERMS.length; i++) { const k = TERMS[i], w = k[0] * W; s -= (G / (w * w) + (2 * MAST_L) / 3) * k[1] * DEG * w * Math.cos(w * t + k[2]); }
  return s;
}
// a point s metres along the mast from the hinge, at clock time t, into out (Vector3)
export function mastPoint(s, t, out = new THREE.Vector3()) {
  const a = lean(t);
  return out.set(0, HINGE_Y + s * Math.cos(a), cart(t) + s * Math.sin(a));
}
// a sister machine sways by the same law with its own phase (seconds); returns { lean, cart } scaled to
// a mast of length L
export function sisterPose(t, phase = 0, L = MAST_L, out = {}) {
  out.lean = lean(t + phase); out.cart = cart(t + phase) * (L / MAST_L); return out;
}

// ---------------------------------------------------------------- a learner (law point 4)
// A track 80 m long running north to south, a pole 90 m from hinge to crown on a hinge 6 m up. Its cycle of
// 40 s: it balances, loses toward one end (the cart chases the lean to the buffer and stops there), lets go
// at 10 degrees, falls whole beyond that end, lies, and is winched upright while the cart rolls back.
export const LEARNER = { cycle: 40, balance: 12.6, fall: 7.4, lie: 8, winch: 12, dust: 3, L: 90, hingeY: 6, ball: 1.7, track: 80, reach: 31.5, letGo: 10 * DEG, runaway: 4 };
const L_END = Math.PI / 2 + Math.asin(LEARNER.hingeY / LEARNER.L);   // the pole lies with its crown on the floor
// the falling-rod table: the angle of a uniform rod let go at rest at 10 degrees, theta'' = 3 g sin(theta) / (2 L),
// stepped at 2 ms and kept every FALL_DT seconds until the crown is on the floor; read by the seconds since it let go
const FALL_DT = 0.02;
let fallTable = null, fallSeconds = 0;
function makeFallTable() {
  const k = (3 * G) / (2 * LEARNER.L), dt = 0.002, raw = [];
  let th = LEARNER.letGo, om = 0, n = 0;
  while (th < L_END && n < 40000) { if (n % 10 === 0) raw.push(th); om += k * Math.sin(th) * dt; th += om * dt; n++; }
  fallSeconds = n * dt; raw.push(L_END);
  fallTable = Float32Array.from(raw);
}
// the seconds the rod takes from letting go to the floor
export function fallTime() { if (!fallTable) makeFallTable(); return fallSeconds; }
// the lying angle, radians from upright
export function lieAngle() { return L_END; }
export function fallAngle(seconds) {          // radians from upright, the seconds counted from letting go
  if (!fallTable) makeFallTable();
  if (seconds >= fallSeconds) return L_END;
  const f = Math.max(0, seconds) / FALL_DT, j = Math.min(fallTable.length - 2, Math.floor(f));
  return Math.min(L_END, fallTable[j] + (fallTable[j + 1] - fallTable[j]) * (f - j));
}
// A learner's pose at clock time t with its own offset (seconds) and its own typed ends: ends[k] is +1 (south)
// or -1 (north), the end it loses toward in the k-th of its three cycles of the clock's period.
// angle: radians from upright about the hinge, positive toward +z (south) like the great mast's lean; cart:
// metres along its track from the middle, + south; phase: 0 balancing, 1 falling, 2 lying, 3 winched up;
// dust: 0..1 through the dust puff's 3 s (0 when there is none); side: the end this cycle loses toward.
const ONE_END = [1, 1, 1], SIDES = [-1, 1];
// the cart's run for a sway of pulse w: the same closed form as the great cart's, for a pole of LEARNER.L
const learnerGain = (w) => G / (w * w) + (2 * LEARNER.L) / 3;
export function learnerPose(t, offset = 0, out = {}, ends = ONE_END) {
  const C = LEARNER, tt = t + offset, n = Math.floor(tt / C.cycle), c = tt - n * C.cycle;
  const side = ends[((n % 3) + 3) % 3];
  const w1 = (2 * Math.PI) / 6.3, w2 = (2 * Math.PI) / 2.52;
  out.side = side; out.dust = 0;
  if (c < C.balance) {
    // the sway is zero at both ends of the balance; in its last seconds the lean runs away and the cart after it
    const r = Math.max(0, (c - (C.balance - C.runaway)) / C.runaway), e = Math.min(1, c / 1.5), ease = e * e * (3 - 2 * e) * (1 - r);
    const s1 = 2.3 * DEG * Math.sin(w1 * c), s2 = 0.7 * DEG * Math.sin(w2 * c);
    out.phase = 0;
    out.angle = (s1 + s2) * ease + side * C.letGo * r * r * (3 - 2 * r);
    out.cart = -(learnerGain(w1) * s1 + learnerGain(w2) * s2) * ease + side * C.reach * r * r;
  } else if (c < C.balance + fallTime()) {
    out.phase = 1; out.angle = side * fallAngle(c - C.balance); out.cart = side * C.reach;
  } else if (c < C.balance + C.fall + C.lie) {
    out.phase = 2; out.angle = side * L_END; out.cart = side * C.reach;
    const d = (c - C.balance - fallSeconds) / C.dust; out.dust = d < 1 ? Math.max(0.001, d) : 0;
  } else {
    const x = (c - C.balance - C.fall - C.lie) / C.winch, s = x * x * (3 - 2 * x);
    out.phase = 3; out.angle = side * L_END * (1 - x); out.cart = side * C.reach * (1 - s);
  }
  return out;
}

// ---------------------------------------------------------------- the batcher: flat-faced pieces in two inks
// Every face carries its lit ink and its shade ink on all three corners and its own face normal, so the
// material can pick one of the two by the sun and nothing is interpolated inside a face.
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3(), _n = new THREE.Vector3();
const _q = new THREE.Quaternion(), _m = new THREE.Matrix4(), _up = new THREE.Vector3(0, 1, 0);
export class Batch {
  constructor(proxy = false) { this.proxy = proxy; this.p = []; this.n = []; this.i = []; this.s = []; this.m = null; this.tris = 0; }
  // one triangle, corners counter-clockwise seen from outside; ink = { lit, shade }
  tri(ax, ay, az, bx, by, bz, cx, cy, cz, ink) {
    _a.set(ax, ay, az); _b.set(bx, by, bz); _c.set(cx, cy, cz);
    if (this.m) { _a.applyMatrix4(this.m); _b.applyMatrix4(this.m); _c.applyMatrix4(this.m); }
    this.p.push(_a.x, _a.y, _a.z, _b.x, _b.y, _b.z, _c.x, _c.y, _c.z); this.tris++;
    if (this.proxy) return;
    _n.set(_b.x - _a.x, _b.y - _a.y, _b.z - _a.z).cross(_c.sub(_a));
    const l = _n.length() || 1; _n.multiplyScalar(1 / l);
    const L = ink.lit, S = ink.shade;
    for (let k = 0; k < 3; k++) { this.n.push(_n.x, _n.y, _n.z); this.i.push(L.r, L.g, L.b); this.s.push(S.r, S.g, S.b); }
  }
  // a triangle whose corners also carry a wave vector and a phase: corner = [x, y, z, wx, wy, wz, phase]
  triW(A, B, C, ink) {
    this.tri(A[0], A[1], A[2], B[0], B[1], B[2], C[0], C[1], C[2], ink);
    if (!this.wv) { this.wv = []; this.ph = []; }
    for (const q of [A, B, C]) { this.wv.push(q[3], q[4], q[5]); this.ph.push(q[6]); }
  }
  // the same flat quad drawn on both sides (a ribbon, a wing): each side takes its own ink by the sun
  quadW2(A, B, C, D, ink) { this.triW(A, B, C, ink); this.triW(A, C, D, ink); this.triW(A, C, B, ink); this.triW(A, D, C, ink); }
  quad(a, b, c, d, ink) {            // four [x,y,z] corners, counter-clockwise seen from outside
    this.tri(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2], ink);
    this.tri(a[0], a[1], a[2], c[0], c[1], c[2], d[0], d[1], d[2], ink);
  }
  // a box by centre and full sizes; top/bottom may be skipped with caps = false
  box(cx, cy, cz, sx, sy, sz, ink, caps = true) {
    const x0 = cx - sx / 2, x1 = cx + sx / 2, y0 = cy - sy / 2, y1 = cy + sy / 2, z0 = cz - sz / 2, z1 = cz + sz / 2;
    this.quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], ink);
    this.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], ink);
    this.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], ink);
    this.quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], ink);
    if (caps) {
      this.quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], ink);
      this.quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], ink);
    }
  }
  // a square bar of width w between two points (a lattice member, a rail, a rod)
  bar(ax, ay, az, bx, by, bz, w, ink, h = w) {
    const dx = bx - ax, dy = by - ay, dz = bz - az, len = Math.hypot(dx, dy, dz) || 1e-3;
    _n.set(dx / len, dy / len, dz / len); _q.setFromUnitVectors(_up, _n);
    _m.compose(_a.set((ax + bx) / 2, (ay + by) / 2, (az + bz) / 2), _q, _b.set(1, 1, 1));
    const keep = this.m; this.m = keep ? keep.clone().multiply(_m) : _m.clone();
    this.box(0, 0, 0, w, len, h, ink, false); this.m = keep;
  }
  // a faceted cylinder or cone along an axis ('x','y','z'), centred, radii r0 (low end) and r1 (high end)
  cyl(cx, cy, cz, axis, r0, r1, len, seg, ink, caps = true, capInk = ink) {
    const P = (u, v, w) => (axis === 'y' ? [cx + u, cy + w, cz + v] : axis === 'x' ? [cx + w, cy + v, cz - u] : [cx + u, cy + v, cz + w]);
    const flip = axis === 'y';
    for (let k = 0; k < seg; k++) {
      const a0 = (k / seg) * Math.PI * 2, a1 = ((k + 1) / seg) * Math.PI * 2;
      const c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1), h = len / 2;
      const A = P(c0 * r0, s0 * r0, -h), B = P(c1 * r0, s1 * r0, -h), C = P(c1 * r1, s1 * r1, h), D = P(c0 * r1, s0 * r1, h);
      if (flip) this.quad(B, A, D, C, ink); else this.quad(A, B, C, D, ink);
      if (caps) {
        const T = P(0, 0, h), U = P(0, 0, -h);
        if (flip) { if (r1 > 0) this.tri(...T, ...C, ...D, capInk); if (r0 > 0) this.tri(...U, ...A, ...B, capInk); }
        else { if (r1 > 0) this.tri(...T, ...D, ...C, capInk); if (r0 > 0) this.tri(...U, ...B, ...A, capInk); }
      }
    }
  }
  // a faceted ball (rings x segments), every facet one flat face
  ball(cx, cy, cz, r, ink, rings = 6, seg = 10) {
    for (let j = 0; j < rings; j++) {
      const t0 = (j / rings) * Math.PI, t1 = ((j + 1) / rings) * Math.PI;
      for (let k = 0; k < seg; k++) {
        const a0 = (k / seg) * Math.PI * 2, a1 = ((k + 1) / seg) * Math.PI * 2;
        const p = (t, a) => [cx + r * Math.sin(t) * Math.cos(a), cy + r * Math.cos(t), cz + r * Math.sin(t) * Math.sin(a)];
        const A = p(t0, a0), B = p(t0, a1), C = p(t1, a1), D = p(t1, a0);
        if (j > 0) this.tri(...A, ...B, ...C, ink);
        if (j < rings - 1) this.tri(...A, ...C, ...D, ink);
      }
    }
  }
  // a flat slab: an outline of [u, v] points (counter-clockwise) in the plane named ('xy' or 'zy'),
  // at depth d0..d1 along the third axis; the two faces and the rim
  slab(pts, plane, d0, d1, ink, rimInk = ink) {
    const P = (u, v, d) => (plane === 'xy' ? [u, v, d] : [d, v, -u]);
    const tris = THREE.ShapeUtils.triangulateShape(pts.map((q) => new THREE.Vector2(q[0], q[1])), []);
    for (const t of tris) {
      const A = pts[t[0]], B = pts[t[1]], C = pts[t[2]];
      this.tri(...P(A[0], A[1], d1), ...P(B[0], B[1], d1), ...P(C[0], C[1], d1), ink);
      this.tri(...P(A[0], A[1], d0), ...P(C[0], C[1], d0), ...P(B[0], B[1], d0), ink);
    }
    for (let k = 0; k < pts.length; k++) {
      const A = pts[k], B = pts[(k + 1) % pts.length];
      this.quad(P(A[0], A[1], d1), P(A[0], A[1], d0), P(B[0], B[1], d0), P(B[0], B[1], d1), rimInk);
    }
  }
  geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    if (!this.proxy) {
      g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
      g.setAttribute('ink', new THREE.Float32BufferAttribute(this.i, 3));
      g.setAttribute('shade', new THREE.Float32BufferAttribute(this.s, 3));
    }
    if (this.wv) { g.setAttribute('wave', new THREE.Float32BufferAttribute(this.wv, 3)); g.setAttribute('phase', new THREE.Float32BufferAttribute(this.ph, 1)); }
    g.computeBoundingSphere();
    return g;
  }  // the same geometry of a big body batch (no waves), handing back to the page between its attributes
  async geometryIn(ctx) {
    const g = new THREE.BufferGeometry();
    for (const [name, arr] of this.proxy ? [['position', this.p]] : [['position', this.p], ['normal', this.n], ['ink', this.i], ['shade', this.s]]) {
      g.setAttribute(name, new THREE.Float32BufferAttribute(arr, 3)); await ctx.yield();
    }
    g.computeBoundingSphere();
    return g;
  }
}

// ---------------------------------------------------------------- the style kit
const EDITIONS = {
  first: { bands: ['#2B2A5E', '#5C4B8A', '#9A6F9E', '#D98BA0', '#F4B183', '#FBE3A6'], shadow: null, saltShade: null },
  cold: { bands: ['#27305E', '#4A5490', '#7F86B8', '#B9B6D2', '#E3DCC4', '#F3EDB8'], shadow: '#8C97CC', saltShade: '#C3CBE2' },
  red: { bands: ['#3A2350', '#6B3A78', '#A8527E', '#D96A78', '#F08A6B', '#F7C987'], shadow: '#A486BE', saltShade: null },
};
const DEFAULT_PALETTE = ['#F6EFE4', '#C9C3DE', '#9A93CC', '#D9482B', '#F2E6D0', '#23202B', '#E2B23A'];
const INK_VERT = /* glsl */`
attribute vec3 ink;
attribute vec3 shade;
uniform vec3 uSun;
varying vec3 vInk;
#ifdef WAVE
attribute vec3 wave;
attribute float phase;
uniform float uTime;
#endif
void main() {
  vec3 p = position;
  #ifdef WAVE
  p += wave * sin(uTime * 5.0 + phase);
  #endif
  mat4 m = modelMatrix;
  #ifdef USE_INSTANCING
  m = modelMatrix * instanceMatrix;
  #endif
  vec3 n = mat3(m) * normal;
  vInk = dot(n, uSun) > 0.0 ? ink : shade;
  gl_Position = projectionMatrix * viewMatrix * (m * vec4(p, 1.0));
}`;
const INK_FRAG = /* glsl */`
varying vec3 vInk;
void main() { gl_FragColor = vec4(vInk, 1.0); }`;
const SHADOW_VERT = /* glsl */`
uniform mat4 uFlat;
void main() {
  mat4 m = modelMatrix;
  #ifdef USE_INSTANCING
  m = modelMatrix * instanceMatrix;
  #endif
  vec4 w = m * vec4(position, 1.0);
  w.y = max(w.y, 0.0);
  w = uFlat * w;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const SHADOW_FRAG = /* glsl */`
uniform vec3 uShadow;
void main() { gl_FragColor = vec4(uShadow, 1.0); }`;

export function makeStyle(ctx, opts = {}) {
  const C = (h) => new THREE.Color(h);
  const pair = (lit, shade) => ({ lit: C(lit), shade: C(shade) });
  const flat = (h) => { const c = C(h); return { lit: c, shade: c }; };
  const pal = opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE;
  // the edition: one draw from a fork of the seed, unless the world names it
  const r = ctx.rng.fork('ptf-style'), pick = r();
  const edition = opts.edition || (pick < 0.5 ? 'first' : pick < 0.78 ? 'cold' : 'red');
  const ed = EDITIONS[edition] || EDITIONS.first;
  const inks = {
    salt: pair(pal[0], ed.saltShade || pal[1]), red: pair(pal[3], '#8F2F2A'), bone: pair(pal[4], '#9A9DBE'),
    iron: pair('#3A3540', pal[5]), brass: pair(pal[6], '#9C7430'), timber: pair('#D8B98A', '#94806F'),
    cap: pair('#B9BEEA', '#8A90C8'),
  };
  const palette = {
    salt: inks.salt.lit, saltShade: inks.salt.shade, shadow: C(ed.shadow || pal[2]), redLead: inks.red.lit, redLeadShade: inks.red.shade,
    bone: inks.bone.lit, boneShade: inks.bone.shade, iron: inks.iron.lit, ironShade: inks.iron.shade, brass: inks.brass.lit,
    brassShade: inks.brass.shade, timber: inks.timber.lit, timberShade: inks.timber.shade, periwinkle: inks.cap.lit,
    plates: [C(pal[0]), C('#F1E8DC'), C('#ECE2D8')], joint: C(ed.saltShade || pal[1]), brine: C(ed.bands[5]),
    bands: ed.bands.map(C), sun: C('#FFF6D8'), ring1: C('#FDEBBE'), ring2: C('#FADDA2'), far: C('#E9D8D2'),
    range: [C('#A9A4CF'), C('#8E8BC0')], barUnder: C(ed.bands[4]), barTop: C(ed.bands[1]).lerp(C(ed.bands[2]), 0.6),
  };
  const uniforms = { uSun: { value: SUN.clone() }, uTime: { value: 0 }, uShadow: { value: palette.shadow } };
  // the flat-shadow matrix of the plane y 0 and the sun's direction (lifted 3 cm clear of the floor layers)
  const shadowMatrix = new THREE.Matrix4().set(1, -SUN.x / SUN.y, 0, 0, 0, 0, 0, 0.03, 0, -SUN.z / SUN.y, 1, 0, 0, 0, 0, 1);
  uniforms.uFlat = { value: shadowMatrix };
  const order = { sky: -0.9, floor: -0.8, joints: -0.75, brine: -0.7, crust: -0.65, shadow: -0.5, body: 0 };
  const ink = new THREE.ShaderMaterial({ uniforms: { uSun: uniforms.uSun }, vertexShader: INK_VERT, fragmentShader: INK_FRAG });
  const inkWave = new THREE.ShaderMaterial({ uniforms: { uSun: uniforms.uSun, uTime: uniforms.uTime }, defines: { WAVE: 1 }, vertexShader: INK_VERT, fragmentShader: INK_FRAG });
  const inkFloor = new THREE.ShaderMaterial({ uniforms: { uSun: uniforms.uSun }, vertexShader: INK_VERT, fragmentShader: INK_FRAG, depthWrite: false, side: THREE.DoubleSide });
  const shadow = new THREE.ShaderMaterial({ uniforms: { uFlat: uniforms.uFlat, uShadow: uniforms.uShadow }, vertexShader: SHADOW_VERT, fragmentShader: SHADOW_FRAG, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 });
  const style = {
    edition, palette, inks, uniforms, sun: SUN, shadowMatrix, order,
    materials: { ink, inkWave, inkFloor, shadow },
    pair, flat,
    // an ink pair paled toward the far tint by f (0.45 beyond 900 m, 0.65 for the far sisters), fixed at build
    pale(p, f) { return { lit: p.lit.clone().lerp(palette.far, f), shade: p.shade.clone().lerp(palette.far, f) }; },
    batch(proxy = false) { return new Batch(proxy); },
    // a body mesh from a batch or a geometry, in the two-ink material
    mesh(b, material = ink) { const m = new THREE.Mesh(b.isBufferGeometry ? b : b.geometry(), material); m.renderOrder = order.body; return m; },
    // the cast shadow of a proxy (a batch, a geometry or a mesh): add it under the same parent as its body
    shadowOf(b) {
      const g = b.isMesh ? b.geometry : b.isBufferGeometry ? b : b.geometry();
      const m = b.isInstancedMesh ? new THREE.InstancedMesh(g, shadow, b.count) : new THREE.Mesh(g, shadow);
      if (b.isInstancedMesh) m.instanceMatrix = b.instanceMatrix;
      m.renderOrder = order.shadow; m.frustumCulled = false; return m;
    },
    // where the shadow of a world point falls on the floor
    shadowPoint(p, out = new THREE.Vector3()) { return out.set(p.x - (SUN.x / SUN.y) * p.y, 0, p.z - (SUN.z / SUN.y) * p.y); },
    update(dt, time) { uniforms.uTime.value = time; },
  };
  style.makeSky = (o = {}) => makeSky(style, ctx, o);
  style.makeFloor = (o = {}) => makeFloor(style, ctx, o);
  return style;
}

// ---------------------------------------------------------------- the built sky (fixed about the origin)
// Flat bands on a shell of radius o.radius: each band one ink between two hard edges that are level rings
// tipped up toward the sun (an edge stands highest in the sun's bearing and lowest opposite it); then the two rings and the sun disc, the dawn bars,
// the low blue range in the north and west, and (o.moon) a thin crescent in the west. One mesh, painted in
// that order with no depth written; nothing in it follows the lens.
function makeSky(style, ctx, o = {}) {
  const R = o.radius ?? 9500, P = style.palette, b = new Batch(), rng = (o.rng || ctx.rng).fork('ptf-sky');
  const az0 = Math.atan2(SUN.z, SUN.x), f = (c) => ({ lit: c, shade: c });
  const dir = (az, el, rad = R) => [rad * Math.cos(el) * Math.cos(az), rad * Math.sin(el), rad * Math.cos(el) * Math.sin(az)];
  const east = [5, 12, 22, 36, 55], west = [0, 0, 2, 7, 16];
  const lean01 = (d) => (1 - Math.cos(d * DEG)) / 2;                 // 0 toward the sun, 1 opposite it
  const edge = (k, d) => (k < 0 ? -4 : k > 4 ? 90 : east[k] + (west[k] - east[k]) * lean01(d)) * DEG;
  for (let k = 5; k >= 0; k--) {           // k 0 the highest band (bands[0]), 5 the lowest (bands[5])
    const ink = f(P.bands[k]);
    for (let c = -36; c < 36; c++) {
      const d0 = c * 5, d1 = d0 + 5, lo0 = edge(4 - k, d0), lo1 = edge(4 - k, d1), hi0 = edge(5 - k, d0), hi1 = edge(5 - k, d1);
      if (hi0 - lo0 < 1e-5 && hi1 - lo1 < 1e-5) continue;
      b.quad(dir(az0 + d0 * DEG, lo0), dir(az0 + d1 * DEG, lo1), dir(az0 + d1 * DEG, hi1), dir(az0 + d0 * DEG, hi0), ink);
    }
  }
  // the sun: two flat rings and the disc, in the plane square to the sun's direction
  const ux = new THREE.Vector3(-SUN.z, 0, SUN.x).normalize(), uy = new THREE.Vector3().crossVectors(SUN, ux).normalize();
  const disc = (centre, rad, ink, n = 40) => {
    for (let k = 0; k < n; k++) {
      const a0 = (k / n) * Math.PI * 2, a1 = ((k + 1) / n) * Math.PI * 2;
      const p0 = centre.clone().addScaledVector(ux, Math.cos(a0) * rad).addScaledVector(uy, Math.sin(a0) * rad);
      const p1 = centre.clone().addScaledVector(ux, Math.cos(a1) * rad).addScaledVector(uy, Math.sin(a1) * rad);
      b.tri(centre.x, centre.y, centre.z, p0.x, p0.y, p0.z, p1.x, p1.y, p1.z, ink);
    }
  };
  const sc = SUN.clone().multiplyScalar(R * 0.995);
  disc(sc, Math.tan(5 * DEG) * R, f(P.ring2)); disc(sc, Math.tan(3 * DEG) * R, f(P.ring1)); disc(sc, Math.tan(1.6 * DEG) * R, f(P.sun));
  // the dawn bars: two-ink lens slabs standing square to the origin, thickest toward the sun; seen from the origin
  // no bar's end comes within 16 degrees of the sun's bearing
  const bars = o.bars ?? (rng.chance(0.5) ? 14 : 20);
  for (let n = 0; n < bars; n++) {
    const sgn = rng.sign(), dd = (24 + 139 * Math.pow(rng(), 1.7)) * DEG * sgn, k = R / 9500, far = rng.range(3000, 8000) * k, up = rng.range(900, 2400) * k;
    const len = Math.min(rng.range(600, 1400) * k * (1.25 - Math.abs(dd) / Math.PI * 0.6), far * Math.tan(Math.min(60 * DEG, Math.abs(dd) - 16 * DEG))), th = rng.range(130, 260) * k * (1.2 - Math.abs(dd) / Math.PI * 0.5);
    const az = az0 + dd, cx = Math.cos(az) * far, cz = Math.sin(az) * far, tx = -Math.sin(az), tz = Math.cos(az), N = 9;
    for (let k = 0; k < N; k++) {
      const u0 = -1 + (2 * k) / N, u1 = -1 + (2 * (k + 1)) / N, h0 = 1 - u0 * u0, h1 = 1 - u1 * u1;
      const x0 = cx + tx * u0 * len, z0 = cz + tz * u0 * len, x1 = cx + tx * u1 * len, z1 = cz + tz * u1 * len;
      b.quad([x0, up, z0], [x1, up, z1], [x1, up + th * 0.55 * h1, z1], [x0, up + th * 0.55 * h0, z0], f(P.barTop));
      b.quad([x0, up - th * 0.45 * h0, z0], [x1, up - th * 0.45 * h1, z1], [x1, up, z1], [x0, up, z0], f(P.barUnder));
    }
  }
  // the low blue range on the horizon, north and west: two flat saw-edged layers
  for (let layer = 0; layer < 2; layer++) {
    const rad = R * (0.97 - layer * 0.02), ph = rng.range(0, 6), ink = f(P.range[layer]), a0 = 160 + layer * 14, a1 = 305 - layer * 22;
    const h = (a) => { const e = Math.min(1, (a - a0) / 18, (a1 - a) / 18); return Math.max(0, e) * (layer ? 150 : 250) * (0.55 + 0.3 * Math.abs(Math.sin(a * 0.31 + ph)) + 0.3 * Math.abs(Math.sin(a * 0.83 + ph * 2)) + 0.12 * Math.sin(a * 2.3 + ph)); };
    for (let a = a0; a < a1; a += 1) {
      const p0 = dir(a * DEG, 0, rad), p1 = dir((a + 1) * DEG, 0, rad);
      b.quad([p0[0], -30, p0[2]], [p1[0], -30, p1[2]], [p1[0], h(a + 1), p1[2]], [p0[0], h(a), p0[2]], ink);
    }
  }
  if (o.moon) {                              // a thin flat crescent low in the west, 12 degrees south of the bearing opposite the sun, with its pale ring
    const m = new THREE.Vector3(...dir(az0 + 168 * DEG, 4.5 * DEG, R * 0.99)), rm = Math.tan(1 * DEG) * R, ink = f(new THREE.Color('#EFEAF4'));
    const mx = new THREE.Vector3(-m.z, 0, m.x).normalize(), my = new THREE.Vector3().crossVectors(m, mx).normalize().negate();
    const at = (x, y) => m.clone().addScaledVector(mx, x * rm).addScaledVector(my, y * rm).toArray();
    for (let k = 0; k < 16; k++) {
      const t0 = -Math.PI / 2 + (k / 16) * Math.PI, t1 = -Math.PI / 2 + ((k + 1) / 16) * Math.PI;
      b.quad(at(Math.cos(t0) * 0.55, Math.sin(t0)), at(Math.cos(t0), Math.sin(t0)), at(Math.cos(t1), Math.sin(t1)), at(Math.cos(t1) * 0.55, Math.sin(t1)), ink);
    }
    for (let k = 0; k < 32; k++) {
      const t0 = (k / 32) * Math.PI * 2, t1 = ((k + 1) / 32) * Math.PI * 2;
      b.quad(at(Math.cos(t0) * 1.5, Math.sin(t0) * 1.5), at(Math.cos(t0) * 1.65, Math.sin(t0) * 1.65), at(Math.cos(t1) * 1.65, Math.sin(t1) * 1.65), at(Math.cos(t1) * 1.5, Math.sin(t1) * 1.5), ink);
    }
  }
  const mesh = new THREE.Mesh(b.geometry(), style.materials.inkFloor);
  mesh.renderOrder = style.order.sky; mesh.frustumCulled = false;
  return mesh;
}

// ---------------------------------------------------------------- a plain plate floor (the plane y 0)
// The salt as one white disc of radius o.radius, laid all over with great flat plates in three close whites on a
// lilac underlay that shows as their joints. The plates are one hand-shaken grid whose cells grow with distance
// from the origin by the call's radius, cell and count (o.cell across at the origin; in the world's call about four times
// as long outward and twice as broad at the rim), and so do the joints, out to
// o.jointEnd m (default 3400), beyond which the plates lie edge to edge; all fixed at build.
async function makeFloor(style, ctx, o = {}) {
  const R = o.radius ?? 9000, cell = o.cell ?? 170, P = style.palette, b = new Batch(), rng = (o.rng || ctx.rng).fork('ptf-floor');
  const f = (c) => ({ lit: c, shade: c }), white = f(P.plates[0]), joint = f(P.joint);
  for (let k = 0; k < 64; k++) {
    const a0 = (k / 64) * Math.PI * 2, a1 = ((k + 1) / 64) * Math.PI * 2;
    b.tri(0, 0, 0, Math.cos(a1) * R, 0, Math.sin(a1) * R, Math.cos(a0) * R, 0, Math.sin(a0) * R, white);
  }
  // a grid point r metres out on the even grid lies r (1 + (r / A)^2) metres out on the floor
  const n = o.count ?? 32, r1 = n * cell, A = r1 / Math.sqrt(Math.max(0.01, R / r1 - 1)), pts = [];
  for (let j = -n; j <= n; j++) for (let i = -n; i <= n; i++) {
    const x = (i + rng.range(-0.3, 0.3)) * cell, z = (j + rng.range(-0.3, 0.3)) * cell, r = Math.hypot(x, z), s = 1 + (r / A) * (r / A);
    pts.push([x * s, z * s]);
  }
  const at = (i, j) => pts[(j + n) * (2 * n + 1) + (i + n)], under = [], tops = [], JOINT_END = o.jointEnd ?? 3400;
  await ctx.yield();
  for (let j = -n; j < n; j++) for (let i = -n; i < n; i++) {
    if (i === -n && (j + n) % 22 === 21) await ctx.yield();
    const q = [at(i, j), at(i, j + 1), at(i + 1, j + 1), at(i + 1, j)], cx = (q[0][0] + q[1][0] + q[2][0] + q[3][0]) / 4, cz = (q[0][1] + q[1][1] + q[2][1] + q[3][1]) / 4;
    const d = Math.hypot(cx, cz), ink = f(P.plates[rng.int(0, 2)]);
    if (Math.max(Math.hypot(q[0][0], q[0][1]), Math.hypot(q[1][0], q[1][1]), Math.hypot(q[2][0], q[2][1]), Math.hypot(q[3][0], q[3][1])) > R - 20) continue;
    const inset = d > JOINT_END ? 0 : 1 + d / 300 + 3.5 * (d / 1000) * (d / 1000);
    under.push(q); tops.push([q.map((p) => { const w = Math.min(0.4, inset / Math.max(1, Math.hypot(cx - p[0], cz - p[1]))); return [p[0] + (cx - p[0]) * w, p[1] + (cz - p[1]) * w]; }), ink]);
  }
  await ctx.yield();
  for (const q of under) b.quad([q[0][0], 0, q[0][1]], [q[1][0], 0, q[1][1]], [q[2][0], 0, q[2][1]], [q[3][0], 0, q[3][1]], joint);
  await ctx.yield();
  for (const [q, ink] of tops) b.quad([q[0][0], 0, q[0][1]], [q[1][0], 0, q[1][1]], [q[2][0], 0, q[2][1]], [q[3][0], 0, q[3][1]], ink);
  await ctx.yield();
  const mesh = new THREE.Mesh(b.geometry(), style.materials.inkFloor);
  mesh.renderOrder = style.order.floor; mesh.frustumCulled = false;
  return mesh;
}

// ---------------------------------------------------------------- the great track (fixed)
// bed z -137..+137, rails to 134; 26 m wide across the deck plates (the bed 31 m at its foot): a pale bed 2 m high, nine
// iron deck plates, eight rails, a buffer stop at each end.
const RAIL_X = [2, 4.5, 8, 12.5], RAIL_TOP = 3.2, WHEEL_R = 3, AXLE_Y = RAIL_TOP + WHEEL_R;
function buildTrack(S, b, sb) {
  const I = S.inks;
  b.slab([[-15.5, 0], [15.5, 0], [13.4, 2], [-13.4, 2]], 'xy', -137, 137, I.salt);
  for (let k = -4; k <= 4; k++) b.box(0, 2.25, k * 30, 26, 0.5, 28, I.iron);      // nine iron deck plates, the pale bed between
  // an outer rail (the last of RAIL_X) ends at its crown's underside, 0.11 m lower, so that no two upward faces lie a centimetre apart
  for (const x of RAIL_X) for (const s of [-1, 1]) { const low = x === RAIL_X[3] ? 0.11 : 0; b.box(s * x, 2.85 - low / 2, 0, 0.9, 0.7 - low, 268, I.iron); }
  for (const s of [-1, 1]) b.box(s * 12.5, 3.15, 0, 1.5, 0.12, 268, I.bone);      // the worn crown of each outer rail
  sb.box(0, 1, 0, 28, 2, 274, null);
  for (const e of [-1, 1]) {                                          // buffer stops, 8 m long and 9 m high
    const z = e * 130;
    b.m = new THREE.Matrix4().makeTranslation(0, 0, z); if (e < 0) b.m.multiply(new THREE.Matrix4().makeRotationY(Math.PI));
    b.slab([[-4, 2], [4, 2], [4, 3.2], [1.2, 9], [-0.6, 9], [-0.6, 6.4], [-4, 3.4]], 'zy', -13, 13, I.iron);
    for (const x of [-12.5, -8, 8, 12.5]) {                           // brass buffer heads on plungers
      b.cyl(x, 6.2, -1.8, 'z', 0.55, 0.55, 2.4, 8, I.iron, false);
      b.cyl(x, 6.2, -3.2, 'z', 1.5, 1.5, 0.5, 12, I.brass);
    }
    for (let x = -12; x <= 12.01; x += 4) b.bar(x, 3.2, 4, x, 8.6, 1.2, 0.6, I.red);   // raking struts
    b.box(0, 9.3, 0.3, 26.6, 0.6, 2.2, I.red);
    b.m = null;
    sb.box(0, 4.5, z, 26, 9, 8, null);
  }
}

// ---------------------------------------------------------------- the cart (rides at z = cart(t))
// 90 m long (z -45..+45 about the hinge), 34 m wide, deck at 20, houses to 38, trunnion towers to 50.
function rivetRow(b, ink, x, y, z0, z1, nx, step = 1.8, size = 0.6) {
  step /= b.detail || 1;
  for (let z = z0; z <= z1 + 1e-3; z += step) b.box(x + nx * size * 0.3, y, z, size, size, size, ink);
}
async function buildHull(S, b, sb, ctx) {
  const I = S.inks;
  b.box(0, 7.3, 0, 12, 5.6, 86, I.iron);                              // the belly between the wheel rows
  b.slab([[-13, 10], [13, 10], [13, 14], [17, 17], [17, 20], [-17, 20], [-17, 17], [-13, 14]], 'xy', -45, 45, I.iron);
  sb.box(0, 15, 0, 34, 10, 90, null); sb.box(0, 6.5, 0, 26, 7, 84, null);
  for (const s of [-1, 1]) {
    b.box(s * 17.15, 17.1, 0, 0.5, 0.5, 90.4, I.brass);               // the brass strake at the knuckle
    for (let z = -45; z <= 45.01; z += 7.5) {                         // plate seams as raised straps
      b.box(s * 17.1, 18.6, z, 0.5, 2.8, 0.8, I.iron);
      b.bar(s * 13.1, 10.2, z, s * 13.1, 13.9, z, 0.5, I.iron, 0.8);
      b.bar(s * 13.12, 14.05, z, s * 17.02, 16.95, z, 0.5, I.iron, 0.8);
      if (z < 44) port(b, I, s * 17, 18.65, z + 3.75, s, 0, 0.6);
    }
    rivetRow(b, I.iron, s * 17, 19.5, -44.2, 44.2, s); rivetRow(b, I.iron, s * 17, 17.8, -44.2, 44.2, s);
    rivetRow(b, I.iron, s * 13, 13.4, -44.2, 44.2, s); rivetRow(b, I.iron, s * 13, 10.6, -44.2, 44.2, s);
    for (const z of [-24.4, 20.6]) {                                    // ladders down the flank from the knuckle
      for (const dz of [-0.5, 0.5]) b.box(s * 13.3, 12.2, z + dz, 0.2, 4.4, 0.2, I.brass);
      for (let y = 10.6; y < 14.2; y += 0.9) b.box(s * 13.3, y, z, 0.16, 0.16, 1, I.brass);
    }
    b.cyl(s * 13.75, 11.9, 0, 'z', 0.55, 0.55, 78, 8, I.brass);       // a long brass pipe under the knuckle
    for (let z = -36; z <= 36.01; z += 12) b.box(s * 13.4, 11.9, z, 0.9, 1.5, 0.7, I.iron);
    for (let z = -44.6; z <= 44.61; z += 4.46) b.box(s * 16.7, 20.85, z, 0.3, 1.7, 0.3, I.iron);     // rail posts
    b.box(s * 16.7, 21.75, 0, 0.36, 0.36, 89.6, I.brass); b.box(s * 16.7, 20.9, 0, 0.22, 0.22, 89.6, I.iron);
    for (const e of [-1, 1]) {                                        // bogie frames between the wheel rows
      for (const zc of [14, 36]) {
        const z = e * zc;
        b.m = new THREE.Matrix4().makeTranslation(0, 0, z);
        b.slab([[-7.2, 5.3], [7.2, 5.3], [7.2, 6.8], [4.4, 8.4], [-4.4, 8.4], [-7.2, 6.8]], 'zy', s * 10.25 - 0.45, s * 10.25 + 0.45, I.iron);
        b.m = null;
        b.box(s * 10.25, 9.2, z, 1.6, 1.8, 3.2, I.iron);
      }
    }
    await ctx.yield();
  }
  for (const e of [-1, 1]) {                                          // the two ends
    const z = e * 45;
    for (let x = -16.2; x <= 16.21; x += 1.62) b.box(x, 19.5, z + e * 0.12, 0.42, 0.42, 0.42, I.iron);
    for (let x = -16; x <= 16.01; x += 4) b.box(x, 20.85, e * 44.7, 0.3, 1.7, 0.3, I.iron);
    b.box(0, 21.75, e * 44.7, 33.4, 0.36, 0.36, I.brass);
    for (const x of [-12.5, -8, 8, 12.5]) {                           // buffer faces to meet the stops
      b.cyl(x, 6.2, e * 46, 'z', 0.6, 0.6, 2, 8, I.iron, false); b.cyl(x, 6.2, e * 47.2, 'z', 1.5, 1.5, 0.5, 12, I.brass);
      // sand box and scraper at the leading wheel
      if (Math.abs(x) > 10) { b.box(x, 9.3, e * 43.6, 2.2, 2.2, 2.4, I.brass); b.bar(x, 8.2, e * 44.2, x, 3.6, e * 46.6, 0.5, I.iron, 1.6); }
    }
    b.box(0, 8.6, e * 44.4, 30, 3.2, 1.2, I.iron);                    // the headstock
  }
}

// a round port: a brass ring standing proud of a wall with a dark glass, facing along x (nx) or z (nz)
function port(b, I, x, y, z, nx, nz, r = 0.95) {
  const dark = { lit: I.iron.shade, shade: I.iron.shade };
  if (nx) { b.cyl(x + nx * 0.2, y, z, 'x', r, r, 0.4, 10, I.brass, false); b.cyl(x + nx * 0.12, y, z, 'x', r * 0.72, r * 0.72, 0.3, 10, dark, true); }
  else { b.cyl(x, y, z + nz * 0.2, 'z', r, r, 0.4, 10, I.brass, false); b.cyl(x, y, z + nz * 0.12, 'z', r * 0.72, r * 0.72, 0.3, 10, dark, true); }
}
// a still figure about 1.8 m tall standing at (x, y, z), turned by yaw; pose 0..3 changes the arms (pose 2 also sets one foot forward)
function figure(b, I, x, y, z, yaw, pose, top) {
  const keep = b.m, m = new THREE.Matrix4().makeTranslation(x, y, z).multiply(new THREE.Matrix4().makeRotationY(yaw));
  b.m = keep ? keep.clone().multiply(m) : m;
  const fl = (c) => ({ lit: c.lit, shade: c.shade }), legs = fl(I.iron), skin = fl(I.timber);
  b.box(-0.14, 0.45, 0, 0.2, 0.9, 0.24, legs); b.box(0.14, 0.45, pose === 2 ? 0.12 : 0, 0.2, 0.9, 0.24, legs);
  b.box(0, 1.2, 0, 0.56, 0.62, 0.3, top);
  b.box(0, 1.66, 0.02, 0.24, 0.26, 0.24, skin);
  if (pose === 0) { b.bar(-0.33, 1.45, 0, -0.36, 1.0, 0.34, 0.14, top); b.bar(0.33, 1.45, 0, 0.36, 1.0, 0.34, 0.14, top); }        // hands on the rail
  else if (pose === 1) { b.bar(-0.33, 1.45, 0, -0.4, 0.85, 0, 0.14, top); b.bar(0.33, 1.45, 0, 0.62, 1.72, 0.5, 0.14, top); }     // one arm shading the eyes
  else if (pose === 2) { b.bar(-0.33, 1.45, 0, -0.1, 1.1, 0.3, 0.14, top); b.bar(0.33, 1.45, 0, 0.1, 1.1, 0.3, 0.14, top); }      // arms folded
  else { b.bar(-0.33, 1.45, 0, -0.42, 0.85, 0, 0.14, top); b.bar(0.33, 1.45, 0, 0.75, 1.5, 0.55, 0.14, top); }                   // pointing out
  b.m = keep;
}

// deck houses at both ends, funnels, stairs, and the two trunnion towers of the cradle
async function buildDeck(S, b, sb, rng, ctx) {
  const I = S.inks, FUN = [];
  for (const e of [-1, 1]) {
    const zc = e * 32.5;
    b.box(0, 26, zc, 24, 12, 21, I.iron);                             // lower storey, deck 20 to 32
    b.box(0, 32.3, zc, 25.4, 0.6, 22.4, I.iron);                      // its flat roof, with a brass edge all round
    for (const q of [-1, 1]) { b.box(q * 12.75, 32.3, zc, 0.3, 0.75, 22.7, I.brass); b.box(0, 32.3, zc + q * 11.25, 25.8, 0.75, 0.3, I.brass); }
    b.box(0, 35, e * 33.5, 17, 5.4, 14, I.iron);                      // upper storey to 38
    b.box(0, 37.85, e * 33.5, 18.4, 0.5, 15.4, I.iron);               // the upper flat roof
    for (const q of [-1, 1]) { b.box(q * 9.25, 37.85, e * 33.5, 0.3, 0.65, 15.7, I.brass); b.box(0, 37.85, e * 33.5 + q * 7.75, 18.8, 0.65, 0.3, I.brass); }
    for (const q of [-1, 1]) {                                        // deck furniture: hatches with brass coamings, cowl vents, bollards
      b.box(q * 13.6, 20.5, e * 17.2, 4.4, 1, 5.4, I.iron); b.box(q * 13.6, 21.05, e * 17.2, 4.8, 0.2, 5.8, I.brass);
      b.cyl(q * 14.2, 21.6, e * 8, 'y', 0.5, 0.5, 3.2, 8, I.iron, false); b.cyl(q * 14.2, 23.5, e * 8 - e * 0.3, 'z', 0.95, 0.6, 1.5, 9, I.brass, true, { lit: I.iron.shade, shade: I.iron.shade });
      for (const dz of [2, 5]) b.cyl(q * 15.4, 20.6, e * dz * 4.2, 'y', 0.45, 0.6, 1.2, 8, I.iron);
      for (let k = 0; k < 3; k++) b.box(q * 3.2, 32.9, zc - 7 + k * 4.6, 2.6, 0.7, 3, I.iron);    // skylights on the lower roof
    }
    sb.box(0, 29, zc, 24, 18, 21, null);
    for (const s of [-1, 1]) {
      for (let k = -3; k <= 3; k++) { port(b, I, s * 12, 28.6, zc + k * 2.9, s, 0, 0.8); if (k % 2) port(b, I, s * 12, 24.2, zc + k * 2.9, s, 0, 0.7); }
      for (let k = -2; k <= 2; k++) port(b, I, s * 8.5, 35.2, e * 33.5 + k * 2.7, s, 0, 0.7);
      rivetRow(b, I.iron, s * 12, 21.2, zc - 9.6, zc + 9.6, s, 1.6, 0.36); rivetRow(b, I.iron, s * 12, 31, zc - 9.6, zc + 9.6, s, 1.6, 0.36);
      b.box(s * 12.1, 24.4, zc - e * 7, 0.3, 4.4, 2.2, I.timber);      // a plain timber door
      // funnel: a tapered brass stack with an iron band and a flared lip
      const fx = s * 5.5, fz = e * 36.5;
      b.cyl(fx, 41.6, fz, 'y', 1.7, 1.35, 7.2, 12, I.brass, false); b.cyl(fx, 43.4, fz, 'y', 1.52, 1.5, 0.7, 12, I.iron, false);
      b.cyl(fx, 45.5, fz, 'y', 1.35, 1.9, 0.9, 12, I.brass, false); b.cyl(fx, 45.9, fz, 'y', 1.3, 1.3, 0.1, 12, { lit: I.iron.shade, shade: I.iron.shade });
      b.cyl(fx, 38.3, fz, 'y', 2.2, 1.8, 0.6, 12, I.iron);
      FUN.push([fx, 46, fz]);
      sb.box(fx, 42, fz, 3, 8, 3, null);
    }
    for (let k = -3; k <= 3; k++) port(b, I, k * 3.1, 28.6, zc - e * 10.5, 0, -e, 0.8);     // ports looking at the cradle
    for (let k = -3; k <= 3; k++) port(b, I, k * 3.1, 27.4, zc + e * 10.5, 0, e, 0.8);
    for (let k = -2; k <= 2; k++) { port(b, I, k * 3, 35.2, e * 33.5 - e * 7, 0, -e, 0.7); port(b, I, k * 3, 35.2, e * 33.5 + e * 7, 0, e, 0.7); }
    // a stair from the deck up to the lower roof, on the wall that faces the cradle
    b.m = new THREE.Matrix4().makeTranslation(0, 0, zc - e * 10.5); if (e > 0) b.m.multiply(new THREE.Matrix4().makeRotationY(Math.PI));
    b.bar(-11.2, 20, 1.3, -1.2, 32, 1.3, 0.5, I.brass, 2.2);
    for (let k = 1; k < 12; k++) b.box(-11.2 + k * 0.833, 20 + k * 1.0 + 0.1, 1.3, 0.9, 0.24, 2.3, I.iron);
    b.m = null;
    // two figures on deck by the cradle
    figure(b, I, e * 6 + rng.range(-1.5, 1.5), 20, e * 15.5, e > 0 ? Math.PI : 0, e > 0 ? 3 : 1, e > 0 ? I.bone : I.timber);
    await ctx.yield();
  }
  // the cradle: two trunnion towers, 4 m thick, 8..12 m east and west of the centre line, heads round the hinge at 44
  const out = [[13, 20], [-13, 20], [-6.3, 40.5]];
  for (let k = 0; k <= 8; k++) { const a = (206 - k * 29) * DEG; out.push([Math.cos(a) * 6.6, 44 + Math.sin(a) * 6.6]); }
  out.push([6.3, 40.5]); out.reverse();
  for (const s of [-1, 1]) {
    b.slab(out, 'zy', s * 10 - 2, s * 10 + 2, I.iron);
    sb.box(s * 10, 27, 0, 4, 14, 22, null); sb.box(s * 10, 42, 0, 4, 17, 12.6, null);
    const xo = s * 12, xi = s * 8;
    for (const x of [xo, xi]) {                                       // stiffening ribs and rivets as relief
      const nx = x === xo ? s : -s;
      b.bar(x + nx * 0.15, 20.4, -12.4, x + nx * 0.15, 40.4, -6.1, 0.3, I.iron, 0.9); b.bar(x + nx * 0.15, 20.4, 12.4, x + nx * 0.15, 40.4, 6.1, 0.3, I.iron, 0.9);
      b.box(x + nx * 0.15, 20.6, 0, 0.3, 0.9, 25, I.iron);
      b.bar(x + nx * 0.12, 21, -9.5, x + nx * 0.12, 37.5, 0, 0.24, I.brass, 0.6); b.bar(x + nx * 0.12, 21, 9.5, x + nx * 0.12, 37.5, 0, 0.24, I.brass, 0.6);
      b.cyl(x + nx * 0.25, 44, 0, 'x', 5.2, 5.2, 0.5, 16, I.brass, true);            // the bearing ring
      for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2 + 0.3; b.box(x + nx * 0.5, 44 + Math.sin(a) * 4.4, Math.cos(a) * 4.4, 0.4, 1.3, 1.3, I.iron); }
    }
    b.cyl(s * 13.1, 44, 0, 'x', s > 0 ? 3.3 : 2.2, s > 0 ? 2.2 : 3.3, 1.8, 14, I.cap, true);     // the periwinkle hinge cap
  }
  return FUN;
}

// one great wheel, 6 m across, its axle along x: a broad brass tyre (1.15 m of the radius) and spokes, iron hub, a crank pin through it
function buildWheel(S) {
  const I = S.inks, b = new Batch(), N = 20, ro = WHEEL_R, ri = 1.85, w = 0.65;
  for (let k = 0; k < N; k++) {
    const a0 = (k / N) * Math.PI * 2, a1 = ((k + 1) / N) * Math.PI * 2, c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
    const P = (r, c, s, x) => [x, s * r, -c * r];
    b.quad(P(ro, c0, s0, -w), P(ro, c1, s1, -w), P(ro, c1, s1, w), P(ro, c0, s0, w), I.brass);      // tread
    b.quad(P(ri, c1, s1, -w), P(ri, c0, s0, -w), P(ri, c0, s0, w), P(ri, c1, s1, w), I.brass);      // inside of the tyre
    b.quad(P(ri, c0, s0, -w), P(ri, c1, s1, -w), P(ro, c1, s1, -w), P(ro, c0, s0, -w), I.brass);    // the two cheeks of the tyre
    b.quad(P(ri, c1, s1, w), P(ri, c0, s0, w), P(ro, c0, s0, w), P(ro, c1, s1, w), I.brass);
  }
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2;
    b.bar(0, Math.sin(a) * 0.6, Math.cos(a) * 0.6, 0, Math.sin(a) * 1.9, Math.cos(a) * 1.9, 0.5, I.brass, 0.5);
  }
  b.cyl(0, 0, 0, 'x', 0.95, 0.95, 1.7, 10, I.iron);
  b.cyl(0, 0, 0, 'x', 0.5, 0.5, 2.3, 8, I.cap);
  b.cyl(0, 1.5, 0, 'x', 0.34, 0.34, 2.5, 8, I.iron);                  // the crank pin, through
  return b.geometry();
}
// a coupling rod 7.2 m between pins, lying along z, bright steel with round eyes
function buildRod(S) {
  const I = S.inks, b = new Batch();
  b.box(0, 0, 0, 0.36, 0.7, 7.2, I.bone);
  for (const z of [-3.6, 3.6]) b.cyl(0, 0, z, 'x', 0.75, 0.75, 0.44, 10, I.bone);
  return b.geometry();
}
// a flat puff of salt dust: a low faceted blob of radius 1
function buildPuff(S) { const b = new Batch(); b.ball(0, 0, 0, 1, S.inks.salt, 4, 7); return b.geometry(); }

// ---------------------------------------------------------------- the mast (local: y is s, metres from the hinge)
const mastHalf = (s) => (22 - (13 * s) / MAST_L) / 2, legT = (s) => 3.0 - (1.5 * s) / MAST_L;
const GALLERY = [[236, 15], [326, 13]], BALL_S = 484, BALL_R = 7;
async function buildMast(S, b, sb, rng, ctx) {
  const I = S.inks, band = (s) => (Math.floor(s / 40) % 2 === 0 ? I.red : I.bone);
  // the hinge drum between the towers, and the cheeks that grip the foot
  b.cyl(0, 0, 0, 'x', 3.4, 3.4, 15.6, 14, I.iron, false);
  for (const x of [-3.2, 0, 3.2]) b.cyl(x, 0, 0, 'x', 3.75, 3.75, 0.9, 14, I.brass, true);
  const lobe = [];
  for (let k = 0; k <= 7; k++) { const a = (200 + k * 20) * DEG; lobe.push([Math.cos(a) * 5.8, Math.sin(a) * 5.8]); }
  lobe.push([11, 16.5], [11, 20], [-11, 20], [-11, 16.5]);
  for (const s of [-1, 1]) {
    b.slab(lobe, 'zy', s * 6.2 - 0.8, s * 6.2 + 0.8, I.red);
    sb.box(s * 6.2, 9, 0, 1.6, 22, 13, null);
    for (const x of [s * 7.05, s * 5.35]) {
      const nx = x > s * 6.2 ? 1 : -1;
      for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2; b.box(x + nx * 0.08, Math.sin(a) * 4.7, Math.cos(a) * 4.7, 0.36, 0.5, 0.5, I.brass); }
      b.bar(x + nx * 0.1, 3, -5.6, x + nx * 0.1, 17, -10.2, 0.3, I.red, 0.9); b.bar(x + nx * 0.1, 3, 5.6, x + nx * 0.1, 17, 10.2, 0.3, I.red, 0.9);
    }
    for (const z of [-10.2, 10.2]) b.bar(s * 6.6, 12, z, s * 10.4, 19.6, z, 1.3, I.red);          // struts out to the corners
  }
  b.box(0, 10, 0, 11, 1.4, 1.4, I.red); b.box(0, 17.5, -9.6, 11, 1.2, 1.2, I.red); b.box(0, 17.5, 9.6, 11, 1.2, 1.2, I.red);
  // the lattice: bays of 20 m above the shoe, open up to SHAFT_FROM m: legs, cross bracing on all four faces, a walkway
  // ring at every bay, and inside it a boarded core CORE of the mast's width across, in the bay's shade ink on every face.
  // The bracing of the two faces turned from the sun (west and south) is in the bay's shade ink on all its sides, so the
  // near and the far bracing part wherever they are seen one through the other. From SHAFT_FROM m up the mast is a closed
  // tapering shaft in the same bands, its four faces lit or shaded by the sun, with a bold brass ring at each change of band.
  // The shadow proxy keeps the legs, the core and each ring as a plate, the bracing left out (rails and rungs), and the
  // shaft as a block.
  const ring = (s, ink, bb, fat = 1) => {
    const h = mastHalf(s), t = legT(s), wk = h * 0.4 * fat;
    for (const e of [-1, 1]) { bb.box(0, s, e * (h - wk / 2), 2 * h + t, 0.6, wk, ink); bb.box(e * (h - wk / 2), s, 0, wk, 0.6, 2 * h - 2 * wk, ink); }
  };
  const CORE = 0.3, SHAFT_FROM = 340;
  ring(20, I.red, b); ring(20, null, sb, 1.5);
  for (let i = 1; i < 24; i++) {
    const s0 = i * 20, s1 = s0 + 20, h0 = mastHalf(s0), h1 = mastHalf(s1), t = legT(s0), ink = band(s0), d = t * 0.5, q = t * 0.3;
    if (s0 >= SHAFT_FROM) {
      const a0 = h0 + t / 2, a1 = h1 + t / 2;
      b.quad([a0, s0, a0], [a0, s0, -a0], [a1, s1, -a1], [a1, s1, a1], ink); b.quad([-a0, s0, -a0], [-a0, s0, a0], [-a1, s1, a1], [-a1, s1, -a1], ink);
      b.quad([-a0, s0, a0], [a0, s0, a0], [a1, s1, a1], [-a1, s1, a1], ink); b.quad([a0, s0, -a0], [-a0, s0, -a0], [-a1, s1, -a1], [a1, s1, -a1], ink);
      sb.box(0, s0 + 10, 0, 2 * a0, 20, 2 * a0, null);
      if (s0 === SHAFT_FROM) b.box(0, s0 - 0.4, 0, 2 * a0 + 1.6, 1.6, 2 * a0 + 1.6, I.iron);
      if (band(s1) !== ink && s1 < MAST_L) { b.box(0, s1, 0, 2 * a1 + 2.6, 3, 2 * a1 + 2.6, I.brass); sb.box(0, s1, 0, 2 * a1 + 2.6, 3, 2 * a1 + 2.6, null); }
      continue;
    }
    const away = { lit: ink.shade, shade: ink.shade };
    for (const ex of [-1, 1]) for (const ez of [-1, 1]) {
      b.bar(ex * h0, s0, ez * h0, ex * h1, s1, ez * h1, t, ink);
      sb.bar(ex * h0, s0, ez * h0, ex * h1, s1, ez * h1, t * 1.15, null);
    }
    for (const e of [-1, 1]) {
      const kz = e > 0 ? away : ink, kx = e < 0 ? away : ink;      // the south face (z +) and the west face (x -) are turned from the sun
      b.bar(-h0 + q, s0, e * (h0 - q), h1 - q, s1, e * (h1 - q), d, kz); b.bar(h0 - q, s0, e * (h0 - q), -h1 + q, s1, e * (h1 - q), d, kz);
      b.bar(e * (h0 - q), s0, -h0 + q, e * (h1 - q), s1, h1 - q, d, kx); b.bar(e * (h0 - q), s0, h0 - q, e * (h1 - q), s1, -h1 + q, d, kx);
    }
    const cw = (h0 + h1) * CORE;
    b.box(0, s0 + 10, 0, cw, 20, cw, { lit: ink.shade, shade: ink.shade }); sb.box(0, s0 + 10, 0, cw, 20, cw, null);
    ring(s1, ink, b); ring(s1, null, sb, 1.5);
    if (i % 12 === 11) await ctx.yield();
  }
}

// galleries, the ball and the nests: all on the mast, in the mast's own frame. Returns the pennant poles' tops.
function buildMastTop(S, b, sb, rng, storkScale = 1) {
  const I = S.inks, tops = [], poles = [];
  const shirts = [I.bone, I.timber, I.red, I.salt];
  for (let g = 0; g < 2; g++) {
    const s = GALLERY[g][0], R = GALLERY[g][1], h = mastHalf(s), N = 16;
    b.cyl(0, s, 0, 'y', R, R, 0.6, N, I.timber);                      // the floor
    b.cyl(0, s - 0.55, 0, 'y', R - 0.5, R + 0.25, 0.5, N, I.iron, false);
    sb.cyl(0, s, 0, 'y', R, R, 0.6, N, null);
    for (let k = 0; k < N; k++) {
      const a0 = ((k + 0.5) / N) * Math.PI * 2, a1 = ((k + 1.5) / N) * Math.PI * 2, r = R - 0.45;
      const x0 = Math.cos(a0) * r, z0 = Math.sin(a0) * r, x1 = Math.cos(a1) * r, z1 = Math.sin(a1) * r;
      b.box(x0, s + 0.95, z0, 0.3, 1.3, 0.3, I.iron);
      b.bar(x0, s + 1.55, z0, x1, s + 1.55, z1, 0.3, I.brass); b.bar(x0, s + 0.9, z0, x1, s + 0.9, z1, 0.18, I.iron);
      if (k % 2 === 0) {                                              // roof posts and brackets down to the legs
        const rr = R - 2.2; b.bar(Math.cos(a0) * rr, s + 0.3, Math.sin(a0) * rr, Math.cos(a0) * rr, s + 3.7, Math.sin(a0) * rr, 0.3, I.iron);
        const c = Math.SQRT2 * mastHalf(s - 11) * 0.98, ca = Math.round((a0 - Math.PI / 4) / (Math.PI / 2)) * (Math.PI / 2) + Math.PI / 4;
        b.bar(Math.cos(a0) * (R - 1.2), s - 0.5, Math.sin(a0) * (R - 1.2), Math.cos(ca) * c, s - 11, Math.sin(ca) * c, 0.6, I.iron);
      }
    }
    b.cyl(0, s + 4.6, 0, 'y', R - 1.4, h * 0.8, 2.2, N, I.iron, false); // the small roof: a shallow cone ring
    b.cyl(0, s + 3.55, 0, 'y', R - 1.3, R - 1.3, 0.3, N, I.brass, false);
    b.cyl(0, s + 5.7, 0, 'y', h * 0.8, h * 0.8, 0.1, N, I.iron, true);
    sb.cyl(0, s + 4.6, 0, 'y', R - 1.4, h * 0.8, 2.2, 8, null);
    tops.push(s + 5.75);
    const nf = 3 + (rng.chance(0.5) ? 1 : 0), base = rng.range(0, Math.PI * 2);
    for (let k = 0; k < nf; k++) {                                    // still figures at the rail, looking out
      const a = base + k * (0.34 + rng.range(0, 0.5)) + (k > 1 ? 1.9 : 0), r = R - 1.15;
      figure(b, I, Math.cos(a) * r, s + 0.3, Math.sin(a) * r, Math.PI / 2 - a + rng.range(-0.25, 0.25), rng.int(0, 3), rng.pick(shirts));
    }
    for (let k = 0; k < 4; k++) {                                     // pennant poles at four posts
      const a = ((k * 4 + 2.5) / N) * Math.PI * 2, r = R - 0.45, x = Math.cos(a) * r, z = Math.sin(a) * r;
      b.box(x, s + 5, z, 0.32, 9, 0.32, I.iron); b.ball(x, s + 9.75, z, 0.5, I.brass, 4, 6);
      poles.push([x, s + 9.1, z]);
    }
  }
  // the brass ball on the crown and its collar
  b.cyl(0, 478.6, 0, 'y', mastHalf(480) * 1.12, 3, 2.4, 12, I.brass, false);
  b.ball(0, BALL_S, 0, BALL_R, I.brass, 9, 16);
  b.cyl(0, BALL_S, 0, 'y', BALL_R + 0.3, BALL_R + 0.3, 0.7, 16, I.iron, false);            // an iron hoop round its middle
  sb.ball(0, BALL_S, 0, BALL_R, null, 5, 10);
  // nests of sticks: one great one on the ball, two small on the upper gallery's roof
  const nest = (x, y, z, r, n) => {
    for (let k = 0; k < n; k++) {
      const a = rng.range(0, Math.PI * 2), c = rng.range(0.2, 0.9) * r, e = a + Math.PI / 2 + rng.range(-0.5, 0.5), l = r * rng.range(0.5, 0.95), up = rng.range(0, 0.5);
      b.bar(x + Math.cos(a) * c - Math.cos(e) * l, y + up, z + Math.sin(a) * c - Math.sin(e) * l, x + Math.cos(a) * c + Math.cos(e) * l, y + up + rng.range(-0.2, 0.5), z + Math.sin(a) * c + Math.sin(e) * l, 0.22, I.timber);
    }
    b.cyl(x, y + 0.1, z, 'y', r * 0.5, r * 0.85, 0.5, 9, I.timber, true);
  };
  nest(0, BALL_S + BALL_R - 0.5, 0, 3.4, 30);
  nest(5.5, tops[1] + 0.1, -3, 1.5, 12); nest(-5, tops[1] + 0.1, 4.2, 1.3, 10);
  // two storks standing in the great nest, at the flying storks' scale (about 2.1 m tall at scale 1): flat profiles, white
  // with black wing ends, red bill and legs
  const dark = { lit: I.iron.shade, shade: I.iron.shade };
  for (const [sx, sz, yaw] of [[-1.1, 0.4, 0.5], [1.2, -0.5, 2.6]]) {
    b.m = new THREE.Matrix4().makeTranslation(sx * Math.min(2, storkScale), BALL_S + BALL_R + 0.1, sz * Math.min(2, storkScale)).multiply(new THREE.Matrix4().makeRotationY(yaw + rng.range(-0.4, 0.4))).multiply(new THREE.Matrix4().makeScale(storkScale, storkScale, storkScale));
    b.box(-0.08, 0.5, 0, 0.07, 1.0, 0.07, I.red); b.box(0.08, 0.5, 0, 0.07, 1.0, 0.07, I.red);
    b.slab([[-0.75, 1.0], [0.1, 0.9], [0.5, 1.2], [0.42, 1.55], [-0.3, 1.5]], 'xy', -0.16, 0.16, I.salt);
    b.slab([[-0.95, 0.95], [-0.3, 1.02], [-0.3, 1.34], [-0.75, 1.2]], 'xy', -0.19, 0.19, dark);
    b.bar(0.38, 1.4, 0, 0.55, 2.05, 0, 0.16, I.salt); b.box(0.6, 2.1, 0, 0.3, 0.24, 0.2, I.salt);
    b.bar(0.7, 2.08, 0, 1.25, 1.9, 0, 0.09, I.red);
    b.m = null;
  }
  return poles;
}

// pennants: long forked ribbons streaming away from the sun's side, waving by the clock (own material)
function buildPennants(S, poles, ink) {
  const b = new Batch(), dx = -SUN.x, dz = -SUN.z, dl = Math.hypot(dx, dz), ax = dx / dl, az = dz / dl, lx = -az, lz = ax, N = 9, LEN = 15;
  poles.forEach((p, n) => {
    const P = (u, v) => {       // u 0..1 along, v -1..1 across (vertical); wave grows from the pole outward
      const wd = 0.95 - 0.5 * u, y = p[1] - 0.9 + v * wd - u * u * 1.6, amp = 1.5 * u;
      return [p[0] + ax * u * LEN, y, p[2] + az * u * LEN, lx * amp, 0.25 * amp, lz * amp, -u * 6.5 + n * 1.7];
    };
    for (let k = 0; k < N; k++) {
      const u0 = k / N, u1 = (k + 1) / N;
      if (k < N - 1) b.quadW2(P(u0, -1), P(u1, -1), P(u1, 1), P(u0, 1), ink);
      else { b.quadW2(P(u0, -1), P(u1, -1), P(u0 + 0.03, -0.1), P(u0, 0), ink); b.quadW2(P(u0, 0), P(u0 + 0.03, 0.1), P(u1, 1), P(u0, 1), ink); }
    }
  });
  return b.geometry();
}

// one flying stork about 3.5 m in span, flying toward +z: flat wings that beat (wave), a flat body, red bill and legs
function buildStork(S) {
  const I = S.inks, b = new Batch(), dark = { lit: I.iron.shade, shade: I.iron.lit }, K = 1.35;
  const V = (x, z, y = 0) => [x * K, (y + Math.abs(x) * 0.2) * K, z * K, 0, Math.max(0, Math.abs(x) - 0.14) * 0.85 * K, 0, 0];
  for (const s of [-1, 1]) {
    b.quadW2(V(s * 0.14, -0.3), V(s * 0.14, 0.32), V(s * 1.0, 0.22), V(s * 1.0, -0.21), I.salt);
    b.quadW2(V(s * 1.0, -0.21), V(s * 1.0, 0.22), V(s * 1.3, 0.12), V(s * 1.25, -0.2), dark);
  }
  b.quadW2(V(0, -0.62, 0.02), V(0, 0.4, -0.14), V(0, 0.52, 0.1), V(0, -0.5, 0.16), I.salt);   // the body's profile, upright
  b.quadW2(V(-0.15, -0.55), V(0, -0.75), V(0.15, -0.55), V(0, 0.5, 0.02), I.salt);
  b.quadW2(V(-0.15, -0.55), V(0.15, -0.55), V(0.14, 0.34), V(-0.14, 0.34), I.salt);
  b.quadW2(V(-0.17, -0.2, 0.02), V(0, -0.2, 0.24), V(0.17, -0.2, 0.02), V(0, -0.2, -0.16), I.salt);      // the body seen end-on
  b.quadW2(V(-0.1, 0.3), V(0.1, 0.3), V(0.07, 1.05), V(-0.07, 1.05), I.salt);         // the neck, stretched out
  b.quadW2(V(0, 0.3, 0.1), V(0, 0.3, -0.1), V(0, 1.05, -0.06), V(0, 1.05, 0.07), I.salt);
  b.quadW2(V(-0.06, 1.05), V(0.06, 1.05), V(0.02, 1.5), V(-0.02, 1.5), I.red);        // the bill
  b.quadW2(V(-0.09, -0.7), V(0.09, -0.7), V(0.06, -1.45), V(-0.06, -1.45), I.red);    // legs trailing
  b.quadW2(V(0, -0.7, 0.07), V(0, -0.7, -0.07), V(0, -1.45, -0.05), V(0, -1.45, 0.05), I.red);
  return b.geometry();
}

// ---------------------------------------------------------------- the same hand for learners and sisters
// A LEARNER in three bodies and their shadow proxies (geometries; instance them, and style.shadowOf each): the plain
// figure of a cart on a track with one pole standing on one pin. It stands the same way round as the great machine:
// its track runs along z (north to south).
//   track: origin at the track's centre on the floor. A pale bed 1 m high (lit faces in the salt's shade ink, shaded faces
//          half way from it to the shadow ink), LEARNER_BED m long, with two thin dark rails;
//          at each end, POST_AT m from the middle, a buffer post POST_TOP m high with a red cap
//          and, on its inner face, a round red disc of radius DISC_R facing along the track; a winch post beyond the
//          north buffer
//   cart:  origin on the floor under the hinge. A plain dark box CART_LEN m long and 6.8 m wide from the axles up to the
//          hinge, one brass band round it, over four brass wheels a side of radius CART_WHEEL whose lower halves stand
//          clear under the box; on each side of the box at the hinge one round brass disc of radius PIVOT_R, the pin
//          between them. With the cart at LEARNER.reach its wheels end short of the buffer disc's face
//   pole:  origin at the hinge, y up the pole, 90 m: one plain square bar of timber, narrow at the pin, POLE_FOOT m thick
//          from 5 m up and tapering to POLE_TOP m, its top quarter red lead under a small brass ball; turn it about x
//          by learnerPose().angle (+ falls toward +z)
//   dust:  a low puff of salt within radius 1 on the floor, six flat-faced mounds 1.2 to 2.4 m high in the salt's two
//          inks, to be scaled by the world where the ball strikes as the puff swells and subsides through learnerPose().dust
// o.pale (0..1) pales every ink toward the far tint, fixed at build; o.low builds the wheels and discs with fewer sides
// and no hubs (for the ranks far from the route). The pole's shadow proxy is its plain tapered outline.
const LEARNER_BED = 84.4, POST_AT = 41.2, POST_TOP = 7.8, DISC_R = 2.4, CART_LEN = 13, CART_WHEEL = 1.8, PIVOT_R = 2, POLE_FOOT = 2.8, POLE_TOP = 1.6;
export function buildLearnerParts(S, o = {}) {
  const P = (k) => (o.pale ? S.pale(k, o.pale) : k), I = { salt: P(S.inks.salt), iron: P(S.inks.iron), brass: P(S.inks.brass), timber: P(S.inks.timber), bone: P(S.inks.bone), red: P(S.inks.red) };
  const bed = P({ lit: S.inks.salt.shade, shade: S.inks.salt.shade.clone().lerp(S.palette.shadow, 0.5) }), dark = { lit: I.iron.shade, shade: I.iron.shade };
  const C = LEARNER, half = C.track / 2, turn = new THREE.Matrix4().makeRotationY(-Math.PI / 2);      // pieces drawn along x are laid along z
  const seg = o.low ? 8 : 14;
  let b = new Batch(), sb = new Batch(true);
  b.m = turn; sb.m = turn;
  b.slab([[-5.4, 0], [5.4, 0], [4.4, 1], [-4.4, 1]], 'zy', -LEARNER_BED / 2, LEARNER_BED / 2, bed);
  for (const z of [-2.9, 2.9]) b.box(0, 1.25, z, LEARNER_BED - 4, 0.5, 0.7, dark);      // the two rails
  for (const e of [-1, 1]) {                                          // a buffer post at each end, its red disc facing the cart
    b.box(e * POST_AT, (POST_TOP - 1) / 2 + 0.5, 0, 1.6, POST_TOP - 1, 2, I.iron); b.box(e * POST_AT, POST_TOP - 0.4, 0, 2, 0.8, 2.4, I.red);
    b.cyl(e * (POST_AT - 1.2), 5.4, 0, 'x', DISC_R, DISC_R, 0.8, seg, I.red); b.cyl(e * (POST_AT - 1.2 - 0.45), 5.4, 0, 'x', 0.7, 0.7, 0.2, 6, I.brass);
    sb.box(e * POST_AT, POST_TOP / 2, 0, 1.6, POST_TOP, 2, null); sb.cyl(e * (POST_AT - 1.2), 5.4, 0, 'x', DISC_R, DISC_R, 0.8, 8, null);
  }
  b.box(-half - 4.6, 2.5, 0, 0.8, 5, 0.8, I.timber); b.cyl(-half - 4.6, 4.2, 0, 'z', 1.2, 1.2, 1.7, 9, I.brass); sb.box(-half - 4.6, 2.5, 0, 1.7, 5, 1.7, null);
  sb.box(0, 0.5, 0, LEARNER_BED, 1, 9.6, null);
  const track = b.geometry(), trackProxy = sb.geometry();
  b = new Batch(); sb = new Batch(true);
  b.m = turn; sb.m = turn;
  const hy = C.hingeY, axle = 1.5 + CART_WHEEL;
  b.box(0, (axle + hy) / 2, 0, CART_LEN, hy - axle, 6.8, I.iron);     // the box, from the axles up to the hinge, over the wheels
  b.box(0, hy - 0.5, 0, CART_LEN + 0.24, 0.42, 7.04, I.brass);        // its one brass band
  for (const z of [-2.95, 2.95]) for (const x of [-5.2, -1.75, 1.75, 5.2]) {
    b.cyl(x, axle, z, 'z', CART_WHEEL, CART_WHEEL, 0.7, seg, I.brass);
    if (!o.low) b.cyl(x, axle, z + Math.sign(z) * 0.4, 'z', 0.7, 0.7, 0.14, 6, dark);
  }
  for (const z of [-3.65, 3.65]) {                                    // the pin's two discs, on the box's sides
    b.cyl(0, hy, z, 'z', PIVOT_R, PIVOT_R, 0.5, seg, I.brass);
    if (!o.low) b.cyl(0, hy, z + Math.sign(z) * 0.3, 'z', 0.55, 0.55, 0.14, 6, dark);
  }
  b.cyl(0, hy, 0, 'z', 0.6, 0.6, 7.2, 6, I.brass, false);
  sb.box(0, (1.5 + hy) / 2, 0, CART_LEN + 1, hy - 1.5, 7, null); sb.box(0, hy, 0, 3.4, 4, 7.8, null);
  const cart = b.geometry(), cartProxy = sb.geometry();
  b = new Batch(); sb = new Batch(true);
  // the bar: square pieces [from, to, half width at each, ink] up the pole from the pin
  const q3 = 0.75 * C.L, top = C.L - 2 * C.ball, hw = (s) => POLE_FOOT / 2 - ((POLE_FOOT - POLE_TOP) / 2) * (s / C.L);
  for (const [s0, s1, a0, a1, ink] of [[0, 5, 0.55, hw(5), I.timber], [5, q3, hw(5), hw(q3), I.timber], [q3, top, hw(q3), hw(top), I.red]]) {
    b.quad([a0, s0, a0], [a0, s0, -a0], [a1, s1, -a1], [a1, s1, a1], ink); b.quad([-a0, s0, -a0], [-a0, s0, a0], [-a1, s1, a1], [-a1, s1, -a1], ink);
    b.quad([-a0, s0, a0], [a0, s0, a0], [a1, s1, a1], [-a1, s1, a1], ink); b.quad([a0, s0, -a0], [-a0, s0, -a0], [-a1, s1, -a1], [a1, s1, -a1], ink);
  }
  sb.cyl(0, 3 + (C.L - 3) / 2, 0, 'y', 1.9, 1.1, C.L - 3, 4, null);      // the pole's shadow is its plain outline
  b.ball(0, C.L - C.ball, 0, C.ball, I.brass, 5, 8); sb.ball(0, C.L - C.ball, 0, C.ball, null, 4, 6);      // the ball's top is the crown
  const pole = b.geometry(), poleProxy = sb.geometry();
  b = new Batch();
  // the dust: a low puff of six flat-faced mounds within radius 1 (their heights in metres), lit and shaded as salt
  for (const [an, out, rad, hgt] of [[0, 0, 0.56, 2.4], [0.4, 0.56, 0.44, 1.5], [1.7, 0.52, 0.48, 1.8], [2.9, 0.58, 0.42, 1.2], [4.1, 0.5, 0.5, 1.6], [5.3, 0.57, 0.43, 1.3]]) {
    b.m = new THREE.Matrix4().makeTranslation(Math.cos(an) * out, 0, Math.sin(an) * out).multiply(new THREE.Matrix4().makeScale(rad, hgt, rad));
    b.ball(0, 0, 0, 1, I.salt, 4, 7);
  }
  b.m = null;
  return { track, trackProxy, cart, cartProxy, pole, poleProxy, dust: b.geometry(), hingeY: C.hingeY, length: C.L };
}
// A SISTER of the great kind, low, in inks paled by o.pale (0.45, or 0.65 beyond 1.6 km): geometries and proxies.
//   track: fixed, along z, origin at its centre on the floor;  cart: origin on the floor under the hinge;
//   mast: origin at the hinge (y 44), y up the mast, 480 m, a plain banded outline. Pose with sisterPose(t, phase).
export function buildSisterParts(S, o = {}) {
  const f = o.pale ?? 0.45, I = { salt: S.pale(S.inks.salt, f), iron: S.pale(S.inks.iron, f), brass: S.pale(S.inks.brass, f), red: S.pale(S.inks.red, f), bone: S.pale(S.inks.bone, f) };
  let b = new Batch(), sb = new Batch(true);
  b.slab([[-15.5, 0], [15.5, 0], [13.4, 2], [-13.4, 2]], 'xy', -137, 137, I.salt);
  for (const x of [-12.5, -8, 8, 12.5]) b.box(x, 2.6, 0, 1, 1, 268, I.iron);
  for (const e of [-1, 1]) { b.box(0, 5.5, e * 131, 26, 7, 6, I.iron); sb.box(0, 4.5, e * 131, 26, 9, 6, null); }
  sb.box(0, 1, 0, 28, 2, 274, null);
  const track = b.geometry(), trackProxy = sb.geometry();
  b = new Batch(); sb = new Batch(true);
  b.box(0, 7, 0, 12, 6, 86, I.iron);
  b.slab([[-13, 10], [13, 10], [13, 14], [17, 17], [17, 20], [-17, 20], [-17, 17], [-13, 14]], 'xy', -45, 45, I.iron);
  for (const e of [-1, 1]) {
    b.box(0, 26, e * 32.5, 24, 12, 21, I.iron); b.box(0, 35, e * 33.5, 17, 6, 14, I.iron);
    for (const s of [-1, 1]) {
      b.cyl(s * 5.5, 42, e * 36.5, 'y', 1.8, 1.5, 8.6, 6, I.brass, false);
      for (const z of WHEEL_Z) if (z * e > 0) b.cyl(s * 12.9, AXLE_Y, z, 'x', WHEEL_R, WHEEL_R, 0.8, 10, I.brass);
    }
    b.slab([[-13, 20], [13, 20], [6, 41], [5.5, 48], [0, 50.6], [-5.5, 48], [-6, 41]], 'zy', e * 10 - 2, e * 10 + 2, I.iron);
  }
  sb.box(0, 15, 0, 34, 10, 90, null); sb.box(0, 6.5, 0, 26, 7, 84, null); sb.box(0, 29, -32.5, 24, 18, 21, null); sb.box(0, 29, 32.5, 24, 18, 21, null); sb.box(0, 35, 0, 24, 30, 16, null);
  const cart = b.geometry(), cartProxy = sb.geometry();
  b = new Batch(); sb = new Batch(true);
  b.box(0, 9, 0, 14, 22, 12, I.red); sb.box(0, 9, 0, 14, 22, 12, null);
  sb.cyl(0, 250, 0, 'y', mastHalf(20), mastHalf(MAST_L), 460, 4, null);      // the mast's shadow is its plain tapered outline
  for (let s0 = 20; s0 < MAST_L; s0 += 40) { const s1 = Math.min(MAST_L, s0 + 40); b.cyl(0, (s0 + s1) / 2, 0, 'y', mastHalf(s0) * 1.1, mastHalf(s1) * 1.1, s1 - s0, 4, Math.floor(s0 / 40) % 2 === 0 ? I.red : I.bone, false); }      // a far mast is drawn as its plain banded outline
  for (const [s, r] of GALLERY) { b.cyl(0, s, 0, 'y', r, r, 1.2, 10, I.iron); b.cyl(0, s + 4.4, 0, 'y', r - 1.4, mastHalf(s) * 0.8, 2.2, 10, I.iron, false); sb.cyl(0, s, 0, 'y', r, r, 1.2, 10, null); }
  b.ball(0, BALL_S, 0, BALL_R, I.brass, 6, 10); sb.ball(0, BALL_S, 0, BALL_R, null, 4, 8);
  return { track, trackProxy, cart, cartProxy, mast: b.geometry(), mastProxy: sb.geometry(), hingeY: HINGE_Y, length: MAST_L };
}

// ---------------------------------------------------------------- the hero
const WHEEL_Z = [-39.6, -32.4, -17.6, -10.4, 10.4, 17.6, 32.4, 39.6], WHEEL_X = [-12.5, -8, 8, 12.5], BOGIE_Z = [-36, -14, 14, 36];
// the level oval the wedges of storks fly when the world gives none: two straights and two half rounds, beside the last
// straight of the way out as built (east 4 degrees south)
const STRING_OVAL = { x: 6.5, y: 530, z: 119, dx: Math.cos(4 * DEG), dz: Math.sin(4 * DEG), len: 180, r: 22, speed: 12 };
export async function buildHero(ctx, opts = {}) {
  const S = opts.style || makeStyle(ctx, opts), I = S.inks;
  const detail = Math.min(1, Math.max(0.6, opts.detail ?? ctx.quality?.detail ?? 1));
  const rng = ctx.rng.fork('ptf-hero');
  const whitePennants = rng.chance(0.4), nRing = rng.chance(0.5) ? 9 : 14, storkScale = opts.storkScale ?? 1;
  // THE FLIGHTS: each a level or rising oval (two straights and two half rounds) flown by WEDGES of storks: opts.flights is a
  // list of { oval: { x, y, z, dx, dz, len, r, speed, rise }, wedges: [[its place round the oval as a share 0..1, birds], ...],
  // scale, gap }. A wedge is a leader and two legs trailing back and out from it, gap m from bird to bird (each bird's own
  // place in it shaken a little by a fixed hand), the birds of unlike size (0.75 to 1.2 of the scale) and beating out of step.
  const FLIGHTS = (opts.flights || [{ oval: opts.stringOval || STRING_OVAL, wedges: [[0, 5], [0.3, 3], [0.62, 7]], scale: storkScale, gap: (opts.stringGap ?? 5) * storkScale }]).map((f) => ({ ...f, P: 2 * f.oval.len + 2 * Math.PI * f.oval.r }));
  const wedgeHand = makeRng(730311), BIRD = [];
  FLIGHTS.forEach((F, fi) => F.wedges.forEach(([at, n]) => {
    for (let m = 0; m < n; m++) {
      const row = Math.ceil(m / 2), side = m % 2 ? 1 : -1;
      BIRD.push({ f: fi, at, back: row * F.gap * wedgeHand.range(0.8, 1.2), side: side * row * F.gap * 0.62 * wedgeHand.range(0.8, 1.2), up: wedgeHand.range(-0.5, 0.5) * F.scale, size: F.scale * wedgeHand.range(0.75, 1.2), bob: wedgeHand.range(0, 6) });
    }
  }));
  const root = new THREE.Group(); root.name = 'pole-that-must-not-fall';
  if (opts.sky !== false) root.add(S.makeSky({ radius: opts.skyRadius ?? 5200, moon: opts.moon ?? !!ctx.vary?.rare }));
  await ctx.yield();
  if (opts.floor !== false) root.add(await S.makeFloor({ radius: (opts.skyRadius ?? 5200) * 0.985 }));
  await ctx.yield();

  // the track
  let b = S.batch(), sb = S.batch(true);
  buildTrack(S, b, sb);
  const track = S.mesh(b), trackShadow = S.shadowOf(sb);
  root.add(trackShadow, track);
  await ctx.yield();

  // the cart: one body mesh, its shadow proxy, wheels, rods and dust under one group that rides by cart(t)
  const cartGroup = new THREE.Group(); root.add(cartGroup);
  b = S.batch(); sb = S.batch(true); b.detail = detail;
  await buildHull(S, b, sb, ctx);
  await ctx.yield();
  const funnels = await buildDeck(S, b, sb, rng, ctx);
  await ctx.yield();
  const hull = S.mesh(b), hullShadow = S.shadowOf(sb);
  cartGroup.add(hullShadow, hull);
  await ctx.yield();
  const wheels = new THREE.InstancedMesh(buildWheel(S), S.materials.ink, WHEEL_X.length * WHEEL_Z.length);
  const rods = new THREE.InstancedMesh(buildRod(S), S.materials.ink, 8);
  const puffs = new THREE.InstancedMesh(buildPuff(S), S.materials.ink, funnels.length * 5 + 8);
  for (const m of [wheels, rods, puffs]) { m.frustumCulled = false; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); cartGroup.add(m); }
  await ctx.yield();

  // the mast: one group on the hinge that turns by lean(t); lattice, galleries, ball, nests, figures, pennants, shadow
  const mastGroup = new THREE.Group(); mastGroup.position.set(0, HINGE_Y, 0); cartGroup.add(mastGroup);
  b = S.batch(); sb = S.batch(true);
  await buildMast(S, b, sb, rng, ctx);
  await ctx.yield();
  const poles = buildMastTop(S, b, sb, rng, storkScale);
  await ctx.yield();
  const mast = S.mesh(b), mastShadow = S.shadowOf(sb);
  mast.frustumCulled = false;
  const pennants = S.mesh(buildPennants(S, poles, whitePennants ? I.bone : I.brass), S.materials.inkWave);
  pennants.frustumCulled = false;
  mastGroup.add(mastShadow, mast, pennants);
  await ctx.yield();

  // storks: fixed in the world about the upright crown (rings) and on the flights' ovals (wedges)
  const nStork = nRing + BIRD.length, sg = buildStork(S), ph = new Float32Array(nStork), SP = [];
  for (let k = 0; k < nRing; k++) {
    const r = rng.range(17, 30);
    SP.push({ r, y: rng.range(512, 558), w: rng.range(7.5, 10.5) / r, a: rng.range(0, Math.PI * 2), bob: rng.range(0.6, 1.8), bp: rng.range(0, 6) });
    ph[k] = rng.range(0, Math.PI * 2);
  }
  for (let k = nRing; k < nStork; k++) ph[k] = rng.range(0, Math.PI * 2);
  sg.setAttribute('phase', new THREE.InstancedBufferAttribute(ph, 1));
  const storks = new THREE.InstancedMesh(sg, S.materials.inkWave, nStork);
  storks.frustumCulled = false; storks.instanceMatrix.setUsage(THREE.DynamicDrawUsage); root.add(storks);
  await ctx.yield();

  const M = new THREE.Matrix4(), M2 = new THREE.Matrix4(), V = new THREE.Vector3(), Q = new THREE.Quaternion(), E = new THREE.Euler(), SC = new THREE.Vector3();
  const sstep = (a, c, x) => { const t = Math.min(1, Math.max(0, (x - a) / (c - a))); return t * t * (3 - 2 * t); };
  // a flight's oval: q metres along it from the start of its first straight; side metres to the right of the way flown; it
  // rises by oval.rise m along the first straight and comes down by as much along the second
  const OV = { x: 0, y: 0, z: 0, tx: 0, tz: 1, turn: 0 };
  const ovalAt = (O, q, side, out) => {
    const L = O.len, r = O.r, dx = O.dx, dz = O.dz, nx = -dz, nz = dx, P = 2 * L + 2 * Math.PI * r;      // (nx, nz) is to the right of (dx, dz)
    let u, v, tu, tv;                                              // along the first straight, to its right
    q = ((q % P) + P) % P; out.turn = 0;
    if (q < L) { u = q; v = side; tu = 1; tv = 0; }
    else if (q < L + Math.PI * r) { const a = (q - L) / r, rr = r - side; u = L + Math.sin(a) * rr; v = r - Math.cos(a) * rr; tu = Math.cos(a); tv = Math.sin(a); out.turn = 1; }
    else if (q < 2 * L + Math.PI * r) { u = L - (q - L - Math.PI * r); v = 2 * r - side; tu = -1; tv = 0; }
    else { const a = (q - 2 * L - Math.PI * r) / r, rr = r - side; u = -Math.sin(a) * rr; v = r + Math.cos(a) * rr; tu = -Math.cos(a); tv = -Math.sin(a); out.turn = 1; }
    out.x = O.x + dx * u + nx * v; out.z = O.z + dz * u + nz * v; out.tx = dx * tu + nx * tv; out.tz = dz * tu + nz * tv;
    out.y = O.y + (O.rise || 0) * Math.min(1, Math.max(0, u / L));
    return out;
  };
  function pose(time) {
    const z = cart(time), a = lean(time), v = cartSpeed(time), phi = z / WHEEL_R;
    cartGroup.position.z = z; mastGroup.rotation.x = a;
    let n = 0;
    for (const x of WHEEL_X) for (const wz of WHEEL_Z) {
      M.makeRotationX(phi + (x < 0 ? Math.PI / 2 : 0)); if (x < 0) M.multiply(M2.makeRotationY(Math.PI));
      M.setPosition(x, AXLE_Y, wz); wheels.setMatrixAt(n++, M);
    }
    wheels.instanceMatrix.needsUpdate = true;
    n = 0;
    for (const s of SIDES) for (const bz of BOGIE_Z) {
      const p = phi + (s < 0 ? Math.PI / 2 : 0);
      M.makeTranslation(s * 13.55, AXLE_Y + 1.5 * Math.cos(p), bz + 1.5 * Math.sin(p)); rods.setMatrixAt(n++, M);
    }
    rods.instanceMatrix.needsUpdate = true;
    // dust: flat puffs from the funnels and at the leading wheels, only while the cart sprints
    const sprint = sstep(8, 11, Math.abs(v)), dir = v >= 0 ? 1 : -1;
    n = 0;
    for (let f = 0; f < funnels.length; f++) for (let j = 0; j < 5; j++) {
      const tau = (time * 0.3 + j / 5 + f * 0.19) % 1, age = tau / 0.3, sc = sprint * (1.1 + 4.2 * tau) * (1 - tau * tau * tau * 0.8);
      V.set(funnels[f][0], funnels[f][1] + 0.6 + age * 3.4, funnels[f][2] - v * age * 0.75);
      M.compose(V, Q.identity(), SC.set(sc, sc * 0.6, sc * 1.3)); puffs.setMatrixAt(n++, M);
    }
    for (let k = 0; k < 8; k++) {
      const tau = (time * 0.7 + k * 0.37) % 1, sc = sprint * (1.2 + 3.2 * tau) * (1 - tau * tau * 0.8);
      V.set(WHEEL_X[k % 4], 3.3 + tau * 1.2, dir * (44 + 2 * tau) - v * tau * 0.4);
      M.compose(V, Q.identity(), SC.set(sc * 0.8, sc * 0.4, sc * 1.6)); puffs.setMatrixAt(n++, M);
    }
    puffs.instanceMatrix.needsUpdate = true;
    // storks on their rings, then the wedges
    for (let k = 0; k < nStork; k++) {
      let th, px, py, pz, bank, size = storkScale;
      if (k < nRing) { const p = SP[k]; th = p.a + p.w * time; px = Math.cos(th) * p.r; pz = Math.sin(th) * p.r; py = p.y + p.bob * Math.sin(th * 2 + p.bp); bank = -0.3; }
      else {
        // a bird of a wedge: its wedge's place round the oval at the clock, less its own way back, and to its own side
        const B = BIRD[k - nRing], F = FLIGHTS[B.f];
        ovalAt(F.oval, F.oval.speed * time + B.at * F.P - B.back, B.side, OV);
        px = OV.x; pz = OV.z; py = OV.y + B.up + 0.5 * F.scale * Math.sin(time * 0.6 + B.bob); th = -Math.atan2(OV.tx, OV.tz); bank = -OV.turn * 0.35; size = B.size;
      }
      Q.setFromEuler(E.set(0, -th, bank, 'YXZ'));
      M.compose(V.set(px, py, pz), Q, SC.set(size, size, size)); storks.setMatrixAt(k, M);
    }
    storks.instanceMatrix.needsUpdate = true;
  }
  pose(0);

  const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const anchors = {
    hinge: v3(0, HINGE_Y, 0),                         // add cart(t) to z
    crown: v3(0, HINGE_Y + MAST_L, 0),                // the upright crown; mastPoint(480, t) gives it at time t
    ball: { s: BALL_S, radius: BALL_R },
    galleries: GALLERY.map(([s, r]) => ({ s, y: HINGE_Y + s, radius: r })),
    trackEnds: [v3(0, 0, -135), v3(0, 0, 135)],
    cartHalf: { x: 17, z: 47.5, deck: 20, houses: 38, funnels: 46.4, towers: 50.6 },
    portalSeat: { position: v3(233, 526, 104.7), travel: v3(Math.cos(4 * DEG), 0, Math.sin(4 * DEG)), radius: 12 },
    viewpoints: {
      westBroadside: { from: v3(-420, 60, 40), at: v3(0, 220, 0) },     // the lean and the cart's run seen sideways against the dawn
      eastBroadside: { from: v3(300, 120, -30), at: v3(0, 200, 0) },    // the lit side, every shadow pointing away
      cradle: { from: v3(80, 48, 20), at: v3(0, 40, 0) },
    },
    shadowFoot: S.shadowPoint(v3(0, HINGE_Y, 0)), shadowCrown: S.shadowPoint(v3(0, HINGE_Y + MAST_L, 0)),
    storkRings: { centre: v3(0, HINGE_Y + BALL_S, 0), radius: [17, 30], y: [510, 560] },
    // each flight's line and how far from it a bird's body can reach (its wedge's half width, its span and its bob)
    storkFlights: FLIGHTS.map((F) => ({ length: F.P, reach: 2 + 2.6 * F.scale + Math.ceil((Math.max(...F.wedges.map((q) => q[1])) - 1) / 2) * F.gap * 0.62 * 1.2, at: (q, out = {}) => ovalAt(F.oval, q, 0, out) })),
  };
  return {
    object: root, radius: 230, height: 535, center: v3(0, 200, 0), anchors, style: S,
    edition: { whitePennants, storks: nRing },
    parts: { track, hull, mast, cartGroup, mastGroup, wheels, rods, puffs, pennants, storks, hullShadow, mastShadow, trackShadow },
    lean, cart, cartSpeed, mastPoint,
    update(dt, time) { S.update(dt, time); pose(time); },
    dispose() {},
    ground: false, groundY: 0,
  };
}
