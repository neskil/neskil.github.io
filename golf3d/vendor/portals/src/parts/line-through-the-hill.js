// The Line Goes Through the Hill: hero set piece, after Martin Ramirez (1895 to 1963).
// THE VIADUCT MOUNTAIN AND ITS INSIDE. Pencil and wax crayon on pasted scrap paper, built as geometry and unlit
// ShaderMaterials (post.flat = 1: a hex written is the hex shown; no tone-map inverse anywhere in this file).
//
// SIZE AND SEATING. 700 m wide (x), 560 m deep (z), 300 m high; origin at the base centre. Per the hero contract the
// front (the valley face with nine mouths) looks toward +Z. The world flies +Z INTO that face, so seat it with
//   hero.object.rotation.y = Math.PI; hero.object.position.set(xOff, 0, zCentre);
// All anchors are given in the object's own local space (apply object.matrixWorld). `hero.course` is the inner group in
// "course" coordinates (course +Z = direction of flight, front face at z -280, hall z -160..120, back face z 280).
//
// EXPORTS (shade the whole world with these so the hero is not pasted in):
//   LH_PALETTE            the brief's seven pigments (tan, old tan, graphite, black, mauve, orange, ochre).
//   makeLhUniforms(hexes) one uniform set per build: uTime (endless rub runs), uOld, uCross, the seven colours. buildHero
//                         makes its own and returns it as hero.uniforms; pass it to every factory below as o.un.
//   lhUniforms            only the default set for a material made without o.un (nothing in a built world uses it).
//   STYLE_GLSL            fragment chunk: lhTooth (paper tooth), lhSheet (pasted sheets and seams), lhEcho (the mark:
//                         0.3 m pencil line every 2.5 / 5 / 10 m of n, rubbed on one side, LOD by fwidth, flat mean
//                         tone when finer than 4 px), lhMouthN (distance to a D arch in space), lhWax (crayon with
//                         graphite edges, rubbed side, paper flecks).
//   LH_VERT               the one vertex shader all materials use (vP = mesh-local position, instancing aware).
//   paperMaterial(o)      echo-line paper. o.mouths = [{p:[x,y,z] sill centre, n:[nx,nz] facing, r, leg}] (max 12)
//                         computes n per fragment (crisp creases); without mouths it reads attribute aN (metres from
//                         the mound's mouth arch) per vertex. material.userData.shiver(i, radiusMetres) drives the
//                         ripple of mouth i (negative = off). o.side, o.sheet (sheet size m), o.inside (hall walls).
//                         o.seed: true reads a seed arch per vertex (attributes aSC = sill centre, aSA = nx, nz, r, leg, the
//                         same at every vertex of a mound) and computes n per fragment from it: round arcs on a coarse mesh.
//   waxMaterial(o)        crayon ribs: attributes uv (x metres along, y 0..1 across), aWax (0 mauve, 1 orange, 2 bare
//                         paper, 3 ochre, 4 black) and, on InstancedMesh, aWaxI added to it.
//   arcadeMaterial()      tan and graphite round-arch viaduct cells, each arch nested three lines deep.
//   trackMaterial()       rails: two ruled lines and a sleeper every metre, on tan (uv.y>=0) or on black (aWax 4).
//   trainMaterial()       striped cars, ruled engine, coin wheels with eight spokes turned in the shader.
//   smokeMaterial()       scalloped puffs: camera-facing instanced quads (PlaneGeometry(2,2); matrix = place and size).
//   blackMaterial()       pencil pressed to black: mouth caps, tunnel and hall ground. Flat, never a gradient.
//   buildHero(ctx, opts)  the piece. (anchors, opts, cost: see the block above buildHero.)
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { clamp, lerp, smoothstep } from '../kit/core.js';

export const LH_PALETTE = ['#D8C39B', '#B9A57C', '#3B3937', '#1F1D1C', '#8C5C8E', '#CF6A32', '#DCAA3C'];
const UN = ['uTan', 'uTan2', 'uGraph', 'uBlack', 'uMauve', 'uOrange', 'uOchre'];
// One uniform set PER BUILD (uTime, uOld 0..1 the stock's age, uCross 0..1 the hall's ribs turning colour, the seven
// pigments): buildHero makes its own and returns it as hero.uniforms; pass it to every factory as o.un. lhUniforms is
// only the default for a material made with no set (nothing in a built world uses it).
export function makeLhUniforms(hexes) {
  const u = { uTime: { value: 0 }, uOld: { value: 0 }, uCross: { value: 0 } };
  UN.forEach((k, i) => { u[k] = { value: new THREE.Color((hexes && hexes[i]) || LH_PALETTE[i]) }; });
  return u;
}
export const lhUniforms = makeLhUniforms();
export function setLhPalette(hexes) { UN.forEach((k, i) => { if (hexes && hexes[i]) lhUniforms[k].value.set(hexes[i]); }); }

export const LH_VERT = /* glsl */`
attribute float aN; attribute float aWax;
uniform float uTime;
#ifdef LH_INST
attribute float aWaxI; attribute vec4 aTrain;
varying vec4 vTrain;
#endif
varying vec3 vP; varying vec2 vUv; varying float vN; varying float vWax;
#ifdef LH_SEED
attribute vec3 aSC; attribute vec4 aSA; varying vec3 vSC; varying vec4 vSA;   // a mound's own seed arch, the same at every vertex of the mound
#endif
void main(){
  vec4 p = vec4(position, 1.0);
  vWax = aWax;
#ifdef LH_SEED
  vSC = aSC; vSA = aSA;
#endif
#ifdef LH_RIB
  // the shiver inside a tunnel: every few seconds one ripple runs down the ribs, each drawn in a hand's breadth as it passes
  // (inward, so no rib is pushed through the pressed black behind it)
  float lhPh = fract((instanceMatrix[3].z + instanceMatrix[3].x * 0.3 - uTime * 40.0) / 240.0) - 0.5;
  p.xy *= 1.0 - 0.035 * exp(-lhPh * lhPh * 700.0);
#endif
#ifdef LH_INST
  p = instanceMatrix * p; vWax += aWaxI; vTrain = aTrain;
#endif
  vP = p.xyz; vUv = uv; vN = aN;
  gl_Position = projectionMatrix * modelViewMatrix * p;
}`;

export const STYLE_GLSL = /* glsl */`
uniform float uTime; uniform float uOld;
uniform vec3 uTan, uTan2, uGraph, uBlack, uMauve, uOrange, uOchre;
float lhHash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float lhNoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(lhHash(i), lhHash(i+vec2(1,0)), f.x), mix(lhHash(i+vec2(0,1)), lhHash(i+vec2(1,1)), f.x), f.y); }
// a surface-fixed 2D coordinate for any mesh-local point (skewed so no wall is degenerate)
vec2 lhSuv(vec3 p){ return vec2(p.x + p.z * 0.73, p.y * 0.94 + p.z * 0.41 - p.x * 0.11); }
// paper tooth 0..1, filtered to its mean (0.5) when finer than about 3 px
float lhTooth(vec2 suv, float fw){
  float t = lhNoise(suv * 9.0) * 0.6 + lhNoise(suv * 23.0 + 7.1) * 0.4;
  return mix(t, 0.5, smoothstep(0.03, 0.11, fw)); }
// pasted sheets: returns xyz = paper colour, w = this sheet's line offset in metres (lines miss across a seam)
vec4 lhSheet(vec2 suv, float size, float fw){
  vec2 q = suv / size; q += 0.18 * vec2(lhNoise(q.yy * 0.7 + 3.0), lhNoise(q.xx * 0.7 + 9.0)) ;
  q.x += 0.37 * floor(q.y);
  vec2 id = floor(q), f = fract(q);
  float h = lhHash(id + 0.5), h2 = lhHash(id + 17.5);
  float e = min(min(f.x, 1.0 - f.x), min(f.y, 1.0 - f.y)) * size;      // metres to the seam
  float w = max(fw, 0.02);
  float stain = (1.0 - smoothstep(0.25, 0.75 + w, e)) * 0.75;
  float seam = (1.0 - smoothstep(0.0, 0.09 + w, e)) * 0.6 * clamp(0.14 / w, 0.0, 1.0);
  vec3 c = mix(uTan, uTan2, step(0.62, h) * (0.6 + 0.4 * h2));
  c = mix(c, uTan2, uOld * 0.55);
  // foxing and old creases: soft browner blots, and a fold line every 70 m or so running one way across the sheets
  float blot = smoothstep(0.56, 0.82, lhNoise(suv * 0.019 + 5.0)) * (0.3 + 0.25 * uOld);
  float cr = abs(fract(dot(suv, vec2(0.0127, 0.0061)) + 0.3 * lhNoise(suv * 0.004)) - 0.5) * 71.0;
  float crease = (1.0 - smoothstep(0.0, 0.25 + w, cr)) * 0.5 * clamp(0.5 / w, 0.0, 1.0);
  c = mix(c, uTan2, max(blot, crease));
  c = mix(c, uTan2, stain * (1.0 + uOld * 0.3)); c = mix(c, uGraph, seam);
  return vec4(c, (h - 0.5) * 0.16); }
// distance in metres from p to a D-shaped mouth arch standing in space (c = sill centre, a = nx, nz, half width, leg)
vec2 lhMouthSD(vec3 p, vec3 c, vec4 a){
  vec3 d = p - c; float w = d.x * a.x + d.z * a.y; float u = d.x * a.y - d.z * a.x; float v = d.y - a.w;
  float sd;
  if (v > 0.0) sd = length(vec2(u, v)) - a.z;
  else { vec2 b = vec2(abs(u) - a.z, -d.y); sd = (b.x > 0.0 && b.y > 0.0) ? length(b) : max(b.x, b.y); }
  return vec2(sd, w); }
float lhMouthN(vec3 p, vec3 c, vec4 a){ vec2 s = lhMouthSD(p, c, a); return length(vec2(max(s.x, 0.0), s.y)); }
float lhBand(float n, float sp, float fw, float run){
  float f = n / sp, fr = fract(f);
  float d = min(fr, 1.0 - fr) * sp;
  float lw = max(0.15, 0.8 * fw);
  float line = clamp((lw - d) / max(fw, 1e-4) + 0.5, 0.0, 1.0) * min(1.0, 0.24 / lw);
  float r = max(0.0, 1.0 - fr / 0.68);
  float rub = min(0.94, r * mix(r, 1.0, 0.45) * 0.93 * run);
  return max(line, rub); }
// THE MARK. n metres from the mouth arch (already wobbled, shivered); fw = fwidth(n); returns graphite cover 0..1
float lhEcho(float n, float fw, float tooth){
  float run = 0.6 + 0.75 * smoothstep(0.1, 0.95, sin((n - uTime * 9.0) * 0.052 + 1.7 * sin(n * 0.011)));
  float L = clamp(log2(max(fw, 1e-4) * 7.0 / 2.5), 0.0, 4.0);           // far fields keep their echoes: 20 and 40 m bands
  float l0 = min(floor(L), 3.0), k = smoothstep(0.2, 0.8, L - l0);
  float sp = 2.5 * exp2(l0);
  float c = mix(lhBand(n, sp, fw, run), lhBand(n, sp * 2.0, fw, run), k);
  float mean = 0.27 * run + 0.04;
  c = mix(c, mean, smoothstep(9.0, 14.0, fw));                          // 40 m band under ~4 px: one flat rubbed tone
  float fleck = smoothstep(0.2, 0.62, tooth + c * 0.55);                // tooth shows as tan flecks in the rub
  return c * mix(0.84, 1.0, max(fleck, smoothstep(0.45, 0.8, c))) * 1.06; }   // (never in the line itself: a line stays whole)
// graphite dragged over the sheet: a coarser grain the rub catches on, neutral (1.0) once finer than a few pixels
float lhDrag(vec2 suv, float fw){
  float d = lhNoise(suv * vec2(2.3, 4.1)) * 0.55 + lhNoise(suv * vec2(7.3, 5.1) + 3.3) * 0.45;
  float d2 = lhNoise(suv * vec2(0.55, 0.9) + 11.0);                      // and a broader unevenness of pressure along a band
  return 1.0 + 0.08 * (smoothstep(0.2, 0.8, d) - 0.5) * (1.0 - smoothstep(0.03, 0.1, fw))
             + 0.1 * (smoothstep(0.25, 0.75, d2) - 0.5) * (1.0 - smoothstep(0.12, 0.4, fw)); }
// wax crayon band: v 0..1 across the band, wd its width in metres, x metres along, wax colour; graphite both edges,
// rub on the v=0 side, paper flecks where the wax skipped
vec3 lhWax(vec3 wax, vec3 paper, float v, float wd, float x, vec2 suv, float fwv, float fws){
  float t = lhNoise(vec2(x * 0.9, v * wd * 7.0) + suv * 0.3) * 0.55 + lhNoise(vec2(x * 2.4, v * wd * 17.0) + 3.7) * 0.45;   // skips run along the stroke
  t = mix(t, 0.5, smoothstep(0.03, 0.1, fws));
  float run = smoothstep(0.1, 0.95, sin((x - uTime * 9.0) * 0.07 + suv.y * 0.02));   // the wax is still being pressed
  float skip = 1.0 - smoothstep(0.2 - 0.13 * run, 0.4 - 0.2 * run, t);
  vec3 c = mix(wax, paper, skip * mix(0.22, 0.7, smoothstep(8.0, 30.0, 1.0 / max(gl_FragCoord.w, 1e-4))));   // right beside the eye the wax lies closer
  float ev = min(v, 1.0 - v) * wd; float few = max(fwv * wd, 1e-4);
  float lw = max(0.07, 0.8 * few);
  float edge = clamp((lw - ev) / few + 0.5, 0.0, 1.0) * min(1.0, 0.12 / lw);
  float rub = max(0.0, 1.0 - v / (0.4 + 0.25 * run)); rub = rub * rub * (0.3 + 0.45 * run) * (0.6 + 0.4 * smoothstep(0.3, 0.6, t));
  return mix(c, uGraph, max(edge * 0.95, rub)); }
`;

