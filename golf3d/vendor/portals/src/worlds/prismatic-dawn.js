// THE PRISMATIC EYE (prismatic-dawn): a frosty September dawn in a geyser basin.
//
// World space = the hero's local space: origin at the spring's vent, +X east, -Z north. We enter at (131, 3, 268)
// heading north along the west bank of a warm river, past a bull bison standing side-on on the axis, cows and
// calves on the bank, swans that run and lift off the water, a bull rolling in his wallow and elk on a gravel bar.
// The ridge's shadow line sinks to the ground as the Beehive geyser breaks out; we climb half round its 60 m tower (on its west
// side the tower stands in front of the sun), drop down its lee and fly up the overflow creek at 5 m, over the orange and
// green mats, to the south-west rim: the boil at the blue centre with the sun coming up through its steam. Then across the
// west bay and along the north shelf past bison standing in the vapour, out over the terraced flats where ravens cross,
// round in a climbing loop until the whole Eye lies below, and over the top into a 50 degree dive at the portal above the vent.
//
// Everything that is lit by the dawn shares the hero's uniforms (sun, sky fill, the shadow line uShadowY), so the
// ground, the animals, the pines and the steam all ignite together. Kit pieces: sky, river, rabbitbrush, geese (as swans),
// crows (as ravens), the bison rig (geometry only: the standing herd and the stampede are posed by our own shader). The meadow
// is our own: tussocks planted where the ground shaders paint meadow, lit and coloured like the ground under them.
//
// Seeded looks (ctx.vary.hour is honoured): frost dawn | golden evening (sun in the west) | deep winter dawn with
// snowfall | high summer day | full-moon night. Weather: light north air or a dead-still morning. Cast: swans or
// Canada geese, herd size and fumaroles by ctx.vary.density. Rare (ctx.vary.rare): the stampede at the breakout.
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import { makeSky, skyDirection } from '../kit/sky.js';
import * as T from '../kit/terrain.js';
import * as Water from '../kit/water.js';
import * as flora from '../kit/flora.js';
import * as F from '../kit/fauna.js';
import * as fx from '../kit/fx.js';
import { buildHero, GLSL_COMMON, GLSL_BRAID } from '../parts/prismatic-dawn.js';

const PALETTE = ['#0F5FB4', '#1FA88A', '#F2C62E', '#D4581C', '#C9CCD1', '#FFE9C4', '#1B222E'];
const RV = { x0: 162, zb: 150, k: 90, hw: 17, y: -0.95 };          // the river: see riverD in the hero's GLSL_COMMON

// every look: hero options, sun (elevation, azimuth), kit sky, fog, three.js lights for the kit flora, grade
const LOOKS = {
  dawn: {
    hero: { hour: 'dawn', season: 'autumn' }, sun: [5, 90], line: true, frost: 1, snow: 0,
    sky: { preset: 'dawn', zenith: '#2A4E86', mid: '#7f8cc0', horizon: '#b49aae', ground: '#4c5672', horizonPow: 5, midPow: 2.2, scatterColor: '#ffb476', scatter: 1.0, scatterPow: 2.4, scatterHigh: 0.1,
      sunColor: '#ffd9ac', sunSize: 1.7, sunIntensity: 11, sunGlow: 0.75, stars: 0.03, clouds: false, clouds2: false,
      bodies: [{ elevation: 46, azimuth: 224, size: 1.5, phase: 0.13, phaseAngle: 110, intensity: 1.0, glow: 0.1 }] },
    fog: ['#8796b8', 0.0008], dir: ['#ffd6a4', 6.5], hemi: ['#6F93C8', '#4a5670', 3.2], faunaSun: ['#ffd6a4', 2.6], faunaSky: ['#6F93C8', 1.1],
    grass: ['#8f7a48', '#e9e4d2'], forest: '#1d3a2b', rock: '#8d8478',
    post: { exposure: 0.9, bloom: { strength: 0.3, radius: 0.6, threshold: 0.96 }, grade: { saturation: 1.12, contrast: 1.06, tint: '#fff7ee', shadowTint: '#070d20', vignette: 0.3, grain: 0.02 } },
    portal: '#ffe2b8',
  },
  evening: {
    hero: { hour: 'evening', season: 'autumn' }, sun: [6, 268], line: false, frost: 0.35, snow: 0,
    sky: { preset: 'goldenHour', zenith: '#27437A', mid: '#7f86b4', horizon: '#c9a59a', ground: '#4f4a5c', horizonPow: 4, scatterColor: '#ff9c4c', scatter: 0.9, scatterPow: 3,
      sunElevation: 6, sunColor: '#ffc88c', sunSize: 1.8, sunIntensity: 11, clouds: false, clouds2: false },
    fog: ['#9a93a8', 0.00058], dir: ['#ffc58a', 6.5], hemi: ['#6A86C0', '#5a5262', 3.0], faunaSun: ['#ffc58a', 2.6], faunaSky: ['#6A86C0', 1.0],
    grass: ['#9a7f44', '#e2c98a'], forest: '#21392a', rock: '#96826e',
    post: { exposure: 0.9, bloom: { strength: 0.3, radius: 0.6, threshold: 0.96 }, grade: { saturation: 1.12, contrast: 1.06, tint: '#fff4e6', shadowTint: '#0c0a1c', vignette: 0.3, grain: 0.02 } },
    portal: '#ffd9a8',
  },
  winter: {
    hero: { hour: 'dawn', season: 'winter', steam: 0.55 }, sun: [5, 90], line: true, frost: 1.3, snow: 1,
    sky: { preset: 'dawn', zenith: '#2c4a7e', mid: '#b99ab0', horizon: '#7c8aae', ground: '#66708c', horizonPow: 8, midPow: 3, scatterColor: '#ffc08e', scatter: 0.85, scatterPow: 2.6,
      sunColor: '#ffdcb4', sunSize: 1.7, sunIntensity: 10, clouds: false, clouds2: { coverage: 0.4, opacity: 0.2, lit: '#ffd6c8', shade: '#9c8cae' } },
    fog: ['#93a0be', 0.0009], dir: ['#ffd6a4', 6.0], hemi: ['#7696c8', '#6a7690', 3.0], faunaSun: ['#ffd6a4', 2.6], faunaSky: ['#7696c8', 1.1],
    grass: ['#a39a7c', '#eef0f2'], forest: '#263c34', rock: '#9a958e',
    post: { exposure: 0.92, bloom: { strength: 0.28, radius: 0.6, threshold: 0.97 }, grade: { saturation: 1.06, contrast: 1.05, tint: '#f6f8ff', shadowTint: '#081024', vignette: 0.3, grain: 0.02 } },
    portal: '#ffe2b8',
  },
  day: {
    hero: { hour: 'day', season: 'summer' }, sun: [53, 132], line: false, frost: 0, snow: 0,
    sky: { preset: 'day', zenith: '#2F68C0', horizon: '#BFD8F0', sunElevation: 53, clouds: { coverage: 0.2, opacity: 0.7 }, clouds2: { opacity: 0.25 } },
    fog: ['#a9c2de', 0.0005], dir: ['#fff3dc', 4.6], hemi: ['#86AEE6', '#5c6a4c', 3.1], faunaSun: ['#fff3dc', 2.4], faunaSky: ['#86AEE6', 1.2],
    grass: ['#4f7030', '#a9c05a'], forest: '#1f4428', rock: '#9a8f7c',
    post: { exposure: 0.95, bloom: { strength: 0.25, radius: 0.6, threshold: 0.97 }, grade: { saturation: 1.12, contrast: 1.06, tint: '#ffffff', shadowTint: '#06101e', vignette: 0.3, grain: 0.02 } },
    portal: '#fff0d0',
  },
  night: {
    hero: { hour: 'night', season: 'winter', steam: 0.5 }, sun: [38, 220], line: false, frost: 1.3, snow: 1,
    sky: { preset: 'night', clouds: false, bodyOverrides: { 0: { elevation: 38, azimuth: 220, size: 2.3, phase: 1, intensity: 1.2 } } },
    fog: ['#16233f', 0.0007], dir: ['#a9beea', 2.2], hemi: ['#3a56a0', '#18244a', 1.8], faunaSun: ['#a9beea', 0.8], faunaSky: ['#3a56a0', 0.9],
    grass: ['#6d7484', '#c9d6ee'], forest: '#16263a', rock: '#6c7488',
    post: { exposure: 1.15, bloom: { strength: 0.4, radius: 0.7, threshold: 0.9 }, grade: { saturation: 1.0, contrast: 1.04, tint: '#eef3ff', shadowTint: '#050a1c', vignette: 0.34, grain: 0.025 } },
    portal: '#bcd4ff',
  },
};

