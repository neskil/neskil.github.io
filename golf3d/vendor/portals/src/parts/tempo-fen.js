// The Maelzel: hero set piece of "The Tempo Fen" (src/parts/tempo-fen.js).
//
// A mahogany metronome 140 m tall standing in the water on four brass ball feet: a truncated pyramid 64 m square
// at the base and 16 m at the cap with base and cap mouldings, brass stringing down every edge and round the open
// front, ribbon-stripe figure in the veneer. The front recess (40 m wide at the bottom, 118 m tall) shows a dark
// works chamber with three slow brass wheels, a stepping escape wheel, a brass scale plate (ticks only) up the back,
// and the arm: a bevelled steel rod 120 m long on a pivot at y 52 between two brass A-frames, a brass wedge weight
// above, and below it the bob (a polished brass lens 9 m across that mirrors sky, sun and the racing glitter lines of
// the marsh), a threaded tail and a knurled rating nut that steps at each tick while the bob creeps 3 m up the rod.
// A butterfly key on one flank steps back a notch per tick. The case has no floor: the water shows under it.
//
// LOCAL SPACE: origin at the base centre on the water (y 0), +Y up, the open front faces +Z. Swing plane z = 25.
// The world flies toward the front, so it will usually set object.rotation.y = Math.PI. All lighting is worked out
// in world space from uniforms, so any rotation of the object is fine.
//
// opts:
//   palette   [pearl horizon, silver zenith, slate, mahogany, brass, pale gold sun, interior dark] hex strings
//   detail    0.6..1 thins gear teeth, knurling and figure subdivisions only (the piece itself never thins)
//   cabinet   'mahogany' | 'ebony' | 'pearwood' (default: by seed, mahogany most often)
//   sunDir    world-space direction TO the sun (default 12 degrees up at -X, the viewer's port in this file's frame)
//   keySide   -1 | +1  local x side that carries the butterfly key (default -1 = viewer's left looking at the front)
//   duration  nominal seconds of the flight (46): setProgress(u) sets metronome time T = u * duration
//   beat      seconds per tick (default 2): the arm's cycle is two beats (the world's tempo variation sets it)
//   downwind  [x, z] world direction the glitter lines race (default [0, 1]); lineSpacing 120, lineSpeed 60
//   reflection  false | true | 0..1: also build a dimmed mirror image under y 0 (adds 12 draw calls, no new programs);
//             returned as .reflection (set its .visible as you like). bobMagnify 6: how much the marsh is enlarged
//             in the bob's mirror so the racing lines stay readable. swingSign -1 mirrors the swing.
//
// hooks (all uniform-driven, nothing is created or recompiled after build):
//   setProgress(u)   metronome time T = u * duration and the bob's creep (3 m over the flight). Arm angle =
//                    28 deg * sin(2 pi (T - 43.8) / 4): centred at u 0.953, at an extreme at u 0.975. Until it is
//                    called the piece free-runs on update()'s time (the set-piece viewer).
//   setTime(T)       set T directly (creep follows T / duration).   setLock(c) 0..1: how far the marsh mirrored in
//   the bob is in step (bright lines) rather than random sparkle.   setSun(dir, colour?)  setSky(zenith, horizon)
//   armAngle()       current arm angle in radians (+ leans the tip toward +X local); bobCenter(target) local Vector3.
//
// anchors (local space):
//   portalSeat  { position (0, 7.5, -5), facing (0,0,1), radius 7 }: 30 m behind the swing plane, between the legs
//   flyThrough  ordered points of the approach line, x 0, y 7.5, from 260 m out to the ring: >= 6 m clear of
//               everything fixed; the rod tip and nut sweep across it at y 10.5..19 (3 m over the eye line) only
//               when the arm is near centre, and the brief has the arm at its extreme when the camera passes
//   viewpoints  long (0, 7, 330), threshold (0, 7.5, 60), moon (0, 7.5, 54: the bob 29 m ahead, 8 m above the eye)
//   pivot (0,52,25)  swingPlaneZ 25  bobRest (bob centre at centre swing, start of flight)  key  wheels[]  feet[]
//   armTipRadius 88  reflectionHint: for the water mirror clone `object` with scale.y = -1 (materials are shared)
//
// SIZE radius 75 (bounding sphere about the centre at y 64; the arm tip sweeps 41 m to either side), height 146
// with the finial. COST about 30k triangles, 11 draw calls (23 with the reflection), 4 shader programs, no lights,
// no textures, ~190 ms build with no step over a frame. LIGHTING: self-contained ShaderMaterials (analytic silver
// sky + one low soft sun + silver bounce off the water into the case); they ignore scene lights and take scene fog
// (FogExp2 or linear). Only glints exceed 1.0: the star on the bob's rim (peaks at the sunward extreme of the
// swing), the wedge weight's facet, the key and nut at each tick (0.5 Hz, eased), the sun's image in the bob.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const BASE_Y = 4.4, TOP_Y = 140, SWING_Z = 25, PIVOT_Y = 52, OPEN_TOP = 122.4, CHAMBER_TOP = 62, WALL = 2.4;
const hwBody = (y) => lerp(32, 8, clamp((y - BASE_Y) / (TOP_Y - BASE_Y), 0, 1));
const openHalf = (y) => lerp(20, 5, clamp((y - BASE_Y) / (OPEN_TOP - BASE_Y), 0, 1));
const DEFAULT_PALETTE = ['#DCE6EA', '#9FB4BE', '#3E5560', '#5A2A1C', '#C9A04A', '#F4E3B0', '#1B2226'];

// ---- GLSL shared by every material: noise, the analytic sky, the case's shape, bounce light ----
export const GLSL_COMMON = /* glsl */`
uniform vec3 uZen, uHor, uSlate, uSunCol, uSunDir, uDarkCol; uniform vec2 uDownwind; uniform float uMirror, uDim, uWaterY;
uniform mat4 uHeroInv;
float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
float fbm(vec2 p){ return vn(p) * .5 + vn(p * 2.03 + 7.1) * .3 + vn(p * 4.1 + 3.7) * .2; }
float hwB(float y){ return mix(32., 8., clamp((y - 4.4) / 135.6, 0., 1.)); }
// silver overcast: pearl horizon to silver zenith, a slate band low downwind, a soft sun; below the horizon the water
vec3 skyCol(vec3 d, float blur){
  float up = smoothstep(-.02, .55 + blur * .3, d.y);
  vec3 c = mix(uHor * .82, uZen * .78, up);
  // thin overcast: long soft streaks, and a band of slate cloud low on the downwind horizon
  vec2 sp = d.xz / (abs(d.y) + .22);
  c *= 1. + (fbm(sp * vec2(.9, 2.3) + 4.) - .5) * .34 * (1. - blur);
  float l2 = dot(d.xz, d.xz);
  float dw = l2 > 1e-6 ? dot(d.xz, uDownwind) / sqrt(l2) : 0.;
  float cloudBand = smoothstep(.17 + blur * .1, .03, d.y) * smoothstep(.15, .85, dw);
  c = mix(c, uSlate * 1.05, cloudBand * .72);
  float s = max(dot(d, uSunDir), 0.);
  c += uSunCol * (pow(s, mix(900., 14., blur)) * mix(5., .5, blur) + pow(s, 6.) * .22);
  vec3 w = mix(uSlate * .42, uHor * .46, .25 + .75 * clamp(1. + d.y * 2.2, 0., 1.));
  return mix(w, c, smoothstep(-.06 - blur * .25, .02 + blur * .1, d.y));
}
// 0 outside the case, 1 deep inside the works chamber (p in hero space)
float insideCase(vec3 p){
  float hw = hwB(p.y);
  float depth = min(hw - p.z, hw - abs(p.x));
  return smoothstep(.3, 7., depth) * (1. - smoothstep(136., 141., p.y));
}
// silver light bounced up off the water and in through the open front
vec3 bounce(vec3 n, vec3 p){
  float low = (1. - smoothstep(4., 70., p.y));
  float front = smoothstep(-26., 24., p.z);
  float dn = .5 - .5 * n.y;
  return uHor * (.03 + .40 * low * dn * dn + .11 * front * max(n.z * .7 + .3, 0.));
}
`;
const FOG_V = '#include <fog_pars_vertex>\n', FOG_F = '#include <fog_pars_fragment>\n';

