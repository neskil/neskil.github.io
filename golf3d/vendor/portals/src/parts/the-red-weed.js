// THE RED WEED, the hero: the walking engine of the prose. Three long jointed legs of bright glittering steel (three
// sections, two ball knuckles, a three-toed pad), a squat riveted drum for a body, a deep brass cowl on a turning
// collar (a hood with a peaked brow over a dark hollow: no eye, no face, no lamp), a great woven basket of white
// metal behind, six jointed steel ropes hanging under it, and one thicker arm that holds a dull lidded case.
//
// MAP OF THIS FILE
//   1. SIZES            every dimension in metres, and the part numbers
//   2. geometry         buildEngineGeometry (one mesh, about 9k triangles: every vertex carries its part number),
//                       buildRopeGeometry (six jointed ropes, one ribbon-tube draw), buildFxGeometry (sprites)
//   3. THE GAIT         poseWalk(): the whole machine as a function of the DISTANCE walked (never of time):
//                       feet stand on fixed points of three straight tracks, one foot is in the air at a time,
//                       the body rolls over the planted pair like a tilted stool and dips at every footfall;
//                       legs are solved hip-to-foot (solveLeg: a three-section chain folded in one plane).
//                       poseStill(): the dead engine, standing square on three given points.
//   4. shaders          METAL (analytic reflection of the evening sky, plate seams, rivets, small glints, the
//                       weed that has climbed the legs), ROPE, FX (spray crowns, steam, the puffs of green smoke
//                       from the joints, water pouring off a lifted pad: every sprite a function of its footfall's age)
//   5. makeEngine       one engine: mesh + ropes (+ fx), its uniforms and its pose; makeEngineKit builds the
//                       geometry once so the world can stand two of them (and far ones) on it
//   6. buildHero        the viewer's entry: one engine walking on the spot (the ground slides under it; marks on
//                       the ground travel with the planted feet, so a sliding foot would show)
import * as THREE from 'three';
import { RW_GLSL, makeShared, withShared, Acc, DEG, clamp, lerp, sstep, fract } from './the-red-weed-common.js';

// ---------------------------------------------------------------- 1. SIZES
export const SZ = {
  H0: 26.0,                                   // height of the drum's base above the ground when it stands
  hips: [[3.3, -0.35, 2.0], [-3.3, -0.35, 2.0], [0, -0.35, -3.8]],      // body space (+Z front, +X the machine's left): left front, right front, rear
  L: [11, 10, 9],                             // the three sections of a leg (the kit's make; an engine may be given longer ones: makeFrame's L)
  ankle: 1.2,                                 // ankle ball above the sole
  stride: 29.16, lat: [13, -13, 0], fa: [3.6, 3.6, -9.6],               // tracks (left +) and where each foot's stance is centred, fore-aft of the body
  lift: 5.6, dip: 1.2, tilt: 5.2 * DEG, yaw: 4.0 * DEG,
  fold: [1.0, -1.25],                         // how the two knuckles share the fold (see solveLeg)
  hoodY: 5.75, shoulder: [0, -1.0, 3.2], armL: [4.6, 4.4],
  ropes: [[2.5, 30, 9.6], [2.7, 95, 8.2], [2.4, 150, 10.4], [2.6, 215, 7.6], [2.8, 270, 9.2], [2.3, 330, 8.6]],     // ring radius, angle, length
};
export const PART = { body: 0, hood: 1, leg: 2, foot: 11, arm: 14, cas: 16, count: 17 };
const MAT = { steel: 0, brass: 1, white: 2, dark: 3, dish: 4, dull: 5, weave: 6 };

// ---------------------------------------------------------------- 2. geometry
// aE = (part, material, s, t): s and t are metres over the surface (plate seams and rivets are drawn from them)
// aAxis = for thin rods, the vector from the rod's axis to the vertex (the shader keeps them a pixel and a half wide)
class EAcc extends Acc {
  constructor() { super(); this.part = 0; this.mat = 0; this.thin = false; this.col = [0, 0, 0]; }
  pm(part, mat) { this.part = part; this.mat = mat; this.ex = [part, mat, 0, 0]; return this; }
  rod(a, b, ra, rb = ra, sides = 8, caps = 0) {
    const L = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), self = this;
    this.tube(a, b, ra, rb, sides, caps, (k, end, rx, ry, rz) => { self.col = self.thin ? [rx, ry, rz] : [0, 0, 0]; return [self.part, self.mat, (k / sides) * 6.2832 * (end ? rb : ra), end ? L : 0]; });
    this.col = [0, 0, 0];
  }
  turn(cx, cz, prof, seg) { const self = this; this.lathe(cx, cz, prof, seg, (kf, j, pr) => [self.part, self.mat, kf * 6.2832 * Math.max(pr[0], 0.5), pr[1]]); }
}

