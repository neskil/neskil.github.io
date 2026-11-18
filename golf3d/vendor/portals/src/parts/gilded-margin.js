// THE GREAT INITIAL: hero set piece of "gilded-margin".
//
// A Lombardic letter O in raised, burnished gold leaf, 80 m tall and 70 m wide, standing in a 90 m square
// illuminated panel. The panel is flat manuscript pigment: a vermilion diapered field outside the letter, a
// lapis counter full of slowly winding white filigree spirals inside it, and a 6 m border of three-strand
// lapis / vermilion / pale-lapis interlace whose ribbons slide over and under one another between gold
// fillets and four bossed corner plaques. A tree of life (flat two-tone green, sepia outlines, white dot
// rows, vermilion fruit, white blossom) grows up the counter in relief, forks under the centre and curls its
// boughs and scrolling twigs round a gold-rimmed rondel 14.8 m across: a real hole through the panel, the
// portal seat. Gold is the only material that answers light: dull ochre-brown, tooled with punch-dots, until
// the flare: a blade of light crosses the letter right to left, the punch-dots sparkle in its wake, and the
// whole letter stands blazing (HDR, blooms) with star glints and a warm pool thrown on the page before it.
//
// LOCAL SPACE  origin at the base centre of the panel, +Y up, the painted front faces +Z (the camera arrives
//              from +Z; in the world the piece is rotated so +Z points east, at the candle). The panel spans
//              x -45..45, y 0..90, z -1..1; the gold O z -2..2.45; the tree reaches z ~5.2. Centre (0,45,0).
// SIZE         radius 64 (panel corner from the centre), height 90.
// COST         about 46k triangles (gold 16k, tree 15k drawn twice for its outline), 6 draw calls (panel,
//              gold, tree, tree outline hull, glints, page glow), no lights, no textures. Build about 40 ms.
// LIGHTING     Everything is self-lit and ignores scene lights (the brief's flat pigments), respects scene fog.
//              Pigments are unlit flat colour (multiply all by hero.uniforms.uPaint to regrade). Gold reflects a
//              tiny analytic environment: a dark room (uRoom), the cream page below (uPage) and one candle
//              (uCandleDir = WORLD-space unit vector toward the flame, uCandleCol, uCandleI). When the flame
//              sits in the mirror direction of the face (+Z in local space) the gold flares physically; the
//              scripted flare below guarantees the moment. Wants a bright cream surround, bloom threshold
//              about 0.9-1.0: only the blazing gold (HDR 2-3, blade and sparkles 5-8) blooms.
//
// OPTS         palette   7 hex strings in brief order (vellum, shadow vellum, lapis, green, vermilion, sepia, gold)
//              candleDir [x,y,z] world-space direction TO the candle (default (0.5,0.34,0.8) normalised:
//                        a little off the mirror direction, so the gold starts dull)
//              glow      false removes the warm pool on the page (default true)
//              glints    number of star glints on the letter (default 150)
//              demo      true (default): until setProgress() is called the flare plays on a 14 s loop so the
//                        piece shows itself in the viewer. The first setProgress() call switches the loop off.
//
// PROGRESS     hero.setProgress(p), p = 0..1: the ignition. 0 dull ochre; 0.03..0.6 the blade crosses from the
//              viewer's right to left; from there to 1 the letter settles into its steady blaze. In the world:
//              p = clamp((t - 32 s) / 2.5 s) expressed in path u (1.5 s of blade, 1 s of settling).
//              hero.setGrowth(g), g = 0..1.05: how far the tree of life has grown (trunk first, twig tips and
//              leaves last). Without it the tree grows by itself, asymptotically, from 0.7.
//              hero.setCandle(dir, intensity): world-space direction to the flame and its flicker (about 1).
//              hero.flare (read-only number 0..1): how brightly the letter burns now, to drive a world light
//              or the page / vine warm-up.
//
// ANCHORS      (local space)
//   portalSeat   { position (0,45,0), normal (0,0,1), radius 7.4 } centre of the rondel hole; the 14 m portal
//                sits here facing +Z (the path ends here travelling toward -Z).
//   flyThrough   ordered points down the +Z axis of the rondel, z 220 -> -24: the only safe line; nothing of the
//                piece is within 7.4 m of it (the tree's boughs pass 9.5 m from the axis, 3-5 m proud).
//   viewpoints   { reveal, ignition, close }: camera positions for the turn-in, the flare and the last look.
//   candleMirror direction (0,0,1): where the flame must be for the true mirror flare.
//   shadowBase   two points on the page, the ends of the panel's foot, for the world's sheared fake shadow.
//   glowCentre   centre of the warm pool on the page in front.
//
// STYLE (for the world coder to match): flat pigments are ShaderMaterials writing constant linear colour, two
// tones per pigment (base and a 25-30 % darker or lighter tone split along a hard edge), sepia (#3B2A1A)
// outlines 0.15-0.2 m wide drawn either in the fragment shader (fwidth-antialiased) or as an inverted hull,
// rows of three white dots, white hairlines never thinner than 1.3 px. Gold: see GOLD_FRAG, self-contained.
import * as THREE from 'three';

const DEFAULT_PALETTE = ['#EADBB8', '#CDB98C', '#1F3F9A', '#2F7D5B', '#C7361F', '#3B2A1A', '#E8B33A'];
const CY = 45;            // height of the rondel centre
const TAU = Math.PI * 2;

