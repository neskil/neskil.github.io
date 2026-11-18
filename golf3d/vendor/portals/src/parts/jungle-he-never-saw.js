// THE LOTUS STAND: hero set piece of "The Jungle He Never Saw" (after Henri Rousseau, 1844-1910).
// Twelve lotus blooms as big as houses on jointed stalks standing in flat pale water, a monkey with an
// orange seated in the heart of the tallest. Everything is a BLADE: one unlit ShaderMaterial family,
// real cut outlines (no alpha), one smooth grade per blade (dark lower right -> light upper left ON
// SCREEN, whatever way the blade faces), a ruled midrib, the two halves a tone apart. No light, no fog.
//
// HOW THE STYLE IS MADE (exports; the world coder shades the whole world with these)
//   JNS_PALETTE            the seven pigments of the brief, in order.
//   jnsGreens(palette)     the forty greens: array of 40 THREE.Color mixed from the four green pigments,
//                          dark to light. A plant takes two neighbours (dark = g[i], light = g[i+6..10]).
//   JNS_BLADE_VERT / JNS_BLADE_FRAG   the GLSL of the one blade routine (hinge, nod, swing, grade, rib).
//   makeJnsStyle(palette)  -> { pig, greens, uniforms, material, geoms, set(), flat(), sky(), dispose-free }
//       .uniforms          shared: uU (journey progress 0..1, set by the world every frame), uTime,
//                          uWave (vec4: the u at which the four nod waves start), uShut (vec2: fronts of
//                          the closing and opening wave for blooms), uLean (0..1: every plant stands nodded
//                          leeward, the rain variation).
//       .material          THE material (one program) for every blade mesh.
//       .geoms             the cut outlines: spear, sword, paddle, heart, fern, fan, grass, petal, disc,
//                          stalk. x in -1..1 across, y in 0..1 along, 6-30 triangles each.
//       .set(maxPerShape)  -> JnsBladeSet: collects blades per shape and makes one instanced Mesh per shape
//                          (blade(), plant(), finish()). See the class below: this is how 2,600 plants are laid.
//       .flat(hexOrColor, opts)   unlit flat-pigment material for the bank, pool (ruled ripples keyed to uU)
//                          and anything that is not a blade.
//       .sky(opts)         sky dome material: a flat grade in three stops (top, mid, low) and the hard disc drawn with
//                          an fwidth edge; opts.stand lets the low stop stand flat from the horizon up to that sine
//                          and then runs one smooth grade through mid to top. Follow the camera with the dome.
//   jnsMonkey(set, rng, at, opts), jnsEyes(set, at, size)   the wooden-toy monkey and a pair of round eyes, as blades.
//   jnsLotus(set, rng, o)  one jointed stalk with paddle leaves and a 28-petal bloom (the hero is twelve of these).
//                          o.lite: a small lotus seen only from far (petals cut as spear blades, no stamens or seeds: under half the triangles).
//   plant(rng, { ..., dark: n }) fans n green-black blades behind the plant in its own plane (the paint between flats);
//   jnsEyes brings its own green-black leaf gap and a blade edge across one eye. The great bloom is 24 m across (R 12);
//   four of the eleven others are tall (hearts 79 to 92 m): three to port over the disc's bearing, one beyond the great bloom.
//   Motion, all in the vertex shader: the HINGE (reads the render camera, so it is right through a portal too); the NOD
//   (12 deg in the plant's own plane, hold, return, one overshoot) when a wave front passes the plant's waveS: fronts
//   start at uWave and run at 2.5x the journey, a pure function of uU; one plant in thirty nods alone on uTime, and an
//   ambient wave (0.45 of a nod, slow) runs up the path every 7.3 s on uTime so a held view and the portal preview are alive; the
//   SWING (iPlant.w = +-u: the plant turns 70 deg on its stalk as uU passes it and nods back: give the six ranks
//   rising values, sign = side); wag/bob (iAnim) for an arm, a thrown orange, a stepping leg. on uTime; an iAnim speed below
//   zero keys the wag to uU instead (|speed| radians over the whole flight): the perched birds' wing.
//   Blade modes (iAxis.w): 0 pressed plant: the whole plant is one plane that HINGES about its stalk toward the
//   lens (yaw limit iPlant.x, pitch back up to 35 deg); 1 axis blade: axis fixed in space, the flat turns about
//   its own axis to face the lens (stalk joints: a ribbon that reads as a painted cylinder); 2 lying flat
//   (pads); 3 petal: as 1 plus the fan (opens/shuts 5 deg as a nod wave passes, folds shut by uShut).
//   post for the world: { flat: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } }.
//   No inverse tone map anywhere: a pigment written is the pigment shown.
//
// buildHero(ctx, opts): opts.palette (7 hex), opts.detail (0.6..1: thins pads' and backdrop's blades only),
//   opts.backdrop (default true, which is what the set-piece viewer gets; a world passes false: then the hero adds no
//   sky, bank or shore wall and the world builds those with the exports), opts.shut (rare event: the stand
//   folds from u 0.36 and the great bud opens beside us from u 0.47, open by 0.495, so the closest frame at 0.5 has its petals), opts.uSpan [u0,u1] (journey u at which
//   the path enters the pool and leaves the great bloom; default [0.26, 0.56]), opts.pads (default true),
//   opts.pool (default true: the flat pale water disc, radius 75, at local y 0).
// Returned: object (origin = centre of the ring at water level, +Y up, FRONT = +Z: the camera arrives from
//   +Z travelling toward -Z; in the world: object.rotation.y = Math.PI puts front toward the entry),
//   radius 75, height 82, center, anchors, update(dt,time,camera), setProgress(u), style (the object from
//   makeJnsStyle, so the world shares uniforms and material), dispose().
// anchors (local space, metres): see the end of buildHero.
// Cost: about 27k triangles, 1,400 blades, 9 draw calls (8 blade shapes + pool), one program for all blades; build
//   under 15 ms, no step over 6 ms. With the viewer backdrop: about 106k triangles, 14 draw calls, 60-90 ms.
// Expects around it (the world's job): the dark bank from the pool edge (r 75) outward, the lapped leaf wall on it,
//   the sky dome with the disc at anchors.sunDir, and nothing but water inside r 75. No lights, no fog.
import * as THREE from 'three';

export const JNS_PALETTE = ['#10261C', '#1F5A3A', '#4E8B3A', '#A6BF4F', '#BCD3CC', '#DE5B28', '#EFB4BE'];

export function jnsGreens(palette = JNS_PALETTE) {
  const p = palette.slice(0, 4).map((h) => new THREE.Color(h));
  const out = [];
  for (let i = 0; i < 40; i++) {           // 0 = green-black ... 39 = chrome yellow-green
    const t = 0.18 + (i / 39) * 2.82, k = Math.min(2, Math.floor(t)), f = t - k;
    out.push(p[k].clone().lerp(p[k + 1], f));
  }
  return out;
}

