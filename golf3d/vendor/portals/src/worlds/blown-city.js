// THE BLOWN CITY. A lagoon city blown entirely from coloured glass, on a winter morning of high water and sea fog.
// We ride the amber glass bow of a water taxi: down a narrow side canal of looming colour, out onto the grand canal
// as the sun breaks and coloured shafts stand in the air, under the cobalt bridge and into the basin where a 95 m
// bell tower is still being blown, hot, on the end of a pipe. The exit is the hot ring spun open on the pontil.
//
// World frame (the brief's): +X east, +Z south, y = 0 the high-water surface, eye 1.9 m up. The side canal runs due
// south from the entry at (0, 0) to its mouth at z = 110; the grand canal bends from south-west back to south, then
// the path hooks 60 degrees to the right round the end of the right bank: the left quay stays close all the way, the
// tower stands off the right bow and swings behind the ring only on the last straight. The sun is east-south-east.
// Looks by seed / ctx.vary.hour: morning (default, pearl), dawn (rose fog, the beams arrive late, at the bridge), night
// (every palazzo a lantern), frost (clear air, fog only 3 m deep on the water, white mountains on the horizon).
// Cast by seed: lagoon (aquamarine and cobalt), ember (amber and ruby) or milk (milk glass and gold); carnival
// streamers; tower ruby, cobalt or emerald.
// Rare event (ctx.vary.rare): the long breath, a string of thirty clear bubbles let go by the belfry.
// The gaze: forward down the side canal; to the hot star at the burst, beside the harp of beams (fine strings of single-coloured
// light, each from one pane of the left bank's housefronts down to its own pool in mid-canal, along the sun's own vector, with
// clear air between them: the right bank, the bridge and the sky stand sharp);
// up to the crown of the cobalt arch as it sweeps over (hung lanterns, promenaders under parasols); then to the tower being
// blown, held from the bridge on. Garlands of blown glass (drops, bubbles, goblets, a chandelier) span the grand canal, a
// vaporetto passes the bow before the bridge, a barge of finished chandeliers lies off the left quay beyond it, and gondolas
// put out from the left and cross close ahead of the bow, one every 64 m of the fairway from the mouth to the last avenue;
// lantern floats and clusters of poles stand beside the fairway. Nothing is strung over the side canal. The opening of the exit is
// mirrored in the water under the ring (ctx.portalView), so ring, picture and reflection close into one shape at the waterline.
// Departures from the brief, kept on purpose: the sky is not a closed pearl lid ("no blue anywhere") but pearl at the water
// deepening to a soft blue-grey overhead with rose banks of cloud (LOOKS.*.zen): outside viewers preferred it; for the
// "Murano on white" reading move the morning zenith toward #a9bcc0. The bow and windscreen rim take the bottom eighth of the
// frame, not the bottom fifth. The sun stands 34 degrees up (30 at first light), not the brief's 13: at 13 every beam of the harp
// lay nearly level across the whole frame and veiled the city; the mood (a winter morning) is kept, the degree is not. The harp's
// strings land in pools to the left of the fairway: the bow no longer passes through a shaft every second.
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import * as F from '../kit/fauna.js';
import * as fx from '../kit/fx.js';
import { buildHero, makeGlassMaterial, makeGlassUniforms, CITY_GLSL } from '../parts/blown-city.js';

// KEEP PEARL MORNING (a ruling this world is under). true: the far canal stays pearl, with only the hot star orange, until the
// great bridge has passed; beyond it the fog ahead warms to orange and the road of orange glints comes up, eased over the whole
// stretch from the bridge to the basin. false: the sky and the water glow from the burst on, exactly as in round 14.
const PEARL_UNTIL_BRIDGE = true;

const TAU = Math.PI * 2;
const sat = (x) => Math.min(1, Math.max(0, x));
const sstep = (a, b, x) => { const t = sat((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a + (b - a) * t;
const hash1 = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const C3 = (h) => new THREE.Color(h);
const lin = (h) => { const c = new THREE.Color(h); return [c.r, c.g, c.b]; };

const PALETTE = ['#EDE7DC', '#8EC9B8', '#1E4FA8', '#C2183A', '#F2A62E', '#FF6A1A', '#7B4BB0'];
const GLASS = { aqua: '#2FB5A6', cobalt: '#1E4FA8', celadon: '#8EC9B8', amber: '#F2A62E', ruby: '#C2183A', amethyst: '#7B4BB0', milk: '#D8D2C8', rose: '#E27892', gold: '#E8B04A', green: '#1F7A4C' };
const EYE = 1.9, MOUTH_Z = 110, HOOK = Math.PI / 3, HX = -Math.sin(HOOK), HZ = Math.cos(HOOK);      // the last straight heads along (HX, HZ)
const RING = [-228.7, 450.6], TOWER = [RING[0] + 75 * HX, RING[1] + 75 * HZ];
const RH = (e, s) => [RING[0] + HX * e + HZ * s, RING[1] + HZ * e - HX * s];                         // e metres beyond the ring along the last straight, s to its left

// ---------- looks ----------
// el: how high the sun stands over the grand canal, in degrees; el0: how high it stands, still in the fog bank, while we are in
// the side canal (the design's 13). At 13 every shaft of the harp lay nearly level across the whole frame, over facades, bridge
// and sky; at 34 (30 at first light) each falls from its pane on the left housefronts to its own pool in mid-canal. The sun
// climbs from the one to the other over the last metres of the side canal, as it breaks (see update(): one sun for the glass,
// the houses' coloured shade, the sky and the water; the harp and the tower's own shaft are made for el).
const LOOKS = {
  morning: { title: 'The Blown City', el: 34, el0: 13, fog: '#EDE7DC', lagoon: '#8EC9B8', sun: '#fff0d2', sunGain: 1.15, warm: '#ffd09a', zen: '#739fb2', lit: '#fff0d4', shade: '#8f80b0', cover: 0.5, rake: 1, inner: 0.1, beam: 1, add: 0, late: 0, glow: 1.2, glowCol: '#ff8648',
    dens: [0.012, 0.0045, 0.0024, 0.0014, 0.0012], exposure: 0.96, bloom: 0.2, grade: { tint: '#fffaf2', shadowTint: '#0c1420', saturation: 1.1, contrast: 1.05 }, portal: '#ffb46a', flame: 2.6, mist: 0.04, gfog: [0.035, 2.5, 0.12], layer: 0 },
  dawn: { title: 'The Blown City at First Light', el: 30, el0: 10, fog: '#E2C2C6', lagoon: '#8fa9b4', sun: '#ffd0c0', sunGain: 1.0, warm: '#ff8f86', zen: '#9d8fbd', lit: '#ffd0b4', shade: '#a68cae', cover: 0.5, rake: 0.9, inner: 0.3, beam: 0.9, add: 0, late: 1, glow: 1, glowCol: '#ff7a58',
    dens: [0.014, 0.0055, 0.0028, 0.0015, 0.0013], exposure: 0.9, bloom: 0.22, grade: { tint: '#fff2f4', shadowTint: '#180c22', saturation: 1.12, contrast: 1.07 }, portal: '#ffa070', flame: 3.6, mist: 0.05, gfog: [0.045, 2.8, 0.12], layer: 0 },
  night: { title: 'The Blown City by Lantern', el: 34, el0: 13, fog: '#2c3656', lagoon: '#243a54', sun: '#8494c4', sunGain: 0.4, warm: '#2c3860', zen: '#1e2540', lit: '#46527c', shade: '#1b213a', cover: 0.5, rake: 0, inner: 0.85, beam: 0.6, add: 1, late: 0, glow: 0.7, glowCol: '#ff7a30',
    dens: [0.02, 0.011, 0.007, 0.0045, 0.004], exposure: 1.2, bloom: 0.45, grade: { tint: '#f4f6ff', shadowTint: '#16203a', saturation: 1.1, contrast: 1.0 }, portal: '#ff9a50', flame: 3.0, mist: 0.1, gfog: [0.1, 3, 0], layer: 0 },
  frost: { title: 'The Blown City under Frost', el: 34, el0: 13, fog: '#E3ECE6', lagoon: '#7FC2B6', sun: '#fff6e6', sunGain: 1.3, warm: '#ffe9c4', zen: '#8fc1c4', lit: '#ffffff', shade: '#b3c5d2', cover: 0.62, rake: 1.1, inner: 0.1, beam: 1.15, add: 0, late: 0, glow: 0.8, glowCol: '#ff8a4e',
    dens: [0.0046, 0.0019, 0.0011, 0.0007, 0.0006], exposure: 0.94, bloom: 0.2, grade: { tint: '#f7fffb', shadowTint: '#0a1622', saturation: 1.14, contrast: 1.08 }, portal: '#ffb46a', flame: 2.4, mist: 0.02, gfog: [0.26, 3, 0.3], layer: 1 },
};
const CASTS = {
  lagoon: [['aqua', 5], ['cobalt', 5], ['celadon', 2.2], ['amber', 1.6], ['ruby', 1.5], ['amethyst', 1.6], ['milk', 0.8], ['rose', 1.2]],
  ember: [['amber', 5], ['ruby', 4.5], ['rose', 2.0], ['milk', 0.8], ['amethyst', 1.8], ['aqua', 1.5], ['cobalt', 1.4], ['celadon', 0.8]],
  milk: [['milk', 2.6], ['gold', 2.6], ['celadon', 2], ['aqua', 2], ['cobalt', 1.8], ['ruby', 1.6], ['rose', 1.4], ['amethyst', 1.2]],
};

// ---------- geometry builder: position, normal, color, thick, uvp (u, v metres, pattern id), sway ----------
class GB {
  constructor() { this.p = []; this.n = []; this.c = []; this.th = []; this.uv = []; this.sw = []; this.i = []; this.col = [1, 1, 1]; this.thick = 0.15; this.pat = 0; this.sway = 0; this.m = null; this.us = 1; this.vs = 1; }
  get count() { return this.p.length / 3; }
  get tris() { return this.i.length / 3; }
  mat(col, thick, pat = 0, sway = 0) { if (col) this.col = col; this.thick = thick; this.pat = pat; this.sway = sway; this.us = 1; this.vs = 1; return this; }
  v(x, y, z, nx, ny, nz, u = 0, w = 0, sw = this.sway) {
    const m = this.m;
    if (m) {
      const e = m.elements, X = x, Y = y, Z = z, NX = nx, NY = ny, NZ = nz;
      x = e[0] * X + e[4] * Y + e[8] * Z + e[12]; y = e[1] * X + e[5] * Y + e[9] * Z + e[13]; z = e[2] * X + e[6] * Y + e[10] * Z + e[14];
      nx = e[0] * NX + e[4] * NY + e[8] * NZ; ny = e[1] * NX + e[5] * NY + e[9] * NZ; nz = e[2] * NX + e[6] * NY + e[10] * NZ;
    }
    this.p.push(x, y, z); this.n.push(nx, ny, nz); this.c.push(this.col[0], this.col[1], this.col[2]); this.th.push(this.thick);
    this.uv.push(u * this.us, w * this.vs, this.pat); this.sw.push(sw);
    return this.p.length / 3 - 1;
  }
  // quad a-b-c-d counter-clockwise seen from the front; uv from the given corners or from (along, height)
  quad(a, b, c, d, uv, both) {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    const lu = Math.hypot(ux, uy, uz), lv = Math.hypot(vx, vy, vz), q = uv || [0, 0, lu, 0, lu, lv, 0, lv];
    const i0 = this.v(a[0], a[1], a[2], nx, ny, nz, q[0], q[1]), i1 = this.v(b[0], b[1], b[2], nx, ny, nz, q[2], q[3]);
    const i2 = this.v(c[0], c[1], c[2], nx, ny, nz, q[4], q[5]), i3 = this.v(d[0], d[1], d[2], nx, ny, nz, q[6], q[7]);
    this.i.push(i0, i1, i2, i0, i2, i3);
    if (both) {
      const j0 = this.v(a[0], a[1], a[2], -nx, -ny, -nz, q[0], q[1]), j1 = this.v(b[0], b[1], b[2], -nx, -ny, -nz, q[2], q[3]);
      const j2 = this.v(c[0], c[1], c[2], -nx, -ny, -nz, q[4], q[5]), j3 = this.v(d[0], d[1], d[2], -nx, -ny, -nz, q[6], q[7]);
      this.i.push(j0, j2, j1, j0, j3, j2);
    }
  }
  // vertical wall from (x0,z0) to (x1,z1); its front has the normal (-dz, 0, dx) (left to right as seen from the front)
  wall(x0, z0, x1, z1, y0, y1, u0 = 0, both = false) {
    const L = Math.hypot(x1 - x0, z1 - z0), h = y1 - y0;
    this.quad([x0, y0, z0], [x1, y0, z1], [x1, y1, z1], [x0, y1, z0], [u0, 0, u0 + L, 0, u0 + L, h, u0, h], both);
  }
  box(cx, cy, cz, sx, sy, sz, bottom = false) {
    const x0 = cx - sx / 2, x1 = cx + sx / 2, y0 = cy - sy / 2, y1 = cy + sy / 2, z0 = cz - sz / 2, z1 = cz + sz / 2;
    this.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]); this.quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]);
    this.quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]); this.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]);
    this.quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]);
    if (bottom) this.quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]);
  }
  // lathe about a vertical axis: prof [[y, r], ...]; uv.x = turns * angle / TAU, uv.y = y; arc = fraction of the circle (centred on +Z)
  lathe(cx, cz, prof, segs, o = {}) {
    const base = this.count, arc = o.arc ?? 1, turns = o.turns ?? 1, closed = arc >= 1, cols = closed ? segs : segs + 1, a0 = -arc * Math.PI;
    for (let i = 0; i < prof.length; i++) {
      const y = prof[i][0], r = prof[i][1], pa = prof[Math.max(0, i - 1)], pb = prof[Math.min(prof.length - 1, i + 1)];
      let dy = pb[0] - pa[0], dr = pb[1] - pa[1]; const l = Math.hypot(dy, dr) || 1; dy /= l; dr /= l;
      const sw = o.sway ? o.sway(y) : this.sway;
      for (let j = 0; j < cols; j++) {
        const a = a0 + (j / segs) * arc * TAU, s = Math.sin(a), c = Math.cos(a);
        const rr = o.mod ? r * o.mod(a, y) : r;
        this.v(cx + s * rr, y, cz + c * rr, s * dy, -dr, c * dy, (j / segs) * turns, y, sw);
      }
    }
    for (let i = 0; i < prof.length - 1; i++) for (let j = 0; j < segs; j++) {
      const a = base + i * cols + j, b = base + i * cols + (closed ? (j + 1) % segs : j + 1), c = a + cols, d = b + cols;
      this.i.push(a, b, c, b, d, c);
    }
  }
  cyl(x, z, y0, y1, r0, r1, segs = 8, turns = 1) { this.lathe(x, z, [[y0, r0], [y1, r1 ?? r0]], segs, { turns }); }
  // tube along points [[x,y,z],...]
  tube(pts, rad, segs = 5, o = {}) {
    const base = this.count, n = pts.length, T = new THREE.Vector3(), N = new THREE.Vector3(), Bn = new THREE.Vector3(), up = new THREE.Vector3();
    let len = 0;
    for (let i = 0; i < n; i++) {
      const p = pts[i], a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
      if (i) len += Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1], p[2] - pts[i - 1][2]);
      T.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize();
      up.set(0, 1, 0); if (Math.abs(up.dot(T)) > 0.95) up.set(1, 0, 0);
      N.crossVectors(up, T).normalize(); Bn.crossVectors(T, N).normalize();
      const r = typeof rad === 'function' ? rad(i / (n - 1)) : rad, sw = o.sway ? o.sway(i / (n - 1), p) : this.sway;
      for (let j = 0; j < segs; j++) {
        const an = (j / segs) * TAU, ca = Math.cos(an), sa = Math.sin(an), nx = N.x * ca + Bn.x * sa, ny = N.y * ca + Bn.y * sa, nz = N.z * ca + Bn.z * sa;
        this.v(p[0] + nx * r, p[1] + ny * r, p[2] + nz * r, nx, ny, nz, (j / segs) * (o.turns ?? 1), len, sw);
      }
    }
    for (let i = 0; i < n - 1; i++) for (let j = 0; j < segs; j++) {
      const a = base + i * segs + j, b = base + i * segs + (j + 1) % segs, c = a + segs, d = b + segs;
      this.i.push(a, b, c, b, d, c);
    }
  }
  blob(cx, cy, cz, rx, ry, rz, lat = 3, lon = 6) {
    const base = this.count;
    for (let i = 0; i <= lat; i++) {
      const ph = (i / lat) * Math.PI, sp = Math.sin(ph), cp = Math.cos(ph);
      for (let j = 0; j < lon; j++) {
        const a = (j / lon) * TAU, nx = Math.sin(a) * sp, nz = Math.cos(a) * sp;
        this.v(cx + nx * rx, cy + cp * ry, cz + nz * rz, nx, cp, nz, j / lon, i / lat);
      }
    }
    for (let i = 0; i < lat; i++) for (let j = 0; j < lon; j++) {
      const a = base + i * lon + j, b = base + i * lon + (j + 1) % lon, c = a + lon, d = b + lon;
      this.i.push(a, c, b, b, c, d);
    }
  }
  // smooth normals for the vertices added since v0, from the triangles added since i0
  smooth(v0, i0) {
    const p = this.p, n = this.n, I = this.i;
    for (let k = v0 * 3; k < n.length; k++) n[k] = 0;
    for (let k = i0; k < I.length; k += 3) {
      const a = I[k] * 3, b = I[k + 1] * 3, c = I[k + 2] * 3;
      const ux = p[b] - p[a], uy = p[b + 1] - p[a + 1], uz = p[b + 2] - p[a + 2], vx = p[c] - p[a], vy = p[c + 1] - p[a + 1], vz = p[c + 2] - p[a + 2];
      const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      for (const q of [a, b, c]) if (q >= v0 * 3) { n[q] += nx; n[q + 1] += ny; n[q + 2] += nz; }
    }
    for (let k = v0 * 3; k < n.length; k += 3) { const l = Math.hypot(n[k], n[k + 1], n[k + 2]) || 1; n[k] /= l; n[k + 1] /= l; n[k + 2] /= l; }
  }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3)); g.setAttribute('thick', new THREE.Float32BufferAttribute(this.th, 1));
    g.setAttribute('uvp', new THREE.Float32BufferAttribute(this.uv, 3)); g.setAttribute('sway', new THREE.Float32BufferAttribute(this.sw, 1));
    g.setIndex(this.i);
    return g;
  }
}
const WHITE = [1, 1, 1], MILK = lin('#EFE9DC'), GOLDC = lin('#E8B04A'), WEED = lin('#2f9e62'), IVY = lin('#2f8f4e');

// ---------- palazzi ----------
// pointed arch between x0 and x1 springing at ys: [[x, y], ...] from the left spring over the apex to the right spring
function ogive(x0, x1, ys, k = 0.75, n = 5) {
  const bw = x1 - x0, r = bw * k, fm = Math.acos(1 - bw / (2 * r)), pts = [];
  for (let i = 0; i <= n; i++) { const f = (i / n) * fm; pts.push([x0 + r - r * Math.cos(f), ys + r * Math.sin(f)]); }
  for (let i = n - 1; i >= 0; i--) { const f = (i / n) * fm; pts.push([x1 - r + r * Math.cos(f), ys + r * Math.sin(f)]); }
  return pts;
}
// a real arcade: twisted white-thread cane columns, pointed arches with a thick frame and soffit, the wall above them
function arcade3d(B, x0, bays, bw, y0, ys, yTop, z, col, cr = 0.26, deep = 0.55) {
  for (let i = 0; i <= bays; i++) {
    const x = x0 + i * bw;
    B.mat(col, 0.7, 5);
    B.lathe(x, z - 0.06, [[y0, cr * 1.3], [y0 + 0.3, cr], [ys - 0.32, cr * 0.9], [ys - 0.08, cr * 1.55], [ys, cr * 1.55]], 7, { turns: 5 });
    B.mat(col, 0.35, 0); B.quad([x - cr * 0.7, ys, z], [x + cr * 0.7, ys, z], [x + cr * 0.7, yTop, z], [x - cr * 0.7, yTop, z]);
  }
  for (let i = 0; i < bays; i++) {
    const a = x0 + i * bw + cr * 0.7, b = x0 + (i + 1) * bw - cr * 0.7, P = ogive(a, b, ys, 0.75, 5), cm = (a + b) / 2, s = 0.85, zf = z + 0.1;
    for (let k = 0; k < P.length - 1; k++) {
      const p = P[k], q = P[k + 1], pi = [cm + (p[0] - cm) * s, ys + (p[1] - ys) * s], qi = [cm + (q[0] - cm) * s, ys + (q[1] - ys) * s];
      B.mat(col, 0.14, 3); B.quad([p[0], p[1], z], [q[0], q[1], z], [q[0], yTop, z], [p[0], yTop, z], [p[0], p[1], q[0], q[1], q[0], yTop, p[0], yTop]);
      B.mat(col, 0.95, 0); B.quad([pi[0], pi[1], zf], [qi[0], qi[1], zf], [q[0], q[1], zf], [p[0], p[1], zf]);
      B.mat(col, 0.6, 0); B.quad([pi[0], pi[1], zf], [pi[0], pi[1], z - deep], [qi[0], qi[1], z - deep], [qi[0], qi[1], zf]);
    }
  }
}
function balcony(B, xc, y, w, z, col, proj = 0.95) {
  B.mat(col, 0.8, 0); B.box(xc, y + 0.08, z + proj / 2, w, 0.16, proj, true);
  B.mat(col, 0.3, 10);
  B.wall(xc - w / 2, z + proj, xc + w / 2, z + proj, y + 0.16, y + 1.16, 0, true);
  B.wall(xc - w / 2, z, xc - w / 2, z + proj, y + 0.16, y + 1.16, 0, true); B.wall(xc + w / 2, z + proj, xc + w / 2, z, y + 0.16, y + 1.16, 0, true);
  B.mat(MILK, 0.5, 20); B.box(xc, y + 1.2, z + proj, w + 0.12, 0.09, 0.12);
}
function windowBox(B, xc, y, z, rng, flowers) {
  B.mat(MILK, 0.6, 20); B.box(xc, y - 0.14, z + 0.2, 1.3, 0.26, 0.36, true);
  const n = 5;
  for (let i = 0; i < n; i++) {
    const fx_ = xc - 0.52 + (i / (n - 1)) * 1.04, fc = flowers[(i + ((xc * 7) | 0) + 99) % flowers.length], fy = y + 0.18 + 0.12 * rng();
    B.mat(fc, 0.45, 20, -0.035); B.blob(fx_, fy, z + 0.22 + 0.08 * rng(), 0.15, 0.13, 0.15, 2, 5);
  }
  for (let i = 0; i < 3; i++) {           // trailing ivy: hanging leaf chains that swing
    const ix = xc - 0.45 + i * 0.45 + 0.1 * rng(), L = 0.7 + 0.9 * rng(), zz = z + 0.4;
    B.mat(IVY, 0.3, 20);
    const a = B.v(ix - 0.09, y - 0.2, zz, 0, 0, 1, 0, 0, 0.01), b = B.v(ix + 0.09, y - 0.2, zz, 0, 0, 1, 0, 0, 0.01);
    const c = B.v(ix + 0.14, y - 0.2 - L * 0.6, zz, 0, 0, 1, 0, 0, 0.07), d = B.v(ix - 0.12, y - 0.2 - L * 0.55, zz, 0, 0, 1, 0, 0, 0.07), e = B.v(ix, y - 0.2 - L, zz, 0, 0, 1, 0, 0, 0.13);
    B.i.push(a, d, b, b, d, c, d, e, c);
  }
}
function chimney(B, x, z, y, col, s = 1) {
  B.mat(col, 0.55, 3);
  B.lathe(x, z, [[y - 0.5, 0.42 * s], [y + 1.7 * s, 0.34 * s], [y + 2.1 * s, 0.5 * s], [y + 2.75 * s, 1.0 * s], [y + 3.0 * s, 0.96 * s], [y + 3.0 * s, 0.55 * s]], 8, { turns: 8 * 0.42 });
}
function weedFringe(B, x0, x1, z, rng) {
  B.mat(WEED, 0.2, 20);
  for (let x = x0 + 0.3; x < x1; x += 0.4 + 0.4 * rng()) {
    const h = 0.22 + 0.36 * rng(), w = 0.12 + 0.08 * rng(), zz = z + 0.3 + 0.25 * rng(), lean = (rng() - 0.5) * 0.3;
    const a = B.v(x - w, -0.25, zz, 0, 0.3, 1, 0, 0, 0), b = B.v(x + w, -0.25, zz, 0, 0.3, 1, 0, 0, 0), c = B.v(x + lean, h, zz + 0.12, 0, 0.3, 1, 0, 0, 0.09);
    B.i.push(a, b, c);
  }
}
// One palazzo. Local frame: facade on z = 0 facing +Z, x from -W/2 to W/2, body back to z = -depth. Colours are relative
// tones (the house colour comes per instance) except the milk-white trim, gold and the lampwork flowers.
function palazzo(B, P, rng, lod = 1) {
  const W = P.bays * P.bw, x0 = -W / 2, x1 = W / 2, Dp = P.depth, gH = P.arc ? 6.0 : 5.2, fH = 4.2;
  const aH = P.attic ? 2.4 : 0, H = gH + P.floors * fH + aH, body = WHITE, deep = [0.78, 0.78, 0.78];
  const flowers = [lin('#C2183A'), lin('#E27892'), lin('#F2A62E'), lin('#d8344e')];
  // ground floor
  if (P.arc && lod > 0) {
    arcade3d(B, x0, P.bays, P.bw, 0, 3.0, gH, 0, body);
    B.mat(deep, 0.5, 2); B.us = 2.6 / P.bw; B.vs = 4.2 / gH; B.wall(x0, -1.7, x1, -1.7, 0, gH);
    B.mat(deep, 0.5, 0); B.quad([x0, gH, -1.7], [x1, gH, -1.7], [x1, gH, 0], [x0, gH, 0]);
  } else {
    B.mat(body, 0.14, 4); B.us = 3.4 / P.bw; B.vs = 5.2 / gH; B.wall(x0, 0, x1, 0, 0, gH);
  }
  // upper floors
  const cw = P.bw / (P.wpb || 1);
  for (let f = 0; f < P.floors; f++) {
    const y = gH + f * fH;
    if (P.loggia && f === 0 && lod > 0) {
      const lb = P.bays * 2, lw = P.bw / 2;
      arcade3d(B, x0, lb, lw, y + 0.9, y + 2.5, y + fH, 0, body, 0.15, 0.4);
      B.mat(body, 0.3, 10); B.wall(x0, 0.02, x1, 0.02, y, y + 0.95, 0, true);
      B.mat(deep, 0.5, 2); B.us = 2.6 / cw; B.wall(x0, -1.5, x1, -1.5, y, y + fH);
      B.mat(deep, 0.5, 0); B.quad([x0, y + fH, -1.5], [x1, y + fH, -1.5], [x1, y + fH, 0], [x0, y + fH, 0]);
    } else {
      B.mat(body, 0.1, P.panes && f === P.floors - 1 ? 1 : 2); if (B.pat === 2) B.us = 2.6 / cw;
      B.wall(x0, 0, x1, 0, y, y + fH);
    }
    B.mat(MILK, 0.5, 20); B.box(0, y, 0.1, W + 0.3, 0.24, 0.34);                 // string course of milk glass
    if (lod > 0) {
      if (P.bal === 2) balcony(B, 0, y + 0.1, W - 1.2, 0, body, f === 0 ? 1.05 : 0.8);
      else if (P.bal === 1 && f === 0) balcony(B, 0, y + 0.1, Math.min(W - 2, P.bw * 2.2), 0, body);
      if (P.bal !== 2 && !(P.loggia && f === 0)) {
        const nwin = Math.round(W / cw);
        for (let k = (f + 1) % 2; k < nwin; k += 2) {
          const wx = x0 + (k + 0.5) * cw;
          if (P.bal === 1 && f === 0 && Math.abs(wx) < P.bw * 1.2) continue;
          if (P.oriel && Math.abs(wx) < P.bw * 0.6) continue;
          windowBox(B, wx, y + 0.85, 0.02, rng, flowers);
        }
      }
    }
  }
  const yA = gH + P.floors * fH;
  if (P.attic) { B.mat(body, 0.12, 1); B.wall(x0, 0, x1, 0, yA, H); B.mat(MILK, 0.5, 20); B.box(0, yA, 0.1, W + 0.3, 0.2, 0.3); }
  if (P.oriel && lod > 0) {
    const r = P.bw * 0.46, yb = gH + 0.7, yt = gH + Math.min(P.floors, 2) * fH - 0.5;
    B.mat(body, 0.2, 1); B.lathe(0, 0, [[yb, r], [yt, r], [yt + 0.8, 0.06]], 8, { arc: 0.5, turns: Math.PI * r / 0.8 * 0.8 });
    B.mat(body, 0.55, 0); B.lathe(0, 0, [[yb - 1.25, 0.06], [yb - 1.0, r * 0.5], [yb - 0.6, r * 0.82], [yb - 0.25, r * 0.96], [yb, r]], 12, { arc: 0.5 });
    B.mat(MILK, 0.6, 20); B.lathe(0, 0, [[yb - 0.05, r + 0.08], [yb + 0.12, r + 0.08]], 8, { arc: 0.5 }); B.lathe(0, 0, [[yt - 0.1, r + 0.08], [yt + 0.07, r + 0.08]], 8, { arc: 0.5 });
  }
  if (P.rose && lod > 0) {
    const cy = gH + (P.floors - 0.5) * fH + 0.2, R = Math.min(1.7, fH * 0.4), ring = (cx, cy2, r, n, rad) => { const pts = []; for (let i = 0; i <= n; i++) { const a = (i / n) * TAU; pts.push([cx + Math.cos(a) * r, cy2 + Math.sin(a) * r, 0.14]); } B.tube(pts, rad, 4); };
    B.mat(MILK, 0.8, 20); ring(0, cy, R, 14, 0.12);
    B.mat(body, 0.9, 0); for (let k = 0; k < 4; k++) { const a = k * TAU / 4 + TAU / 8; ring(Math.cos(a) * R * 0.46, cy + Math.sin(a) * R * 0.46, R * 0.42, 8, 0.07); }
  }
  // cornice and crest
  B.mat(MILK, 0.6, 20); B.box(0, H + 0.14, -Dp / 2 + 0.2, W + 0.7, 0.3, Dp + 0.9);
  if (P.crest === 'merli') {
    const n = Math.max(3, Math.round(W / (lod > 0 ? 1.5 : 2.6)));
    for (let k = 0; k <= n; k++) { const x = x0 + (k / n) * W; B.mat(k % 2 ? MILK : body, 0.7, k % 2 ? 20 : 0); B.lathe(x, 0.2, [[H + 0.28, 0.3], [H + 0.75, 0.36], [H + 1.05, 0.13], [H + 1.6, 0.02]], 4); }
  } else if (P.crest === 'rail') {
    B.mat(body, 0.3, 10); B.wall(x0, 0.3, x1, 0.3, H + 0.29, H + 1.29, 0, true);
    B.mat(MILK, 0.6, 20); B.box(0, H + 1.33, 0.3, W + 0.2, 0.1, 0.14);
    for (const x of [x0 + 0.2, x1 - 0.2]) { B.mat(GOLDC, 0.5, 27); B.blob(x, H + 1.75, 0.3, 0.34, 0.42, 0.34, 3, 6); }
  } else if (P.crest === 'gable') {
    const gw = Math.min(W * 0.6, 9), gh = gw * 0.55, n = 6;
    B.mat(body, 0.14, 1);
    for (let k = 0; k < n; k++) {
      const a = -gw / 2 + (k / n) * gw, b = -gw / 2 + ((k + 1) / n) * gw, ya = gh * Math.pow(Math.cos((a / gw) * Math.PI), 0.7), yb = gh * Math.pow(Math.cos((b / gw) * Math.PI), 0.7);
      B.quad([a, H + 0.28, 0.1], [b, H + 0.28, 0.1], [b, H + 0.28 + yb, 0.1], [a, H + 0.28 + ya, 0.1], [a, 0, b, 0, b, yb, a, ya], true);
    }
    B.mat(GOLDC, 0.5, 27); B.blob(0, H + 0.28 + gh + 0.4, 0.1, 0.4, 0.5, 0.4, 3, 6);
  } else if (P.crest === 'dome') {
    const r = Math.min(W, Dp) * 0.3, y = H + 0.28, prof = [[y, r * 0.9], [y + 0.8, r * 0.9]];
    for (let k = 1; k <= 6; k++) { const a = (k / 6) * Math.PI * 0.5; prof.push([y + 0.8 + Math.sin(a) * r * 1.05, Math.max(0.05, Math.cos(a) * r * (1 + 0.12 * Math.sin(a * 2)))]); }
    B.mat(body, 0.16, 8); B.lathe(0, -Dp / 2, prof, 10, { turns: 10 });
    B.mat(GOLDC, 0.5, 27); B.blob(0, y + 0.8 + r * 1.05 + 0.5, -Dp / 2, 0.4, 0.6, 0.4, 3, 6);
  }
  // thick glass at the corners and along the waterline: each house has a dark saturated outline
  B.mat(body, 1.0, 0); B.box(x0 + 0.22, H / 2, 0.08, 0.44, H, 0.34); B.box(x1 - 0.22, H / 2, 0.08, 0.44, H, 0.34);
  B.mat(body, 0.9, 0); B.box(0, P.arc ? 0.1 : 0.2, 0.1, W, P.arc ? 0.6 : 0.8, 0.36);
  // roof, sides, back
  const yr = H + 0.28, rz = -Dp / 2, rh = P.crest === 'dome' ? 0.5 : 1.7;
  B.mat(deep, 0.3, 3);
  B.quad([x0, yr, 0], [x1, yr, 0], [x1 - 2, yr + rh, rz], [x0 + 2, yr + rh, rz]); B.quad([x1, yr, -Dp], [x0, yr, -Dp], [x0 + 2, yr + rh, rz], [x1 - 2, yr + rh, rz]);
  B.quad([x1, yr, 0], [x1, yr, -Dp], [x1 - 2, yr + rh, rz], [x1 - 2, yr + rh, rz]); B.quad([x0, yr, -Dp], [x0, yr, 0], [x0 + 2, yr + rh, rz], [x0 + 2, yr + rh, rz]);
  B.mat(body, 0.14, 4); B.us = (3.4 * Math.max(2, Math.round(Dp / 3.6))) / Dp; B.vs = 5.2 / gH; B.wall(x1, 0, x1, -Dp, 0, gH); B.wall(x0, -Dp, x0, 0, 0, gH);
  B.mat(body, 0.12, 2); B.us = 2.6 / 3.2; B.wall(x1, 0, x1, -Dp, gH, H); B.wall(x0, -Dp, x0, 0, gH, H);
  B.mat(deep, 0.14, 0); B.wall(x1, -Dp, x0, -Dp, 0, H);
  const nc = lod > 0 ? P.chim : Math.min(1, P.chim);
  for (let k = 0; k < nc; k++) chimney(B, x0 + (0.18 + 0.64 * ((k * 0.618 + 0.2) % 1)) * W, -Dp * (0.3 + 0.4 * ((k * 0.37) % 1)), yr + 0.6, body, 0.85 + 0.3 * ((k * 0.71) % 1));
  if (lod > 0) weedFringe(B, x0, x1, 0, rng);
  return { W, H, Dp, gH };
}
const NEAR_FORMS = [
  { bays: 4, bw: 3.6, floors: 2, arc: 1, wpb: 1, attic: 1, crest: 'merli', bal: 1, chim: 2, depth: 12 },                 // gothic arcade house
  { bays: 3, bw: 3.4, floors: 3, arc: 1, wpb: 1, attic: 0, crest: 'rail', bal: 2, chim: 1, depth: 11 },                  // balcony palace
  { bays: 5, bw: 3.3, floors: 2, arc: 1, loggia: 1, wpb: 1, attic: 1, crest: 'merli', bal: 0, chim: 2, depth: 13 },      // double loggia
  { bays: 3, bw: 4.0, floors: 3, arc: 1, wpb: 2, attic: 0, panes: 1, oriel: 1, crest: 'gable', bal: 0, chim: 2, depth: 11 }, // oriel house with a bullseye gable
  { bays: 4, bw: 3.2, floors: 2, arc: 1, wpb: 1, attic: 1, crest: 'dome', bal: 1, chim: 1, depth: 13 },                  // domed pavilion
  { bays: 3, bw: 3.6, floors: 2, arc: 1, wpb: 1, attic: 1, panes: 1, rose: 1, crest: 'gable', bal: 0, chim: 3, depth: 12 }, // rose-window workshop
  { bays: 4, bw: 3.0, floors: 3, arc: 1, wpb: 1, attic: 1, crest: 'rail', bal: 1, oriel: 0, chim: 2, depth: 12 },         // tall rail-topped house
  { bays: 2, bw: 3.8, floors: 3, arc: 1, wpb: 2, attic: 1, panes: 1, crest: 'merli', bal: 2, chim: 1, depth: 10 },        // narrow tower house
];
const FAR_FORMS = [
  { bays: 4, bw: 4.0, floors: 3, arc: 0, wpb: 1, attic: 1, crest: 'merli', bal: 0, chim: 1, depth: 14 },
  { bays: 5, bw: 3.6, floors: 2, arc: 0, wpb: 1, attic: 1, crest: 'gable', bal: 0, chim: 1, depth: 14 },
  { bays: 3, bw: 4.2, floors: 4, arc: 0, wpb: 2, attic: 0, panes: 1, crest: 'dome', bal: 0, chim: 1, depth: 13 },
];

