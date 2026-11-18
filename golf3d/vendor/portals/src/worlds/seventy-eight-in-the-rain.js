// SEVENTY-EIGHT IN THE RAIN
// A tiled veranda in Salvador da Bahia in a four o'clock downpour, built 1,200 times life size round a wind-up
// gramophone (src/parts/seventy-eight-in-the-rain.js). The camera enters over the cabinet's rear deck, settles on
// the soundbox and RIDES THE NEEDLE while the black shellac pours beneath; then it lifts off, wheels round in
// the rain past the hammock, the fan and the parrot's cage, and dives down the throat of the brass horn.
//
// THE STILL NEEDLE. Everything is a child of one `stage` group whose origin is the table top under the spindle
// (room coordinates: garden +z, back wall -z, hammock end +x). The world path is the approach, then an arc
// round the spindle, then the lift-off, turn and horn run; each frame stage.rotation.y is the angle the camera
// has advanced round the spindle (a table over u, eased in and out), so during the ride the room stands still
// round the viewer and only the record moves. The swell lowers the stage by the warp height under the needle.
// Light: no three.js lights. Every surface is a ShaderMaterial lit by the same analytic veranda the hero
// reflects (bright open front, dim back wall), in stage space, so light and reflections turn with the room.
// Looks by seed / ctx.vary.hour: downpour (silver), clearing sun-shower (low gold sun, sparks of rain, steaming
// floor), blue dusk after rain (dripping eaves, fireflies). Rare event: one lightning flash during the ride
// (a forked stroke in the cloud behind the palms, the torn seam of sky flaring on the shellac), the needle
// jumps toward the label and hops, the gecko bolts across the deck, the parrot flaps.
// THE RIDE (u 0.11-0.33) is three pictures, not one: the eye cranes in round the stage origin (EYES, key3) while
// the gaze pans off the label onto the soundbox (GAZES): wide with the whole label under the horn (u 0.08-0.16),
// the eave drip landing by the needle and throwing up its coronet (lands u 0.246), then close under the mica with
// the needle, its wake and the run-out band (u 0.34). The flash, when it comes, is at u 0.28.
// Beats are keyed to u (see `beats` in the returned object); pace() lingers on the needle and again through the
// turn. THE HORN (u 0.70 to the end). The run down the horn's axis starts ~370 m out: at u 0.70 the mouth stands over
// the record and its label with the whole table round it; at u 0.79 it is still whole in the frame, the veranda
// either side, and the hummingbird (or morpho) has darted down from the rim to hang in its lower left and lead the
// way in; the rim is crossed at u 0.92. Inside, each flute mirrors a warped strip of the opening, chased bands are
// cut into the brass, rings of light come up the bore with the music and drops stream down it to the portal, which
// sits in a burning collar 0.42 of the way up the bore (the dark neck behind it is never flown).
// THE TURN (u 0.54-0.69). The +x end of the veranda is its picture: a white rede slung low from the back wall to
// the front post, tipped toward the room so its hollow shows, a lace valance along its edges; the fan turning
// above it; the end wall falling from bright at the opening to dim in the corner; and, hung from a rafter on a
// chain between hammock and horn, the domed white cage with the parrot (or two canaries). Three pois hand the gaze
// from hammock (u 0.55-0.60) to cage (u 0.61-0.66) to horn (from u 0.69).
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { buildHero, grid, lathe, tube, place, merge, lin, mul, mixc, hornPoint, GLSL_ROOM } from '../parts/seventy-eight-in-the-rain.js';

const TAU = Math.PI * 2;
// gaze through the turn: where each point of interest aims and when (fractions of the turn, or offsets in u)
const POI = { hamY: 320, cageY: 40, h0: -0.09, h1: 1.0, hw: 0.84, c0: 0.3, c1: 0.012, cw: 0.8, n0: 0.7, nf: 0.15 };
const PALETTE = ['#0B0B0E', '#8F9BA1', '#DCE4E6', '#C8983A', '#2C4F93', '#2E5B45', '#B3261E'];
// the veranda, in room (stage) coordinates, metres at 1,200x
const FLOOR_Y = -900, WALL_Z = -2400, FRONT_Z = 2700, END_L = -3400, END_R = 3300, RAIL_Y = 300, EAVE_Y = 2300, RIDGE_Y = 2950, DADO_Y = 500;
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const rotY = (v, a, out = new THREE.Vector3()) => { const c = Math.cos(a), s = Math.sin(a); return out.set(v.x * c + v.z * s, v.y, -v.x * s + v.z * c); };

// ---------------------------------------------------------------- shared GLSL
const FPV = '#include <fog_pars_vertex>', FV = '#include <fog_vertex>';
const FPF = /* glsl */`
#include <fog_pars_fragment>
float fxFog(){
#ifdef USE_FOG
  #ifdef FOG_EXP2
  return 1. - exp(-fogDensity*fogDensity*vFogDepth*vFogDepth);
  #else
  return smoothstep(fogNear, fogFar, vFogDepth);
  #endif
#else
  return 0.;
#endif
}
vec3 fogCol(){
#ifdef USE_FOG
  return fogColor;
#else
  return vec3(0.);
#endif
}
vec3 fxApplyFog(vec3 c){ return mix(c, fogCol(), fxFog()); }
`;
// daylight of the veranda on a matte surface: P, N in stage space. The open front is the lamp.
const GLSL_VER = /* glsl */`
uniform float uSun; uniform vec3 uFill, uRake, uRakeDir;
float sunGate(vec3 P, vec3 d){
  float t = (${FRONT_Z.toFixed(1)} - P.z)/max(d.z, .08);
  vec3 h = P + d*t;
  float open = smoothstep(${(RAIL_Y - 40).toFixed(1)}, ${(RAIL_Y + 160).toFixed(1)}, h.y)*(1. - smoothstep(${(EAVE_Y - 220).toFixed(1)}, ${(EAVE_Y + 20).toFixed(1)}, h.y));
  float post = smoothstep(.045, .075, abs(fract((h.x + 1300.)/2000. + .5) - .5));
  float bal = smoothstep(-860., -790., h.y)*(1. - smoothstep(160., 240., h.y))*smoothstep(.2, .42, abs(fract(h.x/190.) - .5));
  float side = smoothstep(${END_L.toFixed(1)}, ${(END_L + 260).toFixed(1)}, h.x)*(1. - smoothstep(${(END_R - 260).toFixed(1)}, ${END_R.toFixed(1)}, h.x));
  return max(open*post, bal*.7)*side*step(P.z, ${(FRONT_Z + 40).toFixed(1)});
}
vec3 verIrr(vec3 P, vec3 N){
  float depth = smoothstep(${(WALL_Z - 200).toFixed(1)}, ${FRONT_Z.toFixed(1)}, P.z);
  float front = mix(.26, 1., depth*sqrt(depth));
  vec3 L = normalize(vec3(-P.x*.15, 800. - P.y, 3200. - P.z));
  float wrap = clamp(dot(N, L)*.6 + .4, 0., 1.);
  vec3 c = uSkyCol*front*(.22 + .55*wrap*wrap + .25*max(N.y, 0.));
  c += uFill*(.6 + .4*N.y);
  c += uSkyCol*.10*max(-N.y, 0.)*front;
  c += uKeyCol*max(dot(N, uKeyDir), 0.)*mix(.5, 2.4*sunGate(P, uKeyDir), uSun);
  // the last rift of a blue dusk rakes in low from the open side: warm on whatever faces it, fading into the room
  c += uRake*max(dot(N, uRakeDir), 0.)*sunGate(P, uRakeDir)*(.3 + .7*smoothstep(-2400., 1800., P.z));
  return c*(1. + uFlash*3.);
}
`;
const VERT_STD = /* glsl */`
attribute vec4 aData;
varying vec3 vWPos, vWNrm, vCol, vOPos; varying vec4 vData;
uniform float uTimeV;
${FPV}
void main(){
  vCol = color; vData = aData; vOPos = position;
  vec3 p = position;
#ifdef SWAY
  // aData.z = weight (m of travel), aData.w = phase: a draught in cloth, leaves shivering under the drip
  float w = aData.z;
  p.x += w*(sin(uTimeV*1.7 + aData.w) + .5*sin(uTimeV*4.3 + aData.w*2.1));
  p.z += w*.7*sin(uTimeV*2.3 + aData.w*1.3);
  p.y += w*.35*sin(uTimeV*6.1 + aData.w*3.7);
#endif
  vec4 wp = modelMatrix*vec4(p, 1.);
  vWPos = wp.xyz; vWNrm = mat3(modelMatrix)*normal;
  vec4 mvPosition = viewMatrix*wp;
  gl_Position = projectionMatrix*mvPosition;
  ${FV}
}`;
const FRAG_HEAD = /* glsl */`
varying vec3 vWPos, vWNrm, vCol, vOPos; varying vec4 vData;
${GLSL_ROOM}
${GLSL_VER}
${FPF}
// the mist under the roof is lit by the opening: toward the back of the room it is dimmer, so the far corners sink
vec3 roomFog(vec3 c, vec3 Ps){ return mix(c, fogCol()*mix(.4, 1., smoothstep(${WALL_Z.toFixed(1)}, 1500., Ps.z)), fxFog()); }
`;
// generic lit thing with vertex colours. aData.x = gloss 0..1, aData.y = baked occlusion 0..1; where nothing sways,
// aData.z = iridescence (the morpho's wings) and aData.w = 1 marks limewashed masonry standing in the rain
const FRAG_PROP = FRAG_HEAD + /* glsl */`
uniform float uLimeK;
void main(){
  vec3 N = normalize(vWNrm);
  if(!gl_FrontFacing) N = -N;
  vec3 V = normalize(cameraPosition - vWPos);
  vec3 Ns = normalize(uStageInv*N), Vs = normalize(uStageInv*V), Ps = uStageInv*(vWPos - uStagePos);
  float gloss = vData.x, occ = 1. - vData.y;
  float grain = n21(vOPos.xy*.05 + vOPos.z*.031)*.6 + n21(vOPos.zy*.21 + vOPos.x*.17)*.4;
  grain = mix(grain, .5, smoothstep(3., 14., length(fwidth(vOPos))));
  float stain = n21(vec2((vOPos.x + vOPos.z)*.011, vOPos.y*.0011))*.6 + n21(vec2((vOPos.x - vOPos.z)*.004, vOPos.y*.0005 + 3.))*.4;
  vec3 alb = vCol*(.8 + .4*grain)*(.78 + .44*stain);
  float ndv = max(dot(Ns, Vs), 0.);
  float lime = 0., irid = 0.;
#ifndef SWAY
  lime = step(.5, vData.w)*uLimeK; irid = vData.z;
  // limewash in the rain: streaks run down it, damp rises from the rail and the floor and hangs under the eave
  float y = vOPos.y;
  float streak = n21(vec2(vOPos.x*.045 + vOPos.z*.03, y*.0022))*.6 + n21(vec2(vOPos.x*.13 - vOPos.z*.09, y*.006 + 5.))*.4;
  float damp = (1. - smoothstep(${(RAIL_Y + 100).toFixed(1)}, ${(RAIL_Y + 1150).toFixed(1)}, y))*step(${RAIL_Y.toFixed(1)}, y)
    + (1. - smoothstep(${FLOOR_Y.toFixed(1)}, ${(FLOOR_Y + 650).toFixed(1)}, y))*step(y, ${RAIL_Y.toFixed(1)}) + .6*smoothstep(${(EAVE_Y - 800).toFixed(1)}, ${EAVE_Y.toFixed(1)}, y);
  alb *= 1. - lime*(.36*damp + .34*smoothstep(.42, .78, streak)*(.45 + .55*damp));
  alb = mix(alb, alb*vec3(.86, .97, .9), lime*smoothstep(.5, .85, stain)*damp);
  gloss = mix(gloss, .62, lime*.8);
  // the morpho: structural blue, brilliant face on, sinking to violet at a glancing angle
  float iv = ndv*sqrt(ndv);
  alb = mix(alb, mix(alb*vec3(.55, .4, 1.15), alb*1.35 + vec3(.03, .26, .4), iv), irid);
#endif
  float fr = 1. - ndv; float fr2 = fr*fr; fr = fr2*fr2*fr;
  vec3 col = alb*verIrr(Ps, Ns)*occ;
  vec3 Rr = reflect(-Vs, Ns);
  col += roomEnv(Rr, mix(.55, .06, gloss))*(.03 + .97*fr)*gloss*occ;
  // masonry: one side of every post and baluster lies in soft shade, and a wet edge turns toward the opening
  col *= mix(1., mix(.6, 1.12, smoothstep(-.85, .85, dot(Ns, vec3(-.83, .16, .53)))), lime);
  col += lime*uSkyCol*fr2*(1. - ndv)*.3*smoothstep(-.3, .5, Rr.z);
  col += irid*uSkyCol*vec3(.35, .75, 1.)*pow(max(dot(Ns, normalize(Vs + vec3(0., .6, .8))), 0.), 14.)*.5;
  gl_FragColor = vec4(roomFog(col, Ps), 1.);
}`;

// the hammock's lace valance: a woven tape at the cloth, an open net, a corded hem of small loops with an eyelet
// in each. Opaque with holes cut by discard; where the net is finer than a pixel it closes to its mean.
// aData.x = loops along the edge, aData.y = 0 at the cloth .. 1 at the lowest point of the hem
const FRAG_LACE = FRAG_HEAD + /* glsl */`
void main(){
  vec3 N = normalize(vWNrm);
  if(!gl_FrontFacing) N = -N;
  vec3 Ns = normalize(uStageInv*N), Ps = uStageInv*(vWPos - uStagePos);
  float a = vData.x, w = vData.y;
  float px = max(fwidth(a), 1e-4);
  float fa = fract(a) - .5;
  float hem = .64 + .36*sqrt(max(1. - 4.*fa*fa, 0.));
  if(w > hem) discard;
  float keep = 1. - smoothstep(.16, .45, px);
  vec2 q = vec2(a*2., w*3.4);
  float net = min(abs(fract(q.x + q.y) - .5), abs(fract(q.x - q.y) - .5));
  float thread = 1. - smoothstep(.08, .14, net);
  float tape = 1. - smoothstep(.1, .13, w);
  float bar = 1. - smoothstep(.03, .05, abs(w - .6));
  float cord = 1. - smoothstep(.06, .1, hem - w);
  float eyelet = 1. - smoothstep(.1, .14, length(vec2(fa, (w - .78)*.8)));
  float lobe = step(.62, w)*(1. - eyelet);
  float solid = max(max(tape, bar), max(cord, max(thread*step(w, .62), lobe)));
  if(solid < .5 && keep > .5) discard;
  vec3 alb = vCol*mix(.8, .86 + .14*solid + .1*cord + .08*tape, keep);
  alb *= .92 + .08*sin(a*6.2832*4.);
  gl_FragColor = vec4(roomFog(alb*verIrr(Ps, Ns)*(1. - .25*w), Ps), 1.);
}`;

// hydraulic-tile floor, wet: pattern, puddles mirroring the opening, ripple rings, the table's shade
const FRAG_FLOOR = FRAG_HEAD + /* glsl */`
uniform vec3 uTileA, uTileB, uTileC, uTileD; uniform float uWet; uniform vec4 uShade;
vec3 ring(vec2 p, float cell, float seed){
  vec2 q = p/cell, i = floor(q), f = fract(q) - .5;
  float k = h21(i + seed);
  vec2 o = (vec2(h21(i + seed + 3.1), h21(i + seed + 7.7)) - .5)*.5;
  float ph = fract(uTime*(.35 + .3*k) + k*9.);
  vec2 d = (f - o)*cell;
  float r = length(d), rr = ph*cell*.34;
  float q1 = (r - rr)/(cell*.02);
  float w = exp(-q1*q1)*(1. - ph)*(1. - ph);
  return vec3(d/max(r, 1e-3)*w*sin((r - rr)/(cell*.012)), w);
}
void main(){
  vec3 V = normalize(cameraPosition - vWPos);
  vec3 Vs = normalize(uStageInv*V), Ps = uStageInv*(vWPos - uStagePos);
  vec2 p = vOPos.xz/240.;
  float fw = max(fwidth(p.x) + fwidth(p.y), 1e-4);
  vec2 id = floor(p), f = fract(p) - .5, c = abs(f);
  float r = length(f), a = atan(f.y, f.x + step(r, 1e-4));
  float aa = fw*1.1;
  float star = r - (.25 + .085*cos(a*8.));
  float band = abs(r - .425) - .022;
  float lobe = length(c - .5) - .21, eye = length(c - .5) - .1;
  float keep = 1. - smoothstep(.3, 1.1, fw);
  vec3 alb = uTileA;
  alb = mix(alb, uTileC, 1. - smoothstep(-aa, aa, lobe));
  alb = mix(alb, uTileA, 1. - smoothstep(-aa, aa, eye));
  alb = mix(alb, uTileB, 1. - smoothstep(-aa, aa, star));
  alb = mix(alb, uTileD, 1. - smoothstep(-aa, aa, band));
  alb = mix(alb, uTileD, (1. - smoothstep(-aa, aa, r - .07)));
  alb = mix(mix(uTileA, uTileC, .3), alb, keep);
  alb *= 1. - .4*smoothstep(.487 - aa, .5, max(c.x, c.y))*keep;
  alb *= .8 + .32*h21(id) - .2*n21(vOPos.xz*.0011);
  // water lying in broad shallow sheets
  float pud = smoothstep(.42, .68, n21(vOPos.xz*.0016 + 3.)*.65 + n21(vOPos.xz*.006)*.35);
  float wet = clamp(uWet*(.45 + .55*pud), 0., 1.);
  vec3 rg = ring(vOPos.xz, 520., 0.) + ring(vOPos.xz + 211., 330., 5.);
  vec3 N = normalize(vec3(rg.x, 0., rg.y)*.35*wet + vec3(0., 1., 0.) + vec3(n21(vOPos.xz*.02 + uTime*.1) - .5, 0., n21(vOPos.zx*.02 - uTime*.1) - .5)*.02*pud);
  float ndv = max(dot(N, Vs), 0.);
  float fr = 1. - ndv; float fr2 = fr*fr; fr = fr2*fr2*fr;
  float F = .03 + .97*fr;
  vec3 irr = verIrr(Ps, vec3(0., 1., 0.));
  // the table and its cloth stand over the middle: soft shade
  float tr = length(Ps.xz);
  float sh = 1. - .5*(1. - smoothstep(380., 1150., tr));
  // the hammock's long soft shade (uShade.xy is free for one round blob of shade)
  sh *= 1. - .55*(1. - smoothstep(150., 560., length(Ps.xz - uShade.xy)));
  sh *= 1. - .3*(1. - smoothstep(.4, 1.3, length((Ps.xz - uShade.zw)/vec2(640., 1800.))));
  vec3 col = alb*irr*sh*(1. - .35*wet);
  col += roomEnv(reflect(-Vs, N), mix(.3, .03, wet))*F*(.35 + .65*wet)*mix(1., .55, 1. - sh);
  col += uSkyCol*rg.z*.06*wet;
  gl_FragColor = vec4(roomFog(col, Ps), 1.);
}`;