export const JNS_BLADE_VERT = /* glsl */`
attribute vec4 iPivot;   // xyz plant foot (object space), w rest yaw (0 = flat faces +Z)
attribute vec4 iPlant;   // x yaw limit of the hinge (rad), y waveS (journey u at which a nod wave reaches it), z phase 0..1, w swing: +-u at which the plant swings aside (0 = never)
attribute vec4 iBase;    // xyz blade foot in plant coords (x right, y up, z toward the lens), w layer
attribute vec4 iAxis;    // xyz blade axis in plant coords (unit), w mode 0..3
attribute vec4 iSize;    // x length, y width, z let-down to white toward the tip, w nod amount (1 = 12 deg)
attribute vec4 iColA;    // rgb dark pigment, a stripes across (count; 0 none)
attribute vec4 iColB;    // rgb light pigment, a side veins (count; 0 none; negative = no midrib)
attribute vec4 iAnim;    // x wag (rad), y bob (m), z speed (rad/s), w phase
uniform float uU, uTime, uLean;
uniform vec4 uWave;
uniform vec2 uShut;
varying vec2 vXY;
varying float vG;
varying vec3 vA, vB;
varying vec4 vFx;
float jnsPulse(float d) {
  float a = smoothstep(0., .008, d) * (1. - smoothstep(.034, .054, d));
  float o = sin(3.14159 * clamp((d - .054) / .032, 0., 1.));
  return a - .22 * o;
}
float jnsNod(float s, float ph) {
  vec4 d = (uWave + (uU - uWave) * 2.5 - s) * step(uWave, vec4(uU));
  float n = jnsPulse(d.x) + jnsPulse(d.y) + jnsPulse(d.z) + jnsPulse(d.w);
  float solo = step(.966, fract(ph * 7.13));
  n += solo * jnsPulse(fract(uTime * .06 + ph * 3.7) * .4);
  n += .45 * jnsPulse(mod(uTime * .03 - s - (ph - .5) * .2, .22));   // the ambient wave: every 7.3 s a slow half nod runs up the path on world time, its front ragged by plant
  n = min(n, 1.15);
  return mix(n, 1. - n, uLean);
}
void main() {
  mat3 M = mat3(modelMatrix);
  vec3 camL = (cameraPosition - modelMatrix[3].xyz) * M;
  vec3 camR = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]) * M;
  vec3 camU = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]) * M;
  float mode = iAxis.w;
  float m0 = 1. - step(.5, mode);
  vec3 d = camL - iPivot.xyz;
  if (abs(d.x) + abs(d.z) < 1e-3) d.z = 1e-3;
  float yaw = iPivot.w;
  float dy = mod(atan(d.x, d.z) - yaw + 3.14159265, 6.2831853) - 3.14159265;
  yaw += clamp(dy, -iPlant.x, iPlant.x) * m0;
  float sw = abs(iPlant.w);
  if (sw > 0.) {
    float k = smoothstep(sw - .014, sw + .004, uU) - .14 * sin(3.14159 * clamp((uU - sw - .004) / .02, 0., 1.));
    yaw += sign(iPlant.w) * 1.22 * k;
  }
  float pb = clamp(atan(d.y, length(d.xz) + 1e-3), -.2, .61) * m0 * step(.01, iPlant.x);
  vec3 R = vec3(cos(yaw), 0., -sin(yaw)), N = vec3(sin(yaw), 0., cos(yaw)), U = vec3(0., 1., 0.);
  vec3 U1 = U * cos(pb) - N * sin(pb), N1 = N * cos(pb) + U * sin(pb);
  float nod = jnsNod(iPlant.y, iPlant.z);
  float a = iSize.w * .21 * nod;
  vec3 R2 = R * cos(a) + U1 * sin(a), U2 = U1 * cos(a) - R * sin(a);
  vec3 b = iBase.xyz, ax = iAxis.xyz;
  float th = (iAnim.z < 0. ? -uU * iAnim.z : uTime * iAnim.z) + iAnim.w * 6.2831853;   // a speed below zero is keyed to the journey (radians per whole flight), not to world time
  float wg = iAnim.x * sin(th);
  ax.xy = vec2(ax.x * cos(wg) - ax.y * sin(wg), ax.x * sin(wg) + ax.y * cos(wg));
  b.y += iAnim.y * max(0., sin(th));
  if (mode > 2.5) {       // petal: the fan
    float shut = smoothstep(iPlant.y, iPlant.y + .03, uShut.x) * (1. - smoothstep(iPlant.y, iPlant.y + .03, uShut.y));
    float h = length(ax.xz);
    ax.y += h * (.12 * nod + .05 * sin(uTime * .5 + iPlant.z * 40.));
    ax = mix(ax, vec3(ax.x * .1, 1., ax.z * .1), shut * .92);
    b.xz *= 1. - .6 * shut;
    ax /= max(length(ax), 1e-4);
  }
  vec3 axW = R2 * ax.x + U2 * ax.y + N1 * ax.z;
  vec3 bW = iPivot.xyz + R2 * b.x + U2 * b.y + N1 * b.z;
  vec3 C = bW + axW * (iSize.x * .5);
  vec3 toCam = camL - C;
  toCam /= max(length(toCam), 1e-4);
  vec3 W, Nn;
  if (mode < .5) { W = R2 * ax.y - U2 * ax.x; Nn = N1; }
  else if (mode > 1.5 && mode < 2.5) { W = cross(vec3(0., 1., 0.), axW); W /= max(length(W), 1e-4); Nn = vec3(0., 1., 0.); }
  else {
    W = cross(axW, toCam); W /= max(length(W), 1e-4);
    W *= (dot(W, camR) < 0. ? -1. : 1.);
    Nn = toCam;
  }
  vec3 P = bW + axW * (position.y * iSize.x) + W * (position.x * iSize.y * .5) + Nn * (iBase.w * .03);
  vec3 L = normalize(camU - camR);
  vG = dot(P - C, L) / max(.5 * max(iSize.x, iSize.y), 1e-3);
  vXY = position.xy;
  vA = iColA.rgb; vB = iColB.rgb;
  vFx = vec4(iColA.a, iColB.a, iSize.z, iSize.y);
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(P, 1.);
  gl_Position.z -= iBase.w * 1.5e-6 * gl_Position.w;
}
`;

export const JNS_BLADE_FRAG = /* glsl */`
uniform vec3 uWhite;
varying vec2 vXY;
varying float vG;
varying vec3 vA, vB;
varying vec4 vFx;
void main() {
  float x = vXY.x, v = vXY.y;
  float fx = max(fwidth(x), 1e-5), fv = max(fwidth(v), 1e-5);
  float hasRib = step(0., vFx.y);
  float t = .5 + (smoothstep(-1.05, 1.05, vG) - .5) * .62;     // enamel: one local green per leaf, barely graded
  t = clamp(t + (x < 0. ? .19 : -.19) * hasRib, 0., 1.);       // the two halves a full tone apart at the rib
  vec3 c = mix(vA, vB, t);
  float n = vFx.x;
  if (n > .5) {                                                  // sword: striped across in two greens
    float tri = abs(fract(v * n) - .5) * 2.;
    float aa = clamp(fv * n * 2., 0., .5);
    float band = smoothstep(.5 - aa, .5 + aa, tri);
    band = mix(.5, band, smoothstep(3., 6., 1. / (n * fv)));
    c = mix(c, mix(vA, vB, t * .22), band * .9);
  }
  float k = vFx.y;
  if (k > .5) {                                                  // paddle: ruled side veins
    float q = (v - abs(x) * .3) * k;
    float dq = max(fwidth(q), 1e-5);
    float lw = max(.07, .75 * dq);
    float line = 1. - smoothstep(lw, lw + dq, abs(fract(q + .5) - .5));
    line *= 1. - smoothstep(.2, .34, dq);
    c = mix(c, mix(vB, vA, t), .3 * line);
  }
  c = mix(c, uWhite, vFx.z * smoothstep(.18, 1., v));            // white lets the tip down (petals, ruffs)
  float w = max(.022, .75 * fx);
  float r = (1. - smoothstep(w, w + fx, abs(x))) * hasRib;
  r *= smoothstep(4., 9., 2. / fx) * (1. - smoothstep(.86, .98, v));
  vec3 ribC = vFx.z > .01 ? vA : mix(vB, uWhite, .1);                 // petals: a deeper line; leaves: a light one
  c = mix(c, ribC, r * .85);
  gl_FragColor = vec4(c, 1.);
}
`;

