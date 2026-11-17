// Hero set piece for "Red Sails at Sunrise" (280 million years ago, early Permian, Texas Red Beds).
// THE WATERLINE OF FIRE: sail-backed animals standing side-on to the dawn on a red mudbar. A level plane of
// sunlight (the edge of the far levee's shadow) sinks through every sail at once: above it each web is lit through
// as veined ember, below it the same skin is still blue-violet shade.
//
// WHAT IS BUILT
//   Edaphosaurus (plant-eater: tiny head, barrel body, rounded fan sail, crossbars on the spines) in a hero version
//   (real crossbar boxes, toes) and a far version (crossbars as shader ticks), and Dimetrodon (hunter: deep skull,
//   taller peaked sail, bare pin tips, no crossbars, eye-spots). Bodies, webs, rib shadows, a slab of cracked red
//   mudbar and a sheet of mist. All animals STAND: they breathe, shift weight (3 degree roll about the feet), dip
//   their heads to crop, sway their tails; Dimetrodon pairs lean their sails toward each other.
//
// CONTRACT   export async function buildHero(ctx, opts) -> { object, radius, height, center, anchors, update, dispose,
//            ground, groundY, setProgress, setSunLine, setSun, setMist, sunLineY, uniforms }
//   Origin at the base centre (water level = y 0, bar top = y 0.3), +Y up. Animals stand along X, broadside to Z.
//   FRONT is +Z: the camera passes on the +Z side and the SUN is behind the piece, at -Z, so every sail is backlit.
//
// OPTS
//   palette     array of 7 hex strings (brief order: mid sky, zenith, red mud, rose, ember, peach, conifer green)
//   detail      0.6..1: thins only the mist folds and mud slab resolution, never the animals
//   placements  [{ kind: 'eda'|'edaFar'|'dim', x, z, y, yaw, scale, tilt, lineOffset }] in local metres; replaces the
//               shadowLift (optional) = height of the rib-shadow quad above y (default: on the mist top).
//               shadowLen (optional) = longest the rib shadow may reach, metres (default 15): the world ends it at the water's edge.
//               default tableau (2 Dimetrodon in display, 8 hero Edaphosaurus, 4 far ones). y = ground under the feet.
//               yaw 0 = head toward +X. Use it to lay the whole fleet (34 + 6) down the 180 m bar.
//   ground      true: build the cracked mudbar slab and a still-water disc (false when the world brings its own)
//   mist        true: build the mist sheet (false when the world has its own mist planes)
//   sailStyle   0 plain vermilion with dark veins | 1 row of eye-spots | 2 pale cream margin, banded spines (seeded)
// SHADE (fix round 0): below the sun line nothing is black. The web passes the dawn band behind it (dull ochre-violet,
//   lighter where thin), skin carries a rose rim from that band from the first frame, and lit skin takes a little light
//   back from the mist and water. Crossbar rungs are three-sided prisms.
//
// PROGRESS   hero.setProgress(u): u = world progress 0..1. Drives the ONE event, sunLineY(u) (3.0 m at u 0, 2.0 at
//   0.15, 1.5 at 0.40, 1.0 at 0.52, 0.6 at 0.56, then down to the ground), the sun colour and strength, the peach
//   turn of the mist and the opacity of the rib shadows (0 until u 0.44, full by 0.51). hero.setSunLine(y) overrides the height.
//   Until setProgress is first called the piece shows a slow demo of the line so the viewer is not frozen.
//   hero.setSun(dirToSun, color, strength), hero.setMist(color, topY) for matching the world's light and mist.
//   hero.uniforms.uSunLineY etc. are shared objects: put the same objects in the world's own materials.
//
// ANCHORS (local space)
//   portalSeat   { position, facing }: where a 14 m ring would stand if the hero were the end of the path
//   flyThrough   ordered points of a safe camera line along the +Z side at y 1.5, 5 m off the nearest group, 6 m clear
//   viewpoints   { entry, closest, display }: camera positions for the three frames that must work
//   lookAt       centre of the nearest group; sunDir: unit vector toward the sun; displayPair, nearestGroup: positions
//   extent       { halfX, halfZ, top }: true half-size of the group and its tallest sail tip
//   animals      [{ kind, position, yaw, sailTop }] for every instance (seat shadows, reflections, gnats)
//
// SIZE   default tableau: 14-16 animals on a bar about 28 x 18 m, tallest sail 2.3 m above the water (true size in
//   anchors.extent { halfX, halfZ, top }). The returned radius (1.5) and height (1.4) are deliberately the FRAMING
//   size of the nearest group, so the set-piece viewer orbits at the 10-15 m the brief flies at, not the bar's bounds.
// COST   default about 70k triangles, 7 draw calls (3 animal meshes, shadows, bar, water, mist), no lights, no
//   textures, 75 ms build. Hero plant-eater 4.7k triangles, far one 1.3k, hunter 4.4k: the full fleet through
//   opts.placements (8 eda, 26 edaFar, 6 dim) is about 100k triangles with the bar.
// HEIGHTS  y 0 is the water; the bar top is y 0.3; sunLineY(u) is measured from the water as in the brief.
// LIGHT  Self-lit custom shaders: a hemisphere fill (cool sky / warm ground) plus one sun tested against the sun
//   line. Scene lights do not touch it; scene fog does (fog: true). Webs write ember at HDR up to ~2.4 (bloom).
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';

export const PALETTE = ['#7F93A8', '#2F3A52', '#9C4A32', '#C9714A', '#F2552C', '#F4C9A0', '#2F4A3A'];

// The event: height of the levee shadow's edge above the water, as the brief's table. Only ever sinks.
export function sunLineY(u) {
  const K = [[0, 3.0], [0.15, 2.0], [0.40, 1.5], [0.52, 1.0], [0.56, 0.6], [0.62, 0.15], [0.70, -0.5], [1, -0.5]];
  u = clamp(u, 0, 1);
  for (let i = 0; i < K.length - 1; i++) {
    if (u <= K[i + 1][0]) { const t = (u - K[i][0]) / (K[i + 1][0] - K[i][0]); return lerp(K[i][1], K[i + 1][1], t); }
  }
  return -0.5;
}

// ---------------------------------------------------------------------------------------------------------------
// Vertex builder. Per vertex: position, colour (linear), aAnim (head weight, tail weight, breath, plant 0 foot..1 body),
// aSail (u spine coordinate, v 0 base..1 tip, h metres above the back, kind: 0 skin, 1 web, 2 spine/bar, 3 eye),
// aOff (offset from a thin part's centreline, widened with distance in the vertex shader).
class G {
  constructor() { this.p = []; this.c = []; this.a = []; this.s = []; this.o = []; this.idx = []; this.cur = [0, 0, 0, 1]; this.sail = [0, 0, 0, 0]; }
  get n() { return this.p.length / 3; }
  v(x, y, z, col, off) {
    this.p.push(x, y, z); this.c.push(col[0], col[1], col[2]);
    this.a.push(this.cur[0], this.cur[1], this.cur[2], this.cur[3]);
    this.s.push(this.sail[0], this.sail[1], this.sail[2], this.sail[3]);
    if (off) this.o.push(off[0], off[1], off[2]); else this.o.push(0, 0, 0);
    return this.p.length / 3 - 1;
  }
  tri(a, b, c) { this.idx.push(a, b, c); }
  quad(a, b, c, d) { this.idx.push(a, b, c, a, c, d); }
  setAnim(i, head, tail, breath, plant) { const k = i * 4; this.a[k] = head; this.a[k + 1] = tail; this.a[k + 2] = breath; this.a[k + 3] = plant; }
  // join two rings of equal length (closed)
  band(A, B) { const n = A.length; for (let j = 0; j < n; j++) { const j1 = (j + 1) % n; this.quad(A[j], B[j], B[j1], A[j1]); } }
  cap(A, c, flip) { const n = A.length; for (let j = 0; j < n; j++) { const j1 = (j + 1) % n; if (flip) this.tri(c, A[j1], A[j]); else this.tri(c, A[j], A[j1]); } }
  // tube along a polyline with a radius per point; flat = squash of the second axis; returns rings
  tube(pts, radii, sides, colFn, o = {}) {
    const rows = [], N = pts.length, up = new THREE.Vector3(), t = new THREE.Vector3(), a = new THREE.Vector3(), b = new THREE.Vector3();
    let prev = null;
    for (let i = 0; i < N; i++) {
      const p = pts[i], q0 = pts[Math.max(0, i - 1)], q1 = pts[Math.min(N - 1, i + 1)];
      t.set(q1[0] - q0[0], q1[1] - q0[1], q1[2] - q0[2]).normalize();
      if (!prev) { up.set(0, 1, 0); if (Math.abs(t.y) > 0.9) up.set(1, 0, 0); } else up.copy(prev);
      a.copy(up).addScaledVector(t, -up.dot(t)).normalize(); prev = a.clone(); b.crossVectors(t, a);
      const r = radii[i], row = [], fl = o.flat || 1;
      for (let j = 0; j < sides; j++) {
        const th = (j / sides) * Math.PI * 2, cs = Math.cos(th) * r, sn = Math.sin(th) * r * fl;
        const ox = a.x * cs + b.x * sn, oy = a.y * cs + b.y * sn, oz = a.z * cs + b.z * sn;
        row.push(this.v(p[0] + ox, p[1] + oy, p[2] + oz, colFn(i / (N - 1), Math.cos(th), p), o.widen ? [ox, oy, oz] : null));
      }
      rows.push(row);
    }
    for (let i = 0; i < N - 1; i++) this.band(rows[i + 1], rows[i]);
    return rows;
  }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    g.setAttribute('aAnim', new THREE.Float32BufferAttribute(this.a, 4));
    g.setAttribute('aSail', new THREE.Float32BufferAttribute(this.s, 4));
    g.setAttribute('aOff', new THREE.Float32BufferAttribute(this.o, 3));
    g.setIndex(this.idx); g.computeVertexNormals();
    return g;
  }
}
const hex = (h) => { const c = new THREE.Color(h); return [c.r, c.g, c.b]; };
const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const sst = smoothstep;