// walls: plaster over an azulejo dado of cobalt scroll panels; louvred doors and shutters painted in.
// aData.x = 0 back wall (s = x), 1 end walls (s = z), 3 the swinging door leaf (local x from the hinge)
const FRAG_WALL = FRAG_HEAD + /* glsl */`
uniform vec3 uGlaze, uCobalt, uPlaster, uShutter; uniform vec4 uDoors;     // door centres (x), ajar door index, ajar side
float volute(vec2 q, vec2 c, float turns, float dir){
  vec2 d = q - c; float r = max(length(d), 2e-3);
  return sin(log(r)*turns + atan(d.y, d.x + 1e-4)*dir);
}
float louvre(float y){ float sl = fract(y/88.); return mix(.34, 1., smoothstep(0., .3, sl))*(1. - .62*smoothstep(.7, 1., sl)); }
// one leaf: lx 0..1 across, y world height, top of the leaf
vec3 leaf(float lx, float y, float top){
  float st = min(lx, 1. - lx);
  float rail = min(min(y - ${FLOOR_Y.toFixed(1)}, top - y), abs(y - 560.) + 0.)/700.;
  float field = smoothstep(.09, .11, st)*smoothstep(.1, .12, rail);
  vec3 c = uShutter*mix(.9, louvre(y), field);
  c *= .75 + .25*smoothstep(0., .03, st);
  return c;
}
void main(){
  vec3 N = normalize(vWNrm);
  if(!gl_FrontFacing) N = -N;
  vec3 V = normalize(cameraPosition - vWPos);
  vec3 Ns = normalize(uStageInv*N), Vs = normalize(uStageInv*V), Ps = uStageInv*(vWPos - uStagePos);
  float id = vData.x;
  float s = id < .5 ? vOPos.x : vOPos.z, y = vOPos.y;
  vec3 alb; float gloss = 0.;
  float dq = (y - ${FLOOR_Y.toFixed(1)})/${(DADO_Y - FLOOR_Y).toFixed(1)};
  float fq = max(fwidth(dq), 1e-4)*1.3;
  vec2 tc = vec2(s, y - ${FLOOR_Y.toFixed(1)})/168.;
  float ft = max(fwidth(tc.y), 1e-4);
  if(id > 2.5){
    alb = leaf(clamp(vOPos.x/700., 0., 1.), y, 2050.);
    gloss = .25;
  } else {
    // plaster: lime wash with damp coming down from the roof and up from the floor
    float damp = n21(vec2(s/140., y/2600.))*.6 + n21(vec2(s/37., y/900.))*.4;
    alb = uPlaster*(.82 + .22*n21(vec2(s, y)*.004) - .28*smoothstep(.45, .8, damp)*smoothstep(900., 2800., y));
    alb = mix(alb, alb*vec3(.72, .8, .7), smoothstep(.55, .8, n21(vec2(s, y)*.0013 + 7.))*.5);
    // the dado
    if(dq < 1.045){
      float PW = 1680.;
      float px = fract(s/PW) - .5;
      vec2 q = vec2(abs(px)*PW/${(DADO_Y - FLOOR_Y).toFixed(1)}, dq);
      float ink = 0., wash = 0.;
      // rope borders top and bottom
      float bq = min(q.y, 1. - q.y);
      ink += 1. - smoothstep(.006, .006 + fq, abs(bq - .012));
      ink += 1. - smoothstep(.006, .006 + fq, abs(bq - .1));
      ink += (1. - smoothstep(.012, .012 + fq, abs(bq - .056 - .022*sin(s/168.*6.2832))))*step(bq, .1);
      wash += step(bq, .1)*.35;
      // pilaster between the panels
      float pe = .6 - q.x;
      ink += 1. - smoothstep(.005, .005 + fq, abs(pe - .05));
      ink += (1. - smoothstep(.01, .01 + fq, abs(pe - .025 - .012*sin(q.y*60.))))*step(pe, .05);
      wash += step(pe, .05)*.5;
      // the cartouche and its scrolls
      vec2 b = abs(q - vec2(0., .5)) - vec2(.44, .30);
      float box = length(max(b, 0.)) + min(max(b.x, b.y), 0.) - .035 + .012*sin(q.y*38.)*sin(q.x*38.);
      float inside = step(pe, .05) < .5 && bq > .1 ? 1. : 0.;
      ink += (1. - smoothstep(.007, .007 + fq, abs(box)))*inside;
      ink += (1. - smoothstep(.004, .004 + fq, abs(box + .03)))*inside;
      float inC = step(box, -.03)*inside;
      float v1 = volute(q, vec2(.23, .5), 7., 1.), v2 = volute(q, vec2(.36, .66), 6., -1.), v3 = volute(q, vec2(.36, .34), 6., 1.), v4 = volute(q, vec2(.1, .68), 5., 1.), v5 = volute(q, vec2(.1, .32), 5., -1.);
      float d1 = length(q - vec2(.23, .5)), d2 = length(q - vec2(.36, .66)), d3 = length(q - vec2(.36, .34)), d4 = length(q - vec2(.1, .68)), d5 = length(q - vec2(.1, .32));
      float sw = .32 + fq*18.;
      float sc = (1. - smoothstep(.0, sw, abs(v1)))*(1. - smoothstep(.1, .13, d1)) + (1. - smoothstep(.0, sw, abs(v2)))*(1. - smoothstep(.065, .085, d2))
        + (1. - smoothstep(.0, sw, abs(v3)))*(1. - smoothstep(.065, .085, d3)) + (1. - smoothstep(.0, sw, abs(v4)))*(1. - smoothstep(.06, .08, d4)) + (1. - smoothstep(.0, sw, abs(v5)))*(1. - smoothstep(.06, .08, d5));
      ink += sc*inC*(1. - smoothstep(.004, .02, fq));
      // a flower in the middle of each panel
      vec2 fc = q - vec2(0., .5); float fr0 = length(fc), fa = atan(fc.y, fc.x + 1e-4);
      float fl = fr0 - .055*(1. + .35*cos(fa*6.));
      ink += (1. - smoothstep(0., fq, fl))*inC;
      wash += inC*(.18 + .3*smoothstep(.4, .7, n21(q*9. + floor(s/PW)*3.)));
      ink = clamp(ink, 0., 1.);
      vec2 ti = floor(tc), tf = abs(fract(tc) - .5);
      float grout = smoothstep(.5 - ft - .012, .5, max(tf.x, tf.y))*(1. - smoothstep(.2, .7, ft));
      vec3 tile = uGlaze*(.9 + .14*h21(ti));
      tile = mix(tile, mix(uGlaze, uCobalt, .45), clamp(wash, 0., 1.)*.6);
      tile = mix(tile, uCobalt*(.8 + .4*h21(ti + 3.)), ink*.92);
      tile *= 1. - .45*grout;
      float mould = step(1., dq);                                   // the moulded cap
      alb = mix(tile, mix(uCobalt*.7, uGlaze, step(.5, fract(dq*44.))), mould);
      gloss = .55*(1. - mould*.5);
      alb *= mix(.55, 1., smoothstep(0., .07, dq));                  // splash-back grime at the floor
    }
    if(id > .5){
      float up = smoothstep(${DADO_Y.toFixed(1)}, ${(DADO_Y + 500).toFixed(1)}, y);
      float raf = smoothstep(.5, .92, sin((y + s*.5)/150.)*.5 + .5);
      alb *= 1. - .2*raf*up*smoothstep(600., 2600., y);
      float blot = smoothstep(.42, .7, n21(vec2(s/900., y/1300.) + 11.)*.7 + n21(vec2(s/260., y/420.) + 3.)*.3);
      alb = mix(alb, alb*vec3(.7, .78, .68), blot*.75*up);
    }
    if(id < .5){
      // two tall louvred doors with stone casings and a fanlight
      float dA = abs(s - uDoors.x), dB = abs(s - uDoors.y);
      float dd = min(dA, dB), which = dA < dB ? 0. : 1.;
      float sx = which < .5 ? s - uDoors.x : s - uDoors.y;
      float arch = length(vec2(sx, max(y - 2050., 0.)));
      float inDoor = step(dd, 720.)*step(arch, 720.)*step(y, 2800.);
      float casing = step(arch, 860.)*step(dd, 860.)*(1. - inDoor)*step(y, 2950.);
      alb = mix(alb, uPlaster*vec3(1.08, 1.05, .98)*(.85 + .15*step(.5, fract(arch/70.))), casing);
      gloss *= 1. - casing;
      if(inDoor > .5){
        gloss = .22;
        if(y > 2050.){
          float fa2 = atan(y - 2050., sx + 1e-3);
          alb = uShutter*(.55 + .45*step(.5, fract(arch/95.)))*(.6 + .4*step(.12, abs(fract(fa2/.5236) - .5)));
        } else {
          float side = step(0., sx);
          float lx = side > .5 ? sx/720. : 1. + sx/720.;
          alb = leaf(clamp(lx, 0., 1.), y, 2050.);
          alb *= .6 + .4*smoothstep(0., 14., abs(sx));
          float ajar = step(abs(which - uDoors.z), .5)*step(abs(side - uDoors.w), .5);
          alb = mix(alb, vec3(.012, .016, .016) + uShutter*.05*smoothstep(1400., -900., y), ajar);
          gloss *= 1. - ajar;
        }
      }
    } else {
      // a shuttered window in each end wall
      float wx = abs(s - 150.), wy = y - 1050.;
      float inW = step(wx, 620.)*step(abs(wy), 820.);
      float cas = step(wx, 730.)*step(abs(wy), 930.)*(1. - inW);
      alb = mix(alb, uPlaster*1.05, cas);
      if(inW > .5){
        float lx = fract((s - 150.)/620.*.5 + .5 + .5);
        float st = min(lx, 1. - lx);
        alb = uShutter*mix(.85, louvre(y), smoothstep(.08, .1, st)*step(abs(wy), 740.));
        gloss = .22;
      }
      gloss *= 1. - cas;
    }
  }
  float ndv = max(dot(Ns, Vs), 0.);
  float fr = 1. - ndv; float fr2 = fr*fr; fr = fr2*fr2*fr;
  vec3 col = alb*verIrr(Ps, Ns);
  col += roomEnv(reflect(-Vs, Ns), .12)*(.04 + .96*fr)*gloss;
  // the end walls run from the bright opening back into the dim of the room; the corners and the top of every
  // wall, under the roof, sink further
  float zf = smoothstep(${WALL_Z.toFixed(1)}, ${FRONT_Z.toFixed(1)}, Ps.z);
  float fall = (id > .5 && id < 2.5) ? mix(.46, 1.32, zf*zf) : 1.;
  float corner = id < .5 ? smoothstep(0., 1000., min(Ps.x - ${END_L.toFixed(1)}, ${END_R.toFixed(1)} - Ps.x)) : smoothstep(0., 1000., Ps.z - ${WALL_Z.toFixed(1)});
  fall *= mix(.58, 1., corner)*mix(1., .7, smoothstep(1500., 2900., Ps.y));
  col *= id > 2.5 ? 1. : fall;
  gl_FragColor = vec4(roomFog(col, Ps), 1.);
}`;

// underside of the clay-tile roof between the rafters
const FRAG_ROOF = FRAG_HEAD + /* glsl */`
uniform vec3 uClay;
void main(){
  vec3 N = normalize(vWNrm);
  if(!gl_FrontFacing) N = -N;
  vec3 Ns = normalize(uStageInv*N), Ps = uStageInv*(vWPos - uStagePos);
  vec2 p = vec2(vOPos.x/118., vOPos.z/230.);
  float fw = max(fwidth(p.x) + fwidth(p.y), 1e-4), keep = 1. - smoothstep(.3, 1.2, fw);
  float tr = abs(fract(p.x) - .5)*2.;
  float row = fract(p.y);
  float shade = (.5 + .5*tr*tr)*(.62 + .38*smoothstep(0., .14, row));
  vec3 alb = uClay*(.72 + .5*h21(floor(p)))*mix(.72, shade, keep);
  alb = mix(alb, vec3(.03, .022, .018), (1. - smoothstep(.05, .07, abs(fract(vOPos.z/460.) - .5)))*.9);
  alb *= .75 + .4*n21(vOPos.xz*.002);
  gl_FragColor = vec4(roomFog(alb*verIrr(Ps, Ns), Ps), 1.);
}`;

// what lies outside the open front: stacked rain cloud with one bright rift, walking rain, the bay, far gardens
const VERT_DOME = /* glsl */`
varying vec3 vOPos;
void main(){ vOPos = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position, 1.); }`;
const FRAG_DOME = /* glsl */`
varying vec3 vOPos;
${GLSL_ROOM}
uniform vec3 uCloudLo, uCloudHi, uHaze, uBay, uSunGlow; uniform float uRiftGain, uBolt;
void main(){
  vec3 d = normalize(vOPos - vec3(0., 300., 0.));
  float e = d.y, hl = max(length(d.xz), 1e-4), az = d.x/hl;
  float t = uTime*.012;
  float n1 = n21(vec2(az*2.2 + t, e*5.)), n2 = n21(vec2(az*5.3 - t*1.7, e*13. + 4.)), n3 = n21(vec2(az*12.1 + t*2.3, e*31. + 9.));
  float cl = n1*.55 + n2*.3 + n3*.15;
  // stacked decks of cloud: each one dark under its belly and paler along its top
  float deck = fract(e*5.2 + cl*1.3);
  float shelf = smoothstep(0., .75, deck)*(1. - smoothstep(.9, 1., deck));
  vec3 sky = mix(uCloudLo, uCloudHi, clamp(cl*1.1 - .32 + .55*shelf, 0., 1.));
  sky = mix(sky, uCloudLo*.8, smoothstep(.3, .9, e));
  float de = e - .09;
  float rift = exp(-de*de/.0035)*exp(-az*az/.2)*(.7 + .6*n2);
  float seam = exp(-az*az/(.012 + .06*e*e))*smoothstep(.04, .16, e)*(1. - smoothstep(.3, .62, e))*(.45 + .9*n2);
  sky += uRiftCol*(rift + seam*.38)*uRiftGain;
  float sd = max(dot(d, uKeyDir), 0.), sd2 = sd*sd, sd8 = sd2*sd2; sd8 *= sd8;
  sky += uSunGlow*(sd8*sd8*sd8*sd8*2.2 + sd8*.3)*(.6 + .6*cl);
  float sh = smoothstep(.5, .8, n11(az*7. + e*3.5 - uTime*.02))*(1. - smoothstep(.05, .3, e))*smoothstep(-.03, .03, e);
  sky = mix(sky, uCloudLo*.85 + uHaze*.15, sh*.5);
  // lightning: the cloud lit from inside round one place, and a forked stroke standing in it
  vec2 lp = vec2(az + .05, e - .27);
  float lg = exp(-dot(lp, lp)/.045)*(.35 + 1.3*cl) + rift*1.5 + .12;
  float bx = az + .05 - (n11(e*23.) - .5)*.1 - (n11(e*71. + 3.) - .5)*.03;
  float bx2 = bx + (e - .2)*.55 + (n11(e*47. + 9.) - .5)*.04;
  float bolt = (1. - smoothstep(.0022, .006, abs(bx)))*smoothstep(.03, .07, e)*(1. - smoothstep(.37, .43, e))
    + .6*(1. - smoothstep(.0018, .005, abs(bx2)))*smoothstep(.07, .1, e)*(1. - smoothstep(.19, .2, e));
  sky += vec3(.82, .88, 1.)*uBolt*(lg*2.6 + bolt*16.);
  vec3 col = mix(sky, uHaze, (1. - smoothstep(.0, .2, e))*.42);
  float shore = .022 + .012*n11(az*9. + 2.) + .006*n11(az*31.);
  float land = (1. - smoothstep(shore - .003, shore + .003, e));
  col = mix(col, mix(uHaze, uGardenCol, .3), land*.8);
  float bay = 1. - smoothstep(.006, .011, e);
  col = mix(col, uBay*(.82 + .36*n21(vec2(az*30. + uTime*.15, e*700.))) + uRiftCol*uRiftGain*.12*exp(-az*az/.1), bay);
  float gm = 1. - smoothstep(-.05, -.03 + .012*n11(az*23.), e);
  col = mix(col, mix(uGardenCol, uHaze, .45)*(.8 + .4*n21(vec2(az*40., e*60.))), gm);
  gl_FragColor = vec4(col*(1. + uBolt*.5), 1.);
}`;

// palms, banana leaves and the mango crown: rain-greyed cut-outs that never stop moving.
// aData = (travel in m, phase, haze 0..1, flutter)
const VERT_PLANT = /* glsl */`
attribute vec4 aData;
varying vec3 vCol, vP; varying float vHaze;
uniform float uTimeV, uWind;
void main(){
  vCol = color; vHaze = aData.z; vP = position;
  vec3 p = position;
  float w = aData.x*uWind, ph = aData.y;
  float gust = sin(uTimeV*.9 + ph)*.6 + sin(uTimeV*2.3 + ph*1.7)*.3 + sin(uTimeV*5.3 + ph*2.9)*.2*aData.w;
  p.x += w*(.55 + gust);
  p.y -= w*.3*(.6 + .4*gust) - w*.25*aData.w*sin(uTimeV*7.1 + ph*4.3);
  gl_Position = projectionMatrix*modelViewMatrix*vec4(p, 1.);
}`;
const FRAG_PLANT = /* glsl */`
varying vec3 vCol, vP; varying float vHaze;
uniform vec3 uHazeP, uSkyCol; uniform float uFlash, uPlantGain, uHazeK;
void main(){
  // lit from the sky above, dark where the leaves hang into their own shade; veins and leaflets as fine ribbing
  float top = .62 + .6*smoothstep(-900., 2700., vP.y);
  float vein = .92 + .08*sin((vP.y*.9 + vP.x*.5)*.085) + .1*sin((vP.y*.35 - vP.x*.8)*.031);
  vec3 c = vCol*(uSkyCol*.9 + .08)*uPlantGain*top*vein;
  c = mix(c, uHazeP, clamp(vHaze*uHazeK, 0., 1.));
  gl_FragColor = vec4(c*(1. + uFlash*.4), 1.);
}`;

// rain off the eaves: silver strands broken into beads, thickened and thinned by gusts. aData.x = layer
const FRAG_CURTAIN = FRAG_HEAD + /* glsl */`
uniform float uRain; uniform vec3 uRainCol;
void main(){
  float x = vOPos.x, y = vOPos.y, lay = vData.x;
  float cx = x/mix(30., 46., lay);
  float keep = 1. - smoothstep(.22, .7, fwidth(cx));
  float ci = floor(cx), cf = fract(cx) - .5;
  float k = h11(ci*1.37 + lay*31.);
  float strand = 1. - smoothstep(.1, .4, abs(cf + (k - .5)*.4));
  float fall = y/mix(560., 900., lay) + uTime*mix(2.4, 1.1, lay)*(.7 + .6*k) + k*17.;
  float beadn = n11(fall*6.)*.6 + n11(fall*19. + 3.)*.4;
  float on = step(1. - uRain*.62, k);
  float a = mix(.16*uRain, strand*smoothstep(.3, .75, beadn)*on, keep);
  float gust = .55 + .45*sin(x*.0021 + uTime*.7 + sin(x*.0007 - uTime*.4)*2.);
  a = a*gust + .07*uRain*gust*n21(vec2(x/120., fall*1.5));
  a *= (1. - smoothstep(${(EAVE_Y - 80).toFixed(1)}, ${(EAVE_Y + 60).toFixed(1)}, y))*mix(1., .4, lay);
  vec3 c = uRainCol*a*(1. + uFlash*4.);
  gl_FragColor = vec4(mix(c, fogCol()*a*.4, fxFog()*.75), a*.4);
}`;

// blown-in rain: instanced streaks that wrap in a box round the camera, in STAGE space (so they hang still in the
// room while it turns with the viewer). aSeed = (base 0..1 xyz, k)
const VERT_RAIN = /* glsl */`
attribute vec4 aSeed;
uniform mat3 uStageInv; uniform vec3 uStagePos, uBox, uVel; uniform float uTimeV, uLen, uWid;
varying float vA; varying vec2 vUv;
void main(){
  vec3 vel = uVel*(.75 + .5*aSeed.w);
  vec3 camS = uStageInv*(cameraPosition - uStagePos);
  vec3 c = mod(aSeed.xyz*uBox + vel*uTimeV - camS + uBox*.5, uBox) - uBox*.5;
  vec4 wp = modelMatrix*vec4(camS + c, 1.);
  vec3 dir = normalize(mat3(modelMatrix)*vel);
  vec3 toCam = cameraPosition - wp.xyz;
  float dist = max(length(toCam), 1e-3);
  vec3 side = normalize(cross(dir, toCam/dist) + vec3(1e-4, 0., 0.));
  float w0 = uWid*(.6 + .8*aSeed.w), wid = max(w0, dist*.0017);
  vec3 p = wp.xyz + dir*position.y*uLen*(.6 + .8*fract(aSeed.w*7.13)) + side*position.x*wid;
  vec3 e = abs(c)/uBox;
  float open = mix(.22, 1., smoothstep(-900., 1900., camS.z + c.z));      // spray thins away from the open side
  vA = open*smoothstep(20., 80., dist)*(1. - smoothstep(.36, .5, max(e.x, max(e.y, e.z))))*min(1., w0/wid*1.6);
  vUv = vec2(position.x*2., position.y + .5);
  gl_Position = projectionMatrix*viewMatrix*vec4(p, 1.);
}`;
const FRAG_RAIN = /* glsl */`
varying float vA; varying vec2 vUv;
uniform vec3 uRainCol; uniform float uGain, uFlash;
void main(){
  float a = (1. - vUv.x*vUv.x)*sin(clamp(vUv.y, 0., 1.)*3.14159)*vA*uGain;
  gl_FragColor = vec4(uRainCol*a*(1. + uFlash*4.), a*.25);
}`;

// soft puffs (mist at the horn's mouth, spray under the roof, steam): instanced billboards.
// aBase = (xyz stage, size), aMove = (travel over one life xyz, phase), aMisc = (alpha, 1/life, growth, tint 0..1)
const VERT_PUFF = /* glsl */`
attribute vec4 aBase, aMove, aMisc;
uniform float uTimeV;
varying float vA, vSeed, vTint; varying vec2 vUv;
${FPV}
void main(){
  float ph = fract(uTimeV*aMisc.y + aMove.w);
  vec3 c = aBase.xyz + aMove.xyz*ph;
  c.x += sin(uTimeV*.7 + aMove.w*20.)*aBase.w*.12;
  c.z += sin(uTimeV*.53 + aMove.w*33.)*aBase.w*.1;
  float size = aBase.w*(1. + aMisc.z*ph);
  vec4 mvPosition = viewMatrix*(modelMatrix*vec4(c, 1.));
  float dist = -mvPosition.z;
  mvPosition.xy += position.xy*size;
  vA = aMisc.x*smoothstep(0., .2, ph)*(1. - smoothstep(.55, 1., ph))*smoothstep(size*.3, size*1.2, dist);
  // the mist at the horn's mouth (tint 2) is for the far view: it clears as the camera comes up to the rim
  vA *= mix(1., smoothstep(size*1.6, size*4.5, dist), step(1.5, aMisc.w));
  vUv = position.xy*2.; vSeed = aMove.w; vTint = aMisc.w;
  gl_Position = projectionMatrix*mvPosition;
  ${FV}
}`;
const FRAG_PUFF = /* glsl */`
varying float vA, vSeed, vTint; varying vec2 vUv;
uniform vec3 uPuffA, uPuffB, uPuffC; uniform float uTime, uFlash, uPuffGain;
float h21(vec2 p){ vec3 p3 = fract(vec3(p.xyx)*.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y)*p3.z); }
float n21(vec2 x){ vec2 i = floor(x), f = fract(x); f = f*f*(3.-2.*f);
  return mix(mix(h21(i), h21(i+vec2(1.,0.)), f.x), mix(h21(i+vec2(0.,1.)), h21(i+vec2(1.,1.)), f.x), f.y); }
${FPF}
void main(){
  float r = length(vUv);
  float n = n21(vUv*1.7 + vSeed*40. + uTime*.06)*.65 + n21(vUv*4.1 - vSeed*17. - uTime*.11)*.35;
  float a = (1. - smoothstep(.15, 1., r + (n - .5)*.7))*vA*uPuffGain;
  vec3 c = mix(mix(mix(uPuffA, uPuffB, min(vTint, 1.)), uPuffC, clamp(vTint - 1., 0., 1.)), fogCol(), fxFog()*.6);
  gl_FragColor = vec4(c*a*(1. + uFlash*2.), a);
}`;

