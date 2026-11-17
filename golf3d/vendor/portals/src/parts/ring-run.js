// THE RING RUN: hero set piece. "The far shore": the edge of the ring sheet, dragged by a shepherd
// moon into a train of standing waves of ice rubble that curl over toward the gap like breakers,
// every stone streaming up the face and over the crest, plus the cratered moon and its streamer.
//
// LOCAL SPACE  origin = foot of the nearest (true size) wave, on the ring plane y = 0.
//   +Z = toward the gap (the camera arrives from +Z flying toward -Z), +X = down the wave train
//   (camera's right), +Y = ring north. The sheet's ragged edge is near z = +330; the nearest crest is
//   ~260 m high over z = -40..+60 with its lip overhanging the gap side; the flat sheet runs back to
//   z = -900 where it fades out (lay the world's own sheet under/behind it). Waves 2..7 stand to +X,
//   each ~0.76x the size of the last (false perspective: they read as receding for tens of km).
//   The moon rides the gap at z ~ +630, y ~ -78 and slides in X with setProgress(u).
//
// SIZE   radius ~460 (main wave; the train reaches x ~ +2600), height ~340. ground: false (space).
// COST   ~165k triangles, 7 draw calls (8 with the 'pair' moon), no lights, no textures, ~200 ms build.
// LIGHT  self-lit: every material is a ShaderMaterial with its own hard sun + planet-shine term (it
//   ignores scene lights, honours scene fog). Light directions are LOCAL: opts.sunDir (toward the sun,
//   default: left/abeam, 14 deg up, a little on the gap side) and opts.planetDir (toward the giant,
//   default: right and ahead). Keep the world's sun and giant in those directions, or pass yours.
//
// OPTS   palette (brief order: butterscotch, caramel, cream, frost, blue, black, mint), sunDir [x,y,z],
//        planetDir [x,y,z], sunElevation (deg, used when sunDir is absent), moon ('potato'|'walnut'|'pair'|false),
//        ring ('ice'|'rose'|'braid'), waves (3..7), density (0.3..1 stone count multiplier).
// ANCHORS (local space)
//   portalSeat  { position, normal, pitchDeg: 35, radius: 7 }: centre of the 14 m portal under the lip of
//               the nearest crest; normal points back down the approach (toward the arriving camera).
//   flyThrough  ordered points: level across the gap at y 40, onto the lower slope, then a dead-straight
//               35 degree climb of 300 m under the curl to the seat. Stones are culled within ~10 m of it (22 m for the last 150 m).
//               The lip ends in a hooked nose ~170 m up with boulders riding its outline (no hanging curtain): the approach passes ~100 m beneath it.
//   approachDir unit vector of the final climb (direction of travel).
//   gap         { nearZ, farZ, y }: z of the two shores of the gap. moonTrack { from, to }: moon centre at u 0 / 1.
//   crests      [{ x, height, scale }] per wave. viewpoints: gapReveal, underCurl, alongCrest, behind { position, target }.
//   sunDir, planetDir: the light directions actually used.
// HOOKS  setProgress(u): 0..1 slides the moon left to right along moonTrack (set from path u so it passes
//        under the prongs on cue). update(dt, time, camera) drives stone flow, tumbling, sparkle, streamer.
//        hero.moon is the moon Object3D; hero.uniforms the shared uniforms (uSun, uPlanet, ...). uniforms.uRise (0.03..1,
//        default 1) scales the waves' height: the world keeps the far shore lying flat until the camera is under the sheet.
import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

const DEFAULT_PALETTE = ['#E8B46A', '#B9762F', '#F7E6C2', '#E6F1FC', '#6FA6E0', '#04060C', '#6FF2E0'];
const NP = 40; // profile LUT points per layer

// ---- shared GLSL: the wave. layer 0 = upper sheet (flat -> back slope -> crest -> lip), 1 = front face ----
const WAVE_GLSL = /* glsl */`
uniform vec2 uProf[${NP * 2}];
uniform vec3 uWave[7];
uniform float uNW, uRise;
vec2 prof(float t, float layer){
  float f = clamp(t, 0., 1.) * ${NP - 1}.; float i = min(floor(f), ${NP - 2}.); float u = f - i;
  int b = int(layer + .5) * ${NP}; int i1 = int(i);
  vec2 p0 = uProf[b + max(i1 - 1, 0)], p1 = uProf[b + i1], p2 = uProf[b + i1 + 1], p3 = uProf[b + min(i1 + 2, ${NP - 1})];
  return .5 * ((2. * p1) + (-p0 + p2) * u + (2. * p0 - 5. * p1 + 4. * p2 - p3) * u * u + (-p0 + 3. * p1 - 3. * p2 + p3) * u * u * u);
}
// x -> (local scale, envelope 0..1)
vec2 env(float x){
  float E = 0., sw = 0., ww = 0.;
  for (int k = 0; k < 7; k++) {
    if (float(k) < uNW) {
      vec3 w = uWave[k]; float d = abs(x - w.x) / w.y;
      float dd = min(d, 1.); E = max(E, 1. - dd * dd);                              // scallops: peaked arcs meeting in cusps
      float q = 1. / (d * d * d * d + .02); sw += w.z * q; ww += q;
    }
  }
  E = max(E, .13 * step(uWave[0].x, x) * step(x, uWave[int(uNW + .5) - 1].x));       // the saddles between crests never pinch shut
  return vec2(sw / max(ww, 1e-4), E);
}
vec3 wavePos(float x, float t, float layer, out vec2 sE){
  sE = env(x); vec2 p = prof(t, layer);
  float w = sE.x * mix(.5, 1., sE.y);
  float z = p.x * mix(w, 1., 1. - smoothstep(-800., -480., p.x));
  return vec3(x, p.y * sE.x * mix(.07, 1., sE.y) * uRise, z);
}
`;

