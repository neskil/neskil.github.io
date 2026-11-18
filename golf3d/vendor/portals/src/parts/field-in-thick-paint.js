// The Field in Thick Paint: the hero part and the one stroke family the whole world is built from.
//
// EVERY THING IS PAINT IN RELIEF. One ribbon of paint (strokeGeometry) is bent along a quadratic curve in the vertex
// shader from its own head (where the loaded brush came down), tail (where it was dragged thin) and bend; a dab is the
// same touch with a round outline, a slab is a knife's flat stroke with one raised edge. One shader (paintMaterial)
// shades them all: bristle tracks and rims as a height with its own slope, a lit side, a blue violet shade side, the
// shadow of each ridge on the paint behind it, a line of gloss that slides as the eye moves, the tail broken into
// streaks, the wind's travelling wave on what stands, the haze. No stroke lets light through.
//
// THE HERO is the elm of forty strokes (buildHero): five trunk staves, six boughs, thirty crown strokes laid like
// shingles, with rooks as ticks of two strokes wheeling round it on the world clock. Alone (the set piece viewer) it
// stands on a disc of meadow strokes and dabs; in the world the meadow is the world's.
//
// The elm is the same on every seed: it is dealt from one fixed stream (ELM_STREAM), never from the visit's seed.
// THE MAY TREE (mayStrokes; the world's second landmark, the same on every seed from MAY_STREAM): a thorn in full
// blossom, low and broad, a leaning twisted trunk of dark strokes under a crown heaped white with rose and lilac shade
// sides, a few green strokes showing through, and the ring of fallen blossom the world lays on its knoll.
import * as THREE from 'three';
import { makeRng, hashSeed, clamp, lerp, smoothstep } from '../kit/core.js';

export const ELM_STREAM = 'field-in-thick-paint:the elm of forty strokes';
// THE WIND, one law for every standing stroke (the vertex shader's and its mirror here, windReach): waves WIND.wave
// metres long travel along WIND.dir (from the right and the far side) at WIND.speed metres a second on the world clock;
// a stroke bends from its root with the square of the way along it, its tip moving at most its own amplitude along the
// wind and WIND.flutter of that across it.
export const WIND = { dir: [-0.6, 0.8], wave: 140, speed: 9, rest: 0.3, flutter: 0.18 };
// the furthest a point at share t of a standing stroke of amplitude amp is ever drawn from where it is built (metres)
export const windReach = (amp, t) => amp * t * t * Math.hypot(1, WIND.flutter);
const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
const mix3 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
const mul3 = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
export const paintColours = { lin, mix3, mul3 };

// ------------------------------------------------------------------ the bristle texture
// One tiling texture, 256 square: R the height of the tracks a brush leaves (ridges across u, drawn out along v),
// G and B its slope across and along (so one lookup gives height and slope), A a round blotch for wet mixing.
// TEX.slope: the slope stored as 1 is this many heights per unit of texture coordinate.
const TEX = { size: 256, slope: 48 };
export async function makeBristleTexture(rng, yieldFn = null) {
  const S = TEX.size, H = new Float32Array(S * S), A = new Float32Array(S * S);
  // a tiling lattice of nu by nv draws, read with a smooth step between them
  const lattice = (nu, nv) => { const g = new Float32Array(nu * nv); for (let i = 0; i < g.length; i++) g[i] = rng(); return { g, nu, nv }; };
  const wrap = (i, n) => (i >= 0 && i < n ? i : (i % n + n) % n);
  const read = (L, u, v) => {
    const nu = L.nu, nv = L.nv, g = L.g, x = u * nu, y = v * nv, x0 = Math.floor(x), y0 = Math.floor(y);
    let fx = x - x0, fy = y - y0; fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
    // the four draws round the place, each index wrapped once (as whole numbers)
    const xi = x0 | 0, yi = y0 | 0, i0 = wrap(xi, nu), i1 = wrap(xi + 1, nu), r0 = wrap(yi, nv) * nu, r1 = wrap(yi + 1, nv) * nu;
    return lerp(lerp(g[r0 + i0], g[r0 + i1], fx), lerp(g[r1 + i0], g[r1 + i1], fx), fy);
  };
  // the lattices are drawn in this one order (tracks coarse to fine, the wander, blotches coarse to fine); the page is
  // handed back between them and every few touches of every loop below (a hand-back draws nothing and changes nothing)
  const hand = async () => { if (yieldFn) await yieldFn(); };
  const tracks = [];
  for (const [nu, nv, k] of [[32, 3, 1], [64, 5, 0.55], [128, 9, 0.3]]) { tracks.push([lattice(nu, nv), k]); await hand(); }
  const wander = lattice(4, 6), blotch = [];
  for (const [nu, k] of [[6, 1], [13, 0.5], [29, 0.25]]) { blotch.push([lattice(nu, nu), k]); await hand(); }
  for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
    const u = i / S, v = j / S, uu = u + 0.012 * (read(wander, u, v) - 0.5);
    let h = 0, n = 0; for (let q = 0; q < tracks.length; q++) { const k = tracks[q][1]; h += k * read(tracks[q][0], uu, v); n += k; }
    let a = 0, m = 0; for (let q = 0; q < blotch.length; q++) { const k = blotch[q][1]; a += k * read(blotch[q][0], u, v); m += k; }
    H[j * S + i] = h / n; A[j * S + i] = a / m;
    if (yieldFn && i % 16 === 15) await yieldFn();
  }
  // spread the heights over the whole range, so a threshold on them cuts the same share of every stroke
  let lo = 1, hi = 0;
  for (let i = 0; i < H.length; i++) { lo = Math.min(lo, H[i]); hi = Math.max(hi, H[i]); if (yieldFn && i % 4096 === 4095) await yieldFn(); }
  for (let i = 0; i < H.length; i++) { H[i] = clamp((H[i] - lo) / (hi - lo), 0, 1); if (yieldFn && i % 4096 === 4095) await yieldFn(); }
  if (yieldFn) await yieldFn();
  const data = new Uint8Array(S * S * 4), w = (i) => (i + S) % S;
  for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
    const o = (j * S + i) * 4, du = (H[j * S + w(i + 1)] - H[j * S + w(i - 1)]) * S / 2, dv = (H[w(j + 1) * S + i] - H[w(j - 1) * S + i]) * S / 2;
    data[o] = Math.round(H[j * S + i] * 255);
    data[o + 1] = Math.round(clamp(0.5 + 0.5 * du / TEX.slope, 0, 1) * 255);
    data[o + 2] = Math.round(clamp(0.5 + 0.5 * dv / TEX.slope, 0, 1) * 255);
    data[o + 3] = Math.round(clamp(A[j * S + i], 0, 1) * 255);
    if (yieldFn && i % 128 === 127) await yieldFn();
  }
  await hand();
  const tex = new THREE.DataTexture(data, S, S, THREE.RGBAFormat, THREE.UnsignedByteType);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true; tex.anisotropy = 4; tex.needsUpdate = true;
  return tex;
}