// ---------------------------------------------------------------- geometry accumulator
function makeAcc() {
  return { p: [], n: [], u: [], a: [], tris: 0 };
}
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3();
// flat-shaded quad (two triangles); uv per corner; flag goes to the 'aFlag' attribute
function quad(acc, A, B, C, D, uA, uB, uC, uD, flag) {
  _a.set(B[0] - A[0], B[1] - A[1], B[2] - A[2]); _b.set(D[0] - A[0], D[1] - A[1], D[2] - A[2]);
  _c.crossVectors(_a, _b);
  if (_c.lengthSq() < 1e-10) { _b.set(C[0] - A[0], C[1] - A[1], C[2] - A[2]); _c.crossVectors(_a, _b); }
  _c.normalize();
  const vs = [A, B, C, A, C, D], us = [uA, uB, uC, uA, uC, uD];
  for (let i = 0; i < 6; i++) {
    acc.p.push(vs[i][0], vs[i][1], vs[i][2]); acc.n.push(_c.x, _c.y, _c.z);
    acc.u.push(us[i][0], us[i][1]); acc.a.push(flag);
  }
  acc.tris += 2;
}
// Sweep a bevelled cross-section round a loop. ring(i) -> { i:[x,y], o:[x,y] } inner and outer edge points;
// profile: closed list of [side('i'|'o'), inset in metres, z]. uvMode 'arc' = (arc length, metres across).
function sweep(acc, n, ring, profile, flag, uvMode) {
  const rows = []; let arc = 0, prev = null;
  for (let i = 0; i <= n; i++) {
    const r = ring(i % n), w = Math.hypot(r.o[0] - r.i[0], r.o[1] - r.i[1]);
    const mx = (r.i[0] + r.o[0]) / 2, my = (r.i[1] + r.o[1]) / 2;
    if (prev) arc += Math.hypot(mx - prev[0], my - prev[1]);
    prev = [mx, my];
    const row = profile.map(([side, inset, z]) => {
      const t = side === 'i' ? inset / w : 1 - inset / w;
      const x = r.i[0] + (r.o[0] - r.i[0]) * t, y = r.i[1] + (r.o[1] - r.i[1]) * t;
      return { p: [x, y, z], uv: uvMode === 'arc' ? [arc, t * w] : [x, y] };
    });
    rows.push(row);
  }
  const K = profile.length;
  for (let i = 0; i < n; i++) for (let k = 0; k < K; k++) {
    const k2 = (k + 1) % K, A = rows[i][k], B = rows[i + 1][k], C = rows[i + 1][k2], D = rows[i][k2];
    quad(acc, A.p, B.p, C.p, D.p, A.uv, B.uv, C.uv, D.uv, flag);
  }
}
// smooth dome (boss) with a little collar; flag 0 = no punch-dots
function dome(acc, cx, cy, z0, r, hgt, dir = 1) {
  const SEG = 14, LAT = 5;
  const pt = (j, i) => {
    const a = (i / SEG) * TAU, l = (j / LAT) * Math.PI * 0.5;
    return [cx + Math.cos(a) * Math.cos(l) * r, cy + Math.sin(a) * Math.cos(l) * r, z0 + dir * Math.sin(l) * hgt];
  };
  const base = acc.p.length / 3;
  for (let j = 0; j < LAT; j++) for (let i = 0; i < SEG; i++) {
    const A = pt(j, i), B = pt(j, i + 1), C = pt(j + 1, i + 1), D = pt(j + 1, i);
    quad(acc, A, B, C, D, [A[0], A[1]], [B[0], B[1]], [C[0], C[1]], [D[0], D[1]], 0);
  }
  // overwrite flat normals with smooth ones
  for (let v = base; v < acc.p.length / 3; v++) {
    const x = (acc.p[v * 3] - cx) / (r * r), y = (acc.p[v * 3 + 1] - cy) / (r * r), z = (acc.p[v * 3 + 2] - z0) / (hgt * hgt);
    const l = Math.hypot(x, y, z) || 1; acc.n[v * 3] = x / l; acc.n[v * 3 + 1] = y / l; acc.n[v * 3 + 2] = z / l;
  }
}
function accToGeometry(acc) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(acc.p, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(acc.n, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(acc.u, 2));
  g.setAttribute('aFlag', new THREE.Float32BufferAttribute(acc.a, 1));
  return g;
}

// ---------------------------------------------------------------- the letter's outline
// Lombardic O: round outside, a narrower, slightly pointed counter, so the stroke swells to 12 m at the sides
// and thins to 8 m at head and foot.
const O_OUT = [35, 40], O_IN = [23, 32];
function oRing(theta, pinch) {
  const c = Math.cos(theta), s = Math.sin(theta);
  const ci = Math.sign(c) * Math.pow(Math.abs(c), pinch);
  return { i: [O_IN[0] * ci, CY + O_IN[1] * s], o: [O_OUT[0] * c, CY + O_OUT[1] * s] };
}

function buildGold(rng, V) {
  const acc = makeAcc();
  // the O: bevelled slab with a raised central band, both faces
  const band = 2.2 + V.bandInset;
  const prof = [['i', 0, -1.5], ['i', 0, 1.5], ['i', 0.5, 2.0], ['i', band, 2.0], ['i', band + 0.5, 2.45],
    ['o', band + 0.5, 2.45], ['o', band, 2.0], ['o', 0.5, 2.0], ['o', 0, 1.5], ['o', 0, -1.5], ['o', 0.5, -2.0], ['i', 0.5, -2.0]];
  const N = 220;
  sweep(acc, N, (i) => oRing((i / N) * TAU, V.pinch), prof, 1, 'arc');
  // rondel rim
  const rim = [['i', 0, -1.4], ['i', 0, 1.7], ['i', 0.35, 2.25], ['i', 0.75, 2.25], ['i', 0.95, 2.0], ['o', 0.55, 2.0],
    ['o', 0.35, 2.25], ['o', 0.0, 1.7], ['o', 0, -1.4]];
  const RN = 96;
  sweep(acc, RN, (i) => { const a = (i / RN) * TAU, c = Math.cos(a), s = Math.sin(a); return { i: [7.4 * c, CY + 7.4 * s], o: [9.3 * c, CY + 9.3 * s] }; }, rim, 1, 'arc');
  // square fillets either side of the knotwork
  const sq = (h) => [[h, CY - h], [h, CY + h], [-h, CY + h], [-h, CY - h]];
  const fil = [['i', 0, -1.25], ['i', 0, 1.25], ['i', 0.25, 1.6], ['o', 0.25, 1.6], ['o', 0, 1.25], ['o', 0, -1.25]];
  for (const [hi, ho] of [[38.2, 39.1], [44.0, 45.2]]) {
    const I = sq(hi), O = sq(ho);
    sweep(acc, 4, (i) => ({ i: I[i], o: O[i] }), fil, 1, 'xy');
  }
  // corner bosses, mid-border studs, head and foot finials of the letter
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
    dome(acc, sx * 41.55, CY + sy * 41.55, 1.0, 1.7, 1.5); dome(acc, sx * 41.55, CY + sy * 41.55, -1.0, 1.7, 1.2, -1);
  }
  const studs = V.studs;
  for (let k = 1; k < studs; k++) {
    const s = -39 + (78 * k) / studs;
    for (const e of [-1, 1]) { dome(acc, s, CY + e * 44.6, 1.25, 0.55, 0.6); dome(acc, e * 44.6, CY + s, 1.25, 0.55, 0.6); }
  }
  // a ring of beads round the rondel rim
  const beads = 28;
  for (let k = 0; k < beads; k++) { const a = ((k + 0.5) / beads) * TAU; dome(acc, Math.cos(a) * 8.72, CY + Math.sin(a) * 8.72, 2.0, 0.34, 0.42); }
  return acc;
}

