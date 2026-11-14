// STAIRWAY EVERYWHERE: an endless pale-stone lattice of stairs, arcades and aqueducts in luminous periwinkle
// haze, lit by three suns on three perpendicular axes. Every surface is somebody's floor.
//
// Flight (about 950 m, straight down -Z except for the half orbit in the atrium):
//   entry      a grand staircase rising ahead, with lantern-bearers walking on the underside of the flight above
//   gallery 1  a Twist Gallery: a square arcade whose section turns a quarter turn around the level camera
//   pools      out over a wall of arched windows lying flat as a floor of goldfish pools
//   atrium     the Triple Fall (src/parts/stairway-everywhere.js): half orbit of the water sphere
//   gallery 2  the second twist
//   loggia     a short hanging-garden colonnade: here the day has turned to gold (the light changes inside gallery 2)
//   court      the path banks and drops into the Court of Three Stairs: three grand flights arrive from the floor, from
//              the right-hand wall and from the ceiling, a fall runs level along the left into a second, smaller ball
//              of water, and the portal stands in a moon gate where the three floors meet
//
// All stone shares the hero's builder and material (three scene lights + its three-sun ambient). The lattice is
// six instanced module geometries (3 designs x near/far LOD) placed with one of 24 cube rotations per cell.
import * as THREE from 'three';
import { makePath, makeRng, hashSeed, clamp, lerp, smoothstep } from '../kit/core.js';
import * as F from '../kit/fauna.js';
import * as fx from '../kit/fx.js';
import * as W from '../kit/water.js';
import { buildHero, makeBuilder, makeKit, makeStoneMaterial, frame, boundsInSteps, ringWall } from '../parts/stairway-everywhere.js';

const PALETTE = ['#f6e8d0', '#e6c9a0', '#b89a7a', '#8f96c4', '#2f2a44', '#3fb8c9', '#ff7a4a'];
const CELL = 60;
const G1 = { z0: 300, len: 110 }, G2 = { z0: -150, len: 110, alt: true };      // twist galleries: world z of the mouth, length (toward -Z)
const PAV = [-46, -0.68, -105];      // the side pavilion beside the bridge to the second gallery (centre of its cube)
const COL = { z0: -262, z1: -460, floor: -12, half: 12 };           // loggia mouth, portal
// the court: y of the last straight, where the three floors begin, the gate wall, the end of the loggia, the second ball
const FIN = { y: -26, zF: -390, zG: -463.5, zL: -302, sph: [-22.7, -19, -446], sphS: 0.6, fallH: 108, launch: 1.6 };
// the Triple Fall's drain: it leaves the foot of the cascade stair at (x, 0, z) and falls along -Z (drifting toward -X) to the plaza
const DRAIN = { H: 150.4, W: 11.5, D: 0.9, launch: 3.2, x: -97.6, z: -48.6 };
const AX6 = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
const ROTS = [];
for (const x of AX6) for (const y of AX6) if (x[0] * y[0] + x[1] * y[1] + x[2] * y[2] === 0) ROTS.push({ m: frame(x, y), up: y });
const RZ = (a) => new THREE.Matrix4().makeRotationZ(a);
const SUN_DIRS = [[0.1, 1, 0.12], [-1, 0.14, 0.1], [0.07, 0.11, -1]];     // toward each of the three suns

// A sundial lying in the current frame's XZ plane (face toward +Y). `Mw` is that frame's world matrix: the dial
// reads the sun that stands highest over its own face, so dials on perpendicular walls each tell a different time.
function sundial(B, K, r, Mw) {
  const e = Mw.elements, n = [e[4], e[5], e[6]]; let best = 0, bd = -2;
  SUN_DIRS.forEach((d, i) => { const l = Math.hypot(d[0], d[1], d[2]), k = (d[0] * n[0] + d[1] * n[1] + d[2] * n[2]) / l; if (k > bd) { bd = k; best = i; } });
  const d = SUN_DIRS[best], sx = d[0] * e[0] + d[1] * e[1] + d[2] * e[2], sz = d[0] * e[8] + d[1] * e[9] + d[2] * e[10];
  K.stone(0.3); B.lathe(0, 0, [[r * 1.12, 0], [r * 1.12, 0.22], [r, 0.38], [r * 0.9, 0.38], [r * 0.9, 0.2]], 16, 0.8, 1);
  K.stone(0, 4); B.lathe(0, 0, [[r * 0.9, 0.2], [0, 0.22]], 16);
  for (let i = 0; i < 12; i++) B.at(new THREE.Matrix4().makeRotationY(i * Math.PI / 6), () => { K.dark(i % 3 ? 0.7 : 1); B.box(r * (i % 3 ? 0.7 : 0.6), 0.2, -0.05 * r, r * 0.84, 0.27, 0.05 * r, 1, 1); });
  B.at(new THREE.Matrix4().makeRotationY(Math.atan2(-sx, -sz)), () => {
    const t = 0.07 * r, a = [0, 0.22, -r * 0.12], b = [0, 0.22, r * 0.62], c = [0, r * 0.6, -r * 0.12];
    K.roof(); for (const s of [-1, 1]) B.tri([s * t, a[1], a[2]], [s * t, b[1], b[2]], [s * t, c[1], c[2]], [0, 0.3, 0.1 * r], false);
    B.quad([-t, b[1], b[2]], [t, b[1], b[2]], [t, c[1], c[2]], [-t, c[1], c[2]], [0, 0.22, 0], false); B.quad([-t, a[1], a[2]], [t, a[1], a[2]], [t, c[1], c[2]], [-t, c[1], c[2]], [0, 0.3, 0.2 * r], false, 0.8);
    K.dark(1); B.st.kind = 4; B.tri([-0.1 * r, 0.24, r * 0.1], [0.1 * r, 0.24, r * 0.1], [0, 0.24, r * 0.84], [0, -1, 0], false, 0.75);   // the shadow
  });
}

// A runner down the middle of a flight (in the frame and with the step sizes of K.flight): per step a riser and a tread in `col`
// with a pale border, a hand's width proud of the stone, so a stair seen along its length is a stair with a direction, not a
// striped plank. Plain colour (kind 4); no draw from any rng.
function runner(B, nS, run, rise, w, col, edge, e = 0.05) {
  const hw = w / 2, bw = 0.34;
  for (let i = 0; i < nS; i++) { const z0 = i * run, z1 = z0 + run, y0 = i * rise, y1 = y0 + rise;
    for (const [xa, xb, c] of [[-hw, -hw + bw, edge], [-hw + bw, hw - bw, col], [hw - bw, hw, edge]]) { B.color(c, 4, 1);
      B.quad([xa, y0, z0 - e], [xb, y0, z0 - e], [xb, y1 + e, z0 - e], [xa, y1 + e, z0 - e], [0, y0, z0 + 1], false, 0.95, 0.95, 1.15, 1.15);
      B.quad([xa, y1 + e, z0 - e], [xb, y1 + e, z0 - e], [xb, y1 + e, z1 - e], [xa, y1 + e, z1 - e], [0, y1 - 1, z0], false, 1.0, 1.0, 0.84, 0.84); } }
}
// multiply the vertex colours of ranges [a, b) of a finished builder geometry (stone only: lamps and leaves keep theirs)
function applyGains(geo, list) {
  // (an entry may end with a direction: then only the faces that look that way are touched; a direction with a fourth number c
  // names the faces that stand across it instead: those whose normal lies within c of the plane it is the normal of)
  const C = geo.attributes.color.array, Kd = geo.attributes.aK.array, N = geo.attributes.normal.array;
  // (and with a second direction: those faces are then shaded as if they looked that way, as the gallery's arch is)
  for (const [a, b, r, g, bl, n, nn] of list) for (let i = a; i < b; i++) { if (Kd[i] > 1.5 && Kd[i] < 3.5) continue;
    if (n) { const d = N[i * 3] * n[0] + N[i * 3 + 1] * n[1] + N[i * 3 + 2] * n[2]; if (n.length > 3 ? Math.abs(d) > n[3] : d < 0.7) continue; }
    C[i * 3] *= r; C[i * 3 + 1] *= g; C[i * 3 + 2] *= bl;
    if (nn) { N[i * 3] = nn[0]; N[i * 3 + 1] = nn[1]; N[i * 3 + 2] = nn[2]; } }
}

// Cut every long triangle of a builder geometry at the planes z = k * dz (only where z0 < z < z1), so that a later
// twist about the Z axis bends surfaces smoothly instead of leaving each 5 m quad as a flat plank.
// `yld` (optional) hands a frame back between chunks of triangles: the result is the same with or without it.
async function sliceZ(geo, dz, z0, z1, yld) {
  const P = geo.attributes.position.array, N = geo.attributes.normal.array, C = geo.attributes.color.array, Kd = geo.attributes.aK.array;
  // the output goes straight into typed arrays (room for 1.4 times the input, grown when needed): no big JS arrays to collect
  let cap = Math.ceil(P.length * 1.4 / 9) * 9, n = 0, oP = new Float32Array(cap), oN = new Float32Array(cap), oC = new Float32Array(cap), oK = new Float32Array(cap / 3);
  const more = (a, len) => { const b = new Float32Array(len); b.set(a); return b; };
  const grow = () => { cap = Math.ceil(cap * 0.5) * 3; oP = more(oP, cap); oN = more(oN, cap); oC = more(oC, cap); oK = more(oK, cap / 3); };
  // (a cut triangle goes through three fixed polygon buffers, 10 numbers a corner: x y z, colour, normal, kind; nothing is
  //  allocated per triangle, so no collection pause can land in this loop)
  const emit = (v, o) => { if (n + 3 > cap) grow();
    oP[n] = v[o]; oP[n + 1] = v[o + 1]; oP[n + 2] = v[o + 2]; oC[n] = v[o + 3]; oC[n + 1] = v[o + 4]; oC[n + 2] = v[o + 5]; oN[n] = v[o + 6]; oN[n + 1] = v[o + 7]; oN[n + 2] = v[o + 8]; oK[n / 3] = v[o + 9]; n += 3; };
  const bA = new Float64Array(120), bB = new Float64Array(120), bC = new Float64Array(120);
  const clip = (src, ns, dst, zc, keepAbove) => { let nd = 0;
    for (let i = 0; i < ns; i++) { const a = i * 10, b = ((i + 1) % ns) * 10, za = src[a + 2], zb = src[b + 2], ia = keepAbove ? za >= zc : za <= zc, ib = keepAbove ? zb >= zc : zb <= zc;
      if (ia) { const o = nd * 10; for (let j = 0; j < 10; j++) dst[o + j] = src[a + j]; nd++; }
      if (ia !== ib) { const t = (zc - za) / (zb - za), o = nd * 10; for (let j = 0; j < 10; j++) dst[o + j] = src[a + j] + (src[b + j] - src[a + j]) * t; dst[o + 2] = zc; nd++; } }
    return nd; };
  for (let i = 0; i < P.length; i += 9) {
    if (yld && i && i % 900 === 0) await yld();
    const lo = Math.min(P[i + 2], P[i + 5], P[i + 8]), hi = Math.max(P[i + 2], P[i + 5], P[i + 8]);
    if (hi - lo < dz * 1.05 || hi < z0 || lo > z1) {      // left whole (most of them): copied straight across, nothing allocated
      if (n + 9 > cap) grow();
      for (let j = 0; j < 9; j++) { oP[n + j] = P[i + j]; oN[n + j] = N[i + j]; oC[n + j] = C[i + j]; }
      const q = n / 3, r = i / 3; oK[q] = Kd[r]; oK[q + 1] = Kd[r + 1]; oK[q + 2] = Kd[r + 2]; n += 9; continue; }
    for (let j = 0; j < 3; j++) { const o = j * 10, q = i + j * 3; bA[o] = P[q]; bA[o + 1] = P[q + 1]; bA[o + 2] = P[q + 2]; bA[o + 3] = C[q]; bA[o + 4] = C[q + 1]; bA[o + 5] = C[q + 2];
      bA[o + 6] = N[q]; bA[o + 7] = N[q + 1]; bA[o + 8] = N[q + 2]; bA[o + 9] = Kd[i / 3 + j]; }
    for (let s = Math.floor(lo / dz); s * dz < hi; s++) {
      let np = clip(bA, 3, bB, s * dz, true), poly = bB; if (np > 2) { np = clip(bB, np, bC, (s + 1) * dz, false); poly = bC; }
      for (let j = 1; j + 1 < np; j++) { const b = j * 10, c = b + 10;
        const ux = poly[b] - poly[0], uy = poly[b + 1] - poly[1], uz = poly[b + 2] - poly[2], vx = poly[c] - poly[0], vy = poly[c + 1] - poly[1], vz = poly[c + 2] - poly[2];
        if (Math.hypot(uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx) < 1e-6) continue;
        emit(poly, 0); emit(poly, b); emit(poly, c); }
    }
  }
  if (yld) await yld();
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(oP.subarray(0, n), 3)); g.setAttribute('normal', new THREE.BufferAttribute(oN.subarray(0, n), 3));
  g.setAttribute('color', new THREE.BufferAttribute(oC.subarray(0, n), 3)); g.setAttribute('aK', new THREE.BufferAttribute(oK.subarray(0, n / 3), 1));
  geo.dispose(); return g;
}

// ---------------------------------------------------------------------------------------------------------------
// lattice modules: three designs, each in a detailed (lod 1) and a silhouette (lod 0) version. Local +Y is "up".
// ---------------------------------------------------------------------------------------------------------------
async function buildModule(v, lod, pal, rng, style, yld) {
  const B = makeBuilder(lod ? 3500 : 760), K = makeKit(B, pal, rng, style);      // (what they hold, plus a tenth: the builder grows if a design needs more)
  const { T, RY, stone, dark } = K, walks = [];
  let pv = null, under = -1; const lilM = pal[0].clone().multiplyScalar(0.86).lerp(pal[3], 0.55).multiplyScalar(1.5);
  // far roofs: the roof colour pulled 60 percent toward stone, so distant domes are warm stone, not coral blobs
  const softRoof = () => { K.roof(); const r = B.st.r, g = B.st.g, b = B.st.b; stone(0.3); B.st.r = lerp(r, B.st.r, 0.6); B.st.g = lerp(g, B.st.g, 0.6); B.st.b = lerp(b, B.st.b, 0.6); B.st.kind = 4; };
  // low-poly arcade wall along X: y in [0,h], z in [-d/2,d/2], round arches
  const lowArc = (L, bays, h, d, sh, v0 = 0.2) => {
    const bw = L / bays, r = bw * 0.33, hz = d / 2, seg = 5;
    for (let i = 0; i < bays; i++) {
      const xc = -L / 2 + (i + 0.5) * bw, pts = [];
      for (let j = 0; j <= seg; j++) { const a = Math.PI * (1 - j / seg); pts.push([xc + r * Math.cos(a), Math.min(h - 0.5, sh + r * Math.sin(a))]); }
      stone(v0 + 0.1 * (i % 2));
      for (const z of [-hz, hz]) { const ref = [xc, h / 2, 0];
        B.quad([xc - bw / 2, 0, z], [xc - r, 0, z], [xc - r, h, z], [xc - bw / 2, h, z], ref, false, 0.82, 0.8, 1, 1);
        B.quad([xc + r, 0, z], [xc + bw / 2, 0, z], [xc + bw / 2, h, z], [xc + r, h, z], ref, false, 0.8, 0.82, 1, 1);
        for (let j = 0; j < seg; j++) B.quad([pts[j][0], pts[j][1], z], [pts[j + 1][0], pts[j + 1][1], z], [pts[j + 1][0], h, z], [pts[j][0], h, z], ref, false, 0.85, 0.85, 1, 1); }
      const mid = [xc, sh, 0];
      B.quad([xc - r, 0, -hz], [xc - r, 0, hz], [xc - r, sh, hz], [xc - r, sh, -hz], mid, true, 0.6);
      B.quad([xc + r, 0, -hz], [xc + r, 0, hz], [xc + r, sh, hz], [xc + r, sh, -hz], mid, true, 0.6);
      for (let j = 0; j < seg; j++) B.quad([pts[j][0], pts[j][1], -hz], [pts[j][0], pts[j][1], hz], [pts[j + 1][0], pts[j + 1][1], hz], [pts[j + 1][0], pts[j + 1][1], -hz], [xc, sh - r, 0], true, 0.55);
    }
    stone(v0); B.quad([-L / 2, 0, -hz], [-L / 2, 0, hz], [-L / 2, h, hz], [-L / 2, h, -hz], [0, h / 2, 0], false);
    stone(v0 + 0.2); B.box(-L / 2 - 0.4, h, -hz - 0.6, L / 2 + 0.4, h + 0.9, hz + 0.6, 0.6);     // cornice
    B.quad([L / 2, 0, -hz], [L / 2, 0, hz], [L / 2, h, hz], [L / 2, h, -hz], [0, h / 2, 0], false);
  };
  // flight from the frame origin running +Z, rising +Y
  const flight = (m, nS, run, rise, w) => B.at(m, () => {
    if (lod) { K.flight(nS, run, rise, w, 1.5); return; }
    // far: fine steps (a riser and a tread each), one stringer a side and a sloped soffit: a clean flight, not a stack of blocks
    for (let i = Math.max(3, Math.round(nS / 3)); i > 0; i--) stone(0);      // (the draws the old block steps made, so the modules that follow are unchanged)
    const n = Math.max(4, Math.round(nS / 2)), ru = (nS * run) / n, ri = (nS * rise) / n, hw = w / 2 + 0.5, Lz = nS * run, Hy = nS * rise;
    for (let i = 0; i < n; i++) { const z0 = i * ru, y0 = i * ri; K.tone(0.12 + 0.22 * (i % 2), 4);
      B.quad([-hw, y0, z0], [hw, y0, z0], [hw, y0 + ri, z0], [-hw, y0 + ri, z0], [0, y0, z0 + 1], false, 0.58, 0.58, 0.76, 0.76);
      B.quad([-hw, y0 + ri, z0], [hw, y0 + ri, z0], [hw, y0 + ri, z0 + ru], [-hw, y0 + ri, z0 + ru], [0, y0 + ri - 1, z0], false, 1.02, 1.02, 0.84, 0.84); }
    K.tone(0.3);
    for (const sx of [-hw, hw]) B.quad([sx, -2.4, 0], [sx, Hy - 2.4, Lz], [sx, Hy + ri, Lz], [sx, ri, 0], [0, Hy / 2, Lz / 2], false, 0.8, 0.8, 1, 1);
    // (round 7) the far soffit stood as a near-black slab over the shoulder: it is a floor in its own gravity, as the detailed flight's is:
    // the same lifted checkerboard, no triangle more
    K.tone(0.5, 1); B.st.r *= 1.45; B.st.g *= 1.3; B.st.b *= 1.2;
    B.quad([-hw, -2.4, 0], [hw, -2.4, 0], [hw, Hy - 2.4, Lz], [-hw, Hy - 2.4, Lz], [0, Hy, 0], false, 0.78);
    K.tone(0.3);
    B.quad([-hw, -2.4, 0], [hw, -2.4, 0], [hw, ri, 0], [-hw, ri, 0], [0, 0, 1], false, 0.7); B.quad([-hw, Hy - 2.4, Lz], [hw, Hy - 2.4, Lz], [hw, Hy + ri, Lz], [-hw, Hy + ri, Lz], [0, Hy - 1, Lz - 1], false, 0.8);
  });
  const coneTree = (x, y, z, h) => { K.leaf(0.4 + rng()); B.lathe(x, z, [[h * 0.05, y + 0.6], [h * 0.125, y + h * 0.22], [h * 0.1, y + h * 0.58], [0, y + h]], 6, 0.6, 1.15); };
  // far balustrade: two rails and a few piers, enough to read as a parapet
  const lowRail = (x0, x1, y, z) => { stone(0.12); B.box(x0, y + 1.0, z - 0.3, x1, y + 1.3, z + 0.3, 0.7); B.box(x0, y, z - 0.25, x1, y + 0.25, z + 0.25, 1, 1);
    const n = Math.max(2, Math.round((x1 - x0) / 7)); stone(0.3); for (let i = 0; i <= n; i++) { const x = lerp(x0 + 0.4, x1 - 0.4, i / n); B.box(x - 0.4, y + 0.25, z - 0.4, x + 0.4, y + 1.7, z + 0.4, 1, 1); } };
  const kiosk = (x, y, z) => {
    if (lod) { for (const sx of [-1, 1]) for (const sz of [-1, 1]) { stone(0.2); B.column(x + sx * 2.6, z + sz * 2.6, y, y + 5, 0.34, 6); }
      stone(0.35); B.cbox(x - 3.4, y + 5, z - 3.4, x + 3.4, y + 5.7, z + 3.4, 0.2, 0.6); K.roof(); B.lathe(x, z, [[3.1, y + 5.7], [2.4, y + 7.3], [0.3, y + 8.6]], 8, 0.8, 1.05); K.lantern(x, y + 8.6, z, 0.5);
    } else { stone(0.25); for (const sx of [-1, 1]) B.box(x + sx * 2.6 - 0.5, y, z - 3, x + sx * 2.6 + 0.5, y + 5, z + 3, 0.7, 1); B.box(x - 3.4, y + 5, z - 3.4, x + 3.4, y + 5.7, z + 3.4, 0.6); softRoof(); B.lathe(x, z, [[3.1, y + 5.7], [2.75, y + 7.0], [1.6, y + 8.2], [0.25, y + 8.8]], 8, 0.8, 1.08); }
  };
  if (v === 0) {                     // arcaded bridge along X, a flight off its deck, a kiosk landing
    if (lod) { const nT = rng.int(1, 2); B.push(T(0, -7, 0)); K.galleryA(60, 4, true); await yld(); K.galleryB(60, 4, nT); B.pop(); await yld(); }
    else { B.at(T(0, -8.5, 0), () => lowArc(60, 4, 14, 11, 6)); stone(0.3); B.box(-30, 5.5, -6.6, 30, 7, 6.6, 0.6);
      lowRail(-21, 21, 7, -6); lowRail(-21, 21, 7, 6); coneTree(8, 6, 0, 13); }
    flight(T(25.5, 7, 6.5), 13, 1.5, 1.0, 6);
    stone(0.4); if (lod) B.cbox(21.5, 18, 26, 29.5, 20, 34.5, 0.3, 0.6); else B.box(21.5, 18, 26, 29.5, 20, 34.5, 0.6);
    kiosk(25.5, 20, 30.5);
    walks.push([[-20, 7, 2.6], [20, 7, 2.6]], [[20, 7, -2.6], [-20, 7, -2.6]], [[25.5, 7, 7], [25.5, 20, 26]]);
  } else if (v === 1) {              // domed pavilion with two flights and a walkway spur
    if (lod) { K.pavilionA(); await yld(); K.pavilionB(); await yld();
      // (round 7) seen from below a cell was a near-black slab with a pinwheel: the two upper slabs' undersides now carry four openings
      // each (a lit lilac field), and the undersides themselves are lifted into the lilac shadow tone below
      under = B.tris * 3;
      for (const [y, a, b, hw] of [[-12.63, 10.0, 12.4, 8.6], [-15.03, 6.5, 9.1, 5.2]]) for (let k = 0; k < 4; k++) B.at(RY(k * Math.PI / 2), () => {
        B.color(lilM, 4, 0); B.quad([-hw, y, a], [hw, y, a], [hw, y, b], [-hw, y, b], [0, y + 5, 0], false, 0.8, 0.8, 1, 1); }); }
    else { for (let k = 0; k < 4; k++) B.at(RY(k * Math.PI / 2).multiply(T(0, -11, 10.6)), () => lowArc(24, 1, 20.1, 2.4, 9.5, 0.12));
      stone(0.4); B.box(-12.8, -12.6, -12.8, 12.8, -11, 12.8, 0.6); B.box(-13.2, 10, -13.2, 13.2, 11.6, 13.2, 0.6);
      stone(0.25); B.lathe(0, 0, [[9.2, 11.6], [9.2, 15.2]], 8, 0.85, 1);
      softRoof(); B.lathe(0, 0, [[8.6, 15.2], [7.6, 15.2 + 4.2 * style.domeH], [4.6, 15.2 + 7.4 * style.domeH], [0.7, 15.2 + 8.6 * style.domeH]], 8, 0.8, 1.08);
      { const a = B.tris * 3; dark(0.3); B.lathe(0, 0, [[0, -22.5], [3.2, -17.2], [9.5, -12.6]], 6, 0.6, 0.8); pv = [a, B.tris * 3]; } }
    flight(T(0, -11, 13), 14, 1.4, 1.0, 6);
    flight(RY(Math.PI).multiply(T(0, -11, 13)), 14, 1.4, 1.0, 6);
    stone(0.35); B.box(13, -12.6, -3.6, 30, -11, 3.6, 0.6);
    if (lod) { stone(0.2, 1); B.quad([13, -10.97, -3], [30, -10.97, -3], [30, -10.97, 3], [13, -10.97, 3], [20, -20, 0], false); K.balustrade(13.5, 29.5, -11, -3.2, 2); K.balustrade(13.5, 29.5, -11, 3.2, 0); }
    walks.push([[0, -11, 13.5], [0, 3, 32.5]], [[0, -11, -13.5], [0, 3, -32.5]], [[-7, -11, -6], [28, -11, 0]]);
  } else {                           // two-tier aqueduct wall along Z with a garden balcony and a stair up to it
    const R = frame([0, 0, 1], [0, 1, 0]);
    if (lod) { for (let i = 0; i < 3; i++) { stone(0.1 + 0.08 * i); B.at(R.clone().setPosition(0, -22, -20 + i * 20), () => B.archWall(20, 24, 3.2, 12, 15, style.archRise, 8)); }
      for (let i = 0; i < 6; i++) { stone(0.18); B.at(R.clone().setPosition(0, 2.6, -25 + i * 10), () => B.archWall(10, 11, 2.6, 6.2, 6.4, style.archRise, 6)); }
      stone(0.35); B.cbox(-2.1, 2, -30, 2.1, 2.6, 30, 0.2, 0.6); await yld();
    } else { B.at(R.clone().setPosition(0, -22, 0), () => lowArc(60, 3, 24, 3.2, 15)); B.at(R.clone().setPosition(0, 2.6, 0), () => lowArc(60, 6, 11, 2.6, 6.4, 0.25)); }
    stone(0.3); B.box(-2.4, 13.6, -30, 2.4, 14.4, 30, 0.6); stone(0.15); B.box(-2.4, 14.4, -30, -1.6, 15.6, 30, 1, 1); B.box(1.6, 14.4, -30, 2.4, 15.6, 30, 1, 1);
    stone(0.4); B.box(1.6, 1, -14, 9.4, 2.6, 14, 0.55);
    if (lod) { stone(0.2, 1); B.quad([1.6, 2.63, -14], [9.4, 2.63, -14], [9.4, 2.63, 14], [1.6, 2.63, 14], [5, -5, 0], false);
      B.at(frame([0, 0, 1], [0, 1, 0], 9, 2.6, 0), () => K.balustrade(-13.5, 13.5, 0, 0, 1));
      K.cypress(6.6, 2.6, -9, rng.range(8, 11)); K.orangeTree(6.6, 2.6, 0, 1.1); K.cypress(6.6, 2.6, 9, rng.range(7, 10));
    } else { coneTree(6.6, 2.6, -9, 10); coneTree(6.6, 2.6, 9, 9); B.at(frame([0, 0, 1], [0, 1, 0], 9, 2.6, 0), () => lowRail(-14, 14, 0, 0)); }
    flight(T(5.5, -12, -33.5), 14, 1.4, 1.0, 5.5);
    walks.push([[5, 2.6, -13], [5, 2.6, 13]], [[5.5, -12, -33], [5.5, 2, -14]]);
  }
  await yld();
  // The far pavilion's six-sided cone (seen from below: a cube with a hexagonal disc) gives way to two stepped slabs and a turned
  // boss, as on the detailed one. The cone's vertices are folded to a point inside the slab, and the positions as they were are
  // kept in `samplePos`: the lattice tests its cells with those, so every cell stands exactly where it stood.
  const nOld = B.tris * 3; let samplePos = null;
  if (pv) { K.tone(0.5); B.box(-9.5, -15, -9.5, 9.5, -12.6, 9.5, 0.6); K.tone(0.6); B.box(-6, -17.2, -6, 6, -15, 6, 0.6);
    dark(0.3); B.lathe(0, 0, [[0, -22.5], [1.2, -20.5], [0.6, -19.4], [3.2, -17.2]], 8, 0.6, 0.85); }      // (round 7: eight sides, as the detailed one has; it had twelve)
  const geo = B.finish();
  if (under >= 0 || pv) { const P = geo.attributes.position.array, N = geo.attributes.normal.array, C = geo.attributes.color.array, nU = under >= 0 ? under : P.length / 3;
    for (let i = 0; i < nU; i++) if (N[i * 3 + 1] < -0.9 && P[i * 3 + 1] < -12) { C[i * 3] *= 2.0; C[i * 3 + 1] *= 1.8; C[i * 3 + 2] *= 2.1; } }      // (the far pavilion's undersides too)
  // (round 7: the folded cone was twelve triangles of no area in every far pavilion; they are cut out of the arrays now. The
  //  samples still come from the positions as they were, so no cell moves.)
  if (pv) { samplePos = geo.attributes.position.array.slice(0, nOld * 3);
    for (const nm of ['position', 'normal', 'color', 'aK']) { const at = geo.attributes[nm], sz = at.itemSize, A = at.array, nA = new A.constructor(A.length - (pv[1] - pv[0]) * sz);
      nA.set(A.subarray(0, pv[0] * sz), 0); nA.set(A.subarray(pv[1] * sz), pv[0] * sz); geo.setAttribute(nm, new THREE.BufferAttribute(nA, sz)); } }
  geo.computeBoundingSphere();
  return { geo, tris: B.tris, lanterns: K.lanterns.slice(), walks, samplePos };
}