// ---- the cut outlines -------------------------------------------------------------------------------
function jnsCut(half, flatTop = false, smooth = 0) {       // half: [[x,y],...] right edge from foot to tip; mirrored
  if (smooth) half = new THREE.SplineCurve(half.map(([x, y]) => new THREE.Vector2(x, y))).getPoints(smooth).map((p, i) => [i === smooth ? 0 : Math.max(0.02, p.x), p.y]);
  const pts = [];
  for (const [x, y] of half) pts.push(new THREE.Vector2(x, y));
  for (let i = half.length - 1; i >= 0; i--) {
    const [x, y] = half[i];
    if (x === 0 && !flatTop) continue;
    pts.push(new THREE.Vector2(-x, y));
  }
  const tris = THREE.ShapeUtils.triangulateShape(pts, []);
  const pos = new Float32Array(pts.length * 3);
  pts.forEach((p, i) => { pos[i * 3] = p.x; pos[i * 3 + 1] = p.y; });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setIndex(tris.flat());
  return g;
}
function jnsShapes() {
  const fern = [[0.1, 0]];
  for (let i = 0; i < 9; i++) {
    const y0 = 0.06 + (i / 9) * 0.9, y1 = y0 + 0.07, e = Math.sin(Math.PI * Math.pow((i + 0.6) / 9.6, 0.7));
    fern.push([0.14 + 0.1 * e, y0], [0.3 + 0.7 * e, y1 + 0.035], [0.16 + 0.12 * e, y1 + 0.03]);
  }
  fern.push([0, 1]);
  const disc = [];
  for (let i = 0; i <= 12; i++) { const a = (i / 12) * Math.PI; disc.push([i === 0 || i === 12 ? 0 : Math.sin(a), 0.5 - 0.5 * Math.cos(a)]); }
  const pad = [[0.0, 0.5], [0.16, 0.0]];          // a disc with a V cut to its centre
  for (let i = 1; i <= 11; i++) { const a = (i / 12) * Math.PI; pad.push([Math.sin(a), 0.5 - 0.5 * Math.cos(a)]); }
  pad.push([0, 1]);
  return {
    spear: jnsCut([[0.1, 0], [0.34, 0.07], [0.8, 0.22], [1, 0.42], [0.86, 0.64], [0.5, 0.85], [0, 1]]),
    sword: jnsCut([[0.45, 0], [0.86, 0.08], [1, 0.45], [0.9, 0.78], [0.5, 0.93], [0, 1]]),
    paddle: jnsCut([[0.07, 0], [0.09, 0.1], [0.62, 0.17], [0.94, 0.3], [1, 0.55], [0.9, 0.78], [0.62, 0.93], [0.26, 0.99], [0, 1]]),
    heart: jnsCut([[0, 0.14], [0.3, 0.02], [0.66, 0.0], [0.94, 0.12], [1, 0.32], [0.84, 0.56], [0.5, 0.8], [0, 1]]),
    fern: jnsCut(fern),
    fan: jnsCut([[0.12, 0], [0.3, 0.3], [0.8, 0.6], [1, 0.76], [0.62, 0.92], [0, 1]]),
    grass: jnsCut([[0.8, 0], [1, 0.3], [0.6, 0.72], [0, 1]]),
    petal: jnsCut([[0.16, 0], [0.5, 0.08], [0.9, 0.25], [1, 0.42], [0.88, 0.6], [0.6, 0.78], [0.28, 0.92], [0, 1]], false, 14),
    disc: jnsCut(disc),
    pad: jnsCut(pad),
    stalk: jnsCut([[1, 0], [0.8, 0.05], [0.72, 0.5], [0.78, 0.93], [1, 1]], true),
  };
}

// ---- the blade set: collects blades per shape, one instanced Mesh per shape ---------------------------
const JNS_STRIDE = 32, JNS_Z3 = [0, 0, 0], JNS_UP = [0, 1, 0], JNS_Z4 = [0, 0, 0, 0];
export class JnsBladeSet {
  constructor(style) { this.style = style; this.buf = {}; this.n = {}; this.meshes = []; }
  // o: pivot [x,y,z], yaw, limit (hinge yaw limit, rad; default 0.87 = 50 deg), waveS, phase, swing, base [x,y,z],
  //    axis [x,y,z] (unit), mode, layer, len, wid, tip, nod, a (THREE.Color dark), b (light), stripes, veins, anim [wag,bob,speed,phase] (speed < 0: keyed to uU, |speed| radians over the whole flight)
  blade(shape, o) {
    let n = this.n[shape] || 0, buf = this.buf[shape];
    if (!buf) buf = this.buf[shape] = new Float32Array(256 * JNS_STRIDE);
    if ((n + 1) * JNS_STRIDE > buf.length) { const nb = new Float32Array(buf.length * 2); nb.set(buf); buf = this.buf[shape] = nb; }
    const i = n * JNS_STRIDE, p = o.pivot || JNS_Z3, b = o.base || JNS_Z3, ax = o.axis || JNS_UP, an = o.anim || JNS_Z4;
    buf[i] = p[0]; buf[i + 1] = p[1]; buf[i + 2] = p[2]; buf[i + 3] = o.yaw || 0;
    buf[i + 4] = o.limit ?? 0.87; buf[i + 5] = o.waveS ?? 0; buf[i + 6] = o.phase ?? 0; buf[i + 7] = o.swing || 0;
    buf[i + 8] = b[0]; buf[i + 9] = b[1]; buf[i + 10] = b[2]; buf[i + 11] = o.layer || 0;
    buf[i + 12] = ax[0]; buf[i + 13] = ax[1]; buf[i + 14] = ax[2]; buf[i + 15] = o.mode || 0;
    buf[i + 16] = o.len; buf[i + 17] = o.wid; buf[i + 18] = o.tip || 0; buf[i + 19] = o.nod ?? 1;
    buf[i + 20] = o.a.r; buf[i + 21] = o.a.g; buf[i + 22] = o.a.b; buf[i + 23] = o.stripes || 0;
    buf[i + 24] = o.b.r; buf[i + 25] = o.b.g; buf[i + 26] = o.b.b; buf[i + 27] = o.veins || 0;
    buf[i + 28] = an[0]; buf[i + 29] = an[1]; buf[i + 30] = an[2]; buf[i + 31] = an[3];
    this.n[shape] = n + 1;
  }
  // A pressed-specimen plant: one stalk and a fan of blades in a single plane. o: x,y,z (foot), yaw, h (height, m),
  // kind ('spear'|'paddle'|'sword'|'heart'|'fern'|'fan'|'torch'), gi (index 0..29 into the forty greens),
  // count, waveS, swing, limit, nod. Draws from rng: 3 numbers when count/gi are given (fixed, so yields are safe).
  plant(rng, o) {
    const G = this.style.greens, pig = this.style.pig;
    const kind = o.kind || 'spear', h = o.h || 12, phase = rng(), jit = rng(), jit2 = rng();
    const gi = Math.max(0, Math.min(29, o.gi ?? Math.floor(jit * 30)));
    let a = G[gi], b = G[Math.min(39, gi + 8)];
    const common = { pivot: [o.x, o.y || 0, o.z], yaw: o.yaw || 0, limit: o.limit, waveS: o.waveS, phase, swing: o.swing, nod: o.nod };
    const n = o.count || { spear: 9, paddle: 7, sword: 9, heart: 8, fern: 9, fan: 11, torch: 9 }[kind];
    const sw = h * 0.035 + 0.12;
    if (kind !== 'sword' && kind !== 'fern')
      this.blade('stalk', { ...common, len: h * (kind === 'fan' ? 0.62 : kind === 'torch' ? 0.5 : 0.72), wid: sw, a: G[Math.max(0, gi - 4)], b: G[Math.min(39, gi + 4)], veins: -1, stripes: kind === 'fan' ? 9 : 0 });
    for (let i = 0; i < n; i++) {
      const f = n > 1 ? i / (n - 1) : 0.5, s = f * 2 - 1, lay = 1 + (i % 2 ? i : n - i);
      let ang, by, len, wid, shape = kind, stripes = 0, veins = 0, bx = 0;
      if (kind === 'spear') { ang = s * 1.2; by = h * (0.34 + 0.38 * (1 - Math.abs(s))); len = h * (0.34 + 0.1 * (1 - Math.abs(s))); wid = len * 0.3; }
      else if (kind === 'paddle') { ang = s * 1.05; by = h * (0.4 + 0.3 * (1 - Math.abs(s))); len = h * (0.42 - 0.1 * Math.abs(s)); wid = len * 0.36; veins = 14; }
      else if (kind === 'sword') { ang = s * 1.0; by = 0; len = h * (1 - 0.3 * Math.abs(s)); wid = len * 0.13 + 0.1; stripes = 7 + Math.floor(jit2 * 5); bx = s * h * 0.05; }
      else if (kind === 'heart') { const r = Math.floor(i / 2), side = i % 2 ? 1 : -1; ang = side * 1.15; by = h * (0.3 + 0.42 * (r / Math.max(1, Math.ceil(n / 2) - 1))); len = h * 0.26; wid = len * 0.8; }
      else if (kind === 'fern') { ang = s * 1.25; by = 0; len = h * (1 - 0.25 * Math.abs(s)); wid = len * 0.24; bx = s * h * 0.04; }
      else if (kind === 'fan') { ang = s * 1.75; by = h * 0.62; len = h * 0.38; wid = len * 0.2; }
      else { shape = 'spear'; const r = Math.floor(i / 2), side = i % 2 ? 1 : -1; ang = side * (0.5 - 0.04 * r); by = h * (0.42 + 0.11 * r * (5 / Math.max(2, n / 2))); len = h * 0.2; wid = len * 0.34; a = pig[5].clone().lerp(pig[0], 0.22); b = pig[5].clone().lerp(pig[3], 0.3); }
      if (by > h) by = h * 0.96;
      this.blade(shape, { ...common, base: [bx, by, 0], axis: [Math.sin(ang), Math.cos(ang), 0], layer: lay, len, wid, a, b, stripes, veins });
    }
    // o.dark: that many green-black blades fanned BEHIND the plant in its own plane, between and beyond its leaves:
    // the dark paint that parts one flat from the next (they hinge, nod and swing with the plant).
    for (let i = 0; i < (o.dark || 0); i++) {
      const s = ((i + 0.5) / o.dark) * 2 - 1, low = kind === 'sword' || kind === 'fern', wide = kind === 'paddle' || kind === 'heart';
      const ang = s * (kind === 'fan' ? 1.6 : 1.12), len = h * (low ? 0.9 - 0.25 * Math.abs(s) : kind === 'fan' ? 0.42 : 0.45);
      const by = low ? 0 : h * (kind === 'fan' ? 0.6 : 0.3 + 0.36 * (1 - Math.abs(s)));
      this.blade(wide ? 'paddle' : 'spear', { ...common, base: [0, by, 0], axis: [Math.sin(ang), Math.cos(ang), 0], layer: -1 - (i % 2), len, wid: len * (wide ? 0.4 : low ? 0.28 : 0.36), a: pig[0], b: G[1], veins: -1 });
    }
  }
  // Makes the meshes (one per shape used) and adds them to parent. Call once, after the last blade.
  finish(parent) {
    for (const shape of Object.keys(this.buf)) {
      const n = this.n[shape], src = this.style.geoms[shape];
      const g = new THREE.InstancedBufferGeometry();
      g.index = src.index; g.setAttribute('position', src.getAttribute('position'));
      const ib = new THREE.InstancedInterleavedBuffer(this.buf[shape].subarray(0, n * JNS_STRIDE), JNS_STRIDE, 1);
      ['iPivot', 'iPlant', 'iBase', 'iAxis', 'iSize', 'iColA', 'iColB', 'iAnim'].forEach((name, k) => g.setAttribute(name, new THREE.InterleavedBufferAttribute(ib, 4, k * 4)));
      g.instanceCount = n;
      const m = new THREE.Mesh(g, this.style.material);
      m.frustumCulled = false; m.name = 'jns-' + shape;
      parent.add(m); this.meshes.push(m);
    }
    this.buf = {};
    return this.meshes;
  }
}