// coronets where drops land on the deck and the cloth: instanced flat rings. aSplash = (xyz stage, seed)
const VERT_SPLASH = /* glsl */`
attribute vec4 aSplash;
uniform float uTimeV, uSize;
varying float vPh; varying vec2 vUv;
float hh(float n){ return fract(sin(n)*43758.5453); }
void main(){
  float k = aSplash.w, per = 1.1 + 1.7*fract(k*7.3);
  float tt = uTimeV/per + k*13.;
  float ph = fract(tt), cyc = floor(tt);
  vec2 j = (vec2(hh(cyc + k*91.), hh(cyc*1.7 + k*37.)) - .5)*24.;
  float R = uSize*(.25 + 1.1*sqrt(ph))*(.6 + .8*fract(k*3.1));
  vec3 p = aSplash.xyz + vec3(j.x, 0., j.y) + vec3(position.x, 0., position.z)*R;
  vPh = ph; vUv = position.xz;
  gl_Position = projectionMatrix*modelViewMatrix*vec4(p, 1.);
}`;
const FRAG_SPLASH = /* glsl */`
varying float vPh; varying vec2 vUv;
uniform vec3 uRainCol; uniform float uGain, uFlash;
void main(){
  float r = length(vUv), a0 = atan(vUv.y, vUv.x + 1e-4);
  float q = (r - .78)/.1, k = 1. - vPh;
  float ring = exp(-q*q)*k*k*(.7 + .3*sin(a0*11.));
  float core = exp(-r*r*30.)*(1. - smoothstep(0., .25, vPh));
  gl_FragColor = vec4(uRainCol*(ring + core)*uGain*(1. + uFlash*4.), 1.);
}`;

// fireflies of the blue dusk. aFly = (xyz stage, seed)
const VERT_FLY = /* glsl */`
attribute vec4 aFly;
uniform float uTimeV, uFlyK;
varying float vB; varying vec2 vUv;
void main(){
  float s = aFly.w;
  vec3 c = aFly.xyz + vec3(sin(uTimeV*.31 + s*40.)*150., sin(uTimeV*.47 + s*17.)*70., cos(uTimeV*.39 + s*29.)*150.);
  float b = max(sin(uTimeV*(.7 + s) + s*50.), 0.); vB = b*b*(.55 + .45*b);
  vec4 mv = viewMatrix*(modelMatrix*vec4(c, 1.));
  float size = max(34., -mv.z*.034)*uFlyK;
  mv.xy += position.xy*size;
  vUv = position.xy*2.;
  gl_Position = projectionMatrix*mv;
}`;
const FRAG_FLY = /* glsl */`
varying float vB; varying vec2 vUv;
uniform vec3 uFlyCol; uniform float uFlyK;
void main(){
  float r2 = dot(vUv, vUv);
  gl_FragColor = vec4(uFlyCol*(exp(-r2*4.)*.34 + exp(-r2*18.)*1.7*uFlyK)*vB*(1. - smoothstep(.6, 1., r2)), 1.);
}`;

// drops drawn down the bore toward the portal: instanced streaks in STAGE space that swirl a little, crowd toward
// the axis as the bore narrows and brighten as they near the collar. aSeed = (angle 0..1, radius 0..1, phase, k)
const VERT_STREAM = /* glsl */`
attribute vec4 aSeed;
uniform vec3 uThroat, uHornAxis, uHX, uHY; uniform float uTimeV, uAx0, uAx1, uStream;
varying float vA; varying vec2 vUv;
float bore(float ax){ float t = clamp(ax/220.4, 0., 1.); return 9. + 116.*(.2*t + .8*pow(t, 3.1)); }
vec3 at(float ax, float an, float fr){ return uThroat + uHornAxis*ax + bore(ax)*fr*(cos(an)*uHX + sin(an)*uHY); }
void main(){
  float k = aSeed.w;
  float ph = fract(aSeed.z + uTimeV*(.34 + .26*k));                 // 0 out before the mouth .. 1 at the collar
  float ax = mix(uAx1, uAx0, ph), fr = .14 + .62*aSeed.y;
  float an = aSeed.x*6.2831853 + ph*(1.2 + 1.6*k);
  vec3 c0 = at(ax, an, fr), c1 = at(ax - 5., an + .03*(1.2 + 1.6*k), fr);
  vec4 wp = modelMatrix*vec4(c0, 1.);
  vec3 dir = normalize(mat3(modelMatrix)*(c1 - c0));
  vec3 toCam = cameraPosition - wp.xyz;
  float dist = max(length(toCam), 1e-3);
  vec3 side = normalize(cross(dir, toCam/dist) + vec3(1e-4, 0., 0.));
  float w0 = .22 + .3*k, wid = max(w0, dist*.0019);
  vec3 p = wp.xyz + dir*position.y*(5. + 9.*fract(k*7.13)) + side*position.x*wid;
  vA = uStream*smoothstep(0., .1, ph)*(1. - smoothstep(.95, 1., ph))*smoothstep(5., 26., dist)*min(1., w0/wid*2.2)*(.3 + 1.1*ph*ph);
  vUv = vec2(position.x*2., position.y + .5);
  gl_Position = projectionMatrix*viewMatrix*vec4(p, 1.);
}`;

// mist drawn down the horn in slow spiral threads. aData = (angle 0..1, depth s)
const FRAG_SPIRAL = /* glsl */`
varying vec3 vWPos, vWNrm, vCol, vOPos; varying vec4 vData;
uniform vec3 uMistCol; uniform float uTime, uFlash, uMistGain, uThin;
float h21(vec2 p){ vec3 p3 = fract(vec3(p.xyx)*.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y)*p3.z); }
float n21(vec2 x){ vec2 i = floor(x), f = fract(x); f = f*f*(3.-2.*f);
  return mix(mix(h21(i), h21(i+vec2(1.,0.)), f.x), mix(h21(i+vec2(0.,1.)), h21(i+vec2(1.,1.)), f.x), f.y); }
void main(){
  float s = vData.y, a = vData.x*6.2831853;
  float t1 = sin(a*3. + s*16. + uTime*.5), t2 = sin(a*2. - s*11. - uTime*.35 + 2.);
  float thr = mix(smoothstep(.7, 1., t1)*.7 + smoothstep(.8, 1., t2)*.5, pow(max(t1, 0.), 36.)*.8 + pow(max(t2, 0.), 48.)*.6, uThin);
  float n = n21(vec2(sin(a)*2.2 + s*9., cos(a)*2.2 - uTime*.2));
  // by day the threads live deep in the bore and only at a distance, where they stay thin on screen
  float fade = mix(smoothstep(.16, .5, s)*(1. - smoothstep(.8, 1.02, s)), smoothstep(.16, .36, s)*(1. - smoothstep(.5, .8, s)), uThin);
  float dist = length(cameraPosition - vWPos);
  float al = thr*(.35 + .65*n)*fade*mix(smoothstep(8., 45., dist), smoothstep(35., 130., dist), uThin)*uMistGain;
  gl_FragColor = vec4(uMistCol*al*(1. + uFlash*2.), 1.);
}`;

// the hummingbird's wings: on each side a pale translucent fan with soft edges, the blur of one beat. Inside it the
// feather tips smear into fine arcs, the wing lingers where it turns at either end of the stroke, and two or three
// ghosts of the blade itself flicker through. aData = (radius 0..1, angle -1..1)
const FRAG_WING = /* glsl */`
varying vec3 vWPos, vWNrm, vCol, vOPos; varying vec4 vData;
uniform vec3 uWingCol; uniform float uTime, uFlash;
float gs(float x){ return exp(-x*x); }
void main(){
  float r = vData.x, an = vData.y;
  float tipR = .98 - .2*an*an;
  float shape = smoothstep(0., .08, r)*(1. - smoothstep(tipR - .12, tipR, r))*(1. - smoothstep(.78, 1., abs(an)));
  // the blur: feather tips smeared into fine arcs, brightest along the rim of the fan and where the wing turns
  float arcs = .75 + .25*sin(r*46.);
  float rimArc = gs((r - tipR + .15)/.07), ends = gs((abs(an) - .8)/.15);
  float veil = shape*(.2*arcs + .22*rimArc + .16*ends);
  // ghosts of the wing itself, dark and tapered, caught two or three times in the beat
  float bw = .05 + .1*sin(3.14159*clamp(r*1.05, 0., 1.));
  float b1 = 1. - smoothstep(bw*.55, bw, abs(an - .78*sin(uTime*38.)));
  float b2 = 1. - smoothstep(bw*.55, bw, abs(an + .78*sin(uTime*38. + 1.9)));
  float b3 = 1. - smoothstep(bw*.55, bw, abs(an - .9*sin(uTime*61. + .7)));
  float blade = shape*clamp(.5*b1 + .38*b2 + .26*b3, 0., .75);
  vec3 dark = vec3(.03, .05, .12)*(.5 + uWingCol.b);
  gl_FragColor = vec4((uWingCol*vCol*veil + dark*blade)*(1. + uFlash*2.), clamp(veil*.9 + blade, 0., .9));
}`;

// the drip's coronet: a crown of water thrown up where the drop lands, its beads flung out, a ring running away over
// the shellac and the bead that is left. All of it is shaped here from one phase, uCor 0..1.
// aData = (angle, v, kind: 0 crown wall, 1 flung bead, 2 ring, 3 the bead left behind, seed)
const VERT_CORONET = /* glsl */`
attribute vec4 aData;
uniform float uCor;
varying vec3 vWPos, vWNrm; varying float vA;
${FPV}
void main(){
  float a = aData.x, v = aData.y, kind = aData.z, sd = aData.w, c = uCor;
  vec3 rad = vec3(cos(a), 0., sin(a));
  float R = 3. + 10.*sqrt(c);
  float rise = sin(3.14159*clamp(c*1.3, 0., 1.));
  vec3 p, n; float al;
  if(kind < .5){
    float spike = .5 + .5*cos(a*11.); spike = spike*(.4 + .6*spike);
    float h = 11.5*rise*(.62 + .38*spike*smoothstep(.4, 1., v));
    p = rad*(R + .55*h*v*v) + vec3(0., h*v, 0.);
    n = normalize(rad + vec3(0., .9*v - .45, 0.));
    al = sqrt(max(rise, 0.))*(.22 + .78*v*v);
  } else if(kind < 1.5){
    float tt = clamp((c - .1)/.9, 0., 1.), sp = .7 + .6*sd;
    float y = 34.*sp*tt - 38.*tt*tt;
    float sz = (.7 + .9*sd)*smoothstep(0., .08, tt)*step(0., y);
    p = rad*(R*.9 + 16.*tt*sp) + vec3(0., y + 1., 0.) + position*sz;
    n = position;
    al = 1.;
  } else if(kind < 2.5){
    float rr = 4. + 30.*c + (v - .5)*(2.6 + 3.5*c);
    p = rad*rr + vec3(0., .12, 0.);
    n = normalize(vec3(rad.x*(v - .5)*1.6, 1., rad.z*(v - .5)*1.6));
    al = (1. - c)*(1. - c)*(1. - abs(v*2. - 1.))*1.4;
  } else {
    float g = smoothstep(.3, .75, c);
    p = position*vec3(2.7, 1.7, 2.7)*g;
    n = normalize(position + vec3(0., .2, 0.));
    al = g;
  }
  vA = al;
  vec4 wp = modelMatrix*vec4(p, 1.);
  vWPos = wp.xyz; vWNrm = mat3(modelMatrix)*n;
  vec4 mvPosition = viewMatrix*wp;
  gl_Position = projectionMatrix*mvPosition;
  ${FV}
}`;
const FRAG_CORONET = /* glsl */`
varying vec3 vWPos, vWNrm; varying float vA;
${GLSL_ROOM}
${FPF}
void main(){
  vec3 N = normalize(vWNrm + vec3(0., 1e-4, 0.));
  if(!gl_FrontFacing) N = -N;
  vec3 V = normalize(cameraPosition - vWPos);
  vec3 Ns = normalize(uStageInv*N), Vs = normalize(uStageInv*V);
  float ndv = max(dot(Ns, Vs), 0.);
  float fr = 1. - ndv; fr = fr*fr*(.35 + .65*fr);
  // water: it mirrors the opening on its glancing edges and gathers one hard glint of the sky
  vec3 env = roomEnv(reflect(-Vs, Ns), .05);
  vec3 Lk = normalize(vec3(uKeyDir.x*.5, .35, max(uKeyDir.z, .2) + .6));
  float sp = max(dot(Ns, normalize(Lk + Vs)), 0.); sp *= sp; sp *= sp; sp *= sp; sp *= sp; sp *= sp;
  vec3 col = env*(.2 + .8*fr) + uSkyCol*.03 + (uSkyCol + uRiftCol*.4)*sp*2.6;
  float a = clamp(vA*(.13 + .75*fr + sp), 0., .9);
  gl_FragColor = vec4(mix(col, fogCol(), fxFog())*a*(1. + uFlash*3.), a);
}`;

// ---------------------------------------------------------------- geometry helpers
// colour + aData on a three.js geometry so that it merges with the part's grid / lathe / tube output
function dress(g, color, data) {
  g.deleteAttribute('uv');
  const pos = g.attributes.position, n = pos.count, col = new Float32Array(n * 3), dat = new Float32Array(n * 4), o = [0, 0, 0, 0];
  for (let i = 0; i < n; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const c = typeof color === 'function' ? color(x, y, z) : color;
    col[i * 3] = c[0]; col[i * 3 + 1] = c[1]; col[i * 3 + 2] = c[2];
    if (typeof data === 'function') { o[0] = o[1] = o[2] = o[3] = 0; data(x, y, z, o); dat.set(o, i * 4); } else if (data) dat.set(data, i * 4);
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setAttribute('aData', new THREE.BufferAttribute(dat, 4));
  return g;
}
const boxG = (w, h, d, x, y, z, color, data) => dress(new THREE.BoxGeometry(w, h, d).translate(x, y, z), color, data);
// a flat quad strip between two rails of points (ribbons, fronds, straps); colour and data per vertex via fn(t, side, o)
function ribbon(nSeg, fn) {
  return grid(1, nSeg, false, (u, v, o) => fn(v, u, o));
}
// instanced unit quad in the XY plane (billboards) or XZ plane (flat rings)
function quadInstances(count, name, itemSize, fill, flat = false, more = null) {
  const g = new THREE.InstancedBufferGeometry();
  const p = flat ? [-1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1] : [-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0];
  g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
  g.setIndex(flat ? [0, 2, 1, 0, 3, 2] : [0, 1, 2, 0, 2, 3]);
  const names = Array.isArray(name) ? name : [name], arrs = names.map(() => new Float32Array(count * itemSize));
  const o = names.map(() => new Float32Array(itemSize));
  for (let i = 0; i < count; i++) { fill(i, ...o); for (let k = 0; k < names.length; k++) arrs[k].set(o[k], i * itemSize); }
  for (let k = 0; k < names.length; k++) g.setAttribute(names[k], new THREE.InstancedBufferAttribute(arrs[k], itemSize));
  g.instanceCount = count;
  if (more) more(g);
  return g;
}

// ---------------------------------------------------------------- the veranda's solid furniture (one merged mesh)
const POSTS = [-3300, -1300, 700, 2700];
async function buildSetGeometry(R) {
  const parts = [], n = R.noise;
  const lime = (k = 1) => (x, y, z) => mul(R.lime, k * (0.86 + 0.2 * n.n3(x * 0.004, y * 0.004, z * 0.004)));
  const wood = (k = 1) => (x, y, z) => mul(R.darkWood, k * (0.8 + 0.4 * n.n3(x * 0.003, y * 0.01, z * 0.003)));
  const iron = [0.035, 0.04, 0.045];
  // balustrade: plinth, turned balusters, moulded rail
  const zB = FRONT_Z - 100;
  const balProf = [[0, 220], [62, 220], [62, 172], [40, 150], [34, 96], [46, 20], [78, -150], [92, -300], [80, -430], [48, -540], [36, -600], [52, -640], [70, -662], [70, -780], [0, -780]];
  const bal = lathe(balProf, { seg: 10, color: (v, th, y) => mul(R.lime, 0.8 + 0.25 * Math.sin(th * 2 + y * 0.01) * 0.3 + 0.1), data: (v, th, y, d) => { d[0] = 0.25; d[1] = 0.35 * (1 - smoothstep(-780, -500, y)) + 0.25 * smoothstep(120, 220, y); d[3] = 1; } });
  await R.tick();
  for (let x = END_L + 95; x < END_R; x += 190) {
    if (POSTS.some((px) => Math.abs(px - x) < 150)) continue;
    const g = bal.clone(); g.rotateY(x * 0.37); g.translate(x, 0, zB); parts.push(g);
  }
  bal.dispose();
  await R.tick();
  const L = END_R - END_L, cx = (END_L + END_R) / 2;
  const shadeLow = (x, y, z, d) => { d[0] = 0.3; d[1] = 0.3 * (1 - smoothstep(FLOOR_Y, FLOOR_Y + 160, y)); d[3] = 1; };
  parts.push(boxG(L, 120, 260, cx, FLOOR_Y + 60, zB, lime(0.9), shadeLow));
  parts.push(boxG(L, 36, 210, cx, 206, zB, lime(0.85), [0.3, 0.25, 0, 1]));
  parts.push(boxG(L, 80, 290, cx, RAIL_Y - 40, zB, lime(1.05), [0.45, 0, 0, 1]));
  await R.tick();
  // posts up to the eave beam
  const postProf = [[0, EAVE_Y], [150, EAVE_Y], [165, EAVE_Y - 30], [165, EAVE_Y - 110], [128, EAVE_Y - 150], [112, EAVE_Y - 190], [112, RAIL_Y + 240], [128, RAIL_Y + 200], [150, RAIL_Y + 170], [150, FLOOR_Y + 10], [0, FLOOR_Y + 10]];
  for (const x of POSTS) parts.push(lathe(postProf, { seg: 16, sq: 9, color: (v, th, y) => mul(R.lime, 0.85 + 0.12 * n.n2(th * 2, y * 0.004) - 0.2 * smoothstep(EAVE_Y - 500, EAVE_Y, y)), data: [0.25, 0, 0, 1] }).translate(x, 0, zB));
  parts.push(boxG(L + 200, 170, 300, cx, EAVE_Y + 85, zB, wood(1.3), [0.15, 0.2, 0, 0]));
  parts.push(boxG(L + 200, 190, 40, cx, EAVE_Y + 10, FRONT_Z + 130, wood(1.6), [0.2, 0, 0, 0]));
  await R.tick();
  // rafters down the slope of the roof
  const slope = Math.atan2(RIDGE_Y - (EAVE_Y + 30), FRONT_Z + 200 - WALL_Z), rl = Math.hypot(RIDGE_Y - EAVE_Y - 30, FRONT_Z + 200 - WALL_Z);
  for (let x = END_L + 150; x < END_R; x += 420) {
    const g = new THREE.BoxGeometry(76, 140, rl); g.rotateX(slope); g.translate(x, (RIDGE_Y + EAVE_Y + 30) / 2 - 85, (WALL_Z + FRONT_Z + 200) / 2);
    parts.push(dress(g, wood(1), [0.1, 0.15, 0, 0]));
  }
  await R.tick();
  // the table's pedestal, down to the tiles
  parts.push(lathe([[0, -16], [330, -16], [300, -60], [150, -110], [95, -200], [120, -330], [170, -420], [120, -520], [85, -640], [120, -760], [260, -830], [300, -900], [0, -900]],
    { seg: 24, color: (v, th, y) => mul(R.darkWood, 1.5 + 0.5 * n.n2(th * 3, y * 0.02)), data: (v, th, y, d) => { d[0] = 0.4; d[1] = 0.5 * smoothstep(-300, -20, y); } }));
  // fern pots on the rail
  for (const x of R.fernX) parts.push(lathe([[0, 250], [140, 250], [172, 262], [176, 240], [160, 222], [128, 30], [138, 0], [0, 0]],
    { seg: 16, color: (v, th, y) => mul(R.clay, 0.8 + 0.3 * n.n2(th * 2 + x, y * 0.02)), data: [0.2, 0, 0, 0] }).translate(x, RAIL_Y, zB));
  await R.tick();
  // the parrot's cage: hung low from a rafter on a long chain, a domed cage of white-enamelled wire with a door,
  // a tray, two cups, a swing and a perch
  const C = R.cage, K = R.cageK, cr = 125 * K, y0 = C.y - 120 * K, y1 = C.y + 120 * K, yDome = y1 + 128 * K, yHook = yDome + 70;
  const enamel = (k = 1) => [0.6 * k, 0.62 * k, 0.6 * k], wireD = [0.55, 0.15, 0, 0], sd = R.cageSide;
  {
    const yRoof = RIDGE_Y - (C.z - WALL_Z) * Math.tan(slope) - 150, nL = Math.round((yRoof - yHook) / 44);
    parts.push(lathe([[0, 0], [46, 0], [52, -14], [30, -30], [12, -44], [0, -46]], { seg: 10, color: () => mul(iron, 1.5), data: [0.5, 0, 0, 0] }).translate(C.x, yRoof + 6, C.z));
    for (let i = 0; i < nL; i++) {
      const g = new THREE.TorusGeometry(15, 4.6, 5, 10).scale(0.62, 1.5, 1); g.rotateY(i % 2 ? Math.PI / 2 : 0); g.translate(C.x, yHook + 12 + (i + 0.5) * ((yRoof - yHook - 50) / nL), C.z);
      parts.push(dress(g, mul(iron, 1.5 + 0.5 * (i % 2)), [0.6, 0, 0, 0]));
      if ((i & 7) === 7) await R.tick();
    }
    await R.tick();
  }
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * TAU, c = Math.cos(a), sn = Math.sin(a);
    parts.push(tube([[C.x + c * cr, y0, C.z + sn * cr], [C.x + c * cr, y1, C.z + sn * cr], [C.x + c * cr * 0.84, y1 + 74 * K, C.z + sn * cr * 0.84], [C.x + c * cr * 0.45, y1 + 116 * K, C.z + sn * cr * 0.45], [C.x, yDome, C.z]],
      () => 6.2, { along: 10, around: 5, color: () => enamel(0.9 + 0.2 * (i % 2)), data: wireD }));
    if (i % 5 === 4) await R.tick();
  }
  await R.tick();
  for (const [yy, rr, tk] of [[y0, cr, 12], [C.y - 40 * K, cr, 6.5], [C.y + 44 * K, cr, 6.5], [y1, cr, 10], [y1 + 74 * K, cr * 0.84, 6]]) parts.push(dress(new THREE.TorusGeometry(rr, tk, 6, 32).rotateX(Math.PI / 2).translate(C.x, yy, C.z), enamel(1), wireD));
  await R.tick();
  parts.push(lathe([[0, y0 + 6], [cr - 6, y0 + 6], [cr + 6, y0 + 14], [cr + 16, y0], [cr + 12, y0 - 26], [cr * 0.5, y0 - 40], [0, y0 - 44]], { seg: 24, color: (v) => (v < 0.2 ? [0.3, 0.27, 0.2] : enamel(0.8)), data: [0.4, 0.2, 0, 0] }).translate(C.x, 0, C.z));
  parts.push(lathe([[0, yHook], [9, yHook - 6], [15, yHook - 30], [9, yDome + 10], [22, yDome + 2], [26, yDome - 14], [0, yDome - 20]], { seg: 10, color: () => enamel(0.9), data: wireD }).translate(C.x, 0, C.z));
  await R.tick();
  // perch right across, a swing in the dome, a seed cup and a water cup on the wire
  parts.push(tube([[C.x - sd.x * cr, C.y - 50 * K, C.z - sd.z * cr], [C.x, C.y - 50 * K, C.z], [C.x + sd.x * cr, C.y - 50 * K, C.z + sd.z * cr]], () => 9, { along: 2, around: 7, color: () => mul(R.darkWood, 3.2), data: [0.1, 0, 0, 0] }));
  parts.push(tube([[C.x - 52, y1 + 100 * K, C.z + 30], [C.x - 56, y1 + 6 * K, C.z + 30], [C.x, y1 - 6 * K, C.z + 30], [C.x + 56, y1 + 6 * K, C.z + 30], [C.x + 52, y1 + 100 * K, C.z + 30]], () => 4.5, { along: 14, around: 5, color: () => enamel(0.8), data: wireD }));
  for (const [sx, col] of [[-1, [0.5, 0.36, 0.14]], [1, [0.2, 0.3, 0.42]]]) parts.push(lathe([[30, 44], [34, 46], [36, 40], [30, 4], [0, 0]], { seg: 10, color: () => col, data: [0.6, 0.2, 0, 0] }).translate(C.x + sx * (cr - 26), y0 + 30, C.z + 70));
  await R.tick();
  // the cage door: a small arched frame of heavier wire on the side that faces the room
  { const da = Math.atan2(R.cageSide.x, -R.cageSide.z) + 0.2, dc = Math.cos(da), ds = Math.sin(da), tx = -ds, tz = dc, rr = cr + 5;
    parts.push(tube([[-48, y0 + 20], [-48, C.y + 30 * K], [-30, C.y + 62 * K], [0, C.y + 74 * K], [30, C.y + 62 * K], [48, C.y + 30 * K], [48, y0 + 20]].map(([t, y]) => [C.x + dc * rr + tx * t, y, C.z + ds * rr + tz * t]), () => 8.5, { along: 18, around: 5, color: () => enamel(1.1), data: wireD })); }
  await R.tick();
  // the fan's rod and motor
  const F = R.fan, roofAt = RIDGE_Y - (F.z - WALL_Z) * Math.tan(slope) - 150;
  parts.push(tube([[F.x, roofAt, F.z], [F.x, (roofAt + F.y) / 2, F.z], [F.x, F.y + 60, F.z]], () => 16, { along: 2, around: 8, color: () => mul(R.brass, 0.5), data: [0.6, 0, 0, 0] }));
  parts.push(lathe([[0, 150], [40, 150], [60, 110], [120, 70], [135, 20], [120, -30], [60, -60], [26, -90], [0, -100]], { seg: 18, color: (v, th, y) => mul(R.brass, 0.45 + 0.1 * Math.sin(y * 0.2)), data: [0.7, 0, 0, 0] }).translate(F.x, F.y, F.z));
  parts.push(lathe([[0, 40], [70, 40], [90, 0], [60, -30], [0, -30]], { seg: 14, color: () => mul(R.brass, 0.4), data: [0.6, 0, 0, 0] }).translate(F.x, roofAt, F.z));
  // hammock hooks: iron rings on the wall and on the front post
  for (const hz of [R.ham.z0, R.ham.z1]) parts.push(dress(new THREE.TorusGeometry(46, 11, 6, 14).rotateY(Math.PI / 2).translate(R.ham.x, R.ham.y + 20, hz), iron, [0.5, 0, 0, 0]));
  await R.tick();
  return merge(parts);
}