// ------------------------------------------------------------------ the three touches, in the stroke's own space
// A vertex is (t, s, h): t 0..1 from head to tail, s -1..1 across, h the share of half the thickness it stands proud
// (front +, back -). Its normal is given in the same space; the shader gives both their metres.
// The outline across a full stroke: the front with a raised rim at each edge, then the back, as one closed loop.
const LOOPS = {
  full: [[-1, 0], [-0.93, 0.55], [-0.8, 1], [-0.62, 0.72], [-0.3, 0.62], [0, 0.6], [0.3, 0.62], [0.62, 0.72], [0.8, 1], [0.93, 0.55], [1, 0],
    [0.8, -0.5], [0.4, -0.6], [0, -0.6], [-0.4, -0.6], [-0.8, -0.5]],
  mid: [[-1, 0], [-0.8, 1], [0, 0.62], [0.8, 1], [1, 0], [0, -0.55]],
};
const RINGS = {
  hero: [0, 0.008, 0.02, 0.036, 0.056, 0.08, 0.11, 0.15, 0.2, 0.26, 0.32, 0.38, 0.44, 0.5, 0.56, 0.62, 0.68, 0.74, 0.79, 0.84, 0.88, 0.92, 0.95, 0.975, 0.99, 1],
  high: [0, 0.015, 0.045, 0.09, 0.16, 0.26, 0.38, 0.5, 0.62, 0.74, 0.85, 0.93, 0.98, 1],
  mid: [0, 0.04, 0.12, 0.3, 0.5, 0.7, 0.88, 1],
  round: [0, 0.05, 0.16, 0.38, 0.62, 0.84, 1],
  low: [0, 0.06, 0.25, 0.5, 0.78, 1],
  flat: [0, 0.1, 0.55, 1],
};
// detail: 'hero' (about 800 triangles), 'high' (about 430), 'round' (about 190: the full outline, few rings), 'mid' (about
// 80: a closed ribbon of six sides), 'low' (20:
// an open ribbon, drawn from both sides), 'flat' (12: the same open ribbon in three pieces, for strokes far from the line)
export function strokeGeometry(detail = 'high') {
  const rings = RINGS[detail] || RINGS.high, pos = [], nrm = [], idx = [];
  if (detail === 'low' || detail === 'flat') {
    const across = [[-1, 0], [0, 0.6], [1, 0]];
    for (const t of rings) for (const [s, h] of across) { pos.push(t, s, h); nrm.push(0, s * 0.5, 1); }
    for (let i = 0; i < rings.length - 1; i++) for (let j = 0; j < 2; j++) {
      const a = i * 3 + j, b = (i + 1) * 3 + j; idx.push(a, b, b + 1, a, b + 1, a + 1);
    }
  } else {
    const loop = LOOPS[detail === 'mid' ? 'mid' : 'full'], n = loop.length, nor = [];
    // a smooth normal at each point of the loop: across the chord of its two neighbours, pointing out
    for (let j = 0; j < n; j++) { const a = loop[(j + n - 1) % n], b = loop[(j + 1) % n]; const ds = b[0] - a[0], dh = b[1] - a[1], l = Math.hypot(ds, dh) || 1; nor.push([-dh / l, ds / l]); }
    for (const t of rings) for (let j = 0; j < n; j++) { pos.push(t, loop[j][0], loop[j][1]); nrm.push(0, nor[j][0], nor[j][1]); }
    for (let i = 0; i < rings.length - 1; i++) for (let j = 0; j < n; j++) {
      const a = i * n + j, b = (i + 1) * n + j, a1 = i * n + (j + 1) % n, b1 = (i + 1) * n + (j + 1) % n; idx.push(a, b, b1, a, b1, a1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3)); g.setIndex(idx);
  return g;
}

// A dab: one loaded touch, a low dome with a rim and a peak pulled off centre where the brush left it, closed
// underneath. Its outline is the unit disc in (2t - 1, s). detail: 'low' (about 24 triangles), 'mid' (about 100),
// 'high' (about 600), 'far' (18: the face alone, drawn from both sides, for dabs far from the line).
const DAB = { peak: [0.28, 0.12], pull: 0.55, spread: 0.07, under: 0.4 };
const dabHeight = (x, y) => {
  const r = Math.min(1, Math.hypot(x, y)), dome = 0.62 * (1 - Math.pow(r, 2.6)), rim = 0.3 * Math.exp(-(((r - 0.78) / 0.14) ** 2)) * (1 - Math.pow(r, 8));
  const dx = x - DAB.peak[0], dy = y - DAB.peak[1];
  return dome + rim + DAB.pull * Math.exp(-(dx * dx + dy * dy) / DAB.spread);
};
export function dabGeometry(detail = 'low') {
  const [nr, na] = detail === 'high' ? [12, 26] : detail === 'mid' ? [2, 16] : [2, 6], pos = [], nrm = [], idx = [];
  const e = 0.01, put = (x, y, back) => {
    const h = back ? -DAB.under * (1 - (x * x + y * y)) : dabHeight(x, y);
    const hx = back ? 2 * DAB.under * x : (dabHeight(x + e, y) - dabHeight(x - e, y)) / (2 * e), hy = back ? 2 * DAB.under * y : (dabHeight(x, y + e) - dabHeight(x, y - e)) / (2 * e);
    pos.push(0.5 + 0.5 * x, y, h); nrm.push(-hx, -hy, back ? -1 : 1);
  };
  for (const back of detail === 'far' ? [false] : [false, true]) {
    const base = pos.length / 3; put(0, 0, back);
    for (let k = 1; k <= nr; k++) for (let j = 0; j < na; j++) { const r = Math.pow(k / nr, 0.8), a = (j + (k % 2) * 0.5) / na * Math.PI * 2; put(r * Math.cos(a), r * Math.sin(a), back); }
    const at = (k, j) => base + 1 + (k - 1) * na + (j % na), tri = (a, b, c) => (back ? idx.push(a, c, b) : idx.push(a, b, c));
    for (let j = 0; j < na; j++) tri(base, at(1, j), at(1, j + 1));
    for (let k = 1; k < nr; k++) for (let j = 0; j < na; j++) { tri(at(k, j), at(k + 1, j), at(k + 1, j + 1)); tri(at(k, j), at(k + 1, j + 1), at(k, j + 1)); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3)); g.setIndex(idx);
  return g;
}

// A knife slab: flat, with one raised edge (s near +1) where the knife lifted and left a ridge, bevelled at both ends,
// closed behind. detail: 'low' (about 130 triangles), 'high' (about 400).
const SLAB_LOOP = [[-1, 0], [-0.96, 0.8], [-0.5, 0.86], [0, 0.84], [0.6, 0.9], [0.84, 1.5], [0.95, 1.2], [1, 0], [0, -0.8]];
export function slabGeometry(detail = 'low') {
  const n = SLAB_LOOP.length, nt = detail === 'high' ? 22 : 7, rings = [], pos = [], nrm = [], idx = [], nor = [];
  for (let i = 0; i <= nt; i++) rings.push(i / nt);
  rings.splice(1, 0, 0.012); rings.splice(rings.length - 1, 0, 0.988);
  for (let j = 0; j < n; j++) { const a = SLAB_LOOP[(j + n - 1) % n], b = SLAB_LOOP[(j + 1) % n]; const ds = b[0] - a[0], dh = b[1] - a[1], l = Math.hypot(ds, dh) || 1; nor.push([-dh / l, ds / l]); }
  for (const t of rings) { const end = t === 0 || t === 1; for (let j = 0; j < n; j++) { pos.push(t, SLAB_LOOP[j][0], end ? 0 : SLAB_LOOP[j][1]); nrm.push(end ? (t === 0 ? -3 : 3) : 0, nor[j][0], nor[j][1]); } }
  for (let i = 0; i < rings.length - 1; i++) for (let j = 0; j < n; j++) {
    const a = i * n + j, b = (i + 1) * n + j, a1 = i * n + (j + 1) % n, b1 = (i + 1) * n + (j + 1) % n; idx.push(a, b, b1, a, b1, a1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3)); g.setIndex(idx);
  return g;
}

// ------------------------------------------------------------------ the paint shader
// Per stroke: iA head and width, iB tail and thickness, iC bend (the curve's control point, from the middle of head and
// tail) and a seed, iD the way its face looks and its wind amplitude (metres at its tail), iE its first colour and the
// share of its width left at the tail, iF its second colour and its cover (1).
// uKind: 0 a brush stroke, 1 a dab (iC then holds x and z from its head to the root of its stalk), 2 a knife slab.
const PAINT_VERT = /* glsl */`
attribute vec4 iA, iB, iC, iD, iE, iF;
uniform float uTime, uKind, uSway;
uniform vec4 uWind;
uniform vec2 uWindK;
varying vec4 vTS, vLW;
varying vec3 vPos, vNrm, vTan, vBin, vColA, vColB;
void main(){
  float t = position.x, s = position.y, hz = position.z;
  vec3 H = iA.xyz, E = iB.xyz;
  float wid = iA.w, thk = iB.w, seed = iC.w;
  bool dab = uKind > .5 && uKind < 1.5;
  vec3 C = (H + E)*.5 + (dab ? vec3(0.) : iC.xyz);
  float it = 1. - t;
  vec3 p = it*it*H + 2.*t*it*C + t*t*E;
  vec3 dp = 2.*it*(C - H) + 2.*t*(E - C);
  vec3 T = dp/max(length(dp), 1e-4);
  vec3 Bv = cross(iD.xyz, T); Bv /= max(length(Bv), 1e-4);
  vec3 Nv = cross(T, Bv);
  float len = (2.*length(E - H) + length(C - H) + length(E - C))/3.;
  float wP = 1., tP = 1., k = 0., env = 1.;
  vec2 anchor = H.xz;
  if (uKind < .5) {
    // a rounded, loaded head; the body; the tail narrowed and dragged thin
    float hl = clamp(.5*wid/max(len, .1), .02, .35), hd = clamp(t/hl, 0., 1.);
    float rnd = sqrt(max(hd*(2. - hd), 0.));
    wP = rnd*mix(1., iE.w, smoothstep(.45, 1., t))*(1. + .05*sin(t*9. + seed*40.) + .035*sin(t*23. + seed*71.));
    float lx = (t - hl*1.2)/(hl*1.1);
    tP = rnd*(1. + .95*exp(-lx*lx))*mix(1., .1, smoothstep(.4, 1., t));
    env = mix(1., .4, smoothstep(.5, 1., t));
    k = t*t;
  } else if (dab) { anchor = H.xz + iC.xz; k = 1.; }
  vec3 pos = p + Bv*(s*wid*.5*wP) + Nv*(hz*thk*.5*tP);
  // the wind: a travelling wave bends what stands from its root; each stroke a little late or early by its seed
  float amp = iD.w;
  float ph = dot(anchor, uWind.xy)*6.2832/uWind.z - uTime*uWind.w*6.2832/uWind.z + seed*1.9;
  float g = .5 + .5*sin(ph); g = g*g*(3. - 2.*g);
  float fl = .5*sin(uTime*1.7 + seed*31.) + .5*sin(uTime*2.9 + seed*17.);
  pos.xz += (1. - uSway)*(uWind.xy*(amp*(uWindK.x + (1. - uWindK.x)*g)*k) + vec2(-uWind.y, uWind.x)*(amp*uWindK.y*fl*k));
  // the one stroke that is held at both ends (uSway 1): its middle sways across its own curve, in its own plane
  float mid = smoothstep(0., .45, t)*(1. - smoothstep(.6, .89, t));
  pos += Bv*(uSway*amp*mid*(.7*sin(uTime*.83 + seed*9.) + .3*sin(uTime*1.9 + seed*4.)));
  vec3 n = T*(normal.x/max(len*.5, .05)) + Bv*(normal.y/max(wid*.5*max(wP, .2), .05)) + Nv*(normal.z/max(thk*.5*max(tP, .2), .02));
  vec4 wp = modelMatrix*vec4(pos, 1.);
  vPos = wp.xyz;
  mat3 m3 = mat3(modelMatrix);
  vNrm = normalize(m3*n); vTan = m3*T; vBin = m3*Bv;
  vTS = vec4(t, s, seed, env); vLW = vec4(len, wid, iF.w, thk);
  vColA = iE.rgb; vColB = iF.rgb;
  gl_Position = projectionMatrix*viewMatrix*wp;
}`;

// THE LIGHT THAT MOVES AND THE DROP'S LIGHT, the same law for every face of the world (the paint's and the canvas's
// shaders both carry it). cloudShade: how deep a place lies in a cloud slab's shade (uCloud: the shade's middle in x
// and z and its half length and half width; its edge is ragged by the place's own bristle noise). dropLight: the
// one real thing lights the paint: a point light at the drop's place whose strength falls with the square of the
// distance (uDropF) and is gone at uDrop.w, on the faces turned to it, with a hard wet glint; shut: how far the face
// lies in the shadow a stroke throws from that light (painted on the low faces, the shadow texture's green).
export const LIGHT_GLSL = /* glsl */`
uniform vec4 uDrop, uCloud[11];
uniform vec3 uDropCol;
uniform float uCloudK, uDropI, uDropF;
float cloudShade(vec2 xz, float rag){
  vec2 p = xz + (rag - .5)*70.;
  float cl = 0.;
  for (int i = 0; i < 11; i++) {
    vec4 c = uCloud[i]; vec2 q = abs(p - c.xy);
    cl = max(cl, (1. - smoothstep(c.z*.55, c.z + 60., q.x))*(1. - smoothstep(c.w*.45, c.w + 45., q.y))*step(1., c.z));
  }
  return cl*uCloudK;
}
vec3 dropLight(vec3 pos, vec3 n, vec3 V, vec3 base, float shut, float gloss){
  vec3 dv = uDrop.xyz - pos; float dd = length(dv); vec3 ld = dv/max(dd, 1e-3);
  float I = uDropI/(1. + dd*dd*uDropF)*(1. - smoothstep(.7*uDrop.w, uDrop.w, dd))*(1. - shut);
  float sp = pow(clamp(dot(n, normalize(ld + V + vec3(0., 1e-4, 0.))), 0., 1.), 48.);
  return (base*clamp(.25 + .75*dot(n, ld), 0., 1.) + vec3(sp*gloss*.9))*uDropCol*I;
}`;
const PAINT_FRAG = /* glsl */`
precision highp float;
uniform sampler2D uNoise, uShadow;
uniform vec3 uSunDir, uSunPos, uKeyCol, uSkyCol, uGroundCol, uShadeCol, uFogCol;
uniform vec4 uShadowBox, uTrack;
uniform vec2 uShadowY, uTrackH;
uniform float uTime, uTwinkle, uVio, uFogDen, uKind, uSelf, uEmis, uRelief, uRimH, uDry, uGloss, uGlossP, uRag, uEnds, uRoot, uGlit, uEndRag, uSideRag, uShadeK, uOpen, uSheenAt;
${LIGHT_GLSL}
varying vec4 vTS, vLW;
varying vec3 vPos, vNrm, vTan, vBin, vColA, vColB;
void main(){
  float t = vTS.x, s = vTS.y, seed = vTS.z, env = clamp(vTS.w, 0., 1.)*uRelief;
  float len = vLW.x, wid = vLW.y;
  float a = t*len, b = s*wid*.5;
  vec3 N = normalize(vNrm); if (!gl_FrontFacing) N = -N;
  vec3 T = normalize(vTan), B = normalize(vBin);
  // the bristle tracks: fine ones and the coarse clumps of the brush, both drawn out along the stroke
  vec2 uf = vec2(b*uTrack.x + seed*7.31, a*uTrack.y + seed*3.17);
  vec2 uc = vec2(b*uTrack.z + seed*1.93, a*uTrack.w + seed*5.71);
  vec4 nf = texture2D(uNoise, uf), nc = texture2D(uNoise, uc);
  // the tail dragged dry: the lower tracks give out first and leave streaks of air between the others
  float dry = clamp((t - uDry)/max(1. - uDry, 1e-3), 0., 1.); dry = dry*dry*(3. - 2.*dry);
  float cut = nc.r - (dry*1.15 - .1);
  float alpha = vLW.z;
  if (cut < 0.) discard;
  // a knife slab's lifted edge is ragged: lumps along it, by the slab's own seed
  if (uKind > 1.5) {
    float lump = texture2D(uNoise, vec2(seed*3.3 + .37, t*1.3 + seed)).a*.7 + texture2D(uNoise, vec2(seed*1.7, t*5.1 + seed*2.)).a*.3;
    // its top stands between 1 - uRag and 1 of its height by the lumps; uEnds lets both ends fall to a third of it
    float fall = mix(1., .34 + .66*smoothstep(0., .16, t)*(1. - smoothstep(.84, 1., t)), uEnds);
    if (s > -1. + 2.*(1. - uRag*(1. - clamp((lump - .3)*2.5, 0., 1.)))*fall) discard;
    // its ends are dragged out in fingers along the knife's own streaks and its other side is broken: no corner is square
    float fing = texture2D(uNoise, vec2(s*.9 + seed*5.1, seed*3.7 + .2)).r, bite = texture2D(uNoise, vec2(seed*2.3 + .6, t*2.1 + seed*4.)).a;
    if (min(t, 1. - t) < uEndRag*(.12 + .88*fing)) discard;
    if (s < -1. + 2.*uSideRag*bite) discard;
  }
  // the height's slope along and across the stroke, in metres a metre
  vec2 gf = (nf.gb - .5)*${(2 * TEX.slope).toFixed(1)}, gc = (nc.gb - .5)*${(2 * TEX.slope).toFixed(1)};
  float ga = env*(uTrackH.x*gf.y*uTrack.y + uTrackH.y*gc.y*uTrack.w);
  float gb = env*(uTrackH.x*gf.x*uTrack.x + uTrackH.y*gc.x*uTrack.z);
  if (uKind < .5) { float rx = (abs(s) - .8)/.13, rim = exp(-rx*rx); gb += -uRimH*2.*rx/.13*rim*sign(s)*2./max(wid, .5); }
  vec3 Tt = T - N*dot(N, T), Bt = B - N*dot(N, B);
  vec3 n = normalize(N - ga*Tt - gb*Bt);
  // where the light is: the one key, or (uSelf: the sky's own paint) the sun boss seen from the slab
  vec3 L = uSelf > .5 ? normalize(uSunPos - vPos) : uSunDir;
  // the shadow of the next ridge toward the light, on this one
  float lt = dot(L, T), lb = dot(L, B), ln = dot(L, N), lp = max(sqrt(lt*lt + lb*lb), 1e-3);
  float reach = uTrackH.y*2.5;
  float h2 = texture2D(uNoise, uc + vec2(lb*uTrack.z, lt*uTrack.w)*(reach/lp)).r;
  float occl = smoothstep(0., .4*uTrackH.y, uTrackH.y*(h2 - nc.r)*env - reach*max(ln, 0.)/lp);
  // wet colour dragged into wet colour along the stroke, track by track; loaded ridges paler, hollows deeper
  float drag = smoothstep(.2, .95, t + (nc.r - .5)*.9 + (nc.a - .5)*.35);
  vec3 base = mix(vColA, vColB, max(drag, .55*smoothstep(.6, .82, nc.r)))*(.84 + .32*nf.r)*(.9 + .2*nc.a);
  // cast shadows (paint on the faces that stand low: read from the face's own place; red the key's blots, green
  // the blots thrown from the drop's light) and the clouds' shade, which lies on every face under it
  vec4 blots = texture2D(uShadow, (vPos.xz - uShadowBox.xy)*uShadowBox.zw);
  float lowF = 1. - smoothstep(uShadowY.x, uShadowY.y, vPos.y), blot = blots.r*lowF;
  float cl = cloudShade(vPos.xz, texture2D(uNoise, vPos.xz*.0031).a);
  float sh = (1. - blot)*(1. - cl);
  float ndl = dot(n, L), hem = n.y*.5 + .5;
  vec3 amb = mix(uGroundCol, uSkyCol, hem);
  vec3 V = normalize(cameraPosition - vPos);
  vec3 col;
  if (uSelf > .5) {
    // the sky's slabs and the boss carry their own light: only their relief is shaded, toward the boss
    // (uSelf 2, the boss itself: it IS the light and nothing lights it, so its relief reads by its own thickness
    // alone: the loaded ridges brighter, the hollows between them deeper)
    float rel = uSelf > 1.5 ? (.65*nc.r + .35*nf.r - .62)*.9*clamp(env, 0., 1.) : dot(n - N, L) - .35*occl;
    col = base*mix(uShadeCol*1.9, vec3(1.02), clamp(.8 + 1.3*rel, 0., 1.))*uEmis;
    // a glint twinkles on the world clock, each on its own beat
    col *= 1. + uTwinkle*sin(uTime*(2. + 3.*fract(seed*7.3)) + seed*40.);
  } else {
    float lit = smoothstep(-.1, .34, ndl)*(1. - occl)*sh;
    // a standing stroke is darker toward its root, where its neighbours stand close (uRoot)
    float root = 1. - uRoot*.6*(1. - smoothstep(0., .3, t));
    vec3 shadeL = (uShadeCol*(.7 + .6*hem) + amb*.22)*(1. - .3*cl)*uShadeK*uOpen*root;
    // in the shade the local colour is mixed toward blue violet, as a painter mixes a shadow: cool and darker
    vec3 inShade = mix(base, vec3(.2, .19, .5)*(dot(base, vec3(.3, .5, .2))*1.6 + .08), uVio);
    // in the shade the tracks still read: the ridges catch the sky, the hollows between them are deeper
    inShade *= mix(1., mix(.42, 1.5, smoothstep(.15, .9, .65*nc.r + .35*nf.r)), clamp(env, 0., 1.));
    // and each stroke's raised rims catch the sky: a lit ridge down both edges of a stroke that stands in shade
    float rimx = (abs(s) - .8)/.13;
    shadeL += uSkyCol*(.34*exp(-rimx*rimx)*step(uKind, .5));
    // the lit side is warm: the key's own gold, a little more of it on the loaded ridges
    col = mix(inShade*shadeL, base*(uKeyCol*(1. + .16*(nc.r - .5)*clamp(env, 0., 1.)) + amb*.34)*mix(1., root, .5), lit);
    // THE GLOSS: wet paint blazes toward the sun. The key's highlight on every ridge that faces half way between
    // light and eye, by the stroke's own tracks (fine) and by its own form (its rims and its face: the same from
    // every distance); it is weak looking with the light and strong looking into it (the law of a wet surface)
    vec3 Hk = normalize(L + V + vec3(0., 1e-4, 0.));
    float fres = .05 + .95*pow(1. - clamp(dot(V, Hk), 0., 1.), 5.);
    float sp = pow(clamp(dot(n, Hk), 0., 1.), uGlossP) + .4*pow(clamp(dot(N, Hk), 0., 1.), uGlossP*.6)*smoothstep(.45, .82, .6*nc.r + .4*nf.r);
    // (water keeps its colour: uSheenAt, the height of the stroke's own tracks above which a ridge may carry the
    // sheen; the hollows between, the greater share of every stroke, stay matt and blue however wet the paint)
    float ridge = smoothstep(uSheenAt, uSheenAt + .22, .6*nc.r + .4*nf.r);
    col += uKeyCol*min(sp*uGloss*(.3 + 6.*fres), 1.5)*sh*(1. - occl)*ridge;
    col += uSkyCol*(pow(1. - clamp(dot(n, V), 0., 1.), 4.)*.16*uGloss*ridge);
    // water glitters: sparks that come and go on the clock in the sun's broad path (uGlit: the brook's strokes)
    float g1 = texture2D(uNoise, vPos.xz*.21 + vec2(uTime*.023, -uTime*.011)).r, g2 = texture2D(uNoise, vPos.zx*.33 - vec2(uTime*.017, uTime*.008)).a;
    col += uKeyCol*(uGlit*pow(clamp(dot(N, Hk), 0., 1.), 10.)*smoothstep(.56, .8, g1)*smoothstep(.5, .78, g2)*(.4 + 8.*fres)*sh);
    // the drop's own white gold on the faces turned to it: a small near light, so every loaded ridge of the stroke
    // stands bright in it and every hollow between the bristle tracks dark
    col += dropLight(vPos, n, V, base*mix(1., mix(.22, 1.7, smoothstep(.2, .85, .65*nc.r + .35*nf.r)), clamp(env, 0., 1.)), blots.g*lowF, uGloss);
  }
  float fd = length(cameraPosition - vPos)*uFogDen;
  col = mix(col, uFogCol, 1. - exp(-fd*fd));
  gl_FragColor = vec4(col, alpha);
}`;

// ------------------------------------------------------------------ light, material, instanced strokes
// The uniforms every paint material of one scene shares (the light, the haze, the wind, the shadows, the drop's light).
// o: { rng (for the bristle texture), yield (awaited while that texture is made), sunDir, sunPos, key, sky, ground, shade, fog, fogDen, wet,
//      cloudK (how deep a cloud's shade is), shadeK (how dark the shade side stands), dropCol, dropI and dropF (the drop's light: colour,
//      strength at the drop, one over the square of the distance at which it is halved) }
export async function paintShared(o = {}) {
  const v3 = (a, d) => new THREE.Vector3().fromArray(a || d), blank = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1);
  blank.needsUpdate = true;
  const noise = await makeBristleTexture(o.rng || makeRng(hashSeed('field-in-thick-paint:bristles')), o.yield);
  const U = {
    uTime: { value: 0 }, uWind: { value: new THREE.Vector4(WIND.dir[0], WIND.dir[1], WIND.wave, WIND.speed) }, uWindK: { value: new THREE.Vector2(WIND.rest, WIND.flutter) },
    uSunDir: { value: v3(o.sunDir, [0.337, 0.174, -0.925]).normalize() }, uSunPos: { value: v3(o.sunPos, [800, 300, -2400]) },
    uKeyCol: { value: v3(o.key, [1.25, 1.02, 0.6]) }, uSkyCol: { value: v3(o.sky, [0.52, 0.67, 0.82]) }, uGroundCol: { value: v3(o.ground, [0.21, 0.35, 0.08]) },
    uShadeCol: { value: v3(o.shade, [0.27, 0.29, 0.56]) }, uFogCol: { value: v3(o.fog, [0.88, 0.83, 0.64]) }, uFogDen: { value: o.fogDen ?? 0.00045 },
    uNoise: { value: noise }, uShadow: { value: blank }, uShadowBox: { value: new THREE.Vector4(0, 0, 1, 1) }, uShadowY: { value: new THREE.Vector2(7, 20) },
    uCloud: { value: Array.from({ length: 11 }, () => new THREE.Vector4(0, 0, 0, 0)) }, uCloudK: { value: o.cloudK ?? 0.9 }, uShadeK: { value: o.shadeK ?? 0.82 },
    uDrop: { value: new THREE.Vector4(0, -9999, 0, 1) }, uDropCol: { value: v3(o.dropCol, [0, 0, 0]) }, uDropI: { value: o.dropI ?? 0 }, uDropF: { value: o.dropF ?? 1 },
  };
  return { U, wet: o.wet ?? 1, textures: [noise, blank], dispose() { for (const t of this.textures) t.dispose(); } };
}
// One paint material. o: { kind 0|1|2, detail (a 'low' ribbon is drawn from both sides), relief, rim (metres), dry
// (the share of the length where the tail begins to break up; 2 = never), gloss, glossP, rag, ends, self (1: the sky's own paint, lit from the boss; 2: the boss itself, which is the
// light: its relief reads by its thickness alone), emis, sway, twinkle (a self-lit glint's share of flicker), vio (how far its shade is
// mixed toward blue violet), trackScale (how many times coarser than a brush's tracks: a knife's are broad), root (a
// standing stroke: how much darker toward its root), glit (water: how strongly it glitters toward the sun), endRag and
// sideRag (a knife slab: the share of its length its dragged ends may lose, the share of its width its plain side may),
// sheenAt (water: the track height above which a ridge carries the sheen;
// -1, the default: the whole face may) }
export function paintMaterial(shared, o = {}) {
  const ts = o.trackScale ?? 1, relief = o.relief ?? 1;
  const m = new THREE.ShaderMaterial({
    uniforms: {
      ...shared.U,
      uKind: { value: o.kind ?? 0 }, uSway: { value: o.sway ?? 0 }, uSelf: { value: o.self ?? 0 }, uEmis: { value: o.emis ?? 1 },
      uRelief: { value: relief }, uRimH: { value: o.rim ?? 0.45 }, uDry: { value: o.dry ?? 0.7 }, uGloss: { value: (o.gloss ?? 0.8) * shared.wet },
      uGlossP: { value: (o.glossP ?? 42) / (shared.wet > 1 ? 1.6 : 1) }, uRag: { value: o.rag ?? 0 }, uEnds: { value: o.ends ?? 0 },
      uVio: { value: o.vio ?? 0.3 }, uOpen: { value: o.open ?? 1 }, uTwinkle: { value: o.twinkle ?? 0 },
      uTrack: { value: new THREE.Vector4(1 / 8, 1 / 60, 1 / 32, 1 / 200).divideScalar(ts) }, uTrackH: { value: new THREE.Vector2(0.1, 0.3).multiplyScalar(ts) },
      uRoot: { value: o.root ?? 0 }, uGlit: { value: o.glit ?? 0 }, uEndRag: { value: o.endRag ?? 0 }, uSideRag: { value: o.sideRag ?? 0 },
      uSheenAt: { value: o.sheenAt ?? -1 },
    },
    vertexShader: PAINT_VERT, fragmentShader: PAINT_FRAG,
    side: o.side ?? (o.detail === 'low' || o.detail === 'flat' || o.detail === 'far' ? THREE.DoubleSide : THREE.FrontSide), transparent: false, depthWrite: true,
  });
  return m;
}
// A stroke: { h: head, e: tail, b: bend, n: the way its face looks, w: width, th: thickness, ca, cb: two colours
// (linear), seed, wind: amplitude at the tail in metres, taper: share of the width left at the tail, cover }.
const ATTRS = ['iA', 'iB', 'iC', 'iD', 'iE', 'iF'];
export function makeStrokes(list, geometry, material, count = list.length) {
  const g = new THREE.InstancedBufferGeometry();
  g.index = geometry.index; g.setAttribute('position', geometry.getAttribute('position')); g.setAttribute('normal', geometry.getAttribute('normal'));
  const arr = ATTRS.map(() => new Float32Array(count * 4)), att = arr.map((a) => new THREE.InstancedBufferAttribute(a, 4));
  ATTRS.forEach((name, i) => g.setAttribute(name, att[i]));
  const mesh = new THREE.Mesh(g, material); mesh.frustumCulled = false;
  // write stroke i (also used each frame for the few sets the world clock moves: call commit() after)
  mesh.put = (i, s) => {
    const o = i * 4, [A, B, C, D, E, F] = arr, b = s.b || [0, 0, 0];
    A[o] = s.h[0]; A[o + 1] = s.h[1]; A[o + 2] = s.h[2]; A[o + 3] = s.w;
    B[o] = s.e[0]; B[o + 1] = s.e[1]; B[o + 2] = s.e[2]; B[o + 3] = s.th;
    C[o] = b[0]; C[o + 1] = b[1]; C[o + 2] = b[2]; C[o + 3] = s.seed ?? 0;
    D[o] = s.n[0]; D[o + 1] = s.n[1]; D[o + 2] = s.n[2]; D[o + 3] = s.wind ?? 0;
    E[o] = s.ca[0]; E[o + 1] = s.ca[1]; E[o + 2] = s.ca[2]; E[o + 3] = s.taper ?? 0.5;
    const cb = s.cb || s.ca; F[o] = cb[0]; F[o + 1] = cb[1]; F[o + 2] = cb[2]; F[o + 3] = s.cover ?? 1;
  };
  mesh.commit = () => { for (const a of att) a.needsUpdate = true; };
  for (let i = 0; i < list.length; i++) mesh.put(i, list[i]);
  g.instanceCount = list.length;
  return mesh;
}
// A point of a stroke at rest, at share t along it and s across it (-1..1), as the shader places its middle line.
export function strokePoint(s, t, out = [0, 0, 0]) {
  const b = s.b || [0, 0, 0], it = 1 - t;
  for (let i = 0; i < 3; i++) { const c = (s.h[i] + s.e[i]) / 2 + b[i]; out[i] = it * it * s.h[i] + 2 * t * it * c + t * t * s.e[i]; }
  return out;
}

