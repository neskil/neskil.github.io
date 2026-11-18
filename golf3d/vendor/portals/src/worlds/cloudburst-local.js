// THE CLOUDBURST LOCAL: a monsoon afternoon in a steam-age Bombay, seen from the open doorway of a
// suburban train. The line runs in on a brick viaduct over a quarter of tin roofs, tarpaulins, tanks
// and chawls; a wall of rain crosses the roofs, swallows the train (an express overtakes an arm's
// length away, a goods train crosses the flyover) and passes; low sun floods the wet throat, three
// gantries, the iron shed and the domed terminus (the hero, src/parts/cloudburst-local.js), and the
// train runs on into the portal standing in the last iron arch.
//
// One weather value drives everything, keyed to u: the rain band is a slab travelling along
// N = (-0.6, 0.8); E = dot(p.xz, N) says where a point lies in it. Fog, sky, light, wetness, rain,
// run-off, veils, gusts, the sun edge on the ground and every creature follow from it.
//
// Looks by seed and ctx.vary: hour (late gold / monsoon noon / dusk with lamps), weather (the classic
// cloudburst / a late, deeper band that follows the train into the shed / a sun-shower), cast (rival
// as black mail, green engine with milk vans, or a second maroon local; kite day; flamingos) and the
// rare flooded line.
//
// The doorway (one group: jamb, pole, lintel, straps, gutter rope) is carried with the camera and hidden while the world
// is drawn through the previous portal (ctx.through). We ride the LEADING doorway of the leading coach, the engine
// propelling from the rear: the coach end sits 0.7 m ahead of the eye behind the jamb skin, so nothing of our own train
// is in the picture but the door, and the whole line lies open ahead. A light engine runs 165 m ahead of us on our own
// line (its plume leads the eye) and takes the points to the next road in the shed. Our line runs 2.6 m left of the path.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import * as fx from '../kit/fx.js';
import * as flora from '../kit/flora.js';
import * as F from '../kit/fauna.js';
import { buildHero, OUR_X, K, makeG, makeSprites, lin, mixc, mulc, SURF_FRAG, GLSL_COMMON, GLSL_MIRROR, FOG_FADE,
  GLOW_VERT, GLOW_FRAG, TRACK_VERT, TRACK_FRAG, GROUND_VERT, GROUND_FRAG } from '../parts/cloudburst-local.js';

const TAU = Math.PI * 2;
const NX = -0.6, NZ = 0.8;                       // travel direction of the rain band (and of the sun edge)
const EYE = 2.9;                                 // eye above rail
const ZC = 558.1, SLOPE = 2 * (ZC - 260) / 1340; // end of the curve, heading there (24 degrees)
const pathX = (z) => (z <= 260 ? 0 : z <= ZC ? (z - 260) * (z - 260) / 1340 : (ZC - 260) * (ZC - 260) / 1340 + SLOPE * (z - ZC));
const pathDX = (z) => (z <= 260 ? 0 : z <= ZC ? 2 * (z - 260) / 1340 : SLOPE);
const railY = (z) => 8 * smoothstep(305, 640, z);
const TRACK_OFF = [-6.8, OUR_X, 2.4, 7.0];        // our own line: the eye rides a metre outside the coach side

// ---------------------------------------------------------------- shaders
// world-space surfaces shaded by the hero's fragment shader (sun edge, wetness, sky reflections)
const WVERT = /* glsl */`
attribute vec3 aCol; attribute float aK;
#ifdef TINTED
attribute float aTw; attribute vec4 aI; attribute vec3 aT1;
uniform float uOurDim;
varying float vLit;
#endif
#ifdef CLOTH
attribute float aW; attribute vec4 aI;
uniform float uGust; uniform vec2 uWindDir;
#endif
#ifdef DOOR
attribute float aTw; uniform vec4 uSwing;
#endif
uniform float uTime, uProg;
varying vec3 vL, vN, vC; varying vec2 vUv; varying float vK;
#include <fog_pars_vertex>
void main(){
  vec3 p = position, n = normal, tint = vec3(1.);
  vec2 uvv = uv;
#ifdef FOLK
  {
    // people stand easy: a slow turn of the body and a sway from the feet, each in their own time
    float fph = dot(instanceMatrix[3].xz, vec2(1.7, 2.3)) + aI.x * 17.;
    float fturn = .16 * sin(uTime * (.35 + .3 * fract(aI.y * 13.7)) + fph);
    float fc = cos(fturn), fs = sin(fturn);
    p.xz = vec2(p.x * fc - p.z * fs, p.x * fs + p.z * fc); n.xz = vec2(n.x * fc - n.z * fs, n.x * fs + n.z * fc);
    p.x += sin(uTime * (.7 + .5 * fract(aI.x * 13.7)) + fph) * .03 * p.y; p.z += cos(uTime * (.55 + .4 * fract(aI.y * 9.1)) + fph * 1.3) * .02 * p.y;
  }
#endif
#ifdef TINTED
  if (aTw > 2.5 && aTw < 3.5) { p.z += cos(aI.w) * .3; p.y += sin(aI.w) * .3; }          // coupling rods
  if (aTw > 4.5 && aTw < 5.5) {                                                           // umbrella folding
    float fold = aI.w < 0. ? 1. - smoothstep(-aI.w, -aI.w + .03, uProg) : smoothstep(aI.w, aI.w + .03, uProg);     // a negative w opens at -w
    p.y -= fold * 1.2; p.xz *= mix(1., .1, fold);
    float uph = uTime * (.7 + .5 * fract(aI.w * 13.7)) + aT1.x * 40. + aI.x * 17.;
    p.x += sin(uph) * .09 * (p.y - .9) * (1. - fold); p.z += cos(uph * .83) * .07 * (p.y - .9) * (1. - fold); p.y += sin(uph * 1.3) * .025 * (1. - fold);
  }
  if (aTw > 1.5 && aTw < 2.5) uvv.y += 2. * min(aI.w, 1.);
  if (aTw > 3.5 && aTw < 4.5 && aI.w < .5) p.y -= 50.;                                    // nobody leans out of our own coach, a metre from the eye
  if (aTw > 6.5 && aTw < 7.2 && aI.w < .5) p.y -= 50.;                                    // a tail lamp hangs on the last vehicle only (vans: w 1)
  if (aTw > 7.2 && aTw < 8. && aI.w < 1.5) p.y -= 50.;                                    // (coaches: w 2)
  if (aTw > 8.5) {                                                                        // driving wheels turn about their axles (marks 9, 10, 11), in step with the rods
    vec2 ax = vec2(1.14, -5.6 + 2. * (aTw - 9.)), dw = p.yz - ax;
    float cw = cos(aI.w), sw = sin(aI.w);
    p.yz = ax + vec2(dw.y * sw + dw.x * cw, dw.y * cw - dw.x * sw);
    n.yz = vec2(n.z * sw + n.y * cw, n.z * cw - n.y * sw);
  }
  vLit = (aTw > 1.5 && aTw < 2.5 && aI.w < .5) ? .3 : 1.;
  tint = aTw < .5 ? vec3(1.) : aTw < 1.5 ? aT1 : aTw < 2.5 ? aI.xyz : aTw > 6.5 ? vec3(1.) : aTw > 4.5 ? aT1 : vec3(1.);
  if (aI.w < .5 && ((aTw > 1.1 && aTw < 1.3) || (aTw > 2.1 && aTw < 2.3))) tint *= uOurDim;   // our own coach side (marks 1.2 and 2.2) stays a quiet frame in full sun
#endif
#ifdef DOOR
  if (aTw > .5) { float hh = .64 - p.y; vec2 sw = aTw < 1.5 ? uSwing.xy : uSwing.zw; p.x += hh * sw.x; p.z += hh * sw.y; }
#endif
  vec4 w = vec4(p, 1.);
#ifdef USE_INSTANCING
  w = instanceMatrix * w; n = mat3(instanceMatrix) * n;
#endif
  w = modelMatrix * w; n = normalize(mat3(modelMatrix) * n + vec3(0., 1e-6, 0.));
#ifdef TINTED
  if (aTw > 5.5 && aTw < 6.5) {                                                           // paper kites climbing
    float kk = smoothstep(aI.w, aI.w + .2, uProg), ph = aI.w * 90. + w.x * .05;
    w.y = mix(-60., w.y, kk) + sin(uTime * .9 + ph) * 2.5;
    w.x += sin(uTime * .6 + ph * 1.7) * 4.; w.z += cos(uTime * .5 + ph) * 3.;
  }
#endif
#ifdef CLOTH
  {
    float ph = aI.w * 40. + dot(w.xz, vec2(.21, .17)), g = uGust;
    if (aW < 1.5) {                                                                       // tarpaulin: balloons
      w.y += aW * (sin(uTime * (2.1 + 3.4 * g) + ph) * (.05 + .3 * g) + sin(uTime * 6.3 + ph * 2.7 + p.x * 5.) * .1 * g + .5 * g);
      w.xz += uWindDir * (aW * .3 * g);
    } else {                                                                              // laundry: whips
      float wt = aW - 2.; wt *= wt;
      float s1 = sin(uTime * (1.6 + 4.5 * g) + ph + p.y * 2.);
      w.xz += uWindDir * (wt * (.1 + 1.3 * g + s1 * (.1 + .4 * g)));
      w.y += wt * (.75 * g + abs(s1) * .3 * g);
    }
    tint = aI.xyz;
  }
#endif
  vL = w.xyz; vN = n; vC = aCol * tint; vUv = uvv; vK = aK;
  vec4 mvPosition = viewMatrix * w;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const SKY_VERT = /* glsl */`
varying vec3 vDir;
void main(){ vDir = position; gl_Position = projectionMatrix * (modelViewMatrix * vec4(position, 1.)); }`;
// three skies in one: pearl overcast with the indigo wall and its rain curtain ahead, nothing but rain,
// then a washed west with the sunlit-topped wall gone over to the left
const SKY_FRAG = /* glsl */`
uniform vec3 uSunDir, uSunCol, uZen, uHor, uOverc, uWallCol, uWallLit, uRainCol, uFogCol, uBrass, uBreakCol;
uniform vec4 uWall;       // centre azimuth, half width, top (sin elevation), lit top 0..1
uniform vec2 uBase;       // cloud base at the left and right ends of the wall (sin elevation)
uniform vec3 uBreak;      // the brighter break in the rain: its azimuth, its strength, its top (sin elevation)
uniform vec2 uBolt;       // forked lightning at uFl's azimuth: strength, a seed for its shape
uniform vec4 uFl;         // sheet lightning inside the cloud: azimuth, sin elevation, strength, angular size
uniform float uTime, uSunK, uOver, uIn, uFlash, uSlit, uWallA;
uniform vec4 uDome;       // azimuth and elevation of the dome's springing, 1 / distance, how strongly its shape stands in the rain
varying vec3 vDir;
float sh(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float sv(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(sh(i), sh(i + vec2(1., 0.)), f.x), mix(sh(i + vec2(0., 1.)), sh(i + vec2(1., 1.)), f.x), f.y); }
float sf(vec2 p){ return sv(p) * .5 + sv(p * 2.03 + 7.1) * .25 + sv(p * 4.1 + 3.7) * .125 + sv(p * 8.3 + 1.3) * .125; }
// billows: round lumps with creases between them (the cauliflower of a cumulus head)
float bil(vec2 p){ return abs(2. * sv(p) - 1.) * .56 + abs(2. * sv(p * 2.11 + 5.3) - 1.) * .29 + abs(2. * sv(p * 4.37 + 1.7) - 1.) * .15; }
void main(){
  vec3 d = normalize(vDir + vec3(0., 1e-5, 0.));
  float el = d.y, h = max(el, 0.);
  float az = atan(d.x, -d.z + 1e-5);
  vec3 clr = mix(uHor, uZen, smoothstep(0., .62, pow(h, .7)));
  float sd = max(dot(d, uSunDir), 0.);
  float s2 = sd * sd, s8 = s2 * s2 * s2 * s2;
  clr += uSunCol * (uSunK * (s8 * .03 + s8 * s8 * s8 * s8 * .08 + pow(sd, 300.) * .3));
  clr += uSunCol * (uSunK * smoothstep(.99962, .9998, sd) * 3.2);
  // torn scud racing after the storm: two layers at different speeds, gold where the sun is behind it
  vec2 cp = d.xz / (h + .18);
  float sc = sf(cp * 2.2 + vec2(uTime * .11, -uTime * .06)), sc2 = sf(cp * 4.6 + vec2(uTime * .19, -uTime * .1) + 9.);
  float scud = max(smoothstep(.54, .74, sc), .7 * smoothstep(.6, .78, sc2)) * smoothstep(.02, .12, el) * (1. - smoothstep(.45, .9, el));
  vec3 scCol = mix(uWallCol * 2.2 + uHor * .2, uSunCol * .45 + uHor * .45, uSunK * (.35 + .65 * s2));
  clr = mix(clr, scCol, scud * .85);
  float mot = sf(cp * 1.3 + uTime * .03);
  vec3 ovc = uOverc * (.78 + .36 * mot) * (.86 + .14 * smoothstep(0., .5, el));
  ovc = mix(ovc, uWallCol * 1.3 + uOverc * .16, scud * .55);          // dark rags of scud run ahead of the storm under the pearl overcast
  vec3 col = mix(clr, ovc, uOver);
  // the storm wall: a bank of cumulonimbus, not a pane. Two octaves of billows throw its outline into lobes and its top into
  // towers; the same billows shade it (a lump is lit where it rises toward the light); its base is dark, and rain hangs
  // below the base only
  float a = abs(mod(az - uWall.x + 3.14159, 6.28318) - 3.14159);
  float ins = uWall.y - a;
  float sdir = mod(atan(uSunDir.x, -uSunDir.z + 1e-5) - az + 3.14159, 6.28318) - 3.14159, sa = abs(sdir);
  float rag = sf(vec2(az * 3.1 + uTime * .05, el * 6. - uTime * .02)) - .5, rag2 = sf(vec2(az * 9. - uTime * .14, el * 14. + uTime * .05)) - .5;
  vec2 bp1 = vec2(az * 2.3 + 11. + uTime * .004, el * 3.4 - uTime * .007), bp2 = vec2(az * 6.1 - uTime * .012, el * 8.3 + 2. - uTime * .01);
  float e1 = bil(bp1), e2 = bil(bp2), e3 = bil(bp2 * 2.7 + 4.);
  float insD = ins + (e1 - .36) * .5 + (e2 - .36) * .1;         // (no fine octave in the outline: no islands or pin holes open inside the rim)
  float tws = sf(vec2(az * 3.6 + 3., .5));
  // its top: before the front, towers far overhead; after it, a bank of cumulus heads seen whole (round lumps, never a spike)
  float topA = uWall.z * (.58 + 1.5 * tws * tws), topB = uWall.z * (.72 + .6 * tws) + (e1 - .36) * .2 + (e2 - .36) * .08;
  float topH = mix(topA, topB, uWall.w) * (1. - exp(-max(insD, 0.) / mix(.4, .2, uWall.w)));
  float dE = min(insD, (topH - el) * 1.5 + (e2 - .36) * .11 * (1. - uWall.w));
  float cov = max(smoothstep(-.02, mix(.16, .08, uWall.w), dE), mix(.26, .12, uWall.w) * smoothstep(-.3, .05, dE));       // a crisp lumpy outline in a thin veil of its own: before the front too, one bold billowing wall against the pale sky
  float side = clamp((az - uWall.x) / max(uWall.y, .01) * .5 + .5, 0., 1.);
  float base = mix(uBase.x, uBase.y, side) * (1. + rag * .5) + rag2 * .03 + (sf(vec2(az * 3., 0.)) - .5) * .08;       // ragged with scud, never a ruled line
  float under = 1. - smoothstep(base - .025, base + .025, el);
  float hF = e1 * .6 + e2 * .3 + e3 * .1;
  vec2 so = mix(vec2(-.03, .06), vec2(sign(sdir) * .06, .045), uWall.w);          // toward the light: overhead before the front, the low sun after
  float relief = clamp((hF - (bil(bp1 + so * vec2(2.3, 3.4)) * .6 + bil(bp2 + so * vec2(6.1, 8.3)) * .3 + e3 * .1)) * 3.4 + .5, 0., 1.);
  float baseK = smoothstep(base, base + .22, el), edgeK = 1. - smoothstep(0., .3, dE);
  vec3 wcol = uWallCol * (.55 + .6 * smoothstep(0., .6, el)) * (.8 + .4 * hF);
  // before the front the wall is the brief's slate indigo against the pearl sky; the richer blue belongs to the sunlit wall after it
  wcol = mix(wcol, vec3(dot(wcol, vec3(.3, .5, .2))) * vec3(.94, .97, 1.1), .4 * uOver) * (1. - .1 * uOver);
  wcol *= mix(mix(.75, .5, uWall.w), 1., baseK) * (.8 + .4 * relief);
  // height carries the form: a dark base, lit tower tops
  float tower = clamp((el - base) / max(topH - base, .06), 0., 1.); tower = tower * tower * (3. - 2. * tower);
  wcol += uOverc * uOver * (.05 + .06 * tower) * (.7 + .6 * relief);    // pearl skylight on the cloud face: before the front the wall is indigo, never black
  wcol = mix(wcol * mix(.85, .9, uWall.w), wcol * 1.3, tower);        // (after the clearing the base keeps its indigo, for the dome to burn against)
  vec3 litC = mix(uOverc * .62, uWallLit, uWall.w * uSunK);
  float litK = relief * (.22 + .78 * edgeK) * (.3 + .7 * baseK) * mix(.42, (.3 + .7 * smoothstep(2.4, .4, sa)) * uSunK, uWall.w) * (.4 + .6 * tower);
  wcol = mix(wcol, litC * (.62 + .5 * relief), clamp(litK, 0., 1.));
  // after the clearing the low sun takes the heads of the bank: gold on the side toward it, the base left indigo
  wcol = mix(wcol, litC * (.5 + .5 * relief), smoothstep(.4, 1., tower) * uWall.w * uSunK * .75 * (.3 + .7 * smoothstep(2.6, .3, sa)));
  float fdz = mod(az - uFl.x + 3.14159, 6.28318) - 3.14159;
  float fb = uFl.z * exp(-(fdz * fdz + (el - uFl.y) * (el - uFl.y) * 2.5) / max(uFl.w * uFl.w, 1e-3));
  wcol += vec3(.5, .56, .95) * (fb * (.25 + 1.5 * hF)) + vec3(.45, .5, .8) * (uFlash * (.3 + rag + .5));
  float azs = az + el * .35;
  float streak = sv(vec2(azs * 46., el * 3. + uTime * .5)) * .3 + sv(vec2(azs * 13. + 3., el * 2. + uTime * .3)) * .7;
  float fall = sf(vec2(azs * 5., el * 5. + uTime * .22));
  // the shafts under the cloud fall fast enough to be seen falling from a mile off
  float shaft = smoothstep(.22, .78, sv(vec2(azs * 38. + 1.7, el * 16. + uTime * 2.4))) * (.55 + .45 * sv(vec2(azs * 7. - uTime * .11, el * 4. + uTime * .6)));
  vec3 cur = mix(uRainCol, uWallCol * 1.6, .35 * smoothstep(0., base + .001, el)) * (.52 + .14 * streak + .4 * fall + .22 * shaft);
  cur += uSunCol * (uSunK * uWall.w * .45 * smoothstep(1.4, .2, sa) * (.4 + streak));
  float slit = uSlit * smoothstep(1.35, .3, sa) * (1. - smoothstep(base * .4, base * 1.2 + .02, el));
  cur = mix(cur, uBrass * (1. + .7 * streak), slit);
  col = mix(col, mix(wcol, cur, under), cov * uWallA);
  col = mix(col, uFogCol, smoothstep(.03, -.04, el) * .8);
  // inside the cloudburst: never a flat grey. Dark bellies of cloud overhead with paler rifts between them, a brighter break
  // low down ahead for the viaduct and the roofs to stand against, and sheet lightning deep in the cloud
  float mot2 = sf(vec2(az * 2.3 + uTime * .02, el * 5. - uTime * .05));
  float belly = bil(vec2(az * 1.7 + uTime * .025, el * 2.6 - uTime * .04)) * .62 + e2 * .38;
  // the cloud base is a ceiling in true perspective: dark rolls of scud racing with the wind, paler rifts between them
  vec2 cq = d.xz / (h + .16);
  float roll = bil(cq * .5 + vec2(uTime * .03, -uTime * .045)) * .62 + bil(cq * 1.4 + 4. + vec2(uTime * .05, -uTime * .07)) * .38;
  float rift = 1. - roll;
  vec3 inC = uFogCol * (.74 + .3 * mot + .2 * mot2) * (1. + uFlash * .2);
  inC *= mix(1., (.3 + 1.35 * rift * rift) * (.8 + .4 * belly), smoothstep(.04, .34, el));
  // under it, low down, a pale slot of sky for the roofs, the viaduct and the dome to stand against
  float bdir = abs(mod(az - uBreak.x + 3.14159, 6.28318) - 3.14159);
  float brk = uBreak.y * smoothstep(1.7, .15, bdir) * smoothstep(uBreak.z, .03, el) * smoothstep(-.08, .02, el) * (.55 + .7 * sf(vec2(az * 3.1 + uTime * .03, el * 11. - uTime * .02)));
  inC = mix(inC, uBreakCol, clamp(brk, 0., 1.));
  inC += vec3(.5, .56, .95) * (fb * (.25 + 1.5 * roll));
  col = mix(col, inC, uIn);
  {
    // forked lightning: a jagged channel from the glow down to the roofs with one branch (never inside a loop, eased by uBolt)
    float bs = uBolt.y;
    float bjag = (sv(vec2(el * 17. + bs * 7.3, bs * 3.1)) - .5) * .13 + (sv(vec2(el * 53. + bs * 11., 2.7)) - .5) * .04;
    float bx = fdz - bjag - (el - uFl.y) * (.4 * fract(bs * .37) - .2);
    float bw = clamp(fwidth(el) * 1.3, .0016, .012);
    float span = (1. - smoothstep(uFl.y + .2, uFl.y + .3, el)) * smoothstep(0., .05, el);
    float fk = uFl.y - .02 - .1 * fract(bs * .61), sg = step(.5, fract(bs * .77)) * 2. - 1.;
    float bx2 = bx - sg * (fk - el) * .7 - (sv(vec2(el * 29. + bs * 5.7, 9.1)) - .5) * .09 * smoothstep(0., .05, fk - el);
    float core = 1. - smoothstep(bw * .5, bw * 1.5, abs(bx));
    float core2 = (1. - smoothstep(bw * .4, bw * 1.2, abs(bx2))) * step(el, fk) * smoothstep(fk - .2, fk - .08, el);
    float halo = exp(-abs(bx) * 60.) * .16 + exp(-abs(bx2) * 80.) * .08 * step(el, fk) * smoothstep(fk - .2, fk - .08, el);
    col += vec3(.8, .86, 1.) * (uBolt.x * span * (max(core, core2 * .7) * 7. + halo * 2.) * max(uIn, cov * uWallA));
  }
  col += uBrass * (uSunK * uIn * .35 * smoothstep(1.2, .2, sa) * smoothstep(.5, 0., el) * (.7 + .6 * mot2));
  // in the late band the dome is never seen in clear air: its shape stands in the rain, dark against the cloud when it flickers
  vec2 dq = vec2(mod(az - uDome.x + 3.14159, 6.28318) - 3.14159, asin(clamp(el, -1., 1.)) - uDome.y) / max(uDome.z, 1e-5);
  float dn = 1. - dq.x * dq.x / 137.;
  float sil = (1. - smoothstep(11.2, 12.2, abs(dq.x))) * (1. - smoothstep(-.6, .6, dq.y - 19. * sqrt(max(dn, 0.))));
  sil = max(sil, (1. - smoothstep(12.6, 13.6, abs(dq.x))) * (1. - smoothstep(-.6, .6, dq.y)));
  sil = max(sil, (1. - smoothstep(1.2, 2., abs(dq.x))) * (1. - smoothstep(25., 26.5, dq.y)));
  sil = max(sil, (1. - smoothstep(2.2, 3., abs(abs(dq.x) - 16.4))) * (1. - smoothstep(1., 2.4, dq.y)));
  sil *= smoothstep(-26., -12., dq.y);
  col = mix(col, col * vec3(.42, .45, .55), sil * uDome.w);
  gl_FragColor = vec4(col, 1.);
}`;

// rain veils: tall sheets standing in the band, scrolling, lit from the side by the returning sun
const VEIL_VERT = /* glsl */`
attribute float aSheet;
uniform vec2 uBand; uniform vec3 uCamL;
varying vec2 vUv; varying vec3 vL; varying float vS, vX;
#include <fog_pars_vertex>
void main(){
  vX = position.x;
  vec2 nn = vec2(${NX}, ${NZ}), tt = vec2(${NZ}, ${-NX});
  float E = mix(uBand.x, uBand.y, aSheet);
  float along = floor(dot(uCamL.xz, tt) / 200.) * 200. + position.x * 900.;
  vec2 c = nn * E + tt * along;
  vec3 w = vec3(c.x, position.y * 300. - 4., c.y);
  vUv = vec2(along, w.y); vL = w; vS = aSheet;
  vec4 mvPosition = viewMatrix * vec4(w, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const VEIL_FRAG = /* glsl */`
uniform vec3 uCamL; uniform float uVeil, uVeilTop, uSlitK, uShaft;
varying vec2 vUv; varying vec3 vL; varying float vS, vX;
#include <fog_pars_fragment>
${GLSL_COMMON}
void main(){
  float n = fbm(vec2(vUv.x * .012 + vS * 9., vUv.y * .004 + uTime * .05));
  float xs = vUv.x + vUv.y * .32;                              // the rain falls aslant, in broad soft shafts (never a ruled barcode)
  float st = vn(vec2(xs * .11 + vS * 31., vUv.y * .018 + uTime * .9)) * .6 + vn(vec2(xs * .29 + vS * 7., vUv.y * .03 + uTime * 1.3)) * .4;
  // shafts: the rain in a sheet falls in ropes that can be seen falling from outside the storm
  float sf2 = smoothstep(.2, .8, st * .7 + vn(vec2(xs * .55 + vS * 17., vUv.y * .06 + uTime * 2.6)) * .3);
  float a = smoothstep(.25, .7, n) * mix(.76 + .24 * st, .42 + .85 * sf2, uShaft);
  a *= smoothstep(uVeilTop, uVeilTop * .3, vUv.y) * (.35 + .65 * smoothstep(-4., 30., vUv.y)) * smoothstep(1., .5, abs(vX));
  float dist = length(uCamL - vL);
  a *= smoothstep(30., 110., dist) * uVeil;
  vec3 V = normalize(uCamL - vL + vec3(0., 1e-4, 0.));
  float fs = max(dot(-V, uSunDir), 0.);
  a *= 1. - .8 * uSlitK * smoothstep(.2, .75, fs);
  vec3 col = min(min(uAmbCol * .9 + uHorizCol * .16, vec3(.25, .31, .4)), fogColor * 1.7) + uSunCol * (uSun * (.1 + .5 * fs * fs) * (.5 + st));     // (never paler than the rain it stands in)
  gl_FragColor = vec4(col, a * .3);
  #include <fog_fragment>
}`;

// run-off: ropes of water from eaves, scuppers, the flyover's edge and our own gutter
const ROPE_VERT = /* glsl */`
attribute vec2 aCorner; attribute vec4 aR;
uniform vec3 uCamL; uniform vec2 uBand, uWindDir; uniform float uGust, uFresh, uRainCam;
varying vec2 vT; varying vec3 vL; varying float vA, vSeed, vFoot;
#include <fog_pars_vertex>
void main(){
  float t = aCorner.y * .5 + .5;
  vec3 c = position;
#ifdef LOCAL
  c = (modelMatrix * vec4(position, 1.)).xyz;
  float rain = uRainCam;
#else
  float E = dot(c.xz, vec2(${NX}, ${NZ}));
  float rain = smoothstep(uBand.x - 30., uBand.x + 20., E) * (1. - smoothstep(uBand.y - 25., uBand.y + 25., E));
  rain = max(rain, .4 * uFresh * step(E, uBand.x) * step(.5, aR.z));
#endif
  c.y -= t * aR.x;
  c.xz += uWindDir * (t * t * uGust * 1.2);
  vec3 toC = uCamL - c;
  vec2 sd = normalize(vec2(toC.z, -toC.x) + vec2(1e-5, 0.));
  // never thinner than a pixel and a half, never a wide frosted bar: a rope is at most about three pixels across
  float d = length(toC), wdt = min(max(aR.y, d * .0013), max(d * .004, .004));
  float foot = smoothstep(aR.x - .6, aR.x, t * aR.x);          // the last half metre spreads into mist
  c.xz += sd * (aCorner.x * wdt * (1. + 5. * foot * foot));
#ifdef LOCAL
  vA = rain * smoothstep(.3, .8, d) * clamp(aR.y / wdt * 1.6, .3, 1.);
#else
  vA = rain * smoothstep(3., 12., d) * clamp(aR.y / wdt * 1.6, .45, 1.);
#endif
  vT = vec2(aCorner.x, t * aR.x); vL = c; vSeed = aR.z; vFoot = foot;
  vec4 mvPosition = viewMatrix * vec4(c, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const ROPE_FRAG = /* glsl */`
varying vec2 vT; varying vec3 vL; varying float vA, vSeed, vFoot;
#include <fog_pars_fragment>
${GLSL_COMMON}
void main(){
  // a thin bright core, broken into falling beads, ending in a little mist where it strikes
  float n = vn(vec2(vSeed * 31., vT.y * 1.3 - uTime * (9. + 4. * vSeed)));
  float bead = smoothstep(.35, .75, vn(vec2(vSeed * 57., vT.y * 6. - uTime * 22.)));
  float c = 1. - abs(vT.x);
  float core = c * c * c * (.3 + .7 * smoothstep(.2, .7, n)) * (.35 + .65 * bead);
  float mist = c * c * .22 * (.5 + .5 * n);
  float a = vA * mix(core, mist, vFoot) * smoothstep(0., .25, vT.y);
  if (a < .004) discard;
  vec3 col = uHorizCol * .5 + uAmbCol * .8 + uSunCol * (uSun * sunVis(vL) * 1.3);
#ifdef LOCAL
  a *= .6;
#endif
  gl_FragColor = vec4(col, a * .8);
  #include <fog_fragment>
}`;

// splash crowns: rings on the deck round the camera (near) and on the roofs (far), wrapped in a box
const SPLASH_VERT = /* glsl */`
attribute vec2 aCorner; attribute vec4 aS;
uniform vec3 uCamL; uniform vec2 uTrackR; uniform float uRainCam, uRailY, uDeckHalf, uTime;
varying vec2 vC2; varying float vA, vCr; varying vec3 vL;
#include <fog_pars_vertex>
void main(){
  float crown = step(1.5, aS.z);
  float near = max(step(aS.z, .5), crown);
  vec2 box = mix(vec2(120.), vec2(44.), near);
  float cyc = uTime * (2.4 + aS.w * 1.5) + aS.w * 13.;
  float ph = fract(cyc), id = floor(cyc);
  vec2 jit = fract(aS.xy + id * vec2(.37, .61));
  vec2 c = uCamL.xz + (fract(jit - uCamL.xz / box) - .5) * box;
  float lat = dot(c - uCamL.xz, uTrackR);
  float y = mix(3. + 3.5 * aS.w, uRailY + .21, near);
  float r = mix(.6, .1, near) * (.35 + ph) * (.6 + .9 * fract(aS.w * 7.31));
  vec3 w = vec3(c.x + aCorner.x * r, y, c.y + aCorner.y * r);
  if (crown > .5) w = vec3(c.x, y + (aCorner.y * .5 + .5) * (.025 + .08 * sin(min(ph * 2.4, 1.) * 3.1416)), c.y);
  float okN = step(abs(lat), uDeckHalf) * (1. - step(c.y, 2.) * step(abs(c.x + 12.5), 50.));
  float okF = min(step(53., c.x) + step(c.x, -78.) + step(306., c.y), 1.) * step(11.5, abs(lat));
  vA = (1. - ph) * uRainCam * mix(okF, okN, near); vC2 = aCorner; vL = w; vCr = crown;
  vA *= mix(1., step(.5, fract(aS.w * 5.3)), near * (1. - crown));       // on ballast and sleepers a drop makes a crown, not a ring: only half the near ones spread one
  vA *= mix(1., (1. - smoothstep(.1, .3, ph)) * smoothstep(.3, .8, uRainCam) * step(.4, fract(aS.w * 3.77)), crown);      // a crown is wider than tall, gone in a third of its ring's life, and rare in thin rain
  vec4 mvPosition = viewMatrix * vec4(w, 1.);
  mvPosition.x += crown * aCorner.x * (.08 + .11 * ph);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const SPLASH_FRAG = /* glsl */`
varying vec2 vC2; varying float vA, vCr; varying vec3 vL;
#include <fog_pars_fragment>
${GLSL_COMMON}
void main(){
  float r = length(vC2);
  float ring = smoothstep(.62, .86, r) * (1. - smoothstep(.86, 1., r)) * .16;      // a soft swell of water, not a drawn circle
  float cr = (1. - abs(vC2.x)) * (1. - abs(vC2.x)) * smoothstep(-1., -.6, vC2.y) * (1. - smoothstep(.1, 1., vC2.y)) * .8;
  float a = mix(ring, cr, vCr) * vA;
  if (a < .004) discard;
  vec3 col = uAmbCol * 1.1 + uHorizCol * .35 + uSunCol * (uSun * .8 * sunVis(vL));
  gl_FragColor = vec4(col, a);
  #include <fog_fragment>
}`;

// the gust front: leaves, paper and dust torn along the deck just before the wall hits
const LEAF_VERT = /* glsl */`
attribute vec2 aCorner; attribute vec4 aS; attribute vec3 aCol;
uniform vec3 uCamL; uniform vec2 uWindDir; uniform float uLeaf, uRailY, uTime;
varying vec2 vC2; varying vec4 vCol;
#include <fog_pars_vertex>
void main(){
  float dust = step(.82, aS.w);
  vec2 box = vec2(46.);
  float sp = 9. + 9. * aS.z;
  vec2 c = uCamL.xz + (fract(aS.xy + (uWindDir * (uTime * sp) - uCamL.xz) / box) - .5) * box;
  float hop = sin(uTime * (1.3 + 2. * aS.w) + aS.z * 40.);
  float y = uRailY + .3 + aS.z * aS.z * 7. + (1.2 + 2.5 * aS.z) * (hop * .5 + .5);
  vec4 mvPosition = viewMatrix * vec4(c.x, y, c.y, 1.);
  float ro = uTime * (5. + 9. * aS.w) * (aS.z - .5) * 2. + aS.w * 31.;
  mat2 R = mat2(cos(ro), -sin(ro), sin(ro), cos(ro));
  vec2 q = R * (aCorner * mix(vec2(.085, .03 + .035 * abs(sin(ro * 1.7))), vec2(1.3), dust)) * (.6 + .6 * aS.z);
  mvPosition.xy += q;
  float d = -mvPosition.z;
  vC2 = aCorner; vCol = vec4(aCol, uLeaf * smoothstep(2., 4.5, d) * (1. - smoothstep(16., 23., d)) * mix(1., .16, dust));
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const LEAF_FRAG = /* glsl */`
varying vec2 vC2; varying vec4 vCol;
#include <fog_pars_fragment>
${GLSL_COMMON}
void main(){
  float r = length(vC2);
  float a = vCol.a * (1. - smoothstep(.55, 1., r));
  if (a < .004) discard;
  gl_FragColor = vec4(vCol.rgb * (uAmbCol * 1.5 + uGroundCol), a);
  #include <fog_fragment>
}`;

// steam and smoke: puffs that stay behind in the world as their emitter travels
const PUFF_VERT = /* glsl */`
attribute vec2 aCorner; attribute vec4 aP; attribute vec4 aVel; attribute float aTn;
uniform float uTime, uNearK; uniform vec3 uEP[10]; uniform vec4 uEV[10];
varying vec2 vC2; varying vec3 vL; varying vec4 vS; varying float vUd, vSz;
#include <fog_pars_vertex>
void main(){
  int e = int(aVel.w + .5);
  float life = 1. / aP.y;
  float t = fract(uTime * aP.y + aP.x);
  float age = t * life;
  vec3 c = uEP[e] + position + (uEV[e].xyz + aVel.xyz) * age;
  c.x += sin(uTime * .31 + aP.x * 31.) * .8 * t; c.z += cos(uTime * .27 + aP.x * 17.) * .8 * t;
  c.y += sqrt(t) * aP.w * .3;
  float size = aP.z + aP.w * t;
  float al = smoothstep(0., .1, t) * (1. - t) * (1. - t) * uEV[e].w;
  // before the front the engine ahead leaves its steam in clear dry air, which takes it up: a puff has thinned away by six
  // tenths of its life there (2.4 to 3 s after the chimney); in the rain it hangs for all of it, as it did
  if (e == 0) al *= mix(1., 1. - smoothstep(.35, .6, t), uNearK);
  vL = c; vC2 = aCorner; vS = vec4(aP.x * 13., t, al, aTn);
  vec4 mvPosition = viewMatrix * vec4(c, 1.);
  float ro = aP.x * 6.283 + t * (aP.x - .5) * 2.;
  mat2 R = mat2(cos(ro), -sin(ro), sin(ro), cos(ro));
  vec2 off = R * aCorner * size;
  vec2 vv = (viewMatrix * vec4(uEV[e].xyz + aVel.xyz, 0.)).xy;  // drawn out along the way it is carried, so it is a rag of steam and not a disc
  float vl = length(vv);
  vec2 vd = vv / max(vl, 1e-3);
  off += vd * (dot(off, vd) * .6 * smoothstep(.5, 3., vl));
  mvPosition.xy += off;
  vSz = size;
  vUd = dot(aCorner, vec2(-sin(ro), cos(ro)));               // +1 at the top of the puff, whichever way it has turned
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const PUFF_FRAG = /* glsl */`
uniform vec3 uCamL;
varying vec2 vC2; varying vec3 vL; varying vec4 vS; varying float vUd, vSz;
#include <fog_pars_fragment>
${GLSL_COMMON}
void main(){
  float r = length(vC2);
  float n = fbm(vC2 * 1.7 + vS.x + vec2(0., -vS.y * 1.5));
  float sr = clamp(1. - r - (n - .5) * 1.1, 0., 1.);
  float a = vS.z * sr * sr * (3. - 2. * sr) * (.45 + .55 * sr);
  a = min(a * (1. + 1.1 * (1. - smoothstep(.25, .7, vS.w))), 1.);   // coal smoke is denser than steam
  if (a < .004) discard;
  vec3 V = normalize(uCamL - vL + vec3(0., 1e-4, 0.));
  float vis = sunVis(vL);
  float fs = max(dot(-V, uSunDir), 0.);
  float lift = smoothstep(-.8, .8, vUd + (n - .5) * .7);      // white where it faces the sky, grey underneath
  float sao = shedAO(vL);
  vec3 col = uAmbCol * (.6 + 1.1 * lift) * sao + uFillCol * .3;
  col += uSunCol * (uSun * vis * (.42 + .8 * fs * fs * fs + .3 * (1. - smoothstep(.2, .9, r))));
  col += uSunCol * (uSun * (1. - sao) * (.26 + .4 * lift));   // under the roof steam is lit by the warm light off the platforms, not by blue sky
  col *= (.75 + .4 * n) * vS.w;
  a *= mix(smoothstep(1.2, 6., vFogDepth), smoothstep(4., 14., vFogDepth), smoothstep(2.4, 3.4, vSz));     // a big puff close to the eye thins away
  gl_FragColor = vec4(col, a * mix(.9, .68, vS.w));
  #include <fog_fragment>
}`;

// telegraph wires: ribbons that never get thinner than a pixel and a half
const WIRE_VERT = /* glsl */`
attribute vec3 aDir; attribute float aSide;
uniform float uPix;
varying float vA;
#include <fog_pars_vertex>
void main(){
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.);
  vec3 dv = (modelViewMatrix * vec4(aDir, 0.)).xyz;
  vec2 sdv = normalize(vec2(-dv.y, dv.x) + vec2(1e-5, 0.));
  float wd = max(.014, -mvPosition.z * uPix * .8);
  mvPosition.xy += sdv * (aSide * wd);
  vA = clamp(.014 / wd, .3, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const WIRE_FRAG = /* glsl */`
uniform vec3 uWireCol; varying float vA;
#include <fog_pars_fragment>
void main(){
  gl_FragColor = vec4(uWireCol, vA);
  #include <fog_fragment>
}`;

// the quarter's ground: trodden earth, weeds, a loose net of lanes, puddles holding the sky
const FLAT_VERT = /* glsl */`
varying vec3 vL;
#include <fog_pars_vertex>
void main(){ vL = (modelMatrix * vec4(position, 1.)).xyz;
  vec4 mvPosition = viewMatrix * vec4(vL, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const CITY_FRAG = /* glsl */`
uniform vec3 uCamL; varying vec3 vL;
#include <fog_pars_fragment>
${GLSL_COMMON}
void main(){
  vec3 p = vL;
  vec3 V = normalize(uCamL - p + vec3(0., 1e-4, 0.));
  float fwp = max(fwidth(p.x), fwidth(p.z));
  float lod = 1. - smoothstep(.1, .6, fwp);
  float f1 = fbm(p.xz * .045), f2 = fbm(p.xz * .21 + 7.), g1 = vn(p.xz * 2.3);
  vec3 alb = mix(vec3(.1, .08, .058), vec3(.19, .15, .105), f2);
  alb = mix(alb, vec3(.06, .095, .04), smoothstep(.52, .72, f1) * .75);
  vec2 q = (mat2(.94, .34, -.34, .94) * p.xz) / 23.;
  vec2 lane = abs(fract(q + (f1 - .5) * .6) - .5);
  float ln = 1. - smoothstep(.04, .09 + fwp * .05, min(lane.x, lane.y));
  alb = mix(alb, vec3(.23, .195, .15) * (.8 + .4 * g1 * lod), ln * .8);
  float pm = smoothstep(.55, .63, fbm(p.xz * .09 + 31.) * .6 + f2 * .4) * uWet;
  vec3 N = vec3(0., 1., 0.);
  { float rgt = smoothstep(10., 40., p.x - uCamL.x); gSpecK = 1. - .7 * rgt; gSkyK = 1. - .3 * rgt; }     // the glare under the sun is a streak, not a quarter of the picture
  vec3 col = shadeSurf(alb, N, V, p, .4, uWet * .8);
  vec3 R = reflect(-V, N); R.y = abs(R.y) + 1e-3;
  vec3 refl = skyRefl(R);
  float sd = max(dot(R, uSunDir), 0.);
  refl += uSunCol * (uSun * sunVis(p) * pow(sd, 120.) * 6.);
  float Fr = 1. - max(V.y, 0.); Fr = .25 + .65 * Fr * Fr * Fr;
  col = mix(col, refl * Fr, pm);
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;
// the rare flooded line: a hand's depth of water over the throat doubling sky, gantries and dome
const FLOOD_FRAG = /* glsl */`
uniform vec3 uCamL; varying vec3 vL;
#include <fog_pars_fragment>
${GLSL_COMMON}
${GLSL_MIRROR}
void main(){
  vec3 p = vL;
  vec3 V = normalize(uCamL - p + vec3(0., 1e-4, 0.));
  float fwp = max(fwidth(p.x), fwidth(p.z));
  float lod = 1. - smoothstep(.15, .9, fwp);
  float rip = vn(p.xz * 1.7 + uTime * vec2(.3, .2)) - .5, rip2 = vn(p.xz * 5.1 - uTime * vec2(.5, .1)) - .5;
  float rip3 = vn(p.xz * .31 + uTime * vec2(.11, .06)) - .5, rip4 = vn(p.zx * .47 - uTime * vec2(.07, .1)) - .5;      // a slow swell that breaks the mirrored clouds
  // our wake: two foam lines opening astern from the coach's leading end (at the door), churned water along the train
  float astern = p.z - uCamL.z, run = max(astern + 1., 0.);
  float on = smoothstep(-1., 3., astern) * exp(-max(astern, 0.) / 60.);
  float off = abs(p.x + ${(-OUR_X).toFixed(2)});
  float vee = 1. - smoothstep(.25, .95 + run * .022, abs(off - (1.8 + run * .1)));
  float churn = 1. - smoothstep(1.7, 3.3 + run * .06, off);
  // foam: fine and streaked along the way we travel, never a blotch
  float fn = vn(p.xz * vec2(7., .9) + vec2(0., uTime * 9.)) * .6 + vn(p.xz * vec2(19., 2.6) + vec2(uTime * 2., uTime * 14.)) * .4;
  float wake = on * max(vee, churn * .55);
  float foam = on * max(vee * smoothstep(.5, .72, fn + .2), churn * smoothstep(.68, .88, fn) * .6);
  vec3 N = normalize(vec3((rip * .014 + rip2 * .008) * lod + rip3 * .03 + wake * rip2 * .3, 1., (rip2 * .014 - rip * .008) * lod + rip4 * .03 + wake * rip * .3));
  vec3 R = reflect(-V, N); R.y = abs(R.y) + 1e-3;
  // the water holds the colour of the sky overhead, not of the haze at the horizon; silhouettes stay where they are
  vec3 sc0 = sceneRefl(p, R), sk0 = skyRefl(R), skHi = mix(skyRefl(vec3(R.x, R.y + .16, R.z)), uSkyCol, .5);
  vec3 dsk = sc0 - sk0;
  vec3 refl = mix(sc0, skHi, 1. - smoothstep(0., .02, dot(dsk, dsk))) * .5;
  refl *= .82 + .5 * (rip3 + rip4);
  float sd = max(dot(R, uSunDir), 0.);
  float vis = sunVis(p);
  refl += uSunCol * (uSun * vis * (pow(sd, 260.) * 5. + pow(sd, 24.) * .08));
  float Fr = 1. - max(dot(V, N), 0.); Fr = Fr * Fr; Fr = .06 + .9 * Fr * Fr * (1. - max(dot(V, N), 0.));
  // near the door the water is dark and the stones of the ballast show through it
  vec3 deep = vec3(.085, .074, .058) * (.55 + .9 * vn(p.xz * 6.3) * lod) * (uAmbCol * 1.1 + uSunCol * (uSun * vis * .3));
  vec3 col = mix(deep, refl, Fr);
  col = mix(col, uAmbCol * .85 + uHorizCol * .15 + uSunCol * (uSun * vis * .2), foam * .5);
  float al = mix(.86 + .12 * smoothstep(.06, .4, Fr), 1., foam);
  gl_FragColor = vec4(col, al * smoothstep(1., 9., p.z));
  #include <fog_fragment>
}`;

// ---------------------------------------------------------------- geometry helpers
const sstep = smoothstep;
// a local frame at (X, Y, Z) turned by yaw a: local +x -> (cos a, -sin a), local +z -> (sin a, cos a)
function frame(X, Y, Z, a) {
  const c = Math.cos(a), s = Math.sin(a);
  return {
    a,
    p: (x, y, z) => [X + x * c + z * s, Y + y, Z - x * s + z * c],
    box: (g, x, y, z, sx, sy, sz, o) => g.box(X + x * c + z * s, Y + y, Z - x * s + z * c, sx, sy, sz, a, o),
  };
}
// horizontal cylinder along z (round it afterwards with roundZ over the vertex range it made)
function tubeZ(g, cx, cy, z0, z1, r, n, caps, us = 0.5) {       // us: uv across one facet (its width in metres, for painted plate)
  for (let i = 0; i < n; i++) {
    const a0 = i / n * TAU, a1 = (i + 1) / n * TAU;
    const x0 = cx + Math.cos(a0) * r, y0 = cy + Math.sin(a0) * r, x1 = cx + Math.cos(a1) * r, y1 = cy + Math.sin(a1) * r;
    g.quad([x0, y0, z1], [x0, y0, z0], [x1, y1, z0], [x1, y1, z1], i * us, 0, i * us + us, Math.abs(z1 - z0));
    if (caps) { g.tri([cx, cy, z0], [x1, y1, z0], [x0, y0, z0]); g.tri([cx, cy, z1], [x0, y0, z1], [x1, y1, z1]); }
  }
}
// smooth normals for cylinders along z: every vertex in [v0, v1) that sits off the axis (cx, cy) gets a radial normal
function roundZ(geo, list) {
  const P = geo.attributes.position, N = geo.attributes.normal;
  for (const [v0, v1, cx, cy] of list) for (let i = v0; i < v1; i++) {
    if (Math.abs(N.getZ(i)) > 0.5) continue;
    const dx = P.getX(i) - cx, dy = P.getY(i) - cy, l = Math.hypot(dx, dy);
    if (l > 1e-4) N.setXYZ(i, dx / l, dy / l, 0);
  }
  return geo;
}
// wheel: a disc facing sideways at x
function wheel(g, x, cy, cz, r, n = 10) {
  for (let i = 0; i < n; i++) {
    const a0 = i / n * TAU, a1 = (i + 1) / n * TAU;
    g.tri([x, cy, cz], [x, cy + Math.sin(a0) * r, cz + Math.cos(a0) * r], [x, cy + Math.sin(a1) * r, cz + Math.cos(a1) * r], [0.5, 0.5], [0, 0], [1, 0], 0.8 + 0.2 * (i % 2));
  }
}
// a spoked driving wheel facing sideways at x: tapered spokes, an inner rim, a hub, a balance weight opposite the crank and
// the crank boss (at angle 0: the rods' pin). Built at rest; the vertex shader turns it about its axle.
function spoked(g, x, cy, cz, r, ns, sx) {
  const P = (rr, a, dx = 0) => [x + dx, cy + Math.sin(a) * rr, cz + Math.cos(a) * rr];
  for (let i = 0; i < ns; i++) {
    const a = (i + 0.5) / ns * TAU, c = Math.cos(a), s = Math.sin(a);
    const q = (rr, w) => [x, cy + s * rr + c * w, cz + c * rr - s * w];
    g.quad(q(0.1, -0.05), q(0.1, 0.05), q(r * 0.86, 0.032), q(r * 0.86, -0.032), 0, 0, 0.1, 0.7, 0.88 + 0.12 * (i % 2));
  }
  for (let i = 0; i < 14; i++) {
    const a0 = i / 14 * TAU, a1 = (i + 1) / 14 * TAU;
    g.quad(P(r * 0.83, a0), P(r * 0.91, a0), P(r * 0.91, a1), P(r * 0.83, a1), 0.1, 0.1, 0.1, 0.1);
    if (i % 2 === 0) { const a2 = (i + 2) / 14 * TAU; g.tri(P(0, 0, sx * 0.035), P(0.17, a0, sx * 0.035), P(0.17, a2, sx * 0.035), [0.5, 0.5], [0, 0], [1, 0], 1.15); }
  }
  for (let i = 0; i < 4; i++) { const a0 = Math.PI - 0.62 + i * 0.31, a1 = a0 + 0.31; g.quad(P(r * 0.46, a0, sx * 0.012), P(r * 0.84, a0, sx * 0.012), P(r * 0.84, a1, sx * 0.012), P(r * 0.46, a1, sx * 0.012), 0, 0, 0.3, 0.3, 0.8); }
  for (let i = 0; i < 6; i++) { const a0 = i / 6 * TAU, a1 = (i + 1) / 6 * TAU; g.tri([x + sx * 0.05, cy, cz + 0.3], [x + sx * 0.05, cy + Math.sin(a0) * 0.085, cz + 0.3 + Math.cos(a0) * 0.085], [x + sx * 0.05, cy + Math.sin(a1) * 0.085, cz + 0.3 + Math.cos(a1) * 0.085], [0.5, 0.5], [0, 0], [1, 0], 1.2); }
}
// a small disc facing along z (a gauge on the backhead)
function discZ(g, cx, cy, z, r, n = 8) {
  for (let i = 0; i < n; i++) { const a0 = i / n * TAU, a1 = (i + 1) / n * TAU; g.tri([cx, cy, z], [cx + Math.cos(a0) * r, cy + Math.sin(a0) * r, z], [cx + Math.cos(a1) * r, cy + Math.sin(a1) * r, z], [0.5, 0.5], [0, 0], [1, 0]); }
}
// per-vertex float from ranges recorded while building ([from, to, value])
function rangeAttr(geo, name, ranges) {
  const n = geo.attributes.position.count, a = new Float32Array(n);
  for (const [v0, v1, w] of ranges) a.fill(w, v0, v1);
  geo.setAttribute(name, new THREE.BufferAttribute(a, 1));
  return geo;
}
function fnAttr(geo, name, fn) {
  const p = geo.attributes.position, a = new Float32Array(p.count);
  for (let i = 0; i < p.count; i++) a[i] = fn(p.getX(i), p.getY(i), p.getZ(i));
  geo.setAttribute(name, new THREE.BufferAttribute(a, 1));
  return geo;
}
// a geometry builder that remembers tint ranges: mark(w, fn) gives every vertex made in fn the weight w
function tinted() {
  const g = makeG(), ranges = [];
  g.mark = (w, fn) => { const a = g.nv; fn(); ranges.push([a, g.nv, w]); return g; };
  g.finish = () => rangeAttr(g.build(), 'aTw', ranges);
  return g;
}
// instanced set sharing one base geometry: aT1 = first tint, aI = second tint + one free float
function instanced(base, mat, n, cull) {
  const geo = new THREE.BufferGeometry();
  for (const k in base.attributes) geo.setAttribute(k, base.attributes[k]);
  geo.setIndex(base.index);
  const t1 = new Float32Array(n * 3).fill(1), ai = new Float32Array(n * 4).fill(1);
  const aT1 = new THREE.InstancedBufferAttribute(t1, 3), aI = new THREE.InstancedBufferAttribute(ai, 4);
  geo.setAttribute('aT1', aT1); geo.setAttribute('aI', aI);
  const mesh = new THREE.InstancedMesh(geo, mat, Math.max(n, 1));
  mesh.frustumCulled = false;
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), P = new THREE.Vector3(), S = new THREE.Vector3(), E = new THREE.Euler();
  let k = 0;
  return {
    mesh, base, t1, ai, aT1, aI, tris: base.index.count / 3,
    get count() { return k; },
    add(x, y, z, yaw, sx, sy, sz, c1, c2, w = 0) {
      if (k >= n) return -1;
      E.set(0, yaw, 0); Q.setFromEuler(E); M.compose(P.set(x, y, z), Q, S.set(sx, sy, sz)); mesh.setMatrixAt(k, M);
      if (c1) t1.set(c1, k * 3);
      if (c2) ai.set(c2, k * 4);
      ai[k * 4 + 3] = w;
      return k++;
    },
    done() {
      mesh.count = k; mesh.instanceMatrix.needsUpdate = true;
      if (cull && k > 0) { mesh.computeBoundingSphere(); mesh.frustumCulled = true; }
      return mesh;
    },
  };
}

// ---------------------------------------------------------------- rolling stock and street furniture
// All vehicles: local x right, y up from rail level, -z forward, origin at mid-length.
// rich: the side is built, not painted: every lit window is a real opening on a compartment with people in it, behind iron bars;
// frames, sills, door furniture, beading and rivets stand proud of the panels. (The stock that only stands at the buffers, far
// from the eye, is built plain.)
function coachGeo(rng, rich = true) {
  const g = tinted(), L = 14, hw = 1.45, f = 1.15, e = 3.3, nb = 7;
  const stud = (x, y, z, sx, r = 0.017, h = 0.013) => {     // a rivet head: a low pyramid on a side face
    const c = [[x, y - r, z - r], [x, y - r, z + r], [x, y + r, z + r], [x, y + r, z - r]];
    for (let i = 0; i < 4; i++) g.tri([x + sx * h, y, z], c[i], c[(i + 1) % 4], [0.5, 0.5], [0, 0], [1, 0], 0.85 + 0.1 * i);
  };
  const yv = (v) => f + 0.95 + (v - 0.02) / 0.96 * (e - 1.05 - f), bayZ = (sx, b) => sx * (L / 2 - (b + 0.5) * L / nb);
  g.mat([0.09, 0.09, 0.1], K.IRON).box(0, f - 0.14, 0, 2.5, 0.28, L - 0.3, 0, { bottom: true });
  for (const bz of [-L / 2 + 2.4, L / 2 - 2.4]) {
    g.mat([0.085, 0.085, 0.092], K.IRON).box(0, 0.62, bz, 1.9, 0.42, 2.9);
    for (const sx of [-1, 1]) g.box(sx * 1.0, 0.86, bz, 0.08, 0.1, 2.2).box(sx * 1.02, 0.66, bz - 0.95, 0.1, 0.24, 0.3).box(sx * 1.02, 0.66, bz + 0.95, 0.1, 0.24, 0.3);   // bogie frame and axleboxes
    for (const wz of [-0.95, 0.95]) for (const sx of [-1, 1]) {
      g.mat([0.09, 0.065, 0.055], K.MATTE); wheel(g, sx * 0.97, 0.65, bz + wz, 0.46, 10);
      g.mat([0.3, 0.31, 0.34], K.BRASS);                       // a steel tyre catching the wet light
      for (let i = 0; i < 10; i++) {
        const a0 = i / 10 * TAU, a1 = (i + 1) / 10 * TAU, x = sx * 0.985, P = (r, a) => [x, 0.65 + Math.sin(a) * r, bz + wz + Math.cos(a) * r];
        g.quad(P(0.38, a0), P(0.47, a0), P(0.47, a1), P(0.38, a1), 0.1, 0.1, 0.1, 0.1);     // (one tone all round: a tyre is not striped)
      }
    }
  }
  // truss rods and a battery box under the frame
  g.mat([0.1, 0.1, 0.11], K.IRON);
  for (const sx of [-1, 1]) {
    g.strut([sx * 1.05, f - 0.3, -3.4], [sx * 1.05, f - 0.72, -1.3], 0.05).strut([sx * 1.05, f - 0.72, -1.3], [sx * 1.05, f - 0.72, 1.3], 0.05).strut([sx * 1.05, f - 0.72, 1.3], [sx * 1.05, f - 0.3, 3.4], 0.05);
    for (const z of [-1.3, 1.3]) g.strut([sx * 1.05, f - 0.28, z], [sx * 1.05, f - 0.72, z], 0.06);
  }
  g.box(0.5, f - 0.52, 0.2, 1.1, 0.42, 1.5);
  g.mark(1.2, () => {
    g.mat([1, 1, 1], K.WOOD);
    for (const sx of [-1, 1]) {
      g.quad([sx * hw, f, sx * L / 2], [sx * hw, f, -sx * L / 2], [sx * hw, f + 0.95, -sx * L / 2], [sx * hw, f + 0.95, sx * L / 2], 0, 0, L, 0.95);
      g.quad([sx * hw, e - 0.1, sx * L / 2], [sx * hw, e - 0.1, -sx * L / 2], [sx * hw, e, -sx * L / 2], [sx * hw, e, sx * L / 2], 0, 0, L, 0.1, 0.8);
      g.quad([-sx * hw, f, sx * L / 2], [sx * hw, f, sx * L / 2], [sx * hw, e, sx * L / 2], [-sx * hw, e, sx * L / 2], 0, 0, 2.9, e - f, 0.8);
      // raised mouldings: bottom rail, and a pillar between every pair of bays
      g.mat([0.8, 0.8, 0.8], K.MATTE).box(sx * (hw + 0.012), f + 0.05, 0, 0.024, 0.1, L, 0, { top: false });
      for (let i = 0; i <= nb; i++) g.box(sx * (hw + 0.011), f + 0.5, -L / 2 + i * L / nb, 0.022, 0.86, 0.07);
      g.mat([1, 1, 1], K.WOOD);
    }
  });
  g.mark(2.2, () => {
    g.mat([1, 1, 1], K.COACH);
    for (const sx of [-1, 1]) {
      const x = sx * hw, zu = (u) => sx * (L / 2 - u * L / nb);
      const q = (u0, u1, v0, v1) => g.quad([x, yv(v0), zu(u0)], [x, yv(v0), zu(u1)], [x, yv(v1), zu(u1)], [x, yv(v1), zu(u0)], u0, v0, u1, v1);
      for (let b = 0; b < nb; b++) {
        if (!rich || b % 3) { q(b, b + 1, 0.02, 0.98); continue; }
        q(b, b + 0.2, 0.02, 0.98); q(b + 0.8, b + 1, 0.02, 0.98); q(b + 0.2, b + 0.8, 0.02, 0.16); q(b + 0.2, b + 0.8, 0.9, 0.98);     // round a real opening
      }
    }
  });
  if (rich) coachSide(g, rng, { L, hw, f, e, nb, yv, bayZ, stud });
  g.mat([0.45, 0.3, 0.1], K.BRASS);
  for (const sx of [-1, 1]) {
    g.box(sx * (hw + 0.012), f + 0.95, 0, 0.03, 0.05, L, 0, { top: false });
    for (let i = 1; i < nb && !rich; i += 2) {                // commode handles and a door handle by every other bay
      const z = -L / 2 + i * L / nb;
      g.box(sx * (hw + 0.045), f + 0.55, z + 0.2, 0.025, 0.62, 0.025).box(sx * (hw + 0.045), f + 0.55, z - 0.2, 0.025, 0.62, 0.025);
      g.box(sx * (hw + 0.03), f + 0.84, z + 0.42, 0.03, 0.03, 0.16);
    }
  }
  // roof: a wet iron arc, a rain strip and torpedo ventilators along the crown
  const arc = (r, k, z0, z1) => {
    for (let i = 0; i < 6; i++) {
      const t0 = -Math.PI / 2 + i * Math.PI / 6, t1 = t0 + Math.PI / 6;
      const x0 = hw * r * Math.sin(t0), y0 = e + k * Math.cos(t0), x1 = hw * r * Math.sin(t1), y1 = e + k * Math.cos(t1);
      g.quad([x0, y0, z1], [x1, y1, z1], [x1, y1, z0], [x0, y0, z0], i * 0.5, 0, i * 0.5 + 0.5, Math.abs(z1 - z0));
      if (r < 1.07) for (const z of [z0, z1]) g.tri([0, e, z], [x0, y0, z], [x1, y1, z]);
    }
  };
  g.mat([0.085, 0.085, 0.095], K.IRON); arc(1.06, 0.42, -L / 2, L / 2);
  g.mat([0.05, 0.05, 0.055], K.IRON);
  for (let i = 0; i < 5; i++) g.lathe(0, e + 0.4, -L / 2 + 1.4 + i * (L - 2.8) / 4, [[0.07, 0], [0.07, 0.1], [0.17, 0.14], [0.17, 0.24], [0.03, 0.3]], 6);
  g.mat([0.11, 0.11, 0.12], K.IRON);
  for (const sx of [-1, 1]) g.box(sx * (hw + 0.08), e - 0.01, 0, 0.12, 0.08, L + 0.06, 0, { bottom: true });
  g.mat([0.3, 0.22, 0.14], K.WOOD);                          // footboards: pale wet wood, with the lamp light of each lit bay lying on them
  for (const sx of [-1, 1]) g.box(sx * (hw + 0.17), 0.8, 0, 0.3, 0.05, L - 1, 0, { bottom: true });
  g.mat([0.3, 0.22, 0.14], K.SPILL);
  for (const sx of [-1, 1]) for (let i = 0; i < nb; i += 3) {
    const zc = sx * (L / 2 - (i + 0.5) * L / nb), xa = sx > 0 ? hw + 0.03 : -hw - 0.32, xb = xa + 0.29, z0 = Math.max(zc - 0.95, -L / 2 + 0.55), z1 = Math.min(zc + 0.95, L / 2 - 0.55);
    g.quad([xa, 0.832, z1], [xb, 0.832, z1], [xb, 0.832, z0], [xa, 0.832, z0], 0, 0, 1, 1);
  }
  g.mat([0.05, 0.045, 0.04], K.MATTE);
  for (const sx of [-1, 1]) g.box(sx * (hw + 0.1), 0.73, 0, 0.2, 0.08, L - 1.1, 0, { top: false, bottom: true });   // the footboard's shadow
  for (const sz of [-1, 1]) for (const sx of [-1, 1]) g.mat([0.1, 0.1, 0.11], K.IRON).box(sx * 0.85, 1.0, sz * (L / 2 + 0.16), 0.12, 0.12, 0.32).box(sx * 0.85, 1.0, sz * (L / 2 + 0.34), 0.34, 0.34, 0.06);
  // the ends: panelled in the body colour round an end door with a droplight, beaded corners, brass grab rails
  g.mark(1.2, () => {
    for (const sz of [-1, 1]) {
      const ze = sz * (L / 2 + 0.035);
      g.mat([0.7, 0.7, 0.7], K.WOOD).box(0, 2.06, ze, 0.8, 1.84, 0.07);
      g.mat([1.3, 1.3, 1.3], K.MATTE);
      for (const x of [-1.0, -0.47, 0.47, 1.0]) g.box(x, 2.2, ze, 0.06, 2.1, 0.06, 0, { top: false });
      g.box(0, f + 0.07, ze, 2.8, 0.1, 0.06, 0, { top: false }).box(0, e - 0.12, ze, 2.8, 0.08, 0.06, 0, { top: false });
    }
  });
  for (const sz of [-1, 1]) {
    const zg = sz * (L / 2 + 0.075), xa = -0.26 * sz, xb = 0.26 * sz;
    g.mat([0.085, 0.04, 0.013], K.GLOW).quad([xa, 2.25, zg], [xb, 2.25, zg], [xb, 2.85, zg], [xa, 2.85, zg], 0.03, 0.12, 0.25, 0.7);
    g.mat([0.05, 0.035, 0.03], K.MATTE).box(0, 2.55, zg + sz * 0.004, 0.035, 0.6, 0.008, 0, { top: false }).box(0, 2.42, zg + sz * 0.004, 0.52, 0.03, 0.008, 0, { top: false });     // glazing bars
    g.mat([0.45, 0.3, 0.1], K.BRASS);
    for (const x of [-0.6, 0.6]) g.box(x, 2.0, sz * (L / 2 + 0.11), 0.03, 0.9, 0.03);
    g.box(0.3, 1.95, sz * (L / 2 + 0.09), 0.04, 0.12, 0.04);
    g.mat([0.1, 0.1, 0.11], K.IRON).box(0, f - 0.02, sz * (L / 2 + 0.2), 0.7, 0.05, 0.3).box(-0.8, 1.6, sz * (L / 2 + 0.08), 0.05, 0.2, 0.08);
  }
  g.mark(7.5, () => {                                         // the tail lamp (shown on the last coach only: aI.w 2)
    g.mat([0.03, 0.03, 0.033], K.MATTE).box(0.8, 1.5, L / 2 + 0.2, 0.2, 0.28, 0.16);
    g.mat([0.68, 0.035, 0.02], K.GLOW).box(0.8, 1.51, L / 2 + 0.29, 0.14, 0.14, 0.02);
  });
  // people implied: head and shoulders at the openings, dark against the lamps inside (never on our own coach)
  const cloth = [[0.2, 0.05, 0.045], [0.05, 0.1, 0.2], [0.2, 0.14, 0.05], [0.09, 0.15, 0.09], [0.12, 0.1, 0.08], [0.3, 0.28, 0.24]];
  if (!rich) g.mark(4, () => {
    for (let i = 0; i < nb; i += 3) for (const sx of [-1, 1]) {
      if (!rng.chance(0.8)) continue;
      const zc = sx * (L / 2 - (i + 0.5) * L / nb) + rng.range(-0.3, 0.3), x = sx * (hw - 0.17), y = f + 1.08, h = rng.range(0.9, 1.05);
      g.mat(rng.pick(cloth), K.MATTE).lathe(x, y, zc, [[0.19, 0], [0.21, 0.3 * h], [0.17, 0.43 * h], [0.065, 0.5 * h]], 8, { sx: 0.7 });
      g.mat([0.09, 0.055, 0.04], K.MATTE).lathe(x, y, zc, [[0.055, 0.49 * h], [0.095, 0.56 * h], [0.1, 0.66 * h], [0.08, 0.75 * h], [0.02, 0.79 * h]], 8);
    }
  });
  return g.finish();
}

// The built side of a coach (see coachGeo). Seven bays a side: a lit window (bays 0, 3, 6: the flicker rule keeps them six
// metres apart), a louvred shutter (1, 4) or a door (2, 5), each exactly where the panel's own shading draws it.
function coachSide(g, rng, o) {
  const { L, hw, f, e, nb, yv, bayZ, stud } = o;
  const y0 = yv(0.16), y1 = yv(0.9), yd = yv(0.44), ym = (y0 + y1) / 2, brass = [0.5, 0.33, 0.1];
  const SKIN = [[0.2, 0.115, 0.07], [0.15, 0.085, 0.055], [0.24, 0.15, 0.1]];
  const CLOTH = [[0.25, 0.235, 0.2], [0.3, 0.05, 0.05], [0.05, 0.1, 0.22], [0.3, 0.2, 0.04], [0.08, 0.16, 0.09], [0.28, 0.26, 0.22], [0.22, 0.08, 0.2]];
  const HAT = [[0.5, 0.48, 0.42], [0.45, 0.07, 0.05], [0.5, 0.3, 0.04], [0.05, 0.05, 0.06], [0.42, 0.4, 0.36]];
  // head and shoulders, a paler face turned to the open air, a turban or a cap on most
  const person = (x, y, z, s, sx, hat) => {
    g.mat(rng.pick(CLOTH), K.MATTE).lathe(x, y, z, [[0.2 * s, 0], [0.235 * s, 0.3 * s], [0.225 * s, 0.4 * s], [0.07 * s, 0.48 * s]], 7, { sx: 0.72 });     // a chest and a line of shoulders
    const skin = rng.pick(SKIN);
    g.mat(skin, K.MATTE).lathe(x, y, z, [[0.055 * s, 0.46 * s], [0.05 * s, 0.54 * s], [0.088 * s, 0.6 * s], [0.098 * s, 0.68 * s], [0.08 * s, 0.76 * s], [0.03 * s, 0.8 * s]], 7);     // neck and head
    g.mat(mulc(skin, 0.6), K.MATTE).quad([x + sx * 0.1 * s, y + 0.59 * s, z - 0.05 * s], [x + sx * 0.1 * s, y + 0.59 * s, z + 0.05 * s], [x + sx * 0.085 * s, y + 0.72 * s, z + 0.05 * s], [x + sx * 0.085 * s, y + 0.72 * s, z - 0.05 * s]);
    if (hat) g.mat(rng.pick(HAT), K.MATTE).lathe(x, y, z, [[0.1 * s, 0.69 * s], [0.125 * s, 0.76 * s], [0.03 * s, 0.86 * s]], 5);
  };
  const dia = (x, cy, cz, a, b) => g.quad([x, cy - b, cz], [x, cy, cz + a], [x, cy + b, cz], [x, cy, cz - a]);
  for (const sx of [-1, 1]) {
    const x = sx * hw, xf = sx * (hw + 0.016);
    for (let b = 0; b < nb; b++) {
      const zc = bayZ(sx, b), kind = b % 3;
      if (kind === 0) {
        const xi = sx * (hw - 0.07), xb = sx * (hw - 1.0), za = zc - 0.6, zb = zc + 0.6, zl = zc - 0.78, zr = zc + 0.78;
        g.mark(1.2, () => {                                   // the reveal: the thickness of the side, in its own colour
          g.mat([0.5, 0.5, 0.5], K.MATTE);
          g.quad([x, y0, za], [x, y0, zb], [xi, y0, zb], [xi, y0, za]); g.quad([x, y1, za], [x, y1, zb], [xi, y1, zb], [xi, y1, za]);
          g.quad([x, y0, za], [x, y1, za], [xi, y1, za], [xi, y0, za]); g.quad([x, y0, zb], [x, y1, zb], [xi, y1, zb], [xi, y0, zb]);
        });
        // the compartment behind it: a back wall the lamp lies on, partitions, a bench, the ceiling
        g.mat([0.3, 0.2, 0.12], K.SPILL).quad([xb, 1.5, zl], [xb, 1.5, zr], [xb, e, zr], [xb, e, zl], 0.1, -0.28, 0.9, 0.64);
        g.mat([0.11, 0.07, 0.045], K.MATTE);
        for (const zz of [zl, zr]) g.quad([xi, 1.5, zz], [xb, 1.5, zz], [xb, e, zz], [xi, e, zz]);
        g.quad([xi, 1.98, zl], [xi, 1.98, zr], [xb, 1.98, zr], [xb, 1.98, zl]);
        g.quad([xi, e - 0.02, zl], [xi, e - 0.02, zr], [xb, e - 0.02, zr], [xb, e - 0.02, zl]);
        g.mat([0.03, 0.03, 0.034], K.MATTE);                  // iron bars across the opening
        for (const dz of [-0.3, 0, 0.3]) g.box(sx * (hw - 0.035), ym, zc + dz, 0.022, y1 - y0, 0.022, 0, { top: false });
        g.mark(4, () => {                                     // the passengers (never on our own coach)
          const za1 = zc + rng.range(-0.36, -0.12);
          person(sx * (hw - 0.36), 1.98, za1, rng.range(0.94, 1.06), sx, rng.chance(0.7));
          if (rng.chance(0.65)) person(sx * (hw - 0.62), 1.98, zc + rng.range(0.12, 0.36), rng.range(0.9, 1.3), sx, rng.chance(0.6));
          if (rng.chance(0.45)) person(sx * (hw - 0.2), 2.0, zc + rng.range(0.25, 0.45), 0.6, sx, false);       // a child at the sill
          { const arm = rng.chance(0.6); g.mat(rng.pick(SKIN), K.MATTE).box(sx * (hw - 0.02), y0 + 0.03, za1 + 0.12, 0.09, 0.055, arm ? 0.34 : 0.24, arm ? 0 : 0.5); }     // a forearm along the sill
        });
      }
      g.mark(1.2, () => {                                     // frames and sills, proud of the panel
        g.mat([1.12, 1.12, 1.12], K.MATTE);
        if (kind < 2) {
          g.box(sx * (hw + 0.03), y0 - 0.03, zc, 0.06, 0.06, 1.42);
          g.box(xf, y1 + 0.03, zc, 0.032, 0.06, 1.34, 0, { top: false });
          for (const dz of [-0.63, 0.63]) g.box(xf, ym, zc + dz, 0.032, y1 - y0, 0.06, 0, { top: false });
        } else {
          g.box(xf, yd - 0.025, zc, 0.032, 0.05, 0.92); g.box(xf, y1 + 0.025, zc, 0.032, 0.05, 0.92, 0, { top: false });
          for (const dz of [-0.435, 0.435]) g.box(xf, (yd + y1) / 2, zc + dz, 0.032, y1 - yd, 0.05, 0, { top: false });
          g.mat([0.72, 0.72, 0.72], K.MATTE);                 // the door's edges
          for (const dz of [-0.72, 0.72]) g.box(sx * (hw + 0.012), (f + e) / 2, zc + dz, 0.024, e - f - 0.24, 0.035, 0, { top: false });
        }
      });
      if (kind === 2) {                                       // door furniture: a proud handle, commode rails either side, a step
        const zh = zc + sx * 0.56;
        g.mat(brass, K.BRASS).box(sx * (hw + 0.055), f + 0.8, zh, 0.03, 0.035, 0.16).box(sx * (hw + 0.03), f + 0.8, zh, 0.05, 0.03, 0.03, 0, { top: false });
        for (const dz of [-0.84, 0.84]) g.box(sx * (hw + 0.05), f + 0.6, zc + dz, 0.025, 0.66, 0.025);
        g.mat([0.34, 0.25, 0.16], K.WOOD).box(sx * (hw + 0.15), 0.99, zc, 0.26, 0.04, 0.84);
        g.mat([0.09, 0.09, 0.1], K.IRON);
        for (const dz of [-0.36, 0.36]) g.box(sx * (hw + 0.12), 0.9, zc + dz, 0.2, 0.15, 0.03, 0, { top: false });
      }
    }
    g.mark(1.2, () => {                                       // beading: under the eave, over the waist, down every panel joint; rivets on the cant rail
      g.mat([0.85, 0.85, 0.85], K.MATTE).box(sx * (hw + 0.012), e - 0.13, 0, 0.024, 0.045, L, 0, { top: false });
      g.box(sx * (hw + 0.01), f + 1.03, 0, 0.02, 0.03, L, 0, { top: false });
      for (let i = 0; i <= nb; i++) g.box(sx * (hw + 0.011), (yv(0.02) + yv(0.98)) / 2, -L / 2 + i * L / nb, 0.022, 1.0, 0.05, 0, { top: false });
      g.mat([1.25, 1.25, 1.25], K.MATTE);
      for (let z = -L / 2 + 0.35; z < L / 2; z += 0.7) stud(sx * (hw + 0.024), e - 0.13, z, sx);
      g.mat([0.75, 0.75, 0.75], K.MATTE); dia(sx * (hw + 0.012), f + 0.5, 0, 0.15, 0.17);
    });
    // a crest on the waist panel (shapes only), and the solebar's rivets
    g.mat(brass, K.BRASS); dia(sx * (hw + 0.008), f + 0.5, 0, 0.22, 0.25); dia(sx * (hw + 0.016), f + 0.5, 0, 0.055, 0.065);
    g.mat([0.2, 0.2, 0.22], K.IRON);
    for (let z = -L / 2 + 0.5; z < L / 2 - 0.3; z += 0.7) stud(sx * 1.25, f - 0.1, z, sx, 0.02, 0.016);
  }
}

// The engine. Its boiler, cab, splashers and tender are enamelled plate (K.PAINT: the instance's own colour, shining in
// that colour, rain standing on it in beads; every painted face has its uv in metres). Round sixteen built it to be looked
// at from an arm's length: a heaped load of coal, riveted seams, handrails on stanchions, lined panels, a blank brass plate
// on the cab side, beaded window frames, spectacles, a fall plate with tool boxes, lit lamps on the tender's corners.
function locoGeo() {
  const g = tinted(), round = [], roundS = [];
  const tube = (cx, cy, z0, z1, r, n, caps, us) => { const v0 = g.nv; tubeZ(g, cx, cy, z0, z1, r, n, caps, us); round.push([v0, g.nv, cx, cy]); };
  // rivet heads: a low pyramid on a side face (stud) or on a face across the engine (studZ); four facets, each its own tone
  const stud = (x, y, z, sx, r = 0.017, h = 0.013) => {
    const c = [[x, y - r, z - r], [x, y - r, z + r], [x, y + r, z + r], [x, y + r, z - r]];
    for (let i = 0; i < 4; i++) g.tri([x + sx * h, y, z], c[i], c[(i + 1) % 4], [0.5, 0.5], [0.45, 0.45], [0.55, 0.45], 0.78 + 0.14 * i);
  };
  const studZ = (x, y, z, sz, r = 0.022, h = 0.016) => {
    const c = [[x - r, y - r, z], [x + r, y - r, z], [x + r, y + r, z], [x - r, y + r, z]];
    for (let i = 0; i < 4; i++) g.tri([x, y, z + sz * h], c[i], c[(i + 1) % 4], [0.5, 0.5], [0.45, 0.45], [0.55, 0.45], 0.78 + 0.14 * i);
  };
  const ringX = (x, cy, cz, r0, r1, n, sh = 1) => {          // a flat ring (or a disc, r0 = 0) on a side face
    for (let i = 0; i < n; i++) {
      const a0 = i / n * TAU, a1 = (i + 1) / n * TAU, P = (r, a, k = 1) => [x, cy + Math.sin(a) * r * k, cz + Math.cos(a) * r];
      if (r0 > 0) g.quad(P(r0, a0, 0.64), P(r1, a0, 0.64), P(r1, a1, 0.64), P(r0, a1, 0.64), 0.1, 0.1, 0.12, 0.12, sh * (0.9 + 0.1 * Math.cos(a0 - 0.8)));
      else g.tri([x, cy, cz], P(r1, a0, 0.64), P(r1, a1, 0.64), [0.5, 0.5], [0.45, 0.45], [0.55, 0.45], sh);
    }
  };
  const black = [0.03, 0.03, 0.034], brass = [0.5, 0.33, 0.1], gilt = [0.55, 0.38, 0.12], steel = [0.62, 0.63, 0.67], lineRed = [0.5, 0.07, 0.04];
  g.mat(black, K.PAINT).box(0, 0.95, -3.5, 2.2, 0.5, 10, 0, { bottom: true });                       // frames and running plate: black enamel
  g.box(0, 1.5, -4.4, 2.1, 0.08, 8, 0, { bottom: true });
  g.mat([0.3, 0.04, 0.03], K.MATTE); for (const sx of [-1, 1]) g.box(sx * 1.04, 1.39, -4.4, 0.035, 0.14, 8, 0, { top: false });   // valance
  g.mat([0.52, 0.12, 0.08], K.MATTE); for (const sx of [-1, 1]) for (let z = -8.15; z < -0.5; z += 0.5) stud(sx * 1.058, 1.39, z, sx, 0.02, 0.015);   // and its rivets
  g.mat([0.42, 0.035, 0.03], K.MATTE).box(0, 1.0, -8.56, 2.6, 0.45, 0.14);
  g.mat(black, K.IRON); for (const sx of [-1, 1]) g.box(sx * 0.85, 1.0, -8.74, 0.12, 0.12, 0.3).box(sx * 0.85, 1.0, -8.92, 0.34, 0.34, 0.06);
  g.mark(1, () => { g.mat([1, 1, 1], K.PAINT); tube(0, 2.5, -7.4, -1.3, 0.92, 20, false, 0.289); });
  g.mat(black, K.PAINT); tube(0, 2.5, -8.3, -7.4, 0.98, 20, true, 0.308);                            // smokebox and chimney: black enamel, not bare wet iron (which the storm's sky turns to silver)
  g.lathe(0, 3.38, -7.85, [[0.3, 0], [0.24, 0.5], [0.31, 0.7], [0.34, 0.78]], 10);
  // the smokebox door: a ring of rivets round its rim, two strap hinges, the lamp's case behind its lens
  g.mat([0.085, 0.085, 0.095], K.IRON);
  for (let i = 0; i < 14; i++) { const a = (i + 0.5) / 14 * TAU; studZ(Math.cos(a) * 0.87, 2.5 + Math.sin(a) * 0.87, -8.3, -1); }
  // and round the barrel of the smokebox, where the wrapper is riveted to its front ring and to the boiler: two rows of
  // heads over the arc that stands clear of the frames (three facets each)
  g.mat([0.11, 0.11, 0.12], K.IRON);
  for (const z of [-8.2, -7.5]) for (let i = 0; i < 9; i++) {
    const a = -0.28 + (Math.PI + 0.56) * i / 8, ca = Math.cos(a), sa = Math.sin(a), s = 0.027;
    const P = (dt, dz, dr) => [(0.98 + dr) * ca - sa * dt, 2.5 + (0.98 + dr) * sa + ca * dt, z + dz], c = [P(-s, -s, 0), P(s, -s, 0), P(0, s * 1.2, 0)];
    for (let j = 0; j < 3; j++) g.tri(P(0, 0, 0.02), c[j], c[(j + 1) % 3], [0.5, 0.5], [0.45, 0.45], [0.55, 0.45], 0.8 + 0.3 * j);
  }
  for (const y of [2.24, 2.76]) g.box(-0.52, y, -8.32, 0.78, 0.05, 0.03);
  g.mat(black, K.IRON).box(0, 3.62, -8.1, 0.27, 0.29, 0.2);
  g.mat(brass, K.BRASS).lathe(0, 3.36, -5, [[0.42, 0], [0.42, 0.3], [0.3, 0.5], [0.02, 0.6]], 10);
  g.lathe(0, 3.4, -2.7, [[0.12, 0], [0.1, 0.36], [0.16, 0.42]], 6);
  for (const z of [-6.6, -4.2, -2.6]) tube(0, 2.5, z - 0.04, z + 0.04, 0.935, 20, false);
  g.box(0, 2.5, -8.33, 0.36, 0.045, 0.03).box(0, 2.5, -8.33, 0.045, 0.36, 0.03);                 // smokebox door dart
  for (const sx of [-1, 1]) {
    tube(sx * 1.0, 3.0, -7.95, -1.4, 0.024, 6, false);                                            // handrail on its stanchions, carried on past the smokebox's rear ring
    for (const z of [-7.2, -5.3, -3.4, -1.5]) g.box(sx * 0.93, 3.0, z, 0.14, 0.03, 0.03);
    // cab handrails: a brass rail down each edge of the side sheet, standing off it on knobs
    for (const z of [0.72, -1.32]) { g.box(sx * 1.4, 2.45, z, 0.03, 1.2, 0.03); for (const y of [1.9, 3.0]) g.box(sx * 1.38, y, z, 0.05, 0.04, 0.04, 0, { top: false }); }
    // the cab window: a beaded brass frame standing proud of the plate, a rain strip over it
    for (const y of [2.672, 3.328]) g.box(sx * 1.372, y, -0.3, 0.036, 0.056, 1.07);
    for (const z of [-0.807, 0.207]) g.box(sx * 1.372, 3.0, z, 0.036, 0.6, 0.056, 0, { top: false });
    g.box(sx * 1.376, 3.44, -0.3, 0.045, 0.03, 1.36);
    // splashers: a brass bead round the rim of each
    for (const z of [-5.6, -3.6, -1.6]) {
      const NB = 11, a0 = 0.4, xb = sx * 1.334, P = (a, r) => [xb, 1.14 + Math.sin(a) * r, z + Math.cos(a) * r];
      for (let i = 0; i < NB; i++) { const t0 = a0 + (Math.PI - 2 * a0) * i / NB, t1 = a0 + (Math.PI - 2 * a0) * (i + 1) / NB; g.quad(P(t0, 0.972), P(t0, 1.012), P(t1, 1.012), P(t1, 0.972), 0.1, 0.1, 0.12, 0.12, 0.9 + 0.1 * (i % 2)); }
    }
  }
  g.mat([0.4, 0.17, 0.07], K.BRASS); for (const sx of [-1, 1]) tube(sx * 1.03, 1.84, -6.8, -1.5, 0.035, 6, false);   // feed pipes
  // the cab: plate sides round a real opening, a spectacle plate, and (below) a firelit inside
  g.mark(1, () => {
    g.mat([1, 1, 1], K.PAINT);
    for (const sx of [-1, 1]) {
      g.box(sx * 1.33, 2.1, -0.3, 0.05, 1.2, 2.0).box(sx * 1.33, 3.45, -0.3, 0.05, 0.3, 2.0, 0, { bottom: true });
      g.box(sx * 1.33, 3.0, -1.04, 0.05, 0.6, 0.52).box(sx * 1.33, 3.0, 0.44, 0.05, 0.6, 0.52);
      // splashers: an arc of plate over each driving wheel (radius 1.0 about the axle, 0.35 wide), with a beaded outer face
      for (const z of [-5.6, -3.6, -1.6]) {
        const NA = 22, a0 = 0.4, xi = sx * 0.97, xo = sx * 1.32, cy = 1.14, P = (x, a, r) => [x, cy + Math.sin(a) * r, z + Math.cos(a) * r], v0 = g.nv, sg = (Math.PI - 2 * a0) / NA;
        for (let i = 0; i < NA; i++) {
          const t0 = a0 + sg * i, t1 = a0 + sg * (i + 1);
          g.quad(P(xi, t0, 1.0), P(xo, t0, 1.0), P(xo, t1, 1.0), P(xi, t1, 1.0), 0, i * sg, 0.35, (i + 1) * sg);                                      // the top
          g.quad(P(xo, t0, 0.8), P(xo, t0, 1.0), P(xo, t1, 1.0), P(xo, t1, 0.8), i * sg, 0, (i + 1) * sg, 0.2, 0.9);                                  // the face: a rim that leaves the wheel showing
        }
        roundS.push([v0, g.nv, cy, z]);
      }
    }
    g.box(0, 2.55, -1.28, 2.66, 2.1, 0.05);
    g.mat([1.2, 1.2, 1.2], K.PAINT);                                                              // rivets down the cab's edges and under the eave
    for (const sx of [-1, 1]) {
      for (const z of [-1.23, 0.63]) for (let y = 1.62; y < 3.56; y += 0.21) stud(sx * 1.355, y, z, sx);
      for (let z = -1.0; z < 0.5; z += 0.21) stud(sx * 1.355, 3.52, z, sx);
    }
  });
  // the roof: an arched sheet with a rain strip along each eave, on two pillars at the back
  {
    const prof = [[-1.46, 3.6], [-1.12, 3.75], [-0.6, 3.845], [0, 3.875], [0.6, 3.845], [1.12, 3.75], [1.46, 3.6]], z0 = -1.5, z1 = 1.1;
    g.mat([0.07, 0.07, 0.075], K.IRON);
    for (let i = 0; i < 6; i++) {
      const a = prof[i], b = prof[i + 1];
      g.quad([a[0], a[1], z1], [b[0], b[1], z1], [b[0], b[1], z0], [a[0], a[1], z0], i * 0.5, 0, i * 0.5 + 0.5, z1 - z0);
      for (const z of [z0, z1]) g.tri([0, 3.6, z], [a[0], a[1], z], [b[0], b[1], z], [0.5, 0], [0, 0], [1, 0], 0.8);
    }
    g.mat([0.1, 0.1, 0.11], K.IRON);
    for (const sx of [-1, 1]) { g.box(sx * 1.47, 3.61, -0.2, 0.05, 0.07, 2.64, 0, { bottom: true }); g.box(sx * 1.3, 2.6, 0.98, 0.045, 2.06, 0.045, 0, { top: false }); }
  }
  // spectacles in the front plate, either side of the boiler: a brass rim round dark glass
  for (const sx of [-1, 1]) {
    const cx = sx * 0.99, cy = 3.14, zf = -1.31;
    for (let i = 0; i < 10; i++) {
      const b0 = i / 10 * TAU, b1 = (i + 1) / 10 * TAU, R = (r, b) => [cx + Math.cos(b) * r, cy + Math.sin(b) * r, zf];
      g.mat(brass, K.BRASS).quad(R(0.17, b0), R(0.225, b0), R(0.225, b1), R(0.17, b1), 0.1, 0.1, 0.12, 0.12, 0.9 + 0.1 * (i % 2));
      g.mat([0.05, 0.06, 0.08], K.BRASS).tri([cx, cy, zf + 0.004], R(0.17, b0), R(0.17, b1), [0.5, 0.5], [0.45, 0.45], [0.55, 0.45]);
    }
  }
  {
    const hz = -0.9, hy = 2.0, fuv = (p) => [0.16 + Math.hypot(p[0], p[2] - hz) / 2.3, 0.2 + (p[1] - hy) / 2.3];
    const fq = (a, b, c, d, sh = 1) => { g.tri(a, b, c, fuv(a), fuv(b), fuv(c), sh); g.tri(a, c, d, fuv(a), fuv(c), fuv(d), sh); };
    g.mat([0.1, 0.05, 0.03], K.FIRE);                                                               // dark iron, lit only by the firehole (a disc low on the backhead, in the shader)
    fq([-0.75, 1.56, hz], [0.75, 1.56, hz], [0.75, 3.3, hz], [-0.75, 3.3, hz], 1.25);                                  // the backhead and its firehole
    fq([-1.3, 1.56, -1.25], [1.3, 1.56, -1.25], [1.3, 3.6, -1.25], [-1.3, 3.6, -1.25], 0.8);
    fq([-1.3, 1.565, 0.7], [1.3, 1.565, 0.7], [1.3, 1.565, -1.25], [-1.3, 1.565, -1.25], 0.9);                         // floor
    fq([-1.3, 3.6, -1.25], [1.3, 3.6, -1.25], [1.3, 3.6, 0.7], [-1.3, 3.6, 0.7], 0.8);                                 // under the roof
    for (const sx of [-1, 1]) {
      const x = sx * 1.27;
      fq([x, 1.56, 0.7], [x, 1.56, -1.25], [x, 2.7, -1.25], [x, 2.7, 0.7]); fq([x, 3.3, 0.7], [x, 3.3, -1.25], [x, 3.6, -1.25], [x, 3.6, 0.7]);
      fq([x, 2.7, -0.78], [x, 2.7, -1.25], [x, 3.3, -1.25], [x, 3.3, -0.78]); fq([x, 2.7, 0.7], [x, 2.7, 0.18], [x, 3.3, 0.18], [x, 3.3, 0.7]);
    }
    // on the backhead: two brass gauges, a water-gauge glass, the regulator handle, a firehole ring
    for (const sx of [-1, 1]) {
      g.mat([0.5, 0.33, 0.1], K.BRASS); discZ(g, sx * 0.4, 3.06, hz + 0.03, 0.062, 8);
      g.mat([0.4, 0.38, 0.32], K.MATTE); discZ(g, sx * 0.4, 3.06, hz + 0.036, 0.044, 8);
    }
    g.mat([0.5, 0.33, 0.1], K.BRASS).strut([0.6, 2.42, hz + 0.05], [0.6, 2.84, hz + 0.05], 0.035);
    g.strut([-0.06, 2.72, hz + 0.05], [0.5, 2.93, hz + 0.13], 0.04);
    discZ(g, -0.06, 2.72, hz + 0.045, 0.055, 6);
    g.mat([0.02, 0.016, 0.014], K.MATTE);
    for (let i = 0; i < 12; i++) { const b0 = i / 12 * TAU, b1 = (i + 1) / 12 * TAU, R = (r, b) => [Math.cos(b) * r, hy + Math.sin(b) * r, hz + 0.012]; g.quad(R(0.3, b0), R(0.36, b0), R(0.36, b1), R(0.3, b1)); }
    // the crew: head and shoulders in the side openings, against the glow
    for (const [x, z, h] of [[-1.0, -0.32, 0.9], [1.0, -0.1, 0.86]]) {
      g.mat([0.05, 0.05, 0.065], K.MATTE).lathe(x, 1.57, z, [[0.17, 0], [0.2, 0.75 * h], [0.23, 1.22 * h], [0.19, 1.38 * h], [0.07, 1.46 * h]], 8, { sx: 0.75 });
      g.mat([0.1, 0.06, 0.045], K.MATTE).lathe(x, 1.57, z, [[0.06, 1.45 * h], [0.1, 1.53 * h], [0.105, 1.63 * h], [0.08, 1.71 * h], [0.02, 1.75 * h]], 8);
      g.mat([0.26, 0.24, 0.2], K.MATTE).lathe(x, 1.57, z, [[0.108, 1.64 * h], [0.1, 1.72 * h], [0.03, 1.77 * h]], 8);                          // a cloth cap
    }
  }
  g.mat(black, K.IRON); for (const sx of [-1, 1]) { tube(sx * 1.22, 1.02, -7.85, -6.55, 0.34, 10, true); g.box(sx * 1.2, 0.72, 0.95, 0.34, 0.04, 0.44).box(sx * 1.2, 0.4, 0.95, 0.34, 0.04, 0.44); }
  g.mat([0.3, 0.31, 0.34], K.BRASS);                                                               // polished slide bars behind each cylinder
  for (const sx of [-1, 1]) for (const y of [0.9, 1.3]) g.box(sx * 1.25, y, -6.05, 0.06, 0.04, 0.95, 0, { bottom: true });
  g.mat([0.024, 0.02, 0.02], K.MATTE);                                                             // the dark behind the spokes
  for (const sx of [-1, 1]) for (const z of [-5.6, -3.6, -1.6]) wheel(g, sx * 1.1, 1.14, z, 0.95, 14);
  [-5.6, -3.6, -1.6].forEach((z, j) => g.mark(9 + j, () => {                                         // red spoked wheels, glossy, so the wet sky picks out the spokes
    g.mat([0.36, 0.08, 0.06], K.BRASS);
    for (const sx of [-1, 1]) spoked(g, sx * 1.125, 1.14, z, 0.95, 12, sx);
  }));
  g.mat([0.26, 0.06, 0.045], K.MATTE);
  for (const sx of [-1, 1]) {
    for (const z of [-7.7, -6.75]) wheel(g, sx * 0.98, 0.66, z, 0.47, 8);
    for (const z of [3.3, 5.3, 7.3]) wheel(g, sx * 0.98, 0.79, z, 0.6, 10);
  }
  g.mat([0.3, 0.31, 0.34], K.BRASS);                                                               // steel tyres catching the wet light
  for (const sx of [-1, 1]) for (const z of [-5.6, -3.6, -1.6]) for (let i = 0; i < 14; i++) {
    const a0 = i / 14 * TAU, a1 = (i + 1) / 14 * TAU, x = sx * 1.14, r0 = 0.84, r1 = 0.96;
    const P = (r, a) => [x, 1.14 + Math.sin(a) * r, z + Math.cos(a) * r];
    g.quad(P(r0, a0), P(r1, a0), P(r1, a1), P(r0, a1), 0.1, 0.1, 0.1, 0.1);
  }
  g.mark(3, () => {
    g.mat(steel, K.BRASS);
    for (const sx of [-1, 1]) { g.box(sx * 1.2, 1.14, -3.6, 0.07, 0.2, 4.3); g.box(sx * 1.27, 1.16, -5.7, 0.06, 0.15, 3.0); }
  });
  // the footplate between engine and tender: a fall plate, an iron-bound tool box at either side, the fireman's shovel
  g.mat([0.05, 0.05, 0.056], K.PAINT).box(0, 1.5, 1.5, 2.3, 0.05, 1.72);
  for (const sx of [-1, 1]) {
    g.mat([0.2, 0.115, 0.06], K.WOOD).box(sx * 0.9, 1.74, 1.98, 0.5, 0.42, 0.56);
    g.mat([0.045, 0.045, 0.05], K.IRON);
    for (const dz of [-0.17, 0.17]) g.box(sx * 0.9, 1.75, 1.98 + dz, 0.52, 0.44, 0.045, 0, { bottom: false });
    g.mat(brass, K.BRASS).box(sx * 0.9 - sx * 0.265, 1.82, 1.98, 0.02, 0.1, 0.08);
  }
  g.mat([0.2, 0.14, 0.08], K.WOOD).strut([0.28, 1.56, 0.95], [0.2, 1.62, 1.75], 0.045);
  g.mat([0.2, 0.21, 0.23], K.BRASS).box(0.19, 1.58, 1.93, 0.26, 0.02, 0.34, 0.08);
  // the tender: three beaded, lined panels between proud riveted seams, a flared coping, coal rails, steps
  g.mat(black, K.PAINT).box(0, 0.95, 5.3, 2.2, 0.5, 6.2, 0, { bottom: true });
  g.mat([0.09, 0.09, 0.1], K.IRON); for (const sx of [-1, 1]) for (let z = 2.45; z < 8.3; z += 0.42) stud(sx * 1.1, 1.08, z, sx, 0.022, 0.016);   // the frame's rivets
  g.mark(1, () => {
    g.mat([1, 1, 1], K.PAINT).box(0, 2.2, 5.3, 2.7, 1.9, 6.0);
    g.mat([1.3, 1.3, 1.3], K.PAINT);
    for (const sx of [-1, 1]) {
      for (const z of [4.3, 6.3]) g.box(sx * 1.362, 2.2, z, 0.024, 1.88, 0.11, 0, { top: false });
      for (const z of [2.36, 8.24]) g.box(sx * 1.362, 2.2, z, 0.024, 1.88, 0.1, 0, { top: false });
      g.box(sx * 1.362, 3.1, 5.3, 0.024, 0.09, 6.0, 0, { top: false }).box(sx * 1.362, 1.3, 5.3, 0.024, 0.09, 6.0, 0, { top: false });
      g.quad([sx * 1.35, 3.15, 2.3], [sx * 1.35, 3.15, 8.3], [sx * 1.53, 3.44, 8.3], [sx * 1.53, 3.44, 2.3], 0, 0, 6, 0.34);      // flared coping
    }
    g.quad([-1.35, 3.15, 8.3], [1.35, 3.15, 8.3], [1.53, 3.44, 8.44], [-1.53, 3.44, 8.44], 0, 0, 2.7, 0.34);
    g.mat([1.45, 1.45, 1.45], K.PAINT);                       // rivet heads down every seam and along both edges
    for (const sx of [-1, 1]) {
      for (const z of [4.3, 6.3]) for (let y = 1.44; y < 3.02; y += 0.21) stud(sx * 1.374, y, z, sx, 0.024, 0.018);
      for (const y of [1.3, 3.1]) for (let z = 2.5; z < 8.2; z += 0.27) stud(sx * 1.374, y, z, sx, 0.024, 0.018);
      for (const z of [2.36, 8.24]) for (let y = 1.44; y < 3.02; y += 0.21) stud(sx * 1.374, y, z, sx, 0.024, 0.018);
    }
  });
  for (const sx of [-1, 1]) {                                 // lining: a brass bead round each panel and a fine vermilion line inside it
    for (const [z0, z1] of [[2.56, 4.12], [4.5, 6.1], [6.48, 8.06]]) {
      g.mat(gilt, K.BRASS);
      for (const y of [1.56, 2.86]) g.box(sx * 1.358, y, (z0 + z1) / 2, 0.016, 0.045, z1 - z0);
      for (const z of [z0, z1]) g.box(sx * 1.358, 2.21, z, 0.016, 1.3, 0.045);
      g.mat(lineRed, K.MATTE);
      for (const y of [1.68, 2.74]) g.box(sx * 1.356, y, (z0 + z1) / 2, 0.012, 0.028, z1 - z0 - 0.24);
      for (const z of [z0 + 0.12, z1 - 0.12]) g.box(sx * 1.356, 2.21, z, 0.012, 1.06, 0.028);
    }
    // the cab side: the same lining round its panel, and in the middle of it a blank oval plate of polished brass
    g.mat(gilt, K.BRASS);
    for (const y of [1.7, 2.54]) g.box(sx * 1.364, y, -0.3, 0.016, 0.042, 1.64);
    for (const z of [-1.1, 0.5]) g.box(sx * 1.364, 2.12, z, 0.016, 0.84, 0.042, 0, { top: false });
    g.mat(lineRed, K.MATTE);
    for (const y of [1.81, 2.43]) g.box(sx * 1.362, y, -0.3, 0.012, 0.026, 1.4);
    for (const z of [-0.99, 0.39]) g.box(sx * 1.362, 2.12, z, 0.012, 0.62, 0.026, 0, { top: false });
    g.mat(brass, K.BRASS); ringX(sx * 1.362, 2.12, -0.3, 0.2, 0.26, 12);
    g.mat([0.62, 0.43, 0.15], K.BRASS); ringX(sx * 1.36, 2.12, -0.3, 0, 0.2, 12, 1);
    // a polished handrail along the tender under its coping, on a stanchion at every seam; brass grab rails at both ends
    g.mat(steel, K.BRASS).strut([sx * 1.45, 2.985, 2.42], [sx * 1.45, 2.985, 8.2], 0.034);
    for (const z of [2.44, 4.3, 6.3, 8.18]) g.box(sx * 1.41, 2.985, z, 0.08, 0.035, 0.035, 0, { top: false });
    g.mat(brass, K.BRASS);
    for (const z of [2.42, 8.2]) g.box(sx * 1.41, 2.2, z, 0.03, 1.34, 0.03);
    // a lamp on each front corner, lit: a black case with a brass cap, a warm lens toward the footplate and one outward
    g.mat(black, K.IRON).box(sx * 1.2, 2.66, 2.2, 0.17, 0.22, 0.17).box(sx * 1.2, 2.5, 2.25, 0.05, 0.12, 0.05, 0, { top: false });
    g.mat(brass, K.BRASS).lathe(sx * 1.2, 2.77, 2.2, [[0.1, 0], [0.035, 0.08], [0.035, 0.13]], 4, { flat: true, phase: 0.785 });
    g.mat([0.9, 0.52, 0.17], K.GLOW).box(sx * 1.2, 2.66, 2.105, 0.1, 0.11, 0.02, 0, { top: false }).box(sx * 1.292, 2.66, 2.2, 0.02, 0.11, 0.1, 0, { top: false });
  }
  g.mat([0.06, 0.06, 0.066], K.IRON);
  for (const sx of [-1, 1]) {
    for (const y of [3.58, 3.72]) g.box(sx * 1.5, y, 5.3, 0.03, 0.03, 5.9);                        // coal rails
    for (let z = 2.5; z < 8.2; z += 1.4) g.box(sx * 1.5, 3.58, z, 0.03, 0.34, 0.03);
    g.box(sx * 1.54, 3.455, 5.3, 0.05, 0.04, 6.06, 0, { bottom: true });                          // a bead along the coping's lip
    g.box(sx * 1.2, 0.72, 2.75, 0.34, 0.04, 0.44).box(sx * 1.2, 0.4, 2.75, 0.34, 0.04, 0.44);      // steps
    for (const z of [3.3, 5.3, 7.3]) g.box(sx * 1.1, 1.0, z, 0.1, 0.26, 0.42).box(sx * 1.1, 1.22, z, 0.07, 0.07, 1.0);   // axleboxes and springs
  }
  // the coal: a heaped load trimmed forward, lump by lump, with the shovelling hole in the tender's front under it
  {
    const NX2 = 6, NZ2 = 10, hs = (i, j) => { const v = Math.sin(i * 12.9898 + j * 78.233) * 43758.5453; return v - Math.floor(v); };
    const pt = (i, j) => {
      const u = i / NX2, v = j / NZ2, edge = Math.min(u, 1 - u) * 2, x = (u - 0.5) * 2.52 + (i > 0 && i < NX2 ? (hs(i, j) - 0.5) * 0.16 : 0), z = 2.45 + v * 5.7 + (j > 0 && j < NZ2 ? (hs(j, i + 9) - 0.5) * 0.22 : 0);
      const ridge = Math.pow(Math.min(edge * 1.6, 1), 0.6) * (0.25 + 0.75 * Math.pow(Math.sin(Math.PI * Math.min(v * 1.3 + 0.18, 1)), 0.8)) * (1 - 0.35 * v);     // (heaped above the coal rails: the eye rides below the coping)
      return [x, 3.22 + 1.2 * ridge + (edge > 0.1 && j > 0 && j < NZ2 ? (hs(i + 3, j + 5) - 0.35) * 0.2 : 0), z];
    };
    g.mat([0.03, 0.03, 0.034], K.COAL);
    for (let i = 0; i < NX2; i++) for (let j = 0; j < NZ2; j++) {
      const a = pt(i, j), b = pt(i + 1, j), c = pt(i + 1, j + 1), d = pt(i, j + 1), sh = 0.7 + 0.7 * hs(i + 11, j + 17), fl = (i + j) % 2 === 0;
      const uv = (q) => [q[0] * 3 + q[1], q[2] * 3];
      if (fl) { g.tri(a, c, b, uv(a), uv(c), uv(b), sh); g.tri(a, d, c, uv(a), uv(d), uv(c), sh * 0.8 + 0.15); }
      else { g.tri(a, d, b, uv(a), uv(d), uv(b), sh); g.tri(b, d, c, uv(b), uv(d), uv(c), sh * 0.8 + 0.15); }
    }
    g.mat([0.012, 0.011, 0.011], K.MATTE).quad([-0.42, 1.53, 2.292], [0.42, 1.53, 2.292], [0.42, 2.3, 2.292], [-0.42, 2.3, 2.292]);     // the shovelling hole
    g.mat([0.035, 0.035, 0.04], K.COAL);                      // and what has spilled from it onto the plate
    for (const [x, w, h, d] of [[-0.12, 0.5, 0.3, 0.42], [0.2, 0.34, 0.2, 0.3]]) for (let i = 0; i < 4; i++) {
      const b0 = (i + 0.3) / 4 * TAU, b1 = (i + 1.3) / 4 * TAU;
      g.tri([x, 1.53 + h, 2.2], [x + Math.cos(b0) * w / 2, 1.53, 2.24 + Math.min(Math.sin(b0), 0.1) * d], [x + Math.cos(b1) * w / 2, 1.53, 2.24 + Math.min(Math.sin(b1), 0.1) * d], [x, 0], [x + 1, 0], [x, 1], 0.7 + 0.2 * i);
    }
  }
  g.mat([1.0, 0.72, 0.3], K.GLOW).box(0, 3.62, -8.25, 0.2, 0.2, 0.12);
  const geo = roundZ(g.finish(), round), Pp = geo.attributes.position, Nn = geo.attributes.normal;
  // the splashers' tops are one smooth curve of plate, not a row of facets
  for (const [v0, v1, cy, cz] of roundS) for (let i = v0; i < v1; i++) {
    if (Math.abs(Nn.getX(i)) > 0.5) continue;
    const dy = Pp.getY(i) - cy, dz = Pp.getZ(i) - cz, l = Math.hypot(dy, dz);
    if (l > 1e-4) Nn.setXYZ(i, 0, dy / l, dz / l);
  }
  return geo;
}

// a covered van: plank body with corner posts, a braced sliding door on strap hinges, buffers and a hook
// (rich: the stored vans on the siding nearest the running lines, which our train passes close by, are built in full:
// bolt heads on every post and strap, a second door brace, hasp and padlock, a label clip, springs over the axleboxes, a brake
// lever on its V hanger, a bolted solebar, a hooped canvas roof with a rain strip, end steps and handrails, a hanging coupling)
function wagonGeo(rich = false) {
  const g = tinted(), hl = 2.5, iron = [0.035, 0.035, 0.04];
  g.mat(iron, K.IRON).box(0, 0.95, 0, 2.3, 0.25, 5.4, 0, { bottom: true });
  g.mat([0.07, 0.05, 0.045], K.MATTE);
  for (const sx of [-1, 1]) for (const z of [-1.7, 1.7]) wheel(g, sx * 0.97, 0.67, z, 0.48, rich ? 14 : 8);
  g.mat(iron, K.IRON);
  for (const sx of [-1, 1]) for (const z of [-1.7, 1.7]) g.box(sx * 1.0, 0.82, z, 0.06, 0.34, 0.5);            // axle guards
  for (const z of [-1.7, 1.7]) g.strut([-0.97, 0.67, z], [0.97, 0.67, z], 0.11);                                // axles
  g.strut([0, 0.84, -2.4], [0, 0.84, 2.4], 0.12, 0.16);                                                         // the drawbar down the middle
  g.mark(1, () => {
    g.mat([1, 1, 1], K.WOOD).box(0, 1.85, 0, 2.5, 1.55, hl * 2, 0, { top: false });
    g.mat([0.72, 0.72, 0.72], K.WOOD);
    for (const sx of [-1, 1]) g.box(sx * 1.265, 1.83, 0, 0.03, 1.46, 1.7, 0, { top: false });                   // the door, proud of the planks
  });
  g.mat([0.05, 0.05, 0.055], K.IRON);
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) g.box(sx * 1.262, 1.85, sz * (hl - 0.05), 0.045, 1.55, 0.11);                     // corner posts
    g.box(sx * 1.29, 2.6, 0, 0.04, 0.06, 3.5).box(sx * 1.29, 1.1, 0, 0.04, 0.05, 3.5);                          // door runners
    for (const y of [1.35, 1.85, 2.35]) g.box(sx * 1.292, y, -0.55, 0.02, 0.07, 0.6);                           // strap hinges
    g.strut([sx * 1.29, 1.14, -0.8], [sx * 1.29, 2.56, 0.8], 0.02, 0.09);                                       // brace
    g.box(sx * 1.3, 1.8, 0.7, 0.04, 0.3, 0.05);
    for (const sz of [-1, 1]) g.box(sx * 0.85, 1.0, sz * (2.7 + 0.14), 0.12, 0.12, 0.3).box(sx * 0.85, 1.0, sz * (2.7 + 0.31), 0.32, 0.32, 0.05);   // buffers
  }
  for (const sz of [-1, 1]) g.box(0, 0.95, sz * 2.95, 0.08, 0.1, 0.5);                                          // draw hook
  for (const sz of [-1, 1]) {
    const ze = sz * (hl + 0.045);
    for (const x of [-0.45, 0.45]) g.box(x, 1.85, ze, 0.09, 1.55, 0.09, 0, { top: false });                     // end stanchions
    g.strut([-0.45, 1.12, ze], [0.45, 2.3, ze], 0.03, 0.08);                                                    // and a diagonal between them
    g.box(0, 1.1, ze, 2.5, 0.07, 0.05, 0, { top: false });                                                      // end sill strap
    for (const x of [-0.8, 0.8]) g.box(x, 1.3, sz * (hl + 0.05), 0.05, 0.16, 0.1);                              // lamp irons
    g.box(0, 2.72, sz * (hl + 0.04), 0.05, 0.12, 0.08);
  }
  g.mat([0.42, 0.4, 0.36], K.MATTE);
  for (const sz of [-1, 1]) {                                                                                   // louvred vent under the eave
    g.box(0, 2.42, sz * (hl + 0.02), 0.74, 0.3, 0.04, 0, { top: false });
    g.mat([0.06, 0.06, 0.065], K.MATTE); for (const y of [2.33, 2.42, 2.51]) g.box(0, y, sz * (hl + 0.045), 0.66, 0.035, 0.03, 0, { top: false });
    g.mat([0.42, 0.4, 0.36], K.MATTE);
  }
  g.mark(7, () => {                                                                                             // the tail lamp (shown on the last van only: aI.w)
    g.mat([0.02, 0.02, 0.022], K.MATTE).box(0.8, 1.32, hl + 0.13, 0.17, 0.24, 0.13);
    g.mat([0.68, 0.035, 0.02], K.GLOW).box(0.8, 1.33, hl + 0.2, 0.11, 0.11, 0.02);
  });
  const prof = rich ? [[-1.34, 2.6], [-1.12, 2.81], [-0.62, 2.96], [0, 3.01], [0.62, 2.96], [1.12, 2.81], [1.34, 2.6]] : [[-1.34, 2.6], [-0.7, 2.98], [0.7, 2.98], [1.34, 2.6]], np = prof.length - 1;
  g.mark(2, () => {
    g.mat([1, 1, 1], K.MATTE);
    const rz = hl + 0.08;
    for (let i = 0; i < np; i++) g.quad([prof[i][0], prof[i][1], rz], [prof[i + 1][0], prof[i + 1][1], rz], [prof[i + 1][0], prof[i + 1][1], -rz], [prof[i][0], prof[i][1], -rz], i * 3 / np, 0, (i + 1) * 3 / np, 5.2);
    if (rich) for (const sz of [-1, 1]) for (let i = 1; i < np; i++) g.tri([0, 2.6, sz * hl], [prof[i][0], prof[i][1], sz * hl], [prof[i + 1][0], prof[i + 1][1], sz * hl], [0.5, 0], [0, 1], [1, 1]);
    else for (const sz of [-1, 1]) g.quad([-1.3, 2.6, sz * hl], [1.3, 2.6, sz * hl], [0.7, 2.98, sz * hl], [-0.7, 2.98, sz * hl]);
  });
  if (rich) {
    // a bolt head: a low four-sided pyramid on a side face (bolt) or an end face (boltZ)
    const bolt = (x, y, z, sx, r = 0.03, h = 0.022) => {
      const c = [[x, y - r, z - r], [x, y - r, z + r], [x, y + r, z + r], [x, y + r, z - r]];
      for (let i = 0; i < 4; i++) g.tri([x + sx * h, y, z], c[i], c[(i + 1) % 4], [0.5, 0.5], [0.45, 0.45], [0.55, 0.45], 0.75 + 0.2 * i);
    };
    const boltZ = (x, y, z, sz, r = 0.03, h = 0.022) => {
      const c = [[x - r, y - r, z], [x + r, y - r, z], [x + r, y + r, z], [x - r, y + r, z]];
      for (let i = 0; i < 4; i++) g.tri([x, y, z + sz * h], c[i], c[(i + 1) % 4], [0.5, 0.5], [0.45, 0.45], [0.55, 0.45], 0.75 + 0.2 * i);
    };
    const steel = [0.2, 0.2, 0.215];
    for (const sx of [-1, 1]) {
      g.mat(steel, K.IRON);
      for (const sz of [-1, 1]) for (let y = 1.2; y < 2.56; y += 0.26) bolt(sx * 1.285, y, sz * (hl - 0.05), sx);                       // down each corner post
      for (const y of [1.35, 1.85, 2.35]) for (const z of [-0.78, -0.4]) bolt(sx * 1.302, y, z, sx, 0.024);                             // through each strap hinge
      for (let z = -2.4; z < 2.5; z += 0.6) bolt(sx * 1.15, 0.95, z, sx, 0.028);                                                        // along the solebar
      g.mat([0.05, 0.05, 0.055], K.IRON);
      g.strut([sx * 1.29, 2.56, -0.8], [sx * 1.29, 1.14, 0.8], 0.02, 0.09);                                                             // the door's second brace
      g.box(sx * 1.35, 2.62, 0, 0.05, 0.05, hl * 2 + 0.16, 0, { bottom: true });                                                        // a rain strip under the eave
      g.box(sx * 1.31, 1.75, 0.82, 0.03, 0.07, 0.34);                                                                                   // hasp
      g.mat([0.5, 0.33, 0.1], K.BRASS).box(sx * 1.325, 1.63, 0.9, 0.035, 0.13, 0.1);                                                    // and its padlock
      g.mat([0.5, 0.47, 0.4], K.MATTE).box(sx * 1.272, 1.5, 1.75, 0.015, 0.2, 0.28, 0, { top: false });                                 // a blank label in its clip
      g.mat([0.05, 0.05, 0.055], K.IRON).box(sx * 1.282, 1.39, 1.75, 0.02, 0.03, 0.32, 0, { top: false });
      for (const z of [-1.7, 1.7]) {                                                                                                    // leaf springs over the axleboxes, an axlebox cover
        g.mat([0.045, 0.045, 0.05], K.IRON).box(sx * 1.1, 1.06, z, 0.09, 0.035, 1.0, 0, { bottom: true }).box(sx * 1.1, 1.015, z, 0.09, 0.035, 0.7, 0, { top: false }).box(sx * 1.1, 0.975, z, 0.09, 0.035, 0.42, 0, { top: false });
        g.mat(steel, K.IRON).box(sx * 1.08, 0.69, z, 0.07, 0.2, 0.22);
        for (const dz of [-0.5, 0.5]) g.mat([0.045, 0.045, 0.05], K.IRON).box(sx * 1.1, 1.0, z + dz, 0.05, 0.16, 0.05, 0, { top: false });  // spring hangers
      }
      // the brake: a long hand lever down the solebar on a V hanger, a pin rack at its end
      g.mat([0.06, 0.06, 0.065], K.IRON).strut([sx * 1.2, 0.9, -0.25], [sx * 1.24, 0.72, 2.25], 0.035, 0.06);
      g.strut([sx * 1.18, 1.05, -0.5], [sx * 1.18, 0.62, -0.25], 0.03, 0.05).strut([sx * 1.18, 1.05, 0], [sx * 1.18, 0.62, -0.25], 0.03, 0.05);
      g.box(sx * 1.22, 0.86, 2.2, 0.03, 0.4, 0.09, 0, { top: false });
    }
    // hoops under the roof canvas: three ribs standing proud of it
    g.mat([0.05, 0.05, 0.055], K.MATTE);
    for (const z of [-1.55, 0, 1.55]) for (let i = 0; i < np; i++) g.quad([prof[i][0] * 1.01, prof[i][1] + 0.018, z + 0.04], [prof[i + 1][0] * 1.01, prof[i + 1][1] + 0.018, z + 0.04], [prof[i + 1][0] * 1.01, prof[i + 1][1] + 0.018, z - 0.04], [prof[i][0] * 1.01, prof[i][1] + 0.018, z - 0.04], 0.1, 0.1, 0.12, 0.12, 0.9 + 0.1 * (i % 2));
    for (const sz of [-1, 1]) {
      const ze = sz * (hl + 0.045);
      g.mat(steel, K.IRON);
      for (const x of [-0.45, 0.45]) for (let y = 1.3; y < 2.5; y += 0.38) boltZ(x, y, ze + sz * 0.045, sz);                            // bolts down the end stanchions
      for (const x of [-1.05, -0.6, 0.6, 1.05]) boltZ(x, 0.95, sz * 2.7, sz, 0.028);                                                    // and across the headstock
      g.mat([0.05, 0.05, 0.055], K.IRON);
      g.strut([-1.08, 1.25, ze + sz * 0.07], [-1.08, 2.3, ze + sz * 0.07], 0.03);                                                       // a handrail and a step at the corner
      g.box(-1.0, 0.72, sz * (hl + 0.32), 0.4, 0.035, 0.2, 0, { bottom: true });
      g.strut([-1.15, 0.95, sz * (hl + 0.25)], [-1.15, 0.72, sz * (hl + 0.32)], 0.03).strut([-0.85, 0.95, sz * (hl + 0.25)], [-0.85, 0.72, sz * (hl + 0.32)], 0.03);
      g.strut([0, 0.92, sz * 3.18], [0, 0.6, sz * 3.22], 0.05, 0.03).strut([0, 0.6, sz * 3.22], [0, 0.42, sz * 3.1], 0.05, 0.03);       // the coupling, hanging
    }
  }
  return g.finish();
}

// a draped figure under an umbrella or parasol that covers head and shoulders; the canopy (weight 5)
// folds about the stick at the local origin
function personGeo() {
  const g = tinted(), skin = [0.34, 0.19, 0.11], bz = 0.14;
  // legs and feet under the hem (a dhoti's or a sari's pale border above them)
  g.mat([0.2, 0.12, 0.08], K.MATTE);
  for (const sx of [-1, 1]) g.lathe(sx * 0.09, 0, bz, [[0.1, 0], [0.055, 0.05], [0.07, 0.34]], 4, { sx: 0.8, phase: 0.785 });
  g.mat([0.5, 0.48, 0.42], K.MATTE).lathe(0, 0, bz, [[0.215, 0.2], [0.21, 0.36]], 8, { sx: 1.2 });
  g.mark(2, () => {
    // the garment: full at the hem, taken in at the waist, out again over chest and shoulders, in to the neck
    g.mat([0.85, 0.85, 0.85], K.MATTE).lathe(0, 0, bz, [[0.205, 0.3], [0.19, 0.64], [0.15, 0.98], [0.175, 1.18], [0.215, 1.36], [0.19, 1.42], [0.07, 1.47]], 8, { sx: 1.3 });
    g.mat([0.7, 0.7, 0.7], K.MATTE).lathe(0.02, 0, bz + 0.02, [[0.2, 0.72], [0.2, 1.2], [0.2, 1.4]], 5, { sx: 1.2, phase: 0.6 });     // the drape over one shoulder
    // sleeves: the upper arms, one raised toward the stick, one hanging
    g.mat([0.78, 0.78, 0.78], K.MATTE).strut([0.26, 1.37, bz], [0.25, 1.12, bz - 0.09], 0.085).strut([-0.27, 1.37, bz], [-0.29, 1.08, bz + 0.01], 0.085);
  });
  g.mat(skin, K.MATTE).lathe(0, 0, bz, [[0.052, 1.45], [0.05, 1.53]], 6);                              // neck
  g.lathe(0, 0, bz, [[0.05, 1.5], [0.085, 1.55], [0.1, 1.63], [0.088, 1.7], [0.03, 1.75]], 8);         // head
  g.strut([0.25, 1.12, bz - 0.09], [0.045, 1.24, 0.03], 0.06);                                         // a forearm to the umbrella's stick
  g.strut([-0.29, 1.08, bz + 0.01], [-0.25, 0.86, bz - 0.11], 0.06);                                   // the other hand at a bundle
  g.mat([0.3, 0.24, 0.16], K.MATTE).box(-0.25, 0.72, bz - 0.13, 0.2, 0.24, 0.26, 0.3);
  g.mat([0.02, 0.018, 0.018], K.MATTE).lathe(0, 0, bz + 0.015, [[0.1, 1.62], [0.092, 1.71], [0.03, 1.765]], 8);
  g.lathe(0, 0, bz + 0.1, [[0.02, 1.52], [0.06, 1.57], [0.02, 1.64]], 5);                              // hair knotted at the nape
  g.mark(5, () => {
    g.mat([0.4, 0.4, 0.4], K.MATTE).box(0, 1.52, 0, 0.022, 0.98, 0.022, 0, { top: false });
    g.mat([1, 1, 1], K.MATTE).lathe(0, 0, 0.06, [[0.75, 1.64], [0.62, 1.8], [0.36, 1.93], [0.03, 2.0]], 10);
    g.mat([0.5, 0.5, 0.5], K.MATTE).lathe(0, 0, 0.06, [[0.03, 2.0], [0.012, 2.09]], 4);
  });
  return g.finish();
}

// ---------------------------------------------------------------- stand-ins for what is far off
// Beyond FAR_LOD metres from the eye a vehicle or a figure is drawn as a plain stand-in: its body as a box (or a tube, or a
// cone of cloth) in its own colours, with the same tint marks as the whole thing, so the same instance colours, lit window
// band, tail lamp and umbrella serve both. At that distance a metre is under three pixels of a 1080-line picture (two of a
// 720-line one): what the stand-in leaves out (wheels, bogies, rods, rivets, handles, window bars, faces and hands) is all
// smaller than that.
const FAR_LOD = 300;
function coachLoGeo() {
  const g = tinted(), L = 14, hw = 1.45, f = 1.15, e = 3.3, nb = 7, yv = (v) => f + 0.95 + (v - 0.02) / 0.96 * (e - 1.05 - f);
  g.mat([0.085, 0.085, 0.092], K.IRON).box(0, 0.7, 0, 2.3, 0.9, L - 0.6, 0, { top: false });          // underframe and bogies: one dark mass
  g.mark(1.2, () => {
    g.mat([1, 1, 1], K.WOOD);
    for (const sx of [-1, 1]) {
      g.quad([sx * hw, f, sx * L / 2], [sx * hw, f, -sx * L / 2], [sx * hw, f + 0.95, -sx * L / 2], [sx * hw, f + 0.95, sx * L / 2], 0, 0, L, 0.95);
      g.quad([sx * hw, e - 0.1, sx * L / 2], [sx * hw, e - 0.1, -sx * L / 2], [sx * hw, e, -sx * L / 2], [sx * hw, e, sx * L / 2], 0, 0, L, 0.1, 0.8);
      g.quad([-sx * hw, f, sx * L / 2], [sx * hw, f, sx * L / 2], [sx * hw, e, sx * L / 2], [-sx * hw, e, sx * L / 2], 0, 0, 2.9, e - f, 0.8);
    }
  });
  g.mark(2.2, () => {                                         // the window band, painted (lit bays and all) by the same shader
    g.mat([1, 1, 1], K.COACH);
    for (const sx of [-1, 1]) g.quad([sx * hw, yv(0.02), sx * L / 2], [sx * hw, yv(0.02), -sx * L / 2], [sx * hw, yv(0.98), -sx * L / 2], [sx * hw, yv(0.98), sx * L / 2], 0, 0.02, nb, 0.98);
  });
  g.mat([0.085, 0.085, 0.095], K.IRON);                       // the roof: three flats for its arc
  for (let i = 0; i < 3; i++) {
    const t0 = -Math.PI / 2 + i * Math.PI / 3, t1 = t0 + Math.PI / 3;
    const x0 = hw * 1.06 * Math.sin(t0), y0 = e + 0.42 * Math.cos(t0), x1 = hw * 1.06 * Math.sin(t1), y1 = e + 0.42 * Math.cos(t1);
    g.quad([x0, y0, L / 2], [x1, y1, L / 2], [x1, y1, -L / 2], [x0, y0, -L / 2], i, 0, i + 1, L);
    for (const z of [-L / 2, L / 2]) g.tri([0, e, z], [x0, y0, z], [x1, y1, z]);
  }
  g.mark(7.5, () => { g.mat([0.68, 0.035, 0.02], K.GLOW).box(0.8, 1.51, L / 2 + 0.29, 0.14, 0.14, 0.02); });     // the tail lamp (last coach only)
  return g.finish();
}
function wagonLoGeo() {
  const g = tinted(), hl = 2.5;
  g.mat([0.045, 0.042, 0.045], K.IRON).box(0, 0.63, 0, 2.2, 0.9, 5.4, 0, { top: false });               // underframe and wheels: one dark mass
  g.mark(1, () => { g.mat([1, 1, 1], K.WOOD).box(0, 1.85, 0, 2.5, 1.55, hl * 2, 0, { top: false }); });
  g.mark(2, () => {
    g.mat([1, 1, 1], K.MATTE);
    const prof = [[-1.34, 2.6], [-0.7, 2.98], [0.7, 2.98], [1.34, 2.6]], rz = hl + 0.08;
    for (let i = 0; i < 3; i++) g.quad([prof[i][0], prof[i][1], rz], [prof[i + 1][0], prof[i + 1][1], rz], [prof[i + 1][0], prof[i + 1][1], -rz], [prof[i][0], prof[i][1], -rz], i, 0, i + 1, 5.2);
    for (const sz of [-1, 1]) g.quad([-1.3, 2.6, sz * hl], [1.3, 2.6, sz * hl], [0.7, 2.98, sz * hl], [-0.7, 2.98, sz * hl]);
  });
  g.mark(7, () => { g.mat([0.68, 0.035, 0.02], K.GLOW).box(0.8, 1.33, hl + 0.2, 0.11, 0.11, 0.02); });           // the tail lamp (last van only)
  return g.finish();
}
function locoLoGeo() {
  const g = tinted(), round = [], black = [0.03, 0.03, 0.034];
  const tube = (cx, cy, z0, z1, r, n, caps) => { const v0 = g.nv; tubeZ(g, cx, cy, z0, z1, r, n, caps); round.push([v0, g.nv, cx, cy]); };
  g.mat(black, K.PAINT).box(0, 0.95, -3.5, 2.2, 1.1, 10, 0, { top: false });                            // frames, cylinders and motion: one black mass
  g.box(0, 1.5, -4.4, 2.1, 0.08, 8);                                                                   // the running plate
  g.mat([0.2, 0.05, 0.04], K.MATTE);                                                                  // the driving wheels: a dull red disc for each (spokes and the dark between them)
  for (const sx of [-1, 1]) for (const z of [-5.6, -3.6, -1.6]) wheel(g, sx * 1.125, 1.14, z, 0.95, 8);
  g.mark(1, () => { g.mat([1, 1, 1], K.PAINT); tube(0, 2.5, -7.4, -1.3, 0.92, 8, false); });            // the boiler, in the engine's colour
  g.mat(black, K.PAINT); tube(0, 2.5, -8.3, -7.4, 0.98, 8, true);                                      // smokebox
  g.lathe(0, 3.38, -7.85, [[0.3, 0], [0.34, 0.78]], 4, { phase: 0.785 });                             // chimney
  g.mat([0.5, 0.33, 0.1], K.BRASS).lathe(0, 3.36, -5, [[0.42, 0], [0.36, 0.4], [0.02, 0.6]], 4, { phase: 0.785 });   // dome
  g.mark(1, () => {
    g.mat([1, 1, 1], K.PAINT).box(0, 2.55, -0.3, 2.7, 2.1, 2.0, 0, { top: false });                   // cab
    g.box(0, 2.2, 5.3, 2.7, 1.9, 6.0, 0, { top: false });                                             // tender
  });
  g.mat(black, K.PAINT).box(0, 3.68, -0.3, 2.9, 0.14, 2.3).box(0, 0.8, 5.3, 2.2, 0.9, 6.2, 0, { top: false });   // cab roof; tender frames and wheels
  g.mat([0.03, 0.03, 0.032], K.COAL).box(0, 3.3, 5.5, 2.4, 0.5, 5.2);                                 // the coal
  g.mat([1.0, 0.72, 0.3], K.GLOW).box(0, 3.62, -8.25, 0.2, 0.2, 0.12);                                // the headlamp
  return roundZ(g.finish(), round);
}
function personLoGeo() {
  const g = tinted(), bz = 0.14;
  g.mat([0.4, 0.37, 0.31], K.MATTE).lathe(0, 0, bz, [[0.16, 0], [0.21, 0.32]], 4, { sx: 1.2, phase: 0.785 });           // feet and hem
  g.mark(2, () => { g.mat([0.8, 0.8, 0.8], K.MATTE).lathe(0, 0, bz, [[0.21, 0.3], [0.16, 0.98], [0.22, 1.38], [0.07, 1.47]], 4, { sx: 1.3, phase: 0.785 }); });   // the garment
  g.mat([0.1, 0.06, 0.045], K.MATTE).box(0, 1.61, bz, 0.19, 0.28, 0.2);                                                  // head and hair
  g.mark(5, () => { g.mat([1, 1, 1], K.MATTE).lathe(0, 0, 0.06, [[0.75, 1.64], [0.36, 1.93], [0.03, 2.0]], 5); });       // the umbrella's canopy
  return g.finish();
}

// one roof of the quarter: a limewashed box under tin or tile, stones on the sheets, a lean-to, a drum
function shackGeo(roofK) {
  const g = tinted();
  g.mark(2, () => {
    g.mat([1, 1, 1], K.CHAWL);
    g.quad([-0.5, 0, 0.5], [0.5, 0, 0.5], [0.5, 1, 0.5], [-0.5, 1, 0.5], 0, 0, 2, 1);
    g.quad([0.5, 0, -0.5], [-0.5, 0, -0.5], [-0.5, 1, -0.5], [0.5, 1, -0.5], 3, 0, 5, 1);
    g.quad([0.5, 0, 0.5], [0.5, 0, -0.5], [0.5, 1, -0.5], [0.5, 1, 0.5], 6, 0, 7.4, 1, 0.9);
    g.quad([-0.5, 0, -0.5], [-0.5, 0, 0.5], [-0.5, 1, 0.5], [-0.5, 1, -0.5], 9, 0, 10.4, 1, 0.9);
    g.mat([1, 1, 1], K.MATTE);
    g.tri([0.5, 1, 0.5], [0.5, 1, -0.5], [0.5, 1.32, 0]); g.tri([-0.5, 1, -0.5], [-0.5, 1, 0.5], [-0.5, 1.32, 0]);
  });
  g.mark(1, () => {
    g.mat([1, 1, 1], roofK);
    g.quad([-0.58, 0.97, 0.6], [0.58, 0.97, 0.6], [0.58, 1.34, 0], [-0.58, 1.34, 0], 0, 0, 6, 3.4);
    g.quad([0.58, 0.97, -0.6], [-0.58, 0.97, -0.6], [-0.58, 1.34, 0], [0.58, 1.34, 0], 7, 0, 13, 3.4, 0.92);
    g.quad([-0.45, 0.46, 1.0], [0.25, 0.46, 1.0], [0.25, 0.7, 0.5], [-0.45, 0.7, 0.5], 0, 0, 3.6, 2.2, 0.85);
  });
  g.mat([0.16, 0.12, 0.08], K.WOOD); for (const x of [-0.43, 0.23]) g.box(x, 0.23, 0.98, 0.03, 0.46, 0.03, 0, { top: false });
  g.mat([0.33, 0.32, 0.3], K.MATTE);
  g.box(-0.3, 1.2, 0.25, 0.07, 0.05, 0.07).box(0.1, 1.2, -0.27, 0.07, 0.05, 0.08);
  g.mat([0.03, 0.13, 0.32], K.MATTE).box(0.6, 0.13, -0.25, 0.12, 0.26, 0.1);
  return g.finish();
}

function tankGeo(simple) {
  const g = tinted(), rust = [0.13, 0.075, 0.05];
  g.mark(1, () => {
    g.mat([1, 1, 1], K.IRON).lathe(0, 0, 0, [[0.5, 0.6], [0.5, 0.955]], 10, { us: 3, vs: 3 });
    g.mat([0.8, 0.8, 0.8], K.IRON).lathe(0, 0, 0, [[0.545, 0.95], [0.08, 1.04], [0.0, 1.075]], 10, { us: 3, vs: 3 });     // conical lid, overhanging, with a cap
  });
  g.mat(rust, K.IRON);
  if (!simple) for (const y of [0.61, 0.73, 0.85]) g.lathe(0, 0, 0, [[0.514, y], [0.514, y + 0.016]], 10, { us: 3, vs: 3 });      // riveted bands
  g.mat([0.05, 0.05, 0.055], K.IRON).box(0, 0.59, 0, 0.9, 0.03, 0.9);
  for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) g.strut([sx * 0.42, 0, sz * 0.42], [sx * 0.38, 0.6, sz * 0.38], 0.06);
  if (simple) return g.finish();                              // far off: the drum, its lid and its legs are all that can be seen
  g.strut([-0.42, 0.08, 0.42], [0.38, 0.52, 0.38], 0.04); g.strut([0.42, 0.08, -0.42], [-0.38, 0.52, -0.38], 0.04);
  g.strut([0.42, 0.08, 0.42], [0.38, 0.52, -0.38], 0.04); g.strut([-0.42, 0.08, -0.42], [-0.38, 0.52, 0.38], 0.04);
  // a ladder up one leg to the lid (lattice kind: rails, rungs and bracing from the shader)
  g.mat([0.07, 0.065, 0.06], K.LATTICE).quad([0.53, 0, -0.07], [0.53, 0.97, -0.07], [0.53, 0.97, 0.07], [0.53, 0, 0.07], 0, 0, 24, 1);
  g.mat(rust, K.IRON).strut([0.5, 0.66, 0.2], [0.62, 0.66, 0.2], 0.03, 0.01).strut([0.62, 0.66, 0.2], [0.62, 0.6, 0.2], 0.03, 0.006);   // overflow pipe
  return g.finish();
}

// cloth: a tarpaulin (4 x 4 grid pinned at its edges) and a hanging strip of washing (pinned at the top)
function tarpGeo() {
  const g = makeG(); g.mat([1, 1, 1], K.MATTE);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
    const x0 = -0.5 + i / 4, x1 = x0 + 0.25, z0 = -0.5 + j / 4, z1 = z0 + 0.25;
    g.quad([x0, 0, z1], [x1, 0, z1], [x1, 0, z0], [x0, 0, z0], x0 * 3, z0 * 3, x1 * 3, z1 * 3, 0.9 + 0.1 * ((i + j) % 2));
  }
  return fnAttr(g.build(), 'aW', (x, y, z) => 16 * (0.25 - x * x) * (0.25 - z * z));
}
function clothGeo() {
  const g = makeG(); g.mat([1, 1, 1], K.MATTE);
  for (let j = 0; j < 4; j++) g.quad([-0.5, -(j + 1) / 4, 0], [0.5, -(j + 1) / 4, 0], [0.5, -j / 4, 0], [-0.5, -j / 4, 0], 0, j, 1, j + 1, 0.86 + 0.14 * (j % 2));
  return fnAttr(g.build(), 'aW', (x, y) => 2 - y);
}
// a covered handcart: bed on two wheels, push handles at +z, the load (first tint) under a sheet (second tint)
function cartGeo() {
  const g = tinted(), wood = [0.2, 0.14, 0.09];
  g.mat(wood, K.WOOD).box(0, 0.82, 0, 1.15, 0.08, 2.3);
  for (const sx of [-1, 1]) {
    g.mat([0.13, 0.09, 0.06], K.WOOD); wheel(g, sx * 0.66, 0.56, 0.1, 0.56, 10);
    g.mat(wood, K.WOOD).strut([sx * 0.45, 0.84, 1.15], [sx * 0.45, 0.95, 2.4], 0.06);
  }
  g.strut([0, 0.8, -1.0], [0, 0.25, -1.0], 0.07);
  g.mark(1, () => { g.mat([1, 1, 1], K.MATTE).box(0, 1.08, -0.1, 0.95, 0.44, 1.7); });
  g.mark(2, () => { g.mat([1, 1, 1], K.MATTE).box(0.02, 1.34, -0.2, 1.05, 0.1, 1.5); });
  return g.finish();
}
function kiteGeo() {
  const g = tinted();
  g.mark(6, () => {
    g.mat([1, 1, 1], K.MATTE);
    g.tri([-0.5, 0, 0], [0.5, 0, 0], [0, 0.65, 0]); g.tri([0.5, 0, 0], [-0.5, 0, 0], [0, -0.8, 0], [0, 0], [1, 0], [0.5, 1], 0.8);
    g.quad([-0.04, -2.6, 0.2], [0.04, -2.6, 0.2], [0.04, -0.8, 0], [-0.04, -0.8, 0]);
  });
  return g.finish();
}
function crowGeo() {
  const g = tinted(); g.mat([0.018, 0.018, 0.024], K.IRON);
  g.box(0, 0.13, 0, 0.1, 0.13, 0.3, 0, { bottom: true }).box(0, 0.22, 0.17, 0.07, 0.08, 0.1).box(0, 0.11, -0.22, 0.06, 0.025, 0.18);
  g.mat([0.05, 0.045, 0.04], K.IRON).box(0, 0.21, 0.25, 0.025, 0.025, 0.08);
  return g.finish();
}

// The doorway we hang from, in camera space (eye at the origin, -z ahead, rail 2.9 below; the eye rides a metre
// outside the coach side). It keeps to the left 14 % and the top corner of the frame: the coach skin ahead of the
// door (cream boards over maroon, beaded and riveted), the brass edge, a wet steel grab pole, the lintel with its
// gutter and two leather loops.
function doorGeo(C) {
  const g = tinted(), x0 = -0.95, zJ = -0.85, zE = -1.25, zm = (zJ + zE) / 2, dz = zJ - zE, wy = -0.5, yT = 0.64;
  const teak = [0.2, 0.11, 0.055], cream = mulc(C.cream, 0.36), maroon = mixc(mulc(C.maroon, 0.75), [0.07, 0.05, 0.05], 0.3), iron = [0.07, 0.07, 0.078];
  const ph = yT - wy - 0.05, pc = (wy + 0.06 + yT - 0.03) / 2;
  // skin ahead of the opening
  g.mat(maroon, K.WOOD).quad([x0, -1.75, zJ], [x0, -1.75, zE], [x0, wy - 0.03, zE], [x0, wy - 0.03, zJ], 0, 0, dz, 1.2);
  g.mat(mulc(cream, 1.15), K.WOOD).quad([x0, wy + 0.03, zJ], [x0, wy + 0.03, zE], [x0, yT, zE], [x0, yT, zJ], 0.38, 0, 0.38 + dz, yT - wy);
  g.mat(C.brass, K.BRASS).box(x0 + 0.012, wy, zm, 0.03, 0.06, dz + 0.02);
  // bead mouldings framing the upper panel, a quarter-light, and a riveted iron strap
  g.mat(teak, K.WOOD);
  for (const z of [zJ - 0.035, zE + 0.02]) g.box(x0 + 0.009, pc, z, 0.018, ph, 0.028);
  for (const y of [wy + 0.06, -0.08, 0.27, yT - 0.03]) g.box(x0 + 0.009, y, zm, 0.018, 0.026, dz - 0.05);
  g.mat(mulc(cream, 1.12), K.MATTE).box(x0 + 0.004, 0.095, zm - 0.02, 0.008, 0.27, dz - 0.16);
  g.mat(mulc(cream, 0.66), K.MATTE).box(x0 + 0.006, pc, zJ - 0.115, 0.012, ph, 0.04);
  g.mat(mulc(cream, 0.95), K.MATTE);
  const riv = (xb, y, z) => { for (let i = 0; i < 6; i++) { const b0 = i / 6 * TAU, b1 = (i + 1) / 6 * TAU; g.tri([xb + 0.006, y, z], [xb, y + Math.cos(b0) * 0.009, z + Math.sin(b0) * 0.009], [xb, y + Math.cos(b1) * 0.009, z + Math.sin(b1) * 0.009], [0.5, 0.5], [0, 0], [1, 0], 0.85 + 0.15 * Math.cos(b0 - 0.8)); } };     // round-headed, lit from above
  for (let y = wy + 0.1; y < yT - 0.05; y += 0.07) riv(x0 + 0.012, y, zJ - 0.115);
  for (let i = 0; i < 4; i++) riv(x0 + 0.027, wy, zJ - 0.05 - i * 0.085);
  // worn edges where hands and bundles rub: bare wood showing at the jamb's corner and along the waist
  g.mat([0.17, 0.12, 0.08], K.WOOD).box(x0 + 0.003, -0.05, zJ - 0.012, 0.006, 0.8, 0.024).box(x0 + 0.003, wy + 0.045, zm + 0.05, 0.006, 0.02, dz * 0.6);
  // the jamb's own reveal and its brass edge
  g.mat(mulc(maroon, 0.8), K.WOOD).quad([x0 - 0.2, -1.75, zJ], [x0, -1.75, zJ], [x0, wy, zJ], [x0 - 0.2, wy, zJ], 0, 0, 0.14, 1.25);
  g.mat(mulc(cream, 0.8), K.WOOD).quad([x0 - 0.2, wy, zJ], [x0, wy, zJ], [x0, yT, zJ], [x0 - 0.2, yT, zJ], 0, 0, 0.14, yT - wy);
  g.mat(C.brass, K.BRASS).box(x0 + 0.004, (yT - 1.72) / 2, zJ + 0.004, 0.03, yT + 1.72, 0.03, 0, { top: false });
  // grab pole on two brass brackets
  const px = x0 + 0.1, pz = zJ - 0.16;
  g.mat([0.1, 0.105, 0.115], K.BRASS).lathe(px, -1.62, pz, [[0.016, 0], [0.016, yT + 1.6]], 10);
  g.mat(C.brass, K.BRASS);
  for (const y of [yT - 0.06, -1.58]) { g.box(x0 + 0.05, y, pz, 0.1, 0.028, 0.028); g.lathe(px, y - 0.03, pz, [[0.026, 0], [0.026, 0.06]], 8); }
  // lintel and gutter
  g.mat(teak, K.WOOD).box(x0 - 0.02, yT + 0.09, -0.68, 0.24, 0.1, 0.8, 0, { bottom: true });
  g.mat(iron, K.IRON).box(x0 + 0.082, yT + 0.075, -0.68, 0.035, 0.13, 0.82, 0, { bottom: true });
  // two leather loops: a short strap and an open ring, turned to face the eye
  const leather = [0.2, 0.11, 0.05], hx = 0.79, hz = -0.61;
  const loop = (cx, cz) => {
    g.mat(leather, K.WOOD).quad([cx - hx * 0.014, yT - 0.03, cz - hz * 0.014], [cx + hx * 0.014, yT - 0.03, cz + hz * 0.014], [cx + hx * 0.014, yT + 0.045, cz + hz * 0.014], [cx - hx * 0.014, yT + 0.045, cz - hz * 0.014]);
    const cy = yT - 0.07, ro = 0.045, ri = 0.028, n = 12;
    for (let i = 0; i < n; i++) {
      const a0 = i / n * TAU, a1 = (i + 1) / n * TAU;
      const P = (r, a) => [cx + hx * Math.cos(a) * r * 0.8, cy + Math.sin(a) * r, cz + hz * Math.cos(a) * r * 0.8];
      g.quad(P(ri, a0), P(ro, a0), P(ro, a1), P(ri, a1), 0, 0, 0.1, 0.1, 0.9 + 0.1 * (i % 2));
    }
  };
  g.mark(1, () => loop(x0 + 0.08, -1.0));
  g.mark(2, () => loop(x0 + 0.16, -1.06));
  return g.finish();
}
doorGeo.top = 0.64; doorGeo.gutter = [-0.85, 0.65, -1.1];

// ---------------------------------------------------------------- looks
// linear colours: [sun, sky (reflections), horizon, storm, ambient, ground, fill, fog, dome zenith, dome horizon]
const HOURS = {
  late: {
    title: 'The Cloudburst Local', sun: [0.836, 0.259, -0.483],
    after: { sun: [2.1, 1.26, 0.49], sky: [0.3, 0.47, 0.76], hor: [0.83, 0.7, 0.34], amb: [0.2, 0.26, 0.38], gnd: [0.075, 0.065, 0.055], fill: [0.05, 0.09, 0.2], fog: [0.42, 0.38, 0.28], zen: [0.1, 0.24, 0.56], dhor: [0.62, 0.54, 0.3] },
    overc: [0.47, 0.5, 0.56], wallLit: [1.25, 0.82, 0.5], lamp: 0, exposure: 1.02, tint: '#fff6ea', portal: '#ffd9a0', sunL: 3.2,
  },
  noon: {
    title: 'The Cloudburst Local: Monsoon Noon', sun: [0.533, 0.788, -0.308],
    after: { sun: [2.3, 2.15, 1.85], sky: [0.2, 0.42, 0.85], hor: [0.62, 0.72, 0.78], amb: [0.26, 0.33, 0.46], gnd: [0.09, 0.085, 0.075], fill: [0.05, 0.09, 0.18], fog: [0.6, 0.66, 0.7], zen: [0.07, 0.22, 0.62], dhor: [0.62, 0.74, 0.82] },
    overc: [0.52, 0.55, 0.6], wallLit: [1.3, 1.25, 1.15], lamp: 0, exposure: 0.88, tint: '#f6fbff', portal: '#eaf4ff', sunL: 3.6,
  },
  dusk: {
    title: 'The Cloudburst Local: Lamp-lighting', sun: [0.861, 0.105, -0.497],
    after: { sun: [1.75, 0.66, 0.2], sky: [0.1, 0.17, 0.36], hor: [0.6, 0.58, 0.3], amb: [0.11, 0.15, 0.27], gnd: [0.05, 0.045, 0.045], fill: [0.035, 0.06, 0.16], fog: [0.36, 0.36, 0.24], zen: [0.035, 0.07, 0.23], dhor: [0.66, 0.7, 0.26] },
    overc: [0.27, 0.3, 0.37], wallLit: [1.1, 0.5, 0.3], lamp: 1, exposure: 1.22, tint: '#fff2e2', portal: '#ffc98a', sunL: 2.4,
  },
};
const STORM = [0.045, 0.052, 0.15];              // the indigo of the wall, lit
const RAINCOL = [0.2, 0.26, 0.33];               // the grey-blue of the curtain

export default {
  id: 'cloudburst-local',
  name: 'The Cloudburst Local',
  category: 'city',
  weirdness: 0.1,
  media: ['rail', 'open'],
  async build(ctx) {
    await ctx.yield();                                        // start in a step of our own, clear of the module's loading
    const rng = ctx.rng, vary = ctx.vary || {}, vr = rng.fork('cl-look-46');
    const detail = ctx.quality?.detail ?? 1, density = clamp(vary.density ?? 1, 0.7, 1.3), plenty = detail * (0.75 + 0.25 * density);
    const rare = !!vary.rare;
    const hourPick = vr.pick(['late', 'late', 'noon', 'dusk']);
    const weatherPick = vr.pick(['classic', 'classic', 'late', 'shower']);
    const cast = vr.pick(['mail', 'milk', 'local']), kiteDay = vr.chance(0.3), flamingos = vr.chance(0.35);
    const xr = vr.fork('extras');                             // later additions draw from here, so the older scatter keeps its places
    const nr = ctx.core.makeRng('cl-chowk:' + ctx.seed);      // and the newest (the chowk, the cabin, the deck's furniture) from a stream of their own
    const hourId = vary.hour === 'day' ? 'noon' : vary.hour === 'golden' ? 'late' : vary.hour === 'night' || vary.hour === 'dawn' ? 'dusk' : hourPick;
    const weather = rare ? 'classic' : weatherPick, shower = weather === 'shower';
    const HR = HOURS[hourId], AF = HR.after, duration = 42;
    const uFront = weather === 'late' ? 0.37 : 0.2, uClear = weather === 'late' ? 0.86 : 0.5;
    const SUN = new THREE.Vector3().fromArray(HR.sun).normalize();
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x808080, 0.0012);

    // ---- the path: the line of our own doorway
    const pts = [];
    for (let i = 0; i <= 20; i++) { const z = 715 - i * 22.75; pts.push([pathX(z), railY(z) + EYE, z]); }
    for (let z = 220; z >= -140; z -= 40) pts.push([0, EYE, z]);
    const path = makePath(pts, { samples: 440 });
    await ctx.yield();
    const LEN = path.length, SPEED = LEN / duration, VE = 227;
    // the train brakes for the shed (from u 0.8), then rolls on a little more freely to the portal
    const paceF = (u) => 1.06 - 0.42 * smoothstep(0.8, 0.9, u) + 0.2 * smoothstep(0.9, 1, u);
    let paceC = 0; for (let i = 0; i < 65; i++) paceC += 1 / paceF(i / 64); paceC /= 65;      // the engine keeps the duration: true speed = SPEED * paceF(u) * paceC
    const tv = new THREE.Vector3(), tv2 = new THREE.Vector3(), tv3 = new THREE.Vector3();
    const EcamAt = (u) => { path.pointAt(u, tv); return NX * tv.x + NZ * tv.z; };
    const EcF = EcamAt(uFront), EcC = EcamAt(uClear), EshA = EcamAt(0.2), EshB = EcamAt(0.54);
    const zOfS = (s) => path.posAtDist(s, tv).z;

    // ---- the hero: throat, shed and terminus, in the brief's own coordinates. (straightFrom: where the route's last
    // straight begins, found from the path itself: the greatest z, in steps of 2.5 m, up to which the line does not turn.)
    let straightFrom = 0; while (straightFrom < 300 && pathDX(straightFrom + 2.5) === 0) straightFrom += 2.5;
    const hero = await buildHero({ ...ctx, rng: rng.fork('hero') }, { sunDir: HR.sun, straightFrom });
    scene.add(hero.object);
    const A = hero.anchors, HU = hero.uniforms, C = hero.colors;
    HU.uEdge.value.set(NX, NZ, -400, 14);
    // by hour: at noon the wet ballast is darker and holds less sky, the gantries throw short hard shadows and the ground steams less,
    // so rails and puddles are the only bright things; in a sun-shower the bank mirrored in the wet is sunlit cumulus, not indigo
    if (hourId === 'noon') HU.uGndK.value.set(0.46, 0.4, 0.6, 0.4);
    { const tc = new THREE.Color(HR.tint); HU.uPaintLo.value.set(0.0487 / (HR.exposure * tc.g), 0.0515 / (HR.exposure * tc.b)); }     // (the grade's film curve cuts off just below this, whatever the hour's exposure and tint)
    const GK = hourId === 'noon' ? null : [0.46, 0.42, 0.5, 0.45];     // under the low sun too (eased in with it): dark wet ballast, the sky kept for rails and puddles, less ground steam
    if (shower) HU.uStormCol.value.set(lerp(HU.uStormCol.value.x, AF.hor[0], 0.6), lerp(HU.uStormCol.value.y, AF.hor[1], 0.6), lerp(HU.uStormCol.value.z, AF.hor[2], 0.6));
    await ctx.yield();

    // ---- materials: everything this file builds is shaded like the hero
    const X = {
      uGust: { value: 0.1 }, uWindDir: { value: new THREE.Vector2(NX, NZ) }, uBand: { value: new THREE.Vector2(0, 0) },
      uRainCam: { value: 0 }, uRailY: { value: 0 }, uDeckHalf: { value: 10.2 }, uTrackR: { value: new THREE.Vector2(1, 0) },
      uSwing: { value: new THREE.Vector4() }, uOurDim: { value: 1 }, uVeil: { value: 1 }, uShaft: { value: 1 }, uVeilTop: { value: 110 }, uSlitK: { value: 0 }, uLeaf: { value: 0 }, uPix: { value: 0.002 }, uWireCol: { value: new THREE.Vector3(0.02, 0.02, 0.025) },
      uNearK: { value: 1 }, uEP: { value: Array.from({ length: 10 }, () => new THREE.Vector3()) }, uEV: { value: Array.from({ length: 10 }, () => new THREE.Vector4()) },
    };
    const mat = (vs, fs, o = {}) => { const m = hero.mk(vs, fs, o); Object.assign(m.uniforms, X); return m; };
    const surf = mat(WVERT, SURF_FRAG, { side: THREE.DoubleSide });
    const surfT = mat(WVERT, SURF_FRAG, { side: THREE.DoubleSide, defines: { TINTED: 1 } });
    const surfC = mat(WVERT, SURF_FRAG, { side: THREE.DoubleSide, defines: { CLOTH: 1 } });
    const surfD = mat(WVERT, SURF_FRAG, { side: THREE.DoubleSide, defines: { DOOR: 1 } });
    const surfF = mat(WVERT, SURF_FRAG, { side: THREE.DoubleSide, defines: { TINTED: 1, FOLK: 1 } });     // people: the same shading, with an idle sway
    const qr = ctx.core.makeRng('cl-r12:' + ctx.seed);         // round twelve draws from a stream of its own, so every older thing keeps its place
    // Rounds thirteen, fourteen and seventeen have a stream each, and every kind of thing they place has a fork of its own,
    // all taken here in a fixed order before anything draws: a change to one kind (how many people a seed's lineside holds,
    // say) can then never move another's draws (the storm's beat, the birds, the palms).
    // A stream of its own for a thing, made from the world's seed and the thing's name: it draws nothing from any other.
    const own = (name) => ctx.core.makeRng(ctx.core.hashSeed(name + ':' + ctx.seed));
    const r13 = ctx.core.makeRng('cl-r13:' + ctx.seed);
    const r13Fly = r13.fork('r13-flyover'), r13Gal = r13.fork('r13-gallery-people'), r13Pot = r13.fork('r13-pots'), r13Sig = r13.fork('r13-signals');
    const r13Line = r13.fork('r13-lineside-figures'), r13GalF = r13.fork('r13-gallery-figures'), r13Yard = r13.fork('r13-yard-figures');
    const r13Coach = r13.fork('coachplain'), r13Smoke = r13.fork('r13-smoke');
    const r14 = ctx.core.makeRng('cl-r14:' + ctx.seed);
    const r14Via = r14.fork('r14-viaduct'), r14ViaC = r14.fork('r14-viaduct-crowns'), r14Grove = r14.fork('r14-grove'), r14GroveC = r14.fork('r14-grove-crowns');
    const r17 = ctx.core.makeRng('cl-r17:' + ctx.seed);
    const r17Sig = r17.fork('r17-signal'), r17Folk = r17.fork('r17-people'), r17Pud = r17.fork('r17-puddles'), r17Birds = r17.fork('r17-birds');
    const r17Dome = r17.fork('r17-dome'), r17Storm = r17.fork('r17-storm'), r17Flam = r17.fork('r17-flamingos');
    const HALT0 = 170, HALT1 = 262, HALT_RAMP = 5;             // the wayside halt's platform, metres in, and the length of the ramp at either end of it
    const SPAN = 44;                                           // a telegraph span
    // One signal section of this terminus, as built: the mean distance between its successive signal gantries. A train that
    // follows another (the second departure, the light engine behind the local) keeps one section behind its tail lamp.
    const HEADWAY = (() => { const gz = A.gantries.map((q) => q.z).sort((a, b) => a - b); return (gz[gz.length - 1] - gz[0]) / (gz.length - 1); })();
    const lampOn13 = HR.lamp ? -1 : shower ? 2 : uFront - 0.03, galFolk = [], potSpots = [];
    const add = (geo, m, order = 0, cull = true) => { const o = new THREE.Mesh(geo, m); o.renderOrder = order; o.frustumCulled = cull; scene.add(o); return o; };
    // The vehicles and the figures are kept in sets (instanced) that the code below places and colours. A set itself is not
    // drawn: what is drawn of it is a copy made each frame (lodSplit) of those of its members that stand within FAR_LOD metres
    // of the eye (the sets of one shape share one drawn copy: lodKind); the members beyond that are drawn as the stand-ins
    // of their kind. One rule of true distance for all of them, in every weather.

    // ---- sky dome and the two real lights (for the kit's palms and birds)
    const V3 = (a) => ({ value: new THREE.Vector3(a[0], a[1], a[2]) });
    const skyU = {
      uSunDir: HU.uSunDir, uSunCol: V3(AF.sun), uZen: V3(AF.zen), uHor: V3(AF.dhor), uOverc: V3(HR.overc), uWallCol: V3(shower ? mixc(STORM, AF.dhor, 0.6) : STORM), uWallLit: V3(HR.wallLit), uWallA: { value: shower ? 0.5 : 1 },
      uRainCol: V3(RAINCOL), uFogCol: V3(AF.fog), uBrass: V3([2.2, 1.2, 0.4]), uWall: { value: new THREE.Vector4(0.38, 1.12, 1.5, 0) }, uBase: { value: new THREE.Vector2(0.2, 0.17) },
      uTime: HU.uTime, uSunK: { value: 0 }, uOver: { value: 1 }, uIn: { value: 0 }, uFlash: { value: 0 }, uSlit: { value: 1 }, uDome: { value: new THREE.Vector4(0, 0, 0.003, 0) },
      uBreakCol: V3([0.5, 0.6, 0.68]), uBreak: { value: new THREE.Vector3(0.25, 0, 0.26) }, uBolt: { value: new THREE.Vector2(0, 0) }, uFl: { value: new THREE.Vector4(0, 0.3, 0, 0.5) },
    };
    const sky = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 20), new THREE.ShaderMaterial({ uniforms: skyU, vertexShader: SKY_VERT, fragmentShader: SKY_FRAG, side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false }));
    sky.scale.setScalar(4200); sky.renderOrder = -1; sky.frustumCulled = false; scene.add(sky);
    const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1.5), sunL = new THREE.DirectionalLight(0xffffff, 0);
    sunL.position.copy(SUN).multiplyScalar(100); scene.add(hemi, sunL, sunL.target);

    // ---- the quarter's ground, cut round the hero's own wet ballast
    {
      const R = 2600, P = [], I = [];
      const rect = (x0, x1, z0, z1) => { const n = P.length / 3; P.push(x0, -0.04, z0, x1, -0.04, z0, x1, -0.04, z1, x0, -0.04, z1); I.push(n, n + 2, n + 1, n, n + 3, n + 2); };
      rect(-R, -75, -R, R); rect(50, R, -R, R); rect(-75, 50, 304, R); rect(-75, 50, -R, -146);
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setIndex(I);
      add(geo, mat(FLAT_VERT, CITY_FRAG), 0, false);
    }

    // ---- the line out of the throat: stations every 4 m along our four tracks
    const st = [];
    { let s = 0, px = 0, pz = 0;
      for (let z = 300; z <= 856; z += 4) {
        const dx = pathDX(z), nrm = Math.hypot(dx, 1), x = pathX(z);
        if (st.length) s += Math.hypot(x - px, z - pz);
        st.push({ z, x, y: railY(z), rx: 1 / nrm, rz: -dx / nrm, s }); px = x; pz = z;
      } }
    const stAt = (z) => st[clamp(Math.round((z - 300) / 4), 0, st.length - 1)];
    {                                                         // ballast deck (the hero's wet ground shader)
      const lat = [-10.4, -8.4, -6.8, -5.2, -4.2, OUR_X, -1.0, 0.6, 2.4, 3.9, 5.4, 7.0, 8.6, 10.4], nj = lat.length, P = [], D = [], I = [];
      for (const q of st) for (const o of lat) { P.push(q.x + o * q.rx, q.y - (q.z < 306 ? 0.02 : 0), q.z + o * q.rz); let d = 9; for (const t of TRACK_OFF) d = Math.min(d, Math.abs(o - t)); D.push(d); }
      for (let i = 0; i < st.length - 1; i++) for (let j = 0; j < nj - 1; j++) { const a = i * nj + j, b = a + nj; I.push(a, b, a + 1, a + 1, b, b + 1); }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setAttribute('aTd', new THREE.Float32BufferAttribute(D, 1)); geo.setIndex(I);
      add(geo, hero.mk(GROUND_VERT, GROUND_FRAG, { defines: { DECK: 1 } }), 0, false);
    }
    {                                                         // sleepers, rails, rodding (the hero's track shader)
      const P = [], U = [], M = [], T = [], I = [];
      const strip = (off, hw, yo, mode, vertical) => {
        const n0 = P.length / 3;
        st.forEach((q, i) => {
          const x = q.x + off * q.rx, z = q.z + off * q.rz, y = q.y + yo;
          if (vertical) { P.push(x, y, z, x, y - hw, z); U.push(-1, q.s, 1, q.s); } else { P.push(x - q.rx * hw, y, z - q.rz * hw, x + q.rx * hw, y, z + q.rz * hw); U.push(-hw, q.s, hw, q.s); }
          M.push(mode, mode); T.push(-q.rz, 0, q.rx, -q.rz, 0, q.rx);
          if (i) { const n = n0 + i * 2; I.push(n - 2, n - 1, n + 1, n - 2, n + 1, n); }
        });
      };
      TRACK_OFF.forEach((off, k) => {
        strip(off, 1.42, 0.03 + k * 0.004, 0, false);
        for (const side of [-0.84, 0.84]) { strip(off + side, 0.2, 0.19, 1, false); if (k === 1 || k === 2) strip(off + side, 0.16, 0.185, 2, true); }
      });
      strip(4.7, 0.34, 0.2, 3, false);
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2));
      geo.setAttribute('aM', new THREE.Float32BufferAttribute(M, 1)); geo.setAttribute('aT', new THREE.Float32BufferAttribute(T, 3)); geo.setIndex(I);
      add(geo, hero.mk(TRACK_VERT, TRACK_FRAG, { transparent: true, depthWrite: false, side: THREE.DoubleSide }), 1, false);
    }

    await ctx.yield();
    // ---- static masonry and iron: viaduct, flyover, signals, poles, chawls, mills (one merged mesh per district)
    const gNear = makeG(), gFar = makeG(), gThroat = makeG();     // gNear holds only what stands beyond z 300 (the viaduct and its quarter)
    const ropes = makeSprites({ aR: 4 });                     // run-off anchors collected while building
    const rope = (x, y, z, len, w, keep, R = rng) => ropes.add(x, y, z, { aR: [len, w, (keep ? 0.5 : 0) + R() * 0.5, 0] });
    const glows = makeSprites({ aColA: 3, aColB: 3, aSw: 4 });
    const RED = [2.6, 0.18, 0.08], GREEN = [0.13, 2.6, 1.4], WARM = [2.4, 1.3, 0.45];
    const glow = (x, y, z, cA, cB, sw, size) => glows.add(x, y, z, { aColA: cA, aColB: cB || cA, aSw: [sw ?? 2, rng(), size ?? 0.42, 0] });
    const brick = C.brick, stoneC = C.stoneLight;
    // (on the right, from 20 m to 330 m in, the brick parapet gives way to an open iron railing on a stone kerb, so the
    // quarter shows through it from the door)
    const zRailA = zOfS(20), zRailB = zOfS(330);
    for (const side of [-1, 1]) for (let i = 0; i < st.length - 1; i++) {
      const a = st[i], b = st[i + 1];
      const P = (q, o, y) => [q.x + o * q.rx, y, q.z + o * q.rz];
      const o = side * 10.6, oi = side * 10.15, g = gNear;
      if (Math.max(a.y, b.y) > 0.25) g.mat(brick, K.VIADUCT).quad(P(a, o, 0), P(b, o, 0), P(b, o, b.y), P(a, o, a.y), a.s, (a.y + b.y) / 2, b.s, 0);
      const open = side > 0 && a.z >= zRailB && b.z <= zRailA, ph = open ? 0.3 : 0.95;
      g.mat(open ? stoneC : brick, open ? K.STONE : K.BRICK);
      g.quad(P(a, oi, a.y), P(b, oi, b.y), P(b, oi, b.y + ph), P(a, oi, a.y + ph), a.s, 0, b.s, ph);
      g.quad(P(a, o, a.y), P(b, o, b.y), P(b, o, b.y + ph), P(a, o, a.y + ph), a.s, 0, b.s, ph, 0.9);
      g.mat(stoneC, K.STONE).quad(P(a, oi - side * 0.06, a.y + ph + 0.01), P(b, oi - side * 0.06, b.y + ph + 0.01), P(b, o + side * 0.06, b.y + ph + 0.01), P(a, o + side * 0.06, a.y + ph + 0.01), a.s, 0, b.s, 0.57);
      if (open) g.mat(C.ironPaint, K.RAIL).quad(P(a, 10.38, a.y + 0.3), P(b, 10.38, b.y + 0.3), P(b, 10.38, b.y + 1.42), P(a, 10.38, a.y + 1.42), a.s / 1.6, 0, b.s / 1.6, 1);
      if (i % 9 === 4 && a.y > 2) rope(a.x + o * a.rx * 1.01, a.y + 0.1, a.z + o * a.rz * 1.01, Math.min(a.y, 6), 0.09, false);     // scuppers
    }
    await ctx.yield();

    await ctx.yield();
    // the girder flyover, 7 m over the rails 300 m in, on brick approaches
    const FZ = 433, FX = pathX(FZ), FY = railY(FZ) + 7.2, FD = [0.996, 0.087];
    const fP = (t, w, y) => [FX + FD[0] * t - FD[1] * w, y, FZ + FD[1] * t + FD[0] * w];
    const flyT = (x, z) => (x - FX) * FD[0] + (z - FZ) * FD[1], flyW = (x, z) => -(x - FX) * FD[1] + (z - FZ) * FD[0];
    {
      const strandR = own('flyover-strands');                 // the strands of run-off under the girders draw from a stream of their own
      const g = gNear, paint = [0.14, 0.09, 0.08];             // (lighter than the shed's iron: in dry pearl light the web, its stiffeners and rivets must all be told apart)
      for (const w of [-2.9, 2.9]) {
        const sw = Math.sign(w);
        g.mat(paint, K.IRON).strut(fP(-17.5, w, FY + 1.15), fP(17.5, w, FY + 1.15), 0.4, 2.3);
        g.mat(mulc(paint, 1.45), K.IRON);
        for (let t = -16.8; t <= 16.9; t += 2.8) g.strut(fP(t, w + sw * 0.24, FY), fP(t, w + sw * 0.24, FY + 2.3), 0.14);
        g.mat(mulc(paint, 0.72), K.IRON);                       // flange angles along the top and the foot of the web, and a cover plate over each web joint
        for (const yy of [FY + 0.1, FY + 2.2]) g.strut(fP(-17.5, w + sw * 0.225, yy), fP(17.5, w + sw * 0.225, yy), 0.05, 0.2);
        for (const t of [-8.4, 0, 8.4]) g.strut(fP(t + 1.4, w + sw * 0.215, FY + 0.22), fP(t + 1.4, w + sw * 0.215, FY + 2.08), 0.5, 0.03);
        g.mat(mulc(paint, 1.9), K.IRON);
        for (let t = -17.2, i = 0; t <= 17.21; t += 0.4, i++) for (const yy of [FY + 0.1, FY + 2.2]) {      // rivet heads along both angles
          const q = fP(t, w + sw * 0.255, yy), r = 0.03, ax = FD[0] * r, az = FD[1] * r, ox = -FD[1] * sw * 0.026, oz = FD[0] * sw * 0.026;
          const c = [[q[0] - ax, q[1] - r, q[2] - az], [q[0] + ax, q[1] - r, q[2] + az], [q[0] + ax, q[1] + r, q[2] + az], [q[0] - ax, q[1] + r, q[2] - az]];
          for (let k = 0; k < 4; k++) g.tri([q[0] + ox, q[1], q[2] + oz], c[k], c[(k + 1) % 4], [0.5, 0.5], [0, 0], [1, 0], 0.8 + 0.12 * k);
        }
        g.mat(paint, K.IRON);
        // three thin strands hang from each anchor, each a quarter of a metre either way off its place and with its own beat
        for (let t = -11.2; t <= 11.3; t += 0.8) if (Math.abs(t) > 1.3) for (let k = 0; k < 3; k++) {
          const jt = strandR.range(-0.25, 0.25) + (k - 1) * 0.22;
          ropes.add(...fP(t + jt, w + Math.sign(w) * 0.3, FY), { aR: [FY - railY(FZ) - 0.2 - 0.3 * k, 0.02, strandR() * 0.5, 0] });
        }
      }
      // the deck is open girderwork, not a slab: two rail bearers on cross-girders 1.4 m apart with the sky between them, wind
      // bracing, the rails on the bearers (the goods train's wheels and axles run over the slots), a riveted bottom flange to
      // each main girder, and two lamps hanging under the near one
      for (const w of [-0.84, 0.84]) {
        g.mat(C.iron, K.IRON).strut(fP(-17.5, w, FY + 0.63), fP(17.5, w, FY + 0.63), 0.3, 0.56);
        g.mat([0.2, 0.21, 0.23], K.BRASS).strut(fP(-17.5, w, FY + 1.0), fP(17.5, w, FY + 1.0), 0.07, 0.18);
      }
      g.mat(C.iron, K.IRON);
      for (let t = -16.8, i = 0; t <= 16.9; t += 1.4, i++) {
        g.strut(fP(t, -2.9, FY + 0.3), fP(t, 2.9, FY + 0.3), 0.2, 0.44);
        if (i < 24) for (const sg of [-1, 1]) { const fl = (i % 2 === 0) === (sg > 0); g.strut(fP(t + 0.1, sg * (fl ? 1.0 : 2.7), FY + 0.14), fP(t + 1.3, sg * (fl ? 2.7 : 1.0), FY + 0.14), 0.09, 0.05); }
      }
      for (const w of [-2.9, 2.9]) {
        g.mat(paint, K.IRON).strut(fP(-17.5, w, FY - 0.03), fP(17.5, w, FY - 0.03), 0.62, 0.06);
        g.mat(mulc(paint, 1.35), K.IRON);                       // cover plates under the flange where its lengths are joined, so the band overhead is plated ironwork
        for (const t of [-9.8, -1.4, 7]) g.strut(fP(t - 0.9, w, FY - 0.075), fP(t + 0.9, w, FY - 0.075), 0.5, 0.03);
        g.mat(mulc(paint, 1.5), K.IRON);
        for (let t = -11; t <= 11.01; t += 0.5) for (const dw of [-0.2, 0.2]) {      // rivet heads under the flange
          const q = fP(t, w + dw, FY - 0.06), r = 0.034, c = [[q[0] - r, q[1], q[2] - r], [q[0] + r, q[1], q[2] - r], [q[0] + r, q[1], q[2] + r], [q[0] - r, q[1], q[2] + r]];
          for (let k = 0; k < 4; k++) g.tri([q[0], q[1] - 0.028, q[2]], c[k], c[(k + 1) % 4], [0.5, 0.5], [0, 0], [1, 0], 0.85 + 0.1 * k);
        }
      }
      for (const t of [3.6, -5.4]) {
        const lp = fP(t, 2.9, FY - 0.62);
        g.mat(C.iron, K.IRON).strut(fP(t, 2.9, FY - 0.06), fP(t, 2.9, FY - 0.4), 0.04);
        g.mat([0.3, 0.2, 0.09], K.GLOW).lathe(lp[0], lp[1] - 0.2, lp[2], [[0.1, 0], [0.18, 0.38]], 4, { flat: true, phase: 0.785 });
        g.mat(C.iron, K.IRON).lathe(lp[0], lp[1] + 0.18, lp[2], [[0.28, 0], [0.05, 0.2]], 6);
        glows.add(lp[0], lp[1], lp[2], { aColA: [0.2, 0.12, 0.05], aColB: WARM, aSw: [lampOn13, r13Fly(), 0.72, 0] });
        glows.add(lp[0], lp[1], lp[2], { aColA: [0, 0, 0], aColB: WARM, aSw: [lampOn13, r13Fly(), 0.9, 1 + railY(FZ)] });
      }
      for (const sg of [-1, 1]) {
        const f = frame(...fP(sg * 19.4, 0, 0), -Math.atan2(FD[1], FD[0]));
        g.mat(brick, K.BRICK); f.box(g, 0, (FY + 0.7) / 2, 0, 3.8, FY + 0.7, 8.6, { v0: 0 });
        g.mat(stoneC, K.STONE); f.box(g, 0, FY + 0.85, 0, 4.2, 0.3, 9);
        for (let t = 21.3; t < 250; t += 10) {
          const t0 = sg * t, t1 = sg * (t + 10), top = FY + 0.9;
          for (const w of [-3.3, 3.3]) {
            g.mat(brick, K.VIADUCT).quad(fP(t0, w, 0), fP(t1, w, 0), fP(t1, w, top), fP(t0, w, top), t, top, t + 10, 0);
            g.mat(brick, K.BRICK).quad(fP(t0, w, top), fP(t1, w, top), fP(t1, w, top + 0.9), fP(t0, w, top + 0.9), t, 0, t + 10, 0.9);
          }
          g.mat([0.09, 0.085, 0.08], K.MATTE).quad(fP(t0, 3.3, top), fP(t1, 3.3, top), fP(t1, -3.3, top), fP(t0, -3.3, top), 0, 0, 10, 6.6);
        }
      }
    }
    // a signal bridge on the viaduct, 150 m in, and bracket signals in the rain
    const yawAt = (z) => Math.atan(pathDX(z));
    {
      const q = stAt(zOfS(150)), f = frame(q.x, q.y, q.z, yawAt(q.z)), g = gNear;
      const y0 = 7.6, y1 = 9.2, xl = -9.3, xr = 9.3, hz = 0.6;
      g.mat(C.iron, K.IRON);
      for (const lx of [xl, xr]) {
        for (const [ox, oz] of [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]]) g.strut(f.p(lx + ox, 0, oz), f.p(lx + ox, y1, oz), 0.13);
        for (let k = 0; k < 6; k++) {
          const ya = k * y1 / 6, yb = (k + 1) * y1 / 6, fl = k % 2 ? 0.5 : -0.5;
          g.strut(f.p(lx - fl, ya, 0.5), f.p(lx + fl, yb, 0.5), 0.08); g.strut(f.p(lx + fl, ya, -0.5), f.p(lx - fl, yb, -0.5), 0.08);
        }
      }
      for (const zz of [-hz, hz]) for (const yy of [y0, y1]) g.strut(f.p(xl, yy, zz), f.p(xr, yy, zz), 0.16);
      const np = 12, dxp = (xr - xl) / np;
      for (let i = 0; i <= np; i++) for (const zz of [-hz, hz]) {
        const xa = xl + i * dxp;
        g.strut(f.p(xa, y0, zz), f.p(xa, y1, zz), 0.09);
        if (i < np) g.strut(f.p(xa, i % 2 ? y0 : y1, zz), f.p(xa + dxp, i % 2 ? y1 : y0, zz), 0.08);
      }
      g.mat(C.wood, K.WOOD); f.box(g, 0, y1 + 0.12, -0.15, xr - xl + 1, 0.07, 1.0);
      TRACK_OFF.forEach((off, k) => {
        const x = off + 1.7, top = y1 + 4.1 + (k % 2) * 0.7, py = top - 0.7, clear = k === 1;
        g.mat(C.cream, K.IRON).strut(f.p(x, y1, hz), f.p(x, top, hz), 0.18);
        g.mat([0.62, 0.05, 0.04], K.MATTE).strut(f.p(x - 0.1, py, hz + 0.2), f.p(x - 1.5, py - (clear ? 0.95 : 0), hz + 0.2), 0.04, 0.27);
        g.mat(C.iron, K.IRON).strut(f.p(x + 0.05, py - 0.1, hz + 0.18), f.p(x + 0.6, py - 0.1, hz + 0.18), 0.04, 0.5);
        glow(...f.p(x + 0.45, py, hz + 0.3), clear ? GREEN : RED);
      });
    }
    for (const s0 of [336, 414]) {
      const q = stAt(zOfS(s0)), f = frame(q.x, q.y, q.z, yawAt(q.z)), g = gNear, x = 9.1;
      g.mat(C.cream, K.IRON).strut(f.p(x, 0, 0), f.p(x, 3, 0), 0.24); g.mat(C.iron, K.IRON).strut(f.p(x, 3, 0), f.p(x, 7.4, 0), 0.19);
      g.mat([0.62, 0.05, 0.04], K.MATTE).strut(f.p(x - 0.1, 6.6, 0.2), f.p(x - 1.5, 5.7, 0.2), 0.04, 0.27);
      g.mat(C.iron, K.IRON).strut(f.p(x + 0.05, 6.5, 0.18), f.p(x + 0.6, 6.5, 0.18), 0.04, 0.5);
      glow(...f.p(x + 0.45, 6.6, 0.3), GREEN, GREEN, 2, 0.5);
    }
    // telegraph: poles inside the right-hand parapet every 44 m, six sagging wires, crows along them
    const wirePts = [], perchSpots = [];
    for (let s0 = -88; s0 < 440; s0 += 44) {
      const q = stAt(zOfS(s0)), f = frame(q.x, q.y, q.z, yawAt(q.z)), g = gNear, x = 9.7;
      g.mat([0.13, 0.1, 0.075], K.WOOD).strut(f.p(x, -0.2, 0), f.p(x + rng.range(-0.1, 0.1), 7.7, 0), 0.22);
      f.box(g, x, 7.1, 0, 2.4, 0.1, 0.12); f.box(g, x, 6.5, 0, 1.8, 0.1, 0.12);
      const at = [];
      for (const [ox, oy] of [[-1.05, 7.15], [-0.4, 7.15], [0.4, 7.15], [1.05, 7.15], [-0.75, 6.55], [0.75, 6.55]]) {
        g.mat([0.5, 0.6, 0.55], K.BRASS); f.box(g, x + ox, oy + 0.09, 0, 0.07, 0.16, 0.07);
        at.push(f.p(x + ox, oy + 0.18, 0));
      }
      wirePts.push(at);
    }
    {
      const P = [], Dr = [], Sd = [], I = []; let n = 0;
      for (let i = 0; i < wirePts.length - 1; i++) for (let w = 0; w < 6; w++) {
        const a = wirePts[i][w], b = wirePts[i + 1][w], NS = 8;
        for (let k = 0; k <= NS; k++) {
          const t = k / NS, sag = 0.5 * 4 * t * (1 - t);
          const x = lerp(a[0], b[0], t), y = lerp(a[1], b[1], t) - sag, z = lerp(a[2], b[2], t);
          P.push(x, y, z, x, y, z); Dr.push(b[0] - a[0], b[1] - a[1] - 0.5 * 4 * (1 - 2 * t), b[2] - a[2], b[0] - a[0], b[1] - a[1] - 0.5 * 4 * (1 - 2 * t), b[2] - a[2]); Sd.push(-1, 1);
          if (k) I.push(n - 2, n - 1, n + 1, n - 2, n + 1, n);
          n += 2;
          if ((w === 0 || w === 3) && k > 0 && k < NS && rng.chance(0.3)) perchSpots.push([x, y, z]);
        }
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setAttribute('aDir', new THREE.Float32BufferAttribute(Dr, 3));
      geo.setAttribute('aSide', new THREE.Float32BufferAttribute(Sd, 1)); geo.setIndex(I);
      add(geo, mat(WIRE_VERT, WIRE_FRAG, { transparent: true, depthWrite: false, side: THREE.DoubleSide }), 1, false);
    }

    await ctx.yield();
    // chawls: four storeys, galleries toward the line hung with washing, tile roofs, stair towers, shops below
    const occ = new Set(), cellKey = (x, z) => Math.floor(x / 8) * 4096 + Math.floor(z / 8);
    const occupy = (x, z, r) => { for (let i = -r; i <= r; i += 8) for (let j = -r; j <= r; j += 8) occ.add(cellKey(x + i, z + j)); };
    const isFree = (x, z) => !occ.has(cellKey(x, z));
    const WALLS = [[0.52, 0.45, 0.3], [0.5, 0.36, 0.2], [0.3, 0.4, 0.4], [0.5, 0.33, 0.28], [0.42, 0.42, 0.4], [0.55, 0.5, 0.38], [0.36, 0.42, 0.3]];
    const AWN = [[0.03, 0.13, 0.4], [0.4, 0.06, 0.05], [0.5, 0.36, 0.08], [0.5, 0.48, 0.4], [0.08, 0.27, 0.16], [0.42, 0.2, 0.05]];
    const WASH = [[0.62, 0.6, 0.55], [0.6, 0.58, 0.5], [0.4, 0.05, 0.06], [0.04, 0.16, 0.45], [0.55, 0.36, 0.06], [0.5, 0.2, 0.3], [0.1, 0.33, 0.2], [0.55, 0.52, 0.3], [0.3, 0.42, 0.5]];
    const laundry = [], tankSpots = [];
    const chawlList = [];
    const chawl = (g, cx, cz, yaw, L, floors, near, R = rng, lau = laundry, tks = tankSpots) => {
      const f = frame(cx, 0, cz, yaw), H = floors * 3.2, zf = 3.5, wall = R.pick(WALLS);
      chawlList.push([cx, cz, L, yaw]);
      for (let t = -L / 2; t <= L / 2; t += 7) { const p = f.p(t, 0, 0.8); occupy(p[0], p[2], 8); }
      g.mat(wall, K.CHAWL); f.box(g, 0, H / 2, 0, L, H, 7, { uv: 1 / 3.2, v0: 0, top: false });
      for (let fl = 1; fl < floors; fl++) {
        g.mat([0.3, 0.29, 0.27], K.MATTE); f.box(g, 0, fl * 3.2 - 0.08, zf + 0.8, L, 0.16, 1.6, { bottom: true });
        g.mat(C.ironPaint, K.LATTICE).quad(f.p(-L / 2, fl * 3.2, zf + 1.55), f.p(L / 2, fl * 3.2, zf + 1.55), f.p(L / 2, fl * 3.2 + 1, zf + 1.55), f.p(-L / 2, fl * 3.2 + 1, zf + 1.55), 0, 0, L / 0.5, 1);
        if (near) for (let x = -L / 2 + 0.8; x < L / 2 - 0.8; x += R.range(0.9, 2.6)) {
          if (R.chance(0.3)) continue;
          const sari = R.chance(0.14), w = sari ? 0.7 : R.range(0.5, 1.2);
          lau.push({ p: f.p(x, fl * 3.2 + 1.03, zf + 1.63), yaw, w, h: sari ? R.range(2.2, 2.9) : R.range(0.7, 1.4), col: R.pick(WASH) });
        }
        if (HR.lamp && R.chance(0.75)) { const gp = f.p(R.range(-L / 2 + 2, L / 2 - 2), fl * 3.2 + 2.4, zf + 1.3); glows.add(gp[0], gp[1], gp[2], { aColA: WARM, aColB: WARM, aSw: [2, R(), 0.5, 0] }); }
      }
      g.mat(C.wood, K.WOOD);
      const np = Math.round(L / 3.2);
      for (let i = 0; i <= np; i++) { const x = -L / 2 + i * L / np; g.strut(f.p(x, 0, zf + 1.5), f.p(x, H + 0.1, zf + 1.5), 0.15); }
      const e0 = -zf - 0.5, e1 = zf + 1.9, ry = H + 0.15, rr = H + 2.4, zr = (e0 + e1) / 2;
      g.mat(mulc(C.oxide, R.range(0.9, 1.5)), K.TILE);
      g.quad(f.p(-L / 2 - 0.4, ry, e1), f.p(L / 2 + 0.4, ry, e1), f.p(L / 2 + 0.4, rr, zr), f.p(-L / 2 - 0.4, rr, zr), 0, 0, L, 5.2);
      g.quad(f.p(L / 2 + 0.4, ry, e0), f.p(-L / 2 - 0.4, ry, e0), f.p(-L / 2 - 0.4, rr, zr), f.p(L / 2 + 0.4, rr, zr), 0, 0, L, 5.2, 0.9);
      g.mat(wall, K.MATTE);
      for (const sx of [-1, 1]) g.tri(f.p(sx * L / 2, H, -zf), f.p(sx * L / 2, H, zf), f.p(sx * L / 2, rr - 0.2, zr));
      g.mat(mulc(wall, 0.88), K.CHAWL); f.box(g, L / 2 + 1.6, (H + 2) / 2, 0.5, 3.2, H + 2, 4, { uv: 1 / 3.2, v0: 0 });
      tks.push([...f.p(L / 2 + 1.6, H + 2, 0.5), 1.25, 2.6]);
      if (near) {
        for (let i = 0; i < np; i++) {
          const x = -L / 2 + (i + 0.5) * L / np;
          if (R.chance(0.55)) g.mat(R.pick(AWN), K.MATTE).quad(f.p(x - 1.35, 2.2, zf + 2.7), f.p(x + 1.35, 2.2, zf + 2.7), f.p(x + 1.35, 2.95, zf + 1.5), f.p(x - 1.35, 2.95, zf + 1.5));
          if (R.chance(0.5)) { g.mat(C.crate, K.WOOD); f.box(g, x + R.range(-0.8, 0.8), 0.3, zf + 2.3, 0.8, 0.6, 0.6); }
          if (R.chance(0.5)) { const p = f.p(x + R.range(-1, 1), ry, e1); ropes.add(p[0], p[1], p[2], { aR: [ry - 0.3, 0.07, 0.5 + R() * 0.5, 0] }); }
        }
        if (path.nearestXZ(cx, cz).dist < 46) {               // by the line: people out on the galleries, chimney pots smoking on the ridge
          for (let fl = 1; fl < floors; fl++) for (let k = 0; k < 2; k++) if (r13Gal.chance(0.55)) galFolk.push([...f.p(r13Gal.range(-L / 2 + 1.5, L / 2 - 1.5), fl * 3.2, zf + 0.95), yaw]);
          for (const sxp of [-0.3, 0.28]) if (r13Pot.chance(0.75)) {
            const px = sxp * L + r13Pot.range(-1, 1), pp = f.p(px, rr, zr);
            g.mat(mulc(brick, 0.9), K.BRICK); f.box(g, px, rr + 0.25, zr, 0.7, 1.1, 0.7, { v0: 0 });
            g.mat([0.4, 0.17, 0.09], K.MATTE).lathe(pp[0], rr + 0.8, pp[2], [[0.16, 0], [0.12, 0.45], [0.15, 0.5]], 6);
            potSpots.push([pp[0], rr + 1.35, pp[2]]);
          }
        }
      }
    };
    const gNearChawl = (near) => (near ? gNear : gFar);
    // the entry's right-hand side, composed: a chawl whose washing hangs at eye level 20 m from the door, a second
    // beyond it, flat-roofed godowns under tarpaulins with tanks on their roofs, and tall tanks on stilts by the parapet
    const entryTarps = [];
    {
      for (const [z, lat, L] of [[672, 22.5, 30], [598, 21.5, 22]]) { const q = stAt(z); chawl(gNear, q.x + lat * q.rx, q.z + lat * q.rz, Math.atan2(-q.rx, -q.rz), L, 4, true); }
      for (const [z, lat, w, dp, fl] of [[703, 16.5, 8, 7, 3], [572, 16, 8, 7, 3], [552, 17.5, 7.5, 6, 4]]) {      // (the chowk stands between the first and the second)
        const q = stAt(z), cx = q.x + lat * q.rx, cz = q.z + lat * q.rz, yaw = yawAt(z) + rng.range(-0.08, 0.08), f = frame(cx, 0, cz, yaw), H = fl * 3.2 + 0.5;
        occupy(cx, cz, 8);
        gNear.mat(rng.pick(WALLS), K.CHAWL); f.box(gNear, 0, H / 2, 0, w, H, dp, { uv: 1 / 3.2, v0: 0 });
        gNear.mat(stoneC, K.STONE); f.box(gNear, 0, H + 0.12, 0, w + 0.3, 0.24, dp + 0.3, { top: false });
        gNear.mat(C.wood, K.WOOD); f.box(gNear, -w / 2 + 1.1, H + 0.95, dp / 2 - 1, 1.6, 1.9, 1.5);
        entryTarps.push([cx, H + 0.34, cz, yaw, w * 0.74, dp * 0.74]);
        tankSpots.push([...f.p(w * 0.22, H, -dp * 0.2), 0.95, 3.3]);
        rope(...f.p(-w / 2 - 0.06, H, dp * 0.25), H - 0.4, 0.08, true);
      }
      for (const [z, lat, hgt, r] of [[688, 13.4, 11.6, 1.35], [659, 13.1, 12.6, 1.5], [614, 13.6, 11.2, 1.3], [585, 13.2, 12.2, 1.4]]) {
        const q = stAt(z), cx = q.x + lat * q.rx, cz = q.z + lat * q.rz;
        occupy(cx, cz, 4); tankSpots.push([cx, 0, cz, r, hgt]);
      }
    }
    await ctx.yield();
    for (const side of [-1, 1]) {
      for (let z = 826; z > 322;) {
        const L = rng.range(18, 34), q = stAt(z - L / 2), lat = side * (19.8 + rng.range(0, 7));
        const cx = q.x + lat * q.rx, cz = q.z + lat * q.rz, clash = side > 0 && z > 536 && z - L < 716;
        if (rng.chance(0.62) && !clash && Math.abs(flyW(cx, cz)) > L / 2 + 9) chawl(gNear, cx, cz, Math.atan2(-side * q.rx, -side * q.rz), L, rng.chance(0.75) ? 4 : 3, true);
        z -= L + rng.range(8, 34);
      }
    }
    for (let z = 268; z > -110;) { const L = rng.range(20, 32); if (rng.chance(0.8)) chawl(gThroat, -88 - rng.range(0, 5), z - L / 2, Math.PI / 2, L, 4, z > 30); z -= L + rng.range(6, 26); }
    for (let z = 250; z > -90;) { const L = rng.range(18, 28); if (rng.chance(0.55)) chawl(gThroat, 64 + rng.range(0, 6), z - L / 2, -Math.PI / 2, L, rng.chance(0.5) ? 4 : 3, z > 30); z -= L + rng.range(14, 50); }
    for (let i = 0; i < 16; i++) {
      const z = rng.range(-150, 800), q = z > 300 ? stAt(z) : { x: z > -146 ? (rng.chance(0.5) ? -75 : 50) : 0, z, rx: 1, rz: 0 }, side = rng.chance(0.5) ? -1 : 1;
      const lat = side * rng.range(z > 300 ? 46 : 60, 150), cx = q.x + lat * q.rx + (z > 300 || z < -146 ? 0 : side * 30), cz = q.z + lat * q.rz;
      if (Math.abs(flyW(cx, cz)) < 30 || (cx > -110 && cx < 85 && cz < 310)) continue;
      chawl(gNearChawl(false), cx, cz, rng.range(0, TAU), rng.range(18, 30), rng.chance(0.6) ? 4 : 3, false);
    }
    await ctx.yield();

    await ctx.yield();
    // handcarts and a tonga under a sheet, drawn up on the yard side of the throat where the line comes down to the ground
    const cartSpots = [];
    {
      const g = gThroat, SHEETS = [[0.03, 0.15, 0.5], [0.3, 0.32, 0.33], [0.05, 0.25, 0.15], [0.4, 0.33, 0.2]];
      const disc = (f, x, cy, cz, r, n) => { for (let i = 0; i < n; i++) { const a0 = i / n * TAU, a1 = (i + 1) / n * TAU; g.tri(f.p(x, cy, cz), f.p(x, cy + Math.sin(a0) * r, cz + Math.cos(a0) * r), f.p(x, cy + Math.sin(a1) * r, cz + Math.cos(a1) * r), [0.5, 0.5], [0, 0], [1, 0], 0.7 + 0.3 * (i % 2)); } };
      const handcart = (x, z, yaw) => {
        const f = frame(x, 0, z, yaw);
        g.mat(C.wood, K.WOOD); f.box(g, 0, 0.82, 0, 1.15, 0.08, 2.3);
        for (const sx of [-1, 1]) { g.mat([0.13, 0.09, 0.06], K.WOOD); disc(f, sx * 0.66, 0.56, 0.1, 0.56, 10); g.mat(C.wood, K.WOOD).strut(f.p(sx * 0.45, 0.84, 1.15), f.p(sx * 0.45, 0.95, 2.5), 0.06); }
        g.strut(f.p(0, 0.8, -1.0), f.p(0, 0, -1.0), 0.07);
        g.mat(xr.pick([[0.4, 0.33, 0.2], [0.3, 0.22, 0.13], [0.36, 0.3, 0.22]]), K.MATTE); f.box(g, 0, 1.08, -0.1, 0.95, 0.44, 1.7);
        g.mat(xr.pick(SHEETS), K.MATTE); f.box(g, 0.02, 1.34, -0.2, 1.05, 0.1, 1.5);
        cartSpots.push(f.p(1.2, 0, 0.6));
      };
      const tonga = (x, z, yaw) => {
        const f = frame(x, 0, z, yaw);
        for (const sx of [-1, 1]) { g.mat([0.3, 0.06, 0.04], K.WOOD); disc(f, sx * 0.8, 0.72, 0, 0.72, 12); g.mat(C.wood, K.WOOD).strut(f.p(sx * 0.5, 0.95, 0.8), f.p(sx * 0.5, 0.12, 3.1), 0.07); }
        g.mat(C.wood, K.WOOD); f.box(g, 0, 1.0, 0, 1.35, 0.5, 1.7);
        g.mat([0.3, 0.31, 0.33], K.MATTE);                    // the sheet: a ridge over the hood, falling to the sides
        g.quad(f.p(-0.85, 1.15, 1.0), f.p(-0.85, 1.15, -1.0), f.p(0, 2.3, -0.9), f.p(0, 2.3, 0.9), 0, 0, 2, 1.3);
        g.quad(f.p(0.85, 1.15, -1.0), f.p(0.85, 1.15, 1.0), f.p(0, 2.3, 0.9), f.p(0, 2.3, -0.9), 0, 0, 2, 1.3, 0.85);
        g.tri(f.p(-0.85, 1.15, 1.0), f.p(0.85, 1.15, 1.0), f.p(0, 2.3, 0.9)); g.tri(f.p(0.85, 1.15, -1.0), f.p(-0.85, 1.15, -1.0), f.p(0, 2.3, -0.9));
        cartSpots.push(f.p(-1.4, 0, 0.3));
      };
      handcart(31.5, 284, 0.25); tonga(34.5, 273, -0.2); handcart(30.5, 262, -0.5); handcart(38, 236, 0.4);
    }

    // mills with saw-tooth roofs and their chimneys; more chimneys far off
    const chimneys = [];
    const chimney = (g, x, z, Hc, r) => {
      g.mat(mulc(brick, rng.range(0.8, 1.15)), K.BRICK).lathe(x, 0, z, [[r, 0], [r * 0.64, Hc * 0.965], [r * 0.78, Hc * 0.975], [r * 0.78, Hc], [r * 0.55, Hc]], 10);
      chimneys.push([x, Hc, z]); occupy(x, z, 4);
    };
    for (let i = 0; i < 9; i++) {
      const rightSide = i < 6, lat = (rightSide ? 1 : -1) * rng.range(110, 430), z = rightSide ? 60 + i * 95 + rng.range(-30, 30) : rng.range(120, 700);
      const cx = pathX(Math.max(z, 260)) + lat + (z < 300 ? (rightSide ? 50 : -75) : 0), cz = z;
      if (Math.abs(flyW(cx, cz)) < 40) continue;
      const L = rng.range(46, 78), W = rng.range(20, 30), H = rng.range(9, 13), yaw = rng.range(-0.5, 0.5), f = frame(cx, 0, cz, yaw), g = gFar;
      for (let a = -L / 2; a <= L / 2; a += 8) for (let b = -W / 2; b <= W / 2; b += 8) { const p = f.p(a, 0, b); occupy(p[0], p[2], 6); }
      g.mat(mulc(brick, rng.range(0.85, 1.2)), K.CHAWL); f.box(g, 0, H / 2, 0, L, H, W, { uv: 1 / 3.6, v0: 0, top: false });
      const nt = Math.round(L / 7), tw = L / nt;
      for (let k = 0; k < nt; k++) {
        const x0 = -L / 2 + k * tw, x1 = x0 + tw;
        g.mat(C.tin, K.CORR).quad(f.p(x0, H, W / 2), f.p(x1, H + 3, W / 2), f.p(x1, H + 3, -W / 2), f.p(x0, H, -W / 2), 0, 0, tw, W);
        g.mat(C.glass, K.GLASS).quad(f.p(x1, H, -W / 2), f.p(x1, H, W / 2), f.p(x1, H + 3, W / 2), f.p(x1, H + 3, -W / 2), 0, 0, W, 3);
      }
      const cp = f.p(L / 2 + 7, 0, rng.range(-W / 3, W / 3));
      chimney(g, cp[0], cp[2], rng.range(36, 56), rng.range(2, 2.7));
      tankSpots.push([...f.p(-L / 2 - 3, 0, 0), 1.8, 14]);
    }
    for (let i = 0; i < 8; i++) { const a = rng.range(0, TAU), r = rng.range(750, 1500); chimney(gFar, 60 + Math.cos(a) * r, 300 + Math.sin(a) * r, rng.range(40, 62), rng.range(2.4, 3.2)); }
    await ctx.yield();

    // ---- the chowk: a bazaar square in the gap after the first chawl, 30 to 75 m right of the door and seen over the open
    // railing from u 0.06 to 0.12: rows of stalls under awnings that balloon in the gust, lamps lit against the coming dark,
    // umbrellas opening in a wave, handcarts on the move, a banyan in the middle. Then the signal cabin on stilts by the
    // railing, a second banyan further on, and the furniture of the deck itself.
    const tf = (z) => frame(pathX(z), 0, z, yawAt(z));       // p(lateral, y, back along the line)
    const baz = { awn: [], folk: [], carts: [], trees: [], flags: [] };
    const glowN = (p, c, size) => glows.add(p[0], p[1], p[2], { aColA: c, aColB: c, aSw: [2, nr(), size, 0] });
    {
      const g = gNear, zA = 613, zB = 653;
      let latMax = 80;                                        // a far chawl or a mill may have taken part of the ground: stop short of it
      for (let lat = 36; lat <= 80 && latMax === 80; lat += 4) for (let z = 622; z <= 646; z += 4) { const p = tf(z).p(lat, 0, 0); if (occ.has(cellKey(p[0], p[2]))) { latMax = lat - 5; break; } }
      for (let lat = 14; lat <= latMax + 2; lat += 4) for (let z = zA - 2; z <= zB + 2; z += 4) { const p = tf(z).p(lat, 0, 0); occ.add(cellKey(p[0], p[2])); }
      const rows = [34, 44, 54, 64, 74].filter((l) => l + 3 < latMax);
      const GOODS = [[0.75, 0.4, 0.03], [0.5, 0.05, 0.03], [0.1, 0.3, 0.08], [0.6, 0.55, 0.4], [0.35, 0.08, 0.3], [0.7, 0.65, 0.5], [0.8, 0.55, 0.1]];
      const treeOK = rows.includes(54);
      for (const lat of rows) for (let z = zA + 2; z <= zB - 2; z += 5.2) {
        const skip = nr.chance(0.2), zz = z + nr.range(-0.6, 0.6), w = nr.range(2.6, 3.6), dp = nr.range(2.2, 3), ht = nr.range(2.5, 3.1), la = lat + nr.range(-0.8, 0.8);
        if (skip || (treeOK && Math.abs(lat - 54) < 6 && Math.abs(z - 634) < 8)) continue;
        const f = tf(zz);
        g.mat(C.wood, K.WOOD);
        for (const [px, pz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) g.strut(f.p(la + px * dp * 0.45, 0, pz * w * 0.45), f.p(la + px * dp * 0.45, ht, pz * w * 0.45), 0.09);
        g.mat(mulc(C.crate, nr.range(0.8, 1.3)), K.WOOD); f.box(g, la, 0.45, 0, dp * 0.7, 0.9, w * 0.8);
        g.mat(nr.pick(GOODS), K.MATTE); f.box(g, la, 1.0, 0, dp * 0.6, 0.22, w * 0.7);
        if (nr.chance(0.5)) { g.mat(nr.pick(GOODS), K.MATTE); f.box(g, la - dp * 0.55, 0.3, nr.range(-0.8, 0.8), 0.7, 0.6, 0.8); }
        baz.awn.push([f.p(la, ht + 0.02, 0), yawAt(zz), dp * 1.3, w * 1.15, mulc(nr.pick(AWN), nr.range(1.3, 2.2))]);
        glowN(f.p(la - dp * 0.62, ht - 0.4, nr.range(-0.6, 0.6)), WARM, 0.5);
      }
      if (rows.length) {
        for (let i = 0; i < 22; i++) {                        // umbrellas: shut until the first drops, then opening in a wave across the square
          const lat = nr.pick(rows) + 5 + nr.range(-1.3, 1.3), z = nr.range(zA + 1, zB - 1), p = tf(z).p(lat, 0, 0);
          baz.folk.push([p[0], p[2], -(0.058 + 0.05 * ((zB - z) / (zB - zA) * 0.6 + (lat - 34) / 50 * 0.4) + nr.range(0, 0.008))]);
        }
        for (let i = 0; i < 3; i++) baz.carts.push({ lat: rows[Math.min(i, rows.length - 1)] + 5.2, z0: zB - 4 - i * 9 - nr.range(0, 4), v: nr.range(1.3, 1.9) });
        for (let z = zA + 3; z <= zB; z += 13) {              // lamp standards along the square's edges, lines of pennants strung between them
          const f = tf(z + nr.range(-2, 2)), la0 = 30, la1 = latMax - 1;
          for (const lat of [la0, la1]) {
            g.mat(C.iron, K.IRON).strut(f.p(lat, 0, 0), f.p(lat, 5.3, 0), 0.12); f.box(g, lat, 4.7, 0, 0.34, 0.3, 0.34);
            glowN(f.p(lat, 4.55, 0), WARM, 0.7);
          }
          for (let lat = la0 + 0.9; lat < la1 - 0.5; lat += 1.45) { const t = (lat - la0) / (la1 - la0); baz.flags.push([f.p(lat, 5.25 - 3.2 * t * (1 - t), 0), yawAt(z), nr.range(0.45, 0.7), nr.range(0.6, 0.95), mulc(nr.pick(WASH), nr.range(1, 1.5))]); }
        }
        if (treeOK) { const p = tf(634).p(54, 0, 0); baz.trees.push([p[0], p[2], 1.55, 0.72]); g.mat([0.36, 0.34, 0.3], K.STONE).lathe(p[0], 0, p[2], [[2.6, 0], [2.6, 0.5], [2.2, 0.5]], 10); }
      }
      { const p = tf(487).p(38, 0, 0); occupy(p[0], p[2], 8); baz.trees.push([p[0], p[2], 1.25, 0.52]); }
    }
    await ctx.yield();
    {                                                         // the signal cabin on stilts, its windows lit, hard by the railing
      const f = tf(646), g = gNear, la = 13.3, fy = 8.3, by = fy + 0.16;
      g.mat(C.iron, K.IRON);
      for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) g.strut(f.p(la + sx * 1.3, 0, sz * 3), f.p(la + sx * 1.3, fy, sz * 3), 0.24);
      for (const sx of [-1, 1]) for (let k = 0; k < 2; k++) { g.strut(f.p(la + sx * 1.3, k * 4, -3), f.p(la + sx * 1.3, k * 4 + 4, 3), 0.1); g.strut(f.p(la + sx * 1.3, k * 4, 3), f.p(la + sx * 1.3, k * 4 + 4, -3), 0.1); }
      for (const sz of [-1, 1]) { g.strut(f.p(la - 1.3, 0.6, sz * 3), f.p(la + 1.3, 7.8, sz * 3), 0.1); g.strut(f.p(la + 1.3, 0.6, sz * 3), f.p(la - 1.3, 7.8, sz * 3), 0.1); g.strut(f.p(la - 1.3, 4, sz * 3), f.p(la + 1.3, 4, sz * 3), 0.12); }
      g.mat(C.wood, K.WOOD); f.box(g, la, fy + 0.08, 0, 4.4, 0.16, 8.4, { bottom: true });
      g.mat(C.creamPaint, K.WOOD); f.box(g, la, by + 0.55, 0, 3.0, 1.1, 6.8, { top: false });
      g.mat([0.27, 0.15, 0.05], K.GLOW);                      // the lit panes, all the way round
      f.box(g, la, by + 1.85, 0, 2.9, 1.5, 6.7, { top: false });
      g.mat(C.maroon, K.WOOD);
      for (const sx of [-1, 1]) for (let z = -3.4; z <= 3.41; z += 0.85) f.box(g, la + sx * 1.5, by + 1.85, z, 0.09, 1.5, 0.09, { top: false });
      for (const sz of [-1, 1]) for (let x = -1.5; x <= 1.51; x += 0.75) f.box(g, la + x, by + 1.85, sz * 3.4, 0.09, 1.5, 0.09, { top: false });
      f.box(g, la, by + 1.1, 0, 3.12, 0.1, 6.92, { top: false }); f.box(g, la, by + 2.66, 0, 3.12, 0.14, 6.92);
      for (const [x, z, h] of [[0.4, 1.2, 1.68], [-0.5, -1.6, 1.6]]) {                   // the signalmen, dark against the lamps
        g.mat([0.02, 0.02, 0.025], K.MATTE).lathe(...f.p(la + 1.56 * (x > 0 ? 1 : -1), by, z), [[0.17, 0], [0.2, 0.75 * h], [0.23, 0.82 * h], [0.08, 0.88 * h], [0.1, 0.94 * h], [0.02, h]], 7, { sx: 0.5 });
      }
      const ey = by + 2.72, rdg = by + 3.95;
      g.mat(mulc(C.oxide, 1.3), K.TILE);
      g.quad(f.p(la + 2.2, ey, 4.1), f.p(la + 2.2, ey, -4.1), f.p(la, rdg, -2.2), f.p(la, rdg, 2.2), 0, 0, 8.2, 2.8);
      g.quad(f.p(la - 2.2, ey, -4.1), f.p(la - 2.2, ey, 4.1), f.p(la, rdg, 2.2), f.p(la, rdg, -2.2), 0, 0, 8.2, 2.8, 0.85);
      g.tri(f.p(la - 2.2, ey, 4.1), f.p(la + 2.2, ey, 4.1), f.p(la, rdg, 2.2), [0, 0], [4.4, 0], [2.2, 2.4], 0.92);
      g.tri(f.p(la + 2.2, ey, -4.1), f.p(la - 2.2, ey, -4.1), f.p(la, rdg, -2.2), [0, 0], [4.4, 0], [2.2, 2.4], 0.78);
      g.mat(C.iron, K.IRON).strut(f.p(la, rdg, 2.2), f.p(la, rdg + 0.9, 2.2), 0.07);
      g.mat(C.ironPaint, K.RAIL);                             // walkway railing and the stair down to the cess
      for (const sx of [-1, 1]) g.quad(f.p(la + sx * 2.15, fy + 0.16, -4.15), f.p(la + sx * 2.15, fy + 0.16, 4.15), f.p(la + sx * 2.15, fy + 1.2, 4.15), f.p(la + sx * 2.15, fy + 1.2, -4.15), 0, 0, 5.2, 1);
      g.quad(f.p(la - 2.15, fy + 0.16, 4.15), f.p(la + 2.15, fy + 0.16, 4.15), f.p(la + 2.15, fy + 1.2, 4.15), f.p(la - 2.15, fy + 1.2, 4.15), 0, 0, 2.7, 1);
      glowN(f.p(la, by + 2.2, 1.6), WARM, 0.6); glowN(f.p(la, by + 2.2, -1.6), WARM, 0.6);
      ropes.add(...f.p(la + 2.2, ey, 3.9), { aR: [6, 0.05, nr() * 0.5, 0] });
    }
    {                                                         // the deck's own furniture: a platelayers' hut, lever frames, spare sleepers, a white post
      const g = gNear, dk = (s0) => { const z = zOfS(s0); return frame(pathX(z), railY(z), z, yawAt(z)); };
      let f = dk(78);
      g.mat([0.13, 0.1, 0.075], K.WOOD); f.box(g, -9.3, 1.1, 0, 1.4, 2.2, 3.0, { top: false });
      g.mat(C.tin, K.CORR).quad(f.p(-10.1, 2.2, 1.7), f.p(-8.5, 2.55, 1.7), f.p(-8.5, 2.55, -1.7), f.p(-10.1, 2.2, -1.7), 0, 0, 1.7, 3.4);
      g.mat([0.05, 0.04, 0.035], K.MATTE); f.box(g, -8.59, 0.95, 0.5, 0.03, 1.8, 0.8, { top: false });
      g.mat([0.25, 0.14, 0.05], K.GLOW); f.box(g, -8.59, 1.55, -0.75, 0.03, 0.45, 0.5, { top: false });
      g.mat(C.iron, K.IRON).strut(f.p(-9.7, 2.3, -1.0), f.p(-9.7, 3.2, -1.0), 0.14);
      g.mat([0.5, 0.05, 0.04], K.MATTE); for (let i = 0; i < 3; i++) g.lathe(...f.p(-8.48, 1.25, 1.2 - i * 0.3), [[0.07, 0], [0.11, 0.24]], 6);
      glowN(f.p(-8.45, 1.6, -0.75), WARM, 0.4);
      baz.flue = f.p(-9.7, 3.3, -1.0);
      baz.hut = [f.p(-8.9, 0, 2.6), f.p(-9.0, 0, -2.5)];
      f = dk(132);                                            // spare sleepers, stacked crosswise
      for (let l = 0; l < 4; l++) for (let k = 0; k < 3; k++) { g.mat(mulc(C.sleeper, 1.2 + 0.25 * ((l + k) % 3)), K.WOOD); if (l % 2) f.box(g, -9.35 + (k - 1) * 0.42, 0.13 + l * 0.26, 0, 0.26, 0.24, 2.5); else f.box(g, -9.35, 0.13 + l * 0.26, (k - 1) * 0.9, 1.3, 0.24, 0.26); }
      for (const [s0, lat] of [[46, 8.9], [196, 8.9], [262, 8.9]]) {       // ground frames: two levers on a plate, on the cess (clear of the 6 m beside our doorway's line)
        f = dk(s0);
        g.mat(C.iron, K.IRON); f.box(g, lat, 0.26, 0, 0.36, 0.12, 1.0);
        g.mat([0.5, 0.05, 0.04], K.MATTE).strut(f.p(lat, 0.3, -0.25), f.p(lat, 1.25, -0.5), 0.06);
        g.mat([0.05, 0.1, 0.4], K.MATTE).strut(f.p(lat, 0.3, 0.25), f.p(lat, 1.25, 0.42), 0.06);
        g.mat(C.brass, K.BRASS).box(...f.p(lat, 1.3, -0.52), 0.07, 0.12, 0.07).box(...f.p(lat, 1.3, 0.44), 0.07, 0.12, 0.07);
      }
      for (const s0 of [30, 110, 228]) { f = dk(s0); g.mat(C.cream, K.MATTE); f.box(g, 9.55, 0.6, 0, 0.14, 1.2, 0.14); g.mat([0.03, 0.03, 0.035], K.MATTE); f.box(g, 9.55, 1.26, 0, 0.5, 0.14, 0.06); }
    }

    // the open ground of the yard: the x of the last road (or siding) at z, and a place clear of it
    const yardRM = (z) => { let m = -1e9; A.tracks.forEach((t, r) => { if (t.end < z + 3 && t.from > z - 3) m = Math.max(m, A.trackXAt(r, z)); }); return m; };
    const yardX = (z) => Math.max(12.6, yardRM(z - 4) + 3.4, yardRM(z) + 3.4, yardRM(z + 4) + 3.4);
    // ---- round thirteen's cast for the lineside and the yard: a bracket signal, water columns, people standing clear
    // a signal on a lattice post with a landing carried out toward the line: dolls = [[x offset, height, arm off?], ...]
    const folk13 = [], yard13 = [];
    const sigPost = (g, f, x, H, dolls, deckY) => {
      const w0 = 0.3, w1 = 0.14, wAt = (y) => lerp(w0, w1, y / H), dy = (H - 0.3) / 10;
      g.mat(C.stoneDark, K.STONE); f.box(g, x, 0.15, 0, 1.0, 0.3, 1.0, { v0: 0 });
      g.mat(C.cream, K.IRON);
      for (const [ox, oz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) g.strut(f.p(x + ox * w0, 0.3, oz * w0), f.p(x + ox * w1, H, oz * w1), 0.07);
      g.mat(C.iron, K.IRON);
      for (let k = 0; k < 10; k++) {
        const ya = 0.3 + k * dy, yb = ya + dy, sa = k % 2 ? 1 : -1;
        for (const oz of [-1, 1]) g.strut(f.p(x - sa * wAt(ya), ya, oz * wAt(ya)), f.p(x + sa * wAt(yb), yb, oz * wAt(yb)), 0.035);
        for (const ox of [-1, 1]) g.strut(f.p(x + ox * wAt(ya), ya, -sa * wAt(ya)), f.p(x + ox * wAt(yb), yb, sa * wAt(yb)), 0.035);
      }
      let x0 = x - 0.5, x1 = x + 0.5; for (const d of dolls) { x0 = Math.min(x0, x + d[0] - 0.45); x1 = Math.max(x1, x + d[0] + 0.65); }
      g.mat(C.wood, K.WOOD); f.box(g, (x0 + x1) / 2, H + 0.05, 0, x1 - x0, 0.08, 0.9, { bottom: true });
      g.mat(C.iron, K.IRON).strut(f.p(x0, H - 0.06, 0), f.p(x1, H - 0.06, 0), 0.14, 0.16);
      g.mat(C.ironPaint, K.RAIL).quad(f.p(x0, H + 0.1, -0.45), f.p(x1, H + 0.1, -0.45), f.p(x1, H + 1.1, -0.45), f.p(x0, H + 1.1, -0.45), 0, 0, (x1 - x0) / 1.6, 1);
      g.mat(C.iron, K.LATTICE).quad(f.p(x + 0.14, 0.3, -0.46), f.p(x + 0.14, H, -0.46), f.p(x - 0.14, H, -0.46), f.p(x - 0.14, 0.3, -0.46), 0, 0, Math.round(H * 2.8), 1);     // the ladder up the back
      for (const [dx, hd, off] of dolls) {
        const xd = x + dx, py = H + hd - 0.6, col = off ? GREEN : RED;
        g.mat(C.cream, K.IRON).strut(f.p(xd, H, 0), f.p(xd, H + hd, 0), 0.15);
        g.mat(C.iron, K.IRON).lathe(...f.p(xd, H + hd, 0), [[0.11, 0], [0.03, 0.3], [0.004, 0.5]], 5);
        g.mat([0.62, 0.05, 0.04], K.MATTE).strut(f.p(xd - 0.1, py, 0.2), f.p(xd - 1.45, py - (off ? 0.9 : 0), 0.2), 0.04, 0.27);
        g.mat([0.75, 0.73, 0.68], K.MATTE).strut(f.p(xd - 1.0, py - (off ? 0.6 : 0), 0.226), f.p(xd - 1.16, py - (off ? 0.7 : 0), 0.226), 0.03, 0.27);
        g.mat(C.iron, K.IRON).strut(f.p(xd + 0.05, py - 0.1, 0.18), f.p(xd + 0.55, py - 0.1, 0.18), 0.04, 0.46);
        const lp = f.p(xd + 0.42, py, 0.3);
        glows.add(lp[0], lp[1], lp[2], { aColA: col, aColB: col, aSw: [2, r13Sig(), 0.5, 0] });
        glows.add(lp[0], lp[1], lp[2], { aColA: col, aColB: col, aSw: [2, r13Sig(), 0.66, 1 + deckY] });
      }
    };
    // a water crane: a cast column, its arm (CRANE_ARM long) swung out over the nearest line, a leather bag (CRANE_BAG in
    // radius at its widest) that drips
    const CRANE_ARM = 2.3, CRANE_BAG = 0.17;
    const crane = (g, f, x, deckY, wy) => {
      g.mat(C.stoneDark, K.STONE); f.box(g, x, 0.12, 0, 1.1, 0.24, 1.1, { v0: 0 });
      g.mat(C.maroon, K.IRON).lathe(...f.p(x, 0.24, 0), [[0.36, 0], [0.36, 0.25], [0.24, 0.45], [0.2, 1.4], [0.24, 1.5], [0.19, 1.6], [0.17, 4.0], [0.26, 4.1], [0.26, 4.3], [0.1, 4.55]], 8);
      g.mat(C.iron, K.IRON).strut(f.p(x, 4.3, 0), f.p(x - CRANE_ARM, 4.45, 0), 0.22);
      g.strut(f.p(x, 3.3, 0), f.p(x - 1.4, 4.36, 0), 0.07);
      g.lathe(...f.p(x + 0.42, 1.3, 0), [[0.02, 0], [0.24, 0.02], [0.24, 0.07], [0.02, 0.09]], 8);
      g.mat(C.leather, K.MATTE).lathe(...f.p(x - CRANE_ARM, 2.55, 0), [[0.07, 0], [0.11, 0.5], [CRANE_BAG, 1.3], [0.15, 1.8]], 6);
      for (let i = 0; i < 3; i++) { const q = f.p(x - CRANE_ARM + (i - 1) * 0.05, 2.55, (i - 1) * 0.04); ropes.add(q[0], q[1] + wy, q[2], { aR: [2.3, 0.02, 0.5 + r13Sig() * 0.5, 0] }); }
      return f.p(x - CRANE_ARM, 0, 0);
    };
    {
      // The viaduct's lineside, placed by the railway and the seed (forks of the stream cl-r17), on the cess either side: everything here
      // stands 8.9 m and more from the line of our doorway (nothing solid within 6 m of it).
      const g = gNear, dk = (s0) => { const z = zOfS(s0); return frame(pathX(z), railY(z), z, yawAt(z)); };
      const dkL = (s0) => { const z = zOfS(s0); return frame(pathX(z), railY(z), z, yawAt(z) + Math.PI); };      // the same turned about, for what stands on the left cess
      // what already stands on each cess: [metres in, side, half length]
      const taken = [[150, 1, 2.5], [150, -1, 2.5], [78, -1, 6], [132, -1, 3], [100, -1, 2], [282, -1, 2], [(HALT0 + HALT1) / 2, -1, (HALT1 - HALT0) / 2 + 7]];
      for (let s0 = -88; s0 < 440; s0 += SPAN) taken.push([s0, 1, 1.2]);              // telegraph poles
      for (const s0 of [30, 110, 228, 32, 46, 93, 196, 262]) taken.push([s0, 1, 2]);   // white posts, ground frames, point levers
      const free = (s0, side, half) => !taken.some((t) => t[1] === side && Math.abs(t[0] - s0) < t[2] + half);
      // the signal bridge's outer signal: a bracket post one or two telegraph spans short of the bridge, as the seed has it
      let sSig = 150 - SPAN * r17Sig.int(1, 2);
      while (!free(sSig, 1, 1.5)) sSig += 1.5;
      sigPost(g, dk(sSig), 9.7, 7.4, [[-1.6, 3.1, true], [-0.1, 2.3, false]], railY(zOfS(sSig)));      // two dolls, one arm off
      taken.push([sSig, 1, 3]);
      // The water column: on the cess of the far line at the country end of the halt, as near the platform as it can
      // stand. (Abreast of the tender of the local as it waits, 207 to 213 m in, there is no cess: the platform and its
      // canopy stand there.) Its arm rests along the line toward the halt, so the column stands the arm's length and the
      // bag's radius short of the foot of the ramp; an engine draws forward to it. The fireman waits by it.
      const sCol = HALT0 - HALT_RAMP - CRANE_ARM - CRANE_BAG, zCol = zOfS(sCol), cb = dkL(sCol).p(9.1, 0, 0);
      crane(g, frame(cb[0], cb[1], cb[2], yawAt(zCol) - Math.PI / 2), 0, railY(zCol), 0);
      { const q = dkL(sCol - 1.6).p(9.65, 0, 0); folk13.push([q[0], q[1], q[2], -1.5]); }
      taken.push([sCol, -1, 4.5]);
      // people on the cess along the whole viaduct, 26 to 48 m apart, on either side as the seed has it (on the other side
      // where that one is taken, and a little further on where both are): one in four of the places holds a gang of three
      // standing clear with their hand lamp set down, the others one figure with an umbrella
      for (let s0 = r17Folk.range(6, 30); s0 < 330;) {
        const gang = r17Folk.chance(0.25), half = gang ? 5 : 1;
        let side = r17Folk.chance(0.5) ? 1 : -1;
        while (s0 < 330 && !free(s0, side, half) && !free(s0, -side, half)) s0 += 2;
        if (s0 >= 330) break;
        if (!free(s0, side, half)) side = -side;
        const lat = side > 0 ? r17Folk.range(8.9, 9.3) : -r17Folk.range(9.0, 9.5);
        if (gang) {
          for (const ds of [-3.5, 0, 3.4]) { const q = dk(s0 + ds).p(lat + r17Folk.range(-0.1, 0.1), 0, 0); folk13.push([q[0], q[1], q[2], -(uFront - 0.05 + r17Folk.range(0, 0.04))]); }
          const f = dk(s0 + 1.7), lp = f.p(lat, 0.32, 0);
          g.mat(C.iron, K.IRON); f.box(g, lat, 0.16, 0, 0.16, 0.3, 0.16); g.mat([0.5, 0.3, 0.1], K.GLOW); f.box(g, lat, 0.25, 0, 0.11, 0.12, 0.11, { top: false });
          glows.add(lp[0], lp[1], lp[2], { aColA: WARM, aColB: WARM, aSw: [2, r17Folk(), 0.3, 0] });
          glows.add(lp[0], lp[1], lp[2], { aColA: WARM, aColB: WARM, aSw: [2, r17Folk(), 0.4, 1 + railY(zOfS(s0 + 1.7))] });
        } else { const q = dk(s0).p(lat, 0, 0); folk13.push([q[0], q[1], q[2], r17Folk.chance(0.5) ? 2 : -(uFront - 0.05 + r17Folk.range(0, 0.04))]); }
        taken.push([s0, side, half]);
        s0 += r17Folk.range(26, 48) + (gang ? 8 : 0);
      }
    }
    {
      // The yard's lineside, placed by the lie of its roads (each seed fans them differently). The last road is the outermost
      // siding on our right. Its starting signal stands at its fouling point (where it first runs 3.4 m clear of every
      // other road), on the outside, facing the buffers; the water column stands where an engine held at that signal has its
      // tender, 10 m in rear, with its arm at rest along the road and the fireman by it; the pointsman stands by the ground
      // disc and lever at the toe of that road's points, spare timbers beside them; a third man walks the cess between.
      const g = gThroat;
      let rL = -1; A.tracks.forEach((t, r) => { if (t.siding && t.x > 0 && (rL < 0 || t.x > A.tracks[rL].x)) rL = r; });
      const tL = A.tracks[rL], xL = (z) => A.trackXAt(rL, z), zT = tL.from - 2;
      let zF = tL.from; while (zF > tL.end + 30 && A.tracks.some((t, r) => r !== rL && t.end < zF && t.from > zF && Math.abs(A.trackXAt(r, zF) - xL(zF)) < 3.4)) zF -= 0.5;
      sigPost(g, frame(xL(zF) + 2.9, 0, zF, Math.PI), 0, 6.4, [[-0.2, 2.6, false]], 0);
      const zC = zF - 10, bag = crane(g, frame(xL(zC) + 2.9, 0, zC, Math.PI / 2), 0, 0, 0);
      const xD = yardRM(zT) + 2.05, zM = (zT + zF) / 2;
      yard13.push([xL(zC) + 3.6, 0, zC - 1.3, -1.5], [xD + 0.7, 0, zT - 0.8, 2], [yardX(zM) + 0.3, 0, zM, -1.5]);
      g.mat(C.iron, K.IRON).box(xD, 0.3, zT, 0.12, 0.6, 0.12);
      g.mat([0.8, 0.78, 0.72], K.MATTE).box(xD, 0.72, zT + 0.07, 0.4, 0.4, 0.04);
      g.mat([0.6, 0.05, 0.04], K.MATTE).box(xD, 0.72, zT + 0.1, 0.4, 0.09, 0.02);
      glows.add(xD, 0.98, zT + 0.12, { aColA: RED, aColB: RED, aSw: [2, r13Sig(), 0.16, 0] });
      g.mat(C.iron, K.IRON).strut([xD + 0.5, 0.05, zT - 1.2], [xD + 0.75, 1.0, zT - 1.2], 0.07);
      g.mat([0.8, 0.78, 0.72], K.MATTE).box(xD + 0.76, 1.05, zT - 1.2, 0.16, 0.16, 0.16);
      for (let l = 0; l < 3; l++) g.mat(mulc(C.sleeper, 1.2 + 0.2 * l), K.WOOD).box(xD + 1.6, 0.14 + l * 0.27, zT + 3, 2.5, 0.25, 1.9 - l * 0.3, (l % 2) * 1.5708);
      // Puddles lie where water stands in a yard: one under the column's bag, and five the seed lays in the low ground between
      // neighbouring roads (never where the point rodding runs, nor two in one stretch), each as wide as the space between
      // the sleeper ends there allows and 8 to 18 m long.
      HU.uPud.value[0].set(bag[0] + 0.25, bag[2], 1.8, 4.5);
      const YARD_Z = [46, 300];                               // the open yard: from the foot of the platforms' ramps (the hero's ZR) to the head of the throat, where its roads begin
      for (let i = 1, tries = 0; i < 6 && tries < 24; tries++) {
        const z = r17Pud.range(YARD_Z[0], YARD_Z[1]), hl = r17Pud.range(5, 11.5), pick = r17Pud();
        if (z - hl < YARD_Z[0] || z + hl > YARD_Z[1]) continue;                           // a pool lies whole within the open yard
        const xs = (zz) => { const a = []; A.tracks.forEach((t, r) => { if (t.end < zz && t.from > zz) a.push(A.trackXAt(r, zz)); }); return a.sort((p, q) => p - q); };
        const xa = xs(z + hl * 0.78), xm = xs(z), xb = xs(z - hl * 0.78);
        if (xa.length !== xm.length || xb.length !== xm.length) continue;                 // a road begins or ends within its length: no pool across a turnout
        const gaps = [];
        for (let k = 0; k + 1 < xm.length; k++) {
          const w = Math.min(xa[k + 1] - xa[k], xm[k + 1] - xm[k], xb[k + 1] - xb[k]), c = (xa[k] + xa[k + 1] + xb[k] + xb[k + 1]) / 4, drift = Math.abs((xa[k] + xa[k + 1]) - (xb[k] + xb[k + 1])) / 2;
          if (w > 3.9 && w < 12 && drift < 1.2 && !(xm[k] < 0.15 && xm[k + 1] > 0.15 && z < 270)) gaps.push([c, w - drift]);
        }
        if (!gaps.length) continue;
        const gp = gaps[Math.min(gaps.length - 1, Math.floor(pick * gaps.length))];
        if (HU.uPud.value.some((v) => v.z > 0 && Math.abs(v.x - gp[0]) < 2 && Math.abs(v.y - z) < v.w + hl)) continue;      // (two pools do not share a stretch of the same space)
        HU.uPud.value[i++].set(gp[0], z, Math.min(2.4, (gp[1] - 2.6) * 0.64), hl);
      }
    }
    await ctx.yield();

    // ---- the left side, the deck and the throat filled (round ten). Everything here draws from a random stream of its own.
    // Its tall blocks (the chawls along the left of the line, the mill behind them) are raised first, so that the small
    // roofs, tarpaulins, tanks and trees scattered after them are tested against the blocks before they draw (inNew).
    const zr = ctx.core.makeRng('cl-halt:' + ctx.seed);
    const laundry2 = [], haltFolk = [], yardFolk = [], newBlocks = [];
    const dkf = (s0) => { const z = zOfS(s0); return frame(pathX(z), railY(z), z, yawAt(z)); };
    const lampOn = HR.lamp ? -1 : shower ? 2 : uFront - 0.03;        // gas is lit as the dark comes on (at dusk it is lit already)
    const DIMGAS = [0.2, 0.12, 0.05];
    // a lamp, and its streak lying in the wet at height h
    const lampGlow = (p, size, h) => {
      glows.add(p[0], p[1], p[2], { aColA: DIMGAS, aColB: WARM, aSw: [lampOn, zr(), size, 0] });
      glows.add(p[0], p[1], p[2], { aColA: [0, 0, 0], aColB: WARM, aSw: [lampOn, zr(), size * 1.3, 1 + h] });
    };
    const inNew = (x, z, m) => {
      for (const b of newBlocks) { const dx = x - b[0], dz = z - b[1], c = Math.cos(b[2]), s = Math.sin(b[2]); if (Math.abs(dx * c - dz * s) < b[3] + m && Math.abs(dx * s + dz * c) < b[4] + m) return true; }
      return false;
    };
    let millChim = null;
    {
      // five- and six-storey chawls along the left of the line, their galleries and washing above the parapet at eye level
      for (const [z, lat, L, fl] of [[706, -21.5, 24, 5], [668, -22.5, 26, 6], [628, -21, 22, 5], [590, -22.5, 28, 6], [540, -23.5, 24, 5], [496, -23, 26, 6], [452, -22.5, 22, 5]]) {
        const q = stAt(z), cx = q.x + lat * q.rx, cz = q.z + lat * q.rz, yaw = Math.atan2(q.rx, q.rz);
        if (chawlList.some((c) => Math.hypot(c[0] - cx, c[1] - cz) < (c[2] + L) / 2 + 5) || Math.abs(flyW(cx, cz)) < L / 2 + 9) continue;
        chawl(gNear, cx, cz, yaw, L, fl, true, zr, laundry2, []);
        newBlocks.push([cx, cz, yaw, L / 2 + 3.4, 6.4]);
      }
      // a mill behind them: saw-tooth roof, and a chimney that is the tallest thing on the left of the first view
      const qm = stAt(642), mlat = -56, mx = qm.x + mlat * qm.rx, mz = qm.z + mlat * qm.rz, myaw = yawAt(642), Wm = 22, Lm = 46, Hm = 15;
      if (!chawlList.some((c) => Math.hypot(c[0] - mx, c[1] - mz) < c[2] / 2 + 30)) {
        const f = frame(mx, 0, mz, myaw), g = gNear;
        g.mat(mulc(brick, 0.95), K.CHAWL); f.box(g, 0, Hm / 2, 0, Wm, Hm, Lm, { uv: 1 / 3.6, v0: 0, top: false });
        const nt = 6, tw = Lm / nt;
        for (let k = 0; k < nt; k++) {
          const z0 = -Lm / 2 + k * tw, z1 = z0 + tw;
          g.mat(C.tin, K.CORR).quad(f.p(Wm / 2, Hm, z0), f.p(Wm / 2, Hm + 3, z1), f.p(-Wm / 2, Hm + 3, z1), f.p(-Wm / 2, Hm, z0), 0, 0, tw, Wm);
          g.mat(C.glass, K.GLASS).quad(f.p(-Wm / 2, Hm, z1), f.p(Wm / 2, Hm, z1), f.p(Wm / 2, Hm + 3, z1), f.p(-Wm / 2, Hm + 3, z1), 0, 0, Wm, 3);
        }
        const cp = f.p(-Wm / 2 - 6, 0, -Lm / 4), Hc = 47, r = 2.5;
        g.mat(mulc(brick, 1.05), K.BRICK).lathe(cp[0], 0, cp[2], [[r, 0], [r * 0.64, Hc * 0.965], [r * 0.78, Hc * 0.975], [r * 0.78, Hc], [r * 0.55, Hc]], 10);
        millChim = [cp[0], Hc, cp[2]];
        newBlocks.push([mx, mz, myaw, Wm / 2 + 1, Lm / 2 + 1]);
      }
    }
    await ctx.yield();
    // ---- the roof quarter: instanced tin and tile roofs at all angles, in three districts for culling
    const roofN = Math.round(900 * plenty);
    const shackTin = shackGeo(K.CORR), shackTile = shackGeo(K.TILE);
    const roofSets = [0, 1, 2].map(() => [instanced(shackTin, surfT, roofN, true), instanced(shackTile, surfT, roofN, true)]);
    const TIN = [[0.42, 0.44, 0.46], [0.5, 0.5, 0.5], [0.36, 0.2, 0.13], [0.3, 0.13, 0.08], [0.33, 0.36, 0.4], [0.12, 0.26, 0.42], [0.45, 0.42, 0.33], [0.25, 0.3, 0.26]];
    const TILEC = [[0.42, 0.16, 0.08], [0.36, 0.13, 0.07], [0.48, 0.22, 0.1], [0.3, 0.12, 0.08]];
    const tarpSpots = [], roofTops = [], roofAt = [];
    // (the small roofs draw from a stream of their own; a place is drawn, tested, and only then is its roof drawn)
    const smallR = own('small-roofs');
    for (let it = 0, placed = 0; it < roofN * 5 && placed < roofN; it++) {
      if (it % 300 === 299) await ctx.yield();
      const z = smallR.range(-250, 840), side = smallR.chance(0.5) ? -1 : 1, d = 12.6 + Math.pow(smallR(), 1.8) * 560;
      let x, zz = z;
      if (z > 300) { const q = stAt(z), lat = side * (d + (q.y < 6 ? 2.5 : 0)); x = q.x + lat * q.rx; zz = q.z + lat * q.rz; }
      else if (z > -200) x = side > 0 ? 45 + d : -70 - d;
      else x = smallR.range(-420, 420);
      if (zz < 310 && zz > -200 && x > -82 && x < 57) continue;
      if (Math.abs(flyW(x, zz)) < 8 && Math.abs(flyT(x, zz)) < 256) continue;
      if (!isFree(x, zz)) continue;
      if (inNew(x, zz, 3.5)) continue;                         // none where a tall block stands, nor within 3.5 m of its walls
      occ.add(cellKey(x, zz));
      const w = smallR.range(4.2, 9), dp = smallR.range(3.6, 6.5), h0 = smallR.chance(0.22) ? smallR.range(5, 6.4) : smallR.range(2.5, 3.8);
      // on the right, beyond the railing, two- and three-storey shophouses bring roofs, tarpaulins and tanks up to just
      // under the eye; nothing that could reach the deck stands higher than the rails
      let h = h0;
      if (zz > 330) {
        const clearOf = d - Math.hypot(w, dp) / 2, ry = railY(zz);
        if (clearOf < 11.2) h = Math.min(h0, Math.max(2.5, (ry - 0.6) / 1.34));
        else if (side > 0 && d < 45) h = Math.max(h0, (ry + 0.4 + (h0 - 2.5) * 0.6) / 1.34);
      }
      const yaw = ((Math.floor(x / 70) * 0.9 + Math.floor(zz / 90) * 0.6) % 1.4) + smallR.range(-0.25, 0.25) + (smallR.chance(0.25) ? Math.PI / 2 : 0);
      const tile = smallR.chance(0.3), set = roofSets[zz > 420 ? 0 : zz > 120 ? 1 : 2][tile ? 1 : 0];
      if (set.add(x, 0, zz, yaw, w, h, dp, mulc(smallR.pick(tile ? TILEC : TIN), smallR.range(0.75, 1.2)), mulc(smallR.pick(WALLS), smallR.range(0.7, 1.05)), 0) < 0) continue;
      placed++; roofAt.push([x, zz, yaw, w, dp]);
      const c = Math.cos(yaw), s = Math.sin(yaw);
      if (smallR.chance(0.3)) tarpSpots.push([x, h * 1.36 + 0.1, zz, yaw, w * 0.85, dp * 0.95]);
      else if (smallR.chance(0.14)) tarpSpots.push([x + s * dp * 0.9, 2.3, zz + c * dp * 0.9, yaw, smallR.range(3, 5), smallR.range(3, 4.5)]);
      if (d < 70 && smallR.chance(0.4)) rope(x + 0.5 * w * c + 0.6 * dp * s, h * 0.97, zz - 0.5 * w * s + 0.6 * dp * c, h * 0.95, 0.08, smallR.chance(0.5), smallR);
      if (smallR.chance(0.2)) tankSpots.push([x - s * dp * 0.9, 0, zz - c * dp * 0.9, smallR.range(1, 1.5), smallR.range(5, 8.5)]);
      if (smallR.chance(0.2)) roofTops.push([x, h * 1.3, zz]);
    }
    await ctx.yield();
    {
      // the wayside halt on the left, 170 to 262 m in: a platform carried out over the street on a brick wall, an iron canopy
      // on cast columns with gas lamps under it, benches, people with umbrellas. A local stands at it as we come in.
      const g = gNear, S0 = HALT0, S1 = HALT1, LA = -8.9, LB = -13.3, PY = 1.0, C0 = 182, C1 = 250;
      const E0 = LA + 0.35, RD = -11.1, E1 = LB - 0.25, ye = PY + 3.3, yr = PY + 4.35, yb = PY + 3.55;
      for (let s0 = S0; s0 < S1; s0 += 4) {
        const fa = dkf(s0), fb = dkf(s0 + 4), ha = railY(zOfS(s0)), hb = railY(zOfS(s0 + 4));
        g.mat(mulc(C.pave, 0.95), K.PAVE).quad(fa.p(LB, PY, 0), fa.p(LA, PY, 0), fb.p(LA, PY, 0), fb.p(LB, PY, 0), LA - LB, s0, 0, s0 + 4);
        g.mat(brick, K.BRICK).quad(fa.p(LA, 0, 0), fb.p(LA, 0, 0), fb.p(LA, PY, 0), fa.p(LA, PY, 0), s0, 0, s0 + 4, PY);
        g.mat(brick, K.VIADUCT).quad(fb.p(LB, -hb, 0), fa.p(LB, -ha, 0), fa.p(LB, PY, 0), fb.p(LB, PY, 0), s0 + 4, (ha + hb) / 2 + PY, s0, 0);
        g.mat(C.ironPaint, K.RAIL).quad(fa.p(LB + 0.1, PY, 0), fb.p(LB + 0.1, PY, 0), fb.p(LB + 0.1, PY + 1.12, 0), fa.p(LB + 0.1, PY + 1.12, 0), s0 / 1.6, 0, (s0 + 4) / 1.6, 1);
        if (s0 >= C0 && s0 < C1) {
          g.mat(mulc(C.tin, 0.85 + 0.22 * (((s0 - C0) / 4) % 2)), K.CORR);
          g.quad(fa.p(E0, ye, 0), fb.p(E0, ye, 0), fb.p(RD, yr, 0), fa.p(RD, yr, 0), s0, 0, s0 + 4, 2.5);
          g.quad(fb.p(E1, yb, 0), fa.p(E1, yb, 0), fa.p(RD, yr, 0), fb.p(RD, yr, 0), s0 + 4, 0, s0, 2.6, 0.9);
          g.mat(C.creamPaint, K.VALANCE).quad(fa.p(E0, ye - 0.55, 0), fb.p(E0, ye - 0.55, 0), fb.p(E0, ye, 0), fa.p(E0, ye, 0), s0 / 0.5, 1, (s0 + 4) / 0.5, 0);
          ropes.add(...fa.p(E0 + 0.06, ye - 0.06, 0), { aR: [3.25, 0.05, zr() * 0.45, 0] });
        }
      }
      for (const [sa, sb] of [[S0 - HALT_RAMP, S0], [S1 + HALT_RAMP, S1]]) {         // a ramp down to the deck at either end
        const fl = dkf(sa), fh = dkf(sb);
        g.mat(mulc(C.pave, 0.95), K.PAVE).quad(fl.p(LB, 0.03, 0), fl.p(LA, 0.03, 0), fh.p(LA, PY, 0), fh.p(LB, PY, 0), LA - LB, sa, 0, sb);
        g.mat(brick, K.BRICK).tri(fl.p(LA, 0, 0), fh.p(LA, 0, 0), fh.p(LA, PY, 0), [sa, 0], [sb, 0], [sb, PY]);
        g.mat(brick, K.VIADUCT).quad(fh.p(LB, -railY(zOfS(sb)), 0), fl.p(LB, -railY(zOfS(sa)), 0), fl.p(LB, 0.03, 0), fh.p(LB, PY, 0), sb, railY(zOfS(sb)) + PY, sa, 0);
      }
      for (let s0 = C0 + 2; s0 < C1; s0 += 8) {                       // cast columns, rafters and brackets
        const f = dkf(s0);
        g.mat(C.maroon, K.IRON).lathe(...f.p(-11.3, PY, 0), [[0.2, 0], [0.2, 0.25], [0.13, 0.4], [0.13, 1.2]], 8);
        g.mat(C.creamPaint, K.IRON).lathe(...f.p(-11.3, PY, 0), [[0.1, 1.2], [0.085, 3.6]], 8);
        g.mat(C.maroon, K.IRON).lathe(...f.p(-11.3, PY, 0), [[0.085, 3.6], [0.2, 3.85], [0.2, 4.0]], 8);
        g.mat(C.iron, K.IRON).strut(f.p(E0, ye - 0.06, 0), f.p(RD, yr - 0.08, 0), 0.1).strut(f.p(RD, yr - 0.08, 0), f.p(E1, yb - 0.06, 0), 0.1);
        g.mat(C.ironPaint, K.LATTICE).tri(f.p(-11.2, PY + 2.85, 0), f.p(-9.2, PY + 3.5, 0), f.p(-11.2, PY + 3.9, 0), [0, 0], [3, 0], [0, 1]);
      }
      for (let s0 = C0 + 6; s0 < C1; s0 += 8) {                       // hanging gas lamps
        const f = dkf(s0), lp = f.p(-10.3, PY + 2.75, 0);
        g.mat(C.iron, K.IRON).strut(f.p(-10.3, PY + 3.8, 0), f.p(-10.3, PY + 3.0, 0), 0.04);
        g.mat([0.3, 0.2, 0.09], K.GLOW).lathe(lp[0], lp[1] - 0.22, lp[2], [[0.11, 0], [0.19, 0.4]], 4, { flat: true, phase: 0.785 });
        g.mat(C.iron, K.IRON).lathe(lp[0], lp[1] + 0.18, lp[2], [[0.3, 0], [0.06, 0.2]], 6);
        lampGlow(lp, 0.62, railY(zOfS(s0)) + PY);
      }
      for (const s0 of [C0 + 10, C0 + 26, C0 + 42, C0 + 58]) {        // benches along the back, luggage by them
        const f = dkf(s0);
        g.mat(C.maroon, K.WOOD); f.box(g, -12.5, PY + 0.42, 0, 0.45, 0.07, 2.0); f.box(g, -12.72, PY + 0.75, 0, 0.06, 0.5, 2.0);
        g.mat(mulc(C.crate, zr.range(0.8, 1.3)), K.WOOD); f.box(g, -12.3, PY + 0.3, 2.2, 0.8, 0.6, 0.6); f.box(g, -11.9, PY + 0.22, 2.9, 0.6, 0.44, 0.9);
        g.mat(zr.pick([[0.4, 0.33, 0.2], [0.3, 0.1, 0.06], [0.05, 0.15, 0.4]]), K.MATTE); f.box(g, -12.3, PY + 0.75, 2.2, 0.6, 0.3, 0.45);
      }
      for (let i = 0; i < 32; i++) {
        const s0 = zr.range(S0 + 3, S1 - 3), lat = zr.range(-12.3, -9.7), under = s0 > C0 + 1 && s0 < C1 - 1, edge = lat > -10.3;
        const open = -(uFront - 0.04 + zr.range(0, 0.045));
        haltFolk.push([...dkf(s0).p(lat, PY, 0), under && !edge ? (zr.chance(0.7) ? -1.5 : open) : open]);
      }
    }
    await ctx.yield();
    {
      // lineside signals on the left, gas standards along the wet stretch (each with its streak in the deck), and streaks
      // under the older signal lamps
      const g = gNear;
      for (const [s0, col] of [[100, RED], [282, GREEN], [380, RED]]) {
        const q = stAt(zOfS(s0)), f = frame(q.x, q.y, q.z, yawAt(q.z)), x = -9.25, on = col === GREEN;
        g.mat(C.cream, K.IRON).strut(f.p(x, 0, 0), f.p(x, 3, 0), 0.24); g.mat(C.iron, K.IRON).strut(f.p(x, 3, 0), f.p(x, 7.0, 0), 0.19);
        g.mat([0.62, 0.05, 0.04], K.MATTE).strut(f.p(x + 0.1, 6.3, 0.2), f.p(x + 1.5, on ? 5.4 : 6.3, 0.2), 0.04, 0.27);
        g.mat(C.iron, K.IRON).strut(f.p(x - 0.05, 6.2, 0.18), f.p(x - 0.6, 6.2, 0.18), 0.04, 0.5);
        const p = f.p(x - 0.45, 6.3, 0.3);
        glows.add(p[0], p[1], p[2], { aColA: col, aColB: col, aSw: [2, zr(), 0.5, 0] });
        glows.add(p[0], p[1], p[2], { aColA: col, aColB: col, aSw: [2, zr(), 0.62, 1 + q.y] });
      }
      for (const s0 of [336, 414]) { const q = stAt(zOfS(s0)), p = frame(q.x, q.y, q.z, yawAt(q.z)).p(9.55, 6.6, 0.3); glows.add(p[0], p[1], p[2], { aColA: GREEN, aColB: GREEN, aSw: [2, zr(), 0.62, 1 + q.y] }); }
      for (let s0 = 198; s0 < 440; s0 += 44) for (const side of [1, -1]) {
        const h = railY(zOfS(s0));
        if ((side < 0 && s0 < 270) || h < 0.6) continue;
        const f = dkf(s0), la = side * 9.95;
        g.mat(C.iron, K.IRON).lathe(...f.p(la, 0, 0), [[0.16, 0], [0.16, 0.35], [0.07, 0.6], [0.055, 4.1], [0.1, 4.2]], 6);
        g.mat([0.3, 0.2, 0.09], K.GLOW).lathe(...f.p(la, 4.2, 0), [[0.11, 0], [0.2, 0.42]], 4, { flat: true, phase: 0.785 });
        g.mat(C.iron, K.IRON).lathe(...f.p(la, 4.62, 0), [[0.26, 0], [0.04, 0.22], [0.02, 0.45]], 4, { flat: true, phase: 0.785 });
        lampGlow(f.p(la, 4.42, 0), 0.78, h);
      }
      // on the cess near the entry: two point levers with white weights, and a ground disc with its lamp
      for (const s0 of [31, 92]) {
        const f = dkf(s0);
        g.mat(C.iron, K.IRON); f.box(g, 8.9, 0.14, 0, 0.5, 0.2, 0.9);
        g.strut(f.p(8.9, 0.2, 0.25), f.p(8.9, 1.02, -0.35), 0.07);
        g.mat([0.8, 0.78, 0.72], K.MATTE); f.box(g, 8.9, 1.05, -0.38, 0.17, 0.17, 0.17);
        g.mat(C.iron, K.IRON); f.box(g, 8.9, 0.36, 1.9, 0.12, 0.6, 0.12);
        g.mat([0.8, 0.78, 0.72], K.MATTE); f.box(g, 8.9, 0.8, 1.97, 0.4, 0.4, 0.04);
        g.mat([0.6, 0.05, 0.04], K.MATTE); f.box(g, 8.9, 0.8, 2.0, 0.4, 0.09, 0.02);
        const lp = f.p(8.9, 1.07, 2.0);
        glows.add(lp[0], lp[1], lp[2], { aColA: RED, aColB: RED, aSw: [2, qr(), 0.16, 0] });
      }
    }
    await ctx.yield();
    {
      // in the throat: a signal cabin on a narrow iron trestle between the running lines, nine metres right of the door, its
      // panes lit; platelayers standing clear beside it
      const g = gThroat, f = frame(9.3, 0, 166, 0), fy = 5.7, by = fy + 0.16;
      g.mat(C.iron, K.IRON);
      for (const sz of [-2.6, 2.6]) {
        for (const sx of [-0.32, 0.32]) g.strut(f.p(sx, 0, sz), f.p(sx, fy, sz), 0.16);
        for (let k = 0; k < 4; k++) g.strut(f.p(k % 2 ? 0.32 : -0.32, k * 1.4, sz), f.p(k % 2 ? -0.32 : 0.32, k * 1.4 + 1.4, sz), 0.07);
        g.strut(f.p(-0.3, fy - 1.5, sz), f.p(-1.9, fy, sz), 0.1).strut(f.p(0.3, fy - 1.5, sz), f.p(1.9, fy, sz), 0.1);
      }
      for (const sx of [-0.32, 0.32]) g.strut(f.p(sx, 2.8, -2.6), f.p(sx, 2.8, 2.6), 0.08);
      g.mat(C.wood, K.WOOD); f.box(g, 0, fy + 0.08, 0, 4.2, 0.16, 7.6, { bottom: true });
      g.mat(C.creamPaint, K.WOOD); f.box(g, 0, by + 0.5, 0, 3.0, 1.0, 6.4, { top: false });
      g.mat([0.27, 0.15, 0.05], K.GLOW); f.box(g, 0, by + 1.7, 0, 2.9, 1.4, 6.3, { top: false });
      g.mat(C.maroon, K.WOOD);
      for (const sx of [-1, 1]) for (let z = -3.2; z <= 3.21; z += 0.8) f.box(g, sx * 1.5, by + 1.7, z, 0.09, 1.4, 0.09, { top: false });
      for (const sz of [-1, 1]) for (let x = -1.5; x <= 1.51; x += 0.75) f.box(g, x, by + 1.7, sz * 3.2, 0.09, 1.4, 0.09, { top: false });
      f.box(g, 0, by + 1.0, 0, 3.12, 0.1, 6.52, { top: false }); f.box(g, 0, by + 2.46, 0, 3.12, 0.14, 6.52);
      for (const [x, z, h] of [[-1, 1.1, 1.66], [-1, -1.5, 1.6]]) g.mat([0.02, 0.02, 0.025], K.MATTE).lathe(...f.p(1.56 * x, by, z), [[0.17, 0], [0.2, 0.75 * h], [0.23, 0.82 * h], [0.08, 0.88 * h], [0.1, 0.94 * h], [0.02, h]], 7, { sx: 0.5 });
      const ey = by + 2.52, rdg = by + 3.6;
      g.mat(mulc(C.oxide, 1.3), K.TILE);
      g.quad(f.p(2.1, ey, 3.8), f.p(2.1, ey, -3.8), f.p(0, rdg, -2), f.p(0, rdg, 2), 0, 0, 7.6, 2.6);
      g.quad(f.p(-2.1, ey, -3.8), f.p(-2.1, ey, 3.8), f.p(0, rdg, 2), f.p(0, rdg, -2), 0, 0, 7.6, 2.6, 0.85);
      g.tri(f.p(-2.1, ey, 3.8), f.p(2.1, ey, 3.8), f.p(0, rdg, 2), [0, 0], [4.2, 0], [2.1, 2.2], 0.92);
      g.tri(f.p(2.1, ey, -3.8), f.p(-2.1, ey, -3.8), f.p(0, rdg, -2), [0, 0], [4.2, 0], [2.1, 2.2], 0.78);
      g.mat(C.ironPaint, K.RAIL);
      for (const sx of [-1, 1]) g.quad(f.p(sx * 2.05, fy + 0.16, -3.75), f.p(sx * 2.05, fy + 0.16, 3.75), f.p(sx * 2.05, fy + 1.2, 3.75), f.p(sx * 2.05, fy + 1.2, -3.75), 0, 0, 4.7, 1);
      g.mat(C.iron, K.LATTICE).quad(f.p(-0.3, 0, 3.75), f.p(-0.3, fy + 0.1, 3.75), f.p(0.3, fy + 0.1, 3.75), f.p(0.3, 0, 3.75), 0, 0, 16, 1);       // the ladder up
      for (const z of [-1.5, 1.5]) glows.add(...f.p(0, by + 2.0, z), { aColA: WARM, aColB: WARM, aSw: [2, zr(), 0.55, 0] });
      for (const [x, z] of [[-0.3, 172.5], [-0.15, 176], [-0.32, 180.5], [-0.2, 184]]) yardFolk.push([9.3 + x, 0, z, uClear + 0.1 + zr.range(0, 0.05)]);
    }
    await ctx.yield();
    // instances are kept in order of z, so that those behind the eye can be left undrawn as the journey goes on (mesh.count)
    const zsets = [];
    const zsort = (mesh, extra) => {
      const n = mesh.count, M = mesh.instanceMatrix.array, order = Array.from({ length: n }, (_, i) => i).sort((a, b) => M[a * 16 + 14] - M[b * 16 + 14]);
      const perm = (arr, k) => { const src = arr.slice(0, n * k); for (let i = 0; i < n; i++) for (let j = 0; j < k; j++) arr[i * k + j] = src[order[i] * k + j]; };
      perm(M, 16); if (extra) for (const [arr, k] of extra) perm(arr, k);
      const zs = new Float32Array(n); for (let i = 0; i < n; i++) zs[i] = M[i * 16 + 14];
      mesh.instanceMatrix.needsUpdate = true; zsets.push({ mesh, zs, n });
    };
    const zsortSet = (set) => { zsort(set.mesh, [[set.t1, 3], [set.ai, 4]]); set.aT1.needsUpdate = true; set.aI.needsUpdate = true; };
    for (const pair of roofSets) for (const set of pair) { scene.add(set.done()); zsortSet(set); await ctx.yield(); }

    // tarpaulins, water tanks, washing, people under umbrellas, paper kites, crows on the wires
    const BLUES = [[0.03, 0.15, 0.5], [0.03, 0.15, 0.5], [0.05, 0.2, 0.55], [0.1, 0.25, 0.5], [0.05, 0.25, 0.15], [0.5, 0.2, 0.04], [0.3, 0.32, 0.33]];
    const tarpCap = Math.min(tarpSpots.length, Math.round(300 * plenty)), tarps = instanced(tarpGeo(), surfC, tarpCap), tarpR = own('roof-tarps');
    tarpSpots.unshift(...entryTarps);
    // (a tarpaulin is tested first: none where a tall block stands, none beyond the number the set holds; then it draws its
    // colour and its beat from the tarpaulins' own stream)
    for (const t of tarpSpots) {
      if (tarps.count >= tarpCap) break;
      if (inNew(t[0], t[2], 2)) continue;
      tarps.add(t[0], t[1], t[2], t[3], t[4], 1, t[5], null, mulc(tarpR.pick(BLUES), tarpR.range(0.7, 1.15)), tarpR());
    }
    scene.add(tarps.done()); zsortSet(tarps);
    await ctx.yield();
    const TANKC = [[0.3, 0.14, 0.08], [0.07, 0.07, 0.08], [0.3, 0.31, 0.33], [0.33, 0.1, 0.06], [0.2, 0.22, 0.2]];
    const tankG = tankGeo();
    await ctx.yield();
    const tankCap = Math.min(tankSpots.length, Math.round(200 * plenty) + 40);
    const tanks = instanced(tankG, surfT, tankCap), tanksFar = instanced(tankGeo(true), surfT, tankCap);     // beyond 70 m of the line a tank is its drum, lid and legs
    const tankR = own('roof-tanks');                           // (a tank is tested first, then draws its turn and colour from the tanks' own stream)
    tankSpots.forEach((t, i) => {
      if (i >= tankCap || inNew(t[0], t[2], 1.5)) return;
      const yaw = tankR.range(0, TAU), col = mulc(tankR.pick(TANKC), tankR.range(0.8, 1.2));
      (path.nearestXZ(t[0], t[2]).dist > 70 ? tanksFar : tanks).add(t[0], t[1], t[2], yaw, t[3] * 2, t[4], t[3] * 2, col, null, 0);
    });
    scene.add(tanks.done()); zsortSet(tanks);
    await ctx.yield();
    scene.add(tanksFar.done()); zsortSet(tanksFar);
    await ctx.yield();
    const washCap = Math.min(laundry.length, Math.round(520 * plenty));
    const wash = instanced(clothGeo(), surfC, washCap + laundry2.length);
    { let wi = 0; for (const l of rng.shuffle(laundry)) { const wc = mulc(l.col, rng.range(0.8, 1.1)), ww = rng(); if (wi++ < washCap) wash.add(l.p[0], l.p[1], l.p[2], l.yaw, l.w, l.h, 1, null, wc, ww); } }
    for (const l of laundry2) wash.add(l.p[0], l.p[1], l.p[2], l.yaw, l.w, l.h, 1, null, mulc(l.col, zr.range(0.8, 1.1)), zr());
    scene.add(wash.done()); zsortSet(wash);
    await ctx.yield();
    const BLACK = [0.02, 0.02, 0.025], PARASOL = [[0.55, 0.5, 0.38], [0.45, 0.05, 0.05], [0.05, 0.1, 0.3], [0.5, 0.33, 0.05], [0.1, 0.3, 0.2]];
    const SARI = [[0.5, 0.045, 0.05], [0.04, 0.15, 0.45], [0.55, 0.33, 0.04], [0.07, 0.3, 0.16], [0.45, 0.07, 0.28], [0.5, 0.46, 0.38], [0.6, 0.2, 0.03], [0.1, 0.3, 0.42]];
    const personG = personGeo();
    const folk = instanced(personG, surfF, 222), folkFar = instanced(personG, surfF, 190);     // folkFar: the people of the platforms, half a kilometre from the entry
    const folkA = instanced(personG, surfF, 222);                 // the people of the viaduct's first 230 m: put away once they are all behind
    const fAdd = (x, y, z, ...a) => (z > 470 ? folkA : folk).add(x, y, z, ...a);
    const person = (x, y, z, foldU, set = null) => (set ? set.add : fAdd)(x, y, z, rng.range(0, TAU), 1, rng.range(0.9, 1.05), 1, rng.chance(0.6) ? BLACK : rng.pick(PARASOL), rng.pick(SARI), foldU);
    for (const e of A.platformEnds) {
      for (let i = 0; i < 4; i++) { const x = e.x + rng.range(-1.6, 1.6); if (Math.abs(x) > 6) person(x, e.y, e.z + rng.range(-3, 9), weather === 'late' ? 2 : uClear + 0.08 + (e.x + 75) / 125 * 0.14 + rng.range(0, 0.03), folkFar); }
      for (let i = 0; i < 5; i++) { const x = e.x + rng.range(-1.5, 1.5); if (Math.abs(x) > 8) person(x, e.y, rng.range(-126, -8), rng.chance(0.3) ? 2 : -1, folkFar); }
    }
    for (let i = 0; i < 26; i++) { const q = stAt(rng.range(330, 800)), lat = (rng.chance(0.5) ? -1 : 1) * rng.range(12, 15.5); person(q.x + lat * q.rx, 0, q.z + lat * q.rz, uFront + 0.4 + rng.range(0, 0.2)); }
    for (const c of cartSpots) folkFar.add(c[0], 0, c[2], xr.range(0, TAU), 1, xr.range(0.9, 1.02), 1, BLACK, xr.pick(SARI), uClear + 0.09 + xr.range(0, 0.05));
    for (let zc = -10; zc > -122; zc -= 18) {                 // on our own platform, right of the eye: draped figures between the piles of luggage
      const n = xr.chance(0.5) ? 3 : 2;
      for (let i = 0; i < n; i++) folkFar.add(xr.range(3.7, 4.5), 1.05, zc - 5 - i * 2.2 - xr.range(0, 1.2), xr.range(0, TAU), 1, 0.86, 1, xr.chance(0.5) ? BLACK : xr.pick(PARASOL), xr.pick(SARI), xr.chance(0.45) ? 2 : -1);
    }
    for (const b of baz.folk) fAdd(b[0], 0, b[1], nr.range(0, TAU), 1, nr.range(0.9, 1.05), 1, nr.chance(0.55) ? BLACK : nr.pick(PARASOL), nr.pick(SARI), b[2]);
    if (baz.hut) for (const h of baz.hut) fAdd(h[0], h[1], h[2], nr.range(0, TAU), 1, 0.95, 1, BLACK, nr.pick(SARI), -0.12 - nr.range(0, 0.03));     // platelayers standing clear by their hut
    for (const c of baz.carts) c.who = folk.add(0, -80, 0, 0, 1, nr.range(0.92, 1.02), 1, BLACK, nr.pick(SARI), -0.09 - nr.range(0, 0.02));           // and one behind each handcart
    for (const h of haltFolk) fAdd(h[0], h[1], h[2], zr.range(0, TAU), 1, zr.range(0.9, 1.05), 1, zr.chance(0.55) ? BLACK : zr.pick(PARASOL), zr.pick(SARI), h[3]);
    for (const h of yardFolk) folkFar.add(h[0], h[1], h[2], zr.range(0, TAU), 1, zr.range(0.92, 1.02), 1, BLACK, zr.pick(SARI), h[3]);
    // six people walking the platforms under the roof, either way, on time (so the shed is alive whether the train moves or not)
    const walkers = [];
    for (let i = 0; i < 6; i++) {
      const w = { x: i < 4 ? -4.95 - 0.38 * (i % 2) : 17.4 + 0.45 * (i % 2), z0: qr.range(0, 100), dir: i % 2 ? 1 : -1, v: qr.range(1.05, 1.35), h: qr.range(0.9, 1.03), ph: qr.range(0, 6) };
      w.i = folkFar.add(w.x, 1.05, -30, 0, 1, w.h, 1, BLACK, qr.pick(SARI), -1);
      if (w.i >= 0) walkers.push(w);
    }
    for (const h of folk13) fAdd(h[0], h[1], h[2], r13Line.range(0, TAU), 1, r13Line.range(0.92, 1.03), 1, r13Line.chance(0.5) ? BLACK : r13Line.pick(PARASOL), r13Line.pick(SARI), h[3]);
    for (const h of galFolk) fAdd(h[0], h[1], h[2], h[3] + r13GalF.range(-0.7, 0.7), 1, r13GalF.range(0.88, 1.02), 1, BLACK, r13GalF.pick(SARI), -1.5);     // on the galleries, looking out at the line
    for (const h of yard13) folkFar.add(h[0], h[1], h[2], r13Yard.range(0, TAU), 1, r13Yard.range(0.94, 1.03), 1, r13Yard.chance(0.5) ? BLACK : r13Yard.pick(PARASOL), r13Yard.pick(SARI), h[3]);
    folk.done();
    await ctx.yield();
    folkA.done();
    await ctx.yield();
    folkFar.done();
    await ctx.yield();
    // the chowk's awnings (cloth: they balloon in the gust) and its handcarts, which are moved from u
    const awnings = instanced(tarpGeo(), surfC, Math.max(baz.awn.length, 1), true);
    for (const a of baz.awn) awnings.add(a[0][0], a[0][1], a[0][2], a[1], a[2], 1, a[3], null, a[4], nr());
    scene.add(awnings.done());
    await ctx.yield();
    const flags = instanced(clothGeo(), surfC, Math.max(baz.flags.length, 1), true);
    for (const a of baz.flags) flags.add(a[0][0], a[0][1], a[0][2], a[1], a[2], a[3], 1, null, a[4], nr());
    scene.add(flags.done());
    await ctx.yield();
    const carts = instanced(cartGeo(), surfT, 3);
    for (const c of baz.carts) c.i = carts.add(0, -80, 0, 0, 1, 1, 1, nr.pick([[0.4, 0.33, 0.2], [0.3, 0.22, 0.13], [0.5, 0.3, 0.06]]), nr.pick(AWN), 1);
    scene.add(carts.done());
    await ctx.yield();
    const KITEC = [[0.6, 0.05, 0.05], [0.65, 0.5, 0.05], [0.08, 0.4, 0.15], [0.55, 0.08, 0.35], [0.6, 0.58, 0.5], [0.05, 0.2, 0.55], [0.6, 0.25, 0.04]];
    const kites = instanced(kiteGeo(), surfT, kiteDay ? 200 : 18);
    for (let i = 0; i < (kiteDay ? 200 : 18); i++) {
      const sc = rng.range(1.6, 2.8), west = kiteDay ? rng.chance(0.7) : true;
      kites.add(west ? rng.range(75, 420) : rng.range(-420, -95), rng.range(26, kiteDay ? 130 : 90), rng.range(-150, 380), rng.range(-0.6, 0.6), sc, sc, sc, mulc(rng.pick(KITEC), 1.2), null, (shower ? 0.08 : uClear + 0.06) + rng.range(0, 0.25));
    }
    scene.add(kites.done());
    await ctx.yield();
    const crowsSit = instanced(crowGeo(), surfT, Math.round(60 * plenty) + 10);
    for (let i = 0; i < 10; i++) {                            // ten on the railing by the door, 20 to 62 m in: they lift at the gust front in the foreground
      const q = stAt(zOfS(21 + i * 4.3 + qr.range(0, 2.5)));
      crowsSit.add(q.x + 10.38 * q.rx, q.y + 1.43, q.z + 10.38 * q.rz, qr.range(0, TAU), 1.7, 1.7, 1.7, null, null, 0);
    }
    for (const p of rng.shuffle(perchSpots)) crowsSit.add(p[0], p[1], p[2], rng.range(0, TAU), 1.7, 1.7, 1.7, null, null, 0);
    for (const t of rng.shuffle(roofTops).slice(0, 20)) crowsSit.add(t[0], t[1], t[2], rng.range(0, TAU), 1.7, 1.7, 1.7, null, null, 0);
    scene.add(crowsSit.done());
    const gantryPerch = []; for (const ga of A.gantries) for (const p of ga.perches) if (Math.abs(p.x) > 3) gantryPerch.push(p);
    const crowsShake = instanced(crowGeo(), surfT, 12);
    const shakers = rng.shuffle(gantryPerch).slice(0, 12).map((p, i) => ({ p, yaw: rng.range(0, TAU), ph: rng.range(0, 9), i: crowsShake.add(p.x, p.y, p.z, 0, 1.7, 1.7, 1.7, null, null, 0) }));
    scene.add(crowsShake.done());
    await ctx.yield();

    // palms in ones and clumps, a rain tree and banyans by the mills (kit flora, real lights)
    const wind = flora.makeWind({ direction: [NX, NZ], strength: 0.5 });
    await ctx.yield();
    const leafMap = flora.makeLeafTexture({ size: 512 });     // a quarter-size leaf atlas (no palm stands nearer than 15 m): one kit call, alone in its step
    await ctx.yield();
    const leafMat = flora.windMaterial({ wind, map: leafMap }), LEAF_DULL = [0.6, 0.5, 0.62], LEAF_GREY = 0.06;
    const leafFade = leafMat.userData.uniforms.uFloraFade.value, LEAF_SHEEN = leafFade.z;      // (the material's own gust sheen, as the kit makes it)
    await ctx.yield();
    {
      const geos = [];
      geos.push(flora.palmGeometry({ rng: rng.fork('p1'), detail: 0, height: 11 }));
      await ctx.yield();
      geos.push(flora.palmGeometry({ rng: rng.fork('p2'), detail: 0, height: 14, curve: 0.8 }));
      await ctx.yield();
      geos.push(flora.palmGeometry({ rng: rng.fork('p3'), detail: 1, height: 12.5 }));
      await ctx.yield();
      // no canopy hangs over the line: a tree placed by hand nearer the path than its clearance is stood off, straight away from it
      const standOff = (x, z, min) => {
        for (let k = 0; k < 3; k++) {
          const nn = path.nearestXZ(x, z); if (nn.dist >= min) break;
          path.pointAt(nn.u, tv);
          let dx = x - tv.x, dz = z - tv.z; const l = Math.hypot(dx, dz);
          if (l < 0.5) { dx = 1; dz = 0; } else { dx /= l; dz /= l; }
          x = tv.x + dx * (min + 1); z = tv.z + dz * (min + 1);
        }
        return [x, z];
      };
      const palmN = Math.round(120 * plenty), per = [Math.round(palmN * 0.4), Math.round(palmN * 0.35), Math.round(palmN * 0.25)];
      const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), S = new THREE.Vector3(), Pv = new THREE.Vector3();
      // The scattered palms (three kinds), in ones and clumps, draw from a stream of their own. A tree stands clear: not
      // within 14.5 m of the line (no canopy hangs over it), not under the flyover, not in a tall block nor within 2.5 m of
      // its walls, not in a cell of the town's ground that a building holds (the record the small roofs keep clear by),
      // not on a small roof nor within a metre of its walls. A place that is not clear is drawn again, up to PALM_TRIES
      // times in all (a clump's member about its clump, a single tree or a clump's first anywhere), and a tree with no
      // clear place by then is not planted.
      const palmR = own('r18b-palms'), PALM_TRIES = 4;
      const onRoof = (x, z) => roofAt.some((r) => { const dx = x - r[0], dz = z - r[1], c = Math.cos(r[2]), s = Math.sin(r[2]); return Math.abs(dx * c - dz * s) < r[3] / 2 + 1 && Math.abs(dx * s + dz * c) < r[4] / 2 + 1; });
      const palmClear = (x, z) => path.nearestXZ(x, z).dist >= 14.5 && Math.abs(flyW(x, z)) >= 6 && !inNew(x, z, 2.5) && isFree(x, z) && !onRoof(x, z);
      for (let gi = 0; gi < geos.length; gi++) {
        const geo = geos[gi], m = new THREE.InstancedMesh(geo, leafMat, per[gi]); m.frustumCulled = false;
        let cx = 0, cz = 0, left = 0, n = 0;
        for (let i = 0; i < per[gi]; i++) {
          const member = left > 0;
          let x = 0, z = 0, clear = false;
          if (member) left--;
          for (let k = 0; k < PALM_TRIES && !clear; k++) {
            if (member) { x = cx + palmR.range(-6, 6); z = cz + palmR.range(-6, 6); } else {
              const zp = palmR.range(-180, 830), side = palmR.chance(0.5) ? -1 : 1, d = (gi === 2 ? 15 : 22) + Math.pow(palmR(), gi === 2 ? 2.2 : 1.4) * (gi === 2 ? 90 : 420);
              if (zp > 300) { const q = stAt(zp); x = q.x + side * d * q.rx; z = q.z + side * d * q.rz; } else { x = side > 0 ? 50 + d : -75 - d; z = zp; }
            }
            clear = palmClear(x, z);
          }
          if (!clear) continue;
          if (!member) { cx = x; cz = z; left = palmR.chance(0.35) ? palmR.int(1, 3) : 0; }
          const sc = palmR.range(0.8, 1.3);
          E.set(palmR.range(-0.08, 0.08), palmR.range(0, TAU), palmR.range(-0.08, 0.08)); Q.setFromEuler(E);
          M4.compose(Pv.set(x, 0, z), Q, S.set(sc, sc, sc)); m.setMatrixAt(n++, M4);
        }
        m.count = n; m.instanceMatrix.needsUpdate = true; scene.add(m); zsort(m);
        await ctx.yield();
      }
      {
        // round fourteen: tall palms hard against the line, in ones and pairs, and a loose grove on the open ground of the
        // yard, right of the last road. Forks of a stream of their own (cl-r14); none within 13 m of the path, none in a
        // chawl's gallery, none under the flyover.
        const spots = [], pc = new THREE.Color();
        const inChawl = (x, z) => chawlList.some((c) => { const dx = x - c[0], dz = z - c[1], cs = Math.cos(c[3]), sn = Math.sin(c[3]), lx = dx * cs - dz * sn, lz = dx * sn + dz * cs; return Math.abs(lx) < c[2] / 2 + 4.5 && lz > -5 && lz < 6.8; });
        // Beside the viaduct they are scattered by the seed along its whole length (0 to 330 m in): a place every 25 to 50 m,
        // on one side or the other as the seed has it, four in ten of the places a pair 6 to 9 m apart; each 13.4 to 15.4 m
        // from the line (clear of the halt's back railing where the halt is). Where a gallery, a small roof or the flyover
        // stands on the drawn side the palm is across the line, or not there at all.
        const palmAt = (s0, lat) => {
          if (lat < 0 && s0 > HALT0 - HALT_RAMP && s0 < HALT1 + HALT_RAMP) lat = Math.min(lat, -14.6);
          const z = zOfS(s0), dx = pathDX(z), nn = Math.hypot(dx, 1), x = pathX(z) + lat / nn, zz = z - lat * dx / nn;
          return Math.abs(flyW(x, zz)) < 7 || inChawl(x, zz) || onRoof(x, zz) ? null : [x, zz, lat];
        };
        for (let s0 = r14Via.range(5, 30); s0 < 330; s0 += r14Via.range(25, 50)) {
          const side = r14Via.chance(0.5) ? 1 : -1, n = r14Via.chance(0.4) ? 2 : 1, gap = r14Via.range(6, 9);
          for (let k = 0; k < n; k++) {
            const latM = r14Via.range(13.4, 15.4), sc = r14Via.range(1.05, 1.35), q = palmAt(s0 + k * gap, side * latM) || palmAt(s0 + k * gap, -side * latM);
            if (!q) continue;
            // (they stand on the raised yards behind the viaduct wall, which hides their feet; each at its own height)
            spots.push([q[0], q[1], sc, clamp(railY(q[1]) - 1.4, 0, 4.5), r14ViaC]);
          }
        }
        // The grove, by the same rule of spacing along the yard's right edge, beside the sidings: from the head of the throat
        // (z 300, where the yard's roads begin) to the buffer stop of the outermost siding (the station's own ground in front of the shed is kept clear):
        // a place every 20 to 30 m, three in four of the places a pair 6 to 9 m apart; each palm stands 1.5 to 14 m out on
        // the open ground beyond the last road there (which it keeps 5 m clear of), and is not there at all where that
        // ground is taken: within 5 m of the yard's boundary wall (x 44 and more), within 8 m of the water tank, in a
        // chawl's gallery or on a small roof.
        const tank = A.waterTank, sidR = A.tracks.filter((t) => t.siding && t.x > 0).sort((a, b) => b.x - a.x)[0], zStop = sidR ? sidR.end : 0;
        for (let z0 = 300 - r14Grove.range(0, 25); z0 > zStop; z0 -= r14Grove.range(20, 30)) {
          const n = r14Grove.chance(0.75) ? 2 : 1, gap = r14Grove.range(6, 9);
          for (let k = 0; k < n; k++) {
            const z = z0 - k * gap, off = r14Grove.range(1.5, 14), sc = r14Grove.range(1.0, 1.3), x = Math.max(yardRM(z) + 5 + off, 16.5 + off * 0.5);
            if (z < zStop || x > 44 || (tank && Math.hypot(x - tank.x, z - tank.z) < 8) || inChawl(x, z) || onRoof(x, z)) continue;
            spots.push([x, z, sc, 0, r14GroveC]);                 // (on the yard's ground, each at its own height)
          }
        }
        const pm = new THREE.InstancedMesh(geos[2], leafMat, Math.max(spots.length, 1)); pm.frustumCulled = false; pm.count = spots.length;
        spots.forEach((sp, i) => {
          const pr = sp[4];                                     // (each palm's own lean, turn and tone from the fork of its kind)
          E.set(pr.range(-0.07, 0.07), pr.range(0, TAU), pr.range(-0.07, 0.07)); Q.setFromEuler(E);
          const sc = sp[2] * pr.range(0.95, 1.08), by = sp[3];
          M4.compose(Pv.set(sp[0] + pr.range(-0.5, 0.5), by, sp[1] + pr.range(-0.8, 0.8)), Q, S.set(sc, sc, sc)); pm.setMatrixAt(i, M4);
          const kc = pr.range(0.88, 1.08); pm.setColorAt(i, pc.setRGB(0.66 * kc, 0.76 * kc, 0.62 * kc));       // so near the eye their green is held a little deeper than the far palms'
        });
        pm.instanceMatrix.needsUpdate = true; scene.add(pm);
        if (pm.instanceColor) { zsort(pm, [[pm.instanceColor.array, 3]]); pm.instanceColor.needsUpdate = true; } else zsort(pm);
        await ctx.yield();
      }
      const tg = flora.oakGeometry({ rng: rng.fork('raintree'), detail: 1, height: 17, fullness: 1.35 });
      await ctx.yield();
      const tm = new THREE.InstancedMesh(tg, leafMat, 4 + baz.trees.length); tm.frustumCulled = false;
      tg.computeBoundingBox();
      const tR = Math.max(-tg.boundingBox.min.x, tg.boundingBox.max.x, -tg.boundingBox.min.z, tg.boundingBox.max.z);     // the canopy's reach at scale 1
      for (let i = 0; i < 4; i++) {
        const sp = tankSpots[tankSpots.length - 1 - i * 3] || [200 + i * 60, 0, 200];
        const sc = rng.range(0.9, 1.3);
        E.set(0, rng.range(0, TAU), 0); Q.setFromEuler(E);
        const [tx, tz] = standOff(i === 0 ? 96 : sp[0] + 9, i === 0 ? 150 : sp[2] + 7, tR * sc * 1.3 + 12);       // its whole canopy stays clear of the deck
        M4.compose(Pv.set(tx, 0, tz), Q, S.set(sc * 1.3, sc, sc * 1.3)); tm.setMatrixAt(i, M4);
      }
      baz.trees.forEach((t, i) => { E.set(0, nr.range(0, TAU), 0); Q.setFromEuler(E); const [tx, tz] = standOff(t[0], t[1], tR * t[2] + 7); M4.compose(Pv.set(tx, 0, tz), Q, S.set(t[2], t[3], t[2])); tm.setMatrixAt(4 + i, M4); });     // the banyans
      tm.instanceMatrix.needsUpdate = true; scene.add(tm);
      await ctx.yield();
      // ferns and peepal saplings rooted in the brickwork of the parapet and at the feet of the shed's stone piers
      const fg = flora.fernGeometry({ rng: xr.fork('fern'), size: 1.0, detail: 1 });
      await ctx.yield();
      const sg = flora.bushGeometry({ rng: xr.fork('peepal'), size: 1.3, detail: 0, leaf: '#4f7d2c', leafLight: '#86a843' });
      await ctx.yield();
      const spots = [[], []];
      for (let s0 = 16; s0 < 420; s0 += xr.range(9, 19)) {
        const q = stAt(zOfS(s0)); if (q.y < 1) break;
        const side = xr.chance(0.8) ? 1 : -1, lat = side * (10.2 + xr.range(0, 0.25)), kind = xr.chance(0.35) ? 1 : 0;
        spots[kind].push([q.x + lat * q.rx, q.y + 0.93 - (kind ? 0.1 : xr.range(0, 0.2)) - (side > 0 && q.z >= zRailB && q.z <= zRailA ? 0.64 : 0), q.z + lat * q.rz, kind ? xr.range(0.4, 0.75) : xr.range(0.5, 0.95)]);
      }
      for (const px of [-37.5, -12.5, 12.5, 37.5]) for (const dx of [-1.1, 1.1]) { const kind = xr.chance(0.4) ? 1 : 0; spots[kind].push([px + dx + xr.range(-0.2, 0.2), 0.02, 1.2 + xr.range(0, 0.8), kind ? xr.range(0.5, 0.8) : xr.range(0.6, 1)]); }
      [fg, sg].forEach((geo, k) => {
        const m = new THREE.InstancedMesh(geo, leafMat, Math.max(spots[k].length, 1)); m.frustumCulled = false; m.count = spots[k].length;
        spots[k].forEach((sp, i) => { E.set(0, xr.range(0, TAU), 0); Q.setFromEuler(E); M4.compose(Pv.set(sp[0], sp[1], sp[2]), Q, S.set(sp[3], sp[3], sp[3])); m.setMatrixAt(i, M4); });
        m.instanceMatrix.needsUpdate = true; scene.add(m);
      });
    }
    await ctx.yield();
    // grass and weeds between the sleepers of the slow sidings (the kit's carpet, in the same wind as the palms)
    const sidPl = A.sidings.map((pl) => pl.slice().sort((a, b) => a[1] - b[1]));
    const sidX = (pl, z) => {
      const n = pl.length; if (n < 2 || z < pl[0][1] || z > pl[n - 1][1]) return 1e9;
      let i = 1; while (i < n - 1 && pl[i][1] < z) i++;
      const a = pl[i - 1], b = pl[i]; return lerp(a[0], b[0], (z - a[1]) / Math.max(b[1] - a[1], 1e-3));
    };
    let gb = [1e9, 1e9, -1e9, -1e9];
    for (const pl of sidPl) for (const q of pl) gb = [Math.min(gb[0], q[0] - 2), Math.min(gb[1], q[1]), Math.max(gb[2], q[0] + 2), Math.max(gb[3], q[1])];
    const weeds = sidPl.length ? await flora.makeGrassAsync({ rng: xr.fork('weeds'), bounds: gb, count: Math.round(11000 * detail), wind, map: leafMap, heightAt: () => 0.07, align: 0,
      height: [0.26, 0.55], width: [0.45, 0.85], flowers: 0, root: '#27401a', tip: '#71903c', dryAmount: 0.35, fade: [95, 135],
      density: (x, z) => { for (let i = 0; i < sidPl.length; i++) { const d = Math.abs(x - sidX(sidPl[i], z)); if (d < 1.5) return d > 0.72 && d < 0.96 ? 0.2 : 1; } return 0; } }, ctx.yield) : null;
    if (weeds) scene.add(weeds.object);
    await ctx.yield();
    // and a ragged strip of grass down the six-foot between our line and the fast line, from the entry to the throat
    // (irregular tufts with pale tips and bare ballast between them: never a row of dark blobs down the middle of the six-foot)
    const weeds2 = await flora.makeGrassAsync({ rng: qr.fork('sixfoot'), path, uRange: [0.003, 0.475], radius: 0.62, bias: 1.2, count: Math.round(850 * detail), wind, map: leafMap, heightAt: (x, z) => railY(z) + 0.05, align: 0,
      height: [0.09, 0.26], width: [0.18, 0.38], flowers: 0, root: '#55632f', tip: '#c9cd8c', dryAmount: 0.8, fade: [105, 150], chunks: 5,
      density: (x, z) => sstep(0.5, 0.74, ctx.noise.n2(x * 0.09, z * 0.09) * 0.5 + 0.5) * (0.2 + 0.8 * sstep(0.35, 0.65, ctx.noise.n2(x * 0.9 + 7, z * 0.9) * 0.5 + 0.5)) }, ctx.yield);
    scene.add(weeds2.object);
    await ctx.yield();

    // ---- trains: every vehicle is an instance placed on the line each frame from u
    const MAROON = mulc(lin('#6E1F26'), 1.25), CREAM = mulc(lin('#EAD9B0'), 0.8), TEAK = [0.3, 0.14, 0.06], BLK = [0.035, 0.035, 0.04], GRN = [0.03, 0.12, 0.06];
    const locoG = locoGeo();
    await ctx.yield();
    const coachG = coachGeo(rng.fork('coach'));
    await ctx.yield();
    const wagonG = wagonGeo(), wagonRichG = wagonGeo(true);
    await ctx.yield();
    const coachPlainG = coachGeo(r13Coach, false);
    await ctx.yield();
    // The trains are kept in several instanced sets of the same three geometries and one material, so that what cannot be seen
    // is not drawn: locos / coaches / wagons run in sight for the whole flight (the light engine, the express, the goods);
    // the S sets stand or shunt in the throat and the shed; D is the two departures from the shed; R the lit rake in the
    // throat; E the stored vans on the siding nearest the running lines (S, D, R and E are drawn by distance and the fog of
    // the moment: farSeen, below); L the local at the halt and the light engine behind it (put away once they are well
    // behind us); O our own coach, a plain one behind the eye. Of every set, the members further than FAR_LOD metres from
    // the eye are drawn as stand-ins (lodSplit, below).
    const locos = instanced(locoG, surfT, 4), coaches = instanced(coachG, surfT, 4), wagons = instanced(wagonG, surfT, 14);
    const locosS = instanced(locoG, surfT, 4), coachesS = instanced(coachPlainG, surfT, 10), wagonsS = instanced(wagonG, surfT, 70);
    const locosD = instanced(locoG, surfT, 2), coachesD = instanced(coachG, surfT, 8), locosL = instanced(locoG, surfT, 2), coachesL = instanced(coachG, surfT, 3);
    const coachesO = instanced(coachPlainG, surfT, 1), coachesR = instanced(coachG, surfT, 3), wagonsE = instanced(wagonRichG, surfT, 7);
    await ctx.yield();
    const park = (set, c1, c2, w) => set.add(0, -80, 0, 0, 1, 1, 1, c1, c2, w);
    const our = { coach: park(coachesO, mulc(MAROON, 0.7), mulc(CREAM, 0.34), 0) };     // (our own engine propels from 22 m behind the eye and is never in sight: it is not built)
    const lead = { loco: park(locos, cast === 'milk' ? [0.16, 0.03, 0.03] : GRN, null, 0) };
    const rival = { loco: park(locos, cast === 'mail' ? [0.3, 0.032, 0.04] : cast === 'milk' ? [0.04, 0.16, 0.08] : [0.34, 0.045, 0.045], null, 0), cars: [], vans: cast === 'milk' };
    for (let i = 0; i < (rival.vans ? 5 : 3); i++) rival.cars.push(rival.vans ? park(wagons, [0.5, 0.47, 0.38], [0.3, 0.3, 0.31], i === 4 ? 1 : 0) : cast === 'mail' ? park(coaches, [0.33, 0.15, 0.065], [0.36, 0.17, 0.07], i === 2 ? 2 : 1) : park(coaches, [0.4, 0.05, 0.05], CREAM, i === 2 ? 2 : 1));
    const depart = { loco: park(locosD, cast === 'milk' ? BLK : GRN, null, 0), cars: [0, 1, 2, 3].map((i) => park(coachesD, TEAK, TEAK, i === 3 ? 2 : 1)) };
    const WAGC = [[0.3, 0.1, 0.06], [0.2, 0.19, 0.18], [0.24, 0.15, 0.09], [0.12, 0.13, 0.12], [0.33, 0.14, 0.07]];
    const SHEET = [[0.3, 0.3, 0.3], [0.16, 0.17, 0.2], [0.05, 0.15, 0.4], [0.34, 0.3, 0.2]];
    const goods = { loco: park(locos, BLK, null, 0), cars: [0, 1, 2, 3, 4, 5, 6, 7].map(() => park(wagons, rng.pick(WAGC), rng.pick(SHEET), 0)) };
    // the local that stands at the halt as we come in and pulls out past us on the far line; the shunter at work in the yard
    const local2 = { loco: park(locosL, [0.2, 0.035, 0.035], null, 0), cars: [0, 1, 2].map((i) => park(coachesL, mulc(MAROON, 0.95), CREAM, i === 2 ? 2 : 1)) };
    const shunt = { loco: park(locosS, [0.03, 0.09, 0.05], null, 0), cars: [0, 1].map((i) => park(wagonsS, WAGC[i + 1], SHEET[i], i === 1 ? 1 : 0)) };
    // round sixteen: a light engine that waits behind the local on the far line and follows it out, and a second departure
    // from the shed, a maroon stopping train on the next platform road that follows the express out; each keeps one
    // headway (HEADWAY metres) behind the tail lamp ahead of it
    const lightE = park(locosL, [0.2, 0.035, 0.035], null, 0);
    const depart2 = { loco: park(locosD, [0.2, 0.035, 0.035], null, 0), cars: [0, 1, 2, 3].map((i) => park(coachesD, MAROON, CREAM, i === 3 ? 2 : 1)) };
    // steam, smoke and spray: emitters 0 ours, 1 rival, 2 the halt's local then the departing express, 3 goods then the shunter,
    // 4 still air, 5 the wind, 6 fresh sun on wet roofs
    const puffs = makeSprites({ aP: 4, aVel: 4, aTn: 1 });
    const puff = (x, y, z, e, life, s0, grow, vx, vy, vz, tn) => puffs.add(x, y, z, { aP: [rng(), 1 / life, s0, grow], aVel: [vx, vy, vz, e], aTn: [tn] });
    for (let i = 0; i < 120; i++) puff(rng.range(-0.15, 0.15), 0, rng.range(-0.15, 0.15), 0, rng.range(4, 5), 1.0, 4.4, rng.range(-0.7, 0.1), rng.range(1.2, 2), 0, (HR.lamp ? [0.8, 0.3, 0.2, 0.45, 0.25, 0.3] : [0.95, 0.4, 0.22, 0.3])[i % (HR.lamp ? 6 : 4)]);     // ours: steam and coal smoke rolling back over the roof and the door (the smoke is what reads against the pearl sky)
    for (const e of [1, 2]) for (let i = 0; i < 40; i++) puff(rng.range(-0.2, 0.2), 0, rng.range(-0.2, 0.2), e, rng.range(2.8, 3.8), 1, 6.5, rng.range(-0.5, 0.5), rng.range(1.6, 2.8), 0, 1);
    for (let i = 0; i < 22; i++) puff(rng.range(-0.2, 0.2), 0, rng.range(-0.2, 0.2), 3, rng.range(2.8, 3.8), 1, 6, rng.range(-0.5, 0.5), rng.range(1.6, 2.6), 0, 1);
    for (let i = 0; i < 8; i++) { const sx = i % 2 ? 1 : -1; puff(sx * 1.4, -3.2, 0.6, 1, rng.range(0.7, 1), 0.25, 1.8, sx * rng.range(1.5, 3), rng.range(0.3, 1), 0, 1); }     // the rival's cylinder cocks
    for (let i = 0; i < 16; i++) { const sx = i % 2 ? 1 : -1, zz = 1 + (i >> 1) * 1.9; puffs.add(sx * 1.35 + 0.22 * zz, -3.75, zz, { aP: [nr(), 1 / (0.55 + 0.06 * (i % 5)), 0.3, 1.5], aVel: [sx * (1.2 + 0.3 * (i % 3)) + 0.5, 0.5 + 0.2 * (i % 4), 0, 1], aTn: [0.6] }); }     // wheel spray, low and grey, along the engine and tender
    if (rare) {                                               // the flooded line: wings of spray off the express, and off our own wheels past the door
      for (let i = 0; i < 60; i++) { const sx = i % 2 ? 1 : -1; puff(sx * 1.5, -3.6, -1, 1, rng.range(0.9, 1.5), 0.8, 3.6, sx * rng.range(2.5, 6), rng.range(1.5, 4), 0, 1); }
      for (let i = 0; i < 26; i++) puff(1.5, -3.3, rng.range(0, 3), 7, rng.range(1.2, 1.8), 0.35, 1.7, rng.range(1.5, 3.5), rng.range(0.8, 2), 0, 0.85);
    }
    {                                                         // emitters 8 (the second departure) and 9 (the light engine: a wisp from a shut regulator), from a hash of their own
      const hp = (i, k) => { const v = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return v - Math.floor(v); };
      for (let i = 0; i < 40; i++) puffs.add((hp(i, 1) - 0.5) * 0.4, 0, (hp(i, 2) - 0.5) * 0.4, { aP: [hp(i, 3), 1 / (2.8 + hp(i, 4)), 1, 6.5], aVel: [hp(i, 5) - 0.5, 1.6 + 1.2 * hp(i, 6), 0, 8], aTn: [1] });
      for (let i = 0; i < 16; i++) puffs.add((hp(i, 7) - 0.5) * 0.3, 0, (hp(i, 8) - 0.5) * 0.3, { aP: [hp(i, 9), 1 / (1.2 + 0.6 * hp(i, 10)), 0.3, 1.3], aVel: [(hp(i, 11) - 0.5) * 0.5, 0.3 + 0.4 * hp(i, 12), 0, 9], aTn: [1] });     // (it trails low over the cab and tender: none of it climbs into the palms behind)
    }
    await ctx.yield();
    // standing engines and stored stock: at the buffers of other roads, and wagons on the sidings
    const standing = A.standingEngines.filter((e) => Math.abs(e.position.x - 6.4) > 1.5 && Math.abs(e.position.x + 9.9) > 1.5 && Math.abs(e.position.x) > 6).sort((a, b) => Math.abs(a.position.x) - Math.abs(b.position.x)).slice(0, 3);
    standing.forEach((e, k) => {
      const x = e.position.x, z0 = e.position.z - 4;
      locosS.add(x, 0, z0 + 9.2, 0, 1, 1, 1, k === 1 ? GRN : BLK, null, rng.range(0, TAU));
      for (let c = 0; c < 2 + (k % 2); c++) coachesS.add(x, 0, z0 + 9.2 + 8.5 + 0.7 + 7 + c * 14.7, 0, 1, 1, 1, k === 0 ? TEAK : MAROON, k === 0 ? TEAK : CREAM, c === 1 + (k % 2) ? 2 : 1);
      for (let i = 0; i < 16; i++) puff(x + rng.range(-0.2, 0.2), 4.2, z0 + 1.35, 4, rng.range(3.5, 5), 0.7, 4.4, rng.range(-0.25, 0.25), rng.range(0.9, 1.5), rng.range(-0.1, 0.4), 1);
      for (let i = 0; i < 6; i++) puff(x, 3.85, z0 + 6.5, 4, rng.range(0.7, 1.1), 0.12, 1.3, rng.range(-0.4, 0.4), rng.range(3, 4.5), 0, 1);
    });
    // steam hanging under the shed roof beside our road, turning slowly through the shafts
    for (let i = 0; i < 30; i++) { const sx = i % 3 ? 1 : -1; puff(sx > 0 ? rng.range(6.5, 13) : rng.range(-13, -7.5), rng.range(4, 8.5), rng.range(-122, -8), 4, rng.range(7, 10), 1.6, 4.2, rng.range(-0.25, 0.25), rng.range(0.15, 0.4), rng.range(0.2, 0.7), 0.9); }
    // (the vans built in full, wagonsE, are the stored stock that stands nearest the running lines: the first seven wagons of
    // the siding whose buffers are nearest our road; the rest of the sidings' wagons are the plain ones)
    const sidingNear = A.sidings.reduce((b, pl) => (Math.abs(pl[pl.length - 1][0]) < Math.abs(b[b.length - 1][0]) ? pl : b), A.sidings[0]);
    let nearVans = 0;
    for (const pl of A.sidings) {
      let acc = 0, next = rng.range(4, 30);
      for (let i = 0; i < pl.length - 1; i++) {
        const a = pl[i], b = pl[i + 1], sl = Math.hypot(b[0] - a[0], b[1] - a[1]);
        while (next < acc + sl) {
          const t = (next - acc) / sl, x = lerp(a[0], b[0], t), z = lerp(a[1], b[1], t);
          if (Math.abs(x) > 9 && z < pl[0][1] - 44) (pl === sidingNear && nearVans < 7 ? (nearVans++, wagonsE) : wagonsS).add(x, 0, z, Math.atan2(-(b[0] - a[0]), -(b[1] - a[1])), 1, rng.chance(0.3) ? 0.72 : 1, 1, rng.pick(WAGC), rng.pick(SHEET), 0);
          next += rng.chance(0.75) ? 6.5 : rng.range(14, 40);
        }
        acc += sl;
      }
    }
    await ctx.yield();
    {
      // standing rakes in the throat, two and three roads either side of us: teak coaches with their lamps lit on the right, a
      // string of vans on the left
      const trackYaw = (r, z) => Math.atan2(-(A.trackXAt(r, z - 2) - A.trackXAt(r, z + 2)), 4);
      [142, 127.3, 112.6].forEach((z, i) => coachesR.add(A.trackXAt(12, z), 0, z, trackYaw(12, z), 1, 1, 1, TEAK, TEAK, i === 0 ? 2 : 1));
      for (let z = 88, i = 0; z < 141; z += 6.5, i++) wagonsS.add(A.trackXAt(6, z), 0, z, trackYaw(6, z), 1, zr.chance(0.3) ? 0.72 : 1, 1, zr.pick(WAGC), zr.pick(SHEET), z > 139 ? 1 : 0);
      // safety valves feathering on the two engines that end the journey beside us in the shed, and the mill's smoke
      for (const e of [0, 1]) for (let i = 0; i < 7; i++) puffs.add(0, -0.4, 3.0, { aP: [zr(), 1 / zr.range(0.7, 1.1), 0.12, 1.3], aVel: [zr.range(-0.4, 0.4), zr.range(3, 4.5), 0, e], aTn: [1] });
      if (millChim) for (let i = 0; i < 22; i++) puffs.add(millChim[0] + zr.range(-0.6, 0.6), millChim[1] + 1, millChim[2] + zr.range(-0.6, 0.6), { aP: [zr(), 1 / zr.range(8, 11), 3, 17], aVel: [zr.range(-0.5, 0.5), zr.range(2.6, 3.6), zr.range(-0.5, 0.5), 5], aTn: [0.2] });
    }
    // the smoke of the chawls' cooking fires, bent by the wind, and three wisps from the gang's brazier of a lamp
    for (const pt of potSpots) for (let i = 0; i < 5; i++) puffs.add(pt[0], pt[1], pt[2], { aP: [r13Smoke(), 1 / r13Smoke.range(3, 4.6), 0.3, 2.4], aVel: [r13Smoke.range(-0.15, 0.15), r13Smoke.range(0.7, 1.1), r13Smoke.range(-0.15, 0.15), 5], aTn: [0.42] });
    const trainSets = [locos, coaches, wagons, locosS, coachesS, wagonsS, wagonsE, locosD, coachesD, locosL, coachesL, coachesO, coachesR];
    for (const set of trainSets) { set.done(); await ctx.yield(); }
    // what is drawn of a kind: one drawn copy for each shape among its sets and one set of stand-ins, each large enough
    // for every member that can come to it
    const lodKind = (geo, m, sets) => {
      const lo = instanced(geo, m, sets.reduce((n, q) => n + q.count, 0)), draws = [];
      for (const set of sets) {
        let d = draws.find((q) => q.base === set.base);
        if (!d) { d = instanced(set.base, m, sets.reduce((n, q) => n + (q.base === set.base ? q.count : 0), 0)); d.mesh.count = 0; d.n = 0; draws.push(d); scene.add(d.mesh); }
        set.draw = d;
      }
      lo.mesh.count = 0; scene.add(lo.mesh); return { lo, sets, draws };
    };
    const lodKinds = [lodKind(locoLoGeo(), surfT, [locos, locosS, locosD, locosL]), lodKind(coachLoGeo(), surfT, [coaches, coachesS, coachesD, coachesL, coachesO, coachesR]),
      lodKind(wagonLoGeo(), surfT, [wagons, wagonsS, wagonsE]), lodKind(personLoGeo(), surfF, [folk, folkA, folkFar])];
    await ctx.yield();
    // chimney smoke (flattened by the gust, then rising straight) and steam off the hot wet roofs
    chimneys.slice().sort((a, b) => Math.hypot(a[0] - 80, a[2] - 380) - Math.hypot(b[0] - 80, b[2] - 380)).slice(0, 6).forEach((c) => {
      for (let i = 0; i < 22; i++) puff(c[0] + rng.range(-0.6, 0.6), c[1] + 1, c[2] + rng.range(-0.6, 0.6), 5, rng.range(8, 11), 3, 17, rng.range(-0.5, 0.5), rng.range(2.6, 3.6), rng.range(-0.5, 0.5), 0.2);
    });
    for (let i = 0; i < 64; i++) { const side = rng.chance(0.6) ? 1 : -1; puff(side > 0 ? rng.range(58, 190) : rng.range(-210, -84), rng.range(4, 6.5), rng.range(-110, 330), 6, rng.range(6, 9), 2, 5.5, rng.range(-0.3, 0.3), rng.range(0.5, 0.9), rng.range(-0.3, 0.3), 0.62); }     // (a quiet tone: under the sun it must not add up to a glare)
    if (baz.flue) for (let i = 0; i < 4; i++) puffs.add(baz.flue[0], baz.flue[1], baz.flue[2], { aP: [nr(), 1 / nr.range(2.5, 3.5), 0.2, 1.6], aVel: [0, 0.8, 0, 4], aTn: [0.35] });
    await ctx.yield();
    add(puffs.build(), mat(PUFF_VERT, PUFF_FRAG, { transparent: true, depthWrite: false }), 4, false);
    await ctx.yield();

    // ---- the rain itself
    const rainNear = fx.makeParticles({ rng: rng.fork('rain1'), preset: 'rain', count: Math.round(9000 * detail), velocity: [NX * 5, -24, NZ * 5], time: HU.uTime });
    await ctx.yield();
    const rainMid = fx.makeParticles({ rng: ctx.core.makeRng('cl-rain3:' + ctx.seed), preset: 'rain', count: Math.round(4000 * detail), box: [60, 40, 60], size: [0.03, 0.07], velocity: [NX * 5, -23, NZ * 5], near: [3, 12], time: HU.uTime });
    await ctx.yield();
    const rainFar = fx.makeParticles({ rng: rng.fork('rain2'), preset: 'rain', count: Math.round(5000 * detail), box: [160, 70, 160], size: [0.05, 0.1], velocity: [NX * 5, -22, NZ * 5], near: [6, 30], time: HU.uTime });
    rainNear.setOpacity(0); rainFar.setOpacity(0); rainMid.setOpacity(0);
    scene.add(rainNear.object, rainMid.object, rainFar.object);
    await ctx.yield();
    {
      const sp = makeSprites({ aS: 4 }), n = Math.round(1500 * detail);
      for (let i = 0; i < n; i++) {
        const a = [rng(), rng(), i < n * 0.6 ? 0 : 1, rng()]; sp.add(0, 0, 0, { aS: a });
        if (i < n * 0.3) sp.add(0, 0, 0, { aS: [a[0], a[1], 2, a[3]] });                       // a crown standing on the ring
      }
      add(sp.build(), mat(SPLASH_VERT, SPLASH_FRAG, { transparent: true, depthWrite: false, side: THREE.DoubleSide }), 2, false);
      await ctx.yield();
      const P = [], Sh = [], I = [];
      for (let i = 0; i < 7; i++) { const n0 = i * 4; P.push(-1, 0, 0, 1, 0, 0, 1, 1, 0, -1, 1, 0); Sh.push(...Array(4).fill(-0.03 + i * 1.06 / 6)); I.push(n0, n0 + 1, n0 + 2, n0, n0 + 2, n0 + 3); }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setAttribute('aSheet', new THREE.Float32BufferAttribute(Sh, 1)); geo.setIndex(I);
      add(geo, mat(VEIL_VERT, VEIL_FRAG, { transparent: true, depthWrite: false, side: THREE.DoubleSide }), 2, false);
    }
    await ctx.yield();
    {
      const sp = makeSprites({ aS: 4, aCol: 3 }), n = Math.round(300 * detail);
      const LEAFC = [[0.12, 0.17, 0.04], [0.26, 0.18, 0.05], [0.33, 0.27, 0.1], [0.08, 0.12, 0.04], [0.5, 0.48, 0.42]];
      for (let i = 0; i < n; i++) { const w = rng(); sp.add(0, 0, 0, { aS: [rng(), rng(), rng(), w], aCol: w > 0.82 ? [0.4, 0.36, 0.3] : rng.pick(LEAFC) }); }
      add(sp.build(), mat(LEAF_VERT, LEAF_FRAG, { transparent: true, depthWrite: false, side: THREE.DoubleSide }), 3, false);
    }
    const ropeMat = (o) => mat(ROPE_VERT, ROPE_FRAG, { transparent: true, depthWrite: false, side: THREE.DoubleSide, ...o });
    await ctx.yield();
    add(ropes.build(), ropeMat({}), 3, false);
    await ctx.yield();
    if (HR.lamp) for (const t of roofTops) glow(t[0], t[1] - 0.6, t[2], WARM, WARM, 2, 0.55);
    glows.add(A.finial.x, A.finial.y - 1.2, A.finial.z, { aColA: [0, 0, 0], aColB: mulc(AF.sun, 0.9), aSw: [shower ? -1 : uClear + 0.012, 0.37, 0.9, 0] });     // the gilt finial takes the first sun
    const glowMat = mat(GLOW_VERT, GLOW_FRAG, { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    add(glows.build(), glowMat, 6, false);
    // lamp-lit carriage windows: a soft halo at each lit bay and its long streak in the wet beside the train (out with the sun)
    const winSp = makeSprites({ aColA: 3, aColB: 3, aSw: 4 });
    for (const zc of [-6, 0, 6]) {                             // (aSw.x -2: they follow the carriage lamps, lit in the rain and at dusk)
      winSp.add(-1.5, 2.95, zc, { aColA: [0.36, 0.165, 0.05], aColB: [0.36, 0.165, 0.05], aSw: [-2, 0.3 + zc * 0.05, 0.62, 0] });
      winSp.add(-1.5, 2.3, zc, { aColA: [3.4, 1.6, 0.48], aColB: [3.4, 1.6, 0.48], aSw: [-2, 0.6 + zc * 0.05, 0.85, 1000] });
    }
    const winGeo = winSp.build();
    const winMesh = () => { const m = new THREE.Mesh(winGeo, glowMat); m.frustumCulled = false; m.renderOrder = 6; m.matrixAutoUpdate = false; scene.add(m); return m; };
    const winR = rival.vans ? [] : [winMesh(), winMesh(), winMesh()], winL = [winMesh(), winMesh(), winMesh()];
    await ctx.yield();
    const entryMesh = add(await gNear.buildAsync(ctx.yield), surf, 0, false);
    add(await gThroat.buildAsync(ctx.yield), surf, 0, false);
    add(await gFar.buildAsync(ctx.yield), surf, 0, false);
    if (rare) {
      // a hand's depth: over the sleepers and the ballast, under the rail heads, and drawn before the track ribbons
      const geo = new THREE.PlaneGeometry(125, 303, 1, 1).rotateX(-Math.PI / 2).translate(-12.5, 0.16, 152.5);
      add(geo, mat(FLAT_VERT, FLOOD_FRAG, { transparent: true, depthWrite: true }), 0.5, false);
    }

    await ctx.yield();
    // ---- our own doorway, carried with the camera
    const door = new THREE.Group();
    {
      const m = new THREE.Mesh(doorGeo({ maroon: MAROON, cream: CREAM, brass: C.brass }), surfD); m.frustumCulled = false; door.add(m);
      const sp = makeSprites({ aR: 4 });
      sp.add(doorGeo.gutter[0], doorGeo.gutter[1], doorGeo.gutter[2], { aR: [0.6, 0.008, rng(), 0] });
      const localRope = ropeMat({ defines: { LOCAL: 1 } });
      const rm = new THREE.Mesh(sp.build(), localRope); rm.frustumCulled = false; rm.renderOrder = 5; door.add(rm);
      scene.add(door);
    }
    await ctx.yield();

    // ---- birds
    const FL = { sunDir: HR.sun, sunColor: '#ffffff', sunIntensity: 1, sky: '#8090a0', skyIntensity: 1, ground: '#404040', groundIntensity: 1 };
    const fauna = F.makeFauna(scene, { light: FL });
    const flocks = [];
    const flock = (o) => { const f = fauna.add(F.makeFlock(o)); flocks.push(f); return f; };
    await ctx.yield();
    flock({ rng: rng.fork('crows'), species: 'crows', count: Math.round(34 * plenty), spread: [30, 5, 30], wander: [4, 2, 4, 0.4], maxSigma: 3, cross: { path, u: (shower ? 0.2 : uFront) - 0.035, lead: 70, span: 330, angle: 65, side: 1, height: 18.3, rise: 26, duration } });
    await ctx.yield();
    flock({ rng: rng.fork('crows0'), species: 'crows', count: 16, spread: [30, 5, 30], wander: [4, 2, 4, 0.4], maxSigma: 3, center: [146, 28, 660], radius: 15, height: 4 });     // wheeling over the first chawl
    const g1 = A.gantries[1] || A.gantries[0];
    await ctx.yield();
    flock({ rng: rng.fork('crows2'), species: 'crows', count: 9, spread: [30, 5, 30], wander: [4, 2, 4, 0.4], maxSigma: 3, center: [-6, g1.y1 + 11, g1.z], radius: 24, height: 4 });
    await ctx.yield();
    flock({ rng: rng.fork('kites1'), species: 'eagles', count: 5, size: 1.25, center: [pathX(420) + 190, 85, 400], radius: 90 });
    await ctx.yield();
    flock({ rng: rng.fork('kites2'), species: 'eagles', count: 4, size: 1.25, center: [260, 110, 20], radius: 110 });
    await ctx.yield();
    // Where the birds cross the line. A flock's line of flight reaches some metres along the railway either side of the
    // place where it crosses (half its span at its angle to the rails, and its bow): reachOf. Under the shed the pigeons go
    // over in three flocks, one after another along the whole run from the gable valance to our buffers (less the longest
    // reach, so that no flock flies into the end wall): the run is cut in three, the first flock crosses somewhere in the
    // first third as the seed has it, and each later one 0.7 to 1.0 of a third beyond the one before. Each is over the
    // rails when the cab is BIRD_LEAD metres short of the place: one lead for all three.
    const GABLE_S = 739.7, BIRD_LEAD = 20, crossAt = (sP, c) => ({ path, u: (sP - c.lead) / LEN, duration, ...c });
    const reachOf = (c) => c.span / 2 * Math.abs(Math.cos(c.angle * Math.PI / 180)) + c.span * 0.06;
    const PIG = [{ lead: BIRD_LEAD, span: 80, angle: 80, side: -1, height: 7.8, rise: 4 }, { lead: BIRD_LEAD, span: 70, angle: 100, side: 1, height: 8.5, rise: -2 }, { lead: BIRD_LEAD, span: 56, angle: 78, side: -1, height: 6.8, rise: 3 }];
    const birdPitch = (LEN - Math.max(...PIG.map(reachOf)) - GABLE_S) / 3;
    const sPig1 = GABLE_S + birdPitch * r17Birds(), sPig2 = sPig1 + birdPitch * r17Birds.range(0.7, 1), sPig3 = sPig2 + birdPitch * r17Birds.range(0.7, 1);
    // The flamingos cross once, at a moment the seed draws over the whole of the open throat: any moment from the cab's
    // passing the foot of the viaduct's bank (z 305, where the line is down at the yard's level: railY) to the last at which their whole line of flight still
    // lies short of the shed's gable. They are over the rails 75 m ahead of the cab.
    const FLAM = { lead: 75, span: 420, angle: 74, side: 1, height: 13 };
    const sFlam = lerp(GABLE_S - 305, GABLE_S - reachOf(FLAM) - FLAM.lead, r17Flam()) + FLAM.lead;
    const pigeons = [flock({ rng: rng.fork('pigeons'), species: 'gulls', count: Math.round(60 * plenty), size: 0.9, speed: 11, body: '#8a8e96', belly: '#e9e6dc', wingC: '#6a6d76', spread: [12, 2, 20], wander: [5, 1, 4, 0.35], maxSigma: 3,
      cross: crossAt(sPig1, PIG[0]) })];
    await ctx.yield();
    pigeons.push(flock({ rng: xr.fork('pigeons2'), species: 'gulls', count: Math.round(34 * plenty), size: 0.85, speed: 12, body: '#8a8e96', belly: '#e9e6dc', wingC: '#6a6d76', spread: [9, 3, 14], wander: [5, 1, 4, 0.35], maxSigma: 3,
      cross: crossAt(sPig2, PIG[1]) }));
    await ctx.yield();
    pigeons.push(flock({ rng: xr.fork('pigeons3'), species: 'gulls', count: Math.round(26 * plenty), size: 0.8, speed: 10, body: '#8a8e96', belly: '#e9e6dc', wingC: '#6a6d76', spread: [8, 1.5, 12], wander: [5, 1, 4, 0.35], maxSigma: 3,
      cross: crossAt(sPig3, PIG[2]) }));
    await ctx.yield();
    pigeons.push(flock({ rng: zr.fork('pigeons4'), species: 'gulls', count: Math.round(44 * plenty), size: 1.0, speed: 9, body: '#8a8e96', belly: '#e9e6dc', wingC: '#6a6d76', spread: [34, 5, 34], wander: [5, 1, 4, 0.35], maxSigma: 3,
      center: [0, 16.3, -30], radius: 18, height: 2 }));       // the residents: they wheel under the roof whether the train moves or not
    await ctx.yield();
    if (flamingos) flock({ rng: rng.fork('flamingos'), species: 'flamingos', count: 24, cross: crossAt(sFlam, FLAM) });
    await ctx.yield();

    // ---- per-frame state (nothing below allocates)
    const BEF = { sky: HR.overc, hor: mulc(HR.overc, 0.95), amb: mulc(HR.overc, 1.25), gnd: mulc(HR.overc, 0.3), fill: [0.05, 0.06, 0.09], fog: mulc(HR.overc, 0.92) };
    const rk = HR.lamp ? 0.75 : hourId === 'noon' ? 1.15 : 1;
    // (the rain is a dark blue-grey, so lamps, lit windows and lightning carry the picture; the wet ground mirrors the pale slot under the cloud)
    const RAINS = { sky: mulc(RAINCOL, rk * 0.85), hor: mulc(RAINCOL, rk * 1.7), amb: mulc([0.4, 0.5, 0.66], rk * 0.84), gnd: mulc([0.13, 0.16, 0.21], rk * 0.84), fill: [0.03, 0.05, 0.09], fog: mulc(RAINCOL, rk * 0.45) };
    skyU.uRainCol.value.fromArray(RAINS.fog).multiplyScalar(1.15);
    const cur = { amb: [0, 0, 0], gnd: [0, 0, 0], fog: [0, 0, 0] };
    const blend = (out, key, kA, kI) => { const a = BEF[key], b = AF[key], c = RAINS[key]; for (let i = 0; i < 3; i++) out[i] = lerp(lerp(a[i], b[i], kA), c[i], kI); return out; };
    const blendU = (un, key, kA, kI) => { const a = BEF[key], b = AF[key], c = RAINS[key]; un.value.set(lerp(lerp(a[0], b[0], kA), c[0], kI), lerp(lerp(a[1], b[1], kA), c[1], kI), lerp(lerp(a[2], b[2], kA), c[2], kI)); };
    const setC = (v, r, g, b) => { if (v.isColor) v.setRGB(r, g, b); else v.set(r, g, b); };
    const camPos = new THREE.Vector3(), headV = new THREE.Vector3(), size = new THREE.Vector2();
    const VM = new THREE.Matrix4(), VX = new THREE.Vector3(), VY = new THREE.Vector3(), VZ = new THREE.Vector3(), VP = new THREE.Vector3(), VS = new THREE.Vector3(), VF = new THREE.Vector3();
    const QE = new THREE.Euler(), QQ = new THREE.Quaternion(), ONE = new THREE.Vector3(1.7, 1.7, 1.7);
    const sw = { a1: 0.05, v1: 0, a2: -0.04, v2: 0 };
    const offAt = (road, z) => { const zc = Math.min(z, 295); return A.trackXAt(road, zc) - pathX(zc); };
    // put an instance on the line: its centre s metres along the path, on a hero road (or a fixed offset when road < 0)
    const onLine = (set, idx, s, road, off, sx, sy, sz, flip) => {
      path.posAtDist(s, VP); path.tangentAtDist(s, VF);
      let o = off, skew = 0;
      if (road >= 0) { o = offAt(road, VP.z) + off; skew = (offAt(road, VP.z - 1.5) - offAt(road, VP.z + 1.5)) / 3; }
      const rl = Math.hypot(VF.x, VF.z) || 1, rx = -VF.z / rl, rz = VF.x / rl;
      VP.x += o * rx; VP.z += o * rz; VP.y -= EYE;
      VF.x += skew * rx; VF.z += skew * rz; VF.normalize();
      if (flip) { VX.set(-rx, 0, -rz); VZ.copy(VF); } else { VX.set(rx, 0, rz); VZ.copy(VF).negate(); }
      VY.crossVectors(VZ, VX).normalize(); VX.crossVectors(VY, VZ).normalize();
      VM.makeBasis(VX, VY, VZ).scale(VS.set(sx, sy, sz)).setPosition(VP);
      set.mesh.setMatrixAt(idx, VM);
    };
    // What can be seen at a distance: a thing d metres off through fog of density k keeps exp(-(k d)^2) of its contrast against
    // the fog. While that is under about a ten-thousandth (k d > 3: even a lit lamp is lost) it is not drawn; in clear air
    // everything far is drawn.
    const farSeen = (d) => scene.fog.density * d < 3;
    const nearZ = (set, reach) => { const M = set.mesh.instanceMatrix.array; let m = reach; for (let i = 0; i < set.mesh.count; i++) if (M[i * 16 + 13] > -40) m = Math.max(m, M[i * 16 + 14]); return m + 8; };     // the z of the set's vehicle nearest the country end (reach: how far its moving ones come)
    const farSets = [[locosS, nearZ(locosS, 192)], [coachesS, nearZ(coachesS, -1e9)], [wagonsS, nearZ(wagonsS, 211)], [coachesR, nearZ(coachesR, -1e9)], [wagonsE, nearZ(wagonsE, -1e9)]];
    const folkFarZ = nearZ(folkFar, -1e9), locosN = locos.count, wagonsN = wagons.count;
    // What is drawn of every set of vehicles and figures (see lodKind, above): each member that is in use goes whole into its
    // shape's drawn copy if it stands within FAR_LOD metres of the eye (true distance, eye to its middle), and into its kind's
    // stand-ins if it is further. A set that is not shown at all (by the rules below) gives neither, and a member whose
    // middle is more than BEHIND metres behind the plane of the picture (no vehicle reaches 10 m from its middle) is in no
    // picture and is left out.
    const FAR2 = FAR_LOD * FAR_LOD, BEHIND = 20;
    const lodSplit = (camera) => {
      const ex = camPos.x, ey = camPos.y, ez = camPos.z, cm = camera.matrixWorld.elements, fx = -cm[8], fy = -cm[9], fz = -cm[10];
      for (let k = 0; k < lodKinds.length; k++) {
        const lo = lodKinds[k].lo, sets = lodKinds[k].sets, draws = lodKinds[k].draws, LM = lo.mesh.instanceMatrix.array; let nl = 0;
        for (let j = 0; j < draws.length; j++) draws[j].n = 0;
        for (let j = 0; j < sets.length; j++) {
          const set = sets[j], dr = set.draw, SM = set.mesh.instanceMatrix.array, DM = dr.mesh.instanceMatrix.array;
          if (set.mesh.visible) for (let i = 0, n = set.mesh.count; i < n; i++) {
            const o = i * 16;
            if (SM[o + 13] < -40 || (SM[o] === 0 && SM[o + 1] === 0 && SM[o + 2] === 0)) continue;      // put away: under the ground, or of no size
            const dx = SM[o + 12] - ex, dy = SM[o + 13] - ey, dz = SM[o + 14] - ez, far = dx * dx + dy * dy + dz * dz > FAR2;
            if (dx * fx + dy * fy + dz * fz < -BEHIND) continue;
            const TM = far ? LM : DM, T1 = far ? lo.t1 : dr.t1, TI = far ? lo.ai : dr.ai, t = far ? nl++ : dr.n++;
            for (let q = 0; q < 16; q++) TM[t * 16 + q] = SM[o + q];
            T1[t * 3] = set.t1[i * 3]; T1[t * 3 + 1] = set.t1[i * 3 + 1]; T1[t * 3 + 2] = set.t1[i * 3 + 2];
            TI[t * 4] = set.ai[i * 4]; TI[t * 4 + 1] = set.ai[i * 4 + 1]; TI[t * 4 + 2] = set.ai[i * 4 + 2]; TI[t * 4 + 3] = set.ai[i * 4 + 3];
          }
        }
        for (let j = 0; j < draws.length; j++) {
          const dr = draws[j];
          if (dr.n > 0 || dr.mesh.count > 0) { dr.mesh.instanceMatrix.needsUpdate = true; dr.aT1.needsUpdate = true; dr.aI.needsUpdate = true; }
          dr.mesh.count = dr.n;
        }
        if (nl > 0 || lo.mesh.count > 0) { lo.mesh.instanceMatrix.needsUpdate = true; lo.aT1.needsUpdate = true; lo.aI.needsUpdate = true; }
        lo.mesh.count = nl;
      }
    };
    const emit = (e, speed, alpha) => {                       // after onLine for a locomotive: its chimney leads emitter e
      VP.set(0, 4.25, -7.85).applyMatrix4(VM); X.uEP.value[e].copy(VP);
      X.uEV.value[e].set(VZ.x * speed + NX * 1.5, 0, VZ.z * speed + NZ * 1.5, alpha);
    };
    const onRoad = (set, idx, road, z) => {                    // a vehicle on a road of the throat, heading in (toward -z)
      VF.set(A.trackXAt(road, z - 1.5) - A.trackXAt(road, z + 1.5), 0, -3).normalize();
      VX.set(-VF.z, 0, VF.x); VZ.copy(VF).negate(); VY.set(0, 1, 0);
      VM.makeBasis(VX, VY, VZ).setPosition(A.trackXAt(road, z), 0, z); set.mesh.setMatrixAt(idx, VM);
    };
    const rainU = [rainNear.uniforms, rainFar.uniforms, rainMid.uniforms];
    const domeAt = A.dome.clone(), heroPlat = hero.object.getObjectByName('platforms');
    const flashAt = (u, u1) => sstep(u1, u1 + 0.0024, u) * (1 - sstep(u1 + 0.0024, u1 + 0.0115, u));
    // sheet lightning: a glow deep in the cloud that rises in a tenth of a second and dies over one (the scene as a whole lifts
    // far less, and briefly), each in its own part of the sky.
    const glowAt = (u, u1) => sstep(u1, u1 + 0.0024, u) * (1 - sstep(u1 + 0.004, u1 + 0.028, u));
    // the fork itself: up in a tenth of a second, fading out over the rest of one second
    const boltAt = (u, u1) => sstep(u1, u1 + 0.0024, u) * (1 - sstep(u1 + 0.0035, u1 + 0.0256, u));
    // each flash stands at a fixed bearing: the heading at its moment plus an offset from a table of eight, all in the half of
    // the sky ahead (the gaze rides about twelve degrees right of the rails). [u, bearing, sin elevation, flash weight, seed]
    const headAt = (u) => { path.tangentAt(clamp(u, 0, 1), tv2); return Math.atan2(tv2.x, -tv2.z); };
    const domeAzAt = (u) => { path.pointAt(clamp(u, 0, 1), tv2); return Math.atan2(A.dome.x - tv2.x, -(A.dome.z - tv2.z)); };
    // The storm keeps one beat. Its first flash comes soon after the gust front, at a moment the seed draws (0.03 to 0.08 of
    // the journey after it); every later one follows 2.0 s after the one before, as the journey is flown (so never two inside
    // two seconds). While we are in the rain each beat throws a fork, which stands for a second before it has faded: there
    // is one in the sky about half the time. As the storm draws off the beat goes on, and the wall flickers on every second
    // one of it, twice (no fork stands against a blue sky).
    // In the late band, where the rain thins and the dome is seen through it (the stretch domeThin, below), every other fork
    // stands behind the dome.
    const domeThin = (u) => sstep(0.5, 0.56, u) * (1 - sstep(0.8, 0.86, u));
    const FLS = [], FLA = [], beat = (u1) => 2.0 * paceF(u1) * paceC / duration, domePar = r17Dome.chance(0.5) ? 1 : 0;
    let uBeat = uFront + 0.03 + 0.05 * r17Storm();
    for (let k = 0, kd = domePar; uBeat < uClear - 0.03 && k < 24; k++, uBeat += beat(uBeat)) {
      let az = headAt(uBeat) + [-0.12, 0.55, 0.22, -0.3, 0.7, 0.05, 0.42, -0.05][k % 8], el = [0.3, 0.42, 0.24, 0.36, 0.3, 0.4, 0.27, 0.34][k % 8];
      if (weather === 'late' && domeThin(uBeat) > 0.5 && kd++ % 2 === 0) { az = domeAzAt(uBeat) + 0.11; el = 0.3; }
      FLS.push([uBeat, az, el, k % 2 ? 0.45 : 1, 1.3 + k * 2.17]);
    }
    if (!shower) for (let j = 1; j <= 4; j++, uBeat += beat(uBeat)) if (j % 2 === 0) FLA.push([uBeat, headAt(uBeat) - (j === 2 ? 0.5 : 0.95), j === 2 ? 0.2 : 0.24, 0, j === 2 ? 37.3 : 51.9]);
    const dAfter = HR.lamp ? 0.001 : 0.0007;

    const update = (dt, time, camera, u) => {
      camPos.setFromMatrixPosition(camera.matrixWorld);
      const preview = u <= 0;
      const sCam = preview ? clamp(VP.copy(camPos).sub(path.start).dot(path.startTangent), -150, 0) : u * LEN;
      // seen through the previous portal the doorway is not carried (it would be sliced by the portal's plane), and our own
      // train stands in the world just inside the entry, so the hand-over at u = 0 is continuous
      const sTrain = preview ? 0 : sCam, sCam0 = Math.max(sCam, 0), pf = preview ? 1 : paceF(u) * paceC;
      door.visible = !(ctx.through ?? preview);
      const Ecam = NX * camPos.x + NZ * camPos.z;
      // the one weather value
      let ET = 1e5, EF = 2e5, rainK = 0, afterK = 1, sunK = 1, wetK = 1, fresh = 0.55, gust = 0.2 + 0.08 * Math.sin(time * 0.4), veil = 0, showerK = 0;
      if (!shower) {
        ET = EcC + VE * (u - uClear); EF = EcF + VE * (u - uFront);
        afterK = 1 - sstep(ET - 25, ET + 25, Ecam);
        rainK = (1 - afterK) * (1 - sstep(EF - 25, EF + 25, Ecam));
        sunK = sstep(uClear - 0.14, uClear + 0.02, u);
        wetK = sstep(uFront - 0.012, uFront + 0.03, u);
        fresh = sstep(uClear - 0.06, uClear + 0.02, u) * (1 - 0.72 * sstep(uClear + 0.06, uClear + 0.3, u));
        gust = 0.3 - 0.16 * afterK + 0.07 * Math.sin(time * 0.5) + sstep(uFront - 0.04, uFront - 0.005, u) * (0.8 - 0.6 * sstep(uFront + 0.03, uFront + 0.22, u)) * (1 - 0.8 * afterK);
        veil = 1;
      } else {
        // the sun-shower has no dark, but it has its event: from u 0.2 to 0.5 the train runs through standing veils of rain lit
        // gold from the right, heavier drops, eaves pouring, the rails glinting and the roofs steaming
        showerK = sstep(0.14, 0.24, u) * (1 - sstep(0.5, 0.6, u));
        ET = EshB; EF = EshA; veil = 0.9; fresh = 0.55 + 0.4 * showerK;
      }
      // (the sun-shower has no dark: its ballast is wet and lit as it always was, not the storm's black, and it keeps its ground steam)
      if (GK) { if (shower) HU.uGndK.value.set(1, 1, GK[2], 1); else HU.uGndK.value.set(lerp(1, GK[0], sunK), lerp(1, GK[1], sunK), GK[2], lerp(1, GK[3], sunK)); }
      const roofed = 1 - sstep(-4, 6, camPos.z), rainPart = (shower ? 0.42 + 0.33 * showerK : rainK) * (1 - roofed), inK = rainK * (1 - 0.5 * roofed);
      const late = weather === 'late';
      let fl = 0, flG = 0, flAz = 0, flEl = 0.3, bolt = 0, boltSeed = 0;
      if (!shower) {
        for (let i = 0; i < FLS.length; i++) { const f = FLS[i], g = glowAt(u, f[0]); fl += flashAt(u, f[0]) * f[3]; if (g > flG) { flG = g; flAz = f[1]; flEl = f[2]; bolt = boltAt(u, f[0]); boltSeed = f[4]; } }
        fl *= rainK; flG *= rainK; bolt *= rainK;
        for (let i = 0; i < FLA.length; i++) { const f = FLA[i], g = glowAt(u, f[0]) * afterK * 0.8; if (g > flG) { flG = g; flAz = f[1]; flEl = f[2]; bolt = 0; boltSeed = f[4]; } }     // (after the clearing the wall only flickers: no fork stands against a blue sky)
      }
      // fog, sky, light
      blend(cur.fog, 'fog', afterK, inK); blend(cur.amb, 'amb', afterK, inK); blend(cur.gnd, 'gnd', afterK, inK);
      if (shower) {                                           // gold light off the wet ground and the lit veils fills the shade while the shower holds
        const bk = 0.4 + 0.6 * showerK;
        for (let i = 0; i < 3; i++) { cur.amb[i] += AF.hor[i] * 0.10 * bk; cur.gnd[i] += AF.hor[i] * 0.06 * bk; }
      }
      const warm = sunK * inK * 0.07, fk = 1 + 0.16 * fl;                // (lightning lights its own part of the cloud; the frame as a whole barely lifts)
      scene.fog.color.setRGB((cur.fog[0] + AF.sun[0] * warm) * fk, (cur.fog[1] + AF.sun[1] * warm) * fk, (cur.fog[2] + AF.sun[2] * warm) * fk);
      scene.fog.density = lerp(lerp(0.0012, dAfter, afterK), late ? lerp(0.0078, 0.0056, domeThin(u)) : 0.0078, Math.pow(inK, 1.5));
      VP.copy(domeAt).sub(camPos); VP.y -= 19;                // the dome's springing, as the sky sees it from here
      const dh = Math.hypot(VP.x, VP.z) || 1;
      skyU.uDome.value.set(Math.atan2(VP.x, -VP.z), Math.atan2(VP.y, dh), 1 / Math.hypot(dh, VP.y), late ? Math.min(1, fl * 1.4 + 0.5 * rainK * sstep(0.55, 0.6, u) * (1 - sstep(0.78, 0.84, u))) : 0);
      hero.setProgress(u);
      HU.uEdge.value.z = shower ? 1e5 : lerp(EcC - 600, EcC + 130, sstep(uClear - 0.1, uClear + 0.035, u)) + VE * 0.5 * Math.max(0, u - uClear - 0.035);
      HU.uFresh.value = fresh; HU.uSun.value = sunK; HU.uWet.value = wetK; HU.uRain.value = rainPart; HU.uLamp.value = Math.max(HR.lamp, Math.min(1, 1.15 * inK));
      HU.uSunCol.value.set(AF.sun[0], AF.sun[1], AF.sun[2]);
      blendU(HU.uSkyCol, 'sky', afterK, inK); blendU(HU.uHorizCol, 'hor', afterK, inK); blendU(HU.uFillCol, 'fill', afterK, inK);
      HU.uAmbCol.value.set(cur.amb[0] * fk, cur.amb[1] * fk, cur.amb[2] * fk); HU.uGroundCol.value.set(cur.gnd[0], cur.gnd[1], cur.gnd[2]);
      const skyAfter = shower || u > (uFront + uClear) * 0.5;
      if (skyAfter) { HU.uStormDir.value.set(-0.8, 0, 0.6); skyU.uWall.value.set(shower ? -1.48 : -1.33, shower ? 1.3 : 2.0, shower ? 0.4 : 0.5, 1); skyU.uBase.value.set(0.05, 0.05); skyU.uOver.value = 0; skyU.uSlit.value = 0; }
      else {                                                  // the wall stands on the entry axis and only swallows the sky in the last seconds before it hits
        const ap = sstep(uFront * 0.5, uFront, u), a2 = ap * ap;
        HU.uStormDir.value.set(0.5, 0, -0.866); skyU.uWall.value.set(0.38, 1.12 + 1.23 * a2, 2.0 + 1.0 * a2, 0); const lowK = 1 - sstep(0, 0.07, u);                 // at the entry (and through the previous portal) the base hangs low, so wall and slit stand near the horizon on the entry axis
        skyU.uBase.value.set(lerp(0.12 + 0.68 * ap, 0.06, lowK), lerp(0.15 + 0.45 * a2, 0.08, lowK)); skyU.uOver.value = 1; skyU.uSlit.value = 1 - a2;
      }
      skyU.uIn.value = inK; skyU.uSunK.value = sunK; skyU.uFlash.value = fl;
      skyU.uFl.value.set(flAz, flEl, flG * 1.5, 0.34); skyU.uBolt.value.set(bolt, boltSeed);
      // the pale slot under the cloud: ahead and a little right as a rule; in the late band it is turned to stand behind the dome
      { const dk = late ? sstep(0.47, 0.53, u) * (1 - sstep(0.82, 0.86, u)) : 0; skyU.uBreak.value.set(lerp(0.25, skyU.uDome.value.x, dk), (1.15 + 0.35 * dk) * inK, 0.26 + 0.1 * dk); }
      { const bk = sunK * 0.8, pk = 3.6 * (1 + 0.15 * fl); skyU.uBreakCol.value.set(lerp(cur.fog[0] * pk * 1.08, AF.sun[0] * 0.5, bk), lerp(cur.fog[1] * pk, AF.sun[1] * 0.5, bk), lerp(cur.fog[2] * pk * 0.9, AF.sun[2] * 0.5, bk)); }
      skyU.uFogCol.value.set(scene.fog.color.r, scene.fog.color.g, scene.fog.color.b);
      sky.position.copy(camPos);
      hemi.color.setRGB(cur.amb[0] * 3, cur.amb[1] * 3, cur.amb[2] * 3); hemi.groundColor.setRGB(cur.gnd[0] * 3, cur.gnd[1] * 3, cur.gnd[2] * 3); hemi.intensity = 1;
      sunL.color.setRGB(1, AF.sun[1] / AF.sun[0], AF.sun[2] / AF.sun[0]); sunL.intensity = HR.sunL * sunK * afterK;
      // the palms and the other trees take the light of the moment, by the sun factor the ground uses: while the sun is off
      // their green is held down, a little of the sky's own grey lies on the wet leaves (grey-green, and darker), and a gust
      // turning the fronds over raises only a sixth of the sheen it does in sunlight; their bright green comes only with the sun
      leafMat.color.setRGB(lerp(LEAF_DULL[0], 1, sunK), lerp(LEAF_DULL[1], 1, sunK), lerp(LEAF_DULL[2], 1, sunK));
      leafMat.emissive.setRGB(cur.amb[0] * LEAF_GREY * (1 - sunK), cur.amb[1] * LEAF_GREY * (1 - sunK), cur.amb[2] * LEAF_GREY * (1 - sunK));
      leafFade.z = LEAF_SHEEN * lerp(1 / 6, 1, sunK);
      for (let i = 0; i < flocks.length; i++) {
        const fu = flocks[i].uniforms; if (!fu || !fu.uSunColor) continue;
        const sk = pigeons.includes(flocks[i]) ? Math.max(sunK * afterK, shower || weather === 'late' ? 0.6 : 0) * 1.6 : sunK * afterK * 1.4;     // pigeons flash in the shed's shafts
        setC(fu.uSunColor.value, AF.sun[0] * sk, AF.sun[1] * sk, AF.sun[2] * sk);
        setC(fu.uSkyColor.value, cur.amb[0] * 2.2, cur.amb[1] * 2.2, cur.amb[2] * 2.2); setC(fu.uGroundColor.value, cur.gnd[0] * 2.5, cur.gnd[1] * 2.5, cur.gnd[2] * 2.5);
      }
      // wind, rain, run-off
      path.tangentAtDist(sCam, headV);
      const hl = Math.hypot(headV.x, headV.z) || 1;
      X.uGust.value = gust; X.uBand.value.set(ET, EF); X.uRainCam.value = rainPart; X.uVeil.value = veil * (1 - 0.6 * inK); X.uShaft.value = 1 - 0.6 * inK;
      X.uVeilTop.value = lerp(lerp(lerp(36, 105, sstep(0.03, uFront - 0.02, u)), 170, afterK), 250, inK); X.uSlitK.value = skyAfter ? 0 : skyU.uSlit.value;
      X.uOurDim.value = 1;
      X.uLeaf.value = shower ? 0 : sstep(uFront - 0.055, uFront - 0.025, u) * (1 - sstep(uFront + 0.012, uFront + 0.045, u));
      X.uRailY.value = camPos.y - EYE; X.uDeckHalf.value = camPos.z > 300 ? 10.1 : 60; X.uTrackR.value.set(-headV.z / hl, headV.x / hl);
      ctx.renderer.getDrawingBufferSize(size);
      X.uPix.value = 2 * Math.tan((camera.fov || 62) * Math.PI / 360) / Math.max(size.y, 1);
      wind.uniforms.uFloraWind.value.z = 0.35 + 2.3 * gust; wind.update(time);
      const sheet = 0.75 + 0.25 * Math.sin(time * 0.9 + sCam * 0.05);     // the rain comes in sheets
      rainNear.setOpacity(0.55 * rainPart * sheet); rainMid.setOpacity(0.35 * rainPart * (1.5 - sheet)); rainFar.setOpacity(0.24 * rainPart * sheet);
      for (let i = 0; i < 3; i++) {
        const r = rainU[i];
        r.uColorA.value.setRGB(0.5 + 1.1 * sunK, 0.6 + 0.4 * sunK, 0.72 - 0.3 * sunK); r.uColorB.value.setRGB(0.75 + 1.0 * sunK, 0.84 + 0.3 * sunK, 0.93 - 0.4 * sunK); r.uColorC.value.setRGB(0.36 + 0.9 * sunK, 0.46 + 0.3 * sunK, 0.6 - 0.3 * sunK);
      }
      // the doorway: follows the camera, shudders on the rail joints, straps swing
      // (it turns with most of the gaze, lagging a little, so it stays the frame of the picture; it never pitches)
      VX.setFromMatrixColumn(camera.matrixWorld, 2);
      const yawH = Math.atan2(-headV.x, -headV.z);
      let dy = Math.atan2(VX.x, VX.z) - yawH; dy -= TAU * Math.round(dy / TAU);
      door.position.copy(camPos); door.rotation.y = yawH + dy;
      {
        // on a wide screen the doorway stands just outside the left edge of the picture (two outside viewers called a jamb in every
        // frame a fault); on a tall, narrow one the frame is narrower than the jamb's angle already and nothing moves
        const tH = 1 / Math.max(camera.projectionMatrix.elements[0], 1e-3), sp = Math.abs(VX.y), cp = Math.sqrt(Math.max(1 - sp * sp, 0));
        const slide = Math.max(0, (tH + 0.08) * (1.25 * cp + 0.9 * sp) - 0.95), ry = door.rotation.y;
        door.position.x -= Math.cos(ry) * slide; door.position.z += Math.sin(ry) * slide;
      }
      const jp = (((sCam + (preview ? time * SPEED : 0)) / 12) % 1 + 1) % 1, j2 = Math.max(jp - 0.13, 0);
      const knock = Math.exp(-jp * 9) * Math.sin(jp * 70) + (jp > 0.13 ? Math.exp(-j2 * 9) * Math.sin(j2 * 70) : 0);
      door.position.y += 0.005 * knock;
      const dtc = Math.min(dt, 0.05);
      sw.v1 += (-sw.a1 * 38 - sw.v1 * 1.5 + knock * 7 + Math.sin(time * 2.3) * 0.8) * dtc; sw.a1 = clamp(sw.a1 + sw.v1 * dtc, -0.5, 0.5);
      sw.v2 += (-sw.a2 * 31 - sw.v2 * 1.3 + knock * 6 + Math.cos(time * 1.9) * 0.8) * dtc; sw.a2 = clamp(sw.a2 + sw.v2 * dtc, -0.5, 0.5);
      X.uSwing.value.set(sw.a1, sw.a2 * 0.5 - 0.1 * gust, sw.a2, sw.a1 * 0.5 - 0.1 * gust);
      // our train, the rival express, the departing express, the goods on the flyover
      // (the coach side runs on from our own jamb, its eave above the eye so the roof is never seen from above)
      const thin = sstep(Math.min(uClear, 0.5) - 0.03, Math.min(uClear, 0.5) + 0.03, u);     // regulator shut for the run in: our plume thins and leaves the dome clear
      const os = preview ? 0 : 1;                           // seen through the portal our own train would straddle the entry plane
      onLine(coachesO, our.coach, sTrain - 6.3, -1, OUR_X, os, 0.9 * os, os, false);
      VP.set(0, 3.6, -7).applyMatrix4(VM); X.uEP.value[7].copy(VP);     // the flooded line: spray off our leading wheels, left behind as we go
      X.uEV.value[7].set(VZ.x * SPEED * pf, 0, VZ.z * SPEED * pf, rare ? 0.5 * sstep(306, 288, camPos.z) * sstep(2, 20, camPos.z) : 0);
      // the light engine ahead of us on our own line: 60 m in front down the viaduct, drawing away through the rain to 165 m
      // and more by u 0.45, then over the points to the next road
      const rawL = 165 - 105 * (1 - sstep(0.2, 0.45, u)) + sCam0 * 1.06, capL = LEN - 130, sL = rawL > capL ? capL + 100 * (1 - Math.exp(-(rawL - capL) / 100)) : rawL;
      const shedK = sstep(0.76, 0.82, u);                   // standing in the shed at the journey's end, both engines blow off
      X.uNearK.value = 1 - sstep(uFront - 0.05, uFront, u);
      onLine(locos, lead.loco, sL, 8, 0, 1, 1, 1, false); emit(0, SPEED * pf * (rawL > capL ? Math.exp(-(rawL - capL) / 100) : 1), 1 - 0.88 * thin * (1 - shedK));
      locos.ai[lead.loco * 4 + 3] = (sL / 0.95) % TAU;
      // the express comes up from behind as the wall hits (its engine abeam, an arm away), overtakes at 10 m/s, then holds a lead
      // of a hundred metres and more through the clearing, so its plume, lit from the side, leads the eye into the shed
      const rLead = u < 0.44 ? (u - 0.278) * 420 : 68.04 + 90 * (1 - Math.exp(-(u - 0.44) / 0.2143)), rLeadV = u < 0.44 ? 420 : 420 * Math.exp(-(u - 0.44) / 0.2143);
      const raw = sTrain + rLead, cap = LEN - 112;
      const ease = raw > cap ? Math.exp(-(raw - cap) / 100) : 1, sR = raw > cap ? cap + 100 * (1 - ease) : raw;
      const rOff = 0.55 * (1 - sstep(0.5, 0.62, u));
      onLine(locos, rival.loco, sR - 8.8, 10, rOff, 0.9, 1, 1, false); emit(1, (LEN + rLeadV) / duration * ease * pf, 1 - 0.55 * thin * (1 - shedK));
      X.uEV.value[1].x += 9 * thin * (1 - shedK);                         // and the express's drifts west, off the dome's sight line
      locos.ai[rival.loco * 4 + 3] = (sR / 0.95) % TAU;
      for (let i = 0; i < rival.cars.length; i++) {
        if (rival.vans) onLine(wagons, rival.cars[i], sR - 17.4 - 0.6 - 2.85 - i * 6.3, 10, rOff, 0.9, 1, 1, false);
        else { onLine(coaches, rival.cars[i], sR - 17.4 - 0.7 - 7 - i * 14.7, 10, rOff, 0.9, 1, 1, false); winR[i].matrix.copy(VM); winR[i].matrixWorldNeedsUpdate = true; }
      }
      // The departing express stands at its platform on road 13, its engine 30 m inside the gable, and pulls out at 14 m/s
      // on its booked time, 0.47 of our journey (as the classic cloudburst lifts; it keeps that time in every weather). The
      // stopping train on the next platform road (14) follows it out onto the same line, one headway behind its tail lamp,
      // starting gently. Both are drawn by the rule for far things below (dOn), and an engine that is not drawn has no plume.
      const sD = 739.7 - (-30 + 588 * Math.max(0, u - 0.47));
      const d2 = 769.7 - (sD + 76.5 + HEADWAY), h2 = Math.hypot(d2, 16), sD2 = 769.7 - 0.5 * (d2 + h2);
      const dOn = farSeen(Math.max(0, sD - sCam0)) && (preview || sD2 + 76.5 > sCam - 60) ? 1 : 0;      // (and both are put away once the second's tail lamp is 60 m behind the eye)
      onLine(locosD, depart.loco, sD + 8.8, 13, 0, 1, 1, 1, true); if (u >= 0.3) emit(2, u > 0.47 ? 14 * pf : 0, dOn);
      locosD.ai[depart.loco * 4 + 3] = (((-sD / 0.95) % TAU) + TAU) % TAU;
      for (let i = 0; i < 4; i++) onLine(coachesD, depart.cars[i], sD + 17.4 + 0.7 + 7 + i * 14.7, 13, 0, 1, 1, 1, true);
      onLine(locosD, depart2.loco, sD2 + 8.8, 14, 0, 1, 1, 1, true); emit(8, u > 0.47 ? 7 * (1 + d2 / h2) * pf : 0, dOn);
      locosD.ai[depart2.loco * 4 + 3] = (((-sD2 / 0.95) % TAU) + TAU) % TAU;
      for (let i = 0; i < 4; i++) onLine(coachesD, depart2.cars[i], sD2 + 17.4 + 0.7 + 7 + i * 14.7, 14, 0, 1, 1, 1, true);
      locosD.mesh.visible = coachesD.mesh.visible = dOn > 0;
      const tG = (u - 0.34) * 420 + 20, goodsOn = preview || camPos.z > FZ - 40;      // (the goods is put away, and its plume with it, once its flyover is 40 m behind the eye: the last engine and the last eight wagons of their sets)
      locos.mesh.count = locosN - (goodsOn ? 0 : 1); wagons.mesh.count = wagonsN - (goodsOn ? 0 : 8);
      VX.set(-FD[1], 0, FD[0]); VY.set(0, 1, 0); VZ.set(-FD[0], 0, -FD[1]);
      for (let i = 0; i < 8; i++) { const t = tG - 17.4 - 0.6 - 2.85 - i * 6.3; VM.makeBasis(VX, VY, VZ).setPosition(FX + FD[0] * t, FY + 0.9, FZ + FD[1] * t); wagons.mesh.setMatrixAt(goods.cars[i], VM); }
      VM.makeBasis(VX, VY, VZ).setPosition(FX + FD[0] * (tG - 8.8), FY + 0.9, FZ + FD[1] * (tG - 8.8)); locos.mesh.setMatrixAt(goods.loco, VM); if (u <= 0.47) emit(3, 10 * pf, goodsOn ? 1 : 0);
      locos.ai[goods.loco * 4 + 3] = (((tG / 0.95) % TAU) + TAU) % TAU;
      {
        // the local at the halt: it stands as we come in, then pulls out past us on the far line and is gone behind
        const dL = Math.max(0, u - 0.012), kL = 1 - Math.exp(-dL / 0.02), sO = 196 - 900 * (dL - 0.02 * kL), vis = sO > sCam - 75 && sO > 4 ? 1 : 0;
        onLine(locosL, local2.loco, sO + 8.8, -1, TRACK_OFF[0], vis, vis, vis, true);
        if (u < 0.3) emit(2, 900 * kL / duration * pf, vis);
        locosL.ai[local2.loco * 4 + 3] = (((-sO / 0.95) % TAU) + TAU) % TAU;
        // a light engine waits behind it on the same line and follows it out, one headway behind its tail lamp, so the far
        // line is in traffic after the local has gone by
        const sE = sO + 76.5 + HEADWAY + 8.8, visE = sE > sCam - 60 ? 1 : 0;
        onLine(locosL, lightE, sE, -1, TRACK_OFF[0], visE, visE, visE, true); emit(9, 900 * kL / duration * pf, 0.22 * visE);
        locosL.ai[lightE * 4 + 3] = (((-sE / 0.95) % TAU) + TAU) % TAU;
        coachesL.mesh.visible = vis > 0; locosL.mesh.visible = vis > 0 || visE > 0;
        for (let i = 0; i < 3; i++) { onLine(coachesL, local2.cars[i], sO + 17.4 + 0.7 + 7 + i * 14.7, -1, TRACK_OFF[0], vis, vis, vis, true); winL[i].matrix.copy(VM); winL[i].matrixWorldNeedsUpdate = true; }
        // the yard shunter draws two vans up and down a road on the storm side (on time: it works whether we move or not)
        const zS = 150 + 42 * Math.sin(time * 0.1);
        onRoad(locosS, shunt.loco, 5, zS); if (u > 0.47) emit(3, -4.2 * Math.cos(time * 0.1), 1);
        locosS.ai[shunt.loco * 4 + 3] = (((-zS / 0.95) % TAU) + TAU) % TAU;
        for (let i = 0; i < 2; i++) onRoad(wagonsS, shunt.cars[i], 5, zS + 11.95 + i * 6.3);
      }
      X.uEV.value[4].set(0, 0, 0, 1); X.uEV.value[5].set(NX * gust * 10, -2 * gust, NZ * gust * 10, 1); X.uEV.value[6].set(0, 0, 0, fresh * sunK * (hourId === 'noon' ? 0.4 * sstep(uClear + 0.05, uClear + 0.1, u) : 0.4));     // at noon the roofs steam hard, but only once the dome has been seen
      // What stands far off is drawn while it can be seen (farSeen): the yard's and the shed's stock, the stored vans and the
      // lit rake, each by the distance to its nearest vehicle and the fog of the moment, the same rule in every weather.
      for (let i = 0; i < farSets.length; i++) farSets[i][0].mesh.visible = farSeen(camPos.z - farSets[i][1]);
      // the chowk's handcarts trundle up their lanes, a figure behind each
      for (let i = 0; i < baz.carts.length; i++) {
        const c = baz.carts[i], z = Math.max(c.z0 - c.v * duration * Math.max(u, 0), 616), dx = pathDX(z), nrm = Math.hypot(dx, 1), yaw = Math.atan(dx);
        const x = pathX(z) + c.lat / nrm, zz = z - c.lat * dx / nrm, bob = 0.02 * Math.sin(time * 5 + i * 2);
        QQ.setFromEuler(QE.set(0.012 * Math.sin(time * 4.1 + i), yaw, 0, 'YXZ'));
        VM.compose(VP.set(x, bob, zz), QQ, VS.set(1, 1, 1)); carts.mesh.setMatrixAt(c.i, VM);
        QQ.setFromEuler(QE.set(0, yaw + 3.1416, 0, 'YXZ'));
        VM.compose(VP.set(x + Math.sin(yaw) * 2.9, 0, zz + Math.cos(yaw) * 2.9), QQ, VS.set(1, 0.97, 1)); folk.mesh.setMatrixAt(c.who, VM);
      }
      if (baz.carts.length) carts.mesh.instanceMatrix.needsUpdate = true;
      // the walkers on the platforms: a steady pace either way, wrapped along the shed
      for (let i = 0; i < walkers.length; i++) {
        const w = walkers[i], zz = -20 - ((((w.z0 + w.dir * w.v * time) % 100) + 100) % 100), st2 = time * w.v * 4.6 + w.ph;
        QQ.setFromEuler(QE.set(0.03 * Math.sin(st2), w.dir > 0 ? 3.1416 : 0, 0.035 * Math.sin(st2 * 0.5), 'YXZ'));
        VM.compose(VP.set(w.x, 1.05 + 0.022 * Math.abs(Math.sin(st2)), zz), QQ, VS.set(1, w.h, 1)); folkFar.mesh.setMatrixAt(w.i, VM);
      }
      // crows: on the wires until the gust, back on the gantries afterwards, shaking themselves dry
      entryMesh.visible = preview || camPos.z > 294;      // the viaduct and its quarter are put away once they are all behind the eye
      folk.mesh.visible = preview || camPos.z > 286; folkA.mesh.visible = preview || camPos.z > 452;     // and its people with it
      for (let i = 0; i < zsets.length; i++) {              // and of the scattered roofs, tanks, cloth and palms, only those not yet passed are drawn
        const zs = zsets[i], lim = camPos.z + 12; let lo = 0, hi = zs.n;
        while (lo < hi) { const m = (lo + hi) >> 1; if (zs.zs[m] < lim) lo = m + 1; else hi = m; }
        zs.mesh.count = lo;
      }
      // the sidings' weeds fade out at 135 m and the platforms' dressing cannot be seen from the viaduct: neither is drawn before its time
      const lowOn = camPos.z < 400;
      if (weeds) weeds.object.visible = lowOn;
      weeds2.object.visible = preview || camPos.z > 285;
      if (heroPlat) heroPlat.visible = lowOn;
      folkFar.mesh.visible = farSeen(camPos.z - folkFarZ);
      crowsSit.mesh.visible = u < (shower ? 0.2 : uFront) - 0.02;
      crowsShake.mesh.visible = shower || u > uClear + 0.05;
      for (let i = 0; i < shakers.length; i++) {
        const c = shakers[i], burst = Math.pow(Math.max(0, Math.sin(time * 0.7 + c.ph)), 6);
        QE.set(0.12 * burst * Math.sin(time * 19 + c.ph), c.yaw + 0.3 * Math.sin(time * 0.3 + c.ph), 0.2 * burst * Math.sin(time * 23 + c.ph), 'YXZ'); QQ.setFromEuler(QE);
        VM.compose(c.p, QQ, ONE); crowsShake.mesh.setMatrixAt(c.i, VM);
      }
      crowsShake.mesh.instanceMatrix.needsUpdate = true;
      lodSplit(camera);
      hero.update(dt, time, camera);
      if (weeds) weeds.update(dt, time, camera);
      weeds2.update(dt, time, camera);
      fauna.update(dt, time, camera, u);
    };
    { const c0 = new THREE.PerspectiveCamera(62, ctx.aspect || 1.78, 0.3, 5200); path.pointAt(0, c0.position); c0.updateMatrixWorld(); update(0, 0, c0, 0); door.visible = true; }

    const lookP = new THREE.Vector3(), lookT = new THREE.Vector3();
    return {
      scene, path, duration, pace: paceF,
      title: rare ? 'The Cloudburst Local: The Flooded Line' : HR.title,
      ride: 'none',
      camera: { fov: 62, near: 0.3, far: 5200, lookAhead: 26, sway: 0.25, bank: 0, nearThrough: 0.3 },
      pois: [
        { at: [pathX(715) + 380, 45, 715 - 470], from: 0, to: (shower ? 0.2 : uFront) + 0.03, weight: 0.1, fade: 0.3 },       // the wall of rain, front right
        { at: domeAt, from: Math.min(uClear, 0.5) - 0.04, to: 0.83, weight: 0.42, fade: 0.25 },                               // the dome over the shed
        { at: domeAt, from: 0.47, to: 0.65, weight: 0.2, fade: 0.4 },                                                         // and held a little harder through the clearing
        // out of the doorway: the gaze rides about twelve degrees to the right of the rails, easing back through the shed, so our own
        // train's vanishing point sits left of centre and the picture is the city, not the coach roof
        { at: (t, u) => { const sd = u * LEN + 60; path.posAtDist(sd, lookP); path.tangentAtDist(sd, lookT); const l = Math.hypot(lookT.x, lookT.z) || 1; lookP.x += -lookT.z / l * 62; lookP.z += lookT.x / l * 62;
          lookP.y += 24 * (1 - sstep(0.19, 0.27, u)) + 26 * sstep(Math.min(uClear, 0.5) - 0.04, Math.min(uClear, 0.5) + 0.03, u) * (1 - sstep(0.72, 0.8, u)); return lookP; },
          from: -0.2, to: 0.93, weight: 0.36, fade: 0.12 },
      ],
      portal: { shape: 'arch', width: 14, height: 19, color: HR.portal, glow: 1.1, revealDistance: 300, blendDistance: 25 },     // the shed keeps its own exposure and grade to the last 25 m
      post: {
        exposure: HR.exposure,
        bloom: { strength: 0.5, radius: 0.7, threshold: 0.92 },
        grade: { saturation: HR.lamp ? 0.98 : 1.08, contrast: 1.05, tint: HR.tint, vignette: 0.3, grain: 0.03, aberration: 0 },
      },
      update,
      dispose() { hero.dispose?.(); },
    };
  },
};