// things on the lace cloth round the machine: spare records in blank sleeves, an open tin of needles, a coffee cup,
// one fallen frangipani flower holding beads of water
async function buildTableProps(R) {
  const parts = [], n = R.noise, rng = R.rng;
  const paper = (k) => (x, y, z) => mul([0.52, 0.5, 0.44], k * (0.85 + 0.2 * n.n2(x * 0.02, z * 0.02)));
  // record stack
  const S = R.props.stack;
  for (let i = 0; i < 5; i++) {
    const g = new THREE.BoxGeometry(292, 5, 292, 4, 1, 4); g.rotateY((rng() - 0.5) * 0.24); g.translate(S.x + (rng() - 0.5) * 22, 3 + i * 6.5, S.z + (rng() - 0.5) * 22);
    parts.push(dress(g, paper(0.78 + 0.08 * i + 0.1 * rng()), [0.12, i === 0 ? 0.3 : 0.1, 0, 0]));
  }
  const top = 3 + 5 * 6.5;
  parts.push(lathe([[0, 2], [44, 2], [44, 2.4], [60, 2.4], [148, 2.4], [150, 1.4], [150, 0]], { seg: 48, color: (v, th, y) => (v < 0.2 ? lin(R.labelHex) : [0.012, 0.012, 0.015]), data: (v, th, y, d) => { d[0] = v < 0.2 ? 0.2 : 0.95; } })
    .translate(S.x - 46, top, S.z + 38));
  { const g = new THREE.BoxGeometry(292, 4, 292, 4, 1, 4); g.rotateY(0.3); g.translate(S.x + 34, top + 4.5, S.z - 30); parts.push(dress(g, paper(1.0), [0.15, 0, 0, 0])); }
  { // the top sleeve: the round window that shows the label, a printed double rule, a dog-eared corner
    const cx = S.x + 34, cz = S.z - 30, y = top + 6.6, ink = [0.16, 0.13, 0.1];
    parts.push(lathe([[0, 0.5], [40, 0.5], [40, 0.5], [45, 0.5], [45, 0.5], [47.5, 0.7], [47.5, 0]], { seg: 40, color: (v) => (v < 0.3 ? lin(R.labelHex) : v < 0.6 ? [0.012, 0.012, 0.015] : mul(ink, 2)), data: (v, th, yy, d) => { d[0] = v < 0.6 ? 0.5 : 0.1; } }).translate(cx, y - 0.4, cz));
    for (const [hw, w] of [[128, 3.2], [118, 1.4]]) for (let k = 0; k < 4; k++) {
      const g = new THREE.BoxGeometry(hw * 2 + w, 0.4, w); g.translate(0, 0, hw); g.rotateY(k * Math.PI / 2 + 0.3); g.translate(cx, y, cz);
      parts.push(dress(g, ink, [0.1, 0, 0, 0]));
    }
    for (let k = 0; k < 4; k++) { const g = new THREE.BoxGeometry(46, 0.4, 2.2); g.translate(0, 0, 70 + (k % 2) * 8); g.rotateY(k * Math.PI / 2 + 0.3); g.translate(cx, y, cz); parts.push(dress(g, ink, [0.1, 0, 0, 0])); }
  }
  await R.tick();
  // needle tin: body, lid leaning on it, needles
  const T = R.props.tin, tinC = (v, th, y) => mul(R.brass, 0.75 + 0.2 * Math.sin(th * 3 + y));
  parts.push(lathe([[52, 26], [56, 28], [58, 26], [58, 2], [55, 0], [0, 0]], { seg: 28, color: tinC, data: [0.8, 0, 0, 0] }).translate(T.x, 0.5, T.z));
  parts.push(lathe([[0, 3.5], [52, 3.5], [52, 26]], { seg: 28, color: () => [0.08, 0.07, 0.06], data: [0.4, 0.3, 0, 0] }).translate(T.x, 0.5, T.z));
  parts.push(place(lathe([[0, 9], [57, 9], [60, 7], [60, 0], [0, 0]], { seg: 28, color: (v, th, y) => (v < 0.3 ? lin(R.labelHex) : mul(R.brass, 0.8)), data: [0.75, 0, 0, 0] }), V3(T.x + 78, 30, T.z + 20), V3(-0.72, 0.62, -0.2)));
  for (let i = 0; i < 16; i++) {
    const a = rng() * TAU, r = rng() * 36, tilt = V3(Math.cos(a * 3.1), 0.12 + 0.2 * rng(), Math.sin(a * 3.1));
    parts.push(place(lathe([[0, 14], [1.3, 13.6], [1.3, 5], [0.9, 2], [0.15, 0]], { seg: 6, color: () => [0.6, 0.62, 0.62], data: [0.9, 0, 0, 0] }), V3(T.x + Math.cos(a) * r - tilt.x * 7, 5 + rng() * 3, T.z + Math.sin(a) * r - tilt.z * 7), tilt));
  }
  await R.tick();
  // coffee cup and saucer
  const K = R.props.cup, porcelain = (v, th, y) => (y > 44 && y < 54 ? mul(lin(PALETTE[4]), 0.9) : mul([0.62, 0.64, 0.62], 0.92 + 0.08 * Math.sin(th * 5)));
  parts.push(lathe([[30, 6], [58, 7], [84, 14], [88, 15], [86, 11], [60, 2], [34, 0], [0, 0]], { seg: 36, color: porcelain, data: [0.85, 0, 0, 0] }).translate(K.x, 0.5, K.z));
  parts.push(lathe([[41, 68], [43.5, 70], [45, 68], [44, 50], [40, 28], [31, 13], [24, 8], [22, 6], [0, 6]], { seg: 36, color: porcelain, data: [0.85, 0, 0, 0] }).translate(K.x, 0.5, K.z));
  parts.push(lathe([[41, 68], [39, 46], [33, 24], [22, 12], [0, 10]].reverse().map((p) => [p[0], p[1]]), { seg: 36, color: () => [0.6, 0.6, 0.56], data: [0.6, 0.35, 0, 0] }).translate(K.x, 0.5, K.z));
  parts.push(lathe([[0, 57], [39.5, 57]], { seg: 28, color: (v) => mixc([0.05, 0.022, 0.01], [0.16, 0.08, 0.035], v * v), data: [0.95, 0, 0, 0] }).translate(K.x, 0.5, K.z));
  parts.push(tube([[K.x - 43, 58, K.z], [K.x - 62, 60, K.z], [K.x - 72, 44, K.z], [K.x - 62, 26, K.z], [K.x - 38, 24, K.z]], () => 4.6, { along: 14, around: 8, color: () => [0.6, 0.62, 0.6], data: [0.85, 0, 0, 0] }));
  await R.tick();
  // frangipani: five overlapping petals, cream running to a brass-yellow heart, beads of water
  const Fp = R.props.flower;
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * TAU + 0.3, ca = Math.cos(a), sa = Math.sin(a);
    parts.push(grid(6, 8, false, (u, v, o) => {
      const w = 15 * Math.sin(Math.PI * Math.pow(v, 0.8)) * (0.25 + 0.75 * v) + 1.5, lx = (u - 0.5) * 2 * w + 5 * v, lz = 3 + v * 29;
      const yy = 2.2 + 5.5 * v * v + 2.4 * (u - 0.5) * (u - 0.5) * 4 * v + (u - 0.5) * 4;
      o.p[0] = Fp.x + ca * lz - sa * lx; o.p[1] = yy; o.p[2] = Fp.z + sa * lz + ca * lx;
      const c = mixc([0.78, 0.52, 0.12], [0.8, 0.77, 0.66], smoothstep(0.1, 0.62, v + 0.25 * (u - 0.5)));
      o.c[0] = c[0]; o.c[1] = c[1]; o.c[2] = c[2]; o.d[0] = 0.35; o.d[1] = 0.25 * (1 - v);
    }));
    const br = 14 + 12 * rng(), ba = a + (rng() - 0.3) * 0.5;
    parts.push(dress(new THREE.SphereGeometry(1.6 + 1.6 * rng(), 8, 5).scale(1, 0.6, 1).translate(Fp.x + Math.cos(ba) * br, 5.4 + br * br * 0.0058, Fp.z + Math.sin(ba) * br), [0.62, 0.66, 0.68], [1, 0, 0, 0]));
  }
  await R.tick();
  return merge(parts);
}

// flat quad from four corners (a, b along the bottom; c, d above b, a), tessellated nu x nv, with fixed aData
function quadG(a, b, c, d, data, nu = 1, nv = 1) {
  return grid(nu, nv, false, (u, v, o) => {
    for (let k = 0; k < 3; k++) { const lo = a[k] + (b[k] - a[k]) * u, hi = d[k] + (c[k] - d[k]) * u; o.p[k] = lo + (hi - lo) * v; }
    o.d[0] = data[0]; o.d[1] = data[1]; o.d[2] = data[2]; o.d[3] = data[3];
  });
}

// the white cotton hammock (a Bahian rede): local X runs hook to hook, it swings about that axis. v 0 is the edge
// toward the wall, v 1 the edge toward the room, which hangs lower: someone has just slid out over it, so the
// hollow where they lay is open to the viewer. Long clew cords fan from the hooks to the gathered ends.
async function buildHammockGeometry(R, Lh) {
  const parts = [], sag = R.ham.sag, half = Lh / 2, ext = 0.28 * Lh, n = R.noise;
  const white = [0.78, 0.76, 0.68], dye = R.hamStriped ? [0.05, 0.075, 0.22] : [0.1, 0.17, 0.37];
  const P = (u, v, out) => {
    const x = (u * 2 - 1) * ext, k = 1 - (x / half) * (x / half), su = Math.sin(Math.PI * u), W = lerp(340, 900, Math.pow(su, 0.6)), s = v * 2 - 1;
    const lay = Math.exp(-(((u - 0.46) / 0.2) ** 2));
    out[0] = x; out[2] = s * W * 0.5 * (1 - 0.12 * s * s);
    // both long edges hang as slack lines between the clews (lowest in the middle), the cloth hangs below them, and
    // the edge toward the room lies lower than the far one, so the eye looks over it into the hollow
    out[1] = -sag * k + (175 + 85 * su) * s * s - 125 * su * s - 120 * lay * (1 - s * s) - 70 * lay * smoothstep(0.25, 1, s)
      + 16 * Math.sin(s * 10 + u * 4 + 1.5 * Math.sin(u * 5)) * (1 - 0.5 * su) + 6 * Math.sin(u * 37 + s * 3) * (1 - s * s);
    return out;
  };
  const NU = 56, NV = 40;
  parts.push(grid(NU, NV, false, (u, v, o, i, j) => {
    P(u, v, o.p);
    const s = v * 2 - 1, su = Math.sin(Math.PI * u), lay = Math.exp(-(((u - 0.46) / 0.2) ** 2));
    const stripe = R.hamStriped ? (j % 4 < 2 ? 1 : 0) : ((j >= 8 && j <= 10) || (j >= 30 && j <= 32) ? 1 : j === 12 || j === 28 ? 0.6 : 0);
    const fold = Math.sin(s * 10 + u * 4 + 1.5 * Math.sin(u * 5)) * 0.6 + Math.sin(s * 19 - u * 3 + 2) * 0.4;
    const weave = 0.88 + 0.12 * n.n2(u * 60, v * 14) - 0.06 * Math.abs(Math.sin(u * 170)) + 0.17 * fold * (0.45 + 0.55 * su);
    const c = mul(mixc(white, dye, stripe * 0.88), weave);
    o.c[0] = c[0]; o.c[1] = c[1]; o.c[2] = c[2];
    // shade baked into the cloth: the hollow, the dent where someone lay, the gathers at the ends, the valance's shadow
    o.d[0] = 0.04; o.d[1] = clamp(0.8 * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(s - 0.12), 2.6)), 0.6) * su * (1 - 0.2 * s) + 0.22 * lay * (1 - s * s) + 0.2 * (1 - su) + 0.16 * smoothstep(0.88, 1, Math.abs(s)) + 0.07 * fold * su, 0, 0.88);
    o.d[2] = 0; o.d[3] = 0;
  }));
  await R.tick();
  // clew cords fanning from each hook to the cloth's gathered ends
  const a = [0, 0, 0];
  for (const e of [0, 1]) for (let i = 0; i < 11; i++) {
    P(e, i / 10, a);
    const hx = (e * 2 - 1) * half, ax = a[0], ay = a[1], az = a[2];
    parts.push(ribbon(6, (t, side, o) => {
      const bow = -34 * Math.sin(Math.PI * t) * (0.6 + 0.4 * Math.abs(i - 5) / 5);
      o.p[0] = lerp(hx, ax, t); o.p[1] = lerp(0, ay, t) + bow + (side - 0.5) * 15; o.p[2] = lerp(0, az, t) + (side - 0.5) * 9;
      const c = 0.62 - 0.14 * (i % 2); o.c[0] = c; o.c[1] = c * 0.97; o.c[2] = c * 0.86; o.d[0] = 0.03; o.d[1] = 0.25 * (1 - t);
    }));
  }
  // the knot at each hook
  for (const e of [-1, 1]) parts.push(dress(new THREE.SphereGeometry(30, 10, 8).scale(1.7, 1, 1).translate(e * (half - 40), -8, 0), [0.55, 0.53, 0.46], [0.03, 0.2, 0, 0]));
  // the valance: a lace band hanging from each long edge (pattern and scalloped hem are cut in FRAG_LACE).
  // aData = (loop count along the edge, 0 at the cloth .. 1 at the hem, sway, phase)
  const lace = [];
  await R.tick();
  for (const v of [0, 1]) lace.push(grid(112, 3, false, (u, w, o) => {
    P(u, v, a);
    const su = Math.sin(Math.PI * u), drop = (40 + 30 * Math.pow(su, 0.5)) * w;
    o.p[0] = a[0]; o.p[1] = a[1] - drop; o.p[2] = a[2] + (v * 2 - 1) * (3 + 9 * w);
    o.c[0] = 0.8; o.c[1] = 0.79; o.c[2] = 0.72;
    o.d[0] = u * 66; o.d[1] = w; o.d[2] = 9 * w; o.d[3] = u * 40 + v * 2;
  }));
  await R.tick();
  return { cloth: merge(parts), lace: merge(lace) };
}

// the lace cloth's drop round the table edge: soft folds, scalloped hem, a draught in it
function buildSkirtGeometry(R) {
  const cloth = mul(lin(PALETTE[2]), 0.8);
  return grid(180, 5, false, (u, v, o, i, j) => {
    const th = u * TAU, fold = Math.sin(th * 30) + 0.4 * Math.sin(th * 11 + 1), r = 651 + 5 * v + 13 * fold * v;
    o.p[0] = Math.cos(th) * r; o.p[2] = Math.sin(th) * r; o.p[1] = -2 - v * (215 + 46 * Math.abs(Math.sin(th * 18)));
    const c = mul(cloth, (j % 2 ? 0.92 : 0.66) * (0.86 + 0.14 * fold * v) * (1 - 0.25 * v));
    o.c[0] = c[0]; o.c[1] = c[1]; o.c[2] = c[2];
    o.d[0] = 0.03; o.d[1] = 0.1 * v; o.d[2] = 9 * v * v; o.d[3] = th * 3;
  });
}

