// THE SLEDGE BETWEEN THE VOLCANOES: the two travellers and their one sledge.
//   One merged mesh (two hooded figures and the sledge), a part id per vertex, posed in the vertex shader from the
//   distance they have hauled: every step covers the ground it should, so nothing skates. The taller figure walks on
//   the fire side. Their bodies lean into the traces, their steps are out of phase with each other, the sledge comes
//   on in jerks and rocks over the crust; the smaller one glances up at the mountain now and then (by metres hauled).
//   makeTrack()  the single track they leave: a ribbon on the snow, at least a pixel and a half wide at any distance
//                (a least width, declared: far off the ribbon is widened to 0.0027 of its distance either side); on it
//                two faint runner lines and the footmarks between, in shadow blue. The footmarks are a step apart
//                by the walkers' own rule (stepOf, below), which their gait reads too.
//                Declared footprint fades: each runner line is drawn as its mean over the pixel's footprint across
//                the track, and the footmarks go over to a faint trodden middle (their mean) where a pixel covers
//                more than 0.12 to 0.4 m along the track or 0.04 to 0.14 m across it.
//   Also here: the two traces (ribbons) and their breath (a few soft sprites on the world clock).
//   buildHero()  the same, alone on flat snow, for the part viewer: part=sledge-between-volcanoes-travellers
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';
import { makeShared, sharedUniforms, SBV_LIGHT, Acc } from './sledge-between-volcanoes-common.js';

// THE WALKERS' STEP: the ground one of the two covers in a full cycle of two steps (0 the taller, 1 the smaller,
// whose legs are shorter). Their gait is posed by it and the footmarks of the track are laid by it.
const stepOf = (who) => 1.38 * (who ? 0.892 : 1);
// part ids: 0 coat and trunk, 1 hood, 2 left arm, 3 right arm, 4 left thigh, 5 right thigh, 6 left shank, 7 right shank, 9 sledge
const FIG_VS = /* glsl */`
attribute float aPart, aK, aFig;
uniform vec4 uRootA, uRootB, uSledge;      // xyz where each stands (the sledge: its middle on the snow), w: heading (yaw, radians)
uniform vec4 uGaitA, uGaitB;               // step phase (radians), lean (radians), role (0 hauls, 1 pushes), glance (0..1)
uniform vec4 uSledgeTilt;                  // pitch, roll, -, -
uniform float uSide;                       // which side the mountain is on (the glance turns that way)
varying vec3 vW, vN, vC; varying float vPart;
mat3 rotX(float a){ float c = cos(a), s = sin(a); return mat3(1., 0., 0., 0., c, s, 0., -s, c); }
mat3 rotY(float a){ float c = cos(a), s = sin(a); return mat3(c, 0., -s, 0., 1., 0., s, 0., c); }
mat3 rotZ(float a){ float c = cos(a), s = sin(a); return mat3(c, s, 0., -s, c, 0., 0., 0., 1.); }
void main(){
  vec3 p = position, n = normal; vec4 root; float yaw;
  if (aPart > 8.5) {                                         // the sledge: pitched to the slope, rocking
    mat3 m = rotX(uSledgeTilt.x)*rotZ(uSledgeTilt.y); p = m*p; n = m*n; root = uSledge;
  } else {
    vec4 g = aFig < .5 ? uGaitA : uGaitB; root = aFig < .5 ? uRootA : uRootB;
    float sc = aFig < .5 ? 1. : .892, ph = g.x, lean = g.y, push = g.z;
    float sgn = (aPart == 2. || aPart == 4. || aPart == 6.) ? 0. : 3.14159265;      // the right limbs half a cycle behind the left
    // legs: the thigh swings about the hip, biased backward (they are pushing); the knee folds as the leg comes forward
    float sw = sin(ph + sgn), thigh = -.16 + .43*sw, knee = .12 + .62*max(0., cos(ph + sgn - .5));
    vec3 hip = vec3(aPart == 4. || aPart == 6. ? -.1 : .1, .93, 0.);
    if (aPart >= 4. && aPart < 8.) {
      if (aPart >= 6.) { vec3 kn = vec3(hip.x, .5, 0.); mat3 mk = rotX(-knee); p = mk*(p - kn) + kn; n = mk*n; }
      mat3 mt = rotX(thigh); p = mt*(p - hip) + hip; n = mt*n;
    } else {
      // the trunk leans into the trace from the hips, heaving a little with each step
      float heave = lean + .05*sin(2.*ph + .6);
      if (aPart == 2. || aPart == 3.) {                      // arms: a short swing against the legs; pushing, they reach forward to the load
        vec3 sh = vec3(aPart == 2. ? -.23 : .23, 1.46, 0.); mat3 ma = rotX(mix(-.25 - .2*sw, 1.15, push)); p = ma*(p - sh) + sh; n = ma*n;
      }
      if (aPart == 1.) {                                     // the hood: head down to the work; the glance turns it up and toward the mountain
        vec3 nk = vec3(0., 1.56, 0.); mat3 mh = rotY(-uSide*.75*g.w)*rotX(-.22 + .62*g.w); p = mh*(p - nk) + nk; n = mh*n;
      }
      vec3 pv = vec3(0., .93, 0.); mat3 ml = rotX(-heave); p = ml*(p - pv) + pv; n = ml*n;
    }
    p.y += .025*cos(2.*ph) - .03;                            // the body rises and sinks with the steps
    p *= sc;
  }
  yaw = root.w; mat3 my = rotY(yaw); p = my*p + root.xyz; n = my*n;
  vec4 w = modelMatrix*vec4(p, 1.); vW = w.xyz; vN = normalize(mat3(modelMatrix)*n); vC = color; vPart = aPart;
  gl_Position = projectionMatrix*viewMatrix*w;
}`;
const FIG_FS = /* glsl */`
precision highp float;
varying vec3 vW, vN, vC; varying float vPart;
${SBV_LIGHT}
void main(){
  vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n;
  vec3 v = normalize(cameraPosition - vW);
  vec3 c = vC*sbvLight(vW, n);
  // a soft rim so the dark coats keep their outline: red toward the fire, blue from the sky
  float rim = pow(clamp(1. - dot(n, v), 0., 1.), 3.);
  // (cloth and wood take none of it: the sledge and its load have no sheen)
  c += rim*(.05*uSkyCol + .22*sbvFire(vW, n))*(.4 + vC)*(vPart > 8.5 ? .15 : 1.);
  gl_FragColor = vec4(sbvFog(c, length(cameraPosition - vW), 1.), 1.);
}`;

