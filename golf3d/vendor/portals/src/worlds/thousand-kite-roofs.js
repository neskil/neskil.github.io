// THE SKY IS FULL OF PAPER: kite-festival afternoon over an old Gujarati walled city. The camera is one tissue
// fighter kite: run low across the launch terrace, hauled up into five thousand others, cut loose in a duel,
// blown downwind over the roofs, between twin minarets and up the red kite train into the ring.
// World frame (the brief's): +X is the final heading (downwind), -Z the sunward left, ground 0, roofs 9-15 m.
// The city is a 12 m plot grid (columns x = 12 i, rows centred on z = 4 + 12 j) held in two small data textures
// that the roof, wall and ground shaders read for house-on-house shadows; plots merge into double houses and
// four-plot havelis, share party walls, open into tree-filled squares, and stand 7 to 14 m above real lane floors.
// The launch row and the skimmed row are continuous terraces (no cross walls) dressed down their centre line.
// Our own kite is tissue shaded in PROP_FRAG (fibres, creases, a moon, a sunward blaze) from its object position; it
// is seen whole (a diamond with a moon) ahead of the eye on the launch run, then slides up over the camera and is
// held just above the top edge of the picture (yRide in update: a nose cut by the frame's edge read as a fault). From
// about u 0.06 it is our line, leaving at the lower left until the rival cuts it, that says we are a kite.
// The ring hangs low (60 m) past the minarets; until the next world is live its hoop holds our own painted window
// (a morning sea, drawn in the vista shader) which irises away as the real portal view takes over.
// The rival kite (its paper drawn in RIVAL_FRAG) and the crossing lines of the duel are placed in the camera's frame. Looks by seed / ctx.vary.hour:
// clear afternoon, dusty gold haze, stiff wind, last gold half hour, lantern dusk, misty morning.
// Rare event: the great cut (three hundred lines go at once).
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import { makeSky, makeLightRig } from '../kit/sky.js';
import * as S from '../kit/structures.js';
import * as F from '../kit/fauna.js';
import * as flora from '../kit/flora.js';
import * as fx from '../kit/fx.js';
import { buildHero } from '../parts/thousand-kite-roofs.js';