// LL: the three sections of a leg (the kit's own, or a longer make for an engine that stands wider)
function buildEngineGeometry(LL = SZ.L) {
  const A = new EAcc();
  // ---- body: the drum (base at y 0, top deck at 5.75), flanged top and bottom, a belly boss under it
  A.pm(PART.body, MAT.steel);
  A.turn(0, 0, [[0.02, -1.55], [1.5, -1.55], [2.5, -1.05], [3.8, -0.3], [4.3, 0.0], [4.55, 0.1], [4.55, 0.42], [4.3, 0.55], [4.3, 2.2], [4.42, 2.28], [4.42, 2.5], [4.3, 2.58], [4.3, 4.05], [4.55, 4.2], [4.55, 4.5],
    [4.3, 4.62], [3.55, 5.0], [3.15, 5.08], [3.15, 5.6], [3.3, 5.66], [3.3, 5.75], [0.02, 5.75]], 28);
  for (const h of SZ.hips) { A.ball(h[0], h[1], h[2], 1.6, 12, 8); }
  // four short stays between the drum and the belly boss, and the arm's shoulder housing
  for (let k = 0; k < 4; k++) { const an = (k / 4) * 6.2832 + 0.78; A.rod([Math.cos(an) * 3.9, -0.2, Math.sin(an) * 3.9], [Math.cos(an) * 1.6, -1.5, Math.sin(an) * 1.6], 0.16, 0.16, 6); }
  A.ball(SZ.shoulder[0], SZ.shoulder[1], SZ.shoulder[2], 0.7, 10, 7);
  // rope bosses
  for (const r of SZ.ropes) { const an = r[1] * DEG; A.rod([Math.sin(an) * r[0], -1.15, Math.cos(an) * r[0]], [Math.sin(an) * r[0], -1.75, Math.cos(an) * r[0]], 0.3, 0.2, 6, 1); }
  // ---- the basket of white metal behind (-Z), 7 m wide, 6 m tall: a creel. Its body is woven of white-metal
  // strips (a closed shell that shows its weave); hoops and ribs stand proud of it; the mouth is open and dark
  const BK = { x: 0, y: -0.9, z: -6.35, h: 6.0, ax: 3.5, az: 2.25 };
  const bulge = (v) => 0.5 + 0.5 * Math.sin(Math.PI * (0.12 + 0.62 * v));       // narrow foot, widest near the top, open
  const bpt = (v, th, k = 1) => [BK.x + Math.cos(th) * BK.ax * bulge(v) * k, BK.y + v * BK.h, BK.z + Math.sin(th) * BK.az * bulge(v) * k];
  { const NV = 8, NT = 24, base = A.count, K = 0.95;
    for (let j = 0; j <= NV; j++) for (let k = 0; k <= NT; k++) {
      const v = j / NV, th = (k / NT) * 6.2832, p = bpt(v, th, K), sl = (bulge(Math.min(1, v + 0.05)) - bulge(Math.max(0, v - 0.05))) * 3.0;
      A.v(p[0], p[1], p[2], Math.cos(th) / BK.ax, -sl * 0.12, Math.sin(th) / BK.az, [PART.body, MAT.weave, (k / NT) * 18.6, v * BK.h]);
    }
    for (let j = 0; j < NV; j++) for (let k = 0; k < NT; k++) { const a = base + j * (NT + 1) + k, b = a + NT + 1; A.i.push(a, b, b + 1, a, b + 1, a + 1); }
    // its foot, and the dark of its open mouth a little way down inside
    const foot = A.v(BK.x, BK.y - 0.2, BK.z, 0, -1, 0, [PART.body, MAT.weave, 0, 0]); for (let k = 0; k < NT; k++) A.i.push(foot, base + k, base + k + 1);
    const m0 = A.count; A.v(BK.x, BK.y + 0.9 * BK.h, BK.z, 0, 1, 0, [PART.body, MAT.dark, 0, 0]);
    for (let k = 0; k <= NT; k++) { const p = bpt(0.9, (k / NT) * 6.2832, K * 0.99); A.v(p[0], p[1], p[2], 0, 1, 0, [PART.body, MAT.dark, 0, 0]); }
    for (let k = 0; k < NT; k++) A.i.push(m0, m0 + 2 + k, m0 + 1 + k);
  }
  A.pm(PART.body, MAT.white); A.thin = true;
  const HOOPS = [0.0, 0.2, 0.42, 0.64, 0.84, 1.0], NR = 16, NS = 24;
  for (const v of HOOPS) for (let k = 0; k < NS; k++) A.rod(bpt(v, (k / NS) * 6.2832), bpt(v, ((k + 1) / NS) * 6.2832), v === 1 ? 0.15 : 0.1, v === 1 ? 0.15 : 0.1, 4);
  for (let k = 0; k < NR; k++) { const th = ((k + 0.5) / NR) * 6.2832; for (let j = 0; j < HOOPS.length - 1; j++) A.rod(bpt(HOOPS[j], th), bpt(HOOPS[j + 1], th), 0.085, 0.085, 4); A.rod([BK.x, BK.y - 0.25, BK.z], bpt(0, th), 0.085, 0.085, 4); }
  A.thin = false;
  // two brackets and a top stay carry it on the drum
  A.pm(PART.body, MAT.steel);
  for (const sx of [-1, 1]) { A.rod([sx * 2.6, 0.6, -3.4], [sx * 2.9, 0.5, -5.1], 0.22, 0.18, 6); A.rod([sx * 2.2, 4.3, -3.7], [sx * 3.0, 4.2, -5.3], 0.2, 0.16, 6); }
  // ---- the hood (part 1; its origin is the collar's centre on the top deck): a deep cowl swept along a bend
  A.pm(PART.hood, MAT.brass);
  A.turn(0, 0, [[3.05, -0.05], [3.2, 0.05], [3.2, 0.35], [2.75, 0.5], [2.45, 0.9]], 24);
  const RN = 12, RS = 20, rings = [], LEN = 4.9, BEND = 98 * DEG;
  { let py = 0.55, pz = -1.25;
    for (let j = 0; j <= RN; j++) {
      const t = j / RN, ph = BEND * Math.pow(t, 1.2), r = 2.25 + 0.6 * Math.pow(t, 1.3) + 0.22 * Math.pow(t, 6);
      rings.push({ y: py, z: pz, ph, r, t });
      const ds = LEN / RN, phm = BEND * Math.pow((j + 0.5) / RN, 1.2); py += Math.cos(phm) * ds; pz += Math.sin(phm) * ds;
    } }
  // a ring of the cowl: square to the bend, and keeled along the back of the bend (a hood's ridge, not a ball).
  // Toward the mouth the back of the bend runs on as a peaked brow, the underside is cut back and flattened: the
  // opening is a hollow under a brow that looks down, never a round rimmed hole
  const keel = (R, th) => 1 + 0.24 * Math.pow(Math.max(0, -Math.sin(th)), 5) * Math.sin(Math.PI * Math.min(1, R.t * 1.05));
  const ringPt = (R, th, rr, flat = false) => {
    const sn = Math.sin(th), t2 = R.t * R.t, k = keel(R, th), c = Math.cos(th) * rr * (1 + 0.1 * t2 * Math.max(0, sn)), s = sn * rr * k * (sn > 0 ? 1 - 0.42 * t2 : 1);
    const f = flat ? 0 : (sn < 0 ? 2.1 * sn * sn : -1.3 * sn * sn) * t2 * R.t;
    return [c, R.y - s * Math.sin(R.ph) + f * Math.cos(R.ph), R.z + s * Math.cos(R.ph) + f * Math.sin(R.ph)];
  };
  const shell = (inner) => {
    const base = A.count, d = inner ? -0.14 : 0;
    A.pm(PART.hood, inner ? MAT.dark : MAT.brass);
    for (let j = 0; j <= RN; j++) for (let k = 0; k <= RS; k++) {
      const R = rings[j], th = (k / RS) * 6.2832, p = ringPt(R, th, R.r + d), q = ringPt(R, th, 1, true);
      let nx = q[0], ny = q[1] - R.y, nz = q[2] - R.z; if (inner) { nx = -nx; ny = -ny; nz = -nz; }
      A.v(p[0], p[1], p[2], nx, ny, nz, [PART.hood, inner ? MAT.dark : MAT.brass, (k / RS) * 6.2832 * R.r, R.t * LEN]);
    }
    for (let j = 0; j < RN; j++) for (let k = 0; k < RS; k++) { const a = base + j * (RS + 1) + k, b = a + RS + 1; if (inner) A.i.push(a, b + 1, b, a, a + 1, b + 1); else A.i.push(a, b, b + 1, a, b + 1, a + 1); }
  };
  shell(false); shell(true);
  { const R = rings[RN];                                                          // the rolled rim of the mouth
    for (let k = 0; k < RS; k++) A.pm(PART.hood, MAT.brass).rod(ringPt(R, (k / RS) * 6.2832, R.r - 0.02), ringPt(R, ((k + 1) / RS) * 6.2832, R.r - 0.02), 0.11, 0.11, 5);
    for (const j of [3, 7]) { const Q = rings[j]; for (let k = 0; k < RS; k++) A.rod(ringPt(Q, (k / RS) * 6.2832, Q.r + 0.02), ringPt(Q, ((k + 1) / RS) * 6.2832, Q.r + 0.02), 0.09, 0.09, 4); } }
  // ---- legs: three sections each (parts 2..10). A section runs from its upper joint (the origin) along +Y
  const RAD = [[0.86, 0.76], [0.72, 0.62], [0.57, 0.46]], BALL = [1.4, 1.22, 1.02];
  for (let j = 0; j < 3; j++) for (let k = 0; k < 3; k++) {
    const L = LL[k], r = RAD[k];
    A.pm(PART.leg + j * 3 + k, MAT.steel);
    A.ball(0, 0, 0, BALL[k], 12, 8);
    A.rod([0, 0, 0], [0, L, 0], r[0], r[1], 10);
    A.rod([0, 1.15, 0], [0, 1.95, 0], r[0] + 0.2, r[0] + 0.2, 10, 1);          // collars
    A.rod([0, L - 2.1, 0], [0, L - 1.3, 0], r[1] + 0.18, r[1] + 0.18, 10, 1);
    A.rod([0, L * 0.5 - 0.25, 0], [0, L * 0.5 + 0.25, 0], r[0] + 0.1, r[0] + 0.1, 10, 1);
    A.thin = true;                                                                // the slide rod beside the tube, on two stubs
    A.rod([r[0] + 0.5, 1.55, 0], [r[1] + 0.48, L - 1.7, 0], 0.14, 0.14, 5);
    A.thin = false;
    A.rod([0, 1.55, 0], [r[0] + 0.5, 1.55, 0], 0.16, 0.16, 5); A.rod([0, L - 1.7, 0], [r[1] + 0.48, L - 1.7, 0], 0.16, 0.16, 5);
  }
  // ---- feet (parts 11..13; origin the ankle ball): a boss and three splayed toes, their far corners 1.84 m from the centre
  for (let j = 0; j < 3; j++) {
    A.pm(PART.foot + j, MAT.steel);
    A.ball(0, 0, 0, 0.78, 10, 7);
    A.rod([0, -0.3, 0], [0, -0.82, 0], 0.42, 0.5, 8);
    A.turn(0, 0, [[0.02, -SZ.ankle], [1.0, -SZ.ankle], [1.18, -0.98], [0.82, -0.74], [0.46, -0.66]], 12);
    for (let t = 0; t < 3; t++) {
      const an = (t / 3) * 6.2832, c = Math.cos(an), s = Math.sin(an), P = (r, w, y) => [s * r + c * w, y, c * r - s * w];      // toe 0 points forward (+Z)
      const y0 = -SZ.ankle, i0 = [0.55, 0.56], o0 = [1.8, 0.36];                  // inner: radius, half width; outer
      const a0 = P(i0[0], -i0[1], y0), a1 = P(i0[0], i0[1], y0), a2 = P(o0[0], o0[1], y0 - 0.06), a3 = P(o0[0], -o0[1], y0 - 0.06);
      const b0 = P(i0[0], -i0[1], -0.68), b1 = P(i0[0], i0[1], -0.68), b2 = P(o0[0], o0[1], -1.0), b3 = P(o0[0], -o0[1], -1.0);
      A.quad(b0, b3, b2, b1); A.quad(a0, a1, a2, a3); A.quad(a3, a2, b2, b3); A.quad(a0, a3, b3, b0); A.quad(a2, a1, b1, b2);
    }
  }
  // ---- the arm (parts 14, 15) and the case it holds (16; origin the wrist): dull and lidded, a polished dish on its face
  A.pm(PART.arm, MAT.steel); A.ball(0, 0, 0, 0.52, 10, 7); A.rod([0, 0, 0], [0, SZ.armL[0], 0], 0.3, 0.26, 8);
  A.pm(PART.arm + 1, MAT.steel); A.ball(0, 0, 0, 0.44, 10, 7); A.rod([0, 0, 0], [0, SZ.armL[1], 0], 0.25, 0.22, 8); A.ball(0, SZ.armL[1], 0, 0.36, 8, 6);
  A.pm(PART.cas, MAT.dull);
  A.box(0, -1.05, 0.35, 1.15, 0.72, 0.62); A.box(0, -0.27, 0.35, 1.22, 0.1, 0.69);       // the case and its lid
  A.rod([0, -0.02, 0.1], [0, -0.2, 0.25], 0.16, 0.16, 6);
  A.pm(PART.cas, MAT.steel); A.rod([0, -1.05, 0.95], [0, -1.05, 1.08], 0.8, 0.8, 16);
  A.pm(PART.cas, MAT.dish); { const self = A; A.tube([0, -1.05, 1.02], [0, -1.05, 1.1], 0.7, 0.7, 16, 1, () => [PART.cas, MAT.dish, 0, 0]); self.col = [0, 0, 0]; }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(A.p, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(A.n, 3));
  g.setAttribute('aAxis', new THREE.Float32BufferAttribute(A.c, 3));
  g.setAttribute('aE', new THREE.Float32BufferAttribute(A.e, 4));
  g.setIndex(A.count > 65535 ? new THREE.Uint32BufferAttribute(A.i, 1) : new THREE.Uint16BufferAttribute(A.i, 1));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 1e5);
  return { geometry: g, triangles: A.triangles };
}