// panel slab: a square with the rondel hole through it; all painting happens in the fragment shader
function buildPanel() {
  const acc = makeAcc(), SEG = 96, H = 45, R = 7.6, uv = [0, 0];
  const sqd = (a) => H / Math.max(Math.abs(Math.cos(a)), Math.abs(Math.sin(a)));
  for (let i = 0; i < SEG; i++) {
    const a0 = (i / SEG) * TAU, a1 = ((i + 1) / SEG) * TAU;
    const c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1), d0 = sqd(a0), d1 = sqd(a1);
    for (const z of [1, -1]) {
      const A = [R * c0, CY + R * s0, z], B = [d0 * c0, CY + d0 * s0, z], C = [d1 * c1, CY + d1 * s1, z], D = [R * c1, CY + R * s1, z];
      if (z > 0) quad(acc, A, B, C, D, uv, uv, uv, uv, 0); else quad(acc, D, C, B, A, uv, uv, uv, uv, 0);
    }
    quad(acc, [d0 * c0, CY + d0 * s0, 1], [d0 * c0, CY + d0 * s0, -1], [d1 * c1, CY + d1 * s1, -1], [d1 * c1, CY + d1 * s1, 1], uv, uv, uv, uv, 0);
  }
  return acc;
}

// ---------------------------------------------------------------- shaders
const HASH = /* glsl */`
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
`;
const VERT = /* glsl */`
attribute float aFlag;
varying vec3 vL, vNl, vNw, vW, vTw, vBw; varying vec2 vUv; varying float vFlag;
#include <fog_pars_vertex>
void main(){
  vL = position; vNl = normal; vUv = uv; vFlag = aFlag;
  vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz;
  mat3 m = mat3(modelMatrix); vNw = normalize(m * normal); vTw = normalize(m[0]); vBw = normalize(m[1]);
  vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

// Gold leaf: the one reflective material. Dull ochre under the dark room, a true mirror for the candle, tooled
// with punch-dots (a dimpled normal), plus the scripted ignition: blade, wake, sparkle.
const GOLD_FRAG = /* glsl */`
uniform float uTime, uP, uCandleI, uPat;
uniform vec3 uCandleDir, uCandleCol, uGold, uPaint;
varying vec3 vL, vNl, vNw, vW, vTw, vBw; varying vec2 vUv; varying float vFlag;
#include <fog_pars_fragment>
${HASH}
void main(){
  vec3 V = normalize(cameraPosition - vW);
  vec3 Nw = normalize(vNw), Nl = normalize(vNl);
  float fl = dot(Nw, V) < 0.0 ? -1.0 : 1.0; Nw *= fl; Nl *= fl;
  float flatF = step(0.9, abs(Nl.z)) * vFlag;
  // punch-dots on a staggered lattice, kept along a lozenge trellis
  vec2 q = vUv / 1.05; float row = floor(q.y); q.x += 0.5 * mod(row, 2.0);
  vec2 id = floor(q), f = fract(q) - 0.5; float r = length(f);
  float keepA = max(step(mod(id.x + id.y + 400.0, 4.0), 0.5), step(mod(id.x - id.y + 400.0, 4.0), 0.5));
  float keepB = step(0.5, mod(id.y + 300.0, 3.0));
  float keep = mix(keepA, keepB, uPat);
  float dimple = smoothstep(0.36, 0.31, r) * keep * flatF;
  vec2 g = dimple * (f / max(r, 1e-3)) * smoothstep(0.03, 0.3, r) * 1.4;
  vec2 wob = 0.045 * vec2(sin(vL.x * 0.9 + vL.y * 0.33) + sin(vL.y * 1.7), sin(vL.y * 0.8 - vL.x * 0.41) + sin(vL.x * 1.3)) * flatF;
  vec2 pert = g + wob;
  vec3 Nl2 = normalize(Nl + vec3(pert, 0.0));
  vec3 Nw2 = normalize(Nw + vTw * pert.x + vBw * pert.y);
  vec3 R = reflect(-V, Nw2);
  // dull state: ochre-brown, a little lighter where the leaf mirrors the cream page below
  vec3 col = uGold * vec3(1.0, 0.86, 0.9) * (0.25 + 0.20 * smoothstep(0.25, -0.6, R.y) + 0.09 * Nl2.y);
  col *= 1.0 - 0.4 * dimple * smoothstep(0.08, 0.3, r);
  // the candle, mirrored
  float c = max(dot(R, uCandleDir), 0.0);
  float fres = pow(1.0 - max(dot(Nw2, V), 0.0), 4.0);
  vec3 F = mix(vec3(1.0, 0.74, 0.32), vec3(1.0, 0.95, 0.85), fres * 0.6);
  col += F * uCandleCol * uCandleI * (smoothstep(0.955, 0.997, c) * 4.0 + pow(c, 6.0) * 0.35);
  // the ignition
  float m = pow(max(Nl2.z, 0.0), 6.0);
  float xs = vL.x + 0.32 * (vL.y - 45.0);
  float bx = mix(64.0, -64.0, smoothstep(0.03, 0.6, uP));
  float blade = exp(-(xs - bx) * (xs - bx) / 30.25) * smoothstep(0.0, 0.05, uP) * (1.0 - smoothstep(0.58, 0.66, uP));
  float lit = smoothstep(bx - 1.0, bx + 10.0, xs) * smoothstep(0.02, 0.1, uP);
  float flick = 0.9 + 0.1 * sin(uTime * 9.0) * sin(uTime * 5.3 + 1.0);
  vec3 hot = vec3(1.0, 0.50, 0.07);
  float shx = (xs - 58.0 * sin(uTime * 0.45)) / 10.0; float shim = exp(-shx * shx) * 0.7;
  float fm = step(-0.5, vL.z) * smoothstep(-0.2, 0.1, Nl.z);
  col += hot * (blade * 5.5 * (0.15 + m) + lit * flick * (0.12 + (0.52 + shim) * m)) * fm;
  float h = hash(id + 3.0);
  float tw = pow(max(0.0, sin(uTime * (2.5 + 5.0 * h) + h * 50.0)), 16.0);
  // before the ignition the leaf is not dead: a slow glint travels across it and its punch-dots wink in the glint,
  // so that from far off it reads as gold, not brown
  float pre = (1.0 - lit) * fm * exp(-shx * shx * 0.35);
  col += hot * pre * (0.05 + 0.26 * m) + uGold * 0.05 * (1.0 - lit) * fm * m;
  col += vec3(1.0, 0.9, 0.6) * smoothstep(0.24, 0.05, r) * keep * flatF * pre * tw * 1.8;
  float recent = exp(-max(xs - bx, 0.0) / 25.0);
  col += vec3(1.0, 0.9, 0.6) * smoothstep(0.24, 0.05, r) * keep * flatF * lit * tw * (2.5 + 5.0 * recent) * fm;
  gl_FragColor = vec4(col * uPaint, 1.0);
  #include <fog_fragment>
}`;

// The painted panel: field diaper, filigree counter, interlace border, corner plaques. Flat pigment, unlit.
const PANEL_FRAG = /* glsl */`
uniform float uTime, uKnotK, uSwap;
uniform vec3 uLapis, uVerm, uWhite, uSepia, uVellum, uPaint;
varying vec3 vL;
#include <fog_pars_fragment>
${HASH}
float ink(float edge, float d, float px){ return 1.0 - smoothstep(edge - px, edge + px, d); }
void main(){
  vec2 p = vec2(vL.x, vL.y - 45.0);
  float px = max(length(vec2(dFdx(p.x), dFdy(p.x))), length(vec2(dFdx(p.y), dFdy(p.y))));
  float lw = max(0.10, px * 0.6), la = clamp(0.16 / max(px, 1e-4), 0.4, 1.0);
  vec3 col;
  if (vL.z < -0.98) {
    vec2 g = abs(fract(p / 7.0) - 0.5);
    col = uVellum * (0.78 - 0.08 * ink(0.012, min(g.x, g.y), px / 7.0));
  } else if (vL.z < 0.98) {
    col = uSepia;
  } else {
    float mx = max(abs(p.x), abs(p.y));
    if (mx > 39.0) {
      bool vert = abs(p.x) > abs(p.y);
      float s = vert ? p.y * sign(p.x) : -p.x * sign(p.y);
      float t = mx - 41.55;
      if (abs(s) > 39.0) {
        // corner plaque: quatrefoil
        vec2 c = abs(p) - 41.55, ca = abs(c);
        float dq = min(length(ca - vec2(1.15, 0.0)), length(ca - vec2(0.0, 1.15))) - 1.2;
        col = mix(uVerm, uVerm * 0.72, step(0.0, c.x * c.y));
        col = mix(col, uLapis, ink(0.0, dq, px));
        col = mix(col, uWhite, ink(lw, abs(dq), px));
        col = mix(col, uWhite, ink(0.26, length(ca - 2.45), px));
      } else {
        // three-strand interlace; height sin(2 phase) decides over and under
        float th = s * uKnotK + uTime * 0.3;
        col = uSepia * 0.5;
        col = mix(col, uSepia * 1.3, ink(0.11, length(fract(vec2(s, t) / 0.9) - 0.5) * 0.9, px));
        float best = -9.0;
        for (int i = 0; i < 3; i++) {
          float ph = th + float(i) * 2.0944;
          float yc = 1.5 * sin(ph), sl = 1.5 * uKnotK * cos(ph);
          float d = abs(t - yc) / sqrt(1.0 + sl * sl), hgt = sin(2.0 * ph);
          if (d < 0.80 + px && hgt > best) {
            best = hgt;
            vec3 rc = i == 0 ? uLapis : (i == 1 ? uVerm : mix(uLapis, uWhite, 0.5));
            rc *= mix(0.70, 1.0, step(0.0, t - yc));
            float dir = i == 1 ? -1.0 : 1.0;
            float u = fract(s * 0.4 - dir * uTime * 0.55 + float(i) * 0.33);
            float dd = length(vec2((u - 0.5) / 0.4, d * 1.0));
            rc = mix(rc, uWhite, ink(0.17, dd, px));
            col = mix(rc, uSepia * 0.45, smoothstep(0.60 - px, 0.60 + px, d));
          }
        }
      }
    } else if (length(p / vec2(29.0, 36.0)) > 1.0) {
      // field: diaper of lozenges, hairline trellis, rows of three dots
      vec2 q = vec2(p.x + p.y, p.x - p.y) * 0.7071 / 4.6; vec2 id = floor(q), f = fract(q) - 0.5;
      vec3 a = uSwap > 0.5 ? uLapis : uVerm;
      col = a * mix(1.0, 0.72, mod(id.x + id.y, 2.0));
      float edge = (0.5 - max(abs(f.x), abs(f.y))) * 4.6;
      col = mix(col, uWhite, 0.8 * la * ink(lw, edge, px));
      vec2 o = vec2(f.x + f.y, f.x - f.y) * 0.7071 * 4.6;
      float d3 = min(length(o), min(length(o - vec2(0.8, 0.0)), length(o + vec2(0.8, 0.0))));
      col = mix(col, uWhite, la * ink(0.24, d3, px));
    } else {
      // counter: winding filigree spirals
      vec3 b = uSwap > 0.5 ? uVerm : uLapis;
      vec2 c = p / 7.6; float row = floor(c.y); c.x += 0.5 * mod(row, 2.0);
      vec2 id = floor(c), f = fract(c) - 0.5;
      float r = length(f), a = atan(f.y, f.x), dir = mod(id.x + row, 2.0) * 2.0 - 1.0, h = hash(id);
      float dr = 0.46 / 1.75;
      float sp = fract(a * dir / 6.2832 + r / dr - uTime * 0.05 * dir + h);
      float inDisc = ink(0.46, r, px / 7.6);
      col = mix(b * 0.62, b, inDisc);
      col = mix(col, uWhite, la * inDisc * ink(lw, abs(sp - 0.5) * dr * 7.6, px) * smoothstep(0.03, 0.07, r));
      col = mix(col, uWhite, la * ink(lw, abs(r - 0.46) * 7.6, px));
      col = mix(col, uWhite, ink(0.26, r * 7.6, px));
      col = mix(col, uWhite, la * ink(0.3, length(abs(f) - 0.5) * 7.6, px));
    }
    col *= 0.97 + 0.05 * hash(floor(p * 3.0));
  }
  gl_FragColor = vec4(col * uPaint, 1.0);
  #include <fog_fragment>
}`;

// ---------------------------------------------------------------- the tree of life
const TREE_VERT = /* glsl */`
attribute vec3 aCtr; attribute vec4 aData; attribute vec2 aLoc;
uniform float uGrow, uTime, uHull;
varying vec2 vLoc; varying vec4 vData; varying vec3 vN; varying float vVis;
#include <fog_pars_vertex>
void main(){
  float age = aData.x, kind = aData.y;
  float vis = smoothstep(age, age + 0.07, uGrow);
  vec3 d = position - aCtr, c = aCtr;
  if (kind > 0.5) {
    // leaves, fruit, blossom: unfurl by turning out of the stem, then flutter
    float ang = (1.0 - vis) * 1.6 + sin(uTime * 1.7 + aData.w * 6.2832) * 0.07 * vis;
    float cs = cos(ang), sn = sin(ang);
    d = vec3(d.x * cs - d.y * sn, d.x * sn + d.y * cs, d.z) * vis * (1.0 + 0.25 * sin(vis * 3.1416));
    if (uHull > 0.5) d *= 0.0;
  } else {
    d *= vis;
    if (uHull > 0.5) d += normal * 0.17 * vis;
  }
  // a draught: tips sway more than the trunk
  c.x += sin(uTime * 0.8 + aCtr.y * 0.21) * 0.22 * age * age;
  c.y += sin(uTime * 0.63 + aCtr.x * 0.17) * 0.12 * age * age;
  vec3 pos = c + d; if (uHull > 0.5) pos.z -= 0.04;
  vLoc = aLoc; vData = aData; vN = normal; vVis = vis;
  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0); gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const TREE_FRAG = /* glsl */`
uniform vec3 uGreen, uWhite, uSepia, uVerm, uOchre, uPaint; uniform float uHull;
varying vec2 vLoc; varying vec4 vData; varying vec3 vN; varying float vVis;
#include <fog_pars_fragment>
float ink(float edge, float d, float px){ return 1.0 - smoothstep(edge - px, edge + px, d); }
void main(){
  if (vVis < 0.01) discard;
  vec3 col; float kind = vData.y, edge = vData.z, h = vData.w;
  float px = max(length(vec2(dFdx(vLoc.x), dFdy(vLoc.x))), length(vec2(dFdx(vLoc.y), dFdy(vLoc.y))));
  float pe = fwidth(edge);
  if (uHull > 0.5) col = uSepia * 0.85;
  else if (kind < 0.5) {
    float tone = step(0.0, dot(normalize(vN), vec3(-0.45, 0.62, 0.64)));
    col = uGreen * mix(0.58, 1.12, tone) * (0.9 + 0.2 * h);
    float dash = step(0.35, fract(vLoc.y * 0.3 + h));
    col = mix(col, uWhite, dash * ink(0.03, abs(vLoc.x - 0.36), fwidth(vLoc.x)));
  } else if (kind < 1.5) {
    col = uGreen * mix(0.58, 1.15, step(0.0, vLoc.y)) * (0.88 + 0.24 * h);
    vec2 q = vec2(vLoc.x, vLoc.y);
    float d3 = min(length(q - vec2(0.30, 0.0)), min(length(q - vec2(0.58, 0.0)), length(q - vec2(0.86, 0.0))));
    col = mix(col, uWhite, ink(0.075, d3, px));
    col = mix(col, uSepia, smoothstep(0.80 - pe, 0.80 + pe, edge));
  } else if (kind < 2.5) {
    col = uVerm * mix(0.66, 1.0, step(length(vLoc - vec2(0.3, -0.3)), 0.95));
    float d3 = min(length(vLoc - vec2(-0.1, 0.25)), min(length(vLoc - vec2(-0.42, 0.25)), length(vLoc - vec2(0.22, 0.25))));
    col = mix(col, uWhite, ink(0.11, d3, px));
    col = mix(col, uSepia, smoothstep(0.84 - pe, 0.84 + pe, edge));
  } else {
    float r = length(vLoc);
    col = mix(uWhite, uWhite * vec3(0.80, 0.84, 0.95), smoothstep(0.55, 0.6, r));
    col = mix(col, uOchre, ink(0.27, r, px));
    col = mix(col, uSepia, max(ink(0.035, abs(r - 0.27), px), smoothstep(0.84 - pe, 0.84 + pe, edge)));
  }
  gl_FragColor = vec4(col * uPaint, 1.0);
  #include <fog_fragment>
}`;