// ---------- boats, poles, bridges, trees, landmarks ----------
// gondola of black amethyst glass with a clear comb at the prow and a standing speck at the stern; bow toward +Z
function gondolaGeo(B, figure) {
  const v0 = B.count, i0 = B.i.length, NS = 12, L = 5.4;
  B.mat(WHITE, 0.6, 0);
  const sec = (t) => { const at = Math.abs(t); return [0.68 * Math.pow(Math.max(0, 1 - Math.pow(at, 2.6)), 0.7) + 0.02, 0.42 + 0.95 * Math.pow(at, 3.2), -0.12 + 0.75 * Math.pow(at, 4)]; };
  for (let s = 0; s <= NS; s++) {
    const t = -1 + (2 * s) / NS, [b, yg, yk] = sec(t), z = t * L;
    for (const q of [[-b, yg], [-b * 0.82, yk + 0.12], [0, yk], [b * 0.82, yk + 0.12], [b, yg]]) B.v(q[0], q[1], z, 0, 1, 0, q[0], z);
  }
  for (let s = 0; s < NS; s++) for (let j = 0; j < 4; j++) { const a = v0 + s * 5 + j, b = a + 1, c = a + 5, d = c + 1; B.i.push(a, b, c, b, d, c); }
  B.smooth(v0, i0);
  B.mat([0.5, 0.5, 0.5], 0.9, 0);
  for (let s = 1; s < NS - 1; s++) {
    const t0 = -1 + (2 * s) / NS, t1 = -1 + (2 * (s + 1)) / NS, a = sec(t0), b = sec(t1), ya = Math.min(a[1], 0.5) - 0.1, yb = Math.min(b[1], 0.5) - 0.1;
    B.quad([-a[0] * 0.95, ya, t0 * L], [a[0] * 0.95, ya, t0 * L], [b[0] * 0.95, yb, t1 * L], [-b[0] * 0.95, yb, t1 * L]);
  }
  B.mat(MILK, 0.25, 20);                                                     // the ferro: a clear comb
  B.quad([0, 1.2, L - 0.2], [0, 1.3, L + 0.28], [0, 2.2, L + 0.36], [0, 2.05, L - 0.06], null, true);
  for (let k = 0; k < 4; k++) { const y = 1.38 + k * 0.17; B.quad([0, y, L + 0.28], [0, y, L + 0.56], [0, y + 0.09, L + 0.56], [0, y + 0.09, L + 0.3], null, true); }
  B.quad([0, 1.25, -L + 0.2], [0, 1.9, -L + 0.1], [0, 1.95, -L - 0.2], [0, 1.3, -L - 0.25], null, true);
  if (figure) {
    const z = -L * 0.7;
    B.mat(figure, 0.5, 20); B.lathe(0.05, z, [[0.3, 0.17], [1.2, 0.2], [1.75, 0.25], [1.9, 0.1], [1.98, 0.13], [2.14, 0.12], [2.2, 0.02]], 6);
    B.mat(MILK, 0.5, 20); B.lathe(0.05, z, [[2.1, 0.3], [2.16, 0.1]], 6);                                     // hat
    B.tube([[0.25, 1.7, z + 0.1], [0.75, 0.6, z - 1.2], [1.1, -0.35, z - 2.3]], 0.045, 4);                      // oar
  }
}
// mooring pole of barber-striped cane, symmetric about the water so that it is its own reflection
function poleGeo(B, streamer) {
  for (const sg of [1, -1]) {
    B.mat(WHITE, 0.5, 6);
    B.lathe(0, 0, sg > 0 ? [[0, 0.17], [1, 0.15]] : [[-1, 0.15], [0, 0.17]], 7, { turns: 3 });
    B.mat(GOLDC, 0.5, 27); B.blob(0, sg * 1.035, 0, 0.2, 0.05, 0.2, 2, 6);
    if (streamer) {
      B.mat(MILK, 0.2, 9);
      const n = 4;
      for (let k = 0; k < n; k++) {
        const a = k / n, b = (k + 1) / n, y0 = sg * (0.98 - a * 0.16), y1 = sg * (0.98 - b * 0.16);
        const i0 = B.v(0.15 + a * 1.5, y0, 0, 0, 0, 1, a, 0, a * 0.25), i1 = B.v(0.15 + b * 1.5, y1, 0, 0, 0, 1, b, 0, b * 0.25), i2 = B.v(0.15 + b * 1.5, y1 - sg * 0.035, 0, 0, 0, 1, b, 1, b * 0.25), i3 = B.v(0.15 + a * 1.5, y0 - sg * 0.035, 0, 0, 0, 1, a, 1, a * 0.25);
        B.i.push(i0, i1, i2, i0, i2, i3, i0, i2, i1, i0, i3, i2);
      }
    }
  }
}
// milk-glass gull standing on a pole top (origin at its feet), beak toward +Z
function gullGeo(B) {
  B.mat(MILK, 0.5, 20, -0.006);
  B.blob(0, 0.2, -0.02, 0.1, 0.11, 0.2, 3, 6); B.blob(0, 0.36, 0.13, 0.065, 0.07, 0.075, 2, 5);
  B.mat(lin('#aeb4bc'), 0.6, 20, -0.006); B.blob(0, 0.21, -0.14, 0.085, 0.06, 0.17, 2, 5);
  B.mat(lin('#F2A62E'), 0.6, 20, -0.006);
  B.tube([[0, 0.36, 0.19], [0, 0.345, 0.3]], (t) => 0.022 * (1 - t) + 0.004, 3);
  B.tube([[0.03, 0.1, 0], [0.03, 0, 0]], 0.012, 3); B.tube([[-0.03, 0.1, 0], [-0.03, 0, 0]], 0.012, 3);
}
// arched footbridge across the side canal: local x across (-5.5..5.5), soffit 7.2 m at the walls and 8 m at the crown
function footbridgeGeo(B, col, rng, wisteria) {
  const N = 10, hw = 5.6, zw = 1.25, ys = (x) => 7.15 + 0.85 * (1 - (x / hw) * (x / hw)), yd = (x) => ys(x) + 0.5;
  for (let k = 0; k < N; k++) {
    const a = -hw + (k / N) * 2 * hw, b = -hw + ((k + 1) / N) * 2 * hw;
    B.mat(col, 0.5, 3); B.quad([a, ys(a), -zw], [b, ys(b), -zw], [b, ys(b), zw], [a, ys(a), zw]);                    // soffit
    B.quad([a, yd(a), zw], [b, yd(b), zw], [b, yd(b), -zw], [a, yd(a), -zw]);                                         // deck
    B.mat(col, 0.85, 0);
    B.quad([a, ys(a), -zw], [b, ys(b), -zw], [b, yd(b), -zw], [a, yd(a), -zw], null, true); B.quad([b, ys(b), zw], [a, ys(a), zw], [a, yd(a), zw], [b, yd(b), zw], null, true);
    B.mat(col, 0.3, 10);
    for (const z of [-zw, zw]) B.quad([a, yd(a), z], [b, yd(b), z], [b, yd(b) + 1, z], [a, yd(a) + 1, z], [a, 0, b, 0, b, 1, a, 1], true);
  }
  for (const z of [-zw, zw]) {
    const pts = []; for (let k = 0; k <= N; k++) { const x = -hw + (k / N) * 2 * hw; pts.push([x, yd(x) + 1.04, z]); }
    B.mat(MILK, 0.6, 25); B.tube(pts, 0.07, 4, { turns: 3 });
    for (const x of [-hw + 0.3, 0, hw - 0.3]) { B.mat(col, 0.7, 5); B.lathe(x, z, [[yd(x), 0.1], [yd(x) + 1.25, 0.09]], 5, { turns: 3 }); B.mat(GOLDC, 0.5, 27); B.blob(x, yd(x) + 1.4, z, 0.16, 0.18, 0.16, 2, 5); }
  }
  if (wisteria) {                                                                 // amethyst drops hung under both edges, swaying
    const n = Math.round(46 * wisteria), cols = [lin('#7B4BB0'), lin('#9a6fd0'), lin('#5d3596'), lin('#b79be0')];
    for (let k = 0; k < n; k++) {
      const x = -hw + 0.5 + rng() * (2 * hw - 1), z = (rng() < 0.5 ? -1 : 1) * (zw + 0.06), top = ys(x) + 0.2, len = 0.6 + 1.5 * rng() * (0.4 + 0.6 * Math.abs(x) / hw), nd = 2 + ((len * 2.2) | 0);
      for (let d = 0; d < nd; d++) {
        const f = (d + 1) / nd, y = top - f * len, r = 0.12 * (1.15 - 0.6 * f);
        B.mat(cols[(k + d) % 4], 0.5, 20, 0.05 + 0.2 * f * len); B.blob(x + 0.05 * Math.sin(k + d), y, z, r, r * 1.5, r, 2, 4);
      }
    }
  }
}
// the great bridge: one 50 m arch of clear cobalt with a white-thread balustrade; local x across the canal, z along it
function greatBridgeGeo(B, col, half = 25, zw = 3.6) {
  const N = 20, R = (half * half + 7.5 * 7.5) / 15, ys = (x) => 9 - R + Math.sqrt(Math.max(0, R * R - x * x)), yd = (x) => 10.1 - 3.2 * Math.pow(Math.abs(x) / half, 1.8);
  for (let k = 0; k < N; k++) {
    const a = -half + (k / N) * 2 * half, b = -half + ((k + 1) / N) * 2 * half;
    B.mat(col, 0.45, 3); B.quad([a, ys(a), -zw], [b, ys(b), -zw], [b, ys(b), zw], [a, ys(a), zw], [0, a, 0, b, 2 * zw, b, 2 * zw, a]);                       // soffit, reeded along its span
    B.mat(col, 0.5, 3); B.quad([a, yd(a), zw], [b, yd(b), zw], [b, yd(b), -zw], [a, yd(a), -zw]);
    B.mat(col, 0.2, 1);
    B.quad([a, ys(a), -zw], [b, ys(b), -zw], [b, yd(b), -zw], [a, yd(a), -zw], [a, ys(a), b, ys(b), b, yd(b), a, yd(a)], true);
    B.quad([b, ys(b), zw], [a, ys(a), zw], [a, yd(a), zw], [b, yd(b), zw], [b, ys(b), a, ys(a), a, yd(a), b, yd(b)], true);
    B.mat(MILK, 0.3, 30);
    for (const z of [-zw, zw]) B.quad([a, yd(a), z], [b, yd(b), z], [b, yd(b) + 1.1, z], [a, yd(a) + 1.1, z], [a, 0, b, 0, b, 1, a, 1], true);
  }
  for (const z of [-zw, zw]) {
    const pts = [], rim = []; for (let k = 0; k <= N; k++) { const x = -half + (k / N) * 2 * half; pts.push([x, yd(x) + 1.15, z]); rim.push([x, ys(x) - 0.05, z]); }
    B.mat(MILK, 0.6, 25); B.tube(pts, 0.1, 5, { turns: 3 });
    B.mat(col, 1.0, 0); B.tube(rim, 0.22, 5);                                     // thick dark arch rim: reads as the edge of the glass
    for (let k = 0; k <= 8; k++) { const x = -half + (k / 8) * 2 * half; B.mat(MILK, 0.7, 25); B.lathe(x, z, [[yd(x), 0.16], [yd(x) + 1.5, 0.14]], 6, { turns: 4 }); B.mat(GOLDC, 0.5, 27); B.blob(x, yd(x) + 1.7, z, 0.22, 0.26, 0.22, 2, 6); }
  }
  for (const sx of [-1, 1]) { B.mat(col, 0.5, 4); B.us = 1; B.box(sx * (half + 2.2), 3.4, 0, 4.4, 6.8, 2 * zw + 1.6); }
}
// bare glass tree, every twig tipped with a bead
function treeGeo(B, x, z, rng, beadCols, scale = 1) {
  const v0 = B.count, i0 = B.i.length, tips = [];
  const grow = (p, d, len, r, lvl) => {
    const q = [p[0] + d[0] * len, p[1] + d[1] * len, p[2] + d[2] * len], m = [p[0] + d[0] * len * 0.5 + (rng() - 0.5) * len * 0.12, p[1] + d[1] * len * 0.5, p[2] + d[2] * len * 0.5 + (rng() - 0.5) * len * 0.12];
    const sw = lvl >= 2 ? -0.012 * lvl : 0;
    B.mat(MILK, 0.8, 25, sw); B.tube([p, m, q], (t) => r * (1 - 0.35 * t), lvl === 0 ? 6 : lvl < 3 ? 4 : 3, { turns: 2 });
    if (lvl >= 3) { tips.push(q); return; }
    const nb = lvl === 0 ? 4 : 3;
    for (let k = 0; k < nb; k++) {
      const a = rng() * TAU, sp = 0.55 + 0.4 * rng(), nd = [d[0] + Math.cos(a) * sp, d[1] + 0.25, d[2] + Math.sin(a) * sp], l = Math.hypot(nd[0], nd[1], nd[2]);
      grow(q, [nd[0] / l, nd[1] / l, nd[2] / l], len * (0.58 + 0.2 * rng()), r * 0.6, lvl + 1);
    }
  };
  grow([x, -0.1, z], [0, 1, 0], 3.2 * scale, 0.3 * scale, 0);
  B.smooth(v0, i0);
  for (let k = 0; k < tips.length; k++) { const t = tips[k]; B.mat(beadCols[k % beadCols.length], 0.6, 20, -0.04); B.blob(t[0], t[1], t[2], 0.13, 0.15, 0.13, 2, 5); }
}
// dome on a low drum (radius 1, the dome springs at y = 0.36): bubble dome and far domes
function domeGeo(B) {
  const prof = [[0, 1.04], [0.04, 1.0], [0.3, 1.0]];
  B.mat(WHITE, 0.2, 4); B.us = 3.4 * 22 / TAU; B.vs = 5.2 / 0.3; B.lathe(0, 0, prof, 24, { turns: TAU });
  B.mat(MILK, 0.6, 20); B.lathe(0, 0, [[0.3, 1.06], [0.36, 1.06], [0.36, 0.98]], 24);
  const d = [];
  for (let k = 0; k <= 9; k++) { const a = (k / 9) * Math.PI * 0.5; d.push([0.36 + Math.sin(a) * 0.98, Math.max(0.06, Math.cos(a) * 0.98)]); }
  B.mat(WHITE, 0.08, 8); B.us = 14; B.vs = 14; B.lathe(0, 0, d, 24, { turns: 24 / 14 });
  B.mat(MILK, 0.6, 20); B.lathe(0, 0, [[1.3, 0.09], [1.48, 0.07], [1.5, 0.11], [1.58, 0.02]], 8);
  B.mat(GOLDC, 0.5, 27); B.blob(0, 1.64, 0, 0.07, 0.08, 0.07, 3, 6);
}
// bell tower (width 1, height ~7): far campanili
function campanileGeo(B) {
  B.mat(WHITE, 0.2, 2); B.us = 2.6 / 0.5; B.vs = 4.2 / 0.9; B.box(0, 2.5, 0, 1, 5, 1);
  B.mat(MILK, 0.5, 20); B.box(0, 5.05, 0, 1.16, 0.1, 1.16);
  B.mat(WHITE, 0.3, 4); B.us = 3.4 / 0.5; B.vs = 5.2 / 0.9; B.box(0, 5.55, 0, 0.94, 0.9, 0.94);
  B.mat(MILK, 0.5, 20); B.box(0, 6.05, 0, 1.12, 0.1, 1.12);
  B.mat(WHITE, 0.3, 3); B.lathe(0, 0, [[6.1, 0.6], [7.6, 0.03]], 4);
  B.mat(GOLDC, 0.5, 27); B.blob(0, 7.7, 0, 0.09, 0.12, 0.09, 2, 5);
}
// glass lantern on a cane post (post > 0: its height) or hung on a rod (post < 0: the rod's length)
function lanternGeo(B, x, y, z, post, col) {
  if (post > 0) { B.mat(MILK, 0.7, 25); B.lathe(x, z, [[y - post, 0.09], [y - 0.3, 0.06]], 5, { turns: 3 }); }
  else { B.mat(MILK, 0.7, 25); B.tube([[x, y + 0.3, z], [x, y - post, z]], (t) => 0.05 + 0.02 * t, 4); }
  B.mat(col, 0.3, 20); B.lathe(x, z, [[y - 0.32, 0.08], [y - 0.2, 0.26], [y + 0.12, 0.3], [y + 0.3, 0.14]], 6);
  B.mat(GOLDC, 0.5, 27); B.lathe(x, z, [[y + 0.3, 0.17], [y + 0.42, 0.02]], 6);
  return [x, y, z];
}

// market boat: a broad sandolo heaped with glass fruit under a barber-striped awning (its colour comes per boat), a lantern on
// its bow post and a figure with an oar at the stern; bow toward +Z
function marketGeo(B, goods, fig) {
  const v0 = B.count, i0 = B.i.length, NS = 10, L = 4.3;
  B.mat(lin('#3a2552'), 0.6, 20);
  const sec = (t) => { const at = Math.abs(t); return [1.5 * Math.pow(Math.max(0, 1 - Math.pow(at, 3.2)), 0.6) + 0.05, 0.66 + 0.5 * Math.pow(at, 3), -0.15 + 0.5 * Math.pow(at, 4)]; };
  for (let s2 = 0; s2 <= NS; s2++) { const t = -1 + (2 * s2) / NS, [b, yg, yk] = sec(t); for (const q of [[-b, yg], [-b * 0.85, yk + 0.15], [0, yk], [b * 0.85, yk + 0.15], [b, yg]]) B.v(q[0], q[1], t * L, 0, 1, 0, q[0], t * L); }
  for (let s2 = 0; s2 < NS; s2++) for (let j = 0; j < 4; j++) { const a = v0 + s2 * 5 + j, b = a + 1, c = a + 5, d = c + 1; B.i.push(a, b, c, b, d, c); }
  B.smooth(v0, i0);
  B.mat(lin('#6b5a86'), 0.8, 20); B.quad([-1.35, 0.58, 3.2], [1.35, 0.58, 3.2], [1.35, 0.58, -3.2], [-1.35, 0.58, -3.2]);
  let k = 0;
  for (const z of [-1.3, -0.1, 1.1]) for (const x of [-0.62, 0.62]) {             // crates of glass fruit
    B.mat(MILK, 0.6, 20); B.box(x, 0.8, z, 1.0, 0.44, 0.95);
    const c = goods[k++ % goods.length];
    for (let j = 0; j < 5; j++) { const a = j * 1.571 + k, r = j < 4 ? 0.27 : 0; B.mat(c, 0.5, 20, -0.004); B.blob(x + Math.cos(a) * r, j < 4 ? 1.12 : 1.34, z + Math.sin(a) * r, 0.2, 0.19, 0.2, 2, 5); }
  }
  for (const x of [-1.25, 1.25]) for (const z of [-2.0, 1.8]) { B.mat(MILK, 0.7, 25); B.lathe(x, z, [[0.58, 0.07], [2.64, 0.055]], 5, { turns: 3 }); }
  const NA = 6;
  B.mat(WHITE, 0.22, 6);
  for (let j = 0; j < NA; j++) {
    const xa = -1.5 + (j / NA) * 3, xb = -1.5 + ((j + 1) / NA) * 3, ya = 2.62 + 0.42 * (1 - (xa / 1.5) * (xa / 1.5)), yb = 2.62 + 0.42 * (1 - (xb / 1.5) * (xb / 1.5));
    B.quad([xa, ya, 2.1], [xb, yb, 2.1], [xb, yb, -2.3], [xa, ya, -2.3], [xa * 2, 0, xb * 2, 0, xb * 2, 4.4, xa * 2, 4.4], true);
  }
  lanternGeo(B, 0, 2.35, 3.5, 1.75, lin(GLASS.amber));
  B.mat(fig, 0.5, 20); B.lathe(0.3, -3.2, [[0.58, 0.18], [1.5, 0.21], [2.0, 0.25], [2.15, 0.1], [2.25, 0.13], [2.4, 0.03]], 6);
  B.mat(MILK, 0.5, 20); B.lathe(0.3, -3.2, [[2.36, 0.3], [2.42, 0.1]], 6);
  B.tube([[0.55, 1.9, -3.1], [0.95, 0.8, -3.9], [1.3, -0.3, -4.6]], 0.045, 4);
}