// ------------------------------------------------------------------ the elm of forty strokes (a pure list; local metres)
// Origin at the foot on the knoll, y up. ELM names its measures: the trunk's five staves, six boughs, thirty crown
// strokes in four tiers laid like shingles (head in and high, tail out and low), widest ELM.reach from the axis
// between y 50 and 76, top at ELM.top (over the foot; the knoll adds its own height). Dealt from ELM_STREAM: the same tree on every seed.
// (crownLow: the height of the crown's low rim, where the lowest strokes' tails end; rimR: the shell's radius there)
export const ELM = { top: 115, reach: 40, shell: 36.5, trunkR: 3.3, rookRing: [50, 58], rookY: [72, 108], crownLow: 43, rimR: 28 };
// what is inside the crown: limbs [how many, how far out their tops stand, their tops' heights], the twigs' widths, the
// inner strokes' widths and their two tiers [how many, head height, head radius, tail height, tail radius]
const INNER = { limbs: 3, limbOut: [6, 12], limbTop: [84, 98], twig: [1.3, 2.2], wide: [11, 14], tiers: [[9, [70, 80], [3, 8], [47, 55], [23, 29]], [6, [92, 100], [3, 7], [72, 80], [17, 22]]] };
const GREENS = { lit: lin('#86B347'), olive: lin('#8FA63C'), mid: lin('#5E9A3F'), deep: lin('#2C6B3C'), blue: lin('#2F7A5A'), shade: lin('#173F33') };
const BROWN = [lin('#5A4868'), lin('#8A6644'), lin('#6C5262')];
// The list is made in steps (elmSteps: one after the trunk, the boughs, each crown stroke and each crown stroke's
// reach), so that a build may hand the page back between them; elmStrokes() walks them in one go, elmStrokesStepped()
// hands back between them. Both give the same list: a step draws nothing.
function* elmSteps() {
  const r = makeRng(hashSeed(ELM_STREAM)), list = [], TAU = Math.PI * 2;
  for (let i = 0; i < 5; i++) {
    const a = (i + r.range(-0.18, 0.18)) / 5 * TAU, c = Math.cos(a), s = Math.sin(a), len = r.range(40, 50), top = r.range(4.6, 6.6);
    list.push({ part: 'trunk', h: [c * ELM.trunkR, -1.5, s * ELM.trunkR], e: [c * top, len - 1.5, s * top], b: [c * r.range(-0.8, 1.2), 0, s * r.range(-0.8, 1.2)],
      n: [c, 0.04, s], w: r.range(5, 7), th: 2, ca: mix3(BROWN[0], BROWN[2], r()), cb: mix3(BROWN[1], BROWN[2], r() * 0.5), seed: r(), wind: 0, taper: 0.72 });
  }
  yield;
  for (let i = 0; i < 6; i++) {
    const a = (i + 0.5 + r.range(-0.22, 0.22)) / 6 * TAU, c = Math.cos(a), s = Math.sin(a), len = r.range(25, 35), y0 = r.range(34, 43), rise = r.range(0.5, 0.8);
    const out = len * Math.sqrt(1 - rise * rise), r0 = r.range(2.5, 4.5), flat = r.range(0.2, 0.9);
    list.push({ part: 'bough', h: [c * r0, y0, s * r0], e: [c * (r0 + out), y0 + len * rise, s * (r0 + out)], b: [c * r.range(-3, 0), r.range(1.5, 4), s * r.range(-3, 0)],
      n: [-s * (1 - flat) + c * 0.2, flat, c * (1 - flat) + s * 0.2], w: r.range(4.2, 6), th: 2, ca: mix3(BROWN[0], BROWN[2], r()), cb: mix3(BROWN[1], BROWN[0], r() * 0.6), seed: r(), wind: 0.25, taper: 0.5 });
  }
  // THE CROWN: thirty strokes laid on one shell like shingles, head high, tail low, each bowed out over the shell.
  // The shell's radius at height y: widest (ELM.shell) at y 62, drawn in to 0.78 of that at y 42 and closed at
  // ELM.top; it swells and sinks in three lobes round the tree so that the outline is no egg.
  const lobe = [r.range(0, TAU), r.range(0, TAU)];
  const shell = (y, a) => {
    const k = y < 62 ? 1 - 0.22 * ((62 - y) / 20) ** 2 : Math.pow(Math.max(0, 1 - Math.pow((y - 62) / (ELM.top - 62), 1.9)), 0.625);
    return ELM.shell * k * (0.9 + 0.1 * Math.sin(3 * a + lobe[0] + y * 0.03) * Math.sin(2 * a + lobe[1]));
  };
  // rings of the shell: [count, head y, tail y, how far inside the shell the stroke may lie]
  const rings = [[10, [70, 79], [43, 51], 4], [10, [84, 93], [57, 66], 5], [8, [104, 110], [82, 92], 3]];
  const lights = [GREENS.lit, GREENS.olive, GREENS.mid, GREENS.lit], darks = [GREENS.deep, GREENS.blue, GREENS.shade, GREENS.mid];
  const leafOf = (extra) => {
    const k = r(), ca = mix3(r.pick(lights), r.pick(lights), k), cb = mix3(r.pick(darks), r.pick(darks), r());
    return { part: 'crown', w: r.range(8.5, 12), th: r.range(2, 3), ca, cb, seed: r(), wind: r.range(0.9, 1.6), taper: r.range(0.55, 0.85), ...extra };
  };
  for (let ti = 0; ti < rings.length; ti++) {
    const [n, hy, ty, inside] = rings[ti], turn = r.range(0, TAU);
    for (let i = 0; i < n; i++) {
      // each slants across the shell, to one hand or the other by its own draw (no two alike in lean)
      const a = turn + (i + r.range(-0.32, 0.32)) / n * TAU, a2 = a + r.range(0.25, 0.75) * r.sign(), am = (a + a2) / 2, sink = r.range(0, inside) * (r.chance(0.3) ? 2.2 : 1);
      // in the two lower rings the stroke's middle stays under y 77 (twenty strokes with their greater part under y 78)
      const yh = r.range(hy[0], hy[1]), yt = Math.min(r.range(ty[0], ty[1]), ti < 2 ? 154 - yh : 999), ym = (yh + yt) / 2;
      const rh = shell(yh, a) - sink, rt = shell(yt, a2) - sink, rm = shell(ym, am) - sink + r.range(1, 3.5);
      const h = [Math.cos(a) * rh, yh, Math.sin(a) * rh], e = [Math.cos(a2) * rt, yt, Math.sin(a2) * rt], mid = [Math.cos(am) * rm, ym + r.range(-1, 2), Math.sin(am) * rm];
      // the face looks out along the shell's own normal at the stroke's middle
      const el = Math.atan2(shell(ym - 3, am) - shell(ym + 3, am), 6);
      list.push(leafOf({ tier: ti, h, e, b: [2 * (mid[0] - (h[0] + e[0]) / 2), 2 * (mid[1] - (h[1] + e[1]) / 2), 2 * (mid[2] - (h[2] + e[2]) / 2)], n: [Math.cos(am) * Math.cos(el), Math.sin(el), Math.sin(am) * Math.cos(el)] }));
      yield;
    }
  }
  // the cap: two strokes laid over the very top, crossing
  for (let i = 0; i < 2; i++) {
    const a = r.range(0, TAU) + i * 1.3, a2 = a + Math.PI + r.range(-0.4, 0.4), rh = r.range(8, 11), rt = r.range(12, 15), yh = r.range(107, 110), yt = r.range(102, 105);
    const h = [Math.cos(a) * rh, yh, Math.sin(a) * rh], e = [Math.cos(a2) * rt, yt, Math.sin(a2) * rt];
    list.push(leafOf({ tier: 3, h, e, b: [0, 2 * (ELM.top - 1.6 - i * 1.2 - (yh + yt) / 2), 0], n: [0, 1, 0] }));
  }
  // the crown's skin stays inside ELM.reach of the axis at the worst of the wind: drawn in as a whole if it would not
  // (the crown's reach is the greatest of its strokes' reaches, counted stroke by stroke)
  const crown = list.filter((s) => s.part === 'crown'); let rad = 0;
  for (const s of crown) { rad = Math.max(rad, reachOf([s]).rad); yield; }
  const over = rad / (ELM.reach - 0.4);
  if (over > 1) for (const s of crown) for (const v of [s.h, s.e, s.b]) { v[0] /= over; v[2] /= over; }
  // THE CROWN IS FULL AND JOINED (a second stream: the forty stand as they were dealt). INNER.limbs limbs carry the
  // trunk on up inside the crown; a twig runs from the nearest point of a bough or a limb to the head of every leaf
  // stroke (a head does not move in the wind, so the twig stays joined); and inner strokes of deep green close the
  // crown's middle in two tiers, laid like the under side of an umbrella: heads in and high, tails out and low,
  // faces down and out, all inside the shell.
  const q = makeRng(hashSeed(ELM_STREAM + ':inner crown')), wood = [], p = [0, 0, 0];
  for (let i = 0; i < INNER.limbs; i++) {
    const a = (i + q.range(-0.2, 0.2)) / INNER.limbs * TAU, c = Math.cos(a), sn = Math.sin(a), out = q.range(INNER.limbOut[0], INNER.limbOut[1]), top = q.range(INNER.limbTop[0], INNER.limbTop[1]);
    list.push({ part: 'limb', h: [c * 2, 40, sn * 2], e: [c * out, top, sn * out], b: [c * q.range(-4, -1), q.range(0, 3), sn * q.range(-4, -1)], n: [-sn, 0.1, c],
      w: q.range(3.2, 4.4), th: 1.8, ca: mix3(BROWN[0], BROWN[2], q()), cb: mix3(BROWN[1], BROWN[0], q() * 0.6), seed: q(), wind: 0.15, taper: 0.4 });
  }
  yield;
  for (const s of list) if (s.part === 'bough' || s.part === 'limb') wood.push(s);
  for (const leaf of crown) {
    let best = null, bd = 1e9;
    for (const w of wood) for (let k = 2; k <= 10; k++) { strokePoint(w, k / 10, p); const d = Math.hypot(p[0] - leaf.h[0], p[1] - leaf.h[1], p[2] - leaf.h[2]); if (d < bd) { bd = d; best = p.slice(); } }
    strokePoint(leaf, 0.05, p);
    const d = [p[0] - best[0], p[1] - best[1], p[2] - best[2]], hl = Math.hypot(d[0], d[2]) || 1;
    list.push({ part: 'twig', h: best, e: p.slice(), b: [0, q.range(0.5, 2.5), 0], n: [-d[2] / hl, 0.15, d[0] / hl], w: q.range(INNER.twig[0], INNER.twig[1]), th: 1,
      ca: mix3(BROWN[0], BROWN[2], q()), cb: mix3(BROWN[1], BROWN[0], q() * 0.5), seed: q(), wind: 0, taper: 0.45 });
    yield;
  }
  for (const [n, hy, hr, ty, tr] of INNER.tiers) {
    const turn = q.range(0, TAU);
    for (let i = 0; i < n; i++) {
      const a = turn + (i + q.range(-0.3, 0.3)) / n * TAU, a2 = a + q.range(-0.3, 0.3), c = Math.cos(a), sn = Math.sin(a), c2 = Math.cos(a2), s2 = Math.sin(a2);
      const rh = q.range(hr[0], hr[1]), rt = q.range(tr[0], tr[1]), yh = q.range(hy[0], hy[1]), yt = q.range(ty[0], ty[1]);
      list.push({ part: 'inner', h: [c * rh, yh, sn * rh], e: [c2 * rt, yt, s2 * rt], b: [0, q.range(3, 6), 0], n: [c * 0.5, -0.8, sn * 0.5], w: q.range(INNER.wide[0], INNER.wide[1]), th: q.range(1.6, 2.4),
        ca: mix3(GREENS.deep, GREENS.mid, q() * 0.6), cb: mix3(GREENS.shade, GREENS.blue, q()), seed: q(), wind: q.range(0.5, 0.9), taper: q.range(0.6, 0.85) });
      yield;
    }
  }
  return list;
}
export function elmStrokes() { const g = elmSteps(); let s = g.next(); while (!s.done) s = g.next(); return s.value; }
export async function elmStrokesStepped(yieldFn = null) {
  const g = elmSteps(); let s = g.next();
  while (!s.done) { if (yieldFn) await yieldFn(); s = g.next(); }
  return s.value;
}
// The skin of a brush stroke at rest, as the vertex shader places it: the four corners of its section at share t (the
// two edges across and the two faces), each [x, y, z]. The same profiles as PAINT_VERT (head rounded and loaded, tail
// narrowed and thin).
export function strokeSkin(s, t) {
  const b = s.b || [0, 0, 0], it = 1 - t, p = [0, 0, 0], d = [0, 0, 0];
  let len = 0, c1 = 0, c2 = 0, ch = 0;
  for (let i = 0; i < 3; i++) {
    const c = (s.h[i] + s.e[i]) / 2 + b[i]; p[i] = it * it * s.h[i] + 2 * t * it * c + t * t * s.e[i]; d[i] = 2 * it * (c - s.h[i]) + 2 * t * (s.e[i] - c);
    ch += (s.e[i] - s.h[i]) ** 2; c1 += (c - s.h[i]) ** 2; c2 += (s.e[i] - c) ** 2;
  }
  len = (2 * Math.sqrt(ch) + Math.sqrt(c1) + Math.sqrt(c2)) / 3;
  const dl = Math.hypot(d[0], d[1], d[2]) || 1, T = [d[0] / dl, d[1] / dl, d[2] / dl], n = s.n;
  let B = [n[1] * T[2] - n[2] * T[1], n[2] * T[0] - n[0] * T[2], n[0] * T[1] - n[1] * T[0]]; const bl = Math.hypot(B[0], B[1], B[2]) || 1; B = [B[0] / bl, B[1] / bl, B[2] / bl];
  const N = [T[1] * B[2] - T[2] * B[1], T[2] * B[0] - T[0] * B[2], T[0] * B[1] - T[1] * B[0]];
  const hl = clamp(0.5 * s.w / Math.max(len, 0.1), 0.02, 0.35), hd = clamp(t / hl, 0, 1), rnd = Math.sqrt(Math.max(hd * (2 - hd), 0)), lx = (t - hl * 1.2) / (hl * 1.1);
  const hw = s.w / 2 * rnd * lerp(1, s.taper ?? 0.5, smoothstep(0.45, 1, t)) * 1.085, ht = s.th / 2 * rnd * (1 + 0.95 * Math.exp(-lx * lx)) * lerp(1, 0.1, smoothstep(0.4, 1, t));
  const at = (kb, kn) => [p[0] + B[0] * kb + N[0] * kn, p[1] + B[1] * kb + N[1] * kn, p[2] + B[2] * kb + N[2] * kn];
  return [at(hw, 0), at(-hw, 0), at(0, ht), at(0, -ht * 0.6)];
}
// What a list of strokes reaches: the furthest from the y axis and the highest and lowest, counted on the skin at the
// worst of the wind
export function reachOf(list) {
  let rad = 0, top = -1e9, low = 1e9;
  for (const s of list) for (let i = 0; i <= 24; i++) {
    const t = i / 24, wr = windReach(s.wind || 0, t);
    for (const q of strokeSkin(s, t)) { rad = Math.max(rad, Math.hypot(q[0], q[2]) + wr); top = Math.max(top, q[1]); low = Math.min(low, q[1]); }
  }
  return { rad, top, low };
}

