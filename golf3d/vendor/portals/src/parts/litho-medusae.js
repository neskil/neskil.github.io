// THE GREAT MEDUSA: hero set piece of "litho-medusae" (The Plate of Medusae).
// A sea nettle 60 m across drawn as a four-stone chromolithograph: every fragment is one flat ink
// (paper, sepia key, rose, sea-green, ochre) switched on or off by crayon grain; colours darken only
// by overprinting (multiply). No smooth shading, no lights, no bloom.
//
// CONTRACT  buildHero(ctx, opts) -> { object, radius, height, center, anchors, update, dispose, ground:false,
//                                     setProgress, setInks, setPulseClock, uniforms, species }
// LOCAL SPACE  origin = base centre (level of the tentacle tips, straight under the mouth), +Y up, front +Z.
//   The camera arrives from +Z flying toward -Z; the mirror plane is x = 0. The mouth ring (portal seat) is at
//   (0, 290, 0). The bell axis leans 25 degrees from vertical toward -Z: (0, 0.906, -0.423), so the underside
//   opens toward the arriving camera and a 65 degree climb runs straight up the axis.
//   In the brief's (d, y) coordinates: z = 433 - d, y_local = y + 232.
// SIZE  radius ~34 m (bell rim 30 m), height ~330 m: bell crown at y 310, arms hang to y 140, tentacles to y 0.
// ANCHORS (local space)
//   mouth        centre of the 15.6 m mouth ring                      portalSeat.position is the same point
//   portalSeat   { position, normal }  normal = direction the portal faces, back down the axis toward the camera
//   axis         unit vector mouth -> crown (the camera's final heading)
//   flyThrough   ordered safe line: level approach, 7 degree sink, 45 m pull-up, 60 m straight up the axis.
//                Clearance: arms stay at |x| >= 10 m, the nearest tentacle roots are at |x| 8.5 m and all sway
//                and kinks push outward only, never toward x = 0.
//   viewpoints   reveal (250 m out), image (under the lappets, 31 s), climb (36 s)
//   nearRim, farRim, crown, gonads[4], armRoots[4], armWalls[4] (curtain centre lines at y 200), laneHalfWidth
// FROM BENEATH (the last frame of the flight)  a 4.5 m portal sits inside the ring with 2-3.5 m of flat dark stomach
//   (uDeep in every edition) showing round it; the four horseshoe gonads lie on the principal radii between the
//   lips, 11-20 m off the axis, thick middles toward the rim. Inner drawing (canals, seams, frill lines, margins)
//   thins to hairlines when a pixel covers more than about 0.45 m of the bell (lmBig), so the far bell stays paper.
//   The sixteen canals are anatomy, not rulings: forking, netting trees on the principal radii and sinuous single
//   canals between, tapering into dashes and ending inside the ring muscle (see INNER_FRAG); drawn large, the
//   subumbrella is mostly paper with the rose gathered along them. Grain cells are sized by the SHORT axis of a
//   pixel's footprint (lmGFoot), so arms and tentacles leaving past the lens keep a fine stipple instead of streaks.
// OPTS  palette [paper, sepia, rose, green, ochre, deep] (hex strings; brief palette by default)
//       species 'chrysaora' | 'pelagia' | 'cyanea' (seeded if absent)   period (s, 4-6, seeded)
//       shadeInk hex (the overprint that carries shade: green by default, ochre for the golden pull)
//       page: false to leave out the paper dome (the world has its own page)   light: Vector3 plate light
// PROGRESS  setProgress(u) keys the printing to the journey (ghost line until u 0.39, green, rose pouring
//       from the bell down the arms, ochre last by u 0.5); setInks(green, rose, ochre) sets the stones directly.
//       Left alone the piece is fully printed. setPulseClock(seconds) lets the world drive the 5 s pulse from
//       its own clock (pass null for wall time); the contraction peaks 0.24 of a period after each whole beat.
// COST  Chrysaora 116k triangles, Cyanea 113k, Pelagia about 100k; 7 draw calls (6 without the page); no textures,
//       no lights; build well under 100 ms, yielding between pieces.
// LIGHT  none: one fixed plate light direction (uniform uLight, upper left, a little toward the viewer).
//       Use post flat 1, bloom 0. The shaders ignore scene fog on purpose: ink fades to paper by distance
//       (fills between uFade.x and uFade.y metres, the key line thinning through the ghost strengths).
// STYLE FOR THE REST OF THE WORLD  export LITHO_VERT / LITHO_FRAG (shared GLSL), lithoUniforms(palette) and
//       styleMaterial(shared, { vertex, fragment, tint, side, uniforms, defines }). See the notes at styleMaterial.
import * as THREE from 'three';

const PALETTE = ['#E4E7D3', '#3A2A1E', '#C9627C', '#5E9E90', '#C8973A', '#3F6F66'];
const TAU = Math.PI * 2;
// RING_R: mean radius of the mouth ring (the portal, 4.5 m, sits inside it with a clear ring of stomach between)
const MOUTH_Y = 290, BELL_R = 30, RING_R = 7.8, TILT = 25 * Math.PI / 180, PULSE_SPACING = 45;

// ------------------------------------------------------------------ shared style GLSL
export const LITHO_VERT = /* glsl */`
uniform float uTime, uPulse, uPeriod;
float lmBeat(float ph) { ph = fract(ph); return smoothstep(0.0, 0.24, ph) * (1.0 - smoothstep(0.24, 1.0, ph)); }
// the bell's contraction: a function of distance from the axis in bell space, so the mouth never moves
vec3 lmPulse(vec3 p) {
  float r = length(p.xz);
  float w = smoothstep(7.0, 30.0, r);
  float c = lmBeat(uPulse - w * 0.05);
  p.xz *= 1.0 - 0.12 * c * w;
  p.y += 1.6 * lmBeat(uPulse) * smoothstep(0.0, 22.0, p.y) - 0.8 * c * w * w;
  float lf = smoothstep(29.0, 33.5, r) * lmBeat(uPulse - 0.08);
  p.xz *= 1.0 - 0.11 * lf; p.y -= 1.3 * lf;
  return p;
}
`;

export const LITHO_FRAG = /* glsl */`
uniform vec3 uPaper, uSepia, uRose, uGreen, uOchre, uDeep, uShade;
uniform vec3 uLight, uInk;
uniform vec4 uFade;
uniform float uSeedT, uSeedF, uPx;
float lmHash(vec3 p) { p = fract(p * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yxz + 33.33); return fract((p.x + p.y) * p.z); }
float lmVn(vec3 p) {
  vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  float a = mix(mix(lmHash(i), lmHash(i + vec3(1,0,0)), f.x), mix(lmHash(i + vec3(0,1,0)), lmHash(i + vec3(1,1,0)), f.x), f.y);
  float b = mix(mix(lmHash(i + vec3(0,0,1)), lmHash(i + vec3(1,0,1)), f.x), mix(lmHash(i + vec3(0,1,1)), lmHash(i + vec3(1,1,1)), f.x), f.y);
  return mix(a, b, f.z);
}
// metres of rest-pose surface under one pixel (take it once, outside any loop)
float lmFoot(vec3 rest) { return max(length(fwidth(rest)) * 0.7071, 1e-5); }
// crayon grain 0..1 riding the rest pose: cells stay about 3 px (two octaves cross-faded). The stone is re-seeded
// four times a second: each seed holds for half a step, then melts into the next (uSeedF 0..1), so the page boils
// softly instead of flipping; the blend is rescaled so the spread of the grain (and so mean coverage) never changes.
// On a surface seen at a slant (an arm or a tentacle leaving past the lens) the long axis of a pixel's footprint
// would stretch every cell into a streak several pixels long, so there the short axis rules: the stipple stays fine.
// Face-on the two are equal and nothing changes. (Derivatives: call lmGrain / lmGrainB outside any loop.)
float lmGFoot(vec3 p, float foot) { return min(foot, 2.0 * max(min(length(dFdx(p)), length(dFdy(p))), 1e-5)); }
float lmGrain(vec3 p, float foot, float off) {
  float L = log2(max(lmGFoot(p, foot) * 0.95 * max(uPx, 0.25), 1e-4));
  float l0 = floor(L), f = L - l0, s0 = exp2(l0);
  vec3 q0 = p / s0, q1 = p / (s0 * 2.0) + 31.7;
  float k1 = uSeedT + 1.0; if (k1 > 96.5) k1 = 0.0;
  vec3 o = vec3(17.13, 7.77, 3.31) * (uSeedT + off), o1 = vec3(17.13, 7.77, 3.31) * (k1 + off);
  float a = mix(lmVn(q0 + o), lmVn(q1 + o), f), b = mix(lmVn(q0 + o1), lmVn(q1 + o1), f);
  float w = clamp(uSeedF, 0.0, 1.0), n = (mix(a, b, w) - 0.5) / sqrt(w * w + (1.0 - w) * (1.0 - w));
  return clamp(n * 1.7 + 0.5, 0.0, 1.0);
}
// the second grain (overprints and register fronts): one seed per step, changing while the first grain holds
float lmGrainB(vec3 p, float foot, float off) {
  float L = log2(max(lmGFoot(p, foot) * 0.95 * max(uPx, 0.25), 1e-4));
  float l0 = floor(L), f = L - l0, s0 = exp2(l0);
  vec3 o = vec3(17.13, 7.77, 3.31) * (uSeedT + off);
  float n = mix(lmVn(p / s0 + o), lmVn(p / (s0 * 2.0) + o + 31.7), f);
  return clamp((n - 0.5) * 1.7 + 0.5, 0.0, 1.0);
}
// 1 when the surface is drawn large, 0 when a pixel covers more than about 0.45 m of it: inner drawing thins with it
float lmBig(float foot) { return 1.0 - smoothstep(0.15, 0.45, foot); }
// ink on or off for a tone 0 (bare paper) .. 1 (solid)
float lmOn(float tone, float g) { return smoothstep(-0.06, 0.06, tone * 1.12 - 0.06 - g); }
// a stone printing on: prog 0..1 sweeps along the body coordinate with a grainy front
float lmReg(float prog, float body, float g) { return smoothstep(0.0, 0.03, prog * 1.3 - body - g * 0.22 - 0.02); }
// key line: half width in pixels breathing 0.7..1.3 (1.4-2.6 px across) along a slow object-space noise
float lmLineW(vec3 rest) { return mix(0.7, 1.3, lmVn(rest * 0.13 + 3.7)) * uPx; }
float lmLine(float dpx, float w) { return 1.0 - smoothstep(w - 0.6, w + 0.6, dpx); }
vec3 lmMul(vec3 ink) { return ink / max(uPaper, vec3(1e-3)); }
// fill = product of ink multipliers over paper, line = key line coverage, dist = metres from the eye
vec4 lmFinish(vec3 fill, float line, float dist) {
  fill = mix(fill, vec3(1.0), smoothstep(uFade.x, uFade.y, dist));
  float lf = 0.42 * smoothstep(uFade.x * 0.8, uFade.y * 0.8, dist) + 0.22 * smoothstep(500.0, 700.0, dist) + 0.2 * smoothstep(900.0, 1200.0, dist);
  vec3 key = mix(lmMul(uSepia), vec3(1.0), lf);
  fill = mix(fill, key, clamp(line, 0.0, 1.0));
#ifdef LM_TINT
  return vec4(fill, 1.0);
#else
  return vec4(uPaper * fill, 1.0);
#endif
}
`;

