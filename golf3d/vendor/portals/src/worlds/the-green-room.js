// THE GREEN ROOM: a ride on the nose of a surfboard through the barrel of one fifteen-metre reef wave.
//
// Treadmill: the hero wave (src/parts/the-green-room.js) travels along +Z with the camera. The camera path is the
// rider's line in the wave's own frame (x, y) laid out along 470 m of world z; the wave's world z is set every frame
// from the path so that the camera sits at the scripted place inside it (lz). Sea, islet, island, clouds and the
// portal stay put in the world and slide past. Over the last 56 m the wave holds still and the camera runs out of
// the mouth, where the portal ring stands (the mouth is steered onto the ring from q = 0.72).
//
// Variations by seed (ctx.vary.hour honoured): gold morning, high noon (white lip, aquamarine wall), late sun from
// the shore side (the curtain burns instead of the lip), full-moon night (bioluminescent foam, drops and wakes).
// Sea: glassy with a tall spindrift plume, light rain, or a bigger, darker swell with a longer pinch. Cast swaps:
// outrigger / fishing skiff, three terns / one pelican, the dolphin pod / a school of giant trevally. Rare event: a five-metre manta carried in the wall with the
// sun directly behind it.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { makeSky, makeCloudField, makeCloudFieldAsync, makeLightRig } from '../kit/sky.js';
import * as Water from '../kit/water.js';
import * as flora from '../kit/flora.js';
import * as F from '../kit/fauna.js';
import { buildHero } from '../parts/the-green-room.js';

const LEN = 470, DUR = 38, ZP = 66, PI = Math.PI;
const D2R = PI / 180;
const keys = (K, q) => {
  if (q <= K[0][0]) return K[0][1];
  for (let i = 1; i < K.length; i++) if (q <= K[i][0]) { const a = K[i - 1], b = K[i]; return lerp(a[1], b[1], smoothstep(a[0], b[0], q)); }
  return K[K.length - 1][1];
};
const bellQ = (q, a, b, f) => smoothstep(a, a + f, q) * (1 - smoothstep(b - f, b, q));

// ---- the rider's line in the wave frame: [q, x, y]  (wall at x = +7, curtain near -7, trough y = 0)
const LINE = [
  [0, -3.5, 13.5], [0.03, -3.4, 13.4], [0.055, -3.0, 12.6], [0.085, -1.6, 8.6], [0.125, 0.3, 3.3], [0.17, -0.5, 2.1], [0.22, 2.8, 6.0], [0.27, 0.2, 2.3],
  [0.33, 2.5, 5.5], [0.40, 4.4, 8.2], [0.47, 4.2, 7.6], [0.53, 3.4, 6.6], [0.60, 4.06, 6.4], [0.66, 4.06, 5.8], [0.72, 2.5, 3.6],   // 0.60 and 0.66 are moved onto the tube axis in build()
  [0.80, 0.5, 3.5], [0.87, -0.8, 5.0], [0.935, -1.15, 6.1], [1, -1.5, 7.2],
];
const LZ = [[0, 0], [0.125, 3], [0.3, 8], [0.48, 10], [0.6, -15], [0.7, -17], [0.83, -14]];
const MOUTH = [[0, -30], [0.03, -30], [0.06, -12], [0.085, 12], [0.125, 50], [0.3, 68], [0.5, 72], [0.62, 52], [0.72, 56]];
const FOAM = [[0, -75], [0.1, -70], [0.2, -50], [0.48, -48], [0.6, -25.5], [0.66, -28], [0.76, -48]];
const CANOE_Z = [[0, 50], [0.12, 70], [0.3, 96], [0.6, 93], [0.8, 94], [1, 98]];
const CANOE_X = [[0, -12.5], [0.12, -15], [0.3, -11.5], [0.7, -12], [0.86, -17], [1, -23]];

function script(q, V, o) {
  const lzEnd = ZP - (1 - q) * LEN;
  o.lz = lerp(keys(LZ, q), lzEnd, smoothstep(0.76, 0.88, q));
  o.zp = (1 - q) * LEN + o.lz;                                        // where the portal stands in the wave frame
  o.mouthZ = Math.min(lerp(keys(MOUTH, q), o.zp, smoothstep(0.72, 0.8, q)), 84);
  o.foamZ = keys(FOAM, q);
  o.pinch = smoothstep(V.pinch[0], V.pinch[0] + 0.07, q) * (1 - smoothstep(V.pinch[1], V.pinch[1] + 0.07, q));
  o.rad = lerp(1, V.rmin, o.pinch);
  o.reveal = smoothstep(0.28, 0.42, q) * (1 - V.dim * o.pinch) * V.reveal;
  o.spit = clamp((q - 0.655) / 0.13, 0, 1);
  o.leap = q < 0.7 ? clamp((q - 0.425) / 0.045, 0, 1.6) : clamp((q - 0.865) / 0.045, 0, 1.6);
  return o;
}

// ---- looks. pal = [deep, teal, jade, aqua, foam, horizon, light]; sun = [elevation, degrees seaward (+X) of +Z]
const HOURS = {
  morning: {
    pal: ['#083040', '#0c5f6e', '#2fc7a0', '#7fd6e0', '#eafff6', '#ffd9a8', '#ffb23e'], sun: [24, 25],
    sky: { preset: 'goldenHour', zenith: '#58c4d0', mid: '#a4dccc', horizon: '#ffd9a8', ground: '#0c5f6e', scatterColor: '#ffb23e', scatter: 0.6, sunColor: '#ffdca6', sunIntensity: 12, sunSize: 1.7 },
    exposure: 1.0, fog: 0.00055, portal: '#ffd27e', tint: '#fff3e0', shadow: '#03222b', bloom: 0.5, wood: '#e9d6ab',
  },
  noon: {
    pal: ['#062c3e', '#0a6676', '#20c6ac', '#8ee6e8', '#f4fffb', '#dcf4ea', '#fff3d2'], sun: [57, 32],
    sky: { preset: 'day', zenith: '#34b0c2', mid: '#7fd6da', horizon: '#dff5ec', ground: '#0a6676', scatterColor: '#fffbe6', scatter: 0.35, sunColor: '#fffaf0', sunIntensity: 13, sunSize: 1.4 },
    exposure: 0.94, fog: 0.00045, portal: '#eafff6', tint: '#f6fffb', shadow: '#02242e', bloom: 0.42, wood: '#eedcb4',
  },
  late: {
    pal: ['#072a36', '#0b5560', '#2ab894', '#7fd0c8', '#f6f4e0', '#ffc88e', '#ff9a3a'], sun: [15, -52],
    sky: { preset: 'goldenHour', zenith: '#54b6b8', mid: '#a8d4b8', horizon: '#ffc88e', ground: '#0b5560', scatterColor: '#ff9a3a', scatter: 0.75, sunColor: '#ffc27a', sunIntensity: 12, sunSize: 1.9 },
    exposure: 1.02, fog: 0.0006, portal: '#ffb866', tint: '#ffefd6', shadow: '#04242a', bloom: 0.55, wood: '#e6cc9c',
  },
  night: {
    pal: ['#020d14', '#06303a', '#0c6e6c', '#2fb8b4', '#aeeaea', '#17474f', '#7ff2e2'], sun: [36, 22],
    sky: { preset: 'night', zenith: '#03141a', mid: '#082e34', horizon: '#1a4f55', ground: '#041a20', sunElevation: -30, scatterColor: '#2a8a84', cloudLit: '#6cc4ba', cloudShade: '#103a42' },
    exposure: 1.2, fog: 0.0008, portal: '#8ff6e6', tint: '#e8fffb', shadow: '#01131a', bloom: 0.62, wood: '#9fb8b0',
  },
};