const FRAG_HEAD = /* glsl */`
varying vec3 vP; varying vec2 vUv; varying float vN; varying float vWax;
` + STYLE_GLSL;
function mat(frag, o = {}, extra = {}) {
  const m = new THREE.ShaderMaterial({
    uniforms: { ...(o.un || lhUniforms), ...extra }, vertexShader: LH_VERT, fragmentShader: FRAG_HEAD + frag,
    side: o.side ?? THREE.FrontSide, defines: { ...(o.instanced ? { LH_INST: 1 } : {}), ...(o.defines || {}) },
  });
  return m;
}

export function paperMaterial(o = {}) {
  const ms = (o.mouths || []).slice(0, 12), N = ms.length;
  const extra = { uSheet: { value: o.sheet ?? 110 }, uShv1: { value: -1 }, uLift: { value: o.lift ?? 0 } };
  if (N) {
    extra.uMP = { value: ms.map((m) => new THREE.Vector3(m.p[0], m.p[1], m.p[2])) };
    extra.uMA = { value: ms.map((m) => new THREE.Vector4(m.n[0], m.n[1], m.r ?? 8, m.leg ?? 2)) };
    extra.uShv = { value: ms.map(() => -1) };
    // per mouth: x how hard its whole field is rubbed (0 bare .. 1 pressed), y crayon bands round the mouth, z which wax
    // comes first, w a band's width in metres
    extra.uInk = { value: ms.map((m) => new THREE.Vector4(m.ink ?? 0, m.bands ?? 0, m.par ?? 0, m.bw ?? 2.5)) };
  }
  const m = mat(/* glsl */`
#ifdef LH_MOUTHS
uniform vec3 uMP[LH_MOUTHS]; uniform vec4 uMA[LH_MOUTHS]; uniform float uShv[LH_MOUTHS]; uniform vec4 uInk[LH_MOUTHS];
#endif
uniform float uShv1; uniform float uSheet; uniform float uLift;
#ifdef LH_SEED
varying vec3 vSC; varying vec4 vSA;
#endif
void main(){
  vec2 suv = lhSuv(vP);
  float fws = length(fwidth(suv)) * 0.7;
  vec4 sh = lhSheet(suv, uSheet, fws);
  float tintV = vWax; vec4 ink = vec4(0.0, 0.0, 0.0, 2.5);
#ifdef LH_SEED
  // a seeded mound's aWax = sheet tan (0..1) + 2 * rub step (0..4) + 16 * crayon bands (0..4), the same at all its vertices
  float wv = vWax + 0.01; ink.y = floor(wv / 16.0); wv -= ink.y * 16.0; ink.x = floor(wv / 2.0); tintV = wv - ink.x * 2.0; ink.x *= 0.25;
  ink.z = step(0.5, fract(vSC.x * 0.137 + vSC.z * 0.071)); ink.w = max(2.5, floor(vSA.z * 0.3 / 2.5) * 2.5);
  if (vP.y < vSC.y) ink.y = 0.0;
#endif
  sh.rgb = mix(sh.rgb, uTan2, clamp(tintV, 0.0, 1.0) * 0.85);              // per-vertex sheet tan (aWax 0..1): the world's pasted ground sheets
  float n = vN; float shv = uShv1;
#ifdef LH_SEED
  n = lhMouthN(vP, vSC, vSA);                                            // round arcs however coarse the mound's mesh
#endif
#ifdef LH_MOUTHS
  n = 1e5;
  float hole = 0.0;
  for (int i = 0; i < LH_MOUTHS; i++) {
    vec2 s = lhMouthSD(vP, uMP[i], uMA[i]);
#ifdef LH_LEGS
    // below its sill a mouth's echoes do not wrap under it (an eye): its legs run straight down as ruled verticals, and
    // the strip under the sill is ruled inward from both legs (a pier), until another mouth's field takes over
    vec3 dd = vP - uMP[i];
    if (dd.y < 0.0) s.x = abs(abs(dd.x * uMA[i].y - dd.z * uMA[i].x) - uMA[i].z);
    else
#endif
    if (s.x < -0.05 && abs(s.y) < 5.0) hole = 1.0;                       // the D is a real opening in the sheet
    float d = length(vec2(max(s.x, 0.0), s.y));
    if (d < n) { n = d; shv = uShv[i]; ink = uInk[i]; if (vP.y < uMP[i].y) ink.y = 0.0; }   // the crayon stays above the sill: none under a raised mouth, none down its ruled legs, none on the ground
  }
#endif
  float fw = fwidth(n);
#ifdef LH_MOUTHS
  if (hole > 0.5) discard;
#endif
  float L = clamp(log2(max(fw, 1e-4) * 7.0 / 2.5), 0.0, 4.0);
  float nn = n + sh.w + (lhNoise(suv * 0.045) - 0.5) * 1.6 + (lhNoise(suv * 0.33) - 0.5) * 0.24
           + (lhNoise(suv * 0.011) - 0.5) * 0.06 * min(n, 220.0);
  float q = (nn - shv) / (5.0 + 3.0 * L);
  float bump = exp(-q * q) * step(0.0, shv) * clamp(1.0 - shv / 130.0, 0.0, 1.0);
  nn -= 0.5 * (1.0 + 1.6 * L) * bump;                                    // the shiver: arcs pushed outward
  float cover = lhEcho(max(nn, 0.0), fw, lhTooth(suv, fws));
  cover = min(1.0, cover * (1.0 + 0.5 * bump) * lhDrag(suv, fws));
#ifdef LH_SEED
  cover = min(1.0, cover * 1.45);                                        // the far ranks and the small hills are pressed harder
#endif
  // a field pressed hard: graphite laid over the whole band, the tube still showing through it, the tooth still tan
  float tt = lhTooth(suv, fws);
  float press = clamp(ink.x - uLift, 0.0, 1.0);
  // (the pencil is pressed over the whole band and one narrow line of bare paper is spared before the next echo)
  float l0 = min(floor(L), 3.0), sp = 2.5 * exp2(l0), ew = max(fw / sp, 1e-4);
  float f1 = fract(max(nn, 0.0) / sp), f2 = fract(max(nn, 0.0) / (2.0 * sp));
  float s1 = smoothstep(0.7 - ew, 0.7 + ew, f1) * (1.0 - smoothstep(0.96 - ew, 0.96 + ew, f1));
  float s2 = smoothstep(0.7 - 0.5 * ew, 0.7 + 0.5 * ew, f2) * (1.0 - smoothstep(0.96 - 0.5 * ew, 0.96 + 0.5 * ew, f2));
  float spare = mix(mix(s1, s2, smoothstep(0.2, 0.8, L - l0)), 0.26, smoothstep(9.0, 14.0, fw));
  cover = mix(cover, max(cover, (1.0 - 0.9 * spare) * mix(0.84, 0.97, tt)), press);
  vec3 col = mix(sh.rgb, mix(uGraph, uBlack, 0.5 * press), cover);
  // the mouth's crayon bands: the first echoes round a D are filled with wax, mauve and orange by turns
  float wb = max(nn, 0.0) / ink.w;
  if (wb < ink.y) {
    vec3 wx = mod(floor(wb) + ink.z, 2.0) < 0.5 ? uMauve : uOrange;
    wx = mix(wx, 0.5 * (uMauve + uOrange), smoothstep(0.33, 0.6, fw / ink.w));
    col = lhWax(wx, sh.rgb, fract(wb), ink.w, suv.x * 0.8 + suv.y, suv, fw / ink.w, fws);
  }
  gl_FragColor = vec4(col, 1.0);
}`, { ...o, defines: N ? (o.legs ? { LH_MOUTHS: N, LH_LEGS: 1 } : { LH_MOUTHS: N }) : (o.seed ? { LH_SEED: 1 } : {}) }, extra);
  m.userData.shiver = (i, r) => { if (N) { if (i < N) extra.uShv.value[i] = r; } else extra.uShv1.value = r; };
  m.userData.mouthCount = N; m.userData.ink = N ? extra.uInk.value : null; m.userData.lift = extra.uLift;
  return m;
}

const WAXPICK = /* glsl */`
uniform float uCross; uniform float uShowD; uniform float uEyeZ;
vec3 lhPick(float w){ return w < 0.5 ? uMauve : (w < 1.5 ? uOrange : (w < 2.5 ? uTan : (w < 3.5 ? uOchre : uBlack))); }
`;
// crayon ribs. uv.x metres along the rib, uv.y 0..1 across the face, aN = the face's width in metres.
export function waxMaterial(o = {}) {
  return mat(WAXPICK + /* glsl */`
void main(){
  vec2 suv = lhSuv(vP);
  float fws = length(fwidth(suv)) * 0.7;
  float w = vWax;
  if (w > 4.5) {                                                          // a hall rib face: 5 mauve first, 6 orange first
    float t = abs(vUv.x - 247.0) / 247.0;                                 // 0 at the crown, 1 at the feet
    float k = smoothstep(0.0, 0.05, uCross * 1.12 - t - 0.05 * lhNoise(suv * 0.2));
    w = w < 5.5 ? k : 1.0 - k;
  }
  vec3 c = lhWax(lhPick(w), uTan, vUv.y, max(vN, 0.05), vUv.x, suv, fwidth(vUv.y), fws);
#ifdef LH_RIB
  if (w > 1.5 && w < 2.5) {       // a pencil rib between two of wax: bare paper rubbed dark from one edge, drawn only near the eye
    float v2 = 1.0 - vUv.y; c = mix(c, uGraph, 0.16 + 0.62 * v2 * v2);
    c = mix(c, uBlack, smoothstep(50.0, 110.0, 1.0 / max(gl_FragCoord.w, 1e-4)));
  }
#endif
  c = mix(uBlack, c, 1.0 - smoothstep(uShowD * 0.75, uShowD, vP.z - uEyeZ));   // wax too deep in the dark to be seen yet (the gate tunnel)
  gl_FragColor = vec4(c, 1.0);
}`, o.instanced ? { ...o, defines: { LH_RIB: 1 } } : o, { uShowD: { value: 1e6 }, uEyeZ: { value: 0 } });
}