// water accumulator for the hero's water material: uv = (across, along), aW = (0 flat, alpha, foam)
function makeWaterAcc() {
  const P = [], N = [], U = [], A = [], v = new THREE.Vector3(), n = new THREE.Vector3();
  return {
    flat(m, x0, x1, y, z0, z1, v0, v1, f0 = 0, f1 = 0, a0 = 1, a1 = 1, warp = null) {
      const c = [[x0, z0, 0, v0, f0, a0], [x1, z0, 1, v0, f0, a0], [x1, z1, 1, v1, f1, a1], [x0, z1, 0, v1, f1, a1]];
      for (const i of [0, 1, 2, 0, 2, 3]) { const q = c[i]; v.set(q[0], y, q[1]); n.set(0, 1, 0);
        if (warp) warp(v, n); if (m) { v.applyMatrix4(m); n.transformDirection(m); }
        P.push(v.x, v.y, v.z); N.push(n.x, n.y, n.z); U.push(q[2], q[3]); A.push(0, q[5], q[4]); }
    },
    // thin falling sheet in the plane z = const of frame m, from y0 down to y1 (the hero shader's "falling" kind)
    sheet(m, x0, x1, y0, y1, z, rows = 16, fade = 0.55) {
      for (let j = 0; j < rows; j++) { const q = [];
        for (const [xx, jj, uu] of [[x0, j, 0], [x1, j, 1], [x1, j + 1, 1], [x0, j + 1, 0]]) { const sj = jj / rows; q.push([xx, lerp(y0, y1, sj * (0.35 + 0.65 * sj)), uu, sj]); }
        for (const i of [0, 1, 2, 0, 2, 3]) { const c = q[i]; v.set(c[0], c[1], z); n.set(0, 0, 1); if (m) { v.applyMatrix4(m); n.transformDirection(m); }
          P.push(v.x, v.y, v.z); N.push(n.x, n.y, n.z); U.push(c[2], (y0 - c[1]) * 0.07); A.push(1, smoothstep(0, 0.05, c[3]) * (1 - smoothstep(fade, 1, c[3])), c[3]); } }
    },
    // falling tube along fn(s) -> { p: [0, y, z], hw, th } in the y-z plane of frame m (the hero's own falls are built the same way)
    // `uScale` (optional) scales the across coordinate: at 0.5 (with half the v range) the shader's streaks are twice the size, for a
    // stream the camera passes close to (at the hero's scale its finest streaks are smaller than a pixel there and break into dashes)
    // `ring` vertices round it; with `crowd` they gather at the two sharp edges of a flattened stream, so its silhouette is smooth
    tube(m, fn, rows, v0, v1, fadeIn, fadeOut, uScale = 1, ring = 10, crowd = 0) {
      const R = [];
      for (let j = 0; j <= rows; j++) { const s = j / rows, c = fn(s), c2 = fn(Math.min(1, s + 0.01)), c0 = fn(Math.max(0, s - 0.01));
        let ty = c2.p[1] - c0.p[1], tz = c2.p[2] - c0.p[2]; const tl = Math.hypot(ty, tz) || 1; ty /= tl; tz /= tl; const ny = -tz, nz = ty, row = [];
        for (let i = 0; i <= ring; i++) { const t0 = (i / ring) * 6.2832, a = t0 - crowd * Math.sin(2 * t0), ca = Math.cos(a), sa = Math.sin(a);
          row.push([ca * c.hw, c.p[1] + sa * c.th * ny, c.p[2] + sa * c.th * nz, ca * c.th, sa * c.hw * ny, sa * c.hw * nz, Math.abs(i / ring * 2 - 1), lerp(v0, v1, s),
            smoothstep(-1e-4, Math.max(fadeIn, 1e-4), s) * (1 - smoothstep(1 - Math.max(fadeOut, 1e-4), 1.0001, s)), s, Math.abs(sa)]); }
        R.push(row); }
      for (let j = 0; j < rows; j++) for (let i = 0; i < ring; i++) for (const q of [R[j][i], R[j][i + 1], R[j + 1][i + 1], R[j][i], R[j + 1][i + 1], R[j + 1][i]]) {
        v.set(q[0], q[1], q[2]); n.set(q[3], q[4], q[5]).normalize(); if (m) { v.applyMatrix4(m); n.transformDirection(m); }
        // (kind 2 .. 2.45: falling water that also says how far round from its two sharp edges a point is; the shader thins the stream
        //  out toward them, so its outline is water breaking into strands and not the folded facets of the tube)
        P.push(v.x, v.y, v.z); N.push(n.x, n.y, n.z); U.push(q[6] * uScale, q[7]); A.push(2 + 0.45 * q[10], q[8], q[9]); }
    },
    geometry() { const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); g.setAttribute('aW', new THREE.Float32BufferAttribute(A, 3)); g.computeBoundingSphere(); return g; },
  };
}

// ---------------------------------------------------------------------------------------------------------------
// Twist Gallery: built straight along local +Z (0..len), then every vertex is turned about the axis by
// sign * 90 deg * smoothstep(z). `world` maps local to world (local +Z = world -Z). The untwisted position and
// normal are kept as aRP / aRN so the ashlar and checker patterns stay glued to the stone.
// ---------------------------------------------------------------------------------------------------------------
// Async only so that it can hand frames back (`yld`) while it works: the order of every call and random draw is unchanged.
async function buildGallery(G, sign, pal, rng, style, water, out, yld) {
  const LEN = G.len, bays = 20, bl = LEN / bays;
  // (the Lantern Gallery, G.alt, is built of the world's own pale stone, as the first gallery is: every face keeps its own tone)
  const palAlt = pal;
  const B = makeBuilder(G.alt ? 26000 : 19000), K = makeKit(B, palAlt, rng, style), { stone, dark, T } = K;      // (grows if needed)
  const Kt = G.alt ? makeKit(B, pal, rng, style) : K; let alt = null;
  const world = frame([-1, 0, 0], [0, 1, 0], 0, 0, G.z0);
  const theta = (z) => sign * Math.PI / 2 * smoothstep(8, LEN - 8, z);
  const SIDE = frame([0, 0, 1], [0, 1, 0]);
  // the wall at x = fs * 8.95 ends the twist as the floor: its windows hold water (pools standing on edge at the mouth,
  // lying flat at the far end) and goldfish; `win` puts a point (height, -, z) of that wall's mid-plane into the twisted gallery
  const fs = -sign, tone = K.tone;
  const lilF = pal[0].clone().multiplyScalar(0.86).lerp(pal[3], 0.55).multiplyScalar(sign < 0 ? 1.45 : 0.85);      // (round 7) the roof fields: lilac, lifted where they stand in shade
  const win = (v, n) => { const yy = v.x, t = theta(v.z), c = Math.cos(t), s = Math.sin(t), X = fs * 8.95; v.x = X * c - yy * s; v.y = X * s + yy * c; n.set(-fs * c, -fs * s, 0); };
  const rillWarp = (v, n) => { const t = theta(v.z), c = Math.cos(t), s = Math.sin(t), x = v.x * c - v.y * s, y = v.x * s + v.y * c; v.x = x; v.y = y; n.set(-s, c, 0); };
  const gains = [], diaIn = []; let ringIn = null;      // (round 7: tones of single parts, applied to the finished geometry before it is cut and twisted)
  if (G.alt) { const E = { B, K, Kt, LEN, theta, world, sign, water, rng, style, yld, gains, coral: pal[6].clone().lerp(pal[0], 0.2).multiplyScalar(0.9), lil: pal[0].clone().multiplyScalar(0.86).lerp(pal[3], 0.6).multiplyScalar(0.82).multiply(new THREE.Color(0.94, 0.84, 1.16)) };
    alt = await galleryAltBody(E); await galleryAltParts(E, alt);
  } else {
  for (let i = 0; i < bays; i++) {
    const z0 = i * bl, z1 = z0 + bl, zc = z0 + bl / 2;
    for (const sx of [-1, 1]) {
      const xa = Math.min(sx * 1.1, sx * 9.6), xb = Math.max(sx * 1.1, sx * 9.6), mm = (a, b) => [Math.min(sx * a, sx * b), Math.max(sx * a, sx * b)];
      stone(0.35); B.box(xa, -9.6, z0, xb, -8, z1, 0.6, 2);
      stone(0.18, 1); B.quad([xa, -8, z0], [xb, -8, z0], [xb, -8, z1], [xa, -8, z1], [0, -20, zc], false, sx > 0 ? 0.86 : 1, sx > 0 ? 1 : 0.86, sx > 0 ? 1 : 0.86, sx > 0 ? 0.86 : 1);
      const [ca, cb] = mm(5.4, 9.6);
      stone(0.3); { const ra = B.tris * 3; B.box(ca, 8, z0, cb, 9.6, z1, 0.72);
        // (round 7) on the hand where the twist turns the roof's underside away from every sun it stood as a navy-black plate: there
        // its stone is lifted into the lilac of a shadow; on both hands it carries a field and a rib of the pale stone in every bay
        if (sign < 0) gains.push([ra, B.tris * 3, 1.75, 1.6, 1.85, [0, -1, 0]]); }
      { const [fa, fb] = mm(5.8, 8.3); B.color(lilF, 4, 0); B.quad([fa, 7.985, z0 + 0.4], [fb, 7.985, z0 + 0.4], [fb, 7.985, z1 - 0.4], [fa, 7.985, z1 - 0.4], [0, 20, zc], false, 0.85, 0.85, 1, 1);
        if (i % 2) { const [ga, gb] = mm(5.4, 8.56); tone(0.4); if (sign < 0) { B.st.r *= 1.5; B.st.g *= 1.4; B.st.b *= 1.6; } B.box(ga, 7.76, z0 - 0.22, gb, 8, z0 + 0.22, 0.85, 2); } }
      stone(0.08 + 0.1 * (i % 2)); B.at(SIDE.clone().setPosition(sx * 8.95, -8, zc), () => B.archWall(bl, 16, 0.8, 2.7, 8.1, style.archRise, 6, 0.62, true));
      // the windows' sill wall and two flush mouldings (they project a hand's width, so the turned wall is a clean floor)
      { const [a, b] = mm(8.52, 9.4); tone(0.3); B.box(a, -8, z0, b, -5.5, z1, 0.8, 1); }
      { const [a, b] = mm(8.3, 9.55); tone(0.42); B.box(a, -5.5, z0, b, -5.2, z1, 0.7); B.box(a, 3.7, z0, b, 4.1, z1, 0.7); }
      if (i % 2 === 0) { dark(0.4); B.box(sx * 6.9 - 0.45, -8, zc - 0.45, sx * 6.9 + 0.45, -6.7, zc + 0.45, 0.8, 1); K.lantern(sx * 6.9, -6.7, zc, 0.4); }
      else if (i % 4 === 1) { if (i === 13) rng(); else K.orangeTree(sx * 6.8, -8, zc, 0.62); }
    }
    dark(0.55); B.box(-1.1, -9.0, z0, 1.1, -8.5, z1, 0.6, 1);
    // a round diaphragm arch every second bay: seen down the axis they are a nest of portals, each turned a little further
    if (i % 2 === 0 && i) { const da = B.tris * 3; tone(0.16 + 0.08 * ((i / 2) % 2)); B.at(T(0, -8, z0), () => B.archWall(19.2, 15.9, 0.9, 15.2, 8, 1, 14));
      // (round 7) each diaphragm arch is moulded on the side the flight sees: a projecting archivolt of voussoirs, alternately of the
      // pale stone and the sand, an architrave down both jambs, a keystone (no draw)
      { const zf = z0 - 0.78, zb = z0 - 0.45, n = 12, p = (a, r, z) => [r * Math.cos(a), r * Math.sin(a), z];
        for (let q = 0; q < n; q++) { const a0 = Math.PI * q / n, a1 = Math.PI * (q + 1) / n, mid = p((a0 + a1) / 2, 8.1, z0); tone(q % 2 ? 0.55 : 0.04);
          B.quad(p(a0, 7.62, zf), p(a1, 7.62, zf), p(a1, 8.55, zf), p(a0, 8.55, zf), mid, false);
          B.quad(p(a0, 8.55, zf), p(a1, 8.55, zf), p(a1, 8.55, zb), p(a0, 8.55, zb), mid, false, 0.85); }
        for (const sx of [-1, 1]) { tone(0.3); B.box(Math.min(sx * 7.62, sx * 8.55), -8, zf, Math.max(sx * 7.62, sx * 8.55), 0, zb, 0.8, 3); tone(0.45); B.box(Math.min(sx * 7.5, sx * 8.7), -0.4, zf - 0.1, Math.max(sx * 7.5, sx * 8.7), 0.2, zb, 0.7); }
        tone(0.02); B.box(-0.62, 7.25, zf - 0.14, 0.62, 9.0, zb, 0.75);
        // two small banners of the pale stone's own tones hang in the spandrels of every diaphragm arch
        for (const sx of [-1, 1]) out.pale.push([sx * 6.2, 7.3, zf - 0.12, theta(z0)]); }
        diaIn.push([da, B.tris * 3]);
      const t = theta(z0); out.hangs.push({ p: new THREE.Vector3(0, 7.45, z0).applyAxisAngle(new THREE.Vector3(0, 0, 1), t).applyMatrix4(world), up: new THREE.Vector3(-Math.sin(t), Math.cos(t), 0).transformDirection(world) }); }
    for (let h = 0; h < 4; h++) { const a = z0 + h * bl / 4, b = a + bl / 4; water.flat(world, -1.1, 1.1, -8.14, a, b, a / 5, b / 5, 0, 0, 1, 1, (v, n) => { const t = theta(v.z), c = Math.cos(t), s = Math.sin(t);
      const x = v.x * c - v.y * s, y = v.x * s + v.y * c; v.x = x; v.y = y; n.set(-s, c, 0); }); }
    for (let h = 0; h < 2; h++) water.flat(world, -5.5, 1.42, 0, zc - 1.34 + h * 1.34, zc + h * 1.34, h * 0.27, (h + 1) * 0.27, 0, 0, 0.78, 0.78, win);
    await yld();
  }
  stone(0.12); B.at(T(0, -8, -1.6), () => B.archWall(46, 21, 3.2, 16, 8, 1, 10));     // entrance front (untwisted): arch, loggia, two thin falls
  stone(0.3); B.cbox(-23.4, 13, -3.7, 23.4, 14.2, 0.5, 0.3, 0.6);
  for (let i = 0; i < 5; i++) { stone(0.16 + 0.06 * (i % 2)); B.at(T(-18.4 + i * 9.2, 14.2, -1.6), () => B.archWall(9.2, 17.8, 2.4, 5.4, 10.4, style.archRise, 6)); }
  // the front is dressed: pilasters, a string course, and on each side a blind niche holding a thin fall from a carved spout to a basin
  for (const sx of [-1, 1]) { const xn = sx * 14.6;
    stone(0.05); B.at(T(xn, -8, -3.5), () => B.archWall(5.6, 20.2, 0.6, 3.5, 15.6, style.archRise, 6, 0.75));
    dark(0.3); B.quad([xn - 1.8, -8, -3.23], [xn + 1.8, -8, -3.23], [xn + 1.8, 9.6, -3.23], [xn - 1.8, 9.6, -3.23], [xn, 0, 5], false, 0.7, 0.7, 1, 1);
    dark(0.45); B.cbox(xn - 1.5, 8.2, -4.5, xn + 1.5, 9.1, -3.2, 0.2, 0.6); B.box(xn - 0.9, 7.6, -4.9, xn + 0.9, 8.2, -3.2, 0.7);
    water.sheet(world, xn - 1.2, xn + 1.2, 8.1, -7.2, -4.55, 12, 0.93);
    stone(0.3); B.lathe(xn, -4.4, [[0.9, -8], [2.25, -7.3], [2.4, -6.75], [2.05, -6.75], [1.9, -7.15]], 10, 0.6, 1); dark(0.4); B.lathe(xn, -4.4, [[0, -11], [0.5, -9.4], [0.9, -8]], 6, 0.6, 0.85);
    water.flat(world, xn - 1.25, xn + 1.25, -6.95, -5.75, -3.25, 0, 0.5, 0.6, 0.6);
    for (const xp of [sx * 10.2, sx * 19.2]) { stone(0.28); B.cbox(xp - 0.8, -8, -3.75, xp + 0.8, 11.9, -3.2, 0.14, 0.75); stone(0.4); B.cbox(xp - 1.15, 11.9, -3.95, xp + 1.15, 13, -3.2, 0.16, 0.7); B.cbox(xp - 1.1, -8, -3.95, xp + 1.1, -6.9, -3.2, 0.16, 0.9);
      stone(0.45); B.box(xp - 0.45, 0.3, -4.5, xp + 0.45, 0.9, -3.7, 0.6); K.lantern(xp, 0.9, -4.1, 0.42);
      tone(0.4); B.box(xp - 0.95, 4.35, -3.98, xp + 0.95, 5.1, -3.2, 0.7); }      // the string course carried round each pilaster
    stone(0.36); for (const [xa, xb] of [[8.95, 9.35], [11.05, 11.75], [17.45, 18.35], [20.05, 21]]) B.box(Math.min(sx * xa, sx * xb), 4.4, -3.5, Math.max(sx * xa, sx * xb), 5.05, -3.2, 0.7);
    await yld(); }
  // an archivolt round the great arch and an architrave down its jambs: the largest shape of the front gets a moulded edge
  { const p = (a, r, z) => [r * Math.cos(a), r * Math.sin(a), z], n = 20;
    for (let i = 0; i < n; i++) { const a0 = Math.PI * i / n, a1 = Math.PI * (i + 1) / n, mid = p((a0 + a1) / 2, 8.45, -3.3); tone(0.3 + 0.16 * (i % 2));
      B.quad(p(a0, 8.03, -3.5), p(a1, 8.03, -3.5), p(a1, 8.9, -3.5), p(a0, 8.9, -3.5), mid, false);
      B.quad(p(a0, 8.9, -3.5), p(a1, 8.9, -3.5), p(a1, 8.9, -3.2), p(a0, 8.9, -3.2), mid, false, 0.85); }
    for (const sx of [-1, 1]) { tone(0.3); B.box(Math.min(sx * 8.03, sx * 8.9), -8, -3.5, Math.max(sx * 8.03, sx * 8.9), 0, -3.2, 0.8, 3);
      tone(0.45); B.box(Math.min(sx * 7.95, sx * 9.05), -0.35, -3.62, Math.max(sx * 7.95, sx * 9.05), 0.3, -3.2, 0.7); } }
  { const Md = frame([1, 0, 0], [0, 0, -1], 0, 11.05, -3.2); B.at(Md, () => sundial(B, K, 1.6, world.clone().multiply(Md))); }
  stone(0.3); B.cbox(-23, 32, -3.6, 23, 33.6, 0.4, 0.3, 0.6);
  for (const sx of [-1, 1]) { stone(0.25); B.cbox(sx * 23 - 2, -9.6, -3.9, sx * 23 + 2, 36, 0.7, 0.4, 0.7); K.roof(); B.lathe(sx * 23, -1.6, [[2.6, 36], [1.8, 39], [0.3, 42]], 4, 0.85, 1.05); K.lantern(sx * 23, 42, -1.6, 0.6); }
  // a long thin fall down the front of each tower: from a carved spout under the cornice, past the landing, away into the depths
  for (const sx of [-1, 1]) { const xt = sx * 23;
    dark(0.45); B.cbox(xt - 1.9, 29.2, -5.3, xt + 1.9, 30.2, -3.8, 0.2, 0.6); B.box(xt - 1.3, 28.5, -5.0, xt + 1.3, 29.2, -3.8, 0.7);
    tone(0.4); B.cbox(xt - 2.3, 30.2, -4.6, xt + 2.3, 31.0, -3.8, 0.15, 0.7);
    dark(0.3); B.quad([xt - 1.6, -9.6, -3.93], [xt + 1.6, -9.6, -3.93], [xt + 1.6, 28.5, -3.93], [xt - 1.6, 28.5, -3.93], [xt, 0, 5], false, 0.72, 0.72, 1, 1);
    water.sheet(world, xt - 1.5, xt + 1.5, 29.3, -78, -5.35, 30, 0.62); }
  stone(0.14); { const ra = B.tris * 3; ringWall(B, 21, 8.3, LEN, LEN + 3, 1.3);                             // exit front (a quarter turn round)
    // (round 7) the inside of the ring stood near black where it is turned from the suns: it is lifted into the lilac of a shadow
    ringIn = [ra, B.tris * 3]; }
  await yld();
  // (polish) The rill runs between two low kerbs and leaves by the far opening over a carved lip, falling away outside along
  // its own down; and the far wall, seen through the open roof on the way out, is dressed: three blind arches with lamps
  // between pilasters, a string course and a cornice, a second moulded ring round the opening. No draw from rng.
  for (let i = 0; i < bays; i++) for (const sx of [-1, 1]) { tone(0.42); B.box(Math.min(sx * 1.1, sx * 1.42), -8, i * bl, Math.max(sx * 1.1, sx * 1.42), -7.76, (i + 1) * bl, 0.8, 1); }
  for (const sx of [-1, 1]) { tone(0.42); B.box(Math.min(sx * 1.1, sx * 1.42), -8.4, LEN, Math.max(sx * 1.1, sx * 1.42), -7.76, LEN + 3.6, 0.8); }
  dark(0.45); B.cbox(-1.75, -9.1, LEN + 3.0, 1.75, -8.22, LEN + 3.95, 0.15, 0.6);
  water.flat(world, -1.1, 1.1, -8.14, LEN, LEN + 3.7, LEN / 5, (LEN + 3.7) / 5, 0, 0.6, 1, 1, rillWarp);
  water.sheet(world.clone().multiply(RZ(sign * Math.PI / 2)), -1.1, 1.1, -8.2, -19, LEN + 4.0, 10, 0.75);
  await yld();
  { const zf = LEN - 0.3, p = (a, r, z) => [r * Math.cos(a), r * Math.sin(a), z];
    for (const [xc, wN, hN, y0] of [[0, 7.4, 9.4, 9.9], [-13.2, 6, 7.6, 9.9], [13.2, 6, 7.6, 9.9]]) {
      tone(0.08); B.at(T(xc, y0, zf), () => B.archWall(wN, hN, 0.6, wN * 0.5, hN * 0.54, style.archRise, 8, 0.75));
      tone(0.72); B.quad([xc - wN * 0.26, y0, LEN - 0.06], [xc + wN * 0.26, y0, LEN - 0.06], [xc + wN * 0.26, y0 + hN * 0.8, LEN - 0.06], [xc - wN * 0.26, y0 + hN * 0.8, LEN - 0.06], [xc, y0, LEN + 5], false, 0.6, 0.6, 0.95, 0.95);      // (shadowed stone, not a red panel)
      K.lantern(xc, y0, LEN - 0.7, 0.55); }
    for (const xp of [-18.6, -8.3, -4.9, 4.9, 8.3, 18.6]) { tone(0.3); B.cbox(xp - 0.7, 9.6, LEN - 0.75, xp + 0.7, 19.6, LEN, 0.14, 0.75); }
    tone(0.42); B.cbox(-21, 19.6, LEN - 1.0, 21, 20.7, LEN, 0.16, 0.7); B.box(-21, 9.6, LEN - 0.5, 21, 9.9, LEN, 0.7);
    for (let i = 0; i < 40; i++) { const a0 = i / 40 * Math.PI * 2, a1 = (i + 1) / 40 * Math.PI * 2, mid = p((a0 + a1) / 2, 8.9, LEN); tone(0.3 + 0.16 * (i % 2));
      B.quad(p(a0, 8.3, LEN - 0.35), p(a1, 8.3, LEN - 0.35), p(a1, 9.5, LEN - 0.35), p(a0, 9.5, LEN - 0.35), mid, false);
      B.quad(p(a0, 9.5, LEN), p(a1, 9.5, LEN), p(a1, 9.5, LEN - 0.35), p(a0, 9.5, LEN - 0.35), mid, false, 0.85);
      B.quad(p(a0, 8.3, LEN), p(a1, 8.3, LEN), p(a1, 8.3, LEN - 0.35), p(a0, 8.3, LEN - 0.35), [0, 0, LEN], true, 0.62); } }
  await yld();
  }      // (end of the first gallery's own body)
  const geo0 = B.finish(); if (gains.length) applyGains(geo0, gains);
  if (ringIn) { const P0 = geo0.attributes.position.array, N0 = geo0.attributes.normal.array, C0 = geo0.attributes.color.array;      // the inside of the exit ring only
    for (let i = ringIn[0]; i < ringIn[1]; i++) if (Math.abs(N0[i * 3 + 2]) < 0.2 && Math.hypot(P0[i * 3], P0[i * 3 + 1]) < 8.45) { C0[i * 3] *= 1.5; C0[i * 3 + 1] *= 1.42; C0[i * 3 + 2] *= 1.62; } }
  if (diaIn.length) { const P0 = geo0.attributes.position.array, N0 = geo0.attributes.normal.array, C0 = geo0.attributes.color.array;      // the inside of each diaphragm arch:
    for (const [a, b] of diaIn) for (let i = a; i < b; i++) { const x = P0[i * 3], y = P0[i * 3 + 1];      // it looks at no sun and stood navy: lilac shadow now
      if (Math.abs(N0[i * 3 + 2]) < 0.2 && (y > 0 ? Math.hypot(x, y) < 7.7 : Math.abs(x) < 7.7)) { C0[i * 3] *= 1.9; C0[i * 3 + 1] *= 1.72; C0[i * 3 + 2] *= 2.05; } } }
  const geo = await sliceZ(geo0, G.alt ? LEN / 50 : bl / 4, 6, LEN - 6, yld);      // (the Lantern Gallery's bays are twice as long: cut every 2.2 m)
  await yld();
  // twist
  const pos = geo.attributes.position.array, nor = geo.attributes.normal.array;
  geo.setAttribute('aRP', new THREE.BufferAttribute(pos.slice(), 3)); geo.setAttribute('aRN', new THREE.BufferAttribute(nor.slice(), 3));
  await yld();
  // the intrados of the big entrance arch: all its faces take ONE normal (toward the front, a little up), so they shade alike and
  // only the baked occlusion grades them: with their own normals the ten flat faces broke into black, maroon and tan
  if (!G.alt) for (let i = 0; i < pos.length; i += 3) { const x = pos[i], y = pos[i + 1], z = pos[i + 2];
    if (z < -3.3 || z > 0.1 || Math.abs(nor[i + 2]) > 0.2 || Math.abs(x) > 8.05 || y > 8.05) continue;
    if (y <= 0.01 ? Math.abs(x) < 7.9 : Math.abs(Math.hypot(x, y) - 8) > 0.1) continue;
    nor[i] = 0; nor[i + 1] = 0.2491; nor[i + 2] = -0.9685; }
  const v = new THREE.Vector3(), nrm = new THREE.Matrix3().setFromMatrix4(world);
  await yld();
  for (let i = 0; i < pos.length; i += 3) {
    if (i && i % 3000 === 0) await yld();
    const t = theta(pos[i + 2]), c = Math.cos(t), s = Math.sin(t);
    v.set(pos[i] * c - pos[i + 1] * s, pos[i] * s + pos[i + 1] * c, pos[i + 2]).applyMatrix4(world); pos[i] = v.x; pos[i + 1] = v.y; pos[i + 2] = v.z;
    v.set(nor[i] * c - nor[i + 1] * s, nor[i] * s + nor[i + 1] * c, nor[i + 2]).applyMatrix3(nrm); nor[i] = v.x; nor[i + 1] = v.y; nor[i + 2] = v.z;
  }
  await yld();
  await boundsInSteps(geo, yld);
  await yld();
  const tw =(x, y, z) => { const t = theta(z), c = Math.cos(t), s = Math.sin(t); return new THREE.Vector3(x * c - y * s, x * s + y * c, z).applyMatrix4(world); };
  for (const l of K.lanterns) { const p = tw(l[0], l[1], l[2]); out.glows.push([p.x, p.y, p.z, l[3]]); }
  for (const b of out.pale) { const c = Math.cos(b[3]), sn = Math.sin(b[3]);      // (round 7) the small pale banners, each hung along its arch's own down
    out.banners.push({ p: tw(b[0], b[1], b[2]), right: new THREE.Vector3(c, sn, 0).transformDirection(world), down: new THREE.Vector3(sn, -c, 0).transformDirection(world), w: 1.5, len: 2.9, pale: 1 }); }
  if (G.alt) {      // the Lantern Gallery's own cast: hanging lanterns, walkers on three planes, goldfish in the rill on the wall
    const { R, nb, marks } = alt, b2 = alt.bl, upAt = (z, ux, uy) => { const t = theta(z), c = Math.cos(t), s = Math.sin(t); return new THREE.Vector3(ux * c - uy * s, ux * s + uy * c, 0).transformDirection(world); };
    for (const h of marks.hangs) out.hangs.push({ p: tw(h[0], h[1] - 0.02, h[2]), up: upAt(h[2], 0, 1) });
    for (let i = 0; i < nb; i++) { const za = i * b2 + 0.6, zb = za + b2 - 1.2, zm = (za + zb) / 2, crossing = i === 4 || i === 5;
      for (const sx of [-1, 1]) if (sx === (i % 2 ? 1 : -1) || rng.chance(0.3)) { const x = sx * (crossing ? 3.9 : rng.range(2.6, 4.2)); out.segs.push({ a: tw(x, -8, za), b: tw(x, -8, zb), up: upAt(zm, 0, 1), n: 1, keep: 1 }); }
      for (const sy of [-1, 1]) if (sy === (i % 2 ? -1 : 1) || rng.chance(0.4)) { const y = sy * rng.range(2.4, 4.2); out.segs.push({ a: tw(R * 8.54, y, za), b: tw(R * 8.54, y, zb), up: upAt(zm, -R, 0), n: 1, keep: 1 }); }
      if (!crossing && i % 4 === 2) { const x = rng.sign() * rng.range(5.0, 6.2); out.segs.push({ a: tw(x, 8, za), b: tw(x, 8, zb), up: upAt(zm, 0, -1), n: 1, keep: 1 }); }
      out.fish.push({ a: tw(R * 8.3, rng.range(-0.6, 0.6), za), b: tw(R * 8.3, rng.range(-0.6, 0.6), zb), up: upAt(zm, -R, 0), n: 2 }); }
    return { geo, tris: geo.attributes.position.count / 3 };
  }
  // lantern-bearers on the turning floor: short beats, each with the local "up"
  for (let i = 0; i < bays; i += 2) for (const sx of [-1, 1]) { if (rng.chance(0.15)) continue;
    const x = sx * rng.range(3.2, 5.6), za = i * bl + 0.5, zb = za + bl * 2 - 1, t = theta((za + zb) / 2);
    out.segs.push({ a: tw(x, -8, za), b: tw(x, -8, zb), up: new THREE.Vector3(-Math.sin(t), Math.cos(t), 0).transformDirection(world), n: 1 }); }
  for (let i = 1; i < bays - 1; i += 2) { const x = rng.range(-0.5, 0.5); out.fish.push({ a: tw(x, -8.1, i * bl + 0.4), b: tw(x, -8.1, (i + 1) * bl - 0.4), up: new THREE.Vector3(-Math.sin(theta((i + 0.5) * bl)), Math.cos(theta((i + 0.5) * bl)), 0).transformDirection(world), n: 1 }); }
  // goldfish in the water windows, each swimming up and down its own pane
  for (let i = 0; i < bays; i++) { const zf = (i + 0.5) * bl + rng.range(-0.7, 0.7), t = theta(zf), X = fs * 8.9;
    out.fish.push({ a: tw(X, -4.9, zf), b: tw(X, 0.4, zf), up: new THREE.Vector3(-fs * Math.cos(t), -fs * Math.sin(t), 0).transformDirection(world), n: 1 }); }
  return { geo, tris: geo.attributes.position.count / 3 };
}

