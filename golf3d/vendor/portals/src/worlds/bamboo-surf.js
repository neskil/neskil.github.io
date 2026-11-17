// THE BAMBOO SEA (bamboo-surf): a typhoon's dying arm blows through a forest of giant moso bamboo.
// We slalom up a straight aisle and round the clumps while gust fronts bow the culms in travelling lines, drop to a
// stream in a ferny gully (pheasants flush, golden monkeys leap the lane), a wall of leaves overtakes us and the
// culms at the gully head part like a curtain; we climb through the V into open air above a crown sea rolling over
// ridge after ridge, swells of pale leaf-undersides crossing it, a white rain curtain marching in from the left,
// and ride the crest to a ring between two whipping emergent clumps.
//
// How the world is laid: the trunk space is closed by a fog-coloured skirt that follows the camera (no strip of sky under
// the ceiling), the floor is lifted by hero.setFill per look, the stream is a depth-shored sheet in a bed the ground mesh
// resolves (stones and ferns on both banks), the ledge huddle sits 8.6 m left of the lane, the leapers are launched
// further up the lane, six clingers ride the parting culms (hero.addMonkeys), and the crown sea is shaded as wind-combed
// jittered crowns with plumes on the far crests.
//
// The crest flight rides 6 m over the crown tops (a little down into the saddle) and the valleys fall away on both hands.
// Its gaze leans left to the rain curtain, and as it returns the cloud opens over THE TABLE: one table of red sandstone
// standing out of the crown sea beyond the saddle, 352 m past the ring and 248 m to its right (bedded rock, vines over
// its lip, ribbon falls, bamboo on its top), the one place where bamboo cannot hold. Then the ring between its two gate
// clumps. Nothing made or squared anywhere: boulders under moss, a fallen culm lodged in the Great Clump. No ridge is
// seen out of the forest before the V (uRidgeK).
//
// Everything is in the hero's space (src/parts/bamboo-surf.js, unrotated at the origin): the gully runs toward -Z,
// the wind blows toward (+0.71, 0, -0.71), the sun (or moon) is on the left, a little behind.
// Looks by seed / ctx.vary.hour: storm light through a western tear | typhoon noon, no sun, heavy rain | clearing
// evening, amber under a black cloud edge, mist in the valleys | full-moon gale. Season: summer | spring leaf-change
// (gold in the gale, sheathed shoots) | wet snow. Cast: golden or silver pheasant, magpies or a cloud of parrotbills,
// the ledge huddle or one giant panda. Rare (ctx.vary.rare): the slope upwind of the ring has flowered straw-gold
// and its chaff streams across the saddle.
import * as THREE from 'three';
import { makePath, clamp, lerp, makeRng, hashSeed, bell } from '../kit/core.js';
import { makeSky } from '../kit/sky.js';
import * as fx from '../kit/fx.js';
import { makeHorizonRidges } from '../kit/terrain.js';
import { buildHero, fernCover, furMonkey, GLSL_WIND, GLSL_LIGHT, GLSL_FUR, GLSL_BAND } from '../parts/bamboo-surf.js';

const PALETTE = ['#3E8E63', '#B9D94A', '#1F4B4A', '#A9CFA0', '#59636E', '#EDF1F2', '#E3912B'];
const DUR = 41;
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const C = (h) => new THREE.Color(h);
const fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
const lightU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.lights);

const LOOKS = {
  storm: {
    hero: 'storm', sunEl: 25, sunCol: '#fff1d2', sunI: 3.1, hemiSky: '#93a7b3', hemiGnd: '#2f5248', hemiIn: 1.7, hemiOut: 0.95, shut: 0.19, fill: 1.15,
    fogIn: '#234f4c', fogOut: '#6f8a8c', dIn: 0.0102, dOut: 0.00052, rain: 0.55, exposure: 1.06, mist: 0.9, cloud: 0.64,
    gap: { hor: '#d3d3b8', top: '#465260', glow: '#fff0c4', near: '#2b5a46', far: '#8fa5a8', mist: '#c3d2cc', gain: 1.0 },
    sky: { preset: 'storm', zenith: '#2f3b4a', mid: '#4a5966', horizon: '#93a8a4', scatterColor: '#f2edd0', scatter: 1.0, scatterPow: 5, scatterHigh: 0.05,
      sunIntensity: 0, sunGlow: 0.8, veil: 1.3, lightning: 0,
      clouds: { coverage: 0.74, softness: 0.42, scale: 0.8, lit: '#c9c8b4', shade: '#35424f', absorb: 1.9, silver: 0.9, wind: [0.07, -0.05], detail: 0.8 },
      clouds2: { coverage: 0.95, softness: 0.6, scale: 0.5, stretch: 0.3, opacity: 1, lit: '#69757e', shade: '#333d47', wind: [0.03, -0.02] } },
    grade: { saturation: 1.1, contrast: 1.0, tint: '#ffffff', shadowTint: '#0b2527', vignette: 0.28, grain: 0.02 },
  },
  noon: {
    hero: 'noon', sunEl: 50, sunCol: '#dfe9ea', sunI: 2.6, hemiSky: '#a9c0c0', hemiGnd: '#35625a', hemiIn: 2.5, hemiOut: 1.8, shut: 0.5, fill: 1.1,
    fogIn: '#1f4a4c', fogOut: '#7d9296', dIn: 0.0112, dOut: 0.00085, rain: 1.0, exposure: 1.12, mist: 0.8, cloud: 0.3,
    gap: { hor: '#a9b8ba', top: '#4c5861', glow: '#cfdadb', near: '#28524e', far: '#80969a', mist: '#b4c4c6', gain: 0.8 },
    sky: { preset: 'storm', zenith: '#3d474f', mid: '#55616a', horizon: '#8a979b', scatter: 0.15, sunIntensity: 0, sunGlow: 0.1, veil: 0.3, lightning: 0,
      clouds: { coverage: 0.9, softness: 0.45, scale: 0.75, lit: '#9aa5ab', shade: '#333d46', absorb: 2, silver: 0.3, wind: [0.085, -0.06], detail: 0.8 },
      clouds2: { coverage: 0.98, softness: 0.6, scale: 0.5, stretch: 0.3, opacity: 1, lit: '#606c75', shade: '#2c353e', wind: [0.035, -0.025] } },
    grade: { saturation: 1.04, contrast: 1.0, tint: '#f1fbff', shadowTint: '#0a242a', vignette: 0.3, grain: 0.025 },
  },
  evening: {
    hero: 'evening', sunEl: 13, sunCol: '#fff0de', sunI: 3.3, hemiSky: '#8f9ab6', hemiGnd: '#33503f', hemiIn: 2.0, hemiOut: 1.0, shut: 0.18, fill: 1.15,
    fogIn: '#28504a', fogOut: '#8d878f', dIn: 0.0098, dOut: 0.00058, rain: 0.2, exposure: 1.1, mist: 1.4, cloud: 0.62,
    gap: { hor: '#f1c68e', top: '#3b3f58', glow: '#ffb468', near: '#34523e', far: '#9d95a4', mist: '#e9cba9', gain: 1.0 },
    sky: { preset: 'storm', zenith: '#1c2234', mid: '#3a3f5c', horizon: '#8a7c8a', scatterColor: '#ffad55', scatter: 1.5, scatterPow: 9, scatterHigh: 0.03, scatterFall: 5,
      sunIntensity: 7, sunSize: 2.2, sunColor: '#ffc27a', sunGlow: 1.0, veil: 1.5, lightning: 0,
      clouds: { coverage: 0.66, softness: 0.4, scale: 0.8, lit: '#d9a688', shade: '#262a3c', absorb: 2.1, silver: 1.6, wind: [0.06, -0.045], detail: 0.8 },
      clouds2: { coverage: 0.85, softness: 0.6, scale: 0.5, stretch: 0.4, opacity: 0.9, lit: '#7d6c7c', shade: '#272b3c', wind: [0.025, -0.018] } },
    grade: { saturation: 1.1, contrast: 1.0, tint: '#fff6ea', shadowTint: '#0e2427', vignette: 0.28, grain: 0.02 },
  },
  night: {
    hero: 'night', sunEl: 34, sunCol: '#dfe8ff', sunI: 2.6, hemiSky: '#6f8cc4', hemiGnd: '#2a5560', hemiIn: 2.7, hemiOut: 1.35, shut: 0.32, fill: 1.3,
    fogIn: '#15384a', fogOut: '#2c4458', dIn: 0.0098, dOut: 0.0005, rain: 0.4, exposure: 1.15, mist: 0.9, cloud: 0.5,
    gap: { hor: '#41598a', top: '#0c1630', glow: '#b4c6f0', near: '#10283a', far: '#2c4664', mist: '#5d78a0', gain: 0.75 },
    sky: { preset: 'night', zenith: '#050b1a', mid: '#0f1f3c', horizon: '#2a456a', stars: 0.8, milkyWay: 0.4,
      clouds: { coverage: 0.56, softness: 0.4, lit: '#a9bbe0', shade: '#16223e', opacity: 0.92, silver: 1.3, absorb: 2, wind: [0.07, -0.05] } },
    grade: { saturation: 1.05, contrast: 1.0, tint: '#eef4ff', shadowTint: '#0a1a30', vignette: 0.32, grain: 0.03 },
  },
};

// ---- small mesh builder for the creatures: position, normal, aCol (linear), aW (x: tail 0..1, y: signed wing span) ----
function builder() {
  const P = [], Cc = [], W = [], I = [];
  const add = (geo, col, wfn) => {
    const p = geo.attributes.position, o = P.length / 3, ix = geo.index;
    for (let i = 0; i < p.count; i++) {
      const v = [p.getX(i), p.getY(i), p.getZ(i)], c = typeof col === 'function' ? col(v) : col, w = wfn ? wfn(v) : [0, 0];
      P.push(v[0], v[1], v[2]); Cc.push(c.r, c.g, c.b); W.push(w[0], w[1]);
    }
    if (ix) for (let i = 0; i < ix.count; i++) I.push(o + ix.getX(i)); else for (let i = 0; i < p.count; i++) I.push(o + i);
    geo.dispose();
  };
  const blob = (c, r, col, ws = 10, hs = 7) => { const g = new THREE.SphereGeometry(1, ws, hs); g.scale(r[0], r[1], r[2]); g.translate(c[0], c[1], c[2]); add(g, col); };
  const limb = (a, b, ra, rb, col, wfn) => {
    const va = new THREE.Vector3(...a), d = new THREE.Vector3(...b).sub(va), L = d.length();
    const g = new THREE.CylinderGeometry(rb, ra, L, 6, wfn ? 6 : 1, false); g.translate(0, L / 2, 0);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize())); g.translate(va.x, va.y, va.z);
    add(g, col, wfn);
  };
  const quad = (pts, col, wfn) => {                 // pts: rows of [x,y,z] pairs (a strip)
    const g = new THREE.BufferGeometry(), pos = [], idx = [];
    for (const p of pts) pos.push(...p[0], ...p[1]);
    for (let i = 0; i < pts.length - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); add(g, col, wfn);
  };
  const build = (xf) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
    g.setAttribute('aCol', new THREE.Float32BufferAttribute(Cc, 3));
    g.setAttribute('aW', new THREE.Float32BufferAttribute(W, 2));
    g.setIndex(I); if (xf) g.applyMatrix4(xf); g.computeVertexNormals();
    return g;
  };
  return { add, blob, limb, quad, build };
}

// golden snub-nosed monkey, facing +X: pose 'sit' (hunched on y = 0) or 'leap' (spread, body along +X). The furred
// build is the hero's (furMonkey: smooth limbs, dark back under a gold mantle, tufts that break the outline); it comes
// with its own normals. o.tail lays the tail along a path (the huddle's drape theirs over the ledge)
function monkeyGeometry(gold, pose, M, o) {
  const fm = furMonkey(gold, pose, o), g = new THREE.BufferGeometry(), w = new Float32Array(fm.tail.length * 2);
  for (let i = 0; i < fm.tail.length; i++) { w[i * 2] = fm.tail[i]; w[i * 2 + 1] = fm.smooth[i]; }       // (aW.y on a monkey: 1 on bare skin; the wing beat it drives on a bird stays at rest here)
  g.setAttribute('position', new THREE.Float32BufferAttribute(fm.position, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(fm.normal, 3));
  g.setAttribute('aCol', new THREE.Float32BufferAttribute(fm.color, 3));
  g.setAttribute('aW', new THREE.BufferAttribute(w, 2));
  g.setIndex(fm.index); if (M) g.applyMatrix4(M);
  g.userData.headAt = fm.headAt;
  return g;
}

// giant panda seated, facing +X, eating: black and white, about 1.25 m to the ears
function pandaGeometry(M) {
  const w = C('#e9e6dc'), k = C('#17171a'), sub = builder();
  sub.blob([0, 0.48, 0], [0.42, 0.5, 0.45], (v) => (v[1] > 0.66 && v[0] < 0.3 ? k : w), 12, 9);
  sub.blob([0.1, 1.02, 0], [0.26, 0.24, 0.27], w, 12, 8);
  sub.blob([0.31, 0.98, 0], [0.1, 0.09, 0.11], w, 8, 6);
  for (const s of [-1, 1]) {
    sub.blob([0.04, 1.25, s * 0.2], [0.08, 0.08, 0.06], k, 6, 5); sub.blob([0.3, 1.06, s * 0.11], [0.05, 0.06, 0.045], k, 6, 5);
    sub.limb([0.02, 0.84, s * 0.36], [0.3, 0.6, s * 0.3], 0.13, 0.11, k); sub.limb([0.3, 0.6, s * 0.3], [0.42, 0.82, s * 0.1], 0.11, 0.09, k);
    sub.limb([0.1, 0.16, s * 0.3], [0.62, 0.14, s * 0.36], 0.17, 0.12, k); sub.blob([0.68, 0.2, s * 0.36], [0.1, 0.13, 0.1], k, 6, 5);
  }
  sub.limb([0.44, 0.5, 0.3], [0.5, 1.3, -0.2], 0.022, 0.014, C('#3E8E63'));       // the culm it is eating
  return sub.build(M);
}

// a wing for a bird flying toward +X: a cambered arm (two strips meeting along a raised midline) and primaries fanned
// from the hand as separate feathers. s: side (+1 = +Z). aW.y carries the signed distance from the root for the flap.
function wingOn(b, s, o) {
  const wf = (v) => [0, s * Math.max(Math.abs(v[2]) - o.zr, 0)];
  const xl = (t) => o.xl - o.sweep * t * t, ch = (t) => o.chord * (1 - 0.3 * t), lead = [], trail = [], n = 4;
  for (let i = 0; i <= n; i++) {
    const t = i / n, z = s * (o.zr + o.span * t), x0 = xl(t), c = ch(t), cam = o.camber * (1 - 0.5 * t);
    lead.push([[x0, o.y - 0.3 * cam, z], [x0 - 0.42 * c, o.y + cam, z]]);
    trail.push([[x0 - 0.42 * c, o.y + cam, z], [x0 - c, o.y, z]]);
  }
  b.quad(lead, o.colLead, wf); b.quad(trail, o.colTrail, wf);
  for (let k = 0; k < o.nPrim; k++) {
    const f = k / (o.nPrim - 1), th = -0.15 + 1.3 * f, tb = 1 - 0.45 * f;            // the outermost reaches along the span, the innermost points back
    const bx = xl(tb) - ch(tb) * (0.2 + 0.62 * f), bz = o.zr + o.span * tb, len = o.primLen * (1 - 0.28 * f);
    const dx = -Math.sin(th), dz = Math.cos(th), px = Math.cos(th), pz = Math.sin(th), rows = [];
    for (const [u, w] of [[0, 0.5], [0.55, 0.56], [0.88, 0.4], [1, 0.12]]) {
      const cx = bx + dx * len * u, cz = bz + dz * len * u, hw = o.primW * w, y = o.y + 0.006 * k - 0.02 * u * u;
      rows.push([[cx + px * hw, y, s * (cz + pz * hw)], [cx - px * hw, y, s * (cz - pz * hw)]]);
    }
    b.quad(rows, (v) => o.colPrim(v, f), wf);
  }
}

// a long tail feather as a ridged strip (an inverted V in section) from (x0, y0) back along -X, fanned by az
function tailFeather(b, x0, y0, len, hw0, hw1, az, arc, col) {
  const L = [], Rr = [], ca = Math.cos(az), sa = Math.sin(az), tw = (v) => [clamp(Math.hypot(v[0] - x0, v[2]) / len, 0, 1), 0];
  for (let i = 0; i <= 7; i++) {
    const t = i / 7, hw = hw0 + (hw1 - hw0) * t, d = len * t, y = y0 + arc * Math.sin(t * 2.4) - arc * 1.1 * t * t;
    const cx = x0 - ca * d, cz = sa * d, px = sa, pz = ca;
    L.push([[cx - px * hw, y, cz - pz * hw], [cx, y + hw * 0.55, cz]]); Rr.push([[cx, y + hw * 0.55, cz], [cx + px * hw, y, cz + pz * hw]]);
  }
  b.quad(L, col, tw); b.quad(Rr, col, tw);
}

// pheasant flying toward +X. kind 0 golden cock, 1 brown hen, 2 silver cock
function pheasantGeometry(kind) {
  const b = builder();
  const red = C('#d21a12'), goldC = C('#f6b918'), orange = C('#E3912B'), blue = C('#1d3f7a'), green = C('#1f6a4a'), brown = C('#6a4a2a'), tan = C('#b08a56'), buff = C('#c9a05a'), dark = C('#1c1510'), white = C('#e8ebe8'), black = C('#101216');
  const bar = (x, k) => Math.round(0.5 + 0.5 * Math.sin(x * k));
  const mottle = (v) => brown.clone().lerp(tan, sstep(-0.05, 0.08, v[1]) * 0.6).lerp(dark, 0.35 * bar(v[0] + v[2] * 0.6, 70));
  // body: scarlet below, a green mantle and a gold rump above (cock); breast; barred ruff; head with the swept crest
  b.blob([0, 0, 0], [0.21, 0.11, 0.105], kind === 0 ? (v) => (v[1] < -0.012 ? red : v[0] > 0.03 ? green.clone().lerp(blue, 0.35) : goldC.clone().lerp(orange, sstep(-0.1, -0.2, v[0]) * 0.5)) : kind === 2 ? (v) => (v[1] > -0.012 ? white.clone().lerp(black, 0.22 * bar(v[0] * 1.3 + v[2], 80)) : black) : mottle, 12, 8);
  b.blob([0.14, -0.012, 0], [0.115, 0.1, 0.095], kind === 0 ? red : kind === 2 ? black : mottle, 10, 7);
  b.blob([0.225, 0.05, 0], [0.085, 0.08, 0.075], kind === 0 ? (v) => (v[1] > 0.02 ? orange.clone().lerp(dark, 0.6 * bar(v[0], 95)) : red) : kind === 2 ? (v) => (v[1] > 0.03 ? white : black) : mottle, 9, 7);
  b.blob([0.315, 0.09, 0], [0.06, 0.052, 0.05], kind === 0 ? (v) => (v[1] > 0.1 ? goldC : orange.clone().lerp(tan, 0.4)) : kind === 2 ? (v) => (v[1] > 0.105 ? black : red) : tan, 8, 6);
  if (kind !== 1) b.limb([0.325, 0.128, 0], [0.19, 0.15, 0], 0.036, 0.012, kind === 0 ? goldC : black);
  b.limb([0.36, 0.085, 0], [0.425, 0.072, 0], 0.017, 0.004, C('#d8c890'));
  // tail: the long central pair, barred, and shorter coverts fanned either side
  const tl = kind === 1 ? 0.36 : 0.8;
  const tcol = kind === 0 ? (v) => buff.clone().lerp(dark, 0.62 * bar(v[0], 42)).lerp(orange, sstep(-0.34, -0.17, v[0]) * 0.75) : kind === 2 ? (v) => white.clone().lerp(black, 0.2 * bar(v[0] + v[2], 60)) : (v) => brown.clone().lerp(dark, 0.45 * bar(v[0], 46));
  tailFeather(b, -0.16, 0.025, tl, 0.05, 0.016, 0.04, 0.06, tcol); tailFeather(b, -0.16, 0.02, tl * 0.92, 0.046, 0.014, -0.05, 0.05, tcol);
  for (const sgn of [-1, 1]) {
    const cc = kind === 0 ? (v) => orange.clone().lerp(red, sstep(-0.3, -0.42, v[0])) : kind === 2 ? () => white : tcol;
    tailFeather(b, -0.15, 0.03, tl * 0.48, 0.04, 0.012, sgn * 0.3, 0.03, cc);
    tailFeather(b, -0.14, 0.035, tl * 0.3, 0.04, 0.014, sgn * 0.62, 0.02, cc);
  }
  for (const s of [-1, 1]) {
    const o = { zr: 0.07, xl: 0.13, sweep: 0.08, span: 0.27, chord: 0.24, camber: 0.034, y: 0.035, nPrim: 6, primLen: 0.24, primW: 0.062 };
    if (kind === 0) { o.colLead = (v) => C('#7a1c12').lerp(blue, sstep(0.16, 0.24, Math.abs(v[2]))); o.colTrail = (v) => blue.clone().lerp(brown, sstep(0.14, 0.3, Math.abs(v[2]))); o.colPrim = (v, f) => brown.clone().lerp(buff, 0.55 * bar(v[0] * 0.7 + Math.abs(v[2]), 60)).lerp(dark, 0.25 * f); }
    else if (kind === 2) { o.colLead = () => white; o.colTrail = (v) => white.clone().lerp(black, 0.2 * bar(v[0] + Math.abs(v[2]), 70)); o.colPrim = (v) => white.clone().lerp(black, sstep(0.36, 0.52, Math.abs(v[2])) * 0.75); }
    else { o.colLead = mottle; o.colTrail = mottle; o.colPrim = (v) => brown.clone().lerp(tan, 0.5 * bar(v[0] * 0.7 + Math.abs(v[2]), 60)); }
    wingOn(b, s, o);
  }
  return b.build();
}

// red-billed blue magpie flying toward +X: cobalt above, white below, black hood with a pale nape, red bill, and the
// long graduated tail, every feather tipped white
function magpieGeometry() {
  const b = builder();
  const cob = C('#4a84f2'), cobD = C('#2f62d8'), white = C('#eef2f6'), black = C('#12151f'), redB = C('#f04030'), nape = C('#d3e0f2');
  b.blob([0, 0, 0], [0.12, 0.052, 0.05], (v) => (v[1] < -0.008 ? white : cob), 10, 7);
  b.blob([0.105, 0.012, 0], [0.058, 0.048, 0.045], (v) => (v[1] < -0.012 && v[0] < 0.1 ? white : black), 8, 6);
  b.blob([0.15, 0.03, 0], [0.046, 0.04, 0.038], (v) => (v[0] < 0.145 && v[1] > 0.045 ? nape : black), 8, 6);
  b.limb([0.185, 0.028, 0], [0.245, 0.016, 0], 0.014, 0.004, redB);
  const tip = (len) => (v) => { const t = clamp((-0.1 - v[0]) / len, 0, 1.2); return t > 0.86 ? white : t > 0.72 ? black : cob.clone().lerp(cobD, 0.4 * t); };
  tailFeather(b, -0.1, 0.01, 0.46, 0.02, 0.03, 0.0, 0.02, tip(0.46));
  for (const sgn of [-1, 1]) {
    tailFeather(b, -0.1, 0.006, 0.33, 0.018, 0.026, sgn * 0.13, 0.012, tip(0.325));
    tailFeather(b, -0.1, 0.002, 0.22, 0.018, 0.024, sgn * 0.27, 0.008, tip(0.21));
  }
  for (const s of [-1, 1]) wingOn(b, s, { zr: 0.04, xl: 0.085, sweep: 0.045, span: 0.15, chord: 0.14, camber: 0.02, y: 0.02, nPrim: 5, primLen: 0.15, primW: 0.04,
    colLead: () => cob, colTrail: (v) => cob.clone().lerp(cobD, sstep(0.08, 0.2, Math.abs(v[2]))), colPrim: (v) => (Math.abs(v[2]) > 0.275 ? white : cobD) });
  return b.build();
}

// lit, fogged, rim-lit vertex-colour material shared by monkeys, panda and pheasants
function critterMaterial(o = {}) {
  return new THREE.ShaderMaterial({
    fog: true, lights: true, side: THREE.DoubleSide,
    uniforms: { ...lightU(), ...fogU(), uTime: o.time, uSunGain: o.U.uSunGain, uSunTint: o.U.uSunTint,
      uFlap: { value: new THREE.Vector2(0, 0) }, uTail: { value: new THREE.Vector4(0, 0, 0, 0) }, uLit: { value: o.lit ?? 0.5 }, uAmb: { value: o.amb ?? 1 }, uFur: { value: o.fur ?? 0.35 }, uWarm: { value: o.warm ?? 0 }, uRim: { value: C(o.rim || '#E3912B') } },
    vertexShader: /* glsl */`
      attribute vec3 aCol; attribute vec2 aW;
      uniform float uTime; uniform vec2 uFlap; uniform vec4 uTail;
      varying vec3 vN, vV, vC, vO; varying float vSm;
      #include <fog_pars_vertex>
      void main(){
        vec3 p = position; vO = position; vSm = aW.y;
        float a = uFlap.y*sin(uFlap.x - abs(aW.y)*1.4);
        p.z += aW.y*(cos(a) - 1.0); p.y += abs(aW.y)*sin(a);
        float tw = aW.x*aW.x;
        p += uTail.xyz*(tw*uTail.w) + vec3(0.0, sin(uTime*7.0 + aW.x*5.0 + position.z*9.0), cos(uTime*6.1 + aW.x*4.0))*(0.07*tw*(0.4 + uTail.w));
        vec4 mvPosition = modelViewMatrix*vec4(p, 1.0);
        vN = normalize(normalMatrix*normal); vV = mvPosition.xyz; vC = aCol;
        gl_Position = projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform float uLit, uAmb, uFur, uWarm; uniform vec3 uRim;
      varying vec3 vN, vV, vC, vO; varying float vSm;
      #include <fog_pars_fragment>
      ${GLSL_LIGHT}
      ${GLSL_FUR}
      void main(){
        vec3 V = normalize(-vV), L = bsSunDir();
        vec3 N = normalize(vN); N = faceforward(N, -V, N);
        float wrap = dot(N, L)*0.5 + 0.5, ndl = max(dot(N, L), 0.0);
        float rim = 1.0 - clamp(dot(N, V), 0.0, 1.0); rim = rim*rim;
        float skyUp = 0.5 + 0.5*dot(N, normalize(mat3(viewMatrix)*vec3(0.0, 1.0, 0.0)));
        vec3 sun = bsSunCol()*uLit;
        vec3 up = bsAmb(vec3(0.0, 1.0, 0.0));
        // a lit side and a shaded side, a dark underside, and a warm rim against the depth behind
        float fur = bsNoise(vO.xy*vec2(26.0, 70.0) + vO.z*31.0)*0.6 + bsNoise(vO.zy*vec2(60.0, 150.0))*0.4;       // combed fur (or the grain of feathers)
        vec3 alb = vC*mix(1.0, 0.6 + 0.7*fur, uFur);
        alb = mix(alb, vec3(dot(alb, vec3(0.3, 0.55, 0.15)))*vec3(0.95, 0.9, 1.0), 0.16*uFur*(1.0 - ndl));                 // fur loses its orange on the shaded side
        vec3 col = alb*((bsAmb(N)*(0.3 + 0.75*skyUp*skyUp)*mix(1.0, 0.78, uFur) + up*0.1)*uAmb + sun*(0.8*ndl + 0.3*wrap*wrap*mix(1.0, 0.55, uFur))) + mix(uRim, vC, 0.4)*(up*0.4 + sun*0.55)*rim*(0.3 + 0.7*skyUp)*mix(1.0, 0.33 + 0.44*fur, uFur);
        // the troop (uFur = 1): modelled by the light, a sun side and a brown shade side, bare blue faces and dark hands
        if (uFur > 0.9) col = bsFurW(vC*mix(0.68, 0.86, uWarm), N, V, L, normalize(mat3(viewMatrix)*vec3(0.0, 1.0, 0.0)), fur, uLit, uAmb, mix(uRim, vec3(1.0, 0.92, 0.75), 0.55), 1.0 - clamp(vSm, 0.0, 1.0), uWarm);
        gl_FragColor = vec4(col, 1.0);
        #include <fog_fragment>
      }`,
  });
}

function mergeBuilt(list) {
  const hasN = list.every((g) => g.attributes.normal); let nv = 0, ni = 0;
  for (const g of list) { nv += g.attributes.position.count; ni += g.index.count; }
  const P = new Float32Array(nv * 3), Nn = hasN ? new Float32Array(nv * 3) : null, Cc = new Float32Array(nv * 3), W = new Float32Array(nv * 2), I = new Uint32Array(ni);
  let o = 0, io = 0;
  for (const g of list) {
    const a = g.attributes, ix = g.index.array, n = g.index.count;
    P.set(a.position.array, o * 3); if (hasN) Nn.set(a.normal.array, o * 3); Cc.set(a.aCol.array, o * 3); W.set(a.aW.array, o * 2);
    for (let k = 0; k < n; k++) I[io + k] = o + ix[k];
    o += a.position.count; io += n;
    g.dispose();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(P, 3));
  g.setAttribute('aCol', new THREE.BufferAttribute(Cc, 3));
  g.setAttribute('aW', new THREE.BufferAttribute(W, 2));
  g.setIndex(new THREE.BufferAttribute(I, 1));
  if (hasN) g.setAttribute('normal', new THREE.BufferAttribute(Nn, 3)); else g.computeVertexNormals();
  return g;
}

// THE SWELL: a band of leaves turned to their pale undersides, 21 m deep close by, its front lying across the wind and
// running on over hill after hill (it wavers a little); another like it every 110 m behind, without end. They run
// downwind on the world's own clock (uBandDir: the centre of the great circle the fronts lie on, uBandA: the radius of
// one of them, set from the time every frame: see update()). Shared by the crown sheet and the crown tufts, so the band
// runs unbroken over both. seaBand x: the band; y: the bowed, darker crowns behind it (they are the trough the next
// front runs into). seaHeave: the crowns rise a metre ahead of the front and dip 2.5 m as it passes. A crown in the
// band is drawn as a crown: its upper, outer leaves turned pale, in the light it stands in and the haze of its
// distance; no colour is laid over the whole of it. uBreak: where the cloud has opened (centre x, z, radius, strength):
// the sun is whole there.
const SEA_BAND = /* glsl */`
  uniform float uBandA; uniform vec2 uBandDir; uniform vec4 uBreak, uBreak2;
  ${GLSL_BAND}
  vec2 seaBand(vec2 p, float dist){
    float q = bsBandQ(p, dist, uBandDir, uBandA);
    float strong = bsBandK(q);
    float dark = smoothstep(0.75, 1.5, q)*(1.0 - smoothstep(2.0, 4.6, q))*0.72;       // the crowns behind it stay bowed: darker, blue-green
    return vec2(strong, dark*(1.0 - strong));
  }
  float seaHeave(vec2 p){
    if (uBand.w <= 0.0) return 0.0;
    float sm = 21.0*bsBandQ(p, 0.0, uBandDir, uBandA);
    if (sm > 88.0 && sm < 110.0) sm -= 110.0;
    float lift = smoothstep(-20.0, -6.0, sm)*(1.0 - smoothstep(-6.0, 3.0, sm));
    float dip = smoothstep(-2.0, 9.0, sm)*exp(-max(sm - 9.0, 0.0)/26.0)*(1.0 - smoothstep(60.0, 86.0, sm));
    return uBand.w*(lift - 2.5*dip);
  }
  float seaBreak(vec2 p, float n){ return max(uBreak.w*(1.0 - smoothstep(uBreak.z*0.5, uBreak.z, length(p - uBreak.xy) + 34.0*(n - 0.5))), uBreak2.w*(1.0 - smoothstep(uBreak2.z*0.5, uBreak2.z, length(p - uBreak2.xy) + 60.0*(n - 0.5)))); }
`;

// CROWN TUFTS: the crown sea as crowns. One upright card per crown, turned to the camera, standing in the sheet: three
// rounded lobes with a ragged leafy edge (cut from the leaf-spray atlas close by), lit on the sunward shoulder and dark
// at the foot, so the hills read as tufts with blue-green gaps and a feathery skyline. Each rides the same gust as the
// sheet under it, leans downwind, and takes the swell band, the cloud and rain shadow, the snow and the flowering.
function tuftMaterial(U, X) {
  return new THREE.ShaderMaterial({
    fog: true, lights: true, side: THREE.DoubleSide,
    uniforms: { ...lightU(), ...fogU(), ...U, ...X },
    vertexShader: /* glsl */`
      attribute vec4 aT, aN;
      uniform vec4 uFlower, uRainAt; uniform vec3 uCloud;
      varying vec2 vUv; varying vec4 vK; varying vec3 vNs, vUp, vV; varying vec2 vRnd;
      #include <fog_pars_vertex>
      ${GLSL_LIGHT}
      ${GLSL_WIND}
      ${SEA_BAND}
      void main(){
        vec2 g = bsGust(aT.xz, uTime - 0.4)*uWind.z;
        float s = aT.w, yy = position.y, rnd = aN.z;
        vec3 base = vec3(aT.x, aT.y - 2.4*g.x - 0.5*g.y + seaHeave(aT.xz), aT.z);
        base.xz += uWind.xy*(g.x*2.5);
        vec2 toC = cameraPosition.xz - base.xz; toC = toC/max(length(toC), 1e-3);
        vec3 right = vec3(toC.y, 0.0, -toC.x);
        vec3 p = base + right*(position.x*s*0.62) + vec3(0.0, (yy*1.2 - 0.32)*s, 0.0);
        float sway = 0.10 + 0.34*g.x + 0.05*sin(uTime*(2.0 + rnd*2.5) + rnd*40.0);
        p.xz += uWind.xy*(yy*yy*s*sway);
        p.y -= yy*yy*s*0.14*g.x;
        vec4 mvPosition = modelViewMatrix*vec4(p, 1.0);
        vV = mvPosition.xyz;
        float dist = length(vV);
        vec3 nw = normalize(vec3(aN.x, sqrt(max(1.0 - aN.x*aN.x - aN.y*aN.y, 0.04)), aN.y));
        vNs = mat3(viewMatrix)*nw; vUp = mat3(viewMatrix)*vec3(0.0, 1.0, 0.0);
        float faceN = clamp(sqrt(g.x)*0.9 + g.y*0.12 - 0.1, 0.0, 1.0);
        float farK = smoothstep(16.0, 60.0, dist);
        vec2 sb = seaBand(aT.xz, dist);
        float face = clamp(max(faceN*(1.0 - 0.92*farK)*(1.0 - 0.8*uBand.w), sb.x), 0.0, 1.0);        // (on the crest the swell is the one pale band)
        float c0 = bsNoise(vec2(aT.x*0.8 - aT.z*0.6, aT.x*0.6 + aT.z*0.8)*0.021 + 11.0);
        float fl = uFlower.w*(1.0 - smoothstep(uFlower.z*0.6, uFlower.z, length(aT.xz - uFlower.xy) + 30.0*(c0 - 0.5)));
        fl = step(0.25 + 0.5*fract(rnd*7.0), fl)*step(rnd, 0.9);                      // a crown has flowered or it has not; a few stay green
        vec2 cq = aT.xz*0.0017 - uWind.xy*(uTime*0.03);
        float cs = smoothstep(0.36, 0.66, bsNoise(cq)*0.62 + bsNoise(cq*2.7 + 9.0)*0.38);
        float rs = uRainAt.w*(1.0 - smoothstep(uRainAt.z*0.5, uRainAt.z*1.6, length(aT.xz - uRainAt.xy)));
        float bk = seaBreak(aT.xz, c0);
        vK = vec4(face, fl, mix(mix(1.0 - 0.8*uCloud.x, 1.0, cs)*(1.0 - 0.75*rs)*(1.0 - 0.75*sb.y*farK), 1.0, bk), rs*(1.0 - bk)); vRnd = vec2(rnd, bk);
        vUv = vec2(position.x*(aN.w > 0.5 ? 1.0 : -1.0), yy);
        gl_Position = projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform sampler2D uAtlas; uniform vec3 uJade, uLime, uDeep, uCeladon, uWhite; uniform float uSnow, uYellow;
      uniform float uBreakSun;
      varying vec2 vUv; varying vec4 vK; varying vec3 vNs, vUp, vV; varying vec2 vRnd;
      #include <fog_pars_fragment>
      ${GLSL_LIGHT}
      void main(){
        vec2 c = vUv; float rnd = vRnd.x, dist = length(vV);
        float d0 = length((c - vec2(0.0, 0.6))/vec2(0.56, 0.4));
        float d1 = length((c - vec2(-0.47, 0.4))/vec2(0.5, 0.33));
        float d2 = length((c - vec2(0.47, 0.42))/vec2(0.5, 0.33));
        float d = min(d0, min(d1, d2));
        float n = bsNoise(c*vec2(4.0, 6.0) + rnd*37.0)*0.55 + bsNoise(c*vec2(11.0, 15.0) + rnd*11.0)*0.45;
        if (d + (n - 0.5)*0.7 > 0.9) discard;
        vec4 tx = texture2D(uAtlas, vec2(0.01 + (c.x*0.5 + 0.5)*0.48, 0.01 + clamp(c.y*0.9 + 0.08, 0.0, 1.0)*0.98), -0.5);
        float nearK = 1.0 - smoothstep(80.0, 210.0, dist);
        if (tx.a < 0.3 && n < 0.2 + 0.42*nearK) discard;                             // close by the lobes are leaf sprays, with gaps
        float lum = mix(0.75, max(tx.r, 0.4), nearK*step(0.3, tx.a));
        float shade = clamp(0.2 + 0.95*c.y - 0.4*d + 0.3*(n - 0.5), 0.0, 1.0);
        float face = vK.x*smoothstep(0.08, 0.62, c.y + 0.4*(n - 0.5)), fl = vK.y, sunK = vK.z;      // (the leaves that turn are the upper, outer ones: a crown in the swell is pale above, dark at its foot)
        vec3 alb = mix(uDeep*1.1, mix(uJade, uLime, clamp(0.12 + 0.36*shade + 0.25*(rnd - 0.5), 0.0, 1.0)), 0.18 + 0.82*shade)*(0.7 + 0.45*lum);
        alb = mix(alb, vec3(0.70, 0.62, 0.20)*(0.55 + 0.6*shade), uYellow*step(0.72, fract(rnd*3.7))*0.8);
        alb = mix(alb, mix(vec3(0.46, 0.34, 0.10), vec3(0.93, 0.72, 0.24), shade)*(0.75 + 0.4*n), fl);
        alb = mix(alb, mix(uCeladon, vec3(0.86, 0.80, 0.52), 0.5*fl)*(0.8 + 0.3*shade), face*0.6*(0.8 + 0.2*n));
        float sn = uSnow*smoothstep(0.42, 0.7, shade + 0.15*(n - 0.5))*(1.0 - 0.6*face);
        alb = mix(alb*mix(vec3(1.0), vec3(0.42, 0.74, 0.8), uSnow), uWhite*0.82, sn);
        vec3 N = normalize(vNs*0.75 + vUp*(0.25 + 0.5*c.y) + vec3(c.x*0.8, 0.0, 0.35));
        vec3 L = bsSunDir(), V = normalize(-vV);
        float ndl = max(dot(N, L), 0.0);
        vec3 sun = bsSunCol()*(1.0 + uBreakSun*vRnd.y), up = bsAmb(vec3(0.0, 1.0, 0.0));       // (the sun is whole where the cloud has opened)
        float tr = max(dot(V, -L), 0.0); tr = tr*tr;
        float lightK = max((0.42 + 0.8*ndl)*(1.0 + 0.3*face), 0.5*fl);
        float sunF = mix(sunK, max(sunK, 0.66), max(fl, 0.6*face));
        float sunward = smoothstep(0.3, 0.8, ndl)*(1.0 - 0.7*vK.w);
        sunF = max(sunF, 0.6*sunward);
        vec3 col = alb*(bsAmb(N)*(0.5 + 0.7*shade)*(1.0 + 0.32*face + 0.55*fl) + sun*sunF*lightK) + uLime*sun*(sunK*(0.14*tr + 0.03) + 0.07*sunward)*shade*(1.0 - fl)*(1.0 - 0.8*uSnow);
        col = mix(col, mix(uDeep, uJade, 0.3)*vec3(0.8, 1.0, 1.12)*(up*1.8 + sun*0.2), (1.0 - sunK)*0.46*(1.0 - 0.6*fl));   // cloud shadow is blue-green
        col = mix(col, vec3(dot(col, vec3(0.3, 0.5, 0.2)))*vec3(0.9, 1.0, 1.05), vK.w*0.3);
        col = mix(col, col*vec3(0.78, 0.98, 1.2), 0.6*smoothstep(260.0, 1500.0, dist));
        #ifdef USE_FOG
          col = mix(col, fogColor*vec3(0.8, 0.96, 1.12), 0.56*smoothstep(170.0, 1300.0, dist));
        #endif
       
        gl_FragColor = vec4(col, 1.0);
        #include <fog_fragment>
      }`,
  });
}

// THE CROWN SEA: one sheet at terrain + 19 m over the whole world, double sided. From below it is the leaf ceiling
// (gaps widen with each gust, torn open by the parting); from above it is the sea of crowns: swells of pale
// undersides running downwind, sliding cloud shadow, rain shadow under the curtain.
function seaMaterial(U, X) {
  return new THREE.ShaderMaterial({
    fog: true, lights: true, side: THREE.DoubleSide,
    uniforms: { ...lightU(), ...fogU(), ...U, ...X },
    vertexShader: /* glsl */`
      attribute float aBump; uniform float uRidgeK;
      varying vec3 vP, vV, vNw;
      #include <fog_pars_vertex>
      ${GLSL_WIND}
      ${SEA_BAND}
      void main(){
        vec2 g = bsGust(position.xz, uTime - 0.4)*uWind.z;
        vec3 pt = bsPart(position.xz, 1.0);
        vec3 p = position;
        p.y -= 2.4*g.x + 0.5*g.y + 3.0*pt.z + aBump*(1.0 - uRidgeK) - seaHeave(position.xz);
        p.xz += uWind.xy*(g.x*2.5) + pt.xy*(pt.z*5.0);
        vP = position; vNw = normal;
        vec4 mvPosition = modelViewMatrix*vec4(p, 1.0);
        vV = mvPosition.xyz;
        gl_Position = projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uJade, uLime, uDeep, uCeladon, uWhite;
      uniform float uSnow, uYellow;
      uniform sampler2D uAtlas;
      uniform vec4 uFlower, uRainAt;
      uniform vec3 uCloud; uniform vec2 uSunH; uniform float uBreakSun, uAir;
      varying vec3 vP, vV, vNw;
      #include <fog_pars_fragment>
      ${GLSL_LIGHT}
      ${GLSL_WIND}
      ${SEA_BAND}
      // crowns as jittered cells (no grid to show): x distance to the nearest crown centre, y how far this point is on
      // the sun's side of it, z a tone per crown
      vec2 seaH2(vec2 p){ vec3 a = fract(vec3(p.xyx)*vec3(0.1031, 0.1030, 0.0973)); a += dot(a, a.yzx + 33.33); return fract((a.xx + a.yz)*a.zy); }
      vec3 seaCells(vec2 p, vec2 sunH){
        vec2 i = floor(p), f = fract(p), best = vec2(0.0); float d = 8.0, id = 0.0;
        for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
          vec2 o = vec2(float(x), float(y)), h = seaH2(i + o), r = o + 0.12 + 0.76*h - f; float dd = dot(r, r);
          if (dd < d) { d = dd; best = r; id = h.y; }
        }
        return vec3(sqrt(d), -dot(best, sunH), id);
      }
      // screen derivatives run away (to infinity or not-a-number) on a triangle seen exactly edge-on: keep them finite,
      // or the mip choice fails and the pixel comes out black (the bar under the V)
      vec2 seaD(vec2 d){ return clamp(d, vec2(-4.0), vec2(4.0)); }
      void main(){
        float dist = length(vV);
        vec2 g = bsGust(vP.xz, uTime - 0.4)*uWind.z;
        vec3 pt = bsPart(vP.xz, 1.0);
        vec2 q = vP.xz - uWind.xy*(g.x*1.5);
        float f = bsNoise(q*0.33)*0.42 + bsNoise(q*0.9 + 7.0)*0.28 + bsNoise(q*2.6)*0.17 + bsNoise(q*7.0)*0.13;
        float thr = 0.34 + 0.16*g.x + 1.3*pt.z + 0.45*bsGlade(vP.xz);
        float c00 = bsNoise(vec2(q.x*0.8 - q.y*0.6, q.x*0.6 + q.y*0.8)*0.021 + 11.0);
        float bk = seaBreak(vP.xz, c00);
        vec3 sun = bsSunCol()*(1.0 + uBreakSun*bk);
        vec3 up = bsAmb(vec3(0.0, 1.0, 0.0));
        vec2 ua = q*vec2(0.42, 0.21);
        vec2 ub = vec2(q.x*0.8 - q.y*0.6, q.x*0.6 + q.y*0.8)*vec2(0.36, 0.18) + vec2(0.37, 0.61);
        vec2 sc = vec2(0.48, 0.98);
        vec4 ta = textureGrad(uAtlas, fract(ua)*sc + 0.01, seaD(dFdx(ua))*sc, seaD(dFdy(ua))*sc);
        vec4 tb = textureGrad(uAtlas, fract(ub)*sc + 0.01, seaD(dFdx(ub))*sc, seaD(dFdy(ub))*sc);
        float la = max(ta.a, tb.a), lum = max(ta.r, tb.r);
        vec3 col;
        if (!gl_FrontFacing) {                                  // the ceiling, seen from the trunk space
          float close = 1.0 - smoothstep(45.0, 120.0, dist);    // far gaps close, so no bright speckle in the fog
          if (f < thr - 0.4*(1.0 - close)) discard;
          if (f + 0.3*(bsNoise(q*0.06 + 2.0) - 0.5) < thr + 0.8*(1.0 - smoothstep(34.0, 64.0, dist))) discard;   // overhead the real sprays are the canopy: the sheet only closes the distance
          if (la < mix(0.0, mix(0.34, 0.14, smoothstep(20.0, 60.0, dist)), close)) discard;
          float body = smoothstep(thr, thr + 0.2, f);
          float lit = bsNoise(q*0.21 + 3.0);
          col = mix(uDeep*0.7, uJade*0.85, body)*(0.5 + 0.6*lum)*up*0.8 + uLime*sun*(0.10 + 0.28*lit*lit)*(0.3 + 0.7*lum)*(0.5 + g.x);
          float gz = 1.0 - smoothstep(0.03, 0.24, abs(dot(normalize(mat3(viewMatrix)*normalize(vNw)), normalize(-vV))));
          col = mix(col, mix(uJade, uLime, 0.3)*(up*0.6 + sun*0.35), gz*smoothstep(25.0, 60.0, dist)*(1.0 - smoothstep(-30.0, -10.0, vP.z)));   // edge-on at the gully head it is crowns, not a dark bar
        } else {                                                // the crown sea, seen from above
          if (pt.z > 0.25 && f < thr) discard;
          float dn = 1.0 - smoothstep(50.0, 200.0, dist);
          // Looking up at a slope above us (the gully-head wall through the V, or a hill standing over the crest flight) the
          // near-field leaf sprays and their dark gaps do not hold: at that angle they crushed to a black bar under the V.
          // Such a slope takes the soft far look instead; and where it is edge-on or folded by the parting, plain leaf green.
          vec3 nomN = normalize(mat3(viewMatrix)*normalize(vNw));
          vec3 trueN = cross(clamp(dFdx(vV), vec3(-50.0), vec3(50.0)), clamp(dFdy(vV), vec3(-50.0), vec3(50.0))); trueN = trueN/max(length(trueN), 1e-9);
          float fold = 1.0 - smoothstep(0.3, 0.7, abs(dot(trueN, nomN)));
          float below = 1.0 - smoothstep(0.0, 4.0, cameraPosition.y - vP.y);
          float edgeOn = max(fold, 1.0 - smoothstep(0.04, 0.3, abs(dot(nomN, normalize(-vV)))))*below;
          // (out of the trunk space, through the open ceiling, the top of the sheet shows where the ground rises ahead: one
          // tilted cell of it hung among the crowns as a flat green pane. Down the valley from the gully head such a face is
          // the crowns standing on that rise: cut into sprays one to three metres across, each with a tone of its own)
          float trunkK = below*smoothstep(5.0, 30.0, vP.z)*(1.0 - smoothstep(120.0, 170.0, dist));
          if (0.55*bsNoise(q*0.55 + 13.0) + 0.45*bsNoise(q*1.4 + 5.0) < 0.47*trunkK) discard;
          // (and from down in the gully, the top of the sheet over the ground that rises beyond its head hung in the
          // notch as one smooth pane behind the crowns standing there. Nearer than 170 m the top of the sheet is not
          // drawn for a lens lower than it: that lens sees the crowns that stand in it, and the sky between them)
          if (gl_FrontFacing && below*(1.0 - smoothstep(5.0, 30.0, vP.z))*(1.0 - smoothstep(120.0, 170.0, dist)) > fract(sin(dot(floor(gl_FragCoord.xy), vec2(12.9898, 78.233)))*43758.5453)) discard;
          dn *= 1.0 - below;
          float fp = min(max(length(dFdx(vP.xz)), length(dFdy(vP.xz))), 400.0);                    // metres of crown sea under one pixel
          vec2 perp = vec2(-uWind.y, uWind.x);
          vec2 wq = vec2(dot(q, uWind.xy), dot(q, perp));                              // along the wind, across it
          vec2 wc = vec2(wq.x/1.6, wq.y);                                              // combed downwind
          wc += (vec2(bsNoise(wc*0.031 + 5.0), bsNoise(wc*0.031 + 31.0)) - 0.5)*10.0;
          // soft crowns: billows of warped noise at four sizes, each fading out before it is smaller than a few pixels
          // (no cell, no outline), read a second time a step toward the sun for the light on their shoulders
          vec2 sunW = vec2(dot(uSunH, uWind.xy)/1.6, dot(uSunH, perp));
          vec2 ws = wc + sunW*clamp(fp*1.5, 1.3, 9.0);
          float k1 = 1.0 - smoothstep(6.0, 18.0, fp), k2 = 1.0 - smoothstep(2.4, 7.0, fp), k3 = 1.0 - smoothstep(1.0, 3.0, fp), k4 = 1.0 - smoothstep(0.35, 1.1, fp);
          float flatK = 0.86 + 0.14*smoothstep(0.66, 0.9, normalize(vNw).y);                 // on a steep face the pattern would smear down the slope: let it go quiet there
          k2 *= flatK; k3 *= flatK; k4 *= flatK;
          float b1 = bsNoise(wc/15.0), b2 = bsNoise(wc/6.2 + 7.3 + b1*1.5), b3 = bsNoise(wc/2.7 + 3.1 + b2*1.2), b4 = bsNoise(wc/1.05 + b3);
          float s1 = bsNoise(ws/15.0), s2 = bsNoise(ws/6.2 + 7.3 + s1*1.5), s3 = bsNoise(ws/2.7 + 3.1 + s2*1.2), s4 = bsNoise(ws/1.05 + s3);
          float hgt = 0.5 + (b1 - 0.5)*0.5*k1 + (b2 - 0.5)*0.42*k2 + (b3 - 0.5)*0.34*k3 + (b4 - 0.5)*0.2*k4;
          float hgs = 0.5 + (s1 - 0.5)*0.5*k1 + (s2 - 0.5)*0.42*k2 + (s3 - 0.5)*0.34*k3 + (s4 - 0.5)*0.2*k4;
          float relief = clamp((hgt - hgs)*4.5, -1.0, 1.0);
          // feathering carried out to the middle distance: the leaf-spray atlas again, plume-sized and lying downwind
          vec2 uc = vec2(wq.y/11.0, wq.x/22.0) + (b1 - 0.5)*0.3;
          vec2 ud = vec2(wq.y*0.9 + wq.x*0.44, wq.x*0.9 - wq.y*0.44)/vec2(15.0, 30.0) + 0.37;
          vec4 tc = textureGrad(uAtlas, fract(uc)*sc + 0.01, seaD(dFdx(uc))*sc, seaD(dFdy(uc))*sc);
          vec4 td = textureGrad(uAtlas, fract(ud)*sc + 0.01, seaD(dFdx(ud))*sc, seaD(dFdy(ud))*sc);
          float fe = max(tc.a*tc.r, td.a*td.r);
          float kF = (1.0 - dn)*(1.0 - smoothstep(3.0, 9.0, fp))*flatK;
          float c0 = c00;
          float shade = clamp(0.5 + (hgt - 0.5)*1.7 + 0.3*(fe - 0.3)*kF, 0.0, 1.0);
          vec3 alb = mix(uDeep*1.1, mix(uJade, uLime, clamp(0.1 + 0.38*shade + 0.22*(c0 - 0.5), 0.0, 1.0)), 0.3 + 0.7*shade)*(0.82 + 0.25*lum*dn);
          alb = mix(alb, vec3(0.66, 0.60, 0.20), uYellow*smoothstep(0.56, 0.7, bsNoise(wc/8.0 + 40.0))*0.55*(0.4 + 0.6*shade));
          // the slope that has flowered: the same crowns gone straw-gold, a few still green among them
          float fl = uFlower.w*(1.0 - smoothstep(uFlower.z*0.6, uFlower.z, length(vP.xz - uFlower.xy) + 30.0*(c0 - 0.5)));
          fl *= 1.0 - 0.75*smoothstep(0.66, 0.8, bsNoise(wc/6.0 + 21.0))*k2;
          fl *= mix(smoothstep(0.42, 0.6, bsNoise(wc/9.0 + 3.0)), 1.0, smoothstep(0.45, 0.88, normalize(vNw).y));   // on the steep faces below it, gold stands in clumps among the green
          fl = smoothstep(0.2, 0.6, fl);                                                // gold crowns or green ones, not an olive blend of the two
          alb = mix(alb, mix(vec3(0.52, 0.40, 0.12), vec3(0.93, 0.72, 0.24), shade), fl);
          // the swell: leaves turned to their pale undersides. Close by, every swell; far off, every second one is a
          // big set that stands as one broad celadon band across ridge after ridge
          float faceN = clamp(sqrt(g.x)*(0.8 + 0.4*hgt) + g.y*0.12 - 0.1, 0.0, 1.0);
          vec2 setB = seaBand(vP.xz, dist);
          float farK = smoothstep(16.0, 60.0, dist);
          float face = clamp(max(faceN*(1.0 - 0.92*farK)*(1.0 - 0.8*uBand.w), setB.x*(0.92 + 0.5*(hgt - 0.5) + 0.25*(fe - 0.3)*kF)), 0.0, 1.0);
          alb = mix(alb, bsBandHue(uCeladon)*(0.3 + 0.1*shade), face*0.7);
          // wet snow lies on the crown tops only; the gaps between them stay blue-green
          float snowH = 0.5 + (b1 - 0.5)*0.8*k1 + (b2 - 0.5)*0.6*k2 + (b3 - 0.5)*0.25*k3;
          float sn = uSnow*smoothstep(0.44, 0.6, snowH + 0.1*(lum - 0.5)*dn)*(1.0 - 0.7*face);
          alb = mix(alb*mix(vec3(1.0), vec3(0.42, 0.74, 0.8), uSnow), uWhite*0.82, sn);
          alb *= mix(1.0, 0.3 + 0.7*smoothstep(0.44, 0.62, hgt), uSnow*(1.0 - 0.6*face));   // the hollows between the loaded crowns stay in shadow
          vec3 Nw = normalize(vNw + vec3(uWind.x, 0.0, uWind.y)*(g.x*0.35));
          vec3 N = normalize(mat3(viewMatrix)*Nw), L = bsSunDir(), V = normalize(-vV);
          float ndl = max(dot(N, L), 0.0);
          vec2 cq = vP.xz*0.0017 - uWind.xy*(uTime*0.03);
          float cs = smoothstep(0.36, 0.66, bsNoise(cq)*0.62 + bsNoise(cq*2.7 + 9.0)*0.38);
          float rs = uRainAt.w*(1.0 - smoothstep(uRainAt.z*0.5, uRainAt.z*1.6, length(vP.xz - uRainAt.xy)));
          rs *= 1.0 - bk;
          float sunK = mix(mix(1.0 - uCloud.x, 1.0, cs)*(1.0 - 0.75*rs)*(1.0 - 0.75*setB.y*farK), 1.0, bk);
          float tr = max(dot(V, -L), 0.0); tr = tr*tr;
          float lightK = clamp(0.45 + 0.6*ndl + relief*0.5*(1.0 - 0.6*face), 0.1, 1.5)*(1.0 + 0.65*face);
          lightK = max(lightK, 0.5*fl*(1.0 - face));                                              // the flowered crowns stay straw-gold on their shaded faces, never earth-brown
          float sunF = mix(sunK, max(sunK, 0.66), max(fl, 0.6*face));                     // straw and turned leaves stay pale under a cloud
          col = alb*(bsAmb(N)*(0.5 + 0.55*shade)*(1.0 + 0.65*face + 0.6*fl) + sun*sunF*lightK) + uLime*sun*sunK*(0.12*tr + 0.04)*shade*(1.0 - fl)*(1.0 - 0.8*uSnow);
          col = mix(col, mix(uDeep, uJade, 0.22)*vec3(0.8, 1.0, 1.12)*(up*1.6 + sun*0.15), (1.0 - sunK)*0.55*(1.0 - 0.6*fl));                // cloud shadow is blue-green
          col = mix(col, mix(mix(uDeep*up*0.45, mix(uDeep, uJade, 0.4)*up*0.9, uSnow), col*1.25, smoothstep(0.08, 0.5, la)*(0.45 + 0.75*lum)), dn*0.85);
          float gap = (1.0 - smoothstep(thr - 0.1, thr + 0.06, f))*(1.0 - smoothstep(50.0, 150.0, dist));
          col = mix(col, mix(uDeep, uJade, 0.3)*up*0.8, 0.6*gap*(1.0 - below));
          col = mix(col, mix(uJade, uLime, 0.3)*(up*0.6 + sun*0.35), edgeOn*(1.0 - smoothstep(60.0, 110.0, dist)));
          col *= mix(1.0, 0.42 + 0.95*bsNoise(q*0.8 + 41.0), trunkK);
          // where the crown tufts stand (40 to 760 m out) the sheet is only what shows between them: the shade down among
          // the crowns, blue-green, paler in a swell band, straw-brown on the flowered slope
          float kT = smoothstep(3.0, 10.0, dist)*(1.0 - smoothstep(700.0, 860.0, dist))*(1.0 - below);
          float farG = smoothstep(40.0, 130.0, dist);                                    // close under the lens the gaps stay dark whatever the swell does
          vec3 gapC = mix(uDeep, uJade, 0.34 + 0.3*shade)*vec3(0.85, 1.0, 1.1)*(up*(1.25 + 0.5*face*farG) + sun*sunK*(0.1 + 0.12*shade));
          gapC = mix(gapC, vec3(0.5, 0.38, 0.12)*(up*1.1 + sun*sunF*0.3), fl*0.75);
          col = mix(col, gapC, kT*mix(0.93, 0.8, farG));
          col = mix(col, vec3(dot(col, vec3(0.3, 0.5, 0.2)))*vec3(0.9, 1.0, 1.05), rs*0.3);
          col = mix(col, col*vec3(0.78, 0.98, 1.2), 0.6*smoothstep(260.0, 1500.0, dist));
        #ifdef USE_FOG
          col = mix(col, fogColor*vec3(0.8, 0.96, 1.12), 0.56*smoothstep(170.0, 1300.0, dist));
        #endif
                   // ridge behind ridge, each bluer
        }
        if (!(col.r + col.g + col.b < 40.0)) col = mix(uJade, uLime, 0.3)*(up*0.6 + sun*0.35);   // anything not finite becomes plain leaf green
        gl_FragColor = vec4(col, 1.0);
        // Under the canopy the fog-coloured skirt closes the distance, to 25 m over the lens at 172 m. Once it is off
        // (uAir > 0: the air clearing on the climb) land that stands higher than the skirt did, and that the fog still
        // takes whole, would be a flat fog-coloured pane against the sky: it is not drawn until the fog lets it show.
        #ifdef USE_FOG
        {
          float hzD = clamp(fogDensity*vFogDepth, 0.0, 6.0), hzK = 1.0 - exp(-hzD*hzD);
          float tanE = (vP.y - cameraPosition.y)/max(length(vP.xz - cameraPosition.xz), 1.0);
          float skyK = smoothstep(0.145, 0.2, tanE)*step(0.0001, uAir);
          float hzH = fract(sin(dot(floor(gl_FragCoord.xy), vec2(12.9898, 78.233)))*43758.5453);
          if (hzK > 0.9 + 0.1*hzH + 0.2*smoothstep(0.6, 1.0, uAir) + 2.0*(1.0 - skyK)) discard;
        }
        #endif
        #include <fog_fragment>
      }`,
  });
}

// SANDSTONE under the canopy: red-brown beds of uneven thickness with a dark seam under each, thin laminations, upright
// joints broken at every bed, pale lichen, a moss cap that hangs a little way over every edge, and a wet dark foot where
// it stands in water. Lit like the forest floor: the trunk-space fill, and the sun wherever a gust or a glade lets it in.
function rockMaterial(U) {
  return new THREE.ShaderMaterial({
    fog: true, lights: true, side: THREE.DoubleSide,
    uniforms: { ...lightU(), ...fogU(), ...U },
    vertexShader: /* glsl */`
      attribute vec4 aK;
      varying vec3 vP, vN, vNw, vV; varying vec4 vK; varying vec2 vG;
      #include <fog_pars_vertex>
      ${GLSL_WIND}
      void main(){
        vP = position; vNw = normal; vN = normalize(normalMatrix*normal); vK = aK;
        vG = bsGust(position.xz, uTime - 0.6) + vec2(bsPart(position.xz, 1.0).z, 0.0);
        vec4 mvPosition = modelViewMatrix*vec4(position, 1.0);
        vV = mvPosition.xyz;
        gl_Position = projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uJade, uLime, uDeep, uWhite; uniform vec2 uFill; uniform float uSnow;
      varying vec3 vP, vN, vNw, vV; varying vec4 vK; varying vec2 vG;
      #include <fog_pars_fragment>
      ${GLSL_LIGHT}
      ${GLSL_WIND}
      void main(){
        float rnd = step(1.5, vK.x), seed = vK.x - 2.0*rnd, hgt = vK.y, wet = vK.z, by = vP.y - vK.w;          // by: height in the block's own (untilted) beds; rnd: a weathered boulder
        // the face as it is cut: flat faces meeting at true corners (the joints of the rock), softened only on top
        vec3 fN = normalize(cross(dFdx(vP), dFdy(vP)) + vec3(0.0, 1e-7, 0.0));
        if (dot(fN, cameraPosition - vP) < 0.0) fN = -fN;
        vec3 sN = normalize(vNw); if (dot(sN, fN) < 0.0) sN = -sN;
        // (the faces are bumped a little, so the two triangles of every quad lie in different planes: lit by the cut face
        // they showed as a mosaic. The light, the bedding and the moss go by the smooth normal; the cut face only sharpens it)
        vec3 Nw = normalize(mix(fN, sN, max(max(0.88, 0.92*wet), 0.95*rnd)));
        float up = Nw.y, top = smoothstep(0.62, 0.8, Nw.y)*(1.0 - rnd);
        vec2 hz = normalize(sN.xz + vec2(1e-4, 0.0));
        float along = mix(dot(vP.xz, vec2(-hz.y, hz.x)), vP.x*0.8 + vP.z*0.6, top);                 // metres along the face
        float across = mix(by, vP.z*0.8 - vP.x*0.6, top);
        float n1 = bsNoise(vec2(along*0.45 + seed*31.0, across*0.5)), n2 = bsNoise(vec2(along*1.7, across*2.1 + seed*7.0)), n3 = bsNoise(vec2(along*6.0, across*7.0) + 3.0), n4 = bsNoise(vP.xz*9.0 + vP.y*5.0);
        float bed = by*1.2 + 0.4*sin(by*2.3 + seed*20.0) + 0.07*sin(by*6.1 + seed*5.0) + (n1 - 0.5)*0.7*(1.0 - top) + seed*13.0;   // beds from a hand's breadth to over a metre
        float bi = floor(bed), bf = fract(bed);
        float bt = bsHash(vec2(bi*1.31, seed*7.7 + 0.3)), bt2 = bsHash(vec2(bi*2.17 + 5.0, seed*3.1));
        float seam = (1.0 - smoothstep(0.0, 0.05 + 0.08*bt2, bf))*(0.45 + 0.55*n2)*(1.0 - top)*(0.1 + 0.9*step(0.66, bt2))*(1.0 - 0.8*rnd);   // a few seams open, most only a line
        float lam = 0.5 + 0.5*sin(bed*31.0 + n2*4.0);
        vec3 rock = mix(vec3(0.235, 0.105, 0.072), vec3(0.4, 0.215, 0.145), clamp(0.27 + bt*0.17 + 0.5*n1, 0.0, 1.0));       // dark red-brown to a duller red-brown, bed by bed and in drifts across them
        rock = mix(rock, vec3(0.3, 0.245, 0.215), 0.32*smoothstep(0.5, 0.85, n1*0.8 + bt2*0.3));                   // a few greyer weathered beds
        rock *= (0.84 + 0.22*n3)*(0.84 + 0.24*lam*n2*(1.0 - top)*(1.0 - rnd))*(0.9 + 0.2*n4)*(1.0 - 0.6*seam);
        // upright joints: two or three to a face, each running on through four or five beds before it steps aside
        float bj = floor(bed*0.22 + 0.5*bsNoise(vec2(along*0.2, seed*9.0)));
        float jx = along*0.21 + bsHash(vec2(bj*1.7 + 2.0, seed*3.3))*5.0 + seed*9.0 + 0.34*(n1 - 0.5) + 0.04*(n2 - 0.5);
        float jl = (1.0 - smoothstep(0.004, 0.022, abs(fract(jx) - 0.5)))*step(0.42, bsHash(vec2(floor(jx), bj + seed*5.0)));
        float joint = max(jl, 0.3*smoothstep(0.88, 0.97, bsNoise(vec2(along*1.1 + bj*5.3 + seed*17.0, bj*0.7 + by*0.15))))*(1.0 - top)*(1.0 - rnd);
        rock *= 1.0 - 0.62*joint;
        // runoff: dark streaks down the face from the lip, across every bed
        float pool = bsGlade(vP.xz + (vec2(n2, n4) - 0.5)*1.2);                 // where a shaft stands on the stone
        float streak = smoothstep(0.5, 0.8, bsNoise(vec2(along*1.7 + seed*41.0, by*0.12))*0.62 + bsNoise(vec2(along*5.1 + 3.0, by*0.3))*0.38)*(1.0 - top);
        streak *= 0.4 + 0.6*bsNoise(vec2(along*0.6 + 7.0, by*0.5 + seed*3.0));
        rock = mix(rock, rock*vec3(0.4, 0.43, 0.5), (0.75 - 0.3*pool)*streak);
        float lichen = smoothstep(0.62 - 0.12*rnd, 0.8, bsNoise(vec2(along*2.3 + 9.0, across*2.6 + seed*5.0))*0.7 + n3*0.3)*(1.0 - 0.6*top);
        rock = mix(rock, vec3(0.43, 0.48, 0.40)*(0.7 + 0.4*n4), lichen*0.5*(1.0 - wet));
        // a bedding plane laid bare on top: paler, pitted, cracked along its own joints, a few fallen leaves on it
        float ck = bsNoise(vP.xz*0.85 + seed*19.0), ck2 = bsNoise(vP.xz*2.1 + 7.0);
        float crack = (1.0 - smoothstep(0.0, 0.03, abs(ck - 0.5)))*0.8 + (1.0 - smoothstep(0.0, 0.05, abs(ck2 - 0.5)))*0.35;
        vec3 plane = mix(rock, vec3(0.43, 0.33, 0.26), 0.45)*(0.8 + 0.3*n3)*(1.0 - 0.6*min(crack, 1.0));
        plane = mix(plane, vec3(0.5, 0.42, 0.22), smoothstep(0.8, 0.86, bsNoise(vP.xz*6.5 + 2.0))*0.7);
        rock = mix(rock, plane*(1.0 + 0.35*wet), top);
        // a stone standing in the stream: pitted and stained, algae in the pits
        float pit = bsNoise(vP.xz*11.0 + vP.y*7.0)*0.6 + bsNoise(vP.zy*23.0 + vP.x*13.0)*0.4;
        rock *= mix(1.0, 0.6 + 0.75*pit, wet*0.8);
        rock = mix(rock, vec3(0.15, 0.2, 0.11), wet*0.6*smoothstep(0.5, 0.72, bsNoise(vP.xz*3.1 + seed*31.0)*0.7 + 0.3*pit));
        float damp = (1.0 - smoothstep(0.1, 1.5, hgt + (n2 - 0.5)*0.8))*(0.45 + 0.5*wet);
        rock *= 1.0 - 0.55*damp;                                              // dark and wet toward the foot
        // moss in patches: cushions on part of what faces up (the rest is bare bedding plane), hanging a little way over
        // the edges, and creeping along the seams and down the damp foot
        float pn = bsNoise(vP.xz*0.5 + seed*23.0)*0.62 + bsNoise(vP.xz*1.6 + 4.0)*0.38;
        float patchK = smoothstep(0.37, 0.5, pn + 0.16*(1.0 - smoothstep(0.2, 1.4, hgt))*(1.0 - wet) + 0.06*(n3 - 0.5) + 0.16*pool);
        float mossK = smoothstep(0.2, 0.64, up + 0.45*(n2 - 0.5) + 0.3*(n1 - 0.5))*patchK;
        mossK = max(mossK, rnd*smoothstep(-0.05, 0.5, up + 0.6*(n2 - 0.5) + 0.4*(n1 - 0.5))*(0.8 + 0.2*patchK));       // a boulder's cap of moss, hanging down its sides
        mossK = max(mossK, 0.7*pool*(1.0 - wet)*smoothstep(0.3, 0.62, n2*0.55 + n1*0.45)*smoothstep(0.45, 0.8, up));     // thicker on the tops a shaft stands on
        mossK = max(mossK, smoothstep(0.55, 0.9, n2*0.6 + n1*0.5 + 0.5*seam)*smoothstep(-0.2, 0.25, up)*0.75*(1.0 - 0.5*wet)*(0.35 + 0.65*patchK));
        vec3 moss = mix(uDeep*0.95, mix(uJade, uLime, 0.42)*0.8, clamp(n3*0.55 + n4*0.45 + 0.2*(n1 - 0.5), 0.0, 1.0))*(0.75 + 0.5*n2);
        vec2 dq = vP.xz - uWind.xy*uTime*3.0;
        float dap = smoothstep(0.35, 0.75, bsNoise(dq*0.16)*0.6 + bsNoise(dq*0.5)*0.4);
        float gst = max(vG.x, pool);
        float open = uFill.x*(0.45 + 1.1*dap) + 0.7*smoothstep(0.05, 0.7, gst)*(0.08 + 0.92*dap);
        open = max(open, pool*(0.6 + 0.4*dap));
        open = max(open, bsPartLit(vP.xz)*(0.3 + 0.3*dap));
        open = mix(open, 1.0, smoothstep(15.0, 21.0, hgt));                   // a rock that stands out of the crown sea is in the open
        // moss lies on what faces up. A face that the light stands on shows its stone: red-brown, bed over bed
        float litK = smoothstep(0.1, 0.55, open), faceK = 1.0 - smoothstep(0.35, 0.7, up);
        mossK *= 1.0 - 0.75*litK*faceK*(1.0 - rnd);
        rock = mix(rock, rock*vec3(1.3, 1.02, 0.86), 0.7*litK*faceK);
        vec3 alb = mix(rock, moss, mossK);
        alb = mix(alb, uWhite*0.78, uSnow*smoothstep(0.6, 0.85, up)*0.6);
        vec3 N = normalize(mat3(viewMatrix)*Nw), V = normalize(-vV);
        vec3 L = bsSunDir();
        float ndl = max(dot(N, L), 0.0);
        float ao = (0.5 + 0.5*smoothstep(-0.2, 1.6, hgt))*(1.0 - 0.45*seam)*(0.72 + 0.28*smoothstep(-0.6, 0.6, up))*(1.0 - 0.3*joint);
        vec3 sc = bsSunCol(); sc = mix(sc, vec3(dot(sc, vec3(0.3, 0.55, 0.15)))*vec3(0.94, 1.0, 0.9), 0.45);            // (the light on stone comes through leaves: it has lost most of its gold)
        vec3 sun = sc*mix(vec3(1.0), uLime*1.9, 0.45 - 0.27*faceK)*open*(0.22 + 0.78*ndl)*(1.0 + 0.35*faceK);
        vec3 upA = bsAmb(vec3(0.0, 1.0, 0.0));
        vec3 col = alb*((bsAmb(N)*1.15 + (uJade*0.8 + uLime*0.2)*upA*0.45)*(uFill.y*ao) + sun) + uDeep*upA*(uFill.y*0.1);
        col += bsSunCol()*open*pow(max(dot(N, normalize(L + V + vec3(0.0, 1e-4, 0.0))), 0.0), 20.0)*0.12*(0.3 + 0.7*wet)*(1.0 - mossK);   // wet rock catches the light
        gl_FragColor = vec4(col, 1.0);
        #include <fog_fragment>
      }`,
  });
}

// TARO at the water's edge: broad heart-shaped leaves, each on its own arching stalk, the blade hanging point-down,
// veined, translucent where a shaft catches it, nodding in the gusts. list = [{ x, y, z, yaw, h, size, seed }] (one leaf each)
function taroMesh(U, list) {
  const pos = [], idx = [];
  for (let j = 0; j <= 3; j++) for (const x of [-1, 1]) pos.push(x, j / 3, 0);                 // the stalk: a ribbon of three spans
  for (let j = 0; j < 3; j++) { const a = j * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  for (let j = 0; j <= 3; j++) for (let i = 0; i <= 2; i++) pos.push(i - 1, j / 3, 1);          // the blade: 2 x 3 quads, cut to a heart in the shader
  for (let j = 0; j < 3; j++) for (let i = 0; i < 2; i++) { const a = 8 + j * 3 + i; idx.push(a, a + 1, a + 3, a + 1, a + 4, a + 3); }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
  const ip = [], il = [];
  for (const f of list) { ip.push(f.x, f.y, f.z); il.push(f.yaw, f.h, f.size, f.seed); }
  g.setAttribute('aPos', new THREE.InstancedBufferAttribute(new Float32Array(ip), 3));
  g.setAttribute('aLeaf', new THREE.InstancedBufferAttribute(new Float32Array(il), 4));
  g.instanceCount = list.length;
  const mat = new THREE.ShaderMaterial({
    fog: true, lights: true, side: THREE.DoubleSide,
    uniforms: { ...lightU(), ...fogU(), ...U },
    vertexShader: /* glsl */`
      attribute vec3 aPos; attribute vec4 aLeaf;
      varying vec3 vUv, vV, vNv; varying vec2 vF;
      #include <fog_pars_vertex>
      ${GLSL_WIND}
      void main(){
        float part = position.z, t = position.y, h = aLeaf.y, sz = aLeaf.z, seed = aLeaf.w;
        vec2 g = bsGust(aPos.xz, uTime - 0.2);
        float gg = clamp(g.x + 0.5*g.y, 0.0, 1.0)*uWind.z;
        vec3 outw = vec3(cos(aLeaf.x), 0.0, sin(aLeaf.x)), sideV = vec3(-outw.z, 0.0, outw.x);
        float nod = 0.1*sin(uTime*(1.3 + seed) + seed*40.0) + 0.35*gg;
        vec3 wnd = vec3(uWind.x, 0.0, uWind.y)*(gg*0.22*h);
        vec3 top = aPos + vec3(0.0, h*(1.0 - 0.06*nod), 0.0) + outw*(h*(0.42 + 0.1*nod)) + wnd;
        vec3 p, n;
        if (part < 0.5) {
          p = aPos + vec3(0.0, h*t*(1.0 - 0.06*nod), 0.0) + outw*(h*(0.42 + 0.1*nod)*t*t) + wnd*t*t + sideV*(position.x*0.035*(1.3 - 0.5*t));
          n = outw;
        } else {
          vec3 down = normalize(outw*(0.72 - 0.25*nod) - vec3(0.0, 0.62 + 0.3*nod, 0.0));
          n = normalize(cross(sideV, down));
          float cup = position.x*position.x;
          p = top + sideV*(position.x*0.56*sz) + down*((t - 0.24)*sz) - n*(cup*0.1*sz) + n*(sin(uTime*(2.0 + seed*2.0) + seed*20.0 + t*3.0)*(0.02 + 0.06*gg)*t*sz);
          n = normalize(n - sideV*(position.x*0.35));
        }
        vec4 mvPosition = modelViewMatrix*vec4(p, 1.0);
        vUv = vec3(position.x, t, part); vV = mvPosition.xyz; vNv = normalize(normalMatrix*n);
        vF = vec2(max(g.x, bsGlade(aPos.xz)), seed);
        gl_Position = projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uJade, uLime, uDeep, uCeladon, uWhite; uniform vec2 uFill; uniform float uSnow;
      varying vec3 vUv, vV, vNv; varying vec2 vF;
      #include <fog_pars_fragment>
      ${GLSL_LIGHT}
      void main(){
        float x = vUv.x, y = vUv.y, seed = vF.y;
        vec3 alb;
        if (vUv.z < 0.5) alb = mix(uJade, uLime, 0.35)*0.5;
        else {
          float ax = abs(x);
          float w = 0.97*pow(max(sin(3.14159*pow(clamp(y, 0.0, 1.0), 0.6)), 0.0), 0.75);       // broad at the shoulders, drawn out to a point
          float notch = (1.0 - smoothstep(0.0, 0.26, y))*0.42;                                 // the cleft between the two lobes
          if (ax > w || ax < notch*(1.0 - y/0.26)) discard;
          float rib = 1.0 - smoothstep(0.02, 0.05, ax);
          float vy = y*5.5 - ax*2.4, vein = (1.0 - smoothstep(0.04, 0.1, abs(fract(vy) - 0.5)))*smoothstep(0.24, 0.4, y)*(1.0 - smoothstep(w*0.75, w, ax));
          float edge = smoothstep(w*0.82, w, ax);
          alb = mix(uJade*0.9, mix(uJade, uLime, 0.5), 0.35 + 0.45*fract(seed*7.3))*(0.62 + 0.4*y)*(1.0 - 0.25*edge);
          alb = mix(alb, mix(uCeladon, uLime, 0.4)*0.8, max(rib, 0.7*vein)*0.7);
          alb = mix(alb, uWhite*0.75, uSnow*0.3*(1.0 - y));
        }
        vec3 N = normalize(vNv), V = normalize(-vV), L = bsSunDir(); N = faceforward(N, -V, N);
        float open = max(uFill.x + (1.0 - uFill.x)*smoothstep(0.05, 0.75, vF.x)*0.55, 0.0);
        float tr = max(dot(V, -L), 0.0); tr *= tr;
        vec3 upA = bsAmb(vec3(0.0, 1.0, 0.0))*uFill.y;
        vec3 sun = bsSunCol()*mix(vec3(1.0), uLime*1.9, 0.55)*open;
        vec3 col = alb*(upA*(0.75 + 0.6*clamp(N.y*0.0 + 0.5, 0.0, 1.0)) + bsAmb(N)*0.5*uFill.y + sun*(0.35 + 0.65*max(dot(N, L), 0.0))) + uLime*sun*(0.3*tr + 0.06)*step(0.5, vUv.z);
        gl_FragColor = vec4(col, 1.0);
        #include <fog_fragment>
      }`,
  });
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false;
  return m;
}

// the rain curtain: scrolling sheets with a soft foot, standing off to the left and marching in
function curtainMaterial(time, color) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.CustomBlending,
    blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendEquation: THREE.AddEquation,
    uniforms: { uTime: time, uColor: { value: color }, uOpacity: { value: 0.8 }, uSeed: { value: 0 } },
    vertexShader: /* glsl */`
      varying vec2 vUv;
      void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position, 1.0); }`,
    fragmentShader: /* glsl */`
      uniform float uTime, uOpacity, uSeed; uniform vec3 uColor;
      varying vec2 vUv;
      float h2(vec2 p){ p = fract(p*vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y)*p.y); }
      float n2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0 - 2.0*f);
        return mix(mix(h2(i), h2(i + vec2(1.0, 0.0)), f.x), mix(h2(i + vec2(0.0, 1.0)), h2(i + vec2(1.0, 1.0)), f.x), f.y); }
      void main(){
        float slant = vUv.x + vUv.y*0.12;
        float streak = n2(vec2(slant*90.0 + uSeed*17.0, vUv.y*3.0 + uTime*0.8))*0.55 + n2(vec2(slant*31.0 + uSeed*5.0, vUv.y*1.5 + uTime*0.45))*0.45;
        float billow = n2(vec2(vUv.x*4.0 - uTime*0.015 + uSeed*3.0, vUv.y*1.6 + uSeed));
        float sides = smoothstep(0.0, 0.3, vUv.x)*(1.0 - smoothstep(0.7, 1.0, vUv.x));
        float vert = smoothstep(0.0, 0.16, vUv.y)*(1.0 - smoothstep(0.5, 1.0, vUv.y));
        float a = sides*vert*(0.5 + 0.5*billow)*(0.55 + 0.45*streak)*uOpacity;
        gl_FragColor = vec4(uColor*(0.8 + 0.3*streak)*a, a);
      }`,
  });
}

// ---- THE SMALL BIRDS OF THE CREST: one instanced mesh a flock, every bird flown in the vertex shader ----
// A parrotbill (vinous-throated: a ball of a bird, chestnut cap and wings, buff below, a long graduated tail, a stub of
// a pale bill), flying toward +X; about 0.14 m long before the flock's scale
function parrotbillGeometry() {
  const b = builder();
  const cap = C('#8f5230'), back = C('#9c7c56'), buff = C('#d4bc98'), wing = C('#87502e'), tail = C('#765a40'), bill = C('#efe2b4'), eye = C('#14100c');
  b.blob([0, 0, 0], [0.046, 0.04, 0.04], (v) => (v[1] < -0.006 ? buff : back), 7, 5);
  b.blob([0.047, 0.02, 0], [0.031, 0.03, 0.03], (v) => (v[1] > 0.022 || v[0] < 0.04 ? cap : buff.clone().lerp(cap, 0.35)), 7, 5);
  b.quad([[[0.07, 0.03, 0.007], [0.07, 0.03, -0.007]], [[0.092, 0.02, 0.003], [0.092, 0.02, -0.003]]], bill);
  b.quad([[[0.07, 0.014, 0.007], [0.07, 0.014, -0.007]], [[0.092, 0.02, 0.003], [0.092, 0.02, -0.003]]], bill);
  for (const s of [-1, 1]) b.quad([[[0.066, 0.034, s * 0.022], [0.058, 0.034, s * 0.024]], [[0.066, 0.026, s * 0.024], [0.058, 0.026, s * 0.026]]], eye);
  // the tail: a long ridged strip, graduated (two shorter feathers splayed beside the middle pair)
  const tw = (v) => [clamp((-0.03 - v[0]) / 0.09, 0, 1), 0];
  b.quad([[[-0.03, 0.006, 0.012], [-0.03, 0.006, -0.012]], [[-0.075, 0.012, 0.014], [-0.075, 0.012, -0.014]], [[-0.118, 0.004, 0.008], [-0.118, 0.004, -0.008]]], tail, tw);
  for (const s of [-1, 1]) b.quad([[[-0.03, 0.003, s * 0.006], [-0.03, 0.003, s * 0.02]], [[-0.092, 0.004, s * 0.012], [-0.088, 0.004, s * 0.03]]], tail.clone().lerp(back, 0.3), tw);
  // short round wings, beating too fast to see: each is drawn three times over, fanned through its stroke (the shader
  // spreads the three blades and lets half of each through, so a wing is a pale whirr; aW.x = -1, -2, -3 names the blade)
  const pale = C('#e6d2b0');
  for (const s of [-1, 1]) for (let bl = 1; bl <= 3; bl++) {
    const wf = (v) => [-bl, s * Math.max(Math.abs(v[2]) - 0.03, 0)];
    b.quad([[[0.03, 0.012, s * 0.03], [-0.03, 0.01, s * 0.03]], [[0.022, 0.016, s * 0.062], [-0.036, 0.012, s * 0.06]], [[0.004, 0.014, s * 0.088], [-0.04, 0.012, s * 0.082]], [[-0.012, 0.012, s * 0.106], [-0.036, 0.011, s * 0.098]]], (v) => wing.clone().lerp(pale, 0.75 * sstep(0.035, 0.085, Math.abs(v[2]))), wf);
  }
  return b.build();
}
// A Pacific swift gliding toward +X: a sooty spindle, a white rump and throat, long scythe wings swept back, a forked
// tail; about 0.18 m long, 0.44 m across the wings before the flock's scale
function swiftGeometry() {
  const b = builder();
  const soot = C('#16151a'), soot2 = C('#222027'), white = C('#d9dcde');
  b.blob([0, 0, 0], [0.085, 0.021, 0.024], (v) => (v[0] < -0.03 && v[0] > -0.062 && v[1] > -0.004 ? white : v[0] > 0.05 && v[1] < 0 ? white : soot), 7, 4);
  for (const s of [-1, 1]) {
    const wf = (v) => [0, s * Math.max(Math.abs(v[2]) - 0.02, 0)];
    const lead = [], n = 5;
    for (let i = 0; i <= n; i++) {                        // a crescent: the leading edge sweeps back in a curve, the chord tapers to a point
      const t = i / n, z = s * (0.02 + 0.2 * t), x0 = 0.035 - 0.115 * t * t, c = 0.06 * (1 - 0.82 * t) + 0.006;
      lead.push([[x0, 0.004, z], [x0 - c, 0.0, z]]);
    }
    b.quad(lead, (v) => soot.clone().lerp(soot2, sstep(0.05, 0.2, Math.abs(v[2]))), wf);
    b.quad([[[-0.07, 0.002, s * 0.004], [-0.07, 0.002, s * 0.018]], [[-0.135, 0.002, s * 0.022], [-0.125, 0.002, s * 0.03]]], soot);     // one side of the fork
  }
  return b.build();
}
// kind 0: the parrotbill cloud: birds strung out along the wind in a loose ribbon that rises and falls along its length
// like smoke, each bird keeping its own place in it and straying a little (uC: its middle; uA: the way it lies, level;
// uF: the way the birds are going; uShape: half-length, half-width, half-height, how far each bird strays; uVel: their
// speed). kind 1: swifts, each on a wide tilted loop of its own round uC, banked into its turn.
// Every bird is turned along its own flight; aSlot: its place in the flock (unit ball) and its size; aSeed: four numbers of its own
function flockMaterial(U, time, kind, o = {}) {
  return new THREE.ShaderMaterial({
    fog: true, lights: true, side: THREE.DoubleSide, defines: { BS_SWIFT: kind },
    uniforms: { ...lightU(), ...fogU(), uTime: time, uSunGain: U.uSunGain, uSunTint: U.uSunTint, uC: { value: new THREE.Vector3() }, uF: { value: new THREE.Vector3(0, 0, -1) }, uA: { value: new THREE.Vector3(1, 0, 0) }, uWarm: { value: o.warm ?? 0 }, uFloor: { value: o.floor ?? 0 },
      uShape: { value: new THREE.Vector4(2.4, 1.5, 0.85, 1) }, uVel: { value: 22 }, uSize: { value: o.size ?? 2.2 }, uLit: { value: o.lit ?? 1 }, uAmb: { value: o.amb ?? 1 } },
    vertexShader: /* glsl */`
      attribute vec3 aCol; attribute vec2 aW; attribute vec4 aSlot, aSeed;
      uniform float uTime, uVel, uSize; uniform vec3 uC, uF, uA; uniform vec4 uShape;
      varying vec3 vN, vV, vC; varying float vW;
      #include <fog_pars_vertex>
      vec3 birdAt(float t){
        vec3 f = uF, r = vec3(-f.z, 0.0, f.x);
        #if BS_SWIFT == 1
          float w = (0.34 + 0.36*aSeed.x)*(aSeed.y < 0.5 ? -1.0 : 1.0), a = t*w + aSeed.z*6.2832;
          float r1 = uShape.x*(0.4 + 0.6*aSeed.w), r2 = uShape.y*(0.4 + 0.6*aSeed.x);
          return uC + f*(aSlot.x*uShape.x*0.6 + cos(a)*r1) + r*(aSlot.z*uShape.y*0.6 + sin(a)*r2) + vec3(0.0, aSlot.y*uShape.z + sin(a*2.0 + aSeed.y*6.0)*uShape.z*0.45, 0.0);
        #else
          vec3 q = aSlot.xyz, a = uA, b = vec3(-a.z, 0.0, a.x);
          float x = clamp(q.x + 0.07*sin(t*(0.5 + 0.6*aSeed.z) + aSeed.x*6.2832), -1.0, 1.0), xm = x*uShape.x;
          float env = 0.4 + 0.6*sqrt(max(1.0 - x*x, 0.0));                    // (thin at both ends)
          float cy = uShape.z*(0.6*sin(xm*0.8 - t*1.3) + 0.32*sin(xm*1.9 + t*0.8 + 1.7));       // the ribbon's own rise and fall, travelling along it
          float cz = uShape.y*0.55*sin(xm*0.6 + t*0.9 + 2.0);
          vec3 jit = uShape.w*0.28*vec3(sin(t*(1.7 + aSeed.z) + aSeed.x*6.2832), 0.6*sin(t*(2.3 + aSeed.w) + aSeed.y*6.2832), cos(t*(1.4 + aSeed.x) + aSeed.y*6.2832));
          return uC + a*(xm + jit.x) + b*(cz + q.z*uShape.y*env + jit.z) + vec3(0.0, cy + q.y*uShape.z*0.62*env + jit.y, 0.0);
        #endif
      }
      void main(){
        vec3 c0 = birdAt(uTime), c1 = birdAt(uTime + 0.07);
        vec3 fw = c1 - c0 + uF*(uVel*0.07); fw = fw/max(length(fw), 1e-4);
        vec3 sd = cross(fw, vec3(0.0, 1.0, 0.0)); sd = sd/max(length(sd), 1e-4);
        vec3 up = cross(sd, fw);
        #if BS_SWIFT == 1
          float bank = 0.75*(aSeed.y < 0.5 ? 1.0 : -1.0) + 0.2*sin(uTime*1.3 + aSeed.z*20.0);
          float beat = 0.22*smoothstep(0.55, 0.9, sin(uTime*1.9 + aSeed.w*30.0))*sin(uTime*30.0 + aSeed.x*40.0) - 0.12;
        #else
          float bank = 0.4*sin(uTime*2.7 + aSeed.x*30.0);
          float bl = max(-aW.x, 0.0);
          float beat = (0.3 + 0.7*smoothstep(-0.35, 0.25, sin(uTime*5.3 + aSeed.y*30.0)))*((bl - 2.0)*0.8 + 0.3*sin(uTime*52.0 + aSeed.z*40.0));       // bursts of whirring (the three blades fanned), the wings half shut between
        #endif
        vW = step(0.5, -aW.x);
        vec3 sd2 = sd*cos(bank) + up*sin(bank), up2 = cross(sd2, fw);
        vec3 p = position;
        p.z += aW.y*(cos(beat) - 1.0); p.y += abs(aW.y)*sin(beat);
        float tw = max(aW.x, 0.0); p.y += tw*tw*0.012*sin(uTime*9.0 + aSeed.w*20.0);
        vec3 wp = c0 + (fw*p.x + up2*p.y + sd2*p.z)*(uSize*aSlot.w);
        vec3 nb = normal; nb.y += abs(aW.y)*sign(aW.y)*0.0;
        vec4 mvPosition = viewMatrix*vec4(wp, 1.0);
        vN = mat3(viewMatrix)*(fw*nb.x + up2*nb.y + sd2*nb.z); vV = mvPosition.xyz; vC = aCol;
        gl_Position = projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform float uLit, uAmb, uWarm, uFloor;
      varying vec3 vN, vV, vC; varying float vW;
      #include <fog_pars_fragment>
      ${GLSL_LIGHT}
      void main(){
        vec3 V = normalize(-vV), L = bsSunDir();
        vec3 N = vN/max(length(vN), 1e-4); N = faceforward(N, -V, N);
        float ndl = max(dot(N, L), 0.0), wrap = dot(N, L)*0.5 + 0.5;
        float skyUp = 0.5 + 0.5*dot(N, normalize(mat3(viewMatrix)*vec3(0.0, 1.0, 0.0)));
        float rim = 1.0 - clamp(dot(N, V), 0.0, 1.0); rim = rim*rim;
        if (vW > 0.5 && bsHash(floor(gl_FragCoord.xy)) > 0.52) discard;       // (a beating wing lets half the light through)
        vec3 sc = bsSunCol(); sc = mix(sc, vec3(dot(sc, vec3(0.3, 0.55, 0.15))), 0.6*(1.0 - uWarm));        // (uWarm 0: a low sun does not gild them; 1: they take the western light as it is)
        vec3 col = vC*(bsAmb(N)*(0.3 + 0.7*skyUp)*uAmb + sc*(0.7*ndl + 0.3*wrap*wrap)*uLit) + vC*sc*(0.3*rim*uLit);
        col = max(col, vC*uFloor);
        gl_FragColor = vec4(col, 1.0);
        #include <fog_fragment>
      }`,
  });
}
// (flat: false, a ball thick in the middle; true, an even ball; 'ribbon': strung evenly along x, anywhere across)
function flockMesh(geo, mat, count, rng, flat) {
  const g = new THREE.InstancedBufferGeometry();
  for (const k of ['position', 'normal', 'aCol', 'aW']) g.setAttribute(k, geo.attributes[k]);
  g.setIndex(geo.index);
  const slot = new Float32Array(count * 4), seed = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    let x = 0, y = 0, z = 0;
    if (flat === 'ribbon') { const a = rng.range(0, 6.2832), r = Math.sqrt(rng()); x = (i + rng()) / count * 2 - 1; y = Math.sin(a) * r; z = Math.cos(a) * r; }
    else for (let t = 0; t < 20; t++) { x = rng.range(-1, 1); y = rng.range(-1, 1); z = rng.range(-1, 1); if (x * x + y * y + z * z <= 1) break; }
    if (!flat) { const k = Math.pow(x * x + y * y + z * z, 0.2); x *= k; y *= k; z *= k; }     // (a ball thick in the middle, a few stragglers)
    slot.set([x, y, z, rng.range(0.86, 1.14)], i * 4); seed.set([rng(), rng(), rng(), rng()], i * 4);
  }
  g.setAttribute('aSlot', new THREE.InstancedBufferAttribute(slot, 4)); g.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seed, 4));
  g.instanceCount = count;
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false; m.visible = false;
  return m;
}

// LEAVES BLOWN THROUGH THE RING: torn leaves drawn in from upwind over the last forty metres, converging on the ring
// and passing through it (uRing: its middle; uAx: the way through it, level). Each is one tumbling lance leaf
function ringLeafMesh(U, time, count, rng, ring, ax, radius) {
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([0, -0.5, 0, 0.22, 0, 0, -0.22, 0, 0, 0, 0.9, 0], 3));
  g.setIndex([0, 1, 2, 2, 1, 3]);
  const sd = new Float32Array(count * 4); for (let i = 0; i < count * 4; i++) sd[i] = rng();
  g.setAttribute('aSeed', new THREE.InstancedBufferAttribute(sd, 4)); g.instanceCount = count;
  const mat = new THREE.ShaderMaterial({
    fog: true, lights: true, side: THREE.DoubleSide,
    uniforms: { ...lightU(), ...fogU(), ...U, uRing: { value: ring.clone() }, uAx: { value: ax.clone() }, uRad: { value: radius }, uOn: { value: 0 } },
    vertexShader: /* glsl */`
      attribute vec4 aSeed; uniform vec3 uRing, uAx; uniform float uRad, uOn;
      varying vec3 vC; varying float vL;
      #include <fog_pars_vertex>
      ${GLSL_WIND}
      void main(){
        float ph = fract(uTime*(0.34 + 0.22*aSeed.z) + aSeed.w);
        vec3 rt = vec3(-uAx.z, 0.0, uAx.x);
        float along = mix(-42.0, 0.4, ph), k = smoothstep(0.0, 1.0, ph);
        float ang = aSeed.y*6.2832 + 1.6*ph, rr = mix(5.0 + 15.0*sqrt(aSeed.x), (uRad - 1.6)*sqrt(aSeed.x), k);
        vec3 c = uRing + uAx*along + rt*(cos(ang)*rr - 11.0*(1.0 - k)*(1.0 - k)*sign(dot(rt.xz, uWind.xy))) + vec3(0.0, sin(ang)*rr*mix(0.6, 1.0, k) + 1.2*sin(uTime*2.0 + aSeed.x*40.0)*(1.0 - k), 0.0);
        float tum = uTime*(6.0 + 8.0*aSeed.x) + aSeed.y*50.0;
        vec3 e1 = normalize(uAx*1.3 + vec3(cos(tum), 0.6*sin(tum*1.3), sin(tum))*0.9);
        vec3 e2 = normalize(cross(e1, vec3(sin(tum*0.7), 0.9, cos(tum*0.7))) + vec3(0.0, 0.0, 1e-3));
        float vis = uOn*smoothstep(0.0, 0.12, ph)*(1.0 - smoothstep(0.965, 1.0, ph));
        vis *= smoothstep(2.0, 5.5, length(c - cameraPosition));                                    // (none against the lens)
        vec3 p = c + (e1*position.y + e2*position.x)*((0.22 + 0.2*aSeed.z)*vis);
        vec4 mvPosition = viewMatrix*vec4(p, 1.0);
        vC = vec3(aSeed.x, aSeed.z, e2.y); vL = vis;
        gl_Position = projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uJade, uLime, uCeladon, uWhite; uniform float uYellow, uSnow;
      varying vec3 vC; varying float vL;
      #include <fog_pars_fragment>
      ${GLSL_LIGHT}
      void main(){
        if (vL < 0.02) discard;
        vec3 alb = mix(mix(uJade, uLime, vC.x), uCeladon, step(0.7, vC.y)*0.8);
        alb = mix(alb, vec3(0.62, 0.55, 0.30), step(vC.x, 0.12));
        alb = mix(alb, vec3(0.82, 0.70, 0.22), uYellow*step(0.45, fract(vC.y*7.0)));
        alb = mix(alb, uWhite, uSnow*step(0.4, fract(vC.y*5.0)));
        vec3 col = alb*(bsAmb(vec3(0.0, 1.0, 0.0))*0.85 + bsSunCol()*(0.4 + 0.5*abs(vC.z)));
        gl_FragColor = vec4(col, 1.0);
        #include <fog_fragment>
      }`,
  });
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false; m.visible = false;
  return m;
}

export default {
  id: 'bamboo-surf',
  name: 'The Bamboo Sea',
  category: 'wilderness',
  weirdness: 0.1,
  media: ['air'],
  async build(ctx) {
    const R = ctx.rng, noise = ctx.noise, vary = ctx.vary || {};
    const fLook = R.fork('look')(), fSeason = R.fork('season')(), fCast = R.fork('cast')();
    const detail = ctx.quality?.detail ?? 1, density = clamp(vary.density ?? 1, 0.7, 1.3), rare = !!vary.rare;
    const hour = vary.hour || 'any';
    let lookName = fLook < 0.25 || fLook >= 0.88 ? 'storm' : fLook < 0.45 ? 'evening' : fLook < 0.7 ? 'noon' : 'night';
    if (hour === 'night') lookName = 'night'; else if (hour === 'golden' || hour === 'dawn') lookName = 'evening'; else if (hour === 'day') lookName = fLook < 0.6 ? 'storm' : 'noon';
    const LK = LOOKS[lookName];
    const season = fSeason < 0.62 ? 'summer' : fSeason < 0.9 ? 'spring' : 'snow';
    const silverPheasant = fCast > 0.3 && fCast < 0.62, parrotbills = fCast > 0.55, panda = fCast > 0.24 && fCast < 0.46;
    const RX = makeRng(hashSeed('bs-extra:' + ctx.seed));          // for everything added since the first build, so the old layout holds
    const time = { value: 0 };
    const scene = new THREE.Scene();

    // ---------------- sky and light ----------------
    const sunAz = Math.atan2(-0.45, -0.79) * 180 / Math.PI;                // on the left, a little behind (hero.anchors.sunSide)
    const skyOpts = { rng: R, ...LK.sky, ground: LK.fogIn, renderer: ctx.renderer };
    if (lookName === 'night') { skyOpts.bake = true; skyOpts.bodies = [{ elevation: LK.sunEl, azimuth: sunAz, size: 2.4, phase: 0.97, intensity: 1.1, dark: 0.03, glow: 0.3, glowColor: '#b8ccff' }]; skyOpts.key = 0; }
    else { skyOpts.sunElevation = LK.sunEl; skyOpts.sunAzimuth = sunAz; }
    const sky = makeSky(skyOpts);
    scene.add(sky.object);
    const el = LK.sunEl * Math.PI / 180, az = sunAz * Math.PI / 180;
    const sunDir = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el)).normalize();
    const sun = new THREE.DirectionalLight(C(LK.sunCol), LK.sunI);
    sun.position.copy(sunDir).multiplyScalar(600); scene.add(sun, sun.target);
    const hemi = new THREE.HemisphereLight(C(LK.hemiSky), C(LK.hemiGnd), LK.hemiIn);
    scene.add(hemi);
    const fogIn = C(LK.fogIn), fogOut = C(LK.fogOut);
    scene.fog = new THREE.FogExp2(fogIn.clone(), LK.dIn);
    await ctx.yield();

    // ---------------- the land (hero space) ----------------
    const lane = { amp: R.range(1.8, 3.0) * R.sign(), freq: R.range(0.045, 0.064), ph: R.range(0, 6.28) };
    const laneX = (z) => lane.amp * Math.sin(z * lane.freq + lane.ph);
    const ridgeH = R.range(11.5, 14), bankH = R.range(4.5, 6), nOff = R.range(0, 50), bendK = R.range(0.75, 1.25);
    const ridA = R.range(0.35, 0.95), rnx = Math.sin(ridA), rnz = -Math.cos(ridA), ridPh = R.range(0, 6.28), ridL = R.range(430, 540);
    const crestX = (z) => { const t = clamp((-55 - z) / 190, 0, 1); let x = -24.9 * bendK * t * t; if (z < -245) x -= 0.268 * bendK * (-245 - z); return x; };
    const zP = -351, xP = crestX(zP), zSad = zP + 66, sadDip = R.range(7, 11);
    // THE VISTA: left of the crest flight four ridges stand one behind another, 30 degrees left of the way we leave
    // through the ring, each higher than the last, so that from over the crowns they step back one behind another into
    // the rain. They end short of the line of the final approach: the ring and the sandstone table keep their own sky.
    const RV = makeRng(hashSeed('bs-vista:' + ctx.seed));
    const hE = (() => { const l = Math.hypot(0.268 * bendK, 1); return { x: -0.268 * bendK / l, z: -1 / l }; })();
    const vO = { x: crestX(-170), z: -170 }, vAng = 0.56 + RV.range(-0.05, 0.05);
    const g0 = { x: hE.x * Math.cos(vAng) + hE.z * Math.sin(vAng), z: hE.z * Math.cos(vAng) - hE.x * Math.sin(vAng) };
    const VR = [[280, 110, -22, -0.2], [560, 190, 52, 0.16], [980, 260, 195, -0.1], [1500, 340, 410, 0.08]].map(([S, W, H, da], k) => {
      const a = da + RV.range(-0.05, 0.05), c = Math.cos(a), sn = Math.sin(a);
      return { S: S * RV.range(0.97, 1.03), W, H: H + RV.range(-5, 5), nx: g0.x * c + g0.z * sn, nz: g0.z * c - g0.x * sn, ph: RV.range(0, 6.28), k };
    });
    const farH = (x, z) => {
      const a = x * rnx + z * rnz, rid = 1 - Math.abs(Math.sin(Math.PI * a / ridL + ridPh + 1.5 * noise.n2(x / 800 + 3, z / 800)));
      const ex = x - vO.x, ez = z - vO.z, s0 = ex * g0.x + ez * g0.z, c0 = ex * g0.z - ez * g0.x;      // c0 > 0: left of the vista axis
      const sect = sstep(120, 260, s0) * sstep(-330 - 270 * sstep(700, 1000, s0), -80 - 170 * sstep(700, 1000, s0), c0);
      let h = -105 + 115 * Math.pow(rid, 1.25) * (1 - 0.72 * sect) + 25 * noise.fbm2(x / 650 + nOff, z / 650, 3);
      let fine = 1e9;
      if (sect > 0) for (let k = 0; k < 4; k++) {
        const r = VR[k], s = ex * r.nx + ez * r.nz, c = ex * r.nz - ez * r.nx;
        if (Math.abs(s - r.S) >= r.W + 82) continue;
        const crest = r.S + 60 * noise.n2(c / 430 + k * 7.1, k * 3.3) + 22 * Math.sin(c / 150 + r.ph);
        const t = Math.sqrt((s - crest) * (s - crest) / (r.W * r.W) + 0.003); if (t >= 1) continue;
        const m = k < 2 ? sstep(-330, -60, c) : k < 3 ? sstep(-420, -120, c) : sstep(-560, -200, c);
        if (fine === 1e9) fine = 14 * noise.fbm2(x / 140, z / 140, 2);
        const top = r.H + (r.H + 100) * 0.16 * noise.n2(c / 380 + k * 11.3, 5.5) + fine;
        const hr = -100 + (top + 100) * Math.pow(1 - t, 1.45) * m * sect;
        if (hr > h) h = hr;
      }
      return h;
    };
    // the stream: it heads in a pool under a 2 m sandstone ledge at z = zF (the lane meets the water there), and runs in
    // spate down the gully over two lower ledges
    const zF = 125;
    const poolK = (z) => sstep(zF - 0.5, zF + 2.5, z) * (1 - sstep(zF + 9, zF + 16, z));
    const landAt = (x, z) => {
      if (z <= -150 && (z <= zP - 150 || Math.abs(x - crestX(z)) >= 260)) return farH(x, z);       // (far from the path: the hills alone)
      const dx = x - laneX(z), adx = Math.abs(dx);
      const n = noise.fbm2(x * 0.035 + nOff, z * 0.035, 3) * 1.7 * (0.3 + 0.7 * sstep(3, 12, adx));
      const zc = Math.max(z, -46);
      const gz = ridgeH * Math.pow(sstep(34, -46, zc), 1.3);
      const bank = (1 - Math.exp(-dx * dx / 100)) * bankH * sstep(-46, -12, zc) * (1 - 0.8 * sstep(95, 150, z));
      let pz = -0.014 * Math.max(z - 34, 0) - 0.7 * sstep(36.5, 40, z) - 0.8 * sstep(69.5, 73.5, z);
      if (z > zF - 24) { const e = Math.exp(-dx * dx / 260); pz -= 4.3 * (sstep(zF - 1.5, zF - 0.3, z) * e + sstep(zF - 22, zF + 16, z) * (1 - e)); }
      // (the trench widens into small bays and narrows again, wanders a little off the lane's line and has shoals in it)
      const sv = sstep(6, 14, z) * (1 - sstep(zF - 13, zF - 6, z)), dxs = dx + sv * (0.75 * Math.sin(z * 0.23 + 2.1) + 0.35 * Math.sin(z * 0.61 + 0.7));
      const wid = (6 + 30 * poolK(z)) * (1 + sv * (0.55 * Math.sin(z * 0.37 + 1.3) * Math.sin(z * 0.151 + 0.4) + 0.3 * Math.sin(z * 0.83 + 2.0)));
      const bed = (-0.9 * Math.exp(-dxs * dxs / wid) + (adx < 7 ? sv * 0.17 * noise.n2(x * 0.85 + 3.1, z * 0.85) * Math.exp(-dx * dx / 16) : 0)) * sstep(-2, 10, z) * (1 - sstep(zF + 11, zF + 17, z));
      let A = gz + bank + n + pz * lerp(1, Math.exp(-dx * dx / 800), sstep(95, 150, z)) + bed;
      if (z > -36) return A;
      const d = Math.abs(x - crestX(z));
      const dip = sadDip * Math.exp(-(((z - zSad) / 42) ** 2));
      // (the crest we ride is a true ridge: 40 m to either side the ground is 23 m down, at 100 m it is 55 m down, so
      // from 6 m over its crowns the valleys fall away on both hands)
      const crest = ridgeH - dip + n * 0.6 - 58 * (1 - Math.exp(-((d / 56) ** 2)));
      A = lerp(A, crest, sstep(-36, -60, z));
      const wLocal = Math.max(sstep(-150, -60, z), (1 - sstep(60, 260, d)) * sstep(zP - 150, zP - 30, z));
      return wLocal >= 1 ? A : lerp(farH(x, z), A, wLocal);
    };
    const heightAt = landAt;
    // the crown tops as the far scatters see them: read off a lattice whose nodes ask the terrain once each (the hills
    // are broad; between nodes 20 m apart they are as good as straight). hN takes the slope at the same point
    const hN = { nx: 0, nz: 0 };
    const lattice = (G) => {
      const M = new Map();
      const node = (i, j) => { const key = (i + 8192) * 16384 + j + 8192; let h = M.get(key); if (h === undefined) { h = heightAt(i * G, j * G) + 19; M.set(key, h); } return h; };
      return (x, z) => {
        const fx = x / G, fz = z / G, i = Math.floor(fx), j = Math.floor(fz), a = fx - i, b = fz - j;
        const h00 = node(i, j), h10 = node(i + 1, j), h01 = node(i, j + 1), h11 = node(i + 1, j + 1);
        hN.nx = -((h10 - h00) * (1 - b) + (h11 - h01) * b) / G; hN.nz = -((h01 - h00) * (1 - a) + (h11 - h10) * a) / G;
        return (h00 * (1 - a) + h10 * a) * (1 - b) + (h01 * (1 - a) + h11 * a) * b;
      };
    };
    const topAt = lattice(20), topFar = lattice(48);

    // ---------------- the hero: the parting grove at the gully head ----------------
    const hero = await buildHero(ctx, { palette: PALETTE, hour: LK.hero, season, density: clamp(density * 0.9, 0.65, 1.12), ground: false, shell: false, heightFn: heightAt, lane, duration: DUR, monkeys: false });
    hero.setFill(LK.shut, LK.fill);
    scene.add(hero.object);
    const U = hero.wind.uniforms, windDir = hero.wind.dir;
    await ctx.yield();

    // ---------------- the path ----------------
    const Fd = { x: -0.819, z: -0.574 }, Pn = { x: 0.574, z: -0.819 };          // forest heading and its right-hand normal
    const K = { x: laneX(140), z: 140 };                                       // where the forest line meets the gully line
    const sgn = R.sign(), S_FOREST = 392;
    const fpt = (s, off) => { const t = S_FOREST - s; return [K.x - Fd.x * t + Pn.x * off, K.z - Fd.z * t + Pn.z * off]; };
    const clumpS = 88, apex = [[clumpS, 5.6], [146, -3.6], [200, 3.6], [254, -3.6], [308, 3.6], [362, -1.2]];
    const pts = [];
    for (const s of [0, 25, 50]) { const p = fpt(s, 0); pts.push([p[0], 7, p[1]]); }
    // the lane comes down off the forest floor into the dell of the pool: 7 m up through the slalom, 5 m over the ferns at its end
    for (const [s, o] of apex) { const p = fpt(s, o * sgn); pts.push([p[0], s > 330 ? Math.max(heightAt(p[0], p[1]) + 5.0, 2.6) : s > 280 ? 6.5 : 7, p[1]]); }
    const waterY = (z) => heightAt(laneX(z), z) + 0.5, poolY = waterY(zF + 6);
    { const x = K.x - Fd.x * 16 + 0.5, z = K.z - Fd.z * 16 - 9; pts.push([x, Math.max(heightAt(x, z) + 3.6, poolY + 4.2), z]); }
    pts.push([laneX(zF + 5), poolY + 4.8, zF + 5]);                           // out over the pool, then up over the fall
    for (const z of [110, 92, 72, 56, 40, 26]) pts.push([laneX(z), waterY(z) + 2.9, z]);
    const ft = hero.anchors.flyThrough;
    for (let i = 4; i <= 10; i++) pts.push([ft[i].x, ft[i].y, ft[i].z]);
    const yTop = ft[10].y, zTop = ft[10].z;
    // out of the V we level off and ride the crest 6 m over the crown tops (yTop is the crown tops + 6): the plumes streak
    // under the lens and the valleys fall away either side; a little down into the saddle with the crowns, up to the ring
    const sadAt = (z) => sadDip * Math.exp(-(((z - zSad) / 42) ** 2));
    for (const [z, dy] of [[zTop - 38, 0.7], [-128, 0.6], [-170, 0.5], [-212, 0.3], [-250, 0.1 - 0.4 * sadAt(-250)], [zP + 60, -0.4 * sadAt(zP + 60)], [zP, 0]]) pts.push([crestX(z), yTop + dy, z]);
    const path = makePath(pts);
    const uOf = (x, z) => path.nearestXZ(x, z).u;
    const uClimb = uOf(ft[4].x, ft[4].z), uTop = uOf(ft[10].x, ft[10].z);
    const uPartStart = uClimb - 1.0 / DUR;
    const entry = path.pointAt(0), exitP = path.pointAt(1);
    const partClock = (u) => (u - uPartStart) * DUR;
    await ctx.yield();
    // streams of their own: the Great Clump (RGc), the fourth windfall (RW4), the stand beyond the windthrow (RGs), the
    // crowns under the lens (R10)
    const RGc = makeRng(hashSeed('bs-great:' + ctx.seed)), RW4 = makeRng(hashSeed('bs-windfall4:' + ctx.seed)), RGs = makeRng(hashSeed('bs-gapstand:' + ctx.seed));
    const R10 = makeRng(hashSeed('bs-r10:' + ctx.seed));
    // the way the route leaves through the ring, in plan (endF), and its right hand (endR)
    const endF = { x: 0, z: -1 }, endR = { x: 1, z: 0 };
    { const ex = path.endTangent.x, ez = path.endTangent.z, eh = Math.hypot(ex, ez) || 1; endF.x = ex / eh; endF.z = ez / eh; endR.x = -endF.z; endR.z = endF.x; }
    // THE TABLE in plan: one table of red sandstone stands out of the crown sea beyond the saddle, 352 m past the ring and
    // 248 m to its right, its long axis across the view, never nearer than 200 m to the flight. Worked out here, before
    // anything is planted (MT.inside: within its foot); the rock itself is built further down.
    const MT = (() => {
      const RM = makeRng(hashSeed('bs-mesa:' + ctx.seed));
      const mc = { x: exitP.x + endF.x * 352 + endR.x * 248, z: exitP.z + endF.z * 352 + endR.z * 248 };
      const rot = Math.atan2(endF.z, endF.x) + 1.95 + RM.range(-0.15, 0.15), cr = Math.cos(rot), sr = Math.sin(rot);
      const A = RM.range(150, 172), B = RM.range(62, 74), yT = yTop + RM.range(74, 86);
      const ph = [RM.range(0, 6.28), RM.range(0, 6.28), RM.range(0, 6.28)], nk = RM.range(0, 40);
      // (thC: the bearing, in the table's own frame, of the crest flight: the face the falls come down)
      const e85 = path.pointAt(0.86), dxl = e85.x - mc.x, dzl = e85.z - mc.z, thC = Math.atan2(-dxl * sr + dzl * cr, dxl * cr + dzl * sr);
      const thN = thC + (RM() < 0.5 ? -1 : 1) * RM.range(0.3, 0.55), cleft = (th) => Math.exp(-((Math.atan2(Math.sin(th - thN), Math.cos(th - thN)) / 0.17) ** 2));
      const outline = (th) => {                                             // metres from the middle toward th: buttresses and gullies
        const c = Math.cos(th), sn = Math.sin(th), e = 1 / Math.sqrt((c / A) ** 2 + (sn / B) ** 2);
        return e * (1 + 0.15 * Math.sin(2 * th + ph[0]) + 0.11 * Math.sin(3 * th + ph[1]) + 0.06 * Math.sin(5 * th + ph[2])) * (1 - 0.45 * cleft(th));
      };
      const butt = (th) => noise.fbm2(Math.cos(th) * 1.5 + nk, Math.sin(th) * 1.5 + 4, 4);
      const topY = (th) => yT + 17 * noise.fbm2(Math.cos(th) * 1.1 + nk + 9, Math.sin(th) * 1.1, 3) + 9 * Math.sin(th + ph[1]) - 34 * cleft(th);     // the rim rises and falls
      const inside = (x, z, k = 1) => {
        const dx = x - mc.x, dz = z - mc.z; if (dx * dx + dz * dz > 62500) return false;
        const lx = dx * cr + dz * sr, lz = -dx * sr + dz * cr, th = Math.atan2(lz, lx);
        return Math.hypot(lx, lz) < (outline(th) + 25 * butt(th)) * 1.22 * k;
      };
      return { RM, mc, cr, sr, A, B, yT, ph, nk, thC, cleft, outline, butt, topY, inside };
    })();
    // THE KNOLLS OF THE CREST: the four liveliest clumps of the crown sea stand where the ground itself stands up. Along
    // the crest flight, from 30 m past the V's head to 70 m short of the ring, every place 13 to 31 m to either side is
    // scored by how far its ground stands over the ground 12 m round it; the four highest that lie 40 m from one another
    // are taken (KN.stools, in the order we pass them). Their culms top out with the crowns round them: only the gate
    // pair stands out of the sea.
    const KN = (() => {
      const sV = uTop * path.length, sEnd = path.length - 70, cand = [], P = new THREE.Vector3(), T = new THREE.Vector3();
      for (let sd = sV + 30; sd < sEnd; sd += 6) {
        path.posAtDist(sd, P); path.tangentAtDist(sd, T); const h = Math.hypot(T.x, T.z) || 1, tx = T.x / h, tz = T.z / h;
        for (const lat of [-31, -25, -19, -13, 13, 19, 25, 31]) {
          const x = P.x + tz * lat, z = P.z - tx * lat;
          let m = 0; for (let k = 0; k < 8; k++) m += heightAt(x + Math.cos(k * 0.7854) * 12, z + Math.sin(k * 0.7854) * 12);
          cand.push({ x, z, s: sd, y: P.y, score: heightAt(x, z) - m / 8 });
        }
      }
      cand.sort((p, q) => q.score - p.score);
      const stools = [];
      for (const c of cand) { if (stools.length >= 4) break; let ok = true; for (const q of stools) if (Math.hypot(c.x - q.x, c.z - q.z) < 40) ok = false; if (ok) stools.push(c); }
      stools.sort((p, q) => p.s - q.s);
      return { stools, near: (x, z) => { for (const c of stools) if (Math.hypot(x - c.x, z - c.z) < 3.8) return true; return false; } };
    })();
    // the crest flight in plan, every 3 m from a little before the V's head to 26 m beyond the ring (crestD: metres from it), and how
    // far to either side of it the crowns are real plumes, stem by stem (STRIP)
    const STRIP = 22, sV10 = uTop * path.length - 14, crestPts = [];
    for (let sd = sV10; sd < path.length + 27.5; sd += 3) { const e = path.posAtDist(Math.min(sd, path.length)), past = Math.max(sd - path.length, 0); crestPts.push(e.x + endF.x * past, e.z + endF.z * past); }
    const crestD = (x, z) => {
      if (z > zTop + 45 || z < zP - 60 || Math.abs(x - crestX(z)) > 48) return 1e9;
      let m = 1e12;
      for (let i = 0; i < crestPts.length; i += 2) { const ex = x - crestPts[i], ez = z - crestPts[i + 1], q = ex * ex + ez * ez; if (q < m) m = q; }
      return Math.sqrt(m);
    };
    // how far a culm is bowed at the worst: by the hardest gust and the swell together (0.72 + 0.5 of its suppleness, see
    // bsCulm in the hero), on top of its own lean. culmAt: the point at fraction q of a culm so bowed (k: 0 calm, 1 the worst)
    const BOW = 1.22;
    const culmAt = (it, lx, lz, q, k, out) => {
      const ax = windDir.x * BOW * it.stiff * k + lx, az = windDir.y * BOW * it.stiff * k + lz, ang = Math.hypot(ax, az), th = Math.min(ang * Math.pow(q, 1.6), 1.35), sl = q * it.h;
      const hx = sl * th * (1 / 2.6 - th * th / 34.8), hy = sl * (1 - th * th / 8.4 + th * th * th * th / 177.6), dl = Math.max(ang, 1e-4);
      out.x = it.x + ax / dl * hx; out.y = hy; out.z = it.z + az / dl * hx; out.sx = ax / dl * Math.sin(th); out.sy = Math.cos(th); out.sz = az / dl * Math.sin(th);
      return out;
    };

    // ---------------- ground under the canopy: a ribbon swept along the path, with boulders, a ledge, tree-fern trunks ----------------
    const L = path.length, sTop = uTop * L + 8;
    const _p = new THREE.Vector3(), _t = new THREE.Vector3();
    let sideS = NaN;                                                        // (the s that _p and _t were last worked out for)
    const side = (s, off, out) => { if (s !== sideS) { path.posAtDist(s, _p); path.tangentAtDist(s, _t); sideS = s; } const h = Math.hypot(_t.x, _t.z) || 1; out.x = _p.x - _t.z / h * off; out.z = _p.z + _t.x / h * off; return out; };
    const gPos = [], gRock = [], gIdx = [], sForestG = uOf(laneX(75), 75) * L;
    {
      const offs = [0, 1, 2, 3.2, 4.6, 6.5, 9, 12.5, 17, 24, 34, 48, 68, 96, 135, 185], cols = [];
      for (let i = offs.length - 1; i > 0; i--) cols.push(-offs[i]);
      for (const o of offs) cols.push(o);
      const o2 = { x: 0, z: 0 }; let rows = 0;
      for (let s = -40; s <= sTop; s += 2.5, rows++) { const lim = s > sForestG + 60 ? 150 : 185; for (const c of cols) { side(s, clamp(c, -lim, lim), o2); gPos.push(o2.x, heightAt(o2.x, o2.z), o2.z); gRock.push(0); } if ((rows & 63) === 63) await ctx.yield(); }
      const nc = cols.length;
      for (let j = 0; j < rows - 1; j++) for (let i = 0; i < nc - 1; i++) { const a = j * nc + i, b = a + 1, c = a + nc, d = c + 1; gIdx.push(a, b, c, b, d, c); }
    }
    await ctx.yield();
    const solids = [];                                                     // [x, z, r] things culms and ferns keep off
    // (the loose rocks of the gully and the slalom: drawn here as they always were, laid further down as bedded blocks)
    const lumps = [];
    for (let k = 0; k < 15; k++) {                                         // along the stream and the gully
      const z = R.range(-28, 132), sd = R.sign(), sx = R.range(1.1, 2.8), sz = R.range(1.1, 2.6);
      const cx = laneX(z) + sd * (7.2 + Math.max(sx, sz) + R.range(0, 7));
      lumps.push([cx, z, sx, R.range(0.7, 1.5), sz, R.range(0, 6.28), k]); solids.push([cx, z, Math.max(sx, sz)]);
    }
    for (let k = 0; k < 12; k++) {                                         // along the slalom
      const o2 = side(R.range(30, S_FOREST), R.sign() * R.range(9, 24), { x: 0, z: 0 }), sx = R.range(1.0, 2.6), sz = R.range(1.0, 2.4);
      if (Math.hypot(o2.x - entry.x, o2.z - entry.z) < 18) continue;
      lumps.push([o2.x, o2.z, sx, R.range(0.6, 1.3), sz, R.range(0, 6.28), 20 + k]); solids.push([o2.x, o2.z, Math.max(sx, sz)]);
    }
    await ctx.yield();
    await ctx.yield();
    // ---------------- sandstone: bedded slabs with their own mesh and shader (the huddle's outcrop, the ledge the
    // stream falls over, the monkey rock in the slalom). Each slab is a stack of beds, every bed its own outline, set
    // back or overhanging a little, with an open seam under it; the shader lays strata, joints and a moss cap ----------------
    const rP = [], rK = [], rI = [];
    const slab = (cx, cz, y0, y1, sx, sz, rot, seed, wet = 0) => {
      const NA = 28, cr = Math.cos(rot), sr = Math.sin(rot), H = y1 - y0, i0 = rI.length, beds = Math.max(2, Math.round(H / 0.95)), yg = heightAt(cx, cz);
      let hs = Math.floor(seed * 99991) + 7; const hr = () => { hs = (hs * 16807) % 2147483647; return hs / 2147483647; };
      // the outline is a block: six or seven flat faces met at corners (a joint-bounded slab), not a rounded lump
      const NF = 6 + (hr() < 0.4 ? 1 : 0), faces = [];
      for (let i = 0; i < NF; i++) faces.push([(i + (hr() - 0.5) * 0.7) / NF * 6.2832, 0.8 + 0.3 * hr()]);
      const poly = (th) => { let r = 9; for (const f of faces) { const c = Math.cos(th - f[0]); if (c > 0.05) r = Math.min(r, f[1] / c); } return Math.min(r, 1.45); };
      const ring = (y, f, tw, ox, oz, bump) => {
        const o = rP.length / 3;
        for (let i = 0; i < NA; i++) {
          const th = i / NA * 6.2832, r = poly(th + tw) * f * (1 + 0.035 * noise.n2(Math.cos(th) * 3.1 + seed * 9, Math.sin(th) * 3.1 + y * 0.7));
          const lx = Math.cos(th) * r * sx + ox, lz = Math.sin(th) * r * sz + oz, x = cx + lx * cr - lz * sr, z = cz + lx * sr + lz * cr;
          const yy = y + (bump ? bump * noise.n2(x * 0.9 + seed * 5, z * 0.9) : 0);
          rP.push(x, yy, z); rK.push(seed, yy - yg, wet, 0);
        }
        return o;
      };
      const cuts = [0]; for (let b = 0; b < beds; b++) cuts.push(cuts[b] + 0.55 + hr());
      const rows = [];
      for (let b = 0; b < beds; b++) {
        const ya = y0 + H * cuts[b] / cuts[beds], yb = y0 + H * cuts[b + 1] / cuts[beds], last = b === beds - 1;
        const f = (1 + 0.1 * (hr() - 0.5) - 0.03 * b) * (last && beds > 2 ? 0.95 : 1), tw = (hr() - 0.5) * 0.1, ox = (hr() - 0.5) * 0.12 * sx, oz = (hr() - 0.5) * 0.12 * sz;
        if (b > 0) rows.push(ring(ya - 0.012, f - 0.045, tw, ox, oz));         // the open seam under this bed
        rows.push(ring(ya + 0.06, f, tw, ox, oz));
        if (last) rows.push(ring(yb - 0.24, f * 1.0, tw, ox, oz), ring(yb - 0.08, f * 0.955, tw, ox, oz, 0.04), ring(yb, f * 0.86, tw, ox, oz, 0.08), ring(yb + 0.05, f * 0.5, tw, ox, oz, 0.14));   // the lip weathered round
        else rows.push(ring(yb - 0.07, f * 1.01, tw, ox, oz));
      }
      for (let j = 0; j < rows.length - 1; j++) for (let i = 0; i < NA; i++) { const a = rows[j] + i, b2 = rows[j] + (i + 1) % NA, c = rows[j + 1] + i, d = rows[j + 1] + (i + 1) % NA; rI.push(a, c, b2, b2, c, d); }
      const cen = rP.length / 3, lastR = rows[rows.length - 1];
      let mx = 0, mz = 0; for (let i = 0; i < NA; i++) { mx += rP[(lastR + i) * 3]; mz += rP[(lastR + i) * 3 + 2]; }
      rP.push(mx / NA, y1 + 0.06, mz / NA); rK.push(seed, y1 + 0.06 - yg, wet, 0);
      for (let i = 0; i < NA; i++) rI.push(lastR + i, cen, lastR + (i + 1) % NA);
      return { i0, i1: rI.length, top: y1 };
    };
    // A JOINT-BOUNDED BLOCK of the same sandstone: an outline of four or five straight faces meeting at true corners,
    // twice as long as it is deep if asked, its beds stepping in and out a little (a weak bed weathered back here and
    // there), one upper corner broken off, the whole block dipping (o.tx, o.tz: rise per metre along its own x and z).
    // The shader lays the beds in the block's own tilted frame (aK.w carries the dip back out)
    const block = (cx, cz, y0, y1, sx, sz, rot, seed, o = {}) => {
      const wet = o.wet || 0, tx = o.tx || 0, tz = o.tz || 0, cr = Math.cos(rot), sr = Math.sin(rot), H = y1 - y0, i0 = rI.length, yg = heightAt(cx, cz);
      let hs = Math.floor(seed * 99991) + 11; const hr = () => { hs = (hs * 16807) % 2147483647; return hs / 2147483647; };
      const NC = hr() < 0.6 ? 4 : 5, EP = NC === 4 ? 5 : 4, NA = NC * EP, cor = [], a0 = hr() * 0.5;
      for (let i = 0; i < NC; i++) { const a = a0 + (i + 0.5 + (hr() - 0.5) * 0.42) / NC * 6.2832, r = (NC === 4 ? 1.3 : 1.13) * (0.84 + 0.3 * hr()); cor.push([Math.cos(a) * r, Math.sin(a) * r]); }
      const chipI = Math.floor(hr() * NC), chipK = o.chip ?? (0.2 + 0.25 * hr());
      const ring = (y, f, ox, oz, bump, chip) => {
        const o0 = rP.length / 3;
        for (let i = 0; i < NC; i++) {
          const a = cor[i], b = cor[(i + 1) % NC];
          for (let j = 0; j < EP; j++) {
            const t = j / EP; let lx = a[0] + (b[0] - a[0]) * t, lz = a[1] + (b[1] - a[1]) * t;
            const k = f * (1 + 0.06 * Math.sin(Math.PI * t) * noise.n2(lx * 2.3 + seed * 9 + i * 3.7, lz * 2.3 + y * 0.8)) * (j === 0 ? (o.lite ? 0.84 : 0.935) : 1);   // the faces break in and out a little; the corners are worn off
            lx *= k; lz *= k;
            if (chip) { const dc = Math.hypot(lx - cor[chipI][0] * f, lz - cor[chipI][1] * f), w = Math.max(0, 1 - dc / 0.75) * chip; lx *= 1 - w; lz *= 1 - w; }
            const X = lx * sx + ox, Z = lz * sz + oz, x = cx + X * cr - Z * sr, z = cz + X * sr + Z * cr, dip = tx * X + tz * Z;
            const yy = y + dip + (bump ? bump * noise.n2(x * 0.9 + seed * 5, z * 0.9) : 0);
            rP.push(x, yy, z); rK.push(seed, yy - yg, wet, dip);
          }
        }
        return o0;
      };
      const beds = o.lite ? 1 : o.beds || Math.max(2, Math.round(H / 1.05)), cuts = [0]; for (let b = 0; b < beds; b++) cuts.push(cuts[b] + 0.5 + hr());
      const rows = []; let fp = 1;
      if (o.under) rows.push(ring(y0, 0.5, 0, 0));                           // an underside, for a block that hangs out over another
      for (let b = 0; b < beds; b++) {
        const ya = y0 + H * cuts[b] / cuts[beds], yb = y0 + H * cuts[b + 1] / cuts[beds], last = b === beds - 1;
        let f = 1 + 0.09 * (hr() - 0.5) - 0.012 * b; if (b > 0 && !last && hr() < 0.3) f -= 0.07;      // a weak bed, weathered back
        const ox = (hr() - 0.5) * 0.1 * sx, oz = (hr() - 0.5) * 0.1 * sz, chip = b >= beds - 2 && beds > 2 || last ? chipK * (last ? 1 : 0.5) : 0;
        if (b > 0) rows.push(ring(ya - 0.012, Math.min(f, fp) - 0.03, ox, oz, 0, chip));   // the open seam under this bed
        if (o.lite) rows.push(ring(ya, f * 1.14, ox, oz, 0, 0), ring(yb - 0.26, f * 1.08, ox, oz, 0.03, chip * 0.5), ring(yb - 0.12, f * 0.97, ox, oz, 0.04, chip), ring(yb - 0.035, f * 0.8, ox, oz, 0.05, chip), ring(yb + 0.02, f * 0.56, ox, oz, 0.05, chip), ring(yb + 0.045, f * 0.3, ox, oz, 0.04, chip));   // a stone: battered sides, a rounded-off top
        else {
          rows.push(ring(ya + 0.05, f, ox, oz, 0, chip));
          if (last) rows.push(ring(yb - 0.22, f * 1.0, ox, oz, 0, chip), ring(yb - 0.07, f * 0.965, ox, oz, 0.03, chip), ring(yb, f * 0.885, ox, oz, 0.05, chip), ring(yb + 0.04, f * 0.5, ox, oz, 0.1, chip));   // the lip weathered round
          else rows.push(ring(yb - 0.06, f * 1.005, ox, oz, 0, chip));
        }
        fp = f;
      }
      for (let j = 0; j < rows.length - 1; j++) for (let i = 0; i < NA; i++) { const a = rows[j] + i, b2 = rows[j] + (i + 1) % NA, c = rows[j + 1] + i, d = rows[j + 1] + (i + 1) % NA; rI.push(a, c, b2, b2, c, d); }
      for (const [rw, yc, flip] of o.under ? [[rows[rows.length - 1], y1 + 0.05, 0], [rows[0], y0, 1]] : [[rows[rows.length - 1], y1 + 0.05, 0]]) {
        const cen = rP.length / 3; let mx = 0, my = 0, mz = 0;
        for (let i = 0; i < NA; i++) { mx += rP[(rw + i) * 3]; my += rK[(rw + i) * 4 + 3]; mz += rP[(rw + i) * 3 + 2]; }
        rP.push(mx / NA, yc + my / NA, mz / NA); rK.push(seed, yc + my / NA - yg, wet, my / NA);
        for (let i = 0; i < NA; i++) { if (flip) rI.push(rw + (i + 1) % NA, cen, rw + i); else rI.push(rw + i, cen, rw + (i + 1) % NA); }
      }
      return { i0, i1: rI.length, top: y1 };
    };
    // A NATURAL BOULDER of the same sandstone, weathered round where it lies: wider than tall, sunk in the litter, lumpy,
    // no flat face and no corner anywhere, undercut a little at the foot. The shader (aK.x + 2 marks it) gives it smooth
    // light, faint bedding, a moss cap that hangs down its sides and lichen below that
    const boulder = (cx, cz, y0, y1, sx, sz, rot, seed, o = {}) => {
      const NA = o.na || 16, NR = o.nr || 7, cr = Math.cos(rot), sr = Math.sin(rot), i0 = rI.length, yg = heightAt(cx, cz), H = y1 - y0, wet = o.wet || 0, tx = o.tx || 0, tz = o.tz || 0;
      const a1 = seed * 37.1, a2 = seed * 91.7, o0 = rP.length / 3, lump = o.lump ?? 1;
      for (let j = 0; j < NR; j++) {
        const an = -0.3 + (j / NR) * (Math.PI / 2 + 0.3), rr = Math.pow(Math.max(Math.cos(an), 0), 0.72), yn = (Math.sin(an) + 0.2955) / 1.2955;
        for (let i = 0; i < NA; i++) {
          const th = i / NA * 6.2832, plan = 1 + 0.16 * Math.sin(th * 2 + a1) + 0.09 * Math.sin(th * 3 + a2) + 0.05 * Math.sin(th * 5 + a1 * 0.7);
          const k = rr * plan * (1 + lump * (0.13 * noise.n2(Math.cos(th) * 1.3 + seed * 19, Math.sin(th) * 1.3 + yn * 1.7) + 0.06 * noise.n2(Math.cos(th) * 3.4 + 5, Math.sin(th) * 3.4 + yn * 4 + seed * 7)));
          const X = Math.cos(th) * k * sx, Z = Math.sin(th) * k * sz, x = cx + X * cr - Z * sr, z = cz + X * sr + Z * cr;
          const yy = y0 + H * yn * (1 + lump * 0.1 * noise.n2(x * 0.8 + seed * 5, z * 0.8)) + (tx * X + tz * Z) * yn;
          rP.push(x, yy, z); rK.push(seed + 2, yy - yg, wet, 0);
        }
      }
      for (let j = 0; j < NR - 1; j++) for (let i = 0; i < NA; i++) { const a = o0 + j * NA + i, b2 = o0 + j * NA + (i + 1) % NA, c = a + NA, d = b2 + NA; rI.push(a, c, b2, b2, c, d); }
      const cen = rP.length / 3, last = o0 + (NR - 1) * NA; let mx = 0, my = 0, mz = 0;
      for (let i = 0; i < NA; i++) { mx += rP[(last + i) * 3]; my += rP[(last + i) * 3 + 1]; mz += rP[(last + i) * 3 + 2]; }
      const yc = my / NA + 0.12 * H * 0.5;
      rP.push(mx / NA, yc, mz / NA); rK.push(seed + 2, yc - yg, wet, 0);
      for (let i = 0; i < NA; i++) rI.push(last + i, cen, last + (i + 1) % NA);
      return { i0, i1: rI.length, top: yc };
    };
    // the highest rock surface under (x, z) among the triangles i0..i1 of the slabs
    const rockY = (i0, i1, x, z) => {
      let best = -1e9;
      for (let k = i0; k < i1; k += 3) {
        const a = rI[k] * 3, b = rI[k + 1] * 3, c = rI[k + 2] * 3;
        const ax = rP[a] - x, az2 = rP[a + 2] - z, bx = rP[b] - x, bz = rP[b + 2] - z, cx = rP[c] - x, cz = rP[c + 2] - z;
        const d = (bx - ax) * (cz - az2) - (cx - ax) * (bz - az2); if (Math.abs(d) < 1e-9) continue;
        const w0 = (bx * cz - cx * bz) / d, w1 = (cx * az2 - ax * cz) / d, w2 = 1 - w0 - w1; if (w0 < 0 || w1 < 0 || w2 < 0) continue;
        best = Math.max(best, w0 * rP[a + 1] + w1 * rP[b + 1] + w2 * rP[c + 1]);
      }
      return best;
    };
    const rockFerns = [];                                                   // ferns rooted on the rocks and crowding their feet
    const fernAt = (x, y, z, size) => rockFerns.push({ x, y, z, rot: RX.range(0, 6.28), size, seed: RX(), tone: RX.range(0.45, 1) });
    const sunSide = (() => { const a = side(200, 1, { x: 0, z: 0 }), b = side(200, -1, { x: 0, z: 0 }); return (a.x - b.x) * sunDir.x + (a.z - b.z) * sunDir.z > 0 ? 1 : -1; })();
    // THE WINDTHROW: a third of the way in a gust has laid the grove open on the sun side for fifty metres: fallen stems,
    // ferns in the light that pours in along the floor, sheaves of rays. Beyond it the grove stands again, stem behind
    // stem into the blue-green fog, its crowns shut overhead: the forest is not seen out of before the parting.
    const RW = makeRng(hashSeed('bs-r7:' + ctx.seed));                      // a stream of its own for the windthrow and the watcher's perch
    const gap = (() => {
      const P = path.pointAt(0.335), T = path.tangentAt(0.335), h = Math.hypot(T.x, T.z) || 1, fx = T.x / h, fz = T.z / h, sx = -fz * sunSide, sz = fx * sunSide;
      const ang = 0.74, dx = fx * Math.cos(ang) + sx * Math.sin(ang), dz = fz * Math.cos(ang) + sz * Math.sin(ang), D = 74;
      return { px: P.x, pz: P.z, dx, dz, D, cx: P.x + dx * D, cz: P.z + dz * D, y: heightAt(P.x + dx * D, P.z + dz * D), W: 62, H: 44 };
    })();
    const inGap = (x, z) => {                                               // 0 outside the windthrow, else metres along it
      const ex = x - gap.px, ez = z - gap.pz, al = ex * gap.dx + ez * gap.dz, ac = Math.abs(ex * gap.dz - ez * gap.dx);
      return al > 13 && al < gap.D + 30 && ac < 4 + (al - 13) * 0.31 ? al : 0;
    };
    const gapRocks = [rI.length, 0];
    let sGapEnd = 0;                                                       // the windthrow's own far end: the station, in metres of the route, of the last of its blocks
    for (let k = 0; k < 7; k++) {
      const c = (k - 3) * 6.6 + RW.range(-2, 2), al = gap.D - 3.5 - RW.range(0, 3), x = gap.px + gap.dx * al + gap.dz * c, z = gap.pz + gap.dz * al - gap.dx * c, gy = heightAt(x, z), a = RW.range(1.4, 2.6);
      sGapEnd = Math.max(sGapEnd, path.nearestXZ(x, z).u * L);
      block(x, z, gy - 0.6, gy + RW.range(0.7, 1.7), a, a * RW.range(0.45, 0.7), Math.atan2(gap.dz, gap.dx) + 1.57 + RW.range(-0.4, 0.4), RW.range(0.05, 0.95), { tx: RW.range(-0.1, 0.1), tz: RW.range(-0.08, 0.08) });
      for (let i = 0; i < 4; i++) { const an = RW.range(0, 6.28), x2 = x + Math.cos(an) * (a + 0.5), z2 = z + Math.sin(an) * (a * 0.6 + 0.5); rockFerns.push({ x: x2, y: heightAt(x2, z2) - 0.05, z: z2, rot: RW.range(0, 6.28), size: RW.range(1.1, 1.8), seed: RW(), tone: RW.range(0.4, 1) }); }
    }
    gapRocks[1] = rI.length;
    // THE WATCHER: one of the troop sits on a leaning culm by the lane a quarter of the way in, at the height of our eyes
    // and three and a half metres off on the shade side (so its sunlit flank is toward us), and turns its head as we pass
    const watch = (() => {
      const P = path.pointAt(0.25), A = path.pointAt(0.25 + 24 / path.length);
      let fx = A.x - P.x, fz = A.z - P.z; const h = Math.hypot(fx, fz) || 1; fx /= h; fz /= h;
      const rx = fz * sunSide, rz = -fx * sunSide, a = 0.56, ca = Math.cos(a), sa = Math.sin(a);
      const sx = P.x + fx * 3.3 + rx * 1.5, sz = P.z + fz * 3.3 + rz * 1.5, sy = Math.max(P.y - 0.9, heightAt(sx, sz) + 1.0);
      let best = null;
      for (let q = 0.3; q < 2.2 && !best; q += 0.3) {                       // the stem rises toward us and away from the lane; it must not cross our way
        const hl = Math.hypot(1, q), hx = (-fx + q * rx) / hl, hz = (-fz + q * rz) / hl;
        let tS = 0; for (; tS < 30; tS += 0.25) if (sy - sa * tS < heightAt(sx - hx * ca * tS, sz - hz * ca * tS) - 0.2) break;
        let ok = true;
        for (let t = -tS; t < 15 && ok; t += 0.5) {
          const x = sx + hx * ca * t, z = sz + hz * ca * t, n = path.nearestXZ(x, z);
          if (Math.hypot(n.dist, sy + sa * t - path.pointAt(n.u).y) < 1.45) ok = false;
        }
        if (ok || q > 1.7) best = { hx, hz, tS };
      }
      return { fx, fz, rx, rz, a, sx, sy, sz, hx: best.hx, hz: best.hz, tS: best.tS, x0: sx - best.hx * ca * best.tS, y0: sy - sa * best.tS, z0: sz - best.hz * ca * best.tS };
    })();
    await ctx.yield();
    // THE HUDDLE'S OUTCROP, 8.6 m left of the lane: a broad foot, the bench the troop sits on, a taller block behind them
    const uLeap = 0.51;
    const ledge = { x: 0, z: 0 }, ledgeIn = new THREE.Vector3(), ledgeAlong = new THREE.Vector3();
    {
      const c = path.pointAt(uLeap + 8 / L), t = path.tangentAt(uLeap + 8 / L), h = Math.hypot(t.x, t.z) || 1;
      ledgeAlong.set(t.x / h, 0, t.z / h); ledgeIn.set(-t.z / h, 0, t.x / h);            // along the lane; from the ledge toward the lane
      ledge.x = c.x - ledgeIn.x * 8.6; ledge.z = c.z - ledgeIn.z * 8.6;
      const rot = Math.atan2(ledgeIn.z, ledgeIn.x), g0y = heightAt(ledge.x, ledge.z);
      const at = (a, b) => [ledge.x + ledgeIn.x * a + ledgeAlong.x * b, ledge.z + ledgeIn.z * a + ledgeAlong.z * b];
      let q = at(0.5, 0.2); slab(q[0], q[1], g0y - 0.9, g0y + 1.0, 3.3, 4.4, rot + 0.07, 0.77);
      q = at(0.25, 0); const bench = slab(q[0], q[1], g0y + 0.92, g0y + 1.72, 2.55, 3.5, rot - 0.05, 0.31);
      q = at(-1.75, 0.5); const back = slab(q[0], q[1], g0y + 0.6, g0y + 3.05, 1.45, 2.7, rot + 0.16, 0.58);
      q = at(-1.2, -2.9); slab(q[0], q[1], g0y + 0.4, g0y + 2.2, 1.3, 1.25, rot - 0.3, 0.13);
      q = at(3.1, -3.3); slab(q[0], q[1], g0y - 0.8, g0y + 0.55, 1.0, 0.85, rot + 0.5, 0.91);
      q = at(2.6, 4.2); slab(q[0], q[1], g0y - 0.8, g0y + 0.4, 0.9, 1.1, rot - 0.7, 0.45);
      ledge.top = bench.top; ledge.i0 = bench.i0; ledge.i1 = bench.i1;
      ledge.side = Math.sign(ledge.x - laneX(ledge.z)) || -1;
      solids.push([ledge.x, ledge.z, 4.4]);
      for (const [a, b, sz] of [[-1.7, 0.2, 1.0], [-1.9, 1.4, 0.8], [-1.3, -2.9, 0.75]]) { q = at(a, b); const y = rockY(back.i0, rI.length, q[0], q[1]); if (y > -1e8) fernAt(q[0], y - 0.05, q[1], sz); }
      for (let k = 0; k < 26; k++) {                                         // a collar of ferns round the foot (not between the troop and the lane)
        const an = k / 26 * 6.283 + RX.range(-0.1, 0.1), a = Math.cos(an) * RX.range(3.5, 4.6), b = Math.sin(an) * RX.range(4.6, 5.8);
        if (a > 2.2 && Math.abs(b) < 3.2) continue;
        q = at(a + 0.4, b); fernAt(q[0], heightAt(q[0], q[1]) - 0.05, q[1], RX.range(1.0, 1.7));
      }
      // keep the sight line from the lane to the ledge free of culms
      for (const du of [-0.034, -0.02, -0.008, 0.003]) { const e = path.pointAt(uLeap + du); for (let qq = 0.25; qq < 0.95; qq += 0.14) solids.push([lerp(e.x, ledge.x, qq), lerp(e.z, ledge.z, qq), 2.0]); }
    }
    await ctx.yield();
    // stones along the stream: on both banks and a few standing in the water at the ledges
    const streamHalf = (z) => (0.9 + 2.3 * sstep(3, 24, z)) * (1 - 0.3 * sstep(100, 118, z)) + 3.2 * poolK(z);
    const zEnd = zF + 17;                                                   // the pool drains through boulders here
    // (each a small wet block of the same stone, tipped: one bed, a broken corner)
    const stone = (cx, cz, sx, sy, sz, rot, k, lift) => {
      const gy = heightAt(cx, cz);
      block(cx, cz, gy - 0.35, gy + sy * (0.8 + lift), Math.max(sx, sz) * 1.05, Math.min(sx, sz) * 0.85, rot, (k * 0.6180339) % 1, { wet: 1, lite: true, tx: 0.2 * Math.sin(k * 1.7), tz: 0.18 * Math.cos(k * 2.3), chip: 0.38 });
    };
    for (let z = 6; z < zEnd - 2; z += R.range(2.2, 4.2)) {
      const sd = R.sign(), w = streamHalf(z) * 0.78, sx = R.range(0.45, 1.0), sz = R.range(0.4, 0.85), cx = laneX(z) + sd * (w + R.range(-0.25, 0.7));
      if (Math.abs(z - zF + 1) < 4) continue;
      stone(cx, z, sx, R.range(0.25, 0.42), sz, R.range(0, 6.28), 100 + z, 0.2);
      if (R.chance(0.45)) stone(laneX(z + 1.1) - sd * (w + R.range(-0.2, 0.9)), z + 1.1, R.range(0.35, 0.7), R.range(0.2, 0.34), R.range(0.3, 0.6), R.range(0, 6.28), 300 + z, 0.2);
    }
    const wetStones = [];                                                  // [x, z, r]: stones the water breaks round
    for (const z of [35.2, 36.2, 68.4, 69.3, 20, 52, 88]) {
      const cx = laneX(z) + R.range(-1.3, 1.3);
      stone(cx, z, R.range(0.55, 0.9), R.range(0.42, 0.55), R.range(0.5, 0.8), R.range(0, 6.28), 500 + z, 0.55);
      wetStones.push([cx, z, 0.62]);
    }
    await ctx.yield();
    // THE FALL at the head of the stream: the water comes through a notch in a band of red sandstone and drops 2 m into
    // the pool; tree ferns stand on the ledge either side of it
    const fall = { x: laneX(zF), z: zF, lipY: heightAt(laneX(zF - 1.6), zF - 1.6) + 0.5, poolY };
    const treeFerns = [];
    const treeFern = (x, z, y0, h, lean, size, tone) => {
      const o = gPos.length / 3;
      for (let j = 0; j <= 3; j++) for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283, r = 0.19 - 0.025 * j; gPos.push(x + Math.cos(a) * r + lean * j * 0.25, y0 + h * j / 3, z + Math.sin(a) * r); gRock.push(0.25); }
      for (let j = 0; j < 3; j++) for (let i = 0; i < 6; i++) { const a = o + j * 6 + i, b = o + j * 6 + (i + 1) % 6, c = a + 6, d = b + 6; gIdx.push(a, b, c, b, d, c); }
      treeFerns.push({ x: x + lean * 0.75, y: y0 + h - 0.15, z, rot: RX.range(0, 6.28), size, seed: RX(), tone });
    };
    {
      const lx = fall.x, bedTop = fall.lipY - 0.5, floor = poolY - 0.5;
      slab(lx, zF - 2.5, floor - 0.7, bedTop + 0.03, 3.1, 2.3, 0.04, 0.21, 1);                 // the lip the water runs over
      for (const sd of [-1, 1]) {
        const s0 = sd > 0 ? 0.37 : 0.66;
        // (one long ledge either side of the notch, a thick slab tilted on it, a thinner one leaning at its end:
        // joint-bounded blocks with dipping tops)
        block(lx + sd * 7.4, zF - 1.3, floor - 0.8, fall.lipY + 0.75, 4.7, 2.0, sd * 0.06, s0, { wet: 1, tx: sd * 0.035, tz: 0.03, chip: 0.2, beds: 4 });
        const up = block(lx + sd * 7.9, zF - 3.0, fall.lipY + 0.45, fall.lipY + 1.55 + (sd > 0 ? 0.3 : 0), 3.0, 1.7, -sd * 0.22, s0 + 0.2, { tx: -sd * 0.15, tz: 0.08, chip: 0.36, beds: 2 });
        block(lx + sd * 11.4, zF + 0.1, floor + 0.1, fall.lipY - 0.1, 2.2, 1.1, sd * 0.5, s0 + 0.31, { tx: sd * 0.2, tz: -0.07, chip: 0.32, beds: 2 });
        block(lx + sd * 13.0, zF - 0.9, heightAt(lx + sd * 13.0, zF + 1.2) - 0.6, heightAt(lx + sd * 13.0, zF - 2.2) + 0.5, 2.3, 1.5, sd * 0.25, s0 + 0.12, { tx: -sd * 0.06, tz: 0.04 });
        block(lx + sd * 16.2, zF - 0.4, heightAt(lx + sd * 16.2, zF + 1.2) - 0.6, heightAt(lx + sd * 16.2, zF - 2.0) + 0.15, 1.7, 1.2, -sd * 0.35, s0 + 0.48, { tx: sd * 0.08, tz: -0.05 });
        slab(lx + sd * 3.6, zF + 2.4, floor - 0.6, poolY + 0.45, 1.0, 0.9, sd * 0.7, s0 + 0.43, 1);   // a fallen block in the pool
        // blocks choking the foot of the pool (the water finds its way out between them)
        slab(lx + sd * 2.1, zF + 15.2 + sd * 0.8, floor - 0.6, poolY + 0.7 + sd * 0.25, 1.7, 1.3, sd * 0.5 + 0.3, s0 + 0.07, 1);
        slab(lx + sd * 5.2, zF + 12.6, floor - 0.2, poolY + 0.55, 1.2, 1.0, -sd * 0.6, s0 + 0.53, 1);
        solids.push([lx + sd * 2.1, zF + 15.2, 2.3]);
        solids.push([lx + sd * 6.3, zF - 1.6, 4.6], [lx + sd * 9.8, zF - 0.2, 2.4]);
        // tree ferns: one on the upper block, one behind it, one at the pool's edge
        treeFern(lx + sd * 7.6, zF - 2.8, up.top - 0.2, RX.range(1.5, 2.0), sd * 0.2, RX.range(3.3, 3.9), RX.range(0.7, 1));
        treeFern(lx + sd * (10.6 + RX.range(0, 1.5)), zF - 4.5, heightAt(lx + sd * 11, zF - 4.5) - 0.2, RX.range(2.4, 3.1), -sd * 0.15, RX.range(3.4, 4.0), RX.range(0.55, 0.9));
        await ctx.yield();
        if (sd * (K.x - Fd.x * 16 - lx) < 0) treeFern(lx + sd * (7.6 + RX.range(0, 0.8)), zF + 4.5, heightAt(lx + sd * 7.9, zF + 4.5) - 0.2, RX.range(1.7, 2.3), sd * 0.3, RX.range(3.0, 3.6), RX.range(0.6, 1));   // one at the pool's edge, on the far side from the lane
        for (let k = 0; k < 9; k++) {                                         // ferns along the foot of the ledge and on its shoulder
          const x = lx + sd * RX.range(3.2, 11.5), z = zF + RX.range(-0.6, 2.2), y = Math.max(rockY(0, rI.length, x, z), heightAt(x, z));
          if (Math.abs(x - lx) < streamHalf(z) + 0.4) continue;
          fernAt(x, y - 0.05, z, RX.range(0.9, 1.5));
        }
      }
    }
    await ctx.yield();
    // the banks of the pool below the fall, both alike: ferns thick over the litter for 13 m back from the water, from
    // the foot of the fall to 30 m down the stream, and three bedded stones on each (none within 4 m of the lane).
    // They are dealt from a stream of their own (RPb), so the windthrow's stream (RW) goes on to the boulders of the
    // gully head and the stand behind the fall as if the banks were not there
    const RPb = makeRng(hashSeed('bs-poolbanks:' + ctx.seed));
    for (const sd of [-1, 1]) {
      for (let k = 0; k < 95; k++) {
        const z = zF + RPb.range(1, 30), d = RPb.range(1.2, 13), sz = RPb.range(1.2, 2.0), rot = RPb.range(0, 6.28), fs = RPb(), tone = RPb.range(0.5, 1);
        const x = laneX(z) + sd * (Math.max(3.0, streamHalf(z) + 0.6) + d);
        rockFerns.push({ x, y: heightAt(x, z) - 0.05, z, rot, size: sz, seed: fs, tone });
      }
      for (const [dz, d, sx] of [[9, 6.5, 1.5], [17, 9.5, 1.9], [25, 13, 1.4]]) {
        const z = zF + dz, x = laneX(z) + sd * (streamHalf(z) + d), gy = heightAt(x, z), rot = RPb.range(0, 6.28), bs = RPb.range(0.05, 0.95), tx = RPb.range(-0.1, 0.1), tz = RPb.range(-0.1, 0.1);
        if (path.nearestXZ(x, z).dist < 4) continue;
        block(x, z, gy - 0.5, gy + 0.55 * sx, sx, sx * 0.62, rot, bs, { tx, tz });
        solids.push([x, z, sx]);
      }
    }
    await ctx.yield();
    // THE MONKEY ROCK in the slalom, on the shade side of the lane, in a shaft, three of the troop on it. An outcrop the
    // joints have opened: a long bench, a bigger block askew on its far half, a third lying across that and hanging out
    // toward us, a slab fallen against the near end and two more at the foot. Bare bedding planes, moss in patches,
    // ferns in the cracks. (b of atc() runs back down the lane toward the camera whichever side the sun is on.)
    const mRock = { x: 0, z: 0, seats: [] };
    const RB = makeRng(hashSeed('bs-blocks:' + ctx.seed));
    const fernB = (x, y, z, size) => rockFerns.push({ x, y, z, rot: RB.range(0, 6.28), size, seed: RB(), tone: RB.range(0.45, 1) });
    {
      const sR = 0.16 * L + 12.5, e = side(sR, -sunSide * 9.8, { x: 0, z: 0 }), c = side(sR, 0, { x: 0, z: 0 }), dl = Math.hypot(c.x - e.x, c.z - e.z) || 1;
      const ix = (c.x - e.x) / dl, iz = (c.z - e.z) / dl, rot = Math.atan2(iz, ix), gy = heightAt(e.x, e.z), tc = sunSide;
      const at = (a, b) => [e.x + ix * a - iz * b, e.z + iz * a + ix * b], atc = (a, b) => at(a, b * tc);
      const B = (a, b, y0, y1, sx, sz, r, seed, txa, tzc, o) => { const q = atc(a, b); return block(q[0], q[1], gy + y0, gy + y1, sx, sz, rot + r * tc, seed, { tx: txa, tz: tzc * tc, ...o }); };
      mRock.x = e.x; mRock.z = e.z; mRock.inx = ix; mRock.inz = iz; mRock.i0 = rI.length;
      const s1 = B(0.5, 0.4, -0.9, 1.3, 2.7, 4.3, 0.1, 0.52, 0.03, -0.025, { chip: 0.12 });
      const s2 = B(-1.5, -1.4, 1.15, 3.0, 1.8, 3.0, -0.38, 0.83, -0.05, 0.05);
      const s3 = B(-0.9, 1.0, 2.82, 4.3, 2.0, 1.25, 0.45, 0.17, 0.03, 0.1, { under: true });
      B(1.1, 5.0, -0.7, 1.0, 1.6, 0.85, 0.75, 0.64, 0, -0.24);
      B(-2.9, 2.7, -0.6, 2.1, 1.2, 1.5, -0.5, 0.29, 0.05, 0.03);
      B(3.4, -3.1, -0.5, 0.62, 1.0, 0.62, 0.3, 0.41, -0.1, 0.05);
      mRock.i1 = rI.length; mRock.y = gy; mRock.top = s3.top;
      // seats: two at the near end of the bench, one on the far block (found on the rock itself: its lane-side edge, then in a little)
      for (const [sl, b, back] of [[s1, 2.15, 0.8], [s1, 0.15, 0.85], [s2, -2.5, 0.7]]) {
        let a = 4.8, q = null; for (; a > -3; a -= 0.1) { q = atc(a, b); if (rockY(sl.i0, sl.i1, q[0], q[1]) > -1e8) break; }
        q = atc(a - back, b); const y = rockY(sl.i0, sl.i1, q[0], q[1]); mRock.seats.push([q[0], y > -1e8 ? y : sl.top, q[1]]);
      }
      solids.push([e.x, e.z, 4.6]);
      const top = (q) => Math.max(rockY(mRock.i0, mRock.i1, q[0], q[1]), heightAt(q[0], q[1]));
      // ferns in the cracks: at the foot of the far block, under the overhang, behind the top block, by the fallen slab
      for (const [a, b, k] of [[0.3, -1.9, 1.2], [-0.5, 2.3, 1.25], [-2.5, 0.0, 1.1], [0.2, 3.9, 1.3]]) { const q = atc(a, b), sz = RX.range(0.7, 1.0) * k; fernAt(q[0], top(q) - 0.05, q[1], sz); }
      for (let k = 0; k < 22; k++) { const an = k / 22 * 6.283, a = Math.cos(an) * RX.range(3.7, 4.8), b = Math.sin(an) * RX.range(4.0, 5.2); if (a > 2.0 && Math.abs(b) < 2.6) continue; const q = at(a, b); fernAt(q[0], top(q) - 0.05, q[1], RX.range(1.0, 1.7)); }
      for (const [a, b, k] of [[2.3, 4.2, 1.1], [-1.5, 4.9, 1.4], [-3.9, 1.0, 1.3], [-3.3, -3.6, 1.5], [2.6, -4.6, 1.2], [-1.0, -1.0, 0.9]]) { const q = atc(a, b); fernB(q[0], top(q) - 0.05, q[1], k); }
      for (let qq = 0.2; qq < 0.95; qq += 0.15) for (const ds of [-16, -8, 0]) { const v = side(sR + ds, 0, { x: 0, z: 0 }); solids.push([lerp(v.x, e.x, qq), lerp(v.z, e.z, qq), 1.8]); }
    }
    await ctx.yield();
    // THE GREAT CLUMP is the clump the lane's third swing goes round: it stands on the inside of that swing, moved out
    // from the lane until no point of the route is nearer than 7 m. Thirteen veteran culms rising together from one mossy
    // stool and fanning apart, a round-backed boulder of sandstone at its foot and a lower one before it, all in a sheaf
    // of rays. Its stones are laid here; the culms are planted last of all.
    const early = [];                                                      // [i0, i1) of rocks whose nearest station on the route lies before the windthrow's far end (sGapEnd)
    const big = { x: 0, z: 0 };
    {
      const [sA, oA] = apex[2], outA = -Math.sign(oA) * sgn, e = { x: 0, z: 0 };       // (outA: the hand of the forest line the swing's own clump stands on)
      for (let off = (oA - Math.sign(oA) * 5.3) * sgn, tries = 0; tries < 40; tries++, off += outA * 0.4) { const q0 = fpt(sA, off); e.x = q0[0]; e.z = q0[1]; if (path.nearestXZ(e.x, e.z).dist >= 7) break; }
      const nG = path.nearestXZ(e.x, e.z), c = path.pointAt(nG.u), tG = path.tangentAt(nG.u), tl = Math.hypot(tG.x, tG.z) || 1, dl = Math.hypot(c.x - e.x, c.z - e.z) || 1, sG = nG.u * L;
      const ix = (c.x - e.x) / dl, iz = (c.z - e.z) / dl, bx = tG.x / tl, bz = tG.z / tl;       // (ix, iz): toward the lane, at its nearest; (bx, bz): on along the lane
      const gy = heightAt(e.x, e.z), rot = Math.atan2(iz, ix), i0 = rI.length;
      const P = (a, b) => [e.x + ix * a + bx * b, e.z + iz * a + bz * b];
      // (its stone is a boulder that has lain there longer than the clump has stood: broad, round-backed, capped in
      // moss, ferns in its lee; a smaller one beside it and two cobbles in the litter. Nothing sits on it.)
      let q = P(2.7, 0.7); const slabT = boulder(q[0], q[1], gy - 0.8, gy + 2.15, 2.5, 1.9, rot + 0.3, 0.37, { na: 22, nr: 9, tx: -0.1, tz: 0.05 });
      q = P(3.2, 3.6); const tableT = boulder(q[0], q[1], gy - 0.5, gy + 1.1, 1.5, 1.15, rot - 0.5, 0.71, { tx: 0.06, tz: -0.08 });
      q = P(0.7, 3.9); boulder(q[0], q[1], gy - 0.3, gy + 0.55, 0.75, 0.6, rot + 0.8, 0.13);
      q = P(4.6, -1.5); boulder(q[0], q[1], gy - 0.3, gy + 0.5, 0.7, 0.5, rot - 1.0, 0.55);
      early.push([i0, rI.length]);
      for (const [a, b, sz] of [[3.6, 2.2, 1.3], [1.9, -0.9, 1.5], [4.6, 0.4, 1.1], [2.2, 2.4, 0.9], [3.4, -1.2, 1.2], [4.4, 3.2, 1.0]]) { q = P(a, b); const y = Math.max(rockY(i0, rI.length, q[0], q[1]), heightAt(q[0], q[1])); rockFerns.push({ x: q[0], y: y - 0.08, z: q[1], rot: RGc.range(0, 6.28), size: sz, seed: RGc(), tone: RGc.range(0.5, 1) }); }
      big.x = e.x; big.z = e.z; big.y = gy; big.ix = ix; big.iz = iz; big.bx = bx; big.bz = bz; big.s = sG; big.slab = slabT; big.table = tableT;
      for (let k = 0; k < 16; k++) {                                         // ferns round the stool and the stones (not between them and the lane)
        const an = k / 16 * 6.283 + RGc.range(-0.15, 0.15), rr = RGc.range(2.6, 4.4), a = Math.cos(an) * rr, b = Math.sin(an) * rr, rot = RGc.range(0, 6.28), size = RGc.range(1.2, 1.9), seed = RGc(), tone = RGc.range(0.5, 1);
        if (a > 1.2 && b > -1.5) continue;
        q = P(a, b); rockFerns.push({ x: q[0], y: heightAt(q[0], q[1]) - 0.05, z: q[1], rot, size, seed, tone });
      }
    }
    await ctx.yield();
    // THE LOOSE ROCKS of the gully and the slalom: each a tilted block of the same bedded stone (the long ones with a
    // second piece split off beside them), ferns at the foot. None within sight of the fall: its own ledge is the rock there
    // wet stones standing in the spate (dark, angular, tipped downstream), most just below the ledges
    const wetBlocks = () => {
      for (const z0 of [12, 22, 29, 41.5, 43.5, 47, 58, 64, 74.5, 76.5, 81, 93, 101, 108, 115]) {
        const z = z0 + RB.range(-1, 1), w = streamHalf(z), x = laneX(z) + RB.range(-0.72, 0.72) * w, r = RB.range(0.4, 0.78), wy = waterY(z);
        block(x, z, wy - 0.6, wy + RB.range(0.12, 0.34) * 1.25 + 0.04, r * 1.1, r * RB.range(0.6, 0.85), RB.range(0, 6.28), RB.range(0.05, 0.95), { wet: 1, lite: true, tx: RB.range(-0.15, 0.15), tz: RB.range(0.05, 0.22), chip: 0.4 });
        wetStones.push([x, z, r * 0.9]);
      }
    };
    let rSplit = 0;                                                        // rocks from here on in rI lie at the gully head (z < 5): a mesh of their own, drawn up the climb
    for (let pass = 0; pass < 2; pass++) {
    if (pass === 1) { await ctx.yield(); wetBlocks(); rSplit = rI.length; }
    for (let n = 0; n < lumps.length; n++) {
      const [cx, cz, sx, sy, sz, r0, k] = lumps[n], gy = heightAt(cx, cz), a = Math.max(sx, sz) * 0.92, el = RB.range(1.5, 2.1), h = sy * 1.3 + 0.3;
      const tx = RB.range(0.04, 0.13) * RB.sign(), tz = RB.range(-0.08, 0.08), sd = RB.range(0.05, 0.95), near = Math.hypot(cx - fall.x, cz - zF) < 40 || cz > zF - 38;
      const ang = r0 + RB.range(0.9, 1.6) * RB.sign(), fz = [RB.range(0, 6.28), RB.range(0, 6.28), RB.range(0, 6.28), RB.range(0, 6.28)];
      if (pass === 0 ? cz < 5 : cz >= 5) continue;
      if (near) { for (let i = 0; i < 4; i++) { const x = cx + Math.cos(fz[i]) * a * 0.55, z = cz + Math.sin(fz[i]) * a * 0.55; fernB(x, heightAt(x, z) - 0.05, z, 1.2 + 0.1 * i); } continue; }
      const iL = rI.length;
      const stone = cz < 5 ? boulder : block;                                // (at the gully head they are boulders, weathered round under moss; down the stream, bedded blocks)
      stone(cx, cz, gy - 0.7, gy + h * (cz < 5 ? 0.85 : 1), a, a / el, r0, sd, { tx, tz });
      if (a > 1.7) { const d = a / el + 0.45, x = cx + Math.cos(ang) * d, z = cz + Math.sin(ang) * d; stone(x, z, heightAt(x, z) - 0.6, heightAt(x, z) + h * 0.5, a * 0.5, a * 0.36, ang + 0.4, (sd + 0.37) % 1, { tx: -tx * 1.8, tz: 0.12 }); }
      if (pass === 0 && path.nearestXZ(cx, cz).u * L < sGapEnd) early.push([iL, rI.length]);
      for (let i = 0; i < 3; i++) { const x = cx + Math.cos(fz[i]) * (a * 0.8 + 0.4), z = cz + Math.sin(fz[i]) * (a / el + 0.5); fernB(x, heightAt(x, z) - 0.05, z, 1.0 + 0.15 * i); }
      if ((n & 7) === 7) await ctx.yield();
    }
    }
    await ctx.yield();
    // a few dry stones on the floor of the lane at the gully head

    for (let k = 0; k < 7; k++) {
      const z = -42 + k * 6.6 + RB.range(-2, 2), x = laneX(z) + RB.sign() * RB.range(1.9, 3.6), gy = heightAt(x, z), r = RB.range(0.45, 0.85);
      boulder(x, z, gy - 0.3, gy + RB.range(0.3, 0.6), r * 1.15, r * 1.15 * RB.range(0.6, 0.85), RB.range(0, 6.28), RB.range(0.05, 0.95), { na: 12, nr: 6, tx: RB.range(-0.14, 0.14), tz: RB.range(-0.14, 0.14) });
      const a = RB.range(0, 6.28); fernB(x + Math.cos(a) * (r + 0.3), gy - 0.05, z + Math.sin(a) * (r + 0.3), RB.range(0.8, 1.1));
    }
    // the head of the gully (u 0.57 to 0.64): mossed boulders lying in the litter either side of the lane, tall ferns round them
    {
      const o2 = { x: 0, z: 0 };
      for (let k = 0; k < 7; k++) {
        const sd = k % 2 ? 1 : -1, sK = (0.572 + 0.011 * k + RW.range(-0.002, 0.002)) * path.length, a = RW.range(1.0, 1.7), rot = RW.range(0, 6.28), sdd = RW.range(0.05, 0.95), hh = RW.range(0.6, 1.25), lat = RW.range(2.9, 4.5);
        side(sK, sd * lat, o2);
        const x = o2.x, z = o2.z, gy = heightAt(x, z);
        if (path.nearestXZ(x, z).dist < 2.6 || (z > 0 && Math.abs(x - laneX(z)) < streamHalf(z) + 1.6)) continue;
        boulder(x, z, gy - 0.45, gy + hh * 0.85, a * 1.05, a * 0.74, rot, sdd, { tx: RW.range(-0.1, 0.1), tz: RW.range(-0.1, 0.1) });
        for (let i = 0; i < 4; i++) { const an = rot + i * 1.57 + 0.6, rr = a * 0.9 + 0.5; rockFerns.push({ x: x + Math.cos(an) * rr, y: gy - 0.05, z: z + Math.sin(an) * rr, rot: RW.range(0, 6.28), size: 1.25 + 0.2 * i, seed: RW(), tone: RW.range(0.45, 1) }); }
      }
    }
    await ctx.yield();
    await ctx.yield();
    for (let k = 0; k < 12; k++) {
      const z = 18 + k * 9.5 + R.range(-3, 3), sd = k % 2 ? 1 : -1, x = laneX(z) + sd * R.range(7.6, 10.5), h = R.range(1.9, 2.7), y0 = heightAt(x, z) - 0.2;
      const lean = R.range(-0.25, 0.25), rot = R.range(0, 6.28), size = R.range(3.0, 4.0), seed = R(), tone = R.range(0.5, 1);
      if (Math.hypot(x - ledge.x, z - ledge.z) < 7 || (sd === ledge.side && z > ledge.z - 6 && z < ledge.z + 36) || z > zF - 9) continue;
      treeFern(x, z, y0, h, lean, size, tone);
      solids.push([x, z, 1.2]);
    }
    await ctx.yield();
    let rocks = null, rocksB = null, rocksA = null;
    {
      // the ground and its boulders: typed arrays, and the normals summed here a slice at a time (no long step)
      const nV = gPos.length / 3, pos = new Float32Array(gPos), nrm = new Float32Array(nV * 3), idx = new Uint32Array(gIdx);
      await ctx.yield();
      for (let k = 0; k < idx.length; k += 3) {
        const a = idx[k] * 3, b = idx[k + 1] * 3, c = idx[k + 2] * 3;
        const e1x = pos[b] - pos[a], e1y = pos[b + 1] - pos[a + 1], e1z = pos[b + 2] - pos[a + 2], e2x = pos[c] - pos[a], e2y = pos[c + 1] - pos[a + 1], e2z = pos[c + 2] - pos[a + 2];
        const nx = e1y * e2z - e1z * e2y, ny = e1z * e2x - e1x * e2z, nz = e1x * e2y - e1y * e2x;
        nrm[a] += nx; nrm[a + 1] += ny; nrm[a + 2] += nz; nrm[b] += nx; nrm[b + 1] += ny; nrm[b + 2] += nz; nrm[c] += nx; nrm[c + 1] += ny; nrm[c + 2] += nz;
        if ((k % 18000) === 17997) await ctx.yield();
      }
      for (let i = 0; i < nV; i++) { const o = i * 3, l = Math.hypot(nrm[o], nrm[o + 1], nrm[o + 2]) || 1; nrm[o] /= l; nrm[o + 1] /= l; nrm[o + 2] /= l; }
      await ctx.yield();
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      g.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
      g.setAttribute('aRock', new THREE.BufferAttribute(new Float32Array(gRock), 1));
      g.setIndex(new THREE.BufferAttribute(idx, 1));
      const ground = new THREE.Mesh(g, hero.groundMaterial()); ground.frustumCulled = false; scene.add(ground);
      await ctx.yield();
      const rg = new THREE.BufferGeometry();
      rg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(rP), 3));
      rg.setAttribute('aK', new THREE.BufferAttribute(new Float32Array(rK), 4));
      await ctx.yield();
      {                                                                      // (the smooth normals, summed a slice at a time)
        const rp = rg.attributes.position.array, rn = new Float32Array(rp.length);
        for (let k = 0; k < rI.length; k += 3) {
          const a = rI[k] * 3, b = rI[k + 1] * 3, c = rI[k + 2] * 3;
          const e1x = rp[b] - rp[a], e1y = rp[b + 1] - rp[a + 1], e1z = rp[b + 2] - rp[a + 2], e2x = rp[c] - rp[a], e2y = rp[c + 1] - rp[a + 1], e2z = rp[c + 2] - rp[a + 2];
          const nx = e1y * e2z - e1z * e2y, ny = e1z * e2x - e1x * e2z, nz = e1x * e2y - e1y * e2x;
          rn[a] += nx; rn[a + 1] += ny; rn[a + 2] += nz; rn[b] += nx; rn[b + 1] += ny; rn[b + 2] += nz; rn[c] += nx; rn[c + 1] += ny; rn[c + 2] += nz;
          if ((k % 30000) === 29997) await ctx.yield();
        }
        for (let i = 0; i < rn.length; i += 3) { const l = Math.hypot(rn[i], rn[i + 1], rn[i + 2]) || 1; rn[i] /= l; rn[i + 1] /= l; rn[i + 2] /= l; }
        rg.setAttribute('normal', new THREE.BufferAttribute(rn, 3));
      }
      await ctx.yield();
      const rgB = new THREE.BufferGeometry(), rgA = new THREE.BufferGeometry(), rmat = rockMaterial(U);
      for (const k of ['position', 'aK', 'normal']) { rgB.setAttribute(k, rg.attributes[k]); rgA.setAttribute(k, rg.attributes[k]); }
      early.push([gapRocks[0], gapRocks[1]], [mRock.i0, mRock.i1]); early.sort((a, b) => a[0] - b[0]);
      const iA = [], iR = []; let at0 = 0;
      for (const [a, b] of early) { for (let k = at0; k < a; k++) iR.push(rI[k]); for (let k = a; k < b; k++) iA.push(rI[k]); at0 = b; }
      for (let k = at0; k < rSplit; k++) iR.push(rI[k]);
      rgB.setIndex(rI.slice(rSplit)); rg.setIndex(iR); rgA.setIndex(iA);
      rocks = new THREE.Mesh(rg, rmat); rocks.frustumCulled = false; scene.add(rocks);
      rocksB = new THREE.Mesh(rgB, rmat); rocksB.frustumCulled = false; scene.add(rocksB);
      rocksA = new THREE.Mesh(rgA, rmat); rocksA.frustumCulled = false; scene.add(rocksA);
    }
    await ctx.yield();

    // ---------------- bamboo along the whole path: same culms, plumes and wind as the hero, in chunks ----------------
    const cellSz = 1.5, occ = new Map();
    const free = (x, z, min) => {
      const gx = Math.floor(x / cellSz), gz = Math.floor(z / cellSz);
      for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) { const b = occ.get((gx + i + 8192) * 16384 + gz + j + 8192); if (b) for (const c of b) if ((c[0] - x) ** 2 + (c[1] - z) ** 2 < min * min) return false; }
      for (const q of solids) if ((q[0] - x) ** 2 + (q[1] - z) ** 2 < (q[2] + 0.4) ** 2) return false;
      return true;
    };
    const put = (x, z) => { const k = (Math.floor(x / cellSz) + 8192) * 16384 + Math.floor(z / cellSz) + 8192; let b = occ.get(k); if (!b) { b = []; occ.set(k, b); } b.push([x, z]); };
    const inHero = (x, z) => Math.hypot(x, z) < 54.5;
    const inStream = (x, z) => z > 0 && z < zEnd + 2 && Math.abs(x - laneX(z)) < Math.max(3.3, streamHalf(z) + 1.3);
    const wet = (x, z) => z < zEnd + 1 && Math.abs(x - laneX(z)) < Math.max(3.0, streamHalf(z) + 0.4);
    const inRock = (x, z) => { for (const q of solids) if (q[2] > 2.2 && (q[0] - x) ** 2 + (q[1] - z) ** 2 < (q[2] - 0.5) ** 2) return true; return false; };
    const sForest = uOf(laneX(42), 42) * L, CH = 52, nCh = Math.ceil(sForest / CH);
    const chunkLists = []; for (let i = 0; i < nCh; i++) chunkLists.push({ culms: [], ferns: [], fNear: [], fFar: [] });
    const chunkOf = (s) => chunkLists[clamp(Math.floor(s / CH), 0, nCh - 1)];
    // the clumps the lane swings round; the Old Clump stands on the entry axis in its own shaft
    const clumps = [];
    apex.forEach(([s, o], i) => {
      const off = i === 0 ? 0 : (o - Math.sign(o) * 5.3) * sgn, c = fpt(s, off), n = i === 0 ? 7 : 5, rad = i === 0 ? 0.95 : 0.75;
      clumps.push({ x: c[0], z: c[1], s });
      for (let k = 0; k < n; k++) {
        const a = k / n * 6.283 + R.range(-0.3, 0.3), rr = k === 0 ? 0 : rad * R.range(0.75, 1), x = c[0] + Math.cos(a) * rr, z = c[1] + Math.sin(a) * rr;
        const it = { x, z, near: true, r: i === 0 ? 0.12 : R.range(0.075, 0.086), h: R.range(24.5, 27), age: R.range(0.62, 0.95), lean: R.range(0.03, 0.1) };
        if (i === 0) { it.r = 0.082 + 0.008 * ((k * 0.618) % 1); it.h = Math.min(it.h, 26); it.lean = k === 0 ? 0.02 : it.lean * 1.5; it.leanAz = a; }       // (the Old Clump: seven veterans 18 cm thick, fanning apart from one stool)
        chunkOf(s).culms.push(it); put(x, z);
      }
    });
    const o3 = { x: 0, z: 0 };
    for (let i = 0; i < nCh; i++) {
      const cl = chunkLists[i], s0 = i * CH, s1 = Math.min(s0 + CH, sForest + 10);
      const tryPut = (d0, d1, pw, minPath, spacing, extra) => {
        const s = R.range(s0, s1), d = (d0 + (d1 - d0) * Math.pow(R(), pw)) * R.sign(); side(s, d, o3);
        const x = o3.x, z = o3.z;
        if (inHero(x, z) || inStream(x, z) || Math.hypot(x - entry.x, z - entry.z) < 16) return;
        if (path.nearestXZ(x, z).dist < minPath || !free(x, z, spacing)) return;
        cl.culms.push({ x, z, ...extra }); put(x, z);
      };
      const dF = Math.min(density, 1.1), nN = Math.round(112 * dF), nF = Math.round(166 * dF * (0.6 + 0.4 * detail)), nW = Math.round(60 * (0.5 + 0.5 * detail));
      for (let k = 0; k < nN * 3 && cl.culms.length < nN; k++) tryPut(5.4, 14.4, 1.25, 5.3, 1.25, { near: true });
      const base = cl.culms.length;
      for (let k = 0; k < nF * 3 && cl.culms.length < base + nF; k++) tryPut(14, 50, 0.9, 13, 1.5, { near: false });
      for (let k = 0; k < nW; k++) tryPut(50, 84, 1, 40, 2, { near: false });
      for (let k = 0; k < 3; k++) tryPut(8, 26, 1, 7.8, 1.2, { near: false, age: 1.25, h: R.range(13, 19), r: 0.055, lean: R.range(0.55, 0.95), stiff: 0.3 });
      if (season === 'spring') for (let k = 0; k < 26; k++) tryPut(3.5, 16, 1, 3.2, 0.8, { near: false, age: 1.13, h: R.range(1, 5), r: R.range(0.05, 0.075), lean: 0.02, stiff: 0.2 });
      // ferns: thick under and beside the lane
      const nFern = Math.round(430 * (0.5 + 0.5 * detail) * (0.8 + 0.2 * density));
      for (let k = 0; k < nFern; k++) {
        const s = R.range(s0, s1), d = (0.3 + 30 * Math.pow(R(), 1.7)) * R.sign(); side(s, d, o3);
        const x = o3.x, z = o3.z;
        if (inHero(x, z) || wet(x, z)) continue;
        cl.ferns.push({ x, y: 0, z, rot: R.range(0, 6.28), size: R.range(0.9, 1.8), seed: R(), tone: R() });
      }
      // (the loop above only keeps the random sequence of the first build.) The fern layer: knee-deep and near-continuous
      // under and beside the lane, broken by the litter paths the ground shader draws; sparser and simpler further off
      const nA = Math.round(620 * (0.5 + 0.5 * detail) / Math.max(1, density)), nB = Math.round(300 * (0.5 + 0.5 * detail) / Math.max(1, density));
      for (let k = 0; k < nA * 3 && cl.fNear.length < nA; k++) {
        const s = RX.range(s0, s1), d = (0.2 + 12.3 * Math.pow(RX(), 1.25)) * RX.sign(); side(s, d, o3);
        const x = o3.x, z = o3.z;
        if ((k % 1000) === 999) await ctx.yield();
        if (inHero(x, z) || wet(x, z) || fernCover(x, z) < 0.5 || inRock(x, z)) continue;
        cl.fNear.push({ x, y: heightAt(x, z) - 0.06, z, rot: RX.range(0, 6.28), size: RX.range(1.0, 1.75), seed: RX(), tone: RX() });
      }
      for (let k = 0; k < nB * 3 && cl.fFar.length < nB; k++) {
        const s = RX.range(s0, s1), d = (12.5 + 24 * Math.pow(RX(), 1.2)) * RX.sign(); side(s, d, o3);
        const x = o3.x, z = o3.z;
        if ((k % 1000) === 999) await ctx.yield();
        if (inHero(x, z) || wet(x, z) || fernCover(x, z) < 0.5 || inRock(x, z)) continue;
        cl.fFar.push({ x, y: heightAt(x, z) - 0.06, z, rot: RX.range(0, 6.28), size: RX.range(1.3, 2.2), seed: RX(), tone: RX() });
      }
      await ctx.yield();
    }
    const treeFernMesh = hero.addFerns(treeFerns); scene.add(treeFernMesh);
    const rockFernMesh = hero.addFerns(rockFerns); scene.add(rockFernMesh);
    // taro at the water's edge: round the pool, at the foot of the fall and by the two lower ledges
    let taro = null;
    {
      const list = [], RT = makeRng(hashSeed('bs-taro:' + ctx.seed));
      const plant = (x, z, n, k) => {
        if (path.nearestXZ(x, z).dist < 3.4) return;
        const y = heightAt(x, z) - 0.05, a0 = RT.range(0, 6.28);
        for (let i = 0; i < n; i++) list.push({ x: x + RT.range(-0.15, 0.15), y, z: z + RT.range(-0.15, 0.15), yaw: a0 + i * 6.283 / n + RT.range(-0.35, 0.35), h: RT.range(0.85, 1.6) * k, size: RT.range(0.75, 1.15) * k, seed: RT() });
      };
      for (let k = 0; k < 15; k++) { const a = k / 15 * 6.283 + RT.range(-0.15, 0.15), r = RT.range(6.0, 7.4); plant(fall.x + Math.cos(a) * r, zF + 7 + Math.sin(a) * r * 1.05, 4 + (k % 3), 1); }
      for (const sd of [-1, 1]) { plant(fall.x + sd * 3.9, zF + 3.6, 5, 1.15); plant(fall.x + sd * 5.6, zF + 2.6, 4, 0.9); }
      for (const z of [34.5, 41, 67, 75, 96]) for (const sd of [-1, 1]) plant(laneX(z) + sd * (streamHalf(z) + RT.range(0.9, 1.8)), z + RT.range(-1.5, 1.5), 4, RT.range(0.8, 1.05));
      taro = taroMesh(U, list); scene.add(taro);
    }
    // The grove is not one wall of stalks: a quarter of the way in a whole clump has come down across the lane and hangs
    // in its neighbours, straw-pale in the rays (we pass under it); 40 m on two more fell across each other and tore a
    // clearing on the sun side, open to the sky.
    // (Taken out of the lists after they were laid, so every draw of the first build is still made in its order.)
    const sFallA = 0.25 * L + 27, sGlen = Math.max(0.3 * L + 38, sFallA + 42);
    const glen = side(sGlen, sunSide * 12.5, { x: 0, z: 0 }), GLEN_R = 10.5;
    const windfall = [];                                           // { foot, toward (unit xz), tilt from upright, h, culms }
    // THE FALL'S OWN CLEARING: no culm stands within FALL_CLEAR of the fall, measured from the fall itself in the world,
    // on both banks alike: the white water, the head of the pool and the near end of the ledge on either side of it lie
    // in that round.
    const FALL_CLEAR = 7.5;
    {
      const lay = (sd, off, yaw, tilt, h, n) => {
        const f = side(sd, off, { x: 0, z: 0 }), c = side(sd, 0, { x: 0, z: 0 }), dl = Math.hypot(c.x - f.x, c.z - f.z) || 1;
        const dx = (c.x - f.x) / dl, dz = (c.z - f.z) / dl, cy = Math.cos(yaw), sy = Math.sin(yaw);
        windfall.push({ x: f.x, z: f.z, dx: dx * cy - dz * sy, dz: dx * sy + dz * cy, tilt, h, n });
      };
      lay(sFallA, -sunSide * 11.5, 0.36, 0.98, 31, 5);              // from the shade side, so the sun catches its upper face
      lay(sGlen - 7, sunSide * 14, -0.3, 0.92, 32, 3);
      lay(sGlen + 8, -sunSide * 12.5, 0.4, 1.05, 29, 3);
      // one more clump down across the lane, at the apex of a swing of the slalom: the swing is drawn by seed, from the
      // windfall's own stream, among the swings that carry no fallen stem (each of the three windfalls above, and the dead
      // culm lodged in the Great Clump, is carried by the swing whose apex is nearest it: so the swings from the first
      // windfall to the glen are taken, and the draw is among the others). Old stems from the shade side, as low over the
      // lane as they can lie and still clear every point of the flight by 3.4 m
      {
        const apS = apex.slice(1).map(([s, o]) => { const q = fpt(s, o * sgn); return path.nearestXZ(q[0], q[1]).u * L; });       // the apexes of the slalom's swings (the first apex is the Old Clump's, before the slalom), in metres of the route
        const carried = [sFallA, sGlen - 7, sGlen + 8, big.s].map((sw) => apS.reduce((b, s, i) => (Math.abs(s - sw) < Math.abs(apS[b] - sw) ? i : b), 0));
        lay(RW4.pick(apS.filter((s, i) => !carried.includes(i))), -sunSide * 11.5, 0.3, 0.98, 34, 5);
        const w = windfall[windfall.length - 1]; w.rng = RW4;
        for (let tries = 0; tries < 12; tries++) {
          let ok = true; const tl = w.tilt + 0.06, st = Math.sin(tl), ct = Math.cos(tl), fy = heightAt(w.x, w.z);
          for (let t = 2; t < 30 && ok; t += 0.75) for (const lat of [-2.6, 0, 2.6]) {
            const x = w.x + w.dx * st * t - w.dz * lat, z = w.z + w.dz * st * t + w.dx * lat, n = path.nearestXZ(x, z);
            if (n.dist < 4 && Math.hypot(n.dist, fy + ct * t - path.pointAt(n.u).y) < 3.4) { ok = false; break; }
          }
          if (ok) break; w.tilt -= 0.05;
        }
      }
      for (const cl of chunkLists) cl.culms = cl.culms.filter((c) => {
        if (Math.hypot(c.x - fall.x, c.z - zF) < FALL_CLEAR) return false;       // the fall's own clearing
        const ga = inGap(c.x, c.z);                                 // the windthrow toward the gap: one culm in five still stands in it, none at the edge
        if (ga > 0 && ga < 31 && Math.abs((c.x - gap.px) * gap.dz - (c.z - gap.pz) * gap.dx) < 3.0 + (ga - 13) * 0.1 && Math.abs(Math.sin(c.x * 12.9898 + c.z * 78.233) * 43758.5453) % 1 > 0.2) return false;
        {                                                           // the Great Clump stands alone on its stool, its stones clear before it
          const ex = c.x - big.x, ez = c.z - big.z, a = ex * big.ix + ez * big.iz, b = ex * big.bx + ez * big.bz;
          if (ex * ex + ez * ez < 3.5 * 3.5 || (a > 0.3 && a < 6.2 && b > -3.4 && b < 6.5)) return false;
        }
        {                                                           // nothing stands along the watcher's stem, nor between it and us as we come up
          const ex = c.x - watch.sx, ez = c.z - watch.sz, al = ex * watch.fx + ez * watch.fz, lt = ex * watch.rx + ez * watch.rz, t = ex * watch.hx + ez * watch.hz;
          if (al > -16 && al < 1.5 && lt > -2.7 && lt < 1.3) return false;
          if (t > -watch.tS - 1 && t < 9 && Math.abs(ex * watch.hz - ez * watch.hx) < 1.3) return false;
        }
        if (Math.hypot(c.x - glen.x, c.z - glen.z) < GLEN_R * (0.82 + 0.36 * ((Math.sin(c.x * 3.1) * Math.cos(c.z * 2.7) + 1) * 0.5))) return false;
        for (const w of windfall) {                                 // nothing stands in the first 14 m of a fallen stem's way
          const ax = c.x - w.x, az = c.z - w.z, t = ax * w.dx + az * w.dz;
          if (t > 0.6 && t < 14 && Math.abs(ax * w.dz - az * w.dx) < 2.2) return false;
        }
        return true;
      });
    }
    const chunks = [];
    for (let i = 0; i < nCh; i++) {
      const grp = hero.plant(chunkLists[i].culms, { perNear: 3, perFar: 2, arch: 1.5, boughs: 1, span: 0.58 });
      await ctx.yield();
      const fm = new THREE.Group(); fm.add(hero.addFerns(chunkLists[i].fNear), hero.addFerns(chunkLists[i].fFar, { fronds: 4, segs: 1 })); scene.add(fm);
      chunks.push({ grp, fm, s0: i * CH - 150, s1: (i + 1) * CH + 16 });
      await ctx.yield();
    }
    // THE CLEAR AIR ABOUT THE LENS. The lens flies the route's own line (the engine sets it at path.posAtDist of the
    // metres flown, and its sway only turns it). LENS_CLEAR is the least air, in metres, kept between that line and the
    // skin of the fallen giants of the windfalls and of the leapers, each taken at the furthest reach of its own
    // motion. (The watcher's culm is not held to it: it is set by its own law, where the watcher is set.) What a
    // thing's own size adds to it is worked out where the thing is made: the fallen giants below, the leapers in
    // their own block.
    //  routeP: the route's line as points ROUTE_STEP metres apart along it, from its start to its end (the last point
    //   is the end itself). Between two neighbouring points the line is taken as the straight chord. routeSag: the
    //   furthest the middle of any chord lies from the point of the line halfway between the chord's two ends in
    //   metres along it.
    //  routeGap2(a, b, i): the square of the least distance between the straight piece from a to b and the chord
    //   from route point i to route point i + 1 (between the nearest two points of the one and of the other).
    //  routeB: the chords in runs of ROUTE_RUN, as they follow one another (run k: chords k ROUTE_RUN to
    //   (k + 1) ROUTE_RUN - 1, fewer in the last). For each run a ball that holds all of it: its centre is the route
    //   point in the middle of the run (the route's last point, if the run ends before that), its radius the distance
    //   from there to the furthest of the run's points.
    const LENS_CLEAR = 2.0, ROUTE_STEP = 0.5, routeN = Math.ceil(L / ROUTE_STEP), routeP = new Float64Array((routeN + 1) * 3);
    let routeSag = 0;
    {
      const p = new THREE.Vector3();
      for (let i = 0; i <= routeN; i++) {
        path.posAtDist(Math.min(i * ROUTE_STEP, L), p); routeP[i * 3] = p.x; routeP[i * 3 + 1] = p.y; routeP[i * 3 + 2] = p.z;
        if (i > 0) { path.posAtDist((Math.min((i - 1) * ROUTE_STEP, L) + Math.min(i * ROUTE_STEP, L)) / 2, p); routeSag = Math.max(routeSag, Math.hypot(p.x - (routeP[i * 3 - 3] + routeP[i * 3]) / 2, p.y - (routeP[i * 3 - 2] + routeP[i * 3 + 1]) / 2, p.z - (routeP[i * 3 - 1] + routeP[i * 3 + 2]) / 2)); }
      }
    }
    const ROUTE_RUN = 16, routeB = new Float64Array(Math.ceil(routeN / ROUTE_RUN) * 4);
    for (let k = 0; k * 4 < routeB.length; k++) {
      const c = Math.min(k * ROUTE_RUN + ROUTE_RUN / 2, routeN) * 3;
      let rr = 0;
      for (let i = k * ROUTE_RUN; i <= Math.min((k + 1) * ROUTE_RUN, routeN); i++) rr = Math.max(rr, Math.hypot(routeP[i * 3] - routeP[c], routeP[i * 3 + 1] - routeP[c + 1], routeP[i * 3 + 2] - routeP[c + 2]));
      routeB[k * 4] = routeP[c]; routeB[k * 4 + 1] = routeP[c + 1]; routeB[k * 4 + 2] = routeP[c + 2]; routeB[k * 4 + 3] = rr;
    }
    const routeGap2 = (ax, ay, az, bx, by, bz, i) => {
      const o = i * 3, rx = ax - routeP[o], ry = ay - routeP[o + 1], rz = az - routeP[o + 2], ex = routeP[o + 3] - routeP[o], ey = routeP[o + 4] - routeP[o + 1], ez = routeP[o + 5] - routeP[o + 2];
      const dx = bx - ax, dy = by - ay, dz = bz - az, dd = dx * dx + dy * dy + dz * dz, ee = ex * ex + ey * ey + ez * ez, de = dx * ex + dy * ey + dz * ez, dr = dx * rx + dy * ry + dz * rz, er = ex * rx + ey * ry + ez * rz, den = dd * ee - de * de;
      let s = den > 1e-12 ? clamp((de * er - dr * ee) / den, 0, 1) : 0, t = ee > 1e-12 ? (de * s + er) / ee : 0;       // s along the piece, t along the chord
      if (t < 0) { t = 0; s = dd > 1e-12 ? clamp(-dr / dd, 0, 1) : 0; } else if (t > 1) { t = 1; s = dd > 1e-12 ? clamp((de - dr) / dd, 0, 1) : 0; }
      const gx = rx + dx * s - ex * t, gy = ry + dy * s - ey * t, gz = rz + dz * s - ez * t;
      return gx * gx + gy * gy + gz * gz;
    };
    // A LAID STEM AGAINST THE LENS. After stemRings(cm) has taken up the one culm that culm mesh cm holds,
    // stemClear(qt, ps) is true when that culm, laid over by the turn qt and the shift ps of its group, keeps the
    // clear air from every chord of the route.
    //  The stem is taken as the mesh draws it: a straight piece from each ring of the mesh to the next, each ring set
    //  on the culm's curve by the culm shader's own law (culmBend) with the stem's lean alone: the stem in a calm.
    //  At each ring the air asked is LENS_CLEAR, plus routeSag (the chords stand for the line, which may leave them
    //  by that), plus the stem's radius there (the shader's taper of its radius), plus the reach of its rocking there: how far the hardest gust carries the ring from its place in a calm (the
    //  same curve with GUST_BOW times the stem's suppleness added to its lean along the wind), and the idle sway
    //  (SWAY_BOW times its suppleness, which the ring's share of the tip's bow ((s / its height)^1.6), the curve's 1/2.6
    //  and the ring's arc length turn into metres).
    //  A piece is held to the greater of its two rings' figures: no chord may come within that of the piece.
    //  Which chords are measured: a run of routeB is passed over when its ball lies clear of the ball about the
    //  stem's middle ring that holds every ring and the greatest air asked at any; within a run that is not, a piece
    //  is passed over when the run's ball lies clear of the ball about the piece's middle that holds the piece and
    //  its figure; every chord of the run is measured against each piece that is left.
    //  GUST_BOW: the shader bows a culm by at most 0.50 + 0.12 (a swell and a ripple at their heights together)
    //  times the wind's gain, and the gain is at most 1.15 (noon's: setWind below). SWAY_BOW: the idle sway is 0.03
    //  on each of two axes. The parting and the crest's swell bow no laid stem while it is drawn: none is laid in the
    //  parting, and all are hidden before the swell begins.
    const GUST_BOW = 0.62 * 1.15, SWAY_BOW = 0.03 * Math.SQRT2;
    const culmBend = (ax, az, s, k, out) => {                     // the point at arc length s of a culm bowed by (ax, az) rad at its tip, from its foot; k = (s / its height)^1.6
      const ang = Math.hypot(ax, az), th = Math.min(ang * k, 1.35), a2 = th * th, hx = s * th * (1 / 2.6 - a2 / 34.8) / Math.max(ang, 1e-4);
      return out.set(ax * hx, s * (1 - a2 / 8.4 + a2 * a2 / 177.6), az * hx);
    };
    const stemRing = new THREE.Vector3(), stemBowed = new THREE.Vector3(), stemAt = [], stemPt = [];       // x, y, z and the air asked, for each ring of the stem in hand: stemAt as planted, stemPt as laid
    let stemHit = -1;                                              // the chord a piece was last found too near: every piece is measured against it before any run (a turn of one step seldom frees a stem of it)
    const stemRings = (cm) => {                                   // the rings of the culm in mesh cm as it stands planted, before it is laid over (into stemAt), each with the air asked at it
      const at = cm.geometry.attributes, B = at.aBase.array, K = at.aCulm.array, P = at.position, h = K[0], stiff = K[1], lx = Math.cos(K[2]) * K[3], lz = Math.sin(K[2]) * K[3], r = at.aLook.array[0];
      stemAt.length = 0;
      for (let i = 0, oq = -1; i < P.count; i++) {
        const q = P.getY(i); if (q === oq) continue;                // (the vertices of one ring share one height: one point for each ring)
        const s = q * h, k = Math.pow(Math.max(Math.min(s / Math.max(h, 1), 1.15), 1e-4), 1.6);
        culmBend(lx, lz, s, k, stemRing); culmBend(lx + windDir.x * GUST_BOW * stiff, lz + windDir.y * GUST_BOW * stiff, s, k, stemBowed);
        stemAt.push(stemRing.x + B[0], stemRing.y + B[1], stemRing.z + B[2], LENS_CLEAR + routeSag + r * (1 - 0.82 * q * Math.sqrt(q)) * (1 + 0.22 * Math.exp(-s * 2.2)) + stemRing.distanceTo(stemBowed) + SWAY_BOW * stiff * s * k / 2.6); oq = q;
      }
    };
    const stemClear = (qt, ps) => {
      stemPt.length = 0;
      for (let o = 0; o < stemAt.length; o += 4) { stemRing.set(stemAt[o], stemAt[o + 1], stemAt[o + 2]).applyQuaternion(qt).add(ps); stemPt.push(stemRing.x, stemRing.y, stemRing.z, stemAt[o + 3]); }
      const n = stemPt.length / 4 - 1, c = (n >> 1) * 4;            // n pieces; c: the middle ring
      let far = 0, air = 0;                                         // the furthest ring from the middle ring, and the greatest air asked at any ring
      for (let p = 0; p <= n; p++) { far = Math.max(far, Math.hypot(stemPt[p * 4] - stemPt[c], stemPt[p * 4 + 1] - stemPt[c + 1], stemPt[p * 4 + 2] - stemPt[c + 2])); air = Math.max(air, stemPt[p * 4 + 3]); }
      if (stemHit >= 0) for (let o = 0; o < n * 4; o += 4) { const nd = Math.max(stemPt[o + 3], stemPt[o + 7]); if (routeGap2(stemPt[o], stemPt[o + 1], stemPt[o + 2], stemPt[o + 4], stemPt[o + 5], stemPt[o + 6], stemHit) < nd * nd) return false; }
      for (let k = 0; k * 4 < routeB.length; k++) {
        const bx = routeB[k * 4], by = routeB[k * 4 + 1], bz = routeB[k * 4 + 2], br = routeB[k * 4 + 3], ex = bx - stemPt[c], ey = by - stemPt[c + 1], ez = bz - stemPt[c + 2], reach = far + air + br;
        if (ex * ex + ey * ey + ez * ez > reach * reach) continue;
        for (let o = 0; o < n * 4; o += 4) {
          const nd = Math.max(stemPt[o + 3], stemPt[o + 7]), half = Math.hypot(stemPt[o + 4] - stemPt[o], stemPt[o + 5] - stemPt[o + 1], stemPt[o + 6] - stemPt[o + 2]) / 2;
          if (Math.hypot(bx - (stemPt[o] + stemPt[o + 4]) / 2, by - (stemPt[o + 1] + stemPt[o + 5]) / 2, bz - (stemPt[o + 2] + stemPt[o + 6]) / 2) > half + nd + br) continue;
          for (let j = k * ROUTE_RUN; j < Math.min((k + 1) * ROUTE_RUN, routeN); j++) if (routeGap2(stemPt[o], stemPt[o + 1], stemPt[o + 2], stemPt[o + 4], stemPt[o + 5], stemPt[o + 6], j) < nd * nd) { stemHit = j; return false; }
        }
      }
      return true;
    };
    const TURN_STEP = 0.005;                                       // rad: the step by which a stem's tilt is tried
    // the fallen giants: planted upright like any culm (same material, same wind), then laid over about their feet
    const fallen = [];
    for (const w of windfall) {
      const RF = w.rng || RX;
      for (let k = 0; k < w.n; k++) {                               // each stem lies its own way: a tangle, not a ladder
        const lat = (k - (w.n - 1) / 2) * RF.range(0.6, 1.3), al = RF.range(-0.8, 0.8), x = w.x - w.dz * lat + w.dx * al, z = w.z + w.dx * lat + w.dz * al, fy = heightAt(x, z) - 0.2;
        const yaw = RF.range(-0.17, 0.17) + lat * 0.05, cy = Math.cos(yaw), sy = Math.sin(yaw), dx = w.dx * cy - w.dz * sy, dz = w.dx * sy + w.dz * cy, tilt = w.tilt + RF.range(-0.14, 0.04);
        const grp = hero.plant([{ x, z, y: fy, near: true, r: RF.range(0.12, 0.15) * 0.6, h: w.h * RF.range(0.75, 1.05), age: k % 3 === 2 ? RF.range(0.7, 0.95) : RF.range(1.18, 1.3),
          lean: RF.range(0.1, 0.4) * (w.rng ? 0.5 : 1), leanAz: Math.atan2(dz, dx) + RF.range(-0.6, 0.6), stiff: 0.07, plume: 0.8 }], { perNear: 3, feet: false, plumes: k === 0 });
        const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(dz, 0, -dx).normalize(), tilt), f = new THREE.Vector3(x, fy, z);
        grp.quaternion.copy(q); grp.position.copy(f).sub(f.clone().applyQuaternion(q));
        // THE LAW OF THE FALLEN GIANTS: no stem of any windfall lies nearer the lens than LENS_CLEAR (stemClear: its
        // skin at the furthest reach of its rocking, against every chord of the route; the culm mesh is the first
        // thing plant() puts in the group). A stem that keeps it as it was laid stays as it was laid. One that does
        // not is turned about its own foot in the plane it fell in: tilts TURN_STEP apart are tried to both sides of
        // the tilt it was laid at, the nearer to that tilt first and of two equally near the more upright first, no
        // further than upright the one way and level the other, and the stem is laid at the first that keeps the law.
        // If none does it is taken out of the grove.
        {
          stemRings(grp.children[0]);
          if (!stemClear(grp.quaternion, grp.position)) {
            const ax = new THREE.Vector3(dz, 0, -dx).normalize(), ps = new THREE.Vector3();
            let laid = false;
            for (let n = 1; !laid && (tilt - n * TURN_STEP >= 0 || tilt + n * TURN_STEP <= Math.PI / 2); n++) for (const tl of [tilt - n * TURN_STEP, tilt + n * TURN_STEP]) {
              if (tl < 0 || tl > Math.PI / 2) continue;
              q.setFromAxisAngle(ax, tl); ps.copy(f).sub(f.clone().applyQuaternion(q));
              if (stemClear(q, ps)) { grp.quaternion.copy(q); grp.position.copy(ps); laid = true; break; }
            }
            if (!laid) grp.removeFromParent();
          }
        }
        fallen.push(grp);
      }
    }
    await ctx.yield();

    // ---------------- where the crest comes into view ----------------
    // Under the canopy the trunk space is closed 172 m from the lens: the fog-coloured skirt stands there, and the
    // forest's own fog has taken nearly all of anything that far off. On the climb the skirt comes off and the fog thins
    // to the open air's by the V's head (the fog law in update()). The crest has a mark of the land for that:
    //  sSkirt: the first metre of the climb at which the route has risen to within CREST_GROUND of the crest's level.
    //   CREST_GROUND is 30 m: the crest's bamboo stands 24 m and the flight rides 6 m over its crown tops, so at that
    //   metre the route comes level with the ground the crest's grove stands on, and is out of the gully below it.
    // So each part of the crest is first drawn at a place of the route worked out from where it stands and from the fog:
    //  firstNear: the first place from which the fog between the lens and the thing takes less than 97% of it (185 m
    //   while the fog is the forest's; further and further as it thins: fogLaw). What lies in the crown sea (the crest zones, the
    //   crowns under the lens, the crown tufts) is drawn from there: it comes out of the fog.
    //  What stands against the sky (the gate, the table, the knolls' clumps, the plume rows of the skylines) is drawn
    //   from there too, and no later than sSkirt.
    const CREST_GROUND = 30, sHead = uTop * L;
    let sSkirt = sHead;
    { const P = new THREE.Vector3(); for (let sd = uClimb * L; sd < sHead; sd += 1) { path.posAtDist(sd, P); if (P.y > yTop - CREST_GROUND) { sSkirt = sd; break; } } }
    // (fogLaw: the fog's own law, by the route's share: the same expression as the first line of update(), where the fog is set)
    const fogLaw = (u) => sstep(uClimb + (uTop - uClimb) * 0.3, uTop, u);
    const seeS0 = Math.max(sSkirt - 330, 0), seePts = [], seeR2 = [];
    {
      const P = new THREE.Vector3();
      for (let sd = seeS0; sd < sHead; sd += 3) {
        path.posAtDist(sd, P); seePts.push(P.x, P.y, P.z);
        const r = Math.max(185, 1.873 / (LK.dIn * Math.pow(LK.dOut / LK.dIn, fogLaw(sd / L))));
        seeR2.push(r * r, 0, 0);
      }
    }
    const firstNear = (x, y, z) => {
      for (let i = 0; i < seePts.length; i += 3) { const dx = x - seePts[i], dy = y - seePts[i + 1], dz = z - seePts[i + 2]; if (dx * dx + dy * dy + dz * dz < seeR2[i]) return seeS0 + i; }
      return sHead;
    };
    // plantStaged: a list of far crowns planted in parts, each part drawn from the place its crowns first come out of
    // the fog (to the 45 m below while the skirt stands, to the 6 m below after); sky: they stand against the sky.
    // staged: every such part and the place it is drawn from
    const staged = [];
    const plantStaged = (list, opts, zone0, sky) => {
      const by = new Map();
      for (const c of list) {
        const y0 = c.y !== undefined ? c.y : heightAt(c.x, c.z), sd = firstNear(c.x, y0 + c.h, c.z), key = sd >= sSkirt ? (sky ? sSkirt : Math.max(Math.floor(sd / 6) * 6, sSkirt)) : Math.floor(sd / 45) * 45;
        if (!by.has(key)) by.set(key, []); by.get(key).push(c);
      }
      for (const [key, sub] of by) { const g = hero.plant(sub, opts); g.visible = false; staged.push({ g, sOn: key, zone0: !!zone0 }); }
    };
    const firstNearList = (list) => { let m = sHead; for (const c of list) { const y0 = c.y !== undefined ? c.y : heightAt(c.x, c.z), sd = firstNear(c.x, y0 + c.h, c.z); if (sd < m) m = sd; } return m; };
    // (the hero's own ferns, on the floor of the gully head, are drawn until the route has climbed to within 20 m of the
    // crest's level)
    let sFernsOff = sHead;
    { const P = new THREE.Vector3(); for (let sd = uClimb * L; sd < sHead; sd += 1) { path.posAtDist(sd, P); if (P.y > yTop - 20) { sFernsOff = sd; break; } } }

    // ---------------- the crest: real crowns under the lens, plumes thinning into the crown sea ----------------
    const crestChunks = [], crestOn = [], nearCh = [];
    const RZ = makeRng(hashSeed('bs-crest:' + ctx.seed)), RL = makeRng(hashSeed('bs-ridgeline:' + ctx.seed));
    const zBehind = -36 - (-36 - (zP - 46)) / 3 - 75;                  // 75 m past the end of the first crest zone: it is behind every gaze by then
    {
      const zA = -36, zB = zP - 46, nZ = 3, zl = (zA - zB) / nZ;
      for (let i = 0; i < nZ; i++) {
        const z0 = zA - i * zl, lists = [[], []];
        const dC = Math.min(density, 1), bands = [[14, 42, Math.round(470 * dC * (0.6 + 0.4 * detail)), 1.9], [42, 88, Math.round(260 * (0.5 + 0.5 * detail)), 3.2]];
        bands.forEach(([d0, d1, n, sp], b) => {
          for (let k = 0; k < n * 3 && lists[b].length < n; k++) {
            const z = z0 - RZ.range(0, zl), x = crestX(z) + RZ.sign() * RZ.range(d0, d1), h = RZ.range(21.5, 25.2);
            if (inHero(x, z) || !free(x, z, sp)) continue;
            lists[b].push({ x, z, near: false, h }); put(x, z);
          }
        });
        for (let b = 0; b < 2; b++) lists[b] = lists[b].filter((c) => !KN.near(c.x, c.z) && crestD(c.x, c.z) > STRIP - 1);
        // (nothing is dealt within 14 m of the line: the crowns under the lens have their own strip, below)
        plantStaged(lists[0], { perFar: 2, culms: false, rng: R10 }, i === 0); plantStaged(lists[1], { perFar: 1, culms: false, rng: R10 }, i === 0);
        await ctx.yield();
      }
      // feathery crest lines: plumes along the tops of the ridges out to 750 m (where the sheet alone would give a smooth skyline)
      {
        const list = [], mx = crestX(-200), mz = -200, cx = -rnz, cz = rnx, want = Math.round(1500 * (0.6 + 0.4 * detail));
        const phase = (x, z) => Math.PI * (x * rnx + z * rnz) / ridL + ridPh + 1.5 * noise.n2(x / 800 + 3, z / 800);
        const a0 = mx * rnx + mz * rnz, k0 = Math.round((Math.PI * a0 / ridL + ridPh) / Math.PI);
        for (let k = k0 - 2; k <= k0 + 2; k++) for (let c = -760; c < 760 && list.length < want * 1.5; c += 2.3) {
          const cc = mx * cx + mz * cz + c; let a = (k * Math.PI - ridPh) * ridL / Math.PI;
          for (let it = 0; it < 3; it++) a -= (phase(a * rnx + cc * cx, a * rnz + cc * cz) - k * Math.PI) * ridL / Math.PI;
          a += RL.range(-7, 7);
          const x = a * rnx + cc * cx + RL.range(-1, 1), z = a * rnz + cc * cz, H = RL.range(33, 40);
          if (Math.hypot(x - mx, z - mz) > 760) continue;
          const hh = heightAt(x, z); if (Math.abs(hh - farH(x, z)) > 4 || hh < -45) continue;
          list.push({ x, z, y: hh + 21.5 - H, h: H, near: false });
        }
        const keep = list.filter((c, i) => (i % 3) !== 1 && !MT.inside(c.x, c.z));     // (two in three: the tufts carry the rest; none inside the table's foot)
        plantStaged(keep, { perFar: 1, culms: false }, false, true);
        await ctx.yield();
      }
      // THE GATE: two emergent clumps flanking the ring, thirty metres out of the crown sea, their stools 11 m to either
      // side of its centre. Each is nineteen veteran culms rising from one stool and fanning apart, bare jade stems for
      // two thirds of their height, the upper third all streaming plumes; every tip arches over downwind, so both clumps
      // lean the same way, like a gate being blown. The clump upwind of the ring leans toward it and over it: every culm
      // is followed up its whole length, calm and at its hardest bow, and none comes within 9.5 m of the line of the
      // flight (the ring is 7 m in radius), plume and all.
      const gate = [], gateStools = [], tx = path.endTangent.x, tz = path.endTangent.z, RG = makeRng(hashSeed('bs-gate:' + ctx.seed));
      {
        const th0 = Math.hypot(tx, tz) || 1, ux = tx / th0, uz = tz / th0, cp = { x: 0, y: 0, z: 0, sx: 0, sy: 1, sz: 0 };
        const clear = (it, lx, lz, gy) => {
          for (let kk = 0; kk <= 2; kk++) for (let qi = 3; qi <= 11; qi++) {
            const q = Math.min(qi / 10, 1); culmAt(it, lx, lz, q, kk * 0.5, cp);
            if (qi === 11) { const pl = 5.4 * it.plume; cp.x += (cp.sx * 0.6 + windDir.x * 0.5 * kk) * pl; cp.y += cp.sy * 0.6 * pl; cp.z += (cp.sz * 0.6 + windDir.y * 0.5 * kk) * pl; }       // (the tip of its plume)
            const ex = cp.x - exitP.x, ez = cp.z - exitP.z, al = ex * ux + ez * uz, lat = ex * uz - ez * ux, dy = gy + cp.y - exitP.y;
            if (al > -80 && al < 18 && Math.hypot(lat, dy) < 9.5 + 2.5 * (qi === 11 ? 1 : 0)) return false;
          }
          return true;
        };
        for (const sd of [-1, 1]) {
          const rx = -uz * sd, rz = ux * sd, upwind = rx * windDir.x + rz * windDir.y < 0, off = upwind ? 11.5 : 10.5;
          const cx = exitP.x + rx * off, cz = exitP.z + rz * off, n = 19;
          gateStools.push([cx, cz]);
          for (let k = 0; k < n; k++) {
            const a = k / n * 6.283 * 2 + RG.range(-0.2, 0.2), rr = k === 0 ? 0.4 : k < 9 ? RG.range(1.3, 2.4) : RG.range(2.6, 4.1), ox = Math.cos(a), oz = Math.sin(a);
            const fan = k === 0 ? 0.06 : upwind ? RG.range(0.22, 0.46) : RG.range(0.16, 0.38), wl = upwind ? 0.16 : 0.3;
            let lx = ox * fan + windDir.x * wl, lz = oz * fan + windDir.y * wl;
            const x0 = cx + ox * rr, z0 = cz + oz * rr, gy = heightAt(x0, z0);
            const it = { x: x0, z: z0, near: true, r: RG.range(0.15, 0.2), h: (exitP.y - gy) + RG.range(26, 35) * (upwind ? 0.96 : 1.06), age: RG.range(0.35, 0.9), stiff: upwind ? RG.range(0.3, 0.42) : RG.range(0.52, 0.76), plume: RG.range(1.45, 1.8), span: 0.34 };
            for (let tries = 0; tries < 18; tries++) {
              if (clear(it, lx, lz, gy)) break;
              lx = lx * 0.84 + rx * 0.03; lz = lz * 0.84 + rz * 0.03; it.x += rx * 0.6; it.z += rz * 0.6; it.stiff = Math.max(0.24, it.stiff * 0.94);
            }
            it.lean = Math.hypot(lx, lz); it.leanAz = Math.atan2(lz, lx);
            gate.push(it);
          }
        }
      }
      crestChunks.push(hero.plant(gate, { perNear: 11, rng: RG })); crestOn.push(Math.min(firstNearList(gate), sSkirt));
      await ctx.yield();
      // THE CROWNS UNDER THE LENS: for 22 m to either side of the crest flight, from the V's head to 26 m beyond the ring,
      // every crown is a real plume on its own stem, 3.5 m from its neighbours: a nodding tip and six sprays of lance
      // leaves round it, small enough that each one shows, whipping with every gust and bowing as the swell passes. Their
      // tops stand in the dark of the sheet (21 to 25 m up; lower straight under the line of the flight, so the lens rides
      // clear over them, and in the ring they stand up to 1 m over its lower rim). Laid in stretches of 38 m: the tip and
      // one spray of every crown (tops) are drawn from the V on; the rest of a crown, and its stem, from 52 m ahead of us
      // until it is behind us (see update()).
      {
        const CL = 38, sp = 3.5, row = sp * 0.87, sEndC = L + 26, nC = Math.ceil((sEndC - sV10) / CL), wAz = Math.atan2(windDir.y, windDir.x), o4 = { x: 0, z: 0 };
        const lists = []; for (let i = 0; i < nC; i++) lists.push([]);
        let ri = 0;
        for (let sd = sV10 + 0.5 * row; sd < sEndC - 0.5; sd += row, ri++) {
          for (let off = -STRIP + (ri & 1 ? 0.5 * sp : 0) + 0.4; off <= STRIP; off += sp) {
            const s2 = sd + R10.range(-0.9, 0.9), of2 = off + R10.range(-0.9, 0.9), r = R10.range(0.06, 0.085);
            const it = { near: false, r, age: R10.range(0.3, 0.95), plume: R10.range(0.52, 0.66), span: 0.16, stiff: R10.range(0.82, 1.18) * Math.pow(0.075 / r, 0.35), lean: R10.range(0.08, 0.3), leanAz: wAz + (R10() + R10() + R10() - 1.5) * 1.3, h: 0 };
            const hr = R10.range(-1.1, 1.3);
            side(Math.min(s2, L), of2, o4); const py = _p.y, past = Math.max(s2 - L, 0);      // (beyond the ring: straight on along the way we leave)
            it.x = o4.x + endF.x * past; it.z = o4.z + endF.z * past;
            if ((inHero(it.x, it.z) && s2 < sHead + 1) || KN.near(it.x, it.z)) continue;       // (past the V's head they stand on the hero's ground too: its own culms end there)
            let hit = false;
            for (const g of gateStools) if (Math.hypot(it.x - g[0], it.z - g[1]) < 5.2) hit = true;
            if (hit) continue;
            const gy = heightAt(it.x, it.z);
            it.h = Math.min(22.9 + 1.5 * noise.n2(it.x / 11 + 3.7, it.z / 11) + hr, py - 5.5 - 0.5 * sstep(L - 16, L - 6, s2) + 0.25 * Math.min(Math.abs(of2), 8) - gy);       // (lower under the line of the flight; 1 m over the ring's lower rim)
            lists[clamp(Math.floor((s2 - sV10) / CL), 0, nC - 1)].push(it);
          }
          if ((ri & 15) === 15) await ctx.yield();
        }
        for (let i = 0; i < nC; i++) {
          if (!lists[i].length) continue;
          const tops = hero.plant(lists[i], { perFar: 2, culms: false, rng: R10 }), fill = hero.plant(lists[i], { perFar: 7, from: 2, rng: R10 });
          tops.visible = fill.visible = false;
          nearCh.push({ tops, fill, s0: sV10 + i * CL, s1: sV10 + (i + 1) * CL, sOn: firstNearList(lists[i]) });
          await ctx.yield();
        }
      }
    }

    // ---------------- the crown sea / leaf ceiling ----------------
    const rainDir = new THREE.Vector3(path.endTangent.x, 0, path.endTangent.z).normalize().applyAxisAngle(new THREE.Vector3(0, 1, 0), 50 * Math.PI / 180);
    // (the slope that flowers is the first ridge of the vista: straight upwind of the ring, across the valley)
    const flowerAt = new THREE.Vector3(vO.x + g0.x * VR[0].S + g0.z * 110, 0, vO.z + g0.z * VR[0].S - g0.x * 110);
    U.uFlower.value.set(flowerAt.x, flowerAt.z, 185, rare ? 1 : 0);                 // the hero's plumes read it too: crowns on that slope turn straw-gold
    const seaX = {
      uFlower: U.uFlower,
      uRainAt: { value: new THREE.Vector4(0, 0, 500, 0.8) },
      uCloud: { value: new THREE.Vector3(LK.cloud, 0, 0) },
      uSunH: { value: new THREE.Vector2(sunDir.x, sunDir.z).normalize() },
      uBandA: { value: 0 }, uBandDir: { value: new THREE.Vector2(windDir.x, windDir.y) },
      uBreak: U.uBreak, uBreak2: U.uBreak2, uBreakSun: U.uBreakSun, uMesaSun: { value: 1 },
      uRidgeK: { value: 0 }, uAir: { value: 0 },
    };
    // (the swell band's front is laid every frame: see update())
    await ctx.yield();
    const seaBlocks = [];                                           // the sheet's meshes and their bounds: see "THE SHEET IN BLOCKS"
    {
      const axis = (fineLo, fineHi, cell, midHi, mid, loEnd, hiEnd) => {
        const a = []; let v = fineLo; for (; v < fineHi; v += cell) a.push(v);
        for (; v < midHi; v += mid) a.push(v);
        let st = mid; while (v < hiEnd) { a.push(v); st = Math.min(st * 1.2, 80); v += st; } a.push(v);
        v = fineLo; st = cell; while (v > loEnd) { st = Math.min(st * 1.09, 46); v -= st; a.unshift(v); }
        return a;
      };
      const xs = axis(-390, 175, 7, 560, 13, -2100, 2100), zs = axis(-490, 70, 7, 440, 13, -2300, 720);
      // (aBump: how far a vertex stands above the crest flight. Until we climb to the V the sheet is held down to that
      // level, see uRidgeK in update(): no ridge, the high one beside the crest or the far ones of the vista, is seen out
      // of the forest, through the windthrow or any other gap in the crowns)
      const nx = xs.length, nz = zs.length, pos = new Float32Array(nx * nz * 3), bump = new Float32Array(nx * nz), idx = [];
      for (let j = 0; j < nz; j++) {
        for (let i = 0; i < nx; i++) {
          const x = xs[i], z = zs[j], o = (j * nx + i) * 3;
          // (round the fall the ceiling goes by the ground 9 m up and down the valley, not under it: the 4 m step in the
          // floor there tilted one cell of the sheet into a flat pane among the crowns)
          pos[o] = x; pos[o + 1] = (z > zF - 34 && z < zF + 34 && Math.abs(x - laneX(zF)) < 140 ? 0.5 * (heightAt(x, z - 9) + heightAt(x, z + 9)) : heightAt(x, z)) + 19 + 1.5 * noise.fbm2(x * 0.06, z * 0.06, 2); pos[o + 2] = z;
          bump[j * nx + i] = Math.max(0, pos[o + 1] - (yTop + 4));
        }
        if (j % 24 === 23) await ctx.yield();
      }
      await ctx.yield();
      for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) { const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1; idx.push(a, c, b, b, c, d); }
      await ctx.yield();
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aBump', new THREE.BufferAttribute(bump, 1)); g.setIndex(idx); g.computeVertexNormals();
      await ctx.yield();
      // THE SHEET IN BLOCKS. It is one sheet still: the vertices above, their normals (summed over the whole grid) and one
      // material are shared by all its meshes. Its triangles, each as it was laid, are dealt into twelve blocks by the
      // grid's own bands: the core of the finest cells; the band of equal cells beyond it, as its two arms; the growing
      // cells out to each edge, the two long sides in three rings each, the next in two, the short one whole. Every cell
      // of the grid lies in exactly one block. A block keeps its bounds, from its own vertices as they stand here: the
      // box round them in plan (x0 to x1, z0 to z1); their lowest and highest (y0, y1) and their highest when the sheet
      // is held down to the crest's level (yHeld: see aBump), each SEA_SWAY further out: more than the shader moves a
      // vertex up or down besides (the gust, the parting, the swell: under 10 m).
      // Sideways the shader moves a vertex too, and the box is NOT widened for it: up to 2.9 m along the wind in a gust
      // (2.5 m times the wind's strength, 1.15 at most), and up to 5.7 m more in the parting (5 m times its opening,
      // 1.14 at most), which works only in its own strip of the gully (64 m long, within 24 m of the lane). What covers
      // it: a block is left out only beyond the fog's reach, 38 m and more outside the skirt's wall (210 m against
      // 172 m in the thickest fog of the four looks), so a vertex swayed 2.9 m nearer is still behind the wall; and
      // against the skirt's rim and foot such a sway counts for under 1.5 m of height, which is inside what SEA_SWAY
      // leaves over (a vertex rises 1 m at most and, out of the parting, falls 5.9 m at most). The parting's strip is
      // never in a block left out: while the skirt stands and the V is opening, the strip lies under 95 m from the eye
      // (measured on seeds 3, 7 and 11: 92 m at the most, the nearest block left out then 387 m off).
      // When a block is drawn and when it is left out: see "THE CROWN SEA'S BLOCKS" in update()
      const SEA_SWAY = 10;
      const bandsOf = (a) => {                                    // the cells where the bands of one axis begin: the finest, the equal ones beyond, the growing ones beyond those
        const n = a.length - 1, w = (i) => a[i + 1] - a[i]; let c0 = 0;
        for (let i = 1; i < n; i++) if (w(i) < w(c0) - 1e-6) c0 = i;
        let c1 = c0; while (c1 < n && w(c1) < w(c0) + 1e-6) c1++;
        let c2 = c1; while (c2 < n && Math.abs(w(c2) - w(c1)) < 1e-6) c2++;
        return [c0, c1, c2, n];
      };
      const rings = (a, b, n) => { const o = []; for (let k = 0; k < n; k++) o.push([a + Math.round((b - a) * k / n), a + Math.round((b - a) * (k + 1) / n)]); return o; };
      const [X0, X1, X2, NX] = bandsOf(xs), [Z0, Z1, Z2, NZ] = bandsOf(zs);
      const deal = [[X0, X1, Z0, Z1], [X1, X2, Z0, Z2], [X0, X1, Z1, Z2], [X0, X2, Z2, NZ]];
      for (const [a, b] of rings(0, X0, 3)) deal.push([a, b, 0, NZ]);
      for (const [a, b] of rings(X2, NX, 2)) deal.push([a, b, 0, NZ]);
      for (const [a, b] of rings(0, Z0, 3)) deal.push([X0, X2, a, b]);
      const seaMat = seaMaterial(U, seaX);
      for (const [i0, i1, j0, j1] of deal) {
        const bi = [], blk = { m: null, x0: Infinity, x1: -Infinity, z0: Infinity, z1: -Infinity, y0: Infinity, y1: -Infinity, yHeld: -Infinity };
        for (let j = j0; j < j1; j++) for (let i = i0; i < i1; i++) for (let q = (j * (nx - 1) + i) * 6, e = q + 6; q < e; q++) {
          const v = idx[q] * 3; bi.push(idx[q]);
          blk.x0 = Math.min(blk.x0, pos[v]); blk.x1 = Math.max(blk.x1, pos[v]); blk.z0 = Math.min(blk.z0, pos[v + 2]); blk.z1 = Math.max(blk.z1, pos[v + 2]);
          blk.y0 = Math.min(blk.y0, pos[v + 1]); blk.y1 = Math.max(blk.y1, pos[v + 1]); blk.yHeld = Math.max(blk.yHeld, pos[v + 1] - bump[idx[q]]);
        }
        blk.y0 -= SEA_SWAY; blk.y1 += SEA_SWAY; blk.yHeld += SEA_SWAY;
        const bg = new THREE.BufferGeometry();
        for (const k of ['position', 'aBump', 'normal']) bg.setAttribute(k, g.attributes[k]);
        bg.setIndex(bi);
        blk.m = new THREE.Mesh(bg, seaMat); blk.m.frustumCulled = false; scene.add(blk.m); seaBlocks.push(blk);
        await ctx.yield();
      }
    }
    await ctx.yield();

    // ---------------- glades and shafts ----------------
    const sunH = new THREE.Vector2(sunDir.x, sunDir.z).normalize(), cosEl = Math.cos(el);
    hero.setGlade(0, entry.x, entry.z, 17);
    hero.setGlade(1, clumps[0].x, clumps[0].z, 10);
    hero.setGlade(2, ledge.x + ledgeIn.x * 1.2, ledge.z + ledgeIn.z * 1.2, 4.4);
    const tops = [], halos = [];
    // every shaft is laid so that it LANDS: its top is found by going back up the sun's ray from the spot on the floor
    const shaftK = lookName === 'night' ? 0.42 : lookName === 'evening' ? 0.62 : 1, elS = Math.max(el, 0.37);   // (a low evening sun still comes down through the gaps at 21 degrees)
    const shaftOnto = (x, z, w, len0, hit = 0.7, gain = 1, o = {}) => {
      const e2 = elS + (o.del || 0), a2 = o.daz || 0, sE = Math.sin(e2), cE = Math.cos(e2), ca = Math.cos(a2), sa = Math.sin(a2);
      const hx = sunH.x * ca - sunH.y * sa, hz = sunH.x * sa + sunH.y * ca;
      const len = Math.min(21.5 / (hit * sE), 64), run = len * hit;
      tops.push({ x: x + hx * run * cE, y: (o.y ?? heightAt(x, z) + 0.4) + run * sE, z: z + hz * run * cE, w, len, gain: gain * shaftK, dir: [hx * cE, sE, hz * cE], hit, rays: o.rays ?? 3, seed: o.seed ?? ((tops.length * 0.618 + 0.21) % 1) });
    };
    // (every R draw of the first build is still made, in its order; some of the old overlapping sheets are no longer laid)
    for (let k = 0; k < 6; k++) {
      const ax = clumps[0].x + R.range(-2.5, 2.5), az2 = clumps[0].z + R.range(-2.5, 2.5), w = -R.range(2.0, 4.2), l0 = R.range(30, 38);
      if (k < 2) shaftOnto(ax, az2, w * 1.2, l0, 0.6 + 0.08 * k, 2.5 - 0.5 * k, { daz: k ? 0.17 : -0.14, del: k ? -0.05 : 0.04, rays: 3 + k, seed: 0.13 + k * 0.29 });
    }
    for (let k = 0; k < 3; k++) {
      const ax = ledge.x + R.range(-1.5, 1.5), az2 = ledge.z + R.range(-1.5, 1.5), w = -R.range(1.4, 2.4), l0 = R.range(26, 32);
      // (steep: the beam stands over the troop)
      if (k < 2) shaftOnto(ledge.x + ledgeIn.x * (1.3 - k * 0.9) + ledgeAlong.x * (k ? -1.2 : 0.6), ledge.z + ledgeIn.z * (1.3 - k * 0.9) + ledgeAlong.z * (k ? -1.2 : 0.6), w * (1.25 - 0.3 * k), l0, 0.66 + 0.06 * k, 4.0 - 1.6 * k, { daz: k ? 0.3 : -0.12, del: 0.5 + 0.12 * k, rays: 3 - k, seed: 0.41 + k * 0.3, y: ledge.top + 0.5 });
    }
    for (let k = 0; k < 2; k++) { const e = side(16 + k * 9, (k ? 5 : -6), { x: 0, z: 0 }); shaftOnto(e.x, e.z, -R.range(1.5, 2.5) * 1.3, 30, 0.7, 1, { daz: k ? 0.1 : -0.1, rays: 3, seed: 0.77 - k * 0.4 }); }
    for (let s = 40; s < sForest; s += R.range(22, 34)) {
      const e = side(s, R.sign() * R.range(4, 22), { x: 0, z: 0 }), w = R.range(1.4, 2.8) * 1.4, l0 = R.range(27, 34);
      if (Math.hypot(e.x - fall.x, e.z - zF) < 38) continue;               // none across the approach to the fall: its own sheaf is the light there
      shaftOnto(e.x, e.z, w, l0, 0.7, 1.1, { daz: ((tops.length % 3) - 1) * 0.12, rays: 2 + (tops.length % 3) });
    }
    // standing sheaves of rays in the lane itself (gaps left by fallen culms), so light always lands ahead in the
    // slalom: one up the first aisle, one in the bend of the lane's second swing and one in its fourth, each ending in a
    // pool of lit ferns (a glade), and one on the fall. No two alike: side of the lane, width, bearing, steepness and
    // number of rays differ
    [[0.12 * L + 30, 1.5, 4.2, -0.1, 0.0, 4, 0.31], [0.25 * L + 33, -3.2, 3.0, 0.2, 0.13, 3, 0.67], [0.4 * L + 29, 2.4, 4.8, 0.06, -0.05, 5, 0.09], [46, 1.5, 3.6, -0.16, 0.06, 4, 0.52]].forEach(([sd, off, wd, daz, del, rays, seed], i) => {
      // (the third lands on the fall at the head of the stream: on the white water, its spray and the wet ledge)
      const atFall = i === 2, e = atFall ? { x: fall.x, z: zF + 0.9 } : side(sd, off, { x: 0, z: 0 });
      shaftOnto(e.x, e.z, atFall ? -2.3 : -wd, 31, 0.7, atFall ? 1.7 : 2.6, { daz, del: atFall ? 0.62 : del, rays: atFall ? 3 : rays, seed, y: atFall ? poolY + 0.8 : undefined });   // (steep onto the fall: a standing sheaf, not a wash across the frame)
      hero.setGlade(3 + i, e.x, e.z, atFall ? 6.6 : 5.2);
      halos.push({ x: e.x, y: atFall ? poolY + 2.0 : heightAt(e.x, e.z) + 3.4, z: e.z + (atFall ? 1.2 : 0), r: atFall ? 4.2 : 7.5, gain: atFall ? 0.5 : 1, seed: seed });
    });
    // the monkey rock stands in a sheaf of its own
    {
      const x = mRock.x + mRock.inx * 1.7, z = mRock.z + mRock.inz * 1.7;
      shaftOnto(x, z, -3.6, 31, 0.7, 2.9, { daz: 0.08, del: 0.24, rays: 3, seed: 0.47, y: mRock.y + 2.4 });
      hero.setGlade(10, x, z, 4.8);
      halos.push({ x, y: mRock.y + 3.2, z, r: 6.5, gain: 1.0, seed: 0.47 });
    }
    // between the first two pools: a narrow steep sheaf
    {
      // (it stands on the Great Clump and its stones, a second through the stems behind them)
      const e = { x: big.x + big.ix * 2.5 + big.bx * 1.4, z: big.z + big.iz * 2.5 + big.bz * 1.4 };
      shaftOnto(e.x, e.z, -3.8, 31, 0.7, 2.7, { daz: -0.2, del: 0.2, rays: 4, seed: 0.83, y: big.y + 2.0 });
      shaftOnto(big.x - big.ix * 0.6 + big.bx * 0.5, big.z - big.iz * 0.6 + big.bz * 0.5, -2.4, 31, 0.64, 1.7, { daz: 0.14, del: 0.04, rays: 3, seed: 0.27, y: big.y + 4 });
      hero.setGlade(7, e.x, e.z, 6.4);
      halos.push({ x: e.x, y: big.y + 3.8, z: e.z, r: 8, gain: 1.0, seed: 0.83 });
      const w4 = windfall[3], f = { x: w4.x + w4.dx * 8.5, z: w4.z + w4.dz * 8.5 };
      shaftOnto(f.x, f.z, -3.0, 31, 0.68, 2.3, { daz: 0.1, del: 0.12, rays: 3, seed: 0.56, y: heightAt(f.x, f.z) + 4.5 });
      hero.setGlade(14, f.x, f.z, 5.0);
    }
    // the clearing: open sky, a broad fan of rays across it and over the lane, the mist standing lit in the middle
    {
      hero.setGlade(8, glen.x, glen.z, GLEN_R + 1.5);
      const e1 = side(sGlen + 2, sunSide * 3.5, { x: 0, z: 0 }), e2 = side(sGlen - 6, sunSide * 9.5, { x: 0, z: 0 }), e3 = side(sGlen + 11, -sunSide * 2.5, { x: 0, z: 0 });
      shaftOnto(e1.x, e1.z, -6.4, 31, 0.72, 2.7, { daz: 0.1, del: 0.08, rays: 5, seed: 0.37 });
      shaftOnto(e2.x, e2.z, -4.4, 31, 0.66, 2.0, { daz: -0.16, del: 0.2, rays: 4, seed: 0.71 });
      shaftOnto(e3.x, e3.z, -2.6, 31, 0.7, 2.2, { daz: 0.24, del: -0.03, rays: 2, seed: 0.19 });
      hero.setGlade(9, e3.x, e3.z, 4.2);
      halos.push({ x: glen.x, y: heightAt(glen.x, glen.z) + 5.5, z: glen.z, r: 12.5, gain: 1.15, seed: 0.37 });
      halos.push({ x: e1.x, y: heightAt(e1.x, e1.z) + 3.2, z: e1.z, r: 7.5, gain: 1, seed: 0.59 });
    }
    halos.push({ x: clumps[0].x, y: heightAt(clumps[0].x, clumps[0].z) + 5, z: clumps[0].z, r: 10, gain: 1.3, seed: 0.05 });
    hero.setLitClump(clumps[0].x, clumps[0].z, 2.4, 3.0);                 // the Old Clump's seven stems take the whole beam: lit lime against the depth behind
    // the gap: the floor of the windthrow lies in the light that comes in through it, two sheaves standing in it
    {
      const at = (al, c) => ({ x: gap.px + gap.dx * al + gap.dz * c, z: gap.pz + gap.dz * al - gap.dx * c });
      let e = at(34, 0); hero.setGlade(11, e.x, e.z, 11);
      e = at(46, 1); hero.setGlade(12, e.x, e.z, 8.5);
      e = at(27, -3); shaftOnto(e.x, e.z, -4.6, 31, 0.72, 1.7, { daz: 0.06, del: -0.02, rays: 5, seed: 0.29 });
      e = at(45, 3); shaftOnto(e.x, e.z, -3.4, 31, 0.68, 1.4, { daz: -0.12, del: 0.1, rays: 4, seed: 0.63 });
      halos.push({ x: e.x, y: heightAt(e.x, e.z) + 4, z: e.z, r: 10, gain: 0.8, seed: 0.33 });
    }
    const shafts = hero.addShafts(tops); scene.add(shafts);
    const haloMesh = hero.addHalos(halos); scene.add(haloMesh);
    // ---------------- the stream in spate ----------------
    // Dark jade water seated in its bed: every vertex carries its depth over the ground, so the shore is wherever the
    // water runs out of depth (no ribbon edge); thin white streaks run with the flow, foam only below the two ledges.
    let bankFernMesh = null;
    {
      const pos = [], q = [], d = [], idx = [], AC = 10, zs = [], steepR = []; let rows = 0;
      // (at the high ledge the water runs level to the lip of the rock, shoots out and falls clear of it into the pool)
      const lvl0 = (z) => heightAt(laneX(z), z) + 0.51, lipL = lvl0(zF - 1.6), poolL = lvl0(zF + 1.6);
      const level = (z) => (z < zF - 1.6 || z > zF + 1.6 ? lvl0(z) : z < zF + 0.3 ? lipL - 0.035 * (z - zF + 1.6) : Math.max(poolL, lipL - 0.067 - (lipL - poolL) * Math.pow((z - zF - 0.3) / 0.75, 2)));
      // (rows every 1.25 m; every 0.3 m where the water goes over the high ledge)
      for (let z = 3; z <= zEnd + 1; z += (z > zF - 2 && z < zF + 1.3 ? 0.3 : 1.25)) { zs.push(z); steepR.push(clamp((level(z - 1.2) - level(z + 1.2)) / 2.4 * 3.4, 0, 1)); }
      let run = 0;
      for (let j = 0; j < zs.length; j++, rows++) {
        const z = zs[j], w = streamHalf(z) * 1.3, y = level(z), dxdz = laneX(z + 0.5) - laneX(z - 0.5);
        run = Math.max(steepR[j], run * 0.87);                                // foam carries ten metres below each ledge
        const fade = sstep(3, 7, z) * (1 - sstep(zEnd - 4, zEnd, z));
        for (let i = 0; i <= AC; i++) {
          const u = i / AC * 2 - 1, x = laneX(z) + u * w, zz = z - u * w * dxdz * 0.3, g = heightAt(x, zz);
          pos.push(x, Math.max(y, g + 0.03), zz); q.push(u * w, z, steepR[j]); d.push(Math.abs(z - zF) < 1.5 ? Math.min(y - g, 0.9 * Math.exp(-u * w * u * w / 6) - 0.39) : y - g, run, fade);
        }
      }
      for (let j = 0; j < rows - 1; j++) for (let i = 0; i < AC; i++) { const a = j * (AC + 1) + i, b2 = a + 1, c = a + AC + 1, e = c + 1; idx.push(a, c, b2, b2, c, e); }
      // a white collar round every stone that stands in the water: a bow wave on its upstream side, a V of wake below it
      // (one quad each, laid on the water; aD.z = -1 marks it, aQ = (across, along, seed) in stone radii)
      for (const [sx0, sz0, sr] of wetStones) {
        if (sz0 < 7 || sz0 > zF - 3) continue;
        const o = pos.length / 3, sd = (sx0 * 7.3 + sz0 * 3.1) % 1;
        for (const [a, b] of [[-2, -1.9], [2, -1.9], [-2, 4.6], [2, 4.6]]) { const zz = sz0 + b * sr; pos.push(sx0 + a * sr, level(zz) + 0.035, zz); q.push(a, b, sd); d.push(0.5, 0, -1); }
        idx.push(o, o + 2, o + 1, o + 1, o + 2, o + 3);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aQ', new THREE.Float32BufferAttribute(q, 3)); g.setAttribute('aD', new THREE.Float32BufferAttribute(d, 3)); g.setIndex(idx);
      const mat = new THREE.ShaderMaterial({
        fog: true, lights: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
        uniforms: { ...lightU(), ...fogU(), ...U },
        vertexShader: /* glsl */`
          attribute vec3 aQ, aD; varying vec3 vQ, vD, vV, vWp; varying float vY;
          #include <fog_pars_vertex>
          void main(){
            vQ = aQ; vD = aD; vY = position.y; vWp = position;
            vec4 mvPosition = modelViewMatrix*vec4(position, 1.0);
            vV = mvPosition.xyz;
            gl_Position = projectionMatrix*mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */`
          uniform vec3 uJade, uLime, uDeep, uWhite, uSlate, uCeladon; uniform vec2 uFill;
          varying vec3 vQ, vD, vV, vWp; varying float vY;
          #include <fog_pars_fragment>
          ${GLSL_LIGHT}
          ${GLSL_WIND}
          void main(){
            vec3 up = bsAmb(vec3(0.0, 1.0, 0.0))*uFill.y, V = normalize(-vV);
            if (vD.z < -0.5) {                                                // a stone's collar
              vec2 c = vQ.xy; float sd = vQ.z, rr = length(c);
              float w1 = bsNoise(vec2(c.x*2.3 + sd*17.0, c.y*1.1 - uTime*3.4)), w2 = bsNoise(vec2(c.x*6.0, c.y*2.6 - uTime*5.5 + sd*9.0));
              float bow = smoothstep(0.78, 1.02, rr + 0.12*(w1 - 0.5))*(1.0 - smoothstep(1.1, 1.55 + 0.25*w1, rr))*(1.0 - smoothstep(0.2, 1.0, c.y));
              float arm = abs(abs(c.x) - (0.95 + 0.17*max(c.y, 0.0)));
              float wake = (1.0 - smoothstep(0.05, 0.3 + 0.1*c.y, arm))*smoothstep(-0.2, 0.5, c.y)*(1.0 - smoothstep(1.4, 4.4, c.y));
              float lee = (1.0 - smoothstep(0.3, 0.95, abs(c.x)))*smoothstep(0.8, 1.2, c.y)*(1.0 - smoothstep(1.3, 3.2, c.y))*0.6;      // churned water in the lee
              float fm = clamp(bow*(0.7 + 0.5*w2) + (wake*0.85 + lee)*(0.35 + 0.65*w1)*(0.5 + 0.5*w2), 0.0, 1.0);
              vec3 cc = mix(uWhite, uCeladon, 0.25)*(up*0.78 + bsSunCol()*(0.05 + 0.3*bsGlade(vec2(vWp.x, vWp.z))));
              gl_FragColor = vec4(cc, fm*0.92);
              #include <fog_fragment>
              return;
            }
            float ledge = vQ.z, below = vD.y;
            float edgeN = bsNoise(vWp.xz*1.15 + 5.0)*0.6 + bsNoise(vWp.xz*3.3 + 1.0)*0.4;        // the waterline is not a ruled edge
            float depth = vD.x + (edgeN - 0.5)*0.17*(1.0 - smoothstep(0.3, 0.8, ledge));
            float sp = 2.6 + 4.5*ledge;
            vec2 p = vec2(vQ.x, vQ.y - uTime*sp);                             // metres across, metres along (moving with the flow)
            float a1 = bsNoise(p*vec2(1.1, 0.16) + 3.0);
            float a2 = bsNoise(p*vec2(2.9, 0.42) + vec2(a1*1.3, 7.0));
            float a3 = bsNoise(p*vec2(6.3, 0.9) + vec2(a2*0.9, 1.0));
            float fine = bsNoise(p*vec2(13.0, 2.6) + 11.0);
            float a4 = bsNoise(vec2(vQ.x*4.3 + 9.0, (vQ.y - uTime*sp*1.7)*0.33 + a1));       // a second, faster set of streaks
            float shore = smoothstep(0.015, 0.07, depth + (fine - 0.5)*0.035);                  // a crisp water's edge
            if (shore*vD.z < 0.02) discard;
            float line = smoothstep(0.58, 0.72, a2*0.5 + a3*0.5)*(0.35 + 0.65*fine);          // white streaks drawn out by the current
            float line2 = smoothstep(0.6, 0.76, a4*0.62 + fine*0.38);
            float churn = smoothstep(0.3, 0.7, a3*0.55 + fine*0.45);
            float wave = pow(0.5 + 0.5*sin(vQ.y*4.6 + (a1 - 0.5)*6.0 + vQ.x*0.7), 4.0)*below;       // standing waves below each ledge
            float lap = smoothstep(0.02, 0.045, depth)*(1.0 - smoothstep(0.08, 0.26, depth + (a3 - 0.5)*0.09))*(0.35 + 0.65*churn);   // foam lapping the edge and the shoals
            float foam = clamp(line*(0.55 + 0.45*below) + line2*0.36 + churn*below*0.9 + wave*0.75 + lap*0.85 + ledge*0.5, 0.0, 1.0)*smoothstep(0.02, 0.07, depth);
            vec3 N = normalize(mat3(viewMatrix)*normalize(vec3((a2 - 0.5)*0.6 + (fine - 0.5)*0.3, 1.0, (a3 - 0.5)*0.45 + (edgeN - 0.5)*0.3)));
            float fr = 1.0 - clamp(dot(N, V), 0.0, 1.0); fr = fr*fr*fr;
            vec3 water = mix(uDeep*0.5, uJade*0.42, clamp(a1*0.7 + 0.5 - depth*1.2, 0.0, 1.0))*up*1.25;     // the bed shows green where it is shallow
            water += mix(uDeep, uJade, 0.65)*up*(fr*1.2 + 0.05*a2) + uSlate*up*(fr*fr*0.12);                  // the leaf ceiling and a little sky on the surface
            water += uLime*bsSunCol()*((uFill.x*0.22 + 0.5*bsGlade(vec2(bsLaneX(vQ.y) + vQ.x, vQ.y)))*a2*a3);
            float pool = smoothstep(125.9, 127.4, vQ.y)*(1.0 - smoothstep(134.0, 140.0, vQ.y));
            float rr = length(vec2(vQ.x, vQ.y - 126.5));
            float ring = pow(0.5 + 0.5*sin(rr*4.2 - uTime*4.6 + 2.0*a1), 5.0)*exp(-rr*0.22)*pool;
            float boil = exp(-rr*rr*0.4)*pool*(0.55 + 0.45*fine);
            vec3 still = mix(uDeep, uJade, 0.22)*up*0.75 + mix(uDeep, uJade, 0.7)*up*(fr*1.6) + uSlate*up*(fr*fr*0.3);
            still += uLime*bsSunCol()*(0.3*bsGlade(vec2(bsLaneX(vQ.y) + vQ.x, vQ.y))*(0.25 + 0.75*ring));
            water = mix(water, still, pool*0.85);
            foam = clamp(foam*(1.0 - 0.85*pool) + boil, 0.0, 1.0);
            vec3 col = mix(water, mix(uWhite, uCeladon, 0.3)*(up*0.76 + bsSunCol()*0.05), foam*(0.58 + 0.42*fine));
            col += mix(uCeladon, uWhite, 0.4)*up*(0.38*ring);
            // the high ledge: a white curtain of falling water, ropes of it brighter, lit where the shaft lands on it
            float fallK = smoothstep(0.8, 0.98, ledge);
            float rope = bsNoise(vec2(vQ.x*5.0 + 3.0, vY*1.3 + uTime*4.2))*0.6 + bsNoise(vec2(vQ.x*14.0, vY*3.1 + uTime*6.5))*0.4;
            vec3 white = mix(uWhite, uCeladon, 0.2)*(up*(0.55 + 0.6*rope) + bsSunCol()*uLime*(0.26*bsGlade(vec2(bsLaneX(vQ.y) + vQ.x, vQ.y))*(0.4 + 0.6*rope)));
            col = mix(col, white, fallK*(0.5 + 0.5*rope));
            gl_FragColor = vec4(col, shore*vD.z*mix(0.82 + 0.18*foam, 0.5 + 0.5*smoothstep(0.25, 0.7, rope), fallK));
            #include <fog_fragment>
          }`,
      });
      const stream = new THREE.Mesh(g, mat); stream.frustumCulled = false; scene.add(stream);
      await ctx.yield();
      // ferns leaning over both banks, so no straight water's edge shows
      const bank = [];
      for (let z = 5; z < zEnd; z += R.range(0.7, 1.5)) {
        const sd = R.sign(), x = laneX(z) + sd * (streamHalf(z) * 0.8 + R.range(-0.1, 1.3));
        if (Math.hypot(x - ledge.x, z - ledge.z) < 3.4) continue;
        bank.push({ x, y: heightAt(x, z) - 0.05, z, rot: R.range(0, 6.28), size: R.range(1.1, 1.9), seed: R(), tone: R.range(0.35, 1) });
      }
      bankFernMesh = hero.addFerns(bank); scene.add(bankFernMesh);
    }
    await ctx.yield();

    // ---------------- the cast ----------------
    const gold = PALETTE[6];
    // the ledge: five golden monkeys huddled in a shaft (or one giant panda, eating, unmoved); and three more of the troop
    // sitting out the gale on the monkey rock in the slalom
    let huddleMesh = null, rockTroop = null, clingers = null;
    const huddleMat = critterMaterial({ time, U, lit: 1.08, amb: 1.2, fur: 1, warm: 1, rim: panda ? '#dfe8e0' : gold });
    {
      const M = new THREE.Matrix4(), Mi = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), geos = [], tv = new THREE.Vector3();
      // one sitting monkey at (x, y, z), turned j from facing `look`. Its tail leaves the rump straight back along the rock
      // and (ta) swings round the haunch toward the edge in one easy curve; where the rock ends it goes over, hangs
      // plumb and ends in a slight forward curl, thin at the tip. o.out: the way (x, z) the curve should swing
      const sitter = (x, y, z, sc, j, look, i0, i1, seed, ta = 0, o = {}) => {
        const v = new THREE.Vector3(x, y - 0.07, z), th = Math.atan2(-(look.z - z), look.x - x) + j;
        M.compose(v, q.setFromAxisAngle(up, th), new THREE.Vector3(sc, sc, sc)); Mi.copy(M).invert();
        if (o.out) ta = Math.abs(ta) * (-Math.cos(th + Math.abs(ta)) * o.out[0] + Math.sin(th + Math.abs(ta)) * o.out[1] >= -Math.cos(th - Math.abs(ta)) * o.out[0] + Math.sin(th - Math.abs(ta)) * o.out[1] ? 1 : -1);
        const pts = [], TL = (ta ? (o.len || 1.3) : 0.95) * sc, st = 0.1, turn = 0.6 * sc;
        const push = (px, py, pz) => { tv.set(px, py, pz).applyMatrix4(Mi); pts.push([tv.x, tv.y, tv.z]); };
        let px = x - Math.cos(th) * 0.17 * sc, pz = z + Math.sin(th) * 0.17 * sc, py = v.y + 0.1 * sc, arc = 0, off = 0, left = 0;
        push(px, py, pz);
        while (arc < TL && pts.length < 60) {
          const aa = th + ta * sstep(0.02, turn, arc), bkx = -Math.cos(aa), bkz = Math.sin(aa);
          const nx = px + bkx * st, nz = pz + bkz * st, ry = off > 0 ? -1e9 : rockY(i0, i1, nx, nz);
          if (ry > py - 0.5) { const ny = Math.min(ry + 0.07 * sc, py + 0.05); arc += Math.hypot(st, ny - py); px = nx; pz = nz; py = ny; }
          else {
            if (off === 0) left = Math.max(TL - arc, 0.5);
            off += st; const w = Math.min(off / left, 1);
            const ph = o.out ? (w < 0.22 ? lerp(-0.35, -1.5, w / 0.22) : w < 0.68 ? -1.5 : lerp(-1.5, -0.8, Math.pow((w - 0.68) / 0.32, 1.5)))
              : (w < 0.3 ? lerp(-0.5, -1.45, w / 0.3) : w < 0.5 ? -1.45 : lerp(-1.45, 0.9, Math.pow((w - 0.5) / 0.5, 1.2)));
            px += bkx * Math.cos(ph) * st; pz += bkz * Math.cos(ph) * st; py += Math.sin(ph) * st; arc += st;
          }
          push(px, py, pz);
        }
        geos.push(monkeyGeometry(gold, 'sit', M, { seed, tail: pts, tailFree: 0.55, tailW: 0.24, backK: 0.4, ...(o.fur || {}) }));
      };
      // how far the bench reaches toward the lane at b metres along it
      const edgeA = (b) => { for (let a = 3.9; a > 0.5; a -= 0.1) if (rockY(ledge.i0, ledge.i1, ledge.x + ledgeIn.x * a + ledgeAlong.x * b, ledge.z + ledgeIn.z * a + ledgeAlong.z * b) > -1e8) return a; return 1.5; };
      const camL = path.pointAt(uLeap - 0.004);
      if (panda) {
        const a = edgeA(0) - 1.25, v = new THREE.Vector3(ledge.x + ledgeIn.x * a, ledge.top - 0.05, ledge.z + ledgeIn.z * a);
        geos.push(pandaGeometry(M.compose(v, q.setFromAxisAngle(up, Math.atan2(-(camL.z - v.z), camL.x - v.x) + 0.4), new THREE.Vector3(1.6, 1.6, 1.6))));
      } else {
        // five in a row along the bench's edge, pressed together, every one turned three-quarters toward us as we come up
        // (gold-orange, all five: a rich coat, cream only down the chest. The two at the ends let their tails down over the
        // edge of the bench on their outer sides; the others' lie behind them)
        for (const [b, sc, j, ta] of [[-2.05, 1.65, 0.42, 2.0], [-1.05, 1.85, 0.1, 0], [-0.02, 1.65, -0.2, 0], [1.0, 1.8, 0.5, 0], [2.15, 1.65, -0.4, 2.0]]) {
          const a = edgeA(b) - (ta ? 0.62 : 0.8), x = ledge.x + ledgeIn.x * a + ledgeAlong.x * b, z = ledge.z + ledgeIn.z * a + ledgeAlong.z * b, y = rockY(ledge.i0, ledge.i1, x, z), sb = Math.sign(b);
          sitter(x, y > -1e8 ? y : ledge.top, z, sc, j, camL, ledge.i0, ledge.i1, b, ta, { out: ta ? [ledgeIn.x * 0.8 + ledgeAlong.x * sb * 0.6, ledgeIn.z * 0.8 + ledgeAlong.z * sb * 0.6] : null, len: 1.45, fur: { rich: 1, tailLift: 0.3, tailThin: 1 } });
          await ctx.yield();
        }
      }
      const m = new THREE.Mesh(mergeBuilt(geos), huddleMat); m.frustumCulled = false; scene.add(m); huddleMesh = m;
      await ctx.yield();
      // (the three on the monkey rock are a mesh of their own: each troop is drawn only on its own stretch of the lane)
      const camR = path.pointAt(0.155); geos.length = 0;
      for (const [i, sc, j, ta] of [[0, 2.15, 0.3, 0], [1, 2.0, -0.3, 0], [2, 2.1, -0.75 * sunSide, 2.2 * sunSide]]) { const st = mRock.seats[i]; sitter(st[0], st[1], st[2], sc, j, camR, mRock.i0, mRock.i1, 0.4 + i, ta); await ctx.yield(); }
      rockTroop = new THREE.Mesh(mergeBuilt(geos), huddleMat); rockTroop.frustumCulled = false; scene.add(rockTroop);
      huddleMat.uniforms.uTail.value.set(windDir.x, -0.5, windDir.y, panda ? 0 : 0.3);
    }
    await ctx.yield();
    // the leapers: they let go of a bowed culm, cross the lane ahead of us and catch another. Three at uLeap (launched on
    // the ledge's side, further up the lane than the ledge: at uLeap all are in the air to the right of the huddle); two
    // more in the slalom, who cross under the fallen clump as we pass the watcher
    const leapMat = critterMaterial({ time, U, lit: 0.92, amb: 1.15, fur: 1, rim: gold });
    leapMat.uniforms.uTail.value.set(-0.25, 0.3, 0, 0.3);
    const leapGeo = monkeyGeometry(gold, 'leap', null), leapers = [];
    await ctx.yield();
    // THE LAW OF THE LEAPERS: at every place the lens is set for a leaper (below), no point of its skin is nearer the
    // lens than LENS_CLEAR, the skin taken where the creature material draws it and at the furthest reach of its
    // flutter.
    //  leapSkin: for each vertex of the leaper's mesh, where the material sets it in the leaper's own frame (its tail
    //   blown aside by uTail), and how far its flutter can carry it from there (0.07 times the square of its tail
    //   weight times (0.4 + uTail.w) on each of two axes). leapReach: the furthest any vertex gets from the leaper's
    //   own origin in that frame, flutter and all. leapFace: the greatest, over the edges of the mesh's faces, of the
    //   edge's length in that frame plus the flutter of its two ends, divided by the square root of 3 (no point of a
    //   face, wherever the flutter carries its corners, lies further than that from the nearest of its corners). leapRun: the vertices in runs of LEAP_RUN as they stand in the
    //   mesh; for each run the mean of its vertices, and the furthest any of them gets from that mean, flutter and
    //   all. (A run whose mean is further from the lens than the air asked plus that reach is passed over; of the
    //   other runs every vertex is measured.)
    //  leapClear(uL, off, sc, a, b): true when the leaper that leaps from a to b keeps that air from the lens at every
    //   place the lens is set for it (below). leapPose sets it where update() will, for the lens s metres along the route: the same arc
    //   keyed to the metres flown through uL and off, the same grip on its culm at either end, the same axes of its
    //   body that face() gives it; it returns the reach of the bob it makes while it holds a culm.
    //   First the leaper is set for the lens at each point of routeP, from the last point at or before the place
    //   where it begins to be drawn to the first at or after the place where it is drawn no more. Where its origin is
    //   then within LENS_CLEAR plus leapReach and leapFace (each times its scale sc) plus two ROUTE_STEP of that point, the lens is
    //   set every tenth of ROUTE_STEP from half a ROUTE_STEP before the point to four tenths after it (by
    //   path.posAtDist; the next point's places begin at the fifth tenth), the leaper for each such place, and every
    //   vertex of leapSkin must be, from the lens, its own flutter plus the hypotenuse of leapFace and LENS_CLEAR plus
    //   the bob (these in the mesh's units). The nearest point of a face whose three corners keep that hypotenuse is
    //   then LENS_CLEAR plus the bob away or more: it is a corner, or the foot of the perpendicular from the lens on
    //   an edge or on the face, where the square of its distance is a corner's less the square of its distance from
    //   that corner. (In the half ROUTE_STEP to either side of a point the lens and a leaper in the air together
    //   shift by less than one ROUTE_STEP.)
    const LEAP_RUN = 32, leapSkin = new Float32Array(leapGeo.attributes.position.count * 4), leapRun = new Float32Array(Math.ceil(leapGeo.attributes.position.count / LEAP_RUN) * 4);
    let leapReach = 0, leapFace = 0;
    {
      const P = leapGeo.attributes.position.array, Wt = leapGeo.attributes.aW.array, tl = leapMat.uniforms.uTail.value;
      for (let i = 0; i * 4 < leapSkin.length; i++) {
        const tw = Wt[i * 2] * Wt[i * 2], x = P[i * 3] + tl.x * tw * tl.w, y = P[i * 3 + 1] + tl.y * tw * tl.w, z = P[i * 3 + 2] + tl.z * tw * tl.w, fl = 0.07 * tw * (0.4 + tl.w) * Math.SQRT2;
        leapSkin[i * 4] = x; leapSkin[i * 4 + 1] = y; leapSkin[i * 4 + 2] = z; leapSkin[i * 4 + 3] = fl;
        leapReach = Math.max(leapReach, Math.hypot(x, y, z) + fl);
      }
      for (let k = 0; k * 4 < leapRun.length; k++) {
        const v0 = k * LEAP_RUN * 4, v1 = Math.min(v0 + LEAP_RUN * 4, leapSkin.length);
        let cx = 0, cy = 0, cz = 0, rr = 0;
        for (let v = v0; v < v1; v += 4) { cx += leapSkin[v]; cy += leapSkin[v + 1]; cz += leapSkin[v + 2]; }
        cx /= (v1 - v0) / 4; cy /= (v1 - v0) / 4; cz /= (v1 - v0) / 4;
        for (let v = v0; v < v1; v += 4) rr = Math.max(rr, Math.hypot(leapSkin[v] - cx, leapSkin[v + 1] - cy, leapSkin[v + 2] - cz) + leapSkin[v + 3]);
        leapRun[k * 4] = cx; leapRun[k * 4 + 1] = cy; leapRun[k * 4 + 2] = cz; leapRun[k * 4 + 3] = rr;
      }
      const I = leapGeo.index ? leapGeo.index.array : null;        // the corners of the faces, three by three (without an index the vertices as they stand)
      for (let f = 0, n = I ? I.length : leapSkin.length / 4; f + 2 < n; f += 3) for (let e = 0; e < 3; e++) {
        const p = (I ? I[f + e] : f + e) * 4, q = (I ? I[f + (e + 1) % 3] : f + (e + 1) % 3) * 4;
        leapFace = Math.max(leapFace, (Math.hypot(leapSkin[p] - leapSkin[q], leapSkin[p + 1] - leapSkin[q + 1], leapSkin[p + 2] - leapSkin[q + 2]) + leapSkin[p + 3] + leapSkin[q + 3]) / Math.sqrt(3));
      }
    }
    const leapAt = new THREE.Vector3(), leapX = new THREE.Vector3(), leapY = new THREE.Vector3(), leapZ = new THREE.Vector3(), leapV = new THREE.Vector3(), leapHold = new THREE.Vector3(), leapLens = new THREE.Vector3();
    const leapPose = (s, uL, off, a, b) => {
      const tr = (s / L - (uL - 0.016)) / 0.032 + off, tt = clamp(tr, 0, 1), hk = 1 - sstep(0, 0.14, tt) + sstep(0.86, 1, tt);
      leapAt.copy(a).lerp(b, tt); leapAt.y += 4.2 * tt * (1 - tt);
      leapX.copy(b).sub(a); leapX.y += 4.2 * (1 - 2 * tt); leapX.normalize().lerp(leapHold, hk).normalize();
      if (hk > 0) leapAt.addScaledVector(leapHold, -0.3 * hk);
      leapZ.set(-leapX.z, 0, leapX.x).normalize(); leapY.crossVectors(leapZ, leapX).normalize();
      const roll = Math.sin(tt * 5 + off * 9) * 0.35 * (1 - hk);
      if (roll) { leapV.copy(leapY).multiplyScalar(Math.cos(roll)).addScaledVector(leapZ, Math.sin(roll)); leapZ.crossVectors(leapX, leapV).normalize(); leapY.copy(leapV); }
      return 0.05 * hk;
    };
    let leapHitS = -1, leapHitV = 0;                              // the place of the lens and the vertex at which a leap was last found too near (leapHitS < 0: none); that pair is measured before all others
    const leapClear = (uL, off, sc, a, b) => {
      leapHold.set(b.x - a.x, 0, b.z - a.z).normalize().multiplyScalar(0.34).setY(0.94);
      // lensAt(s): the leaper set for the lens s metres along the route, and that lens put in the leaper's own frame (leapLens, in the mesh's units); returns the air asked of a vertex there, in those units, flutter apart (the hypotenuse of leapFace and LENS_CLEAR plus the bob)
      const lensAt = (s) => { const air = Math.hypot((LENS_CLEAR + leapPose(s, uL, off, a, b)) / sc, leapFace); path.posAtDist(s, leapLens).sub(leapAt); leapLens.set(leapLens.dot(leapX) / sc, leapLens.dot(leapY) / sc, leapLens.dot(leapZ) / sc); return air; };
      const tooNear = (v, air) => { const dx = leapSkin[v] - leapLens.x, dy = leapSkin[v + 1] - leapLens.y, dz = leapSkin[v + 2] - leapLens.z, d = air + leapSkin[v + 3]; return dx * dx + dy * dy + dz * dz < d * d; };
      if (leapHitS >= 0 && tooNear(leapHitV, lensAt(leapHitS))) return false;
      const i0 = Math.max(Math.floor(((-1.6 - off) * 0.032 + uL - 0.016) * L / ROUTE_STEP), 0), i1 = Math.min(Math.ceil(((2.4 - off) * 0.032 + uL - 0.016) * L / ROUTE_STEP), routeN);   // the points of routeP from the last at or before the place where the leaper begins to be drawn to the first at or after the place where it is drawn no more (none before the route's start or past its end)
      for (let i = i0; i <= i1; i++) {
        const tr = (i * ROUTE_STEP / L - (uL - 0.016)) / 0.032 + off;
        if (tr > 0 && tr < 1) leapPose(i * ROUTE_STEP, uL, off, a, b); else leapAt.copy(tr > 0 ? b : a).addScaledVector(leapHold, -0.3);       // (before and after its leap it holds its culm: where leapPose sets it then, bob apart)
        if (Math.hypot(leapAt.x - routeP[i * 3], leapAt.y - routeP[i * 3 + 1], leapAt.z - routeP[i * 3 + 2]) > LENS_CLEAR + (leapReach + leapFace) * sc + 2 * ROUTE_STEP) continue;
        for (let j = -5; j < 5; j++) {
          const s = clamp((i + j / 10) * ROUTE_STEP, 0, L), air = lensAt(s);
          if (leapLens.length() > air + leapReach) continue;
          for (let k = 0; k < leapRun.length; k += 4) {
            const ex = leapRun[k] - leapLens.x, ey = leapRun[k + 1] - leapLens.y, ez = leapRun[k + 2] - leapLens.z, reach = air + leapRun[k + 3];
            if (ex * ex + ey * ey + ez * ez > reach * reach) continue;
            for (let v = k * LEAP_RUN, v1 = Math.min(v + LEAP_RUN * 4, leapSkin.length); v < v1; v += 4) if (tooNear(v, air)) { leapHitS = s; leapHitV = v; return false; }
          }
        }
      }
      return true;
    };
    const LEAP_STEP = 0.05, LEAP_TRIES = 60;                      // metres by which the far end of a leap is tried, and how many such steps to either side
    for (const [uL, lead, off, sc, from, to, yA, yB] of [[uLeap, 17.5, 0.04, 1.5, 9.5, -11, 2.2, 0.9], [uLeap, 15, -0.13, 1.34, 9.5, -11, 2.7, 0.7], [uLeap, 12.5, -0.3, 1.42, 9.5, -11, 3.2, 0.5],
      [0.25, 11.5, 0.07, 1.65, -8.5 * sunSide, 9.5 * sunSide, 0.5, -1.0], [0.25, 9.0, -0.17, 1.55, -8.5 * sunSide, 9.5 * sunSide, 1.3, -1.6]]) {
      const camY = path.pointAt(uL).y, c = path.pointAt(uL + lead / L), t = path.tangentAt(uL + lead / L), h = Math.hypot(t.x, t.z) || 1, lx = t.z / h, lz = -t.x / h;   // (lx, lz): to the left of travel
      const m = new THREE.Mesh(leapGeo, leapMat); m.frustumCulled = false; m.visible = false; scene.add(m);
      const a = new THREE.Vector3(c.x + lx * from, camY + yA, c.z + lz * from), b = new THREE.Vector3(c.x + lx * to + t.x / h * 3, camY + yB, c.z + lz * to + t.z / h * 3);
      // (the law of the leapers) A leaper whose leap keeps the clear air as it is set stays as it is set. Otherwise the
      // far end of its leap, b, is slid along the line across the lane it was set on: LEAP_STEP at a time to both sides
      // of where it was set, the nearer first and of two equally near the one further out from the lane first, as far
      // as LEAP_TRIES steps, and the first place that keeps the law is taken (the culm it catches is planted there,
      // below). If none does, b is put back where it was set and the leaper is not drawn.
      leapHitS = -1;                                                // (nothing is remembered from the leaper before)
      if (!leapClear(uL, off, sc, a, b)) {
        const bx = b.x, bz = b.z, out = Math.sign(to) * LEAP_STEP;
        let set = false;
        for (let n = 1; n <= LEAP_TRIES && !set; n++) for (const k of [n, -n]) {
          b.x = bx + lx * out * k; b.z = bz + lz * out * k;
          if (leapClear(uL, off, sc, a, b)) { set = true; break; }
        }
        if (!set) { b.x = bx; b.z = bz; m.removeFromParent(); }
      }
      // each holds a culm of its own before the leap and catches another after it (no popping in or out of the air)
      const hold = new THREE.Vector3(b.x - a.x, 0, b.z - a.z).normalize().multiplyScalar(0.34).setY(0.94);
      leapers.push({ m, uL, off, sc, a, b, hold, dir: new THREE.Vector3() });
    }
    await ctx.yield();
    // six more cling to culms of their own in the parting, placed for the camera at u 0.62: two culms with two monkeys
    // each 12 m ahead on either bank, two more higher up the gully for the rest of the climb
    {
      const uC = 0.62, Cm = path.pointAt(uC), t = path.tangentAt(uC), h = Math.hypot(t.x, t.z) || 1, fx = t.x / h, fz = t.z / h, rx = -fz, rz = fx;
      const spec = [[9.5, -5.7, 2.4, 1.75, -1], [9.5, -5.7, 6.0, 1.6, 0], [11.5, 5.6, 3.6, 1.7, -1], [11.5, 5.6, 7.4, 1.9, 2], [19, -6.2, 9.5, 2.3, -1], [23, 6.2, 12.5, 2.5, -1]], list = [];
      for (const [ahead, lat, relH, scale, share] of spec) {
        const x = Cm.x + fx * ahead + rx * lat, z = Cm.z + fz * ahead + rz * lat, sd = Math.sign(lat);
        const it = { x, z, s: clamp(Cm.y + relH - (heightAt(x, z) - 0.15), 6.5, 19.5), scale, az: Math.atan2(-rz * sd * 0.8 - fz * 0.6, -rx * sd * 0.8 - fx * 0.6) + R.range(-0.25, 0.25), h: R.range(26, 28) };
        if (share >= 0) it.share = share;
        list.push(it); if (share < 0) put(x, z);
      }
      clingers = hero.addMonkeys(list, { sprays: 2 }).group; clingers.visible = false;
    }
    await ctx.yield();
    // culms for the leapers to hold; and plume rows along every skyline and hill outline the crest flight sees (the
    // sheet alone gives the near hills a smooth edge): found by looking out from three points of the crest path
    let leapCulms = null;
    const heroFerns = hero.own.children.filter((c) => c.name === 'bamboo-surf-ferns');
    {
      // (added later) the lane floor of the gully head was bare litter under the steady camera: small ferns reach into it,
      // well under the 3 m flight line, either side of the first thread of the stream
      const list = [];
      for (let k = 0; k < 200 && list.length < 84; k++) {
        const z = RX.range(-46, 6), x = laneX(z) + RX.range(-3.7, 3.7);
        if (z > 0 && Math.abs(x - laneX(z)) < streamHalf(z) + 0.5) continue;
        list.push({ x, y: heightAt(x, z) - 0.05, z, rot: RX.range(0, 6.28), size: RX.range(0.5, 1.05) * 1.3, seed: RX(), tone: RX() });
      }
      const m = hero.addFerns(list, { fronds: 4, segs: 2 }); scene.add(m); heroFerns.push(m);
    }
    {
      const lc = [];
      for (const l of leapers) for (const q of [l.a, l.b]) lc.push({ x: q.x, z: q.z, near: true, r: 0.085, h: 26, age: 0.7, lean: 0.015, stiff: 0.22 });
      leapCulms = hero.plant(lc, { perNear: 3 });
      const list = [], eye = new THREE.Vector3(), tg = new THREE.Vector3(), RSk = makeRng(hashSeed('bs-skyline:' + ctx.seed));
      const addAt = (dx, dz, bd) => {
        for (let r = 0, nr = bd > 380 ? 1 : 2; r < nr; r++) {
          const d = bd + RSk.range(-4, 5) + r * 7, x = eye.x + dx * d + RSk.range(-3, 3), z = eye.z + dz * d + RSk.range(-3, 3), H = 33 + bd / 45 + RSk.range(0, 6);
          list.push({ x, z, y: heightAt(x, z) + 21.5 - H, h: H, near: false });
        }
      };
      for (const uc of [uTop + 0.03, 0.5 * (uTop + 1), 0.93]) {
        path.pointAt(uc, eye); path.tangentAt(uc, tg); const hd = Math.atan2(tg.x, -tg.z);
        for (let ai = -62; ai <= 62; ai++) {
          const az = hd + ai * 0.021, dx = Math.sin(az), dz = -Math.cos(az); let run = -1e9, rd = 0, armed = false;
          for (let d = 40; d <= 900; d += 10) {
            const e = (topAt(eye.x + dx * d, eye.z + dz * d) - eye.y) / d;
            if (e > run) { run = e; rd = d; armed = true; }
            else if (armed && run - e > 0.012) { armed = false; if (rd >= 60 && rd <= 860) addAt(dx, dz, rd); }
          }
          if (armed && rd >= 60 && rd <= 860) addAt(dx, dz, rd);
          if ((ai & 3) === 0) await ctx.yield();
        }
      }
      // and real crowns over every slope that faces the crest flight within 220 m (seen face-on the sheet shows for what
      // it is: flat): one plume every 8 m or so, looked for from stations along the path
      {
        const seen = new Set(); let k = 0, nFill = 0;
        for (let uc = uTop + 0.03; uc < 0.98 && nFill < 600; uc += 0.03) {
          path.pointAt(uc, eye); path.tangentAt(uc, tg); const hd = Math.atan2(tg.x, -tg.z);
          for (let ai = -16; ai <= 16; ai++) {
            const az = hd + ai * 0.087, dx = Math.sin(az), dz = -Math.cos(az);
            for (let d = 44; d < 220 && nFill < 600; d += 8) {
              const x = eye.x + dx * d + RSk.range(-3.5, 3.5), z = eye.z + dz * d + RSk.range(-3.5, 3.5), H = 31 + RSk.range(0, 6), key = Math.round(x / 7.5) + ':' + Math.round(z / 7.5);
              if (seen.has(key)) continue;
              const gt = topAt(x, z), gy = gt - 19;
              if (-(hN.nx * dx + hN.nz * dz) - (gt - eye.y) / d < 0.3) continue;   // only ground that faces the eye
              seen.add(key); nFill++;
              list.push({ x, z, y: gy + 21.5 - H, h: H, near: false });
            }
            if ((++k & 63) === 0) await ctx.yield();
          }
        }
      }
      const keep = list.filter((c) => !MT.inside(c.x, c.z));
      plantStaged(keep, { perFar: 1, culms: false }, false, true);
    }
    await ctx.yield();
    // ---------------- crown tufts: every crown the crest flight can see, 9 to 760 m out ----------------
    // Found by looking out from stations along the crest path: rays 1.2 degrees apart, marched outward, keeping what
    // stands above the horizon made by nearer ground. Crowns are 5.5 m across near the path and grow with distance (so
    // each stays 6 to 12 pixels wide), one per cell of its own size.
    let tufts = null, tuftOn = null;
    {
      const RTu = makeRng(hashSeed('bs-tufts:' + ctx.seed)), jit = [0, 0, 0, 0, 0];
      const stations = [], tA = [], tN = [], seen = new Set(), capAll = Math.round(26000 * (0.55 + 0.45 * detail)); let cap = Math.round(capAll * 0.74);
      for (let uc = uTop + 0.02; uc < 0.985; uc += 0.056) { const e = path.pointAt(uc), t = path.tangentAt(uc); stations.push({ x: e.x, y: e.y, z: e.z, hd: Math.atan2(t.x, -t.z) }); }
      const dPath = (x, z) => { let m = 1e12; for (let i = 0; i < stations.length; i++) { const st = stations[i], ex = x - st.x, ez = z - st.z, q = ex * ex + ez * ez; if (q < m) m = q; } return Math.sqrt(m); };
      // cells already looked at keep their height (a later station's ray crossing one need not ask the terrain again)
      let n = 0, kk = 0;
      // two passes: first the crowns near the path from every station (so none goes short), then the far ones
      for (let pass = 0; pass < 2; pass++) for (const st of stations) {
        for (let ai = -84; ai <= 84 && n < cap; ai++) {
          const az = st.hd + ai * 0.0209 + RTu.range(-0.004, 0.004), dx = Math.sin(az), dz = -Math.cos(az), dEnd = pass ? 760 : 215; let run = -1e9;
          for (let d = 12; d < dEnd && n < cap; d += 0.88 * Math.max(pass && d < 150 ? 11 : 5.5, d / 40)) {
            const x = st.x + dx * d, z = st.z + dz * d, dm = dPath(x, z);
            const sq = dm < 190 ? 5.5 : dm < 270 ? 7 : dm < 380 ? 9.5 : dm < 540 ? 13 : 17.5, cell = sq * 0.86, key = (Math.round(x / cell) + 4096) * 8192 + Math.round(z / cell) + 4096 + sq * 1e8;
            const gy = topAt(x, z), nx = hN.nx, nz = hN.nz;
            const elv = (gy - st.y) / d, vis = elv > run - 0.012;
            if (elv > run) run = elv;
            for (let j = 0; j < 5; j++) jit[j] = RTu();
            if (!vis || dm < 9 || (pass === 0) !== (dm < 190) || dm >= 720 || seen.has(key)) continue;
            seen.add(key);
            const nl = Math.hypot(nx, 1, nz);
            tA.push(x + (jit[0] * 0.6 - 0.3) * cell, gy, z + (jit[1] * 0.6 - 0.3) * cell, sq * (0.85 + 0.4 * jit[2])); tN.push(nx / nl, nz / nl, jit[3], jit[4] < 0.5 ? 0 : 1); n++;
          }
          if ((ai & 3) === 0) await ctx.yield();
        }
      }
      // third pass: the ridges of the vista, out to 1,900 m, from two points of the high flight. Crowns there are whole
      // stands (16 to 25 m), still only a few pixels wide, so a far ridge reads finer than a near one
      cap = capAll;
      for (const uc of [0.5 * (uTop + 0.79) + 0.04]) {
        const e = path.pointAt(uc), a0 = Math.atan2(g0.x, -g0.z);
        for (let ai = -58; ai <= 58 && n < cap; ai++) {
          const az = a0 + ai * 0.0175 + RTu.range(-0.004, 0.004), dx = Math.sin(az), dz = -Math.cos(az); let run = -1e9;
          for (let d = 40; d < 1900 && n < cap; d += d < 700 ? 12 + d / 16 : 0.88 * d / 46) {
            const x = e.x + dx * d, z = e.z + dz * d;
            if (d < 700) { const elv = (topFar(x, z) - e.y) / d; if (elv > run) run = elv; continue; }
            const dm = dPath(x, z), sq = dm < 800 ? 16 : dm < 1150 ? 20 : 25, cell = sq * 0.86, key = (Math.round(x / cell) + 4096) * 8192 + Math.round(z / cell) + 4096 + sq * 1e8;
            const gy = topFar(x, z), nx = hN.nx, nz = hN.nz;
            const elv = (gy - e.y) / d, vis = elv > run - 0.006;
            if (elv > run) run = elv;
            for (let j = 0; j < 5; j++) jit[j] = RTu();
            if (!vis || dm < 720 || seen.has(key)) continue;
            seen.add(key);
            const nl = Math.hypot(nx, 1, nz);
            tA.push(x + (jit[0] * 0.6 - 0.3) * cell, gy, z + (jit[1] * 0.6 - 0.3) * cell, sq * (0.85 + 0.4 * jit[2])); tN.push(nx / nl, nz / nl, jit[3], jit[4] < 0.5 ? 0 : 1); n++;
          }
          if ((ai & 3) === 0) await ctx.yield();
        }
      }
      await ctx.yield();
      {                                                                     // none inside the table's foot, in a knoll's clump or where the crowns under the lens stand
        let w = 0;
        for (let i = 0; i < n; i++) {
          const x = tA[i * 4], z = tA[i * 4 + 2];
          if ((i & 4095) === 4095) await ctx.yield();
          if (MT.inside(x, z) || KN.near(x, z) || crestD(x, z) < STRIP - 1.5) continue;
          for (let c = 0; c < 4; c++) { tA[w * 4 + c] = tA[i * 4 + c]; tN[w * 4 + c] = tN[i * 4 + c]; }
          w++;
        }
        n = w; tA.length = n * 4; tN.length = n * 4;
        // every crown is drawn from the place of the route where the lens first comes within 185 m of it (firstNear):
        // they are laid in that order, and update() draws as many as have come that near
        await ctx.yield();
        const on = new Float32Array(n), order = new Uint32Array(n), a2 = new Float32Array(n * 4), n2 = new Float32Array(n * 4);
        for (let i = 0; i < n; i++) { on[i] = firstNear(tA[i * 4], tA[i * 4 + 1], tA[i * 4 + 2]); order[i] = i; if ((i & 2047) === 2047) await ctx.yield(); }
        await ctx.yield();
        order.sort((p, q) => on[p] - on[q]);
        await ctx.yield();
        tuftOn = new Float32Array(n);
        for (let i = 0; i < n; i++) { const j = order[i]; tuftOn[i] = on[j]; for (let c = 0; c < 4; c++) { a2[i * 4 + c] = tA[j * 4 + c]; n2[i * 4 + c] = tN[j * 4 + c]; } }
        tA.length = 0; tN.length = 0; tufts = [a2, n2];
      }
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute([-1, 0, 0, 1, 0, 0, -1, 1, 0, 1, 1, 0], 3));
      g.setIndex([0, 1, 2, 1, 3, 2]);
      g.setAttribute('aT', new THREE.InstancedBufferAttribute(tufts[0], 4));
      g.setAttribute('aN', new THREE.InstancedBufferAttribute(tufts[1], 4));
      g.instanceCount = n;
      tufts = new THREE.Mesh(g, tuftMaterial(U, seaX)); tufts.frustumCulled = false; tufts.visible = false; scene.add(tufts);
    }
    await ctx.yield();
    // the pheasants: a cock (golden, or silver) and two brown hens flushing across the lane
    const uFlush = 0.47, birds = [];
    await ctx.yield();
    {
      const c0 = path.pointAt(uFlush + 7.6 / L), t0 = path.tangentAt(uFlush + 7.6 / L), h = Math.hypot(t0.x, t0.z) || 1;
      const nl = new THREE.Vector3(t0.z / h, 0, -t0.x / h), fw = new THREE.Vector3(t0.x / h, 0, t0.z / h);      // nl: toward the left of travel
      const kinds = [silverPheasant ? 2 : 0, 1, 1];
      for (let i = 0; i < 3; i++) {
        const mat = critterMaterial({ time, U, lit: 0.95, rim: kinds[i] === 2 ? '#eef2f4' : gold });
        mat.uniforms.uTail.value.set(0, 0.05, 0, 0.18);
        const m = new THREE.Mesh(pheasantGeometry(kinds[i]), mat); m.frustumCulled = false; m.visible = false; scene.add(m);
        // they start down in the fern layer on the left and are out of frame on the right before the arc ends
        const a = c0.clone().addScaledVector(nl, 8.0 - i * 0.8).addScaledVector(fw, i * 2.0); a.y = heightAt(a.x, a.z) - 0.3;
        const b = c0.clone().addScaledVector(nl, -15).addScaledVector(fw, 3.2 + i * 2.4); b.y = c0.y + 1.3 - i * 0.9;
        birds.push({ m, mat, a, b, i, delay: i * 0.15, sc: i === 0 ? 2.05 : 1.6 });
        await ctx.yield();
      }
    }
    // magpies (or parrotbills) flung downwind above the crowns, swifts along the front
    // (the parrotbills: eighty small birds strung out along the wind in one loose ribbon, flung past us; it holds
    // ahead-left for four seconds, its nearest birds 6 m off, rising and falling along its length like smoke, then peels
    // away to the left of the gate. Buff and chestnut in the western light.)
    // (the ribbon meets us where the eye passes the V's head, sHead, and from there it runs on seconds of the flight,
    // on three lengths of its own: FLK_IN s flung in, FLK_HOLD s held ahead-left, FLK_OUT s the peel)
    const FLK_IN = 1, FLK_HOLD = 4, FLK_OUT = 3;
    // THE FLIGHT'S TIME AT u. flightT[i]: the seconds flown when the eye is at u = i / FLIGHT_N; flightAt(u) reads the
    // table by a straight line between two steps. It is filled once, at the end of build(): see "the flight's time"
    const FLIGHT_N = 512, flightT = new Float64Array(FLIGHT_N + 1);
    const flightAt = (u) => { const x = clamp(u, 0, 1) * FLIGHT_N, i = Math.min(FLIGHT_N - 1, Math.floor(x)); return flightT[i] + (flightT[i + 1] - flightT[i]) * (x - i); };
    let flock = null;
    if (parrotbills) { flock = flockMesh(parrotbillGeometry(), flockMaterial(U, time, 0, { size: 2.3, lit: 1.3, amb: 1.5, warm: 0.6, floor: 0.2 }), 80, makeRng(hashSeed('bs-flock:' + ctx.seed)), 'ribbon'); flock.material.uniforms.uA.value.set(windDir.x, 0, windDir.y); scene.add(flock); }
    await ctx.yield();
    // six red-billed blue magpies of our own (long graduated tails, white-tipped): flung in from behind-left, they hold
    // ahead-left of the lens above the crowns, then peel away
    const magpies = [], magW0 = uTop - 0.02, magW1 = uTop + 0.18;
    if (!parrotbills) {
      R.fork('mag');                                                         // (keeps the random sequence of the first build)
      const geo = magpieGeometry(), lay = [[0, 0, 0], [1.9, 0.7, -2.0], [-0.9, -0.5, 2.6], [2.8, -0.4, 1.7], [0.7, 1.1, 3.8], [3.6, 0.4, -0.6]];
      for (let j = 0; j < 6; j++) {
        const mat = critterMaterial({ time, U, lit: 1.5, amb: 2.4, rim: '#a9c4ff' }); mat.uniforms.uTail.value.set(0, 0.02, 0, 0.1);
        const m = new THREE.Mesh(geo, mat); m.frustumCulled = false; m.visible = false; scene.add(m);
        magpies.push({ m, mat, ox: lay[j][0], oy: lay[j][1], oz: lay[j][2], ph: RX.range(0, 6.28), f1: RX.range(0.7, 1.2), f2: RX.range(1.0, 1.6) });
      }
    }
    // forty Pacific swifts hawking along the front, on every flight: dark scything crescents (twice their build), each
    // on a wide loop of its own about one place of the world: over the left-hand valley beside the middle of the crest
    // flight, 95 m off it on the side the rain comes from and 14 m above it; none comes within 40 m of the flight
    const swifts = flockMesh(swiftGeometry(), flockMaterial(U, time, 1, { size: 2.0, lit: 0.8, amb: 0.9 }), 40, makeRng(hashSeed('bs-swift:' + ctx.seed)), true); scene.add(swifts);
    let sSwifts = 0;
    {
      const um = (uTop + 1) * 0.5, c = path.pointAt(um), t = path.tangentAt(um); t.y = 0; t.normalize();
      const sd = (-t.z * rainDir.x + t.x * rainDir.z) > 0 ? 1 : -1, su = swifts.material.uniforms;       // (the hand the rain comes from)
      su.uC.value.set(c.x - t.z * sd * 95 + t.x * 30, c.y + 14, c.z + t.x * sd * 95 + t.z * 30); su.uF.value.copy(t); su.uShape.value.set(55, 28, 7, 1); su.uVel.value = 0;
      sSwifts = sSkirt;
    }
    await ctx.yield();

    // ---------------- weather: slant rain, the rain curtain, mist off the valley heads, far ridges ----------------
    const fxs = fx.fxGroup(); scene.add(fxs.object);
    const rainN = Math.round(6000 * LK.rain * (0.5 + 0.5 * detail));
    fxs.add(fx.makeParticles({ rng: R.fork('rain'), preset: 'rain', time, count: Math.max(rainN, 600), velocity: [windDir.x * 9, -21, windDir.y * 9], opacity: lookName === 'night' ? 0.22 : 0.3 }));
    if (season === 'snow') fxs.add(fx.makeParticles({ rng: R.fork('snow'), preset: 'snow', time, count: Math.round(3600 * (0.5 + 0.5 * detail)), velocity: [windDir.x * 7, -2.2, windDir.y * 7] }));
    if (rare) fxs.add(fx.makeParticles({ rng: R.fork('chaff'), preset: 'pollen', time, follow: false, center: [(flowerAt.x + exitP.x) * 0.5 + 20, yTop - 16, (flowerAt.z + exitP.z) * 0.5 - 20], box: [300, 64, 300],
      count: Math.round(9000 * (0.5 + 0.5 * detail)), velocity: [windDir.x * 11, 0.3, windDir.y * 11], velocityRandom: [3, 1.2, 3], size: [0.16, 0.4], colors: ['#f2c860', '#ffe29a', '#e3a13b'], intensity: 1.5 }));
    const curtainCol = C(lookName === 'evening' ? '#eadccb' : lookName === 'night' ? '#8ea4c8' : '#e2e8ea').multiplyScalar(lookName === 'night' ? 0.3 : lookName === 'noon' ? 0.6 : 0.84);
    const curtains = [], rainPerp = new THREE.Vector3(-rainDir.z, 0, rainDir.x), rainSide = Math.sign(path.endTangent.x * rainPerp.x + path.endTangent.z * rainPerp.z) || 1;
    for (let i = 0; i < 3; i++) {
      const mat = curtainMaterial(time, curtainCol); mat.uniforms.uSeed.value = i + R(); mat.uniforms.uOpacity.value = (lookName === 'storm' ? 0.93 : 0.8) - i * 0.08;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(2500 - i * 300, 1150), mat); m.frustumCulled = false; m.renderOrder = 2; scene.add(m);
      curtains.push({ m, back: i * 240, lat: (i - 1) * 520 });
    }
    {
      const pos = [], mc = fogOut.clone().lerp(C(lookName === 'evening' ? '#f3d9b8' : '#dfe8e8'), lookName === 'night' ? 0.15 : 0.35);
      const want = Math.round(30 * LK.mist * (0.6 + 0.4 * detail));
      for (let k = 0; k < want * 12 && pos.length < want; k++) {
        const z = R.range(zP - 500, -90), x = crestX(Math.max(z, zP)) + R.sign() * R.range(130, 620), h = heightAt(x, z);
        if (h < -22) pos.push([x, h + 24 + R.range(0, 16), z]);
      }
      if (pos.length) fxs.add(fx.makeMist({ rng: R.fork('mist'), time, positions: pos, size: [90, 190], color: mc, opacity: lookName === 'evening' ? 0.15 : 0.11, flatten: 0.3, drift: [windDir.x * 4, 0.5, windDir.y * 4] }));
    }
    // and in the two valleys that fall away either side of the crest flight: puffs standing in them 30 to 50 m
    // below the lens, 60 to 130 m out, torn off downwind and upward
    {
      const pos = [], RMi = makeRng(hashSeed('bs-vmist:' + ctx.seed)), mc = fogOut.clone().lerp(C(lookName === 'evening' ? '#f3d9b8' : '#e4ecec'), lookName === 'night' ? 0.2 : 0.55), o5 = { x: 0, z: 0 };
      for (let sd = sV10 + 30; sd < L - 20; sd += RMi.range(44, 64)) for (const sg of [-1, 1]) {
        side(sd, sg * RMi.range(70, 135), o5);
        pos.push([o5.x, heightAt(o5.x, o5.z) + 19 + RMi.range(5, 15), o5.z]);
      }
      if (pos.length) fxs.add(fx.makeMist({ rng: RMi, time, positions: pos, size: [46, 92], color: mc, opacity: lookName === 'evening' ? 0.11 : 0.1, flatten: 0.34, drift: [windDir.x * 7, 1.6, windDir.y * 7] }));
    }
    // mist lying in strands in the valleys between the ridges of the vista (each a long upright ribbon along its valley,
    // seen side-on from the crest), a few more tearing off the crests downwind
    let strands = null;
    {
      // (each bank is lumpy: three or four times deeper in the middle than at its frayed ends, bent with its valley,
      // and broken in the shader into two or three puffs)
      const SEG = 18, pos = [], aS = [], idx = [], RS = makeRng(hashSeed('bs-strand:' + ctx.seed)), eyeY = yTop + 18;
      const strand = (x0, z0, dxn, dzn, len, hh, y) => {
        const o = pos.length / 3, seed = RS(), bend = RS.range(30, 60) * RS.sign(), b2 = RS.range(8, 20), f1 = RS.range(2.2, 3.6), p1 = RS.range(0, 6.28), f2 = RS.range(5, 8), p2 = RS.range(0, 6.28), fl = RS.range(5.5, 9), pl = RS.range(0, 6.28);
        for (let i = 0; i <= SEG; i++) for (const v of [-1, 1]) {
          const t = i / SEG, off = bend * Math.sin(t * f1 + p1) + b2 * Math.sin(t * f2 + p2), x = x0 + dxn * len * (t - 0.5) - dzn * off, z = z0 + dzn * len * (t - 0.5) + dxn * off;
          const env = (0.22 + 0.78 * Math.pow(Math.sin(Math.PI * t), 0.9)) * (0.4 + 0.6 * Math.sin(t * fl + pl) ** 2);
          pos.push(x, y + hh * (0.55 * Math.sin(t * f1 * 1.3 + p2) + 0.25 * Math.sin(t * 11 + seed * 31)), z); aS.push(t, v, hh * 2.3 * (0.18 + 0.82 * env), seed);
        }
        for (let i = 0; i < SEG; i++) { const a = o + i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
      };
      const nS = Math.round(2 + 2 * LK.mist);
      for (let k = 1; k < 4; k++) {
        const r = VR[k], sv = k === 0 ? r.S - 150 : 0.5 * (VR[k - 1].S + r.S) + 10;       // the valley in front of ridge k
        const sight = k === 0 ? -1e9 : eyeY + (VR[k - 1].H + 19 - eyeY) * sv / VR[k - 1].S;   // what the ridge in front hides
        for (let j = 0; j < nS; j++) {
          const c = RS.range(-100, 420 + k * 240), sj = sv + RS.range(-40, 60), x = vO.x + r.nx * sj + r.nz * c, z = vO.z + r.nz * sj - r.nx * c, hh = RS.range(9, 15) * (1 + 1.0 * k);
          strand(x, z, r.nz, -r.nx, RS.range(200, 380) * (1 + 0.12 * k), hh, Math.max(heightAt(x, z) + 19 + RS.range(4, 12), sight + hh * 0.5 + RS.range(0, 8)));
        }
        if (k < 3) for (let j = 0; j < 2; j++) {                                // torn off the crest, trailing downwind
          const c = RS.range(-60, 500), x = vO.x + r.nx * r.S + r.nz * c, z = vO.z + r.nz * r.S - r.nx * c, len = RS.range(150, 260);
          strand(x + windDir.x * len * 0.45, z + windDir.y * len * 0.45, windDir.x, windDir.y, len, RS.range(7, 11) * (1 + 0.4 * k), heightAt(x, z) + 19 + RS.range(6, 12));
        }
      }
      // and torn off the heads of the two valleys that fall away beside the crest flight: short banks lying
      // downwind from the slopes 50 to 100 m either side of us, below the lens
      {
        const o6 = { x: 0, z: 0 }; let j = 0;
        for (let sd = sV10 + 36; sd < L - 30; sd += RS.range(34, 56), j++) {
          side(sd, (j & 1 ? 1 : -1) * RS.range(50, 100), o6);
          const len = RS.range(70, 125), hh = RS.range(3.5, 6.5), y = heightAt(o6.x, o6.z) + 19 + RS.range(5, 11);
          strand(o6.x + windDir.x * len * 0.42, o6.z + windDir.y * len * 0.42, windDir.x, windDir.y, len, hh, y);
        }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aS', new THREE.Float32BufferAttribute(aS, 4)); g.setIndex(idx);
      const mat = new THREE.ShaderMaterial({
        fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendEquation: THREE.AddEquation,
        uniforms: { ...fogU(), uTime: time, uWind: U.uWind, uColor: { value: fogOut.clone().lerp(C(lookName === 'evening' ? '#f6e2c6' : lookName === 'night' ? '#9fb4d8' : '#e6eeee'), lookName === 'night' ? 0.4 : 0.7) }, uOpacity: { value: 0.2 + 0.09 * LK.mist } },
        vertexShader: /* glsl */`
          attribute vec4 aS; uniform float uTime; uniform vec4 uWind; varying vec4 vS;
          #include <fog_pars_vertex>
          void main(){
            float sw = sin(uTime*0.11 + aS.w*30.0 + aS.x*4.0);
            vec3 p = position;
            p.y += aS.y*aS.z*(0.78 + 0.22*sw) + 2.5*sw;
            p.xz += uWind.xy*(9.0*sin(uTime*0.07 + aS.w*17.0) + 14.0*aS.x*aS.x*(0.5 + 0.5*sin(uTime*0.05 + aS.w*5.0)));
            vS = aS;
            vec4 mvPosition = modelViewMatrix*vec4(p, 1.0);
            gl_Position = projectionMatrix*mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */`
          uniform float uTime, uOpacity; uniform vec3 uColor; varying vec4 vS;
          #include <fog_pars_fragment>
          float sH(vec2 p){ p = fract(p*vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y)*p.y); }
          float sN(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0 - 2.0*f);
            return mix(mix(sH(i), sH(i + vec2(1.0, 0.0)), f.x), mix(sH(i + vec2(0.0, 1.0)), sH(i + vec2(1.0, 1.0)), f.x), f.y); }
          void main(){
            float t = vS.x, v = vS.y, seed = vS.w;
            float n = sN(vec2(t*5.0 - uTime*0.02 + seed*13.0, v*1.1 + seed*5.0))*0.6 + sN(vec2(t*13.0 - uTime*0.035 + seed*3.0, v*2.4))*0.4;
            float puff = smoothstep(0.34, 0.62, sN(vec2(t*3.6 + seed*41.0 - uTime*0.012, seed*7.0))*0.75 + 0.25*n);      // two or three puffs along it
            float soft = 1.0 - abs(v);
            float body = smoothstep(0.0, 0.75, soft + (n - 0.5)*0.7)*(0.45 + 0.55*soft);                       // a soft lumpy outline, densest in the middle
            float a = body*smoothstep(0.0, 0.28, t)*(1.0 - smoothstep(0.62, 1.0, t))*(0.06 + 0.94*puff)*smoothstep(0.2, 0.8, n + 0.35*soft)*uOpacity;
            float fogK = 0.0;
            #ifdef FOG_EXP2
              fogK = 1.0 - exp(-fogDensity*fogDensity*vFogDepth*vFogDepth);
            #endif
            #ifdef USE_FOG
              gl_FragColor = vec4(mix(uColor, fogColor, fogK*0.7)*a, a);
            #else
              gl_FragColor = vec4(uColor*a, a);
            #endif
          }`,
      });
      strands = new THREE.Mesh(g, mat); strands.frustumCulled = false; strands.renderOrder = 1; strands.visible = false; scene.add(strands);
    }
    await ctx.yield();
    if (rare) {
      const pos = [];
      for (let k = 0; k < 16; k++) { const t = k / 15; pos.push([lerp(flowerAt.x, exitP.x + 30, t) + R.range(-25, 25), lerp(heightAt(flowerAt.x, flowerAt.z) + 30, yTop - 3, t) + R.range(-4, 4), lerp(flowerAt.z, exitP.z - 30, t) + R.range(-25, 25)]); }
      fxs.add(fx.makeMist({ rng: R.fork('chaffsmoke'), time, positions: pos, size: [34, 70], color: '#e9c46a', opacity: 0.17, drift: [windDir.x * 9, 0.3, windDir.y * 9] }));
    }
    const ridges = makeHorizonRidges({ rng: R.fork('ridges'), layers: 3, radius: [2000, 3500], height: [150, 340], base: -90, jagged: 0.2, coverage: 0.85,
      colorNear: lookName === 'night' ? '#16303a' : season === 'snow' ? '#7f9690' : '#2e5f4a', haze: fogOut, hazeNear: 0.45, sunDir, sunColor: LK.sunCol, sunIntensity: lookName === 'noon' ? 0.2 : lookName === 'night' ? 0.12 : 0.8, ambient: lookName === 'night' ? '#1c2c44' : LK.hemiSky, rim: lookName === 'night' ? 0.05 : 0.15 });
    scene.add(ridges.object);

    // ---------------- THE TABLE: red sandstone standing out of the crown sea beyond the saddle, to the right of the ring:
    // bedded rock, a hanging garden on each ledge, vines over its lip, bamboo on its top, the typhoon's rain pouring off
    // it in ribbon falls that the gusts tear sideways into spray. Blue-green while the cloud lies on it; warm when the
    // western tear lights it (uMesaSun) ----------------
    let mesa = null; const mesaAt = new THREE.Vector3(MT.mc.x, yTop + 34, MT.mc.z);
    {
      const { RM, mc, cr, sr, thC, outline, butt, topY } = MT, th0 = thC + Math.PI;
      const s0 = 0.31 + RM.range(-0.04, 0.04), s1 = 0.63 + RM.range(-0.04, 0.04);
      const vs = [0, 0.08, 0.16, 0.24, s0 - 0.004, s0 + 0.004, 0.44, 0.54, s1 - 0.004, s1 + 0.004, 0.74, 0.84, 0.9, 0.93, 0.965, 1.0];
      const prof = (v) => 1.0 + 0.3 * Math.pow(1 - Math.min(v / 0.24, 1), 1.7) - 0.05 * v - (v > s0 ? 0.05 : 0) - (v > s1 ? 0.045 : 0) + 0.02 * sstep(0.84, 0.93, v) - 0.3 * Math.pow(sstep(0.93, 1, v), 1.6);
      const at = (th, v, out) => {                                          // a point of the wall; out.b = buttress (+) or gully (-)
        const b = butt(th), r = (outline(th) + 25 * b) * prof(v), lx = Math.cos(th) * r, lz = Math.sin(th) * r;
        out.x = mc.x + lx * cr - lz * sr; out.z = mc.z + lx * sr + lz * cr; out.b = b; return out;
      };
      const NT = 132, NV = vs.length, pos = [], am = [], idx = [], o = { x: 0, z: 0, b: 0 }, foot = [];
      for (let i = 0; i <= NT; i++) {
        const th = i / NT * 6.2832 + th0;
        at(th, 0, o); const yB = heightAt(o.x, o.z) + 19 - 9; foot.push(yB);
        for (let j = 0; j < NV; j++) {
          const v = vs[j]; at(th, v, o);
          const y = lerp(yB, topY(th), Math.min(v / 0.93, 1)) + 7 * sstep(0.93, 1, v);
          const rough = 3.4 * noise.fbm3(o.x * 0.03, y * 0.035, o.z * 0.03, 3) * (v < 0.9 ? 1 : 0.4);
          const dx = o.x - mc.x, dz = o.z - mc.z, dl = Math.hypot(dx, dz) || 1;
          pos.push(o.x + dx / dl * rough, y, o.z + dz / dl * rough); am.push(v, i / NT, o.b);
        }
        if ((i & 31) === 31) await ctx.yield();
      }
      for (let i = 0; i < NT; i++) for (let j = 0; j < NV - 1; j++) { const a = i * NV + j, b = a + NV; idx.push(a, a + 1, b, a + 1, b + 1, b); }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aM', new THREE.Float32BufferAttribute(am, 3)); g.setIndex(idx); g.computeVertexNormals();
      await ctx.yield();
      // The table stands 400 m and more off against the sky, so the air between takes it to the colour of the open
      // weather behind it, never to the green of the trunk space: while the forest's fog is thick enough to take all
      // of it, it is not there at all (the sky shows), and it comes out of the haze as the air clears on the climb.
      const mesaHaze = { value: fogOut };
      const HAZE = /* glsl */`
            {
              float hzD = clamp(fogDensity*vFogDepth, 0.0, 6.0), hzK = 1.0 - exp(-hzD*hzD);
              if (hzK > 0.9 + 0.1*fract(sin(dot(floor(gl_FragCoord.xy), vec2(12.9898, 78.233)))*43758.5453)) discard;
              gl_FragColor.rgb = mix(gl_FragColor.rgb, uHaze, hzK);
            }`;
      const rockMat = new THREE.ShaderMaterial({
        fog: true, lights: true, side: THREE.DoubleSide,
        uniforms: { ...lightU(), ...fogU(), uHaze: mesaHaze, uSunGain: U.uSunGain, uSunTint: U.uSunTint, uJade: U.uJade, uLime: U.uLime, uDeep: U.uDeep, uWhite: U.uWhite, uSnow: U.uSnow, uLedge: { value: new THREE.Vector2(s0, s1) }, uMesaSun: seaX.uMesaSun },
        vertexShader: /* glsl */`
          attribute vec3 aM; varying vec3 vP, vN, vNw, vM, vV;
          #include <fog_pars_vertex>
          void main(){
            vP = position; vNw = normal; vN = normalize(normalMatrix*normal); vM = aM;
            vec4 mvPosition = modelViewMatrix*vec4(position, 1.0); vV = mvPosition.xyz;
            gl_Position = projectionMatrix*mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */`
          uniform vec3 uJade, uLime, uDeep, uWhite, uHaze; uniform float uSnow, uMesaSun; uniform vec2 uLedge;
          varying vec3 vP, vN, vNw, vM, vV;
          #include <fog_pars_fragment>
          ${GLSL_LIGHT}
          void main(){
            float v = clamp(vM.x, 0.0, 1.0);
            vec3 Nw = normalize(vNw);
            vec2 f = vec2(vM.y*900.0, vP.y);
            float n1 = bsNoise(f*vec2(0.012, 0.03)), n2 = bsNoise(f*vec2(0.05, 0.11) + 7.0), n3 = bsNoise(f*vec2(0.21, 0.5) + 3.0), n4 = bsNoise(f*vec2(0.9, 1.7) + 11.0);
            float bed = (vP.y + 0.085*vP.x - 0.05*vP.z)*0.062 + (n1 - 0.5)*1.3 + (n2 - 0.5)*0.4;
            float bi = floor(bed), bf = fract(bed);
            float bt = bsNoise(vec2(bi*7.31, 1.7)), bt2 = bsNoise(vec2(bi*3.17, 9.2));
            float seam = (1.0 - smoothstep(0.0, 0.07 + 0.2*bt2, bf))*(0.3 + 0.7*n3)*(0.45 + 0.55*bt2);
            float sub = 0.5 + 0.5*sin(bed*31.0 + n3*5.0);
            vec3 rock = mix(vec3(0.27, 0.135, 0.105), vec3(0.42, 0.245, 0.185), bt*(0.5 + 0.5*n2) + 0.25*n1);
            rock = mix(rock, vec3(0.34, 0.29, 0.27), 0.5*smoothstep(0.4, 0.8, n2*0.6 + n1*0.5 + 0.2*bt2 - 0.1));
            rock *= (0.64 + 0.5*n3 + 0.2*sub*n2)*(0.88 + 0.24*n4)*(1.0 - 0.6*seam)*(0.78 + 0.44*bt2);
            float streak = smoothstep(0.42, 0.8, bsNoise(vec2(vM.y*560.0, vP.y*0.018 + 9.0)))*(0.45 + 0.55*n3)*smoothstep(0.22, 0.4, v);
            rock *= 1.0 - 0.42*streak;
            float joint = smoothstep(0.8, 0.95, bsNoise(vec2(vM.y*1400.0 + bi*13.0, bi*0.7)))*step(0.3, bt2);
            rock *= 1.0 - 0.45*joint;
            float stain = smoothstep(0.55, 0.85, bsNoise(vec2(vM.y*300.0, vP.y*0.012 + 3.0)))*smoothstep(0.2, 0.5, v);
            rock = mix(rock, rock*vec3(0.42, 0.46, 0.52), stain*0.8);
            float lg = max(1.0 - smoothstep(0.0, 0.06, abs(v - (uLedge.x + 0.02)) - 0.012), 1.0 - smoothstep(0.0, 0.06, abs(v - (uLedge.y + 0.02)) - 0.012));
            float gr = max(smoothstep(0.34, 0.6, Nw.y), lg*smoothstep(0.38, 0.66, n3*0.6 + n2*0.4));
            gr = max(gr, smoothstep(0.80, 0.9, v + (n3 - 0.5)*0.1 + (n2 - 0.5)*0.08));
            gr = max(gr, (1.0 - smoothstep(0.1, 0.27, v + (n3 - 0.5)*0.12)));
            gr = max(gr, 0.85*smoothstep(0.7, 0.86, n2*0.6 + n1*0.5 - 0.4*vM.z)*smoothstep(0.25, 0.4, v));
            float tuft = bsNoise(f*vec2(0.33, 0.4) + 40.0);
            vec3 green = mix(uDeep*1.3, mix(uJade, uLime, 0.05 + 0.3*tuft), smoothstep(0.3, 0.85, tuft*0.6 + n4*0.4))*(0.5 + 0.55*n4);
            vec3 alb = mix(rock, green, gr);
            alb = mix(alb, uWhite*0.8, uSnow*max(smoothstep(0.34, 0.6, Nw.y), smoothstep(0.9, 0.93, v))*0.8);
            vec3 N = normalize(vN), V = normalize(-vV); N = faceforward(N, -V, N);
            vec3 L = bsSunDir();
            float ndl = max(dot(N, L), 0.0);
            float ao = (0.58 + 0.42*smoothstep(-0.35, 0.3, vM.z))*(0.6 + 0.4*smoothstep(0.0, 0.25, v))*(1.0 - 0.3*seam);
            float wrapK = clamp(uMesaSun - 1.0, 0.0, 1.0), shade = 1.0 - clamp(uMesaSun, 0.0, 1.0);
            float lit = mix(ndl, 0.25 + 0.75*smoothstep(-0.35, 0.8, dot(N, L)), 0.6*wrapK);
            vec3 sunM = bsSunCol()*uMesaSun*mix(vec3(1.0), vec3(1.05, 0.97, 0.88), wrapK);
            alb = mix(alb, alb*vec3(0.74, 0.95, 1.0), 0.75*shade);
            vec3 col = alb*(bsAmb(N)*(0.9*ao) + sunM*lit*(0.35 + 0.65*ao));
            col += sunM*pow(max(dot(N, normalize(L + V + vec3(0.0, 1e-4, 0.0))), 0.0), 24.0)*0.05*(1.0 - gr);
            gl_FragColor = vec4(col, 1.0);
            ${HAZE}
          }`,
      });
      mesa = new THREE.Group();
      const wall = new THREE.Mesh(g, rockMat); wall.frustumCulled = false; mesa.add(wall);
      await ctx.yield();
      // bamboo on the rim (a feathery edge against the sky) and along both ledges
      {
        const list = [];
        for (let k = 0; k < 330; k++) {
          const th = k / 330 * 6.2832 * 7.03 + RM.range(-0.05, 0.05), q = k < 150 ? RM.range(0.9, 0.99) : Math.sqrt(RM.range(0.04, 0.84)), H = RM.range(27, 36);
          at(th, 0.93, o); const x = mc.x + (o.x - mc.x) * q, z = mc.z + (o.z - mc.z) * q;
          list.push({ x, z, y: topY(th) + 7 * (1 - q * q) + 4 + RM.range(-2, 2) - H, h: H, near: false, plume: RM.range(1.5, 2.2) });
        }
        for (const [sv, n] of [[s0, 80], [s1, 90]]) for (let k = 0; k < n; k++) {
          const th = k / n * 6.2832 + RM.range(-0.03, 0.03), keepIt = RM() >= 0.3, H = RM.range(15, 21), pl = RM.range(1.1, 1.6);
          at(th, sv + 0.004, o); const i0 = Math.round(((th - th0) / 6.2832 % 1 + 1) % 1 * NT), yB = foot[i0];
          if (!keepIt) continue;
          const x = mc.x + (o.x - mc.x) * 1.02, z = mc.z + (o.z - mc.z) * 1.02;
          list.push({ x, z, y: lerp(yB, topY(th), sv / 0.93) + 7 - H, h: H, near: false, plume: pl });
        }
        const rim = hero.plant(list, { perFar: 1, culms: false, rng: RM }); rim.visible = false; mesa.userData.rim = rim;
        // (its crowns take the same haze as the wall they stand on: the planted material with that one line changed)
        const hazed = new Map();
        rim.traverse((m) => {
          const src = m.material;
          if (!m.isMesh || !src || !src.fragmentShader || !src.fragmentShader.includes('#include <fog_fragment>')) return;
          let hm = hazed.get(src);
          if (!hm) {
            hm = new THREE.ShaderMaterial({ fog: true, lights: src.lights, side: src.side, transparent: src.transparent, depthWrite: src.depthWrite, alphaTest: src.alphaTest, defines: src.defines, vertexShader: src.vertexShader, fragmentShader: 'uniform vec3 uHaze;\n' + src.fragmentShader.replace('#include <fog_fragment>', HAZE) });
            hm.uniforms = { ...src.uniforms, uHaze: mesaHaze }; hazed.set(src, hm);
          }
          m.material = hm;
        });
      }
      await ctx.yield();
      // the falls: ribbons that leave a notch under the rim, speed up as they drop and are blown out downwind
      {
        const NK = 22, fp = [], fa = [], fo = [], fi = [], mist = [];
        [[-0.5, 6.0, 1.0], [0.08, 4.2, 0.86], [0.55, 3.2, 0.72]].forEach(([dth, w0, hk], n) => {
          const th = thC + dth + RM.range(-0.08, 0.08); at(th, 0.86, o);
          const ox = o.x - mc.x, oz = o.z - mc.z, ol = Math.hypot(ox, oz) || 1, yLip = lerp(foot[0], topY(th), 0.86 / 0.93) - n * 2, yFoot = heightAt(o.x + ox / ol * 8, o.z + oz / ol * 8) + 19 + 6, H = (yLip - yFoot) * hk, b0 = fp.length / 3;
          for (let k = 0; k <= NK; k++) for (const sd of [-1, 1]) { fp.push(o.x, yLip, o.z); fa.push(k / NK, sd, n * 0.37 + 0.11, H); fo.push(ox / ol, oz / ol, w0, w0 * 3.0); }
          for (let k = 0; k < NK; k++) { const a = b0 + k * 2; fi.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
          for (let q = 0; q < 3; q++) mist.push([o.x + ox / ol * (24 + q * 8) + windDir.x * q * 14, yLip - H * 0.8 + q * 6, o.z + oz / ol * (24 + q * 8) + windDir.y * q * 14]);
        });
        const fg = new THREE.BufferGeometry();
        fg.setAttribute('position', new THREE.Float32BufferAttribute(fp, 3)); fg.setAttribute('aF', new THREE.Float32BufferAttribute(fa, 4)); fg.setAttribute('aO', new THREE.Float32BufferAttribute(fo, 4)); fg.setIndex(fi);
        const fallMat = new THREE.ShaderMaterial({
          fog: true, lights: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
          uniforms: { ...lightU(), ...fogU(), ...U, uHaze: mesaHaze },
          vertexShader: /* glsl */`
            attribute vec4 aF, aO; varying vec2 vUv; varying vec3 vK;
            #include <fog_pars_vertex>
            ${GLSL_WIND}
            void main(){
              float t = clamp(aF.x, 0.0, 1.0), tt = t*t;
              vec2 g = bsGust(position.xz, uTime - 0.3 - t*0.9);
              float blow = (0.4 + 0.9*g.x + 0.3*g.y)*uWind.z;
              vec3 p = position;
              p.xz += aO.xy*(1.0 + 5.0*t) + uWind.xy*(tt*aF.w*0.17*blow);
              p.y -= aF.w*pow(t, 1.25);
              vec2 tng = vec2(-aO.y, aO.x);
              p.xz += tng*(aF.y*0.5*mix(aO.z*0.3, aO.w, pow(t, 0.55))*(1.0 + 0.5*tt*blow) + sin(uTime*1.3 + t*7.0 + aF.z*9.0)*0.7*tt);
              vUv = vec2(aF.y*0.5 + 0.5, t); vK = vec3(aF.z, blow, aF.w);
              vec4 mvPosition = modelViewMatrix*vec4(p, 1.0);
              gl_Position = projectionMatrix*mvPosition;
              #include <fog_vertex>
            }`,
          fragmentShader: /* glsl */`
            uniform float uTime; uniform vec3 uWhite, uHaze;
            varying vec2 vUv; varying vec3 vK;
            #include <fog_pars_fragment>
            ${GLSL_LIGHT}
            void main(){
              float x = clamp(vUv.x, 0.0, 1.0)*2.0 - 1.0, t = clamp(vUv.y, 0.0, 1.0);
              float fall = t*vK.z*0.12 - uTime*(1.5 + 1.3*t);
              float s1 = bsNoise(vec2(vUv.x*5.0 + vK.x*13.0, fall)), s2 = bsNoise(vec2(vUv.x*13.0 + vK.x*31.0, fall*2.3)), s3 = bsNoise(vec2(vUv.x*2.2 + 5.0, fall*0.4 + vK.x*3.0));
              float body = 1.0 - x*x;
              float thin = mix(0.04, 0.46, t*t)*(1.0 + 0.3*vK.y);
              float a = smoothstep(thin, thin + 0.5, body*(0.6 + 0.6*s1)*(0.7 + 0.4*s3) + 0.25*s2*body);
              a *= smoothstep(0.0, 0.05, t)*(1.0 - smoothstep(0.8, 1.0, t))*smoothstep(0.0, 0.55, body)*(0.55 + 0.45*s2);
              vec3 col = uWhite*(bsAmb(vec3(0.0, 1.0, 0.0))*(0.62 + 0.3*s2) + bsSunCol()*0.26)*(0.75 + 0.25*s1);
              gl_FragColor = vec4(col, a*0.8);
              ${HAZE}
            }`,
        });
        const falls = new THREE.Mesh(fg, fallMat); falls.frustumCulled = false; falls.renderOrder = 2; mesa.add(falls);
        fxs.add(fx.makeMist({ rng: RM.fork('fallmist'), time, positions: mist, size: [46, 84], color: lookName === 'night' ? '#7d92b8' : lookName === 'evening' ? '#e9d2b4' : '#dfe8e8', opacity: 0.1, flatten: 0.6, drift: [windDir.x * 5, 0.4, windDir.y * 5] }));
      }
      mesa.visible = false; scene.add(mesa); mesa.userData.sOn = Math.min(firstNear(mc.x, MT.yT, mc.z), sSkirt);
    }
    await ctx.yield();
    // ---------------- the break in the cloud: late on the crest the deck closes over us and opens over the gate and over
    // the table. The two clumps and the crowns round the ring stand in full sun, the table's face stands lit beyond them,
    // and the rays that reach the gate show in the wet air (they come from behind-left, over our heads; none crosses the ring) ----------------
    const breakAt = new THREE.Vector3(exitP.x - endR.x * 6, yTop + 4, exitP.z - endR.z * 6);
    let breakRays = null;
    const breakK = lookName === 'noon' ? 0.35 : lookName === 'night' ? 0.6 : 1, sunBase = lookName === 'noon' ? 2.6 : 1;
    {
      const RBk = makeRng(hashSeed('bs-break:' + ctx.seed)), NR = 7, pos = [], aR = [], idx = [];
      const len = Math.min(980, 330 / Math.max(sunDir.y, 0.2)), pl = Math.hypot(sunDir.x, sunDir.z) || 1, px = -sunDir.z / pl, pz = sunDir.x / pl;   // (px, pz): level, across the rays
      for (let i = 0; i < NR; i++) {
        const l0 = (i - (NR - 1) / 2) * 17 + RBk.range(-5, 5), lat = (l0 < 0 ? -1 : 1) * Math.max(Math.abs(l0), 14), ey = breakAt.y + RBk.range(-12, 16), w = RBk.range(6, 12), sd = RBk();
        const ex = breakAt.x + px * lat, ez = breakAt.z + pz * lat, o = pos.length / 3;
        for (const t of [0, 1]) for (const sg of [-1, 1]) { pos.push(ex + sunDir.x * len * (1 - t), ey + sunDir.y * len * (1 - t), ez + sunDir.z * len * (1 - t)); aR.push(t, sg, w, sd); }
        idx.push(o, o + 1, o + 2, o + 1, o + 3, o + 2);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aR', new THREE.Float32BufferAttribute(aR, 4)); g.setIndex(idx);
      const rc = C(lookName === 'evening' ? '#ffbf86' : lookName === 'night' ? '#b9c8ee' : lookName === 'noon' ? '#d5dedf' : '#fff0cf').multiplyScalar(lookName === 'night' ? 0.1 : 0.19);
      const mat = new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
        uniforms: { uTime: time, uDir: { value: sunDir.clone() }, uCol: { value: rc }, uGain: { value: 0 } },
        vertexShader: /* glsl */`
          attribute vec4 aR; uniform vec3 uDir; varying vec3 vR; varying float vD;
          void main(){
            vec3 wp = (modelMatrix*vec4(position, 1.0)).xyz;
            vec3 sd = cross(uDir, cameraPosition - wp); sd = sd/max(length(sd), 1e-3);
            vec3 p = wp + sd*(aR.y*aR.z*(1.0 + 0.6*aR.x));
            vR = vec3(aR.y, aR.x, aR.w);
            vec4 mv = viewMatrix*vec4(p, 1.0); vD = -mv.z;
            gl_Position = projectionMatrix*mv;
          }`,
        fragmentShader: /* glsl */`
          uniform vec3 uCol; uniform float uGain, uTime; varying vec3 vR; varying float vD;
          float rH(vec2 p){ p = fract(p*vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y)*p.y); }
          float rN(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0 - 2.0*f);
            return mix(mix(rH(i), rH(i + vec2(1.0, 0.0)), f.x), mix(rH(i + vec2(0.0, 1.0)), rH(i + vec2(1.0, 1.0)), f.x), f.y); }
          void main(){
            float x = vR.x, t = vR.y;
            float prof = max(1.0 - x*x, 0.0); prof *= prof;
            float st = 0.5 + 0.5*rN(vec2(x*2.6 + vR.z*17.0, t*3.0 - uTime*0.03));
            float along = smoothstep(0.0, 0.32, t)*(1.0 - smoothstep(0.6, 0.98, t));
            gl_FragColor = vec4(uCol*(prof*st*along*uGain*smoothstep(30.0, 110.0, vD)), 1.0);
          }`,
      });
      breakRays = new THREE.Mesh(g, mat); breakRays.frustumCulled = false; breakRays.renderOrder = 2; breakRays.visible = false; scene.add(breakRays);
    }
    await ctx.yield();
    // leaves blown through the ring: torn off the crowns upwind and drawn in over the last forty metres
    const ringLeaves = ringLeafMesh(U, time, Math.round(720 * (0.6 + 0.4 * detail)), makeRng(hashSeed('bs-ringleaf:' + ctx.seed)), exitP, new THREE.Vector3(path.endTangent.x, 0, path.endTangent.z).normalize(), 7);
    scene.add(ringLeaves);
    await ctx.yield();

    hero.setWind(lookName === 'noon' ? 1.15 : lookName === 'evening' ? 0.88 : 1);
    hero.setSun(sunBase);
    const leafBox = hero.leaves.material.uniforms.uBox.value; leafBox.set(64, 40, 64);
    const skirt = new THREE.Mesh(new THREE.CylinderGeometry(172, 172, 110, 40, 1, true), new THREE.MeshBasicMaterial({ color: fogIn.clone(), fog: false, side: THREE.BackSide }));
    skirt.frustumCulled = false; scene.add(skirt);
    const gazeUp = new THREE.Vector3(), gapAt = new THREE.Vector3(gap.cx, gap.y + 8.5, gap.cz);
    const camW = new THREE.Vector3(), gazeAt = new THREE.Vector3(), mC = new THREE.Vector3(), mT = new THREE.Vector3(), mL = new THREE.Vector3();
    const fwd = new THREE.Vector3(), leafC = new THREE.Vector3(), v1 = new THREE.Vector3(), v2 = new THREE.Vector3(), vx = new THREE.Vector3(), vy = new THREE.Vector3(), vz = new THREE.Vector3(), mm = new THREE.Matrix4();
    const face = (m, pos, dir, roll, sc) => {                     // +X of the creature along dir
      vx.copy(dir).normalize(); vz.set(-vx.z, 0, vx.x).normalize(); vy.crossVectors(vz, vx).normalize();
      if (roll) { v2.copy(vy).multiplyScalar(Math.cos(roll)).addScaledVector(vz, Math.sin(roll)); vz.crossVectors(vx, v2).normalize(); vy.copy(v2); }
      mm.makeBasis(vx, vy, vz); m.quaternion.setFromRotationMatrix(mm); m.position.copy(pos); m.scale.setScalar(sc);
    };
    const oldClump = new THREE.Vector3(clumps[0].x, 10, clumps[0].z), ledgeAt = new THREE.Vector3(ledge.x + ledgeIn.x * 1.3, ledge.top + 0.7, ledge.z + ledgeIn.z * 1.3);
    const vAt = new THREE.Vector3(0, heightAt(0, -42) + 31, -46), fallAt = new THREE.Vector3(fall.x, fall.lipY - 0.6, zF + 0.5), rockAt = new THREE.Vector3(mRock.x, mRock.y + 2.4, mRock.z);
    // the crest's gazes: left to the rain (level, along the way it comes from) while the magpies hold; as it comes back it
    // passes over the table while the cloud opens on it; then the ring, at its centre
    const rainGaze = new THREE.Vector3(rainDir.x, 0.035, rainDir.z).normalize(), rainAt = new THREE.Vector3();
    const RAIN0 = 0.675, RAIN1 = 0.885, RAINW = 0.47, MESA0 = 0.8, MESA1 = 0.925, MESAW = 0.62, RING0 = 0.88, RING1 = 1, RINGW = 0.5;
    // THE SWELL is one of the wind's own. The design's setPiece: 'swells of paler green 110 m apart running across them
    // at 26 m/s'. SWELL_GAP: the metres from one front to the next; SWELL_SPEED: the metres a second they run downwind,
    // on the world's own clock, from a phase dealt by a stream of its own (swellPh, in metres). Every front lies across
    // the wind (on a circle of 20 km about a point far upwind of the V's head: swellP0, swellR0); where it lies has
    // nothing to do with where we are
    const SWELL_GAP = 110, SWELL_SPEED = 26, swellPh = makeRng(hashSeed('bs-swell:' + ctx.seed)).range(0, SWELL_GAP);
    const swellP0 = path.pointAt(uTop), swellR0 = 20000;
    // THE MARKS OF THE CREST'S WEATHER, in metres of the route (the break in the cloud, its rays, the rain curtain, the
    // leaves blown through the ring):
    //  BREAK_R: the break is a hole 86 m in radius as it opens; it opens while we fly that far from the head of the
    //   crest flight (sHead), the cloud's edge passing over us.
    //  sStraight: where the last straight begins (the design: 'the last 60 m straight and level'). Between sHead and
    //   there the break slides down the wind to the gate and the curtain comes in.
    //  SADDLE: the design's 'last 110 m' that 'cross a shallow saddle to the portal'. The leaves blown through the ring
    //   show while we are over the saddle, more and more of them until the last straight begins.
    const BREAK_R = 86, LAST_STRAIGHT = 60, SADDLE = 110, sStraight = L - LAST_STRAIGHT;
    const breakFrom = new THREE.Vector3(breakAt.x - windDir.x * 190, breakAt.y, breakAt.z - windDir.y * 190), breakNow = new THREE.Vector3();
    // ---------------- last of the planting (after everything else, so the stand keeps the draws it had) ----------------
    // the watcher's culm, laid over about its foot like the windthrown ones; the monkey on it, its head a part of its own
    let watcher = null, watchHead = null, watchStem = null, fallStand = null;
    const fallMid = { x: 0, z: 0, seen: 0 };
    {
      const a = watch.a;
      watchStem = hero.plant([{ x: watch.x0, z: watch.z0, y: watch.y0, near: true, r: 0.125, h: watch.tS + 15, age: 0.72, lean: 0, leanAz: 0, stiff: 0.03, plume: 0.8 }], { perNear: 3, feet: false });
      const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(watch.hz, 0, -watch.hx).normalize(), Math.PI / 2 - a), f = new THREE.Vector3(watch.x0, watch.y0, watch.z0);
      watchStem.quaternion.copy(q); watchStem.position.copy(f).sub(f.clone().applyQuaternion(q));
      hero.setGlade(13, watch.sx, watch.sz, 4.6);
      const mat = critterMaterial({ time, U, lit: 1.0, amb: 1.3, fur: 1, rim: gold });
      mat.uniforms.uTail.value.set(0.05, -0.15, 0.3, 0.22);
      watcher = new THREE.Mesh(monkeyGeometry(gold, 'perch', null, { fur: 3.6, fine: 0.5, head: false, slope: a, seed: 771, tailFree: 0.15 }), mat);
      face(watcher, v1.set(watch.sx, watch.sy + 0.15, watch.sz), v2.set(watch.hx, 0, watch.hz), 0, 1.38);
      await ctx.yield();
      const neck = [0.07, 0.66, 0], hg = monkeyGeometry(gold, 'head', null, { fur: 2.6, fine: 0.6, hi: true, seed: 772 });
      hg.translate(0.115 - neck[0], 0.755 - neck[1], 0);
      watchHead = new THREE.Mesh(hg, mat); watchHead.position.set(neck[0], neck[1], neck[2]); watchHead.rotation.order = 'YZX'; watcher.add(watchHead);
      watcher.frustumCulled = watchHead.frustumCulled = false; watcher.visible = false; scene.add(watcher); watcher.updateMatrixWorld(true);
    }
    await ctx.yield();
    // a stand of culms behind the fall's ledge, on both banks alike: 5 to 46 m up the stream from the fall, 6.5 to 34 m
    // back from the water (so the fall has stems behind it, not haze), none in the fall's own clearing (FALL_CLEAR)
    {
      const list = [];
      for (let k = 0; k < 220 && list.length < 46; k++) {
        const z = zF - RW.range(5, 46), x = laneX(z) + (k & 1 ? 1 : -1) * RW.range(6.5, 34);
        if (inStream(x, z) || inGap(x, z) > 0 || Math.hypot(x - fall.x, z - zF) < FALL_CLEAR || path.nearestXZ(x, z).dist < 6.5 || !free(x, z, 1.5)) continue;
        list.push({ x, z, near: true }); put(x, z);
      }
      if (list.length) fallStand = hero.plant(list, { perNear: 2 });
      // (it is drawn as the stand beyond the windthrow is: while the eye is within fallMid.seen of the stand's own middle,
      // in plan: the reach of the forest's fog, where it takes 97% of a thing (1.873 / dIn), and the stand's own half-breadth)
      for (const c of list) { fallMid.x += c.x / list.length; fallMid.z += c.z / list.length; }
      for (const c of list) fallMid.seen = Math.max(fallMid.seen, Math.hypot(c.x - fallMid.x, c.z - fallMid.z));
      fallMid.seen += 1.873 / LK.dIn;
    }
    await ctx.yield();
    // ---------------- the last of the planting ----------------
    let bigClump = null, gapStand = null, emer = null, rake = null, sKnolls = 0;
    const gapMid = { x: 0, z: 0, seen: 0 };
    {
      // THE GREAT CLUMP: thirteen veteran culms on one stool, fanning apart (none toward the lane): white wax at every
      // node, lichen up the old stems. Nothing on it or its boulder but one dead culm that has come down from behind and
      // lodged in a fork of the clump
      const list = [], n = 13;
      for (let k = 0; k < n; k++) {
        const a = k / n * 6.283 + RGc.range(-0.2, 0.2), rr = k === 0 ? 0.3 : RGc.range(0.9, 1.95), ox = Math.cos(a), oz = Math.sin(a), fan = k === 0 ? 0.02 : RGc.range(0.05, 0.14);
        let lx = ox * fan, lz = oz * fan; const tl = lx * big.ix + lz * big.iz; if (tl > 0.015) { lx -= big.ix * (tl - 0.015); lz -= big.iz * (tl - 0.015); }
        list.push({ x: big.x + ox * rr, z: big.z + oz * rr, near: true, r: RGc.range(0.078, 0.09), h: RGc.range(24, 26), age: RGc.range(0.7, 0.98), stiff: RGc.range(0.26, 0.36), lean: Math.hypot(lx, lz), leanAz: Math.atan2(lz, lx), plume: 1.25 });
      }
      bigClump = hero.plant(list, { perNear: 7, boughs: 2, arch: 1.4, span: 0.5 });
      {
        const fx0 = big.x - big.ix * 7.6 + big.bx * 1.1, fz0 = big.z - big.iz * 7.6 + big.bz * 1.1, fy0 = heightAt(fx0, fz0) - 0.1, hx = big.x + big.bx * 0.5 - fx0, hz = big.z + big.bz * 0.5 - fz0, hl = Math.hypot(hx, hz) || 1;
        const lean = hero.plant([{ x: fx0, z: fz0, y: fy0, near: true, r: 0.115, h: 17.5, age: 1.24, lean: 0, leanAz: 0, stiff: 0.03, plume: 0.5 }], { perNear: 1, feet: false, plumes: false });
        const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(hz / hl, 0, -hx / hl), Math.atan2(hl, 11.5)), f = new THREE.Vector3(fx0, fy0, fz0);
        lean.quaternion.copy(q); lean.position.copy(f).sub(f.clone().applyQuaternion(q)); bigClump.add(lean);
      }
      await ctx.yield();
      // beyond the windthrow the grove goes on: stem behind stem from its far end into the fog, crowns shut overhead
      const gl = [];
      for (let k = 0; k < 300 && gl.length < 64; k++) {
        const al = gap.D + RGs.range(2, 46), c = RGs.range(-40, 40), x = gap.px + gap.dx * al + gap.dz * c, z = gap.pz + gap.dz * al - gap.dx * c;
        if (!free(x, z, 1.5)) continue;
        gl.push({ x, z, near: false }); put(x, z);
      }
      for (let k = 0; k < 400 && gl.length < 132; k++) {
        const al = RGs.range(32, gap.D + 8), c = RGs.range(-1, 1) * (5 + 0.36 * al), x = gap.px + gap.dx * al + gap.dz * c, z = gap.pz + gap.dz * al - gap.dx * c;
        if (!free(x, z, 1.4)) continue;
        gl.push({ x, z, near: false }); put(x, z);
      }
      if (gl.length) {
        gapStand = hero.plant(gl, { perFar: 3 }); gapStand.visible = false;
        // (the stand is drawn while the eye is within gapMid.seen of its own middle, in plan: the reach of the forest's
        // fog, where it takes 97% of a thing (1.873 / dIn, as firstNear has it), and on top of that the stand's own
        // half-breadth, so that the fog still hides every stem of it at the place where it is switched)
        for (const c of gl) { gapMid.x += c.x / gl.length; gapMid.z += c.z / gl.length; }
        for (const c of gl) gapMid.seen = Math.max(gapMid.seen, Math.hypot(c.x - gapMid.x, c.z - gapMid.z));
        gapMid.seen += 1.873 / LK.dIn;
        // (and along both edges of the lane of fallen stems a few lean in over it, so the crowns shut overhead)
        const ar = [];
        for (let k = 0; k < 20; k++) {
          const sd = k & 1 ? 1 : -1, al = 14.5 + k * 1.2 + RGs.range(-1, 1), c = sd * (4.0 + (al - 13) * 0.1 + RGs.range(0, 1.5)), x = gap.px + gap.dx * al + gap.dz * c, z = gap.pz + gap.dz * al - gap.dx * c;
          ar.push({ x, z, near: true, h: RGs.range(24.5, 27.5), age: RGs.range(0.3, 0.8), stiff: 0.22, lean: RGs.range(0.34, 0.56), leanAz: Math.atan2(-sd * (-gap.dx) + gap.dz * RGs.range(-0.3, 0.3), -sd * gap.dz + gap.dx * RGs.range(-0.3, 0.3)), plume: 1.25 });
        }
        gapStand.add(hero.plant(ar, { perNear: 6, arch: 1.4, span: 0.5 }));
      }
      await ctx.yield();
      // THE CLUMPS ON THE KNOLLS of the crest (KN.stools): four stools of veterans standing in the crown sea where its
      // ground stands up, their tips riding 1 to 2.5 m over the crowns round them, more supple than their neighbours, so
      // they are the liveliest crowns under the lens. The first we pass is wind-raked: nine veterans bowed far over
      // downwind, a dead culm leaning among them; the other three are seven each, fanned. Every culm, calm or bowed by
      // the hardest gust and the swell, plume and all, stays 7 m clear of the flight in plan, on either hand alike.
      const el2 = [], rl = [], dead = [], cq = { x: 0, y: 0, z: 0, sx: 0, sy: 1, sz: 0 }, RK = makeRng(hashSeed('bs-knoll:' + ctx.seed));
      const bowClear = (it, lx, lz, dMin, pl) => {
        for (const kk of [0, 0.5, 1]) for (const q of [0.35, 0.5, 0.65, 0.8, 1, 1.1]) {
          culmAt(it, lx, lz, Math.min(q, 1), kk, cq);
          if (q > 1) { const hl = Math.hypot(cq.sx, cq.sz) || 1; cq.x += (cq.sx / hl * 0.5 + windDir.x * 0.5) * pl; cq.z += (cq.sz / hl * 0.5 + windDir.y * 0.5) * pl; }
          if (path.nearestXZ(cq.x, cq.z).dist < dMin) return false;
        }
        return true;
      };
      KN.stools.forEach((c, ci) => {
        const P = path.pointAt(path.nearestXZ(c.x, c.z).u), ox0 = c.x - P.x, oz0 = c.z - P.z, ol = Math.hypot(ox0, oz0) || 1, ax0 = ox0 / ol, az0 = oz0 / ol;      // (ax0, az0): away from the flight, from its nearest point
        const raked = ci === 0, n = raked ? 10 : 7;
        for (let k = 0; k < n; k++) {
          const isDead = raked && k === n - 1;
          const a = k / (raked ? 9 : 7) * 6.283 + RK.range(-0.25, 0.25), rr = k === 0 ? 0.3 : RK.range(1.3, 2.5), ox = Math.cos(a), oz = Math.sin(a);
          const fan = raked ? RK.range(0.05, 0.16) : k === 0 ? 0.05 : RK.range(0.16, 0.32), wl = raked ? (isDead ? 0.8 : RK.range(0.44, 0.64)) : 0.2;
          let lx = ox * fan + windDir.x * wl, lz = oz * fan + windDir.y * wl;
          const x0 = isDead ? c.x - windDir.x * 1.6 : c.x + ox * rr, z0 = isDead ? c.z - windDir.y * 1.6 : c.z + oz * rr, gy = heightAt(x0, z0);
          const it = { x: x0, z: z0, near: true, r: isDead ? 0.075 : RK.range(0.075, 0.09), h: 24, age: isDead ? 1.25 : RK.range(0.35, 0.95), stiff: isDead ? 0.34 : raked ? RK.range(0.7, 0.95) : RK.range(0.34, 0.52), plume: isDead ? 0.5 : 1.3, span: 0.22 };
          const over = isDead ? -1.5 : RK.range(1, 2.5);
          culmAt(it, lx, lz, 1, 0, cq); it.h = (23.4 + over) * it.h / Math.max(cq.y, 12);       // (its tip, as it leans in a calm, rides that far over the crowns round it)
          for (let tries = 0; tries < 30; tries++) {
            if (bowClear(it, lx, lz, 7, 7)) break;
            it.x += ax0 * 0.8; it.z += az0 * 0.8;
          }
          it.lean = Math.hypot(lx, lz); it.leanAz = Math.atan2(lz, lx);
          (isDead ? dead : raked ? rl : el2).push(it);
        }
      });
      emer = el2.length ? hero.plant(el2, { perNear: 8, rng: RK }) : new THREE.Group(); emer.visible = false; sKnolls = Math.min(firstNearList(el2), firstNearList(rl), sSkirt);
      await ctx.yield();
      rake = new THREE.Group();
      if (rl.length) rake.add(hero.plant(rl, { perNear: 8, rng: RK }), hero.plant(dead, { perNear: 2, plumes: false, rng: RK }));
      hero.object.add(rake); rake.visible = false;
    }
    await ctx.yield();
    await sky.prewarm?.(ctx.renderer, null, scene);

    const made = {
      scene, path, duration: DUR, title: 'The Bamboo Sea', ride: 'none',
      // a little quicker through the slalom and along the crest, easing past the watcher on its culm (u 0.25), slower down
      // the gully where the pheasants, the monkeys
      // and the parting are (the brief's 24 and 18 m/s)
      pace: (u) => 1.0 + 0.08 * sstep(0.02, 0.12, u) - 0.15 * (sstep(0.195, 0.235, u) - sstep(0.265, 0.31, u)) - 0.26 * (sstep(0.4, 0.46, u) - sstep(0.62, 0.7, u)),
      camera: { fov: 62, near: 0.3, far: 4800, lookAhead: 24, sway: 1, bank: 0.5 },
      pois: [
        // the Old Clump on the axis; as we come up to it the gaze climbs its seven stems into the crowns and the shafts
        { at: (t, u) => gazeUp.copy(oldClump).setY(lerp(10, 27, sstep(0.035, 0.075, u))), from: 0, to: 0.106, weight: 0.62 },
        { at: rockAt, from: 0.105, to: 0.2, weight: 0.5 },                    // the monkey rock in its sheaf
        { at: gapAt, from: 0.262, to: 0.392, weight: 0.5 },                   // the gap: out through the windthrow to the far ridges
        { at: fallAt, from: 0.372, to: 0.462, weight: 0.55 },                 // the fall at the head of the stream
        // one gaze for the gully: the ledge huddle on the left as we come up to it, then on to the V at its head
        { at: (t, u) => gazeAt.copy(ledgeAt).lerp(vAt, sstep(uLeap + 0.001, uLeap + 0.022, u)), from: uLeap - 0.075, to: uClimb + 0.035, weight: 0.56 },
        // up on the crest the gaze leans 25 degrees left to the rain curtain coming over the far ridges while the swell
        // passes under us, and as it returns it passes over the table; then the ring
        { at: (t, u) => path.pointAt(u, rainAt).addScaledVector(rainGaze, 700), from: RAIN0, to: RAIN1, weight: RAINW },
        { at: mesaAt, from: MESA0, to: MESA1, weight: MESAW },               // the table, as the cloud opens over it
        { at: exitP, from: RING0, to: RING1, weight: RINGW },                 // the ring, at its centre
      ],
      portal: { shape: 'circle', radius: 7, color: lookName === 'evening' ? '#ffe3b0' : '#e2f3d2', glow: 1, revealDistance: 300 },
      post: { exposure: LK.exposure, bloom: { strength: 0.32, radius: 0.6, threshold: 0.92 }, grade: LK.grade },
      update(dt, t, camera, u) {
        time.value = t;
        const k = sstep(uClimb + (uTop - uClimb) * 0.3, uTop, u), sCam = u * L;
        scene.fog.density = LK.dIn * Math.pow(LK.dOut / LK.dIn, k);
        scene.fog.color.copy(fogIn).lerp(fogOut, k);
        hemi.intensity = lerp(LK.hemiIn, LK.hemiOut, k);
        hero.setParting(partClock(u));
        camera.getWorldDirection(fwd);
        camera.getWorldPosition(camW);
        hero.setLeafCenter(leafC.copy(camW).addScaledVector(fwd, 17));
        skirt.visible = k <= 0; skirt.position.set(camW.x, camW.y - 30, camW.z); skirt.material.color.copy(scene.fog.color);
        hero.update(dt, t, camera);
        for (const c of chunks) { c.grp.visible = sCam >= c.s0 && sCam <= c.s1 && u < uClimb + 0.012; c.fm.visible = c.grp.visible && sCam >= c.s0 + 50 && sCam <= c.s1 - 4; }
        hero.own.visible = sCam > sForest - 122 && u < uTop + 0.014;
        for (const f of heroFerns) f.visible = sCam > sForest - 55 && sCam < sFernsOff;                   // (22 m and more below the lens after that)
        // each part of the crest is drawn from the place of the route where the lens first comes within 185 m of it, and
        // all of it from sSkirt: see "where the crest comes into view"
        for (let i = 0; i < crestChunks.length; i++) crestChunks[i].visible = sCam > crestOn[i];
        for (const st of staged) st.g.visible = sCam > st.sOn && (!st.zone0 || camW.z > zBehind);       // (the first crest zone: until it is behind every gaze)
        // the crowns under the lens: every stretch that is not yet behind us shows its tips; its whole crowns and stems
        // from 52 m ahead (measured along the route, not from the camera)
        for (const c of nearCh) { c.tops.visible = sCam > c.sOn && sCam < c.s1 + 10; c.fill.visible = c.tops.visible && sCam > c.s0 - 52; }
        {                                                                   // the crown tufts that have come into view (tuftOn is in rising order)
          let a = 0, b = tuftOn.length; while (a < b) { const m = (a + b) >> 1; if (tuftOn[m] < sCam) a = m + 1; else b = m; }
          tufts.visible = a > 0; tufts.geometry.instanceCount = a;
        }
        strands.visible = sCam > sSkirt;
        mesa.visible = mesa.userData.rim.visible = sCam > mesa.userData.sOn;
        leapCulms.visible = u < uTop;
        haloMesh.visible = u < uTop;
        for (const f of fallen) f.visible = u < uClimb + 0.012;
        emer.visible = rake.visible = sCam > sKnolls;
        bigClump.visible = sCam < big.s + 45; rocksA.visible = sCam < sGapEnd + 45;       // (the Great Clump, and the rocks of the lane as far as the windthrow's far end: each until it is 45 m behind us)
        if (sCam > sHead) leafBox.set(46, 20, 46); else leafBox.set(64, 40, 64);                    // (on the crest the torn leaves stream past the lens thick and close)
        if (gapStand) gapStand.visible = Math.hypot(camW.x - gapMid.x, camW.z - gapMid.z) < gapMid.seen;       // (the stand beyond the windthrow: while the eye is within the fog's reach of it)
        // (what stands on the forest floor is not drawn once we are up in the crowns, 22 m and more above it: sFernsOff)
        const low = u < uClimb || camW.y < yTop - 6;
        const back = camW.z > -6;                                                  // false once everything along the stream is behind us (it all lies at z > 2)
        shafts.visible = u < uTop; treeFernMesh.visible = bankFernMesh.visible = low && back && sCam > 230;
        rocksB.visible = rockFernMesh.visible = low && sCam < sFernsOff; rocks.visible = low && back; huddleMesh.visible = u > 0.34 && u < uLeap + 0.06; rockTroop.visible = u < 0.3; taro.visible = low && back && sCam > 230;
        clingers.visible = u < uTop - 0.012;
        if (fallStand) fallStand.visible = Math.hypot(camW.x - fallMid.x, camW.z - fallMid.z) < fallMid.seen;       // (the stand behind the fall: while the eye is within the fog's reach of it)
        // the watcher's head follows us while we are near; left alone it looks about
        watcher.visible = watchStem.visible = u > 0.08 && u < 0.33;
        if (watcher.visible) {
          watcher.worldToLocal(path.pointAt(u, v1)); v1.x -= 0.115; v1.y -= 0.755;        // (where we are on the route, whatever the camera is doing)
          const dW = v1.length() * 1.38, kW = 1 - sstep(16, 34, dW);
          const yawT = clamp(Math.atan2(-v1.z, v1.x), -1.55, 1.55), pitT = clamp(Math.atan2(v1.y, Math.hypot(v1.x, v1.z)), -0.5, 0.45);
          watchHead.rotation.y = lerp(0.5 * Math.sin(t * 0.6) + 0.3 * Math.sin(t * 1.7 + 1), yawT, kW);
          watchHead.rotation.z = lerp(0.1 * Math.sin(t * 0.9), pitT, kW);
          watchHead.rotation.x = 0.12 * Math.sin(t * 0.8 + 2) * kW;
        }
        sky.update(dt, t, camera); ridges.update(dt, t, camera); fxs.update(dt, t, camera);
        ridges.object.visible = sCam >= sSkirt; seaX.uRidgeK.value = ridges.object.visible ? 1 : 0; seaX.uAir.value = k;       // (no ridge is seen out of the forest before the V)
        {
          // THE CROWN SEA'S BLOCKS. A block of the sheet is left out only while both hold: (1) all of it lies beyond the
          // fog's reach of the eye, measured in plan from where the eye is to the block's own bounds; (2) the fog-coloured
          // skirt stands, and all of the block lies behind it as the eye sees it: further off than the skirt, under its
          // rim and over its foot. Otherwise it is drawn. What makes a left-out block unseen is the skirt in front of it,
          // whichever way the eye looks; the fog's reach only keeps a nearer block drawn. So once the skirt is off (the
          // fog thinning on the climb) the whole sheet is drawn: from then on the far sheet, taken whole by the fog, is
          // itself what closes the distance under the sky.
          // seaReach: the fog's reach along the gaze: how far off the scene's fog, as it stands at this moment, leaves
          // less than one part in 255 of a thing's own colour, sqrt(ln 255) / density. Nothing of the camera is read
          // but its place (camW).
          // top, bot: the block's highest and lowest vertex as the shader may draw them, measured from the eye's height
          // (the heights are held down to the crest's level until the V: uRidgeK)
          const seaReach = Math.sqrt(Math.log(255)) / scene.fog.density;
          const sp = skirt.geometry.parameters, rim = skirt.position.y + sp.height / 2 - camW.y, foot = skirt.position.y - sp.height / 2 - camW.y;
          for (const b of seaBlocks) {
            const d = Math.hypot(Math.max(b.x0 - camW.x, 0, camW.x - b.x1), Math.max(b.z0 - camW.z, 0, camW.z - b.z1)), q = sp.radiusTop / d;
            const top = (seaX.uRidgeK.value > 0 ? b.y1 : b.yHeld) - camW.y, bot = b.y0 - camW.y;
            b.m.visible = !(skirt.visible && d >= seaReach && q < 1 && top * q < rim && bot * q > foot);
          }
        }
        // the swell: fronts lying across the wind, SWELL_GAP apart, running downwind at SWELL_SPEED on the world's time:
        // they come up from behind-left, pass under us and run on ahead over ridge after ridge
        {
          const bandR = swellR0 + (SWELL_SPEED * t + swellPh) % SWELL_GAP, bcx = swellP0.x - windDir.x * swellR0, bcz = swellP0.z - windDir.y * swellR0;
          seaX.uBandDir.value.set(bcx, bcz); seaX.uBandA.value = bandR;
          U.uBand.value.set(bcx, bcz, bandR, u > uTop - 0.03 ? 1 : 0);
        }
        // the cloud closes over the crest; one break in it slides downwind over the crown sea, from out on the left where the
        // rain is coming, and stands over the gate by the time the last straight begins: the crowns under it are in whole sun, lime
        // (the crowns under the flight stay in the cloud's shade, so the swell is the one pale thing on them)
        const brk = sstep(sHead, sHead + BREAK_R, sCam), ov = brk * breakK, sunG = 1 - 0.24 * ov, bs = sstep(sHead, sStraight, sCam);
        hero.setSun(sunBase * sunG);
        breakNow.lerpVectors(breakFrom, breakAt, bs);
        U.uBreak.value.set(breakNow.x, breakNow.z, lerp(BREAK_R, 66, bs), brk);
        U.uBreakSun.value = 1.5 / sunG - 1;
        // and it opens over the table as the gaze passes over it: blue-green under the cloud before, warm in whole sun after
        const mk = sstep(MESA0, MESA0 + 0.06, u);
        U.uBreak2.value.set(MT.mc.x, MT.mc.z, 300, mk);
        seaX.uMesaSun.value = lerp(0.42, 1.2 / sunG, mk * breakK);
        breakRays.visible = ov > 0.002; breakRays.material.uniforms.uGain.value = ov * lerp(0.55, 1, bs);
        breakRays.position.set(breakNow.x - breakAt.x, 0, breakNow.z - breakAt.z);
        // the rain curtain marches in from the left
        const D = lerp(1400, 400, bs), cShift = -rainSide * 360 * bs;       // (by the last straight it stands 400 m off and fills the left; the sky behind the gate stays slate)
        for (const c of curtains) {
          c.m.position.copy(exitP).addScaledVector(rainDir, D + c.back).addScaledVector(rainPerp, c.lat + cShift + ((t * 7) % 300) - 150); c.m.position.y = 330;
          c.m.lookAt(exitP.x, 330, exitP.z);
        }
        seaX.uRainAt.value.set(exitP.x + rainDir.x * (D + 250), exitP.z + rainDir.z * (D + 250), 520, 0.8);
        // magpies: in from behind-left, holding ahead-left, peeling away
        if (magpies.length) {
          const tm = (u - magW0) / (magW1 - magW0), on = tm > 0 && tm < 1;
          if (on) {
            const inK = sstep(0, 0.2, tm), outK = sstep(0.78, 1, tm);
            const lead = lerp(-4, 8.2, inK) + 34 * outK, lat = lerp(14, 4.4, inK) + 30 * outK, upY = lerp(4, 0.9, inK) + 12 * outK, um = clamp(u + lead / L, 0, 1);
            path.pointAt(um, mC); path.tangentAt(um, mT); mT.y = 0; mT.normalize(); mL.set(mT.z, 0, -mT.x);       // mL: to the left of travel
            for (const g of magpies) {
              const wx = Math.sin(t * g.f1 + g.ph) * 0.8, wy = Math.sin(t * g.f2 + g.ph * 2) * 0.45, wz = Math.cos(t * g.f1 * 0.7 + g.ph) * 1.0;
              v1.copy(mC).addScaledVector(mL, lat + g.ox + wx).addScaledVector(mT, g.oz + wz); v1.y += upY + g.oy + wy;
              fwd.copy(mT).addScaledVector(mL, 0.5 * outK - 0.35 * (1 - inK) + Math.cos(t * g.f1 + g.ph) * 0.08); fwd.y = 0.25 * outK + Math.cos(t * g.f2 + g.ph * 2) * 0.06;
              g.mat.uniforms.uFlap.value.set(t * 24 + g.ph * 5, 0.3 + 0.7 * sstep(-0.2, 0.5, Math.sin(t * 0.8 + g.ph * 3)));
              face(g.m, v1, fwd, 0.35 + Math.sin(t * 1.1 + g.ph) * 0.3, 2.25);
            }
          }
          for (const g of magpies) g.m.visible = on;
        }
        // the parrotbills: flung in from behind-left as the eye passes the V's head, the ribbon holds ahead-left for four
        // seconds (its nearest birds 6 m off), drawn out by the gusts, then peels away ahead. It lies along the wind, and
        // its middle is kept far enough to the left of the way we are going that its downwind end never crosses in front
        // of the ring. ts: the seconds of the flight from the V's head to where the eye is (read from the table, so the
        // same place always gives the same ts)
        if (flock) {
          const ts = flightAt(sCam / L) - flightAt(sHead / L), on = ts > 0 && ts < FLK_IN + FLK_HOLD + FLK_OUT;
          flock.visible = on;
          if (on) {
            const inK = sstep(0, FLK_IN, ts), outK = sstep(FLK_IN + FLK_HOLD, FLK_IN + FLK_HOLD + FLK_OUT, ts);
            const lead = lerp(-6, 4.4, inK) + 44 * outK, upY = lerp(3, 0.5, inK) + 9 * outK, um = clamp(u + lead / L, 0, 1);
            path.pointAt(um, mC); path.tangentAt(um, mT); mT.y = 0; mT.normalize(); mL.set(mT.z, 0, -mT.x);
            const gs0 = hero.wind.gust(mC.x, mC.z, t)[0], st = clamp(0.55 * gs0 + 0.3 * (0.5 + 0.5 * Math.sin(t * 1.15)), 0, 1), fu = flock.material.uniforms;
            const half = 3.4 + 0.7 * st + 3 * outK, aL = windDir.x * mL.x + windDir.y * mL.z;       // (aL: how much of the wind is to our left)
            const lat = lerp(9, 4.2, inK) + half * Math.abs(aL) + 14 * outK;
            v1.copy(mC).addScaledVector(mL, lat + 0.4 * Math.sin(t * 0.9)); v1.y += upY + 0.2 * Math.sin(t * 1.3 + 1);
            fu.uC.value.copy(v1); fu.uF.value.copy(mT).addScaledVector(mL, 0.3 * outK - 0.25 * (1 - inK)).normalize();
            fu.uShape.value.set(half, 1.05 + 0.6 * outK, 1.0 + 0.5 * outK, 1 + 0.5 * st);
            fu.uVel.value = 7;
          }
        }
        swifts.visible = sCam > sSwifts;
        ringLeaves.visible = L - sCam < SADDLE; ringLeaves.material.uniforms.uOn.value = sstep(SADDLE, LAST_STRAIGHT, L - sCam);
        // leapers: ballistic arcs across the lane, keyed to u
        for (const l of leapers) {
          const tr = (u - (l.uL - 0.016)) / 0.032 + l.off, tt = clamp(tr, 0, 1);
          l.m.visible = tr > -1.6 && tr < 2.4;
          if (!l.m.visible) continue;
          v1.copy(l.a).lerp(l.b, tt); v1.y += 4.2 * tt * (1 - tt);
          fwd.copy(l.b).sub(l.a); fwd.y += 4.2 * (1 - 2 * tt);
          const hk = 1 - sstep(0, 0.14, tt) + sstep(0.86, 1, tt);                               // holding a culm: upright against it
          l.dir.copy(fwd).normalize().lerp(l.hold, hk);
          if (hk > 0) v1.addScaledVector(l.hold, -0.3 * hk).y += Math.sin(t * 1.7 + l.off * 20) * 0.05 * hk;
          face(l.m, v1, l.dir, Math.sin(tt * 5 + l.off * 9) * 0.35 * (1 - hk), l.sc);
        }
        // pheasants: crouch, then rocket across
        for (const b of birds) {
          const tt = (u - (uFlush - 0.017)) / 0.034 - b.delay;
          b.m.visible = tt > 0 && tt < 1;
          if (!b.m.visible) continue;
          const e = Math.pow(tt, 0.7);
          v1.copy(b.a).lerp(b.b, tt); v1.y = lerp(b.a.y, b.b.y, e);
          fwd.copy(b.b).sub(b.a); fwd.y = (b.b.y - b.a.y) * 0.7 * Math.pow(Math.max(tt, 0.05), -0.3);
          b.mat.uniforms.uFlap.value.set(2.45 + (tt - 0.5) * 64 + b.i * 1.7, 1.0);            // the beat is keyed to u: at the flush frame the cock's wings are high, coming down
          face(b.m, v1, fwd, 0.42, b.sc);
        }
      },
      dispose() { sky.dispose?.(); leapGeo.dispose(); },
    };
    // the flight's time, filled by the engine's own law, calling the world's own pace (made.pace) and duration:
    // (the engine's law: speed at u = the route's length / the duration x pace(u), pace read at 65 even steps, held to 0.35..2.5, joined by straight lines and scaled so that the flight lasts the duration: src/core/engine.js, makePace)
    {
      const N = 64, p = []; let inv = 0;
      for (let i = 0; i <= N; i++) { const v = +made.pace(i / N); p.push(Number.isFinite(v) ? clamp(v, 0.35, 2.5) : 1); }
      for (let i = 0; i < N; i++) inv += 2 / (p[i] + p[i + 1]);
      const paceAt = (u) => { const x = clamp(u, 0, 1) * N, i = Math.min(N - 1, Math.floor(x)); return (p[i] + (p[i + 1] - p[i]) * (x - i)) * inv / N; };
      for (let i = 0; i < FLIGHT_N; i++) flightT[i + 1] = flightT[i] + made.duration / FLIGHT_N / paceAt((i + 0.5) / FLIGHT_N);
    }
    return made;
  },
};