// viaduct cells: uv = metres from the arch's spring-line centre; aN = half span; aWax 2 = intrados (uv.y 0..1 across)
export function arcadeMaterial(o = {}) {
  return mat(/* glsl */`
void main(){
  if (vWax > 2.5) { gl_FragColor = vec4(uBlack, 1.0); return; }          // pressed black standing behind every arch
  vec2 suv = lhSuv(vP);
  float fws = length(fwidth(suv)) * 0.7;
  float tooth = lhTooth(suv, fws);
  vec3 paper = mix(uTan, uTan2, 0.1 * smoothstep(0.45, 0.8, lhNoise(suv * 0.05)));
  float cover;
  if (vWax > 1.5) {
    float e = min(vUv.y, 1.0 - vUv.y) * 11.0, fe = max(fwidth(vUv.y) * 11.0, 1e-4);
    float f = (e + 0.2) / 0.95, fr = fract(f), d = min(fr, 1.0 - fr) * 0.95, lw = max(0.07, 0.8 * fe);
    float line = clamp((lw - d) / fe + 0.5, 0.0, 1.0) * min(1.0, 0.12 / lw);
    float r = max(0.0, 1.0 - fr / 0.7);                                   // the soffit is ruled right across, rubbed, still being pressed
    float runS = 0.7 + 0.5 * smoothstep(0.1, 0.95, sin((suv.x + suv.y - uTime * 7.0) * 0.06));
    cover = mix(max(line, r * r * 0.55 * runS), 0.22, smoothstep(0.25, 0.5, fe)) + 0.1;
    cover *= mix(0.6, 1.0, smoothstep(0.2, 0.6, tooth + cover * 0.5));
  }
  else {
    float sd = (vUv.y > 0.0 ? length(vUv) : abs(vUv.x)) - vN;
    float fw = fwidth(sd);
    float n = sd + 0.18 + (lhNoise(suv * 0.5) - 0.5) * 0.16;
    float f = n / 0.95, fr = fract(f);
    float d = min(fr, 1.0 - fr) * 0.95;
    float lw = max(0.07, 0.8 * fw);
    float line = clamp((lw - d) / max(fw, 1e-4) + 0.5, 0.0, 1.0) * min(1.0, 0.12 / lw);
    float run = 0.75 + 0.45 * smoothstep(0.1, 0.95, sin((suv.x + suv.y - uTime * 7.0) * 0.06));
    float r = max(0.0, 1.0 - fr / 0.7); float rub = r * r * 0.55 * run;
    float inb = vWax > 0.5 ? 1.0 : 1.0 - smoothstep(2.55, 2.75, n);        // three lines deep, then bare paper (aWax 1: the echoes fill the wall and meet in creases)
    float top = clamp((lw - abs(vUv.y - vN - 2.4)) / max(fw, 1e-4) + 0.5, 0.0, 1.0) * min(1.0, 0.12 / lw);
    cover = max(max(line, rub) * inb, top);
    cover = mix(cover, 0.22 * inb, smoothstep(0.25, 0.5, fw));
    cover *= mix(0.6, 1.0, smoothstep(0.2, 0.6, tooth + cover * 0.5));
  }
  gl_FragColor = vec4(mix(paper, uGraph, clamp(cover, 0.0, 1.0)), 1.0);
}`, o);
}

// rails: uv.x metres along, uv.y metres across from the track centre; aWax 4 = on black ground (tan lines)
export function trackMaterial(o = {}) {
  return mat(/* glsl */`
uniform float uShowD; uniform float uEyeZ;
void main(){
  float fy = max(fwidth(vUv.y), 1e-4), fx = max(fwidth(vUv.x), 1e-4);
  float lw = max(0.07, 0.8 * fy);
  float ty = abs(abs(vUv.y) - vN);
  float rail = clamp((lw - abs(ty - 0.75)) / fy + 0.5, 0.0, 1.0) * min(1.0, 0.11 / lw);
  float sx = abs(fract(vUv.x) - 0.5);
  float sl = clamp((0.11 - sx) / fx + 0.5, 0.0, 1.0) * step(ty, 1.15);
  sl = mix(sl, 0.22 * step(ty, 1.15), smoothstep(0.12, 0.3, fx));
  // the bed beside the rails: ruled lines every 0.9 m, each rubbed on its outer side (no bare deck)
  float bq = (ty - 1.3) / 0.9, bf = fract(bq), bfw = max(fwidth(vUv.y) / 0.9, 1e-4);
  float bl = clamp((max(0.07, 0.8 * bfw) - min(bf, 1.0 - bf)) / bfw + 0.5, 0.0, 1.0) * min(1.0, 0.1 / max(0.07, 0.8 * bfw));
  float bed = step(1.3, ty) * mix(max(bl, (1.0 - bf) * (1.0 - bf) * 0.42), 0.2, smoothstep(0.3, 0.6, bfw));
  if (vWax > 3.5) {
    // inside a mouth nothing is left blank: the track pressed dark with its rails and sleepers spared as paper, the bed
    // either side in ruled bands each rubbed from its outer line; pressed black only far down the tunnel
    float see = (1.0 - smoothstep(60.0, 130.0, 1.0 / max(gl_FragCoord.w, 1e-4))) * (1.0 - smoothstep(uShowD * 0.75, uShowD, vP.z - uEyeZ));
    float fws = length(fwidth(vUv)) * 0.7, tooth = lhTooth(vUv * vec2(0.6, 1.0), fws);
    float band = mix(max(bl, 0.2 + 0.66 * (1.0 - bf)), 0.5, smoothstep(0.3, 0.6, bfw));
    float cov = ty < 1.3 ? 0.88 * (1.0 - max(rail, sl * 0.85)) : band;
    cov *= mix(0.86, 1.0, smoothstep(0.2, 0.62, tooth + cov * 0.5));
    vec3 cd = mix(uTan, mix(uGraph, uBlack, 0.3), clamp(cov, 0.0, 1.0));
    gl_FragColor = vec4(mix(uBlack, cd, see), 1.0); return;
  }
  float k = max(max(rail, sl * 0.8), bed);
  gl_FragColor = vec4(mix(uTan, uGraph, k), 1.0);
}`, o, { uShowD: { value: 1e6 }, uEyeZ: { value: 0 } });
}
export function blackMaterial(o = {}) {
  return mat(/* glsl */`void main(){ gl_FragColor = vec4(uBlack, 1.0); }`, o);
}