// six ropes, each a jointed tube hanging from its boss. aR = (rope, t along 0..1, angle round, bead 0..1)
function buildRopeGeometry() {
  const P = [], R = [], I = []; let n = 0; const SEG = 16, SIDES = 5;
  for (let r = 0; r < SZ.ropes.length; r++) {
    const base = n;
    for (let s = 0; s <= SEG; s++) {
      for (const half of [0, 1]) {                                     // two rings per joint: a link ends, the next begins, a bead between
        const t = clamp((s + (half ? 0.08 : -0.08)) / SEG, 0, 1), bead = s === SEG ? 1.6 : half ? 0.0 : 0.55;
        for (let k = 0; k < SIDES; k++) { P.push(0, 0, 0); R.push(r, t, (k / SIDES) * 6.2832, bead); n++; }
      }
    }
    const rings = (SEG + 1) * 2;
    for (let q = 0; q < rings - 1; q++) for (let k = 0; k < SIDES; k++) { const a = base + q * SIDES + k, b = base + q * SIDES + (k + 1) % SIDES, c = a + SIDES, d = b + SIDES; I.push(a, c, d, a, d, b); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aR', new THREE.Float32BufferAttribute(R, 4)); g.setIndex(I);
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 1e5);
  return { geometry: g, triangles: I.length / 3 };
}

// ---------------------------------------------------------------- 3. THE GAIT
const UP = new THREE.Vector3(0, 1, 0);
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3(), _d = new THREE.Vector3(), _e = new THREE.Vector3(), _p = new THREE.Vector3(), _n = new THREE.Vector3(), _x = new THREE.Vector3(), _y = new THREE.Vector3(), _z = new THREE.Vector3();
const _m = new THREE.Matrix4(), _m2 = new THREE.Matrix4();

export function makeState() {
  const V = () => new THREE.Vector3(), V3 = () => [V(), V(), V()];
  return { mats: Array.from({ length: PART.count }, () => new THREE.Matrix4()), body: V(), front: V(), left: V(), up: V(), hip: V3(), k1: V3(), k2: V3(), ank: V3(), sole: V3(), q: [-1, -1, -1],
    anchors: SZ.ropes.map(V), wrist: V(), g: 0, sig: 0, w: 0, jsw: 0, hoodYaw: 0, joints: new Float32Array(36) };
}

// A leg is a chain of three sections folded in one plane: the plane holds the hip, the ankle and the pole.
// The fold is one number (alpha): the second section turns by fold[0] x alpha from the first and the third by
// fold[1] x alpha from the second, and alpha is found so that the chain is exactly as long as hip to ankle.
// With fold = [1, -1.25] the leg is a shallow zigzag that deepens as the load comes on, like a spring.
function chainEnd(al, fold, L, o) {
  const t2 = fold[0] * al, t3 = t2 + fold[1] * al;
  o[0] = L[0]; o[1] = 0; o[2] = L[0] + L[1] * Math.cos(t2); o[3] = L[1] * Math.sin(t2); o[4] = o[2] + L[2] * Math.cos(t3); o[5] = o[3] + L[2] * Math.sin(t3);
  return Math.hypot(o[4], o[5]);
}
const _ch = [0, 0, 0, 0, 0, 0];
function solveLeg(H, A, pole, fold, L, k1, k2) {
  _e.subVectors(A, H); const sum = L[0] + L[1] + L[2], d = clamp(_e.length(), sum * 0.5, sum * 0.9985); _e.normalize();
  _p.copy(pole).addScaledVector(_e, -pole.dot(_e)); if (_p.lengthSq() < 1e-6) _p.set(1, 0, 0).addScaledVector(_e, -_e.x); _p.normalize();
  let lo = 0, hi = 2.2;
  for (let i = 0; i < 18; i++) { const mid = (lo + hi) / 2; if (chainEnd(mid, fold, L, _ch) > d) lo = mid; else hi = mid; }
  chainEnd((lo + hi) / 2, fold, L, _ch);
  const de = Math.atan2(_ch[5], _ch[4]), cd = Math.cos(de), sd = Math.sin(de);
  const x1 = _ch[0] * cd + _ch[1] * sd, y1 = -_ch[0] * sd + _ch[1] * cd, x2 = _ch[2] * cd + _ch[3] * sd, y2 = -_ch[2] * sd + _ch[3] * cd;
  k1.copy(H).addScaledVector(_e, x1).addScaledVector(_p, y1);
  k2.copy(H).addScaledVector(_e, x2).addScaledVector(_p, y2);
  _n.crossVectors(_e, _p).normalize();                          // the plane's normal: the slide rods lie beside the plane
}
// the matrix of a section that runs from P to Q (its geometry is L long along +Y); nrm: the X axis wanted
function sectionMatrix(M, P, Q, L, nrm) {
  _y.subVectors(Q, P); const len = _y.length() || 1;
  _z.crossVectors(nrm, _y).normalize(); _x.crossVectors(_y, _z).normalize();
  _y.multiplyScalar(1 / L);
  M.makeBasis(_x, _y, _z).setPosition(P);
  return len;
}

// everything that hangs on the body, once the body's frame and the three soles are known
function finishPose(E, st, soles, pitch, ctl) {
  const { body, front, left, up } = st;
  st.mats[PART.body].makeBasis(left, up, front).setPosition(body);
  for (let j = 0; j < 3; j++) {
    const h = SZ.hips[j], H = st.hip[j].copy(body).addScaledVector(left, h[0]).addScaledVector(up, h[1]).addScaledVector(front, h[2]);
    const A = st.ank[j].copy(soles[j]); A.y += SZ.ankle;
    // the pole: out from the machine's axis through the hip, and a little down
    const pl = (ctl.poles && ctl.poles[j]) || E.pole;         // (a dead engine's legs have each given way in their own manner)
    _a.copy(left).multiplyScalar(h[0]).addScaledVector(front, h[2]); _a.y = 0; _a.normalize(); _b.crossVectors(UP, _a); _a.multiplyScalar(pl[0]).addScaledVector(_b, pl[2] || 0); _a.y += pl[1];
    solveLeg(H, A, _a, (ctl.folds && ctl.folds[j]) || E.fold, E.L, st.k1[j], st.k2[j]);
    const nrm = _d.copy(_n);
    sectionMatrix(st.mats[PART.leg + j * 3], H, st.k1[j], E.L[0], nrm);
    sectionMatrix(st.mats[PART.leg + j * 3 + 1], st.k1[j], st.k2[j], E.L[1], nrm);
    sectionMatrix(st.mats[PART.leg + j * 3 + 2], st.k2[j], A, E.L[2], nrm);
    // the pad: level when planted, toes down as it lifts, toes up as it reaches
    const cp = Math.cos(pitch[j]), sp = Math.sin(pitch[j]);
    _z.copy(E.F).multiplyScalar(cp).addScaledVector(UP, -sp); _y.copy(UP).multiplyScalar(cp).addScaledVector(E.F, sp); _x.crossVectors(_y, _z);
    st.mats[PART.foot + j].makeBasis(_x, _y, _z).setPosition(A);
    const o = j * 12, J = st.joints;
    J[o] = H.x; J[o + 1] = H.y; J[o + 2] = H.z; J[o + 3] = st.k1[j].x; J[o + 4] = st.k1[j].y; J[o + 5] = st.k1[j].z;
    J[o + 6] = st.k2[j].x; J[o + 7] = st.k2[j].y; J[o + 8] = st.k2[j].z; J[o + 9] = A.x; J[o + 10] = A.y; J[o + 11] = A.z;
  }
  // the hood on its collar
  st.hoodYaw = ctl.hoodYaw || 0;
  _m.makeTranslation(0, SZ.hoodY, 0).multiply(_m2.makeRotationY(st.hoodYaw)).multiply(_m2.makeRotationX(ctl.hoodTip || 0));
  st.mats[PART.hood].multiplyMatrices(st.mats[PART.body], _m);
  // the arm and its case: held in front of the body; raised and aimed when ctl.raise comes up
  const raise = ctl.raise || 0, sh = SZ.shoulder;
  const Sh = _a.copy(body).addScaledVector(left, sh[0]).addScaledVector(up, sh[1]).addScaledVector(front, sh[2]);
  const Wn = _b.copy(body).addScaledVector(left, 0.9).addScaledVector(up, -2.4).addScaledVector(front, 7.0);
  const aim = _c.copy(front).addScaledVector(UP, -0.16).normalize();
  if (raise > 0 && ctl.aim) { _d.copy(Sh).addScaledVector(ctl.aim, 8.1); _d.y += 1.2; Wn.lerp(_d, raise); aim.lerp(ctl.aim, raise).normalize(); }
  if (ctl.slack) { Wn.copy(body).addScaledVector(left, 1.5).addScaledVector(front, 4.0); Wn.y -= 8.7; aim.set(0, -1, 0).addScaledVector(front, 0.22).addScaledVector(left, 0.3).normalize(); }      // the arm hangs, the case's face to the ground
  const L1 = SZ.armL[0], L2 = SZ.armL[1];
  _e.subVectors(Wn, Sh); const d = clamp(_e.length(), 1.0, (L1 + L2) * 0.995); _e.normalize();
  const W = st.wrist.copy(Sh).addScaledVector(_e, d);
  const ax = (L1 * L1 - L2 * L2 + d * d) / (2 * d), hh = Math.sqrt(Math.max(L1 * L1 - ax * ax, 0));
  _p.set(0, -1, 0).addScaledVector(left, 0.25).addScaledVector(_e, -(-_e.y + 0.25 * left.dot(_e))); _p.normalize();
  const El = _d.copy(Sh).addScaledVector(_e, ax).addScaledVector(_p, hh);
  _n.crossVectors(_e, _p).normalize();
  const nrm = _c2.copy(_n);
  sectionMatrix(st.mats[PART.arm], Sh, El, L1, nrm);
  sectionMatrix(st.mats[PART.arm + 1], El, W, L2, nrm);
  _z.copy(aim); _x.crossVectors(UP, _z).normalize(); _y.crossVectors(_z, _x).normalize();
  st.mats[PART.cas].makeBasis(_x, _y, _z).setPosition(W);
  for (let r = 0; r < SZ.ropes.length; r++) { const R = SZ.ropes[r], an = R[1] * DEG; st.anchors[r].copy(body).addScaledVector(left, Math.sin(an) * R[0]).addScaledVector(up, -1.75).addScaledVector(front, Math.cos(an) * R[0]); }
}
const _c2 = new THREE.Vector3(), _soles = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()], _pitch = [0, 0, 0];
const YAW_SIGN = [-1, 1, 0];