const WOOD_VERT = /* glsl */`
attribute float aKind;            // 0 veneer panel, 1 moulding (no stringing), 2 interior dark
varying vec3 vW, vN, vH; varying vec2 vUv; varying float vKind;
${FOG_V}
void main(){
  vec4 wp = modelMatrix * vec4(position, 1.);
  vW = wp.xyz; vH = (uHeroInv * wp).xyz; vH.y = abs(vH.y); vUv = uv; vKind = aKind;
  vN = normalize(mat3(modelMatrix) * normal);
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const WOOD_FRAG = /* glsl */`
uniform vec3 uWood, uWoodHi, uInlay; uniform float uSeed;
varying vec3 vW, vN, vH; varying vec2 vUv; varying float vKind;
${FOG_F}
void main(){
  vec3 N = normalize(vN); if (!gl_FrontFacing) N = -N;
  vec3 V = normalize(cameraPosition - vW);
  N.y *= uMirror; V.y *= uMirror;                             // a mirrored copy is lit like the original
  vec3 nH = normalize(mat3(uHeroInv) * N);
  float across = vUv.x, along = vUv.y;
  // distance in metres from the panel's edges (and from the open front on kind 3): where the stringing runs
  float d = min(hwB(along) - abs(across), min(along - 10.6, 131.4 - along));
  if (vKind > 2.5) {
    float oh = mix(20., 5., clamp((along - 4.4) / 118., 0., 1.));
    d = min(d, max(abs(across) - oh, along - 122.4));
  }
  float panel = step(vKind, .5) + step(2.5, vKind);
  float w = max(fwidth(d), 1e-4);
  float band = smoothstep(.9 - w, .9 + w, d);                  // 0 in the cross-banded border, 1 in the field
  float s1 = smoothstep(.16 + w, .16 - w, abs(d - .9)) * min(1., .32 / w);
  float s2 = smoothstep(.05 + w, .05 - w, abs(d - 1.55)) * min(1., .10 / w);
  float inlay = clamp(s1 + s2, 0., 1.) * panel;
  // figure: ribbon stripe along the grain (40:1), a finer curl, pores; the border's grain runs across
  vec2 g = mix(vec2(along * .9, across * 3.), vec2(across, along), mix(step(1.5, vKind), band, panel));
  float seed = uSeed + floor(vKind + .5) * 3.1 + step(.5, abs(nH.x)) * 11. + step(0., nH.x + nH.z) * 5.;
  float warp = fbm(vec2(g.x * .12 + seed, g.y * .01)) * 2.2;
  float rib = smoothstep(.2, .8, vn(vec2(g.x * .8 + warp + seed, g.y * .0105)));
  float curl = fbm(vec2(g.x * 2.6 + seed, g.y * .065 + rib));
  float pore = vn(vec2(g.x * 34., g.y * .85)) * vn(vec2(g.x * 9., g.y * .22 + 3.));
  float px = max(fwidth(g.x), 1e-4);
  pore = mix(pore, .25, clamp(px * 20., 0., 1.));
  float fig = clamp(rib * .55 + curl * .5 - pore * .35, 0., 1.);
  float mouldK = step(.5, vKind) * step(vKind, 1.5), inK = step(1.5, vKind) * step(vKind, 2.5);
  fig = mix(fig, .40, mouldK); rib = mix(rib, .5, mouldK); curl = mix(curl, .5, mouldK);   // mouldings are run from plain stock: clean steps, no figure
  vec3 alb = mix(uWood * .85, uWoodHi, fig * .8) * mix(.7, 1., mix(1., band, panel));
  // light: low soft key, silver sky fill, slate where the sun misses
  vec3 L = uSunDir;
  float ndl = dot(N, L);
  float key = smoothstep(-.25, .9, ndl);
  vec3 amb = mix(uSlate * 1.4, uZen * 1.1, N.y * .5 + .5) + uHor * .22;
  vec3 col = alb * (uSunCol * key * .95 + amb + uHor * .30 * mouldK);     // (the mouldings' shaded steps stay wood, never black)
  // long polish highlight: anisotropic along the grain, shifted by the figure so it ripples over the ribbon
  vec3 up = vec3(0., 1., 0.);
  vec3 T = up - N * dot(up, N);
  T = dot(T, T) > 1e-4 ? normalize(T) : vec3(1., 0., 0.);
  vec3 Hh = L + V; Hh = dot(Hh, Hh) > 1e-6 ? normalize(Hh) : N;
  vec3 Ts = normalize(T + N * ((rib - .5) * .34 + (curl - .5) * .16));
  float th = dot(Ts, Hh);
  float sinTH = sqrt(max(1. - th * th, 0.));
  float aniso = pow(sinTH, 46.) * smoothstep(-.05, .35, ndl) * smoothstep(-.1, .3, dot(N, V));
  col += mix(uWoodHi, uSunCol, .5) * aniso * .42 * (.6 + .8 * fig) * mix(.35, 1., panel);
  // clear coat: cool sky sheen, strongest at grazing
  vec3 R = reflect(-V, N);
  float fr = .085 + .9 * pow(1. - clamp(dot(N, V), 0., 1.), 4.);
  col += skyCol(R, .22) * fr * .6;
  // brass stringing let into the veneer
  vec3 br = uInlay * (uSunCol * (.35 + .65 * key) + amb * .8) + uInlay * skyCol(R, .5) * .5
          + uSunCol * pow(max(dot(N, Hh), 0.), 60.) * 1.2;
  col = mix(col, br, inlay);
  // inside the case: dark, lit only by silver light off the water
  float ins = max(step(1.5, vKind) * step(vKind, 2.5), insideCase(vH));
  vec3 bn = bounce(nH, vH);
  // the works chamber is panelled in near-black wood: frames and fielded panels, a faint figure, no stripes
  vec2 pq = vec2(across / 7.5 + .5, along / 12.), pf = abs(fract(pq) - .5) * vec2(7.5, 12.);
  float pe = min(3.75 - pf.x, 6. - pf.y), pw = max(fwidth(pe), 1e-3);     // metres from the nearest panel joint
  float groove = smoothstep(.16 + pw, .16 - pw, abs(pe - .55)) * min(1., .5 / pw);
  float bead = smoothstep(.10 + pw, .10 - pw, abs(pe - .95)) * min(1., .3 / pw);
  float pnl = mix(1., (1. - .55 * groove) * (1. + .5 * bead) * mix(.86, 1.06, smoothstep(.5, 1.6, pe)), inK);
  vec3 dark = (uDarkCol * mix(1.25, 1.15, inK) + alb * mix(.07, .05, inK)) * (.75 + mix(9., 7.5, inK) * bn) * (.9 + .2 * fig * (1. - .7 * inK)) * pnl + uSlate * bn * .22 * (1. - .5 * inK);
  col = mix(col, dark, ins);
  gl_FragColor = vec4(col * uDim, 1.);
  #include <fog_fragment>
}`;

// ---- metal: satin brass, steel, nickel; vertex colour is the metal's tint; aKind 1 = engraved scale plate ----
const METAL_VERT = /* glsl */`
attribute float aKind;
uniform float uPx;
varying vec3 vW, vN, vH, vC, vGc; varying vec2 vUv; varying float vKind;
${FOG_V}
void main(){
  vec3 pos = position;
  vGc = vec3((uHeroInv * modelMatrix[3]).xy, (aKind - 3.) * 100.);   // a wheel's centre (hero space) and radius
  vGc.y = abs(vGc.y);
  if (aKind > 1.5 && aKind < 2.5) {                                         // the rod never falls under ~2 pixels wide
    float dist = length((modelViewMatrix * vec4(0., position.y, 0., 1.)).xyz);
    pos.x *= max(1., uPx * dist * 2. / 1.2);
  }
  vec4 wp = modelMatrix * vec4(pos, 1.);
  vW = wp.xyz; vH = (uHeroInv * wp).xyz; vH.y = abs(vH.y); vUv = uv; vKind = aKind; vC = color;
  vN = normalize(mat3(modelMatrix) * normal);
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const METAL_FRAG = /* glsl */`
uniform float uPatina; uniform vec3 uPatinaCol;
varying vec3 vW, vN, vH, vC, vGc; varying vec2 vUv; varying float vKind;
${FOG_F}
void main(){
  vec3 N = normalize(vN); if (!gl_FrontFacing) N = -N;
  vec3 V = normalize(cameraPosition - vW);
  N.y *= uMirror; V.y *= uMirror;                             // a mirrored copy is lit like the original
  vec3 nH = normalize(mat3(uHeroInv) * N);
  vec3 tint = vC;
  float rough = .42;
  // brushed satin: fine streaks, a little cloudiness, optional verdigris in the hollows
  vec2 suv = vKind > 2.5 ? vec2(length(vUv) * .25, atan(vUv.y, vUv.x + 1e-5) * .12) : vUv;   // wheels are brushed in circles
  float streak = vn(vec2(suv.x * 3., suv.y * 90.)) * .5 + vn(suv * vec2(40., 4.)) * .5;
  float cloud = fbm(vH.xy * .22 + vH.z * .17);
  tint *= (.86 + .2 * streak) * (.8 + .32 * cloud);
  float pat = uPatina * smoothstep(.5, .8, cloud + streak * .2) * (abs(vKind - 1.) < .5 ? .3 : 1.);
  tint = mix(tint, uPatinaCol, pat); rough = mix(rough, .9, pat);
  float eng = 0.;
  if (vKind > .5 && vKind < 1.5) {                           // scale plate: tick marks only, long every 4 m
    float y = vUv.y, x = vUv.x;
    float wy = max(fwidth(y), 1e-4);
    float fy = abs(fract(y + .5) - .5);
    float f4 = abs(fract(y * .25 + .5) - .5) * 4.;
    float shortT = smoothstep(.07 + wy, .07 - wy, fy) * step(abs(x), .5) * step(.18, abs(x)) * step(x, 0.);
    float longT = smoothstep(.11 + wy, .11 - wy, f4) * step(abs(x), .78);
    float rule = smoothstep(.03 + wy, .03 - wy, abs(abs(x) - .9));
    eng = clamp(max(max(shortT, longT), rule) * min(1., .14 / wy), 0., 1.);
    rough = .3;
  }
  if (vKind > 1.5 && vKind < 2.5) {                           // the rod: tempo notches every 2 m above the pivot
    float y = vUv.y * 10.;
    float wy = max(fwidth(y), 1e-4);
    float f2 = abs(fract(y * .5 + .5) - .5) * 2.;
    eng = smoothstep(.09 + wy, .09 - wy, f2) * min(1., .18 / wy) * step(43., y) * step(vUv.x, .3) * .8;
    rough = .3;
  }
  vec3 R = reflect(-V, N);
  vec3 L = uSunDir;
  vec3 Hh = L + V; Hh = dot(Hh, Hh) > 1e-6 ? normalize(Hh) : N;
  float ndl = dot(N, L);
  float fr = pow(1. - clamp(dot(N, V), 0., 1.), 5.);
  vec3 env = mix(skyCol(R, rough), skyCol(N, 1.), .22);
  vec3 warm = mix(tint, tint * tint * 1.7, .4);
  vec3 col = warm * env * (.95 + streak * .2) + tint * tint * uSunCol * smoothstep(-.1, 1., ndl) * .5;
  col += mix(tint, vec3(1.), .25) * uSunCol * pow(max(dot(N, Hh), 0.), mix(90., 12., rough)) * mix(2.2, .5, rough) * step(0., ndl);
  col += skyCol(R, .1) * fr * .25;
  float ins = insideCase(vH);
  vec3 rHh = reflect(-normalize(mat3(uHeroInv) * V), nH);
  vec3 dark = tint * (bounce(nH, vH) * (1.5 + 2. * fr) + bounce(rHh, vH) * 1.5) + uDarkCol * .1;
  // in the works the only light is silver off the water, coming in low through the opening (+Z in hero space)
  // antique metal in the works: about half the tone of the polished bob, a little greyed
  vec3 ant = mix(tint, vec3(dot(tint, vec3(.3, .55, .15))), .22) * .62;
  if (vKind > 2.5) {                                          // a wheel: lit as a wheel, the light fixed while it turns
    float Rw = max(vGc.z, 1.);
    vec2 q = (vH.xy - vGc.xy) / Rw;
    float rl = length(vUv) / Rw, la = atan(vUv.y, vUv.x + 1e-5), aw = atan(q.y, q.x + 1e-5);
    float az = abs(nH.z);
    float face = smoothstep(.80, .95, az);                     // 1 on the two faces
    float chamf = smoothstep(.45, .62, az) * (1. - smoothstep(.78, .93, az));   // chamfers and beads: one bright line each
    float grad = (1. - smoothstep(-1., .75, q.y));                    // dark above, lit from the water below
    float cool = (1. - smoothstep(-.85, -.25, q.y));                  // the lower third washed cool silver
    float brush = .82 + .36 * vn(vec2(la * 9., rl * 6.));      // the turned finish goes round with the wheel
    float bw = abs(cos(aw - .55)); bw *= bw; bw *= bw;         // a bow-tie sheen that stays put as the brushing turns under it
    vec3 g = ant * uHor * (.09 + .50 * grad) * brush;
    g += ant * uHor * .50 * bw * bw * brush * smoothstep(.22, .5, rl) * (.3 + .7 * grad);
    // edges (tooth flanks and lands, rim wall, spoke sides): bright only where they look down at the water
    vec3 edge = ant * uHor * (.06 + .95 * (1. - smoothstep(-.85, .25, nH.y)) * (.45 + .55 * grad));
    g = mix(edge, g, face);
    g += mix(ant, uHor, .35) * uHor * (.85 * chamf * (.35 + .65 * grad) + .55 * face * smoothstep(.955, .985, rl));   // chamfer lines; the tooth tips
    g = mix(g, g * .55 + uHor * vec3(.72, .88, 1.) * .13, cool * (.55 + .45 * face));
    g *= mix(.34, 1., smoothstep(.15, .27, rl));               // the hub sits in a darker recess
    g += mix(ant, uHor, .5) * .42 * (1. - smoothstep(.05, .085, rl)) * face;   // with a bright boss
    dark = g + uDarkCol * .04;
  } else {
    float chamf = smoothstep(.42, .60, abs(nH.z)) * (1. - smoothstep(.80, .93, abs(nH.z))) * step(0., nH.z);
    vec3 dk = ant * (bounce(nH, vH) * (1.5 + 2. * fr) + bounce(rHh, vH) * 1.5) + uDarkCol * .1;
    dk = mix(dk, dark, abs(vKind - 1.) < .5 ? 1. : 0.);                          // the scale plate keeps its polish
    dark = dk * mix(.55, 1.05, (1. - smoothstep(2., 58., vH.y))) * (abs(vKind - 1.) < .5 ? 1.35 : .56) + mix(ant, uHor, .3) * uHor * .62 * chamf;
  }
  col = mix(col, dark, ins);
  col = mix(col, col * .14, eng);
  gl_FragColor = vec4(col * uDim, 1.);
  #include <fog_fragment>
}`;

// ---- the bob: polished brass that mirrors the analytic sky, the sun, the marsh (with its racing lines) and the case ----
const BOB_FRAG = /* glsl */`
uniform float uT, uLock, uLineSpacing, uLineSpeed, uFogK, uMag;
uniform vec3 uWood;
varying vec3 vW, vN, vH, vC; varying vec2 vUv; varying float vKind;
${FOG_F}
vec3 marsh(vec3 ro, vec3 rd){
  float t = (ro.y - uWaterY) / max(-rd.y, 2e-3);
  vec2 P = ro.xz + rd.xz * t * uMag;          // the marsh is drawn magnified so its lines stay readable in the bob
  vec2 fw = fwidth(P);
  float foot = clamp((fw.x + fw.y) * .5, 0., 400.);
  vec3 water = skyCol(vec3(rd.x, -rd.y, rd.z), .12) * .82;
  float tuss = smoothstep(.38, .62, fbm(P * .028 + 3.));
  float lead = smoothstep(.3, .5, vn(P * .21));
  // the reed bed: lace from above, a solid dark comb at grazing angles, parted by the avenue that runs up to the case
  vec3 hp = (uHeroInv * vec4(ro.x + rd.x * t, uWaterY, ro.z + rd.z * t, 1.)).xyz;
  float avenue = (1. - smoothstep(7.5, 10., abs(hp.x)));
  float bed = mix(.6 + .4 * tuss, 1., (1. - smoothstep(.08, .5, -rd.y)) * .9) * mix(.45 + .55 * lead, 1., clamp(foot * .25, 0., 1.));
  float nap = bed * (1. - avenue);
  float zc = dot(P, uDownwind) + 30. * vn(P / 200.);
  float ph = uT * uLineSpeed / uLineSpacing - zc / uLineSpacing;
  float lineS = sin(6.2831853 * ph);
  vec2 cell = floor(P / 2.5);
  float own = sin(6.2831853 * ((.42 + .16 * h21(cell)) * uT + h21(cell + 17.3)));
  float lulls = smoothstep(.55, .8, vn(P / 110. - uT * .1 * uDownwind));
  float C = clamp(uLock - .6 * lulls * uLock, 0., 1.);
  float s = mix(own, lineS, C);
  float g = smoothstep(.72, .97, s);
  float lw = fwidth(ph);
  g = mix(g, .1, clamp(max(smoothstep(.3, .8, lw), foot * .3 * (1. - C)), 0., 1.));
  water *= 1. - .3 * C * (.5 + .5 * lineS) * (1. - smoothstep(.3, .8, lw));
  vec3 reed = uSlate * (.2 + .16 * vn(P * .5));
  vec3 col = mix(water, reed, nap * .92);
  col += vec3(1., .7, .26) * uSunCol * g * (.2 + .8 * nap) * 3.4;
  return mix(uHor * .8, col, exp(-t * uFogK));
}
void main(){
  vec3 N = normalize(vN); if (!gl_FrontFacing) N = -N;
  vec3 V = normalize(cameraPosition - vW);
  N.y *= uMirror; V.y *= uMirror;                             // a mirrored copy is lit like the original
  vec3 R = reflect(-V, N);
  vec3 env = R.y > 0. ? skyCol(R, .015) : vec3(0.);
  vec3 m = marsh(vec3(vW.x, uWaterY + abs(vW.y - uWaterY), vW.z), vec3(R.x, min(R.y, -2e-3), R.z));
  env = mix(m, skyCol(vec3(R.x, max(R.y, 0.), R.z), .015), smoothstep(-.012, .012, R.y));
  // the case behind the swing plane, as a dark trapezoid with its darker recess
  vec3 rh = mat3(uHeroInv) * R;
  if (rh.z < -.02) {
    float tz = (vH.z - 22.) / (-rh.z);
    vec3 q = vH + rh * tz;
    tz = (vH.z - hwB(q.y)) / (-rh.z); q = vH + rh * tz;
    float hw = hwB(q.y);
    float inC = smoothstep(.0, 1.2, hw - abs(q.x)) * smoothstep(4.2, 5., q.y) * (1. - smoothstep(139., 141., q.y));
    float oh = mix(20., 5., clamp((q.y - 4.4) / 118., 0., 1.));
    float inO = smoothstep(.0, .8, oh - abs(q.x)) * (1. - smoothstep(121.8, 122.6, q.y));
    float rib = vn(vec2(q.x * .42, q.y * .0105));
    vec3 cc = mix(uWood * (.5 + .5 * rib) * (uZen * .7 + uSunCol * .25) + skyCol(reflect(rh, vec3(0., .17, .985)), .3) * .12,
                  uDarkCol * (.5 + .7 * (1. - smoothstep(5., 60., q.y))), inO);
    env = mix(env, cc, inC * step(0., tz));
  }
  float ndv = clamp(dot(N, V), 0., 1.);
  float fr = pow(1. - ndv, 4.);
  vec3 tint = mix(vC, vec3(1., .93, .8), .12 + fr * .6);
  // faint lathe rings and a satin breath so it is polished metal, not a mirror ball
  float ring = .98 + .02 * sin(vUv.y * 260.) * (1. - clamp(fwidth(vUv.y) * 90., 0., 1.));
  vec3 col = tint * env * ring * 1.15 + vC * skyCol(N, 1.) * .06;
  float ins = insideCase(vH) * .55;
  col = mix(col, col * .45 + tint * bounce(normalize(mat3(uHeroInv) * N), vH) * 1.2, ins);
  gl_FragColor = vec4(col * uDim, 1.);
  #include <fog_fragment>
}`;

// ---- glints: camera-facing additive stars (bob rim, key, wedge), never under ~2 pixels ----
const GLINT_VERT = /* glsl */`
attribute vec3 aPos; attribute float aSize, aGain;
uniform float uPx;                         // world metres per pixel at 1 m (2 tan(fov/2) / viewport height)
varying vec2 vQ; varying float vI;
${FOG_V}
void main(){
  vec4 mvPosition = modelViewMatrix * vec4(aPos, 1.);
  float dist = max(-mvPosition.z, .1);
  float size = max(aSize, uPx * dist * 5.);
  vI = aGain * (aSize * aSize) / (size * size) * step(.001, aGain);
  mvPosition.xy += position.xy * size;
  vQ = position.xy;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const GLINT_FRAG = /* glsl */`
uniform vec3 uGlintCol;
varying vec2 vQ; varying float vI;
${FOG_F}
void main(){
  float r = length(vQ);
  float core = exp(-r * r * 22.);
  float halo = exp(-r * 4.2) * .16;
  float star = (exp(-abs(vQ.x) * 30.) * exp(-abs(vQ.y) * 3.2) + exp(-abs(vQ.y) * 30.) * exp(-abs(vQ.x) * 3.2)) * .5;
  float a = (core + halo + star) * (1. - smoothstep(.7, 1., r));
  vec3 col = uGlintCol * a * vI;
  #ifdef USE_FOG
    #ifdef FOG_EXP2
      col *= 1. - clamp(1. - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth), 0., 1.) * .8;
    #else
      col *= 1. - smoothstep(fogNear, fogFar, vFogDepth) * .8;
    #endif
  #endif
  gl_FragColor = vec4(col, 1.);
}`;

// ---- geometry helpers ----
// prim(): a three.js primitive made ready to merge: non-indexed, with a metal tint (vertex colour) and a kind.
function prim(geo, color, kind = 0, m = null) {
  let g = geo.index ? geo.toNonIndexed() : geo;
  if (g !== geo) geo.dispose();
  if (m) g.applyMatrix4(m);
  const n = g.attributes.position.count;
  if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(n * 2), 2));
  const col = new Float32Array(n * 3), k = new Float32Array(n).fill(kind);
  for (let i = 0; i < n; i++) { col[i * 3] = color.r; col[i * 3 + 1] = color.g; col[i * 3 + 2] = color.b; }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setAttribute('aKind', new THREE.BufferAttribute(k, 1));
  for (const name of Object.keys(g.attributes)) if (!['position', 'normal', 'uv', 'color', 'aKind'].includes(name)) g.deleteAttribute(name);
  return g;
}
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _s = new THREE.Vector3(), _p = new THREE.Vector3();
function TRS(x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) {
  return new THREE.Matrix4().compose(_p.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz)), _s.set(sx, sy, sz));
}
function merged(list) { const g = mergeGeometries(list, false); for (const l of list) l.dispose(); return g; }
// a box with chamfered long edges (8-sided section) running along local Y from 0 to len: bars, legs, the rod
function bevelBar(w, d, len, bev, wTop = w, dTop = d) {
  const sh = (ww, dd) => { const a = ww / 2, b = dd / 2, c = Math.min(bev, a * 0.45, b * 0.45);
    return [[-a + c, -b], [a - c, -b], [a, -b + c], [a, b - c], [a - c, b], [-a + c, b], [-a, b - c], [-a, -b + c]]; };
  const s0 = sh(w, d), s1 = sh(wTop, dTop), pos = [], uv = [];
  const push = (p, y, u, v) => { pos.push(p[0], y, p[1]); uv.push(u, v); };
  for (let i = 0; i < 8; i++) {
    const j = (i + 1) % 8;
    push(s0[j], 0, j / 8, 0); push(s0[i], 0, i / 8, 0); push(s1[i], len, i / 8, len * 0.1);
    push(s0[j], 0, j / 8, 0); push(s1[i], len, i / 8, len * 0.1); push(s1[j], len, j / 8, len * 0.1);
  }
  for (let i = 1; i < 7; i++) {                                   // end caps
    push(s0[0], 0, 0, 0); push(s0[i], 0, 0, 0); push(s0[i + 1], 0, 0, 0);
    push(s1[0], len, 0, 0); push(s1[i + 1], len, 0, 0); push(s1[i], len, 0, 0);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
  g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uv), 2));
  g.computeVertexNormals();
  return g;
}
// quad soup with flat normals for the case; each vertex is [x, y, z, u, v]; `want` fixes the facing
class Quads {
  constructor() { this.pos = []; this.nor = []; this.uv = []; this.kind = []; }
  quad(a, b, c, d, want, kind) {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    let order = [a, b, c, a, c, d];
    if (nx * want[0] + ny * want[1] + nz * want[2] < 0) { order = [a, c, b, a, d, c]; nx = -nx; ny = -ny; nz = -nz; }
    for (const p of order) { this.pos.push(p[0], p[1], p[2]); this.nor.push(nx, ny, nz); this.uv.push(p[3], p[4]); this.kind.push(kind); }
  }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(this.pos), 3));
    g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(this.nor), 3));
    g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(this.uv), 2));
    g.setAttribute('aKind', new THREE.BufferAttribute(new Float32Array(this.kind), 1));
    return g;
  }
}

// ---- materials: every uniform object in U is shared by reference, so one write reaches all of them ----
function makeMaterials(pal, cab, opts, rng) {
  const C = (h) => new THREE.Color(h);
  const sun = new THREE.Vector3().fromArray(opts.sunDir || [-0.975, 0.21, 0.07]).normalize();
  const U = {
    uZen: { value: C(pal[1]) }, uHor: { value: C(pal[0]) }, uSlate: { value: C(pal[2]) }, uDarkCol: { value: C(pal[6]) },
    uSunCol: { value: C('#FFF0D2') }, uSunDir: { value: sun }, uHeroInv: { value: new THREE.Matrix4() },
    uWood: { value: cab.wood }, uWoodHi: { value: cab.woodHi }, uInlay: { value: cab.metal }, uSeed: { value: rng.range(0, 40) },
    uPatina: { value: cab.patina }, uPatinaCol: { value: C('#5FAE9A') },
    uT: { value: 0 }, uLock: { value: 1 }, uWaterY: { value: 0 }, uMirror: { value: 1 }, uDim: { value: 1 }, uFogK: { value: 0.0011 },
    uLineSpacing: { value: opts.lineSpacing || 120 }, uLineSpeed: { value: opts.lineSpeed || 60 },
    uDownwind: { value: new THREE.Vector2().fromArray(opts.downwind || [0, 1]).normalize() },
    uPx: { value: 0.002 }, uMag: { value: opts.bobMagnify || 6 }, uGlintCol: { value: C(pal[5]).lerp(cab.metal, 0.35) },
  };
  const mk = (vert, frag, names, extra = {}) => {
    const uniforms = THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
    for (const n of ['uZen', 'uHor', 'uSlate', 'uDarkCol', 'uSunCol', 'uSunDir', 'uHeroInv', 'uDownwind', 'uMirror', 'uDim', 'uWaterY', ...names]) uniforms[n] = U[n];
    return new THREE.ShaderMaterial({ uniforms, fog: true, vertexShader: GLSL_COMMON + vert, fragmentShader: GLSL_COMMON + frag, ...extra });
  };
  const wood = mk(WOOD_VERT, WOOD_FRAG, ['uWood', 'uWoodHi', 'uInlay', 'uSeed'], { side: THREE.DoubleSide });
  const metal = mk(METAL_VERT, METAL_FRAG, ['uPatina', 'uPatinaCol', 'uPx'], { vertexColors: true });
  const bob = mk(METAL_VERT, BOB_FRAG, ['uT', 'uLock', 'uFogK', 'uLineSpacing', 'uLineSpeed', 'uWood', 'uMag', 'uPx'], { vertexColors: true });
  const glint = mk(GLINT_VERT, GLINT_FRAG, ['uPx', 'uGlintCol'],
    { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  return { U, wood, metal, bob, glint };
}

// ---- the case: a square loft of a moulded profile, open at the front and at the bottom ----
const FRONT_WALL = 3.2;
function caseProfile(mould) {
  const base = [[4.4, 1.7], [5.9, 1.7], [6.3, 1.35], [7.0, 1.3], [7.5, 1.0], [8.1, 0.55], [8.8, 0.3], [9.3, 0.3], [9.6, 0]];
  const cap = [[131.4, 0], [131.9, 0.35], [132.5, 0.4], [133.1, 0.8], [133.9, 1.25], [134.5, 1.7], [136.2, 1.7], [136.6, 1.3],
    [137.4, 1.1], [138.2, 0.3], [139.0, -0.9], [140, -3.2]];
  const pts = [];
  for (const [y, o] of base) pts.push({ y, hw: hwBody(y) + o * mould, kind: 1 });
  for (const y of [40, 80, OPEN_TOP]) pts.push({ y, hw: hwBody(y), kind: 0 });
  for (const [y, o] of cap) pts.push({ y, hw: hwBody(y) + (o > 0 ? o * mould : o), kind: 1 });
  pts[8].kind = 0;                                   // the segment that starts at y 9.6 is the body
  for (let i = 9; i < 12; i++) pts[i].kind = 0;
  return pts;
}
function buildCase(mould) {
  const Q = new Quads(), prof = caseProfile(mould);
  const sides = [[0, 0, 1], [1, 0, 0], [0, 0, -1], [-1, 0, 0]];       // outward normals; across = up x n
  const P = (n, c, y, hw, u = c, v = y) => [n[0] * hw + n[2] * c, y, n[2] * hw - n[0] * c, u, v];
  for (let s = 0; s < 4; s++) {
    const n = sides[s];
    for (let i = 0; i < prof.length - 1; i++) {
      const a = prof[i], b = prof[i + 1];
      const kind = a.kind === 0 ? (s === 0 ? 3 : 0) : 1;
      const want = [n[0], (a.hw - b.hw) / Math.max(b.y - a.y, 0.01) * 0.5 + 0.02, n[2]];
      if (s === 0 && a.y < OPEN_TOP - 0.01) {                          // the front, either side of the opening
        const o0 = openHalf(a.y), o1 = openHalf(b.y);
        Q.quad(P(n, -a.hw, a.y, a.hw), P(n, -o0, a.y, a.hw), P(n, -o1, b.y, b.hw), P(n, -b.hw, b.y, b.hw), want, kind);
        Q.quad(P(n, o0, a.y, a.hw), P(n, a.hw, a.y, a.hw), P(n, b.hw, b.y, b.hw), P(n, o1, b.y, b.hw), want, kind);
        // jambs: the thickness of the front wall, veneered
        for (const sg of [-1, 1]) {
          Q.quad([sg * o0, a.y, a.hw, a.hw * 0.3, a.y], [sg * o0, a.y, hwBody(a.y) - FRONT_WALL, a.hw * 0.3 + 3.4, a.y],
            [sg * o1, b.y, hwBody(b.y) - FRONT_WALL, b.hw * 0.3 + 3.4, b.y], [sg * o1, b.y, b.hw, b.hw * 0.3, b.y], [-sg, 0, 0], 1);
        }
      } else {
        Q.quad(P(n, -a.hw, a.y, a.hw), P(n, a.hw, a.y, a.hw), P(n, b.hw, b.y, b.hw), P(n, -b.hw, b.y, b.hw), want, kind);
      }
    }
    // inner faces of the works chamber and the underside of the wall
    const wall = s === 0 ? FRONT_WALL : WALL, y0 = BASE_Y, y1 = CHAMBER_TOP;
    const i0 = hwBody(y0) - wall, i1 = hwBody(y1) - wall, c0 = hwBody(y0) - WALL, c1 = hwBody(y1) - WALL, ob = prof[0].hw;
    if (s === 0) {
      const o0 = openHalf(y0), o1 = openHalf(y1);
      Q.quad(P(n, -c0, y0, i0), P(n, -o0, y0, i0), P(n, -o1, y1, i1), P(n, -c1, y1, i1), [0, 0, -1], 2);
      Q.quad(P(n, o0, y0, i0), P(n, c0, y0, i0), P(n, c1, y1, i1), P(n, o1, y1, i1), [0, 0, -1], 2);
      Q.quad(P(n, -ob, y0, ob), P(n, -o0, y0, ob), P(n, -o0, y0, i0), P(n, -ob, y0, i0), [0, -1, 0], 1);
      Q.quad(P(n, o0, y0, ob), P(n, ob, y0, ob), P(n, ob, y0, i0), P(n, o0, y0, i0), [0, -1, 0], 1);
    } else {
      Q.quad(P(n, -c0, y0, i0), P(n, c0, y0, i0), P(n, c1, y1, i1), P(n, -c1, y1, i1), [-n[0], 0, -n[2]], 2);
      Q.quad(P(n, -ob, y0, ob), P(n, ob, y0, ob), P(n, i0, y0, i0), P(n, -i0, y0, i0), [0, -1, 0], 1);
    }
  }
  // lid, chamber ceiling, the head of the opening
  const top = prof[prof.length - 1], ct = hwBody(CHAMBER_TOP) - WALL;
  Q.quad([-top.hw, top.y, top.hw, -top.hw, 0], [top.hw, top.y, top.hw, top.hw, 0], [top.hw, top.y, -top.hw, top.hw, 9], [-top.hw, top.y, -top.hw, -top.hw, 9], [0, 1, 0], 1);
  Q.quad([-ct, CHAMBER_TOP, ct, 0, 0], [ct, CHAMBER_TOP, ct, 40, 0], [ct, CHAMBER_TOP, -ct, 40, 40], [-ct, CHAMBER_TOP, -ct, 0, 40], [0, -1, 0], 2);
  const ht = hwBody(OPEN_TOP), oT = openHalf(OPEN_TOP);
  Q.quad([-oT, OPEN_TOP, ht, 0, 0], [oT, OPEN_TOP, ht, 10, 0], [oT, OPEN_TOP, ht - FRONT_WALL, 10, 3], [-oT, OPEN_TOP, ht - FRONT_WALL, 0, 3], [0, -1, 0], 1);
  // the back of the upper recess (it carries the scale plate), and a coved soffit down into the chamber
  const yb = 54, rows = 4;
  for (let i = 0; i < rows; i++) {
    const ya = lerp(yb, OPEN_TOP, i / rows), yc = lerp(yb, OPEN_TOP, (i + 1) / rows);
    const za = hwBody(ya) - FRONT_WALL, zc = hwBody(yc) - FRONT_WALL, xa = openHalf(ya) + 0.2, xc = openHalf(yc) + 0.2;
    Q.quad([-xa, ya, za, -xa, ya], [xa, ya, za, xa, ya], [xc, yc, zc, xc, yc], [-xc, yc, zc, -xc, yc], [0, 0, 1], 2);
  }
  const zb = hwBody(yb) - FRONT_WALL, xb = openHalf(yb) + 0.2;
  Q.quad([-xb, yb, zb, -xb, 0], [xb, yb, zb, xb, 0], [ct, CHAMBER_TOP, zb - 9, ct, 12], [-ct, CHAMBER_TOP, zb - 9, -ct, 12], [0, -1, 0.3], 2);
  return Q.build();
}

// ---- wheels: pierced, bevelled brass gears lying in the x-y plane (axis z), centred on the origin ----
async function gearGeometry(ctx, { R, teeth, toothH, escape = false, spokes = 5, hubR, rimW, depth, spokeW, color, hubColor }) {
  // Built by hand (a toothed rim ring, flat spokes, hub bosses): triangulating one big extruded shape with holes
  // held the page for a whole frame's budget on slow machines.
  const root = R - toothH, r2 = root - rimW, hz = depth / 2, P = [];
  const prof = escape ? [[0, 0], [0.06, 0.25], [0.72, 1], [0.8, 1], [0.86, 0]] : [[0, 0], [0.16, 1], [0.46, 1], [0.62, 0]];
  const tri = (a, b, c) => P.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
  const quad = (a, b, c, d) => { tri(a, b, c); tri(a, c, d); };
  const pt = (ang, r, z) => [Math.cos(ang) * r, Math.sin(ang) * r, z];
  for (let k = 0; k < teeth; k++) {
    const a0 = (k / teeth) * Math.PI * 2, a1 = ((k + 1) / teeth) * Math.PI * 2;
    const ring = prof.map(([f, h]) => [((k + f) / teeth) * Math.PI * 2, root + toothH * h]); ring.push([a1, root]);
    for (const z of [hz, -hz]) {
      const I0 = pt(a0, r2, z), I1 = pt(a1, r2, z);
      for (let j = 0; j < ring.length - 1; j++) {
        const A = pt(ring[j][0], ring[j][1], z), B = pt(ring[j + 1][0], ring[j + 1][1], z);
        if (z > 0) tri(I0, A, B); else tri(I0, B, A);
      }
      const L = pt(a1, root, z);
      if (z > 0) tri(I0, L, I1); else tri(I0, I1, L);
    }
    for (let j = 0; j < ring.length - 1; j++) {                       // the tooth flanks and lands
      quad(pt(ring[j][0], ring[j][1], -hz), pt(ring[j + 1][0], ring[j + 1][1], -hz), pt(ring[j + 1][0], ring[j + 1][1], hz), pt(ring[j][0], ring[j][1], hz));
    }
    quad(pt(a1, r2, -hz), pt(a0, r2, -hz), pt(a0, r2, hz), pt(a1, r2, hz));   // the rim's inner wall
  }
  const body = new THREE.BufferGeometry();
  body.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P), 3));
  body.computeVertexNormals();
  await ctx.yield();
  const rx = Math.PI / 2;
  const parts = [prim(body, color)];
  for (let i = 0; i < spokes; i++) {                                   // flat spokes from the hub to the rim
    const ang = ((i + 0.5) / spokes) * Math.PI * 2, len = r2 - hubR * 0.8 + rimW * 0.3;
    const bar = bevelBar(spokeW, depth * 0.7, len, Math.min(spokeW, depth * 0.7) * 0.26, spokeW * 0.8);   // chamfered: one bright line down each edge
    parts.push(prim(bar, color, 0, TRS(Math.cos(ang) * hubR * 0.8, Math.sin(ang) * hubR * 0.8, 0, 0, 0, ang - Math.PI / 2)));
  }
  // hub: a turned boss on each face, a collet and the arbor's square end
  const boss = [[0, 0], [hubR * 0.92, 0], [hubR * 0.95, depth * 0.5], [hubR * 0.7, depth * 0.62], [hubR * 0.66, depth * 0.95], [hubR * 0.42, depth * 1.05], [hubR * 0.4, depth * 1.5], [0, depth * 1.5]]
    .map(([r, y]) => new THREE.Vector2(r, y));
  parts.push(prim(new THREE.LatheGeometry(boss, 20), hubColor, 0, TRS(0, 0, 0, rx, 0, 0)));
  parts.push(prim(new THREE.LatheGeometry(boss, 20), hubColor, 0, TRS(0, 0, 0, -rx, 0, 0)));
  parts.push(prim(new THREE.BoxGeometry(hubR * 0.42, hubR * 0.42, depth * 3.5), hubColor, 0, TRS(0, 0, 0, 0, 0, 0.6)));
  // a raised bead round the rim on both faces
  for (const sg of [-1, 1]) parts.push(prim(new THREE.TorusGeometry(root - rimW * 0.5, Math.min(0.22, rimW * 0.22), 5, 48), hubColor, 0, TRS(0, 0, sg * depth * 0.5)));
  await ctx.yield();
  // the shader lights a wheel as a wheel: uv = wheel-local (x, y) in metres, aKind = 3 + R / 100
  const out = merged(parts), pa = out.attributes.position, ua = out.attributes.uv, ka = out.attributes.aKind;
  for (let i = 0; i < pa.count; i++) { ua.setXY(i, pa.getX(i), pa.getY(i)); ka.setX(i, 3 + R / 100); }
  return out;
}

// ---- brass that never moves: feet, A-frames, pivot arbor, scale plate, finial, key boss, wheel arbors ----
async function buildStaticMetal(ctx, cab, wheels, keySide, finial) {
  const parts = [], B = cab.metal, B2 = cab.metalDeep, rx = Math.PI / 2;
  // ball feet with a turned neck and a square shoe plate under each corner of the case
  const foot = [];
  for (let i = 0; i <= 14; i++) { const a = lerp(-Math.PI / 2, 0.87, i / 14); foot.push(new THREE.Vector2(Math.cos(a) * 2.5, 2.0 + Math.sin(a) * 2.5)); }
  foot.push(new THREE.Vector2(1.35, 4.0), new THREE.Vector2(1.9, 4.08), new THREE.Vector2(2.0, 4.25), new THREE.Vector2(0, 4.25));
  const anchorsFeet = [];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    parts.push(prim(new THREE.LatheGeometry(foot, 28), B, 0, TRS(sx * 28, 0, sz * 28)));
    parts.push(prim(bevelBar(7.4, 7.4, 0.42, 0.12), B2, 0, TRS(sx * 28.6, 4.12, sz * 28.6)));
    anchorsFeet.push(new THREE.Vector3(sx * 28, 4.6, sz * 28));
    await ctx.yield();
  }
  await ctx.yield();
  // two A-frames carrying the pivot arbor; their legs go down through the water to the peat
  const frameZ = [SWING_Z - 3.4, 7.5], apex = PIVOT_Y + 1.2, spread = 13, legLen = Math.hypot(spread, apex + 0.4), tilt = Math.atan2(spread, apex + 0.4);
  for (const z of frameZ) {
    for (const sg of [-1, 1]) {
      parts.push(prim(bevelBar(1.7, 1.1, legLen, 0.22, 1.2, 0.9), B, 0, TRS(sg * spread, -0.4, z, 0, 0, sg * tilt)));
      parts.push(prim(new THREE.CylinderGeometry(1.5, 2.1, 0.9, 16), B2, 0, TRS(sg * spread, 0.25, z)));
      parts.push(prim(new THREE.CylinderGeometry(0.34, 0.34, 1.5, 10), B2, 0, TRS(sg * spread * (1 - 30.4 / (apex + 0.4)), 30, z, rx, 0, 0)));
    }
    const tieHalf = spread * (1 - 30.4 / (apex + 0.4));
    parts.push(prim(bevelBar(1.0, 0.8, tieHalf * 2, 0.16), B, 0, TRS(tieHalf, 30, z, 0, 0, Math.PI / 2)));
    const cheek = [[0, -0.9], [2.4, -0.9], [2.6, -0.6], [2.6, 0.6], [1.5, 0.9], [1.4, 1.3], [0, 1.3]].map(([r, y]) => new THREE.Vector2(r, y));
    parts.push(prim(new THREE.LatheGeometry(cheek, 24), B, 0, TRS(0, PIVOT_Y, z, rx, 0, 0)));
  }
  parts.push(prim(new THREE.CylinderGeometry(0.75, 0.75, SWING_Z + 3.2 - 5.5, 16), cab.steel, 0, TRS(0, PIVOT_Y, (SWING_Z + 3.2 + 5.5) / 2, rx, 0, 0)));
  await ctx.yield();
  // scale plate up the back of the recess: ticks only (drawn in the shader, aKind 1), in a raised brass frame
  const y0 = 56, y1 = 120, z0 = hwBody(y0) - FRONT_WALL + 0.25, z1 = hwBody(y1) - FRONT_WALL + 0.25, w0 = 5, w1 = 4.4;
  const plate = new THREE.BufferGeometry();
  plate.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-w0, y0, z0, w0, y0, z0, w1, y1, z1, -w0, y0, z0, w1, y1, z1, -w1, y1, z1]), 3));
  plate.setAttribute('uv', new THREE.BufferAttribute(new Float32Array([-1, y0, 1, y0, 1, y1, -1, y0, 1, y1, -1, y1]), 2));
  plate.computeVertexNormals();
  parts.push(prim(plate, B, 1));
  const slope = Math.atan2(z0 - z1, y1 - y0), pl = Math.hypot(y1 - y0, z0 - z1);
  for (const sg of [-1, 1]) parts.push(prim(bevelBar(0.5, 0.5, pl, 0.12), B2, 0, TRS(sg * (w0 + 0.1), y0, z0 + 0.1, -slope, 0, sg * Math.atan2(w0 - w1, pl))));
  parts.push(prim(bevelBar(0.6, 0.6, w0 * 2 + 0.8, 0.12), B2, 0, TRS(w0 + 0.4, y0 - 0.2, z0 + 0.1, 0, 0, Math.PI / 2)));
  parts.push(prim(bevelBar(0.6, 0.6, w1 * 2 + 0.8, 0.12), B2, 0, TRS(w1 + 0.4, y1 + 0.2, z1 + 0.1, 0, 0, Math.PI / 2)));
  await ctx.yield();
  // finial on the lid (per seed: ball, acorn or ring)
  const fin = finial === 0 ? [[0, 0], [2.6, 0], [2.6, 0.3], [1.2, 0.5], [0.7, 1.0], [0.9, 1.3], [1.6, 1.9], [1.75, 2.7], [1.4, 3.5], [0.6, 3.95], [0.25, 4.3], [0, 4.9]]
    : finial === 1 ? [[0, 0], [2.4, 0], [2.4, 0.35], [1.0, 0.6], [0.8, 1.2], [1.7, 1.5], [1.9, 2.4], [1.7, 2.6], [1.5, 3.6], [0.9, 4.6], [0.3, 5.2], [0, 5.9]]
      : [[0, 0], [2.6, 0], [2.6, 0.3], [1.3, 0.55], [0.6, 1.1], [0.6, 1.9], [0, 2.0]];
  parts.push(prim(new THREE.LatheGeometry(fin.map(([r, y]) => new THREE.Vector2(r, y)), 24), B, 0, TRS(0, TOP_Y, 0)));
  if (finial === 2) parts.push(prim(new THREE.TorusGeometry(1.8, 0.42, 10, 28), B, 0, TRS(0, TOP_Y + 3.6, 0, 0, Math.PI / 2, 0)));
  await ctx.yield();
  // key boss on the flank, and each wheel's arbor running to the back of the chamber
  const kx = keySide * (hwBody(38) + 0.05), lean = Math.atan2(24, 135.6) * keySide;
  const bossP = [[0, 0], [2.6, 0], [2.6, 0.25], [2.2, 0.5], [1.3, 0.6], [1.2, 1.1], [0, 1.1]].map(([r, y]) => new THREE.Vector2(r, y));
  parts.push(prim(new THREE.LatheGeometry(bossP, 24), B, 0, TRS(kx, 38, 0, 0, 0, -keySide * Math.PI / 2 + lean)));
  for (const w of wheels) {
    const zb = -(hwBody(w.y) - WALL);
    parts.push(prim(new THREE.CylinderGeometry(0.45, 0.45, w.z - zb, 10), cab.steel, 0, TRS(w.x, w.y, (w.z + zb) / 2, rx, 0, 0)));
    parts.push(prim(new THREE.CylinderGeometry(1.5, 1.9, 0.5, 14), B2, 0, TRS(w.x, w.y, zb + 0.25, rx, 0, 0)));
  }
  await ctx.yield();
  return { geometry: merged(parts), feet: anchorsFeet };
}

// ---- moving parts ----
// butterfly key: stem along +Y (out of the flank), the bow in the x-y plane, 12 m across
function buildKey(cab) {
  const sh = new THREE.Shape();
  sh.moveTo(0.55, 2.2); sh.bezierCurveTo(2.2, 1.2, 6.4, 1.6, 6.0, 4.6); sh.bezierCurveTo(5.8, 7.6, 2.6, 7.9, 0.55, 5.4);
  sh.lineTo(-0.55, 5.4); sh.bezierCurveTo(-2.6, 7.9, -5.8, 7.6, -6.0, 4.6); sh.bezierCurveTo(-6.4, 1.6, -2.2, 1.2, -0.55, 2.2); sh.closePath();
  for (const sg of [-1, 1]) {
    const h = new THREE.Path();
    h.moveTo(sg * 1.7, 3.3); h.bezierCurveTo(sg * 2.8, 2.5, sg * 5.0, 2.7, sg * 4.8, 4.6); h.bezierCurveTo(sg * 4.6, 6.3, sg * 3.0, 6.4, sg * 1.7, 5.0); h.closePath();
    sh.holes.push(h);
  }
  const bow = new THREE.ExtrudeGeometry(sh, { depth: 0.7, bevelEnabled: true, bevelThickness: 0.22, bevelSize: 0.22, bevelSegments: 2, curveSegments: 10 });
  bow.translate(0, 0, -0.35);
  const stem = [[0, 0], [0.75, 0], [0.75, 1.6], [1.05, 1.75], [1.05, 2.1], [0.8, 2.3], [0.8, 5.6], [0.55, 5.9], [0, 5.95]].map(([r, y]) => new THREE.Vector2(r, y));
  return merged([prim(bow, cab.metal), prim(new THREE.LatheGeometry(stem, 16), cab.metalDeep)]);
}
// the arm in pivot space: rod along Y from -41.5 to +88, swing plane z = 0
function buildArm(cab, wedgeY, wedgeTop) {
  const parts = [], S = cab.steel, B = cab.metal, B2 = cab.metalDeep, rx = Math.PI / 2;
  parts.push(prim(bevelBar(1.2, 0.5, 128, 0.16), S, 2, TRS(0, -41.5, 0)));
  parts.push(prim(bevelBar(1.2, 0.5, 1.5, 0.16, 0.25, 0.25), S, 0, TRS(0, 86.5, 0)));
  const hub = [[0, -0.5], [2.3, -0.5], [2.5, -0.3], [2.5, 0.3], [1.5, 0.55], [1.35, 0.9], [0.9, 1.0], [0.8, 1.5], [0, 1.6]].map(([r, y]) => new THREE.Vector2(r, y));
  parts.push(prim(new THREE.LatheGeometry(hub, 24), B, 0, TRS(0, 0, 0, rx, 0, 0)));
  // wedge weight: a bevelled brass trapezoid, wider at the top, with a steel spring clip and a thumb screw
  const w = new THREE.Shape(), hb = 1.7, ht = wedgeTop / 2;
  w.moveTo(-hb, 0); w.lineTo(hb, 0); w.lineTo(ht, 8); w.lineTo(-ht, 8); w.closePath();
  const wedge = new THREE.ExtrudeGeometry(w, { depth: 1.5, bevelEnabled: true, bevelThickness: 0.3, bevelSize: 0.3, bevelSegments: 2 });
  wedge.translate(0, wedgeY, -0.75);
  parts.push(prim(wedge, B));
  parts.push(prim(new THREE.CylinderGeometry(0.55, 0.7, 0.9, 14), B2, 0, TRS(0, wedgeY + 5.6, 1.4, rx, 0, 0)));
  parts.push(prim(bevelBar(0.5, 0.2, 5.5, 0.06), S, 0, TRS(0, wedgeY + 0.6, 1.15)));
  // threaded tail below the bob, and a small acorn on the very end
  const thr = [new THREE.Vector2(0, -41.4)];
  for (let i = 0; i <= 52; i++) thr.push(new THREE.Vector2(i % 2 ? 0.9 : 0.72, -41.4 + i * 0.26));
  thr.push(new THREE.Vector2(0, -41.4 + 53 * 0.26));
  parts.push(prim(new THREE.LatheGeometry(thr, 14), B2));
  const acorn = [[0, -42.6], [0.5, -42.4], [0.95, -41.9], [1.0, -41.5], [0.7, -41.35], [0, -41.3]].map(([r, y]) => new THREE.Vector2(r, y));
  parts.push(prim(new THREE.LatheGeometry(acorn, 14), B));
  return merged(parts);
}
// the bob: a brass lens 9 m across and 3 m thick, axis z, with a rolled rim and a clamp boss on its face
function buildBob(cab) {
  const pts = [], n = 22;
  const cap = (i) => { const q = Math.sin((i / n) * Math.PI / 2); return [4.3 * q, 0.32 + 1.18 * Math.pow(Math.max(1 - q * q, 0), 0.72)]; };
  for (let i = 0; i <= n; i++) { const [r, y] = cap(i); pts.push(new THREE.Vector2(r, y)); }
  for (let i = 1; i < 8; i++) { const a = lerp(Math.PI / 2, -Math.PI / 2, i / 8); pts.push(new THREE.Vector2(4.3 + Math.cos(a) * 0.24, Math.sin(a) * 0.32)); }
  for (let i = n; i >= 0; i--) { const [r, y] = cap(i); pts.push(new THREE.Vector2(r, -y)); }
  const lens = new THREE.LatheGeometry(pts.reverse(), 72);       // bottom to top, so the faces look outward
  const boss = [[0, 1.45], [1.25, 1.45], [1.35, 1.6], [1.2, 1.78], [0.5, 1.84], [0.45, 2.25], [0.3, 2.35], [0, 2.36]].map(([r, y]) => new THREE.Vector2(r, y));
  return merged([prim(lens, cab.metalBright, 0, TRS(0, 0, 0, Math.PI / 2, 0, 0)), prim(new THREE.LatheGeometry(boss, 20), cab.metal, 0, TRS(0, 0, 0, Math.PI / 2, 0, 0))]);
}
// rating nut: knurled, 2 m across, axis Y, with four tommy pegs so its stepping reads
function buildNut(cab) {
  const sh = new THREE.Shape(), k = 40;
  for (let i = 0; i < k; i++) { const a = (i / k) * Math.PI * 2, r = i % 2 ? 1.0 : 0.9; (i ? sh.lineTo : sh.moveTo).call(sh, Math.cos(a) * r, Math.sin(a) * r); }
  sh.closePath();
  const body = new THREE.ExtrudeGeometry(sh, { depth: 0.8, bevelEnabled: true, bevelThickness: 0.14, bevelSize: 0.08, bevelSegments: 1 });
  const parts = [prim(body, cab.metal, 0, TRS(0, -0.4, 0, -Math.PI / 2, 0, 0))];
  const fl = [[0, -0.75], [0.8, -0.75], [0.86, -0.6], [0.8, -0.5], [0.8, 0.5], [0.86, 0.6], [0.8, 0.75], [0, 0.75]].map(([r, y]) => new THREE.Vector2(r, y));
  parts.push(prim(new THREE.LatheGeometry(fl, 20), cab.metalDeep));
  for (let i = 0; i < 4; i++) parts.push(prim(new THREE.CylinderGeometry(0.11, 0.13, 0.75, 8), cab.steel, 0, TRS(Math.cos(i * Math.PI / 2) * 1.3, 0, Math.sin(i * Math.PI / 2) * 1.3, 0, -i * Math.PI / 2, Math.PI / 2)));
  return merged(parts);
}
// glints: a handful of camera-facing quads whose centres, sizes and gains are rewritten each frame
const GLINTS = 5;
function buildGlints() {
  const g = new THREE.BufferGeometry(), pos = [], idx = [];
  for (let i = 0; i < GLINTS; i++) { pos.push(-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0); idx.push(i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3); }
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
  g.setAttribute('aPos', new THREE.BufferAttribute(new Float32Array(GLINTS * 12), 3).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute('aSize', new THREE.BufferAttribute(new Float32Array(GLINTS * 4).fill(1), 1).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute('aGain', new THREE.BufferAttribute(new Float32Array(GLINTS * 4), 1).setUsage(THREE.DynamicDrawUsage));
  g.setIndex(idx);
  return g;
}

// escapement anchor: rocks with the arm on the pivot arbor, its pallets dipping into the escape wheel (pivot space)
function buildAnchor(cab, z) {
  const sh = new THREE.Shape(), r0 = 7.3, r1 = 8.5, half = 0.74, n = 14;
  for (let i = 0; i <= n; i++) { const a = -Math.PI / 2 + lerp(-half, half, i / n); (i ? sh.lineTo : sh.moveTo).call(sh, Math.cos(a) * r1, Math.sin(a) * r1); }
  sh.lineTo(Math.cos(-Math.PI / 2 + half) * (r0 - 1.5) + 0.5, Math.sin(-Math.PI / 2 + half) * (r0 - 1.5));
  for (let i = n; i >= 0; i--) { const a = -Math.PI / 2 + lerp(-half, half, i / n); sh.lineTo(Math.cos(a) * r0, Math.sin(a) * r0); }
  sh.lineTo(Math.cos(-Math.PI / 2 - half) * (r0 - 1.5) - 0.5, Math.sin(-Math.PI / 2 - half) * (r0 - 1.5));
  sh.closePath();
  const arc = new THREE.ExtrudeGeometry(sh, { depth: 0.7, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.12, bevelSegments: 1 });
  arc.translate(0, 0, z - 0.35);
  return [prim(arc, cab.steel), prim(bevelBar(0.8, 0.6, 7.6, 0.12, 1.5, 0.6), cab.metalDeep, 0, TRS(0, -7.6, z))];
}

const CABINETS = {
  mahogany: (pal) => ({ wood: new THREE.Color(pal[3]), woodHi: new THREE.Color(pal[3]).lerp(new THREE.Color('#B9562A'), 0.42), metal: new THREE.Color(pal[4]),
    metalDeep: new THREE.Color(pal[4]).multiplyScalar(0.72), metalBright: new THREE.Color(pal[4]).lerp(new THREE.Color(pal[5]), 0.3), steel: new THREE.Color('#8FA3AD'), patina: 0 }),
  ebony: () => ({ wood: new THREE.Color('#141216'), woodHi: new THREE.Color('#54464C'), metal: new THREE.Color('#B4BABF'),
    metalDeep: new THREE.Color('#868F96'), metalBright: new THREE.Color('#D5DADD'), steel: new THREE.Color('#77858F'), patina: 0 }),
  pearwood: () => ({ wood: new THREE.Color('#6A4324'), woodHi: new THREE.Color('#A87647'), metal: new THREE.Color('#B9703F'),
    metalDeep: new THREE.Color('#955331'), metalBright: new THREE.Color('#DA9A68'), steel: new THREE.Color('#8FA3AD'), patina: 0.45 }),
};

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('maelzel') : ctx.rng;
  const pal = (opts.palette && opts.palette.length >= 7) ? opts.palette : DEFAULT_PALETTE;
  const detail = clamp(opts.detail ?? ctx.quality?.detail ?? 1, 0.6, 1);
  const duration = opts.duration || 46, keySide = opts.keySide === 1 ? 1 : -1, swingSign = opts.swingSign === -1 ? -1 : 1;
  // ---- every random draw happens here, in a fixed order, before any yield ----
  const roll = rng();
  const cabName = CABINETS[opts.cabinet] ? opts.cabinet : (roll < 0.62 ? 'mahogany' : roll < 0.81 ? 'ebony' : 'pearwood');
  const cab = CABINETS[cabName](pal);
  const mould = rng.range(0.85, 1.3), finial = rng.int(0, 2);
  const wedgeY = rng.range(50, 68), wedgeTop = rng.range(4.6, 5.8);
  const teethK = detail < 0.8 ? 0.75 : 1, flip = rng.chance(0.5) ? 1 : -1;
  const wheels = [];
  const addWheel = (x, y, z, r, teeth, spokes, speed, escape = false) => {
    r = Math.min(r, hwBody(y) - WALL - Math.abs(x) - 0.8);
    wheels.push({ x, y, z, r, teeth: Math.round(teeth * teethK), spokes, speed, escape });
  };
  addWheel(-flip * rng.range(10, 12.5), rng.range(29, 33), rng.range(12.5, 15.5), rng.range(11.5, 13), rng.int(56, 72), rng.int(5, 6), 0.11);
  addWheel(flip * rng.range(11.5, 14), rng.range(24.5, 28), rng.range(1, 4), rng.range(9.6, 11), rng.int(44, 56), rng.int(4, 6), -0.15);
  addWheel(flip * rng.range(3, 8), rng.range(43, 46.5), -rng.range(2, 6), rng.range(10, 11.5), rng.int(48, 60), rng.int(5, 7), 0.07);
  const escR = rng.range(5.6, 6.2), escTeeth = rng.int(24, 32);
  wheels.push({ x: 0, y: PIVOT_Y - 4.1 - escR, z: 18.3, r: escR, teeth: escTeeth, spokes: 4, speed: 0, escape: true });
  for (const sg of [-1, 1]) wheels.push({ x: sg * 19.2, y: 9.4, z: -9.5, r: 8.1, teeth: Math.round(34 * teethK), spokes: 5, speed: sg * 0.2, escape: false, low: true });
  const M = makeMaterials(pal, cab, opts, rng);
  const U = M.U;

  const object = new THREE.Group(); object.name = 'maelzel';
  const add = (geo, mat, parent = object) => { const m = new THREE.Mesh(geo, mat); m.frustumCulled = false; parent.add(m); return m; };
  await ctx.yield();
  add(buildCase(mould), M.wood);
  await ctx.yield();
  const stat = await buildStaticMetal(ctx, cab, wheels, keySide, finial);
  add(stat.geometry, M.metal);
  await ctx.yield();
  const wheelMeshes = [];
  for (const w of wheels) {
    const toothH = w.escape ? w.r * 0.2 : Math.min(1.1, w.r * 6.5 / w.teeth * 0.55);
    const g = await gearGeometry(ctx, { R: w.r, teeth: w.teeth, toothH, escape: w.escape, spokes: w.spokes, hubR: w.r * (w.escape ? 0.2 : 0.16), rimW: w.r * 0.085,
      depth: w.escape ? 0.7 : 1.3, spokeW: w.r * 0.11, color: w.escape ? cab.metalBright : cab.metal, hubColor: cab.metalDeep });
    const m = add(g, M.metal); m.position.set(w.x, w.y, w.z); wheelMeshes.push(m);
    await ctx.yield();
  }
  const keyQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, -keySide * Math.PI / 2 + Math.atan2(24, 135.6) * keySide));
  const keyN = new THREE.Vector3(0, 1, 0).applyQuaternion(keyQ);
  const key = add(buildKey(cab), M.metal);
  key.position.set(keySide * hwBody(38), 38, 0).addScaledVector(keyN, 0.9);
  await ctx.yield();
  const arm = new THREE.Group(); arm.position.set(0, PIVOT_Y, SWING_Z); object.add(arm);
  const armGeo = buildArm(cab, wedgeY, wedgeTop);
  await ctx.yield();
  add(merged([armGeo, ...buildAnchor(cab, 18.3 - SWING_Z)]), M.metal, arm);
  await ctx.yield();
  const bob = add(buildBob(cab), M.bob, arm);
  await ctx.yield();
  const nut = add(buildNut(cab), M.metal, arm);
  const glintGeo = buildGlints();
  const glints = add(glintGeo, M.glint); glints.renderOrder = 5;
  await ctx.yield();

  // ---- optional mirror image for the water (opts.reflection): the same geometries under scale.y = -1, with copies of
  // the materials that share every uniform except uMirror / uDim, so they are lit like the original and cost no new
  // shader program. The world's translucent water plane is drawn over it. ----
  const mirrorPairs = [];
  let reflection = null;
  if (opts.reflection) {
    const dim = typeof opts.reflection === 'number' ? opts.reflection : 0.6, mats = new Map();
    const mm = (m) => {
      if (!mats.has(m)) {
        const c = m.clone();
        for (const k of Object.keys(c.uniforms)) if (U[k]) c.uniforms[k] = U[k];
        c.uniforms.uMirror = { value: -1 }; c.uniforms.uDim = { value: dim };
        mats.set(m, c);
      }
      return mats.get(m);
    };
    reflection = new THREE.Group(); reflection.name = 'maelzel-reflection'; reflection.scale.y = -1;
    const copy = (src, dst) => {
      for (const ch of src.children) {
        if (ch === glints) continue;
        const d = ch.isMesh ? new THREE.Mesh(ch.geometry, mm(ch.material)) : new THREE.Group();
        d.frustumCulled = false; d.position.copy(ch.position); d.quaternion.copy(ch.quaternion);
        dst.add(d); mirrorPairs.push([ch, d]); copy(ch, d);
      }
    };
    copy(object, reflection);
    object.add(reflection);
    await ctx.yield();
  }

  // ---- motion: everything is a pure function of the metronome time T ----
  const AMP = 28 * Math.PI / 180;
  let T = 0, progress = -1;
  const stepE = (k) => Math.floor(k) + smoothstep(0, 0.14, k - Math.floor(k));            // one eased notch per tick
  const pulse = (k) => { const t = (k - Math.floor(k)) * 2; return smoothstep(0, 0.12, t) * (1 - smoothstep(0.12, 0.55, t)); };
  const beat = opts.beat || 2;                       // seconds per tick; the arm's cycle is two beats
  const angleAt = (t) => swingSign * AMP * Math.sin(Math.PI * 2 * (t - 43.8) / (2 * beat));
  const inv = U.uHeroInv.value, camL = new THREE.Vector3(), sunL = new THREE.Vector3(), H = new THREE.Vector3(), v = new THREE.Vector3();
  const bobC = new THREE.Vector3(), nm = new THREE.Matrix3(), size = new THREE.Vector2(), zAxis = new THREE.Vector3(0, 0, 1);
  const kq = new THREE.Quaternion(), yAxis = new THREE.Vector3(0, 1, 0);
  const aPos = glintGeo.attributes.aPos, aSize = glintGeo.attributes.aSize, aGain = glintGeo.attributes.aGain;
  const setGlint = (i, p, s, gain) => { for (let c = 0; c < 4; c++) { aPos.setXYZ(i * 4 + c, p.x, p.y, p.z); aSize.setX(i * 4 + c, s); aGain.setX(i * 4 + c, gain); } };
  const armPoint = (x, y, z, a, out) => out.set(x * Math.cos(a) + y * Math.sin(a), PIVOT_Y - x * Math.sin(a) + y * Math.cos(a), SWING_Z + z);
  const creepAt = () => (progress >= 0 ? 3 * clamp(progress, 0, 1) : 1.5 - 1.5 * Math.cos(T * 0.07));

  function update(dt, time, camera) {
    if (progress < 0) T = time;
    object.updateWorldMatrix(true, false);
    inv.copy(object.matrixWorld).invert();
    U.uT.value = T;
    const th = angleAt(T), k = (T - 43.8 - beat / 2) / beat, creep = creepAt();
    arm.rotation.z = -th;                                             // +th leans the tip toward +X
    bob.position.y = -35 + creep;
    nut.position.y = -40.45 + creep; nut.rotation.y = stepE(k) * Math.PI * 2 / 10;
    for (let i = 0; i < wheels.length; i++) {
      const w = wheels[i];
      wheelMeshes[i].rotation.z = w.escape ? -stepE(k) * Math.PI / w.teeth : T * w.speed + 0.012 * pulse(k) * Math.sign(w.speed);
    }
    key.quaternion.copy(keyQ).multiply(kq.setFromAxisAngle(yAxis, -stepE(k) * Math.PI * 2 / 12));
    for (const [a, b] of mirrorPairs) { b.position.copy(a.position); b.quaternion.copy(a.quaternion); }
    // glints
    if (!camera) return;
    const pm = camera.projectionMatrix.elements;
    if (ctx.renderer) { ctx.renderer.getDrawingBufferSize(size); U.uPx.value = 2 / Math.max(pm[5], 0.05) / Math.max(size.y, 1); }
    camL.setFromMatrixPosition(camera.matrixWorld).applyMatrix4(inv);
    sunL.copy(U.uSunDir.value).applyMatrix3(nm.setFromMatrix4(inv)).normalize();
    const sunward = th / AMP * (sunL.x >= 0 ? 1 : -1), g = smoothstep(0.82, 0.98, sunward), tick = pulse(k);
    armPoint(0, -35 + creep, 0, th, bobC);
    v.copy(camL).sub(bobC); const dist = Math.max(v.length(), 1); v.multiplyScalar(1 / dist);
    H.copy(v).add(sunL);
    const hl = Math.hypot(H.x, H.y), face = smoothstep(0.05, 0.3, Math.abs(v.z));
    if (hl > 1e-3) v.set(bobC.x + H.x / hl * 4.42, bobC.y + H.y / hl * 4.42, bobC.z + Math.sign(camL.z - bobC.z) * 0.3); else v.copy(bobC);
    setGlint(0, v, 2.4, (1.6 + 2.6 * g) * face);
    armPoint((sunL.x >= 0 ? 1 : -1) * wedgeTop * 0.5, wedgeY + 8, 0.8 * Math.sign(camL.z - SWING_Z), th, v);
    setGlint(1, v, 2.0, 3.2 * g);
    v.set(0, 3.0, 0).applyAxisAngle(yAxis, -stepE(k) * Math.PI * 2 / 12); v.x += 5.6; v.applyQuaternion(keyQ).add(key.position);
    setGlint(2, v, 1.8, 2.6 * tick);
    v.set(0, TOP_Y + (finial === 2 ? 5.4 : finial === 1 ? 2.2 : 2.9), 0).addScaledVector(sunL, 1.7);
    setGlint(3, v, 1.6, 1.3 + 0.3 * Math.sin(T * 0.7));
    armPoint(0.95 * Math.sign(sunL.x || 1), -40.45 + creep, 0.5, th, v);
    setGlint(4, v, 1.2, 1.8 * tick);
    aPos.needsUpdate = true; aSize.needsUpdate = true; aGain.needsUpdate = true;
  }
  update(0, 0, null);

  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const anchors = {
    portalSeat: { position: V3(0, 7.5, SWING_Z - 30), facing: V3(0, 0, 1), radius: 7 },
    flyThrough: [V3(0, 7.5, 260), V3(0, 7.5, 140), V3(0, 7.5, 60), V3(0, 7.5, SWING_Z), V3(0, 7.5, 8), V3(0, 7.5, SWING_Z - 30)],
    viewpoints: { long: V3(0, 7, 330), threshold: V3(0, 7.5, 60), moon: V3(0, 7.5, SWING_Z + 29) },
    pivot: V3(0, PIVOT_Y, SWING_Z), swingPlaneZ: SWING_Z, armTipRadius: 88, bobRest: V3(0, PIVOT_Y - 35, SWING_Z),
    key: key.position.clone(), wheels: wheels.map((w) => ({ position: V3(w.x, w.y, w.z), radius: w.r })), feet: stat.feet,
    roosts: [...stat.feet, key.position.clone().add(V3(0, 6, 0)), V3(-9, 30.6, SWING_Z - 3.4), V3(9, 30.6, SWING_Z - 3.4)],
    opening: { halfWidthBottom: 20, halfWidthTop: 5, bottom: BASE_Y, top: OPEN_TOP, frontZ: hwBody(BASE_Y) },
    reflectionHint: 'clone object with scale.y = -1 under the water; materials and uniforms are shared',
  };
  return {
    object, radius: 75, height: 146, center: V3(0, 64, 8), anchors, ground: true, groundY: 0, cabinet: cabName,
    update,
    setProgress(u) { progress = u; T = u * duration; },
    setTime(t) { T = t; progress = clamp(t / duration, 0, 1); },
    setLock(c) { U.uLock.value = clamp(c, 0, 1); },
    setSun(dir, colour) { U.uSunDir.value.copy(dir).normalize(); if (colour) U.uSunCol.value.set(colour); },
    setSky(zenith, horizon, slate) { U.uZen.value.set(zenith); U.uHor.value.set(horizon); if (slate) U.uSlate.value.set(slate); },
    setFogK(k) { U.uFogK.value = k; },
    armAngle: () => angleAt(T),
    bobCenter: (target = new THREE.Vector3()) => armPoint(0, -35 + creepAt(), 0, angleAt(T), target),
    uniforms: U, reflection,
    dispose() {},
  };
}
