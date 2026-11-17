// THE HUNDRED-SEGMENT DRAGON: a Weifang kite loft as long as a ropewalk, on a windy spring afternoon.
// A centipede dragon kite (src/parts/dragon-kite-loft.js) lies threaded down the whole workshop on 120
// trestles; the line snaps taut, the discs stand up in a wave that runs towards us, and we ride the last
// one down 764 m of loft, under some 850 hung paper kites, past the rack of dragon heads, and out through
// the round moon gate in the far gable.
//
// World space = the hero's local space = the brief's loft coordinates: floor y 0, axis x 0, the loft runs
// from z +10 to z -770.6, 64 m wide, eaves 16 m, ridge 46 m; station s = -6 - z. Trusses every 16 m
// (z = 2 - 16 i): posts at x +-16, tie beam 28 m up. Everything is self-lit by ONE analytic rig shared with
// the hero (its light uniforms): a paper sun wall, a cool wall, roof-lights, the gable, ambient and floor
// bounce, with distance fall-off from each so the corners sink and the paper carries the picture.
//
// Flight (u): 0-0.094 the finishing floor at 12 m (peach branch, cat on the silk rolls at u 0.06, caged
// thrush at u 0.08, tea table, easel, reel) while the wave of standing discs arrives; 0.094-0.19 the lift;
// u 0.2 under the great swallow, then THE KITE HALL with the eye dropped alongside the body on its left
// (u 0.2-0.31); 0.3 the 12 m butterfly; 0.35-0.47 THE DYE ROOM: eleven ranks of wet silk across the loft, one dye
// lot to a rank, steaming vats, wet stained planks, the body swinging from one side of the eye to the other;
// 0.47-0.56 the goldfish shoal seen from 6.5 m above the body, looking down its length; 0.55 the head rack (three
// dragon heads, pinwheel eyes); 0.6-0.74 THE LANTERN GALLERY under a drying deck: the day shut out, several
// hundred lit paper lanterns, a flame in every disc that passes through, the eye flying the straight line while
// the body swings wide, the moon gate held dead centre from here on (gaze poi; a sight-line cone nothing hangs
// in); 0.76-0.85 THE OPEN ROOF BAY: a slab of sky light falls across the two bamboo hoops the dragon threads,
// swallows streaming in over our heads; 0.87-1 the great round window of blue paper and straight in.
// Rare (ctx.vary.rare): at u 0.59-0.63 a gust tears a dozen vermilion kites off their strings; they tumble and
// race alongside, four a side within 10 m (u 0.63-0.75), then close up over the body, thread the hoops and go
// out through the moon gate ahead of us (u 0.86-0.93).
// Looks by seed: bright afternoon | lantern-festival dusk | fine rain | low gold sun | snow light; the
// dragon's livery, the dominant kite kind and the third head's livery are cast per seed.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import * as INT from '../kit/interior.js';
import * as fx from '../kit/fx.js';
import * as F from '../kit/fauna.js';
import { buildHero, GLSL_LIGHT, GLSL_CURVE, ZONES } from '../parts/dragon-kite-loft.js';

const PI = Math.PI, TAU = PI * 2, V3 = THREE.Vector3;
const HALF = 32, EAVE = 16, RIDGE = 46, Z_IN = 10, Z_OUT = -770.6, TIE = 28, BAY = 16, NTRUSS = 49;
const NHOLE = 12;
const roofY = (x) => RIDGE - Math.abs(x) * (RIDGE - EAVE) / HALF;
const trussZ = (i) => 2 - BAY * i;
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const cyl = (rt, rb, h, seg = 8, open = false) => new THREE.CylinderGeometry(rt, rb, h, seg, 1, open);
const sph = (r, w = 10, h = 8) => new THREE.SphereGeometry(r, w, h);
const hexMix = (a, b, t) => '#' + new THREE.Color(a).lerp(new THREE.Color(b), t).getHexString();
// surf = [material id + gloss, grain axis (0 x, 1 y, 2 z), emissive, 1]
const sWood = (axis, gloss = 0.3) => [1.02 + gloss * 0.95, axis, 0, 1];
const S_PLAIN = [0.12, 0, 0, 1], S_GLOSS = [0.8, 0, 0, 1], S_CLOTH = [2.06, 0, 0, 1], S_STONE = [3.1, 0, 0, 1];
const S_SCALE = [4.4, 0, 0, 1], S_PAPER = [5.1, 0, 0, 1], S_BAMBOO = [6.5, 1, 0, 1], S_GILT = [0.9, 0, 0.12, 1];
const sBam = (axis) => [6.5, axis, 0, 1];
const TIMBER = '#5c4230', TIMBER_L = '#7c5a3a', GOLDW = '#D9B36A', CREAM = '#F4EBD6', VERM = '#D8381E', VIRID = '#1F8A6B', GILT = '#E8B93A', SKY = '#8FC4F0';
const GREEN_B = '#7d9a4a', INK = '#150d09';

// ------------------------------------------------------------------ shared GLSL: the room's light
const GLSL_ROOM = /* glsl */`
${GLSL_LIGHT}
uniform vec4 uHole[${NHOLE}];        // torn or propped panes: centre xyz, radius
uniform vec4 uPool[${NHOLE}];        // their pools on the planks: x, z, radius across, radius along
uniform vec3 uPaperS, uPaperL, uPaperR, uPaperG, uHaze, uShaft, uFlame, uMoon;
uniform float uTime, uLantern, uFront, uEye, uBoost, uKey;
${GLSL_CURVE}
float sq(float x){ return x*x; }
// coverage of a line of half width w by a pixel aa wide at distance d (keeps its weight when thinner than a pixel)
float ln(float d, float w, float aa){ aa = max(aa, 1e-4); return clamp((min(d + aa*.5, w) - max(d - aa*.5, -w))/aa, 0., 1.); }
float fillAA(float d, float aa){ return clamp(.5 - d/max(aa, 1e-4), 0., 1.); }
float roomBars(float z){ return mix(.64 + .36*cos(6.2831853*(z - 10.)/16.), .3 + .95*dkBars(z), uKey); }
// light arriving at p on a surface facing n: every source falls off with distance
vec3 roomLight(vec3 p, vec3 n){
  float sg = uSunDir.x < 0. ? -1. : 1.;
  float dS = max(32. - p.x*sg, 0.), dL = max(32. + p.x*sg, 0.);
  float hS = 1./(1. + dS*dS*.0017), hL = 1./(1. + dL*dL*.0017);
  float a = clamp(n.x*sg*.62 + .38 + n.y*.12, 0., 1.);
  float b = clamp(-n.x*sg*.62 + .38, 0., 1.);
  float g = clamp(-n.z*.6 + .4, 0., 1.);
  float gz = .22 + .78*exp(-max(p.z + 770., 0.)/170.);
  vec3 c = uSun*hS*2.1*a*a + uSky*hL*2.3*b*b;
  c += uRoof*clamp(n.y*.6 + .4, 0., 1.)*(.4 + .6*smoothstep(0., 30., p.y))*roomBars(p.z);
  c += uGable*g*g*gz + uFloor*clamp(-n.y*.5 + .5, 0., 1.)*.9;
  c += uAmb*(.7 + .7*smoothstep(-1., 16., p.y));
  // lantern night: the lit body throws warm light on what it passes
  float sL = DK_Z0 - p.z, dxl = p.x - snakeX(sL), dyl = p.y - eyeY(sL) + 4.3;
  float lit = smoothstep(-9., 5., sL - max(uFront, uEye));
  c = c*uBoost + uFlame*uLantern*lit*1.8*exp(-dxl*dxl/210.)*(.45 + .55*exp(-dyl*dyl/70.));
  // the lantern gallery: under the drying deck the day is shut out and several hundred lanterns light the nave
  float gal = dkGal(p), nave = 1. - .55*smoothstep(15., 23., abs(p.x));
  c = c*mix(1., .11, gal*nave) + uFlame*uGalK*gal*nave*(.2 + .2*clamp(n.y*.5 + .5, 0., 1.) + .16*smoothstep(4., 22., p.y))*(.86 + .14*sin(p.z*.785));
  // the open roof bay: its shaft of sky light on whatever stands in it
  return c + uBayCol*dkBay(p)*clamp(dot(n, uSunDir)*.7 + .3, 0., 1.)*1.5;
}
// the dye room: how far inside it, and the colour of the dye lot hung at this station
float dyeZone(float z){ float s = -6. - z; return smoothstep(${(ZONES.dye[0] - 6).toFixed(1)}, ${(ZONES.dye[0] + 6).toFixed(1)}, s)*(1. - smoothstep(${(ZONES.dye[1] - 6).toFixed(1)}, ${(ZONES.dye[1] + 4).toFixed(1)}, s)); }
float holeGlow(vec3 p){
  float h = 0.;
  for (int i = 0; i < ${NHOLE}; i++) {
    vec3 d = p - uHole[i].xyz;
    h = max(h, 1. - smoothstep(uHole[i].w*.75, uHole[i].w, length(d)));
  }
  return h;
}
float gust(float z){ return sin(uTime*1.7 + z*.09)*sin(uTime*.83 + z*.031); }
`;