// trains. aWax per face: 0 upright stripes (uv.x metres along, uv.y 0..1, aN height m), 1 ruled paper (uv.x metres),
// 2 plain paper with pencil edges (uv 0..1), 4 graphite, 5 coin wheel (uv -1..1), 6 the round face with its ochre lamp.
// Per instance aTrain = (wheel angle rad, wax scheme 0 mauve+orange / 1 orange+ochre / 2 pencil only, unused, seed).
export function trainMaterial(o = {}) {
  return mat(/* glsl */`
varying vec4 vTrain;
float lhRing(float r, float at, float w, float fr){ float lw = max(w, 0.8 * fr); return clamp((lw - abs(r - at)) / max(fr, 1e-4) + 0.5, 0.0, 1.0) * min(1.0, 1.6 * w / lw); }
void main(){
  vec2 suv = vUv * vec2(1.0, 3.0) + vTrain.w * 17.0;
  vec3 A = vTrain.y < 0.5 ? uMauve : (vTrain.y < 1.5 ? uOrange : uTan);
  vec3 Bc = vTrain.y < 0.5 ? uOrange : (vTrain.y < 1.5 ? uOchre : uTan);
  vec3 c = uTan;
  if (vWax > 5.5) {
    float r = length(vUv), fr = fwidth(r); if (r > 1.0) discard;
    float g = max(lhRing(r, 0.94, 0.06, fr), lhRing(r, 0.62, 0.05, fr));
    float rub = max(0.0, 1.0 - (r - 0.62) / 0.24) * step(0.62, r) * 0.5;
    c = mix(uTan, uGraph, max(g, rub));
    float lamp = 1.0 - clamp((r - 0.36) / max(fr, 1e-4) + 0.5, 0.0, 1.0);
    c = mix(c, uOchre, lamp); c = mix(c, uGraph, lhRing(r, 0.37, 0.045, fr));
  } else if (vWax > 4.5) {
    float r = length(vUv), fr = fwidth(r); if (r > 1.0) discard;
    vec2 q = vUv + vec2(1e-4 * step(abs(vUv.x) + abs(vUv.y), 1e-6), 0.0);
    float f = fract((atan(q.y, q.x) + vTrain.x) * 1.27324);
    float ds = min(f, 1.0 - f) * 0.7854 * r;
    float sw = max(0.055, 0.8 * fr);
    float spoke = clamp((sw - ds) / max(fr, 1e-4) + 0.5, 0.0, 1.0) * min(1.0, 0.09 / sw) * step(r, 0.84);
    float g = max(max(lhRing(r, 0.93, 0.07, fr), lhRing(r, 0.76, 0.035, fr)), spoke);
    g = max(g, 1.0 - clamp((r - 0.17) / max(fr, 1e-4) + 0.5, 0.0, 1.0));
    g = max(g, step(0.76, r) * 0.45);
    c = mix(uTan, uGraph, g);
  } else if (vWax > 3.5) { c = uGraph;
  } else if (vWax > 1.5) {
    vec2 e = min(vUv, 1.0 - vUv); vec2 fe = max(fwidth(vUv), vec2(1e-4));
    float g = max(clamp((0.035 - e.x) / fe.x + 0.5, 0.0, 1.0), clamp((0.05 - e.y) / fe.y + 0.5, 0.0, 1.0));
    c = mix(uTan, uGraph, max(g * 0.9, 0.42 * (1.0 - vUv.y) * (1.0 - vUv.y)));
  } else {
    float wd = 0.6, x = vUv.x / wd + 0.5, k = floor(x), fx = fwidth(vUv.x);
    float m = mod(k, 4.0);
    vec3 wx = vWax > 0.5 ? uTan : (m < 0.5 ? A : (m < 1.5 ? uTan : (m < 2.5 ? Bc : uTan)));
    float h = max(vN, 0.1);
    c = lhWax(wx, uTan, fract(x), wd, vUv.y * h, suv, fx / wd, fx);
    vec3 avg = mix((A + Bc + 2.0 * uTan) * 0.25, uGraph, 0.26);
    if (vWax > 0.5) avg = mix(uTan, uGraph, 0.26);
    c = mix(c, avg, smoothstep(0.15, 0.3, fx));
    float ey = min(vUv.y, 1.0 - vUv.y) * h, fy = max(fwidth(vUv.y) * h, 1e-4), lw = max(0.07, 0.8 * fy);
    c = mix(c, uGraph, clamp((lw - ey) / fy + 0.5, 0.0, 1.0) * min(1.0, 0.11 / lw) * (vWax > 0.5 ? 0.0 : 1.0));
  }
  gl_FragColor = vec4(c, 1.0);
}`, { ...o, instanced: true });
}
// scalloped smoke puffs: camera-facing instanced quads (instance matrix = position and uniform scale)
export function smokeMaterial(o = {}) {
  return new THREE.ShaderMaterial({ uniforms: o.un || lhUniforms, side: THREE.DoubleSide,
    vertexShader: /* glsl */`varying vec2 vUv; void main(){ vUv = position.xy;
      vec4 mv = modelViewMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
      float s = length(instanceMatrix[0].xyz); mv.xy += position.xy * s; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: /* glsl */`varying vec2 vUv;` + STYLE_GLSL + /* glsl */`
    void main(){ vec2 q = vUv + vec2(1e-4 * step(abs(vUv.x) + abs(vUv.y), 1e-6), 0.0);
      float r = length(q), a = atan(q.y, q.x);
      float edge = 0.84 + 0.13 * abs(sin(a * 3.5));                        // seven scallops
      float d = edge - r, fr = max(fwidth(d), 1e-4); if (d < 0.0) discard;
      float lw = max(0.05, 0.8 * fr);
      float line = clamp((lw - d) / fr + 0.5, 0.0, 1.0) * min(1.0, 0.09 / lw);
      float rub = max(0.0, 1.0 - d / 0.3); rub = rub * rub * 0.42;
      float in2 = clamp((lw - abs(d - 0.42)) / fr + 0.5, 0.0, 1.0) * 0.5 * min(1.0, 0.07 / lw);
      gl_FragColor = vec4(mix(uTan, uGraph, max(max(line, rub), in2)), 1.0); }` });
}

// ---------- geometry helpers (course coordinates) ----------
// D outline: half width r, legs `leg` high, then a half circle. Returns [x, y, arcLength] points, port foot to starboard foot.
function dOutline(r, leg, nArc, nLeg = 1) {
  const pts = []; let s = 0;
  for (let i = 0; i < nLeg; i++) pts.push([-r, (leg * i) / nLeg, (leg * i) / nLeg]);
  s = leg;
  for (let i = 0; i <= nArc; i++) { const a = Math.PI * (1 - i / nArc); pts.push([Math.cos(a) * r, leg + Math.sin(a) * r, s + (Math.PI * r * i) / nArc]); }
  s += Math.PI * r;
  for (let i = 1; i <= nLeg; i++) pts.push([r, leg * (1 - i / nLeg), s + (leg * i) / nLeg]);
  return pts;
}
class Geo {            // tiny non-indexed triangle soup builder with the attributes LH_VERT wants
  constructor() { this.p = []; this.u = []; this.n = []; this.w = []; }
  v(x, y, z, u = 0, v = 0, n = 0, w = 0) { this.p.push(x, y, z); this.u.push(u, v); this.n.push(n); this.w.push(w); }
  quad(a, b, c, d) { for (const q of [a, b, c, a, c, d]) this.v(...q); }
  tri(a, b, c) { this.v(...a); this.v(...b); this.v(...c); }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.u, 2));
    g.setAttribute('aN', new THREE.Float32BufferAttribute(this.n, 1));
    g.setAttribute('aWax', new THREE.Float32BufferAttribute(this.w, 1));
    return g;
  }
}
// a rib standing in the xy plane at z0: D arch of half width r, relief `dp` inward, `lz` long. wax ids per face.
function addRib(G, r, leg, dp, lz, nArc, nLeg, x0, y0, z0, wF, wS, wB) {
  const o = dOutline(r, leg, nArc, nLeg), k = (r - dp) / r;
  const inn = o.map((q) => [q[0] * (q[1] > leg ? k : (r - dp) / r), q[1] > leg ? leg + (q[1] - leg) * k : q[1], q[2]]);
  const za = z0 - lz / 2, zb = z0 + lz / 2;
  for (let i = 0; i < o.length - 1; i++) {
    const a = o[i], b = o[i + 1], c = inn[i], d = inn[i + 1];
    G.quad([x0 + c[0], y0 + c[1], za, c[2], 0, dp, wF], [x0 + a[0], y0 + a[1], za, a[2], 1, dp, wF], [x0 + b[0], y0 + b[1], za, b[2], 1, dp, wF], [x0 + d[0], y0 + d[1], za, d[2], 0, dp, wF]);
    G.quad([x0 + c[0], y0 + c[1], zb, c[2], 0, lz, wS], [x0 + c[0], y0 + c[1], za, c[2], 1, lz, wS], [x0 + d[0], y0 + d[1], za, d[2], 1, lz, wS], [x0 + d[0], y0 + d[1], zb, d[2], 0, lz, wS]);
    G.quad([x0 + a[0], y0 + a[1], zb, a[2], 1, dp, wB], [x0 + c[0], y0 + c[1], zb, c[2], 0, dp, wB], [x0 + d[0], y0 + d[1], zb, d[2], 0, dp, wB], [x0 + b[0], y0 + b[1], zb, b[2], 1, dp, wB]);
  }
}
// black D tube from (x,ya,za) to (x,yb,zb) with floor; optional end cap at zb
function addTube(G, r, leg, x0, ya, za, yb, zb, cap) {
  const o = dOutline(r, leg, 14, 1);
  for (let i = 0; i < o.length - 1; i++) {
    const a = o[i], b = o[i + 1];
    G.quad([x0 + a[0], ya + a[1], za], [x0 + b[0], ya + b[1], za], [x0 + b[0], yb + b[1], zb], [x0 + a[0], yb + a[1], zb]);
  }
  G.quad([x0 - r, ya, za], [x0 + r, ya, za], [x0 + r, yb, zb], [x0 - r, yb, zb]);
  if (cap) for (let i = 0; i < o.length - 1; i++) G.tri([x0, yb + leg, zb], [x0 + o[i][0], yb + o[i][1], zb], [x0 + o[i + 1][0], yb + o[i + 1][1], zb]);
}
// a full D wall (fan) at z, facing either way
function addDWall(G, r, leg, y0, z, nArc) {
  const o = dOutline(r, leg, nArc, 4);
  for (let i = 0; i < o.length - 1; i++) G.tri([0, y0 + leg * 0.5, z], [o[i][0], y0 + o[i][1], z], [o[i + 1][0], y0 + o[i + 1][1], z]);
  G.tri([0, y0 + leg * 0.5, z], [o[o.length - 1][0], y0, z], [o[0][0], y0, z]);
}

// ---------- the piece ----------
// buildHero(ctx, opts): opts.palette (7 hexes, default LH_PALETTE), opts.detail (0.6..1: thins smoke, face cars and
// tunnel ribs of the unflown tunnels), opts.rare (true: all four waiting engines roll out at u 0.2 and their fields
// shiver together; default by seed, 1 in 12), opts.wax ('ochre' or 'pencil': the brief's wax variations for trains).
// Set-piece viewer only: &lhdbg=face | mouth | hall | train | engine | rib puts the orbit inside or close.
// Returned: object, radius 420, height 300, center, anchors (object-local, see the foot of this file), update(dt, time,
// camera), setProgress(u01) (the world's u mapped so 0 = valley reveal, 1 = break-out; drives every train and shiver),
// materials {paper, walls, wax, arcade, track, train, black}, course (inner group in course coordinates), mouths.
// hero.altar: the great ribbed niche in the hall's far wall on the nave's axis (course coordinates, a mouth record); the
// world sets a stage and its rider in it. Every viaduct arch stands on pressed black (a sheet inside each cell).
// POLISH ROUND o3: flown tunnels have a rubbed pencil rib in every gap between wax ribs and a drawn floor (trackMaterial's
// aWax 4: rails and sleepers spared in a pressed bed, ruled bands beside it; black only far down the tunnel). The tier two
// tunnel ends at course z BAYZ in the back wall of THE BALCONY, a stage box of ten stepped crayon arches opening in the back
// face (mouth 9 is now that great arch: r BAYR, leg BAYLEG). A bridge of three storeys of arches crosses the nave at
// course z XBZ, deck XBY, and a train (trains[5], cross: true) crosses it in profile as the eye climbs level with it.
// Cost: about 105k triangles, 14 draw calls, no lights, no textures. Expects around it: the valley floor at y 0 in
// front, rails arriving at x 0 / -6 (course), and a falling viaduct leaving the back mouth (anchors.backMouth).
const HW = 350, HH = 300, ZF = -280, ZB = 280, HZ0 = -186, HZ1 = 120, HR = 100, HFLOOR = -24, HSPR = 66;
const TIER = [0, 70, 140], LINE = [-2, 28, -40], MR = 8, MLEG = 2, SR = 12, SLEG = 3;
// LD: how deep each ledge is (thin, so a ledge does not hide the sills above it from the valley); UR, ULEG: the six mouths
// of the upper tiers stand tall and wide enough to read as upright black Ds from 350 m; KFACE: the scale of a ledge train
const LD = 6, UR = 13, ULEG = 6, KFACE = 3;
const bow = (x) => 55 * (x / HW) * (x / HW);
// THE BALCONY. The tier two tunnel ends 80 m short of the back face in the back wall of a great stage box cut into the
// mountain: nested crayon arches stepping outward from BAYR0 to BAYR half width, a ruled deck, the back country in its arch.
const BAYZ = 200, BAYR = 34, BAYR0 = 24, BAYLEG = 7, NBAY = 10;

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, detail = clamp(opts.detail ?? ctx.quality?.detail ?? 1, 0.6, 1);
  const un = opts.uniforms || makeLhUniforms(opts.palette);
  const object = new THREE.Group(), course = new THREE.Group();
  course.rotation.y = Math.PI; object.add(course);
  const J = () => rng.range(-14, 14);
  const shoulder = rng.range(2.0, 2.7), waxFlip = rng.chance(0.5) ? 1 : 0;
  const env = (x) => HH * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(x) / HW, shoulder)), 0.6);

  // mouths: [x, tier or y, z, facing nz]. 0..8 the valley face (tier by tier, middle one is the line), 9..11 the back.
  const fx = [[-152 + J(), LINE[0], 148 + J()], [-100 + J(), LINE[1], 142 + J()], [-132 + J(), LINE[2], 66 + J()]];
  const mouths = [];
  for (let t = 0; t < 3; t++) for (let i = 0; i < 3; i++) { const x = fx[t][i]; mouths.push({ p: [x, TIER[t], ZF + LD * t + bow(x)], n: [0, -1], r: t > 0 ? UR : i === 1 ? MR : SR, leg: t > 0 ? ULEG : i === 1 ? MLEG : SLEG, line: i === 1 ? t : -1 }); }
  const exitY = 70 - Math.tan(8 * Math.PI / 180) * (ZB - bow(LINE[1]) - 170);
  mouths.push({ p: [LINE[1], exitY, ZB - bow(LINE[1])], n: [0, 1], r: BAYR, leg: BAYLEG, line: 1 });   // the balcony's great arch in the back face
  mouths.push({ p: [LINE[0], 0, ZB - bow(LINE[0])], n: [0, 1], r: MR, leg: MLEG, line: 0 });
  const bx = -150 + J(); mouths.push({ p: [bx, 0, ZB - bow(bx)], n: [0, 1], r: SR, leg: SLEG, line: -1 });
  // each mouth's field: rubbed hard or left bare by turns (a chequer over the three tiers), and its crayon bands
  mouths.forEach((m, i) => { const t = Math.floor(i / 3), c = i % 3;
    m.ink = i < 9 ? ((t + c) % 2 ? 0.92 : 0.0) : i === 10 ? 0.9 : 0.0; m.bands = 3; m.bw = i < 9 && t > 0 ? 7.5 : i === 9 ? 4 : 2.5; m.par = (i + waxFlip) % 2; });

  // --- the shell: a stepped thumbprint. Rows follow a profile in (z, y); columns across x; clipped by the envelope.
  const prof = [];
  const seg = (z0, y0, z1, y1, n) => { for (let i = 0; i < n; i++) prof.push([lerp(z0, z1, i / n), lerp(y0, y1, i / n)]); };
  seg(-280, 0, -280, 70, 5); seg(-280, 70, -280 + LD, 70, 2); seg(-280 + LD, 70, -280 + LD, 140, 5); seg(-280 + LD, 140, -280 + 2 * LD, 140, 2); seg(-280 + 2 * LD, 140, -245, 200, 5);
  const dome = new THREE.SplineCurve([[-245, 200], [-214, 254], [-140, 288], [-30, 300], [90, 293], [185, 258], [243, 196], [272, 126], [280, 80]].map((q) => new THREE.Vector2(q[0], q[1])));
  for (let i = 0; i < 30; i++) { const q = dome.getPoint(i / 30); prof.push([q.x, q.y]); }
  seg(280, 80, 280, 0, 5); prof.push([280, 0]);
  const NC = 150, NR = prof.length;
  const sp = new Float32Array((NC + 1) * NR * 3), idx = [];
  for (let c = 0; c <= NC; c++) {
    const a = -1 + (2 * c) / NC, x = HW * Math.sign(a) * Math.pow(Math.abs(a), 0.9);
    const e = env(x);
    for (let r = 0; r < NR; r++) {
      const o = (c * NR + r) * 3, pz = prof[r][0];
      sp[o] = x; sp[o + 1] = Math.min(prof[r][1], e); sp[o + 2] = pz - bow(x) * (pz / 280);
      if (c < NC && r < NR - 1) { const i0 = c * NR + r, i1 = i0 + NR; idx.push(i0, i0 + 1, i1, i1, i0 + 1, i1 + 1); }
    }
  }
  const shellG = new THREE.BufferGeometry();
  shellG.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  shellG.setAttribute('uv', new THREE.BufferAttribute(new Float32Array((NC + 1) * NR * 2), 2));
  shellG.setAttribute('aN', new THREE.BufferAttribute(new Float32Array((NC + 1) * NR), 1));
  shellG.setAttribute('aWax', new THREE.BufferAttribute(new Float32Array((NC + 1) * NR), 1));
  shellG.setIndex(idx);
  const sheet = rng.range(85, 130);
  const paper = paperMaterial({ mouths, sheet, side: THREE.DoubleSide, un, legs: true });
  const shell = new THREE.Mesh(shellG, paper); course.add(shell);
  await ctx.yield();

  // --- black: tunnels, pockets, hall shell and floor
  const B = new Geo();
  const tunnels = [];          // flown or run-through tubes: {x, y0, z0, y1, z1}
  for (let t = 0; t < 3; t++) tunnels.push({ x: LINE[t], y0: TIER[t], z0: ZF + LD * t + bow(LINE[t]) - 0.5, y1: TIER[t], z1: HZ0 });
  tunnels.push({ x: LINE[0], y0: 0, z0: HZ1, y1: 0, z1: ZB - bow(LINE[0]) + 0.5 });
  tunnels.push({ x: LINE[1], y0: 70, z0: HZ1, y1: 70, z1: 170 });
  const tan8b = Math.tan(8 * Math.PI / 180), bayY = (z) => 70 - (z - 170) * tan8b, bayZ1 = ZB - bow(LINE[1]);
  tunnels.push({ x: LINE[1], y0: 70, z0: 170, y1: bayY(BAYZ), z1: BAYZ });
  for (const T of tunnels) addTube(B, MR, MLEG, T.x, T.y0, T.z0, T.y1, T.z1, false);
  addTube(B, BAYR, BAYLEG, LINE[1], bayY(BAYZ), BAYZ - 0.3, bayY(bayZ1 + 0.5), bayZ1 + 0.5, false);   // the balcony's box, pressed black behind its arches
  addTube(B, MR, MLEG, LINE[2], 140, HZ1, 140, HZ1 + 34, true);
  for (const m of mouths) if (m.line < 0) addTube(B, m.r, m.leg, m.p[0], m.p[1], m.p[2] - m.n[1] * 0.5, m.p[1], m.p[2] - m.n[1] * (m.r > SR ? 80 : 60), true);
  for (const m of mouths.slice(0, 9)) if (m.line > 0 && m.r > MR) addTube(B, m.r, m.leg, m.p[0], m.p[1], m.p[2] + 0.5, m.p[1], m.p[2] + 52, true);   // the upper line mouths: a tall black porch before the tunnel
  { const o = dOutline(HR, HSPR - HFLOOR, 40, 2);
    for (let i = 0; i < o.length - 1; i++) B.quad([o[i][0], HFLOOR + o[i][1], HZ0], [o[i + 1][0], HFLOOR + o[i + 1][1], HZ0], [o[i + 1][0], HFLOOR + o[i + 1][1], HZ1], [o[i][0], HFLOOR + o[i][1], HZ1]);
    B.quad([-HR, HFLOOR, HZ0], [HR, HFLOOR, HZ0], [HR, HFLOOR, HZ1], [-HR, HFLOOR, HZ1]); }
  const black = blackMaterial({ side: THREE.DoubleSide, un });
  course.add(new THREE.Mesh(B.build(), black));

  // --- the hall's two end walls: tan paper with three mouths each inside their own arcs
  const wallMouths = [];
  for (let t = 0; t < 3; t++) wallMouths.push({ p: [LINE[t], TIER[t], HZ0], n: [0, 1], r: MR, leg: MLEG });
  for (let t = 0; t < 3; t++) wallMouths.push({ p: [LINE[t], TIER[t], HZ1], n: [0, -1], r: MR, leg: MLEG });
  // the end walls' three line mouths: fields pressed dark, three crayon bands each; the altar's own field is left bare between them
  wallMouths.forEach((m, i) => { m.ink = 0.92; m.bands = 3; m.bw = 2.5; m.par = (i + waxFlip) % 2; });
  // the altar of the nave: a great ribbed niche in the far wall on the nave's axis (the world sets a rider's stage in it)
  const altar = { p: [-7, 62, HZ1], n: [0, -1], r: 15, leg: 12 }; wallMouths.push(altar);
  const walls = paperMaterial({ mouths: wallMouths, sheet: sheet * 0.6, side: THREE.DoubleSide, un });
  const Wg = new Geo(); addDWall(Wg, HR, HSPR - HFLOOR, HFLOOR, HZ0, 40); addDWall(Wg, HR, HSPR - HFLOOR, HFLOOR, HZ1, 40);
  course.add(new THREE.Mesh(Wg.build(), walls));
  // the balcony's back wall: tan paper, the tunnel's D in it inside its own arcs and three crayon bands
  const bayM = { p: [LINE[1], bayY(BAYZ), BAYZ], n: [0, 1], r: MR, leg: MLEG, ink: 0, bands: 3, bw: 2.5, par: waxFlip };
  { const Wb = new Geo(); addDWall(Wb, BAYR, BAYLEG, bayY(BAYZ) - 0.2, BAYZ, 40);
    // its deck is the same sheet: the D's echoes run out across the floor as ripples, wall to wall, to the lip
    const x0 = LINE[1] - BAYR - 1, x1 = LINE[1] + BAYR + 1, NZ = 8;
    for (let i = 0; i < NZ; i++) { const za = lerp(BAYZ, bayZ1 + 0.5, i / NZ), zb = lerp(BAYZ, bayZ1 + 0.5, (i + 1) / NZ);
      Wb.quad([x0, bayY(za) + 0.04, za], [x0, bayY(zb) + 0.04, zb], [x1, bayY(zb) + 0.04, zb], [x1, bayY(za) + 0.04, za]); }
    course.add(new THREE.Mesh(Wb.build(), paperMaterial({ mouths: [bayM], sheet: sheet * 0.5, side: THREE.DoubleSide, un }))); }
  await ctx.yield();

  // --- ribs. The hall: nine arches 6 m deep, mauve toward the entry, orange toward the exit, bare rubbed paper under.
  const HRIBS = 9, ribZ = [];
  const Rg = new Geo();
  for (let i = 0; i < HRIBS; i++) {
    const z = HZ0 + (i + 0.5) * ((HZ1 - HZ0) / HRIBS); ribZ.push(z);
    addRib(Rg, HR, HSPR - HFLOOR, 6, 5, 48, 3, 0, HFLOOR, z, 5 + waxFlip, 2, 1 - waxFlip);
    addRib(Rg, HR - 6, HSPR - HFLOOR, 1.4, 2.2, 48, 3, 0, HFLOOR, z, 6 - waxFlip, 2, waxFlip);   // a second, nested band
    for (const dz of [-6.2, 6.2]) addRib(Rg, HR, HSPR - HFLOOR, 2.6, 2.4, 48, 3, 0, HFLOOR, z + dz, 5 + waxFlip, 2, 1 - waxFlip);
  }
  const wax = waxMaterial({ side: THREE.DoubleSide, un });
  course.add(new THREE.Mesh(Rg.build(), wax));
  await ctx.yield();
  // tunnel ribs every 5 m in runs of three, and the one rim band of every mouth: one InstancedMesh
  const Ug = new Geo(); addRib(Ug, MR, MLEG, 0.5, 1.5, 16, 1, 0, 0, 0, 0, 0, 0);
  const ribM = [], ribW = [], Rg2 = new Geo();
  const m4 = new THREE.Matrix4();
  tunnels.forEach((T, ti) => {
    const len = T.z1 - T.z0, flown = ti === 0 || ti >= 4, step = flown ? 5 : 5 / detail, k = (T.y1 - T.y0) / len;
    const n = Math.floor((len - 2) / step) + (ti >= 4 ? 1 : 0);     // tier two's two lengths join without a gap in the ribs
    for (let i = 0; i < n; i++) {
      const dz = 2.5 + i * step;
      if (dz > len - 1) break;
      if ((ti === 1 || ti === 2) && dz < 55) continue;                  // nothing coloured in the porch of an upper mouth
      const kz = flown ? 1.9 : 1;                                       // the flown tunnels' ribs are broad bands of wax, 2.85 m of every 5
      m4.set(1, 0, 0, T.x, 0, 1, k * kz, T.y0 + k * dz, 0, 0, kz, T.z0 + dz, 0, 0, 0, 1);
      ribM.push(m4.clone()); ribW.push((Math.floor((i + (ti === 5 ? 10 : 0)) / 3) + waxFlip + ti) % 2);
      if (flown && (dz + 2.5 < len - 1 || ti === 4)) { const d2 = dz + 2.5, k2 = 1.2;      // and a pencil rib in the gap, set a little behind them
        m4.set(1.035, 0, 0, T.x, 0, 1.035, k * k2, T.y0 + k * d2, 0, 0, k2, T.z0 + d2, 0, 0, 0, 1); ribM.push(m4.clone()); ribW.push(2); }
    }
  });
  const rim = (m, i, s) => { const k = 1.07 * m.r / MR; m4.makeScale(k, k, 0.7).setPosition(m.p[0], m.p[1] - 0.05, m.p[2] + m.n[1] * s); ribM.push(m4.clone()); ribW.push((i + waxFlip) % 2); };
  mouths.forEach((m, i) => { if (i === 9) return; if (m.leg === ULEG) addRib(Rg2, m.r * 1.06, m.leg, 0.95, 1.0, 20, 2, m.p[0], m.p[1] - 0.05, m.p[2] - 0.25, (i + Math.floor(i / 3) + waxFlip) % 2, (i + Math.floor(i / 3) + waxFlip) % 2, (i + Math.floor(i / 3) + waxFlip) % 2); else rim(m, i + Math.floor(i / 3), 0.25); });
  for (let b = 0; b < 3; b++) { const w = (b + waxFlip) % 2; addRib(Rg2, altar.r + 1.35 + b * 1.65, altar.leg, 1.35, 0.9 - b * 0.2, 28, 3, altar.p[0], altar.p[1], HZ1 - 0.5 + b * 0.1, w, w, w); }
  // the balcony's arches: ten of wax, mauve and orange by turns, each a step wider than the one behind it, a pencil arch in every gap
  for (let i = 0; i < NBAY; i++) { const P = (bayZ1 - BAYZ) / NBAY, z = BAYZ + (i + 0.36) * P, r = lerp(BAYR0, BAYR, i / (NBAY - 1)), w = (i + waxFlip) % 2;
    addRib(Rg2, r, BAYLEG, 3, 4.6, 36, 2, LINE[1], bayY(z) - 0.1, z, w, w, w);
    if (i < NBAY - 1) addRib(Rg2, r + 1.3, BAYLEG, 2.2, P - 4.3, 36, 2, LINE[1], bayY(z + P * 0.5) - 0.1, z + P * 0.5, 2, 2, 2); }
  course.add(new THREE.Mesh(Rg2.build(), wax));
  rim(bayM, waxFlip + 1, 0.3);
  wallMouths.forEach((m, i) => { if (i < 6) rim(m, i, 0.3); });
  const ribs = new THREE.InstancedMesh(Ug.build(), waxMaterial({ instanced: true, side: THREE.DoubleSide, un }), ribM.length);
  ribM.forEach((m, i) => ribs.setMatrixAt(i, m));
  ribs.geometry.setAttribute('aWaxI', new THREE.InstancedBufferAttribute(new Float32Array(ribW), 1));
  ribs.frustumCulled = false; course.add(ribs);
  await ctx.yield();

  // --- the three viaducts of the hall: storeys of round arches, each nested three lines deep, tan and graphite
  const NCELL = 14, PITCH = (HZ1 - HZ0) / NCELL, SPAN = 7.6, HC = 23.5, YS = HC - 2.6 - SPAN, DKW = 5.5;
  const Cg = new Geo();
  { const ac = Math.atan2(HC - YS, PITCH / 2), ang = [];
    for (let i = 0; i <= 12; i++) ang.push(Math.PI * (1 - i / 12));
    ang.push(ac, Math.PI - ac); ang.sort((a, b) => b - a);
    const arc = ang.map((a) => [Math.cos(a) * SPAN, Math.sin(a) * SPAN]);
    const out = ang.map((a) => { const t = Math.min(PITCH / 2 / Math.abs(Math.cos(a)), (HC - YS) / Math.abs(Math.sin(a))); return [Math.cos(a) * t, Math.sin(a) * t]; });
    for (const sx of [-DKW, DKW]) {
      for (const sg of [-1, 1]) Cg.quad([sx, 0, sg * PITCH / 2, sg * PITCH / 2, -YS, SPAN, 0], [sx, 0, sg * SPAN, sg * SPAN, -YS, SPAN, 0], [sx, YS, sg * SPAN, sg * SPAN, 0, SPAN, 0], [sx, YS, sg * PITCH / 2, sg * PITCH / 2, 0, SPAN, 0]);
      for (let i = 0; i < ang.length - 1; i++) Cg.quad([sx, YS + arc[i][1], arc[i][0], arc[i][0], arc[i][1], SPAN, 0], [sx, YS + out[i][1], out[i][0], out[i][0], out[i][1], SPAN, 0], [sx, YS + out[i + 1][1], out[i + 1][0], out[i + 1][0], out[i + 1][1], SPAN, 0], [sx, YS + arc[i + 1][1], arc[i + 1][0], arc[i + 1][0], arc[i + 1][1], SPAN, 0]);
    }
    Cg.quad([0, 0, -SPAN, 0, 0, 0, 3], [0, 0, SPAN, 0, 0, 0, 3], [0, YS + SPAN, SPAN, 0, 0, 0, 3], [0, YS + SPAN, -SPAN, 0, 0, 0, 3]);   // black behind the arch
    const inn = [[-SPAN, -YS], ...arc, [SPAN, -YS]];
    for (let i = 0; i < inn.length - 1; i++) Cg.quad([-DKW, YS + inn[i][1], inn[i][0], 0, 0, 0, 2], [DKW, YS + inn[i][1], inn[i][0], 0, 1, 0, 2], [DKW, YS + inn[i + 1][1], inn[i + 1][0], 0, 1, 0, 2], [-DKW, YS + inn[i + 1][1], inn[i + 1][0], 0, 0, 0, 2]);
  }
  const storeys = [1, 4, 7], cellM = [];
  for (let t = 0; t < 3; t++) {
    const sy = (TIER[t] - HFLOOR) / storeys[t] / HC;
    for (let s = 0; s < storeys[t]; s++) for (let c = 0; c < NCELL; c++) {
      m4.makeScale(1, sy, 1).setPosition(LINE[t] - 1, HFLOOR + s * HC * sy, HZ0 + (c + 0.5) * PITCH); cellM.push(m4.clone());
    }
  }
  const arcade = arcadeMaterial({ instanced: true, side: THREE.DoubleSide, un });
  const cells = new THREE.InstancedMesh(Cg.build(), arcade, cellM.length);
  cellM.forEach((m, i) => cells.setMatrixAt(i, m)); cells.frustumCulled = false; course.add(cells);
  await ctx.yield();

  // --- rails: decks of the viaducts, tunnel floors (tan lines on black), the two ledges across the face
  const Tg = new Geo(), Xg = new Geo(), XBZ = HZ0 + 8.5 * PITCH, XBY = HFLOOR + 3 * HC;   // XBZ, XBY: the nave bridge's line and deck
  for (let t = 0; t < 3; t++) { const x = LINE[t] - 1, y = TIER[t] + 0.02;
    Tg.quad([x - DKW, y, HZ0, HZ0, -DKW, 3, 0], [x - DKW, y, HZ1, HZ1, -DKW, 3, 0], [x + DKW, y, HZ1, HZ1, DKW, 3, 0], [x + DKW, y, HZ0, HZ0, DKW, 3, 0]); }
  for (const T of tunnels) { const x = T.x - 1;
    Tg.quad([x - 7.3, T.y0 + 0.12, T.z0, T.z0, -7.3, 3, 4], [x - 7.3, T.y1 + 0.12, T.z1, T.z1, -7.3, 3, 4], [x + 9.3, T.y1 + 0.12, T.z1, T.z1, 9.3, 3, 4], [x + 9.3, T.y0 + 0.12, T.z0, T.z0, 9.3, 3, 4]); }
  { const x = LINE[1] - 1, ya = bayY(BAYZ) + 0.12, yb = bayY(bayZ1 + 0.5) + 0.12, zb = bayZ1 + 0.5;      // the two lines across the balcony's deck
    Tg.quad([x - 6.6, ya, BAYZ, BAYZ, -6.6, 3, 4], [x - 6.6, yb, zb, zb, -6.6, 3, 4], [x + 6.6, yb, zb, zb, 6.6, 3, 4], [x + 6.6, ya, BAYZ, BAYZ, 6.6, 3, 4]); }
  // THE BRIDGE ACROSS THE NAVE: three storeys of three round arches from tier three's arcade to tier two's, level with their
  // third storey line; a train crosses it in profile as the eye climbs to its deck (the world's u decides when)
  { const R = 6.6, P = 19, ysp = HC - 2.6 - R, xc = [-22, -3, 16];
    for (let st = 0; st < 3; st++) { const yb = HFLOOR + st * HC;
      for (const cx of xc) for (const sz of [-DKW, DKW]) {
        const xa = cx === xc[0] ? -35.5 : cx - P / 2, xb = cx === xc[2] ? 21.5 : cx + P / 2, z = XBZ + sz;
        const V = (x, y) => [x, yb + y, z, x - cx, y - ysp, R, 1];
        Xg.quad(V(xa, 0), V(cx - R, 0), V(cx - R, ysp), V(xa, ysp)); Xg.quad(V(cx + R, 0), V(xb, 0), V(xb, ysp), V(cx + R, ysp));
        Xg.tri(V(xa, ysp), V(cx - R, ysp), V(xa, HC)); Xg.tri(V(cx + R, ysp), V(xb, ysp), V(xb, HC));
        for (let i = 0; i < 14; i++) { const a0 = Math.PI * (1 - i / 14), a1 = Math.PI * (1 - (i + 1) / 14);
          const o0 = clamp(cx + (P / 2) * clamp(Math.cos(a0) * 1.5, -1, 1), xa, xb), o1 = clamp(cx + (P / 2) * clamp(Math.cos(a1) * 1.5, -1, 1), xa, xb);
          Xg.quad(V(cx + R * Math.cos(a0), ysp + R * Math.sin(a0)), V(o0, HC), V(o1, HC), V(cx + R * Math.cos(a1), ysp + R * Math.sin(a1))); }
      }
      for (const cx of xc) { const inn = [[-R, 0]]; for (let i = 0; i <= 14; i++) { const a = Math.PI * (1 - i / 14); inn.push([R * Math.cos(a), ysp + R * Math.sin(a)]); } inn.push([R, 0]);   // soffits, ruled across
        for (let i = 0; i < inn.length - 1; i++) Xg.quad([cx + inn[i][0], yb + inn[i][1], XBZ - DKW, 0, 0, 0, 2], [cx + inn[i][0], yb + inn[i][1], XBZ + DKW, 0, 1, 0, 2], [cx + inn[i + 1][0], yb + inn[i + 1][1], XBZ + DKW, 0, 1, 0, 2], [cx + inn[i + 1][0], yb + inn[i + 1][1], XBZ - DKW, 0, 0, 0, 2]); }
    }
    course.add(new THREE.Mesh(Xg.build(), arcadeMaterial({ side: THREE.DoubleSide, un })));
    Tg.quad([-41, XBY + 0.03, XBZ - DKW, -41, -DKW, 0, 0], [-41, XBY + 0.03, XBZ + DKW, -41, DKW, 0, 0], [27, XBY + 0.03, XBZ + DKW, 27, DKW, 0, 0], [27, XBY + 0.03, XBZ - DKW, 27, -DKW, 0, 0]); }
  const ledgeZ = (t, x) => ZF + LD * t - LD / 2 + bow(x);                  // ledge t (1, 2) runs across the face at TIER[t]
  const ledgeHalf = [0, 0, 0];
  for (let t = 1; t < 3; t++) {
    let xe = HW; while (xe > 50 && env(xe) < TIER[t] + 9) xe -= 4; ledgeHalf[t] = xe;
    for (let i = 0; i < 48; i++) { const xa = lerp(-xe, xe, i / 48), xb = lerp(-xe, xe, (i + 1) / 48), y = TIER[t] + 0.25;
      Tg.quad([xa, y, ledgeZ(t, xa) - 2.6, xa, -1.5, 0, 0], [xa, y, ledgeZ(t, xa) + 2.6, xa, 1.5, 0, 0], [xb, y, ledgeZ(t, xb) + 2.6, xb, 1.5, 0, 0], [xb, y, ledgeZ(t, xb) - 2.6, xb, -1.5, 0, 0]); }
  }
  const track = trackMaterial({ side: THREE.DoubleSide, un });
  course.add(new THREE.Mesh(Tg.build(), track));
  await ctx.yield();

  // --- trains: one engine geometry, one car geometry (local +z = forward, wheels on y 0)
  const box = (G, x0, x1, y0, y1, z0, z1, wSide, wEnd, top) => {
    const h = y1 - y0;
    for (const x of [x0, x1]) G.quad([x, y0, z0, z0, 0, h, wSide], [x, y0, z1, z1, 0, h, wSide], [x, y1, z1, z1, 1, h, wSide], [x, y1, z0, z0, 1, h, wSide]);
    for (const z of [z0, z1]) G.quad([x0, y0, z, 0, 0, h, wEnd], [x1, y0, z, 1, 0, h, wEnd], [x1, y1, z, 1, 1, h, wEnd], [x0, y1, z, 0, 1, h, wEnd]);
    if (top >= 0) G.quad([x0, y1, z0, z0, 0, 1, top], [x0, y1, z1, z1, 0, 1, top], [x1, y1, z1, z1, 1, 1, top], [x1, y1, z0, z0, 1, 1, top]);
  };
  const roof = (G, hw, y, rise, z0, z1) => {           // a low arched roof, ruled along its length
    const N = 5; for (let i = 0; i < N; i++) { const a0 = i / N, a1 = (i + 1) / N;
      const p0 = [-hw + 2 * hw * a0, y + rise * Math.sin(Math.PI * a0)], p1 = [-hw + 2 * hw * a1, y + rise * Math.sin(Math.PI * a1)];
      G.quad([p0[0], p0[1], z0, z0, a0, 1, 1], [p0[0], p0[1], z1, z1, a0, 1, 1], [p1[0], p1[1], z1, z1, a1, 1, 1], [p1[0], p1[1], z0, z0, a1, 1, 1]); }
    for (const z of [z0, z1]) for (let i = 0; i < N; i++) { const a0 = i / N, a1 = (i + 1) / N; G.tri([-hw + 2 * hw * a0, y, z, 0, 0, 0, 4], [-hw + 2 * hw * a0, y + rise * Math.sin(Math.PI * a0), z, 0, 0, 0, 4], [-hw + 2 * hw * a1, y + rise * Math.sin(Math.PI * a1), z, 0, 0, 0, 4]); G.tri([-hw + 2 * hw * a0, y, z, 0, 0, 0, 4], [-hw + 2 * hw * a1, y + rise * Math.sin(Math.PI * a1), z, 0, 0, 0, 4], [-hw + 2 * hw * a1, y, z, 0, 0, 0, 4]); }
  };
  const wheel = (G, x, z, r) => { for (const sx of [-x, x]) G.quad([sx, 0, z - r, -1, -1, r, 5], [sx, 0, z + r, 1, -1, r, 5], [sx, 2 * r, z + r, 1, 1, r, 5], [sx, 2 * r, z - r, -1, 1, r, 5]); };
  const cyl = (G, r0, r1, y0, y1, cx, cz, n, w) => { for (let i = 0; i < n; i++) { const a = (i / n) * 6.2832, b = ((i + 1) / n) * 6.2832;
    G.quad([cx + Math.cos(a) * r0, y0, cz + Math.sin(a) * r0, i / n, 0, 1, w], [cx + Math.cos(b) * r0, y0, cz + Math.sin(b) * r0, (i + 1) / n, 0, 1, w], [cx + Math.cos(b) * r1, y1, cz + Math.sin(b) * r1, (i + 1) / n, 1, 1, w], [cx + Math.cos(a) * r1, y1, cz + Math.sin(a) * r1, i / n, 1, 1, w]); } };
  const carG = new Geo();
  box(carG, -1.3, 1.3, 0.72, 3.25, -3.5, 3.5, 0, 2, -1); roof(carG, 1.42, 3.25, 0.34, -3.62, 3.62);
  box(carG, -0.95, 0.95, 0.45, 0.72, -3.8, 3.8, 4, 4, -1); wheel(carG, 1.37, -2.1, 0.78); wheel(carG, 1.37, 2.1, 0.78);
  const engG = new Geo();
  box(engG, -1.35, 1.35, 0.95, 3.5, -4.5, -1.9, 0, 2, -1); roof(engG, 1.5, 3.5, 0.5, -4.7, -1.6);
  box(engG, -1.4, 1.4, 0.8, 0.98, -4.5, 4.2, 4, 4, 4);
  { const R = 1.12, cy = 2.15, n = 14;                                   // the ruled boiler
    for (let i = 0; i < n; i++) { const a = (i / n) * 6.2832, b = ((i + 1) / n) * 6.2832;
      engG.quad([Math.cos(a) * R, cy + Math.sin(a) * R, -1.9, -1.9, i / n, 1, 1], [Math.cos(a) * R, cy + Math.sin(a) * R, 3.6, 3.6, i / n, 1, 1], [Math.cos(b) * R, cy + Math.sin(b) * R, 3.6, 3.6, (i + 1) / n, 1, 1], [Math.cos(b) * R, cy + Math.sin(b) * R, -1.9, -1.9, (i + 1) / n, 1, 1]); }
    engG.quad([-1.3, cy - 1.3, 3.64, -1, -1, 1, 6], [1.3, cy - 1.3, 3.64, 1, -1, 1, 6], [1.3, cy + 1.3, 3.64, 1, 1, 1, 6], [-1.3, cy + 1.3, 3.64, -1, 1, 1, 6]); }
  cyl(engG, 0.3, 0.36, 3.15, 3.75, 0, 2.6, 8, 2); cyl(engG, 0.36, 0.62, 3.75, 4.05, 0, 2.6, 8, 4);   // funnel and its flare
  cyl(engG, 0.5, 0.42, 3.15, 3.55, 0, 0.5, 8, 2); cyl(engG, 0.42, 0.05, 3.55, 3.72, 0, 0.5, 8, 4);     // dome
  wheel(engG, 1.44, -3.1, 0.95); wheel(engG, 1.44, -0.9, 0.95); wheel(engG, 1.44, 1.1, 0.95); wheel(engG, 1.44, 3.0, 0.62);
  for (const sx of [-1, 1]) engG.quad([sx * 1.5, 0.82, -3.3, 0, 0, 0, 4], [sx * 1.5, 0.82, 1.3, 0, 0, 0, 4], [sx * 1.5, 1.06, 1.3, 0, 0, 0, 4], [sx * 1.5, 1.06, -3.3, 0, 0, 0, 4]);   // coupling rod
  engG.quad([-1.3, 0.2, 4.75, -1.3, 0, 0.9, 0], [1.3, 0.2, 4.75, 1.3, 0, 0.9, 0], [1.1, 1.0, 4.2, 1.1, 1, 0.9, 0], [-1.1, 1.0, 4.2, -1.1, 1, 0.9, 0]);   // striped pilot
  for (const sx of [-1, 1]) engG.tri([sx * 1.3, 0.2, 4.75, 0, 0, 0, 4], [sx * 1.1, 1.0, 4.2, 0, 0, 0, 4], [sx * 1.25, 0.2, 4.2, 0, 0, 0, 4]);
  await ctx.yield();

  // --- routes. A train is an engine and cars placed along a route by one number (engine distance), set from u.
  const tan8 = Math.tan(8 * Math.PI / 180);
  const lineRoute = (x, t, dir) => ({               // straight through the mountain on a tier; s is course z
    at(s, o) { const y = t === 1 && s > 170 ? 70 - (s - 170) * tan8 : TIER[t]; o.p.set(x, y, s); o.f.set(0, t === 1 && s > 170 ? -tan8 * dir : 0, dir).normalize(); },
    dir, lo: t === 0 ? -345 : -212, hi: t === 2 ? 150 : (t === 1 ? 168 : 250) });
  const ledgeRoute = (t, ma, mb) => {               // out of mouth ma, a quarter turn, along the ledge, into mouth mb
    const A = mouths[ma].p, Bm = mouths[mb].p, sg = Math.sign(Bm[0] - A[0]), pts = [];
    for (let i = 0; i <= 10; i++) pts.push([A[0], A[2] + 70 - i * 7]);
    const xa = A[0] + sg * 11, za = ledgeZ(t, xa), xb = Bm[0] - sg * 11, zb = ledgeZ(t, xb);
    for (let i = 1; i <= 8; i++) { const a = (i / 8) * Math.PI / 2; pts.push([A[0] + sg * 11 * (1 - Math.cos(a)), A[2] + (za - A[2]) * Math.sin(a)]); }
    const n = Math.ceil(Math.abs(xb - xa) / 4);
    for (let i = 1; i <= n; i++) { const x = lerp(xa, xb, i / n); pts.push([x, ledgeZ(t, x)]); }
    for (let i = 1; i <= 8; i++) { const a = (i / 8) * Math.PI / 2; pts.push([xb + sg * 11 * Math.sin(a), zb + (Bm[2] - zb) * (1 - Math.cos(a))]); }
    for (let i = 1; i <= 10; i++) pts.push([Bm[0], Bm[2] + i * 7]);
    const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const S = cum[cum.length - 1];
    return { S, lo: 4, hi: S - 4, dir: 1, sillA: 70, sillB: S - 70, ma, mb,
      at(s, o) { const q = clamp(s, 0, S - 0.01); let i = 1; while (cum[i] < q) i++;
        const k = (q - cum[i - 1]) / Math.max(cum[i] - cum[i - 1], 1e-4), a = pts[i - 1], b = pts[i];
        o.p.set(lerp(a[0], b[0], k), TIER[t], lerp(a[1], b[1], k)); o.f.set(b[0] - a[0], 0, b[1] - a[1]).normalize(); } };
  };
  const schemes = opts.wax === 'ochre' ? [1, 1, 0] : opts.wax === 'pencil' ? [2, 2, 2] : [0, 0, rng.chance(0.3) ? 1 : 0];
  const nFace = Math.max(3, Math.round(4 * detail));          // few cars: a ledge train is drawn KFACE times the size of the others
  const trains = [
    { r: lineRoute(LINE[0] - 4, 0, 1), cars: 10, sch: schemes[0], wall: [0, 3] },      // hall, tier one, beside the eye
    { r: lineRoute(LINE[1] - 4, 1, -1), cars: 10, sch: schemes[1], wall: [1, 4] },    // hall, tier two: passes in profile beside the eye
    { r: lineRoute(LINE[2] + 2, 2, 1), cars: 6, sch: schemes[2], wall: [2, 5] },      // hall, tier three
    { r: ledgeRoute(1, 3, 5), cars: nFace, sch: schemes[0], k: KFACE },                          // across the face, tier two ledge
    { r: ledgeRoute(2, 8, 6), cars: nFace, sch: schemes[1], k: KFACE },                      // across the face, tier three ledge
    // across the nave's bridge, out of tier two's arcade and into tier three's: engine and cars a size larger, in profile
    { r: { at(s, o) { o.p.set(27 - s, XBY + 0.03, XBZ); o.f.set(-1, 0, 0); }, lo: 0.5, hi: 67.5, dir: 1 }, cars: 6, sch: schemes[0], k: 1.45, cross: true },
  ];
  const rare = opts.rare ?? rng.chance(1 / 12);
  const peekAt = [0, 2, 4, 7];
  const nEng = trains.length + peekAt.length, nCar = trains.reduce((a, t) => a + t.cars, 0);
  const trainMat = trainMaterial({ side: THREE.DoubleSide, un });
  const engines = new THREE.InstancedMesh(engG.build(), trainMat, nEng), cars = new THREE.InstancedMesh(carG.build(), trainMat, nCar);
  const eAttr = new THREE.InstancedBufferAttribute(new Float32Array(nEng * 4), 4), cAttr = new THREE.InstancedBufferAttribute(new Float32Array(nCar * 4), 4);
  eAttr.setUsage(THREE.DynamicDrawUsage); cAttr.setUsage(THREE.DynamicDrawUsage);
  { let c = 0; trains.forEach((T, i) => { eAttr.setXYZW(i, 0, T.sch, 0, rng()); T.c0 = c; for (let j = 0; j < T.cars; j++) cAttr.setXYZW(c++, 0, T.sch, 0, rng()); });
    peekAt.forEach((_, i) => eAttr.setXYZW(trains.length + i, 0, schemes[i % 3], 0, rng())); }
  for (const im of [engines, cars]) { im.geometry.setAttribute('aTrain', im === engines ? eAttr : cAttr); im.geometry.setAttribute('aWaxI', new THREE.InstancedBufferAttribute(new Float32Array(im.count), 1)); im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); im.frustumCulled = false; course.add(im); }
  const NPUFF = Math.round(9 * detail), smokeG = new THREE.PlaneGeometry(2, 2);
  const smoke = new THREE.InstancedMesh(smokeG, smokeMaterial({ un }), nEng * NPUFF);
  smoke.instanceMatrix.setUsage(THREE.DynamicDrawUsage); smoke.frustumCulled = false; course.add(smoke);
  await ctx.yield();

  // --- motion. Everything scripted is a function of the world's u (setProgress); only rub runs, wheels' phase from
  // distance, and smoke loops run on time. Until setProgress is called (the set-piece viewer) u is looped from time.
  let progress = -1, eyeZ = null;
  const o = { p: new THREE.Vector3(), f: new THREE.Vector3() }, X = new THREE.Vector3(), Y = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0);
  const engState = []; for (let i = 0; i < nEng; i++) engState.push({ p: new THREE.Vector3(), f: new THREE.Vector3(0, 0, 1), on: false, v: 1 });
  const ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
  const Z3 = new THREE.Vector3();
  const place = (im, i, show, k = 1) => {
    if (!show) { im.setMatrixAt(i, ZERO); return; }
    X.crossVectors(UP, o.f).normalize(); Y.crossVectors(o.f, X);
    m4.makeBasis(X.multiplyScalar(k), Y.multiplyScalar(k), Z3.copy(o.f).multiplyScalar(k)).setPosition(o.p); im.setMatrixAt(i, m4);
  };
  const pmod = (a, b) => ((a % b) + b) % b;
  const ring = (r) => (r > 0 && r < 130 ? r : -1);
  const peekA = rng.int(0, 1), peekB = 2 + rng.int(0, 1);
  const ez0 = () => eyeZ ?? (progress < 0 ? -40 : HZ0 + (progress - 0.463) * 1443);
  function update(dt, time) {
    un.uTime.value = time;
    un.uCross.value = smoothstep(-10, 70, ez0());            // the hall's rib faces turn colour as the eye crosses
    const auto = progress < 0, U = auto ? 0.47 + ((time * 0.008) % 0.2) : progress, ft = auto ? 7.14 + time * 0.8 : U * 42;
    // the hall's three trains follow the eye's course z (ez): tier one runs level with us, tier two comes out of the far wall
    // and passes in profile beside the eye as it reaches that deck (ez -6: engine 34 m ahead; its last car at ez 76), tier three overhead
    const ez = ez0();
    // tier one's train creeps to the mouth while the eye crosses the valley, goes in just ahead of it (its last cars beside
    // the eye at the sill), then draws 96 m ahead so its smoke stands clear of the climb up the nave
    const lx = -324 - ez, lead = 62 + 34 * smoothstep(-290, -190, ez) + 34 * smoothstep(-262, -172, ez) + 0.375 * (Math.sqrt(lx * lx + 400) + lx);
    const zs = [clamp(ez + lead, -345, 330), clamp(28 - (ez + 6) * 0.5, -330, 240), clamp(ez + 30, -245, 240)];
    trains.forEach((T, i) => {
      const R = T.r, k = T.k || 1, L = (10 + T.cars * 7.9) * k;
      let s;
      if (i < 3) { s = zs[i];
        walls.userData.shiver(T.wall[0], ring((R.dir > 0 ? s - HZ0 : HZ0 - s) * 1.3));
        walls.userData.shiver(T.wall[1], ring((R.dir > 0 ? s - HZ1 : HZ1 - s) * 1.3));
      } else if (T.cross) { s = 62 + (ez + 43) * 1.7;       // its engine is at the far arch when the eye, 43 m off, is level with the deck
      } else { s = pmod(R.sillA + 40 + (ft - (i === 3 ? 7.14 : 9.2)) * (i === 3 ? 26 : 22), R.S + L + 40);
        paper.userData.shiver(R.ma, ring((s - R.sillA) * 1.4)); paper.userData.shiver(R.mb, ring((s - R.sillB) * 1.4)); }
      const on = s > R.lo && s < R.hi; R.at(s, o); place(engines, i, on, k);
      const E = engState[i]; E.p.copy(o.p); E.f.copy(o.f); E.on = on || (!!T.cross && s >= R.hi && s < R.hi + 70); E.v = 1; E.k = k;   // the bridge train's smoke is drawn into the arch after it, not snuffed
      eAttr.setX(i, s / (0.95 * k));
      for (let j = 0; j < T.cars; j++) { const sj = s - R.dir * (9 + j * 7.9) * k; R.at(sj, o); place(cars, T.c0 + j, sj > R.lo && sj < R.hi, k); cAttr.setX(T.c0 + j, sj / (0.78 * k)); }
    });
    peekAt.forEach((mi, i) => {
      const m = mouths[mi], on = rare || i === peekA || i === peekB;
      let e = on ? smoothstep(0.19, 0.215, U) * (1 - smoothstep(0.3, 0.34, U)) : 0, r = on ? (U - 0.19) * 42 * 16 : -1;
      if (auto) { e = 0.5 + 0.5 * Math.sin(time * 0.25 + i * 1.7); r = ((time * 14 + i * 37) % 190); }
      const k = (m.leg + m.r) / 3.6, z = m.p[2] + 3.64 * k + lerp(5, i < 2 ? -6 : -2.5, e);   // its face 5 m inside the dark, then out past the lip
      o.p.set(m.p[0], m.p[1], z); o.f.set(0, 0, -1);
      place(engines, trains.length + i, on || auto, k); eAttr.setX(trains.length + i, z / (0.95 * k));
      const E = engState[trains.length + i]; E.p.copy(o.p); E.f.copy(o.f); E.on = e > 0.02 || auto; E.v = 0.12; E.k = k * 0.8;
      paper.userData.shiver(mi, ring(r));
    });
    for (let ei = 0; ei < nEng; ei++) { const E = engState[ei];
      for (let k = 0; k < NPUFF; k++) { const a = (k / NPUFF + time * 0.2 + ei * 0.37) % 1, idx = ei * NPUFF + k;
        if (!E.on) { smoke.setMatrixAt(idx, ZERO); continue; }
        const K = E.k || 1, sc = K * (0.7 + 4.6 * a) * Math.min(1, (1 - a) / 0.2, a / 0.06), back = K * (a * 34 * E.v - 2.6);
        m4.makeScale(sc, sc, sc).setPosition(E.p.x - E.f.x * back + Math.sin(a * 9 + ei) * 0.8 * a * K, E.p.y + K * (4.6 + a * (9 + 16 * a) + (1 - E.v) * a * 10), E.p.z - E.f.z * back);
        smoke.setMatrixAt(idx, m4); } }
    engines.instanceMatrix.needsUpdate = true; cars.instanceMatrix.needsUpdate = true; smoke.instanceMatrix.needsUpdate = true;
    eAttr.needsUpdate = true; cAttr.needsUpdate = true;
  }
  update(0, 0);

  // --- anchors, in the object's local space (course x and z negated). The flight line keeps 6 m from everything
  // except through the arch (4 m to the piers) and beside the tunnel ribs (5.5 m).
  const Lc = (x, y, z) => new THREE.Vector3(-x, y, -z);
  const PZ = HZ0 + 9.5 * PITCH, zX = ZB - bow(LINE[1]);
  const fly = [[0, 4, -640], [0, 4, -420], [0, 4, ZF], [0, 4, HZ0], [3, 8, -138], [10, 24, -84], [14, 40, -24], [16, 50, PZ - 18], [21, 54.5, PZ - 3.5], [27, 56, PZ], [33, 57.5, PZ + 3.5], [38.5, 61, PZ + 14], [39, 67.5, PZ + 36], [34.5, 72.5, PZ + 62], [30, 74, HZ1], [30, 74, 170], [30, exitY + 4, zX], [30, exitY + 4 - 14 * tan8, zX + 14]];
  const anchors = {
    valleyView: Lc(0, 4, -640),                      // the reveal: the whole thumbprint, 360 m off the face
    frontMouth: Lc(LINE[0], 0, ZF + bow(LINE[0])),   // sill centre of the middle bottom mouth (16 x 10 m); tracks at course x 0 and -6
    hallEntry: Lc(0, 4, HZ0), hallCentre: Lc(0, 60, -20), archPass: Lc(27, 56, PZ),
    hallExit: Lc(30, 74, HZ1),                       // the tier two mouth in the far wall, eye on the starboard track
    backMouth: Lc(LINE[1], exitY, zX),               // sill centre of the back mouth, 54 m up: start the falling viaduct here
    backDir: new THREE.Vector3(0, -Math.sin(8 * Math.PI / 180), -Math.cos(8 * Math.PI / 180)),   // tunnel axis at the back mouth (local)
    portalSeat: { position: Lc(30, exitY + 4.75, zX), facing: new THREE.Vector3(0, 0, 1) },      // if a portal ever sat in the back D
    flyThrough: fly.map((q) => Lc(q[0], q[1], q[2])),
    mouths: mouths.map((m) => ({ position: Lc(m.p[0], m.p[1], m.p[2]), facing: new THREE.Vector3(0, 0, -m.n[1]) })),
    ledges: [1, 2].map((t) => ({ y: TIER[t], half: ledgeHalf[t], z: (xLocal) => -ledgeZ(t, -xLocal) })),
  };
  const dbg = opts.dbg || null;                      // set-piece viewer framing only (opts.dbg)
  const view = dbg === 'hall' ? { radius: 22, height: 50, center: Lc(0, 52, -40), ground: false }
    : dbg === 'mouth' ? { radius: 14, height: 16, center: Lc(-2, 6, ZF - 2), ground: true }
    : dbg === 'train' ? { radius: 11, height: 14, center: Lc(-6, 3, 12), ground: false }
    : dbg === 'rib' ? { radius: 0, height: 4, center: new THREE.Vector3(-20, 73, -145), ground: false }
    : dbg === 'engine' ? { radius: 4, height: 8, center: Lc(-6, 2.5, 42), ground: false }
    : dbg === 'face' ? { radius: 110, height: 150, center: Lc(0, 80, ZF + 40), ground: true }
    : { radius: 420, height: HH, center: new THREE.Vector3(0, 130, 0), ground: true };
  return {
    object, course, ...view, groundY: -0.05, anchors, update, uniforms: un,
    setProgress(u, ez) { progress = u; eyeZ = ez ?? null; },   // ez: the eye's course z (optional; the hall trains follow it)
    materials: { paper, walls, wax, arcade, track, train: trainMat, black },
    geos: { engine: engines.geometry, car: cars.geometry },          // for the world's own trains: clone, then give the clone its own aTrain / aWaxI
    mouths, altar, shiver: (i, r) => paper.userData.shiver(i, r),
    dispose() {},
  };
}

// geometry helpers for the world file (same Geo soup, same D outline, ribs and tubes as the hero)
export { Geo, dOutline, addRib, addTube };