// three ferns that shiver under the eave drip
async function buildFernGeometry(R) {
  const parts = [], rng = R.rng, green = lin(PALETTE[5]);
  for (const x0 of R.fernX) for (let i = 0; i < 20; i++) {
    await R.tick();
    const az = (i / 20) * TAU + rng() * 0.3, len = 380 + 220 * rng(), rise = 150 + 240 * rng(), ph = rng() * 6, tone = 0.8 + 0.6 * rng();
    const ca = Math.cos(az), sa = Math.sin(az);
    parts.push(grid(2, 16, false, (u, v, o, ii, j) => {
      const t = v, r = len * Math.pow(t, 0.85), h = rise * Math.sin(t * 2.2) - 230 * t * t * t;
      const w = (70 * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.6)), 0.8) + 5) * (j % 2 ? 1 : 0.55) * (u - 0.5) * 2;
      o.p[0] = x0 + ca * r - sa * w; o.p[1] = RAIL_Y + 255 + h - Math.abs(u - 0.5) * 30 * t; o.p[2] = FRONT_Z - 100 + sa * r + ca * w;
      const c = mul(mixc(green, [0.2, 0.34, 0.16], 0.5 * t), tone * (ii === 1 ? 0.7 : 1.05) * (0.5 + 0.5 * t));
      o.c[0] = c[0]; o.c[1] = c[1]; o.c[2] = c[2];
      o.d[0] = 0.25; o.d[1] = 0.4 * (1 - t); o.d[2] = 18 * t * t; o.d[3] = ph + t * 2;
    }));
  }
  await R.tick();
  return merge(parts);
}

// four broad wooden blades on brass irons, built about the hub
function buildFanGeometry(R) {
  const parts = [];
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * TAU, ca = Math.cos(a), sa = Math.sin(a);
    parts.push(grid(4, 10, false, (u, v, o) => {
      const r = 130 + 580 * v, w = (105 + 125 * Math.pow(Math.sin(Math.PI * Math.min(0.5 + v * 0.5, 1)), 0.5)) * (v > 0.96 ? 0.8 : 1) * (v < 0.12 ? 0.35 + v * 5 : 1);
      const s = (u - 0.5) * w, y = -20 + s * 0.2 - 30 * v * v;
      o.p[0] = ca * r - sa * s; o.p[1] = y; o.p[2] = sa * r + ca * s;
      const c = v < 0.14 ? mul(R.brass, 0.5) : mul(R.darkWood, 2.2 + 0.8 * Math.sin(s * 0.05 + v * 9));
      o.c[0] = c[0]; o.c[1] = c[1]; o.c[2] = c[2]; o.d[0] = v < 0.14 ? 0.7 : 0.45; o.d[1] = 0;
    }));
  }
  return merge(parts);
}

// walls (aData.x: 0 back, 1 ends), floor and roof planes
function buildWallGeometry() {
  const yT = RIDGE_Y + 40, zF = FRONT_Z + 240;
  return merge([
    quadG([END_L, FLOOR_Y, WALL_Z], [END_R, FLOOR_Y, WALL_Z], [END_R, yT, WALL_Z], [END_L, yT, WALL_Z], [0, 0, 0, 0], 8, 4),
    quadG([END_L, FLOOR_Y, zF], [END_L, FLOOR_Y, WALL_Z], [END_L, yT, WALL_Z], [END_L, yT, zF], [1, 0, 0, 0], 8, 4),
    quadG([END_R, FLOOR_Y, WALL_Z], [END_R, FLOOR_Y, zF], [END_R, yT, zF], [END_R, yT, WALL_Z], [1, 0, 0, 0], 8, 4),
  ]);
}

// ---------------------------------------------------------------- the garden: cut-outs beyond the balustrade
async function buildGardenGeometry(R) {
  const parts = [], rng = R.rng, green = lin(PALETTE[5]), pewter = lin(PALETTE[1]);
  const put = (o, x, y, z, c, w, ph, haze, fl) => { o.p[0] = x; o.p[1] = y; o.p[2] = z; o.c[0] = c[0]; o.c[1] = c[1]; o.c[2] = c[2]; o.d[0] = w; o.d[1] = ph; o.d[2] = haze; o.d[3] = fl; };
  // six coconut palms with fronds streaming
  for (let p = 0; p < 6; p++) {
    const x0 = lerp(-3300, 3300, (p + 0.5) / 6) + (rng() - 0.5) * 700, z0 = 4300 + rng() * 900, h = 1150 + rng() * 900 + (p === 2 || p === 3 ? -350 : 0), lean = (rng() - 0.3) * 600;
    const haze = lerp(0.3, 0.52, (z0 - 4300) / 900), ph0 = rng() * 6, tone = mul(mixc(green, pewter, 0.35), 0.5 + 0.25 * rng());
    const topx = x0 + lean, base = -1500;
    parts.push(ribbon(12, (t, side, o) => {
      const w = lerp(95, 48, t) * (1 + 0.12 * Math.sin(t * 40)), x = x0 + lean * t * t + (side - 0.5) * 2 * w;
      put(o, x, lerp(base, h, t), z0, mul(tone, 0.8), 70 * t * t, ph0, haze, 0);
    }));
    for (let f = 0; f < 12; f++) {
      await R.tick();
      const a = lerp(-0.9, Math.PI + 0.9, (f + rng() * 0.6) / 12), L = 820 + 380 * rng(), droop = 0.35 + 0.5 * rng(), ph = ph0 + rng() * 2, ca = Math.cos(a), sa = Math.sin(a);
      const spine = (t, out) => { out[0] = topx + L * t * ca + 240 * t * t; out[1] = h + L * t * sa - droop * L * t * t * (0.6 + 0.4 * Math.abs(ca)); return out; };
      const s0 = [0, 0], s1 = [0, 0];
      for (const up of [0, 1]) parts.push(grid(26, 1, false, (u, v, o, i) => {
        spine(u, s0); spine(Math.min(u + 0.02, 1.02), s1);
        let tx = s1[0] - s0[0], ty = s1[1] - s0[1]; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
        const len = (150 * Math.pow(Math.sin(Math.PI * Math.pow(u, 0.7)), 0.6) + 26) * (i % 2 ? 1 : 0.3) * (up ? 0.45 : 1) * v;
        // leaflets hang: mostly straight down, a little swept along the spine
        const dx = up ? -ty : tx * 0.35 + 0.25, dy = up ? tx : -1;
        put(o, s0[0] + dx * len, s0[1] + (up ? Math.abs(dy) : dy) * len, z0 + f * 3 + up, mul(tone, up ? 1.15 : 0.85 + 0.3 * rng()), 60 + 250 * u + 90 * v * u, ph + u * 1.5, haze, v * u);
      }));
    }
  }
  // a wall of banana leaves that flap and split
  for (let x = -3500; x < 3300; x += 520 + rng() * 420) {
    const z0 = 3080 + rng() * 420, nl = 5 + Math.floor(rng() * 4), haze = lerp(0.06, 0.2, (z0 - 3080) / 420);
    for (let l = 0; l < nl; l++) {
      await R.tick();
      const dir = (rng() - 0.5) * 2.2, L = 900 + 700 * rng(), top = 250 + 1100 * rng(), ph = rng() * 6, tone = mul(mixc(green, lin(PALETTE[2]), 0.12 + 0.25 * rng()), 0.75 + 0.5 * rng()), bx = x + (rng() - 0.5) * 240;
      const tear = [rng(), rng(), rng(), rng()];
      parts.push(grid(2, 16, false, (u, v, o, i, j) => {
        const t = v, sx = bx + dir * L * 0.5 * t * t, sy = lerp(-1300, top, Math.sin(t * 1.35) / Math.sin(1.35)) - 240 * t * t * Math.abs(dir);
        const blade = t < 0.25 ? 0.07 : Math.pow(Math.sin(Math.PI * (t - 0.25) / 0.76), 0.55);
        const torn = tear.some((q) => Math.abs(t - 0.3 - q * 0.65) < 0.035) ? 0.3 : 1;
        const w = (i - 1) * 230 * blade * torn * (j % 2 ? 1 : 0.86);
        // the blade lies across the stem's direction
        const nx = Math.cos(dir * 0.5), ny = -Math.sin(dir * 0.5) * 0.6;
        put(o, sx + nx * w, sy + ny * w - Math.abs(i - 1) * 60 * blade * t, z0 + l * 4, mul(tone, i === 1 ? 1.25 : 0.9), (30 + 170 * t) * (0.6 + 0.4 * Math.abs(i - 1)), ph + t, haze, t * Math.abs(i - 1));
      }));
    }
  }
  await R.tick();
  // the mango crown heaving at one end: a rounded, layered dome of leaf clumps, darker in its heart and low down,
  // thinner and hazier toward the rim so the light breaks through
  const mx = R.mangoSide * 2500, mz = 3950, my = 1500;
  parts.push(ribbon(6, (t, side, o) => put(o, mx + (side - 0.5) * 300 * (1.35 - 0.6 * t) + 140 * t * t * R.mangoSide, lerp(-1500, my - 250, t), mz, mul(pewter, 0.2), 10 * t, 0, 0.36, 0)));
  for (const [dx, dy] of [[-520, 560], [430, 640], [80, 820]]) parts.push(ribbon(4, (t, side, o) => put(o, mx + dx * t * (0.6 + 0.4 * t) + (side - 0.5) * 120 * (1 - 0.6 * t), my - 420 + dy * t, mz + 1, mul(pewter, 0.2), 14 * t, 1, 0.38, 0)));
  for (let i = 0; i < 84; i++) {
    // points filling a dome: wide at the shoulder, flat below, with a few clumps straying outside it
    const a0 = rng() * Math.PI, rr = Math.sqrt(rng()) * (i % 9 === 0 ? 1.12 : 1), ex = Math.cos(a0) * rr, ey = Math.sin(a0) * rr;
    const cx = mx + ex * 1450, cy = my - 260 + ey * 1250 - 220 * ex * ex, edge = smoothstep(0.55, 1.05, rr);
    const rad = lerp(330, 170, edge) * (0.8 + 0.45 * rng()), ph = rng() * 6, lob = 3 + Math.floor(rng() * 3), l0 = rng() * 6;
    const tone = mul(mixc(green, pewter, 0.3), (0.26 + 0.2 * rng()) * (0.75 + 0.55 * ey) * (1 + 0.5 * edge)), haze = 0.36 + 0.26 * edge;
    parts.push(grid(26, 2, false, (u, v, o) => {
      const a = u * TAU, r = rad * v * (0.78 + 0.22 * Math.abs(Math.sin(a * lob * 0.5 + l0)) + 0.06 * Math.sin(a * 7 + i));
      const lit = 0.8 + 0.45 * v * Math.max(0, Math.sin(a)) + 0.25 * (v > 0.75 ? 1 : 0);
      put(o, cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.78, mz + 10 + i * 2, mul(tone, lit), 30 + 34 * v, ph + Math.cos(a), haze + 0.1 * (v > 0.75 ? 1 : 0), 0.2 * v);
    }));
    if ((i & 15) === 15) await R.tick();
  }
  await R.tick();
  return merge(parts);
}

// the coronet's vertices are placed by VERT_CORONET; the geometry only carries what each one is
function buildCoronetGeometry(rng) {
  const parts = [];
  parts.push(grid(44, 6, true, (u, v, o) => { o.p[0] = o.p[1] = o.p[2] = 0; o.d[0] = u * TAU; o.d[1] = v; o.d[2] = 0; }));
  parts.push(grid(44, 2, true, (u, v, o) => { o.p[0] = o.p[1] = o.p[2] = 0; o.d[0] = u * TAU; o.d[1] = v; o.d[2] = 2; }));
  for (let i = 0; i < 11; i++) parts.push(dress(new THREE.SphereGeometry(1, 8, 6), [1, 1, 1], [((i + 0.5) / 11) * TAU, 0, 1, rng()]));
  for (let i = 0; i < 7; i++) parts.push(dress(new THREE.SphereGeometry(0.55, 6, 4), [1, 1, 1], [rng() * TAU, 0, 1, 0.3 + 1.4 * rng()]));
  parts.push(dress(new THREE.SphereGeometry(1, 14, 7, 0, TAU, 0, Math.PI / 2), [1, 1, 1], [0, 0, 3, 0]));
  return merge(parts);
}

// ---------------------------------------------------------------- creatures (local +Z = forward, +Y up)
// swallow-tailed hummingbird, 120 m long, modelled in its hover: the bill level, a round head on a narrow neck, a deep
// breast, the body hanging back and down and the forked tail fanned below it. Blue-black with a green gloss on the
// back; a cobalt gorget of scales wraps the throat, the cheeks and the sides of the neck (so it shows in profile and
// from behind as well as from the front); a white spot behind the eye; pale thigh tufts.
function buildHummingbird(R) {
  const parts = [], ink = [0.01, 0.011, 0.016], night = [0.012, 0.02, 0.062], green = [0.012, 0.075, 0.05], cobalt = [0.035, 0.2, 1.2], violet = [0.2, 0.1, 1.0];
  // spine keys from the bill's tip back to the rump: [y, z, radius]
  const K = [[-1.7, 47, 0.25], [-0.9, 38, 0.95], [-0.2, 28.5, 1.5], [0.4, 21, 2.5], [1.9, 16.2, 7.4], [2.7, 10.5, 9.7], [1.3, 4.6, 8.7], [-3.2, -1, 6.9], [-9.5, -6.5, 11.4],
    [-17, -13, 13.8], [-25.5, -20.5, 12.4], [-33, -27.5, 8.6], [-38.5, -33, 4.8], [-41.5, -36.5, 1.5]];
  const nK = K.length - 1, cr = (s, c) => {
    const i = Math.min(nK - 1, Math.floor(s)), f = s - i, p0 = K[Math.max(i - 1, 0)][c], p1 = K[i][c], p2 = K[i + 1][c], p3 = K[Math.min(i + 2, nK)][c];
    return 0.5 * (2 * p1 + (p2 - p0) * f + (2 * p0 - 5 * p1 + 4 * p2 - p3) * f * f + (3 * p1 - p0 - 3 * p2 + p3) * f * f * f);
  };
  const NA = nK * 4, NR = 18;
  parts.push(grid(NR, NA, true, (u, v, o, i, j) => {
    const s = Math.min(v * nK, nK - 1e-4), a = u * TAU, ca = Math.cos(a), sa = Math.sin(a);
    const y = cr(s, 0), z = cr(s, 1), r = Math.max(cr(s, 2), 0.2), e = 0.05;
    let ty = cr(Math.min(s + e, nK - 1e-4), 0) - cr(Math.max(s - e, 0), 0), tz = cr(Math.min(s + e, nK - 1e-4), 1) - cr(Math.max(s - e, 0), 1);
    const tl = Math.hypot(ty, tz) || 1; ty /= tl; tz /= tl;
    const breast = Math.exp(-(((s - 9) / 1.5) ** 2)), head = Math.exp(-(((s - 5) / 1.2) ** 2));
    const wy = sa < 0 ? 1 + 0.32 * breast : 0.94 - 0.1 * breast, wx = 1 - 0.08 * head + 0.04 * breast;
    o.p[0] = r * ca * wx; o.p[1] = y + -tz * r * sa * wy; o.p[2] = z + ty * r * sa * wy;
    // plumage: rows of scales (alternate cells lighter and darker), the gorget's lower edge cut in scallops
    const scale = (i + j) % 2 ? 1.2 : 0.78, back = smoothstep(-0.1, 0.6, sa);
    const gor = smoothstep(4.25, 4.7, s) * (1 - smoothstep(8.3 + 0.35 * Math.cos(a * 6), 8.9 + 0.35 * Math.cos(a * 6), s)) * smoothstep(0.5, 0.18, sa - 0.25 * head);
    let c, gloss = 0.7, irid = 0.06;
    if (s < 3.15) { c = mul(ink, 1 + 0.6 * smoothstep(0.3, 1, sa)); gloss = 0.6; irid = 0; }
    else {
      c = mul(mixc(mixc(night, [0.02, 0.03, 0.05], smoothstep(0.2, -0.8, sa) * smoothstep(8, 11, s)), green, 0.75 * back * smoothstep(6.5, 8.5, s)), scale);
      c = mixc(c, mul(violet, 0.16 * scale), 0.6 * back * (1 - smoothstep(5.8, 7.2, s)));          // a violet gloss on the crown
      c = mixc(c, mul(mixc(cobalt, violet, 0.25 * smoothstep(7, 8.6, s)), 0.55 + 0.6 * scale), gor);
      irid = Math.max(0.1 * back, 0.85 * gor);
    }
    o.c[0] = c[0]; o.c[1] = c[1]; o.c[2] = c[2]; o.d[0] = gloss; o.d[1] = 0.25 * smoothstep(0.1, -0.9, sa) * smoothstep(7.5, 9, s) * (1 - gor); o.d[2] = irid;
  }));
  // eyes, the white spot behind each, the thigh tufts
  for (const sgn of [-1, 1]) {
    parts.push(dress(new THREE.SphereGeometry(1.75, 10, 8).translate(sgn * 7.7, 3.7, 13.3), [0.004, 0.004, 0.005], [1, 0, 0, 0]));
    parts.push(dress(new THREE.SphereGeometry(0.42, 6, 5).translate(sgn * 8.75, 4.5, 14.1), [0.9, 0.9, 0.86], [1, 0, 0, 0]));
    parts.push(dress(new THREE.SphereGeometry(1.25, 8, 6).scale(0.5, 0.8, 1.3).translate(sgn * 8.95, 4.4, 9.4), [0.82, 0.84, 0.86], [0.2, 0, 0, 0]));
    parts.push(dress(new THREE.SphereGeometry(3.4, 10, 7).scale(0.9, 1.15, 1).translate(sgn * 4.2, -34.5, -23.5), (x, y, z) => mul([0.6, 0.63, 0.66], 0.8 + 0.3 * R.noise.n3(x * 0.9, y * 0.9, z * 0.9)), [0.05, 0.2, 0, 0]));
  }
  // the tail: ten pointed feathers fanned from the rump, the outer pair longest (the swallow fork), each with a raised
  // shaft and darker webs so the fan reads feather by feather
  const D = V3(0, -0.36, -0.933), X = V3(0.94, 0.317, -0.122), Nt = V3(-0.34, 0.877, -0.338), dir = new THREE.Vector3(), lat = new THREE.Vector3();   // (twisted about its own axis)
  for (let k = 0; k < 10; k++) {
    const f = (k / 9) * 2 - 1, af = Math.abs(f), phi = 0.74 * f, L = 31 + 25 * Math.pow(af, 1.5), W = 7.4 * (1 - 0.25 * af), lift = (1 - af) * 1.6;
    dir.copy(D).multiplyScalar(Math.cos(phi)).addScaledVector(X, Math.sin(phi)); lat.copy(X).multiplyScalar(Math.cos(phi)).addScaledVector(D, -Math.sin(phi));
    const dx = dir.x, dy = dir.y, dz = dir.z, lx = lat.x, ly = lat.y, lz = lat.z;
    parts.push(grid(2, 9, false, (u, t, o, i) => {
      const cc = i - 1, w = W * (0.4 + 0.6 * Math.sin(Math.PI / 2 * Math.min(1, t / 0.55))) * (t < 0.55 ? 1 : 1 - 0.93 * Math.pow((t - 0.55) / 0.45, 1.5));
      const up = lift + (cc === 0 ? 0.7 : 0) - 6 * t * t - 0.8 * af * t;
      o.p[0] = f * 2.6 + dx * L * t + lx * cc * w + Nt.x * up; o.p[1] = -38.5 + dy * L * t + ly * cc * w + Nt.y * up; o.p[2] = -33 + dz * L * t + lz * cc * w + Nt.z * up;
      const c = mul(mixc([0.02, 0.07, 0.42], [0.008, 0.016, 0.1], smoothstep(0.35, 1, t)), (cc === 0 ? 1.5 : 0.8) * (0.85 + 0.3 * (k % 2)));
      o.c[0] = c[0]; o.c[1] = c[1]; o.c[2] = c[2]; o.d[0] = 0.65; o.d[1] = 0.25 * (1 - t) * (1 - af); o.d[2] = cc === 0 ? 0.35 : 0.15;
    }));
  }
  // the wings: a fan on each side, the blur of one wing beat (FRAG_WING draws it), nearly level so that both show from
  // above and from the side. aData = (radius 0..1, angle -1..1)
  const wings = [];
  for (const sgn of [-1, 1]) wings.push(grid(16, 6, false, (u, v, o) => {
    const an = (u * 2 - 1) * 1.2, r = 62 * v;
    o.p[0] = sgn * (8 + Math.cos(an) * r * 0.97); o.p[2] = -4 + Math.sin(an) * r * 0.95; o.p[1] = -5 + r * (0.15 * Math.cos(an) + 0.16 * Math.sin(an));
    o.d[0] = v; o.d[1] = u * 2 - 1;
  }));
  return { body: merge(parts), wings: merge(wings) };
}