// ---------------------------------------------------------------------------------------------------------------
// Species. All lengths in metres for a 3.2 m animal; the head points to +X, the feet stand on y 0.
// body rows: [x, top, bottom, halfWidth, topExponent (>1 keeled, <1 boxy), bellyExponent]
const SPEC = {
  eda: {
    body: [
      [-1.75, 0.375, 0.345, 0.014, 1, 1], [-1.45, 0.45, 0.335, 0.06, 1.1, 0.9], [-1.05, 0.58, 0.335, 0.125, 1.15, 0.85],
      [-0.65, 0.695, 0.335, 0.205, 1.2, 0.8], [-0.34, 0.765, 0.32, 0.275, 1.25, 0.72], [-0.02, 0.805, 0.29, 0.355, 1.25, 0.66],
      [0.34, 0.805, 0.285, 0.372, 1.25, 0.66], [0.68, 0.775, 0.305, 0.315, 1.25, 0.7], [0.92, 0.72, 0.36, 0.225, 1.15, 0.8],
      [1.08, 0.635, 0.425, 0.108, 1.0, 0.9], [1.20, 0.605, 0.445, 0.088, 0.85, 0.9], [1.31, 0.59, 0.455, 0.078, 0.8, 0.85],
      [1.40, 0.568, 0.468, 0.058, 0.8, 0.85], [1.45, 0.545, 0.485, 0.03, 0.9, 0.9]],
    neck: [0.86, 1.16], neckPivot: [0.9, 0.56], tail: [-0.3, -1.75], breath: [0.25, 0.75],
    headLen: 0.24, eye: [1.285, 0.565, 0.074, 0.016], mouth: [1.22, 1.45, 0.498], nostril: [1.415, 0.545, 0.04],
    sail: { x0: -0.40, x1: 1.02, n: 22, h: 1.0, peak: 0.5, shape: 0.5, fan: 0.34, bare: 0.0, bars: 6, scallop: 0.03 },
    // limbs: shoulder/hip on the body, elbow/knee out to the side, wrist/ankle, foot centre; radii along
    fore: { at: [0.84, 0.50, 0.26], elbow: [0.60, 0.33, 0.58], wrist: [0.86, 0.10, 0.63], foot: [0.95, 0.0, 0.65], r: [0.125, 0.105, 0.078, 0.062], yaw: 0.35 },
    hind: { at: [-0.34, 0.52, 0.24], elbow: [0.00, 0.35, 0.57], wrist: [-0.32, 0.10, 0.63], foot: [-0.22, 0.0, 0.66], r: [0.15, 0.125, 0.088, 0.068], yaw: 0.55 },
    foot: 0.12, skin: '#5A4A4A', dark: '#33282A', belly: '#B89A84', saddles: 6, dipMax: 0.72,
  },
  dim: {
    body: [
      [-1.62, 0.33, 0.31, 0.01, 1, 1], [-1.3, 0.39, 0.31, 0.035, 1.1, 0.9], [-0.9, 0.50, 0.33, 0.075, 1.15, 0.9],
      [-0.5, 0.63, 0.36, 0.13, 1.2, 0.85], [-0.12, 0.74, 0.36, 0.205, 1.3, 0.8], [0.22, 0.775, 0.35, 0.235, 1.3, 0.78],
      [0.56, 0.775, 0.36, 0.23, 1.3, 0.78], [0.82, 0.755, 0.39, 0.195, 1.2, 0.8], [0.98, 0.735, 0.45, 0.135, 1.05, 0.85],
      [1.08, 0.75, 0.47, 0.118, 0.8, 0.8], [1.20, 0.775, 0.475, 0.112, 0.7, 0.75], [1.33, 0.765, 0.49, 0.092, 0.7, 0.75],
      [1.44, 0.725, 0.505, 0.07, 0.7, 0.75], [1.53, 0.69, 0.52, 0.056, 0.7, 0.8], [1.585, 0.65, 0.535, 0.036, 0.8, 0.9]],
    neck: [0.84, 1.08], neckPivot: [0.88, 0.62], tail: [-0.12, -1.62], breath: [0.2, 0.7],
    headLen: 0.53, eye: [1.215, 0.705, 0.104, 0.021], mouth: [1.10, 1.585, 0.555], nostril: [1.55, 0.635, 0.035],
    sail: { x0: -0.30, x1: 0.94, n: 26, h: 1.26, peak: 0.6, shape: 0.62, fan: 0.22, bare: 0.08, bars: 0, scallop: 0.016 },
    fore: { at: [0.80, 0.56, 0.2], elbow: [0.60, 0.42, 0.46], wrist: [0.84, 0.13, 0.47], foot: [0.93, 0.0, 0.49], r: [0.105, 0.09, 0.066, 0.054], yaw: 0.3 },
    hind: { at: [-0.16, 0.57, 0.19], elbow: [0.14, 0.43, 0.45], wrist: [-0.16, 0.13, 0.48], foot: [-0.07, 0.0, 0.5], r: [0.125, 0.105, 0.074, 0.06], yaw: 0.5 },
    foot: 0.11, skin: '#3A4034', dark: '#1E2420', belly: '#8A7A5E', saddles: 9, dipMax: 0.12,
  },
};

// smooth interpolation of the body rows at x
function bodyAt(rows, x) {
  let i = 0; while (i < rows.length - 2 && rows[i + 1][0] < x) i++;
  const A = rows[i], B = rows[i + 1], t = sst(0, 1, clamp((x - A[0]) / (B[0] - A[0]), 0, 1)), tl = clamp((x - A[0]) / (B[0] - A[0]), 0, 1), k = 0.5 * (t + tl);
  return [x, lerp(A[1], B[1], k), lerp(A[2], B[2], k), lerp(A[3], B[3], k), lerp(A[4], B[4], k), lerp(A[5], B[5], k)];
}

// lofted torso + neck + head + tail in one skin
function loftBody(g, S, rnd, hero) {
  const rows = S.body, sides = hero ? 16 : 10, xs = [], x0 = rows[0][0], x1 = rows[rows.length - 1][0];
  const nSec = hero ? 34 : 20;
  for (let i = 0; i <= nSec; i++) {
    // more sections in the head and neck, fewer down the tail
    const t = i / nSec, w = t * t * (3 - 2 * t) * 0.35 + t * 0.65; xs.push(lerp(x0, x1, w));
  }
  const skin = hex(S.skin), dark = hex(S.dark), belly = hex(S.belly), rings = [];
  const sadPh = rnd() * 6.28, sadN = S.saddles;
  g.sail = [0, 0, 0, 0];
  for (const x of xs) {
    const [, top, bot, hw, eT, eB] = bodyAt(rows, x), yc = bot + (top - bot) * 0.46, ring = [];
    const head = sst(S.neck[0], S.neck[1], x), tail = clamp((S.tail[0] - x) / (S.tail[0] - S.tail[1]), 0, 1);
    const xn = (x - x0) / (x1 - x0), br = sst(S.breath[0] - 0.2, S.breath[0] + 0.1, xn) * (1 - sst(S.breath[1] - 0.1, S.breath[1] + 0.12, xn));
    // saddles: dark bands over the back, strongest on the tail (banded tail), broken by a second frequency
    const sad = 0.5 + 0.5 * Math.sin(xn * sadN * 6.283 + sadPh + 1.3 * Math.sin(xn * 17.0 + sadPh));
    for (let j = 0; j < sides; j++) {
      const th = ((j + 0.5) / sides) * Math.PI * 2, cs = Math.cos(th), sn = Math.sin(th);
      const y = cs > 0 ? yc + (top - yc) * Math.pow(cs, eT) : yc - (yc - bot) * Math.pow(-cs, eB);
      const z = hw * Math.sign(sn) * Math.pow(Math.abs(sn), 0.8);
      // counter-shading: pale belly, skin flank, darker dorsal stripe; saddles fade down the flank
      const up = sst(-0.75, -0.05, cs), dors = sst(0.45, 0.95, cs);
      let col = mix3(belly, skin, up);
      col = mix3(col, dark, sst(0.35, 0.8, sad) * sst(-0.2, 0.5, cs) * (0.55 + 0.35 * tail));
      col = mix3(col, dark, dors * 0.45);
      // pale throat and lips on the head
      col = mix3(col, belly, head * sst(0.1, -0.5, cs) * 0.5);
      g.cur = [head, tail, br * (0.35 + 0.65 * Math.abs(sn)) * (cs > 0.8 ? 0.3 : 1), 1];
      ring.push(g.v(x, y, z, col));
    }
    rings.push(ring);
  }
  for (let i = 0; i < rings.length - 1; i++) g.band(rings[i], rings[i + 1]);
  // caps: tail tip and snout
  const a = bodyAt(rows, x0), b = bodyAt(rows, x1);
  g.cur = [0, 1, 0, 1]; g.cap(rings[0], g.v(x0 - 0.03, (a[1] + a[2]) / 2, 0, dark), false);
  g.cur = [1, 0, 0, 1]; g.cap(rings[rings.length - 1], g.v(x1 + 0.012, (b[1] + b[2]) / 2 - 0.004, 0, mix3(skin, belly, 0.4)), true);
}