// ------------------------------------------------------------------ the may tree (a pure list; local metres)
// A thorn in full blossom, unlike the elm in every way: low and broad (MAY.top tall, MAY.reach from its axis), a
// leaning trunk of dark staves wound round one another, low elbowed boughs, and the crown HEAPED WHITE: thick short
// strokes of white laid like shingles on a low broad shell, each dragged into rose or lilac along its length (its
// shade side), loaded white dabs heaped over them, and a few strokes of leaf green showing through from under the
// heap. Round its foot a ring of fallen blossom (MAY.ring: from and to, metres from the trunk; MAY.fallen dabs).
// Origin at the foot, y up. Dealt from MAY_STREAM: the same tree on every seed.
export const MAY_STREAM = 'field-in-thick-paint:the may tree';
export const MAY = { top: 40, reach: 31, fork: 11, lean: 0.34, widest: 19, rings: [[11, [21, 26], [10, 15]], [10, [29, 33], [19, 24]], [7, [36, 38.5], [28, 32]]], dabs: 26, green: 7, ring: [15, 37], fallen: 110 };
const BLOSSOM = { white: lin('#FCF9EF'), cream: lin('#F6EDD2'), rose: lin('#F0BCCD'), lilac: lin('#C4B2E2'), bark: [lin('#3A2C46'), lin('#5C4438'), lin('#2E2438')] };
export function mayStrokes() {
  const r = makeRng(hashSeed(MAY_STREAM)), TAU = Math.PI * 2, wood = [], heap = [], dabs = [], green = [], fallen = [];
  const leanA = r.range(0, TAU), lx = Math.cos(leanA) * MAY.fork * MAY.lean, lz = Math.sin(leanA) * MAY.fork * MAY.lean, bark = () => mix3(r.pick(BLOSSOM.bark), r.pick(BLOSSOM.bark), r());
  // the trunk: four staves that lean one way and wind round one another from the foot to the fork
  for (let i = 0; i < 4; i++) {
    const a = (i + r.range(-0.2, 0.2)) / 4 * TAU, a2 = a + r.range(1.2, 2.2), c = Math.cos(a), sn = Math.sin(a), bow = r.range(1.5, 3);
    wood.push({ part: 'trunk', h: [c * 2.2, -1.2, sn * 2.2], e: [lx + Math.cos(a2) * 2.6, MAY.fork + r.range(0, 3), lz + Math.sin(a2) * 2.6], b: [Math.cos(a + 1.2) * bow, 0, Math.sin(a + 1.2) * bow],
      n: [c, 0.05, sn], w: r.range(3.6, 5), th: 1.8, ca: bark(), cb: bark(), seed: r(), wind: 0, taper: 0.7 });
  }
  // the boughs: six, low and wide, each bent like an elbow
  for (let i = 0; i < 6; i++) {
    const a = (i + r.range(-0.25, 0.25)) / 6 * TAU, c = Math.cos(a), sn = Math.sin(a), out = r.range(15, 23), top = r.range(17, 26), in0 = r.range(-4, -1);
    wood.push({ part: 'bough', h: [lx + c * 1.5, MAY.fork - 1.5, lz + sn * 1.5], e: [lx + c * out, top, lz + sn * out], b: [c * in0, r.range(2, 5), sn * in0], n: [-sn * 0.6, 0.7, c * 0.6],
      w: r.range(2.6, 3.8), th: 1.5, ca: bark(), cb: bark(), seed: r(), wind: 0.2, taper: 0.45 });
  }
  // the shell the blossom is heaped on: widest at MAY.widest, drawn in under it, closed at the top; three lobes round it
  const lobe = r.range(0, TAU);
  const shell = (y, a) => {
    const k = y < MAY.widest ? 1 - 0.3 * ((MAY.widest - y) / 10) ** 2 : Math.sqrt(Math.max(0, 1 - ((y - MAY.widest) / (MAY.top - MAY.widest)) ** 2));
    return (MAY.reach - 3) * Math.max(0.06, k) * (0.9 + 0.1 * Math.sin(3 * a + lobe));
  };
  const face = (y, a) => { const el = Math.atan2(shell(y - 2, a) - shell(y + 2, a), 4); return [Math.cos(a) * Math.cos(el), Math.sin(el), Math.sin(a) * Math.cos(el)]; };
  for (const [n, hy, ty] of MAY.rings) {
    const turn = r.range(0, TAU);
    for (let i = 0; i < n; i++) {
      const a = turn + (i + r.range(-0.3, 0.3)) / n * TAU, a2 = a + r.range(0.2, 0.6) * r.sign(), am = (a + a2) / 2, yh = r.range(hy[0], hy[1]), yt = r.range(ty[0], ty[1]), ym = (yh + yt) / 2;
      const rh = shell(yh, a), rt = shell(yt, a2), rm = shell(ym, am) + r.range(1, 3), h = [lx * 0.5 + Math.cos(a) * rh, yh, lz * 0.5 + Math.sin(a) * rh], e = [lx * 0.5 + Math.cos(a2) * rt, yt, lz * 0.5 + Math.sin(a2) * rt];
      const mid = [lx * 0.5 + Math.cos(am) * rm, ym + r.range(0, 2), lz * 0.5 + Math.sin(am) * rm], k = r();
      heap.push({ part: 'heap', h, e, b: [2 * (mid[0] - (h[0] + e[0]) / 2), 2 * (mid[1] - (h[1] + e[1]) / 2), 2 * (mid[2] - (h[2] + e[2]) / 2)], n: face(ym, am), w: r.range(7.5, 10.5), th: r.range(2.6, 3.6),
        ca: mix3(BLOSSOM.white, BLOSSOM.cream, k * 0.6), cb: mix3(r.chance(0.55) ? BLOSSOM.rose : BLOSSOM.lilac, BLOSSOM.white, r.range(0.1, 0.45)), seed: r(), wind: r.range(0.5, 0.9), taper: r.range(0.6, 0.9) });
    }
  }
  // loaded dabs heaped over the strokes, each on the shell, a little proud of it
  for (let i = 0; i < MAY.dabs; i++) {
    const a = r.range(0, TAU), y = r.range(14, MAY.top - 3), rad = shell(y, a) + r.range(0.5, 2.5), R = r.range(3.2, 5.4), n = face(y, a), c = [lx * 0.5 + Math.cos(a) * rad, y, lz * 0.5 + Math.sin(a) * rad], t = r.range(0, TAU);
    // its long way lies in its own face: across the shell, turned by its own draw
    const ax = [-Math.sin(a), 0, Math.cos(a)], up = [n[1] * ax[2] - n[2] * ax[1], n[2] * ax[0] - n[0] * ax[2], n[0] * ax[1] - n[1] * ax[0]], d = [0, 1, 2].map((q) => (ax[q] * Math.cos(t) + up[q] * Math.sin(t)) * R);
    dabs.push({ part: 'dab', h: [c[0] - d[0], c[1] - d[1], c[2] - d[2]], e: [c[0] + d[0], c[1] + d[1], c[2] + d[2]], b: [0, 0, 0], n, w: 2 * R, th: R * 1.3, ca: mul3(BLOSSOM.white, r.range(0.97, 1.03)), cb: mix3(BLOSSOM.white, r.chance(0.5) ? BLOSSOM.rose : BLOSSOM.cream, r.range(0.2, 0.6)), seed: r(), wind: 0.3, taper: 1 });
  }
  // a few strokes of leaf green under the heap, showing between the white
  for (let i = 0; i < MAY.green; i++) {
    const a = (i + r.range(-0.3, 0.3)) / MAY.green * TAU, a2 = a + r.range(-0.4, 0.4), yh = r.range(22, 30), yt = r.range(9, 14), rh = shell(yh, a) * 0.7, rt = shell(yt, a2) * 1.02;
    green.push({ part: 'green', h: [lx * 0.5 + Math.cos(a) * rh, yh, lz * 0.5 + Math.sin(a) * rh], e: [lx * 0.5 + Math.cos(a2) * rt, yt, lz * 0.5 + Math.sin(a2) * rt], b: [0, r.range(2, 5), 0], n: [Math.cos(a) * 0.8, -0.3, Math.sin(a) * 0.8], w: r.range(6, 8.5), th: 2,
      ca: mix3(GREENS.lit, GREENS.olive, r()), cb: mix3(GREENS.deep, GREENS.blue, r()), seed: r(), wind: r.range(0.5, 0.9), taper: r.range(0.5, 0.75) });
  }
  // the fallen blossom: small white dabs lying in a ring under the crown's edge (their heights are the ground's: the world lays them)
  for (let i = 0; i < MAY.fallen; i++) {
    const a = r.range(0, TAU), d = lerp(MAY.ring[0], MAY.ring[1], Math.sqrt(r())), R = r.range(0.9, 1.8), t = r.range(0, TAU);
    fallen.push({ part: 'fallen', h: [Math.cos(a) * d - Math.cos(t) * R, 0, Math.sin(a) * d - Math.sin(t) * R], e: [Math.cos(a) * d + Math.cos(t) * R, 0, Math.sin(a) * d + Math.sin(t) * R], b: [0, 0, 0], n: [r.range(-0.15, 0.15), 1, r.range(-0.15, 0.15)],
      w: 2 * R, th: R * 0.7, ca: mul3(BLOSSOM.white, r.range(0.95, 1.03)), cb: mix3(BLOSSOM.white, BLOSSOM.rose, r.range(0, 0.5)), seed: r(), wind: 0, taper: 1 });
  }
  // the crown's skin stays inside MAY.reach of the axis at the worst of the wind: drawn in as a whole if it would not
  const over = Math.max(reachOf(heap).rad, reachOf(green).rad) / (MAY.reach - 0.4);
  if (over > 1) for (const st of [...heap, ...dabs, ...green]) for (const v of [st.h, st.e, st.b]) { v[0] /= over; v[2] /= over; }
  return { wood, heap, dabs, green, fallen, blossom: BLOSSOM };
}