// =============================================================== shaders
const HASH = /* glsl */`
float h21(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
  return mix(mix(h21(i), h21(i+vec2(1,0)), f.x), mix(h21(i+vec2(0,1)), h21(i+vec2(1,1)), f.x), f.y); }`;

// the board: pale wood, stringer, beads of water. Self-lit from the look's colours (no lamps inside a wave).
const BOARD_VERT = /* glsl */`
varying vec3 vP, vN, vW;
void main(){ vP = position; vN = normalize(mat3(modelMatrix)*normal); vec4 w = modelMatrix*vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`;
const BOARD_FRAG = /* glsl */`
uniform vec3 uSun, uKey, uAmb, uSky, uWood; uniform float uTime;
varying vec3 vP, vN, vW;
${HASH}
void main(){
  vec3 N = normalize(vN), V = normalize(vW - cameraPosition);
  float grain = vn(vec2(vP.x*46., vP.z*1.4))*.6 + vn(vec2(vP.x*140., vP.z*4.))*.4;
  vec3 alb = uWood*(.66 + .46*grain);
  alb = mix(alb, uWood*.3, smoothstep(.013, .006, abs(vP.x)));                  // stringer
  alb = mix(alb, uWood*.45, smoothstep(.2, .9, vn(vec2(vP.x*9., vP.z*.9 + 4.)))*.35);
  float nl = max(dot(N, uSun), 0.);
  vec3 col = alb*(uAmb + uKey*(.14 + .55*nl));
  float fr = pow(1. - max(dot(-V, N), 0.), 4.);
  col = mix(col, uSky, .07 + .55*fr);
  vec2 bp = vP.xz*vec2(52., 40.), bi = floor(bp), bf = fract(bp) - .5;          // beads
  float bh = h21(bi); vec2 bo = (vec2(h21(bi + 3.1), h21(bi + 7.7)) - .5)*.5;
  float bd = length(bf - bo), br = .1 + .17*bh, bead = step(.7, bh)*smoothstep(br, br*.6, bd)*step(0., N.y);
  col = mix(col, col*.6 + uSky*.3, bead);
  col += (uKey*1.6 + uSky*.6)*bead*smoothstep(br*.5, 0., length(bf - bo - vec2(.05, -.06)))*(.55 + .45*sin(uTime*9. + bh*40.));
  col += uKey*pow(max(dot(reflect(V, N), uSun), 0.), 36.)*.7;
  gl_FragColor = vec4(col, 1.);
}`;
// spray fan off the wall-side rail (child of the board, positions in the board's frame)
const SPRAY_VERT = /* glsl */`
attribute vec4 aSeed; uniform float uTime, uAmt;
varying vec2 vUv; varying float vA, vSheet;
void main(){
  vec4 s = aSeed; float sheet = step(s.x, .14);                    // a few big soft streaks make the sheet under the drops
  float life = .3 + .4*s.z; float age = fract(uTime/life + s.w)*life;
  vec3 o = vec3(.19 + .07*s.x, .0, 1.05 + .8*fract(s.x*7.3));
  vec3 v = vec3(1. + 2.2*s.y, .6 + 1.9*s.z*s.y, -(2. + 4.*s.w))*mix(1., .8, sheet);
  vec3 p = o + v*age + vec3(0., -4.9*age*age, 0.);
  vec3 vel = v + vec3(0., -9.8*age, 0.);
  float sz = (.0024 + .0095*s.y*s.y*s.y + .003*fract(s.w*9.1))*(1. + age*1.6);    // sizes spread four to one
  vec4 mv = modelViewMatrix*vec4(p, 1.);
  vec4 m2 = modelViewMatrix*vec4(p + vel*.02, 1.);
  vec2 ax = m2.xy - mv.xy; float al = length(ax); ax = al > 1e-5 ? ax/al : vec2(1., 0.);
  float len = sz*(1.2 + 1.2*s.z) + al*mix(.1, 1.7, sheet), wid = sz*mix(1., 5.5, sheet);
  mv.xy += ax*position.x*len + vec2(-ax.y, ax.x)*position.y*wid;
  vA = uAmt*smoothstep(0., .04, age)*(1. - smoothstep(life*.4, life, age))*mix(.3 + .7*s.z, .09, sheet);
  vUv = position.xy; vSheet = sheet; gl_Position = projectionMatrix*mv;
}`;
const SPRAY_FRAG = /* glsl */`
uniform vec3 uCol; varying vec2 vUv; varying float vA, vSheet;
void main(){
  float d = length(vUv); if (d > 1. || vA < .003) discard;
  float f = mix(pow(1. - d, 1.6), (1. - d)*(1. - d), vSheet);
  gl_FragColor = vec4(uCol*f*vA, 1.);
}`;

// creatures seen through water (turtle under the trough, manta in the wall): drawn only where water is in front
const INWATER_VERT = /* glsl */`
uniform float uTime, uFlap;
varying vec3 vN, vW, vP;
void main(){
  vec3 p = position; float ax = abs(p.x), k = pow(ax/2.6, 1.5);
  float beat = sin(uTime*3.1 - ax*.9);
  p.y += uFlap*(beat*.95 - .25)*k;                                   // wings beat, the wave running out to the tips
  p.x *= 1. - uFlap*.12*k*(beat*.5 + .5);                            // and the tips curl in at the top of the stroke
  float tk = max(0., -1.16 - p.z)*uFlap;                             // whip tail: shorter, trailing in a moving curve
  p.z += tk*.42; p.x += sin(tk*1.5 - uTime*1.6)*.2*tk; p.y += (cos(tk*1.1 - uTime*1.1) - 1.)*.12*tk;
  vP = position;
  vN = mat3(modelMatrix)*normal; vec4 w = modelMatrix*vec4(p, 1.);
  w.xyz += uFlap*vec3(0., sin(w.z*2.1 + uTime*2.9)*.06, sin(w.y*2.6 + uTime*2.4)*.08);   // seen through moving water
  vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w;
}`;
const INWATER_FRAG = /* glsl */`
uniform vec3 uDark, uHalo, uSun; uniform float uAlpha, uFlap;
varying vec3 vN, vW, vP;
void main(){
  vec3 V = normalize(vW - cameraPosition); float nv = abs(dot(normalize(vN + vec3(0., 1e-5, 0.)), V));
  float rim = 1. - nv; rim *= rim;
  float a = smoothstep(0., .2, nv)*.93, edge = 0.;
  if (uFlap > .5) {                                                  // the manta: its outline melts into the water
    float s = clamp(abs(vP.x)/2.6, 0., 1.);
    float zl = 2.3*(.42 - .56*pow(s, 1.35)), zt = 2.3*(-.5 + .375*pow(s, .75));
    float cc = clamp((vP.z - zl)/min(zt - zl, -1e-3), 0., 1.);
    float e = min(min(cc, 1. - cc)*(zl - zt), (1. - s)*2.6);         // metres in from the edge of the wing
    float soft = smoothstep(0., .62, e);
    soft = max(soft, step(vP.z, -1.2)*step(abs(vP.x), .12)*.8);      // the tail
    soft = max(soft, step(.9, vP.z)*.55);                            // cephalic lobes
    a = .74*(.04 + .96*soft); edge = 1. - soft;
    edge = edge*edge*.55 + .3*exp(-(pow(abs(vP.x) - .8, 2.)/.3 + pow(vP.z - .25, 2.)/.22));   // pale shoulder marks
  }
  vec3 col = mix(uDark, uHalo*(.55 + 1.1*max(dot(V, uSun), 0.)), clamp(rim*(1. + uFlap) + edge, 0., 1.));
  gl_FragColor = vec4(col, uAlpha*a);
}`;