// THE WALK. g: the gait phase in cycles (one cycle = one stride of every foot = E.stride metres walked);
// w: 0 standing .. 1 striding (the lift, roll and dip come in with it). Nothing here reads a clock.
//   foot j is in the air while fract(g - j/3) < 1/3, so exactly one foot is ever lifted;
//   its n-th standing place is the fixed point  a = phi + (n + j/3 + 2/3) stride + fa[j]  on its own track;
//   the body is at  phi + g stride  along the line, so a planted foot passes under it from stride/3 ahead of
//   its mean place to stride/3 behind while the body rolls over it.
export function poseWalk(E, st, g, w, ctl = {}) {
  const S = E.stride, k = Math.floor(3 * g + 1e-7), sig = clamp(3 * g - k, 0, 1), jsw = ((k % 3) + 3) % 3;
  st.g = g; st.sig = sig; st.w = w; st.jsw = jsw;
  const xd = fract(sig - 0.11 + 0.5) - 0.5, dipP = Math.exp(-Math.pow(xd / (xd < 0 ? 0.085 : 0.25), 2));      // the footfall: a quick drop, a slower rise
  const sp = Math.sin(Math.PI * sig), sp2 = sp * sp;
  const ab = E.phi + g * S - 0.55 * w * Math.sin(6.2832 * sig + 0.5);          // the body checks at the footfall and surges into the fall
  const yb = E.H0 - w * (E.dip * dipP - 0.35 * sp2);
  const yaw = w * E.yawAmp * YAW_SIGN[jsw] * sp2, cy = Math.cos(yaw), sy = Math.sin(yaw);
  st.front.copy(E.F).multiplyScalar(cy).addScaledVector(E.Lw, sy); st.left.copy(E.Lw).multiplyScalar(cy).addScaledVector(E.F, -sy); st.up.copy(UP);
  // the roll: the stool tips toward the corner whose foot is in the air, and is caught as that foot comes down
  const h = SZ.hips[jsw], hl = Math.hypot(h[0], h[2]);
  _a.copy(st.left).multiplyScalar(h[0] / hl).addScaledVector(st.front, h[2] / hl);
  _b.crossVectors(UP, _a).normalize();
  const th = w * E.tilt * (0.4 * sp + 0.6 * sp2);
  st.front.applyAxisAngle(_b, th); st.left.applyAxisAngle(_b, th); st.up.applyAxisAngle(_b, th);
  const nod = w * 1.4 * DEG * dipP;                                            // and a nod as the weight lands
  _b.copy(st.left); st.front.applyAxisAngle(_b, nod); st.up.applyAxisAngle(_b, nod);
  st.body.copy(E.O).addScaledVector(E.F, ab); st.body.y += yb;
  for (let j = 0; j < 3; j++) {
    const c = g - j / 3, n = Math.floor(c + 1e-7), f = c - n, aP = (m) => E.phi + (m + j / 3 + 2 / 3) * S + E.fa[j];
    let a, lat = E.lat[j], lift = 0, q = -1;
    if (f >= 1 / 3 - 1e-7) a = aP(n);
    else { q = clamp(3 * f, 0, 1); a = lerp(aP(n - 1), aP(n), sstep(0.05, 0.95, q)); const sq = Math.sin(Math.PI * q); lift = w * E.lift * Math.pow(sq, 0.6); lat *= 1 + 0.07 * w * sq; }
    st.q[j] = q;
    _soles[j].copy(E.O).addScaledVector(E.F, a).addScaledVector(E.Lw, lat); _soles[j].y += lift + E.sink;
    st.sole[j].copy(_soles[j]);
    _pitch[j] = q < 0 ? 0 : w * 0.42 * Math.sin(6.2832 * q) * (q < 0.5 ? 1 : 0.55);
  }
  finishPose(E, st, _soles, _pitch, ctl);
  return st;
}
// where foot j stood (or will stand) for its n-th time, on the ground
export function plantPoint(E, j, n, out) { const a = E.phi + (n + j / 3 + 2 / 3) * E.stride + E.fa[j]; out.copy(E.O).addScaledVector(E.F, a).addScaledVector(E.Lw, E.lat[j]); out.y += E.sink; return out; }