// blown glass that hangs: each piece is hung from (x, y, z) and swings as one (sw: its sway in metres)
// a little chandelier: a stem of milk-glass knops, curved arms of one colour each ending in a cup with a clear drop under it
function chandelierGeo(B, x, y, z, s, col, arms, sw) {
  B.mat(MILK, 0.5, 20, sw); B.lathe(x, z, [[y, 0.03 * s], [y - 0.22 * s, 0.11 * s], [y - 0.38 * s, 0.045 * s], [y - 0.9 * s, 0.055 * s], [y - 1.1 * s, 0.22 * s], [y - 1.3 * s, 0.29 * s], [y - 1.5 * s, 0.15 * s], [y - 1.72 * s, 0.045 * s]], 6);
  for (let k = 0; k < arms; k++) {
    const a = (k / arms) * TAU + 0.3, ca = Math.cos(a), sa = Math.sin(a), ex = x + ca * 0.95 * s, ez = z + sa * 0.95 * s;
    B.mat(col, 0.6, 20, sw); B.tube([[x + ca * 0.2 * s, y - 1.28 * s, z + sa * 0.2 * s], [x + ca * 0.62 * s, y - 1.55 * s, z + sa * 0.62 * s], [ex, y - 1.2 * s, ez]], 0.036 * s, 4);
    B.lathe(ex, ez, [[y - 1.22 * s, 0.03 * s], [y - 1.12 * s, 0.14 * s], [y - 1.07 * s, 0.14 * s]], 5);
    B.mat(WHITE, 0.25, 20, sw); B.blob(ex, y - 1.42 * s, ez, 0.07 * s, 0.13 * s, 0.07 * s, 2, 5);
  }
  B.mat(col, 0.5, 20, sw); B.blob(x, y - 1.88 * s, z, 0.1 * s, 0.17 * s, 0.1 * s, 2, 5);
}
const hangDrop = (B, x, y, z, s, col, sw) => { B.mat(col, 0.45, 20, sw); B.lathe(x, z, [[y, 0.02 * s], [y - 0.3 * s, 0.07 * s], [y - 0.72 * s, 0.27 * s], [y - 1.02 * s, 0.34 * s], [y - 1.27 * s, 0.25 * s], [y - 1.42 * s, 0.03 * s]], 7); };
const hangBubble = (B, x, y, z, s, col, sw) => { B.mat(col, 0.1, 20, sw); B.blob(x, y - 0.52 * s, z, 0.5 * s, 0.5 * s, 0.5 * s, 4, 8); B.mat(GOLDC, 0.5, 27, sw); B.blob(x, y - 1.07 * s, z, 0.07 * s, 0.1 * s, 0.07 * s, 2, 5); };
const hangGoblet = (B, x, y, z, s, col, sw) => { B.mat(col, 0.35, 20, sw); B.lathe(x, z, [[y - 0.1 * s, 0.31 * s], [y - 0.5 * s, 0.27 * s], [y - 0.68 * s, 0.1 * s], [y - 0.74 * s, 0.04 * s], [y - 1.12 * s, 0.04 * s], [y - 1.18 * s, 0.1 * s], [y - 1.25 * s, 0.27 * s], [y - 1.28 * s, 0.27 * s]], 7); };
// a garland of blown glass strung from a to b ([x, y, z]) on a thin cord of white-thread cane, sagging by `sag` metres: drops,
// bubbles, small goblets and one little chandelier at its lowest point, of clear and single-coloured glass, each on a thread of
// its own length and each swinging on its own. Nothing on it is flat or square: it is glassware hung out, not a line of flags.
// gap: [t0, t1], a stretch of the cord (fractions of its length) on which nothing is hung: the pieces are hung along the rest.
function garlandGeo(B, a, b, sag, n, cols, size, gap) {
  const g0 = gap ? gap[0] : 0, gw = gap ? Math.min(0.6, gap[1] - gap[0]) : 0, place = (t) => { const f = t * (1 - gw); return f < g0 ? f : f + gw; };
  const NP = 16, at = (t) => [mix(a[0], b[0], t), mix(a[1], b[1], t) - sag * 4 * t * (1 - t), mix(a[2], b[2], t)], pts = [];
  for (let k = 0; k <= NP; k++) pts.push(at(k / NP));
  const rad = 0.045 * size, seed = a[0] * 0.37 + a[2] * 0.11, mid = (n - 1) >> 1;
  B.mat(MILK, 0.7, 25); B.tube(pts, rad, 4, { turns: 3, sway: (t) => 0.05 * size * Math.sin(Math.PI * t) });
  for (const e of [a, b]) { B.mat(GOLDC, 0.5, 27, 0); B.blob(e[0], e[1], e[2], rad * 3.2, rad * 3.2, rad * 3.2, 2, 5); }
  for (let k = 0; k < n; k++) {
    const hk = hash1(k * 3.3 + seed), t = place((k + 0.5 + 0.5 * (hash1(k * 7.1 + seed) - 0.5)) / n), p = at(t), kind = k === mid ? 3 : (k + ((seed * 3) | 0) + 60) % 3;
    const len = size * (k === mid ? 0.4 : 0.35 + 0.95 * hk), s0 = 0.05 * size * Math.sin(Math.PI * t), sw = s0 + 0.1 * len + 0.07 * size, col = cols[k % cols.length];
    B.mat(MILK, 0.6, 20, 0); B.tube([[p[0], p[1], p[2]], [p[0], p[1] - len, p[2]]], rad * 0.45, 3, { sway: (q) => mix(s0, sw, q) });
    const y = p[1] - len, sc = size * (0.72 + 0.4 * hash1(k * 5.7 + seed));
    if (kind === 3) chandelierGeo(B, p[0], y, p[2], size * 1.15, col, 6, sw);
    else if (kind === 0) hangDrop(B, p[0], y, p[2], sc, col, sw);
    else if (kind === 1) hangBubble(B, p[0], y, p[2], sc * 1.15, k % 2 ? WHITE : MILK, sw);
    else hangGoblet(B, p[0], y, p[2], sc * 1.1, k % 4 === 1 ? WHITE : col, sw);
  }
  B.sway = 0;
}
// a promenader of milk glass under a parasol (origin at the feet); the parasol takes the instance colour
function walkerGeo(B) {
  B.mat(MILK, 0.5, 20); B.lathe(0, 0, [[0, 0.2], [0.9, 0.24], [1.35, 0.26], [1.5, 0.1], [1.6, 0.14], [1.78, 0.03]], 6);
  B.mat(MILK, 0.7, 25); B.tube([[0.2, 1.0, 0], [0.27, 2.4, 0]], 0.035, 3);
  B.mat(WHITE, 0.3, 0, 0.012); B.lathe(0.27, 0, [[2.15, 1.02], [2.28, 0.96], [2.55, 0.5], [2.7, 0.04]], 9, { mod: (a) => 1 + 0.05 * Math.cos(a * 9) });
  B.sway = 0;
}
// the vaporetto: a long waterbus of one colour of glass, a cabin of bullseye panes under a milk roof, a striped funnel, a lantern
// on its bow post and parasols on the foredeck; bow toward +Z
function vaporettoGeo(B, col, parasols) {
  const v0 = B.count, i0 = B.i.length, NS = 12, L = 7.4, dark = [col[0] * 0.55, col[1] * 0.55, col[2] * 0.55];
  B.mat(col, 0.6, 20);
  const sec = (t) => { const at = Math.abs(t); return [1.62 * Math.pow(Math.max(0, 1 - Math.pow(at, t > 0 ? 2.3 : 4.5)), 0.6) + 0.05, 0.95 + 0.6 * Math.pow(Math.max(t, 0), 3), -0.15 + 0.6 * Math.pow(Math.max(t, 0), 4)]; };
  for (let s2 = 0; s2 <= NS; s2++) { const t = -1 + (2 * s2) / NS, [b, yg, yk] = sec(t); for (const q of [[-b, yg], [-b * 0.86, yk + 0.15], [0, yk], [b * 0.86, yk + 0.15], [b, yg]]) B.v(q[0], q[1], t * L, 0, 1, 0, q[0], t * L); }
  for (let s2 = 0; s2 < NS; s2++) for (let j = 0; j < 4; j++) { const a = v0 + s2 * 5 + j, b = a + 1, c = a + 5, d = c + 1; B.i.push(a, b, c, b, d, c); }
  B.smooth(v0, i0);
  B.mat(dark, 0.8, 20); B.quad([-1.5, 0.86, 5.6], [1.5, 0.86, 5.6], [1.5, 0.86, -7.0], [-1.5, 0.86, -7.0]);
  B.mat(MILK, 0.6, 20); B.box(0, 0.98, -0.6, 3.36, 0.12, 13.2);                                  // a milk rubbing strake
  // the cabin: bullseye panes all round, thick corner posts, a milk roof with a gold finial at each corner
  const x1 = 1.3, za = -5.4, zb = 1.2, y0 = 1.0, y1 = 3.0;
  B.mat(col, 0.12, 21); B.us = 1; B.vs = 1;
  B.wall(-x1, zb, x1, zb, y0, y1); B.wall(x1, zb, x1, za, y0, y1); B.wall(x1, za, -x1, za, y0, y1); B.wall(-x1, za, -x1, zb, y0, y1);
  for (const x of [-x1, x1]) for (const z of [za, zb, (za + zb) / 2]) { B.mat(col, 1.0, 20); B.box(x, (y0 + y1) / 2, z, 0.2, y1 - y0, 0.2); }
  B.mat(MILK, 0.6, 20); B.box(0, y1 + 0.1, (za + zb) / 2, 2 * x1 + 0.5, 0.2, zb - za + 0.6, true);
  for (const x of [-x1, x1]) for (const z of [za, zb]) { B.mat(GOLDC, 0.5, 27); B.blob(x, y1 + 0.36, z, 0.16, 0.2, 0.16, 2, 5); }
  B.mat(col, 0.5, 26); B.lathe(0, -2.4, [[y1 + 0.2, 0.36], [y1 + 1.5, 0.32], [y1 + 1.62, 0.44], [y1 + 1.7, 0.4]], 8, { turns: 2 });   // the funnel, barber-striped
  lanternGeo(B, 0, 2.9, 6.3, 1.9, lin(GLASS.amber));
  for (let k = 0; k < parasols.length; k++) {                                                  // passengers on the foredeck
    const x = (k % 2 ? 0.75 : -0.75), z = 2.2 + ((k / 2) | 0) * 1.25;
    B.mat(MILK, 0.5, 20); B.lathe(x, z, [[0.86, 0.19], [1.7, 0.22], [2.12, 0.24], [2.26, 0.1], [2.35, 0.13], [2.5, 0.03]], 5);
    B.mat(MILK, 0.7, 25); B.tube([[x + 0.22, 1.8, z], [x + 0.27, 3.1, z]], 0.03, 3);
    B.mat(parasols[k], 0.25, 20, 0.012); B.lathe(x + 0.27, z, [[2.9, 0.9], [3.0, 0.86], [3.24, 0.45], [3.36, 0.04]], 9, { mod: (a) => 1 + 0.05 * Math.cos(a * 9) });
  }
  B.mat(MILK, 0.7, 25, 0); B.tube([[0, 0.9, -7.1], [0, 3.3, -7.3]], 0.04, 4, { turns: 3 });                                          // the stern staff and its pennant
  B.mat(parasols[0], 0.2, 29);
  { const a = B.v(0, 3.25, -7.3, 1, 0, 0, 0, 1, 0), b = B.v(0, 2.6, -7.3, 1, 0, 0, 0, 0, 0), c = B.v(0, 2.7, -8.5, 1, 0, 0, 1, 0, 0.14), d = B.v(0, 3.2, -8.5, 1, 0, 0, 1, 1, 0.14); B.i.push(a, b, c, a, c, d, a, c, b, a, d, c); }
  B.sway = 0;
}
// the glass barge moored off the left quay beyond the great bridge: a broad peata of dark amethyst glass loaded with finished work,
// three chandeliers hung from a rack of white-thread cane and ranks of goblets and vases of coloured glass along both gunwales,
// its crew two lathe-turned milk-glass figures, one at the sweep and one in the bow. All of it is cold glass: nothing on it glows.
// Local frame: bow toward +Z.
function bargeGeo(B, cols) {
  const v0 = B.count, i0 = B.i.length, NS = 10, L = 6.6;
  B.mat(lin('#3a2552'), 0.6, 20);
  const sec = (t) => { const at = Math.abs(t); return [2.55 * Math.pow(Math.max(0, 1 - Math.pow(at, 3.6)), 0.6) + 0.05, 0.95 + 0.55 * Math.pow(at, 3), -0.15 + 0.5 * Math.pow(at, 4)]; };
  for (let s2 = 0; s2 <= NS; s2++) { const t = -1 + (2 * s2) / NS, [b, yg, yk] = sec(t); for (const q of [[-b, yg], [-b * 0.86, yk + 0.15], [0, yk], [b * 0.86, yk + 0.15], [b, yg]]) B.v(q[0], q[1], t * L, 0, 1, 0, q[0], t * L); }
  for (let s2 = 0; s2 < NS; s2++) for (let j = 0; j < 4; j++) { const a = v0 + s2 * 5 + j, b = a + 1, c = a + 5, d = c + 1; B.i.push(a, b, c, b, d, c); }
  B.smooth(v0, i0);
  B.mat(lin('#6b5a86'), 0.8, 20); B.quad([-2.3, 0.86, 5.2], [2.3, 0.86, 5.2], [2.3, 0.86, -5.2], [-2.3, 0.86, -5.2]);
  for (const x of [-2.42, 2.42]) { B.mat(MILK, 0.6, 20); B.box(x, 1.0, 0, 0.16, 0.14, 9.2); }                         // a milk rubbing strake along each gunwale
  // the rack: four posts and a ridge rod of white-thread cane, the three chandeliers hung from it
  for (const x of [-2.0, 2.0]) for (const z of [-3.5, 3.3]) { B.mat(MILK, 0.7, 25); B.lathe(x, z, [[0.86, 0.1], [4.9, 0.075]], 5, { turns: 4 }); B.mat(GOLDC, 0.5, 27); B.blob(x, 5.02, z, 0.15, 0.17, 0.15, 2, 5); }
  B.mat(MILK, 0.7, 25);
  for (const z of [-3.5, 3.3]) B.tube([[-2.0, 4.86, z], [0, 5.3, z], [2.0, 4.86, z]], 0.06, 4, { turns: 3 });
  B.tube([[0, 5.3, -3.5], [0, 5.3, 3.3]], 0.06, 4, { turns: 5 });
  chandelierGeo(B, 0, 5.26, -2.25, 1.22, cols[0], 6, 0.015); chandelierGeo(B, 0, 5.26, 0, 1.36, cols[1], 6, 0.018); chandelierGeo(B, 0, 5.26, 2.2, 1.22, cols[2], 6, 0.015);
  // goblets and tall vases standing in ranks on a bench along each gunwale
  const goblet = [[0, 0.21], [0.04, 0.21], [0.08, 0.05], [0.44, 0.05], [0.52, 0.13], [0.76, 0.27], [1.12, 0.31]], vase = [[0, 0.17], [0.2, 0.31], [0.62, 0.35], [1.02, 0.15], [1.32, 0.11], [1.44, 0.21]];
  for (const sd of [-1, 1]) {
    B.mat(MILK, 0.6, 20, 0); B.box(sd * 1.72, 1.1, -0.1, 0.86, 0.48, 6.9, true);
    for (let k = 0; k < 8; k++) {
      const z = -3.1 + k * 0.86, tall = (k + (sd > 0 ? 1 : 0)) % 3 === 0, pr = (tall ? vase : goblet).map((q) => [1.34 + q[0] * (tall ? 1.05 : 0.95), q[1]]);
      B.mat(cols[(k + (sd > 0 ? 2 : 0)) % cols.length], 0.35, 20, 0); B.lathe(sd * 1.72, z, pr, 7);
    }
  }
  // the crew
  for (const [x, z] of [[0.5, -5.2], [-0.4, 4.7]]) {
    B.mat(MILK, 0.5, 20, 0); B.lathe(x, z, [[0.86, 0.21], [1.8, 0.25], [2.32, 0.28], [2.47, 0.11], [2.58, 0.15], [2.78, 0.03]], 6);
    B.lathe(x, z, [[2.71, 0.33], [2.78, 0.1]], 6);
  }
  B.mat(MILK, 0.7, 25, 0); B.tube([[0.75, 2.15, -5.1], [1.3, 1.0, -6.3], [1.8, -0.35, -7.4]], 0.05, 4);                // the sweep
  B.tube([[-0.68, 0.86, 4.9], [-0.7, 3.5, 5.0]], 0.035, 4);                                                           // and a boathook, held upright in the bow
  B.sway = 0;
}

// ---------- layout helpers ----------
function polyline(pts) {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const length = cum[cum.length - 1];
  return {
    pts, cum, length,
    at(d) {
      const dd = Math.min(Math.max(d, 0), length); let i = 1; while (i < pts.length - 1 && cum[i] < dd) i++;
      const a = pts[i - 1], b = pts[i], l = cum[i] - cum[i - 1] || 1, t = (dd - cum[i - 1]) / l;
      return { x: mix(a[0], b[0], t), z: mix(a[1], b[1], t), tx: (b[0] - a[0]) / l, tz: (b[1] - a[1]) / l };
    },
  };
}