// flying fish skittering over the flat water (child of the wave: positions in the wave frame)
const FISH_VERT = /* glsl */`
#include <fog_pars_vertex>
attribute vec4 aSeed; attribute float aShade;
uniform float uTime;
varying float vShade, vVis;
void main(){
  vec4 s = aSeed; float T = 2.2 + 2.8*s.w, c = uTime/T + s.x*9., cyc = floor(c), ph = fract(c);
  float h1 = fract(sin(cyc*12.9898 + s.y*78.233)*43758.5453), h2 = fract(sin(cyc*39.346 + s.z*11.135)*24634.6345);
  vec3 o = vec3(mix(-56., -10., h1*h1), .7, mix(-20., 108., h2));
  float fl = clamp(ph/.46, 0., 1.), ang = (s.y - .5)*1.1, dist = 13. + 12.*s.z, hy = .3 + .75*s.z;
  vec3 dir = vec3(-sin(ang)*.6, 0., cos(ang));
  vec3 c0 = o + dir*dist*fl; c0.y += hy*sin(fl*3.14159);
  float vis = step(ph, .46)*smoothstep(0., .06, fl)*(1. - smoothstep(.94, 1., fl));
  vec3 fw = normalize(dir*dist + vec3(0., hy*3.14159*cos(fl*3.14159), 0.));
  vec3 rt = normalize(cross(vec3(0., 1., 0.), fw)), up = cross(fw, rt);
  vec3 p = position*3.1*vis;
  p.y += abs(p.x)*sin(uTime*46. + s.x*30.)*.22;
  vec4 mvPosition = modelViewMatrix*vec4(c0 + rt*p.x + up*p.y + fw*p.z, 1.);
  vShade = aShade; vVis = vis;
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const FISH_FRAG = /* glsl */`
#include <fog_pars_fragment>
uniform vec3 uBody, uWing;
varying float vShade, vVis;
void main(){
  if (vVis < .01) discard;
  gl_FragColor = vec4(mix(uBody, uWing, vShade), 1.);
  #include <fog_fragment>
}`;

// light rain outside the tube
const RAIN_VERT = /* glsl */`
attribute vec4 aSeed;
uniform float uTime, uHeroZ, uMouthZ;
varying float vA; varying vec2 vUv;
void main(){
  vec3 box = vec3(96., 46., 130.), ctr = cameraPosition + vec3(-26., 8., 38.);
  vec3 fall = normalize(vec3(.12, -1., .05));
  vec3 p = mod(aSeed.xyz*box + fall*uTime*(15. + 5.*aSeed.w) - ctr, box) - box*.5 + ctr;
  float lz = p.z - uHeroZ;
  float inTube = step(-9.5, p.x)*step(p.y, 17.)*step(lz, uMouthZ + 4.);
  float d = distance(p, cameraPosition);
  vec3 side = normalize(cross(fall, p - cameraPosition) + vec3(1e-4, 0., 0.));
  float w = max(.01, d*.0011);
  p += fall*position.y*(.55 + .5*aSeed.w) + side*position.x*w;
  vA = (1. - inTube)*smoothstep(1.5, 5., d)*(1. - smoothstep(48., 66., d))*clamp(.01/w*1.4, .25, 1.);
  vUv = position.xy;
  gl_Position = projectionMatrix*viewMatrix*vec4(p, 1.);
}`;
const RAIN_FRAG = /* glsl */`
uniform vec3 uCol; varying float vA; varying vec2 vUv;
void main(){ if (vA < .004) discard; gl_FragColor = vec4(uCol, vA*.42*(1. - abs(vUv.y))); }`;

// the far volcanic island: one jade silhouette standing in haze
const ISLAND_VERT = /* glsl */`
varying vec3 vN; varying float vY;
void main(){ vN = normalize(mat3(modelMatrix)*normal + vec3(0., 1e-5, 0.)); vY = position.y; gl_Position = projectionMatrix*modelViewMatrix*vec4(position, 1.); }`;
const ISLAND_FRAG = /* glsl */`
uniform vec3 uSun, uLow, uHigh, uHaze, uRim;
varying vec3 vN; varying float vY;
void main(){
  vec3 N = normalize(vN); float lit = clamp(dot(N, uSun)*.7 + .45, 0., 1.);
  vec3 col = mix(uLow, uHigh, lit)*(.72 + .28*smoothstep(0., 700., vY));
  col += uRim*pow(1. - abs(N.y), 2.)*max(dot(N, uSun), 0.)*.4;
  col = mix(col, uHaze, clamp(.36 + .58*exp(-max(vY, 0.)/230.), 0., .97));
  gl_FragColor = vec4(col, 1.);
}`;
// waterfall thread (kind 0) and village smoke (kind 1) on the island
const DETAIL_VERT = /* glsl */`
attribute float aKind; varying vec2 vUv; varying float vK;
void main(){ vec3 p = position; if (aKind > .5) p.x += uv.y*uv.y*120.; vUv = uv; vK = aKind; gl_Position = projectionMatrix*modelViewMatrix*vec4(p, 1.); }`;
const DETAIL_FRAG = /* glsl */`
uniform vec3 uFall, uSmoke; uniform float uTime;
varying vec2 vUv; varying float vK;
${HASH}
void main(){
  float e = 1. - abs(vUv.x*2. - 1.), a; vec3 col;
  if (vK < .5) { float n = vn(vec2(vUv.x*3., vUv.y*36. + uTime*1.7)); a = smoothstep(0., .5, e)*(.5 + .5*n)*smoothstep(1., .9, vUv.y)*.9; col = uFall; }
  else { float n = vn(vec2(vUv.x*3. + 9., vUv.y*5. - uTime*.13))*.6 + vn(vec2(vUv.x*7., vUv.y*11. - uTime*.22))*.4;
    a = smoothstep(.3, .7, n)*e*(1. - vUv.y)*smoothstep(0., .06, vUv.y)*.55; col = uSmoke; }
  gl_FragColor = vec4(col, a);
}`;
// crab-claw sail / pennant: cloth that bellies and flutters, glowing when the sun is behind it
const SAIL_VERT = /* glsl */`
#include <fog_pars_vertex>
uniform float uTime, uBelly;
varying vec2 vUv; varying vec3 vW;
void main(){
  vec3 p = position; float b = sin(uv.x*3.14159)*sin(uv.y*3.14159);
  p.x -= b*uBelly*(1. + .14*sin(uTime*2.3 + uv.y*5.)) + sin(uTime*7.5 + uv.y*13. + uv.x*5.)*.05*uBelly*uv.x*uv.x;
  vUv = uv; vec4 w = modelMatrix*vec4(p, 1.); vW = w.xyz;
  vec4 mvPosition = viewMatrix*w; gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const SAIL_FRAG = /* glsl */`
#include <fog_pars_fragment>
uniform vec3 uSun, uKey, uAmb, uCloth;
varying vec2 vUv; varying vec3 vW;
void main(){
  vec3 N = normalize(cross(dFdx(vW), dFdy(vW)) + vec3(1e-5, 0., 0.)), V = normalize(vW - cameraPosition);
  float nl = abs(dot(N, uSun)), back = pow(max(dot(V, uSun), 0.), 3.);
  float seam = .86 + .14*step(.12, abs(fract(vUv.y*6.) - .5)*2.);
  vec3 col = uCloth*seam*(uAmb + uKey*(.25 + .6*nl + .9*back));
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;
const WAKE_VERT = /* glsl */`
#include <fog_pars_vertex>
varying vec2 vUv;
void main(){ vUv = uv; vec4 mvPosition = modelViewMatrix*vec4(position, 1.); gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const WAKE_FRAG = /* glsl */`
#include <fog_pars_fragment>
uniform vec3 uCol; uniform float uTime;
varying vec2 vUv;
${HASH}
void main(){
  float n = vn(vec2(vUv.x*6., vUv.y*16. + uTime*2.6))*.6 + vn(vec2(vUv.x*15., vUv.y*36. + uTime*4.4))*.4;
  float v = abs(vUv.x*2. - 1.), arm = smoothstep(.22, 0., abs(v - .12 - vUv.y*.8));
  float a = (arm*.85 + (1. - v)*(1. - vUv.y)*.45)*smoothstep(.22, .6, n)*(1. - vUv.y)*smoothstep(0., .03, vUv.y);
  gl_FragColor = vec4(uCol, a*.85);
  #include <fog_fragment>
}`;

// =============================================================== geometry builders
const V3 = THREE.Vector3;
const paint = (g, hex, k = 1) => {
  const c = new THREE.Color(hex).multiplyScalar(k), n = g.attributes.position.count, a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; }
  g.setAttribute('color', new THREE.BufferAttribute(a, 3)); if (g.attributes.uv) g.deleteAttribute('uv'); return g;
};
const box = (x, y, z, sx, sy, sz, hex) => { const g = new THREE.BoxGeometry(sx, sy, sz); g.translate(x, y, z); return paint(g, hex); };
const rod = (a, b, r, hex) => {
  const A = new V3(...a), B = new V3(...b), d = B.clone().sub(A), g = new THREE.CylinderGeometry(r, r, d.length(), 6, 1);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new V3(0, 1, 0), d.clone().normalize()));
  A.add(B).multiplyScalar(0.5); g.translate(A.x, A.y, A.z); return paint(g, hex);
};
function hullGeo(L, beam, depth, sheer, free, hex, x0 = 0, y0 = 0) {
  const NZ = 14, P = [], I = [];
  for (let i = 0; i <= NZ; i++) {
    const t = (i / NZ) * 2 - 1, at = Math.abs(t), w = beam / 2 * Math.pow(Math.max(1 - Math.pow(at, 2.4), 0), 0.6) + 0.015;
    const yt = free + sheer * Math.pow(at, 2.6), yb = -depth * (1 - Math.pow(at, 3)) + (free + sheer) * Math.pow(at, 6);
    const ym = lerp(yb, yt, 0.42), z = t * L / 2;
    P.push(x0 - w, y0 + yt, z, x0 - w * 0.78, y0 + ym, z, x0, y0 + yb, z, x0 + w * 0.78, y0 + ym, z, x0 + w, y0 + yt, z, x0, y0 + yt - 0.06, z);
  }
  for (let i = 0; i < NZ; i++) for (let j = 0; j < 6; j++) { const a = i * 6 + j, b = i * 6 + (j + 1) % 6, c = a + 6, d = b + 6; I.push(a, b, c, b, d, c); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setIndex(I); g.computeVertexNormals();
  return paint(g, hex);
}
function sailGeo(tack, lo, up, leech = 0.22, n = 10) {
  const P = [], UV = [], I = [], T = new V3(...tack), Lo = new V3(...lo), Up = new V3(...up), a = new V3(), b = new V3();
  for (let i = 0; i <= n; i++) for (let j = 0; j <= n; j++) {
    const v = j / n, u = (i / n) * (1 - leech * Math.sin(v * PI));
    a.copy(Lo).lerp(Up, v).sub(T); b.copy(T).addScaledVector(a, u); P.push(b.x, b.y, b.z); UV.push(i / n, v);
  }
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const k = i * (n + 1) + j; I.push(k, k + n + 1, k + 1, k + 1, k + n + 1, k + n + 2); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.setIndex(I);
  return g;
}
function boardGeometry() {
  const NZ = 24, NR = 12, P = [], I = [];
  for (let i = 0; i <= NZ; i++) {
    const z = lerp(-1.3, 2.0, i / NZ), k = clamp((z - 0.1) / 1.9, 0, 1);
    const w = 0.275 * Math.pow(Math.max(1 - Math.pow(k, 2.3), 0), 0.55) + 0.002;
    const rock = 0.13 * Math.pow(clamp((z - 0.5) / 1.5, 0, 1), 2.2), th = 0.034 * (0.3 + 0.7 * Math.min(1, w / 0.2));
    for (let j = 0; j < NR; j++) {
      const a = (j / NR) * PI * 2, c = Math.cos(a), s = Math.sin(a);
      P.push(w * Math.sign(c) * Math.pow(Math.abs(c), 0.6), rock + th * s * (s > 0 ? 1 : 0.7), z);
    }
  }
  for (let i = 0; i < NZ; i++) for (let j = 0; j < NR; j++) { const a = i * NR + j, b = i * NR + (j + 1) % NR, c = a + NR, d = b + NR; I.push(a, b, c, b, d, c); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setIndex(I); g.computeVertexNormals();
  return g;
}
function quadSprites(n, rng) {
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
  const s = new Float32Array(n * 4); for (let i = 0; i < s.length; i++) s[i] = rng();
  g.setAttribute('aSeed', new THREE.InstancedBufferAttribute(s, 4)); g.instanceCount = n;
  g.boundingSphere = new THREE.Sphere(new V3(), 1e5);
  return g;
}
function fishGeometry(n, rng) {
  const P = [], S = [], tri = (a, b, c, sh) => { P.push(...a, ...b, ...c); S.push(sh, sh, sh); };
  const nose = [0, 0, 0.2], tail = [0, 0, -0.2], R = [0.03, 0, 0], L = [-0.03, 0, 0], T = [0, 0.036, 0], B = [0, -0.036, 0];
  for (const [a, b] of [[R, T], [T, L], [L, B], [B, R]]) { tri(nose, a, b, a === T || b === T ? 0.12 : 0.3); tri(tail, b, a, 0.15); }
  for (const sx of [-1, 1]) tri([sx * 0.03, 0, 0.07], [sx * 0.31, 0.02, -0.05], [sx * 0.03, 0, -0.07], 1);
  tri([0, 0, -0.16], [0, 0.07, -0.3], [0, -0.09, -0.31], 0.5);
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aShade', new THREE.Float32BufferAttribute(S, 1));
  const s = new Float32Array(n * 4); for (let i = 0; i < s.length; i++) s[i] = rng();
  g.setAttribute('aSeed', new THREE.InstancedBufferAttribute(s, 4)); g.instanceCount = n;
  g.boundingSphere = new THREE.Sphere(new V3(), 1e5);
  return g;
}
function islandGeometry(rng, noise) {
  const NX = 60, NZ = 40, W = 2300, D = 1500, P = [], I = [];
  const peaks = [[-180, 20, 900, 640], [260, 90, 700, 540], [-540, -90, 540, 460], [640, -40, 440, 420], [40, 280, 400, 620], [-860, 60, 250, 330], [930, 30, 210, 300]]
    .map((p) => [p[0] + rng.range(-70, 70), p[1] + rng.range(-50, 50), p[2] * rng.range(0.85, 1.12), p[3]]);
  for (let j = 0; j <= NZ; j++) for (let i = 0; i <= NX; i++) {
    const x = (i / NX - 0.5) * W, z = (j / NZ - 0.5) * D;
    let h = 0;
    for (const p of peaks) { const d = Math.hypot(x - p[0], (z - p[1]) * 1.25) / p[3]; if (d < 1) h = Math.max(h, p[2] * Math.pow(1 - d, 1.45)) + 0; }
    h *= 0.72 + 0.5 * noise.ridged2(x * 0.0021 + 3, z * 0.0021, 4);
    h += 40 * noise.fbm2(x * 0.006, z * 0.006, 3) * smoothstep(0, 120, h);
    P.push(x, Math.max(h, -4), z);
  }
  for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) { const a = j * (NX + 1) + i, b = a + 1, c = a + NX + 1, d = c + 1; I.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setIndex(I); g.computeVertexNormals();
  return g;
}
function isletGeometry(rng, noise, R) {
  const NR = 10, NS = 30, P = [0, 0, 0], C = [], I = [], hi = new THREE.Color('#f1e2b8'), lo = new THREE.Color('#a89a72'), c = new THREE.Color();
  const hAt = (x, z) => { const r = Math.hypot(x / 1.5, z) / R; return 2.6 * Math.pow(Math.max(1 - r, 0), 1.4) * (1 + 0.25 * noise.n2(x * 0.08, z * 0.08)) - 0.75; };
  P[1] = hAt(0, 0); C.push(hi.r, hi.g, hi.b);
  for (let r = 1; r <= NR; r++) for (let s = 0; s < NS; s++) {
    const a = (s / NS) * PI * 2, rr = (r / NR) * R * (1 + 0.12 * noise.n2(Math.cos(a) * 1.7, Math.sin(a) * 1.7 + 9));
    const x = Math.cos(a) * rr * 1.5, z = Math.sin(a) * rr, y = hAt(x, z);
    P.push(x, y, z); c.copy(lo).lerp(hi, smoothstep(-0.1, 0.7, y)).multiplyScalar(0.8 + 0.2 * noise.n2(x * 0.3, z * 0.3 + 5)); C.push(c.r, c.g, c.b);
  }
  for (let s = 0; s < NS; s++) I.push(0, 1 + (s + 1) % NS, 1 + s);
  for (let r = 1; r < NR; r++) for (let s = 0; s < NS; s++) { const a = 1 + (r - 1) * NS + s, b = 1 + (r - 1) * NS + (s + 1) % NS, cc = a + NS, d = b + NS; I.push(a, b, cc, b, d, cc); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setIndex(I); g.computeVertexNormals();
  g.userData.hAt = hAt;
  return g;
}

// =============================================================== the world
export default {
  id: 'the-green-room',
  name: 'The Green Room',
  category: 'ocean',
  weirdness: 0.05,
  media: ['water', 'open'],
  async build(ctx) {
    const { rng, noise } = ctx, vary = ctx.vary || {}, detail = ctx.quality?.detail ?? 1;
    const scene = new THREE.Scene();
    const col = (h, k = 1) => new THREE.Color(h).multiplyScalar(k);
    const hex = (c) => '#' + c.getHexString();

    // ---------------- which visit is this
    const rHour = rng(), rSea = rng();
    const hourName = { dawn: 'morning', day: 'noon', golden: 'late', night: 'night' }[vary.hour] || (rHour < 0.22 ? 'late' : rHour < 0.44 ? 'noon' : rHour < 0.6 ? 'night' : 'morning');
    const H = HOURS[hourName], night = hourName === 'night';
    let seaName = rSea < 0.4 ? 'glassy' : rSea < 0.66 ? 'rain' : 'big';
    if (night && seaName === 'rain') seaName = 'glassy';
    const rain = seaName === 'rain', big = seaName === 'big';
    const outrigger = rng.chance(0.68), pelican = rng.chance(0.3);
    const trevally = ctx.core.makeRng(ctx.core.hashSeed(ctx.seed + ':cast'))() < 0.28;   // its own stream: the other draws keep their order
    const rare = !!vary.rare, density = vary.density ?? 1;
    const V = { pinch: big ? [0.49, 0.675] : [0.5, 0.66], rmin: big ? 0.4 : 0.42, reveal: big ? (night ? 0.92 : 0.82) : rain ? 0.9 : 1, dim: night ? 0.3 : 0.45 };
    const pal = H.pal.slice();
    if (rain) { pal[6] = hex(col(pal[6]).lerp(col(pal[4]), 0.4)); pal[5] = hex(col(pal[5]).lerp(col('#b9d6cf'), 0.55)); }
    if (big) { pal[0] = hex(col(pal[0], 0.8)); pal[1] = hex(col(pal[1], 0.86)); }
    const el = (H.sun[0] + rng.range(-2, 3)) * D2R, az = (H.sun[1] + rng.range(-4, 4)) * D2R;
    const sunDir = new V3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
    const skyAz = Math.atan2(sunDir.x, -sunDir.z) / D2R, skyEl = Math.asin(sunDir.y) / D2R;

    // ---------------- sky, light, fog
    const skyOpts = { rng, ...H.sky, clouds: false, clouds2: { coverage: 0.3, stretch: 1, opacity: 0.45, lit: pal[4], shade: pal[3] } };
    if (night) Object.assign(skyOpts, { bake: true, renderer: ctx.renderer, clouds2: false, bodyOverrides: { 0: { elevation: skyEl, azimuth: skyAz, size: 2.4 } } });
    else { skyOpts.sunElevation = skyEl; skyOpts.sunAzimuth = skyAz; }
    if (rain) Object.assign(skyOpts, { clouds: { coverage: 0.58, softness: 0.42, lit: '#f3f0e2', shade: '#5f8f90', opacity: 0.9 }, clouds2: false, sunIntensity: 7, zenith: '#7fbcc0' });
    const sky = makeSky(skyOpts); scene.add(sky.object);
    const fogCol = sky.colorAt(new V3(-0.25, 0.025, 1).normalize(), new THREE.Color());
    scene.fog = new THREE.FogExp2(fogCol, H.fog * (rain ? 1.5 : 1));
    const rig = makeLightRig(sky, { bounce: 0.5 }); scene.add(rig.object);
    await ctx.yield();

    // ---------------- the wave
    const seaDeep = col(pal[1]).lerp(col(pal[2]), 0.35).multiplyScalar(0.62);
    const hero = await buildHero(ctx, { palette: pal, sunDir: sunDir.toArray(), reefSpeed: 0, swell: big ? 1.1 : 1, plume: seaName === 'glassy' ? 2.3 : 1.3, rain: rain ? 1 : 0,
      cast: trevally ? 'trevally' : 'dolphin', bio: night ? 0.4 : 0,
      reefColors: hourName === 'noon' ? ['#ffb23e', '#ffd9a8'] : null, sea: hex(seaDeep.clone().lerp(col(pal[2]), night ? 0.12 : 0.3)) });
    scene.add(hero.object);
    const swell = hero.state.swell;
    await ctx.yield();

    // ---------------- the line
    const axisX = 7 - 7 * V.rmin;                                   // the pinched tube's own axis: equal room on both sides
    const path = makePath(LINE.map(([q, x, y]) => [q > 0.59 && q < 0.67 ? axisX : x, q < 0.05 ? y * Math.max(1, swell) : y, q * LEN]));
    const S = {}, P = new V3(), tp = new V3();
    let heroZ = 0;
    const place = (u) => { path.pointAt(u, P); const q = clamp(P.z / LEN, 0, 1); script(q, V, S); heroZ = P.z - S.lz; return q; };
    place(0);

    // ---------------- open sea under and around the wave
    const WL = night ? Water.waterLight(sky, { zenith: '#07282e', mid: '#0d444a', horizon: '#236a6c', scatterColor: '#2f9a92' }) : Water.waterLight(sky);
    const ISLET = new V3(-58 + rng.range(-10, 8), 0, 790 + rng.range(-40, 60));
    const ocean = Water.makeOcean({
      rng: rng.fork('sea'), light: WL, preset: 'calm', level: -0.32, height: big ? 0.16 : 0.1, radius: 3600,
      deep: hex(seaDeep), scatter: pal[2], foamColor: pal[4], shallowColor: pal[3],
      glow: night ? '#0f6e6c' : '#000000', shallows: [{ x: ISLET.x, z: ISLET.z, radius: 66, falloff: 40 }],
    });
    scene.add(ocean.object);
    await ctx.yield();

    // ---------------- trade cumulus in the mouth
    const cl = [];
    for (let i = 0; i < 6; i++) cl.push([lerp(-800, 520, (i + rng()) / 6), rng.range(80, 190), rng.range(1250, 2500), rng.range(230, 430)]);
    const clouds = await makeCloudFieldAsync({ rng, sky, at: cl, height: 0.55, puffs: 40, wind: [1.4, 0, 0.5], silver: 2.4, fogFade: 0.3 }, ctx.yield);
    scene.add(clouds.object);
    await ctx.yield();

    // ---------------- far island: jade spires, a thread of waterfall, village smoke
    const tU = { value: 0 }, uSun = { value: sunDir };
    const island = new THREE.Mesh(islandGeometry(rng.fork('island'), noise), new THREE.ShaderMaterial({
      uniforms: { uSun, uLow: { value: col(pal[0]).lerp(col(pal[2]), 0.22) }, uHigh: { value: col(pal[2], 0.72).lerp(col(pal[6]), night ? 0.05 : 0.14) }, uHaze: { value: fogCol }, uRim: { value: col(pal[6]) } },
      vertexShader: ISLAND_VERT, fragmentShader: ISLAND_FRAG, side: THREE.DoubleSide }));
    island.position.set(-820 + rng.range(-160, 160), 0, 4400); island.rotation.y = rng.range(-0.3, 0.3); island.frustumCulled = false;
    {
      const g = new THREE.BufferGeometry(), quad = (x, y0, y1, z, w, k, P, U, K) => { P.push(x - w, y0, z, x + w, y0, z, x + w, y1, z, x - w, y1, z); U.push(0, 0, 1, 0, 1, 1, 0, 1); K.push(k, k, k, k); };
      const Pp = [], Uu = [], Kk = [];
      quad(-150, 0, 330, -275, 9, 0, Pp, Uu, Kk); quad(330, 4, 250, -610, 38, 1, Pp, Uu, Kk);
      g.setAttribute('position', new THREE.Float32BufferAttribute(Pp, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(Uu, 2)); g.setAttribute('aKind', new THREE.Float32BufferAttribute(Kk, 1));
      g.setIndex([0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7]);
      const dm = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: { uTime: tU, uFall: { value: col(pal[4], night ? 0.5 : 0.92) }, uSmoke: { value: col(pal[4], night ? 0.3 : 0.8).lerp(fogCol, 0.3) } },
        vertexShader: DETAIL_VERT, fragmentShader: DETAIL_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
      dm.frustumCulled = false; dm.renderOrder = 1; island.add(dm);
    }
    scene.add(island);
    await ctx.yield();

    // ---------------- palm islet beyond the mouth
    const sandG = isletGeometry(rng.fork('islet'), noise, 26), hAt = sandG.userData.hAt;
    const sand = new THREE.Mesh(sandG, new THREE.MeshLambertMaterial({ vertexColors: true }));
    sand.position.copy(ISLET); scene.add(sand);
    const wind = flora.makeWind({ direction: [1, 0.25], strength: 1.7, speed: 1.2 });
    await ctx.yield();
    const palmMat = flora.windMaterial({ wind });
    await ctx.yield();
    {
      const geos = [];
      for (let i = 0; i < 8; i++) {
        await ctx.yield();
        const a = rng.range(0, 6.283), r = Math.sqrt(rng()) * 15, x = Math.cos(a) * r * 1.5, z = Math.sin(a) * r;
        const g = flora.palmGeometry({ rng: rng.fork('palm' + i), height: rng.range(11, 15.5), detail: 1, curve: rng.range(0.3, 0.9) });
        g.rotateY(rng.range(0, 6.283)); g.translate(x, hAt(x, z) - 0.25, z); geos.push(g);
      }
      await ctx.yield();
      const merged = mergeGeometries(geos);
      if (merged) { const m = new THREE.Mesh(merged, palmMat); m.position.copy(ISLET); scene.add(m); geos.forEach((g) => g.dispose()); }
      else for (const g of geos) { const m = new THREE.Mesh(g, palmMat); m.position.copy(ISLET); scene.add(m); }
    }
    await ctx.yield();

    // ---------------- outrigger canoe or fishing skiff on the shoulder
    const keyC = col(pal[6], night ? 0.5 : 1.0), ambC = col(pal[3], 0.42).add(col(pal[2], 0.16));
    const boat = new THREE.Group();
    {
      const parts = []; let sailG, belly;
      const wood = night ? 2.2 : 1;
      if (outrigger) {
        parts.push(hullGeo(9, 0.8, 0.5, 0.6, 0.4, '#4a2f1a'), hullGeo(5.6, 0.36, 0.22, 0.2, 0.12, '#5a3a20', 2.5, -0.05),
          rod([0, 0.44, 1.3], [2.5, 0.16, 1.3], 0.07, '#6b4a2a'), rod([0, 0.44, -1.3], [2.5, 0.16, -1.3], 0.07, '#6b4a2a'),
          rod([0, 0.3, 0.9], [0, 5.6, 0.2], 0.1, '#7a5632'), rod([0, 0.7, 3.5], [0, 7.7, -1.3], 0.08, '#7a5632'), rod([0, 0.7, 3.5], [0, 1.7, -4.3], 0.08, '#7a5632'),
          box(0, 0.5, -1.3, 0.5, 0.3, 1.7, '#8a6a3a'));
        sailG = sailGeo([0, 0.75, 3.45], [0, 1.75, -4.2], [0, 7.6, -1.25]); belly = 0.6;
      } else {
        parts.push(hullGeo(6.8, 2.1, 0.55, 0.32, 0.55, '#e4dcc2'), box(0, 1.25, -0.9, 1.3, 1.1, 1.5, '#cfc7ab'), box(0, 1.86, -0.9, 1.7, 0.1, 2.0, '#b9792c'),
          box(0, 0.62, 1.4, 1.5, 0.12, 1.6, '#9a7a4a'), box(0, 0.62, -3.25, 0.36, 0.75, 0.42, '#2a3a3c'),
          rod([0, 1.9, -0.4], [0, 4.3, -0.5], 0.06, '#6b4a2a'), rod([0.6, 0.9, -2.4], [1.7, 2.9, -4.4], 0.05, '#3a2a1a'), rod([-0.6, 0.9, -2.4], [-1.7, 2.9, -4.4], 0.05, '#3a2a1a'));
        sailG = sailGeo([0, 4.3, -0.5], [0, 3.55, -0.52], [0, 3.9, -2.4], 0, 6); belly = 0.1;
      }
      const hullG = mergeGeometries(parts); parts.forEach((g) => g.dispose());
      if (wood !== 1) { const c = hullG.attributes.color.array; for (let i = 0; i < c.length; i++) c[i] = Math.min(c[i] * wood, 1); }
      boat.add(new THREE.Mesh(hullG, new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide })));
      boat.add(new THREE.Mesh(sailG, new THREE.ShaderMaterial({ uniforms: Object.assign(THREE.UniformsUtils.merge([THREE.UniformsLib.fog]), { uTime: tU, uBelly: { value: belly }, uSun, uKey: { value: keyC }, uAmb: { value: ambC.clone().multiplyScalar(1.3) }, uCloth: { value: col('#c98a2e') } }),
        vertexShader: SAIL_VERT, fragmentShader: SAIL_FRAG, side: THREE.DoubleSide, fog: true })));
      const wg = new THREE.PlaneGeometry(outrigger ? 3.6 : 4.6, 26, 1, 8); wg.rotateX(-PI / 2); wg.translate(outrigger ? 0.9 : 0, 0.1, -15.5);
      const wake = new THREE.Mesh(wg, new THREE.ShaderMaterial({ uniforms: Object.assign(THREE.UniformsUtils.merge([THREE.UniformsLib.fog]), { uTime: tU, uCol: { value: col(pal[4], night ? 0.75 : 0.85) } }),
        vertexShader: WAKE_VERT, fragmentShader: WAKE_FRAG, transparent: true, depthWrite: false, fog: true }));
      wake.renderOrder = 2; boat.add(wake);
      boat.traverse((o) => { o.frustumCulled = false; });
    }
    const lane = rng.range(-2.5, 2.5);
    boat.position.set(keys(CANOE_X, 0) + lane, 0.56, heroZ + keys(CANOE_Z, 0));
    scene.add(boat);
    await ctx.yield();

    // ---------------- birds: frigatebirds hanging in the opening, terns (or a pelican) skimming the face ahead
    const fauna = F.makeFauna(scene, { light: F.lightFrom(scene) });
    const white = { body: '#f3f6f2', belly: '#ffffff', wingC: '#e9efec', trail: '#dfe8e4', tip: '#20282a', head: '#f6f6ee', tailC: '#f6f8f6', beak: '#30383a' };
    const darkB = { body: '#1c2a2c', belly: '#2a3a3a', wingC: '#16201f', trail: '#22302f', tip: '#0c1212', head: '#1a2424', tailC: '#141c1c', beak: '#6a7068' };
    const pelB = { body: '#8a7a62', belly: '#d8d0b8', wingC: '#6e6250', trail: '#4a4238', tip: '#2a2622', head: '#efe6c8', tailC: '#6a5e4c', beak: '#d8a85a' };
    if (!night) {
      fauna.add(F.makeFlock({ rng: rng.fork('frigate'), species: 'eagles', count: density > 1.1 ? 3 : 2, size: 2.3, palette: darkB, soarRadius: 8, soarLift: 2.5, spread: [9, 2.5, 9],
        along: { path, side: 4.5, up: 8.2, lead: 80, from: -0.05, to: 0.84 } }));
      fauna.add(F.makeFlock({ rng: rng.fork('terns'), species: 'gulls', count: pelican ? 1 : 3, size: pelican ? 3.4 : 2.0, palette: pelican ? pelB : white,
        spread: [1.6, 1.0, 4], wander: [1.5, 0.7, 0.8, 0.9], bank: 2.4, glide: pelican ? 0.55 : 0.2, amp: pelican ? 0.6 : 0.75, dihedral: 0.3,
        along: { path, side: -3.2, up: pelican ? 2.6 : 2.2, lead: pelican ? 16 : 19, from: 0.1, to: 0.37 } }));
    } else {
      // night: sparks of living light hang in the spray
      fauna.add(F.makeFireflies({ rng: rng.fork('bio'), path, uFrom: 0.02, uTo: 1, count: Math.round(320 * density * detail), spread: 5, lift: [-2.5, 5], clear: 1.2,
        color: hex(col(pal[6], 0.5)), color2: hex(col(pal[3], 0.5)), size: 0.15, blink: 1.6 }));
    }

    // ---------------- flying fish over the flat water (they travel with the wave frame)
    const fish = new THREE.Mesh(fishGeometry(Math.round(48 * density * detail), rng.fork('fish')), new THREE.ShaderMaterial({
      uniforms: Object.assign(THREE.UniformsUtils.merge([THREE.UniformsLib.fog]), { uTime: tU, uBody: { value: col(pal[1], 0.5).lerp(col(pal[4]), 0.3) }, uWing: { value: col(pal[4], 0.7).add(col(pal[6], 0.9)) } }),
      vertexShader: FISH_VERT, fragmentShader: FISH_FRAG, side: THREE.DoubleSide, fog: true }));
    fish.frustumCulled = false; hero.object.add(fish);

    // ---------------- creatures inside the water
    const inWater = (flap) => new THREE.ShaderMaterial({
      uniforms: { uTime: tU, uFlap: { value: flap }, uAlpha: { value: 0 }, uSun, uDark: { value: flap ? col(pal[0], 0.4).lerp(col(pal[2], 0.5), 0.35) : col(pal[0], 0.32) },
        uHalo: { value: col(pal[2], flap ? 0.75 : 0.6).add(col(pal[6], flap ? 0.6 : 0.32)) } },
      vertexShader: INWATER_VERT, fragmentShader: INWATER_FRAG, transparent: true, depthWrite: false, depthFunc: THREE.GreaterDepth, side: THREE.DoubleSide });
    const turtle = new THREE.Mesh(F.turtleGeometry({}), inWater(0));
    turtle.frustumCulled = false; turtle.renderOrder = 2; turtle.scale.setScalar(2.1); hero.object.add(turtle);
    let manta = null;
    if (rare) {
      manta = new THREE.Mesh(F.mantaGeometry({}), inWater(1));
      manta.frustumCulled = false; manta.renderOrder = 2; manta.matrixAutoUpdate = false; hero.object.add(manta);
    }

    // ---------------- our vehicle: the nose of the board and the spray off its wall-side rail
    const board = new THREE.Group(); board.matrixAutoUpdate = false; board.visible = false;
    const skyC = col(pal[5], 0.5).add(col(pal[3], 0.3));
    const boardMesh = new THREE.Mesh(boardGeometry(), new THREE.ShaderMaterial({
      uniforms: { uTime: tU, uSun, uKey: { value: keyC.clone().multiplyScalar(0.85) }, uAmb: { value: ambC }, uSky: { value: skyC }, uWood: { value: col(H.wood) } },
      vertexShader: BOARD_VERT, fragmentShader: BOARD_FRAG, side: THREE.DoubleSide }));
    const sprayU = { uTime: tU, uAmt: { value: 1 }, uCol: { value: col(pal[6], 1.5).add(col(pal[4], 1.0)) } };
    const spray = new THREE.Mesh(quadSprites(Math.round(460 * detail), rng.fork('spray')), new THREE.ShaderMaterial({
      uniforms: sprayU, vertexShader: SPRAY_VERT, fragmentShader: SPRAY_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    boardMesh.frustumCulled = spray.frustumCulled = false; spray.renderOrder = 6;
    board.add(boardMesh, spray); scene.add(board);

    // ---------------- rain
    let rainU = null;
    if (rain) {
      rainU = { uTime: tU, uHeroZ: { value: 0 }, uMouthZ: { value: 0 }, uCol: { value: col(pal[4], 0.8) } };
      const rm = new THREE.Mesh(quadSprites(Math.round(1700 * detail), rng.fork('rain')), new THREE.ShaderMaterial({
        uniforms: rainU, vertexShader: RAIN_VERT, fragmentShader: RAIN_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
      rm.frustumCulled = false; rm.renderOrder = 5; scene.add(rm);
    }
    await ctx.yield();

    // ---------------- gaze
    const gA = new V3(), gB = new V3(), gC = new V3(), gD = new V3();
    const pois = [
      { at: () => gC.copy(boat.position).setY(9), from: 0, to: 0.11, weight: 0.3 },
      // the reveal: turn to the wall, where the nearest of the pod hangs at arm's length (or to the manta on the sun)
      { at: (t, u) => { path.pointAt(u, tp); return rare ? gA.copy(hero.shaftOrigin).setZ(hero.shaftOrigin.z + heroZ - 1.5) : gA.set(7.7, 8.0, tp.z + 5.6); }, from: 0.3, to: 0.52, weight: rare ? 0.6 : 0.62 },
      // the glance back at the foam ball: first to the wall beside us, then on round over the wall-side shoulder
      { at: (t, u) => { path.pointAt(u, tp); return gB.set(tp.x + 9.8, tp.y + 0.5, tp.z + 1.7); }, from: 0.515, to: 0.69, weight: 0.7, fade: 0.4 },
      { at: (t, u) => { place(u); return gD.set(P.x + 0.5, 5.6, heroZ + S.foamZ + 4); }, from: 0.535, to: 0.675, weight: 0.85, fade: 0.3 },
    ];

    // ---------------- per frame
    const T = new V3(), bx = new V3(), by = new V3(), bz = new V3(), tv = new V3(), UP = new V3(0, 1, 0), M = new THREE.Matrix4(), one = new V3(1, 1, 1);
    const update = (dt, time, camera, u) => {
      const q = place(u);
      tU.value = time;
      hero.object.position.z = heroZ;
      hero.setTube({ radius: S.rad, mouthZ: S.mouthZ, foamZ: S.foamZ });
      hero.setReveal(S.reveal); hero.setSpit(S.spit); hero.setLeap(S.leap); hero.setPod(Math.min(S.lz + 3, S.mouthZ - 47)); hero.setTrail(smoothstep(0.14, 0.2, q) * (1 - smoothstep(0.9, 0.97, q))); hero.setScroll(heroZ + time * 4);
      hero.update(dt, time, camera);
      sky.update(dt, time, camera); rig.update(dt, time, camera); clouds.update(dt, time, camera); ocean.update(dt, time, camera);
      flora.updateWind(palmMat, time);
      fauna.update(dt, time, camera, u);
      if (rainU) { rainU.uHeroZ.value = heroZ; rainU.uMouthZ.value = S.mouthZ; }

      // the boat runs along the shoulder just beyond the mouth
      boat.position.set(keys(CANOE_X, q) + lane, 0.56 + 0.06 * Math.sin(time * 1.3), heroZ + keys(CANOE_Z, q) + 2.5 * Math.sin(time * 0.21));
      boat.rotation.set(0.03 * Math.sin(time * 1.1), 0.05 * Math.sin(time * 0.3), 0.05 * Math.sin(time * 0.8 + 1) - (outrigger ? 0.06 : 0));

      // turtle tumbling through the trough at ~10 s
      const ta = bellQ(q, 0.17, 0.34, 0.03);
      turtle.material.uniforms.uAlpha.value = ta; turtle.visible = ta > 0.01;
      if (turtle.visible) { turtle.position.set(-2.9 + 0.5 * Math.sin(time * 0.9), -0.9, S.lz + (0.268 - q) * LEN * 0.4); turtle.rotation.set(time * 1.3, time * 0.8, 0.6 + 0.4 * Math.sin(time * 0.7)); }

      // rare: the manta carried in the wall, sliding onto the sun
      if (manta) {
        const ma = bellQ(q, 0.29, 0.57, 0.04);
        manta.material.uniforms.uAlpha.value = ma; manta.visible = ma > 0.01;
        if (manta.visible) {
          const dz = 13 * (1 - smoothstep(0.3, 0.4, q)) - 2.2 - 11 * smoothstep(0.48, 0.56, q);   // settles just left of the sun disc
          by.copy(sunDir).negate(); bz.set(0, 0.12 * Math.sin(time * 0.6), 1).addScaledVector(by, -by.z).normalize(); bx.crossVectors(by, bz).normalize(); by.crossVectors(bz, bx);
          M.makeBasis(bx, by, bz); tv.copy(hero.shaftOrigin).addScaledVector(sunDir, 3.0); tv.z += dz; tv.y += 0.35 * Math.sin(time * 0.8);
          manta.matrix.copy(M).setPosition(tv); manta.matrixWorldNeedsUpdate = true;
        }
      }

      // the board under the lens: follows the line of travel, not the glance
      board.visible = u > 0;
      if (board.visible) {
        path.tangentAt(u, T);
        bz.set(T.x * 0.7, T.y * 0.6, T.z).normalize(); bx.crossVectors(UP, bz).normalize(); by.crossVectors(bz, bx);
        const roll = 0.5 * smoothstep(2.5, 8.5, P.y) * (1 - smoothstep(0.86, 0.95, q)) * smoothstep(0.1, 0.16, q) + 0.03 * Math.sin(time * 2.1);
        const chat = 0.006 + 0.016 * bellQ(q, 0.02, 0.17, 0.04) + 0.05 * S.spit * (1 - S.spit);
        const cr = Math.cos(roll), sr = Math.sin(roll);
        tv.copy(bx); bx.multiplyScalar(cr).addScaledVector(by, sr); by.multiplyScalar(cr).addScaledVector(tv, -sr);
        const hide = (1 - smoothstep(0, 0.02, u)) * 1.3;
        M.makeBasis(bx, by, bz).setPosition(camera.position.x + 0.1 * sr, camera.position.y - 0.93 - hide + chat * Math.sin(time * 37), camera.position.z + chat * 0.5 * Math.sin(time * 29 + 1));
        board.matrix.copy(M); board.matrixWorldNeedsUpdate = true;
        sprayU.uAmt.value = 0.75 + 0.5 * bellQ(q, 0.02, 0.2, 0.04) + 0.6 * S.spit * (1 - S.spit) * 4 * 0.5;
      }
    };

    await sky.prewarm(ctx.renderer, null, scene);
    return {
      scene, path, duration: DUR,
      title: night ? 'The Green Room by Moonlight' : rain ? 'The Green Room in Rain' : 'The Green Room',
      camera: { fov: 66, near: 0.25, far: 7000, lookAhead: 14, sway: 1, bank: 1.8 },
      pois,
      portal: { shape: 'circle', radius: 7, color: H.portal, glow: 1, revealDistance: 230 },
      post: {
        exposure: H.exposure * (rain ? 1.05 : 1),
        bloom: { strength: H.bloom, radius: 0.7, threshold: 0.92 },
        grade: { saturation: rain ? 1.0 : 1.08, contrast: 1.05, tint: H.tint, shadowTint: H.shadow, vignette: 0.36, grain: 0.02, aberration: 0 },
      },
      ride: 'none',
      update,
      dispose() { sky.dispose?.(); },
    };
  },
};