// THE DEAD ENGINE: still on three given soles (world points), body at `body` (the drum's base), facing E.F.
// ctl.roll / ctl.pitch (rad) let the body hang out of level; ctl.poles / ctl.folds bend each leg in its own way;
// ctl.slack lets the arm hang
export function poseStill(E, st, soles, body, ctl = {}) {
  st.g = 0; st.sig = 0; st.w = 0; st.jsw = 0;
  st.front.copy(E.F); st.left.copy(E.Lw); st.up.copy(UP); st.body.copy(body);
  if (ctl.roll) { _b.copy(E.F); st.left.applyAxisAngle(_b, ctl.roll); st.up.applyAxisAngle(_b, ctl.roll); }
  if (ctl.pitch) { _b.copy(st.left); st.front.applyAxisAngle(_b, ctl.pitch); st.up.applyAxisAngle(_b, ctl.pitch); }
  for (let j = 0; j < 3; j++) { _soles[j].copy(soles[j]); st.sole[j].copy(soles[j]); _pitch[j] = 0; st.q[j] = -1; }
  finishPose(E, st, _soles, _pitch, ctl);
  return st;
}
// the frame an engine walks in: origin on the ground, heading (unit, level), and the gait's numbers
export function makeFrame(o = {}) {
  const F = new THREE.Vector3(o.dir ? o.dir[0] : 0, 0, o.dir ? o.dir[1] : 1).normalize();
  return { O: new THREE.Vector3(...(o.origin || [0, 0, 0])), F, Lw: new THREE.Vector3().crossVectors(UP, F).normalize(), phi: o.phi ?? 0, stride: o.stride ?? SZ.stride, lat: o.lat || SZ.lat, fa: o.fa || SZ.fa,
    L: o.L || SZ.L, H0: o.H0 ?? SZ.H0, dip: o.dip ?? SZ.dip, tilt: o.tilt ?? SZ.tilt, yawAmp: o.yaw ?? SZ.yaw, lift: o.lift ?? SZ.lift, sink: o.sink ?? -0.18, fold: o.fold || SZ.fold, pole: o.pole || [-1, -0.2] };
}
// the look-about of the hood: to and fro with pauses, up to 55 degrees either way (a pure function of the clock)
export function hoodLook(time, seed = 0) {
  const T = 3.7, x = time / T + seed, i = Math.floor(x), f = x - i;
  const h = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return (s - Math.floor(s)) * 2 - 1; };
  return lerp(h(i - 1), h(i), sstep(0, 0.42, f)) * 55 * DEG;
}