// One set of uniforms shared by reference by every material of the style: the world coder passes the hero's
// `uniforms` (or a fresh lithoUniforms(palette)) to styleMaterial so page, company and hero share inks, light,
// grain seed and pulse. Update uTime, uSeedT = floor(time * 4) % 97, uSeedF (its cross-fade), uPx = buffer height / 450 each frame
// (the hero's update() does it for its own set).
export function lithoUniforms(palette = PALETTE, shadeInk) {
  const c = (i) => new THREE.Color(palette[i] || PALETTE[i]);
  return {
    uPaper: { value: c(0) }, uSepia: { value: c(1) }, uRose: { value: c(2) }, uGreen: { value: c(3) },
    uOchre: { value: c(4) }, uDeep: { value: c(5) }, uShade: { value: new THREE.Color(shadeInk || palette[3] || PALETTE[3]) },
    uLight: { value: new THREE.Vector3(-0.55, 0.7, 0.45).normalize() },
    uInk: { value: new THREE.Vector3(1, 1, 1) },            // green, rose, ochre stones 0..1
    uFade: { value: new THREE.Vector4(250, 450, 0, 0) },
    uSeedT: { value: 0 }, uSeedF: { value: 0 }, uPx: { value: 1 }, uTime: { value: 0 }, uPulse: { value: 0 }, uPeriod: { value: 5 },
  };
}

// styleMaterial: a ShaderMaterial in the plate's style.
//   tint: true  -> an overprint: writes the ink multiplier with multiply blending, depthWrite off (bell skins,
//                  frills, glass). Stack at most three. Order does not matter, so no sorting is needed.
//   tint: false -> opaque: writes paper x multiplier (reserves its own paper, occludes).
// The fragment source must end by writing gl_FragColor = lmFinish(fillMultiplier, lineCoverage, distance).
// Build a fill as: vec3 m = vec3(1.); m = mix(m, m * lmMul(uRose), lmOn(tone, lmGrain(rest, foot, 0.)));
export function styleMaterial(shared, o = {}) {
  const tint = !!o.tint;
  const mat = new THREE.ShaderMaterial({
    uniforms: Object.assign({}, shared, o.uniforms || {}),
    defines: Object.assign(tint ? { LM_TINT: 1 } : {}, o.defines || {}),
    vertexShader: LITHO_VERT + o.vertex, fragmentShader: LITHO_FRAG + o.fragment,
    side: o.side ?? THREE.FrontSide, fog: false, depthWrite: !tint, depthTest: o.depthTest ?? true, transparent: tint,
  });
  if (tint) {
    mat.blending = THREE.CustomBlending; mat.blendEquation = THREE.AddEquation;
    mat.blendSrc = THREE.DstColorFactor; mat.blendDst = THREE.ZeroFactor;
    mat.blendSrcAlpha = THREE.ZeroFactor; mat.blendDstAlpha = THREE.OneFactor;
  }
  return mat;
}

// ------------------------------------------------------------------ bell profile (bell space: axis +Y, rim plane y = 0)
function bellProfile(v, depth) {            // v 0 crown .. 1 rim
  const a = v * Math.PI * 0.5, s = Math.sin(a), c = Math.cos(a);
  return [BELL_R * s * (1 + 0.05 * Math.sin(2 * a)), depth * Math.pow(c, 0.85)];
}
function innerProfile(v, depth, thick) {
  const [r, y] = bellProfile(v, depth), c = Math.cos(v * Math.PI * 0.5);
  return [r * (0.955 + 0.045 * v), y - thick * Math.pow(c, 1.3) - 0.55 * (1 - v * v * v)];
}
function innerYAtR(rq, depth, thick) {      // height of the subumbrella at radius rq
  let lo = 0, hi = 1;
  for (let i = 0; i < 24; i++) { const m = (lo + hi) / 2; if (innerProfile(m, depth, thick)[0] < rq) lo = m; else hi = m; }
  return innerProfile(lo, depth, thick)[1];
}

// LOADING: BufferGeometry.computeVertexNormals() in steps. The same sums in the same order with the same library
// calls (three.js r170, indexed geometry without normals), so the normals are bit for bit those of the one call;
// the page is handed back every two hundred triangles (the arms alone have sixty thousand). The two loops are
// plain functions (a loop written inside an async function runs slower); their scratch vectors are not kept between calls.
const _pA = new THREE.Vector3(), _pB = new THREE.Vector3(), _pC = new THREE.Vector3(), _nA = new THREE.Vector3(), _nB = new THREE.Vector3(), _nC = new THREE.Vector3(), _cb = new THREE.Vector3(), _ab = new THREE.Vector3();
function addFaceNormals(index, pos, nor, i0, i1) {            // index entries i0 .. i1 - 1, three to a triangle
  for (let i = i0; i < i1; i += 3) {
    const vA = index.getX(i + 0), vB = index.getX(i + 1), vC = index.getX(i + 2);
    _pA.fromBufferAttribute(pos, vA); _pB.fromBufferAttribute(pos, vB); _pC.fromBufferAttribute(pos, vC);
    _cb.subVectors(_pC, _pB); _ab.subVectors(_pA, _pB); _cb.cross(_ab);
    _nA.fromBufferAttribute(nor, vA); _nB.fromBufferAttribute(nor, vB); _nC.fromBufferAttribute(nor, vC);
    _nA.add(_cb); _nB.add(_cb); _nC.add(_cb);
    nor.setXYZ(vA, _nA.x, _nA.y, _nA.z); nor.setXYZ(vB, _nB.x, _nB.y, _nB.z); nor.setXYZ(vC, _nC.x, _nC.y, _nC.z);
  }
}
function unitNormals(nor, i0, i1) {                           // normalizeNormals() for normals i0 .. i1 - 1
  for (let i = i0; i < i1; i++) { _pA.fromBufferAttribute(nor, i); _pA.normalize(); nor.setXYZ(i, _pA.x, _pA.y, _pA.z); }
}
async function vertexNormals(g, ctx) {
  const index = g.index, pos = g.getAttribute('position');
  const nor = new THREE.BufferAttribute(new Float32Array(pos.count * 3), 3);
  g.setAttribute('normal', nor);
  for (let i = 0, il = index.count; i < il; i += 600) { addFaceNormals(index, pos, nor, i, Math.min(il, i + 600)); await ctx.yield(); }
  for (let i = 0, il = nor.count; i < il; i += 500) { unitNormals(nor, i, Math.min(il, i + 500)); await ctx.yield(); }
  nor.needsUpdate = true;
}