const NOISE_GLSL = /* glsl */`
float h21(vec2 p){ p = fract(p * vec2(234.34, 435.345)); p += dot(p, p + 34.23); return fract(p.x * p.y); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
float fbm(vec2 p){ float a = .5, s = 0.; for (int i = 0; i < 4; i++) { s += a * vn(p); p = p * 2.03 + 17.1; a *= .5; } return s / .9375; }
`;

// two-tone vacuum lighting shared by stones and moon (local-space vectors)
const STONE_FS = /* glsl */`
uniform vec3 uSun, uPlanet, uSunCol, uShineCol, uAmb, uCamL, uSeat, uBlue;
varying vec3 vN, vL, vCol; varying float vGl, vOcc;
#include <fog_pars_fragment>
void main(){
  vec3 N = normalize(vN + vec3(0., 1e-5, 0.)); vec3 V = normalize(uCamL - vL + vec3(0., 1e-5, 0.));
  float ndl = dot(N, uSun); float lit = smoothstep(-.02, .09, ndl) * (1. - .92 * vOcc);       // vOcc: in the hollow under the lip
  vec3 col = vCol * uSunCol * lit * (.5 + .5 * clamp(ndl, 0., 1.));
  float pl = smoothstep(-.15, .7, dot(N, uPlanet));
  col += vCol * uShineCol * pl * (1. - lit * .75) * (1. - .7 * vOcc) + vCol * uAmb + vCol * uBlue * .3 * vOcc;
  vec3 sv = vL - uSeat; col += vCol * vec3(.16, .89, .74) * .7 / (1. + dot(sv, sv) / 1600.);   // the portal's pool of mint light
  vec3 H = normalize(uSun + V + vec3(0., 1e-5, 0.));
  float g = max(dot(N, H), 0.); g = g * g; g = g * g; g = g * g; g = g * g; g = g * g; g = g * g;
  col += uSunCol * g * lit * vGl * 3.;
  float back = max(dot(-V, uSun), 0.); back *= back; back *= back;
  float rim = 1. - abs(dot(N, V)); rim = rim * rim * rim;
  col += uSunCol * rim * back * 1.6;
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;

const STONE_VS = /* glsl */`
attribute vec4 aA;   // x, t0, normal offset (m), flow rate (1/s)
attribute vec4 aB;   // radius (m), spin phase, layer, glint
attribute vec3 aAxis;
attribute vec3 color;
uniform float uTime, uPix, uH, uLipT; uniform vec3 uSeat, uDir, uCamL;
varying vec3 vN, vL, vCol; varying float vGl, vOcc;
#include <fog_pars_vertex>
${WAVE_GLSL}
void main(){
  float crest = step(1.5, aB.z); float layer = aB.z * (1. - crest); float span = layer < .5 ? 1.2 : 1.;   // crest class: boulders riding the lip only
  float t0 = crest * .56; float tt = t0 + fract(aA.y + uTime * aA.w) * (span - t0); float tc = min(tt, 1.);
  vec2 sE, sE2; vec3 c = wavePos(aA.x, tc, layer, sE); vec3 c2 = wavePos(aA.x, tc - .015, layer, sE2);
  vec3 tg = normalize(c - c2 + vec3(0., 0., 1e-4));
  float ls = sE.x; float le = ls * mix(.45, 1., sE.y);
  vOcc = layer > .5 ? smoothstep(.13, .34, c.y / max(uH * ls * mix(.07, 1., sE.y), 1.)) * smoothstep(.05, .3, sE.y)
    : smoothstep(.45, .55, tc) * (1. - smoothstep(.85, 1., tc)) * step(aA.z, 0.) * .85 * sE.y;   // stones hanging under the roof of the curl
  c += vec3(0., tg.z, -tg.y) * aA.z * le;
  float tau = max(tt - 1., 0.) / .2;                       // shed off the lip: slow ballistic arc
  c += (tg * 85. * tau + vec3(0., -175., 0.) * tau * tau * uRise) * le; c.x += aA.z * tau * 5. * ls;
  float s = aB.x * mix(ls, 1., .15);
  float dist = length(uCamL - c);
  s = max(s, dist * uPix * .85);
  s *= smoothstep(t0, t0 + .03, tt) * (1. - smoothstep(span - .07, span, tt));
  s *= 1. - crest * smoothstep(uLipT - .03, uLipT + .01, tt) * (1. - smoothstep(34., 74., abs(c.x)));   // none hang in the arch over the approach
  vec3 rel = c - uSeat; float h = clamp(dot(rel, -uDir), -30., 330.);   // keep the camera corridor clear
  float dc = length(rel + uDir * h); float cr = mix(22., 8., smoothstep(110., 190., h)); s *= smoothstep(cr, cr + 4., dc - aB.x);   // wider for the last 150 m
  float dl = length(vec3(c.x, max(abs(c.y - 40.) - 4., 0.), 0.)); s *= mix(1., smoothstep(8., 12., dl - aB.x), step(200., c.z));
  float ang = aB.y + uTime * (.25 + fract(aB.y * 7.31) * .7) * (aB.x > 7. ? .25 : 1.);
  vec3 ax = normalize(aAxis + vec3(1e-4, 0., 0.)); float ca = cos(ang), sa = sin(ang);
  vec3 p = position * ca + cross(ax, position) * sa + ax * dot(ax, position) * (1. - ca);
  vec3 n = normal * ca + cross(ax, normal) * sa + ax * dot(ax, normal) * (1. - ca);
  vL = c + p * s; vN = n; vGl = aB.w;
  float far = smoothstep(200., 1500., aA.x);
  vCol = color * mix(vec3(1.), vec3(.42, .5, .66), far);
  vec4 mvPosition = modelViewMatrix * vec4(vL, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const SHEET_VS = /* glsl */`
uniform vec3 uCamL;
varying vec3 vN, vL; varying vec3 vUv; varying vec2 vSE;
#include <fog_pars_vertex>
${WAVE_GLSL}
void main(){
  float x = position.x, t = position.y, layer = position.z;
  vec2 sE, s2; vec3 P = wavePos(x, t, layer, sE);
  vec3 Px = wavePos(x + 5., t, layer, s2) - wavePos(x - 5., t, layer, s2);
  vec3 Pt = wavePos(x, min(t + .008, 1.), layer, s2) - wavePos(x, max(t - .008, 0.), layer, s2);
  vN = normalize(cross(Pt, Px) + vec3(0., 1e-4, 0.));
  vL = P; vSE = sE; vUv = vec3(x, t, layer);
  vec4 mvPosition = modelViewMatrix * vec4(P, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const SHEET_FS = /* glsl */`
uniform vec3 uSun, uPlanet, uSunCol, uShineCol, uCamL, uFrost, uCream, uBlue, uSeat;
uniform float uTime, uBraid, uX0, uX1, uH, uRise, uLipT;
varying vec3 vN, vL; varying vec3 vUv; varying vec2 vSE;
#include <fog_pars_fragment>
${NOISE_GLSL}
float pebble(vec2 cq, float cov, float rs, out float lit){
  vec2 ci = floor(cq); float ch = h21(ci), c2 = h21(ci + 71.3), c3 = h21(ci + 13.7);
  float r = (.2 + .28 * c3) * rs;
  float d = length(fract(cq) - .5 + (vec2(c2, c3) - .5) * .5);
  lit = step(fract(c2 * 7.7), .64);
  return step(ch, cov) * (1. - smoothstep(r - .08 * rs, r, d));
}
void main(){
  float x = vUv.x, t = vUv.y, layer = vUv.z;
  float sc = max(vSE.x, .05);
  float arc = t * (layer < .5 ? 1150. : 560.);
  float flow = arc - uTime * 22.;
  vec2 q = vec2(x, flow); float fine = 1. - smoothstep(.3, .8, sc);
  vec2 fwq = fwidth(q); float px = max(fwq.x, fwq.y);
  // density: clumps streaked along the flow, with real voids between the strands
  float streak = mix(fbm(vec2(q.x * .05, q.y * .006)), fbm(vec2(q.x * .16, q.y * .02)), fine);
  float clump = mix(fbm(q * .023 + 7.3), fbm(q * .07 + 7.3), fine);
  vec2 qr = mat2(.8, -.6, .6, .8) * q;
  float m1 = fbm(qr * mix(.07, .2, fine) + 5.), m2 = vn(qr.yx * .33 + 9.);
  float rag = fbm(vec2(q.x * .03, q.y * .02 + 3.)) - .5;
  float dens = clamp(smoothstep(.2, .62, streak) * (.5 + 1.1 * clump), 0., 1.);
  float a = .08 + .92 * dens;
  float solid = 0.;
  if (layer > .5) {
    solid = smoothstep(.1, .2, t + rag * .1);                  // above its ragged foot the face is packed rubble: opaque
    a = max(a, .86 * solid);
    a *= smoothstep(.0, .09, t + rag * .16);
    float strands = smoothstep(.25, .5, abs(sin(t * 38. + rag * 4.)));
    a *= mix(1., strands, uBraid * (1. - smoothstep(.12, .3, t)));
  } else {
    a *= 1. - smoothstep(.93, 1., t + rag * .1);
    a = mix(a, max(a, .82), 1. - smoothstep(.1, .5, t));       // the undisturbed sheet behind is dense and calm
    a = max(a, .84 * smoothstep(.4, .48, t) * (1. - smoothstep(.9, .97, t + rag * .1)));   // the crest and lip are packed too
    a *= smoothstep(0., .05, t);
    // the hanging curtain of the lip is left open over the approach line: an arch with the portal's star in it
    a *= 1. - (1. - smoothstep(30., 64., abs(x) + rag * 36.)) * smoothstep(uLipT - .015, uLipT + .015, t);
  }
  a *= mix(1., .78, vSE.y * (1. - solid));
  a *= smoothstep(uX0, uX0 + 220., x) * (1. - smoothstep(uX1 - 120., uX1, x));
  float closeUp = 1. - smoothstep(.12, .3, px);                 // only where half-metre cells are resolved: no per-pixel speckle further off
  if (a + (m1 - .5) * .7 + (m2 - .5) * .2 < .2 + .08 * h21(floor(q * 2.) + 1.7) * closeUp) discard;   // ragged voids between the strands (anchored to the surface)
  // pebbles on a dim dust body: round grains when close, averaged coverage when far
  float near = 1. - smoothstep(.22, .9, px * .43);
  float litCell; float pm = pebble(q * .43, a, .6, litCell);
  float lit2; float pm2 = pebble(qr * .17 + 31.7, a * .5, 1., lit2);
  if (pm2 > pm) { pm = pm2; litCell = lit2; }
  float lit3; float pm3 = pebble(qr.yx * 1.3 + 11.3, a * .8, .8, lit3) * (1. - smoothstep(.2, .6, px * 1.3));
  if (pm3 > pm) { pm = pm3; litCell = lit3; }
  if (closeUp > .5 && pm < .5 && solid < .5 && t < .55 && h21(floor(q * 2.6) + 5.) > a * .6) discard;   // close up, the loose dust is a haze between the stones
  float pmix = mix(a * smoothstep(.38, .6, m1 * .6 + m2 * .4) * 1.15, pm, near);
  float grain = mix(mix(.36, .46, near), mix(1.2, mix(.75, 1.1, litCell), near), pmix) * (.85 + .3 * vn(q * .3));

  vec3 N = normalize(vN); vec3 V = normalize(uCamL - vL + vec3(0., 1e-5, 0.));
  float ndl = dot(N, uSun), ndv = dot(N, V);
  float sgn = ndv < 0. ? -1. : 1.;
  float same = smoothstep(-.05, .05, ndl * sgn);
  // comb: long thin shadows of the bergs, raked along the sun's ground track across the sheet behind the crests
  float comb = smoothstep(.5, .57, fbm(vec2(q.x * .0045 + 3.1, q.y * .1))) * (layer < .5 ? 1. - smoothstep(.5, .72, t) : 0.);
  vec3 refl = uFrost * uSunCol * (.26 + .74 * smoothstep(0., .55, abs(ndl))) * (.6 + .4 * dens) * grain;
  refl *= layer > .5 ? .4 + .75 * streak : 1.;                           // the face: flow streaks read as brightness
  refl *= mix(vec3(1.), uBlue * .3, comb);
  float fw = max(dot(-V, uSun), 0.); float fwd = fw * fw; fwd *= fwd * fw;
  float thin = 1. - dens; float roof = layer < .5 ? smoothstep(.5, .66, t) : 0.;
  // the vault of the curl: ribs of clumped rubble sliding over, deep blue at the back, glowing toward the thin lip
  float rib = smoothstep(.32, .62, fbm(vec2(q.x * .0035 + 11., q.y * .03)));
  float vault = roof * (.18 + .66 * smoothstep(.58, .97, t)) * (.3 + 1.1 * rib);
  vec3 trans = uSunCol * mix(uCream, uFrost, .25 + .3 * grain) * (.1 + 1.2 * fwd + .6 * vault * (.35 + .65 * thin)) * (1.35 - .9 * dens);
  trans *= mix(vec3(1.), uBlue * .7, comb * .8) * mix(1.05, .85, pmix);
  trans += uBlue * (.1 + .07 * grain);                                   // the shadow side is blue, never mud
  vec3 col = mix(trans, refl, same);
  float pfac = clamp(dot(N * sgn, uPlanet), 0., 1.);
  col += uShineCol * uFrost * (.14 + .42 * pfac) * (1.2 - .5 * grain) * mix(.45, 1., same);
  // the hollow under the lip: packed rubble in deep blue shadow, filled butterscotch only where it faces the giant
  float hr = vL.y / max(uH * sc * mix(.07, 1., vSE.y) * uRise, 1.);
  float occ = layer > .5 ? smoothstep(.13, .34, hr) * smoothstep(.05, .3, vSE.y) : 0.;
  float gs = mix(.8, grain, near * .7 + .3);                             // far off, the shadowed rubble is averaged: no orange speckle
  vec3 hollow = uBlue * .17 * (.4 + .8 * gs) * (.45 + 1.1 * streak) + uShineCol * uFrost * .5 * pfac * gs;
  col = mix(col, hollow, occ * .94);
  float lipK = layer < .5 ? smoothstep(.68, 1., t) * smoothstep(0., .5, vSE.y) : 0.;
  col += uSunCol * uFrost * 1.7 * lipK * lipK * lipK * (.45 + .55 * pmix);        // the fire-white lip
  vec3 sv = vL - uSeat; float d2 = dot(sv, sv);
  col += vec3(.16, .89, .74) * uFrost * (.5 + .6 * gs) * .6 / (1. + d2 / 1600.);   // the portal's pool of mint light
  col += uShineCol * uFrost * 3. * gs * smoothstep(0., .5, dot(normalize(sv + vec3(1e-4, 0., 0.)), uPlanet) + .25) * (1. - smoothstep(26., 70., sqrt(d2))) * step(.5, layer);   // butterscotch on the giant's side of the opening
  float gl = step(.9965, h21(floor(q * 1.3) + 3.)) * same * (1. - occ);     // frost glints
  vec3 H = normalize(uSun + V + vec3(0., 1e-5, 0.)); float sp = max(dot(N * sgn, H), 0.); sp *= sp; sp *= sp;
  col += uSunCol * gl * (1. + 5. * sp);
  float far = smoothstep(200., 1500., x);                      // the train recedes: dimmer and bluer down-range
  col = mix(col, uBlue * dot(col, vec3(.4)), far * .45) * mix(1., .4, far);
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;

const MOON_VS = /* glsl */`
attribute vec3 color;
uniform mat4 uToHero;
varying vec3 vN, vL, vCol; varying float vGl, vOcc;
#include <fog_pars_vertex>
void main(){
  vOcc = 0.; vL = (uToHero * vec4(position, 1.)).xyz; vN = mat3(uToHero) * normal; vCol = color; vGl = .12;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

// hail sparkle riding the crest and the shed arcs
const SPARK_VS = /* glsl */`
attribute vec4 aA; attribute vec4 aB;
uniform float uTime, uPix; uniform vec3 uCamL, uSeat, uDir;
varying float vI;
${WAVE_GLSL}
void main(){
  float tt = .5 + fract(aA.y + uTime * aA.w) * .7; float tc = min(tt, 1.);
  vec2 sE, sE2; vec3 c = wavePos(aA.x, tc, 0., sE); vec3 c2 = wavePos(aA.x, tc - .015, 0., sE2);
  vec3 tg = normalize(c - c2 + vec3(0., 0., 1e-4));
  float le = sE.x * mix(.45, 1., sE.y);
  c += vec3(0., tg.z, -tg.y) * aA.z * le;
  float tau = max(tt - 1., 0.) / .2;
  c += (tg * 85. * tau + vec3(0., -175., 0.) * tau * tau * uRise) * le; c.x += aA.z * tau * 3. * sE.x;
  vec3 rel = c - uSeat; float h = clamp(dot(rel, -uDir), -30., 330.); float dc = length(rel + uDir * h);
  float tw = .5 + .5 * sin(aB.y + uTime * (1.5 + aB.z * 4.)); tw *= tw; tw *= tw; tw *= tw;
  vI = (.2 + 2.2 * tw) * smoothstep(.5, .56, tt) * (1. - smoothstep(1.1, 1.2, tt)) * smoothstep(7., 10., dc) * mix(.35, 1., sE.y) * uRise * uRise;
  vec4 mv = modelViewMatrix * vec4(c, 1.);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = clamp(aB.x * le / max(-mv.z * uPix, 1e-4), 1.5, 3.5);
}`;
const SPARK_FS = /* glsl */`
uniform vec3 uSunCol; varying float vI;
void main(){ vec2 d = gl_PointCoord - .5; float r = 1. - smoothstep(.1, .5, length(d)); gl_FragColor = vec4(uSunCol * vI * r, 1.); }`;

// the moon's streamer of stolen ice: a thinning ribbon of motes drawn from the ring edge to the moon
const STREAM_VS = /* glsl */`
attribute vec4 aS;   // s0, lateral a, lateral b, size
uniform float uTime, uPix; uniform vec3 uMoonP, uEnd;
varying float vI;
void main(){
  float s = fract(aS.x + uTime * .03);
  vec3 a = uEnd, b = uMoonP + vec3(-70., 62., -30.), m = vec3(mix(a.x, b.x, .35), 46., mix(a.z, b.z, .6));
  vec3 c = mix(mix(a, m, s), mix(m, b, s), s);
  float wd = mix(34., 5., s);
  c += vec3(aS.y, aS.z * .35, aS.z) * wd + vec3(0., sin(s * 9. + aS.y * 5. + uTime * .3) * 5., 0.);
  float tw = .6 + .4 * sin(aS.y * 40. + uTime * 2.3);
  vI = smoothstep(0., .08, s) * (1. - smoothstep(.9, 1., s)) * tw * (.5 + .7 * s);
  vec4 mv = modelViewMatrix * vec4(c, 1.);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = clamp(aS.w / max(-mv.z * uPix, 1e-4), 1.5, 4.);
}`;
const STREAM_FS = /* glsl */`
uniform vec3 uSunCol, uFrost; varying float vI;
void main(){ vec2 d = gl_PointCoord - .5; float r = 1. - smoothstep(.05, .5, length(d)); gl_FragColor = vec4(uSunCol * uFrost * vI * r * .4, 1.); }`;

// ---------- CPU helpers ----------
function hash3(x, y, z) { const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return s - Math.floor(s); }

// a fractured, squashed ice block of unit radius with flat facets and per-face colour
function stoneGeometry(kind, rng, frost, blue, cream) {
  const g = kind === 0 ? new THREE.OctahedronGeometry(1, 0) : new THREE.IcosahedronGeometry(1, kind === 1 ? 0 : 1);
  const pos = g.attributes.position, v = new THREE.Vector3();
  const sq = [rng.range(1.1, 1.35), rng.range(0.55, 0.75), rng.range(0.8, 1.0)];
  const planes = [];
  for (let i = 0; i < (kind === 2 ? 5 : kind === 1 ? 2 : 0); i++) {
    planes.push({ n: new THREE.Vector3(rng.gauss(), rng.gauss(), rng.gauss()).normalize(), d: rng.range(0.45, 0.72) });
  }
  const ph = rng.range(0, 50);
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const k = [Math.round(v.x * 100), Math.round(v.y * 100), Math.round(v.z * 100)];
    const r = 0.72 + 0.5 * hash3(k[0] + ph, k[1], k[2]);
    v.multiplyScalar(r);
    for (const p of planes) { const o = v.dot(p.n) - p.d; if (o > 0) v.addScaledVector(p.n, -o * 0.92); }
    pos.setXYZ(i, v.x * sq[0], v.y * sq[1], v.z * sq[2]);
  }
  g.deleteAttribute('uv'); g.computeVertexNormals();
  const col = new Float32Array(pos.count * 3), c = new THREE.Color();
  for (let f = 0; f < pos.count / 3; f++) {
    const b = rng.range(0.5, 0.78), w = rng();
    c.copy(frost).lerp(w < 0.25 ? blue : cream, w < 0.25 ? 0.3 : rng.range(0, 0.25)).multiplyScalar(b);
    for (let j = 0; j < 3; j++) col.set([c.r, c.g, c.b], (f * 3 + j) * 3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
}

// cratered moon of unit-ish radius, smooth normals, vertex colours
async function moonGeometry(type, rng, noise, frost, caramel, pause) {
  let g = new THREE.IcosahedronGeometry(1, 13);
  await pause();
  g.deleteAttribute('uv'); g.deleteAttribute('normal'); g = mergeVertices(g, 1e-4);
  await pause();
  const pos = g.attributes.position, n = pos.count, v = new THREE.Vector3();
  const rad = type === 'walnut' ? [104, 86, 96] : [120, 80, 72];
  const craters = [];
  for (let i = 0; i < 16; i++) {
    craters.push({ d: new THREE.Vector3(rng.gauss(), rng.gauss(), rng.gauss()).normalize(), r: i < 3 ? rng.range(0.42, 0.6) : rng.range(0.12, 0.3), depth: rng.range(0.5, 1) });
  }
  const col = new Float32Array(n * 3), c = new THREE.Color(), dark = caramel.clone().multiplyScalar(0.4).lerp(frost, 0.25);
  const off = rng.range(0, 40);
  for (let i = 0; i < n; i++) {
    if ((i & 255) === 255) await pause();
    v.fromBufferAttribute(pos, i).normalize();
    let r = 1 + 0.2 * noise.fbm3(v.x * 1.2 + off, v.y * 1.2, v.z * 1.2, 4) + 0.035 * noise.fbm3(v.x * 6 + off, v.y * 6, v.z * 6, 3);
    let shade = 0.5 + 0.5 * noise.fbm3(v.x * 3 + 9 + off, v.y * 3, v.z * 3, 3), fresh = 0;
    if (type === 'walnut') { const e = Math.exp(-(v.y * v.y) / 0.012); r += 0.13 * e; fresh += e * 0.5; }
    for (const k of craters) {
      const d = Math.acos(Math.max(-1, Math.min(1, v.dot(k.d)))) / k.r;
      if (d < 1) { r -= k.r * 0.24 * k.depth * (1 - d * d); shade -= 0.3 * (1 - d); }
      else if (d < 1.35) { const e = 1 - (d - 1) / 0.35; r += k.r * 0.07 * k.depth * e * e; fresh += 0.5 * e * e; }
    }
    pos.setXYZ(i, v.x * r * rad[0], v.y * r * rad[1], v.z * r * rad[2]);
    c.copy(dark).lerp(frost, Math.max(0, Math.min(1, 0.25 + 0.4 * shade + fresh))).multiplyScalar(0.31);
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  await pause();
  g.computeVertexNormals();
  return g;
}

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('ring-run-hero') : ctx.rng;
  const noise = ctx.noise;
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE).map((h) => new THREE.Color(h));
  const [butter, caramel, cream, frostBase, blue] = pal;
  const detail = (ctx.quality && ctx.quality.detail) || 1;
  const density = Math.max(0.3, Math.min(1, opts.density ?? 1));

  // ---- per-seed variety ----
  const ringType = opts.ring || rng.pick(['ice', 'ice', 'rose', 'braid']);
  const moonType = opts.moon === false ? null : (opts.moon || rng.pick(['potato', 'potato', 'walnut', 'pair']));
  const nWaves = Math.max(3, Math.min(7, opts.waves ?? rng.int(6, 7)));
  const decay = rng.range(0.73, 0.79);
  const hk = rng.range(0.95, 1.06);        // crest height factor (x 262 m)
  const reach = rng.range(1.85, 2.2);      // how far the lip throws forward
  const frost = frostBase.clone();
  if (ringType === 'rose') frost.lerp(new THREE.Color('#c9a8a0'), 0.45);

  // ---- light (local space) ----
  const elev = THREE.MathUtils.degToRad(opts.sunElevation ?? 14);
  const sunDir = opts.sunDir ? new THREE.Vector3().fromArray(opts.sunDir).normalize()
    : new THREE.Vector3(-0.9 * Math.cos(elev), Math.sin(elev), 0.44 * Math.cos(elev)).normalize();
  const planetDir = opts.planetDir ? new THREE.Vector3().fromArray(opts.planetDir).normalize() : new THREE.Vector3(0.8, 0.16, -0.58).normalize();

  // ---- wave train: centre x, half length, scale ----
  const waves = [];
  { let c = 0, a = 350, s = 1;
    for (let k = 0; k < 7; k++) { waves.push(new THREE.Vector3(c, a, s * (k > 0 ? 0.8 : 1))); const a2 = a * decay; c += a + a2; a = a2; s *= decay; } }
  const lastW = waves[nWaves - 1];
  const X0 = -640, X1 = lastW.x + lastW.y + 80;
  const envJS = (x) => {
    let E = 0, sw = 0, ww = 0;
    for (let k = 0; k < nWaves; k++) {
      const w = waves[k], d = Math.abs(x - w.x) / w.y, e = Math.min(d, 1);
      E = Math.max(E, 1 - e * e); const q = 1 / (d * d * d * d + 0.02); sw += w.z * q; ww += q;
    }
    return [sw / ww, E];
  };

  // ---- cross-section profiles (z, y) of the true-size wave, sampled into a LUT ----
  const ctrlU = [[-900, 0], [-700, 0], [-560, 3], [-460, 16], [-360, 52], [-260, 112], [-170, 182], [-100, 236], [-40, 262], [10, 260], [48, 250], [78, 232], [96, 206], [100, 182], [92, 166]];   // the lip ends in a hooked nose high over the gap: from the far side you look up under it into the hollow
  const ctrlF = [[330, 0], [250, 8], [170, 28], [90, 62], [20, 105], [-40, 150], [-78, 196], [-86, 226], [-79, 250], [-69, 267]];   // the face runs up into the roof, so the hollow is closed
  const mk = (ctrl, isU) => new THREE.CatmullRomCurve3(ctrl.map(([z, y]) => new THREE.Vector3(isU && z > -40 ? -40 + (z + 40) * reach : z, y * hk, 0)), false, 'centripetal');
  const curU = mk(ctrlU, true), curF = mk(ctrlF, false);
  const prof = [], v3 = new THREE.Vector3();
  for (let l = 0; l < 2; l++) for (let i = 0; i < NP; i++) {
    const v = i / (NP - 1), u = l === 0 ? v + 0.2 * Math.sin(Math.PI * v) : v + 0.1 * Math.sin(Math.PI * v);
    (l === 0 ? curU : curF).getPointAt(Math.min(1, u), v3); prof.push(new THREE.Vector2(v3.x, v3.y));
  }

  // where the lip turns down into its hanging curtain (the curtain is left open over the approach, so the portal shows from the gap)
  const lipT = 2;   // the lip no longer hangs a curtain across the approach, so nothing needs cutting open (kept as a uniform: > 1 = off)

  // ---- anchors ----
  const pitch = THREE.MathUtils.degToRad(35);
  const approachDir = new THREE.Vector3(0, Math.sin(pitch), -Math.cos(pitch));
  const seat = new THREE.Vector3(0, 230 * hk, -30);
  const back = (s) => seat.clone().addScaledVector(approachDir, -s);
  const s300 = back(300);
  const flyThrough = [new THREE.Vector3(0, 40, 930), new THREE.Vector3(0, 40, 640), new THREE.Vector3(0, 40, s300.z + 210),
    new THREE.Vector3(0, (40 + s300.y) * 0.5 - 4, s300.z + 86), s300, back(150), seat.clone()];
  const moonFrom = new THREE.Vector3(-420, -78, 630), moonTo = new THREE.Vector3(520, -78, 630);

  // ---- shared uniforms ----
  const sunCol = frostBase.clone().multiplyScalar(2.0);
  const U = {
    uProf: { value: prof }, uWave: { value: waves }, uNW: { value: nWaves }, uRise: { value: 1 }, uLipT: { value: lipT },
    uTime: { value: 0 }, uPix: { value: 0.0015 }, uCamL: { value: new THREE.Vector3(0, 200, 1000) },
    uSun: { value: sunDir }, uPlanet: { value: planetDir },
    uSunCol: { value: sunCol }, uShineCol: { value: butter.clone().multiplyScalar(0.42) },
    uAmb: { value: blue.clone().multiplyScalar(0.025) },
    uFrost: { value: frost.clone().multiplyScalar(0.66) }, uCream: { value: cream.clone() }, uBlue: { value: blue.clone() },
    uSeat: { value: seat }, uDir: { value: approachDir },
    uBraid: { value: ringType === 'braid' ? 1 : 0 }, uH: { value: 262 * hk }, uX0: { value: X0 }, uX1: { value: X1 },
    uMoonP: { value: new THREE.Vector3() }, uEnd: { value: new THREE.Vector3() },
  };
  const fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
  const root = new THREE.Group(); root.name = 'ring-run-hero';

  // ---- the dust sheet: one grid over both layers ----
  {
    const xs = []; let x = X0;
    while (x < X1) { xs.push(x); const s = envJS(x)[0]; x += 20 * Math.max(0.3, Math.pow(s, 0.7)); }
    xs.push(X1);
    const rows = [36, 22], nx = xs.length, P = [], I = [];
    let base = 0;
    for (let l = 0; l < 2; l++) {
      for (let j = 0; j < rows[l]; j++) for (let i = 0; i < nx; i++) P.push(xs[i], j / (rows[l] - 1), l);
      for (let j = 0; j < rows[l] - 1; j++) for (let i = 0; i < nx - 1; i++) {
        const a = base + j * nx + i, b = a + 1, c = a + nx, d = c + 1; I.push(a, c, b, b, c, d);
      }
      base += rows[l] * nx;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setIndex(I);
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(900, 100, -200), 2400);
    const m = new THREE.ShaderMaterial({ uniforms: Object.assign(fogU(), U), vertexShader: SHEET_VS, fragmentShader: SHEET_FS, side: THREE.DoubleSide, fog: true });
    const sheet = new THREE.Mesh(g, m); sheet.frustumCulled = false; sheet.name = 'sheet'; root.add(sheet);
  }
  await ctx.yield?.();

  // ---- stones: three instanced classes riding the wave function ----
  await ctx.yield?.();
  const stoneMat = new THREE.ShaderMaterial({ uniforms: Object.assign(fogU(), U), vertexShader: STONE_VS, fragmentShader: STONE_FS, fog: true });
  const wsum = waves.slice(0, nWaves).reduce((s, w) => s + Math.pow(w.y, 0.75), 0);
  const pickX = (nearOnly) => {
    if (!nearOnly && rng() < 0.07) return rng.range(-620, -350);
    let r = rng() * (nearOnly ? Math.pow(waves[0].y, 0.75) + Math.pow(waves[1].y, 0.75) : wsum), k = 0;
    while (k < nWaves - 1 && r > Math.pow(waves[k].y, 0.75)) { r -= Math.pow(waves[k].y, 0.75); k++; }
    return waves[k].x + waves[k].y * rng.range(-1, 1);
  };
  const classes = [
    { kind: 0, n: Math.round(3900 * density * detail), nc: 0, rmin: 0.45, rmax: 1.7, alpha: 2.2, thick: 6 },
    { kind: 1, n: Math.round(2600 * density * Math.max(0.8, detail)), nc: Math.round(1100 * Math.max(0.7, density)), rmin: 1.5, rmax: 5.5, alpha: 2.0, thick: 5 },
    { kind: 2, n: Math.round(220 * Math.max(0.6, density)), nc: Math.round(300 * Math.max(0.7, density)), rmin: 8, rmax: 20, alpha: 2.2, thick: 2.5 },
  ];
  const crng = rng.fork ? rng.fork('crest') : rng;   // crest boulders: a ragged outline of stones riding the lip of every wave
  for (const cl of classes) {
    const base = stoneGeometry(cl.kind, rng, frost, blue, cream);
    const g = new THREE.InstancedBufferGeometry();
    g.setAttribute('position', base.attributes.position); g.setAttribute('normal', base.attributes.normal); g.setAttribute('color', base.attributes.color);
    const nt = cl.n + cl.nc;
    const A = new Float32Array(nt * 4), B = new Float32Array(nt * 4), AX = new Float32Array(nt * 3);
    for (let i = cl.n; i < nt; i++) {
      if ((i & 511) === 511) await ctx.yield?.();
      const wk = crng() < 0.45 ? 0 : Math.min(nWaves - 1, Math.floor(crng() * crng() * nWaves)), w = waves[wk];
      A[i * 4] = w.x + w.y * (crng() + crng() - 1) * 0.96;
      A[i * 4 + 1] = crng(); A[i * 4 + 2] = 0.5 + Math.abs(crng.gauss()) * 3.5; A[i * 4 + 3] = (1 / 26) * crng.range(0.8, 1.25);
      B[i * 4] = cl.kind === 2 ? crng.range(6, 12.5) : Math.min(7, 2.6 * Math.pow(1 - crng() * 0.97, -1 / 2.2));
      B[i * 4 + 1] = crng.range(0, 6.283); B[i * 4 + 2] = 2; B[i * 4 + 3] = crng() < 0.5 ? crng.range(0.6, 1.6) : 0.1;
      AX[i * 3] = crng.gauss(); AX[i * 3 + 1] = crng.gauss(); AX[i * 3 + 2] = crng.gauss();
    }
    for (let i = 0; i < cl.n; i++) {
      if ((i & 1023) === 1023) await ctx.yield?.();
      const big = cl.kind === 2, layer = rng() < (big ? 0.5 : 0.56) ? 0 : 1;
      A[i * 4] = pickX(big);
      A[i * 4 + 1] = big ? (layer === 0 ? rng.range(0.04, 0.52) : rng.range(0.03, 0.5)) : rng();
      A[i * 4 + 2] = rng.gauss() * cl.thick;
      A[i * 4 + 3] = big ? rng.range(0.0008, 0.002) : (1 / 46) * rng.range(0.8, 1.25);
      B[i * 4] = Math.min(cl.rmax, cl.rmin * Math.pow(1 - rng() * 0.985, -1 / cl.alpha));
      B[i * 4 + 1] = rng.range(0, 6.283); B[i * 4 + 2] = layer; B[i * 4 + 3] = rng() < 0.35 ? rng.range(0.6, 1.6) : 0.1;
      AX[i * 3] = rng.gauss(); AX[i * 3 + 1] = rng.gauss(); AX[i * 3 + 2] = rng.gauss();
    }
    g.setAttribute('aA', new THREE.InstancedBufferAttribute(A, 4));
    g.setAttribute('aB', new THREE.InstancedBufferAttribute(B, 4));
    g.setAttribute('aAxis', new THREE.InstancedBufferAttribute(AX, 3));
    g.instanceCount = nt;
    const mesh = new THREE.Mesh(g, stoneMat); mesh.frustumCulled = false; mesh.name = 'stones' + cl.kind; mesh.userData.full = nt; root.add(mesh);
    await ctx.yield?.();
  }

  // ---- hail sparkle on the crest ----
  const addMat = (vs, fs) => new THREE.ShaderMaterial({ uniforms: U, vertexShader: vs, fragmentShader: fs, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
  {
    const n = Math.round(3600 * detail), A = new Float32Array(n * 4), B = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) {
      A[i * 4] = pickX(rng() < 0.6); A[i * 4 + 1] = rng(); A[i * 4 + 2] = rng.gauss() * 9; A[i * 4 + 3] = (1 / 32) * rng.range(0.7, 1.3);
      B[i * 4] = rng.range(0.6, 1.6); B[i * 4 + 1] = rng.range(0, 6.283); B[i * 4 + 2] = rng(); B[i * 4 + 3] = 0;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    g.setAttribute('aA', new THREE.BufferAttribute(A, 4)); g.setAttribute('aB', new THREE.BufferAttribute(B, 4));
    const pts = new THREE.Points(g, addMat(SPARK_VS, SPARK_FS)); pts.frustumCulled = false; pts.name = 'sparkle'; root.add(pts);
  }

  await ctx.yield?.();

  // ---- the shepherd moon and its streamer ----
  const moon = new THREE.Group(); moon.name = 'moon'; root.add(moon);
  const moonBodies = [];
  if (moonType) {
    const g = await moonGeometry(moonType, rng, noise, frostBase, caramel, async () => { await ctx.yield?.(); });
    const count = moonType === 'pair' ? 2 : 1;
    for (let i = 0; i < count; i++) {
      const body = new THREE.Mesh(g, new THREE.ShaderMaterial({
        uniforms: Object.assign(fogU(), U, { uToHero: { value: new THREE.Matrix4() } }), vertexShader: MOON_VS, fragmentShader: STONE_FS, fog: true }));
      body.userData.spin = rng.range(0.03, 0.06) * rng.sign(); body.userData.tilt = rng.range(-0.4, 0.4);
      if (count === 2) body.scale.setScalar(i === 0 ? 0.62 : 0.5);
      body.frustumCulled = false; moon.add(body); moonBodies.push(body);
    }
    await ctx.yield?.();
    const n = 900, S = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) { S[i * 4] = rng(); S[i * 4 + 1] = rng.gauss() * 0.4; S[i * 4 + 2] = rng.gauss() * 0.4; S[i * 4 + 3] = rng.range(1.5, 5); }
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    sg.setAttribute('aS', new THREE.BufferAttribute(S, 4));
    const st = new THREE.Points(sg, addMat(STREAM_VS, STREAM_FS)); st.frustumCulled = false; st.name = 'streamer'; root.add(st);
  }

  // ---- runtime ----
  let progress = 0.38;
  const size = new THREE.Vector2(), camL = new THREE.Vector3();
  const placeMoon = (time) => {
    moon.position.lerpVectors(moonFrom, moonTo, progress);
    moonBodies.forEach((b, i) => {
      if (moonBodies.length === 2) { const a = time * 0.12 + i * Math.PI; b.position.set(Math.cos(a) * 82, Math.sin(a * 0.5) * 10, Math.sin(a) * 46); }
      b.rotation.set(b.userData.tilt, time * b.userData.spin + i * 2, b.userData.tilt * 0.5);
      b.updateMatrix(); moon.updateMatrix();
      b.material.uniforms.uToHero.value.multiplyMatrices(moon.matrix, b.matrix);
    });
    U.uMoonP.value.copy(moon.position);
    U.uEnd.value.set(moon.position.x - 340, 5, 336);
  };
  placeMoon(0);

  const crests = waves.slice(0, nWaves).map((w) => ({ x: w.x, height: 262 * hk * w.z, scale: w.z }));
  const vp = (p, t) => ({ position: new THREE.Vector3(...p), target: new THREE.Vector3(...t) });
  return {
    object: root, radius: 460, height: 340, center: new THREE.Vector3(40, 120, -30),
    ground: false, groundY: 0, moon, uniforms: U,
    anchors: {
      portalSeat: { position: seat.clone(), normal: approachDir.clone().negate(), facing: approachDir.clone().negate(), pitchDeg: 35, radius: 7 },
      flyThrough, approachDir: approachDir.clone(),
      gap: { nearZ: 930, farZ: 330, y: 0 }, moonTrack: { from: moonFrom.clone(), to: moonTo.clone() },
      crests, sunDir: sunDir.clone(), planetDir: planetDir.clone(),
      viewpoints: {
        gapReveal: vp([0, 40, 930], [160, 110, 0]), underCurl: vp([0, 120, 128], [0, 230 * hk, -30]),
        alongCrest: vp([-470, 215, 150], [200, 190, -10]), behind: vp([-250, 150, -820], [100, 150, 0]),
      },
    },
    setProgress(u) { progress = Math.max(0, Math.min(1, u)); },
    update(dt, time, camera) {
      U.uTime.value = time;
      if (camera) {
        root.updateWorldMatrix(true, false);
        U.uCamL.value.copy(root.worldToLocal(camL.setFromMatrixPosition(camera.matrixWorld)));
        let h = 1080; if (ctx.renderer && ctx.renderer.getDrawingBufferSize) h = ctx.renderer.getDrawingBufferSize(size).y || 1080;
        U.uPix.value = 2 / (Math.max(0.1, camera.projectionMatrix.elements[5]) * h);
      }
      placeMoon(time);
    },
    dispose() {},
  };
}