// ---------------------------------------------------------------- 4. shaders
const METAL_VS = /* glsl */`
${RW_GLSL}
uniform mat4 uPart[${PART.count}];
attribute vec4 aE; attribute vec3 aAxis;
varying vec3 vW, vN; varying vec4 vE;
void main(){
  mat4 M = uPart[int(aE.x + 0.5)];
  vec4 wp = modelMatrix*(M*vec4(position, 1.0));
  float al = length(aAxis);
  if (al > 1e-4) {                                   // thin rods keep a pixel and a half of width at any distance
    float k = max(1.0, 0.8*uPx*length(wp.xyz - cameraPosition)/al);
    wp = modelMatrix*(M*vec4(position + aAxis*(k - 1.0), 1.0));
  }
  vN = mat3(modelMatrix)*(mat3(M)*normal);
  vW = wp.xyz; vE = aE;
  gl_Position = projectionMatrix*viewMatrix*wp;
}`;
// the metal: bright, and mostly a mirror of the evening. Polished steel shows the slate sky as its own colour and
// the amber band as a line of light down every limb; brass turns it warm; the white metal of the basket stays pale
// and shows its weave; small facets flash where they find the afterglow or the burning wood. No light of its own.
const METAL_LIT = /* glsl */`
uniform vec4 uWeedOn;      // x: where the red gives way to white (m above the ground), y: top of the growth, z: ground y, w: amount
uniform float uDim;        // 1 near; far engines sink a little into the haze
vec3 rwMetal(vec3 n, vec3 v, vec3 wpos, float mat, vec2 st, float part){
  float dist = length(cameraPosition - wpos), fp = uPx*dist;
  vec3 alb = vec3(0.105, 0.11, 0.12), f0 = vec3(0.60, 0.61, 0.65); float rough = 0.2;
  if (mat > 5.5) {            // the woven body of the basket: strips of white metal, each rising over a rib and under the next
    float row = floor(st.y/0.5), bx = fract(st.x/0.62 + 0.5*mod(row, 2.0)), by = fract(st.y/0.5);
    float over = sin(3.14159*bx), gap = (1.0 - smoothstep(0.03, 0.09 + fp*2.0, min(by, 1.0 - by)))*(1.0 - smoothstep(0.1, 0.5, fp));
    alb = vec3(0.42, 0.41, 0.39)*(0.6 + 0.4*over)*(1.0 - 0.8*gap); f0 = vec3(0.6, 0.59, 0.56)*(0.45 + 0.55*over)*(1.0 - 0.9*gap); rough = 0.4;
  }
  else if (mat > 4.5) { alb = vec3(0.07, 0.064, 0.058); f0 = vec3(0.06); rough = 0.85; }
  else if (mat > 3.5) { alb = vec3(0.03); f0 = vec3(0.5, 0.5, 0.52); rough = 0.3; }
  else if (mat > 2.5) {       // the hollow of the hood: dull brass at the lip, darker with every metre inward
    float lip = smoothstep(1.6, 4.9, st.y);
    alb = vec3(0.19, 0.105, 0.03)*(0.03 + 0.4*lip*lip); f0 = vec3(0.05, 0.03, 0.012)*lip; rough = 1.0;
  }
  else if (mat > 1.5) { alb = vec3(0.42, 0.41, 0.39); f0 = vec3(0.62, 0.61, 0.58); rough = 0.4; }
  else if (mat > 0.5) { alb = vec3(0.21, 0.115, 0.032); f0 = vec3(0.95, 0.63, 0.25); rough = 0.22; }
  float plated = 1.0 - step(1.5, mat);
  float near = 1.0 - smoothstep(0.03, 0.14, fp);
  float bs = abs(fract(st.x/2.2 + 0.5) - 0.5)*2.2, bt = abs(fract(st.y/1.7 + 0.5) - 0.5)*1.7;
  float seam = max(1.0 - smoothstep(0.02, 0.05 + fp, bs), 1.0 - smoothstep(0.02, 0.05 + fp, bt))*plated*(1.0 - smoothstep(0.12, 0.5, fp));
  vec2 rc = vec2(fract(st.x/0.38) - 0.5, (abs(bt) - 0.16)/0.38);
  float riv = (1.0 - smoothstep(0.12, 0.24, length(rc)))*near*plated;
  alb *= 1.0 - 0.5*seam;
  vec3 r = reflect(-v, n);
  float ndv = clamp(dot(n, v), 0.0, 1.0);
  vec3 rr = normalize(mix(r, n, rough*0.5) + vec3(0.0, 1e-4, 0.0));
  vec3 env = rwSky(rr);
  env = mix(env, vec3(0.05, 0.013, 0.022) + 0.35*uSkyGnd, (1.0 - smoothstep(-0.4, 0.02, rr.y))*0.8);       // under the horizon the metal mirrors the red swamp
  float om = 1.0 - ndv, om2 = om*om;
  vec3 F = f0 + (1.0 - f0)*om2*om2*om;
  vec3 col = alb*(uKeyCol*clamp(dot(n, uKeyDir)*0.75 + 0.25, 0.0, 1.0) + rwAmb(n)) + env*F*(1.0 - 0.35*seam + 0.5*riv);
  // the afterglow and the burning wood as two wide lights: a sheen that runs down the limbs, and small facets
  // that flash as the machine moves (plates are never quite true)
  float shine = step(mat, 2.5) + step(5.5, mat);
  vec3 gl = normalize(vec3(uGlow.x, 0.07, uGlow.z)), fd = normalize(uFire.xyz - wpos);
  float g1 = clamp(dot(r, gl), 0.0, 1.0), g2 = g1*g1, g4 = g2*g2, g16 = g4*g4*g4*g4;
  float h1 = clamp(dot(r, fd), 0.0, 1.0), h2 = h1*h1, h4 = h2*h2;
  float cell = rwH3(floor(wpos*2.3) + floor(n*3.0 + 0.5)), facet = (1.0 - smoothstep(0.12, 0.5, fp));
  float gli = step(0.84, cell)*g4*g4*facet, hli = step(0.9, 1.0 - cell)*h4*h4*facet;
  col += f0*uSkyAmber*(0.34*g4 + 0.5*g16*g16 + 1.7*gli)*shine;
  col += f0*uFireCol*uFire.w*(0.4*h4*h2 + 1.3*hli)*shine;
  // form light, never none: the dusk sky's cool from above, the red of weed and water from below, a warm rim
  // from the fires' side (no part of the machine is without shape, however near)
  float upF = 0.5 + 0.5*n.y, rimF = 1.0 - clamp(dot(n, v), 0.0, 1.0);
  col += (0.6*uMistCol + 0.4*uSkyLow)*0.2*upF*upF + uWeedA*0.16*(1.0 - upF)*(1.0 - upF)
    + uFireCol*uFire.w*0.14*rimF*rimF*clamp(0.3 + 0.7*dot(n, fd), 0.0, 1.0);
  // the weed that has climbed the legs: red below, bleached above
  float leg = step(1.5, part)*step(part, 13.5);
  if (uWeedOn.w*leg > 0.001) {
    float hgt = wpos.y - uWeedOn.z, wn = rwN3(wpos*0.5) + 0.5*rwN3(wpos*1.9 + 7.0);
    float wm = uWeedOn.w*(1.0 - smoothstep(uWeedOn.y - 4.5, uWeedOn.y, hgt + (wn - 0.75)*4.0));
    float lump = rwN3(wpos*3.1);
    wm *= smoothstep(0.25, 0.6, wn*0.6 + 0.5*lump + 0.35*(1.0 - smoothstep(0.0, uWeedOn.y, hgt)));
    float sick = smoothstep(uWeedOn.x - 2.5, uWeedOn.x + 1.5, hgt + (wn - 0.75)*3.0);
    vec3 wnrm = normalize(n + 0.7*(vec3(rwN3(wpos*2.7 + 3.0), rwN3(wpos*2.7 + 11.0), rwN3(wpos*2.7 + 19.0)) - 0.5));
    col = mix(col, rwWeed(wnrm, v, 0.35 + 0.4*lump, sick, 0.55 + 0.45*lump), clamp(wm, 0.0, 1.0));
  }
  return col*uDim;
}`;
const METAL_FS = /* glsl */`
${RW_GLSL}
${METAL_LIT}
varying vec3 vW, vN; varying vec4 vE;
void main(){
  vec3 n = normalize(vN + vec3(0.0, 1e-5, 0.0)), v = normalize(cameraPosition - vW);
  vec3 col = rwMetal(n, v, vW, vE.y, vE.zw, vE.x);
  gl_FragColor = vec4(rwAir(col, vW, cameraPosition), 1.0);
}`;
// the ropes: each hangs from its boss in world space and swings as a lagging pendulum of the gait (uSwing: step
// phase, cycle phase, walk amount), with a little life of its own
const ROPE_VS = /* glsl */`
${RW_GLSL}
uniform vec3 uAnchor[6]; uniform float uRopeL[6], uLag; uniform vec4 uSwing; uniform vec3 uDirF, uDirL;
attribute vec4 aR;
varying vec3 vW, vN; varying vec4 vE;
void main(){
  int ri = int(aR.x + 0.5); float t = aR.y, L = uRopeL[ri], lag = aR.x*1.37 + uLag;
  float k = t*sqrt(t);
  float a1 = sin(6.2832*uSwing.x - 1.2 - 2.4*t - 0.5*lag), a2 = sin(6.2832*uSwing.y - 0.7 - 1.7*t + lag);
  vec3 off = uDirF*(a1*1.9*uSwing.z + 0.32*sin(uTime*0.71 + lag*3.0 + 2.0*t)) + uDirL*(a2*1.3*uSwing.z + 0.3*cos(uTime*0.53 + lag*5.1 + 1.7*t));
  vec3 c = uAnchor[ri] + vec3(0.0, -1.0, 0.0)*t*L + off*k*L*0.17;
  c.y += 0.12*L*k*k*(0.35 + 0.65*abs(a1))*(0.4 + 0.6*uSwing.z);                 // the free end curls up as it swings
  float rad = 0.105*(1.0 + aR.w*0.6)*(1.0 - 0.25*t);
  rad = max(rad, 0.8*uPx*length(c - cameraPosition));
  vec3 rn = vec3(cos(aR.z), 0.0, sin(aR.z));
  vec4 wp = modelMatrix*vec4(c + rn*rad, 1.0);
  vN = rn; vW = wp.xyz; vE = vec4(20.0, 0.0, aR.z*0.1, t*L);
  gl_Position = projectionMatrix*viewMatrix*wp;
}`;
// sprites of the walk. aF = (kind, owner, seed, seed2); kinds: 0 spray crown, 1 steam, 2 green joint smoke, 3 water off a lifted pad
const FX_VS = /* glsl */`
${RW_GLSL}
uniform vec4 uFall[3];      // where each foot last came down, and how long ago (s; negative: never)
uniform vec4 uKn[6];        // where each knuckle was when its leg took the load, and how long ago
uniform vec4 uPour[6];      // the lifted pad at six moments of its swing: xyz, seconds since
uniform float uWalk; uniform vec3 uDrift;
attribute vec4 aF;
varying vec2 vUv; varying vec4 vCol; varying vec3 vW; varying vec2 vRag;
void main(){
  float kind = aF.x, s1 = aF.z, s2 = aF.w; int ow = int(aF.y + 0.5);
  vec3 p = vec3(0.0); float size = 0.0, al = 0.0; vec3 col = vec3(0.0); float stretch = 1.0, rag = 0.0;
  vec3 pale = uMistCol*1.25 + 0.2*rwAmb(vec3(0.0, 1.0, 0.0));
  float th = s1*6.2832;
  if (kind < 0.5) {
    vec4 f = uFall[ow]; float t = max(f.w, 0.0);
    float vh = 1.5 + 5.0*s2, vv = 7.0 + 4.6*fract(s2*7.31);
    p = f.xyz + vec3(cos(th), 0.0, sin(th))*(1.3 + vh*t) + vec3(0.0, vv*t - 4.9*t*t, 0.0);
    size = 0.11 + 0.26*t + 0.1*fract(s2*11.3); stretch = 1.5 + 1.2*(1.0 - smoothstep(0.3, 1.2, t));
    al = step(0.0, f.w)*smoothstep(0.0, 0.07, t)*(1.0 - smoothstep(0.9, 2.1, t))*smoothstep(-0.6, 0.3, p.y - f.y)*0.6;
    col = mix(pale*1.05, uWeedA, step(0.6, fract(s2*3.7)));
  } else if (kind < 1.5) {
    vec4 f = uFall[ow]; float t = max(f.w, 0.0);
    p = f.xyz + vec3(cos(th), 0.0, sin(th))*(0.6 + 1.3*t)*(0.4 + 1.6*s2) + vec3(0.6*t, 0.4 + 2.4*t*(0.5 + s2)/(1.0 + 0.25*t), 0.3*t);
    size = 2.3 + 2.1*t;
    al = step(0.0, f.w)*smoothstep(0.0, 0.3, t)*(1.0 - smoothstep(1.6, 4.6, t))*0.085;
    col = pale*0.8;
  } else if (kind < 2.5) {
    // a puff of green smoke squirted from a joint as its leg takes the load: thrown out fast, then it hangs and
    // is left behind on the air, ragged, green for a moment, then grey, then gone. It is smoke: the evening
    // lights it, it gives no light
    vec4 f = uKn[ow]; float t = max(f.w, 0.0);
    vec3 dir = normalize(vec3(cos(th), 0.1 + 0.6*s2, sin(th)));
    float thrown = 1.0 - exp(-t*3.4);
    p = f.xyz + dir*(0.8 + 2.7*thrown)*(0.4 + 0.8*fract(s2*5.7)) + uDrift*(1.6*t) + vec3(0.0, 0.45*t, 0.0);
    size = (0.26 + 0.42*fract(s2*9.7))*(1.0 + 1.5*thrown + 0.35*t);
    float fresh = 1.0 - smoothstep(0.2, 1.25, t);
    al = step(0.0, f.w)*smoothstep(0.0, 0.05, t)*(1.0 - smoothstep(0.9, 2.3, t))*0.5;
    col = mix(vec3(0.3, 0.31, 0.33), vec3(0.15, 0.4, 0.21), fresh)*(rwAmb(vec3(0.0, 1.0, 0.0)) + 0.5*uKeyCol)*1.05; rag = 1.0;
  } else {
    vec4 f = uPour[int(s1*5.999)]; float t = f.w;
    float tt = max(t, 0.0)*(0.75 + 0.5*s2);
    p = f.xyz + vec3(cos(th*7.0), 0.0, sin(th*7.0))*1.0*fract(s2*5.3) + vec3(0.0, -0.9 - 4.9*tt*tt, 0.0);
    size = 0.1; stretch = 6.0 + 8.0*tt;
    al = step(0.0, t)*uWalk*(1.0 - smoothstep(0.7, 1.5, t))*0.6*step(0.0, p.y);
    col = pale;
  }
  vec4 mv = viewMatrix*vec4(p, 1.0);
  mv.xy += position.xy*size*vec2(1.0, stretch);
  vUv = position.xy; vCol = vec4(col, al); vRag = vec2(rag, s1); vW = p;
  if (al < 0.003) mv = vec4(0.0, 0.0, 1e4, 1.0);
  gl_Position = projectionMatrix*mv;
}`;
const FX_FS = /* glsl */`
${RW_GLSL}
varying vec2 vUv; varying vec4 vCol; varying vec3 vW; varying vec2 vRag;
void main(){
  float r = length(vUv), a = vCol.a*(1.0 - smoothstep(0.25, 1.0, r));
  if (vRag.x > 0.5) {                               // smoke: a torn edge, no round disc
    float n = rwN(vUv*1.9 + vRag.y*37.0) + 0.5*rwN(vUv*4.3 - vRag.y*11.0);
    a = vCol.a*smoothstep(0.55, 1.05, n + 0.75*(1.0 - r))*(1.0 - smoothstep(0.7, 1.0, r));
  }
  vec3 col = rwAir(vCol.rgb, vW, cameraPosition);
  gl_FragColor = vec4(col*a, a);
}`;
function buildFxGeometry(rng) {
  const P = [], F = [], I = []; let n = 0;
  const add = (kind, owner) => { const s1 = rng(), s2 = rng(); for (const c of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { P.push(c[0], c[1], 0); F.push(kind, owner, s1, s2); } I.push(n, n + 1, n + 2, n, n + 2, n + 3); n += 4; };
  for (let j = 0; j < 3; j++) { for (let i = 0; i < 40; i++) add(0, j); for (let i = 0; i < 14; i++) add(1, j); }
  for (let k = 0; k < 6; k++) for (let i = 0; i < 9; i++) add(2, k);
  for (let i = 0; i < 54; i++) add(3, 0);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aF', new THREE.Float32BufferAttribute(F, 4)); g.setIndex(I);
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 1e5);
  return g;
}

