// THE TURNING HERD - Kola fell tundra in March: three thousand reindeer turn as one slow galaxy on a frozen lake.
// The camera leaves a corniced fell crest, dives down the lee slope past forty stragglers trotting down the trails from
// the col, slants low over the north-eastern arms and joins the herd at the rim of the eye; then (round 5, a deliberate
// change of route) it climbs a left-hand spiral over the western arms to 36 m with the whole turning figure below, the
// eye and the erratic beyond the near rings and the far bank behind them, comes down into the south-western arms, runs
// east along the outer edge at 2.2 m beside a file of antlered young animals against the low sun, and slides inward to
// the quiet centre, where calves lie round a frost-split erratic. Every animal keeps one place on its ring (or its
// trail) for the whole flight; the hero deals levels of detail by distance, each frame. The way out is lit by the sun
// alone: on the erratic's faces and in the steam that hangs before the cleft. The covey flies a formation given in the
// path's own frame; the raven leaves the erratic when the lens is 34 m from the gate and passes over its left shoulder.
// Everything is lit by uniforms in the hero's own recipe (no three.js lights): cream snow, saturated blue shade.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { makeSky } from '../kit/sky.js';
import { Geo } from '../kit/fauna.js';
import { rockGeometry } from '../kit/terrain.js';
import { buildHero, GROUND_GLSL } from '../parts/reindeer-cyclone.js';

const TAU = Math.PI * 2;
const PALETTE = ['#FBE7DA', '#F4B8A6', '#5B7DB6', '#A9CBE2', '#FFC46A', '#4B3B32', '#E9E0CF'];
const LAKE_Y = -0.3, LAKE_C = -430, LAKE_A = 656, LAKE_B = 600;

// same noise as the hero's snow shader, so that the terrain and the hero's snow disc are the same picture where they meet
const NOISE_GLSL = /* glsl */`
float hash3(vec3 p){ p = fract(p * .3183099 + .1); p *= 17.; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float hash2(vec2 p){ vec3 q = fract(vec3(p.xyx) * .1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float vnoise(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3. - 2. * f);
  return mix(mix(mix(hash3(i), hash3(i + vec3(1, 0, 0)), f.x), mix(hash3(i + vec3(0, 1, 0)), hash3(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(hash3(i + vec3(0, 0, 1)), hash3(i + vec3(1, 0, 1)), f.x), mix(hash3(i + vec3(0, 1, 1)), hash3(i + vec3(1, 1, 1)), f.x), f.y), f.z); }
float vnoise2(vec2 x){ vec2 i = floor(x), f = fract(x); f = f * f * (3. - 2. * f);
  return mix(mix(hash2(i), hash2(i + vec2(1, 0)), f.x), mix(hash2(i + vec2(0, 1)), hash2(i + vec2(1, 1)), f.x), f.y); }
float fbm2(vec2 p){ return vnoise2(p) * .5 + vnoise2(p * 2.03 + 11.) * .25 + vnoise2(p * 4.01 + 5.) * .125 + vnoise2(p * 8.1) * .0625; }
`;

// ---------------------------------------------------------------- land: the lake basin, the corniced fell, far fells
function makeHeight(noise) {
  return (x, z) => {
    const ex = (x - LAKE_C) / LAKE_A, ez = z / LAKE_B, q = Math.hypot(ex, ez) + 1e-6;
    const east = smoothstep(0.55, 0.9, ex / q);
    let d = (q - 1) * LAKE_B + (1 - east) * 40 * noise.n2(x * 0.003 + 9, z * 0.003);
    if (d <= 0) return LAKE_Y;
    // rolling tundra round the shore, bigger fells far out
    const roll = 0.5 + 0.5 * noise.fbm2(x * 0.0016 + 3, z * 0.0016 - 7, 3);
    const low = smoothstep(0, 260, d) * (8 + 34 * roll) + smoothstep(500, 2600, d) * (30 + 110 * roll * roll);
    // the fell shoulder: concave lee slope steepening to a cornice lip, a scoured plateau behind
    const dc = 90 + 7 * noise.n2(z * 0.011, 4.2), t = d / dc, s = Math.min(1, t);
    const gully = 1 - 0.16 * (0.5 + 0.5 * noise.n2(z * 0.045, 1.7)) * Math.sin(Math.PI * s);
    let fell = 41 * Math.pow(s, 2.1) * gully + 1.3 * Math.exp(-((t - 1.04) * (t - 1.04)) / 0.004);
    if (t > 1) fell += smoothstep(1, 5, t) * (5 * noise.n2(x * 0.012, z * 0.012) + 0.02 * (d - dc)) + 0.5 * noise.n2(x * 0.06, z * 0.06);
    // a col in the crest on the entry axis: from the entry point, and in the portal before it, the whole spiral shows over the lip
    fell -= 9 * Math.exp(-((z + 26) * (z + 26)) / 100) * smoothstep(0.5, 1.0, t) * (1 - smoothstep(1.25, 1.75, t));
    return LAKE_Y + lerp(low, fell, east);
  };
}

function tensorAxis(a, b, step, lo, hi, grow) {
  const v = [];
  for (let x = a; x <= b + 1e-6; x += step) v.push(x);
  let s = step, x = a; while (x > lo) { s *= grow; x -= s; v.unshift(x); }
  s = step; x = v[v.length - 1]; while (x < hi) { s *= grow; x += s; v.push(x); }
  return v;
}