const PAL = ['#F6E9D2', '#F4B8C6', '#CDE6A5', '#A9D4EF', '#C68A55', '#E3207F', '#D8281C'];
const sat = (x) => Math.min(1, Math.max(0, x));
const sstep = (a, b, x) => { const t = sat((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a + (b - a) * t;
const hx = (h) => { const c = new THREE.Color(h); return [c.r, c.g, c.b]; };
const sc = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
const mx = (a, b, t) => [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)];
function ih(i, j, k) {
  let h = (Math.imul(i | 0, 374761393) + Math.imul(j | 0, 668265263) + Math.imul(k | 0, 1274126177)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
const KW = 1.3, KZN = -1.25, KZT = 0.15, KZB = 1.6, KY = 0.6;      // our kite: half span, nose, wing tips and tail (z), height over the eye
const GY = 1.5;                             // the lane floor: the houses stand 7 to 14 m above it, so the lanes are deep slots
// the river runs north to south beyond the last houses (x in metres): from RIV0 a bank road and stone steps GHAT deep,
// the water, the far bank's steps up to RIV1, where the town begins again
const RIV0 = 1020, RIV1 = 1236, GHAT = 24;
const sunVec = (el, az = 10) => { const e = el * Math.PI / 180, a = az * Math.PI / 180; return new THREE.Vector3(Math.sin(a) * Math.cos(e), Math.sin(e), -Math.cos(a) * Math.cos(e)); };

// ---------------------------------------------------------------- looks
const LOOKS = {
  clear: { title: 'The Sky Is Full of Paper', el: 18, kites: 4800, exposure: 1.0, fog: '#DFDFD4', density: 0.0009, night: 0,
    sky: { zenith: '#2E7BD4', mid: '#6FAEE3', horizon: '#DDE2DE', ground: '#cdbfae', horizonPow: 5, midPow: 1.6, scatterColor: '#F6D6A4', scatter: 0.65, scatterPow: 4,
      sunColor: '#FFF0CC', sunSize: 0.9, sunIntensity: 12, sunGlow: 0.75 },
    sun: '#FFE0B0', sunI: 3.7, hemiSky: '#9CC4EE', hemiGnd: '#D9B48C', hemiI: 1.9, grade: { tint: '#fffaf2', shadowTint: '#0a0c22', saturation: 1.1 }, portal: '#ffb347' },
  dust: { title: 'Paper in a Gold Haze', el: 16, kites: 4800, exposure: 0.98, fog: '#EDD3A0', density: 0.0013, night: 0,
    sky: { zenith: '#3F7CC8', mid: '#9CBBD8', horizon: '#F2D9A2', ground: '#d2bd98', horizonPow: 4.2, midPow: 2.2, scatterColor: '#FFC766', scatter: 0.6, scatterPow: 4, scatterHigh: 0.04,
      sunColor: '#FFE7B8', sunSize: 1.0, sunIntensity: 10, sunGlow: 1.0 },
    sun: '#FFDCA0', sunI: 3.3, hemiSky: '#B4C6D6', hemiGnd: '#E0B880', hemiI: 1.9, grade: { tint: '#fff2d6', shadowTint: '#1a1020', saturation: 1.1 }, portal: '#ffbe4a' },
  wind: { title: 'A Stiff Wind over the Roofs', el: 16, kites: 4600, exposure: 1.02, fog: '#E3DBC6', density: 0.00095, night: 0, elevation: 0.45, meanY: 56, gust: 0.75,
    sky: { zenith: '#1F62C4', mid: '#5C9EE0', horizon: '#E4DCC8', ground: '#cdbfae', horizonPow: 4.4, midPow: 1.6, scatterColor: '#FFCB80', scatter: 0.8, scatterPow: 3.4,
      sunColor: '#FFEBC0', sunSize: 0.95, sunIntensity: 12, sunGlow: 0.85,
      clouds: { coverage: 0.42, scale: 1.25, opacity: 0.9, softness: 0.3, wind: [0.07, 0.016], haze: 0.3, lit: '#fff3de', shade: '#9296b6' },
      clouds2: { coverage: 0.5, stretch: 1, opacity: 0.62, scale: 0.9, haze: 0.9, wind: [0.1, 0.02] } },
    sun: '#FFD8A2', sunI: 4.1, hemiSky: '#94BEF2', hemiGnd: '#DDB080', hemiI: 1.75, grade: { tint: '#fff6e6', shadowTint: '#0a0c2a', saturation: 1.12 }, portal: '#ffb347' },
  golden: { title: 'The Last Gold Half Hour', el: 9.5, kites: 4800, exposure: 1.06, fog: '#EBC79C', density: 0.00095, night: 0,
    sky: { preset: 'goldenHour', zenith: '#3565AE', mid: '#8FA6C4', horizon: '#F6CF98', ground: '#c9a882', horizonPow: 3.2, midPow: 1.4, scatterColor: '#FFA850', scatter: 1.0, scatterPow: 3,
      sunColor: '#FFD9A0', sunSize: 1.1, sunIntensity: 12, sunGlow: 1.0 },
    sun: '#FFB45E', sunI: 3.7, hemiSky: '#9DB2E2', hemiGnd: '#E3A070', hemiI: 1.7, grade: { tint: '#fff1dc', shadowTint: '#140a26', saturation: 1.12 }, portal: '#ff9f3a' },
  dusk: { title: 'Lanterns up the Lines', el: 7, kites: 650, exposure: 1.22, fog: '#6A5C8C', density: 0.0012, night: 1, lanterns: true,
    sky: { preset: 'sunset', zenith: '#182654', mid: '#48508E', horizon: '#F0906A', ground: '#3a3048', horizonPow: 3, midPow: 1.3, scatterColor: '#FF7E4A', scatter: 0.9, scatterPow: 3,
      sunElevation: -3, sunIntensity: 0, sunGlow: 0.5, stars: 0.35, clouds: false },
    sun: '#E08C8C', sunI: 1.1, hemiSky: '#6C7CD0', hemiGnd: '#7A4E58', hemiI: 1.25, grade: { tint: '#f6f0ff', shadowTint: '#0a0620', saturation: 1.12 }, portal: '#ffa040' },
  morning: { title: 'First Kites in the Mist', el: 12, kites: 1500, exposure: 0.94, fog: '#DCC6B4', density: 0.00095, night: 0, mist: true,
    sky: { zenith: '#4E8CD0', mid: '#86B4E0', horizon: '#E9CDB4', ground: '#c9bfb4', horizonPow: 7, midPow: 1.4, scatterColor: '#FFD0AC', scatter: 0.8, scatterPow: 3,
      sunColor: '#FFE6C8', sunSize: 1.0, sunIntensity: 10, sunGlow: 1.0 },
    sun: '#FFCFA0', sunI: 3.4, hemiSky: '#A9C6EA', hemiGnd: '#CDB49C', hemiI: 1.4, grade: { tint: '#fff8f0', shadowTint: '#0c1028', saturation: 1.1 }, portal: '#ffc060' },
};

// ---------------------------------------------------------------- GLSL: the plot grid, shadows and roofs
const GLSL_CITY = /* glsl */`
uniform sampler2D tA, tB;
uniform vec4 uGrid;                       // x0, z0 of texel (0,0), 1/NX, 1/NZ
uniform vec3 uSunDir, uSun, uSky, uGnd, uShade;
uniform float uTime, uNight, uTanE, uTap;
float h1(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7)))*43758.5453); }
float vn(vec2 p){                          // smooth value noise
  vec2 i = floor(p), f = fract(p); f = f*f*(3. - 2.*f);
  return mix(mix(h1(i), h1(i + vec2(1., 0.)), f.x), mix(h1(i + vec2(0., 1.)), h1(i + vec2(1., 1.)), f.x), f.y);
}
// height of the house standing at world xz q (0 in a lane); self = the texel of the house being shaded (a haveli
// that spans several plots repeats one texel, so it never shades itself)
float bldH(vec2 q, vec4 self){
  vec2 g = (q - uGrid.xy)/12.; vec2 c = floor(g); vec2 m = (g - c)*12.;
  vec2 uv = (c + .5)*uGrid.zw;
  vec4 a = textureLod(tA, uv, 0.); vec4 ins = textureLod(tB, uv, 0.)*6.;
  float inside = step(ins.x, m.x)*step(m.x, 12. - ins.y)*step(ins.z, m.y)*step(m.y, 12. - ins.w);
  vec4 d = abs(a - self);
  inside *= step(.0015, d.x + d.y + d.z + d.w);
  return a.a*20.*inside;
}
float tapVis(vec2 p, float y, vec2 sn, float t, vec4 self){
  float h = bldH(p + sn*t, self);
  return 1. - smoothstep(-.35, .35, h + .9 - y - t*uTanE)*step(.5, h);
}
// 1 = sunlit, 0 = in the shadow of a house toward the sun (four taps, no loop)
float sunVis(vec2 p, float y, vec2 cell){
  vec4 self = textureLod(tA, (cell + .5)*uGrid.zw, 0.);
  vec2 sn = normalize(uSunDir.xz + vec2(1e-4, 0.));
  return tapVis(p, y, sn, 2.6*uTap, self)*tapVis(p, y, sn, 6.*uTap, self)*tapVis(p, y, sn, 11.*uTap, self)*tapVis(p, y, sn, 19.*uTap, self);
}
// sliding shadows of the kites overhead
float kiteShade(vec2 wxz){
  vec2 g = (wxz + vec2(-uTime*.6, -uTime*1.1))/6.5; vec2 cid = floor(g);
  vec2 f = fract(g) - .5 - (vec2(h1(cid), h1(cid + 3.1)) - .5)*.5;
  return 1. - .55*step(.62, h1(cid + 9.7))*(1. - smoothstep(.09, .15, abs(f.x) + abs(f.y)))*(1. - uNight);
}
// a flat roof: m = position inside the plot, dm = plot size, cell = grid cell, real = 1 when it carries real props,
// open = 1 on the sides (x-, x+, z-, z+) where the roof runs on into the next plot of the same haveli
vec3 roofShade(vec2 m, vec2 dm, vec3 wall, float seed, vec2 wxz, float h, vec2 cell, float real, vec4 open, float plain){
  vec4 ed = vec4(m.x, dm.x - m.x, m.y, dm.y - m.y) + open*99.;
  float edge = min(min(ed.x, ed.y), min(ed.z, ed.w));
  float n = vn(wxz*.33 + seed), n2 = vn(wxz*1.3 + seed*3.);
  vec3 roof = mix(vec3(.63, .5, .39), wall, .4)*(.78 + .26*n)*(.92 + .14*n2);            // sun-baked lime and clay, tinted by the house's own wash
  float rk = max(h1(vec2(seed, 37.)), plain);                                             // one roof in three is another kind: tar, terracotta, a blue tarpaulin, red oxide, ochre
  if (rk < .05) roof = vec3(.17, .17, .2)*(.7 + .5*n)*(.85 + .3*n2);
  else if (rk < .17) roof = vec3(.6, .27, .15)*(.78 + .3*n)*(.9 + .2*n2);
  else if (rk < .21) roof = mix(roof, vec3(.08, .27, .6)*(.75 + .4*vn(wxz*vec2(.5, 2.6) + seed)), step(1., edge)*(1. - real));
  else if (rk < .27) roof = vec3(.5, .2, .16)*(.8 + .3*n)*(.9 + .2*n2);
  else if (rk < .34) roof = vec3(.66, .5, .22)*(.8 + .26*n)*(.9 + .2*n2);
  roof *= .82 + .18*smoothstep(.3, 1.6, edge);                                  // grime along the parapet foot
  vec2 tl = abs(fract(wxz/1.4) - .5), tw = fwidth(wxz)/1.4;                      // floor tiles; each set of joints fades out before it can alias
  vec2 jn = smoothstep(vec2(.465) - tw, vec2(.5), tl)*(1. - smoothstep(vec2(.035), vec2(.12), tw));
  float rl = 1. - smoothstep(.5, 1.5, max(tw.x, tw.y)*1.4);                     // the small things on a far roof fade out before they can sparkle
  roof *= 1. - .2*max(jn.x, jn.y);
  vec2 sn = normalize(uSunDir.xz + vec2(1e-4, 0.));
  float cot = 1./max(uTanE, .05);
  float tx = (sn.x < 0. ? ed.x : ed.y)/max(abs(sn.x), 1e-3);
  float tz = (sn.y < 0. ? ed.z : ed.w)/max(abs(sn.y), 1e-3);
  float lit = smoothstep(cot*.92, cot*1.02, min(tx, tz));
  // a cloth of chillies, turmeric or a bedsheet drying
  vec2 cc = dm*(.3 + .4*vec2(h1(vec2(seed, 3.1)), h1(vec2(seed, 5.3))));
  vec2 cq = abs(m - cc) - vec2(.8 + h1(vec2(seed, 9.))*.9, .6 + h1(vec2(seed, 13.))*.7)*(.5 + 1.5*h1(vec2(seed, 19.)));
  float cloth = step(max(cq.x, cq.y), 0.)*step(.7, h1(vec2(seed, 11.)))*(1. - real)*rl;
  float ck = h1(vec2(seed, 17.));
  vec3 clothC = ck < .4 ? vec3(.62, .05, .03) : (ck < .65 ? vec3(.86, .52, .04) : (ck < .85 ? vec3(.8, .78, .72) : vec3(.12, .4, .62)));
  roof = mix(roof, clothC, cloth);
  // painted stair-head shed and its long shadow (far roofs only)
  vec2 sc0 = dm*(.26 + .48*vec2(h1(vec2(seed, 1.3)), h1(vec2(seed, 7.7))));
  vec2 q = m - sc0;
  float hasShed = (1. - real)*step(.14, h1(vec2(seed, 43.)))*rl;
  float shed = step(max(abs(q.x), abs(q.y)), 1.25)*hasShed;
  vec2 q1 = q + sn*cot*.8, q2 = q + sn*cot*1.6, q3 = q + sn*cot*2.4;
  float ss = max(step(max(abs(q1.x), abs(q1.y)), 1.25), max(step(max(abs(q2.x), abs(q2.y)), 1.25), step(max(abs(q3.x), abs(q3.y)), 1.25)));
  lit *= 1. - ss*(1. - shed)*hasShed;
  // dark water tank
  vec2 tq = m - dm*(.2 + .6*vec2(h1(vec2(seed, 21.)), h1(vec2(seed, 23.))));
  float tank = (1. - smoothstep(.55, .7, length(tq)))*(1. - real)*rl;
  roof = mix(roof, mix(vec3(.1, .1, .12), vec3(.7, .7, .68), step(.5, h1(vec2(seed, 27.)))), tank);
  lit *= sunVis(wxz, h, cell)*mix(1., kiteShade(wxz), rl);
  float par = 1. - smoothstep(.3, .38, edge);
  vec3 shedC = mix(wall, vec3(.76, .72, .68), .35 + .4*h1(vec2(seed, 31.)));
  vec3 alb = mix(mix(roof, shedC, shed), wall*1.04, par);
  lit = mix(lit, 1., max(par, shed)*.8);
  vec3 c = alb*(uShade + uSun*(max(uSunDir.y, 0.)*1.5 + .2*max(par, shed))*lit);
  // dusk: a bare bulb on some roofs
  float bulb = step(.72, h1(cell + 41.))*uNight;
  c += vec3(1., .62, .28)*bulb*(alb*1.6*exp(-dot(q, q)*.09) + 5.*exp(-dot(q, q)*9.));
  return c;
}`;

const BOX_VERT = /* glsl */`
#include <common>
#include <fog_pars_vertex>
attribute vec4 iB; attribute vec4 iD; attribute vec3 iCol;
varying vec3 vN; varying vec3 vP; flat varying vec3 vCol; varying vec4 vM; flat varying vec4 vDim; flat varying vec2 vCell;
void main(){
  vec3 lp = vec3(iB.x + position.x*iD.x, position.y*iB.y, iB.z + position.z*iD.y);
  vN = normal; vP = lp; vCol = iCol; vDim = vec4(iD.xy, iB.w, iD.z); vCell = vec2(iD.w, floor(iB.w));
  vM = vec4((position.xz + .5)*iD.xy, abs(normal.x) > .5 ? position.z*iD.y : position.x*iD.x, iB.y - lp.y);
  vec4 mvPosition = modelViewMatrix*vec4(lp, 1.);
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const BOX_FRAG = /* glsl */`
#include <common>
#include <fog_pars_fragment>
${GLSL_CITY}
varying vec3 vN; varying vec3 vP; flat varying vec3 vCol; varying vec4 vM; flat varying vec4 vDim; flat varying vec2 vCell;
void main(){
  vec3 c; float seed = fract(vDim.z)*97.;
  vec2 cell = floor((vec2(vP.x - vN.x*.5, vP.z - vN.z*.5) - uGrid.xy)/12.);
  if (vN.y > .5) c = roofShade(vM.xy, vDim.xy, vCol, seed, vP.xz, vP.y, cell, vDim.w, vec4(step(.5, mod(vCell.x, 2.)), step(1.5, mod(vCell.x, 4.)), 0., 0.), step(3.5, vCell.x));
  else {
    float top = vM.w, y = vP.y, u = vM.z;
    float fp = fwidth(u) + fwidth(y), lod = 1. - smoothstep(.7, 1.8, fp), lod2 = 1. - smoothstep(.1, .3, fp);   // far walls go plain before windows and slats can alias
    float pn = .6*vn(vec2(u*.45, y*.3) + seed) + .4*vn(vec2(u*1.7, y*.9) + seed*1.7);                    // patched, stained limewash
    vec3 alb = vCol*(.74 + .3*pn)*(.74 + .26*smoothstep(0., 2.4, top))*(.5 + .5*smoothstep(1., 12., y));
    float streak = smoothstep(.5, .78, vn(vec2(u*2.6 + seed, y*.07)))*(.55 + .45*vn(vec2(u*9., y*.4 + seed)));
    alb *= 1. - .3*streak*lod*(1. - smoothstep(.3, 4.2, top))*step(1.05, top);                                  // rain streaks under the parapet
    alb = mix(alb, vCol*1.06, 1. - smoothstep(.95, 1.05, top));                                          // parapet band
    alb = mix(alb, vCol*.55, (1. - smoothstep(.03, .09, abs(top - 1.08)))*.7);                           // string course
    float jx = fract(u/1.15) - .5;                                                                       // a row of ventilator jalis under the string course
    float jal = step(abs(jx), .15)*step(abs(top - 1.6), .17)*step(.4, h1(vec2(seed, 71.)))*lod2;
    alb = mix(alb, vCol*mix(.3, .85, max(step(abs(jx), .022), step(abs(top - 1.6), .03))), jal);
    alb = mix(alb, vCol*.6, step(.5, fract(u*2.2))*step(abs(top - 1.22), .09)*lod2*.8);                  // carved bracket ticks
    alb *= 1. - .14*(1. - smoothstep(2.95, 3.05, y))*lod;                                                // a painted dado along the lane
    alb *= 1. - .3*(1. - smoothstep(0., .06, abs(y - 3.05)))*lod2;
    vec2 wq = vec2(u/2.3 + .5, (top - 1.25)/3.1); vec2 wf = fract(wq) - .5; vec2 wi = floor(wq);        // the window rows hang from the roofline
    float hw = h1(wi + seed);
    float okW = step(1.7, top)*step(1.9, y - (.27 - wf.y)*3.1);
    float win0 = step(abs(wf.x), .2)*step(abs(wf.y), .27)*step(.28, hw)*okW, win = win0*lod;
    vec3 shut = mix(vec3(.06, .05, .07), mix(vec3(.07, .3, .34), mix(vec3(.36, .19, .09), vec3(.16, .25, .5), step(.6, h1(wi*2.3 + seed))), h1(wi*1.7 + seed)), step(.45, h1(wi + 4.4)));
    float slat = mix(.9, .8 + .2*step(.5, fract(wf.y*14.)), lod2);
    alb = mix(alb, shut*slat, win);
    float balc = step(.78, hw)*step(abs(wf.x), .34)*step(abs(wf.y - .3), .07)*okW*lod;   // carved wooden balcony rail
    alb = mix(alb, vec3(.3, .17, .08)*(.7 + .5*step(.5, fract(u*4.))), balc);
    alb = mix(vCol*.77*(.5 + .5*smoothstep(1., 12., y)), alb, lod);
    float lit = max(dot(normalize(vN), uSunDir), 0.)*sunVis(vP.xz + vN.xz*.4, y, cell);
    c = alb*(mix(uGnd, uShade, .55)*1.05 + uSun*lit*.95);
    c += vec3(1., .66, .3)*uNight*2.4*mix(.05*okW, win0*step(.62, h1(wi*3.1 + seed)), lod);
  }
  gl_FragColor = vec4(c, 1.);
  #include <fog_fragment>
}`;
const PLANE_VERT = /* glsl */`
#include <common>
#include <fog_pars_vertex>
varying vec3 vP;
void main(){
  vP = (modelMatrix*vec4(position, 1.)).xyz;
  vec4 mvPosition = viewMatrix*vec4(vP, 1.);
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const PLANE_FRAG = /* glsl */`
#include <common>
#include <fog_pars_fragment>
${GLSL_CITY}
uniform vec3 uCamP, uRiver, uSand, uAvg, uHorz; uniform vec4 uTank, uBoxed;
const float R0 = ${RIV0.toFixed(1)}, R1 = ${RIV1.toFixed(1)}, GH = ${GHAT.toFixed(1)};
varying vec3 vP;
// a striped awning in an open square: x = the cloth, y = its shadow on the ground (off = the way shadows fall, 2.6 m up)
vec2 awn(vec2 m0, vec2 cell, float k, vec2 off, out vec3 col){
  vec2 c = 2.2 + vec2(h1(cell + k*7.1 + 2.3), h1(cell + k*3.7 + 8.9))*7.6;
  float rot = step(.5, h1(cell + k*5.3));
  vec2 hs = mix(vec2(1.5, 1.), vec2(1., 1.5), rot);
  vec2 q = m0 - c, qs = q - off;
  float ck = h1(cell + k*9.1);
  col = ck < .3 ? vec3(.62, .08, .05) : (ck < .55 ? vec3(.8, .5, .06) : (ck < .78 ? vec3(.08, .36, .5) : vec3(.5, .1, .4)));
  col = mix(col, vec3(.78, .74, .66), step(.5, fract((rot > .5 ? q.x : q.y)*1.6)));
  return vec2(step(max(abs(q.x) - hs.x, abs(q.y) - hs.y), 0.), step(max(abs(qs.x) - hs.x, abs(qs.y) - hs.y), 0.))*step(.3, h1(cell + k*1.9 + 4.));
}
void main(){
  vec2 p = vP.xz;
  float fw = max(fwidth(p.x), fwidth(p.y)), fwz = fwidth(p.y);
  vec2 g = (p - uGrid.xy)/12.; vec2 cell = floor(g); vec2 m0 = (g - cell)*12.;
  vec2 uv = (cell + .5)*uGrid.zw;
  vec4 a = textureLod(tA, uv, 0.); vec4 ins = textureLod(tB, uv, 0.)*6.;
  vec2 m = m0 - ins.xz, dm = vec2(12.) - ins.xz - ins.yw;
  float inG = step(abs(uv.x - .5), .5)*step(abs(uv.y - .5), .5);
  float inside = step(0., min(min(m.x, dm.x - m.x), min(m.y, dm.y - m.y)))*step(.01, a.a)*inG;
  float seed = h1(cell + 1.7)*97.;
  float sunY = max(uSunDir.y, 0.);
  // lanes, bazaar streets and courtyards: packed earth, sunlit only where the houses let the sun in
  float dn = vn(p*.7);
  vec3 lane = vec3(.3, .25, .2)*(.75 + .35*dn)*(.9 + .2*vn(p*3.1));
  float xr = p.x - R0, wr = R1 - R0;
  float river = step(0., xr)*step(xr, wr);
  float openC = (1. - step(.01, a.a))*inG*(1. - river);
  float court = openC*step(.1, a.r)*(1. - step(.35, a.r)*step(a.r, .6));                              // the court of a tomb or a temple, the walk round the tank: clean flags, no stalls
  float square = openC*(1. - court);
  float lodA = 1. - smoothstep(.9, 2.6, fw);
  vec2 ftl = abs(fract(p/1.4) - .5); float ftw = fw/1.4;
  vec2 fj = smoothstep(vec2(.455 - ftw), vec2(.5), ftl)*(1. - smoothstep(.035, .12, ftw));
  lane = mix(lane, lane*vec3(1., .96, .9)*(1. - .3*max(fj.x, fj.y)), openC);                         // the squares are flagged
  lane = mix(lane, vec3(.5, .44, .37)*(.86 + .22*dn)*(1. - .2*max(fj.x, fj.y)), court);
  float pd = length(m0 - 6.);                                                                         // a stone platform in the middle, where the tree stands
  lane = mix(lane, vec3(.46, .42, .38)*(.85 + .3*dn), square*(1. - smoothstep(1.9, 2., pd)));
  lane *= 1. - .4*square*(1. - smoothstep(.02, .14, abs(pd - 2.)))*lodA;
  float dl = min(min(m0.x, 12. - m0.x), min(m0.y, 12. - m0.y));
  lane *= 1. - .22*(1. - smoothstep(.2, 1.3, dl))*(1. - openC);                                       // a worn track down every lane
  // the tank: five stone steps down to the water all round it
  float td = length(p - uTank.xy), tr = uTank.z;
  float tring = (1. - smoothstep(tr + 7.7, tr + 8.3, td))*step(1., tr), twat = (1. - smoothstep(tr - .4, tr + .4, td))*step(1., tr);
  float ts = clamp(td - tr, 0., 7.99)/1.6;
  lane = mix(lane, vec3(.57, .47, .37)*(.6 + .09*floor(ts))*(1. - .28*(1. - smoothstep(0., .22, fract(ts)))*(1. - smoothstep(.3, 1.2, fw))), tring);
  vec2 aoff = -normalize(uSunDir.xz + vec2(1e-4, 0.))*min(2.6/max(uTanE, .05), 5.);
  vec3 ac0, ac1, ac2, ac3;
  vec2 w0 = awn(m0, cell, 0., aoff, ac0), w1 = awn(m0, cell, 1., aoff, ac1), w2 = awn(m0, cell, 2., aoff, ac2), w3 = awn(m0, cell, 3., aoff, ac3);
  float vis0 = sunVis(p, vP.y, vec2(-9.));
  float vis = vis0*(1. - .8*max(max(w0.y, w1.y), max(w2.y, w3.y))*square*lodA);
  vec3 c = lane*(uShade*.75 + uSun*sunY*1.4*vis);
  vec3 awc = w0.x > .5 ? ac0 : (w1.x > .5 ? ac1 : (w2.x > .5 ? ac2 : ac3));
  c = mix(c, awc*(uShade*.9 + uSun*sunY*1.5*vis0), max(max(w0.x, w1.x), max(w2.x, w3.x))*square*lodA);
  c += vec3(1., .6, .25)*uNight*.5*step(.93, h1(floor(p*.22)))*exp(-8.*length(fract(p*.22) - .5));
  vec3 roofC = roofShade(m, dm, a.rgb, seed, p, a.a*20., cell, 0., vec4(step(ins.x, .01), step(ins.y, .01), step(ins.z, .01), step(ins.w, .01)), 0.);
  c = mix(c, roofC, inside);
  // beyond the eye's resolution the mosaic melts. Where real houses stand over it the plane is only their lanes and
  // squares, and goes to their own shaded mean (the blocks keep their dark gaps); elsewhere it is roofs and lanes
  // together and goes to the town's mean, scored by the bazaar streets and varied from quarter to quarter
  float far = max(smoothstep(1.5, 5., fw), 1. - inG);
  float boxed = step(uBoxed.x, p.x)*step(p.x, uBoxed.y)*step(abs(p.y + 2.), mix(uBoxed.z, uBoxed.w, step(R1, p.x)));
  vec3 mean = uAvg*(.84 + .34*vn(p*.013 + 2.))*mix(vec3(1.07, .98, .9), vec3(.92, 1., 1.1), vn(p*.0071 + 9.));
  float sx = abs(fract((g.x - 3.)/14. + .5) - .5)*168., sz = abs(fract((g.y - 6.)/19. + .5) - .5)*228.;
  mean *= 1. - .3*(1. - smoothstep(3., 8. + fw, min(sx, sz)))*(1. - smoothstep(18., 50., fw))*inG;
  vec3 farC = mix(mean*(uShade + uSun*.5)*1.25, lane*(uShade*.75 + uSun*sunY*1.4*mix(.16, .75, openC)), boxed);
  c = mix(c, farC, far);
  // water: the tank with its island of grass, and the river
  vec3 V = normalize(uCamP - vP + vec3(0., 1e-4, 0.)); float gz = clamp(V.y, 0., 1.);
  float band = .5 + .5*sin(p.y*.012 + p.x*.03 + sin(p.y*.004)*3.);
  vec3 deep = vec3(.04, .19, .24);
  vec2 gp = p*vec2(.08, .3); vec2 gi = floor(gp);
  float tw = h1(gi), gl = pow(max(sin(tw*6.283 + uTime*(1.5 + 3.*h1(gi + 7.))), 0.), 24.)*step(.55, tw);
  vec3 pond = mix(deep*vec3(.9, 1.15, .9), uRiver, .42 - .2*smoothstep(.08, .45, gz))*(.8 + .25*vn(p*.21 + uTime*.05))*(.5 + .5*vis0) + uSun*gl*.7*vis0*(1. - uNight);
  pond = mix(pond, vec3(.2, .34, .11)*(.8 + .4*dn)*(uShade + uSun*sunY*1.4*vis0), 1. - smoothstep(7.4, 8.2, td));
  c = mix(c, pond, twat);
  // the river beyond the last houses: a flagged road along each bank, three flights of stone steps going down, saris
  // laid out on them to dry, sand between the ghats, then the water with the far bank standing in it
  float bank = min(xr, wr - xr), side = step(wr*.5, xr);
  float shore = GH + 3.*(vn(vec2(p.y*.021, side*7.3 + 1.)) - .5);
  float wet = smoothstep(shore - .7, shore + .7, bank);
  float flt = floor(clamp(bank - 6., 0., 17.9)/6.);
  vec3 stone = mix(vec3(.6, .49, .38), vec3(.5, .39, .32), h1(vec2(floor(p.y/37.), side + 2.)))*(1. - .13*flt)*(.9 + .2*dn);
  stone *= 1. - .25*(1. - smoothstep(0., .3, fract(max(bank - 6., 0.)/1.2)))*(1. - smoothstep(.3, 1.3, fw))*step(6., bank);
  float sandy = smoothstep(.56, .66, vn(vec2(p.y*.0065, side*3. + 4.)))*step(6., bank);
  float rip = (.5 + .5*sin(p.x*.85 + sin(p.y*.045)*5. + vn(p*.09)*7.))*(1. - smoothstep(.25, 1.1, fw));
  stone = mix(stone, uSand*mix(1., .85 + .25*h1(floor(p*.5)), 1. - smoothstep(1., 4., fw))*(.9 + .12*rip), sandy);
  vec2 sq = vec2(p.y/3.4, side*5. + 2.); float sh = h1(vec2(floor(sq.x), sq.y)), sk = h1(vec2(floor(sq.x), sq.y + 9.));
  float sari = step(.6, sh)*step(abs(fract(sq.x) - .5), .37)*step(8., bank)*step(bank, 13. + 8.*sk)*(1. - wet)*(1. - smoothstep(1.3, 3.2, fwz));
  vec3 sariC = sk < .25 ? vec3(.78, .06, .2) : (sk < .5 ? vec3(.9, .5, .04) : (sk < .7 ? vec3(.05, .42, .5) : (sk < .85 ? vec3(.85, .8, .7) : vec3(.4, .1, .5))));
  stone = mix(stone, sariC, sari*.92);
  vec3 bankC = stone*(uShade*.8 + uSun*sunY*1.45*vis0);
  vec3 water = mix(deep, uRiver, .5 - .22*smoothstep(.08, .45, gz))*(.82 + .3*band);
  float refl = smoothstep(wr - GH - 44., wr - GH - 3., xr)*(1. - uNight);
  water = mix(water, uAvg*(uShade + uSun*.4)*(.75 + .5*vn(vec2(p.y*.11, 5.))), refl*.5);
  water += uSun*gl*1.1*step(.75, tw)*(1. - uNight);
  float across = smoothstep(GH, wr - GH, xr);
  vec2 gi2 = floor(p*vec2(.21, .56)); float tw2 = h1(gi2 + 5.);
  float gl2 = pow(max(sin(tw2*6.283 + uTime*(.8 + 1.6*h1(gi2 + 3.))), 0.), 16.)*step(.82, tw2)*(1. - smoothstep(2., 6., fw));
  water = mix(water, mix(uRiver*.75, uHorz, across*across)*(.82 + .3*band) + vec3(1., .55, .22)*gl2*.7*(1. - .6*across), uNight);   // dusk: the afterglow lies on it, a few lamps glitter
  c = mix(c, mix(bankC, water, wet), river);
  // outside the walls the town thins into fields: mustard in flower, green wheat, stubble, bare earth, woods
  vec2 og = max(abs(uv - .5) - .5, 0.)/uGrid.zw*12.;
  float cty = smoothstep(30., 240., max(og.x, og.y) + 70.*vn(p*.0055 + 4.))*(1. - river);
  vec2 fq = p*vec2(.0085, .013) + vn(p*.0031 + 7.)*1.6; vec2 fi = floor(fq), ff = fract(fq);
  float fh = h1(fi + 3.3);
  vec3 field = fh < .28 ? vec3(.19, .33, .1) : (fh < .52 ? vec3(.6, .5, .1) : (fh < .78 ? vec3(.43, .33, .2) : vec3(.3, .4, .15)));
  float fe = min(min(ff.x, 1. - ff.x)/.0085, min(ff.y, 1. - ff.y)/.013);
  field *= 1. - .3*(1. - smoothstep(1.5, 5. + fw, fe))*(1. - smoothstep(6., 25., fw));
  field = mix(field, vec3(.34, .36, .15), smoothstep(15., 70., fw)*.75);
  field = mix(field, vec3(.085, .17, .065), smoothstep(.56, .68, vn(p*.017 + 11.))*.85);
  c = mix(c, field*(uShade + uSun*sunY*1.5), cty);
  gl_FragColor = vec4(c, 1.);
  #include <fog_fragment>
}`;

// ---------------------------------------------------------------- props, cloth and paper: one lit vertex-colour shader
const PROP_VERT = /* glsl */`
#include <common>
#include <fog_pars_vertex>
attribute vec3 aCol; attribute vec3 aW;       // wave amplitude (m), phase, translucency
uniform float uTime, uFlut, uAmp;
varying vec3 vN; varying vec3 vP; varying vec3 vCol; varying float vTr; varying vec3 vL; varying vec3 vTx; varying float vRip; varying float vBox;
void main(){
  float w = sin(uTime*uFlut + aW.y) + .4*sin(uTime*uFlut*2.3 + aW.y*1.7);
  float fig = step(aW.z, -1.5);               // part of a figure: it rides up and down by aW.x (a flyer tugging his line)
  vBox = (aW.z < -.5 && fig < .5) ? aW.y - 2. : -1.;        // a marked box: 0 at its foot, 1 at its top (3 = a tin lid)
  vec3 lp = position + normal*aW.x*w*uAmp*(1. - fig);
  float tug = sin(uTime*2.4 + aW.y);
  lp.y += fig*aW.x*tug*tug;
  vec4 wp = modelMatrix*vec4(lp, 1.);
  vN = mat3(modelMatrix)*normal; vP = wp.xyz; vCol = aCol; vTr = max(aW.z, 0.);
  vL = position; vTx = normalize(modelMatrix[0].xyz + vec3(1e-6, 0., 0.));
  vRip = aW.x*uAmp*(cos(uTime*uFlut + aW.y) + .68*cos(uTime*uFlut*2.3 + aW.y*1.7));          // slope of the wave, so a ripple shades
  vec4 mvPosition = viewMatrix*wp;
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const PROP_FRAG = /* glsl */`
#include <common>
#include <fog_pars_fragment>
uniform vec3 uSunDir, uSun, uSky, uGnd, uCamP, uMoon; uniform float uNight, uGain, uTime, uFlut;
varying vec3 vN; varying vec3 vP; varying vec3 vCol; varying float vTr; varying vec3 vL; varying vec3 vTx; varying float vRip; varying float vBox;
float ph1(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7)))*43758.5453); }
float pvn(vec2 p){
  vec2 i = floor(p), f = fract(p); f = f*f*(3. - 2.*f);
  return mix(mix(ph1(i), ph1(i + vec2(1., 0.)), f.x), mix(ph1(i + vec2(0., 1.)), ph1(i + vec2(1., 1.)), f.x), f.y);
}
void main(){
  vec3 N = normalize(vN + vec3(0., 1e-5, 0.)), V = normalize(uCamP - vP + vec3(0., 1e-5, 0.));
  if (dot(N, V) < 0.) N = -N;
  float tis = step(.95, vTr);                                    // our own kite's tissue, seen from beneath against the sky
  float mot = pvn(vec2(vP.x + vP.z*.73, vP.y*.6)*.9), mot2 = pvn(vec2((vP.x - vP.z*.61)*4.3, vP.y*.35));     // stains and vertical streaks
  vec3 alb = vCol*mix(.86 + .16*mot + .08*mot2, 1., step(.25, vTr));
  float fb = fwidth(vBox), fx_ = fwidth(vP.x) + fwidth(vP.z);
  if (vBox > 2.5) alb *= 1. - .2*(.5 + .5*sin((vP.x + vP.z*.02)*38.))*(1. - smoothstep(.02, .07, fx_));        // corrugated tin
  else if (vBox > -.5 && abs(N.y) < .5) {                         // limewash: mottled, grimy at the foot, rain-streaked under the lid, a painted dado
    float bu = vP.x + vP.z;
    alb *= .76 + .34*pvn(vec2(bu, vP.y*.8)*1.2);
    alb *= mix(.68, 1., smoothstep(0., .3, vBox));
    alb *= 1. - .28*smoothstep(.55, .8, pvn(vec2(bu*6., vP.y*.12)))*smoothstep(.45, 1., vBox);
    alb *= mix(.8, 1., smoothstep(.215, .225, vBox));
    alb *= 1. - .35*(1. - smoothstep(.012, .012 + fb, abs(vBox - .232)))*(1. - smoothstep(.02, .06, fb));
  }
  if (tis > .5) {
    float tt = uTime*uFlut;
    float r1 = cos(vL.x*6.5 - vL.z*4. + tt*.9), r2 = cos(vL.x*15. + vL.z*11. - tt*1.7), r3 = cos(vL.x*27. - vL.z*19. + tt*2.6);
    N = normalize(N + vTx*(vRip*5.2 + .2*r1 + .14*r2 + .08*r3));                   // the paper ripples and buzzes
    float kx = abs(vL.x)/${KW.toFixed(2)};
    float ef = (vL.z - (${KZN.toFixed(2)} + ${(KZT - KZN).toFixed(2)}*kx))*.68, er = (${KZT.toFixed(2)} + ${(KZB - KZT).toFixed(2)}*(1. - kx) - vL.z)*.72;   // how far in from the leading and trailing edges
    float md = length(vL.xz - vec2(0., -.2)), md2 = length(vL.xz - vec2(.13, -.3));
    float moon = (1. - smoothstep(.36, .375, md))*smoothstep(.27, .285, md2);       // a crescent moon on the breast
    moon = max(moon, smoothstep(1., 1.02, vL.z));                                    // the tail quarter in the second paper
    moon = max(moon, 1. - smoothstep(.055, .068, min(ef, er)));                      // a pasted border all round
    alb = mix(alb, uMoon, moon);
    float fib = pvn(vL.xz*vec2(90., 7.)), fib2 = pvn(vL.xz*vec2(31., 2.6) + 7.);
    alb *= .7 + .32*fib + .18*fib2; alb += vec3(.05, .035, .05)*fib*fib2;  // long fibres in the tissue
    alb *= 1. - .24*smoothstep(.45, .5, abs(fract(vL.x*3. + .5) - .5));            // creases where the sheets are pasted
    alb *= 1. - .16*smoothstep(.44, .5, abs(fract(vL.z*2.2 + .1) - .5));
    alb *= mix(.22, 1., smoothstep(.01, .03, abs(vL.x)));                           // the bamboo spine, dark through the paper
    alb *= mix(.3, 1., smoothstep(.008, .022, abs(vL.z - (${(KZN + 0.3).toFixed(2)} + ${(KZT - KZN - 0.3).toFixed(2)}*kx*kx))));   // and the bow
  }
  float ndl = dot(N, uSunDir);
  vec3 amb = mix(uGnd, uSky, .5 + .5*N.y)*1.1;
  vec3 c = alb*(amb + uSun*max(ndl, 0.));
  float vds = max(dot(-V, uSunDir), 0.);
  vec3 tc = mix(vCol, alb, tis);
  c += (tc*tc*.6 + tc*.75)*uSun*max(-ndl, 0.)*mix(1.5, .9, tis)*(.5 + .5*vds*vds)*vTr;       // stained-glass tissue against the sun
  float hot = vds*vds*vds;
  c += tis*((tc + .06)*uSun*hot*1.7 + tc*(uSky*(.4 + .9*(1. - smoothstep(.16, .42, uSunDir.y))) + vec3(1., .58, .28)*.32*uNight));     // the sunward side blazes; sky light comes through; at dusk the lamps below light it
  c *= uGain;
  gl_FragColor = vec4(c, 1.);
  #include <fog_fragment>
}`;

// ---------------------------------------------------------------- the rival kite: paper drawn from its own face coordinates
const RIVAL_VERT = /* glsl */`
#include <common>
#include <fog_pars_vertex>
attribute vec3 aUv; attribute float aT;
uniform float uTime;
varying vec3 vN; varying vec3 vP; varying vec3 vUv;
void main(){
  vec3 lp = position; float part = aUv.z;
  if (part > 1.5) {
    float wa = uTime*7. - aT*5.5;
    lp.x += (sin(wa)*.26 + sin(uTime*11.3 - aT*9.)*.1)*aT*1.5;
    lp.z += cos(wa)*.3*aT;
  } else lp.z += sin(uTime*19. + position.y*5.)*.03*(.3 + abs(position.x));
  vec4 wp = modelMatrix*vec4(lp, 1.);
  vN = mat3(modelMatrix)*normal; vP = wp.xyz; vUv = vec3(aUv.x, part > 1.5 ? aT : aUv.y, part);
  vec4 mvPosition = viewMatrix*wp;
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const RIVAL_FRAG = /* glsl */`
#include <common>
#include <fog_pars_fragment>
uniform vec3 uSunDir, uSun, uSky, uGnd, uCamP, uC1, uC2; uniform float uNight;
varying vec3 vN; varying vec3 vP; varying vec3 vUv;
float rh1(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7)))*43758.5453); }
float rvn(vec2 p){
  vec2 i = floor(p), f = fract(p); f = f*f*(3. - 2.*f);
  return mix(mix(rh1(i), rh1(i + vec2(1., 0.)), f.x), mix(rh1(i + vec2(0., 1.)), rh1(i + vec2(1., 1.)), f.x), f.y);
}
void main(){
  float x = vUv.x, y = vUv.y, part = vUv.z;
  float aa = fwidth(x)*1.5 + fwidth(y)*1.5 + 1e-4;
  vec3 base; float bone = 0.;
  if (part < .5) {
    float d = length(vec2(x, y - .2)), d2 = length(vec2(x - .16, y - .29));
    float m = (1. - smoothstep(.45, .45 + aa, d))*smoothstep(.36, .36 + aa, d2);          // a crescent moon: two circles
    base = mix(uC1, uC2, m);
    float e = 1. - abs(x)/.95 - (y > .2 ? (y - .2)/.8 : (.2 - y)/1.2);                   // 0 on the rim of the diamond
    float fib = rvn(vec2(x*52., y*5.)), fib2 = rvn(vec2(x*8. + 3., y*19.));
    base *= .8 + .24*fib + .12*fib2;
    float seam = max(1. - smoothstep(.012, .012 + aa, abs(abs(x) - .52)), 1. - smoothstep(.012, .012 + aa, abs(y + .36)));
    base *= 1. - .25*seam;
    base = mix(base, uC2, 1. - smoothstep(.06, .06 + aa, e));                             // a pasted border in the moon's colour
    float spine = 1. - smoothstep(.018, .018 + aa, abs(x));
    float bw = .2 + .78*sqrt(max(1. - x*x/.9025, 0.));
    float bow = 1. - smoothstep(.02, .02 + aa, abs(y - bw));
    bone = max(spine, bow)*.9;
    base = mix(base, base*.45, bone);
  } else if (part < 1.5) {
    float st = fract(x*13.);
    base = mix(uC2, uC1, step(.5, st));
    if (y < -1.08 && abs(st - .5) > .3) discard;
  } else base = mix(uC2, uC1, step(.5, fract(floor(y*6. + .001)*.5 + .25)));
  vec3 N = normalize(vN + vec3(0., 1e-5, 0.)), V = normalize(uCamP - vP + vec3(0., 1e-5, 0.));
  if (dot(N, V) < 0.) N = -N;
  float ndl = dot(N, uSunDir), vds = max(dot(-V, uSunDir), 0.);
  vec3 c = base*(mix(uGnd, uSky, .5 + .5*N.y)*1.25 + uSun*max(ndl, 0.)*(1. - .4*bone));
  c += (base*base*1.25 + base*.35)*uSun*max(-ndl, 0.)*1.6*(.5 + .5*vds*vds)*(1. - .8*bone);   // stained glass against the sun
  c += base*vec3(1., .6, .3)*.3*uNight;
  gl_FragColor = vec4(c, 1.);
  #include <fog_fragment>
}`;

// ---------------------------------------------------------------- specks: people, rickshaws, balloons, the centipede
const SPECK_VERT = /* glsl */`
#include <common>
#include <fog_pars_vertex>
attribute vec3 iPos; attribute vec3 iVel; attribute vec4 iPar; attribute vec3 iCol;   // iPar: phase, rate, size, mode
uniform float uTime, uSurge, uPx; uniform vec3 uCamP;
varying vec2 vUv; varying vec3 vCol; varying float vMode; varying float vH;
void main(){
  float mode = iPar.w, ph = iPar.x, sz = iPar.z;
  vec3 P = iPos; float w = sz, h = sz, show = 1.;
  if (mode < .5) {                                   // a person: bobbing, jumping when a kite is cut
    float j = abs(sin(uTime*iPar.y + ph));
    P.y += j*j*(.12 + .75*uSurge*step(.3, fract(ph*3.7)));
    P.xz += iVel.xz*sin(uTime*.23*iPar.y + ph*2.);
    w = sz*.42; h = sz;
  } else if (mode < 1.5) {                           // a rickshaw or handcart threading a lane
    float f = fract(uTime*iPar.y + ph);
    P += iVel*f; show = smoothstep(0., .04, f)*(1. - smoothstep(.96, 1., f));
    w = sz*1.25; h = sz;
  } else if (mode < 2.5) {                           // an escaped balloon
    float f = fract(uTime*iPar.y + ph);
    P += vec3(sin(f*9. + ph*5.)*6., f*iVel.y, -f*iVel.y*.5 + cos(f*7. + ph)*4.);
    show = smoothstep(0., .05, f)*(1. - smoothstep(.9, 1., f));
  } else if (mode < 3.5) {                           // a balloon tied to a parapet corner
    P += vec3(sin(uTime*1.7 + ph)*.18, sin(uTime*2.3 + ph*2.)*.06, -.25 + cos(uTime*1.3 + ph)*.15);
  } else {                                           // a disc of the centipede kite
    float f = fract(uTime*iPar.y);
    P += iVel*f + vec3(0., sin(uTime*1.1 - ph)*9. + sin(uTime*.37 - ph*.3)*14., sin(uTime*.9 - ph*1.3)*5.);
    show = smoothstep(0., .08, f)*(1. - smoothstep(.92, 1., f));
  }
  float dist = length(P - uCamP);
  float crowd = 1. - step(.5, mode);
  show *= 1. - crowd*smoothstep(250., 450., dist);                 // far off the crowd melts into the roofs
  float fl = max(1., 1.6*dist*uPx/max(w, 1e-3));
  w *= fl*show; h *= mix(1., fl, .6)*show;
  vec3 rt = normalize(vec3(viewMatrix[0][0], 0., viewMatrix[2][0]) + vec3(1e-5, 0., 0.));
  vec3 up = mode < 1.5 ? vec3(0., 1., 0.) : vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
  if (mode > 1.5) rt = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
  vec3 lp = P + rt*position.x*w + up*position.y*h;
  vUv = position.xy; vCol = mix(iCol, vec3(.56, .52, .5), .5*crowd*smoothstep(150., 300., dist)); vMode = mode; vH = fract(ph*7.3);
  vec4 mvPosition = viewMatrix*vec4(lp, 1.);
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const SPECK_FRAG = /* glsl */`
#include <common>
#include <fog_pars_fragment>
uniform vec3 uSun, uSky, uGnd; uniform float uNight;
varying vec2 vUv; varying vec3 vCol; varying float vMode; varying float vH;
void main(){
  vec2 q = vUv; vec3 c = vCol; float a = 1.;
  if (vMode < .5) {
    float head = 1. - step(.17, length((q - vec2(0., .86))*vec2(.42, 1.)));
    float body = step(abs(q.x), .5 - .25*(1. - smoothstep(.0, .45, q.y)))*step(q.y, .74);
    float arms = step(.5, vH)*step(.55, q.y)*step(abs(abs(q.x) - (.1 + (q.y - .55)*.9)), .09);
    a = max(max(head, body), arms);
    c = mix(mix(c, c*.45, step(q.y, .36)*step(.5, fract(vH*5.))), vec3(.3, .19, .13), max(head, arms*(1. - body)));
  } else if (vMode < 1.5) {
    a = step(abs(q.x), .5)*step(q.y, .95);
    c = mix(c, vec3(.05, .05, .06), step(.62, q.y));
    c = mix(c, vec3(.03), step(q.y, .16)*step(.2, abs(abs(q.x) - .3)));
  } else {
    vec2 d = vec2(q.x*2., (q.y - .5)*2.); float r = length(d);
    a = 1. - step(1., r);
    if (vMode > 3.5) c = mix(c, vec3(.95, .9, .8), step(r, .45))*mix(1., .15, step(r, .2));
    else c = c*(.75 + .5*(1. - r)) + vec3(.5)*(1. - smoothstep(.0, .35, length(d - vec2(-.3, .35))));
  }
  if (a < .5) discard;
  c *= (uSky + uGnd)*.6 + uSun*.62;
  gl_FragColor = vec4(c, 1.);
  #include <fog_fragment>
}`;

// ---------------------------------------------------------------- a small merged-geometry builder (flat shaded, vertex colours)
function makeGeo() {
  const P = [], N = [], C = [], W = [];
  const g = {
    get triangles() { return P.length / 9; },
    // one triangle; w = [amp, phase, translucency] per vertex or shared
    tri(a, b, c, col, wa, wb, wc, cb, cc) {
      const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
      P.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]); N.push(nx, ny, nz, nx, ny, nz, nx, ny, nz);
      const c1 = cb || col, c2 = cc || col; C.push(col[0], col[1], col[2], c1[0], c1[1], c1[2], c2[0], c2[1], c2[2]);
      const w0 = wa || Z3, w1 = wb || w0, w2 = wc || w0; W.push(w0[0], w0[1], w0[2], w1[0], w1[1], w1[2], w2[0], w2[1], w2[2]);
    },
    // quad a,b (first edge) c,d (opposite edge, same winding); wA for a,b and wB for c,d; colB for c,d
    quad(a, b, c, d, col, wA, wB, colB) { g.tri(a, b, c, col, wA, wA, wB || wA, col, colB || col); g.tri(a, c, d, col, wA, wB || wA, wB || wA, colB || col, colB || col); },
    // box standing on y, rotated by yaw about its centre; top colour optional; no bottom face
    box(x, y, z, sx, sy, sz, col, yaw = 0, top, plain) {
      const ca = Math.cos(yaw), sa = Math.sin(yaw), hx_ = sx / 2, hz = sz / 2;
      const p = (lx, ly, lz) => [x + lx * ca + lz * sa, y + ly, z - lx * sa + lz * ca];
      const a = p(-hx_, 0, -hz), b = p(hx_, 0, -hz), c = p(hx_, 0, hz), d = p(-hx_, 0, hz), e = p(-hx_, sy, -hz), f = p(hx_, sy, -hz), h = p(hx_, sy, hz), i = p(-hx_, sy, hz);
      const own = Array.isArray(plain), w0 = own ? plain : plain ? Z3 : BOX0, w1 = own ? plain : plain ? Z3 : BOX1;         // the walls carry 0 at the foot and 1 at the top for the limewash
      g.quad(d, c, h, i, col, w0, w1); g.quad(b, a, e, f, col, w0, w1); g.quad(c, b, f, h, col, w0, w1); g.quad(a, d, i, e, col, w0, w1); g.quad(i, h, f, e, top || col, w1);
      return col;
    },
    // upright cylinder / cone / frustum with a cap
    cyl(x, y, z, r0, r1, h, seg, col, cap, w, colTop) {
      for (let k = 0; k < seg; k++) {
        const a0 = k / seg * 6.2832, a1 = (k + 1) / seg * 6.2832, c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
        const A = [x + c0 * r0, y, z + s0 * r0], B = [x + c1 * r0, y, z + s1 * r0], Cc = [x + c1 * r1, y + h, z + s1 * r1], D = [x + c0 * r1, y + h, z + s0 * r1];
        const cs = Array.isArray(col[0]) ? col[k % col.length] : col;
        if (r1 > 0.001) g.quad(B, A, D, Cc, cs, w, w, colTop); else g.tri(B, A, [x, y + h, z], cs, w, w, w, cs, colTop || cs);
        if (cap && r1 > 0.001) g.tri(D, [x, y + h, z], Cc, cap, w);
      }
    },
    // a thin pole between two points (3 sides)
    pole(a, b, r, col, w) {
      const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], l = Math.hypot(dx, dy, dz) || 1;
      let ux = -dz, uy = 0, uz = dx; if (Math.abs(dy) > 0.9 * l) { ux = 1; uz = 0; } const ul = Math.hypot(ux, uy, uz) || 1; ux /= ul; uz /= ul;
      const vx = (dy * uz - dz * uy) / l, vy = (dz * ux - dx * uz) / l, vz = (dx * uy - dy * ux) / l;
      for (let k = 0; k < 3; k++) {
        const a0 = k * 2.0944, a1 = a0 + 2.0944, c0 = Math.cos(a0) * r, s0 = Math.sin(a0) * r, c1 = Math.cos(a1) * r, s1 = Math.sin(a1) * r;
        const o0 = [ux * c0 + vx * s0, uy * c0 + vy * s0, uz * c0 + vz * s0], o1 = [ux * c1 + vx * s1, uy * c1 + vy * s1, uz * c1 + vz * s1];
        g.quad([a[0] + o1[0], a[1] + o1[1], a[2] + o1[2]], [a[0] + o0[0], a[1] + o0[1], a[2] + o0[2]], [b[0] + o0[0], b[1] + o0[1], b[2] + o0[2]], [b[0] + o1[0], b[1] + o1[1], b[2] + o1[2]], col, w);
      }
    },
    build() {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
      geo.setAttribute('aCol', new THREE.Float32BufferAttribute(C, 3)); geo.setAttribute('aW', new THREE.Float32BufferAttribute(W, 3));
      geo.computeBoundingSphere();
      return geo;
    },
    // the same geometry for the big merged meshes, handing the page back (pause = ctx.yield) between its attributes
    async buildAsync(pause) {
      const geo = new THREE.BufferGeometry();
      for (const [name, arr] of [['position', P], ['normal', N], ['aCol', C], ['aW', W]]) { geo.setAttribute(name, new THREE.Float32BufferAttribute(arr, 3)); await pause(); }
      geo.computeBoundingSphere();
      return geo;
    },
  };
  return g;
}
const Z3 = [0, 0, 0], BOX0 = [0, 2, -1], BOX1 = [0, 3, -1], TINW = [0, 5, -1];

export default {
  id: 'thousand-kite-roofs',
  name: 'The Sky Is Full of Paper',
  category: 'city',
  weirdness: 0.1,
  media: ['air', 'open'],
  async build(ctx) {
    const rng = ctx.rng, vary = ctx.vary || {}, detail = ctx.quality?.detail ?? 1, dens = vary.density ?? 1;
    const scene = new THREE.Scene();

    // ---------- which afternoon is it
    const pickR = rng.fork('look');
    let lookId = { day: pickR.pick(['clear', 'clear', 'dust', 'wind']), golden: 'golden', night: 'dusk', dawn: 'morning' }[vary.hour];
    if (!lookId) lookId = pickR.pick(['clear', 'clear', 'wind', 'dust', 'dust', 'golden', 'golden', 'dusk', 'morning', 'morning']);
    const look = LOOKS[lookId], rare = !!vary.rare, night = look.night;
    const scheme = pickR.pick(['all', 'all', 'magenta-saffron', 'turquoise-white']);
    const ourPaper = pickR.pick([['#EC2F9E', '#F9D3E4'], ['#EC2F9E', '#FFD070'], ['#F59A12', '#FFF0C8'], ['#17B3B9', '#F6E9D2']]);
    const rivalPaper = pickR.pick([['#5B1E8C', '#F6E9D2'], ['#2B2E7A', '#F59A12'], ['#2B2E7A', '#F59A12'], ['#f2ede0', '#D8281C']]);
    const parakeetCloud = pickR.chance(0.3), centipede = pickR.chance(0.55);
    const cirrus = pickR.chance(0.45) && !night && !look.sky.clouds2;      // some afternoons carry high mare's tails across the blue
    const SUN = sunVec(look.el), sunXZ = new THREE.Vector2(SUN.x, SUN.z).normalize();
    const tanE = Math.max(Math.tan(look.el * Math.PI / 180), 0.09);

    // ---------- the plot grid
    const NX = 176, NZ = 144, I0 = -38, J0 = -72, gs = rng.int(1, 9999);        // x -456..1656: the town, the river, the town on the far bank
    const cellN = NX * NZ, cH = new Float32Array(cellN), cIns = new Float32Array(cellN * 4), cCol = new Float32Array(cellN * 3), cTier = new Uint8Array(cellN);
    const cidx = (i, j) => (j - J0) * NX + (i - I0);
    const inGrid = (i, j) => i >= I0 && i < I0 + NX && j >= J0 && j < J0 + NZ;
    const q20 = (h) => Math.round(h / 20 * 255) / 255 * 20, q6 = (v) => Math.round(v / 6 * 255) / 255 * 6;
    // the washes of the walls: the palette's pastels, each deepened so that the town holds its colour from the air
    const deepen = (c) => { const l = (c[0] + c[1] + c[2]) / 3; return c.map((v) => Math.min(1.1, Math.max(0.02, l + (v - l) * 1.45)) * 0.97); };
    const wallsHex = ['#F6E9D2', '#F4B8C6', '#CDE6A5', '#A9D4EF', '#F6E9D2', '#f2efe8', '#F4B8C6', '#A9D4EF', '#F6E9D2', '#CDE6A5', '#f2efe8', '#C68A55', '#efd9a8', '#e9c3a0'].map(hx).map(deepen);
    // quarters: over most of the town six houses in ten take their wash from the quarter they stand in (a blue quarter,
    // an ochre one, a rose one, a green and white one), so the roofs read as neighbourhoods, not confetti
    const QUARTER = [[3, 7, 5], [0, 12, 13], null, [1, 6, 13], [2, 9, 5]];
    // the brief's route before the finale (the finale line comes from the hero)
    const pre = [[0, 14.5, 4], [30, 14.5, 4], [60, 14.5, 4], [88, 29, 1], [114, 52, -9], [150, 77, -22], [180, 90, -29], [204, 91.2, -33], [227, 89.6, -28.5], [249, 90.6, -32], [270, 89.2, -29],
      [298, 79, -38], [326, 62, -35], [354, 43, -14], [380, 29, -9], [404, 19, -15], [424, 15, -19.5], [446, 14.5, -20], [474, 14.5, -20], [490, 14.7, -20], [503, 16.4, -20], [512, 19.6, -20]];
    const preY = (x, z) => {                 // lowest route height within 20 m (xz) of a point, or 999
      let best = 999;
      for (let k = 0; k < pre.length - 1; k++) {
        const a = pre[k], b = pre[k + 1], dx = b[0] - a[0], dz = b[2] - a[2];
        const t = sat(((x - a[0]) * dx + (z - a[2]) * dz) / (dx * dx + dz * dz));
        if (Math.hypot(a[0] + dx * t - x, a[2] + dz * t - z) < 20) best = Math.min(best, mix(a[1], b[1], t));
      }
      return best;
    };
    // --- the plots are not all one module: open squares cluster, plots merge into double houses and four-plot
    // havelis (one texel repeated, shared insets 0), neighbours share party walls so lanes stop and start, and a
    // few tall havelis stand up out of the roofline away from the route
    const mi14 = (i) => ((i % 14) + 14) % 14, mj19 = (j) => ((j % 19) + 19) % 19;
    const preD = (x, z) => {                 // xz distance to the whole route (the finale runs out along z = -20)
      let best = 1e9;
      for (let k = 0; k < pre.length; k++) {
        const a = pre[k], b = k < pre.length - 1 ? pre[k + 1] : [775, 0, -20], dx = b[0] - a[0], dz = b[2] - a[2];
        const t = sat(((x - a[0]) * dx + (z - a[2]) * dz) / (dx * dx + dz * dz));
        best = Math.min(best, Math.hypot(a[0] + dx * t - x, a[2] + dz * t - z));
      }
      return best;
    };
    const keep = (i, j) => j >= -4 && j <= 2 && i >= -7 && i <= 47;         // the rows the route runs along stay as composed
    const cOpen = new Uint8Array(cellN), cRoot = new Int32Array(cellN).fill(-1), gW = new Uint8Array(cellN), gH = new Uint8Array(cellN);
    for (let j = J0; j < J0 + NZ; j++) for (let i = I0; i < I0 + NX; i++) {
      if (i === I0 && (j & 7) === 0) await ctx.yield();                     // a few rows at a time
      const k = cidx(i, j), x0 = i * 12;
      if (x0 >= RIV0 && x0 < RIV1) { cOpen[k] = 2; continue; }               // the river
      if (keep(i, j)) continue;
      const bi = Math.floor(i / 5), bj = Math.floor(j / 4), li = i - bi * 5, lj = j - bj * 4;
      if (ih(bi, bj, gs + 30) < 0.4 + 0.3 * ctx.noise.n2(bi * 0.37 + 11, bj * 0.37)) {          // a square of two or three plots by two
        const w = ih(bi, bj, gs + 31) < 0.5 ? 2 : 3, ox = Math.floor(ih(bi, bj, gs + 32) * (6 - w)), oz = Math.floor(ih(bi, bj, gs + 33) * 3);
        if (li >= ox && li < ox + w && lj >= oz && lj < oz + 2) cOpen[k] = 1;
      }
      if (ih(i, j, gs + 2) < 0.025) cOpen[k] = 1;                            // a lone courtyard
    }
    // the launch terrace (and the roofs behind it, where the camera of the previous world's portal stands) and the row
    // we skim are continuous roofs, plot after plot with no cross wall: bit 1 = x- side open, bit 2 = x+ side open
    const L0 = -6, L1 = 5;
    const rowBits = (i, j) => {
      if (j === 0 && i >= L0 && i <= L1) return (i > L0 ? 1 : 0) + (i < L1 ? 2 : 0);
      if (j === -2 && i >= 35 && i <= 43) return (i > 35 ? 1 : 0) + (i < 43 ? 2 : 0);
      if (j === -2 && (i === 33 || i === 34)) return i === 34 ? 1 : 2;
      return 0;
    };
    const freeC = (i, j) => inGrid(i, j) && !cOpen[cidx(i, j)] && cRoot[cidx(i, j)] < 0;
    for (let j = J0; j < J0 + NZ; j++) for (let i = I0; i < I0 + NX; i++) {
      if (i === I0 && (j & 7) === 0) await ctx.yield();
      const k = cidx(i, j); if (cOpen[k] || cRoot[k] >= 0) continue;
      const r = ih(i, j, gs + 12), kp = keep(i, j) || keep(i + 1, j) || keep(i, j + 1) || keep(i + 1, j + 1);
      let w = 1, hh = 1;
      if (!kp) {
        const okX = mi14(i) !== 6 && freeC(i + 1, j), okZ = mj19(j) !== 9 && freeC(i, j + 1), fb = i * 12 >= RIV1;      // the far bank is built in bigger houses
        if (r < (fb ? 0.46 : 0.04) && okX && okZ && freeC(i + 1, j + 1)) { w = 2; hh = 2; }
        else if (r < (fb ? 0.66 : 0.135) && okX) w = 2;
        else if (r < (fb ? 0.82 : 0.21) && okZ) hh = 2;
      }
      for (let b = 0; b < hh; b++) for (let a = 0; a < w; a++) cRoot[cidx(i + a, j + b)] = k;
      gW[k] = w; gH[k] = hh;
    }
    { const k0 = cidx(-1, 0); for (let a = 0; a < 3; a++) cRoot[cidx(-1 + a, 0)] = k0; gW[k0] = 3; gH[k0] = 1; }      // the launch terrace: three plots under one roof
    const avg = [0, 0, 0]; let avgN = 0;
    const rootIJ = (k, o) => { o.i = (k % NX) + I0; o.j = Math.floor(k / NX) + J0; return o; }, _r = { i: 0, j: 0 }, _n = { i: 0, j: 0 };
    // inset of one side of a cell (0 x-, 1 x+, 2 z-, 3 z+): 0 inside a haveli, a party wall, or half a lane
    const sideInset = (i, j, sd) => {
      const k = cidx(i, j), root = cRoot[k]; rootIJ(root, _r);
      const ni = i + (sd === 0 ? -1 : sd === 1 ? 1 : 0), nj = j + (sd === 2 ? -1 : sd === 3 ? 1 : 0);
      if (inGrid(ni, nj) && cRoot[cidx(ni, nj)] === root) return 0;
      // the side of a haveli is decided once, by its first cell on that side
      const ri = sd === 1 ? _r.i + gW[root] - 1 : _r.i, rj = sd === 3 ? _r.j + gH[root] - 1 : _r.j;
      const ei = sd === 0 ? ri - 1 : ri, ej = sd === 2 ? rj - 1 : rj;                       // the edge's own cell
      const oi = ri + (sd === 0 ? -1 : sd === 1 ? 1 : 0), oj = rj + (sd === 2 ? -1 : sd === 3 ? 1 : 0);
      const solid = inGrid(oi, oj) && !cOpen[cidx(oi, oj)];
      const street = sd < 2 ? mi14(ei) === 6 : mj19(ej) === 9;
      if (solid && !street && ih(ei, ej, gs + (sd < 2 ? 20 : 21)) < 0.4) return 0.07;
      return 0.5 + 2.7 * ih(ri, rj, gs + 3 + sd);
    };
    for (let j = J0; j < J0 + NZ; j++) for (let i = I0; i < I0 + NX; i++) {
      if (i === I0) await ctx.yield();
      const k = cidx(i, j), root = cRoot[k]; if (root !== k) continue;
      const w = gW[k], hh = gH[k];
      let h = Math.min(15.4, Math.max(8.6, 9 + 6 * ih(i, j, gs + 1) + 1.6 * ctx.noise.n2(i * 0.11 + 7, j * 0.11)));
      if (i * 12 >= RIV1) h = Math.min(19.6, 10.5 + 8.5 * ih(i, j, gs + 1) + 1.6 * ctx.noise.n2(i * 0.11 + 7, j * 0.11));      // the far bank stands taller over its ghats
      const riverCap = i * 12 < RIV0 ? 6 + (RIV0 - (i + w) * 12) * 0.12 : 99;       // this side the town steps down to the river over its last eight streets: the water shows over the roofs from a kite's height
      let far = !keep(i, j);
      for (let b = 0; b < hh && far; b++) for (let a = 0; a < w; a++) if (preD((i + a) * 12 + 6, 4 + 12 * (j + b)) < 62) far = false;
      if (far && ih(i, j, gs + 14) < (w * hh > 1 ? 0.2 : 0.1)) h = 16 + 3 * ih(i, j, gs + 15);            // a tall haveli breaks the roofline
      let wi = Math.floor(ih(i, j, gs + 7) * wallsHex.length);
      if (!keep(i, j) && ih(i, j, gs + 71) < 0.6) {
        const qn = ctx.noise.n2(i * 0.045 + 31.7, j * 0.045 + 17.3) + 0.5 * ctx.noise.n2(i * 0.11 + 5.1, j * 0.11 + 40.2), qt = QUARTER[qn < -0.35 ? 0 : qn < -0.05 ? 1 : qn < 0.25 ? 2 : qn < 0.55 ? 3 : 4];
        if (qt) wi = qt[Math.floor(ih(i, j, gs + 72) * 3)];
      }
      let col = sc(wallsHex[wi], 0.68 + 0.18 * ih(i, j, gs + 8));
      for (let b = 0; b < hh; b++) for (let a = 0; a < w; a++) {
        const py = preY((i + a) * 12 + 6, 4 + 12 * (j + b));
        if (py < 900) h = Math.min(h, Math.max(12.4 - ih(i, j, gs + 9) * 1.2, py - 5.5));
      }
      if (Math.abs(j) <= 2 && i <= 30) h = Math.min(h, 12.3 - 1.4 * ih(i, j, gs + 13));   // the roofline dead ahead of the entry stays under the eye
      const ins = [sideInset(i, j, 0), sideInset(i, j, 1), sideInset(i, j, 2), sideInset(i, j, 3)];
      if (rowBits(i, j)) h = 12;
      if (i === 44 && j >= -3 && j <= -1) { h = 10.5; ins[2] = ins[3] = 0.4; ins[0] = 3.4; ins[1] = 1.2; col = sc(hx('#C68A55'), 0.9); }   // the mosque behind the gateway
      h = q20(Math.min(h, riverCap));
      for (let b = 0; b < hh; b++) for (let a = 0; a < w; a++) {
        const ci = i + a, cj = j + b, kc = cidx(ci, cj);
        const cin = w * hh > 1 ? [sideInset(ci, cj, 0), sideInset(ci, cj, 1), sideInset(ci, cj, 2), sideInset(ci, cj, 3)] : ins;
        const rb = rowBits(ci, cj);
        if (rb) { cin[2] = Math.min(cin[2], 1.5); cin[3] = Math.min(cin[3], 1.5); if (rb & 1) cin[0] = 0; if (rb & 2) cin[1] = 0; }
        const m = mi14(ci), mj = mj19(cj);
        if (m === 6) cin[1] = Math.max(cin[1], 1.2) + 2.7; if (m === 7) cin[0] = Math.max(cin[0], 1.2) + 2.7;                     // bazaar streets
        if (mj === 9) cin[3] += 2.0; if (mj === 10) cin[2] += 2.0;
        cH[kc] = h; cCol.set(col, kc * 3);
        for (let q = 0; q < 4; q++) cIns[kc * 4 + q] = q6(cin[q]);
        avg[0] += col[0]; avg[1] += col[1]; avg[2] += col[2]; avgN++;
      }
    }
    await ctx.yield();
    // ---------- a handful of great places break the carpet of roofs: a round tank with an island in it, a market under
    // awnings astride a bazaar street, a domed tomb in its court, two temples in their yards. Their plots are cleared
    // here, whole houses at a time, and what stands in them is built further down. cH0 keeps the roofs as they were:
    // everything placed from a seeded stream (the kites' roof ends, the trees, the crowd) is still worked out on it, so
    // nothing else in the town moves. cKind: 1 a clean flagged court, 2 the market, 3 the walk round the tank.
    const cH0 = cH.slice(), cKind = new Uint8Array(cellN);
    const TANK = { x: 480, z: 168, r: 36 }, MKT = { x0: 408, x1: 456, z0: -170, z1: -122 }, TOMB = { x: 556, z: -175, half: 28 }, YARDS = [[294, -248, 2.0, '#F1E3C4'], [570, 148, 1.9, '#DE9A74']];
    const clearCell = (i, j, kind) => {
      if (!inGrid(i, j)) return;
      const k = cidx(i, j), root = cRoot[k];
      if (cOpen[k] === 2) return;
      if (root < 0) { cKind[k] = kind; return; }                    // an open square already
      rootIJ(root, _r); const ri = _r.i, rj = _r.j, w = gW[root], hh = gH[root];
      for (let b = 0; b < hh; b++) for (let a = 0; a < w; a++) if (keep(ri + a, rj + b) || preD((ri + a) * 12 + 6, 4 + 12 * (rj + b)) < 96) return;      // never a house whose roof is dressed (those lie within 84 m of the route)
      for (let b = 0; b < hh; b++) for (let a = 0; a < w; a++) { const kc = cidx(ri + a, rj + b); cH[kc] = 0; cOpen[kc] = 3; cKind[kc] = kind; cRoot[kc] = -1; }
    };
    // every plot that comes within rad of (x, z), or of the rectangle (x +- hx, z +- hz) when given
    const clearNear = (x, z, rad, kind, hx_ = 0, hz_ = 0) => {
      for (let j = Math.floor((z - hz_ - rad + 2) / 12); j <= Math.floor((z + hz_ + rad + 2) / 12); j++) for (let i = Math.floor((x - hx_ - rad) / 12); i <= Math.floor((x + hx_ + rad) / 12); i++) {
        const dx = Math.max(i * 12 - x - hx_, x - hx_ - i * 12 - 12, 0), dz = Math.max(12 * j - 2 - z - hz_, z - hz_ - 12 * j - 10, 0);
        if (Math.hypot(dx, dz) < rad) clearCell(i, j, kind);
      }
    };
    clearNear(TANK.x, TANK.z, TANK.r + 13.5, 3);
    await ctx.yield();
    clearNear((MKT.x0 + MKT.x1) / 2, (MKT.z0 + MKT.z1) / 2, 0.5, 2, (MKT.x1 - MKT.x0) / 2 - 1, (MKT.z1 - MKT.z0) / 2 - 1);
    clearNear(TOMB.x, TOMB.z, 0.5, 1, TOMB.half, TOMB.half);
    for (const y of YARDS) clearNear(y[0], y[1], 10, 1);                    // three plots by three
    // where no tree, cart or older landmark may stand: [x, z, half width]
    const BLOCKS = [[TANK.x, TANK.z, TANK.r + 9], [TOMB.x, TOMB.z, 27], [YARDS[0][0], YARDS[0][1], 14.5], [YARDS[1][0], YARDS[1][1], 14.5]];
    const blocked = (x, z, pad = 0) => BLOCKS.some((b) => Math.abs(x - b[0]) < b[2] + pad && Math.abs(z - b[1]) < b[2] + pad);
    await ctx.yield();
    const tAd = new Uint8Array(cellN * 4), tBd = new Uint8Array(cellN * 4);
    for (let k = 0; k < cellN; k++) {
      if ((k & 4095) === 4095) await ctx.yield();
      if (cH[k] <= 0) { cCol[k * 3] = cKind[k] * 60 / 255; cCol[k * 3 + 1] = cCol[k * 3 + 2] = 0; }      // an open plot carries its kind in the red channel
      tAd[k * 4] = Math.round(sat(cCol[k * 3]) * 255); tAd[k * 4 + 1] = Math.round(sat(cCol[k * 3 + 1]) * 255); tAd[k * 4 + 2] = Math.round(sat(cCol[k * 3 + 2]) * 255); tAd[k * 4 + 3] = Math.round(cH[k] / 20 * 255);
      for (let q = 0; q < 4; q++) tBd[k * 4 + q] = Math.round(cIns[k * 4 + q] / 6 * 255);
    }
    await ctx.yield();
    for (let k = 0; k < cellN; k++) { cCol[k * 3] = tAd[k * 4] / 255; cCol[k * 3 + 1] = tAd[k * 4 + 1] / 255; cCol[k * 3 + 2] = tAd[k * 4 + 2] / 255; }
    const mkTex = (d) => { const t = new THREE.DataTexture(d, NX, NZ, THREE.RGBAFormat, THREE.UnsignedByteType); t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; t.needsUpdate = true; return t; };
    await ctx.yield();
    const tA = mkTex(tAd), tB = mkTex(tBd);
    const cellOf = (x, z, o) => { o.i = Math.floor(x / 12); o.j = Math.floor((z + 2) / 12); return o; };
    const _c = { i: 0, j: 0 };
    const roofAt = (x, z) => { cellOf(x, z, _c); if (!inGrid(_c.i, _c.j)) return 12; const h = cH0[cidx(_c.i, _c.j)]; return h > 0 ? h : GY; };   // in a square the flyers stand on the ground
    // plot rectangle of a cell: [x0, x1, z0, z1]
    const plot = (i, j, o) => { const k = cidx(i, j) * 4; o[0] = i * 12 + cIns[k]; o[1] = i * 12 + 12 - cIns[k + 1]; o[2] = 12 * j - 2 + cIns[k + 2]; o[3] = 12 * j + 10 - cIns[k + 3]; return o; };
    await ctx.yield();

    // ---------- lighting uniforms shared by every shader of the world
    const hemiSky = new THREE.Color(look.hemiSky), hemiGnd = new THREE.Color(look.hemiGnd);
    const LU = {
      uSunDir: { value: SUN.clone() }, uSun: { value: new THREE.Color(look.sun).multiplyScalar(look.sunI / Math.PI) },
      uSky: { value: hemiSky.clone().multiplyScalar(look.hemiI / Math.PI) }, uGnd: { value: hemiGnd.clone().multiplyScalar(look.hemiI / Math.PI) },
      uShade: { value: hemiSky.clone().lerp(new THREE.Color('#55548A'), 0.3).multiplyScalar(look.hemiI / Math.PI * 1.05) },
      uTime: { value: 0 }, uNight: { value: night }, uTanE: { value: tanE }, uTap: { value: Math.min(2.2, Math.sqrt(0.404 / tanE)) },
      tA: { value: tA }, tB: { value: tB }, uGrid: { value: new THREE.Vector4(12 * I0, 12 * J0 - 2, 1 / NX, 1 / NZ) },
      uCamP: { value: new THREE.Vector3() }, uPx: { value: 0.001 }, uSurge: { value: 0 },
    };
    const mkMat = (vs, fs, extra = {}, params = {}) => new THREE.ShaderMaterial({
      uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...LU, ...extra }, vertexShader: vs, fragmentShader: fs, fog: true, ...params,
    });

    // ---------- composed kites: a subject for each stretch between the launch and the skim (the hero's opts.fixed).
    // Each is a great kite on a bright string that runs down to a knot of flyers standing on a real roof: a pair that
    // flanks the launching run, a ladder of seven on one roof's lines sunward of the climb, a second duelling pair on
    // the gaze line of the fall, and two flown from the terrace we come down onto. snapRoof moves a string's roof end
    // in from a lane onto the roof beside it (every kite of the sky gets the same, through opts.anchorFix).
    const _fc = { i: 0, j: 0 }, _fr = [0, 0, 0, 0];
    const snapRoof = (x, z) => {
      cellOf(x, z, _fc); if (!inGrid(_fc.i, _fc.j) || cH0[cidx(_fc.i, _fc.j)] <= 0) return [x, z];
      plot(_fc.i, _fc.j, _fr);
      return [Math.min(_fr[1] - 0.8, Math.max(_fr[0] + 0.8, x)), Math.min(_fr[3] - 0.8, Math.max(_fr[2] + 0.8, z))];
    };
    const FX = [];
    {
      const elC = look.elevation ? 0.62 : 0.9;              // on the stiff-wind day their lines lie lower too
      const CS = { 'all': [['#17B3B9', '#F6E9D2'], ['#F59A12', '#F6E9D2']], 'magenta-saffron': [['#8FD033', '#F6E9D2'], ['#17B3B9', '#F6E9D2']], 'turquoise-white': [['#EC2F9E', '#FFD070'], ['#F59A12', '#F6E9D2']] }[scheme];
      const roofEnd = (x, z) => { const q = snapRoof(x, z); return [q[0], roofAt(q[0], q[1]) + 1.3, q[1]]; };
      // kite k flown from the roof upwind of it (dz to one side), its line at elevation el
      const flown = (k, el, dz, size, cc, pat, more) => FX.push({ a: roofEnd(k[0] - (k[1] - 13.3) / Math.tan(el), k[2] + dz), k, size, c1: cc[0], c2: cc[1], pat, ...(more || {}) });
      // the launching run and the first of the climb: two great kites flank the way ahead, a third beyond them
      flown([83.6, 23, -9], elC, -1, 2.6, CS[0], 5, { phase: 0.4 }); flown([86, 24, 15], elC, 1, 2.6, CS[0], 5, { phase: 2.6 }); flown([109.5, 29.8, -12], elC + 0.1, 0, 2.4, CS[0], 5, { phase: 4.4 });
      // the climb: a ladder of seven on the lines of one roof, sunward of the route, so the tissue burns
      { const top = [168, 67, -33], a = roofEnd(top[0] - (top[1] - 13.3) / Math.tan(look.elevation ? 0.62 : 0.78), top[2]);
        for (let q = 0; q < 7; q++) { const f = (top[1] - q * 6.4 - a[1]) / (top[1] - a[1]);
          FX.push({ a, k: [mix(a[0], top[0], f), mix(a[1], top[1], f), mix(a[2], top[2], f)], size: 3.6, c1: CS[1][0], c2: CS[1][1], pat: 6, phase: 1.1, speed: 0.8, ampAz: 0.012, ampEl: 0.004 }); } }
      // the fall: a second duel, two great kites darting at each other on crossed lines in the upper left of the view, a
      // little above the eye so their paper is seen square on, the minarets, the train and the ring clear beyond them
      // (see clearLanes below)
      flown([345, 73, -44.5], elC, -40, 3.3, ['#8FD033', '#F6E9D2'], 2, { phase: 0, speed: 1.3, ampAz: 0.04, ampEl: 0.01, maxEnv: 2.6 });
      flown([349.8, 67.5, -48.4], elC + 0.06, -5, 3.3, ['#2B2E7A', '#F59A12'], 4, { phase: 3.14, speed: 1.3, ampAz: 0.04, ampEl: 0.01, maxEnv: 2.6 });
      // the terrace at the head of the skim row: two kites flown from the roofs we come down onto
      for (const [ax, az, yaw, L, cc] of [[408, -6, 0.6, 30, ['#EC2F9E', '#FFD070']], [402, -31, -0.6, 28, ['#F59A12', '#F6E9D2']]]) {
        const a = roofEnd(ax, az), el = elC + 0.15, ce = Math.cos(el);
        FX.push({ a, k: [a[0] + L * ce * Math.cos(yaw), a[1] + L * Math.sin(el), a[2] + L * ce * Math.sin(yaw)], size: 2.2, c1: cc[0], c2: cc[1], pat: 1 });
      }
    }

    // ---------- the hero: the sky itself, on our roofs and round our route
    let ptsW = null;
    const hero = await buildHero(ctx, {
      palette: PAL, stage: false, scheme, greatCut: rare, minCount: 300, elevation: look.elevation, meanY: look.meanY, lamp: night,
      count: Math.min(4300, Math.round(Math.max(look.kites, rare ? 1500 : 0) * 0.8 * Math.min(1.2, mix(0.73, 1.35, sat((dens - 0.7) / 0.6))))),   // capped: the far kites are fewer and larger now, and the flyers on the roofs are paid for here
      anchorFix: (lx, lz) => { const q = snapRoof(350 - lz, lx); return [q[1], 350 - q[0]]; }, fixed: FX, bigLineOpacity: night ? 0.38 : 0.55,
      roofY: (lx, lz) => roofAt(350 - lz, lx),
      pathSpace: 'world', pathFn: ({ flyThrough, toWorld }) => (ptsW = pre.map((p) => new THREE.Vector3(p[0], p[1], p[2])).concat(flyThrough.slice(0, -1).map(toWorld))),
      sunDir: [SUN.z, SUN.y, -SUN.x], sunColor: look.sun, sunIntensity: look.sunI, skyColor: look.hemiSky, groundColor: look.hemiGnd, hemiIntensity: look.hemiI,
      lineOpacity: night ? 0.16 : 0.2,
      ringY: 60, ringTilt: 20, pathEscorts: 96, ringHalo: 110, finaleScale: 1.3,      // the hoop hangs low over the far roofs: the last third stays in the city
      // very large kites at middle distance round the climb and the duel, and the kites of the roofs downwind: over the river and its far bank
      farKites: 80, beyondKites: 220, beyond: { reach: 1215, halfX: 680, noAnchor: (lx, lz) => 350 - lz > RIV0 - 3 && 350 - lz < RIV1 + 3 },
      // the landmark of the high stretch: from the duel and all down the fall the eye looks along these two lanes to the
      // ring, the red train and the twin minarets, so the scattered field is kept out of them (the kites hung beside the
      // route stay). The towers and the ribbon then stand in clear air between two banks of paper.
      clearLanes: [{ a: [205, 88, -29], b: [760, 57, -20], r0: 10, r1: 46 }, { a: [330, 55, -30], b: [545, 26, -20], r0: 12, r1: 30 }],
    });
    hero.object.position.set(350, 0, 0); hero.object.rotation.y = -Math.PI / 2;
    scene.add(hero.object);
    const kiteLines = hero.object.getObjectByName('kite-lines'), lineU = kiteLines ? kiteLines.material.uniforms : { uLineW: { value: 0 }, uAFloor: { value: 0 }, uBigA: { value: 0 } };
    lineU.uLineW.value = 0.02; const aFloor0 = lineU.uAFloor.value, bigA0 = lineU.uBigA.value;
    const A = hero.anchors, toW = A.toWorld;
    const ringC = toW(A.portalSeat.position), winch = toW(A.trainAnchor);
    await ctx.yield();

    // ---------- the route
    const path = makePath(ptsW, { samples: 480 });
    await ctx.yield();
    const duration = 46;
    const uAt = (x, z) => path.nearestXZ(x, z).u;
    const uClimb = uAt(60, 4), uDuel = uAt(180, -29), uCut = uAt(270, -29), uSkim = uAt(424, -19.5), uBurst = uAt(470, -20), uMin = uAt(530, -20), uGust = uMin + 0.03, uLand = uAt(400, -14);
    await ctx.yield();
    const heroU = (u) => (u < uCut ? u / uCut * 0.328 : u < uGust ? 0.328 + (u - uCut) / (uGust - uCut) * 0.412 : 0.74 + (u - uGust) / (1 - uGust) * 0.26);

    // ---------- sky, light, haze
    const sky = makeSky({ rng: rng.fork('sky'), preset: 'day', clouds: false, clouds2: false, sunElevation: look.el, sunAzimuth: 10, ...look.sky,
      ...(cirrus ? { clouds2: { coverage: 0.42, stretch: 1, opacity: 0.5, scale: 0.85, haze: 1.0, wind: [0.03, 0.008] } } : {}),
      lightColor: look.sun, lightIntensity: look.sunI, ambientColor: look.hemiSky, groundLight: look.hemiGnd, ambientIntensity: look.hemiI, lightElevationMin: 6, fogColor: look.fog });
    scene.add(sky.object);
    await ctx.yield();
    scene.fog = new THREE.FogExp2(look.fog, look.density);
    // follow: false and no camera in rig.update: the kit rig calls camera.getWorldDirection(), which resets the
    // engine's portal camera (matrixAutoUpdate off) to the origin and wrecks the view of this world through a portal
    const rig = makeLightRig(sky, { bounce: 0.2, follow: false }); scene.add(rig.object);
    await ctx.yield();

    // ---------- the city: every plot of the square kilometre as one instanced box, the rest painted on one plane
    // FI0..FI1 x FJ0..FJ1 is the square kilometre everything seeded is scattered over. The houses themselves run on past
    // it to the river's edge (BI1), and stand again sixteen plots deep on the far bank (FB0..FB1) the whole length of the grid.
    const FI0 = -13, FI1 = 71, FJ0 = -42, FJ1 = 41, BI1 = RIV0 / 12 - 1, FB0 = RIV1 / 12, FB1 = FB0 + 15;
    const iB = [], iD = [], iCol = [], rect = [0, 0, 0, 0];
    const rect2 = [0, 0, 0, 0];
    for (let j = J0; j < J0 + NZ; j++) for (let i = FI0; i <= FB1; i++) {
      if (i === FI0 && (j & 3) === 0) await ctx.yield();
      if (i > BI1 ? i < FB0 : (j < FJ0 || j > FJ1)) continue;
      const k = cidx(i, j), h = cH[k]; if (h <= 0 || cRoot[k] !== k) continue;
      const w = gW[k], hh = gH[k];
      plot(i, j, rect); plot(i + w - 1, j + hh - 1, rect2);                        // one box for the whole house
      const x0 = rect[0], x1 = rect2[1], z0 = rect[2], z1 = rect2[3];
      let tier = 0, near = 1e9;
      if (i <= FI1) for (let b = 0; b < hh; b++) for (let a = 0; a < w; a++) {
        const n = path.nearestXZ((i + a) * 12 + 6, 4 + 12 * (j + b));
        tier = Math.max(tier, n.dist < ((i + a) * 12 > 545 ? 22 : 47) && n.y - h < 24 ? 2 : (n.dist < 84 ? 1 : 0)); near = Math.min(near, n.dist);
      }
      if (rowBits(i, j)) tier = 2;
      for (let b = 0; b < hh; b++) for (let a = 0; a < w; a++) cTier[cidx(i + a, j + b)] = tier;
      iB.push((x0 + x1) / 2, h, (z0 + z1) / 2, ih(i, j, gs + 11)); iD.push(x1 - x0, z1 - z0, tier ? 1 : 0, (rowBits(i, j) & 1) + (rowBits(i + w - 1, j) & 2) + (j === 0 && i === -1 ? 4 : 0) /* + 4: the launch terrace keeps the plain tiled roof its hidden apron matches */); iCol.push(cCol[k * 3], cCol[k * 3 + 1], cCol[k * 3 + 2]);
    }
    await ctx.yield();
    {
      const bpos = [], bnor = [];
      const face = (a, b, c, d, n) => { for (const v of [a, b, c, a, c, d]) { bpos.push(v[0], v[1], v[2]); bnor.push(n[0], n[1], n[2]); } };
      face([-.5, 1, -.5], [-.5, 1, .5], [.5, 1, .5], [.5, 1, -.5], [0, 1, 0]);
      face([-.5, 0, .5], [.5, 0, .5], [.5, 1, .5], [-.5, 1, .5], [0, 0, 1]);
      face([.5, 0, -.5], [-.5, 0, -.5], [-.5, 1, -.5], [.5, 1, -.5], [0, 0, -1]);
      face([.5, 0, .5], [.5, 0, -.5], [.5, 1, -.5], [.5, 1, .5], [1, 0, 0]);
      face([-.5, 0, -.5], [-.5, 0, .5], [-.5, 1, .5], [-.5, 1, -.5], [-1, 0, 0]);
      const bg = new THREE.InstancedBufferGeometry(); bg.instanceCount = iB.length / 4;
      bg.setAttribute('position', new THREE.Float32BufferAttribute(bpos, 3)); bg.setAttribute('normal', new THREE.Float32BufferAttribute(bnor, 3));
      bg.setAttribute('iB', new THREE.InstancedBufferAttribute(new Float32Array(iB), 4)); bg.setAttribute('iD', new THREE.InstancedBufferAttribute(new Float32Array(iD), 4));
      bg.setAttribute('iCol', new THREE.InstancedBufferAttribute(new Float32Array(iCol), 3));
      const boxes = new THREE.Mesh(bg, mkMat(BOX_VERT, BOX_FRAG)); boxes.frustumCulled = false; boxes.name = 'houses'; scene.add(boxes);
      const pg = new THREE.PlaneGeometry(9000, 9000); pg.rotateX(-Math.PI / 2);
      const plane = new THREE.Mesh(pg, mkMat(PLANE_VERT, PLANE_FRAG, {
        uRiver: { value: new THREE.Color(look.sky.horizon).lerp(new THREE.Color(look.sky.mid), 0.7).lerp(new THREE.Color(look.sky.zenith), night ? 0 : 0.22).multiplyScalar(night ? 0.5 : 0.74) },
        uTank: { value: new THREE.Vector4(TANK.x, TANK.z, TANK.r, 0) }, uBoxed: { value: new THREE.Vector4(FI0 * 12, FB1 * 12 + 12, 504, 864) },
        uSand: { value: new THREE.Color('#cbb28c') }, uHorz: { value: new THREE.Color(look.sky.horizon).lerp(new THREE.Color(look.sky.mid), 0.3).multiplyScalar(0.55) }, uAvg: { value: new THREE.Color(avg[0] / avgN, avg[1] / avgN, avg[2] / avgN).multiplyScalar(0.62) },
      }));
      plane.position.set(400, GY, 0); plane.frustumCulled = false; plane.name = 'ground'; scene.add(plane);
    }
    await ctx.yield();

    // ---------- roof furniture: real things on every roof near the route, merged per stretch of the route
    const NCH = 8, chunkOf = (x) => Math.min(NCH - 1, Math.max(0, Math.floor((x + 170) / 130)));
    const geos = [], shGeos = []; for (let c = 0; c < NCH; c++) { geos.push(makeGeo()); shGeos.push(makeGeo()); }
    const specks = { pos: [], vel: [], par: [], col: [] };
    const speck = (x, y, z, vx, vy, vz, ph, rate, size, mode, col) => { specks.pos.push(x, y, z); specks.vel.push(vx, vy, vz); specks.par.push(ph, rate, size, mode); specks.col.push(col[0], col[1], col[2]); };
    const prng = rng.fork('props');
    const R = (a, b) => prng.range(a, b), pick = (a) => prng.pick(a), TAU = Math.PI * 2;
    // nothing tall near the route; things under a metre (cloths, charpoys, reels, pots) may slide under the camera.
    // The runway behind the entry is kept as clear as the route: the previous world's portal looks down it.
    let curH = 12;
    const clearOK = (x, z, top, rad) => {
      const drop = top - curH < 1.15 ? 1.4 : 3.0;
      if (x < 0 && x > -90 && Math.abs(z - 4) - rad < 3.0) return top < 14.5 - drop;
      const n = path.nearestXZ(x, z); return n.dist - rad > 2.3 || top < n.y - drop;
    };
    const sdx = -sunXZ.x, sdz = -sunXZ.y;                       // shadows fall this way
    const shadowOf = (sg, x, z, hw, height, y, r) => {
      let len = height / tanE;
      if (sdx > 1e-4) len = Math.min(len, (r[1] - 0.3 - x) / sdx); else if (sdx < -1e-4) len = Math.min(len, (r[0] + 0.3 - x) / sdx);
      if (sdz > 1e-4) len = Math.min(len, (r[3] - 0.3 - z) / sdz); else if (sdz < -1e-4) len = Math.min(len, (r[2] + 0.3 - z) / sdz);
      if (len < 0.3) return;
      const px = -sdz * hw, pz = sdx * hw, yy = y + 0.05;
      sg.quad([x - px, yy, z - pz], [x + px, yy, z + pz], [x + px + sdx * len, yy, z + pz + sdz * len], [x - px + sdx * len, yy, z - pz + sdz * len], Z3);
    };
    const shedCols = ['#CDE6A5', '#F4B8C6', '#A9D4EF', '#f2efe8', '#F6E9D2', '#8fd0c8'].map((c) => sc(hx(c), 0.8));
    const cloths = ['#E3207F', '#F59A12', '#17B3B9', '#f4f0e6', '#D8281C', '#8FD033', '#f4f0e6', '#F4B8C6', '#6a3fa0', '#ffd23a', '#2b6fd0'].map((c) => sc(hx(c), 0.85));
    const WOOD = hx('#6b4424'), BAMBOO = hx('#b08a4a'), TIN = [0.5, 0.52, 0.56], BRICK = hx('#8a4630'), BRASS = [0.8, 0.52, 0.14], LEAF = hx('#3f7a2a'), MARI = hx('#ff9a12');
    const PIGEON = hx('#7f899b'), DOORS = ['#2f7f9a', '#3f8a4a', '#9a3a2a'], gVoid = makeGeo();
    // a flat panel on a wall facing z (ax 0) or x (ax 1): u0..u1 along the wall from (cx, cz), y0..y1
    const panel = (g, ax, cx, cz, u0, u1, y0, y1, col, w) => (ax ? g.quad([cx, y0, cz + u0], [cx, y0, cz + u1], [cx, y1, cz + u1], [cx, y1, cz + u0], col, w)
      : g.quad([cx + u0, y0, cz], [cx + u1, y0, cz], [cx + u1, y1, cz], [cx + u0, y1, cz], col, w));
    const used = [], tmpV = new THREE.Vector3();
    const spot = (r, rad, top, corner) => {
      for (let t = 0; t < 7; t++) {
        const cx = corner && t < 3, x = cx ? (prng.chance(0.5) ? r[0] + 0.45 + rad : r[1] - 0.45 - rad) : R(r[0] + 0.45 + rad, r[1] - 0.45 - rad);
        const z = cx ? (prng.chance(0.65) ? r[2] + 0.45 + rad : r[3] - 0.45 - rad) : R(r[2] + 0.45 + rad, r[3] - 0.45 - rad);
        if (!clearOK(x, z, top, rad)) continue;
        let ok = true; for (const u of used) if (Math.hypot(u[0] - x, u[1] - z) < u[2] + rad) { ok = false; break; }
        if (!ok) continue;
        used.push([x, z, rad]); return [x, z];
      }
      return null;
    };
    // ---------- the flyers: modelled people on the roofs near the route (two legs, a kurta, a head, both arms out to the
    // kite with a reel of line between the hands). They are built into the roof props; aW.z = -2 marks a figure, and
    // the prop shader rides each part up and down in step, so the arms pump as the line is tugged. They draw from their
    // own stream and are placed after a roof's furniture, so no shed, tank or cloth of the town has moved for them.
    const flr = ctx.core.makeRng(ctx.core.hashSeed('flyers:' + gs));
    const SKINS = [[0.36, 0.22, 0.14], [0.3, 0.18, 0.12], [0.42, 0.27, 0.17]], KURTAS = ['#E3207F', '#F59A12', '#17B3B9', '#D8281C', '#2b6fd0', '#6a3fa0', '#8FD033', '#ffd23a', '#F4B8C6', '#f4f0e6'].map((c) => sc(hx(c), 0.85)), REELS = [hx('#ff3fa0'), hx('#ffd21a')], PANTS = [[0.78, 0.76, 0.7], [0.16, 0.18, 0.28], [0.5, 0.42, 0.3]];
    const BANDS = ['#E3207F', '#F59A12', '#17B3B9', '#D8281C', '#2b6fd0', '#6a3fa0', '#8FD033'].map((c) => sc(hx(c), 0.85));
    let nFlyers = 0, nSitters = 0;
    // arms: 1 both out to the kite with the reel, 2 one flung up, 0 down; seat: sitting with the legs out; fr: the stream
    // the figure draws from (the people sitting on charpoys have their own, so no flyer has changed for them)
    const flyer = (g, x, y, z, fx, fz, arms, seat, fr = flr) => {
      const l = Math.hypot(fx, fz) || 1, sa = fx / l, ca = fz / l, yaw = Math.atan2(sa, ca), ph = fr.range(0, 6.28);
      const at = (lx, ly, lz) => [x + lx * ca + lz * sa, y + ly, z - lx * sa + lz * ca];
      const cloth = sc(fr.pick(KURTAS), fr.range(0.85, 1.05)), skin = fr.pick(SKINS), pants = cloth[0] + cloth[1] + cloth[2] > 2.1 ? PANTS[1] : fr.pick(PANTS), sK = fr.range(0.94, 1.08);
      const wB = [arms ? 0.035 : 0.012, ph, -2], wA = [arms === 1 ? 0.12 : 0.04, ph, -2];
      const hip = seat ? 0.16 : 0.82 * sK;
      if (seat) for (const sd of [-0.11, 0.11]) { const q = at(sd, 0.02, 0.36); g.box(q[0], q[1], q[2], 0.15, 0.15, 0.62, pants, yaw, null, wB); }
      else for (const sd of [-0.1, 0.1]) { const q = at(sd, 0, 0); g.box(q[0], q[1], q[2], 0.15, hip, 0.17, pants, yaw, null, wB); }
      g.box(x, y + hip - 0.04, z, 0.42, 0.62 * sK, 0.23, cloth, yaw, sc(cloth, 0.8), wB);
      const sh = hip + 0.52 * sK;
      g.cyl(x, y + hip + 0.59 * sK, z, 0.1, 0.115, 0.22, 5, skin, fr.chance(0.25) ? sc(fr.pick(KURTAS), 0.9) : [0.07, 0.06, 0.06], wB);      // dark hair, or a bright cap
      // close to the route a figure is dressed: a band in a second colour at the kurta's hem, sloped shoulders, a sash
      // over one shoulder front and back (colours from a hash: no draw is added)
      const near = path.nearestXZ(x, z).dist < 11.5;
      if (near) {
        const hq = ih(Math.round(x * 9), Math.round(z * 9), gs + 90), b1 = BANDS[Math.floor(hq * BANDS.length)], b2 = BANDS[Math.floor(hq * 53) % BANDS.length], ty = y + hip - 0.04, tt = 0.62 * sK;
        g.box(x, ty, z, 0.45, 0.085, 0.26, b1, yaw, null, wB);
        g.cyl(x, ty + tt - 0.01, z, 0.205, 0.115, 0.075, 6, [sc(cloth, 1.06), sc(cloth, 0.82)], null, wB);
        for (const fz_ of [0.119, -0.119]) g.quad(at(-0.215, ty + tt - 0.02, fz_), at(-0.215, ty + tt - 0.15, fz_), at(0.215, ty + 0.12, fz_), at(0.215, ty + 0.25, fz_), b2, wB);
      }
      if (arms === 1) {
        g.pole(at(-0.24, sh, 0), at(-0.17, sh + 0.1, 0.34), 0.045, skin, wA); g.pole(at(0.24, sh, 0), at(0.17, sh + 0.1, 0.34), 0.045, skin, wA);
        g.pole(at(-0.2, sh + 0.1, 0.34), at(0.2, sh + 0.1, 0.34), 0.085, fr.pick(REELS), wA);
      } else if (arms === 2) {
        g.pole(at(0.24, sh, 0), at(0.34, sh + 0.44, 0.2), 0.045, skin, wA); g.pole(at(-0.24, sh, 0), at(-0.28, sh - 0.45, 0.05), 0.045, skin, wB);
      } else { g.pole(at(-0.24, sh, 0), at(-0.27, sh - 0.42, 0.1), 0.045, skin, wB); g.pole(at(0.24, sh, 0), at(0.27, sh - 0.42, 0.1), 0.045, skin, wB); }
      nFlyers++;
    };
    const sitR = ctx.core.makeRng(ctx.core.hashSeed('sitters:' + gs));
    // the roof ends of the great kites' strings (the composed kites among them) on roofs close under the route:
    // cell -> [x, z, direction of the kite (x, z), how many strings end there]
    const anchorsAt = new Map(), modelled = new Set();
    { const KA0 = A.kiteAnchors, KL = A.kiteLines, nG = Math.min(A.counts.great, KA0.length / 3);
      for (let a = 0; a < nG; a++) {
        if (KL[a * 4 + 3] < 1.75) continue;                          // only the strings that are drawn bright all the way down
        const x = 350 - KA0[a * 3 + 2], z = KA0[a * 3]; cellOf(x, z, _c);
        if (_c.i < FI0 || _c.i > FI1 || _c.j < FJ0 || _c.j > FJ1) continue;
        const kc = cidx(_c.i, _c.j), h = cH[kc]; if (h <= 0) continue;
        const n = path.nearestXZ(x, z); if (Math.hypot(n.dist, n.y - h) > (a < FX.length ? 80 : 46)) continue;
        let l = anchorsAt.get(kc); if (!l) anchorsAt.set(kc, l = []);
        const same = l.find((e) => Math.hypot(e[0] - x, e[1] - z) < 0.5); modelled.add(a);
        if (same) same[4]++; else if (l.length < 3) l.push([x, z, Math.cos(KL[a * 4]), Math.sin(KL[a * 4]), 1]);
      } }
    const standOK = (x, z, h, rad) => { if (!clearOK(x, z, h + 1.95, rad)) return false; for (const u of used) if (Math.hypot(u[0] - x, u[1] - z) < u[2] + rad) return false; return true; };
    const flyersOn = (i, j, g, sg, h, r, rb, pd, tier) => {
      const list = anchorsAt.get(cidx(i, j)), xm = (r[0] + r[1]) / 2;
      const stand = (x, z, fx, fz, arms, seat) => {
        x = Math.min(r[1] - 0.55, Math.max(r[0] + 0.55, x)); z = Math.min(r[3] - 0.55, Math.max(r[2] + 0.55, z));
        if (!standOK(x, z, h, 0.3)) return false;
        used.push([x, z, 0.3]); flyer(g, x, h, z, fx, fz, arms, seat); if (!seat) shadowOf(sg, x, z, 0.2, 1.7, h, r); return true;
      };
      if (list) for (const a of list) {                     // the flyer of a great kite, his hands at the string's end, and his friends beside him
        for (let t = 0, ok = false; t < 5 && !ok; t++) ok = stand(a[0] - a[2] * 0.34 + (t ? flr.range(-1.2, 1.2) : 0), a[1] - a[3] * 0.34 + (t ? flr.range(-1.2, 1.2) : 0), a[2], a[3], 1, false);
        for (let q = 0, n = Math.min(4, a[4] - 1) + (flr.chance(0.6) ? 1 : 0); q < n; q++) { const an = flr.range(0, 6.28), d = flr.range(0.7, 1.6);
          stand(a[0] + Math.cos(an) * d, a[1] + Math.sin(an) * d, a[2] + flr.range(-0.4, 0.4), a[3] + flr.range(-0.4, 0.4), flr.pick([1, 2, 2, 0]), false); }
      }
      if (tier < 2) return;
      // a line of flyers along the far parapets of the two rows we fly down and of the roofs we come down onto (never
      // within 2.3 m of the route: clearOK), and one here and there on the other dressed roofs
      const festive = rb > 0 || (xm > 366 && xm < 432 && pd < 22);
      const n = festive ? flr.int(2, 3) + (xm > 392 && xm < 424 ? 1 : 0) : (flr.chance(pd < 30 ? 0.3 : 0.12) ? 1 : 0);
      for (let q = 0; q < n; q++) for (let t = 0; t < 6; t++) {
        // on the rows they stand a step in from the washing lines along the parapets; none right beside the lens at the entry
        const sd = flr.chance(0.5) ? 1 : -1, z = festive ? (sd > 0 ? r[3] - 1.55 : r[2] + 1.55) + flr.range(-0.15, 0.15) : flr.range(r[2] + 0.8, r[3] - 0.8), x = flr.range(r[0] + 0.7, r[1] - 0.7);
        const seat = festive && flr.chance(0.16);
        if (j === 0 && rb && x > -5 && x < 24) continue;
        if (stand(x, z, 1 + flr.range(-0.3, 0.3), flr.range(-0.5, 0.5) - (festive ? sd * 0.3 : 0), seat ? 0 : flr.pick([1, 1, 1, 2, 0]), seat)) break;
      }
      if (j === 0 && i === 2) {                             // the first people of the world: three flyers a few metres into the launching run, by the parapets on either hand
        for (const [z0, fz0, arms, x0] of [[r[2] + 1.6, 0.25, 1, 0.6], [r[3] - 1.6, -0.25, 1, 2.6], [r[2] + 1.5, 0.4, 2, 5.5]]) for (let x = r[0] + x0; x < r[1] - 0.6; x += 0.9) if (stand(x, z0, 1, fz0, arms, false)) break;
      }
    };
    const furnish = (i, j, tier) => {
      const k = cidx(i, j), h = cH[k], r = plot(i, j, rect), g = geos[chunkOf((r[0] + r[1]) / 2)], sg = shGeos[chunkOf((r[0] + r[1]) / 2)];
      const wall = [cCol[k * 3], cCol[k * 3 + 1], cCol[k * 3 + 2]], xm = (r[0] + r[1]) / 2, zm = (r[2] + r[3]) / 2;
      used.length = 0; curH = h;
      if (i === 43 && j === -2) used.push([winch.x, winch.z, 2.6]);                 // the train's winch stands here
      const nP = path.nearestXZ(xm, zm), pd = nP.dist, rb = rowBits(i, j);
      const onRow = tier === 2 && (pd < 4 || rb > 0), fine = pd < 31 || rb > 0;      // the route runs down this roof; small things only close by
      // down the middle of a roof the route crosses: a cloth of chillies, a charpoy on a striped dhurrie, reels of line, pots
      const forced = {}, underLens = (p) => j === 0 && p[0] > 16.5 && p[0] < 24.8 && Math.abs(p[1] - 4) < 4.6;      // on the launch terrace: right under the lens in the world's first frames
      if (onRow) {
        const zc = rb ? (j === 0 ? 4 : -20) : path.pointAt(nP.u, tmpV).z, sg = prng.chance(0.5) ? 1 : -1, lx = r[1] - r[0];
        const xs = prng.shuffle([0.16, 0.39, 0.62, 0.85]).map((f) => r[0] + lx * f + R(-0.5, 0.5));
        // (on the launch terrace the upright things that would stand right under the lens in the world's first frames, cut
        // by the bottom edge of the picture, are left out: skip. Every random draw is still made, so nothing else moves.)
        const put = (key, x, z, rad) => { if (Math.abs(z - zm) < (r[3] - r[2]) / 2 - 0.5 - rad && !(i === 43 && j === -2 && Math.hypot(x - winch.x, z - winch.z) < 2.6 + rad)) { forced[key] = [x, z]; forced[key].skip = j === 0 && key !== 'cloth' && x > 16.5 && x < 24.8; used.push([x, z, rad]); } };
        put('cloth', xs[0], zc + R(-0.5, 0.5), 1.3);
        if (prng.chance(0.85)) put('charpoy', xs[1], zc + sg * R(0.5, 1.5), 1.25);
        if (prng.chance(0.85)) put('reel', xs[2], zc - sg * R(0.2, 1.2), 0.75);
        if (prng.chance(0.7)) put('pot', xs[3], zc + R(-1.4, 1.4), 0.5);
      }
      // stair-head shed with a tin lid, a door and a marigold garland
      let shedAt = null;
      { const p = spot(r, 1.25, h + 2.6, true);
        // on the two rows we fly down, sheds stand hard against the far parapet, and only on some plots (the random draws are made all the same)
        let g0 = g;
        if (p && rb) { if (ih(i, j, gs + 61) < 0.15) { used.pop(); g0 = gVoid; } else { p[1] = p[1] < (j === 0 ? 4 : -20) ? r[2] + 1.45 : r[3] - 1.45; used[used.length - 1][1] = p[1]; } }
        if (p) {
          const [x, z] = p, col = prng.chance(0.3) ? sc(wall, 1.1) : pick(shedCols); if (g0 === g) shedAt = p;
          g0.box(x, h, z, 2.3, 2.3, 2.3, col);
          if (tier === 2) {                                  // a darker plinth, a lime-washed cornice under the lid, a small window with a sill
            g0.box(x, h, z, 2.38, 0.34, 2.38, sc(col, 0.6), 0, null, true); g0.box(x, h + 2.2, z, 2.54, 0.1, 2.54, sc(col, 1.15), 0, null, true);
            const sx_ = x < xm ? 1 : -1, wx = x + sx_ * 1.16, ox = sx_ * 0.012, frame = sc(col, 1.25), pane = prng.chance(0.5) ? [0.16, 0.2, 0.26] : hx(pick(DOORS));
            panel(g0, 1, wx, z, -0.44, 0.44, h + 1.0, h + 1.84, frame); panel(g0, 1, wx + ox, z, -0.36, 0.36, h + 1.08, h + 1.76, pane);
            panel(g0, 1, wx + ox * 2, z, -0.025, 0.025, h + 1.08, h + 1.76, frame); panel(g0, 1, wx + ox * 2, z, -0.36, 0.36, h + 1.395, h + 1.445, frame);      // mullions
            g0.box(wx + sx_ * 0.05, h + 0.93, z, 0.12, 0.07, 1.04, sc(col, 1.3), 0, null, true);
          }
          const lid = sc(TIN, R(0.8, 1.5)), o = 1.3, y0 = h + 2.32, y1 = h + 2.32 + R(0.15, 0.4);
          g0.quad([x - o, y0, z - o], [x + o, y0, z - o], [x + o, y1, z + o], [x - o, y1, z + o], lid, TINW);
          const dz = z < zm ? 1.16 : -1.16, door = prng.chance(0.5) ? sc(WOOD, 1.3) : hx(pick(DOORS)), zf = z + dz, od = dz > 0 ? 0.012 : -0.012;
          if (tier === 2 && !fine) { panel(g0, 0, x, zf, -0.58, 0.58, h, h + 1.98, sc(col, 1.25)); panel(g0, 0, x, zf + od, -0.47, 0.47, h + 0.02, h + 1.88, door); }
          else if (tier === 2) {                             // a frame, two leaves with a dark gap between them, two sunk panels on each and a brass ring
            panel(g0, 0, x, zf, -0.58, 0.58, h, h + 1.98, sc(col, 1.25)); panel(g0, 0, x, zf + od, -0.47, 0.47, h + 0.02, h + 1.88, [0.13, 0.1, 0.08]);
            for (const sgn of [-1, 1]) { const xa = sgn < 0 ? -0.47 : 0.025, xb = sgn < 0 ? -0.025 : 0.47, pc = sc(door, 0.75);
              panel(g0, 0, x, zf + od * 2, xa, xb, h + 0.04, h + 1.86, door);
              panel(g0, 0, x, zf + od * 3, xa + 0.07, xb - 0.07, h + 0.16, h + 0.86, pc); panel(g0, 0, x, zf + od * 3, xa + 0.07, xb - 0.07, h + 0.98, h + 1.74, pc);
              panel(g0, 0, x, zf + od * 4, sgn * 0.07 - 0.03, sgn * 0.07 + 0.03, h + 0.9, h + 0.97, sc(BRASS, 1.3)); }
          } else panel(g0, 0, x, zf, -0.45, 0.45, h, h + 1.85, door);
          g0.quad([x - 0.6, h + 1.9, z + dz * 1.05], [x + 0.6, h + 1.9, z + dz * 1.05], [x + 0.6, h + 2.08, z + dz * 1.05], [x - 0.6, h + 2.08, z + dz * 1.05], MARI, [0.02, x, 0]);
          if (g0 === g) shadowOf(sg, x, z, 1.25, 2.35, h, r);
        } }
      // water tank on a brick stool
      { const p = spot(r, 0.75, h + 1.9, tier === 2);
        if (p) {
          const [x, z] = p, white = prng.chance(0.4), body = white ? [0.72, 0.72, 0.7] : [0.09, 0.09, 0.11], lidC = white ? [1.25, 1.25, 1.2] : [0.3, 0.33, 0.4];
          const brick = sc(BRICK, R(0.8, 1.1)), dressed = tier === 2 && rb > 0;
          if (dressed) {                                     // on the two rows we fly down: a stool of four brick legs under a stone slab, two hoops round the tank, a dark rim under the lid
            for (const [ox, oz] of [[-0.36, -0.36], [0.36, -0.36], [0.36, 0.36], [-0.36, 0.36]]) g.box(x + ox, h, z + oz, 0.26, 0.62, 0.26, sc(brick, ox * oz > 0 ? 1 : 0.86));
            g.box(x, h + 0.62, z, 1.14, 0.08, 1.14, [0.62, 0.58, 0.52], 0, [0.7, 0.66, 0.6], true);
            const hoop = white ? [0.4, 0.42, 0.47] : [0.26, 0.27, 0.31];
            g.cyl(x, h + 0.92, z, 0.6, 0.6, 0.06, 8, hoop); g.cyl(x, h + 1.38, z, 0.595, 0.595, 0.06, 8, hoop);
            g.cyl(x, h + 1.6, z, 0.655, 0.655, 0.06, 8, white ? [0.5, 0.5, 0.52] : [0.05, 0.05, 0.06]);
          } else g.box(x, h, z, 1.0, 0.7, 1.0, brick);
          if (tier === 2) {                                  // round tank, ribbed, with a domed lid, a cap and a down pipe
            g.cyl(x, h + 0.7, z, 0.58, 0.56, 1.0, 12, [body, white ? sc(body, 0.86) : [0.15, 0.15, 0.18]]);
            g.cyl(x, h + 1.7, z, 0.6, 0, 0.2, 12, [lidC, sc(lidC, 0.8)]); g.cyl(x, h + 1.66, z, 0.63, 0.63, 0.06, 12, sc(lidC, 1.3));      // the lid's rim catches the light
            const pxs = x < xm ? 0.62 : -0.62; g.pole([x + pxs, h + 1.5, z], [x + pxs, h, z], 0.035, [0.45, 0.46, 0.5]);
          } else g.cyl(x, h + 0.7, z, 0.58, 0.55, 1.05, 6, body, lidC);
          shadowOf(sg, x, z, 0.55, 1.75, h, r);
        } }
      // cloth of chillies or turmeric
      for (let cq = 0; cq < (tier === 2 ? 2 : 1); cq++) if ((cq === 0 && forced.cloth) || prng.chance(tier === 2 ? 0.6 : 0.42)) {
        const fp = cq === 0 ? forced.cloth : null, big = fp ? 1.15 : R(0.55, 1.5), p = fp || spot(r, 1.2 * Math.min(big, 1.1), h + 0.1, false);
        if (p) { const [x, z] = p, a = R(0.8, 1.2) * big, b = R(0.6, 0.9) * big, sk = prng();
          const spice = sk < (fp ? 0.75 : 0.45) ? [0.6, 0.035, 0.02] : sk < 0.8 ? [0.88, 0.52, 0.03] : sk < 0.9 ? [0.3, 0.42, 0.1] : [0.42, 0.2, 0.08];
          g.quad([x - a - 0.15, h + 0.03, z - b - 0.15], [x + a + 0.15, h + 0.03, z - b - 0.15], [x + a + 0.15, h + 0.03, z + b + 0.15], [x - a - 0.15, h + 0.03, z + b + 0.15], [0.78, 0.75, 0.68]);
          g.quad([x - a, h + 0.06, z - b], [x + a, h + 0.06, z - b], [x + a, h + 0.06, z + b], [x - a, h + 0.06, z + b], sc(spice, R(0.8, 1.15))); }
      }
      if (tier < 2) {
        if (xm > 270 && xm < 424 && pd < 47) {              // under the fall these roofs fill the foot of the frame: real parapets and a line of washing
          const t = 0.26, pc = sc(wall, 1.02), tc = sc(wall, 1.16), lx = r[1] - r[0];
          const o0 = cIns[k * 4] === 0, o1 = cIns[k * 4 + 1] === 0, o2 = cIns[k * 4 + 2] === 0, o3 = cIns[k * 4 + 3] === 0;
          const za = r[2] + (o2 ? 0 : t), zb = r[3] - (o3 ? 0 : t);
          if (!o2) g.box(xm, h, r[2] + t / 2, lx, 1, t, pc, 0, tc); if (!o3) g.box(xm, h, r[3] - t / 2, lx, 1, t, pc, 0, tc);
          if (!o0) g.box(r[0] + t / 2, h, (za + zb) / 2, t, 1, zb - za, pc, 0, tc); if (!o1) g.box(r[1] - t / 2, h, (za + zb) / 2, t, 1, zb - za, pc, 0, tc);
          const L = Math.min(flr.range(3, 4.6), lx - 1.6), side = flr.chance(0.5) ? 1 : -1, cx = flr.range(r[0] + 0.7 + L / 2, r[1] - 0.7 - L / 2), cz = zm + side * ((r[3] - r[2]) / 2 - 0.75), y1 = h + 1.9;
          if (L > 1.5 && standOK(cx, cz, h, 0.3)) {
            g.pole([cx - L / 2, h, cz], [cx - L / 2, y1 + 0.1, cz], 0.04, BAMBOO); g.pole([cx + L / 2, h, cz], [cx + L / 2, y1 + 0.1, cz], 0.04, BAMBOO);
            for (let s0 = 0.2; s0 < L - 0.7;) { const w = flr.range(0.7, 1.3), drop = flr.range(0.9, 1.7), col = flr.pick(cloths), ph = flr.range(0, 6.28), xa = cx - L / 2 + s0;
              g.quad([xa, y1, cz], [xa + w, y1, cz], [xa + w, y1 - drop, cz], [xa, y1 - drop, cz], col, [0, ph, 0.55], [flr.range(0.1, 0.2), ph + 1.2, 0.55], sc(col, 0.8)); s0 += w + flr.range(0.05, 0.3); }
          }
        }
        flyersOn(i, j, g, sg, h, r, rb, pd, tier);
        return;
      }
      // real parapets, with a painted band
      { const t = 0.26, pc = sc(wall, 1.02), tc = sc(wall, 1.16), lx = r[1] - r[0];
        const o0 = cIns[k * 4] === 0, o1 = cIns[k * 4 + 1] === 0, o2 = cIns[k * 4 + 2] === 0, o3 = cIns[k * 4 + 3] === 0;     // sides where the haveli's roof runs on
        const za = r[2] + (o2 ? 0 : t), zb = r[3] - (o3 ? 0 : t);
        if (!o2) g.box(xm, h, r[2] + t / 2, lx, 1, t, pc, 0, tc); if (!o3) g.box(xm, h, r[3] - t / 2, lx, 1, t, pc, 0, tc);
        if (!o0) g.box(r[0] + t / 2, h, (za + zb) / 2, t, 1, zb - za, pc, 0, tc); if (!o1) g.box(r[1] - t / 2, h, (za + zb) / 2, t, 1, zb - za, pc, 0, tc);
        for (const sd of [0, 1]) if (rb & (sd + 1)) {            // an open side of a terrace row: wall off only where this roof stands proud of the next one
          const nr = plot(i + (sd ? 1 : -1), j, rect2), xe = sd ? r[1] - t / 2 : r[0] + t / 2;
          if (nr[2] - r[2] > 0.3) g.box(xe, h, (r[2] + nr[2]) / 2 + t, t, 1, nr[2] - r[2], pc, 0, tc);
          if (r[3] - nr[3] > 0.3) g.box(xe, h, (r[3] + nr[3]) / 2 - t, t, 1, r[3] - nr[3], pc, 0, tc);
          if (!sd) continue;
          const k0 = Math.max(r[2], nr[2]) + t, k1 = Math.min(r[3], nr[3]) - t, kc = sc(wall, 0.9), cop = sc(hx('#f2ead8'), 0.92);
          if (j === 0) { g.box(r[1], h, (k0 + k1) / 2, 0.3, 0.1, k1 - k0, cop, 0, null, true); continue; }                     // the launch terrace: only a threshold
          g.box(r[1], h, (k0 + k1) / 2, 0.26, 0.32, k1 - k0, kc, 0, null, true); g.box(r[1], h + 0.32, (k0 + k1) / 2, 0.36, 0.08, k1 - k0, cop, 0, null, true);   // the skim row: a low kerb with a pale coping, pots along it
          for (let z = k0 + R(0.3, 0.9); z < k1 - 0.3; z += R(0.7, 1.7)) { const lf = sc(LEAF, R(0.8, 1.25)), lh = R(0.26, 0.4), tp = prng.chance(0.6) ? MARI : sc(lf, 1.4);
            if (Math.abs(z + 20) < 2.3) continue;                                              // nothing stands in the kerb where we cross it
            g.cyl(r[1], h + 0.4, z, 0.1, 0.14, 0.18, 4, [sc(BRICK, 1.2), sc(BRICK, 0.9)]);
            g.cyl(r[1], h + 0.56, z, 0.06, 0.2, lh * 0.4, 6, [sc(lf, 1.25), lf, sc(lf, 1.4), sc(lf, 1.1), sc(lf, 0.9), sc(lf, 1.15)], null, [0.02, z * 3, 0.3]);
            g.cyl(r[1], h + 0.56 + lh * 0.4, z, 0.2, 0.11, lh * 0.5, 6, [sc(lf, 1.25), lf, sc(lf, 1.4)], tp, [0.02, z * 3, 0.3], tp); }
        }
        const band = sc(pick(shedCols), 0.9);
        for (const [zz, dz] of [[r[2] + t + 0.01, 1], [r[3] - t - 0.01, -1]]) { if (dz > 0 ? o2 : o3) continue;
          if (rb) {                                         // the two rows we fly down wear a broad festival band, a row of cream diamonds in it and a dark stripe under it
            const bc = BANDS[Math.floor(ih(i, j, gs + 66 + (dz > 0 ? 0 : 1)) * BANDS.length)], zd = zz + dz * 0.004;
            g.quad([r[0], h + 0.42, zz], [r[1], h + 0.42, zz], [r[1], h + 0.84, zz], [r[0], h + 0.84, zz], bc);
            g.quad([r[0], h + 0.3, zz], [r[1], h + 0.3, zz], [r[1], h + 0.36, zz], [r[0], h + 0.36, zz], sc(bc, 0.5));
            for (let x = r[0] + 0.6; x < r[1] - 0.3; x += 1.2) g.quad([x - 0.2, h + 0.63, zd], [x, h + 0.47, zd], [x + 0.2, h + 0.63, zd], [x, h + 0.79, zd], [0.9, 0.85, 0.7]);
            continue;
          }
          g.quad([r[0] + t, h + 0.5, zz], [r[1] - t, h + 0.5, zz], [r[1] - t, h + 0.72, zz], [r[0] + t, h + 0.72, zz], band);
          if (fine) for (let x = r[0] + 0.9; x < r[1] - 0.9; x += 1.1) g.quad([x - 0.16, h + 0.2, zz + dz * 0.004], [x, h + 0.04, zz + dz * 0.004], [x + 0.16, h + 0.2, zz + dz * 0.004], [x, h + 0.36, zz + dz * 0.004], sc(wall, 0.42)); }
        for (const xx of [r[1] - t - 0.012, r[0] + t + 0.012]) { if (xx > xm ? o1 : o0) continue; const xd = xx + (xx > xm ? -0.004 : 0.004);
          g.quad([xx, h + 0.5, r[2] + t], [xx, h + 0.5, r[3] - t], [xx, h + 0.72, r[3] - t], [xx, h + 0.72, r[2] + t], band);
          if (fine) for (let z = r[2] + 0.9; z < r[3] - 0.9; z += 1.1) g.quad([xd, h + 0.2, z - 0.16], [xd, h + 0.04, z], [xd, h + 0.2, z + 0.16], [xd, h + 0.36, z], sc(wall, 0.42)); } }
      // laundry lines of saris and sheets
      for (let ll = 0, lside = prng.chance(0.5) ? 1 : -1; ll < (onRow ? 2 : 1); ll++, lside = -lside) if (onRow || prng.chance(0.85)) {
        const alongX = onRow || prng.chance(0.7), side = lside, L = R(3.2, 5.2);
        const cx = alongX ? R(r[0] + 0.6 + L / 2, r[1] - 0.6 - L / 2) : xm + side * ((r[1] - r[0]) / 2 - 0.7), cz = alongX ? zm + side * ((r[3] - r[2]) / 2 - 0.7) : R(r[2] + 0.6 + L / 2, r[3] - 0.6 - L / 2);
        const ax = alongX ? 1 : 0, az = alongX ? 0 : 1, y1 = h + 2.0;
        if (clearOK(cx, cz, y1, L * 0.5 * (alongX ? 0.3 : 1))) {
          const a = [cx - ax * L / 2, h, cz - az * L / 2], b = [cx + ax * L / 2, h, cz + az * L / 2];
          g.pole(a, [a[0], y1 + 0.1, a[2]], 0.035, BAMBOO); g.pole(b, [b[0], y1 + 0.1, b[2]], 0.035, BAMBOO);
          g.pole([a[0], y1, a[2]], [b[0], y1, b[2]], 0.025, [0.7, 0.7, 0.66]);
          for (let s = 0.25; s < L - 0.6;) {
            const w = R(0.6, 1.25), drop = prng.chance(0.4) ? R(1.5, 1.85) : R(0.8, 1.2), col = pick(cloths), ph = R(0, 6.28), tr = 0.55;
            const p0 = [a[0] + ax * s, y1, a[2] + az * s], p1 = [a[0] + ax * (s + w), y1, a[2] + az * (s + w)];
            const amp = R(0.1, 0.22), yh = y1 - drop + 0.13, hem = prng.chance(0.55) ? [0.86, 0.6, 0.12] : sc(pick(cloths), 1.1), wB = [amp, ph + 1.2, tr];
            if (drop > 1.4) {                              // a sari: two lengths, the lower one bellying out
              const ym = y1 - drop * 0.5, wM = [amp * 0.75, ph + 0.55, tr], cm = sc(col, 0.92);
              g.quad(p0, p1, [p1[0], ym, p1[2]], [p0[0], ym, p0[2]], col, [0, ph, tr], wM, cm);
              g.quad([p0[0], ym, p0[2]], [p1[0], ym, p1[2]], [p1[0], yh, p1[2]], [p0[0], yh, p0[2]], cm, wM, wB, sc(col, 0.8));
            } else g.quad(p0, p1, [p1[0], yh, p1[2]], [p0[0], yh, p0[2]], col, [0, ph, tr], wB, sc(col, 0.8));
            g.quad([p0[0], yh, p0[2]], [p1[0], yh, p1[2]], [p1[0], y1 - drop, p1[2]], [p0[0], y1 - drop, p0[2]], hem, wB, wB);
            s += w + R(0.05, 0.3);
          }
        }
      }
      if (onRow) for (const sd of [-1, 1]) {            // strings of paper pennants down both sides of the roofs we skim
        const zz = zm + sd * ((r[3] - r[2]) / 2 - 0.35), xa = r[0] + 0.4, xb = r[1] - 0.4, y1 = h + 2.15, n = 12, dx = (xb - xa) / n;
        g.pole([xa, h, zz], [xa, y1 + 0.1, zz], 0.03, BAMBOO); g.pole([xb, h, zz], [xb, y1 + 0.1, zz], 0.03, BAMBOO); g.pole([xa, y1, zz], [xb, y1, zz], 0.025, [0.75, 0.75, 0.7]);
        for (let q = 0; q < n; q++) { const x = xa + dx * (q + 0.15), c = pick(cloths), ph = R(0, 6.28), f = (q + 0.5) / n, y = y1 - 0.35 * 4 * f * (1 - f);
          g.tri([x, y, zz], [x + dx * 0.7, y, zz], [x + dx * 0.35, y - 0.55, zz], c, [0, ph, 0.6], [0, ph, 0.6], [0.12, ph + 1, 0.6]); }
      }
      // pigeon loft on bamboo poles with a perch frame
      if (prng.chance(0.36)) {
        const p = spot(r, 0.9, h + 3.9, false);
        if (p) { if (rb) { p[1] = p[1] < (j === 0 ? 4 : -20) ? r[2] + 0.95 : r[3] - 0.95; used[used.length - 1][1] = p[1]; }      // on the rows we fly down, against the far parapet
          const [x, z] = p, fs = z < zm ? 1 : -1, zf = z + fs * 0.51, ofz = fs * 0.012, hole = [0.13, 0.1, 0.08], nS = fine ? 4 : 2;
          for (const [ox, oz] of [[-0.6, -0.4], [0.6, -0.4], [0.6, 0.4], [-0.6, 0.4]]) g.pole([x + ox, h, z + oz], [x + ox, h + 2.1, z + oz], 0.04, BAMBOO);
          for (let q = 0; q < nS; q++) g.box(x, h + 2.0 + q * 0.95 / nS, z, 1.4, 0.95 / nS, 1.0, sc(BAMBOO, q % 2 ? 0.95 : 0.7), 0, null, true);      // slatted bamboo sides
          for (const ox of [-0.42, 0, 0.42]) {                 // three arched pigeonholes behind six slats, and a landing board
            panel(g, 0, x, zf + ofz, ox - 0.13, ox + 0.13, h + 2.2, h + 2.52, hole);
            g.tri([x + ox - 0.13, h + 2.52, zf + ofz], [x + ox + 0.13, h + 2.52, zf + ofz], [x + ox, h + 2.68, zf + ofz], hole); }
          if (fine) for (let q = 0; q < 6; q++) panel(g, 0, x, zf + ofz * 2, -0.7, 0.7, h + 2.06 + q * 0.155, h + 2.09 + q * 0.155, sc(BAMBOO, 1.2));
          g.box(x, h + 2.14, zf + fs * 0.12, 1.3, 0.03, 0.24, sc(WOOD, 1.3), 0, null, true);
          const yr = h + 2.95;                                 // a pitched tin lid
          g.quad([x - 0.85, yr, z - 0.68], [x + 0.85, yr, z - 0.68], [x + 0.85, yr + 0.3, z], [x - 0.85, yr + 0.3, z], sc(TIN, 0.95), TINW);
          g.quad([x - 0.85, yr + 0.3, z], [x + 0.85, yr + 0.3, z], [x + 0.85, yr, z + 0.68], [x - 0.85, yr, z + 0.68], sc(TIN, 1.25), TINW);
          for (const e of [-0.7, 0.7]) g.tri([x + e, yr, z - 0.5], [x + e, yr, z + 0.5], [x + e, yr + 0.22, z], sc(BAMBOO, 0.8));
          g.pole([x - 0.7, h + 2.9, z], [x - 0.7, h + 3.8, z], 0.03, BAMBOO); g.pole([x + 0.7, h + 2.9, z], [x + 0.7, h + 3.8, z], 0.03, BAMBOO); g.pole([x - 0.9, h + 3.75, z], [x + 0.9, h + 3.75, z], 0.03, BAMBOO);
          if (fine) for (let q = 0, n = 4 + (ih(i, j, gs + 62) < 0.5 ? 1 : 0); q < n; q++) {       // pigeons on the perch, puffed against the wind
            const px = x - 0.72 + (q + 0.5) * 1.44 / n + (ih(i + q, j, gs + 63) - 0.5) * 0.12, pc = sc(PIGEON, 0.8 + 0.4 * ih(i, j + q, gs + 64)), wp = [0.008, px * 9, 0];
            g.cyl(px, h + 3.78, z, 0.06, 0.095, 0.11, 4, pc, null, wp, sc(pc, 1.2)); g.cyl(px, h + 3.89, z, 0.095, 0, 0.1, 4, sc(pc, 1.2), null, wp, sc(pc, 0.75));
            g.cyl(px, h + 3.93, z + fs * 0.05, 0.05, 0, 0.09, 3, sc(pc, 0.7), null, wp); }
          shadowOf(sg, x, z, 0.7, 3.0, h, r); }
      }
      // fringed parasol in sun-faded stripes
      if (prng.chance(0.65)) {
        const p = spot(r, 1.25, h + 2.5, false);
        if (p) { const [x, z] = p, c1 = pick(cloths), c2 = prng.chance(0.6) ? [0.8, 0.77, 0.7] : pick(cloths), ph = R(0, 6.28);
          g.pole([x, h, z], [x, h + 2.3, z], 0.03, WOOD);
          g.cyl(x, h + 1.95, z, 1.25, 0, 0.45, 8, [sc(c1, 0.9), sc(c2, 0.9)], null, [0.03, ph, 0.7]);
          shadowOf(sg, x, z, 1.1, 2.1, h, r); }
      }
      // charpoy: lying, or stood on end against the parapet
      let charpoyAt = null;
      if (forced.charpoy || prng.chance(0.9)) {
        const p = forced.charpoy || spot(r, 1.05, h + 0.6, false), gq = p && (p.skip || underLens(p)) ? gVoid : g;
        if (p && forced.charpoy) { const c1 = pick(cloths), c2 = prng.chance(0.5) ? [0.8, 0.76, 0.66] : pick(cloths);            // a striped dhurrie under it
          for (let q = 0; q < 8; q++) { const z0 = p[1] - 0.95 + q * 0.2375; g.quad([p[0] - 1.25, h + 0.035, z0], [p[0] + 1.25, h + 0.035, z0], [p[0] + 1.25, h + 0.035, z0 + 0.2375], [p[0] - 1.25, h + 0.035, z0 + 0.2375], sc(q % 2 ? c1 : c2, q % 4 === 0 ? 0.75 : 0.95)); } }
        if (p) { const [x, z] = p, yaw = forced.charpoy || prng.chance(0.5) ? 0 : Math.PI / 2, weave = sc(pick([[0.8, 0.72, 0.5], [0.75, 0.3, 0.2], [0.3, 0.5, 0.7], [0.85, 0.8, 0.7]]), R(0.8, 1.1));
          gq.box(x, h + 0.4, z, 1.9, 0.08, 0.95, WOOD, yaw, weave, true);
          const ca = Math.cos(yaw), sa = Math.sin(yaw);
          for (const [ox, oz] of [[-0.9, -0.42], [0.9, -0.42], [0.9, 0.42], [-0.9, 0.42]]) { const px = x + ox * ca + oz * sa, pz = z - ox * sa + oz * ca; gq.pole([px, h, pz], [px, h + 0.5, pz], 0.035, WOOD); }
          if (gq === g) charpoyAt = [x, z, yaw]; }
      }
      // reels of kite line on a spindle, a stack of spare kites under a brick
      if (fine && (forced.reel || prng.chance(0.95))) {
        const p = forced.reel || spot(r, 0.5, h + 0.9, false);
        if (p) { const [x, z] = p, gq = p.skip || underLens(p) ? gVoid : g;
          for (let q = 0; q < 3; q++) { const ox = (q - 1) * 0.42; gq.pole([x + ox, h, z], [x + ox, h + 0.62, z], 0.02, WOOD); gq.cyl(x + ox, h + 0.3, z, 0.17, 0.17, 0.24, 6, hx(pick(['#ff3fa0', '#ffd21a', '#ff3fa0', '#35d0d8'])), [0.9, 0.85, 0.7]); }
          const kx = x + R(-0.4, 0.4), kz = z + 0.9;
          if (kz < r[3] - 0.9) for (let q = 0; q < 3; q++) { const c = pick(cloths), y = h + 0.04 + q * 0.03, a = R(0, 1.5), ca = Math.cos(a) * 0.5, sa = Math.sin(a) * 0.5;
            g.quad([kx - ca, y, kz - sa], [kx + sa, y, kz - ca], [kx + ca, y, kz + sa], [kx - sa, y, kz + ca], c, [0.012, R(0, 6), 0.3]); }
        }
      }
      // brass pots, and tulsi and marigold along the parapet
      if (fine && (forced.pot || prng.chance(0.6))) { const p = forced.pot || spot(r, 0.4, h + 0.5, false); if (p) { const gq = p.skip || underLens(p) ? gVoid : g; gq.cyl(p[0], h, p[1], 0.24, 0.15, 0.34, 6, sc(BRASS, R(0.8, 1.3)), [0.05, 0.04, 0.02]); if (prng.chance(0.5)) gq.cyl(p[0] + 0.5, h, p[1] + 0.1, 0.18, 0.12, 0.26, 6, BRASS, [0.05, 0.04, 0.02]); } }
      if (fine) { const n = prng.int(3, 6), along = prng.chance(0.5), zz = prng.chance(0.5) ? r[2] + 0.55 : r[3] - 0.55, x0 = R(r[0] + 0.8, r[1] - 0.8 - n * 0.55);
        for (let q = 0; q < n; q++) { const x = along ? x0 + q * 0.55 : (zz < zm ? r[0] + 0.55 : r[1] - 0.55), z = along ? zz : R(r[2] + 0.8, r[3] - 0.8);
          const lf = sc(LEAF, R(0.8, 1.2)), top = prng.chance(0.5) ? MARI : sc(lf, 1.35), lh = R(0.34, 0.52), wl = [0.02, x * 3, 0.3];
          g.cyl(x, h, z, 0.12, 0.17, 0.22, 4, [sc(BRICK, 1.2), sc(BRICK, 0.9)]);
          const lc = [sc(lf, 1.25), sc(lf, 1.0), sc(lf, 1.4), sc(lf, 1.1), sc(lf, 0.9)];
          g.cyl(x, h + 0.2, z, 0.07, 0.25, lh * 0.38, 6, lc, null, wl);                                   // a bushy crown in two tiers, flat on top, light at the tips
          g.cyl(x, h + 0.2 + lh * 0.38, z, 0.25, 0.13, lh * 0.45, 6, lc, top, wl, top); } }
      // satellite dish
      if (fine && prng.chance(0.2)) { const p = spot(r, 0.5, h + 1.3, true); if (p) { g.pole([p[0], h, p[1]], [p[0], h + 0.9, p[1]], 0.03, [0.3, 0.3, 0.32]); g.cyl(p[0], h + 0.85, p[1], 0.12, 0.5, 0.2, 8, [0.7, 0.7, 0.72], [0.55, 0.56, 0.6]); } }
      // a string of paper pennants from the shed to a far corner
      if (shedAt && prng.chance(0.55)) {
        const ex = shedAt[0] < xm ? r[1] - 0.4 : r[0] + 0.4, ez = shedAt[1] < zm ? r[3] - 0.4 : r[2] + 0.4, y0 = h + 2.6, y1 = h + 2.2;
        if (clearOK((shedAt[0] + ex) / 2, (shedAt[1] + ez) / 2, y0, 2.5) && clearOK(ex, ez, y1, 0.2)) {
          g.pole([ex, h, ez], [ex, y1 + 0.1, ez], 0.03, BAMBOO); g.pole([shedAt[0], y0, shedAt[1]], [ex, y1, ez], 0.025, [0.75, 0.75, 0.7]);
          const n = 9, dx = (ex - shedAt[0]) / n, dzz = (ez - shedAt[1]) / n;
          for (let q = 0; q < n; q++) { const f = (q + 0.5) / n, sag = -0.5 * 4 * f * (1 - f), x = shedAt[0] + dx * (q + 0.2), z = shedAt[1] + dzz * (q + 0.2), y = mix(y0, y1, f) + sag, c = pick(cloths), ph = R(0, 6.28);
            g.tri([x, y, z], [x + dx * 0.6, y, z + dzz * 0.6], [x + dx * 0.3, y - 0.5, z + dzz * 0.3], c, [0, ph, 0.6], [0, ph, 0.6], [0.12, ph + 1, 0.6]); }
        }
      }
      // bougainvillea spilling over the parapet
      if (prng.chance(0.4)) {
        const zz = prng.chance(0.5) ? r[2] + 0.15 : r[3] - 0.15, x0 = R(r[0] + 1, r[1] - 3), col = prng.chance(0.7) ? hx('#d81f8c') : hx('#ff7a1a');
        if (clearOK(x0 + 1, zz, h + 1.6, 1.2)) for (let q = 0; q < 14; q++) g.cyl(x0 + q * 0.2 + R(-0.15, 0.15), h + R(0.45, 1.0), zz + R(-0.3, 0.3), R(0.2, 0.36), 0, R(0.18, 0.34), 5, [sc(col, R(0.7, 1.15)), sc(col, R(0.6, 1)), sc(LEAF, R(0.7, 1)), sc(col, R(0.7, 1.15))], null, [0.015, q * 1.3, 0.5]);
      }
      // balloons tied to a parapet corner
      if (prng.chance(0.3)) { const bx = prng.chance(0.5) ? r[0] + 0.2 : r[1] - 0.2, bz = prng.chance(0.5) ? r[2] + 0.2 : r[3] - 0.2;
        if (clearOK(bx, bz, h + 2.6, 0.6)) { g.pole([bx, h + 1, bz], [bx, h + 1.9, bz - 0.25], 0.025, [0.8, 0.8, 0.8]); for (let q = 0; q < 4; q++) speck(bx + R(-0.25, 0.25), h + 1.75 + R(0, 0.5), bz + R(-0.25, 0.25), 0, 0, 0, R(0, 6.28), 0, 0.36, 3, pick(cloths)); } }
      flyersOn(i, j, g, sg, h, r, rb, pd, tier);
      // someone sitting on the charpoy, legs out along it, watching the sky (on the roofs beside the route, where the bed
      // lies clear of it; one bed in two). They draw from their own stream, after everything else on the roof.
      if (charpoyAt && pd < 24 && ih(i, j, gs + 91) < 0.5) {
        const [cx, cz, yaw] = charpoyAt, alongX = yaw === 0, sgn = alongX ? 1 : (path.pointAt(nP.u, tmpV).z > cz ? 1 : -1);
        const sx = cx - (alongX ? 0.48 : 0), sz = cz - (alongX ? 0 : sgn * 0.48);
        if (clearOK(sx, sz, h + 1.62, 0.3)) { flyer(g, sx, h + 0.48, sz, alongX ? 1 : 0, alongX ? 0 : sgn, sitR.pick([0, 0, 2]), true, sitR); nFlyers--; nSitters++; }
      }
    };
    for (let j = FJ0; j <= FJ1; j++) for (let i = FI0; i <= FI1; i++) {
      const k = cidx(i, j); if (!cTier[k] || cH[k] <= 0 || (i === 44 && j >= -3 && j <= -1)) continue;
      furnish(i, j, cTier[k]);
      await ctx.yield();
    }
    await ctx.yield();
    for (const kc of anchorsAt.keys()) {                    // string ends on roofs further out, which carry no furniture
      if (cTier[kc] || cH[kc] <= 0) continue;
      rootIJ(kc, _n); const r = plot(_n.i, _n.j, rect), ch = chunkOf((r[0] + r[1]) / 2);
      used.length = 0; curH = cH[kc];
      flyersOn(_n.i, _n.j, geos[ch], shGeos[ch], cH[kc], r, 0, 99, 0);
    }
    await ctx.yield();

    // ---------- seen through the previous world's portal, the lower third of the 14 m opening lies below the launch
    // terrace (the entry is only 2.5 m above it) and would look into the house. A tiled apron hidden inside the house
    // slopes down from the terrace to the foot of the opening, so the window shows a terrace floor running toward the
    // viewer. From anywhere in the world itself the roof covers it.
    {
      const g = geos[chunkOf(0)], r = plot(-1, 0, rect), z0 = r[2] + 0.03, z1 = r[3] - 0.03, k = cidx(-1, 0);
      const fl = mx([0.63, 0.5, 0.39], [cCol[k * 3], cCol[k * 3 + 1], cCol[k * 3 + 2]], 0.4), yAt = (x) => 6.7 + (x + 2.5) * (5.28 / 22.5);
      for (let q = 0; q < 16; q++) { const xa = -2.5 + q * 1.40625, xb = xa + 1.40625, c = sc(fl, (q % 2 ? 1.02 : 0.94) * 1.15), cj = sc(fl, 0.8);
        g.quad([xa, yAt(xa), z0], [xa, yAt(xa), z1], [xb - 0.05, yAt(xb - 0.05), z1], [xb - 0.05, yAt(xb - 0.05), z0], [c[0] * 1.2, c[1] * 1.05, c[2]]);
        g.quad([xb - 0.05, yAt(xb - 0.05), z0], [xb - 0.05, yAt(xb - 0.05), z1], [xb, yAt(xb), z1], [xb, yAt(xb), z0], cj); }
      // beside it the window would look lengthwise down the two dark lanes: low shelves, like neighbours' lower roofs
      // (never above 8.5 m, so they stay under every real roof and behind the terrace's own parapets)
      for (const [za, zb, wc] of [[z0 - 4.5, z0, sc(wallsHex[1], 0.62)], [z1, z1 + 4.5, sc(wallsHex[3], 0.62)]]) for (let q = 0; q < 8; q++) {
        const xa = -2.5 + q * 2.8125, xb = xa + 2.8125, ya = Math.min(yAt(xa), 8.5), yb = Math.min(yAt(xb), 8.5);
        g.quad([xa, ya, za], [xa, ya, zb], [xb, yb, zb], [xb, yb, za], sc(wc, q % 2 ? 1 : 0.92)); }
      const flat = (xa, xb, za, zb, col, lift) => g.quad([xa, yAt(xa) + lift, za], [xa, yAt(xa) + lift, zb], [xb, yAt(xb) + lift, zb], [xb, yAt(xb) + lift, za], col);
      flat(2.2, 5.0, 2.6, 6.2, [0.78, 0.75, 0.68], 0.03); flat(2.4, 4.8, 2.8, 6.0, [0.6, 0.035, 0.02], 0.06);          // chillies drying
      flat(8.0, 9.8, 0.4, 2.4, [0.78, 0.75, 0.68], 0.03); flat(8.15, 9.65, 0.55, 2.25, [0.88, 0.52, 0.03], 0.06);      // turmeric
      for (let q = 0; q < 7; q++) flat(11.5, 14.2, 5.4 + q * 0.3, 5.7 + q * 0.3, sc(cloths[q % 2 ? 2 : 3], 0.95), 0.03);  // a dhurrie
    }

    // ---------- the mosque gateway and its twin minarets, framing the train and the ring
    const STONE = hx('#C68A55'), STONE_D = sc(STONE, 0.6), STONE_L = sc(hx('#e0b07c'), 0.95);
    await ctx.yield();
    const kmats = S.makeMaterials({ night: night * 0.85, streetY: GY + 0.5 });
    await ctx.yield();
    kmats.setSky({ top: look.sky.zenith, horizon: look.sky.horizon, sun: look.sun, sunDir: [SUN.x, SUN.y, SUN.z] });
    const mins = [];
    for (const [q, z] of [-32, -8].entries()) {
      mins.push(S.makeBuilding({ rng: rng.fork('minaret' + q), style: 'minaret', width: 5, height: 47, flood: 0.8,
        palette: { wall: '#C68A55', stone: '#b87c48', trim: '#d9a870', roof: '#b9853a', accent: '#ffd98a', gold: '#e0b040' }, position: [530, 0, z], mats: kmats }));
      await ctx.yield();
    }
    const minBaked = S.mergeObjects(mins); scene.add(minBaked.object);
    await ctx.yield();
    // the kit paints minaret shafts in candy stripes (surface 16); this city's are honey sandstone, so the shafts are
    // switched to the kit's coursed masonry (surface 10) and the relief comes from the world's own balcony rings
    minBaked.object.traverse((m) => { const wa = m.geometry && m.geometry.attributes.win; if (!wa) return;
      for (let q = 0; q < wa.count; q++) if (Math.round(wa.getX(q)) === 16) wa.setX(q, 10); wa.needsUpdate = true; });
    await ctx.yield();
    {
      const g = geos[chunkOf(530)], xg = 530, y0 = GY;
      for (const z of [-32, -8]) {                      // carved balcony rings and lattice bands
        g.cyl(xg, 16.2, z, 2.25, 3.1, 0.7, 12, [STONE_L, STONE], STONE);
        for (let q = 0; q < 12; q++) { const a = (q + 0.5) / 12 * 6.2832; g.box(xg + Math.cos(a) * 2.62, 15.72, z + Math.sin(a) * 2.62, 0.62, 0.5, 0.26, STONE_D, -a, sc(STONE, 0.8), true); }      // corbels under the ring
        g.cyl(xg, 11.2, z, 2.6, 2.6, 0.8, 12, [STONE_D, STONE_L]); g.cyl(xg, 21.5, z, 2.3, 2.3, 0.6, 12, [STONE_D, STONE_L]); g.cyl(xg, y0, z, 3.3, 2.7, 11.1 - y0, 8, [STONE, sc(STONE, 0.86)], STONE_L);
      }
      const FL = [sc(STONE, 1.08), sc(STONE, 0.74)], LAT = sc(STONE, 0.32), GOLD = [1.25, 0.82, 0.26];
      const lattice = (z, yb, r, n) => {                 // a pale band between two dark string courses, pierced with a row of dark diamonds
        g.cyl(xg, yb - 0.22, z, r + 0.1, r + 0.1, 0.22, n, STONE_D); g.cyl(xg, yb, z, r, r, 1.5, n, [STONE_L, sc(STONE_L, 0.9)]); g.cyl(xg, yb + 1.5, z, r + 0.1, r + 0.1, 0.22, n, STONE_D);
        for (let k = 0; k < n; k++) {
          const a0 = k / n * TAU, a1 = (k + 1) / n * TAU, ax = Math.cos(a0) * r, az = Math.sin(a0) * r, bx = Math.cos(a1) * r, bz = Math.sin(a1) * r;
          const mxx = (ax + bx) / 2, mzz = (az + bz) / 2, ml = Math.hypot(mxx, mzz), ox = mxx / ml * 0.03, oz = mzz / ml * 0.03, hx_ = (bx - ax) * 0.36, hz = (bz - az) * 0.36;
          const cxx = xg + mxx + ox, czz = z + mzz + oz, yc = yb + 0.75, ex = (bx - ax) * 0.25, ez = (bz - az) * 0.25, sx = hx_ * 0.5, sz = hz * 0.5;
          // a pierced screen: two rows of small dark diamonds, a pale boss between them
          for (const [eu, ev] of [[-1, 0.36], [1, 0.36], [-1, -0.36], [1, -0.36]]) { const dx = cxx + ex * eu, dz = czz + ez * eu, dy = yc + ev;
            g.quad([dx - sx, dy, dz - sz], [dx, dy - 0.27, dz], [dx + sx, dy, dz + sz], [dx, dy + 0.27, dz], LAT); }
          g.quad([cxx - sx * 0.55, yc, czz - sz * 0.55], [cxx, yc - 0.15, czz], [cxx + sx * 0.55, yc, czz + sz * 0.55], [cxx, yc + 0.15, czz], STONE_L);
        }
      };
      // carved brackets under the kit's two balcony flares (which are plain cones): each stands out below the cone
      const corbels = (z, yb, rc, n, len, hh) => { for (let q = 0; q < n; q++) { const a = (q + 0.5) / n * TAU; g.box(xg + Math.cos(a) * rc, yb, z + Math.sin(a) * rc, len, hh, 0.22, STONE_D, -a, sc(STONE, 0.78), true); } };
      for (const z of [-32, -8]) {
        g.cyl(xg, 12.0, z, 2.1, 2.08, 1.0, 20, FL); g.cyl(xg, 14.94, z, 2.08, 2.06, 1.26, 20, FL); g.cyl(xg, 17.8, z, 2.06, 2.03, 3.7, 20, FL);      // fluted lower shaft
        g.cyl(xg, 26.7, z, 1.68, 1.64, 1.4, 16, FL); g.cyl(xg, 30.04, z, 1.64, 1.62, 1.86, 16, FL); g.cyl(xg, 37.0, z, 1.35, 1.33, 1.9, 12, FL);      // fluted upper shafts
        lattice(z, 13.22, 2.26, 14); lattice(z, 28.32, 1.82, 12);
        lattice(z, 17.12, 3.12, 16); g.cyl(xg, 18.84, z, 3.3, 3.3, 0.13, 16, [STONE_L, sc(STONE_L, 0.92)]);                                      // the balcony's pierced parapet and its coping
        g.cyl(xg, 31.9, z, 1.74, 1.74, 0.45, 12, [STONE_D, STONE_L]);                                                                             // a dark string course under the upper balcony
        corbels(z, 22.3, 2.82, 14, 0.95, 0.66); corbels(z, 32.62, 2.22, 12, 0.8, 0.56);
        g.cyl(xg, 22.1, z, 2.42, 2.42, 0.1, 14, STONE_L); g.cyl(xg, 32.35, z, 1.82, 1.82, 0.09, 12, STONE_L);                                     // a pale fillet where each flare springs
        g.cyl(xg, 39.45, z, 1.75, 2.3, 0.28, 12, STONE_L, STONE_L);                                                                              // the eave of the cap
        let ry = 39.75, rr = 1.7;                                                                                                                 // a ribbed dome, the kit's spire standing out of it
        for (const [r1, hh] of [[1.86, 0.8], [1.5, 1.0], [0.95, 0.85]]) { g.cyl(xg, ry, z, rr, r1, hh, 12, [STONE_L, sc(STONE, 0.95)]); ry += hh; rr = r1; }
        g.cyl(xg, ry, z, 0.95, 0.5, 0.5, 12, GOLD);
      }
      for (const z of [-29.2, -23.3, -16.7, -10.8]) g.box(xg, y0, z, 1.6, 11.1 - y0, 1.5, STONE, 0, STONE_L);         // piers
      g.box(xg, 11.0, -20, 1.6, 1.7, 19.6, STONE, 0, STONE_L);
      for (const z of [-26.25, -20, -13.75]) { g.quad([xg - 0.82, y0 + 0.1, z - 1.9], [xg - 0.82, y0 + 0.1, z + 1.9], [xg - 0.82, 9.2, z + 1.9], [xg - 0.82, 9.2, z - 1.9], [0.05, 0.035, 0.04]);
        g.quad([xg - 0.82, 9.2, z - 1.9], [xg - 0.82, 9.2, z + 1.9], [xg - 0.82, 11.6, z + 0.5], [xg - 0.82, 11.6, z - 0.5], [0.05, 0.035, 0.04]); }
      for (let z = -29.3; z < -10.6; z += 1.25) { g.box(xg, 12.7, z, 1.6, 0.55, 0.7, STONE_L); g.quad([xg - 0.81, 11.9, z - 0.3], [xg - 0.81, 11.9, z + 0.3], [xg - 0.81, 12.5, z + 0.3], [xg - 0.81, 12.5, z - 0.3], STONE_D); }
      g.box(xg, 12.6, -20, 0.5, 0.9, 0.5, STONE); g.cyl(xg, 13.4, -20, 0.5, 0, 0.9, 6, [1.2, 0.8, 0.25]);
    }

    // ---------- landmarks: spires, domes, water towers, the city gate, the bridge and the nine mill chimneys
    await ctx.yield();
    const farG = makeGeo(), lrng = rng.fork('landmarks');
    const flag = (g, x, y, z, col) => { g.pole([x, y, z], [x, y + 3.2, z], 0.06, [0.4, 0.3, 0.2]); const ph = lrng.range(0, 6);
      g.tri([x, y + 3.2, z], [x, y + 2.2, z], [x + 2.4, y + 2.7, z + 0.1], col, [0, ph, 0.6], [0, ph, 0.6], [0.35, ph + 1.5, 0.6]); };
    const spire = (g, x, z, s, col) => { let y = 8, r = 4.2 * s; g.box(x, GY, z, 9 * s, 6 * s + y - GY, 9 * s, col, 0.3, sc(col, 1.1)); y += 6 * s;
      for (let q = 0; q < 5; q++) { const r1 = r * (q === 4 ? 0.25 : 0.8), hh = (q === 4 ? 2.4 : 3.6) * s, cq = sc(col, q % 2 ? 0.74 : 1);      // tiers in two tones, a dark string course between them
        g.cyl(x, y, z, r, r1, hh, 8, [cq, sc(cq, 0.8)], sc(col, 1.15)); if (q < 4) g.cyl(x, y + hh - 0.3 * s, z, r1 * 1.1, r1 * 1.1, 0.34 * s, 8, sc(col, 0.5)); y += hh; r = r1 * 1.08; }
      g.cyl(x, y, z, 0.7 * s, 0, 1.6 * s, 6, [1.3, 0.85, 0.25]); flag(g, x, y + 1.2 * s, z, hx(lrng.pick(['#ff7a12', '#D8281C', '#ff7a12']))); };
    const dome = (g, x, z, s) => { const col = [0.8, 0.78, 0.72]; let y = 8; g.box(x, GY, z, 16 * s, 9 + y - GY, 16 * s, sc(STONE_L, 0.9), 0, [0.7, 0.66, 0.6]); y += 9; g.cyl(x, y, z, 6 * s, 6 * s, 2, 12, [col, sc(col, 0.85)]); y += 2;
      let r = 6.3 * s; for (const [k, hh] of [[0.94, 2.2], [0.78, 2], [0.5, 1.6], [0.0, 1.1]]) { g.cyl(x, y, z, r, 6.3 * s * k, hh * s, 12, [col, sc(col, 0.9)], col); y += hh * s; r = 6.3 * s * k; }
      g.cyl(x, y - 0.2, z, 0.5, 0, 2.2, 6, [1.3, 0.9, 0.3]); };
    const wtower = (g, x, z) => { for (const [ox, oz] of [[-2.5, -2.5], [2.5, -2.5], [2.5, 2.5], [-2.5, 2.5]]) g.pole([x + ox * 1.45, GY, z + oz * 1.45], [x + ox, 24, z + oz], 0.3, [0.5, 0.5, 0.5]);
      g.cyl(x, 24, z, 4.6, 4.6, 5.5, 10, [[0.66, 0.68, 0.7], [0.56, 0.58, 0.62]], [0.74, 0.75, 0.76]); g.cyl(x, 29.5, z, 4.8, 0, 1.6, 10, [0.5, 0.42, 0.4]); };
    const farFromRoute = (x, z, d) => path.nearestXZ(x, z).dist > d;
    for (let q = 0, n = 0; q < 200 && n < 22; q++) {
      const far = n >= 9, x = far ? lrng.range(-600, 860) : lrng.range(-120, 830); let z = (lrng.chance(0.5) ? 1 : -1) * (far ? lrng.range(520, 1100) : lrng.range(70, 470));
      if (!farFromRoute(x, z, 75)) continue;
      for (let t = 0; t < 4 && (blocked(x, z, 16) || (x > MKT.x0 - 12 && x < MKT.x1 + 12 && z > MKT.z0 - 12 && z < MKT.z1 + 12)); t++) z += z > 0 ? 70 : -70;      // out of the tank, the market and the courts
      const kind = n % 5; n++;
      if (kind === 3) dome(farG, x, z, lrng.range(0.9, 1.4)); else if (kind === 4) wtower(farG, x, z); else spire(farG, x, z, lrng.range(0.85, 1.5) * (far ? 1.5 : 1), sc(hx(lrng.pick(['#F6E9D2', '#e9c79a', '#f2efe8', '#F4B8C6'])), 0.82));
    }
    await ctx.yield();
    { const gx = 168 * lrng.int(1, 3) + 84, gz = lrng.pick([-190, 196]);            // the triple-arched gate astride a bazaar street
      for (const o of [-13, -5, 5, 13]) farG.box(gx + o, GY, gz, o * o > 100 ? 5 : 3.2, 22 - GY, 6, STONE, 0, STONE_L);
      farG.box(gx, 22, gz, 31, 6, 6, STONE, 0, [0.8, 0.72, 0.58]); farG.box(gx, 28, gz, 12, 3, 6, STONE_L, 0, [0.82, 0.75, 0.6]);
      for (const o of [-13, 0, 13]) { const y = o ? 28 : 31; for (const [ax, az] of [[-1.3, -1.3], [1.3, -1.3], [1.3, 1.3], [-1.3, 1.3]]) farG.pole([gx + o + ax, y, gz + az], [gx + o + ax, y + 3, gz + az], 0.22, STONE_L);
        farG.cyl(gx + o, y + 3, gz, 2.6, 2.3, 0.5, 8, STONE); farG.cyl(gx + o, y + 3.5, gz, 2.1, 0.9, 1.3, 8, [[0.86, 0.82, 0.74], [0.74, 0.7, 0.64]]); farG.cyl(gx + o, y + 4.8, gz, 0.9, 0, 1.4, 8, [1.2, 0.85, 0.3]); }
      for (let o = -14; o <= 14; o += 2.8) farG.box(gx + o, 28, gz, 1.4, 1.1, 6, STONE_L);
      flag(farG, gx - 15, 28, gz, hx('#D8281C')); flag(farG, gx + 15, 28, gz, hx('#ff7a12')); }
    let bridgeZ = 0;
    { const bz = lrng.range(140, 320), iron = [0.16, 0.15, 0.17], rust = [0.44, 0.15, 0.1], xa = RIV0 - 8, xb = RIV1 + 8, nSp = 5, sp = (RIV1 - RIV0 - 12) / nSp;      // the iron bridge: five bowstring spans in red oxide
      bridgeZ = bz;
      farG.box((xa + xb) / 2, 14.5, bz, xb - xa, 1.2, 9, iron, 0, [0.35, 0.33, 0.3], true);
      for (let q = 0; q <= nSp; q++) {
        const x = RIV0 + 6 + q * sp; farG.box(x, GY - 1, bz, 4, 15.5 - GY, 11, [0.45, 0.4, 0.36]);
        if (q < nSp) for (const sd of [-4.4, 4.4]) {
          farG.box(x + sp / 2, 15.7, bz + sd, sp, 0.9, 0.4, rust, 0, null, true);
          for (let e = 0, prev = [x, 16.2, bz + sd]; e < 6; e++) { const f = (e + 1) / 6, pt = [x + f * sp, 16.2 + 30 * f * (1 - f), bz + sd]; farG.pole(prev, pt, 0.3, rust); if (e % 2 === 0) farG.pole([pt[0], 16.2, pt[2]], pt, 0.13, rust); prev = pt; }
        }
      }
    }
    const chimneys = [];
    for (let q = 0; q < 9; q++) {
      const x = lrng.range(1420, 2450), z = -1000 + q * 240 + lrng.range(-80, 80), hh = lrng.range(50, 70), brick = sc(BRICK, lrng.range(0.8, 1.1));
      farG.cyl(x, GY, z, 4.8, 2.6, hh + 6 - GY, 10, [brick, sc(brick, 0.82)], [0.05, 0.04, 0.04]); farG.cyl(x, 6 + hh - 3, z, 2.9, 2.9, 1.2, 10, sc(brick, 0.6));
      farG.box(x + 22, GY, z + lrng.range(-20, 20), 60, 19 - GY, 26, sc(brick, 0.9), lrng.range(-0.3, 0.3), [0.4, 0.4, 0.42]);
      chimneys.push([x, 6 + hh, z]);
    }
    await ctx.yield();
    // ---------- the great places, the river and its far bank. Everything here draws from its own stream (the landmarks
    // above keep theirs) and goes into the landmark mesh, bar the market's awnings, which flutter with the roof props.
    {
      const srng = ctx.core.makeRng(ctx.core.hashSeed('places:' + gs)), SR = (a, b) => srng.range(a, b), pickS = (a) => a[Math.floor(srng() * a.length)];
      const g = farG, GOLD = [1.25, 0.82, 0.26], PALE = [0.86, 0.83, 0.75];
      // a domed kiosk on four posts
      const kiosk = (x, y, z, k, col) => {
        for (const [ox, oz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) g.pole([x + ox * 1.25 * k, y, z + oz * 1.25 * k], [x + ox * 1.25 * k, y + 2.5 * k, z + oz * 1.25 * k], 0.17 * k, col);
        g.box(x, y + 2.5 * k, z, 3.3 * k, 0.3 * k, 3.3 * k, sc(col, 0.8), 0, col, true);
        g.cyl(x, y + 2.8 * k, z, 1.45 * k, 1.0 * k, 0.75 * k, 8, [col, sc(col, 0.86)]); g.cyl(x, y + 3.55 * k, z, 1.0 * k, 0, 0.8 * k, 8, [col, sc(col, 0.86)]);
        g.cyl(x, y + 4.25 * k, z, 0.14 * k, 0, 0.9 * k, 4, GOLD);
      };
      // a slender tower: three shafts, two balconies, a domed cap
      const tower = (x, y, z, H, r, col, colL) => {
        let yy = y;
        for (const [k0, k1, hf, bal] of [[1, 0.86, 0.38, 1], [0.8, 0.7, 0.32, 1], [0.62, 0.55, 0.19, 0]]) {
          g.cyl(x, yy, z, r * k0, r * k1, H * hf, 10, [col, sc(col, 0.82)]); yy += H * hf;
          if (bal) g.cyl(x, yy - 0.5, z, r * k1 * 1.55, r * k1 * 1.55, 0.5, 10, [colL, sc(colL, 0.85)], colL);
        }
        g.cyl(x, yy, z, r * 0.75, r * 0.75, 0.3, 10, colL, colL); g.cyl(x, yy + 0.3, z, r * 0.7, r * 0.36, H * 0.045, 10, [colL, sc(colL, 0.88)]); g.cyl(x, yy + 0.3 + H * 0.045, z, r * 0.36, 0, H * 0.04, 10, [colL, sc(colL, 0.88)]);
        g.cyl(x, yy + 0.3 + H * 0.085, z, 0.2, 0, H * 0.04, 4, GOLD);
      };
      // a temple: a plinth, a hall, a curved tower in eight ribs, a ribbed cushion, a gold pot and a saffron flag
      const shikhara = (x, z, k, col) => {
        const cD = sc(col, 0.72), ribs = [col, sc(col, 0.84)];
        g.box(x, GY, z, 11.5 * k, 1.4, 11.5 * k, cD, 0.3, sc(col, 0.9), true);
        g.box(x, GY + 1.4, z, 8.6 * k, 5 * k, 8.6 * k, col, 0.3, sc(col, 1.08));
        let y = GY + 1.4 + 5 * k, r = 4.5 * k;
        for (const [r1, hh] of [[4.2, 3], [3.6, 3.4], [2.8, 3.4], [1.95, 3], [1.25, 2.2]]) { g.cyl(x, y, z, r, r1 * k, hh * k, 8, ribs); y += hh * k; r = r1 * k; }
        g.cyl(x, y, z, 1.9 * k, 1.9 * k, 0.8 * k, 8, [cD, col], cD); y += 0.8 * k;
        g.cyl(x, y, z, 0.9 * k, 0, 2 * k, 6, GOLD); y += 1.6 * k;
        g.pole([x, y, z], [x, y + 4.5, z], 0.09, [0.4, 0.3, 0.2]); const ph = SR(0, 6);
        g.tri([x, y + 4.5, z], [x, y + 3.1, z], [x + 3.4, y + 3.8, z + 0.1], hx('#ff7a12'), [0, ph, 0.6], [0, ph, 0.6], [0.4, ph + 1.5, 0.6]);
      };
      // a plain tree: a trunk and a crown in two tiers (the far bank, the river roads, the walk round the tank)
      const ftree = (x, z, k, y0 = GY, fine = false) => {
        const c = sc(LEAF, SR(0.72, 1.12)), cd = sc(c, 0.7), cl = sc(c, 1.28), ph = x * 0.7 + z;
        g.pole([x, y0, z], [x, y0 + 4.4 * k, z], 0.34 * k, [0.3, 0.24, 0.19]);
        if (fine) {                                   // seen from close above: a rounder crown in three tiers of seven
          g.cyl(x, y0 + 3.0 * k, z, 1.6 * k, 3.7 * k, 1.9 * k, 7, [cd, sc(cd, 1.2), sc(cd, 0.9)], null, [0.05 * k, ph, 0.25]);
          g.cyl(x, y0 + 4.9 * k, z, 3.7 * k, 3.3 * k, 1.8 * k, 7, [c, sc(c, 1.15), cd, sc(c, 0.92)], null, [0.06 * k, ph + 0.6, 0.25]);
          g.cyl(x, y0 + 6.7 * k, z, 3.3 * k, 1.1 * k, 2.3 * k, 7, [cl, c, sc(c, 1.12)], cl, [0.07 * k, ph + 1, 0.25]);
          return;
        }
        g.cyl(x, y0 + 3.2 * k, z, 2.3 * k, 3.9 * k, 2.5 * k, 5, [cd, sc(cd, 1.2)], null, [0.05 * k, ph, 0.25]);
        g.cyl(x, y0 + 5.7 * k, z, 3.9 * k, 1.4 * k, 3.3 * k, 5, [c, sc(c, 1.2), sc(c, 0.88)], sc(c, 1.3), [0.07 * k, ph + 1, 0.25]);
      };
      // a country boat: 0 with a cloth cabin, 1 under a lateen sail, 2 bare
      const boat = (x, z, yaw, L, kind) => {
        const hull = sc(pickS([[0.36, 0.22, 0.12], [0.16, 0.25, 0.4], [0.5, 0.16, 0.1], [0.14, 0.34, 0.3], [0.6, 0.5, 0.3]]), SR(0.8, 1.15)), ca = Math.cos(yaw), sa = Math.sin(yaw), y = GY - 0.35;
        g.box(x, y, z, L * 0.72, 0.95, L * 0.2, hull, yaw, sc(hull, 1.5), true);
        for (const e of [-1, 1]) g.box(x + ca * e * L * 0.43, y + 0.25, z - sa * e * L * 0.43, L * 0.16, 0.95, L * 0.11, hull, yaw, sc(hull, 1.3), true);
        if (kind === 0) { const c = pickS(cloths); g.box(x, y + 0.95, z, L * 0.34, 1.0, L * 0.19, c, yaw, sc(c, 1.25), true); }
        else if (kind === 1) {
          const c = pickS([[0.85, 0.8, 0.68], [0.9, 0.55, 0.1], [0.85, 0.8, 0.68], [0.75, 0.14, 0.1]]), ph = SR(0, 6), hm = L * 0.75;
          g.pole([x, y + 0.9, z], [x, y + 0.9 + hm, z], 0.09, [0.3, 0.22, 0.15]);
          g.tri([x, y + 1.0 + hm, z], [x - ca * L * 0.4, y + 1.5, z + sa * L * 0.4], [x + ca * L * 0.36, y + 1.7, z - sa * L * 0.36], c, [0.05, ph, 0.6], [0.05, ph, 0.6], [0.3, ph + 1, 0.6]);
        }
      };
      // the domed tomb in its court: a plinth, a hall with a great arch in each face, a ribbed white dome on a drum,
      // four kiosks on the roof and four slender towers at the plinth's corners
      { const x = TOMB.x, z = TOMB.z, st = sc(hx('#D9A066'), 0.9), stL = sc(hx('#EBC48C'), 0.95), stD = sc(st, 0.62), dark = [0.07, 0.05, 0.05], y1 = GY + 1.8;
        g.box(x, GY, z, 52, 1.8, 52, stD, 0, sc(stL, 0.9), true);
        g.box(x, y1, z, 30, 15, 30, st, 0, stL);
        for (const [ox, oz, ax] of [[-15.06, 0, 1], [15.06, 0, 1], [0, -15.06, 0], [0, 15.06, 0]]) for (const [u, hw, top] of [[0, 4.2, 12.6], [-10, 2.3, 7.6], [10, 2.3, 7.6]]) {
          const cx = x + ox, cz = z + oz, ya = y1 + top - hw * 0.9;
          panel(g, ax, cx, cz, u - hw, u + hw, y1, ya, dark);
          if (ax) g.tri([cx, ya, cz + u - hw], [cx, ya, cz + u + hw], [cx, y1 + top, cz + u], dark); else g.tri([cx + u - hw, ya, cz], [cx + u + hw, ya, cz], [cx + u, y1 + top, cz], dark);
        }
        g.box(x, y1 + 15, z, 31.2, 1.1, 31.2, stL, 0, sc(st, 0.85), true);
        let y = y1 + 16.1, r = 11.0;
        g.cyl(x, y, z, 10.4, 10.4, 4.2, 16, [stL, sc(stL, 0.88)]); y += 4.2;
        for (const [r1, hh] of [[11.7, 2.2], [11.3, 2.6], [9.8, 2.8], [7.2, 2.6], [3.8, 2.0], [0, 1.6]]) { g.cyl(x, y, z, r, r1, hh, 16, [PALE, sc(PALE, 0.9)]); y += hh; r = r1; }
        g.cyl(x, y - 0.4, z, 0.8, 0, 4, 6, GOLD);
        for (const [ox, oz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { kiosk(x + ox * 12, y1 + 16.1, z + oz * 12, 1.5, PALE); tower(x + ox * 24, y1, z + oz * 24, 44, 1.9, st, stL); }
      }
      await ctx.yield();
      // the tank: a kiosk on the island, a causeway out to it, trees round the walk, a few boats
      { const { x, z, r } = TANK, st = [0.6, 0.5, 0.4];
        g.box(x, GY - 0.4, z, 5, 1.0, 5, sc(st, 0.8), 0.4, st, true); kiosk(x, GY + 0.6, z, 1.5, PALE);
        g.box(x - (r + 8) / 2, GY - 0.3, z, r - 8, 0.75, 2.4, sc(st, 0.75), 0, st, true);
        for (let q = 0; q < 3; q++) { const a = q * 2.1 + 0.9; ftree(x + Math.cos(a) * 5.2, z + Math.sin(a) * 5.2, SR(0.7, 0.95), GY, true); }
        for (let q = 0; q < 20; q++) { const a = (q + SR(-0.25, 0.25)) / 20 * TAU; if (srng.chance(0.15)) continue; ftree(x + Math.cos(a) * (r + 10.6), z + Math.sin(a) * (r + 10.6), SR(0.9, 1.35), GY, true); }
        for (let q = 0; q < 4; q++) { const a = SR(0, TAU), d = SR(13, r - 6); boat(x + Math.cos(a) * d, z + Math.sin(a) * d, SR(0, TAU), SR(4.5, 6), 2); }
      }
      for (const y of YARDS) shikhara(y[0], y[1], y[2], sc(hx(y[3]), 0.92));
      await ctx.yield();
      // the market: rows of pitched awnings either side of the bazaar street, their shadows, the crowd under them
      { const gm = geos[chunkOf(432)], sgm = shGeos[chunkOf(432)], yE = GY + 2.5, yR = GY + 3.35, off = Math.min(2.9 / tanE, 6), ox = sdx * off, oz = sdz * off;
        for (const xs of [411, 427.5, 433, 440.5, 446, 452.5]) for (let z = MKT.z0 + 3.2; z < MKT.z1 - 2; z += 4.3) {
          cellOf(xs, z, _c); const taken = cH[cidx(_c.i, _c.j)] > 0, c = pickS(cloths), c2 = srng.chance(0.55) ? [0.82, 0.78, 0.68] : pickS(cloths), ph = SR(0, 6.28), hw = 1.55, hl = 1.85, zz = z + SR(-0.3, 0.3);
          if (taken || srng.chance(0.14)) continue;
          gm.quad([xs - hw, yE, zz - hl], [xs - hw, yE, zz + hl], [xs, yR, zz + hl], [xs, yR, zz - hl], c, [0.05, ph, 0.5], [0, ph, 0.5]);
          gm.quad([xs + hw, yE, zz - hl], [xs + hw, yE, zz + hl], [xs, yR, zz + hl], [xs, yR, zz - hl], c2, [0.05, ph + 2, 0.5], [0, ph, 0.5]);
          sgm.quad([xs - hw + ox, GY + 0.06, zz - hl + oz], [xs + hw + ox, GY + 0.06, zz - hl + oz], [xs + hw + ox, GY + 0.06, zz + hl + oz], [xs - hw + ox, GY + 0.06, zz + hl + oz], Z3);
        }
        for (let q = 0, n = Math.round(130 * detail); q < n; q++) speck(SR(MKT.x0 + 1, MKT.x1 - 1), GY, SR(MKT.z0 + 1, MKT.z1 - 1), SR(-0.5, 0.5), 0, SR(-0.5, 0.5), SR(0, 6.28), SR(2, 5.5), SR(1.55, 1.85), 0, pickS(cloths));
      }
      await ctx.yield();
      // a stay of the ring whose roof was cleared for a court: a bamboo stage carries its tripod
      for (const la of A.ringLineAnchors) {
        const wv = toW(la), yb = wv.y - 2.7; cellOf(wv.x, wv.z, _c);
        if (!inGrid(_c.i, _c.j) || cH[cidx(_c.i, _c.j)] > 0 || yb < GY + 2) continue;
        for (const [ox, oz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) g.pole([wv.x + ox * 1.9, GY, wv.z + oz * 1.9], [wv.x + ox * 1.3, yb, wv.z + oz * 1.3], 0.09, BAMBOO);
        g.box(wv.x, yb - 0.14, wv.z, 3.1, 0.14, 3.1, sc(BAMBOO, 0.8), 0, null, true);
        g.pole([wv.x - 1.6, GY + (yb - GY) * 0.5, wv.z - 1.6], [wv.x + 1.6, GY + (yb - GY) * 0.5, wv.z + 1.6], 0.06, BAMBOO);
      }
      // the river: boats moored at the steps and out in the stream, kiosks at the heads of the ghats, trees along both bank roads
      for (let q = 0; q < 48; q++) {
        const moored = q % 5 < 2, farSide = srng.chance(0.5), z = SR(-640, 640), L = SR(9, 15), yaw = moored ? SR(-0.5, 0.5) : Math.PI / 2 + SR(-0.25, 0.25);
        const x = moored ? (farSide ? RIV1 - GHAT - SR(3, 9) : RIV0 + GHAT + SR(3, 9)) : SR(RIV0 + GHAT + 16, RIV1 - GHAT - 16);
        if (Math.abs(z - bridgeZ) > 10) boat(x, z, yaw, L, q % 3);
        if ((q & 7) === 7) await ctx.yield();
      }
      for (const bx of [RIV0 + 3.5, RIV1 - 3.5]) {
        for (let z = -612 + SR(0, 20); z < 620;) {
          const kio = srng.chance(0.2), kk = SR(1.2, 1.7), tk = SR(0.85, 1.3), jx = SR(-1, 1);
          if (Math.abs(z - bridgeZ) > 14) { if (kio) kiosk(bx, GY, z, kk, [0.8, 0.7, 0.56]); else ftree(bx + jx, z, tk); }
          z += kio ? SR(30, 44) : SR(22, 40);
        }
        await ctx.yield();
      }
      // the far bank's skyline: a domed mosque between two towers, temples, more towers, and others deeper in its town
      { const fx = RIV1 + 16, cream = sc(hx('#F1E3C4'), 0.9), rose = sc(hx('#DE9A74'), 0.95), sand = sc(hx('#E8B98A'), 0.95);
        dome(g, fx + 6, -150, 1.7); tower(fx - 6, GY, -167, 42, 1.8, STONE, STONE_L); tower(fx - 6, GY, -133, 42, 1.8, STONE, STONE_L);
        shikhara(fx + 2, 104, 1.7, rose); shikhara(fx + 10, 136, 1.15, cream);
        await ctx.yield();
        shikhara(fx + 4, -385, 1.5, cream); dome(g, fx + 8, 395, 1.3); tower(fx - 4, GY, 381, 34, 1.5, STONE, STONE_L);
        tower(fx, GY, -630, 38, 1.7, STONE, STONE_L); tower(fx, GY, -606, 38, 1.7, STONE, STONE_L); shikhara(fx + 6, 640, 1.6, sand);
        await ctx.yield();
        shikhara(RIV1 + 150, 34, 1.9, cream); dome(g, RIV1 + 124, -262, 1.5); tower(RIV1 + 110, GY, -262, 36, 1.6, STONE, STONE_L); shikhara(RIV1 + 136, 262, 1.4, sand); tower(RIV1 + 84, GY, -474, 40, 1.7, STONE, STONE_L);
      }
      await ctx.yield();
      // a tree in one square in four of the new streets, this side of the river and the other
      for (let j = J0; j < J0 + NZ; j++) {
        for (let i = FI1 + 1; i <= FB1; i++) {
          if (i > BI1 ? i < FB0 : (j < FJ0 || j > FJ1)) continue;
          if (cOpen[cidx(i, j)] === 1 && ih(i, j, gs + 81) < 0.27) ftree(i * 12 + 6 + (ih(i, j, gs + 82) - 0.5) * 4, 12 * j + 4 + (ih(i, j, gs + 83) - 0.5) * 4, 0.95 + 0.5 * ih(i, j, gs + 84));
        }
        if ((j & 15) === 15) await ctx.yield();
      }
    }
    await ctx.yield();
    // striped awnings along the bazaar streets near the route
    for (let j = FJ0; j <= FJ1; j++) for (let i = FI0; i <= FI1; i++) {
      if (i === FI0 && (j & 15) === 0) await ctx.yield();
      const k = cidx(i, j), mi = ((i % 14) + 14) % 14; if (!cTier[k] || (mi !== 6 && mi !== 7) || cH[k] <= 0) continue;
      plot(i, j, rect); const g = geos[chunkOf(rect[0])], xw = mi === 6 ? rect[1] : rect[0], dir = mi === 6 ? 1 : -1;
      for (let z = rect[2] + 0.4; z < rect[3] - 2.4; z += prng.range(2.8, 3.6)) { const c = pick(cloths), w = prng.range(2, 2.6), ph = R(0, 6.28);
        g.quad([xw, GY + 3.6, z], [xw, GY + 3.6, z + w], [xw + dir * 1.9, GY + 2.8, z + w], [xw + dir * 1.9, GY + 2.8, z], c, [0, ph, 0.5], [0.06, ph, 0.5], [0.8, 0.77, 0.7]); }
    }
    await ctx.yield();

    // ---------- neem and peepal crowns standing up out of courtyards and lane corners, lost kites in their tops
    const wind = flora.makeWind({ direction: [1, 0.1], strength: look.gust ? 2.1 : 1.1, speed: look.gust ? 1.7 : 1.2 });
    const trng = rng.fork('trees'), treePts = [];
    const treeVars = [0, 1, 2].map((q) => flora.oakGeometry({ rng: trng.fork('v' + q), detail: 0, height: 12.5 + q * 1.5, leaf: ['#4d7d2c', '#3f7434', '#5c8a30'][q], leafLight: '#8fb04a', bark: '#6a5a48' }));
    // the leaf atlas (the one windMaterial would make) is a single long kit call: it gets a step of the build to itself
    await ctx.yield();
    await flora.prepareLeafTexture({}, ctx.yield);
    const leafMap = flora.makeLeafTexture();
    await ctx.yield();
    const leafMat = flora.windMaterial({ wind, map: leafMap, backlight: 1.0, ambient: 1.6, leafAmbient: 1.5 });
    await ctx.yield();
    for (let q = 0, tries = 0; q < Math.round(80 * Math.min(dens, 1.1)) && tries < 5000; tries++) {
      if ((tries & 127) === 127) await ctx.yield();
      const i = trng.int(FI0, FI1), j = trng.int(FJ0, FJ1), open = cH0[cidx(i, j)] <= 0;
      if (!open && trng.chance(0.85) && tries % 3) continue;
      const x = open ? i * 12 + 6 + trng.range(-2, 2) : i * 12 + trng.range(-0.6, 0.6), z = open ? 12 * j + 4 + trng.range(-2, 2) : 12 * j - 2 + trng.range(-0.6, 0.6);
      const n = path.nearestXZ(x, z); if (n.dist < 15 && n.y < 40) continue;
      if (Math.hypot(x - winch.x, z - winch.z) < 16 || Math.hypot(x - 530, z + 20) < 22) continue;
      const s = trng.range(0.95, 1.3); treePts.push({ x, y: GY - 0.2, z, s, rot: trng.range(0, 6.28), v: q % 3, u: 0, d: n.dist, open, kite: q % 2 === 1 }); q++;
      if (q % 2 === 0) { const g = geos[chunkOf(x)], c = pick(cloths), kx = x + trng.range(-2.5, 2.5), kz = z + trng.range(-2.5, 2.5), ky = GY - 0.2 + (12.5 + (q % 3) * 1.5) * s * 0.93, a = trng.range(0, 6.28), ph = trng.range(0, 6.28);
        const ca = Math.cos(a) * 0.7, sa = Math.sin(a) * 0.7;
        g.quad([kx - ca, ky, kz - sa], [kx + sa, ky + 0.5, kz - ca], [kx + ca, ky + 0.9, kz + sa], [kx - sa, ky + 0.4, kz + ca], c, [0.05, ph, 0.7], [0.16, ph + 1, 0.7], sc(c, 0.85)); }
    }
    // a tree that would now stand in the tank or under the tomb or a temple steps aside to the walk round it, and ten of
    // the trees in squares within sight of the high part of the route are great old banyans
    for (const t of treePts) {
      const dx = t.x - TANK.x, dz = t.z - TANK.z, d = Math.hypot(dx, dz);
      if (d < TANK.r + 9.5) { const k = (TANK.r + 10.8) / Math.max(d, 0.01); t.x = TANK.x + dx * k; t.z = TANK.z + dz * k; }
      for (const b of BLOCKS.slice(1)) { const ex = t.x - b[0], ez = t.z - b[1]; if (Math.abs(ex) < b[2] + 1 && Math.abs(ez) < b[2] + 1) { if (Math.abs(ex) > Math.abs(ez)) t.x = b[0] + (ex < 0 ? -1 : 1) * (b[2] + 2.5); else t.z = b[1] + (ez < 0 ? -1 : 1) * (b[2] + 2.5); } }
    }
    { let nb = 0; for (const t of treePts) { if (nb >= 10) break; if (t.kite || !t.open || t.d < 70 || t.d > 340) continue; t.s *= 1.85; nb++; } }
    await ctx.yield();
    const trees = flora.makeScatter({ rng: trng, variants: treeVars, points: treePts, material: leafMat, tint: 0.2, hue: 0.05, sink: 0, tilt: 0.04 });
    scene.add(trees.object);
    await ctx.yield();

    // ---------- props, cloth and shadows become a handful of meshes
    const propMat = mkMat(PROP_VERT, PROP_FRAG, { uFlut: { value: look.gust ? 8.5 : 5.2 }, uAmp: { value: look.gust ? 2 : 1 }, uGain: { value: 1 }, uMoon: { value: new THREE.Color(0, 0, 0) } }, { side: THREE.DoubleSide });
    const shadowMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.46, 0.47, 0.66).lerp(new THREE.Color(1, 1, 1), night * 0.6), blending: THREE.CustomBlending, blendSrc: THREE.ZeroFactor, blendDst: THREE.SrcColorFactor,
      depthWrite: false, fog: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    let propTris = 0;
    for (let c = 0; c < NCH; c++) {
      if (geos[c].triangles) { const m = new THREE.Mesh(await geos[c].buildAsync(ctx.yield), propMat); m.name = 'roof-props-' + c; scene.add(m); propTris += geos[c].triangles; }
      await ctx.yield();
      if (shGeos[c].triangles) { const sgm = await shGeos[c].buildAsync(ctx.yield); sgm.deleteAttribute('aCol'); sgm.deleteAttribute('aW'); sgm.deleteAttribute('normal'); const m = new THREE.Mesh(sgm, shadowMat); m.renderOrder = 1; m.name = 'prop-shadows-' + c; scene.add(m); }
      await ctx.yield();
    }
    { const m = new THREE.Mesh(await farG.buildAsync(ctx.yield), propMat); m.name = 'landmarks'; m.frustumCulled = false; scene.add(m); }
    await ctx.yield();
    // ---------- a cut kite that comes down where we land. It hangs in the air over the head of the skim row until our
    // own line is cut, then side-slips down as we fall and settles across the parapet of the terrace we come down onto,
    // where it lies fluttering among the flyers (keyed to u in update; the same paper shader as the roof cloths).
    const cutKite = new THREE.Group(); cutKite.name = 'settling-kite'; scene.add(cutKite);
    const cutLand = new THREE.Vector3(409.5, 13.2, -8);
    { const cr = plot(34, -1, rect); if (cH[cidx(34, -1)] > 0) cutLand.set(Math.min(cr[1] - 1.6, Math.max(cr[0] + 1.6, 409.5)), cH[cidx(34, -1)] + 1.12, cr[3] - 0.25); }
    { const g = makeGeo(), c1 = sc(hx('#E3207F'), 0.95), c2 = [0.9, 0.78, 0.4], s1 = 2.0, wv = (a, p) => [a, p, 0.7];
      const Nn = [0, 0, -s1], Ss = [0, 0, s1], Ee = [0.95 * s1, 0.14, -0.2 * s1], Ww = [-0.95 * s1, 0.14, -0.2 * s1], Cn = [0, -0.1, -0.18 * s1];
      g.tri(Nn, Ww, Cn, c1, wv(0.02, 0.3), wv(0.07, 1.5), wv(0.01, 0.8)); g.tri(Ww, Ss, Cn, c2, wv(0.07, 1.5), wv(0.05, 2.6), wv(0.01, 0.8));
      g.tri(Nn, Cn, Ee, c1, wv(0.02, 0.3), wv(0.01, 0.8), wv(0.07, 2.1)); g.tri(Cn, Ss, Ee, c2, wv(0.01, 0.8), wv(0.05, 2.6), wv(0.07, 2.1));
      for (let q = 0; q < 6; q++) { const z0 = s1 + q * 0.5, z1 = z0 + 0.5, w0 = 0.09 - q * 0.008, w1 = w0 - 0.008;        // a banded paper tail
        g.quad([-w0, 0, z0], [w0, 0, z0], [w1, 0, z1], [-w1, 0, z1], q % 2 ? c2 : c1, wv(0.03 + q * 0.035, -q * 1.1), wv(0.03 + (q + 1) * 0.035, -(q + 1) * 1.1)); }
      const m = new THREE.Mesh(g.build(), propMat); m.frustumCulled = false; cutKite.add(m); }
    scene.userData.kiteRoofs = { flyers: nFlyers, sitters: nSitters, fixed: A.fixedPlaced, great: A.counts.great, kites: A.counts.kites, cleared: A.counts.cleared, propTris };
    await ctx.yield();

    // ---------- specks: the crowd at every kite line, rickshaws and handcarts, escaped balloons, the centipede kite
    const crng = rng.fork('crowd'), KA = A.kiteAnchors, nAnch = KA.length / 3, crowdMax = Math.round(7200 * detail * Math.min(1, dens + 0.1));
    const skin = cloths.concat([[0.85, 0.83, 0.78], [0.85, 0.83, 0.78]]);
    let people = 0;
    const speckIf = (ok, ...a) => { if (ok) speck(...a); };         // the draws are made all the same, so the stream never shifts
    const person = (x, z, i, j) => {
      const kc = cidx(i, j), h = cH0[kc]; if (h <= 0) return;
      plot(i, j, rect); x = Math.min(rect[1] - 0.6, Math.max(rect[0] + 0.6, x)); z = Math.min(rect[3] - 0.6, Math.max(rect[2] + 0.6, z));
      const n = path.nearestXZ(x, z); if (Math.hypot(n.dist, n.y - h) < 30 || cTier[kc] === 2) return;
      speckIf(cH[kc] > 0, x, h, z, crng.range(-0.5, 0.5), 0, crng.range(-0.5, 0.5), crng.range(0, 6.28), crng.range(2, 5.5), crng.range(1.55, 1.85), 0, crng.pick(skin)); people++;
    };
    for (let a = 0; a < nAnch && people < crowdMax * 0.8; a++) {
      if ((a & 255) === 255) await ctx.yield();
      const x = 350 - KA[a * 3 + 2], z = KA[a * 3]; cellOf(x, z, _c);
      if (_c.i < FI0 || _c.i > FI1 || _c.j < FJ0 || _c.j > FJ1 || modelled.has(a)) continue;
      const n = 1 + crng.int(0, 2), ci = _c.i, cj = _c.j;
      for (let q = 0; q < n; q++) person(x + crng.range(-1.6, 1.6), z + crng.range(-1.6, 1.6), ci, cj);
    }
    for (let q = 0; q < 6000 && people < crowdMax; q++) {
      if ((q & 255) === 255) await ctx.yield();
      const i = crng.int(FI0, FI1), j = crng.int(FJ0, FJ1); plot(i, j, rect);
      const edge = crng.chance(0.6), x = crng.range(rect[0], rect[1]), z = edge ? (crng.chance(0.5) ? rect[2] : rect[3]) : crng.range(rect[2], rect[3]);
      person(x, z, i, j); if (crng.chance(0.5)) person(x + crng.range(-1, 1), z, i, j);
    }
    await ctx.yield();
    const vcol = [[0.9, 0.7, 0.05], [0.1, 0.45, 0.2], [0.9, 0.7, 0.05], [0.5, 0.32, 0.16], [0.15, 0.3, 0.6], [0.75, 0.12, 0.08]];
    { const qr = ctx.core.makeRng(ctx.core.hashSeed('squares:' + gs));                      // a knot of people and a handcart in every square near the route
      for (let j = FJ0; j <= FJ1; j++) for (let i = FI0; i <= FI1; i++) {
        if (i === FI0 && (j & 7) === 0) await ctx.yield();
        if (cOpen[cidx(i, j)] !== 1) continue;
        const cx = i * 12 + 6, cz = 12 * j + 4; if (path.nearestXZ(cx, cz).dist > 240) continue;
        const dry = !blocked(cx, cz, 3);                                                     // not in the tank, nor under the tomb
        for (let q = 0, n = Math.round(qr.int(5, 8) * detail); q < n; q++) speckIf(dry, cx + qr.range(-5, 5), GY, cz + qr.range(-5, 5), qr.range(-0.5, 0.5), 0, qr.range(-0.5, 0.5), qr.range(0, 6.28), qr.range(2, 5.5), qr.range(1.55, 1.85), 0, qr.pick(skin));
        const a = qr.range(0, 6.28), L = qr.range(7, 10);
        speckIf(dry, cx - Math.cos(a) * L / 2, GY + 0.05, cz - Math.sin(a) * L / 2, Math.cos(a) * L, 0, Math.sin(a) * L, qr(), qr.range(0.6, 1.2) / L, qr.range(1.2, 1.5), 1, qr.pick(vcol));
      } }
    await ctx.yield();
    for (let i = FI0; i <= FI1; i++) {                                  // lanes running along z
      const mi = ((i % 14) + 14) % 14, wide = mi === 6, n = wide ? Math.round(34 * dens) : (crng.chance(0.4) ? 3 : 0);
      for (let q = 0; q < n; q++) { const dir = crng.chance(0.5) ? 1 : -1, len = wide ? 990 : crng.range(120, 300), z0 = wide ? -495 : crng.range(-480, 480 - len), sp = wide ? crng.range(4, 8) : crng.range(1.2, 2.4);
        const clearRun = wide || !BLOCKS.some((b) => Math.abs(i * 12 + 12 - b[0]) < b[2] + 1 && z0 + len > b[1] - b[2] && z0 < b[1] + b[2]);      // a lane that would run through the tank or a court carries nothing
        speckIf(clearRun, i * 12 + 12 + (wide ? dir * crng.range(0.6, 2.6) : 0), GY + 0.05, dir > 0 ? z0 : z0 + len, 0, 0, dir * len, crng(), sp / len, crng.range(1.3, 1.7), 1, crng.pick(vcol)); }
    }
    for (let j = FJ0; j <= FJ1; j++) {                                  // cross streets along x
      const mj = ((j % 19) + 19) % 19; if (mj !== 9) continue;
      for (let q = 0; q < Math.round(30 * dens); q++) { const dir = crng.chance(0.5) ? 1 : -1; speck(dir > 0 ? -150 : 850, GY + 0.05, 12 * j + 10 + dir * crng.range(0.5, 2), dir * 1000, 0, 0, crng(), crng.range(4, 8) / 1000, crng.range(1.3, 1.7), 1, crng.pick(vcol)); }
    }
    for (let q = 0; q < 46; q++) speck(crng.range(-100, 800), crng.range(18, 40), crng.range(-420, 420), 0, crng.range(150, 230), 0, crng(), 1 / crng.range(50, 90), crng.range(0.7, 1.0), 2, crng.pick(cloths));
    await ctx.yield();
    if (centipede) { const dir = crng.chance(0.5) ? 1 : -1, x0 = crng.range(600, 720), y0 = crng.range(150, 175), cc = [hx('#D8281C'), hx('#F59A12')];
      for (let q = 0; q < 50; q++) speck(x0 - q * 0.6, y0, -dir * (470 + q * 3.3), 110, 12, dir * 940, q * 0.42, 1 / 80, q === 0 ? 5.2 : 3.4 - q * 0.02, 4, q === 0 ? hx('#ffd23a') : cc[q & 1]); }
    {
      const sg = new THREE.InstancedBufferGeometry(); sg.instanceCount = specks.pos.length / 3;
      sg.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, 0, 0.5, 0, 0, 0.5, 1, 0, -0.5, 0, 0, 0.5, 1, 0, -0.5, 1, 0], 3));
      sg.setAttribute('iPos', new THREE.InstancedBufferAttribute(new Float32Array(specks.pos), 3)); sg.setAttribute('iVel', new THREE.InstancedBufferAttribute(new Float32Array(specks.vel), 3));
      sg.setAttribute('iPar', new THREE.InstancedBufferAttribute(new Float32Array(specks.par), 4)); sg.setAttribute('iCol', new THREE.InstancedBufferAttribute(new Float32Array(specks.col), 3));
      const m = new THREE.Mesh(sg, mkMat(SPECK_VERT, SPECK_FRAG, {}, { side: THREE.DoubleSide })); m.frustumCulled = false; m.name = 'specks'; scene.add(m);
    }
    await ctx.yield();

    // ---------- birds
    const fauna = F.makeFauna(scene, { light: F.lightFrom(scene) }), frng = rng.fork('fauna');
    // pigeons: the kit's compact broad-winged bird (the crow build) in blue-grey with a pale underside, a fast shallow beat and almost no gliding
    const pigeon = { body: '#7f899b', belly: '#cfd4dd', wingC: '#a3acbc', trail: '#7a8496', tip: '#2e323c', head: '#4c5664', neckC: '#5f7f74', tailC: '#4e5664', beak: '#d8c8b0', flap: 6, glide: 0.1, outer: 0.7 };
    const parakeet = { body: '#8EDB3C', belly: '#A8D95C', wingC: '#4FA53A', tip: '#2C6B3A', head: '#86CC48', neckC: '#E86A8A', tailC: '#59B8A0', beak: '#D8342A', trail: '#3F8F36' };
    // (flock cure 1) every flock that can come near the flown line keeps 2.0 m of clear air from it, BY PLACE, bird by bird: its course stays where it
    // is laid, a bird whose own reach comes within 2 m of the line is moved by what it alone lacks (the kit's keepClear with each), the deal is held at
    // three scatters, and each has a small wander of its own written out so that the lane it leaves about the line stays narrow
    const clearOf = (from, to) => ({ path, dist: 2, each: true, from, to, step: 2 }), KF = [0.05, 0.08, 0.27, 0.51, 0.69], KT = [0.30, 0.49, 0.68, 0.88, 1];
    for (let q = 0; q < 5; q++) {                                  // flocks wheeling over their lofts all afternoon
      const x0 = 60 + q * 150 + frng.range(-30, 30), z0 = (q % 2 ? 1 : -1) * frng.range(75, 190), y0 = frng.range(26, 40), r0 = frng.range(34, 52), cl = q === 0, zc = z0 < 0 ? Math.min(z0, -(28 + 1.45 * r0)) : z0;      // the first wheels just under the climb (zc: a loft on the line's side stands far enough off that its wheel's course does not come over the line)
      fauna.add(F.makeFlock({ rng: frng.fork('w' + q), species: parakeetCloud ? 'parrots' : 'crows', lod: 'low', count: Math.round(120 * detail), size: parakeetCloud ? 0.9 : 1.0, center: [cl ? 128 : x0, cl ? 31 : y0, cl ? -46 : zc], radius: cl ? 30 : r0,
        spread: [22, 7, 26], wander: [1.2, 0.8, 1.6, parakeetCloud ? 0.6 : 0.4], maxSigma: 3, keepClear: clearOf(KF[q], KT[q]), ...(parakeetCloud ? parakeet : pigeon) }));
      await ctx.yield();
    }
    fauna.add(F.makeFlock({ rng: frng.fork('burst'), species: 'crows', lod: 'high', count: 120, size: 1.0, spread: [24, 7, 34], wander: [0.6, 0.4, 0.8, 0.4], maxSigma: 3, keepClear: clearOf(0.50, 0.86), ...pigeon,
      cross: { path, u: uBurst, lead: 30, angle: 171, side: 1, height: 2.5, span: 190, rise: 16, duration } }));
    await ctx.yield();
    fauna.add(F.makeFlock({ rng: frng.fork('minaret'), species: 'crows', lod: 'high', count: 44, size: 1.0, spread: [14, 8, 22], wander: [0.6, 0.4, 0.8, 0.4], maxSigma: 3, keepClear: clearOf(0.67, 0.78), ...pigeon,
      cross: { path, u: uMin - 0.012, lead: 22, angle: 100, side: 1, height: 7, span: 150, duration } }));
    await ctx.yield();
    fauna.add(F.makeFlock({ rng: frng.fork('parakeets'), species: 'parrots', count: 31, form: 'vee', size: 2.6, spacing: 0.7, speed: 26, ...parakeet,      // enlarged like our kite, and close-ranked: the kit's vee is otherwise 100 m across
      cross: { path, u: uCut - 0.075, lead: 20, angle: 62, side: -1, height: -10, span: 300, duration } }));
    await ctx.yield();
    fauna.add(F.makeFlock({ rng: frng.fork('raptors'), species: 'eagles', count: 3, center: [400, 172, 40], radius: 120 }));
    await ctx.yield();
    fauna.add(F.makeFlock({ rng: frng.fork('crows'), species: 'crows', count: 16, spread: [30, 10, 30], wander: [1.2, 0.8, 1.6, 0.4], maxSigma: 3, keepClear: clearOf(0.46, 0.88), center: [495, 24, 36], radius: 36 }));
    await ctx.yield();

    // ---------- air: dust, scraps of tissue, mill smoke, cooking fires, dusk lanterns, morning mist
    const T = { value: 0 }, air = fx.fxGroup(); scene.add(air.object);
    const sunArr = [SUN.x, SUN.y, SUN.z];
    air.add(fx.makeParticles({ rng: rng.fork('dust'), preset: 'dust', time: T, count: Math.round((look.gust ? 2600 : 1500) * detail), ...(look.gust ? { velocity: [9, 0.3, 1.2], box: [44, 22, 34] } : {}) }));
    await ctx.yield();
    air.add(fx.makeParticles({ rng: rng.fork('scraps'), preset: 'petals', time: T, count: Math.round((rare ? 900 : look.gust ? 700 : 380) * detail), box: [64, 34, 64], colors: [ourPaper[0], '#F59A12', '#f4f0e6'], velocity: look.gust ? [12, -0.3, 1.4] : [5.5, -0.5, 0.6] }));
    await ctx.yield();
    const smokeCol = night ? ['#7a5a70', '#b07a78'] : ['#a9a2a2', '#d8d2cc'];
    for (const c of chimneys) {
      air.add(fx.makeSmokeColumn({ rng: rng.fork('mill' + c[0]), time: T, position: c, height: 190 * (0.6 + 0.8 * ih(Math.round(c[0]), Math.round(c[2]), gs + 50)), radius: [5, 46], size: [22, 95], count: 46, color: smokeCol[0], colorTop: smokeCol[1],
        opacity: night ? 0.15 : 0.5, shadowColor: night ? '#2a2638' : '#7d7884', ambient: night ? '#201c2c' : '#77727c', wind: [1, 0, 0.12], bend: 0.85, sunDir: sunArr, rate: 0.03 }));
      await ctx.yield();
    }
    for (const [x, z] of [[40, 44], [452, -64], [486, 30]]) {
      air.add(fx.makeSmokeColumn({ rng: rng.fork('cook' + x), time: T, position: [x, roofAt(x, z) + 0.4, z], height: 26, radius: [0.3, 4], size: [1.4, 9], count: 40,
        color: '#d2ccc6', colorTop: '#efeae4', shadowColor: '#9a94a0', ambient: '#8a8690', opacity: 0.3, wind: [1, 0, 0.1], bend: 0.9, sunDir: sunArr }));
      await ctx.yield();
    }
    const ringX = new THREE.Vector3(0, 0, 1), ringUp = new THREE.Vector3(-A.portalSeat.up.z, A.portalSeat.up.y, A.portalSeat.up.x);
    if (look.lanterns) {
      air.add(fx.makeLanterns({ rng: rng.fork('lanterns'), time: T, count: Math.round(150 * detail), center: [430, 74, 0], area: [760, 116, 640], floor: 17, size: 2.6, rise: 1.3, wind: [1.2, 0, 0.1], colors: ['#ffb45a', '#ff8a3a'], intensity: 2.2 }));
      const gp = []; for (let q = 0; q < 16; q++) { const a = q / 16 * TAU; gp.push(ringC.clone().addScaledVector(ringX, Math.cos(a) * 10.4).addScaledVector(ringUp, Math.sin(a) * 10.4)); }
      air.add(fx.makeGlows({ rng: rng.fork('ringglow'), positions: gp, color: '#ffb060', size: 4.2, intensity: 2.4, flicker: 0.4, time: T }));
    }
    if (look.mist) air.add(fx.makeGroundFog({ time: T, y: 1, height: 8, color: '#efe6dc', opacity: 0.45, coverage: 0.7, sunDir: sunArr, sunColor: look.sun }));   // the mist lies in the lanes
    await ctx.yield();
    const sparks = fx.makeGlows({ rng: rng.fork('sparks'), count: 8, color: '#fff6e0', size: 0.13, intensity: night ? 0.8 : 2.2, flicker: 0.5, time: T, depthTest: false }); scene.add(sparks.object);

    // ---------- the ring from far off: at the entry the hoop is 750 m away and a dozen pixels across, so until we are near
    // it wears a scarlet rim that never falls under nine pixels and a soft saffron glow (gone by 260 m)
    const beacon = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
      uniforms: { uC: { value: ringC.clone() }, uCamP: LU.uCamP, uPx: LU.uPx, uCol: { value: new THREE.Color(PAL[6]) }, uHalo: { value: new THREE.Color('#ffb060') }, uK: { value: night ? 0.75 : 1 } },
      vertexShader: /* glsl */`
uniform vec3 uC, uCamP; uniform float uPx;
varying vec2 vQ; varying float vA;
void main(){
  float dist = length(uC - uCamP);
  float r = max(10.2, 9.*dist*uPx);
  vA = smoothstep(260., 520., dist);
  vQ = position.xy*2.8;
  vec4 mv = viewMatrix*vec4(uC, 1.);
  mv.xy += position.xy*2.8*r*vec2(1., .88);
  gl_Position = projectionMatrix*mv;
}`,
      fragmentShader: /* glsl */`
uniform vec3 uCol, uHalo; uniform float uK;
varying vec2 vQ; varying float vA;
void main(){
  float d = length(vQ*vec2(1., 1.));
  float rim = exp(-(d - 1.)*(d - 1.)*38.)*vA;
  float halo = exp(-d*d*.8)*(1. - smoothstep(2.2, 2.8, d))*vA;
  gl_FragColor = vec4(uCol*1.35*rim*uK + uHalo*halo*.2*uK, rim*.9);
}`, transparent: true, depthWrite: false, fog: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor }));
    beacon.frustumCulled = false; beacon.renderOrder = 6; beacon.name = 'ring-beacon'; scene.add(beacon);
    await ctx.yield();

    // ---------- inside the hoop, until the next world is there to be seen: a window on a bright morning sea. It is drawn
    // from the view ray in the window's own frame, so it has the parallax of a real opening, and it irises open on the
    // engine's own picture of the next world once that is showing (see update).
    const ringN = new THREE.Vector3(-A.portalSeat.normal.z, A.portalSeat.normal.y, A.portalSeat.normal.x);
    const vistaU = { uCamP: LU.uCamP, uTime: LU.uTime, uX: { value: ringX.clone() }, uY: { value: ringUp.clone() }, uZ: { value: ringN.clone() }, uC: { value: ringC.clone() }, uIris: { value: 0 },
      uRim: { value: new THREE.Color(look.portal) }, uDim: { value: night ? 0.8 : 1 } };
    const vista = new THREE.Mesh(new THREE.CircleGeometry(7.02, 56), new THREE.ShaderMaterial({ uniforms: vistaU, side: THREE.DoubleSide, fog: false,
      vertexShader: /* glsl */`
varying vec3 vW; varying vec2 vQ;
void main(){
  vec4 wp = modelMatrix*vec4(position, 1.);
  vW = wp.xyz; vQ = position.xy/7.02;
  gl_Position = projectionMatrix*viewMatrix*wp;
}`,
      fragmentShader: /* glsl */`
uniform vec3 uCamP, uX, uY, uZ, uRim, uC; uniform float uIris, uTime, uDim;
varying vec3 vW; varying vec2 vQ;
float vh(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7)))*43758.5453); }
float vnz(vec2 p){
  vec2 i = floor(p), f = fract(p); f = f*f*(3. - 2.*f);
  return mix(mix(vh(i), vh(i + vec2(1., 0.)), f.x), mix(vh(i + vec2(0., 1.)), vh(i + vec2(1., 1.)), f.x), f.y);
}
void main(){
  float r = length(vQ);
  if (r < uIris*1.08 - .04) discard;
  vec3 dw = normalize(vW - uCamP + vec3(0., 1e-5, 0.));
  vec3 d = vec3(dot(dw, uX), dot(dw, uY), dot(dw, uZ));
  d /= max(d.z, .25);
  float lz = max(dot(uC - uCamP, uZ), .5);
  d.xy += vQ*7.02*max(1./11.3 - 1./lz, 0.);                                // far off the window holds a wide view, as a real opening is given
  float x = d.x, y = d.y + .14;                                            // the horizon lies a little below the middle of the window
  vec2 sp = vec2(x - .2, y - .22); float ds = length(sp);
  vec3 col = mix(vec3(.9, .56, .3), vec3(.05, .24, .7), 1. - exp(-max(y, 0.)*3.4));
  col = mix(col, vec3(1., .42, .4), .4*exp(-max(y, 0.)*10.));               // a rose band on the horizon
  float cy = max(y, .03);
  vec2 cuv = vec2(x/cy, 1./cy)*vec2(.55, .3) + vec2(uTime*.012, 0.);
  float cl = smoothstep(.48, .78, .62*vnz(cuv*2.) + .38*vnz(cuv*5.3 + 3.))*smoothstep(.04, .22, y)*(1. - smoothstep(1., 1.8, y));
  col = mix(col, mix(vec3(1.25, .86, .66), vec3(.62, .56, .76), smoothstep(.1, .7, y)), cl*.8);
  col += vec3(3., 2.1, 1.1)*exp(-ds*ds*190.) + vec3(.8, .42, .16)*exp(-ds*5.5)*.5;       // the sun and its glow
  float h1 = .05 + .1*vnz(vec2(x*2.6 + 4., 1.)) + .03*vnz(vec2(x*9., 2.));  // two ranges of far hills
  float h2 = .015 + .06*vnz(vec2(x*4.4 + 9., 5.));
  col = mix(col, vec3(.26, .27, .52), (1. - smoothstep(h1 - .006, h1 + .006, y))*.9);
  col = mix(col, vec3(.07, .13, .3), 1. - smoothstep(h2 - .006, h2 + .006, y));
  if (y < 0.) {                                                            // the sea, a path of glitter under the sun
    float dep = 1./max(-y, .012);
    vec3 sea = mix(vec3(.6, .4, .32), vec3(.015, .2, .34), smoothstep(0., .3, -y));
    float gl = pow(vnz(vec2(x*dep*5., dep*7. - uTime*.7)), 5.)*exp(-sp.x*sp.x/(.012 + .5*y*y));
    col = sea*(.85 + .3*vnz(vec2(x*dep*2., dep*3. + uTime*.3))) + vec3(2.4, 1.7, .9)*gl;
  }
  col *= 1. - .2*r*r;
  col += uRim*pow(r, 14.)*1.1;                                             // light inside the rim, like the opening's own
  gl_FragColor = vec4(col*uDim, 1.);
}` }));
    vista.matrixAutoUpdate = false; vista.matrix.makeBasis(ringX, ringUp, ringN.clone().negate()).setPosition(ringC.clone().addScaledVector(ringN, -0.12));
    vista.frustumCulled = false; vista.renderOrder = 4; vista.name = 'hoop-window'; scene.add(vista);
    await ctx.yield();

    // ---------- our own kite. It waits whole in the air just beyond the entry, its line running back past us; as the
    // launching run begins it tips forward and slides over our head, and from then on we hang under it: it is held just
    // above the top edge of the frame and only its line shows. Everything carried hangs under the one group `kite`.
    const kiteMat = mkMat(PROP_VERT, PROP_FRAG, { uFlut: { value: 9 }, uAmp: { value: 1 }, uGain: { value: night ? 0.9 : 1.0 }, uMoon: { value: new THREE.Color(...sc(hx(ourPaper[1]), 0.9)) } }, { side: THREE.DoubleSide });
    const kite = new THREE.Group(); kite.name = 'our-kite'; scene.add(kite);
    const body = new THREE.Group(); kite.add(body);
    const lineGrp = new THREE.Group(), LROLL = -0.25; kite.add(lineGrp);
    let ourLine = null, leadLine = null;
    {
      const g = makeGeo(), c1 = sc(hx(ourPaper[0]), 0.9), c2 = sc(hx(ourPaper[1]), 0.85), NA = 48, NB = 16, KO = [0, KY, KZT];
      // the rim of the diamond: two leading edges from the nose to the wing tips, two trailing edges on to the tail.
      // The border, the moon, the fibres, the creases, the spine and the bow are drawn in the fragment shader from the object position.
      const edge = (t) => [KW * t, KY + 0.08 * Math.abs(t), KZN + (KZT - KZN) * Math.abs(t)];
      const back = (t) => [KW * t, KY + 0.08 * Math.abs(t), KZT + (KZB - KZT) * (1 - Math.abs(t))];
      const toO = (q, k) => [q[0] + (KO[0] - q[0]) * k, q[1] + (KO[1] - q[1]) * k, q[2] + (KO[2] - q[2]) * k];
      const glow = (c, t, k = 1) => sc(c, k * (1.06 - 0.3 * t * t));                  // the tissue burns brightest along the spine
      const q4 = (a, b, c, d, ca, cb, cc, cd, wa, wb, wc, wd) => { g.tri(a, b, c, ca, wa, wb, wc, cb, cc); g.tri(a, c, d, ca, wa, wc, wd, cc, cd); };
      const FR = [0, 0.02, 0.055, 0.16, 0.42], AMP = [0.012, 0.018, 0.024, 0.04, 0.06], PH = [0, 0.3, 0.6, 1.5, 2.6];
      const wv = (t, r, tr = 1) => [AMP[r], t * 7 + PH[r], tr];      // the ripple is a function of place, so the tissue never tears
      for (let k = 0; k < NA; k++) {
        const t0 = -1 + 2 * k / NA, t1 = -1 + 2 * (k + 1) / NA, e0 = edge(t0), e1 = edge(t1);
        for (let r = 0; r < 4; r++) q4(toO(e0, FR[r]), toO(e1, FR[r]), toO(e1, FR[r + 1]), toO(e0, FR[r + 1]), glow(c1, t0), glow(c1, t1), glow(c1, t1), glow(c1, t0), wv(t0, r), wv(t1, r), wv(t1, r + 1), wv(t0, r + 1));
        g.tri(toO(e0, FR[4]), toO(e1, FR[4]), KO, glow(c1, t0, 0.92), wv(t0, 4), wv(t1, 4), [0, 0, 1], glow(c1, t1, 0.92), sc(c1, 0.8));
      }
      for (let k = 0; k < NB; k++) {
        const t0 = -1 + 2 * k / NB, t1 = -1 + 2 * (k + 1) / NB, b0 = back(t0), b1 = back(t1);
        q4(b0, b1, toO(b1, 0.45), toO(b0, 0.45), glow(c1, t0), glow(c1, t1), glow(c1, t1), glow(c1, t0), wv(t0, 3), wv(t1, 3), wv(t1, 4), wv(t0, 4));
        g.tri(toO(b0, 0.45), toO(b1, 0.45), KO, glow(c1, t0, 0.92), wv(t0, 4), wv(t1, 4), [0, 0, 1], glow(c1, t1, 0.92), sc(c1, 0.8));
      }
      const nCanopy = g.triangles * 3;
      for (const sgn of [-1, 1]) {                                   // a banded paper tail from each wing tip, streaming back: behind us once we ride
        const a = edge(sgn), NS = 28, cph = Math.cos(0.9), sph = Math.sin(0.9); let prev = null;
        for (let k = 0; k <= NS; k++) {
          const f = k / NS, x = a[0] + sgn * (0.12 * f + 0.1 * Math.sin(f * 7)), z = a[2] + 2.7 * f, w = mix(0.06, 0.035, f);
          const wvv = [0.03 + 0.28 * f, -f * 12 + sgn, 0.8], cur = [[x - cph * w, a[1] - sph * w, z], [x + cph * w, a[1] + sph * w, z], wvv];
          if (prev) g.quad(prev[0], prev[1], cur[1], cur[0], sc(Math.floor((k - 1) / 4) % 2 ? c2 : c1, 0.95), prev[2], wvv);
          prev = cur;
        }
      }
      const kgeo = g.build();
      { const pa = kgeo.attributes.position, na = kgeo.attributes.normal;        // one smooth sheet of tissue, not facets
        for (let q = 0; q < nCanopy; q++) { const nx = -0.092 * pa.getX(q), l = Math.hypot(nx, 1); na.setXYZ(q, nx / l, -1 / l, 0); } }
      const km = new THREE.Mesh(kgeo, kiteMat); km.frustumCulled = false; body.add(km);
      // the line: a unit ribbon. One runs from the kite back past us while it flies ahead; the other is the short length
      // seen at the lower left once we ride, paid out to the crossing for the duel
      const lg = new THREE.BufferGeometry(), LS = 12, lp = [], li = [];
      for (let k = 0; k <= LS; k++) { lp.push(-1, 0, -k / LS, 1, 0, -k / LS); if (k < LS) { const q = k * 2; li.push(q, q + 1, q + 2, q + 1, q + 3, q + 2); } }
      lg.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3)); lg.setIndex(li);
      const lineMat = new THREE.ShaderMaterial({ uniforms: { uPx: LU.uPx, uTime: LU.uTime, uCol: { value: new THREE.Color(1.25, 0.3, 0.68).multiplyScalar(night ? 0.6 : 1) } }, side: THREE.DoubleSide, fog: false,
        vertexShader: /* glsl */`