// ------------------------------------------------------------------ ground (frosted meadow, sinter, river banks, ridges)
const LAND_VERT = /* glsl */`
varying vec3 vW, vN;
#include <fog_pars_vertex>
void main(){
  vec4 w = modelMatrix*vec4(position, 1.);
  vW = w.xyz; vN = normal;
  vec4 mvPosition = viewMatrix*w;
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const LAND_FRAG = /* glsl */`
varying vec3 vW, vN;
uniform vec3 uCSinter, uCMeadow, uCFrost, uCMoss, uCDark, uCRust, uCOra, uCYel;
uniform vec3 uForest, uRock, uSnowCol, uFum[10], uPots[5], uPools[4];
uniform vec4 uWallow;
uniform float uFrost, uSnow, uWaterY, uEdge;
#include <fog_pars_fragment>
${GLSL_COMMON}
${GLSL_BRAID}
void main(){
  vec2 p = vW.xz;
  float px = max(length(dFdx(p)), length(dFdy(p))), h = vW.y;
  // as in the hero's ground: no detail term outlives its own resolution, and relief shading stays close to the camera
  float mid = 1. - smoothstep(0.6, 3.0, px), rel = 1. - smoothstep(0.10, 0.34, px);
  float n1 = fbm3b(p*0.06 + 3.1, 16.7, px), n2 = fbm3b(p*0.33 + 11., 3.03, px), n3 = bnz(p*2.6, 0.385, px);
  float nA = fbm3(p*0.011 + uSeed.xy), nF = fbm3(p*0.02 + 5.);
  vec3 N = normalize(vN + vec3(0., 1e-4, 0.));
  float up = smoothstep(4., 30., h), slope = 1. - N.y;
  // cured meadow, darker sedge hollows, pale sinter flats, game trails
  vec3 grass = uCMeadow*meadowTone(p, px);
  // from the air the meadow is stippled, not smooth: tussocks a metre apart and sedge clumps four metres apart, each a pale
  // crown with its own small shadow on the side away from the sun; each scale fades to its mean before it can alias
  {
    vec2 tq = p*0.95, ti = floor(tq), tf = tq - ti, to = vec2(hash12(ti), hash12(ti + 7.3))*0.56 + 0.22;
    float k1 = (1. - smoothstep(0.2, 0.55, px))*step(0.22, hash12(ti + 3.1));
    float c1 = 1. - smoothstep(0.12, 0.3, length(tf - to)), s1 = 1. - smoothstep(0.1, 0.32, length(tf - to + uSunXZ*0.2));
    vec2 uq = p*0.24 + 3.7, ui = floor(uq), uf = uq - ui, uo = vec2(hash12(ui + 1.9), hash12(ui + 5.3))*0.5 + 0.25;
    float k2 = (1. - smoothstep(0.9, 2.4, px))*step(0.45, hash12(ui + 9.1));
    float c2 = 1. - smoothstep(0.1, 0.3, length(uf - uo)), s2 = 1. - smoothstep(0.1, 0.34, length(uf - uo + uSunXZ*0.2));
    grass *= 1. + k1*(0.42*c1 - 0.3*s1*(1. - c1)) + k2*(0.3*c2 - 0.34*s2*(1. - c2));
  }
  float sint = smoothstep(0.57, 0.68, nA + (n1 - 0.5)*0.22);
  // the flats round the spring are sinter out to some 300 m, with islands of frosted grass standing on them
  float r0 = length(p);
  float flatM = (1. - smoothstep(215., 315., r0 + (nA - 0.5)*90.))*smoothstep(0.36, 0.5, fbm3(p*0.017 + uSeed.yx + 9.) + 0.3*(1. - smoothstep(120., 210., r0)));
  sint = max(sint, flatM);
  sint *= smoothstep(30., 75., length(vec2(p.x - 128., max(abs(p.y - 212.) - 62., 0.))));     // the bank run is meadow, not a sinter flat
  // summer: green grass against pale sinter. The boundary is broken at tussock scale (clumps three metres and half a metre
  // across) and kept a metre or two wide, so the grass stands on the flats as islands with edges, not as soft green smears
  float eW = clamp(0.07 + px*0.05, 0.07, 0.5);
  sint = mix(sint, smoothstep(0.5 - eW, 0.5 + eW, sint + (n2 - 0.5)*0.55 + (n3 - 0.5)*0.24*mid), uEdge);
  vec3 sinter = uCSinter*(0.64 + 0.32*n1 + 0.10*(n2 - 0.5)*mid);
  sinter = mix(sinter, sinter*vec3(0.78, 0.87, 1.0), (1. - smoothstep(0.22, 0.5, n1))*0.8);
  // terraces: stepped rimstone with a film of water standing behind every lip, and the spring's braided runoff carried on
  // across them in the same strands the hero's sheet draws (same lookup, so they join)
  vec4 ter = terraces(p, px);
  vec2 dirp = p/max(r0, 1e-3);
  vec2 bw = vec2(fbm2(p*0.035 + 21.), fbm2(p*0.035 + 57.)) - 0.5;
  vec2 rq = dirp*21. + vec2(r0*0.085, -r0*0.055) + bw*5. + uSeed.xy;
  vec2 brA = braid(vnoise(rq), vnoise(rq*2.3 + bw*3.5 + 13.));
  float allM = smoothstep(84., 110., r0)*(1. - smoothstep(210., 300., r0))*smoothstep(0.4, 0.62, fbm2(dirp*2.1 + uSeed.xy + 5.))*0.9;
  sinter = mix(sinter, mix(uCOra, uCRust, 0.45)*(0.75 + 0.4*n2), smoothstep(0.45, 0.95, ter.w)*smoothstep(0.3, 0.6, fbm2(p*0.031 + 17.))*0.8*flatM);
  sinter = mix(sinter, sinter*vec3(0.5, 0.78, 0.96) + vec3(0., 0.03, 0.07), ter.y*0.85);
  sinter = mix(sinter, mix(uCRust*1.05, uCOra, brA.y), brA.y*allM*0.8);
  sinter = mix(sinter, mix(uCYel*0.9, vec3(0.75, 0.80, 0.78), 0.5), brA.x*allM*0.85);
  float terK = sint*(1. - brA.y*allM);
  float st = n1*2.75, stf = fract(st), fst = fwidth(st), wst = max(0.1, 2.5*fst);
  sinter *= 1. - 0.25*smoothstep(1. - wst, 1. - wst*0.35, stf)*(1. - smoothstep(1. - clamp(fst, 0.002, 0.3), 1., stf))*(0.1/wst)*(1. - smoothstep(0.12, 0.3, fst))*mid;
  vec3 colr = mix(grass, sinter, sint);
  float tr = 1. - abs(2.*vnoise(p*0.021 + uSeed.zw) - 1.);
  colr = mix(colr, uCMeadow*0.4 + uCDark*0.35, smoothstep(0.94, 0.99, tr)*(1. - sint)*mid*0.6);
  // warm ground: fumarole vents, mud pots, the wallow, the river's banks
  float warm = 0.;
  for (int i = 0; i < 10; i++){
    vec3 f = uFum[i]; float dd = length(p - f.xy);
    warm = max(warm, 1. - smoothstep(f.z*0.4, f.z, dd + (n2 - 0.5)*f.z*0.6));
    float core = 1. - smoothstep(1.0, 3.6, dd + (n2 - 0.5)*1.5);
    colr = mix(colr, uCSinter*(0.5 + 0.4*n2), core*0.9);
    colr = mix(colr, uCDark*1.2, (1. - smoothstep(0.3, 0.9, dd))*0.8);
  }
  // lesser hot pools out on the flats: a blue eye, a turquoise shelf, a yellow lip, orange and rust mats draining away
  float poolW = 0.;
  for (int i = 0; i < 4; i++){
    vec3 f = uPools[i];
    float tq = (length(p - f.xy) + (n2 - 0.5)*f.z*0.22 + (n1 - 0.5)*f.z*0.5)/f.z;
    vec3 pc = mix(vec3(0.05, 0.27, 0.62), vec3(0.14, 0.6, 0.6), smoothstep(0.25, 0.8, tq));
    pc = mix(pc, uCYel, smoothstep(0.82, 0.96, tq));
    pc = mix(pc, uCOra, smoothstep(1.0, 1.2, tq));
    pc = mix(pc, uCRust, smoothstep(1.25, 1.7, tq));
    colr = mix(colr, pc, 1. - smoothstep(1.6, 3.2 + 2.*brA.y, tq));
    poolW = max(poolW, 1. - smoothstep(0.86, 0.98, tq));
    warm = max(warm, 1. - smoothstep(1.4, 3.2, tq));
    terK *= smoothstep(1.5, 2.4, tq);
  }
  for (int i = 0; i < 5; i++){
    vec3 f = uPots[i]; float dd = length(p - f.xy);
    warm = max(warm, 1. - smoothstep(f.z*1.2, f.z*3.2, dd + (n2 - 0.5)*f.z));
    float rimw = 1. - smoothstep(f.z*0.95, f.z*1.5, dd + (n2 - 0.5)*0.8);
    float pot = 1. - smoothstep(f.z*0.8, f.z, dd);
    float bub = 0.5 + 0.5*sin(dd*7. - uTime*2.2 + float(i)*1.7)*sin(uTime*0.9 + float(i)*2.3 + dd);
    colr = mix(colr, uCSinter*0.8, rimw*0.8);
    colr = mix(colr, vec3(0.36, 0.34, 0.33)*(0.7 + 0.45*bub), pot);
  }
  float wl = 1. - smoothstep(uWallow.z*0.55, uWallow.z, length(p - uWallow.xy) + (n2 - 0.5)*2.4);
  colr = mix(colr, vec3(0.20, 0.155, 0.11)*(0.7 + 0.6*n2), wl*0.85);
  float rd = riverD(p);
  float bank = 1. - smoothstep(-0.5, 4.5, rd + (n2 - 0.5)*2.);
  vec3 gravel = mix(vec3(0.10, 0.10, 0.10), vec3(0.36, 0.33, 0.29), bnz(p*3.1, 0.32, px)*0.55 + n2*0.45);
  warm = max(max(warm, wl), 1. - smoothstep(-1., 7., rd + (n1 - 0.5)*6.));
  colr = mix(colr, uCMoss*(0.75 + 0.5*n2), warm*0.8*(1. - sint*0.5)*(1. - wl));
  colr = mix(colr, gravel, bank*0.9);
  colr *= 1. - 0.5*smoothstep(uWaterY + 0.3, uWaterY - 0.05, h)*step(rd, 8.);
  // hoar frost stops dead at the warm halos
  float fr = clamp((1. - warm)*uFrost*(0.28 + 0.35*n1 + 0.25*(1. - sint)), 0., 0.6)*(1. - 0.45*(1. - smoothstep(215., 315., r0))*(1. - sint));
  // ridges: lodgepole forest, pale talus on the steeps, a few open parks
  vec3 forest = uForest*(0.8 + 1.5*fbm3(p*0.09 + 31.))*(0.8 + 0.4*vnoise(p*vec2(0.7, 0.21)));
  float rk = smoothstep(0.30, 0.48, slope + (nF - 0.5)*0.3);
  vec3 ridge = mix(forest, uRock*(0.65 + 0.5*n1), rk);
  ridge = mix(ridge, grass*0.85, smoothstep(0.6, 0.7, nF)*(1. - rk)*0.75);
  colr = mix(colr, ridge, up);
  fr *= 1. - up*0.9;
  colr = mix(colr, uCFrost*(0.80 + 0.15*n3), fr);
  float sn = uSnow*smoothstep(0.2, 0.55, N.y - rk*0.5 + (n1 - 0.5)*0.3)*(1. - warm)*(1. - 0.55*up*(1. - rk));
  colr = mix(colr, uSnowCol*(0.86 + 0.14*n2), sn);
  // light: the hero's sun, gated by the sinking shadow line
  vec2 bmp = (vec2(bnz(p*0.8 + 3., 1.25, px), bnz(p*0.8 + 41., 1.25, px)) - 0.5)*0.07 + (vec2(bnz(p*3.7, 0.27, px), bnz(p*3.7 + 17., 0.27, px)) - 0.5)*0.09;
  N = normalize(N + vec3(bmp.x, 0., bmp.y)*(1. - sn*0.6));
  float lit = sunGate(h);
  float ndl = max(dot(N, uSunDir), 0.), n0 = max(uSunDir.y, 0.);
  float sunT = mix(clamp(min(n0*3. + 0.07, 0.85) + (ndl - n0)*mix(1.5, 3., rel), 0.07, 0.85), ndl*0.85 + 0.03, up);
  float sh = max(castShadow(p, px), geyShadow(p))*(1. - up);
  terK *= 1. - up;
  vec3 E = uSunCol*sunT*lit*(1. - sh*0.92)*max(1. + (ter.x - 1.)*1.6*terK, 0.2) + uSkyCol*(0.8 + 0.2*N.y)*(1. + (ter.x - 1.)*0.35*terK);
  vec3 c3 = colr*E*(1. + 0.9*poolW);
  vec3 V = normalize(cameraPosition - vW);
  float fres = pow(1. - max(V.y, 0.), 5.);
  c3 += (ter.y*terK*0.5 + poolW)*mix(uHorizon, uZenith, clamp(V.y*1.5, 0., 1.))*(0.03 + 0.45*fres)*(0.7 + 0.6*vnoise(p*1.3 + vec2(uTime*0.7, -uTime*0.5)));
  vec2 cell = floor(p*7.);
  float tw = hash12(cell + floor(dot(V.xz, vec2(37., 23.)) + V.y*31.)*vec2(1.3, 2.7));
  c3 += uSunCol*step(0.994, tw)*clamp((fr + sn)*1.6, 0., 1.)*lit*(1. - sh)*(1. - smoothstep(0.07, 0.22, px))*2.0*(1. - up);
  gl_FragColor = vec4(max(c3, 0.), 1.);
  #include <fog_fragment>
}`;

// ------------------------------------------------------------------ animals standing in the cold (bison, elk, swans on the water)
// geometry from the kit's quadruped rig (aAnim: part 1 leg, 2 neck/head, 3 tail; aPivot: joint). Poses per instance:
// 0 stand, 1 graze, 2 wallow (rolling on its back), 3 walk in file, 4 bugle, 5 afloat. No root motion except pose 3.
const BEAST_VERT = /* glsl */`
attribute vec3 color, aPivot;
attribute vec4 aAnim, iPos, iPar, iMove;
attribute float aGlow;
uniform float uH, uGraze, uBugle;
uniform vec4 uRun;
uniform vec2 uGal;
varying vec3 vW, vN, vC;
varying vec2 vK;
#include <fog_pars_vertex>
${GLSL_COMMON}
void main(){
  vec3 p = position, n = normal;
  float sc = iPar.x, pose = iPar.y, seed = iPar.z, part = aAnim.z, t = uTime;
  // pose 6, the gallop (uGal.x 0 standing .. 1 flat out, uGal.y strides in radians per second): fore and hind pairs half a
  // stride apart, lower legs folding on the swing, the body bounding and rocking a few degrees, head low, tail up
  float gal = pose > 5.5 ? uGal.x : 0., gph = t*uGal.y + seed*6.2832;
  if (part > 1.5 && part < 2.5){
    float a = 0.05*sin(t*0.5 + seed*9.) + gal*(0.2 + 0.06*sin(gph*2. + 1.));
    if (pose > 0.5 && pose < 1.5) a += uGraze*(0.84 + 0.16*sin(t*2.3 + seed*5.))*smoothstep(-0.75, -0.45, sin(t*0.23 + seed*40.));
    if (pose > 3.5 && pose < 4.5) a -= uBugle*(0.9 + 0.1*sin(t*3.1));
    a *= aAnim.x;
    vec3 d = p - aPivot; float c = cos(a), s = sin(a);
    d.yz = vec2(d.y*c - d.z*s, d.z*c + d.y*s); n.yz = vec2(n.y*c - n.z*s, n.z*c + n.y*s);
    p = aPivot + d;
  } else if (part > 2.5 && part < 3.5){
    p.x += aAnim.y*aAnim.y*uH*0.14*sin(t*2.1 + seed*11.)*(1. - 0.7*gal);
    float ta = gal*(1.05 + 0.15*sin(gph*2.))*(0.45 + 0.55*aAnim.y);
    vec3 d = p - aPivot; float c = cos(ta), s = sin(ta);
    d.yz = vec2(d.y*c - d.z*s, d.z*c + d.y*s);
    p = aPivot + d;
  } else if (part > 0.5 && part < 1.5){
    float ang = 0., fold = 0.;
    if (pose > 2.5 && pose < 3.5) ang = 0.33*sin(t*iMove.w*3.3 + aAnim.x*6.2832 + seed*13.);
    if (pose > 1.5 && pose < 2.5) ang = 0.55*sin(t*4.3 + aAnim.x*10. + seed);
    if (pose > 5.5){
      float lp = gph + ((aPivot.z > 0. ? 0. : 0.52) + (aPivot.x > 0. ? 0.09 : 0.))*6.2832;
      ang = 0.6*sin(lp)*gal;
      fold = max(cos(lp), 0.)*gal*smoothstep(0.42, 0.6, aAnim.y)*(aAnim.y - 0.42)*1.7*aPivot.y*0.72;
    }
    vec3 d = p - aPivot; float c = cos(ang), s = sin(ang);
    d.yz = vec2(d.y*c + d.z*s, d.z*c - d.y*s);
    d.z -= fold*0.8*(aPivot.z > 0. ? 1. : 0.55); d.y += fold*0.88;
    p = aPivot + d;
  } else {
    p.x *= 1. + 0.02*sin(t*1.9 + seed*7.);
  }
  if (pose > 1.5 && pose < 2.5){
    float r = 1.9 + 0.8*sin(t*1.25 + seed), c = cos(r), s = sin(r);
    vec3 q = p; q.y -= uH*0.62;
    p = vec3(q.x*c - q.y*s, q.x*s + q.y*c + uH*0.38, q.z);
    n = vec3(n.x*c - n.y*s, n.x*s + n.y*c, n.z);
  }
  p.y += gal*(0.045*uH*sin(gph*2.) + p.z*0.085*sin(gph + 1.2));
  vK = vec2(aGlow, clamp(p.y/max(uH, 0.1), 0., 1.5));
  float fl = step(4.5, pose)*step(pose, 5.5);
  sc *= 1. - fl*smoothstep(0.8, 1., uRun.x);
  p *= sc;
  float cy = cos(iPos.w), sy = sin(iPos.w);
  vec3 w3 = vec3(p.x*cy + p.z*sy, p.y, -p.x*sy + p.z*cy) + iPos.xyz;
  n = vec3(n.x*cy + n.z*sy, n.y, -n.x*sy + n.z*cy);
  if (pose > 2.5 && pose < 3.5) w3.xz += iMove.xy*mod(t*iMove.w + seed*31., iMove.z);
  w3.y += fl*0.035*sin(t*1.7 + seed*20.);
  w3.xz += fl*uRun.yz*uRun.w*uRun.x*uRun.x*(0.7 + 0.6*seed);
  vW = w3; vC = color*iPar.w;
  vN = normalize(n + vec3(0., 1e-5, 0.));
  vec4 mvPosition = viewMatrix*vec4(w3, 1.);
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const BEAST_FRAG = /* glsl */`
varying vec3 vW, vN, vC;
varying vec2 vK;
uniform vec3 uCFrost;
uniform float uCoatFrost;
uniform vec2 uCoat;
#include <fog_pars_fragment>
${GLSL_COMMON}
void main(){
  vec3 N = normalize(vN + vec3(0., 1e-5, 0.));
  if (!gl_FrontFacing) N = -N;
  vec3 V = normalize(cameraPosition - vW);
  float nz = fbm3(vW.xz*6. + vW.y*4.);
  // shaggy coat: strands hanging down the forequarters, lighter cape on hump and shoulders
  float fur = vnoise(vec2(vW.x*23. + vW.z*17., vW.y*5.));
  vec3 alb = vC*(0.6 + 0.6*nz + 0.3*(fur - 0.5))*uCoat.x*(1. + 0.5*smoothstep(0.62, 0.95, vK.y)*(1. - uCoat.y));
  float fro = smoothstep(0.1, 0.8, N.y)*smoothstep(0.5, 0.8, vK.y)*uCoatFrost*(0.4 + 0.6*vnoise(vW.xz*19. + vW.y*7.));
  alb = mix(alb, uCFrost*0.9, fro*0.85);
  float lit = sunGate(vW.y);
  float ndl = dot(N, uSunDir);
  vec3 E = uSunCol*clamp(ndl*0.7 + 0.22, 0., 1.)*0.8*lit + uSkyCol*(0.42 + 0.4*N.y);
  vec3 c3 = alb*E;
  float rim = pow(1. - max(dot(N, V), 0.), 2.5);
  float rim2 = rim*rim;
  c3 += uSunCol*mix(rim, rim2*rim2, uCoat.y)*(0.3 + 0.7*max(dot(-V, uSunDir), 0.))*0.16*lit*smoothstep(-0.5, 0.2, ndl);
  c3 += uSkyCol*rim*0.07*(1. - 0.6*uCoat.y);
  // before the sun reaches them the glow of the dawn sky already edges every animal on its sunward side, and once it does
  // the edge burns gold: no beast is a flat dark block
  float sunSide = smoothstep(-0.35, 0.55, dot(N.xz, uSunXZ)), edge = pow(1. - max(dot(N, V), 0.), 1.8);
  c3 += (uHorizon*0.5 + uSunCol*0.07)*edge*sunSide*(1. - 0.6*uCoat.y)*(1. - uNight*0.7)*clamp(0.3 + uSunDir.y*8., 0., 1.);
  c3 += uSunCol*edge*edge*sunSide*lit*0.42*(0.4 + 0.6*max(dot(-V, uSunDir), 0.))*(1. - uCoat.y);
  // the runners: gold along hump and back, a wider warm edge all round
  c3 += uSunCol*vec3(1., 0.8, 0.5)*uCoat.y*(0.9*rim2*rim)*smoothstep(0.05, 0.6, N.y)*smoothstep(0.4, 0.75, vK.y)*lit;
  gl_FragColor = vec4(max(c3, 0.), 1.);
  #include <fog_fragment>
}`;

// ------------------------------------------------------------------ pines (kit conifers on the flats, bare cones on the ridges)
const TREE_VERT = /* glsl */`
attribute vec3 color;
attribute float iRime;
#ifndef CONE
attribute vec4 wind;
#endif
varying vec3 vW, vN, vC;
varying vec2 vUv;
varying vec2 vR;
#include <fog_pars_vertex>
${GLSL_COMMON}
void main(){
  vec4 w = modelMatrix*instanceMatrix*vec4(position, 1.);
  vec3 base = (modelMatrix*instanceMatrix*vec4(0., 0., 0., 1.)).xyz;
  float ph = base.x*0.05 + base.z*0.07;
  #ifndef CONE
  w.xz += (normalize(uWind + vec2(1e-3, 0.))*0.5 + uWind*0.15)*wind.x*(0.5 + 0.5*sin(uTime*1.1 + ph)) + wind.y*0.05*vec2(sin(uTime*3.1 + position.y*2. + ph*3.), cos(uTime*2.7 + ph*2.));
  vR = vec2(iRime, wind.z);
  #else
  vR = vec2(iRime, 0.);
  #endif
  vUv = uv; vC = color; vW = w.xyz;
  vN = normalize(mat3(modelMatrix*instanceMatrix)*normal + vec3(0., 1e-5, 0.));
  vec4 mvPosition = viewMatrix*w;
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const TREE_FRAG = /* glsl */`
varying vec3 vW, vN, vC;
varying vec2 vUv;
varying vec2 vR;
uniform sampler2D map;
uniform vec3 uCFrost;
#include <fog_pars_fragment>
${GLSL_COMMON}
void main(){
  vec3 alb = vC;
  #ifndef CONE
  vec4 tx = texture2D(map, vUv);
  if (vR.y > 0.01 && tx.a < 0.4) discard;
  alb *= mix(vec3(1.), tx.rgb*1.35, step(0.01, vR.y));
  #else
  alb *= 0.6 + 0.8*vnoise(vW.xz*0.35 + vW.y*0.9);
  #endif
  vec3 N = normalize(vN + vec3(0., 1e-5, 0.));
  if (!gl_FrontFacing) N = -N;
  vec3 V = normalize(cameraPosition - vW);
  float rime = vR.x*(0.45 + 0.55*clamp(N.y*0.8 + 0.5, 0., 1.))*(0.6 + 0.4*vnoise(vW.xz*1.7 + vW.y*2.3));
  alb = mix(alb, uCFrost*0.85, clamp(rime, 0., 0.92));
  float lit = sunGate(vW.y);
  float ndl = dot(N, uSunDir);
  vec3 E = uSunCol*clamp(ndl*0.6 + 0.4, 0., 1.)*0.7*lit + uSkyCol*(0.5 + 0.35*N.y);
  vec3 c3 = alb*E;
  c3 += alb*uSunCol*pow(max(dot(-V, uSunDir), 0.), 4.)*0.25*lit;
  gl_FragColor = vec4(max(c3, 0.), 1.);
  #include <fog_fragment>
}`;

// ------------------------------------------------------------------ long blue shadows (one soft streak per animal, drawn over ground and sheet)
const STREAK_VERT = /* glsl */`
attribute vec4 iPos, iMove;
attribute float iSeed;
uniform vec2 uStreak;
varying vec2 vUv;
varying float vA;
#include <fog_pars_vertex>
${GLSL_COMMON}
void main(){
  float along = position.x, across = position.y;
  float L = iPos.w*uShadowLen, W = (0.34*iPos.w + 0.25)*uStreak.y;
  vec2 dir = -uSunXZ, pr = vec2(-dir.y, dir.x);
  vec2 xz = iPos.xz + dir*(along*L - 0.4) + pr*across*W*(1. + along*0.9);
  if (iMove.z > 0.) xz += iMove.xy*mod(uTime*iMove.w + iSeed*31., iMove.z);
  vec4 w = modelMatrix*vec4(xz.x, iPos.y + 0.07, xz.y, 1.);
  vUv = position.xy;
  vA = sunGate(iPos.y + 0.3)*(1. - uNight*0.5)*clamp(uSunDir.y*20., 0., 1.);
  vec4 mvPosition = viewMatrix*w;
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const STREAK_FRAG = /* glsl */`
varying vec2 vUv;
varying float vA;
uniform vec3 uShade;
uniform vec2 uStreak;
#include <fog_pars_fragment>
void main(){
  float e = 1. - vUv.y*vUv.y;
  float a = e*e*smoothstep(0., 0.03, vUv.x)*(1. - smoothstep(0.35, 1., vUv.x))*vA*uStreak.x;
  #ifdef USE_FOG
  float ff = 1. - exp(-fogDensity*fogDensity*vFogDepth*vFogDepth);
  a *= 1. - ff;
  #endif
  if (a < 0.004) discard;
  gl_FragColor = vec4(uShade, a);
}`;

// ------------------------------------------------------------------ where the swans' feet slap the river: a spreading ring
// on the water (a dark trough inside a pale crest, so it reads on bright water and dark alike) and a short white splash above it
const RING_VERT = /* glsl */`
attribute vec4 iRing;             // x, z, age 0..1, strength
uniform float uY;
varying vec2 vUv;
varying vec2 vA;
#include <fog_pars_vertex>
void main(){
  float r = 0.4 + 2.6*sqrt(max(iRing.z, 0.));
  vec4 w = modelMatrix*vec4(iRing.x + position.x*r, uY, iRing.y + position.y*r, 1.);
  vUv = position.xy;
  vA = vec2(iRing.w*pow(max(1. - iRing.z, 0.), 1.5), iRing.z);
  vec4 mvPosition = viewMatrix*w;
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const RING_FRAG = /* glsl */`
varying vec2 vUv;
varying vec2 vA;
uniform vec3 uRingCol;
#include <fog_pars_fragment>
void main(){
  float d = length(vUv), wd = mix(0.45, 0.2, vA.y);
  float band = smoothstep(1. - 2.*wd, 1. - 1.5*wd, d)*(1. - smoothstep(1. - wd*0.4, 1., d));
  float crest = smoothstep(1. - 1.2*wd, 1. - 0.7*wd, d);
  float core = (1. - smoothstep(0., 0.55, d))*(1. - smoothstep(0., 0.4, vA.y));       // the slap itself: a pale boil
  float a = min((band*0.85 + core)*vA.x, 1.);
  if (a < 0.004) discard;
  gl_FragColor = vec4(mix(uRingCol*0.14, uRingCol, max(crest, core)), a);
  #include <fog_fragment>
}`;
const SPLASH_VERT = /* glsl */`
attribute vec4 iRing;
uniform float uY;
varying vec2 vUv;
varying vec2 vA;
#include <fog_pars_vertex>
void main(){
  float k = clamp(iRing.z/0.42, 0., 1.), hs = 0.7 + 0.5*fract(iRing.x*7.31 + iRing.y*3.17);
  float h = 1.25*hs*sin(3.1416*sqrt(k)), wd = (0.3 + 0.55*k)*hs;
  vec4 w = modelMatrix*vec4(iRing.x, uY + (position.y + 1.)*0.5*h, iRing.y, 1.);
  vec4 mvPosition = viewMatrix*w;
  mvPosition.x += position.x*wd;
  vUv = position.xy;
  vA = vec2(iRing.w*(1. - k)*step(0.001, h), k);
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const SPLASH_FRAG = /* glsl */`
varying vec2 vUv;
varying vec2 vA;
uniform vec3 uRingCol;
#include <fog_pars_fragment>
void main(){
  float t = vUv.y*0.5 + 0.5;                                    // 0 at the water, 1 at the top: a fan that opens upward and thins
  float fan = 1. - smoothstep(0.25 + 0.5*t, 0.45 + 0.55*t, abs(vUv.x));
  float a = fan*(1. - smoothstep(0.35, 1., t))*smoothstep(0., 0.08, t)*vA.x*0.9;
  if (a < 0.004) discard;
  gl_FragColor = vec4(uRingCol, a);
  #include <fog_fragment>
}`;

// ------------------------------------------------------------------ the meadow: our own tussocks (two leaning cards each, blades drawn in the shader)
// Lit by the hero's sun, sky and shadow line like the ground under them, and coloured at the root with the ground's own tone,
// so in every look the field reads as one carpet: darker thatch below, cured tips above, hoar frost on the blades when it is cold.
const TUFT_VERT = /* glsl */`
attribute vec3 aC, iCol;
attribute vec4 iPos, iPar;
varying vec2 vUv;
varying vec4 vCol;
varying vec3 vW, vLit;
#include <fog_pars_vertex>
${GLSL_COMMON}
void main(){
  vec2 b = iPos.xz;
  float dc = length(cameraPosition - iPos.xyz);
  float hh = iPar.y*(1. - smoothstep(105., 140., dc));
  vec3 l = vec3(position.x*iPar.x, position.y*hh, position.z*iPar.x);
  float cy = cos(iPos.w), sy = sin(iPos.w);
  vec3 w3 = vec3(l.x*cy + l.z*sy, l.y, -l.x*sy + l.z*cy) + iPos.xyz;
  // wind: gust bands travelling downwind, every tussock shivering on its own
  vec2 wd = uWind + vec2(0.02, 0.3);
  float wl = max(length(wd), 0.05); wd /= wl;
  float band = 0.5 + 0.5*sin(dot(b, wd)*0.21 - uTime*1.7 + 2.*sin(dot(b, vec2(-wd.y, wd.x))*0.05 + uTime*0.2));
  float sway = (0.03 + 0.11*band*band)*min(wl*0.5, 1.2);
  w3.xz += (wd*sway + vec2(sin(uTime*3.7 + iPar.z*40.), cos(uTime*3.1 + iPar.z*31.))*0.012)*aC.y*aC.y*(hh/0.5);
  vUv = aC.xy; vCol = vec4(iCol, iPar.z + aC.z);
  vW = w3;
  vLit = vec3(geyShadow(b), iPar.w, band);
  vec4 mvPosition = viewMatrix*vec4(w3, 1.);
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const TUFT_FRAG = /* glsl */`
varying vec2 vUv;
varying vec4 vCol;
varying vec3 vW, vLit;
uniform vec3 uCFrost;
uniform vec4 uGrass;
uniform float uTFrost, uTAmb, uSnow;
#include <fog_pars_fragment>
${GLSL_COMMON}
// one blade: x in blade spacings from the foot of blade i, v up the card. Positive inside. Each blade has its own height,
// lean and width; wpx (spacings per pixel) fattens blades with distance so a far tussock closes into a soft clump
float blade(float x, float v, float i, float sd, float wpx){
  if (i < 0.5 || i > 7.5) return -1.;
  float h1 = hash12(vec2(i*1.7 + sd*91.3, sd*37.1 + i*0.31)), h2 = hash12(vec2(i*3.1 + sd*53.7, 7. + sd*11.3));
  float t = v/(0.5 + 0.5*h1);
  if (t >= 1.) return -1.;
  float c = (h2 - 0.5)*1.5*t*t + (h1 - 0.5)*0.4;
  return (0.30 + 0.12*h2)*(1. - t*t) + 0.03 + wpx*0.6 - abs(x - c);
}
void main(){
  float sd = vCol.a, bush = step(4., sd);
  float xs = vUv.x*9., v = vUv.y;
  float i0 = floor(xs), f = xs - i0 - 0.5, m;
  float wpx = min(fwidth(xs), 2.);
  // rabbitbrush: 26 twigs fanning out of one foot under a round outline; each forks once, so the dome is a mesh of fine lines
  float xc = vUv.x*2. - 1., dome = sqrt(max(1. - xc*xc, 0.));
  float ts = (xc/(0.25 + 0.75*v))*13. + 13.;
  float tw = min(fwidth(ts), 1.5);
  if (bush > 0.5){
    float ti = floor(ts), tf = ts - ti - 0.5;
    float hh = hash12(vec2(ti*1.7 + sd*31., sd*7.1)), top = dome*(0.72 + 0.28*hh);
    float fork = (hash12(vec2(ti*2.3, sd*13.)) - 0.5)*0.9*smoothstep(0.35, 0.9, v/max(top, 0.05));
    m = min((0.2 + tw*0.7) - min(abs(tf - fork), abs(tf + fork*0.6)), top - v);
    m = min(m, 13. - abs(ts - 13.));
    i0 = ti;
  } else {
    m = max(blade(f, v, i0, sd, wpx), max(blade(f + 1., v, i0 - 1., sd, wpx), blade(f - 1., v, i0 + 1., sd, wpx)));
  }
  if (m < 0.) discard;
  vec3 V = normalize(cameraPosition - vW);
  float lit = sunGate(vW.y)*(1. - vLit.x*0.9);
  float tipK = smoothstep(0.1, 0.95, v);
  float bt = hash12(vec2(i0*5.3 + sd*17.7, sd*3.3));
  vec3 alb = vCol.rgb*mix(vec3(0.8), uGrass.rgb, tipK)*(0.84 + 0.32*bt);
  // hoar frost edges the upper blade; the thatch below keeps its cured gold, so a tussock reads pale over dark
  float fro = clamp(uTFrost*(1. - vLit.y)*mix(0.22, 1.7, tipK), 0., 0.9);
  alb = mix(alb, uCFrost*0.86, fro);
  if (bush > 0.5){
    float hd = step(0.55, hash12(vec2(i0*3.7 + sd*5., floor(v*9.))))*smoothstep(0.5, 0.75, v)*(1. - uSnow);
    alb = mix(alb, vec3(0.8, 0.62, 0.14), hd*(1. - 0.5*fro));
  }
  float back = max(dot(-V, uSunDir), 0.); back *= back;
  // in the ridge's shadow the meadow is cool blue-grey, not sky blue: part of the fill is taken to its own grey
  vec3 amb = mix(uSkyCol, vec3(dot(uSkyCol, vec3(0.2126, 0.7152, 0.0722))), uTAmb);
  vec3 E = uSunCol*(uGrass.w*(0.75 + 0.5*tipK)*(0.8 + 0.4*vLit.z) + 0.34*back*tipK)*lit + amb*(0.7 + 0.3*tipK);
  vec3 c3 = alb*E*mix(mix(0.78, 0.6, uTAmb*2.), 1., smoothstep(0., 0.4, v));
  gl_FragColor = vec4(max(c3, 0.), 1.);
  #include <fog_fragment>
}`;

// CPU copies of the hero's GLSL noise, so the grass can be planted exactly where the ground shaders paint meadow
const fract = (x) => x - Math.floor(x);
const hash12 = (x, y) => { let a = fract(x * 0.1031), b = fract(y * 0.1031), c = a; const d = a * (b + 33.33) + b * (c + 33.33) + c * (a + 33.33); a += d; b += d; c += d; return fract((a + b) * c); };
const vnoise = (x, y) => {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
  const a = hash12(ix, iy), b = hash12(ix + 1, iy), c = hash12(ix, iy + 1), d = hash12(ix + 1, iy + 1);
  return (a + (b - a) * ux) * (1 - uy) + (c + (d - c) * ux) * uy;
};
const gfbm2 = (x, y) => vnoise(x, y) * 0.6667 + vnoise(x * 2.07 + 17.13, y * 2.07 + 17.13) * 0.3333;
const gfbm3 = (x, y) => vnoise(x, y) * 0.5714 + vnoise(x * 2.07 + 17.13, y * 2.07 + 17.13) * 0.2857 + vnoise(x * 4.19 + 41.7, y * 4.19 + 41.7) * 0.1429;

// a swan afloat: built with the kit's creature vertex builder so it takes the same pose shader as the herd
function swanGeometry(body, shade, bill) {
  const g = new F.Geo(), W = new THREE.Color(body), S = new THREE.Color(shade), K = new THREE.Color(bill);
  g.loft([{ z: -0.66, y: 0.32, rx: 0, ry: 0 }, { z: -0.52, y: 0.22, rx: 0.11, ry: 0.13 }, { z: -0.22, y: 0.13, rx: 0.29, ry: 0.24 }, { z: 0.14, y: 0.1, rx: 0.33, ry: 0.25 },
    { z: 0.42, y: 0.12, rx: 0.22, ry: 0.2 }, { z: 0.58, y: 0.17, rx: 0, ry: 0 }], { sides: 9, top: W, belly: S });
  for (const sx of [-1, 1]) g.loft([{ z: -0.6, y: 0.3, x: sx * 0.1, rx: 0, ry: 0 }, { z: -0.3, y: 0.27, x: sx * 0.2, rx: 0.09, ry: 0.13 }, { z: 0.1, y: 0.25, x: sx * 0.24, rx: 0.1, ry: 0.14 }, { z: 0.34, y: 0.22, x: sx * 0.18, rx: 0, ry: 0 }], { sides: 6, top: W, belly: S });
  const n0 = g.n, pts = [], rr = [];
  for (let i = 0; i <= 7; i++) { const t = i / 7; pts.push([0, 0.2 + 0.74 * t, 0.42 + 0.17 * Math.sin(t * Math.PI * 1.15) - 0.03 * t]); rr.push(0.088 - 0.045 * t); }
  g.tube(pts, rr, 6, W, W);
  const top = pts[7];
  g.blob(0, top[1] + 0.02, top[2] + 0.06, 0.055, 0.058, 0.1, W, null, 6, 3);
  g.tube([[0, top[1] + 0.01, top[2] + 0.13], [0, top[1] - 0.04, top[2] + 0.28]], [0.036, 0.012], 4, K, K);
  g.anim([n0, g.n], (x, y) => [Math.min(1, Math.max(0, (y - 0.2) / 0.7)), 0, 2, 0]); g.pivot([n0, g.n], 0, 0.2, 0.42);
  return g.build();
}

// instanced copy of a kit creature geometry with our own per-instance attributes
function herdGeometry(base, list) {
  const g = new THREE.InstancedBufferGeometry(), n = list.length;
  g.index = base.index; for (const k in base.attributes) g.setAttribute(k, base.attributes[k]);
  const iPos = new Float32Array(n * 4), iPar = new Float32Array(n * 4), iMove = new Float32Array(n * 4);
  list.forEach((a, i) => { iPos.set([a.x, a.y, a.z, a.yaw], i * 4); iPar.set([a.scale, a.pose, a.seed, a.tint ?? 1], i * 4); iMove.set(a.move || [0, 0, 0, 0], i * 4); });
  g.setAttribute('iPos', new THREE.InstancedBufferAttribute(iPos, 4)); g.setAttribute('iPar', new THREE.InstancedBufferAttribute(iPar, 4)); g.setAttribute('iMove', new THREE.InstancedBufferAttribute(iMove, 4));
  g.instanceCount = n;
  return g;
}

// where the muzzle of a kit quadruped ends up for a given neck angle (for the breath plumes)
function muzzleOf(base) {
  const P = base.attributes.position, A = base.attributes.aAnim, V = base.attributes.aPivot;
  let best = -1, bz = -1e9;
  for (let i = 0; i < P.count; i++) if (A.getZ(i) > 1.5 && A.getZ(i) < 2.5 && A.getX(i) > 0.95 && P.getZ(i) - P.getY(i) * 0.4 > bz) { bz = P.getZ(i) - P.getY(i) * 0.4; best = i; }
  if (best < 0) return () => [0, 1, 1];
  const p = [P.getX(best), P.getY(best), P.getZ(best)], pv = [V.getX(best), V.getY(best), V.getZ(best)];
  return (ang) => { const dy = p[1] - pv[1], dz = p[2] - pv[2], c = Math.cos(ang), s = Math.sin(ang); return [p[0], pv[1] + dy * c - dz * s, pv[2] + dz * c + dy * s]; };
}

export default {
  id: 'prismatic-dawn',
  name: 'The Prismatic Eye',
  category: 'wilderness',
  weirdness: 0.1,
  media: ['air', 'open'],
  async build(ctx) {
    const { rng, noise } = ctx, { clamp, lerp, smoothstep } = ctx.core;
    const vary = ctx.vary || {}, detail = ctx.quality?.detail ?? 1, density = clamp(vary.density ?? 1, 0.7, 1.3), rare = !!vary.rare;
    const scene = new THREE.Scene();

    // ---- which morning is it?
    const pick = rng.fork('variation')();
    let lookName = pick < 0.45 ? 'dawn' : pick < 0.68 ? 'evening' : pick < 0.84 ? 'winter' : pick < 0.94 ? 'day' : 'night';
    if (vary.hour === 'dawn') lookName = pick < 0.68 ? 'dawn' : 'winter';
    else if (vary.hour === 'day') lookName = 'day';
    else if (vary.hour === 'golden') lookName = 'evening';
    else if (vary.hour === 'night') lookName = 'night';
    const look = LOOKS[lookName], still = rng.fork('weather')() < 0.22, geeseCast = rng.fork('cast')() < 0.45 && (lookName === 'evening' || lookName === 'day');   // white swans in the cold looks
    const SUN = skyDirection(look.sun[0], look.sun[1]).clone().normalize();

    // ---- the flight. The bank run climbs half a percent instead of flying dead level: with the camera's forward exactly horizontal
    // the kit sky's fan apex lands on clip w = 0 and the software rasteriser draws flat gores over everything drawn before the sky.
    // Bank run (eased left past the bull, then in toward the water), rise, half round the tower from east through north to west,
    // down its lee and up the overflow creek, the south-west rim, the west bay, the north shelf, a climbing loop over the
    // northern flats, and the dive from the north-west
    const GX = 111, GZ = 58;
    const pts = [[131, 2.7, 268], [130.5, 2.73, 262.7], [129.2, 2.77, 257], [126.6, 2.81, 250.5], [124.2, 2.86, 244], [123.2, 2.91, 236.5], [123.8, 2.96, 228], [126.4, 3.02, 219], [130, 3.08, 209], [132.6, 3.15, 198], [134, 3.23, 186], [134.8, 3.4, 173], [136.6, 4.4, 150], [144, 6.2, 122], [152, 8.6, 93]];   // the first metres aim at the cone, with the bull just right of that line
    { const R1 = 45, turnH = [12, 15, 18, 21, 24, 27, 30]; for (let i = 0; i <= 6; i++) { const a = i * 30 * Math.PI / 180; pts.push([GX + R1 * Math.cos(a), turnH[i], GZ - R1 * Math.sin(a)]); } }
    pts.push([66.3, 29, 73], [63, 23.5, 89], [50.5, 14.5, 100], [30.5, 8, 103.5], [9, 5.3, 98], [-10, 4.7, 90], [-24, 4.5, 76], [-35, 4.5, 60], [-45, 4.6, 44], [-52.5, 4.7, 28],
      [-56, 4.7, 9], [-51, 4.6, -10], [-39, 4.5, -28], [-21, 4.5, -42], [0, 4.6, -48.5], [22, 5.6, -49.5],
      [43, 9.5, -47], [62, 16, -53], [75.5, 24, -69], [78, 32.5, -89.5], [67.5, 41, -108], [46, 49, -120], [20, 56, -122.5], [-6, 62.5, -116], [-29, 68.5, -103], [-46.5, 73.5, -85], [-55, 76.5, -67], [-53, 77.5, -55]);
    const DIVE = (() => { const c = Math.cos(50 * Math.PI / 180), sn = Math.sin(50 * Math.PI / 180), h = Math.SQRT1_2; return new THREE.Vector3(c * h, -sn, c * h); })();
    pts.push([-47, 76, -46.5]);
    for (const back of [80, 54, 27, 0]) pts.push([-DIVE.x * back, 9 - DIVE.y * back, -DIVE.z * back]);
    const path = makePath(pts), LEN = path.length, M = (m) => m / LEN;      // every moment below is keyed in metres along the route
    await ctx.yield();

    // ---- the hero: the Eye and its geyser, unrotated at the origin
    const SURGE = [M(127), M(182)];
    const hero = await buildHero(ctx, { palette: PALETTE, ...look.hero, weather: still ? 'still' : 'breeze', sunDir: [SUN.x, SUN.y, SUN.z], surge: SURGE, river: [RV.x0, RV.zb, RV.k, RV.hw], route: pts, snagCount: Math.round(44 * clamp(detail, 0.6, 1)) });
    scene.add(hero.object);
    const HU = hero.uniforms, A = hero.anchors, gx = A.geyser.base[0], gz = A.geyser.base[2], fd = A.fan.direction, wind = A.wind;
    await ctx.yield();
    const seat = new THREE.Vector3(0, 9, 0);

    // ---- helpers shared by the ground, the plants and the animals
    const riverX = (z) => { const s = Math.max(0, RV.zb - z); return RV.x0 + s * s / (s + RV.k); };
    const riverD = (x, z) => { const s = Math.max(0, RV.zb - z), q = s + RV.k, dx = (s * s + 2 * s * RV.k) / (q * q); return Math.abs(x - riverX(z)) / Math.sqrt(1 + dx * dx) - RV.hw; };
    // rough signed distance (m) to the edge of the hero's ground sheet: < 20 opaque sinter and mats, > 40 open meadow
    const sheet = (x, z) => { const a = x * fd[0] + z * fd[1], c = -x * fd[1] + z * fd[0]; return Math.min(Math.hypot(x, z) - 116, Math.hypot(x - gx, z - gz) - 46, Math.max(Math.abs(c) - (12 + Math.max(a, 0) * 0.24), a - 205, -a)); };
    const BAR = { x: riverX(151) - RV.hw + 4.5, z: 151 };       // the elk's gravel bar, tight under the west bank where the bank run ends
    const landH = (x, z) => {
      const rd = riverD(x, z), sh = sheet(x, z);
      let h = -0.34 + 0.05 * noise.n2(x * 0.02, z * 0.02);
      // the flight starts over the lip of an old back-channel: the entry portal's disc reaches 4.3 m below the start, and without
      // this drop its lower third would look in under the meadow
      if (z > 250) h -= 4.9 * Math.min(1, (z - 250) / 15) * (1 - smoothstep(134.5, 141, x)) * smoothstep(40, 95, x);
      h += smoothstep(45, 150, sh) * smoothstep(6, 40, rd) * (0.55 + 0.75 * noise.fbm2(x * 0.006 + 7, z * 0.006, 3));
      const e = Math.hypot((x + 60) / 800, (z - 60) / 600) + 0.1 * noise.fbm2(x * 0.0012, z * 0.0012 + 5, 3);
      const rim = smoothstep(0.86, 1.4, e);
      if (rim > 0) {
        const saddle = 1 - 0.84 * Math.exp(-Math.pow((z - 110) / 300, 2));        // low passes due east and west: the sun clears them
        const big = 150 + 85 * noise.fbm2(x * 0.0015 + 3, z * 0.0015 + 9, 4);
        h += rim * big * saddle * (0.3 + 0.7 * smoothstep(30, 300, rd)) + rim * 16 * noise.fbm2(x * 0.007, z * 0.007 + 2, 3) * Math.min(1, saddle + 0.3);
      }
      const t = smoothstep(3.5, -2.5, rd);
      if (t > 0) { const bar = 1.38 * Math.exp(-Math.pow((x - BAR.x) / 5.5, 2) - Math.pow((z - BAR.z) / 17, 2)); h = lerp(h, -1.8 + bar + 0.12 * noise.n2(x * 0.15, z * 0.07), t); }
      return h;
    };
    let meshH = null;                                           // the land mesh's own surface (set once it is built): plants on the back-channel's slope follow it exactly
    const groundH = (x, z) => (meshH && z > 240 ? meshH(x, z) : landH(x, z));
    const inGully = (x, z) => z > 244 && x > 30 && x < 146;
    const veg = (x, z) => lerp(-0.02, groundH(x, z), Math.max(smoothstep(20, 40, sheet(x, z)), smoothstep(3, 0.5, riverD(x, z))));     // what plants and hooves stand on

    // ---- sky, fog, the two lights the kit plants need (everything else is lit by the hero's uniforms)
    const sky = makeSky({ rng, bake: true, renderer: ctx.renderer, ...look.sky, sunElevation: lookName === 'night' ? -30 : look.sun[0], sunAzimuth: look.sun[1] });
    scene.add(sky.object);
    await ctx.yield();
    scene.fog = new THREE.FogExp2(new THREE.Color(look.fog[0]), look.fog[1]);
    const hemi = new THREE.HemisphereLight(new THREE.Color(look.hemi[0]), new THREE.Color(look.hemi[1]), look.hemi[2]);
    const sun = new THREE.DirectionalLight(new THREE.Color(look.dir[0]), look.dir[1]);
    sun.position.copy(SUN).multiplyScalar(300); scene.add(hemi, sun, sun.target);
    const C = hero.colors;
    if (look.snow) C.meadow.lerp(new THREE.Color('#c9d2e0'), 0.2);
    if (lookName === 'day') C.meadow.set('#637a3c');            // a summer meadow, not a lawn
    const fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
    const mk = (vs, fs, uni = {}, extra = {}) => new THREE.ShaderMaterial({ uniforms: { ...fogU(), ...HU, ...uni }, vertexShader: vs, fragmentShader: fs, fog: true, ...extra });

    // ---- fumaroles, mud pots, the wallow: placed first, the ground shader draws their halos
    const onPath = (x, z) => path.nearestXZ(x, z).dist;
    const fum = [], nFum = Math.round(clamp(8 * density, 6, 10)), fr = rng.fork('fumaroles');
    fum.push({ x: 116 + fr.range(-2, 2), z: 146 + fr.range(-3, 3), r: 9, big: 0.8 });            // the one on the entry axis, lit above the shadow line
    fum.push({ x: 92 + fr.range(-6, 6), z: 232 + fr.range(-8, 8), r: 8, big: 0.8 });
    for (let tries = 0; tries < 500 && fum.length < nFum; tries++) {
      const a = fr.range(0, 6.283), d = fr.range(150, 420), x = Math.cos(a) * d, z = Math.sin(a) * d + 40;
      if (sheet(x, z) < 55 || riverD(x, z) < 14 || onPath(x, z) < 45 || inGully(x, z) || fum.some((f) => Math.hypot(f.x - x, f.z - z) < 70) || Math.hypot(x, z) < 300) continue;
      fum.push({ x, z, r: fr.range(7, 13), big: fr.range(0.7, 1.4) });
    }
    const pots = [];
    for (let tries = 0; tries < 400 && pots.length < 5; tries++) {
      const x = fr.range(40, 124), z = fr.range(205, 330), r = fr.range(1.5, 2.5);
      if (sheet(x, z) < 50 || onPath(x, z) < 18 + r || inGully(x, z) || pots.some((f) => Math.hypot(f.x - x, f.z - z) < 14) || fum.some((f) => Math.hypot(f.x - x, f.z - z) < 16)) continue;
      pots.push({ x, z, r });
    }
    // a warm seep left of the bank run: a frost-free green halo in the blue meadow, with a wisp of steam (no random draws)
    const SEEP = { x: 128.4, z: 190, r: 6.4, big: 0.22 };
    if (fum.length < 10) fum.push(SEEP); else fum[9] = SEEP;
    const WALLOW = { x: 120.5, z: 201, r: 4.2 };
    // lesser hot pools out on the flats (the first lies ahead as we come off the north shelf)
    const POOLS = [{ x: 70, z: -185, r: 11 }, { x: -158, z: -112, r: 8 }, { x: -178, z: 62, r: 9 }, { x: -52, z: 196, r: 7.5 }];
    const far = new THREE.Vector3(1e5, 1e5, 1);
    const landU = {
      uFum: { value: Array.from({ length: 10 }, (_, i) => (fum[i] ? new THREE.Vector3(fum[i].x, fum[i].z, fum[i].r) : far.clone())) },
      uPots: { value: Array.from({ length: 5 }, (_, i) => (pots[i] ? new THREE.Vector3(pots[i].x, pots[i].z, pots[i].r) : far.clone())) },
      uWallow: { value: new THREE.Vector4(WALLOW.x, WALLOW.z, WALLOW.r, 0) }, uPools: { value: POOLS.map((q) => new THREE.Vector3(q.x, q.z, q.r)) },
      uForest: { value: new THREE.Color(look.forest) }, uRock: { value: new THREE.Color(look.rock) }, uSnowCol: { value: new THREE.Color('#d9e1ee') },
      uSnow: { value: look.snow }, uWaterY: { value: RV.y }, uEdge: HU.uEdge,
    };
    HU.uFrost.value = look.frost * 0.55; C.sinter.multiplyScalar(0.78);

    // ---- the land: one warped grid, 3 m cells under the flight, 80 m on the ridges
    {
      const N = 176, cx = 115, cz = 120, a = 250, b = 2350, half = N / 2;
      const pos = new Float32Array((N + 1) * (N + 1) * 3), idx = new Uint32Array(N * N * 6);
      const ax = (i) => { const t = (i - half) / half; return a * t + b * t * t * t; };
      for (let j = 0, k = 0; j <= N; j++) {
        const z = cz + ax(j);
        for (let i = 0; i <= N; i++, k += 3) { const x = cx + ax(i); pos[k] = x; pos[k + 1] = landH(x, z); pos[k + 2] = z; }
        if ((j & 3) === 3) await ctx.yield();                  // every fourth row
      }
      for (let j = 0, k = 0; j < N; j++) for (let i = 0; i < N; i++, k += 6) { const p0 = j * (N + 1) + i, p1 = p0 + 1, p2 = p0 + N + 1, p3 = p2 + 1; idx[k] = p0; idx[k + 1] = p2; idx[k + 2] = p1; idx[k + 3] = p1; idx[k + 4] = p2; idx[k + 5] = p3; }
      await ctx.yield();
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(new THREE.BufferAttribute(idx, 1));
      // normals from the grid's own neighbours, a few rows at a time (computeVertexNormals on 62k triangles is one long step)
      const nor = new Float32Array(pos.length), M = N + 1;
      for (let j = 0; j <= N; j++) {
        const j0 = Math.max(0, j - 1) * M, j1 = Math.min(N, j + 1) * M;
        for (let i = 0; i <= N; i++) {
          const a0 = (j * M + Math.max(0, i - 1)) * 3, a1 = (j * M + Math.min(N, i + 1)) * 3, b0 = (j0 + i) * 3, b1 = (j1 + i) * 3;
          const ux = pos[a1] - pos[a0], uy = pos[a1 + 1] - pos[a0 + 1], uz = pos[a1 + 2] - pos[a0 + 2], vx = pos[b1] - pos[b0], vy = pos[b1 + 1] - pos[b0 + 1], vz = pos[b1 + 2] - pos[b0 + 2];
          const nx = vy * uz - vz * uy, ny = vz * ux - vx * uz, nz = vx * uy - vy * ux, nl = Math.hypot(nx, ny, nz) || 1, k = (j * M + i) * 3;
          nor[k] = nx / nl; nor[k + 1] = ny / nl; nor[k + 2] = nz / nl;
        }
        if ((j & 31) === 31) await ctx.yield();
      }
      g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
      await ctx.yield();
      const land = new THREE.Mesh(g, mk(LAND_VERT, LAND_FRAG, landU)); land.renderOrder = -8; land.frustumCulled = false; scene.add(land);
      const axs = Float32Array.from({ length: N + 1 }, (_, i) => ax(i));
      const cell = (v) => { let lo = 0, hi = N - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (axs[m] <= v) lo = m; else hi = m - 1; } return lo; };
      meshH = (x, z) => {
        const i = cell(x - cx), j = cell(z - cz), fx = clamp((x - cx - axs[i]) / (axs[i + 1] - axs[i]), 0, 1), fz = clamp((z - cz - axs[j]) / (axs[j + 1] - axs[j]), 0, 1);
        const k = (j * (N + 1) + i) * 3 + 1, h0 = pos[k], h1 = pos[k + 3], h2 = pos[k + (N + 1) * 3], h3 = pos[k + (N + 2) * 3];
        return fx + fz <= 1 ? h0 + (h1 - h0) * fx + (h2 - h0) * fz : h3 + (h2 - h3) * (1 - fx) + (h1 - h3) * (1 - fz);
      };
    }
    await ctx.yield();
    const ridges = T.makeHorizonRidges({ rng: rng.fork('ridges'), layers: 3, radius: [1900, 3500], height: [55, 135], base: -30, fog: scene.fog, sunDir: SUN, sunColor: look.dir[0], sunIntensity: lookName === 'night' ? 0.25 : 0.9,
      colorNear: lookName === 'night' ? '#0e1830' : '#33455f', snow: look.snow ? true : '#c4cfe2', snowLine: look.snow ? 0.3 : 0.72, rim: 0.3, coverage: 0.8 });
    scene.add(ridges.object);
    await ctx.yield();

    // ---- the warm river and its mist
    const rpts = []; for (let z = 640; z >= -600; z -= 40) rpts.push([riverX(z), RV.y, z]);
    const river = Water.makeRiver({ rng: rng.fork('river'), points: rpts, width: RV.hw * 2 + 1.5, speed: 1.5, segments: 330, across: 10, light: sky, ...(look.line ? { zenith: '#3f5c98', mid: '#4a63a0', horizon: '#6a78a0', scatter: 0.2 } : lookName === 'evening' ? { zenith: '#3c4d84', mid: '#5c5c90', horizon: '#a47c84', scatter: 0.4 } : {}), deep: lookName === 'night' ? '#0a1626' : '#3a7c8c', shallow: lookName === 'night' ? '#4f8a8e' : '#7fbdb6',
      foam: 0.25, bankFoam: 0.35, ripple: 0.9, opacity: 0.82, bankFade: 2.2, chop: 0.05 });
    scene.add(river.object);
    await ctx.yield();

    // ---- plants: cured, frosted grass and rabbitbrush along the bank run
    const windF = flora.makeWind({ direction: [wind[0] || 0.1, wind[1] || 1], strength: still ? 0.35 : 0.9, speed: 1 });
    await ctx.yield();
    const floraOpts = { wind: windF, backlight: 0.7, backlightTint: '#ffe2a0' };
    await flora.prepareLeafTexture(floraOpts, ctx.yield);
    const floraMat = flora.windMaterial(floraOpts);
    await ctx.yield();
    const bare = (x, z) => {
      if (Math.hypot(x - WALLOW.x, z - WALLOW.z) < WALLOW.r * 0.8) return true;
      for (const f of fum) if (Math.hypot(f.x - x, f.z - z) < 3.5) return true;
      for (const f of pots) if (Math.hypot(f.x - x, f.z - z) < f.r * 1.5) return true;
      return false;
    };
    const plantOK = (x, z) => (riverD(x, z) < 1.5 || bare(x, z) ? 0 : smoothstep(-4, 22, sheet(x, z)));
    // the ground sheet's ragged edge exactly as its shader draws it (sR in the hero's GROUND_FRAG), and the meadow that starts there
    const US = HU.uSeed.value, UF = HU.uFan.value;
    const sheetR = (x, z) => {
      const r = Math.hypot(x, z), k = smoothstep(6, 60, r);
      const d = r + (gfbm3(x * 0.021 + US.x, z * 0.021 + US.y) - 0.5) * 15 * k + (gfbm2(x * 0.085 + US.z, z * 0.085 + US.w) - 0.5) * 5 * k * k;
      const a = x * UF.x + z * UF.y, c = -x * UF.y + z * UF.x;
      const nA = gfbm3(x * 0.013 + US.z * 1.7, z * 0.013 + US.w * 1.7), nB = vnoise(x * 0.07 + 9, z * 0.07 + 9);
      return Math.min(d - 116, Math.hypot(x - gx, z - gz) - 46, Math.max(Math.abs(c) - (12 + Math.max(a, 0) * 0.24), a - 205, -a)) + (nA - 0.5) * 30 + (nB - 0.5) * 10;
    };
    const meadowAt = (x, z) => (riverD(x, z) < 1 ? 0 : smoothstep(-2, 9, sheetR(x, z)));
    // tussocks: thick under the flight, thinning and coarsening outward; none where the shaders paint sinter, mats, river or wallow
    const tipGain = look.frost > 0.5 ? [1.45, 1.42, 1.3] : lookName === 'day' ? [1.08, 1.06, 0.8] : [1.34, 1.22, 0.9];
    const tuftU = { uGrass: { value: new THREE.Vector4(tipGain[0], tipGain[1], tipGain[2], Math.min(3 * SUN.y + 0.07, lookName === 'day' ? 0.44 : 0.6)) }, uTFrost: { value: look.frost * 0.55 * (look.frost > 0.5 ? 1 : 0.4) }, uTAmb: { value: look.frost > 0.5 && lookName !== 'night' ? 0.5 : 0.12 }, uSnow: { value: look.snow ? 1 : 0 } };
    let tuftMat = null;
    {
      const gr = rng.fork('grass'), sEnd = 217, K = detail * (0.85 + 0.15 * density), P = new THREE.Vector3(), Tn = new THREE.Vector3();
      const nS = Math.ceil(sEnd) + 10, fxs = new Float32Array(nS + 1), fzs = new Float32Array(nS + 1), ftx = new Float32Array(nS + 1), ftz = new Float32Array(nS + 1);
      for (let i = 0; i <= nS; i++) { path.posAtDist(i - 8, P); path.tangentAtDist(i - 8, Tn); const tl = Math.hypot(Tn.x, Tn.z) || 1; fxs[i] = P.x; fzs[i] = P.z; ftx[i] = Tn.x / tl; ftz[i] = Tn.z / tl; }
      const sets = [{ iPos: [], iPar: [], iCol: [] }, { iPos: [], iPar: [], iCol: [] }], snowC = new THREE.Color('#d9e1ee'), tc = new THREE.Color();
      const zones = [[0, 6, 6.4, 1], [6, 14, 3.0, 1.05], [14, 34, 1.3, 1.2], [34, 92, 0.3, 1.6]];   // [from m, to m, tufts per m2, size]
      let tried = 0;
      for (const [l0, l1, dens, big] of zones) {
        const { iPos, iPar, iCol } = sets[l0 < 14 ? 0 : 1];
        const n = Math.round((sEnd + 8) * (l1 - l0) * 2 * dens * K);
        for (let i = 0; i < n; i++) {
          const s = gr.range(0, sEnd + 8), lat = (gr() < 0.5 ? -1 : 1) * gr.range(l0, l1), yaw = gr.range(0, 6.283), sd = gr(), w = gr.range(0.78, 1.12), hgt = gr.range(0.4, 0.62), keep = gr();
          if ((++tried & 63) === 0) await ctx.yield();
          const k = Math.min(nS - 1, Math.floor(s)), fk = s - k, x = fxs[k] + (fxs[k + 1] - fxs[k]) * fk - ftz[k] * lat, z = fzs[k] + (fzs[k + 1] - fzs[k]) * fk + ftx[k] * lat, rd = riverD(x, z);
          if (rd < 1.2 || bare(x, z)) continue;
          // along the end of the bank run the meadow laps 12 m out over the sheet's fringe, so the flight keeps grass under it in every seed
          const sR = sheetR(x, z) + 12 * smoothstep(106, 117, x) * smoothstep(148, 160, z), grow = smoothstep(-2, 9, sR);
          if (grow < 0.12) continue;
          if (1 - Math.abs(2 * vnoise(x * 0.021 + US.z, z * 0.021 + US.w) - 1) > 0.955 && keep < 0.94) continue;     // game trails trodden through the frost (the ground shader darkens them)
          const nA0 = gfbm3(x * 0.011 + US.x, z * 0.011 + US.y), r0 = Math.hypot(x, z);
          const sint = sR > 20 ? Math.max(smoothstep(0.57, 0.68, nA0 + (gfbm3(x * 0.06 + 3.1, z * 0.06 + 3.1) - 0.5) * 0.22), (1 - smoothstep(215, 315, r0 + (nA0 - 0.5) * 90)) * smoothstep(0.36, 0.5, gfbm3(x * 0.017 + US.y + 9, z * 0.017 + US.x + 9) + 0.3 * (1 - smoothstep(120, 210, r0)))) * smoothstep(20, 38, sR) * smoothstep(30, 75, Math.hypot(x - 128, Math.max(Math.abs(z - 212) - 62, 0))) : 0;
          if (keep < sint * 0.92 || (look.snow && keep > 0.62)) continue;
          let warm = Math.max(1 - smoothstep(0.5, 8, rd), 1 - smoothstep(22, 46, Math.hypot(x - gx, z - gz)));
          for (const f of fum) warm = Math.max(warm, 1 - smoothstep(f.r * 0.4, f.r, Math.hypot(f.x - x, f.z - z)));
          // the ground's own tone at the foot (meadowTone in the hero's GLSL), per-tuft variety on top
          const t0 = (0.65 + 0.5 * (vnoise(x * 0.25 + 77, z * 0.25 + 77) * 0.5714 + vnoise(x * 0.5175 + 176.52, z * 0.5175 + 176.52) * 0.2857 + 0.0714)) * 0.84 * (0.86 + 0.28 * fract(sd * 7.13));
          const hol = smoothstep(0.52, 0.72, gfbm3(x * 0.035 + 19, z * 0.035 + 19)) * 0.65;
          tc.copy(C.meadow).multiplyScalar(t0); tc.r *= 1 - 0.26 * hol; tc.g *= 1 - 0.34 * hol; tc.b *= 1 - 0.42 * hol;
          tc.lerp(C.moss, warm * 0.6); if (look.snow) tc.lerp(snowC, 0.4 * (1 - warm));
          const thaw = Math.max(warm, 0.7 * smoothstep(0.44, 0.64, gfbm3(x * 0.045 + 61, z * 0.045 + 61)));              // patches where the frost lies thin and the gold shows
          iPos.push(x, veg(x, z) - 0.03, z, yaw); iPar.push(w * big, hgt * (0.5 + 0.5 * grow) * (big > 1.3 ? 1.25 : 1) * (look.snow ? 0.6 : 1) * (1 + 0.25 * (thaw - warm)), sd, thaw); iCol.push(tc.r, tc.g, tc.b);
        }
      }
      // three leaning cards under the flight (a rosette from above), two further out
      tuftMat = mk(TUFT_VERT, TUFT_FRAG, tuftU, { side: THREE.DoubleSide });
      await ctx.yield();
      for (let si = 0; si < 2; si++) {
        const set = sets[si];
        const nc = si === 0 ? 3 : 2, pos = [], ac = [], idx = [];
        for (let k = 0; k < nc; k++) {
          const a = k * Math.PI / nc, dx = Math.cos(a) * 0.5, dz = Math.sin(a) * 0.5, sg = k % 2 ? -1 : 1, nx = -Math.sin(a) * sg, nz = Math.cos(a) * sg, b0 = k * 4;
          pos.push(-dx - nx * 0.1, 0, -dz - nz * 0.1, dx - nx * 0.1, 0, dz - nz * 0.1, -dx + nx * 0.26, 1, -dz + nz * 0.26, dx + nx * 0.26, 1, dz + nz * 0.26);
          ac.push(0, 0, k * 0.37, 1, 0, k * 0.37, 0, 1, k * 0.37, 1, 1, k * 0.37); idx.push(b0, b0 + 1, b0 + 2, b0 + 2, b0 + 1, b0 + 3);
        }
        const g = new THREE.InstancedBufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aC', new THREE.Float32BufferAttribute(ac, 3)); g.setIndex(idx);
        g.setAttribute('iPos', new THREE.InstancedBufferAttribute(new Float32Array(set.iPos), 4)); g.setAttribute('iPar', new THREE.InstancedBufferAttribute(new Float32Array(set.iPar), 4)); g.setAttribute('iCol', new THREE.InstancedBufferAttribute(new Float32Array(set.iCol), 3));
        g.instanceCount = set.iPos.length / 4;
        const tufts = new THREE.Mesh(g, tuftMat); tufts.frustumCulled = false; scene.add(tufts);
        await ctx.yield();
      }
    }
    await ctx.yield();
    const br = rng.fork('brush'), brushPal = look.frost > 0.5 ? { leaf: '#8f9468', leafLight: '#d9dccb', leafDark: '#4d5338' } : { leaf: '#6f8a44', leafLight: '#b9c878', leafDark: '#3a4a26' };
    const bushes = [];
    for (let i = 0; i < 3; i++) { bushes.push(flora.bushGeometry({ rng: br, size: br.range(0.62, 0.85), detail: 1, flowers: look.snow ? 0 : 0.55, flowerColor: '#e6c236', ...brushPal })); await ctx.yield(); }
    const brush = flora.makeScatter({ rng: br, path, uRange: [0, M(237)], radius: 60, corridor: 8.5, count: Math.round(80 * density), spacing: 1.6, scale: [0.75, 1.3], heightAt: veg, density: plantOK, material: floraMat,
      variants: bushes, groundShadow: { sunDir: SUN, strength: 0.4 } });
    scene.add(brush.object);
    await ctx.yield();
    // rabbitbrush close under the flight, so the frosted carpet is broken by clumps all along the bank run: four where the
    // swans lift (u 0.08), the rest by chance on both sides
    // Within 8 m of the flight they are our own: a rosette of five cards on which the tussock shader draws a dome of fine forked
    // twigs, frosted, with dry yellow heads (the kit's leaf cards are far too coarse a metre from the lens). Further out, kit bushes.
    const nearBush = [];
    const brush2 = (() => {
      const r2 = rng.fork('brush2'), list = [], P = new THREE.Vector3(), Tn = new THREE.Vector3(), d8 = 0.08 * LEN;
      const add = (pd, lat, sc) => {
        path.posAtDist(pd, P); path.tangentAtDist(pd, Tn); const tl = Math.hypot(Tn.x, Tn.z) || 1, x = P.x - Tn.z / tl * lat, z = P.z + Tn.x / tl * lat;
        if (plantOK(x, z) < 0.5 || inGully(x, z) || list.some((q) => Math.hypot(q.x - x, q.z - z) < 2.6) || nearBush.some((q) => Math.hypot(q.x - x, q.z - z) < 1.7)) return;
        if (Math.abs(lat) < 8) nearBush.push({ x, y: veg(x, z), z, s: sc, rot: r2.range(0, 6.283), sd: r2() });
        else list.push({ x, y: veg(x, z), z, s: sc, rot: r2.range(0, 6.283), d: Math.abs(lat), u: pd / LEN, v: list.length % 3 });
      };
      // the swans' frame (85 m): clumps left of the line and low on the right, none between the lens and the two cows
      add(d8 + 5, -2.2, 1.5); add(d8 + 7.5, 2.6, 1.3); add(d8 + 9, -4.6, 1.9); add(d8 + 12, -1.9, 1.7); add(d8 + 13, 3.3, 1.5); add(d8 + 17, -3.6, 2.0); add(d8 + 19, 1.8, 1.6); add(d8 + 24, -2.4, 2.1); add(d8 + 27, 4.2, 1.8);
      add(7, -3.4, 1.7); add(11, 4.2, 2.0); add(17, -6.5, 2.2); add(23, 2.6, 1.6);                         // and four in the opening frame
      for (let i = 0, n = Math.round(110 * density); i < n; i++) {
        const pd = r2.range(6, 190), lat = (r2() < 0.5 ? -1 : 1) * r2.range(2.2, 17), sc = r2.range(0.9, 1.9);
        if (pd > d8 - 6 && pd < d8 + 30 && lat > 4.5 && lat < 13) continue;                               // the cows' ground stays open
        add(pd, lat, sc);
      }
      return flora.makeScatter({ rng: r2, points: list, heightAt: veg, material: floraMat, variants: bushes, groundShadow: { sunDir: SUN, strength: 0.45 } });
    })();
    scene.add(brush2.object);
    await ctx.yield();
    if (nearBush.length) {
      const nc = 5, pos = [], ac = [], idx = [], iPos = [], iPar = [], iCol = [], bc = new THREE.Color(look.frost > 0.5 ? '#5c6638' : '#6f8a44'), tc = new THREE.Color();
      for (let k = 0; k < nc; k++) {
        const a = k * Math.PI / nc, dx = Math.cos(a) * 0.5, dz = Math.sin(a) * 0.5, sg = k % 2 ? -1 : 1, nx = -Math.sin(a) * sg, nz = Math.cos(a) * sg, b0 = k * 4;
        pos.push(-dx - nx * 0.04, 0, -dz - nz * 0.04, dx - nx * 0.04, 0, dz - nz * 0.04, -dx + nx * 0.16, 1, -dz + nz * 0.16, dx + nx * 0.16, 1, dz + nz * 0.16);
        ac.push(0, 0, k * 0.37, 1, 0, k * 0.37, 0, 1, k * 0.37, 1, 1, k * 0.37); idx.push(b0, b0 + 1, b0 + 2, b0 + 2, b0 + 1, b0 + 3);
      }
      for (const q of nearBush) { tc.copy(bc).multiplyScalar(0.8 + 0.4 * q.sd); iPos.push(q.x, q.y - 0.04, q.z, q.rot); iPar.push(0.82 * q.s, (0.5 * q.s + 0.12) * (look.snow ? 0.8 : 1), 4 + q.sd, 0.72 + 0.15 * q.sd); iCol.push(tc.r, tc.g, tc.b); }
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aC', new THREE.Float32BufferAttribute(ac, 3)); g.setIndex(idx);
      g.setAttribute('iPos', new THREE.InstancedBufferAttribute(new Float32Array(iPos), 4)); g.setAttribute('iPar', new THREE.InstancedBufferAttribute(new Float32Array(iPar), 4)); g.setAttribute('iCol', new THREE.InstancedBufferAttribute(new Float32Array(iCol), 3));
      g.instanceCount = nearBush.length;
      const m = new THREE.Mesh(g, tuftMat); m.frustumCulled = false; scene.add(m);
    }
    await ctx.yield();

    // ---- lodgepoles: stands on the far flats (rimed white near steam), bare cone crowns up the ridges
    const treeU = { map: { value: floraMat.map } }, tr = rng.fork('trees'), dummy = new THREE.Object3D();
    const stands = [];
    for (let tries = 0; tries < 600 && stands.length < Math.round(11 * density); tries++) {
      const a = tr.range(0, 6.283), d = tr.range(230, 640), x = Math.cos(a) * d * 1.15, z = Math.sin(a) * d * 0.9 + 60;
      if (sheet(x, z) < 90 || riverD(x, z) < 25 || onPath(x, z) < 110 || stands.some((s) => Math.hypot(s.x - x, s.z - z) < 110)) continue;
      stands.push({ x, z, r: tr.range(22, 55), n: tr.int(12, 26) });
    }
    // the pine edge: stands along the west and north margin of the flats, 200 to 260 m from the vent
    for (const [a, d, r, n] of [[3.5, 210, 30, 16], [4.05, 232, 34, 18], [4.6, 250, 30, 16], [5.25, 262, 26, 12], [2.95, 245, 30, 14], [2.2, 238, 28, 12]]) stands.push({ x: Math.cos(a) * d, z: Math.sin(a) * d, r, n: Math.round(n * clamp(detail, 0.6, 1)), edge: true });
    for (let i = 2; i < fum.length && i < 5; i++) if (stands[i] && !stands[i].edge) { stands[i].x = fum[i].x + 30; stands[i].z = fum[i].z - 12; }     // rime ghosts beside the vents
    const spots = [];
    for (const s of stands) for (let i = 0; i < s.n; i++) {
      const x = s.x + tr.gauss() * s.r * 0.5, z = s.z + tr.gauss() * s.r * 0.5;
      if (sheet(x, z) < 70 || riverD(x, z) < 12 || onPath(x, z) < (s.edge ? 55 : 80) || POOLS.some((q) => Math.hypot(q.x - x, q.z - z) < q.r * 2.6 + 4)) continue;
      let rime = look.snow ? 0.75 : 0.14 * look.frost; for (const f of fum) rime = Math.max(rime, look.frost * (1 - smoothstep(35, 85, Math.hypot(f.x - x, f.z - z))));
      spots.push({ x, z, s: tr.range(0.8, 1.2), rime });
    }
    await ctx.yield();
    const treeGeos = [];
    for (let i = 0; i < 3; i++) { treeGeos.push(flora.coniferGeometry({ rng: tr, height: 18 + i * 3, detail: i === 0 ? 1 : 0, slim: 1.1, leaf: '#234a34', leafLight: '#4f7a4c', leafDark: '#0f241a' })); await ctx.yield(); }
    const treeMat = mk(TREE_VERT, TREE_FRAG, treeU, { side: THREE.DoubleSide });
    const solitary = [];
    treeGeos.forEach((geo, v) => {
      const mine = spots.filter((_, i) => i % 3 === v); if (!mine.length) return;
      const m = new THREE.InstancedMesh(geo, treeMat, mine.length), rime = new Float32Array(mine.length);
      mine.forEach((p, i) => { dummy.position.set(p.x, veg(p.x, p.z) - 0.2, p.z); dummy.rotation.set(0, tr.range(0, 6.283), 0); dummy.scale.setScalar(p.s); dummy.updateMatrix(); m.setMatrixAt(i, dummy.matrix); rime[i] = p.rime; if (i % 5 === 0) solitary.push({ x: p.x, y: veg(p.x, p.z), z: p.z, h: 6 }); });
      geo.setAttribute('iRime', new THREE.InstancedBufferAttribute(rime, 1)); m.instanceMatrix.needsUpdate = true; scene.add(m);
    });
    await ctx.yield();
    {
      const want = Math.round(2600 * detail), cone = new THREE.ConeGeometry(0.17, 0.92, 5, 1, true).translate(0, 0.52, 0), cc = new THREE.Color(look.forest).multiplyScalar(0.8);
      const colArr = new Float32Array(cone.attributes.position.count * 3); for (let i = 0; i < colArr.length; i += 3) { colArr[i] = cc.r; colArr[i + 1] = cc.g; colArr[i + 2] = cc.b; }
      cone.setAttribute('color', new THREE.BufferAttribute(colArr, 3));
      const m = new THREE.InstancedMesh(cone, mk(TREE_VERT, TREE_FRAG, {}, { defines: { CONE: 1 } }), want), rime = new Float32Array(want); let n = 0;
      for (let tries = 0; tries < want * 14 && n < want; tries++) {
        const a = tr.range(0, 6.283), d = tr.range(0.86, 1.75), x = -60 + Math.cos(a) * d * 800, z = 60 + Math.sin(a) * d * 600, h = landH(x, z);
        if (h < 5 || noise.fbm2(x * 0.004 + 40, z * 0.004, 2) < -0.25 + (h < 14 ? 0.3 : 0)) continue;
        dummy.position.set(x, h - 1, z); dummy.rotation.set(0, tr.range(0, 6.283), 0); const s = tr.range(17, 27); dummy.scale.set(s * 1.25, s, s * 1.25); dummy.updateMatrix(); m.setMatrixAt(n, dummy.matrix); rime[n++] = look.snow ? 0.7 : 0.1 * look.frost;
        if ((tries & 1023) === 1023) await ctx.yield();               // every 1024 tries
      }
      m.count = n; cone.setAttribute('iRime', new THREE.InstancedBufferAttribute(rime, 1)); m.instanceMatrix.needsUpdate = true; m.frustumCulled = false; scene.add(m);
    }
    await ctx.yield();

    // ---- the herd. Dark shapes with frost on their backs; every one stands, grazes, rolls or walks in file
    const BISON = { ...F.HERD_PRESETS.bison, sides: 16, legSides: 7, hump: 0.3, width: 0.46, depth: 0.66, neck: [0.4, 0.3], neckLen: 0.2, neckAng: -14, headLen: 0.4, headR: 0.19, headPitch: 62, horns: 0.17, tail: 0.34,
      coat: '#3b2a1e', belly: '#2a1e17', legs: '#231913', sock: '#1c1410', accent: '#1d1511', horn: '#2a2622', hoof: '#15110e' };
    const ELK = { ...F.HERD_PRESETS.deer, h: 1.5, sides: 14, antlers: 0.78, neck: [0.2, 0.12], neckLen: 0.56, width: 0.34, depth: 0.46, coat: '#7a5c3e', belly: '#5a4430', legs: '#3a2a1e', sock: '#32241a', accent: '#d9c8a4', horn: '#cdbb92' };
    const bisonGeo = F.quadrupedGeometry(BISON), elkGeo = F.quadrupedGeometry(ELK), muzB = muzzleOf(bisonGeo), muzE = muzzleOf(elkGeo);
    await ctx.yield();
    const ar = rng.fork('herd'), beasts = [], elk = [], RUN = [[112, 205], [117, 160], [123.5, 128], [129, 95], [131, 70], [124, 46], [106, 30], [86, 14], [73, -18], [70, -60], [60, -110], [40, -170], [20, -230], [0, -300], [-20, -380]];
    // the stampede's ground: the fan where the runners wait, and a lane along their route
    const runZone = (x, z) => { if (!rare) return false; if (x > 100 && x < 136 && z > 96 && z < 160) return true; for (let i = 0; i < RUN.length - 1; i++) { const a = RUN[i], b = RUN[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], t = clamp(((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz), 0, 1); if (Math.hypot(a[0] + dx * t - x, a[1] + dz * t - z) < 11) return true; } return false; };
    const calfTint = lookName === 'day' ? 2.6 : 1.0;
    const free = (x, z, gap = 4.5) => riverD(x, z) > 2.5 && sheet(x, z) > -4 && path.distanceTo(x, 1.2, z) > 8.6 && Math.hypot(x - WALLOW.x, z - WALLOW.z) > 7 && !runZone(x, z)
      && !beasts.some((b) => Math.hypot(b.x - x, b.z - z) < gap) && !POOLS.some((q) => Math.hypot(q.x - x, q.z - z) < q.r * 1.7 + 2) && !fum.some((f) => Math.hypot(f.x - x, f.z - z) < 5) && !pots.some((f) => Math.hypot(f.x - x, f.z - z) < f.r + 3);
    const put = (x, z, yaw, scale, pose, tint = 1) => { const b = { x, z, y: veg(x, z), yaw, scale, pose, seed: ar(), tint: tint * ar.range(0.85, 1.15) }; beasts.push(b); return b; };
    put(128.1, 238.2, -Math.PI / 2 - 0.25 + ar.range(-0.1, 0.1), 1.2, 0);                                   // the bull on the axis, side-on
    put(WALLOW.x, WALLOW.z, ar.range(0.6, 1.2), 1.1, 2);                                                // the wallower
    // six on the spring's north rim, warming their hooves on the mats: we pass 10 m south of them looking into the sun
    for (const [x, z, yaw, sc, pose] of [[5, -59.5, 2.2, 1.14, 0], [13.5, -63, -1.9, 0.96, 1], [20, -60.5, 2.6, 1.02, 0], [29, -64.5, 1.3, 0.92, 1], [16.5, -66.5, 0.4, 0.56, 0], [38, -62, -2.4, 1.1, 0]]) { const b = put(x, z, yaw + ar.range(-0.2, 0.2), sc, pose, sc < 0.7 ? calfTint : 1); b.y = 0.02; }
    {                                                                                                    // the swans' frame (u 0.08): two cows a tenth of the frame tall on the bank, inside the right third, a calf by them
      const d8 = 0.08 * path.length, P = path.posAtDist(d8), Q = path.posAtDist(d8 + 20), fl = Math.hypot(Q.x - P.x, Q.z - P.z) || 1, fwx = (Q.x - P.x) / fl, fwz = (Q.z - P.z) / fl;
      for (const [ahead, right, sc, pose, yaw] of [[9.5, 9.0, 0.98, 0, -1.75], [14.5, 10.4, 1.1, 1, 1.2], [11.5, 7.2, 0.55, 0, 2.4]]) {
        let x = P.x + fwx * ahead - fwz * right, z = P.z + fwz * ahead + fwx * right;
        x = Math.min(x, riverX(z) - RV.hw - 1.4);
        put(x, z, yaw + ar.range(-0.15, 0.15), sc, pose, sc < 0.7 ? calfTint : 1);
      }
    }
    for (let i = 0; i < 7; i++) {                                                                        // cows and calves on the bank
      const z = 236 - i * 8.5 + ar.range(-2, 2), q = path.nearestXZ(134, z), px = path.pointAt(q.u).x, x = Math.min(px + ar.range(8.8, 12.5), riverX(z) - RV.hw - 2.8);
      if (!free(x, z, 3.2)) continue;
      const calf = i % 3 === 2; put(x, z, ar.range(0, 6.283), calf ? ar.range(0.5, 0.58) : ar.range(0.86, 0.96), calf ? 0 : (ar() < 0.7 ? 1 : 0), calf ? calfTint : 1);
    }
    {                                                                                                    // where the bank run ends: a cow a tenth of the frame tall on the right, another grazing behind her
      const z = 164 + ar.range(-1, 1), x = Math.min(path.pointAt(path.nearestXZ(136, z).u).x + 9.6, riverX(z) - RV.hw - 2.2);
      if (!beasts.some((b) => Math.hypot(b.x - x, b.z - z) < 5)) put(x, z, Math.PI / 2 + ar.range(-0.3, 0.3), 1.07, 0);
      const z2 = 172.5 + ar.range(-1, 1), x2 = Math.min(path.pointAt(path.nearestXZ(136, z2).u).x + 11.5, riverX(z2) - RV.hw - 2.4);
      if (free(x2, z2, 3.2)) put(x2, z2, ar.range(0, 6.283), 0.9, 1);
    }
    if (!rare) for (let i = 0, n = 0; i < 40 && n < 6; i++) {                                              // a knot of them warming their hooves on the runoff fan, left of the line
      const x = ar.range(108, 125), z = ar.range(118, 162);
      if (path.distanceTo(x, 1.2, z) < 13 || beasts.some((b) => Math.hypot(b.x - x, b.z - z) < 3.4) || fum.some((f) => Math.hypot(f.x - x, f.z - z) < 6)) continue;
      const calf = n === 2; put(x, z, ar.range(0, 6.283), calf ? 0.55 : n === 0 ? 1.12 : ar.range(0.86, 0.98), n % 2 ? 1 : 0, calf ? calfTint : 1); n++;
    }
    const herdN = Math.round(clamp(41 * density, 30, 52)) + 1 - (rare ? 16 : 0);
    await ctx.yield();
    for (let tries = 0; tries < 3000 && beasts.length < herdN; tries++) {
      if ((tries & 31) === 31) await ctx.yield();
      const k = ar();
      let x, z;
      if (k < 0.42) { x = ar.range(52, 128); z = ar.range(150, 300); }                                    // the meadow west of the bank run
      else if (k < 0.6) { x = ar.range(60, 150); z = ar.range(290, 420); }
      else if (k < 0.82) { x = ar.range(188, 330); z = ar.range(40, 330); }                               // across the river
      else { const a = ar.range(1.6, 5.2), d = ar.range(135, 260); x = Math.cos(a) * d; z = Math.sin(a) * d; }   // out on the sinter round the spring
      if (!free(x, z) || sheet(x, z) < 6 && k < 0.82) continue;
      const calf = ar() < 0.16, bull = !calf && ar() < 0.3;
      put(x, z, ar.range(0, 6.283), calf ? ar.range(0.5, 0.6) : bull ? ar.range(1.05, 1.16) : ar.range(0.86, 0.98), ar() < 0.62 && !calf ? 1 : 0, calf ? calfTint : 1);
    }
    {                                                                                                     // five in file far out beyond the spring
      const a0 = ar.range(2.5, 3.6), d0 = ar.range(128, 150), dir = [Math.cos(a0 + Math.PI / 2), Math.sin(a0 + Math.PI / 2)], yaw = Math.atan2(dir[0], dir[1]);
      for (let i = 0; i < 5; i++) { const s = -40 - i * 7.5 + ar.range(-1, 1), x = Math.cos(a0) * d0 + dir[0] * s, z = Math.sin(a0) * d0 + dir[1] * s; const b = put(x, z, yaw, i === 0 ? 1.1 : ar.range(0.55, 0.98), 3); b.y = 0.02; b.move = [dir[0], dir[1], 150, 1.15]; }
    }
    put(BAR.x - 0.3, BAR.z + 3, -2.1, 1.2, 4); elk.push(beasts.pop());                                       // the bull elk bugling on the bar, and two cows
    put(BAR.x + 1.4, BAR.z - 5, 2.6, 0.9, 1); elk.push(beasts.pop());
    put(BAR.x - 0.8, BAR.z - 12, 1.2, 0.88, 0); elk.push(beasts.pop());
    await ctx.yield();
    const beastU = { uH: { value: BISON.h }, uGraze: { value: 0.62 }, uBugle: { value: 0 }, uRun: { value: new THREE.Vector4(0, 0, -1, 0) }, uCoatFrost: { value: look.frost },
      uGal: { value: new THREE.Vector2(0, 15) }, uCoat: { value: new THREE.Vector2(lookName === 'day' ? 0.7 : 1, 0) } };
    const bisonMesh = new THREE.Mesh(herdGeometry(bisonGeo, beasts), mk(BEAST_VERT, BEAST_FRAG, beastU, { side: THREE.DoubleSide })); bisonMesh.frustumCulled = false; scene.add(bisonMesh);
    await ctx.yield();
    const elkU = { ...beastU, uH: { value: ELK.h }, uGraze: { value: 1.5 }, uBugle: { value: 0 } };
    const cowElk = F.quadrupedGeometry({ ...ELK, antlers: 0 });
    const elkBull = new THREE.Mesh(herdGeometry(elkGeo, elk.slice(0, 1)), mk(BEAST_VERT, BEAST_FRAG, elkU, { side: THREE.DoubleSide })); elkBull.frustumCulled = false; scene.add(elkBull);
    const elkCows = new THREE.Mesh(herdGeometry(cowElk, elk.slice(1)), elkBull.material); elkCows.frustumCulled = false; scene.add(elkCows);
    await ctx.yield();

    // ---- swans (Canada geese in the warm looks) on the river: afloat ahead on the right, they run as we come up, lift along
    // the water's edge 10 to 14 m off our right wing with the shaded far bank behind them, hold there, then pull ahead and bank away
    const SW = geeseCast ? { body: '#a08c72', shade: '#5a4c40', bill: '#141414', wing: '#6c5c4c', lining: '#c9b89c', neck: '#16161a', breast: '#d9ccb4', size: 1.5, n: 8 }
      : { body: '#eef0f4', shade: '#b4bccc', bill: '#16161a', wing: '#e6e9f0', lining: '#e6e9f0', neck: '#eef0f4', breast: '#eef0f4', size: 1.9, n: 8 };
    const sr = rng.fork('swans'), floaters = [];
    for (let i = 0; i < SW.n; i++) { const z = 212 - i * 3.6 + sr.range(-1.2, 1.2); floaters.push({ x: riverX(z) - RV.hw + sr.range(3.5, 7.5), y: RV.y - 0.04, z, yaw: Math.PI + sr.range(-0.5, 0.5), scale: 1.55 * (geeseCast ? 0.8 : 1) * sr.range(0.92, 1.08), pose: 5, seed: sr() }); }
    const swanU = { ...beastU, uH: { value: 0.9 }, uGraze: { value: 0 }, uRun: { value: new THREE.Vector4(0, 0, -1, 9) }, uCoatFrost: { value: 0 } };
    const swanMesh = new THREE.Mesh(herdGeometry(swanGeometry(SW.body, SW.shade, SW.bill), floaters), mk(BEAST_VERT, BEAST_FRAG, swanU, { side: THREE.DoubleSide })); swanMesh.frustumCulled = false; scene.add(swanMesh);
    await ctx.yield();
    const faunaLight = { sunDir: SUN, sunColor: look.faunaSun[0], sunIntensity: look.faunaSun[1], sky: look.faunaSky[0], skyIntensity: look.faunaSky[1], ground: look.hemi[1], groundIntensity: 0.7 };
    const swanLight = { ...faunaLight, skyIntensity: look.faunaSky[1] * 2.1, ground: look.faunaSky[0], groundIntensity: 1.3 };
    // the flock's route is laid beside our own: [metres along the path, metres to our right, height above the water], then away up the river
    const SWR = [[18, 27, 0.5], [44, 25, 0.5], [60, 20, 0.5], [66, 17.5, 0.6], [72, 16.2, 1.3], [78, 14.2, 2.6], [84, 12, 3.6], [96, 10.4, 4.2], [108, 9.6, 4.5], [120, 9.4, 4.8], [132, 10.2, 5.3], [146, 13, 6], [163, 18, 7.4], [183, 27, 9.5]];
    const sroute = [], spd = [], sarc = [0], P3 = new THREE.Vector3(), T3 = new THREE.Vector3();
    for (const [pd, lat, up] of SWR) { path.posAtDist(pd, P3); path.tangentAtDist(pd, T3); const tl = Math.hypot(T3.x, T3.z) || 1; sroute.push([P3.x - T3.z / tl * lat, RV.y + up, P3.z + T3.x / tl * lat]); spd.push(pd); }
    for (const [z, off, y] of [[40, -6, 13], [-30, -4, 19], [-120, 0, 27], [-240, 0, 36]]) { const q = [riverX(z) + off, y, z], l = sroute[sroute.length - 1]; spd.push(spd[spd.length - 1] + Math.hypot(q[0] - l[0], q[1] - l[1], q[2] - l[2])); sroute.push(q); }
    for (let i = 1; i < sroute.length; i++) sarc.push(sarc[i - 1] + Math.hypot(sroute[i][0] - sroute[i - 1][0], sroute[i][1] - sroute[i - 1][1], sroute[i][2] - sroute[i - 1][2]));
    const swans = F.makeFlock({ rng: rng.fork('swanflock'), species: 'geese', count: SW.n, size: SW.size, form: 'loose', spread: [2.2, 0.4, 10.5], wander: [0.4, 0.2, 0.4, 0.4], route: sroute, closed: false, start: 0, speed: 19, flap: 2.6, neck: 0.5,
      body: SW.body, belly: SW.breast, wingC: SW.wing, trail: SW.lining, tip: geeseCast ? '#2a2420' : SW.wing, head: SW.neck, neckC: SW.neck, tailC: SW.body, beak: SW.bill, light: swanLight, translucency: 1, rim: 0.7 });
    scene.add(swans.object);
    await ctx.yield();
    const swanLen = swans.route.length, swanK = swanLen / sarc[sarc.length - 1];
    // metres along the swans' route for our own progress. Their lead point is 30 m ahead of us while they run on the water
    // (we close on them), 17 to 21 m ahead while they fly beside us (the birds trail 10 m behind it), then they pull away
    const swanS = (u) => {
      const m = u * LEN, pd = m + 30 - 13 * smoothstep(47, 63, m) + 4 * smoothstep(67, 91, m) + 50 * Math.pow(smoothstep(79, 174, m), 1.5) + Math.max(0, m - 174) * 0.5;
      let i = 1; while (i < spd.length - 1 && spd[i] < pd) i++;
      return (sarc[i - 1] + (sarc[i] - sarc[i - 1]) * clamp((pd - spd[i - 1]) / (spd[i] - spd[i - 1]), 0, 1.5)) * swanK;
    };
    // splash rings: the slap of every foot while they run (rings are left behind on the water and spread)
    const NRING = 40, ringA = new THREE.InstancedBufferAttribute(new Float32Array(NRING * 4), 4); ringA.setUsage(THREE.DynamicDrawUsage);
    const rings = [], rr = rng.fork('rings'), birdA = swans.geometry.attributes.iA.array;
    for (let k = 0; k < NRING; k++) rings.push({ j: k % SW.n, flock: k >= 16, ph: rr(), T: rr.range(1.3, 1.9), jx: rr.range(-0.5, 0.5), jz: rr.range(-0.5, 0.5) });
    const ringGeo = new THREE.InstancedBufferGeometry();
    ringGeo.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0], 3)); ringGeo.setIndex([0, 2, 1, 1, 2, 3]);
    ringGeo.setAttribute('iRing', ringA); ringGeo.instanceCount = NRING;
    const ringCol = new THREE.Color(lookName === 'night' ? '#8fa6d8' : look.line ? '#eef4ff' : '#fff0d8').multiplyScalar(lookName === 'night' ? 1 : 1.5);
    const ringMesh = new THREE.Mesh(ringGeo, new THREE.ShaderMaterial({ uniforms: { ...fogU(), uY: { value: RV.y + 0.13 }, uRingCol: { value: ringCol } }, vertexShader: RING_VERT, fragmentShader: RING_FRAG, fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
    ringMesh.renderOrder = 4; ringMesh.frustumCulled = false; scene.add(ringMesh);
    const splashMesh = new THREE.Mesh(ringGeo, new THREE.ShaderMaterial({ uniforms: ringMesh.material.uniforms, vertexShader: SPLASH_VERT, fragmentShader: SPLASH_FRAG, fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
    splashMesh.renderOrder = 4; splashMesh.frustumCulled = false; scene.add(splashMesh);
    await ctx.yield();

    // ---- ravens on the geyser's updraught, and two over the spring that cross beneath the dive
    const fauna = F.makeFauna(scene, { light: faunaLight });
    const RAVEN = { species: 'crows', size: 1.45, body: '#13151c', belly: '#0b0c10', wingC: '#191d29', trail: '#141823', tip: '#0b0d13', head: '#15171f', beak: '#27272b', glide: 0.6, flap: 2.4 };
    // six ride the updraught between us and the tower through the turn (black against the glow at the eclipse), five cross
    // ahead over the flats as we leave the north shelf, and a pair crosses beneath the dive. The five fly a straight line 16 m
    // ahead and a few metres below eye level, always left to right, so they are whole in the frame below the lesser pool
    // in every seed (the random side is still drawn, so nothing else in the world moves)
    fauna.add(F.makeFlock({ rng: rng.fork('ravens'), ...RAVEN, size: 1.9, count: 6, form: 'loose', spread: [4.5, 3, 10], wander: [1.2, 0.8, 1.4, 0.35], along: { path, side: -10.5, up: -1, lead: 3, from: M(215), to: M(430), drift: 2.5 } }), { always: true });
    fauna.add(F.makeFlock({ rng: rng.fork('ravens3'), ...RAVEN, size: 2.5, count: 5, form: 'loose', spread: [3, 1.4, 5], wander: [0.6, 0.4, 0.6, 0.3], cross: { path, u: 0.7, lead: 16, height: -11.5, offset: 3, bow: 0, angle: 70, side: Math.abs(rng.sign()), span: 170, window: 0.09 } }), { always: true });
    // four more wheel across the glow while the sun stands behind the tower, and four hang over the Eye as it comes whole into view
    fauna.add(F.makeFlock({ rng: rng.fork('ravens4'), ...RAVEN, size: 1.9, count: 4, form: 'loose', spread: [3, 2.5, 7], wander: [0.9, 0.7, 1.1, 0.35], along: { path, side: -9.5, up: 2, lead: -1, from: M(312), to: M(398), drift: 2 } }), { always: true });
    fauna.add(F.makeFlock({ rng: rng.fork('ravens5'), ...RAVEN, size: 2.2, count: 4, form: 'loose', spread: [4, 1.5, 5], wander: [0.7, 0.5, 0.7, 0.3], cross: { path, u: 0.79, lead: 8, offset: -20, height: -11.5, angle: 12, side: 1, span: 120, window: 0.085 } }), { always: true });
    fauna.add(F.makeFlock({ rng: rng.fork('ravens2'), ...RAVEN, size: 2.0, count: 2, form: 'loose', spread: [5, 1, 7], wander: [0.6, 0.4, 0.6, 0.3], cross: { path, u: 0.945, lead: 8, height: -4, angle: 75, side: rng.sign(), span: 150, window: 0.085 } }), { always: true });
    await ctx.yield();

    // ---- the rare stampede: sixteen bison stand in the runoff fan, bolt at the breakout, gallop north round the tower and away over the flats.
    // They are our own animals (the herd's rig and shader, pose 6), placed along a route by path progress; each drags its
    // long shadow with it, and dust and frost are kicked up behind them (both built further down)
    let stampede = null;
    if (rare) {
      const sr2 = rng.fork('stampede'), route = makePath(RUN.map((q) => [q[0], 0, q[1]]));   // out of the fan, round the tower's north side, across the skirt between tower and spring, away over the northern flats
      const nR = Math.floor(route.length), rx = new Float32Array(nR + 1), rz = new Float32Array(nR + 1), P = new THREE.Vector3();
      for (let i = 0; i <= nR; i++) { route.posAtDist(i, P); rx[i] = P.x; rz[i] = P.z; }
      const runners = [], sizes = [1.24, 1.05, 1.0, 0.62, 1.08, 1.2, 1.02, 0.66, 1.06, 1.26, 1.0, 0.64, 1.1, 1.02, 1.16, 1.05];
      for (let tries = 0; tries < 800 && runners.length < 16; tries++) {
        const al = sr2.range(-21, 21), lt = sr2.range(-6.5, 6.5);
        if (runners.some((r) => Math.abs(r.al - al) < 4.6 && Math.abs(r.lt - lt) < 2.6)) continue;
        runners.push({ al, lt, x: 0, y: 0, z: 0, yaw: 0, scale: sizes[runners.length], pose: 6, seed: sr2(), tint: sr2.range(0.8, 1.05), turn: sr2.range(-2.6, 2.6) });
      }
      const geo = herdGeometry(bisonGeo, runners), posA = geo.attributes.iPos; posA.setUsage(THREE.DynamicDrawUsage);
      const runU = { ...beastU, uCoatFrost: { value: look.frost * 0.16 }, uGal: { value: new THREE.Vector2(0, 13.5) }, uCoat: { value: new THREE.Vector2(0.42, 1) } };
      const mesh = new THREE.Mesh(geo, mk(BEAST_VERT, BEAST_FRAG, runU, { side: THREE.DoubleSide })); mesh.frustumCulled = false; scene.add(mesh);
      // a point s metres along the route, lt metres to its right: writes x, z and the heading into o
      const at = (s, lt, o) => {
        const q = clamp(s, 0, nR - 1.001), k = Math.floor(q), f = q - k, tx = rx[k + 1] - rx[k], tz = rz[k + 1] - rz[k], tl = Math.hypot(tx, tz) || 1;
        o.x = rx[k] + tx * f - tz / tl * lt; o.z = rz[k] + tz * f + tx / tl * lt; o.yaw = Math.atan2(tx, tz);
      };
      stampede = { runners, posA, runU, mesh, at, len: nR, shadow: null, dust: null, puffs: null, tmp: { x: 0, z: 0, yaw: 0 } };
    }
    // metres along the stampede route: standing in the fan until the surge, then 11 m/s, so the herd is strung across the view as we draw level with the tower
    const stampS = (u) => 100 + Math.max(0, u * LEN - 127) * 0.72 * smoothstep(127, 147, u * LEN);
    const apronY = (x, z) => { const d = Math.hypot(x - gx, z - gz); return d < 23 ? 0.5 * Math.pow(1 - clamp((d - 4.5) / 18.5, 0, 1), 1.7) : 0; };   // the cone's sinter apron
    await ctx.yield();

    // ---- vapour: fumarole columns, steam along the rivulets, river mist, mud-pot puffs, breath, wallow dust, wisps in the dive
    const vr = rng.fork('vapour'), puffs = [], PK = clamp(detail, 0.6, 1);
    // winter and night triple all steam in the hero's shader. What stands beside the animals (their breath, the vapour behind
    // the rim herd) is held to its dawn weight and kept smaller than they are, or it sits on them like cotton wool
    const coldK = HU.uSteamK.value > 1 ? 1 / HU.uSteamK.value : 1, coldS = HU.uSteamK.value > 1 ? 0.72 : 1;
    const column = (x, y, z, n, rise, s0, s1, alpha, per) => { for (let i = 0; i < n; i++) puffs.push({ o: [x + vr.gauss() * s0 * 0.3, y, z + vr.gauss() * s0 * 0.3], p: [vr(), vr.range(per * 0.8, per * 1.2), s0 * vr.range(0.8, 1.2), s1 * vr.range(0.8, 1.25)], q: [rise * vr.range(0.75, 1.2), 1, vr(), alpha * vr.range(0.8, 1.2)] }); };
    for (const f of fum) column(f.x, 0.6, f.z, Math.round(24 * PK), 30 * f.big, 1.4, 9 * f.big, 0.27, 10);
    for (const f of pots) column(f.x, 0.4, f.z, Math.round(5 * PK), 7, 0.9, 3.4, 0.2, 6);
    for (const q of POOLS) column(q.x, 0.5, q.z, Math.round(14 * PK), 16 + q.r, q.r * 0.5, q.r * 1.3, 0.2, 9);
    {                                                                                                     // wisps off the overflow creek, drifting over the low pass, and vapour standing behind the bison on the north rim
      const ck = HU.uCreek.value;
      for (let i = 0, n = Math.round(20 * PK); i < n; i++) {
        const phi = vr.range(-1.25, 0.05), r = ck.z + (vr() < 0.5 ? -1 : 1) * vr.range(7, 15), x = ck.x + Math.sin(phi) * r, z = ck.y + Math.cos(phi) * r;
        column(x, 0.4, z, 2, vr.range(2.5, 5), 1.6, vr.range(4.5, 6.5), 0.16, 7);
      }
      for (const [x, z] of [[9, -68], [14, -72], [25, -71], [33, -70], [44, -67], [22, -76]]) column(x, 0.4, z, Math.round(3 * PK), 8, 2 * coldS, 7 * coldS * coldS, 0.17 * coldK, 8);
    }
    for (let i = 0, n = Math.round(70 * PK); i < n; i++) {                                               // the fan steams all the way to the river
      const a = vr.range(70, 200), c = vr.range(-1, 1) * (8 + a * 0.2), x = fd[0] * a - fd[1] * c, z = fd[1] * a + fd[0] * c;
      if (riverD(x, z) < 0 || path.distanceTo(x, 3, z) < 9) continue;
      column(x, 0.5, z, 1, vr.range(4, 9), 2.4, 7, 0.13, 9);
    }
    for (let i = 0, n = Math.round(64 * PK); i < n; i++) { const z = vr.range(-260, 340); column(riverX(z) + vr.range(-RV.hw, RV.hw) * 0.8, RV.y + 0.6, z, 1, vr.range(1.5, 4), 5, 13, 0.1, 17); }
    const breathOf = (b, m, ang, H) => {                                                                  // three puffs a breath, every three seconds
      if (b.pose === 2 || b.pose === 3 || onPath(b.x, b.z) > 95) return;
      const cy = Math.cos(b.yaw), sy = Math.sin(b.yaw), l = m(ang), x = b.x + (l[0] * cy + l[2] * sy) * b.scale, y = b.y + l[1] * b.scale, z = b.z + (-l[0] * sy + l[2] * cy) * b.scale, ph = vr();
      for (let k = 0; k < 3; k++) puffs.push({ o: [x + sy * 0.12 * k, y - 0.03 * H, z + cy * 0.12 * k], p: [ph + k * 0.04, 3.1, 0.12 * b.scale, (0.55 + 0.2 * k) * b.scale * coldS], q: [0.3 + 0.12 * k, 1, vr(), 0.3 * coldK] });
    };
    for (const b of beasts) breathOf(b, muzB, b.pose === 1 ? 0.62 : 0, BISON.h);
    breathOf(elk[0], muzE, -0.5, ELK.h); breathOf(elk[1], muzE, 1.5, ELK.h); breathOf(elk[2], muzE, 0, ELK.h);
    await ctx.yield();
    for (let i = 0; i < 12; i++) puffs.push({ o: [WALLOW.x + vr.gauss() * 1.6, 0.5, WALLOW.z + vr.gauss() * 1.6], p: [vr(), vr.range(3, 4.6), 0.9, vr.range(3, 4.6)], q: [vr.range(2, 4), 3, vr(), 0.26], tint: [0.95, 0.8, 0.6] });
    {                                                                                                     // coloured tatters round the last 70 m
      const d = DIVE.clone(), side = new THREE.Vector3(-d.z, 0, d.x).normalize(), upv = new THREE.Vector3().crossVectors(side, d), tints = [[0.55, 0.8, 1.1], [0.6, 1.1, 0.9], [1.1, 0.95, 0.5], [1.1, 0.72, 0.45]];
      for (let i = 0, n = Math.round(34 * PK); i < n; i++) {
        const back = vr.range(4, 78), a = vr.range(0, 6.283), r = vr.range(9.5, 19), p = seat.clone().addScaledVector(d, -back).addScaledVector(side, Math.cos(a) * r).addScaledVector(upv, Math.sin(a) * r);
        if (p.y < 4) continue;
        puffs.push({ o: [p.x, p.y, p.z], p: [vr(), vr.range(6, 9), vr.range(3, 5), vr.range(7, 11)], q: [vr.range(5, 10), 0, vr(), 0.17], tint: tints[i % 4] });
      }
    }
    hero.addSteam(puffs);
    await ctx.yield();
    const boilSteam = (() => {
      const bp = [], br2 = rng.fork('boil');
      for (let i = 0, n = Math.round(44 * PK); i < n; i++) bp.push({ o: [br2.gauss() * 3.2, 0.9, br2.gauss() * 3.2], p: [br2(), br2.range(5.5, 8), 2.2, br2.range(7, 11)], q: [br2.range(16, 30), 1, br2(), br2.range(0.22, 0.34)], tint: [0.8, 0.92, 1.1] });
      const m = hero.addSteam(bp, 5); m.material.uniforms.uSteamK = { value: 0 }; return m;
    })();
    await ctx.yield();
    if (stampede) {                                                                                       // dust and frost flying behind every runner: origins are moved each frame (see update)
      const dp = [];
      // low and thin, kicked up by the last five of the herd and left behind them, so no animal runs inside a cloud
      const rear = stampede.runners.map((r, j) => j).sort((i, j) => stampede.runners[i].al - stampede.runners[j].al).slice(0, 5);
      for (const j of rear) { const r = stampede.runners[j]; for (let k = 0; k < 8; k++) dp.push({ j, o: [0, -50, 0], p: [vr() * 0.125 + k * 0.125, vr.range(1.7, 2.3), 0.6 * r.scale, vr.range(2.2, 3.2) * r.scale], q: [vr.range(0.6, 1.2), 3, vr(), 0.5],
        tint: look.frost > 0.2 && k % 2 ? [0.9, 0.95, 1.05] : [1.05, 0.95, 0.78], side: vr.range(-1.1, 1.1) }); }
      const dust = hero.addSteam(dp, 6);
      dust.material.uniforms.uSteamK = { value: 0 };
      dust.geometry.attributes.aO.setUsage(THREE.DynamicDrawUsage);
      stampede.dust = dust; stampede.puffs = dp;
    }
    await ctx.yield();

    // ---- long shadows running away from the sun: one streak per animal and lone pine
    {
      // in the meadow the streak lies on the grass tips, not under them
      const lift = (x, z) => (onPath(x, z) < 95 ? 0.36 * meadowAt(x, z) * (look.snow ? 0.6 : 1) : 0);
      const casters = [...beasts.map((b) => ({ x: b.x, y: b.y + lift(b.x, b.z), z: b.z, h: (b.pose === 2 ? 0.9 : 1.95) * b.scale, move: b.move, seed: b.seed })), ...elk.map((b) => ({ x: b.x, y: b.y, z: b.z, h: 2.0 * b.scale, seed: 0 })), ...solitary.map((t) => ({ x: t.x, y: t.y, z: t.z, h: t.h, seed: 0 }))];
      const g = new THREE.InstancedBufferGeometry(), n = casters.length, segs = 6, pos = [], idx = [];
      for (let i = 0; i <= segs; i++) pos.push(i / segs, -1, 0, i / segs, 1, 0);
      for (let i = 0; i < segs; i++) idx.push(i * 2, i * 2 + 2, i * 2 + 1, i * 2 + 1, i * 2 + 2, i * 2 + 3);
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
      const iPos = new Float32Array(n * 4), iMove = new Float32Array(n * 4), iSeed = new Float32Array(n);
      casters.forEach((c, i) => { iPos.set([c.x, c.y, c.z, c.h], i * 4); iMove.set(c.move ? [c.move[0], c.move[1], c.move[2], c.move[3]] : [0, 0, 0, 0], i * 4); iSeed[i] = c.seed; });
      g.setAttribute('iPos', new THREE.InstancedBufferAttribute(iPos, 4)); g.setAttribute('iMove', new THREE.InstancedBufferAttribute(iMove, 4)); g.setAttribute('iSeed', new THREE.InstancedBufferAttribute(iSeed, 1)); g.instanceCount = n;
      const shadeC = new THREE.Color(lookName === 'night' ? '#01030a' : '#0a1430'), streakX = { transparent: true, depthWrite: false, side: THREE.DoubleSide };
      const m = new THREE.Mesh(g, mk(STREAK_VERT, STREAK_FRAG, { uShade: { value: shadeC }, uStreak: { value: new THREE.Vector2(0.62, 1) } }, streakX));
      m.renderOrder = -4; m.frustumCulled = false; scene.add(m);
      await ctx.yield();
      if (stampede) {
        const g2 = new THREE.InstancedBufferGeometry(), n2 = stampede.runners.length; g2.index = g.index; g2.setAttribute('position', g.attributes.position);
        const sp = new THREE.InstancedBufferAttribute(new Float32Array(n2 * 4), 4); sp.setUsage(THREE.DynamicDrawUsage);
        g2.setAttribute('iPos', sp); g2.setAttribute('iMove', new THREE.InstancedBufferAttribute(new Float32Array(n2 * 4), 4)); g2.setAttribute('iSeed', new THREE.InstancedBufferAttribute(new Float32Array(n2), 1)); g2.instanceCount = n2;
        // the runners' own shadows: darker and half as wide again, so each drags a clear blue streak west over the lit mats
        const m2 = new THREE.Mesh(g2, mk(STREAK_VERT, STREAK_FRAG, { uShade: { value: new THREE.Color('#0a1a4c') }, uStreak: { value: new THREE.Vector2(0.8, 1.4) } }, streakX)); m2.renderOrder = -4; m2.frustumCulled = false; scene.add(m2);
        stampede.shadow = sp;
      }
    }

    // ---- air: ice crystals in the upper air, the cold hem of the geyser's veil, snowfall in winter
    const clock = { value: 0 }, sunC = new THREE.Color(look.dir[0]);
    const ice = fx.makeParticles({ rng: rng.fork('ice'), preset: 'dust', time: clock, count: Math.round(1700 * detail), box: [64, 40, 64], size: [0.03, 0.085], velocity: [wind[0] * 0.4, -0.35, wind[1] * 0.4], velocityRandom: [0.3, 0.2, 0.3],
      colors: lookName === 'night' ? ['#cfe0ff', '#e8f0ff', '#a9c0f0'] : ['#fff1d6', '#ffffff', '#ffe0b0'], intensity: 1.5, opacity: 0.8, twinkle: 0.85, near: [1, 4] });
    await ctx.yield();
    const spray = fx.makeParticles({ rng: rng.fork('spray'), preset: 'rain', time: clock, count: Math.round(1500 * detail), box: [44, 34, 44], velocity: [wind[0] * 1.2, -7.5, wind[1] * 1.2], velocityRandom: [0.8, 2.5, 0.8], size: [0.02, 0.04], stretch: 0.03,
      colors: ['#dfe9f6', '#fff4de', '#c6d6ea'], intensity: 0.9, opacity: 0.32, additive: 0.7, near: [1.5, 6] });
    scene.add(ice.object, spray.object);
    await ctx.yield();
    let snowfall = null;
    if (look.snow) { snowfall = fx.makeParticles({ rng: rng.fork('snow'), preset: 'snow', time: clock, count: Math.round(3200 * detail), opacity: 0.85 }); scene.add(snowfall.object); }
    await ctx.yield();

    // ---- the gaze. Through the turn it is held a little to one side of the tower, so the column stands in the left third on
    // the way in, crosses to the right as the Eye opens behind it, and comes back to the middle for the eclipse
    const gaze = new THREE.Vector3(), camP = new THREE.Vector3(), gaze2 = new THREE.Vector3();
    const towerAt = (time, u) => {
      path.pointAt(u, camP);
      const dx = gx - camP.x, dz = gz - camP.z;
      const del = lerp(lerp(lerp(0.12, 0.6, smoothstep(M(205), M(262), u)), -0.2, smoothstep(M(272), M(318), u)), -0.03, smoothstep(M(325), M(352), u)), c = Math.cos(del), sn = Math.sin(del);
      const gy = lerp(lerp(rare ? 3 : 6, rare ? 12 : 24, smoothstep(M(130), M(260), u)), 35, smoothstep(M(295), M(345), u));
      return gaze.set(camP.x + dx * c - dz * sn, gy, camP.z + dx * sn + dz * c);
    };
    // a glance to the right as the flock lifts off beside us
    const flockAt = (time, u) => swans.route.pointAt(Math.min(swanS(u), swanLen * 0.995) - 5, gaze2);
    hero.setPortal({ color: look.portal, strength: 1, normal: [-DIVE.x, -DIVE.y, -DIVE.z] });

    const faunaSun = new THREE.Color(look.faunaSun[0]).multiplyScalar(look.faunaSun[1]), bell = ctx.core.bell;
    const gate = (lineY, y) => smoothstep(lineY - 0.7, lineY + 0.7, y), steamK0 = HU.uSteamK.value;
    const camW = new THREE.Vector3(), sunI0 = sky.uniforms.uSun.value.y, sunG0 = sky.uniforms.uSun.value.z, jetTop = HU.uGey.value.z, eclipse = SUN.y < 0.4 && Math.abs(SUN.x) > 0.5, lowSun = SUN.y < 0.25 && SUN.x > 0.5;
    const update = (dt, time, camera, u = 0) => {
      clock.value = time;
      // the ridge's shadow line sinks with path position and reaches the ground as the geyser breaks out
      const lm = u * LEN, lineY = !look.line ? -100 : lm < 190 ? lerp(4.3, -1.5, lm / 190) : lerp(-1.5, -7, smoothstep(190, 237, lm));
      const sunK = gate(lineY, 0.6);
      // the eruption surges at the breakout, stands full through the eclipse, then plays out to a 36 m column that stands
      // beside the Eye for the rest of the flight
      hero.setShadowLine(lineY); hero.setEruption(smoothstep(SURGE[0], SURGE[1], u) * (1 - 0.4 * smoothstep(M(385), M(480), u))); hero.update(dt, time, camera);
      // low across the pool we look into the sun through the spring's own vapour: it is drawn thinner there, and the sun's
      // disc is dimmed as a sun seen through steam is
      const through = bell(u, 0.47, 0.67, 0.25);
      HU.uVeilK.value = 1 - 0.7 * bell(u, 0.385, 0.67, 0.2);
      boilSteam.material.uniforms.uSteamK.value = steamK0 * (0.3 + 0.7 * bell(u, 0.44, 0.68, 0.2));
      sun.intensity = look.dir[1] * sunK;
      sky.update(dt, time, camera); ridges.update(dt, time, camera); river.update(dt, time, camera);
      // the eclipse: where the line from the eye to the sun passes the leaning jet, the sun's disc is hidden by it
      let occ = 0;
      if (eclipse) {
        camera.getWorldPosition(camW);
        const t = (gx - camW.x) / SUN.x, h = camW.y + SUN.y * t, v = clamp(h / jetTop, 0, 1.6), wJ = 3.2 + 3.2 * v;
        const miss = Math.abs(camW.z + SUN.z * t - (gz + wind[1] * v * v * 2.2));
        const col = t > 4 ? smoothstep(0, 4, h) * (1 - smoothstep(jetTop - 3, jetTop + 9, h)) * smoothstep(M(200), M(240), u) * (1 - smoothstep(M(385), M(420), u)) : 0;
        occ = col * Math.max(1 - smoothstep(wJ * 0.7, wJ * 1.6, miss), 0.5 * (1 - smoothstep(wJ, wJ + 9, miss)));
      }
      // the disc goes behind the tower; its glow stays and spills round the column
      sky.uniforms.uSun.value.y = sunI0 * (1 - 0.97 * occ) * (1 - (lowSun ? 0.6 * through : 0)); sky.uniforms.uSun.value.z = sunG0 * (1 + 0.25 * occ);
      brush.update(dt, time, camera); brush2.update(dt, time, camera);
      ice.update(dt, time, camera); spray.update(dt, time, camera); if (snowfall) snowfall.update(dt, time, camera);
      ice.setOpacity(lerp(0, 0.8, smoothstep(M(158), M(316), u)) * (1 - 0.5 * smoothstep(0.9, 1, u)));
      spray.setOpacity(bell(u, M(170), M(390)) * 0.4);
      // elk: the bull throws his head back as we come level with the bar
      elkU.uBugle.value = 0.6 * bell(u, M(47), M(158), 0.35);
      // swans: afloat, the run, then the flock on its route keyed to our progress
      const s = Math.min(swanS(u), swanLen * 0.995);
      const mm = u * LEN, run = smoothstep(28, 55, mm), lift = smoothstep(46, 55, mm);
      swanU.uRun.value.x = run;
      swans.update(dt, s / 19, camera);
      swans.uniforms.uPhase.value += time;
      swans.uniforms.uVis.value *= lift;
      swans.uniforms.uSunColor.value.copy(faunaSun).multiplyScalar(Math.max(sunK, gate(lineY, 2.2)));
      swans.object.visible = mm > 46 && s < swanLen * 0.99;
      swanMesh.visible = mm < 59;
      // rings: each is left where a foot struck (the bird has moved on 7 m/s times the ring's age) and spreads as it fades
      const ra = ringA.array; let anyRing = false;
      for (let k = 0; k < NRING; k++) {
        const r = rings[k], age = (((time / r.T + r.ph) % 1) + 1) % 1, j = r.j;
        let x = 0, z = 0, str = 0;
        if (r.flock) {
          if (lift > 0) {
            const sj = s - birdA[j * 4 + 2] - 7 * age * r.T;
            swans.route.pointAt(sj, P3); swans.route.pointAt(sj + 5, T3); T3.sub(P3); const tl = Math.hypot(T3.x, T3.z) || 1;
            x = P3.x + T3.z / tl * birdA[j * 4] + r.jx; z = P3.z - T3.x / tl * birdA[j * 4] + r.jz;
            str = lift * (1 - smoothstep(0.9, 2.3, P3.y + birdA[j * 4 + 1] - RV.y)) * (riverD(x, z) < -0.3 ? 1 : 0);
          }
        } else if (run > 0.02 && mm < 59) {
          const f = floaters[j]; x = f.x + r.jx * 0.6; z = f.z - 9 * run * run * (0.7 + 0.6 * f.seed) + 2.2 * age * r.T * run + r.jz * 0.4;
          str = smoothstep(0.02, 0.2, run) * (1 - smoothstep(0.8, 1, run));
        }
        ra[k * 4] = x; ra[k * 4 + 1] = z; ra[k * 4 + 2] = age; ra[k * 4 + 3] = str; if (str > 0) anyRing = true;
      }
      ringA.needsUpdate = true; ringMesh.visible = anyRing; splashMesh.visible = anyRing;
      fauna.update(dt, time, camera, u);
      if (stampede) {
        const runK = smoothstep(127, 143, u * LEN), S = stampS(u), o = stampede.tmp, pa = stampede.posA.array, sa = stampede.shadow.array;
        for (let i = 0; i < stampede.runners.length; i++) {
          const r = stampede.runners[i];
          stampede.at(S + r.al, r.lt, o);
          r.x = o.x; r.z = o.z; r.y = veg(o.x, o.z) + apronY(o.x, o.z); r.yaw = o.yaw + r.turn * (1 - runK);
          pa[i * 4] = r.x; pa[i * 4 + 1] = r.y; pa[i * 4 + 2] = r.z; pa[i * 4 + 3] = r.yaw;
          sa[i * 4] = r.x; sa[i * 4 + 1] = r.y; sa[i * 4 + 2] = r.z; sa[i * 4 + 3] = S < stampede.len - 26 ? 1.95 * r.scale : 0;
        }
        stampede.posA.needsUpdate = true; stampede.shadow.needsUpdate = true;
        stampede.runU.uGal.value.x = runK;
        // each puff is left where its runner was when it was kicked up (his speed times the puff's age behind him)
        const da = stampede.dust.geometry.attributes.aO, dd = da.array;
        for (let k = 0; k < stampede.puffs.length; k++) {
          const p = stampede.puffs[k], r = stampede.runners[p.j], T = p.p[1], age = (((time / T + p.p[0]) % 1) + 1) % 1 * T;
          stampede.at(S + r.al - 3.4 * r.scale - 11.5 * runK * age, r.lt + p.side, o);
          dd[k * 3] = o.x; dd[k * 3 + 1] = r.y + 0.25; dd[k * 3 + 2] = o.z;
        }
        da.needsUpdate = true;
        stampede.dust.material.uniforms.uSteamK.value = runK * (1 - smoothstep(316, 395, u * LEN));
        const show = S < stampede.len - 26; stampede.mesh.visible = show; stampede.dust.visible = show && runK > 0;
      }
    };
    hero.setShadowLine(look.line ? 4.3 : -100); hero.setEruption(0); sun.intensity = look.line ? 0 : look.dir[1];
    await sky.prewarm(ctx.renderer, null, scene);

    return {
      scene, path, duration: 58,
      // slow along the bank while the swans lift, easy through the turn and slower still as the sun slips behind the tower, a steady
      // low pass up the creek and round the rim, quick out over the flats and up the loop, easing as the Eye comes under us
      pace: (u) => {
        let p = lerp(0.66, 0.95, smoothstep(0.14, 0.2, u)) - 0.24 * bell(u, 0.3, 0.375, 0.4);
        p = lerp(p, 0.85, smoothstep(0.385, 0.43, u)); p = lerp(p, 1.4, smoothstep(0.63, 0.69, u)); p = lerp(p, 1.12, smoothstep(0.77, 0.83, u));
        return lerp(p, 1, smoothstep(0.9, 0.95, u));
      },
      title: lookName === 'winter' ? 'The Prismatic Eye, Midwinter' : lookName === 'night' ? 'The Prismatic Eye by Moonlight' : 'The Prismatic Eye',
      camera: { fov: 62, near: 0.3, far: 5200, lookAhead: 20, sway: 1, bank: 0.6 },
      // doubled entries only matter to the steady camera (which takes a third of each weight): they keep the tower and the Eye in its frame
      pois: [{ at: flockAt, from: M(32), to: M(119), weight: 0.55, fade: 0.3 },
        { at: towerAt, from: M(120), to: M(406), weight: 0.9, fade: 0.16 }, { at: towerAt, from: M(200), to: M(395), weight: 0.6, fade: 0.2 },
        { at: [0, 8, 0], from: M(375), to: M(470), weight: 0.5, fade: 0.3 },                      // the Eye opening ahead as we come down onto the creek
        { at: [0, 4, 0], from: M(505), to: M(612), weight: 0.85, fade: 0.25 },                    // the boil, from the south-west rim and across the west bay
        { at: [8, 1.5, -66], from: M(595), to: M(668), weight: 0.45, fade: 0.3 },                 // the bison on the north rim
        { at: [70, 0, -185], from: 0.622, to: 0.745, weight: 0.75, fade: 0.3 },                   // the terraces and the lesser pool
        { at: [0, 0, 0], from: 0.725, to: 0.955, weight: 0.9, fade: 0.25 }, { at: [0, 0, 0], from: 0.76, to: 0.95, weight: 0.7, fade: 0.25 }],
      portal: { shape: 'circle', radius: 7, color: look.portal, glow: 1, tilt: true, revealDistance: 420 },
      post: look.post,
      ride: 'none',
      update,
      dispose() { sky.dispose(); },
    };
  },
};