// ---- the style: pigments, forty greens, shared uniforms, the one blade material, flat and sky materials ----
export function makeJnsStyle(palette = JNS_PALETTE) {
  const pal = JNS_PALETTE.map((h, i) => (palette && palette[i]) || h);
  const pig = pal.map((h) => new THREE.Color(h)), white = new THREE.Color('#ffffff');
  const uniforms = {
    uU: { value: 0 }, uTime: { value: 0 }, uLean: { value: 0 },
    uWave: { value: new THREE.Vector4(0.02, 0.28, 0.6, 0.9) },
    uShut: { value: new THREE.Vector2(-1, -1) },
    uWhite: { value: white },
  };
  const material = new THREE.ShaderMaterial({ uniforms, vertexShader: JNS_BLADE_VERT, fragmentShader: JNS_BLADE_FRAG, side: THREE.DoubleSide });
  const style = { palette: pal, pig, white, greens: jnsGreens(pal), uniforms, material, geoms: jnsShapes() };
  style.set = () => new JnsBladeSet(style);
  // Unlit flat pigment. opts.ripples: array of [x, z, phase] (object space, at most 24): ruled rings widen round
  // each, phase keyed to uU. opts.side.
  style.flat = (col, opts = {}) => {
    const rip = (opts.ripples || []).slice(0, 24), arr = [];
    for (let i = 0; i < 24; i++) { const r = rip[i] || [0, 0, -1]; arr.push(new THREE.Vector3(r[0], r[1], r[2])); }
    // opts.sky: { top, mid, low, disc (colours), sun (Vector3), size (deg), band, span, amount }: the water is painted
    // with the sky's own grade upside down (far water takes the light at the leaf line, near water the deep overhead)
    // and with the disc standing in it as a ladder of ruled bars: flat paint, no gloss.
    const k = opts.sky, sun = k ? k.sun.clone().normalize() : new THREE.Vector3(0, 1, 0), sh = Math.hypot(sun.x, sun.z) || 1;
    return new THREE.ShaderMaterial({
      side: opts.side ?? THREE.FrontSide, defines: k ? { JNS_REFL: 1 } : {},
      uniforms: { uU: uniforms.uU, uTime: uniforms.uTime, uCol: { value: new THREE.Color(col) }, uLine: { value: white.clone().lerp(new THREE.Color(col), 0.45) },
        uDark: { value: new THREE.Color(col).lerp(pig[1], 0.2) }, uC: { value: arr }, uN: { value: rip.length },
        uSkyTop: { value: new THREE.Color(k ? k.top : col) }, uSkyMid: { value: new THREE.Color(k ? k.mid : col) }, uSkyLow: { value: new THREE.Color(k ? k.low : col) },
        uSkyDisc: { value: new THREE.Color(k ? k.disc : col) }, uSunH: { value: new THREE.Vector4(sun.x / sh, sun.z / sh, sun.y, sh) },
        uSkyP: { value: new THREE.Vector4(k?.band ?? 0.2, k?.span ?? 0.5, Math.sin((((k?.size ?? 6) * 0.5) * Math.PI) / 180), k?.amount ?? 0.85) },
        // the shore's dark reflection (off until a world sets uRefl.w): uShore = centre x, z and radii x, z of the water (world);
        // uRefl = width of the band (m), round heads along the shore (whole number), second rhythm (whole number), amount
        uShore: { value: new THREE.Vector4(0, 0, 75, 75) }, uRefl: { value: new THREE.Vector4(50, 34, 9, 0) }, uReflC: { value: pig[1].clone().lerp(pig[0], 0.4) } },
      vertexShader: 'varying vec3 vP, vW; void main(){ vP = position; vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
      fragmentShader: /* glsl */`
        uniform vec3 uCol, uLine, uDark, uSkyTop, uSkyMid, uSkyLow, uSkyDisc, uReflC; uniform vec4 uSunH, uSkyP, uShore, uRefl;
        uniform vec3 uC[24]; uniform float uU, uTime; uniform int uN; varying vec3 vP, vW;
        void main() {
          vec2 p = vP.xz; float px = max(max(fwidth(p.x), fwidth(p.y)), 1e-4);
          float lw = max(.07, .75 * px), per = 2.4, keep = 1. - smoothstep(per / 6., per / 3., px);
          vec3 base = uCol; float rfl = 0.;
          #ifdef JNS_REFL
          {
            vec3 v = vW - cameraPosition; v /= max(length(v), 1e-4);
            float ry = max(-v.y, 0.);                               // sine of the mirrored ray's elevation
            vec3 g = mix(uSkyLow, uSkyMid, smoothstep(0., max(uSkyP.x, 1e-3), ry));
            g = mix(g, uSkyTop, smoothstep(uSkyP.x, max(uSkyP.y, uSkyP.x + 1e-3), ry));
            base = mix(uCol, g, uSkyP.w);
            vec2 hr = v.xz / max(length(v.xz), 1e-4);
            float q = ry * 46., fq = max(fwidth(q), 1e-5);
            float odd = step(.5, fract(floor(q) * .5));
            float cr = (hr.x * uSunH.y - hr.y * uSunH.x) * uSunH.w;
            float de = (ry - uSunH.z) * .36;
            float e = max(1.45 * fwidth(cr) + fwidth(de), 1e-5);     // taken before the bars break it
            cr *= 1. + .45 * odd;
            float m = sqrt(cr * cr + de * de);
            float disc = (1. - smoothstep(uSkyP.z - e, uSkyP.z + e, m)) * step(0., dot(hr, uSunH.xy));
            float tri = abs(fract(q) - .5) * 2., aa = clamp(fq * 2., 0., .5);
            float bar = mix(.62, smoothstep(.38 - aa, .38 + aa, tri), 1. - smoothstep(.2, .34, fq));
            base = mix(base, uSkyDisc, disc * bar * .9);
            // the trees stand in the water too: a band of their dark green lies on the water under every shore, its inner
            // edge cut to a row of round heads (wider toward the far shore, thin under the disc so its ladder stays);
            // flat paint, hard edged, no gloss
            vec2 rad = max(uShore.zw, vec2(1e-3));
            vec2 q0 = (vW.xz - uShore.xy) / rad;
            float lq = max(length(q0), 1e-4);
            float dEdge = (1. - lq) / max(length(q0 / (lq * rad)), 1e-5);     // metres to the shore
            float th = atan(q0.x + step(lq, 2e-4), q0.y);
            float heads = .55 + .45 * abs(sin(th * uRefl.y * .5)) * (.8 + .2 * sin(th * uRefl.z + 2.));
            float farS = .5 + .5 * dot(q0 / lq, hr);                           // 1 on the shore we look toward
            float sunward = clamp(smoothstep(.14, .3, abs(hr.x * uSunH.y - hr.y * uSunH.x)) + step(dot(hr, uSunH.xy), 0.), 0., 1.);
            float dd = uRefl.x * heads * mix(.45, 1., farS) * mix(.35, 1., sunward) - dEdge;
            // and the far bank's own reflection, as the eye has it: the mirrored ray runs on to the shore, and a hedge
            // of round heads there stands above it (low over the water it darkens the far third; from above, a rim)
            vec2 dq = hr / rad; float dl = max(length(dq), 1e-5); vec2 dn = dq / dl;
            float bq = dot(q0, dn), tq = max(-bq + sqrt(max(bq * bq - (lq * lq - 1.), 0.)), 0.) / dl;
            vec2 hit = q0 + dn * (tq * dl); hit.y += step(dot(hit, hit), 1e-8);
            float th2 = atan(hit.x, hit.y);
            float hedge = uRefl.x * .22 * (.8 + .2 * sin(th2 * uRefl.y)) * (.85 + .15 * sin(th2 * uRefl.z + 1.)) * mix(.2, 1., sunward);
            dd = max(dd, hedge - tq * ry / max(sqrt(max(1. - ry * ry, 0.)), 1e-3));
            float ed = max(fwidth(dd), 1e-4);
            rfl = uRefl.w * smoothstep(-ed, ed, dd);
            base = mix(base, uReflC, rfl);
          }
          #endif
          float hi = 0., lo = 0.;
          for (int i = 0; i < 24; i++) {
            if (i >= uN) break;
            float r = length(p - uC[i].xy);
            float q = r / per - (uU * 16. + uTime * .1 + uC[i].z);
            float line = 1. - smoothstep(lw, lw + px, abs(fract(q + .5) - .5) * per);
            line *= smoothstep(1.4, 2.6, r) * (1. - smoothstep(5., 13., r));
            float odd = step(.5, fract(floor(q + .5) * .5));
            hi = max(hi, line * odd); lo = max(lo, line * (1. - odd));
          }
          vec3 c = mix(base, mix(base, uDark, .8), lo * keep);
          c = mix(c, mix(uLine, base, .6 * rfl), hi * keep);        // on the dark of the reflection the ruled rings are quiet
          gl_FragColor = vec4(c, 1.);
        }`,
    });
  };
  // Sky dome: opts.sun (THREE.Vector3, world direction to the disc), opts.size (disc diameter, deg; 6), opts.disc,
  // opts.mid and opts.band (a third stop: the colour reached at sine-of-elevation band, default 0.2; low is the light at the leaf line),
  // opts.top, opts.low (colours; defaults: vermilion, pale, pale let down with rose), opts.stand (see the shader), opts.ground (colour painted
  // below the horizon, for a world whose ground mesh ends), opts.span (sine of the elevation at which the grade reaches top; 0.5).
  style.sky = (opts = {}) => new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    uniforms: { uTop: { value: new THREE.Color(opts.top || pig[4]) }, uLow: { value: new THREE.Color(opts.low || pig[4].clone().lerp(pig[6], 0.38)) },
      uDisc: { value: new THREE.Color(opts.disc || pig[5]) }, uSun: { value: (opts.sun || new THREE.Vector3(0.2, 0.19, -0.96)).clone().normalize() },
      uRad: { value: ((opts.size ?? 6) * 0.5 * Math.PI) / 180 }, uGround: { value: new THREE.Color(opts.ground || pig[0]) }, uHasGround: { value: opts.ground ? 1 : 0 },
      uSpan: { value: opts.span ?? 0.5 }, uBand: { value: opts.band ?? 0.2 }, uStand: { value: opts.stand ?? -1 },
      uMid: { value: new THREE.Color(opts.mid || new THREE.Color(opts.low || pig[4].clone().lerp(pig[6], 0.38)).lerp(new THREE.Color(opts.top || pig[4]), 0.4)) } },
    vertexShader: 'varying vec3 vD; void main(){ vD = mat3(modelMatrix) * position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
    fragmentShader: /* glsl */`
      uniform vec3 uTop, uMid, uLow, uDisc, uSun, uGround; uniform float uRad, uHasGround, uSpan, uBand, uStand; varying vec3 vD;
      void main() {
        vec3 d = vD / max(length(vD), 1e-4);
        vec3 c = mix(uLow, uMid, smoothstep(0., max(uBand, 1e-3), d.y));
        c = mix(c, uTop, smoothstep(uBand, max(uSpan, uBand + 1e-3), d.y));
        // opts.stand (sine of elevation): uLow stands flat from the horizon up to it, then ONE smooth grade runs through
        // uMid (reached half way) to uTop at uSpan, with no step and no plateau at the middle stop
        float gt = smoothstep(max(uStand, 0.), max(uSpan, max(uStand, 0.) + 1e-3), d.y) * 2.;
        vec3 c2 = mix(mix(uLow, uMid, clamp(gt, 0., 1.)), uTop, clamp(gt - 1., 0., 1.));
        c = mix(c, c2, step(0., uStand));
        float ang = acos(clamp(dot(d, uSun), -1., 1.));
        float e = max(fwidth(ang), 1e-5);
        c = mix(c, uDisc, 1. - smoothstep(uRad - e, uRad + e, ang));
        float ey = max(fwidth(d.y), 1e-5);
        c = mix(c, uGround, uHasGround * (1. - smoothstep(-ey, ey, d.y + .004)));   // below the horizon: the bank's dark paint (opts.ground)
        gl_FragColor = vec4(c, 1.);
      }`,
  });
  return style;
}