// A wall panel like B.archWall (x in [-w/2, w/2], y in [0, h], z in [-d/2, d/2]) pierced by a POINTED arch: two arcs whose
// centres stand c * (half the opening) either side of the axis (0 = round, 1 = equilateral). mould > 0 lays a moulded band of
// that width round the opening on both faces, its voussoirs alternately lighter and darker.
function archWallP(B, w, h, d, ow, sh, c = 0.5, seg = 12, ao = 0.62, mould = 0) {
  const r = ow / 2, hz = d / 2, cx = c * r, R = r + cx, a1 = Math.acos(clamp(cx / R, -1, 1)), half = Math.max(2, seg >> 1), L = [], pts = [], nrm = [];
  for (let i = 0; i <= half; i++) { const a = Math.PI - a1 * i / half; L.push([cx + R * Math.cos(a), Math.min(h - 0.4, sh + R * Math.sin(a)), Math.cos(a), Math.sin(a)]); }
  for (let i = 0; i <= half; i++) { pts.push([L[i][0], L[i][1]]); nrm.push([L[i][2], L[i][3]]); }
  for (let i = half - 1; i >= 0; i--) { pts.push([-L[i][0], L[i][1]]); nrm.push([-L[i][2], L[i][3]]); }
  const n = pts.length - 1, ref = [0, h / 2, 0], mid = [0, sh, 0];
  for (const z of [-hz, hz]) {
    B.quad([-w / 2, 0, z], [-r, 0, z], [-r, h, z], [-w / 2, h, z], ref, false, 0.86, 0.8, 1, 1);
    B.quad([r, 0, z], [w / 2, 0, z], [w / 2, h, z], [r, h, z], ref, false, 0.8, 0.86, 1, 1);
    for (let i = 0; i < n; i++) { const a = pts[i], b = pts[i + 1]; B.quad([a[0], a[1], z], [b[0], b[1], z], [b[0], h, z], [a[0], h, z], ref, false, 0.84, 0.84, 1, 1); }
  }
  B.quad([-r, 0, -hz], [-r, 0, hz], [-r, sh, hz], [-r, sh, -hz], mid, true, ao * 1.15, ao * 1.15, ao, ao);
  B.quad([r, 0, -hz], [r, 0, hz], [r, sh, hz], [r, sh, -hz], mid, true, ao * 1.15, ao * 1.15, ao, ao);
  for (let i = 0; i < n; i++) { const a = pts[i], b = pts[i + 1]; B.quad([a[0], a[1], -hz], [a[0], a[1], hz], [b[0], b[1], hz], [b[0], b[1], -hz], mid, true, ao); }
  B.quad([-w / 2, h, -hz], [w / 2, h, -hz], [w / 2, h, hz], [-w / 2, h, hz], [0, 0, 0], false);
  B.quad([-w / 2, 0, -hz], [-w / 2, 0, hz], [-w / 2, h, hz], [-w / 2, h, -hz], [w / 2, h / 2, 0], false);
  B.quad([w / 2, 0, -hz], [w / 2, 0, hz], [w / 2, h, hz], [w / 2, h, -hz], [-w / 2, h / 2, 0], false);
  if (!(mould > 0)) return;
  const pj = 0.32, o = pts.map((p, i) => [p[0] + nrm[i][0] * mould, Math.min(h - 0.05, p[1] + nrm[i][1] * mould)]);
  for (const s of [-1, 1]) { const zf = s * (hz + pj), zb = s * hz, rf = [0, sh, 0];
    for (const sx of [-1, 1]) { const xa = sx * r, xb = sx * (r + mould);      // the architrave down each jamb
      B.quad([xa, 0, zf], [xb, 0, zf], [xb, sh, zf], [xa, sh, zf], rf, false, 0.86, 0.86, 1, 1); B.quad([xb, 0, zb], [xb, 0, zf], [xb, sh, zf], [xb, sh, zb], rf, false, 0.8);
      B.quad([xa, 0, zb], [xa, 0, zf], [xa, sh, zf], [xa, sh, zb], rf, true, 0.7); }
    for (let i = 0; i < n; i++) { const a = pts[i], b = pts[i + 1], oa = o[i], ob = o[i + 1], sv = i % 2 ? 0.8 : 1;
      B.quad([a[0], a[1], zf], [b[0], b[1], zf], [ob[0], ob[1], zf], [oa[0], oa[1], zf], rf, false, sv);
      B.quad([oa[0], oa[1], zb], [ob[0], ob[1], zb], [ob[0], ob[1], zf], [oa[0], oa[1], zf], rf, false, 0.8 * sv);
      B.quad([a[0], a[1], zb], [b[0], b[1], zb], [b[0], b[1], zf], [a[0], a[1], zf], rf, true, 0.66); } }
}

// ---------------------------------------------------------------------------------------------------------------
// The second Twist Gallery is another place of the same architecture: the Lantern Gallery. Its stone is the palette's
// shadow stone with ivory trim; it is roofed (round skylights in every other bay) and lit by lanterns; its bays are twice as
// long, with tall pointed windows down one wall only; the other wall is a floor on edge, paved, with the rill running along
// it between two kerbs (it ends the twist as the floor and pours out of the far gate), potted orange trees growing from it
// and lantern-bearers walking it; pointed cross arches frame a domed crossing half way, with a sundial on its floor and one
// on the paved wall; and the far end is a tall pointed gate, not a round one. Built straight (rest frame) like the first.
// E: { B, K (shadow stone), Kt (ivory trim), LEN, theta, world, sign, water, rng, style, yld, coral }
// ---------------------------------------------------------------------------------------------------------------
async function galleryAltBody(E) {
  const { B, K, Kt, LEN, theta, world, sign, water, rng, style, yld, coral } = E, { stone, dark, tone, T } = K;
  const nb = 10, bl = LEN / nb, R = -sign, Lw = sign, SIDE = frame([0, 0, 1], [0, 1, 0]), mm = (a, b) => [Math.min(a, b), Math.max(a, b)];
  const rill = (v, n) => { const yy = v.x, t = theta(v.z), c = Math.cos(t), s = Math.sin(t), X = R * 8.34; v.x = X * c - yy * s; v.y = X * s + yy * c; n.set(-R * c, -R * s, 0); };
  const onR = (y, z) => frame([0, 0, 1], [-R, 0, 0], R * 8.55, y, z);      // a frame standing on the paved wall: its +Y is that wall's "up"
  const marks = { hangs: [], cross: [44, 66] };
  for (let i = 0; i < nb; i++) {
    const z0 = i * bl, z1 = z0 + bl, zc = z0 + bl / 2, crossing = i === 4 || i === 5;
    // floor: paving with an inlaid band down the middle
    stone(0.35); B.box(-9.6, -9.6, z0, 9.6, -8, z1, 0.6, 2);
    for (const sx of [-1, 1]) { tone(0.25, 1); const [a, b] = mm(sx * 1.75, sx * 8.6); B.quad([a, -8, z0], [b, -8, z0], [b, -8, z1], [a, -8, z1], [0, -20, zc], false, 0.9, 0.9, 0.9, 0.9); }
    tone(0.38, 4); B.quad([-1.5, -8, z0], [1.5, -8, z0], [1.5, -8, z1], [-1.5, -8, z1], [0, -20, zc], false);
    for (const sx of [-1, 1]) { dark(0.9); B.st.kind = 4; const [a, b] = mm(sx * 1.5, sx * 1.75); B.quad([a, -8, z0], [b, -8, z0], [b, -8, z1], [a, -8, z1], [0, -20, zc], false, 0.8); }
    // roof: closed, a round skylight in every other bay; the crossing has its dome instead
    if (!crossing) { stone(0.3);
      if (i % 2) { B.at(frame([1, 0, 0], [0, 0, -1], 0, 8, zc), () => ringWall(B, bl / 2, 2.7, 0, 1.6, 0.5, 20));
        for (const sx of [-1, 1]) { const [a, b] = mm(sx * bl / 2, sx * 9.6); B.box(a, 8, z0, b, 9.6, z1, 0.72); } }
      else B.box(-9.6, 8, z0, 9.6, 9.6, z1, 0.72);
      for (const sx of [-1, 1]) { Kt.tone(0.4); const [a, b] = mm(sx * 7.3, sx * 8.6); B.box(a, 7.55, z0, b, 8, z1, 0.75); }      // a cornice under the roof
      marks.hangs.push([-3.9, 8, zc], [3.9, 8, zc]);
      // (round 7) the roof's underside is a ceiling at the mouth and a wall at the far end, and it was plain brick: it is coffered.
      // Ribs of the pale stone, fields of lilac shadow, a turned rosette in each; round a skylight a moulded ring. No draw.
      const fld = (xa, xb, za, zb, ros) => { B.color(E.lil, 4, 0); B.quad([xa, 7.985, za], [xb, 7.985, za], [xb, 7.985, zb], [xa, 7.985, zb], [0, 20, zc], false, 0.8, 0.8, 1, 1);
        if (ros) { Kt.tone(0.3); B.lathe((xa + xb) / 2, (za + zb) / 2, [[0, 7.7], [0.62, 7.8], [0.95, 7.98]], 8, 1, 0.85); } };
      Kt.tone(0.4); B.box(-7.3, 7.72, z0 - 0.3, 7.3, 8, z0 + 0.3, 0.85, 2);
      if (i % 2) { for (const sx of [-1, 1]) { const [a, b] = mm(sx * 4.25, sx * 7.05); fld(a, b, z0 + 0.55, z1 - 0.55, false);
          Kt.tone(0.4); const [c, d] = mm(sx * 3.7, sx * 4.0); B.box(c, 7.74, z0 + 0.3, d, 8, z1 - 0.3, 0.85, 2); }
        Kt.tone(0.42); B.lathe(0, zc, [[2.72, 7.72], [3.4, 7.72], [3.4, 7.99]], 20, 0.9, 1); }
      else { for (const sx of [-1, 1]) { Kt.tone(0.4); const [c, d] = mm(sx * 2.2, sx * 2.7); B.box(c, 7.74, z0 + 0.3, d, 8, z1 - 0.3, 0.85, 2); }
        Kt.tone(0.4); B.box(-7.3, 7.74, zc - 0.25, 7.3, 8, zc + 0.25, 0.85, 2);
        for (const [xa, xb] of [[-7.05, -2.95], [-1.95, 1.95], [2.95, 7.05]]) for (const [za, zb] of [[z0 + 0.55, zc - 0.5], [zc + 0.5, z1 - 0.55]]) fld(xa, xb, za, zb, true); } }
    // the window wall: a tall pointed window with a sill balustrade, two small lights above, a string course between
    stone(0.1 + 0.08 * (i % 2)); B.at(SIDE.clone().setPosition(Lw * 8.95, -8, zc), () => archWallP(B, bl, 10.5, 0.8, 6.2, 5.2, 0.5, 12, 0.62));
    B.at(SIDE.clone().setPosition(Lw * 8.95, -8, zc), () => K.balustrade(-3.0, 3.0, 0, 0, 0));
    for (const dz of [-bl / 4, bl / 4]) { stone(0.16); B.at(SIDE.clone().setPosition(Lw * 8.95, 2.5, zc + dz), () => B.archWall(bl / 2, 5.5, 0.8, 2.2, 2.7, style.archRise, 6, 0.62, true)); }
    { const [a, b] = mm(Lw * 8.3, Lw * 9.55); Kt.tone(0.42); B.box(a, 2.3, z0, b, 2.72, z1, 0.7); }
    // the paved wall: checkerboard, the rill between two kerbs, a string course near each edge
    stone(0.22); { const [a, b] = mm(R * 8.62, R * 9.4); B.box(a, -8, z0, b, 8, z1, 0.8, 3); }
    tone(0.2, 1); B.quad([R * 8.54, -8, z0], [R * 8.54, 8, z0], [R * 8.54, 8, z1], [R * 8.54, -8, z1], [R * 20, 0, zc], false, 0.92);
    K.deep(0.7); B.quad([R * 8.42, -1.1, z0], [R * 8.42, 1.1, z0], [R * 8.42, 1.1, z1], [R * 8.42, -1.1, z1], [R * 20, 0, zc], false, 0.8);
    for (const sy of [-1, 1]) { Kt.tone(0.42); const [a, b] = mm(R * 8.56, R * 8.14), [c, d] = mm(sy * 1.1, sy * 1.45); B.box(a, c, z0, b, d, z1, 0.8);
      Kt.tone(0.5); const [e, f] = mm(R * 8.56, R * 8.36), [g, h] = mm(sy * 7.2, sy * 7.5); B.box(e, g, z0, f, h, z1, 0.8); }
    for (let h = 0; h < 8; h++) { const a = z0 + h * bl / 8, b = a + bl / 8; water.flat(world, -1.1, 1.1, 0, a, b, a / 5, b / 5, 0, 0, 1, 1, rill); }
    // what stands on the three floors: lamps and a potted orange tree on the floor, a lamp and two trees on the paved wall
    dark(0.4); B.box(Lw * 6.9 - 0.45, -8, z0 - 0.45, Lw * 6.9 + 0.45, -6.7, z0 + 0.45, 0.8, 1); K.lantern(Lw * 6.9, -6.7, z0, 0.42);
    if (i % 2 === 0 && !crossing) K.orangeTree(R * 5.9, -8, zc, 0.66);
    B.at(onR(-5.6, z0), () => { dark(0.4); B.box(-0.45, 0, -0.45, 0.45, 1.1, 0.45, 0.8, 1); K.lantern(0, 1.1, 0, 0.42); });
    if (i % 2) B.at(onR(5.6, zc), () => K.orangeTree(0, 0, 0, 0.66)); else if (!crossing) B.at(onR(-5.2, zc + 2.5), () => K.orangeTree(0, 0, 0, 0.6));
    // hanging gardens trail from the roof's edge over the windows
    if (!crossing) for (let j = 0; j < 2; j++) vine(B, K, rng, Lw * (7.5 + rng.range(-0.2, 0.3)), 7.55, zc + (j - 0.5) * 5.2 + rng.range(-0.6, 0.6), rng.range(1.8, 4.6), coral);
    // a pointed cross arch every second bay
    if (i % 2 === 0 && i) { stone(0.14); B.at(T(0, -8, z0), () => archWallP(B, 19.2, 15.9, 0.9, 15.4, 5.0, 0.45, 16, 0.62, i === 4 || i === 6 ? 0.7 : 0)); }
    await yld();
  }
  return { marks, R, Lw, bl, nb, onR, rill };
}

// the Lantern Gallery's one-off parts: the domed crossing with its two sundials, the entrance front, the far gate and the spill
async function galleryAltParts(E, A) {
  const { B, K, Kt, LEN, theta, world, sign, water, rng, style, yld, coral } = E, { stone, dark, tone, T } = K, { R, Lw, onR, rill } = A;
  const RZq = (a) => new THREE.Matrix4().makeRotationZ(a), mm = (a, b) => [Math.min(a, b), Math.max(a, b)];
  // ---- the crossing (bays 4 and 5): a pierced plate, a drum with a ledge of lanterns, a dome with an open eye
  { const zc = 55, P = (a, r, y) => [r * Math.cos(a), y, zc + r * Math.sin(a)], n = 24;
    stone(0.3); B.at(frame([1, 0, 0], [0, 0, -1], 0, 8, zc), () => ringWall(B, 9.6, 7.2, 0, 1.6, 0, 32));
    for (const sz of [-1, 1]) { const [a, b] = mm(zc + sz * 9.6, zc + sz * 11); B.box(-9.6, 8, a, 9.6, 9.6, b, 0.72); }
    const prof = [[8.2, 9.6], [8.2, 11.2], [7.6, 13.0], [6.0, 14.5], [4.0, 15.3], [2.2, 15.6]];
    for (let j = 0; j < prof.length - 1; j++) for (let i = 0; i < n; i++) { const a0 = i / n * 6.2832, a1 = (i + 1) / n * 6.2832, [r0, y0] = prof[j], [r1, y1] = prof[j + 1];
      if (j === 0) Kt.tone(0.2 + 0.2 * (i % 2)); else tone(0.1 + 0.1 * ((i + j) % 2), 4);
      B.quad(P(a0, r0, y0), P(a1, r0, y0), P(a1, r1, y1), P(a0, r1, y1), [0, 11, zc], true, j ? 0.95 : 0.8, j ? 0.95 : 0.8, 1, 1); }
    stone(0.25); B.lathe(0, zc, [[8.9, 9.6], [8.9, 11.4]], n, 0.85, 1); Kt.tone(0.45); B.lathe(0, zc, [[9.2, 11.4], [9.2, 11.9], [8.6, 11.9]], n, 0.8, 1);
    K.roof(); B.lathe(0, zc, [[8.6, 11.9], [8.0, 13.4], [6.4, 14.9], [4.3, 15.75], [2.5, 16.0], [2.2, 15.6]], n, 0.85, 1.05);
    for (let i = 0; i < 8; i++) { const a = (i + 0.5) * Math.PI / 4; K.lantern(7.7 * Math.cos(a), 9.6, zc + 7.7 * Math.sin(a), 0.5); }
    // the floor dial and the dial on the paved wall: two perpendicular faces, each reading its own sun (after the twist)
    const tw = RZq(theta(zc));
    { const Ms = T(0, -7.96, zc); B.at(Ms, () => sundial(B, Kt, 3.0, world.clone().multiply(tw).multiply(Ms))); }
    { const Md = onR(5.6, zc - 0.01); B.at(Md, () => sundial(B, Kt, 1.9, world.clone().multiply(tw).multiply(Md))); }
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) K.orangeTree(sx * 5.2, -8, zc + sz * 5.2, 0.6);
    await yld(); }
  // ---- the entrance front (untwisted): a pointed portal with a moulded surround, two tiers of lamp-lit arches and a balcony
  // with hanging gardens either side, a gabled upper loggia of three pointed arches between two lower wings, a dome on top
  stone(0.12); B.at(T(0, -8, -1.6), () => archWallP(B, 46, 21, 3.2, 16, 5.0, 0.45, 16, 0.62, 0.95));
  stone(0.3); B.cbox(-23.4, 13, -3.7, 23.4, 14.2, 0.5, 0.3, 0.6);
  for (const sx of [-1, 1]) {
    for (const xc of [sx * 13.3, sx * 19.5]) for (const [yb, hh] of [[-8, 9.6], [2.2, 9.6]]) {
      Kt.tone(0.1); B.at(T(xc, yb, -3.45), () => B.archWall(5.6, hh, 0.5, 3.0, 5.4, style.archRise, 6, 0.75));
      dark(0.95); B.st.kind = 4; B.quad([xc - 1.5, yb, -3.26], [xc + 1.5, yb, -3.26], [xc + 1.5, yb + 7.4, -3.26], [xc - 1.5, yb + 7.4, -3.26], [xc, yb, 5], false, 0.55, 0.55, 0.9, 0.9);
      Kt.tone(0.4); B.box(xc - 0.4, yb, -3.6, xc + 0.4, yb + 1.0, -3.2, 0.8); K.lantern(xc, yb + 1.0, -3.42, 0.46); }
    const [xa, xb] = mm(sx * 9.9, sx * 22.9);
    Kt.tone(0.4); B.cbox(xa, 1.5, -5.6, xb, 2.2, -3.2, 0.15, 0.6); K.balustrade(xa + 0.3, xb - 0.3, 2.2, -5.25, 2);
    K.orangeTree(sx * 16.4, 2.2, -4.5, 0.62);
    for (let j = 0; j < 6; j++) vine(B, K, rng, sx * (10.6 + j * 2.3 + rng.range(-0.4, 0.4)), 1.5, -5.45, rng.range(1.6, 4.4), coral);
    stone(0.16); B.at(T(sx * 17.4, 14.2, -1.6), () => B.archWall(12, 7.5, 2.4, 5.6, 3.6, style.archRise, 8));
    stone(0.3); B.cbox(Math.min(sx * 11.2, sx * 23.6), 21.7, -3.3, Math.max(sx * 11.2, sx * 23.6), 22.6, 0.1, 0.2, 0.6);
    K.cypress(sx * 20.6, 22.6, -1.6, rng.range(7, 9)); K.lantern(sx * 23, 22.6, -1.6, 0.6);
    await yld(); }
  for (const xc of [-7.6, 0, 7.6]) { stone(0.14 + (xc ? 0 : 0.08)); B.at(T(xc, 14.2, -1.6), () => archWallP(B, 7.6, 13, 2.4, 4.6, 5.5, 0.5, 10, 0.62, 0.5)); }
  stone(0.3); B.cbox(-11.9, 27.2, -3.6, 11.9, 28.4, 0.4, 0.3, 0.6);
  stone(0.3); B.cbox(-4.6, 28.4, -5.6, 4.6, 29.1, 2.4, 0.2, 0.6); stone(0.22); B.lathe(0, -1.6, [[3.9, 29.1], [3.9, 29.7], [3.4, 29.7], [3.4, 31.5], [3.8, 31.5], [3.8, 32]], 12, 0.85, 1);
  { K.roof(); const dp = []; for (let i = 0; i <= 6; i++) { const a = i / 6 * Math.PI / 2; dp.push([3.6 * Math.cos(a), 32 + 3.6 * style.domeH * Math.sin(a)]); } dp[6][0] = 0.5;
    B.lathe(0, -1.6, dp, 12, 0.8, 1.08); K.lantern(0, 32 + 3.6 * style.domeH, -1.6, 0.7); }
  for (const sx of [-1, 1]) { stone(0.25); B.lathe(sx * 10.6, -1.6, [[1.2, 28.4], [1.2, 29.4], [0.8, 29.4], [0.5, 32.6], [0, 34]], 4); }
  await yld();
  // ---- the far gate: a tall pointed arch with a flat sill (built turned back a quarter, so the twist stands it upright), the
  // rill running out through it over a carved lip into a basin on the loggia's floor
  B.push(RZq(-sign * Math.PI / 2));
  // (round 7) the gallery is roofed, so the face of its end wall that the gallery sees stands in the roof's shade: the same stone at
  // about half, cool, warmed by the lanterns; the pointed opening has a frame of the pale stone round it, and the court and the
  // portal's light are seen through a pale arch in a shaded wall
  stone(0.14); { const ga = B.tris * 3; B.box(-21, -21, LEN, 21, -8.55, LEN + 3, 0.7);
    B.at(T(0, -8.55, LEN + 1.5), () => archWallP(B, 42, 29.55, 3, 14.6, 7.0, 0.45, 16, 0.62, 0)); // (only the face the gallery sees is the dark wall. The jambs and the head of the opening stood black where they are turned from the
    // suns: they are lifted into the lilac of a shadow instead; the face toward the court is the stone it was)
    E.gains.push([ga, B.tris * 3, 0.5, 0.48, 0.66, [0, 0, -1]], [ga, B.tris * 3, 1.12, 1.2, 1.55, [0, 0, 1, 0.3]]); }
  Kt.tone(0.16); B.at(T(0, -8.55, LEN - 0.07), () => archWallP(B, 17.0, 18.6, 0.14, 14.6, 7.0, 0.45, 16, 0.62, 1.15));
  for (const sx of [-1, 1]) { Kt.tone(0.42); const [a, b] = mm(sx * 1.1, sx * 1.45); B.box(a, -8.56, LEN, b, -8.14, LEN + 3.5, 0.8); }
  dark(0.45); B.cbox(-1.7, -9.3, LEN + 3, 1.7, -8.5, LEN + 3.7, 0.15, 0.6);
  Kt.tone(0.35); B.lathe(0, LEN + 5.9, [[2.9, -12], [2.9, -11.3], [2.4, -11.3], [2.4, -11.9]], 14, 0.8, 1); K.deep(0.7); B.lathe(0, LEN + 5.9, [[2.4, -11.9], [0, -11.88]], 14);
  for (const sx of [-1, 1]) { Kt.tone(0.4); B.cbox(sx * 9.4 - 0.5, -8.55, LEN - 1.1, sx * 9.4 + 0.5, -7.2, LEN - 0.1, 0.1, 0.8); }
  B.pop();
  for (let h = 0; h < 2; h++) water.flat(world, -1.1, 1.1, 0, LEN + h * 1.8, LEN + (h + 1) * 1.8, (LEN + h * 1.8) / 5, (LEN + (h + 1) * 1.8) / 5, 0, h ? 0.55 : 0, 1, 1, rill);
  water.sheet(world, -1.1, 1.1, -8.32, -11.7, LEN + 3.75, 6, 0.95);
  water.flat(world, -1.7, 1.7, -11.45, LEN + 4.2, LEN + 7.6, 0, 0.6, 0.7, 0.2, 0.95, 0.95);
  await yld();
}

// ---------------------------------------------------------------------------------------------------------------
// One-off architecture in world space. Set A: the grand staircase, the inverted flight above it, the floor of
// pools and the bridge to the atrium. Set C: the exit bridge, the colonnade, the three stairs and the moon gate.
// ---------------------------------------------------------------------------------------------------------------
// A hanging vine in the builder's current frame: a thin strand from (x, yTop, z) down by `len`, flat two-triangle leaves at
// random yaw (each drawn for both sides) and a few blossoms in the coral accent. All of it is foliage, so it sways.
function vine(B, K, rng, x, yTop, z, len, coral, build = true) {      // build = false: the same draws, nothing made
  const segs = Math.max(2, Math.round(len / 0.75)), w = 0.055; let px = x, pz = z;
  K.leaf(0.5 + rng() * 0.5);
  for (let i = 0; i < segs; i++) { const y0 = yTop - len * i / segs, y1 = yTop - len * (i + 1) / segs, nx = x + rng.range(-0.13, 0.13), nz = z + rng.range(-0.13, 0.13);
    const a = i % 2 ? [w, 0] : [0, w];
    if (build) for (const tw of [false, true]) B.quad([px - a[0], y0, pz - a[1]], [px + a[0], y0, pz + a[1]], [nx + a[0], y1, nz + a[1]], [nx - a[0], y1, nz - a[1]], [px + a[1] * 20, y0, pz + a[0] * 20], tw);
    px = nx; pz = nz; }
  const nL = Math.max(3, Math.round(len * 3.2));
  for (let q = 0; q < nL; q++) { const f = (q + rng()) / nL, y = yTop - len * (0.03 + 0.97 * f), an = rng.range(0, 6.283), sz = rng.range(0.5, 0.8) * (1 - 0.25 * f), ca = Math.cos(an), sa = Math.sin(an);
    const bx = x + rng.range(-0.1, 0.1), bz = z + rng.range(-0.1, 0.1), hx = bx + ca * sz * 0.5, hz = bz + sa * sz * 0.5;
    const p0 = [bx, y, bz], tip = [bx + ca * sz * 0.5, y - sz, bz + sa * sz * 0.5], l = [hx * 0.6 + bx * 0.4 - sa * sz * 0.34, y - sz * 0.38, hz * 0.6 + bz * 0.4 + ca * sz * 0.34], r = [hx * 0.6 + bx * 0.4 + sa * sz * 0.34, y - sz * 0.38, hz * 0.6 + bz * 0.4 - ca * sz * 0.34], ref = [bx - ca * 3, y - 1.5, bz - sa * 3];
    K.leaf(1.5 + rng() * 1.4);
    if (!build || q % 4 === 3) continue;      // (three leaves in four are made: the strand is as full to the eye and a quarter less to build)
    B.quad(p0, l, tip, r, ref, false, 0.85, 1.05, 1.2, 1.05); B.quad(p0, l, tip, r, ref, true, 0.7, 0.85, 0.95, 0.85);
    if (q % 6 === 4) { B.color(coral, 3, 0); B.lathe(tip[0], tip[2], [[0, tip[1] - 0.2], [0.16, tip[1] - 0.04], [0, tip[1] + 0.1]], 4, 0.8, 1.1); } }
}