// one figure, standing, facing -Z, feet at y 0, 1.85 m to the top of the hood
function addFigure(A, fig, coat, coatDark, fur, hide) {
  const L = -1, R = 1;
  // coat and trunk: hem at the knee, belted at the waist, broad shoulders
  A.id(0).color(coat);
  A.tube([[0, 0.4, 0.01, [0.3, 0.255]], [0, 0.7, 0.01, [0.262, 0.22]], [0, 0.93, 0, [0.23, 0.19]], [0, 1.1, 0, [0.215, 0.18]], [0, 1.3, 0, [0.245, 0.19]], [0, 1.46, 0, [0.25, 0.17]], [0, 1.55, 0, [0.13, 0.11]]], 10, true, true);
  A.color(coatDark).tube([[0, 1.07, 0, [0.225, 0.19]], [0, 1.13, 0, [0.225, 0.19]]], 10, false, false);                     // belt
  // nothing on the back: the load rides on the sledge; the belt is the band the trace is made fast to
  // hood: up, fur-edged, no face to see
  A.id(1).color(coat).ball(0, 1.69, 0.01, 0.15, 0.165, 0.17, 10, 7);
  A.color(coatDark).ball(0, 1.675, -0.1, 0.105, 0.115, 0.05, 8, 5);                                                           // the dark of the opening
  A.color(fur); for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2; A.ball(Math.cos(a) * 0.125, 1.68 + Math.sin(a) * 0.135, -0.125, 0.05, 0.05, 0.045, 5, 4); }
  A.color(coat).tube([[0, 1.5, 0.02, [0.19, 0.15]], [0, 1.6, 0.02, [0.16, 0.15]]], 8, false, false);                           // the cape of the hood on the shoulders
  // arms with mittens
  for (const s of [L, R]) {
    A.id(s < 0 ? 2 : 3).color(coat).tube([[s * 0.24, 1.46, 0, 0.085], [s * 0.285, 1.22, 0.02, 0.08], [s * 0.27, 1.02, -0.1, 0.07]], 7, true, true);
    A.color(hide).ball(s * 0.265, 0.95, -0.14, 0.065, 0.085, 0.075, 6, 5);
  }
  // legs: thigh under the coat, shank, broad snow footgear
  for (const s of [L, R]) {
    A.id(s < 0 ? 4 : 5).color(coatDark).tube([[s * 0.1, 0.95, 0, 0.105], [s * 0.1, 0.5, 0, 0.09]], 7, true, true);
    A.id(s < 0 ? 6 : 7).color(coatDark).tube([[s * 0.1, 0.52, 0, 0.09], [s * 0.1, 0.1, 0.01, 0.075]], 7, true, true);
    A.color(hide).ball(s * 0.1, 0.055, -0.07, 0.085, 0.055, 0.19, 7, 5);
  }
}
// the sledge: 3 m long, 0.6 m wide, pale runners turned up at the front, the load lashed under a dun cover 0.8 m high
export function addSledge(A) {
  A.id(9).color('#b9a07c');
  for (const s of [-1, 1]) {
    A.tube([[s * 0.29, 0.03, 1.5, [0.035, 0.03]], [s * 0.29, 0.03, -1.05, [0.035, 0.03]], [s * 0.29, 0.1, -1.38, [0.035, 0.03]], [s * 0.29, 0.3, -1.6, [0.03, 0.028]]], 5, true, true);
    for (const z of [-0.9, -0.2, 0.5, 1.2]) A.box(s * 0.29, 0.12, z, 0.02, 0.09, 0.03);                                         // the uprights
    A.box(s * 0.29, 0.21, 0.15, 0.022, 0.022, 1.3);                                                                             // the side rails
  }
  A.box(0, 0.22, 0.15, 0.3, 0.015, 1.3);                                                                                        // the bed
  A.tube([[-0.29, 0.3, -1.6, 0.025], [0.29, 0.3, -1.6, 0.025]], 5, true, true);                                                 // the bow at the front
  // the load: an uneven low heap of bundles and sacks under a dun cloth cover (no one shape runs its length), lashed
  // down with cord that crosses over it from rail to rail
  const HEAP = [[0.02, 0.37, 1.02, 0.25, 0.17, 0.34, '#8d7e61'], [-0.05, 0.43, 0.44, 0.28, 0.24, 0.4, '#857659'], [0.06, 0.4, -0.16, 0.27, 0.2, 0.37, '#93846a'],
    [-0.03, 0.37, -0.7, 0.26, 0.17, 0.35, '#88795d'], [0.05, 0.32, -1.06, 0.19, 0.12, 0.21, '#7f7056'], [0.09, 0.57, 0.2, 0.16, 0.085, 0.27, '#8a7b5f'], [-0.1, 0.5, -0.45, 0.14, 0.09, 0.2, '#806f55']];
  for (const [x, y, z, rx, ry, rz, col] of HEAP) A.color(col).ball(x, y, z, rx, ry, rz, 9, 6);
  const heapTop = (z) => { let h = 0.3; for (const b of HEAP) { const q = (z - b[2]) / b[5]; if (q > -1 && q < 1) h = Math.max(h, b[1] + b[4] * Math.sqrt(1 - q * q)); } return h; };
  A.color('#2e261f');
  for (let i = 0; i < 6; i++) { const z0 = 1.2 - i * 0.42, z1 = z0 - 0.42, zm = (z0 + z1) / 2, s = i % 2 ? 1 : -1;
    A.tube([[s * 0.3, 0.22, z0, 0.011], [s * 0.2, heapTop(zm) * 0.8 + 0.06, z0 * 0.7 + zm * 0.3, 0.011], [0, heapTop(zm) + 0.015, zm, 0.011], [-s * 0.2, heapTop(zm) * 0.8 + 0.06, z1 * 0.7 + zm * 0.3, 0.011], [-s * 0.3, 0.22, z1, 0.011]], 4, true, true); }
}