// A pair of round eyes in a dark gap: yellow-green discs with green-black pupils, always square to the lens. The pair
// brings its own gap: three green-black leaves behind it (opts back: false leaves them out) and one green blade edge
// across the lower part of one eye, so it looks OUT of the dark, half hidden. extra.flip mirrors the blade.
export function jnsEyes(set, at, size = 0.7, extra = {}) {
  const pig = set.style.pig, G = set.style.greens, { back = true, flip = 1, gi = 9, ...more } = extra;
  const c = { pivot: [at.x, at.y, at.z], yaw: at.yaw || 0, limit: 3.2, waveS: at.waveS ?? 0, nod: 0, veins: -1, ...more };
  if (back) {
    for (const s of [-1, 0, 1]) set.blade(s ? 'spear' : 'paddle', { ...c, base: [0, -size * 1.7, 0], axis: [Math.sin(s * 0.85), Math.cos(s * 0.85), 0], len: size * (s ? 4.1 : 4.4), wid: size * (s ? 1.9 : 2.5), a: pig[0], b: pig[0], layer: -2 });
    set.blade('spear', { ...c, base: [-flip * size * 2.1, -size * 0.75, 0], axis: [flip * 0.87, 0.5, 0], len: size * 2.7, wid: size * 0.95, a: G[gi], b: G[gi + 9], layer: 4, veins: 0 });
  }
  for (const s of [-1, 1]) {
    set.blade('disc', { ...c, base: [s * size * 0.72, 0, 0], len: size, wid: size, a: pig[2], b: pig[3], layer: 1 });
    set.blade('disc', { ...c, base: [s * size * 0.72, size * 0.27, 0], len: size * 0.46, wid: size * 0.46, a: pig[0], b: pig[0], layer: 2 });
  }
}