// (round 7) The flight on the court's wall, as a stair of its own. In the frame and with the step sizes of K.flight (foot at the
// origin, running +Z, rising +Y, 14 m wide). Every step has a riser in lilac shadow, a dark line under its nosing, a pale nosing
// and a peach tread; closed strings carry raked balustrades with piers and lamps; under the string on the open side hangs a
// rampant arcade; two balconies a side stand out level in the wall's own gravity, with lamp standards and a potted orange tree.
// Nothing here draws from the world's rng (Kw is a kit on a stream of its own, for the trees). Returns the range of the steps.
function wallFlight(B, K, Kw, nS, rise, pal) {
  const run = 2, hw = 7, Lz = nS * run, sl = rise / run, soffit = 2.2, { tone, dark } = K;
  const lil = pal[0].clone().multiplyScalar(0.86).lerp(pal[3], 0.62).multiplyScalar(0.8), deepL = pal[3].clone().lerp(pal[4], 0.62).multiplyScalar(0.6);
  const gain = (r, g, b) => { B.st.r *= r; B.st.g *= g; B.st.b *= b; };
  const a0 = B.tris * 3;
  for (let i = 0; i < nS; i++) { const z0 = i * run, z1 = z0 + run, y0 = i * rise, y1 = y0 + rise;
    tone(0.3 - 0.14 * (i % 2), 4); gain(0.92, 0.86, 1.06);
    B.quad([-hw, y0, z0], [hw, y0, z0], [hw, y1 - 0.13, z0], [-hw, y1 - 0.13, z0], [0, y0, z0 + 1], false, 0.62, 0.62, 0.9, 0.9);
    B.color(deepL, 4, 0); B.quad([-hw, y1 - 0.13, z0], [hw, y1 - 0.13, z0], [hw, y1, z0], [-hw, y1, z0], [0, y0, z0 + 1], false);
    tone(0.02, 4); gain(0.78, 0.78, 0.88); B.quad([-hw, y1, z0 - 0.09], [hw, y1, z0 - 0.09], [hw, y1, z0 + 0.26], [-hw, y1, z0 + 0.26], [0, y1 - 1, z0], false);
    tone(0.1 + 0.22 * (i % 2), 4); gain(0.46, 0.54, 0.86); B.quad([-hw, y1, z0 + 0.26], [hw, y1, z0 + 0.26], [hw, y1, z1], [-hw, y1, z1], [0, y1 - 1, z0], false, 1.0, 1.0, 0.82, 0.82); }
  const a1 = B.tris * 3;
  // everything raked is built in a sheared frame: y rises with z at the stair's own slope
  const S = new THREE.Matrix4().set(1, 0, 0, 0, 0, 1, sl, 0, 0, 0, 1, 0, 0, 0, 0, 1), SIDE = frame([0, 0, 1], [0, 1, 0]);
  B.push(S);
  for (const sx of [-1, 1]) { const mm = (a, b) => [Math.min(sx * a, sx * b), Math.max(sx * a, sx * b)], open = sx < 0;      // (sx = -1 is the open side, toward the flight)
    { const [a, b] = mm(hw, hw + 0.6); tone(0.25); gain(0.86, 0.86, 0.94); B.box(a, -soffit, 0, b, rise + 0.25, Lz, 0.7); }
    { const [a, b] = mm(hw - 0.06, hw + 0.68); tone(0.42); gain(0.86, 0.86, 0.94); B.box(a, rise + 0.25, 0, b, rise + 0.48, Lz, 0.8); }
    { const [a, b] = mm(hw - 0.1, hw + 0.72); tone(0.38); gain(0.86, 0.86, 0.94); B.box(a, rise + 1.3, 0, b, rise + 1.56, Lz, 0.7); }
    const xc = sx * (hw + 0.3);      // (the open side has its balusters; the far side, 14 m beyond, a screen between the rails)
    if (open) for (let z = 0.5; z < Lz; z += 1.25) { if (Math.abs((z % 8) - 0) < 0.6 || Math.abs((z % 8) - 8) < 0.6) continue; tone(0.06); gain(0.9, 0.9, 0.98); B.box(xc - 0.14, rise + 0.48, z - 0.14, xc + 0.14, rise + 1.3, z + 0.14, 0.9, 3); }
    else { tone(0.3); gain(0.8, 0.8, 0.92); B.box(xc - 0.1, rise + 0.48, 0, xc + 0.1, rise + 1.3, Lz, 0.9, 3); }
    for (let j = 0; j <= Lz / 8; j++) { const z = Math.min(Lz - 0.45, Math.max(0.45, j * 8)); tone(0.32); gain(0.86, 0.86, 0.94); B.box(xc - 0.46, -0.2, z - 0.46, xc + 0.46, rise + 1.95, z + 0.46, 0.85);
      if (j % 2 === (open ? 1 : 0)) K.lantern(xc, rise + 1.95, z, 0.4); else { tone(0.4); B.lathe(xc, z, [[0.42, rise + 1.95], [0.26, rise + 2.25], [0, rise + 2.7]], 4); } }
    // the string's outer face: a panel of lilac shadow between the piers, a moulded band under it
    if (open) for (let j = 0; j < Lz / 8; j++) { const x = sx * (hw + 0.615);
      B.color(lil, 4, 0); B.quad([x, -soffit + 0.5, j * 8 + 1.0], [x, -soffit + 0.5, j * 8 + 7.0], [x, rise - 0.15, j * 8 + 7.0], [x, rise - 0.15, j * 8 + 1.0], [0, 0, j * 8 + 4], false, 0.78, 0.78, 1, 1); }
    { const [a, b] = mm(hw - 0.2, hw + 0.8); tone(0.45); gain(0.86, 0.86, 0.94); B.box(a, -soffit - 0.45, 0, b, -soffit, Lz, 0.7); }
    // the rampant arcade under the string (five bays), a bottom chord and a turned pendant under every pier
    const nB = 5, bw = Lz / nB, h = 9.4;
    for (let i = 0; i < nB; i++) { tone(0.14 + 0.1 * (i % 2)); gain(0.84, 0.84, 0.95); B.at(SIDE.clone().setPosition(sx * (hw + 0.1), -soffit - 0.45 - h, (i + 0.5) * bw), () => B.archWall(bw, h, 1.5, bw * 0.7, 2.6, 1, 10, 0.62, !open)); }
    { const [a, b] = mm(hw - 0.85, hw + 1.05); tone(0.4); gain(0.84, 0.84, 0.95); B.box(a, -soffit - 0.45 - h - 0.8, 0, b, -soffit - 0.45 - h, Lz, 0.65); }
    if (open) for (let i = 0; i <= nB; i++) { const z = Math.min(Lz - 0.9, Math.max(0.9, i * bw)), yb = -soffit - 0.45 - h - 0.8; dark(0.3); B.lathe(sx * (hw + 0.1), z, [[0, yb - 3.4], [0.7, yb - 2.3], [0.4, yb - 1.8], [1.3, yb]], 8, 0.6, 0.85); }
  }
  B.pop();
  // two balconies on the open side, level in the wall's gravity: slab, paving, a pendant, a low rail, lamp standards; on the open side a potted orange tree
  for (const zb of [27, 59]) for (const sx of [-1]) { const y = (zb / run) * rise + rise, xi = sx * (hw + 0.6), xo = sx * (hw + 4.9), x0 = Math.min(xi, xo), x1 = Math.max(xi, xo), xm = (xi + xo) / 2, za = zb - 3.6, zc = zb + 3.6;
    tone(0.4); gain(0.86, 0.86, 0.94); B.cbox(x0, y - 0.75, za, x1, y, zc, 0.2, 0.65);
    tone(0.2, 1); gain(0.74, 0.76, 0.9); B.quad([x0 + 0.3, y + 0.02, za + 0.3], [x1 - 0.3, y + 0.02, za + 0.3], [x1 - 0.3, y + 0.02, zc - 0.3], [x0 + 0.3, y + 0.02, zc - 0.3], [xm, y - 5, zb], false);
    dark(0.3); B.lathe(xm, zb, [[0, y - 4.9], [0.8, y - 3.6], [0.45, y - 3.0], [2.0, y - 0.75]], 8, 0.6, 0.85);
    tone(0.36); gain(0.86, 0.86, 0.94);
    B.box(xo - 0.2, y + 0.95, za, xo + 0.2, y + 1.2, zc, 0.7); for (const z of [za + 0.15, zc - 0.15]) B.box(x0, y + 0.95, z - 0.2, x1, y + 1.2, z + 0.2, 0.7);
    for (let q = 0; q <= 4; q++) { const z = za + 0.2 + q * (zc - za - 0.4) / 4; tone(0.08); B.box(xo - 0.13, y, z - 0.13, xo + 0.13, y + 0.95, z + 0.13, 0.9, 3); }
    for (const z of [za + 0.2, zc - 0.2]) { tone(0.08); B.box(xm - 0.13, y, z - 0.13, xm + 0.13, y + 0.95, z + 0.13, 0.9, 3);
      tone(0.34); gain(0.86, 0.86, 0.94); B.box(xo - 0.34, y, z - 0.34, xo + 0.34, y + 1.5, z + 0.34, 0.85, 1); B.column(xo, z, y + 1.5, y + 3.3, 0.15, 5); K.lantern(xo, y + 3.3, z, 0.46); }
    if (sx < 0) Kw.orangeTree(xm + sx * 0.2, y, zb, 0.74); }
  return [a0, a1];
}