// ------------------------------------------------------------------ the shell: floor, walls, roof, gables
const SHELL_VS = /* glsl */`
#include <common>
#include <fog_pars_vertex>
attribute float aId;
varying vec3 vPos; varying vec3 vN; varying float vId;
void main(){
  vPos = position; vN = normal; vId = aId;
  vec4 mvPosition = modelViewMatrix*vec4(position, 1.);
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const SHELL_FS = /* glsl */`
#include <common>
#include <fog_pars_fragment>
${GLSL_ROOM}
uniform vec3 uTimber, uGold, uCream, uAccA, uAccB, uAccC;
varying vec3 vPos; varying vec3 vN; varying float vId;
vec3 dyeLot(float z){
  float t = (-6. - z - 272.)/8.;
  vec3 c = mix(uCream, uAccC, smoothstep(.4, 1.4, t));
  c = mix(c, uAccA, smoothstep(2.4, 4., t));
  c = mix(c, uAccB, smoothstep(6.4, 7.6, t));
  return c;
}
float lattice(vec2 q, float aa){
  vec2 a = abs(fract(q/1.4) - .5)*1.4;
  float m = ln(min(.7 - a.x, .7 - a.y), .075, aa);
  float mx = max(a.x, a.y);
  m = max(m, ln(abs(mx - .37), .05, aa));
  m = max(m, ln(min(a.x, a.y), .045, aa)*step(.37, mx));
  return mix(m, .38, smoothstep(.5, 1.6, aa));
}
vec3 paper(vec3 base, vec2 q, float z){
  float h = dkH21(floor(q/1.4));
  float m = (.74 + .34*dkVn(q*.33))*(.86 + .26*h);
  m *= 1. - .3*step(.93, h);
  vec3 c = base*m*(1. + .1*gust(z));
  return mix(c, c*vec3(1.05, .9, .68), .5*step(h, .12));
}
vec3 timber(vec3 base, vec2 q, float w){
  float id = floor(q.x/w);
  float h = dkH21(vec2(id, 7.));
  vec3 a = base*(.8 + .55*h)*(.68 + .6*dkVn(vec2(q.x*9./w, q.y*.55 + h*30.)));
  return a*(.9 + .2*dkVn(vec2(q.x*37./w, q.y*2.6)));
}
void main(){
  vec3 p = vPos, n = normalize(vN);
  vec3 V = uCam - p; float dist = length(V); V /= max(dist, 1e-4);
  float fwy = fwidth(p.y), fwx = fwidth(p.x), fwz = fwidth(p.z);
  vec3 col;
  float hole = holeGlow(p), moonK = 0.;
  if (vId < .5) {
    // ---- plank floor: boards along z with staggered butts, wear, shavings, offcuts, pools of sun
    float w = 1.2, row = floor(p.x/w), off = dkH21(vec2(row, 3.))*14.;
    float pl = floor((p.z + off)/14.), h = dkH21(vec2(row, pl));
    float ex = min(fract(p.x/w), 1. - fract(p.x/w))*w, ez = min(fract((p.z + off)/14.), 1. - fract((p.z + off)/14.))*14.;
    float lod = smoothstep(.02, .22, fwx + fwz*.2);
    float gap = max(ln(ex, .035, fwx*1.2), ln(ez, .04, fwz*1.2))*(1. - lod);
    vec3 a = mix(uTimber*1.7, uGold*.62, .25 + .6*h);
    a *= .66 + .62*dkVn(vec2(p.x*7.5, p.z*.42 + h*40.));
    a *= .9 + .2*dkVn(vec2(p.x*31., p.z*2.2));
    float s = -6. - p.z, dxs = p.x - snakeX(max(s, 0.));
    float wear = exp(-dxs*dxs/90.);
    a = mix(a, uGold*.72, wear*.3);
    a *= 1. - .78*gap;
    // curls of shaving, paper offcuts and paste drips
    vec2 c1 = floor(p.xz/.7), f1 = fract(p.xz/.7) - .5;
    float h1 = dkH21(c1 + 11.), nearb = smoothstep(21., 26., abs(p.x)) + wear*.55 + .12;
    float rr = length(f1 - (vec2(dkH21(c1), dkH21(c1 + 5.)) - .5)*.4);
    float curl = ln(abs(rr - .16), .035, fwx*2.)*step(h1, nearb*.5)*step(-.05, f1.y*sin(h1*40.) + f1.x*cos(h1*40.));
    vec2 c2 = floor(p.xz/3.1), f2 = fract(p.xz/3.1) - .5;
    float h2 = dkH21(c2 + 3.7), an = h2*30.;
    vec2 r2 = vec2(f2.x*cos(an) - f2.y*sin(an), f2.x*sin(an) + f2.y*cos(an));
    float scrap = fillAA(max(abs(r2.x) - .1 - .12*h2, abs(r2.y) - .07), fwx)*step(h2, .16);
    float drip = (1. - smoothstep(.05, .1, length(f2 - .2)))*step(.7, h2);
    float farb = 1. - smoothstep(.05, .3, fwx + fwz*.15);
    a = mix(a, uCream*.74, (curl*.85 + scrap*.9)*farb);
    a = mix(a, a*.45, drip*farb);
    a = mix(a, uCream*.4, (1. - farb)*.06*nearb);
    // the dye room: the planks are wet and stained with every lot that has dripped on them
    float dz = dyeZone(p.z); vec3 lot = dyeLot(p.z);
    float stain = smoothstep(.3, .62, dkVn(p.xz*.17 + 7.))*(.5 + .5*dkVn(p.xz*1.3))*dz;
    a = mix(a, a*.45 + lot*.3, stain*.85)*(1. - .25*dz);
    // light: the rig, bars of roof-light, pools, and what stands on the planks
    vec3 L = roomLight(p, vec3(0., 1., 0.));
    float pool = 0.;
    for (int i = 0; i < ${NHOLE}; i++) {
      vec2 d = (p.xz - uPool[i].xy)/max(uPool[i].zw, vec2(.01));
      pool += 1. - smoothstep(.55, 1., length(d));
    }
    float sh = 0.;
    float al = (fract((s - 75.5)/5.8 + .5) - .5)*5.8;
    sh += .5*(1. - smoothstep(1.3, 3.6, abs(dxs)))*(1. - smoothstep(1.4, 2.9, abs(al)))*step(70., s);
    sh += .5*smoothstep(23., 25.5, abs(p.x));
    float pz = (fract((p.z - 2.)/16. + .5) - .5)*16.;
    sh += .55*(1. - smoothstep(.7, 2.6, length(vec2(abs(p.x) - 16., pz))));
    // the sun wall lays a long warm pool down its side of the floor, broken by the window frames
    float sgf = uSunDir.x < 0. ? -1. : 1., wx = 32. - p.x*sgf;
    float kx = abs(uSunDir.x)/max(uSunDir.y, .05), w0 = 7.*kx, w1 = 15.4*kx;
    float wbay = abs(fract((p.z - 2. + uSunDir.z/max(abs(uSunDir.x), .05)*wx)/8. + .5) - .5)*8.;
    float wpool = smoothstep(w0 - 1., w0 + 2.5, wx)*(1. - smoothstep(w1 - 4., w1 + 2., wx))*smoothstep(.3, 1.9, 4. - wbay)*uKey;
    col = a*(L*(1. - min(sh, .8)) + uShaft*2.6*min(pool, 1.) + uSun*wpool*.42*(1. - .6*min(sh, 1.)));
    float fres = 1. - max(V.y, 0.); fres *= fres; fres *= fres;
    col = mix(col, uHaze*.85, fres*(.25 + .2*h)*(1. - dz));
    col = mix(col, lot*(uRoof*.7 + uPaperS*.16 + uAmb), fres*.62*dz);      // the hung silk mirrored in the wet
  } else if (vId < 1.5) {
    // ---- long walls: boarded dado with pinned flat kites, then lattice windows of oiled paper
    float sg = uSunDir.x < 0. ? -1. : 1., sun = step(0., p.x*sg);
    vec2 q = vec2(p.z, p.y);
    if (p.y < 7.) {
      vec3 a = timber(uTimber*1.25, q, 1.);
      a *= 1. - .6*ln(abs(fract(p.z) - .5), .03, fwz)*(1. - smoothstep(.02, .2, fwz));
      vec2 kc = vec2((fract(p.z/2.3) - .5)*2.3, p.y - 5.45), ki = vec2(floor(p.z/2.3), sun);
      float kh = dkH21(ki), kk = dkH21(ki + 9.);
      float dd = kh < .4 ? abs(kc.x) + abs(kc.y) - .95 : (kh < .7 ? length(kc) - .88 : max(abs(kc.x) - .8, abs(kc.y) - .95 + abs(kc.x)*.6));
      float aa = fwz + fwy;
      vec3 kcol = kk < .7 ? uCream*.8 : (kk < .8 ? uAccA : (kk < .9 ? uAccB : uAccC));
      kcol = mix(kcol, uTimber*.3, ln(abs(dd + .1), .035, aa) + ln(min(abs(kc.x), abs(kc.y)), .02, aa)*.6);
      a = mix(a, kcol, fillAA(dd, aa)*step(p.y, 6.6));
      a = mix(a, uGold*.8, ln(abs(p.y - 6.82), .1, fwy));
      col = a*roomLight(p, n)*mix(.45, 1., smoothstep(0., 5., p.y));
    } else if (p.y < 15.4) {
      float aa = max(fwz, fwy);
      float bayz = (fract((p.z - 2.)/8. + .5) - .5)*8.;
      float frame = max(ln(4. - abs(bayz), .34, aa), max(ln(p.y - 7., .28, aa), ln(15.4 - p.y, .3, aa)));
      frame = max(frame, ln(abs(p.y - 11.2), .14, aa));
      float lat = max(lattice(q - vec2(0., .2), aa), frame);
      vec3 base = mix(uPaperL*mix(1.1, .8, (p.y - 7.)/8.4), uPaperS*mix(.74, 1.12, (p.y - 7.)/8.4), sun);
      vec3 pc = paper(base, q, p.z);
      vec3 open = mix(uPaperL, uPaperS, sun)*3.2;
      pc = mix(pc, open, hole*(1. - frame));
      vec3 wood = uTimber*.5*roomLight(p, n);
      col = mix(pc, wood + pc*.16*sun*uKey, lat*(1. - hole*.8)*mix(1., .8, sun*uKey));
    } else {
      col = timber(uTimber, q, 1.)*roomLight(p, n);
    }
  } else if (vId < 2.5) {
    // ---- roof: dark boards on rafters and purlins, bands of paper roof-light in every bay
    float sl = (32. - abs(p.x))*1.3711, zz = fract((p.z - 2.)/16.)*16.;
    float aa = fwz + fwx;
    float band = step(2.6, zz)*step(zz, 13.4)*step(7., sl)*step(sl, 37.);
    float raf = ln(abs(fract(p.z/2.) - .5)*2., .15, fwz);
    float pur = ln(abs(fract(sl/6. + .5) - .5)*6., .26, fwx*1.4);
    float bars = mix(max(raf, pur), .3, smoothstep(.08, .4, aa));
    vec3 wood = timber(uTimber*1.1, vec2(p.z, sl), 2.)*roomLight(p, n);
    float sunSide = step(0., p.x*(uSunDir.x < 0. ? -1. : 1.));
    vec3 pc = paper(mix(uPaperR*mix(vec3(.74, .84, 1.)*.8, vec3(.5, .66, 1.)*.62, uKey), uPaperR*mix(1.12, 1.3, uKey), sunSide), vec2(p.z, sl), p.z);
    pc = mix(pc, uPaperR*3., hole);
    col = mix(wood, mix(pc, wood*.6, bars*(1. - hole)), band);
    // the open bay: shutters swung back, the sky a glare between the rafters
    float bx = p.x*(uSunDir.x < 0. ? -1. : 1.);
    float bo = step(uBay.x, bx)*step(bx, uBay.y)*step(abs(p.z - uBay.z), uBay.w);
    col = mix(col, mix(uBayCol*1.9 + uPaperR*.4, wood*.5, max(raf, pur)*.8), bo);
  } else if (vId < 3.5) {
    // ---- the far gable: heavy framing, a great round window of blue paper and, in its centre, the moon gate (cut out)
    vec2 g = vec2(p.x, p.y - 18.);
    float r = length(g);
    if (r < 8.6) discard;
    float aa = fwx + fwy, ax = abs(p.x);
    float th = atan(g.y, g.x + step(r, 1e-4)*1e-3);
    float moon = step(11.2, r)*step(r, 19.2);
    vec2 mq = vec2(th*14.483, r - 11.2);
    float ml = lattice(mq, aa)*mix(.62, .3, smoothstep(.25, 1.2, aa));      // from far off the lattice melts into the glow
    ml = max(ml, ln(abs(fract(th*1.9098593 + .5) - .5)*r*.5235988, .2, aa));      // twelve heavy spokes
    ml = max(ml, max(ln(r - 15.2, .16, aa), max(ln(r - 11.2, .3, aa), ln(19.2 - r, .3, aa))));
    vec3 mc = uMoon*(.9 + .18*dkVn(mq*.33))*(.93 + .14*dkH21(floor(mq/1.4)))*mix(1.14, .86, (r - 11.2)/8.)*(1. + .08*gust(p.x*3. + 40.));
    float top = 41.2 - ax*.9375;
    float win = step(21.6, ax)*step(ax, 29.4)*step(4.5, p.y)*step(p.y, top);
    float edge = min(min(ax - 21.6, 29.4 - ax), min(p.y - 4.5, top - p.y));
    float lat = max(lattice(p.xy, aa), ln(edge, .4, aa));
    vec3 pc = paper(uPaperG*mix(.78, 1.3, clamp((p.y - 4.5)/16., 0., 1.)), p.xy, p.x*3. + 40.);
    vec3 a = timber(uTimber*1.2, p.xy, 1.3);
    float stud = max(ln(abs(fract(p.x/4. + .5) - .5)*4., .3, aa), ln(abs(fract(p.y/5.2) - .5)*5.2, .26, aa));
    a = mix(a, uTimber*1.9, stud*.6);
    vec3 gl = roomLight(p, n) + uPaperG*.12 + uMoon*.16*exp(-max(r - 19.2, 0.)*.22);
    vec3 wood = a*gl;
    col = mix(wood, mix(pc, uTimber*.4*gl, lat), win);
    col = mix(col, mix(mc, uTimber*.3*gl + mc*.1, ml), moon);
    moonK = moon*(1. - ml*.6);
  } else {
    // ---- the wall behind us: boards and the big door
    vec3 a = timber(uTimber*1.2, p.xy, 1.1);
    float door = step(abs(p.x), 7.)*step(p.y, 15.);
    a = mix(a, uTimber*.7, door*.6);
    a = mix(a, uGold*.6, ln(abs(max(abs(p.x) - 7., p.y - 15.)), .14, fwx + fwy));
    col = a*roomLight(p, n);
  }
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
  gl_FragColor.rgb = mix(gl_FragColor.rgb, col, moonK*.8);      // the blue window punches through the dust
}`;

// ------------------------------------------------------------------ solids: timber, bamboo, props, heads
// Geometry comes from the kit's makeBuilder (position, normal, color, surf); surf.x = id + gloss:
// 0 plain, 1 wood, 2 cloth, 3 stone, 4 painted scales, 5 paper skin, 6 bamboo; surf.y = grain axis.
const SOLID_VS = /* glsl */`
#include <common>
#include <fog_pars_vertex>
attribute vec3 color; attribute vec4 surf;
varying vec3 vPos; varying vec3 vObj; varying vec3 vN; varying vec3 vCol; varying vec4 vSurf;
void main(){
  vec4 wp = modelMatrix*vec4(position, 1.);
  vPos = wp.xyz; vObj = position; vN = mat3(modelMatrix)*normal; vCol = color; vSurf = surf;
  vec4 mvPosition = viewMatrix*wp;
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const SOLID_FS = /* glsl */`
#include <common>
#include <fog_pars_fragment>
${GLSL_ROOM}
uniform vec3 uGold, uGilt, uInk;
uniform float uGlow;
varying vec3 vPos; varying vec3 vObj; varying vec3 vN; varying vec3 vCol; varying vec4 vSurf;
void main(){
  vec3 p = vPos, q = vObj;
  vec3 N = normalize(vN + vec3(0., 1e-5, 0.));
  if (!gl_FrontFacing) N = -N;
  vec3 V = uCam - p; float dist = length(V); V /= max(dist, 1e-4);
  float id = floor(vSurf.x), gloss = fract(vSurf.x);
  float fw = fwidth(q.x) + fwidth(q.y) + fwidth(q.z);
  float fine = 1. - smoothstep(.02, .16, fw);
  vec3 g = vSurf.y < .5 ? q.yzx : (vSurf.y < 1.5 ? q.zxy : q.xyz);
  vec3 a = vCol;
  float thru = 0., rim = .3;
  if (id < .5) {
    a *= .9 + .2*dkVn(q.xy*3. + q.z*2.3);
  } else if (id < 1.5) {
    a *= .64 + .62*dkVn(vec2((g.x + g.y*.7)*5., g.z*.4));
    a *= 1. + .26*(dkVn(vec2((g.x - g.y)*26., g.z*1.8)) - .5)*fine;
    a *= 1. - .35*ln(abs(fract(g.z*.19 + g.x*.07) - .5), .012, fw)*fine;
    rim = 1.;
  } else if (id < 2.5) {
    a *= .84 + .26*dkVn(q.xy*8. + q.z*6.);
    a *= 1. + .12*sin(q.x*55. + q.z*31.)*sin(q.y*55.)*fine;
    thru = .25;
  } else if (id < 3.5) {
    a *= .78 + .32*dkVn(q.xz*1.7 + q.y);
    a *= .92 + .16*dkVn(q.xz*19. + q.y*13.)*fine;
  } else if (id < 4.5) {
    vec2 s = vec2(g.z*1.2 + g.x*.3, g.y*1.45);
    float r = floor(s.y);
    vec2 f = vec2(fract(s.x + .5*mod(r, 2.)) - .5, (fract(s.y) - 1.)*.9);
    float d = length(f), aa = fw*1.6;
    float hh = dkH21(vec2(floor(s.x + .5*mod(r, 2.)), r));
    a *= mix(.62, 1.1, smoothstep(.15, .75, d))*(.88 + .24*hh);
    a = mix(a, uGilt, ln(abs(d - .6), .055, aa)*fine);
    a = mix(a, uInk, ln(abs(d - .7), .03, aa)*fine);
    a = mix(a, uGilt, (1. - smoothstep(.07, .07 + aa, length(f + vec2(0., .32))))*fine*.9);
    a *= .9 + .2*dkVn(q.xy*14. + q.z*9.);
    thru = .3; rim = .6;
  } else if (id < 5.5) {
    a *= .88 + .16*dkVn(q.xy*11. + q.z*7.);
    float ribs = max(ln(abs(fract(g.z/1.15) - .5)*1.15, .035, fw), ln(abs(fract(g.y/.95) - .5)*.95, .03, fw));
    a *= 1. - .45*ribs*fine;
    thru = .6;
  } else {
    float nd = ln(abs(fract(g.z/1.05 + g.x*.13) - .5)*1.05, .03, fw*1.5);
    a *= .8 + .32*dkVn(vec2((g.x + g.y)*4., g.z*.5));
    a = mix(a, a*vec3(.72, .95, .5), .35*dkVn(vec2(g.z*.3, g.x*2.)));
    a = mix(a, a*.32, nd*.75*fine);
    rim = 1.2;
  }
  vec3 L = roomLight(p, N);
  float ao = mix(.5, 1., smoothstep(0., 2.4, p.y));
  vec3 col = a*L*ao + (a*a*1.2 + a*.3)*roomLight(p, -N)*thru;
  float ndv = max(dot(N, V), 0.);
  vec3 R = reflect(-V, N);
  float sg = uSunDir.x < 0. ? -1. : 1.;
  float hS = 1./(1. + sq(max(32. - p.x*sg, 0.))*.0017);
  float mir = smoothstep(.55, .95, gloss);
  col += uSun*dkSpec(N, V, mix(10., 80., gloss))*gloss*(.3 + hS)*.7;
  col += a*(uRoof*max(R.y, 0.) + uGable*sq(max(-R.z, 0.)) + uSun*sq(max(R.x*sg, 0.))*hS*1.5)*mir*.7;
  float fr = 1. - ndv; fr = fr*fr*fr;
  col += uGold*(uSun*(.25 + hS) + uRoof)*.2*fr*rim;
  col += vCol*vSurf.z*uGlow*3.;
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;

// ------------------------------------------------------------------ paper: every hung kite, drape and pennant
// Geometry: panels as fans (aQ = paint id, b = 0 on the panel's rim .. 1 at its centre, t = tail parameter,
// keyline width in b). Instances: aH = pivot xyz + string length, aI = span, yaw, phase, pitch,
// aC1 = accent A + lantern flag, aC2 = accent B. They swing as pendulums, lean with the draught and are
// kicked as the dragon's tail (uEye) goes by.
const GLSL_SWING = /* glsl */`
attribute vec4 aH; attribute vec4 aI;
uniform float uEye, uTime;
${GLSL_CURVE}
// dn = unit vector from the pivot down the string; returns how hard the kite is being buffeted
float kiteSwing(out vec3 dn){
  float sK = DK_Z0 - aH.z, ph = aI.z;
  float Lp = aH.w + aI.x*.5;
  float w = 2.6/sqrt(max(Lp, 1.));
  float dx = aH.x - snakeX(clamp(sK, 0., 764.));
  float nearb = exp(-dx*dx/170.);
  float d = uEye + 3.5 - sK;
  float moving = smoothstep(70., 100., uEye);
  float pass = step(0., d)*exp(-max(d, 0.)/150.);
  float along = (1. - step(0., d))*moving;
  float gu = .5 + .5*sin(uTime*.9 + aH.z*.03 + ph*.3);
  float amp = .035 + .05*gu + nearb*(.08*along + .26*pass);
  float ax = amp*sin(uTime*w + ph) + nearb*pass*.3*sin(d*.12 + ph);
  float az = amp*.8*sin(uTime*w*.91 + ph*1.7) + (dx < 0. ? -1. : 1.)*nearb*pass*.42*exp(-max(d, 0.)/50.);
  dn = normalize(vec3(az, -1., -.05 - .07*gu - ax));
  return nearb*(along + pass);
}
`;
const PAPER_VS = /* glsl */`
#include <common>
#include <fog_pars_vertex>
attribute vec4 aQ; attribute vec4 aC1; attribute vec3 aC2;
${GLSL_SWING}
varying vec2 vUv; varying vec4 vQ; varying vec3 vN; varying vec3 vPos; varying vec3 vA; varying vec3 vB; varying float vLan;
void main(){
  vec3 dn; float buf = kiteSwing(dn);
  float S = aI.x, yaw = aI.y, ph = aI.z, pt = aI.w, t = aQ.z;
  vec3 Y = -dn, Zb = vec3(sin(yaw), 0., cos(yaw));
  vec3 X = normalize(cross(Y, Zb)), Z = cross(X, Y);
  vec3 p = position*S;
  float cp = cos(pt), sp = sin(pt);
  p.yz = vec2(p.y*cp - p.z*sp, p.y*sp + p.z*cp);
  vec3 nl = vec3(0., -sp, cp);
  float tip = abs(uv.x)*2.;
  p.z += sin(uTime*(3. + buf*4.) + ph + uv.y*5.)*tip*tip*S*(.035 + .05*buf);
  vec3 wl = aH.xyz + dn*aH.w + X*p.x + Y*p.y + Z*p.z;
  float t2 = t*t;
  wl += vec3(0., .22, -1.)*t2*S*(.55 + .5*buf)*(pt < -.4 ? -.5 : 1.);
  wl += (X*sin(uTime*5.1 + t*7. + ph) + Z*cos(uTime*4.3 + t*6. + ph*1.3))*t*S*(.07 + .06*buf);
  vN = X*nl.x + Y*nl.y + Z*nl.z;
  vUv = uv; vQ = aQ; vPos = wl; vA = aC1.rgb; vB = aC2; vLan = aC1.a;
  vec4 mvPosition = modelViewMatrix*vec4(wl, 1.);
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const PAPER_FS = /* glsl */`
#include <common>
#include <fog_pars_fragment>
${GLSL_ROOM}
uniform vec3 uCream, uInk, uBam;
uniform float uTrans;
varying vec2 vUv; varying vec4 vQ; varying vec3 vN; varying vec3 vPos; varying vec3 vA; varying vec3 vB; varying float vLan;
void main(){
  float id = vQ.x, b = vQ.y, kw = max(vQ.w, .004);
  vec3 N = normalize(vN + vec3(0., 1e-5, 0.));
  if (!gl_FrontFacing) N = -N;
  float fb = max(fwidth(b), 1e-5);
  float lodk = 1. - smoothstep(kw*.5, kw*2.6, fb);
  vec3 a = id < .5 ? uCream : (id < 1.5 ? vA : (id < 2.5 ? vB : (id < 3.5 ? uInk*2.6 : (id < 4.5 ? uBam : mix(vA, uCream, .4)))));
  a *= .86 + .22*dkVn(vUv*21. + vPos.z*.01);
  float echo = ln(abs(b - .3), kw*.45, fb)*lodk*step(id, 2.5);
  a = mix(a, id < .5 ? uInk*3. : uCream*.92, echo*.7);
  float key = ln(b, kw, fb)*(1. - step(3.5, id)*step(id, 4.5));
  a = mix(a, uInk, key*mix(.3, 1., lodk));
  float fux = fwidth(vUv.x) + 1e-5, fuy = fwidth(vUv.y) + 1e-5;
  float silk = step(.25, vLan)*step(vLan, .75);                 // drapes and curtains: no bamboo, more light through
  a *= mix(1., (.8 + .2*sin(vUv.x*40. + 2.2*sin(vUv.y*1.3 + vPos.x)))*(1. - .3*uLantern), silk);      // the folds of hung cloth
  // the bamboo inside the lit paper: spine, a spar, a bowed leading edge
  float rib = max(ln(abs(vUv.x), .006, fux), max(ln(vUv.y + .19, .006, fuy), ln(vUv.y + .05 + .55*vUv.x*vUv.x, .006, fux + fuy)));
  rib *= step(id, 2.5)*lodk*(1. - silk)*(1. - step(1.5, vLan));
  vec3 tc = a*a*1.25 + a*.32;
  float pass = id > 4.5 ? 1.5 : 1.;
  float sgp = uSunDir.x < 0. ? -1. : 1.;
  float hSp = 1./(1. + sq(max(32. - vPos.x*sgp, 0.))*.0032);      // how near the sun wall this paper hangs
  vec3 sunT = uPaperS*hSp*uKey*(.36 + .55*silk) + (uRoof*.5 + uGable*.25 + uFlame*uLantern*.35)*silk;
  vec3 col = a*roomLight(vPos, N)*.42 + tc*(roomLight(vPos, -N)*uTrans*pass + sunT)*(1. - .7*rib);
  float fl = .86 + .14*sin(uTime*7. + vPos.x*3.)*sin(uTime*11.3 + vPos.z);
  float lamp = step(1.5, vLan);                                  // a lantern of the gallery: lit in every look
  float lanK = max(step(.75, vLan)*uLantern, lamp);
  float hoop = ln(abs(fract(vUv.y*8.) - .5)/8., .009, fuy)*lamp*step(id, 2.5)*lodk;
  col = col*(1. - .7*lanK) + lanK*fl*(tc*uFlame*2.3*(.3 + .7*b) + uFlame*1.3*b*b*b*b)*(1. - .5*hoop)*mix(1., .8, lamp);
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;
const STRING_VS = /* glsl */`
#include <common>
#include <fog_pars_vertex>
${GLSL_SWING}
uniform vec3 uCam;
varying float vW;
void main(){
  vec3 dn; kiteSwing(dn);
  vec3 p = aH.xyz + dn*aH.w*position.y;
  vec3 toCam = uCam - p; float dist = length(toCam);
  vec3 side = cross(dn, toCam); side /= max(length(side), 1e-4);
  float w = max(.022, dist*.0016);
  p += side*position.x*w;
  vW = clamp(.022/w, 0., 1.);
  vec4 mvPosition = modelViewMatrix*vec4(p, 1.);
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const STRING_FS = /* glsl */`
#include <common>
#include <fog_pars_fragment>
uniform vec3 uCol;
varying float vW;
void main(){
  gl_FragColor = vec4(uCol, mix(.35, 1., vW));
  #include <fog_fragment>
}`;

// ------------------------------------------------------------------ shafts of sun and the sky in the moon gate
const GLSL_FOGK = /* glsl */`
float fogK(){
  #ifdef USE_FOG
    #ifdef FOG_EXP2
      return 1. - exp(-fogDensity*fogDensity*vFogDepth*vFogDepth);
    #else
      return smoothstep(fogNear, fogFar, vFogDepth);
    #endif
  #else
    return 0.;
  #endif
}`;
const BEAM_VS = /* glsl */`
#include <common>
#include <fog_pars_vertex>
attribute vec4 aA; attribute vec4 aB;
uniform vec3 uCam;
varying vec2 vUv; varying vec3 vK;
void main(){
  vec3 D = aB.xyz - aA.xyz; float L = length(D); D /= max(L, 1e-4);
  vec3 P = aA.xyz + D*L*position.y;
  vec3 side = cross(D, uCam - P); side /= max(length(side), 1e-4);
  P += side*position.x*aA.w*(1. + position.y*.7);
  vec3 c = uCam - aA.xyz; float tt = clamp(dot(c, D), 0., L);
  float dc = length(c - D*tt);
  vUv = position.xy; vK = vec3(L, aB.w, .3 + .7*smoothstep(.5, 3., dc/max(aA.w, .1)));
  vec4 mvPosition = modelViewMatrix*vec4(P, 1.);
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const BEAM_FS = /* glsl */`
#include <common>
#include <fog_pars_fragment>
${GLSL_FOGK}
uniform vec3 uShaft; uniform float uTime, uBeam;
varying vec2 vUv; varying vec3 vK;
float bH(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x*p.y); }
float bN(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3. - 2.*f);
  return mix(mix(bH(i), bH(i + vec2(1., 0.)), f.x), mix(bH(i + vec2(0., 1.)), bH(i + vec2(1., 1.)), f.x), f.y); }
void main(){
  float x = 1. - vUv.x*vUv.x;
  float a = x*x*smoothstep(0., .03, vUv.y)*(1. - smoothstep(.7, 1., vUv.y));
  float dust = .62 + .6*bN(vec2(vUv.x*2.5 + vK.y*9., vUv.y*vK.x*.22 - uTime*.2));
  dust += .25*bN(vec2(vUv.x*9. + vK.y*3., vUv.y*vK.x*.9 - uTime*.5));
  gl_FragColor = vec4(uShaft*uBeam*a*dust*vK.z*(1. - .55*fogK()), 1.);
}`;
// the stream of swallows that comes down the loft against us at u 0.62 (in through the moon gate, over our heads)
const BIRD_VS = /* glsl */`
#include <common>
#include <fog_pars_vertex>
attribute vec4 aB; attribute vec2 aW;
uniform float uBird, uTime;
${GLSL_CURVE}
varying vec3 vPos; varying vec3 vN; varying vec2 vW;
void main(){
  float s = 600. + aB.z - uBird;
  float k = 1. - smoothstep(690., 768., s);
  float wv = sin(uTime*1.3 + aB.w), wy = sin(uTime*1.7 + aB.w*2.);
  vec3 c = vec3(snakeX(min(s, 764.))*.45 + (aB.x + wv*.9)*k, mix(18., eyeY(min(s, 764.)) + aB.y + wy*.6, k), DK_Z0 - s);
  // flap in bursts, glide between them, bank with the weave
  float burst = smoothstep(-.2, .5, sin(uTime*1.9 + aB.w*3.));
  float fl = sin(uTime*(12. + fract(aB.w)*4.) + aB.w*5.)*mix(.25, 1., burst);
  vec3 p = position*2.7;
  float wk = aW.x*step(.5, aW.y);
  p.y += wk*wk*(fl*.8 + .22)*.92;
  p.x *= 1. - .2*wk*(.5 - .5*fl);
  float bank = cos(uTime*1.3 + aB.w)*.35*k, cb = cos(bank), sb = sin(bank);
  p.xy = vec2(p.x*cb - p.y*sb, p.x*sb + p.y*cb);
  vec3 nn = normal; nn.xy = vec2(nn.x*cb - nn.y*sb, nn.x*sb + nn.y*cb);
  vPos = c + p; vN = nn; vW = aW;
  vec4 mvPosition = modelViewMatrix*vec4(vPos, 1.);
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const BIRD_FS = /* glsl */`
#include <common>
#include <fog_pars_fragment>
${GLSL_ROOM}
varying vec3 vPos; varying vec3 vN; varying vec2 vW;
void main(){
  vec3 N = normalize(vN + vec3(0., 1e-5, 0.));
  float flat_ = step(.5, vW.y), tail = step(1.5, vW.y);
  float below = step(vPos.y, uCam.y);                          // we look down on it: the blue-black back
  float under = flat_ > .5 ? 1. - below : 1. - smoothstep(-.3, .15, N.y);
  vec3 navy = vec3(.012, .02, .06), cream = vec3(.86, .76, .55), rufous = vec3(.6, .17, .06);
  // blue-black wings and tail from both sides (a little paler beneath), cream belly, rufous throat
  vec3 wing = mix(mix(navy*2.4, cream*.5, uLantern), mix(navy, cream*.12, uLantern*(1. - tail)), max(smoothstep(.15, .4, vW.x), tail));      // by lantern light the underwing shows pale
  vec3 a = flat_ > .5 ? mix(navy, wing, under) : mix(navy, mix(cream, rufous, smoothstep(.45, .7, vW.x)), under);
  if (flat_ > .5) N = vec3(0., 1. - 2.*under, 0.);
  vec3 L = roomLight(vPos, N) + uAmb*.6 + (uRoof*.55 + uSun*.3 + uFloor)*under;
  gl_FragColor = vec4(a*L, 1.);
  #include <fog_fragment>
}`;
const SKY_VS = /* glsl */`
#include <common>
#include <fog_pars_vertex>
varying vec2 vUv;
void main(){
  vUv = position.xy;
  vec4 mvPosition = modelViewMatrix*vec4(position, 1.);
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const SKY_FS = /* glsl */`
#include <common>
#include <fog_pars_fragment>
${GLSL_FOGK}
uniform vec3 uZen, uHor; uniform float uTime, uMode, uFogK;
varying vec2 vUv;
float sH(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x*p.y); }
void main(){
  vec2 q = vUv/9.;
  vec3 col = mix(uHor, uZen, smoothstep(-.9, .9, q.y));
  float fw = fwidth(vUv.x) + 1e-4;
  if (uMode > .5 && uMode < 1.5) {          // fine rain: bright threads
    vec2 r = vec2(vUv.x*2.6 + vUv.y*.25, vUv.y*.22 + uTime*2.6);
    float h = sH(vec2(floor(r.x), floor(r.y)));
    float th = (1. - smoothstep(.07, .07 + fw*2.6, abs(fract(r.x) - .5)))*step(.45, h)*fract(r.y);
    col += uHor*th*.9;
  } else if (uMode > 1.5 && uMode < 2.5) {   // snow blowing in
    vec2 r = vec2(vUv.x*.9 + sin(uTime*.7 + vUv.y*.6)*.5 + uTime*.3, vUv.y*.9 + uTime*1.3);
    vec2 c = floor(r); float h = sH(c);
    float d = length(fract(r) - .5 - (vec2(h, sH(c + 3.)) - .5)*.5);
    col += vec3(.5)*(1. - smoothstep(.1, .1 + fw*1.2, d))*step(.35, h);
  } else if (uMode > 2.5) {                  // lantern dusk: first stars
    vec2 c = floor(vUv*1.3); float h = sH(c);
    float d = length(fract(vUv*1.3) - .5 - (vec2(h, sH(c + 7.)) - .5)*.6);
    col += vec3(1.1, 1., .8)*(1. - smoothstep(.04, .09, d))*step(.72, h)*(.6 + .4*sin(uTime*3. + h*40.));
  }
  col = mix(col, fogColor, fogK()*uFogK);
  gl_FragColor = vec4(col, 1.);
}`;

// ------------------------------------------------------------------ kite geometry (unit span, hang point at the origin)
const ell = (cx, cy, rx, ry, n = 12, rot = 0) => {
  const out = [], c = Math.cos(rot), s = Math.sin(rot);
  for (let i = 0; i < n; i++) { const a = (i / n) * TAU, x = Math.cos(a) * rx, y = Math.sin(a) * ry; out.push([cx + x * c - y * s, cy + x * s + y * c]); }
  return out;
};
function kiteGeo() {
  const pos = [], uv = [], q = [], idx = [];
  let n = 0;
  const v = (x, y, z, id, b, t, kw) => { pos.push(x, y, z); uv.push(x, y); q.push(id, b, t, kw); return n++; };
  return {
    // a painted panel: a fan from its centre (b = 1) to its outline (b = 0, where the keyline is drawn)
    panel(pts, id, o = {}) {
      let cx = 0, cy = 0;
      for (const p of pts) { cx += p[0]; cy += p[1]; }
      cx /= pts.length; cy /= pts.length;
      if (o.c) { cx = o.c[0]; cy = o.c[1]; }
      let rad = 0;
      for (const p of pts) rad += Math.hypot(p[0] - cx, p[1] - cy);
      rad /= pts.length;
      const kw = clamp((o.k ?? 0.012) / rad, 0.02, 0.45), t = o.t || 0, z = o.z || 0;
      const c = v(cx, cy, z, id, 1, t, kw), first = n;
      for (const p of pts) v(p[0], p[1], z, id, 0, t, kw);
      for (let i = 0; i < pts.length; i++) idx.push(c, first + i, first + ((i + 1) % pts.length));
    },
    // a streamer hanging from (x, y): t runs t0..t1 down it (it streams with the draught), b across it
    streamer(x, y, len, w0, w1, id, segs, t0 = 0, t1 = 1, dx = 0, kw = 0.14, z = 0) {
      let prev = null;
      for (let i = 0; i <= segs; i++) {
        const f = i / segs, w = lerp(w0, w1, f), t = lerp(t0, t1, f), yy = y - len * f, xx = x + dx * f;
        const a = v(xx - w, yy, z, id, 0, t, kw), c = v(xx, yy, z, id, 1, t, kw), e = v(xx + w, yy, z, id, 0, t, kw);
        if (prev) idx.push(prev[0], a, c, prev[0], c, prev[1], prev[1], c, e, prev[1], e, prev[2]);
        prev = [a, c, e];
      }
    },
    // a paper lantern: n sides through rings [y, radius, b] (b = 0 at the dark caps .. 1 where the flame shows most)
    lathe(rings, sides, id, kw = 0.06) {
      let prev = null;
      for (const [y, r, b] of rings) {
        const ring = [];
        for (let j = 0; j <= sides; j++) { const a = (j / sides) * TAU; ring.push(v(Math.cos(a) * r, y, Math.sin(a) * r, id, b, 0, kw)); }
        if (prev) for (let j = 0; j < sides; j++) idx.push(prev[j], ring[j], ring[j + 1], prev[j], ring[j + 1], prev[j + 1]);
        prev = ring;
      }
    },
    build(h) {
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      g.setAttribute('aQ', new THREE.Float32BufferAttribute(q, 4));
      g.setIndex(idx);
      return { geo: g, h, tris: idx.length / 3 };
    },
  };
}
const KITES = {
  // sand swallow: broad wings with roundels, a forked tail
  swallow(w = 0, r = 1, c = 1, h = 2) {
    const g = kiteGeo();
    for (const s of [1, -1]) {
      const m = (pts) => pts.map((p) => [p[0] * s, p[1]]);
      g.panel(m([[0.03, -0.1], [0.16, -0.035], [0.3, -0.03], [0.42, -0.07], [0.5, -0.17], [0.46, -0.25], [0.36, -0.3], [0.24, -0.35], [0.12, -0.43], [0.03, -0.4]]), w, { c: [0.22 * s, -0.2] });
      g.panel(m(ell(0.25, -0.19, 0.078, 0.078, 10)), r, { z: 0.006 });
      g.panel(m(ell(0.25, -0.19, 0.034, 0.034, 8)), 3, { z: 0.012 });
      g.panel(m([[0.36, -0.045], [0.42, -0.07], [0.5, -0.17], [0.46, -0.25], [0.41, -0.16]]), 2, { z: 0.006 });
      g.panel(m([[0.015, -0.4], [0.12, -0.43], [0.2, -0.62], [0.23, -0.82], [0.17, -0.95], [0.1, -0.8], [0.03, -0.62]]), w, { t: 0.08 });
      g.panel(m([[0.2, -0.62], [0.23, -0.82], [0.17, -0.95], [0.1, -0.8], [0.13, -0.66]]), 1, { z: 0.006, t: 0.12 });
      g.panel(m(ell(0.032, -0.045, 0.014, 0.014, 6)), 3, { z: 0.014 });
    }
    g.panel(ell(0, -0.25, 0.07, 0.17, 12), c, { z: 0.006 });
    g.panel(ell(0, -0.25, 0.034, 0.1, 8), h, { z: 0.012 });
    g.panel(ell(0, -0.055, 0.06, 0.065, 12), h, { z: 0.008 });
    return g.build(0.95);
  },
  butterfly() {
    const g = kiteGeo();
    for (const s of [1, -1]) {
      const m = (pts) => pts.map((p) => [p[0] * s, p[1]]);
      g.panel(m([[0.02, -0.2], [0.06, -0.08], [0.18, 0], [0.34, 0], [0.46, -0.07], [0.5, -0.18], [0.45, -0.3], [0.33, -0.38], [0.15, -0.4], [0.03, -0.36]]), 0, { c: [0.26 * s, -0.2] });
      g.panel(m(ell(0.3, -0.19, 0.1, 0.09, 10)), 1, { z: 0.006 });
      g.panel(m(ell(0.3, -0.19, 0.045, 0.04, 8)), 3, { z: 0.012 });
      g.panel(m([[0.34, 0], [0.46, -0.07], [0.5, -0.18], [0.43, -0.12]]), 2, { z: 0.006 });
      g.panel(m([[0.02, -0.38], [0.15, -0.42], [0.3, -0.42], [0.37, -0.52], [0.33, -0.66], [0.22, -0.74], [0.1, -0.7], [0.03, -0.56]]), 0, {});
      g.panel(m(ell(0.2, -0.57, 0.075, 0.08, 10)), 2, { z: 0.006 });
      g.streamer(0.22 * s, -0.72, 0.34, 0.014, 0.034, 5, 4, 0.1, 0.6);
      g.panel(m([[0.008, -0.16], [0.1, 0.07], [0.125, 0.075], [0.03, -0.16]]), 3, { z: 0.004, k: 0 });
    }
    g.panel(ell(0, -0.4, 0.032, 0.26, 10), 3, { z: 0.01 });
    return g.build(0.78);
  },
  goldfish() {
    const g = kiteGeo();
    g.panel(ell(0, -0.34, 0.2, 0.32, 14), 1, {});
    g.panel(ell(0, -0.4, 0.12, 0.2, 10), 2, { z: 0.006 });
    g.panel(ell(0, -0.09, 0.14, 0.1, 10), 1, { z: 0.004 });
    for (const s of [1, -1]) {
      g.panel(ell(0.17 * s, -0.1, 0.085, 0.085, 10), 0, { z: 0.01 });
      g.panel(ell(0.18 * s, -0.1, 0.04, 0.04, 8), 3, { z: 0.016 });
      g.panel([[0.17 * s, -0.3], [0.42 * s, -0.3], [0.5 * s, -0.44], [0.36 * s, -0.5], [0.19 * s, -0.45]], 5, { t: 0.18 });
      g.streamer(0.1 * s, -0.62, 1.15, 0.06, 0.15, 5, 7, 0.05, 1, 0.16 * s);
    }
    g.streamer(0, -0.64, 1.3, 0.07, 0.17, 5, 7, 0.05, 1, 0);
    return g.build(1.9);
  },
  cicada() {
    const g = kiteGeo();
    for (const s of [1, -1]) {
      g.panel(ell(0.23 * s, -0.5, 0.11, 0.42, 12, 0.42 * s), 0, {});
      g.panel(ell(0.23 * s, -0.5, 0.055, 0.3, 10, 0.42 * s), 0, { z: 0.005 });
      g.panel(ell(0.19 * s, -0.42, 0.075, 0.27, 10, 0.78 * s), 5, { z: -0.004, t: 0.1 });
      g.panel(ell(0.12 * s, -0.06, 0.042, 0.042, 8), 1, { z: 0.01 });
    }
    g.panel(ell(0, -0.07, 0.12, 0.07, 10), 3, { z: 0.006 });
    g.panel(ell(0, -0.22, 0.11, 0.11, 10), 1, { z: 0.008 });
    g.panel(ell(0, -0.5, 0.085, 0.21, 10), 3, { z: 0.008 });
    g.panel(ell(0, -0.42, 0.07, 0.035, 8), 2, { z: 0.014 });
    g.panel(ell(0, -0.55, 0.06, 0.03, 8), 2, { z: 0.014 });
    return g.build(0.95);
  },
  eagle() {
    const g = kiteGeo();
    for (const s of [1, -1]) {
      const m = (pts) => pts.map((p) => [p[0] * s, p[1]]);
      g.panel(m([[0.04, -0.12], [0.2, -0.06], [0.38, -0.05], [0.5, -0.02], [0.49, -0.1], [0.44, -0.13], [0.46, -0.19], [0.4, -0.2], [0.41, -0.26], [0.34, -0.25], [0.33, -0.31], [0.24, -0.28], [0.12, -0.3], [0.04, -0.28]]), 3, { c: [0.22 * s, -0.17] });
      g.panel(m([[0.27, -0.085], [0.37, -0.08], [0.37, -0.2], [0.28, -0.24]]), 0, { z: 0.006 });
      g.panel(m([[0.08, -0.12], [0.2, -0.09], [0.2, -0.25], [0.08, -0.26]]), 2, { z: 0.006 });
    }
    g.panel(ell(0, -0.2, 0.05, 0.14, 10), 2, { z: 0.01 });
    g.panel(ell(0, -0.05, 0.04, 0.046, 8), 0, { z: 0.012 });
    g.panel([[-0.04, -0.3], [0.04, -0.3], [0.11, -0.5], [0.05, -0.53], [0, -0.5], [-0.05, -0.53], [-0.11, -0.5]], 3, { t: 0.1 });
    g.panel([[-0.06, -0.42], [0.06, -0.42], [0.08, -0.48], [-0.08, -0.48]], 0, { z: 0.006, t: 0.1 });
    return g.build(0.55);
  },
  // a ladder of twenty small diamonds on one line
  ladder() {
    const g = kiteGeo();
    for (let i = 0; i < 20; i++) {
      const y = -i * 1.3, t = (i / 20) * 0.34;
      g.panel([[0, y], [0.5, y - 0.5], [0, y - 1.05], [-0.5, y - 0.5]], i % 3 === 1 ? 1 : (i % 3 === 2 ? 2 : 0), { t, k: 0.03 });
      g.streamer(0, y - 1.05, 0.25, 0.02, 0.02, 3, 1, t, t);
    }
    return g.build(26);
  },
  // a length of silk over a pole, a pennant, a tassel of dyed hemp
  drape() { const g = kiteGeo(); g.streamer(0, 0, 2.4, 0.5, 0.5, 1, 9, 0, 0.42, 0, 0.05); return g.build(2.4); },
  great() { return KITES.swallow(1, 0, 2, 2); },
  pennant() { const g = kiteGeo(); g.streamer(0, 0, 2.6, 0.5, 0.03, 1, 9, 0, 0.75, 0, 0.08); return g.build(2.6); },
  sheet() {
    const g = kiteGeo(); g.streamer(0, 0, 1.3, 0.5, 0.5, 1, 8, 0, 0.16, 0, 0.05);
    g.panel(ell(0, -0.65, 0.3, 0.3, 14), 2, { z: 0.004, t: 0.06 }); g.panel(ell(0, -0.65, 0.17, 0.17, 10), 1, { z: 0.008, t: 0.06 });
    for (const [x, y] of [[-0.36, -0.14], [0.36, -0.14], [-0.36, -1.16], [0.36, -1.16]]) g.panel(ell(x, y, 0.07, 0.07, 6), 2, { z: 0.004, t: 0.06 });
    return g.build(1.3);
  },
  tassel() { const g = kiteGeo(); g.streamer(0, 0, 1, 0.05, 0.012, 1, 6, 0, 0.5, 0, 0.3); return g.build(1); },
  // a long length of dyed silk over a pole (unit width, len widths long): a border stripe down each edge,
  // printed roundels down the middle, a fringed hem that streams with the draught
  curtain(len = 4.6) {
    const g = kiteGeo(), tm = 0.62;
    g.streamer(0, 0, len, 0.5, 0.5, 1, 16, 0, tm, 0, 0.03);
    for (const sx of [-0.4, 0.4]) g.streamer(sx, 0, len, 0.045, 0.045, 2, 16, 0, tm, 0, 0.3, 0.004);
    for (let y = 0.75; y < len - 0.5; y += 1.25) {
      const t = tm * (y / len);
      g.panel(ell(0, -y, 0.26, 0.26, 12), 2, { z: 0.005, t, k: 0.02 }); g.panel(ell(0, -y, 0.13, 0.13, 8), 0, { z: 0.01, t, k: 0.02 });
    }
    for (let k = 0; k < 5; k++) g.streamer(-0.4 + k * 0.2, -len, 0.5, 0.07, 0.03, 2, 2, tm, tm + 0.12, 0, 0.3);
    return g.build(len + 0.5);
  },
  curtainL() { return KITES.curtain(6.1); },
  // the dye room: a long bolt of wet silk with a woven selvedge down each edge (unit width), and the valances
  bolt(len = 6.2, t1 = 0.6, segs = 14) {
    const g = kiteGeo();
    g.streamer(0, 0, len, 0.5, 0.5, 1, segs, 0, t1, 0, 0.03);
    for (const e of [-0.37, 0.37]) g.streamer(e, 0, len, 0.035, 0.035, 2, segs, 0, t1, 0, 0.3, 0.03);
    return g.build(len);
  },
  boltS() { return KITES.bolt(4.6, 0.5, 12); },
  valance() { return KITES.bolt(1.6, 0.4, 6); },
  valanceL() { return KITES.bolt(2.5, 0.45, 8); },
  // the lantern gallery: a round paper lantern and a tall one, each with a tassel
  lantern() {
    const g = kiteGeo();
    g.lathe([[0, 0.12, 0], [-0.15, 0.37, 0.4], [-0.5, 0.5, 1], [-0.85, 0.37, 0.4], [-1, 0.12, 0]], 7, 1);
    g.streamer(0, -1, 0.42, 0.04, 0.012, 2, 2, 0.1, 0.5, 0, 0.3);
    return g.build(1.45);
  },
  lanternT() {
    const g = kiteGeo();
    g.lathe([[0, 0.09, 0], [-0.08, 0.27, 0.2], [-0.72, 0.31, 1], [-1.36, 0.27, 0.2], [-1.44, 0.09, 0]], 7, 1);
    g.streamer(0, -1.44, 0.42, 0.04, 0.012, 2, 2, 0.1, 0.5, 0, 0.3);
    return g.build(1.9);
  },
  // a torn kite string, streaming
  torn() { const g = kiteGeo(); g.streamer(0, 0, 1, 0.011, 0.007, 0, 8, 0.05, 1, 0, 0.3); return g.build(1); },
};

// ------------------------------------------------------------------ builder helpers
const _q0 = new THREE.Quaternion(), _m0 = new THREE.Matrix4(), _yAx = new V3(0, 1, 0), _d0 = new V3(), _one = new V3(1, 1, 1), _c0 = new V3();
// an oriented timber from a to c (w, d = its two thicknesses); the grain follows its length
function beam(b, a, c, w, d, col, o = {}) {
  _d0.set(c[0] - a[0], c[1] - a[1], c[2] - a[2]);
  const len = _d0.length(); _d0.normalize();
  const ax = Math.abs(_d0.x) > 0.75 ? 0 : (Math.abs(_d0.y) > 0.7 ? 1 : 2);
  _q0.setFromUnitVectors(_yAx, _d0);
  _m0.compose(_c0.set((a[0] + c[0]) / 2, (a[1] + c[1]) / 2, (a[2] + c[2]) / 2), _q0, _one);
  b.add(box(w, len + (o.over || 0), d), { m: _m0, pre: o.pre, c: col, surf: o.surf || (o.bamboo ? sBam(ax) : sWood(ax, o.gloss ?? 0.3)) });
}
function tube(b, pts, r, col, sf, o = {}) {
  const curve = new THREE.CatmullRomCurve3(pts.map((p) => (p.isVector3 ? p : new V3(p[0], p[1], p[2]))), !!o.closed);
  const g = new THREE.TubeGeometry(curve, o.seg || 10, r, o.rad || 5, !!o.closed);
  g.deleteAttribute('uv');
  b.add(g, { pre: o.pre, c: col, surf: sf, s: o.s, p: o.p });
}
const cr = (a, b, c, d, t) => 0.5 * ((2 * b) + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t);
// rows of sections [z, half width, y at the crown, y at the open edge] -> a smooth half shell
function loftGeo(SEC, ni, nj, dir, colFn) {
  const N = SEC.length, pos = new Float32Array(ni * nj * 3), col = new Float32Array(ni * nj * 3), idx = [], c = new THREE.Color();
  const at = (f, k) => { const i = Math.min(N - 2, Math.floor(f)), t = f - i; return cr(SEC[Math.max(0, i - 1)][k], SEC[i][k], SEC[i + 1][k], SEC[Math.min(N - 1, i + 2)][k], t); };
  for (let i = 0; i < ni; i++) for (let j = 0; j < nj; j++) {
    const f = (i / (ni - 1)) * (N - 1), a = (j / (nj - 1)) * PI, k = (i * nj + j) * 3;
    const z = at(f, 0), w = at(f, 1), yc = at(f, 2), ye = at(f, 3);
    pos[k] = w * Math.cos(a); pos[k + 1] = ye + (yc - ye) * Math.pow(Math.sin(a), 0.8); pos[k + 2] = z;
    colFn(i / (ni - 1), j / (nj - 1), c); col[k] = c.r; col[k + 1] = c.g; col[k + 2] = c.b;
  }
  for (let i = 0; i + 1 < ni; i++) for (let j = 0; j + 1 < nj; j++) {
    const a = i * nj + j, e = a + 1, d = a + nj, f = d + 1;
    if (dir > 0) idx.push(a, d, e, e, d, f); else idx.push(a, e, d, e, f, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setIndex(idx); g.computeVertexNormals();
  return { g, at };
}
function flame(b, base, dir, len, wid, col, pre, sf = S_PLAIN) {
  _d0.set(dir[0], dir[1], dir[2]).normalize(); _q0.setFromUnitVectors(_yAx, _d0);
  _m0.compose(_c0.set(base[0] + _d0.x * len / 2, base[1] + _d0.y * len / 2, base[2] + _d0.z * len / 2), _q0, new V3(wid, 1, wid * 0.16));
  b.add(new THREE.ConeGeometry(0.5, len, 5), { m: _m0, pre, c: col, surf: sf });
}

// ------------------------------------------------------------------ the dragon heads of the head rack
// One head 9 m long in its own space (snout +Z, crown +Y). stage 0: bare bamboo frame; 1: papered white;
// 2: painted, horned, toothed and bearded. Returns pinwheel-eye seats and beard roots (head space).
const HEAD_UP = [[-4, 1.5, 1.6, -0.6], [-2.6, 1.95, 2.25, -0.35], [-1.1, 2.05, 2.45, -0.15], [0.3, 1.7, 1.95, 0], [1.6, 1.25, 1.25, 0.05], [3.0, 1.15, 1.05, 0.12], [4.2, 1.38, 1.3, 0.2], [5.0, 0.85, 0.75, 0.3]];
const HEAD_LO = [[-2.6, 1.7, -1.5, -0.5], [-1, 1.75, -1.95, -0.8], [0.6, 1.4, -2.05, -1.15], [2.2, 1.1, -2.25, -1.5], [3.6, 1.1, -2.5, -1.85], [4.4, 0.7, -2.45, -2.0]];
async function addHead(b, pre, stage, liv, pause) {
  const cA = new THREE.Color(), painted = stage === 2;
  const colUp = (fi, fj, c) => {
    const side = Math.abs(fj - 0.5) * 2;
    c.set(liv.ground);
    if (side > 0.7) c.lerp(cA.set(liv.scallop), 0.9);
    if (side < 0.13) c.lerp(cA.set(GILT), 0.85);
    if (fi > 0.8) c.lerp(cA.set(GILT), Math.min(1, (fi - 0.8) * 4));
  };
  const colLo = (fi, fj, c) => { c.set(liv.scallop); if (Math.abs(fj - 0.5) < 0.2) c.lerp(cA.set(CREAM), 0.7); if (fi > 0.85) c.lerp(cA.set(GILT), 0.8); };
  const white = (fi, fj, c) => { c.set(CREAM).multiplyScalar(0.82); };
  const up = loftGeo(HEAD_UP, 17, 13, 1, painted ? colUp : white), lo = loftGeo(HEAD_LO, 11, 13, -1, painted ? colLo : white);
  const pt = (L, f, a) => { const w = L.at(f, 1), yc = L.at(f, 2), ye = L.at(f, 3); return new V3(w * Math.cos(a), ye + (yc - ye) * Math.pow(Math.sin(a), 0.8), L.at(f, 0)); };
  const bamCol = stage === 0 ? GOLDW : hexMix(GOLDW, TIMBER, 0.25);
  if (stage > 0) {
    b.add(up.g, { pre, surf: painted ? S_SCALE : S_PAPER });
    b.add(lo.g, { pre, surf: painted ? S_SCALE : S_PAPER });
  } else {
    for (const [L, N] of [[up, 8], [lo, 6]]) {
      for (let i = 0; i < N; i++) {
        const ring = []; for (let j = 0; j <= 8; j++) ring.push(pt(L, i, (j / 8) * PI));
        tube(b, ring, 0.07, bamCol, S_BAMBOO, { pre, seg: 12, rad: 4 });
        beam(b, ring[0].toArray(), ring[8].toArray(), 0.1, 0.1, bamCol, { pre, bamboo: true });
      }
      for (let j = 0; j <= 6; j++) {
        const lon = []; for (let i = 0; i <= (N - 1) * 2; i++) lon.push(pt(L, i / 2, (j / 6) * PI));
        tube(b, lon, 0.06, bamCol, S_BAMBOO, { pre, seg: 14, rad: 4 });
      }
      await pause();      // half a frame of bamboo at a time
    }
  }
  // lip rails, horns, eye sockets (all stages)
  for (const s of [0, PI]) for (const L of [up, lo]) {
    const lip = []; for (let i = 0; i <= (L === up ? 14 : 10); i++) lip.push(pt(L, i / 2, s));
    tube(b, lip, 0.09, painted ? GILT : bamCol, painted ? S_GILT : S_BAMBOO, { pre, seg: 14, rad: 4 });
  }
  const eyes = [];
  for (const s of [1, -1]) {
    const hc = painted ? GILT : GOLDW, hs = painted ? S_GILT : S_BAMBOO;
    tube(b, [[0.85 * s, 2.3, -1.3], [1.3 * s, 3.6, -2.2], [1.5 * s, 4.6, -3.6], [1.2 * s, 5.3, -5.0]], 0.15, hc, hs, { pre, seg: 10, rad: 5 });
    tube(b, [[1.3 * s, 3.6, -2.2], [2.1 * s, 4.3, -2.6], [2.6 * s, 5.1, -3.3]], 0.11, hc, hs, { pre, seg: 6, rad: 5 });
    tube(b, [[1.5 * s, 4.6, -3.6], [0.9 * s, 5.4, -3.7], [0.6 * s, 6.1, -4.2]], 0.09, hc, hs, { pre, seg: 6, rad: 5 });
    const seat = [1.55 * s, 1.35, 0.4], dir = new V3(0.8 * s, 0.12, 0.6).normalize();
    if (stage > 0) b.add(sph(0.66, 12, 9), { p: seat, pre, c: painted ? CREAM : hexMix(CREAM, GOLDW, 0.15), surf: painted ? S_GLOSS : S_PAPER });
    const hoop = new THREE.TorusGeometry(0.72, 0.06, 4, 14);
    hoop.lookAt(dir);
    b.add(hoop, { p: [seat[0] + dir.x * 0.25, seat[1] + dir.y * 0.25, seat[2] + dir.z * 0.25], pre, c: painted ? INK : bamCol, surf: S_BAMBOO });
    eyes.push({ p: new V3(seat[0] + dir.x * 0.82, seat[1] + dir.y * 0.82, seat[2] + dir.z * 0.82), dir });
  }
  const beard = [];
  if (painted) {
    for (const s of [1, -1]) {
      // teeth and fangs along both lips
      for (let k = 0; k < 7; k++) {
        const f = 2.6 + k * 0.62, a = s > 0 ? 0 : PI, pu = pt(up, f, a), pl = pt(lo, Math.min(5, f * 0.72), a), big = k === 5 ? 2 : 1;
        b.add(new THREE.ConeGeometry(0.13 * big, 0.5 * big, 5), { p: [pu.x * 0.93, pu.y - 0.25 * big, pu.z], r: [PI, 0, 0], pre, c: CREAM, surf: S_GLOSS });
        b.add(new THREE.ConeGeometry(0.12, 0.45, 5), { p: [pl.x * 0.93, pl.y + 0.22, pl.z], pre, c: CREAM, surf: S_GLOSS });
      }
      b.add(sph(0.33, 8, 6), { p: [0.5 * s, 1.22, 4.5], s: [1, 0.8, 1.2], pre, c: GILT, surf: S_GILT });
      for (let k = 0; k < 3; k++) flame(b, [1.42 * s, 2.2 - k * 0.12, 0.3 - k * 0.75], [0.25 * s, 1, -0.55 - k * 0.2], 1.9 - k * 0.2, 0.9, [GILT, liv.scallop, liv.ground][k], pre, S_GLOSS);
      for (let k = 0; k < 3; k++) flame(b, [1.85 * s, -0.25 - k * 0.12, -1.9 + k * 0.9], [0.8 * s, -0.15, -0.6], 2.0 - k * 0.3, 1.0, [liv.scallop, GILT, liv.ground][k], pre);
      tube(b, [[0.9 * s, 0.6, 4.6], [2.0 * s, 1.4, 5.6], [3.2 * s, 2.6, 5.3], [3.9 * s, 4.0, 4.3]], 0.075, GILT, S_GILT, { pre, seg: 10, rad: 4 });
      b.add(sph(0.22, 6, 5), { p: [3.9 * s, 4.0, 4.3], pre, c: liv.ground, surf: S_GLOSS });
    }
    b.add(sph(0.46, 10, 8), { p: [0, 1.75, 4.25], pre, c: CREAM, surf: [0.9, 0, 0.1, 1] });
    tube(b, [[0, -1.3, -1], [0, -1.6, 1.5], [0, -1.75, 3.4], [0, -1.3, 5.0], [0, -0.5, 5.8]], 0.3, liv.ground, S_GLOSS, { pre, seg: 10, rad: 6 });
    for (let k = 0; k < 9; k++) {
      const a = (k / 8) * PI, base = [1.5 * Math.cos(a), -0.6 + 2.2 * Math.pow(Math.sin(a), 0.8), -3.9];
      flame(b, base, [Math.cos(a) * 0.75, Math.sin(a) * 0.75 + 0.1, -0.7], 2.9, 1.2, [liv.ground, GILT, liv.scallop][k % 3], pre);
    }
    for (let k = 0; k < 16; k++) { const f = 0.6 + k * 0.28, p = pt(lo, Math.min(5, f), PI / 2 + ((k % 3) - 1) * 0.5); beard.push([p.x, p.y + 0.05, p.z, 2.4 + (k % 4) * 0.5]); }
  }
  return { eyes, beard };
}
// a paper pinwheel (axis +Z), a ginger cat asleep, a thrush, the winding reel
function pinwheelGeo(colA, colB) {
  const b = INT.makeBuilder(), r = 0.62;
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * TAU, P = (rr, da, z) => [Math.cos(a + da) * rr, Math.sin(a + da) * rr, z];
    b.quad([0, 0, 0.02], P(r, 0, 0), P(r * 0.8, 0.55, 0.16), P(r * 0.3, 0.95, 0.06), k % 2 ? colA : colB, S_PLAIN);
  }
  b.add(sph(0.09, 6, 5), { p: [0, 0, 0.12], c: INK, surf: S_GLOSS });
  return b.build();
}
function catGeo() {
  const b = INT.makeBuilder(), G = '#c8742c', W = new THREE.Color('#ecdcc0');
  const tint = (x, y, z, c) => { c.multiplyScalar(0.8 + 0.22 * Math.sin(z * 8 + x * 2.5)); if (y < 0.16) c.lerp(W, 0.6); };
  b.add(sph(0.5, 16, 12), { p: [0, 0.4, 0], s: [1.2, 0.8, 2.0], c: G, surf: S_CLOTH, tint });
  b.add(sph(0.42, 12, 9), { p: [-0.12, 0.36, -0.62], s: [1.3, 0.92, 1.2], c: G, surf: S_CLOTH, tint });
  b.add(sph(0.35, 12, 9), { p: [0.32, 0.4, 0.92], s: [1, 0.9, 1.08], c: G, surf: S_CLOTH, tint });
  tube(b, [[-0.3, 0.16, -1.05], [0.5, 0.14, -1.0], [0.9, 0.14, -0.2], [0.82, 0.15, 0.55]], 0.11, '#a85a1c', S_CLOTH, { seg: 10, rad: 6 });
  b.add(new THREE.ConeGeometry(0.13, 0.27, 4), { p: [0.5, 0.75, 1.0], r: [0.1, 0.4, -0.25], c: G, surf: S_CLOTH });
  b.add(sph(0.13, 6, 5), { p: [0.6, 0.12, 0.62], s: [1, 0.7, 1.4], c: '#ecdcc0', surf: S_CLOTH });
  return b.build();
}
function thrushGeo() {
  const b = INT.makeBuilder(), BR = '#6a4a2c', W = new THREE.Color('#ead9b8');
  const tint = (x, y, z, c) => { if (y < 0.02 && z > -0.2) { c.lerp(W, 0.85); c.multiplyScalar(0.75 + 0.3 * Math.abs(Math.sin(x * 40) * Math.sin(y * 37 + z * 31))); } };
  b.add(sph(0.3, 12, 9), { p: [0, 0, 0], s: [0.85, 0.85, 1.35], r: [-0.35, 0, 0], c: BR, surf: S_CLOTH, tint });
  b.add(sph(0.18, 10, 8), { p: [0, 0.27, 0.3], c: BR, surf: S_CLOTH, tint });
  b.add(new THREE.ConeGeometry(0.05, 0.2, 5), { p: [0, 0.27, 0.54], r: [PI / 2, 0, 0], c: GILT, surf: S_GLOSS });
  b.add(box(0.2, 0.04, 0.5), { p: [0, -0.02, -0.55], r: [0.3, 0, 0], c: '#4a3420', surf: S_CLOTH });
  for (const s of [-1, 1]) { b.add(cyl(0.02, 0.02, 0.3, 4), { p: [0.09 * s, -0.36, 0.02], c: GOLDW, surf: S_PLAIN }); b.add(sph(0.03, 5, 4), { p: [0.1 * s, 0.31, 0.44], c: INK, surf: S_GLOSS }); }
  return b.build();
}
function reelGeo() {
  const b = INT.makeBuilder();
  for (const s of [-1, 1]) {
    const rim = new THREE.TorusGeometry(4, 0.17, 6, 30); rim.rotateY(PI / 2);
    b.add(rim, { p: [1.15 * s, 0, 0], c: TIMBER_L, surf: sWood(2, 0.35) });
    for (let k = 0; k < 8; k++) { const a = (k / 8) * TAU; beam(b, [1.15 * s, 0, 0], [1.15 * s, Math.cos(a) * 4, Math.sin(a) * 4], 0.24, 0.3, k ? TIMBER_L : hexMix(TIMBER_L, VERM, 0.6)); }
  }
  for (let k = 0; k < 8; k++) { const a = ((k + 0.5) / 8) * TAU; b.add(cyl(0.11, 0.11, 2.5, 6), { p: [0, Math.cos(a) * 3.9, Math.sin(a) * 3.9], r: [0, 0, PI / 2], c: GOLDW, surf: sBam(0) }); }
  b.add(cyl(0.42, 0.42, 3.6, 10), { r: [0, 0, PI / 2], c: TIMBER, surf: sWood(0, 0.4) });
  b.add(cyl(2.2, 2.2, 2.0, 22, true), { r: [0, 0, PI / 2], c: hexMix(CREAM, GOLDW, 0.45), surf: S_CLOTH, tint: (x, y, z, c) => { c.multiplyScalar(0.8 + 0.2 * Math.sin(x * 23)); } });
  beam(b, [1.9, 0, 0], [1.9, 1.3, 0], 0.16, 0.16, TIMBER_L); beam(b, [1.9, 1.3, 0], [2.7, 1.3, 0], 0.2, 0.2, GOLDW, { bamboo: true });
  return b.build();
}

// ------------------------------------------------------------------ looks (the hero's own light presets carry the same names)
const LOOKS = {
  afternoon: { fog: '#dcc79c', dens: 0.0031, paperS: ['#ffe7bd', 1.75], paperL: ['#9fb6d8', 0.36], paperR: ['#f8dfa8', 0.74], paperG: ['#a9c8ea', 0.62], zen: '#5fa4ea', hor: '#a5d2f6', sky: 0,
    key: 1, moon: ['#4a9cf2', 1.25], shaft: ['#ffe2ac', 0.5], bay: ['#fff0cc', 1.25], exposure: 1.0, tint: '#fff6e6', shadow: '#160b04', sat: 1.08, accent: 0.34, portal: '#8FC4F0', title: 'The Hundred-Segment Dragon' },
  lantern: { fog: '#22398c', dens: 0.0026, paperS: ['#4f78e6', 0.62], paperL: ['#3f66d8', 0.5], paperR: ['#476fe0', 0.55], paperG: ['#3a6cf0', 0.8], zen: '#1c3fc0', hor: '#4a78f0', sky: 3,
    key: 0, moon: ['#4f7cff', 1.5], shaft: ['#000000', 0], bay: ['#a9c0ff', 1.15], boost: 2.1, exposure: 1.3, tint: '#eef0ff', shadow: '#040818', sat: 1.1, accent: 0.4, portal: '#6f9cff', title: 'The Hundred-Segment Dragon, Lantern Night' },
  rain: { fog: '#b4b8b6', dens: 0.0033, paperS: ['#dfe2e0', 0.84], paperL: ['#c9d0d6', 0.68], paperR: ['#d8dcdc', 0.74], paperG: ['#cfd8de', 0.72], zen: '#c2ccd4', hor: '#e4e9ea', sky: 1,
    key: 0.25, moon: ['#c6d6e6', 1.2], shaft: ['#000000', 0], bay: ['#eef3f6', 1.0], exposure: 1.03, tint: '#f4f6f8', shadow: '#0a0c10', sat: 0.97, accent: 0.14, portal: '#cfd8e2', title: 'The Hundred-Segment Dragon, Morning Rain' },
  gold: { fog: '#dba25a', dens: 0.0032, paperS: ['#ffbc68', 1.6], paperL: ['#a898b8', 0.34], paperR: ['#f0c48a', 0.6], paperG: ['#9fc0ea', 0.56], zen: '#6fa0e0', hor: '#c8d8ee', sky: 0,
    key: 1, moon: ['#5fa2f0', 1.25], shaft: ['#ffb060', 0.5], bay: ['#ffb866', 1.3], exposure: 1.0, tint: '#ffefd8', shadow: '#1a0a02', sat: 1.1, accent: 0.34, portal: '#a8c8f0', title: 'The Hundred-Segment Dragon, Low Sun' },
  snow: { fog: '#cdd5de', dens: 0.003, paperS: ['#f2f5fa', 1.0], paperL: ['#cddcf0', 0.62], paperR: ['#e6edf6', 0.8], paperG: ['#dfe8f4', 0.76], zen: '#b8c8dc', hor: '#eef3f8', sky: 2,
    key: 0.55, moon: ['#c8dcf6', 1.25], shaft: ['#f0f4ff', 0.16], bay: ['#f4f8ff', 1.25], exposure: 1.0, tint: '#f2f6ff', shadow: '#080c14', sat: 0.98, accent: 0.3, portal: '#dfe8f4', title: 'The Hundred-Segment Dragon, Snow Light' },
};
const col = (h, k = 1) => new THREE.Color(h).multiplyScalar(k);

export default {
  id: 'dragon-kite-loft',
  name: 'The Hundred-Segment Dragon',
  category: 'interior',
  weirdness: 0.2,
  media: ['cable', 'interior'],
  async build(ctx) {
    const rng = ctx.rng, detail = ctx.quality?.detail ?? 1, vary = ctx.vary || {};
    const density = clamp(vary.density ?? 1, 0.7, 1.3);
    const scene = new THREE.Scene();
    const lr = rng.fork('look'); lr();
    const pickLook = (v) => (v < 0.55 ? 'afternoon' : v < 0.64 ? 'snow' : v < 0.8 ? 'lantern' : v < 0.9 ? 'rain' : 'gold');
    const hour = vary.hour || 'any';
    const mood = hour === 'night' ? 'lantern' : hour === 'golden' ? 'gold' : hour === 'dawn' ? 'rain' : hour === 'day' ? (lr() < 0.75 ? 'afternoon' : 'snow') : pickLook(lr());
    const look = LOOKS[mood];
    scene.fog = new THREE.FogExp2(look.fog, look.dens);
    scene.background = new THREE.Color(look.fog);

    // ---- the hero: dragon, lines, trestles, dust
    const cast = rng.fork('cast');
    const heroOpts = { mood };
    if (mood === 'rain') heroOpts.livery = 'vermilion';
    const hero = await buildHero(ctx, heroOpts);
    scene.add(hero.object);
    const A = hero.anchors, snake = hero.snake, HU = hero.uniforms;
    const eyeAt = (s) => snake.eyeY(s), sx = (s) => snake.x(s);
    HU.uBars.value = 0.9 * (look.key ?? 0);      // how strongly the bars of roof-light sweep over the silk
    // THE EYE leaves its seat behind the tail disc four times, so the dragon is not always at the bottom centre:
    // it drops alongside on the left through the kite hall (s 150-240), cuts the bends of the dye room (the body
    // swings out to one side, then the other), climbs 6.5 m to look down the length of the body over the goldfish
    // (s 356-430), flies the straight line through the lantern gallery while the body swings wide to the right, and
    // rises 3.6 m over the body through the open bay and its two hoops (s 568-676).
    const bump = (s, a0, a1, b0, b1) => smoothstep(a0, a1, s) * (1 - smoothstep(b0, b1, s));
    const camDamp = (s) => 1 - 0.78 * bump(s, 232, 264, 398, 422) - 0.85 * bump(s, 438, 462, 516, 558);
    const camX = (s) => sx(s) * camDamp(s) - 7 * bump(s, 146, 184, 206, 240);
    const camY = (s) => eyeAt(s) - 2.2 * bump(s, 150, 186, 208, 246) + 6.5 * bump(s, 356, 386, 398, 430) - 1.6 * bump(s, 444, 466, 505, 540) + 3.6 * bump(s, 568, 600, 640, 676);
    const flyPts = [];
    for (let s = 0; s < 760; s += 12) flyPts.push(new V3(camX(s), camY(s), -6 - s));
    flyPts.push(new V3(0, 18, -770));
    const path = makePath(flyPts, { samples: 480 });
    const DYE = ZONES.dye, GAL = ZONES.gallery, DECK = ZONES.deckY;
    await ctx.yield();

    // ---- shared uniforms: the hero's light rig plus the room's own
    const sg = HU.uSunDir.value.x < 0 ? -1 : 1, sunDir = HU.uSunDir.value.clone().normalize();
    // the open roof bay: the slot of the sunward slope whose shaft crosses the axis between 8.5 and 21.5 m up at
    // station ZONES.bay, where the two bamboo hoops stand
    const bayDen = sunDir.y + Math.abs(sunDir.x) * 0.9375, bayT = (y) => (46 - y) / bayDen;
    const SLOT_ = { x0: bayT(21.5) * Math.abs(sunDir.x), x1: bayT(8.5) * Math.abs(sunDir.x), z: -6 - ZONES.bay + bayT(15) * sunDir.z, hl: 13 };
    SLOT_.x1 = Math.min(SLOT_.x1, 29.5);
    HU.uBay.value.set(SLOT_.x0, SLOT_.x1, SLOT_.z, SLOT_.hl); HU.uBayCol.value.copy(col(...look.bay)); HU.uGalK.value = 0.8;
    const inBay = (x, y, z) => {
      const t = Math.max(0, (46 - y - x * sg * 0.9375) / bayDen), hx = (x + sunDir.x * t) * sg, hz = z + sunDir.z * t;
      return hx > SLOT_.x0 - 2 && hx < SLOT_.x1 + 2 && Math.abs(hz - SLOT_.z) < SLOT_.hl + 2;
    };
    const holes = [], pools = [];
    for (let i = 0; i < NHOLE; i++) { holes.push(new THREE.Vector4(0, -99, 0, 0.01)); pools.push(new THREE.Vector4(0, 9999, 1, 1)); }
    const LU = {
      uSunDir: HU.uSunDir, uSun: HU.uSun, uSky: HU.uSky, uRoof: HU.uRoof, uGable: HU.uGable, uAmb: HU.uAmb, uFloor: HU.uFloor, uCam: HU.uCam, uGain: HU.uGain,
      uEye: HU.uEye, uTime: HU.uTime, uBay: HU.uBay, uBayCol: HU.uBayCol, uGalK: HU.uGalK,
      uHole: { value: holes }, uPool: { value: pools },
      uPaperS: { value: col(...look.paperS) }, uPaperL: { value: col(...look.paperL) }, uPaperR: { value: col(...look.paperR) }, uPaperG: { value: col(...look.paperG) },
      uHaze: { value: col(look.fog) }, uShaft: { value: col(...look.shaft) },
      uTimber: { value: col('#56402e') }, uGold: { value: col(GOLDW) }, uCream: { value: col(CREAM, 0.86) }, uGilt: { value: col(GILT) }, uInk: { value: col(INK) },
      uAccA: { value: col(VERM, 0.8) }, uAccB: { value: col(VIRID, 0.85) }, uAccC: { value: col(GILT, 0.85) },
      uBam: { value: col(GOLDW, 0.7) }, uFlame: { value: new THREE.Color(1.0, 0.5, 0.16) },
      uLantern: { value: mood === 'lantern' ? 1 : 0 }, uFront: HU.uFront, uBoost: { value: look.boost ?? 1 }, uKey: { value: look.key ?? 0 }, uMoon: { value: col(...look.moon) }, uTrans: { value: mood === 'lantern' ? 1.25 : 1.0 }, uGlow: { value: 1 },
    };
    const mk = (vs, fs, extra = {}) => {
      const { uniforms, ...rest } = extra;
      return new THREE.ShaderMaterial({ uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...LU, ...(uniforms || {}) }, vertexShader: vs, fragmentShader: fs, fog: true, ...rest });
    };
    const solidMat = mk(SOLID_VS, SOLID_FS, { side: THREE.DoubleSide });
    const paperMat = mk(PAPER_VS, PAPER_FS, { side: THREE.DoubleSide });
    const addMesh = (geo, mat, order = 0, cull = false) => { const m = new THREE.Mesh(geo, mat); m.frustumCulled = cull; m.renderOrder = order; scene.add(m); return m; };

    // ---- the shell: one mesh, five surfaces
    {
      const P = [], Nn = [], Id = [], I = [];
      const quad = (a, b, c, d, n, id) => { const k = P.length / 3; for (const p of [a, b, c, d]) { P.push(...p); Nn.push(...n); Id.push(id); } I.push(k, k + 1, k + 2, k, k + 2, k + 3); };
      const z0 = Z_IN, z1 = Z_OUT, rn = 30 / 43.86, ry = 32 / 43.86;
      quad([-HALF, 0, z0], [HALF, 0, z0], [HALF, 0, z1], [-HALF, 0, z1], [0, 1, 0], 0);
      quad([HALF, 0, z0], [HALF, EAVE, z0], [HALF, EAVE, z1], [HALF, 0, z1], [-1, 0, 0], 1);
      quad([-HALF, 0, z0], [-HALF, EAVE, z0], [-HALF, EAVE, z1], [-HALF, 0, z1], [1, 0, 0], 1);
      quad([HALF, EAVE, z0], [0, RIDGE, z0], [0, RIDGE, z1], [HALF, EAVE, z1], [-rn, -ry, 0], 2);
      quad([-HALF, EAVE, z0], [0, RIDGE, z0], [0, RIDGE, z1], [-HALF, EAVE, z1], [rn, -ry, 0], 2);
      for (const [z, n, id] of [[z1, 1, 3], [z0, -1, 4]]) {
        const k = P.length / 3;
        for (const p of [[-HALF, 0], [HALF, 0], [HALF, EAVE], [0, RIDGE], [-HALF, EAVE]]) { P.push(p[0], p[1], z); Nn.push(0, 0, n); Id.push(id); }
        I.push(k, k + 1, k + 2, k, k + 2, k + 3, k, k + 3, k + 4);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(Nn, 3));
      g.setAttribute('aId', new THREE.Float32BufferAttribute(Id, 1)); g.setIndex(I);
      addMesh(g, mk(SHELL_VS, SHELL_FS, { side: THREE.DoubleSide }), -2);
    }

    // ---- timber: 49 king-post trusses, purlins, plates (static solids are merged and split in z chunks)
    // (three builders, so that merging and chunking them is three short steps and not one long one)
    let bS = INT.makeBuilder();
    const solids = [bS];
    for (let i = 0; i < NTRUSS; i++) {
      const z = trussZ(i);
      for (const s of [-1, 1]) {
        const x = 16 * s;
        beam(bS, [x, 1.3, z], [x, roofY(16), z], 1.3, 1.3, TIMBER, { gloss: 0.35 });
        for (const cx of [-1, 1]) for (const cz of [-1, 1]) bS.add(box(0.2, roofY(16) - 1.6, 0.2), { p: [x + cx * 0.65, (roofY(16) + 1.6) / 2, z + cz * 0.65], r: [0, PI / 4, 0], c: hexMix(TIMBER, GOLDW, 0.75), surf: sWood(1, 0.6) });
        bS.add(box(2.1, 1.1, 2.1), { p: [x, 0.55, z], c: '#8a7f6c', surf: S_STONE });
        bS.add(box(1.7, 0.35, 1.7), { p: [x, 1.27, z], c: '#9a8f7a', surf: S_STONE });
        for (const y of [6.5, 15, 23]) bS.add(box(1.46, 0.3, 1.46), { p: [x, y, z], c: hexMix(TIMBER, GOLDW, 0.35), surf: sWood(0, 0.5) });
        beam(bS, [x - 0.3 * s, 22.6, z], [x - 5.2 * s, TIE - 0.3, z], 0.7, 0.7, TIMBER_L);
        beam(bS, [0, 29.5, z], [9.6 * s, 36.6, z], 0.7, 0.7, TIMBER);
        beam(bS, [HALF * s - 0.5 * s, EAVE - 0.4, z], [0.3 * s, RIDGE - 0.9, z], 0.9, 1.0, TIMBER);
        beam(bS, [31.45 * s, 0, z], [31.45 * s, EAVE, z], 1.0, 1.0, TIMBER);
      }
      beam(bS, [-19.4, TIE, z], [19.4, TIE, z], 1.2, 1.0, TIMBER_L, { gloss: 0.35 });
      for (const cz of [-1, 1]) bS.add(box(38.6, 0.2, 0.2), { p: [0, TIE - 0.6, z + cz * 0.5], r: [PI / 4, 0, 0], c: hexMix(TIMBER, GOLDW, 0.75), surf: sWood(0, 0.6) });
      beam(bS, [0, TIE, z], [0, RIDGE - 0.6, z], 1.0, 1.0, TIMBER);
      beam(bS, [-9.6, 37, z], [9.6, 37, z], 0.8, 0.8, TIMBER);
      await ctx.yield();      // a truss at a time
    }
    const bL = INT.makeBuilder();
    for (const s of [-1, 1]) {
      for (const ax of [6.4, 12.8, 19.2, 25.6]) beam(bL, [ax * s, roofY(ax) - 0.55, Z_IN], [ax * s, roofY(ax) - 0.55, Z_OUT], 0.6, 0.8, TIMBER);
      beam(bL, [31.5 * s, EAVE - 0.3, Z_IN], [31.5 * s, EAVE - 0.3, Z_OUT], 0.9, 0.7, TIMBER_L);
    }
    beam(bL, [0, RIDGE - 0.7, Z_IN], [0, RIDGE - 0.7, Z_OUT], 0.8, 0.9, TIMBER);
    await ctx.yield();

    // ---- workbenches down both walls, with their litter
    const rb = rng.fork('bench');
    const ACC = [VERM, VIRID, GILT];
    for (let i = 1; i < NTRUSS; i++) for (const s of [-1, 1]) {
      const zc = trussZ(i) + 8, x = 27 * s;
      bS.add(box(4.4, 0.4, 14), { p: [x, 5.0, zc], c: hexMix(TIMBER_L, GOLDW, 0.25 + 0.2 * rb()), surf: sWood(2, 0.35) });
      bS.add(box(3.8, 0.25, 13.4), { p: [x, 1.9, zc], c: TIMBER, surf: sWood(2) });
      for (const dz of [-6.4, 0, 6.4]) for (const dx of [-1.8, 1.8]) bS.add(box(0.5, 4.8, 0.5), { p: [x + dx, 2.4, zc + dz], c: TIMBER, surf: sWood(1) });
      const n = Math.round(4 * density + rb() * 2);
      for (let k = 0; k < n; k++) {
        const px = x + rb.range(-1.4, 1.4), pz = zc - 6 + (k + rb()) * (12 / n), kind = rb.int(0, 5), y = 5.2;
        if (kind === 0) { bS.add(cyl(0.7, 0.6, 1.2, 8), { p: [px, y + 0.6, pz], c: '#4a3a30', surf: S_GLOSS }); bS.add(cyl(0.62, 0.62, 0.06, 8), { p: [px, y + 1.16, pz], c: CREAM, surf: S_PLAIN }); }
        else if (kind === 1) { for (let j = 0; j < 3; j++) { bS.add(cyl(0.75 - j * 0.05, 0.5, 0.2, 10), { p: [px + j * 0.2, y + 0.1 + j * 0.2, pz], c: CREAM, surf: S_GLOSS }); } bS.add(cyl(0.58, 0.58, 0.04, 10), { p: [px + 0.4, y + 0.62, pz], c: rb.pick(ACC), surf: S_GLOSS }); }
        else if (kind === 2) { bS.add(cyl(0.55, 0.55, 1.3, 8), { p: [px, y + 0.75, pz], c: hexMix(CREAM, GOLDW, 0.4), surf: S_CLOTH }); for (const e of [0.06, 1.44]) bS.add(cyl(0.8, 0.8, 0.12, 8), { p: [px, y + e, pz], c: TIMBER_L, surf: sWood(1) }); }
        else if (kind === 3) { bS.add(cyl(0.45, 0.45, 3.6, 8), { p: [px, y + 0.45, pz], r: [PI / 2, rb.range(-0.3, 0.3), 0], c: rb() < 0.5 ? CREAM : rb.pick(ACC), surf: S_CLOTH }); }
        else if (kind === 4) { const t = new THREE.TorusGeometry(2.4, 0.08, 4, 18); bS.add(t, { p: [29.9 * s, y + 2.3, pz], r: [0, PI / 2 + 0.16 * s, 0], c: GOLDW, surf: sBam(1) }); bS.add(new THREE.TorusGeometry(2.3, 0.08, 4, 18), { p: [29.6 * s, y + 2.2, pz + 0.5], r: [0, PI / 2 + 0.22 * s, 0], c: GOLDW, surf: sBam(1) }); }
        else { bS.add(box(1.6, 0.05, 2.2), { p: [px, y + 0.03, pz], r: [0, rb.range(0, 3), 0], c: CREAM, surf: S_PLAIN }); beam(bS, [px - 0.9, y + 0.1, pz - 1], [px + 0.9, y + 0.1, pz + 1], 0.08, 0.08, GOLDW, { bamboo: true }); }
      }
      bS.add(sph(1, 11, 5), { p: [x - 1.4 * s, 0, zc + rb.range(-4, 4)], s: [1.9, 0.55, 2.6], c: hexMix(CREAM, GOLDW, 0.7), surf: S_CLOTH });
      if ((i + (s > 0 ? 1 : 0)) % 2) for (let k = 0; k < 5; k++) bS.add(cyl(0.3, 0.34, 14.5, 6), { p: [30.9 * s - (k % 2) * 0.55 * s, 6.3 + Math.floor(k / 2) * 0.55, zc], r: [PI / 2, 0, 0], c: hexMix(GREEN_B, GOLDW, rb() * 0.5), surf: sBam(2) });
      await ctx.yield();      // a bench at a time
    }

    bS = INT.makeBuilder(); solids.push(bS);
    // ---- paper instances (kites, drapes, pennants, tassels) are collected here and built at the end
    const krng = rng.fork('kites');
    const kinds = {}, strings = { H: [], I: [] };
    const C = { cream: col(CREAM, 0.86), verm: col(VERM, 0.86), virid: col(VIRID, 0.9), gilt: col(GILT, 0.88), sky: col(SKY, 0.8), ink: col(INK, 2.4), pale: col('#e2ddd0', 0.8) };
    const put = (kind, x, yTop, z, L, S, yaw, pitch, cA, cB, lan = 0, str = true) => {
      const k = kinds[kind] || (kinds[kind] = { H: [], I: [], C1: [], C2: [] }), ph = krng() * 40;
      k.H.push(x, yTop + L, z, L); k.I.push(S, yaw, ph, pitch); k.C1.push(cA.r, cA.g, cA.b, lan); k.C2.push(cB.r, cB.g, cB.b);
      if (str && L > 0.3) { strings.H.push(x, yTop + L, z, L); strings.I.push(S, yaw, ph, pitch); }
    };

    // ---- the finishing floor (first 70 m): everything left as if the makers had just stepped back
    const rp = rng.fork('props'), dyn = [];
    const dynMesh = (geo, x, y, z) => { const m = new THREE.Mesh(geo, solidMat); m.position.set(x, y, z); scene.add(m); return m; };
    // peach branch in a jar
    {
      const jx = -12.5, jz = -34;
      const jar = new THREE.LatheGeometry([[0.01, 0], [1.0, 0.02], [1.45, 1.1], [1.5, 2.1], [1.05, 3.2], [0.62, 3.7], [0.78, 4.0], [0.62, 4.06]].map((p) => new THREE.Vector2(p[0], p[1])), 16);
      bS.add(jar, { p: [jx, 0, jz], c: hexMix(VIRID, '#9fc7b5', 0.55), surf: S_GLOSS });
      const tips = [[jx + 4.1, 12.8, jz - 2.5], [jx - 1.9, 11.8, jz + 1.5], [jx + 1.9, 10.4, jz + 3.8], [jx - 2.7, 9.2, jz - 2.4], [jx + 3.3, 8.6, jz + 0.8], [jx + 0.6, 13.6, jz - 0.6]];
      for (const t of tips) {
        const mid = [(jx + t[0]) / 2 + rp.range(-0.7, 0.7), 4 + (t[1] - 4) * 0.55, (jz + t[2]) / 2 + rp.range(-0.7, 0.7)];
        tube(bS, [[jx, 3.2, jz], mid, t], 0.12, '#3a2418', sWood(1), { seg: 8, rad: 5 });
        for (let k = 0; k < 20; k++) {
          const f = 0.3 + 0.7 * rp(), q = [lerp(mid[0], t[0], f) + rp.range(-0.5, 0.5), lerp(mid[1], t[1], f) + rp.range(-0.4, 0.5), lerp(mid[2], t[2], f) + rp.range(-0.5, 0.5)];
          bS.add(new THREE.IcosahedronGeometry(rp.range(0.18, 0.34), 0), { p: q, c: rp() < 0.75 ? '#f2aebb' : '#fbe4e6', surf: [0.2, 0, 0.1, 1] });
        }
        await ctx.yield();
      }
    }
    // the work table with rolls of silk, and the cat asleep on the biggest
    const tableG = INT.tableGeometry({ rng: rp.fork('t1'), scale: 6, width: 1.55, depth: 0.85, height: 0.8, color: TIMBER_L });
    const tTop = tableG.userData.top ?? 4.8;
    bS.add(tableG, { p: [-9.8, 0, -52], r: [0, PI / 2, 0] });
    const roll = (x, y, z, r, len, c, ry = 0) => {
      bS.add(cyl(r, r, len, 14), { p: [x, y, z], r: [PI / 2, ry, 0], c, surf: S_CLOTH });
      bS.add(cyl(r * 0.28, r * 0.28, len + 0.3, 6), { p: [x, y, z], r: [PI / 2, ry, 0], c: GOLDW, surf: sBam(2) });
    };
    roll(-9.6, tTop + 1.1, -52.6, 1.1, 5.2, hexMix(CREAM, '#ffffff', 0.3), PI / 2); roll(-10.6, tTop + 0.55, -49.2, 0.55, 3.6, VERM, 0.3); roll(-9.2, tTop + 0.45, -55.6, 0.45, 3.0, VIRID, 1.3);
    bS.add(box(2.6, 0.06, 3.4), { p: [-8.2, tTop + 0.03, -48.2], r: [0, 0.3, 0], c: CREAM, surf: S_PLAIN });
    const cat = dynMesh(catGeo(), -9.3, tTop + 2.12, -52.6); cat.rotation.y = PI / 2;
    const catEar = dynMesh(new THREE.ConeGeometry(0.13, 0.28, 4), 0, 0, 0);
    { const g = catEar.geometry, n = g.attributes.position.count, cc = new Float32Array(n * 3), ss = new Float32Array(n * 4), k = col('#c8742c');
      for (let i = 0; i < n; i++) { cc.set([k.r, k.g, k.b], i * 3); ss.set(S_CLOTH, i * 4); }
      g.translate(0, 0.14, 0); g.setAttribute('color', new THREE.BufferAttribute(cc, 3)); g.setAttribute('surf', new THREE.BufferAttribute(ss, 4)); }
    cat.add(catEar); scene.remove(catEar); catEar.position.set(0.16, 0.7, 1.02);
    await ctx.yield();
    // tea for four, still steaming; a stool still rocking
    const teaT = INT.tableGeometry({ rng: rp.fork('t2'), scale: 6, width: 0.95, depth: 0.95, height: 0.42, round: true, color: TIMBER_L });
    const teaTop = teaT.userData.top ?? 2.5, teaAt = [9.6, teaTop, -29];
    bS.add(teaT, { p: [9.6, 0, -29] });
    await ctx.yield();
    bS.add(INT.teapotGeometry({ rng: rp.fork('pot'), scale: 6, height: 0.17, color: '#8a4a30' }), { p: teaAt, r: [0, 0.8, 0] });
    await ctx.yield();
    for (let k = 0; k < 4; k++) { const a = 0.4 + k * 1.45; bS.add(INT.cupGeometry({ rng: rp.fork('cup' + k), scale: 6, color: CREAM, tea: true }), { p: [9.6 + Math.cos(a) * 1.9, teaTop, -29 + Math.sin(a) * 1.9] }); await ctx.yield(); }
    const stool = dynMesh(INT.chairGeometry({ rng: rp.fork('stool'), scale: 6, style: 'stool', color: TIMBER_L }), 13.4, 0, -26.2);
    await ctx.yield();
    // the easel: a disc half painted, one wet stroke shining; saucers and brushes, one still rolling
    {
      const M = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(-0.3, -0.5, 0, 'YXZ')).setPosition(9.4, 5.2, -52);
      for (const [a0, c, sf] of [[PI / 2, VERM, S_SCALE], [-PI / 2, CREAM, S_PAPER]]) bS.add(new THREE.CircleGeometry(2.45, 20, a0, PI), { pre: M, c, surf: sf });
      bS.add(new THREE.TorusGeometry(2.5, 0.09, 5, 32), { pre: M, c: GOLDW, surf: sBam(0) });
      bS.add(new THREE.TorusGeometry(1.5, 0.12, 4, 12, 1.3), { pre: M, p: [0.1, 0, 0.05], r: [0, 0, -0.9], s: [1, 1, 0.3], c: VERM, surf: [0.95, 0, 0.3, 1] });
      for (const s of [-1, 1]) beam(bS, [9.4 + 2.4 * s, 0, -51.5 - s * 1.2], [9.9 + 0.5 * s, 8.6, -53.4], 0.3, 0.3, TIMBER_L);
      beam(bS, [11.6, 0, -57], [10, 8.6, -53.5], 0.3, 0.3, TIMBER_L); beam(bS, [6.8, 2.4, -50.6], [11.9, 2.4, -53.2], 0.3, 0.5, TIMBER_L);
      bS.add(box(6, 0.3, 2), { p: [4.6, 2.0, -45.5], r: [0, 0.35, 0], c: TIMBER_L, surf: sWood(0) });
      for (const dx of [-2.5, 2.5]) bS.add(box(0.4, 1.9, 1.6), { p: [4.6 + dx * 0.94, 0.95, -45.5 - dx * 0.34], r: [0, 0.35, 0], c: TIMBER, surf: sWood(1) });
      [VERM, VIRID, GILT, INK, CREAM].forEach((c, k) => {
        const px = 2.5 + k * 1.05, pz = -44.75 - k * 0.37;
        bS.add(cyl(0.48, 0.34, 0.16, 12), { p: [px, 2.23, pz], c: CREAM, surf: S_GLOSS }); bS.add(cyl(0.4, 0.4, 0.03, 12), { p: [px, 2.31, pz], c, surf: [0.95, 0, 0.06, 1] });
        if (k % 2 === 0) { beam(bS, [px - 0.5, 2.36, pz - 0.5], [px + 0.4, 2.36, pz + 0.55], 0.07, 0.07, GOLDW, { bamboo: true }); }
      });
    }
    const brushB = INT.makeBuilder();
    brushB.add(cyl(0.07, 0.07, 1.5, 6), { r: [PI / 2, 0, 0], c: GOLDW, surf: sBam(2) }); brushB.add(new THREE.ConeGeometry(0.1, 0.4, 6), { p: [0, 0, 0.95], r: [PI / 2, 0, 0], c: VERM, surf: S_GLOSS });
    const brush = dynMesh(brushB.build(), 6.4, 2.23, -46.2); brush.rotation.y = 0.35;
    await ctx.yield();
    // the splitting block: a green culm with the knife left standing in it; split strips; shavings
    beam(bS, [-15, 1.7, -19], [-14, 1.7, -29], 1.0, 1.0, GREEN_B, { surf: sBam(2) });
    for (const z of [-21, -27]) bS.add(box(2.2, 1.2, 1.4), { p: [-14.5 - (z + 24) * 0.1, 0.6, z], c: TIMBER, surf: sWood(0) });
    bS.add(box(0.07, 1.7, 0.55), { p: [-15, 2.7, -19.6], c: '#a8acb0', surf: [0.92, 0, 0, 1] }); bS.add(cyl(0.11, 0.11, 0.9, 6), { p: [-15, 3.9, -19.6], c: TIMBER, surf: sWood(1) });
    for (let k = 0; k < 9; k++) beam(bS, [-17.5 + k * 0.16, 0.15 + (k % 3) * 0.1, -18 - rp() * 2], [-17.2 + k * 0.3, 0.15 + (k % 3) * 0.1, -29 - rp() * 2], 0.22, 0.06, hexMix(GOLDW, CREAM, rp() * 0.4), { bamboo: true });
    for (let k = 0; k < 14; k++) bS.add(sph(1, 13, 6), { p: [rp.range(-20, 20), 0, rp.range(-72, -14)], s: [rp.range(0.7, 1.7), 0.34, rp.range(0.7, 1.7)], r: [0, rp() * 3, 0], c: hexMix(CREAM, GOLDW, rp.range(0.55, 0.85)), surf: S_CLOTH });
    await ctx.yield();
    // stretchers of drying silk
    for (const [x, z, ry, c] of [[17.5, -17, -0.5, C.verm], [-19, -35, 0.6, C.sky], [19.5, -60, -0.7, C.virid], [-19.5, -70, 0.5, C.gilt]]) {
      const M = new THREE.Matrix4().makeRotationY(ry).setPosition(x, 0, z);
      for (const s of [-1, 1]) { beam(bS, [3.4 * s, 0, 0], [3.4 * s, 9.4, 0], 0.3, 0.3, TIMBER_L, { pre: M }); beam(bS, [3.4 * s, 0, -2], [3.4 * s, 0.2, 2], 0.3, 0.3, TIMBER, { pre: M }); }
      for (const y of [9.2, 1.0]) beam(bS, [-3.6, y, 0], [3.6, y, 0], 0.26, 0.26, GOLDW, { pre: M, bamboo: true });
      put('sheet', x, 9.1, z, 0, 6.3, ry, 0, c, c === C.gilt ? C.verm : C.gilt, 0, false);
    }
    await ctx.yield();
    // soaking trough with hoops; the winding reel on its stand, spinning down
    bS.add(box(9, 1.5, 3.2), { p: [14.5, 0.75, -72], r: [0, 0.2, 0], c: TIMBER, surf: sWood(0) });
    bS.add(box(8.4, 0.1, 2.6), { p: [14.5, 1.46, -72], r: [0, 0.2, 0], c: '#20302c', surf: [0.97, 0, 0, 1] });
    for (let k = 0; k < 4; k++) bS.add(new THREE.TorusGeometry(2.5, 0.08, 4, 24), { p: [12.2 + k * 1.5, 3.0, -71.5 - k * 0.3], r: [0, 1.2 + k * 0.1, 0.1 * k], c: GOLDW, surf: sBam(0) });
    const REEL = [-13, 5.4, -66];
    for (const s of [-1, 1]) { for (const dz of [-3.2, 3.2]) beam(bS, [REEL[0] + 2.0 * s, 0, REEL[2] + dz], [REEL[0] + 2.0 * s, REEL[1] + 0.3, REEL[2]], 0.45, 0.45, TIMBER); beam(bS, [REEL[0] + 2.0 * s, 0.25, REEL[2] - 3.6], [REEL[0] + 2.0 * s, 0.25, REEL[2] + 3.6], 0.5, 0.5, TIMBER); }
    const reel = dynMesh(reelGeo(), ...REEL);
    await ctx.yield();
    // the thrush in its bamboo cage, hung on a long cord from a tie beam on the right
    const CAGE = [8.6, 9.6, -72], CK = 1.35;
    {
      const [x, y, z] = CAGE, R = 1.2 * CK;
      bS.add(cyl(R + 0.08, R + 0.08, 0.18, 18), { p: [x, y, z], c: TIMBER_L, surf: sWood(0, 0.5) });
      bS.add(cyl(R + 0.14, R + 0.14, 0.1, 18), { p: [x, y - 0.12, z], c: hexMix(TIMBER, VERM, 0.5), surf: S_GLOSS });
      for (let k = 0; k < 20; k++) {
        const a = (k / 20) * TAU, cx = Math.cos(a), cz = Math.sin(a);
        tube(bS, [[x + cx * R, y, z + cz * R], [x + cx * R, y + 1.9 * CK, z + cz * R], [x + cx * R * 0.72, y + 2.6 * CK, z + cz * R * 0.72], [x + cx * 0.08, y + 3.0 * CK, z + cz * 0.08]], 0.038, GOLDW, sBam(1), { seg: 6, rad: 3 });
        if ((k & 3) === 3) await ctx.yield();      // four bars at a time
      }
      for (const [h, r] of [[0.95, R], [1.9, R], [2.6, R * 0.72]]) bS.add(new THREE.TorusGeometry(r, 0.05, 4, 20), { p: [x, y + h * CK, z], r: [PI / 2, 0, 0], c: GOLDW, surf: sBam(0) });
      bS.add(sph(0.22, 8, 6), { p: [x, y + 3.05 * CK, z], c: GILT, surf: S_GILT });
      bS.add(cyl(0.05, 0.05, TIE - y - 3 * CK, 4), { p: [x, (TIE + y + 3 * CK) / 2, z], c: hexMix(CREAM, GOLDW, 0.5), surf: S_CLOTH });
      bS.add(cyl(0.06, 0.06, 2.3 * CK, 5), { p: [x, y + 0.8 * CK, z - 0.45], r: [0, 0, PI / 2], c: GOLDW, surf: sBam(0) }); bS.add(cyl(0.06, 0.06, 2.1 * CK, 5), { p: [x, y + 1.6 * CK, z + 0.5], r: [0, 0, PI / 2], c: GOLDW, surf: sBam(0) });
      bS.add(cyl(0.26, 0.2, 0.28, 8), { p: [x + 1.0, y + 0.24, z + 0.7], c: SKY, surf: S_GLOSS });
      for (let k = 0; k < 3; k++) put('tassel', x, y - 0.15, z, 0, 1.6 + k * 0.3, k * 2.1, 0, C.verm, C.gilt, 0, false);
    }
    const thrush = dynMesh(thrushGeo(), CAGE[0], CAGE[1] + 1.2, CAGE[2] - 0.35); thrush.scale.setScalar(1.65);
    // pots of narcissus on two window ledges
    for (const [sd, z] of [[1, -42], [-1, -118]]) {
      const x = 30.3 * sd, y = 7.25;
      bS.add(box(1.4, 0.22, 3.4), { p: [x, 7.02, z], c: TIMBER_L, surf: sWood(2, 0.4) });
      for (const dz of [-0.9, 0.9]) {
        bS.add(cyl(0.62, 0.44, 0.5, 10), { p: [x, y + 0.14, z + dz], c: dz < 0 ? hexMix(SKY, CREAM, 0.5) : hexMix(VIRID, '#9fc7b5', 0.6), surf: S_GLOSS });
        for (let k = 0; k < 9; k++) {
          const a = k * 2.4 + dz, lean = 0.12 + (k % 3) * 0.1, h = 1.5 + (k % 4) * 0.3, tx = Math.cos(a) * lean * h, tz = Math.sin(a) * lean * h;
          beam(bS, [x + Math.cos(a) * 0.2, y + 0.3, z + dz + Math.sin(a) * 0.2], [x + tx, y + 0.3 + h, z + dz + tz], 0.13, 0.03, hexMix('#3f7f3a', GREEN_B, (k % 3) * 0.3), { surf: S_PLAIN });
          if (k % 3 === 0) {
            const fp = [x + tx * 1.1 - 0.12 * sd, y + 0.35 + h, z + dz + tz * 1.1];
            const fl = new THREE.CircleGeometry(0.24, 6); fl.rotateY(-PI / 2 * sd);
            bS.add(fl, { p: fp, c: '#f8f3e4', surf: [0.2, 0, 0.12, 1] });
            bS.add(sph(0.09, 6, 4), { p: [fp[0] - 0.06 * sd, fp[1], fp[2]], c: GILT, surf: [0.3, 0, 0.2, 1] });
          }
        }
      }
    }
    // morning rain: a leak drips from the roof into a bucket on the finishing floor
    let leak = null;
    if (mood === 'rain') {
      const LX = -4.4, LZ = -61;
      const bk = new THREE.CylinderGeometry(1.0, 0.8, 1.5, 18, 1, true);
      bS.add(bk, { p: [LX, 0.75, LZ], c: TIMBER_L, surf: sWood(1, 0.4) });
      for (const yb of [0.3, 1.2]) bS.add(new THREE.TorusGeometry(yb > 1 ? 0.99 : 0.86, 0.045, 4, 18), { p: [LX, yb, LZ], r: [PI / 2, 0, 0], c: '#6a6e72', surf: [0.9, 0, 0, 1] });
      bS.add(new THREE.CircleGeometry(0.95, 18), { p: [LX, 1.12, LZ], r: [-PI / 2, 0, 0], c: '#55626a', surf: [0.97, 0, 0, 1] });
      bS.add(new THREE.TorusGeometry(0.9, 0.04, 4, 12, PI), { p: [LX, 1.5, LZ], r: [0, 0.5, 0], c: '#6a6e72', surf: [0.9, 0, 0, 1] });
      bS.add(sph(1, 12, 5), { p: [LX + 0.4, 0, LZ + 0.3], s: [2.3, 0.03, 1.9], c: '#3a2c20', surf: [0.9, 0, 0, 1] });       // the wet patch round it
      const mkDyn = (geo, c, sf) => { const b = INT.makeBuilder(); b.add(geo, { c, surf: sf }); return b.build(); };
      const drops = [0, 1, 2].map(() => dynMesh(mkDyn(sph(0.075, 6, 5), '#dfe8ee', [0.95, 0, 0.5, 1]), LX, 20, LZ));
      const ring = dynMesh(mkDyn(new THREE.TorusGeometry(0.5, 0.03, 4, 16).rotateX(PI / 2), '#c8d4da', [0.95, 0, 0.25, 1]), LX, 1.14, LZ);
      leak = { drops, ring, top: roofY(LX) - 1, x: LX, z: LZ };
    }
    await ctx.yield();

    // ---- the silk racks. The first (u 0.36): three poles low across the tunnel, the path dipping under their
    // short lengths, long curtains down both sides. The second (u 0.8): two great bamboo hoops the dragon threads,
    // each with a yoke pole and curtains hung outside the line of sight to the moon gate.
    const SILK = 0.5, cordC = hexMix(CREAM, GOLDW, 0.5);
    const dye = [[C.verm, C.gilt], [C.cream, C.verm], [C.virid, C.gilt], [C.gilt, C.verm], [C.gilt, C.cream], [C.verm, C.cream], [C.cream, C.virid]];
    const lash = (x, y, z, r, ax) => bS.add(new THREE.TorusGeometry(r, 0.07, 4, 8), { p: [x, y, z], r: ax === 0 ? [0, PI / 2, 0] : (ax === 1 ? [PI / 2, 0, 0] : [0, 0, 0]), c: VERM, surf: S_CLOTH });
    const cord = (x, y, z) => { const top = roofY(x) - 0.9; bS.add(cyl(0.07, 0.07, top - y, 4), { p: [x, (top + y) / 2, z], c: cordC, surf: S_CLOTH }); };
    // THE DYE ROOM (s 266-358, u 0.35-0.47): eleven ranks of wet silk hung across the loft from the tie beams and
    // from bamboo poles between them, 13 to 21 m long, each rank one dye lot (undyed, saffron, vermilion, madder,
    // jade, viridian). The body threads an opening that swings from right to left; short valances hang over it.
    const mute = mood === 'rain' ? 0.5 : mood === 'snow' ? 0.22 : 0;
    const lotHex = [CREAM, hexMix(CREAM, GILT, 0.6), GILT, hexMix(GILT, VERM, 0.5), VERM, VERM, '#a3202a', hexMix(VIRID, CREAM, 0.32), VIRID, VIRID, hexMix(VIRID, '#0d4a44', 0.5)].map((h) => hexMix(h, '#cfd0cc', mute));
    const lotC = lotHex.map((h) => col(h, 0.9));
    const SLOT = 3.65, POLE = 27.25;
    for (let r = 0; r < 11; r++) {
      const s = 272 + r * 8, bx = sx(s), cxs = camX(s), ey = Math.max(eyeAt(s), camY(s)), truss = r % 2 === 1, z = -6 - s + (truss ? 1.3 : 0);
      if (!truss) {
        beam(bS, [-19.6, POLE + 0.15, z], [19.6, POLE + 0.15, z], 0.3, 0.3, GOLDW, { bamboo: true });
        for (const dx of [-17, -6, 6, 17]) { cord(dx, POLE + 0.3, z); lash(dx, POLE + 0.15, z, 0.3, 0); }
      }
      for (let j = 0; j < 14; j++) {
        const x = -23.7 + j * SLOT + rp.range(-0.12, 0.12), lot = lotC[clamp(r + (rp() < 0.15 ? (rp() < 0.5 ? -1 : 1) : 0), 0, 10)];
        const cA = lot.clone().multiplyScalar(rp.range(0.84, 1.06)), cB = r < 4 ? C.verm : C.gilt;
        const top = Math.min(POLE, roofY(x) - 1.8), zz = z + (j % 2 ? 0.22 : -0.22), yaw = rp.range(-0.1, 0.1);
        if (Math.abs(x - bx) < 7.2 || Math.abs(x - cxs) < 5.4 || Math.abs(x) < 2.6) {
          put(top - 8.5 >= ey + 3.8 ? 'valanceL' : 'valance', x, top, zz, 0, 3.4, yaw, 0, cA, cB, SILK, false);
        } else {
          const avail = top - (Math.abs(x) > 21 ? 8.8 : 4.4);
          if (avail >= 18.6) put('bolt', x, top, zz, 0, clamp(avail / 6.2, 3.0, 3.6), yaw, 0, cA, cB, SILK, false);
          else put('boltS', x, top, zz, 0, clamp(avail / 4.6, 2.6, 3.6), yaw, 0, cA, cB, SILK, false);
        }
      }
      if (r & 1) await ctx.yield();
    }
    // the vats, between the ranks either side of the body: staved tubs of dye with iron hoops, a paddle, buckets
    const vatAt = [];
    for (let k = 0; k < 5; k++) for (const side of [-1, 1]) {
      const s = 276 + k * 16, x = clamp(sx(s) + side * (11.6 + (k % 2) * 1.6), -21, 21), z = -6 - s, hex = lotHex[Math.min(10, Math.round((s - 272) / 8))];
      bS.add(cyl(3.0, 2.7, 2.6, 18), { p: [x, 1.3, z], c: hexMix(TIMBER_L, GOLDW, 0.2), surf: sWood(1, 0.4) });
      bS.add(new THREE.CircleGeometry(2.86, 18), { p: [x, 2.42, z], r: [-PI / 2, 0, 0], c: hex, surf: [0.96, 0, 0.14, 1] });
      for (const [yb, rr] of [[0.6, 2.84], [2.1, 2.98]]) bS.add(new THREE.TorusGeometry(rr, 0.07, 4, 18), { p: [x, yb, z], r: [PI / 2, 0, 0], c: '#5a5e62', surf: [0.9, 0, 0, 1] });
      beam(bS, [x - side * 1.2, 2.2, z + 0.8], [x - side * 3.4, 6.4, z + 2.2], 0.16, 0.16, GOLDW, { bamboo: true });
      for (const [dx, dz] of [[-3.9, 1.4], [3.6, -2.2]]) { bS.add(cyl(0.6, 0.48, 0.9, 9), { p: [x + dx, 0.45, z + dz], c: TIMBER_L, surf: sWood(1, 0.4) }); bS.add(new THREE.CircleGeometry(0.52, 9), { p: [x + dx, 0.8, z + dz], r: [-PI / 2, 0, 0], c: hex, surf: [0.96, 0, 0.1, 1] }); }
      vatAt.push([x, z]);
      await ctx.yield();
    }
    await ctx.yield();
    const HOOP_R = 10.6, HOOP_Y = 17.6, YOKE = 24.6, HOOPS = [627.5, 644];
    HOOPS.forEach((s, hi) => {
      const z = -6 - s;
      for (const [dr, dz, c] of [[0, 0, GOLDW], [0.3, 0.22, hexMix(GOLDW, GREEN_B, 0.4)], [-0.28, -0.2, hexMix(GOLDW, CREAM, 0.3)]]) bS.add(new THREE.TorusGeometry(HOOP_R + dr, 0.17, 6, 72), { p: [0, HOOP_Y, z + dz], c, surf: sBam(0) });
      for (let k = 0; k < 18; k++) {
        const a = (k / 18) * TAU + 0.17, h = new THREE.TorusGeometry(0.42, 0.09, 4, 8);
        h.rotateY(PI / 2); h.rotateZ(a + PI / 2);
        bS.add(h, { p: [Math.cos(a) * HOOP_R, HOOP_Y + Math.sin(a) * HOOP_R, z], c: k % 3 ? VERM : GILT, surf: S_CLOTH });
      }
      beam(bS, [-17.6, YOKE, z + 0.4], [17.6, YOKE, z + 0.4], 0.32, 0.32, GOLDW, { bamboo: true });
      for (const dx of [-17, -8, 8, 17]) { cord(dx, YOKE + 0.2, z + 0.4); lash(dx, YOKE, z + 0.4, 0.32, 0); }
      cord(0, HOOP_Y + HOOP_R, z);
      // curtains: the left ones may come in to the edge of the body's tunnel; on the right the sight line from the
      // last bend (the eye is 8 m right of the axis at u 0.62) needs the first 8.4 m clear
      const xs = [-13.2, -11.3, -9.4, -7.5, 9.3, 11.2, 13.1, 15.0];
      xs.forEach((x, j) => {
        const d = dye[(j + hi * 3) % 7], long = (j + hi) % 2 === 0;
        put(long ? 'curtainL' : 'curtain', x, YOKE - 0.1, z + 0.4 + (j % 2 ? 0.15 : -0.15), 0, long ? 1.7 : 1.75, x < 0 ? -0.12 : 0.12, 0, d[0], d[1], SILK, false);
      });
    });
    await ctx.yield();

    bS = INT.makeBuilder(); solids.push(bS);
    // ---- THE LANTERN GALLERY (s 456-568, u 0.6-0.74): a drying deck across the nave shuts out the roof-lights; under
    // it, between slatted screens, several hundred paper lanterns hang lit to dry. Above the deck's front edge a
    // lattice of paper closes the roof space, so from the head rack the gallery is a dark mouth full of small flames.
    {
      const z0 = -6 - GAL[0], z1 = -6 - GAL[1], zm = (z0 + z1) / 2, len = z0 - z1, gr = rng.fork('gallery');
      bS.add(box(39.4, 0.5, len), { p: [0, DECK + 0.25, zm], c: TIMBER, surf: sWood(2, 0.3) });
      for (let z = z0 - 2; z > z1; z -= 4) bS.add(box(39.4, 0.6, 0.45), { p: [0, DECK - 0.3, z], c: TIMBER_L, surf: sWood(0, 0.35) });
      // the mouth: a heavy fascia beam with gilt studs and a vermilion rail, the paper lattice above it
      bS.add(box(39.8, 1.5, 0.9), { p: [0, DECK + 0.35, z0 + 0.45], c: TIMBER_L, surf: sWood(0, 0.5) });
      bS.add(box(39.8, 0.22, 1.0), { p: [0, DECK - 0.5, z0 + 0.5], c: VERM, surf: [0.85, 0, 0.06, 1] });
      for (let k = -9; k <= 9; k++) bS.add(sph(0.24, 6, 4), { p: [k * 2.05, DECK + 0.35, z0 + 0.95], c: GILT, surf: S_GILT });
      const gy = DECK + 1.1, pc = hexMix(CREAM, GOLDW, 0.25);
      for (const sd of [-1, 1]) bS.quad([0, gy, z0], [19.4 * sd, gy, z0], [19.4 * sd, roofY(19.4) - 0.6, z0], [0, RIDGE - 0.8, z0], pc, S_PAPER);
      for (let k = -4; k <= 4; k++) beam(bS, [k * 3.9, gy, z0 + 0.1], [k * 3.9, roofY(k * 3.9) - 0.9, z0 + 0.1], 0.3, 0.3, TIMBER);
      for (const y of [30.4, 34.4, 38.4, 42.2]) { const hw = (RIDGE - y) / 0.9375 - 1.2; beam(bS, [-hw, y, z0 + 0.12], [hw, y, z0 + 0.12], 0.26, 0.26, TIMBER); }
      await ctx.yield();
      // slatted screens either side of the nave, with sheets of paper pegged up to dry
      for (const sd of [-1, 1]) {
        const x = 17.5 * sd;
        for (const y of [6.2, 12.4, 18.6, DECK - 0.9]) bS.add(box(0.36, 0.45, len), { p: [x, y, zm], c: TIMBER_L, surf: sWood(2, 0.35) });
        for (let k = 0; k * 4 <= len; k++) {
          const z = z0 - k * 4;
          bS.add(box(0.32, DECK, 0.32), { p: [x, DECK / 2, z], c: TIMBER, surf: sWood(1, 0.3) });
          if (k * 4 >= len) break;
          for (let row = 0; row < 4; row++) {
            const h = gr(), y0 = row * 6.2 + 0.5, hh = row === 3 ? DECK - 19.9 : 5.3;
            if (h < 0.4) for (let q = 0; q < 4; q++) bS.add(box(0.1, hh, 0.5), { p: [x, y0 + hh / 2, z - 0.7 - q * 0.87], c: hexMix(TIMBER, TIMBER_L, gr()), surf: sWood(1, 0.25) });
            else if (h < 0.62) bS.add(box(0.05, hh - 0.5, 3.3), { p: [x - 0.12 * sd, y0 + hh / 2, z - 2], c: hexMix(CREAM, GOLDW, 0.15 + 0.3 * gr()), surf: S_PAPER });
          }
        }
        await ctx.yield();
      }
    }
    // ---- THE OPEN ROOF BAY (over the hoops, u 0.76-0.85): its shutters of paper on timber frames hang open below the slot
    {
      const cuts = [SLOT_.z - SLOT_.hl, SLOT_.z + SLOT_.hl];
      for (let i = 0; i < NTRUSS; i++) { const z = trussZ(i); if (z > cuts[0] + 1 && z < cuts[1] - 1) cuts.push(z); }
      cuts.sort((a, b) => a - b);
      const hx = SLOT_.x1 * sg, hy = roofY(SLOT_.x1) - 0.9, dx = sg * 0.1, dy = -0.995, pc = hexMix(CREAM, GOLDW, 0.2);      // hinged on the lower edge, hanging clear of the light
      for (let i = 0; i + 1 < cuts.length; i++) {
        const n = Math.max(1, Math.round((cuts[i + 1] - cuts[i]) / 6.2)), w = (cuts[i + 1] - cuts[i] - 1.4) / n;
        for (let j = 0; j < n; j++) {
          const za = cuts[i] + 0.7 + j * w + 0.2, zb = za + w - 0.4, Lf = 5.6 + ((i + j) % 2) * 0.9;
          const P = (f, z) => [hx + dx * Lf * f, hy + dy * Lf * f, z];
          bS.quad(P(0, za), P(0, zb), P(1, zb), P(1, za), pc, S_PAPER);
          for (const f of [0, 0.5, 1]) beam(bS, P(f, za), P(f, zb), 0.22, 0.22, TIMBER_L);
          for (const z of [za, (za + zb) / 2, zb]) beam(bS, P(0, z), P(1, z), 0.22, 0.22, TIMBER_L);
        }
      }
    }
    await ctx.yield();

    // ---- the head rack: three dragon heads in three stages, each with pinwheel eyes
    const HRX = sx(424) + 11.6, HRY = eyeAt(424) - 0.5, YAW = -0.44;
    const LIV = { vermilion: { ground: VERM, scallop: VIRID }, azure: { ground: '#2a66b8', scallop: CREAM }, black: { ground: '#2b1b15', scallop: GILT } };
    const liv3 = LIV[cast.pick(['vermilion', 'azure', 'black', 'vermilion'])];
    const pins = [], pinGeo = pinwheelGeo(VERM, GILT);
    for (const [z, stage] of [[-416, 0], [-430, 1], [-444, 2]]) {
      const M = new THREE.Matrix4().makeRotationY(YAW).setPosition(HRX, HRY, z);
      const r = await addHead(bS, M, stage, liv3, ctx.yield);
      for (const e of r.eyes) {
        const m = dynMesh(pinGeo, 0, 0, 0);
        m.position.copy(e.p).applyMatrix4(M);
        m.quaternion.setFromUnitVectors(new V3(0, 0, 1), e.dir.clone().transformDirection(M));
        pins.push({ m, rate: 5 + pins.length * 0.9, q: m.quaternion.clone() });
      }
      r.beard.forEach((bd, k) => {
        const p = new V3(bd[0], bd[1], bd[2]).applyMatrix4(M);
        put('tassel', p.x, p.y, p.z, 0, bd[3], YAW + krng.range(-0.6, 0.6), 0, k % 3 ? col(liv3.ground, 0.8) : C.gilt, C.cream, 0, false);
      });
      for (const dz of [-2.6, 2.4]) { const a = new V3(-2.9, -2.8, dz).applyMatrix4(M), c = new V3(2.9, -2.8, dz).applyMatrix4(M); beam(bS, a.toArray(), c.toArray(), 0.45, 0.45, TIMBER_L); }
      await ctx.yield();      // a head at a time
    }
    {
      const ry = HRY - 3.25;
      for (const s of [-1, 1]) {
        const x = HRX + 2.3 * s;
        beam(bS, [x, ry, -405], [x, ry, -455], 0.5, 0.6, TIMBER_L);
        [-408, -423, -437, -452].forEach((z, k) => {
          beam(bS, [x, 0, z], [x, ry, z], 0.7, 0.7, TIMBER, { gloss: 0.35 });
          bS.add(box(1.3, 0.8, 1.3), { p: [x, 0.4, z], c: '#8a7f6c', surf: S_STONE });
          if (k < 3) beam(bS, [x, 1.5 + (k % 2) * 0.01, z], [x, ry - 1, z - 14 + (k === 2 ? -1 : 0)], 0.35, 0.35, TIMBER_L);
        });
      }
      for (const z of [-408, -423, -437, -452]) { beam(bS, [HRX - 2.3, ry - 5, z], [HRX + 2.3, ry - 5, z], 0.4, 0.4, TIMBER_L); beam(bS, [HRX - 2.3, 7, z], [HRX + 2.3, ry - 5.5, z], 0.3, 0.3, TIMBER_L); }
      for (const s of [-1, 1]) beam(bS, [HRX - 6.2 + 0.9 * s, 0, -426], [HRX - 2.7 + 0.9 * s, ry + 0.6, -426], 0.22, 0.22, GOLDW, { bamboo: true });
      for (let k = 1; k < 13; k++) { const f = k / 13; beam(bS, [HRX - 7.1 + 3.5 * f, (ry + 0.6) * f, -426], [HRX - 5.3 + 3.5 * f, (ry + 0.6) * f, -426], 0.14, 0.14, GOLDW, { bamboo: true }); }
    }
    await ctx.yield();

    // ---- the moon gate: a heavy timber surround with gilt studs, a vermilion lip and pennants
    {
      const prof = [[8.6, 0], [8.6, 1.4], [9.0, 1.75], [9.6, 1.75], [9.95, 1.4], [10.7, 1.3], [11.0, 0.95], [11.0, 0]].map((p) => new THREE.Vector2(p[0], p[1]));
      const ring = new THREE.LatheGeometry(prof, 56); ring.rotateX(PI / 2);
      bS.add(ring, { p: [0, 18, Z_OUT], c: TIMBER_L, surf: sWood(0, 0.5) });
      bS.add(new THREE.TorusGeometry(8.8, 0.24, 6, 56), { p: [0, 18, Z_OUT + 1.6], c: VERM, surf: [0.85, 0, 0.08, 1] });
      await ctx.yield();
      for (let k = 0; k < 28; k++) { const a = (k / 28) * TAU; bS.add(sph(0.26, 7, 5), { p: [Math.cos(a) * 10.35, 18 + Math.sin(a) * 10.35, Z_OUT + 1.36], c: GILT, surf: S_GILT }); }
      // the great round window about it: an outer timber ring with gilt studs, twelve heavy spokes, a middle hoop
      const prof2 = [[19.05, 0], [19.05, 0.95], [19.45, 1.3], [20.0, 1.3], [20.4, 0.9], [20.4, 0]].map((p) => new THREE.Vector2(p[0], p[1]));
      const ring2 = new THREE.LatheGeometry(prof2, 72); ring2.rotateX(PI / 2);
      bS.add(ring2, { p: [0, 18, Z_OUT], c: TIMBER_L, surf: sWood(0, 0.5) });
      for (let k = 0; k < 44; k++) { const a = ((k + 0.5) / 44) * TAU; if (18 + Math.sin(a) * 19.72 > 0.4) bS.add(sph(0.24, 6, 4), { p: [Math.cos(a) * 19.72, 18 + Math.sin(a) * 19.72, Z_OUT + 1.1], c: GILT, surf: S_GILT }); }
      for (let k = 0; k < 12; k++) {
        const a = (k / 12) * TAU, c = Math.cos(a), sn = Math.sin(a);
        beam(bS, [c * 10.9, 18 + sn * 10.9, Z_OUT + 0.42], [c * 19.2, 18 + sn * 19.2, Z_OUT + 0.42], 0.62, 0.8, k % 3 ? TIMBER : TIMBER_L, { gloss: 0.4 });
        if (18 + sn * 15.2 > 0.5) bS.add(sph(0.3, 7, 5), { p: [c * 15.2, 18 + sn * 15.2, Z_OUT + 0.95], c: GILT, surf: S_GILT });
      }
      bS.add(new THREE.TorusGeometry(15.2, 0.2, 5, 72), { p: [0, 18, Z_OUT + 0.5], c: TIMBER_L, surf: sWood(0, 0.5) });
      bS.add(box(46, 1.3, 2.4), { p: [0, 0.65, Z_OUT + 1.1], c: '#8a7f6c', surf: S_STONE });
      bS.add(box(44, 0.4, 2.0), { p: [0, 1.5, Z_OUT + 1.0], c: '#9a8f7a', surf: S_STONE });
      for (let k = 0; k < 7; k++) {
        const a = (0.16 + (k / 6) * 0.68) * PI, x = Math.cos(a) * 11.4, y = 18 + Math.sin(a) * 11.4;
        beam(bS, [x, y, Z_OUT + 0.4], [x * 1.04, y + 0.5, Z_OUT + 4.6], 0.12, 0.12, GOLDW, { bamboo: true });
        put('pennant', x * 1.04, y + 0.45, Z_OUT + 4.4, 0, 1.6, 0.2 * (k - 3), 0, [C.verm, C.gilt, C.virid][k % 3], C.cream, 0, false);
      }
    }
    await ctx.yield();
    // ---- posts that pass close: a coil of line, a notice, a bundle of split bamboo
    for (let i = 5; i < NTRUSS; i++) for (const s of [-1, 1]) {
      const z = trussZ(i), st = -6 - z, x = 16 * s, lat = Math.abs(x - sx(st));
      if (lat > 12.5) continue;
      const y = eyeAt(st), side = -s;
      bS.add(new THREE.TorusGeometry(0.7, 0.2, 5, 12), { p: [x + side * 0.85, y - 0.5, z], r: [0, PI / 2, 0], c: hexMix(CREAM, GOLDW, 0.45), surf: S_CLOTH });
      bS.add(cyl(0.06, 0.06, 0.5, 4), { p: [x + side * 0.8, y + 0.2, z], r: [0, 0, PI / 2], c: INK, surf: S_GLOSS });
      bS.add(box(1.1, 1.5, 0.05), { p: [x, y + 2.2, z + 0.69], c: CREAM, surf: S_PLAIN });
      bS.add(box(0.5, 0.5, 0.06), { p: [x, y + 2.5, z + 0.71], c: VERM, surf: S_PLAIN });
      for (let k = 0; k < 5; k++) beam(bS, [x + side * (1.6 + k * 0.22), 0, z - 1 + k * 0.4], [x + side * 0.75, 15 + k * 0.6, z - 0.4 + k * 0.15], 0.2, 0.08, hexMix(GOLDW, CREAM, k * 0.08), { bamboo: true });
      await ctx.yield();
    }
    await ctx.yield();

    // ---- the hung kites
    const KH = { great: 0.95, swallow: 0.95, butterfly: 0.78, goldfish: 1.9, cicada: 0.95, eagle: 0.55, ladder: 26, lantern: 1.45, lanternT: 1.9 };
    const dom = cast.pick(['swallow', 'butterfly', 'cicada', 'swallow']);
    const GATE = new V3(0, 18, -770);
    const tints = (gold) => {
      if (krng() > look.accent * (gold ? 2 : 1)) return krng() < 0.5 ? [C.cream, C.pale] : [C.pale, C.cream];
      return [krng.pick(gold ? [C.verm, C.gilt, C.gilt] : [C.verm, C.virid, C.gilt]), krng.pick([C.gilt, C.cream, C.virid, C.verm])];
    };
    const lan = () => (mood === 'lantern' && krng() < 0.36 ? 1 : 0);
    const hangY = (x, z) => { const k = Math.round((2 - z) / BAY); return Math.abs(z - trussZ(k)) < 0.8 && Math.abs(x) < 19 ? TIE - 0.6 : roofY(x) - 1.0; };
    const keep = [];      // spheres nothing else may hang in: x, y, z, r
    // The line of sight to the moon gate (its opening and timber surround, 11.6 m in radius) from every eye
    // station of the last third: no kite, tail or string may hang in it, so the gate holds the centre uncovered.
    const coneViews = [];
    for (let sv = 436; sv < 757; sv += 7) coneViews.push([sv, camX(sv), camY(sv)]);
    const inCone = (x, y0, y1, s, r) => {
      if (s < 444) return false;
      for (const [sv, vx, vy] of coneViews) {
        if (sv > s - 5) break;
        const f = (s - sv) / (764 - sv), cx = vx * (1 - f), cy = lerp(vy, GATE.y, f), R = 11.6 * f + 1.1;
        const dx = Math.max(Math.abs(x - cx) - r, 0), dy = y1 < cy ? cy - y1 : (y0 > cy ? y0 - cy : 0);
        if (dx * dx + dy * dy < R * R) return true;
      }
      return false;
    };
    const blocked = (x, yTop, z, S, kind, lamp = false) => {
      const s = -6 - z, h = KH[kind] * S, r = S * 0.5, yb = yTop - h;
      if (s < 14 || s > 760 || yb < 7.5 || Math.abs(x) + r > 30.5) return true;
      if (!lamp) {
        if (s > DYE[0] - 3 && s < DYE[1] + 1) return true;                                 // the dye room is hung with silk only
        if (s > GAL[0] + 1 && s < GAL[1] - 1 && Math.abs(x) - r < 20.6) return true;       // over and under the drying deck
        if (s < GAL[0] + 1 && s > GAL[0] - 2.5 && Math.abs(x) - r < 20 && yTop > DECK - 2) return true;      // its fascia
        if (inBay(x, yTop - h * 0.5, z)) return true;                                      // nothing hangs in the shaft of the open bay
      }
      const cxs = camX(s), cys = camY(s);
      if (Math.abs(x - cxs) - r < 4.8 && yb < cys + 3.7 && yTop > cys - 5.5) return true;      // the eye's own corridor, where it leaves its seat
      if (s < 186 && Math.abs(x) - r < (s < 150 ? 9 : 10.5) && yb < 15 + s * 0.19) return true;      // the opening vista, up to and round the great swallow
      const ex = sx(s), ey = eyeAt(s), dx = Math.abs(x - ex) - r;
      if (dx < 5.8 && yb < ey + 3.6 && yTop > ey - 8) return true;
      for (const back of [40, 120, 260]) {
        const s0 = Math.max(0, s - back), f = (s - s0) / (764 - s0), lx = lerp(camX(s0), GATE.x, f), ly = lerp(camY(s0), GATE.y, f);
        if (Math.abs(x - lx) - r < 1.2 + (1 - f) * 1.6 && yb < ly + 1.5 && yTop > ly - 1.8) return true;
      }
      if (inCone(x, yb - 0.5, hangY(x, z), s, r + 0.4)) return true;
      if (s > 622 && s < 649.5 && Math.abs(x) - r < 18.6 && yb < 30) return true;      // the hoops of the second
      if (z < -402 && z > -458 && x > HRX - 7 && x < HRX + 9 && yb < HRY + 8) return true;
      for (const k of keep) if ((x - k[0]) ** 2 + (yTop - h / 2 - k[1]) ** 2 * 0.6 + ((z - k[2]) * 2.5) ** 2 < (k[3] + r) ** 2) return true;
      return false;
    };
    const hang = (kind, x, yTop, z, S, yaw, pitch, cc, force) => {
      if (!force && blocked(x, yTop, z, S, kind)) return false;
      const hy = hangY(x, z), L = Math.max(0.5, hy - yTop);
      put(kind, x, hy - L, z, L, S, yaw, pitch, cc[0], cc[1], lan());
      return true;
    };
    // the great swallow over the axis at 150 m: a black sand swallow 20 m across, flying nearly flat under the
    // tie beams so the whole of it shows from the door; and the 12 m butterfly at the left shoulder
    hang('great', 0, 29.6, -161, 20, 0, 1.15, [C.ink, mood === 'rain' ? C.pale : C.verm], true);
    { const s = 229, x = sx(s) - 11.6, y = eyeAt(s) + 6.4; hang('butterfly', x, y, -6 - s, 12, 0.45, 0.25, mood === 'rain' ? [C.pale, C.cream] : [C.virid, C.gilt], true); keep.push([x, y - 4.5, -6 - s, 7]); }

    const nearKinds = ['swallow', 'butterfly', 'cicada', 'swallow', 'butterfly', 'eagle', dom, dom];
    let nHung = 0;
    // (a) the near set: something inside 10 m of the eye every few metres, beside and above the tunnel
    for (let s = 84; s < 752; s += 4.7 / density) {
      const ex = sx(s), ey = eyeAt(s), z = -6 - s + krng.range(-1.5, 1.5), kind = krng.pick(nearKinds);
      if (krng() < 0.62) {
        const side = krng() < 0.5 ? -1 : 1, S = krng.range(2.1, 4.2);
        const lat = 6.7 + S * 0.5 + krng() * 3.2, yy = ey + krng.range(-0.4, 4.6), yw = -side * 0.35 + krng.range(-0.4, 0.4), tt = tints();
        for (const more of [0, 3.5, 7, 10.5]) if (hang(kind, ex + side * (lat + more), yy, z, S, yw, 0.12, tt)) break;
      } else {
        const S = krng.range(2, 3.3);
        hang(kind, ex + krng.range(-4.6, 4.6), ey + 3.75 + KH[kind] * S + krng() * 2.4, z, S, krng.range(-0.5, 0.5), krng.range(0.45, 0.85), tints());
      }
      if ((++nHung & 31) === 0) await ctx.yield();
    }
    // (b) the goldfish shoal at u 0.47-0.53, tails streaming: beside the body and under the eye, which looks down on it here
    for (let i = 0, n = Math.round(104 * density * detail); i < n; i++) {
      const s = krng.range(DYE[1] + 3, 412), ex = sx(s), ey = eyeAt(s), S = krng.range(1.5, 2.6), z = -6 - s;
      if (krng() < 0.8) { const side = krng() < 0.5 ? -1 : 1; hang('goldfish', ex + side * (6.3 + S * 0.5 + krng() * 9), ey + krng.range(-1.5, 5.5), z, S, -side * 0.3 + krng.range(-0.5, 0.5), 0.1, tints(true)); }
      else hang('goldfish', ex + krng.range(-5.5, 5.5), ey + 3.7 + 1.9 * S + krng() * 3, z, S, krng.range(-0.6, 0.6), 0.2, tints(true));
      if ((i & 31) === 31) await ctx.yield();
    }
    // (c) the butterfly canopy over the last third, (d) eagles straining on long strings at the upper left
    for (let i = 0, n = Math.round(130 * density * detail); i < n; i++) {
      const s = krng.range(GAL[1] + 2, 748), x = krng.range(-23, 23), S = krng.range(2.4, 6);
      const y0 = Math.max(eyeAt(s) + (Math.abs(x) < 9 ? 7.5 : 4.2) + 0.78 * S, krng.range(23, Math.min(37, roofY(x) - 2))), yw = krng.range(-0.7, 0.7), pt = krng.range(0.5, 1.0), tt = tints();
      for (const more of [0, 3, 6]) if (y0 + more < roofY(x) - 1.5 && hang('butterfly', x, y0 + more, -6 - s, S, yw, pt, tt)) break;
      if ((i & 31) === 31) await ctx.yield();
    }
    for (let i = 0; i < 14; i++) { const x = krng.range(-27, -11); hang('eagle', x, krng.range(24, Math.min(31, roofY(x) - 6)), -6 - krng.range(GAL[1] + 4, 742), krng.range(5, 8), krng.range(0.1, 0.7), krng.range(0.3, 0.7), [C.pale, C.cream]); }
    // (e) the fill: the whole roof space, the dominant kind per seed
    const fillKinds = ['swallow', 'butterfly', 'goldfish', 'cicada', 'eagle', 'ladder', dom, dom, dom, dom];
    for (let i = 0, n = Math.round(430 * density * detail); i < n; i++) {
      const kind = krng.pick(fillKinds), x = krng.range(-29, 29), z = -6 - krng.range(14, 758), top = Math.min(40, roofY(x) - 1.6);
      const yTop = krng.range(Math.min(13, top), top), S = kind === 'ladder' ? krng.range(0.45, 0.7) : (yTop > 26 && krng() < 0.22 ? krng.range(5, 9) : krng.range(1.8, 4.8));
      hang(kind, x, yTop, krng() < 0.4 ? trussZ(Math.round((2 - z) / BAY)) + krng.range(-0.5, 0.5) : z, S, krng.range(-0.8, 0.8), yTop > 24 ? krng.range(0.3, 0.9) : krng.range(0, 0.3), tints(kind === 'goldfish'));
      if ((i & 31) === 31) await ctx.yield();
    }
    await ctx.yield();

    // (f) the lanterns of the gallery: three tiers on bamboo arms down both screens, and rows on cords under the deck
    {
      const lr2 = rng.fork('lanterns'), z0 = -6 - GAL[0], z1 = -6 - GAL[1], hyD = DECK - 0.65;
      const lanC = [col('#ffe9c4', 0.9), col('#f6c36a', 0.9), col(VERM, 0.9), col('#ffd49a', 0.9), col('#e8642a', 0.9), col('#ffe9c4', 0.9)];
      const lamp = (x, yTop, z, S, hy) => {
        const kind = lr2() < 0.3 ? 'lanternT' : 'lantern', SS = kind === 'lanternT' ? S * 0.8 : S;
        if (blocked(x, yTop, z, SS, kind, true)) return false;
        put(kind, x, yTop, z, hy - yTop, SS, lr2() * 6, 0, lr2.pick(lanC), lr2() < 0.5 ? C.verm : C.gilt, 2);
        return true;
      };
      for (let k = 0; k < 28; k++) for (const sd of [-1, 1]) [11.4, 16.6, 21.8].forEach((yT, ti) => {
        const z = z0 - 1.4 - k * 4 - ti * 1.1;
        if (z < z1 + 1 || !lamp(15.4 * sd, yT, z, lr2.range(2.2, 2.7), yT + 0.4)) return;
        beam(bS, [17.5 * sd, yT + 0.45, z], [15.2 * sd, yT + 0.45, z], 0.13, 0.13, GOLDW, { bamboo: true });
      });
      await ctx.yield();
      for (let z = z0 - 3; z > z1 + 3; z -= 4.8) for (const xr of [-12.2, -7.6, -3, 1.6, 6.2, 10.8]) {
        const x = xr + lr2.range(-0.8, 0.8), zz = z + lr2.range(-1.2, 1.2), L = lr2.range(0.4, 3.2), S = lr2.range(1.8, 3.0);
        if (!lamp(x, hyD - L, zz, S, hyD)) lamp(x, hyD - 0.4, zz, 1.8, hyD);
      }
    }

    // ---- rare event: at u 0.59-0.63 a gust tears a dozen vermilion kites off their strings. They tumble, catch the
    // draught and race alongside: eight of them 9 to 23 m ahead of the eye, four a side, 8 to 10 m out (u 0.63-0.75),
    // four more strung ahead along the body. From u 0.76 they close up over the body, thread the two hoops and go
    // out through the moon gate ahead of us (u 0.86-0.93), each trailing its torn string.
    let loose = null;
    if (vary.rare) {
      loose = { items: [], sets: [] };
      for (const kind of ['great', 'goldfish', 'torn']) {
        const g = KITES[kind]().geo, n = kind === 'torn' ? 12 : 6;
        const H = new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4), I = new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4);
        const C1 = new Float32Array(n * 4), C2 = new Float32Array(n * 3);
        H.setUsage(THREE.DynamicDrawUsage); I.setUsage(THREE.DynamicDrawUsage);
        for (let i = 0; i < n; i++) { const a = [col(VERM), col(VERM, 0.92), col(VERM)][i % 3], b = [col(GILT), col(CREAM, 0.9), col(GILT)][i % 3]; C1.set([a.r, a.g, a.b, mood === 'lantern' ? 1 : 0], i * 4); C2.set([b.r, b.g, b.b], i * 3); }
        g.setAttribute('aH', H); g.setAttribute('aI', I);
        g.setAttribute('aC1', new THREE.InstancedBufferAttribute(C1, 4)); g.setAttribute('aC2', new THREE.InstancedBufferAttribute(C2, 3));
        g.instanceCount = n;
        addMesh(g, paperMat, 1);
        loose.sets.push({ H, I });
      }
      const LAG = 16;
      for (let i = 0; i < 12; i++) {
        const fish = i % 2 === 1, near = i < 8, j = near ? i >> 1 : i - 8, side = (near ? i : i >> 1) % 2 ? 1 : -1;
        const S = fish ? krng.range(3.5, 4.1) : krng.range(5.0, 5.6);
        const ahead = near ? 9 + j * 4.6 + krng() * 1.5 : 31 + j * 8.5 + krng() * 3;
        const ut = 0.59 + (near ? j * 0.004 : 0.002 + j * 0.003), uOut = (near ? 0.885 + j * 0.012 : 0.86 + j * 0.006) + (side > 0 ? 0.005 : 0);
        const it = { set: i % 2, idx: i >> 1, i, side, S, ahead, ut, uOut, s0: ut * 764 + ahead + LAG, pull: (764 * (1 - uOut) - ahead + 2) / ((uOut - 0.75) ** 2),
          lat: (near ? 8.3 + (j % 2) * 1.5 : 7.4) + S * 0.12 + krng() * 0.8, up: near ? [-0.6, 2.6, 0.8, 3.4][j] + krng.range(-0.4, 0.4) : krng.range(0.5, 3.6),
          lane: 3.4 + (i % 3) * 1.5, high: 3.4 + ((i * 5) % 4) * 0.8, ph: krng() * 6 };
        loose.items.push(it);
        const x = sx(it.s0) + side * it.lat, y = eyeAt(it.s0) + it.up, hy = roofY(x) - 1;
        strings.H.push(x, hy, -6 - it.s0, hy - y); strings.I.push(S, 0, it.ph, 0);
      }
      loose.LAG = LAG;
    }
    const _qz = new THREE.Quaternion(), _zAx = new V3(0, 0, 1);
    function updateLoose(uS, t) {
      const LAG = loose.LAG;
      for (const it of loose.items) {
        const d = Math.max(0, (uS - it.ut) * 764), lead = it.pull * Math.max(0, uS - 0.75) ** 2;
        const k = smoothstep(3, 30, d), torn = d > 0 ? 1 : 0;
        const s = it.s0 + d - LAG * (1 - Math.exp(-d / LAG)) + lead + 1.8 * Math.sin(t * 0.55 + it.ph) * k;
        const c1 = smoothstep(578, 620, s), c2 = smoothstep(724, 762, s);      // they flank the sight line to the gate until the last 40 m
        const lat = lerp(it.lat + 0.7 * Math.sin(t * 0.8 + it.ph * 2) * k, it.lane, c1);
        const x = lerp(sx(s) + it.side * lat, it.side * it.lane * 0.45, c2);
        const yFree = eyeAt(s) + it.up - 2.2 * Math.sin(Math.min(1, d / 34) * PI) + 0.8 * Math.sin(t * 1.7 + it.ph) * k;
        const y = lerp(lerp(yFree, eyeAt(s) + it.high, c1), 16.4 + it.high * 0.55, c2);
        const sc = it.S * (1 - smoothstep(755, 764, s));
        const yaw = -it.side * 0.3 * (1 - k) + torn * ((1 - k) * d * 0.24 * it.side + (0.75 - 0.4 * c1) * Math.sin(t * 1.15 + it.ph) * k);
        const pitch = torn ? lerp(0.12 + d * 0.3, -0.95 + (0.45 - 0.25 * c1) * Math.sin(t * 1.9 + it.ph * 1.3), k) : 0.12;
        const set = loose.sets[it.set], j = it.idx * 4, tr = loose.sets[2], jt = it.i * 4;
        set.H.array[j] = x; set.H.array[j + 1] = y; set.H.array[j + 2] = -6 - s; set.H.array[j + 3] = 0;
        set.I.array[j] = sc; set.I.array[j + 1] = yaw; set.I.array[j + 2] = it.ph; set.I.array[j + 3] = pitch;
        tr.H.array[jt] = x; tr.H.array[jt + 1] = y; tr.H.array[jt + 2] = -6 - s; tr.H.array[jt + 3] = 0;
        tr.I.array[jt] = torn * k * sc * 1.7; tr.I.array[jt + 1] = yaw * 0.5; tr.I.array[jt + 2] = it.ph + 2; tr.I.array[jt + 3] = pitch - 0.25;
      }
      for (const set of loose.sets) { set.H.needsUpdate = true; set.I.needsUpdate = true; }
    }

    // ---- build the paper meshes, the strings and the merged solids
    let nKites = 0;
    for (const name of Object.keys(kinds)) {
      const k = kinds[name], g = KITES[name]().geo;
      g.setAttribute('aH', new THREE.InstancedBufferAttribute(new Float32Array(k.H), 4)); g.setAttribute('aI', new THREE.InstancedBufferAttribute(new Float32Array(k.I), 4));
      g.setAttribute('aC1', new THREE.InstancedBufferAttribute(new Float32Array(k.C1), 4)); g.setAttribute('aC2', new THREE.InstancedBufferAttribute(new Float32Array(k.C2), 3));
      g.instanceCount = k.H.length / 4; nKites += g.instanceCount;
      addMesh(g, paperMat, 1);
      await ctx.yield();
    }
    {
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute([-1, 0, 0, 1, 0, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
      g.setAttribute('aH', new THREE.InstancedBufferAttribute(new Float32Array(strings.H), 4)); g.setAttribute('aI', new THREE.InstancedBufferAttribute(new Float32Array(strings.I), 4));
      g.instanceCount = strings.H.length / 4;
      addMesh(g, mk(STRING_VS, STRING_FS, { uniforms: { uCol: { value: col(mood === 'lantern' ? '#0c1438' : '#3a2a1a', 1) } }, side: THREE.DoubleSide, transparent: true, depthWrite: false }), 2);
    }
    await ctx.yield();
    for (const b of solids) { for (const g of b.buildChunks(8, 780)) addMesh(g, solidMat, 0, true); await ctx.yield(); }
    addMesh(bL.build(), solidMat, 0);
    await ctx.yield();

    // ---- shafts through the torn and propped panes, their holes and their pools
    const Dl = sunDir.clone().multiplyScalar(-1), roofSun = sunDir.y > 0.45, beamOn = look.shaft[1] > 0;
    {
      const aA = [], aB = [];
      [24, 60, 100, 150, 205, 236, 366, 398, 436, 590, 668, 712].forEach((s, i) => {
        const roof = roofSun && i >= 2, w = roof ? 1.5 : 1.25;
        const zb = trussZ(Math.round((2 - (-6 - s) - 8) / BAY)) - 8 + ((i * 37) % 7) - 3;
        const xa = roof ? sg * [0, 0, 27.5, 29.2, 13, 16, 19, 12, 15, 18, 19.4, 19.4][i] : sg * 31.9;
        const a = new V3(xa, roof ? roofY(xa) - 0.15 : 9.2 + ((i * 29) % 5), roof ? zb : -6 - s);
        const t = Math.min(a.y / Math.max(-Dl.y, 0.05), (HALF - 1 + xa * sg) / Math.max(Math.abs(Dl.x), 0.05));
        const b = a.clone().addScaledVector(Dl, t);
        if (beamOn) { holes[i].set(a.x, a.y, a.z, w * 1.1); pools[i].set(b.x, b.z, w * 1.25 / Math.max(-Dl.y, 0.22), w * 1.35); }
        aA.push(a.x, a.y, a.z, w * 0.82); aB.push(b.x, b.y, b.z, i * 0.37);
      });
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute([-1, 0, 0, 1, 0, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
      g.setAttribute('aA', new THREE.InstancedBufferAttribute(new Float32Array(aA), 4)); g.setAttribute('aB', new THREE.InstancedBufferAttribute(new Float32Array(aB), 4));
      g.instanceCount = NHOLE;
      const m = addMesh(g, mk(BEAM_VS, BEAM_FS, { uniforms: { uBeam: { value: 0.6 } }, side: THREE.DoubleSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }), 5);
      m.visible = beamOn;
    }
    // ---- the shaft of the open bay: three rows of five broad beams from the slot to the floor, in every look
    {
      const aA = [], aB = [];
      for (let r = 0; r < 3; r++) for (let k = 0; k < 5; k++) {
        const xa = sg * lerp(SLOT_.x0 + 0.6, SLOT_.x1 - 0.6, k / 4), a = new V3(xa, roofY(xa) - 0.2, SLOT_.z + (r - 1) * SLOT_.hl * 0.62);
        const t = Math.min(a.y / Math.max(-Dl.y, 0.05), (HALF - 1 + xa * sg) / Math.max(Math.abs(Dl.x), 0.05));
        const b = a.clone().addScaledVector(Dl, t);
        aA.push(a.x, a.y, a.z, 1.2); aB.push(b.x, b.y, b.z, 3.1 + r * 1.7 + k * 0.37);
      }
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute([-1, 0, 0, 1, 0, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
      g.setAttribute('aA', new THREE.InstancedBufferAttribute(new Float32Array(aA), 4)); g.setAttribute('aB', new THREE.InstancedBufferAttribute(new Float32Array(aB), 4));
      g.instanceCount = 15;
      addMesh(g, mk(BEAM_VS, BEAM_FS, { uniforms: { uBeam: { value: 0.3 }, uShaft: { value: col(look.bay[0], look.bay[1] * 0.4) } }, side: THREE.DoubleSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }), 5);
    }
    // ---- the sky in the moon gate
    {
      const g = new THREE.CircleGeometry(9.6, 40); g.translate(0, 18, Z_OUT - 1.4);
      addMesh(g, mk(SKY_VS, SKY_FS, { uniforms: { uZen: { value: col(look.zen, 1.45) }, uHor: { value: col(look.hor, 1.6) }, uMode: { value: look.sky }, uFogK: { value: 0.3 } } }), -1);
    }

    await ctx.yield();

    // ---- air: dust, petals or snow, paper scraps; steam from the teapot
    const time = { value: 0 }, set = fx.fxGroup(); scene.add(set.object);
    set.add(fx.makeParticles({ rng: rng.fork('dust'), preset: 'dust', time, count: Math.round(2400 * detail), box: [46, 26, 66], velocity: [0, 0.12, -2.4], ...(mood === 'lantern' ? { colors: ['#8fb0ff', '#ffd9a0', '#6f8fe0'] } : {}) }));
    if (mood === 'snow') set.add(fx.makeParticles({ rng: rng.fork('snow'), preset: 'snow', time, count: Math.round(1500 * detail), box: [50, 30, 80], velocity: [0, -0.9, -4.5] }));
    else set.add(fx.makeParticles({ rng: rng.fork('petal'), preset: 'petals', time, count: Math.round((mood === 'rain' ? 150 : 400) * detail * density), box: [44, 26, 84], velocity: [0, -0.35, -6.5], colors: ['#f6c6cf', '#f1a3b4', '#fbe7e8'], size: [0.16, 0.34] }));
    set.add(fx.makeParticles({ rng: rng.fork('scrap'), preset: 'leaves', time, count: Math.round(230 * detail), box: [44, 24, 84], velocity: [0, -0.2, -8.5], colors: [CREAM, '#e6d9b8', hexMix(CREAM, GILT, 0.5)], size: [0.16, 0.42] }));
    set.add(fx.makeSmokeColumn({ rng: rng.fork('steam'), time, position: [teaAt[0] + 0.9, teaAt[1] + 1.0, teaAt[2] + 0.9], height: 5.5, radius: [0.2, 1.3], size: [0.7, 2.6], count: 22, color: '#f1ece2', colorTop: '#ffffff', shadowColor: '#b0a590', ambient: '#8a8070', opacity: 0.3, rate: 0.14, wind: [0.1, 0, -0.5], sunDir: sunDir.toArray() }));
    for (const i of [3, 4, 8]) set.add(fx.makeSmokeColumn({ rng: rng.fork('vat' + i), time, position: [vatAt[i][0], 2.6, vatAt[i][1]], height: 13, radius: [1.4, 4.2], size: [2.4, 6.5], count: 20, color: '#efe9de', colorTop: '#ffffff', shadowColor: '#a89c88', ambient: '#8a8070', opacity: 0.13, rate: 0.12, wind: [0.1, 0, -0.7], sunDir: sunDir.toArray() }));
    await ctx.yield();

    // ---- swallows: a few at home over the finishing floor, a stream against us at u 0.62, a few at the gable
    const fl = { sunDir: sunDir.toArray(), sunColor: '#' + col(look.paperS[0]).getHexString(), sunIntensity: 1.6, sky: '#' + col(look.paperR[0]).getHexString(), skyIntensity: 0.9, ground: hexMix(look.fog, GOLDW, 0.4), groundIntensity: 0.55 };
    const fauna = F.makeFauna(scene, { light: fl });
    const SW = { body: '#161d38', wingC: '#11172c', trail: '#18203a', tip: '#0a0e1c', head: '#161d38', belly: '#efe2c4', tailC: '#11172c' };
    fauna.add(F.makeFlock({ rng: rng.fork('sw1'), species: 'swifts', count: 12, size: 5.6, speed: 15, spread: [10, 4, 16], ...SW, closed: true,
      route: [[10, 20, -30], [14, 24, -90], [4, 27, -170], [-12, 25, -230], [-16, 22, -150], [-10, 18, -70], [-13, 21, -20], [0, 24, 0]] }), { always: true });
    const birdU = { value: 0 };
    {
      // aW = (wing parameter 0 root .. 1 tip, kind: 0 body, 1 wing, 2 tail)
      const P = [], Nn = [], W = [], tri = (a, b, c, n, kind = 0) => { for (const v of [a, b, c]) { P.push(v[0], v[1], v[2]); W.push(v[3] || 0, kind); const q = n || [v[0] * 6, v[1] * 6, (v[2] - 0.1) * 0.6]; Nn.push(q[0], q[1], q[2]); } };
      // a rounded body: six sides through four rings, nose to tail (the fourth number is the throat, for its rufous)
      const nose = [0, 0, 0.55, 1], tail = [0, 0, -0.5], up = [0, 1, 0], NS = 6;
      const rings = [[0.4, 0.075, 0.07, 0.8], [0.14, 0.15, 0.15, 0.3], [-0.12, 0.13, 0.13, 0], [-0.34, 0.06, 0.06, 0]].map(([z, rx, ry, th]) => {
        const r = []; for (let k = 0; k < NS; k++) { const a = (k / NS) * TAU; r.push([Math.cos(a) * rx, Math.sin(a) * ry - 0.02, z, th]); } return r;
      });
      for (let k = 0; k < NS; k++) {
        const k1 = (k + 1) % NS;
        tri(nose, rings[0][k], rings[0][k1]); tri(tail, rings[3][k1], rings[3][k]);
        for (let j = 0; j < 3; j++) { tri(rings[j][k], rings[j + 1][k], rings[j + 1][k1]); tri(rings[j][k], rings[j + 1][k1], rings[j][k1]); }
      }
      for (const s of [-1, 1]) {
        // a swept sickle wing in four panels, then the long forked tail
        const w = [[0.07 * s, 0, 0.3, 0], [0.07 * s, 0, -0.04, 0], [0.34 * s, 0, 0.26, 0.36], [0.3 * s, 0, 0.0, 0.36], [0.62 * s, 0, 0.1, 0.68], [0.56 * s, 0, -0.1, 0.68], [0.95 * s, 0, -0.34, 1]];
        tri(w[0], w[2], w[1], up, 1); tri(w[1], w[2], w[3], up, 1); tri(w[2], w[4], w[3], up, 1); tri(w[3], w[4], w[5], up, 1); tri(w[4], w[6], w[5], up, 1);
        tri([0, 0, -0.3, 0], [0.24 * s, 0, -1.0, 0], [0.03 * s, 0, -0.6, 0], up, 2);
      }
      const g = new THREE.InstancedBufferGeometry(), n = 64, aB = new Float32Array(n * 4), br = rng.fork('stream');
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(Nn, 3)); g.setAttribute('aW', new THREE.Float32BufferAttribute(W, 2));
      // strung out along 126 m so that a dozen or more are within 40 m of the eye all through u 0.77-0.85: low over
      // our head on the axis and climbing either side, where they cross the pale roof-light bands
      for (let i = 0; i < n; i++) { const sd = i % 2 ? -1 : 1, x = br.range(1.5, 10.5); aB.set([sd * x, 6.2 + x * 0.3 + br() * 1.5, (i + br()) * (126 / n), br() * 40], i * 4); }
      g.setAttribute('aB', new THREE.InstancedBufferAttribute(aB, 4)); g.instanceCount = n;
      addMesh(g, mk(BIRD_VS, BIRD_FS, { uniforms: { uBird: birdU }, side: THREE.DoubleSide }), 1);
    }
    fauna.add(F.makeFlock({ rng: rng.fork('sw4'), species: 'swifts', count: 9, size: 5.6, speed: 14, spread: [8, 3, 14], ...SW, closed: true, start: 0.5,
      route: [[-9, 19, -40], [-14, 23, -110], [0, 26, -190], [13, 24, -250], [17, 21, -160], [11, 17, -80], [12, 20, -25], [0, 23, -5]] }), { always: true });
    // the gable's own swallows circle over the tie beams round the great window, clear of the sight line to the gate
    fauna.add(F.makeFlock({ rng: rng.fork('sw3'), species: 'swifts', count: 8, size: 5.6, speed: 17, spread: [2.4, 1.2, 10], ...SW, closed: true,
      route: [[10, 31.5, -660], [10.5, 31.5, -700], [10.5, 32, -744], [6, 33.5, -758.5], [-6, 33.5, -758.5], [-10.5, 32, -744], [-10.5, 31.5, -700], [-10, 31.5, -660], [-6, 33, -646], [6, 33, -646]] }), { always: true });
    await ctx.yield();

    // ---- gaze, and what moves
    const catAt = new V3(-9.3, tTop + 2.6, -52.6), cageAt = new V3(CAGE[0], CAGE[1] + 2, CAGE[2]), headAt = new V3(HRX - 1.2, HRY + 0.4, -441), _poi = new V3(), _poi2 = new V3(), _poi3 = new V3(), _pp = new V3();
    const stOf = (u) => -6 - path.pointAt(u, _pp).z;
    const sunBase = HU.uSun.value.clone(), _cp = new V3();
    let reelA = 0;
    const PA = [CAGE[0] - 0.3, CAGE[1] + 0.8 * CK + 0.62, CAGE[2] - 0.45], PB = [CAGE[0] + 0.3, CAGE[1] + 1.6 * CK + 0.62, CAGE[2] + 0.5];

    return {
      scene, path, duration: 36, title: look.title,
      // linger on the finishing floor while the wave of discs stands up, let the haul gather speed, and ease a little
      // through the dye room and the lantern gallery
      pace: (u) => (0.42 + 0.68 * smoothstep(0.05, 0.2, u)) * (1 - 0.16 * bump(u, 0.34, 0.38, 0.44, 0.48) - 0.2 * bump(u, 0.585, 0.62, 0.71, 0.75)),
      camera: { fov: 62, near: 0.5, far: 1700, lookAhead: 26, sway: 0, bank: 0.5 },
      pois: [
        { at: catAt, from: 0.0, to: 0.06, weight: 0.5 },
        { at: cageAt, from: 0.052, to: 0.084, weight: 0.4 },
        { at: (t, u) => snake.body(stOf(u) + 13, _poi), from: 0.085, to: 0.2, weight: 0.36 },
        // alongside in the kite hall: look across at the body; over the goldfish: look down its length
        { at: (t, u) => { snake.body(stOf(u) + 20, _poi2); _poi2.y += 2; return _poi2; }, from: 0.195, to: 0.32, weight: 0.5 },
        { at: (t, u) => snake.body(stOf(u) + 24, _poi3), from: 0.462, to: 0.565, weight: 0.62 },
        { at: headAt, from: 0.5, to: 0.6, weight: 0.5 },
        // from the mouth of the lantern gallery the moon gate is held dead centre
        { at: GATE, from: 0.575, to: 1.06, weight: 0.9, fade: 0.14 },
      ],
      portal: { shape: 'circle', radius: 7, color: look.portal, glow: 0.9, revealDistance: 300 },
      post: { exposure: look.exposure, bloom: { strength: 0.32, radius: 0.6, threshold: 0.92 },
        grade: { saturation: look.sat, contrast: 1.05, tint: look.tint, shadowTint: look.shadow, vignette: 0.3, grain: 0.022, aberration: 0 } },
      ride: 'none',
      update(dt, t, camera, u = 0) {
        time.value = t;
        _cp.setFromMatrixPosition(camera.matrixWorld);
        const sEye = clamp(-6 - _cp.z, 0, 764), uS = u > 0 ? sEye / 764 : 0;
        HU.uSun.value.copy(sunBase).multiplyScalar(0.93 + 0.07 * Math.sin(t * 0.37) + 0.03 * Math.sin(t * 1.1 + 2));
        hero.setProgress(uS, sEye); hero.update(dt, t, camera);
        set.update(dt, t, camera); fauna.update(dt, t, camera, u);
        if (loose) updateLoose(uS, t);
        birdU.value = (uS - 0.765) * 764;
        // the reel pays out, then spins down once the line has left it
        reelA += dt * (uS < 0.1 ? 5 : 0.25 + 4.75 * Math.exp(-(uS - 0.1) / 0.05)); reel.rotation.x = reelA;
        // the cat breathes; its ear flicks when the line twangs and now and then after
        cat.scale.set(1.5 + 0.02 * Math.sin(t * 1.4), 1.5 + 0.07 * Math.sin(t * 1.4), 1.5);
        const e = uS - 0.012, tw = t % 5.2;
        catEar.rotation.z = -0.3 + (e > 0 ? Math.exp(-e * 60) * Math.sin(e * 700) * 0.7 : 0) + (tw < 0.45 ? Math.sin((tw / 0.45) * PI * 3) * 0.45 : 0);
        // the thrush hops between its perches
        const q = t / 1.5, seq = Math.floor(q), h = smoothstep(0, 0.2, q - seq), fwd = seq % 2 === 0, a = fwd ? PA : PB, b = fwd ? PB : PA;
        thrush.position.set(lerp(a[0], b[0], h), lerp(a[1], b[1], h) + Math.sin(h * PI) * 0.55, lerp(a[2], b[2], h));
        thrush.rotation.set(h >= 1 ? 0.12 * Math.sin(t * 9) : -0.3 * Math.sin(h * PI), fwd ? 0 : PI, 0);
        stool.rotation.z = 0.075 * Math.sin(t * 2.3);
        const roll = 0.55 * Math.sin(t * 0.8); brush.position.x = 6.4 + roll; brush.rotation.z = -roll / 0.07;
        for (const p of pins) p.m.quaternion.copy(p.q).multiply(_qz.setFromAxisAngle(_zAx, t * p.rate + 1.6 * Math.sin(t * 0.7 + p.rate)));
        if (leak) {
          // three drops in the air at once, 0.5 s apart; each rings the water as it lands
          const per = 1.5, H = leak.top - 1.2;
          leak.drops.forEach((m, i) => { const f = ((t + i * 0.5) % per) / per; m.position.y = leak.top - H * f * f; m.scale.set(1, 1 + 5 * f, 1); });
          const fr = (t % 0.5) / 0.5; leak.ring.scale.set(0.25 + 1.5 * fr, 1 - 0.9 * fr, 0.25 + 1.5 * fr);
        }
      },
      dispose() { hero.dispose?.(); },
    };
  },
};