export default {
  id: 'blown-city',
  name: 'The Blown City',
  category: 'city',
  weirdness: 0.4,
  media: ['water', 'open'],
  async build(ctx) {
    const rng = ctx.rng, detail = ctx.quality?.detail ?? 1, vary = ctx.vary || {};
    const scene = new THREE.Scene();

    // ---- what this visit looks like
    const lr = rng.fork('look');
    const rolled = lr.pick(['night', 'morning', 'morning', 'dawn', 'frost', 'morning']);
    let lookId = vary.hour === 'night' ? 'night' : vary.hour === 'dawn' ? 'dawn' : vary.hour === 'day' || vary.hour === 'golden' ? 'morning' : rolled;        // (the golden hour is no longer one of this world's looks: asked for, it is the pearl morning)
    const castRoll = lr(), castId = castRoll > 0.5 ? 'lagoon' : castRoll > 0.22 ? 'ember' : 'milk';
    const carnival = lr.chance(0.3), rare = !!vary.rare, density = vary.density ?? 1;
    const towerRoll = lr(), towerHex = towerRoll < 0.55 ? PALETTE[3] : towerRoll < 0.8 ? PALETTE[2] : '#0f8f5c';
    const xr = lr.fork('extra'), yr = lr.fork('more');                                                // everything added later draws from here, so the older layout keeps its seeds
    if ((!vary.hour || vary.hour === 'any') && lookId === 'morning') lr();                                                     // (the draw that once gave a share of the mornings to a golden hour: kept, so every other roll stands; the mornings stay pearl)
    const look = LOOKS[lookId], night = lookId === 'night', frost = lookId === 'frost';
    const uOn = look.late ? 0.46 : 0.21;                                       // when the sun breaks and the beams come on

    const el = (look.el * Math.PI) / 180, el0 = (look.el0 * Math.PI) / 180, az = Math.atan2(0.80, 0.56);
    const sunAt = (e, out) => out.set(Math.sin(az) * Math.cos(e), Math.sin(e), Math.cos(az) * Math.cos(e));
    const SUN = sunAt(el0, new THREE.Vector3()), SUN_HI = sunAt(el, new THREE.Vector3());      // SUN is where the sun stands now (it climbs as we leave the side canal); SUN_HI where it stands over the grand canal
    const hX = -Math.sin(az), hZ = -Math.cos(az), pX = hZ, pZ = -hX, tanEl = Math.tan(el), tanEl0 = Math.tan(el0);      // light travels along h in plan; q runs along p
    const pal = PALETTE.slice(); pal[0] = look.fog; pal[1] = look.lagoon;
    const GU = makeGlassUniforms(pal, { sunDir: SUN, sunColor: look.sun, lid: 110 });
    GU.uSunCol.value.set(look.sun).multiplyScalar(look.sunGain);
    GU.uLagoon.value.set(look.lagoon).lerp(C3(look.fog), 0.25);
    const fogCol = C3(look.fog);
    scene.fog = new THREE.FogExp2(fogCol.clone(), look.dens[0]);
    scene.background = fogCol.clone();

    // ---- the route: side canal due south, the swing onto the grand canal, the slow bend, the basin, the last straight
    const PP = [[0, 0], [0, 30], [0, 60], [0, 90], [-3, 112], [-16, 134], [-36, 158], [-58, 186], [-80, 218], [-100, 252], [-118, 288], [-132, 322], [-142, 356], [-144, 370], [-147.3, 388.8], [-156.9, 405.4], [-171.5, 417.6], [-190.6, 428.6], [-209.6, 439.6], [RING[0], RING[1]]];
    const path = makePath(PP.map((q) => [q[0], EYE, q[1]]));
    const duration = 40, LEN = path.length;
    const tmpA = new THREE.Vector3(), tmpB = new THREE.Vector3();
    const offs = (d, off) => { path.posAtDist(d, tmpA); path.tangentAtDist(d, tmpB); const l = Math.hypot(tmpB.x, tmpB.z) || 1; return [tmpA.x + (tmpB.z / l) * off, tmpA.z - (tmpB.x / l) * off]; };   // off > 0 = to the left
    const uAt = (d) => d / LEN, D_BRIDGE = 270, D_BASIN = 345, uBridge = uAt(D_BRIDGE);

    // banks. R: right bank from the canal mouth; L: left bank (sun side) with its run to the north-east; N: north bank east of the mouth
    const Rp = [[-5, 112]], Lp = [];
    // the left quay closes from 35 m to 17 m and follows the hook to the ring, runs on past it, and wraps round behind the tower
    for (let d = 152; d <= LEN - 22; d += 12) { if (d <= D_BASIN + 1) Rp.push(offs(d, -15)); Lp.push(offs(d, mix(35, 17, sstep(300, 372, d)))); }
    const nLane = Lp.filter((_, i) => 152 + i * 12 <= 300).length;                // the lanes of travelling gondolas stop where the quay closes in
    for (const q of [[-8, 17], [20, 20], [50, 28], [80, 40], [110, 54], [140, 62]]) Lp.push(RH(q[0], q[1]));
    const nQuay = Lp.length;
    for (const q of [[156, 50], [165, 24], [166, -10], [160, -38], [152, -60]]) Lp.push(RH(q[0], q[1]));
    { const a = Lp[0], b = Lp[1], l = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (a[0] - b[0]) / l, uz = (a[1] - b[1]) / l; for (let k = 1; k <= 8; k++) Lp.unshift([a[0] + ux * k * 20, a[1] + uz * k * 20]); }
    const Rend = Rp[Rp.length - 1];
    const bankR = polyline(Rp), bankN = polyline([[5, 112], [5 + 0.766 * 170, 112 - 0.643 * 170]]);
    const bankL = polyline(Lp);
    const dOld = bankL.cum[8 + Math.round((D_BASIN - 152) / 12)], dQuay = bankL.cum[8 + nQuay - 1];      // along the left bank: where it used to end, where the quay turns behind the tower
    // the basin is a pocket between the right bank's end, the north shore, a west shore behind the tower and the quay
    const WX = TOWER[0] - 126;
    const shoreNR = polyline([Rend, [Rend[0] - 26, Rend[1] + 9], [Rend[0] - 60, Rend[1] + 6], [-300, 302], [WX, 300]]);
    const shoreW = polyline([[WX, 300], [WX - 4, TOWER[1] + 150]]);
    const canalW = polyline([[-5, 15], [-5, 110]]), canalE = polyline([[5, 15], [5, 110]]);
    const CAMPO = 36;                                                           // the flooded square: this much of the right bank is open
    await ctx.yield();

    // ---- palazzo forms
    const gr = rng.fork('geo');
    const forms = [], mkForm = (P, lod) => { const B = new GB(), dim = palazzo(B, P, gr, lod); return { geo: B.build(), tris: B.tris, ...dim, near: lod > 0, list: [] }; };
    for (const P of NEAR_FORMS) forms.push(mkForm(P, 1));
    await ctx.yield();
    for (const P of FAR_FORMS) forms.push(mkForm(P, 0));
    const NEARI = NEAR_FORMS.map((_, i) => i), FARI = FAR_FORMS.map((_, i) => NEAR_FORMS.length + i);

    // ---- houses along the banks
    const hr = rng.fork('houses'), cast = CASTS[castId], castSum = cast.reduce((a, c) => a + c[1], 0);
    let lastCol = '';
    const pickCol = () => { for (let tries = 0; tries < 6; tries++) { let r = hr() * castSum; for (const c of cast) { r -= c[1]; if (r <= 0) { if (c[0] !== lastCol || tries === 5) { lastCol = c[0]; return c[0]; } break; } } } return cast[0][0]; };
    const houses = [];
    const placeAlong = (pl, side, o) => {
      let d = o.d0 ?? 0, lastF = -1; const d1 = o.d1 ?? pl.length;
      while (d < d1 - 7) {
        const pool = o.near ? NEARI : FARI; let fi = pool[hr.int(0, pool.length - 1)]; if (fi === lastF) fi = pool[(pool.indexOf(fi) + 1) % pool.length]; lastF = fi;
        const form = forms[fi], w = form.W * hr.range(0.92, 1.14);
        if (d + w > d1 + 4) break;
        const a = pl.at(d), b = pl.at(d + w), dx = b.x - a.x, dz = b.z - a.z, l = Math.hypot(dx, dz) || 1, tx = dx / l, tz = dz / l;
        const hmax = typeof o.hMax === 'function' ? o.hMax(d) : o.hMax, sy = Math.min(1.42, Math.max(0.82, hr.range(o.hMin, hmax) / form.H));
        const name = pickCol(), c = C3(GLASS[name]); c.offsetHSL(hr.range(-0.012, 0.012), 0, hr.range(-0.03, 0.03));
        houses.push({ x: (a.x + b.x) / 2, z: (a.z + b.z) / 2, nx: side > 0 ? tz : -tz, nz: side > 0 ? -tx : tx, tx, tz, w: l, sx: l / form.W, sy, h: form.H * sy + 0.3, depth: form.Dp, fi, near: o.near, col: c, name, bank: o.bank, d });
        form.list.push(houses[houses.length - 1]);
        d += w + (hr.chance(o.gap ?? 0.18) ? hr.range(1.8, 3.4) : 0.06);
      }
    };
    placeAlong(canalW, 1, { near: true, hMin: 16, hMax: 20, bank: 'W', gap: 0.12 });
    placeAlong(canalE, -1, { near: true, hMin: 16, hMax: 20.5, bank: 'E', gap: 0.12 });
    placeAlong(bankR, 1, { near: true, d0: CAMPO, hMin: 18, hMax: 27, bank: 'R' });
    placeAlong(bankL, -1, { near: true, d0: 118, d1: dQuay, hMin: 18.5, hMax: (d) => (d > dOld ? 28 : d > 225 ? 21 : 27), bank: 'L', gap: 0.12 });
    placeAlong(bankL, -1, { near: false, d0: dQuay + 2, hMin: 23, hMax: 31, bank: 'B', gap: 0.1 });      // the row behind the tower: its foot stands against glass
    placeAlong(bankL, -1, { near: false, d0: 0, d1: 116, hMin: 18, hMax: 26, bank: 'L' });
    placeAlong(bankN, -1, { near: false, d0: 15, hMin: 17, hMax: 25, bank: 'N' });
    for (const [pl, side] of [[shoreNR, 1], [shoreW, 1]]) placeAlong(pl, side, { near: false, hMin: 15, hMax: 27, bank: 'S', gap: 0.3 });
    // the back of the flooded square and a second, taller row behind the right bank
    placeAlong(polyline([[-17, 89], [-51, 112], [-62, 120]]), 1, { near: false, hMin: 17, hMax: 24, bank: 'C' });
    await ctx.yield();

    // ---- the house lookup: which colour of glass stands up-sun of any point (see CITY_GLSL in the hero file)
    const QW = 256; let qMin = 1e9, qMax = -1e9;
    const shade = houses.filter((h) => h.bank === 'L' || h.bank === 'E');
    for (const h of shade) for (const sg of [-1, 1]) { const q = (h.x + h.tx * sg * h.w / 2) * pX + (h.z + h.tz * sg * h.w / 2) * pZ; qMin = Math.min(qMin, q); qMax = Math.max(qMax, q); }
    qMin -= 12; qMax += 12;
    const hd = new Float32Array(QW * 2 * 4), binC = new Float32Array(QW);
    for (const h of shade) {
      let qa = (h.x - h.tx * h.w / 2) * pX + (h.z - h.tz * h.w / 2) * pZ, qb = (h.x + h.tx * h.w / 2) * pX + (h.z + h.tz * h.w / 2) * pZ; if (qa > qb) { const t = qa; qa = qb; qb = t; }
      const i0 = Math.max(0, Math.floor(((qa - qMin) / (qMax - qMin)) * QW)), i1 = Math.min(QW - 1, Math.ceil(((qb - qMin) / (qMax - qMin)) * QW)), al = h.x * hX + h.z * hZ, pr = h.bank === 'L' ? 2 : 1;
      for (let i = i0; i <= i1; i++) {
        if (binC[i] > pr) continue; binC[i] = pr;
        hd[i * 4] = h.col.r; hd[i * 4 + 1] = h.col.g; hd[i * 4 + 2] = h.col.b; hd[i * 4 + 3] = h.h;
        hd[(QW + i) * 4] = al; hd[(QW + i) * 4 + 1] = Math.min(h.h / tanEl0, h.bank === 'L' ? 130 : 40); hd[(QW + i) * 4 + 2] = Math.min(h.h / tanEl, h.bank === 'L' ? 130 : 40); hd[(QW + i) * 4 + 3] = 1;      // (how far its shade reaches under the low sun of the side canal, and under the sun of the grand canal)
      }
    }
    const hd16 = new Uint16Array(hd.length); for (let i = 0; i < hd.length; i++) hd16[i] = THREE.DataUtils.toHalfFloat(hd[i]);
    const houseTex = new THREE.DataTexture(hd16, QW, 2, THREE.RGBAFormat, THREE.HalfFloatType);
    houseTex.magFilter = houseTex.minFilter = THREE.LinearFilter; houseTex.wrapS = houseTex.wrapT = THREE.ClampToEdgeWrapping; houseTex.generateMipmaps = false; houseTex.needsUpdate = true;
    const bridgeC = offs(D_BRIDGE, 10), bridgeA = offs(D_BRIDGE, 36), bridgeB = offs(D_BRIDGE, -16);
    const accentHex = castId === 'ember' ? GLASS.aqua : GLASS.cobalt;                                         // the great bridge
    const CITY = {
      uHouse: { value: houseTex }, uQ: { value: new THREE.Vector4(qMin, 1 / (qMax - qMin), tanEl0, 8.5) }, uSunPH: { value: new THREE.Vector4(pX, pZ, hX, hZ) },
      uBridge: { value: new THREE.Vector4(bridgeA[0], bridgeA[1], bridgeB[0], bridgeB[1]) }, uBridgeCol: { value: C3(accentHex) },
      uBoat: { value: new THREE.Vector4(0, 0, 0, 1) }, uWave: { value: new THREE.Vector4(-200, night ? 0.5 : 0.3, 1, night ? 0.4 : 1) }, uMouth: { value: new THREE.Vector2(0, MOUTH_Z) },
      uInner: { value: look.inner }, uRake: { value: new THREE.Color(0, 0, 0) },
      uShaft: { value: null }, uShaftQ: { value: new THREE.Vector4(0, 1, 0, 1) }, uShaftN: { value: new THREE.Vector4(1, 1, 0, 0) },       // the harp's lookup, filled where the shafts are made
    };
    const glassM = (o = {}) => makeGlassMaterial({ shared: GU, city: CITY, color: '#ffffff', vertexColors: true, ...o });

    // ---- instanced palazzi, their reflections as rippled cards under the water
    const M4 = new THREE.Matrix4(), Q4 = new THREE.Quaternion(), S3 = new THREE.Vector3(), P3 = new THREE.Vector3(), YA = new THREE.Vector3(0, 1, 0), E3 = new THREE.Euler();
    const nearMat = glassM({ thickness: 0.24, interior: 0.9, rim: 0.9, spec: 0.5 }), farMat = glassM({ thickness: 0.24, interior: 0.45, rim: 0.6, spec: 0.12 });
    const canalMat = glassM({ thickness: 0.3, interior: 0.85, rim: 0.8, spec: 0.6 });        // seen from 5 m: a bright rim, a darker core and both highlights
    for (const f of forms) {
      if (!f.list.length) { f.geo.dispose(); continue; }
      const inCanal = f.list.filter((h) => h.bank === 'W' || h.bank === 'E'), rest = f.list.filter((h) => h.bank !== 'W' && h.bank !== 'E');
      for (const [list, mat] of [[inCanal, canalMat], [rest, f.near ? nearMat : farMat]]) {
        if (!list.length) continue;
        const im = new THREE.InstancedMesh(f.geo, mat, list.length);
        list.forEach((h, i) => {
          Q4.setFromAxisAngle(YA, Math.atan2(h.nx, h.nz)); M4.compose(P3.set(h.x, 0, h.z), Q4, S3.set(h.sx, h.sy, 1)); im.setMatrixAt(i, M4); im.setColorAt(i, h.col);
        });
        im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true; im.computeBoundingSphere(); scene.add(im);
      }
    }
    await ctx.yield();
    {
      const cards = houses.filter((h) => h.bank !== 'S' || path.nearestXZ(h.x, h.z).dist < 260).map((h) => ({ x: h.x, z: h.z, nx: h.nx, nz: h.nz, w: h.w, h: h.h, col: h.col }));
      for (const bank of ['W', 'E']) {                                          // the court-facing end walls of the first two canal houses are mirrored too
        const h = houses.find((q) => q.bank === bank); if (h) cards.push({ x: h.x - h.nx * h.depth / 2, z: h.z - h.w / 2, nx: 0, nz: -1, w: h.depth, h: h.h, col: h.col });
      }
      const cg = new THREE.PlaneGeometry(1.24, 1); cg.translate(0, -0.5, 0);
      const cm = new THREE.ShaderMaterial({
        fog: true, transparent: true, depthWrite: false, uniforms: { ...THREE.UniformsUtils.merge([THREE.UniformsLib.fog]), uTime: GU.uTime, uFogCol: GU.uFogCol, uInner: CITY.uInner },
        vertexShader: /* glsl */`
          #include <common>
          #include <fog_pars_vertex>
          varying vec2 vUv; varying vec3 vCol, vWP; varying vec2 vXn;
          void main(){
            vec3 sc = vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), 1.);
            vUv = vec2(position.x * sc.x, -position.y * sc.y); vCol = instanceColor; vXn = vec2(position.x, sc.x);
            vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.); vWP = wp.xyz;
            vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */`
          #include <common>
          #include <fog_pars_fragment>
          uniform float uTime, uInner; uniform vec3 uFogCol; varying vec2 vUv; varying vec3 vCol, vWP; varying vec2 vXn;
          void main(){
            float dq = clamp(0.12 + vUv.y * 0.09, 0., 1.5);
            float rip = (sin(vUv.y * 1.9 + uTime * 1.6 + vWP.x * 0.4 + vWP.z * 0.3) * 0.26 + sin(vUv.y * 5.3 - uTime * 2.3 + vWP.x * 0.7) * 0.09) * dq;
            vec2 uv = vUv + vec2(rip, 0.);
            float xe = abs(vXn.x + rip * 1.5 / max(vXn.y, 1.));                  // the side edges ripple too: no straight line anywhere
            float edge = 1. - smoothstep(0.42, 0.5, xe);
            float pier = smoothstep(0.3, 0.42, abs(fract(uv.x / 3.5) - 0.5));
            float fl = fract(uv.y / 4.4);
            float win = (1. - pier) * smoothstep(0.12, 0.3, fl) * (1. - smoothstep(0.7, 0.9, fl));
            vec3 tint = pow(clamp(vCol, 0.01, 1.), vec3(0.55));
            vec3 col = tint * tint * (0.8 + 0.2 * uFogCol) * 1.3 * (0.95 - 0.34 * win) + tint * uInner * (0.25 + 1.3 * win);
            float brk = 0.5 + 0.5 * sin(vUv.y * 2.7 - uTime * 1.4 + vWP.x * 0.31 + vWP.z * 0.23 + 2. * sin(vUv.y * 0.9 + uTime * 0.5));
            float a = exp(-vUv.y * 0.05) * edge * (1. - 0.55 * smoothstep(0.35, 0.9, brk) * clamp(vUv.y * 0.2, 0., 1.)) * 0.92;
            float fogK = exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
            gl_FragColor = vec4(max(col, 0.), a * (0.3 + 0.7 * fogK));
            #include <fog_fragment>
          }`,
      });
      const im = new THREE.InstancedMesh(cg, cm, cards.length);
      cards.forEach((h, i) => { Q4.setFromAxisAngle(YA, Math.atan2(h.nx, h.nz)); M4.compose(P3.set(h.x, -0.05, h.z), Q4, S3.set(h.w, h.h, 1)); im.setMatrixAt(i, M4); im.setColorAt(i, h.col); });
      im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true; im.computeBoundingSphere(); im.renderOrder = 1; scene.add(im);
      // the bed of the lagoon: where nothing is mirrored the water is celadon, not fog white
      const bed = new THREE.Mesh(new THREE.PlaneGeometry(3200, 3200).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: (night ? C3(look.lagoon).offsetHSL(0.012, 0.1, -0.02) : C3(look.lagoon).offsetHSL(0.02, 0.24, -0.21)).multiplyScalar(night ? 0.8 : 0.9), fog: true, depthTest: false, depthWrite: false }));
      bed.position.set(-120, -0.08, 380); bed.name = 'bed'; bed.renderOrder = -0.5; bed.frustumCulled = false; scene.add(bed);
    }

    // ---- props baked into one mesh: bridges, lantern clusters, trees, lanterns, pigeons on the sills
    const pr = rng.fork('props'), PB = new GB(), flames = [], accent = lin(accentHex);
    const parasolCols = ['#C2183A', '#F2A62E', '#1E4FA8', '#2FB5A6', '#7B4BB0', '#EDE7DC', '#E27892'].map(lin);
    for (const z of [34, 101]) {                                                 // the first footbridge, with its amethyst wisteria, is what the portal shows; the second frames the canal's mouth
      PB.m = new THREE.Matrix4().makeTranslation(0, 0, z);
      footbridgeGeo(PB, lin(z === 34 ? (castId === 'milk' ? GLASS.celadon : GLASS.milk) : castId === 'ember' ? GLASS.aqua : GLASS.rose), z === 34 ? pr : xr, z === 34 ? Math.max(0.8, detail) : 0.55);
      lanternGeo(PB, 0, 5.95, 0, -2.1, lin(GLASS.amber)); flames.push([0, 5.95, z, z === 34 ? (night ? 0.45 : 2.0) : night ? 0.7 : 1.25]);
    }
    PB.m = null;
    // three clusters of blown lanterns on wall brackets over the first metres of the canal, each lantern its own colour of glass
    for (const [sd, z, cols] of [[-1, 18.5, ['ruby', 'amber', 'aqua']], [1, 24, ['cobalt', 'rose', 'amber']], [-1, 29.5, ['amethyst', 'amber', 'celadon']]]) {
      PB.mat(MILK, 0.7, 25); PB.tube([[sd * 5.0, 7.75, z], [sd * 4.2, 7.9, z], [sd * 3.3, 7.75, z]], 0.07, 4, { turns: 3 });
      PB.mat(GOLDC, 0.5, 27); PB.blob(sd * 3.3, 7.75, z, 0.09, 0.09, 0.09, 2, 5);
      for (let k = 0; k < 3; k++) {
        const x = sd * (4.45 - k * 0.5), y = [6.9, 6.1, 6.6][k], zz = z + (k - 1) * 0.42;
        lanternGeo(PB, x, y, zz, -(7.5 - y), lin(GLASS[cols[k]])); flames.push([x, y, zz, k === 1 ? 1.25 : 0.95]);
      }
    }
    { // the two end walls that face the entry court: a balcony, window boxes and a wall lantern each, so they read as glass houses and not as panels
      const flw = [lin('#C2183A'), lin('#E27892'), lin('#F2A62E'), lin('#d8344e')];
      for (const bank of ['W', 'E']) {
        const h = houses.find((q) => q.bank === bank); if (!h) continue;
        const f = forms[h.fi], zw = h.z - h.w / 2 - 0.03, xc = h.x - h.nx * (f.Dp / 2), y1 = f.gH * h.sy, hc = [Math.min(1, h.col.r * 1.15 + 0.02), Math.min(1, h.col.g * 1.15 + 0.02), Math.min(1, h.col.b * 1.15 + 0.02)];
        PB.m = new THREE.Matrix4().makeRotationY(Math.PI).setPosition(xc, 0, zw);
        PB.mat(MILK, 0.5, 20); PB.box(0, y1, 0.1, f.Dp + 0.3, 0.24, 0.34);
        balcony(PB, 0, y1 + 0.12, Math.min(f.Dp - 3.5, 6.5), 0, hc, 1.0);
        for (let k = 0; (k + 1) * 3.2 <= f.Dp + 0.2; k++) {                       // under the painted windows of the second floor (cells of 3.2 m from the wall's own start)
          const wxw = bank === 'W' ? -5 - (k + 0.5) * 3.2 : 5 + f.Dp - (k + 0.5) * 3.2;
          windowBox(PB, xc - wxw, (f.gH + 4.2 + 0.85) * h.sy, 0.02, xr, flw);
        }
        PB.m = null;
        const lx = xc + h.nx * (f.Dp / 2 - 1.5);
        PB.mat(MILK, 0.7, 25); PB.tube([[lx, 5.7, zw], [lx, 5.7, zw - 1.0]], 0.07, 4);
        lanternGeo(PB, lx, 4.4, zw - 1.0, -1.3, lin(GLASS.amber)); flames.push([lx, 4.4, zw - 1.0, 1.15]);
      }
    }
    { // the great bridge, with a lantern at each end of its crown
      const ax = bridgeA[0] - bridgeB[0], az2 = bridgeA[1] - bridgeB[1], l = Math.hypot(ax, az2);
      PB.m = new THREE.Matrix4().makeRotationY(Math.atan2(-az2 / l, ax / l)).setPosition(bridgeC[0], 0, bridgeC[1]);
      greatBridgeGeo(PB, accent, 26);
      for (const zz of [-3.6, 3.6]) { lanternGeo(PB, 0, 12.6, zz, 1.4, lin(GLASS.amber)); P3.set(0, 12.6, zz).applyMatrix4(PB.m); flames.push([P3.x, P3.y, P3.z, 1.3]); }
      // blown lanterns hung under the arch either side of the fairway (which passes at local x = -10): what the eye finds when it looks up
      for (const [lx, drop, cols] of [[-4.5, [1.5, 2.3, 1.8], ['amber', 'ruby', 'celadon']], [-16, [1.0, 1.6, 1.2], ['rose', 'amber', 'aqua']]]) {
        const R0 = (26 * 26 + 7.5 * 7.5) / 15, ys = 9 - R0 + Math.sqrt(R0 * R0 - lx * lx);
        for (let k = 0; k < 3; k++) { const x = lx + (k - 1) * 0.55, zz = (k - 1) * 1.5, y = ys - drop[k]; lanternGeo(PB, x, y, zz, -drop[k], lin(GLASS[cols[k]])); P3.set(x, y, zz).applyMatrix4(PB.m); flames.push([P3.x, P3.y, P3.z, 1.1]); }
      }
      PB.m = null;
    }
    await ctx.yield();
    const beadCols = (castId === 'ember' ? ['#2FB5A6', '#EDE7DC', '#1E4FA8'] : ['#F2A62E', '#C2183A', '#EDE7DC']).map(lin);
    for (const [x, z, sc] of [[-22, 108, 1.1], [-34, 117, 0.95], [-27.5, 123.5, 0.8]]) treeGeo(PB, x + pr.range(-1.5, 1.5), z + pr.range(-1.5, 1.5), pr, beadCols, sc);
    for (const [x, z, sd] of [[-4.45, 50, -1], [4.45, 66, 1], [-4.45, 92, -1]]) {                 // wall lanterns in the side canal
      PB.mat(MILK, 0.7, 25); PB.tube([[sd * 5.0, 5.9, z], [x, 5.9, z]], 0.07, 4);
      lanternGeo(PB, x, 4.6, z, -1.3, lin(GLASS.amber)); flames.push([x, 4.6, z, 1]);
    }
    for (const [x, z] of [[-13, 116], [-40, 128], offs(LEN - 66, -8.6), offs(LEN - 66, 8.6), offs(LEN - 27, -8.6), offs(LEN - 27, 8.6), offs(190, -13.6), offs(236, -13.6), offs(318, -13.6), offs(402, 15), offs(448, 15.4)]) { lanternGeo(PB, x, 3.7, z, 4.0, lin(GLASS.amber)); flames.push([x, 3.7, z, 1]); }
    { // glass pigeons on the sills of the side canal
      const sill = houses.filter((h) => h.bank === 'W' || h.bank === 'E'), grey = lin('#8a8c96'), neck = lin('#7B4BB0');
      for (let k = 0; k < Math.round(30 * detail); k++) {
        const h = sill[pr.int(0, sill.length - 1)], f = forms[h.fi], a = pr.range(-0.45, 0.45) * h.w, fl = pr.int(0, 1), y = (f.gH + fl * 4.2) * h.sy + 0.12 * h.sy + 0.11;
        const x = h.x + h.tx * a + h.nx * 0.2, z = h.z + h.tz * a + h.nz * 0.2, d = pr.chance(0.5) ? 1 : -1;
        PB.mat(grey, 0.6, 20, -0.007); PB.blob(x, y, z, 0.11 + 0.07 * Math.abs(h.tx), 0.1, 0.11 + 0.07 * Math.abs(h.tz), 2, 5);
        PB.mat(neck, 0.6, 20, -0.012); PB.blob(x + h.tx * d * 0.13, y + 0.12, z + h.tz * d * 0.13, 0.06, 0.07, 0.06, 2, 4);
      }
    }
    { // garlands of blown glass strung right across the grand canal: drops, bubbles, goblets and a little chandelier on a thin cord
      // (nothing is strung over the side canal: it is the hushed fog slot, its footbridges and lanterns alone)
      const kc = parasolCols, turn = (k0) => kc.slice(k0).concat(kc.slice(0, k0));
      await ctx.yield();
      // ONE EVEN RULE sets them: a cord every CORD_EVERY metres of the fairway, counted from the mouth of the grand canal (where the
      // side canal ends, d = MOUTH_Z), for as long as it stands short of the basin (D_BASIN); a cord that would hang within
      // CORD_BRIDGE metres of the great bridge's span is left out; never more than five. With 44 m that is d 154, 198, 242, 286, 330.
      // All hang alike, high and taut: 17.8 m up at both quays, 2.2 m of sag, eleven pieces each.
      // And one rule in space: nothing hangs on a cord where the line from the fairway (eye height, from the mouth up to the cord)
      // to the hot gather under the pipe (60 to 96 m up at the tower, and CORD_STAR metres to either side: the heart of its halo) passes
      // through its hanging glass. The pieces of that
      // length of cord are hung along the rest of it, so the star at the burst and the tower's hot crown are seen clear.
      const CORD_EVERY = 44, CORD_BRIDGE = 15, CORD_Y = 17.8, CORD_SAG = 2.2, CORD_STAR = 20;
      let nCord = 0;
      for (let d = MOUTH_Z + CORD_EVERY; d < D_BASIN && nCord < 5; d += CORD_EVERY) {
        if (Math.abs(d - D_BRIDGE) < CORD_BRIDGE) continue;
        const a = offs(d, mix(35, 17, sstep(300, 372, d)) - 0.35), b = offs(d + 5, -14.65), bx = b[0] - a[0], bz = b[1] - a[1];
        let t0 = 2, t1 = -1;
        for (let e = MOUTH_Z; e < d - 2; e += 2) {
          path.posAtDist(e, tmpA); const ex = tmpA.x, ez = tmpA.z, gl = Math.hypot(TOWER[0] - ex, TOWER[1] - ez);
          for (const side of [-CORD_STAR, 0, CORD_STAR]) {                         // (the gather and the heart of its halo: CORD_STAR metres to either side of it)
            const dx = TOWER[0] - ex - (TOWER[1] - ez) / gl * side, dz = TOWER[1] - ez + (TOWER[0] - ex) / gl * side, den = dx * bz - dz * bx;
            if (Math.abs(den) < 1e-6) continue;
            const sl = ((a[0] - ex) * bz - (a[1] - ez) * bx) / den, t = ((a[0] - ex) * dz - (a[1] - ez) * dx) / den;    // how far along the sight line the cord stands, and where along the cord
            if (sl <= 0 || t <= 0 || t >= 1) continue;
            for (const gy of [60, 78, 96]) { const y = EYE + (gy - EYE) * sl; if (y > CORD_Y - CORD_SAG - 4.8 && y < CORD_Y + 0.4) { t0 = Math.min(t0, t); t1 = Math.max(t1, t); } }
          }
        }
        garlandGeo(PB, [a[0], CORD_Y, a[1]], [b[0], CORD_Y, b[1]], CORD_SAG, 11, turn((nCord * 3) % kc.length), 1.5, t1 > t0 ? [Math.max(0, t0 - 0.02), Math.min(1, t1 + 0.02)] : null);
        nCord++;
      }
    }
    await ctx.yield();
    const props = new THREE.Mesh(PB.build(), glassM({ thickness: 0.1 })); props.frustumCulled = false; scene.add(props);
    await ctx.yield();

    // ---- mooring poles (each its own reflection), gulls on their tops
    const poles = [], qr = rng.fork('poles'), poleCols = (castId === 'ember' ? ['#1E4FA8', '#2FB5A6'] : ['#C2183A', '#1E4FA8']).map(C3);
    const addPole = (x, z, gull, ci) => { if (path.nearestXZ(x, z).dist < 4.4) return; poles.push({ x, z, h: qr.range(3.3, 5.2), gull: gull ?? qr.chance(0.3), c: ci ?? qr.int(0, 1) }); };
    for (const h of houses) {
      if (h.bank === 'W' || h.bank === 'E') { for (const a of [-0.3, 0.32]) addPole(h.x + h.tx * a * h.w + h.nx * 0.45, h.z + h.tz * a * h.w + h.nz * 0.45, qr.chance(0.25)); continue; }
      if ((h.bank === 'S' || h.bank === 'B') && path.nearestXZ(h.x, h.z).dist > 240) continue;
      const n = h.near ? 3 : 2, ci = qr.int(0, 1);
      for (let k = 0; k < n; k++) { const a = ((k + 0.5) / n - 0.5 + qr.range(-0.08, 0.08)) * h.w, o = qr.range(1.7, 3.1); addPole(h.x + h.tx * a + h.nx * o, h.z + h.tz * a + h.nz * o, undefined, ci); }
    }
    for (let d = 119; d < 150; d += 5.6) { const q = offs(d, -6.5); addPole(q[0], q[1], d > 125, 0); }                    // off the right bow at the burst
    for (let d = 3; d < CAMPO - 2; d += 5.2) { const a = bankR.at(d); addPole(a.x + a.tz * 0.8, a.z - a.tx * 0.8, undefined, 1); }
    for (const sx of [-1, 1]) { addPole(sx * 4.7, 11.6, true, sx > 0 ? 1 : 0); for (const px of [7.6, 10.4, 13.4]) addPole(sx * px, 13.75, px === 10.4, (px > 9 ? 1 : 0) ^ (sx > 0 ? 1 : 0)); }   // the entry court
    for (const [d, sd] of [[352, -19], [366, -31], [384, -16], [400, -34], [417, -15], [432, -27], [447, -16], [462, -30], [392, -58], [430, -64], [476, -46], [500, -30], [520, -52]]) {   // the open basin off the right bow: clusters near the path, a gull on each
      const q = offs(d, sd); for (let k = 0; k < 3; k++) addPole(q[0] + Math.cos(k * 2.1 + d) * 0.55, q[1] + Math.sin(k * 2.1 + d) * 0.55, k < 2, (k + ((d / 7) | 0)) % 2);
    }
    for (let d = LEN - 102; d < LEN - 11; d += 6.6) for (const sd of [-7, 7]) { const q = offs(d, sd); addPole(q[0], q[1], true, ((d / 6.6) | 0) % 2); }   // the last avenue
    for (const [d, sd] of [[148, 12.2], [176, 12.2], [204, 12.2], [232, 12.2], [386, 12.6], [414, 11.5]]) {                    // clusters standing in the open water left of the fairway, a gull on each
      const q = offs(d, sd); for (let k = 0; k < 3; k++) addPole(q[0] + Math.cos(k * 2.1 + d) * 0.55, q[1] + Math.sin(k * 2.1 + d) * 0.55, k < 2, (k + ((d / 7) | 0)) % 2);
    }
    {
      const B = new GB(); poleGeo(B, carnival);
      const im = new THREE.InstancedMesh(B.build(), glassM({ thickness: 0.3, core: 0.5, selfMirror: true }), poles.length);
      const gulls = poles.filter((q) => q.gull), GBd = new GB(); gullGeo(GBd);
      const gm = new THREE.InstancedMesh(GBd.build(), glassM({ thickness: 0.3 }), Math.max(1, gulls.length));
      poles.forEach((q, i) => { Q4.setFromAxisAngle(YA, qr() * TAU); M4.compose(P3.set(q.x, 0, q.z), Q4, S3.set(1, q.h, 1)); im.setMatrixAt(i, M4); im.setColorAt(i, poleCols[q.c]); });
      gulls.forEach((q, i) => { Q4.setFromAxisAngle(YA, qr() * TAU); const s = qr.range(1.5, 1.9); M4.compose(P3.set(q.x, q.h * 1.035 + 0.05, q.z), Q4, S3.set(s, s, s)); gm.setMatrixAt(i, M4); });
      im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true; im.computeBoundingSphere(); gm.instanceMatrix.needsUpdate = true; gm.count = gulls.length; gm.computeBoundingSphere();
      scene.add(im, gm);
    }

    // ---- landmarks: the bubble dome in the tower's shaft, far domes and bell towers as tints in the fog
    const domeAt = [TOWER[0] - 0.819 * 98, TOWER[1] - 0.573 * 98];
    {
      const B = new GB(); domeGeo(B); const B2 = new GB(); campanileGeo(B2);
      const pavA = offs(386, -37), pavB = offs(441, -33);
      const domes = [[domeAt[0], domeAt[1], 20, castId === 'milk' ? 'celadon' : 'milk'], [pavA[0], pavA[1], 4.6, castId === 'ember' ? 'aqua' : 'amber'], [pavB[0], pavB[1], 3.3, castId === 'lagoon' ? 'rose' : 'cobalt'], [-112, 178, 11, 'amber'], [WX - 52, TOWER[1] + 16, 27, 'aqua'], [WX - 30, TOWER[1] + 128, 24, 'milk'], [-262, 256, 17, 'rose'], [126, 392, 19, 'rose'], [WX - 46, 338, 21, 'cobalt'], [66, 268, 14, 'milk']];
      const camps = [[-58, 92, 8, 47, 'rose'], [58, 212, 8.5, 54, 'milk'], [-196, 262, 7.5, 45, 'amber'], [WX - 34, TOWER[1] - 52, 9, 58, 'milk'], [112, 486, 9, 60, 'aqua'], [WX - 30, TOWER[1] + 74, 9, 64, 'ruby'], [-26, 44, 7, 40, 'celadon'], [-340, 262, 8, 50, castId === 'ember' ? 'aqua' : 'amber'], [WX - 60, TOWER[1] - 120, 8.5, 54, 'cobalt'], RH(196, 30).concat([9, 66, 'rose']), RH(190, -62).concat([8, 56, 'amber'])];
      const dg = B.build(), dm = new THREE.InstancedMesh(dg, glassM({ thickness: 0.03, interior: 0.2 }), domes.length), cm = new THREE.InstancedMesh(B2.build(), farMat, camps.length);
      const dmM = new THREE.InstancedMesh(dg, glassM({ thickness: 0.03, interior: 0.2, clip: 2 }), 3); dmM.scale.y = -1; dmM.frustumCulled = false; dmM.name = 'domes-mirrored';       // the bubble dome and the two pavilions, mirrored
      flames.push([pavA[0], 2.4, pavA[1], 2.4], [pavB[0], 1.8, pavB[1], 1.8]);                                 // a lamp burning inside each pavilion
      Q4.identity();
      domes.forEach((q, i) => { M4.compose(P3.set(q[0], 0, q[1]), Q4, S3.set(q[2], q[2], q[2])); dm.setMatrixAt(i, M4); dm.setColorAt(i, C3(GLASS[q[3]])); if (i < 3) { dmM.setMatrixAt(i, M4); dmM.setColorAt(i, C3(GLASS[q[3]])); } });
      camps.forEach((q, i) => { Q4.setFromAxisAngle(YA, hash1(i * 3.1) * 0.6); M4.compose(P3.set(q[0], 0, q[1]), Q4, S3.set(q[2], q[3] / 7.7, q[2])); cm.setMatrixAt(i, M4); cm.setColorAt(i, C3(GLASS[q[4]])); });
      dm.instanceColor.needsUpdate = true; cm.instanceColor.needsUpdate = true; dm.computeBoundingSphere(); cm.computeBoundingSphere(); dmM.instanceMatrix.needsUpdate = true; dmM.instanceColor.needsUpdate = true; scene.add(dm, cm, dmM);
    }
    await ctx.yield();

    // ---- water: pearl reflection, the houses' coloured shade and caustics, our bow wave; paving of millefiori in the flooded square
    const NOISE = /* glsl */`
      float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
      float vn2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h21(i), h21(i + vec2(1,0)), f.x), mix(h21(i + vec2(0,1)), h21(i + vec2(1,1)), f.x), f.y); }
      float caustNet(vec2 p){
        vec2 i = floor(p), f = fract(p); float d1 = 8., d2 = 8.;
        for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
          vec2 g = vec2(float(x), float(y)); float n = h21(i + g);
          vec2 o = g + vec2(n, fract(n * 57.31)) - f; float d = dot(o, o);
          if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) { d2 = d; }
        }
        return 1. - smoothstep(0.0, 0.22, sqrt(d2) - sqrt(d1));
      }
      float caustic2(vec2 p, float t){
        float a = caustNet(p * 0.55 + vec2(t * 0.11, t * 0.07)), b = caustNet(p * 0.83 + vec2(-t * 0.09, t * 0.13) + 3.7);
        return a * b * 2.6 + (a + b) * 0.22;
      }`;
    const starDir = new THREE.Vector3(-0.6, 0.2, 0.78).normalize(), starK = { value: 0 };                                   // the hot gather itself, seen through the fog as a small orange sun over the roofs
    const glowDir = new THREE.Vector3(-0.6, 0.15, 0.78).normalize(), glowK = { value: 0 }, glowCol = C3(look.glowCol), pearlNet = { value: 0 };      // the hot gather lights the fog over the basin: a second, orange sun low ahead
    const sunOut = { value: 0 }, throughU = { value: 0 }, crestU = { value: 1 }, amberC = C3(GLASS.amber), deepC = C3(look.lagoon); if (night) deepC.offsetHSL(0.012, 0.1, -0.02); else deepC.offsetHSL(0.02, 0.24, -0.21);      // the lagoon itself: a deeper celadon than its tint in the glass
    const waterU = () => ({ ...THREE.UniformsUtils.merge([THREE.UniformsLib.fog]), uTime: GU.uTime, uSunDir: GU.uSunDir, uSunCol: GU.uSunCol, uFogCol: GU.uFogCol, uLagoon: GU.uLagoon, ...CITY, uSunOut: sunOut, uThrough: throughU, uCrestK: crestU, uAmber: { value: amberC }, uZen: { value: C3(look.zen) }, uWarm: { value: C3(look.warm) }, uDeep: { value: deepC }, uGlowDir: { value: glowDir }, uGlowCol: { value: glowCol }, uGlowK: glowK, uPearlNet: pearlNet });
    const waterMat = (paving) => new THREE.ShaderMaterial({
      uniforms: waterU(), fog: true, transparent: !paving, depthWrite: !!paving, defines: paving ? { PAVING: 1 } : {}, side: paving ? THREE.DoubleSide : THREE.FrontSide,
      vertexShader: /* glsl */`
        #include <common>
        #include <fog_pars_vertex>
        varying vec3 vWP;
        void main(){ vec4 wp = modelMatrix * vec4(position, 1.); vWP = wp.xyz; vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */`
        #include <common>
        #include <fog_pars_fragment>
        uniform float uTime, uSunOut, uInner, uThrough, uCrestK, uGlowK, uPearlNet; uniform vec3 uSunDir, uSunCol, uFogCol, uLagoon, uAmber, uZen, uWarm, uDeep, uGlowDir, uGlowCol; varying vec3 vWP;
        ${NOISE}
        ${CITY_GLSL}
        float wave(vec2 p){ return vn2(p * 0.33 + uTime * vec2(0.28, 0.17)) * 0.62 + vn2(p * 1.07 - uTime * vec2(0.22, 0.37)) * 0.38; }
        void main(){
          vec2 p = vWP.xz;
          vec3 toCam = cameraPosition - vWP; float dist = length(toCam); vec3 V = toCam / max(dist, 1e-3);
          vec2 rel = p - uBoat.xy; float al = dot(rel, uBoat.zw), la = rel.x * uBoat.w - rel.y * uBoat.z, ala = abs(la);
          // the bow wave curling off both sides, and a second crest outside it
          float back = max(4.1 - al, 0.), arm = ala - (0.35 + back * 0.5);
          float crest = exp(-arm * arm * 5.) * (1. - smoothstep(3.5, 4.7, al)) * exp(-back * 0.11) + 0.45 * exp(-(arm - 1.3) * (arm - 1.3) * 3.) * (1. - smoothstep(1.8, 3.4, al)) * exp(-back * 0.16);   // soft ends: a tall frame sees the water ahead of the bow
          crest *= uCrestK;                                                         // no wave where there is no boat (the picture inside a portal)
          float k = 0.55 * (1. - smoothstep(40., 300., dist)) + 0.07, fine = 0.35 * (1. - smoothstep(12., 60., dist));     // a low swell and a fine chop near the eye: highlights are small glints, not blotches
          float w0 = wave(p) + fine * wave(p * 3.1), wx = wave(p + vec2(0.4, 0.)) + fine * wave(p * 3.1 + vec2(1.24, 0.)), wz = wave(p + vec2(0., 0.4)) + fine * wave(p * 3.1 + vec2(0., 1.24));
          vec3 n = normalize(vec3((w0 - wx) * k, 1., (w0 - wz) * k) + vec3(uBoat.w, 0., -uBoat.z) * (sign(la) * crest * 0.45));
          float ndv = clamp(dot(n, V), 0., 1.), fres = pow(1. - ndv, 5.);
          vec3 R = reflect(-V, n), L = normalize(uSunDir);
          float sd = max(dot(R, L), 0.);
          float sd2 = sd * sd, sd6 = sd2 * sd2 * sd2;
          vec3 sky = mix(mix(uDeep, uFogCol, 0.5) * 0.8, uZen * 0.9, smoothstep(0.03, 0.6, R.y)) + uWarm * (sd6 * 0.08 + sd6 * sd6 * sd6 * 0.1) * (0.35 + 0.65 * uSunOut);   // the graded fog ceiling and the sun's warm bloom, mirrored
          float gr = max(dot(R, uGlowDir), 0.), gr2 = gr * gr, gr8 = gr2 * gr2 * gr2 * gr2, gr32 = gr8 * gr8 * gr8 * gr8;
          sky += uGlowCol * (gr8 * 0.42 + gr32 * 0.7) * uGlowK;                             // the orange fog over the basin, mirrored as a long warm road down the canal
          vec3 deep = uDeep * (0.8 + 0.2 * vn2(p * 0.045 + uTime * vec2(0.02, -0.015)));     // slow darker and lighter reaches of the lagoon
          float alpha = 1.;
          #ifdef PAVING
            vec2 g = (p + n.xz * 0.5) / 0.36, id = floor(g), c = fract(g) - 0.5; float r = length(c), h = h21(id + 7.7), ga = (abs(dFdx(g.x)) + abs(dFdy(g.y))) * 1.2;
            vec3 pc = h < 0.2 ? vec3(0.54, 0.02, 0.05) : h < 0.4 ? vec3(0.02, 0.09, 0.4) : h < 0.6 ? vec3(0.88, 0.38, 0.03) : h < 0.8 ? vec3(0.03, 0.46, 0.4) : vec3(0.2, 0.08, 0.44);
            float rings = 0.5 + 0.5 * cos(r * 30. + h * 6.), petal = 0.5 + 0.5 * cos(atan(c.y, c.x + 1e-4) * (5. + floor(h * 4.)));
            vec3 disc = mix(vec3(0.86, 0.84, 0.76), pc, smoothstep(0.25, 0.7, rings * (0.55 + 0.45 * petal)));
            vec3 pave = mix(vec3(0.42, 0.45, 0.42), disc, 1. - smoothstep(0.42, 0.47, r));
            pave = mix(pave, vec3(0.44, 0.4, 0.38), smoothstep(0.2, 0.9, ga));
            float fish = smoothstep(0.9, 0.98, vn2(p * 2.4 + uTime * vec2(1.5, -1.1))) * smoothstep(0.45, 0.8, vn2(p * 0.3 - uTime * 0.17));
            float film = smoothstep(0.55, 0.95, vn2(vec2(p.x * 0.5 + p.y * 0.3 - uTime * 0.9, p.y * 0.12)));
            deep = pave * (0.5 + 0.5 * w0) * (uFogCol + uInner * 0.25) * 0.9 + uFogCol * (fish * 0.9 + film * 0.12);
          #endif
          vec3 col = mix(deep, sky, 0.04 + 0.5 * min(fres, mix(1., 0.45, uThrough))) + uSunCol * (pow(sd, 260.) * 7. + pow(sd, 14.) * 0.1) * uSunOut;   // seen level through a portal the lagoon keeps its celadon
          #ifdef PAVING
            col = mix(deep, sky, 0.06 + 0.9 * fres) + uSunCol * pow(sd, 260.) * 5. * uSunOut;
          #endif
          vec3 Pw = vec3(p.x + n.x * 2., 0., p.y + n.z * 2.);
          vec4 cl = cityLight(Pw); float cov = cl.a * cityOn(Pw);
          vec3 lc = pow(clamp(cl.rgb, 0.01, 1.), vec3(0.6));
          float net = caustic2(p * 0.3 + n.xz * 1.5, uTime);
          col += (uDeep * 1.2 + uFogCol * 0.2) * net * 0.022 * (1. - smoothstep(60., 200., dist));       // a faint net everywhere: the fog's own light through the swell
          #ifndef PAVING
            float spark = smoothstep(0.58, 0.92, vn2(p * 1.7 + uTime * vec2(0.9, -0.7))) * (1. - smoothstep(120., 420., dist) * 0.7);
            col += uWarm * sd2 * sd6 * (0.07 + 0.75 * spark) * uSunOut * (1. - 0.85 * cov);          // the low sun's long path of warm glitter, where no house stands in its way
            col += uSunCol * min(net, 1.6) * 0.075 * uPearlNet * (1. - cov) * (1. - smoothstep(50., 190., dist));   // pearl morning: until the orange road comes up, the sun's own pale net crawls on the open water
            float road = pow(max(dot(normalize(R.xz + vec2(1e-5, 0.)), normalize(uGlowDir.xz + vec2(1e-5, 0.))), 0.), 70.);
            col += uGlowCol * (gr32 * (0.05 + 0.5 * spark) + road * (0.16 + 0.8 * spark) * (0.3 + 0.7 * smoothstep(8., 90., dist)) * (1. - 0.6 * smoothstep(250., 600., dist)) * 0.9) * uGlowK * (1. - 0.5 * cov);   // and the gather's: a long road of orange glints from the bow to the basin
          #endif
          col *= mix(vec3(1.), 0.3 + lc * 0.9, cov * 0.75);
          // the houses' caustics: thin bright lines of their own colour (saturated and capped, so they never pile up into white blotches)
          float net2 = caustic2(p * 0.72 + n.xz * 1.2, uTime * 1.2), lmx = max(lc.r, max(lc.g, lc.b)), lsat = (lmx - min(lc.r, min(lc.g, lc.b))) / max(lmx, 1e-3);
          col += lc * lc * min(net2, 1.6) * cov * 0.9 * (0.3 + 0.7 * lsat);
          vec4 sl = shaftLight(Pw);                                                 // where a string of the harp comes down: a long bright pool of its one colour, its net crawling
          if (sl.a > 0.003) { vec3 sc = pow(clamp(sl.rgb, 0.01, 1.), vec3(0.6)); col = mix(col, sc * (0.5 + 0.22 * w0), sl.a * 0.72); col += sc * sc * (0.12 + 1.3 * min(net2, 1.6)) * sl.a; }
          float bw = bridgeWash(vec3(p.x, 0., p.y)); vec3 bc = pow(clamp(uBridgeCol, 0.01, 1.), vec3(0.75)) * 1.3;
          col = mix(col, bc * min(dot(col, vec3(0.3, 0.5, 0.2)) * 0.8 + 0.04, 0.3), bw * 0.84); col += bc * net * bw * 0.3;      // under the bridge the water lies in its deep shade: the washed bow stands off it
          float ak = (al - 9.5) / 5.5, am = exp(-ak * ak) * exp(-la * la / 16.);            // the bow's own amber caustic, running ahead
          if (am > 0.004) { float nb = caustic2(p * 0.85 + n.xz * 1.2, uTime * 1.5); col = mix(col, uAmber * (0.85 + 0.35 * nb), clamp((nb * 0.34 + 0.05) * am, 0., 0.85)); }   // a fine amber net laid over the water, never added to white
          col += (uFogCol + 0.25) * crest * (0.55 + 0.45 * vn2(p * 3. + uTime * 2.)) * 0.5;
          #ifndef PAVING
            float graze = 1. - clamp(V.y, 0., 1.); graze *= graze;
            alpha = max(clamp(0.74 - 0.7 * graze, 0.1, 0.74), clamp(cov * 0.45 + bw * 0.5 + crest + sl.a * 0.9, 0., 0.9));      // a pool keeps its colour however low the eye sees it
          #endif
          gl_FragColor = vec4(max(col, 0.), alpha);
          #include <fog_fragment>
        }`,
    });
    const waterG = new THREE.PlaneGeometry(3200, 3200, 1, 1); waterG.rotateX(-Math.PI / 2);
    const water = new THREE.Mesh(waterG, waterMat(false)); water.position.set(-120, 0, 380); water.name = 'water'; water.renderOrder = 2; water.frustumCulled = false; scene.add(water);
    {
      const pv = [], quad = (a, b, c, d) => pv.push(...a, ...b, ...c, ...a, ...c, ...d), y = 0.03;
      { const a = bankR.at(0.5), b = bankR.at(CAMPO); quad([a.x, y, a.z], [b.x, y, b.z], [-52, y, 112.5], [-18, y, 89]); quad([-5, y, 111], [-18, y, 89], [-17, y, 110.5], [-5, y, 111]); }
      const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.Float32BufferAttribute(pv, 3));
      const paving = new THREE.Mesh(pg, waterMat(true)); paving.frustumCulled = false; scene.add(paving);
    }

    // ---- the sky: a pearl fog ceiling, warm toward the sun; the disc and its 20 degree halo come out when the sun breaks
    const lidDir = new THREE.Vector3(0, 1, 0);
    const skyMat = new THREE.ShaderMaterial({
      depthWrite: false, depthTest: false, side: THREE.BackSide, fog: false,
      uniforms: { uFog: { value: fogCol.clone() }, uZen: { value: C3(look.zen) }, uWarm: { value: C3(look.warm) }, uLit: { value: C3(look.lit) }, uShade: { value: C3(look.shade) }, uCover: { value: look.cover }, uLidDir: { value: lidDir },
        uSun: { value: SUN }, uSunCol: { value: C3(look.sun) }, uOut: sunOut, uNight: { value: night ? 1 : 0 }, uTime: GU.uTime, uGlowDir: { value: glowDir }, uGlowCol: { value: glowCol }, uGlowK: glowK, uStarDir: { value: starDir }, uStarK: starK },
      vertexShader: /* glsl */`varying vec3 vDir; void main(){ vDir = position; vec4 p = projectionMatrix * viewMatrix * vec4(position + cameraPosition, 1.); if (abs(p.w) < 1e-4) p.w = 1e-4; gl_Position = p.xyww; }`,
      fragmentShader: /* glsl */`
        uniform vec3 uFog, uZen, uWarm, uLit, uShade, uSun, uSunCol, uLidDir, uGlowDir, uGlowCol, uStarDir; uniform float uOut, uNight, uTime, uCover, uGlowK, uStarK; varying vec3 vDir;
        float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
        float vn2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h21(i), h21(i + vec2(1,0)), f.x), mix(h21(i + vec2(0,1)), h21(i + vec2(1,1)), f.x), f.y); }
        float fbm(vec2 p){ return vn2(p) * 0.5 + vn2(p * 2.03 + 17.3) * 0.25 + vn2(p * 4.11 + 41.7) * 0.125 + vn2(p * 8.3 + 5.9) * 0.0625; }
        void main(){
          vec3 d = normalize(vDir + vec3(0., 1e-5, 0.));
          float h = d.y;
          float sd = dot(d, uSun), up = smoothstep(-0.02, 0.1, h);
          float sp = max(sd, 0.), sp2 = sp * sp, sp6 = sp2 * sp2 * sp2;
          // the air between the banks of fog: pearl at the water, deepening overhead, warm on the sun's side
          vec3 col = mix(uFog, uZen, smoothstep(0.02, 0.5, h));
          col = mix(col, uWarm, sp2 * 0.32 * (1. - smoothstep(0.05, 0.75, h)) * (1. - 0.5 * uNight));
          // the fog over the basin, lit from inside by the hot gather: a deep orange-rose glow low ahead, and every bank of cloud near it under-lit
          float gd = max(dot(d, uGlowDir), 0.), gd2 = gd * gd, gd4 = gd2 * gd2, gd16 = gd4 * gd4 * gd4 * gd4;
          float gLow = 1. - smoothstep(0.08, 0.6, h);
          col = mix(col, uGlowCol * 0.95, clamp((gd4 * 0.55 + gd16 * 0.25) * gLow * uGlowK, 0., 0.85));
          // banks of sea fog and high stratus drifting north-west, lit along the edges that face the low sun
          vec2 q = d.xz / max(h + 0.16, 0.14) * vec2(0.8, 1.5) + uTime * vec2(-0.014, -0.010);
          vec2 so = normalize(uSun.xz + vec2(1e-4, 0.)) * vec2(0.8, 1.5) * 0.2;
          float c1 = fbm(q), c2 = fbm(q + so);
          float cover = smoothstep(uCover - 0.13, uCover + 0.17, c1) * smoothstep(0.03, 0.2, h);
          float lit = clamp(0.45 + (c1 - c2) * 4.6 + 0.3 * sp + 0.28 * max(-sd, 0.), 0., 1.);      // banks that face the sun across the sky are lit broadside
          vec3 cloud = mix(uShade, uLit, lit) + uWarm * (sp6 * 0.3 + 0.1 * lit * sp2) * (1. - uNight);
          float under = clamp(0.5 - (c1 - c2) * 3., 0., 1.);                                // the bellies of the banks take the glow, their sunward edges stay pearl
          cloud = mix(cloud, uGlowCol * (0.62 + 0.5 * lit) + uShade * 0.18, clamp(gd2 * (0.42 + 0.55 * under) * uGlowK, 0., 0.9));
          col = mix(col, cloud, cover * 0.88);
          col += uGlowCol * (gd16 * 0.22 + gd16 * gd16 * gd16 * 0.3) * up * uGlowK;
          // the fog stays closed where the pipes come down through it
          col = mix(col, uFog, smoothstep(0.94, 0.992, dot(d, uLidDir)) * 0.92);
          col += uWarm * (sp6 * 0.12 + sp6 * sp6 * sp6 * sp6 * 0.22 * (0.45 + 0.55 * uOut)) * up * (1. - 0.6 * uNight);
          float ang = acos(clamp(sd, -1., 1.)), hk = (ang - 0.35) / 0.03;
          float disc = 1. - smoothstep(0.011, 0.016, ang);
          col += uSunCol * (disc * 7. + exp(-hk * hk) * 0.07 + exp(-ang * 10.) * 0.6) * uOut * (1. - uNight);
          float sa = acos(clamp(dot(d, uStarDir), -1., 1.)), fl = 0.9 + 0.1 * sin(uTime * 2.3);
          vec3 sor = vec3(1., 0.145, 0.012);                                     // the gather's own orange, #FF6A1A
          col = mix(col, mix(vec3(1., 0.36, 0.07), sor, 0.6) * 1.15, clamp((exp(-sa * 9.) * 1.5 + exp(-sa * 30.) * 0.9) * uStarK, 0., 0.93));   // its warm halo dyes the haze round it
          col = mix(col, vec3(1., 0.115, 0.008) * 1.1 * fl, clamp(exp(-sa * sa * 900.) * 1.6 * uStarK, 0., 1.));   // the star itself: one saturated orange, never a pale blur
          col += sor * exp(-sa * 42.) * 0.35 * uStarK;
          col = max(col, uFog * 0.6 * uNight);                                  // by night the lid never falls below a deep indigo
          gl_FragColor = vec4(col, 1.);
        }`,
    });
    const sky = new THREE.Mesh(new THREE.SphereGeometry(100, 24, 12), skyMat); sky.renderOrder = -1; sky.frustumCulled = false; scene.add(sky);
    await ctx.yield();

    // ---- frost: a line of white mountains beyond the lagoon (built only for that look)
    if (frost) {
      const mg = new THREE.CylinderGeometry(2300, 2300, 640, 96, 1, true); mg.translate(0, 320, 0);
      const mm = new THREE.ShaderMaterial({
        depthWrite: false, depthTest: false, side: THREE.BackSide, fog: false,                 // opaque, so it is drawn straight after the sky and everything else covers it
        uniforms: { uFog: { value: fogCol.clone() }, uSun: { value: SUN } },
        vertexShader: /* glsl */`varying vec2 vUv; varying vec3 vP; void main(){ vUv = uv; vP = position; vec4 p = projectionMatrix * viewMatrix * vec4(position + vec3(cameraPosition.x, 0., cameraPosition.z), 1.); gl_Position = p; }`,
        fragmentShader: /* glsl */`
          uniform vec3 uFog, uSun; varying vec2 vUv; varying vec3 vP;
          float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
          float vn1(float x){ float i = floor(x), f = fract(x); f = f * f * (3. - 2. * f); return mix(h21(vec2(i, 7.3)), h21(vec2(i + 1., 7.3)), f); }
          float ridge(float x){ return 0.42 * vn1(x * 9.) + 0.3 * abs(vn1(x * 23. + 4.) - 0.5) * 2. + 0.16 * vn1(x * 61. + 9.) + 0.08 * vn1(x * 170.); }
          void main(){
            float x = vUv.x * 6., r = ridge(x) * 0.7 + 0.18, r2 = ridge(x * 0.7 + 13.) * 0.42 + 0.1;
            float aa = fwidth(vUv.y) * 1.5 + 1e-4;
            float m1 = 1. - smoothstep(r - aa, r + aa, vUv.y), m2 = 1. - smoothstep(r2 - aa, r2 + aa, vUv.y);
            float slope = (ridge(x + 0.012) - ridge(x - 0.012)) * 22.;
            vec2 az = normalize(vP.xz + vec2(1e-4, 0.)), sa = normalize(uSun.xz + vec2(1e-4, 0.));
            float lit = clamp(0.55 + 0.45 * dot(az, sa) + slope * (az.x * sa.y - az.y * sa.x) * 0.5, 0., 1.);
            vec3 snow = mix(vec3(0.40, 0.52, 0.68), vec3(1.0, 0.985, 0.95), lit);
            vec3 col = mix(uFog, snow, smoothstep(0.0, 0.3, vUv.y) * 0.94);
            vec3 near = mix(uFog, vec3(0.5, 0.64, 0.74), smoothstep(0.0, 0.2, vUv.y) * 0.85);
            col = mix(col, near, m2 * (1. - smoothstep(r2 * 0.4, r2, vUv.y) * 0.35));
            if (max(m1, m2) < 0.5) discard;
            gl_FragColor = vec4(col, 1.);
          }`,
      });
      const mts = new THREE.Mesh(mg, mm); mts.renderOrder = -0.9; mts.frustumCulled = false; mts.name = 'mountains'; scene.add(mts);
    }
    await ctx.yield();

    // ---- the harp of beams: strings of single-coloured light standing in the air over the grand canal, along the sun's own
    // vector. Each is ONE thin shaft (HARP_R metres in radius, a bright core inside a crisp edge) that begins AT one pane of a
    // house front on the left bank and ends AT its own pool of colour on the water: nothing of it behind the pane, nothing
    // beyond the pool. One stands about every HARP_STEP metres of the left quay, from the mouth to the basin; the panes lie
    // by turns along an upper and a lower line of the housefronts (HARP_Y, each gently rising and falling), so the strings are
    // long and short by turns, never cross one another, and their pools lie in two rows down the middle of the canal, every one
    // at least HARP_CLEAR metres to the left of the fairway: none ever stands across the lens, and the right bank, the great
    // bridge and the sky ahead are seen through clear air. Far down the canal every second string goes out, and further off every
    // second of those left (HARP_FAR, metres from the eye), so the air between two strings stays several strings wide however
    // far the eye looks. The pool is the foot of the whole pane's light, wider than the string that is its bright core; the
    // same pools, held in a small lookup (CITY.uShaft), light whatever stands in them (the water, a gondola, a pole). Each
    // string has its image in the water: a short wavering tail under its pool. They switch on in the wave that runs from the
    // canal mouth when the sun breaks, stand aside for the hot star, and thin out toward the basin.
    const br = rng.fork('beams'), shafts = [];
    yr.fork('beams2');                                                           // (a draw kept, so every later roll falls as it did)
    const cosEl = Math.cos(el), sinEl = Math.sin(el), DIR = new THREE.Vector3(hX * cosEl, -sinEl, hZ * cosEl);
    const SH = { q0: 0, cw: 1, Y0: 0, ch: 1, NQ: 512, NY: 1, sd: null };
    const HARP_STEP = 5.6, HARP_CLEAR = 8, HARP_R = [0.19, 0.28], HARP_POOL = [2.3, 3], HARP_Y = [16.6, 11.8], HARP_DY = 1.5, HARP_FAR = [230, 95, 150, 95];
    {
      // what a string may not run into before it reaches the water: the footprint of every house that does not stand on the sun's own bank
      const walls = [];
      for (const h of houses) {
        if (h.bank === 'L' || h.bank === 'B' || h.bank === 'S') continue;
        const ax = h.x - h.tx * h.w / 2, az2 = h.z - h.tz * h.w / 2, bx = h.x + h.tx * h.w / 2, bz = h.z + h.tz * h.w / 2;
        const cx = bx - h.nx * h.depth, cz = bz - h.nz * h.depth, dx = ax - h.nx * h.depth, dz = az2 - h.nz * h.depth;
        walls.push([ax, az2, bx, bz], [bx, bz, cx, cz], [cx, cz, dx, dz], [dx, dz, ax, az2]);
      }
      const hitWall = (x, z) => {
        let best = 1e9;
        for (const w of walls) {
          const ex = w[2] - w[0], ez = w[3] - w[1], den = hX * ez - hZ * ex; if (Math.abs(den) < 1e-6) continue;
          const t = ((w[0] - x) * ez - (w[1] - z) * ex) / den, s = ((w[0] - x) * hZ - (w[1] - z) * hX) / den;
          if (t > 1 && s >= 0 && s <= 1 && t < best) best = t;
        }
        return best;
      };
      const bax = bridgeB[0] - bridgeA[0], baz = bridgeB[1] - bridgeA[1], bl2 = bax * bax + baz * baz;
      const nearBridge = (x, z) => { const t = sat(((x - bridgeA[0]) * bax + (z - bridgeA[1]) * baz) / bl2); return Math.hypot(x - bridgeA[0] - bax * t, z - bridgeA[1] - baz * t); };
      // how far to the LEFT of the fairway a point lies (negative: to its right)
      const leftOf = (x, z) => { const pn = path.nearestXZ(x, z); path.pointAt(pn.u, tmpA); path.tangentAt(pn.u, tmpB); return (x - tmpA.x) * tmpB.z - (z - tmpA.z) * tmpB.x > 0 ? pn.dist : -pn.dist; };
      const lhs = houses.filter((h) => h.bank === 'L');
      const sA = 96, sB = dOld + 40, per = Math.max(0.5, Math.min(1, detail));   // fewer of them on a slower machine: the quay between two grows
      for (let s = sA + br.range(0, HARP_STEP), n = 0; s < sB; s += (HARP_STEP + br.range(-0.9, 0.9)) / per, n++) {
        if (n % 12 === 11) await ctx.yield();
        let h = null, sh = s, hb = 2.6;                                          // its house: the one this stretch of quay belongs to, or the nearest within a few metres (an alley between two)
        for (const o of lhs) { const sc = Math.min(o.d + o.w - 1.4, Math.max(o.d + 1.4, s)), dd = Math.abs(sc - s); if (dd < hb && o.w > 3) { hb = dd; h = o; sh = sc; } }
        if (!h) continue;
        const a = sh - h.d - h.w / 2, x = h.x + h.tx * a + h.nx * 0.3, z = h.z + h.tz * a + h.nz * 0.3;
        const pd = path.nearestXZ(x, z).u * LEN; if (pd > 384) continue;
        const g = 1 - 0.85 * sstep(338, 384, pd);                                // the harp thins out where the canal opens into the basin: the tower stands clear
        // its pane: on the line of panes, between the head of the ground floor and the cornice; lower where the pool would otherwise
        // lie within HARP_CLEAR of the fairway (the quay closes in toward the basin)
        const yLo = forms[h.fi].gH * h.sy + 1, yHi = h.h - 1.8, ph = br() * 20, rr = br(), rq = br();
        let y = Math.min(yHi, Math.max(yLo, HARP_Y[n % 2] + HARP_DY * Math.sin(s * 0.052) + br.range(-0.4, 0.4))), ok = false;
        for (; y >= yLo; y -= 0.8) if (leftOf(x + hX * y / tanEl, z + hZ * y / tanEl) >= HARP_CLEAR) { ok = true; break; }
        if (!ok) continue;
        const R = y / tanEl;                                                     // in plan, from the pane to the middle of the pool
        if (hitWall(x, z) < R + 4) continue;
        let clear = 1e9; for (let k = 0; k <= 8; k++) clear = Math.min(clear, nearBridge(x + hX * R * k / 8, z + hZ * R * k / 8));
        if (clear < 7) continue;                                                 // none stands in the great bridge, and none lands under it
        const q = x * pX + z * pZ, al = x * hX + z * hZ, Y = y + al * tanEl;
        let rp = mix(HARP_POOL[0], HARP_POOL[1], rq) * (0.7 + 0.3 * g);
        for (const o of shafts) rp = Math.min(rp, Math.hypot(q - o.q, (Y - o.Y) * cosEl) - o.rp - 0.8);     // the pools never run together
        if (rp < 1.1) continue;
        const c = (h.name === 'milk' ? C3(GLASS.gold) : h.col.clone()).offsetHSL(br.range(-0.015, 0.015), 0.1, 0);     // milk glass throws gold, never a blank white shaft
        c.multiplyScalar(Math.min(2.4, 0.92 / Math.max(c.r, c.g, c.b, 1e-3)));                                        // light, not pigment: a cobalt or amethyst house still throws a bright shaft
        shafts.push({ x, y, z, r: mix(HARP_R[0], HARP_R[1], rr) * (0.8 + 0.2 * g), rp, R, len: y / sinEl, q, Y, al, c, ph, g, dm: Math.hypot(x, z - MOUTH_Z), far: HARP_FAR[shafts.length % 4] });
      }
      await ctx.yield();
      // the lookup: per cell of (q, Y) the one pool whose light can reach it
      let q0 = 1e9, q1 = -1e9, Y0 = 1e9, Y1 = -1e9;
      for (const b of shafts) { q0 = Math.min(q0, b.q - b.rp); q1 = Math.max(q1, b.q + b.rp); Y0 = Math.min(Y0, b.Y - b.rp); Y1 = Math.max(Y1, b.Y + b.rp); }
      if (!shafts.length) { q0 = 0; q1 = 1; Y0 = 0; Y1 = 1; }
      q0 -= 3; q1 += 3; Y0 -= 3; Y1 += 3;
      const NQ = SH.NQ, NY = Math.max(1, Math.min(64, Math.ceil((Y1 - Y0) / 1.5))), cw = (q1 - q0) / NQ, ch = (Y1 - Y0) / NY;
      const sd = new Float32Array(NQ * NY * 2 * 4), nearest = new Float32Array(NQ * NY).fill(1.6);
      for (const b of shafts) {
        const i0 = Math.max(0, Math.floor((b.q - b.rp - 1.6 - q0) / cw)), i1 = Math.min(NQ - 1, Math.floor((b.q + b.rp + 1.6 - q0) / cw));
        const j0 = Math.max(0, Math.floor((b.Y - (b.rp + 1.6) / cosEl - Y0) / ch)), j1 = Math.min(NY - 1, Math.floor((b.Y + (b.rp + 1.6) / cosEl - Y0) / ch));
        const reach = b.R + b.rp / sinEl + 2.5;                                  // along the light, to the far rim of the pool
        for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
          const dn = Math.hypot(q0 + (i + 0.5) * cw - b.q, (Y0 + (j + 0.5) * ch - b.Y) * cosEl) - b.rp; if (dn >= nearest[j * NQ + i]) continue;
          nearest[j * NQ + i] = dn;
          const k0 = (2 * j * NQ + i) * 4, k1 = ((2 * j + 1) * NQ + i) * 4;
          sd[k0] = b.q; sd[k0 + 1] = b.Y; sd[k0 + 2] = b.rp; sd[k0 + 3] = b.al; sd[k1] = b.c.r; sd[k1 + 1] = b.c.g; sd[k1 + 2] = b.c.b; sd[k1 + 3] = reach;
        }
      }
      await ctx.yield();
      const sd16 = new Uint16Array(sd.length); for (let i = 0; i < sd.length; i++) sd16[i] = THREE.DataUtils.toHalfFloat(sd[i]);
      const shaftTex = new THREE.DataTexture(sd16, NQ, NY * 2, THREE.RGBAFormat, THREE.HalfFloatType);
      shaftTex.magFilter = shaftTex.minFilter = THREE.NearestFilter; shaftTex.wrapS = shaftTex.wrapT = THREE.ClampToEdgeWrapping; shaftTex.generateMipmaps = false; shaftTex.needsUpdate = true;
      CITY.uShaft.value = shaftTex; CITY.uShaftQ.value.set(q0, 1 / (q1 - q0), Y0, 1 / (Y1 - Y0)); CITY.uShaftN.value.set(NY, cosEl, night ? 0.5 : frost ? 0.85 : 1, 0);
      SH.q0 = q0; SH.cw = cw; SH.Y0 = Y0; SH.ch = ch; SH.NY = NY; SH.sd = sd;
    }
    const beamGain = { value: 0 }, beamPx = { value: 0.002 };
    let srcGlow = null;
    {
      // each string is one ribbon turned about its own axis to face the eye: a bright core inside a crisp edge, one colour, drawn
      // once (it gives its light and takes a little of what is behind it, so it holds its hue against pale glass and pearl sky).
      // Far off it is never drawn thinner than about two pixels: it keeps its light and pales instead, a hairline and never a shimmer.
      const n = shafts.length, g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute([0, -1, 0, 1, -1, 0, 1, 1, 0, 0, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
      const iA = new Float32Array(Math.max(1, n) * 8), iB = new Float32Array(Math.max(1, n) * 8), iC = new Float32Array(Math.max(1, n) * 8);
      shafts.forEach((b, i) => { for (const k of [i, n + i]) { iA.set([b.x, b.y, b.z, b.len], k * 4); iB.set([b.r, b.ph, b.dm, b.g], k * 4); iC.set([b.c.r, b.c.g, b.c.b, k < n ? b.far : -b.far], k * 4); } });   // (the second of each: its image in the water)
      g.setAttribute('iA', new THREE.InstancedBufferAttribute(iA, 4)); g.setAttribute('iB', new THREE.InstancedBufferAttribute(iB, 4)); g.setAttribute('iC', new THREE.InstancedBufferAttribute(iC, 4)); g.instanceCount = n * 2;
      const beamMat = new THREE.ShaderMaterial({
        fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide, forceSinglePass: true, premultipliedAlpha: true,
        uniforms: { ...THREE.UniformsUtils.merge([THREE.UniformsLib.fog]), uTime: GU.uTime, uWave: CITY.uWave, uGain: beamGain, uPx: beamPx, uAdd: { value: look.add ? 1 : 0 }, uLayer: { value: look.layer }, uDir: { value: DIR }, uStar: { value: new THREE.Vector3(TOWER[0], 74, TOWER[1]) }, uStarK: starK },
        vertexShader: /* glsl */`
          #include <common>
          #include <fog_pars_vertex>
          attribute vec4 iA, iB, iC; uniform vec4 uWave; uniform vec3 uDir; uniform float uPx;
          varying vec2 vUv, vT; varying vec3 vCol, vWP; varying vec4 vK;
          void main(){
            float mir = step(iC.w, 0.), ym = 1. - 2. * mir;                      // (its image in the water: the same string, upside down under the pool)
            vec3 dir = vec3(uDir.x, uDir.y * ym, uDir.z);
            vec3 pc = vec3(iA.x, iA.y * ym, iA.z) + dir * (iA.w * position.x);   // on the string's axis: the pane at 0, the pool at 1
            vec3 te = cameraPosition - pc; float dist = length(te);
            vec3 side = normalize(cross(dir, te) + vec3(0., 1e-6, 0.));
            float hw = max(iB.x, 0.7 * uPx * dist), wide = mix(1.25, 4., mir);   // half its width: its own, or most of a pixel (the image has room to waver)
            vec3 wp = pc + side * (position.y * hw * wide);
            vec4 mvPosition = viewMatrix * vec4(wp, 1.);
            vUv = vec2(position.x, position.y * wide); vCol = iC.rgb; vWP = wp; vT = vec2(iB.x / max(hw, 1e-4), iC.w);
            vK = vec4(1. - smoothstep(uWave.x - 40., uWave.x, iB.z), iB.y, iB.w, iA.w);
            gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */`
          #include <common>
          #include <fog_pars_fragment>
          uniform float uTime, uGain, uAdd, uLayer, uStarK; uniform vec3 uDir, uStar; varying vec2 vUv, vT; varying vec3 vCol, vWP; varying vec4 vK;
          float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
          float vn2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h21(i), h21(i + vec2(1,0)), f.x), mix(h21(i + vec2(0,1)), h21(i + vec2(1,1)), f.x), f.y); }
          void main(){
            float x = clamp(vUv.x, 0., 1.), len = clamp(vK.w, 0., 400.), m = x * len, mir = step(vT.y, 0.);   // metres from the pane
            float under = (1. - x) * len;                                                              // (of the image: metres from the pool)
            float wav = mir * 2.1 * clamp(under * 0.3, 0., 1.) * sin(under * 1.3 - uTime * 2.1 + clamp(vK.y, 0., 20.));   // the image wavers with the swell, more the further from the pool
            float s = clamp(abs(clamp(vUv.y, -4., 4.) + wav), 0., 6.), aa = clamp(fwidth(vUv.y), 0.02, 0.6);
            float core = 1. - smoothstep(0.1, 0.62, s), prof = (1. - smoothstep(1. - aa, 1., s)) * (0.66 + 0.34 * core);   // a crisp edge and a brighter core: no skirt outside it
            float dens = 0.84 + 0.16 * vn2(vec2(m * 0.11 - uTime * 0.09 + clamp(vK.y, 0., 20.) * 7., clamp(vK.y, 0., 20.)));   // the fog it stands in drifts down it
            float along = mix(1., 0.8, x) * smoothstep(-0.02, 0.1, vWP.y * (1. - 2. * mir));           // brightest at the pane; it ends where it meets the water
            float tail = smoothstep(0.42, 1., x); along *= mix(1., 0.62 * tail * tail, mir);           // its image: a short bright tail under the pool, gone a few metres down
            float fogK = exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
            vec3 tv = vWP - cameraPosition; float dist = length(tv); vec3 vd = tv / max(dist, 1e-3);
            float nearK = smoothstep(3., 9., dist);                                                    // (none stands nearer the fairway than this)
            float far = clamp(abs(vT.y), 40., 400.), farK = 1. - smoothstep(0.58 * far, far, dist);             // far down the canal every second one goes out, then every second of those left: the gaps between them stay wide however far the eye looks
            float ca = clamp(abs(dot(vd, uDir)), 0., 1.), endOn = 1. - smoothstep(0.93, 0.995, ca);
            float lay = mix(1., 0.24 + 0.76 * (1. - smoothstep(2.2, 5.2, abs(vWP.y))), uLayer);                // under frost it shows where it crosses the 3 m of fog on the water, and only palely above
            float k = clamp(prof * along * dens * nearK * farK * endOn * lay * clamp(vK.x, 0., 1.) * clamp(vK.z, 0., 1.) * uGain * (0.6 + 0.4 * fogK) * clamp(vT.x, 0.35, 1.), 0., 1.);
            float sg = 1. - clamp(dot(vd, normalize(uStar - cameraPosition)), 0., 1.);                    // (half the squared angle from the hot star)
            k *= 1. - 0.85 * clamp(uStarK, 0., 1.) * exp(-sg * 420.);                                     // the harp stands aside for the star: within five degrees of it the air is clear
            vec3 c = pow(clamp(vCol, 0.01, 1.), vec3(0.75)); c = mix(c, c * c, 0.5);
            c = mix(c, vec3(1.), 0.1 * core);
            gl_FragColor = vec4(c * k * mix(1.3, 0.5, uAdd), k * mix(0.78, 0.12, uAdd));              // its light, and how much of what stands behind it gives way to it (by night: a glow on the fog)
          }`,
      });
      const beams = new THREE.Mesh(g, beamMat); beams.frustumCulled = false; beams.renderOrder = 4; beams.name = 'harp'; scene.add(beams);
    }
    await ctx.yield();

    // ---- the hero: the tower being blown, the pontil and the hot ring, the tower's own shaft and caustic
    // the hero's front (+Z) faces back along the last straight: turned PI - HOOK about Y, with the sun given in its own frame
    const heroYaw = Math.PI - HOOK, cY = Math.cos(heroYaw), sY = Math.sin(heroYaw);
    const hero = await buildHero(ctx, { palette: pal, towerColor: towerHex, shared: GU, sunDir: [SUN_HI.x * cY - SUN_HI.z * sY, SUN_HI.y, SUN_HI.x * sY + SUN_HI.z * cY], sunColor: look.sun, lid: 110, water: 'decal', waterRadius: 430, mirror: true, girth: 2.2, haloGain: night ? 0.4 : 1, shaftGain: night ? 0.35 : 1.0, progress: 0, dropScale: night ? 1 : 0.6, dropCount: night ? 1 : 1.5 });
    hero.object.position.set(TOWER[0], 0, TOWER[1]); hero.object.rotation.y = heroYaw; scene.add(hero.object);
    if (hero.water) hero.water.renderOrder = 3;
    // the opening mirrored in the water: the engine draws the portal as a whole circle, a third of it below the surface. This disc
    // stands just in front of that third and shows the upper part upside down (the picture of the next world, rippled), so ring,
    // opening and reflection read as one circle closed by the waterline
    const pview = ctx.portalView, blackTex = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1); blackTex.needsUpdate = true;
    const mirU = { tNext: { value: pview ? pview.texture : blackTex }, uRect: { value: pview ? pview.rect : new THREE.Vector4(0, 0, 1, 1) }, uNextPV: { value: pview ? pview.matrix : new THREE.Matrix4() }, uGain: { value: pview ? pview.gain : new THREE.Vector3(1, 1, 1) },
      uLive: { value: 0 }, uTime: GU.uTime, uColor: { value: C3(look.portal) }, uLagoon: GU.uLagoon, uHole: hero.uniforms.uHole, uRight: { value: new THREE.Vector3(-HZ, 0, HX) } };
    {
      const mg = new THREE.PlaneGeometry(16, 10, 1, 1); mg.translate(0, -5, 0);
      const mm = new THREE.ShaderMaterial({
        uniforms: mirU, fog: false,
        vertexShader: /* glsl */`varying vec2 vL; varying vec3 vWP; void main(){ vL = position.xy; vec4 wp = modelMatrix * vec4(position, 1.); vWP = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`,
        fragmentShader: /* glsl */`
          uniform sampler2D tNext; uniform vec4 uRect; uniform mat4 uNextPV; uniform vec3 uGain, uColor, uLagoon, uRight; uniform float uLive, uTime, uHole;
          varying vec2 vL; varying vec3 vWP;
          float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
          float vn2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h21(i), h21(i + vec2(1,0)), f.x), mix(h21(i + vec2(0,1)), h21(i + vec2(1,1)), f.x), f.y); }
          void main(){
            if (vL.y > -0.03) discard;
            float dq = clamp(-vL.y * 0.1, 0., 1.2), rip = (sin(vL.y * 1.5 + uTime * 1.7) * 0.3 + sin(vL.y * 3.7 - uTime * 2.3 + vL.x * 0.6) * 0.12) * dq;
            vec2 q = vec2(vL.x + rip, -vL.y - 1.9);                                  // the upright twin of this point, in the ring's own frame
            float r = length(q);
            if (r > 7.3) discard;
            vec3 tw = vec3(vWP.x, -vWP.y, vWP.z) + uRight * rip;
            vec4 c = uNextPV * vec4(tw, 1.);
            vec2 uv = c.xy / max(c.w, 1e-4) * 0.5 + 0.5, lo = uRect.xy, hi = uRect.xy + uRect.zw;
            float inside = step(0., c.w) * step(lo.x, uv.x) * step(uv.x, hi.x) * step(lo.y, uv.y) * step(uv.y, hi.y);
            vec3 next = textureLod(tNext, clamp(uv, lo, hi), 0.).rgb * uGain;
            float ang = atan(q.y, q.x + 1e-4), sw = vn2(vec2(ang * 1.6 + r * 0.5 - uTime * 0.25, r * 0.6 - uTime * 0.5));
            vec3 veil = uColor * (0.12 + 1.5 * sw * sw) * (0.35 + 0.9 * r / 7.);
            vec3 pic = mix(veil, next, uLive * inside);
            vec3 hot = vec3(1.9, 0.72, 0.16) * (0.7 + 0.3 * sw);                    // where the molten membrane still closes the ring
            pic = mix(pic, hot, smoothstep(uHole - 0.5, uHole + 0.1, r) * (1. - smoothstep(6.6, 7.2, uHole)));
            pic += uColor * exp(-(7. - r) * (7. - r) * 2.5) * 0.9;                   // the bright edge of the opening
            pic = mix(pic * 0.78, uLagoon * 0.5, clamp(-vL.y * 0.045, 0., 0.5));     // a reflection: a little darker, sinking into the lagoon
            gl_FragColor = vec4(max(pic, 0.), 1.);
          }`,
      });
      const mir = new THREE.Mesh(mg, mm); mir.position.set(RING[0] - HX * 0.12, 0, RING[1] - HZ * 0.12); mir.rotation.y = Math.atan2(-HX, -HZ); mir.frustumCulled = false; mir.name = 'portal-mirror'; scene.add(mir);
    }
    await ctx.yield();

    // ---- our boat: the amber glass bow, the low curved windscreen in its thin rim, the cane jackstaff and its pendant
    const boat = new THREE.Group(), bowG = new THREE.Group(); boat.add(bowG); boat.name = 'boat';
    const screenU = { uTime: GU.uTime, uFogCol: GU.uFogCol, uSunCol: GU.uSunCol, uTintC: { value: new THREE.Color(0, 0, 0) }, uGlit: { value: new THREE.Vector2(0, 0) }, uWet: { value: 1 }, uGlitC: { value: C3(towerHex) }, uShow: { value: 1 } };
    const pendant = new THREE.Group();
    {
      const B = new GB(), v0 = B.count, i0 = B.i.length, NS = 12, NX = 8, hw = (t) => 1.3 * Math.pow(Math.max(0, 1 - Math.pow(t, 1.9)), 0.75), yc = (t) => -1.56 + 0.07 * t, BL = 1.9;      // the bow lies low and short: with the windscreen rim it takes the bottom eighth of the frame, drawn whole
      B.mat(WHITE, 0.16, 3);
      for (let s2 = 0; s2 <= NS; s2++) { const t = s2 / NS, z = -1.5 - BL * t, w = hw(t); for (let j = 0; j <= NX; j++) { const a = (j / NX) * 2 - 1; B.v(a * w, yc(t) - 0.17 * a * a, z, 0, 1, 0, a * w, z); } }
      for (let s2 = 0; s2 < NS; s2++) for (let j = 0; j < NX; j++) { const a = v0 + s2 * (NX + 1) + j, b = a + 1, c = a + NX + 1, d = c + 1; B.i.push(a, b, d, a, d, c); }
      B.smooth(v0, i0);
      for (const sd of [-1, 1]) { const pts = []; for (let s2 = 0; s2 <= NS; s2++) { const t = s2 / NS; pts.push([sd * hw(t), yc(t) - 0.165, -1.5 - BL * t]); } B.mat(WHITE, 0.95, 0); B.tube(pts, 0.06, 5); }
      { const pts = []; for (let s2 = 0; s2 <= NS; s2++) { const t = s2 / NS; pts.push([0, yc(t) + 0.012, -1.5 - BL * t]); } B.mat(MILK, 0.6, 25); B.tube(pts, 0.04, 4, { turns: 3 }); }
      for (const sd of [-1, 1]) { B.mat(MILK, 0.7, 20); B.blob(sd * 0.5, -1.56, -2.55, 0.07, 0.05, 0.16, 2, 5); }
      B.mat(MILK, 0.7, 25); B.tube([[0, -1.49, -3.39], [0, -1.29, -3.45]], 0.02, 4, { turns: 2 });
      B.mat(GOLDC, 0.5, 27); B.blob(0, -1.27, -3.45, 0.035, 0.035, 0.035, 2, 5);
      // windscreen rim
      const A = 1.0, rim = [], NR = 18, sp = (a, v) => { const r = 1.56 - 0.1 * v, yt = -0.59 - 0.34 * (a / A) * (a / A); return [Math.sin(a) * r, mix(-1.54, yt, v), 0.06 - Math.cos(a) * r + 0.15 * v]; };
      for (let k = 0; k <= NR; k++) rim.push(sp(-A + (k / NR) * 2 * A, 1));
      B.mat(MILK, 0.8, 20); B.tube(rim, 0.02, 5);
      const taxi = new THREE.Mesh(B.build(), glassM({ color: '#F2A62E', thickness: 0.17, lift: night ? 0.55 : 1, caustic: 1.3, rim: night ? 1.2 : 0.7 })); taxi.frustumCulled = false; bowG.add(taxi);
      const pos = [], uv = [], idx = [], NV = 4;
      for (let k = 0; k <= NR; k++) for (let v = 0; v <= NV; v++) { const a = -A + (k / NR) * 2 * A, q = sp(a, v / NV); pos.push(q[0], q[1], q[2]); uv.push(k / NR, v / NV); }
      for (let k = 0; k < NR; k++) for (let v = 0; v < NV; v++) { const a = k * (NV + 1) + v, b = a + NV + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
      const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); sg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); sg.setIndex(idx);
      const sm = new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, side: THREE.DoubleSide, uniforms: screenU,
        vertexShader: /* glsl */`varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
        fragmentShader: /* glsl */`
          uniform float uTime, uWet, uShow; uniform vec2 uGlit; uniform vec3 uFogCol, uSunCol, uTintC, uGlitC; varying vec2 vUv;
          float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
          void main(){
            vec2 g = vec2(vUv.x * 46., vUv.y * 7.); float col = floor(g.x), hs = h21(vec2(col, 3.1));
            float sp = 0.12 + 0.3 * hs, y = fract(g.y * 0.35 - uTime * sp + hs * 9.);          // beads of water sliding up the screen
            vec2 c = vec2(fract(g.x) - 0.5, (y - 0.5) * 2.4);
            float bead = (1. - smoothstep(0.06, 0.14, length(c * vec2(1., 1.3)))) * step(0.45, hs);
            float trail = (1. - smoothstep(0.02, 0.1, abs(c.x))) * smoothstep(-1.1, -0.1, c.y) * step(c.y, 0.) * step(0.45, hs) * 0.1;
            float edge = smoothstep(0.86, 1., vUv.y) + smoothstep(0.1, 0., vUv.y);
            // the rare burst bubble: round soft sparkles spreading out from where it hit, each twinkling slowly on its own clock
            float gl = 0., glc = 0.;
            if (uGlit.x > 0.001) {
              vec2 gp = vUv * vec2(34., 11.), gid = floor(gp), gf = fract(gp) - 0.5;
              float gh = h21(gid + 11.3), gh2 = h21(gid + 47.7);
              vec2 gd = (gf - (vec2(gh2, fract(gh * 17.3)) - 0.5) * 0.5) * vec2(1., 1.25);
              float gr = length(gd), from = length(((gid + 0.5) / vec2(34., 11.) - vec2(0.5, 0.84)) * vec2(3.0, 1.0));
              float sp = (1. - smoothstep(0., 0.3, gr)) + 0.5 * (exp(-abs(gd.x) * 34.) * exp(-abs(gd.y) * 5.) + exp(-abs(gd.y) * 34.) * exp(-abs(gd.x) * 5.));
              float tw = 0.5 + 0.5 * sin(uTime * (2. + 3. * gh) + gh * 40.); tw *= tw; tw *= tw;
              gl = sp * (0.25 + 0.75 * tw) * step(0.74, gh2) * (1. - smoothstep(uGlit.y - 0.35, uGlit.y, from)) * uGlit.x;
              glc = step(0.5, gh);
            }
            float a = 0.05 + 0.1 * edge + (bead * 0.3 + trail) * uWet + gl * 0.9 + dot(uTintC, vec3(0.2));
            vec3 colr = mix(uFogCol * 1.02, uTintC * 2.6, clamp(dot(uTintC, vec3(3.)), 0., 1.)) + (uFogCol * 0.6 + uTintC) * bead * 0.3 + mix(uSunCol, pow(clamp(uGlitC, 0.02, 1.), vec3(0.5)) * 1.6 + 0.2, glc * 0.7) * gl * 1.5;
            gl_FragColor = vec4(max(colr, 0.), clamp(a, 0., 0.9) * uShow);
          }`,
      });
      const screen = new THREE.Mesh(sg, sm); screen.frustumCulled = false; screen.renderOrder = 40; bowG.add(screen);
      const PBn = new GB(); PBn.mat(lin(castId === 'ember' ? GLASS.aqua : GLASS.ruby), 0.5, 20);
      PBn.lathe(0, 0, [[-0.17, 0.004], [-0.12, 0.04], [-0.06, 0.03], [0, 0.006]], 6);
      PBn.mat(MILK, 0.2, 29); PBn.quad([0.01, -0.05, 0], [0.24, -0.08, 0], [0.24, 0.04, 0], [0.01, 0.01, 0], [0, 0, 1, 0, 1, 1, 0, 1], true);
      const pm = new THREE.Mesh(PBn.build(), glassM({ thickness: 0.2, lift: 1 })); pm.frustumCulled = false; pendant.add(pm); pendant.position.set(0, -1.29, -3.45); bowG.add(pendant);
      if (night) {                                                                 // by lantern the bow carries its own lamp at the jackstaff: a small flame and its pool of light on the amber deck
        const lg = new THREE.BufferGeometry(), lp = [], lu = [], lk = [], li = [];
        const q4 = (pts, k) => { const b = lp.length / 3; for (let j = 0; j < 4; j++) { lp.push(pts[j][0], pts[j][1], pts[j][2]); lu.push(j === 0 || j === 3 ? -1 : 1, j < 2 ? -1 : 1); lk.push(k); } li.push(b, b + 1, b + 2, b, b + 2, b + 3); };
        q4([[-0.5, -1.7, -3.45], [0.5, -1.7, -3.45], [0.5, -0.7, -3.45], [-0.5, -0.7, -3.45]], 1);
        q4([[-1.25, -1.455, -1.55], [1.25, -1.455, -1.55], [1.25, -1.455, -3.6], [-1.25, -1.455, -3.6]], 0.3);
        lg.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3)); lg.setAttribute('uv', new THREE.Float32BufferAttribute(lu, 2)); lg.setAttribute('aK', new THREE.Float32BufferAttribute(lk, 1)); lg.setIndex(li);
        const lm = new THREE.ShaderMaterial({
          transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uTime: GU.uTime },
          vertexShader: /* glsl */`attribute float aK; varying vec2 vUv; varying float vK; void main(){ vUv = uv; vK = aK; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
          fragmentShader: /* glsl */`uniform float uTime; varying vec2 vUv; varying float vK;
            void main(){ vec2 d = vUv - vec2(0., vK < 0.5 ? 0.7 : 0.); float r2 = dot(d, d), fl = 0.88 + 0.12 * sin(uTime * 7.3) * sin(uTime * 3.1 + 1.);
              float g = vK > 0.5 ? exp(-r2 * 60.) * 3. + exp(-r2 * 7.) * 0.5 : exp(-r2 * 2.6) * (1. - smoothstep(0.75, 1., max(abs(vUv.x), abs(vUv.y))));
              gl_FragColor = vec4(vec3(1., 0.62, 0.24) * g * vK * fl, 1.); }`,
        });
        const lamp = new THREE.Mesh(lg, lm); lamp.frustumCulled = false; lamp.renderOrder = 39; bowG.add(lamp);
      }
    }
    scene.add(boat);
    await ctx.yield();

    // ---- gondolas: moored ones knock against the walls, others travel the left lanes of the grand canal; the parasol ferry
    const gb = rng.fork('boats'), gon = [];
    const laneP = Lp.slice(0, 8 + nLane), lane = polyline(laneP), laneA = 30, laneB = lane.length - 4;
    const addG = (x, z, yaw, o) => gon.push({ x, z, yaw, ph: gb() * 20, moving: 0, sc: gb.range(0.9, 1.08), ...o });
    addG(-4.55, 58, 0, { sc: 0.85 }); addG(4.55, 74, Math.PI, { sc: 0.85 }); addG(-4.55, 99, 0.02, { sc: 0.85 });      // moored hard against the walls of the side canal, whole in the frame
    for (const h of houses) {
      if ((h.bank !== 'R' && h.bank !== 'L') || !h.near || gb.chance(0.45)) continue;
      const a = gb.range(-0.2, 0.2) * h.w; addG(h.x + h.tx * a + h.nx * 1.25, h.z + h.tz * a + h.nz * 1.25, Math.atan2(h.tx, h.tz) + (gb.chance(0.5) ? Math.PI : 0));
    }
    for (const d of [8, 21]) { const a = bankR.at(d); addG(a.x + a.tz * 2.6, a.z - a.tx * 2.6, Math.atan2(a.tx, a.tz)); }
    const nMove = Math.round(9 * Math.min(1.3, density));
    for (let k = 0; k < nMove; k++) { const v = (k % 3 === 0 ? 1 : -1) * gb.range(1.5, 2.9); gon.push({ moving: 1, off: 8 + ((k * 5.3) % 14), v, d0: laneA + ((k + gb()) / nMove) * (laneB - laneA), ph: gb() * 20, sc: gb.range(0.95, 1.1), x: 0, z: 0, yaw: 0 }); }
    for (const [cx, cz, rx, rz, n] of [RH(-40, -72).concat([30, 22, 4]), RH(58, -62).concat([25, 17, 3]), RH(112, -140).concat([11, 28, 2]), offs(386, -37).concat([12, 16, 2]), offs(441, -33).concat([9, 9, 2]), offs(470, -50).concat([10, 8, 2])]) for (let k = 0; k < n; k++) gon.push({ moving: 2, cx, cz, rx: rx * gb.range(0.75, 1.1), rz: rz * gb.range(0.75, 1.1), w: (k % 2 ? -1 : 1) * gb.range(0.018, 0.03), ph: (k / n) * TAU + gb(), sc: gb.range(0.95, 1.1), x: 0, z: 0, yaw: 0 });
    // gondolas keep pace ahead of the bow from the bridge on: each waits, rocking, until we come up. The two off the right bow
    // go before us down the right bank, a boat's length and more apart (32 m and 46 m ahead of the bow, as fast as we go); one
    // keeps pace off the left bow, and two more down the outsides of the last avenue.
    // WHERE THEY LIE TO IS ONE RULE IN SPACE, THE BERTHS. Beyond the end of the right bank (D_BASIN) boats berth one behind the
    // other in the open basin: a berth every BERTH_EVERY metres of the fairway counted from the bank's end (18 m: a gondola and
    // half a length of clear water) and BERTH_OFF metres off our track (20 m: we pass each one whole against the water, never
    // under the lens). The first berth's length beyond the bank's end is the market boat's that lies moored there, so the row
    // is d 381, 399, 417. Every gondola that comes down the right bank ahead of the bow passes inside that market boat and
    // swings out over the BERTH_EVERY metres before the first berth (BERTH_OUT, d 363, to 381), and they fill the row in the
    // order they travel, the leading boat in the farthest berth.
    // A gondola with no berth to go to keeps its pace to the end of its water and only there lies to: the one off the left bow
    // down the left edge of the fairway to the head of the avenue (AVE_HEAD, the first pair of poles), one berth short of it;
    // those down the outsides of the avenue to its far lanterns (AVE_LANTERN: the posts at LEN - 27 set with the lanterns
    // above), each with its bow at the post on its side (AVE_MOOR short of it: half a gondola and a little).
    // (off, a, r, d0, d1, then where it swings out: the offset it ends at, and between which metres of the fairway.)
    const BERTH_OFF = 20, BERTH_EVERY = 18, berthAt = (j) => D_BASIN + (j + 2) * BERTH_EVERY, BERTH_OUT = berthAt(0) - BERTH_EVERY, AVE_HEAD = LEN - 102, AVE_LANTERN = LEN - 27, AVE_MOOR = 6.5;
    for (const [off, a, r, d0, d1, o1, da, db] of [[7.5, 92, 0.75, 292, AVE_HEAD - BERTH_EVERY], [-8, 32, 1, 300, berthAt(1), -BERTH_OFF, BERTH_OUT, berthAt(0)], [-5.5, 46, 1, 345, berthAt(2), -BERTH_OFF, BERTH_OUT, berthAt(0)], [8.6, 125.5, 0.77, 430, AVE_LANTERN - AVE_MOOR]]) gon.push({ moving: 3, off, a, r, d0, d1, o1: o1 ?? off, da: da ?? 0, db: db ?? 1, ph: xr() * 20, sc: xr.range(1.0, 1.1), x: 0, z: 0, yaw: 0 });
    // THE CROSSINGS: ONE RULE IN SPACE, the same for every gondola that crosses our bow. Its numbers are chosen for the canal.
    // Places: a crossing every CROSS_EVERY metres of the fairway, counted from the mouth of the grand canal (d = MOUTH_Z) and
    // for as long as the place lies short of the avenue (AVE_HEAD); never more than six. CROSS_EVERY is 64 m: two fifths of the
    // 160 m from the mouth to the great bridge, so the bridge falls midway between the second place and the third. That is
    // 64, 128, 192, 256 and 320 m from the mouth (d 174, 238, 302, 366, 430). A crossing any part of whose track would lie
    // within CROSS_BRIDGE metres of the bridge's centre line is left out (9 m: the deck reaches 3.6 m to either side and half
    // a gondola is 5.4 m; with 64 m none is).
    // Track: each puts out from the left, the side of the quay and the lanes, and comes over to the right. Its track is fixed
    // in the water: from CROSS_HALF metres left of the fairway's centre line, CROSS_OVER / 2 above its place, slanting down
    // the canal to CROSS_HALF metres right of it, CROSS_OVER / 2 below (5 m either side: inside the lines of net floats, poles
    // and moored boats; 45 m of fairway, so it crosses at the slant of a boat that is going our way). It is on the centre line
    // at its place.
    // When: it waits at the head of its track, rocking, until the bow comes within CROSS_LEAD metres of it (16 m: a boat's
    // length and a half), and then goes down its track keeping that lead: every one crosses 16 m ahead of the bow.
    // After: at the end of its track it ships its oar, glides to rest at the edge of the fairway within CROSS_GLIDE metres
    // (6 m) and lies to; we draw past it. But one that comes across within CROSS_OVER metres of the end of the right bank has
    // the berths before it: it keeps its lead instead, follows the two that go before us out into the basin and lies to in
    // the nearest berth of the row (they travel ahead of it and take the farther ones).
    // Where each one is depends only on where the bow is, in metres: not on the clock, not on a fraction of the flight. Their
    // rocking takes the one draw the gondola that crossed below the bridge always took (yr), so no stream is shifted.
    const CROSS_EVERY = 64, CROSS_BRIDGE = 9, CROSS_HALF = 5, CROSS_OVER = 45, CROSS_LEAD = 16, CROSS_GLIDE = 6;
    {
      const ph0 = yr() * 20; let n = 0;
      for (let dc = MOUTH_Z + CROSS_EVERY; dc < AVE_HEAD && n < 6; dc += CROSS_EVERY) {
        const d0 = dc - CROSS_OVER / 2, dx = dc + CROSS_OVER / 2;
        if (d0 < D_BRIDGE + CROSS_BRIDGE && dx > D_BRIDGE - CROSS_BRIDGE) continue;
        const berth = dx <= D_BASIN && D_BASIN - dx < CROSS_OVER;
        gon.push({ moving: 4, d0, dx, d1: berth ? berthAt(0) : dx + CROSS_GLIDE, berth, ph: ph0 + 3.7 * n++, sc: 1.08, x: 0, z: 0, yaw: 0 });
      }
    }
    gon.push({ moving: 3, off: -9.3, a: 131, r: 0.77, d0: 450, d1: AVE_LANTERN - AVE_MOOR, o1: -9.3, da: 0, db: 1, ph: 15.1, sc: 1.06, x: 0, z: 0, yaw: 0 });
    // and one goes before us down the side canal, its gondolier standing at the oar: it keeps some 12 m ahead of the bow the
    // whole length of the slot, close and whole in the frame, and swings away to the left quay as the grand canal opens
    gon.push({ moving: 6, a: 13.5, r: 0.97, d1: 150, o0: 1.8, o1: 24, da: 100, db: 150, ph: 9.1, sc: 0.9, x: 0, z: 0, yaw: 0 });
    // the gondolas of the basin (every one that travels and whose water lies beyond the end of the right bank) are bright blown
    // glass like the market boats, each one clean colour with a bright rim; the black amethyst ones keep to the canals
    const basinD = (g) => (g.moving === 2 ? path.nearestXZ(g.cx, g.cz).u * LEN : g.moving === 3 || g.moving === 4 ? g.d1 : 0);
    const gMoor = gon.filter((g) => !g.moving), gRun = gon.filter((g) => g.moving), gBasin = gRun.filter((g) => basinD(g) > D_BASIN), gMove = gRun.filter((g) => !(basinD(g) > D_BASIN));
    // market boats lying off the fairway between the bridge and the basin: glass fruit under striped awnings, a lantern on each bow
    const market = [[306, 12.5, 0.45, 'ruby'], [358, -13, -0.6, 'amber'], [398, -13, 2.7, castId === 'ember' ? 'cobalt' : 'aqua'], [214, -8.6, 0.3, 'rose'], [462, -18, 0.5, 'celadon'], [498, -24, -0.7, 'ruby'], [432, 11.8, 0.15, 'amethyst']].map(([d, off, turn, name]) => {
      const q = offs(d, off); path.tangentAtDist(d, tmpB); const yaw = Math.atan2(tmpB.x, tmpB.z) + turn;
      flames.push([q[0] + Math.sin(yaw) * 3.5, 2.35, q[1] + Math.cos(yaw) * 3.5, 1.1]);
      return { x: q[0], z: q[1], yaw, ph: xr() * 20, col: C3(GLASS[name]) };
    });
    const MB = new GB(); marketGeo(MB, ['#C2183A', '#F2A62E', '#1F7A4C', '#E27892', '#7B4BB0', '#F2A62E'].map(lin), lin('#EDE7DC'));
    const marketMesh = new THREE.InstancedMesh(MB.build(), glassM({ thickness: 0.25, rim: 0.8 }), market.length);
    market.forEach((m, i) => marketMesh.setColorAt(i, m.col));
    marketMesh.frustumCulled = false; marketMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); scene.add(marketMesh);
    await ctx.yield();
    // strings of blown-glass net floats lying on the water beside the fairway and across the basin off the right bow: each is
    // its own reflection, and they bob
    const floats = [];
    {
      const fr = yr.fork('floats'), fcols = cast.slice(0, 6).map((c) => C3(GLASS[c[0]]));
      for (const [d0, s0, d1, s1, n] of [[292, -10.6, 322, -11.2, 14], [346, 10.2, 368, 10.6, 12], [404, -11, 428, -12, 12], [446, -12, 474, -13, 13], [472, -23, 488, -29, 10], [490, -34, 515, -42, 12], [150, -9.2, 174, -9.6, 9], [222, -7.4, 242, -8.0, 9], [312, 10.2, 328, 10.8, 8], [372, 9.2, 398, 10.2, 12]]) {
        const sag = fr.range(0.6, 1.4) * (s0 > 0 ? 1 : -1);                    // each string sags away from the fairway
        for (let k = 0; k < n; k++) {
          const t = k / (n - 1), q = offs(mix(d0, d1, t), mix(s0, s1, t) + sag * Math.sin(Math.PI * t));
          if (path.nearestXZ(q[0], q[1]).dist < (d0 < 290 ? 6.8 : 8.2)) continue;
          floats.push({ x: q[0], z: q[1], r: k % 3 === 0 ? fr.range(0.46, 0.58) : fr.range(0.3, 0.42), ph: fr() * 20, c: fcols[(k + floats.length) % fcols.length].clone().offsetHSL(0, 0.05, fr.range(-0.03, 0.05)) });
        }
      }
    }
    for (const f of floats) if (f.r > 0.45) flames.push([f.x, f.r * 0.55, f.z, 0.5]);                                  // the large floats are lanterns: a flame burns in each
    const FB = new GB(); for (const sg of [1, -1]) { FB.mat(WHITE, 0.3, 0); FB.blob(0, sg * 0.45, 0, 1, 1, 1, 4, 8); FB.mat(MILK, 0.6, 20); FB.blob(0, sg * 1.4, 0, 0.2, 0.14, 0.2, 2, 5); }
    const floatMesh = new THREE.InstancedMesh(FB.build(), glassM({ thickness: 0.3, rim: 0.9, selfMirror: true }), Math.max(1, floats.length));
    floats.forEach((f, i) => { M4.makeScale(f.r, f.r, f.r).setPosition(f.x, 0, f.z); floatMesh.setMatrixAt(i, M4); floatMesh.setColorAt(i, f.c); });
    floatMesh.count = floats.length; floatMesh.frustumCulled = false; floatMesh.name = 'floats'; floatMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); if (floatMesh.instanceColor) floatMesh.instanceColor.needsUpdate = true; scene.add(floatMesh);
    await ctx.yield();
    const figs = ['#EDE7DC', '#E27892', '#F2A62E'].map(lin), gMat = glassM({ thickness: 0.5, core: 0.4, rim: 0.3 }), gCol = C3('#3a2552');
    const B1 = new GB(); gondolaGeo(B1, null); const B2 = new GB(); gondolaGeo(B2, figs[gb.int(0, 2)]);
    const moorMesh = new THREE.InstancedMesh(B1.build(), gMat, gMoor.length), moveMesh = new THREE.InstancedMesh(B2.build(), gMat, gMove.length);
    for (let i = 0; i < gMoor.length; i++) moorMesh.setColorAt(i, gCol); for (let i = 0; i < gMove.length; i++) moveMesh.setColorAt(i, gCol);
    moorMesh.frustumCulled = false; moveMesh.frustumCulled = false; moorMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); moveMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); scene.add(moorMesh, moveMesh);
    const basinCols = ['rose', 'amber', 'aqua', 'ruby', 'celadon', 'amethyst', 'cobalt'].map((n) => C3(GLASS[n]).offsetHSL(0, 0.06, 0.04));
    const basinMesh = new THREE.InstancedMesh(moveMesh.geometry, glassM({ thickness: 0.3, rim: 0.9 }), Math.max(1, gBasin.length));
    for (let i = 0; i < gBasin.length; i++) basinMesh.setColorAt(i, basinCols[i % basinCols.length]);
    basinMesh.count = gBasin.length; basinMesh.frustumCulled = false; basinMesh.name = 'basin-gondolas'; basinMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); scene.add(basinMesh);
    gMove.forEach((g, i) => { g.mesh = moveMesh; g.idx = i; }); gBasin.forEach((g, i) => { g.mesh = basinMesh; g.idx = i; });
    const crossOff = (g, d) => mix(CROSS_HALF, -CROSS_HALF, sstep(g.d0, g.dx, d)) + (g.berth ? (CROSS_HALF - BERTH_OFF) * sstep(BERTH_OUT, berthAt(0), d) : 0);   // a crossing gondola's metres left of the centre line at d metres of the fairway
    const lane_ = { x: 0, z: 0, tx: 0, tz: 1 };
    const laneAt = (d) => {
      const cum = lane.cum; let i = 1; while (i < laneP.length - 1 && cum[i] < d) i++;
      const a = laneP[i - 1], b = laneP[i], l = cum[i] - cum[i - 1] || 1, t = (d - cum[i - 1]) / l;
      lane_.x = a[0] + (b[0] - a[0]) * t; lane_.z = a[1] + (b[1] - a[1]) * t; lane_.tx = (b[0] - a[0]) / l; lane_.tz = (b[1] - a[1]) / l;
    };
    const ferry = new THREE.Group();
    {
      const B = new GB(), v0 = B.count, i0 = B.i.length, NS = 10, L = 6.5;
      B.mat(lin('#3a2552'), 0.6, 0);
      const sec = (t) => { const at = Math.abs(t); return [2.1 * Math.pow(Math.max(0, 1 - Math.pow(at, 3.2)), 0.6) + 0.05, 0.7 + 0.5 * Math.pow(at, 3), -0.15 + 0.5 * Math.pow(at, 4)]; };
      for (let s2 = 0; s2 <= NS; s2++) { const t = -1 + (2 * s2) / NS, [b, yg, yk] = sec(t); for (const q of [[-b, yg], [-b * 0.85, yk + 0.15], [0, yk], [b * 0.85, yk + 0.15], [b, yg]]) B.v(q[0], q[1], t * L, 0, 1, 0, q[0], t * L); }
      for (let s2 = 0; s2 < NS; s2++) for (let j = 0; j < 4; j++) { const a = v0 + s2 * 5 + j, b = a + 1, c = a + 5, d = c + 1; B.i.push(a, b, c, b, d, c); }
      B.smooth(v0, i0);
      B.mat(lin('#6b5a86'), 0.8, 0); B.quad([-1.9, 0.62, 5], [1.9, 0.62, 5], [1.9, 0.62, -5], [-1.9, 0.62, -5]);
      const np = carnival ? 12 : 6;
      for (let k = 0; k < np; k++) {
        const x = (k % 2 ? 0.9 : -0.9) * (np > 6 ? 1.15 : 1), z = (((k / 2) | 0) / (np / 2 - 1) - 0.5) * (np > 6 ? 8.4 : 6.2), c = parasolCols[(k * 3 + 1) % parasolCols.length];
        B.mat(figs[k % 3], 0.5, 20); B.lathe(x, z, [[0.62, 0.2], [1.5, 0.23], [1.95, 0.25], [2.1, 0.1], [2.2, 0.13], [2.36, 0.03]], 5);
        B.mat(MILK, 0.7, 25); B.tube([[x + 0.25, 1.6, z], [x + 0.3, 3.0, z]], 0.03, 3);
        B.mat(c, 0.25, 20, 0.02); B.lathe(x + 0.3, z, [[2.75, 1.0], [2.86, 0.96], [3.12, 0.5], [3.26, 0.04]], 9, { mod: (a) => 1 + 0.05 * Math.cos(a * 9) });
      }
      const fm = new THREE.Mesh(B.build(), glassM({ thickness: 0.2 })); fm.frustumCulled = false; ferry.add(fm); scene.add(ferry);
    }
    await ctx.yield();
    // the vaporetto: it comes up the left of the fairway toward us and passes close by the bow before the bridge, keyed to our progress
    const vap = new THREE.Group(); vap.name = 'vaporetto';
    {
      const B = new GB(); vaporettoGeo(B, lin(castId === 'ember' ? GLASS.cobalt : GLASS.ruby), [parasolCols[1], parasolCols[3], parasolCols[5], parasolCols[6]]);
      const vm = new THREE.Mesh(B.build(), glassM({ thickness: 0.25, rim: 0.8 })); vm.frustumCulled = false; vap.add(vm); scene.add(vap);
    }
    // promenaders under parasols crossing the great bridge, both ways
    const walkers = [], bux = (bridgeA[0] - bridgeB[0]) / Math.hypot(bridgeA[0] - bridgeB[0], bridgeA[1] - bridgeB[1]), buz = (bridgeA[1] - bridgeB[1]) / Math.hypot(bridgeA[0] - bridgeB[0], bridgeA[1] - bridgeB[1]);
    { const wr = yr.fork('walkers'); for (let k = 0; k < 10; k++) walkers.push({ s: wr() * 2, v: (k % 2 ? -1 : 1) * wr.range(0.02, 0.032), z: (k % 2 ? -1 : 1) * wr.range(0.7, 2.6), sc: wr.range(1.15, 1.35), ph: wr() * 20 }); }
    const WB = new GB(); walkerGeo(WB);
    const walkMesh = new THREE.InstancedMesh(WB.build(), glassM({ thickness: 0.3 }), walkers.length);
    walkers.forEach((w, i) => { const c = parasolCols[(i * 3 + 1) % parasolCols.length]; walkMesh.setColorAt(i, new THREE.Color().setRGB(c[0], c[1], c[2])); });
    walkMesh.frustumCulled = false; walkMesh.name = 'walkers'; walkMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); walkMesh.instanceColor.needsUpdate = true; scene.add(walkMesh);
    await ctx.yield();
    // the glass barge moored off the left quay beyond the bridge, loaded with finished chandeliers, goblets and vases: cold glass, nothing on it glows
    const barge = new THREE.Group(); barge.name = 'barge';
    {
      const BG_D = 336, q = offs(BG_D, 15); path.tangentAtDist(BG_D, tmpB);
      const B = new GB(); bargeGeo(B, [lin(GLASS.ruby), lin(GLASS.aqua), lin(GLASS.amber), lin(GLASS.cobalt), lin(GLASS.rose), lin(GLASS.amethyst)]);
      const bm = new THREE.Mesh(B.build(), glassM({ thickness: 0.2, rim: 0.8 })); bm.frustumCulled = false; barge.add(bm);
      barge.position.set(q[0], 0, q[1]); barge.rotation.order = 'YXZ'; barge.rotation.y = Math.atan2(tmpB.x, tmpB.z) + 0.07; barge.userData.yaw = barge.rotation.y; scene.add(barge);
    }
    await ctx.yield();

    // ---- air: fog in drifting sheets, motes, lantern flames
    const timeU = { value: 0 }, air = fx.fxGroup(); air.object.name = 'air'; scene.add(air.object);
    const mistCol = night ? '#2c3a64' : '#fffaf0';
    const mist = air.add(fx.makeMist({ rng: rng.fork('mist'), time: timeU, follow: true, count: Math.round(56 * detail), area: [300, 7, 300], center: [0, 3.2, 0], size: [20, 46], color: mistCol, opacity: look.mist, drift: [-1.0, 0, -0.75] }));
    const gfog = air.add(fx.makeGroundFog({ time: timeU, layers: 4, size: 760, y: 0.25, height: look.gfog[1], color: mistCol, opacity: look.gfog[0], coverage: frost ? 0.62 : 0.5, scale: 0.011, wind: [-1.3, -1.0], sunDir: SUN, sunColor: look.sun, scatter: look.gfog[2] }));
    const mistOp = mist?.uniforms?.uOpacity?.value ?? 0, gfogOp = gfog?.uniforms?.uOpacity?.value ?? 0;
    const motes = air.add(fx.makeParticles({ rng: rng.fork('motes'), preset: 'dust', time: timeU, count: Math.round(1500 * detail), box: [44, 20, 44], colors: night ? ['#ffb060', '#ffd9a0', '#9fb4ff'] : ['#fff6e0', '#ffe9c0', '#ffffff'], size: [0.02, 0.05] }));
    if (night) for (let i = 0; i < poles.length; i += 2) flames.push([poles[i].x, poles[i].h + 0.3, poles[i].z, 0.55]);   // by lantern: every other mooring pole carries a flame
    hero.materials.tower.uniforms.uHeatAll.value = night ? 0.17 : 0;                                                  // and the tower keeps an ember in its glass
    if (night) for (const f of flames) if (f[1] > 9) f[3] = Math.min(f[3], 0.6);                                       // high lamps stay lamps: never a disc hanging in the sky
    air.add(fx.makeGlows({ positions: flames.map((f) => [f[0], f[1], f[2]]), sizes: flames.map((f) => f[3]), color: '#ffb25c', size: 2.3, intensity: look.flame, flicker: 0.55, halo: night ? 0.6 : 1, time: timeU }));

    // a small glow of the house's own colour at the pane each string comes through
    const PANE_GLOW = 0.36;
    srcGlow = air.add(fx.makeGlows({ positions: shafts.length ? shafts.map((b) => [b.x, b.y, b.z]) : [[0, -50, 0]], colors: shafts.length ? shafts.map((b) => b.c.clone().offsetHSL(0, 0.1, 0.06)) : ['#000000'], sizes: shafts.length ? shafts.map(() => PANE_GLOW) : [0], size: 2.6, intensity: 0, flicker: 0.1, halo: 0.6, core: 0.5, time: timeU }));
    await ctx.yield();

    // the hot star of the gather seen over the roofs, and the sun's glare coming in from the left edge when it breaks
    const star = air.add(fx.makeGlows({ positions: [[TOWER[0], 76, TOWER[1]]], color: '#FF3A00', size: 74, intensity: 0, fogAmount: 0.04, halo: 1.3, core: 0, rays: 0, depthTest: true, depthBias: 0.3, renderOrder: 4.3, time: timeU }));
    const glareU = { uK: { value: 0 }, uCol: { value: C3(look.warm) }, uC: { value: new THREE.Vector2(-1.03, 0.36) }, uAsp: { value: ctx.aspect || 1.78 }, uSoft: { value: 0 } };
    const glare = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, uniforms: glareU,
      vertexShader: /* glsl */`varying vec2 vP; void main(){ vP = position.xy; gl_Position = vec4(position.xy, 0., 1.); }`,
      fragmentShader: /* glsl */`uniform float uK, uAsp, uSoft; uniform vec2 uC; uniform vec3 uCol; varying vec2 vP;
        void main(){
          vec2 d = (vP - uC) * vec2(1., 1. / max(uAsp, 0.2)); float r2 = dot(d, d), r = sqrt(r2), hk = (r - 0.33) / 0.022;
          float g = exp(-r2 * mix(26., 40., uSoft)) * 1.6 + (exp(-r2 * 420.) * 9. + exp(-hk * hk) * 0.16) * (1. - uSoft) + 0.5 * exp(-abs(d.y) * mix(60., 34., uSoft)) * exp(-abs(d.x) * 2.2) * (1. + 0.8 * uSoft);   // uSoft: the sun still outside the frame, only its bloom standing on the edge
          gl_FragColor = vec4(mix(uCol, vec3(1., 0.97, 0.9), exp(-r2 * 90.)) * g * uK, 1.);
        }`,
    }));
    glare.frustumCulled = false; glare.renderOrder = 45; scene.add(glare);

    // ---- birds: pigeons bursting off the flooded square, another flock wheeling round the tower, gulls lifting as we pass
    const fl = { sunDir: SUN, sunColor: look.sun, sunIntensity: night ? 0.35 : 1.5, sky: night ? '#33405e' : look.fog, skyIntensity: night ? 0.7 : 1.25, ground: look.lagoon, groundIntensity: 0.9 };
    const fauna = F.makeFauna(scene, { light: fl });
    const pig = { body: '#8a8c96', belly: '#a4a6b0', wingC: '#70738a', trail: '#9a9cab', tip: '#454858', head: '#7B4BB0', beak: '#d8c9b0' };
    // (flock cure 1) every flock keeps 2.0 m of clear air from the flown line, BY PLACE, bird by bird: its course stays where it is laid, a bird whose own
    // reach comes within 2 m of the line is moved by what it alone lacks (the kit's keepClear with each), the deal is held at three scatters, and each has
    // a small wander of its own written out so that the lane it leaves about the line stays narrow. The stretches are the parts of the route each course
    // comes within 45 m of (the wheel and the escort: the whole route); each call is a build step of its own, and the wheel and the escort are made by
    // the kit's stepped maker (the same flock to the bit), which hands the page a frame between its slices.
    const clearOf = (from, to) => ({ path, dist: 2, each: true, from, to, step: 2 });
    fauna.add(F.makeFlock({ rng: rng.fork('pigeons'), species: 'crows', count: Math.round(70 * detail), size: 1.0, speed: 12, spread: [16, 7, 22], wander: [0.6, 0.4, 0.8, 0.4], maxSigma: 3, keepClear: clearOf(0.14, 0.52), palette: pig, cross: { path, u: 0.262, lead: 30, span: 170, angle: 58, side: -1, height: 9, rise: 26, offset: -6, duration } }), { always: true });
    await ctx.yield();
    fauna.add(await F.makeFlockAsync({ rng: rng.fork('tower'), species: 'crows', count: Math.round(60 * detail), size: 1.2, wander: [1.2, 0.8, 1.6, 0.4], maxSigma: 3, keepClear: clearOf(0, 1), palette: pig, center: [TOWER[0], 62, TOWER[1]], radius: 34, height: 62, wobble: 8 }, ctx.yield));
    await ctx.yield();
    fauna.add(await F.makeFlockAsync({ rng: rng.fork('gulls'), species: 'gulls', count: 9, wander: [1.6, 1, 1.6, 0.35], maxSigma: 3, keepClear: clearOf(0, 1), along: { path, side: 10, up: 5, lead: 36, from: 0.3, to: 0.97, drift: 10 } }, ctx.yield));
    await ctx.yield();
    fauna.add(F.makeFlock({ rng: rng.fork('gulls2'), species: 'gulls', count: 12, wander: [1, 0.6, 1, 0.35], maxSigma: 3, keepClear: clearOf(0.64, 0.95), cross: { path, u: 0.74, lead: 46, span: 220, angle: 70, side: 1, height: 7, rise: 16, duration } }));
    await ctx.yield();

    const tmpA0 = new THREE.Color();
    // ---- rare: the long breath. The belfry lets go a string of thirty clear bubbles that drift down the basin and over the bow
    let bubbles = null, bubRings = null; const bub = [];
    if (rare) {
      const rr = rng.fork('breath'), n = 30, g = new THREE.IcosahedronGeometry(1, 3);
      const m = new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, fog: true,
        uniforms: { ...THREE.UniformsUtils.merge([THREE.UniformsLib.fog]), uSunDir: GU.uSunDir, uFogCol: GU.uFogCol, uCol: { value: C3(towerHex) }, uTime: GU.uTime },
        vertexShader: /* glsl */`
          #include <common>
          #include <fog_pars_vertex>
          uniform float uTime; varying vec3 vN, vWP;
          void main(){
            vec3 p = position * (1. + 0.03 * sin(uTime * 2.1 + position.y * 3. + float(gl_InstanceID)));
            vec4 wp = modelMatrix * instanceMatrix * vec4(p, 1.); vWP = wp.xyz; vN = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal + vec3(0., 1e-5, 0.));
            vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */`
          #include <common>
          #include <fog_pars_fragment>
          uniform vec3 uSunDir, uFogCol, uCol; varying vec3 vN, vWP;
          void main(){
            vec3 N = normalize(vN + vec3(0., 1e-5, 0.)), V = normalize(cameraPosition - vWP + vec3(0., 1e-4, 0.));
            float ndv = abs(dot(N, V)), f = 1. - ndv, rim = f * f * f;
            vec3 H = normalize(normalize(uSunDir) + V + vec3(0., 1e-4, 0.)); float s = pow(max(dot(N, H), 0.), 60.);
            vec3 film = 0.5 + 0.5 * cos(6.2832 * (f * 1.6 + N.y * 0.35 + vec3(0., 0.33, 0.67)));          // the soap-thin wall: swimming colours, deepest at the limb
            vec3 tc = pow(clamp(uCol, 0.02, 1.), vec3(0.6));
            vec3 col = mix(uFogCol * 0.72, film * (0.45 + 0.45 * uFogCol) + tc * 0.3, 0.4 + 0.5 * rim) + tc * rim * 0.8 + (tc * 1.6 + 0.25) * s * 5. + uFogCol * rim * rim * 0.4;
            col *= 0.86 + 0.14 * N.y;                                                                         // a little weight underneath
            gl_FragColor = vec4(max(col, 0.), clamp(0.2 + f * f * 0.9 + s, 0., 0.95));
            #include <fog_fragment>
          }`,
      });
      bubbles = new THREE.InstancedMesh(g, m, n); bubbles.frustumCulled = false; bubbles.renderOrder = 8; bubbles.instanceMatrix.setUsage(THREE.DynamicDrawUsage); scene.add(bubbles);
      let nk = 0;
      for (let i = 0; i < n; i++) {
        const hit = i === 9, close = !hit && i % 4 === 1, ut = hit ? 0.845 : 0.78 + (i / n) * 0.2 + rr.range(-0.01, 0.01), q = path.pointAt(Math.min(1, ut + 0.02), new THREE.Vector3());
        const sd = hit ? 0 : rr.chance(0.3) ? rr.range(6, 10) : -rr.range(9, 34), tq = hit ? [q.x, q.z] : offs(Math.min(LEN, (ut + 0.02) * LEN + rr.range(-10, 14)), sd);      // mostly over the open water off the right bow
        const b = { u0: 0.70 + i * 0.0035, hit, r: hit ? 1.3 : rr.range(1.3, 3.6), tx: tq[0], ty: hit ? 2.6 : rr.range(6, 22), tz: tq[1], ph: rr() * 9, sx: TOWER[0] + rr.range(-5, 5), sz: TOWER[1] + rr.range(-5, 5) };
        if (close) {                                                              // seven of them come down low beside the path, just ahead of the bow, between u 0.8 and 0.9
          const cq = offs((0.9 + nk * 0.012) * LEN, nk % 2 ? -(5.5 + ((nk * 2.7) % 7)) : 5.5 + ((nk * 1.3) % 3)); b.u0 = 0.655 + nk * 0.011; b.tx = cq[0]; b.ty = 3.4 + ((nk * 1.9) % 3.6); b.tz = cq[1]; b.r = 1.7 + ((nk * 0.37) % 1); nk++;
        }
        bub.push(b);
      }
      // a soft ring of the tower's colour on the water under each bubble
      const rgm = new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, fog: true, uniforms: { ...THREE.UniformsUtils.merge([THREE.UniformsLib.fog]), uCol: { value: C3(towerHex) }, uFogCol: GU.uFogCol, uTime: GU.uTime },
        vertexShader: /* glsl */`
          #include <common>
          #include <fog_pars_vertex>
          varying vec2 vUv; varying float vA;
          void main(){
            vUv = position.xz * 2.; vA = instanceColor.r;
            vec4 mvPosition = viewMatrix * modelMatrix * instanceMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */`
          #include <common>
          #include <fog_pars_fragment>
          uniform vec3 uCol, uFogCol; uniform float uTime; varying vec2 vUv; varying float vA;
          void main(){
            float r = length(vUv) + 0.03 * sin(atan(vUv.y, vUv.x + 1e-4) * 7. + uTime * 1.3), k = (r - 0.66) / 0.1;
            float ring = exp(-k * k), fill = (1. - smoothstep(0.1, 0.7, r)) * 0.35, hot = exp(-r * r * 26.);
            vec3 tc = pow(clamp(uCol, 0.02, 1.), vec3(0.55));
            vec3 col = tc * (0.75 + 0.9 * ring) + uFogCol * hot * 0.9;
            float fogK = exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
            gl_FragColor = vec4(max(col, 0.), clamp(ring * 0.8 + fill + hot * 0.5, 0., 0.9) * vA * (1. - smoothstep(0.9, 1., r)) * fogK);
          }`,
      });
      bubRings = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), rgm, n); bubRings.frustumCulled = false; bubRings.renderOrder = 3.5; bubRings.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      for (let i = 0; i < n; i++) bubRings.setColorAt(i, tmpA0.setRGB(0, 0, 0)); bubRings.instanceColor.setUsage(THREE.DynamicDrawUsage); scene.add(bubRings);
    }

    // ---- per frame
    const camDir = new THREE.Vector3(), tanV = new THREE.Vector3(), tmpC = new THREE.Color(), accC = C3(accentHex), fP = new THREE.Vector3(), fT = new THREE.Vector3();
    const sunBase = C3(look.sun).multiplyScalar(look.sunGain), warmC = C3(look.warm);
    const bufSize = new THREE.Vector2();
    const wrapPi = (a) => a - TAU * Math.round(a / TAU), D_FERRY = 252, camP = new THREE.Vector3(), sunV = new THREE.Vector3(), M4x = new THREE.Matrix4();
    const shadeAt = (x, y, z, out) => {                                          // the CPU twin of cityLight() in the shaders
      const i = Math.min(QW - 1, Math.max(0, Math.round(((x * pX + z * pZ - qMin) / (qMax - qMin)) * QW - 0.5))), H = hd[i * 4 + 3];
      const d = x * hX + z * hZ - hd[(QW + i) * 4], reach = mix(hd[(QW + i) * 4 + 1], hd[(QW + i) * 4 + 2], CITY.uShaftN.value.w), yb = y + d * CITY.uQ.value.z;
      out.setRGB(hd[i * 4], hd[i * 4 + 1], hd[i * 4 + 2]);
      return sstep(0.5, 4, d) * (1 - sstep(H - 5, H, yb)) * sstep(1, 6, H) * (1 - sstep(reach * 0.75, reach, d));
    };
    const shaftAt = (x, y, z, out) => {                                          // the CPU twin of shaftLight(): how deep a point stands in the light of one pane of the harp, and its colour
      const sd = SH.sd; if (!sd) return 0;
      const q = x * pX + z * pZ, al = x * hX + z * hZ, Y = y + al * tanEl, i = Math.floor((q - SH.q0) / SH.cw), j = Math.floor((Y - SH.Y0) / SH.ch);
      if (i < 0 || i >= SH.NQ || j < 0 || j >= SH.NY) return 0;
      const k0 = (2 * j * SH.NQ + i) * 4, k1 = ((2 * j + 1) * SH.NQ + i) * 4, r = sd[k0 + 2]; if (r < 0.5) return 0;
      const dq = (q - sd[k0]) / r, dY = ((Y - sd[k0 + 1]) * cosEl) / r, m = Math.max(0, 1 - dq * dq - dY * dY), d = al - sd[k0 + 3];
      out.setRGB(sd[k1], sd[k1 + 1], sd[k1 + 2]);
      return sstep(0, 0.5, m) * sstep(0.6, 3, d) * (1 - sstep(sd[k1 + 3] - 2.5, sd[k1 + 3], d));
    };
    // while u is 0 this world is the picture inside the last world's portal and the camera handed to update() is the portal's:
    // the boat (a frame round the eye, no light in it) is left out of that picture; its bow wave stays where the path starts
    const eye0 = path.posAtDist(0, new THREE.Vector3()), gaze0 = path.posAtDist(22, new THREE.Vector3()).sub(eye0).normalize();
    function update(dt, time, camera, u) {
      GU.uTime.value = time; timeU.value = time;
      boat.visible = u > 0;
      const dn = look.dens;
      const dens = u < 0.13 ? dn[0] : u < 0.22 ? mix(dn[0], dn[1], sstep(0.13, 0.22, u)) : u < 0.5 ? mix(dn[1], dn[2], (u - 0.22) / 0.28) : u < 0.72 ? mix(dn[2], dn[3], (u - 0.5) / 0.22) : mix(dn[3], dn[4], sat((u - 0.72) / 0.28));
      scene.fog.density = mix(Math.min(0.0085, dn[0]), dens, sstep(0.0, 0.05, u));                // thinner for the view through the portal and the first metres: both walls keep their colour
      { const thin = sstep(0.21, 0.6, u); if (mist?.uniforms?.uOpacity) mist.uniforms.uOpacity.value = mistOp * mix(1, 0.2, thin); if (gfog?.uniforms?.uOpacity) gfog.uniforms.uOpacity.value = gfogOp * mix(1, frost ? 0.9 : 0.2, thin); }   // the sheets thin out over the basin: the tower stands clear to its foot
      CITY.uInner.value = look.inner * (look.late ? 1 - 0.8 * sstep(uOn, uOn + 0.08, u) : 1);      // at dawn the windows glow until the sun arrives
      const W = CITY.uWave.value;
      // the sun climbs out of the fog bank over the last metres of the side canal, from where the design had it (el0) to where it
      // stands over the grand canal (el): the glass, the houses' coloured shade, the sky and the water all take the one sun
      { const sk = sstep(MOUTH_Z - 18, MOUTH_Z + 2, u * LEN), e = mix(el0, el, sk); sunAt(e, SUN); GU.uSunDir.value.copy(SUN); CITY.uQ.value.z = Math.tan(e); CITY.uShaftN.value.w = sk; }
      sunOut.value = sstep(uOn, uOn + 0.06, u); beamGain.value = look.beam;
      W.x = u < uOn ? -200 : u > uOn + 0.07 ? 4000 : ((u - uOn) / 0.06) * 430;
      W.z = (night ? 0.1 : 0.14) * mix(1, 0.34, sstep(0.2, 0.3, u));
      if (srcGlow) srcGlow.uniforms.uIntensity.value = (night ? 1.6 : 1.5) * look.beam * sunOut.value;
      GU.uSunCol.value.copy(sunBase).multiplyScalar(0.3 + 0.7 * sunOut.value);
      CITY.uRake.value.copy(warmC).multiplyScalar(look.rake * sunOut.value);
      throughU.value = u > 0 ? 0 : 1; crestU.value = u > 0 ? mix(1, 0.7, sstep(0.82, 0.88, u)) : 0;
      // our boat follows the eye; the bow keeps a little of the direction of travel when the gaze turns
      path.tangentAt(u, tanV); const tl = Math.hypot(tanV.x, tanV.z) || 1, hx = tanV.x / tl, hz = tanV.z / tl;
      if (u > 0) camera.getWorldDirection(camDir); else camDir.copy(gaze0);
      const camYaw = Math.atan2(-camDir.x, -camDir.z), dyaw = wrapPi(Math.atan2(-hx, -hz) - camYaw);
      // the bow takes four fifths of the gaze's pitch; beyond the great bridge, where the gaze is held up on the tower all the way to
      // the ring, it rides with the gaze whole: the bow keeps its eighth of the frame, jackstaff and lamp, and never sinks to an arc
      const camPitch = Math.asin(Math.max(-1, Math.min(1, camDir.y))), ride = camPitch > 0 ? sstep(D_BRIDGE + 6, D_BRIDGE + 36, u * LEN) : 0;
      E3.set(camPitch * mix(0.8, 1, ride), camYaw + Math.max(-0.5, Math.min(0.5, dyaw)) * 0.35, 0, 'YXZ');
      if (u > 0) camP.setFromMatrixPosition(camera.matrixWorld); else camP.copy(eye0);   // never camera.position: the camera behind a portal has only its world matrix
      boat.position.copy(camP); boat.quaternion.setFromEuler(E3);
      lidDir.set(TOWER[0] - camP.x, 135 - camP.y, TOWER[1] - camP.z).normalize();                 // where the pipes go up into the fog, for the sky
      if (srcGlow) for (let i = 0; i < shafts.length; i++) { const b = shafts[i]; srcGlow.setSize(i, PANE_GLOW * b.g * (0.02 + 0.98 * (1 - sstep(140, 240, Math.hypot(b.x - camP.x, b.z - camP.z)))) * (1 - sstep(W.x - 40, W.x, b.dm))); }
      const pe = camera.projectionMatrix.elements, tanH = 1 / Math.max(pe[5], 0.05), asp = pe[5] / Math.max(pe[0], 1e-3);
      if (ctx.renderer) { ctx.renderer.getDrawingBufferSize(bufSize); beamPx.value = (2 * tanH) / Math.max(bufSize.y, 64); }      // what one pixel spans a metre from the eye
      // tall, wide-angle frames (a phone held upright, the portal's wide lens) would show a third of a frame of boat: slide the
      // boat back under the eye so the bow tip stays about an eighth of the frame from the bottom (it cannot pitch: the tip would dive)
      const tipA = Math.min(0.62, Math.atan(0.745 * tanH));
      bowG.position.z = Math.min(2.3, Math.max(0, 3.33 - 1.49 / Math.tan(tipA)));
      screenU.uShow.value = 1 - sstep(0.15, 0.7, bowG.position.z);              // the pane would then stand across the eye: let it go
      bowG.rotation.x = 0.013 * Math.sin(time * 0.83) + 0.007 * Math.sin(time * 1.9 + 1); bowG.rotation.z = 0.008 * Math.sin(time * 0.61 + 2); bowG.position.y = 0.03 * Math.sin(time * 0.83 + 0.6);
      pendant.rotation.z = 0.45 * Math.sin(time * 1.7) + 0.2 * Math.sin(time * 2.9 + 1); pendant.rotation.y = 0.5 * Math.sin(time * 1.1 + 0.5);
      const bx = camP.x, bz = camP.z;
      CITY.uBoat.value.set(bx - hx * (bowG.position.z + 0.7), bz - hz * (bowG.position.z + 0.7), hx, hz);          // the wave stays on the bow when the boat is slid back
      // the windscreen takes the colour of any pool of the harp the bow grazes (they lie to the left of the fairway) and the cobalt of the bridge
      const fx_ = bx + hx * 2.5, fz_ = bz + hz * 2.5;
      const cov = shadeAt(fx_, 1.2, fz_, tmpC) * (W.x - 20 > Math.hypot(fx_, fz_ - MOUTH_Z) ? 1 : W.y) * W.w;
      const B4 = CITY.uBridge.value, bax = B4.z - B4.x, baz = B4.w - B4.y, bt = sat(((fx_ - B4.x) * bax + (fz_ - B4.y) * baz) / (bax * bax + baz * baz));
      const bw = 1 - sstep(3, 8.5, Math.hypot(fx_ - B4.x - bax * bt, fz_ - B4.y - baz * bt)), tint = screenU.uTintC.value;
      const hk = cov * 0.3 * (1 - bw);                                           // under the bridge the pane takes the bridge's colour alone: a house's shade mixed into it would only grey it
      tint.setRGB(Math.sqrt(tmpC.r) * hk + accC.r * bw * 0.5, Math.sqrt(tmpC.g) * hk + accC.g * bw * 0.5, Math.sqrt(tmpC.b) * hk + accC.b * bw * 0.5);
      const sm = shaftAt(fx_, 1.4, fz_, tmpC) * (1 - sstep(W.x - 40, W.x, Math.hypot(fx_, fz_ - MOUTH_Z))) * CITY.uShaftN.value.z * (1 - bw) * 0.5;   // and for the moment we are inside a shaft of the harp, that shaft's
      tint.r += Math.pow(tmpC.r, 0.6) * sm; tint.g += Math.pow(tmpC.g, 0.6) * sm; tint.b += Math.pow(tmpC.b, 0.6) * sm;
      starK.value = sstep(0.2, 0.26, u) * (1 - sstep(0.5, 0.62, u)); star.uniforms.uIntensity.value = (night ? 0.7 : 0.55) * starK.value;      // (the glow laid over the gather: no more than leaves it one saturated orange teardrop, the whole way to the bridge)
      starDir.set(TOWER[0] - camP.x, 80 - camP.y, TOWER[1] - camP.z).normalize();
      { const gk = sstep(0.55, 0.72, u); glowDir.set(mix(RING[0], TOWER[0], gk) - camP.x, 42 - camP.y, mix(RING[1], TOWER[1], gk) - camP.z).normalize(); }   // the fog over the basin, lit by the gather: dead ahead down the canal, then round the tower itself
      // the orange of the fog and the road of orange glints: with PEARL_UNTIL_BRIDGE they come up from the great bridge to the basin
      // (the canal before it is pearl, the hot star its one orange); without, from the burst on, as before
      const warmUp = PEARL_UNTIL_BRIDGE ? sstep(uBridge - 0.02, uAt(D_BASIN) + 0.02, u) : sstep(0.17, 0.3, u);
      glowK.value = look.glow * warmUp * (1 - 0.4 * sstep(0.78, 0.88, u));
      pearlNet.value = PEARL_UNTIL_BRIDGE ? sunOut.value * (1 - warmUp) * (night ? 0.3 : 1) : 0;      // (the water's pale net of sunlight, where the orange road is not: see the water)
      glareU.uK.value = night ? 0 : 0.22 * sstep(uOn, uOn + 0.045, u) * (1 - 0.8 * sstep(uOn + 0.07, uOn + 0.2, u)) * (1 - sstep(0.4, 0.5, u) * (look.late ? 0 : 1)) * (look.late ? 1 - sstep(0.6, 0.7, u) : 1) + 0.07 * sstep(0.84, 0.9, u);
      // the sun's glare sits where the sun is on screen, held at the frame edge while the sun is outside it
      const ce = camera.matrixWorld.elements;
      sunV.set(SUN.x * ce[0] + SUN.y * ce[1] + SUN.z * ce[2], SUN.x * ce[4] + SUN.y * ce[5] + SUN.z * ce[6], SUN.x * ce[8] + SUN.y * ce[9] + SUN.z * ce[10]);
      const front = -sunV.z, gz = Math.max(front, 0.05);
      glareU.uC.value.set(Math.max(-1.03, Math.min(1.03, (sunV.x / gz) * pe[0])), Math.max(-0.3, Math.min(0.5, (sunV.y / gz) * pe[5])));
      // the disc and its halo only as the sun itself comes into the frame; for the three seconds of the burst its soft bloom stands on the left edge
      const inK = sstep(-0.4, 0.05, front) * (1 - sstep(1.0, 1.35, Math.abs((sunV.x / gz) * pe[0])));
      const outK = sunV.x < 0 ? 0.9 * sstep(uOn, uOn + 0.03, u) * (1 - sstep(uOn + 0.07, uOn + 0.11, u)) * sstep(-1.2, -0.2, front) : 0;
      glareU.uAsp.value = asp; glareU.uK.value *= Math.max(inK, outK); glareU.uSoft.value = 1 - sat(inK / Math.max(outK, 1e-3));
      if (rare) screenU.uGlit.value.set(sstep(0.868, 0.876, u) * (1 - sstep(0.9, 0.945, u)), 0.2 + 1.7 * sstep(0.868, 0.905, u));
      hero.setProgress(u); hero.update(dt, time, camera);
      if (pview) {                                                               // the engine's own objects, handed over afresh every frame (never kept)
        mirU.tNext.value = pview.texture; mirU.uRect.value = pview.rect; mirU.uNextPV.value = pview.matrix; mirU.uGain.value = pview.gain;
        const to = pview.live ? 1 : 0; mirU.uLive.value = dt > 0 ? mirU.uLive.value + (to - mirU.uLive.value) * (1 - Math.exp(-dt * 4)) : to;
      }
      // gondolas
      for (let i = 0; i < gMoor.length; i++) {
        const g = gMoor[i], dx = g.x - bx, dz = g.z - bz, amp = 0.02 + 0.075 * Math.exp(-(dx * dx + dz * dz) / 600);
        E3.set(amp * 0.45 * Math.sin(time * 1.3 + g.ph), g.yaw + 0.025 * Math.sin(time * 0.4 + g.ph), amp * Math.sin(time * 1.1 + g.ph * 1.7), 'YXZ'); Q4.setFromEuler(E3);
        M4.compose(P3.set(g.x + 0.12 * Math.sin(time * 0.5 + g.ph), 0.04 * Math.sin(time * 0.9 + g.ph), g.z), Q4, S3.set(g.sc, g.sc, g.sc)); moorMesh.setMatrixAt(i, M4);
      }
      for (let i = 0; i < gRun.length; i++) {
        const g = gRun[i]; let x, z, yaw, s = g.sc;
        if (g.moving === 2) { const a = g.ph + g.w * time, sg = g.w > 0 ? 1 : -1; x = g.cx + Math.cos(a) * g.rx; z = g.cz + Math.sin(a) * g.rz; yaw = Math.atan2(-Math.sin(a) * g.rx * sg, Math.cos(a) * g.rz * sg); }
        else if (g.moving === 4) {                                                // a crossing: keyed to where the bow is, in metres (the rule stands with CROSS_EVERY)
          const a = u * LEN + CROSS_LEAD, d = g.berth ? Math.min(g.d1, Math.max(g.d0, a)) : a < g.dx ? Math.max(g.d0, a) : g.dx + CROSS_GLIDE * (1 - Math.exp((g.dx - a) / CROSS_GLIDE));
          const o = crossOff(g, d), lat = d < g.d1 ? crossOff(g, d + 1) - o : 0;
          path.posAtDist(d, fP); path.tangentAtDist(d, fT); const l = Math.hypot(fT.x, fT.z) || 1, tx = fT.x / l, tz = fT.z / l;
          x = fP.x + tz * o; z = fP.z - tx * o; yaw = Math.atan2(tx + tz * lat, tz - tx * lat) + 0.04 * Math.sin(time * 0.5 + g.ph);
        }
        else if (g.moving === 6) {                                                // the one that goes before us down the slot
          const d = Math.min(g.d1, g.a + g.r * u * LEN), o = mix(g.o0, g.o1, sstep(g.da, g.db, d)), lat = mix(g.o0, g.o1, sstep(g.da, g.db, d + 1)) - o;
          path.posAtDist(d, fP); path.tangentAtDist(d, fT); const l = Math.hypot(fT.x, fT.z) || 1, tx = fT.x / l, tz = fT.z / l;
          x = fP.x + tz * o; z = fP.z - tx * o; yaw = Math.atan2(tx + tz * lat, tz - tx * lat) + 0.03 * Math.sin(time * 0.5 + g.ph);
        }
        else if (g.moving === 3) {                                                // keyed to our own progress, never to the clock
          const d = Math.min(g.d1, Math.max(g.d0, g.a + g.r * u * LEN)), o = mix(g.off, g.o1, sstep(g.da, g.db, d)), lat = d < g.d1 ? mix(g.off, g.o1, sstep(g.da, g.db, d + 1)) - o : 0;
          path.posAtDist(d, fP); path.tangentAtDist(d, fT); const l = Math.hypot(fT.x, fT.z) || 1, tx = fT.x / l, tz = fT.z / l;
          x = fP.x + tz * o; z = fP.z - tx * o; yaw = Math.atan2(tx + tz * lat, tz - tx * lat) + 0.05 * Math.sin(time * 0.5 + g.ph);
        }
        else {
          const span = laneB - laneA, r = (g.d0 - laneA + g.v * time) / span, d = laneA + (r - Math.floor(r)) * span, sg = g.v > 0 ? 1 : -1; laneAt(d);
          x = lane_.x - lane_.tz * g.off; z = lane_.z + lane_.tx * g.off; yaw = Math.atan2(lane_.tx * sg, lane_.tz * sg);
          s = g.sc * sstep(laneA, laneA + 14, d) * (1 - sstep(laneB - 14, laneB, d)) + 1e-4;
        }
        const dx = x - bx, dz = z - bz, amp = 0.02 + 0.06 * Math.exp(-(dx * dx + dz * dz) / 900);
        E3.set(amp * 0.4 * Math.sin(time * 1.2 + g.ph), yaw, amp * Math.sin(time * 1.0 + g.ph * 1.7), 'YXZ'); Q4.setFromEuler(E3);
        M4.compose(P3.set(x, 0.04 * Math.sin(time * 0.9 + g.ph), z), Q4, S3.set(s, s, s)); g.mesh.setMatrixAt(g.idx, M4);
      }
      moorMesh.instanceMatrix.needsUpdate = true; moveMesh.instanceMatrix.needsUpdate = true; basinMesh.instanceMatrix.needsUpdate = true;
      for (let i = 0; i < market.length; i++) {
        const m = market[i];
        E3.set(0.01 * Math.sin(time * 0.9 + m.ph), m.yaw + 0.02 * Math.sin(time * 0.33 + m.ph), 0.022 * Math.sin(time * 0.7 + m.ph * 1.7), 'YXZ'); Q4.setFromEuler(E3);
        M4.compose(P3.set(m.x, 0.03 * Math.sin(time * 0.8 + m.ph), m.z), Q4, S3.set(1, 1, 1)); marketMesh.setMatrixAt(i, M4);
      }
      marketMesh.instanceMatrix.needsUpdate = true;
      for (let i = 0; i < floats.length; i++) {
        const f = floats[i];
        M4.makeScale(f.r, f.r, f.r).setPosition(f.x + 0.07 * Math.sin(time * 0.6 + f.ph), 0.05 * Math.sin(time * 1.1 + f.ph), f.z + 0.05 * Math.sin(time * 0.5 + f.ph * 1.3)); floatMesh.setMatrixAt(i, M4);
      }
      floatMesh.instanceMatrix.needsUpdate = true;
      { // the vaporetto, bow toward us
        const d = Math.max(146, Math.min(262, 200 + (0.375 - u) * 0.8 * LEN)); path.posAtDist(d, fP); path.tangentAtDist(d, fT); const l = Math.hypot(fT.x, fT.z) || 1, tx = fT.x / l, tz = fT.z / l;
        vap.position.set(fP.x + tz * 9.8, 0.05 * Math.sin(time * 0.7 + 2), fP.z - tx * 9.8);
        vap.rotation.set(0.01 * Math.sin(time * 0.8), Math.atan2(-tx, -tz), 0.018 * Math.sin(time * 0.6 + 1), 'YXZ');
      }
      for (let i = 0; i < walkers.length; i++) {                                 // the promenaders walk the bridge end to end and back
        const w = walkers[i], s = (w.s + w.v * time) % 2, f = s < 0 ? s + 2 : s, xl = ((f < 1 ? f : 2 - f) * 2 - 1) * 24, yd = 10.1 - 3.2 * Math.pow(Math.abs(xl) / 26, 1.8);
        Q4.setFromAxisAngle(YA, w.ph + 0.3 * Math.sin(time * 0.5 + w.ph));
        M4.compose(P3.set(bridgeC[0] + bux * xl - buz * w.z, yd + 0.03 * Math.abs(Math.sin(time * 5 + w.ph)), bridgeC[1] + buz * xl + bux * w.z), Q4, S3.set(w.sc, w.sc, w.sc)); walkMesh.setMatrixAt(i, M4);
      }
      walkMesh.instanceMatrix.needsUpdate = true;
      barge.rotation.set(0.006 * Math.sin(time * 0.7 + 1.3), barge.userData.yaw + 0.008 * Math.sin(time * 0.31), 0.012 * Math.sin(time * 0.55), 'YXZ'); barge.position.y = 0.03 * Math.sin(time * 0.6 + 0.4);
      // the parasol ferry crosses 40 m ahead of the bow, right to left
      path.posAtDist(D_FERRY, fP); path.tangentAtDist(D_FERRY, fT);
      const fo = mix(-13, 31, sstep(0.31, 0.53, u)) + 0.6 * Math.sin(time * 0.3);
      ferry.position.set(fP.x + fT.z * fo + fT.x * 0.12 * fo, 0.05 * Math.sin(time * 0.8), fP.z - fT.x * fo + fT.z * 0.12 * fo);
      ferry.rotation.set(0.012 * Math.sin(time * 0.9), Math.atan2(fT.z + fT.x * 0.12, -fT.x + fT.z * 0.12), 0.03 * Math.sin(time * 0.7 + 1), 'YXZ');
      if (bubbles) {
        for (let i = 0; i < bub.length; i++) {
          const b = bub[i], e = sstep(0, 1, (u - b.u0) / 0.16), s = b.r * sstep(0, 0.12, e) * (b.hit ? 1 - sstep(0.93, 0.99, e) : 1) + 1e-4;
          M4.makeScale(s, s, s).setPosition(mix(b.sx, b.tx, e) + 1.5 * Math.sin(time * 0.31 + b.ph), mix(66, b.ty, e) + 9 * Math.sin(Math.PI * e) + 0.8 * Math.sin(time * 0.5 + b.ph), mix(b.sz, b.tz, e) + 1.5 * Math.cos(time * 0.27 + b.ph));
          bubbles.setMatrixAt(i, M4);
          const me = M4.elements, by = me[13], rs = Math.max(s, 0.01) * (2.6 + 0.07 * by);
          M4x.makeScale(rs, 1, rs).setPosition(me[12], 0.06, me[14]); bubRings.setMatrixAt(i, M4x);
          bubRings.setColorAt(i, tmpA0.setRGB(sstep(0.3, 1, s / b.r) * (1 - sstep(8, 40, by)) * 0.85, 0, 0));
        }
        bubbles.instanceMatrix.needsUpdate = true; bubRings.instanceMatrix.needsUpdate = true; bubRings.instanceColor.needsUpdate = true;
      }
      air.update(dt, time, camera); fauna.update(dt, time, camera, u);
    }
    { const c0 = new THREE.PerspectiveCamera(62, ctx.aspect || 1.78, 0.3, 2600); path.pointAt(0, c0.position); c0.lookAt(0, EYE, 40); c0.updateMatrixWorld(); update(0, 0, c0, 0); }

    const archLook = offs(D_BRIDGE + 10, 4);
    return {
      scene, path, duration,
      pace: (u) => 0.82 + 0.26 * sstep(0.03, 0.2, u) - 0.13 * sstep(0.6, 0.7, u) * (1 - sstep(0.8, 0.9, u)) - 0.08 * sstep(0.88, 0.94, u),   // slower in the side canal and where the tower stands off the bow
      title: look.title + (rare ? ': the Long Breath' : ''),
      ride: 'none', style: 'none',
      camera: { fov: 62, near: 0.3, far: 2600, lookAhead: 22, sway: 0.35, bank: 0, nearThrough: 0.3 },
      pois: [
        { at: [TOWER[0], 34, TOWER[1]], from: 0.19, to: 0.36, weight: 0.78, fade: 0.3 },          // the burst: the hot star centred, the sun at the left edge
        { at: [archLook[0], 8.5, archLook[1]], from: 0.445, to: 0.508, weight: 0.7, fade: 0.33 },   // the eye lifts to the crown of the cobalt arch as it sweeps over: lanterns, promenaders, the sky through reeded glass
        { at: [TOWER[0], 40, TOWER[1]], from: 0.515, to: 0.705, weight: 0.75, fade: 0.25 },          // out from under the bridge the gaze goes to the tower being blown and holds it while the gather lengthens to the water
        { at: [TOWER[0], 40, TOWER[1]], from: 0.63, to: 0.86, weight: 0.6, fade: 0.3 },            // the tower off the right bow, until the hook swings it behind the ring
        { at: [TOWER[0], 52, TOWER[1]], from: 0.8, to: 0.965, weight: 0.42, fade: 0.3 },           // the gaze climbs to the hot belfry and holds it above the ring until the last metres
      ],
      portal: { shape: 'circle', radius: 7, color: look.portal, glow: 0.7, blendDistance: 25 },
      post: {
        exposure: look.exposure,
        bloom: { strength: look.bloom, radius: 0.42, threshold: night ? 0.93 : 1.0 },
        grade: { saturation: look.grade.saturation, contrast: look.grade.contrast, tint: look.grade.tint, shadowTint: look.grade.shadowTint, vignette: 0.24, grain: 0.02, aberration: 0 },
      },
      update,
      dispose() { houseTex.dispose(); blackTex.dispose(); hero.dispose?.(); },
    };
  },
};