// A monkey, stiff as a wooden toy, seated and frontal: flat graded parts, ring eyes, pale ruff; it lifts an arm and
// tosses an orange. at: {x,y,z,yaw,waveS}; opts: size (m, default 2.4), dark (green-black instead of russet), orange.
export function jnsMonkey(set, rng, at, opts = {}) {
  const pig = set.style.pig, k = (opts.size || 2.4) / 2.4, ph = rng(), sp = 1.5 + rng() * 0.5;
  const A = opts.dark ? pig[0].clone().lerp(pig[1], 0.15) : pig[5].clone().lerp(pig[0], 0.66);
  const B = opts.dark ? pig[1].clone().lerp(pig[2], 0.2) : pig[5].clone().lerp(pig[0], 0.3);
  const c = { pivot: [at.x, at.y, at.z], yaw: at.yaw || 0, limit: 3.2, waveS: at.waveS ?? 0, phase: ph, nod: opts.nod ?? 0.35 };
  const part = (shape, bx, by, ang, len, wid, layer, a = A, b = B, more = {}) =>
    set.blade(shape, { ...c, base: [bx * k, by * k, 0], axis: [Math.sin(ang), Math.cos(ang), 0], len: len * k, wid: wid * k, layer, a, b, veins: -1, ...more });
  part('sword', 0.3, 0.3, 2.0, 1.5, 0.17, 20);                               // tail
  part('spear', -0.2, 0.42, -2.0, 0.95, 0.34, 21);                           // legs, knees out
  part('spear', 0.2, 0.42, 2.0, 0.95, 0.34, 21);
  part('paddle', 0, 0.05, 0, 1.5, 0.95, 22);                                 // body
  part('disc', 0, 0.42, 0, 0.6, 0.5, 23, B, pig[5].clone().lerp(pig[3], 0.35));   // belly patch
  part('sword', -0.36, 1.3, -2.55, 0.95, 0.24, 24);                          // near arm, hanging
  part('sword', 0.36, 1.3, 1.25, 0.95, 0.24, 24, A, B, { anim: [0.55, 0, sp, ph] });   // tossing arm
  const pale = pig[4], wh = set.style.white.clone().lerp(pig[4], 0.25);
  part('disc', 0, 1.22, 0, 1.2, 1.2, 25, pale, wh);                          // ruff
  part('disc', -0.44, 1.86, 0, 0.3, 0.3, 26); part('disc', 0.44, 1.86, 0, 0.3, 0.3, 26);   // ears
  part('disc', 0, 1.4, 0, 0.86, 0.82, 27);                                   // head
  part('disc', 0, 1.42, 0, 0.36, 0.44, 28, pale, wh);                        // muzzle
  for (const s of [-1, 1]) {
    part('disc', s * 0.19, 1.8, 0, 0.27, 0.27, 29, pig[2], pig[3]);          // ring eyes
    part('disc', s * 0.19, 1.875, 0, 0.12, 0.12, 30, pig[0], pig[0]);
  }
  if (opts.orange !== false)
    part('disc', 1.3, 1.45, 0, 0.62, 0.62, 31, pig[5], pig[5].clone().lerp(pig[3], 0.55), { anim: [0, 1.5 * k, sp, ph] });
}

// ---- the hero -------------------------------------------------------------------------------------------
// bearing (deg) and distance of the eleven round the great one. The third and fourth stand out toward the starboard shore, one
// each side of the drop, so that we fall between their leaves; the sixth, just beyond the great bloom, is the tallest of all:
// its bloom is cropped by the top of the frame as we come level with the great one, and the disc stands between the two.
// The last three stand to port on the disc's bearing as seen from the lane: they are tall (hearts near 80 m) and keep their
// leaves short, so the disc stands clear under their blooms, beside their stalks.
const JNS_RING = [[28, 50], [55, 52], [107, 64], [134, 68], [163, 53], [168, 33], [190, 50], [214, 51], [258, 53], [283, 47], [311, 49]];

