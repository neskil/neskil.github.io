// THE CLAY LICK (macaw-wall): morning on a bend of a brown Amazon river. The camera comes in down the upstream reach
// from the north-east behind a pair of macaws: the whole red clay cliff hung with macaws (the hero,
// src/parts/macaw-wall.js) stands lit across the water, mirrored in the river. We drop low over the water and push in; a
// first flight of a hundred pairs bursts off the clay and comes out across our bow, then wheels over the reach; we pass
// a snag with egrets, swing in close under the birds on the wall's east shoulder and turn
// along it 22 m out; a harpy's shadow flushes the wall and it empties OVERHEAD, a sheet
// of birds against the sky 20 m above our line. The flock rings high over the river; forty pairs peel off it and fly
// ahead of us across the sandbar with capybara, up a blackwater creek between cecropias and round the spiral we climb
// about a giant kapok (buttresses, lianas, a strangler fig with a howler troop, bromeliad limbs), settling pair by pair
// on its limbs and crown. Through the canopy mist into sun, then a glide over a white sea of mist to the ring in the
// fork of the second kapok, a few pairs seated in its crown, the clay wall glowing beyond and hung with birds again.
//
// World space = hero space (the cliff runs along X at z = 0..10 and looks +Z across the river).
// Beats (u): 0-0.20 approach (the whole cliff 0-0.04, lead pair 0-0.238, the early flight across the bow 0.074-0.093
// and wheeling to the flush, snag 0.12-0.14, the east shoulder close 0.15-0.18, the turn 0.18-0.23), 0.20-0.29 along the wall, 0.296 flush (te = 0; the sheet
// passes overhead 0.30-0.43), 0.40-0.46 the forty pairs gather ahead and lead us to 0.80, 0.50-0.60 sandbar (capybara
// 0.52-0.56, skimmers 0.55) and creek mouth, 0.60-0.67 creek, 0.67-0.89 spiral (howlers 0.70-0.74, pairs settling on
// the kapok 0.70-0.85, toucans across the lens 0.733-0.806, mist 0.77-0.82, the wall refilled from 0.752), 0.89-1
// final glide over the mist sea to the umbrella kapok (three pairs of macaws come in from the right and land in its
// crown above and right of the ring, 0.875-0.992). No stream of birds at the ring.
// Looks (seed or ctx.vary.hour): a clear blue morning, the sun still low and warm, with vultures (the usual one) | golden late afternoon, second
// sitting | dawn mist | the morning after rain (deep mist, wet wall, fast river). Water: normal | high (bar drowned,
// capybara swimming) | low. Cast and bird count vary (ctx.vary.density). Rare (ctx.vary.rare): the harpy stoops through
// the forty pairs ahead of the bow over the river (u ~0.47), and is seen again perched beside the portal.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { makeSky, makeLightRig } from '../kit/sky.js';
import * as T from '../kit/terrain.js';
import * as flora from '../kit/flora.js';
import * as F from '../kit/fauna.js';
import * as fx from '../kit/fx.js';
import { buildHero } from '../parts/macaw-wall.js';

const PAL = ['#B5472A', '#E3261B', '#1F5FBF', '#F5C518', '#2F5E2E', '#8A6A45', '#EAE3D2'];
const DUR = 48, TAU = Math.PI * 2;
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const C = (hex, k = 1) => new THREE.Color(hex).multiplyScalar(k);

// sunDir is the hero's raking dawn sun for every look (the brief mirrors the afternoon so each relation to travel holds)
const LOOKS = {
  dawn: { hour: 'dawn', weather: 'dry', sun: [0.84, 0.24, 0.485], sunCol: '#FFD9A0', sunI: 3.1, hemiSky: '#8fb4d2', hemiGnd: '#5e5a44', hemiI: 1.15,
    zenith: '#5f93cc', mid: '#a9c6dc', horizon: '#e6dfcd', scatter: '#ffd9b0', fog: '#cfd3cc', fogD: 0.0021, mist: 1, deck: 1, deckCol: '#f1ece0', deckShade: '#9db3c8',
    water: '#86603a', waterSun: 0.3, heroSun: 1.6, shadowY: 5, exposure: 1.0, tint: '#fff6ea', shadowTint: '#0b1522', cirrus: '#f3c7bd' },
  // (the usual look: a clear blue morning with the sun still low, 21 degrees up: warm raking light, long shadows, the mist burned to rags)
  day: { hour: 'day', weather: 'dry', sun: [0.82, 0.36, 0.47], sunCol: '#FFD4A0', sunI: 3.5, hemiSky: '#8dbcea', hemiGnd: '#6e6046', hemiI: 1.15,
    zenith: '#2f7fd8', mid: '#7db4ea', horizon: '#cfe2ee', scatter: '#ffe2ba', fog: '#bcd1e0', fogD: 0.0012, mist: 0.35, deck: 0.36, deckCol: '#f7f1e2', deckShade: '#93aecb',
    water: '#86603a', waterSun: 1, heroSun: 2.2, shadowY: -20, exposure: 0.97, tint: '#fff9f0', shadowTint: '#07162e', cirrus: '#fff4e2' },
  golden: { hour: 'golden', weather: 'dry', sun: [0.86, 0.19, 0.47], sunCol: '#FFB25C', sunI: 3.2, hemiSky: '#8c98c4', hemiGnd: '#6a4c34', hemiI: 1.1,
    zenith: '#5a7fc0', mid: '#c2b8b4', horizon: '#f0c690', scatter: '#ffb060', fog: '#dcc09a', fogD: 0.0019, mist: 0.5, deck: 0.6, deckCol: '#ffe2b4', deckShade: '#a493a8',
    water: '#7e623e', waterSun: 0.4, heroSun: 1.75, shadowY: 3, exposure: 1.0, tint: '#fff0dc', shadowTint: '#1a1028', cirrus: '#ffc890' },
  rain: { hour: 'dawn', weather: 'rain', sun: [0.84, 0.27, 0.47], sunCol: '#FFE2B8', sunI: 2.6, hemiSky: '#9fb6c6', hemiGnd: '#4e5642', hemiI: 1.35,
    zenith: '#7f9fc0', mid: '#b9c8d2', horizon: '#dfe0d8', scatter: '#f4e2c8', fog: '#cdd4d2', fogD: 0.0034, mist: 1.7, deck: 1.25, deckCol: '#eef0ec', deckShade: '#9aaec0',
    water: '#684e36', waterSun: 0.15, heroSun: 1.4, shadowY: 8, exposure: 1.04, tint: '#f4faff', shadowTint: '#0a1820', cirrus: '#e8e4e6' },
};

// distance from (x, z) to a polyline [[x, z, halfWidth], ...] minus the interpolated half width; out.t = index + fraction
function polySD(P, x, z, out) {
  let best = 1e9, bi = 0, bt = 0;
  for (let i = 0; i < P.length - 1; i++) {
    const ax = P[i][0], az = P[i][1], bx = P[i + 1][0] - ax, bz = P[i + 1][1] - az;
    const t = clamp(((x - ax) * bx + (z - az) * bz) / (bx * bx + bz * bz), 0, 1), dx = x - ax - bx * t, dz = z - az - bz * t;
    const d = Math.sqrt(dx * dx + dz * dz) - lerp(P[i][2], P[i + 1][2], t);
    if (d < best) { best = d; bi = i; bt = t; }
  }
  if (out) { out.i = bi; out.t = bt; }
  return best;
}

// ---- plant geometry in the kit's flora format (position, normal, color, wind, uv) so one windMaterial draws it all ----
class PG {
  constructor(solid) { this.p = []; this.n = []; this.c = []; this.w = []; this.t = []; this.i = []; this.solid = solid; }
  get count() { return this.p.length / 3; }
  // merge a kit flora geometry placed by a matrix; tint multiplies its colours, swayAdd lifts its sway (m)
  addGeo(g, m, tint = [1, 1, 1], swayAdd = 0) {
    const base = this.count, P = g.attributes.position, N = g.attributes.normal, Cc = g.attributes.color, W = g.attributes.wind, U = g.attributes.uv;
    const v = new THREE.Vector3(), nm = new THREE.Matrix3().getNormalMatrix(m), s = Math.cbrt(Math.abs(m.determinant()));
    for (let k = 0; k < P.count; k++) {
      v.fromBufferAttribute(P, k).applyMatrix4(m); this.p.push(v.x, v.y, v.z);
      v.fromBufferAttribute(N, k).applyMatrix3(nm).normalize(); this.n.push(v.x, v.y, v.z);
      this.c.push(Cc.getX(k) * tint[0], Cc.getY(k) * tint[1], Cc.getZ(k) * tint[2]);
      this.w.push(W.getX(k) * s + swayAdd, W.getY(k), W.getZ(k), W.getW(k)); this.t.push(U.getX(k), U.getY(k));
    }
    const I = g.index; for (let k = 0; k < I.count; k++) this.i.push(base + I.getX(k));
  }
  // raw smooth mesh: pos flat array, idx, col(k) -> [r,g,b], sway(k) -> m
  addMesh(pos, idx, col, sway, flutter = 0, leaf = 0) {
    const base = this.count, n = pos.length / 3, nor = new Float32Array(pos.length);
    for (let k = 0; k < idx.length; k += 3) {
      const a = idx[k] * 3, b = idx[k + 1] * 3, c = idx[k + 2] * 3;
      const ux = pos[b] - pos[a], uy = pos[b + 1] - pos[a + 1], uz = pos[b + 2] - pos[a + 2], vx = pos[c] - pos[a], vy = pos[c + 1] - pos[a + 1], vz = pos[c + 2] - pos[a + 2];
      const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      for (const q of [a, b, c]) { nor[q] += nx; nor[q + 1] += ny; nor[q + 2] += nz; }
    }
    for (let k = 0; k < n; k++) {
      const o = k * 3, l = Math.hypot(nor[o], nor[o + 1], nor[o + 2]) || 1, cc = col(k);
      this.p.push(pos[o], pos[o + 1], pos[o + 2]); this.n.push(nor[o] / l, nor[o + 1] / l, nor[o + 2] / l);
      this.c.push(cc[0], cc[1], cc[2]); this.w.push(typeof sway === 'function' ? sway(k) : sway, flutter, leaf, 0); this.t.push(this.solid[0], this.solid[1]);
    }
    for (const k of idx) this.i.push(base + k);
  }
  // tube through Vector3 points; rad per point (or fn(t, angle)); col(t, k) -> [r,g,b]; sway(t) -> m
  tube(pts, rad, sides, col, sway = 0) {
    const pos = [], idx = [], ts = [], n = pts.length, Tn = new THREE.Vector3(), N = new THREE.Vector3(), B = new THREE.Vector3(), ref = new THREE.Vector3();
    for (let k = 0; k < n; k++) {
      Tn.subVectors(pts[Math.min(n - 1, k + 1)], pts[Math.max(0, k - 1)]).normalize(); ref.set(0, 1, 0); if (Math.abs(Tn.y) > 0.9) ref.set(1, 0, 0);
      N.crossVectors(Tn, ref).normalize(); B.crossVectors(Tn, N);
      const t = k / (n - 1);
      for (let s = 0; s < sides; s++) {
        const a = (s / sides) * TAU, r = typeof rad === 'function' ? rad(t, a) : rad[k], ca = Math.cos(a) * r, sa = Math.sin(a) * r;
        pos.push(pts[k].x + N.x * ca + B.x * sa, pts[k].y + N.y * ca + B.y * sa, pts[k].z + N.z * ca + B.z * sa); ts.push(t, s);
      }
      if (k) for (let s = 0; s < sides; s++) { const a = (k - 1) * sides + s, b = (k - 1) * sides + (s + 1) % sides; idx.push(a, b, b + sides, a, b + sides, a + sides); }
    }
    this.addMesh(pos, idx, (k) => col(ts[k * 2], ts[k * 2 + 1]), typeof sway === 'function' ? (k) => sway(ts[k * 2]) : sway);
  }
  // a leaf card from the atlas: root, tip direction * length, half width along `side`
  card(root, tip, side, cell, col, sway = 0.1, flutter = 1) {
    const b = this.count, nx = side.y * (tip.z - root.z) - side.z * (tip.y - root.y), ny = side.z * (tip.x - root.x) - side.x * (tip.z - root.z), nz = side.x * (tip.y - root.y) - side.y * (tip.x - root.x);
    const l = Math.hypot(nx, ny, nz) || 1, sg = ny < 0 ? -1 : 1;
    const put = (x, y, z, u, v, k) => { this.p.push(x, y, z); this.n.push(sg * nx / l, sg * ny / l + 0.4, sg * nz / l); this.c.push(col[0] * k, col[1] * k, col[2] * k); this.w.push(sway, flutter, 1, 0); this.t.push(u, v); };
    put(root.x - side.x, root.y - side.y, root.z - side.z, cell[0], cell[3], 0.7); put(root.x + side.x, root.y + side.y, root.z + side.z, cell[2], cell[3], 0.7);
    put(tip.x + side.x, tip.y + side.y, tip.z + side.z, cell[2], cell[1], 1.1); put(tip.x - side.x, tip.y - side.y, tip.z - side.z, cell[0], cell[1], 1.1);
    this.i.push(b, b + 1, b + 2, b, b + 2, b + 3);
  }
  async build(yieldFn) {                                        // hands the page back between the attributes
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); await yieldFn();
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3)); await yieldFn();
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3)); await yieldFn();
    g.setAttribute('wind', new THREE.Float32BufferAttribute(this.w, 4)); await yieldFn();
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.t, 2)); g.setIndex(this.i); await yieldFn();
    g.computeBoundingSphere();
    return g;
  }
}

// stretch a kit broadleaf into a rainforest tree: tall bare bole, wide flat crown
function tallTree(g, bole, crownK, wide) {
  const P = g.attributes.position, W = g.attributes.wind, H = g.userData.height || 14, a = H * 0.3;
  for (let k = 0; k < P.count; k++) {
    const y = P.getY(k), up = y > a, e = smoothstep(a * 0.7, a * 1.5, y), sx = lerp(1.5, wide, e);
    P.setXYZ(k, P.getX(k) * sx, up ? a * bole + (y - a) * crownK : y * bole, P.getZ(k) * sx);
    W.setX(k, W.getX(k) * 1.8);
  }
  P.needsUpdate = true; g.computeBoundingSphere(); g.computeBoundingBox();
  g.userData.height = g.boundingBox.max.y; g.userData.radius = Math.max(g.boundingBox.max.x, -g.boundingBox.min.x, g.boundingBox.max.z, -g.boundingBox.min.z);
  return g;
}

// ---------- shaders: river, canopy shell, mist deck ----------
const GLSL_N = /* glsl */`
float h21(vec2 p){ p = fract(p * vec2(123.34, 345.45)); p += dot(p, p + 34.345); return fract(p.x * p.y); }
vec2 h22(vec2 p){ float n = h21(p); return vec2(n, h21(p + n + 11.7)); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
float fbm4(vec2 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++) { s += a * vn(p); p = p * 2.03 + 17.3; a *= 0.5; } return s; }
`;
const WORLD_VERT = (attrs, body) => /* glsl */`
${attrs}
varying vec3 vW;
uniform float uTime;
#include <common>
#include <fog_pars_vertex>
void main(){
  vec3 p = position;
  ${body}
  vW = p;
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const WATER_FRAG = /* glsl */`
varying vec3 vW; varying float vDepth, vShade; varying vec3 vFlow;
uniform float uTime, uSunVis, uShadowY, uFast, uFlowV, uReflK, uFoamK, uBirdK, uDeckY, uCliffR;
uniform vec3 uMistC;
uniform vec3 uSunDir, uSunCol, uZen, uHor, uSilt, uBlack, uSand, uClay, uClayShade, uGreen, uAmb, uLeafLit;
uniform vec4 uCk;                                                                             // the creek: xy = its right-hand direction, zw = the light well's centre
// the river's axis as two straight reaches joined by an arc (uFlow: the way the current runs in each, uRad: the arc's two end
// radii, uBend: its centre, radius and length); the look's sky; the wall's own face, beds, light and baked shadows (uGul)
uniform vec4 uFlow, uRad, uBend, uWall, uHaze, uGul[48], uBank[24], uKap[2], uSct, uAir, uAxis;       // (uBank: the two banks' forest lines and canopy heights along the river; uKap: the two kapoks' crowns; uSct: the sky's glow round the sun, its colour and its power; uAir: the wind over the river; uAxis: where the straight frame hands over to the river's own baked axis below the wall)
uniform vec3 uSkyH, uSkyM, uSkyZ, uCir, uWallC, uWallO, uWallG, uWallL, uWallA, uWallB, uBankL, uBankS, uBed, uSctK;     // (uBed: the bar's own sand, as its material has it; uSctK: the sky's own measures of its glow: its amount, its share at the zenith, its fall with height)
uniform vec2 uSkyP, uKapV, uKapT, uMistL;                                                     // (uMistL: the river mist's top, in the world's height, and what a metre of it takes of the light, both read off the mist as it is built)
uniform float uSeaK;                                                                          // (round 21: the look's own share of a sea of mist, 0 = rags .. 1 = a sea, from the look's deck by the law the file had for it)
#include <common>
#include <fog_pars_fragment>
${GLSL_N}
// ripples: three sets of wavelets, each turned a different way and the whole field bent by a slow warp, so that no row or cell
// of the noise's own lattice shows at any distance
float ripH(vec2 q){
  q += 1.6 * (vec2(vn(q * 0.09 + 3.0), vn(q * 0.09 + 41.0)) - 0.5);
  vec2 q2 = vec2(q.x * 0.82 - q.y * 0.57, q.x * 0.57 + q.y * 0.82), q3 = vec2(q.x * 0.34 + q.y * 0.94, -q.x * 0.94 + q.y * 0.34);
  return 0.46 * vn(vec2(q.x * 0.28, q.y * 1.3)) + 0.28 * vn(vec2(q2.x * 0.45 + 7.0, q2.y * 2.3 + 3.0)) + 0.18 * vn(vec2(q3.x * 1.1 + 1.0, q3.y * 3.9)) + 0.08 * vn(vec2(q2.y * 6.3 + 5.0, q2.x * 2.4));
}
// the river's own ripples, in metres: value noise with its slope from the same four corners (quintic, so the slope has no crease
// at a cell's edge). rip() lays one set of wavelets L metres from crest to crest and 1.9 L long, turned by cs (cos, sin) in the
// current's frame; it returns the height (0..1) and the slope across and along the current for a wave one metre high
vec3 vnd(vec2 p){ vec2 i = floor(p), f = fract(p), w = f * f * f * (f * (f * 6.0 - 15.0) + 10.0), dw = 30.0 * f * f * (f * (f - 2.0) + 1.0);
  float a = h21(i), b = h21(i + vec2(1., 0.)), c = h21(i + vec2(0., 1.)), d = h21(i + vec2(1., 1.));
  return vec3(mix(mix(a, b, w.x), mix(c, d, w.x), w.y), dw.x * mix(b - a, d - c, w.y), dw.y * mix(c - a, d - b, w.x)); }
// (w: THE GRAIN OF WATER TOO FAR TO SEE FACE BY FACE. A pixel that spans n faces of a set shows the mean of their light. That
// mean is not the same from pixel to pixel: n faces picked by chance differ in their mean by one face's own difference over
// the root of n, so far water is grained, most across the line of sight where each pixel takes other faces, and the grain
// dies away slowly, as 1 over root n, never at a stroke. So the set is read at the pixel's own place whatever its size, and
// its slope is cut to w = 1 / sqrt(n): the face the pixel shows stands for the n it holds. n: the faces in the pixel's
// footprint, its length and its breadth in the set's own turned cells (from the screen's own differences of the pattern's
// coordinate, never the eye's distance), each counted from one face up: a face is a whole cell of a round-backed set and
// half a cell of a sharp-crested one. What the pixel does not show of the set, 1 - w * w of its slopes' variance, goes to the
// unresolved slopes further down. A pixel inside one face has w = 1 and the face is drawn as it is)
// (cr = 1: a SHARP-CRESTED set. A wavelet raised by wind or by the current's boils has a sharp crest and a round trough: the
// surface is folded about the noise's middle level, so it climbs to a crest line on both sides and its slope turns over AT the
// line, within one pixel (the fold's sign is taken over the pixel's own footprint in the noise, never finer, and over no more
// than half a cell, which is a face), and each side of a crest is one face. A folded set has a crest in every cell, L from
// crest to crest, where a round-backed one has a crest every other cell; with the same slopes it stands half as high as its
// height of noise)
// (ws: how much of the set this pixel sees face by face, as it was: 1 well inside a face, 0 once a face is no bigger than the
// pixel. Only the faces seen one by one move the image of what stands on the banks; the grain lies on the mirror's strength
// and on the sky it shows, and the image under it stays where the mean of the faces puts it)
vec4 rip(vec2 s, vec2 cs, float L, vec2 drift, float cr, out float ws){
  vec2 k = 1.0 / vec2(L, 1.9 * L), q = vec2(cs.x * s.x - cs.y * s.y, cs.y * s.x + cs.x * s.y) * k, qx = dFdx(q), qy = dFdy(q), fw = abs(qx) + abs(qy), fq = min(fw, vec2(0.5)); vec3 d = vnd(q + drift);
  vec2 g = mix(1.0, -clamp((d.x - 0.5) / (0.5 * dot(abs(d.yz), fq) + 1e-4), -1.0, 1.0), cr) * d.yz * k;
  float f1 = mix(1.0, 0.5, cr), fl = max(length(qx), length(qy)), n = max(fl / f1, 1.0) * max(abs(qx.x * qy.y - qx.y * qy.x) / (max(fl, 1e-6) * f1), 1.0);
  ws = 1.0 - smoothstep(mix(0.3, 0.15, cr), mix(1.0, 0.5, cr), max(fw.x, fw.y));
  return vec4(mix(d.x, 1.0 - abs(2.0 * d.x - 1.0), cr), cs.x * g.x + cs.y * g.y, cs.x * g.y - cs.y * g.x, inversesqrt(n));
}
// how much of a pattern of the given lattice (cells per metre across and along the current) a pixel still resolves: 1 while its
// footprint fs (metres across, along) is well inside a cell, 0 once it spans one, where the pattern is its mean
float seen(vec2 fs, vec2 k){ return 1.0 - smoothstep(0.3, 1.0, max(fs.x * k.x, fs.y * k.y)); }
// the clay wall's own hash and noise (src/parts/macaw-wall.js), so that its beds lie in the mirror where they lie on the wall
float wH1(float p){ return fract(sin(p * 91.3458) * 47453.5453); }
float wH(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float wN(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(wH(i), wH(i + vec2(1., 0.)), f.x), mix(wH(i + vec2(0., 1.)), wH(i + vec2(1., 1.)), f.x), f.y); }
void main(){
  float ckw = clamp(vFlow.z, 0.0, 1.0), dep = clamp(vDepth, -4.0, 12.0);                       // (what the vertex stage hands over, held in its range)
  // where this water lies along the river, in the world's own metres: sc = (across, along the current), eX and eY the two level
  // directions there. Upstream reach, arc of the bend, the reach under the wall: one continuous map, so nothing laid in it is pulled
  vec2 pv = vW.xz - uBend.xy, eX = uRad.xy, eY = uFlow.xy; float sA = dot(pv, uFlow.xy), phi = atan(sA, dot(pv, uRad.xy)) * uBend.z;
  vec2 sc = vec2(dot(pv, eX) - uBend.z, sA);
  if (phi > uBend.w) { eX = uRad.zw; eY = uFlow.zw; sc = vec2(dot(pv, eX) - uBend.z, uBend.w + dot(pv, eY)); }
  else if (phi > 0.0) { float rl = max(length(pv), 1.0); eX = pv / rl; eY = dot(eX, uRad.xy) * uFlow.xy - dot(eX, uFlow.xy) * uRad.xy; sc = vec2(rl - uBend.z, phi); }
  // (below the wall's reach the river's axis leaves this straight line: it swings 7 degrees toward the wall's side, then 17 and 31
  // degrees the other way. There everything laid along the current is laid in the river's own metres along and across its axis,
  // as the water's grid has them baked (vFlow: the line the flow follows through every turn), handed over across 60 m either
  // side of the wall's downstream end (uAxis.w: its place along the frame; uAxis.xyz: the baked metres' sense, and what sets
  // them level with the frame's at that place). bA, sAl: the place across and along the straight frame, in which the banks'
  // lines were measured and stand still)
  float bA = sc.x, sAl = sc.y;
  sc = mix(sc, vec2(uAxis.x * vFlow.y + uAxis.y, vFlow.x + uAxis.z), smoothstep(uAxis.w - 60.0, uAxis.w + 60.0, sAl));
  vec2 fs = fwidth(sc);                                                                       // the pixel's footprint on the water: metres across and along the current
  sc.y -= uTime * uFlowV * (1.0 - 0.8 * ckw);                                                 // (advected, as it was)
  vec2 wc = vec2(vW.x + vW.z, vW.z - vW.x) * 0.9 + uTime * vec2(0.12, 0.2);
  float cat = vn(vW.xz * vec2(0.021, 0.034) + 7.0 + 0.01 * uTime) * (1.0 - ckw);                // cat's-paws: the river is never one flat tone from above
  // THE WALL'S WIND SHADOW. The wind comes over the wall and slants out across the river (uAir.x: the metres it runs along the wall
  // for each metre out from it). Behind a cliff the wind comes down to the water again seven cliff heights downwind, which is
  // uAir.y heights out from the foot, measured square to the wall. wx: metres out from the wall's foot (uWall.x); the rim's height
  // is read where the wind that reaches this water crossed it (uGul.w), so the shadow is skewed downwind and runs out at the wall's
  // low ends. lee: 0 at the foot, 1 where the wind is whole again
  float wx = vW.z - uWall.x, lx = clamp((vW.x + uAir.x * wx + 150.0) * (47.0 / 300.0), 0.0, 46.999); int lgi = int(lx);
  float lee = smoothstep(0.0, 1.0, wx / (uAir.y * max(mix(uGul[lgi].w, uGul[lgi + 1].w, lx - float(lgi)), 1.0)));
  // (the wind ruffles the river in patches: paw is 1 inside a cat's-paw, and its edge is crisp and ragged, 2 to 3 m wide, torn by
  // 9 m and 3 m of noise of its own (not the forest shadow's) into patches of a few metres to forty. The paws lie where the
  // river's tone is darkest: ruffled water is the darker water)
  float paw = 1.0 - smoothstep(0.40, 0.45, cat + 0.4 * (vn(vW.xz * 0.11 + 23.0) - 0.5) + 0.12 * (vn(vW.xz * 0.37 + 61.0) - 0.5));
  // THE RIPPLES' HEIGHT, by two laws. big, rough, fine: the share of its full height at which the 8 m, the 3 m and the 0.8 m set
  // stands (crest to crest; the three are sharp-crested, and their full heights are 0.4, 0.18 and 0.088 m: 0.05, 0.06 and 0.11
  // of their lengths). (1) THE CURRENT: the river flows, so no water of it is glass, in any look and under any wall. Its
  // turbulence lifts the surface by a third of its velocity head: cur = v * v / (6 g) metres at the 0.8 m wavelets (v: the
  // current's own speed in m/s, the speed everything on the river is carried at: 5 cm of wavelet at low water, 9 cm at the usual
  // level), and by the cube root of the length more at the longer sets, as eddies do; over the sets' full heights that is 11.4,
  // 8.6 and 5.4 shares per metre. (2) THE WIND adds to it outside the wall's shadow: a wind of w m/s over water gives it
  // 0.00512 w of mean-square slope (the measure taken from the sun's glitter on the sea); the three sets carry 0.0145 between
  // them at full height, so it raises each by the root of 0.353 w. w: the air over the river (uAir.z, the speed the mist on this
  // reach drifts at) or a cat's-paw's gust (uAir.w), times lee. The two add as heights squared. A wavelet a seventh of its length
  // high breaks: for the 0.8 m set that is 0.114 m, 1.3 of its full height, so the current lifts it no higher and no set stands
  // above 1.3 of its full height (the two longer sets are held to the same share). und: the slow heave is half as high again on
  // the fast river
  // (the current's lift itself is no longer held at the 0.8 m set's breaking height: that held the 8 m set at 0.61 of its
  // full height and the 3 m set at 0.98 on a river running faster than 2.6 m/s, though neither breaks there, and it is the
  // long sets a pixel still sees at 200 m. EACH SET BREAKS AT A SEVENTH OF ITS OWN LENGTH: 1.14 m for the 8 m set, 2.86 of
  // its full height; 0.43 m for the 3 m set, 2.38 of its full height; 1.3 for the 0.8 m set. The wind raises no set above
  // 1.3, as it was (a level); the current alone carries a set on, to its own breaking height at most. Up to 2.98 m/s that
  // is under 1.3 for every set and nothing changes: the river's usual current is 2.3. At 4.4 m/s the 8 m set stands at
  // 1.74 of its full height (0.7 m), the 3 m set at its breaking 2.38 (0.43 m): water that stands in steep faces)
  float vc = uFlowV * (1.0 - 0.8 * ckw), cur = vc * vc / 58.86, air = lee * mix(uAir.z, uAir.w, paw), wnd = 0.353 * air, und = 1.0 + 0.5 * uFast;
  // the surface in three sizes, each turned its own way and drifting on the current: the current's own slow heave (round-backed,
  // in cells of 9 m) and the sharp-crested ripples 3 m and 0.8 m from crest to crest, the current's and the wind's. k1..k4: how much of each this pixel sees face by face (ws); each
  // set's own fourth number is w, its grain at this pixel. What the pixel does not show of a set is kept as lost, the rms slope it cannot see
  float k1, k2, k3, k4; vec4 r1 = rip(sc, vec2(0.906, 0.423), 9.0, uTime * vec2(0.03, 0.05), 0.0, k1);
  // (THE CURRENT'S BOILS AND SEAMS. The heave is the current welling up: over a boil's crown the water spreads and the ripples on
  // it are drawn out flat, a slick; in the seams between the boils it runs together and they are packed steep. A slick carries
  // half the mean-square slope of ruffled water (the measure of the sea's glitter at a fresh breeze: 0.0158 against 0.0286 at
  // 5 m/s; a measure of water, not read off this world), so the crowns have 0.5 and the seams 1.5 of what the two laws above
  // give, and the river's mean is the laws'. The heave's noise stands above its middle over half the water, and the edge of a
  // slick is 2 to 3 m wide (0.16 of the noise's height). boil: the share of the ripples' height that makes; 1 where the pixel
  // no longer resolves the heave. These are the patches a river shows from far off: slicks that mirror, seams that do not)
  float boil = sqrt(mix(1.5, 0.5, smoothstep(0.42, 0.58, 0.5 + k1 * (r1.x - 0.5))));
  float big = min(boil * sqrt(29.0 * cur * cur + wnd), max(1.3, min(5.385 * cur, 2.86))), rough = min(boil * sqrt(74.5 * cur * cur + wnd), max(1.3, min(8.631 * cur, 2.38))), fine = min(boil * sqrt(129.0 * cur * cur + wnd), 1.3);
  vec4 r2 = rip(sc + 17.0, vec2(0.766, -0.643), 3.0, uTime * vec2(-0.08, 0.105), 1.0, k2), r3 = rip(sc + 41.0, vec2(0.342, 0.94), 0.8, uTime * vec2(0.2, -0.15), 1.0, k3);
  // (and between the heave and the ripples a sharp-crested set 8 m from crest to crest, lying along the current: the one a pixel
  // resolves farthest, where the smaller two have gone to their mean, so that the water there is drawn into level slivers and
  // is not a plain field)
  vec4 r4 = rip(sc + 73.0, vec2(0.985, -0.174), 8.0, uTime * vec2(0.035, -0.045), 1.0, k4);
  // (gs: the slope of the face each pixel shows, grain and all, each set by its own w; gsI: the slope of the faces seen one by
  // one, each set by its own ws, which is what carries the image of the banks and the wall)
  vec2 gs = 0.27 * und * r1.w * r1.yz + 0.8 * big * r4.w * r4.yz + 0.36 * rough * r2.w * r2.yz + 0.176 * fine * r3.w * r3.yz;     // (the heave's height of noise is 0.03 of its cell; a crested set's is twice its full height, the fold taking half)
  vec2 gsI = 0.27 * und * k1 * r1.yz + 0.8 * big * k4 * r4.yz + 0.36 * rough * k2 * r2.yz + 0.176 * fine * k3 * r3.yz;
  // (the four sets' own rms slopes are 0.0135, 0.04, 0.054 and 0.10: their squares, summed over what the pixel does not show)
  float lost = sqrt(0.00018 * und * und * (1.0 - r1.w * r1.w) + 0.0016 * big * big * (1.0 - r4.w * r4.w) + 0.0029 * rough * rough * (1.0 - r2.w * r2.w) + 0.01 * fine * fine * (1.0 - r3.w * r3.w)) * (1.0 - ckw);
  float e = 0.3, hA = 0.5 + 0.46 * k1 * (r1.x - 0.5) + 0.32 * k2 * (r2.x - 0.5) + 0.22 * k3 * (r3.x - 0.5);
  vec3 toC = cameraPosition - vW; float dist = length(toC), hiK = smoothstep(uDeckY - 2.0, uDeckY + 7.0, cameraPosition.y) * (1.0 - vFlow.z);
  float nearS = smoothstep(55.0, 14.0, dist) * (1.0 - ckw);                                  // (close under the lens the current's long streaks break into ripple-sized patches)
  // rings: drips from the leaves and rising fish, a slow widening circle here and there (creek and river margins)
  vec2 rc = vW.xz / 7.0, ri = floor(rc), rf = fract(rc) - 0.5 - 0.25 * (h22(ri + 1.3) - 0.5);
  float rph = fract(uTime * (0.16 + 0.1 * h21(ri + 9.0)) + h21(ri + 4.0)), rr = length(rf) * 7.0, rad = 0.2 + 2.6 * rph;
  float ring = step(0.5, h21(ri + 2.0)) * sin(clamp((rr - rad) * 5.0, -3.1416, 3.1416) * 2.0) * smoothstep(0.9, 0.0, abs(rr - rad)) * (1.0 - rph) * (1.0 - rph) * smoothstep(110.0, 30.0, dist) * max(max(ckw, smoothstep(1.4, 0.3, vDepth)), 0.55 * step(0.86, h21(ri + 5.5)));
  vec2 rdir = rf / max(length(rf), 1e-3), slope = eX * gs.x + eY * gs.y, slopeI = eX * gsI.x + eY * gsI.y;      // the river's slope in the world's x and z
  if (ckw > 0.0) {                                                                            // the blackwater creek lies almost still: its own wavelets, as they were
    float hc = ripH(wc), amp = (0.19 + 0.1 * uFast) / (1.0 + dist * 0.016) * 0.5 * (1.0 + 0.5 * smoothstep(45.0, 8.0, dist));
    vec2 sck = vec2(ripH(wc + vec2(e, 0.)) - hc, ripH(wc + vec2(0., e)) - hc) / e * amp;
    slope = mix(slope, sck, ckw); slopeI = mix(slopeI, sck, ckw); hA = mix(hA, hc, ckw);
  }
  vec3 N = normalize(vec3(-slope.x + 0.35 * ring * rdir.x, 1.0, -slope.y + 0.35 * ring * rdir.y));
  vec3 Ni = normalize(vec3(-slopeI.x + 0.35 * ring * rdir.x, 1.0, -slopeI.y + 0.35 * ring * rdir.y));     // (the surface as the faces seen one by one leave it)
  vec3 V = -toC / max(dist, 1e-3);
  // (a law of rough water: of the faces a pixel cannot resolve the eye sees most of those turned toward it, by tip on the mean:
  // half the slopes' variance over the cosine of the view, never more than 0.89 of their rms. Further down they take that from the
  // mirror's strength and show a sky twice that higher; they do not move the image of what stands on the banks, but for the
  // pixel's own grain at the tree line's image, further down)
  // (THE MIRROR'S SHARE LEVELS OFF AT A GRAZING EYE BY THIS, and never comes to 1. The slopes are the river's own sets': the sum
  // in lost above, 0.0135^2 + (0.04 big)^2 + (0.054 rough)^2 + (0.10 fine)^2, with big, rough and fine as the current and the
  // wind raise them: at the usual level 0.113 in the wall's lee (0.48, 0.78, 1.02), 0.132 on the open reach (0.75, 0.96, 1.17),
  // 0.08 on a boil's slick and 0.14 to 0.16 in a seam or a cat's-paw. Reckoned against the sum over every face of water's exact
  // law of reflection, each face weighted by what the eye sees of it, tip gives the same share to within 0.02 at these slopes
  // (0.04 on a slick): with 0.113 of slope the sum gives 0.52, 0.44 and 0.36 at 2, 5 and 8 degrees of dip, where flat water
  // has 0.80, 0.59 and 0.43; with 0.16 of slope 0.43, 0.38 and 0.32. And the sky such water shows is not the horizon's: the
  // mean of the light it mirrors comes from 7 to 12 degrees up by the same sum; the line further down takes it from the view's
  // dip and twice tip, 8 to 17 degrees up)
  // (tip is reckoned on the surface the faces seen one by one leave, Ni. The pixel's own sample of the faces it holds, its grain,
  // is not in it: reckoned on the grained face, tip gave back six tenths of what the grain took at a grazing eye, and the far
  // river stood smooth. The grain lies on top of tip: in the mirror's share, in the sky's height and in the body's light)
  float cv = clamp(dot(-V, Ni), 0.0, 1.0), tip = 0.5 * lost * lost / sqrt(cv * cv + 0.318 * lost * lost + 1e-6);
  vec3 R = reflect(V, N); R.y = abs(R.y) + 0.015; R = normalize(R);
  vec3 skyR = mix(uHor, uZen, pow(clamp(R.y, 0.0, 1.0), 0.45));
  vec2 cq = R.xz / max(R.y, 0.06) * 0.55 + vW.xz * 0.004;                                     // clouds in the mirrored sky
  float cl = smoothstep(0.46, 0.76, 0.6 * vn(cq + 3.0) + 0.4 * vn(cq * 2.3 + 9.0)), clY = smoothstep(0.02, 0.25, R.y);
  skyR = mix(skyR, uHor * 1.3 + 0.03, 0.75 * cl * clY);
  // the river mirrors the look's own sky: zenith, mid and horizon by the sky's own law, and its cirrus in the cirrus's own colour
  // (where a pixel spans the clouds' pattern they stand at their mean); the creek keeps the mirrored sky it had
  float inv = 1.0 - clamp(R.y + 2.0 * tip, 0.0, 1.0); vec2 fq = fwidth(cq);
  vec3 skyW = mix(mix(uSkyZ, uSkyM, pow(inv, uSkyP.y)), uSkyH, pow(inv, uSkyP.x));
  // (THE SKY BY DIRECTION: the sky's glow round the sun too, by the sky's own law and the sky's own measures of it, read off the
  // sky as it is built (uSctK.x of uSct's colour, by the power uSct.w of the half angle to the sun, uSctK.y of it at the zenith
  // and all of it along the horizon by the power uSctK.z): a face that mirrors the sky on the sun's side is the lighter, one that
  // mirrors it away from the sun the bluer. At a low eye the far river mirrors the horizon's own colour, whatever the look's sky
  // gives low down; the zenith's blue lies only on the faces tipped up to it near the lens)
  skyW = mix(skyW, uSct.rgb, clamp(uSctK.x * pow(0.5 + 0.5 * dot(R, uSunDir), uSct.w) * mix(uSctK.y, 1.0, pow(inv, uSctK.z)), 0.0, 1.0));
  skyR = mix(mix(skyW, uCir, 0.6 * clY * mix(0.25, cl, 1.0 - smoothstep(0.3, 1.0, max(fq.x, fq.y)))), skyR, ckw);
  // the forest all round: a ragged tree line, and from high above the far water takes the pale of the mist instead (never a dark ruled band)
  vec3 refl = mix(skyR, uGreen, 0.85 * (1.0 - mix(0.7, 0.97, hiK) * smoothstep(110.0, mix(300.0, 230.0, hiK), dist)) * smoothstep(0.26, 0.04, R.y + 0.05 * (hA - 0.5) + 0.12 * (vn(R.xz / max(length(R.xz), 1e-3) * 5.0 + vW.xz * 0.004) - 0.5)));
  // THE BANKS STAND IN THE RIVER, by the place alone: the mirrored ray is carried, in the river's own frame, to the forest line of
  // the bank it is heading for (uBank: each bank's line and its canopy's height, read off the land every 40 m along the river; the
  // look-up is made twice, the second time at the place along the river the ray comes ashore). The tree walls step up from three
  // tenths of the canopy's height at the line to all of it 28 m in, so the ray stands in the trees if it is under either; the crown
  // line is ragged by 14 m and 4 m crowns (4.5 m and 2.2 m of height: typed copies of the two heights of relief in the canopy
  // shell's own law, shellY, which gives them to swells 83 m and 22 m long; here they stand on single crowns). Below it the image is the
  // forest's own dark, with the lit green of the crowns in its upper part on the side the sun is on, hazed by the way the light has
  // come. Where a bank is known the old band above it gives way to the sky again, so there is one tree line, not two; where none is
  // known (a ray that runs on down the river past 400 m, or toward the wall) the old band stands as it did
  // (THE IMAGE'S RAY. The sky above was taken along the ray of the face the pixel shows, grain and all; that ray is kept as Rg
  // for the sun's image further down. The banks, the kapoks and the wall are looked up along the ray mirrored by the faces
  // seen one by one, Ni, as they were: R from here to the mist's line. mg: how much steeper the pixel's own face sends its ray
  // than that, the rise per metre run; by it the pixel's ray clears the tree line or meets it, so the forest's image ends in
  // streaks of sky and of trees, as a tree line does in rippled water, and not in one soft edge)
  vec3 Rg = R; R = reflect(V, Ni); R.y = abs(R.y) + 0.015; R = normalize(R);
  float rxz = max(length(R.xz), 1e-3), msl = R.y / rxz, sg = step(0.0, dot(R.xz, eX)); vec2 rb = vec2(dot(R.xz, eX), dot(R.xz, eY)) / rxz;
  float rbx = (2.0 * sg - 1.0) * max(abs(rb.x), 0.02), bs = clamp((sAl + 360.0) / 40.0, 0.0, 22.999); int bi = int(bs);
  vec4 bk = mix(uBank[bi], uBank[bi + 1], bs - float(bi)); float tb = max((mix(-bk.y, bk.x, sg) - bA) / rbx, 0.0);
  bs = clamp((sAl + rb.y * tb + 360.0) / 40.0, 0.0, 22.999); bi = int(bs); bk = mix(uBank[bi], uBank[bi + 1], bs - float(bi)); tb = max((mix(-bk.y, bk.x, sg) - bA) / rbx, 0.0);
  float sH = sAl + rb.y * tb, bkh = mix(bk.w, bk.z, sg); vec2 fsh = vec2(fwidth(sH));
  float cr1 = mix(0.5, vn(vec2(sH * 0.07, 3.0 + 9.0 * sg)), seen(fsh, vec2(0.07))), cr2 = mix(0.5, vn(vec2(sH * 0.23, 11.0 + 9.0 * sg)), seen(fsh, vec2(0.23)));
  float mg = Rg.y / max(length(Rg.xz), 1e-3) - msl;
  float top = bkh + 4.5 * (cr1 - 0.5) + 2.2 * (cr2 - 0.5) - vW.y, yb = msl * (tb + 28.0 / abs(rbx)), be = min(yb + mg * (tb + 28.0 / abs(rbx)) - top, (msl + mg) * tb - 0.3 * top), bwy = fwidth(yb) + 0.3;
  float known = (1.0 - smoothstep(250.0, 400.0, tb)) * smoothstep(4.0, 12.0, bkh) * (1.0 - ckw), bankK = known * (1.0 - smoothstep(-bwy, bwy, be));
  // (uBankL, uBankS: the crowns' own green in the look's sun and in its shade. A crown shows the mirror the side it turns to the
  // water: lit where the ray runs against the sun; the trunks and the understorey under the crowns are the darker half. bsun: the
  // cosine between the mirrored ray and the sun's bearing. By the crowns' own law of light (the sun wrapped 0.32 round a leaf
  // cushion, squared) the faces of round crowns turned to the eye are lit 0.43 in the mean with the sun behind the eye, 0.22 with
  // it abeam and 0.01 against it: 0.22 + 0.21 bsun)
  float bsun = -dot(R.xz, uSunDir.xz) / (rxz * max(length(uSunDir.xz), 1e-3)), bv = clamp(yb / max(top, 1.0), 0.0, 1.0);
  vec3 bankC = mix(uBankS * mix(0.45, 1.0, smoothstep(0.1, 0.5, bv)) * (0.7 + 0.6 * cr2), uBankL, (0.22 + 0.21 * bsun) * smoothstep(0.3, 0.75, bv) * (0.5 + cr1));
  // (the image's light has come through the look's haze from the bank to the water and on to the eye: tb + dist metres. The fog
  // laid on the water itself takes dist of it; what is left for the image is tb * (tb + 2 dist) in the haze's own law. The same
  // for the kapoks and for the wall)
  bankC = mix(bankC, uHaze.rgb, 1.0 - exp(-uHaze.w * uHaze.w * tb * (tb + 2.0 * dist)));
  refl = mix(refl, skyR, known);
  // (the two kapoks stand over the canopy: each crown a flattened dome on its bole, where they stand in the world and as high;
  // the tree line in front covers what of them is under it)
  for (int i = 0; i < 2; i++) {
    vec2 ox = vW.xz - uKap[i].xy; float tt = max(-dot(ox, R.xz) / (rxz * rxz), 0.0), td = length(ox + R.xz * tt), tw = fwidth(td) + 0.15;
    vec3 ko = vec3(ox.x, (vW.y - uKap[i].z) * uKapV[i], ox.y), kd = vec3(R.x, R.y * uKapV[i], R.z); float kt = max(-dot(ko, kd) / dot(kd, kd), 0.0);
    vec3 kp = ko + kd * kt; float kr = length(kp), kw = fwidth(kr) + 0.4, kR = uKap[i].w * (0.92 + 0.08 * sin(9.0 * atan(kp.z, kp.x) + 0.3 * kp.y));
    float kz = (1.0 - ckw) * step(1e-3, kt), boleK = kz * (1.0 - smoothstep(uKapT[i] - tw, uKapT[i] + tw, td)) * step(vW.y + R.y * tt, uKap[i].z), domeK = kz * (1.0 - smoothstep(kR - kw, kR + kw, kr));
    vec3 kapC = mix(vec3(0.2, 0.19, 0.15) * (uAmb + 0.4 * uSunCol), mix(uBankS, uBankL, 0.5 + 0.5 * dot(kp / max(kr, 1.0), uSunDir)), domeK);
    refl = mix(refl, mix(kapC, uHaze.rgb, 1.0 - exp(-uHaze.w * uHaze.w * kt * (kt + 2.0 * dist))), max(boleK, domeK));
  }
  refl = mix(refl, bankC, bankK);
  // the cliff, mirrored about the water's level: the reflected ray is carried to the wall's own face (a plane that leans back from
  // its foot as the wall does: z = uWall.x - uWall.y * y) and what stands there is looked up: hit, at the wall's whole height. The
  // ripples' slopes are in R already: every ripple the pixel resolves moves the look-up, so the image is broken, not blurred; where
  // the look-up moves by more than a bed in one pixel (fhy, fhx: its footprint on the wall) the wall stands at its mean colour
  float tzd = R.z + uWall.y * R.y, tz = clamp((uWall.x - uWall.y * vW.y - vW.z) / min(tzd, -1e-3), 0.0, 600.0); vec3 hit = vW + R * tz;
  float fhy = fwidth(hit.y), fhx = fwidth(hit.x);
  float gx = clamp((hit.x + 150.0) * (47.0 / 300.0), 0.0, 46.999); int gi = int(gx); vec4 gul = mix(uGul[gi], uGul[gi + 1], gx - float(gi));
  float ch = gul.w, toward = step(tzd, -0.01) * smoothstep(156.0, 146.0, abs(hit.x));       // (ch: the rim's own height there)
  float rimN = vn(vec2(hit.x * 0.09, 7.0)), rimF = ch + 5.0 + 9.0 * rimN;                     // the forest on the rim: crowns 5 to 14 m over the lip
  // (the wall upside down: its beds as stripes of red clay, ochre and grey, its gullies in shadow, its foot dark, the forest's
  // fringe along its lip, and the birds on it as flecks of blue, scarlet and gold, all torn sideways by the ripples)
  // (its beds are the wall's own: the same law of height, the same hash and seed, the wall's clay, ochre and grey)
  float qx = hit.x + 0.6 * hit.z, hh = hit.y + 0.012 * hit.x + 1.5 * wN(vec2(qx * 0.045, hit.y * 0.22)), hb = hh * 0.36 + uWall.z;
  float bandR = mix(wH1(floor(hb)), wH1(floor(hb) + 1.0), smoothstep(0.74, 1.0, fract(hb))), fb = 0.36 * fwidth(hh), ty = hit.y - vW.y;
  vec3 cc = mix(uWallC, uWallO, smoothstep(0.55, 0.85, bandR));
  cc = mix(cc, uWallG, smoothstep(0.86, 0.96, bandR) * (1.0 - 0.6 * smoothstep(9.0, 3.0, ty)));
  cc = mix(cc, uWallC * vec3(0.66, 0.6, 0.62), smoothstep(0.22, 0.04, bandR));
  cc *= 1.0 + 0.24 * (wH1(floor(hh * 3.1)) - 0.5) * (1.0 - smoothstep(0.03, 0.1, fb));
  cc = mix(mix(mix(uWallC, uWallO, 0.3), uWallG, 0.08), cc, 1.0 - smoothstep(0.3, 0.9, fb));
  // (the wall's lines, by the wall's own laws: its hard beds stand out as ledges 1.6 m apart with a line of shadow 0.2 m deep
  // under each, and the hollows the birds have dug lie dark in it, one to two metres across; each fades before the look-up could
  // skip it)
  float bc = hit.y * 0.62 + 0.9 * wN(vec2(qx * 0.035, hit.y * 0.2 + 7.0)), bcf = fract(bc), fbc = fwidth(bc);
  cc *= 1.0 - 0.45 * step(0.42, wH1(floor(bc) + 5.0)) * smoothstep(0.0, 0.03 + fbc, bcf) * (1.0 - smoothstep(0.11, 0.14 + fbc, bcf)) * (1.0 - smoothstep(0.1, 0.35, fbc));
  vec2 hc2 = vec2(qx / 3.4, hit.y / 2.6), hi2 = floor(hc2), hf2 = fract(hc2) - 0.5 - 0.3 * (vec2(wH(hi2 + 3.1), wH(hi2 + 7.7)) - 0.5);
  cc *= 1.0 - 0.6 * step(0.6, wH(hi2 + 9.9)) * (1.0 - smoothstep(0.3, 1.0, length(hf2 * vec2(3.4, 2.6)) / (0.5 + 0.6 * wH(hi2 + 1.3)))) * (1.0 - smoothstep(0.25, 0.6, max(fwidth(hc2.x), fwidth(hc2.y))));
  // its light is the wall's own: the baked shadows of its gullies (uGul, at three heights), the rain flutes three metres apart
  // raked by the sun, the far bank's shadow line, the warm bounce in the gullies, the damp dark foot; then the look's haze over
  // the way the light has come
  float f0 = abs(wN(vec2(qx * 0.31, hit.y * 0.045 + 3.0)) * 2.0 - 1.0), f1 = abs(wN(vec2(qx * 0.31 + 0.155, hit.y * 0.045 + 3.0)) * 2.0 - 1.0);
  float flute = mix(1.0, clamp(1.0 - uWall.w * (f1 * (2.0 - f1) - f0 * (2.0 - f0)), 0.25, 1.7), 1.0 - smoothstep(0.3, 0.9, 0.31 * fhx));
  float vy = clamp(hit.y / max(ch, 1.0), 0.0, 1.0), vis = mix(mix(gul.x, gul.y, clamp((vy - 0.2) / 0.3, 0.0, 1.0)), gul.z, clamp((vy - 0.5) / 0.3, 0.0, 1.0));
  float sunL = smoothstep(uShadowY - 1.5, uShadowY + 3.0, hit.y + 1.2 * sin(hit.x * 0.11) + 0.8 * sin(hit.x * 0.37 + 1.3));
  cc *= (uWallA + sunL * mix(uWallB, uWallL * flute, smoothstep(0.3, 0.62, vis))) * mix(0.37, 1.0, smoothstep(0.2, 2.4, ty));       // (a gully's shadow has one clear edge, as on the wall)
  float whz = 1.0 - exp(-uHaze.w * uHaze.w * tz * (tz + 2.0 * dist)); cc = mix(cc, uHaze.rgb, whz);
  vec2 bq = vec2(hit.x / 2.3, hit.y / 1.6), bqi = floor(bq), bqf = fract(bq) - 0.5; float bh = h21(bqi + 4.7), hv = hit.y / max(ch, 1.0);
  float fleck = step(0.6, bh) * smoothstep(0.44, 0.2, length(bqf * vec2(1.0, 0.8))) * smoothstep(0.34, 0.5, hv) * (1.0 - smoothstep(0.86, 0.96, hv)) * smoothstep(135.0, 110.0, abs(hit.x))
    * smoothstep(0.35, 0.65, vn(vec2(hit.x * 0.03 + 9.0, 1.5))) * uBirdK * (1.0 - smoothstep(0.45, 1.1, max(fwidth(bq.x), fwidth(bq.y))));
  cc = mix(cc, bh > 0.88 ? vec3(0.75, 0.5, 0.03) : (bh > 0.76 ? vec3(0.62, 0.03, 0.02) : vec3(0.03, 0.14, 0.52)) * 1.3, 0.9 * fleck);
  // (over its lip the forest on the rim, lit as the banks' crowns are; the wall and its forest hide the sky behind them up to the
  // crowns' own ragged line, and the sky stands under that)
  // (the rim's forest stands as far off as the wall under it and its image comes through the same haze, whz: it had none, and
  // in the hazier looks the unlit crowns stood in the river as a black-green blot where the wall under them was pale)
  cc = mix(cc, mix(mix(uBankS, uBankL, 0.42 * smoothstep(ch + 1.0, ch + 6.0, hit.y) * (0.5 + rimN)), uHaze.rgb, whz), smoothstep(ch - 0.5 - fhy, ch + 0.5 + fhy, hit.y));
  // (a wall hides the sky behind it whole, in every look: what a look's air takes of its image is the haze on the light's way
  // above, by the look's own fog and the metres, and the river's mist below, by the mist's own measures and the metres; the look's
  // old measure of the wall's image, uCliffR, is no longer read)
  float cliffK = toward * (1.0 - smoothstep(rimF - 1.0 - fhy, rimF + 1.0 + fhy, hit.y)) * (1.0 - ckw);
  refl = mix(refl, cc, cliffK);
  // THE RIVER'S MIST IN THE MIRRORED LIGHT. A bank of mist lies on the river, from the water up to uMistL.x (the top of the band
  // the mist's puffs are laid in). The mirrored light crosses it twice: from the thing mirrored down to the water, and from the
  // water to the eye. mh: the mist's depth over this water. The leg from the thing mirrored runs in the mist along the mirrored
  // ray R until the ray climbs out of the top or meets the bank or the wall, whichever is nearer; the leg from the water to the
  // eye runs in it for all its length if the eye is under the mist's top, else for mh over the sine of the view's dip. mleg: the
  // metres of mist on both legs. Each metre takes uMistL.y of the light and gives the mist's own colour for it (uMistC), as the
  // mist's puffs do to what is seen through them: the same law in every look, by the look's own mist alone (where a look has
  // few puffs the image is clear). The water's own body is not veiled here: the mist's puffs are drawn over it as they were
  // (where it is the sky that is mirrored, the light comes down the lifted way, twice tip steeper, as the sky's colour is taken:
  // the faces the eye sees send it up out of the mist sooner than a level face would)
  float mh = max(uMistL.x - vW.y, 0.0), mleg = min(mh / (R.y + 2.0 * tip * (1.0 - max(bankK, cliffK))), mix(mix(600.0, tb / rxz, bankK), tz, cliffK)) + min(dist, mh / max(-V.y, 1e-4));
  refl = mix(refl, uMistC, (1.0 - exp(-uMistL.y * mleg)) * (1.0 - ckw)); R = Rg;
  // the creek is a mirror of its gallery: a slot of bright sky along its axis between two walls of forest (wider over the light
  // well), sunlit crown tops along the slot's edges, trunks as paler and darker streaks below them
  float rl = max(length(R.xz), 1e-3), el = R.y / rl, az = dot(R.xz / rl, uCk.xy);
  float well = smoothstep(62.0, 26.0, distance(vW.xz, uCk.zw));
  float skyline = mix(0.1 + 2.1 * abs(az), 0.35 + 0.5 * abs(az), well) + 0.34 * (vn(vec2(az * 6.5 + 2.0, 0.5)) - 0.5) + 0.12 * (vn(vec2(az * 23.0, 4.0)) - 0.5);
  float gapK = smoothstep(skyline - 0.05, skyline + 0.16, el), tops = smoothstep(skyline - 0.75, skyline - 0.04, el) * (1.0 - gapK);
  float trunk = vn(vec2(az * 46.0, 1.0)), trunk2 = vn(vec2(az * 17.0 + 5.0, el * 1.5));
  vec3 wall = uGreen * (0.45 + 0.9 * trunk2) + vec3(0.2, 0.19, 0.15) * uAmb * smoothstep(0.62, 0.8, trunk) * (1.0 - tops);
  wall = mix(wall, uLeafLit * (0.6 + 0.6 * trunk2), 0.75 * tops * smoothstep(-0.2, 0.5, 0.25 - az * dot(uSunDir.xz, uCk.xy)));
  refl = mix(refl, mix(wall, skyR * 1.06, gapK), ckw);
  float cosv = clamp(dot(-V, N), 0.0, 1.0);
  // the river is water: 2 percent of the mirror seen straight down, all of it at the grazing distance (Schlick's law for water,
  // on the angle between the view and the ripple's own face; averaged over the faces a pixel cannot resolve, which turn toward the
  // eye by tip, so that ruffled water never comes to the full mirror at the grazing distance: at low water three quarters of it
  // in the wall's lee, two thirds on the open reach, a half in a cat's-paw). The creek keeps the law it had
  float fres = mix(0.02 + 0.98 * pow(1.0 - min(cosv + tip, 1.0), 5.0), 0.05 + 0.95 * pow(1.0 - cosv, 2.0), ckw);
  // THE SHORE. What the water knows of its bank is its own depth (dep, metres: the level less the land's height, at the grid's
  // posts 10 m apart). depL: the depth as the wavelets leave it, the finest set's height (0.088 m at full) riding on it by the
  // surface's own height hA, so the waterline moves in and out with them. bedS: the bed's slope, the depth's rise over the
  // ground (from the pixel's own differences, held between a fiftieth and one); shore: the metres out from the waterline; pfs:
  // the metres of that one pixel spans
  float depL = dep + 0.088 * fine * (hA - 0.5);
  vec2 dWx = dFdx(vW.xz), dWy = dFdy(vW.xz); float ddx = dFdx(dep), ddy = dFdy(dep), det = dWx.x * dWy.y - dWx.y * dWy.x;
  float bedS = clamp(length(vec2(ddx * dWy.y - ddy * dWx.y, ddy * dWx.x - ddx * dWy.x)) / max(abs(det), 1e-9), 0.02, 1.0), shore = depL / bedS, pfs = (abs(ddx) + abs(ddy)) / bedS + 1e-3;
  float st = mix(mix(mix(0.5, vn(vec2(sc.x * 0.42 + 3.0, sc.y * 0.045)), seen(fs, vec2(0.42, 0.045))), 0.2 + 0.6 * vn(vW.xz * 0.55 + 3.0), 0.8 * nearS), 0.5, ckw), st2 = mix(vn(vec2(sc.x * 0.11, sc.y * 0.02 + 9.0)), 0.5, ckw);
  // (A MARK ON THE WATER'S BODY IS A FEW HUNDREDTHS OF ITS TONE. The current's threads, the plumes, the tongues of paler and
  // of darker silt and the cat's-paw each took a fifth to four tenths off the body or put it on, and where they met the body
  // stood between a third and twice its tone: drawn out along the current and seen from a low eye, that is a dark smear
  // many times as long as wide (LIVE drew the plumes far off only and hid the rest under a quarter of sky). Silt in a river is mixed by the same
  // turbulence that holds it up: a thread or a plume is the same water a little thicker or thinner. So each mark keeps
  // its place and shape and makes 2 to 5 hundredths; together they spread the body's tone by 3 hundredths where they
  // spread it by 19 (reckoned over the noise). The marks' old mean on the look's usual water, 0.97 of the silt, is kept:
  // that is the 0.918 in 0.9226 + 0.055 st + 0.037 st2. The creek, which has no marks, keeps its 1.055)
  vec3 body = mix(uSilt, uBlack, vFlow.z) * mix(0.9226 + 0.055 * st + 0.037 * st2, 1.055, ckw);
  // (THE SILT A RIVER IN SPATE CARRIES. The look's water colour is the river at its usual current, 2.3 m/s. The load a
  // current holds up goes as the square of its speed (its pull on the bed), so a river running faster carries (v / 2.3)^2
  // of the usual load: sl, 3.6 at 4.4 m/s; a slower one drops silt, which the plumes below show, so sl is never under 1.
  // More of the same silt in the same stained water takes the body from its own colour toward the silt's own, the bar's
  // wet sand uBed, by the law of a scatterer in an absorbing water: a = uBed * sl / (sl + uBed / a0 - 1), which is a0 at
  // sl = 1 and uBed for a river of mud. ITS MEASURE: at 4.4 m/s the body's albedo goes from 0.108 to 0.18, the day's is
  // 0.172; in all the light that enters after rain it then shows at 61 of 255 where the day's shows at 64, and at 23
  // without it: black, under the light's whole measure, in the grade's toe. It is laid before the chroma is taken off, so
  // the body's red to blue is 1.54 where the day's is 1.85: not warmer than the day's; and it reads the current's one
  // speed, the same over the whole river: no patch comes of it. Up to 2.3 m/s nothing changes; the creek keeps its body)
  float sl = max(vc / 2.3, 1.0); sl *= sl; body = mix(uBed * sl / (sl + uBed / max(body, vec3(1e-3)) - 1.0), body, ckw);
  // (the look's water colour is a colour of the picture; the picture's grade deepens a brown, so the river's body gives its silt
  // back with part of its chroma taken off. How much, reckoned through the grade's own curve in the day look's light: the
  // table's brown has 2.3 of red to 1 of blue on the screen; with four tenths off the body showed 3.4 to 1 (96, 55, 28), a red
  // brown that turns mauve under the least share of sky; with 0.57 off it shows 2.2 to 1 (89, 58, 40), at the same brightness)
  body = mix(body, vec3(dot(body, vec3(0.3, 0.55, 0.15))), 0.57 * (1.0 - ckw));
  // from high above the brown water is marbled: long plumes of paler silt drawn out by the current
  float farK = smoothstep(70.0, 220.0, dist) * (1.0 - ckw);
  // (the plumes are the water's own, at one weight wherever the eye is: the current stirs the silt up, so they stand whole at the
  // river's usual 2.3 m/s and above and in proportion on slower water, where the silt settles; none on the still creek)
  float plume = min(vc / 2.3, 1.0) * (1.0 - ckw);
  body *= mix(1.0, 0.98 + 0.08 * vn(vec2(sc.x * 0.05 + 1.0, sc.y * 0.009)), plume);                // (a plume: 4 hundredths either way; it was 4 tenths)
  // (silt marbles the river in two tones with edges that can be read: tongues of paler silt and of darker water, each drawn out
  // 150 m by 30 m by the current, wound by the current's own threads, their edges 2 to 3 m wide)
  float marb = vn(sc * vec2(0.034, 0.0065) + 40.0 + vec2(1.2 * st2, 0.0)) + 0.25 * (vn(sc * vec2(0.13, 0.02) + 3.0) - 0.5);
  // (a tongue is a tenth of the way to the bar's silt, or 4 hundredths darker: it was 0.78 of the way, which on any river
  // darker than its bar read as a streak of sand lying in the water, and 0.24 darker)
  body = mix(body, uSand * 0.9, 0.10 * plume * smoothstep(0.54, 0.62, marb)) * (1.0 - 0.04 * plume * (1.0 - smoothstep(0.34, 0.42, marb)));
  // DARKER THAN THE SAND, BY OPTICS. What the silt scatters back is seen through the water's surface: the light goes down through
  // it (0.98 of it, by the law of water) and of what the silt sends up from below only the part inside the cone of 48 degrees
  // gets out, one part in n * n (n = 1.34, water's index), again at 0.98: 0.98 * 0.98 / (1.34 * 1.34) = 0.535 of what the same
  // silt would show dry; the rest of the upward light the surface turns back down (0.48 of it, for light from all sides below
  // water's surface), where the silt scatters it up again, so a paler silt loses a little less. THE SHALLOWS: where the water is
  // thin the bar's own sand (uBed) is seen through it, by the same surface; the silt hides the bed by the depth, its sight
  // falling to 1 / e in 0.05 m (a quarter of the 0.2 m at which a white disc is lost in a river as silty as this), so off a
  // bar that falls one in thirty the water pales over a metre or two. The creek keeps the body it had
  vec3 wet = mix(uBed, body, 1.0 - exp(-max(depL, 0.0) / 0.05));
  body = mix(0.535 * wet / (1.0 - 0.48 * wet), mix(uSand, body, smoothstep(0.0, 1.0, vDepth)), ckw);
  // sun that finds its way down through the canopy: warm pools on the dark water, glinting
  float dap = smoothstep(0.56, 0.78, vn(vW.xz * 0.075 + 3.0)) * smoothstep(0.32, 0.7, vn(vW.xz * 0.27 + 9.0 + 0.04 * uTime)) * ckw;
  // the low sun: the forest on the sunward bank lays a long ragged shadow over the water under it
  float shade = smoothstep(0.3, 0.7, vShade + 0.4 * (vn(vW.xz * 0.11 + 5.0) - 0.5) + 0.2 * (vn(vW.xz * 0.37 + 9.0) - 0.5)) * (1.0 - ckw) * (1.0 - 0.9 * hiK * smoothstep(110.0, 190.0, dist)), sunK = uSunVis * (1.0 - 0.88 * shade);
  // the light on the water's body. The look's water colour is the river as the sun shows it, so the river takes the light's
  // strength and a sixth of its hue: brown water under an orange sun is not multiplied to red, and in the far bank's shadow
  // it keeps a little of the sky's blue (a deep umber). The creek is lit as it was
  // (THE PLACE'S OWN SHADE for what is new on the water: the far bank's forest shadow as the water's grid has it, with the same
  // ragged edge, and the look's own sun; nothing of the eye is in it. shP, sunP)
  float shP = smoothstep(0.3, 0.7, vShade + 0.4 * (vn(vW.xz * 0.11 + 5.0) - 0.5) + 0.2 * (vn(vW.xz * 0.37 + 9.0) - 0.5)) * (1.0 - ckw), sunP = uSunVis * (1.0 - 0.88 * shP);
  // (the body's light is the place's own: the far bank's forest hides the sun from the water, by shP, and not the sky, so the
  // sky's light, uAmb, is whole in its shadow (a quarter of it was taken off there, and the shadowed river went black); and no
  // part of it leans on the eye's height any more. On the creek it is what it was)
  // (THE SKY'S FILL ON THE RIVER is the sky's own: level water under the open dome takes the dome's mean, each height of the
  // sky weighed by its sine, by the sky's own law of zenith, mid and horizon and its own two powers: for a power p the sum
  // is 2 / ((p + 1)(p + 2)). That is 0.30 of the light's measure by day, 0.37 at dawn, 0.31 in the golden look and 0.41
  // after rain, where the look's ambient, which does not know the sky's own brightness, has 0.27, 0.25, 0.22 and 0.26: the
  // shadowed river after rain stood at two thirds of its fill. The strength is the dome's; the hue stays the ambient's own,
  // which holds the banks' warm bounce. The creek, under its gallery, keeps the ambient it had)
  float ia = 2.0 / ((uSkyP.x + 1.0) * (uSkyP.x + 2.0)), ib = 2.0 / ((uSkyP.y + 1.0) * (uSkyP.y + 2.0)), iab = 2.0 / ((uSkyP.x + uSkyP.y + 1.0) * (uSkyP.x + uSkyP.y + 2.0));
  float fill = dot(uSkyZ + (uSkyM - uSkyZ) * (ib - iab) + (uSkyH - uSkyZ) * ia, vec3(0.3, 0.55, 0.15)) / dot(uAmb, vec3(0.3, 0.55, 0.15));
  vec3 lit = uAmb * mix(fill, 1.0, ckw) + uSunCol * (sunP * (0.13 + 0.5 * max(dot(N, uSunDir), 0.0)) + 0.55 * dap);
  // (THE RIVER LIES BESIDE ITS SANDBAR UNDER THE SAME SUN. The look's measure uSunVis dims the sun's image and its glints on the
  // water; the sand beside the river takes the look's sun whole, and the light the silt scatters back is lit as the sand is: so
  // the river's body takes the part of the sun the measure held back as well (how, in the next note). In the day look the
  // measure is 1 and nothing is added. And a ripple's sun side is the lighter side of silty water, its far side the darker,
  // by the cosine law: the 0.13 that level water takes of the sun's beam whatever its height turns with the face too, as
  // the face's cosine to the sun over the level's)
  // (ALL THE LIGHT THAT ENTERS THE WATER. The silt gives back its own colour times all of it: the sky's dome (the fill above)
  // and the sun. Of the sun the look's own measure uSunVis is the part that comes as a beam: that part the far bank's forest
  // shades, and a ripple's face turns to it. The rest, 1 - uSunVis, the look's veil has spread into a flat light: it comes
  // from the whole bright sky round the sun, no tree line shades it and no face turns to it or away, so the water takes it
  // at the level's strength wherever it lies. It had been shaded with the beam and turned with the face: after rain, where
  // 0.85 of the sun is flat, the river in the far bank's shadow had 0.45 of light (dome 0.41 and sun 0.38, as the body
  // takes them) where 0.74 enters, and 0.79 in the open; the day's open river has 0.84. In the day look the measure is 1,
  // all the sun is beam, and nothing changes)
  lit = max(lit + uSunCol * (1.0 - ckw) * ((1.0 - uSunVis) * (0.13 + 0.5 * uSunDir.y) + sunP * 0.13 * (dot(N, uSunDir) / uSunDir.y - 1.0)), 0.0);
  // (THE FILL'S TINT. Light that is not the sun's beam has the colour of where it comes from. In the far bank's shadow that
  // is the sky (the mid sky's hue, the mean of the dome over a level face) and the leaves of the bank that shades it: a wall
  // of forest 40 degrees high along one side fills 0.5 sin2 40 = 0.21 of a level face's dome, so a fifth of the tint there
  // is the lit leaves' own: cool blue-green from sky and leaves, and dark, never a red black. In the open the part of the
  // sun the look's veil has spread flat, 1 - uSunVis, comes from the sky as well and has the sky's hue: its share is the
  // tint's weight there (a level: the look's own measure). In the day look in the sun the weight is 0 and nothing changes)
  vec3 lw3 = vec3(0.3, 0.55, 0.15); float litL = dot(lit, lw3);
  vec3 litR = mix(mix(vec3(litL), lit, 0.15), litL * mix(uSkyM / dot(uSkyM, lw3), uBankL / dot(uBankL, lw3), 0.2 * shP), max(shP, 1.0 - uSunVis));
  vec3 col = body * mix(litR, lit, ckw) * mix(0.88 + 0.26 * cat, 0.78 + 0.46 * cat, farK) * (1.0 - 0.05 * paw * lee * (1.0 - ckw));      // (inside a cat's-paw the brown is a twentieth darker, to its crisp edge: a mark of a few hundredths, as all marks on the body; the ruffled water is told by its ripples and its sheen; it was a sixth; no paw strikes in the wall's wind shadow)
  // (THE MIRROR'S SHARE IS THE LAW OF WATER AND NOTHING ELSE: fres, on each ripple's own face: 2 hundredths seen straight down,
  // rising steeply toward the grazing view, the same in every look. So a face is either mostly the dark body or mostly the image,
  // and the crested ripples flip between the two at their crest lines. The creek keeps the share it had)
  col = mix(col, refl, mix(fres, clamp(fres, 0.0, 0.92) * 0.94, ckw));
  col += uSunCol * dap * (0.035 + 0.5 * smoothstep(0.8, 0.95, vn(wc * 5.0 + uTime * vec2(0.5, -0.3))) * smoothstep(90.0, 20.0, dist));
  // flow lines: long soft streaks drawn out by the current, wound into slow eddies; scum and foam flecks ride in them
  vec2 ec = sc * vec2(0.06, 0.028), ei = floor(ec), ef = fract(ec) - 0.5; float er = length(ef), ea = atan(ef.y, ef.x + 1e-5), swirl = step(0.86, h21(ei + 7.3)) * smoothstep(0.46, 0.1, er);
  // (two lines in five are there at all, each with its own width and strength, and they wander 8 m from side to side: a few
  // irregular lines with clear mirror between them, never a fan of ruled dashes)
  // (and each wanders with the flow: the flow's noise at 9 m of length bends it 1 to 3 m from side to side, neighbours together,
  // as the current's threads carry foam: not a ruled line, from whichever side it is seen)
  float lineC = sc.x * 0.42 + 4.0 * st2 + 2.2 * vn(vec2(sc.x * 0.045 + 5.0, sc.y * 0.011)) + 2.4 * mix(0.5, vn(vec2(sc.x * 0.07 + 9.0, sc.y * 0.11)), seen(fs, vec2(0.07, 0.11))) + swirl * (2.0 * ea + 9.0 * er - uTime * 0.25), lid = floor(lineC), ln = abs(fract(lineC) - 0.5) * 2.0;
  float lh = h21(vec2(lid, 3.7)), lw = mix(0.22, 0.75, h21(vec2(lid, 9.1)));
  // (each line has a clean edge one pixel soft and is broken along its length into flecks 0.4 m by 2 m and 0.25 m by 0.5 m with
  // clean edges too; lpx, wB, wC: the pixel's footprint in the line's and the flecks' own measures. A line finer than a pixel is gone)
  float lpx = 0.84 * fs.x + 0.01, wB = clamp(1.2 * max(2.5 * fs.x, 0.5 * fs.y), 0.04, 0.5), wC = clamp(1.2 * max(4.0 * fs.x, 2.0 * fs.y), 0.05, 0.5);
  float pB = mix(0.5, vn(vec2(sc.x * 2.5, sc.y * 0.5 + 4.0)), seen(fs, vec2(2.5, 0.5))), pC = mix(0.5, vn(sc * vec2(4.0, 2.0) + 11.0), seen(fs, vec2(4.0, 2.0)));
  float streak = step(0.6, lh) * (0.45 + 0.55 * fract(lh * 7.3)) * (1.0 - smoothstep(0.4 * lw - lpx, 0.4 * lw + lpx, ln)) * smoothstep(0.45 + 0.2 * fract(lh * 29.3), 0.53 + 0.2 * fract(lh * 29.3), vn(vec2(sc.x * 0.9 + 3.0, sc.y * (0.05 + 0.15 * fract(lh * 13.7)) + lid * 3.1))) * smoothstep(0.42 - wB, 0.42 + wB, pB) * (1.0 - smoothstep(1.0, 2.6, lpx));
  // (a foam line is a thread of flecks: 0.2 to 0.7 m wide, drawn out along the current in runs of unequal length with clean ends
  // (each line has its own measure of run, 5 to 20 m, and its own share of its length that carries foam, a sixth to a half),
  // broken by the 2 m flecks and thinned to a quarter between the small ones. The current beats the foam up: a thread covers a
  // ninth of its water for each m/s of current, to a half at most (a level: a quarter at the river's usual 2.3 m/s, where
  // LIVE's soft lines covered a third at most; at a third per m/s the threads stood at three quarters and read from a low
  // eye as long pale dashes laid on the water); the look's foam measure uFoamK is read once, by the soft foam of the
  // shallows as it was)
  float fline = streak * (0.25 + 0.75 * smoothstep(0.46 - wC, 0.46 + wC, pC)) * (1.0 - ckw);
  // (the foam's own touch of sun, 0.08 in live's line below, RIDES on live's sunK (which holds hiK))
  float foam = smoothstep(0.5, 0.06, vDepth) * (0.3 + 0.7 * vn(vW.xz * 1.3 + uTime * 0.3)) * 0.6;
  col = mix(col, mix(body * (uAmb + 0.2) * 1.9, uHor * 0.85, 0.45) + uSunCol * sunK * 0.08, clamp(foam, 0.0, 1.0) * uFoamK);
  // (the line above is live's own again, character for character: live's foam alone takes the sun through live's sunK. THE
  // THREADS, which are new, have this line of their own: the same pale foam, their touch of sun by the place's own shade, sunP)
  col = mix(col, mix(body * (uAmb + 0.2) * 1.9, uHor * 0.85, 0.45) + uSunCol * sunP * 0.08, fline * min(0.11 * vc, 0.5));
  // (THE SHORELINE: a hair of foam where the river meets the sand, from the waterline out to hw metres (0.05 to 0.3 m, changing
  // every metre along the shore), there along two thirds of the shore in runs of a few metres, moving in and out with the
  // wavelets as the waterline does; where it is finer than the pixel it keeps its share of the pixel and no more. Foam stained
  // by the silt gives back six tenths of the sky's light and the sun's on level water)
  float hw = mix(0.05, 0.3, vn(vW.xz * 0.9 + 31.0));
  float hair = (1.0 - smoothstep(hw - pfs, hw + pfs, shore)) * smoothstep(0.35, 0.5, vn(vW.xz * 0.31 + 57.0)) * min(1.0, hw / pfs) * (1.0 - ckw);
  col = mix(col, 0.6 * (uAmb + uSunCol * (1.0 - 0.88 * shP) * uSunDir.y), 0.85 * hair);
  vec2 cell = sc * vec2(0.5, 0.42), ci = floor(cell), cf = fract(cell) - 0.5 - 0.3 * (h22(ci + 3.1) - 0.5);        // drifting leaves
  // (a fallen leaf of the big-leaved trees, 0.77 m long and 0.48 m wide, pointed at both ends, each lying its own way round, at
  // every distance; lpw: the pixel in metres. One too small for the pixel is gone)
  float la = 6.283 * h21(ci + 1.7), lpw = max(fs.x, fs.y) + 0.01; vec2 lq = cf * vec2(2.0, 2.38); lq = vec2(lq.x * cos(la) - lq.y * sin(la), lq.x * sin(la) + lq.y * cos(la));
  float speck = step(0.84, h21(ci)) * (1.0 - smoothstep(0.5 - lpw, 0.5 + lpw, length(lq * vec2(1.0, 2.1)) + 0.3 * abs(lq.x))) * (1.0 - smoothstep(0.3, 1.0, lpw)) * (1.0 - ckw);
  // on the creek the fallen leaves lie still in rafts: yellow and russet on the black water
  vec2 lc = vW.xz * 1.6, li = floor(lc), lf = fract(lc) - 0.5 - 0.32 * (h22(li + 5.7) - 0.5); float lrot = h21(li + 8.0) * 6.283;
  lf = vec2(lf.x * cos(lrot) - lf.y * sin(lrot), lf.x * sin(lrot) + lf.y * cos(lrot));
  float raft = smoothstep(0.5, 0.72, vn(vW.xz * 0.16 + 21.0)), leafK = step(1.0 - 0.5 * raft, h21(li)) * smoothstep(0.2, 0.14, length(lf * vec2(1.0, 2.1))) * ckw * smoothstep(60.0, 22.0, dist);
  vec3 leafC = mix(mix(vec3(0.20, 0.15, 0.04), vec3(0.34, 0.27, 0.05), h21(ci + 5.0)), mix(vec3(0.42, 0.3, 0.05), vec3(0.3, 0.1, 0.03), h21(li + 2.0)), step(0.5, leafK));
  col = mix(col, leafC * (uAmb + 0.3 + uSunCol * 0.5 * dap), max(speck, leafK));
  float sdot = max(dot(R, uSunDir), 0.0);
  float sn = 260.0 / (1.0 + 520.0 * lost * lost);                                            // (the sun's own image widens by the slopes a pixel cannot resolve, twice their variance, and dims as it widens)
  // (THE SUN'S GLINTS are the sun's own image in the mirror, by the mirrored ray: each crested face that sends its ray within
  // the image's width of the sun flashes whole, to its crest line, on the sun's side of the river only; none in the far bank's
  // shadow and dimmed by the look's own veil over the sun, by the place's own shade, sunP)
  col += uSunCol * sunP * 2.5 * (sn / 260.0) * pow(sdot, sn);
  col += uSunCol * sunP * 0.8 * pow(sdot, 30.0) * mix(0.1, smoothstep(0.62, 0.9, vn(sc * vec2(2.4, 0.8) + 3.0)), seen(fs, vec2(2.4, 0.8))) * smoothstep(0.42, 0.7, hA) * smoothstep(5.0, 26.0, dist) * (1.0 - ckw);     // broken glitter down the sun's side of the river (by the place's own shade, sunP: it had ridden on live's sunK)
  // glints: ripple faces that tip toward the low sun flash and die, all across the sunward half of the view
  // (a glint is a ripple's own face: spk marks the faces tipped toward the sun by more than 0.13, each with an edge one pixel
  // wide; the faces the pixel cannot resolve add their share of such slopes instead. Ruffled water has many such faces, the
  // open reach a few, calm water none: the glints gather in the cat's-paws on the sun's side. The glint's own line below
  // lets the mark flash only where the pixel does not see the 0.8 m set face by face)
  float gt = -dot(slope, uSunDir.xz / max(length(uSunDir.xz), 1e-3)), gw = max(fwidth(gt), 0.7 * lost) + 0.004;
  float spk = smoothstep(0.13 - gw, 0.13 + gw, gt) * (1.0 - ckw);
  // (THE GLINT'S OWN LINE. Live's glint line is gone with live's sparkle noise, which round 13 took out on purpose: flecks of
  // noise that lay on no face. The face's glint above no longer rides in it: it takes the sun by the place's own shade, sunP,
  // at the strength and with the lobe toward the sun it had. It has no fade by footprint or by distance of its own: far off
  // spk's own edge (the pixel's difference of gt, and the slopes the pixel cannot see) and the sets' grain take the flash
  // to the faces' mean. At the near end it stands only on what the pixel does NOT see face by face of the 0.8 m set,
  // 1 - k3: a face the pixel resolves does not flash whole in the sun's colour (it did, as a cream crescent on every
  // face turned to the sun, which is how a sand flat is lit); the sun's own image above stands in it instead)
  col += uSunCol * sunP * 1.25 * spk * (1.0 - k3) * sdot * sdot * sdot * sdot;
  // from above the canopy the far margins lie under mist: tongues of it spill out over the water, so no bank shows as a ruled line
  float hiW = hiK * smoothstep(110.0, 190.0, dist);
  float tongue = smoothstep(3.6, 0.8, vDepth + 3.8 * (vn(vW.xz * 0.032 + 13.0) - 0.5) + 1.2 * (vn(vW.xz * 0.13 + 3.0) - 0.5));
  // (and two or three fields of glints lie on the open river below)
  col += uSunCol * sunK * 0.9 * hiK * smoothstep(0.62, 0.8, vn(vW.xz * 0.017 + 31.0)) * smoothstep(0.7, 0.92, vn(vW.xz * vec2(0.5, 0.8) + uTime * vec2(0.5, 0.3))) * smoothstep(60.0, 110.0, dist) * (1.0 - smoothstep(330.0, 480.0, dist));
  // (round 21: THIS LINE READS THE EYE'S HEIGHT (hiW) AND NOW ACTS LESS, by the look's own deck: the tongues are the sea's own. In
  // a look whose deck is a sea they spill over the water as they did; where the look's mist is burned to rags nothing is painted
  // on the river from above and it shows as a river, its own brown with the cliff's image. It was: 0.88 * hiW * tongue)
  col = mix(col, uMistC, 0.88 * uSeaK * hiW * tongue);
  // (the river ends at its waterline with an edge one pixel wide, where the wavelets leave it; the creek fades out as it did)
  float pfa = 0.7 * fwidth(depL) + 0.003;
  gl_FragColor = vec4(col, mix(smoothstep(-pfa, pfa, depL), smoothstep(-0.08, 0.28, vDepth), ckw));
  #include <fog_fragment>
}`;
const SHELL_FRAG = /* glsl */`
varying vec3 vW; varying float vMask; varying vec3 vBend;
uniform float uTime, uIpe;
uniform vec3 uSunDir, uSunCol, uSky, uGnd, uG1, uG2, uYel;
#include <common>
#include <fog_pars_fragment>
uniform vec3 uMist, uHaze; uniform float uMistK, uDeckY;
// (round 21, the mist that lies in the canopy: uSeaK: the look's share of a sea of mist, 0 = rags .. 1 = a sea; uRag.xy: the wind
// the mist drifts on, m/s; uRag.z: the height of the mist's top in this look; uRagL, uRagS: the mist's own lit and shaded colours,
// the deck's; uShad: one map of the place, baked from above (r = the shadows of the crowns that stand out of the canopy, g = the
// hollow under every emergent, b = the canopy's own crowns' domes); uShadO: its place; uBil: the billows of the mist's top, a
// tile 800 m across (r = height, g and b = its slope))
uniform float uSeaK; uniform vec3 uRag, uRagL, uRagS; uniform sampler2D uShad, uBil; uniform vec4 uShadO;
${GLSL_N}
void main(){
  // (round 21, fourth pass: the two maps are read here, by every fragment, before any discard and outside any branch, so that
  // the screen derivatives that choose a map's level are defined on every machine; they are used further down, on the top)
  vec4 plc = texture2D(uShad, (vW.xz - uShadO.xy) * uShadO.zw), bil = texture2D(uBil, (vW.xz - uRag.xy * uTime) * 0.00125);
  float rag = vn(vW.xz * 0.11) - 0.5, rag2 = vn(vW.xz * 0.33 + vW.y * 0.2) - 0.5;
  if (vMask + 0.5 * rag + 0.2 * rag2 < 0.5) discard;                                        // cut away over the creek and the light well
  float dist = distance(cameraPosition, vW), fk = 1.0 - 0.7 * smoothstep(300.0, 1000.0, dist);
  float skirt = smoothstep(0.97, 0.45, vBend.x);                                              // 1 on the curtain that drops to the bank
  vec2 pw = vW.xz + 9.0 * (vec2(vn(vW.xz * 0.04), vn(vW.xz * 0.04 + 31.0)) - 0.5);
  vec2 p = pw / 16.0, ip = floor(p), fp = fract(p); float d1 = 9.0, d2 = 9.0; vec2 id = vec2(0.), off = vec2(0.);
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 g = vec2(float(i), float(j)), r = g + 0.1 + 0.8 * h22(ip + g) - fp; float d = dot(r, r);
    if (d < d1) { d2 = d1; d1 = d; id = ip + g; off = r; } else if (d < d2) { d2 = d; }
  }
  float hgt = clamp(1.0 - 1.4 * d1, 0.0, 1.0); d1 = sqrt(d1); d2 = sqrt(d2);
  // the skirt's hem, in the bank scrub: ragged, never a ruled foot. (round 21, second pass: THE FOREST COMES DOWN TO THE WATER
  // CROWN BY CROWN. The hem was one ragged line some 4 to 9 m from the waterline the whole length of a bank (vBend.x < 0.05 +
  // 0.1 * rag + 0.06 * rag2), and from above the bank's own ground showed under it as one dark strip. Now each crown of the
  // quilt hangs its front some 2 m nearer the water (never nearer than 3 to 4.5 m), and between two crowns the hem stands
  // some 3 m further back and the bank shows in the gap: by the cell's own dome (hgt), nothing else; the same rags tear
  // it as before. It is the same hem from the river, where it was kept small: no sixteenth-by-ninth of a low view moves
  // by two levels)
  if (vBend.x < max(0.05 + 0.1 * rag + 0.06 * rag2 + 0.12 * (0.55 - hgt), 0.04 + 0.04 * rag2)) discard;
  float hid = h21(id + 1.7), gap = smoothstep(0.0, 0.5, d2 - d1), nz = vn(vW.xz * 0.9), nz2 = vn(vW.xz * 0.35 + 9.0);
  // real crowns are modelled near the path and along the banks: there the shell is only the dark mass under and behind them
  float cellK = fk * (1.0 - skirt) * (0.3 + 0.7 * smoothstep(50.0, 170.0, dist));
  vec3 col;
  if (gl_FrontFacing) {
    vec3 n = normalize(vec3(-off.x * cellK + (nz - 0.5) * 0.5, 1.0, -off.y * cellK + (nz2 - 0.5) * 0.5) + vec3(vBend.y, 0.0, vBend.z) * skirt * 0.9);
    vec3 alb = mix(uG1, uG2, hid * 0.7 + 0.3 * nz2) * (0.72 + 0.4 * nz * nz2 + 0.25 * hgt * cellK);
    float hiCam = smoothstep(uDeckY - 2.0, uDeckY + 7.0, cameraPosition.y);
    // (round 21: THIS LINE READS THE EYE'S HEIGHT (hiCam) AND NOW ACTS LESS. For the high eye it lit the whole curtain that drops
    // to a bank at 0.8, one even wall with a ruled dark foot under it. Now only the crowns' own fronts are lit so (each cell of
    // the quilt, down to the hem at its middle), and between two crowns the curtain keeps the shade it has from below (0.24),
    // widest at the foot and where three crowns meet: the forest comes down to the water crown by crown, and the dark of the
    // bank's foot runs up into the gaps between them. By the place alone (the height on the curtain and the cell's own dome).
    // It was: mix(1.0, mix(0.24, 0.8, hiCam), smoothstep(0.0, 0.6, skirt)) with the same last factor)
    alb *= mix(1.0, mix(0.24, mix(0.24, 0.8, smoothstep(0.1, 0.4, 0.5 * vBend.x + hgt - 0.5)), hiCam), smoothstep(0.0, 0.6, skirt)) * mix(0.6, 1.0, smoothstep(30.0, 150.0, dist));
    // (round 21: NO CELL OF THE SHELL IS PAINTED IN FLOWER ANY MORE. The line that stood here turned one cell in forty (one in
    // fourteen at low water) yellow beyond 150 m: alb = mix(alb, uYel, 0.8 * step(uIpe, h21(id + 9.1)) * smoothstep(0.8, 0.98,
    // vBend.x) * smoothstep(150.0, 260.0, dist) * hgt). Under the cream wash they were a faint tan; with the wash gone from the
    // clear morning they stood as dozens of yellow patches to the horizon, and the design has two or three ipe crowns in flower,
    // no more: those are the modelled ones, which stand as they did)
    float sheen = 0.9 + 0.2 * vn(vW.xz * 0.018 + uTime * vec2(0.16, 0.07)), occ = mix(1.0, (0.4 + 0.6 * gap) * (0.6 + 0.4 * hgt), cellK);
    col = alb * sheen * (uSunCol * (0.1 + 0.9 * max(dot(n, uSunDir), 0.0)) * occ + mix(uGnd, uSky, 0.5 + 0.5 * n.y) * (0.4 + 0.7 * occ));
    float under = (1.0 - smoothstep(35.0, 85.0, dist)) * smoothstep(8.0, -6.0, cameraPosition.y - vW.y);
    col = mix(col, (uG1 * (0.3 + 0.4 * nz * nz2) + uG2 * 0.2 * nz) * (0.6 + 0.6 * uSky), 0.88 * under);
    // the mist lies in the canopy: whatever is below the deck sinks into it
    float mk = uMistK * smoothstep(uDeckY + 2.5, uDeckY - 3.5, vW.y + 2.5 * (nz2 - 0.5) + 3.0 * hgt * cellK) * smoothstep(20.0, 120.0, dist) * hiCam * mix(smoothstep(0.5, 0.8, vBend.x), 1.0 + 0.3 * smoothstep(0.3, 0.7, vn(vW.xz * 0.019 + 5.0) + 0.25 * rag), smoothstep(70.0, 170.0, dist));   // from above, a far bank's curtain stands in the mist too: tongues of it, no ruled foot
    col = mix(col, uMist * (0.78 + 0.3 * max(dot(n, uSunDir), 0.0)), 0.92 * clamp(mk, 0.0, 1.0));
    // seen from above, the foot of every far bank's curtain of crowns is lost in mist whatever the morning: no dark hem at the waterline
    // (round 21: THIS LINE READS THE EYE'S HEIGHT (hiCam) AND NOW ACTS LESS, by the look's own deck: the paint on the curtains'
    // feet is the sea's. In a look whose deck is a sea the feet are lost in it as they were; where the look's mist is burned to
    // rags nothing is painted on a bank's trees: the mist along the river is the rags that lie there (the puff banks further
    // down), and between them the bank is a bank. It was the same line without its last factor)
    col = mix(col, uMist * 0.95, 0.88 * hiCam * smoothstep(100.0, 190.0, dist) * max(smoothstep(0.85, 0.3, vBend.x + 0.3 * rag + 0.25 * (nz2 - 0.5)) * step(0.02, skirt), smoothstep(uDeckY - 21.0, uDeckY - 28.0, vW.y)) * uSeaK);
    // (round 21) THE CROWNS' SHADOWS AND THE MIST IN THE CANOPY, BY THE PLACE ALONE: no line here names the eye, the lens,
    // the flight or the look. BUT THE TWO MAPS ARE FILTERED LIKE ANY TEXTURE, AND SO THE PIXEL'S FOOTPRINT DOES ACT (third
    // pass: said plainly). Each map has its coarser levels, and the card reads the level whose cells are as large as the
    // pixel's footprint on the canopy, by the footprint's longer side: far off and at a low slant a pixel holds the average
    // of its footprint. The crowns' domes and gaps (16 m cells) average to the crowns' mean top, and by day, when the mist's
    // top lies under that mean, the mist painted in the gaps thins with distance and is gone: the same ground has mist in
    // its gaps seen near and none seen far. Reckoned for a frame 1080 lines high (62 degrees, 0.0011 of a radian to a line)
    // from the glide, the eye 22 to 36 m over the canopy, where a footprint is its distance squared times that angle over
    // the eye's height: whole out to some 300 to 400 m (footprint 5 m), half gone at some 450 to 550 m, gone beyond some
    // 550 to 700 m (footprint 16 m, a whole crown); in a frame 360 lines high at 0.58 of those distances (whole to some 180
    // to 230 m, gone beyond 330 to 420 m); looking straight down, never. The crowns' shadows blur the same way, and the
    // billows lose their 11 m, 33 m and 100 m sets as the footprint passes those sizes. It is what keeps anything under a
    // pixel from shimmering, AND TWO NUMBERS BELOW WERE CHOSEN BECAUSE OF IT: the gaps' depth (5.5 m) and the day's top
    // (28.7 m) are set so that far off, where a pixel holds the mean, no level pool is painted over the crowns. All of it
    // lies on the canopy's top (topK: 0 on the curtain that drops to a bank and on its shoulder). plc is the one map of
    // the place, baked from above in build(), further down, and read at the head of main() with the billows' tile (bil).
    // Its r is the shadow of the crowns that stand out of the canopy, as the low sun throws it: what lies in it has the
    // sky's light only, so it is darker and cooler, leaves and mist alike.
    float topK = smoothstep(0.97, 1.0, vBend.x), shd = topK * plc.r;
    col *= mix(vec3(1.0), vec3(0.5, 0.58, 0.7), 0.75 * shd);
    // THE MIST LIES IN THE CANOPY'S HOLLOWS. Its top stands at one height in a look (uRag.z: the deck's own height when the look's
    // deck is full, lower by the look's deck value when it is not), billowed by 100 m, 33 m and 11 m of noise that drifts on
    // the wind (bil: a tile with its own coarser levels, so far off the top stands at its mean and nothing under a pixel is
    // left to shimmer). The canopy's own top rises and falls under it: the shell's height, each crown's own dome 5.5 m over the
    // gaps round it (plc.b: the same cells this shader paints, reckoned once per map cell; the crowns' mean top stays where
    // it was, 1.86 m over the shell: 5.5 * 0.715 - 2.07), and the hollow 5 m deep that every emergent keeps round its own
    // foot, where the crowns under it are lower (plc.g). So the mist fills the gaps and the hollows first, lies longest round
    // the foot of a kapok or any emergent, and the swells and the crowns stand out of it: mth is the metres of mist over the
    // leaves here, and a metre of it hides seven tenths of them, from wherever it is seen. (Second pass: the gaps are as
    // deep as crowns' gaps are, and by day the mist's top lies under the crowns' mean top nearly everywhere. Where the map
    // is read at its mean, the mist that lies in the gaps is not spread over the crowns' tops as a level grey pool: a rag in
    // a gap is a rag between crowns, and what stands above the crowns is the puff banks' to show, which have a top.)
    // Its top is lit as the deck is: warm on the side a billow turns to the sun, the deck's own cool shade on the other and
    // in a crown's shadow
    float mrel = 5.6 * (bil.r - 0.5), mth = uRag.z + mrel + 5.0 * plc.g - (vW.y + 5.5 * plc.b - 2.07), ma = topK * (1.0 - exp(-1.2 * max(mth, 0.0)));
    float mlit = clamp(0.5 - 3.0 * dot(bil.gb - 0.5, uSunDir.xz / max(length(uSunDir.xz), 1e-3)), 0.0, 1.0) * (1.0 - 0.85 * shd);
    col = mix(col, mix(uRagS, uRagL, mlit) * (0.94 + 0.03 * mrel), 0.94 * ma);
    // and the forest goes out into the haze of the horizon long before its edge: no ruled end to the land
    float rimD = min(min(vW.x + 720.0, 580.0 - vW.x), min(vW.z + 420.0, 740.0 - vW.z));
    col = mix(col, uHaze, max(0.8 * smoothstep(380.0, 900.0, dist) * hiCam, 1.0 - smoothstep(0.0, 240.0, rimD)));
  } else {
    // from below: dark leafy masses with bright ragged gaps of sky, the leaves round each gap catching the light
    float lfA = vn(vW.xz * 0.5 + 3.0), lfB = vn(vW.xz * 1.7 + 7.0), lfC = vn(vW.xz * 5.1 + 1.0), gapN = 0.5 * lfA + 0.32 * lfB + 0.18 * lfC, nearU = 1.0 - smoothstep(70.0, 150.0, dist);
    if (nearU * gapN > 0.58) discard;
    col = (uG1 * (0.1 + 0.5 * lfB * lfC) + uG2 * 0.3 * lfC * lfC * nz) * (0.6 + 0.6 * uSky);
    col += uG2 * uSunCol * 0.07 * smoothstep(0.44, 0.58, gapN) * nearU * (0.5 + lfC);
  }
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`;
const DECK_FRAG = /* glsl */`
varying vec3 vW; varying float vMask;
uniform float uTime, uAmt, uOff;
uniform float uSeaK;                                                                  // (round 21: the look's share of a sea of mist, 0 = rags .. 1 = a sea)
uniform vec4 uGiants; uniform float uReach;                                           // (round 21: the two kapoks' feet on the ground, xz and xz; the reach of the taller one's shade on the sheet at this look's sun, m)
uniform vec3 uSunDir, uSunCol, uCol, uShade, uHaze;
#include <common>
#include <fog_pars_fragment>
${GLSL_N}
// the deck's thickness field: slow banks 90 m across carrying billows 20 m across; the billows die away with distance so the
// sheet runs clean to the horizon instead of aliasing into lines
float deckH(vec2 w, float fine){
  vec2 p = w * 0.011 + uOff + uTime * vec2(0.007, 0.0035);
  float d = 0.62 * vn(p) + 0.38 * vn(p * 2.1 + 3.7);
  float b = vn(w * 0.048 + uOff * 3.0 - uTime * vec2(0.02, 0.012)), c = vn(w * 0.13 + uOff + uTime * vec2(0.03, -0.02));
  return d + fine * (0.3 * (b - 0.5) + 0.1 * (c - 0.5));
}
void main(){
  vec3 toC = cameraPosition - vW; float dist = length(toC), vy = abs(toC.y) / max(dist, 1e-3);
  float fine = 1.0 - smoothstep(110.0, 420.0, dist), far = smoothstep(260.0, 900.0, dist);
  float d = deckH(vW.xz, fine), e = 2.5 + 0.02 * dist;
  float dx = deckH(vW.xz + vec2(e, 0.0), fine) - d, dz = deckH(vW.xz + vec2(0.0, e), fine) - d;
  float cov = mix(0.66, 0.08, clamp(vMask * uAmt, 0.0, 1.0));
  // (far off it is broad banks with clear forest between them, not one even veil)
  float bank = smoothstep(0.34, 0.66, 0.65 * vn(vW.xz * 0.0033 + uOff * 2.0) + 0.35 * vn(vW.xz * 0.009 + 7.0));
  float a = mix(smoothstep(cov, cov + 0.3, d), clamp(vMask * uAmt, 0.0, 1.0) * (0.14 + 0.86 * bank), far) * smoothstep(0.12, 0.5, vMask);
  vec3 n = normalize(vec3(-dx / e * 34.0, 1.0, -dz / e * 34.0));
  float up = step(0.0, toC.y), nl = clamp(dot(n, uSunDir) * 1.7 + 0.12, 0.0, 1.0);
  float crest = smoothstep(0.42, 0.78, d);
  vec3 col = mix(uShade * (0.8 + 0.22 * crest), uCol * (0.84 + 0.12 * uSunCol), nl * (0.5 + 0.5 * up)) * (0.78 + 0.28 * crest);
  col = mix(col, uCol * 0.93, 0.6 * far);
  col = mix(col, uHaze, smoothstep(450.0, 1250.0, dist));
  // (its far limit wanders with the banks, 300 m to 1 km out, and each bank thins away over half its reach: from above the
  // canopy the sheet ends in soft lobes with hazed forest between and beyond them, never in a ruled line under the horizon)
  float lim = mix(280.0, 1050.0, smoothstep(0.25, 0.8, 0.7 * vn(vW.xz * 0.0019 + uOff * 5.0 + 3.0) + 0.3 * vn(vW.xz * 0.0052 + 11.0)));
  a *= 1.0 - smoothstep(lim * 0.5, lim, dist);
  // (round 21, fifth pass: WHERE THE SUN HAS BURNED THE LOOK'S MIST TO RAGS, WHAT IS LEFT OF THE SHEET IS KEPT ROUND THE
  // FOREST'S TWO GIANTS. The two lines above are the site's, character for character, and are left alone. The two kapoks
  // stand far over the canopy, 93 m apart. The sheet's rags lie within gr of the line between the two kapoks' feet (uGiants:
  // both stand on the ground), on every side of it, whole over the inner half of gr and thinning away over the outer half.
  // gr is ONE LENGTH with no swing: the reach of the taller giant's shade on the sheet at this look's sun (uReach, measured
  // in build(): its crown's top over the sheet, over the tangent of the sun's height, and its crown's own radius: 168 m on
  // the clear morning, 291 m in the golden look's lower sun). It is used as a breadth about the giants, not as the shade's
  // footprint: the shade itself falls to one side of them. That the day's last rags keep to the giants is this round's
  // choice of a place (the design asks for mist at the fork's ring in every look), and its breadth is a length of the land
  // and the look's sun, not a figure fitted to a picture. At the golden look's share of a sea (0.5) and under it the bank
  // is whole; from there up to a sea whole (dawn, after rain) the sheet comes back to the site's, by uSeaK. A place on the
  // map: the same from wherever it is seen)
  vec2 gq = vW.xz - uGiants.xy, gs = uGiants.zw - uGiants.xy;
  float gr = uReach;
  a *= mix(1.0 - smoothstep(0.5 * gr, gr, length(gq - gs * clamp(dot(gq, gs) / dot(gs, gs), 0.0, 1.0))), 1.0, smoothstep(0.5, 1.0, uSeaK));
  a *= smoothstep(0.003, 0.035, vy);                                                  // (seen edge-on from just above, its far reach thins away: no ruled top)
  a *= (0.66 + 0.34 * smoothstep(0.45, 0.06, vy)) * smoothstep(0.6, 5.0, abs(toC.y)) * smoothstep(16.0, 75.0, dist) * (0.5 + 0.5 * up) * mix(smoothstep(-17.0, -6.0, toC.y), 1.0, up);   // from far below it is not there: no white caps on the crowns
  gl_FragColor = vec4(col, clamp(a, 0.0, 0.95));
  #include <fog_fragment>
}`;

// ---------- crowns: cushions of small leaves ----------
// A crown is a dark lumpy core wrapped in a few dozen to 150 leaf sprays (quads). A spray carries the direction out of its
// cushion as its normal, so a crown shades as rounded masses whatever way the quads lie; its leaves are drawn in the shader,
// one pointed oval to a cell in three overlapping layers, always whole (a leaf whose cell lies outside the spray's disc is left
// out), about 0.3 m long whatever the crown's size. With distance the leaves fatten until a spray is a solid soft disc.
// aC = (corner x, corner y, half width [0: the core, -1: wood], random), aO = (occlusion, flutter)
const CUSH_VERT = /* glsl */`
attribute vec4 aC; attribute vec2 aO;
varying vec3 vW, vN, vCol, vL; varying vec4 vC; varying float vAO;
uniform float uTime, uLeaf; uniform vec2 uWind;
#include <common>
#include <fog_pars_vertex>
void main(){
  mat4 im = mat4(1.0);
  #ifdef USE_INSTANCING
    im = instanceMatrix;
  #endif
  vec3 s2 = vec3(dot(im[0].xyz, im[0].xyz), dot(im[1].xyz, im[1].xyz), dot(im[2].xyz, im[2].xyz));
  float sc = sqrt(s2.x);
  vec4 wp = modelMatrix * (im * vec4(position, 1.0));
  // wind: the whole mass heaves in the gusts, each spray nods on its own
  float gust = 0.5 + 0.5 * sin(uTime * 0.7 + wp.x * 0.045 + wp.z * 0.06) * sin(uTime * 0.23 + wp.z * 0.017 + 1.3);
  wp.xz += uWind * (0.22 * gust * smoothstep(-0.6, 0.9, position.y) * min(sc * 0.12, 1.0));
  wp.xyz += vec3(uWind.x, 0.4, uWind.y) * (aO.y * (0.05 + 0.1 * gust) * sin(uTime * 2.1 + aC.w * 43.0 + wp.x * 0.4));
  vW = wp.xyz;
  vN = normalize(mat3(modelMatrix) * (mat3(im) * (normal / max(s2, vec3(1e-6)))) + vec3(0., 1e-6, 0.));
  vCol = vec3(1.0);
  #ifdef USE_INSTANCING_COLOR
    vCol = instanceColor;
  #endif
  vC = aC; vAO = aO.x;
  float hs = max(aC.z, 0.0) * sc;                                       // the spray's half width in metres
  vL = vec3(aC.xy * hs / uLeaf + aC.w * vec2(37.0, 91.0), uLeaf / max(hs, 1e-3));
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const CUSH_FRAG = /* glsl */`
varying vec3 vW, vN, vCol, vL; varying vec4 vC; varying float vAO;
uniform vec3 uSunDir, uSun, uSky, uGnd, uCrMist, uCrDeck;
uniform float uTime, uAlb;
#include <common>
#include <fog_pars_fragment>
${GLSL_N}
// (how far inside the leaf, in cells; the leaf's own random; distance from its midrib; 1 if its cell centre is on the spray)
vec4 cushLeaf(vec2 uv, float seed, vec2 q, float k){
  vec2 ci = floor(uv), f = fract(uv) - 0.5;
  float h1 = h21(ci + seed), h2 = h21(ci + seed + 17.3);
  float a = h1 * 6.2832, ca = cos(a), sa = sin(a);
  vec2 p = vec2(f.x * ca + f.y * sa, -f.x * sa + f.y * ca);
  float x = p.x / 0.47, w = 0.2 * pow(max(1.0 - x * x, 0.0), 0.7) * (1.0 - 0.3 * x);
  vec2 qc = q - f * k;
  return vec4(w - abs(p.y), h2, abs(p.y), step(dot(qc, qc), 0.72 + 0.25 * h2));
}
void main(){
  float kind = vC.z;
  vec3 n = normalize(vN + vec3(0., 1e-5, 0.));
  vec3 toC = cameraPosition - vW; float dist = length(toC); vec3 V = toC / max(dist, 1e-3);
  float fw = max(fwidth(vL.x), fwidth(vL.y)), lod = smoothstep(0.13, 0.42, fw);      // cells per pixel: past 0.42 a leaf is under 2.5 px
  float c1 = vn(vW.xz * 2.9 + vW.y * 2.1), c2 = vn(vW.xy * 7.3 + vW.z * 5.1 + 3.0), cm2 = vn(vW.xz * 0.37 + 5.0), cm3 = vn(vW.xz * 1.21 + vW.y * 0.7 + 11.0);
  vec3 alb; float ao = vAO, leafK = 1.0, a = 1.0;
  if (kind > 0.0) {
    vec4 A = cushLeaf(vL.xy, 1.7, vC.xy, vL.z), B = cushLeaf(vL.xy * 1.29 + 11.3, 5.1, vC.xy, vL.z / 1.29), D = cushLeaf(vL.xy * 0.81 + vec2(4.4, 7.9), 9.3, vC.xy, vL.z / 0.81);
    float grow = 0.75 * lod;
    float sA = (A.x + grow) * A.w - (1.0 - A.w), sB = (B.x + grow) * B.w - (1.0 - B.w), sD = (D.x + grow) * D.w - (1.0 - D.w);
    vec4 Lf = sA > 0.0 ? A : (sB > 0.0 ? B : D);
    a = clamp(max(sA, max(sB, sD)) / max(fw, 1e-4) + 0.5, 0.0, 1.0);
    if (a < 0.4) discard;
    float id = Lf.y, fine = 1.0 - lod;
    alb = vCol * uAlb * mix(0.6, 1.15, mix(0.5, id, 0.4 + 0.6 * fine));
    alb = mix(alb, alb * vec3(1.45, 1.22, 0.55), 0.55 * fine * smoothstep(0.7, 1.0, id) * step(vCol.r, vCol.g));     // young leaves, yellower
    alb *= 1.0 + 0.3 * fine * smoothstep(0.035, 0.0, Lf.z);                                                          // the midrib catches the light
    n = normalize(n + 0.5 * fine * (vec3(id, fract(id * 7.3), fract(id * 13.1)) - 0.5));
  } else if (kind > -0.5) {
    if (abs(dot(n, V)) < 0.42 * c2 + 0.1 * c1) discard;                    // the core is ragged at its outline: no clean polygon against the sky
    // (the core is leaf too: mottled at the size of a leaf, never one flat tone)
    float lm = vn(vW.xz * 6.1 + vW.y * 4.3 + 7.0), lm2 = vn(vW.xy * 11.0 + vW.z * 8.0);
    alb = vCol * uAlb * (0.36 + 0.5 * c1 * c2) * (0.62 + 0.75 * smoothstep(0.3, 0.7, lm) * (0.6 + 0.8 * lm2)); ao *= 0.9;
    n = normalize(n + 0.45 * (vec3(lm, lm2, c2) - 0.5));
  } else { alb = vec3(0.1, 0.09, 0.07) * (0.6 + 0.7 * vn(vW.xy * vec2(7.0, 1.3) + vW.z * 5.0)); leafK = 0.0; }
  float nl = dot(n, uSunDir), wrap = clamp((nl + 0.32) / 1.32, 0.0, 1.0);
  vec3 amb = mix(uGnd * 1.6, uSky, 0.5 + 0.5 * n.y) * (0.6 + 0.5 * ao);
  vec3 col = alb * (uSun * wrap * wrap * mix(0.3, 1.0, ao) + amb);
  float back = max(dot(-V, uSunDir), 0.0);
  col += alb * uSun * vec3(0.85, 1.0, 0.35) * (0.6 * back * back * (1.0 - wrap) * leafK * (0.35 + 0.65 * ao));       // light through the leaves, looking toward the sun
  col += alb * (uSky * vec3(0.7, 1.0, 0.45) * 0.45 + uSun * vec3(0.8, 1.0, 0.3) * (0.07 + 0.16 * ao)) * smoothstep(0.1, -0.7, n.y) * leafK;   // from below: green light comes down through the mass
  // mist by height, broken by noise so no cushion goes white whole; wood only greys a little
  float ck = uCrDeck.y * smoothstep(uCrDeck.x + 5.2, uCrDeck.x - 3.0, vW.y + 2.8 * (cm2 - 0.5) + 1.5 * (cm3 - 0.5)) * smoothstep(uCrDeck.x - 2.0, uCrDeck.x + 7.0, cameraPosition.y) * smoothstep(18.0, 70.0, dist);
  col = mix(col, mix(uCrMist * 0.55, uCrMist, leafK), mix(0.25, 0.42, leafK) * ck);
  gl_FragColor = vec4(col, a);
  #include <fog_fragment>
}`;

// the howlers' sun shaft: one soft gold beam (a camera-facing ribbon along its axis, with no edge), with motes drifting in it
const SHAFT_VERT = /* glsl */`
uniform vec3 uA, uDir; uniform vec2 uW; uniform float uLen;
varying vec3 vW; varying vec2 vUv;
void main(){
  float t = position.y;
  vec3 c = uA + uDir * (t * uLen), side = normalize(cross(uDir, cameraPosition - c));
  vW = c + side * position.x * mix(uW.x, uW.y, t); vUv = vec2(position.x, t);
  gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.0);
}`;
const SHAFT_FRAG = /* glsl */`
varying vec3 vW; varying vec2 vUv;
uniform vec3 uCol; uniform float uTime, uGain;
${GLSL_N}
void main(){
  float x = abs(vUv.x), t = vUv.y, dist = distance(cameraPosition, vW);
  // a soft shaft: no edge anywhere. It is brightest along its heart and gone by its sides, broken lengthwise into rays by the
  // leaves above, strongest where it comes in through the canopy and thinning toward the ground, with dust drifting in it
  float rays = 0.3 + 0.7 * smoothstep(0.25, 0.75, 0.6 * vn(vec2(vUv.x * 2.4 + 7.0, 0.3 + uTime * 0.04)) + 0.4 * vn(vec2(vUv.x * 6.5 + 2.0, 1.7 - uTime * 0.03)));
  float beam = exp(-x * x * 3.4) * rays * (0.75 + 0.25 * vn(vec2(vUv.x * 1.3 + 3.0, t * 5.0 - uTime * 0.05)));
  float ends = smoothstep(0.0, 0.22, t) * (1.0 - 0.8 * smoothstep(0.3, 1.0, t));
  vec3 q = vW * 1.9 + vec3(0.0, uTime * 0.3, uTime * 0.1), cell = floor(q), f = fract(q) - 0.5;
  float h = fract(sin(dot(cell, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
  float mote = step(0.72, h) * smoothstep(0.2, 0.04, length(f + 0.25 * vec3(sin(h * 40.0 + uTime), cos(h * 23.0 + uTime * 0.7), sin(h * 31.0))));
  float I = (beam * 0.4 + 3.0 * mote * exp(-x * x * 2.2) * (1.0 - smoothstep(18.0, 50.0, dist))) * ends * smoothstep(2.0, 7.0, dist) * uGain;
  gl_FragColor = vec4(uCol * I, 1.0);
}`;

// ---------- small custom animals (capybara, toucan): lofted low-poly bodies, lit like the hero's birds ----------
// aPart = (part, weight): capybara 0 body, 1 head and muzzle, 2 ear, 3 leg; toucan 0 body, 1 wing (weight = side)
class CritGeo {
  constructor() { this.p = []; this.c = []; this.a = []; this.i = []; }
  // rings: [z, yc, rx, ry, [r,g,b] top, [r,g,b] belly, part]; superellipse exponent e squares the section
  loft(rings, sides, e = 2) {
    const base = this.p.length / 3, n = rings.length;
    rings.forEach((r, j) => { for (let k = 0; k < sides; k++) {
      const t = (k / sides) * Math.PI * 2, cx = Math.cos(t), sy = Math.sin(t), x = Math.sign(cx) * Math.pow(Math.abs(cx), 2 / e) * r[2], y = Math.sign(sy) * Math.pow(Math.abs(sy), 2 / e) * r[3], m = smoothstep(-0.5, 0.4, sy);
      this.p.push(x, r[1] + y, r[0]); this.c.push(lerp(r[5][0], r[4][0], m), lerp(r[5][1], r[4][1], m), lerp(r[5][2], r[4][2], m)); this.a.push(r[6] || 0, 0);
    } if (j) for (let k = 0; k < sides; k++) { const a = base + (j - 1) * sides + k, b = base + (j - 1) * sides + (k + 1) % sides; this.i.push(a, a + sides, b, b, a + sides, b + sides); } });
    const cap = (j, flip) => { const c = this.p.length / 3, r = rings[j]; this.p.push(0, r[1], r[0] + (flip ? -0.012 : 0.012)); this.c.push(...r[4]); this.a.push(r[6] || 0, 0);
      for (let k = 0; k < sides; k++) { const a = base + j * sides + k, b = base + j * sides + (k + 1) % sides; if (flip) this.i.push(c, a, b); else this.i.push(c, b, a); } };
    cap(0, true); cap(n - 1, false);
  }
  tri(a, b, c, col, part, w = 0) { const k = this.p.length / 3; this.p.push(...a, ...b, ...c); for (let q = 0; q < 3; q++) { this.c.push(...col); this.a.push(part, w); } this.i.push(k, k + 1, k + 2); }
  quad(a, b, c, d, col, part, w = 0) { const k = this.p.length / 3; this.p.push(...a, ...b, ...c, ...d); for (let q = 0; q < 4; q++) { this.c.push(...col); this.a.push(part, w); } this.i.push(k, k + 1, k + 2, k, k + 2, k + 3); }
  build(inst) {
    const g = inst ? new THREE.InstancedBufferGeometry() : new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3)); g.setAttribute('aPart', new THREE.Float32BufferAttribute(this.a, 2));
    g.setIndex(this.i); g.computeVertexNormals();
    return g;
  }
}
const CRIT_FRAG = /* glsl */`
varying vec3 vN, vC, vW;
uniform vec3 uSunDir, uSunCol, uSky, uGnd;
#include <common>
#include <fog_pars_fragment>
${GLSL_N}
void main(){
  vec3 n = normalize(vN + vec3(0., 1e-5, 0.)); if (!gl_FrontFacing) n = -n;
  float fur = (0.62 + 0.42 * vn(vW.xz * 31.0 + vW.y * 43.0) * (0.5 + vn(vW.zy * 11.0 + 3.0)) + 0.2 * vn(vec2((vW.x + vW.z) * 44.0, vW.y * 6.0))) * (0.72 + 0.28 * smoothstep(-0.9, 0.0, n.y));      // coarse fur, streaked down the flank, dark under the belly
  float d = dot(n, uSunDir), rim = 1.0 - max(dot(n, normalize(cameraPosition - vW + vec3(0., 1e-4, 0.))), 0.0);
  vec3 col = vC * fur * (uSunCol * (max(d, 0.0) * 0.85 + 0.1 * (d * 0.5 + 0.5)) + mix(uGnd, uSky, 0.5 + 0.5 * n.y)) + uSunCol * vC * 0.25 * rim * rim * rim * max(d + 0.3, 0.0);
  col += uSunCol * vC * vC * 0.5 * pow(max(dot(normalize(vW - cameraPosition), uSunDir), 0.0), 3.0);
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`;
const CAPY_VERT = /* glsl */`
attribute vec3 color; attribute vec2 aPart; attribute vec4 iPos, iPose;
varying vec3 vN, vC, vW;
uniform float uTime, uPass;
#include <common>
#include <fog_pars_vertex>
void main(){
  vec3 p = position, n = normal; float ph = iPose.z, sit = step(1.5, iPose.y), lying = step(0.5, iPose.y) * (1.0 - sit), t = uTime, fore = step(0.0, position.z);
  if (aPart.x > 2.5) p.y *= mix(1.0, 0.2, lying); else p.y -= 0.24 * lying;
  if (aPart.x < 0.5) { float b = 1.0 + 0.018 * sin(t * 1.9 + ph * 5.0) * smoothstep(0.45, -0.1, abs(p.z + 0.05)); p.x *= b; }
  if (aPart.x > 1.5 && aPart.x < 2.5) p.x += sign(p.x) * 0.03 * pow(max(sin(t * 2.3 + ph * 9.0), 0.0), 12.0);
  // the head swings from the shoulders: a slow look-about, now and then a dip to the sand
  float w = smoothstep(0.34, 0.6, position.z) * step(aPart.x, 2.5);
  float yaw = w * (iPose.w + 0.32 * sin(t * 0.43 + ph * 3.0) + 0.1 * sin(t * 1.1 + ph)), dipk = smoothstep(0.55, 0.95, sin(t * 0.21 + ph * 7.0)) * (1.0 - lying) * (1.0 - sit);
  yaw += w * 0.75 * (uPass - 0.5) * sign(sin(ph * 17.0) + 0.3);                 // (a head turns after us as we pass)
  float pit = w * (0.07 * sin(t * 0.7 + ph * 2.0) + 0.55 * dipk + 0.4 * sit);
  vec3 q = p - vec3(0.0, 0.4, 0.36); float cy = cos(yaw), sy = sin(yaw), cp = cos(pit), sp = sin(pit);
  q = vec3(q.x * cy + q.z * sy, q.y, -q.x * sy + q.z * cy); q = vec3(q.x, q.y * cp - q.z * sp, q.y * sp + q.z * cp);
  p = q + vec3(0.0, 0.4, 0.36);
  n = vec3(n.x * cy + n.z * sy, n.y, -n.x * sy + n.z * cy);
  // sitting on its haunches: the body tips up from the hips, the forelegs stand straight under the chest, the hind legs fold
  if (sit > 0.5) {
    if (aPart.x > 2.5) { if (fore > 0.5) { float hk = position.y / 0.4; p.z += mix(-0.2, -0.13, hk); p.y *= 1.22; } else { p.y *= 0.42; p.z += 0.07; p.x *= 1.12; } }
    else { vec2 r = p.yz - vec2(0.24, -0.38); const float cs = 0.8776, ss = 0.4794; p.y = 0.24 + r.x * cs + r.y * ss - 0.14; p.z = -0.38 + r.y * cs - r.x * ss; n = vec3(n.x, n.y * cs + n.z * ss, n.z * cs - n.y * ss); }
  }
  float a = iPos.w, ca = cos(a), sa = sin(a);
  vec3 wp = iPos.xyz + vec3(p.x * ca + p.z * sa, p.y, -p.x * sa + p.z * ca) * iPose.x;
  vN = vec3(n.x * ca + n.z * sa, n.y, -n.x * sa + n.z * ca); vC = color; vW = wp;
  vec4 mvPosition = modelViewMatrix * vec4(wp, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const TOUCAN_VERT = /* glsl */`
attribute vec3 color; attribute vec2 aPart; attribute vec4 iPos; attribute vec3 iFwd;
varying vec3 vN, vC, vW;
uniform float uTime;
#include <common>
#include <fog_pars_vertex>
void main(){
  vec3 p = position, n = normal; float ph = iPos.w;
  // toucan flight: a burst of quick beats, then a closed-wing glide, the whole bird rising and sinking with it
  float cyc = uTime * 1.25 + ph, burst = smoothstep(-0.25, 0.25, sin(cyc)), beat = sin(uTime * 26.0 + ph * 4.0);
  if (aPart.x > 0.5) { float side = aPart.y, d = abs(p.x) - 0.07, ang = mix(-0.25, 0.75 * beat + 0.12, burst); p.x = side * (0.07 + d * cos(ang) * mix(0.55, 1.0, burst)); p.y += d * sin(ang); p.z -= d * 0.5 * (1.0 - burst); }
  vec3 F = normalize(iFwd + vec3(0., 0., 1e-4)), R = normalize(cross(vec3(0., 1., 0.), F) + vec3(1e-5, 0., 0.)), U = cross(F, R);
  vec3 wp = iPos.xyz + (R * p.x + U * p.y + F * p.z) * 1.4 + vec3(0.0, 0.5 * sin(cyc - 0.9), 0.0);
  vN = R * n.x + U * n.y + F * n.z; vC = color; vW = wp;
  vec4 mvPosition = modelViewMatrix * vec4(wp, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
// the bar's own surface: pale smooth sand with faint wind ripples, a damp rim at the water, drift lines and soft contact
// shadows under the animals and logs (uBlob: x, z, radius, strength)
const SAND_FRAG = /* glsl */`
varying vec3 vW; varying float vMask; varying vec3 vBend;
uniform vec3 uSunDir, uSunCol, uSky, uGnd, uSand, uWet;
uniform vec4 uBlob[24];
uniform vec3 uSh;
uniform float uWL;
#include <common>
#include <fog_pars_fragment>
${GLSL_N}
void main(){
  float n1 = fbm4(vW.xz * 0.09), n2 = vn(vW.xz * 0.7 + 4.0), dist = distance(cameraPosition, vW);
  float a = smoothstep(0.25, 0.75, vMask + 0.35 * (n1 - 0.5)) * smoothstep(-0.12, 0.2, vW.y - uWL + 0.1 * (n2 - 0.5));
  if (a < 0.01) discard;
  float rip = sin((vW.x * 0.35 + vW.z) * 5.2 + 5.0 * n1 + 1.5 * n2) * (1.0 - smoothstep(18.0, 60.0, dist));
  float ripK = 0.35 + 0.65 * smoothstep(0.3, 0.7, n1);
  vec3 n = normalize(vec3(vBend.x + 0.05 * rip * ripK, 1.0, vBend.z + 0.1 * rip * ripK));
  // (the damp rim: the sand is wet through from the water up to 0.3 m above it and dry from 0.45 m, a forearm's height: the band
  // has an upper edge that can be seen, where it used to fade over 0.6 m of height. Its darkness is as it was)
  float damp = smoothstep(0.45, 0.3, vW.y - uWL + 0.25 * (n1 - 0.5)), drift = smoothstep(0.08, 0.0, abs(vW.y - uWL - 0.42 - 0.3 * (n1 - 0.5))) * smoothstep(0.35, 0.7, n2);
  vec3 alb = mix(uSand, uWet, 0.7 * damp) * (0.9 + 0.16 * n1 + 0.05 * n2 + 0.02 * rip);
  alb = mix(alb, vec3(0.2, 0.15, 0.09), 0.55 * drift);                                     // lines of stranded leaves and twigs
  float nearK = 1.0 - smoothstep(16.0, 44.0, dist), trk = 0.0;
  for (int k = 0; k < 4; k++) {                                                            // trails of paired prints from the water up to the cane
    float fk = float(k), lat = vW.x + 147.0 + 6.5 * fk - 1.7 * sin(vW.z * 0.21 + 2.3 * fk) - 0.35 * (vW.z - 140.0);
    float sd = step(0.0, lat) * 2.0 - 1.0; vec2 q = vec2(abs(lat) - 0.17, (fract(vW.z * 1.25 + 0.25 * sd + 0.37 * fk) - 0.5) / 1.25);
    trk = max(trk, smoothstep(0.12, 0.05, length(q * vec2(1.0, 0.75))));
  }
  alb *= 1.0 - 0.34 * trk * nearK * (1.0 - 0.6 * damp);
  alb = mix(alb, vec3(0.17, 0.13, 0.07), 0.6 * smoothstep(0.74, 0.86, vn(vW.xz * 3.7 + 11.0)) * smoothstep(0.45, 0.7, n2) * nearK);   // leaf litter and twigs
  alb += 0.09 * smoothstep(0.8, 0.95, vn(vW.xz * 7.3 + 3.0)) * nearK;                      // pale shell and quartz grit
  alb *= 1.0 + 0.05 * rip * ripK;
  float sh = 1.0;
  // (each shadow is drawn out away from the sun: uSh = the sun's horizontal direction and how many radii long it lies)
  for (int k = 0; k < 24; k++) { vec4 b = uBlob[k]; vec2 d = (vW.xz - b.xy) / max(b.z, 0.05); float q = dot(d, uSh.xy), ac = dot(d, vec2(-uSh.y, uSh.x));
    sh *= 1.0 - b.w * exp(-(q * q / (1.0 + uSh.z * uSh.z * step(q, 0.0)) + ac * ac) * 1.6); }
  vec3 col = alb * (uSunCol * max(dot(n, uSunDir), 0.0) * (0.25 + 0.75 * sh) + mix(uGnd, uSky, 0.5 + 0.5 * n.y) * (0.45 + 0.55 * sh));
  gl_FragColor = vec4(col, a);
  #include <fog_fragment>
}`;

export default {
  id: 'macaw-wall',
  name: 'The Clay Lick',
  category: 'wilderness',
  weirdness: 0.05,
  media: ['air', 'open'],
  async build(ctx) {
    const R = ctx.rng, noise = ctx.noise, vary = ctx.vary || {}, detail = ctx.quality?.detail ?? 1;
    const density = clamp(vary.density ?? 1, 0.7, 1.3), rare = !!vary.rare;
    const pick = R.fork('looks')(), wPick = R.fork('water')(), hourAsk = vary.hour || 'any';
    const lookId = hourAsk === 'day' ? 'day' : hourAsk === 'golden' ? 'golden' : (hourAsk === 'dawn' || hourAsk === 'night') ? (pick < 0.7 ? 'dawn' : 'rain')
      : pick < 0.46 ? 'day' : pick < 0.66 ? 'golden' : pick < 0.84 ? 'dawn' : 'rain';     // mid-morning is the usual visit
    const LK = LOOKS[lookId], rain = LK.weather === 'rain';
    const waterMode = wPick > 0.85 ? 'high' : wPick > 0.7 ? 'low' : 'normal';
    const WL = waterMode === 'high' ? 1.25 : waterMode === 'low' ? -0.6 : rain ? 0.35 : 0;        // river level
    const sunV = V3(...LK.sun).normalize(), sunCol = C(LK.sunCol);
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(C(LK.fog), LK.fogD);

    // ---------- the flight ----------
    const hin = V3(-0.52, 0, 0.855).normalize(), rgt = V3(-hin.z, 0, hin.x);              // creek heading and its right
    const G1 = V3(-180, 4.6, 168), E = G1.clone().addScaledVector(hin, 64).setY(6);
    const CK = E.clone().addScaledVector(rgt, 18).setY(0);                                 // first kapok
    // THE APPROACH: we come in down the upstream reach from the north-east, 21 m up and 170 m from the wall, on a line aimed at its
    // middle, so the whole lit cliff stands in the opening frame over its own reflection; drop to 4 m over the water as the line
    // swings south toward the wall's east shoulder (the early flight bursts off the clay and comes out over our bow), then turn
    // right-about onto the wall 20 m off the shoulder's clay and out along it westward. Its length to the first point of the wall
    // run (82, 8.6, 23.5) is that of the old run-in, so every later place keeps its u
    const pts = [[149.8, 21, 177.4], [140, 18.5, 160], [121, 8.2, 123], [112, 4.5, 93], [117, 4.2, 65], [128, 4.6, 46], [125, 5.8, 32], [106, 7.3, 24.4],
      [82, 8.6, 23.5], [46, 12.5, 22], [14, 14, 22], [-20, 14.2, 22], [-50, 14, 22.5],
      [-76, 13.4, 30], [-98, 12, 46], [-124, 8.5, 80], [-146, 5.2, 114], [-164, 4, 142], [G1.x, G1.y, G1.z], [(G1.x + E.x) / 2, 5.2, (G1.z + E.z) / 2], [E.x, E.y, E.z]];
    const helixAt = (phi, out = new THREE.Vector3()) => {
      const k = phi / (3 * Math.PI), r = 18 + 4 * k;
      return out.copy(CK).addScaledVector(rgt, -r * Math.cos(phi)).addScaledVector(hin, r * Math.sin(phi)).setY(6 + 64 * k);
    };
    for (let d = 30; d <= 540; d += 30) { const p = helixAt(d * Math.PI / 180); pts.push([p.x, p.y, p.z]); }
    const XP = helixAt(3 * Math.PI), hf = hin.clone().negate(), lf = rgt.clone();          // final heading and its LEFT (sun is on the right)
    const K2 = XP.clone().addScaledVector(hf, 82).addScaledVector(lf, 22).setY(0), PORTAL_Y = 61;   // 45 m inside the forest edge: closed canopy all round its foot
    const KM = XP.clone().addScaledVector(hf, 36).addScaledVector(lf, 5), hf2 = V3(K2.x - KM.x, 0, K2.z - KM.z).normalize(), lf2 = V3(hf2.z, 0, -hf2.x);   // the last leg's heading and its left
    pts.push([KM.x, 67.0, KM.z], [K2.x, PORTAL_Y, K2.z]);
    for (const p of pts) p[1] += WL * (1 - smoothstep(6, 14, p[1]));
    await ctx.yield();
    const path = makePath(pts);
    await ctx.yield();
    const capyBase = path.pointAt(0.55), herdC = capyBase.clone().addScaledVector(hin, 11).addScaledVector(rgt, 8.4);     // the capybara herd
    let u14 = 0.3; for (let u = 0.2; u < 0.45; u += 0.001) if (path.pointAt(u).x <= 25) { u14 = u; break; }
    const flushAt = u14 * DUR, eyeAt = (te, out = new THREE.Vector3()) => path.pointAt(clamp((te + flushAt) / DUR, 0, 1), out);
    const teOf = (u) => u * DUR - flushAt, uOf = (te) => (te + flushAt) / DUR;
    // THE WALL EMPTIES OVERHEAD. The part is given an eye line 20 m above the lens and a second ahead of it, so every bird's lane
    // crosses high over the bow as a sheet against the sky, and the lens's own line to keep 9 m clear of on the way up
    const eyeLine = [], camLine = [];
    for (let te = -7; te <= 13; te += 0.5) { const p = eyeAt(te + 1.0); eyeLine.push([te, p.x, p.y + 20, p.z]); eyeAt(te, p); camLine.push([te, p.x, p.y, p.z]); }
    // the lens's line carried on, for the small parrots' block alone (keepOff.long): camLine's own points, then the same half-second points on to
    // the first at or past the small parrots' last drawn moment (update() below draws them while u is no more than 0.6). The lanes read camLine
    const lensLong = camLine.slice();
    for (let te = camLine[camLine.length - 1][0] + 0.5; te < teOf(0.6) + 0.5; te += 0.5) { const p = eyeAt(te); lensLong.push([te, p.x, p.y, p.z]); }
    // the wheel: a tilted ring 190 m by 120 m over the river, high along the wall and lower over the bar, nowhere less than 14 m
    // above our line. All but forty pairs spread round it
    const loop = [[-20, 40, 30], [-62, 38, 34], [-100, 34, 50], [-128, 28, 84], [-150, 22, 118], [-168, 18, 142], [-158, 17, 156], [-132, 17, 157], [-100, 18, 150], [-60, 20, 142], [-20, 24, 128], [10, 30, 104], [22, 36, 76], [14, 40, 48]].map((q) => [q[0], q[1] + WL, q[2]]);
    const track = { loop, speed: 15, teRef: teOf(0.43), refPoint: path.pointAt(0.43 + 30 / path.length).add(V3(0, 8, 0)).toArray(), sigma: 14, bulk: 0 };
    // THE SKEIN: forty pairs leave the wheel as we bank out and fly our own line a little ahead of the bow: across the river, over
    // the bar, up the creek and round the kapok with us, settling pair by pair on its limbs and crown as the climb passes them.
    // Its line is the camera's; SK_KEYS (u, lead of the tail s, more lead at the head s, metres lower per second of lead, lateral
    // centre, lateral width, height over the line, spread in height) shape it for each stretch
    const SK_T0 = teOf(0.37), SK_DT = 0.5, skRoute = []; for (let k = 0; k < 48; k++) skRoute.push(path.pointAt(uOf(SK_T0 + k * SK_DT)).toArray());
    const SK_KEYS = [[0.40, 1.0, 2.2, 0, 3, 16, 7, 7], [0.50, 0.9, 1.9, 0, 2, 13, 5.5, 6.5], [0.57, 0.8, 1.6, 0, 0, 9, 4.2, 5], [0.62, 0.75, 1.5, 0, 0, 7, 3.2, 4.2], [0.675, 0.6, 1.3, 1.5, -1, 6, 2, 3.5], [0.70, 0.5, 1.3, 3.2, -1.5, 6, 1.2, 3.2], [0.80, 0.45, 1.2, 3.2, -1.5, 6, 1.2, 3.2]];
    const skOut = [0, 0, 0, 0, 0, 0, 0];
    const skShape = (te) => { const u = uOf(te); let k = 0; while (k < SK_KEYS.length - 2 && u > SK_KEYS[k + 1][0]) k++; const a = SK_KEYS[k], b = SK_KEYS[k + 1], t = smoothstep(a[0], b[0], u); for (let i = 1; i < 8; i++) skOut[i - 1] = lerp(a[i], b[i], t); return skOut; };
    const skein = { pairs: 40, route: skRoute, t0: SK_T0, dt: SK_DT, join: [teOf(0.40), 3.0], shape: skShape };
    // the harpy comes over from behind as the wall bursts. Rare: over the river it folds and stoops through the body of the flock
    // just ahead of the bow, the birds parting round it like a curtain; it misses and pulls out low over the water
    const harpyBase = (te, out) => te < 0 ? out.set(25 - 25 * te, 30 - 7 * te, 22 + 13.5 * te) : out.set(25 - 25 * te, 30 + 0.35 * te * te, 22 + 0.8 * te * te);
    let harpyAt = (te, out = new THREE.Vector3()) => harpyBase(te, out), scare;
    const U_STOOP = 0.47, teS = U_STOOP * DUR - flushAt;
    if (rare) {
      const eS = eyeAt(teS), fwS = path.tangentAt(U_STOOP).setY(0).normalize(), ltS = V3(fwS.z, 0, -fwS.x), e3 = eyeAt(teS + 1.7);
      const keys = [teS - 4.5, teS - 2.1, teS, teS + 1.7, teS + 5.5], kp = [harpyBase(teS - 4.5, V3()), eyeAt(teS - 2.1).addScaledVector(fwS, 46).addScaledVector(ltS, -9).add(V3(0, 27, 0)),
        eS.clone().addScaledVector(fwS, 24).addScaledVector(ltS, 0.8).add(V3(0, 6.5, 0)), e3.clone().addScaledVector(ltS, 26).addScaledVector(fwS, 16).setY(WL + 4), e3.clone().addScaledVector(ltS, 120).addScaledVector(fwS, 60).setY(34)];
      const curve = new THREE.CatmullRomCurve3(kp, false, 'centripetal');
      harpyAt = (te, out = new THREE.Vector3()) => {
        if (te < keys[0]) return harpyBase(te, out);
        let k = 0; while (k < keys.length - 2 && te > keys[k + 1]) k++;
        return curve.getPoint(clamp((k + (te - keys[k]) / (keys[k + 1] - keys[k])) / (keys.length - 1), 0, 1), out);
      };
      scare = (te) => 5.5 * smoothstep(teS - 2.6, teS - 0.9, te) * (1 - smoothstep(teS + 0.9, teS + 2.4, te));
    }
    // THE EARLY FLIGHT: ninety pairs are off the wall before the harpy comes. They leave the clay as we come down the reach, each timed
    // to cross the sky ahead of our bow and to its left (the wall's side) between u 0.04 and 0.125, 8 to 60 m off and above the lens,
    // then circle over the river in front of the wall, low in the east and high in the west, until the flush takes them up with the rest
    const earlyLine = []; for (let te = teOf(0) - 3; te <= -1; te += 0.5) { const p = eyeAt(te); earlyLine.push([te, p.x, p.y, p.z]); }
    // (the 36 pairs on the east shoulder and the three on its blocks are taken out of the wall's count: the same number of birds as before)
    const early = { pairs: 112, x0: -40, x1: 92, xFull: 20, thin: 0.7, t0: teOf(0) - 2.0, xw: 34, wave: 18, jitter: 1.8, line: earlyLine, keep: 9,
      pass: [teOf(0.074), teOf(0.093)], speed: [12, 19], box: { c: [4, 24], lt: [-20, 22], up: [1.5, 12] },
      hold: { center: [56, 26 + WL, 50], rx: 52, rz: 22, spread: 4.5, tilt: 10, omega: 0.36, phase: 3.37, span: 2.3, dip: 7 } };
    await ctx.yield();
    const hero = await buildHero(ctx, { palette: ['#AE4A30', PAL[1], PAL[2], PAL[3], PAL[4], '#8C7660', PAL[6]], hour: LK.hour, weather: LK.weather, sunDir: LK.sun, sunColor: LK.sunCol, sunIntensity: LK.heroSun, shadowLineY: LK.shadowY + WL,
      density: Math.round(lerp(650, 790, (density - 0.7) / 0.6)) - 78, duration: DUR, flushAt, eyeLine, keepOff: { line: camLine, dist: 9, long: lensLong }, track, skein, early, eastPairs: 36, extraSlots: 16, lead: 6, harpyAt, scare, harpyEnd: rare ? teS + 6 : 12.5, floorY: WL + 1.7, waterY: WL });
    scene.add(hero.object);
    await ctx.yield();

    // ---------- the lie of the land ----------
    const RIV = [[300, 480, 58], [215, 270, 58], [176, 165, 60], [150, 100, 62], [112, 60, 60], [40, 60, 56], [-60, 62, 55], [-150, 56, 54], [-260, 42, 52], [-400, 30, 52], [-560, 80, 55], [-760, 200, 60]];
    const CRK = [[-128, 112, 5], [-140, 128, 5.5], [-160, 150, 7], [-180, 168, 13], [-196.6, 195.4, 10], [-207, 226, 7.5], [-212, 262, 7], [-205, 310, 6], [-215, 380, 6]];
    const BAR = [[-182, 138, 0], [-120, 137, 0], [-40, 137, 0], [40, 138, 0], [98, 150, 0]];
    const riverSD = (x, z, o) => polySD(RIV, x, z, o), creekSD = (x, z) => polySD(CRK, x, z), barAt = (x, z) => smoothstep(27, 14, polySD(BAR, x, z));
    const height = (x, z) => {
      const rd = riverSD(x, z), cd = creekSD(x, z);
      const floor = 3.0 + 1.5 * noise.fbm2(x * 0.011 + 5, z * 0.011, 3) + 0.35 * noise.n2(x * 0.07, z * 0.07);
      let h = rd < 0 ? -0.2 - 3.3 * smoothstep(0, -16, rd) : -0.2 + (floor + 0.2) * smoothstep(0, 9, rd);
      const bm = barAt(x, z);
      if (bm > 0) h = lerp(h, -1.1 + 2.6 * smoothstep(-12, 16, rd) + 0.1 * noise.n2(x * 0.3, z * 0.08), bm);
      if (cd < 8) h = Math.min(h, lerp(h, -1.5, smoothstep(6, -3, cd)));
      else { const dk = Math.hypot(x - CK.x, z - CK.z); if (dk < 30) h = lerp(Math.min(h, 2.0), h, smoothstep(15, 30, dk)); }
      if (Math.abs(x) < 160 && z < 40) {
        const xc = clamp(x, -149, 149), H = hero.rimY(xc), zt = hero.faceZ(xc, H * 0.995);
        const m = smoothstep(zt - 3, zt - 11, z) * smoothstep(160, 148, Math.abs(x));
        if (m > 0) h = lerp(z > zt - 12 ? Math.min(h, -1) : h, H - 3.6 + 2.5 * smoothstep(20, 70, zt - z) + 0.5 * noise.n2(x * 0.05, z * 0.05), m);
      }
      return h;
    };
    // 1 where closed forest stands: off the water, the bar, the creek gallery and the light well round the first kapok
    const forestAt = (x, z) => {
      const m = smoothstep(3, 12, riverSD(x, z)) * (1 - smoothstep(0.15, 0.6, barAt(x, z))) * smoothstep(1, 7, creekSD(x, z)) * smoothstep(27, 36, Math.hypot(x - CK.x, z - CK.z));
      return Math.abs(x) < 152 && z < 12 ? m * smoothstep(8, -4, z - hero.faceZ(clamp(x, -149, 149), hero.rimY(clamp(x, -149, 149)) * 0.995) + 8) : m;
    };

    // ---------- sky and light ----------
    const sky = makeSky({ rng: R.fork('sky'), preset: LK.hour === 'day' ? 'day' : LK.hour === 'golden' ? 'goldenHour' : 'dawn',
      sunElevation: Math.asin(sunV.y) * 180 / Math.PI, sunAzimuth: Math.atan2(sunV.x, -sunV.z) * 180 / Math.PI, sunColor: LK.sunCol, sunIntensity: 10,
      zenith: LK.zenith, mid: LK.mid, horizon: LK.horizon, ground: LK.fog, groundFalloff: 4, scatterColor: LK.scatter, scatter: 0.3, clouds: false,
      clouds2: { coverage: rain ? 0.5 : 0.36, stretch: 1, opacity: rain ? 0.7 : 0.55, lit: LK.cirrus, shade: '#b9bfd0', scale: 1.3 },
      lightColor: LK.sunCol, lightIntensity: LK.sunI, ambientColor: LK.hemiSky, groundLight: LK.hemiGnd, ambientIntensity: LK.hemiI, lightElevationMin: 12, fogColor: LK.fog });
    scene.add(sky.object);
    const rig = makeLightRig(sky, { bounce: 0.25 }); scene.add(rig.object);
    const hazeC = C(LK.fog);      // what the land and the mist go out into at the horizon
    await ctx.yield();

    // ---------- terrain ----------
    const cSand = C('#b9a077'), cMud = C('#5e4734'), cBed = C('#3a2f22'), cFloor = C('#4b4128'), cMoss = C('#36582a'), cClay = C('#7c4630'), cLitter = C('#8a7244'), cGlade = C('#9a9440');
    const terrain = await T.makeTerrainAsync({ rng: R.fork('land'), noise, path, corridor: false, height, margin: 430, cell: 3, near: 40, maxTriangles: 38000,
      biome: 'tropical', sunDir: sunV, waterLevel: WL, palette: { clouds: LK.hour === 'day' ? 0.5 : 0.25, detail: 0.2, streaks: 0.1, altAmount: 0.08, patchAmount: 0, cracks: 0.04, pebbles: 0.15 },
      color: (x, z, h, ny, out) => {
        const n = noise.n2(x * 0.045, z * 0.045) * 0.5 + 0.5, bm = barAt(x, z);
        if (h < WL - 0.3) out.copy(cBed).lerp(cMud, smoothstep(WL - 2.2, WL - 0.3, h));
        else {
          out.copy(cFloor).lerp(cMoss, n * 0.75); out.lerp(cMud, smoothstep(WL + 1.7, WL + 0.2, h));
          if (bm > 0) out.lerp(cSand, bm * smoothstep(WL - 0.25, WL + 0.5, h) * (0.8 + 0.2 * n));
        }
        if (z < 22 && Math.abs(x) < 156) out.lerp(cClay, 0.7 * smoothstep(20, 10, z) * smoothstep(8, 0, h));
        if (h > WL - 0.3 && x < -120 && z > 100) {                                    // the creek's banks lie in shade: pale leaf litter keeps them from going black
          const bk = smoothstep(16, 5, creekSD(x, z)); if (bk > 0) out.lerp(cLitter, 0.45 * bk).multiplyScalar(1 + 1.1 * bk);
          const wk = smoothstep(36, 10, Math.hypot(x - CK.x, z - CK.z)) * (0.6 + 0.4 * n); if (wk > 0) out.lerp(cGlade, 0.55 * wk).multiplyScalar(1 + 1.0 * wk);      // the clearing round the kapok: sun on moss and litter
        }
        return out;
      } }, ctx.yield);
    scene.add(terrain.object);
    const groundAt = (x, z) => Math.max(terrain.heightAt(x, z), WL);
    await ctx.yield();

    // ---------- river and creek: one sheet, flow baked per vertex ----------
    const time = { value: 0 }, fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
    const grid = async (x0, z0, x1, z1, cell, y, attr) => {      // attr(x, z) -> [a, b, c, d]; quads whose corners all have d <= 0 are dropped
      const nx = Math.round((x1 - x0) / cell), nz = Math.round((z1 - z0) / cell), pos = [], aa = [], keep = [], idx = [];
      for (let j = 0; j <= nz; j++) {
        await ctx.yield();                                         // row by row
        for (let i = 0; i <= nx; i++) {
          if ((i & 3) === 3) await ctx.yield();
          const x = x0 + i * cell, z = z0 + j * cell, a = attr(x, z);
          pos.push(x, typeof y === 'function' ? y(x, z) : y, z); aa.push(a[0], a[1], a[2], a[3]); keep.push((a[4] ?? a[3]) > 0);
        }
      }
      await ctx.yield();
      for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
        const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1;
        if (keep[a] || keep[b] || keep[c] || keep[d]) idx.push(a, c, b, b, c, d);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aData', new THREE.Float32BufferAttribute(aa, 4)); g.setIndex(idx);
      return g;
    };
    const so = {}, flowK = rain ? 1.9 : waterMode === 'low' ? 0.75 : 1, cum = [0];
    for (let i = 1; i < RIV.length; i++) cum.push(cum[i - 1] + Math.hypot(RIV[i][0] - RIV[i - 1][0], RIV[i][1] - RIV[i - 1][1]));
    const waterGeo = await grid(-640, -40, 480, 560, 10, WL, (x, z) => {
      const rd = riverSD(x, z, so), cd = creekSD(x, z), depth = WL - height(x, z), i = so.i, t = so.t;
      const dx = RIV[i + 1][0] - RIV[i][0], dz = RIV[i + 1][1] - RIV[i][1], l = Math.hypot(dx, dz), px = RIV[i][0] + dx * t, pz = RIV[i][1] + dz * t;
      const across = ((x - px) * -dz + (z - pz) * dx) / l, ck = cd < 5 && rd > -4 ? smoothstep(4, -2, cd) * smoothstep(-4, 6, rd) : 0;
      return [cum[i] + l * t, across, ck, depth + 2.2];
    });
    waterGeo.setAttribute('aFlow', new THREE.BufferAttribute(waterGeo.attributes.aData.array, 4));
    {                                                              // the shadow the forest on the sunward bank lays over the water: long under a low sun
      const P = waterGeo.attributes.position, F4 = waterGeo.attributes.aData, sh = new Float32Array(P.count), hl = Math.hypot(sunV.x, sunV.z) || 1, shx = sunV.x / hl, shz = sunV.z / hl, tanE = sunV.y / hl;
      for (let k = 0; k < P.count; k++) {
        if ((k & 31) === 0) await ctx.yield();
        if (F4.getW(k) < -1) continue;
        const x = P.getX(k), z = P.getZ(k);
        for (let d = 7; d * tanE < 30 && d < 130; d += 10) if (forestAt(x + shx * d, z + shz * d) > 0.5) { sh[k] = 1; break; }
      }
      waterGeo.setAttribute('aSh', new THREE.BufferAttribute(sh, 1));
    }
    // what feeds the river's surface, set once. The river's axis (RIV) as two straight reaches joined by an arc of 100 m radius (it
    // passes within 9 m of the axis's own two corners and its centre lies on the bar, never in the channel): the surface lays its
    // patterns in metres across and along this line, so they turn with the bend instead of being drawn out round a corner
    const fA = V3(RIV[3][0] - RIV[2][0], 0, RIV[3][1] - RIV[2][1]).normalize(), fB = V3(RIV[5][0] - RIV[4][0], 0, RIV[5][1] - RIV[4][1]).normalize();
    const bendTh = Math.acos(clamp(fA.dot(fB), -1, 1)), bendR = 100, bendS = ((RIV[4][0] - RIV[2][0]) * fB.z - (RIV[4][1] - RIV[2][1]) * fB.x) / (fA.x * fB.z - fA.z * fB.x);
    const bendI = V3(RIV[2][0] + fA.x * bendS, 0, RIV[2][1] + fA.z * bendS), bendC = bendI.clone().addScaledVector(fB.clone().sub(fA).normalize(), bendR / Math.cos(bendTh / 2)), bendT = bendR * Math.tan(bendTh / 2);
    const rA = bendI.clone().addScaledVector(fA, -bendT).sub(bendC).divideScalar(bendR), rB = bendI.clone().addScaledVector(fB, bendT).sub(bendC).divideScalar(bendR);
    // the wall as the river mirrors it: its own beds (seed and colours read off its material), the plane its face leans in, its rim's
    // height and the shadows its gullies cast under this sun at three heights, every 6.4 m along it (traced as the wall bakes its own)
    let wallU = null; hero.object.traverse((o) => { if (o.material && o.material.uniforms && o.material.uniforms.uSeedF) wallU = o.material.uniforms; });
    const gul = []; let zLo = 0, zHi = 0, hMid = 0, nMid = 0;
    for (let k = 0; k < 48; k++) {
      const x = clamp(-150 + 300 * k / 47, -149.5, 149.5), H = hero.rimY(x), v = [1, 1, 1];
      for (let j = 0; j < 3; j++) {
        const y = (0.2 + 0.3 * j) * H, z = hero.faceZ(x, y); let pen = 0;
        for (let s = 1; s <= 34; s++) {
          const qx = x + sunV.x * s, qy = y + sunV.y * s, zf = hero.faceZ(qx, qy);
          if (zf < -900) { if (qx < -150 || qx > 150 || qy > hero.rimY(qx)) break; continue; }
          pen = Math.max(pen, zf - (z + sunV.z * s) - 0.02 * s);
        }
        v[j] = 1 - smoothstep(0, 0.8, pen);
      }
      if (Math.abs(x) < 110) { zLo += hero.faceZ(x, 0.15 * H); zHi += hero.faceZ(x, 0.85 * H); hMid += H; nMid++; }
      gul.push(new THREE.Vector4(v[0], v[1], v[2], H));
    }
    const wLean = (zLo - zHi) / (0.7 * hMid), wZ0 = zLo / nMid + wLean * 0.15 * hMid / nMid, wNor = V3(0, wLean, 1).normalize(), wNl = Math.max(wNor.dot(sunV), 0.05), wetK = lerp(1, 0.7, wallU ? wallU.uWet.value : 0);     // (wetK: the wall's own wetness, uWet, by the wall's own law of it: its clay 0.7 as bright when wet)
    const wSunC = wallU ? wallU.uSunCol.value : C(LK.sunCol, LK.heroSun), wSkyC = wallU ? wallU.uSkyCol.value : C(LK.hemiSky), wGndC = wallU ? wallU.uGndCol.value : C(LK.hemiGnd, 0.26), wClay = wallU ? wallU.uClay.value : C(PAL[0]);
    // the banks as the river mirrors them, in the frame the surface is laid in (a metres across, s along the current): every 40 m
    // along it, from 360 m above the bend to 440 m below, each bank's forest line (the first closed forest out from the axis, looked
    // for every 2 m) and the height of the canopy 20 m behind it (the canopy shell's own law of the land). Under the clay wall there
    // is no bank: the wall and the forest on its rim are mirrored by their own lines, and the tree line runs down to nothing there
    const arcL = bendR * bendTh, flowP = (a, s) => {
      if (s <= 0) return [bendC.x + rA.x * (bendR + a) + fA.x * s, bendC.z + rA.z * (bendR + a) + fA.z * s];
      if (s >= arcL) return [bendC.x + rB.x * (bendR + a) + fB.x * (s - arcL), bendC.z + rB.z * (bendR + a) + fB.z * (s - arcL)];
      const c = Math.cos(s / bendR), sn = Math.sin(s / bendR); return [bendC.x + (rA.x * c + fA.x * sn) * (bendR + a), bendC.z + (rA.z * c + fA.z * sn) * (bendR + a)];
    };
    const bank = [], leafG = C('#5c8a30', 1.5), sctC = C(LK.scatter), ax7 = V3(RIV[7][0], 0, RIV[7][1]).sub(bendC), crAmb = C('#3a5a26', 0.85).lerp(C(LK.hemiGnd), 0.25).multiplyScalar(1.6).add(C(LK.hemiSky, LK.hemiI * 0.6)).multiplyScalar(0.5);
    for (let k = 0; k < 24; k++) {
      const s = -360 + 40 * k, v = [120, 120, 0, 0];
      for (let j = 0; j < 2; j++) {
        const sgn = j ? -1 : 1, aMax = j && s > 0 && s < arcL ? bendR - 6 : 260;
        for (let a = 0; a <= aMax; a += 2) {
          const [x, z] = flowP(sgn * a, s);
          if (forestAt(x, z) <= 0.5) continue;
          if (Math.abs(x) < 156 && z < 20) { if (bank.length) v[j] = bank[bank.length - 1].getComponent(j); break; }
          const [hx, hz] = flowP(sgn * Math.min(a + 20, aMax), s), b = Math.max(height(hx, hz), 0);
          v[j] = a; v[2 + j] = b + lerp(27.5, 13, smoothstep(6, 20, b)) + 4.5 * noise.fbm2(hx * 0.012, hz * 0.012 + 9, 3); break;
        }
      }
      bank.push(new THREE.Vector4(v[0], v[1], v[2], v[3]));
    }
    // (round 21: the look's own share of a sea of mist, 0 = rags (the clear morning) .. 1 = a sea: the look's deck by the law
    // the file has for it further down (dkN), taken here because the river and the canopy are fed before that line)
    const seaN = smoothstep(0.3, 0.9, LK.deck);
    const clayC = C(PAL[0]), wSun = sunCol.clone().lerp(C('#ffffff'), LK.hour === 'golden' ? 0.5 : 0);     // late light is too orange to multiply brown water and red clay by: it turns the river wine red
    const waterU = { ...fogU(), uTime: time, uSunVis: { value: LK.waterSun }, uShadowY: { value: LK.shadowY + WL }, uFast: { value: rain ? 1 : 0 }, uFlowV: { value: 2.3 * flowK }, uSunDir: { value: sunV }, uSunCol: { value: wSun.clone().multiplyScalar(LK.sunI * 0.7) },
      uZen: { value: C(LK.zenith, LK.hour === 'day' ? 0.95 : 0.85) }, uHor: { value: LK.hour === 'day' ? C(LK.mid).lerp(C(LK.horizon), 0.4).multiplyScalar(0.86) : C(LK.horizon, 0.8) }, uSilt: { value: C(LK.water, 1.25) }, uBlack: { value: C('#20170d') }, uSand: { value: C('#8f7852') },
      uClay: { value: clayC.clone().multiply(wSun).multiplyScalar(1.15).lerp(C(LK.horizon), LK.hour === 'golden' ? 0.3 : 0.12) }, uClayShade: { value: clayC.clone().multiply(C(LK.hemiSky)).multiplyScalar(0.7) },
      uGreen: { value: C('#182a12').lerp(C(LK.fog), 0.12) }, uAmb: { value: C(LK.hemiSky, 0.36).add(C('#7a6248', 0.72)) },
      uLeafLit: { value: C('#5c8a30').multiply(wSun).multiplyScalar(0.55).lerp(C(LK.fog), 0.15) }, uCk: { value: new THREE.Vector4(rgt.x, rgt.z, CK.x, CK.z) },
      uBirdK: { value: 1 }, uCliffR: { value: clamp(1.25 - 0.6 * LK.mist, 0.35, 1) }, uDeckY: { value: 35 + WL }, uMistC: { value: C(LK.deckCol, 0.8) } };
    // (what the river's surface is fed besides: added to the same uniforms, so that the lines above stand as they were. uCliffR,
    // uClay and uClayShade are still fed above and the surface no longer reads them)
    Object.assign(waterU, {
      uSeaK: { value: seaN },
      uFlow: { value: new THREE.Vector4(fA.x, fA.z, fB.x, fB.z) }, uRad: { value: new THREE.Vector4(rA.x, rA.z, rB.x, rB.z) }, uBend: { value: new THREE.Vector4(bendC.x, bendC.z, bendR, bendR * bendTh) },
      uSkyH: { value: C(LK.horizon) }, uSkyM: { value: C(LK.mid) }, uSkyZ: { value: C(LK.zenith) }, uSkyP: { value: new THREE.Vector2(sky.options.horizonPow, sky.options.midPow) }, uCir: { value: C(LK.cirrus) },      // (the sky's own exponents, read off the sky as it is built)
      uHaze: { value: new THREE.Vector4(hazeC.r, hazeC.g, hazeC.b, LK.fogD) }, uGul: { value: gul }, uBank: { value: bank },
      // (the kapoks' crowns as they are built: the second one's umbrella 40 m in radius and 8 m either way about 77 m up, on a bole
      // 2.2 m thick there; the first one's dome 20 m in radius and 7 m either way about 49 m up, its bole 1 m)
      uKap: { value: [new THREE.Vector4(K2.x, K2.z, 77, 40), new THREE.Vector4(CK.x, CK.z, 49, 20)] }, uKapV: { value: new THREE.Vector2(40 / 8, 20 / 7) }, uKapT: { value: new THREE.Vector2(2.2, 1) },
      // (the crowns' green in the mirror by the crowns' own law of light, the leaf cushions' material further down: their common
      // green '#5c8a30' at 1.5, at that material's albedo 0.8 and the mean 0.875 of its leaf-to-leaf tone (0.7); crAmb: the light
      // it gives an upright face, half its sky (0.6 of the look's) and half its ground light (1.6 of its ground green). Lit: the sun
      // at the material's 0.4 on a face turned to it, and crAmb at the 1.1 of an open face; shade: crAmb at 0.85, a face halfway into
      // the mass. Nothing here is fitted to a picture: every look's light makes its own greens)
      uBankL: { value: leafG.clone().multiplyScalar(0.7).multiply(sunCol.clone().multiplyScalar(LK.sunI * 0.4).add(crAmb.clone().multiplyScalar(1.1))) },
      uBankS: { value: leafG.clone().multiplyScalar(0.7).multiply(crAmb.clone().multiplyScalar(0.85)) },
      // (the sky's glow round the sun: the look's own scatter colour and the sky's own power, amount, share at the zenith and fall
      // with height, read off the sky as it is built. uAir, uMistL and uBed are filled further down, where the wind, the river's
      // mist and the bar's sand are built, from those things themselves. uAxis: the hand-over to the river's baked axis at the
      // wall's downstream end, RIV[7]: the sense of the baked metres across, and the frame's own metres across and along at that
      // point of the axis, where the baked ones read 0 and cum[7])
      uSct: { value: new THREE.Vector4(sctC.r, sctC.g, sctC.b, sky.options.scatterPow) }, uSctK: { value: new THREE.Vector3(sky.options.scatter, sky.options.scatterHigh, sky.options.scatterFall) },
      uAir: { value: new THREE.Vector4() }, uMistL: { value: new THREE.Vector2() }, uBed: { value: C('#000000') },
      uAxis: { value: new THREE.Vector4(Math.sign(-rB.x * fB.z + rB.z * fB.x) || 1, ax7.dot(rB) - bendR, bendR * bendTh + ax7.dot(fB) - cum[7], bendR * bendTh + ax7.dot(fB)) },
      uWall: { value: new THREE.Vector4(wZ0, wLean, wallU ? wallU.uSeedF.value : 0, 0.967 * sunV.x / wNl) },   // foot plane, lean, bed seed, how hard the sun rakes a flute's side
      uWallC: { value: wClay.clone() }, uWallO: { value: wallU ? wallU.uOchre.value.clone() : C(PAL[5]) }, uWallG: { value: wallU ? wallU.uGrey.value.clone() : C('#9a948c') },
      uWallL: { value: wSunC.clone().multiplyScalar(wNl * wetK) }, uWallA: { value: wGndC.clone().lerp(wSkyC, wNor.y * 0.5 + 0.5).multiplyScalar(0.9 * wetK) },
      uWallB: { value: wClay.clone().multiply(wSunC).multiplyScalar(0.3).add(wSkyC.clone().multiplyScalar(0.22)).multiplyScalar(0.9 * wetK) } });
    const water = new THREE.Mesh(waterGeo, new THREE.ShaderMaterial({ uniforms: { ...waterU, uReflK: { value: LK.hour === 'day' ? 0.88 : 0.8 }, uFoamK: { value: LK.hour === 'day' ? 0.28 : 0.4 } }, fog: true, transparent: true, depthWrite: false,
      vertexShader: WORLD_VERT('attribute vec4 aFlow; attribute float aSh; varying float vDepth, vShade; varying vec3 vFlow;', 'vDepth = aFlow.w - 2.2; vFlow = aFlow.xyz; vShade = aSh;'), fragmentShader: WATER_FRAG }));
    water.renderOrder = 1; water.frustumCulled = false; scene.add(water);
    await ctx.yield();

    // ---------- the closed canopy as a shell, and the mist lying on it ----------
    const shellY = (x, z) => { const b = Math.max(height(x, z), 0); return b + lerp(27.5, 13, smoothstep(6, 20, b)) + 4.5 * noise.fbm2(x * 0.012, z * 0.012 + 9, 3) + 2.2 * noise.n2(x * 0.045, z * 0.045); };
    // the forest's outer edge (river, bar, cliff lip) comes down to the bank as a curtain of crowns; round the creek and the light
    // well, where the camera goes inside, the shell keeps its height and is simply cut away
    const outerAt = (x, z) => { const m = smoothstep(2, 13, riverSD(x, z)) * (1 - smoothstep(0.15, 0.6, barAt(x, z)));
      return Math.abs(x) < 152 && z < 12 ? m * smoothstep(8, -4, z - hero.faceZ(clamp(x, -149, 149), hero.rimY(clamp(x, -149, 149)) * 0.995) + 8) : m; };
    const insideAt = (x, z) => Math.max(1 - smoothstep(24, 40, creekSD(x, z)), 1 - smoothstep(46, 62, Math.hypot(x - CK.x, z - CK.z)));
    const cliffK = (x, z) => { if (z >= 12 || Math.abs(x) > 215) return 1; const cx = clamp(x, -149, 149);
      return lerp(smoothstep(6, -34, z - hero.faceZ(cx, hero.rimY(cx) * 0.995) + 8), 1, Math.max(smoothstep(150, 215, Math.abs(x)), smoothstep(-28, 12, z))); };
    const skirtAt = (x, z) => 1 - Math.pow(1 - Math.min(smoothstep(2, 44, riverSD(x, z)), smoothstep(22, 52, polySD(BAR, x, z))) * cliffK(x, z), 2.4);
    const bendAt = skirtAt;
    const shellH = (x, z) => lerp(Math.max(height(x, z), WL) + 1.2, shellY(x, z), skirtAt(x, z));
    const lowPts = []; for (let i = 0; i <= 200; i++) { const q = path.pointAt(i / 200 * 0.662); lowPts.push(q.x, q.z); }
    const lowDist = (x, z) => { let b = 1e9; for (let i = 0; i < lowPts.length; i += 2) { const dx = lowPts[i] - x, dz = lowPts[i + 1] - z, d = dx * dx + dz * dz; if (d < b) b = d; } return Math.sqrt(b); };
    const lowDist2 = (x, z) => { let b = 1e9; for (let i = 300; i < lowPts.length; i += 2) { const dx = lowPts[i] - x, dz = lowPts[i + 1] - z, d = dx * dx + dz * dz; if (d < b) b = d; } return Math.sqrt(b); };
    const shellGeo = await grid(-720, -420, 580, 740, 14, shellH, (x, z) => {
      const ins = insideAt(x, z), o = outerAt(x, z), sk = skirtAt(x, z);
      const m = lerp(1, smoothstep(5, 15, creekSD(x, z)) * smoothstep(38, 48, Math.hypot(x - CK.x, z - CK.z)) * smoothstep(34, 50, polySD(BAR, x, z)) * smoothstep(8, 24, riverSD(x, z)), ins) * smoothstep(9, 19, path.distanceTo(x, shellH(x, z), z))
        * lerp(smoothstep(22, 45, lowDist(x, z)), 1, smoothstep(0.8, 0.98, sk)) * lerp(smoothstep(45, 85, lowDist2(x, z)), 1, smoothstep(0.92, 0.995, sk));   // no skirt close beside the low flight: real trees stand there
      const gx = skirtAt(x + 7, z) - skirtAt(x - 7, z), gz = skirtAt(x, z + 7) - skirtAt(x, z - 7), gl = Math.hypot(gx, gz);
      const keep = Math.max(o, outerAt(x + 14, z), outerAt(x - 14, z), outerAt(x, z + 14), outerAt(x, z - 14));
      return [m, sk, gl > 1e-3 ? -gx / gl : 0, gl > 1e-3 ? -gz / gl : 0, Math.min(keep - 0.02, m - 0.12)];
    });
    const greenA = C(PAL[4]).multiplyScalar(0.9), greenB = C('#4d7a2a');
    // (round 21) what the canopy's own mist is fed, once. THE MAP OF THE PLACE: the canopy's whole rectangle seen from above, 512 by
    // 512 (2.5 m by 2.3 m to a cell, with its own coarser levels, so that far off it stands at its mean and nothing under a pixel
    // is left to shimmer): the crowns' shadows, the emergents' hollows and the canopy's own domes; it is filled further down, when
    // every crown stands. THE BILLOWS (bilTex): a tile 800 m across, 256 by 256, that repeats: three sets of smooth noise, 100 m,
    // 33 m and 11 m across and 3.2, 1.6 and 0.6 m high, with their slope, filled further down too. THE MIST'S TOP (uRag.z): 35 m
    // in a look whose deck is full, the deck's own height over the canopy (which does not rise with the river), 5.6 m lower
    // for each unit of deck less, and up to 2.9 m lower again as the look's mist is burned from a sea to rags (by the square
    // of what the look's share of a sea, seaN, lacks): 28.7 m on the clear morning (deck 0.36), 32.0 m in the golden look,
    // 35 m at dawn, 36.4 m after rain. The canopy's own top lies between 27.1 and 34.2 m (seed 7, the 2nd and the 97th
    // hundredth of its top's heights; half of it under 30.6 m), each crown's dome 1.9 m over that in the mean, and its gaps
    // 2.1 m under it: so by day the mist lies in the gaps between the crowns of the lower half of the land, widest in its
    // lowest fifth and in the emergents' hollows, and over the crowns' tops almost nowhere (a hundredth of the far land in
    // the exit's views, measured), and at dawn it stands over nine tenths of them. Its colours
    // are the deck's own, by the deck's own law of its lit and its shaded side. The wind it drifts on is filled where the wind is made
    const SHN = 512, shadData = new Uint8Array(SHN * SHN * 4), shadTex = new THREE.DataTexture(shadData, SHN, SHN, THREE.RGBAFormat, THREE.UnsignedByteType);
    shadTex.magFilter = THREE.LinearFilter; shadTex.minFilter = THREE.LinearMipmapLinearFilter; shadTex.generateMipmaps = true; shadTex.needsUpdate = true;
    const BIN = 256, bilData = new Uint8Array(BIN * BIN * 4), bilTex = new THREE.DataTexture(bilData, BIN, BIN, THREE.RGBAFormat, THREE.UnsignedByteType);
    bilTex.wrapS = bilTex.wrapT = THREE.RepeatWrapping; bilTex.magFilter = THREE.LinearFilter; bilTex.minFilter = THREE.LinearMipmapLinearFilter; bilTex.generateMipmaps = true; bilTex.needsUpdate = true;
    const shell = new THREE.Mesh(shellGeo, new THREE.ShaderMaterial({ fog: true, side: THREE.DoubleSide,
      uniforms: { ...fogU(), uTime: time, uIpe: { value: waterMode === 'low' ? 0.93 : 0.975 }, uSunDir: { value: sunV }, uSunCol: { value: sunCol.clone().multiplyScalar(LK.sunI * 0.85) },
        uSky: { value: C(LK.hemiSky, 0.75) }, uGnd: { value: C('#1c2a16') }, uG1: { value: greenA }, uG2: { value: greenB }, uYel: { value: C('#c9a012') },
        uSeaK: { value: seaN }, uRag: { value: new THREE.Vector3(0, 0, 35 - 5.6 * (1 - LK.deck) - 2.9 * (1 - seaN) * (1 - seaN)) }, uRagL: { value: C(LK.deckCol, 0.86).multiply(sunCol.clone().multiplyScalar(0.12).addScalar(0.84)) }, uRagS: { value: C(LK.deckShade, 0.8 * 0.9) },
        uShad: { value: shadTex }, uBil: { value: bilTex }, uShadO: { value: new THREE.Vector4(-720, -420, 1 / 1300, 1 / 1160) },
        // (round 21: uMistK feeds the wash that reads the eye's height (hiCam, in the shader's "sinks into it" line) and now feeds it
        // LESS, by the look's own deck: the wash is the sea's. It was Math.min(1, LK.deck): an even 0.36 of cream over all the
        // canopy by day, whatever its relief; it is that times the look's share of a sea: all of it at dawn and after rain, half
        // in the golden look, next to nothing on the clear morning, where the mist is the rags in the hollows instead)
        uHaze: { value: hazeC }, uMist: { value: C(LK.deckCol, 0.8) }, uMistK: { value: Math.min(1, LK.deck) * seaN }, uDeckY: { value: 35 + WL } },
      vertexShader: WORLD_VERT('attribute vec4 aData; varying float vMask; varying vec3 vBend;', 'vMask = aData.x; vBend = aData.yzw; p.y += 0.35 * aData.y * sin(uTime * 0.8 + p.x * 0.07 + p.z * 0.05);'), fragmentShader: SHELL_FRAG }));
    shell.frustumCulled = false; scene.add(shell);
    await ctx.yield();
    const dkN = smoothstep(0.3, 0.9, LK.deck);                     // 0 = rags (the clear morning) .. 1 = a sea of mist
    const DECK_Y = 35 + WL, deckU = (off, amt) => ({ ...fogU(), uTime: time, uSeaK: { value: seaN }, uGiants: { value: new THREE.Vector4(CK.x, CK.z, K2.x, K2.z) }, uReach: { value: 0 }, uAmt: { value: amt }, uOff: { value: off }, uSunDir: { value: sunV }, uSunCol: { value: sunCol },
      uHaze: { value: hazeC }, uCol: { value: C(LK.deckCol, 0.86) }, uShade: { value: C(LK.deckShade, 0.8) } });
    const decks = [];
    for (const [dy, cell, off, amt] of [[0, 75, 0, LK.deck], [-3.2, 150, 4.7, LK.deck * 0.8]]) {
      const g = await grid(-1500, -1500, 1500, 1500, cell, DECK_Y + dy, (x, z) => [smoothstep(-5, 40, riverSD(x, z)) * (1 - 0.9 * barAt(x, z)), 0, 0, 1]);
      const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: deckU(off, amt), fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
        vertexShader: WORLD_VERT('attribute vec4 aData; varying float vMask;', 'vMask = aData.x;'), fragmentShader: DECK_FRAG }));
      m.renderOrder = 4; m.frustumCulled = false; scene.add(m); decks.push(m);
    }
    await ctx.yield();

    // ---------- forest: kit broadleaves stretched into rainforest trees, plus bare boles under the shell ----------
    const wind = flora.makeWind({ direction: [-0.8, 0.45], strength: rain ? 0.6 : 0.85 });
    await ctx.yield();
    const matOpts = { wind, backlight: 1.0, ambient: 1.9, leafAmbient: 1.7, detail: 0.5 };
    if (flora.prepareLeafTexture) await flora.prepareLeafTexture(matOpts, ctx.yield);            // kit: the leaf atlas in short steps, so windMaterial draws nothing
    const mat = flora.windMaterial(matOpts);
    await ctx.yield();
    // crowns have a material of this world's (CUSH_*): leaf cushions lit by the same sun and sky as the kit's plants, with mist by
    // height, so a crown standing in the mist deck fades into it instead of cutting a waterline
    const windV = new THREE.Vector2(-0.8, 0.45).normalize().multiplyScalar(rain ? 0.6 : 0.85);
    shell.material.uniforms.uRag.value.x = windV.x; shell.material.uniforms.uRag.value.y = windV.y;       // (round 21: the canopy's mist drifts on the look's own wind, this one, at its own strength in m/s)
    const cushMaterial = (mistK) => new THREE.ShaderMaterial({ fog: true, side: THREE.DoubleSide, alphaToCoverage: true, vertexShader: CUSH_VERT, fragmentShader: CUSH_FRAG,
      uniforms: { ...fogU(), uTime: time, uLeaf: { value: 0.29 }, uWind: { value: windV }, uAlb: { value: 0.8 }, uSunDir: { value: sunV }, uSun: { value: sunCol.clone().multiplyScalar(LK.sunI * 0.4) },
        uSky: { value: C(LK.hemiSky, LK.hemiI * 0.6) }, uGnd: { value: C('#3a5a26', 0.85).lerp(C(LK.hemiGnd), 0.25) }, uCrMist: { value: C(LK.deckCol, 0.84) }, uCrDeck: { value: new THREE.Vector3(DECK_Y, mistK, 0) } } });
    const crownMat = cushMaterial(Math.min(1, LK.deck)), bankMat = cushMaterial(0);
    const fr = R.fork('trees');
    const oak = async (d, leaf, light, dark, s) => {
      const g = flora.oakGeometry({ rng: fr.fork('oak' + s), detail: d, height: 14, leaf, leafLight: light, leafDark: dark, bark: '#6b6557', barkDark: '#37322a' });
      await ctx.yield();
      return tallTree(g, 3.4, 1.25, 1.9);
    };
    const oakCols = [['#2f6a2c', '#7fae3c', '#173d1c'], ['#40752e', '#a3c24a', '#1f4520'], ['#28603a', '#6fa650', '#143a24']], nearV = [], farV = [];
    for (const [d, list] of [[1, nearV], [0, farV]]) for (let s = 0; s < 3; s++) { await ctx.yield(); list.push(await oak(d, ...oakCols[s], s + 1)); }
    const solid = [nearV[0].attributes.uv.getX(0), nearV[0].attributes.uv.getY(0)];
    await ctx.yield();
    const forest = flora.makeForest({ rng: R.fork('forest'), path, heightAt: groundAt, material: mat, variants: nearV, farVariants: farV, farDistance: 34,
      count: Math.round(142 * (0.75 + 0.25 * density) * (0.7 + 0.3 * detail)), radius: 340, corridor: 11, spacing: 3.6, scale: [0.95, 1.5], falloff: 0.25, chunks: 5, cullDistance: 560, tint: 0.2, hue: 0.05,
      density: (x, z) => {
        const f = forestAt(x, z); if (f < 0.6) return 0;
        const dk = Math.hypot(x - CK.x, z - CK.z); if (dk < 46 || Math.hypot(x - K2.x, z - K2.z) < 15) return 0;
        const edge = Math.max(0.3 * (1 - smoothstep(6, 30, riverSD(x, z))), 1 - smoothstep(6, 30, creekSD(x, z)), 1 - smoothstep(46, 72, dk), 0.6 * (1 - smoothstep(20, 46, polySD(BAR, x, z) - 25)) * smoothstep(-150, -40, -Math.abs(x + 90)));
        return 0.05 + 0.95 * edge;
      } });
    scene.add(forest.object);
    await ctx.yield();
    const PGm = new PG(solid), barkA = [0.2, 0.185, 0.15], barkB = [0.12, 0.118, 0.095], barkM = [0.09, 0.13, 0.06];
    // bark colour along a limb or bole: grey mottled with darker wood and moss on the upper side (never striped by side)
    const barkMix = (v, s, k = 1) => { const n = 0.5 + 0.5 * noise.n2(v * 0.55 + s * 0.37, s * 1.9 + v * 0.11), m = smoothstep(0.55, 0.85, 0.5 + 0.5 * noise.n2(v * 0.23 + 40, s * 0.9));
      return [lerp(lerp(barkB[0], barkA[0], n), barkM[0], m * 0.7) * k, lerp(lerp(barkB[1], barkA[1], n), barkM[1], m * 0.7) * k, lerp(lerp(barkB[2], barkA[2], n), barkM[2], m * 0.7) * k]; };
    {
      const br = R.fork('boles'), nB = Math.round(170 * (0.6 + 0.4 * detail));
      for (let k = 0, tries = 0; k < nB && tries < nB * 30; tries++) {
        await ctx.yield();                                         // a bole at a time
        const a = br() * TAU, rr = 34 + 130 * Math.sqrt(br()), cx = br.chance(0.6) ? CK.x : lerp(G1.x, E.x, br()), cz = cx === CK.x ? CK.z : lerp(G1.z, E.z, (cx - G1.x) / (E.x - G1.x));
        const x = cx + Math.cos(a) * rr * (cx === CK.x ? 1 : 0.5), z = cz + Math.sin(a) * rr * (cx === CK.x ? 1 : 0.5);
        if (forestAt(x, z) < 0.95 || forestAt(x + 9, z) < 0.9 || forestAt(x - 9, z) < 0.9 || forestAt(x, z + 9) < 0.9 || forestAt(x, z - 9) < 0.9 || path.nearestXZ(x, z).dist < 12 || Math.hypot(x - K2.x, z - K2.z) < 12) continue;
        if (bendAt(x, z) < 0.8) continue;
        const y0 = groundAt(x, z) - 0.4, top = shellH(x, z) - 1, r0 = br.range(0.3, 0.9), lean = br.range(-1.5, 1.5), sh = br.range(0.75, 1.15);
        const hB = top - y0, flare = br.range(1.9, 2.8);
        PGm.tube([V3(x, y0, z), V3(x + lean * 0.05, y0 + 0.9, z), V3(x + lean * 0.2, y0 + 3, z), V3(x + lean * 0.6, y0 + hB * 0.3, z + lean * 0.3), V3(x + lean, y0 + hB * 0.6, z + lean * 0.5), V3(x + lean * 1.4, top, z + lean)],
          (t, a) => r0 * lerp(1, 0.6, t) * (1 + (flare - 1) * Math.exp(-t * hB / 1.3) * (0.6 + 0.4 * Math.abs(Math.sin(a * 2.5 + x)))), 8,
          (t, s) => barkMix(t * hB + x, s + z, sh * (0.55 + 0.4 * t)), 0);
        k++;
      }
    }

    await ctx.yield();
    // ---------- crowns: the canopy's outer skin where the camera sees it close, and the walls of trees along every bank ----------
    // a crown is a lumpy dome of leaf masses of radius 1, lit by the scene sun (a lit side and a shadow side), fringed with leaf
    // cards; bank trees carry a dark trunk down to the ground
    const cr = R.fork('crowns');
    // (the generator `cr` laid the old lumpy domes before it placed the crowns: the same number of draws is taken from it here,
    // so that every crown stands where it stood)
    const crownBurn = (L, seg, cards, trunk, sides = seg * 2) => { let n = 3 + 5 * (L - 1) + L * (2 * seg * sides + 6) + 8 * cards + 8 * Math.round(cards * 0.3) + (trunk ? 1 : 0); while (n-- > 0) cr(); };
    const cg = ctx.core.makeRng('macaw-cushion:' + ctx.seed), QUAD = [[-1, -1], [1, -1], [1, 1], [-1, 1]], AX = V3(1, 0, 0), AY = V3(0, 1, 0);
    // a crown of radius 1: `lobes` cushions, `cards` leaf sprays of half width hs0..hs1, a core of seg x sides, a trunk of that length
    const cushionGeometry = (lobes, cards, seg, sides, trunk, hs0, hs1) => {
      const pos = [], nor = [], ac = [], ao = [], idx = [], lob = [];
      for (let l = 0; l < lobes; l++) {
        const a = l === 0 ? 0 : ((l - 1 + cg.range(0.15, 0.85)) / (lobes - 1)) * TAU, d = l === 0 ? 0 : cg.range(0.4, 0.66), r = l === 0 ? cg.range(0.58, 0.7) : cg.range(0.3, 0.46);
        lob.push([Math.cos(a) * d, l === 0 ? 0.1 : cg.range(-0.1, 0.14), Math.sin(a) * d, r, r * cg.range(0.66, 0.92)]);
      }
      // the core: one lumpy ball inside the leaves (the lobes' hull drawn in, flatter below)
      const sup = (dx, dy, dz) => { let m = 0; for (const [cx, cy, cz, r, h] of lob) { const hh = dy < 0 ? h * 0.62 : h; m = Math.max(m, cx * dx + cy * dy + cz * dz + Math.sqrt(r * r * (dx * dx + dz * dz) + hh * hh * dy * dy)); } return m; };
      const hc = cg(), cv = (dx, dy, dz) => { const Rr = 0.7 * sup(dx, dy, dz) * cg.range(0.92, 1.08), nl = Math.hypot(dx, dy + 0.15, dz) || 1;
        pos.push(dx * Rr, dy * Rr + 0.02, dz * Rr); nor.push(dx / nl, (dy + 0.15) / nl, dz / nl); ac.push(0, 0, 0, hc); ao.push(0.35 + 0.45 * smoothstep(-0.7, 0.8, dy), 0); };
      cv(0, 1, 0);
      for (let j = 1; j < seg; j++) { const ph = (j / seg) * Math.PI; for (let k = 0; k < sides; k++) { const th = (k / sides) * TAU + j * 0.4; cv(Math.cos(th) * Math.sin(ph), Math.cos(ph), Math.sin(th) * Math.sin(ph)); } }
      cv(0, -1, 0);
      for (let k = 0; k < sides; k++) idx.push(0, 1 + (k + 1) % sides, 1 + k);
      for (let j = 1; j < seg - 1; j++) for (let k = 0; k < sides; k++) { const a0 = 1 + (j - 1) * sides + k, a1 = 1 + (j - 1) * sides + (k + 1) % sides; idx.push(a0, a1, a1 + sides, a0, a1 + sides, a0 + sides); }
      { const last = 1 + (seg - 2) * sides, bot = 1 + (seg - 1) * sides; for (let k = 0; k < sides; k++) idx.push(bot, last + k, last + (k + 1) % sides); }
      // the sprays: on the cushions' surfaces, down to under their rims; four in ten lie along the surface (the cover), the rest stand
      // at any angle (the ragged outline). Each carries the direction out of its cushion, rounded off a little across the quad
      const wts = lob.map((q) => q[3] * q[3]), wsum = wts.reduce((a, b) => a + b, 0), Nn = V3(), F = V3(), T1 = V3(), T2 = V3(), P0 = V3(), Rn = V3(), Ns = V3();
      for (let c = 0; c < cards; c++) {
        let l = 0, pk = cg() * wsum; while (l < lobes - 1 && pk > wts[l]) { pk -= wts[l]; l++; }
        const [cx, cy, cz, r, h] = lob[l];
        let cph = 0, crease = 1;
        for (let t = 0, ok = false; t < 6 && !ok; t++) {
          const th = cg() * TAU; cph = cg.range(-0.5, 1); const sph = Math.sqrt(1 - cph * cph), k = cg.range(0.84, 1.0), hh = cph < 0 ? h * 0.62 : h;
          Nn.set(Math.cos(th) * sph, cph, Math.sin(th) * sph); P0.set(cx + Nn.x * r * k, cy + Nn.y * hh * k, cz + Nn.z * r * k);
          let near = 9;
          for (let m = 0; m < lobes; m++) if (m !== l) { const q = lob[m], ex = (P0.x - q[0]) / q[3], ey = (P0.y - q[1]) / q[4], ez = (P0.z - q[2]) / q[3]; near = Math.min(near, ex * ex + ey * ey + ez * ez); }
          ok = near > 0.55; crease = smoothstep(0.7, 1.25, Math.sqrt(near));
        }
        Rn.set(cg.range(-1, 1), cg.range(-1, 1), cg.range(-1, 1)).normalize();
        if (cg() < 0.4) F.copy(Nn).addScaledVector(Rn, 0.35).normalize(); else { F.copy(Rn).addScaledVector(Nn, 0.45); F.y += 0.3; F.normalize(); }
        T1.crossVectors(F, Math.abs(F.y) > 0.9 ? AX : AY).normalize(); T2.crossVectors(F, T1);
        const hs = cg.range(hs0, hs1) * (l === 0 ? 1.12 : 1), hsh = cg(), fl = cg.range(0.5, 1), aoC = (0.3 + 0.7 * smoothstep(-0.55, 0.6, cph)) * (0.55 + 0.45 * crease), b = pos.length / 3;
        Ns.set(P0.x, P0.y + 0.25, P0.z).normalize().multiplyScalar(0.5).addScaledVector(Nn, 0.7); Ns.y += 0.12;
        for (const [qx, qy] of QUAD) {
          const ox = T1.x * qx + T2.x * qy, oy = T1.y * qx + T2.y * qy, oz = T1.z * qx + T2.z * qy, nx = Ns.x + 0.3 * ox, ny = Ns.y + 0.3 * oy, nz = Ns.z + 0.3 * oz, nl = Math.hypot(nx, ny, nz) || 1;
          pos.push(P0.x + ox * hs, P0.y + oy * hs, P0.z + oz * hs); nor.push(nx / nl, ny / nl, nz / nl); ac.push(qx, qy, hs, hsh); ao.push(aoC, fl);
        }
        idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
      }
      if (trunk) {
        const lean = cg.range(-0.1, 0.1), b0 = pos.length / 3, S = 5, ys = [-trunk, -trunk * 0.5, 0.1], rs = [0.075, 0.05, 0.04];
        ys.forEach((y, j) => {
          for (let k = 0; k < S; k++) { const a = (k / S) * TAU; pos.push(lean * (1 - j / 2) + Math.cos(a) * rs[j], y, lean * 0.6 * (1 - j / 2) + Math.sin(a) * rs[j]); nor.push(Math.cos(a), 0, Math.sin(a)); ac.push(0, 0, -1, 0); ao.push(0.5 + 0.25 * j, 0); }
          if (j) for (let k = 0; k < S; k++) { const a = b0 + (j - 1) * S + k, b = b0 + (j - 1) * S + (k + 1) % S; idx.push(a, b, b + S, a, b + S, a + S); }
        });
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
      geo.setAttribute('aC', new THREE.Float32BufferAttribute(ac, 4)); geo.setAttribute('aO', new THREE.Float32BufferAttribute(ao, 2)); geo.setIndex(idx); geo.computeBoundingSphere();
      geo.boundingSphere.radius += 0.5;
      geo.userData = { triangles: idx.length / 3, height: 1, radius: 1, kind: 'crown' };
      return geo;
    };
    crownBurn(5, 3, 28, 0, 8); crownBurn(5, 3, 24, 0, 8); crownBurn(3, 2, 9, 0, 6); crownBurn(3, 2, 8, 0, 6);
    const crownNear = [cushionGeometry(5, 104, 4, 8, 0, 0.22, 0.32), cushionGeometry(5, 96, 4, 8, 0, 0.22, 0.32)];
    await ctx.yield();
    const crownFar = [cushionGeometry(3, 34, 3, 6, 0, 0.34, 0.46), cushionGeometry(3, 32, 3, 6, 0, 0.34, 0.46)];
    await ctx.yield();
    crownBurn(3, 2, 9, 1.6, 6); crownBurn(3, 2, 8, 2.4, 6); crownBurn(3, 2, 9, 2.0, 6); crownBurn(6, 3, 30, 1.5, 8); crownBurn(5, 3, 26, 1.5, 8);
    const crownBank = [cushionGeometry(3, 36, 3, 6, 1.6, 0.34, 0.46), cushionGeometry(3, 34, 3, 6, 2.4, 0.34, 0.46), cushionGeometry(3, 36, 3, 6, 2.0, 0.34, 0.46)], BANK_TRUNK = [1.6, 2.4, 2.0];
    await ctx.yield();
    const crownTall = [cushionGeometry(6, 104, 4, 8, 1.5, 0.22, 0.32), cushionGeometry(5, 96, 4, 8, 1.5, 0.22, 0.32)];                 // emergents: their trunks go down into the mist
    await ctx.yield();
    // the first kapok's own leaf masses, passed at 8 to 20 m: half as many sprays again; and the far forms the near sets fall back
    // to while the flight is still down on the river (see lodSets and update)
    const crownK1 = [cushionGeometry(5, 150, 4, 8, 0, 0.2, 0.3), cushionGeometry(5, 142, 4, 8, 0, 0.2, 0.3)];
    await ctx.yield();
    const crownTallLo = [cushionGeometry(3, 36, 3, 6, 1.5, 0.34, 0.46), cushionGeometry(3, 34, 3, 6, 1.5, 0.34, 0.46)];
    await ctx.yield();
    const greens = ['#2f5e2e', '#4d7a2a', '#3c6b34', '#5c8a30', '#28542f', '#6a9038', '#356a3e', '#48702a'].map((h) => C(h, 1.5)), ipeCol = C('#f0bc1a', 1.0);
    const edgeD = (x, z) => {                                    // metres inland from the forest's outer edge (river, bar, cliff lip)
      let d = Math.min(riverSD(x, z) - 4, polySD(BAR, x, z) - 25);
      if (Math.abs(x) < 152 && z < 14) { const cx = clamp(x, -149, 149); d = Math.min(d, hero.faceZ(cx, hero.rimY(cx) * 0.995) - 9 - z); }
      return d;
    };
    const upPts = []; for (let i = 0; i <= 60; i++) { const q = path.pointAt(0.78 + 0.22 * i / 60); upPts.push(q.x, q.z); }
    const upDist = (x, z) => { let b = 1e9; for (let i = 0; i < upPts.length; i += 2) { const dx = upPts[i] - x, dz = upPts[i + 1] - z, d = dx * dx + dz * dz; if (d < b) b = d; } return Math.sqrt(b); };
    const crownList = [], cgrid = new Map(), CG = 12;
    const crownFree = (x, z, r, k) => {
      const gx = Math.floor(x / CG), gz = Math.floor(z / CG);
      for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) { const cell = cgrid.get((gx + i) + ':' + (gz + j)); if (cell) for (const c of cell) if (Math.hypot(c.x - x, c.z - z) < k * (c.r + r)) return false; }
      return true;
    };
    const crownAdd = (c) => { crownList.push(c); const key = Math.floor(c.x / CG) + ':' + Math.floor(c.z / CG); if (!cgrid.has(key)) cgrid.set(key, []); cgrid.get(key).push(c); };
    // the yellow ipes, placed where the last glide looks down on them
    const ipeV = path.pointAt(0.84), ipeF = V3(-0.39, 0, -0.92), ipeR = V3(0.92, 0, -0.39);
    const nIpe = waterMode === 'low' ? 8 : 6;
    for (let k = 0; k < nIpe; k++) {
      const q = k === 3 ? ipeV.clone().addScaledVector(ipeF, 66).addScaledVector(ipeR, -30) : k === 4 ? ipeV.clone().addScaledVector(ipeF, 125).addScaledVector(ipeR, -38) : k === 5 ? ipeV.clone().addScaledVector(ipeF, 56).addScaledVector(ipeR, -52)
        : XP.clone().addScaledVector(hf, [38, 70, 16, 0, 0, 96, 54, 120][k]).addScaledVector(lf, [34, -42, -30, 0, 0, 46, 78, -70][k]), r = cr.range(7.5, 9.5);
      if (forestAt(q.x, q.z) > 0.6 && edgeD(q.x, q.z) > 6) crownAdd({ x: q.x, z: q.z, r, y: DECK_Y + [0.4, 5.5, 2.4, 4.5, 6.5, 5.5, 1, 3.5][k], set: crownTall, v: k % 2, col: ipeCol.clone().multiplyScalar(cr.range(0.9, 1.1)), sy: 0.95 });
    }
    // the canopy top round the two kapoks: separate crowns standing out of the mist deck at different heights, one in nine an
    // emergent on its own trunk
    const Pm = V3((CK.x + K2.x) / 2, 0, (CK.z + K2.z) / 2), nTop = Math.round(360 * (0.7 + 0.3 * detail));
    for (let k = 0, tries = 0; k < nTop && tries < nTop * 40; tries++) {
      if ((tries & 15) === 0) await ctx.yield();
      const a = cr() * TAU, rr = 220 * Math.sqrt(cr()), x = Pm.x + Math.cos(a) * rr, z = Pm.z + Math.sin(a) * rr, dK2 = Math.hypot(x - K2.x, z - K2.z);
      if (forestAt(x, z) < 0.9 || edgeD(x, z) < (dK2 < 62 ? 9 : dK2 < 150 ? 11 : 22) || Math.hypot(x - CK.x, z - CK.z) < 33 || creekSD(x, z) < 11) continue;
      const big = cr() < 0.11, r = big ? cr.range(8, 11.5) : cr.range(5.5, 9.5), y = DECK_Y + (big ? cr.range(4, 8.5) : cr.range(-3.4, 0.6));
      if (Math.hypot(x - K2.x, z - K2.z) < r + 8 || path.distanceTo(x, y + 0.4 * r, z) < r + 9 || !crownFree(x, z, r, 0.74)) continue;
      const ud = upDist(x, z);
      crownAdd({ x, z, r, y, set: big || Math.hypot(x - CK.x, z - CK.z) < 64 ? crownTall : ud < 95 ? crownNear : crownFar, v: cr.int(0, 1), col: cr.pick(greens).clone().multiplyScalar(cr.range(0.78, 1.18)), sy: big ? cr.range(0.8, 1.0) : cr.range(0.95, 1.35) }); k++;
    }
    await ctx.yield();
    // the second kapok's umbrella: three rings of leaf masses 9-13 m across in a shallow dome 72 m wide over the fork; the last
    // glide comes in under its rim
    const k2Clumps = [], K2TOP = 72.5, K2R = 36;
    for (const [n, r0, r1, s0, s1] of [[4, 3, 9, 5.2, 6.4], [11, 13, 22.5, 5.0, 6.6], [23, 25, K2R, 4.4, 6.0]]) {
      for (let k = 0, tries = 0; k < n && tries < 500; tries++) {
        if ((tries & 7) === 0) await ctx.yield();
        const a = cr() * TAU, rho = cr.range(r0, r1), r = cr.range(s0, s1);
        const x = K2.x + Math.cos(a) * rho, z = K2.z + Math.sin(a) * rho * 0.94, y = K2TOP + 9 * (1 - (rho / K2R) * (rho / K2R)) + cr.range(-1, 1);
        if (path.distanceTo(x, y - 1, z) < 5.6 || k2Clumps.some((c) => Math.hypot(c.x - x, c.z - z) < 0.7 * (c.r + r))) continue;
        const c = { x, z, r, y, set: crownNear, v: k % 2, col: cr.pick(greens).clone().lerp(C('#6a9038', 1.5), 0.45).multiplyScalar(cr.range(0.85, 1.15)), sy: cr.range(0.6, 0.78) };
        k2Clumps.push(c); crownList.push(c); k++;
      }
    }
    // tree walls: two or three staggered ranks stepping up from every bank, bar edge and the cliff lip
    const nBank = Math.round(480 * (0.7 + 0.3 * detail)), nK2 = Math.round(nBank * 0.3);       // the first fifth close the forest edge below the second kapok
    for (let k = 0, tries = 0; k < nBank && tries < nBank * 40; tries++) {
      await ctx.yield();
      const x = k < nK2 ? K2.x + cr.range(-140, 140) : cr.range(-480, 400), z = k < nK2 ? K2.z + cr.range(-140, 140) : cr.range(-70, 480), e = edgeD(x, z);
      if (k < nK2 && tries > nBank * 8) { k = nK2; continue; }
      if (e < 0 || e > 34 || forestAt(x, z) < 0.5 || creekSD(x, z) < 9 || Math.hypot(x - CK.x, z - CK.z) < 40) continue;
      const pd = path.nearestXZ(x, z).dist; if (pd > 330 || (pd > 170 && cr() < 0.45)) continue;
      const t = clamp(e / 28, 0, 1), v = t < 0.3 ? 0 : t < 0.62 ? 2 : 1, r = lerp(4.2, 9.5, Math.pow(t, 0.8)) * cr.range(0.85, 1.2), gy = groundAt(x, z), y = gy + (BANK_TRUNK[v] - 0.06) * r;
      if (Math.hypot(x - K2.x, z - K2.z) < r + 6 || path.distanceTo(x, y + 0.3 * r, z) < r + 9.5 || path.distanceTo(x, gy + 3, z) < 9.5 || !crownFree(x, z, r, 0.7)) continue;
      crownAdd({ x, z, r, y, set: crownBank, v, col: cr.pick(greens).clone().multiplyScalar(cr.range(0.7, 1.12) * lerp(0.85, 1.05, t)), sy: cr.range(0.85, 1.15) }); k++;
    }
    {
      const wr = ctx.core.makeRng('macaw-westbank:' + ctx.seed);
      for (let k = 0, tries = 0; k < 90 && tries < 1500; tries++) {
        if ((tries & 1) === 0) await ctx.yield();
        const x = wr.range(-520, -150), z = wr.range(-40, 150), rd = riverSD(x, z), e = edgeD(x, z);
        if (rd < 5 || e < 0 || e > 46 || forestAt(x, z) < 0.5 || creekSD(x, z) < 12) continue;
        const t = clamp(e / 40, 0, 1), v = t < 0.3 ? 0 : t < 0.62 ? 2 : 1, r = lerp(5, 11.5, Math.pow(t, 0.7)) * wr.range(0.8, 1.35), gy = groundAt(x, z), y = gy + (BANK_TRUNK[v] - 0.06) * r + wr.range(0, 5) * t;
        if (!crownFree(x, z, r, 0.62)) continue;
        crownAdd({ x, z, r, y, set: crownBank, v, col: wr.pick(greens).clone().multiplyScalar(wr.range(0.7, 1.12) * lerp(0.85, 1.05, t)), sy: wr.range(0.8, 1.3) }); k++;
      }
    }
    const rimCrowns = [], lodCrowns = [];
    // the near sets (canopy top by the climb, both kapoks' leaf masses, the emergents) are drawn in their far form while the flight is
    // down on the river, a quarter of a kilometre off, and in full from the creek on: lodCrowns = [[full, far], ...]
    const flushCrowns = async () => {
      const buckets = new Map(), M = new THREE.Matrix4(), Qq = new THREE.Quaternion(), Ee = new THREE.Euler();
      const tagOf = (c) => (c.set === crownK1 ? 'k' : c.set === crownNear ? 'n' : c.set === crownFar ? 'f' : c.set === crownTall ? 't' : 'b' + Math.floor((c.x + 600) / 260) + ':' + Math.floor((c.z + 200) / 260) + ':');
      for (const c of crownList) { const key = (c.rim ? 'w' : '') + tagOf(c) + c.v; if (!buckets.has(key)) buckets.set(key, []); buckets.get(key).push(c); }
      for (const list of buckets.values()) {
        await ctx.yield();
        const c0 = list[0], lo = c0.rim || c0.set === crownFar || c0.set === crownBank ? null : c0.set === crownTall ? crownTallLo[c0.v] : crownFar[c0.v], pair = [];
        const mats = list.map((c) => M.compose(V3(c.x, c.y, c.z), Qq.setFromEuler(Ee.set(cr.range(-0.06, 0.06), cr() * TAU, cr.range(-0.06, 0.06))), V3(c.r, c.r * c.sy, c.r)).clone());
        for (const geo of lo ? [c0.set[c0.v], lo] : [c0.set[c0.v]]) {
          const mesh = new THREE.InstancedMesh(geo, c0.set === crownBank ? bankMat : crownMat, list.length);
          list.forEach((c, i) => { mesh.setMatrixAt(i, mats[i]); mesh.setColorAt(i, c.col); });
          mesh.instanceMatrix.needsUpdate = true; mesh.instanceColor.needsUpdate = true; mesh.computeBoundingSphere(); mesh.boundingSphere.radius += 4;
          scene.add(mesh); pair.push(mesh);
        }
        if (c0.rim) rimCrowns.push(pair[0]); else if (lo) { pair[1].visible = false; lodCrowns.push(pair); }
      }
    };
    await ctx.yield();

    // ---------- the two kapoks, the fig, cecropias and the understorey (one mesh, kit wind material) ----------
    const pr = R.fork('plants'), M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), EU = new THREE.Euler();
    const clearOf = (p, r, margin = 6.5) => path.distanceTo(p.x, p.y, p.z) > r + margin;
    const ferns = [0, 1].map((k) => flora.fernGeometry({ rng: pr.fork('fern' + k), size: 1.2, detail: 1, leaf: k ? '#4c8f3a' : '#6a9a3c', leafLight: '#b4d060' }));
    await ctx.yield();
    const put = (g, p, s, tint, sway = 0, sy = 1) => PGm.addGeo(g, M4.compose(p, Q.setFromEuler(EU.set(pr.range(-0.15, 0.15), pr() * TAU, pr.range(-0.15, 0.15))), V3(s, s * sy, s)), tint, sway);
    // a leaf mass on a limb: one of the modelled crowns, small leaves in dense cushions
    const clump = (p, s, sway, sy0 = 0.72, sy1 = 0.92) => { const r = s * 1.12; if (!clearOf(p, r, 6.5)) return false;
      crownList.push({ x: p.x, z: p.z, r, y: p.y - 0.3 * r, set: crownK1, v: pr.int(0, 1), col: pr.pick(greens).clone().lerp(C('#5c8a30', 1.5), 0.4).multiplyScalar(pr.range(0.85, 1.15)), sy: pr.range(sy0, sy1) }); return true; };
    // (new work draws from its own generator, so that nothing placed with `pr` after it moves)
    const xr = ctx.core.makeRng('macaw-extra:' + ctx.seed);
    const limb = (from, dir, len, rise, r0, sway, brom, leafS) => {                // returns its points; dresses it with bromeliads and foliage
      const P = []; for (let k = 0; k <= 6; k++) { const t = k / 6; P.push(from.clone().addScaledVector(dir, len * t).add(V3(0, rise * t * t + 0.5 * Math.sin(t * 5 + len), 0))); }
      if (!P.every((p) => clearOf(p, 0.5, 7.5))) return null;
      PGm.tube(P, P.map((_, k) => r0 * (1 - 0.72 * k / 6)), 7, (t, s) => barkMix(t * len * 0.7, s, 0.95 + 0.25 * t), (t) => sway * t * t);
      for (let k = 0; k < brom; k++) { const t = pr.range(0.15, 0.95), i = Math.min(5, Math.floor(t * 6)), p = P[i].clone().lerp(P[i + 1], t * 6 - i).add(V3(0, r0 * (1 - 0.7 * t) * 0.8, 0));
        if (clearOf(p, 1, 7)) put(pr.pick(ferns), p, pr.range(0.8, 1.5), pr.chance(0.25) ? [1.25, 0.8, 0.5] : [1, 1, 0.9], sway * t * t); }
      if (leafS) { clump(P[6].clone().add(V3(0, leafS * 0.3, 0)), leafS, sway); clump(P[4].clone().add(V3(pr.range(-2, 2), leafS * 0.5, pr.range(-2, 2))), leafS * 0.85, sway * 0.6); }
      return P;
    };
    // a kapok bole: plank buttresses that run 7 m out and die away by 8 m up, a slow twist, shallow flutes and swellings in
    // the wood itself, grey bark with pale lichen, moss in the buttress folds and on the wet side, darker rings (bark detail
    // comes from the kit material)
    // cap: [height, exponent] closes the bole above `top` as a rounded shoulder; fork: { axis, from } swells it along `axis` from
    // height `from` up, so that the two great limbs grow out of it as one form
    const kapok = async (base, R0, top, seedPh, lift = 1, cap = null, fork = null) => {
      const ys = [-0.8, 0.2, 0.8, 1.5, 2.3, 3.2, 4.3, 5.6, 7, 8.6], S = 40, pos = [], idx = [], meta = [];
      for (let y = 10.4; y < top - 1.2; y += 1.9) ys.push(y); ys.push(top);
      if (cap) for (const f of [0.3, 0.58, 0.8, 0.94]) ys.push(top + cap[0] * f);
      for (let j = 0; j < ys.length; j++) { const y = ys[j]; if ((j & 3) === 0) await ctx.yield();                    // a few rings at a time
        for (let s = 0; s < S; s++) {
        const a = (s / S) * TAU + 0.035 * y, fi = Math.round((a + seedPh) / TAU * 6), fk = 0.55 + 0.45 * Math.abs(Math.sin(fi * 12.9898 + seedPh * 7)), fin = Math.pow(0.5 + 0.5 * Math.cos(6 * a + 6 * seedPh), 5) * fk;
        const A = (7 / R0 - 1) * Math.exp(-Math.max(y, 0) / 2.6), flute = 0.045 * Math.sin(a * 9 + seedPh * 3 + 0.9 * Math.sin(y * 0.21)) + 0.05 * noise.n2(a * 2.6 + seedPh, y * 0.16) + 0.03 * noise.n2(a * 6 + 9, y * 0.6);
        let r = R0 * (1 - 0.3 * clamp(y / top, 0, 1)) * (1 + A * fin) * (1 + flute * (1 - 0.6 * Math.min(1, A * fin)));
        if (cap && y > top) r *= Math.sqrt(Math.max(0.02, 1 - Math.pow((y - top) / cap[0], cap[1])));
        let px = Math.cos(a) * r, pz = Math.sin(a) * r;
        if (fork) { const sf = smoothstep(fork.from, top, y), al = px * fork.axis.x + pz * fork.axis.z, k = (1 + fork.swell * sf) / (1 - 0.12 * sf) - 1; px = px * (1 - 0.12 * sf) + fork.axis.x * al * k * (1 - 0.12 * sf); pz = pz * (1 - 0.12 * sf) + fork.axis.z * al * k * (1 - 0.12 * sf); }
        pos.push(base.x + px, base.y + y, base.z + pz);
        meta.push(fin, y, 0.6 * noise.n2(a * 2.2 + seedPh, y * 0.22) + 0.4 * noise.n2(a * 7 + seedPh, y * 0.9), flute, Math.cos(a - 2.1));
      } if (j) for (let s = 0; s < S; s++) { const a = (j - 1) * S + s, b = (j - 1) * S + (s + 1) % S; idx.push(a, a + S, b, b, a + S, b + S); } }
      await ctx.yield();
      if (cap) { const c = pos.length / 3, l0 = (ys.length - 1) * S; pos.push(base.x, base.y + top + cap[0], base.z); meta.push(0, top + cap[0], 0, 0, 0); for (let s = 0; s < S; s++) idx.push(c, l0 + (s + 1) % S, l0 + s); }
      PGm.addMesh(pos, idx, (k) => { const fin = meta[k * 5], y = meta[k * 5 + 1], n = meta[k * 5 + 2], fl = meta[k * 5 + 3], wet = meta[k * 5 + 4];
        const moss = clamp(fin * 1.3 * Math.exp(-y / 6) + 0.3 * n - 0.12 + 0.22 * wet * smoothstep(30, 4, y) + (lift > 1 ? 0.08 : 0.3) * smoothstep(24, 34, y), 0, 0.75);
        const ring = 0.9 + 0.1 * Math.sin(y * 2.3 + 2 * n), sh = (0.74 + 0.38 * n + 2.2 * fl) * ring * (0.6 + 0.4 * smoothstep(0, 5, y + fin * 5)), pale = smoothstep(0.2, 0.6, n) * 0.5;
        const lf = fork && fork.dark ? lerp(lift, fork.dark, smoothstep(fork.from - 2, top - 2.5, y)) : lift;      // the fork itself is dark wet bark, not the pale bole
        return [lerp(0.15 + 0.17 * pale, 0.07, moss) * sh * lf, lerp(0.145 + 0.17 * pale, 0.135, moss) * sh * lf, lerp(0.125 + 0.15 * pale, 0.045, moss) * sh * lf]; }, 0);
    };
    // K1: bare to 40 m, limbs with bromeliad gardens at 20 and 31 m, a flat crown with the notch the path climbs through
    const k1 = V3(CK.x, groundAt(CK.x, CK.z), CK.z), camPhi = (deg) => helixAt(deg * Math.PI / 180), dirAz = (deg) => V3().addScaledVector(rgt, -Math.cos(deg * Math.PI / 180)).addScaledVector(hin, Math.sin(deg * Math.PI / 180));
    await ctx.yield();
    await kapok(k1, 1.5, 41.5, 0.3, 1, [4, 1.6]);                                             // (its top ends under the lowered dome: no stub shows from above)
    await ctx.yield();
    const HOWL_AZ = 116, howlLimb = limb(k1.clone().setY(19.2), dirAz(HOWL_AZ), 9.2, 1.4, 0.55, 0.12, 5, 0);
    const midLimbs = [howlLimb];
    for (const [az, y] of [[250, 30], [10, 32], [130, 33.5], [310, 26]]) { await ctx.yield(); midLimbs.push(limb(k1.clone().setY(y), dirAz(az + pr.range(-12, 12)), pr.range(8, 9.4), pr.range(1, 2.5), 0.5, 0.15, 9, 0)); }
    const k1Crown = [], k1Low = [];
    for (let k = 0; k < 11; k++) { await ctx.yield(); k1Crown.push(limb(k1.clone().setY(40 + (k % 3)), dirAz(k * 33 + pr.range(-8, 8)), pr.range(11.5, 15), pr.range(3, 5.5), 0.6, 0.35, 5, pr.range(3, 4))); }
    await ctx.yield();
    // the crown itself: a full dome of leaf masses over the limbs (the notch the path climbs through is cut by the clearance
    // test), so that from above no limb end or trunk top shows
    // (its top sits 4 m lower than its shoulders would carry it, and lower still toward the second kapok: as the climb comes
    // round over it at 53 m the ring is seen whole across it, the dome under the lower part of the frame. The clearance test is
    // made where each mass stood before, so that nothing placed after it moves)
    const k2Dir = V3(K2.x - CK.x, 0, K2.z - CK.z).normalize(), dipFor = (p) => { const dx = p.x - CK.x, dz = p.z - CK.z, l = Math.hypot(dx, dz); return 3.8 * (1 - smoothstep(6.5, 11, l)) + 2.5 * smoothstep(3, 8, l) * smoothstep(0.2, 0.8, (dx * k2Dir.x + dz * k2Dir.z) / Math.max(l, 1e-3)); };
    const clumpDip = (p, s, sway, sy0, sy1) => { const n0 = crownList.length, ok = clump(p, s, sway, sy0, sy1); if (ok && crownList.length > n0) { const c = crownList[crownList.length - 1]; c.y0 = c.y; c.y -= dipFor(p); } return ok; };
    clumpDip(k1.clone().setY(52.2), 4.6, 0.4, 0.8, 0.95); clumpDip(k1.clone().add(V3(3, 50.4, -2)), 3.9, 0.4, 0.8, 0.95);
    for (const [n, r0, r1, y0, y1, s0, s1] of [[6, 3.5, 6.5, 50.2, 52, 3.5, 4.2], [11, 7.5, 11, 47.6, 50, 3.4, 4.2], [16, 12, 16.5, 44.5, 47.5, 3.2, 4.0]]) {
      for (let k = 0, tries = 0; k < n && tries < n * 8; tries++) {
        const a = (k + pr.range(0.1, 0.9)) / n * TAU + r0, rho = pr.range(r0, r1), azd = ((a * 180 / Math.PI) % 360 + 360) % 360;
        if (r0 > 7 && azd > 100 && azd < 200) { k++; continue; }                     // the side toward the second kapok's mist sea stays open: the dome sits in the lower right of that view
        if (clumpDip(k1.clone().add(V3(Math.cos(a) * rho, pr.range(y0, y1), Math.sin(a) * rho)), pr.range(s0, s1), 0.4, 0.78, 1.0)) k++; else if (tries % 3 === 2) k++;
      }
    }
    await ctx.yield();
    // a lower tier on the side the dome leaves open: two long limbs at 35 m and their leaf masses, under the sight line from the
    // top of the helix and over the one from its foot
    for (const d of [122, 152]) k1Low.push(limb(k1.clone().setY(35.5), dirAz(d + pr.range(-5, 5)), pr.range(17, 20), 3.5, 0.75, 0.3, 4, 4.6));
    for (let k = 0; k < 4; k++) { const a = (150 + 14 * k + pr.range(-4, 4)) * Math.PI / 180, rho = pr.range(13, 22); clump(k1.clone().add(V3(Math.cos(a) * rho, pr.range(38.5, 41), Math.sin(a) * rho)), pr.range(4.2, 5), 0.4, 0.78, 1.0); }
    // leaf masses hung close round the top of the bole, 42 to 47 m up: from the notch, level with the limbs, the trunk's end and the
    // limbs' roots are behind leaves
    for (let k = 0; k < 6; k++) {
      const a = (k + xr.range(0.2, 0.8)) / 6 * TAU, rho = xr.range(3.0, 4.6), s0 = xr.range(2.7, 3.3), p = k1.clone().add(V3(Math.cos(a) * rho, xr.range(43.6, 46.4), Math.sin(a) * rho)), r = s0 * 1.12;
      if (clearOf(p, r, 6.5)) crownList.push({ x: p.x, z: p.z, r, y: p.y - 0.3 * r, set: crownK1, v: k % 2, col: xr.pick(greens).clone().lerp(C('#5c8a30', 1.5), 0.4).multiplyScalar(xr.range(0.8, 1.05)), sy: xr.range(0.8, 0.98) });
    }
    await ctx.yield();
    // the well's rim: two ranks of big crowns leaning in over the clearing, so that from the foot of the helix the sky is ragged
    // gaps between dark leaf masses and the howlers' shaft has shade to stand in
    for (const [n, rr0, rr1, y0, y1, s0, s1, set] of [[16, 35, 39, 33, 37, 9.5, 11.5, crownNear], [20, 47, 54, 28.5, 33, 10, 12.5, crownFar]]) for (let k = 0; k < n; k++) {
      const a = (k + pr.range(0.2, 0.8)) / n * TAU, rho = pr.range(rr0, rr1), r = pr.range(s0, s1), x = CK.x + Math.cos(a) * rho, z = CK.z + Math.sin(a) * rho, y = pr.range(y0, y1);
      if (path.distanceTo(x, y + 0.3 * r, z) < 0.75 * r + 6) continue;
      crownList.push({ x, z, r, y, set, v: k % 2, rim: 1, col: pr.pick(greens).clone().multiplyScalar(pr.range(0.7, 1.0)), sy: pr.range(0.7, 0.95) });
    }
    await ctx.yield();
    // PERCHES FOR THE SKEIN: pairs side by side on the bromeliad limbs (26 to 34 m), the two long limbs at 35 m, the limbs under
    // the crown and, last, on top of the crown's leaf masses, each pair with its backs turned to where the climb passes it
    {
      const qr = ctx.core.makeRng('macaw-perch:' + ctx.seed), list = [], UP = V3(0, 1, 0), tA = teOf(0.69), tB = teOf(0.86), eq = V3();
      const nearT = (q) => { let bt = tA, bd = 1e9; for (let te = tA; te < tB; te += 0.05) { const d = eyeAt(te, eq).distanceToSquared(q); if (d < bd) { bd = d; bt = te; } } return bt; };
      const onLimb = (P, r0, t, len) => {
        if (!P) return;
        const at = (tt) => { const f = clamp(tt, 0, 0.999) * 6, i = Math.min(5, Math.floor(f)); return P[i].clone().lerp(P[i + 1], f - i); };
        const a = at(t), b = at(t + 0.66 / len), tq = nearT(a), side = b.clone().sub(a).cross(UP).normalize(), r = r0 * (1 - 0.72 * t);
        if (side.dot(eyeAt(tq, eq).sub(a)) < 0) side.negate();
        const n = side.clone().multiplyScalar(0.92).addScaledVector(UP, 0.38).normalize(), hop = qr.chance(0.3) ? qr.range(0.8, 1.5) : 0;
        for (const q of [a, b]) list.push({ p: q.clone().addScaledVector(UP, r * 0.9 + 0.15).addScaledVector(side, r * 0.35), n, t: tq, hop });
      };
      for (let k = 1; k < midLimbs.length; k++) for (const t of [0.3, 0.52, 0.74]) onLimb(midLimbs[k], 0.5, t + qr.range(-0.04, 0.04), 8.8);
      await ctx.yield();
      for (const P of k1Low) for (const t of [0.24, 0.4, 0.56]) onLimb(P, 0.75, t + qr.range(-0.03, 0.03), 18);
      await ctx.yield();
      k1Crown.forEach((P, k) => onLimb(P, 0.6, 0.24 + 0.1 * (k % 3), 13));
      await ctx.yield();
      const tops = crownList.filter((c) => c.set === crownK1 && (c.y0 ?? c.y) > 45.5).sort((a, b) => (b.y0 ?? b.y) - (a.y0 ?? a.y));      // (the same masses, in the same order, as before the dome was lowered)
      for (const c of tops) {
        if (list.length >= 80) break;
        await ctx.yield();
        const top = V3(c.x + qr.range(-0.2, 0.2) * c.r, c.y + 0.6 * c.r * c.sy, c.z + qr.range(-0.2, 0.2) * c.r), tq = nearT(top), toCam = eyeAt(tq, eq).sub(top).setY(0).normalize();
        const n = toCam.clone().multiplyScalar(0.85).addScaledVector(UP, 0.5).normalize(), side = V3(-toCam.z, 0, toCam.x), hop = qr.chance(0.4) ? qr.range(0.9, 1.6) : 0;
        for (const m of [-0.33, 0.33]) list.push({ p: top.clone().addScaledVector(side, m), n, t: tq, hop });
      }
      hero.setPerches(list);
    }
    await ctx.yield();
    for (let k = 0; k < 70; k++) {                                                   // philodendron climbing the bole
      const y = pr.range(5, 27), a = pr() * TAU, r = 1.5 * (1 - 0.3 * y / 46) + 0.12, o = V3(Math.cos(a), 0, Math.sin(a)), root = k1.clone().add(V3(o.x * r, y, o.z * r));
      PGm.card(root, root.clone().addScaledVector(o, 0.55).add(V3(0, -pr.range(0.7, 1.2), 0)), V3(-o.z, 0, o.x).multiplyScalar(pr.range(0.35, 0.55)), flora.LEAF_CELLS.fan, [0.16, 0.36, 0.12], 0.05, 0.6);
    }
    for (let k = 0; k < 16; k++) { const y = pr.range(30, 45), a = pr() * TAU, r = 1.5 * (1 - 0.3 * y / 46) + 0.15, q = k1.clone().add(V3(Math.cos(a) * r, y, Math.sin(a) * r)); if (clearOf(q, 1, 7)) put(pr.pick(ferns), q, pr.range(0.8, 1.4), pr.chance(0.3) ? [1.25, 0.8, 0.5] : [1, 1, 0.9], 0.05); }
    await ctx.yield();
    // K2: the taller kapok. A buttressed grey trunk to the fork at 52 m, where two great limbs rise either side of the ring and
    // carry tiers of near-horizontal branches out to the leaf masses of an umbrella crown 64 m across
    const k2 = V3(K2.x, groundAt(K2.x, K2.z), K2.z);
    await kapok(k2, 3.1, 45, 1.9, 2.7, [3.4, 1.7], { axis: lf2, from: 35, swell: 0.8, dark: 0.95 });
    for (let k = 0; k < 6; k++) {                                                    // a bromeliad garden in the crotch, under the ring
      const q = V3(k2.x, 48.1 - 0.16 * Math.abs(k - 2.5) + xr.range(-0.15, 0.2), k2.z).addScaledVector(lf2, (k - 2.5) * 0.95 + xr.range(-0.3, 0.3)).addScaledVector(hf2, xr.range(-1.3, 0.2)), sc = xr.range(1.25, 1.9);
      PGm.addGeo(ferns[k % 2], M4.compose(q, Q.setFromEuler(EU.set(xr.range(-0.2, 0.2), xr() * TAU, xr.range(-0.2, 0.2))), V3(sc, sc, sc)), k % 3 === 1 ? [1.3, 0.8, 0.5] : [1, 1, 0.85], 0.08);
    }
    await ctx.yield();
    const k2Limbs = [];
    for (const sg of [1, -1]) {
      // the bole divides: each limb leaves its heart at 41 m, swells out of the wood and sweeps up round the ring
      const P = [[0.6, 41, 0], [3.5, 48, 0.3], [8.3, 54.6, 0.9], [11.2, 62, 1.2], [12.2, 71, 0.6], [13.4, 78, -0.5]].map((q) => V3(k2.x, q[1], k2.z).addScaledVector(lf2, sg * q[0]).addScaledVector(hf2, q[2]));
      const lc = new THREE.CatmullRomCurve3(P, false, 'centripetal'), LP = [], LR = [], rk = [2.5, 2.55, 2.05, 1.5, 1.1, 0.7];
      for (let j = 0; j <= 15; j++) { const t = j / 15, f = t * 5, i = Math.min(4, Math.floor(f)); LP.push(lc.getPoint(t)); LR.push(lerp(rk[i], rk[i + 1], f - i)); }
      PGm.tube(LP, LR, 10, (t, s) => barkMix(t * 30, s + sg, 0.72 + 1.43 * smoothstep(0.08, 0.5, t)), (t) => 0.3 * t * t);
      k2Limbs.push(P);
      await ctx.yield();
      limb(V3(k2.x, 43.5, k2.z), lf2.clone().multiplyScalar(sg).addScaledVector(hf2, 0.5).normalize(), 15, 4, 0.8, 0.3, 8, 0);
      await ctx.yield();
      limb(V3(k2.x, 40, k2.z), lf2.clone().multiplyScalar(sg).addScaledVector(hf2, -0.7).normalize(), 13, 3, 0.7, 0.3, 6, 0);
      await ctx.yield();
      for (let k = 0; k < 7; k++) { const p = P[2].clone().lerp(P[4], k / 6).addScaledVector(lf2, sg * 1.1); if (clearOf(p, 1, 7)) put(pr.pick(ferns), p, pr.range(1, 1.6), [1, 1, 0.85], 0.1); }
    }
    limb(V3(k2.x, 44, k2.z), hf2.clone(), 14, 3, 0.8, 0.3, 6, 0);
    for (const c of k2Clumps) {                                                      // a branch out to every leaf mass, from the limb on its side
      await ctx.yield();
      const sideSg = (c.x - k2.x) * lf2.x + (c.z - k2.z) * lf2.z > 0 ? 0 : 1, L2 = k2Limbs[sideSg], rho = Math.hypot(c.x - k2.x, c.z - k2.z);
      const from = L2[3].clone().lerp(L2[5], clamp(1 - rho / 40 + pr.range(-0.1, 0.1), 0, 1)), to = V3(c.x, c.y - 0.15 * c.r, c.z), mid = from.clone().lerp(to, 0.5).add(V3(0, 1.2 + 0.05 * rho, 0));
      const pts2 = [from, from.clone().lerp(mid, 0.5).add(V3(0, 0.5, 0)), mid, mid.clone().lerp(to, 0.55).add(V3(0, 0.3, 0)), to];
      if (pts2.every((q) => clearOf(q, 0.5, 6.5))) { PGm.tube(pts2, [0.6 + 0.012 * rho, 0.5 + 0.008 * rho, 0.4, 0.28, 0.15], 6, (t, s2) => barkMix(t * 20 + c.x, s2, 1.7 + 0.3 * t), (t) => 0.35 * t * t); c.branch = pts2; }
    }
    await ctx.yield();
    {
      const qr = ctx.core.makeRng('macaw-k2:' + ctx.seed), ex = [], UP = V3(0, 1, 0);
      k2Limbs.forEach((P, li) => {
        const sg = li ? -1 : 1, rk = [2.5, 2.55, 2.05, 1.5, 1.1, 0.7];
        for (const f of [2.45 + qr.range(0, 0.25), 3.2 + qr.range(0, 0.3)]) {              // clinging to the limb where it rises past the ring
          const i = Math.floor(f), c = P[i].clone().lerp(P[i + 1], f - i), r = lerp(rk[i], rk[i + 1], f - i);
          const n = hf2.clone().multiplyScalar(-0.86).addScaledVector(lf2, -0.38 * sg).addScaledVector(UP, 0.3).normalize(), side = V3(-n.z, 0, n.x).normalize(), sp = (ex.length / 2) % 3 === 1 ? 2 : (ex.length / 2) % 3 === 2 ? 1 : 0, hop = qr.chance(0.5) ? qr.range(1.0, 1.8) : 0;
          for (const m of [-0.34, 0.34]) ex.push({ p: c.clone().addScaledVector(n, r * 0.96 + 0.05).addScaledVector(side, m).add(V3(0, 0.12 * m, 0)), n, sp, size: 1.9, hop, roll: qr.range(-0.2, 0.2) });
        }
      });
      // and four pairs on the branches under the umbrella, either side of the ring's top
      const br = k2Clumps.filter((c) => { const d = (c.x - k2.x) * hf2.x + (c.z - k2.z) * hf2.z, l = Math.abs((c.x - k2.x) * lf2.x + (c.z - k2.z) * lf2.z); return c.branch && d < 2 && d > -16 && l > 7 && l < 24; }).slice(0, 4);
      br.forEach((c, k) => {
        const q = c.branch[1].clone().lerp(c.branch[2], 0.3 + 0.5 * (k % 2)).add(V3(0, 0.62, 0));
        const n = hf2.clone().multiplyScalar(-0.9).addScaledVector(UP, 0.42).normalize(), side = V3(-n.z, 0, n.x).normalize(), sp = k % 3 === 0 ? 2 : k % 3 === 1 ? 0 : 1;
        if (path.distanceTo(q.x, q.y, q.z) > 5.5) for (const m of [-0.34, 0.34]) ex.push({ p: q.clone().addScaledVector(side, m), n, sp, size: 1.9, hop: k % 2 ? qr.range(1.0, 1.6) : 0, roll: qr.range(-0.15, 0.15) });
      });
      hero.setExtras(ex);
    }
    // strangler fig on a host at the edge of the light well, one limb reaching in
    {
      const fa = 200, o = dirAz(fa), fb = CK.clone().addScaledVector(o, 33); fb.y = groundAt(fb.x, fb.z) - 0.3;
      PGm.tube([fb, fb.clone().setY(12), fb.clone().setY(24), fb.clone().setY(shellY(fb.x, fb.z))], [1.3, 0.95, 0.9, 0.7], 8, (t, s) => barkMix(t * 30, s, 0.8), 0);
      for (let k = 0; k < 9; k++) { const ph = pr() * TAU, dirn = k % 2 ? 1 : -1, P = []; for (let j = 0; j <= 12; j++) { const t = j / 12, a = ph + dirn * t * 5.5, r = 1.15 - 0.15 * t + (j === 0 ? 0.9 : 0); P.push(V3(fb.x + Math.cos(a) * r, fb.y + 27 * t, fb.z + Math.sin(a) * r)); }
        PGm.tube(P, P.map((_, j) => 0.2 - 0.008 * j), 5, () => [0.3, 0.27, 0.2], 0); }
      limb(fb.clone().setY(25), o.clone().negate(), 6, 1.5, 0.45, 0.15, 5, 2.6);
    }
    await ctx.yield();
    // cecropias: pale candelabra crowns of big palmate leaves at the creek mouth, along the creek and the back of the bar
    const cecropia = (x, z, H) => {
      const b = V3(x, groundAt(x, z) - 0.2, z), lx = pr.range(-1, 1), lz = pr.range(-1, 1), pale = [0.46, 0.44, 0.36];
      const top = b.clone().add(V3(lx, H, lz)), tips = [top];
      PGm.tube([b, b.clone().add(V3(lx * 0.3, H * 0.5, lz * 0.3)), top], [0.26, 0.19, 0.11], 6, (t) => pale.map((c) => c * (0.75 + 0.3 * t)), (t) => 0.25 * t * t);
      for (let k = 0, n = pr.int(3, 5); k < n; k++) {
        const a = pr() * TAU, t0 = pr.range(0.62, 0.9), o = b.clone().lerp(top, t0), tip = o.clone().add(V3(Math.cos(a) * pr.range(1.8, 3.2), pr.range(1.6, 3), Math.sin(a) * pr.range(1.8, 3.2)));
        PGm.tube([o, o.clone().lerp(tip, 0.6).add(V3(0, -0.5, 0)), tip], [0.11, 0.08, 0.06], 5, () => pale, (t) => 0.25 + 0.2 * t); tips.push(tip);
      }
      for (const tp of tips) for (let k = 0, n = 7; k < n; k++) {
        const a = (k / n) * TAU + pr.range(-0.3, 0.3), d = V3(Math.cos(a), pr.range(-0.25, 0.3), Math.sin(a)), g = pr.range(0.75, 1.1);
        PGm.card(tp, tp.clone().addScaledVector(d, pr.range(1.5, 2.1)), V3(-d.z, 0, d.x).multiplyScalar(0.85), flora.LEAF_CELLS.fan, [0.3 * g, 0.5 * g, 0.2 * g], 0.45, 1);
      }
    };
    for (let k = 0, tries = 0; k < 26 && tries < 600; tries++) {
      await ctx.yield();                                           // a tree at a time
      const t = pr(), onBar = pr.chance(0.4), side = pr.sign() * pr.range(13.5, 22);
      const x = onBar ? pr.range(-175, 60) : lerp(G1.x, E.x, t * 1.1 - 0.15) + rgt.x * side, z = onBar ? 158 + pr.range(-2, 5) : lerp(G1.z, E.z, t * 1.1 - 0.15) + rgt.z * side;
      const h = height(x, z); if (h < WL + 0.4 || path.nearestXZ(x, z).dist < 12.5 || creekSD(x, z) < 1) continue;
      cecropia(x, z, pr.range(11, 17)); k++;
    }
    await ctx.yield();

    await flushCrowns();
    await ctx.yield();
    // (round 21) THE MAP OF THE PLACE the canopy's shell reads, baked once from above. No draw is taken.
    // ITS RED, THE CROWNS' SHADOWS ON THE CANOPY AND ON THE MIST IN IT. Every crown that stands out of the canopy (the canopy
    // top's separate crowns, the ipes, both kapoks' leaf masses; not the tree walls on the banks nor the well's rim, which stand
    // under it) throws the shadow of the part of it that is above what the shadow falls on, hR: the mist's top in this look, or
    // the canopy's own mean top where the mist lies lower. The crown is a flattened ball (r across, half of r * sy up and down
    // about its middle, as its leaf masses are built); under a sun at the look's own height its shadow on a level is an ellipse
    // as wide as the ball, drawn out away from the sun to the root of r^2 + (half height / tan sun)^2, its middle the ball's
    // own middle carried down the sun's line.
    // ITS GREEN, THE EMERGENTS' HOLLOWS. A crown whose middle stands 4.5 m or more above the canopy's mean top (hE) is an
    // emergent: both kapoks' leaf masses, the tall crowns on their own trunks, the higher ipes, all by the one rule. Under it
    // the canopy's crowns are lower, so the mist lies deeper and longer there: a hollow as wide as the crown and a third more,
    // and 6 m, soft to its rim (5 m deep at its middle: the shader's own number).
    // (Third pass: THE CANOPY'S MEAN TOP IS MEASURED HERE, IN THIS BUILD (hT): the middle value of the heights of the shell's
    // own top, which is this seed's and does not rise with the river, and the crowns' mean dome over it. It was typed, 32.4 m
    // and 37.4 m, from seed 7's canopy.)
    // (Fourth pass: THE SAME CROWNS ARE EMERGENTS AT EVERY WATER LEVEL AS WHEN THE TEST WAS 37.4 m. The crowns ride with the
    // river (their heights are the deck's and an offset), the canopy does not. Of all the heights a crown can have, the
    // highest the 37.4 m test left out is the canopy's ordinary crown at the deck + 0.6 m (36.85 m at high water) and the
    // lowest it counted is the ipe at the deck + 2.4 m (37.4 m at the usual water). Over the measured top (32.51 to 32.59 m
    // on six seeds) those are 4.3 m and 4.8 m; the margin is put between them, 4.5 m, so neither moves across it at any
    // water level. With 5 m over the measured top that ipe would have lost its hollow at the usual water.)
    {
      const hs = [], sp = shell.geometry.attributes.position, sa = shell.geometry.attributes.aData;
      for (let k = 0; k < sp.count; k++) if (sa.getY(k) > 0.97 && sa.getX(k) > 0.5) hs.push(sp.getY(k));
      hs.sort((a, b) => a - b);
      // 1.86 m is the crowns' mean dome over the shell: the shader's own law of a dome, 5.5 * plc.b - 2.07, at the mean of the
      // map's domes, 0.715 (5.5 * 0.715 - 2.07 = 1.86; the domes' cells take no seed, so that mean is the same in every build)
      const hT = hs[hs.length >> 1] + 1.86;
      const hl = Math.hypot(sunV.x, sunV.z), sxh = sunV.x / hl, szh = sunV.z / hl, tanE = sunV.y / hl, hR = Math.max(shell.material.uniforms.uRag.value.z, hT), hE = hT + 4.5, cx = SHN / 1300, cz = SHN / 1160;
      // (fourth pass) THE REACH OF THE GIANTS' SHADE ON THE DECK'S SHEET, for the sheet's rags by day: for each of the two
      // kapoks, the top of its crown over the sheet over the tangent of this look's sun, and its crown's own radius about
      // its foot (both read off its own leaf masses as built); the taller one's is the bank's breadth. No draw is taken
      {
        const giants = [[CK, crownList.filter((c) => c.set === crownK1 && !c.rim)], [K2, k2Clumps]];
        const reach = Math.max(...giants.map(([f, cs]) => Math.max(0, Math.max(...cs.map((c) => c.y + 0.5 * c.r * c.sy)) - DECK_Y) / tanE + Math.max(...cs.map((c) => Math.hypot(c.x - f.x, c.z - f.z) + c.r))));
        for (const m of decks) m.material.uniforms.uReach.value = reach;
      }
      let n = 0;
      for (const c of crownList) {
        if (c.rim || c.set === crownBank) continue;
        if ((n++ & 3) === 0) await ctx.yield();
        if (c.y >= hE) {
          const rh = 1.3 * c.r + 6, i0 = Math.max(0, Math.floor((c.x - rh + 720) * cx)), i1 = Math.min(SHN - 1, Math.ceil((c.x + rh + 720) * cx)), j0 = Math.max(0, Math.floor((c.z - rh + 420) * cz)), j1 = Math.min(SHN - 1, Math.ceil((c.z + rh + 420) * cz));
          for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
            const v = Math.round(255 * smoothstep(1, 0.45, Math.hypot((i + 0.5) / cx - 720 - c.x, (j + 0.5) / cz - 420 - c.z) / rh)), q = (j * SHN + i) * 4 + 1;
            if (v > shadData[q]) shadData[q] = v;
          }
        }
        const b = 0.5 * c.r * c.sy, topH = c.y + b - hR; if (topH < 0.5) continue;
        const hc = c.y - hR, hb = hc >= b ? b : 0.5 * topH, hm = hc >= b ? hc : 0.5 * topH, across = c.r * (hc >= 0 ? 1 : Math.sqrt(Math.max(0.16, 1 - (hc / b) * (hc / b)))), along = Math.sqrt(across * across + (hb / tanE) * (hb / tanE));
        const mx = c.x - sxh * hm / tanE, mz = c.z - szh * hm / tanE, i0 = Math.max(0, Math.floor((mx - 1.15 * along + 720) * cx)), i1 = Math.min(SHN - 1, Math.ceil((mx + 1.15 * along + 720) * cx)), j0 = Math.max(0, Math.floor((mz - 1.15 * along + 420) * cz)), j1 = Math.min(SHN - 1, Math.ceil((mz + 1.15 * along + 420) * cz));
        for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
          const dx = (i + 0.5) / cx - 720 - mx, dz = (j + 0.5) / cz - 420 - mz, ua = (dx * sxh + dz * szh) / along, va = (dz * sxh - dx * szh) / across, v = Math.round(255 * smoothstep(1.1, 0.6, Math.sqrt(ua * ua + va * va)));
          if (v > shadData[(j * SHN + i) * 4]) shadData[(j * SHN + i) * 4] = v;
        }
      }
      // ITS BLUE, THE CANOPY'S OWN DOMES: the shell's shader gives every crown of the quilt a dome over the gaps round it (its
      // cells, 16 m across, their middles and the warp of their place by its own hash). The same reckoning is done here once
      // for every cell of the map, in the shader's own single precision, so that the mist lies in the gaps the shader paints
      // and the map's coarser levels carry the domes' mean far off: hF and vF are the shader's h21 and vn, step for step
      const fr = Math.fround, hA = fr(123.34), hB = fr(345.45), hC = fr(34.345), hD = fr(11.7), q04 = fr(0.04);
      const hF = (x, y) => { let px = fr(x * hA), py = fr(y * hB); px = fr(px - Math.floor(px)); py = fr(py - Math.floor(py)); const dt = fr(fr(px * fr(px + hC)) + fr(py * fr(py + hC))); px = fr(px + dt); py = fr(py + dt); const q = fr(px * py); return fr(q - Math.floor(q)); };
      const vF = (x, y) => { const ix = Math.floor(x), iy = Math.floor(y); let fx = fr(x - ix), fy = fr(y - iy); fx = fr(fr(fx * fx) * fr(3 - fr(2 * fx))); fy = fr(fr(fy * fy) * fr(3 - fr(2 * fy)));
        const a = hF(ix, iy), b = hF(ix + 1, iy), c = hF(ix, iy + 1), d = hF(ix + 1, iy + 1), ab = fr(fr(a * fr(1 - fx)) + fr(b * fx)), cd = fr(fr(c * fr(1 - fx)) + fr(d * fx)); return fr(fr(ab * fr(1 - fy)) + fr(cd * fy)); };
      // (each cell's middle is reckoned once, for the 88 by 79 cells the map's rectangle and its warp can reach)
      const gx0 = -48, gz0 = -29, gnx = 88, gnz = 79, mid = new Float32Array(gnx * gnz * 2);
      for (let gz = 0; gz < gnz; gz++) for (let gx = 0; gx < gnx; gx++) { const hn = hF(gx0 + gx, gz0 + gz), hm = hF(fr(fr(gx0 + gx + hn) + hD), fr(fr(gz0 + gz + hn) + hD)); mid[(gz * gnx + gx) * 2] = 0.1 + 0.8 * hn; mid[(gz * gnx + gx) * 2 + 1] = 0.1 + 0.8 * hm; }
      await ctx.yield();
      for (let j = 0; j < SHN; j++) {
        if ((j & 3) === 0) await ctx.yield();
        const wz = fr(-420 + (j + 0.5) / cz), qz = fr(wz * q04);
        for (let i = 0; i < SHN; i++) {
          const wx = fr(-720 + (i + 0.5) / cx), qx = fr(wx * q04);
          const px = fr(fr(wx + fr(9 * fr(vF(qx, qz) - 0.5))) / 16), pz = fr(fr(wz + fr(9 * fr(vF(fr(qx + 31), fr(qz + 31)) - 0.5))) / 16), ipx = Math.floor(px), ipz = Math.floor(pz), fpx = px - ipx, fpz = pz - ipz;
          let d1 = 9;
          for (let jj = -1; jj <= 1; jj++) for (let ii = -1; ii <= 1; ii++) {
            const m = ((ipz + jj - gz0) * gnx + ipx + ii - gx0) * 2, rx = ii + mid[m] - fpx, rz = jj + mid[m + 1] - fpz, d = rx * rx + rz * rz;
            if (d < d1) d1 = d;
          }
          shadData[(j * SHN + i) * 4 + 2] = Math.round(255 * clamp(1 - 1.4 * d1, 0, 1));
        }
      }
      shadTex.needsUpdate = true;
      // THE BILLOWS' TILE: three sets of smooth noise on lattices that close on themselves (8, 24 and 72 cells to the tile),
      // their heights summed into red (0.5 = the mean, 5.6 m to the whole range) and their slopes into green and blue (0.6 to
      // the whole range). The lattice's values are a hash of the cell's own number: no draw
      const iH = (ix, iy, s) => { let h = Math.imul(ix, 73856093) ^ Math.imul(iy, 19349663) ^ Math.imul(s, 83492791); h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d); h = Math.imul(h ^ (h >>> 12), 0x297a2d39); return ((h ^ (h >>> 15)) >>> 0) / 4294967296; };
      const bilAcc = new Float32Array(BIN * BIN * 3);
      for (let s = 0; s < 3; s++) {
        const nc = [8, 24, 72][s], amp = [3.2, 1.6, 0.6][s], lat = new Float32Array(nc * nc), gk = amp * nc / 800;
        for (let k = 0; k < nc * nc; k++) lat[k] = iH(k % nc, Math.floor(k / nc), nc);
        for (let j = 0; j < BIN; j++) {
          if ((j & 31) === 0) await ctx.yield();
          const z = (j + 0.5) / BIN * nc, iz = Math.floor(z), fz = z - iz, wz = fz * fz * fz * (fz * (fz * 6 - 15) + 10), dz = 30 * fz * fz * (fz * (fz - 2) + 1), r0 = iz * nc, r1 = ((iz + 1) % nc) * nc;
          for (let i = 0; i < BIN; i++) {
            const x = (i + 0.5) / BIN * nc, ix = Math.floor(x), fx = x - ix, wx = fx * fx * fx * (fx * (fx * 6 - 15) + 10), i1 = (ix + 1) % nc, a = lat[r0 + ix], b = lat[r0 + i1], c = lat[r1 + ix], d = lat[r1 + i1], q = (j * BIN + i) * 3;
            bilAcc[q] += amp * (a + (b - a) * wx + (c - a + (a - b - c + d) * wx) * wz - 0.5);
            bilAcc[q + 1] += gk * 30 * fx * fx * (fx * (fx - 2) + 1) * (b - a + (a - b - c + d) * wz); bilAcc[q + 2] += gk * dz * (c - a + (a - b - c + d) * wx);
          }
        }
      }
      for (let k = 0; k < BIN * BIN; k++) { bilData[k * 4] = Math.round(255 * clamp(0.5 + bilAcc[k * 3] / 5.6, 0, 1)); bilData[k * 4 + 1] = Math.round(255 * clamp(0.5 + bilAcc[k * 3 + 1] / 0.6, 0, 1)); bilData[k * 4 + 2] = Math.round(255 * clamp(0.5 + bilAcc[k * 3 + 2] / 0.6, 0, 1)); bilData[k * 4 + 3] = 255; }
      bilTex.needsUpdate = true;
    }
    await ctx.yield();
    // ---------- red howlers on the bromeliad limb: rust silhouettes, hands and tails on the wood, bodies swinging ----------
    const fur = (t) => [0.36 * (0.75 + 0.35 * t), 0.12 * (0.75 + 0.35 * t), 0.04];
    const monkey = (o, L, pose, k) => {
      const S = V3(-L.z, 0, L.x), P = (a, b, c) => o.clone().addScaledVector(L, a * k).add(V3(0, b * k, 0)).addScaledVector(S, c * k);
      const T2 = (pp, rr, sw = 0) => PGm.tube(pp.map((q) => P(q[0], q[1], q[2])), rr.map((r) => r * k), 6, fur, typeof sw === 'number' ? sw : sw);
      if (pose === 0) {                                                             // sitting on the limb
        T2([[0, 0.08, 0], [0.04, 0.34, 0], [0.12, 0.6, 0], [0.14, 0.66, 0]], [0.17, 0.21, 0.16, 0.08]); T2([[0.13, 0.62, 0], [0.2, 0.75, 0], [0.3, 0.8, 0], [0.34, 0.78, 0]], [0.07, 0.13, 0.1, 0.03]);
        for (const c of [1, -1]) { T2([[0.12, 0.55, 0.15 * c], [0.3, 0.3, 0.2 * c], [0.36, 0.02, 0.1 * c]], [0.055, 0.045, 0.04]); T2([[0, 0.12, 0.13 * c], [0.26, 0.26, 0.2 * c], [0.3, 0, 0.14 * c]], [0.075, 0.06, 0.04]); }
        T2([[-0.12, 0.1, 0], [-0.3, -0.2, 0.04], [-0.3, -0.65, 0], [-0.18, -0.92, 0.05], [-0.26, -1.02, 0.1]], [0.045, 0.04, 0.035, 0.03, 0.02], (t) => 0.3 * t * t);
      } else if (pose === 1) {                                                      // hanging under it by hands and tail
        const sw = (t) => 0.22;
        T2([[0, -0.5, 0], [0.03, -0.8, 0], [0, -1.1, 0], [0, -1.16, 0]], [0.15, 0.2, 0.17, 0.08], sw); T2([[0.05, -0.46, 0], [0.13, -0.36, 0], [0.22, -0.3, 0], [0.26, -0.3, 0]], [0.07, 0.13, 0.1, 0.03], sw);
        for (const c of [1, -1]) { T2([[0.02, -0.55, 0.14 * c], [0.14 * c + 0.1, -0.25, 0.1 * c], [0.2 * c + 0.1, 0, 0]], [0.055, 0.045, 0.04], (t) => 0.22 * (1 - t)); T2([[0, -1.05, 0.12 * c], [0.2, -1.3, 0.16 * c], [0.12, -1.55, 0.14 * c]], [0.075, 0.06, 0.04], (t) => 0.22 + 0.12 * t); }
        T2([[-0.05, -1.08, 0], [-0.3, -0.9, 0], [-0.42, -0.4, 0], [-0.4, 0, 0]], [0.045, 0.04, 0.035, 0.03], (t) => 0.22 * (1 - t));
      } else {                                                                      // walking the limb on all fours
        T2([[-0.3, 0.42, 0], [0, 0.46, 0], [0.3, 0.44, 0], [0.36, 0.44, 0]], [0.15, 0.19, 0.16, 0.08]); T2([[0.34, 0.47, 0], [0.44, 0.56, 0], [0.54, 0.54, 0], [0.58, 0.5, 0]], [0.07, 0.125, 0.1, 0.03]);
        for (const c of [1, -1]) { T2([[0.28, 0.4, 0.12 * c], [0.32 + 0.08 * c, 0.2, 0.13 * c], [0.3 + 0.14 * c, 0, 0.1 * c]], [0.055, 0.045, 0.04]); T2([[-0.26, 0.4, 0.12 * c], [-0.3 - 0.08 * c, 0.2, 0.13 * c], [-0.26 - 0.14 * c, 0, 0.1 * c]], [0.07, 0.055, 0.04]); }
        T2([[-0.32, 0.44, 0], [-0.6, 0.62, 0], [-0.85, 0.5, 0.05], [-0.95, 0.25, 0.05]], [0.045, 0.04, 0.03, 0.02], (t) => 0.15 * t);
      }
    };
    const howlAt = V3();
    if (howlLimb) {
      const L = dirAz(HOWL_AZ), at = (t) => { const f = t * 6, i = Math.min(5, Math.floor(f)); return howlLimb[i].clone().lerp(howlLimb[i + 1], f - i).add(V3(0, 0.55 * (1 - 0.72 * t) * 0.9, 0)); };
      [[0.44, 0, 1.6], [0.54, 1, 1.5], [0.62, 0, 1.2], [0.71, 2, 1.55], [0.8, 1, 1.45], [0.88, 0, 1.6], [0.96, 0, 0.95]].forEach(([t, pose, k], i) => monkey(at(t), i % 2 ? L : L.clone().negate(), pose, k));
      howlAt.copy(at(0.68));
    } else howlAt.copy(k1).setY(20);
    // understorey: big ferns as broad-leaved herbs, palms on the creek banks and round the light well
    const palms = [0, 1].map((k) => flora.palmGeometry({ rng: pr.fork('palm' + k), height: 6.5, detail: 1, coconuts: false, curve: 0.5 }));
    await ctx.yield();
    for (let k = 0, tries = 0; k < 14 && tries < 400; tries++) {
      if ((tries & 3) === 0) await ctx.yield();
      const inWell = pr.chance(0.45), a = pr() * TAU, t = pr(), side = pr.sign() * pr.range(10, 19);
      const x = inWell ? CK.x + Math.cos(a) * pr.range(27, 36) : lerp(G1.x, E.x, t) + rgt.x * side, z = inWell ? CK.z + Math.sin(a) * pr.range(27, 36) : lerp(G1.z, E.z, t) + rgt.z * side, y = height(x, z);
      if (y < WL + 0.3 || path.nearestXZ(x, z).dist < 11.5) continue;
      put(pr.pick(palms), V3(x, y - 0.2, z), pr.range(0.8, 1.5), [1, 1, 1]); k++;
    }
    for (let k = 0, tries = 0; k < 70 && tries < 900; tries++) {
      if ((tries & 7) === 0) await ctx.yield();
      const a = pr() * TAU, rr = pr.range(4, 33), x = CK.x + Math.cos(a) * rr, z = CK.z + Math.sin(a) * rr, y = height(x, z), s = pr.range(1.6, 3.2);
      if (y < WL + 0.2 || !clearOf(V3(x, y + s, z), s, 7)) continue;
      put(pr.pick(ferns), V3(x, y - 0.1, z), s, [pr.range(0.6, 1), pr.range(0.8, 1.1), 0.7], 0.05); k++;
    }
    await ctx.yield();
    // drift logs on the bar, the turtle log in the reach, a caiman as eyes and a snout line
    const logAt = (x, y, z, len, az, r, tilt = 0) => {
      const d = V3(Math.cos(az), tilt, Math.sin(az)), a = V3(x, y, z), wood = [0.4, 0.34, 0.26], P = [0, 0.3, 0.7, 1].map((t) => a.clone().addScaledVector(d, len * (t - 0.5)).add(V3(0, 0.15 * Math.sin(t * 3), 0)));
      PGm.tube(P, [r * 1.15, r, r * 0.85, r * 0.6], 7, (t, s) => wood.map((c) => c * (0.7 + 0.3 * ((s * 7 + 3) % 5) / 5)), 0);
      for (let k = 0; k < 3; k++) { const o = a.clone().addScaledVector(d, len * pr.range(-0.3, 0.45)), e = V3(pr.range(-1, 1), pr.range(0.5, 1.4), pr.range(-1, 1)).multiplyScalar(len * 0.12); PGm.tube([o, o.clone().add(e)], [r * 0.3, r * 0.12], 5, () => wood, 0); }
      return { a, d };
    };
    const sandBlobs = [], sAt = terrain.surfaceAt ? (x, z) => terrain.surfaceAt(x, z) : height;
    // the top of the sand sheet laid over the bar: above the terrain mesh everywhere within a cell, so no terrain facet pokes through
    const sandTop = (x, z) => { let m = -1e9; for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) m = Math.max(m, sAt(x + i * 0.75, z + j * 0.75)); return m + 0.05; };
    for (const [uL, rt, len, az] of [[0.512, 8, 6.5, 0.5], [0.533, 12.5, 8, 2.2], [0.546, -13.5, 5, 1.2], [0.566, 12, 7, 0.2], [0.584, 8.5, 5.5, 2.6]]) {     // drift logs the low pass streaks over
      const q = path.pointAt(uL), tq2 = path.tangentAt(uL).setY(0).normalize(), x = q.x - tq2.z * rt, z = q.z + tq2.x * rt, y = height(x, z);
      if (y < WL + 0.15 || creekSD(x, z) < 2) continue;
      logAt(x, y + 0.24, z, len, az, 0.34, 0.04); sandBlobs.push([x, z, len * 0.34, 0.45]);
    }
    for (let k = 0, tries = 0; k < 7 && tries < 200; tries++) {
      const x = pr.range(-185, 30), z = pr.range(122, 152), y = height(x, z);
      if (y < WL + 0.25 || barAt(x, z) < 0.5 || path.nearestXZ(x, z).dist < 9) continue;
      logAt(x, y + 0.25, z, pr.range(4, 9), pr() * TAU, pr.range(0.25, 0.5), pr.range(0, 0.12)); k++;
    }
    // THE SNAG: a drowned tree stranded in the reach, 7.5 m to the left of our line at u 0.105: root plate, a 12 m bole awash,
    // bleached limbs standing out of the water, turtles in a row along it and three egrets on its thick end. It is the near
    // subject of the approach (the gaze leans to it from u 0.04 to 0.11)
    const tp = path.pointAt(0.142), tt = path.tangentAt(0.142).setY(0).normalize(), tlPos = V3(tp.x + tt.z * 13.5, WL + 0.3, tp.z - tt.x * 13.5);
    const tlog = logAt(tlPos.x, tlPos.y, tlPos.z, 12, Math.atan2(tt.z, tt.x) + 0.35, 0.5, 0.03), sulphur = [], snagAt = tlPos.clone().setY(WL + 1.6);
    {
      const sr = ctx.core.makeRng('macaw-snag:' + ctx.seed), d = tlog.d.clone().setY(0).normalize(), sd = V3(-d.z, 0, d.x), butt = tlog.a.clone().addScaledVector(d, -6.1), grey = [0.44, 0.4, 0.33];
      const wood = (k) => (t, s2) => { const n = 0.5 + 0.5 * noise.n2(t * 5 + k, s2 * 1.7 + k); return grey.map((c, i) => c * (0.62 + 0.5 * n) * (i === 2 ? 0.92 : 1) * (0.75 + 0.3 * t)); };
      for (let k = 0; k < 9; k++) {                                                   // the root plate, torn out of the bank
        const a = (k / 9) * TAU + sr.range(-0.2, 0.2), o = sd.clone().multiplyScalar(Math.cos(a)).add(V3(0, Math.sin(a), 0)), len = sr.range(1.5, 2.9) * (Math.sin(a) > -0.3 ? 1 : 0.6), bend = sr.range(-0.5, 0.5);
        const P = [0, 0.4, 0.75, 1].map((t) => butt.clone().addScaledVector(o, len * t).addScaledVector(d, -0.5 * t * t - 0.25 * t + bend * 0.3 * t).add(V3(0, 0.35 * Math.sin(t * 2.6 + k), 0)));
        PGm.tube(P, [0.24, 0.17, 0.1, 0.035], 6, wood(k), 0);
        if (k % 2 === 0) { const q = P[2], e = o.clone().applyAxisAngle(d, sr.range(0.5, 1.0) * (k % 4 ? 1 : -1)); PGm.tube([q, q.clone().addScaledVector(e, len * 0.45).addScaledVector(d, -0.2)], [0.08, 0.02], 5, wood(k + 9), 0); }
      }
      for (const [off, lean, hgt, az] of [[-1.2, 0.5, 4.4, 0.4], [2.6, -0.6, 3.5, -0.5], [4.6, 0.25, 2.5, 0.9], [0.9, -0.2, 2.2, -1.2]]) {      // dead limbs standing out of the water
        const o = tlog.a.clone().addScaledVector(d, off).add(V3(0, 0.3, 0)), up = V3(0, 1, 0).addScaledVector(d, lean).addScaledVector(sd, az * 0.5).normalize(), k = sr.range(0, 9);
        const P = [0, 0.35, 0.7, 1].map((t) => o.clone().addScaledVector(up, hgt * t).addScaledVector(sd, 0.5 * az * t * t).add(V3(0.2 * Math.sin(t * 4 + k), 0, 0.2 * Math.cos(t * 3 + k))));
        PGm.tube(P, [0.2, 0.14, 0.085, 0.03], 6, wood(k), (t) => 0.04 * t * t);
        for (const [t0, sg] of [[0.45, 1], [0.7, -1]]) { const q = P[1].clone().lerp(P[2], t0), e = up.clone().addScaledVector(sd, sg * sr.range(0.7, 1.2)).addScaledVector(d, sr.range(-0.6, 0.6)).normalize(), l2 = hgt * sr.range(0.3, 0.5);
          PGm.tube([q, q.clone().addScaledVector(e, l2 * 0.6), q.clone().addScaledVector(e, l2).add(V3(0, 0.25 * l2, 0))], [0.075, 0.05, 0.015], 5, wood(k + 3), (t) => 0.05 * t); }
      }
    }
    for (let k = 0; k < 5; k++) {
      const c = tlog.a.clone().addScaledVector(tlog.d, -1.6 + k * 1.05).add(V3(0, 0.5, 0)), sc = pr.range(0.8, 1.15);
      const sh = [0.1, 0.1, 0.07], ring = (t) => 0.3 * Math.sin(Math.PI * clamp(t, 0.04, 0.96)) * sc;
      const P = [0, 0.25, 0.5, 0.75, 1].map((t) => c.clone().addScaledVector(tlog.d, (t - 0.5) * 0.62 * sc).add(V3(0, 0.12 * Math.sin(Math.PI * t) * sc, 0)));
      PGm.tube(P, (t, a) => ring(t) * (0.55 + 0.45 * Math.abs(Math.cos(a))), 8, (t, s) => sh.map((v) => v * (s % 2 ? 1.5 : 1)), 0);
      const hd = c.clone().addScaledVector(tlog.d, 0.36 * sc).add(V3(0, 0.1, 0)); PGm.tube([hd, hd.clone().addScaledVector(tlog.d, 0.16).add(V3(0, 0.07, 0))], [0.05, 0.045], 5, () => [0.14, 0.13, 0.05], 0);
      sulphur.push([hd.x + pr.range(-0.5, 0.5), hd.y + pr.range(0.2, 0.7), hd.z + pr.range(-0.5, 0.5)], [hd.x + pr.range(-0.8, 0.8), hd.y + pr.range(0.2, 1.1), hd.z + pr.range(-0.8, 0.8)]);
    }
    { const cp = path.pointAt(0.15), ct = path.tangentAt(0.15), c = V3(cp.x - ct.z * 11, WL - 0.02, cp.z + ct.x * 11), d = V3(ct.x, 0, ct.z).applyAxisAngle(V3(0, 1, 0), 0.6), dk = () => [0.07, 0.08, 0.05];
      PGm.tube([c, c.clone().addScaledVector(d, 0.7), c.clone().addScaledVector(d, 1.3)], [0.16, 0.11, 0.08], 6, dk, 0);
      for (const sg of [1, -1]) { const e = c.clone().addScaledVector(d, -0.15).add(V3(-d.z * 0.11 * sg, 0.06, d.x * 0.11 * sg)); PGm.tube([e, e.clone().add(V3(0, 0.09, 0))], [0.07, 0.04], 5, dk, 0); } }
    if (rare) {                                                                      // the harpy, perched beside the portal after its miss
      const o = V3(k2.x, 64.6, k2.z).addScaledVector(lf2, -9.9).addScaledVector(hf2, -1.0), k = 1.5, P = (a, b) => o.clone().addScaledVector(hf2, -a * k).add(V3(0, b * k, 0));
      PGm.tube([P(0, -0.05), P(0, 0.3), P(0.04, 0.62), P(0.08, 0.7)], [0.12 * k, 0.2 * k, 0.16 * k, 0.07 * k], 8, (t, s) => (s >= 2 && s <= 5 ? [0.62, 0.62, 0.58] : [0.1, 0.11, 0.13]), 0);
      PGm.tube([P(0.08, 0.7), P(0.13, 0.82), P(0.2, 0.84), P(0.26, 0.78)], [0.07 * k, 0.11 * k, 0.085 * k, 0.02 * k], 6, (t) => (t > 0.8 ? [0.05, 0.05, 0.05] : [0.38, 0.39, 0.4]), 0);
      PGm.tube([P(0.05, 0.9), P(-0.04, 1.02)], [0.04 * k, 0.01], 4, () => [0.2, 0.2, 0.22], 0.03);
      PGm.tube([P(-0.06, 0.05), P(-0.14, -0.3), P(-0.16, -0.6)], [0.1 * k, 0.09 * k, 0.07 * k], 5, (t) => (t > 0.45 && t < 0.75 ? [0.5, 0.5, 0.48] : [0.09, 0.1, 0.12]), 0.02);
    }
    await ctx.yield();
    const plants = new THREE.Mesh(await PGm.build(ctx.yield), mat); plants.frustumCulled = false; scene.add(plants);
    await ctx.yield();

    // ---------- lianas, cane grass, ferns ----------
    const loops = [], cables = [], ml = midLimbs.filter(Boolean), arr = (v) => [v.x, v.y, v.z];
    for (let k = 0; k < ml.length; k++) {
      const a = ml[k][6], b = ml[(k + 1) % ml.length][6], c = ml[k][4];
      if (a.distanceTo(b) < 17) loops.push([arr(a), arr(b)]);
      const g = V3(c.x + pr.range(-1.5, 1.5), 0, c.z + pr.range(-1.5, 1.5)); g.y = groundAt(g.x, g.z) + 0.1; cables.push([arr(c), arr(g)]);
    }
    for (let k = 0; k < 4; k++) { const o = dirAz(k * 90 + pr.range(-25, 25)), a = k1.clone().addScaledVector(o, pr.range(5, 9)).setY(41); cables.push([arr(a), [a.x + pr.range(-1, 1), pr.range(9, 24), a.z + pr.range(-1, 1)]]); }
    for (let k = 0; k < 10; k++) {
      const a1 = k * 36 + pr.range(-8, 8), a2 = a1 + pr.range(20, 34), p1 = CK.clone().addScaledVector(dirAz(a1), pr.range(35, 41)).setY(pr.range(14, 30)), p2 = CK.clone().addScaledVector(dirAz(a2), pr.range(35, 41)).setY(pr.range(12, 30));
      loops.push([arr(p1), arr(p2)]); if (k % 2) cables.push([arr(p1), [p1.x, groundAt(p1.x, p1.z), p1.z]]);
    }
    await ctx.yield();
    const underCanopy = [];                                                         // meshes only ever seen from under the canopy: hidden above it
    const vineOpt = { material: mat, thickness: 0.17, stem: '#3a3226', leaf: '#3c7a30' };
    const vines = [flora.makeVines({ rng: pr.fork('loops'), spans: loops, sag: 0.36, leaves: 0.6, hangers: 1.2, ...vineOpt })];
    for (const v of vines) { v.object.frustumCulled = false; scene.add(v.object); underCanopy.push(v.object); }
    await ctx.yield();
    {                                                                               // hanging cables: bowed, twisting, two strands wound together, leaf sprays at intervals
      const LG = new PG(solid), lr = pr.fork('cables');
      for (const [a, b] of cables) {
        await ctx.yield();
        const A = V3(...a), B = V3(...b), len = A.distanceTo(B), n = Math.max(8, Math.round(len / 1.6)), bow = lr.range(0.04, 0.1) * len, ba = lr() * TAU, tw = lr.range(0.5, 1.1), r0 = lr.range(0.1, 0.17), ph = lr() * TAU;
        for (let strand = 0; strand < 2; strand++) {
          const P = [];
          for (let k = 0; k <= n; k++) { const t = k / n, w = Math.sin(Math.PI * t), ang = ph + t * len * tw + strand * Math.PI, rr = 0.16 + 0.1 * Math.sin(t * 9 + ph);
            P.push(V3(lerp(A.x, B.x, t) + Math.cos(ba) * bow * w + Math.cos(ang) * rr * w, lerp(A.y, B.y, t) - 0.03 * len * w, lerp(A.z, B.z, t) + Math.sin(ba) * bow * w + Math.sin(ang) * rr * w)); }
          if (!P.every((q) => clearOf(q, 0.3, 5.5))) continue;
          LG.tube(P, P.map((_, k) => r0 * (strand ? 0.6 : 1) * (0.85 + 0.3 * Math.sin(k * 1.7 + ph))), 5, (t, s2) => barkMix(t * len, s2 + strand * 3, 0.75), (t) => 0.5 * Math.sin(Math.PI * t));
          if (strand === 0) for (let k = 2; k < n - 1; k += 2) if (lr() < 0.55) { const o = P[k], d = V3(lr.range(-1, 1), lr.range(-0.6, 0.2), lr.range(-1, 1)).normalize(), gsh = lr.range(0.7, 1.1);
            LG.card(o, o.clone().addScaledVector(d, lr.range(0.7, 1.2)), V3(-d.z, 0, d.x).normalize().multiplyScalar(0.4), flora.LEAF_CELLS.cluster, [0.2 * gsh, 0.42 * gsh, 0.14 * gsh], 0.4, 1); }
        }
      }
      if (LG.count) { const lm = new THREE.Mesh(await LG.build(ctx.yield), mat); lm.frustumCulled = false; scene.add(lm); underCanopy.push(lm); }
    }
    await ctx.yield();
    const cane = await flora.makeGrassAsync({ rng: R.fork('cane'), bounds: [-190, 146, 75, 170], heightAt: groundAt, count: Math.round(1500 * detail), width: [1.3, 2.0], height: [1.7, 2.9], wind, map: mat.map, flowers: 0,
      density: (x, z) => (barAt(x, z) > 0.15 && groundAt(x, z) > WL + 0.9 && path.nearestXZ(x, z).dist > 6 ? 1 : 0), root: '#56622a', tip: '#b9b266', dryAmount: 0.4, chunks: 2, fade: [170, 230] }, ctx.yield);
    scene.add(cane.object);
    await ctx.yield();
    const cane2 = await flora.makeGrassAsync({ rng: R.fork('cane2'), bounds: [-192, 104, -132, 160], heightAt: groundAt, count: Math.round(900 * detail), width: [1.1, 1.8], height: [1.3, 2.3], wind, map: mat.map, flowers: 0,
      density: (x, z) => { if (barAt(x, z) <= 0.5 || groundAt(x, z) <= WL + 0.45 || noise.n2(x * 0.11 + 7, z * 0.11) <= 0.05) return 0; const pd = path.nearestXZ(x, z).dist; return pd > 6.5 && pd < 19 && Math.hypot(x - herdC.x, z - herdC.z) > 3 ? 1 : 0; },
      root: '#56622a', tip: '#c2b86a', dryAmount: 0.5, chunks: 1, fade: [150, 200] }, ctx.yield);
    scene.add(cane2.object);
    await ctx.yield();
    const fernBed = flora.makeFerns({ rng: R.fork('ferns'), path, uRange: [0.58, 0.76], heightAt: groundAt, wind, map: mat.map, count: Math.round(230 * detail), radius: 30, corridor: 8, scale: [1.3, 2.5],
      density: (x, z) => (height(x, z) > WL + 0.4 ? 1 : 0), chunks: 1, fade: [110, 150] });
    scene.add(fernBed.object);
    await ctx.yield();
    // lily rafts on the creek's margins and in the slack water at its mouth
    const pads = flora.makeLilyPads({ rng: R.fork('pads'), bounds: [-236, 116, -132, 262], count: Math.round(100 * detail), spacing: 1.5, waterY: WL + 0.03, scale: [1.3, 2.7], flowers: true, material: mat, chunks: 1,
      density: (x, z) => { const cd = creekSD(x, z); return cd < -0.3 && cd > -6 && height(x, z) < WL - 0.1 && path.nearestXZ(x, z).dist > 3.2 && noise.n2(x * 0.16 + 3, z * 0.16) > -0.2 ? 1 : 0; } });
    scene.add(pads.object);
    await ctx.yield();

    // ---------- wildlife ----------
    const fauna = F.makeFauna(scene, { light: F.lightFrom(scene) }), fr2 = R.fork('fauna');
    fr2.fork('pair');                                                               // (the opening pair is the hero's own macaws now, flown in update: see leadPair)
    {
      const d = tlog.d.clone().setY(0).normalize(), spots = [-5.1, -4.0, -3.0].map((o) => { const q = tlog.a.clone().addScaledVector(d, o); return { x: q.x, z: q.z }; });
      fauna.add(F.makeWaders({ rng: ctx.core.makeRng('macaw-snag-egret:' + ctx.seed), species: 'egret', count: 3, positions: spots, level: tlog.a.y + 0.55, depth: 0, heightAt: () => -100, size: 2.5, active: 0.7, blobShadow: false }), { always: true });
    }
    await ctx.yield();
    // The swifts are birds of the water's skin: two rings low over the open water of the first reach, one to each side of our line where
    // we ride low (u 0.10 to 0.17, 4.1 to 5 m over the water); neither crosses our line anywhere, at any clock (a ring runs on the clock
    // alone). What the keys do. wander: a swift strays from its station at most 4 m along x (the kit's 1.5 times the first figure), 1.5 m
    // up and down and 4 m along z (the designer's metres; the kit's swifts have [9, 5, 8]); the fourth figure is the kit's. spread: no
    // dealt offset across, in height or along z (the kit's are bell-curve draws of 18 m and 7 m with no bound; the same draws are taken, times
    // nought), so every swift rides the ring's own line, strung over the kit's 40 m of lag. Height: a swift's middle stays between
    // 1.05 m over the water (the largest swift's reach: no wing in the water) and the designer's 5 m: the centre is their middle,
    // 3.025 m; of the 1.975 m either way the wander takes 1.5 m and the ring's own rise and fall the other 0.475 m: the height key
    // 0.385, a ring of the kit's straying at the most 1.231 of its key (100,000 rings dealt). Centre and radius: the right ring's centre
    // has 37.62 m of room about it and the left one's, north-west of the snag, 21.38 m (the largest disc whose every point, widened by a
    // swift's box and its clear air, is clear of our whole line, of the snag and of land at the lowest water: measured, this world's
    // notes), and a ring of the kit's reached at the most 1.32 of its radius on 100,000 rings dealt: 28.5 m on the right; on the left 14 m, 18.49 / 1.32, where
    // 18.49 m is the centre's z less the snag's north end (z 60.96 at the lowest water), its wood (3.5), the box (4) and the reach
    // (1.05): no box comes to the snag wherever the block below slides the ring along x.
    const swiftsR =                                                                 // (the name only)
    fauna.add(F.makeFlock({ rng: fr2.fork('sw1'), species: 'swifts', count: Math.round(12 * density), center: [158, WL + 3.025, 89], radius: 28.5, height: 0.385, spread: [0, 0, 40], wander: [4 / 1.5, 1.5, 4, 0.7], body: '#1a2440', belly: '#efe8dc' }));
    const swiftsL =                                                                 // (the name only)
    fauna.add(F.makeFlock({ rng: fr2.fork('sw2'), species: 'swifts', count: Math.round(10 * density), center: [83, WL + 3.025, 88], radius: 14, height: 0.385, spread: [0, 0, 40], wander: [4 / 1.5, 1.5, 4, 0.7], body: '#1a2440', belly: '#efe8dc' }));
    {
      // Each ring is then slid along the world's x toward our line (the right ring toward -x, the left toward +x), once, here at the
      // build, by the most that leaves every swift's box its clear air in plan from every point of our whole line, read from what the kit
      // dealt this ring: so the nearest box of every ring that is kept stands just beyond its clear air beside our line, on both
      // sides (0.46 to 0.70 m beyond, on the deals measured: this world's notes), and no box is over or under our line. A box is a
      // point of the ring (a table of 0.5 m) and the largest dealt offset (nought by the call), widened by the wander at its extreme,
      // whatever the hash gives (1.5 times its first figure along x, its third along z), and by a table step: half a step for the
      // ring's table and half for our line's (a table of 0.5 m too). Where our line's table runs uneven a point between two
      // neighbours can stand a few millimetres further off than that half step (about 6, by a reader's sum: not measured), which the
      // lines do not hold and the measured 0.46 m covers. The clear air c is 2.0 m and the largest
      // swift's reach (no vertex stands further from the bird's place, whatever the wing does: the wing's turn about its shoulder, the
      // kit's wing law), or the kit's own guard (uNear.y) where that is more. Where a line point's z is within c of a ring point's box,
      // their x must differ by w, the box's half and what is left of c (sqrt(c^2 - gz^2)): the slide is the least, over such pairs not
      // already behind the ring by w, of the line point's distance ahead less w (a line point outside the ring's z, or so far ahead of
      // the ring's foremost point that it can ask no less than is already found, is passed over). The slide is the group's own place:
      // the kit draws, guards and culls the flock through the group's matrix, and its timetable reads only the metre along the ring.
      // The slide found is kept in the group's userData.slid.
      // The guard: a ring of which a name read here is absent or of the wrong kind (the attributes' own readers are asked), or an array
      // not four numbers a bird long, or of which a number read here is not a finite number (the uniforms' figures, the route's length,
      // every number of iA and iB; the reach, and so every number of the model read for it), or whose route is longer than MOST steps
      // of the table (10 km), or whose model has more than MOST vertices, or which is not clear of our line as dealt (none is, on any
      // deal measured: this world's notes), or for which the search finds no slide (no point of our line beside the ring), is left out
      // of the world: taken out of its parent (the kit's update sets `visible` anew every frame), with one warning that gives the
      // reason (the reasons of one kind share a text). Both rings are left out the same way if our own path's length is not a finite
      // number or is over MOST steps of its table. So every loop here has an end: a table or the model, MOST steps; the pairs, MOST by MOST.
      await ctx.yield();
      const p = V3(), h = 0.5, line = [], fin = Number.isFinite, MOST = 20000;
      const attr = (a) => typeof a.getX === 'function' && typeof a.getY === 'function' && typeof a.getZ === 'function' && typeof a.getW === 'function' && fin(a.count) && a.count <= MOST;
      const unsound = 'a number this world reads of the kit\'s flock or of our path is not a finite number, an attribute is of the wrong kind, or the ring, the bird\'s model or our path is longer than the search\'s most of steps';
      const lineOk = fin(path.length) && path.length <= MOST * h;
      if (lineOk) for (let d = 0; d <= path.length; d += h) { path.posAtDist(d, p); line.push(p.x, p.z); }
      for (const [fl, to, name] of [[swiftsR, -1, 'right'], [swiftsL, 1, 'left']]) {
        await ctx.yield();
        const at = fl && fl.geometry && fl.geometry.attributes, U = fl && fl.uniforms, n = fl && fl.count;
        let go = Infinity, why = 'a name this world reads of the kit\'s flock is absent, of the wrong kind or out of its range, or an array is not of the count\'s length';
        const named = !!(at && U && n > 0 && fl.object && fl.object.position && fl.object.userData && typeof fl.object.updateMatrixWorld === 'function' && fl.route && typeof fl.route.pointAt === 'function' && fl.route.length > 0
          && at.iA && at.iB && at.aAnim && at.position && at.iA.array && at.iB.array && typeof at.iA.array.every === 'function' && typeof at.iB.array.every === 'function'
          && at.iA.array.length === n * 4 && at.iB.array.length === n * 4 && U.uWander && U.uFlap && U.uWing && U.uNear && U.uScale);
        const sound = named && lineOk && attr(at.aAnim) && attr(at.position) && fin(fl.route.length) && fl.route.length <= MOST * h && fin(U.uScale.value) && fin(U.uNear.value?.y) && fin(U.uFlap.value?.y)
          && fin(U.uWander.value?.x) && fin(U.uWander.value?.z) && fin(U.uWing.value?.w) && fin(U.uWing.value?.x) && at.iA.array.every(fin) && at.iB.array.every(fin);
        if (named && !sound) why = unsound;
        if (sound) {
          const iA = at.iA.array, iB = at.iB.array, wan = U.uWander.value, amp = U.uFlap.value.y, ring = [];
          let reach = 0, c = U.uNear.value.y, wide = 0, z0 = Infinity, z1 = -Infinity, fore = -Infinity;
          for (let i = 0; i < at.position.count; i++) {
            const side = at.aAnim.getY(i), d = Math.abs(side) > 0.5 ? at.aAnim.getX(i) : 0;
            reach = Math.max(reach, Math.hypot(at.position.getX(i) - side * d, at.position.getY(i), at.position.getZ(i)) + d * (1 + Math.hypot(0.22, 0.25) * amp) + U.uWing.value.w * amp + 0.06 * U.uWing.value.x * at.aAnim.getW(i));
          }
          for (let i = 0; i < n; i++) { c = Math.max(c, 2.0 + reach * iB[i * 4] * U.uScale.value); wide = Math.max(wide, Math.abs(iA[i * 4]), Math.abs(iB[i * 4 + 3])); }
          for (let s = 0; s < fl.route.length; s += h) { fl.route.pointAt(s, p); ring.push(p.x, p.z); z0 = Math.min(z0, p.z); z1 = Math.max(z1, p.z); fore = Math.max(fore, to * p.x); }
          const ex = 1.5 * wan.x + wide + h, ez = wan.z + wide + h;
          for (let b = 0; b < line.length; b += 2) {
            if (line[b + 1] < z0 - ez - c || line[b + 1] > z1 + ez + c || to * line[b] - fore - ex - c >= go) continue;
            for (let a = 0; a < ring.length; a += 2) {
              const gz = Math.abs(line[b + 1] - ring[a + 1]) - ez;
              if (gz >= c) continue;
              const d = to * (line[b] - ring[a]), w = ex + (gz > 0 ? Math.sqrt(c * c - gz * gz) : c);
              if (d > -w) go = Math.min(go, d - w);
            }
          }
          why = !fin(reach) ? unsound : go < 0 ? 'the ring as dealt is not clear of our line' : 'no point of our line lies ahead of the ring beside it';
        }
        if (go >= 0 && go < Infinity) { fl.object.position.x = to * go; fl.object.updateMatrixWorld(); fl.object.userData.slid = to * go; }
        else { console.warn('macaw-wall: the ' + name + ' ring of swifts is left out (' + why + ')'); if (fl && fl.object && fl.object.parent && typeof fl.object.parent.remove === 'function') fl.object.parent.remove(fl.object); }
      }
    }
    await ctx.yield();
    const skimmers =                                                                // (the name only)
    fauna.add(F.makeFlock({ rng: fr2.fork('skim'), species: 'gulls', count: 20, size: 1.3, body: '#17171c', belly: '#f1eee6', wingC: '#1c1c22', trail: '#26262c', tip: '#101014', beak: '#e4572a', head: '#17171c', spread: [2.8, 0.5, 10], wander: [0.75, 0.4, 0.6, 0.35], glide: 0,
      // (the skimmers come up from the bar ahead of us, go up the creek with us and are overtaken; the last of them has left the frame before
      // the lens reaches the liana that hangs across our line over the creek (they fly on over and behind the lens to the route's end). What
      // the keys do: the route's chord is 100 m long in plan; in plan its middle is the point of our path 20 m past the lens's place at u 0.6,
      // moved 2.3 m to our right; it lies 33 degrees across our heading there, from our right to our left; the route bows 5.2 m to the left
      // of the chord at its middle, where it stands 5.8 m over that point of our path, and climbs 16.5 m from end to end, steeper at its
      // start (the sag). It starts 2.1 to 4.1 m under the ground of the bar (deepest at low water) and is over the ground from 0.07 to 0.14
      // of its length on. The flock flies it by the kit's law for a crossing (no speed key): on this path's length 0.648 of the lens's own speed at every moment,
      // which is the kit's 12 m/s at the flight's mean speed; always slower than the lens. Measured in the page
      // on seeds 1 to 40 at entry clocks 0 and 27, every vertex of every bird at every step of a thirtieth of a second: the birds come up
      // through the ground 34 m and more ahead of the lens, none of them still in the route's start fade; the lens passes the liana at u
      // 0.639 to 0.647, and the last skimmer has left the frame by u 0.624: no skimmer's skin crosses a liana or a cable; every bird leaves
      // the frame by its top or its left side at full size, 6.4 to 17 m from the lens and before it is 0.63 of the way along the route: the
      // route's end fade is never in frame; no vertex of a bird's skin comes within 4.3 m of the lens. spread and wander are cut by the call:
      // spread from [8, 1.5] to [2.8, 0.5] (the kit lays the first figure on the world's x and z alike and the second on height; the lag of
      // 10 m stays), wander from the kit's [5, 2.5, 4] for gulls to
      // [0.75, 0.4, 0.6]. Where the figures come from: a search over the kit's keys with the bar's land, its wood and the creek's lianas in
      // the count (this world's notes), measured on seeds 1 to 40 for 2.0 m of clear air between the lens and each bird's skin wherever its
      // wander can put it (the box of its wander: 3.48 m at the least), and again with each key moved a tenth either way (u by 0.005): 2.92 m
      // and more. They are not fitted to a still's position, to one seed or to a clock; for the far wood at the lift and the route's start
      // fade the row is fitted to the land of the forty seeds as a set (a key moved a tenth keeps the clear air, not those two). What still
      // stands in the flock's way is counted in the notes, not cured here: far wood at the lift (a cecropia's bole on 3 seeds of the forty, a drift log on 1), the flying egrets on 2
      // seeds, and the macaws' stream, where skimmers lie over macaws on the picture for a second and a half a pass at the mean. glide: 0:
      // the kit's gulls hold their wings out about half the time; with the key at nought every skimmer's wings beat at every moment. It
      // moves no bird's place.)
      cross: { path, u: 0.6, lead: 20, angle: -33, side: 1, offset: 2.3, bow: -5.2, height: 5.8, rise: 16.5, sag: -4.2, span: 100, duration: DUR } }));
    {
      // THE SKIMMERS ARE KEPT OFF THE LENS BY PLACE ON EVERY DEAL. The world reads the kit flock's arrays here: of the flock the call above
      // makes (held by its name) the instance arrays iA and iB, aAnim and position, the uniforms uWander, uFlap, uWing,
      // uNear, uScale, uSpeed and uEps, the route (pointAt, length), the count, the object, the culling sphere (bounds) and positionAt. Once,
      // here at the build, bird by bird, from what the kit dealt this flock; no draw is made.
      // The kit's law for a crossing: with the lens at metre d of our line the flock's lead point is at the route's metre
      // Lr / 2 + (d / L - 0.6) * uSpeed * DUR (0.6 and DUR are the call's own u and duration; the call has no window and no drift, and the
      // flock rides no treadmill behind the portal: at u 0 its lead point is before the route's first metre: by the call's keys, not
      // tested here), and a bird rides its lag (iA's
      // third number) behind the lead point. The kit draws a bird while the route's metre 2 * uEps * uSpeed ahead of it is on the route (its
      // end fade is read that far ahead of the bird; the route runs on straight past its ends): from that far before the route's first metre
      // to that far before its last. The walk holds a bird from there on to the route's last metre, its whole passage and those metres
      // more, by the lens's metres that go with them. The bird's box there is the route's point plus its dealt offsets
      // (iA's x and height, iB's fourth number z) widened by the wander at its extreme, whatever the hash gives: 1.5 times the wander's first
      // figure along x, its second in height, its third along z. The clear air asked between the lens's place and that box: 2.0 m and the
      // bird's reach at its dealt size (iB's first number; the reach is the swifts' bound above: no vertex stands further from the bird's
      // place, whatever the wing does), or the kit's own guard (uNear.y: inside it the kit shrinks a bird) where that is more.
      // The walk goes by metres of our line, not by a grid of u. From a lens metre where the box stands D off the lens the next one is no
      // further on than the gap over the clear air allows (to a metre of our line the lens moves a metre and the route's point `rate` of a
      // metre: the gap closes by no more than 1 + rate a metre), never more than 2 m, and never less than a twentieth of a metre; for that
      // floor the clear air is taken (1 + rate) / 20 wider: half of it for the half floor step either side of a walked metre, half for the
      // two tables, in which a stretch of up to 2 m is at the most 6 mm longer than its metres say (measured: this world's notes).
      // A bird whose whole passage is clear is not touched. A bird that fails has ONE dealt number written, its height (iA's second number),
      // raised by the least count of hundredths of a metre that clears its whole passage. Why the height: the route crosses over our line,
      // on the deals counted the box of a bird that fails is over the lens, and of the dealt numbers the height is the one that clears by
      // the least change there (this world's notes). The attribute is marked for upload only when a height is written and the flock is
      // kept; if a bird cannot be raised, every height written before it is put back, so a flock with no bird raised, or left out, is as
      // the kit made it. The kit's culling sphere is not laid again: the kit lays its radius once, from the largest dealt offset, half
      // the largest lag and margins of its own (its centre rides that half lag behind the lead point), and a bird is raised only while
      // it stays inside: spare (the radius less half the largest lag, the bird's offset as written, the wander's bound and its reach) is
      // never under nought. Each raised bird is named in the object's userData.written as [bird, dealt height, height written, spare].
      // The guard: a flock of which a name read here is absent, of the wrong kind (the attributes' own readers are asked) or out of
      // its range (the count, the route's length, the speed and the radius over nought), or an array not four numbers a bird long, or
      // of which a number read here is not a finite number (the uniforms' figures, the route's length, the sphere's radius, every
      // number of iA and iB, our own path's length; the reach, and so every number of the model read for it), or whose model has more
      // than MOSTW vertices, or whose timetable is not the one above (the kit's own positionAt is asked at two u, at clock 0), or of
      // which a bird cannot be raised clear inside the sphere, or for which a search reaches its most of steps, is left out of the
      // world: taken out of its parent (the kit's update sets `visible` anew every frame), with one warning that gives the reason
      // (the reasons of one kind share a text). If the kit's call returned no flock there is nothing here to take out: the warning
      // is given all the same.
      await ctx.yield();
      const fl = skimmers, at = fl && fl.geometry && fl.geometry.attributes, U = fl && fl.uniforms, n = fl && fl.count, fin = Number.isFinite;
      // Every search here has a most of steps: a walk MOSTW (more than this path's length over the walk's floor step: some 17,800), a
      // raise MOSTR hundredths (5 m), the model MOSTW vertices. A search that reaches its most leaves the flock out, with the warning
      const MOSTW = 20000, MOSTR = 500;
      const attr = (a) => typeof a.getX === 'function' && typeof a.getY === 'function' && typeof a.getZ === 'function' && typeof a.getW === 'function' && fin(a.count) && a.count <= MOSTW;
      const unsound = 'a number this world reads of the kit\'s flock or of our path is not a finite number, an attribute is of the wrong kind, or the bird\'s model has more vertices than the search\'s most of steps';
      const Lp = path.length, cu = 0.6, p = V3(), q = V3();
      let why = 'a name this world reads of the kit\'s flock is absent, of the wrong kind or out of its range, or an array is not of the count\'s length';
      let ok = !!(at && U && n > 0 && fl.object && fl.object.userData && fl.route && typeof fl.route.pointAt === 'function' && fl.route.length > 0 && fl.bounds && fl.bounds.radius > 0 && typeof fl.positionAt === 'function'
        && at.iA && at.iB && at.aAnim && at.position && at.iA.array && at.iB.array && typeof at.iA.array.every === 'function' && typeof at.iB.array.every === 'function'
        && at.iA.array.length === n * 4 && at.iB.array.length === n * 4
        && U.uWander && U.uFlap && U.uWing && U.uNear && U.uScale && U.uSpeed && U.uSpeed.value > 0 && U.uEps && U.uEps.value >= 0);
      if (ok && !(fin(Lp) && Lp > 0 && attr(at.aAnim) && attr(at.position) && fin(fl.route.length) && fin(fl.bounds.radius) && fin(U.uSpeed.value) && fin(U.uEps.value) && fin(U.uScale.value) && fin(U.uNear.value?.y) && fin(U.uFlap.value?.y)
        && fin(U.uWander.value?.x) && fin(U.uWander.value?.y) && fin(U.uWander.value?.z) && fin(U.uWing.value?.w) && fin(U.uWing.value?.x) && at.iA.array.every(fin) && at.iB.array.every(fin))) {
        ok = false; why = unsound;
      }
      const Lr = ok ? fl.route.length : 0, K = ok ? U.uSpeed.value * DUR : 0, rate = K / Lp, lead = (d) => Lr / 2 + (d / Lp - cu) * K;
      if (ok) for (const u of [cu - 0.04, cu + 0.04]) {
        fl.route.pointAt(lead(u * Lp), p);
        const r = fl.positionAt(0, u, q);
        if (!(r && typeof r.distanceTo === 'function' && r.distanceTo(p) < 1e-3)) { ok = false; why = 'the kit\'s timetable for its crossing is not the one this world holds it to'; }
      }
      if (ok) {
        const iA = at.iA.array, iB = at.iB.array, wan = U.uWander.value, amp = U.uFlap.value.y, written = [];
        const ahead = 2 * U.uEps.value * U.uSpeed.value, f = 0.05, slack = (1 + rate) * f, ex = 1.5 * wan.x, ey = wan.y, ez = wan.z, round = Math.hypot(ex, ey, ez);
        let reach = 0, back = 0;
        for (let i = 0; i < at.position.count; i++) {
          const side = at.aAnim.getY(i), d = Math.abs(side) > 0.5 ? at.aAnim.getX(i) : 0;
          reach = Math.max(reach, Math.hypot(at.position.getX(i) - side * d, at.position.getY(i), at.position.getZ(i)) + d * (1 + Math.hypot(0.22, 0.25) * amp) + U.uWing.value.w * amp + 0.06 * U.uWing.value.x * at.aAnim.getW(i));
        }
        for (let i = 0; i < n; i++) back = Math.max(back, iA[i * 4 + 2]);
        if (!fin(reach)) { ok = false; why = unsound; }
        let stuck = false;
        // bird i's whole passage, as its numbers stand in the arrays: true if its box keeps the clear air c from the lens's place throughout
        const passes = (i, c) => {
          const ox = iA[i * 4], oy = iA[i * 4 + 1], oz = iB[i * 4 + 3], lag = iA[i * 4 + 2], d1 = Math.min(Lp, (lag + Lr / 2) / rate + cu * Lp);
          for (let d = Math.max(0, (lag - ahead - Lr / 2) / rate + cu * Lp), k = 0; ; k++) {
            if (k >= MOSTW) { stuck = true; return false; }
            path.posAtDist(d, p); fl.route.pointAt(lead(d) - lag, q);
            const gx = Math.max(Math.abs(p.x - q.x - ox) - ex, 0), gy = Math.max(Math.abs(p.y - q.y - oy) - ey, 0), gz = Math.max(Math.abs(p.z - q.z - oz) - ez, 0), D = Math.sqrt(gx * gx + gy * gy + gz * gz) - c;
            if (!(D >= 0)) return false;                    // (not a number counts as not clear: the walk then ends here)
            if (d >= d1) return true;
            d = Math.min(d1, d + Math.max(f, Math.min(2, D / (1 + rate) + f / 2)));
          }
        };
        for (let i = 0; i < n && ok; i++) {
          const skin = reach * iB[i * 4] * U.uScale.value, c = Math.max(U.uNear.value.y, 2.0 + skin) + slack;
          if (passes(i, c)) continue;
          const y0 = iA[i * 4 + 1], spare = () => fl.bounds.radius - back / 2 - Math.hypot(iA[i * 4], iA[i * 4 + 1], iB[i * 4 + 3]) - round - skin;
          for (let k = 1; ; k++) {
            if ((k & 31) === 0) await ctx.yield();
            iA[i * 4 + 1] = y0 + k * 0.01;
            if (stuck || k > MOSTR || !(spare() >= 0)) {
              iA[i * 4 + 1] = y0; for (const w of written) iA[w[0] * 4 + 1] = w[1];
              ok = false; why = stuck || k > MOSTR ? 'a search did not end within its most of steps' : 'a skimmer cannot be raised clear of the lens inside the kit\'s culling sphere'; break;
            }
            if (passes(i, c)) { written.push([i, y0, iA[i * 4 + 1], spare()]); break; }
          }
        }
        if (ok && written.length) { at.iA.needsUpdate = true; fl.object.userData.written = written; }
      }
      if (!ok) { console.warn('macaw-wall: the skimmers are left out (' + why + ')'); if (fl && fl.object && fl.object.parent && typeof fl.object.parent.remove === 'function') fl.object.parent.remove(fl.object); }
    }
    await ctx.yield();
    // great egrets fishing the shallows: two on the bar's waterline, six up the creek, each 6-14 m from the lens as it passes
    const egretSpots = [];
    for (const [uu, sd] of [[0.53, -1], [0.548, -1], [0.572, 1], [0.59, -1], [0.607, 1], [0.624, -1], [0.641, 1], [0.657, -1]]) {
      const q = path.pointAt(uu), tg = path.tangentAt(uu).setY(0).normalize();
      for (let lat = 6; lat <= 17; lat += 0.5) { const x = q.x - tg.z * lat * sd, z = q.z + tg.x * lat * sd, h = height(x, z); if (h > WL - 0.42 && h < WL - 0.06) { egretSpots.push({ x, z }); break; } }
    }
    if (egretSpots.length) fauna.add(F.makeWaders({ rng: fr2.fork('egret'), species: 'egret', count: egretSpots.length, positions: egretSpots, level: WL, heightAt: height, size: 1.75, active: 0.75 }), { always: true });
    await ctx.yield();
    // and seven more on the wing, going up the gallery ahead of us
    fauna.add(F.makeFlock({ rng: fr2.fork('egf'), species: 'gulls', count: 7, size: 1.7, body: '#f4f3ee', belly: '#ffffff', wingC: '#efefe9', trail: '#e4e4de', tip: '#dadad4', beak: '#f0b428', head: '#f6f6f2', spread: [5, 1.6, 9], flap: 2.6,
      along: { path, side: -2.5, up: -0.3, lead: 17, from: 0.572, to: 0.668, drift: 0.5 } }), { always: true });
    await ctx.yield();
    // ---------- capybara on the bar: nine custom animals strung along the right of the path, the nearest 8 m away at u 0.55 ----------
    const critU = { ...fogU(), uPass: { value: 0 }, uTime: time, uSunDir: { value: sunV }, uSunCol: { value: sunCol.clone().multiplyScalar(LK.sunI * 0.8) }, uSky: { value: C(LK.hemiSky, 0.5) }, uGnd: { value: C('#6a5a48', 0.3) } };
    {
      // a capybara, not a loaf: a heavy round rump with no tail and a barrel body (russet back, paler belly), a deep blunt square head
      // on a thick neck, small round ears set far back, a dark eye high on the cheek, short tapered legs on splayed toes
      const g = new CritGeo(), ct = [0.235, 0.122, 0.05], cb = [0.23, 0.165, 0.098], cm = [0.135, 0.082, 0.045], cn = [0.05, 0.035, 0.026], cl = [0.105, 0.066, 0.04], ch = [0.2, 0.11, 0.05];
      g.loft([[-0.63, 0.47, 0.07, 0.08, ct, cb, 0], [-0.58, 0.47, 0.18, 0.21, ct, cb, 0], [-0.47, 0.485, 0.255, 0.285, ct, cb, 0], [-0.29, 0.495, 0.29, 0.305, ct, cb, 0], [-0.04, 0.475, 0.29, 0.29, ct, cb, 0], [0.2, 0.46, 0.268, 0.268, ct, cb, 0],
        [0.38, 0.47, 0.226, 0.238, ct, cb, 0], [0.5, 0.5, 0.185, 0.205, ct, cb, 0], [0.6, 0.535, 0.15, 0.17, ch, cb, 1]], 10, 2.5);
      g.loft([[0.52, 0.545, 0.13, 0.15, ch, cb, 1], [0.62, 0.56, 0.148, 0.168, ch, cb, 1], [0.74, 0.565, 0.142, 0.162, ch, cm, 1], [0.86, 0.55, 0.13, 0.15, cm, cm, 1], [0.96, 0.535, 0.12, 0.138, cm, cm, 1], [1.01, 0.525, 0.106, 0.122, cn, cm, 1], [1.03, 0.52, 0.07, 0.085, cn, cn, 1]], 8, 3.6);
      for (const [lx, lz] of [[0.16, 0.3], [-0.16, 0.3], [0.175, -0.36], [-0.175, -0.36]]) {
        const rings = [[0.4, lz < 0 ? 0.105 : 0.085, lz < 0 ? 0.13 : 0.09, ct], [0.2, 0.058, 0.066, cl], [0.055, 0.038, 0.042, cl], [0.0, 0.044, 0.05, cn]];
        for (let j = 0; j < 3; j++) { const A = rings[j], B = rings[j + 1], col = j ? cl : [(ct[0] + cl[0]) / 2, (ct[1] + cl[1]) / 2, (ct[2] + cl[2]) / 2];
          const cA = [[lx - A[1], lz - A[2]], [lx + A[1], lz - A[2]], [lx + A[1], lz + A[2]], [lx - A[1], lz + A[2]]], cB = [[lx - B[1], lz - B[2]], [lx + B[1], lz - B[2]], [lx + B[1], lz + B[2]], [lx - B[1], lz + B[2]]];
          for (let k = 0; k < 4; k++) { const k1 = (k + 1) % 4; g.quad([cB[k1][0], B[0], cB[k1][1]], [cB[k][0], B[0], cB[k][1]], [cA[k][0], A[0], cA[k][1]], [cA[k1][0], A[0], cA[k1][1]], col, 3); } }
        for (const ta of [-0.62, 0, 0.62]) { const sx = Math.sin(ta), cz = Math.cos(ta), tip = [lx + sx * 0.14, 0.006, lz + 0.02 + cz * 0.14], top = [lx + sx * 0.03, 0.07, lz + 0.03];       // three splayed toes
          g.tri(top, [lx + cz * 0.032, 0.006, lz + 0.02 - sx * 0.032], tip, cn, 3); g.tri(top, tip, [lx - cz * 0.032, 0.006, lz + 0.02 + sx * 0.032], cn, 3); }
      }
      for (const sx of [1, -1]) {
        const ec = [sx * 0.112, 0.735, 0.6];                                       // the ear: a small round flap, far back, turned a little out
        for (let k = 0; k < 6; k++) { const a0 = (k / 6) * 6.2832, a1 = ((k + 1) / 6) * 6.2832, pt = (a) => [ec[0] + sx * (0.02 + 0.014 * Math.sin(a)) + sx * 0.02 * Math.cos(a), ec[1] + 0.05 * Math.sin(a), ec[2] + 0.045 * Math.cos(a)];
          g.tri([ec[0], ec[1] - 0.01, ec[2]], pt(a0), pt(a1), k < 3 ? cm : cn, 2); }
        const ex = sx * 0.1455, ey = 0.648, ez = 0.76;                               // the eye: dark, high and far back, with a paler lid over it
        g.quad([ex, ey - 0.02, ez - 0.024], [ex, ey - 0.02, ez + 0.024], [ex - sx * 0.006, ey + 0.02, ez + 0.02], [ex - sx * 0.006, ey + 0.02, ez - 0.02], [0.008, 0.007, 0.007], 1);
        g.quad([ex + sx * 0.002, ey + 0.018, ez - 0.03], [ex + sx * 0.002, ey + 0.018, ez + 0.03], [ex - sx * 0.012, ey + 0.036, ez + 0.026], [ex - sx * 0.012, ey + 0.036, ez - 0.026], [0.26, 0.15, 0.07], 1);
        g.quad([sx * 0.03, 0.602, 1.022], [sx * 0.062, 0.602, 1.022], [sx * 0.06, 0.628, 1.012], [sx * 0.032, 0.628, 1.012], [0.012, 0.01, 0.01], 1);           // a nostril, high on the blunt end
      }
      const geo = g.build(true), spots = [[0.55, 6.7, 3.7, 0], [0.55, 7.7, 6.0, 2], [0.55, 8.5, 3.0, 1], [0.52, 14, 4.8, 0], [0.52, 15.2, 7.2, 0], [0, 11, 8, 1], [0, 13.6, 10.3, 0], [0, 16.2, 7.5, 0], [0, 19.6, 9.3, 1], [0, 22.2, 11, 0], [0, 25, 8.3, 0]], iPos = [], iPose = [];
      const hr = R.fork('capy'), yaw0 = Math.atan2(hin.x, hin.z);
      spots.forEach(([uS, al, rt, lie], k) => {
        const q = V3();
        if (uS) { const uu = uS + al / path.length, tg = path.tangentAt(uu).setY(0).normalize(); path.pointAt(uu, q); q.x -= tg.z * rt; q.z += tg.x * rt; }
        else q.copy(capyBase).addScaledVector(hin, al + hr.range(-0.6, 0.6)).addScaledVector(rgt, rt + hr.range(-0.5, 0.5));
        const g0 = sAt(q.x, q.z), gy = g0 < WL + 0.12 ? g0 : sandTop(q.x, q.z) - 0.03;
        const sc = (k === 7 || k === 10 ? 0.9 : k < 5 ? hr.range(1.56, 1.66) : hr.range(1.25, 1.42)), sw = gy < WL + 0.12;
        iPos.push(q.x, sw ? WL - 0.4 * sc : gy - 0.015, q.z, k < 5 ? 0.74 + hr.range(-0.55, 0.55) + (k % 2 ? Math.PI : 0) : yaw0 + hr.range(-0.7, 0.7) + (hr() < 0.35 ? Math.PI : 0)); iPose.push(sc, sw ? 0 : lie, hr() * 6.28, hr.range(-0.5, 0.9));
        if (!sw) sandBlobs.push([q.x, q.z, 0.75 * sc, lie === 1 ? 0.62 : 0.5]);
      });
      geo.setAttribute('iPos', new THREE.InstancedBufferAttribute(new Float32Array(iPos), 4)); geo.setAttribute('iPose', new THREE.InstancedBufferAttribute(new Float32Array(iPose), 4)); geo.instanceCount = spots.length;
      const m = new THREE.Mesh(geo, new THREE.ShaderMaterial({ uniforms: critU, vertexShader: CAPY_VERT, fragmentShader: CRIT_FRAG, fog: true, side: THREE.DoubleSide })); m.frustumCulled = false; scene.add(m);
    }
    await ctx.yield();
    // the bar's sand, laid over the terrain
    {
      const eps = 1.5;
      const g = await grid(-206, 100, 118, 178, 3, sandTop, (x, z) => { const h0 = height(x, z), m = Math.max(barAt(x, z), smoothstep(46, 34, polySD(BAR, x, z)) * smoothstep(WL + 3.0, WL + 1.8, h0)) * smoothstep(WL - 0.2, WL + 0.1, h0); return [m, -(height(x + eps, z) - height(x - eps, z)) / (2 * eps), 0, -(height(x, z + eps) - height(x, z - eps)) / (2 * eps), m - 0.04]; });
      while (sandBlobs.length < 24) sandBlobs.push([0, 0, 1, 0]);
      const sm = new THREE.Mesh(g, new THREE.ShaderMaterial({ fog: true, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4,
        uniforms: { ...fogU(), uSunDir: { value: sunV }, uSunCol: { value: sunCol.clone().multiplyScalar(LK.sunI * 0.62) }, uSky: { value: C(LK.hemiSky, 0.62) }, uGnd: { value: C('#7a6a52', 0.4) }, uSand: { value: C('#c0a67c', 0.62) }, uWet: { value: C('#6e5a40', 0.6) },
          uSh: { value: new THREE.Vector3(sunV.x / Math.hypot(sunV.x, sunV.z), sunV.z / Math.hypot(sunV.x, sunV.z), clamp(0.9 * Math.hypot(sunV.x, sunV.z) / Math.max(sunV.y, 0.1), 0, 3.2)) },
          uWL: { value: WL }, uBlob: { value: sandBlobs.slice(0, 24).map((b) => new THREE.Vector4(b[0], b[1], b[2], b[3])) } },
        vertexShader: WORLD_VERT('attribute vec4 aData; varying float vMask; varying vec3 vBend;', 'vMask = aData.x; vBend = aData.yzw;'), fragmentShader: SAND_FRAG }));
      sm.renderOrder = 0.4; sm.frustumCulled = false; scene.add(sm);
      waterU.uBed.value.copy(sm.material.uniforms.uSand.value);                               // (the bed the river shows through its thin water is the bar's own sand)
    }
    await ctx.yield();
    // two white-throated toucans: they swing in from the outside of the spiral at the bromeliad limbs, undulate along 7 m ahead
    // of the lens for a quarter turn and lift away
    const toucanGeo = (() => {
      const g = new CritGeo(), bk = [0.022, 0.022, 0.028], wh = [0.82, 0.8, 0.66], yl = [0.95, 0.66, 0.06], og = [0.9, 0.36, 0.04], tipc = [0.16, 0.07, 0.03];
      g.loft([[-0.2, 0, 0.02, 0.02, bk, bk, 0], [-0.14, 0, 0.06, 0.055, bk, bk, 0], [0, 0, 0.088, 0.082, bk, bk, 0], [0.12, 0.012, 0.082, 0.08, bk, wh, 0], [0.2, 0.032, 0.062, 0.064, bk, wh, 0], [0.265, 0.05, 0.056, 0.06, bk, wh, 0],
        [0.3, 0.048, 0.032, 0.054, yl, og, 0], [0.42, 0.04, 0.03, 0.05, yl, og, 0], [0.53, 0.018, 0.023, 0.037, yl, tipc, 0], [0.59, -0.008, 0.008, 0.013, tipc, tipc, 0]], 7, 2.2);
      g.quad([-0.035, 0.012, -0.17], [0.035, 0.012, -0.17], [0.055, 0.0, -0.39], [-0.055, 0.0, -0.39], bk, 0); g.quad([-0.04, 0.03, -0.1], [0.04, 0.03, -0.1], [0.04, 0.02, -0.19], [-0.04, 0.02, -0.19], [0.75, 0.1, 0.05], 0);
      for (const sx of [1, -1]) { g.quad([sx * 0.07, 0.03, 0.12], [sx * 0.3, 0.03, 0.1], [sx * 0.31, 0.03, -0.1], [sx * 0.07, 0.03, -0.09], bk, 1, sx); g.quad([sx * 0.3, 0.03, 0.1], [sx * 0.45, 0.03, 0.04], [sx * 0.43, 0.03, -0.09], [sx * 0.31, 0.03, -0.1], [0.04, 0.04, 0.05], 1, sx); }
      return g.build(true);
    })();
    const toucanPos = new THREE.InstancedBufferAttribute(new Float32Array([0, -999, 0, 0, 0, -999, 0, 2.4]), 4), toucanFwd = new THREE.InstancedBufferAttribute(new Float32Array([1, 0, 0, 1, 0, 0]), 3);
    toucanPos.setUsage(THREE.DynamicDrawUsage); toucanFwd.setUsage(THREE.DynamicDrawUsage);
    toucanGeo.setAttribute('iPos', toucanPos); toucanGeo.setAttribute('iFwd', toucanFwd); toucanGeo.instanceCount = 2;
    const toucans = new THREE.Mesh(toucanGeo, new THREE.ShaderMaterial({ uniforms: critU, vertexShader: TOUCAN_VERT, fragmentShader: CRIT_FRAG, fog: true, side: THREE.DoubleSide })); toucans.frustumCulled = false; scene.add(toucans);
    // the pair crosses the lens from right to left, 6-8 m out and just under the line of sight, over u 0.733-0.806 (keyed to
    // u and placed in the camera's frame, so they are mid-frame at u 0.765 wherever the gaze has swung)
    const tA = V3(), tR = V3(), tF = V3();
    const toucanAt = (camera, u, k, out) => {
      const s = (u - 0.733 - 0.006 * k) / 0.066, x = lerp(10.5, -10.5, s) + 1.2 * k, d = 6.3 + 1.7 * k;
      tA.setFromMatrixPosition(camera.matrixWorld); tR.setFromMatrixColumn(camera.matrixWorld, 0); tF.setFromMatrixColumn(camera.matrixWorld, 2);
      return out.copy(tA).addScaledVector(tF, -d).addScaledVector(tR, x).add(tq.set(0, -1.5 + 0.9 * k + 0.7 * Math.sin(s * 3.1), 0));
    };
    const tq = V3(), tB = V3();
    await ctx.yield();
    // (kept off the line by place: no morpho nearer than 3 m to it, its wander counted in. The wander is half as broad as the kit's, a box of
    // 1.24 m either way, 1.75 m to its corner; where the route climbs, a metre aside is 0.9 m from the line: (3 + 0.36 half-span + 1.75) / 0.895
    // is 5.71; the key is the first step of 0.05 at which this world's count finds no morpho nearer: 5.75)
    fauna.add(F.makeButterflies({ rng: fr2.fork('morpho'), path, uFrom: 0.6, uTo: 0.75, count: 40, size: 2.1, varieties: [['#1466e0', '#52b8ff'], ['#1f7cf0', '#9ad8ff']], spread: 10, clear: 5.75, roam: [1.3, 1.0, 0.55, 0.03], lift: [-3.5, 3] }));
    await ctx.yield();
    fauna.add(F.makeButterflies({ rng: fr2.fork('sulphur'), positions: sulphur, count: sulphur.length, size: 1.7, varieties: [['#f6d83a', '#fff3a0']], roam: [0.7, 0.5, 0.8, 0.05] }));
    if (LK.hour === 'day') fauna.add(F.makeFlock({ rng: fr2.fork('vult'), species: 'eagles', count: 6, size: 1.5, center: [10, 92, -50], radius: 60, body: '#15130f', belly: '#1c1914', wingC: '#17140f', trail: '#3a342c', tip: '#0d0c0a', head: '#5a2a24' }), { always: true });
    await ctx.yield();

    // ---------- air: mist, shafts, motes, floss, falling leaves ----------
    const set = fx.fxGroup(); scene.add(set.object);
    const mistCol = C(LK.deckCol, 0.8), sx = sunV.x / Math.hypot(sunV.x, sunV.z), sz = sunV.z / Math.hypot(sunV.x, sunV.z);
    const riverMist = [];
    riverMist.push(set.add(fx.makeMist({ rng: R.fork('m1'), time, count: Math.round(38 * LK.mist * detail) + 4, area: [340, 3.5, 104], center: [-30, WL + 2.2, 66], size: [14, 30], color: mistCol, opacity: 0.17, drift: [0.9, 0, 0.25], sunDir: sunV })));
    riverMist.push(set.add(fx.makeMist({ rng: R.fork('m2'), time, count: Math.round(16 * LK.mist * detail) + 3, area: [110, 3.5, 190], center: [150, WL + 2.2, 120], size: [14, 28], color: mistCol, opacity: 0.17, drift: [0.4, 0, 0.9], sunDir: sunV })));
    // (what the river's surface takes from the mist and the wind, read off them as they are built. THE MIST on the reach under the
    // wall (the first system above): its top is the top of the band its puffs are laid in; a metre of level path in it meets
    // the summed widths of its puffs over the ground they are spread on, and each puff met takes its own opacity (as built, not
    // as the flight changes it afterwards) times 0.5, the mean of its soft-edged body across its width. THE AIR: the wall's wind
    // shadow is skewed by the wind in the crowns (windV: the metres it runs along the wall per metre out from it, and the seven
    // cliff heights it takes to come down again behind a cliff, square to the wall); the air's speed on the water is the drift
    // of this same mist, which lies on it; a cat's-paw is a gust at the top of a light breeze, 3.3 m/s)
    { const rm = riverMist[0], ru = rm.uniforms, ar = ru.uArea.value, si = rm.aInfo.array; let sw = 0; for (let i = 0; i < rm.count; i++) sw += si[i * 4];
      waterU.uMistL.value.set(ru.uCenter.value.y + 0.5 * ar.y, sw / (ar.x * ar.z) * ru.uOpacity.value * 0.5);
      waterU.uAir.value.set(-windV.x / windV.y, 7 * windV.y / windV.length(), Math.hypot(ru.uDrift.value.x, ru.uDrift.value.z), 3.3); }
    // seen from the canopy the reach below the cliff lies under a soft bank: these puffs are only there for the high camera
    const highPuffs = []; for (let k = 0; k < 28; k++) highPuffs.push(V3(pr.range(-175, 125), WL + pr.range(3, 7), pr.range(40, 112)));
    const highMist = set.add(fx.makeMist({ rng: R.fork('m7'), time, positions: highPuffs, size: [34, 60], color: mistCol, opacity: 0.001, sunDir: sunV }));
    const mr = ctx.core.makeRng('macaw-mist:' + ctx.seed), farPuffs = [], flushPuffs = [];
    for (let k = 0; k < 42; k++) { const x = mr.range(-430, -150), rd = mr.range(-10, 60); let z = -30; for (let zz = 40; zz > -90; zz -= 6) if (riverSD(x, zz) > rd) { z = zz; break; } farPuffs.push(V3(x, WL + mr.range(4, 15), k % 3 === 0 ? mr.range(30, 110) : z)); }
    const highMist2 = set.add(fx.makeMist({ rng: mr.fork('a'), time, positions: farPuffs, size: [40, 70], color: mistCol, opacity: 0.001, sunDir: sunV }));
    // tongues of mist lie along the far bank's waterline west of the cliff: from the canopy that bank is never a dark ruled line under the deck
    const br = ctx.core.makeRng('macaw-bankmist:' + ctx.seed), bankPuffs = [];
    for (let x = -450; x < -150; x += br.range(6, 11)) { if ((bankPuffs.length & 15) === 0) await ctx.yield(); let z = -30; for (let zz = 40; zz > -90; zz -= 2) if (riverSD(x, zz) > 1) { z = zz; break; } bankPuffs.push(V3(x, WL + br.range(3, 9), z + br.range(-3, 5)), V3(x + br.range(-4, 4), WL + br.range(0.5, 3.5), z + br.range(5, 14)), V3(x + br.range(-3, 3), WL + br.range(0.5, 2.5), z + br.range(-2, 4))); }
    const bankMist = set.add(fx.makeMist({ rng: br.fork('a'), time, positions: bankPuffs, size: [18, 34], color: mistCol, opacity: 0.001, sunDir: sunV }));
    for (let k = 0; k < 9; k++) { const uu = 0.335 + 0.02 * k, q = path.pointAt(uu), tg = path.tangentAt(uu).setY(0).normalize(), lat = mr.range(26, 70); flushPuffs.push(V3(q.x + tg.z * lat + tg.x * 30, WL + mr.range(1.6, 3.4), q.z - tg.x * lat + tg.z * 30)); }
    riverMist.push(set.add(fx.makeMist({ rng: mr.fork('b'), time, positions: flushPuffs, size: [22, 40], color: mistCol, opacity: 0.17, drift: [0.5, 0, 0.3], sunDir: sunV })));
    await ctx.yield();
    const wellPuffs = [], forkPuffs = [];
    for (let k = 0, tries = 0; k < 13 && tries < 200; tries++) { const p = CK.clone().addScaledVector(dirAz(pr() * 360), pr.range(4, 30)).setY(pr.range(5, 24)); if (clearOf(p, 0, 5)) { wellPuffs.push(p); k++; } }
    // mist in the fork: it lies along the ring's lower edge and spills either side of the crotch, whose dark wood stays clear of it
    for (let k = 0; k < 26; k++) { const y = pr.range(49, 55.5), l0 = pr.range(-17, 17), h0 = pr.range(-14, 5), l = Math.abs(l0) < 5 ? Math.sign(l0 || 1) * (5 + Math.abs(l0)) : l0;
      forkPuffs.push(V3(k2.x, lerp(51.6, 55.2, (y - 49) / 6.5), k2.z).addScaledVector(lf2, l).addScaledVector(hf2, lerp(-6, 4, (h0 + 14) / 19))); }
    const topPuffs = []; for (let k = 0, tries = 0; k < Math.round(46 * Math.min(1.2, LK.deck)) + 6 && tries < 900; tries++) { const q = V3(Pm.x + pr.range(-150, 150), DECK_Y + pr.range(-2.5, 1.2), Pm.z + pr.range(-150, 150)); if (forestAt(q.x, q.z) > 0.8 && upDist(q.x, q.z) > 9 && Math.hypot(q.x - CK.x, q.z - CK.z) > 30) { topPuffs.push(q); k++; } }
    await ctx.yield();
    set.add(fx.makeMist({ rng: R.fork('m3'), time, positions: wellPuffs, size: [13, 22], color: C(LK.deckCol, 0.7).lerp(sunCol, 0.25), opacity: 0.13 + 0.05 * LK.mist }));
    await ctx.yield();
    set.add(fx.makeMist({ rng: R.fork('m4'), time, positions: forkPuffs, size: [10, 19], color: mistCol, opacity: 0.14 + 0.1 * Math.min(LK.deck, 1), sunDir: sunV }));
    await ctx.yield();
    set.add(fx.makeMist({ rng: R.fork('m5'), time, positions: topPuffs, size: [20, 38], color: mistCol, opacity: 0.12 + 0.12 * Math.min(LK.deck, 1), sunDir: sunV }));
    await ctx.yield();
    // a bank of it under the final glide and round the second kapok's foot, so the lower third of the last frames is white
    const glidePuffs = []; for (let k = 0; k < 36; k++) { const t = pr.range(-0.2, 1.3), lat = pr.range(-64, 64); glidePuffs.push(V3(lerp(XP.x, K2.x, t) + lf2.x * lat, DECK_Y + pr.range(-2, 1.5), lerp(XP.z, K2.z, t) + lf2.z * lat)); }
    set.add(fx.makeMist({ rng: R.fork('m6'), time, positions: glidePuffs, size: [24, 42], color: mistCol, opacity: (0.2 + 0.1 * Math.min(LK.deck, 1)) * lerp(0.5, 1, dkN), sunDir: sunV }));
    await ctx.yield();
    // shafts of the low sun coming down through the umbrella of the second kapok into the mist and the crowns under it
    const k2Rays = set.add(fx.makeGodRays({ rng: xr.fork('rays4'), time, position: [K2.x + sx * 16, 77, K2.z + sz * 16], direction: [-sunV.x, -sunV.y * 1.25, -sunV.z], radius: 27, count: Math.round(11 * (0.6 + 0.4 * detail)), length: 78, width: [1.3, 4.6],
      color: LK.sunCol, intensity: rain ? 0.12 : LK.hour === 'day' ? 0.42 : 0.26, far: [170, 330] }));
    await ctx.yield();
    // and a puff in front of the foot of every crown the glide looks down on, toward the lens and a little under the crown's
    // middle: the rounded top stands out of it, the base is lost in a feathered edge
    const basePuffs = [];
    for (const c of crownList) {
      if (basePuffs.length >= 72 || c.rim || c.set === crownBank || c.y < DECK_Y - 4 || c.y > DECK_Y + 9) continue;
      let b = 1e9, ux = 0, uz = 0; for (let i = 0; i < upPts.length; i += 2) { const dx = upPts[i] - c.x, dz = upPts[i + 1] - c.z, d = dx * dx + dz * dz; if (d < b) { b = d; ux = dx; uz = dz; } }
      b = Math.sqrt(b); if (b > 85 || b < 10 || Math.hypot(c.x - K2.x, c.z - K2.z) < 30) continue;
      basePuffs.push(V3(c.x + ux / b * 0.55 * c.r, c.y - 0.12 * c.r, c.z + uz / b * 0.55 * c.r));
    }
    // a rag of it round the first kapok at the foot of its crown, for the moment the climb comes out level with the limbs
    const k1Puffs = []; for (let k = 0; k < 15; k++) { const a = xr() * TAU, rho = xr.range(4, 11.5) * (k % 3 === 2 ? 1.25 : 1); k1Puffs.push(V3(CK.x + Math.cos(a) * rho, xr.range(39.2, 42.4), CK.z + Math.sin(a) * rho)); }
    const k1Mist = set.add(fx.makeMist({ rng: xr.fork('m9'), time, positions: k1Puffs, size: [8, 12], color: mistCol, opacity: 0.001, sunDir: sunV }));
    const baseMist = basePuffs.length ? set.add(fx.makeMist({ rng: R.fork('m8'), time, positions: basePuffs, size: [14, 22], color: mistCol, opacity: 0.001, sunDir: sunV })) : null;
    // (round 21) THE MIST SEEN FROM ABOVE HAS A LIT SIDE AND A SHADED SIDE. The four sets above that are there for the high eye
    // only (the reach under the cliff, the west reach, the far bank's waterline, the crowns' feet: the flight's own lines give
    // them 0.001 until it is above the canopy, so nothing of this is seen from the river or in the forest) were flat cream discs:
    // each puff is now lit as a rounded body by the kit's own puff light (its PUFF_LIT), warm on the side it turns to the sun and
    // the deck's own cool shade on the other, in every look. And the three that lie on the river are THE MIST ALONG THE RIVER,
    // by the look's deck: whole in a look whose deck is a sea, and where the look's mist is burned to rags they are RAGS, banks
    // of mist some 25 to 40 m long with gaps as long between them. The rag's shape is the kit's own noise of the place, shared
    // by every puff of a set (its PUFF_SHARED, cells 29 m and 14 m across, rising slowly), which tears the puffs away where it
    // is low and leaves them whole where it is high, 6 strong where the site's own tear was 1.1 (by the look's deck), with
    // an edge as soft as the kit's softness 2.2 makes it (0.8 in a sea). Reckoned from the kit's law: half of a bank's
    // length is a rag (each puff 0.3 to 0.9 of its own strength, several deep), a fifth a thin veil (under 0.15 a puff) and
    // the rest is clear; the puffs under the cliff and on the west reach are one to three deep and weaker (0.14 and 0.27
    // against the far bank's 0.56 by the flight's own lines), so their rags are veils through which the river shows. The
    // bank under the cliff lies lower (flattened to 0.3 of its width, where it was 0.42), so that the cliff stands whole
    // above its foot. No position, size or count is changed, and no draw: the lists are the site's, member for member
    {
      const lit = (sys, soft, torn, flat, shared) => { if (!sys) return; const q = sys.uniforms; sys.material.defines = { ...sys.material.defines, PUFF_LIT: '', ...(shared ? { PUFF_SHARED: '' } : {}) }; sys.material.needsUpdate = true;
        q.uShadow.value.copy(C(LK.deckShade, 0.8)); q.uSunColor.value.copy(sunCol); q.uCluster.value = 0; q.uRim.value = 0.2; if (soft) q.uSoftness.value = soft; if (torn) q.uRagged.value = torn; if (flat) q.uFlatten.value = flat; if (shared) q.uWFreq.value = shared; };
      const softK = lerp(2.2, 0.8, seaN), tornK = lerp(6.0, 1.1, seaN);
      lit(highMist, softK, tornK, 0.3, 0.035); lit(highMist2, softK, tornK, 0, 0.035); lit(bankMist, softK, tornK, 0, 0.035); lit(baseMist, 0, 0, 0, 0);
    }
    await ctx.yield();
    // one hard gold shaft standing behind the howlers as the helix begins, and a rank of thin ones slanting across the creek
    const eyeH = path.pointAt(0.7), hv = howlAt.clone().sub(eyeH).normalize(), shaftAt = howlAt.clone().addScaledVector(hv, 9), shaftDir = V3(-sx * 0.42, -0.9, -sz * 0.42).normalize();
    const shaft = (() => {
      const pos = [], idx = [], n = 10;
      for (let j = 0; j <= n; j++) pos.push(-1, j / n, 0, 1, j / n, 0);
      for (let j = 0; j < n; j++) { const q = j * 2; idx.push(q, q + 1, q + 3, q, q + 3, q + 2); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
      const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: { uTime: time, uA: { value: shaftAt.clone().addScaledVector(shaftDir, -27) }, uDir: { value: shaftDir }, uW: { value: new THREE.Vector2(3.4, 5.4) }, uLen: { value: 56 },
        uCol: { value: C('#ffcf78').lerp(sunCol, 0.35) }, uGain: { value: rain ? 0.5 : 0.95 } }, vertexShader: SHAFT_VERT, fragmentShader: SHAFT_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false }));
      m.frustumCulled = false; m.renderOrder = 3; scene.add(m); return m;
    })();
    const ckMid = G1.clone().lerp(E, 0.45);
    set.add(fx.makeGodRays({ rng: R.fork('rays3'), time, position: [ckMid.x + sx * 20, 38, ckMid.z + sz * 20], direction: [-sx * 0.62, -0.78, -sz * 0.62], radius: 22, count: 11, length: 52, width: [0.9, 3.2],
      color: LK.sunCol, intensity: rain ? 0.14 : 0.26, far: [70, 150] }));
    await ctx.yield();
    set.add(fx.makeGodRays({ rng: R.fork('rays'), time, position: [CK.x + sx * 18, 47, CK.z + sz * 18], direction: [-sx * 0.75, -0.66, -sz * 0.75], radius: 15, count: 12, length: 62, width: [1.2, 4.6],
      color: LK.sunCol, intensity: rain ? 0.15 : 0.2, far: [70, 150] }));
    const motes = set.add(fx.makeParticles({ rng: R.fork('motes'), preset: 'dust', time, count: Math.round(1500 * detail), box: [40, 26, 40], colors: ['#ffe9b8', '#fff6dc', '#e8d8a0'] }));
    await ctx.yield();
    const floss = set.add(fx.makeParticles({ rng: R.fork('floss'), preset: 'pollen', time, count: Math.round(260 * detail), box: [50, 30, 50], colors: ['#fffaf0', '#f3eee2', '#ffffff'], size: [0.16, 0.38], intensity: 0.8 }));
    const leaves = set.add(fx.makeParticles({ rng: R.fork('leaves'), preset: 'leaves', time, count: Math.round(170 * detail), colors: ['#7a8a2c', '#c0a030', '#4c6a24'] }));
    await ctx.yield();

    // ---------- gaze ----------
    const g1 = V3(), g2 = V3(), g3 = V3(), g4 = V3(), g5 = V3(), g6 = V3(), g7 = V3(), g8 = V3();
    const g9 = V3(), g10 = V3();
    const pois = [
      // the wall from the first frame: its middle as we come down the reach (the path itself is aimed there), the east shoulder's
      // clay and its birds square on as we close on it and turn, and the wall 40 m ahead of us once we run west along it
      { at: (t, u) => { path.pointAt(u, g1); const a = smoothstep(0.09, 0.17, u), k = smoothstep(0.185, 0.235, u);
          return g1.set(lerp(lerp(30, 84, a), g1.x - 40, k), lerp(lerp(22, 20, a), 25, k), lerp(lerp(8, 10, a), 5, k)); }, from: 0.0, to: 0.335, weight: 0.55, fade: 0.12 },
      { at: snagAt, from: 0.07, to: 0.15, weight: 0.14, fade: 0.35 },
      // the flush: up and ahead, a little out over the river, where the sheet of birds crosses the sky above the bow
      { at: (t, u) => { path.pointAt(u, g4); path.tangentAt(u, g5).setY(0).normalize(); return g4.set(g4.x + g5.x * 34 + g5.z * 8, g4.y + 20, g4.z + g5.z * 34 - g5.x * 8); }, from: 0.292, to: 0.445, weight: 0.62, fade: 0.2 },
      // the forty pairs ahead of the bow, all the way from the river into the kapok
      { at: (t, u) => hero.skeinAt(teOf(u), g6), from: 0.40, to: 0.80, weight: 0.52, fade: 0.12 },
      { at: herdC.clone().setY(WL + 2.2), from: 0.49, to: 0.585, weight: 0.3 },
      { at: howlAt, from: 0.648, to: 0.74, weight: 0.58 },
      // out over the well and nearly level as the climb begins, so the great bole stays at the frame's edge and stands upright
      { at: (t, u) => { path.pointAt(u, g9); path.tangentAt(u, g10).setY(0).normalize(); return g9.set(g9.x + g10.x * 24 + g10.z * 18, g9.y + 1.5, g9.z + g10.z * 24 - g10.x * 18); }, from: 0.672, to: 0.75, weight: 0.2 },
      // level with the limbs the pairs settle on, so the bole stands upright in the frame
      { at: (t, u) => { path.pointAt(u, g2); path.tangentAt(u, g8); return g2.set(lerp(CK.x, g2.x + 30 * g8.x, 0.45), Math.min(g2.y + 1.5, 47), lerp(CK.z, g2.z + 30 * g8.z, 0.45)); }, from: 0.735, to: 0.83, weight: 0.5 },
      { at: (t, u) => g7.set(K2.x, PORTAL_Y + 3 - 9 * (1 - smoothstep(0.835, 0.9, u)), K2.z), from: 0.775, to: 0.94, weight: 0.7 },
    ];
    if (rare) pois.push({ at: (t, u) => harpyAt(teOf(u), g3), from: U_STOOP - 0.075, to: U_STOOP + 0.035, weight: 0.55 });

    // the opening pair: two scarlet macaws of the hero's own, 7 m ahead of the lens and a little right of the line, low over the
    // water; at the turn along the wall they pull away and up to the scarlet band
    const lpP = V3(), lpF = V3(), lpR = V3();
    // THE ARRIVALS: three pairs come in to the second kapok one after another as we glide to it, from the sunny right, across the
    // right of the frame 10 to 12 m off the lens at the nearest, and up into the leaf masses of the umbrella above and to the right of the ring
    // (never across it), where they are lost among the seated pairs. Each flies a fixed arc (A, M, B) keyed to u
    const arrivals = [0, 1, 2].map((j) => {
      const ua = 0.875 + 0.02 * j, ul = 0.95 + 0.021 * j, um = (ua + ul) / 2, pa = path.pointAt(ua), ta = path.tangentAt(ua).setY(0).normalize(), pm = path.pointAt(um + 10.5 / path.length), tm = path.tangentAt(um).setY(0).normalize();
      return { ua, ul, A: pa.clone().addScaledVector(ta, 20).add(V3(-ta.z * (27 + 5 * j), 6.5 - 2 * j, ta.x * (27 + 5 * j))), M: pm.clone().add(V3(-tm.z * (4.3 + 1.1 * j), 1.2 + 0.6 * j, tm.x * (4.3 + 1.1 * j))),
        B: V3(K2.x, 71.5 + 0.8 * j, K2.z).addScaledVector(lf2, -(12 + 3 * j)).addScaledVector(hf2, -4 - 2 * j) };
    });
    for (const a of arrivals) a.M.multiplyScalar(2).addScaledVector(a.A, -0.5).addScaledVector(a.B, -0.5);        // (the arc's middle passes through that point)
    const bez = (a, q, out) => { const w0 = (1 - q) * (1 - q), w1 = 2 * q * (1 - q), w2 = q * q; return out.set(a.A.x * w0 + a.M.x * w1 + a.B.x * w2, a.A.y * w0 + a.M.y * w1 + a.B.y * w2, a.A.z * w0 + a.M.z * w1 + a.B.z * w2); };
    const leadPair = (u, t) => {
      for (let j = 0; j < 3; j++) for (let k = 0; k < 2; k++) {
        const i = j === 2 ? k : 2 + j * 2 + k; if (i < 2 && u < 0.5) continue;                 // (the third pair is the opening pair again)
        const a = arrivals[j], q = clamp((u - a.ua) / (a.ul - a.ua) - 0.03 * k, 0, 1), on = smoothstep(0, 0.07, q) * (1 - smoothstep(0.9, 1, q));
        bez(a, q, lpP); bez(a, q + 0.02, lpF).sub(lpP).normalize();
        if (k) { lpP.x += 0.7; lpP.y += 0.3; lpP.z += 0.6; }
        lpP.y += 0.35 * Math.sin(t * 0.8 + i * 1.9);
        hero.setLead(i, lpP, lpF, t * 20.1 + i * 2.1, on, 0.2 * Math.sin(t * 0.41 + i * 3), j === 1 ? 2 : j === 2 ? 1 : 0);
      }
      if (u < 0.5) for (let k = 0; k < 2; k++) {
        const go = smoothstep(0.165, 0.235, u), lead = (k ? 9.4 : 7.2) + 0.7 * Math.sin(t * 0.33 + k * 2.4) + 80 * go * go, uu = u + lead / path.length;
        path.pointAt(uu, lpP); path.tangentAt(uu, lpF); lpR.set(-lpF.z, 0, lpF.x).normalize();
        lpP.addScaledVector(lpR, (k ? 4.9 : 2.9) + 0.4 * Math.sin(t * 0.5 + k * 2) + 5 * go); lpP.y += (k ? -1.0 : -2.0) + 0.3 * Math.sin(t * 0.7 + k * 1.7) + 15 * go;
        lpF.y += 0.25 * go + 0.04 * Math.sin(t * 0.7 + k * 1.7 + 1.5); lpF.normalize();
        hero.setLead(k, lpP, lpF, t * 20.1 + k * 2.1, 1 - smoothstep(0.222, 0.238, u), 0.16 * Math.sin(t * 0.41 + k * 3), 0);
      }
    };
    if (ctx.renderer && sky.prewarm) { try { await sky.prewarm(ctx.renderer, null, scene); } catch (e) { /* headless */ } }
    const fogBase = C(LK.fog), fogMist = C(LK.deckCol, 0.86), fogGreen = C('#7d8a58').lerp(C(LK.fog), 0.3).lerp(sunCol, 0.12), camP = V3();
    // inside the canopy mist the sky goes with it: a veil just inside the dome takes the mist colour while the camera is in the deck
    const veil = new THREE.Mesh(new THREE.SphereGeometry(1500, 20, 10), new THREE.MeshBasicMaterial({ color: fogMist, transparent: true, opacity: 0, depthWrite: false, side: THREE.BackSide, fog: false }));
    veil.renderOrder = -0.5; veil.frustumCulled = false; scene.add(veil);
    return {
      scene, path, duration: DUR,
      camera: { fov: 62, near: 0.3, far: 4000, lookAhead: 22, sway: 0.8, bank: 0.3 },
      pois,
      portal: { shape: 'circle', radius: 7, color: '#cfe6ff', glow: 1, revealDistance: 240, dewash: 0 },     // dewash 0: the engine's disc subtracts the host bloom unclamped and goes negative on dark next worlds
      post: { exposure: LK.exposure, bloom: { strength: 0.3, radius: 0.6, threshold: 0.92 },
        grade: { saturation: 1.08, contrast: 1.05, tint: LK.tint, shadowTint: LK.shadowTint, vignette: 0.3, grain: 0.02, aberration: 0 } },
      ride: 'great-bird',
      // lingering: over the water as the early flight crosses the bow, a little through the turn onto the wall (so it never yaws
      // fast), along the wall, under the sheet of birds as the wall empties, up the creek behind the skein and round the kapok
      // while the pairs settle; the links between (the bank-out over the river, the last of the climb) take up the slack
      pace: (u) => 1 - 0.1 * smoothstep(0.03, 0.06, u) * (1 - smoothstep(0.11, 0.14, u)) - 0.07 * smoothstep(0.145, 0.165, u) * (1 - smoothstep(0.2, 0.225, u)) - 0.12 * smoothstep(0.2, 0.235, u) * (1 - smoothstep(0.265, 0.29, u)) - 0.16 * smoothstep(0.3, 0.34, u) * (1 - smoothstep(0.4, 0.45, u))
        - 0.1 * smoothstep(0.55, 0.58, u) * (1 - smoothstep(0.64, 0.67, u)) - 0.12 * smoothstep(0.69, 0.73, u) * (1 - smoothstep(0.8, 0.86, u)),
      update(dt, t, camera, u) {
        time.value = t;
        // stage: the whole flock | in the forest, only the forty pairs (and the pairs seated in the far kapok) | above the canopy
        // again, with the wall hung with birds once more
        hero.setStage(u > 0.6 && u < 0.752 ? 1 : u >= 0.752 ? 2 : 0); leadPair(u, t);
        hero.setProgress(u); hero.update(dt, t, camera);
        waterU.uBirdK.value = 1 - smoothstep(-1.2, 1.5, teOf(u)); critU.uPass.value = smoothstep(0.525, 0.565, u);                 // the birds mirrored in the river leave it with the wall's
        sky.update(dt, t, camera); rig.update(dt, t, camera); terrain.update(dt, t);
        forest.update(dt, t, camera); cane.update(dt, t, camera); cane2.update(dt, t, camera); fernBed.update(dt, t, camera); pads.update?.(dt, t, camera);
        fauna.update(dt, t, camera, u); set.update(dt, t, camera);
        if (u > 0.725 && u < 0.815) { for (let k = 0; k < 2; k++) { toucanAt(camera, u, k, tB); toucanPos.setXYZ(k, tB.x, tB.y, tB.z); toucanFwd.setXYZ(k, -tR.x, 0.06, -tR.z); } toucanPos.needsUpdate = true; toucanFwd.needsUpdate = true; }
        else { toucanPos.setY(0, -999); toucanPos.setY(1, -999); }
        toucanPos.needsUpdate = true; toucanFwd.needsUpdate = true;
        // the canopy mist is flown through: the air thickens and whitens round the deck, and clears above it
        const cy = camP.setFromMatrixPosition(camera.matrixWorld).y, m = smoothstep(DECK_Y - 4.5, DECK_Y - 1, cy) * (1 - smoothstep(DECK_Y + 1.5, DECK_Y + 5.5, cy)) * Math.min(LK.deck, 1) * smoothstep(0.6, 0.7, u);
        veil.position.copy(camP); veil.material.opacity = 0.8 * m;
        for (const rm of riverMist) rm.uniforms.uOpacity.value = 0.17 * (1 - 0.6 * smoothstep(11, 15, cy));
        highMist.uniforms.uOpacity.value = 0.001 + 0.27 * lerp(0.5, 1, dkN) * smoothstep(46, 58, cy) * smoothstep(0.78, 0.84, u); shaft.visible = u > 0.6 && u < 0.79;
        highMist2.uniforms.uOpacity.value = 0.001 + 0.32 * lerp(0.85, 1, dkN) * smoothstep(46, 58, cy) * smoothstep(0.8, 0.86, u);
        bankMist.uniforms.uOpacity.value = 0.001 + 0.56 * smoothstep(46, 58, cy) * smoothstep(0.8, 0.86, u);
        if (baseMist) baseMist.uniforms.uOpacity.value = 0.001 + (0.26 + 0.1 * Math.min(LK.deck, 1)) * lerp(0.7, 1, dkN) * smoothstep(0.765, 0.82, u);
        k2Rays.object.visible = u > 0.76 || u < 0.0005;
        k1Mist.uniforms.uOpacity.value = 0.001 + (0.34 + 0.08 * Math.min(LK.deck, 1)) * smoothstep(0.803, 0.83, u) * (1 - smoothstep(0.87, 0.91, u));      // only once the lens is above it: seen from level with the limbs it lay across the bole like a smeared pane
        const full = u > 0.598; for (const pr2 of lodCrowns) { pr2[0].visible = full; pr2[1].visible = !full; }
        // what cannot be seen from here is not drawn (meshes only; no light is touched)
        pads.object.visible = u > 0.42 && u < 0.8; fernBed.object.visible = u > 0.45 && u < 0.8;
        cane.object.visible = cane2.object.visible = u < 0.8;
        for (const o of underCanopy) o.visible = u > 0.45 && u < 0.86;
        for (const o of decks) o.visible = cy > DECK_Y - 17;
        for (const o of rimCrowns) o.visible = u > 0.42 || u < 0.0005;
        const inForest = smoothstep(0.585, 0.63, u) * (1 - smoothstep(0.8, 0.84, u)), under = inForest * (1 - smoothstep(DECK_Y - 6, DECK_Y, cy));
        scene.fog.density = LK.fogD * (1 - 0.35 * smoothstep(DECK_Y + 2, DECK_Y + 10, cy)) + 0.0034 * under + 0.022 * m;
        scene.fog.color.copy(fogBase).lerp(fogGreen, 0.55 * under).lerp(fogMist, m);
        motes.setOpacity(0.9 * inForest); leaves.setOpacity(0.9 * inForest + 0.3 * smoothstep(0.84, 0.88, u)); floss.setOpacity(0.85 * smoothstep(0.74, 0.8, u));
      },
      dispose() { sky.dispose?.(); },
    };
  },
};