// ------------------------------------------------------------------ cast shadows: paint on the faces that lie low
// A blot is the shadow one stroke lays: from (x0, z0) to (x1, z1), w0 and w1 metres wide there, d0 and d1 dark (0..1).
// blotsOf(list, sun, k): a standing stroke lays its blot from its foot away from the sun, k times its height long,
// thinning to nothing (a third of the stroke's width at its foot, so that light stands in bars between the blots of a
// row of strokes); a stroke held aloft (the elm's) lays a round blot k times its height away from under it.
// A stroke marked broad (the row that walls the lane: it stands at the floor's own edge) lays its whole shade, a band
// nearly as wide as itself that thins and pales but does not end in nothing.
// sun: the unit direction TOWARD the sun in x and z; ox, oy, oz: where the list's origin stands in the world.
export function blotsOf(list, sun, k, ox = 0, oy = 0, oz = 0) {
  const out = [], p = [0, 0, 0];
  for (const s of list) {
    const up = s.e[1] - s.h[1], foot = s.h[1] + oy;
    if (s.aloft || foot > 12) {
      strokePoint(s, 0.5, p); const y = p[1] + oy, half = Math.hypot(s.e[0] - s.h[0], s.e[2] - s.h[2]) / 2 + s.w * 0.5;
      const cx = p[0] + ox - sun[0] * y * k, cz = p[2] + oz - sun[1] * y * k;
      out.push({ x0: cx + sun[0] * half, z0: cz + sun[1] * half, x1: cx - sun[0] * half * (1 + 0.4 * k), z1: cz - sun[1] * half * (1 + 0.4 * k), w0: s.w * 0.9, w1: s.w * 1.1, d0: 0.62, d1: 0.5, round: true });
    } else if (up > 2) {
      const x = s.h[0] + ox, z = s.h[2] + oz, len = up * k;
      out.push(s.broad ? { x0: x, z0: z, x1: x - sun[0] * len, z1: z - sun[1] * len, w0: s.w * 0.85, w1: s.w * 0.45, d0: 0.66, d1: 0.2 } : { x0: x, z0: z, x1: x - sun[0] * len, z1: z - sun[1] * len, w0: s.w * 0.3, w1: s.w * 0.08, d0: 0.75, d1: 0 });
    }
  }
  return out;
}
// The blots drawn into one texture laid over the box [x0, z0, width, depth] of the world, size texels square.
// Returns { texture, box: Vector4 for uShadowBox }. yieldFn: awaited every ten blots.
export async function makeShadowTexture(blots, box, size = 1024, yieldFn = null) {
  const cv = document.createElement('canvas'); cv.width = cv.height = size;
  const g = cv.getContext('2d'), kx = size / box[2], kz = size / box[3];
  g.fillStyle = '#000'; g.fillRect(0, 0, size, size);
  // a shadow is laid once: where blots cross, the darker one stands (they do not add up)
  g.globalCompositeOperation = 'lighten';
  let i = 0;
  for (const b of blots) {
    const ax = (b.x0 - box[0]) * kx, az = (b.z0 - box[1]) * kz, bx = (b.x1 - box[0]) * kx, bz = (b.z1 - box[1]) * kz;
    const dx = bx - ax, dz = bz - az, l = Math.hypot(dx, dz) || 1, nx = -dz / l, nz = dx / l, h0 = b.w0 / 2 * kx, h1 = b.w1 / 2 * kx;
    const gr = g.createLinearGradient(ax, az, bx, bz);
    const v0 = Math.round(255 * b.d0), v1 = Math.round(255 * b.d1);
    // the key's blots are laid in the texture's red, the blots thrown from the drop's light (b.drop) in its green
    gr.addColorStop(0, b.drop ? `rgb(0,${v0},0)` : `rgb(${v0},0,0)`); gr.addColorStop(1, b.drop ? `rgb(0,${v1},0)` : `rgb(${v1},0,0)`);
    g.fillStyle = gr; g.beginPath();
    if (b.round) g.ellipse((ax + bx) / 2, (az + bz) / 2, l / 2, (h0 + h1) / 2, Math.atan2(dz, dx), 0, Math.PI * 2);
    else { g.moveTo(ax + nx * h0, az + nz * h0); g.lineTo(bx + nx * h1, bz + nz * h1); g.lineTo(bx - nx * h1, bz - nz * h1); g.lineTo(ax - nx * h0, az - nz * h0); g.closePath(); }
    g.fill();
    if (yieldFn && ++i % 10 === 0) await yieldFn();
  }
  const texture = new THREE.CanvasTexture(cv);
  texture.flipY = false; texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping; texture.minFilter = THREE.LinearFilter; texture.magFilter = THREE.LinearFilter; texture.generateMipmaps = false;
  return { texture, box: new THREE.Vector4(box[0], box[1], 1 / box[2], 1 / box[3]) };
}