const LAND_VERT = /* glsl */`
#include <common>
#include <fog_pars_vertex>
varying vec3 vP, vN;
void main(){ vec4 wp = modelMatrix * vec4(position, 1.); vP = wp.xyz; vN = normal; vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const LAND_FRAG = /* glsl */`
#include <common>
#include <fog_pars_fragment>
${NOISE_GLSL}
${GROUND_GLSL}
uniform vec3 uSunDir, uGold, uSnow, uWarm, uShade, uHeath, uLichen, uRock, uTree;
uniform float uTime, uGlint, uDrift, uWet, uRockAmt;
varying vec3 vP, vN;
void main(){
  vec2 q = vP.xz; float dist = distance(cameraPosition, vP);
  vec3 V = (cameraPosition - vP) / max(dist, 1e-3), N = normalize(vN + vec3(0., 1e-5, 0.));
  float land = smoothstep(.3, 3., vP.y) * (1. - uRockAmt), farK = smoothstep(1500., 500., dist);
  // broad soft drifts, then sastrugi with their short shadows and the trails down from the col: identical to the hero's snow outside the herd
  vec2 sq = q * vec2(.07, .13); float e = .3;
  float h0 = fbm2(sq), hx = fbm2(sq + vec2(e * .07, 0.)), hz = fbm2(sq + vec2(0., e * .13));
  float lowSun = clamp(uSunDir.y * 3.4, .35, 1.), tanEl = uSunDir.y / max(length(uSunDir.xz), .05);
  vec2 sunXZ = normalize(uSunDir.xz + vec2(1e-5, 0.));
  vec2 g = vec2(hx - h0, hz - h0) / e * .75 * lowSun * farK * (1. - uRockAmt);
  float fwq = length(fwidth(q)) * .7, gK = (1. - uRockAmt) * (1. - smoothstep(3., 6., fwq)) * smoothstep(.55, .8, N.y), gSh = 0., gTr = 0.;
  if(gK > .001){
    vec3 gr = groundRelief(q, sunXZ, tanEl, fwq, smoothstep(70., 12., dist));
    g += gr.xy * gK * (.55 + .45 * lowSun); gSh = gr.z * gK;
    gTr = clamp(-trailH(q, fwq) * 9., 0., 1.) * gK;
  }
  vec3 n = normalize(N + vec3(-g.x, 0., -g.y) * N.y);
  float ndl = dot(n, uSunDir), kk = clamp(ndl / max(uSunDir.y, .07), 0., 2.2);
  vec3 alb = mix(uSnow, uWarm, .55 * smoothstep(1.15, 2.1, kk));
  alb *= 1. - uWet * .12;
  float flow = vnoise2(q * vec2(.03, .24) + vec2(-uTime * 1.1, uTime * .05));
  alb *= 1. + .1 * smoothstep(.55, .9, flow) * farK;
  alb = mix(alb, uShade * 1.8, gTr * .42);
  vec3 lit = alb * (.30 + .44 * pow(max(kk, 1e-3), .7)), shade = uShade;
  // scoured ground on the fell: crowberry heath, reindeer lichen, frost-heaved stones
  float pn = .5 + .25 * sin(q.x * .11 + 1.3 * sin(q.y * .07)) + .25 * sin(q.y * .13 + 1.7 * sin(q.x * .05) + 2.), fine = vnoise2(q * 1.7 + 40.);   // = patchAt() below
  float bare = land * smoothstep(.6 - .12 * uWet, .7 - .12 * uWet, pn + (fine - .5) * .16 + .1 * smoothstep(26., 40., vP.y)) * smoothstep(.72, .92, N.y) * smoothstep(1400., 500., dist);
  float tuSh = 0.;
  if(bare > .001){
    // tussocks of crowberry and lichen standing out of the snow, each with its short blue shadow; snow lies between them
    vec3 soil = mix(uHeath, uLichen, .25 + .55 * smoothstep(.35, .7, fine)) * (.7 + .5 * vnoise2(q * 5.));
    float tk = 1. - smoothstep(.5, 1.5, fwq), tn = (1. - smoothstep(.2, .55, fwq)) * smoothstep(60., 20., dist);
    vec2 tu = tussock(q, sunXZ, 2.3, .25 + .7 * bare);
    if(tn > .001) tu = max(tu, tussock(q + 17., sunXZ, .9, .2 + .5 * bare) * tn);
    float tuft = mix(.3, tu.x, tk) * smoothstep(.02, .3, bare);
    tuSh = tu.y * tk * smoothstep(.02, .3, bare) * (1. - tuft);
    lit = mix(lit, soil * uSnow * 1.15 * (.25 + .75 * kk), tuft * .92); shade = mix(uShade, uShade * soil * 2.5, tuft * .8);
    bare = tuft;
  }
  vec3 c = mix(shade, lit, smoothstep(0., .5, kk) * (1. - gSh * .9) * (1. - tuSh * .9));
  // the taiga's floor: dark crowns seen from above, snow between them
  vec2 eq = vec2((q.x - (${LAKE_C}.)) / ${LAKE_A}., q.y / ${LAKE_B}.); float qe = length(eq), an = atan(eq.y, abs(eq.x) < 1e-4 ? 1e-4 : eq.x) / 3.14159;
  float forest = smoothstep(1.02, 1.05, qe) * smoothstep(1.5, 1.36, qe) * smoothstep(.07, .13, an) * smoothstep(.985, .93, an) * (1. - uRockAmt);
  if(forest > .001){ float cr = vnoise2(q * .16) * .6 + vnoise2(q * .45 + 9.) * .4; c = mix(c, uTree * (.5 + 1.2 * cr), forest * smoothstep(.3, .5, cr) * .9); }
  // bare rock on the steep faces of the far massif
  if(uRockAmt > 0.){
    float rk = uRockAmt * smoothstep(.83, .6, N.y + (fbm2(q * .012) - .5) * .35);
    vec3 rc = uRock * (.55 + .7 * fbm2(q * .02 + vP.y * .03));
    c = mix(c, rc * uSnow * 1.1 * (.22 + .95 * max(dot(N, uSunDir), 0.)) + uShade * .3, rk);
  }
  vec2 gi = floor(q * 27.); float gh = hash2(gi);
  float gl = step(.985, gh) * pow(max(sin(gh * 911. + dot(V.xz, vec2(31., 23.)) + V.y * 47.), 0.), 24.) * smoothstep(34., 5., dist) * (1. - bare);
  c += uGold * gl * uGlint * smoothstep(0., .5, kk);
  if(uDrift > 0.){ float dn = vnoise2(q * vec2(.05, .33) + vec2(-uTime * 2.4, uTime * .2)); c = mix(c, uSnow * .78, uDrift * (.35 + .5 * dn) * (1. - uRockAmt)); }
  gl_FragColor = vec4(c, 1.);
  #include <fog_fragment>
}`;

// ---------------------------------------------------------------- props: rock, wood, fur, feathers
// vertex colour = albedo; aAnim = (ribbon side direction xyz, sway weight); instancing and instance colour honoured
const PROP_VERT = /* glsl */`
#include <common>
#include <fog_pars_vertex>
attribute vec4 aAnim;
uniform float uTime, uThin, uSway;
varying vec3 vP, vN, vL, vColor;
void main(){
  mat4 m = modelMatrix;
  #ifdef USE_INSTANCING
    m = modelMatrix * instanceMatrix;
  #endif
  vec3 col = color;
  #ifdef USE_INSTANCING_COLOR
    col *= instanceColor;
  #endif
  vec4 wp = m * vec4(position, 1.);
  vec3 wn = normalize(mat3(m) * normal + vec3(0., 1e-5, 0.));
  float sw = aAnim.w * uSway;
  wp.x += sw * (.5 + .5 * sin(uTime * 1.7 + wp.z * .3 + wp.x * .2)) + sw * .35 * sin(uTime * 6.3 + wp.x * 2.1 + wp.z * 1.3);
  wp.z += sw * .3 * sin(uTime * 2.3 + wp.x * .4);
  vec3 sd = mat3(m) * aAnim.xyz; float sl = length(sd);
  if(sl > 1e-5) wp.xyz += sd / sl * max(0., distance(cameraPosition, wp.xyz) * uThin - sl);
  vP = wp.xyz; vN = wn; vL = position; vColor = col;
  vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const PROP_FRAG = /* glsl */`
#include <common>
#include <fog_pars_fragment>
${NOISE_GLSL}
uniform vec3 uSunDir, uSunCol, uSkyCol, uBounce, uSnow, uShade, uLichen;
uniform float uCap, uHoar, uGrain, uTwoSide, uAllSnow;
varying vec3 vP, vN, vL, vColor;
void main(){
  vec3 N = normalize(vN + vec3(0., 1e-5, 0.)), V = normalize(cameraPosition - vP + vec3(0., 1e-4, 0.));
  if(uTwoSide > .5 && dot(N, V) < 0.) N = -N;
  vec3 alb = vColor; float sn = 0.;
  if(uGrain > 0.){
    float big = vnoise(vP * .6), fine = vnoise(vP * 7.) * .6 + vnoise(vP * 23.) * .4;
    alb *= (.7 + .55 * big) * (.78 + .45 * fine);
    float joint = smoothstep(.07, 0., abs(vnoise(vP * vec3(.9, .4, .9) + 9.) - .5)) + .7 * smoothstep(.05, 0., abs(vnoise(vP * vec3(.5, 1.7, .5) + 4.) - .5));
    alb *= 1. - .5 * min(joint, 1.) * uGrain;
    alb = mix(alb, uLichen, uGrain * .7 * smoothstep(.56, .7, vnoise(vP * 1.9 + 20.)) * smoothstep(.3, .6, fine));
    alb = mix(alb, vec3(.03), uGrain * .3 * smoothstep(.66, .78, vnoise(vP * 2.4 + 50.)));
  }
  if(uCap > 0.) sn = uCap * smoothstep(.36, .62, N.y + (vnoise(vP * 1.3) - .5) * .5);
  if(uHoar > 0.) sn = max(sn, uHoar * smoothstep(.1, .8, -N.x * .8 + N.y * .5 + (vnoise(vP * 3.1 + 70.) - .5) * .7));
  sn = max(sn, uAllSnow);
  float ndl = dot(N, uSunDir), dif = max(ndl, 0.) * .8 + .2 * max(ndl * .5 + .5, 0.);
  vec3 c = alb * (mix(uBounce * 1.2, uSkyCol, N.y * .5 + .5) + uSunCol * dif * .55);
  float kk = clamp(ndl / max(uSunDir.y, .07), 0., 2.2);
  c = mix(c, mix(uShade, uSnow * (.30 + .44 * pow(max(kk, 1e-3), .7)), smoothstep(0., .5, kk)), sn);
  float fr = pow(1. - max(dot(N, V), 0.), 3.);
  c += (uSkyCol * .25 + uSunCol * (.15 + alb) * .5 * smoothstep(-.1, .9, dot(-V, uSunDir))) * fr * .5;
  gl_FragColor = vec4(c, 1.);
  #include <fog_fragment>
}`;

// soft blue shadow strokes laid on the ground (multiplied): vUv.x along the stroke, vUv.y across
const SHADE_VERT = /* glsl */`
#include <common>
#include <fog_pars_vertex>
attribute vec3 aUv; varying vec3 vUv;
void main(){ vUv = aUv; vec4 mvPosition = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const SHADE_FRAG = /* glsl */`
#include <common>
#include <fog_pars_fragment>
${NOISE_GLSL}
uniform vec3 uShTint; uniform float uShStr;
varying vec3 vUv;
void main(){
  float x = vUv.x, y = abs(vUv.y), k;
  if(vUv.z > .5){      // a bare tree: trunk, then a net of branches thinning out
    float trunk = smoothstep(.16, .06, y) * smoothstep(.5, .2, x);
    float net = smoothstep(.42, .62, vnoise2(vec2(x * 9., vUv.y * 5.) + vUv.z * 17.)) * smoothstep(.12, .4, x) * smoothstep(1., .55, y);
    k = max(trunk, net * .7) * smoothstep(1., .8, x);
  } else k = smoothstep(1., .35, y + .25 * x) * smoothstep(1., .6, x) * smoothstep(0., .04, x);
  #ifdef USE_FOG
    float fogK = 1. - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
  #else
    float fogK = 0.;
  #endif
  k *= uShStr * (1. - fogK);
  gl_FragColor = vec4(mix(vec3(1.), uShTint, k), 1.);
}`;

// ---------------------------------------------------------------- air: diamond dust / snowfall (points), spindrift (streaks)
const DUST_VERT = /* glsl */`
attribute vec4 aSeed;
uniform vec3 uBox, uVel, uSunDir, uColA, uGold; uniform float uTime, uBufH, uSize, uGlintK;
varying vec4 vCol;
void main(){
  float s = aSeed.w;
  vec3 p = aSeed.xyz * uBox + uVel * uTime * (.7 + .6 * s) + vec3(sin(uTime * .7 + s * 40.), .3 * sin(uTime * .9 + s * 17.), cos(uTime * .5 + s * 31.)) * .7;
  p = mod(p - cameraPosition, uBox) - .5 * uBox + cameraPosition;
  vec3 rel = p - cameraPosition; float dist = length(rel); vec3 vd = rel / max(dist, 1e-3);
  float gl = pow(max(sin(s * 311. + uTime * (2. + 3. * fract(s * 7.)) + dot(vd, vec3(9., 5., 7.)) * 3.), 0.), 10.);
  float fs = pow(max(dot(vd, uSunDir), 0.), 4.);
  float px = uSize * (.6 + .8 * fract(s * 13.)) * projectionMatrix[1][1] * uBufH * .5 / max(dist, .5), pc = clamp(px, 1.6, 12.);
  float a = min(1., (px * px) / (pc * pc)) * smoothstep(.7, 2.6, dist) * smoothstep(.5, .36, dist / uBox.x);
  vCol = vec4((uColA + uGold * fs * 1.6) * mix(1., .12 + 2.6 * gl, uGlintK), a);
  gl_PointSize = pc;
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.);
}`;
const DUST_FRAG = /* glsl */`
uniform float uOpaque; varying vec4 vCol;
void main(){
  float d = length(gl_PointCoord - .5) * 2., a = smoothstep(1., 0., d); a *= a * vCol.a;
  if(a < .003) discard;
  gl_FragColor = vec4(vCol.rgb * a, a * uOpaque);
}`;
// iA = (anchor xyz, seed), iB = (type 0 wrapped lake streak | 1 streamer from a fixed anchor, half length, half height, travel)
const DRIFT_VERT = /* glsl */`
#include <common>
#include <fog_pars_vertex>
attribute vec4 iA, iB;
uniform vec3 uBox, uSunDir, uLit, uShadeC, uGold; uniform float uTime, uAlpha;
varying vec2 vUv; varying vec4 vCol; varying float vSeed;
void main(){
  float seed = iA.w, a, sx = iB.y, sy = iB.z; vec3 pos, ax = vec3(1., 0., 0.);
  if(iB.x < .5){
    vec2 w = iA.xz * uBox.xz + vec2(uTime * (5. + 4. * seed), sin(uTime * .21 + seed * 30.) * 4.);
    vec2 rel = mod(w - cameraPosition.xz, uBox.xz) - .5 * uBox.xz, ed = abs(rel) / (.5 * uBox.xz);
    pos = vec3(cameraPosition.x + rel.x, iA.y, cameraPosition.z + rel.y);
    a = smoothstep(1., .7, max(ed.x, ed.y)) * (.55 + .45 * sin(uTime * .6 + seed * 50.));
  } else {
    float D = iB.w, f = fract(uTime * (7. + D * .05) / D + seed);
    if(D > 200.) ax = vec3(.287, 0., -.958);        // the massif's pennant is seen end-on from the lake: it trails across the view
    pos = iA.xyz + ax * (D * f) + vec3(0., D * .1 * f * f, 0.) + cross(ax, vec3(0., 1., 0.)) * (sin(seed * 40. + f * 5.) * D * .04);
    a = smoothstep(0., .15, f) * smoothstep(1., .35, f) * 1.7; sx *= .5 + f; sy *= .4 + 1.3 * f;
  }
  vec3 toC = cameraPosition - pos; float dist = length(toC); toC /= max(dist, 1e-3);
  vec3 up = cross(toC, ax); up = up / max(length(up), 1e-3); if(up.y < 0.) up = -up;
  a *= smoothstep(sy * 1.5 + .5, sy * 5. + 2., dist);
  float fs = pow(max(dot(-toC, uSunDir), 0.), 5.);
  vCol = vec4(mix(uShadeC, uLit, .45 + .55 * seed) + uGold * fs * .9, a * uAlpha);
  vUv = position.xy; vSeed = seed * 61.;
  vec3 wp = pos + ax * position.x * sx + up * position.y * sy;
  vec4 mvPosition = viewMatrix * vec4(wp, 1.); gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const DRIFT_FRAG = /* glsl */`
#include <common>
#include <fog_pars_fragment>
${NOISE_GLSL}
uniform float uTime;
varying vec2 vUv; varying vec4 vCol; varying float vSeed;
void main(){
  float n = vnoise2(vUv * vec2(2.6, 1.3) + vec2(vSeed - uTime * .5, vSeed)) * .65 + vnoise2(vUv * vec2(7., 3.) + vec2(-uTime * .9, vSeed)) * .35;
  float a = vCol.a * smoothstep(1., .25, abs(vUv.y) + (n - .5) * .5) * smoothstep(1., .45, abs(vUv.x)) * smoothstep(.2, .75, n);
  if(a < .003) discard;
  gl_FragColor = vec4(vCol.rgb * (.85 + .3 * n), a);
  #include <fog_fragment>
}`;
// the taiga: flats of spruce and pine drawn in the fragment shader, dark against the low sun
const TAIGA_VERT = /* glsl */`
#include <common>
#include <fog_pars_vertex>
attribute vec3 aUv; varying vec3 vUv;
void main(){ vUv = aUv; vec4 mvPosition = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const TAIGA_FRAG = /* glsl */`
#include <common>
#include <fog_pars_fragment>
${NOISE_GLSL}
uniform vec3 uTree, uSnowC, uRimC;
varying vec3 vUv;
float tree(float u, float y, float k, out float tip){
  float id = floor(u), f = fract(u) - .5, h = .5 + .5 * hash2(vec2(id, k)), v = y / h;
  tip = v; return step(abs(f), (1. - v) * (.44 + .1 * sin(v * 34. + id))) * step(v, 1.);
}
void main(){
  float t1, t2, a = tree(vUv.x, vUv.y, vUv.z, t1), b = tree(vUv.x * 1.37 + .5, vUv.y * 1.25, vUv.z + 9., t2);
  float inside = max(max(a, b), step(vUv.y, .16));
  if(inside < .5) discard;
  float tip = a > .5 ? t1 : t2, dust = smoothstep(.45, .75, vnoise2(vec2(vUv.x * 3.1, vUv.y * 9.) + vUv.z));
  vec3 c = uTree * (.6 + .8 * tip) ;
  c = mix(c, uSnowC, dust * .5 * smoothstep(.1, .6, tip));
  c += uRimC * smoothstep(.75, 1., tip) * .35;
  gl_FragColor = vec4(c, 1.);
  #include <fog_fragment>
}`;

// willow ptarmigan: snow-white where the sky and the low sun reach (the back, the crown), blue-grey in their own shade (the
// flank turned to us, the belly), a bright rim against the sun; the bill, the eye and the tail corners stay black
const PTAR_FRAG = /* glsl */`
#include <common>
#include <fog_pars_fragment>
uniform vec3 uSunDir, uSunCol, uWhite, uUnder; uniform float uWing;
varying vec3 vP, vN, vL, vColor;
void main(){
  vec3 N = normalize(vN + vec3(0., 1e-5, 0.)), V = normalize(cameraPosition - vP + vec3(0., 1e-4, 0.));
  if(dot(N, V) < 0.) N = -N;
  // white where the low sun or the open sky reaches; the flank turned from the sun, the belly and the underside of a wing are
  // slate. A wing is thin: the sun shines through it, so it is lit from either side (uWing = 1).
  float ndl = dot(N, uSunDir), lit = clamp(.62 * smoothstep(-.5, .75, mix(ndl, abs(ndl), uWing)) + .4 * smoothstep(-.35, .8, N.y), 0., 1.);
  vec3 c = mix(uUnder, uWhite, lit) * vColor;
  c += uSunCol * .22 * pow(1. - max(dot(N, V), 0.), 3.) * smoothstep(-.2, .6, dot(-V, uSunDir)) * smoothstep(.1, .4, vColor.g);
  gl_FragColor = vec4(c, 1.);
  #include <fog_fragment>
}`;
// ---------------------------------------------------------------- geometry builders
const col = (h) => new THREE.Color(h);
// a crooked mountain birch, bare, its twigs furred with hoar (ribbons that keep a minimum width on screen)
function birchGeometry(rng) {
  const g = new Geo(), bark = col('#3a2c28'), barkPale = col('#8d8078'), hoarA = col('#d9d2cc'), hoarB = col('#b9c4d6');
  const limb = (p, d, len, r, depth) => {
    const pts = [p.slice()], q = p.slice(), dd = d.slice();
    for (let i = 0; i < 3; i++) {
      dd[0] += rng.range(-0.35, 0.35); dd[2] += rng.range(-0.35, 0.35); dd[1] += depth ? rng.range(-0.1, 0.25) : 0.15;
      const l = Math.hypot(dd[0], dd[1], dd[2]); dd[0] /= l; dd[1] /= l; dd[2] /= l;
      q[0] += dd[0] * len / 3; q[1] += dd[1] * len / 3; q[2] += dd[2] * len / 3; pts.push(q.slice());
    }
    const rr = [r, r * 0.86, r * 0.72, r * 0.6];
    const t = g.tube(pts, rr, depth ? 3 : 5, depth ? bark : barkPale, bark);
    g.anim(t, (x, y) => [0, 0, 0, 0.012 * y * depth]);
    if (depth < 2) { const n = depth ? 2 : 3; for (let i = 0; i < n; i++) { const a = rng() * TAU, up = rng.range(0.25, 0.8); limb(pts[2 + (i & 1)], [Math.cos(a), up, Math.sin(a)], len * rng.range(0.55, 0.75), r * 0.55, depth + 1); } }
    else for (let i = 0; i < 5; i++) {
      const a = rng() * TAU, e = pts[1 + (i % 3)], L = rng.range(0.4, 0.75), tx = Math.cos(a), tz = Math.sin(a), ty = rng.range(-0.25, 0.5);
      const m = [e[0] + tx * L * 0.5, e[1] + ty * L * 0.5 + 0.05, e[2] + tz * L * 0.5], f = [e[0] + tx * L, e[1] + ty * L - 0.05, e[2] + tz * L], hw = 0.014, sxv = -tz * hw, szv = tx * hw;
      const s = g.strip([e, m, f].map((v) => [v[0] + sxv, v[1], v[2] + szv]), [e, m, f].map((v) => [v[0] - sxv, v[1], v[2] - szv]), hoarA, hoarB);
      g.anim(s, (x, y, z, k) => [((k - s[0]) & 1 ? -1 : 1) * sxv, 0, ((k - s[0]) & 1 ? -1 : 1) * szv, 0.03 * y]);
    }
  };
  limb([0, -0.15, 0], [rng.range(-0.3, 0.3), 1, rng.range(-0.3, 0.3)], 1.5, 0.085, 0);
  return g.build();
}
// dwarf birch: a spray of wiry red-brown twigs, rimed white along one edge
function twigGeometry(rng) {
  const g = new Geo(), wood = col('#4a211b'), rime = col('#cfc6c4');
  const twig = (p, a, lean, L) => {
    const tx = Math.cos(a) * lean, tz = Math.sin(a) * lean, hw = 0.006, sxv = -Math.sin(a) * hw, szv = Math.cos(a) * hw;
    const m = [p[0] + tx * L * 0.5, p[1] + L * 0.55, p[2] + tz * L * 0.5], e = [p[0] + tx * L * 1.25, p[1] + L, p[2] + tz * L * 1.25], P = [p, m, e];
    const s = g.strip(P.map((v) => [v[0] + sxv, v[1], v[2] + szv]), P.map((v) => [v[0] - sxv, v[1], v[2] - szv]), wood, rime);
    g.anim(s, (x, y, z, k) => [((k - s[0]) & 1 ? -1 : 1) * sxv, 0, ((k - s[0]) & 1 ? -1 : 1) * szv, 0.06 * y]);
    return m;
  };
  for (let i = 0; i < 6; i++) { const a = rng() * TAU, m = twig([rng.range(-0.05, 0.05), -0.02, rng.range(-0.05, 0.05)], a, rng.range(0.2, 0.7), rng.range(0.24, 0.42)); if (i < 4) twig(m, a + rng.range(-1.2, 1.2), rng.range(0.4, 0.9), rng.range(0.12, 0.2)); }
  return g.build();
}
// wolverine parts in the animal's own frame (+Z forward, metres): body with tail, head, one leg (pivot at the hip)
function wolverineParts() {
  const dark = col('#1c1310'), mid = col('#3a2a20'), pale = col('#a08462'), nose = col('#0a0808');
  const b = new Geo();
  const body = b.loft([[-0.4, 0.36, 0, 0], [-0.34, 0.37, 0.13, 0.13], [-0.14, 0.4, 0.17, 0.17], [0.1, 0.4, 0.165, 0.16], [0.3, 0.38, 0.14, 0.14], [0.42, 0.37, 0.1, 0.11], [0.48, 0.37, 0, 0]].map(([z, y, rx, ry]) => ({ z, y, rx, ry })), { sides: 8, top: dark, belly: mid });
  b.paint(body, (x, y, z, c) => { c.lerp(pale, 0.8 * smoothstep(0.09, 0.14, Math.abs(x)) * smoothstep(0.47, 0.4, y) * smoothstep(0.3, 0.38, y) * smoothstep(-0.38, -0.1, z)); });
  b.tube([[0, 0.4, -0.36], [0, 0.4, -0.52], [0, 0.32, -0.68], [0, 0.22, -0.76]], [0.07, 0.1, 0.085, 0], 6, dark, mid);
  const h = new Geo();
  const head = h.loft([[-0.06, 0, 0, 0], [0, 0, 0.1, 0.095], [0.1, -0.005, 0.085, 0.08], [0.19, -0.02, 0.05, 0.045], [0.235, -0.025, 0, 0]].map(([z, y, rx, ry]) => ({ z, y, rx, ry })), { sides: 8, top: dark, belly: mid });
  h.paint(head, (x, y, z, c) => { c.lerp(pale, 0.7 * smoothstep(0.03, 0.07, y) * smoothstep(0.12, 0.02, z)); if (z > 0.2) c.copy(nose); });
  for (const sx of [-1, 1]) h.fan([[sx * 0.06, 0.07, 0.0], [sx * 0.115, 0.12, -0.02], [sx * 0.1, 0.05, -0.03]], dark, mid);
  const l = new Geo();
  l.tube([[0, 0, 0], [0, -0.14, 0.01], [0, -0.27, -0.01], [0, -0.33, 0.04]], [0.06, 0.045, 0.04, 0.045], 5, dark, nose);
  return { body: b.build(), head: h.build(), leg: l.build() };
}
// one bird in two parts: body with tail (corners painted dark for the ptarmigan), and a right wing hinged on the Z axis
function birdParts() {
  const w = new THREE.Color(1, 1, 1), k = new THREE.Color(0.06, 0.06, 0.07), b = new Geo(), g = new Geo();
  b.loft([[-0.3, 0.0, 0, 0], [-0.2, 0.0, 0.07, 0.065], [0, -0.01, 0.1, 0.095], [0.16, 0.01, 0.075, 0.07], [0.25, 0.03, 0.05, 0.05], [0.31, 0.03, 0.03, 0.03], [0.4, 0.02, 0, 0]].map(([z, y, rx, ry]) => ({ z, y, rx, ry })), { sides: 6, top: w, belly: w });
  for (const sx of [-1, 1]) b.fan([[0, 0.0, -0.22], [sx * 0.035, 0.0, -0.5], [sx * 0.13, 0.0, -0.44]], w, k);
  b.fan([[0, 0.0, -0.22], [-0.035, 0.0, -0.5], [0.035, 0.0, -0.5]], w, w);
  const lead = [[0.03, 0, 0.14], [0.22, 0.02, 0.15], [0.42, 0.02, 0.1], [0.6, 0, 0.0]], trail = [[0.03, 0, -0.14], [0.22, 0, -0.15], [0.42, 0, -0.14], [0.66, 0, -0.1]];
  g.strip(lead, trail, w, w);
  return { body: b.build(), wing: g.build() };
}
// willow ptarmigan in winter: a plump white body with a small head and a dark bill and eye, a short tail whose outer
// feathers are black, a short round wing (right wing, hinged on the Z axis), and the blur of that wing's beat: the
// space the wing sweeps (two sector faces and the outer shell), drawn half transparent, densest at the shoulder
function ptarmiganParts() {
  const w = new THREE.Color(1, 1, 1), sh = new THREE.Color(0.6, 0.66, 0.82), k = new THREE.Color(0.03, 0.03, 0.035), b = new Geo();
  const body = b.loft([[-0.2, 0.0, 0, 0], [-0.18, 0.0, 0.088, 0.078], [-0.115, -0.003, 0.118, 0.106], [-0.04, -0.006, 0.134, 0.124], [0.05, -0.004, 0.132, 0.124], [0.125, 0.014, 0.106, 0.102], [0.178, 0.046, 0.066, 0.066], [0.208, 0.068, 0.052, 0.052], [0.238, 0.08, 0.06, 0.057], [0.264, 0.078, 0.044, 0.042], [0.28, 0.072, 0.017, 0.017], [0.302, 0.066, 0, 0]].map(([z, y, rx, ry]) => ({ z, y, rx, ry })), { sides: 8, top: w, belly: sh, shade: [-0.5, 0.35] });
  b.paint(body, (x, y, z, c) => { if (z > 0.272) c.copy(k); if (z > 0.225 && z < 0.26 && Math.abs(x) > 0.03 && y > 0.08) c.copy(k); });
  b.fan([[0, 0.014, -0.13], [-0.05, 0.004, -0.27], [-0.026, 0.0, -0.3], [0, -0.002, -0.306], [0.026, 0.0, -0.3], [0.05, 0.004, -0.27]], w, w);                                    // white central tail coverts
  for (const sx of [-1, 1]) {      // outer tail feathers: white, black only at the outer corner (a third of the tail's width)
    const f = b.fan([[sx * 0.02, 0.012, -0.15], [sx * 0.04, 0.006, -0.325], [sx * 0.088, 0.004, -0.31], [sx * 0.128, 0.0, -0.272], [sx * 0.148, -0.004, -0.222], [sx * 0.132, 0.0, -0.17]], w, w);
    b.paint(f, (x, y, z, c) => { if (Math.abs(x) > 0.08 && z < -0.25) c.copy(k); });
  }
  // the wing itself: a short round blade with a blunt fingered tip, opaque and crisp: white along the leading edge, shading
  // to pale slate along the trailing edge so that its outline holds against snow
  const wg = new Geo(), edge = new THREE.Color(0.7, 0.78, 0.96);
  const lead = [[0.03, 0, 0.11], [0.11, 0.03, 0.142], [0.2, 0.046, 0.136], [0.29, 0.04, 0.1], [0.365, 0.02, 0.042], [0.415, -0.006, -0.032]], trail = [[0.03, 0, -0.125], [0.11, 0.018, -0.158], [0.2, 0.03, -0.165], [0.29, 0.024, -0.15], [0.36, 0.008, -0.118], [0.405, -0.01, -0.075]];
  wg.strip(lead, trail, w, edge);
  const wing = wg.build();
  // the blur: two sector faces (ahead of and behind the shoulder); aA = (0 at the shoulder .. 1 at the rim, 0 .. 1 across the sweep)
  const P = [], A = [], I = [], NS = 8, a0 = -0.62, a1 = 0.82, RR = [0.03, 0.19, 0.36];
  for (const z of [0.1, -0.12]) {
    const n0 = P.length / 3;
    for (let k = 0; k < 3; k++) for (let i = 0; i <= NS; i++) { const f = i / NS, an = lerp(a0, a1, f); P.push(Math.cos(an) * RR[k], Math.sin(an) * RR[k], z); A.push(k / 2, f); }
    for (let k = 0; k < 2; k++) for (let i = 0; i < NS; i++) { const q = n0 + k * (NS + 1) + i; I.push(q, q + NS + 1, q + 1, q + 1, q + NS + 1, q + NS + 2); }
  }
  const blur = new THREE.BufferGeometry(); blur.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); blur.setAttribute('aA', new THREE.Float32BufferAttribute(A, 2)); blur.setIndex(I);
  return { body: b.build(), wing, blur };
}
const patchAt = (x, z) => 0.5 + 0.25 * Math.sin(x * 0.11 + 1.3 * Math.sin(z * 0.07)) + 0.25 * Math.sin(z * 0.13 + 1.7 * Math.sin(x * 0.05) + 2);

// what each seeded look does to sky, haze, air and light. No look is flat white: each has its own low sun or twilight.
//   noon      polar noon, the sun nine degrees up: pale cream-pink snow (peach only on the drift faces that face the sun), blue-violet shadows six times as long as the animals,
//             a deep blue zenith over a peach horizon, the cloud bank and the massif lit pink from below
//   lastSun   the sun seven degrees up and red: rose snow, violet shadows, a purple sky
//   moon      blue dusk under a full moon, silver breath, an auroral arc in the north
//   overcast  pearl twilight: a veiled sun low in an apricot band, mauve snow, fine snowfall, the herd a dark graphic
//   blizzard  a ground blizzard under the low gold sun: spindrift knee deep, glowing where the view runs toward the sun
// light = what is handed to hero.setLight (colours of lit snow, sun-facing drift faces, shade, key, fill, glow), el = sun elevation
const LOOKS = {
  noon: { sky: { preset: 'day', zenith: '#1a489e', mid: '#5c92d8', horizon: '#f6c0a2', horizonPow: 4.6, midPow: 1.3, scatterColor: '#ff9a5c', scatter: 0.62, scatterPow: 6, sunColor: '#ffd29a', sunSize: 1.5, sunIntensity: 9, sunGlow: 0.85,
      clouds: false, cloudLit: '#ffd8c6', cloudShade: '#7c84bc', clouds2: { coverage: 0.44, opacity: 0.55, stretch: 1, lit: '#ffd6c0', shade: '#93a4d6' } },
    el: 0.157, light: { snow: '#f9d3c1', warm: '#ffb488', shade: '#4f60b2', sunColor: '#ffbe7c', sunIntensity: 2.3, sky: '#86a4e4', gold: '#ffae5e', hazeK: 0.065 },
    fog: '#c4abb8', density: 0.00024, exposure: 1.07, dust: ['#b89c98', 0.04, 1, 0, [0.7, -0.06, 0.15]], drift: 0.34, tint: '#fff9f5', sat: 1.06, portal: '#ffd9a0', towers: 1, veil: '#a898b8' },
  lastSun: { sky: { preset: 'sunset', zenith: '#27397f', mid: '#7c6cb4', horizon: '#f4a084', horizonPow: 3.6, scatterColor: '#ff8646', scatter: 0.9, sunColor: '#ffa468', sunSize: 1.7, sunIntensity: 10, sunGlow: 0.9, stars: 0,
      clouds: false, cloudLit: '#ffb48c', cloudShade: '#5f4f8c', clouds2: { coverage: 0.5, opacity: 0.62, stretch: 1, lit: '#ffb090', shade: '#7c5c90' } },
    el: 0.122, light: { hazeK: 0.05 },
    fog: '#a78bad', density: 0.00024, exposure: 1.05, dust: ['#a88890', 0.04, 1, 0, [0.7, -0.06, 0.15]], drift: 0.34, tint: '#fff2ee', sat: 1.02, portal: '#ffc890', towers: 1, veil: '#9a7fa6' },
  moon: { sky: { preset: 'night', zenith: '#040a1e', mid: '#0c1d44', horizon: '#1f3a6c', stars: 0.9, milkyWay: 0.22, aurora: 0.6, auroraAzimuth: 0, auroraSpread: 0.75, clouds: false, clouds2: false, bake: true },
    light: { hazeK: 0.035 },
    fog: '#15254a', density: 0.00022, exposure: 1.3, dust: ['#7f97c8', 0.034, 1, 0, [0.5, -0.05, 0.1]], drift: 0.28, tint: '#eef2ff', sat: 1.05, portal: '#bfe0ff', towers: 0, veil: '#22335c' },
  overcast: { sky: { preset: 'overcast', scatterColor: '#ffbc94', scatter: 0.85, horizon: '#c9aeb0' },
    light: { hazeK: 0.04 },
    fog: '#aba6b6', density: 0.0007, exposure: 1, dust: ['#aab0b8', 0.085, 0, 1, [2.2, -1.5, 0.4]], drift: 0.26, tint: '#fff4f0', sat: 1.18, portal: '#ffd9a0', towers: 0, veil: '#8f98a6' },
  blizzard: { sky: { preset: 'day', zenith: '#2a5aa4', mid: '#869fcc', horizon: '#f2c29a', horizonPow: 3.4, midPow: 1.15, scatterColor: '#ffb070', scatter: 0.9, scatterPow: 4.5, sunColor: '#ffd9a8', sunSize: 1.5, sunIntensity: 9, sunGlow: 0.95,
      clouds: false, clouds2: { coverage: 0.36, opacity: 0.4, stretch: 1, lit: '#ffd9c0', shade: '#a4b0d4' } },
    el: 0.157, light: { snow: '#f8d4c0', warm: '#ffb88c', shade: '#5868b0', sunColor: '#ffc488', sunIntensity: 2.1, sky: '#8ea6e0', gold: '#ffb468', hazeK: 0.15, hazeH: 0.75 },
    fog: '#ccb6b2', density: 0.0005, exposure: 0.98, dust: ['#b8a6a2', 0.055, 0, 1, [10, -0.5, 1.2]], drift: 0.5, tint: '#fff6f0', sat: 1.08, portal: '#ffd9a0', towers: 0, veil: '#aab4c4' },
};
// snow showers trailing from the cloud bank on the horizon: tall soft curtains, streaked, leaning with the wind
const VEIL_VERT = /* glsl */`
#include <common>
#include <fog_pars_vertex>
attribute vec3 aUv; varying vec3 vUv;
void main(){ vUv = aUv; vec4 mvPosition = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const VEIL_FRAG = /* glsl */`
#include <common>
#include <fog_pars_fragment>
${NOISE_GLSL}
uniform vec3 uCol; uniform float uTime, uAlpha;
varying vec3 vUv;
void main(){
  float x = vUv.x, y = vUv.y, lean = x * 7. + y * 1.6 + vUv.z * 13.;
  float st = vnoise2(vec2(lean, y * .7 - uTime * .02)) * .6 + vnoise2(vec2(lean * 2.7 + 5., y * 1.3 - uTime * .035)) * .4;
  float a = smoothstep(0., .22, x) * smoothstep(1., .78, x) * smoothstep(0., .12, y) * pow(max(y, 0.), .45) * smoothstep(1.02, .8, y) * (.3 + .7 * smoothstep(.3, .75, st));
  gl_FragColor = vec4(uCol * (.9 + .25 * st), a * uAlpha);
  #include <fog_fragment>
}`;

// The cumulus bank on the horizon: each mass is one upright card facing the lake, a heap of round lobes (large in the
// middle, smaller to the sides) broken by slow noise; lit from the sun's side as a heap of spheres, the base lost in haze.
// aUv = (0..1 across, 0..1 up, seed); aSun = the sun in the card's own frame (right, up, toward the lake)
const CLOUD_VERT = /* glsl */`
attribute vec3 aUv, aSun; varying vec3 vUv, vSun;
void main(){ vUv = aUv; vSun = aSun; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`;
const CLOUD_FRAG = /* glsl */`
${NOISE_GLSL}
uniform vec3 uLit, uShade, uHaze, uRim; uniform float uTime;
varying vec3 vUv, vSun;
void main(){
  vec2 p = vec2((vUv.x - .5) * 2., vUv.y); float seed = vUv.z;
  float acc = 0.; vec2 nrm = vec2(0.);
  for(int i = 0; i < 7; i++){
    float fi = float(i), h1 = hash2(vec2(fi + 1.3, seed)), h2 = hash2(vec2(seed + 7.1, fi));
    float cx = (fi / 6. - .5) * 1.15 + (h1 - .5) * .18, k = 1. - abs(cx) * .75;
    float r = (.12 + .26 * h2) * (.5 + .65 * k), cy = r * .45 + .3 * k * h1;
    vec2 q = (p - vec2(cx, cy)) / r; float di = max(1. - length(q), -3.);
    float w = exp(7. * di); acc += w; nrm += w * q;      // a smooth union: the lobes run into one another without creases
  }
  float d = log(acc) / 7.; nrm /= acc;
  float n = fbm2(p * vec2(3.1, 3.7) + seed * 9. + vec2(uTime * .004, 0.)), n2 = vnoise2(p * 9. + seed * 3. + vec2(uTime * .007, 0.));
  d += (n - .5) * .5 + (n2 - .5) * .1;
  float rimE = smoothstep(.5, .06, d);
  float a = smoothstep(0., .24, d) * smoothstep(0., .08, p.y) * smoothstep(1., .9, abs(p.x)) * smoothstep(1., .93, p.y);
  if(a < .004) discard;
  vec3 N = normalize(vec3(nrm, sqrt(max(1. - dot(nrm, nrm), 0.)) + .35) + vec3(n - .5, n2 - .5, 0.) * .8);
  vec3 S = normalize(vSun + vec3(0., 1e-4, 0.));
  float top = smoothstep(0., .7, p.y), l = dot(N, S) * .5 + .5;
  vec3 c = mix(uShade, uLit, smoothstep(.22, .72, l * .62 + top * .4 + (n - .5) * .22));
  c += uRim * rimE * rimE * smoothstep(.35, -.5, S.z) * (.35 + .65 * top);      // a lining of light when the sun stands behind the bank
  c = mix(c, uHaze, mix(.7, .12, smoothstep(0., .45, p.y)));
  gl_FragColor = vec4(c, a * .97);
}`;

export default {
  id: 'reindeer-cyclone',
  name: 'The Turning Herd',
  category: 'wilderness',
  weirdness: 0.08,
  media: ['air', 'open', 'snow'],
  async build(ctx) {
    const rng = ctx.rng, noise = ctx.noise, vary = ctx.vary || {}, detail = ctx.quality?.detail ?? 1, renderer = ctx.renderer;
    const scene = new THREE.Scene();
    await ctx.yield();

    // ---- which visit is this: hour, weather, season, cast
    const lr = rng.fork('when'), pick = lr(), aprilRoll = lr(), paleRoll = lr(), owlRoll = lr(), azRoll = lr();
    let look = pick < 0.34 ? 'noon' : pick < 0.56 ? 'lastSun' : pick < 0.72 ? 'moon' : pick < 0.86 ? 'overcast' : 'blizzard';
    if (vary.hour === 'day' && (look === 'lastSun' || look === 'moon')) look = 'noon';
    if (vary.hour === 'dawn' || vary.hour === 'golden') look = 'lastSun';
    if (vary.hour === 'night') look = 'moon';
    const LK = LOOKS[look], hour = look === 'lastSun' || look === 'moon' ? look : 'noon', weather = look === 'overcast' || look === 'blizzard' ? look : 'clear';
    const april = false && aprilRoll < 0.3;       // the late-April thaw is built into the hero; this world keeps March on every visit

    // the polar noon sun stands nine degrees up: every animal tows a shadow a dozen metres long, toward the north
    // (the last sun stands seven degrees up; lower, and the shadows hatch the whole lake)
    const lowAz = (azRoll - 0.5) * 0.14, lowEl = LK.el || 0.157, lowSunDir = LK.el ? [Math.sin(lowAz) * Math.cos(lowEl), Math.sin(lowEl), Math.cos(lowAz) * Math.cos(lowEl)] : undefined;
    // ---- the hero: the turning herd, its snow, its boulder, its route (the stragglers stand on the land: height here, the rendered surface below)
    const height = makeHeight(noise);
    const hero = await buildHero(ctx, { ground: height, palette: PALETTE, hour, weather, season: april ? 'april' : 'march', density: clamp(0.93 + ((vary.density ?? 1) - 1) * 0.66, 0.73, 1.08),
      paleHerd: false, whiteCow: !!vary.rare, stragglers: 40, sunDir: lowSunDir });
    scene.add(hero.object);
    {
      const hl = hero.light, o = { haze: hl.haze * 1.5 };
      for (const k in LK.light) o[k] = typeof LK.light[k] === 'string' ? col(LK.light[k]) : LK.light[k];
      if (look === 'noon' || look === 'blizzard') { o.shade = o.shade.clone().multiplyScalar(0.95).lerp(o.snow, 0.1); o.bounce = col(PALETTE[1]).multiplyScalar(0.36); }
      if (look === 'lastSun') o.shade = hl.shade.clone().lerp(hl.snow, 0.2);
      if (look === 'blizzard') { o.drift = 0.7; o.haze = 0.9; }      // legs and bellies go into the flowing snow, backs and antlers ride above it
      if (look === 'overcast') { o.snow = hl.snow.clone().lerp(col('#f2cfc6'), 0.5); o.warm = o.snow.clone().lerp(col('#ffc0a0'), 0.3); o.shade = hl.shade.clone().lerp(col('#5a5fa6'), 0.42); }   // pearl twilight, not grey: rose lights, violet hollows
      hero.setLight(o);
    }
    await ctx.yield();
    const L = hero.light, A = hero.anchors, M = A.uMarks, path = hero.path || makePath(A.flyThrough), PL = path.length;
    const SUN = L.sunDir.clone().normalize(), sunCol = L.sunColor.clone().multiplyScalar(L.sunIntensity), skyCol = L.sky.clone().multiplyScalar(L.skyIntensity);
    const shTint = new THREE.Color(clamp(L.shade.r / (L.snow.r * 0.74), 0.05, 1), clamp(L.shade.g / (L.snow.g * 0.74), 0.05, 1), clamp(L.shade.b / (L.snow.b * 0.74), 0.05, 1));
    const shLen = Math.min(1 / Math.tan(Math.max(0.03, Math.asin(clamp(SUN.y, 0.02, 1)))), 9.5), away = new THREE.Vector2(-SUN.x, -SUN.z).normalize();
    const sunEl = THREE.MathUtils.radToDeg(Math.asin(SUN.y)), sunAz = THREE.MathUtils.radToDeg(Math.atan2(SUN.x, -SUN.z));

    // ---- sky, haze
    const skyOpts = { rng, renderer, ...LK.sky };
    if (look === 'moon') skyOpts.bodies = [{ elevation: sunEl, azimuth: sunAz, size: 2.3, phase: 1, intensity: 1, dark: 0.03, glow: 0.22, glowColor: '#9db8ff' }];
    else { skyOpts.sunElevation = sunEl; skyOpts.sunAzimuth = sunAz; }
    skyOpts.ground = LK.fog;
    const sky = makeSky(skyOpts), veilTime = { value: 0 };
    scene.add(sky.object);
    scene.fog = new THREE.FogExp2(LK.fog, LK.density);
    await ctx.yield();
    let towers = null;
    if (LK.towers) {
      // a bank of cumulus round the horizon: a few masses of clearly different size with open sky between; one tall mass stands
      // south of the massif, two flank the low sun, none stands behind the cleft (north-west)
      const at = [[-4000, 250, 2200, 1800], [-4600, 230, -1200, 800], [500, 190, -3100, 1350], [2500, 170, -1700, 650], [-1500, 150, 2900, 1300], [1700, 160, 2500, 700], [3300, 210, 900, 1000]];
      {
        const P = [], U = [], S3 = [], I = [];
        for (const [k, [cx0, base, cz0, w0]] of at.entries()) {
          const l = Math.hypot(cx0, cz0), dx = cx0 / l, dz = cz0 / l, rx = -dz, rz = dx, hw = w0 * 0.68, y0 = base * 0.25, n0 = P.length / 3, seed = k * 3.7 + rng() * 5;
          const sx = SUN.x * rx + SUN.z * rz, sz = -(SUN.x * dx + SUN.z * dz);
          for (const [a, b] of [[0, 0], [1, 0], [1, 1], [0, 1]]) { P.push(cx0 + rx * hw * (a * 2 - 1), y0 + b * hw, cz0 + rz * hw * (a * 2 - 1)); U.push(a, b, seed); S3.push(sx, SUN.y + 0.25, sz); }
          I.push(n0, n0 + 1, n0 + 2, n0, n0 + 2, n0 + 3);
        }
        const cg = new THREE.BufferGeometry(); cg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); cg.setAttribute('aUv', new THREE.Float32BufferAttribute(U, 3)); cg.setAttribute('aSun', new THREE.Float32BufferAttribute(S3, 3)); cg.setIndex(I);
        towers = new THREE.Mesh(cg, new THREE.ShaderMaterial({ vertexShader: CLOUD_VERT, fragmentShader: CLOUD_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide,
          uniforms: { uLit: { value: col(LK.sky.cloudLit).multiplyScalar(0.92) }, uShade: { value: col(LK.sky.cloudShade).lerp(col(LK.sky.cloudLit), 0.22) }, uHaze: { value: col(LK.sky.horizon).lerp(col(LK.fog), 0.35).multiplyScalar(0.92) }, uRim: { value: col(LK.sky.sunColor).multiplyScalar(0.8) }, uTime: veilTime } }));
        towers.frustumCulled = false; towers.matrixAutoUpdate = false; towers.renderOrder = 0; scene.add(towers);
      }
      await ctx.yield();
      const VP = [], VU = [], VI = [];
      for (const [k, i] of [0, 2, 4].entries()) {
        const [cx0, base, cz0, w0] = at[i], x = cx0 * 0.94, z = cz0 * 0.94, l = Math.hypot(x, z), px = -z / l, pz = x / l, hw = w0 * 0.3, top = base + 70, lean = 0.3 * top, n0 = VP.length / 3;
        VP.push(x - px * hw, -30, z - pz * hw, x + px * hw, -30, z + pz * hw, x + px * (hw + lean), top, z + pz * (hw + lean), x - px * (hw - lean), top, z - pz * (hw - lean));
        VU.push(0, 0, k, 1, 0, k, 1, 1, k, 0, 1, k); VI.push(n0, n0 + 1, n0 + 2, n0, n0 + 2, n0 + 3);
      }
      const vg = new THREE.BufferGeometry(); vg.setAttribute('position', new THREE.Float32BufferAttribute(VP, 3)); vg.setAttribute('aUv', new THREE.Float32BufferAttribute(VU, 3)); vg.setIndex(VI);
      const vm = new THREE.Mesh(vg, new THREE.ShaderMaterial({ vertexShader: VEIL_VERT, fragmentShader: VEIL_FRAG, fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
        uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uCol: { value: new THREE.Color(LK.veil) }, uTime: veilTime, uAlpha: { value: 0.55 } } }));
      vm.frustumCulled = false; vm.matrixAutoUpdate = false; vm.renderOrder = 1; scene.add(vm);
    }
    await ctx.yield();

    const time = { value: 0 }, fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
    const heath = col('#3a2428').lerp(col(PALETTE[5]), 0.4), lichen = col('#9aa58c').multiplyScalar(0.8), rockC = col(PALETTE[5]).lerp(col(PALETTE[6]), 0.42);
    const tree = col('#1b2a26').multiply(skyCol.clone().addScalar(0.25)).multiplyScalar(1.6);
    const landU = (rockAmt) => ({ ...fogU(), uSunDir: { value: SUN }, uGold: { value: L.gold }, uSnow: { value: L.snow }, uWarm: { value: L.warm }, uShade: { value: L.shade }, uHeath: { value: heath }, uLichen: { value: lichen },
      uRock: { value: rockC }, uTree: { value: tree }, uTime: time, uGlint: { value: L.glint }, uDrift: { value: L.drift }, uWet: { value: L.wet }, uRockAmt: { value: rockAmt } });
    const landMat = (rockAmt) => new THREE.ShaderMaterial({ vertexShader: LAND_VERT, fragmentShader: LAND_FRAG, uniforms: landU(rockAmt), fog: true });
    const fixed = (m, order = 0) => { m.frustumCulled = false; m.matrixAutoUpdate = false; m.renderOrder = order; m.updateMatrix(); scene.add(m); return m; };

    // ---- the land: one tensor grid, 2.2 m cells under the crest crossing, growing to the horizon
    const xs = tensorAxis(228, 384, 2.2, -3700, 2600, 1.16), zs = tensorAxis(-94, 34, 2.2, -3300, 3300, 1.16), nx = xs.length, nz = zs.length;
    const tp = new Float32Array(nx * nz * 3), ti = new Uint32Array((nx - 1) * (nz - 1) * 6);
    for (let j = 0, k = 0; j < nz; j++) {
      for (let i = 0; i < nx; i++, k += 3) { tp[k] = xs[i]; tp[k + 1] = height(xs[i], zs[j]); tp[k + 2] = zs[j]; }
      if ((j & 7) === 7) await ctx.yield();
    }
    for (let j = 0, k = 0; j < nz - 1; j++) { for (let i = 0; i < nx - 1; i++, k += 6) { const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1; ti[k] = a; ti[k + 1] = c; ti[k + 2] = b; ti[k + 3] = b; ti[k + 4] = c; ti[k + 5] = d; } if ((j & 31) === 31) await ctx.yield(); }
    await ctx.yield();
    const tn = new Float32Array(nx * nz * 3);
    for (let j = 0, k = 0; j < nz; j++) {
      const j0 = Math.max(0, j - 1), j1 = Math.min(nz - 1, j + 1), dz = zs[j1] - zs[j0];
      for (let i = 0; i < nx; i++, k += 3) {
        const i0 = Math.max(0, i - 1), i1 = Math.min(nx - 1, i + 1);
        const gx = (tp[(j * nx + i1) * 3 + 1] - tp[(j * nx + i0) * 3 + 1]) / (xs[i1] - xs[i0]), gz = (tp[(j1 * nx + i) * 3 + 1] - tp[(j0 * nx + i) * 3 + 1]) / dz, il = 1 / Math.sqrt(gx * gx + gz * gz + 1);
        tn[k] = -gx * il; tn[k + 1] = il; tn[k + 2] = -gz * il;
      }
      if ((j & 31) === 31) await ctx.yield();
    }
    await ctx.yield();
    const tg = new THREE.BufferGeometry(); tg.setAttribute('position', new THREE.BufferAttribute(tp, 3)); tg.setAttribute('normal', new THREE.BufferAttribute(tn, 3)); tg.setIndex(new THREE.BufferAttribute(ti, 1));
    await ctx.yield();
    fixed(new THREE.Mesh(tg, landMat(0)));
    await ctx.yield();
    // the rendered surface (props stand on this, not on the height function)
    const cellOf = (arr, v) => { let lo = 0, hi = arr.length - 2; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (arr[m] <= v) lo = m; else hi = m - 1; } return lo; };
    const surf = (x, z) => {
      const i = cellOf(xs, x), j = cellOf(zs, z), fx = clamp((x - xs[i]) / (xs[i + 1] - xs[i]), 0, 1), fz = clamp((z - zs[j]) / (zs[j + 1] - zs[j]), 0, 1);
      const a = tp[(j * nx + i) * 3 + 1], b = tp[(j * nx + i + 1) * 3 + 1], c = tp[((j + 1) * nx + i) * 3 + 1], d = tp[((j + 1) * nx + i + 1) * 3 + 1];
      return fx + fz <= 1 ? a + (b - a) * fx + (c - a) * fz : d + (c - d) * (1 - fx) + (b - d) * (1 - fz);
    };
    hero.setGround(surf);
    await ctx.yield();

    // ---- the flat-topped massif on the entry axis, blue cirques bitten into its rim
    const MX = -3350, MZ = -30, MH = 440, mTop = [];
    {
      const gx = 44, gz = 76, mp = new Float32Array(gx * gz * 3), mi = [];
      for (let j = 0, k = 0; j < gz; j++) for (let i = 0; i < gx; i++, k += 3) {
        const u = (j / (gz - 1) - 0.5) * 2, v = (i / (gx - 1) - 0.5) * 2, x = MX + v * 800, z = MZ + u * 1500;
        const rr = Math.pow(Math.abs(u), 2.6) + Math.pow(Math.abs(v), 2.2), bite = 0.24 * Math.abs(noise.n2(u * 2.3 + 5, v * 2.3)) + 0.08 * noise.n2(u * 6, v * 6 + 3);
        const ed = 1 - rr - bite, h = MH * Math.pow(smoothstep(0, 0.42, ed), 0.55) * (1 - 0.06 * noise.n2(u * 3 + 1, v * 3)) * (0.9 + 0.1 * u) + (ed > 0 ? 30 * noise.n2(u * 9, v * 9) * smoothstep(0, 0.2, ed) * smoothstep(0.5, 0.2, ed) : 0);
        mp[k] = x; mp[k + 1] = h - 20; mp[k + 2] = z;
        if (i > gx * 0.55 && ed > 0.4 && ed < 0.5 && mTop.length < 40) mTop.push([x, h - 22, z]);
      }
      for (let j = 0; j < gz - 1; j++) for (let i = 0; i < gx - 1; i++) { const a = j * gx + i, b = a + 1, c = a + gx, d = c + 1; mi.push(a, c, b, b, c, d); }
      const mg = new THREE.BufferGeometry(); mg.setAttribute('position', new THREE.BufferAttribute(mp, 3)); mg.setIndex(mi); mg.computeVertexNormals();
      fixed(new THREE.Mesh(mg, landMat(1)));
    }
    await ctx.yield();

    // ---- the taiga closing the south shore: three flats of spruce
    {
      const P = [], U = [], I = [], seg = 200;
      for (let l = 0; l < 6; l++) {
        const kq = 1.035 + l * 0.065, H0 = 17 + l * 3; let acc = 0, px = 0, pz = 0;
        for (let i = 0; i <= seg; i++) {
          const fq = i / seg, H = H0 * smoothstep(0, 0.08, fq) * smoothstep(1, 0.92, fq) + 0.01, a = lerp(0.08, 0.97, fq) * Math.PI, x = LAKE_C + LAKE_A * kq * Math.cos(a), z = LAKE_B * kq * Math.sin(a);
          if (i) acc += Math.hypot(x - px, z - pz); px = x; pz = z;
          const y = surf(x, z) - 1.5, n = P.length / 3;
          P.push(x, y, z, x, y + H, z); U.push(acc / 8.5, 0, l * 3.7 + 1, acc / 8.5, 1, l * 3.7 + 1);
          if (i < seg) I.push(n, n + 1, n + 2, n + 1, n + 3, n + 2);
        }
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aUv', new THREE.Float32BufferAttribute(U, 3)); g.setIndex(I);
            fixed(new THREE.Mesh(g, new THREE.ShaderMaterial({ vertexShader: TAIGA_VERT, fragmentShader: TAIGA_FRAG, fog: true, side: THREE.DoubleSide,
        uniforms: { ...fogU(), uTree: { value: tree }, uSnowC: { value: L.shade.clone().lerp(L.snow, 0.35) }, uRimC: { value: sunCol.clone().multiplyScalar(0.12) } } })));
    }
    await ctx.yield();

    // ---- props share one lit shader
    const uThin = { value: 0.002 };
    const propMat = (o = {}) => new THREE.ShaderMaterial({ vertexShader: PROP_VERT, fragmentShader: PROP_FRAG, fog: true, vertexColors: true, side: o.two ? THREE.DoubleSide : THREE.FrontSide,
      uniforms: { ...fogU(), uTime: time, uThin, uSway: { value: o.sway ?? 0 }, uSunDir: { value: SUN }, uSunCol: { value: sunCol }, uSkyCol: { value: skyCol }, uBounce: { value: L.bounce }, uSnow: { value: L.snow },
        uShade: { value: L.shade }, uLichen: { value: lichen }, uCap: { value: o.cap ?? 0 }, uHoar: { value: o.hoar ?? 0 }, uGrain: { value: o.grain ?? 0 }, uTwoSide: { value: o.two ? 1 : 0 }, uAllSnow: { value: o.snow ?? 0 } } });
    // small soft shadows laid on the snow (multiplied): under the ptarmigan and beside every tuft, cushion and clod
    // (blended toward the colour of shaded snow, like the herd's own shadows: where two cross, or one falls on a printed arm, the blue does not deepen)
    const blobMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation,
      blendSrc: THREE.SrcAlphaFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor, uniforms: { uShCol: { value: L.shade.clone().multiplyScalar(0.93) }, uShStr: { value: L.shadowStrength } },
      vertexShader: 'varying vec2 vQ; void main(){ vQ = position.xz; gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.); }',
      fragmentShader: 'uniform vec3 uShCol; uniform float uShStr; varying vec2 vQ; void main(){ float k = (1. - smoothstep(.35, 1., length(vQ))) * uShStr * .9; gl_FragColor = vec4(uShCol, k); }' });
    const mtx = new THREE.Matrix4(), qt = new THREE.Quaternion(), eu = new THREE.Euler(), v1 = new THREE.Vector3(), v2 = new THREE.Vector3(), v3 = new THREE.Vector3(), v4 = new THREE.Vector3();
    const SP = [], SU = [], SI = [];
    const stroke = (x, z, len, hw, kind) => {       // a shadow laid on the rendered ground, away from the sun
      const n0 = SP.length / 3, segs = Math.max(2, Math.ceil(len / 2.5)), px = -away.y, pz = away.x;
      for (let i = 0; i <= segs; i++) {
        const f = i / segs, cx = x + away.x * len * f, cz = z + away.y * len * f;
        for (const sg of [-1, 1]) { const vx = cx + px * hw * sg, vz = cz + pz * hw * sg; SP.push(vx, surf(vx, vz) + 0.12, vz); SU.push(f, sg, kind); }
        if (i < segs) { const a = n0 + i * 2; SI.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
      }
    };

    // ---- the tor on the crest, 7 m right of the entry line, and frost-heaved stones on the scoured ground
    const torX = 329, torZ = -37.2, torG = surf(torX, torZ), rockMat = propMat({ grain: 1, cap: 0.95, hoar: 0.5 });
    let torTop = torG + 4;
    for (const [i, [dx, cy, dz, r, sq]] of [[0, 1.0, 0, 2.7, 0.75], [0.5, 2.5, -0.3, 1.7, 0.8], [-0.2, 3.5, 0.2, 1.05, 0.7], [2.6, 0.3, 1.4, 1.2, 0.7], [-2.2, 0.2, -1.6, 0.9, 0.8]].entries()) {
      const g = rockGeometry({ rng: rng.fork('tor' + i), kind: 'boulder', radius: r, detail: i < 3 ? 3 : 2, color: '#7a7068', colorB: '#5a524c' }), m = new THREE.Mesh(g, rockMat);
      m.position.set(torX + dx, torG + cy, torZ + dz); m.scale.set(1, sq, 1); m.rotation.y = i * 2.1; fixed(m);
      if (i === 2) { g.computeBoundingBox(); torTop = torG + cy + g.boundingBox.max.y * sq - 0.1; }
      await ctx.yield();
    }
    stroke(torX, torZ, Math.min(4.2 * shLen, 26), 2.6, 0);
    await ctx.yield();
    {
      const sr = rng.fork('stones'), n = 46, im = new THREE.InstancedMesh(rockGeometry({ rng: sr, kind: 'boulder', radius: 1, detail: 1, color: '#7a7068', colorB: '#5a524c' }), rockMat, n);
      for (let i = 0, t = 0; i < n && t < 4000; t++) {
        const x = sr.range(318, 402), z = sr.range(-82, 22); if (patchAt(x, z) < 0.57) continue;
        const s = sr.range(0.22, 0.75); mtx.compose(v1.set(x, surf(x, z) + s * 0.25, z), qt.setFromEuler(eu.set(sr() * 0.5, sr() * TAU, sr() * 0.5)), v2.set(s * sr.range(1, 1.6), s * 0.7, s)); im.setMatrixAt(i++, mtx);
        if (s > 0.5) stroke(x, z, s * shLen * 0.9, s * 0.8, 0);
      }
      fixed(im);
    }
    await ctx.yield();

    // ---- dwarf birch on the scoured crest and on the islet round the erratic
    {
      const tr = rng.fork('twigs'), n = Math.round(310 * detail), im = new THREE.InstancedMesh(twigGeometry(tr), propMat({ two: 1, sway: 1 }), n);
      let i = 0;
      for (let t = 0; i < n - 90 && t < 30000; t++) {
        const x = tr.range(314, 402), z = tr.range(-80, 20), near = Math.hypot(x - torX, z - torZ) < 7;
        if (!near && patchAt(x, z) + tr() * 0.1 < 0.62) continue;
        mtx.compose(v1.set(x, surf(x, z), z), qt.setFromEuler(eu.set(0, tr() * TAU, 0)), v2.setScalar(tr.range(0.8, 1.6))); im.setMatrixAt(i++, mtx);
        if ((t & 1023) === 0) await ctx.yield();
      }
      for (; i < n; i++) { const a = tr() * TAU, r = tr.range(8.5, 19); mtx.compose(v1.set(Math.cos(a) * r, 0, Math.sin(a) * r), qt.setFromEuler(eu.set(0, tr() * TAU, 0)), v2.setScalar(tr.range(0.8, 1.5))); im.setMatrixAt(i, mtx); }
      fixed(im);
    }
    await ctx.yield();

    // ---- the floor of the eye near the lens: heath mats, lichen cushions and rimed twigs on small scoured hummocks,
    // clods of thrown snow round the lips of the feeding craters and along the trampled lane, each with its small blue shadow
    {
      const er = rng.fork('eyefloor'), cxw = A.cleftDir.x, czw = A.cleftDir.z, craters = hero.craters, spots = hero.eyeSpots, blobs = [];
      const free = (x, z, pad) => {
        const r = Math.hypot(x, z); if (r < 14.5 || r > 60) return false;
        for (const c of craters) if (Math.hypot(c.x - x, c.z - z) < c.R * 1.5 + pad) return false;
        for (const e of spots) if (Math.hypot(e.x - x, e.z - z) < 0.75 + pad) return false;
        return true;
      };
      const blob = (x, z, hw, len) => blobs.push(x + away.x * len * 0.75, z + away.y * len * 0.75, hw, len);
      // lichen cushion: a low cauliflower dome
      const cg = new THREE.IcosahedronGeometry(1, 0), cp = cg.attributes.position, cn = cg.attributes.normal, cc = new Float32Array(cp.count * 3), pale = col('#b9bca6'), deep = col('#565c4e');
      for (let i = 0; i < cp.count; i++) {
        v1.fromBufferAttribute(cp, i).normalize(); const f = 1 + 0.2 * noise.n3(v1.x * 2.4 + 5, v1.y * 2.4, v1.z * 2.4), y = Math.max(v1.y * f * 0.8, -0.06);
        cp.setXYZ(i, v1.x * f, y, v1.z * f); v2.set(v1.x, v1.y * 1.6 + 0.25, v1.z).normalize(); cn.setXYZ(i, v2.x, v2.y, v2.z);
        const t = clamp((f - 0.85) / 0.35, 0, 1) * (0.5 + 0.5 * clamp(v1.y * 2 + 0.6, 0, 1)); cc[i * 3] = lerp(deep.r, pale.r, t); cc[i * 3 + 1] = lerp(deep.g, pale.g, t); cc[i * 3 + 2] = lerp(deep.b, pale.b, t);
      }
      cg.deleteAttribute('uv'); cg.setAttribute('color', new THREE.BufferAttribute(cc, 3)); cg.setAttribute('aAnim', new THREE.BufferAttribute(new Float32Array(cp.count * 4), 4));
      // heath mat: a dark wine-green pad bristling with short sprigs, their tips rimed
      const hg = new Geo(), wine = col('#3b1a22'), moss = col('#2c3524'), rime = col('#cfc6c4');
      const pad = hg.loft([[-0.26, 0.0, 0, 0], [-0.18, 0.02, 0.13, 0.04], [0, 0.03, 0.22, 0.06], [0.17, 0.02, 0.15, 0.045], [0.26, 0.0, 0, 0]].map(([z, y, rx, ry]) => ({ z, y, rx, ry })), { sides: 7, top: wine, belly: moss });
      hg.paint(pad, (x, y, z, c) => { c.lerp(moss, 0.5 + 0.5 * noise.n2(x * 14, z * 14)); c.multiplyScalar(0.8 + 0.4 * noise.n2(x * 31 + 3, z * 31)); });
      for (let i = 0; i < 16; i++) {
        const a = er() * TAU, rr = er.range(0.02, 0.2), bx = Math.cos(a) * rr, bz = Math.sin(a) * rr * 1.1, L2 = er.range(0.08, 0.2), lx = Math.cos(a) * 0.3 * L2 + er.range(-0.03, 0.03), lz = Math.sin(a) * 0.3 * L2, hw = 0.011, sxv = -Math.sin(a) * hw, szv = Math.cos(a) * hw;
        const P3 = [[bx, 0.03, bz], [bx + lx * 0.5, 0.03 + L2 * 0.6, bz + lz * 0.5], [bx + lx, 0.03 + L2, bz + lz]];
        const st = hg.strip(P3.map((q) => [q[0] + sxv, q[1], q[2] + szv]), P3.map((q) => [q[0] - sxv, q[1], q[2] - szv]), i % 3 ? wine : moss, i % 2 ? rime : wine);
        hg.anim(st, (x, y, z, k) => [((k - st[0]) & 1 ? -1 : 1) * sxv, 0, ((k - st[0]) & 1 ? -1 : 1) * szv, 0.03 * y]);
      }
      // clod: an angular chunk of crust
      const kg = new THREE.IcosahedronGeometry(1, 0), kp = kg.attributes.position, kseen = new Map();
      for (let i = 0; i < kp.count; i++) { v1.fromBufferAttribute(kp, i); const key = Math.round(v1.x * 100) + ',' + Math.round(v1.y * 100) + ',' + Math.round(v1.z * 100); if (!kseen.has(key)) kseen.set(key, [er.range(0.6, 1.25), er.range(0.5, 1.1), er.range(0.6, 1.25)]); const f = kseen.get(key); kp.setXYZ(i, v1.x * f[0], Math.max(v1.y * f[1] * 0.7, -0.25), v1.z * f[2]); }
      kg.deleteAttribute('uv');
      { const kn = kg.attributes.normal; for (let i = 0; i < kp.count; i++) { v1.fromBufferAttribute(kp, i).normalize(); kn.setXYZ(i, v1.x * 0.85, v1.y * 0.85 + 0.3, v1.z * 0.85); } }      // one normal per corner, shared by its faces: a rounded lump of snow, not a faceted die
      kg.setAttribute('color', new THREE.BufferAttribute(new Float32Array(kp.count * 3).fill(0.85), 3)); kg.setAttribute('aAnim', new THREE.BufferAttribute(new Float32Array(kp.count * 4), 4));
      await ctx.yield();
      const nCl = Math.round(95 * detail), nCu = nCl * 4, nHe = nCl * 2, nTw = nCl * 3, nKl = Math.round(430 * detail);
      const cuM = new THREE.InstancedMesh(cg, propMat({ hoar: 0.25 }), nCu), heM = new THREE.InstancedMesh(hg.build(), propMat({ two: 1, sway: 0.4, hoar: 0.3 }), nHe), twM = new THREE.InstancedMesh(twigGeometry(er), propMat({ two: 1, sway: 1 }), nTw), klM = new THREE.InstancedMesh(kg, propMat({ snow: 1 }), nKl);
      let iCu = 0, iHe = 0, iTw = 0, iKl = 0; const tint = new THREE.Color();
      for (let t = 0, done = 0; done < nCl && t < nCl * 30; t++) {
        const al = er.range(12, 63), la = er() < 0.72 ? er.range(-9.5, 9.5) : er.range(-18, 18), x = cxw * al - czw * la, z = czw * al + cxw * la;
        if (!free(x, z, 0.55)) continue;
        done++;
        const nh = 1 + (er() < 0.5 ? 1 : 0);
        for (let k = 0; k < nh && iHe < nHe; k++) { const s2 = er.range(0.9, 1.7), hx = x + er.range(-0.3, 0.3) * k, hz = z + er.range(-0.3, 0.3) * k; mtx.compose(v1.set(hx, 0, hz), qt.setFromEuler(eu.set(0, er() * TAU, 0)), v2.set(s2, s2 * er.range(0.9, 1.4), s2)); heM.setMatrixAt(iHe++, mtx); blob(hx, hz, 0.24 * s2, 0.5 * s2); }
        const nc = 2 + Math.floor(er() * 3);
        for (let k = 0; k < nc && iCu < nCu; k++) { const a = er() * TAU, rr = er.range(0.2, 0.6), s2 = er.range(0.07, 0.16), px = x + Math.cos(a) * rr, pz = z + Math.sin(a) * rr; mtx.compose(v1.set(px, 0.01, pz), qt.setFromEuler(eu.set(0, er() * TAU, 0)), v2.set(s2 * er.range(0.9, 1.4), s2 * er.range(0.7, 1.1), s2)); tint.setScalar(er.range(0.8, 1.15)); cuM.setColorAt(iCu, tint); cuM.setMatrixAt(iCu++, mtx); blob(px, pz, s2 * 0.9, s2 * 1.6); }
        const nt = 1 + Math.floor(er() * 3);
        for (let k = 0; k < nt && iTw < nTw; k++) { const a = er() * TAU, rr = er.range(0.05, 0.6); mtx.compose(v1.set(x + Math.cos(a) * rr, 0, z + Math.sin(a) * rr), qt.setFromEuler(eu.set(0, er() * TAU, 0)), v2.setScalar(er.range(0.8, 1.5))); twM.setMatrixAt(iTw++, mtx); }
      }
      await ctx.yield();
      const clod = (x, z, s2) => { if (iKl >= nKl) return; mtx.compose(v1.set(x, s2 * 0.2, z), qt.setFromEuler(eu.set(er.range(-0.5, 0.5), er() * TAU, er.range(-0.5, 0.5))), v2.set(s2 * er.range(0.8, 1.5), s2, s2 * er.range(0.8, 1.3))); klM.setMatrixAt(iKl++, mtx); if (s2 > 0.085) blob(x, z, s2 * 0.9, s2 * 2.2); };
      for (const c of craters) {
        const al = c.x * cxw + c.z * czw, la = -c.x * czw + c.z * cxw; if (!c.sure || al < 6 || Math.abs(la) > 16) continue;
        const n = 6 + Math.floor(er() * 5);
        for (let k = 0; k < n; k++) { const a = er() * TAU, rr = c.R * er.range(1.0, 1.32); clod(c.x + Math.cos(a) * rr, c.z + Math.sin(a) * rr, er.range(0.05, 0.14)); }
      }
      // along the low route: thrown clods of crust, a third of those within five metres of the lens 11..20 cm across, the larger with their blue shadows
      for (let t = 0; t < 4000 && iKl < nKl; t++) {
        const uu = t % 5 < 3 ? er.range(M.slide0 - 0.02, 0.985) : t % 5 < 4 ? er.range(M.wheel0 + 0.01, M.rim1 + 0.035) : er.range(M.low1 - 0.004, M.slide0 - 0.02); path.pointAt(uu, v3); path.tangentAt(uu, v4);
        const q = er(), off = (0.7 + 6.8 * q * q) * er.sign(), x = v3.x - v4.z * off, z = v3.z + v4.x * off, r = Math.hypot(x, z);
        if (r < 60 && !free(x, z, 0.1)) continue;
        clod(x, z, Math.abs(off) < 5 && er() < 0.36 ? er.range(0.055, 0.1) : er.range(0.03, 0.085));
        if ((t & 255) === 255) await ctx.yield();
      }
      cuM.count = iCu; heM.count = iHe; twM.count = iTw; klM.count = iKl;
      fixed(cuM); fixed(heM); fixed(twM); fixed(klM);
      await ctx.yield();
      const nb = blobs.length / 4, bm = new THREE.InstancedMesh(new THREE.CircleGeometry(1, 6).rotateX(-Math.PI / 2), blobMat, Math.max(1, nb)), yaw = Math.atan2(away.x, away.y);
      for (let i = 0; i < nb; i++) { mtx.compose(v1.set(blobs[i * 4], 0.05, blobs[i * 4 + 1]), qt.setFromEuler(eu.set(0, yaw, 0)), v2.set(blobs[i * 4 + 2], 1, blobs[i * 4 + 3])); bm.setMatrixAt(i, mtx); }
      bm.count = nb; fixed(bm, 1);
    }
    await ctx.yield();

    // ---- crooked mountain birches in the lee of the fell, furred with hoar, each with its long shadow
    {
      const br = rng.fork('birch'), n = 50, im = new THREE.InstancedMesh(birchGeometry(br), propMat({ two: 1, sway: 1, hoar: 0.8 }), n);
      await ctx.yield();
      let i = 0;
      for (let t = 0; i < n && t < 6000; t++) {
        const z = br.range(-260, 230), x = br.range(214, 300); if (Math.abs(z + 30) < 45 || Math.hypot(x, z) < 238) continue;
        const h = surf(x, z); if (h < 0.5 || h > 24) continue;
        const s = br.range(1.2, 2.3); mtx.compose(v1.set(x, h, z), qt.setFromEuler(eu.set(br.range(-0.12, 0.12), br() * TAU, br.range(-0.12, 0.12))), v2.set(s, s * br.range(0.85, 1.1), s)); im.setMatrixAt(i++, mtx);
        stroke(x, z, Math.min(2.1 * s * shLen, 30), 1.2 * s, 1 + br());
      }
      im.count = i; fixed(im);
    }
    await ctx.yield();
    {
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(SP, 3)); g.setAttribute('aUv', new THREE.Float32BufferAttribute(SU, 3)); g.setIndex(SI);
      fixed(new THREE.Mesh(g, new THREE.ShaderMaterial({ vertexShader: SHADE_VERT, fragmentShader: SHADE_FRAG, fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.CustomBlending,
        blendEquation: THREE.AddEquation, blendSrc: THREE.ZeroFactor, blendDst: THREE.SrcColorFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4,
        uniforms: { ...fogU(), uShTint: { value: shTint }, uShStr: { value: L.shadowStrength } } })), 1);
    }

    // ---- the wolverine on the tor: upright to watch us come, then down and away along the cornice
    const wol = new THREE.Group(), torso = new THREE.Group(), wLegs = [], furMat = propMat({ two: 1 });
    let wHead;
    {
      const parts = wolverineParts(), body = new THREE.Mesh(parts.body, furMat);
      body.position.set(0, -0.36, 0.3); torso.position.set(0, 0.36, -0.3); torso.add(body);
      wHead = new THREE.Mesh(parts.head, furMat); wHead.position.set(0, 0.11, 0.76); torso.add(wHead);
      for (const [x, z] of [[-0.1, 0.6], [0.1, 0.6], [-0.11, 0.02], [0.11, 0.02]]) { const l = new THREE.Mesh(parts.leg, furMat); l.position.set(x, -0.03, z); torso.add(l); wLegs.push(l); }
      wol.add(torso); wol.scale.setScalar(1.4); scene.add(wol);
      wol.traverse((o) => { o.frustumCulled = false; });
    }
    const uDrop = 0.014, wolAt = new THREE.Vector3(torX - 0.2, torTop, torZ + 0.2), wolDir = new THREE.Vector3(-0.35, 0, -0.94).normalize();
    await ctx.yield();

    // ---- birds: two ravens off the left wing, two tumbling over the herd, one on the erratic (sometimes a snowy owl), sixteen ptarmigan
    const NB = 21, owl = owlRoll < 0.25, bp = birdParts(), featherMat = propMat({ two: 1 });
    const NR = 5, NP = NB - NR, pp = ptarmiganParts();
    const birdBody = new THREE.InstancedMesh(bp.body, featherMat, NR), birdWing = new THREE.InstancedMesh(bp.wing, featherMat, NR * 2), bSeed = new Float32Array(NB * 4);
    const ptWhite = L.snow.clone().multiplyScalar(0.9), ptUnder = L.shade.clone().multiplyScalar(1.25).lerp(L.snow, 0.28);      // lit by the look's own light, never brighter than its lit snow
    const ptarMat = new THREE.ShaderMaterial({ vertexShader: PROP_VERT, fragmentShader: PTAR_FRAG, fog: true, vertexColors: true, side: THREE.DoubleSide,
      uniforms: { ...fogU(), uTime: time, uThin, uSway: { value: 0 }, uSunDir: { value: SUN }, uSunCol: { value: sunCol }, uWhite: { value: ptWhite }, uUnder: { value: ptUnder }, uWing: { value: 0 } } });
    const ptWingMat = new THREE.ShaderMaterial({ vertexShader: PROP_VERT, fragmentShader: PTAR_FRAG, fog: true, vertexColors: true, side: THREE.DoubleSide,
      uniforms: { ...fogU(), uTime: time, uThin, uSway: { value: 0 }, uSunDir: { value: SUN }, uSunCol: { value: sunCol }, uWhite: { value: ptWhite }, uUnder: { value: ptUnder }, uWing: { value: 1 } } });
    const ptBody = new THREE.InstancedMesh(pp.body, ptarMat, NP);
    // the blur of the beating wings: one soft half-transparent fan per side
    const blurMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: true,
      uniforms: { ...fogU(), uCol: { value: ptUnder.clone().lerp(ptWhite, 0.45) }, uAlpha: { value: 0.24 } },
      vertexShader: '#include <common>\n#include <fog_pars_vertex>\nattribute vec2 aA; varying vec2 vA;\nvoid main(){ vA = aA; vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mvPosition;\n#include <fog_vertex>\n}',
      fragmentShader: '#include <common>\n#include <fog_pars_fragment>\nuniform vec3 uCol; uniform float uAlpha; varying vec2 vA;\nvoid main(){ float a = (1. - smoothstep(.25, 1., vA.x)) * smoothstep(0., .22, vA.y) * smoothstep(1., .78, vA.y); gl_FragColor = vec4(uCol, a * uAlpha);\n#include <fog_fragment>\n}' });
    const ptBlur = new THREE.InstancedMesh(pp.blur, blurMat, NP * 2);
    const ptWing = new THREE.InstancedMesh(pp.wing, ptWingMat, NP * 2);
    // each ptarmigan's shadow on the snow: a soft blue blob, multiplied
    const ptShade = new THREE.InstancedMesh(new THREE.CircleGeometry(1, 10).rotateX(-Math.PI / 2), blobMat, NP);
    {
      const br = rng.fork('birds'), black = new THREE.Color(0.05, 0.05, 0.065), white = new THREE.Color(0.56, 0.56, 0.58);
      for (let i = 0; i < NB; i++) {
        const c = i === 4 && owl ? white : black;
        if (i < NR) { birdBody.setColorAt(i, c); birdWing.setColorAt(i * 2, c); birdWing.setColorAt(i * 2 + 1, c); }
        else ptBody.setColorAt(i - NR, new THREE.Color(1, 1, 1));
        for (let k = 0; k < 4; k++) bSeed[i * 4 + k] = br();
      }
      mtx.makeScale(0, 0, 0); for (let i = 0; i < NR; i++) { birdBody.setMatrixAt(i, mtx); birdWing.setMatrixAt(i * 2, mtx); birdWing.setMatrixAt(i * 2 + 1, mtx); }
      for (let j = 0; j < NP; j++) { ptBody.setMatrixAt(j, mtx); ptShade.setMatrixAt(j, mtx); for (let k = 0; k < 2; k++) { ptWing.setMatrixAt(j * 2 + k, mtx); ptBlur.setMatrixAt(j * 2 + k, mtx); } }
      fixed(birdBody); fixed(birdWing); fixed(ptBody); fixed(ptShade, 1); fixed(ptBlur, 3); fixed(ptWing);
    }
    const mB = new THREE.Matrix4(), mW = new THREE.Matrix4(), mR = new THREE.Matrix4(), mMir = new THREE.Matrix4().makeScale(-1, 1, 1), UP = new THREE.Vector3(0, 1, 0);
    const setBird = (i, p, f, bank, flap, s) => {
      if (s <= 0) { mB.makeScale(0, 0, 0); birdBody.setMatrixAt(i, mB); birdWing.setMatrixAt(i * 2, mB); birdWing.setMatrixAt(i * 2 + 1, mB); return; }
      v3.crossVectors(UP, f); if (v3.lengthSq() < 1e-6) v3.set(1, 0, 0); v3.normalize(); v4.crossVectors(f, v3);
      mB.makeBasis(v3, v4, f).multiply(mR.makeRotationZ(bank)).scale(v2.set(s, s, s)).setPosition(p);
      birdBody.setMatrixAt(i, mB);
      mW.copy(mB).multiply(mR.makeRotationZ(flap)); birdWing.setMatrixAt(i * 2, mW);
      mW.copy(mB).multiply(mMir).multiply(mR.makeRotationZ(flap)); birdWing.setMatrixAt(i * 2 + 1, mW);
    };
    const pois = [], seat = new THREE.Vector3(), gaze2 = new THREE.Vector3(), gaze3 = new THREE.Vector3(), gT = new THREE.Vector3();
    const uBurst = 0.672, burstAt = path.pointAt(uBurst), burstDir = path.tangentAt(uBurst).setY(0).normalize(), burstRight = new THREE.Vector3(-burstDir.z, 0, burstDir.x);
    // the bird on the erratic leaves its perch when the lens is 34 m from the gate: it drops off the tall half toward the
    // lens, a wing's length left of the aisle, and passes ten metres off over the lens's left shoulder
    const uLift = 1 - 34 / PL, perch = A.boulderTop.clone().add(new THREE.Vector3(0, 0.1, 0)), liftDir = new THREE.Vector3(A.cleftDir.z, 0, -A.cleftDir.x).multiplyScalar(0.3).add(A.cleftDir).normalize();
    const pA = new THREE.Vector3(), pT = new THREE.Vector3(), pL = new THREE.Vector3(), bF = new THREE.Vector3(), bP = new THREE.Vector3();
    // the covey: one burst of sixteen that flies with the lens for three seconds and then banks away to the right. Its
    // formation is given in the path's own frame, one row per bird: [seconds after the burst at which it goes up, its speed
    // (m/s), metres ahead of the lens at the burst, metres to the right of the path, the height it climbs to]. Eight fly
    // near the lens, ahead and to its right, two to three metres up; eight further ahead and lower, over the herd.
    const PT_DRIFT = -0.3, PT_CAM = 14.5, PT = [
      [0.05, 14.7, 9.91, 0.52, 2.47], [-0.1, 14.85, 9.29, 1.52, 2.61], [0.15, 15, 9.48, 2.59, 2.47], [0, 14.75, 11.29, 1.18, 1.97],
      [0.25, 14.9, 10.42, 2.29, 1.91], [0.1, 14.65, 12.1, -0.15, 2.18], [-0.05, 14.8, 10.97, 4, 3.1], [0.2, 14.95, 11.77, -1.03, 2.91],
      [-0.35, 14.7, 15.6, -2.1, 1.86], [-0.5, 14.85, 16.47, -0.29, 1.23], [-0.25, 15, 14.74, 1.28, 2.05], [-0.4, 14.75, 16.8, 3.39, 1.02],
      [-0.15, 14.9, 14.85, 4.77, 1.93], [-0.3, 14.65, 15.79, 7.19, 1.54], [-0.45, 14.8, 15.36, -3.64, 1.29], [-0.2, 14.95, 16.06, 4.03, 2.71],
    ].map(([t0, v, lead0, lat0, H]) => ({ t0, v, lead0, lat0, H }));
    const updateBirds = (t, u) => {
      // escorts: ahead and to the left until the wheel, then they roll away
      const ue = Math.min(u, M.wheel0);
      for (let i = 0; i < 2; i++) {
        const s0 = bSeed[i * 4], lead = 8.5 + 3.5 * i, gone = smoothstep(M.wheel0 - 0.09, M.wheel0 + 0.03, u);
        path.posAtDist(ue * PL + lead, pA); path.tangentAtDist(ue * PL + lead, pT); pL.crossVectors(UP, pT).normalize();
        bP.copy(pA).addScaledVector(pL, 4.2 + 2.6 * i + 1.2 * Math.sin(t * 0.5 + s0 * 9) + 46 * gone).addScaledVector(pT, 1.5 * Math.sin(t * 0.37 + s0 * 5) + 20 * gone);
        bP.y += -1.6 + 1.5 * i + 0.5 * Math.sin(t * 0.8 + s0 * 7) + 11 * gone;
        bF.copy(pT).addScaledVector(pL, 0.9 * gone); bF.y = 0.2 * gone; bF.normalize();
        const beat = Math.sin(t * 6.2 + s0 * 20), glide = smoothstep(0.3, 0.7, Math.sin(t * 0.45 + s0 * 11));
        setBird(i, bP, bF, -0.9 * gone * (1 - gone) * 4 * 0.5 + 0.08 * Math.sin(t + s0 * 3), lerp(0.55 * beat, 0.12, glide), 1 - smoothstep(M.wheel0 + 0.02, M.wheel0 + 0.06, u));
      }
      // the tumbling pair over the herd
      for (let i = 2; i < 4; i++) {
        const s0 = bSeed[i * 4], a = t * 0.24 + (i - 2) * 0.35 + s0, r = 72 + 10 * Math.sin(t * 0.21 + s0 * 8);
        bP.set(Math.cos(a) * r, 21 + 3 * Math.sin(t * 0.33 + i) + (i - 2) * 2.5, -Math.sin(a) * r); bF.set(-Math.sin(a), 0.1 * Math.cos(t * 0.33 + i), -Math.cos(a)).normalize();
        const roll = Math.pow(Math.max(0, Math.sin(t * 0.5 + s0 * 30)), 12) * 3.2;
        setBird(i, bP, bF, -0.35 + roll, roll > 0.3 ? -0.5 : 0.5 * Math.sin(t * 6 + s0 * 20), 1);
      }
      // the bird on the erratic lifts as we come down the aisle
      {
        const tl = hero.clockAt(u) - hero.clockAt(uLift), sc = owl ? 1.25 : 1;
        if (tl <= 0) { bF.copy(liftDir); setBird(4, perch, bF, 0.05 * Math.sin(t * 0.7), -1.35, sc); }
        else {
          // a hop, then a long slant down off the rock on beating wings, levelling out above the antlers and climbing away behind the lens
          const k = 1 - Math.exp(-tl * 1.6), sink = smoothstep(0.25, 1.7, tl), rise = Math.max(0, tl - 1.9);
          bP.copy(perch).addScaledVector(liftDir, 7 * (tl - k / 1.6)).addScaledVector(UP, 0.5 * k - 5.2 * sink + 1.6 * rise);
          bF.copy(liftDir); bF.y = 0.3 * (1 - smoothstep(0, 0.3, tl)) - 0.42 * sink * (1 - sink) * 4 * 0.5 + 0.2 * smoothstep(1.9, 2.4, tl); bF.normalize();
          setBird(4, bP, bF, -0.2 * k * (1 - sink), 0.85 * Math.sin(tl * 17) + 0.1, sc);
        }
      }
      // ptarmigan: a first covey of eight bursts out of the snow ahead on the right and flies with us for three seconds,
      // a row against the taiga and a lower row against the far arm, spread across the right of the view; a second eight
      // go up ahead as the first bank away to the right. Their formation is the table PT (the path's frame), not drawn by lot.
      const tb = hero.clockAt(u) - hero.clockAt(uBurst);
      for (let i = NR; i < NB; i++) {
        const j = i - NR, P = PT[j], a = bSeed[i * 4], ti = tb - P.t0;
        if (ti <= 0 || ti > 9.5) { mB.makeScale(0, 0, 0); ptBody.setMatrixAt(j, mB); ptShade.setMatrixAt(j, mB); for (let k = 0; k < 2; k++) { ptWing.setMatrixAt(j * 2 + k, mB); ptBlur.setMatrixAt(j * 2 + k, mB); } continue; }
        const sgo = P.v * (ti - (1 - Math.exp(-2.5 * ti)) / 2.5), away2 = smoothstep(3.7, 5.2, ti), veer = smoothstep(4.8, 9, ti);
        const lead = Math.max(4.3, P.lead0 + sgo - PT_CAM * ti);
        path.posAtDist(u * PL + lead, pA); path.tangentAtDist(u * PL + lead, pT); pT.y = 0; pT.normalize(); pL.crossVectors(pT, UP);
        bP.copy(pA).addScaledVector(pL, P.lat0 + PT_DRIFT * ti + 9 * away2 + 26 * veer * veer);
        bP.y = 0.14 + (P.H - 0.14) * (1 - Math.exp(-2.6 * ti)) + 0.07 * Math.sin(ti * 3 + a * 20) + 1.2 * away2 - 0.5 * veer;
        bF.copy(pT).addScaledVector(pL, -0.6 + 1.0 * away2 + 0.6 * veer); bF.y = 0.5 * Math.exp(-2.4 * ti) + 0.12 * away2 * (1 - veer) + 0.5 * (1 - smoothstep(3.0, 5.0, ti)); bF.normalize();
        // seen from behind and to the side, nearly in profile: the head, the round body, the black of the tail, both wings
        const sc = 1.36 * smoothstep(0, 0.14, ti) * (1 - smoothstep(8, 9.5, ti)), bank = -0.15 + 0.12 * Math.sin(ti * 2 + a * 9) + 0.75 * away2 * (1 - veer), ph = ti * 62 + a * 30;
        v3.crossVectors(UP, bF); if (v3.lengthSq() < 1e-6) v3.set(1, 0, 0); v3.normalize(); v4.crossVectors(bF, v3);
        mB.makeBasis(v3, v4, bF).multiply(mR.makeRotationZ(bank)).scale(v2.set(sc, sc, sc)).setPosition(bP);
        ptBody.setMatrixAt(j, mB);
        const sw = Math.sin(ph), fl = 0.1 + 0.66 * Math.sign(sw) * Math.pow(Math.abs(sw), 0.5), rock = 0.08 * Math.sin(ph * 0.31);      // the stroke is caught near its top or its bottom, seldom edge-on
        mW.copy(mB).multiply(mR.makeRotationZ(fl)); ptWing.setMatrixAt(j * 2, mW);
        mW.copy(mB).multiply(mMir).multiply(mR.makeRotationZ(fl)); ptWing.setMatrixAt(j * 2 + 1, mW);
        mW.copy(mB).multiply(mR.makeRotationZ(rock)); ptBlur.setMatrixAt(j * 2, mW);
        mW.copy(mB).multiply(mMir).multiply(mR.makeRotationZ(rock)); ptBlur.setMatrixAt(j * 2 + 1, mW);
        const sl = Math.min(bP.y / Math.max(SUN.y, 0.1), 14), ss = sc * (0.27 + 0.012 * sl);
        mB.makeScale(ss, 1, ss).setPosition(bP.x - SUN.x * sl, 0.07, bP.z - SUN.z * sl); ptShade.setMatrixAt(j, mB);
      }
      ptBody.instanceMatrix.needsUpdate = true; ptWing.instanceMatrix.needsUpdate = true; ptShade.instanceMatrix.needsUpdate = true; ptBlur.instanceMatrix.needsUpdate = true;
      birdBody.instanceMatrix.needsUpdate = true; birdWing.instanceMatrix.needsUpdate = true;
    };

    // ---- the air: diamond dust (or snowfall), spindrift
    const bufSize = new THREE.Vector2(), uBufH = { value: 450 };
    {
      const dr = rng.fork('dust'), n = Math.round((look === 'blizzard' ? 2600 : look === 'overcast' ? 2200 : 2000) * detail), sd = new Float32Array(n * 4);
      for (let i = 0; i < n * 4; i++) sd[i] = dr();
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3)); g.setAttribute('aSeed', new THREE.BufferAttribute(sd, 4));
      const [dc, ds, dg, dop, dv] = LK.dust;
      fixed(new THREE.Points(g, new THREE.ShaderMaterial({ vertexShader: DUST_VERT, fragmentShader: DUST_FRAG, transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
        uniforms: { uBox: { value: new THREE.Vector3(60, 40, 60) }, uVel: { value: new THREE.Vector3(...dv) }, uSunDir: { value: SUN }, uColA: { value: col(dc) }, uGold: { value: L.gold.clone().multiplyScalar(look === 'moon' ? 0.5 : 1) },
          uTime: time, uBufH, uSize: { value: ds }, uGlintK: { value: dg }, uOpaque: { value: dop } } })), 4);
    }
    await ctx.yield();
    {
      const sr = rng.fork('drift'), iA = [], iB = [], bz = look === 'blizzard';
      const nLake = Math.round((bz ? 560 : 240) * detail), nLip = Math.round(150 * detail);
      for (let i = 0; i < nLake; i++) { iA.push(sr(), bz ? sr.range(0.15, 0.45) : sr.range(0.12, 0.5), sr(), sr()); iB.push(0, bz ? sr.range(7, 15) : sr.range(5, 11), bz ? sr.range(0.2, 0.45) : sr.range(0.35, 0.8), 0); }
      for (let i = 0; i < nLip; i++) {
        let z = sr.range(-150, 90); if (Math.abs(z + 30) < 26) z += z < -30 ? -26 : 26;      // the entry axis is kept clear: the herd is seen over the lip there
        let x = 270; while (x < 360 && height(x, z) < LAKE_Y + 40.5) x += 1.5;
        iA.push(x - 3 + sr.range(0, 30), surf(x, z) + 0.35, z, sr()); iB.push(1, sr.range(3, 6.5), sr.range(0.5, 1.1), sr.range(18, 40));
      }
      for (let i = 0; i < mTop.length; i += 3) { const p = mTop[i]; iA.push(p[0], p[1] + 10, p[2], sr()); iB.push(1, 170, 34, 520); }
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]), 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
      g.setAttribute('iA', new THREE.InstancedBufferAttribute(new Float32Array(iA), 4)); g.setAttribute('iB', new THREE.InstancedBufferAttribute(new Float32Array(iB), 4)); g.instanceCount = iA.length / 4;
      fixed(new THREE.Mesh(g, new THREE.ShaderMaterial({ vertexShader: DRIFT_VERT, fragmentShader: DRIFT_FRAG, fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
        uniforms: { ...fogU(), uBox: { value: new THREE.Vector3(220, 1, 220) }, uSunDir: { value: SUN }, uLit: { value: L.snow.clone().multiplyScalar(0.34 * Math.min(L.sunIntensity, 2.1) + 0.12) },
          uShadeC: { value: L.shade.clone().lerp(L.snow, 0.3).multiplyScalar(0.85) }, uGold: { value: L.gold.clone().multiplyScalar(0.5) }, uTime: time, uAlpha: { value: LK.drift } } })), 2);
    }
    await ctx.yield();
    await sky.prewarm(renderer, null, scene);
    await ctx.yield();

    // ---- the herd clock: the time the camera reaches u, plus an offset that runs only while the world is watched through a portal
    let preview = 0, carry = 0, hold = 0, lastU = -1, lastT = 0;
    // THE GAZE is the hero's (hero.gazeAt, written beside the route it belongs to): down the slope it rests on the ground
    // ahead, drawn to the erratic; on the rim it holds the erratic and the low sun; over the high pass it rests on the lake
    // toward the erratic, a set bearing off the sun's; it comes level again among the south-western arms, finds the young
    // animals' file against the sun on the outer edge, then the massif across the inner arms, then the cleft.
    const lookAt = (t, u) => hero.gazeAt(u, gaze3);
    const tBlend = hero.clockAt(M.dive1 + 0.1);
    seat.copy(A.portalSeat.position);
    pois.push({ at: lookAt, ...hero.gazePoi });
    return {
      scene, path, duration: hero.duration, pace: hero.pace, ride: 'none',
      camera: { fov: 62, near: 0.3, far: 6500, bank: 0.45 },
      pois,
      portal: { shape: 'arch', width: 8, height: 10, color: LK.portal, glow: 0.9, revealDistance: 300 },
      post: { exposure: LK.exposure, bloom: { strength: 0.22, radius: 0.6, threshold: 0.92 },
        grade: { saturation: LK.sat, contrast: 1.07, tint: LK.tint, shadowTint: '#0b1230', vignette: 0.26, grain: 0.02, aberration: 0 } },
      update(dt, t, camera, u) {
        time.value = t; veilTime.value = t;
        renderer.getDrawingBufferSize(bufSize); uBufH.value = bufSize.y; uThin.value = 0.9 / Math.max(bufSize.y, 1);
        // (the offset is bounded and is worked off at a steady rate before the lens comes down among the animals: the herd never stalls or races)
        if (u <= 0) { preview += dt; carry = preview < 5 ? preview - 5 : 4.5 * (1 - Math.exp(-(preview - 5) / 4.5)); }
        // a camera that stands still (u unchanged between frames) does not stop the herd; the moment it moves the clock is the route's again
        if (u > 0 && u === lastU) hold += clamp(t - lastT, 0, 2); else hold = 0;
        lastU = u; lastT = t;
        hero.setClock(hero.clockAt(u) + carry * (1 - clamp(hero.clockAt(u) / tBlend, 0, 1)) + hold);
        hero.setLead(u);
        hero.update(dt, t, camera);
        sky.update(dt, t, camera);
        // wolverine
        const tw = hero.clockAt(u) - hero.clockAt(uDrop), up = 1 - smoothstep(0, 0.4, tw), run = 1 - up, dist = 6.5 * Math.max(0, tw - 0.2), ph = dist * 5.2;
        const wx = wolAt.x + wolDir.x * dist, wz = wolAt.z + wolDir.z * dist, gy = surf(wx, wz);
        wol.position.set(wx, Math.max(gy, wolAt.y - dist * 1.6) + run * 0.08 * Math.abs(Math.sin(ph)), wz);
        wol.rotation.y = lerp(0.65, Math.atan2(wolDir.x, wolDir.z) + TAU, smoothstep(0, 0.5, tw)); wol.visible = dist < 90;
        const pitch = up * 1.25; torso.rotation.x = -pitch + run * 0.14 * Math.sin(ph);
        wHead.rotation.set(pitch * 0.85, up * 0.8 * Math.sin(t * 0.9) + run * 0.1 * Math.sin(t * 2), 0);
        for (let i = 0; i < 4; i++) wLegs[i].rotation.x = (i < 2 ? pitch * 0.7 : pitch) + run * 0.75 * Math.sin(ph + (i < 2 ? 0 : 2.4) + (i & 1) * 0.5);
        updateBirds(t, u);
      },
      dispose() { sky.dispose(); },
    };
  },
};
