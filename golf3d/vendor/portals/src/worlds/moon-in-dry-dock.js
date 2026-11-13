// THE MOON IN DRY DOCK. On a bright morning in an ochre harbour town the Moon is laid up in the graving dock
// like a ship, cradled in scaffolding and being re-silvered, its spare crescents stacked on the quay. We fly
// down an arcaded street, out over the crescents, along its chalk flank and across the wet seam into mirror,
// see it slipped from its ropes, and leave beneath it as it lifts, out between the dock gates to sea.
//
// World space is the brief's: +Z the exit course (out to sea), quay level y 0, dock floor y -30, sea y -27,
// Moon centre (0, 98, 0). The hero (src/parts/moon-in-dry-dock.js) sits at (0, -30, 0) and shades itself; every
// material here is lit by the same analytic key / sky fill / ground bounce (no scene lights at all).
import * as THREE from 'three';
import { makePath, makeRng } from '../kit/core.js';
import { makeSky } from '../kit/sky.js';
import * as F from '../kit/fauna.js';
import { makeParticles } from '../kit/fx.js';
import { buildHero } from '../parts/moon-in-dry-dock.js';

const TAU = Math.PI * 2;
const sat = (x) => Math.min(1, Math.max(0, x));
const sstep = (a, b, x) => { const t = sat((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const BAY = 3.5, ST_Z = 20, ST_X0 = 352, ST_X1 = 485;      // arcade bay, street axis, street ends
const B_X = 136, B_Z0 = -140, B_Z1 = 154, STEP = 1.2;       // dock basin at floor level; each 6 m altar steps back 1.2 m
const GW = 17;                                              // half-width of the gateway (a little wider than the brief's 30 m: the boats beyond show whole between the ring and the leaves)
const QUAY_X0 = -230, QUAY_Z1 = 175;                        // the sea begins beyond these

// ------------------------------------------------------------------------------------------------ GLSL
const STUFF_VERT = /* glsl */`
#include <common>
#include <fog_pars_vertex>
attribute vec3 color; attribute vec4 aM; attribute vec3 aW;
varying vec3 vCol, vN, vP, vW; varying vec4 vM;
void main(){
  vCol = color; vN = normal; vP = position; vM = aM; vW = aW;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

// shadows the town and the dock cast on themselves, worked out analytically (shared by several materials)
const GL_SHADE = /* glsl */`
uniform sampler2D uRoofTex;      // street x 340..500 -> r: south row roof height / 32, g: north row
uniform vec4 uCres[8];           // spare crescents: centre x, z, half length, half width
uniform vec4 uHang;              // the swinging crescent's shadow: centre x, z, cos, sin of its yaw (w > 5 = none)
uniform float uHangOn;
float archOpen(float x, float h){
  float xl = (fract((x - ${ST_X0.toFixed(1)}) / ${BAY.toFixed(1)}) - .5) * ${BAY.toFixed(1)};
  float top = 3.2 + sqrt(max(1.96 - xl * xl, 0.));
  return step(abs(xl), 1.4) * step(h, top);
}
float townSun(vec3 p){
  if (p.x < 346. || p.x > 492. || abs(p.z - ${ST_Z.toFixed(1)}) > 10.6 || p.y > 24.) return 1.;
  float sz = abs(uSunDir.z) > 2e-3 ? uSunDir.z : 2e-3;
  float zNear = sz < 0. ? 26.5 : 13.5, zFar = sz < 0. ? 13.5 : 26.5;
  float lit = 1.;
  float side = sz < 0. ? p.z - 26.52 : 13.48 - p.z;
  if (side > 0.) { float t = (zNear - p.z) / sz; lit = archOpen(p.x + uSunDir.x * t, p.y + uSunDir.y * t); }
  float inFar = sz < 0. ? 13.48 - p.z : p.z - 26.52;
  if (inFar > 0.) return 0.;
  float t2 = (zFar - p.z) / sz;
  float h = p.y + uSunDir.y * t2, x = p.x + uSunDir.x * t2;
  vec4 rt = texture2D(uRoofTex, vec2(clamp((x - 340.) / 160., 0., 1.), .5));
  float rh = (sz < 0. ? rt.r : rt.g) * 32.;
  return lit * (1. - smoothstep(-.5, .5, rh - h));
}
float chanSun(vec3 p){
  float sx = abs(uSunDir.x) > 1e-3 ? uSunDir.x : 1e-3;
  float t = (${GW.toFixed(1)} * sign(sx) - p.x) / sx;
  float h = p.y + uSunDir.y * t, z = p.z + uSunDir.z * t;
  float top = (z > 159. && z < 175.) ? 4. : .4;
  float open = min(step(175.5, z) + step(z, 153.), 1.);
  return max(smoothstep(-.7, .7, h - top), open);
}
float basinSun(vec3 p){
  if (abs(p.x) < ${(GW - 0.1).toFixed(1)} && p.z > 154.5 && p.z < 176. && p.y < 4.2) return chanSun(p);
  if (p.y > -.4 || abs(p.x) > 141.2 || p.z < -145.2 || p.z > 176.) return 1.;
  float t = -p.y / max(uSunDir.y, .03);
  vec2 q = p.xz + uSunDir.xz * t;
  float d = min(140.8 - abs(q.x), min(q.y + 144.8, 158.8 - q.y));
  float gate = step(abs(q.x), ${GW.toFixed(1)}) * step(150., q.y);
  return max(smoothstep(-1.2, 1.2, d), gate);
}
float quaySun(vec3 p){
  float s = 1.;
  if (p.y > 3. || p.x < 120. || p.x > 360.) return s;
  vec2 off = uSunDir.xz * (7. - p.y) / max(uSunDir.y, .08);
  for (int i = 0; i < 8; i++) {
    vec4 c = uCres[i];
    vec2 q = (p.xz + off - c.xy) / max(abs(c.zw), vec2(1.));
    q.y -= .35 * sign(c.w) * (1. - q.x * q.x);
    s *= 1. - .82 * (1. - smoothstep(.55, 1.1, dot(q, q)));
  }
  return s;
}
float hangSun(vec3 p){
  vec2 off = uSunDir.xz * (52. - p.y) / max(uSunDir.y, .08);
  vec2 d = p.xz + off - uHang.xy;
  vec2 q = vec2(d.x * uHang.z + d.y * uHang.w, -d.x * uHang.w + d.y * uHang.z) / vec2(75., 15.);
  q.y -= .5 * (1. - q.x * q.x);
  return 1. - .8 * uHangOn * (1. - smoothstep(.6, 1.1, dot(q, q)));
}
`;

const stuffFrag = (glsl) => /* glsl */`
#include <common>
#include <fog_pars_fragment>
uniform float uTime, uWet, uNight;
uniform vec3 uShutA, uShutB, uPud, uChalkC, uLamp, uHorC, uZenC, uWallC;
varying vec3 vCol, vN, vP, vW; varying vec4 vM;
${glsl.noise}
${glsl.light}
${GL_SHADE}
#define PLANT_ONE .09
#define PLANT_W 2.
#define PLANT_ROWS 4
void main(){
  vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n;
  vec3 p = vP; vec3 pL = p + vec3(0., 30., 0.);
  vec3 toCam = cameraPosition - p; float dist = length(toCam); vec3 V = toCam / max(dist, 1e-3);
  float k = vM.x, sd = vM.y;
  vec3 alb = vCol; vec3 emis = vec3(0.); float gloss = 0.; float sun = 1.; float spark = 1.; float rakeW = 0.; float stPud = 0.;
  float fine = 1. - smoothstep(30., 110., dist);          // fine pattern fades to its mean with distance
  if (k < .5) {
    // ---- plaster wall with windows, shutters, sills and string courses
    float W = max(vW.x, 1.), H = vW.y, u = vM.z, v = vM.w;
    float nW = max(1., floor(W / 3.1)), cw = W / nW;
    float ci = floor(u / cw), cu = (fract(u / cw) - .5) * cw;
    float fl = floor(v / 3.5), cv = v - fl * 3.5 - 1.8;
    float fits = step((fl + 1.) * 3.5, H + .6) * step(0., v);
    float wh = hash13(vec3(ci, fl, floor(fract(sd) * 97.)));
    alb *= .84 + .24 * fbm3(vec3(u * .33, v * .33, fract(sd) * 50.));
    alb *= 1. - .2 * smoothstep(.45, .85, vnoise(vec3(u * 1.7, v * .13, fract(sd) * 31.))) * fine;
    float sc = 1. - smoothstep(.08, .12, abs(v - fl * 3.5 - .1));
    alb = mix(alb, vCol * 1.12 + .03, sc * .55 * step(.5, fl) * step(0., v));
    alb *= mix(.7, 1., smoothstep(-.3, 1.4, v + 3. * step(.5, fl)));
    vec3 wallA = alb;
    if (fits > .5 && (wh > .07 || sd > 1.5) && dist < 700.) {
      float ax = abs(cu), ay = abs(cv);
      float open = sd > 1.5 ? 2. : step(.28, wh);
      float inWin = step(ax, .55) * step(ay, .9);
      float shut = step(.55, ax) * step(ax, 1.08) * step(ay, .93) * (open > .5 && open < 1.5 ? 1. : 0.) + inWin * (1. - min(open, 1.));
      float sill = step(ax, .8) * step(-1.08, cv) * step(cv, -.92);
      vec3 shc = (fract(sd * 7.3) < .5 ? uShutA : uShutB) * (.75 + .5 * fract(wh * 13.));
      if (shut > .5) {
        alb = shc * mix(.8, .66 + .34 * step(.38, fract(cv * 7.)), fine) * (1. - .5 * step(abs(ax - (open > .5 ? .815 : .01)), .03));
      } else if (inWin > .5) {
        float frame = 1. - step(ax, .47) * step(ay, .82);
        float mull = step(ax, .03) + step(abs(cv - .15), .03);
        if (frame + mull > .5) alb = vec3(.6, .58, .52);
        else {
          alb = vec3(.025, .035, .045); sun = 0.;
          vec3 r = reflect(-V, n);
          emis = mix(uHorC, uZenC, clamp(r.y * 1.5 + .3, 0., 1.)) * (.1 + .25 * smoothstep(-.9, .7, cv - ax));
          emis += vec3(1.4, .8, .32) * uNight * step(.5, fract(wh * 31.)) * (.6 + .4 * vnoise(vec3(u * 3., v * 3., 1.)));
        }
        alb *= .55 + .45 * smoothstep(.9, .55, cv);
      } else if (sill > .5) alb = vec3(.62, .6, .54);
      else alb *= 1. - .3 * step(ax, .8) * step(-1.5, cv) * step(cv, -1.08) * fine;      // the sill's shadow and drip
      float wf = smoothstep(300., 650., dist);
      alb = mix(alb, wallA * .93, wf); emis *= 1. - wf * (1. - uNight); sun = mix(sun, 1., wf);
    }
  } else if (k < 1.5) {
    // ---- pantile roof (u along the eaves, v down the slope)
    float tu = vM.z / .3, tv = vM.w / .44;
    float h = hash13(vec3(floor(tu), floor(tv), floor(fract(sd) * 77.)));
    float barrel = abs(fract(tu) - .5) * 2.;
    float pat = (.6 + .5 * h) * (.5 + .5 * (1. - barrel * barrel)) * (.78 + .22 * smoothstep(0., .25, fract(tv)));
    alb *= mix(.74, pat, fine) * (.8 + .4 * fbm3(vec3(vM.z * .2, vM.w * .2, fract(sd) * 20.)));
    alb = mix(alb, vec3(.3, .31, .22), smoothstep(.6, .85, fbm3(vec3(vM.z * .35, vM.w * .35, fract(sd) * 9.))) * .4);
  } else if (k < 2.5) {
    // ---- coursed stone: dock altars, piers, columns, sea walls
    float flt = step(.7, abs(n.y));
    vec3 tg = flt > .5 ? vec3(1., 0., 0.) : normalize(vec3(n.z, 0., -n.x) + vec3(1e-5, 0., 0.));
    float su = dot(p, tg), sv = flt > .5 ? p.z : p.y;
    // large quiet ashlar: courses of unequal height, blocks of unequal length, fine pale joints, an even tone
    float cy = sv / 1.12 + .17 * sin(sv * 1.83 + 1.3) + .07 * sin(sv * 4.1);
    float crs = floor(cy), ch = hash13(vec3(crs, 5., flt));
    float bl = 2.3 + 1.5 * ch;
    float cx = su / bl + ch * 7.3;
    vec2 f = abs(vec2(fract(cx), fract(cy)) - .5); float h = hash13(vec3(floor(cx), crs, 3. + flt));
    float far2 = 1. - smoothstep(70., 260., dist);
    float jw = .028 + dist * .0011;
    float jd = min((.5 - f.x) * bl, (.5 - f.y) * 1.1);
    float joint = 1. - smoothstep(jw * .5, jw, jd);                       // 1 in the joint
    alb *= (.95 + .08 * h * far2) * (.84 + .3 * fbm3(p * .09));
    alb *= 1. - .1 * (1. - smoothstep(jw, jw * 4., jd)) * far2;             // each block's arris, a little worn
    alb = mix(alb, alb * 1.22 + .025, joint * .55 * far2);                 // lime in the joints
    alb *= mix(1., .78 + .22 * smoothstep(0., 2.2, vM.w), (1. - flt) * step(vM.w, 40.));          // grime at the foot of each riser
    float inB = step(p.y, -.3) * (1. - flt) * step(abs(p.x), 142.5) * step(p.z, 161.5);
    float yk = fract((p.y + 30.) / 6.);
    float nose = inB * smoothstep(.56, .86, yk);                             // the shadow each nosing throws down its riser
    alb *= mix(vec3(1.), vec3(.74, .8, .95), nose) * mix(1., 1.12 - .14 * yk, inB);
    sun *= 1. - nose;
    rakeW = (1. - flt) * step(.5, -n.z) * step(150., p.z) * step(p.z, 176.5) * step(abs(p.x), 142.5);
    alb = mix(alb, alb * vec3(.84, .92, .88), smoothstep(.5, .75, vnoise(vec3(su * .09, sv * .22, 11.))) * .5);
    alb *= 1. - .2 * smoothstep(.5, .8, vnoise(vec3(su * .7, sv * .07, 3.))) * (1. - flt);
    // the tide's mark: the bottom fifth of every wall in the basin stained dark, green-black with weed, ragged along its top
    float tideY = p.y + 24.7 + 2. * (vnoise(vec3(su * .21, 3., 9.)) - .5) + .7 * (vnoise(vec3(su * 1.4, sv * .4, 2.)) - .5);
    float damp = (1. - flt) * (1. - smoothstep(-.9, .5, tideY)) * step(p.y, -16.);
    alb = mix(alb, alb * vec3(.46, .56, .5), damp * .8);
    float weed = smoothstep(.5, .72, vnoise(vec3(su * 1.7, sv * .2, 7.)) * .75 + .25 * vnoise(vec3(su * 6., sv * 1.2, 3.)) + .22 * smoothstep(-3.2, -.4, tideY));      // bladderwrack hanging in strands under the line
    alb = mix(alb, vec3(.05, .085, .05) * (.7 + .6 * vnoise(vec3(su * 3., sv * 3., 1.))), weed * damp * .7);
    alb = mix(alb, alb * vec3(.8, .9, .76), (1. - flt) * smoothstep(1.6, 0., tideY) * smoothstep(-1.2, .2, tideY) * .5 * step(p.y, -16.));   // the paler rime just above it
    // p2 WALL PLANTS: valerian and samphire rooted in the bed joints of the basin's walls above the tide's mark. A rule of the masonry alone: one
    // block in PLANT_ONE of every course carries a clump rooted in the bed joint under it, somewhere along its length; the clump is a low crown over the
    // joint and a ragged hanging mass below it, PLANT_W wide, grey-green, the valerian with rose heads; it stays on its own lift of the wall and throws
    // a small crisp shadow on the stone where the sun reaches. It reads the wall's own coordinates (su, sv, the courses and their blocks) and the
    // tide's mark; nothing of the lens, the distance or the flight.
    if (inB > .5 && tideY > 2.) {
      float pl = 0., shd = 0.; vec3 pc = vec3(0.);
      float sOff = .3 * sign(dot(uSunDir, tg)), lift = floor((sv + 30.) / 6.);
      for (int r = 0; r <= PLANT_ROWS; r++) {
        float cr = crs + float(r), chR = hash13(vec3(cr, 5., 0.)), blR = 2.3 + 1.5 * chR, cxR = su / blR + chR * 7.3;
        float dn = (float(r) - fract(cy)) * 1.12;                                 // metres below the bed joint under that course
        if (floor((sv + dn + 30.) / 6.) != lift) continue;
        for (int q = -1; q <= 1; q++) {
          float id = floor(cxR) + float(q); vec3 hp = hash33(vec3(id, cr, 23.));
          if (hp.x > PLANT_ONE) continue;
          float wd = PLANT_W * (1. + 1.2 * hp.y), len = wd * (.55 + .4 * hp.z);    // its width, how far it hangs
          float dx = su - (id + .25 + .5 * hp.z - chR * 7.3) * blR;                // metres along the wall from its root
          float rag = .62 + .38 * sin(dx * 9. / PLANT_W + hp.z * 40.) * sin(dx * 23. / PLANT_W + hp.y * 30.);      // the strands hang to unequal lengths
          vec2 a1 = vec2(dx, dn), a2 = a1 + vec2(sOff, -.34) * PLANT_W;
          float X1 = a1.x / (.5 * wd) * (1. + .2 * sin(a1.y * 8. / PLANT_W + hp.y * 50.)), Y1 = a1.y > 0. ? a1.y / (len * rag) : -a1.y / (.2 * wd);
          float X2 = a2.x / (.5 * wd), Y2 = a2.y > 0. ? a2.y / (len * rag) : -a2.y / (.2 * wd);
          shd = max(shd, step(X2 * X2 + Y2, 1.));
          if (X1 * X1 + Y1 < 1.) {
            float val = step(fract(hp.y * 7.), .7);                                // seven in ten are valerian, the rest samphire
            vec3 leaf = mix(vec3(.17, .235, .125), vec3(.1, .17, .07), val) * (.7 + .6 * vnoise(vec3(su * 2.7, sv * 2.7, 5.) / PLANT_W)) * mix(1.15, .7, clamp(a1.y / len, 0., 1.));
            vec2 hc = a1 / (.3 * PLANT_W); float hh = hash13(vec3(floor(hc) + hp.yz * 91., id));
            float hr = length(fract(hc) - .5 - (vec2(fract(hh * 7.), fract(hh * 13.)) - .5) * .36);
            float head = val * step(.5, hh) * step(hr, .28) * step(a1.y, len * .45);     // rose heads over the crown and the upper half
            pc = mix(leaf, vec3(.64, .25, .19) * (.85 + .3 * fract(hh * 29.)), head); pl = 1.;
          }
        }
      }
      alb = mix(alb, pc, pl);
      sun *= 1. - .8 * shd * (1. - pl);
    }
    bool sea = abs(p.x) > 141.5 || p.z > 174.5;
    if (sea) {
      float tide = p.y + 23.6 + 1.1 * vnoise(vec3(su * .25, 2., 5.)) + .15 * sin(su * 1.4 + uTime * 1.3);
      alb = mix(alb, vec3(.03, .035, .022) * (.6 + .8 * vnoise(vec3(su * 2., sv * 2. + sin(uTime * .8 + su) * .15, 1.))), smoothstep(.4, -.3, tide));
      alb = mix(alb, alb * 1.25 + .05, smoothstep(1.4, .5, tide) * smoothstep(.2, .6, tide) * .5);
    }
  } else if (k < 3.5) {
    // ---- ground: street cobbles with a runnel, quay slabs and rails, the dock floor
    if (p.y < -20.) {
      vec2 fl = p.xz / vec2(1.6, 3.2); fl.x += .5 * floor(fl.y);
      vec2 ff = abs(fract(fl) - .5);
      alb *= .6 + .34 * vnoise(vec3(p.xz * .1, 1.)) + .32 * hash13(vec3(floor(fl), 6.));
      float jwF = clamp(dist * .0035, .05, .17);                               // joints widen with distance, so the paving still reads from the far end
      alb *= .56 + .44 * smoothstep(.5, .5 - jwF, max(ff.x, ff.y));
      float dWall = min(min(${B_X.toFixed(1)} - abs(p.x), p.z - (${B_Z0.toFixed(1)})), ${B_Z1.toFixed(1)} - p.z);
      float dampF = 1. - smoothstep(1.5, 9., dWall + 4. * (vnoise(vec3(p.xz * .22, 3.)) - .5));
      alb = mix(alb, alb * vec3(.5, .6, .52), dampF * .8);                     // the foot of the walls stays dark and damp, a little green
      alb *= 1. - .3 * smoothstep(.55, .8, vnoise(vec3(p.x * .05, p.z * .5, 7.)));
      alb *= .9 + .2 * vnoise(vec3(p.xz * 1.3, 2.)) * fine;
      alb = mix(alb, uChalkC * .52, smoothstep(.5, .78, fbm3(vec3(p.xz * .05, 4.)) + .1 * vnoise(vec3(p.xz * .6, 1.))) * .75);
      float pudN = fbm3(vec3(p.xz * .055, 9.));
      // dry mornings: soft cream drifts of chalk swept against the slabs; after rain: flat puddles that hold the sky
      alb = mix(alb, uChalkC * (.5 + .1 * vnoise(vec3(p.xz * .9, 5.))), smoothstep(.56, .72, pudN + .05 * vnoise(vec3(p.xz * .7, 2.))) * .8 * (1. - uWet));
      gloss = smoothstep(.6, .64, pudN) * uWet; spark = .0;
      float rl = abs(abs(p.x) - 9.); float rw = max(.07, dist * .0016);
      float rail = 1. - smoothstep(rw, rw * 1.7, rl);
      alb = mix(alb, vec3(.16, .15, .15), rail * (1. - gloss));
    } else if (p.x > 346. && abs(p.z - ${ST_Z.toFixed(1)}) < 6.5) {
      vec2 c = p.xz / vec2(.3, .22); c.x += .5 * floor(c.y);
      vec2 f = abs(fract(c) - .5); float h = hash13(vec3(floor(c), 2.));
      float mort = smoothstep(.5, .34, max(f.x, f.y));
      alb *= mix(.66, (.62 + .36 * h) * (.6 + .4 * mort), max(fine, .1)) * (.74 + .5 * fbm3(vec3(p.xz * .22, 1.)));
      alb = mix(alb, alb * vec3(1.08, .96, .86), smoothstep(.4, .7, vnoise(vec3(p.xz * .7, 3.))));
      float rz = abs(p.z - ${ST_Z.toFixed(1)} + .35 * sin(p.x * .07));
      float run = (1. - smoothstep(.1, .2, rz)) * smoothstep(.3, .55, vnoise(vec3(p.x * .4, 3., 1.)));
      alb *= 1. - .35 * (1. - smoothstep(.2, .55, rz)); gloss = run * .8;
      float pud = uWet * smoothstep(.5, .55, fbm3(vec3(p.xz * .2, 5.)) - .07 * h + .04 * mort);       // lying in the hollows, edged by the setts
      gloss = max(gloss, pud); stPud = pud;
    } else {
      vec2 c = p.xz / vec2(1.5, .9); c.x += .5 * floor(c.y);
      vec2 f = abs(fract(c) - .5); float h = hash13(vec3(floor(c), 4.));
      float jn = smoothstep(.5, .47, max(f.x * 1., f.y));
      alb *= mix(.72, (.72 + .34 * h) * (.6 + .4 * jn), max(fine, .25)) * (.72 + .5 * fbm3(vec3(p.xz * .06, 3.)));
      alb *= .9 + .2 * vnoise(vec3(p.xz * 2.1, 6.)) * fine;
      float nearCres = smoothstep(350., 300., p.x) * smoothstep(120., 150., p.x);
      alb = mix(alb, uChalkC * .5, smoothstep(.5, .8, fbm3(vec3(p.xz * .07, 8.)) + .08 * vnoise(vec3(p.xz * .8, 3.))) * .7 * nearCres);
      float rw = max(.05, dist * .0015);
      float d1 = abs(p.x - 147.5), d2 = abs(p.z + 151.5);
      float on1 = step(-146., p.z) * step(p.z, 150.), on2 = step(-146., p.x) * step(p.x, 148.);
      float dr = min(d1 + 9. * (1. - on1), d2 + 9. * (1. - on2));
      float along = d1 < d2 ? p.z : p.x;
      alb = mix(alb, vec3(.17, .12, .08), step(dr, .75) * step(fract(along / .9), .3) * .8 * fine);
      alb = mix(alb, vec3(.2, .19, .19), 1. - smoothstep(rw, rw * 1.7, abs(dr - .38)));
      gloss = uWet * smoothstep(.45, .6, fbm3(vec3(p.xz * .12, 5.))); spark = .15;
    }
    sun *= quaySun(p);
  } else if (k < 4.5) {
    // ---- timber (u along the grain, v across)
    float g = vnoise(vec3(vM.z * 1.1, vM.w * 22., fract(sd) * 40.));
    alb *= (.72 + .5 * g) * (.8 + .3 * hash13(vec3(floor(vM.w / .32), floor(fract(sd) * 91.), 3.)));
    alb *= 1. - .55 * smoothstep(.42, .5, abs(fract(vM.w / .32) - .5)) * fine;
  } else if (k < 5.5) {
    alb *= mix(1., .82 + .36 * vnoise(p * 1.6 + fract(sd) * 30.), fine) * (.9 + .2 * vnoise(p * .011 + 3.));
  } else {
    // ---- the wall at the back of an arcade: arched shop doors
    float cu = (fract(vM.z / ${BAY.toFixed(1)}) - .5) * ${BAY.toFixed(1)}, v = vM.w;
    float wh = hash13(vec3(floor(vM.z / ${BAY.toFixed(1)}), floor(fract(sd) * 57.), 2.));
    float inA = step(abs(cu), 1.15) * step(v, 2.5 + sqrt(max(1.3225 - cu * cu, 0.)));
    alb *= .8 + .25 * fbm3(vec3(vM.z * .4, v * .4, 3.));
    if (inA > .5) {
      if (wh < .55) { alb = mix(uShutA, uShutB, step(.3, wh)) * .7 * (.7 + .3 * step(.5, fract(cu * 2.2))) * (1. - .4 * step(abs(cu), .03)); }
      else { alb = vec3(.03, .028, .026); emis = vec3(1.2, .7, .3) * (.012 + uNight * .5) * smoothstep(3.3, .5, v); }
    }
    alb *= mix(.75, 1., smoothstep(0., 1.2, v));
  }
  sun *= townSun(p) * basinSun(p) * hangSun(p) * smoothstep(0., .5, vW.z);
  float nl = max(dot(n, uSunDir), 0.);
  nl = mix(nl, .9, rakeW);                                                 // the gate-end wall takes the sun full on its dressed faces: warm where it is lit, blue where the Moon or the dock side shades it
  float up = n.y * .5 + .5;
  float ao = mix(.5, 1., smoothstep(.5, 1., vW.z));
  if (vW.z < -.5) ao = 1.;                                                 // p2: a cast shadow laid on the ground (light attribute -1): no sun, the whole sky
  float mSh = moonShadow(pL);
  { vec3 oc = pL - uMoonC; float bb = dot(oc, uSunDir), cc = dot(oc, oc) - 14400.; mSh = 1. - smoothstep(0., 240., bb * bb - cc) * step(bb, 0.) * step(0., cc); }      // a crisper edge than the hero's own: the Moon's shadow is drawn on stone here
  vec3 lit = uSunCol * nl * sun * mSh + uSkyCol * (.35 + .65 * up) * ao * (1. + .2 * rakeW) + uGndCol * (1. - up) * ao * 1.4 * (1. - .6 * rakeW) + uGndCol * (1. - ao) * 1.2;
  // in the gateway the sunlit cheek and sill throw light back on the leaves and the far cheek, so their timber and iron read
  float gateK = step(153.5, p.z) * step(p.z, 177.5) * step(abs(p.x), ${(GW + 1.2).toFixed(1)}) * step(p.y, 5.6) * step(-26.5, p.y) * step(abs(n.y), .7);
  lit += uSunCol * vec3(1., .84, .58) * (p.x > 0. ? .62 : .24) * mix(.3, 1., mSh) * gateK * (.35 + .65 * abs(n.x));
  // the copings and nosings at the gate end keep a warm edge even in the Moon's shadow
  lit += uSunCol * .2 * (1. - mSh) * step(.7, n.y) * step(150., p.z) * step(p.z, 178.) * step(k, 2.5) * step(1.5, k);
  vec3 dl = uMoonC - pL; float dm = length(dl);
  lit += uLamp * max(dot(n, dl / max(dm, 1.)) * .65 + .35, 0.) * 150. / max(dm, 150.);      // the Moon as a lamp (night)
  vec3 col = alb * lit + emis;
  if (gloss > .01) {
    vec3 r = reflect(-V, vec3(0., 1., 0.));
    float fres = 1. - max(V.y, 0.); fres = .06 + .94 * fres * fres * fres * fres;
    vec3 env = mix(uHorC, uPud, clamp(r.y * 1.6, 0., 1.));
    env = mix(env, vec3(1.02, 1., .97) * (uSkyCol * .9 + uSunCol * .5), smoothstep(.5, .72, fbm3(vec3(r.xz / (abs(r.y) + .25) * 1.1 + p.xz * .012 + uTime * vec2(.05, .09), 2.))) * .7);
    float slot = max(1. - smoothstep(.25, .8, abs(p.z - ${ST_Z.toFixed(1)}) / 6.5), smoothstep(.22, .5, r.y));
    vec3 fronts = uWallC * (.55 + .3 * vnoise(vec3(p.x * .45, p.z * .6, 3.))) * (.75 + .25 * step(.5, fract(p.x * .29)));
    env = mix(env, mix(fronts, uZenC * 1.05 + uHorC * .12, slot), stPud);
    fres = mix(fres, min(fres, .78), stPud);
    float sp = max(dot(r, uSunDir), 0.); float gl = exp(-(1. - sp) * 900.) * 9. + exp(-(1. - sp) * 60.) * .5;
    float tw = vnoise(vec3(p.x * 5. - uTime * 2.6, p.z * 22., uTime * 1.5));
    vec3 water = alb * lit * .45 + env * clamp(fres + .12, 0., 1.) + uSunCol * (gl + smoothstep(.72, .92, tw) * .9 * nl * spark) * sun * mSh;
    col = mix(col, water, gloss);
  }
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;

// cloth and other things that swing: laundry, awnings, shutters, lines, vine leaves, sails (one instanced sheet)
const SHEET_VERT = /* glsl */`
#include <common>
#include <fog_pars_vertex>
attribute vec3 aCol; attribute vec4 aPh;      // aPh: phase, amplitude, type, extra
uniform float uTime;
varying vec3 vCol, vN, vP, vUv; varying float vW;
vec3 shape(vec2 q){
  float ty = aPh.z;
  if (ty < .5) {                                 // laundry: pinned along its top edge
    float hang = 1. - q.y;
    float w = sin(uTime * 1.7 + aPh.x + q.x * 2.4) + .5 * sin(uTime * 2.9 + aPh.x * 1.7 + q.y * 3.);
    return vec3(q.x + .05 * hang * sin(uTime * 1.3 + aPh.x), q.y + .04 * hang * w, aPh.y * hang * (.5 + .45 * w));
  }
  if (ty < 1.5) {                                // awning or sail: pinned top and bottom, bellying
    float pin = sin(3.14159 * q.y);
    return vec3(q.x, q.y, aPh.y * pin * (.6 + .4 * sin(q.x * 5. + q.y * 4. - uTime * 2.6 + aPh.x)));
  }
  if (ty < 2.5) {                                // shutter: a rigid leaf on its hinge
    float a = min(aPh.w + aPh.y * sin(uTime * (.6 + fract(aPh.x) * .7) + aPh.x), 2.9);
    return vec3(q.x * cos(a), q.y, q.x * sin(a));
  }
  if (ty < 3.5) {                                // a sagging line; with a phase it is a slipped rope hanging in a loop, swinging
    float bow = 4. * q.x * (1. - q.x);
    return vec3(q.x + (aPh.x > .5 ? sin(uTime * 1.1 + aPh.x) * .2 * bow : 0.), -aPh.y * bow, 0.);
  }
  float a = sin(uTime * (2. + fract(aPh.x * 3.3) * 2.) + aPh.x) * aPh.y;    // a leaf hanging from its stalk
  vec2 c = q - vec2(.5, 1.);
  return vec3(.5 + c.x * cos(a), 1. + c.y * cos(a * .6), c.x * sin(a) + c.y * sin(a * .6));
}
void main(){
  vec2 q = position.xy;
  vec3 a = (instanceMatrix * vec4(shape(q), 1.)).xyz;
  vec3 b = (instanceMatrix * vec4(shape(q + vec2(.05, 0.)), 1.)).xyz;
  vec3 c = (instanceMatrix * vec4(shape(q + vec2(0., .05)), 1.)).xyz;
  vec3 n = normalize(cross(b - a, c - a) + vec3(0., 1e-6, 1e-7));
  if (aPh.z > 2.5 && aPh.z < 3.5) {
    vec3 tc = cameraPosition - a; float dist = length(tc);
    vec3 sd = normalize(cross(b - a, tc) + vec3(1e-5, 2e-5, 0.));
    a += sd * (q.y - .5) * max(aPh.w, dist * .0022);
    n = tc / max(dist, 1e-3);
  }
  vCol = aCol; vN = n; vP = a; vUv = vec3(uv, aPh.z + .05 + fract(aPh.x * .137) * .9);
  // the wind's crest as light and shade travelling over the cloth (laundry and awnings only)
  vW = aPh.z < .5 ? (1. - q.y) * sin(uTime * 1.7 + aPh.x + q.x * 2.4 + 1.2)
     : aPh.z < 1.5 ? sin(3.14159 * q.y) * cos(q.x * 5. + q.y * 4. - uTime * 2.6 + aPh.x) : 0.;
  vec4 mvPosition = modelViewMatrix * vec4(a, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const sheetFrag = (glsl) => /* glsl */`
#include <common>
#include <fog_pars_fragment>
varying vec3 vCol, vN, vP, vUv; varying float vW;
${glsl.noise}
${glsl.light}
${GL_SHADE}
void main(){
  vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n;
  float ty = floor(vUv.z), rnd = clamp((fract(vUv.z) - .05) / .9, 0., 1.); vec2 uv = vUv.xy;
  vec3 alb = vCol;
  if (ty < .5) {
    alb *= .9 + .12 * vnoise(vec3(uv * 14., rnd * 9.));
    if (rnd > .6) alb *= .8 + .2 * step(.5, fract(uv.x * 7.));
    else if (rnd > .35) alb *= .85 + .15 * step(.5, fract(uv.y * 9.)) ;
    alb *= .8 + .2 * smoothstep(0., .25, uv.y);
  } else if (ty < 1.5) {
    alb = mix(alb, vec3(.78, .74, .64), step(.5, fract(uv.x * (3. + floor(rnd * 3.)))) * step(rnd, .7));
    alb *= .9 + .12 * vnoise(vec3(uv * 22., rnd * 9.));
  } else if (ty < 2.5) {
    alb *= (.7 + .3 * step(.4, fract(uv.y * 12.))) * (1. - .4 * step(.44, abs(uv.x - .5))) * (1. - .4 * step(.47, abs(uv.y - .5)));
  } else if (ty < 3.5) {
    alb = vec3(.3, .26, .2);
  } else {
    vec2 c = uv - .5; if (dot(c, c) > .25) discard;
    alb *= .7 + .6 * rnd;
  }
  alb *= 1. + .2 * clamp(vW, -1., 1.);
  vec3 pL = vP + vec3(0., 30., 0.);
  float sun = townSun(vP) * moonShadow(pL) * hangSun(vP);
  float up = n.y * .5 + .5;
  float thru = ty > 1.5 && ty < 3.5 ? 0. : .5;
  vec3 col = alb * (uSunCol * (max(dot(n, uSunDir), 0.) + thru * max(dot(-n, uSunDir), 0.)) * sun + uSkyCol * (.4 + .6 * up) + uGndCol * (1. - up) * 1.3);
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;

const SEA_VERT = /* glsl */`
#include <common>
#include <fog_pars_vertex>
varying vec3 vP;
void main(){
  vP = position;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const seaFrag = (glsl) => /* glsl */`
#include <common>
#include <fog_pars_fragment>
uniform float uTime; uniform vec3 uSeaC, uHorC, uZenC;
varying vec3 vP;
${glsl.noise}
${glsl.light}
float seaH(vec2 q){
  return vnoise(vec3(q * .16 + uTime * vec2(.11, .3), uTime * .22)) * .7 + vnoise(vec3(q * .47 + uTime * vec2(-.2, .42), uTime * .4)) * .3;
}
void main(){
  vec3 tc = cameraPosition - vP; float dist = length(tc); vec3 V = tc / max(dist, 1e-3);
  vec2 q = vP.xz;
  float e = .35 + dist * .004;
  float h0 = seaH(q), hx = seaH(q + vec2(e, 0.)), hz = seaH(q + vec2(0., e));
  float amp = 2.2 / (1. + dist * .006);
  vec3 n = normalize(vec3(-(hx - h0) / e * amp, 1., -(hz - h0) / e * amp));
  vec3 r = reflect(-V, n); r.y = abs(r.y);
  float fres = 1. - max(dot(n, V), 0.); float f2 = fres * fres; fres = .03 + .97 * f2 * f2 * fres;
  vec3 sky = mix(uHorC, uZenC, sqrt(clamp(r.y, 0., 1.)));
  vec3 deep = uSeaC * (uSkyCol * 1.5 + uSunCol * .35 * max(uSunDir.y, 0.)) * (.75 + .5 * h0);
  vec3 col = mix(deep, sky, fres);
  float sp = max(dot(r, uSunDir), 0.);
  float tw = vnoise(vec3(q * 1.7, uTime * 2.2)); tw *= tw;
  float sh = moonShadow(vP + vec3(0., 30., 0.));
  col += uSunCol * (exp(-(1. - sp) * 420.) * 7. + exp(-(1. - sp) * 26.) * tw * 2.4 + smoothstep(.55, .8, tw) * .12 * uSunDir.y) * sh;
  float lw = 3.5 + max(vP.z - 175., 0.) * .07;
  float lane = exp(-vP.x * vP.x / (lw * lw)) * smoothstep(176., 186., vP.z) * (1. - smoothstep(250., 430., vP.z));
  col += vec3(1., .88, .6) * lane * (smoothstep(.3, .75, tw) * 1.5 + .1);
  float lap = (1. - smoothstep(0., 2.2, vP.z - ${QUAY_Z1.toFixed(1)} - .7 * sin(uTime * 1.1 + vP.x * .35) - .5)) * step(${QUAY_X0.toFixed(1)}, vP.x);
  lap = max(lap, (1. - smoothstep(0., 2., ${QUAY_X0.toFixed(1)} - vP.x - .7 * sin(uTime * .9 + vP.z * .3) - .5)) * step(vP.z, ${QUAY_Z1.toFixed(1)}));
  col = mix(col, vec3(.8, .88, .92) * (uSkyCol * 1.2 + uSunCol * .6 * sh), lap * (.35 + .4 * vnoise(vec3(q * 1.3, uTime))));
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;

// chimney smoke and the sea-fret: soft billboards
const PUFF_VERT = /* glsl */`
#include <common>
#include <fog_pars_vertex>
attribute vec4 aS;     // origin x, y, z, phase
attribute vec4 aS2;    // rise (m), speed (cycles/s), size, kind (0 smoke, 1 fret)
uniform float uTime, uProg;
varying vec3 vUv; varying float vK; varying vec3 vWp;
void main(){
  float f = fract(uTime * aS2.y + aS.w);
  vec3 p = aS.xyz;
  float size = aS2.z;
  if (aS2.w < .5) {
    p.y += aS2.x * (1. - (1. - f) * (1. - f)) * .8;
    p.z += f * f * aS2.x * 1.3; p.x += f * f * aS2.x * .35 + sin(uTime * .6 + aS.w * 40.) * .3 * f;
    size *= .35 + 1.6 * f;
    vUv.z = smoothstep(0., .1, f) * (1. - f) * (1. - f) * .5;
  } else if (aS2.w < 1.5) {
    p.x += sin(uTime * .05 + aS.w * 30.) * 9.; p.z += (f - .5) * aS2.x; p.y += sin(uTime * .21 + aS.w * 50.) * .8;
    vUv.z = smoothstep(0., .2, f) * smoothstep(1., .8, f) * .3 * (1. - smoothstep(.56, .74, uProg));
  } else if (aS2.w < 2.5) {                      // chalk sifting down from the belly to the dock floor: fine falling streaks
    p.y -= aS2.x * f; p.x += sin(uTime * .5 + aS.w * 40.) * .9; p.z += cos(uTime * .4 + aS.w * 31.) * .9;
    vUv.z = smoothstep(0., .08, f) * smoothstep(1., .8, f) * .2;
  } else {                                       // a veil of dust hanging in the sun at the belly's rim, once the Moon stirs
    p.x += sin(uTime * .11 + aS.w * 30.) * 3.; p.z += cos(uTime * .09 + aS.w * 47.) * 3.; p.y -= f * 3.;
    vUv.z = smoothstep(0., .25, f) * smoothstep(1., .75, f) * aS2.x * smoothstep(.6, .7, uProg);
  }
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.);
  vec2 shp = aS2.w > 2.5 ? vec2(1., 1.5) : (aS2.w > 1.5 ? vec2(.26, 2.6) : vec2(1., abs(aS2.w - 1.) < .5 ? .32 : 1.));
  mvPosition.xy += position.xy * size * shp;
  vWp = p + (vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]) * position.x * shp.x + vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]) * position.y * shp.y) * size;
  vUv.xy = position.xy * 2.; vK = aS2.w;
  vUv.z *= aS2.w > 2.5 ? smoothstep(16., 44., -mvPosition.z) : (aS2.w > 1.5 ? smoothstep(4., 12., -mvPosition.z) : smoothstep(1.5, 6., -mvPosition.z));
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const PUFF_FRAG = /* glsl */`
#include <common>
#include <fog_pars_fragment>
uniform vec3 uSmoke, uFret, uSunDir, uSunCol, uSkyCol, uMoonC;
varying vec3 vUv; varying float vK; varying vec3 vWp;
void main(){
  float r2 = dot(vUv.xy, vUv.xy);
  float a = (1. - smoothstep(.05, 1., r2)) * vUv.z;
  vec3 c = vK < .5 ? uSmoke : uFret;
  if (vK > 1.5) {
    // chalk in the air under the Moon: gold where the sun comes in under the rim, dim blue in the Moon's shade and the dock side's
    vec3 oc = vWp + vec3(0., 30., 0.) - uMoonC; float b = dot(oc, uSunDir), cc = dot(oc, oc) - 14400.;
    float lit = 1. - smoothstep(0., 1500., b * b - cc) * step(b, 0.) * step(0., cc);
    float sx = abs(uSunDir.x) > .05 ? uSunDir.x : .05;
    lit *= smoothstep(-3., 3., vWp.y + uSunDir.y * (140. * sign(sx) - vWp.x) / sx);
    c = mix(uSkyCol * 1.1, uSunCol * vec3(1.05, .86, .56), lit);
    a *= vK > 2.5 ? .3 + 1.25 * lit : .7 + .6 * lit;
  }
  gl_FragColor = vec4(c, a);
  #include <fog_fragment>
}`;

const FRET_VERT = /* glsl */`
#include <common>
#include <fog_pars_vertex>
varying vec3 vP; varying float vD;
void main(){
  vP = position;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.);
  vD = -mvPosition.z;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const fretFrag = (glsl) => /* glsl */`
#include <common>
#include <fog_pars_fragment>
uniform vec3 uFret;
uniform float uTime, uProg, uLayer;
varying vec3 vP; varying float vD;
${glsl.noise}
void main(){
  vec2 q = vP.xz + uLayer * 37.;
  float n = fbm3(vec3(q * .016 + uTime * vec2(.012, .022), uTime * .02 + uLayer * 5.));
  float n2 = vnoise(vec3(q * .07 - uTime * vec2(.03, .012), uTime * .05));
  float a = smoothstep(.16, .5, n * .75 + n2 * .25 + .1 - uLayer * .14);
  a *= smoothstep(0., 6., ${B_X.toFixed(1)} - abs(vP.x)) * smoothstep(0., 6., vP.z - (${B_Z0.toFixed(1)})) * smoothstep(0., 6., ${B_Z1.toFixed(1)} - vP.z);
  a *= (1. - smoothstep(.54, .72, uProg)) * smoothstep(4., 30., vD) * (.92 - uLayer * .22);
  gl_FragColor = vec4(uFret * (.86 + .2 * n), a);
  #include <fog_fragment>
}`;

// birds that stand on a rail and go up in a sheet when the first rope is slipped (keyed to progress)
const PERCH_VERT = /* glsl */`
#include <common>
#include <fog_pars_vertex>
attribute vec3 color;
attribute vec4 aG;     // perch x, y, z, release u
attribute vec4 aG2;    // heading, speed, phase, climb
uniform float uProg, uSecs, uTime, uSize;
varying vec3 vCol, vN, vP;
void main(){
  float t = max(uProg - aG.w, 0.) * uSecs;
  float fly = smoothstep(0., .45, t);
  vec3 lp = position * uSize; vec3 ln = normal;
  float sp = abs(position.x);
  if (sp > .09) {
    float beat = sin(uTime * 15. + t * 4. + aG2.z * 6.283) * mix(1., .35, smoothstep(2.5, 6., t));
    float a = (beat * .85 + .15) * smoothstep(.09, .7, sp) * fly;
    float fold = mix(.22, 1., fly);
    lp.x = position.x * cos(a) * fold * uSize; lp.y += (sp * sin(a) - (1. - fly) * sp * .28) * uSize; lp.z -= (1. - fly) * sp * .5 * uSize;
    ln = normalize(vec3(-sign(position.x) * sin(a), cos(a), 0.) * sign(normal.y + .001));
  } else {
    lp.y += (1. - fly) * .0;
    float peck = sin(uTime * 1.3 + aG2.z * 40.);
    lp.y += (1. - fly) * max(peck - .9, 0.) * -.5 * step(.12, position.z) * uSize;
  }
  float yaw = aG2.x + t * .16 * (aG2.z - .5) * 2.;
  float c = cos(yaw), s = sin(yaw);
  float pitch = fly * .35 * exp(-t * .5);
  lp = vec3(lp.x, lp.y * cos(pitch) + lp.z * sin(pitch), -lp.y * sin(pitch) + lp.z * cos(pitch));
  vec3 wp = vec3(c * lp.x + s * lp.z, lp.y, -s * lp.x + c * lp.z);
  vec3 wn = vec3(c * ln.x + s * ln.z, ln.y, -s * ln.x + c * ln.z);
  float run = aG2.y * (t - (1. - exp(-t * 1.4)) / 1.4);
  vec3 o = aG.xyz + vec3(s, 0., c) * run;
  o.y += aG2.w * (1. - exp(-t * 2.)) + sin(t * .4 + uTime * .9 + aG2.z * 9.) * .5 * fly + .05;
  vec3 p = o + wp;
  vCol = color; vN = wn; vP = p;
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const perchFrag = (glsl) => /* glsl */`
#include <common>
#include <fog_pars_fragment>
varying vec3 vCol, vN, vP;
${glsl.light}
void main(){
  vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n;
  gl_FragColor = vec4(lightIt(vCol, n, vP + vec3(0., 30., 0.), 1.) + vCol * (uSkyCol * .45 + uSunCol * .06), 1.);
  #include <fog_fragment>
}`;

// p1: the light of the pails put down on the dock floor. Flat cards lying one above another over each pail (a pool on the floor, the bright
// brim, a soft halo above it), added to what is behind them; they lie level in the world and do not turn to the lens
const PAIL_VERT = /* glsl */`
#include <common>
#include <fog_pars_vertex>
attribute vec3 aQ;     // corner of the card (-1..1, -1..1), strength of the card
attribute vec4 aL;     // pail x, z, size of its glow, brightness
varying vec3 vQ;
void main(){
  vec3 p = vec3(aL.x + position.x * aL.z, -30. + position.y, aL.y + position.z * aL.z);
  vQ = vec3(aQ.xy, aQ.z * aL.w);
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const PAIL_FRAG = /* glsl */`
#include <common>
#include <fog_pars_fragment>
uniform vec3 uGlow;
varying vec3 vQ;
void main(){
  float r2 = dot(vQ.xy, vQ.xy);
  float a = (exp(-r2 * 5.) * .6 + exp(-r2 * 28.) * .4) * (1. - smoothstep(.7, 1., r2));
  vec3 col = uGlow * a * vQ.z;
  #ifdef USE_FOG
    #ifdef FOG_EXP2
      col *= exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
    #else
      col *= 1. - smoothstep(fogNear, fogFar, vFogDepth);
    #endif
  #endif
  gl_FragColor = vec4(col, 1.);
}`;

// ------------------------------------------------------------------------------------------------ geometry
// collects quads for the static "stuff" material: position, normal, colour, aM (kind, seed, u, v), aW (w, h, light)
const K = { WALL: 0, ROOF: 1, STONE: 2, GROUND: 3, WOOD: 4, PLAIN: 5, SHOP: 6 };
function makeBuilder() {
  const P = [], N = [], C = [], M = [], W = [], I = [];
  let n = 0;
  const b = {
    get count() { return n; },
    get positions() { return P; }, get indices() { return I; },      // p2: the batch's own arrays so far, for reading only (where its things lie)
    vert(x, y, z, nx, ny, nz, c, k, sd, u, v, w, h, l) { P.push(x, y, z); N.push(nx, ny, nz); C.push(c[0], c[1], c[2]); M.push(k, sd, u, v); W.push(w, h, l); return n++; },
    // corners counter-clockwise seen from outside; uv runs u0..u1 from a to b and v0..v1 from a to d
    quad(a, q, c, d, col, k, o = {}) {
      const ux = q[0] - a[0], uy = q[1] - a[1], uz = q[2] - a[2], vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const L = Math.hypot(nx, ny, nz) || 1; nx /= L; ny /= L; nz /= L;
      const sd = o.sd ?? 0.37, u0 = o.u0 ?? 0, u1 = o.u1 ?? Math.hypot(ux, uy, uz), v0 = o.v0 ?? 0, v1 = o.v1 ?? Math.hypot(vx, vy, vz);
      const w = o.w ?? (u1 - u0), h = o.h ?? (v1 - v0), l = o.l ?? 1;
      const i0 = b.vert(a[0], a[1], a[2], nx, ny, nz, col, k, sd, u0, v0, w, h, l);
      b.vert(q[0], q[1], q[2], nx, ny, nz, col, k, sd, u1, v0, w, h, l);
      b.vert(c[0], c[1], c[2], nx, ny, nz, col, k, sd, u1, v1, w, h, l);
      b.vert(d[0], d[1], d[2], nx, ny, nz, col, k, sd, u0, v1, w, h, l);
      I.push(i0, i0 + 1, i0 + 2, i0, i0 + 2, i0 + 3);
    },
    tri(a, q, c, col, k, o = {}) {
      const ux = q[0] - a[0], uy = q[1] - a[1], uz = q[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const L = Math.hypot(nx, ny, nz) || 1; nx /= L; ny /= L; nz /= L;
      const sd = o.sd ?? 0.37, l = o.l ?? 1, w = o.w ?? 1, h = o.h ?? 1;
      const i0 = b.vert(a[0], a[1], a[2], nx, ny, nz, col, k, sd, o.ua ?? 0, o.va ?? 0, w, h, l);
      b.vert(q[0], q[1], q[2], nx, ny, nz, col, k, sd, o.ub ?? 1, o.vb ?? 0, w, h, l);
      b.vert(c[0], c[1], c[2], nx, ny, nz, col, k, sd, o.uc ?? .5, o.vc ?? 1, w, h, l);
      I.push(i0, i0 + 1, i0 + 2);
    },
    // upright wall from (x0,z0) to (x1,z1): its outside is on the right-hand side walking from 0 to 1 ... (-dz, dx)
    wall(x0, z0, x1, z1, y0, y1, col, k, o = {}) {
      b.quad([x0, y0, z0], [x1, y0, z1], [x1, y1, z1], [x0, y1, z0], col, k, { v0: o.v0 ?? 0, v1: (o.v0 ?? 0) + (y1 - y0), ...o });
    },
    // box given by a centre, half-size and yaw; faces: 4 sides + top (+ bottom)
    box(cx, cy, cz, hx, hy, hz, col, k, o = {}) {
      const c = Math.cos(o.yaw || 0), s = Math.sin(o.yaw || 0);
      const pt = (x, y, z) => [cx + x * c + z * s, cy + y, cz - x * s + z * c];
      const A = pt(-hx, -hy, hz), B = pt(hx, -hy, hz), Cc = pt(hx, -hy, -hz), D = pt(-hx, -hy, -hz);
      const E = pt(-hx, hy, hz), Fq = pt(hx, hy, hz), G = pt(hx, hy, -hz), H = pt(-hx, hy, -hz);
      b.quad(A, B, Fq, E, col, k, o); b.quad(B, Cc, G, Fq, col, k, o); b.quad(Cc, D, H, G, col, k, o); b.quad(D, A, E, H, col, k, o);
      b.quad(E, Fq, G, H, o.top || col, k, o);
      if (o.bottom) b.quad(D, Cc, B, A, col, k, o);
    },
    // a beam between two points with a square section (u runs along it)
    beam(x0, y0, z0, x1, y1, z1, t, col, k = K.WOOD, o = {}) {
      const dx = x1 - x0, dy = y1 - y0, dz = z1 - z0, L = Math.hypot(dx, dy, dz) || 1;
      let sx = dz, sy = 0, sz = -dx; let sl = Math.hypot(sx, sz);
      if (sl < 1e-4) { sx = 1; sz = 0; sl = 1; }
      sx *= t / sl; sz *= t / sl;
      const ux = (dy * sz - dz * sy) / L, uy = (dz * sx - dx * sz) / L, uz = (dx * sy - dy * sx) / L;
      const tx = ux * 1, ty = uy * 1, tz = uz * 1;
      const c = (a, e, f) => [(f ? x1 : x0) + sx * a + tx * e, (f ? y1 : y0) + sy * a + ty * e, (f ? z1 : z0) + sz * a + tz * e];
      const oo = { u1: L, v1: 2 * t, ...o };
      b.quad(c(-1, -1, 0), c(-1, -1, 1), c(1, -1, 1), c(1, -1, 0), col, k, oo); b.quad(c(1, -1, 0), c(1, -1, 1), c(1, 1, 1), c(1, 1, 0), col, k, oo);
      b.quad(c(1, 1, 0), c(1, 1, 1), c(-1, 1, 1), c(-1, 1, 0), col, k, oo); b.quad(c(-1, 1, 0), c(-1, 1, 1), c(-1, -1, 1), c(-1, -1, 0), col, k, oo);
      if (o.caps) { b.quad(c(-1, -1, 1), c(-1, 1, 1), c(1, 1, 1), c(1, -1, 1), col, k, oo); b.quad(c(-1, -1, 0), c(1, -1, 0), c(1, 1, 0), c(-1, 1, 0), col, k, oo); }
    },
    // a round column / drum / cone with smooth normals (rings: [[y, r], ...] bottom to top)
    lathe(cx, cz, rings, seg, col, k, o = {}) {
      const sd = o.sd ?? 0.37, l = o.l ?? 1, base = n;
      for (let j = 0; j < rings.length; j++) {
        const [y, r] = rings[j], pj = rings[Math.max(j - 1, 0)], nj = rings[Math.min(j + 1, rings.length - 1)];
        const dy = nj[0] - pj[0], dr = nj[1] - pj[1], sl = Math.hypot(dy, dr) || 1;
        for (let i = 0; i <= seg; i++) {
          const a = (i / seg) * TAU, sx = Math.sin(a), sz = Math.cos(a);
          b.vert(cx + sx * r, y, cz + sz * r, sx * dy / sl, -dr / sl, sz * dy / sl, o.cols ? o.cols[j] : col, k, sd, a * Math.max(r, .2), y, 1, 1, l);
        }
      }
      for (let j = 0; j < rings.length - 1; j++) for (let i = 0; i < seg; i++) {
        const a = base + j * (seg + 1) + i, c = a + seg + 1; I.push(a, a + 1, c, a + 1, c + 1, c);
      }
    },
    // a lumpy ball (tree crowns, shrubs, the cat): icosphere-ish from a lat-long grid with noise
    blob(cx, cy, cz, rx, ry, rz, col, rnd, o = {}) {
      const seg = o.seg || 7, rows = o.rows || 5, base = n, k = o.k ?? K.PLAIN, sd = o.sd ?? rnd(), l = o.l ?? 1;
      for (let j = 0; j <= rows; j++) for (let i = 0; i <= seg; i++) {
        const th = (j / rows) * Math.PI, ph = (i % seg) / seg * TAU;
        const bump = j === 0 || j === rows ? 1 : 1 + (o.rough ?? 0.22) * (Math.sin(ph * 3 + sd * 40 + j) * Math.cos(th * 4 + sd * 17));
        const sx = Math.sin(th) * Math.sin(ph), sy = Math.cos(th), sz = Math.sin(th) * Math.cos(ph);
        const kk = 0.75 + 0.5 * (sy * 0.5 + 0.5);
        b.vert(cx + sx * rx * bump, cy + sy * ry * bump, cz + sz * rz * bump, sx, sy, sz, [col[0] * kk, col[1] * kk, col[2] * kk], k, sd, 0, 0, 1, 1, l);
      }
      for (let j = 0; j < rows; j++) for (let i = 0; i < seg; i++) { const a = base + j * (seg + 1) + i, c = a + seg + 1; I.push(a, c, a + 1, a + 1, c, c + 1); }
    },
    mesh(material) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
      g.setAttribute('aM', new THREE.Float32BufferAttribute(M, 4));
      g.setAttribute('aW', new THREE.Float32BufferAttribute(W, 3));
      g.setIndex(n > 65535 ? new THREE.Uint32BufferAttribute(I, 1) : new THREE.Uint16BufferAttribute(I, 1));
      g.computeBoundingSphere();
      const m = new THREE.Mesh(g, material); m.matrixAutoUpdate = false;
      return m;
    },
    // the same mesh made in short steps (one typed array per step), for the big batches
    async meshAsync(material, pause) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); await pause();
      g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); await pause();
      g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); await pause();
      g.setAttribute('aM', new THREE.Float32BufferAttribute(M, 4)); await pause();
      g.setAttribute('aW', new THREE.Float32BufferAttribute(W, 3)); await pause();
      g.setIndex(n > 65535 ? new THREE.Uint32BufferAttribute(I, 1) : new THREE.Uint16BufferAttribute(I, 1)); await pause();
      g.computeBoundingSphere(); await pause();
      const m = new THREE.Mesh(g, material); m.matrixAutoUpdate = false;
      return m;
    },
  };
  return b;
}

// a gable-roofed house: walls from the ground (windows start at y0), ridge along X (ax 0) or Z (ax 1)
function addHouse(b, x0, x1, z0, z1, y0, h, ax, col, roofCol, sd, o = {}) {
  const top = y0 + h, l = o.l ?? 1;
  const w = { sd, l, v0: -y0 };
  if (!o.noS) b.wall(x0, z1, x1, z1, 0, top, col, K.WALL, { ...w, h });        // +Z face
  if (!o.noN) b.wall(x1, z0, x0, z0, 0, top, col, K.WALL, { ...w, h });        // -Z face
  if (!o.noE) b.wall(x1, z1, x1, z0, 0, top, col, K.WALL, { ...w, h });        // +X face
  if (!o.noW) b.wall(x0, z0, x0, z1, 0, top, col, K.WALL, { ...w, h });        // -X face
  const ov = 0.45, span = ax === 0 ? (z1 - z0) / 2 : (x1 - x0) / 2, rise = span * (o.pitch ?? 0.34), rs = { sd, l };
  const sl = Math.hypot(span + ov, rise * (span + ov) / span);
  if (ax === 0) {
    const zm = (z0 + z1) / 2, ye = top - rise * ov / span, yr = top + rise, X0 = x0 - ov, X1 = x1 + ov;
    b.quad([X0, ye, z1 + ov], [X1, ye, z1 + ov], [X1, yr, zm], [X0, yr, zm], roofCol, K.ROOF, { ...rs, v0: sl, v1: 0 });
    b.quad([X1, ye, z0 - ov], [X0, ye, z0 - ov], [X0, yr, zm], [X1, yr, zm], roofCol, K.ROOF, { ...rs, v0: sl, v1: 0 });
    b.tri([x1, top, z1], [x1, top, z0], [x1, yr, zm], col, K.WALL, { sd, l, ua: 0, va: 99, ub: 1, vb: 99, uc: .5, vc: 99, h: 0 });
    b.tri([x0, top, z0], [x0, top, z1], [x0, yr, zm], col, K.WALL, { sd, l, ua: 0, va: 99, ub: 1, vb: 99, uc: .5, vc: 99, h: 0 });
  } else {
    const xm = (x0 + x1) / 2, ye = top - rise * ov / span, yr = top + rise, Z0 = z0 - ov, Z1 = z1 + ov;
    b.quad([x1 + ov, ye, Z1], [x1 + ov, ye, Z0], [xm, yr, Z0], [xm, yr, Z1], roofCol, K.ROOF, { ...rs, v0: sl, v1: 0 });
    b.quad([x0 - ov, ye, Z0], [x0 - ov, ye, Z1], [xm, yr, Z1], [xm, yr, Z0], roofCol, K.ROOF, { ...rs, v0: sl, v1: 0 });
    b.tri([x0, top, z1], [x1, top, z1], [xm, yr, z1], col, K.WALL, { sd, l, ua: 0, va: 99, ub: 1, vb: 99, uc: .5, vc: 99, h: 0 });
    b.tri([x1, top, z0], [x0, top, z0], [xm, yr, z0], col, K.WALL, { sd, l, ua: 0, va: 99, ub: 1, vb: 99, uc: .5, vc: 99, h: 0 });
  }
  return top + rise;
}

// a spare crescent: a shell cut from a sphere of radius R, 2*hl tip to tip, 2*hw wide at the waist, curved in plan
// like a crescent; positions are relative to the sphere's centre (the Moon's shaders want that); uv.x = 0..1 across
// (the concave edge is silver), uv.y = 1 on the mirrored underside
function crescentGeometry(R, hl, hw, thick, nl = 56, nw = 10) {
  const pos = [], uv = [], idx = [];
  const pt = (s, w, r) => {
    const x = s * hl, half = hw * Math.pow(Math.max(1 - s * s, 0), 0.62) + 0.25, z = hw * 0.9 * (s * s - 0.4) + w * half;
    const y = Math.sqrt(Math.max(R * R - x * x - z * z, 1)), k = r / Math.hypot(x, y, z);
    pos.push(x * k, y * k, z * k);
  };
  for (let layer = 0; layer < 2; layer++) for (let j = 0; j <= nw; j++) for (let i = 0; i <= nl; i++) {
    pt(i / nl * 2 - 1, j / nw * 2 - 1, layer ? R - thick : R); uv.push(j / nw, layer);
  }
  const row = nl + 1, lay = row * (nw + 1);
  for (let j = 0; j < nw; j++) for (let i = 0; i < nl; i++) {
    const a = j * row + i, c = a + row; idx.push(a, c, a + 1, a + 1, c, c + 1);
    const a2 = lay + a, c2 = lay + c; idx.push(a2, a2 + 1, c2, a2 + 1, c2 + 1, c2);
  }
  for (let i = 0; i < nl; i++) {                       // the two long edges
    let a = i, c = lay + i; idx.push(a, a + 1, c, a + 1, c + 1, c);
    a = nw * row + i; c = lay + a; idx.push(a, c, a + 1, a + 1, c, c + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}

function sheetGeometry(nx, ny) {       // unit sheet x 0..1, y 0..1
  const pos = [], uv = [], idx = [];
  for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) { pos.push(i / nx, j / ny, 0); uv.push(i / nx, j / ny); }
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const a = j * (nx + 1) + i, c = a + nx + 1; idx.push(a, a + 1, c, a + 1, c + 1, c); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}
// instanced sheets: add(origin, xAxis, yAxis, normal, colour, [phase, amp, type, extra])
function makeSheets() {
  const m = [], c = [], p = [];
  const M4 = new THREE.Matrix4(), X = new THREE.Vector3(), Y = new THREE.Vector3(), Z = new THREE.Vector3(), O = new THREE.Vector3();
  return {
    add(o, ax, ay, az, col, ph) {
      M4.makeBasis(X.fromArray(ax), Y.fromArray(ay), Z.fromArray(az)).setPosition(O.fromArray(o));
      for (let i = 0; i < 16; i++) m.push(M4.elements[i]);
      c.push(col[0], col[1], col[2]); p.push(ph[0], ph[1], ph[2], ph[3]);
    },
    build(geo, mat) {
      const n = p.length / 4;
      const mesh = new THREE.InstancedMesh(geo, mat, Math.max(n, 1));
      mesh.count = n; mesh.instanceMatrix.array.set(m); mesh.instanceMatrix.needsUpdate = true;
      geo.setAttribute('aCol', new THREE.InstancedBufferAttribute(new Float32Array(n ? c : [0, 0, 0]), 3));
      geo.setAttribute('aPh', new THREE.InstancedBufferAttribute(new Float32Array(n ? p : [0, 0, 0, 0]), 4));
      mesh.frustumCulled = false; mesh.matrixAutoUpdate = false;
      return mesh;
    },
  };
}

// ------------------------------------------------------------------------------------------------ the world
const LIVERY = {
  ochre: { walls: ['#E9C98A', '#E2B877', '#D9A066', '#EBD3A0', '#DB9A78', '#E4C08A'], roof: '#C8643C', shutA: '#3F6B4F', shutB: '#3E6FA8', cloth: ['#EEF1F4', '#C8643C', '#3E6FA8', '#E9C98A', '#EEF1F4', '#8FD3E8'] },
  whitewash: { walls: ['#F0ECE2', '#E8E2D4', '#F1EEE8', '#E4D9C4', '#EDE7DA'], roof: '#C8643C', shutA: '#3E6FA8', shutB: '#2F5F9A', cloth: ['#EEF1F4', '#3E6FA8', '#8FD3E8', '#E9C98A', '#C8643C'] },
  rose: { walls: ['#E8B9A6', '#E3A68F', '#EBCBB5', '#D9C7A0', '#DDAE98'], roof: '#B85C3C', shutA: '#8FA58A', shutB: '#6F8F7A', cloth: ['#EEF1F4', '#8FA58A', '#E8B9A6', '#EBD9B0', '#C8643C'] },
};
const D2R = Math.PI / 180;
const dirOf = (elev, bearing) => [Math.sin(bearing * D2R) * Math.cos(elev * D2R), Math.sin(elev * D2R), Math.cos(bearing * D2R) * Math.cos(elev * D2R)];
// bearing: degrees from +Z towards +X.  Colours are linear multipliers of the named hex.
const LOOKS = {
  day: { preset: 'day', sun: dirOf(27, 105), sunCol: ['#FFE9C4', 1.22], skyCol: ['#7F9CC4', 0.62], gnd: 0.2, zenith: '#3565A6', horizon: '#B4CFE6', fog: '#B5CDE4', fogD: 0.00078, exposure: 1.0, self: 0, lamp: 0, night: 0, clouds: 0.25 },
  dawn: { preset: 'dawn', sun: dirOf(9, 112), sunCol: ['#FFB792', 1.2], skyCol: ['#8E97CC', 0.5], gnd: 0.16, zenith: '#4A65AC', horizon: '#F3CDBD', fog: '#E3C3C2', fogD: 0.00095, exposure: 1.06, self: 0, lamp: 0, night: 0, clouds: 0.4 },
  golden: { preset: 'goldenHour', sun: dirOf(17, -118), sunCol: ['#FFC37A', 1.3], skyCol: ['#8E9BCB', 0.78], gnd: 0.26, zenith: '#3F62A6', horizon: '#F4D6A6', fog: '#E6CDA6', fogD: 0.0009, exposure: 1.16, self: 0, lamp: 0, night: 0, clouds: 0.42 },
  night: { preset: 'night', sun: dirOf(40, 105), sunCol: ['#8FA8E0', 0.1], skyCol: ['#5E7CE0', 0.3], gnd: 0.07, zenith: '#0A1230', horizon: '#243560', fog: '#1B2748', fogD: 0.0008, exposure: 1.3, self: 0.5, lamp: 0.75, night: 1, clouds: 0.2 },
};

export default {
  id: 'moon-in-dry-dock',
  name: 'The Moon in Dry Dock',
  category: 'bizarre',
  weirdness: 0.95,
  media: ['air', 'open'],
  async build(ctx) {
    const rng = ctx.rng;
    const detail = Math.min(1, Math.max(0.5, ctx.quality?.detail ?? 1));
    const dens = Math.min(1.3, Math.max(0.7, ctx.vary?.density ?? 1));
    const scene = new THREE.Scene();

    // ---- what this visit is like
    const vr = rng.fork('v7');
    const hourRoll = vr(), wRoll = vr(), lRoll = vr(), cRoll = vr(), kRoll = vr(), bRoll = vr(), jRoll = vr();
    let hour = ctx.vary?.hour;
    if (!LOOKS[hour]) hour = hourRoll < 0.46 ? 'day' : hourRoll < 0.76 ? 'golden' : 'dawn';
    const weather = hour === 'night' ? 'clear' : wRoll < 0.5 ? 'clear' : wRoll < 0.76 ? 'fret' : 'rain';
    const liveryName = lRoll < 0.27 ? 'whitewash' : lRoll < 0.72 ? 'ochre' : 'rose';
    const cast = cRoll < 0.5 ? 'gulls' : cRoll < 0.78 ? 'doves' : 'swifts';
    const nCres = kRoll < 0.25 ? 4 : kRoll < 0.6 ? 6 : kRoll < 0.8 ? 7 : 8;
    const boatKind = bRoll < 0.55 ? 'lateen' : 'drifter';
    const job = jRoll < 0.62 ? 'third' : 'half';
    const rare = !!ctx.vary?.rare;
    const LOOK = LOOKS[hour], LIV = LIVERY[liveryName];
    const PAL = ['#E9C98A', LIV.roof, '#EEF1F4', '#F8FBFF', '#3E6FA8', '#2B3A4A', '#8FD3E8'];
    const lin = (hex, k = 1) => { const c = new THREE.Color(hex); return [c.r * k, c.g * k, c.b * k]; };
    const vary = (c, r, a = 0.1) => { const k = 1 + (r() - 0.5) * 2 * a; return [c[0] * k, c[1] * k, c[2] * k]; };
    const col3 = (hex, k = 1) => new THREE.Color(hex).multiplyScalar(k);

    await ctx.yield();
    // ---- sky
    const sunV = new THREE.Vector3().fromArray(LOOK.sun).normalize();
    const skyOpts = { rng, preset: LOOK.preset, sunDirection: sunV, zenith: LOOK.zenith, horizon: LOOK.horizon,
      clouds: { coverage: LOOK.clouds, scale: 1.5, softness: 0.24, wind: [0.004, 0.012] }, clouds2: { coverage: 0.46, stretch: 1, opacity: 0.5, scale: 0.8 },
      quality: detail < 0.8 ? 0.5 : 1 };
    if (hour === 'night') { skyOpts.bodies = []; skyOpts.sunIntensity = 0; skyOpts.sunGlow = 0; skyOpts.stars = 1; skyOpts.key = 'sun'; }
    if (hour === 'day') { skyOpts.sunColor = '#FFF1D6'; skyOpts.scatter = 0.22; }
    const sky = makeSky(skyOpts);
    scene.add(sky.object);
    const fogC = col3(LOOK.fog);
    if (weather === 'fret') fogC.lerp(new THREE.Color('#F2F4F4'), 0.35);
    scene.fog = new THREE.FogExp2(fogC, LOOK.fogD * (weather === 'fret' ? 1.5 : weather === 'rain' ? 0.8 : 1));
    await ctx.yield();

    // ---- the hero, and the light everything shares
    const hero = await buildHero(ctx, { palette: PAL, detail, sunDir: LOOK.sun, job, journeySeconds: 43 });
    hero.object.position.set(0, -30, 0); hero.object.updateMatrixWorld(true);
    scene.add(hero.object);
    const sunCol = col3(LOOK.sunCol[0], LOOK.sunCol[1]), skyCol = col3(LOOK.skyCol[0], LOOK.skyCol[1]), gndCol = col3('#E9C98A', LOOK.gnd);
    const zenC = col3(LOOK.zenith, 0.9), horC = col3(LOOK.horizon, hour === 'night' ? 1 : 0.92);
    hero.setLight({ sunDir: LOOK.sun, sunColor: sunCol, skyColor: skyCol, groundColor: gndCol, zenith: zenC, horizon: horC, self: [LOOK.self * 0.9, LOOK.self, LOOK.self * 1.12],
      mirrorSun: hour === 'golden' ? dirOf(15, 236) : dirOf(hour === 'dawn' ? 9 : 17, 236) });
    const HU = hero.uniforms, glsl = hero.glsl;
    const OFF = 30;                                           // hero local y = world y + 30
    const A = hero.anchors;
    const WP = A.flyThrough.map((p) => [p.x, p.y - OFF, p.z]);
    const path = makePath(WP, { samples: 600 });
    await ctx.yield();

    // ---- shared uniforms and materials
    const roofData = new Uint8Array(256 * 4);
    const roofTex = new THREE.DataTexture(roofData, 256, 1, THREE.RGBAFormat, THREE.UnsignedByteType);
    roofTex.minFilter = roofTex.magFilter = THREE.LinearFilter; roofTex.generateMipmaps = false; roofTex.colorSpace = THREE.NoColorSpace;
    const cresU = []; for (let i = 0; i < 8; i++) cresU.push(new THREE.Vector4(0, 9999, 1, 1));
    const WU = {
      uSunDir: HU.uSunDir, uSunCol: HU.uSunCol, uSkyCol: HU.uSkyCol, uGndCol: HU.uGndCol, uMoonC: HU.uMoonC, uTime: HU.uTime,
      uProg: HU.uProg, uSecs: HU.uSecs,
      uRoofTex: { value: roofTex }, uCres: { value: cresU }, uHang: { value: new THREE.Vector4(0, 9999, 1, 0) }, uHangOn: { value: 0 },
      uWet: { value: weather === 'rain' ? 1 : 0 }, uNight: { value: LOOK.night },
      uShutA: { value: col3(LIV.shutA, 0.8) }, uShutB: { value: col3(LIV.shutB, 0.8) },
      uPud: { value: zenC.clone().lerp(horC, 0.25) }, uChalkC: { value: HU.uChalk.value }, uHorC: { value: horC }, uZenC: { value: zenC },
      uLamp: { value: new THREE.Color(LOOK.lamp * 0.55, LOOK.lamp * 0.8, LOOK.lamp * 1.25) },
      uWallC: { value: (() => { const c = new THREE.Color(0, 0, 0); for (const h of LIV.walls) c.add(new THREE.Color(h)); c.multiplyScalar(0.8 / LIV.walls.length); return c.multiply(skyCol.clone().multiplyScalar(0.9).add(sunCol.clone().multiplyScalar(0.45))); })() },
      uSeaC: { value: col3('#3E6FA8', hour === 'night' ? 0.25 : 0.5) },
      uSmoke: { value: skyCol.clone().multiplyScalar(1.2).add(sunCol.clone().multiplyScalar(0.45)) },
      uFret: { value: new THREE.Color(0.9, 0.93, 0.95).multiply(skyCol.clone().multiplyScalar(1.1).add(sunCol.clone().multiplyScalar(0.55))) },
    };
    const fogU = THREE.UniformsLib.fog;
    const mk = (vs, fs, extra = {}, o = {}) => new THREE.ShaderMaterial({ vertexShader: vs, fragmentShader: fs, fog: true, uniforms: { ...THREE.UniformsUtils.clone(fogU), ...WU, ...extra }, ...o });
    const stuffMat = mk(STUFF_VERT, stuffFrag(glsl), {}, { side: THREE.DoubleSide });
    const sheetMat = mk(SHEET_VERT, sheetFrag(glsl), {}, { side: THREE.DoubleSide });
    const STONE = (() => { const o = lin('#E9C98A', 0.26); return [o[0] + 0.17, o[1] + 0.185, o[2] + 0.19]; })();
    const OAK = [0.3, 0.215, 0.135], IRON = [0.09, 0.09, 0.1], ROOF = lin(LIV.roof, 0.7).map((v, i) => v * [0.92, 1.05, 1.25][i] + 0.015);
    const wallCols = LIV.walls.map((h) => lin(h, 0.86));
    const r2 = rng.fork('town');

    // ================================================================= the graving dock, the quays, the sea walls
    const dock = makeBuilder();
    const rect = (k) => ({ x: B_X + STEP * k, z0: B_Z0 - STEP * k, z1: B_Z1 + STEP * k });
    {
      const G = K.GROUND, S = K.STONE, fl = [STONE[0] * 0.95, STONE[1] * 0.95, STONE[2] * 0.95];
      const hq = (x0, x1, z0, z1, y, col, k = G) => dock.quad([x0, y, z1], [x1, y, z1], [x1, y, z0], [x0, y, z0], col, k);
      hq(-B_X, B_X, B_Z0, B_Z1, -30, fl);                                          // the dock floor
      for (let k = 0; k < 5; k++) {
        const r = rect(k), q = rect(k + 1), y0 = -30 + 6 * k, y1 = y0 + 6, c = vary(STONE, r2, 0.05);
        dock.wall(r.x, r.z0, r.x, r.z1, y0, y1, c, S); dock.wall(-r.x, r.z1, -r.x, r.z0, y0, y1, c, S);
        dock.wall(-r.x, r.z0, r.x, r.z0, y0, y1, c, S);
        dock.wall(r.x, r.z1, GW, r.z1, y0, y1, c, S); dock.wall(-GW, r.z1, -r.x, r.z1, y0, y1, c, S);
        for (const s of [-1, 1]) dock.wall(GW * s, s > 0 ? r.z1 : q.z1 + 0, GW * s, s > 0 ? q.z1 + 0 : r.z1, y0, y1, c, S);   // step ends at the gateway
        if (k < 4) {                                                               // the altar tread
          hq(r.x, q.x, q.z0, q.z1, y1, c, S); hq(-q.x, -r.x, q.z0, q.z1, y1, c, S);
          hq(-r.x, r.x, q.z0, r.z0, y1, c, S); hq(GW, r.x, r.z1, q.z1, y1, c, S); hq(-r.x, -GW, r.z1, q.z1, y1, c, S);
        }
      }
      const top = rect(5), X1 = 1400, Z0 = -1400;
      // quay level, around the basin and the gateway channel
      hq(top.x, X1, Z0, QUAY_Z1, 0, STONE); hq(QUAY_X0, -top.x, Z0, QUAY_Z1, 0, STONE);
      hq(-top.x, top.x, Z0, top.z0, 0, STONE); hq(GW, top.x, top.z1, QUAY_Z1, 0, STONE); hq(-top.x, -GW, top.z1, QUAY_Z1, 0, STONE);
      // gateway: dry sill, channel walls
      hq(-GW, GW, B_Z1, QUAY_Z1, -26, fl, S);
      dock.wall(GW, B_Z1, -GW, B_Z1, -30, -26, STONE, S);
      dock.wall(GW, top.z1, GW, QUAY_Z1, -30, 0, STONE, S); dock.wall(-GW, QUAY_Z1, -GW, top.z1, -30, 0, STONE, S);
      // sea walls
      dock.wall(GW, QUAY_Z1, X1, QUAY_Z1, -34, 0, STONE, S); dock.wall(QUAY_X0, QUAY_Z1, -GW, QUAY_Z1, -34, 0, STONE, S);
      dock.wall(-GW, QUAY_Z1, GW, QUAY_Z1, -34, -26, STONE, S);
      dock.wall(QUAY_X0, Z0, QUAY_X0, QUAY_Z1, -34, 0, STONE, S);
      // coping stones along the dock's lip and the sea walls
      const cop = [STONE[0] * 1.12, STONE[1] * 1.12, STONE[2] * 1.12], nos = [STONE[0] * 1.6, STONE[1] * 1.52, STONE[2] * 1.36];
      for (const s of [-1, 1]) dock.box(s * (top.x + 0.7), 0.2, (top.z0 + top.z1) / 2, 0.7, 0.2, (top.z1 - top.z0) / 2 + 1.4, cop, S);
      dock.box(0, 0.2, top.z0 - 0.7, top.x, 0.2, 0.7, cop, S);
      dock.box((400 + GW) / 2, 0.2, QUAY_Z1 - 0.8, (400 - GW) / 2, 0.2, 0.8, cop, S); dock.box((QUAY_X0 - GW) / 2, 0.2, QUAY_Z1 - 0.8, (-QUAY_X0 - GW) / 2, 0.2, 0.8, cop, S);
      dock.box(QUAY_X0 + 0.8, 0.2, -200, 0.8, 0.2, 380, cop, S);
      // the gate end: a projecting coping course, a pale nosing on every altar, rounded quoins at the gateway's corners
      for (const s of [-1, 1]) {
        dock.box(s * (GW + top.x) / 2, 0.22, top.z1 + 0.45, (top.x - GW) / 2, 0.26, 0.85, cop, S);
        for (let k = 0; k < 5; k++) {
          const r = rect(k), y1 = -24 + 6 * k;
          if (k < 4) dock.box(s * (GW + 0.2 + r.x) / 2, y1 - 0.3, r.z1 - 0.14, (r.x - GW - 0.2) / 2, 0.4, 0.36, nos, S);      // a deep nosing course: five pale bands that read from the far end of the dock
          if (k < 4) dock.box(s * (r.x - 0.12), y1 - 0.14, (r.z0 + r.z1) / 2, 0.34, 0.22, (r.z1 - r.z0) / 2, nos, S);
          dock.lathe(s * GW, r.z1, [[y1 - 6, 0.44], [y1 + 0.07, 0.44], [y1 + 0.07, 0]], 8, cop, S, { sd: 0.3 });
        }
        dock.lathe(s * GW, QUAY_Z1, [[-34, 0.5], [0.45, 0.5], [0.45, 0]], 8, cop, S, { sd: 0.3 });
        dock.box(s * (GW + 6), 4.66, 166.5, 6.4, 0.26, 7.9, cop, S, { bottom: true });
        for (const qz of [159, 174]) dock.lathe(s * GW, qz, [[0.4, 0.42], [4.4, 0.42]], 8, cop, S, { sd: 0.3 });
      }
      // gate piers with capstans, and the two timber leaves standing part open, mitred toward the sea
      for (const s of [-1, 1]) {
        dock.box(s * (GW + 6), 2.2, 166.5, 6, 2.2, 7.5, vary(STONE, r2, 0.04), S, { top: cop });
        dock.lathe(s * (GW + 6), 166.5, [[4.4, 1.2], [4.9, 1.0], [5.2, 0.62], [6.3, 0.55], [6.5, 0.9], [6.9, 0.9], [7.0, 0.3]], 10, IRON, K.PLAIN, { sd: 0.2 });
        for (let q = 0; q < 4; q++) { const a = q * Math.PI / 4 + s; dock.beam(s * (GW + 6) - Math.sin(a) * 2.6, 6.7, 166.5 - Math.cos(a) * 2.6, s * (GW + 6) + Math.sin(a) * 2.6, 6.7, 166.5 + Math.cos(a) * 2.6, 0.09, OAK, K.WOOD); }
        // leaf: 15 m long, from the sill to 4 m above the quay, 1.2 m thick, hinged at its seaward end and standing
        // 13 degrees off the channel wall, so its inner face (iron straps, posts, cross-braces) shows from the dock
        const TH = 0.15, cT = Math.cos(TH), sT = Math.sin(TH), hxL = s * (GW - 0.75), hzL = 160.4, gy0 = -26, gy1 = 4, tim = [0.5, 0.38, 0.24];
        const lp = (al, off) => [hxL - s * sT * al - s * cT * off, hzL + cT * al - sT * off];
        const yawL = -s * TH, cy = (gy0 + gy1) / 2, hy = (gy1 - gy0) / 2;
        { const c = lp(7.5, 0); dock.box(c[0], cy, c[1], 0.6, hy, 7.5, tim, K.WOOD, { sd: 0.3 + 0.2 * s, bottom: true, yaw: yawL }); }
        for (let b = 0; b <= 6; b++) { const c = lp(7.5, 0.7); dock.box(c[0], gy0 + 1 + b * 4.6, c[1], 0.1, 0.36, 7.56, IRON, K.PLAIN, { sd: 0.5, yaw: yawL }); }
        for (let b = 0; b <= 6; b++) for (const al of [1.6, 3.4, 6.6, 8.3, 11.4, 13.2]) {     // rust runs down from the straps
          const L = 0.7 + 1.9 * Math.abs(Math.sin(b * 12.9 + al * 7.13 + s) * 43758.5 % 1), c = lp(al, 0.615);
          dock.box(c[0], gy0 + 1 + b * 4.6 - 0.36 - L / 2, c[1], 0.012, L / 2, 0.06 + 0.05 * (L % 0.7), [0.34, 0.14, 0.05], K.PLAIN, { sd: 0.5, yaw: yawL });
        }
        for (const al of [0.45, 5.1, 9.9, 14.55]) { const c = lp(al, 0.74); dock.box(c[0], cy, c[1], 0.16, hy, 0.38, [0.24, 0.175, 0.115], K.WOOD, { sd: 0.7, yaw: yawL }); }
        for (let b = 0; b < 3; b++) for (let q = 0; q < 2; q++) {           // cross-braces between the posts, panel by panel
          const a0 = lp(q ? 5.5 : 0.9, 0.86), a1 = lp(q ? 9.5 : 4.7, 0.86), y0 = gy0 + 1.7 + b * 9.2, y1 = y0 + 8.2, up = (b + q) % 2;
          dock.beam(a0[0], up ? y0 : y1, a0[1], a1[0], up ? y1 : y0, a1[1], 0.2, [0.26, 0.19, 0.125], K.WOOD, { sd: 0.2 + 0.1 * b });
        }
        { const a0 = lp(10.3, 0.86), a1 = lp(14.2, 0.86); dock.beam(a0[0], gy0 + 1.7, a0[1], a1[0], gy1 - 1.6, a1[1], 0.24, [0.26, 0.19, 0.125], K.WOOD); }
        { const c = lp(0, 0); dock.lathe(c[0], c[1], [[gy0, 0.72], [gy1 + 0.5, 0.72], [gy1 + 0.6, 0.4], [gy1 + 0.9, 0.05]], 8, IRON, K.PLAIN, { sd: 0.4 }); }   // heel post
        for (let q = 0; q <= 5; q++) {                                       // the footway rail along the leaf's top
          const a = lp(0.6 + q * 2.8, 0.45), b2 = lp(0.6 + Math.min(q + 1, 5) * 2.8, 0.45);
          dock.beam(a[0], gy1, a[1], a[0], gy1 + 1.15, a[1], 0.05, IRON, K.PLAIN);
          if (q < 5) { dock.beam(a[0], gy1 + 1.1, a[1], b2[0], gy1 + 1.1, b2[1], 0.045, IRON, K.PLAIN); dock.beam(a[0], gy1 + 0.6, a[1], b2[0], gy1 + 0.6, b2[1], 0.035, IRON, K.PLAIN); }
        }
        // relief on the end wall beside the gateway: an iron ladder down the altars, mooring bollards on the lip
        for (const lxq of [26, 47]) {
          for (let k = 0; k < 5; k++) {
            const zz = B_Z1 + STEP * k - 0.16, y0 = -30 + 6 * k;
            for (const o of [-0.28, 0.28]) dock.beam(s * lxq + o, y0, zz, s * lxq + o, y0 + 6.9, zz, 0.045, IRON, K.PLAIN);
            for (let r = 0; r < 13; r++) dock.beam(s * lxq - 0.28, y0 + 0.4 + r * 0.5, zz, s * lxq + 0.28, y0 + 0.4 + r * 0.5, zz, 0.03, IRON, K.PLAIN);
            // the ladder's shadow on the wall behind it (the sun stands to +X and a little behind us): unlit stone, a hand's breadth proud
            const sdx = -0.16 * LOOK.sun[0] / Math.max(Math.abs(LOOK.sun[2]), 0.12), sdy = -0.16 * LOOK.sun[1] / Math.max(Math.abs(LOOK.sun[2]), 0.12), zw = zz + 0.16 - 0.015;
            if (LOOK.sun[2] < -0.05 && Math.abs(sdx) < 1.6) for (const o of [-0.28, 0.28]) dock.wall(s * lxq + o + sdx + 0.06, zw, s * lxq + o + sdx - 0.06, zw, y0 + 0.05, y0 + 5.95 + sdy, STONE, S, { l: 0 });
          }
        }
        for (const bz of [157.5, 176.5 - 3.4]) dock.lathe(s * (GW + 1.4), bz, [[0.4, 0.5], [0.7, 0.5], [0.75, 0.34], [1.4, 0.3], [1.5, 0.52], [1.66, 0.46], [1.7, 0.05]], 8, IRON, K.PLAIN, { sd: 0.6 });
        for (const bx of [34, 58, 84]) dock.lathe(s * bx, B_Z1 + STEP * 5 + 1.6, [[0.4, 0.42], [0.65, 0.42], [0.7, 0.3], [1.25, 0.27], [1.35, 0.45], [1.5, 0.4], [1.54, 0.05]], 7, IRON, K.PLAIN, { sd: 0.6 });
      }
      // the harbour light on one pier
      dock.lathe(-GW - 6, 171, [[4.4, 0.9], [4.8, 0.7], [11, 0.42], [11.2, 0.75], [11.4, 0.75]], 10, [0.78, 0.76, 0.7], K.PLAIN, { sd: 0.3 });
      dock.lathe(-GW - 6, 171, [[12.7, 0.62], [13.0, 0.66], [13.6, 0.05]], 8, IRON, K.PLAIN, { sd: 0.3 });
      // the mole, and its round head
      const MZ = 372;
      dock.box(-136, -16, MZ, 89, 17.6, 6, vary(STONE, r2, 0.04), S, { top: STONE });
      dock.box(-136, 2.2, MZ + 4.8, 89, 0.6, 1.2, cop, S);
      dock.lathe(-47, MZ, [[-34, 9.5], [1.6, 9.5], [1.6, 8.6], [2.4, 8.6], [2.4, 0]], 18, STONE, S, { sd: 0.3 });
      dock.lathe(-47, MZ, [[2.4, 1.5], [9.5, 1.05], [9.7, 1.6], [10, 1.6]], 10, [0.8, 0.78, 0.72], K.PLAIN);
      dock.lathe(-47, MZ, [[11.6, 1.2], [12.0, 1.25], [13.2, 0.05]], 8, lin(LIV.roof, 0.7), K.PLAIN);
      // bollards on the altars where the forty ropes come down
      for (const bo of A.bollards) {
        const p = bo.position, y = p.y - OFF;
        dock.lathe(p.x, p.z, [[y, 0.42], [y + 0.25, 0.42], [y + 0.3, 0.3], [y + 0.85, 0.27], [y + 0.95, 0.45], [y + 1.08, 0.4], [y + 1.12, 0.05]], 7, IRON, K.PLAIN, { sd: 0.6 });
      }
    }
    await ctx.yield();

    // ================================================================= the arcaded street
    const street = makeBuilder(), sheets = makeSheets();
    const rows = { '-1': [], '1': [] };
    const shutterHouses = [];
    for (const s of [-1, 1]) {
      let x = ST_X0 + (s < 0 ? 0 : BAY * 2);
      while (x < ST_X1 + 40) {
        const bays = r2.int(2, 3), w = bays * BAY;
        rows[s].push({ x0: x, x1: x + w, bays, top: r2.range(15, 18.6), col: vary(r2.pick(wallCols), r2, 0.06), sd: r2() });
        x += w;
        if (r2.chance(s < 0 ? 0.36 : 0.2)) x += BAY;          // an alley: a bar of sun across the cobbles
      }
    }
    for (const s of [-1, 1]) {
      const zf = ST_Z + 6.5 * s, zb = zf + 4 * s, zr = zf + 11.5 * s, colSet = new Set();
      rows[s].forEach((H, hi) => {
        const { x0, x1, top, col } = H, hUp = top - 5;
        const real = ((hi === 2 || hi === 5 || hi === 8) && x0 < 450) || (x1 > 415 && x0 < 453);   // and the houses beside the entry
        const sd = H.sd + (real ? 2 : 0);
        const o = { sd, l: 1 };
        // upper storeys over the arcade (faces the street)
        if (s < 0) street.wall(x0, zf, x1, zf, 5, top, col, K.WALL, { ...o, h: hUp }); else street.wall(x1, zf, x0, zf, 5, top, col, K.WALL, { ...o, h: hUp });
        if (real) shutterHouses.push({ x0, x1, top, s, zf });
        // arches
        const plain = { sd, l: 1, u0: 0, u1: 1, v0: 99, v1: 99, w: 1, h: 0 };
        for (let i = 0; i < H.bays; i++) {
          const xc = x0 + (i + 0.5) * BAY, R = 1.4, y0 = 3.2, NS = 8;
          street.quad([xc - BAY / 2, y0, zf], [xc - R, y0, zf], [xc - R, 5, zf], [xc - BAY / 2, 5, zf], col, K.WALL, plain);
          street.quad([xc + R, y0, zf], [xc + BAY / 2, y0, zf], [xc + BAY / 2, 5, zf], [xc + R, 5, zf], col, K.WALL, plain);
          for (let j = 0; j < NS; j++) {
            const a0 = Math.PI * j / NS, a1 = Math.PI * (j + 1) / NS;
            const xa = xc - R * Math.cos(a0), ya = y0 + R * Math.sin(a0), xb = xc - R * Math.cos(a1), yb = y0 + R * Math.sin(a1);
            street.quad([xa, ya, zf], [xb, yb, zf], [xb, 5, zf], [xa, 5, zf], col, K.WALL, plain);
            street.quad([xa, ya, zf], [xb, yb, zf], [xb, yb, zf + 0.6 * s], [xa, ya, zf + 0.6 * s], [col[0] * 0.8, col[1] * 0.8, col[2] * 0.8], K.WALL, { ...plain, l: 0.5 });
            if (x1 > 404) {
              const R2 = R + 0.26, zp = zf - 0.09 * s, pale = [0.6, 0.57, 0.5], key = j === 3 || j === 4;
              const xa2 = xc - R2 * Math.cos(a0), ya2 = y0 + R2 * Math.sin(a0), xb2 = xc - R2 * Math.cos(a1), yb2 = y0 + R2 * Math.sin(a1), zq = key ? zp - 0.05 * s : zp;
              street.quad([xa, ya, zq], [xb, yb, zq], [xb2, yb2, zq], [xa2, ya2, zq], key ? [0.66, 0.63, 0.55] : pale, K.PLAIN, { sd: 0.2 });
              street.quad([xa2, ya2, zq], [xb2, yb2, zq], [xb2, yb2, zf], [xa2, ya2, zf], [0.42, 0.4, 0.36], K.PLAIN, { sd: 0.2 });
              street.quad([xa, ya, zq], [xb, yb, zq], [xb, yb, zf], [xa, ya, zf], [0.34, 0.32, 0.3], K.PLAIN, { sd: 0.2, l: 0.6 });
            }
          }
        }
        for (let i = 0; i <= H.bays; i++) colSet.add(Math.round((x0 + i * BAY) * 10));
        // under the arcade: vault, shop wall; then sides, back and roof
        street.quad([x0, 5, zf], [x1, 5, zf], [x1, 5, zb], [x0, 5, zb], [col[0] * 0.7, col[1] * 0.7, col[2] * 0.7], K.PLAIN, { sd, l: 0.5 });
        street.wall(x0, zb, x1, zb, 0, 5, col, K.SHOP, { sd, l: 0.5, u0: x0 - ST_X0, u1: x1 - ST_X0 });
        for (const xs of [x0, x1]) {
          street.wall(xs, zb, xs, zr, 0, top, col, K.WALL, { sd, v0: -5, h: hUp });
          street.wall(xs, zf, xs, zb, 5, top, col, K.WALL, { sd, v0: 0, h: hUp });
        }
        street.wall(x0, zr, x1, zr, 0, top, col, K.WALL, { sd, v0: -5, h: hUp });
        const zA = Math.min(zf, zr), zB = Math.max(zf, zr);
        const ridge = addHouse(street, x0, x1, zA, zB, 0, top, 0, col, vary(ROOF, r2, 0.12), sd, { noS: 1, noN: 1, noE: 1, noW: 1, pitch: 0.3 });
        H.ridge = ridge;
        if (r2.chance(0.8)) {                                 // chimney
          const cx = r2.range(x0 + 1, x1 - 1), cz = (zA + zB) / 2 + r2.range(-3, 3);
          street.box(cx, top + 2.1, cz, 0.45, 2.1, 0.45, [col[0] * 0.9, col[1] * 0.9, col[2] * 0.9], K.PLAIN, { sd, top: [0.05, 0.05, 0.05] });
          H.chimney = [cx, top + 4.3, cz];
        }
      });
      for (const key of colSet) {
        const x = key / 10, c = vary([STONE[0] * 1.3, STONE[1] * 1.22, STONE[2] * 1.1], r2, 0.06);
        if (x < 404) { street.lathe(x, zf, [[0, 0.44], [0.3, 0.44], [0.38, 0.31], [2.95, 0.27], [3.02, 0.4], [3.2, 0.44]], 10, c, K.PLAIN, { sd: 0.11 }); continue; }
        const cd = [c[0] * 0.8, c[1] * 0.8, c[2] * 0.82];
        street.box(x, 0.11, zf, 0.5, 0.11, 0.5, cd, K.PLAIN, { sd: 0.11 });
        street.lathe(x, zf, [[0.22, 0.4], [0.27, 0.455], [0.33, 0.47], [0.39, 0.44], [0.43, 0.36], [0.5, 0.335], [1.3, 0.325], [2.2, 0.295], [2.74, 0.27], [2.76, 0.315], [2.82, 0.315], [2.84, 0.27], [2.9, 0.275], [2.97, 0.34], [3.03, 0.43], [3.06, 0.43]], 14, c, K.PLAIN, { sd: 0.11 });
        street.box(x, 3.13, zf, 0.5, 0.07, 0.5, [c[0] * 1.06, c[1] * 1.06, c[2] * 1.06], K.PLAIN, { sd: 0.11, bottom: true });
      }
      // the roofline the street's shadow is cast from
      for (let t = 0; t < 256; t++) {
        const x = 340 + (t + 0.5) / 256 * 160; let h = 0;
        for (const H of rows[s]) if (x >= H.x0 && x <= H.x1) h = (H.top + H.ridge) / 2;
        roofData[t * 4 + (s < 0 ? 0 : 1)] = Math.round(Math.min(1, h / 32) * 255);
      }
    }
    roofTex.needsUpdate = true;
    await ctx.yield();

    // ---- what the street holds: shutters that swing, geraniums, laundry, a vine, cafe tables, lemons, a bicycle, a cat
    const leaves = makeSheets();
    const clothCols = LIV.cloth.map((h) => lin(h, 0.82));
    const TERRA = lin('#C8643C', 0.75), GREEN = [0.1, 0.22, 0.07];
    for (const H of shutterHouses) {
      const W = H.x1 - H.x0, nW = Math.max(1, Math.floor(W / 3.1)), cw = W / nW, hUp = H.top - 5, nz = -H.s;
      const shc = lin(r2.chance(0.5) ? LIV.shutA : LIV.shutB, 0.8);
      for (let fl = 0; (fl + 1) * 3.5 <= hUp + 0.6; fl++) for (let ci = 0; ci < nW; ci++) {
        const u = (ci + 0.5) * cw, x = H.s < 0 ? H.x0 + u : H.x1 - u, y = 5 + fl * 3.5 + 1.8;
        for (const side of [-1, 1]) {
          sheets.add([x + side * 0.55, y - 0.92, H.zf + nz * 0.07], [-side * 0.53, 0, 0], [0, 1.84, 0], [0, 0, nz * 0.53], vary(shc, r2, 0.15),
            [r2.range(0, 30), r2.chance(0.5) ? r2.range(0.25, 0.5) : r2.range(0.04, 0.12), 2, r2.range(1.8, 2.6)]);
        }
        const ys = y - 0.98, STN = [0.62, 0.6, 0.54];
        street.box(x, y + 1.02, H.zf + nz * 0.09, 0.74, 0.09, 0.09, STN, K.PLAIN, { bottom: true });          // lintel
        for (const side of [-1, 1]) street.box(x + side * 0.62, y, H.zf + nz * 0.05, 0.06, 0.93, 0.05, STN, K.PLAIN);   // jambs standing proud
        if (fl > 0 && H.x1 > 415 && r2.chance(0.34)) {                                                       // a little iron balcony
          const zc = H.zf + nz * 0.42;
          street.box(x, ys - 0.02, zc, 0.98, 0.07, 0.42, STN, K.PLAIN, { bottom: true });
          for (let q = 0; q <= 6; q++) street.beam(x - 0.93 + q * 0.31, ys, zc + nz * 0.38, x - 0.93 + q * 0.31, ys + 0.95, zc + nz * 0.38, 0.022, IRON, K.PLAIN);
          street.beam(x - 0.95, ys + 0.95, zc + nz * 0.38, x + 0.95, ys + 0.95, zc + nz * 0.38, 0.03, IRON, K.PLAIN);
          for (const side of [-1, 1]) street.beam(x + side * 0.95, ys + 0.95, zc - nz * 0.4, x + side * 0.95, ys + 0.95, zc + nz * 0.38, 0.03, IRON, K.PLAIN);
          continue;
        }
        street.box(x, ys, H.zf + nz * 0.2, 0.82, 0.06, 0.2, STN, K.PLAIN, { bottom: true });
        if (r2.chance(0.75)) for (const dx of [-0.42, 0, 0.42]) {
          if (r2.chance(0.25)) continue;
          street.box(x + dx, ys + 0.2, H.zf + nz * 0.24, 0.13, 0.14, 0.13, TERRA, K.PLAIN);
          street.blob(x + dx, ys + 0.5, H.zf + nz * 0.26, 0.26, 0.2, 0.24, GREEN, r2, { seg: 5, rows: 3 });
          street.blob(x + dx + r2.range(-0.1, 0.1), ys + 0.64, H.zf + nz * 0.3, 0.13, 0.09, 0.12, lin(r2.chance(0.7) ? '#D8342A' : '#E86A8A', 0.9), r2, { seg: 4, rows: 2 });
        }
      }
    }
    const topAt = (s, x) => { for (const H of rows[s]) if (x > H.x0 + 0.4 && x < H.x1 - 0.4) return H.top; return 0; };
    for (const [lx, ly, hMin, hMax] of [[404.5, 12.3, 1.9, 2.6], [390.5, 13.2, 1.7, 2.4]]) {
      const zA = ST_Z - 6.5, span = 13, sag = 0.1;
      sheets.add([lx, ly, zA], [0, 0, span], [0, 1, 0], [1, 0, 0], [0.3, 0.26, 0.2], [0, sag, 3, 0.05]);
      let q = r2.range(0.05, 0.09);
      while (q < 0.93) {
        const w = r2.range(1.3, 2.5), h = r2.range(hMin, hMax);
        if (q + w / span > 0.96) break;
        const qm = q + w / span / 2, yl = ly - sag * 4 * qm * (1 - qm), white = r2.chance(0.55);
        sheets.add([lx, yl - h, zA + q * span], [0, 0, w], [0, h, 0], [1, 0, 0], vary(white ? clothCols[0] : r2.pick(clothCols), r2, 0.06), [r2.range(0, 30), r2.range(0.95, 1.35), 0, 0]);
        q += w / span + r2.range(0.012, 0.045);
      }
    }
    for (const lx0 of [384, 396]) {             // beyond x 376 a line crosses the Moon's disc as seen from the entry (and through the portal before it): washing there hangs only by the walls, and nothing hangs near the entry
      let x = lx0 + r2.range(-1, 1), tS = topAt(-1, x), tN = topAt(1, x);
      if (!tS || !tN) { x += BAY; tS = topAt(-1, x); tN = topAt(1, x); }
      if (!tS || !tN) continue;
      const y = Math.min(tS, tN) - 0.5, zA = ST_Z - 6.5, span = 13, sag = 0.08;
      sheets.add([x, y, zA], [0, 0, span], [0, 1, 0], [1, 0, 0], [0.1, 0.085, 0.07], [0, sag, 3, 0.05]);
      let q = r2.range(0.06, 0.14);
      while (q < 0.9) {
        const w = r2.range(1.0, 2.5), h = r2.range(0.9, 1.7);
        if (q + w / span > 0.95) break;
        const qc = q + w / span / 2;
        if (r2.chance(0.9) && (lx0 < 376 || Math.abs(qc - 0.5) > 0.36)) {
          const qm = q + w / span / 2, yl = y - sag * 4 * qm * (1 - qm);
          sheets.add([x, yl - h, zA + q * span], [0, 0, w], [0, h, 0], [1, 0, 0], vary(r2.pick(clothCols), r2, 0.08), [r2.range(0, 30), r2.range(0.45, 0.85), 0, 0]);
        }
        q += w / span + r2.range(0.01, 0.06);
      }
    }
    for (const bx0 of [360]) {          // strings of little flags, far down the street where they hang below the Moon's disc
      let x = bx0, tS = topAt(-1, x), tN = topAt(1, x);
      if (!tS || !tN) { x += BAY; tS = topAt(-1, x); tN = topAt(1, x); }
      if (!tS || !tN) continue;
      const y = Math.min(tS, tN, 14.6) - 2.6, zA = ST_Z - 6.5, span = 13, sag = 0.11, n = 17;
      sheets.add([x, y, zA], [0, 0, span], [0, 1, 0], [1, 0, 0], [0.1, 0.085, 0.07], [0, sag, 3, 0.04]);
      for (let i = 0; i < n; i++) {
        const q = (i + 0.5) / n, yl = y - sag * 4 * q * (1 - q), w = 0.5, h = r2.range(0.55, 0.75);
        sheets.add([x, yl - h, zA + q * span - w / 2], [0, 0, w], [0, h, 0], [1, 0, 0], vary(clothCols[(i + (bx0 | 0)) % clothCols.length], r2, 0.06), [r2.range(0, 30), r2.range(0.5, 0.9), 0, 0]);
      }
    }
    {                                                           // striped awnings let down over some of the arcades, bellying in the sea air
      const ar = rng.fork('awnings'), cols = [LIV.roof ? lin(LIV.roof, 0.9) : [0.6, 0.2, 0.1], [0.2, 0.34, 0.52], [0.62, 0.5, 0.2], [0.25, 0.42, 0.3]];
      for (const s of [-1, 1]) for (const H of rows[s]) {
        if (!ar.chance(H.x0 > 410 ? 0.92 : 0.5) || H.x0 < 366) continue;
        const zf = ST_Z + s * 6.5, w = H.x1 - H.x0 - 0.7, c = vary(ar.pick(cols), ar, 0.1), drop = ar.range(1.0, 1.5), out = ar.range(1.9, 2.5);
        const aph = ar.range(0, 30), near = H.x0 > 426, amp = ar.range(0.14, 0.26);
        if (H.x1 > 422 && H.x0 < 447) continue;
        sheets.add([H.x0 + 0.35, 6.55 - drop, zf - s * out], [w, 0, 0], [0, drop, s * out], [0, 1, 0.4 * s], c, [aph, amp * (near ? 2.3 : 1), 1, 0]);
        if (H.x0 > 398) sheets.add([H.x0 + 0.35, 6.55 - drop - 0.46, zf - s * out], [w, 0, 0], [0, 0.5, 0], [0, 0, -s], c, [aph, near ? 0.34 : 0.2, 0, 0]);
      }
    }
    {                                                           // the vine over one arcade on the sunny side
      const sSun = LOOK.sun[2] < 0 ? 1 : -1, H = rows[sSun][3], zf = ST_Z + 6.5 * sSun, out = -sSun;
      street.beam(H.x0 + 0.1, 0, zf + out * 0.5, H.x0 + 0.3, 5.2, zf + out * 0.45, 0.07, [0.2, 0.15, 0.1], K.WOOD);
      const nLeaf = Math.round(380 * detail);
      for (let i = 0; i < nLeaf; i++) {
        const x = r2.range(H.x0 - 0.4, H.x1 + 0.4), t = r2();
        const y = 3.0 + 3.6 * Math.sqrt(t) - 1.2 * Math.max(0, Math.cos((x - H.x0) / BAY * TAU)) * r2();
        const sz = r2.range(0.3, 0.55), yaw = r2.range(-0.9, 0.9);
        const g = r2.range(0.7, 1.5);
        leaves.add([x, y, zf + out * r2.range(0.12, 0.55)], [Math.cos(yaw) * sz, 0, Math.sin(yaw) * sz], [0, sz * 1.15, 0], [-Math.sin(yaw) * sz, 0, Math.cos(yaw) * sz],
          [0.09 * g, 0.2 * g, 0.05 * g], [r2.range(0, 60), r2.range(0.25, 0.7), 4, 0]);
      }
      // cafe tables in the sun, a few chairs
      const zt = ST_Z + sSun * 4.9;
      for (const tx of [371, 374.6, 401, 404.8, 433]) {
        const x = tx + r2.range(-0.4, 0.4), z = zt + r2.range(-0.3, 0.3), cl = vary(r2.pick([clothCols[0], clothCols[0], clothCols[1]]), r2, 0.05);
        street.lathe(x, z, [[0.42, 0.66], [0.6, 0.6], [0.745, 0.57], [0.76, 0.0]], 12, cl, K.PLAIN, { sd: r2() });
        street.lathe(x, z, [[0, 0.24], [0.04, 0.05], [0.5, 0.04]], 6, IRON, K.PLAIN);
        street.lathe(x + 0.15, z - 0.1, [[0.76, 0.05], [0.84, 0.06], [0.95, 0.025], [1.0, 0.03]], 6, [0.3, 0.42, 0.34], K.PLAIN);
        for (let c = 0; c < 2; c++) {
          const a = r2.range(0, TAU), cx = x + Math.sin(a) * 0.95, cz = z + Math.cos(a) * 0.95, wc = [0.2, 0.3, 0.42];
          street.box(cx, 0.45, cz, 0.21, 0.025, 0.21, wc, K.PLAIN, { yaw: a, bottom: true });
          street.box(cx + Math.sin(a) * 0.2, 0.72, cz + Math.cos(a) * 0.2, 0.21, 0.26, 0.02, wc, K.PLAIN, { yaw: a, bottom: true });
          for (const [lx, lz] of [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]]) street.box(cx + lx, 0.22, cz + lz, 0.02, 0.22, 0.02, wc, K.PLAIN);
        }
      }
      // crates of lemons by the columns
      for (const [cx, cs] of [[388.2, sSun], [389.1, sSun], [417.6, -sSun], [445, sSun]]) {
        const z = ST_Z + cs * 5.6, n = r2.int(1, 3);
        for (let k = 0; k < n; k++) {
          const y = 0.2 + k * 0.4, yaw = r2.range(-0.3, 0.3), x = cx + r2.range(-0.05, 0.05);
          street.box(x, y, z, 0.36, 0.19, 0.26, vary([0.42, 0.32, 0.18], r2, 0.1), K.WOOD, { yaw, sd: r2(), top: [0.1, 0.08, 0.05] });
          if (k === n - 1) for (let i = 0; i < 9; i++) street.blob(x + ((i % 3) - 1) * 0.2, y + 0.2, z + (Math.floor(i / 3) - 1) * 0.15, 0.09, 0.075, 0.08, lin('#F2D21F', 0.85), r2, { seg: 4, rows: 2, rough: 0 });
        }
      }
      // a bicycle leaning on a column
      {
        const bx = 396.5, bz = ST_Z + sSun * 5.75, lean = -sSun * 0.16, fr = [0.08, 0.2, 0.3], T = 0.022;
        const wheel = (cx) => { for (let i = 0; i < 12; i++) { const a0 = i / 12 * TAU, a1 = (i + 1) / 12 * TAU, r = 0.34;
          street.beam(cx + Math.cos(a0) * r, 0.35 + Math.sin(a0) * r, bz + lean * Math.sin(a0) * r, cx + Math.cos(a1) * r, 0.35 + Math.sin(a1) * r, bz + lean * Math.sin(a1) * r, T, [0.06, 0.06, 0.06], K.PLAIN);
          if (i % 2 === 0) street.beam(cx, 0.35, bz, cx + Math.cos(a0) * r, 0.35 + Math.sin(a0) * r, bz + lean * Math.sin(a0) * r, 0.008, [0.5, 0.5, 0.52], K.PLAIN); } };
        wheel(bx - 0.52); wheel(bx + 0.52);
        const P0 = [bx - 0.52, 0.35], P1 = [bx - 0.08, 0.33], P2 = [bx - 0.22, 0.88], P3 = [bx + 0.36, 0.9], P4 = [bx + 0.52, 0.35], P5 = [bx + 0.34, 1.02];
        for (const [a, c] of [[P0, P1], [P1, P2], [P0, P2], [P2, P3], [P1, P3], [P3, P4], [P3, P5]]) street.beam(a[0], a[1], bz + lean * (a[1] - 0.35), c[0], c[1], bz + lean * (c[1] - 0.35), T, fr, K.PLAIN);
        street.box(bx - 0.24, 0.95, bz + lean * 0.6, 0.12, 0.025, 0.06, [0.12, 0.08, 0.05], K.PLAIN);
        street.beam(bx + 0.34, 1.02, bz + lean * 0.67 - 0.24, bx + 0.34, 1.02, bz + lean * 0.67 + 0.24, T, [0.4, 0.4, 0.42], K.PLAIN);
      }
    }
    // the cat asleep on a barrel in the sun; it lifts its head as we pass
    const cat = { head: null, pivot: new THREE.Vector3() };
    {
      const sSun = LOOK.sun[2] < 0 ? 1 : -1, cx = 428.5, cz = ST_Z + sSun * 5.5, fur = hour === 'night' ? [0.5, 0.5, 0.5] : [0.62, 0.36, 0.14];
      street.lathe(cx, cz, [[0, 0.36], [0.45, 0.43], [0.9, 0.36], [0.9, 0]], 10, [0.3, 0.22, 0.13], K.WOOD, { sd: 0.4 });
      street.blob(cx, 1.03, cz, 0.3, 0.14, 0.2, fur, r2, { seg: 8, rows: 5, rough: 0.05 });
      street.blob(cx + 0.2, 0.96, cz + sSun * -0.17, 0.2, 0.05, 0.06, [fur[0] * 0.8, fur[1] * 0.8, fur[2] * 0.8], r2, { seg: 5, rows: 3, rough: 0 });
      const hb = makeBuilder();
      hb.blob(0, 0.03, 0.02, 0.1, 0.085, 0.1, fur, r2, { seg: 7, rows: 4, rough: 0 });
      for (const sx of [-1, 1]) hb.tri([sx * 0.085, 0.07, 0.02], [sx * 0.025, 0.1, 0.02], [sx * 0.07, 0.19, 0.0], [fur[0] * 0.7, fur[1] * 0.7, fur[2] * 0.7], K.PLAIN);
      cat.head = hb.mesh(stuffMat); cat.head.matrixAutoUpdate = true; cat.head.frustumCulled = false;
      cat.pivot.set(cx - 0.27, 1.04, cz); cat.head.position.copy(cat.pivot);
      scene.add(cat.head);
    }
    await ctx.yield();

    // ================================================================= the town behind: rows of houses climbing a hill
    const town = makeBuilder(), chimneys = [];
    for (const s of [-1, 1]) for (const H of rows[s]) if (H.chimney && H.x0 < 470) chimneys.push(H.chimney);
    const hillY = (x, z) => 0.105 * Math.max(0, Math.max(x - 415, -z - 295));
    const blocked = (x0, x1, z0, z1) => (x1 > 344 && x0 < ST_X1 + 60 && z1 > ST_Z - 19.5 && z0 < ST_Z + 19.5) || (x1 > 286 && x0 < 314 && z1 > -86 && z0 < -54);
    const rowsBlock = async (xa, xb, za, zb, thin) => {
      let pair = 0;
      for (let z = za; z + 9 < zb;) {
        await ctx.yield();
        const depth = r2.range(9, 12.5);
        for (let x = xa + r2.range(0, 5); x + 7 < xb;) {
          const w = r2.range(7, 13), far = Math.max(x - 520, -z - 360, 0);
          const skip = r2.chance(0.07) || (far > 0 && r2() > thin);
          if (!skip && !blocked(x, x + w, z, z + depth)) {
            const y0 = hillY(x + w / 2, z + depth / 2), h = r2.chance(0.08) ? r2.range(15, 19) : r2.range(8.5, 14.5), sd = r2();
            const topY = addHouse(town, x, x + w, z, z + depth, y0, h, r2.chance(0.82) ? 0 : 1, vary(r2.pick(wallCols), r2, 0.07), vary(ROOF, r2, 0.14), sd);
            if (chimneys.length < 26 && r2.chance(0.05) && x < 520 && z > -400) {
              town.box(x + w / 2, topY + 0.6, z + depth / 2 + 1.5, 0.4, 1.3, 0.4, STONE, K.PLAIN, { top: [0.05, 0.05, 0.05] });
              chimneys.push([x + w / 2, topY + 2, z + depth / 2 + 1.5]);
            }
          }
          x += w + (r2.chance(0.14) ? r2.range(3, 7) : 0);
        }
        z += depth + (pair++ % 2 ? r2.range(5, 7.5) : 0.2);
      }
    };
    await ctx.yield();
    await rowsBlock(354, 735, -335, 168, 0.35 + 0.65 * detail * Math.min(1, dens));
    await ctx.yield();
    await rowsBlock(-212, 350, -500, -240, 0.35 + 0.65 * detail * Math.min(1, dens));
    // the bell tower, and two umbrella pines beside it
    const bell = { mesh: null };
    {
      const tx = 300, tz = -70, c = vary(wallCols[1], r2, 0.03), st = [STONE[0] * 1.2, STONE[1] * 1.2, STONE[2] * 1.2];
      town.box(tx, 13.5, tz, 3.2, 13.5, 3.2, c, K.STONE, { sd: 0.4 });
      town.box(tx, 27.3, tz, 3.6, 0.35, 3.6, st, K.STONE);
      for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) town.box(tx + sx * 2.5, 30.2, tz + sz * 2.5, 0.65, 2.6, 0.65, c, K.STONE);
      town.box(tx, 33.4, tz, 3.4, 0.7, 3.4, c, K.STONE); town.box(tx, 34.3, tz, 3.8, 0.25, 3.8, st, K.STONE);
      const ap = [tx, 38.4, tz], rc = vary(ROOF, r2, 0.05), e = 3.9, y = 34.5;
      town.tri([tx - e, y, tz + e], [tx + e, y, tz + e], ap, rc, K.ROOF, { ua: 0, va: 6, ub: 8, vb: 6, uc: 4, vc: 0 }); town.tri([tx + e, y, tz + e], [tx + e, y, tz - e], ap, rc, K.ROOF, { ua: 0, va: 6, ub: 8, vb: 6, uc: 4, vc: 0 });
      town.tri([tx + e, y, tz - e], [tx - e, y, tz - e], ap, rc, K.ROOF, { ua: 0, va: 6, ub: 8, vb: 6, uc: 4, vc: 0 }); town.tri([tx - e, y, tz - e], [tx - e, y, tz + e], ap, rc, K.ROOF, { ua: 0, va: 6, ub: 8, vb: 6, uc: 4, vc: 0 });
      town.beam(tx - 2.4, 32.4, tz, tx + 2.4, 32.4, tz, 0.14, OAK, K.WOOD);
      const bb = makeBuilder(), br = [0.34, 0.25, 0.1];
      bb.lathe(0, 0, [[-1.9, 1.0], [-1.75, 0.92], [-1.1, 0.6], [-0.55, 0.5], [-0.3, 0.3], [-0.2, 0.0]], 10, br, K.PLAIN, { sd: 0.2 });
      bb.lathe(0, 0, [[-2.1, 0.12], [-1.9, 0.12], [-1.9, 0.0]], 5, IRON, K.PLAIN);
      bell.mesh = bb.mesh(stuffMat); bell.mesh.matrixAutoUpdate = true; bell.mesh.frustumCulled = false; bell.mesh.position.set(tx, 32.3, tz);
      scene.add(bell.mesh);
      for (const [px, pz, ph] of [[315, -52, 15.5], [283, -90, 13]]) {
        town.beam(px, 0, pz, px + 1.2, ph * 0.72, pz - 0.8, 0.34, [0.23, 0.15, 0.1], K.WOOD);
        for (let q = 0; q < 3; q++) { const a = q * 2.1 + px; town.beam(px + 1.2, ph * 0.72, pz - 0.8, px + 1.2 + Math.sin(a) * 2.8, ph * 0.93, pz - 0.8 + Math.cos(a) * 2.8, 0.16, [0.23, 0.15, 0.1], K.WOOD); }
        for (let q = 0; q < 6; q++) { const a = q / 6 * TAU, rr = q ? 3.4 : 0; town.blob(px + 1.2 + Math.sin(a) * rr, ph + (q ? 0 : 0.9), pz - 0.8 + Math.cos(a) * rr, r2.range(3, 4), r2.range(1.2, 1.7), r2.range(3, 4), [0.07, 0.17, 0.07], r2, { seg: 8, rows: 5, rough: 0.3 }); }
      }
      // far hills behind the town, two ranges fading into the haze
      for (const [rad, hgt, tint] of [[1330, 150, 0.9], [2050, 330, 1.0]]) {
        const N = 64, a0 = 20 * D2R, a1 = 262 * D2R; let prev = null;
        for (let i = 0; i <= N; i++) {
          const f = i / N, a = a0 + (a1 - a0) * f, taper = Math.pow(Math.sin(Math.PI * f), 0.45);
          const h = hgt * taper * (0.45 + 0.55 * Math.abs(ctx.noise.fbm2(f * 5.3 + rad, 1.7, 4))) + 4;
          const cur = [Math.sin(a) * rad, Math.cos(a) * rad, h];
          if (prev) town.quad([cur[0], 0, cur[1]], [prev[0], 0, prev[1]], [prev[0], prev[2], prev[1]], [cur[0], cur[2], cur[1]], [0.3 * tint, 0.33 * tint, 0.2 * tint], K.PLAIN, { sd: 0.5 });
          prev = cur;
        }
      }
    }
    await ctx.yield();

    // ================================================================= the quay: spare crescents on trestles, timber, carts
    const quay = makeBuilder();
    const crescents = [];                                      // { mesh, mat (uMoonMat), world }
    const CR = 208, CHL = 75, CHW = 15, CTH = 1.4;
    const cresGeo = crescentGeometry(CR, CHL, CHW, CTH, Math.round(40 + 16 * detail), 10);
    const tipY = Math.sqrt(CR * CR - CHL * CHL - (CHW * 0.54) ** 2);
    const toHero = new THREE.Matrix4().makeTranslation(0, OFF, 0);
    const addCrescent = (world, mode = 1) => {
      const um = new THREE.Matrix4().multiplyMatrices(toHero, world);
      const mesh = new THREE.Mesh(cresGeo, hero.crescentMaterial(CR, um, mode));
      mesh.matrixAutoUpdate = false; mesh.matrix.copy(world); mesh.frustumCulled = false;
      const c = { mesh, um, world: world.clone() };
      crescents.push(c); return c;
    };
    const cresPoint = (world, s, w, r, out) => {                // a point of the shell in world space
      const x = s * CHL, half = CHW * Math.pow(Math.max(1 - s * s, 0), 0.62) + 0.25, z = CHW * 0.9 * (s * s - 0.4) + w * half;
      const y = Math.sqrt(Math.max(CR * CR - x * x - z * z, 1)), k = r / Math.hypot(x, y, z);
      return out.set(x * k, y * k, z * k).applyMatrix4(world);
    };
    {
      const perStack = Math.min(3, Math.floor(nCres / 2)), m1 = new THREE.Matrix4(), m2 = new THREE.Matrix4(), m3 = new THREE.Matrix4(), m4 = new THREE.Matrix4();
      const pa = new THREE.Vector3(), pb = new THREE.Vector3(), pc = new THREE.Vector3();
      let ci = 0; const ghostB = makeBuilder();
      for (const s of [-1, 1]) for (let i = 0; i < (s < 0 ? perStack : nCres - perStack); i++) {
        await ctx.yield();
        // the concave silver edge towards the lane, the chalk back leaning out over it; each one propped on the last
        const lean = (0.3 + 0.07 * i + r2.range(-0.03, 0.03)) * -s, zEdge = ST_Z + s * (18.5 + i * 15.5), cx = 247 + r2.range(-6, 6) + i * 4;
        m1.makeTranslation(cx, 1.6 + i * 5.6, zEdge);
        m2.makeRotationX(lean);
        m3.makeRotationY(s > 0 ? Math.PI : 0);
        m4.makeTranslation(0, -tipY, -CHW * 0.54);
        const world = new THREE.Matrix4().copy(m1).multiply(m2).multiply(m3).multiply(m4);
        const ghost = rare && s > 0 && i === 0, qb = ghost ? ghostB : quay;
        if (!ghost) { const c = addCrescent(world); scene.add(c.mesh); }
        cresPoint(world, 0, 0, CR, pa);
        if (ci < 8 && !ghost) cresU[ci++].set(pa.x, pa.z, CHL * 0.98, (CHW + 3) * s);
        // trestles: pairs of raking shores under the shell, with a cap between
        for (const sv of [-0.86, -0.62, -0.36, -0.12, 0.12, 0.36, 0.62, 0.86]) {
          cresPoint(world, sv, 0.72, CR - CTH - 0.2, pa); cresPoint(world, sv, -0.72, CR - CTH - 0.2, pb);
          const oak = vary(OAK, r2, 0.15), spread = 0.16;
          if (pa.y > 1.2) qb.beam(pa.x + r2.range(-0.3, 0.3), 0, pa.z + (pa.z - pb.z) * spread, pa.x, pa.y, pa.z, 0.2, oak, K.WOOD, { sd: r2() });
          if (pb.y > 1.2) qb.beam(pb.x + r2.range(-0.3, 0.3), 0, pb.z + (pb.z - pa.z) * spread, pb.x, pb.y, pb.z, 0.2, oak, K.WOOD, { sd: r2() });
          if (pa.y > 3 && pb.y > 3) qb.beam(pa.x, pa.y - 0.5, pa.z, pb.x, pb.y - 0.5, pb.z, 0.16, oak, K.WOOD, { sd: r2() });
          if (Math.min(pa.y, pb.y) > 6) qb.beam(pa.x, 0.2, pa.z, pb.x, pb.y * 0.8, pb.z, 0.11, oak, K.WOOD, { sd: r2() });
          const lo = pa.y < pb.y ? pa : pb;
          qb.box(lo.x, 0.3, lo.z, 0.5, 0.3, 0.9, oak, K.WOOD, { sd: r2(), yaw: r2.range(-0.2, 0.2) });
        }
        // tarred lashings over the back
        for (const sv of [-0.7, -0.35, 0, 0.35, 0.7]) {
          let prev = null, first = null;
          for (let q = 0; q <= 6; q++) {
            cresPoint(world, sv + r2.range(-0.004, 0.004), -1.02 + 2.04 * q / 6, CR + 0.5, pc);
            if (prev) qb.beam(prev[0], prev[1], prev[2], pc.x, pc.y, pc.z, 0.075, [0.13, 0.1, 0.07], K.PLAIN);
            else first = [pc.x, pc.y, pc.z];
            prev = [pc.x, pc.y, pc.z];
          }
          // down over each edge to a ring in the quay, so it reads as a rope round the shell and not a bar laid on it
          if (first && prev) for (const [e, o] of [[first, prev], [prev, first]]) {
            const dz = Math.sign(e[2] - o[2]) || 1;
            if (e[1] > 0.6) qb.beam(e[0], e[1], e[2], e[0] + 0.25 * Math.sin(sv * 37), 0.05, e[2] - dz * Math.min(1.1, e[1] * 0.25), 0.075, [0.13, 0.1, 0.07], K.PLAIN);
          }
        }
      }
      // timber stacks, coiled hawsers, handcarts of chalk blocks, bollards along the lip of the dock
      const spot = (x, z) => path.nearestXZ(x, z).dist > 7.5;
      await ctx.yield();
      for (let i = 0; i < Math.round(9 * dens); i++) {
        const x = r2.range(160, 340), z = ST_Z + r2.pick([-1, 1]) * r2.range(9, 15.5), yaw = r2.range(-0.25, 0.25) + (r2.chance(0.3) ? Math.PI / 2 : 0);
        if (!spot(x, z)) continue;
        const n = r2.int(2, 4), L = r2.range(2.5, 4.5);
        for (let k = 0; k < n; k++) for (let j = 0; j < n + 1 - k; j++)
          quay.box(x + (j - (n - k) / 2) * 0.47 * Math.cos(yaw), 0.2 + k * 0.4, z - (j - (n - k) / 2) * 0.47 * Math.sin(yaw), 0.2, 0.19, L, vary([0.44, 0.34, 0.2], r2, 0.14), K.WOOD, { sd: r2(), yaw: yaw + r2.range(-0.03, 0.03), bottom: false });
      }
      for (let i = 0; i < Math.round(10 * dens); i++) {
        const x = r2.range(150, 345), z = ST_Z + r2.pick([-1, 1]) * r2.range(8, 15);
        if (!spot(x, z)) continue;
        const rr = r2.range(0.7, 1.1), nn = r2.int(2, 4), rope = [0.36, 0.28, 0.16];
        for (let k = 0; k < nn; k++) quay.lathe(x, z, [[k * 0.2, rr * 0.55], [k * 0.2 + 0.02, rr], [k * 0.2 + 0.2, rr], [k * 0.2 + 0.22, rr * 0.55]], 10, vary(rope, r2, 0.1), K.WOOD, { sd: r2() });
      }
      for (let i = 0; i < Math.round(7 * dens); i++) {
        const x = r2.range(150, 340), z = ST_Z + r2.pick([-1, 1]) * r2.range(8.5, 14), yaw = r2.range(0, TAU);
        if (!spot(x, z)) continue;
        const c = Math.cos(yaw), sn = Math.sin(yaw), wood = vary([0.33, 0.25, 0.15], r2, 0.1), chalk = [0.6, 0.59, 0.55];
        quay.box(x, 0.75, z, 0.6, 0.06, 1.0, wood, K.WOOD, { yaw, bottom: true, sd: r2() });
        for (const sx of [-1, 1]) {
          quay.box(x + sx * 0.62 * c, 0.95, z - sx * 0.62 * sn, 0.03, 0.2, 1.0, wood, K.WOOD, { yaw, sd: r2() });
          quay.lathe(x + sx * 0.72 * c, z - sx * 0.72 * sn, [[0.02, 0.1], [0.38, 0.5], [0.74, 0.1]], 9, IRON, K.PLAIN, {});
        }
        quay.beam(x + 1.0 * sn, 0.75, z + 1.0 * c, x + 2.2 * sn, 0.3, z + 2.2 * c, 0.04, wood, K.WOOD);
        for (let k = 0; k < 7; k++) quay.box(x + r2.range(-0.35, 0.35), 0.98 + (k > 3 ? 0.3 : 0), z + r2.range(-0.7, 0.7), 0.2, 0.15, 0.3, vary(chalk, r2, 0.06), K.PLAIN, { yaw: yaw + r2.range(-0.4, 0.4), sd: r2() });
      }
      await ctx.yield();
      for (let z = -130; z <= 150; z += 20) for (const sx of [-1, 1]) {
        const x = sx * 144.2;
        if (!spot(x, z)) continue;
        quay.lathe(x, z, [[0, 0.42], [0.25, 0.42], [0.3, 0.3], [0.85, 0.27], [0.95, 0.45], [1.08, 0.4], [1.12, 0.05]], 7, IRON, K.PLAIN, { sd: 0.6 });
      }
    }
    await ctx.yield();

    // ---- the rare event: a spare crescent slung from sheerlegs over the lane, turning slowly above the path
    const hang = { group: null, c: null };
    if (rare) {
      const ax = 252, ay = 76, az = ST_Z + 26, spar = [0.3, 0.2, 0.12], rope = [0.12, 0.1, 0.08];
      for (const s of [-1, 1]) {
        const fx = ax + s * 10, fz = az + 4.5, H = ay + 2.5;
        quay.beam(fx, 0, fz, ax - s * 0.3, H, az, 0.4, spar, K.WOOD, { sd: 0.3, v1: 0.28 });
        quay.box(fx, 0.4, fz, 0.9, 0.4, 0.9, OAK, K.WOOD);
        for (let q = 1; q < 9; q++) { const f = q * 10 / H; quay.box(fx + (ax - fx) * f, q * 10, fz + (az - fz) * f, 0.47, 0.35, 0.47, rope, K.PLAIN, { bottom: true }); }
        quay.beam(ax, ay, az, ax + s * 86, 0, az + 4.5, 0.11, rope, K.PLAIN); quay.beam(ax, ay, az, ax + s * 30, 0.5, az + 81, 0.11, rope, K.PLAIN);
      }
      quay.box(ax, ay - 0.5, az, 0.75, 1.0, 0.75, IRON, K.PLAIN, { bottom: true });
      hang.group = new THREE.Group(); hang.group.position.set(ax, ay - 1.6, az);
      const drop = ay - 1.6 - 58, roll = 1.15;
      const local = new THREE.Matrix4().makeTranslation(0, -drop, 0).multiply(new THREE.Matrix4().makeRotationX(roll)).multiply(new THREE.Matrix4().makeTranslation(0, -CR, 8));
      hang.c = addCrescent(local, 1); hang.group.add(hang.c.mesh);
      const tb = makeBuilder(), pv = new THREE.Vector3();
      for (const sv of [-0.42, 0.42]) for (const w of [-0.9, 0.2]) { cresPoint(local, sv, w, CR + 0.2, pv); tb.beam(0, 0, 0, pv.x, pv.y, pv.z, 0.1, rope, K.PLAIN); }
      const tm = tb.mesh(stuffMat); tm.frustumCulled = false; hang.group.add(tm);
      scene.add(hang.group);
      WU.uHangOn.value = 1;
    }

    await ctx.yield();
    // ---- p3 mend 2, AN ORDERED CURE: THE GROUND WHERE THE SLIPPED MOORING ROPES COME TO REST. The site's owner ruled that a rope passing through a
    // standing thing in a fraction of a second is this world's own manner, and that a rope come to rest lying through a thing is a fault. So the
    // ground under every mooring rope as it lies at the flight's end is worked out here, once, and kept clear further down: of the pails of light
    // (p1), of the yard gear's stacks (p2) and of the keel cribs and staging towers (p3). It is held as a list of small rectangles of floor.
    // WHAT IS READ, all of it from what the part has built: the instances of its rope batch (a rope's two ends aA and aB, the share of the flight
    // at which it is slipped aR.x, its thickness aR.z; a strand of a hoist, told by aR.w, is no mooring), the stations of the ribbon along the rope
    // (its own position.x), the flight's seconds (the part's uniform uSecs), and the Moon's place at the flight's end. That place is ASKED OF THE
    // PART, not worked out: its own setProgress(1) and update() are called, at the flight's last second and every quarter second of the ten after
    // it (the Moon rides up and down there), the Moon's matrix is taken at its lowest and at its highest, and the part is put back as it was
    // built: setProgress(0) and update(0, 0), the same share and clock its own build ends on, and the one uniform update() works out from where
    // the hero stands (uRootInv) set back to the value it held. (The part now holds the share 0 as set, where before it worked 0 out from the
    // clock; the world's own update sets the share at every frame.)
    // WHAT IS MIRRORED, and why: how a slipped rope lies is the rope shader's own arithmetic, GLSL, which the world's code cannot call. So these
    // lines of the part are mirrored here for the END STATE alone (uProg = 1; the ground of the whole fall is not marked): P817 and P823 (length
    // and taut direction), P821 (seconds since the slip), P824 (how far the fall has gone), P825 to P827 (which end it keeps, q counted from that
    // end, the direction d1 from it), P828 (the direction it lies in, with the shader's 1e-4), P829 (the side its sway goes to), P830 (the sway
    // left: 4.5 m dying by 0.28 a second, times q), P832 (the point; its two sines taken at every value from -1 to 1, since the sway left at the
    // flight's end goes on for as long as the clock runs) and P840 (the Moon end rides the Moon). P831 is read for what it does by the end: a
    // rope that goes off with the Moon (P825: not thinner than 0.32) is hauled in to no length before the flight ends, and leaves no ground.
    // P833 (the floor's height) is not needed in plan.
    // THE GROUND of a rope: between each two stations of the ribbon (the drawn rope is straight between them), in steps of at most 0.2 m, the
    // rectangle that holds the point at the lowest and at the highest Moon with all its sway, widened on every side by the rope's own thickness.
    // Rectangles wholly off the dock floor are dropped. No dice are drawn; the lens, the running clock and the route are not read.
    const ropeRest = [], REST_PAD = 0.6;
    {
      let rope = null; hero.object.traverse((o) => { const g = o.geometry; if (!rope && g && g.attributes.aA && g.attributes.aB && g.attributes.aR) rope = g; });
      if (rope) {
        const RA = rope.attributes.aA.array, RB = rope.attributes.aB.array, RR = rope.attributes.aR.array, RS = rope.attributes.position, secs = HU.uSecs.value;
        const hpx = hero.object.position.x, hpz = hero.object.position.z, ss = [];
        for (let k = 0; k < RS.count; k++) if (!ss.includes(RS.getX(k))) ss.push(RS.getX(k));
        ss.sort((a, b) => a - b);
        let mLo = null, mHi = null; const rootInv0 = HU.uRootInv.value.clone();
        hero.setProgress(1);
        for (let k = 0; k <= 40; k++) { hero.update(0, secs + k * 0.25); const m = hero.moon.matrix.elements; if (!mLo || m[13] < mLo[13]) mLo = m.slice(); if (!mHi || m[13] > mHi[13]) mHi = m.slice(); }
        hero.setProgress(0); hero.update(0, 0); HU.uRootInv.value.copy(rootInv0);
        const line = (r, mm, e, amp) => {                                     // one rope under one Moon: for each station its place in plan and how far its sway can carry it in x and in z
          const x = RA[r * 3], y = RA[r * 3 + 1], z = RA[r * 3 + 2], ax = mm[0] * x + mm[4] * y + mm[8] * z + mm[12], ay = mm[1] * x + mm[5] * y + mm[9] * z + mm[13], az = mm[2] * x + mm[6] * y + mm[10] * z + mm[14];      // P840
          const bx = RB[r * 3], by = RB[r * 3 + 1], bz = RB[r * 3 + 2], L = Math.max(Math.hypot(bx - ax, by - ay, bz - az), 1e-3);      // P817
          const d1x = (ax - bx) / L, d1y = (ay - by) / L, d1z = (az - bz) / L;                                                            // P823, P827: from the end it keeps (the bollard's) toward the Moon's
          const sn = Math.hypot(d1z + 1e-4, 1e-4, -d1x + 1e-4), sdx = (d1z + 1e-4) / sn, sdz = (-d1x + 1e-4) / sn, out = new Float64Array(ss.length * 4);      // P829
          for (let i = 0; i < ss.length; i++) {
            const q = 1 - ss[i], mx = Math.min(Math.max(e * (0.55 + 0.4 * q), 0), 1.12), vx = d1x * (1 - mx) + 1e-4, vy = d1y * (1 - mx) - mx, vz = d1z * (1 - mx), k = L * q / Math.hypot(vx, vy, vz);      // P826, P828, P832
            out[i * 4] = hpx + bx + k * vx; out[i * 4 + 1] = hpz + bz + k * vz; out[i * 4 + 2] = amp * q * (Math.abs(sdx) + 0.4 * Math.abs(d1x)); out[i * 4 + 3] = amp * q * (Math.abs(sdz) + 0.4 * Math.abs(d1z));      // P830, P832
          }
          return out;
        };
        for (let r = 0; r < rope.instanceCount; r++) {
          const w = RR[r * 4 + 2], t = Math.max(1 - RR[r * 4], 0) * secs;                                                                 // P821 at the flight's end
          if (Math.abs(RR[r * 4 + 3]) > 0.5 || !(w < 0.32) || t <= 0) continue;      // a hoist's strand; a rope hauled off with the Moon (P825, P831); a rope never slipped
          const e = 1 - Math.exp(-t * 0.7) * Math.cos(t * 1.4), amp = 4.5 * Math.exp(-t * 0.28), a = line(r, mLo, e, amp), b = line(r, mHi, e, amp);      // P824, P830
          for (let i = 0; i + 1 < ss.length; i++) {
            const o = i * 4, n = Math.max(1, Math.ceil(Math.max(Math.hypot(a[o + 4] - a[o], a[o + 5] - a[o + 1]), Math.hypot(b[o + 4] - b[o], b[o + 5] - b[o + 1])) / 0.2));
            for (let j = 0; j <= n; j++) {
              const f = j / n; let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
              for (const p of [a, b]) {
                const px = p[o] + (p[o + 4] - p[o]) * f, pz = p[o + 1] + (p[o + 5] - p[o + 1]) * f, hx = p[o + 2] + (p[o + 6] - p[o + 2]) * f + w, hz = p[o + 3] + (p[o + 7] - p[o + 3]) * f + w;
                x0 = Math.min(x0, px - hx); x1 = Math.max(x1, px + hx); z0 = Math.min(z0, pz - hz); z1 = Math.max(z1, pz + hz);
              }
              if (x1 > -B_X && x0 < B_X && z1 > B_Z0 && z0 < B_Z1) ropeRest.push(x0, x1, z0, z1);
            }
          }
        }
      }
    }
    const restOn = (x0, x1, z0, z1) => { for (let i = 0; i < ropeRest.length; i += 4) if (ropeRest[i] < x1 && ropeRest[i + 1] > x0 && ropeRest[i + 2] < z1 && ropeRest[i + 3] > z0) return true; return false; };
    // ---- what lies about on the dock floor: chalk blocks, baulks, hawsers, pails, a trolley on its rails
    {
      const fy = -30, chalk = [0.6, 0.59, 0.55];
      const freeAt = (x, z) => !(Math.abs(x) < 5 && Math.abs(z) < 34) && Math.abs(Math.abs(x) - 9) > 1.6 && Math.hypot(x, z) < 128;
      const nThings = Math.round(120 * (0.5 + 0.5 * detail) * dens);
      for (let i = 0; i < nThings; i++) {
        if (i % 12 === 0) await ctx.yield();
        const near = i < nThings * 0.6;
        const x = near ? r2.range(-34, 34) : r2.range(-120, 120), z = near ? r2.range(-10, 150) : r2.range(-125, 148), kind = r2();
        if (!freeAt(x, z)) continue;
        if (kind < 0.36) {                                       // a heap of chalk blocks
          const n = r2.int(5, 12);
          for (let k = 0; k < n; k++) {
            const sx = r2.range(0.3, 0.75), a = r2.range(0, TAU), rr = r2.range(0, 1.8) * (k < n / 2 ? 1 : 0.45);
            quay.box(x + Math.sin(a) * rr, fy + sx * 0.5 + (k < n / 2 ? 0 : 0.7), z + Math.cos(a) * rr, sx * r2.range(0.6, 1), sx * 0.5, sx * r2.range(0.7, 1.3), vary(chalk, r2, 0.08), K.PLAIN, { yaw: r2.range(0, 3), sd: r2() });
          }
        } else if (kind < 0.62) {                                // baulks of oak
          const n = r2.int(2, 4), L = r2.range(2.5, 5), yaw = r2.range(0, TAU);
          for (let k = 0; k < n; k++) for (let j = 0; j < n + 1 - k; j++)
            quay.box(x + (j - (n - k) / 2) * 0.62 * Math.cos(yaw), fy + 0.28 + k * 0.56, z - (j - (n - k) / 2) * 0.62 * Math.sin(yaw), 0.28, 0.27, L, vary(OAK, r2, 0.2), K.WOOD, { sd: r2(), yaw: yaw + r2.range(-0.04, 0.04) });
        } else if (kind < 0.8) {                                 // a coiled hawser
          const rr = r2.range(0.9, 1.5), nn = r2.int(2, 5), rope = [0.36, 0.28, 0.16];
          for (let k = 0; k < nn; k++) quay.lathe(x, z, [[fy + k * 0.26, rr * 0.5], [fy + k * 0.26 + 0.03, rr], [fy + k * 0.26 + 0.26, rr], [fy + k * 0.26 + 0.29, rr * 0.5]], 10, vary(rope, r2, 0.1), K.WOOD, { sd: r2() });
        } else if (kind < 0.92) {                                // pails and a brush
          for (let k = 0; k < r2.int(2, 4); k++) {
            const bx = x + r2.range(-1, 1), bz = z + r2.range(-1, 1);
            quay.lathe(bx, bz, [[fy, 0.3], [fy + 1.0, 0.42], [fy + 1.0, 0.36], [fy + 0.9, 0.0]], 8, [0.47, 0.52, 0.57], K.PLAIN, { cols: [[0.4, 0.44, 0.5], [0.5, 0.55, 0.6], [0.2, 0.22, 0.25], lin('#8FD3E8', 0.9)] });
          }
        } else {                                                 // a saw-horse with planks
          const yaw = r2.range(0, TAU), c = Math.cos(yaw), sn = Math.sin(yaw), w = vary([0.42, 0.33, 0.2], r2, 0.1);
          for (const e of [-1, 1]) { quay.beam(x + e * 1.5 * c - 0.5 * sn, fy, z - e * 1.5 * sn - 0.5 * c, x + e * 1.5 * c, fy + 1.1, z - e * 1.5 * sn, 0.06, w); quay.beam(x + e * 1.5 * c + 0.5 * sn, fy, z - e * 1.5 * sn + 0.5 * c, x + e * 1.5 * c, fy + 1.1, z - e * 1.5 * sn, 0.06, w); }
          quay.beam(x - 1.8 * c, fy + 1.12, z + 1.8 * sn, x + 1.8 * c, fy + 1.12, z - 1.8 * sn, 0.08, w);
          for (let k = 0; k < 3; k++) quay.box(x + r2.range(-0.2, 0.2), fy + 1.24 + k * 0.07, z + r2.range(-0.2, 0.2), 0.16, 0.03, 2.2, vary([0.47, 0.385, 0.26], r2, 0.15), K.WOOD, { yaw: yaw + Math.PI / 2 + r2.range(-0.1, 0.1), sd: r2() });
        }
      }
      {   // along the foot of the gate-end wall: timber, chalk and hawsers stacked out of the launching way (their own random stream)
        const fr = makeRng(4211 + (ctx.seed | 0));
        for (let i = 0; i < 16; i++) {
          const sx = i % 2 ? -1 : 1, x = sx * (GW + 5 + (i >> 1) * 11.5 + fr.range(-2.5, 2.5)), z = fr.range(141.5, 150), kind = (i + (i >> 2)) % 4;
          if (kind === 0) {                                       // a stack of baulks, end on to us or along the wall
            const n = fr.int(3, 5), L = fr.range(3, 5.5), yaw = fr.chance(0.5) ? Math.PI / 2 + fr.range(-0.1, 0.1) : fr.range(-0.15, 0.15);
            for (let k = 0; k < n; k++) for (let j = 0; j < n + 1 - k; j++)
              quay.box(x + (j - (n - k) / 2) * 0.66 * Math.cos(yaw), fy + 0.3 + k * 0.6, z - (j - (n - k) / 2) * 0.66 * Math.sin(yaw), 0.3, 0.29, L, vary(OAK, fr, 0.22), K.WOOD, { sd: fr(), yaw: yaw + fr.range(-0.04, 0.04) });
          } else if (kind === 1) {                                // chalk blocks, piled
            for (let k = 0; k < 14; k++) {
              const sz = fr.range(0.35, 0.8), a = fr.range(0, TAU), rr = fr.range(0, 2.4) * (k < 8 ? 1 : 0.4);
              quay.box(x + Math.sin(a) * rr, fy + sz * 0.5 + (k < 8 ? 0 : 0.75), z + Math.cos(a) * rr, sz * fr.range(0.6, 1), sz * 0.5, sz * fr.range(0.7, 1.3), vary(chalk, fr, 0.08), K.PLAIN, { yaw: fr.range(0, 3), sd: fr() });
            }
          } else if (kind === 2) {                                // hawsers, coiled
            for (let c = 0; c < 2; c++) {
              const rr = fr.range(1.0, 1.6), nn = fr.int(3, 5), cx = x + c * fr.range(2.4, 3.2), rope = [0.36, 0.28, 0.16];
              for (let k = 0; k < nn; k++) quay.lathe(cx, z, [[fy + k * 0.26, rr * 0.5], [fy + k * 0.26 + 0.03, rr], [fy + k * 0.26 + 0.26, rr], [fy + k * 0.26 + 0.29, rr * 0.5]], 10, vary(rope, fr, 0.1), K.WOOD, { sd: fr() });
            }
          } else {                                                // shores laid down side by side, and a few stood against the wall
            for (let k = 0; k < 4; k++) quay.box(x + k * 0.7, fy + 0.25, z, 0.25, 0.25, fr.range(4, 6.5), vary(OAK, fr, 0.2), K.WOOD, { sd: fr(), yaw: Math.PI / 2 + fr.range(-0.06, 0.06) });
            for (let k = 0; k < 3; k++) { const xs = x + 4 + k * 1.1; quay.beam(xs, fy, 151.2 + k * 0.3, xs + 0.2, fy + 7.4, 153.8, 0.2, vary(OAK, fr, 0.2), K.WOOD, { sd: fr() }); }
          }
        }
      }
      for (const sx of [-1, 1]) {                                // a trolley of chalk on the dock-floor rails
        const tz = sx > 0 ? 96 : 44, tx = sx * 9;
        quay.box(tx, fy + 0.75, tz, 1.1, 0.12, 1.9, OAK, K.WOOD, { bottom: true, sd: 0.3 });
        for (const dz of [-1.2, 1.2]) for (const dx of [-0.9, 0.9]) quay.lathe(tx + dx, tz + dz, [[fy + 0.02, 0.05], [fy + 0.32, 0.34], [fy + 0.62, 0.05]], 8, IRON, K.PLAIN);
        for (let k = 0; k < 10; k++) quay.box(tx + r2.range(-0.6, 0.6), fy + 1.1 + (k > 5 ? 0.42 : 0), tz + r2.range(-1.3, 1.3), 0.3, 0.2, 0.42, vary(chalk, r2, 0.07), K.PLAIN, { yaw: r2.range(-0.3, 0.3), sd: r2() });
      }
      {   // p1 PAILS OF LIGHT put down all over the dock floor, wherever the work left them: a scatter over the whole floor from dice of its own
          // (a stream made from the seed alone, so nothing above or below is dealt anew). Each pail takes four dice (x, z, the size and the
          // brightness of its glow); all are drawn, and all are used unless the pail is refused by p3 mend 2 (below). They stand still.
          // The pail is the one of the heaps above, in the quay batch; the light is one instanced draw of flat cards, added.
          // p3 mend 2, AN ORDERED CURE (the site owner's ruling; see the ropes' rest ground above): a pail whose foot (0.42 m at the rim, with
          // 0.6 m beyond) touches ground where a slipped mooring rope comes to rest is not put down, and its glow is put out (size and
          // brightness 0). Its four dice are drawn all the same and its place stays in the list, so every other pail stands where live puts it
          // and the yard gear, which keeps off the list's places, is dealt as before. Read through the rest ground: the ropes and the Moon's
          // place at the flight's end, as said there.
        const lr = makeRng('moon-floor-lights:' + ctx.seed), NL = 140, aL = new Float32Array(NL * 4);
        for (let i = 0; i < NL; i++) {
          const x = lr.range(-130, 130), z = lr.range(-134, 148), gs = lr.range(0.85, 1.25), gb = lr.range(0.75, 1.1);
          const lies = restOn(x - 0.42 - REST_PAD, x + 0.42 + REST_PAD, z - 0.42 - REST_PAD, z + 0.42 + REST_PAD);
          if (!lies) quay.lathe(x, z, [[fy, 0.3], [fy + 1.0, 0.42], [fy + 1.0, 0.36], [fy + 0.9, 0.0]], 8, [0.47, 0.52, 0.57], K.PLAIN, { cols: [[0.4, 0.44, 0.5], [0.5, 0.55, 0.6], [0.2, 0.22, 0.25], lin('#8FD3E8', 0.9)] });
          aL.set(lies ? [x, z, 0, 0] : [x, z, gs, gb], i * 4);
        }
        const pos = [], aQ = [], idx = [];
        [[0.06, 4.2, 0.4], [1.0, 0.55, 2.4], [1.2, 3.6, 0.7], [2.2, 3.0, 0.5], [3.3, 2.4, 0.32]].forEach(([h, r, k], j) => {      // height above the floor, radius, strength
          for (const [cx, cz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { pos.push(cx * r, h, cz * r); aQ.push(cx, cz, k); }
          idx.push(j * 4, j * 4 + 2, j * 4 + 1, j * 4, j * 4 + 3, j * 4 + 2);
        });
        const lg = new THREE.InstancedBufferGeometry();
        lg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); lg.setAttribute('aQ', new THREE.Float32BufferAttribute(aQ, 3)); lg.setIndex(idx);
        lg.setAttribute('aL', new THREE.InstancedBufferAttribute(aL, 4)); lg.instanceCount = NL;
        const lm = new THREE.Mesh(lg, mk(PAIL_VERT, PAIL_FRAG, { uGlow: HU.uGlow }, { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
        lm.frustumCulled = false; lm.renderOrder = 2; lm.matrixAutoUpdate = false; scene.add(lm);
        var yardPails = aL;                                        // p2 mend 2: the pails' places, kept for the yard gear, which is laid further down (after the last cradle strip)
      }
    }
    await ctx.yield();

    // ---- slipped mooring ropes left hanging in loops from the bollards at the gate end, swinging against the top altar
    {
      const rope = [0.3, 0.24, 0.15];
      // [side, x, width, drop, phase, altar]: altar 5 hangs from the quay's lip, 4 and 3 from bollards on the treads below it
      for (const [sx, bx, w, sag, ph, al] of [[1, 31.5, 2.6, 5.6, 2.1, 5], [1, 39, -2.2, 5.3, 4.4, 4], [1, 53, 2.8, 5.6, 7.9, 5], [1, 22, 2.1, 5.4, 9.3, 3], [-1, 33, -2.4, 5.5, 11.3, 5], [-1, 43, 2.5, 5.3, 14.2, 4], [-1, 23, 2.2, 5.5, 16.1, 3], [1, 66, 2.5, 5.5, 17.5, 4], [-1, 60, 2.7, 5.6, 19.9, 5]]) {
        const x = sx * bx, x0 = x - w / 2, y = -30 + 6 * al, zf = B_Z1 + STEP * (al - 1), zl = zf - 0.42, zb = zf + (al === 5 ? 2.8 : 0.75);
        sheets.add([x0, y + 0.45, zl], [w, 0, 0], [0, 1, 0], [0, 0, -1], rope, [ph, sag, 3, 0.3]);
        for (const xe of [x0, x0 + w]) {                                   // from the bollard over the edge to where it hangs
          dock.beam(x, y + 0.95, zb, xe, y + 0.6, zf + 0.1, 0.13, rope, K.PLAIN);
          dock.beam(xe, y + 0.6, zf + 0.1, xe, y + 0.45, zl, 0.13, rope, K.PLAIN);
        }
        dock.lathe(x, zb, [[y, 0.42], [y + 0.25, 0.42], [y + 0.3, 0.3], [y + 0.85, 0.27], [y + 0.95, 0.45], [y + 1.08, 0.4], [y + 1.12, 0.05]], 7, IRON, K.PLAIN, { sd: 0.6 });
      }
    }
    await ctx.yield();

    // ================================================================= the sea, the boats
    {
      const y = -27, E = 4200;
      const pos = [-E, y, E, E, y, E, E, y, QUAY_Z1, -E, y, QUAY_Z1, -E, y, QUAY_Z1, QUAY_X0, y, QUAY_Z1, QUAY_X0, y, -E, -E, y, -E];
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex([0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7]);
      const sea = new THREE.Mesh(g, mk(SEA_VERT, seaFrag(glsl)));
      sea.frustumCulled = false; sea.matrixAutoUpdate = false; scene.add(sea);
    }
    const boatFunnels = [];
    {
      const bb = makeBuilder(), drifter = boatKind === 'drifter';
      const L = drifter ? 7.5 : 4.6, Bm = drifter ? 2.3 : 1.55;
      const st = [-1, -0.82, -0.5, 0, 0.5, 0.85, 1].map((t) => {
        const w = Bm * Math.pow(Math.max(1 - Math.pow(Math.abs(t), drifter ? 2.6 : 2.2), 0), 0.6) + 0.04;
        return { z: t * L, w, sheer: 0.95 + 0.55 * t * t + (t > 0 ? 0.35 * t * t : 0), keel: -0.75 + 0.5 * Math.pow(Math.abs(t), 3) };
      });
      const TINT = [1, 1, 1], INS = [0.3, 0.24, 0.16];
      for (let i = 0; i < st.length - 1; i++) {
        const a = st[i], c = st[i + 1];
        for (const sx of [-1, 1]) {
          const ga = [sx * a.w, a.sheer, a.z], gc = [sx * c.w, c.sheer, c.z], ca = [sx * a.w * 0.72, a.keel * 0.35, a.z], cc = [sx * c.w * 0.72, c.keel * 0.35, c.z], ka = [0, a.keel, a.z], kc = [0, c.keel, c.z];
          bb.quad(ca, cc, gc, ga, TINT, 0); bb.quad(ka, kc, cc, ca, [0.5, 0.16, 0.1], K.PLAIN);
          bb.quad([sx * a.w, a.sheer + 0.07, a.z], [sx * c.w, c.sheer + 0.07, c.z], [sx * c.w * 0.86, c.sheer + 0.07, c.z], [sx * a.w * 0.86, a.sheer + 0.07, a.z], [0.5, 0.4, 0.25], K.PLAIN);
        }
        bb.quad([-a.w * 0.86, a.sheer - 0.25, a.z], [-c.w * 0.86, c.sheer - 0.25, c.z], [c.w * 0.86, c.sheer - 0.25, c.z], [a.w * 0.86, a.sheer - 0.25, a.z], INS, K.PLAIN);
      }
      const mastC = [0.42, 0.31, 0.18], sail = boatKind === 'lateen' ? [0.74, 0.68, 0.55] : [0.4, 0.17, 0.1];
      if (!drifter) {
        bb.beam(0, 0.7, 0.9, 0, 8.4, 0.5, 0.075, mastC, K.PLAIN); bb.beam(0, 2.6, 4.2, 0, 9.6, -3.4, 0.055, mastC, K.PLAIN);
        bb.tri([0.02, 2.75, 4.1], [0.02, 9.45, -3.3], [0.25, 1.7, -3.9], sail, 1); bb.tri([0.25, 1.7, -3.9], [0.02, 9.45, -3.3], [0.02, 2.75, 4.1], sail, 1);
        bb.box(0, 1.0, -1.2, 1.1, 0.05, 0.16, mastC, K.PLAIN); bb.box(0, 1.0, 1.9, 0.95, 0.05, 0.16, mastC, K.PLAIN);
        bb.box(0.3, 1.25, -2.3, 0.45, 0.22, 0.6, [0.55, 0.42, 0.2], K.PLAIN);
      } else {
        bb.box(0, 2.0, -1.6, 1.25, 1.0, 1.5, [0.75, 0.72, 0.64], K.PLAIN, { top: [0.3, 0.3, 0.32] });
        bb.lathe(0, 0.6, [[1.1, 0.42], [4.6, 0.4], [4.7, 0.44], [4.9, 0.44]], 8, [0.08, 0.08, 0.09], K.PLAIN, { cols: [[0.08, 0.08, 0.09], [0.6, 0.12, 0.08], [0.08, 0.08, 0.09], [0.08, 0.08, 0.09]] });
        bb.beam(0, 0.9, 4.6, 0, 8.3, 4.4, 0.08, mastC, K.PLAIN); bb.beam(0, 0.9, -5.4, 0, 6.6, -5.6, 0.07, mastC, K.PLAIN);
        bb.tri([0.02, 2.2, -5.5], [0.02, 6.3, -5.6], [0.2, 2.0, -8.2], sail, 1); bb.tri([0.2, 2.0, -8.2], [0.02, 6.3, -5.6], [0.02, 2.2, -5.5], sail, 1);
        bb.beam(0, 2.4, 4.4, 0, 3.4, 0.9, 0.05, mastC, K.PLAIN);
      }
      const bm = bb.mesh(null), bg = bm.geometry;
      const NB = 14, aB = new Float32Array(NB * 4), aT = new Float32Array(NB * 3);
      const paints = ['#3E6FA8', '#EEF1F4', '#C8643C', '#3F6B4F', '#E9C98A', '#8FD3E8', '#EEF1F4'].map((h) => lin(h, 0.78));
      const spots = [[18.6, 219], [-18.2, 216], [78, 268], [-88, 222], [14, 318], [150, 240], [-150, 300], [230, 215], [-60, 340], [110, 345]];
      await ctx.yield();
      for (let i = 0; i < NB; i++) {
        const sp = spots[i] || [r2.range(-420, 520), r2.range(430, 900)];
        const jx = r2.range(-6, 6), jz = r2.range(-6, 6), x = sp[0] + (i < 2 ? jx * 0.15 : jx), z = sp[1] + (i < 2 ? jz * 0.3 : jz), yaw0 = r2.range(-0.5, 0.5) + (r2.chance(0.3) ? Math.PI : 0) + 0.5, yaw = i < 2 ? (i ? 0.06 : Math.PI - 0.05) : yaw0;
        aB.set([x, z, yaw, r2() * 0.98 + (i < 2 ? 2 : 0)], i * 4); aT.set(paints[(i * 3 + 1) % paints.length], i * 3);                // whole part: the two near boats are three quarters as big again aT.set(r2.pick(paints), i * 3);
        if (drifter && i < 6) { const bs = i < 2 ? 2 : 1; boatFunnels.push([x + Math.sin(yaw) * 0.6 * bs, -27 + 5.3 * bs * (bs > 1 ? 1.4 : 1), z + Math.cos(yaw) * 0.6 * bs]); }
      }
      const ig = new THREE.InstancedBufferGeometry();
      for (const k of ['position', 'normal', 'color', 'aM']) ig.setAttribute(k, bg.attributes[k]);
      ig.setIndex(bg.index);
      ig.setAttribute('aB', new THREE.InstancedBufferAttribute(aB, 4)); ig.setAttribute('aT', new THREE.InstancedBufferAttribute(aT, 3));
      ig.instanceCount = NB;
      const boatMat = mk(/* glsl */`
#include <common>
#include <fog_pars_vertex>
attribute vec3 color; attribute vec4 aM; attribute vec4 aB; attribute vec3 aT;
uniform float uTime;
varying vec3 vCol, vN, vP;
void main(){
  float ph = fract(aB.w) * 6.283;
  float roll = sin(uTime * .9 + ph) * .08, pitch = sin(uTime * .7 + ph * 1.7) * .045;
  vec3 p = position * (1. + .5 * floor(aB.w)), n = normal;
  p.y *= 1. + .2 * floor(aB.w);                      // the two boats in the gateway carry taller masts and funnels
  if (aM.x > .5 && aM.x < 1.5) p.x += sin(p.y * .7 + p.z * .5 - uTime * 2.2 + ph) * .22 * smoothstep(1.5, 5., p.y);      // the sail fills and slackens
  p = vec3(p.x * cos(roll) - p.y * sin(roll), p.x * sin(roll) + p.y * cos(roll), p.z);
  n = vec3(n.x * cos(roll) - n.y * sin(roll), n.x * sin(roll) + n.y * cos(roll), n.z);
  p = vec3(p.x, p.y * cos(pitch) - p.z * sin(pitch), p.y * sin(pitch) + p.z * cos(pitch));
  float c = cos(aB.z), s = sin(aB.z);
  p = vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z); n = vec3(c * n.x + s * n.z, n.y, -s * n.x + c * n.z);
  p += vec3(aB.x + sin(uTime * .23 + ph) * .7, -27. + sin(uTime * .8 + ph * .6) * .22, aB.y + cos(uTime * .19 + ph) * .7);
  vCol = aM.x < .5 ? color * aT : color; vN = n; vP = p;
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`, perchFrag(glsl), {}, { side: THREE.DoubleSide });
      const boats = new THREE.Mesh(ig, boatMat); boats.frustumCulled = false; boats.matrixAutoUpdate = false; scene.add(boats);
      bg.dispose();
    }
    for (const b of [dock, street, town, quay]) { await ctx.yield(); scene.add(await b.meshAsync(stuffMat, () => ctx.yield())); }
    await ctx.yield();
    scene.add(sheets.build(sheetGeometry(6, 5), sheetMat));
    await ctx.yield();
    scene.add(leaves.build(sheetGeometry(1, 1), sheetMat));
    await ctx.yield();

    // ================================================================= the last strip of the struck cradle, and the birds on its rail
    await ctx.yield();
    const perchU = { uSize: { value: cast === 'doves' ? 2.1 : 2.4 } };
    {
      const ex = makeBuilder(), v = new THREE.Vector3(), pts = [], larch = [0.4, 0.28, 0.16];
      for (let uu = 0.648; uu <= 0.7125; uu += 0.008) {
        path.pointAt(uu, v); const r = Math.hypot(v.x, v.z), k = (r - 5.5) / r, ko = (r - 7.3) / r;
        pts.push({ x: v.x * k, z: v.z * k, xi: v.x * ko, zi: v.z * ko, y: v.y - 10.5, u: uu });
      }
      pts.forEach((p, i) => {
        const c = vary(larch, r2, 0.15);
        ex.beam(p.x, -30, p.z, p.x, p.y + 1.15, p.z, 0.1, c, K.WOOD, { sd: r2() });
        ex.beam(p.xi, -30, p.zi, p.xi, p.y + 0.1, p.zi, 0.1, c, K.WOOD, { sd: r2() });
        if (i % 2 === 0 && p.y > -22) ex.beam(p.x, p.y - 7, p.z, p.xi, p.y, p.zi, 0.07, c, K.WOOD, { sd: r2() });
        if (!i) return;
        const q = pts[i - 1];
        ex.beam(q.x, q.y + 1.1, q.z, p.x, p.y + 1.1, p.z, 0.075, c, K.WOOD, { sd: r2() });
        ex.beam(q.x, q.y + 0.55, q.z, p.x, p.y + 0.55, p.z, 0.05, c, K.WOOD, { sd: r2() });
        if (r2.chance(0.8)) for (let b = 0; b < 5; b++) {
          const f = (b + 0.5) / 5, ax = q.x + (q.xi - q.x) * f, az = q.z + (q.zi - q.z) * f, bx = p.x + (p.xi - p.x) * f, bz = p.z + (p.zi - p.z) * f;
          if (r2.chance(0.88)) ex.beam(ax, q.y + 0.04, az, bx, p.y + 0.04, bz, 0.03, vary([0.47, 0.385, 0.26], r2, 0.18), K.WOOD, { sd: r2(), v1: 0.3 });
        }
      });
      {   // a staging tower left standing on the dock floor beside the launching way: the near thing as we run for the gates
        const tx = 11.5, tz = 68, h = 14.6, w = 1.7, y0 = -30, plank = [0.47, 0.385, 0.26];
        const cs = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
        const at = (i, y) => { const f = (y - y0) / h, k = w * (1.3 - 0.3 * f); return [tx + cs[i][0] * k, tz + cs[i][1] * k]; };
        for (let i = 0; i < 4; i++) { const a = at(i, y0), b = at(i, y0 + h + 1.15); ex.beam(a[0], y0, a[1], b[0], y0 + h + 1.15, b[1], 0.11, vary(larch, r2, 0.15), K.WOOD, { sd: r2() }); }
        for (let lv = 1; lv <= 3; lv++) for (let i = 0; i < 4; i++) {
          const y = y0 + lv * h / 3, a = at(i, y), b = at((i + 1) % 4, y), c = at((i + 1) % 4, y - h / 3 + 0.3);
          ex.beam(a[0], y, a[1], b[0], y, b[1], 0.075, vary(larch, r2, 0.15), K.WOOD, { sd: r2() });
          if ((lv + i) % 2 === 0) ex.beam(a[0], y, a[1], c[0], y - h / 3 + 0.3, c[1], 0.06, vary(larch, r2, 0.15), K.WOOD, { sd: r2() });
        }
        for (let b = 0; b < 8; b++) ex.box(tx + r2.range(-0.08, 0.08), y0 + h + 0.1, tz - w - 0.2 + (b + 0.5) * (2 * w + 0.4) / 8, w + 0.35, 0.035, 0.2, vary(plank, r2, 0.16), K.WOOD, { sd: r2(), bottom: true });
        for (let i = 0; i < 3; i++) { const a = at(i, y0 + h), b = at(i + 1, y0 + h); ex.beam(a[0], y0 + h + 1.1, a[1], b[0], y0 + h + 1.1, b[1], 0.055, vary(larch, r2, 0.15), K.WOOD, { sd: r2() }); }
        for (const o of [-0.26, 0.26]) ex.beam(tx - w * 1.3 - 0.5, y0, tz + o, tx - w - 0.1, y0 + h + 0.9, tz + o, 0.045, larch, K.WOOD);
        for (let q = 1; q < 30; q++) { const f = q / 30; ex.beam(tx - w * 1.3 - 0.5 + (w * 0.3 + 0.4) * f, y0 + (h + 0.9) * f, tz - 0.26, tx - w * 1.3 - 0.5 + (w * 0.3 + 0.4) * f, y0 + (h + 0.9) * f, tz + 0.26, 0.03, larch, K.WOOD); }
        ex.lathe(tx + 0.5, tz - 0.4, [[y0 + h + 0.14, 0.3], [y0 + h + 1.1, 0.42], [y0 + h + 1.1, 0.36], [y0 + h + 1.0, 0.0]], 8, [0.47, 0.52, 0.57], K.PLAIN, { cols: [[0.4, 0.44, 0.5], [0.5, 0.55, 0.6], [0.2, 0.22, 0.25], lin('#8FD3E8', 0.9)] });
        ex.box(tx - 0.6, y0 + h + 0.3, tz + 0.7, 0.45, 0.16, 0.3, [0.6, 0.59, 0.55], K.PLAIN, { yaw: 0.4 });
      }
      scene.add(ex.mesh(stuffMat));
      {
        // p2 YARD GEAR: what a working dock keeps on its floor: cribs of spare keel blocks, rows of shores, stickered stacks of planks, over the
        // whole floor outside the rails and the launching way (every stack wholly between 14 m from the centre line and 5 m from a wall's foot).
        // A stream of its own, made from the seed alone; each of the 160 candidates takes seven dice (distance out, side, place along the dock,
        // kind, lie, size, tone), all drawn before anything is tested and every one used; a candidate is not built if its footprint comes within
        // 2.5 m of one of the pails above or it would stand into a stack already built. Each stack throws its own shadow on the floor, by this
        // visit's sun. They stand still; nothing here reads the flight, the route or the lens.
        // p2 mend: no stack stands in a thing live has laid on the floor. Everything this batch holds below the quay when the gear begins (the
        // heaps of chalk, baulks, hawsers, pails and saw-horses, the stacks at the gate-end wall, the two trolleys, the pails of light) is read
        // from the batch's own positions and indices, and the floor bollards from the hero's list live itself reads: every edge of it is marked on a quarter-metre plan of the floor, and a candidate whose
        // footprint, 0.6 m wider all round, covers a marked square is refused. A refused candidate still keeps its ground against later ones, so
        // every stack that is built is one that was built before.
        // p2 mend 2: THE GEAR RIDES THE POLES' FEET (named as riding). The poles, standards and shores that live stands on this floor are placed by
        // live from the route, an inherited key. The site's owner's test for reading them: "a new thing may read a state that live derives from an
        // inherited key when (i) the law it follows is the place's own and holds whatever the key's values, (ii) live's function is called, not
        // copied, at the thing's own place, (iii) it reads nothing of the eye, the clock or the share of the flight by itself, (iv) it is named as
        // riding." The law here: nothing is stacked where a pole stands. (i) it holds wherever live sets its poles; (ii) the feet are read from
        // what live has built, never worked out again: the instance matrices of the hero's timber batches (standards, bilge shores, ladders), the
        // hero's list of hoist feet, and the positions and indices of the last cradle strip's own batch, which is why the gear is laid here, after
        // that strip, in a batch of its own; (iii) no u, no point of the path, no distance to the path is read; (iv) this remark. A foot is what a
        // timber has within 2.6 m of the floor (the tallest stack stands 2.4 m).
        // p3 mend 2, AN ORDERED CURE (the site owner's ruling; see the ropes' rest ground above): no stack stands where a slipped mooring rope
        // comes to rest. The rest ground is marked on the plan below before any candidate is tested, so a candidate whose footprint, 0.6 m wider
        // all round, covers it is refused by the test this block already makes: the stack is kept clear of the rope's line by the rope's
        // thickness and that margin. The stream is untouched: all 160 candidates' dice are drawn before anything is tested, as before, and no
        // new die is drawn. A refused candidate is simply not built: it has already taken its ground against later candidates (it is in `put`
        // before the plan is asked), so no other candidate takes its place and every stack that is built is one live builds, where live builds
        // it. No line of this block is changed: these remark lines and the marking of the rest ground are added.
        const fy = -30, aL = yardPails, NL = aL.length / 4, gear = makeBuilder();
        const gr = makeRng('moon-yard-gear:' + ctx.seed), cand = [], put = [];
        for (let i = 0; i < 160; i++) cand.push([gr(), gr(), gr(), gr(), gr(), gr(), gr()]);
        const flr = [STONE[0] * 0.95, STONE[1] * 0.95, STONE[2] * 0.95], shk = 1 / Math.max(sunV.y, 0.15), plankC = [0.47, 0.385, 0.26];
        // one timber lying level: its long faces are wood with the grain along them (one board across, so every arris is drawn), its sawn ends paler
        const timber = (cx, cy, cz, hw, hh, hl, yaw, col, sd, top = 1, tv = 0.26) => {
          const c = Math.cos(yaw), sn = Math.sin(yaw), pt = (x, y, z) => [cx + x * c + z * sn, cy + y, cz - x * sn + z * c];
          const A = pt(-hw, -hh, hl), B = pt(hw, -hh, hl), C = pt(hw, -hh, -hl), D = pt(-hw, -hh, -hl), E = pt(-hw, hh, hl), F = pt(hw, hh, hl), G = pt(hw, hh, -hl), H = pt(-hw, hh, -hl);
          const o = { sd, u0: 0, u1: 2 * hl, v0: 0.03, v1: 0.29 }, end = [col[0] * 1.5, col[1] * 1.5, col[2] * 1.45];
          gear.quad(B, C, G, F, col, K.WOOD, o); gear.quad(D, A, E, H, col, K.WOOD, o);
          if (top) gear.quad(F, G, H, E, col, K.WOOD, { sd, u0: 0, u1: 2 * hl, v0: 0.03, v1: 0.03 + tv });
          gear.quad(A, B, F, E, end, K.PLAIN, { sd }); gear.quad(C, D, H, G, end, K.PLAIN, { sd });
        };
        const GC = 0.25, GNX = Math.ceil(2 * B_X / GC), GNZ = Math.ceil((B_Z1 - B_Z0) / GC), plan = new Uint8Array(GNX * GNZ), FOOT = fy + 2.6;
        const mark = (x, z) => { const gx = Math.floor((x + B_X) / GC), gz = Math.floor((z - B_Z0) / GC); if (gx >= 0 && gx < GNX && gz >= 0 && gz < GNZ) plan[gz * GNX + gx] = 1; };
        const edge = (ax, ay, az, bx, by, bz, top) => {                         // an edge of a live thing, as much of it as lies under top, onto the plan
          if (ay > top && by > top) return;
          const f0 = ay > top ? (ay - top) / (ay - by) : 0, f1 = by > top ? (top - ay) / (by - ay) : 1, dx = bx - ax, dz = bz - az, ns = Math.ceil(Math.hypot(dx, dz) * (f1 - f0) / 0.2);
          for (let q = 0; q <= ns; q++) { const f = ns ? f0 + (f1 - f0) * q / ns : f0; mark(ax + dx * f, az + dz * f); }
        };
        {
          const QP = quay.positions, QI = quay.indices;
          for (let t = 0; t < QI.length; t += 3) {
            if (t % 9000 === 0) await ctx.yield();
            for (let e = 0; e < 3; e++) {
              const va = QI[t + e] * 3, vb = QI[t + (e + 1) % 3] * 3;
              if (QP[va + 1] > -1 || QP[vb + 1] > -1) continue;                     // quay level and above: not on the dock floor
              edge(QP[va], QP[va + 1], QP[va + 2], QP[vb], QP[vb + 1], QP[vb + 2], 0);
            }
          }
          for (const bo of A.bollards) {                                           // and the bollards live stands on the floor (the same list its own loop reads)
            if (bo.position.y - OFF > -1) continue;
            for (let ox = -0.5; ox <= 0.5; ox += GC) for (let oz = -0.5; oz <= 0.5; oz += GC) mark(bo.position.x + ox, bo.position.z + oz);
          }
          // mend 2: the feet of the hero's timbers, each instance where live's own matrix puts it
          const im = new THREE.Matrix4(), wm = new THREE.Matrix4(), pv = new THREE.Vector3(), timbers = [];
          hero.object.traverse((o) => { if (o.isInstancedMesh && o.geometry.attributes.aFx) timbers.push(o); });
          for (const o of timbers) {
            const gp = o.geometry.attributes.position, gi = o.geometry.index, nv = gp.count, nt = gi ? gi.count : nv, wp = new Float32Array(nv * 3), lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];
            for (let k = 0; k < nv; k++) { pv.fromBufferAttribute(gp, k); lo[0] = Math.min(lo[0], pv.x); lo[1] = Math.min(lo[1], pv.y); lo[2] = Math.min(lo[2], pv.z); hi[0] = Math.max(hi[0], pv.x); hi[1] = Math.max(hi[1], pv.y); hi[2] = Math.max(hi[2], pv.z); }
            for (let q = 0; q < o.count; q++) {
              if (q % 256 === 0) await ctx.yield();
              im.fromArray(o.instanceMatrix.array, q * 16); wm.multiplyMatrices(o.matrixWorld, im);
              const m = wm.elements; let low = m[13];
              for (let a = 0; a < 3; a++) low += Math.min(m[a * 4 + 1] * lo[a], m[a * 4 + 1] * hi[a]);
              if (low > FOOT) continue;                                            // none of it comes down to where a stack could stand
              for (let k = 0; k < nv; k++) { pv.fromBufferAttribute(gp, k).applyMatrix4(wm); wp[k * 3] = pv.x; wp[k * 3 + 1] = pv.y; wp[k * 3 + 2] = pv.z; }
              for (let t = 0; t < nt; t += 3) for (let e = 0; e < 3; e++) {
                const va = (gi ? gi.getX(t + e) : t + e) * 3, vb = (gi ? gi.getX(t + (e + 1) % 3) : t + (e + 1) % 3) * 3;
                edge(wp[va], wp[va + 1], wp[va + 2], wp[vb], wp[vb + 1], wp[vb + 2], FOOT);
              }
            }
          }
          for (const ho of A.hoists) for (let ox = -1.25; ox <= 1.25; ox += GC) for (let oz = -1.25; oz <= 1.25; oz += GC) mark(ho.position.x + ox, ho.position.z + oz);      // the bucket hoists: their two ropes come down 0.8 m either side of each foot
          const XP = ex.positions, XI = ex.indices;                                // the poles of the last cradle strip and the staging tower, just built above
          for (let t = 0; t < XI.length; t += 3) for (let e = 0; e < 3; e++) { const va = XI[t + e] * 3, vb = XI[t + (e + 1) % 3] * 3; edge(XP[va], XP[va + 1], XP[va + 2], XP[vb], XP[vb + 1], XP[vb + 2], FOOT); }
        }
        for (let i = 0; i < ropeRest.length; i += 4) {                             // p3 mend 2: the ropes' rest ground, every plan square a rectangle of it touches
          const gx0 = Math.max(0, Math.floor((ropeRest[i] + B_X) / GC)), gx1 = Math.min(GNX - 1, Math.floor((ropeRest[i + 1] + B_X) / GC)), gz0 = Math.max(0, Math.floor((ropeRest[i + 2] - B_Z0) / GC)), gz1 = Math.min(GNZ - 1, Math.floor((ropeRest[i + 3] - B_Z0) / GC));
          for (let gz = gz0; gz <= gz1; gz++) for (let gx = gx0; gx <= gx1; gx++) plan[gz * GNX + gx] = 1;
        }
        for (let i = 0; i < cand.length; i++) {
          if (i % 16 === 0) await ctx.yield();
          const [dX, dS, dZ, dK, dY, dN, dT] = cand[i];
          const kind = dK < 0.4 ? 0 : dK < 0.7 ? 1 : 2, tone = 0.82 + 0.36 * dT;
          const hsh = (j) => { const t = Math.sin((j + 1) * 12.9898 + dT * 78.233) * 43758.5453; return t - Math.floor(t); };
          const nn = kind === 0 ? 1 + Math.floor(dN * 3) : kind === 1 ? 4 + Math.floor(dN * 5) : 5 + Math.floor(dN * 8);      // courses, shores in the bottom tier, layers of planks
          const fr = (dN * (kind === 0 ? 3 : kind === 1 ? 5 : 8)) % 1;
          const L = kind === 0 ? 3.6 + 1.4 * fr : kind === 1 ? 6 + 3 * fr : 3.6 + 1.2 * fr, tiers = nn < 6 ? 2 : 3;
          const hw = kind === 0 ? L / 2 : kind === 1 ? nn * 0.25 + 0.15 : 0.65, hl = L / 2, hgt = kind === 0 ? 0.8 * nn : kind === 1 ? 0.3 + 0.42 * tiers : 0.16 * nn;
          const rad = Math.hypot(hw, hl), yaw = (dY < 0.5 ? 0 : Math.PI / 2) + ((dY * 2) % 1 - 0.5) * 0.3, c = Math.cos(yaw), sn = Math.sin(yaw);
          const x = (dS < 0.5 ? -1 : 1) * (14 + rad + dX * (B_X - 19 - 2 * rad)), z = B_Z0 + 5 + rad + dZ * (B_Z1 - B_Z0 - 10 - 2 * rad);
          let ok = true;
          for (let q = 0; q < NL && ok; q++) {
            const ex = aL[q * 4] - x, ez = aL[q * 4 + 1] - z;
            if (Math.hypot(Math.max(Math.abs(ex * c - ez * sn) - hw, 0), Math.max(Math.abs(ex * sn + ez * c) - hl, 0)) < 2.5) ok = false;
          }
          for (const g of put) if (Math.hypot(g[0] - x, g[1] - z) < g[2] + rad + 0.6) ok = false;
          if (!ok) continue;
          put.push([x, z, rad, hgt]);
          const at = (lx, lz) => [x + lx * c + lz * sn, z - lx * sn + lz * c];
          for (let lx = -hw - 0.6; lx <= hw + 0.6 && ok; lx += 0.17) for (let lz = -hl - 0.6; lz <= hl + 0.6; lz += 0.17) {
            const p = at(lx, lz), gx = Math.floor((p[0] + B_X) / GC), gz = Math.floor((p[1] - B_Z0) / GC);
            if (gx >= 0 && gx < GNX && gz >= 0 && gz < GNZ && plan[gz * GNX + gx]) { ok = false; break; }
          }
          if (!ok) continue;                                       // it would stand in a thing live laid there
          if (kind === 0) {                                        // a crib of spare keel blocks: 0.8 m oak baulks cross-laid three to a course
            for (let k = 0; k < nn; k++) for (let j = -1; j <= 1; j++) {
              const q = k * 3 + j + 1, off = j * (L / 2 - 0.4), p = k % 2 ? at(0, off) : at(off, 0), v = tone * (0.84 + 0.32 * hsh(q));
              timber(p[0], fy + 0.4 + 0.8 * k, p[1], 0.4, 0.4, L / 2 - 0.12 * hsh(q + 40), yaw + (k % 2 ? Math.PI / 2 : 0) + (hsh(q + 80) - 0.5) * 0.04, [OAK[0] * v, OAK[1] * v, OAK[2] * v], hsh(q + 120));
            }
          } else if (kind === 1) {                                 // a row of shores laid side by side on two bearers, a tier or two more in the valleys
            for (const e of [-1, 1]) { const p = at(0, e * L * 0.3); timber(p[0], fy + 0.15, p[1], 0.15, 0.15, hw, yaw + Math.PI / 2, [OAK[0] * tone * 0.8, OAK[1] * tone * 0.8, OAK[2] * tone * 0.8], hsh(e + 300)); }
            for (let t = 0, q = 0; t < tiers; t++) for (let j = 0; j < nn - t; j++, q++) {
              const p = at((j - (nn - t - 1) / 2) * 0.5, (hsh(q + 40) - 0.5) * 0.5), v = tone * 1.45 * (0.84 + 0.32 * hsh(q));
              timber(p[0], fy + 0.51 + 0.42 * t, p[1], 0.2, 0.2, L / 2 * (0.94 + 0.06 * hsh(q + 80)), yaw + (hsh(q + 160) - 0.5) * 0.02, [OAK[0] * v, OAK[1] * v, OAK[2] * v], hsh(q + 120));
            }
          } else {                                                 // a stack of planks, layer on layer with stickers between (the dark gaps)
            timber(x, fy + hgt / 2 - 0.03, z, hw - 0.1, hgt / 2 - 0.03, hl - 0.3, yaw, [0.09, 0.07, 0.05], 0.5, 0);
            for (let k = 0; k < nn; k++) {
              const p = at((hsh(k + 40) - 0.5) * 0.06, (hsh(k) - 0.5) * 0.24), v = tone * (0.84 + 0.32 * hsh(k + 80));
              timber(p[0], fy + 0.115 + 0.16 * k, p[1], hw, 0.045, hl * (0.96 + 0.04 * hsh(k + 120)), yaw + (hsh(k + 160) - 0.5) * 0.03, [plankC[0] * v, plankC[1] * v, plankC[2] * v], hsh(k + 200), k === nn - 1 ? 1 : 0, 2 * hw);
            }
          }
          // its shadow: the stack's outline carried along the sun's ray to the floor, as a piece of floor that takes no sun
          const sx = -sunV.x * shk * hgt, sz = -sunV.z * shk * hgt, R4 = [at(-hw, hl), at(hw, hl), at(hw, -hl), at(-hw, -hl)];
          const g0 = (p) => [p[0], fy + 0.04, p[1]], g1 = (p) => [p[0] + sx, fy + 0.04, p[1] + sz];
          gear.quad(g0(R4[0]), g0(R4[1]), g0(R4[2]), g0(R4[3]), flr, K.GROUND, { l: -1 }); gear.quad(g1(R4[0]), g1(R4[1]), g1(R4[2]), g1(R4[3]), flr, K.GROUND, { l: -1 });
          for (let e = 0; e < 4; e++) gear.quad(g0(R4[e]), g0(R4[(e + 1) % 4]), g1(R4[(e + 1) % 4]), g1(R4[e]), flr, K.GROUND, { l: -1 });
        }
        {
          // p3 THE KEEL LINE RUNS ON, AND STAGING TOWERS BESIDE THE RAILS: two kinds of standing timber on the dock floor, laid into p2's batch after
          // p2's own stacks (everything the batch held before comes first and is as it was). They stand still; nothing is made or moved in update().
          // THE STATIONS are the dock's: on the centre line through the Moon's keel point (the hero's anchor `keel` at the hero's place, read), at
          // the pitch of the hero's own keel cribs. The hero gives that pitch no name: it is typed in the part alone (P1555, a crib every 7 m either
          // way from the keel point), so the 7 is typed here as well, and said. Every station whose crib lies between the dock's ends (B_Z0 and
          // B_Z1, read) is tried: stations -19 to 21.
          // THE LAW, one for both kinds: a thing stands at its station only if its footprint (the furthest its timbers can come with every die at
          // its limit, taken alike on both sides) (i) lies wholly further than 80 m in plan from the keel point: the cradle's reach, typed from what
          // the part types (P1602: no shore's foot stands further out than 70 m) with 10 m beyond for the shores' fall; (ii) widened by 0.6 m all
          // round, touches no marked square of the floor plan: a copy of p2's plan of what live stands on this floor (p2's own is left as it was),
          // with two things marked on the copy here: every timber of the hero's instanced batches at whatever height it stands, as the box of its
          // geometry under live's own instance matrix at rest (a timber that cannot come over ground a station could stand on is passed over; a
          // batch that rides the Moon's own group is left out), and every edge of p2's stacks that rises above the floor; (iii) comes no nearer
          // than 2.5 m to a pail of light (p2's list of them, read); (iv) THE ROPES' REST (p3 mend 2): it touches no ground where a slipped mooring
          // rope comes to rest; (v) THE FAIRWAY (p3 mend 1), for towers only: its footprint is no nearer the dock's seaward wall (B_Z1, read) than
          // the gateway is wide (twice GW, read). There is no other test.
          // (iv) takes no line of its own here: the rest ground is marked on p2's plan by the ordered cure (see the remark over `ropeRest`, far
          // above, and p2's remark), the copy of the plan made here carries it, and the test of (ii) refuses it, so a crib or a tower is kept
          // clear of a resting rope's line by the rope's thickness and 0.6 m. (An earlier clause (iv), the ground of a rope's whole fall, was
          // written in p3 mend 1 and taken out again, whole, in p3 mend 2.)
          // (v) is a designer's choice on the whole field, made because of what four outside viewers said of the towers before the gates: the
          // ground before the gates is kept clear for the launch. It reads no still, seed, lens or share of the flight, and the cribs of the keel
          // line are not touched by it: the line runs on to its last station.
          // THE ROPES, SAID PLAINLY. Live draws its slipped mooring ropes by the part's own arithmetic (the rope shader's fall, P816 to P840:
          // the end the rope keeps, a direction turned from taut toward straight down, a sway, the Moon end riding the Moon), and that
          // arithmetic asks nothing of what stands in the dock: the drawn ropes fall through whatever stands there, live's own things first.
          // Measured on live alone, seeds 1 to 40 (the drawn rope, the Moon moving as live moves it): a rope passes through 256 of the hero's
          // own 360 keel cribs, on all 40 seeds, for up to 0.49 s, and through shores, poles, p2's stacks, pails and the gates' piers besides.
          // The site's owner has ruled on it: a rope passing through a standing thing in a fraction of a second is this world's own manner,
          // named and not cured; a rope come to rest lying through a thing is a fault, and (iv) is its cure here.
          // The ropes PASS through the cribs and towers of this block in that manner: on seeds 1 to 40, through 66 of the 182 cribs built (on
          // 35 seeds) and 58 of the 96 towers (on 32 seeds), 129 passings, the longest 0.09 s, none as long as live's own cribs are passed
          // (0.49 s). No rope comes to REST through a crib or a tower: at the flight's end, and ten seconds after it, none lies through one
          // on any seed.
          // THIS RIDES THE HERO'S BUILT TIMBERS AND P2'S PLAN (named as riding, under the owner's test quoted in p2's remark above). Live sets the
          // hero's poles, standards and shores from the route, an inherited key. The law here, that nothing is stood where a timber stands or hangs
          // over, is the place's own and holds wherever live sets them; the timbers are read from what live has built, never worked out again; and
          // nothing in this block reads u, the share of the flight, a point or a station of the route, pathDist, the clock, the lens, live's r2
          // stream, a rope, or any release, fall or lift. Of the flight it takes only what the rest ground on p2's plan carries (the ropes as
          // slipped and the Moon's place at the flight's end, read where that ground is worked out, by the owner's ruling). The place of live's
          // own staging tower (W1774) is not read either: its feet are among the marks of p2's plan, but they lie inside the 80 m,
          // where a station is refused before the plan is asked.
          // (a) A KEEL CRIB at each station that passes. The hero's recipe is copied, because the part gives no function to call (P1551 to P1566):
          // two sole timbers (the hero's section, 0.7 by 0.6 m, here as long as one crib), seven courses of three oak baulks cross-laid,
          // each course shorter than the one below (the hero's measures: 0.95 m a course, baulks 0.8 m wide, 8.2 m falling by 3.6 and 5.6 m falling
          // by 1.9, with the hero's play in place and length), and a capping block up to 8.0 m, the design's height for the keel blocks; in the
          // hero's oak (the three numbers of P1551, typed here because the part does not hand them out), each timber made by p2's `timber`, called.
          // The hero's wedges, iron dogs and chalk rubble are not copied. Its shadow is p2's: floor that takes no sun (flr, shk and the look's
          // sunV, read), from the foot's outline to the top course's outline carried by the crib's full height along the sun's ray.
          // Stream 'moon-keel-line:' + the seed: 90 dice a station (4 the soles, 12 a course, 2 the cap), all drawn before the station is tested,
          // and each used once where a crib is built.
          // (b) A STAGING TOWER at every second station, on both sides, 2.5 m outside the rail, which is where live's own tower stands off its
          // rail (W1774: 11.5 m out). Live lays the rails 9 m either side of the centre line and gives them no name (the 9 is typed at W260, W1552
          // and W1609), so the 9 is typed here. Live's recipe is copied, because live gives no function to call and draws its tower from r2 (W1773
          // to W1789 are untouched): the numbers of W1774 (14.6 m to the deck, 1.7 m half-width) and of W1775 to W1787 (legs 0.11 thick, spread
          // 1.3 at the foot, standing 1.15 m above the deck: 15.75 m; three levels of ledgers 0.075 and braces 0.06; eight deck planks; three
          // guard rails 0.055; the ladder's stiles 0.045 and 29 rungs 0.03; the pail) and their play. The block of chalk (W1788) is not copied. On
          // the far side of the centre line the whole frame is mirrored, so that on both sides the ladder and the deck's open side face the
          // launching way, as live's do. The foot is the floor's height (fy, read); larch (W1754) and p2's plank colour (the same three numbers
          // as W1774's) are read; live's vary and lin are called.
          // Stream 'moon-staging:' + the seed: 74 dice a station and side (8 the legs, 24 the ledgers, 12 the braces, 24 the planks, 6 the
          // rails), all drawn before the test, each used once where a tower is built.
          // A tower throws no shadow and has no shade at its foot, because live's tower has none: these have what live's has and no more.
          const PITCH = 7, REACH = 80, PAD = 0.6, RAIL = 9, KH = 8.0, HXK = 4.1 + 0.125 + 0.12, HZK = 2.9;
          const TW = 1.7, TH = 14.6, HXT = TW * 1.3 + 0.5 + 0.045, HZT = TW * 1.3 + 0.11, XB = RAIL + 2.5 + HXT + PAD + 2 * GC;
          const kx = hero.object.position.x + A.keel.x, kz = hero.object.position.z + A.keel.z;
          const plan2 = plan.slice();
          const mark2 = (x, z) => { const gx = Math.floor((x + B_X) / GC), gz = Math.floor((z - B_Z0) / GC); if (gx >= 0 && gx < GNX && gz >= 0 && gz < GNZ) plan2[gz * GNX + gx] = 1; };
          const over = (e, lo, hi) => {                                           // one timber (its box lo..hi under the matrix e) onto the plan, in steps of 0.2 m as the plan sees them
            const n0 = Math.max(1, Math.ceil(Math.hypot(e[0], e[2]) * (hi[0] - lo[0]) / 0.2)), n1 = Math.max(1, Math.ceil(Math.hypot(e[4], e[6]) * (hi[1] - lo[1]) / 0.2)), n2 = Math.max(1, Math.ceil(Math.hypot(e[8], e[10]) * (hi[2] - lo[2]) / 0.2));
            for (let i = 0; i <= n0; i++) for (let j = 0; j <= n1; j++) for (let l = 0; l <= n2; l++) {
              const lx = lo[0] + (hi[0] - lo[0]) * i / n0, ly = lo[1] + (hi[1] - lo[1]) * j / n1, lz = lo[2] + (hi[2] - lo[2]) * l / n2;
              const px = e[0] * lx + e[4] * ly + e[8] * lz + e[12], pz = e[2] * lx + e[6] * ly + e[10] * lz + e[14];
              if (Math.abs(px - kx) < XB) mark2(px, pz);
            }
          };
          {
            const im = new THREE.Matrix4(), wm = new THREE.Matrix4(), pv = new THREE.Vector3(), timbers = [];
            hero.object.traverse((o) => { if (o.isInstancedMesh && o.geometry.attributes.aFx && o.parent !== hero.moon) timbers.push(o); });
            for (const o of timbers) {
              const gp = o.geometry.attributes.position, lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];
              for (let q = 0; q < gp.count; q++) { pv.fromBufferAttribute(gp, q); lo[0] = Math.min(lo[0], pv.x); lo[1] = Math.min(lo[1], pv.y); lo[2] = Math.min(lo[2], pv.z); hi[0] = Math.max(hi[0], pv.x); hi[1] = Math.max(hi[1], pv.y); hi[2] = Math.max(hi[2], pv.z); }
              for (let q = 0; q < o.count; q++) {
                if (q % 256 === 0) await ctx.yield();
                im.fromArray(o.instanceMatrix.array, q * 16); wm.multiplyMatrices(o.matrixWorld, im); const e = wm.elements;
                let cx = e[12] - kx, rx = 0, cz = e[14] - kz, rz = 0;
                for (let a = 0; a < 3; a++) { cx += e[a * 4] * (lo[a] + hi[a]) / 2; rx += Math.abs(e[a * 4]) * (hi[a] - lo[a]) / 2; cz += e[a * 4 + 2] * (lo[a] + hi[a]) / 2; rz += Math.abs(e[a * 4 + 2]) * (hi[a] - lo[a]) / 2; }
                if (Math.abs(cx) - rx > XB || Math.hypot(Math.abs(cx) + rx, Math.abs(cz) + rz) < REACH - PAD - 2 * GC) continue;      // none of it comes over ground a station could stand on
                over(e, lo, hi);
              }
            }
            const GP = gear.positions, GI = gear.indices;
            for (let t = 0; t < GI.length; t += 3) for (let e = 0; e < 3; e++) {
              const va = GI[t + e] * 3, vb = GI[t + (e + 1) % 3] * 3;
              if ((GP[va + 1] < fy + 0.1 && GP[vb + 1] < fy + 0.1) || Math.min(GP[va], GP[vb]) - kx > XB || Math.max(GP[va], GP[vb]) - kx < -XB) continue;
              const dx = GP[vb] - GP[va], dz = GP[vb + 2] - GP[va + 2], ns = Math.ceil(Math.hypot(dx, dz) / 0.2);
              for (let q = 0; q <= ns; q++) { const f = ns ? q / ns : 0; mark2(GP[va] + dx * f, GP[va + 2] + dz * f); }
            }
          }
          const stands = (cx, cz, hx, hz, tower) => {
            if (tower && B_Z1 - (cz + hz) < 2 * GW) return false;                   // (v) the fairway
            if (Math.hypot(Math.max(Math.abs(cx - kx) - hx, 0), Math.max(Math.abs(cz - kz) - hz, 0)) <= REACH) return false;
            const gx0 = Math.max(0, Math.floor((cx - hx - PAD + B_X) / GC)), gx1 = Math.min(GNX - 1, Math.floor((cx + hx + PAD + B_X) / GC));
            const gz0 = Math.max(0, Math.floor((cz - hz - PAD - B_Z0) / GC)), gz1 = Math.min(GNZ - 1, Math.floor((cz + hz + PAD - B_Z0) / GC));
            for (let gz = gz0; gz <= gz1; gz++) for (let gx = gx0; gx <= gx1; gx++) if (plan2[gz * GNX + gx]) return false;
            for (let q = 0; q < NL; q++) if (Math.hypot(Math.max(Math.abs(aL[q * 4] - cx) - hx, 0), Math.max(Math.abs(aL[q * 4 + 1] - cz) - hz, 0)) < 2.5) return false;
            return true;
          };
          const K0 = Math.ceil((B_Z0 + HZK + PAD - kz) / PITCH), K1 = Math.floor((B_Z1 - HZK - PAD - kz) / PITCH);
          await ctx.yield();
          {
            const kr = makeRng('moon-keel-line:' + ctx.seed), y0 = 0.6, lh = 0.95, nl = Math.floor((KH - y0 - 0.5) / lh), ND = 4 + nl * 12 + 2;
            const keelOak = (d) => { const k = 0.8 + 0.4 * d; return [0.215 * k, 0.15 * k, 0.092 * k]; };
            for (let k = K0; k <= K1; k++) {
              const z = kz + PITCH * k, dice = []; for (let i = 0; i < ND; i++) dice.push(kr());
              if (!stands(kx, z, HXK, HZK, false)) continue;
              let di = 0; const d = () => dice[di++];
              for (const sx of [-1, 1]) timber(kx + sx * 2.9, fy + 0.3, z, 0.35, 0.3, HZK, 0, keelOak(d()), d());
              for (let l = 0; l < nl; l++) {
                const y = fy + y0 + (l + 0.5) * lh, f = l / nl;
                if (l % 2 === 0) for (const dz of [-1, 0, 1]) timber(kx + (d() - 0.5) * 0.24, y, z + dz * (2.05 - 0.75 * f), 0.4, lh / 2 - 0.02, (8.2 - 3.6 * f) / 2 + (d() - 0.5) * 0.25, Math.PI / 2, keelOak(d()), d());
                else for (const dx of [-1, 0, 1]) timber(kx + dx * (2.9 - 1.5 * f), y, z + (d() - 0.5) * 0.2, 0.4, lh / 2 - 0.02, (5.6 - 1.9 * f) / 2 + (d() - 0.5) * 0.2, 0, keelOak(d()), d());
              }
              const capY = y0 + nl * lh; timber(kx, fy + (capY + KH) / 2, z, 0.75, (KH - capY) / 2, 1.5, Math.PI / 2, keelOak(d()), d());
              const fT = (nl - 1) / nl, hxT = (nl - 1) % 2 ? 2.9 - 1.5 * fT + 0.4 : (8.2 - 3.6 * fT) / 2, hzT = (nl - 1) % 2 ? (5.6 - 1.9 * fT) / 2 : 2.05 - 0.75 * fT + 0.4;
              const sx = -sunV.x * shk * KH, sz = -sunV.z * shk * KH, C4 = [[-1, 1], [1, 1], [1, -1], [-1, -1]];
              const g0 = (c) => [kx + c[0] * 4.1, fy + 0.04, z + c[1] * HZK], g1 = (c) => [kx + c[0] * hxT + sx, fy + 0.04, z + c[1] * hzT + sz];
              gear.quad(g0(C4[0]), g0(C4[1]), g0(C4[2]), g0(C4[3]), flr, K.GROUND, { l: -1 }); gear.quad(g1(C4[0]), g1(C4[1]), g1(C4[2]), g1(C4[3]), flr, K.GROUND, { l: -1 });
              for (let e = 0; e < 4; e++) gear.quad(g0(C4[e]), g0(C4[(e + 1) % 4]), g1(C4[(e + 1) % 4]), g1(C4[e]), flr, K.GROUND, { l: -1 });
            }
          }
          await ctx.yield();
          {
            const tr = makeRng('moon-staging:' + ctx.seed), ND = 74, h = TH, w = TW, y0 = fy;
            for (let k = K0 + (((K0 % 2) + 2) % 2); k <= K1; k += 2) for (const m of [-1, 1]) {
              const tz = kz + PITCH * k, tx = kx + m * (RAIL + 2.5), dice = []; for (let i = 0; i < ND; i++) dice.push(tr());
              if (!stands(tx, tz, HXT, HZT, true)) continue;
              let di = 0; const d = () => dice[di++];
              const cs = [[-m, -1], [m, -1], [m, 1], [-m, 1]];
              const at = (i, y) => { const f = (y - y0) / h, kk = w * (1.3 - 0.3 * f); return [tx + cs[i][0] * kk, tz + cs[i][1] * kk]; };
              for (let i = 0; i < 4; i++) { const a = at(i, y0), b = at(i, y0 + h + 1.15); gear.beam(a[0], y0, a[1], b[0], y0 + h + 1.15, b[1], 0.11, vary(larch, d, 0.15), K.WOOD, { sd: d() }); }
              for (let lv = 1; lv <= 3; lv++) for (let i = 0; i < 4; i++) {
                const y = y0 + lv * h / 3, a = at(i, y), b = at((i + 1) % 4, y), c = at((i + 1) % 4, y - h / 3 + 0.3);
                gear.beam(a[0], y, a[1], b[0], y, b[1], 0.075, vary(larch, d, 0.15), K.WOOD, { sd: d() });
                if ((lv + i) % 2 === 0) gear.beam(a[0], y, a[1], c[0], y - h / 3 + 0.3, c[1], 0.06, vary(larch, d, 0.15), K.WOOD, { sd: d() });
              }
              for (let b = 0; b < 8; b++) gear.box(tx + (d() - 0.5) * 0.16, y0 + h + 0.1, tz - w - 0.2 + (b + 0.5) * (2 * w + 0.4) / 8, w + 0.35, 0.035, 0.2, vary(plankC, d, 0.16), K.WOOD, { sd: d(), bottom: true });
              for (let i = 0; i < 3; i++) { const a = at(i, y0 + h), b = at(i + 1, y0 + h); gear.beam(a[0], y0 + h + 1.1, a[1], b[0], y0 + h + 1.1, b[1], 0.055, vary(larch, d, 0.15), K.WOOD, { sd: d() }); }
              for (const o of [-0.26, 0.26]) gear.beam(tx - m * (w * 1.3 + 0.5), y0, tz + o, tx - m * (w + 0.1), y0 + h + 0.9, tz + o, 0.045, larch, K.WOOD);
              for (let q = 1; q < 30; q++) { const f = q / 30, lx = tx - m * (w * 1.3 + 0.5 - (w * 0.3 + 0.4) * f); gear.beam(lx, y0 + (h + 0.9) * f, tz - 0.26, lx, y0 + (h + 0.9) * f, tz + 0.26, 0.03, larch, K.WOOD); }
              gear.lathe(tx + m * 0.5, tz - 0.4, [[y0 + h + 0.14, 0.3], [y0 + h + 1.1, 0.42], [y0 + h + 1.1, 0.36], [y0 + h + 1.0, 0.0]], 8, [0.47, 0.52, 0.57], K.PLAIN, { cols: [[0.4, 0.44, 0.5], [0.5, 0.55, 0.6], [0.2, 0.22, 0.25], lin('#8FD3E8', 0.9)] });
            }
          }
        }
        scene.add(gear.mesh(stuffMat));
      }
      // the birds
      const pb = makeBuilder(), dove = cast === 'doves';
      const WH = [0.78, 0.78, 0.76], GR = dove ? [0.74, 0.74, 0.73] : [0.42, 0.46, 0.52], TIP = dove ? [0.6, 0.6, 0.6] : [0.05, 0.05, 0.06];
      pb.blob(0, 0, 0, 0.085, 0.085, 0.27, WH, r2, { seg: 6, rows: 5, rough: 0 });
      pb.blob(0, 0.075, 0.27, 0.058, 0.058, 0.075, WH, r2, { seg: 5, rows: 4, rough: 0 });
      pb.tri([-0.022, 0.07, 0.33], [0.022, 0.07, 0.33], [0, 0.055, 0.43], [0.8, 0.55, 0.08], K.PLAIN);
      pb.tri([-0.07, 0.01, -0.24], [0.07, 0.01, -0.24], [0, 0.0, -0.43], WH, K.PLAIN);
      for (const sx of [-1, 1]) {
        const xs = [0.09, 0.3, 0.52, 0.7], ch = [0.21, 0.2, 0.13, 0.03], sw = [0.04, 0.05, -0.02, -0.13];
        for (let i = 0; i < 3; i++) pb.quad([sx * xs[i], 0.03, sw[i] - ch[i] / 2], [sx * xs[i + 1], 0.03, sw[i + 1] - ch[i + 1] / 2], [sx * xs[i + 1], 0.03, sw[i + 1] + ch[i + 1] / 2], [sx * xs[i], 0.03, sw[i] + ch[i] / 2], i === 2 ? TIP : GR, K.PLAIN);
      }
      const bg = pb.mesh(null).geometry, NR = 20, NP = NR + 6, aG = new Float32Array(NP * 4), aG2 = new Float32Array(NP * 4), tg = new THREE.Vector3();
      for (let i = 0; i < NR; i++) {
        const f = 2.4 + (i + r2.range(0.1, 0.9)) / NR * (pts.length - 3.4), j = Math.min(pts.length - 2, Math.floor(f)), t = f - j, a = pts[j], b = pts[j + 1];
        path.tangentAt(a.u, tg);
        aG.set([a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t + 1.34, a.z + (b.z - a.z) * t, 0.636 + 0.006 * (i / NR) + r2.range(0, 0.007)], i * 4);
        aG2.set([Math.atan2(tg.x, tg.z) + r2.range(-0.45, 0.45), r2.range(12, 16.5), r2(), r2.range(10, 14.5)], i * 4);
      }
      // six more stand low beside the lane between the crescent stacks and go up across the lens as we come down it (u 0.215)
      path.pointAt(0.215, v); path.tangentAt(0.215, tg); tg.y = 0; tg.normalize();
      for (let i = 0; i < 6; i++) {
        const sgn = i % 2 ? 1 : -1, ahead = 6.5 + i * 1.5 + r2.range(-0.5, 0.5), lat = sgn * r2.range(8.5, 11.5);
        const dx = -sgn * tg.z * 0.9 + tg.x * 0.5, dz = sgn * tg.x * 0.9 + tg.z * 0.5;
        aG.set([v.x + tg.x * ahead + tg.z * lat, v.y - 8.6, v.z + tg.z * ahead - tg.x * lat, 0.182 + 0.0035 * i + r2.range(0, 0.002)], (NR + i) * 4);
        aG2.set([Math.atan2(dx, dz) + r2.range(-0.15, 0.15), r2.range(10, 13), r2(), r2.range(12, 15.5)], (NR + i) * 4);
      }
      const ig = new THREE.InstancedBufferGeometry();
      for (const k of ['position', 'normal', 'color']) ig.setAttribute(k, bg.attributes[k]);
      ig.setIndex(bg.index);
      ig.setAttribute('aG', new THREE.InstancedBufferAttribute(aG, 4)); ig.setAttribute('aG2', new THREE.InstancedBufferAttribute(aG2, 4));
      ig.instanceCount = NP;
      const pm = new THREE.Mesh(ig, mk(PERCH_VERT, perchFrag(glsl), perchU, { side: THREE.DoubleSide }));
      pm.frustumCulled = false; pm.matrixAutoUpdate = false; scene.add(pm);
    }

    await ctx.yield();
    // ---- gulls (or doves, or swifts): six cross the lens at the reveal, the rest wheel by the mirror and over the harbour
    const faunaLight = hour === 'night' ? 'night' : { sunDir: LOOK.sun, sunColor: LOOK.sunCol[0], sunIntensity: 2.7 * LOOK.sunCol[1], sky: LOOK.skyCol[0], skyIntensity: 2.6 * LOOK.skyCol[1], ground: '#E9C98A', groundIntensity: 0.6 };
    const fauna = F.makeFauna(scene, { light: faunaLight });
    const doveLook = cast === 'doves' ? { body: '#ffffff', belly: '#ffffff', wingC: '#f1f1ee', trail: '#ffffff', tip: '#dcdcdc', beak: '#e6a0a0', size: 1.25 } : {};
    const wheelers = cast === 'swifts' ? { species: 'swifts', size: 2.2 } : { species: 'gulls', ...doveLook };
    await ctx.yield();
    fauna.add(F.makeFlock({ rng: rng.fork('six'), species: 'gulls', ...doveLook, count: 6, spread: [5, 1.6, 7],
      cross: { path, u: 0.215, lead: 9, span: 170, angle: 58, side: 1, height: 0.5, duration: 43 } }));
    await ctx.yield();
    fauna.add(F.makeFlock({ rng: rng.fork('wheel'), ...wheelers, count: Math.round(16 * detail), center: [-62, 4, -52], radius: 40, height: 12 }));
    await ctx.yield();
    fauna.add(F.makeFlock({ rng: rng.fork('street'), species: 'gulls', ...doveLook, count: 7, spread: [6, 2.5, 10], along: { path, side: 0.5, up: 6.5, lead: 21, from: -0.05, to: 0.15, drift: 7 } }));
    await ctx.yield();
    fauna.add(F.makeFlock({ rng: rng.fork('roofs'), species: 'gulls', ...doveLook, count: 5, spread: [3, 1.5, 6], cross: { path, u: 0.03, lead: 16, span: 70, angle: 72, side: -1, height: 5, duration: 43 } }));
    await ctx.yield();
    fauna.add(F.makeFlock({ rng: rng.fork('harbour'), ...wheelers, count: Math.round(14 * detail), center: [8, 2, 262], radius: 58, height: 12 }));

    await ctx.yield();
    // ---- chimney smoke leaning seaward, steam from the drifters, and (some mornings) a sea-fret lying in the dock
    {
      const aS = [], aS2 = [], pr = rng.fork('puffs');
      for (const c of chimneys.concat(boatFunnels)) {
        const n = Math.round(11 * detail), sp = pr.range(0.07, 0.11), ph = pr();
        for (let i = 0; i < n; i++) { aS.push(c[0], c[1], c[2], (ph + i / n) % 1); aS2.push(pr.range(10, 15), sp, pr.range(2.2, 3.4), 0); }
      }
      if (weather === 'fret') {
        const n = Math.round(90 * detail);
        for (let i = 0; i < n; i++) { aS.push(pr.range(-126, 126), pr.range(-8, 3), pr.range(-130, 144), pr()); aS2.push(pr.range(20, 40), pr.range(0.008, 0.016), pr.range(34, 54), 1); }
      }
      {
        const dr = rng.fork('sift'), n = Math.round(1000 * detail);
        for (let i = 0; i < n; i++) {
          // two in three fall where the sun gets in under the rim, so they are caught in it
          let r = 104 * Math.sqrt(dr()), a = dr.range(0, Math.PI * 2);
          if (i % 3 && (Math.cos(a) * sunV.x + Math.sin(a) * sunV.z) * r < 14) { a = Math.atan2(sunV.z, sunV.x) + dr.range(-1.15, 1.15); r = dr.range(30, 104); }
          const top = 98 - Math.sqrt(14400 - r * r) - 0.5 + (r > 60 ? 0 : 12), fall = top + 30;
          aS.push(r * Math.cos(a), top, r * Math.sin(a), dr()); aS2.push(fall, dr.range(1.1, 2.2) / fall, dr.range(0.5, 1.15), 2);
        }
        const nv = Math.round(48 * detail), sa = Math.atan2(sunV.z, sunV.x);
        for (let i = 0; i < nv; i++) {            // half on the sunward side, half in an arc before the gates: the blade of daylight
          const gate = i % 2 === 1, a = gate ? Math.PI / 2 + dr.range(-1.1, 1.1) : sa + dr.range(-1.25, 1.25), r = gate ? dr.range(84, 122) : dr.range(24, 96);
          aS.push(r * Math.cos(a), dr.range(-25, -13), r * Math.sin(a), dr()); aS2.push(gate ? dr.range(0.04, 0.075) : dr.range(0.08, 0.15), dr.range(0.02, 0.04), dr.range(15, 26), 3);
        }
        // and a curtain of it beside our way under the belly, on the side the sun comes in: the edge of the Moon's shadow drawn in the air
        const nc = Math.round(44 * detail), sgn = sunV.x >= 0 ? 1 : -1;
        for (let i = 0; i < nc; i++) { aS.push(sgn * dr.range(9, 66), dr.range(-27, -8), dr.range(8, 122), dr()); aS2.push(dr.range(0.1, 0.17), dr.range(0.02, 0.04), dr.range(12, 21), 3); }
      }
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
      g.setAttribute('aS', new THREE.InstancedBufferAttribute(new Float32Array(aS), 4)); g.setAttribute('aS2', new THREE.InstancedBufferAttribute(new Float32Array(aS2), 4));
      g.instanceCount = aS2.length / 4;
      const m = new THREE.Mesh(g, mk(PUFF_VERT, PUFF_FRAG, {}, { transparent: true, depthWrite: false }));
      m.frustumCulled = false; m.renderOrder = 4; m.matrixAutoUpdate = false; scene.add(m);
    }
    await ctx.yield();
    if (weather === 'fret') {
      // the fret itself: a slow white lid lying in the basin, so the sphere stands out of a white pool
      for (let L = 0; L < 2; L++) {
        const g = new THREE.BufferGeometry(), y = -3 + L * 5.5;
        g.setAttribute('position', new THREE.Float32BufferAttribute([-B_X, y, B_Z0, B_X, y, B_Z0, B_X, y, B_Z1, -B_X, y, B_Z1], 3)); g.setIndex([0, 2, 1, 0, 3, 2]);
        const m = new THREE.Mesh(g, mk(FRET_VERT, fretFrag(glsl), { uLayer: { value: L } }, { transparent: true, depthWrite: false, side: THREE.DoubleSide }));
        m.frustumCulled = false; m.renderOrder = 3; m.matrixAutoUpdate = false; scene.add(m);
      }
    }
    // chalk dust in the air everywhere
    await ctx.yield();
    const motes = makeParticles({ rng: rng.fork('motes'), preset: 'dust', time: HU.uTime, count: Math.round(1500 * detail), box: [64, 34, 64], size: [0.03, 0.065], near: [9, 20], color: hour === 'night' ? '#aab8d8' : '#fff3df', intensity: hour === 'night' ? 0.5 : 1 });
    scene.add(motes.object);
    await ctx.yield();
    fauna.add(F.makeFlock({ rng: makeRng(977 + (ctx.seed | 0)), species: 'gulls', ...doveLook, count: 4, spread: [5, 1.6, 7], cross: { path, u: 0.94, lead: 46, span: 110, angle: 74, side: -1, height: 2.5, duration: 43 } }));
    await ctx.yield();
    await sky.prewarm(ctx.renderer, null, scene);

    const catYaw = LOOK.sun[2] < 0 ? -0.5 : 0.5;
    return {
      scene, path, duration: 43,
      // linger along the mirror, make up the time on the climb into the cradle and under the belly
      pace: (u) => 1 - 0.27 * sstep(0.44, 0.5, u) * (1 - sstep(0.6, 0.66, u)) + 0.16 * sstep(0.26, 0.31, u) * (1 - sstep(0.38, 0.44, u)) + 0.1 * sstep(0.66, 0.72, u) * (1 - sstep(0.82, 0.88, u)),
      camera: { fov: 62, near: 0.3, far: 3000, lookAhead: 22, sway: 0.5, bank: 0.45 },
      pois: [
        { at: [0, 122, 0], from: 0.13, to: 0.31, weight: 0.5 },
        { at: [0, 165, 0], from: 0.27, to: 0.4, weight: 0.5 },                                                  // up over the top rail as we come in through the poles: the bare dome against the sky
        { at: [A.seamPoint.x, A.seamPoint.y - OFF, A.seamPoint.z], from: 0.45, to: 0.565, weight: 0.42 },      // the seam: chalk, wet size, mirror
        { at: [-12, -4, 36], from: 0.585, to: 0.7, weight: 0.62 },                                           // level, along the rail and under the overhang: the belly, the birds going up
        { at: [4, -15, 140], from: 0.67, to: 0.8, weight: 0.5 },                                               // the blade of daylight and the gate in it
        { at: [0, 24, 200], from: 0.775, to: 0.93, weight: 0.42 },                                            // up at the belly as we pass under
      ],
      portal: { shape: 'circle', radius: 7, color: '#fff0c4', glow: 1, revealDistance: 260 },
      post: { exposure: LOOK.exposure, bloom: { strength: hour === 'night' ? 0.5 : 0.3, radius: 0.35, threshold: 1.0 },
        grade: { saturation: 1.08, contrast: 1.05, tint: '#fffaf2', shadowTint: '#060d1a', vignette: 0.24, grain: 0.02, aberration: 0 } },
      ride: 'none',
      update(dt, time, camera, u) {
        hero.setProgress(u);
        hero.update(dt, time, camera);
        sky.update(dt, time, camera);
        fauna.update(dt, time, camera, u);
        motes.update(dt, time, camera);
        const up = sstep(0.022, 0.05, u) * (1 - sstep(0.1, 0.13, u));
        cat.head.position.set(cat.pivot.x, cat.pivot.y + 0.1 * up, cat.pivot.z);
        cat.head.rotation.set(0, Math.PI / 2 + catYaw * up + 0.08 * Math.sin(time * 0.7) * up, -0.3 * (1 - up));
        bell.mesh.rotation.z = 0.5 * Math.sin(time * 1.9);
        if (hang.group) {
          const sw = sstep(0.03, 0.19, u), th = 0.1 + (Math.PI / 2 - 0.1) * sw + 0.4 * sw * Math.sin(time * 0.23 + 0.6) + 0.05 * Math.sin(time * 0.31);      // end-on to the street (beside the Moon's disc) until we are out on the quay, then it swings across the lane
          hang.group.rotation.set(0.035 * Math.sin(time * 0.51), th, 0.03 * Math.sin(time * 0.37));
          hang.group.updateMatrixWorld(true);
          hang.c.um.multiplyMatrices(toHero, hang.c.mesh.matrixWorld);
          WU.uHang.value.set(hang.group.position.x, hang.group.position.z, Math.cos(th), -Math.sin(th));
        }
      },
      dispose() { hero.dispose(); sky.dispose?.(); roofTex.dispose(); },
    };
  },
};