function buildTree(rng, V) {
  const P = [], N = [], C = [], D = [], L = [], I = [];
  const vert = (x, y, z, nx, ny, nz, cx, cy, cz, age, kind, edge, h, lu, lv) => {
    P.push(x, y, z); N.push(nx, ny, nz); C.push(cx, cy, cz); D.push(age, kind, edge, h); L.push(lu, lv);
    return P.length / 3 - 1;
  };
  const inCounter = (x, y) => Math.hypot(x / O_IN[0], (y - CY) / O_IN[1]);
  const zAt = (x, y, z0) => z0 + 1.3 * smooth01((inCounter(x, y) - 0.78) / 0.16);
  // flat card: lobed outline as a fan. kind 1 leaf, 2 fruit, 3 blossom
  function card(kind, bx, by, bz, ang, size, age) {
    const h = rng(), K = kind === 1 ? 24 : kind === 2 ? 14 : 20, ca = Math.cos(ang), sa = Math.sin(ang);
    const rad = (f) => kind === 1 ? 0.42 + 0.58 * Math.pow(Math.abs(Math.cos(1.5 * f)), 0.95)
      : kind === 2 ? 1 : 0.72 + 0.28 * Math.abs(Math.cos(2.5 * f));
    const off = kind === 1 ? 0.42 : 0;                     // leaf: the stem notch sits at the base point
    const put = (lx, ly, edge) => vert(bx + (lx * ca - ly * sa) * size, by + (lx * sa + ly * ca) * size, bz, 0, 0, 1, bx, by, bz, age, kind, edge, h, lx, ly);
    const c0 = put(off, 0, 0); let first = -1, prev = -1;
    for (let k = 0; k < K; k++) {
      const f = (k / K) * TAU, r = rad(f), v = put(off + Math.cos(f) * r, Math.sin(f) * r, 1);
      if (prev >= 0) I.push(c0, prev, v); else first = v;
      prev = v;
    }
    I.push(c0, prev, first);
  }
  // tube along a polyline of [x,y,z]; radius r0 -> r1; ages a0 -> a1. Returns per-point info for attachments.
  function tube(pts, r0, r1, a0, a1, leafEvery = 0, leafSize = 2) {
    const RS = 7, h = rng(), n = pts.length, info = [];
    let len = 0, nextLeaf = leafEvery * rng.range(0.4, 1), side = rng.sign(), prevRing = -1;
    for (let i = 0; i < n; i++) {
      const p = pts[i], q0 = pts[Math.max(0, i - 1)], q1 = pts[Math.min(n - 1, i + 1)];
      if (i) len += Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1], p[2] - pts[i - 1][2]);
      let tx = q1[0] - q0[0], ty = q1[1] - q0[1], tz = q1[2] - q0[2]; const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
      let nx = -ty, ny = tx; const nl = Math.hypot(nx, ny) || 1; nx /= nl; ny /= nl;       // cross(Z, T), in plane
      const bx = ty * 0 - tz * ny, by = tz * nx - tx * 0, bz = tx * ny - ty * nx;         // cross(T, N)
      const t = i / (n - 1), r = (r0 + (r1 - r0) * t) * (i === n - 1 ? 0.25 : 1), age = a0 + (a1 - a0) * t;
      const ring = P.length / 3;
      for (let j = 0; j < RS; j++) {
        const a = (j / RS) * TAU, c = Math.cos(a), s = Math.sin(a) * 0.7;
        const ox = nx * c + bx * s, oy = ny * c + by * s, oz = bz * s, ol = Math.hypot(ox, oy, oz);
        vert(p[0] + ox * r, p[1] + oy * r, p[2] + oz * r, ox / ol, oy / ol, oz / ol, p[0], p[1], p[2], age, 0, 0, h, j / RS, len);
      }
      if (i) {
        const b0 = prevRing, b1 = ring;
        for (let j = 0; j < RS; j++) { const j2 = (j + 1) % RS; I.push(b0 + j, b0 + j2, b1 + j2, b0 + j, b1 + j2, b1 + j); }
      }
      prevRing = ring;
      info.push({ p, t: [tx, ty], n: [nx, ny], r, age });
      if (leafEvery && len > nextLeaf && i < n - 2 && (leafSize > 2.75 || t < 0.72)) {
        nextLeaf += leafEvery * rng.range(0.8, 1.25); side = -side;
        const ang = Math.atan2(ty, tx) + side * rng.range(0.8, 1.25), s = leafSize * rng.range(0.8, 1.2) * (1 - 0.35 * t);
        const lx = p[0] + nx * side * r * 0.6, ly = p[1] + ny * side * r * 0.6;
        if (Math.hypot(lx + Math.cos(ang) * s, ly + Math.sin(ang) * s - CY) > 10.3) card(1, lx, ly, p[2] + 0.25, ang, s, age + 0.05);
      }
    }
    return info;
  }
  // a scroll: a spiral that tightens as it goes. Returns points or null if it leaves its room.
  function scroll(x, y, z0, psi, curl, rho0, turns, strict) {
    const pts = [[x, y, zAt(x, y, z0)]], ds = 0.55; let turned = 0, s = 0;
    const decay = rho0 * turns * 2.6;
    while (turned < turns * TAU && pts.length < 220) {
      const rho = Math.max(0.55, rho0 * Math.exp(-s / decay) * (1 - 0.6 * turned / (turns * TAU)));
      psi += (curl * ds) / rho; turned += ds / rho; s += ds;
      x += Math.cos(psi) * ds; y += Math.sin(psi) * ds;
      if (strict && (inCounter(x, y) > V.spill || Math.hypot(x, y - CY) < 10.4)) return null;
      pts.push([x, y, zAt(x, y, z0)]);
    }
    return pts;
  }
  function twig(x, y, z0, psi, curl, rho0, turns, r0, a0, tip) {
    let pts = null;
    for (let k = 0; k < 6 && !pts; k++) { pts = scroll(x, y, z0, psi, curl, rho0, turns, true); rho0 *= 0.78; }
    if (!pts || pts.length < 8) return;
    const a1 = Math.min(1.0, a0 + 0.12 + pts.length * 0.0022);
    tube(pts, r0, r0 * 0.38, a0, a1, 3.4, 2.7);
    const e = pts[pts.length - 1];
    card(tip, e[0], e[1], e[2] + 0.35, rng.range(0, TAU), tip === 2 ? rng.range(1.0, 1.4) : rng.range(1.3, 1.8), a1 + 0.02);
  }
  const curve = (ctrl, n) => new THREE.CatmullRomCurve3(ctrl.map((p) => new THREE.Vector3(p[0], p[1], p[2])), false, 'centripetal').getSpacedPoints(n).map((v) => [v.x, v.y, v.z]);

  // trunk, with a lazy S, and roots that curl along the foot of the counter
  const y0 = CY - O_IN[1] + 1.6, forkY = CY - 15.5 + V.fork, wig = V.wiggle;
  const trunk = curve([[wig * 0.4, y0, 2.4], [-wig, y0 + (forkY - y0) * 0.35, 2.3], [wig, y0 + (forkY - y0) * 0.7, 2.4], [0, forkY, 2.7]], 26);
  const ti = tube(trunk, 1.55, 1.15, 0, 0.2);
  for (const sx of [-1, 1]) for (let k = 0; k < 2; k++) {
    const pts = scroll(wig * 0.4 + sx * 0.6, y0 + 0.6 + k * 1.0, 2.2, sx > 0 ? -0.35 - k * 0.5 : Math.PI + 0.35 + k * 0.5, sx, 4.2 - k * 1.2, 0.8 + rng() * 0.3, false);
    tube(pts, 0.7, 0.3, 0.02, 0.16, k ? 0 : 3.4, 1.5);
  }
  // low twigs off the trunk into the foot of the counter
  for (let k = 0; k < V.lowTwigs; k++) {
    const sx = k % 2 ? 1 : -1, at = ti[Math.floor(ti.length * (0.3 + 0.5 * (k >> 1) / Math.max(1, (V.lowTwigs >> 1))))];
    twig(at.p[0] + sx * at.r * 0.6, at.p[1], 2.0, Math.PI / 2 - sx * rng.range(0.9, 1.25), -sx * (rng.chance(0.75) ? 1 : -1), rng.range(5.5, 7.5), rng.range(1.2, 1.7), 0.5, at.age + 0.03, k % 3 === 0 ? 3 : 2);
  }
  // two boughs round the rondel, crossing above it, each ending in a great scroll in the head of the counter
  for (const sx of [1, -1]) {
    const ctrl = [[0, forkY - 1.2, 2.6], [0, forkY, 2.7]], a0 = -Math.PI / 2 + 0.33, a1 = Math.PI / 2 + V.cross;
    for (let k = 0; k <= 9; k++) {
      const a = a0 + (a1 - a0) * (k / 9), R = 11.7 + 0.9 * Math.sin(k * 0.9 + sx) + rng.range(-0.25, 0.25);
      ctrl.push([sx * R * Math.cos(a), CY + R * Math.sin(a) * 1.03, 3.2 + 1.0 * Math.sin((k / 9) * Math.PI) + (sx > 0 ? 0.55 : 0)]);
    }
    const pts = curve(ctrl, 70).slice(2), n = pts.length;
    const bi = tube(pts, 1.05, 0.62, 0.2, 0.6, 4.4, 3.0);
    const e = bi[n - 1], psi = Math.atan2(e.t[1], e.t[0]);
    let top = null, rho = 6.5;
    for (let k = 0; k < 6 && !top; k++) { top = scroll(e.p[0], e.p[1], 2.2, psi, -sx, rho, 1.6 + V.turns, true); rho *= 0.82; }
    if (top) {
      for (let i = 0; i < Math.min(6, top.length); i++) top[i][2] = e.p[2] + (top[i][2] - e.p[2]) * (i / 6);
      tube(top, 0.62, 0.26, 0.6, 0.97, 3.4, 2.8);
      const q = top[top.length - 1]; card(3, q[0], q[1], q[2] + 0.35, rng() * TAU, 2.0, 0.99);
    }
    // scrolling twigs outward off the bough
    const nt = V.twigs;
    for (let k = 0; k < nt; k++) {
      const at = bi[Math.floor(n * (0.1 + 0.78 * (k + rng.range(0.2, 0.8)) / nt))];
      const out = Math.atan2(at.p[1] - CY, at.p[0]), fwd = Math.atan2(at.t[1], at.t[0]);
      const psi2 = out + Math.sin(fwd - out) * rng.range(0.5, 0.9), curl = (k % 2 ? 1 : -1) * sx;
      twig(at.p[0] + Math.cos(out) * at.r * 0.5, at.p[1] + Math.sin(out) * at.r * 0.5, 2.0, psi2, curl, rng.range(4.2, 6.2), rng.range(1.3, 1.9), 0.48, at.age + 0.04, rng.chance(0.4) ? 3 : 2);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
  g.setAttribute('aCtr', new THREE.Float32BufferAttribute(C, 3));
  g.setAttribute('aData', new THREE.Float32BufferAttribute(D, 4));
  g.setAttribute('aLoc', new THREE.Float32BufferAttribute(L, 2));
  g.setIndex(I);
  return { geometry: g, tris: I.length / 3 };
}
const smooth01 = (x) => { const t = Math.min(1, Math.max(0, x)); return t * t * (3 - 2 * t); };

// ---------------------------------------------------------------- glints and the pool of light on the page
const GLINT_VERT = /* glsl */`
attribute vec3 iPos; attribute vec3 iData;
uniform float uTime, uP;
varying vec2 vUv; varying float vB;
void main(){
  float xs = iPos.x + 0.32 * (iPos.y - 45.0);
  float bx = mix(64.0, -64.0, smoothstep(0.03, 0.6, uP));
  float blade = exp(-(xs - bx) * (xs - bx) / 49.0) * smoothstep(0.0, 0.05, uP) * (1.0 - smoothstep(0.58, 0.66, uP));
  float lit = smoothstep(bx - 1.0, bx + 10.0, xs) * smoothstep(0.02, 0.1, uP);
  float tw = pow(max(0.0, sin(uTime * iData.z + iData.y)), 10.0);
  vec4 mv = modelViewMatrix * vec4(iPos, 1.0);
  vec3 nv = normalize(normalMatrix * vec3(0.0, 0.0, 1.0));
  float facing = smoothstep(0.05, 0.35, dot(nv, normalize(-mv.xyz)));
  vB = (lit * tw * 0.9 + blade * 1.6) * facing;
  vUv = position.xy;
  mv.xy += position.xy * iData.x * (0.35 + 0.65 * min(vB, 1.5)) * step(0.004, vB);
  gl_Position = projectionMatrix * mv;
}`;
const GLINT_FRAG = /* glsl */`
varying vec2 vUv; varying float vB;
void main(){
  vec2 a = abs(vUv);
  float core = exp(-dot(vUv, vUv) * 22.0);
  float rays = exp(-a.x * 26.0) * max(0.0, 1.0 - a.y) + exp(-a.y * 26.0) * max(0.0, 1.0 - a.x);
  gl_FragColor = vec4(vec3(1.0, 0.82, 0.48) * (core * 5.0 + rays * rays * 2.4) * vB, 1.0);
}`;
const GLOW_FRAG = /* glsl */`
uniform float uFlare, uTime; varying vec2 vUv;
void main(){
  vec2 q = (vUv - vec2(0.5, 0.0)) * vec2(2.0, 1.0);
  float r = length(q);
  float g = pow(max(0.0, 1.0 - r), 2.2) * smoothstep(0.0, 0.03, vUv.y);
  g *= 0.92 + 0.08 * sin(uTime * 9.0) * sin(uTime * 5.3 + 1.0);
  gl_FragColor = vec4(vec3(1.0, 0.62, 0.24) * g * uFlare * 0.4, 1.0);
}`;

function buildGlints(rng, count, V) {
  const base = new THREE.PlaneGeometry(2, 2);
  const g = new THREE.InstancedBufferGeometry();
  g.index = base.index; g.setAttribute('position', base.getAttribute('position'));
  const pos = new Float32Array(count * 3), dat = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const k = rng();
    let x, y, z = 2.6;
    if (k < 0.72) {            // on the stroke of the letter
      const r = oRing(rng() * TAU, V.pinch), t = rng.range(0.12, 0.88);
      x = r.i[0] + (r.o[0] - r.i[0]) * t; y = r.i[1] + (r.o[1] - r.i[1]) * t;
    } else if (k < 0.84) {     // on the rondel rim
      const a = rng() * TAU; x = Math.cos(a) * 8.4; y = CY + Math.sin(a) * 8.4; z = 2.5;
    } else {                   // on the fillets and bosses of the frame
      const s = rng.range(-44, 44), h = rng.pick([38.65, 44.6]), e = rng.sign();
      if (rng.chance(0.5)) { x = s; y = CY + e * h; } else { x = e * h; y = CY + s; }
      z = 1.9;
    }
    pos.set([x, y, z], i * 3);
    dat.set([rng.range(1.6, 4.0) * (rng.chance(0.12) ? 1.8 : 1), rng() * TAU, rng.range(1.2, 3.4)], i * 3);
  }
  g.setAttribute('iPos', new THREE.InstancedBufferAttribute(pos, 3));
  g.setAttribute('iData', new THREE.InstancedBufferAttribute(dat, 3));
  g.instanceCount = count;
  return g;
}