// ---------------------------------------------------------------- 5. one engine
// makeEngineKit builds the geometry once; kit.make(opts) stands an engine on it. An engine lives in WORLD space
// (its part matrices are world matrices), so `object` stays at the origin, unrotated.
export function makeEngineKit(ctx, U) {
  const eg = buildEngineGeometry(), rg = buildRopeGeometry();
  const fxRng = ctx.core.makeRng(ctx.core.hashSeed('red-weed-fx:' + ctx.seed)), lag0 = ctx.core.makeRng(ctx.core.hashSeed('red-weed-ropes:' + ctx.seed))() * 6.2832;
  const fxGeo = buildFxGeometry(fxRng);
  // an engine whose legs are a longer make (o.L) has a mesh of its own, built once for that make
  const longer = {}, meshFor = (L) => { if (!L) return eg; const key = L.join(' '); if (!longer[key]) longer[key] = buildEngineGeometry(L); return longer[key]; };
  function make(o = {}) {
    const E = makeFrame(o), st = makeState(), st2 = makeState();
    E.cycleT = o.cycleT ?? 5.4;                    // seconds one whole cycle takes at the walking speed (ages of spray and smoke are measured in it)
    E.gStart = o.gStart ?? -1e9;                   // the gait phase at which this engine began to walk: no footfall is older
    const mu = withShared(U, { uPart: { value: st.mats }, uWeedOn: { value: new THREE.Vector4(...(o.weed || [0, 0, 0, 0])) }, uDim: { value: o.dim ?? 1 } });
    const mesh = new THREE.Mesh(meshFor(o.L).geometry, new THREE.ShaderMaterial({ uniforms: mu, vertexShader: METAL_VS, fragmentShader: METAL_FS }));
    mesh.frustumCulled = false; mesh.matrixAutoUpdate = false;
    const ru = withShared(U, { uAnchor: { value: st.anchors }, uRopeL: { value: SZ.ropes.map((r) => r[2]) }, uLag: { value: lag0 }, uSwing: { value: new THREE.Vector4(0, 0, 0, 0) }, uDirF: { value: E.F }, uDirL: { value: E.Lw },
      uWeedOn: { value: new THREE.Vector4(0, 0, 0, 0) }, uDim: mu.uDim });
    const ropes = new THREE.Mesh(rg.geometry, new THREE.ShaderMaterial({ uniforms: ru, vertexShader: ROPE_VS, fragmentShader: METAL_FS }));
    ropes.frustumCulled = false; ropes.matrixAutoUpdate = false;
    const object = new THREE.Group(); object.add(mesh, ropes);
    let fx = null, fu = null;
    if (o.fx) {
      fu = withShared(U, { uFall: { value: [0, 1, 2].map(() => new THREE.Vector4(0, 0, 0, -1)) }, uKn: { value: [0, 1, 2, 3, 4, 5].map(() => new THREE.Vector4(0, 0, 0, -1)) },
        uPour: { value: [0, 1, 2, 3, 4, 5].map(() => new THREE.Vector4(0, 0, 0, -1)) }, uWalk: { value: 0 }, uDrift: { value: new THREE.Vector3(...(o.drift || [0.6, 0, 0.3])) } });
      fx = new THREE.Mesh(fxGeo, new THREE.ShaderMaterial({ uniforms: fu, vertexShader: FX_VS, fragmentShader: FX_FS, transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
        blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor }));
      fx.frustumCulled = false; fx.matrixAutoUpdate = false; fx.renderOrder = 6; object.add(fx);
    }
    const events = new Float32Array(32).fill(-1), tmp = new THREE.Vector3();
    const api = {
      object, mesh, ropes, fx, E, state: st, uniforms: mu, events, joints: st.joints, triangles: eg.triangles + rg.triangles,
      // stride: g = gait phase (cycles), w = walk amount; ctl: { hoodYaw, hoodTip, raise, aim }
      walk(g, w, ctl) {
        poseWalk(E, st, g, w, ctl);
        ru.uSwing.value.set(st.sig, g, w, 0);
        const T = E.cycleT;
        // the last eight footfalls (for the rings on the water): foot (m - 1) mod 3 came down at phase m / 3
        const m0 = Math.floor(3 * g + 1e-7);
        for (let i = 0; i < 8; i++) {
          const m = m0 - i, ge = m / 3, j = (((m - 1) % 3) + 3) % 3, n = Math.floor((m - 1) / 3 + 1e-7);
          if (ge < E.gStart + 1e-6) { events[i * 4 + 2] = -1; continue; }
          plantPoint(E, j, n, tmp); events[i * 4] = tmp.x; events[i * 4 + 1] = tmp.z; events[i * 4 + 2] = (g - ge) * T; events[i * 4 + 3] = 1;
        }
        if (fu) {
          fu.uWalk.value = w;
          for (let j = 0; j < 3; j++) {
            const c = g - j / 3, n = Math.floor(c + 1e-7), f = c - n, landed = f >= 1 / 3 - 1e-7, gf = landed ? n + j / 3 + 1 / 3 : n - 1 + j / 3 + 1 / 3, age = (g - gf) * T;
            const ok = gf > E.gStart + 1e-6;
            plantPoint(E, j, landed ? n : n - 1, tmp);
            fu.uFall.value[j].set(tmp.x, tmp.y + 0.2, tmp.z, ok ? age : -1);
            // where this leg's knuckles were when the load came on (they go on moving; the smoke stays where it was let out)
            if (ok && age < 4) { poseWalk(E, st2, gf + 0.012, 1, {}); fu.uKn.value[j * 2].set(st2.k1[j].x, st2.k1[j].y, st2.k1[j].z, age); fu.uKn.value[j * 2 + 1].set(st2.k2[j].x, st2.k2[j].y, st2.k2[j].z, age + 0.12); }
            else { fu.uKn.value[j * 2].w = -1; fu.uKn.value[j * 2 + 1].w = -1; }
          }
          // water off the lifted pad: six moments of the swing so far
          const js = st.jsw, q = st.q[js], c = g - js / 3, n = Math.floor(c + 1e-7);
          for (let k = 0; k < 6; k++) {
            const qk = 0.04 + 0.11 * k, v = fu.uPour.value[k];
            if (q < 0 || q < qk) { v.w = -1; continue; }
            const sq = Math.sin(Math.PI * qk), a0 = E.phi + (n - 1 + js / 3 + 2 / 3) * E.stride + E.fa[js], a = a0 + E.stride * sstep(0.05, 0.95, qk);
            tmp.copy(E.O).addScaledVector(E.F, a).addScaledVector(E.Lw, E.lat[js] * (1 + 0.07 * w * sq)); tmp.y += w * E.lift * Math.pow(sq, 0.6) + E.sink + SZ.ankle;
            v.set(tmp.x, tmp.y, tmp.z, (q - qk) * T / 3);
          }
        }
      },
      still(soles, body, ctl) { poseStill(E, st, soles, body, ctl); ru.uSwing.value.set(0, 0, 0, 0); },
    };
    return api;
  }
  return { make, triangles: eg.triangles + rg.triangles };
}