// eye (dark dome, pale lid, one highlight), mouth line, nostril, and for the hunter a stepped row of teeth
function headDetail(g, S, hero, isDim) {
  const skin = hex(S.skin), belly = hex(S.belly), lid = mix3(skin, belly, 0.55), black = [0.012, 0.01, 0.01];
  const [ex, ey, ez, er] = S.eye;
  for (const sg of [1, -1]) {
    g.cur = [1, 0, 0, 1]; g.sail = [0, 0, 0, 0];
    const n = hero ? 8 : 6, lidR = [], eyeR = [];
    for (let j = 0; j < n; j++) {
      const a = (j / n) * 6.283, c = Math.cos(a), s = Math.sin(a);
      lidR.push(g.v(ex + c * er * 1.75, ey + s * er * 1.5, sg * (ez - 0.004), lid));
    }
    g.sail = [0, 0, 0, 3];
    for (let j = 0; j < n; j++) {
      const a = (j / n) * 6.283, c = Math.cos(a), s = Math.sin(a);
      eyeR.push(g.v(ex + c * er, ey + s * er, sg * (ez + 0.006), [0.05, 0.035, 0.025]));
    }
    for (let j = 0; j < n; j++) { const j1 = (j + 1) % n; g.quad(lidR[j], lidR[j1], eyeR[j1], eyeR[j]); }
    g.cap(eyeR, g.v(ex, ey, sg * (ez + 0.006 + er * 0.55), black), false);
    // the highlight: a small bright facet high on the front of the eye
    const hx = ex + er * 0.3, hy = ey + er * 0.38, hz = sg * (ez + 0.008 + er * 0.5), hs = er * 0.5, hi = [2.2, 2.3, 2.6];
    g.tri(g.v(hx - hs, hy - hs * 0.5, hz, hi), g.v(hx + hs, hy - hs * 0.3, hz, hi), g.v(hx, hy + hs, hz, hi));
    g.sail = [0, 0, 0, 0];
    // brow ridge over the eye: a short dark tube
    g.tube([[ex - er * 2.2, ey + er * 1.2, sg * (ez - 0.006)], [ex, ey + er * 1.9, sg * (ez + 0.004)], [ex + er * 2.4, ey + er * 1.3, sg * (ez - 0.008)]], [er * 0.5, er * 0.75, er * 0.45], 5, () => mix3(skin, black, 0.35));
    // mouth line: a dark strip hugging the side of the head (the head rings are sampled for its z)
    const [mx0, mx1, my] = S.mouth, nm = hero ? 9 : 5, la = [], lb = [];
    for (let i = 0; i <= nm; i++) {
      const x = lerp(mx0, mx1, i / nm), b = bodyAt(S.body, x), yc = b[2] + (b[1] - b[2]) * 0.46;
      // the hunter's upper jaw steps down toward the front
      const y = my + (isDim ? 0.022 * sst(1.40, 1.47, x) - 0.012 * sst(1.2, 1.1, x) : 0.006 * Math.sin(i * 0.9));
      const k = clamp(Math.abs(y - yc) / Math.max(yc - b[2], 1e-3), 0, 0.98), z = b[3] * Math.pow(1 - Math.pow(k, 2 / b[5]), 0.4) + 0.0035;
      const hgt = (isDim ? 0.009 : 0.006) * (1 - 0.6 * i / nm);
      la.push(g.v(x, y + hgt, sg * z, black)); lb.push(g.v(x, y - hgt, sg * (z + 0.001), black));
      if (isDim && i > 0 && i < nm) {
        // teeth: pale flat fangs hanging over the closed lower jaw, two long ones at the step
        const t = i / nm, long = Math.exp(-Math.pow((x - 1.455) / 0.03, 2)), len = 0.014 + 0.034 * long + 0.008 * Math.sin(i * 2.1), tw = 0.007 + 0.004 * long, ivory = [0.62, 0.56, 0.44];
        g.tri(g.v(x - tw, y - hgt, sg * (z + 0.003), ivory), g.v(x + tw, y - hgt, sg * (z + 0.003), ivory), g.v(x - 0.004 * t, y - hgt - len, sg * (z + 0.002), mix3(ivory, [1, 1, 1], 0.2)));
      }
    }
    for (let i = 0; i < nm; i++) g.quad(la[i], lb[i], lb[i + 1], la[i + 1]);
    const [nx, ny, nz] = S.nostril;
    g.tri(g.v(nx - 0.012, ny - 0.004, sg * (nz + 0.004), black), g.v(nx + 0.008, ny, sg * (nz - 0.004), black), g.v(nx - 0.004, ny + 0.009, sg * (nz + 0.001), black));
  }
}

// a sprawled limb: muscular upper segment out to the side, a real elbow/knee, thinner lower segment, splayed foot
function limb(g, S, L, sg, hero, isHind) {
  const skin = hex(S.skin), dark = hex(S.dark), belly = hex(S.belly), sides = hero ? 9 : 6;
  const P = (p) => [p[0], p[1], p[2] * sg], A = P(L.at), E = P(L.elbow), W = P(L.wrist), F = P(L.foot);
  const mid = (a, b, t, lift = 0) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t) + lift, lerp(a[2], b[2], t)];
  const inner = [A[0], A[1] + 0.02, A[2] * 0.55];
  const pts = [inner, A, mid(A, E, 0.5, 0.015), E, mid(E, W, 0.3), mid(E, W, 0.7), W, [F[0] - (F[0] - W[0]) * 0.35, 0.05, lerp(W[2], F[2], 0.6)]];
  const r = L.r, rad = [r[0] * 1.25, r[0] * 1.2, r[0] * 1.05, r[1] * 1.08, (r[1] + r[2]) * 0.56, r[2] * 1.02, r[2] * 0.92, r[3]];
  const plant = [1, 1, 0.85, 0.6, 0.42, 0.25, 0.12, 0.02];
  const start = g.n;
  g.sail = [0, 0, 0, 0]; g.cur = [0, 0, 0, 1];
  g.tube(pts, rad, sides, (t, c) => mix3(mix3(skin, belly, sst(0.2, -0.7, c) * 0.6), dark, t * 0.45 + 0.1), {});
  for (let i = start; i < g.n; i++) { const ring = Math.floor((i - start) / sides); g.setAnim(i, 0, 0, 0, plant[ring]); }
  // foot: a low pad and five splayed toes, or a single splayed polygon far away
  const yaw = L.yaw * sg + (isHind ? 0.0 : 0.0), fx = Math.cos(yaw), fz = Math.sin(yaw), fl = S.foot;
  g.cur = [0, 0, 0, 0];
  const padC = g.v(F[0], 0.06, F[2], mix3(skin, dark, 0.5)), pad = [], nP = hero ? 10 : 7;
  for (let j = 0; j < nP; j++) {
    const a = (j / nP) * 6.283, c = Math.cos(a), s = Math.sin(a), rr = fl * (0.62 + 0.38 * Math.max(0, c));
    pad.push(g.v(F[0] + (fx * c - fz * s) * rr, 0.012, F[2] + (fz * c + fx * s) * rr, mix3(dark, skin, 0.25)));
  }
  g.cap(pad, padC, false);
  if (hero) {
    for (let k = 0; k < 5; k++) {
      const a = (k - 2) * 0.42 + 0.06 * sg, c = Math.cos(a), s = Math.sin(a), dx = fx * c - fz * s, dz = fz * c + fx * s, ln = fl * (1.05 - 0.14 * Math.abs(k - 2) + (k === 3 ? 0.08 : 0));
      const b0 = [F[0] + dx * fl * 0.55, 0.035, F[2] + dz * fl * 0.55], b1 = [F[0] + dx * (fl * 0.55 + ln * 0.6), 0.03, F[2] + dz * (fl * 0.55 + ln * 0.6)], b2 = [F[0] + dx * (fl * 0.55 + ln), 0.008, F[2] + dz * (fl * 0.55 + ln)];
      g.tube([b0, b1, b2], [0.024, 0.019, 0.004], 4, (t) => mix3(mix3(skin, dark, 0.45), [0.05, 0.04, 0.035], t * t), {});
    }
  }
}