// ---------------------------------------------------------------- the track: one ribbon on the snow
const TRACK_VS = /* glsl */`
attribute float aSide, aAlong; attribute vec3 aAcross;
uniform float uEnd, uDir;                  // drawn up to this z (uDir +1: the track runs toward -z)
varying vec2 vT; varying vec3 vW; varying float vWide;
void main(){
  vec4 w = modelMatrix*vec4(position, 1.);
  float dist = length(w.xyz - cameraPosition), half0 = .44, half1 = max(half0, dist*.0027);
  vec3 side = normalize(mat3(modelMatrix)*aAcross);
  w.xyz += side*aSide*half1; w.y += .04 + dist*.0004;
  vT = vec2(aSide*half1, aAlong); vW = w.xyz; vWide = half1/half0;
  gl_Position = projectionMatrix*viewMatrix*w;
}`;
const TRACK_FS = /* glsl */`
precision highp float;
uniform float uEnd, uDir; uniform vec3 uGroove;
varying vec2 vT; varying vec3 vW; varying float vWide;
${SBV_LIGHT}
float tH(float p){ p = fract(p*.1031); p *= p + 33.33; p *= p + p; return fract(p); }
float tN(float p){ float i = floor(p), f = fract(p); f = f*f*(3. - 2.*f); return mix(tH(i), tH(i + 1.), f); }
// one walker's footmarks: a mark a step, left and right by turns, each a little out of place, of its own size and depth
float tMark(float x, float y, float stp, float off, float key){ float si = floor(y/stp), sd = mod(si, 2.) < .5 ? -1. : 1.;
  vec2 fp = vec2(x - off - sd*(.09 + .05*(tH(si + key) - .5)), y - (si + .5 + .45*(tH(si + key*1.7) - .5))*stp);
  return (1. - smoothstep(.6, 1.2, length(fp/vec2(.065 + .03*tH(si + key*2.3), .15))))*(.3 + .7*tH(si + key*3.1)); }
void main(){
  if ((uEnd - vT.y)*uDir > 0.) discard;
  float wide = clamp(vWide, 1., 40.), x = vT.x/wide, ax = abs(x);       // metres across the real track
  // (polish 1, third part, C3) a sledge track is two faint runner lines and the footmarks between them, in the blue of
  // snow in shadow, a little darker than the snow and uneven; never a solid band. Each mark is drawn as its mean over
  // the pixel's footprint (fx across the track, fy along it, in the track's own metres), so far off and end-on the
  // footmarks melt into a faint trodden middle and the two lines into one soft line. The track has no colour of its
  // own: it takes a share of the light off the snow under it (uGroove: the share kept where a mark is deepest), so it
  // is always that snow, a little darker and bluer, whatever lights it.
  float fx = max(fwidth(vT.x)/wide, 1e-4), fy = max(fwidth(vT.y), 1e-4);
  float press = mix(.55 + .9*tN(vT.y/2.7 + 3.*sign(x)), 1., smoothstep(1., 4., fy));      // the runners bite unevenly, each its own way
  float run = clamp((min(ax + .5*fx, .325) - max(ax - .5*fx, .255))/fx, 0., 1.)*press;
  float mark = max(tMark(x, vT.y, ${(stepOf(0) / 2).toFixed(4)}, .07, 7.3), tMark(x, vT.y, ${(stepOf(1) / 2).toFixed(4)}, -.07, 41.7));        // the two walk between the runners, each at its own step (stepOf: half a cycle to a mark)
  float trod = (1. - smoothstep(.14, .28, ax))*.2;                                         // what the marks come to, taken together
  float foot = mix(mark, trod, max(smoothstep(.12, .4, fy), smoothstep(.04, .14, fx)));
  float a = max(run*.55, foot*.5)*(1. - smoothstep(.38, .44, ax));
  a *= smoothstep(0., 3., abs(uEnd - vT.y));
  float q = uFogDen*length(vW - cameraPosition); a *= exp(-q*q);                          // lost in the haze as the snow under it is
  gl_FragColor = vec4(uGroove*a, a);                                                      // (blended as: the snow under it x (1 - a x (1 - uGroove)))
}`;
// pts: [[x, z], ...] in order; ground(x, z) => y. Returns { object, uniforms } with uEnd to draw it only so far.
export function makeTrack(S, ground, pts, o = {}) {
  // o.bends: the track is not a line up the glacier; its sides stand across its own line and it is measured along itself
  const n = pts.length, pos = new Float32Array(n * 2 * 3), side = new Float32Array(n * 2), along = new Float32Array(n * 2), across = new Float32Array(n * 2 * 3), idx = [];
  let run = 0;
  for (let i = 0; i < n; i++) { const [x, z] = pts[i], y = ground(x, z), a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)], tx = b[0] - a[0], tz = b[1] - a[1], tl = Math.hypot(tx, tz) || 1;
    if (i > 0) run += Math.hypot(x - pts[i - 1][0], z - pts[i - 1][1]);
    for (let s = 0; s < 2; s++) { const v = i * 2 + s; pos.set([x, y, z], v * 3); side[v] = s ? 1 : -1; along[v] = o.bends ? run : z; across.set(o.bends ? [-tz / tl, 0, tx / tl] : [1, 0, 0], v * 3); }
    if (i < n - 1) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aSide', new THREE.BufferAttribute(side, 1)); g.setAttribute('aAlong', new THREE.BufferAttribute(along, 1)); g.setAttribute('aAcross', new THREE.BufferAttribute(across, 3)); g.setIndex(idx);
  const uniforms = { ...sharedUniforms(S), uEnd: { value: o.end ?? -1e5 }, uDir: { value: 1 }, uGroove: { value: new THREE.Color().setRGB(0.3, 0.46, 0.82) } };      // (third part, C3) the share of the snow's light a mark keeps: shadow blue
  const mat = new THREE.ShaderMaterial({ uniforms, vertexShader: TRACK_VS, fragmentShader: TRACK_FS, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    blending: THREE.CustomBlending, blendSrc: THREE.DstColorFactor, blendDst: THREE.OneMinusSrcAlphaFactor, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const mesh = new THREE.Mesh(g, mat); mesh.name = 'track'; mesh.frustumCulled = false; mesh.renderOrder = 1;
  return { object: mesh, uniforms };
}

// ---------------------------------------------------------------- the traces: two taut ribbons from the sledge's bow to the hip bands
const TRACE_VS = /* glsl */`
attribute float aSide, aT, aIdx;
uniform vec3 uEnds[4];
void main(){
  vec3 a = aIdx < .5 ? uEnds[0] : uEnds[2], b = aIdx < .5 ? uEnds[1] : uEnds[3];
  vec3 p = mix(a, b, aT); p.y -= .05*4.*aT*(1. - aT);
  // a trace is a thin band whose flat side is turned to the eye's place (not the lens)
  vec4 w = modelMatrix*vec4(p, 1.); vec3 along = (modelMatrix*vec4(b - a, 0.)).xyz, toEye = cameraPosition - w.xyz;
  vec3 side = normalize(cross(along, toEye) + vec3(0., 1e-5, 0.));
  w.xyz += side*aSide*max(.011, length(toEye)*.0011);
  gl_Position = projectionMatrix*viewMatrix*w;
}`;
const TRACE_FS = /* glsl */`precision highp float; uniform vec3 uCol; void main(){ gl_FragColor = vec4(uCol, 1.); }`;

// ---------------------------------------------------------------- the two and their sledge
// opts: shared, ground (x, z) => y, track { x, z0 } (where they stand before they have hauled a metre; they walk toward -z),
//       cast { lead: 0 | 1 (who walks half a pace ahead), push: bool (the smaller one pushes at the sledge's back) }, side (+1: mountain on +x)
//       rng (where each one's stride, breath and glance start: seeded)
// breath: a few small puffs a breath at each head, left behind as the two move on and carried off by the wind.
// A pure function of the world clock and of where the heads are.
const BREATH_VS = /* glsl */`
attribute vec3 aI;                                 // which of the two, when in the breath it leaves (s), seed
uniform float uTime; uniform vec3 uHeadA, uHeadB; uniform vec4 uBreath;      // wind x, wind z, the walkers' speed (m/s toward -z), breath period (s)
uniform vec2 uBreathPh;                            // where in a breath each of the two is when the clock starts (s, seeded)
varying vec2 vUv; varying float vA; varying vec3 vW;
void main(){
  float per = uBreath.w*(aI.x > .5 ? .86 : 1.), age = mod(uTime + (aI.x > .5 ? uBreathPh.y : uBreathPh.x) - aI.y, per), life = 1.5, k = clamp(age/life, 0., 1.);
  vec3 p = (aI.x > .5 ? uHeadB : uHeadA) + vec3(uBreath.x*age*.55, .1*age + .05*sin(aI.z*40.), uBreath.z*age + uBreath.y*age*.55 - .28*(1. - exp(-age*3.)));
  vec4 w = modelMatrix*vec4(p, 1.);
  // the puff faces the eye's place (not the lens)
  vec3 toEye = normalize(cameraPosition - w.xyz), r = normalize(cross(vec3(0., 1., 0.), toEye) + vec3(1e-4, 0., 0.)), u = cross(toEye, r);
  vUv = position.xy*2.; w.xyz += (r*vUv.x + u*vUv.y)*(.09 + .5*sqrt(k))*.5; vW = w.xyz;
  vA = step(age, life)*smoothstep(0., .08, k)*(1. - k)*(1. - k)*.42;
  gl_Position = projectionMatrix*viewMatrix*w;
}`;
const BREATH_FS = /* glsl */`
precision highp float;
varying vec2 vUv; varying float vA; varying vec3 vW;
${SBV_LIGHT}
void main(){ float r2 = dot(vUv, vUv); float a = clamp(exp(-r2*3.) - .05, 0., 1.)*vA*smoothstep(1.2, 4., length(cameraPosition - vW)); if (a < .004) discard;
  vec3 c = vec3(.8, .84, .9)*(sbvSky(vec3(0., 1., 0.)) + sbvFire(vW, normalize(uFirePos - vW))*.6); gl_FragColor = vec4(sbvFog(c, length(cameraPosition - vW), 1.)*a, a); }`;
function makeBreath(S, wind, phase) {
  const N = 5, I = []; for (let f = 0; f < 2; f++) for (let i = 0; i < N; i++) I.push(f, i * 0.11, (f * N + i) * 0.137 % 1);
  const g = new THREE.InstancedBufferGeometry(), base = new THREE.PlaneGeometry(1, 1); g.index = base.index; g.setAttribute('position', base.getAttribute('position'));
  g.setAttribute('aI', new THREE.InstancedBufferAttribute(new Float32Array(I), 3)); g.instanceCount = N * 2;
  const uniforms = { ...sharedUniforms(S), uHeadA: { value: new THREE.Vector3() }, uHeadB: { value: new THREE.Vector3() }, uBreath: { value: new THREE.Vector4(wind[0] * 2, wind[1] * 2, 0.9, 2.3) }, uBreathPh: { value: new THREE.Vector2(phase[0], phase[1]) } };
  const mesh = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms, vertexShader: BREATH_VS, fragmentShader: BREATH_FS, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor }));
  mesh.frustumCulled = false; mesh.renderOrder = 6; mesh.name = 'breath';
  return { object: mesh, uniforms };
}