// Async only so that it can hand frames back (`yld`) between its pieces: the order of every call and random draw is unchanged.
async function buildSets(pal, rng, style, water, out, spouts, yld, rx, seed) {
  // K2: the same kit drawing from `rx`, the polish pass's own rng: what was added later is built with it, so the draws of `rng`
  // (and with them every tree, vine and tone that was already here) are what they were
  const mk = (cap) => { const B = makeBuilder(cap), K = makeKit(B, pal, rng, style), K2 = makeKit(B, pal, rx, style); return { B, K, K2, gains: [] }; };
  const runC = pal[6].clone().lerp(pal[4], 0.55).multiplyScalar(0.8), runE = pal[0].clone().multiplyScalar(0.74);      // runners: wine, with a cream border
  const coral = pal[6].clone().lerp(pal[0], 0.2).multiplyScalar(0.9);
  await yld();
  const A = mk(15500); await yld();      // (each builder is sized to what it holds plus a tenth, and grows if it must)
  const C = mk(1200); await yld();
  const Pz = mk(13500); await yld();
  const D = mk(27000); await yld();
  // waterfall head: a tall arch carrying a short aqueduct; the lip is the frame origin, the water leaves along +Z and falls along -Y
  // (bare: the three arches under the channel are left out. Their draws are still made: they are built into a frame of no size,
  //  where every triangle is empty and the builder drops it)
  const spout = (B, K, M, bare = false) => B.at(M, () => { const { stone, T } = K;
    if (bare) B.push(new THREE.Matrix4().makeScale(0, 0, 0));
    stone(0.15); B.at(T(0, -46, -4), () => B.archWall(18, 44.5, 7, 10, 30, style.archRise, 8));
    for (const z of [-15, -27]) { stone(0.25); B.at(T(0, -46, z), () => B.archWall(12, 44.4, 2.4, 7, 34, style.archRise, 6)); }
    if (bare) B.pop();
    stone(0.3); B.box(-5.2, -1.6, -34, 5.2, -0.5, 0.2, 0.6); stone(0.15); B.box(-5.2, -0.5, -34, -4.2, 0.9, 0.2, 1, 1); B.box(4.2, -0.5, -34, 5.2, 0.9, 0.2, 1, 1);
    for (const sx of [-1, 1]) K.lantern(sx * 4.7, 0.9, -1, 0.5);
    water.flat(M, -4.2, 4.2, 0, -34, 0, 0, 5, 0, 0.5, 0, 1);
  });
  const SIDE = frame([0, 0, 1], [0, 1, 0]);
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const UP = V(0, 1, 0);
  {
    const { B, K } = A, { stone, dark, T } = K;
    // bottom landing
    stone(0.35); B.cbox(-14, -40, 445, 14, -38, 461, 0.4, 0.6);
    stone(0.2, 1); B.quad([-13, -37.97, 445], [13, -37.97, 445], [13, -37.97, 460.4], [-13, -37.97, 460.4], [0, -50, 450], false);
    await yld();
    for (const sx of [-1, 1]) { B.at(SIDE.clone().setPosition(sx * 13.2, -38, 453), () => K.balustrade(-7.4, 7.4, 0, 0, 1)); await yld(); }
    dark(0.3); B.lathe(0, 453, [[0, -54], [2.2, -48], [1.1, -46], [9, -40]], 8, 0.6, 0.8);
    await yld();
    // the grand flight, on three tall arches that sink into the haze
    B.at(frame([-1, 0, 0], [0, 1, 0], 0, -38, 445), () => K.flight(60, 2, 0.5, 18, 2.2));
    await yld();
    B.at(frame([-1, 0, 0], [0, 1, 0], 0, -38, 445), () => runner(B, 60, 2, 0.5, 5.2, runC, runE));
    await yld();
    for (const z of [418, 386, 354]) { const h = -38 + (445 - z) * 0.25 - 2.5 + 100; stone(0.22); B.at(T(0, -100, z), () => B.archWall(21, h, 3, 12, h - 11, style.archRise, 8)); }
    await yld();
    // top landing in front of the first gallery
    stone(0.35); B.cbox(-16, -9.6, 300.5, 16, -8, 325, 0.4, 0.6);
    stone(0.2, 1); B.quad([-15, -7.97, 300.5], [15, -7.97, 300.5], [15, -7.97, 325], [-15, -7.97, 325], [0, -20, 312], false);
    for (const sx of [-1, 1]) { B.at(SIDE.clone().setPosition(sx * 15.2, -8, 313), () => K.balustrade(-5.2, 11, 0, 0, 1)); await yld();
      K.cypress(sx * 12.6, -8, 310.5, rng.range(10, 13)); await yld(); K.orangeTree(sx * 12.2, -8, 320, 1.25); await yld(); }
    { const Ms = T(0, -7.97, 313.5); B.at(Ms, () => sundial(B, K, 3.1, Ms)); }                    // a floor dial for the sun overhead
    await yld();
    // the next flight, upside down above the first: its treads face the camera
    { B.push(frame([-1, 0, 0], [0, -1, 0], 0, 5.5, 360));      // (push / pop in place of B.at, so a frame can be handed back half way)
      { const a = B.tris * 3; K.flight(40, 2, 0.5, 10, 2); A.gains.push([a, B.tris * 3, 2.5, 2.25, 2.0]); }      // its treads face the camera: lifted, as lamp-lit as its landings, so it is a stair and not a dark slab
      await yld();
      runner(B, 40, 2, 0.5, 3.6, runC.clone().multiplyScalar(3.2), runE.clone().multiplyScalar(2.4));
      await yld();
      const lit = () => { B.st.r *= 2.5; B.st.g *= 2.2; B.st.b *= 1.95; };      // this side's floors face away from the suns: the lanterns that hang along them light them
      stone(0.35); B.cbox(-5.6, -2.2, -56, 5.6, 0, 0.2, 0.3, 0.6); stone(0.2, 1); lit(); B.quad([-5, 0.03, -55.6], [5, 0.03, -55.6], [5, 0.03, 0], [-5, 0.03, 0], [0, -3, -30], false);
      for (const sx of [-1, 1]) for (let z = -52; z < 0; z += 8) K.lantern(sx * 5.05, 0, z, 0.3);          // they hang, like everything on this side
      stone(0.35); B.cbox(-6.2, 16.6, 79.8, 6.2, 20, 93, 0.35, 0.6); stone(0.2, 1); lit(); B.quad([-5.6, 20.03, 80], [5.6, 20.03, 80], [5.6, 20.03, 92.5], [-5.6, 20.03, 92.5], [0, 10, 86], false);
      K.balustrade(-5.6, 5.6, 20, 92.5, 1);
      rng(); rng(); rng();      // (a cypress and an orange tree hung here and crossed the top of the opening frame; their three draws stay, so the set is otherwise unchanged)
      B.pop(); }
    await yld();
    for (let i = 0; i < 9; i++) { const x = (i % 2 ? 1 : -1) * rng.range(3.6, 7.6); out.segs.push({ a: V(x, -38, 444), b: V(x, -8, 324), up: UP, n: 1 }); }
    // the opening beat: a procession walking the underside of the next flight and of its landing
    for (let i = 0; i < 12; i++) { const x = -3.85 + 7.7 * ((i * 5) % 12) / 11 + rng.range(-0.25, 0.25); out.segs.push({ a: V(x, 5.5, 361), b: V(x, -14.5, 440), up: V(0, -1, 0), n: 1, keep: 1 }); }
    for (const x of [-3.4, 0, 3.4]) out.segs.push({ a: V(x - 0.4, 5.5, 306), b: V(x + 0.4, 5.5, 358), up: V(0, -1, 0), n: 2, keep: 1 });
    out.segs.push({ a: V(-10, -8, 304), b: V(10, -8, 322), up: UP, n: 2 });
    // the floor of pools: a wall of arched windows lying flat
    stone(0.55); B.box(-22, -13.2, 128, 22, -11.5, 188, 0.55);
    for (const zs of [188, 158]) for (const xc of [-14.6, 0, 14.6]) { await yld(); stone(0.08 + 0.05 * Math.abs(xc) / 14.6);
      B.at(frame([1, 0, 0], [0, 0, -1], xc, -10.5, zs), () => B.archWall(14.6, 30, 2, 9, 22, style.archRise, 8));
      K.deep(0.75); B.quad([xc - 5.2, -11.44, zs - 29.4], [xc + 5.2, -11.44, zs - 29.4], [xc + 5.2, -11.44, zs - 0.3], [xc - 5.2, -11.44, zs - 0.3], [xc, -30, zs - 15], false, 0.7, 0.7, 1, 1);
      water.flat(null, xc - 5.2, xc + 5.2, -10.2, zs - 29.4, zs - 0.3, 0, 2.4, 0, 0, 0.7, 0.7);
      for (let i = 0; i < 2; i++) { const x = xc + rng.range(-3.6, 3.6); out.fish.push({ a: V(x, -10.17, zs - 27 + rng.range(0, 6)), b: V(x + rng.range(-1, 1), -10.17, zs - 3 - rng.range(0, 6)), up: UP, n: 1 }); } }
    await yld();
    // the atrium end of the floor of pools: a paved walk and a parapet with lamps either side of the bridge (it was a bare pale ledge
    // across the foot of the view of the Triple Fall)
    A.K.tone(0.2, 1); B.quad([-21, -9.47, 128.9], [21, -9.47, 128.9], [21, -9.47, 131.4], [-21, -9.47, 131.4], [0, -20, 130], false);
    for (const sx of [-1, 1]) { A.K2.balustrade(Math.min(sx * 5.6, sx * 21.9), Math.max(sx * 5.6, sx * 21.9), -9.5, 128.45, 1);
      out.segs.push({ a: V(sx * 6.5, -9.5, 130.2), b: V(sx * 16.5, -9.5, 130.2), up: UP, n: 1, keep: 1 }); }
    await yld();
    for (const sx of [-1, 1]) { B.at(SIDE.clone().setPosition(sx * 21.5, -9.5, 158), () => K.balustrade(-29.5, 29.5, 0, 0, 1));
      // (at the atrium end a potted orange tree, not a tall cypress: the cypress stood cut by the edge of the frame as the camera came out
      //  of the gallery; the same three draws are made, so everything after is unchanged)
      rng.range(10, 13); rng(); K.orangeTree(sx * 19.2, -9.5, 130.5, 1.2); K.cypress(sx * 19.2, -9.5, 185.5, rng.range(9, 12)); K.orangeTree(sx * 7.3, -9.5, 158, 1.1);
      out.segs.push({ a: V(sx * 7.3, -9.5, 186), b: V(sx * 7.3, -9.5, 161), up: UP, n: 1 }, { a: V(sx * 7.3, -9.5, 155), b: V(sx * 7.3, -9.5, 130), up: UP, n: 1 }, { a: V(sx * 20, -9.5, 182), b: V(sx * 20, -9.5, 134), up: UP, n: 1 });
      await yld(); }
    // bridge to the atrium's entry belvedere
    stone(0.35); B.cbox(-5, -11.6, 93.5, 5, -10, 128, 0.3, 0.6);
    stone(0.2, 1); B.quad([-4.2, -9.97, 93.5], [4.2, -9.97, 93.5], [4.2, -9.97, 128], [-4.2, -9.97, 128], [0, -20, 110], false);
    for (const sx of [-1, 1]) B.at(SIDE.clone().setPosition(sx * 4.6, -10, 110.5), () => K.balustrade(-16, 16, 0, 0, 2));
    out.segs.push({ a: V(-2, -10, 127), b: V(-2, -10, 95), up: UP, n: 1 }, { a: V(2, -10, 96), b: V(2, -10, 126), up: UP, n: 1 });
    await yld();
    for (const sp of spouts) if (sp.set === 'A') { spout(B, K, sp.M); await yld();
      // (polish) the fall itself is the hero's own falling water, in three strands of unequal width that part as they drop
      const tE = Math.sqrt(2 * sp.H / 9.81), rows = Math.round(sp.H * 0.5);
      for (const [xo, w0, w1, dl, vo] of [[-2.3, 1.5, 1.2, 0, 0], [0.5, 1.9, 1.5, 0.25, 0.37], [3.0, 1.0, 0.8, -0.2, 0.71]])
        water.tube(sp.M.clone().multiply(new THREE.Matrix4().makeTranslation(xo, 0, 0)), (q) => ({ p: [0, -sp.H * q * q, (3.2 + dl) * tE * q], hw: lerp(w0, w1, q) * (1 + 0.06 * Math.sin(q * 19 + xo)), th: lerp(0.35, 0.8, Math.sqrt(q)) }), rows, vo, vo + sp.H / 16, 0.02, 0.06, 0.6, 8, 0.25);
      await yld(); }
    // zone A's fall lands in a basin that hangs under it: a turned bowl with a rim of lamps, the water brimming over its lip
    // on the side the stair sees and falling on into the depths (built with the polish kit: no draw from the world's rng)
    { const sp = spouts[0], K2 = A.K2, e = sp.M.elements, x0 = e[12], yb = e[13] - sp.H, zb = e[14] + 3.2 * Math.sqrt(2 * sp.H / 9.81);
      K2.tone(0.3); B.lathe(x0, zb, [[0, yb - 5.6], [3.2, yb - 4.4], [7.6, yb - 2.2], [8.8, yb - 1.2], [8.8, yb + 0.7], [8.0, yb + 0.7], [8.0, yb - 0.4]], 18, 0.6, 1);
      K2.deep(0.7); B.lathe(x0, zb, [[8.0, yb - 0.4], [0, yb - 0.38]], 18);
      K2.tone(0.45); B.lathe(x0, zb, [[9.3, yb - 1.4], [9.3, yb - 0.9], [8.8, yb - 0.9]], 18, 0.8, 1);
      for (let i = 0; i < 6; i++) { const a = (i + 0.5) * Math.PI / 3; if (Math.abs(Math.sin(a)) > 0.9 && Math.sin(a) > 0) continue; K2.lantern(x0 + 8.4 * Math.cos(a), yb + 0.7, zb + 8.4 * Math.sin(a), 0.5); }
      K2.dark(0.45); B.cbox(x0 - 2.3, yb - 0.5, zb + 7.6, x0 + 2.3, yb + 0.25, zb + 9.4, 0.15, 0.6);
      water.flat(null, x0 - 5.6, x0 + 5.6, yb + 0.1, zb - 5.6, zb + 5.6, 0, 1.4, 0.9, 0.5);
      water.flat(null, x0 - 1.7, x0 + 1.7, yb + 0.28, zb + 5.6, zb + 9.3, 1.4, 2.2, 0.3, 0.7);
      water.sheet(null, x0 - 1.7, x0 + 1.7, yb + 0.25, yb - 46, zb + 9.45, 22, 0.55);
      await yld(); }
    // two potted orange trees on the entry belvedere (round sage masses with coral fruit that echo the goldfish; the dark cypress
    // cones that stood here pointed at the sphere). Their foliage takes no draw from rng: the phase is given.
    for (const [x, z, sc, ph] of [[-6.9, 78.9, 0.95, 1.3], [8.3, 80.6, 0.85, 4.1]]) { const y = -10;
      dark(0.5); B.cbox(x - sc, y, z - sc, x + sc, y + sc * 1.2, z + sc, 0.12 * sc); B.column(x, z, y + sc * 1.2, y + sc * 2.8, sc * 0.16, 5);
      K.tuft(x, z, [[0, y + sc * 2.4], [sc * 0.95, y + sc * 2.7], [sc * 1.45, y + sc * 3.3], [sc * 1.55, y + sc * 3.95], [sc * 1.2, y + sc * 4.6], [sc * 0.6, y + sc * 5.0], [0, y + sc * 5.15]], 12, 0.1, 0.45, 0.62, 1.12, ph);
      K.lamp(); for (let i = 0; i < 5; i++) { const a = i * 1.257 + sc, r = sc * 1.38, yy = y + sc * (3.2 + (i % 3) * 0.55);
        B.box(x + Math.cos(a) * r - 0.2, yy, z + Math.sin(a) * r - 0.2, x + Math.cos(a) * r + 0.2, yy + 0.4, z + Math.sin(a) * r + 0.2, 1); } }
    await yld();
    for (const l of K.lanterns) out.glows.push(l); for (const l of A.K2.lanterns) out.glows.push(l);
  }
  {
    const { B, K } = C, { stone, dark, tone, T } = K;
    // bridge from the exit belvedere to the second gallery
    stone(0.35); B.cbox(-5, -11.6, -149.5, 5, -10, -93.5, 0.3, 0.6);
    stone(0.2, 1); B.quad([-4.2, -9.97, -149.5], [4.2, -9.97, -149.5], [4.2, -9.97, -93.5], [-4.2, -9.97, -93.5], [0, -20, -120], false);
    // (on the sun's side the parapet opens for the walk to the side pavilion: two lengths that make the same 24 draws as the one)
    for (const sx of [-1, 1]) B.at(SIDE.clone().setPosition(sx * 4.6, -10, -121.5), () => { if (sx > 0) K.balustrade(-26, 26, 0, 0, 2); else { K.balustrade(-26, 14.5, 0, 0, 2); K.balustrade(18.5, 26, 0, 0, 2); } });
    out.segs.push({ a: V(-2, -10, -95), b: V(-2, -10, -147), up: UP, n: 2 }, { a: V(2, -10, -146), b: V(2, -10, -96), up: UP, n: 1 });
    await yld();
  }
  {
    const { B, K } = Pz, { stone, dark, tone, T } = K;
    // The standing plaza: where the Triple Fall's drain (it falls along -Z, level across the view from the exit belvedere) comes
    // to ground. A square whose floor faces +Z, with a basin the stream lands in, trees and a bell tower that all stand along +Z.
    const Mp = frame([1, 0, 0], [0, 0, 1], -112, -1, -200), upZ = V(0, 0, 1), Pp = (x, y, z) => V(x, y, z).applyMatrix4(Mp);
    B.push(Mp);
    stone(0.4); B.cbox(-24, -3, -23, 24, 0, 23, 0.4, 0.6); stone(0.2, 1); B.quad([-23, 0.03, -22], [23, 0.03, -22], [23, 0.03, 22], [-23, 0.03, 22], [0, -9, 0], false);
    dark(0.3); B.lathe(0, 0, [[0, -19], [3.2, -12], [1.6, -10], [12, -3]], 8, 0.6, 0.85);                         // the pendant under it
    for (const [x0, z0, x1, z1] of [[-11, -15.4, 11, -14], [-11, 14, 11, 15.4], [-11, -14, -9.6, 14], [9.6, -14, 11, 14]]) { tone(0.35); B.cbox(x0, 0, z0, x1, 1.1, z1, 0.2, 0.75); }
    K.deep(0.7); B.quad([-9.6, 0.1, -14], [9.6, 0.1, -14], [9.6, 0.1, 14], [-9.6, 0.1, 14], [0, -9, 0], false, 0.8);
    for (let i = 0; i < 3; i++) water.flat(Mp, -9.6 + i * 6.4, -3.2 + i * 6.4, 0.75, -14, 14, i * 0.3, i * 0.3 + 4.6, 0.75, 0.3, 0.92, 0.92);
    await yld();
    for (const sz of [-1, 1]) K.balustrade(-22.5, 22.5, 0, sz * 22.3, 2);
    for (const [x, z] of [[-17.5, -17], [-17.5, 17], [17.5, 17]]) K.cypress(x, 0, z, rng.range(11, 15));
    K.orangeTree(-15, 0, 0, 1.3); K.orangeTree(15, 0, 3, 1.2);
    await yld();
    // the bell tower: three arcaded storeys and a spire
    B.push(T(18.6, 0, -16));
    for (let t = 0; t < 2; t++) for (let k = 0; k < 4; k++) { stone(0.12 + 0.08 * t); B.at(K.RY(k * Math.PI / 2).multiply(T(0, t * 13, 3.6)), () => B.archWall(8.2, 13, 1, 3.8, 7.6, style.archRise, 6)); }
    for (let t = 1; t <= 2; t++) { tone(0.4); B.cbox(-4.7, t * 13 - 0.5, -4.7, 4.7, t * 13 + 0.4, 4.7, 0.2, 0.65); }
    K.roof(); B.lathe(0, 0, [[5.6, 26.4], [3.6, 31], [1.2, 37], [0.2, 42]], 4, 0.85, 1.05); K.lantern(0, 42, 0, 0.8); K.lantern(0, 14.5, 0, 0.9);
    B.pop(); B.pop();
    out.bells.push({ p: Pp(18.6, 24.5, -16), up: upZ });
    await yld();
    // on its way the stream drops through two floors: square terraces pierced by a round well, each with its trees and lamps (they
    // stand along +Z, like everything that lives by this water)
    // (the third, nearest the head of the stream, is built with the polish rng: the two that were here keep their draws)
    for (const [zr, hf, Kx, rr] of [[-132, 15, K, rng], [-166, 15, K, rng], [-112, 13, Pz.K2, rx]]) { const tf = Math.sqrt(2 * (DRAIN.z - zr) / 9.81), xr = DRAIN.x - DRAIN.launch * tf, Mr = frame([1, 0, 0], [0, 0, 1], xr, 0, zr), q = hf - 3;
      B.at(T(xr, 0, zr - 2.6), () => { Kx.stone(0.2); ringWall(B, hf, 9.6, 0, 2.6, 1.0, 28); });
      B.at(Mr, () => { for (const [x, z] of [[-q, -q], [q, q]]) Kx.cypress(x, 0, z, rr.range(8, 11));
        Kx.orangeTree(q, 0, -q, 1.1); Kx.orangeTree(-q, 0, q, 1.0);
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) Kx.lantern(sx * 7.4, 0, sz * 7.4, 0.5); });
      out.segs.push({ a: V(-q - 0.5, 0, 4).applyMatrix4(Mr), b: V(q + 0.5, 0, -4).applyMatrix4(Mr), up: upZ, n: 1, keep: 1 });
      await yld(); }
    out.segs.push({ a: Pp(-19, 0, 13.5), b: Pp(19, 0, 13.5), up: upZ, n: 2, keep: 1 }, { a: Pp(13, 0, -19), b: Pp(-13, 0, -13), up: upZ, n: 2, keep: 1 }, { a: Pp(-13.5, 0, -8), b: Pp(-13.5, 0, 12), up: upZ, n: 1, keep: 1 });
    await yld();
    // The Side Pavilion. Leaving the atrium the view swings past the low sun on the left: there, a short walk from the bridge, stands
    // a domed pavilion (upright: zone B's last ordinary floor), dark against the sun, with the drain's stream and the glare seen
    // through its arches, a basin with goldfish under the dome, banners on its piers and the exit flock wheeling round its lantern.
    // It is part of the plaza's mesh, so it is drawn only once the orbit has turned away from this side (see `cull`).
    { const K2 = Pz.K2, sc = 0.85, Mv = new THREE.Matrix4().makeScale(sc, sc, sc).setPosition(PAV[0], PAV[1], PAV[2]), Pv = (x, y, z) => V(x, y, z).applyMatrix4(Mv), fl = -10.97;
      B.push(Mv); K2.pavilionA(); await yld(); K2.pavilionB(); await yld();
      tone(0.35); B.lathe(0, 0, [[3.9, fl], [3.9, fl + 0.85], [3.2, fl + 0.85], [3.2, fl + 0.3]], 12, 0.8, 1);
      K.deep(0.7); B.lathe(0, 0, [[3.2, fl + 0.3], [0, fl + 0.32]], 12);
      water.flat(Mv, -2.2, 2.2, fl + 0.66, -2.2, 2.2, 0, 0.6, 0, 0, 0.9, 0.9);
      tone(0.4); B.lathe(0, 0, [[0.75, fl + 0.3], [0.5, fl + 1.5], [0.8, fl + 1.9], [0.8, fl + 2.2]], 8, 0.8, 1); K.lantern(0, fl + 2.2, 0, 0.75);
      K2.orangeTree(6.3, fl, 6.3, 1.0); K2.orangeTree(-6.3, fl, -6.3, 1.0);
      { const Md = frame([0, 0, 1], [1, 0, 0], 11.2, 6.7, 0); B.at(Md, () => sundial(B, K2, 1.55, Mv.clone().multiply(Md))); }      // a dial on the face that looks at the bridge
      for (const sz of [-1, 1]) { tone(0.42); B.box(11.2, 3.2, Math.min(sz * 5.6, sz * 9.3), 11.5, 3.75, Math.max(sz * 5.6, sz * 9.3), 0.7); }
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) { tone(0.4); B.cbox(sx * 12.5 - 0.5, fl, sz * 5.9 - 0.5, sx * 12.5 + 0.5, fl + 1.5, sz * 5.9 + 0.5, 0.1, 0.8); K.lantern(sx * 12.5, fl + 1.5, sz * 5.9, 0.5); }
      B.pop();
      out.fish.push({ a: Pv(-1.5, fl + 0.7, -1.3), b: Pv(1.5, fl + 0.7, 1.2), up: UP, n: 2 }, { a: Pv(1.3, fl + 0.7, -1.5), b: Pv(-1.2, fl + 0.7, 1.5), up: UP, n: 1 });
      out.segs.push({ a: Pv(-7.5, fl, -5), b: Pv(7.5, fl, -5), up: UP, n: 2, keep: 1 }, { a: Pv(5, fl, 7.5), b: Pv(-5.5, fl, 5), up: UP, n: 2, keep: 1 }, { a: Pv(-7.6, fl, 7), b: Pv(-7.6, fl, -2), up: UP, n: 1, keep: 1 });
      // banners on the piers of the three faces the flight sees (east, toward the bridge; north; south)
      const bz = V(0, 0, 1), bx = V(1, 0, 0), dn = V(0, -1, 0);
      for (const s of [-1, 1]) { out.banners.push({ p: Pv(11.32, 7.4, s * 8), right: bz, down: dn, w: 2.2, len: 6.6, t: s > 0 }, { p: Pv(s * 8, 7.4, 11.32), right: bx, down: dn, w: 2.2, len: 6.6, t: s < 0 }, { p: Pv(s * 8, 7.4, -11.32), right: bx, down: dn, w: 2.2, len: 6.6, t: s > 0 }); }
      await yld();
      // the walk from the bridge: a level deck with parapets, two gate piers with lamps where it leaves the bridge, a pendant under its middle
      const z0 = PAV[2], xa = PAV[0] + 12.8 * sc - 0.2, xb = -4.9, yf = -10;
      K2.stone(0.35); B.cbox(xa, yf - 1.4, z0 - 2.4, xb, yf, z0 + 2.4, 0.3, 0.6);
      K2.stone(0.2, 1); B.quad([xa, yf + 0.03, z0 - 2], [xb, yf + 0.03, z0 - 2], [xb, yf + 0.03, z0 + 2], [xa, yf + 0.03, z0 + 2], [-20, -20, z0], false);
      for (const sz of [-1, 1]) { K2.balustrade(xa + 0.6, xb - 0.9, yf, z0 + sz * 2.1, 2); tone(0.3); B.cbox(xb - 0.75, yf, z0 + sz * 2.6 - 0.55, xb + 0.35, yf + 2.7, z0 + sz * 2.6 + 0.55, 0.12, 0.8); K.lantern(xb - 0.2, yf + 2.7, z0 + sz * 2.6, 0.5); }
      dark(0.3); B.lathe((xa + xb) / 2, z0, [[0, yf - 8.6], [1.0, yf - 6.2], [0.5, yf - 5.2], [2.3, yf - 3.0], [2.3, yf - 1.4]], 8, 0.6, 0.85);
      out.segs.push({ a: V(xa + 1, yf, z0 - 0.9), b: V(xb - 1, yf, z0 - 0.9), up: UP, n: 2, keep: 1 }, { a: V(xb - 1, yf, z0 + 0.9), b: V(xa + 1, yf, z0 + 0.9), up: UP, n: 1, keep: 1 });
      await yld(); }
    // the drain itself: a broad stream of the hero's own falling water (teal, with white where it tears), from the mouth at the foot
    // of the cascade stair through the three wells to the plaza's basin. It stands on edge, facing the path.
    { const tE = Math.sqrt(2 * DRAIN.H / 9.81);
      water.tube(frame([0, -1, 0], [0, 0, 1], DRAIN.x, 0, DRAIN.z), (q) => ({ p: [0, -DRAIN.H * q * q, DRAIN.launch * tE * q], hw: lerp(4.2, 5.5, smoothstep(0, 0.35, q)), th: lerp(0.45, 1.5, Math.sqrt(q)) }), 52, 0, 9.4, 0.07, 0.04); }
    await yld();
    for (const l of K.lanterns) out.glows.push(l); for (const l of Pz.K2.lanterns) out.glows.push(l);
  }
  {
    // ---- the last third: a short hanging-garden loggia, then the Court of Three Stairs (its own mesh and its own, deeper shade)
    const { B, K } = D, { stone, dark, tone, T } = K, f = COL.floor, zA = COL.z0, zL = FIN.zL;
    stone(0.35); B.box(-13.6, f - 1.6, zL, 13.6, f, zA, 0.6, 2);
    for (const [x0, x1] of [[-13.6, -9.3], [-7.1, 7.1], [9.3, 13.6]]) { stone(0.2, 1); B.quad([x0, f, zA], [x1, f, zA], [x1, f, zL], [x0, f, zL], [0, f - 9, -280], false); }
    for (const sx of [-1, 1]) { const x0 = sx * 8.2 - 1.1, x1 = sx * 8.2 + 1.1;
      dark(0.6); B.quad([x0, f - 0.4, zA], [x1, f - 0.4, zA], [x1, f - 0.4, zL], [x0, f - 0.4, zL], [0, f - 9, -280], false, 0.7);
      for (let z = zA; z > zL; z -= 20) { const zb = Math.max(zL, z - 20); water.flat(null, x0, x1, f - 0.1, z, zb, (zA - z) / 5, (zA - zb) / 5, 0, zb <= zL ? 0.45 : 0, 1, 1);
        const xf = sx * 8.2 + rng.range(-0.5, 0.5); out.fish.push({ a: V(xf, f - 0.07, z - 1), b: V(xf, f - 0.07, zb + 1), up: UP, n: 2 }); }
      // at the end of the floor each rill pours over a carved lip, away into the depths
      dark(0.45); B.cbox(x0 - 0.3, f - 1.1, zL - 0.9, x1 + 0.3, f - 0.35, zL + 0.2, 0.15, 0.6);
      water.sheet(null, x0, x1, f - 0.3, f - 64, zL - 0.95, 24, 0.6); }
    rng.int(2, 4); const atArch = () => false;      // (the arches that crossed the old colonnade are gone: one stood as a wall across the first view of the court)
    // columns, entablature, pot trees, hanging gardens
    for (const sx of [-1, 1]) { let i = 0;
      for (let z = zA - 4; z >= zL + 2; z -= 8, i++) { stone(0.15 + 0.1 * (i % 2)); B.column(sx * 12, z, f, 10, 0.95, 8);
        if (z - 4 > zL + 2 && !atArch(z - 4)) { if (i % 2 === 0) K.cypress(sx * 10.9, f, z - 4, rng.range(8, 11.5)); else K.orangeTree(sx * 10.9, f, z - 4, rng.range(0.8, 1.0)); }
        // hanging garden: a few trailing vines of different lengths with leaf clusters (they sway with the foliage shader)
        if (z - 4 > zL && !atArch(z - 4)) { const nV = rng.int(3, 5);
          for (let j = 0; j < nV; j++) { const len = rng.range(1.5, 5.4), vx = sx * (10.5 + rng.range(-0.15, 0.25)), vz = z - 4 + (j - (nV - 1) / 2) * 1.0 + rng.range(-0.3, 0.3);
            vine(B, K, rng, vx, 10, vz, len, coral, j < 4); } }
        if (i % 2 === 0) out.hangs.push({ p: V(sx * 10.2, 10, z), up: UP });
        if (i % 3 === 2) K.cypress(sx * 12, 12.4, z, rng.range(6, 9)); else if (i % 3 === 0) K.lantern(sx * 12, 12.4, z, 0.5);
        await yld(); }
      stone(0.3); B.cbox(sx * 12 - 1.3, 10, zL, sx * 12 + 1.3, 12.4, zA, 0.3, 0.62);
      for (const z of [zL + 0.2, zL + 4.4]) { tone(0.4); B.cbox(sx * 12 - 1.7, 12.4, z - 1.4, sx * 12 + 1.7, 13.3, z + 1.4, 0.2, 0.7); }
      K.roof(); B.lathe(sx * 12, zL + 2.3, [[1.9, 13.3], [1.3, 15.6], [0.25, 18]], 4, 0.85, 1.05); K.lantern(sx * 12, 18, zL + 2.3, 0.6); }
    await yld();
    for (let i = 0; i < 4; i++) { const x = (i % 2 ? 1 : -1) * rng.range(3.6, 6.4); out.segs.push({ a: V(x, f, zA - 2), b: V(x, f, zL + 1), up: UP, n: 1 }); }
    // The Court of Three Stairs. Three floors meet at the gate: the floor below, the right-hand wall (its floor faces the low
    // gold sun) and the ceiling. To each a grand flight arrives: the floor's comes down from the loggia, the wall's and the
    // ceiling's fall away from the gate (down their own gravity), one out to the right, one overhead.
    const NS = 44, RISE = 28 / NS, zF = FIN.zF, LS = zF - (FIN.zG + 3);
    for (let k = 0; k < 3; k++) {
      const M = new THREE.Matrix4().makeTranslation(0, FIN.y, 0).multiply(RZ(k * Math.PI / 2)).multiply(frame([-1, 0, 0], [0, 1, 0], 0, -14, zF));
      const up = V(0, 1, 0).transformDirection(M), P = (x, y, z) => V(x, y, z).applyMatrix4(M);
      B.push(M);
      stone(0.35); B.box(-14, -1.6, 0, 14, 0, LS, 0.6, 2); stone(0.2, 1);
      B.quad([-14, 0, 0], [14, 0, 0], [14, 0, LS], [-14, 0, LS], [0, -9, 30], false);      // (the wall's paving stands in the gold sun: pale stone, like every sunlit face)
      tone(0.45); for (const sx of [-1, 1]) B.cbox(sx * 14 - 0.5 - 0.07 * k, -2.1, -0.4, sx * 14 + 0.5 + 0.07 * k, 0.5 + 0.06 * k, LS, 0.2, 0.7);           // a kerb along both edges
      await yld();
      { const a = B.tris * 3; let wr = null; if (k === 0) { B.push(K.RY(Math.PI)); K.flight(NS, 2, RISE, 14, 2.2); } else { B.push(T(0, -28, -2 * NS));
          if (k === 2) K.flight(NS, 2, RISE, 14, 2.2);
          // (round 7) the wall's flight is a stair of its own (see wallFlight), in place of the kit flight that stood here. That flight's
          // draws are no longer made, so what this stream gives the court after this line (tones, tree and vine shapes) is dealt anew.
          else { await yld(); wr = wallFlight(B, K, makeKit(B, pal, makeRng(hashSeed('wallflight:' + seed)), style), NS, RISE, pal); } }
        if (k === 2) D.gains.push([a, B.tris * 3, 2.1, 1.9, 1.75]);      // the flight overhead shows the camera its treads: lifted out of the dark, like the stair over the entry
        await yld();
        // a runner down the floor's flight and the wall's: seen along its length a stair is then a stair with a direction, not a striped plank
        const ra = B.tris * 3;
        if (k < 2) runner(B, NS, 2, RISE, k ? 3.0 : 4.6, runC.clone().multiplyScalar(0.62), runE.clone().multiplyScalar(0.8));      // (the wall's is narrower: seen side-on it was a row of red blocks)
        // the wall's flight is seen along its length, risers first, and they face away from every sun: they are shaded as if they
        // leaned up toward the cool sun overhead, so each step is a lilac riser under a peach tread (they were one gold with the treads)
        if (k === 1) { const nn = [-0.36, 0.6, 0.715]; D.gains.push([wr[0], wr[1], 1, 1, 1, [0, 0, 1], nn], [ra, B.tris * 3, 1, 1, 1, [0, 0, 1], nn]); }
        B.pop(); }
      await yld();
      if (k) {      // the far end of a flight that falls away: a landing with a parapet, lamps and two trees
        stone(0.35); B.cbox(-8.2, -31.4, -2 * NS - 12, 8.2, -28, -2 * NS + 0.2, 0.35, 0.6); stone(0.2, 1); B.quad([-7, -27.97, -2 * NS - 11.4], [7, -27.97, -2 * NS - 11.4], [7, -27.97, -2 * NS], [-7, -27.97, -2 * NS], [0, -40, -95], false);
        K.balustrade(-7.6, 7.6, -28, -2 * NS - 11.4, 1);
        if (k === 1) { K.orangeTree(-5.4, -28, -2 * NS - 8.2, 1.15); K.orangeTree(5.4, -28, -2 * NS - 8.2, 1.0); }      // (nothing hangs from the ceiling's landing: it would cross the top of the frame)
        for (const x of [-4.4, 0, 4.4]) out.segs.push({ a: P(x - 0.5, -28, -2 * NS - 1.5), b: P(x + 0.5, 0, -1.5), up, n: 2, keep: 1 });
      } else for (const x of [-4.4, 0, 4.4]) out.segs.push({ a: P(x + 0.5, 0, -1.5), b: P(x - 0.5, 28, -2 * NS + 1.5), up, n: 2, keep: 1 });
      await yld();
      // the last steps up to the gate
      B.at(T(0, 0, LS - 26.5), () => K.flight(9, 2, 0.5, 10, 0.4));
      stone(0.3); B.cbox(-6.2, 0, LS - 8.5, 6.2, 4.5, LS, 0.3, 0.7);
      for (const sx of [-1, 1]) for (let j = 0; j < 5; j++) vine(B, K, rng, sx * 6.45, 4.5, LS - 7.3 + j * 1.5 + rng.range(-0.3, 0.3), rng.range(2.2, 4.3), coral);
      await yld();
      // trees on the floor and on the wall only (on the wall round orange trees, no long cypress lying across the view; under the
      // ceiling nothing: a tree hanging there is a black mass against the light)
      if (k === 0) { K.cypress(-12.2, 0, 9, 7); K.cypress(12.2, 0, 37, 6.5); } else if (k === 1) { K.orangeTree(-11.8, 0, 9, 0.9); K.orangeTree(11.8, 0, 37, 0.9); }
      if (k < 2) { K.orangeTree(11.6, 0, 22, 0.95); K.orangeTree(-11.6, 0, 51, 0.9); }
      for (const z of [16 + k * 3.5, 30 + k * 3.5, 44 + k * 3.5]) for (const sx of [-1, 1]) { tone(0.4); B.cbox(sx * 13 - 0.45, 0, z - 0.45, sx * 13 + 0.45, 1.3, z + 0.45, 0.1, 0.8); K.lantern(sx * 13, 1.3, z, 0.42); }
      const Ms = T(-8.6, 0, LS - 14); B.at(Ms, () => sundial(B, K, 2.1, M.clone().multiply(Ms)));     // floor, wall and ceiling each carry a dial for their own sun
      // and each has its own lamp niche in the gate wall, standing on that floor beside its steps (three corners of the wall; no draw)
      B.at(T(11.6, 0, LS - 0.32), () => { tone(0.1); B.archWall(3.8, 7.6, 0.6, 2.3, 5.1, style.archRise, 6, 0.75, true);
        dark(0.8); B.st.kind = 4; B.quad([-1.15, 0, 0.27], [1.15, 0, 0.27], [1.15, 6.9, 0.27], [-1.15, 6.9, 0.27], [0, 3, 5], false, 0.5, 0.5, 0.8, 0.8);
        tone(0.45); B.cbox(-2.2, 7.6, -0.5, 2.2, 8.1, 0.3, 0.1, 0.7); tone(0.4); B.cbox(-0.55, 0, -1.0, 0.55, 1.1, 0.0, 0.1, 0.8); K.lantern(0, 1.1, -0.5, 0.5); });
      // a rill between two kerbs runs along each of the three floors to the gate (on the ceiling too), with its goldfish
      for (const xk of [6.45, 8.3]) { tone(0.38); B.box(xk, 0, 6, xk + 0.25, 0.32, LS - 9, 0.8, 1); }
      dark(0.6); B.st.kind = 4; B.quad([6.7, 0.04, 6], [8.3, 0.04, 6], [8.3, 0.04, LS - 9], [6.7, 0.04, LS - 9], [7.5, -9, 30], false, 0.7);
      water.flat(M, 6.7, 8.3, 0.2, 6, LS - 9, 0, (LS - 15) / 5, 0, 0.25, 1, 1);
      if (k === 1) { const x = -6.9, z = 30, sc = 0.6;      // and on the wall a small domed kiosk, standing out toward the path
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) { tone(0.2); B.column(x + sx * 2.6 * sc, z + sz * 2.6 * sc, 0.35, 5 * sc, 0.36 * sc, 6); }
        tone(0.4); B.cbox(x - 3.6 * sc, 0, z - 3.6 * sc, x + 3.6 * sc, 0.35, z + 3.6 * sc, 0.1, 0.8); tone(0.35); B.cbox(x - 3.4 * sc, 5 * sc, z - 3.4 * sc, x + 3.4 * sc, 5.7 * sc, z + 3.4 * sc, 0.12, 0.6);
        K.roof(); B.lathe(x, z, [[3.1 * sc, 5.7 * sc], [2.4 * sc, 7.3 * sc], [0.3 * sc, 8.6 * sc]], 8, 0.8, 1.05); K.lantern(x, 8.6 * sc, z, 0.3); }
      B.pop();
      out.fish.push({ a: P(7.5, 0.24, 8), b: P(7.5, 0.24, LS - 11), up, n: 3 });
      out.segs.push({ a: P(-3.7, 0, LS - 26), b: P(-3.7, 4.5, LS - 8.9), up, n: 1 }, { a: P(3.7, 4.5, LS - 8.9), b: P(3.7, 0, LS - 26), up, n: 1 }, { a: P(-2.6, 0, 2), b: P(-2.6, 0, LS - 28), up, n: 1 },
        { a: P(-9.7, 0, 3), b: P(-9.7, 0, LS - 3), up, n: 2, keep: 1 }, { a: P(9.7, 0, LS - 4), b: P(9.7, 0, 4), up, n: 2, keep: 1 });
      await yld();
    }
    // the moon gate, and beside it (the open, sunward side) a wall of tall water windows: for this wall "down" is -Z, so its
    // pools stand on edge. The second ball of water hangs before them and drains into the nearest
    // (darkness in this world is shade, never a darker stone: the gate wall is the pale stone, grazed by two suns; the portal's dark
    // ground is the gate's own throat, the reveal of the round opening, which every ring wall shades as the inside of an opening)
    B.at(T(0, FIN.y, FIN.zG), () => { stone(0.12); ringWall(B, 17, 7.25, 0, 3, 1.5);
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) { stone(0.3); B.cbox(sx * 17 - 2.2, sy * 17 - 2.2, -0.6, sx * 17 + 2.2, sy * 17 + 2.2, 3.6, 0.4, 0.7); }
      // the wall is dressed (no draw from rng): an outer archivolt round the ring, and in the one corner that no floor claims a carved roundel
      const p = (a, r, z) => [r * Math.cos(a), r * Math.sin(a), z];
      for (let i = 0; i < 40; i++) { const a0 = i / 40 * Math.PI * 2, a1 = (i + 1) / 40 * Math.PI * 2, mid = p((a0 + a1) / 2, 10.55, 3.1); tone(0.3 + 0.16 * (i % 2));
        B.quad(p(a0, 10.2, 3.32), p(a1, 10.2, 3.32), p(a1, 10.9, 3.32), p(a0, 10.9, 3.32), mid, false);
        B.quad(p(a0, 10.9, 3), p(a1, 10.9, 3), p(a1, 10.9, 3.32), p(a0, 10.9, 3.32), mid, false, 0.85); B.quad(p(a0, 10.2, 3), p(a1, 10.2, 3), p(a1, 10.2, 3.32), p(a0, 10.2, 3.32), mid, false, 0.7); }
      B.at(frame([1, 0, 0], [0, 0, 1], -11.7, 11.7, 3), () => { tone(0.45); B.lathe(0, 0, [[2.0, 0], [2.0, 0.36], [1.62, 0.36]], 16, 0.85, 1); tone(0.12); B.lathe(0, 0, [[1.62, 0.2], [1.15, 0.2], [0.95, 0.42], [0.6, 0.42], [0.45, 0.3], [0, 0.56]], 16, 0.85, 1.1); }); });
    for (const sx of [-1, 1]) { K.roof(); B.lathe(sx * 17, FIN.zG + 1.7, [[2.8, FIN.y + 19.2], [2, FIN.y + 22.5], [0.3, FIN.y + 26]], 4, 0.85, 1.05); K.lantern(sx * 17, FIN.y + 26, FIN.zG + 1.7, 0.7); }
    await yld();
    const zW = FIN.zG + 1.5, y0 = FIN.y - 18;
    for (let i = 0; i < 4; i++) { const xc = -22.7 - i * 7; stone(0.1 + 0.06 * (i % 2)); B.at(T(xc, y0, zW), () => B.archWall(7, 36, 3, 5, 27, style.archRise, 8));
      water.flat(frame([1, 0, 0], [0, 0, 1], xc, 0, zW - 0.2), -2.5, 2.5, 0, -(y0 + 31.5), -y0, 0, 6.3, 0, 0, 0.8, 0.8);
      for (let j = 0; j < 2; j++) { const x = xc + rng.range(-1.6, 1.6); out.fish.push({ a: V(x, y0 + 2 + rng.range(0, 6), zW - 0.15), b: V(x + rng.range(-0.5, 0.5), y0 + 27 - rng.range(0, 6), zW - 0.15), up: V(0, 0, 1), n: 1 }); } }
    tone(0.4); B.cbox(-47.6, y0 - 1.2, zW - 1.9, -19, y0, zW + 1.9, 0.2, 0.65); B.cbox(-47.6, y0 + 36, zW - 1.9, -19, y0 + 37.2, zW + 1.9, 0.2, 0.65);
    stone(0.28); B.cbox(-49.4, y0 - 1.2, zW - 2.1, -47.2, y0 + 39, zW + 2.1, 0.3, 0.7); K.roof(); B.lathe(-48.3, zW, [[2.2, y0 + 39], [1.5, y0 + 42], [0.25, y0 + 45]], 4, 0.85, 1.05); K.lantern(-48.3, y0 + 45, zW, 0.6);
    await yld();
    // the second ball's two streams (zone C's water falls along -Z): out of its far side into the water window behind it
    { const c = FIN.sph, R = 12.5 * FIN.sphS, Mt = frame([1, 0, 0], [0, 0, 1], c[0], c[1], c[2]);
      water.tube(Mt, (q) => ({ p: [0, -(R * 0.9 + (c[2] - R * 0.9 - zW - 0.4) * q), 0.5 * q * q], hw: lerp(1.5, 2.1, q), th: lerp(0.9, 0.5, q) }), 8, 0, 1.4, 0.2, 0.12); }
    for (const sp of spouts) if (sp.set === 'C') { const a = B.tris * 3; spout(B, K, sp.M, true); D.gains.push([a, B.tris * 3, 1.3, 1.24, 1.2]);      // (bare: its arches stood beside the dive as dark bars cut by the edge of the frame)
      // a carved roll under the lip and a turned boss under the channel's head
      B.at(sp.M, () => { tone(0.3); B.at(frame([0, 1, 0], [1, 0, 0], 0, -0.9, 0.25), () => B.lathe(0, 0, [[0, -4.6], [0.7, -4.6], [0.92, -4.2], [0.92, 4.2], [0.7, 4.6], [0, 4.6]], 10));
        tone(0.35); B.lathe(0, -9, [[0, -5.2], [0.9, -4.6], [0.6, -3.9], [2.2, -2.7], [4.4, -1.6]], 12, 0.7, 0.95); });
      // zone C's fall itself, level along the court from this lip onto the near side of the ball: the hero's own falling water (teal,
      // white where it tears), its streaks at twice the size because the dive passes close to it, its edges uneven like a real stream's
      const tE = Math.sqrt(2 * sp.H / 9.81), R = 12.5 * FIN.sphS, wob = (q) => 1 + 0.045 * Math.sin(q * 23 + 0.6) * smoothstep(0.04, 0.2, q) + 0.03 * Math.sin(q * 41 + 2.1) * smoothstep(0.1, 0.3, q);
      water.tube(sp.M, (q) => ({ p: [0, -(sp.H + R * 0.12) * q * q, sp.launch * tE * q], hw: (lerp(3.8, 3.0, q) + 0.9 * smoothstep(0.86, 1, q)) * wob(q), th: lerp(0.6, 1.6, Math.sqrt(q)) }), 108, -0.2, 3.3, 0.02, 0.05, 0.5, 20, 0.35);
      await yld(); }
    for (const l of K.lanterns) out.glows.push(l);
  }
  const ga = A.B.finish(); await yld();
  const gc = C.B.finish(); await yld();
  const gd = D.B.finish(); await yld();
  const gp = Pz.B.finish(); await yld();
  applyGains(ga, A.gains); applyGains(gd, D.gains); await yld();
  await boundsInSteps(ga, yld); await yld();
  await boundsInSteps(gc, yld); await yld();
  await boundsInSteps(gp, yld); await yld();
  await boundsInSteps(gd, yld);
  return { geoA: ga, geoC: gc, geoD: gd, geoP: gp, tris: A.B.tris + C.B.tris + D.B.tris + Pz.B.tris, trisD: D.B.tris, trisP: Pz.B.tris };
}