// The sail: neural spines as tapered diamond prisms (widened with distance in the shader so they never drop below
// ~1.5 px), a web between them reaching the tips (Edaphosaurus) or stopping short of bare pins (Dimetrodon), and
// on hero Edaphosaurus real crossbars: short lateral rungs, densest low down.
const BAR_B = 6.3, BAR_E = 0.6;          // shader ticks sit where BAR_B * pow(v, BAR_E) is a whole number
function sailFrame(S, rnd) {
  const s = S.sail, n = s.n, sp = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1), x = lerp(s.x0, s.x1, t), top = bodyAt(S.body, x)[1] - 0.025;
    const w = t < s.peak ? 0.5 * t / s.peak : 0.5 + 0.5 * (t - s.peak) / (1 - s.peak);
    const f = Math.pow(Math.max(Math.sin(Math.PI * w), 0), s.shape);
    const h = s.h * (0.13 + 0.87 * f) * (1 + 0.035 * (rnd() - 0.5)), lean = s.fan * (t - 0.5) * 2 + 0.03 * (rnd() - 0.5);
    sp.push({ x, y: top, h, lean, top: 1 - s.bare / h });
  }
  // point on spine i (may be fractional) at fraction t of its length: a slight outward curve like a fan's ribs
  const at = (fi, t) => {
    const i0 = Math.min(n - 2, Math.floor(fi)), k = fi - i0, A = sp[i0], B = sp[i0 + 1];
    const x = lerp(A.x, B.x, k), y = lerp(A.y, B.y, k), h = lerp(A.h, B.h, k), lean = lerp(A.lean, B.lean, k);
    return [x + h * Math.sin(lean) * Math.pow(t, 1.35), y + h * Math.cos(lean * 0.8) * t, 0, h];
  };
  return { sp, at, n };
}
function buildSail(g, S, rnd, hero) {
  const { sp, at, n } = sailFrame(S, rnd), bone = [0.03, 0.017, 0.013], s = S.sail;
  const head = (x) => sst(S.neck[0], S.neck[1], x) * 0.35;
  // spines
  const rows = hero ? [0, 0.22, 0.48, 0.74, 1] : [0, 0.5, 1];
  for (let i = 0; i < n; i++) {
    const rings = [];
    for (const t of rows) {
      const p = at(i, t), rx = lerp(0.017, 0.0065, t), rz = lerp(0.021, 0.0065, t), ring = [];
      g.cur = [head(sp[i].x) * (1 - t), 0, 0, 1]; g.sail = [i, t, t * p[3], 2];
      const col = mix3(bone, [0.09, 0.06, 0.05], t * 0.6);
      ring.push(g.v(p[0] + rx, p[1], 0, col, [rx, 0, 0]), g.v(p[0], p[1], rz, col, [0, 0, rz]), g.v(p[0] - rx, p[1], 0, col, [-rx, 0, 0]), g.v(p[0], p[1], -rz, col, [0, 0, -rz]));
      rings.push(ring);
    }
    for (let k = 0; k < rings.length - 1; k++) g.band(rings[k], rings[k + 1]);
    const tp = at(i, 1); g.sail = [i, 1, tp[3], 2]; g.cap(rings[rings.length - 1], g.v(tp[0], tp[1] + 0.012, 0, bone), false);
    // crossbars (hero plant-eater only)
    if (hero && s.bars) {
      for (let k = 1; k <= s.bars; k++) {
        const v = Math.pow(k / BAR_B, 1 / BAR_E); if (v > 0.95 || v * sp[i].h < 0.035) continue;
        const p = at(i, v), len = 0.05 * (1 - 0.45 * v) * (0.85 + 0.3 * rnd()), th = 0.0105, A = [], B = [], C = [];
        g.sail = [i, v, v * p[3], 2]; g.cur = [0, 0, 0, 1];
        for (let j = 0; j < 3; j++) {
          const a = j * 2.0944 + 0.5236, ox = Math.cos(a) * th, oy = Math.sin(a) * th * 0.8;
          A.push(g.v(p[0] + ox * 0.6, p[1] + oy * 0.6, -len, bone, [ox, oy, 0]));
          C.push(g.v(p[0] + ox * 1.3, p[1] + oy * 1.3, 0, bone, [ox, oy, 0]));
          B.push(g.v(p[0] + ox * 0.6, p[1] + oy * 0.6, len, bone, [ox, oy, 0]));
        }
        g.band(A, C); g.band(C, B);
      }
    }
  }
  // web: a grid following the spines, scalloped between the tips
  const cols = hero ? 2 : 1, rws = hero ? [0, 0.08, 0.2, 0.38, 0.58, 0.78, 0.92, 1] : [0, 0.3, 0.7, 1], grid = [];
  for (let c = 0; c <= (n - 1) * cols; c++) {
    const fi = c / cols, i0 = Math.min(n - 2, Math.floor(fi)), k = fi - i0;
    const topF = lerp(sp[i0].top, sp[i0 + 1].top, k) - s.scallop * Math.sin(Math.PI * k) * (hero ? 1 : 0), col = [];
    for (const r of rws) {
      const t = r * topF, p = at(fi, t);
      g.cur = [head(p[0]) * (1 - t), 0, 0, 1]; g.sail = [fi, t, t * p[3], 1];
      // vertex colour of the web: r = rim (1 at the free edge), g = spine height in metres / 1.5, b = unused
      col.push(g.v(p[0], p[1], 0, [r, p[3] / 1.5, topF]));
    }
    grid.push(col);
  }
  for (let c = 0; c < grid.length - 1; c++) for (let r = 0; r < rws.length - 1; r++) g.quad(grid[c][r], grid[c + 1][r], grid[c + 1][r + 1], grid[c][r + 1]);
  return { sp, at };
}

// One whole animal as a single geometry. kind: 'eda' | 'dim'; hero adds toes, crossbars, more sections.
// Exported so the world coder can build more (young ones are the same mesh at scale 0.5).
export function sailbackGeometry(kind, rnd, hero = true) {
  const S = SPEC[kind], g = new G(), isDim = kind === 'dim';
  loftBody(g, S, rnd, hero);
  headDetail(g, S, hero, isDim);
  for (const sg of [1, -1]) { limb(g, S, S.fore, sg, hero || isDim, false); limb(g, S, S.hind, sg, hero || isDim, true); }
  const sail = buildSail(g, S, rnd, hero);
  const geo = g.build();
  // sail normals: the web is a flat sheet in the XY plane
  const N = geo.attributes.normal, K = geo.attributes.aSail;
  for (let i = 0; i < N.count; i++) if (K.getW(i) === 1) N.setXYZ(i, 0, 0, 1);
  geo.userData = { kind, sailTop: Math.max(...sail.sp.map((q) => q.y + q.h)), spec: S, sail };
  return geo;
}

// ---------------------------------------------------------------------------------------------------------------
// One material for skin, bone, eye and web (aSail.w picks the path), instanced. Self-lit: hemisphere + sun line.
const VERT = /* glsl */`
attribute vec4 aAnim; attribute vec4 aSail; attribute vec3 aOff;
attribute vec4 aInst;   // phase, sun-line offset (m), ground height under the feet (world), sail tilt (rad)
attribute vec4 aInst2;  // head-dip period (s), tint, pattern seed, species (0 plant-eater, 1 hunter)
uniform float uTime, uPix;
varying vec3 vWorld, vN, vCol, vObj; varying vec4 vSail, vInst; varying float vSp;
#include <fog_pars_vertex>
void main() {
  vec3 p = position; vec3 n = normal;
  float ph = aInst.x, sp = aInst2.w, skin = step(aSail.w, 0.5);
  // breathing: the flanks swell and sink
  p += n * aAnim.z * skin * 0.024 * sin(uTime * 1.5 + ph * 31.0);
  // head and neck: the plant-eater dips to crop and chews; the hunter makes one slow turn
  float c = fract(uTime / aInst2.x + ph * 3.7);
  float dip = smoothstep(0.0, 0.2, c) * (1.0 - smoothstep(0.66, 0.9, c));
  float ang = mix(0.74 * (0.22 + 0.78 * dip) + 0.03 * dip * sin(uTime * 6.5 + ph * 9.0), 0.1 + 0.05 * sin(uTime * 0.31 + ph * 5.0), sp) * aAnim.x;
  vec2 pv = mix(vec2(0.9, 0.56), vec2(0.88, 0.62), sp);
  vec2 d = p.xy - pv; float ca = cos(ang), sa = sin(ang);
  p.xy = pv + vec2(ca * d.x + sa * d.y, -sa * d.x + ca * d.y);
  float yawH = sp * aAnim.x * 0.22 * sin(uTime * 0.23 + ph * 17.0);
  p.z += (p.x - pv.x) * yawH;
  // tail: a slow travelling sway, growing toward the tip
  float tw = aAnim.y * aAnim.y;
  p.z += tw * (0.24 * sin(uTime * 1.05 + ph * 23.0 - aAnim.y * 1.9) + 0.42 * sin(ph * 57.0) * aAnim.y);
  p.y += aAnim.y * (1.0 - aAnim.y) * 0.1 * sin(ph * 77.0) - tw * 0.05;
  p.y += tw * 0.03 * sin(uTime * 0.37 + ph * 13.0);
  // weight shifting: sail and body roll about the planted feet (3 degrees), plus the display tilt
  float roll = (0.052 * sin(uTime * 0.8 + ph * 41.0) + 0.02 * sin(uTime * 0.33 + ph * 7.0) + aInst.w) * aAnim.w;
  float cr = cos(roll), sr = sin(roll);
  p.yz = vec2(cr * p.y - sr * p.z, sr * p.y + cr * p.z);
  n.yz = vec2(cr * n.y - sr * n.z, sr * n.y + cr * n.z);
  p.x += aAnim.w * 0.012 * sin(uTime * 0.29 + ph * 19.0);
  mat4 M = modelMatrix * instanceMatrix;
  vec4 w = M * vec4(p, 1.0);
  // thin parts (spines, pins, crossbars) keep about 1.5 px of width at any distance
  float ol = length(aOff);
  if (ol > 1e-5) {
    float dist = distance(w.xyz, cameraPosition);
    // ... but never wider than a third of the gap between two spines, or a far sail goes black
    float k = clamp(dist * uPix * 0.8 / ol, 1.0, clamp(0.008 / ol, 1.0, 9.0));
    w = M * vec4(p + aOff * (k - 1.0), 1.0);
  }
  vWorld = w.xyz; vN = mat3(M) * n; vCol = color; vObj = position; vSail = aSail;
  vInst = vec4(aInst.y, aInst.z, aInst2.y, aInst2.z); vSp = sp;
  vec4 mvPosition = viewMatrix * w;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const FRAG = /* glsl */`