// one lathed skin with scalloped lappets; inner = true gives the subumbrella (faces the axis)
async function bellSkin(sp, inner, ctx) {
  const NU = sp.NU, ND = 28, NL = 8, NV = ND + NL, N = sp.lappets;
  const nv = (NU + 1) * (NV + 1);
  const pos = new Float32Array(nv * 3), uv = new Float32Array(nv * 2), dark = new Float32Array(nv);
  for (let i = 0; i <= NV; i++) {
    await ctx.yield();
    for (let j = 0; j <= NU; j++) {
      const k = i * (NU + 1) + j, th = (j / NU) * TAU;
      let r, y, d = 0;
      if (i <= ND) {
        const v = Math.pow(i / ND, 0.9);
        [r, y] = inner ? innerProfile(v, sp.depth, sp.thick) : bellProfile(v, sp.depth);
      } else {
        const w = (i - ND) / NL;
        const lap = Math.pow(Math.abs(Math.sin(N * th * 0.5)), 0.55);
        const len = sp.lappetLen * (0.22 + 0.78 * lap), ph = 0.45 + 1.15 * w;
        // integrate a curling arc: out and down, then tucking under
        r = BELL_R + len * (Math.sin(ph) - Math.sin(0.45)) / 1.15 * 0.9;
        y = -len * (Math.cos(0.45) - Math.cos(ph)) / 1.15 * 1.25;
        r += (lap - 0.5) * 0.5 * w;                       // lappet centres bulge, notches pinch
        d = 0.25 + 0.5 * w;
      }
      pos[k * 3] = r * Math.sin(th); pos[k * 3 + 1] = y; pos[k * 3 + 2] = r * Math.cos(th);
      uv[k * 2] = j / NU; uv[k * 2 + 1] = i / NV; dark[k] = d;
    }
  }
  await ctx.yield();
  const idx = new Uint32Array(NU * NV * 6); let q = 0;
  for (let i = 0; i < NV; i++) {
    if (i % 4 === 3) await ctx.yield();
    for (let j = 0; j < NU; j++) {
      const a = i * (NU + 1) + j, b = a + 1, c = a + NU + 1, d = c + 1;
      if (inner) { idx[q++] = a; idx[q++] = b; idx[q++] = c; idx[q++] = b; idx[q++] = d; idx[q++] = c; }
      else { idx[q++] = a; idx[q++] = c; idx[q++] = b; idx[q++] = b; idx[q++] = c; idx[q++] = d; }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.setAttribute('aDark', new THREE.BufferAttribute(dark, 1));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  await ctx.yield();
  await vertexNormals(g, ctx);
  await ctx.yield();
  const nor = g.attributes.normal.array;                  // close the seam
  for (let i = 0; i <= NV; i++) {
    const a = (i * (NU + 1)) * 3, b = (i * (NU + 1) + NU) * 3;
    for (let c = 0; c < 3; c++) { const m = (nor[a + c] + nor[b + c]) * 0.5; nor[a + c] = m; nor[b + c] = m; }
  }
  return g;
}

// ------------------------------------------------------------------ bell shaders
const BELL_VERT = /* glsl */`
attribute float aDark;
uniform float uDepth;
varying vec3 vRest, vN, vWp; varying vec2 vUv; varying float vDark, vBody;
void main() {
  vec3 p = lmPulse(position);
  vRest = position; vUv = uv; vDark = aDark;
  vBody = 0.1 * clamp(1.0 - position.y / uDepth, 0.0, 1.3);
  vec4 wp = modelMatrix * vec4(p, 1.0);
  vWp = wp.xyz; vN = mat3(modelMatrix) * normal;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

const BELL_HEAD = /* glsl */`
uniform float uLappets, uSpecies, uLapV, uSeed;
varying vec3 vRest, vN, vWp; varying vec2 vUv; varying float vDark, vBody;
`;

// exumbrella: mostly bare paper on the face, rose thickening to the edge, sixteen rose darts, lappet seams
const OUTER_FRAG = BELL_HEAD + /* glsl */`
void main() {
  vec3 N = normalize(vN + vec3(0.0, 1e-5, 0.0)), V = normalize(cameraPosition - vWp + vec3(0.0, 1e-5, 0.0));
  float ndv = abs(dot(N, V));
  float foot = lmFoot(vRest), g = lmGrain(vRest, foot, uSeed), g2 = lmGrainB(vRest + 19.3, foot, uSeed + 5.0);
  float w = lmLineW(vRest);
  float rr = length(vRest.xz) / 30.0, rm = max(length(vRest.xz), 0.05);
  float shade = 0.5 - 0.5 * dot(N, uLight);
  float fres = pow(max(1.0 - ndv, 0.0), 1.7), big = lmBig(foot);
  float a = abs(fract(vUv.x * 16.0 + 0.5) - 0.5);
  float dartW = 0.19 * smoothstep(0.26, 0.92, rr) * (1.0 - smoothstep(0.93, 1.0, rr));
  float dart = (1.0 - smoothstep(dartW - 0.02, dartW + 0.02, a)) * step(0.27, rr) * step(uSpecies, 0.5);   // Chrysaora only
  float lapZone = smoothstep(uLapV - 0.02, uLapV + 0.03, vUv.y);
  float tone = 0.03 + 0.6 * fres + 0.44 * smoothstep(0.45, 0.92, shade) + 0.42 * dart + 0.45 * vDark + 0.12 * smoothstep(0.75, 1.0, rr);
  float reg = lmReg(uInk.y, vBody, g2), regG = lmReg(uInk.x, vBody, g), regO = lmReg(uInk.z, vBody, g);
  vec3 m = vec3(1.0);
  m = mix(m, m * lmMul(uRose), lmOn(tone, g) * reg);
  m = mix(m, m * lmMul(uShade), lmOn(min((tone - 0.72) * 2.4 + 0.25 * smoothstep(0.8, 1.0, shade), 0.6), g2) * regG);
  // Pelagia: ochre warts; Cyanea: ochre crown patch
  float wart = step(0.5, uSpecies) * step(uSpecies, 1.5) * smoothstep(0.70, 0.74, lmVn(vRest * 0.55 + 7.0)) * step(rr, 0.97);
  float crown = step(1.5, uSpecies) * (1.0 - smoothstep(0.2, 0.3, rr + 0.05 * sin(vUv.x * 100.53)));
  m = mix(m, lmMul(uOchre), max(wart, crown * lmOn(0.75, g)) * regO);
  // key line: silhouette, lappet seams, margin
  float line = lmLine(ndv / max(fwidth(ndv), 1e-4), w * 0.85);
  float fu = max(fwidth(vUv.x), 1e-6);
  float seam = abs(fract(vUv.x * uLappets + 0.5) - 0.5) / (uLappets * fu);
  line = max(line, lmLine(seam, w * mix(0.5, 0.8, big)) * lapZone * mix(0.4, 1.0, big));
  line = max(line, lmLine((1.0 - vUv.y) / max(fwidth(vUv.y), 1e-5), w * mix(0.75, 1.3, big)));
  float dedge = abs(a - dartW) / max(fwidth(a - dartW), 1e-5);                    // dart outline, dashed where lit
  float dash = step(0.35, fract(rr * 22.0 + lmHash(vec3(floor(vUv.x * 16.0), 1.0, 2.0)))) ;
  line = max(line, lmLine(dedge, w * 0.55) * step(0.3, rr) * step(rr, 0.93) * step(uSpecies, 0.5) * mix(dash, 1.0, smoothstep(0.45, 0.7, shade)) * 0.8 * mix(0.35, 1.0, big));
  gl_FragColor = lmFinish(m, line, length(cameraPosition - vWp));
}`;

// subumbrella: sixteen canals, the ring-muscle band, stomach floor, lappet seams
const INNER_FRAG = BELL_HEAD + /* glsl */`
const float STOMACH_R = ${(RING_R + 2.4).toFixed(2)};
void main() {
  vec3 N = normalize(vN + vec3(0.0, 1e-5, 0.0)), V = normalize(cameraPosition - vWp + vec3(0.0, 1e-5, 0.0));
  float ndv = abs(dot(N, V));
  float foot = lmFoot(vRest), g = lmGrain(vRest, foot, uSeed + 2.0), g2 = lmGrainB(vRest + 41.1, foot, uSeed + 9.0);
  float w = lmLineW(vRest);
  float r = max(length(vRest.xz), 0.05), rr = r / 30.0;
  float shade = 0.5 - 0.5 * dot(N, uLight);
  float fres = pow(max(1.0 - ndv, 0.0), 1.5), big = lmBig(foot);
  float band = smoothstep(0.52, 0.58, rr) * (1.0 - smoothstep(0.80, 0.86, rr));
  float lapZone = smoothstep(uLapV - 0.02, uLapV + 0.03, vUv.y);
  // canals (the gastrovascular system), each drawn about its own radius so the plate stays mirrored: the eight on the
  // principal radii are trees (a stem that opens into a tuning fork of two waving branches, each sending a twig back
  // to meet its twin, so the canals net as a scyphozoan's do), the eight between them single sinuous canals; all
  // taper, break into dashes at their tips and end inside the ring muscle, short of the margin. Nothing runs
  // straight from mouth to rim.
  float fu = max(fwidth(vUv.x), 1e-6), fr = max(fwidth(r), 1e-5);
  float x16 = vUv.x * 16.0, kc = floor(x16 + 0.5), ca = x16 - kc, km = kc - 16.0 * floor(kc / 16.0), kh = min(km, 16.0 - km);
  float h1 = lmHash(vec3(kh, 5.0, 1.0)), h2 = lmHash(vec3(kh, 9.0, 2.0));
  float odd = step(0.5, fract(km * 0.5 + 0.25)), per = 1.0 - step(0.2, fract(km * 0.25 + 0.1));
  float cellM = r * 0.3927, am = ca * cellM, sgm = km < 8.0 ? 1.0 : -1.0;
  float offO = sgm * (0.6 * sin(r * 0.42 + h1 * 6.283) + 0.25 * sin(r * 0.97 + h2 * 6.283)) * smoothstep(0.27, 0.45, rr);
  float rF = mix(13.0 + 2.5 * h1, 9.4 + 1.2 * h1, per), q = max(r - rF, 0.0);
  float bo = min(2.1 * (1.0 - exp(-q / 3.5)) + 0.07 * q + 0.22 * sin(r * 0.8 + h1 * 6.283) * smoothstep(1.0, 5.0, q), 0.42 * cellM), q2 = max(q - 5.5 - 2.0 * h2, 0.0);
  float dE = min(abs(abs(am) - bo), abs(abs(am) - bo + 0.36 * q2) + (1.0 - step(1e-4, q2)) * 9.0);
  float dC = mix(dE, abs(am - offO), odd), endC = mix(0.89 + 0.03 * h2, 0.78 + 0.05 * h2, odd);
  float tr = smoothstep(0.3, endC, rr), cshow = step(0.27, rr) * (1.0 - smoothstep(endC - 0.05, endC, rr)) * (1.0 - lapZone);
  float cnear = exp(-dC * dC / 1.6) * step(0.27, rr) * (1.0 - smoothstep(endC - 0.08, endC + 0.05, rr));
  // tone. Small on the page the subumbrella is the bell's shade side; drawn large (from beneath) its face is mostly
  // paper and the rose gathers along the canals, in the ring muscle, at the margin and round the stomach
  float sh = smoothstep(0.4, 0.92, shade), rim = smoothstep(0.8, 1.0, rr), rimN = smoothstep(0.72, 1.0, rr), ctr = 1.0 - smoothstep(0.26, 0.36, rr);
  float tone = mix(0.04 + 0.28 * sh + 0.3 * band + 0.14 * rim, 0.03 + 0.11 * sh + 0.15 * band + 0.27 * rimN + 0.27 * cnear, big)
    + 0.22 * fres + 0.42 * vDark + 0.3 * ctr;
  float reg = lmReg(uInk.y, vBody, g2), regG = lmReg(uInk.x, vBody, g);
  vec3 m = vec3(1.0);
  m = mix(m, m * lmMul(uRose), lmOn(tone, g) * reg);
  float deep = (tone - 0.66) * 2.2 + 0.5 * ctr;
  m = mix(m, m * lmMul(uShade), lmOn(min(deep, 0.62), g2) * regG);
  float line = lmLine(dC / max(cellM * 16.0 * fu, 1e-5), w * mix(0.5, 1.15, big) * mix(1.0, 0.68, tr)) * cshow * mix(0.5, 1.0, big);   // hairlines when the bell is small
  line *= mix(1.0, step(0.3, fract(r * 0.7 + h1 * 9.0)), smoothstep(0.75, 0.95, tr));
  // ring muscle: concentric dashes, faded out before they can alias
  float sp = 1.3, rd = abs(fract(r / sp) - 0.5) * sp / fr;
  float fine = smoothstep(2.5, 5.0, sp / fr);
  float dsh = step(0.3, fract(vUv.x * 48.0 + lmHash(vec3(floor(r / sp), 3.0, 1.0)) * 7.0));
  line = max(line, lmLine(rd, w * 0.6) * band * fine * dsh * 0.75);
  line = max(line, lmLine(abs(r - STOMACH_R) / fr, w * mix(0.5, 1.0, big)) * mix(0.5, 1.0, big));   // stomach margin
  line = max(line, lmLine(ndv / max(fwidth(ndv), 1e-4), w * 0.8));
  float seam = abs(fract(vUv.x * uLappets + 0.5) - 0.5) / (uLappets * fu);
  line = max(line, lmLine(seam, w * mix(0.5, 0.8, big)) * lapZone * mix(0.4, 1.0, big));
  line = max(line, lmLine((1.0 - vUv.y) / max(fwidth(vUv.y), 1e-5), w * mix(0.75, 1.3, big)));
  gl_FragColor = lmFinish(m, line, length(cameraPosition - vWp));
}`;

// ------------------------------------------------------------------ organs: stomach cup, mouth ring and lips, gonads, rhopalia
// each part is a (nu x nv) grid; fn(u, v, out) fills out = [x, y, z, dark]
async function gridMerge(parts, ctx) {
  let nVert = 0, nIdx = 0;
  for (const p of parts) { nVert += (p.nu + 1) * (p.nv + 1); nIdx += p.nu * p.nv * 6; }
  const pos = new Float32Array(nVert * 3), uv = new Float32Array(nVert * 2), dark = new Float32Array(nVert), kind = new Float32Array(nVert);
  const idx = new Uint32Array(nIdx), out = [0, 0, 0, 0];
  let v0 = 0, q = 0; const seams = [];
  for (const p of parts) {
    const row = p.nu + 1, every = Math.max(1, Math.round(60 / row));
    for (let i = 0; i <= p.nv; i++) {
      for (let j = 0; j <= p.nu; j++) {
        const k = v0 + i * row + j;
        p.fn(j / p.nu, i / p.nv, out);
        pos[k * 3] = out[0]; pos[k * 3 + 1] = out[1]; pos[k * 3 + 2] = out[2]; dark[k] = out[3]; kind[k] = p.kind;
        uv[k * 2] = j / p.nu; uv[k * 2 + 1] = i / p.nv;
      }
      if (i % every === every - 1) await ctx.yield();
    }
    for (let i = 0; i < p.nv; i++) for (let j = 0; j < p.nu; j++) {
      const a = v0 + i * row + j, b = a + 1, c = a + row, d = c + 1;
      if (p.flip) { idx[q++] = a; idx[q++] = b; idx[q++] = c; idx[q++] = b; idx[q++] = d; idx[q++] = c; }
      else { idx[q++] = a; idx[q++] = c; idx[q++] = b; idx[q++] = b; idx[q++] = c; idx[q++] = d; }
    }
    if (p.wrap) for (let i = 0; i <= p.nv; i++) seams.push(v0 + i * row, v0 + i * row + p.nu);
    v0 += row * (p.nv + 1);
    await ctx.yield();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.setAttribute('aDark', new THREE.BufferAttribute(dark, 1));
  g.setAttribute('aKind', new THREE.BufferAttribute(kind, 1));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  await ctx.yield();
  await vertexNormals(g, ctx);
  await ctx.yield();
  const nor = g.attributes.normal.array;
  for (let s = 0; s < seams.length; s += 2) {
    const a = seams[s] * 3, b = seams[s + 1] * 3;
    for (let c = 0; c < 3; c++) { const m = (nor[a + c] + nor[b + c]) * 0.5; nor[a + c] = m; nor[b + c] = m; }
  }
  return g;
}

function organParts(sp, rng) {
  const parts = [];
  const corner = (th) => 1 + 0.10 * Math.cos(4 * th - Math.PI);          // four-cornered mouth, corners on the diagonals
  const yTop = innerProfile(0, sp.depth, sp.thick)[1] - 0.25;
  // stomach cup: from the ring up to the subumbrella, capped (kind 0)
  parts.push({ nu: 64, nv: 10, kind: 0, wrap: true, flip: true, fn: (u, v, o) => {
    const th = u * TAU; let r, y;
    if (v < 0.7) { const t = v / 0.7; r = (RING_R - 0.3 + 2.6 * t * t) * corner(th); y = 0.1 + yTop * Math.pow(t, 0.8); }
    else { const t = (v - 0.7) / 0.3; r = (RING_R + 2.3) * corner(th) * (1 - t); y = yTop + 0.9 * Math.sin(t * Math.PI * 0.5); }
    o[0] = r * Math.sin(th); o[1] = y; o[2] = r * Math.cos(th); o[3] = v;
  } });
  // mouth ring: a thick rolled rim (kind 1)
  parts.push({ nu: 96, nv: 8, kind: 1, wrap: true, fn: (u, v, o) => {
    const th = u * TAU, a = v * TAU, R = RING_R * corner(th), t = 0.62 + 0.12 * Math.sin(th * 12);
    const r = R + t * Math.cos(a), y = t * 0.8 * Math.sin(a);
    o[0] = r * Math.sin(th); o[1] = y; o[2] = r * Math.cos(th); o[3] = 0.3 + 0.25 * (0.5 - 0.5 * Math.sin(a));
  } });
  // four frilled lips: a ruffled collar longest on the diagonals (kind 1, dark >= 1 marks the frill for the shader)
  const frillPh = rng.range(0, TAU), frillN = sp.id === 'cyanea' ? 44 : 36;
  parts.push({ nu: 224, nv: 6, kind: 1, wrap: true, fn: (u, v, o) => {
    const th = u * TAU, lip = Math.pow(0.5 + 0.5 * Math.cos(4 * th - Math.PI), 1.6);
    const len = sp.lipLen * (0.35 + 0.65 * lip), e = v * len;
    const ruff = Math.sin(th * frillN + frillPh) * 0.5 + Math.sin(th * frillN * 0.37 + 1.3) * 0.3;
    const r = RING_R * corner(th) + 0.5 + e * 0.78 + ruff * 0.55 * v * v;
    const y = -0.35 - e * 0.62 + ruff * 0.75 * v * v;
    o[0] = r * Math.sin(th); o[1] = y; o[2] = r * Math.cos(th); o[3] = 1 + v;
  } });
  // four horseshoe gonads lying against the subumbrella on the principal radii, between the lips (kind 2):
  // the thick middle of each faces the rim and the open ends the mouth, so all of it shows from beneath
  const gr = 14, gy = innerYAtR(gr, sp.depth, sp.thick), slope = (innerYAtR(gr + 1, sp.depth, sp.thick) - innerYAtR(gr - 1, sp.depth, sp.thick)) / 2;
  const sl = Math.hypot(1, slope), gonads = [];
  for (let k = 0; k < 4; k++) {
    const tg = k * Math.PI * 0.5, sx = Math.sin(tg), cz = Math.cos(tg), lob = rng.range(0, TAU), nl = rng.int(8, 11);
    const en = [-sx * slope / sl, 1 / sl, -cz * slope / sl];
    const C = [gr * sx - en[0] * 1.5, gy - en[1] * 1.5, gr * cz - en[2] * 1.5];
    gonads.push(new THREE.Vector3(C[0], C[1], C[2]));
    parts.push({ nu: 60, nv: 10, kind: 2, fn: (u, v, o) => {
      const ph = (u - 0.5) * 2 * 2.25, a = v * TAU;
      const end = Math.sqrt(Math.max(0, 1 - Math.pow(Math.abs(u - 0.5) * 2, 6)));
      const rho = sp.gonadTube * (1 + 0.24 * Math.sin(ph * nl + lob)) * (0.25 + 0.75 * end);
      const R = sp.gonadR + rho * Math.cos(a), h = rho * 0.8 * Math.sin(a);
      const cr = Math.cos(ph) * R, ct = Math.sin(ph) * R, rad = gr + cr;          // it follows the dome, 1.3 m under it
      o[0] = rad * sx + ct * cz;
      o[1] = innerYAtR(Math.min(Math.hypot(rad, ct), 28.5), sp.depth, sp.thick) - 1.3 - h;
      o[2] = rad * cz - ct * sx;
      o[3] = 0.5 - 0.5 * Math.cos(a);
    } });
  }
  // eight rhopalia: ochre clubs in the notches on the principal radii (kind 3)
  for (let k = 0; k < 8; k++) {
    const tg = k * Math.PI * 0.25, sx = Math.sin(tg), cz = Math.cos(tg);
    parts.push({ nu: 10, nv: 6, kind: 3, fn: (u, v, o) => {
      const a = u * TAU, b = v * Math.PI, rad = 0.62 * Math.sin(b) * (1 + 0.5 * v);
      const out = BELL_R + 0.5 + rad * Math.cos(a) * 0.9, y = -0.2 - 1.5 * (0.5 - 0.5 * Math.cos(b)), tx = rad * Math.sin(a);
      o[0] = out * sx + tx * cz; o[1] = y; o[2] = out * cz - tx * sx; o[3] = v;
    } });
  }
  return { parts, gonads, yTop };
}

const ORGAN_VERT = /* glsl */`
attribute float aDark, aKind;
varying vec3 vRest, vN, vWp, vOut; varying vec2 vUv; varying float vDark, vKind;
void main() {
  vec3 p = position;
  // which way is out of the stomach cup here (its wall: away from the axis; its cap: up), so the fragment knows
  // whether it is looking at the dark inside or at the manubrium's outer wall whatever the winding
  vOut = mat3(modelMatrix) * mix(vec3(position.x, 0.0, position.z) / max(length(position.xz), 0.05), vec3(0.0, 1.0, 0.0), step(0.7, aDark));
  float e = max(aDark - 1.0, 0.0) * step(0.5, aKind) * step(aKind, 1.5);      // lip frill: 0 at the ring .. 1 at the edge
  float fl = lmBeat(uPulse - 0.04);
  p.y += (sin(uv.x * 201.06 - uTime * 1.7) * 0.32 + sin(uv.x * 81.7 + uTime * 1.1) * 0.2) * e * e - 0.5 * fl * e;
  p.xz *= 1.0 - 0.07 * fl * e;
  p = lmPulse(p);
  vRest = position; vUv = uv; vDark = aDark; vKind = aKind;
  vec4 wp = modelMatrix * vec4(p, 1.0);
  vWp = wp.xyz; vN = mat3(modelMatrix) * normal;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

const ORGAN_FRAG = /* glsl */`
uniform float uSeed;
varying vec3 vRest, vN, vWp, vOut; varying vec2 vUv; varying float vDark, vKind;
void main() {
  vec3 N = normalize(vN + vec3(0.0, 1e-5, 0.0)), V = normalize(cameraPosition - vWp + vec3(0.0, 1e-5, 0.0));
  if (!gl_FrontFacing) N = -N;
  float ndv = abs(dot(N, V));
  float foot = lmFoot(vRest), g = lmGrain(vRest, foot, uSeed + 3.0), g2 = lmGrainB(vRest + 27.7, foot, uSeed + 11.0);
  float big = lmBig(foot), w = lmLineW(vRest);
  float shade = 0.5 - 0.5 * dot(N, uLight);
  float sil = lmLine(ndv / max(fwidth(ndv), 1e-4), w * mix(0.6, 1.0, big)) * mix(0.6, 1.0, big);
  float regG = lmReg(uInk.x, 0.08, g), regR = lmReg(uInk.y, 0.09, g2), regO = lmReg(uInk.z, 0.08, g);
  vec3 m = vec3(1.0); float line = sil;
  if (vKind < 0.5) {
    // stomach: the darkest flat on the plate, sparse lighter flecks on the lit side, canals raying up it
    // (inside, seen up through the mouth); the outside wall is the manubrium in sea-green shade
    float inside = step(dot(V, vOut), 0.0);
    vec3 deep = lmMul(uDeep);                                        // flat, in every edition: the darkest thing on the plate
    vec3 wall = mix(vec3(1.0), lmMul(uShade), lmOn(0.3 + 0.6 * smoothstep(0.3, 0.9, shade), g));
    wall = mix(wall, wall * lmMul(uRose), lmOn(0.25 + 0.3 * vDark, g2) * regR);
    m = mix(m, mix(wall, deep, inside), regG);
    float cd = abs(fract(vUv.x * 16.0 + 0.5) - 0.5) / (16.0 * max(fwidth(vUv.x), 1e-6));
    line = max(line * 0.6, lmLine(cd, w * mix(0.6, 0.9, inside) * mix(0.6, 1.0, big)) * step(0.6, length(vRest.xz)) * mix(0.4, 1.0, big));
  } else if (vKind < 1.5) {
    // mouth ring and frilled lips: rose, sea-green in the folds, a doubled edge
    float e = max(vDark - 1.0, 0.0), frill = step(1.0, vDark);
    float tone = mix(0.45 + 0.45 * vDark + 0.3 * shade, 0.2 + 0.5 * smoothstep(0.3, 0.9, shade) + 0.45 * (1.0 - e), frill);
    m = mix(m, m * lmMul(uRose), lmOn(tone, g) * regR);
    m = mix(m, m * lmMul(uShade), lmOn(min((tone - 0.7) * 2.3, 0.6), g2) * regG);
    float fe = max(fwidth(vDark), 1e-5);
    line = max(line, frill * lmLine((1.0 - e) / fe, w * mix(0.7, 1.3, big)));
    line = max(line, frill * lmLine(abs(e - 0.8) / fe, w * 0.55) * step(0.4, fract(vUv.x * 90.0)) * 0.8 * big);
  } else if (vKind < 2.5) {
    // gonad: ochre core rimmed in rose
    float core = smoothstep(0.56, 0.64, ndv + 0.12 * (g - 0.5));
    float tone = 0.62 + 0.4 * shade;
    vec3 oc = mix(vec3(1.0), lmMul(uOchre), lmOn(tone, g) * regO);
    oc = mix(oc, oc * lmMul(uRose), lmOn((shade - 0.62) * 2.0, g2) * regR);
    vec3 rim = mix(vec3(1.0), lmMul(uRose), lmOn(0.8, g) * regR);
    m = mix(rim, oc, core);
    float fd = abs(fract(vUv.x * 30.0) - 0.5) / 30.0 * 17.0 / foot;                // frill lines across the tube
    line = max(line, lmLine(fd, w * 0.55) * (1.0 - core) * 0.8 * big);
    line = max(line, lmLine(abs(ndv - 0.6) / max(fwidth(ndv), 1e-4), w * 0.5) * step(0.45, fract(vUv.x * 21.0)) * 0.7 * big);
  } else {
    m = mix(m, lmMul(uOchre), lmOn(0.7 + 0.3 * shade, g) * regO);
  }
  gl_FragColor = lmFinish(m, line, length(cameraPosition - vWp));
}`;

// ------------------------------------------------------------------ oral arms: four V-folded ribbons with ruffled double edges
// hang space: mouth at the origin, +Y up. Returns geometry and the curtain centre lines.
async function armGeometry(sp, armSeeds, tiltPoint, ctx) {
  const NS = sp.armNS, NT = 18, L = sp.armLen, row = NT + 1;
  const nv = 4 * (NS + 1) * row;
  const pos = new Float32Array(nv * 3), st = new Float32Array(nv * 3), arm = new Float32Array(nv * 4);
  const idx = new Uint32Array(4 * NS * NT * 6);
  const roots = [], walls = []; let q = 0, v0 = 0;
  for (let k = 0; k < 4; k++) {
    const sx = k < 2 ? 1 : -1, fr = k % 2 === 0 ? 1 : -1;
    const A0 = tiltPoint(sx * 5.6, -0.7, fr * 5.6);
    const Cx = sx * sp.armX, Cz = fr > 0 ? 9.5 : -11.5;
    // the mirrored twin shares every seeded number; only the phase lag differs (left 0.5 s behind right)
    const twin = k < 2 ? k : k - 2;
    const ph = armSeeds[twin * 3], me = armSeeds[twin * 3 + 1], mf = armSeeds[twin * 3 + 2];
    const wl = Math.hypot(0.55, 0.83), Wx = sx * 0.55 / wl, Wz = fr * 0.83 / wl, Nx = sx * Wz, Nz = -sx * Wx;
    roots.push(new THREE.Vector3(A0.x, A0.y, A0.z)); walls.push(new THREE.Vector3(Cx, -90, Cz));
    for (let i = 0; i <= NS; i++) {
      const s = L * Math.pow(i / NS, 1.35), f = 1 - Math.exp(-s / 5.5), f2 = f * f * (3 - 2 * f);
      const mean = Math.sin(s * 0.045 + me) * 1.1 * Math.min(1, s / 40) * sx;         // slow static meander, mirrored
      const cx = A0.x + (Cx - A0.x) * f2 + Math.abs(Nx) * sx * Math.abs(mean) * 0.6;
      const cz = A0.z + (Cz - A0.z) * f2 + mean * mf;
      const cy = A0.y - 0.6 - (s - 5.0 * f);
      const grow = 0.26 + 0.74 * Math.min(1, s / 26) ** 0.8, tip = Math.pow(Math.max(0, 1 - Math.max(0, s - (L - 34)) / 34), 0.75);
      const wob = 1 + 0.16 * Math.sin(s * 0.11 + ph * 2);
      const hw = Math.max(0.05, sp.armW * 0.5 * grow * tip * wob);
      const fold = sp.armFold * hw * (0.4 + 0.6 * Math.min(1, s / 12));
      for (let j = 0; j <= NT; j++) {
        const t = (j / NT) * 2 - 1, e = Math.abs(t), kk = v0 + i * row + j;
        const fo = (Math.pow(e, 1.4) - 0.45) * fold;
        pos[kk * 3] = cx + Wx * t * hw + Nx * fo; pos[kk * 3 + 1] = cy; pos[kk * 3 + 2] = cz + Wz * t * hw + Nz * fo;
        st[kk * 3] = s; st[kk * 3 + 1] = t; st[kk * 3 + 2] = hw;
        arm[kk * 4] = Wx; arm[kk * 4 + 1] = Wz; arm[kk * 4 + 2] = sx > 0 ? 0 : 0.5; arm[kk * 4 + 3] = ph;
      }
      if (i % 6 === 5) await ctx.yield();
    }
    await ctx.yield();
    for (let i = 0; i < NS; i++) {
      if (i % 60 === 59) await ctx.yield();
      for (let j = 0; j < NT; j++) {
        const a = v0 + i * row + j, b = a + 1, c = a + row, d = c + 1;
        idx[q++] = a; idx[q++] = c; idx[q++] = b; idx[q++] = b; idx[q++] = c; idx[q++] = d;
      }
    }
    v0 += (NS + 1) * row;
    await ctx.yield();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aSt', new THREE.BufferAttribute(st, 3));
  g.setAttribute('aArm', new THREE.BufferAttribute(arm, 4));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  await ctx.yield();
  await vertexNormals(g, ctx);
  await ctx.yield();
  return { geometry: g, roots, walls };
}

const ARM_VERT = /* glsl */`
attribute vec3 aSt; attribute vec4 aArm;
uniform float uArmLen, uRuffle;
varying vec3 vRest, vN, vWp; varying vec3 vSt; varying float vBody;
void main() {
  float s = aSt.x, t = aSt.y, hw = aSt.z, e = abs(t), sg = t < 0.0 ? -1.0 : 1.0;
  float sxn = aArm.x < 0.0 ? -1.0 : 1.0;
  vec3 Wd = vec3(aArm.x, 0.0, aArm.y), Nd = sxn * vec3(aArm.y, 0.0, -aArm.x);
  float lag = aArm.z / uPeriod;                                   // left arms half a second behind
  float tt = uTime - aArm.z;
  // the pulse sends a ruffle down the arm at 9 m/s: a travelling envelope spaced one period apart
  float x = fract(s / ${PULSE_SPACING}.0 - uPulse + lag + 0.5);
  float kick = exp(-(x - 0.5) * (x - 0.5) * 42.0);
  float env = smoothstep(1.0, 14.0, s) * (0.55 + 1.0 * kick) * uRuffle;
  float A = (0.14 + 1.1 * e * e) * env;
  float kf = 0.63, phase = s * kf - tt * 1.9 + aArm.w + sg * 1.25;
  // a tight frill on the outer third of each leaf, riding the slow undulation
  float e4 = e * e * e * e, Af = 0.62 * e4 * smoothstep(1.0, 10.0, s) * uRuffle * (0.7 + 0.6 * kick), kq = 1.4;
  float fph = s * kq - tt * 3.1 + aArm.w * 3.0 + sg * 2.1;
  float wave = sin(phase) + 0.42 * sin(phase * 2.3 + 1.7);
  float D = A * wave + Af * sin(fph);
  float dDds = A * kf * (cos(phase) + 0.966 * cos(phase * 2.3 + 1.7)) + Af * kq * cos(fph);
  float dDdw = (2.2 * e * env * wave + 2.5 * e * e * e * smoothstep(1.0, 10.0, s) * uRuffle * sin(fph)) * sg / max(hw, 0.05);
  vec3 p = position + Nd * D + Wd * sg * e * 0.35 * env * sin(phase * 0.71 + 2.0);
  // the whole curtain swings slowly, and only outward from the mirror plane
  float sway = (0.5 + 0.5 * sin(s * 0.024 - tt * 0.23 + aArm.w)) * smoothstep(8.0, 120.0, s);
  p.x += sxn * sway * 2.6; p.z += sin(s * 0.031 - tt * 0.19 + aArm.w * 1.7) * 2.2 * smoothstep(8.0, 120.0, s);
  p.y += kick * 0.9 * smoothstep(1.0, 14.0, s);
  float sgn = dot(normal, Nd) < 0.0 ? -1.0 : 1.0;
  vec3 n = normal - sgn * (Wd * dDdw - vec3(0.0, 1.0, 0.0) * dDds);
  vRest = position; vSt = aSt; vBody = 0.11 + 0.55 * s / uArmLen;
  vec4 wp = modelMatrix * vec4(p, 1.0);
  vWp = wp.xyz; vN = mat3(modelMatrix) * n;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

const ARM_FRAG = /* glsl */`
uniform float uSeed;
varying vec3 vRest, vN, vWp; varying vec3 vSt; varying float vBody;
void main() {
  vec3 N = normalize(vN + vec3(0.0, 1e-5, 0.0));
  vec3 V = normalize(cameraPosition - vWp + vec3(0.0, 1e-5, 0.0));
  if (dot(N, V) < 0.0) N = -N;
  float s = vSt.x, t = vSt.y, e = abs(t);
  float foot = lmFoot(vRest), g = lmGrain(vRest, foot, uSeed + 4.0), g2 = lmGrainB(vRest + 13.1, foot, uSeed + 8.0);
  float w = lmLineW(vRest);
  float shade = 0.5 - 0.5 * dot(N, uLight);
  float core = 1.0 - smoothstep(0.0, 0.75, e);
  float tone = 0.2 + 0.52 * smoothstep(0.3, 0.92, shade) + 0.42 * core * core + 0.3 * (1.0 - smoothstep(0.0, 14.0, s));
  float ft = max(fwidth(t), 1e-5);
  tone -= 0.3 * smoothstep(10.0, 32.0, 1.0 / ft) * (1.0 - core * core);           // a leaf brushing the lens: more paper, the line work carries it
  float reg = lmReg(uInk.y, vBody, g2), regG = lmReg(uInk.x, vBody, g);
  vec3 m = vec3(1.0);
  m = mix(m, m * lmMul(uRose), lmOn(tone, g) * reg);
  m = mix(m, m * lmMul(uShade), lmOn(min((tone - 0.74) * 2.4, 0.58), g2) * regG);
  float big = smoothstep(4.0, 12.0, 1.0 / ft);                                    // half width in pixels: thin the drawing when small
  float line = lmLine((1.0 - e) / ft, w * mix(0.6, 1.3, big));                                   // the edge
  float dash = step(0.38, fract(s * 0.42 + 0.3 * sin(s * 0.9)));
  line = max(line, lmLine(abs(e - 0.84) / ft, w * 0.55) * mix(dash, 1.0, smoothstep(0.5, 0.75, shade)) * 0.8 * big);   // doubled edge
  line = max(line, lmLine(e / ft, w * 0.7) * mix(dash, 1.0, smoothstep(0.4, 0.7, shade)) * 0.85 * big);                // midrib
  line *= mix(0.45, 1.0, big);
  float sp = 2.3, vd = abs(fract(s / sp + 0.25 * e * e) - 0.5) * sp / foot;       // frill veins near the edge
  line = max(line, lmLine(vd, w * 0.5) * smoothstep(0.5, 0.8, e) * smoothstep(3.0, 6.0, sp / foot) * step(0.3, fract(e * 9.0 + s * 0.13)) * 0.65);
  gl_FragColor = lmFinish(m, line, length(cameraPosition - vWp));
}`;

// ------------------------------------------------------------------ tentacles: camera-facing ribbons that never fall under 1.5 px
async function tentacleGeometry(roots, NS, ctx) {
  const n = roots.length, nv = n * (NS + 1) * 2;
  const pos = new Float32Array(nv * 3), ts = new Float32Array(nv * 3), tp = new Float32Array(nv * 3);
  const idx = new Uint32Array(n * NS * 6); let q = 0;
  const one = (k) => {
    const r = roots[k], v0 = k * (NS + 1) * 2;
    for (let i = 0; i <= NS; i++) for (let j = 0; j < 2; j++) {
      const kk = v0 + i * 2 + j;
      pos[kk * 3] = r.x; pos[kk * 3 + 1] = r.y; pos[kk * 3 + 2] = r.z;
      ts[kk * 3] = r.len * Math.pow(i / NS, 1.25); ts[kk * 3 + 1] = j * 2 - 1; ts[kk * 3 + 2] = r.len;
      tp[kk * 3] = r.ph; tp[kk * 3 + 1] = r.lag; tp[kk * 3 + 2] = r.w;
    }
    for (let i = 0; i < NS; i++) { const a = v0 + i * 2, b = a + 1, c = a + 2, d = a + 3; idx[q++] = a; idx[q++] = c; idx[q++] = b; idx[q++] = b; idx[q++] = c; idx[q++] = d; }
  };
  for (let k = 0; k < n; k++) { one(k); if (k % 2 === 1) await ctx.yield(); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aTs', new THREE.BufferAttribute(ts, 3));
  g.setAttribute('aTp', new THREE.BufferAttribute(tp, 3));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  return g;
}

const TENT_VERT = /* glsl */`
attribute vec3 aTs, aTp;
uniform mat3 uTiltM; uniform float uViewH;
varying vec3 vRest; varying vec3 vWp; varying float vSide, vWpx, vBody, vS, vCov;
vec3 tentC(float s, vec3 root, vec2 o, float sxn) {
  float fl = 1.0 - exp(-s / 7.0), grow = s / (s + 45.0), ph = aTp.x;
  float tt = uTime - aTp.y;
  vec3 p = root + vec3(o.x * 3.6 * fl, -s + 2.4 * fl, o.y * 3.6 * fl);
  p.z += (sin(s * 0.021 - tt * 0.21 + ph) * 5.0 + sin(s * 0.057 - tt * 0.5 + ph * 1.7) * 1.5) * grow;
  p.x += sxn * (0.5 + 0.5 * sin(s * 0.017 - tt * 0.17 + ph * 2.3)) * 6.5 * grow;      // outward only: the lane stays open
  float x = fract(s / ${PULSE_SPACING}.0 - uPulse + aTp.y / uPeriod + 0.5);                      // a kink per pulse, 9 m/s down the line
  float b = exp(-(x - 0.5) * (x - 0.5) * 36.0) * smoothstep(0.0, 6.0, s);
  p.z += b * 1.5 * sin(ph * 5.0); p.x += sxn * b * 1.2; p.y += b * 1.6;
  return p;
}
void main() {
  float s = aTs.x;
  vec3 root = uTiltM * lmPulse(position);
  vec2 o = root.xz / max(length(root.xz), 0.01);
  float sxn = position.x < 0.0 ? -1.0 : 1.0;
  vec3 c = tentC(s, root, o, sxn), c2 = tentC(s + 0.6, root, o, sxn);
  vec4 wc = modelMatrix * vec4(c, 1.0);
  vec3 T = mat3(modelMatrix) * (c2 - c);
  vec3 toCam = cameraPosition - wc.xyz;
  float dist = max(length(toCam), 0.01);
  vec3 sd = cross(T, toCam); sd = sd / max(length(sd), 1e-5);
  float pxm = 2.0 / (projectionMatrix[1][1] * max(uViewH, 1.0)) * dist;              // metres per pixel here
  float taper = 1.0 - smoothstep(aTs.z * 0.92, aTs.z, s);
  float hw0 = aTp.z * mix(0.42, 0.11, pow(max(s / aTs.z, 1e-4), 0.6)) * (0.25 + 0.75 * taper) * (1.0 + 0.2 * sin(s * 2.4 + aTp.x));   // beaded
  float hw = max(hw0, 0.8 * pxm);
  vec3 wp = wc.xyz + sd * aTs.y * hw;
  vRest = vec3(aTp.x * 9.0 + aTs.y * hw0, s, aTp.x * 4.0); vWp = wp; vSide = aTs.y; vWpx = hw / pxm; vS = s; vCov = hw0 / hw;
  vBody = 0.1 + 0.9 * s / 300.0;
  gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0);
}`;

const TENT_FRAG = /* glsl */`
uniform float uSeed;
varying vec3 vRest; varying vec3 vWp; varying float vSide, vWpx, vBody, vS, vCov;
void main() {
  float foot = lmFoot(vRest), g = lmGrain(vRest, foot, uSeed + 6.0);
  float w = lmLineW(vRest), e = abs(vSide);
  vec3 m = vec3(1.0);
  float tone = 0.14 + 0.7 * smoothstep(-0.35, 0.95, vSide);                      // a round cord: paper on the lit side, dense in shade
  float regR = lmReg(uInk.y, vBody, g);
  m = mix(m, m * lmMul(uRose), lmOn(tone, g) * regR);
  float thin = 1.0 - smoothstep(1.2, 3.0, vWpx);                                  // a hairline: drawn in rose, paler as it gets finer
  float line = lmLine((1.0 - e) * vWpx, w * 0.75) * (1.0 - thin);
  float fs = max(fwidth(vS), 1e-5), sp = 0.62;                                    // stinging-cell rings, drawn on the shade side only
  float ring = lmLine(abs(fract(vS / sp + 0.18 * vSide * vSide) - 0.5) * sp / fs, w * 0.85);
  line = max(line, ring * smoothstep(3.0, 6.0, sp / fs) * smoothstep(-0.25, 0.1, vSide) * smoothstep(3.0, 6.0, vWpx) * 0.8);
  float cov = mix(1.0, clamp(vCov, 0.22, 1.0), thin);
  m = mix(m, lmMul(uRose), thin * regR);
  line = max(line, thin * (1.0 - regR) * 0.8);                                    // before the rose stone prints it is a thin key line
  m = mix(vec3(1.0), m, cov); line *= cov;
  gl_FragColor = lmFinish(m, line, length(cameraPosition - vWp));
}`;

// ------------------------------------------------------------------ the page: paper in every direction (optional; the world has its own)
const PAGE_VERT = /* glsl */`
varying vec3 vDir;
void main() { vDir = position; vec4 p = projectionMatrix * vec4(mat3(viewMatrix) * mat3(modelMatrix) * position, 1.0); if (abs(p.w) < 1e-4) p.w = 1e-4; gl_Position = p; }`;
const PAGE_FRAG = /* glsl */`
uniform vec3 uPaperLow;
varying vec3 vDir;
void main() {
  vec3 d = vDir / max(length(vDir), 1e-4);
  vec3 col = mix(uPaperLow, uPaper, smoothstep(-0.9, 0.1, d.y));
  vec2 f = gl_FragCoord.xy / max(uPx, 0.25);                       // fibre tooth fixed to the sheet, 1.5% contrast
  float n = lmVn(vec3(f.x * 0.55, f.y * 0.9, 1.0)) * 0.6 + lmVn(vec3(f.x * 0.09, f.y * 1.7, 5.0)) * 0.4;
  col *= 1.0 + (n - 0.5) * 0.03;
  gl_FragColor = vec4(col, 1.0);
}`;

const SPECIES = {
  chrysaora: { id: 'chrysaora', code: 0, lappets: 32, NU: 256, depth: 22, thick: 6.2, lappetLen: 4.2, lipLen: 3.8, gonadR: 4.5, gonadTube: 1.65,
    armLen: 150, armW: 8.0, armX: 15.4, armFold: 0.42, armNS: 420, ruffle: 1, tentLen: 300, tentW: 1 },
  pelagia: { id: 'pelagia', code: 1, lappets: 16, NU: 256, depth: 25, thick: 7.2, lappetLen: 5.2, lipLen: 4.6, gonadR: 4.1, gonadTube: 1.9,
    armLen: 112, armW: 8.8, armX: 15.8, armFold: 0.6, armNS: 340, ruffle: 1.15, tentLen: 300, tentW: 1.5 },
  cyanea: { id: 'cyanea', code: 2, lappets: 16, NU: 256, depth: 17.5, thick: 5.0, lappetLen: 5.8, lipLen: 5.2, gonadR: 4.7, gonadTube: 1.5,
    armLen: 124, armW: 10.0, armX: 16.4, armFold: 0.8, armNS: 360, ruffle: 1.35, tentLen: 290, tentW: 0.8 },
};

const _size = new THREE.Vector2();

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, detail = ctx.quality?.detail ?? 1;
  const palette = opts.palette || PALETTE;
  // ---- every seeded choice is drawn here, in one go, before the first yield
  const spId = SPECIES[opts.species] ? opts.species : rng.fork('medusa').pick(['chrysaora', 'chrysaora', 'pelagia', 'cyanea']);
  const sp = Object.assign({}, SPECIES[spId]);
  sp.depth *= rng.range(0.93, 1.08); sp.armW *= rng.range(0.92, 1.1); sp.gonadR *= rng.range(0.92, 1.08);
  const period = opts.period ?? rng.range(4.4, 5.6);
  const seedOff = Math.floor(rng.range(0, 40));
  const armSeeds = new Float32Array(6); for (let i = 0; i < 6; i++) armSeeds[i] = i % 3 === 2 ? rng.range(0.6, 1.3) : rng.range(0, TAU);
  const organRng = rng.fork('organs');
  const cT = Math.cos(TILT), sT = Math.sin(TILT);
  const tiltPoint = (x, y, z) => new THREE.Vector3(x, y * cT + z * sT, -y * sT + z * cT);
  // tentacle roots in bell space: the +x half is seeded, the -x half is its twin half a second behind
  const roots = [];
  const addPair = (deg, r, y, len, w) => {
    const th = deg * Math.PI / 180, ph = rng.range(0, TAU), lag = rng.range(0, 0.25);
    roots.push({ x: r * Math.sin(th), y, z: r * Math.cos(th), len, ph, lag, w });
    roots.push({ x: -r * Math.sin(th), y, z: r * Math.cos(th), len, ph, lag: lag + 0.5, w });
  };
  for (let k = 0; k < 4; k++) {
    const c = 22.5 + 45 * k;
    if (spId === 'chrysaora') for (const o of [-6, 0, 6]) addPair(c + o, 29.2, 0.1, sp.tentLen * rng.range(0.84, 1), sp.tentW * rng.range(0.9, 1.15));
    else if (spId === 'pelagia') addPair(c, 29.4, 0.1, sp.tentLen * rng.range(0.9, 1), sp.tentW * rng.range(0.9, 1.1));
    else {
      const n = Math.max(5, Math.round(8 * detail));
      for (let i = 0; i < n; i++) { const r = rng.range(22, 26.5); addPair(c + rng.range(-6.5, 6.5), r, innerYAtR(r, sp.depth, sp.thick) - 0.3, sp.tentLen * rng.range(0.55, 1), sp.tentW * rng.range(0.8, 1.2)); }
    }
  }
  await ctx.yield();

  // ---- shared uniforms and materials
  const U = lithoUniforms(palette, opts.shadeInk);
  U.uPeriod.value = period;
  if (opts.light) U.uLight.value.copy(opts.light).normalize();
  const bellU = () => ({ uLappets: { value: sp.lappets }, uSpecies: { value: sp.code }, uLapV: { value: 28 / 36 }, uDepth: { value: sp.depth }, uSeed: { value: seedOff } });
  const outerMat = styleMaterial(U, { tint: true, vertex: BELL_VERT, fragment: OUTER_FRAG, uniforms: bellU() });
  const innerMat = styleMaterial(U, { tint: true, vertex: BELL_VERT, fragment: INNER_FRAG, uniforms: bellU() });
  const organMat = styleMaterial(U, { tint: false, side: THREE.DoubleSide, vertex: ORGAN_VERT, fragment: ORGAN_FRAG, uniforms: { uSeed: { value: seedOff + 1 } } });
  const armMat = styleMaterial(U, { tint: true, side: THREE.DoubleSide, vertex: ARM_VERT, fragment: ARM_FRAG,
    uniforms: { uSeed: { value: seedOff + 2 }, uArmLen: { value: sp.armLen }, uRuffle: { value: sp.ruffle } } });
  const tiltM = new THREE.Matrix3().set(1, 0, 0, 0, cT, sT, 0, -sT, cT);
  const tentMat = styleMaterial(U, { tint: true, side: THREE.DoubleSide, vertex: TENT_VERT, fragment: TENT_FRAG,
    uniforms: { uSeed: { value: seedOff + 3 }, uTiltM: { value: tiltM }, uViewH: { value: 450 } } });

  const object = new THREE.Group(); object.name = 'litho-medusae-hero';
  const body = new THREE.Group(); body.position.y = MOUTH_Y; object.add(body);
  const bell = new THREE.Group(); bell.rotation.x = -TILT; body.add(bell);
  const add = (parent, geo, mat, order) => { const m = new THREE.Mesh(geo, mat); m.frustumCulled = false; m.renderOrder = order; parent.add(m); return m; };

  if (opts.page !== false) {
    const pageMat = styleMaterial(U, { tint: false, side: THREE.BackSide, depthTest: false, vertex: PAGE_VERT, fragment: PAGE_FRAG,
      uniforms: { uPaperLow: { value: new THREE.Color(opts.paperLow || '#D8DDC6') } } });
    pageMat.depthWrite = false;
    add(object, new THREE.IcosahedronGeometry(900, 3), pageMat, -0.5);
  }
  await ctx.yield();
  const organs = organParts(sp, organRng);
  add(bell, await gridMerge(organs.parts, ctx), organMat, 0);
  await ctx.yield();
  add(bell, await bellSkin(sp, true, ctx), innerMat, 2);
  await ctx.yield();
  add(bell, await bellSkin(sp, false, ctx), outerMat, 3);
  await ctx.yield();
  const arms = await armGeometry(sp, armSeeds, tiltPoint, ctx);
  add(body, arms.geometry, armMat, 4);
  await ctx.yield();
  add(body, await tentacleGeometry(roots, spId === 'cyanea' ? 90 : 120, ctx), tentMat, 5);
  await ctx.yield();

  // ---- anchors (local space of `object`)
  const up = (v) => v.clone().add(body.position);
  const axis = new THREE.Vector3(0, cT, -sT);
  const mouth = new THREE.Vector3(0, MOUTH_Y, 0);
  const anchors = {
    mouth, axis,
    portalSeat: { position: mouth.clone(), normal: axis.clone().negate() },
    crown: up(tiltPoint(0, sp.depth, 0)),
    nearRim: up(tiltPoint(0, 0, BELL_R)), farRim: up(tiltPoint(0, 0, -BELL_R)),
    gonads: organs.gonads.map((g) => up(tiltPoint(g.x, g.y, g.z))),
    armRoots: arms.roots.map(up), armWalls: arms.walls.map(up),
    laneHalfWidth: 8.5,
    flyThrough: [[0, 232, 243], [0, 221, 150], [0, 210, 66], [0, 211.2, 48.9], [0, 220.2, 31.6], [0, 236, 25], [0, 263, 12.5], [0, 290, 0]].map((p) => new THREE.Vector3(p[0], p[1], p[2])),
    viewpoints: {
      reveal: { position: new THREE.Vector3(0, 232, 246), target: mouth.clone() },
      image: { position: new THREE.Vector3(0, 210, 61), target: new THREE.Vector3(0, 282, 6) },
      climb: { position: new THREE.Vector3(0, 249, 19), target: mouth.clone() },
    },
  };

  let clock = null;
  const hero = {
    object, radius: 34, height: 330, center: new THREE.Vector3(0, 266, 2), anchors,
    ground: false, groundY: 0, species: spId, period, uniforms: U,
    // the stones, keyed to the journey: line only, then green, rose from the bell down the arms, ochre last
    setProgress(u) {
      const ss = (a, b) => { const t = Math.min(1, Math.max(0, (u - a) / (b - a))); return t * t * (3 - 2 * t); };
      U.uInk.value.set(ss(0.385, 0.435), ss(0.4, 0.48), ss(0.445, 0.5));
    },
    setInks(g, r, o) { U.uInk.value.set(g, r, o); },
    setPulseClock(seconds) { clock = seconds; },
    update(dt, time, camera) {
      U.uTime.value = time % 3600;
      const st = time * 4, sk = Math.floor(st), sf = Math.min(1, Math.max(0, (st - sk - 0.5) * 2));
    U.uSeedT.value = sk % 97; U.uSeedF.value = sf * sf * (3 - 2 * sf);
      U.uPulse.value = ((clock ?? time) / period) % 4096;
      const h = ctx.renderer ? ctx.renderer.getDrawingBufferSize(_size).y : 450;
      U.uPx.value = Math.max(0.25, h / 450);
      tentMat.uniforms.uViewH.value = h;
    },
    dispose() {},
  };
  return hero;
}