// ---------------------------------------------------------------------------------------------------------------
// (polish 5) The Court of Three Stairs, second mesh: what gives its wall, its stairs and its stream their architecture.
// Built with its own rng; drawn only from inside the second gallery on. Frames as in the court: floor k = 0, wall k = 1.
//   - an arcaded balcony along the wall's upper edge (in the wall's gravity), with a balustrade, hanging gardens and lamps
//   - the wall's flight: its file of bearers
//   - the wine runner on the nine steps up to the gate (the court floor between the flights is bare checkerboard)
//   - three ring terraces round zone C's stream (their floors face +Z, the stream's "up"), each with lamps, trees and bearers
// ---------------------------------------------------------------------------------------------------------------
async function buildCourt2(pal, style, out, yld, rx) {
  const B = makeBuilder(9000), K = makeKit(B, pal, rx, style), { stone, dark, tone, T } = K;
  const V = (x, y, z) => new THREE.Vector3(x, y, z), SIDE = frame([0, 0, 1], [0, 1, 0]);
  const coral = pal[6].clone().lerp(pal[0], 0.2).multiplyScalar(0.9);
  const runC = pal[6].clone().lerp(pal[4], 0.55).multiplyScalar(0.8 * 0.62), runE = pal[0].clone().multiplyScalar(0.74 * 0.8);
  const NS = 44, RISE = 28 / NS, zF = FIN.zF, LS = zF - (FIN.zG + 3), gains = [];
  const Mk = (k) => new THREE.Matrix4().makeTranslation(0, FIN.y, 0).multiply(RZ(k * Math.PI / 2)).multiply(frame([-1, 0, 0], [0, 1, 0], 0, -14, zF));
  // ---- the wall: an arcade of six bays along its upper edge, a balcony on its roof
  { const M = Mk(1), up = V(0, 1, 0).transformDirection(M), P = (x, y, z) => V(x, y, z).applyMatrix4(M), xa = -10.6;
    B.push(M);
    for (let j = 0; j < 6; j++) { const zc = 9 + 7 * j; stone(0.12 + 0.08 * (j % 2)); B.at(SIDE.clone().setPosition(xa, 0, zc), () => B.archWall(7, 5.5, 0.9, 5.0, 3.1, style.archRise, 8));
      for (let v = 0; v < 2; v++) vine(B, K, rx, xa + 0.62, 5.5, zc - 3.5 + (v ? 0.9 : -0.9) + rx.range(-0.2, 0.2), rx.range(1.4, 3.6), coral);
      if (j % 2 === 0) out.hangs.push({ p: P(-12.4, 5.48, zc), up });
      if (j % 3 === 2) await yld(); }
    for (const zc of [5.5, 47.5]) { stone(0.2); B.at(T(-12.45, 0, zc), () => B.archWall(3.9, 5.5, 0.9, 2.3, 3.3, style.archRise, 6)); }
    tone(0.4); B.cbox(-14.5, 5.5, 4.8, -10.0, 6.1, 48.2, 0.2, 0.65);
    tone(0.2, 1); B.quad([-14.3, 6.13, 5], [-10.2, 6.13, 5], [-10.2, 6.13, 48], [-14.3, 6.13, 48], [-12, 0, 26], false);
    B.at(SIDE.clone().setPosition(-10.35, 6.1, 26.5), () => K.balustrade(-21.4, 21.4, 0, 0, 1));
    K.orangeTree(-12.6, 6.1, 12.5, 0.7); K.orangeTree(-12.6, 6.1, 40.5, 0.7);
    out.segs.push({ a: P(-12.2, 6.13, 15.5), b: P(-12.2, 6.13, 37.5), up, n: 2, keep: 1 });
    B.pop(); await yld(); }
  // ---- the wall's flight: its file of bearers (the stair itself is built with the court: see wallFlight)
  { const M = Mk(1).multiply(T(0, -28, -2 * NS)), up = V(0, 1, 0).transformDirection(M), P = (x, y, z) => V(x, y, z).applyMatrix4(M);
    B.push(M);
    out.segs.push({ a: P(0, RISE, 1.5), b: P(0, 28, 2 * NS - 0.5), up, n: 12, keep: 1, file: { sp: 1.2, lane: 0.9 } });
    B.pop(); await yld(); }
  // ---- the floor: the runner goes on from the foot of the flight to the gate, and a file of bearers walks it
  { const M = Mk(0), P = (x, y, z) => V(x, y, z).applyMatrix4(M), UPY = V(0, 1, 0), zs = LS - 26.5;
    B.push(M);
    // (the court floor and the gate plinth are the design's checkerboard: no cloth lies across them; the runner is on the steps only)
    B.at(T(0, 0, zs), () => runner(B, 9, 2, 0.5, 4.6, runC, runE));
    out.segs.push({ a: P(0, 0, 1.5), b: P(0, 0, zs - 1), up: UPY, n: 8, keep: 1, file: { sp: 1.2, lane: 1.1 } },
      { a: P(0, 0, -1.5), b: P(0, 28, -2 * NS + 1.5), up: UPY, n: 14, keep: 1, file: { sp: 1.2, lane: 1.2, ph: 0.5 } });
    B.pop(); await yld(); }
  // ---- zone C's stream: three ring terraces it pours through on its way to the ball
  { const H = FIN.fallH, tE = Math.sqrt(2 * H / 9.81), zl = FIN.sph[2] + 12.5 * FIN.sphS + H, xl = FIN.sph[0] - FIN.launch * tE, upZ = V(0, 0, 1);
    for (const [zc, ro, n] of [[-356, 8.8, 7], [-386, 8.0, 6], [-414, 7.0, 5]]) { const q = Math.sqrt((zl - zc) / H), xc = xl + FIN.launch * tE * q;
      const Mr = frame([1, 0, 0], [0, 0, 1], xc, FIN.sph[1], zc), P = (x, y, z) => V(x, y, z).applyMatrix4(Mr), ri = 4.9;
      B.push(Mr);
      tone(0.3); B.lathe(0, 0, [[ri, -1.0], [ri, 0.4], [ri + 0.55, 0.4], [ri + 0.55, 0]], 20, 0.75, 1);
      tone(0.2, 1); B.lathe(0, 0, [[ri + 0.55, 0], [ro - 0.6, 0]], 20);
      tone(0.35); B.lathe(0, 0, [[ro - 0.6, 0], [ro - 0.6, 0.55], [ro, 0.55], [ro, -0.5], [ro - 1.3, -1.6], [ri + 0.8, -1.6], [ri, -1.0]], 20, 0.7, 1);
      for (let i = 0; i < n; i++) { const a = (i + 0.5) / n * 6.2832; K.lantern((ro - 0.3) * Math.cos(a), 0.55, (ro - 0.3) * Math.sin(a), 0.42); }
      const rm = (ri + ro) / 2 + 0.1; K.orangeTree(rm * 0.2, 0, -rm * 0.98, 0.55); K.orangeTree(-rm * 0.3, 0, rm * 0.95, 0.5);
      out.segs.push({ a: P(rm, 0, -2.4), b: P(rm, 0, 2.4), up: upZ, n: 1, keep: 1 }, { a: P(-rm, 0, 2.2), b: P(-rm, 0, -2.2), up: upZ, n: 1, keep: 1 });
      B.pop(); await yld(); } }
  for (const l of K.lanterns) out.glows.push(l);
  const geo = B.finish(); await yld();
  applyGains(geo, gains);
  await boundsInSteps(geo, yld);
  return { geo, tris: B.tris };
}

// ---------------------------------------------------------------------------------------------------------------
// lantern-bearers and hanging lanterns: instanced, placed and animated in the vertex shader. Each instance has
// its own gravity: aA start / pivot, aB end + speed (walk) or swing axis (hang), aUp up-vector + phase.
// ---------------------------------------------------------------------------------------------------------------
const FIG_GLSL = /* glsl */`
  attribute vec3 aA; attribute vec4 aB; attribute vec4 aUp;
  uniform float uTime;
  vec3 figPlace(vec3 lp, inout vec3 n){
    vec3 up = aUp.xyz; vec3 fwd, side, base;
    #ifdef SWING
      fwd = aB.xyz; side = cross(up, fwd); base = aA;
      float ang = 0.2 * sin(uTime * 1.5 + aUp.w * 6.283) + 0.07 * sin(uTime * 2.7 + aUp.w * 17.0);
      float c = cos(ang), s = sin(ang);
      lp = vec3(lp.x, lp.y * c - lp.z * s, lp.y * s + lp.z * c); n = vec3(n.x, n.y * c - n.z * s, n.y * s + n.z * c);
    #else
      vec3 d = aB.xyz - aA; float len = max(length(d), 0.01);
      // (aB.w holds the pace and, in steps of 8, a lane: a walker in a file keeps to one side of its line on the way out and to
      //  the other on the way back, so a procession climbs one side of a stair and comes down the other)
      float lc = floor(aB.w / 8.0), spd = aB.w - lc * 8.0;
      float cyc = fract(aUp.w + uTime * spd / (2.0 * len)) * 2.0; float t = cyc < 1.0 ? cyc : 2.0 - cyc; float sg = cyc < 1.0 ? 1.0 : -1.0;
      fwd = normalize(d - up * dot(d, up) + vec3(1e-5)) * sg; side = cross(up, fwd);
      float st = uTime * spd * 2.6 + aUp.w * 40.0;
      #ifdef FISH
        lp.x += sin(st * 1.3 - lp.z * 2.6) * 0.17 * (0.5 - lp.z);
      #else
        lp.z += sin(st) * 0.34 * (1.69 - lp.y) * step(lp.x, -0.535) * step(lp.y, 1.75);      // the free arm swings from the shoulder (the other holds the staff)
        lp.z += sign(lp.x) * sin(st) * 0.13 * (1.0 - smoothstep(0.0, 0.62, lp.y));      // the stride: feet and hem swing fore and aft
        lp.x += sin(st) * 0.04 * lp.y; lp.y += abs(sin(st)) * 0.14 * step(0.5, lp.y);
        { float ln = 0.05 + 0.05 * sin(st * 2.0), cl = cos(ln), sl = sin(ln); lp = vec3(lp.x, lp.y * cl - lp.z * sl, lp.y * sl + lp.z * cl); }
      #endif
      base = aA + d * t + side * (lc * 0.25 * smoothstep(0.0, 0.07, t) * smoothstep(1.0, 0.93, t));
    #endif
    n = side * n.x + up * n.y + fwd * n.z;
    return base + side * lp.x + up * lp.y + fwd * lp.z;
  }`;
function mergeParts(parts) {
  const P = [], N = [], C = [], E = [];
  for (const p of parts) { const g = p.g.index ? p.g.toNonIndexed() : p.g, pa = g.attributes.position.array, na = g.attributes.normal.array;
    for (let i = 0; i < pa.length; i += 3) { P.push(pa[i], pa[i + 1], pa[i + 2]); N.push(na[i], na[i + 1], na[i + 2]); C.push(p.c.r, p.c.g, p.c.b); E.push(p.e || 0); }
    p.g.dispose(); if (g !== p.g) g.dispose(); }
  return { P, N, C, E };
}
// partOf (optional): z -> 0 or 1. The batch is then made in two parts (object.children), so the far part can be drawn from nearer
// than the rest; every draw of rng is made in the same order with or without it.
function makeFigures(U, pal, segs, hangs, rng, lampGain, fishSegs = [], bellList = [], crowd = 1, partOf = null) {
  const group = new THREE.Group(); group.name = 'figures';
  const NP = partOf ? 2 : 1, pz = (o) => (partOf ? partOf(o.p ? o.p.z : (o.a.z + o.b.z) / 2) : 0), mk = () => Array.from({ length: NP }, () => []);
  // three values, so a figure lying along a wall still reads as a person: an ochre robe, a plum hood, feet and staff, cream trim
  const ochre = pal[1].clone().lerp(new THREE.Color('#bb8730'), 0.75), hood = new THREE.Color('#2f2a44').lerp(ochre, 0.25), lampC = pal[6].clone().lerp(pal[0], 0.3);
  // a lantern-bearer: a flared robe with narrow shoulders, a pointed hood tipped back over a dark, faceless head, a sash,
  // and a tall staff held forward with the lantern hanging from its crook
  const S = 1.3, L2 = (x, y) => new THREE.Vector2(x * S, y * S), face = hood.clone().multiplyScalar(0.3), band = pal[0].clone().multiplyScalar(0.72);
  const sleeve = (sx) => ({ g: new THREE.CylinderGeometry(0.06 * S, 0.105 * S, 0.5 * S, 5, 1, true).rotateX(1.9).translate(sx * 0.25 * S, 1.2 * S, 0.17 * S), c: band });
  // (a robe cut above the ankle so two feet show and stride, square shoulders, a rounded cowl over the dark hollow of the
  //  face, a pale hand on the staff: seen lying along a wall it has to read as a person, not as a skittle)
  const skin = pal[0].clone().multiplyScalar(0.8);
  const walker = mergeParts([
    { g: new THREE.LatheGeometry([L2(0.52, 0.3), L2(0.4, 0.5), L2(0.24, 0.97), L2(0.2, 1.12), L2(0.33, 1.3), L2(0.27, 1.4), L2(0.11, 1.48)], 6), c: ochre },      // a bell with a waist
    { g: new THREE.LatheGeometry([L2(0.55, 0.2), L2(0.52, 0.3)], 6), c: band },
    { g: new THREE.LatheGeometry([L2(0.26, 0.93), L2(0.245, 1.08)], 6), c: hood },
    { g: new THREE.BoxGeometry(0.17 * S, 0.34 * S, 0.24 * S).translate(-0.15 * S, 0.17 * S, 0.03 * S), c: hood },             // feet
    { g: new THREE.BoxGeometry(0.17 * S, 0.34 * S, 0.24 * S).translate(0.15 * S, 0.17 * S, 0.03 * S), c: hood },
    { g: new THREE.BoxGeometry(0.8 * S, 0.15 * S, 0.27 * S).translate(0, 1.33 * S, 0), c: band },                            // shoulders (broad: from above the figure is a person, not a cone)
    { g: new THREE.LatheGeometry([L2(0.3, 1.37), L2(0.28, 1.47)], 6), c: pal[0].clone().multiplyScalar(0.7) },               // a pale collar: head and body part
    { g: new THREE.BoxGeometry(0.11 * S, 0.54 * S, 0.13 * S).translate(-0.47 * S, 1.03 * S, 0), c: band },                    // the free arm (it swings: see FIG_GLSL)
    { g: new THREE.SphereGeometry(0.06 * S, 3, 2).translate(-0.47 * S, 0.73 * S, 0), c: skin },
    { g: new THREE.SphereGeometry(0.2 * S, 5, 3).scale(1, 1.08, 1.08).translate(0, 1.68 * S, 0), c: hood },             // the hooded head
    { g: new THREE.SphereGeometry(0.13 * S, 4, 2).translate(0, 1.65 * S, 0.11 * S), c: face },                            // faceless: a dark hollow
    { g: new THREE.SphereGeometry(0.17 * S, 5, 3).scale(1, 0.9, 1.25).translate(0, 1.76 * S, -0.1 * S), c: hood },         // the cowl, rounded over the back of the head
    sleeve(1),
    { g: new THREE.SphereGeometry(0.08 * S, 3, 2).translate(0.33 * S, 1.2 * S, 0.42 * S), c: skin },                     // the hand on the staff
    { g: new THREE.CylinderGeometry(0.032 * S, 0.032 * S, 2.0 * S, 3, 1, true).translate(0.33 * S, 1.0 * S, 0.46 * S), c: hood },
    { g: new THREE.CylinderGeometry(0.03 * S, 0.03 * S, 0.3 * S, 3, 1, true).rotateX(Math.PI / 2).translate(0.33 * S, 2.0 * S, 0.59 * S), c: hood },
    { g: new THREE.CylinderGeometry(0.02 * S, 0.02 * S, 0.3 * S, 3, 1, true).translate(0.33 * S, 1.86 * S, 0.72 * S), c: hood },
    { g: new THREE.CylinderGeometry(0.1 * S, 0.07 * S, 0.26 * S, 5, 1, true).translate(0.33 * S, 1.57 * S, 0.72 * S), c: lampC, e: 1 },
    { g: new THREE.ConeGeometry(0.14 * S, 0.11 * S, 5, 1, true).translate(0.33 * S, 1.755 * S, 0.72 * S), c: hood }]);
  const hanger = mergeParts([
    { g: new THREE.BoxGeometry(0.06, 2.0, 0.06).translate(0, -1.0, 0), c: hood },
    { g: new THREE.ConeGeometry(0.36, 0.34, 6).translate(0, -2.08, 0), c: hood },
    { g: new THREE.CylinderGeometry(0.28, 0.2, 0.56, 6).translate(0, -2.5, 0), c: lampC, e: 1 },
    { g: new THREE.ConeGeometry(0.2, 0.3, 6).rotateX(Math.PI).translate(0, -2.93, 0), c: hood }]);
  // goldfish for the rills and pools: they ride the surface of their channel, whatever its gravity
  const gold = pal[6].clone().lerp(new THREE.Color('#ff9a2e'), 0.45);
  const tailC = gold.clone().lerp(pal[0], 0.3), lobe = (sg) => ({ g: new THREE.ConeGeometry(0.2, 0.55, 4).rotateX(Math.PI / 2).translate(0, 0, -0.275).scale(1, 0.15, 1).rotateY(sg * 0.5).translate(0, 0, -0.4), c: tailC, e: 0.08 });
  const fishGeo = mergeParts([
    { g: new THREE.SphereGeometry(0.5, 7, 5).scale(0.34, 0.3, 0.95), c: gold, e: 0.06 },
    { g: new THREE.SphereGeometry(0.3, 6, 4).scale(0.4, 0.38, 0.5).translate(0, 0.03, 0.28), c: pal[0].clone().lerp(gold, 0.25), e: 0.04 },
    { g: new THREE.SphereGeometry(0.3, 5, 3).scale(0.5, 0.2, 0.62).translate(0, 0.115, -0.12), c: pal[0].clone().lerp(gold, 0.12), e: 0.05 },      // a cream saddle: koi, seen from above
    lobe(-1), lobe(1),                                                                                                                         // a forked tail
    { g: new THREE.ConeGeometry(0.16, 0.2, 4).scale(0.12, 1, 1).translate(0, 0.22, 0.05), c: tailC, e: 0.06 }]);                               // dorsal fin
  // bronze bells under the colonnade arches
  const bronze = new THREE.Color(0.55, 0.36, 0.13), V2 = (x, y) => new THREE.Vector2(x, y);
  const bell = mergeParts([
    { g: new THREE.BoxGeometry(0.09, 2.3, 0.09).translate(0, -1.15, 0), c: hood },
    { g: new THREE.BoxGeometry(1.1, 0.16, 0.2).translate(0, -2.3, 0), c: hood },
    { g: new THREE.LatheGeometry([V2(0.95, -1.55), V2(0.86, -1.47), V2(0.62, -1.1), V2(0.5, -0.5), V2(0.4, -0.12), V2(0.02, 0)], 12).translate(0, -2.35, 0), c: bronze, e: 0.03 },
    { g: new THREE.LatheGeometry([V2(0.9, -1.56), V2(0.97, -1.5)], 12).translate(0, -2.35, 0), c: bronze.clone().multiplyScalar(1.5), e: 0.05 },
    { g: new THREE.SphereGeometry(0.16, 6, 4).translate(0, -3.95, 0), c: hood }]);
  const fAs = mk(), fBs = mk(), fUs = mk();
  for (const s of fishSegs) { const fA = fAs[pz(s)], fB = fBs[pz(s)], fU = fUs[pz(s)]; for (let i = 0; i < s.n; i++) { const flip = rng.chance(0.5), a = flip ? s.b : s.a, b = flip ? s.a : s.b;
    fA.push(a.x, a.y, a.z); fB.push(b.x, b.y, b.z, rng.range(1.3, 2.3)); fU.push(s.up.x, s.up.y, s.up.z, rng()); } }
  const bAs = mk(), bBs = mk(), bUs = mk();
  for (const h of bellList) { const g = pz(h); bAs[g].push(h.p.x, h.p.y, h.p.z); bBs[g].push(0, 0, 1, 0); bUs[g].push(h.up.x, h.up.y, h.up.z, rng()); }
  // instance data
  const wAs = mk(), wBs = mk(), wUs = mk();
  for (const s of segs) { const wA = wAs[pz(s)], wB = wBs[pz(s)], wU = wUs[pz(s)]; const nn = s.keep ? Math.max(s.n, s.n * crowd) : s.n * crowd, cnt = Math.floor(nn) + (rng() < nn - Math.floor(nn) ? 1 : 0);
    // (file: { sp, lane }: a procession. Its walkers share one pace, are spaced evenly round the whole loop and keep to their lane.)
    for (let i = 0; i < cnt; i++) { const flip = rng.chance(0.5) && !s.file, a = flip ? s.b : s.a, b = flip ? s.a : s.b, sp = rng.range(0.9, 1.5), ph = rng();
      wA.push(a.x, a.y, a.z); wB.push(b.x, b.y, b.z, s.file ? s.file.sp + 8 * Math.round((s.file.lane || 0) * 4) : sp);
      wU.push(s.up.x, s.up.y, s.up.z, s.file ? (i + 0.3 * ph + (s.file.ph || 0)) / cnt : ph); } }
  const hAs = mk(), hBs = mk(), hUs = mk(), t = new THREE.Vector3();
  for (const h of hangs) { const g = pz(h); t.set(rng.range(-1, 1), rng.range(-1, 1), rng.range(-1, 1)); t.addScaledVector(h.up, -t.dot(h.up)).normalize();
    hAs[g].push(h.p.x, h.p.y, h.p.z); hBs[g].push(t.x, t.y, t.z, 0); hUs[g].push(h.up.x, h.up.y, h.up.z, rng()); }
  const fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ambU = { value: pal[3].clone().multiplyScalar(0.55).add(new THREE.Color(0.08, 0.06, 0.05)) };
  const body = (src, A, Bv, Uv, defines) => {
    const g = new THREE.InstancedBufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(src.P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(src.N, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(src.C, 3)); g.setAttribute('aE', new THREE.Float32BufferAttribute(src.E, 1));
    g.setAttribute('aA', new THREE.InstancedBufferAttribute(new Float32Array(A), 3)); g.setAttribute('aB', new THREE.InstancedBufferAttribute(new Float32Array(Bv), 4)); g.setAttribute('aUp', new THREE.InstancedBufferAttribute(new Float32Array(Uv), 4));
    g.instanceCount = A.length / 3;
    const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ fog: true, vertexColors: true, defines, side: THREE.DoubleSide,
      uniforms: { ...fogU(), uTime: U.time, sunD: U.sunD, sunC: U.sunC, uAmb: ambU, uLamp: { value: lampC.clone().multiplyScalar(3.0 * lampGain) } },
      vertexShader: /* glsl */`
        attribute float aE; varying vec3 vC; varying vec3 vN; varying float vE;
        #include <common>
        #include <fog_pars_vertex>
        ${FIG_GLSL}
        void main(){ vec3 n = normal; vec3 wp = figPlace(position, n); vN = n; vC = color; vE = aE;
          vec4 mvPosition = viewMatrix * vec4(wp, 1.0); gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */`
        uniform vec3 sunD[3]; uniform vec3 sunC[3]; uniform vec3 uAmb; uniform vec3 uLamp; varying vec3 vC; varying vec3 vN; varying float vE;
        #include <common>
        #include <fog_pars_fragment>
        void main(){ vec3 n = normalize(vN); vec3 l = uAmb; for (int i = 0; i < 3; i++) l += sunC[i] * max(dot(n, sunD[i]), 0.0) * 0.9;
          vec3 col = mix(vC * l, uLamp, vE); gl_FragColor = vec4(col, 1.0);
          #include <fog_fragment>
        }` }));
    m.frustumCulled = false; return m;
  };
  const glow = (A, Bv, Uv, swing, size) => {
    const g = new THREE.InstancedBufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
    g.setAttribute('aA', new THREE.InstancedBufferAttribute(new Float32Array(A), 3)); g.setAttribute('aB', new THREE.InstancedBufferAttribute(new Float32Array(Bv), 4)); g.setAttribute('aUp', new THREE.InstancedBufferAttribute(new Float32Array(Uv), 4));
    g.instanceCount = A.length / 3;
    const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ fog: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, defines: swing ? { SWING: '' } : {},
      uniforms: { ...fogU(), uTime: U.time, uLamp: { value: lampC.clone().multiplyScalar(0.7 * lampGain) }, uSize: { value: size } },
      vertexShader: /* glsl */`
        uniform float uSize; varying vec2 vQ; varying float vF;
        #include <common>
        #include <fog_pars_vertex>
        ${FIG_GLSL}
        void main(){ vec3 n = vec3(0.0, 1.0, 0.0);
          #ifdef SWING
            vec3 c = figPlace(vec3(0.0, -2.5, 0.0), n);
          #else
            vec3 c = figPlace(vec3(0.429, 2.04, 0.936), n);
          #endif
          vQ = position.xy; vF = 0.82 + 0.18 * sin(uTime * 3.1 + aUp.w * 50.0);
          vec4 mvPosition = viewMatrix * vec4(c, 1.0); mvPosition.xy += position.xy * uSize; mvPosition.z += 0.4;
          gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */`
        uniform vec3 uLamp; varying vec2 vQ; varying float vF;
        #include <common>
        #include <fog_pars_fragment>
        void main(){ float r = length(vQ); if (r > 1.0) discard;
          float k = max(1.0 - r, 0.0); float g = k * k * k * 1.3 + smoothstep(0.2, 0.0, r) * 0.8, ff = 1.0;
          #ifdef USE_FOG
            #ifdef FOG_EXP2
              ff = exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
            #endif
          #endif
          gl_FragColor = vec4(uLamp * g * vF * ff, 1.0);
        }` }));
    m.frustumCulled = false; m.renderOrder = 5; return m;
  };
  const parts = [], cnt = { walkers: 0, hangers: 0, fish: 0, bells: 0 };
  for (let g = 0; g < NP; g++) { const grp = NP > 1 ? new THREE.Group() : group, wA = wAs[g], hA = hAs[g], fA = fAs[g], bA = bAs[g];
    if (NP > 1) group.add(grp); parts.push(grp);
    if (wA.length) grp.add(body(walker, wA, wBs[g], wUs[g], {}), glow(wA, wBs[g], wUs[g], false, 1.0));
    if (hA.length) grp.add(body(hanger, hA, hBs[g], hUs[g], { SWING: '' }), glow(hA, hBs[g], hUs[g], true, 1.7));
    if (fA.length) grp.add(body(fishGeo, fA, fBs[g], fUs[g], { FISH: '' }));
    if (bA.length) grp.add(body(bell, bA, bBs[g], bUs[g], { SWING: '' }));
    cnt.walkers += wA.length / 3; cnt.hangers += hA.length / 3; cnt.fish += fA.length / 3; cnt.bells += bA.length / 3; }
  return { object: group, parts, amb: ambU.value, ...cnt };
}

// ---------------------------------------------------------------------------------------------------------------
// banners: cloth hung from a rod, each for its own gravity. One mesh for all of them (1 draw call): the billow, the slow
// swing about the rod and the lighting normal are worked out in the vertex shader.
// list: [{ p rod centre, right (along the rod), down (the way it hangs), w, len, c, hem (THREE.Color), ph }]
// ---------------------------------------------------------------------------------------------------------------
function makeBanners(U, pal, list) {
  const P = [], N = [], T = [], C = [], H = [], I = [], cols = 4, v = new THREE.Vector3(), n = new THREE.Vector3(), rod = new THREE.Color(0.1, 0.07, 0.06);
  for (const b of list) {
    const rows = Math.max(5, Math.round(b.len / 0.9)), base = P.length / 3; n.crossVectors(b.right, b.down).normalize();
    for (let j = 0; j <= rows; j++) for (let i = 0; i <= cols; i++) { const s = (i / cols) * 2 - 1, f = j / rows;
      const d = b.len * (f - (j === rows ? 0.12 * (1 - Math.abs(s)) : 0));              // a swallowtail hem
      v.copy(b.p).addScaledVector(b.right, s * b.w / 2).addScaledVector(b.down, d);
      const col = f > 0.7 && f < 0.86 ? b.hem : b.c;
      P.push(v.x, v.y, v.z); N.push(n.x, n.y, n.z, d); T.push(b.right.x, b.right.y, b.right.z, s); C.push(col.r, col.g, col.b); H.push(b.ph, b.len); }
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { const a = base + j * (cols + 1) + i, c = a + cols + 1; I.push(a, c, a + 1, a + 1, c, c + 1); }
    const rb = P.length / 3;                                                               // the rod: it does not move (d <= 0)
    for (const [s, d] of [[-1.14, -0.14], [1.14, -0.14], [1.14, 0.05], [-1.14, 0.05]]) { v.copy(b.p).addScaledVector(b.right, s * b.w / 2).addScaledVector(b.down, d).addScaledVector(n, 0.03);
      P.push(v.x, v.y, v.z); N.push(n.x, n.y, n.z, 0); T.push(b.right.x, b.right.y, b.right.z, s); C.push(rod.r, rod.g, rod.b); H.push(b.ph, b.len); }
    I.push(rb, rb + 1, rb + 2, rb, rb + 2, rb + 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aN', new THREE.Float32BufferAttribute(N, 4)); g.setAttribute('aT', new THREE.Float32BufferAttribute(T, 4));
  g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setAttribute('aH', new THREE.Float32BufferAttribute(H, 2)); g.setIndex(I);
  const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ fog: true, vertexColors: true, side: THREE.DoubleSide,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: U.time, sunD: U.sunD, sunC: U.sunC, uAmb: { value: pal[3].clone().multiplyScalar(0.5).add(new THREE.Color(0.08, 0.06, 0.05)) } },
    vertexShader: /* glsl */`
      attribute vec4 aN; attribute vec4 aT; attribute vec2 aH; uniform float uTime; varying vec3 vC; varying vec3 vN;
      #include <common>
      #include <fog_pars_vertex>
      void main(){
        float d = max(aN.w, 0.0), h = d / max(aH.y, 0.1), s = aT.w, ph = aH.x;
        vec3 nrm = aN.xyz, rt = aT.xyz, dn = cross(nrm, rt);
        float amp = h * (0.3 + 0.7 * h), gust = 0.62 + 0.38 * sin(uTime * 0.37 + ph * 2.3);
        float a1 = uTime * 1.6 - d * 0.62 + ph + s * 0.5, a2 = uTime * 2.7 - d * 1.05 + ph * 1.7 - s * 0.8;
        float bil = (sin(a1) * 0.42 + sin(a2) * 0.16) * amp * gust;
        float lift = (0.5 + 0.5 * sin(uTime * 0.6 + ph * 0.7)) * 0.35 * amp;                      // the hem lifts a little in the gusts
        vec3 p = position + nrm * (bil + lift) + rt * (sin(uTime * 0.83 + ph) * 0.06 * d * gust);   // and the whole cloth swings about its rod
        float dd = (cos(a1) * -0.62 * 0.42 + cos(a2) * -1.05 * 0.16) * amp * gust, ds = (cos(a1) * 0.5 * 0.42 - cos(a2) * 0.8 * 0.16) * amp * gust;
        vN = normalize(nrm - dn * dd - rt * ds * 0.6); vC = color;
        vec4 mvPosition = viewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 sunD[3]; uniform vec3 sunC[3]; uniform vec3 uAmb; varying vec3 vC; varying vec3 vN;
      #include <common>
      #include <fog_pars_fragment>
      void main(){ vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n;
        vec3 l = uAmb; for (int i = 0; i < 3; i++) { float k = dot(n, sunD[i]); l += sunC[i] * (max(k, 0.0) * 0.85 + max(-k, 0.0) * 0.42); }     // cloth lets the suns through
        gl_FragColor = vec4(vC * l, 1.0);
        #include <fog_fragment>
      }` }));
  m.frustumCulled = false; m.name = 'banners';
  return m;
}