uniform float uTime, uSunLineY, uSunI, uHemiI, uMistTop, uMistAmt, uEmberGain, uStyle, uShadeLift;
uniform vec3 uSunDir, uSunColor, uSky, uGround, uMistColor, uEmber, uWebShade, uCream, uRose;
varying vec3 vWorld, vN, vCol, vObj; varying vec4 vSail, vInst; varying float vSp;
#include <fog_pars_fragment>
float h21(vec2 p) { p = fract(p * vec2(123.34, 345.45)); p += dot(p, p + 34.345); return fract(p.x * p.y); }
float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }
void main() {
  vec3 N = normalize(vN + vec3(0.0, 1e-5, 0.0)); if (!gl_FrontFacing) N = -N;
  vec3 Vv = cameraPosition - vWorld; float dist = length(Vv); vec3 V = Vv / max(dist, 1e-4);
  vec3 L = uSunDir;
  float kind = vSail.w, seed = vInst.w;
  // the event: one level plane; above it sun, below it shade (6 cm soft, per-animal offset up to 0.12 m)
  float lit = smoothstep(-0.03, 0.03, vWorld.y - (uSunLineY + vInst.x));
  vec3 hemi = mix(uGround, uSky, N.y * 0.5 + 0.5) * uHemiI;
  float back = max(dot(-V, L), 0.0);
  // derivatives are taken here, outside every branch
  float fwu = fwidth(vSail.x), fwv = fwidth(vSail.y);
  float g = ${BAR_B.toFixed(1)} * pow(max(vSail.y, 1e-4), ${BAR_E.toFixed(1)}), fg = fwidth(g);
  vec3 col;
  if (kind > 0.5 && kind < 1.5) {
    // ---- the web: thin skin lit through from behind
    float u = vSail.x, v = vSail.y, hM = vSail.z, edge = vCol.r;
    float du = abs(fract(u + 0.5) - 0.5);
    // spines drawn in the web as opaque ribs, never thinner than ~1.5 px, melting into an average tone far away
    float w0 = mix(0.105, 0.05, v), rib = 1.0 - smoothstep(w0, w0 + fwu * 1.5 + 0.02, du);
    rib = mix(rib, w0 * 1.6, smoothstep(0.22, 0.6, fwu));
    // crossbars (plant-eater): short rungs across each spine, densest low down
    float dg = abs(fract(g + 0.5) - 0.5);
    float bar = (1.0 - smoothstep(0.26, 0.4, du)) * (1.0 - smoothstep(0.07, 0.07 + fg * 1.5 + 0.02, dg));
    bar *= (1.0 - vSp) * step(0.5, g) * (1.0 - step(${BAR_B.toFixed(1)} - 0.25, g)) * (1.0 - smoothstep(0.25, 0.6, fg));
    // veins: a branching net that follows the spines upward and thins toward the rim
    vec2 q = vec2(u * 0.9 + seed * 17.0, hM * 7.0);
    float n1 = vn(q * vec2(1.0, 0.55) + vn(q * 2.3) * 0.9), n2 = vn(q * vec2(2.6, 1.7) + 7.0 + n1 * 1.5);
    float lodv = 1.0 - smoothstep(0.03, 0.12, fwv + fwu * 0.2);
    float vein = (1.0 - smoothstep(0.0, 0.045, abs(n1 - 0.5))) * 0.85 + (1.0 - smoothstep(0.0, 0.05, abs(n2 - 0.5))) * 0.45;
    vein = clamp(vein, 0.0, 1.0) * lodv * (1.0 - 0.65 * smoothstep(0.3, 1.0, v));
    // thickness: fleshy at the base and beside each spine, a rolled rim at the free edge
    float rim = smoothstep(0.93, 1.0, edge);
    float thick = 0.2 + 1.15 * (1.0 - smoothstep(0.0, 0.62, v)) + 0.3 * (1.0 - smoothstep(0.1, 0.5, du)) + 0.5 * rim + 0.35 * (vn(q * 0.6 + 3.0) - 0.5);
    // sail styles: 1 = a row of dark eye-spots (always on the hunter), 2 = cream margin and banded spines
    float spots = 0.0;
    // polish 3: round ocelli in a row that follows the sail's outline (a dark pupil 10 cm across inside a thin pale halo): markings, not holes
    float hS = clamp(vCol.g * 1.5, 0.2, 2.0), spOn = max(vSp, step(0.5, uStyle) * step(uStyle, 1.5));
    float sU = (fract(u / 5.0 + 0.5) - 0.5) * 2.5, sV = (v - mix(0.5, 0.5, vSp)) * hS / 0.1, sd = length(vec2(sU, sV));
    spots = (1.0 - smoothstep(0.32, 0.5, sd)) * spOn;
    float ring = (1.0 - smoothstep(0.0, 0.2, abs(sd - 0.72))) * spOn;
    float cream = step(1.5, uStyle) * smoothstep(0.8, 0.97, edge);
    float band = step(1.5, uStyle) * smoothstep(0.3, 0.7, sin(v * 26.0)) * 0.5;
    thick += spots * 1.15 + vein * 0.9 - ring * 0.2;
    float T = exp(-max(thick, 0.0) * 1.35);
    float bl = back * back + 0.35;
    vec3 deep = uEmber * vec3(0.62, 0.22, 0.16);
    vec3 through = mix(uEmber, deep, clamp(thick * 0.75, 0.0, 1.0)) * T * uEmberGain * 1.6 * bl;
    through = mix(through, uCream * 1.6 * bl * T * 1.5, cream);
    // polish 4: the sun itself seen through the skin: a hot core and a wide glow where the view ray runs toward the sun
    float b4 = back * back * back * back, b16 = b4 * b4 * b4 * b4;
    through += mix(uEmber, uCream, 0.55) * T * (1.3 * b16 * b16 * b16 + 0.5 * b16) * uSunI;
    // light falling on the near face (seen from the sun's side the web is a red skin, not a lamp)
    vec3 alb = mix(uEmber * vec3(0.55, 0.42, 0.45), uWebShade, 0.35) * (1.0 - 0.6 * vein) * (1.0 - 0.7 * spots);
    alb = mix(alb, uCream * 0.7, max(cream, rim * 0.45));
    float nl = abs(dot(N, L));
    float facing = step(0.0, dot(N, L) * dot(N, V));         // is the lit face the one we see
    vec3 front = alb * uSunColor * uSunI * nl * facing * 0.8;
    vec3 shade = mix(uWebShade, uWebShade * vec3(0.5, 0.45, 0.5), clamp(vein + spots, 0.0, 1.0));
    // in shade the thin skin still passes the dawn band behind it: dull ochre-violet, lighter where it is thinnest, never black
    vec3 skyBack = mix(uSky, uRose * 1.25, 0.3 + 0.7 * back * back);
    shade = mix(shade, uCream * 0.55, max(cream, rim * 0.5)) * (hemi * 1.3 + uShadeLift + skyBack * (0.9 + 1.8 * T));
    // a little of the ember already bleeds below the line: scattered light inside the skin
    float bleed = smoothstep(-0.16, 0.0, vWorld.y - (uSunLineY + vInst.x)) * 0.1;
    col = mix(shade, through + front + alb * hemi * 0.6, max(lit, bleed));
    float opq = clamp(max(rib, bar) + band * rib, 0.0, 1.0);
    vec3 bone = vec3(0.027, 0.011, 0.009) + hemi * 0.05 + uSunColor * uSunI * lit * 0.02;
    col = mix(col, bone, opq);
    // where the web meets the back it becomes body skin
    col = mix(col, shade * 0.8, (1.0 - smoothstep(0.0, 0.05, v)) * (1.0 - lit) * 0.5);
  } else if (kind > 2.5) {
    col = vCol * mix(0.45, 1.0, lit) * (0.4 + 0.6 * uHemiI);
  } else {
    // ---- skin and bone
    vec3 alb = vCol;
    float bone = step(1.5, kind);
    // fine breakup: speckle and faint wrinkles that fade with distance; per-animal tint
    float fade = 1.0 - smoothstep(14.0, 40.0, dist);
    float sp1 = vn(vObj.xy * 46.0 + vObj.z * 31.0 + seed * 9.0), sp2 = vn(vObj.xz * 13.0 + vObj.y * 9.0 + seed * 5.0);
    float wr = vn(vec2(vObj.x * 60.0, vObj.y * 9.0 + vObj.z * 7.0));
    alb *= 1.0 + (1.0 - bone) * fade * ((sp1 - 0.5) * 0.5 + (wr - 0.5) * 0.22) + (sp2 - 0.5) * 0.3 * (1.0 - bone);
    alb *= mix(vec3(1.0), vec3(1.0 + vInst.z * 0.5, 1.0, 1.0 - vInst.z * 0.5), 1.0 - bone);
    float ndl = dot(N, L), wrap = clamp(ndl * 0.75 + 0.25, 0.0, 1.0);
    float fr = 1.0 - max(dot(N, V), 0.0); float fr2 = fr * fr; fr = fr2 * fr;
    // backlit rim: the sun behind catches the edge of back, skull and tail
    vec3 rimL = uSunColor * vec3(1.0, 0.7, 0.55) * uSunI * fr * (0.12 + 0.75 * back * back) * lit * mix(0.7, 0.25, bone);
    // moist skin: a soft sky sheen on upward faces
    float sheen = fr * (0.3 + 0.7 * max(N.y, 0.0)) * 0.22 * (1.0 - bone);
    // a thin rose rim from the dawn band along back, skull and tail, there from the first frame (it does not wait for the sun)
    vec3 rimSky = mix(uSky * 0.6, uRose * 1.5, 0.15 + 0.85 * back) * fr2 * fr2 * (0.25 + 0.75 * clamp(N.y * 0.6 + 0.5, 0.0, 1.0)) * mix(0.5, 0.15, bone);
    // form: the underside and the legs near the ground sit in the animal's own shade (no flat, pale flank)
    float ao = (0.42 + 0.58 * smoothstep(-0.85, 0.3, N.y)) * (0.62 + 0.38 * smoothstep(0.02, 0.42, vObj.y));
    col = alb * (hemi * 1.25 * ao + uSunColor * uSunI * (wrap + 0.28) * lit * (0.6 + 0.4 * ao)) + uSky * uShadeLift * (0.6 + 0.4 * N.y) * ao + rimL + rimSky + uSky * sheen * uHemiI * 0.5;
  }
  // legs are lost in mist: fade toward the mist colour below uMistTop above the animal's own ground
  float md = clamp(uMistTop - (vWorld.y - vInst.y), 0.0, uMistTop);
  float m = min(1.0 - exp(-md * 0.11 / max(abs(V.y), 0.05)), 0.8);
  col = mix(col, uMistColor * 0.7, m * uMistAmt * 0.18);
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`;

// Shared uniforms: one set drives every animal, shadow, mist and mud material in the piece.
function makeUniforms(pal) {
  const C = (h) => new THREE.Color(h);
  return {
    uTime: { value: 0 }, uPix: { value: 0.002 }, uSunLineY: { value: 1.25 },
    uSunDir: { value: new THREE.Vector3(0.16, 0.07, -1).normalize() }, uSunColor: { value: C(pal[4]) }, uSunI: { value: 1.4 },
    uSky: { value: C(pal[0]) }, uGround: { value: C('#5A3A34') }, uHemiI: { value: 1.8 }, uShadeLift: { value: 0.05 },
    uMistColor: { value: C(pal[0]).multiplyScalar(0.62) }, uMistTop: { value: 0.4 }, uMistAmt: { value: 0.92 },
    uEmber: { value: C(pal[4]) }, uEmberGain: { value: 1.0 }, uWebShade: { value: C('#6B4A52') }, uCream: { value: C(pal[5]) },
    uStyle: { value: 0 }, uShadow: { value: 0 }, uShDir: { value: new THREE.Vector2(0, 1) }, uTanElev: { value: 0.07 },
    uMud: { value: C(pal[2]) }, uRose: { value: C(pal[3]) }, uMistLit: { value: 0 },
  };
}
export function sailbackMaterial(U) {
  const m = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {}]), vertexShader: VERT, fragmentShader: FRAG,
    vertexColors: true, fog: true, side: THREE.DoubleSide,
  });
  for (const k of ANIMAL_U) m.uniforms[k] = U[k];
  return m;
}
// share (not copy) the piece's uniform objects into a material
function share(mat, U, names) { for (const k of names) mat.uniforms[k] = U[k]; return mat; }
const ANIMAL_U = ['uRose', 'uTime', 'uPix', 'uSunLineY', 'uSunDir', 'uSunColor', 'uSunI', 'uSky', 'uGround', 'uHemiI', 'uShadeLift', 'uMistColor', 'uMistTop', 'uMistAmt', 'uEmber', 'uEmberGain', 'uWebShade', 'uCream', 'uStyle'];

// Instanced animals of one geometry. list: [{ x, y, z, yaw, scale, tilt, lineOffset, phase, period, tint, seed, mist }]
export function sailbackMesh(geo, material, list) {
  const n = Math.max(list.length, 1), mesh = new THREE.InstancedMesh(geo, material, n);
  const a1 = new Float32Array(n * 4), a2 = new Float32Array(n * 4), m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sv = new THREE.Vector3(), pv = new THREE.Vector3();
  const isDim = geo.userData.kind === 'dim';
  list.forEach((p, i) => {
    e.set(0, p.yaw || 0, 0); q.setFromEuler(e); sv.setScalar(p.scale || 1); pv.set(p.x, p.y || 0, p.z);
    m.compose(pv, q, sv); mesh.setMatrixAt(i, m);
    a1.set([p.phase ?? 0, p.lineOffset ?? 0, p.mist === false ? -1000 : (p.y || 0), p.tilt || 0], i * 4);
    a2.set([p.period ?? 5.5, p.tint ?? 0, p.seed ?? 0, isDim ? 1 : 0], i * 4);
  });
  mesh.count = list.length;
  geo.setAttribute('aInst', new THREE.InstancedBufferAttribute(a1, 4));
  geo.setAttribute('aInst2', new THREE.InstancedBufferAttribute(a2, 4));
  mesh.instanceMatrix.needsUpdate = true; mesh.frustumCulled = false;
  return mesh;
}

// The default tableau: a display pair of hunters and three loose groups of plant-eaters, all broadside to +Z.
function defaultPlacements(rng) {
  const P = [], barY = 0.3, j = (a) => rng.range(-a, a);
  const eda = (kind, x, z) => P.push({ kind, x: x + j(0.5), z: z + j(0.45), y: barY, yaw: (rng.chance(0.3) ? Math.PI : 0) + j(0.22), scale: rng.range(0.9, 1.07) });
  // the display pair: parallel, head to tail, 3 m apart, sails tilted toward each other
  const dx = -6.6 + j(0.4), dyaw = j(0.12);
  P.push({ kind: 'dim', x: dx, z: 2.4, y: barY, yaw: dyaw, scale: 1.0, tilt: -0.1 });
  P.push({ kind: 'dim', x: dx + 0.5, z: -0.6, y: barY, yaw: Math.PI + dyaw, scale: 0.96, tilt: -0.1 });
  // nearest group, 5 m from the camera line
  eda('eda', -2.2, 4.2); eda('eda', 1.6, 3.2); eda('eda', 5.0, 4.5); eda('eda', -0.2, 0.4);
  // second and third groups behind and beside
  eda('eda', 8.4, 1.2); eda('eda', 5.6, -2.4); eda('eda', 9.6, -2.6); eda('eda', -3.2, -3.0);
  eda('edaFar', 2.0, -5.0); eda('edaFar', -9.8, -3.6); eda('edaFar', 7.6, -5.8); eda('edaFar', -5.6, -6.0);
  // 0-2 half-size young beside an adult (the young are lit last)
  const young = rng.int(0, 2);
  for (let i = 0; i < young; i++) { const a = P[2 + rng.int(0, 7)]; P.push({ kind: 'edaFar', x: a.x + rng.range(0.9, 1.5), z: a.z + rng.range(0.9, 1.4), y: barY, yaw: a.yaw + j(0.4), scale: rng.range(0.46, 0.56) }); }
  return P;
}

// ---------------------------------------------------------------------------------------------------------------
// Rib shadows: one quad per sail lying on the mist top, stretched away from the sun, multiply blend (order free).
// The web's shadow is warm (light has passed through it); ribs and body are cool and dark. Opacity = uShadow.
const NOISE_GLSL = /* glsl */`
float h21(vec2 p) { p = fract(p * vec2(123.34, 345.45)); p += dot(p, p + 34.345); return fract(p.x * p.y); }
float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }`;
function makeShadows(U, list, geos) {
  const base = new THREE.PlaneGeometry(1, 1, 1, 10); base.translate(0, 0.5, 0);
  const g = new THREE.InstancedBufferGeometry(); g.index = base.index; g.setAttribute('position', base.attributes.position);
  const n = list.length, A = new Float32Array(n * 4), B = new Float32Array(n * 4), C = new Float32Array(n * 4), D = new Float32Array(n);
  list.forEach((p, i) => {
    const s = SPEC[p.kind === 'dim' ? 'dim' : 'eda'].sail;
    A.set([p.x, (p.y || 0) + (p.shadowLift ?? 0.33 * (p.mist === false ? 0.1 : 1)), p.z, p.yaw || 0], i * 4);
    B.set([s.h, s.peak, s.shape, s.n], i * 4); C.set([s.x0, s.x1, p.scale || 1, p.phase || 0], i * 4);
    D[i] = p.shadowLen ?? 15;      // polish 2: the world may stop a shadow where the mud ends (a shadow does not lie on a mirror of water)
  });
  g.setAttribute('aD', new THREE.InstancedBufferAttribute(D, 1));
  g.setAttribute('aA', new THREE.InstancedBufferAttribute(A, 4)); g.setAttribute('aB', new THREE.InstancedBufferAttribute(B, 4)); g.setAttribute('aC', new THREE.InstancedBufferAttribute(C, 4));
  g.instanceCount = n;
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: U.uTime, uShadow: U.uShadow, uShDir: U.uShDir, uTanElev: U.uTanElev },
    vertexShader: /* glsl */`
      attribute vec4 aA, aB, aC; attribute float aD; uniform vec2 uShDir; uniform float uTanElev, uTime;
      varying vec4 vP; varying vec3 vS; varying float vD;
      void main() {
        float sc = aC.z, te = max(uTanElev, 0.2), len = min(min(15.0, aD), (aB.x + 0.62) * sc / te);   // drawn shorter than the true dawn shadow so the ribbed fan lies in view
        float xl = mix(aC.x - 0.9, aC.y + 0.6, position.x + 0.5) * sc, cy = cos(aA.w), sy = sin(aA.w);
        vec3 w = vec3(aA.x + cy * xl, aA.y, aA.z - sy * xl) + vec3(uShDir.x, 0.0, uShDir.y) * position.y * len;
        float rock = 1.0 + 0.035 * sin(uTime * 0.8 + aC.w * 41.0);
        vP = vec4((xl / sc - aC.x) / (aC.y - aC.x), position.y * len * te / sc * rock, position.y, aB.w);
        vS = aB.xyz; vD = position.y * len;
        gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(w, 1.0);
      }`,
    fragmentShader: /* glsl */`
      uniform float uShadow; varying vec4 vP; varying vec3 vS; varying float vD;
      void main() {
        float s = vP.x, hp = vP.y, soft = 0.02 + vD * 0.012;
        // body: a low rounded block from tail to snout; sail: the fan profile above the back
        float bodyH = 0.47 * smoothstep(-0.6, -0.05, s) * (1.0 - smoothstep(1.08, 1.38, s));
        float sc = clamp(s, 0.0, 1.0), w = sc < vS.y ? 0.5 * sc / vS.y : 0.5 + 0.5 * (sc - vS.y) / max(1.0 - vS.y, 1e-3);
        float prof = vS.x * (0.13 + 0.87 * pow(max(sin(3.14159 * w), 0.0), vS.z));
        float eb = 0.015 + vD * 0.004, inS = smoothstep(-eb, eb, s) * (1.0 - smoothstep(1.0 - eb, 1.0 + eb, s));
        float sail = inS * (1.0 - smoothstep(prof - soft * 2.0, prof + soft * 2.0, hp - 0.44)) * smoothstep(0.40, 0.46, hp);
        float body = 1.0 - smoothstep(bodyH - soft, bodyH + soft, hp);
        float fw = fwidth(s * (vP.w - 1.0));
        float ru = s * (vP.w - 1.0) + 0.5, rid = floor(ru), rw = 0.1 + 0.1 * fract(sin(rid * 12.9898) * 43758.5453);
        float du = abs(fract(ru) - 0.5), blur = clamp(vD * 0.014 + fw, 0.0, 0.5);
        float rib = 1.0 - smoothstep(rw - blur * 0.4, rw + 0.03 + blur, du);
        rib = mix(rib, 0.3, smoothstep(0.12, 0.45, blur));
        vec3 webTint = vec3(0.92, 0.6, 0.5), dark = vec3(0.3, 0.28, 0.48);
        vec3 mult = mix(vec3(1.0), mix(webTint, dark, rib), sail);
        mult = mix(mult, mix(vec3(1.0), dark, 0.75), body);
        float fade = (1.0 - smoothstep(0.58, 1.0, clamp(vP.z, 0.0, 1.0))) * uShadow;      // dies away softly: never a hard-ended slab
        gl_FragColor = vec4(mix(vec3(1.0), mult, fade), 1.0);
      }`,
    transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation,
    blendSrc: THREE.ZeroFactor, blendDst: THREE.SrcColorFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 4;
  return mesh;
}

// ---------------------------------------------------------------------------------------------------------------
// The mudbar slab: a low red bar 0.3 m above the water, its skin cracked into plates 0.4 m across.
function barHeight(noise, x, z, hx, hz) {
  const ex = x / hx, ez = (z + 1.2) / hz, d = Math.pow(Math.pow(Math.abs(ex), 2.6) + Math.pow(Math.abs(ez), 2.6), 1 / 2.6);
  const edge = d + 0.09 * noise.fbm2(x * 0.11, z * 0.11, 3);
  return -0.28 + 0.58 * (1 - sst(0.72, 1.02, edge)) + 0.035 * noise.fbm2(x * 0.35 + 9, z * 0.35, 2) * (1 - sst(0.8, 1.0, edge));
}
async function makeBar(ctx, U, detail, hx, hz) {
  const nx = Math.round(120 * detail), nz = Math.round(64 * detail), W = hx * 2.5, D = hz * 2.6;
  const geo = new THREE.PlaneGeometry(W, D, nx, nz); geo.rotateX(-Math.PI / 2); geo.translate(0, 0, -1.2);
  const P = geo.attributes.position;
  for (let i = 0; i < P.count; i++) {
    P.setY(i, barHeight(ctx.noise, P.getX(i), P.getZ(i), hx, hz));
    if (i % 1500 === 1499) await ctx.yield();
  }
  geo.computeVertexNormals();
  const mat = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {}]), fog: true,
    vertexShader: /* glsl */`
      varying vec3 vW, vN;
      #include <fog_pars_vertex>
      void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vN = mat3(modelMatrix) * normal;
        vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uMud, uSky, uGround, uSunDir, uSunColor, uMistColor; uniform float uSunLineY, uSunI, uHemiI, uMistAmt, uMistTop;
      varying vec3 vW, vN;
      #include <fog_pars_fragment>
      ${NOISE_GLSL}
      void main() {
        vec2 p = vW.xz * 2.5 + vec2(vn(vW.xz * 0.9), vn(vW.xz * 0.9 + 5.0)) * 0.7;
        float fw = max(fwidth(p.x), fwidth(p.y));
        vec2 ip = floor(p), fp = fract(p); float f1 = 9.0, f2 = 9.0, id = 0.0;
        for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
          vec2 o = vec2(float(i), float(j)), c = o + vec2(h21(ip + o), h21(ip + o + 17.3)) * 0.8 + 0.1 - fp;
          float d = dot(c, c);
          if (d < f1) { f2 = f1; f1 = d; id = h21(ip + o + 3.1); } else if (d < f2) { f2 = d; }
        }
        float e = sqrt(max(f2, 0.0)) - sqrt(max(f1, 0.0));
        float lod = 1.0 - smoothstep(0.25, 0.9, fw);
        float crack = (1.0 - smoothstep(0.02, 0.07 + fw, e)) * lod;
        float curl = smoothstep(0.1, 0.45, e) * lod;            // plates dish upward at their edges
        float wet = 1.0 - smoothstep(0.02, 0.22, vW.y);         // dark wet margin at the waterline
        vec3 alb = uMud * (0.72 + 0.4 * id * lod + 0.16 * vn(vW.xz * 0.6)) * mix(1.0, 0.8, curl * 0.5);
        alb = mix(alb, uMud * vec3(0.3, 0.26, 0.3), max(crack, wet * 0.75));
        vec3 N = normalize(vN + vec3(0.0, 1e-4, 0.0));
        float lit = smoothstep(-0.03, 0.03, vW.y - uSunLineY);
        vec3 hemi = mix(uGround, uSky, N.y * 0.5 + 0.5) * uHemiI;
        vec3 col = alb * (hemi * 0.8 + uSunColor * uSunI * lit * (0.1 + max(dot(N, uSunDir), 0.0)));
        col += uSky * wet * 0.1 * uHemiI;
        vec3 Vd = normalize(cameraPosition - vW + vec3(0.0, 1e-4, 0.0));
        float md = clamp(0.3 + uMistTop - vW.y, 0.0, 1.0);
        col = mix(col, uMistColor * 0.8, min(1.0 - exp(-md * 0.11 / max(abs(Vd.y), 0.05)), 0.8) * uMistAmt);
        gl_FragColor = vec4(col, 1.0);
        #include <fog_fragment>
      }`,
  });
  share(mat, U, ['uMud', 'uSky', 'uGround', 'uSunDir', 'uSunColor', 'uMistColor', 'uSunLineY', 'uSunI', 'uHemiI', 'uMistAmt', 'uMistTop']);
  return new THREE.Mesh(geo, mat);
}

// Still water round the bar: an analytic sky mirror (slate overhead, rose toward the sun) under the same mist law.
function makeWater(U, radius) {
  const geo = new THREE.CircleGeometry(radius, 48); geo.rotateX(-Math.PI / 2);
  const mat = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uRadius: { value: radius } }]), fog: true, transparent: true,
    vertexShader: /* glsl */`
      varying vec3 vW; varying vec2 vL;
      #include <fog_pars_vertex>
      void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vL = position.xz;
        vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uSky, uRose, uCream, uSunDir, uMistColor, uMud; uniform float uTime, uHemiI, uMistAmt, uMistTop, uMistLit, uRadius;
      varying vec3 vW; varying vec2 vL;
      #include <fog_pars_fragment>
      ${NOISE_GLSL}
      void main() {
        vec3 V = normalize(cameraPosition - vW + vec3(0.0, 1e-4, 0.0));
        // trembling reflections: a faint ripple normal
        vec2 rp = vW.xz * 1.7 + uTime * 0.3;
        vec2 dn = (vec2(vn(rp), vn(rp + 9.1)) - 0.5) * 0.09;
        vec3 R = normalize(vec3(-V.x + dn.x, abs(V.y) + 0.02, -V.z + dn.y));
        float hl = max(length(uSunDir.xz), 1e-3), toSun = max(dot(R.xz, uSunDir.xz) / (hl * max(length(R.xz), 1e-3)), 0.0);
        float low = 1.0 - smoothstep(0.0, 0.4, R.y);
        vec3 sky = mix(uSky * 0.5, uSky * 1.1, low);
        sky = mix(sky, mix(uRose, uCream, low * (0.4 + 0.6 * uMistLit)) * (0.8 + 0.5 * uMistLit), toSun * toSun * low);
        float fres = 0.06 + 0.94 * pow(1.0 - clamp(abs(V.y), 0.0, 1.0), 4.0);
        vec3 col = mix(uMud * 0.07 + uSky * 0.05, sky * uHemiI * 0.55, fres) * (0.86 + 0.28 * vn(rp * vec2(0.35, 1.3)));
        float md = uMistTop + 0.3;
        col = mix(col, uMistColor * 0.8, min(1.0 - exp(-md * 0.11 / max(abs(V.y), 0.05)), 0.8) * uMistAmt);
        float a = 1.0 - smoothstep(0.8, 1.0, length(vL) / uRadius);
        gl_FragColor = vec4(col, a);
        #include <fog_fragment>
      }`,
  });
  share(mat, U, ['uSky', 'uRose', 'uCream', 'uSunDir', 'uMistColor', 'uMud', 'uTime', 'uHemiI', 'uMistAmt', 'uMistTop', 'uMistLit']);
  const mesh = new THREE.Mesh(geo, mat); mesh.renderOrder = 1; mesh.name = 'water';
  return mesh;
}

// Mist: stacked noise-scrolled sheets over bar and water, blue in shade, peach once the line reaches the mist top.
function makeMist(U, detail, radius) {
  const layers = detail < 0.8 ? [0.46, 0.66] : [0.42, 0.56, 0.7], parts = [];
  const pos = [], lay = [], idx = [];
  layers.forEach((y, k) => {
    const o = pos.length / 3; pos.push(-radius, y, -radius, radius, y, -radius, radius, y, radius, -radius, y, radius);
    lay.push(k, k, k, k); idx.push(o, o + 2, o + 1, o, o + 3, o + 2);
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('aLayer', new THREE.Float32BufferAttribute(lay, 1)); geo.setIndex(idx);
  const mat = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uRadius: { value: radius } }]), fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      attribute float aLayer; varying vec3 vW; varying float vLayer; varying vec2 vL;
      #include <fog_pars_vertex>
      void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vLayer = aLayer; vL = position.xz;
        vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uMistColor, uCream, uRose, uSunColor; uniform float uTime, uMistLit, uRadius, uMistAmt;
      varying vec3 vW; varying float vLayer; varying vec2 vL;
      #include <fog_pars_fragment>
      ${NOISE_GLSL}
      void main() {
        vec2 p = vW.xz * 0.16 + vec2(uTime * 0.045, uTime * 0.012) * (1.0 + vLayer * 0.35) + vLayer * 7.3;
        float n = vn(p) * 0.5 + vn(p * 2.3 + 3.0 + uTime * 0.05) * 0.28 + vn(p * 5.1 + vec2(uTime * 0.2, -uTime * 0.07)) * 0.22;
        float a = mix(0.02, 0.3, smoothstep(0.25, 0.8, n)) * (1.0 - vLayer * 0.22);
        a *= 1.0 - smoothstep(0.55, 1.0, length(vL) / uRadius);
        a *= smoothstep(0.3, 1.6, distance(vW, cameraPosition));
        vec3 col = mix(uMistColor * (0.72 + 0.56 * n), mix(uRose, uCream, 0.6 + 0.3 * n) * (0.55 + 0.35 * n), uMistLit * (0.8 + 0.2 * n));
        gl_FragColor = vec4(col, a * uMistAmt);
        #include <fog_fragment>
      }`,
  });
  share(mat, U, ['uMistColor', 'uCream', 'uRose', 'uSunColor', 'uTime', 'uMistLit', 'uMistAmt']);
  const mesh = new THREE.Mesh(geo, mat); mesh.renderOrder = 3; mesh.frustumCulled = false;
  return mesh;
}