export async function buildTravellers(ctx, opts = {}) {
  const S = opts.shared || makeShared(), ground = opts.ground || (() => 0), tr = opts.track || { x: 0, z0: 0 }, cast = opts.cast || {}, noise = ctx.noise;
  const object = new THREE.Group(); object.name = 'travellers';
  // where each one's stride starts, where in a breath each is, and when the smaller one first looks up: seeded
  const sr = opts.rng || ctx.rng.fork('two'), PH = { a: sr.range(0, 6.283), b: sr.range(0, 6.283), breath: [sr.range(0, 2.3), sr.range(0, 2.3)], glance: sr.range(0, 6.283) };
  const A = new Acc();
  const figStart = [0]; addFigure(A, 0, '#3d2c20', '#241a14', '#b9aa92', '#7d6c58'); figStart.push(A.p.length / 3);
  addFigure(A, 1, '#75777e', '#3f4148', '#c9c2b4', '#807260'); figStart.push(A.p.length / 3);
  addSledge(A);
  const g = A.geometry(), nv = A.p.length / 3, aFig = new Float32Array(nv); for (let i = figStart[1]; i < figStart[2]; i++) aFig[i] = 1;
  g.setAttribute('aFig', new THREE.BufferAttribute(aFig, 1));
  await ctx.yield();
  const U = { ...sharedUniforms(S), uRootA: { value: new THREE.Vector4() }, uRootB: { value: new THREE.Vector4() }, uSledge: { value: new THREE.Vector4() },
    uGaitA: { value: new THREE.Vector4(0, 0.44, 0, 0) }, uGaitB: { value: new THREE.Vector4(0, 0.44, cast.push ? 1 : 0, 0) }, uSledgeTilt: { value: new THREE.Vector4() }, uSide: { value: opts.side ?? 1 } };
  const mat = new THREE.ShaderMaterial({ uniforms: U, vertexShader: FIG_VS, fragmentShader: FIG_FS, vertexColors: true, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(g, mat); mesh.name = 'two-and-sledge'; mesh.frustumCulled = false; object.add(mesh);
  // traces
  const TS = 6, tp = [], tsd = [], tt = [], ti = [], tix = [];
  for (let k = 0; k < 2; k++) for (let i = 0; i <= TS; i++) for (let s = 0; s < 2; s++) { tp.push(0, 0, 0); tsd.push(s ? 1 : -1); tt.push(i / TS); ti.push(k);
    if (i < TS && s === 0) { const a = (k * (TS + 1) + i) * 2; tix.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
  const tg = new THREE.BufferGeometry(); tg.setAttribute('position', new THREE.Float32BufferAttribute(tp, 3)); tg.setAttribute('aSide', new THREE.Float32BufferAttribute(tsd, 1));
  tg.setAttribute('aT', new THREE.Float32BufferAttribute(tt, 1)); tg.setAttribute('aIdx', new THREE.Float32BufferAttribute(ti, 1)); tg.setIndex(tix);
  const ends = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
  const traces = new THREE.Mesh(tg, new THREE.ShaderMaterial({ uniforms: { uEnds: { value: ends }, uCol: { value: new THREE.Color('#0d0a09') } }, vertexShader: TRACE_VS, fragmentShader: TRACE_FS, side: THREE.DoubleSide }));
  traces.name = 'traces'; traces.frustumCulled = false; object.add(traces);
  // the track behind them, from the foot of the glacier
  let track = null;
  if (opts.trackLine !== false) {
    const pts = []; for (let z = tr.zFoot ?? (tr.z0 + 60); z >= tr.z0 - 56; z -= 2) pts.push([tr.xAt ? tr.xAt(z) : tr.x, z]);
    track = makeTrack(S, ground, pts); object.add(track.object);
  }
  const breath = makeBreath(S, opts.wind || [-0.984, 0.178], PH.breath); object.add(breath.object);
  const position = new THREE.Vector3(tr.x, ground(tr.x, tr.z0) + 1, tr.z0);
  const STEP = stepOf(0), lead = cast.lead ?? 0, push = !!cast.push;
  const api = {
    object, position, track, uniforms: U, triangles: nv / 3,
    // walk: metres hauled so far (the world gives it as a smooth function of the journey)
    update(dt, time, camera, walk = 0) {
      const d = walk, z = tr.z0 - d, phA = (d / STEP) * Math.PI * 2 + PH.a, phB = (d / stepOf(1)) * Math.PI * 2 + PH.b;
      // the sledge comes on in jerks: it hangs back, then the pull of a step brings it up
      const jerk = 0.1 * Math.sin(2 * phA - 0.9) + 0.06 * Math.sin(2 * phB - 0.9);
      const zs = z + 5.9 - jerk, xs = tr.xAt ? tr.xAt(zs) : tr.x, ys = ground(xs, zs);
      const slope = Math.atan2(ground(xs, zs - 1.4) - ground(xs, zs + 1.4), 2.8);
      U.uSledge.value.set(xs, ys + 0.02, zs, 0);
      U.uSledgeTilt.value.set(slope + 0.018 * noise.n2(d * 1.3, 5.5) + 0.012 * Math.sin(2 * phA - 2.2), 0.045 * noise.n2(d * 0.8, 1.2), 0, 0);
      const place = (root, k, dx, dz) => { const x = (tr.xAt ? tr.xAt(z + dz) : tr.x) + dx, zz = z + dz; root.value.set(x, ground(x, zz), zz, 0); };
      place(U.uRootA, 0, push ? 0 : 0.55, lead === 0 ? -0.35 : 0.35);
      if (push) U.uRootB.value.set(xs, ground(xs, zs + 1.95), zs + 1.95, 0); else place(U.uRootB, 1, -0.55, lead === 1 ? -0.35 : 0.35);
      U.uGaitA.value.x = phA; U.uGaitB.value.x = phB;
      U.uGaitA.value.y = 0.44; U.uGaitB.value.y = push ? 0.5 : 0.44;
      // the smaller one glances up at the mountain every seven metres or so of the haul, for a couple of steps
      U.uGaitB.value.w = push ? 0 : smoothstep(0.62, 0.9, Math.sin(d * 0.9 + PH.glance));
      // the traces: from the bow of the sledge to the back of each hip band
      const bow = (sx, out) => out.set(xs + sx * 0.2, ys + 0.3 + Math.sin(slope) * 1.6, zs - 1.6 * Math.cos(slope));
      const hipOf = (root, sc, out) => out.set(root.value.x, root.value.y + 1.0 * sc, root.value.z + 0.12);
      bow(0.5, ends[0]); hipOf(U.uRootA, 1, ends[1]);
      if (push) { ends[2].copy(ends[0]); ends[3].copy(ends[0]); } else { bow(-0.5, ends[2]); hipOf(U.uRootB, 0.892, ends[3]); }
      position.set((U.uRootA.value.x + U.uRootB.value.x) * 0.5, U.uRootA.value.y + 1.0, (U.uRootA.value.z + U.uRootB.value.z) * 0.5);
      if (track) track.uniforms.uEnd.value = zs + 1.2;
      breath.uniforms.uHeadA.value.set(U.uRootA.value.x, U.uRootA.value.y + 1.5, U.uRootA.value.z - 0.5); breath.uniforms.uHeadB.value.set(U.uRootB.value.x, U.uRootB.value.y + 1.36, U.uRootB.value.z - 0.46);
    },
  };
  api.update(0, 0, null, 0);
  return api;
}

// alone on flat snow, for the part viewer
export async function buildHero(ctx, opts = {}) {
  const S = opts.shared || makeShared();
  if (!opts.shared) { S.uFirePos.value.set(200, 40, -40); S.uFire.value.set(110, 1.6, 0.25, 0); S.uFireZ.value.set(-1e5, -9e4); }
  const t = await buildTravellers(ctx, { shared: S, track: { x: 0, z0: 0, zFoot: 30 }, ...opts });
  if (!opts.shared) t.object.scale.setScalar(8);      // the viewer stands 12 m off at the least: shown large there
  return { object: t.object, radius: 14, height: 14, center: new THREE.Vector3(0, 7, 16), ground: true, groundY: -0.1,
    update(dt, time, camera) { t.update(dt, time, camera, (time * 0.9) % 50); } };
}