// ------------------------------------------------------------------ rooks: ticks of two dark strokes, on the world clock
// Each wheels on a level ring of its own about the elm's axis (ELM.rookRing metres out, ELM.rookY up), rising and
// sinking ROOK.bob metres; the tick opens and closes as a wing beat. rookAt gives the two strokes of rook k at a clock.
export const ROOK = { wing: 4, wide: 2.5, bob: 2, colour: lin('#2B2540'), colour2: lin('#3D3358') };
export function dealRooks(rng, count) {
  const out = [];
  for (let i = 0; i < count; i++) out.push({ ring: rng.range(ELM.rookRing[0], ELM.rookRing[1]), y: rng.range(ELM.rookY[0] + ROOK.bob, ELM.rookY[1] - ROOK.bob), speed: rng.range(9, 13) * (rng.chance(0.75) ? 1 : -1),
    phase: rng.range(0, Math.PI * 2), beat: rng.range(2.1, 2.9), beatPhase: rng.range(0, 6.28), bobRate: rng.range(0.15, 0.3), bobPhase: rng.range(0, 6.28), seed: rng() });
  return out;
}
export function rookAt(k, time, out) {
  const a = k.phase + time * k.speed / k.ring, c = Math.cos(a), s = Math.sin(a), dir = Math.sign(k.speed);
  const x = c * k.ring, z = s * k.ring, y = k.y + ROOK.bob * Math.sin(time * k.bobRate + k.bobPhase);
  // the wings lie along the ring's radius, out and in, raised by the beat from 8 to 50 degrees
  const lift = (29 + 21 * Math.sin(time * k.beat * 6.2832 + k.beatPhase)) * Math.PI / 180, reach = ROOK.wing * Math.cos(lift), rise = ROOK.wing * Math.sin(lift);
  for (let w = 0; w < 2; w++) {
    const sg = w ? -1 : 1, o = out[w];
    o.h[0] = x; o.h[1] = y; o.h[2] = z; o.e[0] = x + sg * c * reach; o.e[1] = y + rise; o.e[2] = z + sg * s * reach;
    o.b[0] = -s * dir * 0.5; o.b[1] = 0.5; o.b[2] = c * dir * 0.5; o.n[0] = 0; o.n[1] = 1; o.n[2] = 0;
  }
  return out;
}