// the "sky": there is no outside, only luminous haze with three soft suns on three axes
function makeSkyDome(U, haze, plum, cream) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(2600, 32, 20), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false,
    uniforms: { uTime: U.time, sunD: U.sunD, sunC: U.sunC, uHaze: { value: haze }, uPlum: { value: plum }, uCream: { value: cream }, uDisc: { value: 1 } },
    vertexShader: /* glsl */`varying vec3 vD; void main(){ vD = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */`
      uniform float uTime, uDisc; uniform vec3 sunD[3]; uniform vec3 sunC[3]; uniform vec3 uHaze, uPlum, uCream; varying vec3 vD;
      float h31(vec3 p){ p = fract(p * vec3(0.1031, 0.1130, 0.0973)); p += dot(p, p.yzx + 33.33); return fract((p.x + p.y) * p.z); }
      float vn(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(mix(h31(i), h31(i + vec3(1,0,0)), f.x), mix(h31(i + vec3(0,1,0)), h31(i + vec3(1,1,0)), f.x), f.y),
                   mix(mix(h31(i + vec3(0,0,1)), h31(i + vec3(1,0,1)), f.x), mix(h31(i + vec3(0,1,1)), h31(i + vec3(1,1,1)), f.x), f.y), f.z); }
      void main(){ vec3 d = normalize(vD);
        vec3 q = d * 2.3 + vec3(uTime * 0.012, -uTime * 0.008, uTime * 0.01);
        float n = vn(q) * 0.6 + vn(q * 2.1 + 7.0) * 0.3 + vn(q * 4.3 + 3.0) * 0.1;
        vec3 c = uHaze * (0.68 + 0.26 * n);
        c = mix(c, uPlum * 1.5 + uHaze * 0.35, smoothstep(0.52, 0.8, vn(q * 0.8 + 21.0)) * 0.42);
        // the depths: below the level of the eye, away from the sun overhead, the haze sinks toward plum
        c = mix(c, uPlum * 1.3 + uHaze * 0.4, smoothstep(0.1, -0.9, d.y) * 0.4);
        for (int i = 0; i < 3; i++) { float k = max(dot(d, sunD[i]), 0.0);
          c += sunC[i] * (pow(k, 4.0) * 0.08 + pow(k, 36.0) * 0.5 + pow(k, 700.0) * 5.0 * uDisc) + uCream * pow(k, 10.0) * 0.16; }
        gl_FragColor = vec4(c, 1.0); }` }));
  m.renderOrder = -1; m.frustumCulled = false; m.name = 'haze-dome';
  return m;
}

// The last third's own key (the court): the same three suns, but the low one on the left is now a strong gold key, the one
// ahead a rose backlight behind the gate, the one overhead a dim, cool fill; the haze turns to dusk mauve (lavender on a peach
// visit, so the gold always stands against a cooler air) and the shadows fall to aubergine.
const GOLD = { haze: '#8b76a4', hazePeach: '#7b78b2', plum: '#2a1634', suns: ['#d9d2ff', '#ffc98a', '#ff8d5c'], k: [1.3, 3.5, 2.2], self: [0.5, 1.2, 0.9], hemi: 0.72 };
const MOODS = [
  { name: 'noon', haze: '#7682be', plum: '#2f2a44', suns: ['#fff2da', '#ffc49a', '#b8b2ff'], k: [3.1, 2.3, 1.7], hemi: 0.85, exposure: 0.93, lamp: 1.0, fog: 1.0, air: 0.65 },
  { name: 'peach', haze: '#b98aa2', plum: '#402a44', suns: ['#ffe6c0', '#ff9f6c', '#d0a8ea'], k: [2.3, 3.4, 1.4], hemi: 0.9, exposure: 0.95, lamp: 1.2, fog: 1.08, air: 0.8 },
  { name: 'blue', haze: '#5f6fb8', plum: '#1f2046', suns: ['#e6ebff', '#ffb690', '#9aa2ff'], k: [2.1, 1.7, 2.5], hemi: 0.85, exposure: 0.95, lamp: 2.0, fog: 0.94 },
  { name: 'dusk', haze: '#7e6ba8', plum: '#241a3c', suns: ['#ffdcb4', '#ff8a58', '#a890f4'], k: [1.6, 3.0, 1.5], hemi: 0.8, exposure: 0.97, lamp: 2.4, fog: 1.0 },
];
const HOUR_MOOD = { dawn: 1, day: 0, golden: 3, night: 2 };

export default {
  id: 'stairway-everywhere',
  name: 'Stairway Everywhere',
  category: 'bizarre',
  weirdness: 0.95,
  async build(ctx) {
    const rng = ctx.rng, scene = new THREE.Scene();
    // what the visit asks for: the hour picks the mood when one is set, otherwise the seed does (about one visit in five is dusk)
    const vary = ctx.vary || {}, detail = clamp(ctx.quality?.detail ?? 1, 0.5, 1), density = clamp(vary.density ?? 1, 0.7, 1.3), rare = !!vary.rare;
    const seedMood = rng.int(0, 2);
    const mood = MOODS[HOUR_MOOD[vary.hour] ?? ((vary.mood ?? 0) > 0.8 ? 3 : seedMood)];
    const palette = PALETTE.slice(); palette[3] = mood.haze; palette[4] = mood.plum;
    const sunDirs = SUN_DIRS;
    const hazeC = new THREE.Color(mood.haze), plumC = new THREE.Color(mood.plum), creamC = new THREE.Color(PALETTE[0]);
    const fogDensity = rng.range(0.0034, 0.004) * mood.fog * 1.08;
    scene.fog = new THREE.FogExp2(hazeC.clone().lerp(plumC, 0.1).multiplyScalar(0.84), fogDensity);
    const lights = [];
    for (let i = 0; i < 3; i++) { const l = new THREE.DirectionalLight(mood.suns[i], mood.k[i] * rng.range(0.92, 1.08)); l.position.set(sunDirs[i][0], sunDirs[i][1], sunDirs[i][2]).multiplyScalar(300); scene.add(l); lights.push(l); }
    // the fill comes from where the three suns stand, so a face turned away from all of them falls to plum (the picture's dark anchor)
    const hemi = new THREE.HemisphereLight(hazeC.clone().lerp(creamC, 0.45), plumC.clone().lerp(hazeC, 0.35), mood.hemi * 0.9); hemi.position.set(-1, 1, -1); scene.add(hemi);

    // ---------------------------------------------------------------- hero: the Triple Fall, sphere centre at the world origin
    await ctx.yield();
    const hero = await buildHero(ctx, { palette, selfLight: 0.3, shade: [0.36, 0.6], bounce: [0.2, 0.14, 0.1], leafGlow: 0.1, lampEmissive: 3.4, mistAlpha: 0.08, glowSize: 8, glowGain: 0.8,
      suns: sunDirs.map((d, i) => ({ dir: d, color: mood.suns[i], intensity: [1.0, 0.85, 0.75][i] * mood.k[i] / MOODS[0].k[i] })) });
    hero.object.position.set(0, -hero.anchors.sphereCenter.y, 0); scene.add(hero.object);
    const off = hero.object.position, kit = hero.kit, pal = kit.pal, style = kit.style, U = kit.U;
    await ctx.yield();

    // ---------------------------------------------------------------- path
    const fly = hero.anchors.flyThrough.map((p) => p.clone().add(off));
    const head = [[0, -30, 470], [0, -30, 448], [0, -25, 425], [0, -15, 385], [0, -5, 345], [0, 0, 322], [0, 0, 300], [0, 0, 245], [0, 0, 190], [0, 0, 160], ...fly, [0, 0, -150], [0, 0, -205], [0, 0, -260]];
    // out of the second gallery the path leaves the axis: it banks right over the stair on the wall, drops 26 m into the court and
    // comes back to meet the gate head-on (the last 58 m are straight and level)
    const path = makePath([...head, [0, 0, -282], [8, -4, -310], [17, -12, -340], [7, -20.5, -372], [0, FIN.y, -402], [0, FIN.y, -432], [0, FIN.y, COL.z1]]);
    // (the lattice was laid out round the straight run that used to end the flight: its draws are still tested against that line,
    //  so every cell before the court is where it was; what the court and the new line need clear is taken out afterwards)
    await ctx.yield();
    const latPath = makePath([...head, [0, 0, -330], [0, 0, -400], [0, 0, -470]]);
    await ctx.yield();
    const duration = 46, pv = new THREE.Vector3(), camP = new THREE.Vector3();
    const uAtZ = (z) => { for (let i = 0; i <= 400; i++) if (path.pointAt(i / 400, pv).z <= z) return i / 400; return 1; };
    hero.setWindow(uAtZ(105), uAtZ(-95));
    await ctx.yield();

    // ---------------------------------------------------------------- one-off architecture, galleries, water
    const water = makeWaterAcc(), out = { segs: [], hangs: [], glows: [], fish: [], bells: [], banners: [], pale: [] };
    const sideA = rng.sign(), sideC = rng.sign();
    const spouts = [
      // zone A: falls down, 58 m into a basin that hangs beside the grand stair (H0: the fall was 90 m; the lattice was drawn round that)
      { set: 'A', H: 58, H0: 90, M: new THREE.Matrix4().makeTranslation(sideA * 47, 36, 372) },
      { set: 'A', H: 62, M: new THREE.Matrix4().makeTranslation(-98, 36 * sideA, 152).multiply(RZ(Math.PI / 2)) },                    // zone B: falls sideways (+X)
      // zone C: falls along -Z, level beside the path, onto the near side of the court's ball of water (M0 / H0: where it stood before the court; the lattice was drawn round that)
      // (its sheet stands on edge, facing the path, and leaves an aqueduct that arrives from the left: frame x = +Y, y = +Z, z = +X)
      { set: 'C', H: FIN.fallH, launch: FIN.launch, M: frame([0, 1, 0], [0, 0, 1], FIN.sph[0] - FIN.launch * Math.sqrt(2 * FIN.fallH / 9.81), FIN.sph[1], FIN.sph[2] + 12.5 * FIN.sphS + FIN.fallH),
        H0: 95, M0: new THREE.Matrix4().makeTranslation(sideC * 36, 8, -296).multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2)) },
    ];
    // everything added in the polish pass draws from `xr`, so the world's own sequence of draws is untouched
    const xr = makeRng(hashSeed(ctx.seed + ':polish'));
    const yld = () => ctx.yield();
    const sets = await buildSets(pal, rng.fork('sets'), style, water, out, spouts, yld, makeRng(hashSeed(ctx.seed + ':polish2')), ctx.seed);
    const allGeos = [sets.geoA, sets.geoC, sets.geoD, sets.geoP];
    // the court's stone takes less of the haze on the faces turned from the suns (they fall to plum) and more warm bounce from below
    // (polish 5) and it takes the light of the portal: one warm point light just inside the gate, which comes up with the dusk
    const gateL = { pos: { value: new THREE.Vector3(0, FIN.y, FIN.zG + 9) }, col: { value: new THREE.Color(0, 0, 0) }, par: { value: new THREE.Vector2(70, 0) } }, gateC = new THREE.Color(0.95, 0.54, 0.25);
    const finMat = makeStoneMaterial({ ...U, shade: { value: new THREE.Vector2(0.5, 0.34) }, bounce: { value: new THREE.Vector3(0.22, 0.16, 0.2) } }, pal[4], pal[3], { point: gateL });
    const meshA = new THREE.Mesh(sets.geoA, kit.stoneMaterial), meshC = new THREE.Mesh(sets.geoC, kit.stoneMaterial), meshD = new THREE.Mesh(sets.geoD, finMat); meshA.name = 'stairs'; meshC.name = 'bridge'; meshD.name = 'court';
    const meshP = new THREE.Mesh(sets.geoP, kit.stoneMaterial); meshP.name = 'plaza';
    scene.add(meshA, meshC, meshD, meshP);
    await ctx.yield();
    // inside an arcade the bright floor throws light back at the walls: the galleries' own stone takes more fill than the rest,
    // so the wall turned away from the suns is deep lilac and not a black mass
    const twistMat = makeStoneMaterial({ ...U, shade: { value: new THREE.Vector2(0.45, 1.36) }, bounce: { value: new THREE.Vector3(0.3, 0.22, 0.17) } }, pal[4], pal[3], { rest: true });
    const s1 = rng.sign(), s2 = rng.chance(0.5) ? s1 : -s1;
    const g1 = await buildGallery(G1, s1, pal, rng.fork('g1'), style, water, out, yld); await ctx.yield();
    // (polish 5) what this round adds to the cast goes into lists of its own, drawn in batches of their own with their own rng
    const mkOut = () => ({ segs: [], hangs: [], glows: out.glows, fish: [], bells: [], banners: [], pale: [] });
    const out2 = mkOut(), outOpen = mkOut(), outCourt = mkOut(), outAtr = mkOut();
    const g2 = await buildGallery(G2, s2, pal, rng.fork('g2'), style, water, out2, yld); await ctx.yield();
    allGeos.push(g1.geo, g2.geo);
    const c2 = await buildCourt2(pal, style, outCourt, yld, makeRng(hashSeed(ctx.seed + ':court2'))); await ctx.yield();
    const meshD2 = new THREE.Mesh(c2.geo, finMat); meshD2.name = 'court-2'; scene.add(meshD2); allGeos.push(c2.geo);
    // the Lantern Gallery's stone is lit by its own lanterns: four rows of them (two hanging from the roof, one standing on the
    // floor, one standing on the paved wall), one lamp a bay, in the gallery's untwisted space. Their strength does not change.
    const lampDay = new THREE.Color(0.37, 0.21, 0.09);      // the lanterns keep their day colour through the dusk (the owner's limit: never a fourth key; they warm the stone near them)
    const g2Lamp = { pts: { value: [new THREE.Vector4(3.9, 5.4, 0, 1), new THREE.Vector4(-3.9, 5.4, 0, 1), new THREE.Vector4(s2 * 6.9, -6.0, 5.5, 0.8), new THREE.Vector4(-s2 * 6.9, -5.6, 5.5, 0.8)] },
      col: { value: lampDay.clone() }, par: { value: new THREE.Vector4(11, 2.9, 1, G2.len) } };      // (round 7: reach 3.7 -> 2.9 m: a wall away from a lamp keeps its lilac shadow)
    const twistMat2 = makeStoneMaterial({ ...U, shade: { value: new THREE.Vector2(0.45, 1.2) }, bounce: { value: new THREE.Vector3(0.24, 0.19, 0.2) } }, pal[4], pal[3], { rest: true, lamps: g2Lamp });
    const gm1 = new THREE.Mesh(g1.geo, twistMat), gm2 = new THREE.Mesh(g2.geo, twistMat2); gm1.name = 'twist-gallery-1'; gm2.name = 'twist-gallery-2'; scene.add(gm1, gm2);

    // ---------------------------------------------------------------- the lattice
    const mrng = rng.fork('modules'), mods = [];
    for (let v = 0; v < 3; v++) { const near = await buildModule(v, 1, pal, mrng, style, yld); await ctx.yield(); mods.push({ near, far: await buildModule(v, 0, pal, mrng, style, yld) }); await ctx.yield(); }
    for (const m of mods) { allGeos.push(m.near.geo, m.far.geo);
      const p = m.far.samplePos || m.far.geo.attributes.position.array, n = p.length / 3, step = Math.max(1, Math.floor(n / 56)); m.samples = [];
      for (let i = 0; i < n; i += step) m.samples.push(new THREE.Vector3(p[i * 3], p[i * 3 + 1], p[i * 3 + 2])); }
    const boxes = [[-21, -44, 298, 21, 9, 466], [-25, -11, 295, 25, 44, 305], [-12, -12, 186, 12, 12, 302], [-24, -15, 90, 24, -5, 191], [-117, -117, -117, 117, 117, 117],
      [-16, -16, -476, 16, 16, -90], [-20, -20, -486, 20, 28, -466]];
    const bb = new THREE.Box3(), bc = new THREE.Vector3();
    // Cells that touch what the polish pass added (boxes2) are taken out after every draw has been made, so the lattice
    // keeps the draws and the look it had.
    const spoutBox = (M, H) => { bb.makeEmpty(); for (const sx of [-11, 11]) for (const sy of [-H - 6, 8]) for (const sz of [-36, 18]) bb.expandByPoint(bc.set(sx, sy, sz).applyMatrix4(M));
      return [bb.min.x, bb.min.y, bb.min.z, bb.max.x, bb.max.y, bb.max.z]; };
    for (const sp of spouts) boxes.push(spoutBox(sp.M0 || sp.M, sp.H0 || sp.H));
    const finBoxes = [[-70, -50, -470, 48, 26, -300], [-17, -16, -302, 17, 26, -262]];      // the court and its loggia
    const boxes2 = [];
    for (const G of [G1, G2]) for (const sx of [-1, 1]) boxes2.push([sx * 23 - 4, -84, G.z0 + 1, sx * 23 + 4, 34, G.z0 + 9]);      // the tower falls
    const hit = (p, list) => { for (const b of list) if (p.x > b[0] && p.x < b[3] && p.y > b[1] && p.y < b[4] && p.z > b[2] && p.z < b[5]) return true; return false; };
    const inBox = (p) => hit(p, boxes);
    const lrng = rng.fork('lattice'), voidP = clamp(lrng.range(0.55, 0.68) + (1 - density) * 0.3 + (1 - detail) * 0.35, 0.4, 0.9), NCH = 10;
    const buckets = new Map(), M4 = new THREE.Matrix4(), tp = new THREE.Vector3(), tint = new THREE.Color();
    // in the two darker hazes the far cells take a quarter of the haze's own hue, so they sit in the air and do not pepper it
    const farTint = mood.name === 'blue' || mood.name === 'dusk' ? hazeC.clone().multiplyScalar(1 / Math.max(hazeC.r, hazeC.g, hazeC.b, 1e-3)) : null;
    const zoneUp = (z) => (z > 130 ? [0, 1, 0] : z > -130 ? [-1, 0, 0] : [0, 0, 1]);
    const latMarks = [];      // (what became of each landmark copy: [x, y, z, metres from the course to its centre, to its nearest stone, scale, and its grid cell if it went back to true size])
    let nNear = 0, nFar = 0, guard = 0; const taken = new Set();      // (the cells that hold a module: no draw depends on it)
    for (let iz = -10; iz < 10; iz++) {
      for (let iy = -4; iy < 4; iy++) { for (let ix = -4; ix < 4; ix++) {
        const x = ix * CELL + 30, y = iy * CELL + 30, z = iz * CELL + 30;
        if (Math.max(Math.abs(x), Math.abs(y), Math.abs(z)) <= 90) continue;
        const lat = Math.hypot(x, y), ring1 = lat < 50;
        // keep clean haze behind the water sphere, both as seen from the entry (looking -Z) and from the orbit (looking -X at the peach sun)
        if (!ring1 && Math.abs(x) <= 150 && Math.abs(y) <= 150 && z < -90 && z > -420) continue;
        if (x < -120 && Math.abs(y) < 60 && Math.abs(z) < 60) continue;
        const nearHero = Math.max(Math.abs(x), Math.abs(y), Math.abs(z)) <= 150;
        if (lat > 270 || lrng() < (nearHero ? 0.8 : ring1 ? 0.12 : z < -90 && z > -420 ? Math.max(voidP, 0.85) : voidP)) continue;
        const v = lrng.int(0, 2), mod = mods[v], zu = zoneUp(z), tries = ring1 ? 12 : 3;
        let rot = null;
        for (let t = 0; t < tries && !rot; t++) {
          let r = lrng.pick(ROTS);
          if (lrng.chance(0.7)) { for (let k = 0; k < 30 && (r.up[0] !== zu[0] || r.up[1] !== zu[1] || r.up[2] !== zu[2]); k++) r = lrng.pick(ROTS); }
          let ok = true;
          for (const s of mod.samples) { tp.copy(s).applyMatrix4(r.m); tp.x += x; tp.y += y; tp.z += z;
            if (inBox(tp) || (lat < 100 && latPath.distanceTo(tp.x, tp.y, tp.z) < 20)) { ok = false; break; } }
          if (ok) rot = r;
        }
        if (!rot) continue;
        // (polish 5) round the court a pavilion cell whose up-axis lies along the flight is seen dome-on, as a blob: it is turned to one
        // whose up-axis is across the flight. A hash picks the turn after the cell's own draws, with the same test of its samples.
        if (v === 1 && z < -240 && rot.up[2] !== 0) { const hr = makeRng(hashSeed(ctx.seed + ':side:' + ix + ':' + iy + ':' + iz));
          for (let t = 0; t < 16; t++) { const r = ROTS[Math.min(ROTS.length - 1, Math.floor(hr() * ROTS.length))]; if (r.up[2] !== 0) continue;
            let ok = true;
            for (const s of mod.samples) { tp.copy(s).applyMatrix4(r.m); tp.x += x; tp.y += y; tp.z += z;
              if (inBox(tp) || (lat < 100 && latPath.distanceTo(tp.x, tp.y, tp.z) < 20)) { ok = false; break; } }
            if (ok) { rot = r; break; } } }
        const lod = ring1 || (z < -420 && z > -540 && lat < 200) ? 'near' : 'far', ch = clamp(Math.floor((z + 600) / (1200 / NCH)), 0, NCH - 1), key = v + lod + ch;
        // (round the gate the cells are drawn from the detailed geometry: the court looks straight at them. No draw depends on it.)
        if (!buckets.has(key)) buckets.set(key, { geo: mod[lod].geo, list: [], ch });
        M4.copy(rot.m).setPosition(x, y, z);
        const w = lrng.range(-1, 1), g = lrng.range(0.86, 1.06);
        tint.setRGB(g * (1 + 0.035 * w), g, g * (1 - 0.05 * w));
        if (!ring1 && farTint) tint.lerp(farTint, 0.25);
        // the upper cells round the colonnade stand straight behind the sphere as seen from the atrium, where they read as
        // debris: about half of them go. A hash decides, after every draw has been made, so the rest of the lattice is unchanged.
        let drop = ring1 && y > 0 && z < -150 && z > -420 && makeRng(hashSeed(ctx.seed + ':thin:' + ix + ':' + iy + ':' + iz))() < 0.6;
        // also out: a cell beside and below the upper half of the grand stair that comes within 32 m of the camera line (a
        // huge dark arch cut by the edge of the frame on the way up), and whatever touches the tower falls
        const lowNear = ring1 && y < 0 && z > 300 && z < 420;
        if (!drop && (lowNear || (z > 240 && z < 360) || (z < -90 && z > -210))) for (const sm of mod.samples) { tp.copy(sm).applyMatrix4(M4);
          if (hit(tp, boxes2) || (lowNear && path.distanceTo(tp.x, tp.y, tp.z) < 32)) { drop = true; break; } }
        // whatever stands in the court or within 24 m of the line through it; and, over the floor of pools, a near cell within 32 m of
        // the line (it stood as a dark slab cut by the edge of the frame on the way out of the first gallery)
        const overPools = ring1 && z > 90 && z < 210;
        if (!drop && ((z < -240 && z > -530) || overPools)) for (const sm of mod.samples) { tp.copy(sm).applyMatrix4(M4);
          if (overPools ? path.distanceTo(tp.x, tp.y, tp.z) < 32 : (hit(tp, finBoxes) || path.distanceTo(tp.x, tp.y, tp.z) < 24)) { drop = true; break; } }
        // and whatever touches the third terrace of the drain (the only cells that can: x = -150, z = -90)
        if (!drop && x === -150 && z === -90 && Math.abs(y) < 60) for (const sm of mod.samples) { tp.copy(sm).applyMatrix4(M4);
          if (tp.x > -130 && tp.y > -19 && tp.y < 19 && tp.z < -96 && tp.z > -122) { drop = true; break; } }
        if (!drop) { buckets.get(key).list.push({ m: M4.clone(), c: tint.clone() }); taken.add(x + ':' + y + ':' + z); }
        if (ring1) { if (!drop) nNear++;
          if (!drop) for (const l of mod.near.lanterns) { tp.set(l[0], l[1], l[2]).applyMatrix4(M4); out.glows.push([tp.x, tp.y, tp.z, l[3]]); }
          const up = new THREE.Vector3(rot.up[0], rot.up[1], rot.up[2]);
          for (const wk of mod.near.walks) if (lrng.chance(0.75)) { const nW = lrng.int(1, 2); if (!drop) out.segs.push({ a: new THREE.Vector3(...wk[0]).applyMatrix4(M4), b: new THREE.Vector3(...wk[1]).applyMatrix4(M4), up, n: nW }); }
        } else nFar++;
      }
      await ctx.yield(); }      // (a row of cells at a time: no draw of lrng happens anywhere else)
      ++guard; await ctx.yield();
    }
    // the deliberate silhouettes in the haze behind the sphere: one long aqueduct line low across the view, two domed pavilions
    { const put = (v, m, x, y, z, lod = 'far', far = 0) => { const ch = clamp(Math.floor((z + 600) / (1200 / NCH)), 0, NCH - 1), key = v + lod + ch + (far ? 'L' : '');
        if (!buckets.has(key)) buckets.set(key, { geo: mods[v][lod].geo, list: [], ch, far });
        const c = new THREE.Color(0.96, 0.96, 0.98); if (farTint) c.lerp(farTint, 0.25);
        buckets.get(key).list.push({ m: m.clone().setPosition(x, y, z), c }); nFar++; };
      const across = frame([0, 0, -1], [0, 1, 0]), upright = new THREE.Matrix4();
      for (let i = -3; i <= 3; i++) put(2, across, i * 60, -100, -292);
      // (round 7: these two are 150 m and more from the course at their nearest, in the haze: the silhouette version pays for
      //  what this round adds to the atrium and the opening)
      put(1, upright, -152, -34, -268); put(1, frame([1, 0, 0], [0, 0, 1]), 158, 44, -330);
      // (polish 5) beyond the gate, the same architecture in three layers of haze.
      // (round 7, the owner's ruling) The stair's step is this world's ruler: an enlarged copy may stand only as a far silhouette,
      // every stone of it 400 m or more from every point of the course. Any other is built at true size (scale 1) in the nearest free
      // cell of the lattice's own 60 m grid, with the lattice's own tests and its own rule for the detailed version.
      const big = (v, m, sc, x, y, z, homeX) => {      // (homeX: the grid column a span of a line goes back to, so the line stays whole)
        // enlarged only as a far silhouette: every stone of it 400 m and more from every point of the course, and no true-size module
        // within 200 m of its centre (no figure walks out there). Whatever fails either measure stands at true size on the grid.
        const dC = path.distanceTo(x, y, z); let dS = dC;
        for (const sm of mods[v].samples) { tp.copy(sm).multiplyScalar(sc).applyMatrix4(m); dS = Math.min(dS, path.distanceTo(tp.x + x, tp.y + y, tp.z + z)); }
        let lone = true; for (const key of taken) { const q = key.split(':'); if (Math.hypot(q[0] - x, q[1] - y, q[2] - z) < 200) { lone = false; break; } }
        if (lone && dS >= 400) { put(v, m.clone().scale(new THREE.Vector3(sc, sc, sc)), x, y, z, 'far', 270); latMarks.push([x, y, z, Math.round(dC), Math.round(dS), sc]); return; }
        const g = (a) => Math.round((a - 30) / CELL) * CELL + 30, gx = homeX === undefined ? g(x) : homeX, gy = g(y); let gz = g(z), ok = false;
        for (let t = 0; t < 6 && !ok; t++) { ok = !taken.has(gx + ':' + gy + ':' + gz);
          if (ok) for (const sm of mods[v].samples) { tp.copy(sm).applyMatrix4(m); tp.x += gx; tp.y += gy; tp.z += gz;
            if (hit(tp, finBoxes) || inBox(tp) || path.distanceTo(tp.x, tp.y, tp.z) < 24) { ok = false; break; } }
          if (!ok) gz -= CELL; }
        latMarks.push([x, y, z, Math.round(dC), Math.round(dS), ok ? 1 : 0, gx, gy, gz]);
        if (!ok) return;      // (no free cell of the grid within six of its place: it is not built)
        taken.add(gx + ':' + gy + ':' + gz);
        put(v, m, gx, gy, gz, gz < -420 && gz > -540 && Math.hypot(gx, gy) < 200 ? 'near' : 'far', 270); };
      big(1, upright, 1.5, -92, -66, -548); big(1, frame([0, 1, 0], [-1, 0, 0]), 1.4, 104, 6, -532);
      big(1, frame([1, 0, 0], [0, 0, 1]), 2.3, -150, 58, -655); big(1, upright, 2.4, 172, -84, -690);
      for (let i = -2; i <= 2; i++) big(2, across, 1.8, i * 108, -128, -760, i * CELL + 30);
      big(1, upright, 3.4, 30, 96, -860); }
    // (the cells' undersides, turned from every sun, take a little more of the haze and of the light thrown up from below)
    const instMat = makeStoneMaterial({ ...U, shade: { value: new THREE.Vector2(0.48, 1.2) }, bounce: { value: new THREE.Vector3(0.3, 0.22, 0.2) } }, pal[4], pal[3]);
    const cull = [{ o: meshA, z0: 90, z1: 466 }, { o: meshC, z0: -264, z1: -90 }, { o: meshD, z0: -468, z1: -262 }, { o: meshP, z0: -264, z1: -150, far: 145 }, { o: gm1, z0: 186, z1: 306 }, { o: gm2, z0: -264, z1: -144 }, { o: meshD2, z0: -468, z1: -262, far: 108 }], fogLimit = 1.9 / fogDensity;
    const lattice = new THREE.Group(); lattice.name = 'lattice'; scene.add(lattice);
    for (const b of buckets.values()) {
      if (!b.list.length) continue;
      const im = new THREE.InstancedMesh(b.geo, instMat, b.list.length);
      b.list.forEach((e, i) => { im.setMatrixAt(i, e.m); im.setColorAt(i, e.c); });
      im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true; im.computeBoundingSphere(); lattice.add(im);
      cull.push({ o: im, z0: -600 + b.ch * (1200 / NCH) - 40, z1: -600 + (b.ch + 1) * (1200 / NCH) + 40, far: b.far || 0 });
      await ctx.yield();
    }
    await ctx.yield();

    // water of the rills, pools and spout channels (the hero's water shader)
    const waterMesh = new THREE.Mesh(water.geometry(), kit.waterMaterial); waterMesh.name = 'rills'; waterMesh.renderOrder = 3; scene.add(waterMesh);
    await ctx.yield();

    // ---------------------------------------------------------------- lantern-bearers, hanging lanterns
    const frng = rng.fork('figures'), tv = new THREE.Vector3();
    for (const w of hero.anchors.walkways) { const d = tv.copy(w.b).sub(w.a).normalize(), sd = new THREE.Vector3().crossVectors(w.up, d);
      for (const s of [-1, 1]) if (frng.chance(0.8)) { const o = s * frng.range(1.2, 4.6);
        out.segs.push({ a: w.a.clone().add(off).addScaledVector(sd, o), b: w.b.clone().add(off).addScaledVector(sd, o), up: w.up, n: frng.int(2, 3) }); } }
    for (const zb of [84, -84]) out.segs.push({ a: new THREE.Vector3(-4.4, -10, zb - 4), b: new THREE.Vector3(6.5, -10, zb + 5), up: new THREE.Vector3(0, 1, 0), n: 2 }, { a: new THREE.Vector3(6, -10, zb - 6), b: new THREE.Vector3(-6, -10, zb + 6), up: new THREE.Vector3(0, 1, 0), n: 1 });
    // three batches (before, inside and after the atrium) so the tiny figures are only drawn within about 420 m
    const figures = { walkers: 0, hangers: 0, fish: 0, bells: 0 }, crowd = density * (0.55 + 0.45 * detail), figAmb = [];
    const zoneOf = (o) => { const z = o.p ? o.p.z : (o.a.z + o.b.z) / 2; return z > 112 ? 0 : z > -112 ? 1 : 2; };
    for (const [zi, zr] of [[112, 470], [-112, 112], [-476, -112]].entries()) { const pick = (l) => l.filter((o) => zoneOf(o) === zi);
      // (polish 5: the first batch's far part is the opening, the last batch's is the loggia and the court. From the atrium both are
      //  300 m and more away behind a gallery front: they are drawn up to the first gallery, and from inside the second one on.)
      const f = makeFigures(U, pal, pick(out.segs), pick(out.hangs), frng, mood.lamp, pick(out.fish), pick(out.bells), crowd, zi === 0 ? (z) => (z > 290 ? 1 : 0) : zi === 2 ? (z) => (z < -264 ? 1 : 0) : null);
      scene.add(f.object); cull.push({ o: f.object, z0: zr[0], z1: zr[1], far: 420 }); figAmb.push(f.amb);
      if (zi === 0) cull.push({ o: f.parts[1], z0: 290, z1: 470, far: 420, back: 60 }); else if (zi === 2) cull.push({ o: f.parts[1], z0: -476, z1: -264, far: 110 });
      for (const k in figures) figures[k] += f[k];
      await ctx.yield(); }
    await ctx.yield();
    // (polish 5) the processions. On the grand stair two files climb the runner on one side and come down it on the other; a third
    // walks the underside of the flight overhead; one walks the inverted stair under the Triple Fall's cascade, and bearers stroll
    // round the well under the sphere. Each batch is drawn only from near its own stretch.
    { const V3 = (x, y, z) => new THREE.Vector3(x, y, z), UPY = V3(0, 1, 0), DNY = V3(0, -1, 0);
      outOpen.segs.push({ a: V3(0, -38, 444.5), b: V3(0, -8, 324.5), up: UPY, n: 24, keep: 1, file: { sp: 1.3, lane: 1.25 } },
        { a: V3(0, -38, 444.5), b: V3(0, -8, 324.5), up: UPY, n: 18, keep: 1, file: { sp: 1.1, lane: 2.5, ph: 0.4 } },
        { a: V3(0, 5.5, 360.5), b: V3(0, -14.5, 439.5), up: DNY, n: 16, keep: 1, file: { sp: 1.2, lane: 1.5 } },
        { a: V3(0, 5.5, 307), b: V3(0, 5.5, 358), up: DNY, n: 6, keep: 1, file: { sp: 1.2, lane: 1.5, ph: 0.3 } },
        { a: V3(-11, -38, 447), b: V3(11, -38, 447), up: UPY, n: 2, keep: 1 }, { a: V3(11, -38, 458.5), b: V3(-11, -38, 458.5), up: UPY, n: 2, keep: 1 });
      const sf = hero.anchors.soffitStair, wl = hero.anchors.well;
      if (sf) outAtr.segs.push({ a: sf.a.clone().add(off), b: sf.b.clone().add(off), up: sf.up, n: 12, keep: 1, file: { sp: 1.2, lane: 1.4 } });
      if (wl) { const c = wl.center.clone().add(off), q = (wl.half + wl.radius) / 2 + 0.3;
        for (const [ax, az, bx, bz] of [[-q, q, q, q], [q, -q, -q, -q], [q, q - 1, q, -q + 1], [-q, -q + 1, -q, q - 1]]) outAtr.segs.push({ a: V3(c.x + ax * 0.82, c.y, c.z + az), b: V3(c.x + bx * 0.82, c.y, c.z + bz), up: UPY, n: 1, keep: 1 }); } }
      // (round 7) two bearers on the balcony at the foot of the cascade's arcade (pushed last: every earlier draw is what it was)
      { const ab = hero.anchors.arcadeBalcony; if (ab) outAtr.segs.push({ a: ab.a.clone().add(off), b: ab.b.clone().add(off), up: ab.up, n: 2, keep: 1 }); }
    const frng5 = makeRng(hashSeed(ctx.seed + ':figures5')), duskAmb = [], figs5 = {};
    // (back: how far past a batch the camera may be before it is no longer drawn. The atrium looks back, but not into the first gallery's
    //  far side: the opening's processions are let go once the camera is inside that gallery.)
    for (const [nm, l, z0, z1, far, dusk, bk] of [['open', outOpen, 300, 470, 300, 0, 30], ['g2', out2, -264, -144, 80, 1, 0], ['court', outCourt, -468, -262, 108, 1, 0], ['atr', outAtr, -112, 112, 130, 0, 0]]) {
      if (!l.segs.length && !l.hangs.length && !l.fish.length) continue;
      const f = makeFigures(U, pal, l.segs, l.hangs, frng5, mood.lamp, l.fish, l.bells, crowd);
      scene.add(f.object); cull.push({ o: f.object, z0, z1, far, back: bk }); figs5[nm] = f; if (dusk) duskAmb.push({ c: f.amb, d: f.amb.clone() });
      for (const k in figures) figures[k] += f[k];
      await ctx.yield(); }

    // ---------------------------------------------------------------- banners: in the loggia over each gallery front, and in
    // the arcades of the atrium's twelve edge galleries, where each hangs along its own gallery's "down"
    { const list = [], cA = pal[6].clone().lerp(new THREE.Color('#ffa24e'), 0.45).multiplyScalar(0.6), cB = pal[6].clone().lerp(pal[4], 0.6).multiplyScalar(0.95), hemC = pal[0].clone().multiplyScalar(0.72);
      const bR = new THREE.Vector3(1, 0, 0), bD = new THREE.Vector3(0, -1, 0);
      for (let i = 0; i < 5; i++) list.push({ p: new THREE.Vector3(-18.4 + i * 9.2, 26.75, G1.z0 + 1.6), right: bR, down: bD, w: 2.5, len: i % 2 ? 7.6 : 9.2, c: i % 2 ? cB : cA, hem: hemC, ph: xr.range(0, 6.283) });
      // (the Lantern Gallery's front: one in each of its five upper arches)
      for (let i = 0; i < 5; i++) { const wing = i === 0 || i === 4;
        list.push({ p: new THREE.Vector3([-17.4, -7.6, 0, 7.6, 17.4][i], wing ? 20.0 : 22.4, G2.z0 + 1.6), right: bR, down: bD, w: wing ? 2.6 : 2.3, len: wing ? 4.6 : 6.4, c: i % 2 ? cB : cA, hem: hemC, ph: xr.range(0, 6.283) }); }
      for (const w of hero.anchors.walkways) { const a = w.a.clone().add(off), b = w.b.clone().add(off), e = b.clone().sub(a).normalize(), zax = new THREE.Vector3().crossVectors(e, w.up), dn = w.up.clone().negate();
        const c = a.add(b).multiplyScalar(0.5).addScaledVector(w.up, -14);
        for (const sb of [-1, 1]) for (const sz of [-1, 1]) { const len = xr.range(5.4, 7.4), ph = xr.range(0, 6.283), tone = xr.chance(0.5);
          if (xr.chance(0.25)) continue;
          list.push({ p: c.clone().addScaledVector(e, sb * 26.25).addScaledVector(w.up, 10.6).addScaledVector(zax, sz * 4.7), right: e, down: dn, w: 2.8, len, c: tone ? cA : cB, hem: hemC, ph }); } }
      const cP = pal[0].clone().lerp(pal[1], 0.3).multiplyScalar(0.8), hemP = pal[1].clone().lerp(pal[0], 0.35).multiplyScalar(0.95);      // (round 7) cloth in the pale stone's own tones
      for (const b of out.banners) list.push({ p: b.p, right: b.right, down: b.down, w: b.w, len: b.len, c: b.pale ? cP : b.t ? cA : cB, hem: b.pale ? hemP : hemC, ph: b.p.x * 1.7 + b.p.z * 0.9 });      // the side pavilion's, the first gallery's
      scene.add(makeBanners(U, pal, list)); }
    await ctx.yield();

    // ---------------------------------------------------------------- kit: lantern glows, dust, sunbeams, waterfalls, birds, goldfish
    const fxTime = { value: 0 }, set = fx.fxGroup(); scene.add(set.object);
    const lampC = pal[6].clone().lerp(pal[0], 0.25);
    if (out.glows.length) set.add(fx.makeGlows({ rng: rng.fork('glows'), time: fxTime, positions: out.glows.map((g) => [g[0], g[1], g[2]]), sizes: out.glows.map((g) => 0.6 + g[3]),
      color: lampC, size: 2.0, intensity: 0.6 * mood.lamp, flicker: 0.25 }));
    await ctx.yield();
    const dust = set.add(fx.makeParticles({ rng: rng.fork('dust'), preset: 'dust', time: fxTime, count: Math.round(rng.range(2000, 3200) * detail), box: [70, 46, 70],
      colors: [PALETTE[0], '#ffd2a8', '#cfc8ff'], size: [0.05, 0.16], intensity: 1.3 }));
    await ctx.yield();
    const rays = [
      { position: [-sideA * 14, 78, 392], direction: [-0.1, -1, -0.12], radius: 34, count: 12, length: 150, width: [3, 10], color: mood.suns[0], intensity: 0.2 },
      { position: [-118, 16, 8], direction: [1, -0.14, -0.1], radius: 46, count: 16, length: 200, width: [3, 11], color: mood.suns[1], intensity: 0.24 },
      { position: [-128, 12, -92], direction: [1, -0.14, -0.1], radius: 38, count: 12, length: 180, width: [3, 10], color: mood.suns[1], intensity: 0.3, speed: 1.6 },
      // the court: the low sun behind the gate streams round it and through it, and the gold key slants in from the open left side
      { position: [3, FIN.y + 6, -466], direction: [-0.07, -0.11, 1], radius: 20, count: 12, length: 170, width: [1.6, 7], color: '#ffa878', intensity: 0.4, air: 1 },
      { position: [-78, -4, -398], direction: [1, -0.14, -0.1], radius: 36, count: 14, length: 150, width: [3, 10], color: '#ffd08a', intensity: 0.2, air: 1 },
    ];
    for (const r of rays) { set.add(fx.makeGodRays({ rng: r.air && r.position[0] < -50 ? xr.fork('rays') : rng.fork('rays'), time: fxTime, ...r, intensity: r.intensity * (r.air || (mood.air ?? 1)) })); await ctx.yield(); }      // paler air, fainter beams
    await ctx.yield();
    // the kit falls: the three zone spouts, plus the Triple Fall's drain, which leaves the foot of the cascade stair and
    // pours away along -Z (its own "down"), a long level stream across the view as the camera leaves the orbit
    // (zone C's fall and the drain are now streams of the hero's own water, built with the sets: of their kit falls only the mist is shown)
    const falls = [], drain = { H: DRAIN.H, W: DRAIN.W, D: DRAIN.D, own: 1, M: frame([0, -1, 0], [0, 0, 1], DRAIN.x, 0, DRAIN.z) };
    for (const sp of [...spouts, drain]) {
      const wf = W.makeWaterfall({ rng: rng.fork('fall'), top: [0, 0, 0], height: sp.H, width: sp.W || 8.4, density: sp.D || 0.5, dir: [0, 0, 1], launch: sp.launch || 3.2, pool: false, rainbow: 0, mistCount: 150, mistOpacity: 0.1,
        light: 'noon', sunDir: sunDirs[0], sunColor: mood.suns[0], sunIntensity: 2.2, zenith: mood.haze, mid: mood.haze, horizon: mood.haze, fogColor: mood.haze, clouds: false,
        tint: '#1f7f8f', color: '#eef8fb', mistColor: '#e6ecfa' });
      wf.sheets.visible = false;      // (every fall is now a stream of the hero's own water; the kit gives the mist at its foot)
      const g = new THREE.Group(); g.applyMatrix4(sp.M); g.add(wf.object); scene.add(g); falls.push(wf);
      await ctx.yield();
    }
    const faunaLight = { sunDir: sunDirs[0], sunColor: mood.suns[0], sunIntensity: 2.4, sky: '#cfd0f2', skyIntensity: 1.2, ground: '#a493c4', groundIntensity: 0.9 };
    const white = { body: '#ffffff', belly: '#ffffff', head: '#ffffff', wingC: '#f0edf7', trail: '#e2ddf0', tip: '#b6b0d0', beak: '#ff9a5a' };
    const critters = [];
    critters.push(F.makeFlock({ rng: rng.fork('b0'), species: 'gulls', count: rng.int(14, 26), light: faunaLight, ...white, duration,
      cross: { path, u: 0.1, lead: 62, span: 420, angle: rng.range(40, 60), side: rng.sign(), height: 12, rise: 30, duration } }));
    await ctx.yield();
    const uCol = uAtZ(COL.z0 + 10);
    critters.push(F.makeFlock({ rng: rng.fork('b2'), species: 'gulls', count: rng.int(12, 20), light: { sunDir: sunDirs[1], sunColor: GOLD.suns[1], sunIntensity: 2.6, sky: '#f0c898', skyIntensity: 1.0, ground: '#6a4660', groundIntensity: 0.8 }, ...white, spread: [5, 2.6, 22],
      along: { path, side: 0, up: 4.2, lead: 52, from: uCol - 0.06, to: 1.1, drift: 6 } }));
    for (const c of critters) scene.add(c.object);
    await ctx.yield();
    // a small flight down the axis of the second gallery, ahead of the camera
    critters.push(F.makeFlock({ rng: rng.fork('b5'), species: 'gulls', count: 10, light: faunaLight, ...white, size: 0.8, spread: [2.6, 1.6, 12],
      along: { path, side: 0, up: 2, lead: 30, from: uAtZ(G2.z0 + 16), to: uAtZ(G2.z0 - G2.len - 6), drift: 5 } }));
    scene.add(critters[critters.length - 1].object);
    await ctx.yield();
    // the rare event (about one visit in eight): a pale leviathan swims through the haze high behind the water sphere while the
    // camera is in the atrium. It is keyed to u by its crossing route, and it is not built at all on an ordinary visit.
    if (rare) {
      const lev = F.makeWhale({ rng: rng.fork('leviathan'), length: 64, light: { ...faunaLight, sunIntensity: 1.5, skyIntensity: 0.9 }, caustics: 0, top: '#f2b79a', belly: '#fff1e2', speed: 12,
        cross: { path, u: uAtZ(36), lead: 0, span: 420, angle: 90, side: sideC, height: 0, window: 0.2 } });
      // crossPoints starts from the camera line: lift the whole route to its place behind and above the sphere
      path.pointAt(uAtZ(36), pv); lev.object.position.set(-pv.x, 78 - pv.y, -235 - pv.z);
      critters.push(lev); scene.add(lev.object);
      await ctx.yield();
    }
    // the atrium flock circles the sphere while its "up" swings from one gravity to another
    const pivot = new THREE.Group(); scene.add(pivot);
    const orbit = F.makeFlock({ rng: rng.fork('b1'), species: 'gulls', count: Math.round(rng.int(30, 44) * density), light: faunaLight, ...white, center: [0, 0, 0], radius: 36, height: 3, wobble: 0.12, spread: [10, 5, 20], speed: 13 });
    orbit.object.frustumCulled = false; pivot.add(orbit.object);
    await ctx.yield();
    const qA = new THREE.Quaternion(), qB = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), rng.sign() * Math.PI / 2), uIn = uAtZ(95), uOut = uAtZ(-60);
    // (polish 5) a flock wheels in the gap between the grand stair and the flight overhead, on the side away from the fall; its
    // plane turns a quarter (level loop to upright wheel) while the camera climbs the stair: the same turn the atrium's flock makes
    const pv0 = new THREE.Group(); pv0.position.set(-sideA * 25, -14, 422); scene.add(pv0);
    const gapFlock = F.makeFlock({ rng: makeRng(hashSeed(ctx.seed + ':gap-flock')), species: 'gulls', count: 26, light: faunaLight, ...white, size: 2.0, center: [0, 0, 0], radius: 16, height: 2.5, wobble: 0.1, spread: [3.5, 2.2, 12], speed: 12 });
    gapFlock.object.frustumCulled = false; pv0.add(gapFlock.object);
    const qG = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -sideA * Math.PI / 2), uGf0 = uAtZ(462), uGf1 = uAtZ(380);
    await ctx.yield();
    // a second flock on a steeply tilted loop over the floor of pools
    const tp2 = new THREE.Group(); tp2.position.set(-10 * sideA, 26, 160); tp2.rotation.z = 1.15 * sideA; scene.add(tp2);
    const tilted = F.makeFlock({ rng: rng.fork('b3'), species: 'gulls', count: rng.int(14, 22), light: faunaLight, ...white, center: [0, 0, 0], radius: 34, height: 3, spread: [6, 3, 14], speed: 11 });
    tilted.object.frustumCulled = false; tp2.add(tilted.object);
    await ctx.yield();
    // and a third wheeling round the dome of the side pavilion, where the view pans away from the sphere toward the second gallery
    const exitFlock = F.makeFlock({ rng: rng.fork('b4'), species: 'gulls', count: Math.round(rng.int(26, 38) * density), light: faunaLight, ...white, size: 1.5, center: [PAV[0], PAV[1] + 23, PAV[2]], radius: 17, height: 4, spread: [5, 3, 12], speed: 10 });      // round the side pavilion's dome
    critters.push(exitFlock); scene.add(exitFlock.object);
    await ctx.yield();
    const koi = [];
    for (const z of [143.15, 173.15]) for (const x of [-14.6, 0, 14.6]) { const k = F.makeFishSchool({ rng: rng.fork('koi'), species: 'koi', count: x ? rng.int(10, 14) : rng.int(18, 26), center: [x, -10.45, z], spread: [3.9, 0.12], size: 3.6, lod: 'mid', light: faunaLight });
      scene.add(k.object); koi.push(k); await ctx.yield(); }
    await ctx.yield();

    // the court's ball of water: the hero's own sphere and goldfish again (same geometry, same materials, no new shader), at 0.6 of
    // the size, turned so that two of its ripple centres face the fall that feeds it (+Z) and the stream that leaves it (-Z)
    const ball2 = new THREE.Group(); ball2.name = 'court-ball'; ball2.position.set(FIN.sph[0], FIN.sph[1], FIN.sph[2]); ball2.rotation.x = Math.PI / 2; ball2.scale.setScalar(FIN.sphS);
    for (const src of [hero.sphere.back, hero.sphere.fish, hero.sphere.front]) { const m = new THREE.Mesh(src.geometry, src.material); m.renderOrder = src.renderOrder; m.frustumCulled = false; ball2.add(m); }
    scene.add(ball2); cull.push({ o: ball2, z0: -460, z1: -430, far: 250 });
    await ctx.yield();
    // (polish 5) the portal is the light of the court: a halo on the gate wall round the ring (none inside it: the way through
    // stays clear), and its light lying in long streaks down the runner, up the floor's flight and along the wall's and the ceiling's
    const haloU = { uGain: { value: 0 }, uTime: fxTime, uC: { value: new THREE.Color(1.0, 0.6, 0.3) } };
    { const P = [], A = [], v = new THREE.Vector3();
      const quad = (m, pts, kind) => { for (const i of [0, 1, 2, 0, 2, 3]) { const q = pts[i]; v.set(q[0], q[1], q[2]); if (m) v.applyMatrix4(m); P.push(v.x, v.y, v.z); A.push(q[3], q[4], kind); } };
      const n = 48, r0 = 7.35, r1 = 31, zr = FIN.zG + 3.5, pr = (a, r, t) => [r * Math.cos(a), FIN.y + r * Math.sin(a), zr, t, a];
      for (let i = 0; i < n; i++) { const a0 = i / n * 6.2832, a1 = (i + 1) / n * 6.2832; quad(null, [pr(a0, r0, 0), pr(a1, r0, 0), pr(a1, r1, 1), pr(a0, r1, 1)], 0); }
      const NS = 44, RISE = 28 / NS, LS = FIN.zF - (FIN.zG + 3), zs = LS - 26.5;
      for (let k = 0; k < 3; k++) { const M = new THREE.Matrix4().makeTranslation(0, FIN.y, 0).multiply(RZ(k * Math.PI / 2)).multiply(frame([-1, 0, 0], [0, 1, 0], 0, -14, FIN.zF));
        const st = (z) => (k ? 0.5 : 1) * Math.exp(-(LS - z) / 70);      // it fades with the distance from the gate
        const seg = (ya, za, yb, zb, w0, w1) => quad(M, [[-w0, ya, za, 0, st(za)], [w0, ya, za, 1, st(za)], [w1, yb, zb, 1, st(zb)], [-w1, yb, zb, 0, st(zb)]], 1);
        seg(0.12, zs, 0.12, 0, 3.4, 3.0);
        seg(RISE + 0.12, 0, (k ? -28 : 28) + RISE + 0.12, -2 * NS, 3.0, 2.4); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aA', new THREE.Float32BufferAttribute(A, 3)); g.computeBoundingSphere();
      const halo = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: haloU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
        vertexShader: /* glsl */`attribute vec3 aA; varying vec3 vA; void main(){ vA = aA; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: /* glsl */`uniform vec3 uC; uniform float uGain, uTime; varying vec3 vA;
          void main(){ float f;
            if (vA.z < 0.5) { float t = clamp(vA.x, 0.0, 1.0), ray = 0.74 + 0.26 * sin(vA.y * 11.0 + uTime * 0.25) * sin(vA.y * 5.0 - uTime * 0.17);
              float star = pow(abs(sin(vA.y * 9.0 + uTime * 0.11) * sin(vA.y * 4.0 - uTime * 0.07)), 1.5);      // long rays, not an even wash
              f = pow(max(1.0 - t, 1e-4), 3.0) * smoothstep(0.0, 0.035, t) * (0.2 * ray + 1.0 * star) * 0.9; }
            else { float c = clamp(1.0 - abs(vA.x * 2.0 - 1.0), 0.0, 1.0); f = c * c * clamp(vA.y, 0.0, 1.0) * 0.55; }
            gl_FragColor = vec4(uC * f * uGain, 1.0); }` }));
      halo.name = 'gate-halo'; halo.renderOrder = 4; scene.add(halo); allGeos.push(g); cull.push({ o: halo, z0: -468, z1: -262, far: 115 }); }
    await ctx.yield();
    const dome = makeSkyDome(U, hazeC, plumC, creamC); scene.add(dome);
    await ctx.yield();
    // The gaze. Approach and orbit: hold the water sphere in the middle of the frame, even glancing back at it on the way
    // out. Then the view pans (in world azimuth) from the sphere along the draining cascade round to the second gallery's mouth.
    const L = path.length, S0 = new THREE.Vector3(3, -1.5, 0), gCam = new THREE.Vector3(), gAhead = new THREE.Vector3(), gOut = new THREE.Vector3(), gS = new THREE.Vector3();
    const uG0 = uAtZ(192), uG1 = uAtZ(112), uOff = uAtZ(56), uA = uAtZ(-30), uB = uAtZ(-125), uC = uAtZ(-141), uBack0 = uAtZ(105);
    // the point the gaze holds: the sphere, moved up to 4 m toward the camera's right during the orbit, so the sphere sits a
    // little left of the middle of the frame with the sideways fall and its aqueduct on the right
    const aim = (u, out) => { path.pointAt(u, gCam); const dx = S0.x - gCam.x, dz = S0.z - gCam.z, l = Math.hypot(dx, dz) || 1, k = 4 * smoothstep(uG1, uOff, u);
      return out.set(S0.x - dz / l * k, S0.y, S0.z + dx / l * k); };
    const gaze = (time, u) => {
      path.posAtDist(u * L + 70, gAhead);
      if (u <= uA) return gOut.copy(gAhead).lerp(aim(u, gS), smoothstep(uG0, uG1, u));
      // leaving: the view swings (in world azimuth, by way of the draining cascade) from the sphere round to the way ahead
      const tl = clamp((u - uA) / (uB - uA), 0, 1), t = smoothstep(0.1, 1, tl);
      aim(u, gS); const dx = gS.x - gCam.x, dz = gS.z - gCam.z; let azS = Math.atan2(-dx, -dz); if (azS < 0) azS += Math.PI * 2;
      const az = azS * (1 - t), pt = (gS.y - gCam.y) / Math.max(Math.hypot(dx, dz), 1) * (1 - t);
      gOut.set(gCam.x - Math.sin(az) * 100, gCam.y + pt * 100, gCam.z - Math.cos(az) * 100);
      return gOut.lerp(gAhead, smoothstep(uB, uC, u));
    };
    const g1a = uAtZ(G1.z0 - 8), g1b = uAtZ(G1.z0 - G1.len + 8), g2a = uAtZ(G2.z0 - 8), g2b = uAtZ(G2.z0 - G2.len + 8), pA = uAtZ(98), pB = uAtZ(64), pC = uAtZ(-44), pD = uAtZ(-78);
    const pace = (u) => { const w = 0.025;
      let p = 1 + 0.3 * (smoothstep(g1a - w, g1a + w, u) - smoothstep(g1b - w, g1b + w, u)) + 0.3 * (smoothstep(g2a - w, g2a + w, u) - smoothstep(g2b - w, g2b + w, u));
      p -= 0.42 * (smoothstep(pA, pB, u) - smoothstep(pC, pD, u));
      return lerp(p, 1, smoothstep(0.86, 0.9, u)); };

    // the two keys the light moves between (see GOLD), and where along the path it moves: inside the second gallery
    const uGa = uAtZ(-172), uGb = uAtZ(-250), wHaze = kit.waterMaterial.uniforms.uHaze.value; let kgNow = 0;
    const day = { haze: hazeC.clone(), plum: plumC.clone(), pal3: pal[3].clone(), pal4: pal[4].clone(), wHaze: wHaze.clone(), fog: scene.fog.color.clone(), lc: lights.map((l) => l.color.clone()), lk: lights.map((l) => l.intensity),
      sc: U.sunC.value.map((c) => c.clone()), hk: hemi.intensity, hs: hemi.color.clone(), hg: hemi.groundColor.clone(), fa: figAmb[2].clone() };
    const gH = new THREE.Color(mood.name === 'peach' ? GOLD.hazePeach : GOLD.haze), gP = new THREE.Color(GOLD.plum);
    const gold = { haze: gH, plum: gP, fog: gH.clone().lerp(gP, 0.1).multiplyScalar(0.84), suns: GOLD.suns.map((c) => new THREE.Color(c)), sc: GOLD.suns.map((c, i) => new THREE.Color(c).multiplyScalar(GOLD.self[i])),
      hs: new THREE.Color('#c4b8f0'), hg: new THREE.Color('#4b3a78'), fa: gH.clone().multiplyScalar(0.42).add(new THREE.Color(0.05, 0.03, 0.05)) };

    return {
      scene, path, duration, pace,
      camera: { fov: 64, near: 0.3, far: 4000, lookAhead: 26, sway: 0.5, bank: 0.25 },
      pois: [
        { at: [0, -9, 400], from: 0.0, to: uAtZ(418), weight: 0.3 },
        { at: gaze, from: uG0 - 0.004, to: uC + 0.004, weight: 0.97, fade: 0.02 },
        // over the court: the gaze leans from the line of flight toward the gate and the ball of water beside it
        { at: [-9, FIN.y + 1, -452], from: uAtZ(-292), to: uAtZ(-392), weight: 0.6, fade: 0.2 },
      ],
      portal: { shape: 'circle', radius: 7, color: '#ffd9b4', glow: 0.85, revealDistance: 330 },
      post: { exposure: mood.exposure, bloom: { strength: 0.3, radius: 0.55, threshold: 1.0 },
        grade: { saturation: 1.16, contrast: 1.14, tint: '#fffaf2', shadowTint: '#1a1430', vignette: 0.3, grain: 0.02, aberration: 0 } },
      update(dt, time, camera, u) {
        hero.setProgress(u); hero.update(dt, time, camera);
        fxTime.value = time; set.update(dt, time, camera);
        camP.setFromMatrixPosition(camera.matrixWorld);       // the camera behind a portal has its matrix set directly
        dome.position.copy(camP);
        { const cz = camP.z, back = u > uBack0 && u < uC + 0.01 ? 260 : 14;      // only the atrium looks sideways and back
          for (const c of cull) c.o.visible = c.z0 - cz < (c.back || back) && cz - c.z1 < (c.far || fogLimit);
          orbit.object.visible = cz < 300 && cz > -260; tilted.object.visible = cz < 420 && cz > 60; gapFlock.object.visible = cz > 250; }
        pv0.quaternion.slerpQuaternions(qA, qG, smoothstep(uGf0, uGf1, u)); gapFlock.update(dt, time, camera, u);
        for (const c of critters) c.update(dt, time, camera, u);
        pivot.quaternion.slerpQuaternions(qA, qB, smoothstep(uIn, uOut, u));      // the flock's up-axis swings a full quarter turn across the atrium
        orbit.update(dt, time, camera, u); tilted.update(dt, time, camera, u);
        for (const k of koi) k.update(dt, time, camera, u);
        for (const f of falls) f.update(dt, time, camera);
        dust.setOpacity(0.55 + 0.45 * smoothstep(uCol - 0.2, uCol, u));
        // the day turns to gold on the way through the second gallery: colours and strengths only (uniform values)
        const kg = smoothstep(uGa, uGb, u);
        if (kg !== kgNow) { kgNow = kg;
          hazeC.copy(day.haze).lerp(gold.haze, kg); plumC.copy(day.plum).lerp(gold.plum, kg); pal[3].copy(day.pal3).lerp(gold.haze, kg); pal[4].copy(day.pal4).lerp(gold.plum, kg);
          wHaze.copy(day.wHaze).lerp(gold.haze, kg * 0.35); scene.fog.color.copy(day.fog).lerp(gold.fog, kg);
          for (let i = 0; i < 3; i++) { lights[i].color.copy(day.lc[i]).lerp(gold.suns[i], kg); lights[i].intensity = lerp(day.lk[i], GOLD.k[i], kg); U.sunC.value[i].copy(day.sc[i]).lerp(gold.sc[i], kg); }
          hemi.intensity = lerp(day.hk, mood.hemi * 0.9 * GOLD.hemi, kg); hemi.color.copy(day.hs).lerp(gold.hs, kg); hemi.groundColor.copy(day.hg).lerp(gold.hg, kg);
          figAmb[2].copy(day.fa).lerp(gold.fa, kg); for (const a of duskAmb) a.c.copy(a.d).lerp(gold.fa, kg);
          gateL.col.value.copy(gateC).multiplyScalar(kg); haloU.uGain.value = kg; }
      },
      dispose() { for (const g of allGeos) g.dispose(); twistMat.dispose(); twistMat2.dispose(); instMat.dispose(); finMat.dispose(); hero.dispose(); },
      stats: { tris: { hero: hero.stats.triangles, sets: sets.tris, court: sets.trisD, plaza: sets.trisP, galleries: g1.tris + g2.tris, modules: mods.map((m) => m.near.tris + '/' + m.far.tris).join(' ') }, rare, density, nNear, nFar, marks: latMarks, walkers: figures.walkers, hangers: figures.hangers, fish: figures.fish, bells: figures.bells, mood: mood.name, galleryTris: g1.tris + g2.tris, setTris: sets.tris },
    };
  },
};