// blue morpho, the hummingbird's stand-in on some visits: body, and one wing pair to mirror (hinge on the Z axis)
function buildMorpho() {
  const black = [0.006, 0.006, 0.01];
  const body = tube([[0, 0, 26], [0, 1.5, 12], [0, 1, -8], [0, -1, -30]], (t) => 0.4 + 3.4 * Math.sin(Math.PI * Math.min(1, t * 1.2 + 0.05)), { along: 10, around: 8, color: () => [0.03, 0.025, 0.02], data: [0.3, 0, 0, 0] });
  const wing = [];
  for (const [z0, len, wid, sweep] of [[12, 62, 44, 0.5], [-10, 46, 40, -0.55]]) wing.push(grid(48, 14, false, (u, v, o, i, j) => {
    const r = len * v, a = sweep + (u - 0.5) * 1.5, edge = Math.sin(Math.PI * u);
    const rr = r * (0.55 + 0.45 * Math.pow(edge, 0.85)) * (1 + 0.018 * Math.cos(u * Math.PI * 16) * smoothstep(0.8, 1, v));
    o.p[0] = 2 + Math.cos(a) * rr; o.p[2] = z0 + Math.sin(a) * rr * (wid / len) * 1.4; o.p[1] = 1 + 3 * v * (1 - v) + 0.5 * Math.cos(u * Math.PI * 8) * v;
    // a black border, broad along the outer margin and the leading edge, with a row of pale spots in it
    const m = clamp(smoothstep(0.7, 0.86, v + 0.03 * Math.cos(u * Math.PI * 16)) + (1 - smoothstep(0.03, 0.2, edge)) * smoothstep(0.08, 0.45, v) + (1 - smoothstep(0.04, 0.1, v)), 0, 1);
    // cobalt at the body running out to pale blue, thin black veins fanning from the root
    const blue = mixc([0.012, 0.085, 0.5], [0.16, 0.46, 0.95], smoothstep(0.08, 0.75, v + 0.12 * (edge - 0.5)));
    const vein = i % 6 === 0 && j > 1 ? 0.22 : 1;
    let c = mixc(mul(blue, vein * (0.92 + 0.12 * Math.sin(u * 9 + z0))), black, m);
    if (j === 13 && i % 6 === 3 && i > 3 && i < 45) c = [0.42, 0.5, 0.6];
    o.c[0] = c[0]; o.c[1] = c[1]; o.c[2] = c[2]; o.d[0] = 0.4 * (1 - m); o.d[2] = 0.9 * (1 - m) * (vein > 0.5 ? 1 : 0.3);
  }));
  return { body, wing: merge(wing) };
}

// a perching bird (parrot or canary), ~130 m tall, feet at the origin; and one wing to mirror (hinge at the shoulder)
function buildBird(main, head, beak, tailC) {
  const Y = V3(0, 1, 0), parts = [];
  parts.push(lathe([[0, 128], [10, 126], [19, 118], [22.5, 106], [20, 95], [17.5, 90], [26, 78], [31, 60], [30, 40], [24, 22], [14, 10], [0, 6]], { seg: 18,
    color: (v, th, y) => mul(y > 92 ? head : mixc(main, head, 0.25 * smoothstep(40, 90, y)), 0.8 + 0.3 * Math.max(0, -Math.sin(th))), data: [0.3, 0, 0, 0] }).scale(1, 1, 1.12));
  parts.push(place(lathe([[0, 17], [3.4, 14], [7, 7], [8.6, 0]], { seg: 10, color: () => beak, data: [0.7, 0, 0, 0] }), V3(0, 104, 17), V3(0, -0.5, 0.86)));
  for (const sgn of [-1, 1]) parts.push(dress(new THREE.SphereGeometry(2.6, 8, 6).translate(sgn * 14.5, 110, 14), [0.01, 0.01, 0.01], [1, 0, 0, 0]));
  parts.push(ribbon(6, (t, side, o) => {
    o.p[0] = (side - 0.5) * lerp(30, 12, t); o.p[1] = 26 - 96 * t; o.p[2] = -20 - 34 * t;
    const c = mul(tailC, 1 - 0.3 * t); o.c[0] = c[0]; o.c[1] = c[1]; o.c[2] = c[2]; o.d[0] = 0.3;
  }));
  for (const sgn of [-1, 1]) parts.push(tube([[sgn * 9, 14, 2], [sgn * 10, 4, 4], [sgn * 10, -3, 8]], () => 2.6, { along: 3, around: 6, color: () => [0.25, 0.22, 0.2], data: [0.2, 0, 0, 0] }));
  const wing = grid(5, 6, false, (u, v, o) => {
    const w = 26 * Math.sin(Math.PI * Math.pow(v, 0.6)) + 3;
    o.p[0] = 66 * v; o.p[1] = 4 * Math.sin(v * 3); o.p[2] = (u - 0.6) * w;
    const c = mul(mixc(main, tailC, v), 0.7 + 0.5 * u); o.c[0] = c[0]; o.c[1] = c[1]; o.c[2] = c[2]; o.d[0] = 0.3;
  });
  return { body: merge(parts), wing, Y };
}

// a pale house gecko, 100 m long, head toward +Z, belly on y = 0
async function buildGecko(R) {
  const parts = [], n = R.noise, skin = [0.76, 0.58, 0.42];
  const skinC = (v, a) => {
    const top = smoothstep(-0.25, 0.5, Math.cos(a - 1.57)), band = smoothstep(0.25, 0.75, 0.5 + 0.5 * Math.sin(v * 52 + Math.sin(a * 2) * 1.3)), fleck = smoothstep(0.25, 0.6, n.n2(v * 90, a * 7));
    const c = mixc(mixc([0.7, 0.6, 0.5], skin, top), [0.33, 0.22, 0.16], top * (0.7 * band + 0.25 * fleck * (1 - band)));
    return mul(c, 0.92 + 0.16 * n.n2(v * 30, a * 3));
  };
  const spine = [[7, 2, -62], [-4, 2.4, -46], [3.5, 3.4, -29], [0, 5, -12], [-2, 6, 4], [1, 5.6, 18], [0, 5, 27], [0, 4.8, 39]];
  const body = tube(spine, (t) => (t < 0.48 ? 0.5 + 6.5 * Math.pow(t / 0.48, 0.8) : t < 0.8 ? 7 + 1.8 * Math.sin(Math.PI * (t - 0.48) / 0.32) : t < 0.88 ? 5.6 : 6.6 * Math.pow(Math.max(0, (1 - t) / 0.12), 0.45) + 0.4),
    { along: 40, around: 12, color: skinC, data: [0.35, 0, 0, 0] });
  await R.tick();
  { // flatten, and let the tail tip curl (sway weight on the last third of the tail)
    const pos = body.attributes.position, dat = body.attributes.aData;
    for (let i = 0; i < pos.count; i++) {
      const z = pos.getZ(i), y = pos.getY(i);
      pos.setY(i, Math.max(0.15, (y - 4) * 0.62 + 3.4 - (z < -20 ? (z + 20) * -0.03 : 0)));
      dat.setZ(i, 7 * Math.pow(clamp((-34 - z) / 28, 0, 1), 1.6)); dat.setW(i, z * 0.06);
    }
    const colA = body.attributes.color, belly = [0.76, 0.64, 0.52], dark = [0.13, 0.075, 0.05];
    for (let j = 0; j <= 40; j++) {
      let lo = 1e9, hi = -1e9;
      for (let i = 0; i < 12; i++) { const y = pos.getY(j * 12 + i); lo = Math.min(lo, y); hi = Math.max(hi, y); }
      for (let i = 0; i < 12; i++) {
        const k = j * 12 + i, x = pos.getX(k), z = pos.getZ(k), top = smoothstep(0.4, 0.8, (pos.getY(k) - lo) / Math.max(hi - lo, 1e-3));
        const band = smoothstep(0.38, 0.62, 0.5 + 0.5 * Math.sin(z * 0.4 + x * 0.1)), fleck = smoothstep(0.2, 0.6, n.n2(x * 0.5, z * 0.5));
        const c = mul(mixc(mixc(belly, skin, top), dark, Math.min(1, top * 1.15) * (0.95 * band + 0.35 * fleck * (1 - band))), 0.93 + 0.14 * n.n2(x * 0.2 + 5, z * 0.2));
        colA.setXYZ(k, c[0], c[1], c[2]);
      }
    }
    await R.tick();
    body.computeVertexNormals();
  }
  parts.push(body);
  await R.tick();
  // legs: rooted well inside the flank and thick there, a raised elbow, the forearm coming down to a splayed hand of
  // five toes with round pads; the same banded skin as the body, paler underneath
  const limbC = (z0) => (v, a) => {
    const top = smoothstep(-0.3, 0.5, Math.sin(a)), band = smoothstep(0.35, 0.65, 0.5 + 0.5 * Math.sin(v * 15 + z0));
    return mul(mixc(mixc([0.76, 0.64, 0.52], skin, top), [0.14, 0.08, 0.055], 0.9 * band * (0.45 + 0.55 * top)), 0.95 + 0.1 * Math.sin(v * 40));
  };
  for (const [sx, z0, fz] of [[-1, 17, 9], [1, 17, 9], [-1, -9, -7], [1, -9, 3]]) {
    const fore = fz > 5, ez = z0 + (fore ? 3 : -5), hx = sx * 18.5, hz = z0 + fz;
    parts.push(tube([[sx * 1.5, 3.4, z0], [sx * 6.5, 4.6, z0 + (fore ? 0.6 : -1.2)], [sx * 12.6, 6.6, ez], [sx * 16, 3.6, ez + (hz - ez) * 0.6], [hx, 1.1, hz]],
      (t) => 3.6 - 1.5 * smoothstep(0, 0.5, t) - 0.6 * smoothstep(0.55, 1, t) + 0.5 * Math.exp(-(((t - 0.5) / 0.1) ** 2)), { along: 14, around: 8, color: limbC(z0), data: [0.3, 0, 0, 0] }));
    for (let k = -2; k <= 2; k++) {
      const ta = (fore ? 0.25 : -0.35) + k * 0.46, tx = sx * Math.cos(ta), tz = Math.sin(ta), len = 6.4 - 0.7 * Math.abs(k);
      parts.push(tube([[hx - tx * 0.8, 1.0, hz - tz * 0.8], [hx + tx * len * 0.55, 1.2, hz + tz * len * 0.55], [hx + tx * len, 0.65, hz + tz * len]], (t) => 1.05 - 0.4 * t, { along: 3, around: 6,
        color: (v) => mixc(mul(skin, 0.95), [0.2, 0.12, 0.08], 0.8 * smoothstep(0.3, 0.7, 0.5 + 0.5 * Math.sin(v * 9 + k))), data: [0.35, 0, 0, 0] }));
      parts.push(dress(new THREE.SphereGeometry(1.5, 8, 5).scale(1, 0.34, 1).translate(hx + tx * (len + 0.6), 0.6, hz + tz * (len + 0.6)), (x, y, z) => mixc([0.92, 0.74, 0.66], mul(skin, 1.05), smoothstep(0.3, 1.0, y)), [0.55, 0, 0, 0]));
    }
    await R.tick();
  }
  await R.tick();
  // eyes: a small amber dome, a black slit pupil standing in it and a point of light
  for (const sx of [-1, 1]) {
    parts.push(dress(new THREE.SphereGeometry(1.75, 10, 8).translate(sx * 3.6, 5.75, 33), [0.62, 0.44, 0.12], [0.95, 0, 0, 0]));
    parts.push(dress(new THREE.SphereGeometry(1.4, 8, 8).scale(0.5, 1.0, 0.5).translate(sx * 4.75, 5.95, 33.5), [0.006, 0.005, 0.004], [1, 0, 0, 0]));
    parts.push(dress(new THREE.SphereGeometry(0.32, 6, 5).translate(sx * 5.2, 6.75, 34.0), [0.85, 0.86, 0.82], [1, 0, 0, 0]));
  }
  return merge(parts);
}

// ---------------------------------------------------------------- looks
const C3 = (r, g, b) => new THREE.Color(r, g, b);
const LOOKS = {
  // full downpour: silver light, heavy curtains, the palette at its strictest
  day: { heroHour: 'day', fog: C3(0.5, 0.56, 0.58), fogDensity: 0.00015, fill: C3(0.05, 0.062, 0.066), cloudLo: C3(0.125, 0.16, 0.175), cloudHi: C3(0.5, 0.56, 0.58), bay: C3(0.5, 0.56, 0.585),
    plantHaze: C3(0.33, 0.4, 0.405), plantGain: 0.62, hazeK: 0.85, flyCol: C3(0, 0, 0),
    sunGlow: C3(0, 0, 0), riftGain: 0.5, rain: 0.9, rainCol: C3(0.82, 0.9, 0.93), streak: 0.3, wet: 1, limeK: 1, throat: 1, bandGold: 0.92, mouthMist: 0.045, mistGain: 0.3, mistWarm: 1, sun: 0, wind: 1, steam: 0, flies: 0, exposure: 1.0,
    bloom: { strength: 0.3, radius: 0.6, threshold: 1.0 }, tint: '#f2f7f8', shadowTint: '#0a1014', saturation: 1.04, portal: '#ffe3a6' },
  // clearing sun-shower: low sun under the cloud edge, rain turned to bright falling sparks, the floor steaming
  golden: { heroHour: 'golden', fog: C3(0.6, 0.48, 0.34), fogDensity: 0.00014, fill: C3(0.075, 0.058, 0.045), cloudLo: C3(0.33, 0.27, 0.28), cloudHi: C3(0.98, 0.76, 0.5), bay: C3(0.95, 0.74, 0.44),
    plantGain: 1, hazeK: 1, flyCol: C3(0, 0, 0),
    sunGlow: C3(3.0, 1.75, 0.7), riftGain: 0.22, rain: 0.42, rainCol: C3(1.5, 1.15, 0.6), streak: 0.8, wet: 0.85, limeK: 0.45, throat: 1, bandGold: 0.7, mouthMist: 0.055, mistGain: 0.32, mistWarm: 1, sun: 1, wind: 0.6, steam: 1, flies: 0, exposure: 0.95,
    keyDir: V3(-0.5, 0.28, 0.82).normalize(), bloom: { strength: 0.36, radius: 0.65, threshold: 1.0 }, tint: '#fff4e2', shadowTint: '#140d10', saturation: 1.06, portal: '#fff0c8' },
  // blue dusk after rain: a last salmon rift, eaves only dripping, fireflies under the roof
  dusk: { heroHour: 'night', fog: C3(0.045, 0.075, 0.16), fogDensity: 0.00016, fill: C3(0.02, 0.028, 0.052), cloudLo: C3(0.028, 0.045, 0.12), cloudHi: C3(0.1, 0.16, 0.36), bay: C3(0.1, 0.14, 0.27),
    plantGain: 1, hazeK: 1, flyCol: C3(1.1, 1.5, 0.36), rake: C3(0.66, 0.27, 0.18),
    sunGlow: C3(0, 0, 0), riftGain: 0.42, rain: 0.14, rainCol: C3(0.4, 0.52, 0.85), streak: 0.14, wet: 0.9, limeK: 0.8, throat: 0.5, bandGold: 0.5, mouthMist: 0.085, mistGain: 0.3, mistWarm: 0.3, sun: 0, wind: 0.35, steam: 0, flies: 1, exposure: 1.7,
    bloom: { strength: 0.42, radius: 0.7, threshold: 0.95 }, tint: '#e6eeff', shadowTint: '#060a1c', saturation: 1.1, portal: '#ffe2b8' },
};