// ---------------------------------------------------------------- 6. the viewer's entry
// One engine striding on the spot: the ground slides back under it at the walking speed, and six rings lie on
// the ground at the feet's standing places and slide with it. A foot that is planted must sit still in its ring.
export async function buildHero(ctx, opts = {}) {
  const shared = opts.shared || makeShared(opts.sky || {}), U = shared.U;
  const kit = opts.kit || makeEngineKit(ctx, U);
  await ctx.yield();
  const eng = kit.make({ origin: [0, 0, 0], dir: [0, 1], fx: true, gStart: -1e9, ...(opts.engine || {}) });
  const object = new THREE.Group(); object.add(eng.object);
  // the standing places: flat rings (viewer only)
  const ringGeo = new THREE.RingGeometry(1.5, 1.75, 28).rotateX(-Math.PI / 2), ringMat = new THREE.MeshBasicMaterial({ color: '#d8cdbf' });
  const rings = []; for (let i = 0; i < 6; i++) { const r = new THREE.Mesh(ringGeo, ringMat); r.position.y = 0.05; object.add(r); rings.push(r); }
  const size = new THREE.Vector2(), speed = opts.speed ?? 5.4, tmp = new THREE.Vector3();
  const E = eng.E;
  function update(dt, time, camera) {
    U.uTime.value = time;
    const g = (time * speed) / E.stride;
    E.O.copy(E.F).multiplyScalar(-(E.phi + g * E.stride));                      // the treadmill: the body stays over the origin
    eng.walk(g, 1, { hoodYaw: hoodLook(time, 0.3), raise: sstep(0.55, 0.75, Math.sin(time * 0.21)), aim: tmp.set(0.5, 0.05, 0.86).normalize() });
    for (let j = 0; j < 3; j++) { const n = Math.floor(g - j / 3 + 1e-7); plantPoint(E, j, n, rings[j * 2].position); plantPoint(E, j, n - 1, rings[j * 2 + 1].position); rings[j * 2].position.y = 0.06; rings[j * 2 + 1].position.y = 0.06; }
  }
  update(0, 0, null);
  return { object, radius: 21, height: 36, center: new THREE.Vector3(0, 17, 0), anchors: { hood: new THREE.Vector3(0, SZ.H0 + SZ.hoodY + 2.5, 0) }, update, kit, engine: eng, shared, ground: true, groundY: 0 };
}