// ---------------------------------------------------------------------------------------------------------------
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, pal = (opts.palette && opts.palette.length >= 7) ? opts.palette : PALETTE;
  const detail = clamp(opts.detail ?? ctx.quality?.detail ?? 1, 0.6, 1);
  const U = makeUniforms(pal);
  U.uStyle.value = opts.sailStyle ?? rng.int(0, 2);
  const object = new THREE.Group(); object.name = 'red-sails-dawn-hero';

  // placements, with the per-animal life each one needs
  const list = (opts.placements || defaultPlacements(rng)).map((p) => ({ ...p }));
  for (const p of list) {
    p.kind = p.kind || 'eda'; p.y = p.y ?? 0.3; p.scale = p.scale ?? 1;
    p.phase = p.phase ?? rng(); p.period = p.period ?? rng.range(4, 7); p.tint = p.tint ?? rng.range(-0.14, 0.14); p.seed = p.seed ?? rng();
    p.lineOffset = p.lineOffset ?? rng.range(0, 0.12);
  }
  // three meshes: hero plant-eater, far plant-eater, hunter
  const grnd = rng.fork ? rng.fork('geo') : rng;
  const geos = {};
  geos.eda = sailbackGeometry('eda', grnd, true); await ctx.yield();
  geos.edaFar = sailbackGeometry('eda', grnd, false); await ctx.yield();
  geos.dim = sailbackGeometry('dim', grnd, true); await ctx.yield();
  const mat = sailbackMaterial(U), meshes = {};
  for (const k of ['eda', 'edaFar', 'dim']) {
    meshes[k] = sailbackMesh(geos[k], mat, list.filter((p) => p.kind === k));
    meshes[k].name = 'sailbacks-' + k; object.add(meshes[k]);
    await ctx.yield();
  }
  const shadows = makeShadows(U, list, geos); object.add(shadows);

  // bounds of the group
  let hx = 6, hz = 4, top = 0;
  for (const p of list) { hx = Math.max(hx, Math.abs(p.x) + 2.2); hz = Math.max(hz, Math.abs(p.z + 1.2) + 2.2); top = Math.max(top, p.y + geos[p.kind].userData.sailTop * p.scale); }
  if (opts.ground !== false) { const bar = await makeBar(ctx, U, detail, hx * 1.32, hz * 1.3); bar.name = 'mudbar'; object.add(bar); object.add(makeWater(U, Math.max(hx, hz) * 6)); }
  await ctx.yield();
  if (opts.mist !== false) object.add(makeMist(U, detail, Math.max(hx, hz) * 2.4));

  // anchors
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const near = list.filter((p) => p.kind === 'eda').sort((a, b) => b.z - a.z)[0] || list[0];
  const dims = list.filter((p) => p.kind === 'dim');
  const zLine = near.z + 5.6;
  const anchors = {
    portalSeat: { position: V(hx + 24, 7, zLine + 1), facing: V(-1, 0, 0) },
    flyThrough: [V(-hx - 20, 1.5, zLine + 2), V(-hx * 0.6, 1.5, zLine + 0.6), V(near.x, 1.5, zLine), V(hx * 0.6, 1.5, zLine + 0.5), V(hx + 10, 1.8, zLine + 1)],
    viewpoints: { entry: V(-hx - 20, 1.5, zLine + 2), closest: V(near.x - 1.5, 1.5, zLine), display: dims.length ? V(dims[0].x - 3, 1.6, dims[0].z + 7) : V(0, 1.6, zLine) },
    lookAt: V(near.x, 1.0, near.z), nearestGroup: V(near.x, near.y, near.z),
    displayPair: dims.length ? V(dims[0].x, dims[0].y, dims[0].z) : null,
    sunDir: U.uSunDir.value, extent: { halfX: hx, halfZ: hz, top },
    animals: list.map((p) => ({ kind: p.kind, position: V(p.x, p.y, p.z), yaw: p.yaw || 0, sailTop: p.y + geos[p.kind].userData.sailTop * p.scale })),
  };

  // the event
  const cE = new THREE.Color(pal[4]), cP = new THREE.Color(pal[5]), cMistB = new THREE.Color(pal[0]).multiplyScalar(0.62), cMistP = new THREE.Color(pal[5]).multiplyScalar(0.72);
  let driven = false, lineOverride = null;
  const apply = (u) => {
    U.uSunLineY.value = lineOverride ?? sunLineY(u);
    U.uSunColor.value.copy(cE).lerp(cP, sst(0.3, 0.9, u));
    U.uSunI.value = 0.9 + 1.3 * sst(0.1, 0.7, u);
    U.uEmberGain.value = 1.4;
    U.uMistLit.value = sst(0.44, 0.53, u);
    U.uMistColor.value.copy(cMistB).lerp(cMistP, U.uMistLit.value);
    U.uShadow.value = sst(0.44, 0.51, u) * (1 - 0.5 * sst(0.9, 1.0, u));
  };
  const setSun = (dir, color, strength) => {
    if (dir) { U.uSunDir.value.copy(dir).normalize(); }
    const L = U.uSunDir.value, hl = Math.hypot(L.x, L.z);
    U.uTanElev.value = Math.max(L.y, 0.02) / Math.max(hl, 1e-3);
    U.uShDir.value.set(-L.x / Math.max(hl, 1e-3), -L.z / Math.max(hl, 1e-3));
    if (color) cE.set(color); if (strength !== undefined) U.uSunI.value = strength;
  };
  setSun(null); apply(0.40);
  const size = new THREE.Vector2();
  const hero = {
    object, radius: opts.placements ? Math.hypot(hx, hz) * 0.5 : 1.5, height: 1.4, center: V(0.5, 1.3, 2.2), anchors, uniforms: U, sunLineY,
    ground: opts.ground === false, groundY: -0.02,
    setProgress(u) { driven = true; apply(clamp(u, 0, 1)); },
    setSunLine(y) { lineOverride = y; U.uSunLineY.value = y; },
    setSun,
    setMist(color, top) { if (color) { cMistB.set(color); U.uMistColor.value.copy(cMistB).lerp(cMistP, U.uMistLit.value); } if (top !== undefined) U.uMistTop.value = top; },
    update(dt, time, camera) {
      U.uTime.value = time;
      if (!driven) apply(0.40 + 0.1 * Math.sin(time * 0.21 - 2.6));   // viewer demo only
      if (camera && ctx.renderer) {
        ctx.renderer.getDrawingBufferSize(size);
        U.uPix.value = 2 / (Math.max(camera.projectionMatrix.elements[5], 1e-3) * Math.max(size.y, 1));
      }
    },
    dispose() {},
  };
  return hero;
}