// ---------------------------------------------------------------- the hero
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('great-initial') : ctx.rng;
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE).map((h) => new THREE.Color(h));
  const [vellum, , lapis, green, verm, sepia, goldC] = pal;
  // per-seed variety: the letter's cut, the tooling, the border's rhythm, the colour scheme, the tree's habit
  const V = {
    pinch: rng.range(1.05, 1.32), bandInset: rng.range(0, 0.6), studs: rng.int(5, 8), knotPeriods: rng.int(5, 8),
    pat: rng.chance(0.4) ? 1 : 0, swap: rng.chance(0.25) ? 1 : 0, fork: rng.range(-1.5, 1.2), wiggle: rng.range(0.5, 1.2) * rng.sign(),
    lowTwigs: rng.pick([2, 4, 4]), cross: rng.range(0.3, 0.6), turns: rng.range(0, 0.5), twigs: rng.int(4, 6), spill: rng.range(1.0, 1.1),
  };
  lapis.offsetHSL(rng.range(-0.02, 0.02), 0, rng.range(-0.02, 0.03)); verm.offsetHSL(rng.range(-0.008, 0.008), 0, 0);
  green.offsetHSL(rng.range(-0.04, 0.03), 0, rng.range(-0.02, 0.03));
  const white = new THREE.Color('#F6F0E0').multiplyScalar(0.86);
  const candleDir = new THREE.Vector3().fromArray(opts.candleDir || [0.5, 0.34, 0.8]).normalize();

  const shared = { uTime: { value: 0 }, uP: { value: 0 }, uPaint: { value: new THREE.Color(1, 1, 1) } };
  const fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
  const object = new THREE.Group(); object.name = 'great-initial';

  // panel
  const panelMat = new THREE.ShaderMaterial({
    vertexShader: VERT, fragmentShader: PANEL_FRAG, fog: true, side: THREE.DoubleSide,
    uniforms: { ...fogU(), ...shared, uKnotK: { value: (TAU * V.knotPeriods) / 78 }, uSwap: { value: V.swap },
      uLapis: { value: lapis }, uVerm: { value: verm }, uWhite: { value: white }, uSepia: { value: sepia }, uVellum: { value: vellum } },
  });
  const panelAcc = buildPanel();
  await ctx.yield?.();
  const panel = new THREE.Mesh(accToGeometry(panelAcc), panelMat); object.add(panel);
  await ctx.yield?.();

  // gold
  const goldMat = new THREE.ShaderMaterial({
    vertexShader: VERT, fragmentShader: GOLD_FRAG, fog: true, side: THREE.DoubleSide,
    uniforms: { ...fogU(), ...shared, uPat: { value: V.pat }, uGold: { value: goldC },
      uCandleDir: { value: candleDir }, uCandleCol: { value: new THREE.Color('#FFC98A') }, uCandleI: { value: 1 } },
  });
  const goldAcc = buildGold(rng, V);
  await ctx.yield?.();
  const gold = new THREE.Mesh(accToGeometry(goldAcc), goldMat); object.add(gold);
  await ctx.yield?.();

  // tree of life and its sepia outline hull
  const tree = buildTree(rng, V);
  await ctx.yield?.();
  const treeU = { ...shared, uGrow: { value: 0.8 }, uGreen: { value: green }, uWhite: { value: white }, uSepia: { value: sepia },
    uVerm: { value: verm }, uOchre: { value: goldC.clone().multiplyScalar(0.85) } };
  const treeMat = new THREE.ShaderMaterial({ vertexShader: TREE_VERT, fragmentShader: TREE_FRAG, fog: true, side: THREE.DoubleSide,
    uniforms: { ...fogU(), ...treeU, uHull: { value: 0 } } });
  const hullMat = new THREE.ShaderMaterial({ vertexShader: TREE_VERT, fragmentShader: TREE_FRAG, fog: true, side: THREE.BackSide,
    uniforms: { ...fogU(), ...treeU, uHull: { value: 1 } } });
  const treeMesh = new THREE.Mesh(tree.geometry, treeMat), hullMesh = new THREE.Mesh(tree.geometry, hullMat);
  treeMesh.frustumCulled = hullMesh.frustumCulled = false;
  object.add(hullMesh, treeMesh);
  await ctx.yield?.();

  // glints and the warm pool on the page
  const nGlints = opts.glints ?? 150;
  const glintMat = new THREE.ShaderMaterial({ vertexShader: GLINT_VERT, fragmentShader: GLINT_FRAG, uniforms: { ...shared },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const glints = new THREE.Mesh(buildGlints(rng, nGlints, V), glintMat); glints.frustumCulled = false; glints.renderOrder = 3;
  if (nGlints > 0) object.add(glints);
  const glowU = { uFlare: { value: 0 }, uTime: shared.uTime };
  let glow = null;
  if (opts.glow !== false) {
    const gg = new THREE.PlaneGeometry(190, 120); gg.rotateX(-Math.PI / 2); gg.translate(0, 0.08, 60);
    glow = new THREE.Mesh(gg, new THREE.ShaderMaterial({ uniforms: glowU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: 'varying vec2 vUv; void main(){ vUv = vec2(uv.x, 1.0 - uv.y); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: GLOW_FRAG }));
    glow.renderOrder = 2; object.add(glow);
  }

  const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const anchors = {
    portalSeat: { position: v3(0, CY, 0), normal: v3(0, 0, 1), radius: 7.4 },
    flyThrough: [v3(0, CY, 220), v3(0, CY, 150), v3(0, CY, 90), v3(0, CY, 45), v3(0, CY, 16), v3(0, CY, 0), v3(0, CY, -24)],
    viewpoints: { reveal: v3(120, 30, 190), ignition: v3(12, 40, 150), close: v3(0, CY, 40) },
    candleMirror: v3(0, 0, 1),
    shadowBase: [v3(-45, 0, 0), v3(45, 0, 0)],
    glowCentre: v3(0, 0, 60),
  };

  let progress = 0, driven = false, growth = null, flare = 0;
  const demo = opts.demo !== false;
  const hero = {
    object, radius: 64, height: 90, center: v3(0, CY, 0), anchors, ground: true, groundY: 0,
    uniforms: { ...shared, uGrow: treeU.uGrow, uCandleDir: goldMat.uniforms.uCandleDir, uCandleCol: goldMat.uniforms.uCandleCol,
      uCandleI: goldMat.uniforms.uCandleI, uFlare: glowU.uFlare },
    variant: V,
    stats: { triangles: panelAcc.tris + goldAcc.tris + tree.tris * 2 + nGlints * 2 + 2, drawCalls: 6 },
    get flare() { return flare; },
    setProgress(p) { driven = true; progress = Math.min(1, Math.max(0, p)); },
    setGrowth(g) { growth = g; },
    setCandle(dir, intensity = 1) { candleDir.copy(dir).normalize(); goldMat.uniforms.uCandleI.value = intensity; },
    update(dt, time) {
      shared.uTime.value = time;
      let p = progress;
      if (!driven && demo) { const t = time % 14; p = t < 12.5 ? smooth01((t - 2.5) / 3.2) : 1 - (t - 12.5) / 1.5; }
      shared.uP.value = p;
      flare = smooth01((p - 0.1) / 0.6);
      glowU.uFlare.value = flare;
      treeU.uGrow.value = growth ?? 1.07 - 0.37 * Math.exp(-time / 9);
    },
    dispose() {},
  };
  hero.update(0, 0);
  return hero;
}