export default {
  id: 'seventy-eight-in-the-rain',
  name: 'Seventy-Eight in the Rain',
  category: 'domestic',
  weirdness: 0.15,
  media: ['tiny', 'interior', 'air'],
  async build(ctx) {
    const { rng } = ctx;
    const scene = new THREE.Scene();
    const stage = new THREE.Group(); stage.name = 'stage'; scene.add(stage);

    // ------------------------------------------------------------------ per-visit variety
    const V = rng.fork('variety');
    const vary = ctx.vary || {}, moodR = V(), mood = vary.mood ?? moodR;
    const hourIn = vary.hour || 'any';
    const lookName = hourIn === 'golden' ? 'golden' : hourIn === 'night' || hourIn === 'dawn' ? 'dusk' : hourIn === 'day' ? 'day' : mood < 0.45 ? 'day' : mood < 0.75 ? 'golden' : 'dusk';
    const LK = LOOKS[lookName];
    const density = clamp(vary.density ?? 1, 0.6, 1.4), detail = ctx.quality?.detail ?? 1, rare = !!vary.rare;
    const hamStriped = V() < 0.45, canaries = V() > 0.7, morphoR = V(), morpho = lookName === 'dusk' ? morphoR < 0.6 : morphoR < 0.15, mangoSide = V() < 0.5 ? -1 : 1, ajarDoor = V() < 0.5 ? 0 : 1, ajarSide = V() < 0.5 ? 0 : 1;
    const fernX = [-2150 + V.range(-150, 150), -350 + V.range(-200, 200), 1500 + V.range(-200, 200)];
    scene.background = LK.fog.clone();
    scene.fog = new THREE.FogExp2(LK.fog.clone(), LK.fogDensity);

    // ------------------------------------------------------------------ the gramophone
    const hero = await buildHero(ctx, { palette: PALETTE, hour: LK.heroHour, density });
    stage.add(hero.object);
    if (LK.keyDir) hero.setLook({ keyDir: LK.keyDir });
    const A = hero.anchors, HU = hero.uniforms;
    HU.uThroatCol.value.multiplyScalar(LK.throat);
    HU.uBandGold.value = LK.bandGold;
    HU.uFlow.value = 2.2;                                         // the beads on the horn creep at a pace the eye can follow
    await ctx.yield();

    // ------------------------------------------------------------------ the flight
    // Room trajectory + stage angle. During the ride the stage turns under the world path, so the room stands still
    // round the viewer and only the record moves; the approach decelerates into it and the lift-off accelerates out.
    // THE RIDE EYE is not nailed down: over the twelve seconds it cranes, in room space, from high and wide behind the
    // soundbox (the whole label a red shore on the left, the horn's underside overhead) down and in toward the needle
    // (the mica, the needle and its silver wake large, the sun's wedge lying along the shellac), and the gaze pans with
    // it from the label round to the garden. Three keys over the ride parameter k: it sets off at a drift and ends level.
    const RK = 0.56;
    const EYES = [V3(-138, 290, -92), V3(-108, 263, -62), V3(-84, 250.8, -39)];
    const GAZES = [[0.68, -0.3], [0.2, -0.1], [-0.03, 0.03]];      // yaw toward the label (+x), pitch
    const key3 = (v0, v1, v2, k) => {
      const m = v2 - v0;                                          // slope at the middle key
      if (k <= RK) { const t = clamp(k / RK, 0, 1), t2 = t * t, t3 = t2 * t; return (2 * t3 - 3 * t2 + 1) * v0 + (3 * t2 - 2 * t3) * v1 + (t3 - 2 * t2 + t) * 0.6 * (v1 - v0) + (t3 - t2) * RK * m; }
      const h = 1 - RK, t = clamp((k - RK) / h, 0, 1), t2 = t * t, t3 = t2 * t;
      return (2 * t3 - 3 * t2 + 1) * v1 + (t3 - 2 * t2 + t) * h * m + (3 * t2 - 2 * t3) * v2;
    };
    const rideEye = (k, out) => out.set(key3(EYES[0].x, EYES[1].x, EYES[2].x, k), key3(EYES[0].y, EYES[1].y, EYES[2].y, k), key3(EYES[0].z, EYES[1].z, EYES[2].z, k));
    const RIDE_A = 2.64, DELTA = 0.2, DE0 = DELTA * Math.hypot(EYES[0].x, EYES[0].z), DE1 = DELTA * Math.hypot(EYES[2].x, EYES[2].z);
    const dIn = V3(0.218, 0.03, 0.974).normalize();              // the approach, in room space: over the rear deck toward the machine
    const world = [], roomP = new THREE.Vector3();
    const idx = {};
    // approach: 114 m straight, stage at -DELTA
    for (const d of [114, 88, 62, 40, 20]) world.push(rotY(roomP.copy(EYES[0]).addScaledVector(dIn, -(d + DE0)), -DELTA));
    world[0].y = world[1].y = world[2].y;                        // the first 52 m dead level
    // settle: decelerate along dIn while the stage picks the camera up
    idx.settle = world.length;
    for (let q = 0; q < 1; q += 0.125) world.push(rotY(roomP.copy(EYES[0]).addScaledVector(dIn, -DE0 * (1 - q) * (1 - q)), -DELTA + DELTA * q * q));
    // the ride: the room locked to the viewer, the eye easing along its crane
    idx.ride0 = world.length;
    const nRide = Math.ceil(RIDE_A / 0.05);
    for (let i = 0; i <= nRide; i++) world.push(rotY(rideEye(i / nRide, roomP), (i / nRide) * RIDE_A));
    idx.ride1 = world.length - 1;
    // lift-off: the needle lets go; forward close past the soundbox, up over the front rim, veering right
    const eyeEnd = rideEye(1, new THREE.Vector3()), dOut = V3(-0.4, 0.04, 0.92).normalize(), PHI1 = RIDE_A + DELTA;
    for (let q = 0.125; q <= 1.001; q += 0.125) world.push(rotY(roomP.copy(eyeEnd).addScaledVector(dOut, DE1 * q * q), RIDE_A + DELTA * (1 - (1 - q) * (1 - q))));
    idx.free = world.length - 1;
    // (the turn stands a little further out over the table than the record's rim needs, so that the run down the
    // horn's axis is long: the mouth is still whole in the frame, with the veranda round it, four fifths of the way through)
    const TC = { x: -50, z: 303, r: 50 };
    const lift = [[-104, 258, 6], [-106, 272, 42], [-106.5, 298, 83], [-104, 331, 125], [-101, 362, 168], [-100, 392, 212], [-100, 416, 259]];
    for (const p of lift) world.push(rotY(roomP.set(p[0], p[1], p[2]), PHI1));
    // the turn: wheel left through 180 degrees out over the front of the record, climbing to the height of the horn's axis
    idx.turn0 = world.length;
    const axisAt = (z) => A.hornMouth.y + (z - A.hornMouth.z) * (A.hornAxis.y / A.hornAxis.z);
    const SEAT = A.portalSeat.position, zJoin = TC.z - 57, yJoin = axisAt(zJoin), yTurn = yJoin + 3;
    for (let i = 0; i <= 8; i++) {
      const x = i / 8, t = x * Math.PI, yy = 436 + (yTurn - 436) * (x < 0.75 ? 1.143 * x : 0.857 + 1.143 * (x - 0.75 - (x - 0.75) * (x - 0.75) / 0.5));
      world.push(rotY(roomP.set(TC.x - TC.r * Math.cos(t), yy, TC.z + TC.r * Math.sin(t)), PHI1));
    }
    idx.turn1 = world.length - 1;
    // level for a breath, then onto the axis: straight down it, through the mouth, to the throat
    const tEnd = (zJoin - A.hornMouth.z) / A.hornAxis.z;
    world.push(rotY(roomP.set(0, yJoin + 3.5, TC.z - 31), PHI1));
    const total = tEnd + SEAT.distanceTo(A.hornMouth);
    idx.axis = world.length;
    for (let d = 0; d < total - 20; d += 46) world.push(rotY(roomP.copy(A.hornMouth).addScaledVector(A.hornAxis, tEnd - d), PHI1));
    world.push(rotY(roomP.copy(SEAT).addScaledVector(A.hornAxis, 30), PHI1));
    world.push(rotY(roomP.copy(SEAT), PHI1));
    await ctx.yield();
    const path = makePath(world, { samples: 480 });
    await ctx.yield();
    const SPEED = 32.5, DUR = clamp(path.length / SPEED, 36, 50);

    // u of each key point (chord fractions are within a hair of arc length for points this dense)
    const cum = [0];
    for (let i = 1; i < world.length; i++) cum.push(cum[i - 1] + world[i].distanceTo(world[i - 1]));
    const uAt = (i) => cum[i] / cum[cum.length - 1];
    const U = { settle: uAt(idx.settle), ride0: uAt(idx.ride0), ride1: uAt(idx.ride1), free: uAt(idx.free), turn0: uAt(idx.turn0), turn1: uAt(idx.turn1), axis: uAt(idx.axis) };
    U.mouth = 1 - SEAT.distanceTo(A.hornMouth) / path.length;
    // tables over u: the ride parameter k (0..1 along the locked arc) and the stage angle. Inside the arc the angle is
    // read back from the path itself, so the room cannot drift against the camera.
    const NT = 1200, kT = new Float32Array(NT + 1), phiT = new Float32Array(NT + 1), e0 = new THREE.Vector3(), wp = new THREE.Vector3();
    for (let i = 0; i <= NT; i++) {
      const u = i / NT;
      if (u <= U.settle) { phiT[i] = -DELTA; kT[i] = 0; continue; }
      if (u >= U.free) { phiT[i] = PHI1; kT[i] = 1; continue; }
      if (u < U.ride0) { const q = (u - U.settle) / (U.ride0 - U.settle); phiT[i] = -DELTA + DELTA * q * q; kT[i] = 0; continue; }
      if (u > U.ride1) { const q = (u - U.ride1) / (U.free - U.ride1); phiT[i] = RIDE_A + DELTA * (1 - (1 - q) * (1 - q)); kT[i] = 1; continue; }
      let k = (u - U.ride0) / (U.ride1 - U.ride0);
      path.pointAt(u, wp);
      const ang = Math.atan2(wp.z, -wp.x);
      for (let it = 0; it < 6; it++) {
        rideEye(k, e0);
        const guess = k * RIDE_A, base = ang - Math.atan2(e0.z, -e0.x);
        const a = base + TAU * Math.round((guess - base) / TAU);
        k = clamp(a / RIDE_A, 0, 1);
      }
      kT[i] = k; phiT[i] = k * RIDE_A;
    }
    const tab = (T, u) => { const x = clamp(u, 0, 1) * NT, i = Math.min(NT - 1, Math.floor(x)); return T[i] + (T[i + 1] - T[i]) * (x - i); };
    // stage -> world for pois (the same transform update() gives the stage for that u)
    const rideWin = (u) => smoothstep(U.settle, U.ride0, u) * (1 - smoothstep(U.ride1, U.free, u));
    const swellAt = (time, u) => -hero.warpAt(time) * rideWin(u);
    const toWorld = (p, time, u, out) => { rotY(p, tab(phiT, u), out); out.y += swellAt(time, u); return out; };
    await ctx.yield();
    // the horn's looping drips keep 8 m and their own length off the flown line (the route read back into the stage's space)
    { const line = []; for (let i = 0; i <= 2400; i++) line.push(rotY(path.pointAt(i / 2400, wp), -tab(phiT, i / 2400))); await hero.clearDrips(line, 8); }
    await ctx.yield();

    // ------------------------------------------------------------------ materials (all lit by the hero's analytic veranda)
    const fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
    const uRake = { value: (LK.rake || C3(0, 0, 0)).clone() }, uRakeDir = { value: V3(-0.42, 0.09, 0.9).normalize() };
    const uSun = { value: LK.sun }, uLimeK = { value: LK.limeK }, uFill = { value: LK.fill.clone() }, uRainCol = { value: LK.rainCol.clone() }, uHaze = { value: LK.fog.clone().multiplyScalar(1.06) }, uBolt = { value: 0 };
    const mat = (vs, fs, own = {}, extra = {}) => new THREE.ShaderMaterial({ uniforms: { ...fogU(), ...HU, uTimeV: HU.uTime, uSun, uFill, uLimeK, uRake, uRakeDir, ...own }, vertexShader: vs, fragmentShader: fs, fog: true, vertexColors: true, ...extra });
    const PREMULT = { transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor };
    const ADD = { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending };
    const add = (geo, m, name, parent = stage) => { const o = new THREE.Mesh(geo, m); o.name = name; parent.add(o); return o; };
    const propMat = mat(VERT_STD, FRAG_PROP, {}, { side: THREE.DoubleSide });
    const swayMat = mat(VERT_STD, FRAG_PROP, {}, { side: THREE.DoubleSide, defines: { SWAY: 1 } });
    const brass = mixc(lin(PALETTE[3]), [0.96, 0.68, 0.25], 0.5);
    const R = {
      rng: rng.fork('set'), noise: ctx.noise, tick: () => ctx.yield(), lime: lookName === 'day' ? [0.4, 0.425, 0.42] : [0.5, 0.52, 0.5], darkWood: [0.05, 0.032, 0.025], clay: [0.34, 0.15, 0.09], brass, fernX, hamStriped, mangoSide,
      labelHex: hero.labelColor, cage: V3(1370, 690, -700), cageK: 1.5, cageSide: { x: 0.59, z: 0.81 }, fan: V3(2250, 1560, 250),
      ham: { x: 2700, y: 1350, z0: WALL_Z + 44, z1: 2452, sag: 1150 },
      props: { stack: { x: 470, z: -40 }, tin: { x: -500, z: 205 }, cup: { x: -545, z: -120 }, flower: { x: 525, z: 270 } },
    };

    // ------------------------------------------------------------------ the veranda shell
    const tile = lookName === 'golden' ? 1.08 : 1;
    add(quadG([END_L, FLOOR_Y, FRONT_Z + 240], [END_R, FLOOR_Y, FRONT_Z + 240], [END_R, FLOOR_Y, WALL_Z], [END_L, FLOOR_Y, WALL_Z], [0, 0, 0, 0]), mat(VERT_STD, FRAG_FLOOR, {
      uTileA: { value: C3(0.5 * tile, 0.48 * tile, 0.42) }, uTileB: { value: C3(0.06, 0.12, 0.27) }, uTileC: { value: C3(0.2, 0.24, 0.25) }, uTileD: { value: C3(0.03, 0.035, 0.045) }, uWet: { value: LK.wet },
      uShade: { value: new THREE.Vector4(1e6, 1e6, R.ham.x, (R.ham.z0 + R.ham.z1) / 2) } }), 'floor');
    await ctx.yield();
    const doorX = [-1700, 1700];
    const wallMat = mat(VERT_STD, FRAG_WALL, { uGlaze: { value: C3(0.6, 0.64, 0.68) }, uCobalt: { value: new THREE.Color(PALETTE[4]).multiplyScalar(1.25) }, uPlaster: { value: C3(0.52, 0.53, 0.49) },
      uShutter: { value: new THREE.Color(PALETTE[5]).multiplyScalar(1.5) }, uDoors: { value: new THREE.Vector4(doorX[0], doorX[1], ajarDoor, ajarSide) } }, { side: THREE.DoubleSide });
    add(buildWallGeometry(), wallMat, 'walls');
    await ctx.yield();
    {
      const tan = (RIDGE_Y - EAVE_Y - 30) / (FRONT_Z + 200 - WALL_Z), zF = FRONT_Z + 420;
      add(quadG([END_L, RIDGE_Y, WALL_Z], [END_R, RIDGE_Y, WALL_Z], [END_R, RIDGE_Y - tan * (zF - WALL_Z), zF], [END_L, RIDGE_Y - tan * (zF - WALL_Z), zF], [0, 0, 0, 0]),
        mat(VERT_STD, FRAG_ROOF, { uClay: { value: C3(R.clay[0], R.clay[1], R.clay[2]) } }, { side: THREE.DoubleSide }), 'roof');
    }
    await ctx.yield();
    add(await buildSetGeometry(R), propMat, 'set');
    await ctx.yield();
    add(await buildTableProps(R), propMat, 'tableProps');
    await ctx.yield();
    const skirt = add(buildSkirtGeometry(R), swayMat, 'skirt');
    await ctx.yield();
    const ferns = add(await buildFernGeometry(R), swayMat, 'ferns');
    skirt.frustumCulled = ferns.frustumCulled = false;
    // the swinging door leaf
    const leaf = add(dress(new THREE.BoxGeometry(700, 2050 - FLOOR_Y, 36).translate(350, (2050 + FLOOR_Y) / 2, 0), [1, 1, 1], [3, 0, 0, 0]), wallMat, 'doorLeaf');
    leaf.position.set(doorX[ajarDoor] + (ajarSide ? 720 : -720), 0, WALL_Z + 24);
    await ctx.yield();
    // the fan
    const fan = add(buildFanGeometry(R), propMat, 'fan'); fan.position.copy(R.fan);
    await ctx.yield();
    // the hammock
    const hamA = V3(R.ham.x, R.ham.y, R.ham.z0), hamB = V3(R.ham.x, R.ham.y, R.ham.z1), hamL = hamA.distanceTo(hamB);
    const hamG = await buildHammockGeometry(R, hamL);
    const ham = add(hamG.cloth, propMat, 'hammock');
    const hamLace = add(hamG.lace, mat(VERT_STD, FRAG_LACE, {}, { side: THREE.DoubleSide, defines: { SWAY: 1 } }), 'hammockLace', ham);
    hamLace.frustumCulled = false;
    ham.position.copy(hamA).add(hamB).multiplyScalar(0.5); ham.rotation.order = 'YXZ';
    const hamYaw = Math.atan2(-(hamB.z - hamA.z), hamB.x - hamA.x);
    ham.rotation.y = hamYaw; ham.frustumCulled = false;
    await ctx.yield();

    // ------------------------------------------------------------------ outside: sky, garden, rain off the eaves
    const dome = add(grid(40, 10, false, (u, v, o) => {
      const a = (u - 0.5) * 4.2; o.p[0] = Math.sin(a) * 6500; o.p[2] = Math.cos(a) * 6500; o.p[1] = lerp(-2800, 5600, v);
    }), new THREE.ShaderMaterial({ uniforms: { ...HU, uCloudLo: { value: LK.cloudLo.clone() }, uCloudHi: { value: LK.cloudHi.clone() }, uHaze, uBay: { value: LK.bay.clone() }, uSunGlow: { value: LK.sunGlow.clone() }, uRiftGain: { value: LK.riftGain }, uBolt },
      vertexShader: VERT_DOME, fragmentShader: FRAG_DOME, side: THREE.DoubleSide }), 'outside');
    dome.frustumCulled = false; dome.renderOrder = -2;
    await ctx.yield();
    const uWind = { value: LK.wind }, uHazeP = { value: (LK.plantHaze || LK.fog.clone().multiplyScalar(1.06)).clone() };
    const garden = add(await buildGardenGeometry({ rng: rng.fork('garden'), mangoSide, tick: () => ctx.yield() }), new THREE.ShaderMaterial({ uniforms: { uTimeV: HU.uTime, uWind, uHazeP, uPlantGain: { value: LK.plantGain }, uHazeK: { value: LK.hazeK }, uSkyCol: HU.uSkyCol, uFlash: HU.uFlash },
      vertexShader: VERT_PLANT, fragmentShader: FRAG_PLANT, vertexColors: true, side: THREE.DoubleSide }), 'garden');
    garden.frustumCulled = false;
    await ctx.yield();
    const curtainMat = mat(VERT_STD, FRAG_CURTAIN, { uRain: { value: LK.rain }, uRainCol }, { side: THREE.DoubleSide, ...PREMULT });
    const curtains = add(merge([
      quadG([END_L - 300, FLOOR_Y - 500, FRONT_Z + 190], [END_R + 300, FLOOR_Y - 500, FRONT_Z + 190], [END_R + 300, EAVE_Y + 60, FRONT_Z + 190], [END_L - 300, EAVE_Y + 60, FRONT_Z + 190], [0, 0, 0, 0]),
      quadG([-5600, -1600, 3850], [5600, -1600, 3850], [5600, 4400, 3850], [-5600, 4400, 3850], [1, 0, 0, 0]),
    ]), curtainMat, 'rainCurtains');
    curtains.renderOrder = 2;
    await ctx.yield();

    // ------------------------------------------------------------------ rain, coronets, mist, steam, fireflies
    const pr = rng.fork('particles');
    const nRain = Math.max(200, Math.round(2000 * density * detail * Math.sqrt(LK.rain)));
    const rainU = { uStageInv: HU.uStageInv, uStagePos: HU.uStagePos, uTimeV: HU.uTime, uFlash: HU.uFlash, uRainCol, uBox: { value: V3(800, 520, 800) }, uVel: { value: V3(30, -170, -40) }, uLen: { value: 9 }, uWid: { value: 0.55 }, uGain: { value: LK.streak } };
    const rain = add(quadInstances(nRain, 'aSeed', 4, (i, o) => { o[0] = pr(); o[1] = pr(); o[2] = pr(); o[3] = pr(); }), new THREE.ShaderMaterial({ uniforms: rainU, vertexShader: VERT_RAIN, fragmentShader: FRAG_RAIN, ...PREMULT }), 'rain');
    rain.frustumCulled = false; rain.renderOrder = 4;
    await ctx.yield();
    const nSplash = Math.round(170 * clamp(density, 0.7, 1.3) * detail * (0.3 + 0.7 * LK.rain));
    const splashU = { uTimeV: HU.uTime, uFlash: HU.uFlash, uRainCol, uSize: { value: 6.5 }, uGain: { value: 0.3 + 0.2 * LK.streak } };
    const splash = add(quadInstances(nSplash, 'aSplash', 4, (i, o) => {
      for (let t = 0; t < 30; t++) {
        if (i % 3 === 0) { o[0] = pr.range(-222, 222); o[2] = pr.range(-222, 222); o[1] = 225.7; if (Math.hypot(o[0], o[2]) > 172) break; }
        else { const a = pr() * TAU, r = Math.sqrt(pr()) * 610; o[0] = Math.cos(a) * r; o[2] = Math.sin(a) * r; o[1] = 0.7; if (Math.abs(o[0]) > 275 || Math.abs(o[2]) > 275) break; }
      }
      o[3] = pr();
    }, true), new THREE.ShaderMaterial({ uniforms: splashU, vertexShader: VERT_SPLASH, fragmentShader: FRAG_SPLASH, ...ADD }), 'splashes');
    splash.frustumCulled = false; splash.renderOrder = 3;
    await ctx.yield();
    // puffs
    const puffs = [];
    const puff = (x, y, z, size, mx, my, mz, alpha, life, grow, tint) => puffs.push([x, y, z, size, mx, my, mz, pr(), alpha, 1 / life, grow, tint]);
    const HM = A.hornMouth, HA = A.hornAxis;
    for (let i = 0; i < 14; i++) { const a = pr() * TAU, r = pr.range(20, 105); puff(HM.x + Math.cos(a) * r, HM.y + Math.sin(a) * r * 0.87 + HA.y * 16, HM.z - Math.sin(a) * r * 0.5 + HA.z * 16, pr.range(40, 85), -HA.x * 50, -HA.y * 50, -HA.z * 50, LK.mouthMist, pr.range(7, 11), 0.3, 2); }
    for (let i = 0; i < 26; i++) puff(pr.range(-2900, 2600), pr.range(-500, 1900), pr.range(1300, 2550), pr.range(520, 1100), pr.range(-250, 250), -80, pr.range(-700, -300), 0.036 + 0.024 * LK.rain, pr.range(26, 46), 0.5, 0);
    for (let i = 0; i < 10; i++) puff(R.props.cup.x + pr.range(-12, 12), 64, R.props.cup.z + pr.range(-12, 12), pr.range(16, 26), pr.range(4, 26), pr.range(120, 190), pr.range(-30, 0), 0.2, pr.range(4, 6.5), 2.6, 1);
    if (LK.steam) for (let i = 0; i < 36; i++) puff(pr.range(-2700, 2600), FLOOR_Y + 90, pr.range(-1500, 2300), pr.range(280, 520), pr.range(30, 120), pr.range(300, 480), 0, 0.06, pr.range(14, 24), 1.1, 1);
    const puffMesh = add(quadInstances(puffs.length, ['aBase', 'aMove', 'aMisc'], 4, (i, b, m, c) => { const p = puffs[i]; b.set(p.slice(0, 4)); m.set(p.slice(4, 8)); c.set(p.slice(8, 12)); }),
      new THREE.ShaderMaterial({ uniforms: { ...fogU(), uTimeV: HU.uTime, uTime: HU.uTime, uFlash: HU.uFlash, uPuffA: { value: LK.fog.clone().multiplyScalar(1.2) },
        uPuffB: { value: lookName === 'golden' ? C3(1.0, 0.8, 0.52) : lookName === 'dusk' ? C3(0.3, 0.36, 0.55) : C3(0.82, 0.85, 0.85) },
        uPuffC: { value: lookName === 'dusk' ? LK.fog.clone().multiplyScalar(1.2).lerp(C3(0.3, 0.36, 0.55), 0.25) : C3(1.0, 0.84, 0.56) }, uPuffGain: { value: 1 } }, vertexShader: VERT_PUFF, fragmentShader: FRAG_PUFF, fog: true, ...PREMULT }), 'puffs');
    puffMesh.frustumCulled = false; puffMesh.renderOrder = 5;
    const flyU = { uTimeV: HU.uTime, uFlyCol: { value: LK.flyCol.clone() }, uFlyK: { value: 1 } };
    if (LK.flies) {
      const flies = add(quadInstances(Math.round(300 * detail), 'aFly', 4, (i, o) => {
        for (let t = 0; t < 20; t++) { o[0] = pr.range(-2500, 2500); o[1] = pr.range(-500, 1900); o[2] = pr.range(-1900, 2500); if (Math.hypot(o[0], o[2]) > 420 || o[1] > 700) break; }
        o[3] = pr();
      }), new THREE.ShaderMaterial({ uniforms: flyU, vertexShader: VERT_FLY, fragmentShader: FRAG_FLY, ...ADD }), 'fireflies');
      flies.frustumCulled = false; flies.renderOrder = 4;
    }
    await ctx.yield();
    // spiral threads of mist inside the horn
    const hp = new THREE.Vector3(), hornLen = A.hornThroat.distanceTo(A.hornMouth);
    const spiralU = { uMistCol: { value: lookName === 'dusk' ? HU.uSkyCol.value.clone().lerp(C3(brass[0], brass[1], brass[2]), 0.3).multiplyScalar(0.8) : HU.uSkyCol.value.clone().lerp(C3(1.0, 0.8, 0.46), LK.mistWarm).multiplyScalar(0.9) },
      uMistGain: { value: LK.mistGain / LK.exposure }, uThin: { value: lookName === 'dusk' ? 0 : 1 } };
    const spiral = add(grid(48, 30, false, (u, v, o) => {
      const s = A.portalSeat.depth + 0.03 + (0.99 - A.portalSeat.depth) * v; hornPoint(s, u * TAU, hp);
      const ax = Math.min(s, 1) * hornLen;
      for (let k = 0; k < 3; k++) { const c = 'xyz'[k], axp = A.hornThroat[c] + HA[c] * ax; o.p[k] = axp + (hp[c] - axp) * 0.62; }
      o.d[0] = u; o.d[1] = s;
    }), mat(VERT_STD, FRAG_SPIRAL, spiralU, { side: THREE.DoubleSide, ...ADD }), 'hornMist');
    spiral.renderOrder = 3;
    await ctx.yield();
    // drops streaming down the bore to the portal
    const streamU = { uThroat: HU.uThroat, uHornAxis: HU.uHornAxis, uHX: HU.uHX, uHY: HU.uHY, uTimeV: HU.uTime, uFlash: HU.uFlash, uStream: { value: 0 }, uGain: { value: 1 },
      uAx0: { value: A.portalSeat.depth * hornLen + 1 }, uAx1: { value: hornLen + 70 }, uRainCol: { value: lookName === 'dusk' ? C3(0.5, 0.62, 1.0) : lookName === 'golden' ? C3(1.3, 0.95, 0.46) : C3(1.0, 0.9, 0.64) } };
    const stream = add(quadInstances(Math.round(240 * detail), 'aSeed', 4, (i, o) => { o[0] = pr(); o[1] = Math.sqrt(pr()); o[2] = pr(); o[3] = pr(); }),
      new THREE.ShaderMaterial({ uniforms: streamU, vertexShader: VERT_STREAM, fragmentShader: FRAG_RAIN, ...PREMULT }), 'boreDrops');
    stream.frustumCulled = false; stream.renderOrder = 4;
    await ctx.yield();
    // the coronet where the scripted drip lands (hidden until its moment)
    const corU = { uCor: { value: 0 } }, landing = V3(A.dripLanding.x, A.recordY, A.dripLanding.z);
    const coronet = add(buildCoronetGeometry(pr), mat(VERT_CORONET, FRAG_CORONET, corU, { side: THREE.DoubleSide, ...PREMULT }), 'coronet');
    coronet.frustumCulled = false; coronet.renderOrder = 2; coronet.visible = false; coronet.position.copy(landing);
    await ctx.yield();

    // ------------------------------------------------------------------ creatures
    // the hummingbird (or a blue morpho) at the horn's upper right rim, outside the bell so the throat stays clear
    const X1 = V3(1, 0, 0), UP = V3(0, 1, 0), HUv = new THREE.Vector3().crossVectors(HA, X1).normalize();
    const TH0 = 0.5, radial = X1.clone().multiplyScalar(Math.cos(TH0)).addScaledVector(HUv, Math.sin(TH0)), tang = X1.clone().multiplyScalar(-Math.sin(TH0)).addScaledVector(HUv, Math.cos(TH0));
    const hoverPt = HM.clone().addScaledVector(HA, 36).addScaledVector(radial, 100), hoverF = radial.clone().multiplyScalar(0.55).addScaledVector(tang, -0.75).addScaledVector(HA, -0.36).normalize();
    const bez = (t, out) => out.copy(hoverPt).multiplyScalar((1 - t) * (1 - t)).addScaledVector(dartQ, 2 * t * (1 - t)).addScaledVector(dartE, t * t);
    const bird = new THREE.Group(); bird.name = morpho ? 'morpho' : 'hummingbird'; stage.add(bird);
    let morphoWings = null;
    if (morpho) {
      const g = buildMorpho();
      add(g.body, propMat, 'morphoBody', bird);
      morphoWings = [1, -1].map((sx) => { const piv = new THREE.Group(); piv.scale.x = sx; bird.add(piv); add(g.wing, propMat, 'morphoWing', piv); return piv; });
      bird.scale.setScalar(0.9);
    } else {
      bird.scale.setScalar(0.78);
      const g = buildHummingbird(R);
      add(g.body, propMat, 'hummingbirdBody', bird);
      const w = add(g.wings, mat(VERT_STD, FRAG_WING, { uWingCol: { value: HU.uSkyCol.value.clone().lerp(C3(1, 1, 1), 0.45).multiplyScalar(lookName === 'dusk' ? 1.5 : 0.95) } }, { side: THREE.DoubleSide, ...PREMULT }), 'hummingbirdWings', bird);
      w.renderOrder = 3;
    }
    await ctx.yield();
    // it leaves the rim as we line up on the axis, darts down and across under the throat's point of light, hangs in
    // the lower left of the mouth leading us in, and slips away over the rim as we reach it
    const uDart = U.axis + 0.03, dartLen = 0.04, uLead = uDart + dartLen, uAway = U.mouth - 0.095, uGone = U.mouth - 0.05;
    const dartQ = HM.clone().addScaledVector(HA, 70).addScaledVector(HUv, -125).addScaledVector(X1, 46);
    const dartE = HM.clone().addScaledVector(HA, 12).addScaledVector(HUv, -34).addScaledVector(X1, -56);
    const leadE = morpho ? HM.clone().addScaledVector(HA, -22).addScaledVector(HUv, -44).addScaledVector(X1, -70) : HM.clone().addScaledVector(HA, -10).addScaledVector(HUv, -30).addScaledVector(X1, -46);
    const awayQ = HM.clone().addScaledVector(HA, 6).addScaledVector(HUv, -70).addScaledVector(X1, -150), awayE = HM.clone().addScaledVector(HA, 60).addScaledVector(HUv, -30).addScaledVector(X1, -260);
    const bez2 = (a, q, b, t, out) => out.copy(a).multiplyScalar((1 - t) * (1 - t)).addScaledVector(q, 2 * t * (1 - t)).addScaledVector(b, t * t);
    const bP = new THREE.Vector3(), bF = new THREE.Vector3(), bX = new THREE.Vector3(), bY = new THREE.Vector3(), bM = new THREE.Matrix4(), bPrev = new THREE.Vector3();
    const face = (obj, f, roll = 0) => {
      bF.copy(f).normalize(); bX.crossVectors(UP, bF).normalize(); bY.crossVectors(bF, bX);
      obj.quaternion.setFromRotationMatrix(bM.makeBasis(bX, bY, bF)); if (roll) obj.rotateZ(roll);
    };
    // the parrot (or a pair of canaries) in the cage on the back wall
    const birds = [], birdYaw = Math.atan2(-R.cageSide.z, R.cageSide.x);
    {
      const kinds = canaries ? [[0.72, -64, 1], [0.64, 60, -1]] : [[0.88, 0, 1]];
      const bk = lookName === 'dusk' ? 2.3 : 1;                 // in the blue dusk its plumage is the one green (or yellow) thing left
      const g = canaries ? buildBird(mul([0.72, 0.56, 0.08], bk), mul([0.8, 0.66, 0.12], bk), [0.62, 0.42, 0.3], mul([0.5, 0.42, 0.1], bk)) : buildBird(mul([0.05, 0.36, 0.1], bk), mul([0.3, 0.42, 0.06], bk), [0.6, 0.56, 0.42], mul([0.04, 0.2, 0.12], bk));
      for (const [sc, x0, dir] of kinds) {
        const grp = new THREE.Group(); grp.scale.setScalar(sc * 1.15 * R.cageK); stage.add(grp);
        add(g.body, propMat, 'cageBird', grp);
        const wings = [1, -1].map((sx) => { const piv = new THREE.Group(); piv.position.set(sx * 24, 80, -2); piv.scale.x = sx; grp.add(piv); add(g.wing, propMat, 'cageBirdWing', piv); return piv; });
        birds.push({ grp, wings, x0, dir, ph: pr() * 6 });
      }
    }
    await ctx.yield();
    // the gecko on the deck, right of the entry path
    const gecko = add(await buildGecko(R), swayMat, 'gecko'); gecko.frustumCulled = false;
    const gk0 = V3(-206, 225.4, -50), gk1 = V3(-214, 225.4, 105), gk2 = V3(-166, 225.4, 180.5), gkBolt = V3(70, 225.4, 198), gkP = new THREE.Vector3(), gkT = new THREE.Vector3();
    await ctx.yield();

    // ------------------------------------------------------------------ scripted beats, keyed to u
    const rideSpan = U.ride1 - U.ride0;
    // the drip: it swells on the horn's lip, falls and lands on the shellac ahead and to the right of the soundbox at
    // uLand, throwing up a coronet whose bead the record then carries under us; the lightning comes later in the ride
    const uLand = 0.2462, corSpan = 0.012, dripSpan = 0.03, dripFall = 0.5 + Math.sqrt(Math.max(A.dripLip.y - 4.6 - A.recordY - 0.6, 1) / 20) / 4;
    const uDrip = uLand - Math.min(dripFall, 1) * dripSpan, uFlash = U.ride0 + 0.8 * rideSpan;
    const flashAt = (u) => (u < uFlash ? 0 : smoothstep(uFlash, uFlash + 0.0022, u) * Math.exp(-Math.max(u - uFlash - 0.0022, 0) / 0.0045));

    // ------------------------------------------------------------------ gaze
    const gE = new THREE.Vector3(), g1 = new THREE.Vector3(), g2 = new THREE.Vector3(), g3 = new THREE.Vector3(), g4 = new THREE.Vector3(), g5 = new THREE.Vector3();
    const hornGaze = (time, u) => toWorld(g5.copy(HM).addScaledVector(HUv, -66 * (1 - smoothstep(U.axis + 0.012, U.axis + 0.085, u))), time, u, g4);
    const rideGaze = (time, u) => {
      const k = tab(kT, u), yaw = key3(GAZES[0][0], GAZES[1][0], GAZES[2][0], k) + 0.02 * Math.sin(time * 0.37), pitch = key3(GAZES[0][1], GAZES[1][1], GAZES[2][1], k) + 0.012 * Math.sin(time * 0.53);
      rideEye(k, gE);
      gE.x += Math.sin(yaw) * Math.cos(pitch) * 260; gE.y += Math.sin(pitch) * 260; gE.z += Math.cos(yaw) * Math.cos(pitch) * 260;
      return toWorld(gE, time, u, g1);
    };
    const gardenPt = V3(-250, 430, FRONT_Z - 100), hammockPt = V3(R.ham.x - 150, R.ham.y - R.ham.sag + POI.hamY, -40), cagePt = V3(R.cage.x, R.cage.y + POI.cageY, R.cage.z), g6 = new THREE.Vector3();
    const pois = [
      { at: rideGaze, from: U.settle - 0.04, to: U.free + 0.04, weight: 0.92, fade: 0.12 },
      { at: (time, u) => toWorld(gardenPt, time, u, g2), from: U.free + 0.004, to: U.turn0 - 0.01, weight: 0.72, fade: 0.25 },
      { at: (time, u) => toWorld(hammockPt, time, u, g3), from: U.turn0 + POI.h0, to: lerp(U.turn0, U.turn1, POI.h1), weight: POI.hw, fade: 0.3 },
      { at: (time, u) => toWorld(cagePt, time, u, g6), from: lerp(U.turn0, U.turn1, POI.c0), to: U.axis + POI.c1, weight: POI.cw, fade: 0.3 },
      { at: hornGaze, from: lerp(U.turn0, U.turn1, POI.n0), to: U.mouth - 0.015, weight: 0.86, fade: POI.nf },
    ];

    const tmp = new THREE.Vector3();
    // lingering on the needle and again through the turn; paceK turns a step in u into seconds (the engine scales
    // pace so that the flight still lasts DUR)
    const paceAt = (u) => 1 - 0.24 * rideWin(u) + 0.2 * smoothstep(U.free, U.free + 0.05, u) * (1 - smoothstep(U.turn0 - 0.06, U.turn0 - 0.01, u))
      - 0.3 * smoothstep(U.turn0 - 0.01, U.turn0 + 0.03, u) * (1 - smoothstep(U.turn1 - 0.01, U.axis, u));
    let paceK = 0;
    for (let i = 0; i < 65; i++) paceK += 1 / clamp(paceAt(i / 64), 0.35, 2.5);
    paceK = paceK / 65 / DUR;
    return {
      scene, path, duration: DUR,
      pace: paceAt,
      camera: { fov: 62, near: 1, far: 7800, lookAhead: 14, sway: 0.35, bank: 0.25 },
      pois,
      portal: { shape: 'circle', radius: A.portalSeat.radius, color: LK.portal, glow: 0.22, tilt: true, revealDistance: 620 },
      post: { exposure: LK.exposure, bloom: LK.bloom, grade: { saturation: LK.saturation, contrast: 1.05, tint: LK.tint, shadowTint: LK.shadowTint, vignette: 0.3, grain: 0.02, aberration: 0 } },
      ride: 'none',
      beats: { ...U, drip: uDrip, land: uLand, flash: uFlash, dart: uDart, lead: uLead, away: uAway, gone: uGone, hammock: U.turn0 + 0.03, cage: lerp(U.turn0, U.turn1, 0.75), look: lookName, rare, morpho, canaries, hamStriped },
      update(dt, time, camera, u) {
        const k = tab(kT, u);
        stage.rotation.y = tab(phiT, u);
        stage.position.y = swellAt(time, u);
        // the needle creeps inward; on the rare visit lightning makes it skip three grooves
        const fl = rare ? flashAt(u) : 0;
        const jolt = rare && u > uFlash ? smoothstep(uFlash, uFlash + 0.0012, u) : 0, since = Math.max(u - uFlash, 0);
        const skip = jolt * (3 + 5.5 * Math.exp(-since / 0.006) * (0.6 + 0.4 * Math.cos(since * 900)));
        hero.setNeedle(82 - 12 * k - skip);
        hero.setHop(jolt * 5 * Math.exp(-since / 0.0035) * Math.abs(Math.cos(since * 520)));
        hero.setFlash(fl * 0.38);
        uBolt.value = fl;
        const dp = (u - uDrip) / dripSpan;
        hero.setDrip(dp > 0 && dp < 1 ? Math.max(dp, 0.002) : 0);
        // the coronet: its shape is keyed to u; the record carries it (and the bead it leaves) round with the grooves
        const cs = (u - uLand) / corSpan;
        coronet.visible = cs > 0 && cs < 7;
        if (coronet.visible) {
          corU.uCor.value = Math.min(cs, 1);
          const since = (u - uLand) / (paceAt(uLand) * paceK), turn = hero.recordAngle(time) - hero.recordAngle(time - since);
          rotY(landing, turn, coronet.position);
          coronet.position.y = A.recordY + hero.warpAtXZ(time, coronet.position.x, coronet.position.z) + 0.2;
        }
        hero.update(dt, time, camera);
        // set dressing
        const gust = Math.sin(time * 0.55) + 0.3 * Math.sin(time * 1.9);
        const open = 0.52 + 0.2 * gust;
        leaf.rotation.y = ajarSide ? Math.PI + open : -open;
        fan.rotation.y = time * 1.15;
        ham.rotation.x = 0.075 * Math.sin(time * 0.8) + 0.018 * Math.sin(time * 2.1 + 1);
        rainU.uGain.value = LK.streak * (1 - smoothstep(U.mouth - 0.07, U.mouth - 0.015, u));
        streamU.uStream.value = smoothstep(U.mouth - 0.11, U.mouth - 0.03, u);
        flyU.uFlyK.value = 1 + 0.8 * smoothstep(U.free, U.turn0, u) * (1 - smoothstep(U.axis, U.axis + 0.06, u));
        // the caged bird side-steps along its perch and bobs with the swell; lightning makes it flap
        const swell = Math.sin(HU.uSwell.value * TAU), fright = rare ? smoothstep(uFlash, uFlash + 0.004, u) * (1 - smoothstep(uFlash + 0.03, uFlash + 0.06, u)) : 0;
        for (const b of birds) {
          const st = time * 0.22 + b.ph, cyc = Math.floor(st), f = st - cyc, side = cyc % 2 ? -1 : 1;
          const hop = smoothstep(0.55, 0.75, f), x = b.x0 + b.dir * side * lerp(-48, 48, hop) * (canaries ? 0.4 : 1);
          b.grp.position.set(R.cage.x + R.cageSide.x * x, R.cage.y - 50 * R.cageK + 8 + 13 * Math.sin(Math.PI * hop) * (hop < 1 ? 1 : 0) + 5 * swell + 20 * fright * Math.abs(Math.sin(time * 9)), R.cage.z + R.cageSide.z * x);
          b.grp.rotation.y = birdYaw + b.dir * 0.35 * Math.sin(time * 0.31 + b.ph) + 0.25 * side;
          b.grp.rotation.x = 0.1 * swell;
          const flap = fright * (0.9 + 0.8 * Math.sin(time * 26));
          b.wings[0].rotation.z = -1.38 + flap * 1.5; b.wings[1].rotation.z = 1.38 - flap * 1.5;
        }
        // the hummingbird hovers, probes and backs off; at uDart it darts across in front of the camera and away
        const sD = (u - uDart) / dartLen;
        bird.visible = u < uGone;
        if (sD <= 0) {
          const probe = 14 + 12 * Math.sin(time * 1.3) * Math.sin(time * 0.37 + 1);
          bP.copy(hoverPt).addScaledVector(hoverF, 12 - probe);
          bP.x += 2.5 * Math.sin(time * 5.3); bP.y += 3 * Math.sin(time * 3.7 + 1) + (morpho ? 9 * Math.sin(time * 4.4) : 0); bP.z += 2 * Math.sin(time * 4.1 + 2);
          bird.position.copy(bP);
          face(bird, tmp.copy(hoverF).addScaledVector(HA, 0.12 * Math.sin(time * 0.6)), 0.12 * Math.sin(time * 2.3));
        } else if (sD < 1) {
          const s = sD * sD * (3 - 2 * sD), s1 = Math.min(s + 0.02, 1.02);
          bez(s, bP); bez(s1, bPrev);
          bird.position.copy(bP);
          face(bird, tmp.subVectors(bPrev, bP).normalize().lerp(morpho ? bF.copy(HA).multiplyScalar(-1).addScaledVector(X1, -0.5) : bF.copy(X1).addScaledVector(HA, -0.3).addScaledVector(HUv, 0.25), smoothstep(0.7, 1, s)), -0.5 * Math.sin(Math.PI * s));
        } else if (u < uAway) {
          // leading in: it hangs before the mouth, drifting inward, and flutters
          const sL = (u - uLead) / (uAway - uLead), w = smoothstep(0, 0.25, sL);
          bP.copy(dartE).lerp(leadE, sL * sL * (3 - 2 * sL));
          bP.x += w * 5 * Math.sin(time * 2.9); bP.y += w * (4 * Math.sin(time * 3.7 + 1) + (morpho ? 8 * Math.sin(time * 4.4) : 0)); bP.z += w * 3 * Math.sin(time * 2.3 + 2);
          bird.position.copy(bP);
          if (morpho) face(bird, tmp.copy(HA).multiplyScalar(-1).addScaledVector(X1, -0.5 + 0.2 * Math.sin(time * 0.9)), 0.15 * Math.sin(time * 2.3));
          else face(bird, tmp.copy(X1).addScaledVector(HA, -0.3).addScaledVector(HUv, 0.25 + 0.1 * Math.sin(time * 0.9)), -0.1 * w + 0.08 * Math.sin(time * 2.3));
        } else {
          const sA = clamp((u - uAway) / (uGone - uAway), 0, 1), s = sA * sA, s1 = Math.min(s + 0.02, 1.02);
          bez2(leadE, awayQ, awayE, s, bP); bez2(leadE, awayQ, awayE, s1, bPrev);
          bird.position.copy(bP);
          face(bird, tmp.subVectors(bPrev, bP).normalize().lerp(morpho ? bF.copy(HA).multiplyScalar(-1).addScaledVector(X1, -0.5) : bF.copy(X1).addScaledVector(HA, -0.3).addScaledVector(HUv, 0.25), 1 - smoothstep(0, 0.3, s)), (morpho ? 0 : -0.1 * (1 - smoothstep(0, 0.3, s))) + 0.4 * Math.sin(Math.PI * s));
        }
        if (morphoWings) { const fa = 0.15 + 1.05 * Math.abs(Math.sin(time * 4.4)); morphoWings[0].rotation.z = fa; morphoWings[1].rotation.z = -fa; }
        // the gecko runs as the camera comes in, round the record to a place beyond its front rim, and lies there
        // through the ride; when lightning strikes it bolts across the deck
        const run = smoothstep(0.012, 0.062, u), r1 = 1 - run;
        gkP.copy(gk0).multiplyScalar(r1 * r1).addScaledVector(gk1, 2 * run * r1).addScaledVector(gk2, run * run);
        gkT.copy(gk1).sub(gk0).multiplyScalar(r1).addScaledVector(tmp.copy(gk2).sub(gk1), run);
        const flee = rare ? smoothstep(uFlash + 0.0015, uFlash + 0.03, u) : 0, busy = Math.sin(Math.PI * run) + Math.sin(Math.PI * flee);
        if (flee > 0) { gkT.lerp(tmp.copy(gkBolt).sub(gk2), Math.min(1, flee * 6)); gkP.lerp(gkBolt, flee); }
        const wig = Math.sin((run * 250 + flee * 240) * 0.09);
        gecko.position.copy(gkP);
        gecko.rotation.y = Math.atan2(gkT.x, gkT.z) + 0.36 * smoothstep(0.7, 1, run) * (1 - flee) + 0.22 * wig * busy + 0.03 * Math.sin(time * 0.7) - 2.25 * (1 - smoothstep(0.008, 0.03, u));
      },
      dispose() { hero.dispose?.(); },
    };
  },
};