// ------------------------------------------------------------------ the meadow's touches (the world deals them; the hero alone stands on a disc of them)
export const MEADOW_GREENS = [lin('#86B347'), lin('#6FA543'), lin('#5E9A3F'), lin('#A3BC52'), lin('#3F8048')];
const FLOWERS = [[lin('#F2C230'), lin('#F0A81C')], [lin('#E58FA8'), lin('#EFB4C4')]];
// one lying stroke of the ground at (x, z) on ground height y: 20 to 40 m long, 5 to 9 m wide, along the picture's level
// (within turn radians of the x axis), a little bowed, lifted over the stroke under it by its own draw
export function lyingStroke(rng, x, z, y, o = {}) {
  const len = rng.range(o.len?.[0] ?? 20, o.len?.[1] ?? 40), a = rng.range(-1, 1) * (o.turn ?? 0.22) + (rng.chance(0.5) ? Math.PI : 0), c = Math.cos(a), s = Math.sin(a);
  const th = rng.range(0.9, 1.5), lift = rng.range(0.15, 0.9), bow = rng.range(-2.2, 2.2), g = rng.int(0, MEADOW_GREENS.length - 1), g2 = rng.int(0, MEADOW_GREENS.length - 1);
  const ca = mul3(MEADOW_GREENS[g], rng.range(0.85, 1.08)), cb = mix3(MEADOW_GREENS[g2], rng.chance(0.4) ? GREENS.deep : GREENS.olive, rng.range(0.2, 0.7));
  return { h: [x - c * len / 2, y + lift, z - s * len / 2], e: [x + c * len / 2, y + lift, z + s * len / 2], b: [-s * bow, o.rise ?? 0, c * bow], n: [0, 1, 0],
    w: rng.range(o.w?.[0] ?? 5, o.w?.[1] ?? 9), th, ca, cb, seed: rng(), wind: 0, taper: rng.range(0.35, 0.7) };
}
// one flower: a stalk stroke 5 to 9 m tall and its head, a dab 2 to 3.5 m across that rides the stalk's tip
export function flowerAt(rng, x, z, y, o = {}) {
  const tall = rng.range(o.tall?.[0] ?? 5, o.tall?.[1] ?? 9), la = rng.range(0, 6.2832), lean = rng.range(0, 0.16) * tall, lx = Math.cos(la) * lean, lz = Math.sin(la) * lean;
  const seed = rng(), wind = rng.range(0.6, 1.2), R = o.R ?? rng.range(1, 1.75) * (o.size ?? 1), fa = rng.range(0, 6.2832), fc = Math.cos(fa), fs = Math.sin(fa), tilt = rng.range(0.5, 1.25);
  const kind = o.colour || FLOWERS[rng.chance(o.pink ?? 0.4) ? 1 : 0], tip = [x + lx, y + tall, z + lz], k = rng.range(0.85, 1.1);
  const stalk = { h: [x, y - 0.3, z], e: tip, b: [lx * 0.3 + rng.range(-0.4, 0.4), 0, lz * 0.3 + rng.range(-0.4, 0.4)], n: [Math.cos(la + 1.2), 0, Math.sin(la + 1.2)], w: 2.5, th: 0.6,
    ca: mul3(mix3(GREENS.lit, GREENS.mid, rng()), rng.range(0.9, 1.15)), cb: GREENS.olive, seed, wind, taper: 0.2 };
  const ta = rng.range(0, 6.2832), tx = Math.cos(ta) * Math.sin(tilt), tz = Math.sin(ta) * Math.sin(tilt), up = Math.cos(tilt);
  // the dab's own length runs level across its face
  let dx = fc, dz = fs; const dy = -(dx * tx + dz * tz) / up, dl = Math.hypot(dx, dy, dz); dx /= dl; dz /= dl;
  const h = [tip[0] - dx * R, tip[1] - dy / dl * R + 0.2, tip[2] - dz * R];
  const dab = { h, e: [tip[0] + dx * R, tip[1] + dy / dl * R + 0.2, tip[2] + dz * R], b: [x - h[0], 0, z - h[2]], n: [tx, up, tz], w: 2 * R, th: R * 1.5, ca: mul3(kind[0], k), cb: mul3(kind[1], k), seed, wind, taper: 1 };
  return { stalk, dab, tall, R };
}