// One lotus: a jointed stalk from foot to heart, paddle leaves at the joints, and the bloom (28 petals in three
// rows, dark sepals in the gaps, a yellow-green pod and stamens). Exported so the world can stand more of them.
// o: foot [x,y,z], heart [x,y,z], R (petal length = half the bloom), pale (bool), waveS (u at the foot), waveTop,
// reachX (max leaf length on the +X side, m) and reach (max leaf length on both sides): keep a fly line clear; thick (stalk width at the foot, default 2.4);
// lite (a small lotus seen from far: its petals are cut as spear blades, a third of the triangles, and it carries no stamens or seeds).
export function jnsLotus(set, rng, o) {
  const st = set.style, G = st.greens, pig = st.pig, R = o.R, F = o.foot, H = o.heart;
  const nJ = 7 + Math.floor(rng() * 3), gi = 8 + Math.floor(rng() * 10), zig = (rng() < 0.5 ? -1 : 1) * (0.5 + rng() * 0.5), zdir = rng() * 6.283;
  const thick = o.thick || 2.4, s0 = o.waveS ?? 0, s1 = o.waveTop ?? s0, ph = rng();
  const J = [];
  for (let i = 0; i <= nJ; i++) {
    const f = i / nJ, z = (i === 0 || i === nJ) ? 0 : zig * (i % 2 ? 1 : -1);
    J.push([F[0] + (H[0] - F[0]) * f + Math.cos(zdir) * z, F[1] + (H[1] - F[1]) * f, F[2] + (H[2] - F[2]) * f + Math.sin(zdir) * z]);
  }
  for (let i = 0; i < nJ; i++) {
    const a = J[i], b = J[i + 1], dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], len = Math.hypot(dx, dy, dz), f = i / nJ;
    const w = thick * (1 - 0.38 * f), ws = s0 + (s1 - s0) * f;
    const c = { pivot: a, limit: 0, waveS: ws, phase: ph, nod: 0, mode: 1, axis: [dx / len, dy / len, dz / len] };
    set.blade('stalk', { ...c, len, wid: w, a: G[gi - 5], b: G[gi + 12], layer: 1 });
    if (i > 0) set.blade('stalk', { ...c, base: [0, -0.3, 0], len: 0.75, wid: w * 1.22, a: G[Math.max(0, gi - 8)], b: G[gi + 3], layer: 2, veins: -1 });   // the ruled joint
    if (i > 0 && i < nJ) {                                             // a paddle leaf (or a pair) on the joint
      const side = i % 2 ? 1 : -1, pair = rng() < 0.3, yaw = (rng() - 0.5) * 0.9, L0 = (7 + rng() * 4.5) * (1 - 0.3 * f), g2 = 4 + Math.floor(rng() * 16);
      for (const sd of pair ? [side, -side] : [side]) {
        const ang = sd * (0.95 + rng() * 0.3);
        let L = L0;
        if (o.reachX != null && sd > 0) L = Math.min(L, o.reachX);
        if (o.reach != null) L = Math.min(L, o.reach);
        set.blade('sword', { pivot: a, yaw, limit: 0.87, waveS: ws, phase: ph + i * 0.13, base: [0, 0, 0], axis: [Math.sin(ang * 0.8), Math.cos(ang * 0.8), 0], len: L * 0.3, wid: 0.3, a: G[gi - 4], b: G[gi + 8], layer: 3, veins: -1 });
        set.blade('paddle', { pivot: a, yaw, limit: 0.87, waveS: ws, phase: ph + i * 0.13, base: [Math.sin(ang * 0.8) * L * 0.22, Math.cos(ang * 0.8) * L * 0.22, 0], axis: [Math.sin(ang), Math.cos(ang), 0], len: L, wid: L * 0.38, a: G[g2], b: G[g2 + 9], layer: 4, veins: 15 });
      }
    }
  }
  // the bloom
  const rose = pig[6], white = st.white, pale = pig[4];
  const pa = o.pale ? pale.clone().lerp(pig[1], 0.16) : rose.clone().lerp(pig[5], 0.2), pb = o.pale ? pale.clone().lerp(white, 0.6) : rose.clone().lerp(white, 0.5);
  const bc = { pivot: H, limit: 0, waveS: s1, phase: ph, nod: 0.45 };
  const lite = !!o.lite, PS = lite ? 'spear' : 'petal';
  const row = (n, elev, len, wid, r0, off, mode, a, b, tip, layer, shape = PS, veins = 0, y0 = 0) => {
    for (let i = 0; i < n; i++) {
      const az = off + (i / n) * 6.2832, e = elev + ((i % 2) ? 0.06 : -0.06), ce = Math.cos(e);
      set.blade(shape, { ...bc, mode, base: [Math.sin(az) * r0, y0, Math.cos(az) * r0], axis: [Math.sin(az) * ce, Math.sin(e), Math.cos(az) * ce], len, wid, a, b, tip, layer, veins });
    }
  };
  const off = rng() * 6.28, dk = pig[0], dk2 = G[4];
  row(8, -0.14, R * 0.46, R * 0.26, R * 0.05, off + 0.2, 3, G[1], G[10], 0, 1, PS, 0, -R * 0.03);          // sepals under the bloom
  row(12, 0.2, R * 0.6, R * 0.24, R * 0.06, off + 0.262, 3, dk, dk2, 0, 2, PS, -1);                       // green-black between the outer petals
  row(12, 0.25, R, R * 0.31, R * 0.07, off, 3, pa, pb, 0.5, 3);                                                 // outer row
  row(9, 0.46, R * 0.5, R * 0.24, R * 0.1, off + 0.52, 3, dk, dk2, 0, 4, PS, -1);                           // green-black between the middle petals
  row(9, 0.5, R * 0.84, R * 0.31, R * 0.13, off + 0.17, 3, pa, pb, 0.5, 5);                                     // middle row
  row(7, 1.0, R * 0.42, R * 0.25, R * 0.2, off + 0.6, 3, pa.clone().lerp(o.pale ? pig[1] : pig[5], 0.1), pb, 0.45, 6);   // inner row
  set.blade('stalk', { ...bc, mode: 1, len: R * 0.4, wid: R * 0.34, a: G[19], b: G[38], layer: 7 });             // the pod: a drum
  set.blade('disc', { ...bc, mode: 2, base: [0, R * 0.4, -R * 0.17], axis: [0, 0, 1], len: R * 0.34, wid: R * 0.34, a: G[26], b: G[39], layer: 1, veins: -1 });
  if (!lite) row(14, 0.95, R * 0.24, R * 0.035, R * 0.18, off, 1, G[24], G[39], 0, 7, 'grass', -1, R * 0.02);   // stamens
  for (let i = 0; i < (lite ? 0 : 7); i++) {                                                                                 // seeds on the pod
    const az = i ? off + i * 1.047 : 0, r = i ? R * 0.105 : 0, d = R * 0.06;
    set.blade('disc', { ...bc, mode: 2, base: [Math.sin(az) * r, R * 0.4, Math.cos(az) * r - d * 0.5], axis: [0, 0, 1], len: d, wid: d, a: G[2], b: G[12], layer: 3, veins: -1 });
  }
  return { heart: H, foot: F, R, seat: [H[0], H[1] + R * 0.4, H[2]], joints: J };
}

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, style = makeJnsStyle(opts.palette), G = style.greens, pig = style.pig;
  const detail = Math.max(0.6, Math.min(1, opts.detail ?? ctx.quality?.detail ?? 1));
  const backdrop = opts.backdrop ?? true;      // the set-piece viewer passes no opts and gets the backdrop; a world passes backdrop: false
  const [u0, u1] = opts.uSpan || [0.26, 0.56], uMid = u0 + (u1 - u0) * 0.63;
  // journey u at a local z (the camera comes from +Z): the pool edge z 120 -> u0, the great bloom z 17 -> uMid
  const uOf = (z) => (z > 17 ? u0 + (uMid - u0) * Math.min(1.3, (120 - z) / 103) : uMid + (u1 - uMid) * Math.min(1.6, (17 - z) / 70));
  const object = new THREE.Group(); object.name = 'lotus-stand';
  const set = style.set();
  await ctx.yield();

  // the great lotus, a little port of the fly line, and eleven more in a loose ring
  const lot = [];
  const gx = -7 + (rng() - 0.5) * 1.5, great = jnsLotus(set, rng, { foot: [gx + (rng() - 0.5) * 3, 0, 3 + rng() * 3], heart: [gx, 63, 0], R: 12, pale: false,
    waveS: uOf(17) - 0.14, waveTop: uOf(17), reachX: 4.2, thick: 2.4 });
  lot.push(great);
  const paleFirst = rng() < 0.5;
  const DROP = [[4.5, -7], [20, -16], [40, -27], [62, -36], [75, -40]];       // plan of the drop toward the starboard shore
  const dropDist = (x, z) => {
    let m = 1e9;
    for (let i = 0; i + 1 < DROP.length; i++) {
      const ax = DROP[i][0], az = DROP[i][1], bx = DROP[i + 1][0] - ax, bz = DROP[i + 1][1] - az;
      const t = Math.max(0, Math.min(1, ((x - ax) * bx + (z - az) * bz) / (bx * bx + bz * bz)));
      m = Math.min(m, Math.hypot(x - ax - bx * t, z - az - bz * t));
    }
    return m;
  };
  for (let i = 0; i < JNS_RING.length; i++) {
    const phi = ((JNS_RING[i][0] + (rng() - 0.5) * 6) * Math.PI) / 180, r = JNS_RING[i][1] + (rng() - 0.5) * 5;
    const x = Math.sin(phi) * r, z = Math.cos(phi) * r, h = i === 5 ? 92 + rng() * 0 : i > 7 ? 79 + rng() * 7 : 53 + rng() * 14, R = i === 5 ? 10.5 + rng() * 0 : 8 + rng() * 2.4;
    const lean = 2 + rng() * 4, la = rng() * 6.283, dd = dropDist(x, z);
    lot.push(jnsLotus(set, rng, { foot: [x + Math.cos(la) * lean, 0, z + Math.sin(la) * lean], heart: [x, h, z], R, pale: (i % 2 === 0) === paleFirst,
      waveS: uOf(z) - 0.05, waveTop: uOf(z), reach: i === 5 ? 7 : i > 7 ? 4.5 : dd < 20 ? Math.max(2.5, dd - 7.5) : null, thick: 1.9 + rng() * 0.5 }));
    if (i % 4 === 3) await ctx.yield();
  }
  // the monkey with its orange, seated in the heart of the great bloom
  jnsMonkey(set, rng, { x: great.seat[0], y: great.seat[1] - 0.2, z: great.seat[2], waveS: uOf(17) }, { size: 3.7, dark: opts.darkMonkey ?? rng() < 0.15 });

  // pads on the pool, and the pool
  const ripples = lot.map((l) => [l.foot[0], l.foot[2], rng()]);
  if (opts.pads !== false) {
    const nPads = Math.round(34 * detail);
    for (let i = 0; i < 34; i++) {
      const a = rng() * 6.283, r = 8 + Math.sqrt(rng()) * 60, size = 5 + rng() * 4, dir = rng() * 6.283, gi = 10 + Math.floor(rng() * 12), ph = rng();
      if (i >= nPads) continue;
      const x = Math.sin(a) * r, z = Math.cos(a) * r;
      if (lot.some((l) => Math.hypot(l.foot[0] - x, l.foot[2] - z) < size * 0.5 + 2)) continue;
      set.blade('pad', { pivot: [x, 0.04, z], limit: 0, nod: 0, mode: 2, base: [-Math.sin(dir) * size * 0.5, 0, -Math.cos(dir) * size * 0.5], axis: [Math.sin(dir), 0, Math.cos(dir)], len: size, wid: size, a: G[gi], b: G[gi + 12], layer: 2 + (i % 3), phase: ph });
      if (ripples.length < 24 && i % 2 === 0) ripples.push([x, z, ph]);
    }
  }
  if (opts.pool !== false) {
    const pool = new THREE.Mesh(new THREE.CircleGeometry(75, 72).rotateX(-Math.PI / 2), style.flat(pig[4], { ripples, sky: opts.waterSky }));
    pool.name = 'pool'; object.add(pool);
  }
  await ctx.yield();

  // the disc: put in the widest gap between stalks near 12 degrees to port, seen from the reveal point
  const V = [0, 22, 150], bear = lot.map((l) => (Math.atan2(-l.heart[0], V[2] - l.heart[2]) * 180) / Math.PI).filter((b) => b > 2 && b < 22).sort((a, b) => a - b);
  let sunB = 12, gap = 0;
  for (let i = 0; i + 1 < bear.length; i++) { const c = (bear[i] + bear[i + 1]) / 2; if (bear[i + 1] - bear[i] > gap && c > 7 && c < 17) { gap = bear[i + 1] - bear[i]; sunB = c; } }
  const sb = (sunB * Math.PI) / 180, se = (11 * Math.PI) / 180;
  const sunDir = new THREE.Vector3(-Math.sin(sb) * Math.cos(se), Math.sin(se), -Math.cos(sb) * Math.cos(se));

  // backdrop (set-piece viewer only, or opts.backdrop): dark bank, lapped shore wall, the sky and the disc.
  let sky = null;
  if (backdrop) {
    const prof = [[75, -0.05], [79, 0.4], [140, 20], [1500, 20]].map(([x, y]) => new THREE.Vector2(x, y));
    const bank = new THREE.Mesh(new THREE.LatheGeometry(prof, 72), style.flat(pig[0], { side: THREE.DoubleSide }));
    bank.name = 'bank'; object.add(bank);
    const kinds = ['spear', 'paddle', 'spear', 'heart', 'fern', 'paddle', 'fan', 'sword', 'spear', 'paddle'];
    let count = 0;
    for (let k = 0; k < 7; k++) {
      const r = 81 + k * 9, n = Math.floor((6.283 * r) / (9.5 + k * 0.6)), off = rng() * 6.283;
      for (let i = 0; i < n; i++) {
        const a = off + (i / n) * 6.283 + (rng() - 0.5) * 0.04, rr = r + (rng() - 0.5) * 4, x = Math.sin(a) * rr, z = Math.cos(a) * rr;
        const kr = rng(), hr = rng(), keep = rng() < detail || k < 2;
        const torch = kr > 0.93, kind = torch ? 'torch' : kinds[Math.floor(kr * 10.7) % 10];
        const y = 0.4 + Math.max(0, rr - 79) * 0.32, sc = 1 + k * 0.12;
        const h = (kind === 'sword' ? 7 + hr * 5 : kind === 'fern' ? 9 + hr * 6 : torch ? 16 + hr * 10 : 12 + hr * 16) * sc;
        if (!keep) { rng(); rng(); rng(); continue; }
        set.plant(rng, { x, y, z, yaw: Math.atan2(-x, -z) + (hr - 0.5) * 0.5, h, kind, waveS: uOf(z) + (Math.abs(x) / 150) * 0.05 });
        if (++count % 120 === 0) await ctx.yield();
      }
    }
    for (let i = 0; i < 150; i++) {                  // the level leaf horizon: giant blades far off
      const a = (i / 150) * 6.283, r = 300 + rng() * 120, hh = 45 + rng() * 40, kr = rng();
      set.plant(rng, { x: Math.sin(a) * r, y: 14, z: Math.cos(a) * r, yaw: a + Math.PI, h: hh, kind: kr < 0.5 ? 'spear' : kr < 0.8 ? 'paddle' : 'fan', waveS: 0.5 });
    }
    for (let i = 0; i < 8; i++) {                    // eyes in the gaps of the near shore
      const a = (rng() - 0.5) * 2.4 + (i % 2 ? 0 : Math.PI), r = 84 + rng() * 14, x = Math.sin(a) * r, z = Math.cos(a) * r;
      jnsEyes(set, { x, y: 4 + rng() * 8, z, waveS: uOf(z) }, 0.9 + rng() * 0.5);
    }
    sky = new THREE.Mesh(new THREE.SphereGeometry(2600, 32, 16), style.sky({ sun: sunDir }));
    sky.renderOrder = -0.5; sky.frustumCulled = false; sky.name = 'sky'; object.add(sky);
  }
  await ctx.yield();
  set.finish(object);
  await ctx.yield();

  // ---- anchors (local space; the camera arrives from +Z, port is -X, starboard +X) ----
  const gh = great.heart, arc = (deg, y) => [gh[0] + 18 * Math.sin((deg * Math.PI) / 180), y, 18 * Math.cos((deg * Math.PI) / 180)];
  const anchors = {
    // a safe camera line, 6 m clear of every blade at rest: in over the pool, the 21 degree climb beside the great stalk,
    // round the starboard side of the great bloom 18 m from its heart, and the 35 degree drop toward the starboard shore.
    flyThrough: [[3.5, 12, 150], [3.5, 30, 105], [3.5, 49, 58], [3.5, 62, 24], arc(44, 67), arc(70, 68), arc(90, 68), arc(113, 66.5),
      [20, 58, -16], [40, 41, -27], [62, 23, -36], [75, 13, -40]],
    viewpoints: {
      reveal: { from: V, lookAt: [0, 50, 0] },                    // u 0.26-0.3: the whole stand over the water
      closest: { from: arc(80, 68), lookAt: [gh[0], gh[1] + 4.5, gh[2]] },   // u 0.5: petal tips 7 m off, the monkey in the heart
      level: { from: arc(113, 65), lookAt: [-30, 60, -50] },      // past other blooms toward the leaf line
    },
    great: { heart: gh.slice(), foot: great.foot.slice(), radius: 12, monkey: [great.seat[0], great.seat[1] + 1.6, great.seat[2]] },
    blooms: lot.map((l) => ({ heart: l.heart.slice(), foot: l.foot.slice(), radius: l.R })),
    poolRadius: 75,
    sunDir: sunDir.toArray(),            // unit direction to the disc (bearing sunBearingPort to port of -Z, 11 deg up): it sits in a gap between two stalks
    sunBearingPort: sunB,
    treeSeat: [78, 0, -42],              // suggested foot of the orange tree: where the drop ends on the starboard shore
    // the exit lies outside the hero (60 m beyond the tree and bay); a seat that agrees with the fly line and the brief's 12 degrees to starboard:
    portalSeat: { position: [104, 5, -168], facing: [-0.208, 0, 0.978], radius: 7 },
    uSpan: [u0, u1], uOf,
  };

  let progressSet = false;
  const U = style.uniforms, shutOn = !!opts.shut, sG = uOf(17);
  const setProgress = (u) => {
    progressSet = true; U.uU.value = u;
    if (shutOn) {       // the stand shuts as the wave reaches each bloom from u 0.36; the great bud opens beside us from u 0.47 and is open by 0.495
      const cs = Math.min(1, Math.max(0, (u - 0.36) / 0.08));
      U.uShut.value.set(u < 0.36 ? -1 : u0 - 0.1 + cs * (u1 + 0.3 - u0), u < 0.455 ? -1 : sG - 0.03 + (u - 0.455) * 1.6);
    }
  };
  const camPos = new THREE.Vector3();
  return {
    object, style, anchors, setProgress,
    setShut(closeFront, openFront) { U.uShut.value.set(closeFront, openFront); },
    radius: 75, height: 82,
    center: new THREE.Vector3(0, 40, 0),
    ground: false, groundY: 0,
    update(dt, time, camera) {
      U.uTime.value = time;
      if (!progressSet) { const u = (time * 0.024) % 1; U.uU.value = u; if (shutOn) { setProgress(u); progressSet = false; } }
      if (sky && camera) { camPos.setFromMatrixPosition(camera.matrixWorld); object.worldToLocal(camPos); sky.position.copy(camPos); }
    },
    dispose() {},
  };
}