uniform float uPx, uTime;
varying float vS; varying float vSide;
void main(){
  float s = -position.z;
  vec4 mv = modelViewMatrix*vec4(0., 0., position.z, 1.);
  vec3 T = normalize((modelViewMatrix*vec4(0., 0., -1., 0.)).xyz + vec3(0., 0., -1e-6));
  float dist = max(length(mv.xyz), 1e-3);
  vec3 sd = normalize(cross(T, mv.xyz) + vec3(1e-6, 0., 0.));
  mv.xyz += sd*position.x*max(.0024, .8*dist*uPx);
  mv.x += sin(uTime*27. + s*11.)*.0018*s;
  vS = dist; vSide = position.x;
  gl_Position = projectionMatrix*mv;
}`,
        fragmentShader: /* glsl */`
uniform vec3 uCol; uniform float uTime;
varying float vS; varying float vSide;
void main(){
  float g = pow(max(sin(vS*4.6 - uTime*2.3), 0.), 28.) + .5*pow(max(sin(vS*21. + uTime*3.1), 0.), 50.);
  gl_FragColor = vec4(uCol*(.7 + .3*(1. - abs(vSide))) + vec3(1., .96, .9)*g*2.4, 1.);
}` });
      ourLine = new THREE.Mesh(lg, lineMat); ourLine.frustumCulled = false; ourLine.position.set(0, -0.575, -0.4); ourLine.rotation.x = -0.0749; ourLine.scale.z = 0.02; lineGrp.add(ourLine);
      lineGrp.rotation.z = LROLL;
      leadLine = new THREE.Mesh(lg, lineMat); leadLine.frustumCulled = false; kite.add(leadLine);
    }

    await ctx.yield();

    // ---------- the rival: a great kite with a crescent moon on it, and the glass-coated line it saws ours with.
    // Its face is drawn in the shader from the face coordinates (moon, border, bamboo spine and bow, fibres), with the
    // same stained-glass transmission as every kite of the sky; a fringed tassel and a six-band ribbon tail hang from it.
    const rival = new THREE.Group(); rival.name = 'rival'; rival.visible = false; scene.add(rival);
    {
      const rp = [], rn = [], ruv = [], rt_ = [];
      const rtri = (a, b, c, part, ta = 0, tb = 0, tc = 0) => {
        const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
        let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
        if (nz < 0) { nx = -nx; ny = -ny; nz = -nz; }
        for (const [v, t] of [[a, ta], [b, tb], [c, tc]]) { rp.push(v[0], v[1], v[2]); rn.push(nx, ny, nz); ruv.push(v[0], v[1], part); rt_.push(t); }
      };
      const Nn = [0, 1, 0], Ss = [0, -1, 0], Cn = [0, 0.18, 0.06], E = [0.95, 0.2, -0.2], Ww = [-0.95, 0.2, -0.2];
      rtri(Nn, Ww, Cn, 0); rtri(Ww, Ss, Cn, 0); rtri(Nn, Cn, E, 0); rtri(Cn, Ss, E, 0);
      rtri([0, -0.82, 0], [-0.27, -1.3, 0], [0.27, -1.3, 0], 1);
      for (let k = 0; k < 6; k++) {
        const t0 = k / 6, t1 = (k + 1) / 6, y0 = -1.12 - t0 * 3.3, y1 = -1.12 - t1 * 3.3, w0 = 0.085 - 0.04 * t0, w1 = 0.085 - 0.04 * t1;
        rtri([-w0, y0, 0], [w0, y0, 0], [w1, y1, 0], 2, t0, t0, t1); rtri([-w0, y0, 0], [w1, y1, 0], [-w1, y1, 0], 2, t0, t1, t1);
      }
      const rg = new THREE.BufferGeometry();
      rg.setAttribute('position', new THREE.Float32BufferAttribute(rp, 3)); rg.setAttribute('normal', new THREE.Float32BufferAttribute(rn, 3));
      rg.setAttribute('aUv', new THREE.Float32BufferAttribute(ruv, 3)); rg.setAttribute('aT', new THREE.Float32BufferAttribute(rt_, 1));
      const m = new THREE.Mesh(rg, mkMat(RIVAL_VERT, RIVAL_FRAG, { uC1: { value: new THREE.Color(rivalPaper[0]) }, uC2: { value: new THREE.Color(rivalPaper[1]) } }, { side: THREE.DoubleSide }));
      m.frustumCulled = false; rival.add(m);
    }
    const RSEG = 16, rlPos = new Float32Array((RSEG + 1) * 6), rlGeo = new THREE.BufferGeometry();
    { const idx = []; for (let k = 0; k < RSEG; k++) { const a = k * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
      rlGeo.setAttribute('position', new THREE.BufferAttribute(rlPos, 3)); rlGeo.setIndex(idx); }
    const rivalLine = new THREE.Mesh(rlGeo, new THREE.MeshBasicMaterial({ color: new THREE.Color(1.05, 1.02, 0.94).lerp(hemiSky, 0.4 * night).multiplyScalar(mix(1, 0.6, night)), side: THREE.DoubleSide, transparent: true, opacity: 1, depthWrite: false, fog: false }));
    rivalLine.frustumCulled = false; rivalLine.visible = false; rivalLine.renderOrder = 5; scene.add(rivalLine);

    await ctx.yield();

    // ---------- every frame
    const V = () => new THREE.Vector3();
    const cp = V(), tg = V(), fw = V(), rt = V(), camP = V(), cR = V(), cU = V(), cF = V(), K = V(), Cc = V(), Aw = V(), Mm = V(), a0 = V(), a1 = V(), a2 = V(), sd = V();
    const p0 = V(), q0 = new THREE.Quaternion(), qT = new THREE.Quaternion(), kv = V(), kb = V(), NEGZ = new THREE.Vector3(0, 0, -1), LA = new THREE.Vector3(-1.5, -1.9, 0.8);
    { const m0 = path.frameAt(0, new THREE.Matrix4()); p0.setFromMatrixPosition(m0); q0.setFromRotationMatrix(m0); }
    const uHov = uCut - 0.15, pathLen = path.length;
    let iris = 0;
    const bufSize = new THREE.Vector2();
    const uIn = uCut - 0.085, uSaw = uCut - 0.055;
    const linePt = (f, b, out) => {
      if (f < 0.25) out.lerpVectors(K, Mm, f / 0.25); else { const g = (f - 0.25) / 0.75; out.lerpVectors(Mm, Aw, g); out.y -= 9 * 4 * g * (1 - g) * (1 - 0.5 * b); }
      return out;
    };
    function update(dt, time, camera, u) {
      T.value = time; LU.uTime.value = time;
      camP.setFromMatrixPosition(camera.matrixWorld); LU.uCamP.value.copy(camP);
      ctx.renderer.getDrawingBufferSize(bufSize);
      LU.uPx.value = 2 / (Math.max(camera.projectionMatrix.elements[5], 0.05) * Math.max(bufSize.y, 1));
      hero.setProgress(heroU(u)); hero.update(dt, time, camera);
      if (look.gust) hero.uniforms.uGust.value = Math.max(hero.uniforms.uGust.value, 0.85);      // a stiff wind: the train and the pennants stream all the way
      // the roofs erupt when a kite is cut
      LU.uSurge.value = sstep(uCut - 0.003, uCut + 0.012, u) * (1 - (rare ? 0.45 : 1) * sstep(uCut + 0.06, uCut + (rare ? 0.4 : 0.16), u));
      const saw = sstep(uSaw, uSaw + 0.012, u) * (u < uCut ? 1 : 0), free = sstep(uCut, uCut + 0.02, u) * (1 - sstep(uSkim - 0.03, uSkim + 0.03, u));
      // our kite. Seen through the previous world's portal (u is 0) it is parked whole in the air beyond the entry, in the
      // frame of the path's start; once we are in, the same pose is carried with the camera, and over the launching run it
      // tips forward and slides over our head until only its nose shows at the top of the frame
      {
        const sK = sstep(0.014, 0.062, u), hov = 1 - sK;
        if (u > 0.0004) { kite.position.copy(camP); qT.setFromRotationMatrix(camera.matrixWorld); kite.quaternion.copy(q0).slerp(qT, sstep(0.0004, 0.012, u)); }
        else { kite.position.copy(p0); kite.quaternion.copy(q0); }
        // riding, the kite hangs just above the top edge of the picture whatever the field of view (a tall screen widens it):
        // a nose cut by the frame's edge in every view read as a fault to people who did not know we fly a kite
        const yRide = 1.34 / Math.max(camera.projectionMatrix.elements[5], 0.05);
        body.rotation.set(0.98 * hov, Math.sin(time * 1.7) * 0.03 + saw * Math.sin(time * 31) * 0.012,
          Math.sin(time * 1.3) * 0.022 + free * Math.sin(time * 2.1) * 0.075 + saw * Math.sin(time * 37) * 0.007 + hov * Math.sin(time * 0.9) * 0.14);
        kv.set(0, KY, KZT).applyEuler(body.rotation);
        body.position.set(hov * Math.sin(time * 0.7) * 0.3, mix(1.95, yRide, sK) + Math.sin(time * 1.9) * 0.012 + hov * Math.sin(time * 1.1) * 0.12 + saw * Math.sin(time * 43) * 0.008, mix(-6.4, KZT, sK)).sub(kv);
        kb.set(0, KY - 0.03, KZT - 0.3).applyEuler(body.rotation).add(body.position).sub(LA);
        const ll = kb.length(); leadLine.visible = sK < 0.995; leadLine.position.copy(LA); leadLine.quaternion.setFromUnitVectors(NEGZ, kb.multiplyScalar(1 / Math.max(ll, 1e-3))); leadLine.scale.z = ll;
        ourLine.scale.z = mix(mix(0.02, 1.2, sstep(0.05, 0.08, u)), 3.7, sstep(uIn - 0.035, uIn + 0.005, u));
        kiteMat.uniforms.uFlut.value = 9 + saw * 14 + free * 3;
        const whip = sat((u - uCut) / 0.012);
        lineGrp.visible = whip < 1; lineGrp.rotation.x = -whip * 1.3; lineGrp.position.y = -whip * 0.7; lineGrp.position.x = Math.sin(time * 31) * 0.01 * saw;
      }
      // the cut kite that settles on the terrace where we come down
      { const f = sstep(uLand - 0.12, uLand, u), lf = 1 - f;
        cutKite.position.set(mix(388, cutLand.x, f) + Math.sin(time * 0.9) * 1.4 * lf, mix(47, cutLand.y, f) + Math.sin(time * 1.3) * 0.7 * lf, mix(6, cutLand.z, f) + Math.sin(time * 0.7 + 1) * 3 * lf * (0.3 + f));
        cutKite.rotation.set(0.14 + lf * (0.45 + 0.3 * Math.sin(time * 1.1)), 0.7 + lf * Math.sin(time * 0.5) * 1.2, -0.42 * f + lf * 0.5 * Math.sin(time * 0.8), 'YXZ'); }
      // the window in the hoop irises open on the engine's own picture of the next world once that is showing
      { const irisT = ctx.portalView && ctx.portalView.live ? 1 - sstep(170, 215, (1 - u) * pathLen) : 0;
        iris = dt > 0 ? iris + Math.max(-dt * 1.6, Math.min(dt * 1.6, irisT - iris)) : irisT;
        vista.visible = iris < 0.999; vistaU.uIris.value = iris; }
      // the rival slides in from the left, stoops, saws, wins and rears away
      const rfade = sstep(uHov - 0.004, uHov + 0.012, u) * (1 - sstep(uCut + 0.04, uCut + 0.06, u)), rOn = rfade > 0.002;
      rival.visible = rOn; rivalLine.visible = rOn; rivalLine.material.opacity = 1 - sstep(uCut + 0.006, uCut + 0.022, u); sparks.object.visible = saw > 0.01;
      const duelK = sstep(uHov - 0.01, uHov + 0.01, u) * (1 - sstep(uCut + 0.03, uCut + 0.05, u));
      lineU.uAFloor.value = aFloor0 * (1 - 0.5 * duelK); lineU.uBigA.value = bigA0 * (1 - 0.45 * duelK);            // the two duelling lines are the brightest in the sky
      if (rOn) {
        const a = sstep(uIn, uSaw, u), ah = sstep(uHov, uHov + 0.035, u), hv = ah * (1 - a), won = sstep(uCut, uCut + 0.05, u), sw = u >= uSaw && u < uCut ? 1 : 0;
        path.pointAt(u, cp); path.tangentAt(u, tg); fw.set(tg.x, 0, tg.z).normalize(); rt.set(-fw.z, 0, fw.x);
        // placed in the camera's own frame, so it is in the picture whatever the gaze is doing
        cR.setFromMatrixColumn(camera.matrixWorld, 0); cU.setFromMatrixColumn(camera.matrixWorld, 1); cF.setFromMatrixColumn(camera.matrixWorld, 2);
        const sx = sw * Math.sin(time * 5.2), sy = sw * Math.sin(time * 3.1);
        // it slides in from the left and hangs there weaving, a great kite at the left of the frame, before it stoops on our line
        K.copy(camP).addScaledVector(cF, -(mix(mix(30, 17, ah), 15, a) + won * 26)).addScaledVector(cR, mix(mix(-40, -8, ah), -3.5, a) + hv * Math.sin(time * 0.8) * 1.6 + sx * 1.6 - won * 7)
          .addScaledVector(cU, mix(mix(18, 2.6, ah), -1.5, a) - a * (1 - a) * 6 + hv * Math.sin(time * 1.3) * 0.8 + sy * 0.8 + won * 14);
        rival.position.copy(K); rival.lookAt(camP); rival.rotateZ(sx * 0.45 + (1 - ah) * 0.7 + hv * (0.2 + 0.22 * Math.sin(time * 1.1)) - won * Math.sin(time * 2.4) * 0.5);
        rival.scale.setScalar(Math.max(rfade, 0.01) * 2.0);
        const slide = sx * 0.3;                                      // the contact saws up and down our line, 13 degrees below the centre
        const yl = -0.8 - 0.0748 * slide;
        Cc.copy(camP).addScaledVector(cU, yl * Math.cos(LROLL)).addScaledVector(cF, -3.4 - 0.997 * slide).addScaledVector(cR, -yl * Math.sin(LROLL) + lineGrp.position.x);
        Aw.copy(cp).addScaledVector(fw, -150).addScaledVector(rt, 74); Aw.y = 13.5;
        const b = sstep(uSaw - 0.012, uSaw, u) * (1 - won);
        Mm.lerpVectors(K, Aw, 0.11); Mm.y -= 2; Mm.lerp(Cc, b);
        for (let k = 0; k <= RSEG; k++) {
          const f = k / RSEG; linePt(f, b, a0); linePt(Math.min(1, f + 0.02), b, a1); linePt(Math.max(0, f - 0.02), b, a2);
          a1.sub(a2); a2.subVectors(camP, a0); const dist = a2.length();
          sd.crossVectors(a1, a2).normalize().multiplyScalar(Math.max(0.009, 0.0024 * dist) * rfade);
          rlPos[k * 6] = a0.x - sd.x; rlPos[k * 6 + 1] = a0.y - sd.y; rlPos[k * 6 + 2] = a0.z - sd.z; rlPos[k * 6 + 3] = a0.x + sd.x; rlPos[k * 6 + 4] = a0.y + sd.y; rlPos[k * 6 + 5] = a0.z + sd.z;
        }
        rlGeo.attributes.position.needsUpdate = true;
        if (saw > 0.01) for (let q = 0; q < 8; q++) {                  // glass dust off the contact
          const ph = time * (3 + q * 0.7) + q * 2.1, r = 0.06 + 0.28 * (ph % 1);
          sparks.setPosition(q, Cc.x + Math.sin(q * 2.4 + time) * r, Cc.y - (ph % 1) * 0.35 + Math.cos(q * 1.7) * r * 0.4, Cc.z + Math.cos(q * 3.1 + time) * r);
        }
      }
      fauna.update(dt, time, camera, u); air.update(dt, time, camera); trees.update(dt, time, camera); kmats.update(dt, time);
      sky.update(dt, time, camera); rig.update(dt, time, null);
    }
    { const c0 = new THREE.PerspectiveCamera(62, ctx.aspect || 1.78, 0.3, 6000); path.pointAt(0, c0.position); c0.lookAt(60, 16, 4); c0.updateMatrixWorld(); update(0, 0, c0, 0); }
    await ctx.yield();
    await sky.prewarm(ctx.renderer, null, scene);

    return {
      scene, path, duration,
      // linger over the launch and the duel, hurry down the fall and the skim, and come up to the hoop unhurried
      pace: (u) => 0.75 + 0.1 * sstep(uClimb, uClimb + 0.08, u) - 0.23 * sstep(uDuel - 0.04, uDuel + 0.02, u) + 0.73 * sstep(uCut, uCut + 0.07, u) + 0.1 * sstep(uSkim - 0.04, uSkim + 0.02, u)
        - 0.2 * sstep(uMin, uMin + 0.06, u) - 0.25 * sstep(0.8, 0.9, u),
      title: look.title + (rare ? ': the Great Cut' : ''),
      ride: 'none',
      beats: { climb: uClimb, duel: uDuel, parakeets: uCut - 0.075, cut: uCut, skim: uSkim, burst: uBurst, minarets: uMin },   // where the scripted moments fall (for whoever takes screenshots)
      camera: { fov: 62, near: 0.3, far: 6000, lookAhead: 22, sway: 0.8, bank: 1.25 },
      pois: [
        { at: [ringC.x, ringC.y, ringC.z], from: 0, to: uClimb + 0.03, weight: 0.25, fade: 0.3 },            // the red arc and the ring over the roofline
        { at: [345, 34, -24], from: uClimb, to: uClimb + 0.07, weight: 0.4, fade: 0.25 },                   // keep the city in the climb
        { at: [410, 36, -175], from: uClimb + 0.045, to: uDuel + 0.004, weight: 0.6, fade: 0.3 },           // then half sunward: the ladder of seven dead ahead, its tissue burning, the sun itself just out of frame and the ring low on the right
        { at: [470, 0, 44], from: uDuel - 0.01, to: uCut + 0.015, weight: 0.42, fade: 0.2 },                 // the duel over the tiled city, the lanes running off askew
        { at: [ringC.x, ringC.y * 0.7, ringC.z], from: uCut + 0.012, to: uSkim, weight: 0.68, fade: 0.18 },    // the minarets, the train and the ring as we fall
        { at: [ringC.x, ringC.y, ringC.z], from: uSkim - 0.02, to: uMin + 0.03, weight: 0.3, fade: 0.25 },   // train and ring between the shafts
      ],
      portal: { shape: 'circle', radius: 7, color: look.portal, glow: 1.15, tilt: true, revealDistance: 300, blendDistance: 45 },
      post: {
        exposure: look.exposure,
        bloom: { strength: night ? 0.5 : 0.3, radius: 0.6, threshold: 0.95 },
        grade: { saturation: look.grade.saturation, contrast: 1.05, tint: look.grade.tint, shadowTint: look.grade.shadowTint, vignette: 0.26, grain: 0.02, aberration: 0 },
      },
      update,
      dispose() { sky.dispose?.(); hero.dispose?.(); tA.dispose(); tB.dispose(); },
    };
  },
};