// ------------------------------------------------------------------ the hero: the elm, its rooks; alone, its disc of meadow
// opts: { shared: the world's paintShared (the hero alone makes its own light and its own disc of meadow),
//         rooks: how many (7 to 16; the world gives it by the visit's density), rookRng: the stream they are dealt from }
export async function buildHero(ctx, opts = {}) {
  const alone = !opts.shared, shared = opts.shared || await paintShared({ sunDir: [-0.55, 0.26, 0.79], key: [1.3, 1.08, 0.66], yield: ctx.yield });
  const object = new THREE.Group(), list = await elmStrokesStepped(ctx.yield);
  await ctx.yield();
  const geo = strokeGeometry('hero');
  await ctx.yield();
  const bark = paintMaterial(shared, { relief: 1.15, rim: 0.5, dry: 0.8, gloss: 0.7 });
  const leaf = paintMaterial(shared, { relief: 1.25, rim: 0.6, dry: 0.66, gloss: 1 });
  const wood = makeStrokes(list.filter((s) => s.part === 'trunk' || s.part === 'bough' || s.part === 'limb'), geo, bark);
  await ctx.yield();
  const crown = makeStrokes(list.filter((s) => s.part === 'crown'), geo, leaf);
  wood.name = 'elm trunk and boughs'; crown.name = 'elm crown'; object.add(wood, crown);
  await ctx.yield();
  // the twigs and the crown's inner strokes: the same two paints on plainer forms (they are seen between the others)
  const twigs = makeStrokes(list.filter((s) => s.part === 'twig'), strokeGeometry('round'), bark);
  await ctx.yield();
  const inner = makeStrokes(list.filter((s) => s.part === 'inner'), strokeGeometry('high'), leaf);
  twigs.name = 'elm twigs'; inner.name = 'elm inner crown'; object.add(twigs, inner);
  await ctx.yield();
  // the rooks: two strokes each, written every frame from the world clock
  const density = (ctx.vary && ctx.vary.density) ?? 1, nRook = opts.rooks ?? clamp(Math.round(lerp(7, 16, (density - 0.7) / 0.6)), 7, 16);
  const rooks = dealRooks(opts.rookRng || makeRng(hashSeed('field-in-thick-paint:rooks:' + ctx.seed)), nRook);
  const wing = () => ({ h: [0, 0, 0], e: [0, 0, 0], b: [0, 0, 0], n: [0, 1, 0], w: ROOK.wide, th: 0.7, ca: ROOK.colour, cb: ROOK.colour2, seed: 0, wind: 0, taper: 0.22 });
  const pair = [wing(), wing()], rookMat = paintMaterial(shared, { relief: 0.6, rim: 0.2, dry: 2, gloss: 0.5 });
  const rookMesh = makeStrokes([], strokeGeometry('mid'), rookMat, nRook * 2); rookMesh.name = 'rooks';
  const flyRooks = (time) => {
    for (let i = 0; i < nRook; i++) { rookAt(rooks[i], time, pair); pair[0].seed = pair[1].seed = rooks[i].seed; rookMesh.put(i * 2, pair[0]); rookMesh.put(i * 2 + 1, pair[1]); }
    rookMesh.commit();
  };
  rookMesh.geometry.instanceCount = nRook * 2; flyRooks(0); object.add(rookMesh);
  await ctx.yield();
  let extra = null;
  if (alone) {
    // the disc of meadow the elm stands on when it is seen alone: canvas, lying strokes in level bands, flowers, its blots
    const r = makeRng(hashSeed(ELM_STREAM + ':disc')), lying = [], stalks = [], heads = [];
    for (let i = 0; i < 150; i++) {
      const a = r.range(0, 6.2832), d = 70 * Math.sqrt(r()), x = Math.cos(a) * d, z = Math.sin(a) * d;
      lying.push(lyingStroke(r, x, z, -1.2 + 1.2 * Math.exp(-d * d / 900), { len: [18, 34] }));
    }
    for (let i = 0; i < 60; i++) {
      const a = r.range(0, 6.2832), d = r.range(14, 66), f = flowerAt(r, Math.cos(a) * d, Math.sin(a) * d, -0.6);
      stalks.push(f.stalk); heads.push(f.dab);
    }
    const canvas = [{ h: [-78, -1.6, 0], e: [78, -1.6, 0], n: [0, 1, 0], w: 156, th: 1.2, ca: lin('#E7DCC3'), cb: lin('#DCCFB2'), seed: 0.3, taper: 1 }];
    const ground = makeStrokes(canvas, dabGeometry('high'), paintMaterial(shared, { kind: 1, relief: 0.4, dry: 2, gloss: 0.2 }));
    const strokes = makeStrokes(lying, strokeGeometry('mid'), paintMaterial(shared, { relief: 1, rim: 0.4, dry: 0.68, gloss: 0.9 }));
    const stalkMesh = makeStrokes(stalks, strokeGeometry('mid'), paintMaterial(shared, { relief: 0.8, rim: 0.3, dry: 0.75, gloss: 0.7 }));
    const headMesh = makeStrokes(heads, dabGeometry('mid'), paintMaterial(shared, { kind: 1, relief: 0.8, dry: 2, gloss: 1 }));
    object.add(ground, strokes, stalkMesh, headMesh);
    await ctx.yield();
    const sd = shared.U.uSunDir.value, sl = Math.hypot(sd.x, sd.z), sun = [sd.x / sl, sd.z / sl];
    const sh = await makeShadowTexture([...blotsOf(list.filter((s) => s.part !== 'twig').map((s) => ({ ...s, aloft: s.part === 'crown' || s.part === 'inner' })), sun, 1.1), ...blotsOf(stalks, sun, 2.6)], [-170, -170, 340, 340], 512, ctx.yield);
    shared.U.uShadow.value = sh.texture; shared.U.uShadowBox.value.copy(sh.box);
    extra = sh.texture;
  }
  return {
    object, radius: 48, height: ELM.top, center: new THREE.Vector3(0, 58, 0), strokes: list, rooks, shared,
    anchors: { foot: new THREE.Vector3(0, 0, 0), crown: new THREE.Vector3(0, 67, 0) },
    update(dt, time) { if (alone) shared.U.uTime.value = time; flyRooks(time); },
    dispose() { if (alone) { shared.dispose(); if (extra) extra.dispose(); } },
    ground: false, groundY: -1.6,
  };
}
