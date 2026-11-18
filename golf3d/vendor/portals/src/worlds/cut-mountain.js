// THE CUT MOUNTAIN: a naturalist's hand-coloured copperplate of an equatorial volcano cut in half like a
// diagram. We fly as the hen of a pair of condors (our own primaries show at the lower corners of the frame):
// down an aisle of wax palms toward the seam foot, one climbing curve over the living flank, out over the cut
// edge and north along the page while four engraved specimens take their wash and leave the paper, then up
// the knife ridge (living slope left, paper precipice right) to a ring in the crater-lip notch.
// Round 3: the page pass stands 20 to 50 m off the face and looks back at it, so the section reads as a diagram (tinted
// beds, roots, caves and burrows with their animals, a lava conduit, eleven plates); roots hang down the face; the plain
// to the east is ruled in fields; the herd fans out and quarters across the slope; only one wingtip shows.
// Round 4: we come in from the south-east, out in front of the section, so the first picture is the whole cut face framed
// by parted wax palms (beds in wash, the vermilion seam, a lava stream down the living flank from a breach in the lip),
// then swing west over the forest with the gaze held on the smoking lip. The stream, three tors and a gaze shared between
// the herd and the summit compose the ridge. Everything staged in rounds 1 to 3 is keyed to 'legacy u' (u along the older,
// shorter line): toL / frL convert, DL(uL) is metres along today's path.
// Round 11: what the design has and the site lacked, each by a rule of the world along its whole band (no key in the
// flight fraction, no table of positions). The arenal (310 to 380 m) is pale stippled ash with Azorella cushions, and the
// vicunas wait on it, break as we come up to it and gallop up it 11 m to our left, their place decided from the camera's
// own place along their trail; frailejones stand over the whole paramo band; dark rock ribs break through the snow down the
// fall lines by a rule of the ground (the hero's ribField) with bodies of rock on them; seven primaries show at each lower
// corner; the forest leg is drawn open, boughs dark on pale stipple banks, cinchonas in pink flower. The ribs, cushions and
// added frailejones are the hero's (src/parts/cut-mountain.js); the herd, the wingtips, the banks and the cinchonas are here.
// Round 12: the vicunas fill the ash (strung out in twos and threes over its lower two thirds, each breaking as we come
// within its own lead of it, so that the gallop runs up the herd beside us); the forest ground is drawn in four densities
// of line and carries an understorey of fern rosettes and tree-fern crowns by a rule of the map distance from the line;
// the horns are drawn light side and shaded side in crisp line (the hero's ground); the wingtips take their size from the
// smaller side of the picture; the upper mountain's detail comes out over a band of the eye's distance, not at a switch;
// the banks behind the forest trees stand.
// World space is the hero's local space: north is -Z, east is +X, the cut plane is x = 0.
// Everything is one unlit 'plate' shader family (see src/parts/cut-mountain.js): no lights, no fog, no bloom.

import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { buildHero, PLATE_COMMON, plateKit } from '../parts/cut-mountain.js';

const { makeAcc, vtx, accGeometry, accTube, accRibbon, accDome, instancePlants, plateMaterial, thin, PLANT_FRAG, PAGE_LIB, FOG_V, FOG_F, FRAG_END } = plateKit;
const TAU = Math.PI * 2;

// ---------------------------------------------------------------- the engraver's ruled sky
const SKY_VERT = /* glsl */ `
varying vec3 vDir;
void main(){ vDir = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position, 1.); }`;
const SKY_FRAG = /* glsl */ `
varying vec3 vDir;
uniform vec4 uCone; uniform vec3 uSky; uniform vec3 uFar;   // uCone: azimuth, half width, height, plume side; uSky: rule density, cloud level, drift; uFar: seed, height, tint
${PLATE_COMMON}
void main(){
  vec3 d = normalize(vDir);
  float el = asin(clamp(d.y, -1., 1.));
  float az = atan(d.x, -d.z + (abs(d.x) + abs(d.z) < 1e-5 ? 1e-5 : 0.));
  // level rules, closer together toward the zenith, with a slight burr
  float c0 = pow(max(el, 0.) + 1e-4, 1.5)*uSky.x;
  float fc = max(fwidth(c0), 1e-5);
  float c = c0 + 0.1*(vnoise(vec2(az*24., el*30.)) - 0.5);
  float k = floor(c + 0.5);
  float ln = lineAA(c - k, fc, 0.6);
  ln = mix(ln, 0.17, smoothstep(0.28, 0.6, fc));
  ln *= smoothstep(0.004, 0.02, el)*(0.72 + 0.28*step(0.2, vnoise(vec2(az*9. + k*3.1, k*0.7))));
  // cloud shapes left blank, with a few contour strokes on their undersides; they slide through the ruling
  vec2 q0 = d.xz/(max(d.y, 0.) + 0.22)*0.85;
  vec2 q = q0 + uSky.z*uTime*vec2(-0.9, 0.42);
  float n = 0.62*vnoise(q) + 0.38*vnoise(q*2.7 + 5.);
  vec2 qU = q - q0*0.06;
  float nU = 0.62*vnoise(qU) + 0.38*vnoise(qU*2.7 + 5.);
  float fn = max(fwidth(n), 1e-5);
  float band = smoothstep(0.03, 0.14, el);
  float m = smoothstep(uSky.y - 0.012, uSky.y + 0.012, n)*band;
  float under = smoothstep(0., 0.012, nU - n);
  float outl = lineAA(n - uSky.y, fn, 0.8)*(0.3 + 0.7*under)*step(0.3, vnoise(q*6.));
  float inner = max(lineAA(n - uSky.y - 0.04, fn, 0.6)*step(0.45, vnoise(q*5. + 3.)),
                    lineAA(n - uSky.y - 0.085, fn, 0.6)*step(0.6, vnoise(q*4. + 8.)))*under;
  // a cloud is a blank top over a ruled base: the ruling runs on through its underside, with a thin shade wash
  float baseK = smoothstep(0.0, 0.02, nU - n)*(1. - smoothstep(0.03, 0.12, n - uSky.y))*m;
  float ink = max(ln*(1. - m*(1. - 0.85*baseK)), max(outl, inner*0.8)*band);
  // a second cone on the horizon, in outline only, trailing a ruled plume
  float da = az - uCone.x;
  float sx = da/uCone.y;
  float prof = uCone.z*pow(max(1. - abs(sx), 0.), 1.55);
  float e = el - prof;
  float fe = max(fwidth(e), 1e-5);
  float inC = step(abs(sx), 1.)*step(0., el);
  float cone = lineAA(e, fe, 0.9)*inC;
  float tk = step(e, 0.)*step(-0.02 - 0.03*h11(floor(sx*40.)), e)*lineAA((fract(sx*40.) - 0.5)/40.*uCone.y, max(fwidth(az), 1e-5), 0.5)*step(0.3, sx*uCone.w)*inC;
  float ps = sx*uCone.w;                                   // along the plume
  float pw = max(0.006 + 0.016*ps, 1e-3);
  float py = (el - uCone.z - 0.012*ps - 0.006*sin(ps*5. - uTime*0.25))/pw;
  float pm = step(0.02, ps)*step(abs(py), 1.)*(1. - smoothstep(2.2, 3.4, ps));
  float pl = lineAA((fract(py*2.5 + 0.5) - 0.5)*pw/2.5, max(fwidth(el), 1e-5), 0.55)*step(0.25, vnoise(vec2(ps*9. - uTime*0.2, floor(py*2.5 + 0.5))));
  ink = max(ink*(1. - step(e, 0.)*inC)*(1. - pm), max(cone, max(tk, pl*pm))*0.9);
  // the far cordillera, all round the horizon: two ranges in outline and hachure under flat verditer tints (the second
  // plate), snow left as paper on the highest tops, standing in a sea of cloud that fills everything below the horizon
  float fel = max(fwidth(el), 1e-5), faz = max(fwidth(az), 1e-5);
  float rg2 = 1. - abs(2.*vnoise(vec2(az*6. + uFar.x, 1.3)) - 1.), rg2b = 1. - abs(2.*vnoise(vec2(az*19. + uFar.x, 4.1)) - 1.);
  float rg1 = 1. - abs(2.*vnoise(vec2(az*11. + uFar.x, 2.9)) - 1.);
  float r2p = uFar.y*(0.012 + 0.05*rg2*rg2 + 0.016*rg2b + 0.035*pow(vnoise(vec2(az*2.6 + uFar.x, 7.7)), 3.));
  float r1p = uFar.y*(0.004 + 0.022*rg1 + 0.008*vnoise(vec2(az*37. + uFar.x, 6.3)));
  float e2 = el - r2p, e1 = el - r1p;
  float in2 = 1. - smoothstep(-fel, fel, e2), in1 = 1. - smoothstep(-fel, fel, e1);
  float deck = 1. - smoothstep(-0.008, 0.002, el + 0.014*(vnoise(vec2(az*13., 2.)) - 0.6));
  float c2 = az*150. + e2*260., c1 = az*230. - e1*400.;                      // shading strokes that lean, one way on each range
  float k2 = floor(c2), k1 = floor(c1);
  float hs2 = lineAA((fract(c2) - 0.5)/150., faz + fel*1.74, 0.6)*step(-0.008 - 0.03*h11(k2), e2)*step(0.45, h11(k2 + 7.))*in2;
  float hs1 = lineAA((fract(c1) - 0.5)/230., faz + fel*1.74, 0.6)*step(-0.004 - 0.014*h11(k1 + 3.), e1)*step(0.4, h11(k1 + 11.))*in1;
  float snowF = smoothstep(0.05, 0.058, el/max(uFar.y, 1e-3));
  float gdist = 1./max(0.02 - el, 0.02);
  vec2 gq = vec2(sin(az), -cos(az))*gdist*0.55 + uSky.z*uTime*vec2(-0.5, 0.3);
  float dn = 0.6*vnoise(gq) + 0.4*vnoise(gq*2.3 + 3.);
  float fdn = max(fwidth(dn), 1e-5);
  float dl = lineAA(fract(dn*7.) - 0.5, fdn*7., 0.7)*step(0.35, vnoise(gq*3.))*(1. - smoothstep(0.1, 0.3, fdn*7.));
  float rangeInk = max(max(lineAA(e2, fel, 0.9), hs2*0.6)*(1. - in1), max(lineAA(e1, fel, 1.0), hs1*0.7));
  ink = mix(ink*(1. - max(in2, in1)), dl*0.5, deck);
  ink = max(ink, rangeInk*(1. - deck));
  vec3 tint = mix(vec3(1.), mix(vec3(1.), uShade, 0.42*(1. - snowF)), in2*(1. - in1));
  tint = mix(tint, mix(vec3(1.), uShade, 0.7), in1);
  tint = mix(tint, mix(vec3(1.), uShade, 0.22*smoothstep(0.42, 0.6, dn)), deck);
  tint = mix(vec3(1.), tint, uFar.z)*mix(vec3(1.), uShade, 0.3*baseK*(1. - max(max(in2, in1), deck)));
  float fib = 0.035*(vnoise(vec2(az*60., el*90.)) - 0.5) + 0.03*(vnoise(vec2(az*7., el*9.) + 3.) - 0.5);
  vec3 col = mix(uPaper*(1. - fib)*tint, mix(uInk, uHalf, 0.6), clamp(ink, 0., 1.)*0.8);
  gl_FragColor = vec4(col, 1.);
}`;

// ---------------------------------------------------------------- creatures: instanced, animated in the vertex shader
// Model space: forward -Z, up +Y, right +X. aAnim = (type, weight, phase offset, -): 1 wing (bends up about the
// long axis through aPivot, signed weight), 2 leg (steps: see the shader), 3 neck (nods), 4 flutter.
// Per instance: aIPos (xyz, scale; scale 0 hides), aIQuat, aIAnim (phase, amplitude, tone, wing offset).
const CREATURE_VERT = /* glsl */ `
attribute vec3 aCol; attribute vec4 aInfo; attribute float aEdge; attribute vec4 aAnim; attribute vec3 aPivot;
attribute vec4 aIPos; attribute vec4 aIQuat; attribute vec4 aIAnim;
varying vec2 vUv; varying vec3 vCol; varying vec3 vN; varying vec3 vNv; varying vec3 vVp; varying vec4 vInfo;
varying float vEdge; varying float vDist; varying float vTone; varying float vSnow;
${FOG_V}
vec3 qrot(vec4 q, vec3 v){ return v + 2.*cross(q.xyz, cross(q.xyz, v) + q.w*v); }
void main(){
  vec3 p = position, n = normal;
  float ty = aAnim.x, ph = aIAnim.x + aAnim.z;
  vec3 r = p - aPivot;
  if (ty > 0.5 && ty < 1.5) {
    float a = aAnim.y*(sin(ph)*aIAnim.y + aIAnim.w);
    float c = cos(a), s = sin(a);
    p = aPivot + vec3(r.x*c - r.y*s, r.x*s + r.y*c, r.z);
    n = vec3(n.x*c - n.y*s, n.x*s + n.y*c, n.z);
  } else if (ty > 1.5 && ty < 2.5) {
    // (round 11) a leg that keeps its hoof where it was set down. One stride is 4.27 m of the animal's own length: for
    // the first three tenths of it the hoof stands on the ground and the leg is sheared back from the hip at exactly the
    // pace the body goes forward (0.64 m either side of the hip), then it is lifted and carried forward again.
    // aIAnim.y: the length of the step (1 at the gallop, a quarter of that standing).
    float cyc = fract(ph/6.2831853), tW = clamp((cyc - 0.3)/0.7, 0., 1.);
    float st = step(cyc, 0.3);
    float back = mix(1. - 2.*tW*tW*(3. - 2.*tW), 2.*cyc/0.3 - 1., st);
    float lift = (1. - st)*sin(3.14159265*tW);
    float w = aAnim.y;
    p.z += w*back*0.64*aIAnim.y - w*(1. - w)*lift*0.5*aIAnim.y;        // (the knee comes forward as the hoof is lifted)
    p.y += w*w*lift*0.3*aIAnim.y*aIAnim.y;
  } else if (ty > 2.5 && ty < 3.5) {
    float a = aAnim.y*(0.1*sin(ph)*aIAnim.y + aIAnim.w);
    float c = cos(a), s = sin(a);
    p = aPivot + vec3(r.x, r.y*c - r.z*s, r.y*s + r.z*c);
  } else if (ty > 3.5) {
    p.y += aAnim.y*sin(ph)*aIAnim.y;
  }
  vec3 wp = aIPos.xyz + qrot(aIQuat, p*aIPos.w);
  vec3 wn = qrot(aIQuat, n);
  vec4 mvPosition = modelViewMatrix*vec4(wp, 1.);
  vN = wn; vNv = mat3(modelViewMatrix)*wn; vVp = mvPosition.xyz;
  vUv = uv; vCol = aCol; vInfo = aInfo; vEdge = aEdge; vDist = length(mvPosition.xyz); vTone = aIAnim.z; vSnow = 0.;
  gl_Position = projectionMatrix*mvPosition;
  if (aIPos.w <= 0.) gl_Position = vec4(0., 0., 3., 1.);
  #include <fog_vertex>
}`;

// ---------------------------------------------------------------- stipple mist cards (opaque, dithered: no blending)
const MIST_VERT = /* glsl */ `
attribute vec3 aBase; attribute vec4 aSeed;      // aSeed: size, aspect, seed, drift rate (0: a fixed card that never parts; under 0: one that drifts and thins but never clears)
uniform vec3 uDrift; uniform float uTime;
varying vec2 vQ; varying float vSeed; varying float vDist; varying float vFade; varying float vSize; varying float vPart;
void main(){
  float life = aSeed.w != 0. ? fract(uTime*abs(aSeed.w) + aSeed.z) : 0.5;
  // (round 12) a bank that stands behind a tree (aSeed.w under 0) does not travel and is not reborn: it sways about its
  // own place by under a third of its own height (so it stays behind its tree) and breathes between about two thirds
  // and the whole of its strength, never less, whatever the clock says. The other cards drift and part as before.
  float bank = step(aSeed.w, -1e-6), swing = sin(6.2831853*life);
  vec3 c = aBase + uDrift*aSeed.x*mix((life - 0.5)*1.6, 0.3*swing, bank);
  vec4 mv = modelViewMatrix*vec4(c, 1.);
  mv.xy += position.xy*vec2(aSeed.x*aSeed.y, aSeed.x);
  vQ = position.xy*vec2(aSeed.y, 1.); vSeed = aSeed.z; vDist = length(mv.xyz); vSize = aSeed.x; vPart = aSeed.w > 0. ? 1. : (aSeed.w < 0. ? 0.5 : 0.);
  vFade = mix(smoothstep(0., 0.2, life)*(1. - smoothstep(0.8, 1., life)), 0.84 + 0.16*sin(6.2831853*life + 1.3), bank);
  gl_Position = projectionMatrix*mv;
}`;
const MIST_FRAG = /* glsl */ `
varying vec2 vQ; varying float vSeed; varying float vDist; varying float vFade; varying float vSize; varying float vPart;
uniform float uMistNear, uMistDots;
${PLATE_COMMON}
float dots(vec2 g, float dens){
  vec2 i = floor(g); vec2 c = fract(g) - 0.5 - 0.6*(vec2(h21(i), h21(i + 3.)) - 0.5);
  return (1. - smoothstep(0.13, 0.2, length(c)))*step(h21(i + 9.), dens);
}
void main(){
  vec2 wq = vQ*vSize;
  float fw = max(max(fwidth(wq.x), fwidth(wq.y)), 1e-5);
  float d = length(vQ*vec2(0.5, 1.15));
  float n = 0.6*vnoise(vQ*1.6 + vSeed*17.) + 0.4*vnoise(vQ*4.3 + vSeed*3.);
  float body = (1. - d + (n - 0.5)*0.75)*vFade;
  float near = mix(1., smoothstep(uMistNear, uMistNear*3., vDist), vPart);
  float core = body*near;                                   // the blank parts as we come up to it
  float fb = max(fwidth(core), 1e-5);
  float low = 1. - smoothstep(-0.6, 0.5, vQ.y);
  float l = log2(max(fw*8./0.2, 1e-4)); float lo = floor(l), f = l - lo;
  float s0 = 0.2*exp2(lo);
  vec2 g0 = wq/s0, g1 = wq/(s0*2.) + 7.3;
  vec2 i0 = floor(g0), i1 = floor(g1);
  float r0 = length(fract(g0) - 0.5 - 0.6*(vec2(h21(i0 + 1.), h21(i0 + 4.)) - 0.5));
  float r1 = length(fract(g1) - 0.5 - 0.6*(vec2(h21(i1 + 1.), h21(i1 + 4.)) - 0.5));
  // the blank grows out of the stipple as dots of bare paper of uneven size, scattered at random, that widen until
  // they join into one blank core: never a hard outline, never rows of beads
  float cov = clamp((core - 0.15)*2.6, 0., 1.);
  float q0 = (0.05 + 0.7*cov)*(0.55 + 0.9*h21(i0 + 6.)), q1 = (0.05 + 0.7*cov)*(0.55 + 0.9*h21(i1 + 6.));
  float p0 = (1. - smoothstep(q0, q0 + 0.06, r0))*step(h21(i0 + 5.), 0.2 + 0.9*cov);
  float p1 = (1. - smoothstep(q1, q1 + 0.06, r1))*step(h21(i1 + 5.), 0.2 + 0.9*cov);
  float pap = max(mix(p0, p1, f)*step(0.03, cov), smoothstep(0.72, 0.92, cov));
  float clump = mix(1., smoothstep(0.3, 0.62, vnoise(wq*0.11 + vSeed*9.)), 0.85);
  float dn = smoothstep(0.1, 0.3, body)*(1. - smoothstep(0.5, 0.95, cov))*(0.3 + 0.45*low)*clump*mix(1., smoothstep(8., 26., vDist)*(1. - smoothstep(70., 150., vDist)), vPart)*mix(1., uMistDots, vPart);
  float st = mix(dots(g0, dn), dots(g1, dn), f);
  if (pap < 0.5 && st < 0.5) discard;
  float edge = lineAA(core - 0.72, fb, 0.7)*low*step(0.55, vnoise(vQ*3.7 + vSeed*5.));
  float ink = max(step(0.5, st)*0.78, edge*0.55);
  vec3 col = mix(uPaper, mix(uInk, uHalf, smoothstep(60., 400., vDist)), ink);
  gl_FragColor = vec4(col, 1.);
}`;

// (round 5) the cloud belt: swollen banks of blank paper that knock the forest out of the plate. Each is a card turned to
// us: a heaped top in a broken outline with a few form strokes under its swells, a level base that breaks up into
// stipple over whatever lies behind it. It billows slowly (the swells travel) and never fades.
const BELT_VERT = /* glsl */ `
attribute vec3 aBase; attribute vec4 aSeed;      // aSeed: half height, aspect, seed, sway rate
uniform float uTime;
varying vec2 vQ; varying float vSeed; varying float vDist; varying float vSize; varying float vAsp;
void main(){
  vAsp = aSeed.y;
  vec3 c = aBase + vec3(-0.6, 0.25, -0.75)*sin(uTime*aSeed.w + aSeed.z*6.283)*aSeed.x*0.12;
  vec4 mv = modelViewMatrix*vec4(c, 1.);
  mv.xy += position.xy*vec2(aSeed.x*aSeed.y, aSeed.x);
  vQ = position.xy*vec2(aSeed.y, 1.); vSeed = aSeed.z; vDist = length(mv.xyz); vSize = aSeed.x;
  gl_Position = projectionMatrix*mv;
}`;
const BELT_FRAG = /* glsl */ `
varying vec2 vQ; varying float vSeed; varying float vDist; varying float vSize; varying float vAsp;
${PLATE_COMMON}
float beltBody(vec2 q, float asp, float seed, float t){
  vec2 e = vec2(q.x/asp, q.y > 0. ? q.y*1.12 : q.y*1.7);
  float n = 0.62*vnoise(q*1.25 + vec2(seed*17. + t, seed*3.)) + 0.38*vnoise(q*2.9 + vec2(seed*5. - t*1.6, 2.));
  return 1. - length(e) + (n - 0.5)*0.62*smoothstep(-0.55, 0.25, q.y) - 0.1;
}
void main(){
  float t = uTime*0.03;
  vec2 wq = vQ*vSize;
  float fw = max(max(fwidth(wq.x), fwidth(wq.y)), 1e-5);
  float a = max(vAsp, 0.5);
  float core = beltBody(vQ, a, vSeed, t);
  float under = beltBody(vQ + vec2(0., 0.09), a, vSeed, t) - core;       // > 0 on the underside of a swell
  float fb = max(fwidth(core), 1e-5);
  float lowZ = 1. - smoothstep(-0.34, -0.08, vQ.y);
  // the base: bare paper grows out of the stipple as dots that widen until they join
  float l = log2(max(fw*8./0.25, 1e-4)); float lo = floor(l), f = l - lo; float s0 = 0.25*exp2(lo);
  vec2 g0 = wq/s0, g1 = wq/(s0*2.) + 7.3; vec2 i0 = floor(g0), i1 = floor(g1);
  float r0 = length(fract(g0) - 0.5 - 0.6*(vec2(h21(i0 + 1.), h21(i0 + 4.)) - 0.5));
  float r1 = length(fract(g1) - 0.5 - 0.6*(vec2(h21(i1 + 1.), h21(i1 + 4.)) - 0.5));
  float cov = clamp((core + 0.07)*5., 0., 1.);
  float q0 = (0.05 + 0.75*cov)*(0.55 + 0.9*h21(i0 + 6.)), q1 = (0.05 + 0.75*cov)*(0.55 + 0.9*h21(i1 + 6.));
  float papLow = max(mix(1. - smoothstep(q0, q0 + 0.06, r0), 1. - smoothstep(q1, q1 + 0.06, r1), f)*step(0.04, cov), smoothstep(0.7, 0.9, cov));
  float pap = mix(smoothstep(-fb, fb, core), papLow, lowZ);
  // stipple along the base only, inside the bank and a little below it
  float dens = lowZ*smoothstep(-0.1, 0.0, core)*(1. - smoothstep(0.1, 0.34, core))*0.62;
  float st = mix((1. - smoothstep(0.14, 0.2, r0))*step(h21(i0 + 9.), dens), (1. - smoothstep(0.14, 0.2, r1))*step(h21(i1 + 9.), dens), f);
  if (pap < 0.5 && st < 0.5) discard;
  // the heaped top: a firm scalloped outline, form strokes under its swells and round the smaller heads inside it
  float topK = 1. - lowZ;
  float outl = lineAA(core, fb, 1.0)*step(0.12, vnoise(vQ*2.4 + vSeed*31.))*topK;
  float form = max(lineAA(core - 0.16, fb, 0.7)*step(0.3, vnoise(vQ*2.1 + vSeed*13. + 3.)), max(lineAA(core - 0.33, fb, 0.65)*step(0.4, vnoise(vQ*1.7 + vSeed*7. + 8.)),
    lineAA(core - 0.52, fb, 0.6)*step(0.5, vnoise(vQ*1.9 + vSeed*3. + 1.))))*smoothstep(0.0, 0.03, under);
  vec2 sq = vQ*3.3 + vec2(vSeed*23. + t*2., 5.);
  float n2 = vnoise(sq), under2 = vnoise(sq + vec2(0.17, 0.27)) - n2;
  float scal = lineAA(n2 - 0.6, max(fwidth(n2), 1e-5), 0.65)*smoothstep(0.0, 0.02, under2)*step(0.1, core);
  // the base: level ruling under a thin shade wash, ending upward on a wavy line (a cloud is a blank top over a ruled base)
  float wav = vnoise(vec2(vQ.x*1.4 + vSeed*9. + t, 3.)) - 0.5;
  float baseA = -0.06 + 0.24*wav - vQ.y, fbA = max(fwidth(baseA), 1e-5);
  float baseK = smoothstep(-fbA, fbA, baseA);
  float rule = hatch(wq.y, max(fwidth(wq.y), 1e-5), 1.1, 1e9, 0.34).x*step(0.2, vnoise(vec2(wq.x*0.05 + vSeed*5., floor(wq.y/1.1))));
  float ink = max(max(outl*0.9, max(form, scal)*0.72*(1. - baseK)), max(rule*0.62, lineAA(baseA, fbA, 0.8)*0.7*step(0.3, vnoise(vQ*3. + 7.)))*baseK*step(0.02, core))*step(0.5, pap);
  ink = max(ink, step(0.5, st)*0.8);
  vec3 col = mix(uPaper*mix(vec3(1.), uShade, 0.46*baseK*step(0.5, pap)), mix(uInk, uHalf, smoothstep(250., 900., vDist)), ink);
  gl_FragColor = vec4(col, 1.);
}`;

// valley cloud: a sheet of blank paper with stippled, contoured edges (first-light variant)
const SEA_VERT = /* glsl */ `
varying vec3 vW; varying float vDist;
void main(){ vec4 w = modelMatrix*vec4(position, 1.); vW = w.xyz; vec4 mv = viewMatrix*w; vDist = length(mv.xyz); gl_Position = projectionMatrix*mv; }`;
const SEA_FRAG = /* glsl */ `
varying vec3 vW; varying float vDist;
${PLATE_COMMON}
void main(){
  vec2 p = vW.xz;
  vec2 q = p*0.012 + uTime*vec2(0.004, -0.007);
  float n = 0.6*vnoise(q) + 0.4*vnoise(q*2.6 + 4.);
  float north = mix(800., 884., smoothstep(-12., 10., p.x));
  float edge = (1. - smoothstep(300., 430., -p.x))*(1. - smoothstep(230., 330., p.x))*smoothstep(north, north + 60., p.y)*(1. - smoothstep(1150., 1260., p.y));
  // (round 4) no bank lies on the plain in front of the section, nor on the flank above the seam foot: the cloud keeps to the palms
  float v = n*1.1 + edge*0.22 - 0.72 - 0.9*(1. - smoothstep(north - 10., north + 50., p.y));
  float fw = max(max(fwidth(p.x), fwidth(p.y)), 1e-5);
  float fv = max(fwidth(v), 1e-5);
  float l = log2(max(fw*7./0.3, 1e-4)); float lo = floor(l), f = l - lo; float s0 = 0.3*exp2(lo);
  vec2 g0 = p/s0, g1 = p/(s0*2.) + 3.7;
  vec2 i0 = floor(g0), i1 = floor(g1);
  float r0 = length(fract(g0) - 0.5 - 0.3*(vec2(h21(i0), h21(i0 + 3.)) - 0.5));
  float r1 = length(fract(g1) - 0.5 - 0.3*(vec2(h21(i1), h21(i1 + 3.)) - 0.5));
  float dn = clamp(v*7. + 0.5, 0., 1.);
  // (round 5) where no cloud lies the sheet leaves nothing: no specks of paper or ink hanging over the plain
  float pap = mix(1. - smoothstep(0.1 + 0.62*dn, 0.16 + 0.62*dn, r0), 1. - smoothstep(0.1 + 0.62*dn, 0.16 + 0.62*dn, r1), f)*step(0.04, dn);
  float sd = smoothstep(0.0, 0.3, dn)*(1. - smoothstep(0.5, 0.95, dn))*0.5 + 0.2*smoothstep(0.5, 0.72, vnoise(q*3.1 + 2.))*(1. - smoothstep(60., 220., vDist))*step(0.04, dn);
  float dots = mix((1. - smoothstep(0.13, 0.2, r0))*step(h21(i0 + 9.), sd), (1. - smoothstep(0.13, 0.2, r1))*step(h21(i1 + 9.), sd), f);
  if (max(pap, dots) < 0.5) discard;
  float cont = max(lineAA(v - 0.16, fv, 0.7)*step(0.35, vnoise(p*0.05)), max(lineAA(v - 0.27, fv, 0.6)*step(0.5, vnoise(p*0.04 + 9.)), lineAA(v - 0.4, fv, 0.6)*step(0.55, vnoise(p*0.045 + 4.))));
  // (round 4) the top of the sheet is drawn: fine form lines round every swell, so that a bank lying among the palms reads
  // as engraved cloud and not as a hole in the plate
  float fl = lineAA((fract(v*13. + 0.5) - 0.5)/13., fv, 0.5)*step(0.3, vnoise(p*0.07 + 2.))*(1. - smoothstep(0.03, 0.07, fv*13.))*smoothstep(0.02, 0.08, v);
  float ink = max(step(0.5, dots)*0.75, max(cont*0.6*(1. - smoothstep(200., 500., vDist)), fl*0.42));
  vec3 col = mix(uPaper, mix(uInk, uHalf, smoothstep(80., 500., vDist)), ink);
  gl_FragColor = vec4(col, 1.);
}`;

// ---------------------------------------------------------------- the east country
// Where the other half of the mountain should be, the horizontal leaf of the plate carries a drawn country: a bare
// margin by the foot of the page out of which the drawing grows, a floodplain of forest and savanna with a
// meandering river whose flow lines travel, then two meridional ranges standing in a sea of cloud. It is engraved
// like the mountain (contours, fall-line hachures, cross-hatch in shade) and tinted by a second plate of flat washes
// that hold at any distance and go to verditer as the country recedes. The mesh is lifted to the cloud top wherever
// the land lies under it; aLand keeps the land's own height so the shader knows cloud from ground.
const EAST_VERT = /* glsl */ `
attribute float aLand;
varying vec3 vPos; varying vec3 vNrm; varying float vLand; varying float vDist;
void main(){
  vPos = position; vNrm = normal; vLand = aLand;
  vec4 mv = modelViewMatrix*vec4(position, 1.);
  vDist = length(mv.xyz);
  gl_Position = projectionMatrix*mv;
}`;
const EAST_FRAG = /* glsl */ `
varying vec3 vPos; varying vec3 vNrm; varying float vLand; varying float vDist;
uniform vec3 uGreen, uOlive, uGamb; uniform vec4 uEast;      // uEast: snowline (m), tint strength, drift, -
${PLATE_COMMON}
${PAGE_LIB}
// (round 5) map marks are cut at three scales and each is drawn only while it is a few pixels across (never over about 2%
// of the frame's height), every edge one pixel firm: a tree as a small arc with its shadow tick, grass as a short stroke
float treeMark(vec2 p, float cell, float px){
  vec2 tg = p/cell; tg.x += 0.5*floor(tg.y);
  vec2 ti = floor(tg); vec2 tc = fract(tg) - 0.5 - 0.35*(vec2(h21(ti + 1.), h21(ti + 4.)) - 0.5);
  float tpx = px/cell;
  float crown = lineAA(length(tc) - (0.3 + 0.12*h21(ti + 6.)), tpx, 0.6)*step(tc.y, 0.12);
  float tick = 1. - smoothstep(-tpx, tpx, length(tc - vec2(0.12, 0.14)) - 0.13);
  float keepM = cell > 8. ? 1. : 0.85*step(0.3, h21(ti + 13.));
  return max(crown, tick*0.85)*keepM*smoothstep(0.075, 0.1, tpx)*(1. - smoothstep(0.2, 0.3, tpx));
}
float grassMark(vec2 p, float cell, float fx, float px){
  vec2 sg = p/cell; vec2 si = floor(sg); vec2 sc = fract(sg) - 0.5 - 0.5*(vec2(h21(si + 2.), h21(si + 5.)) - 0.5);
  float tpx = px/cell;
  return lineAA(sc.x*cell, fx, 0.55)*step(abs(sc.y), 0.2)*step(0.55, h21(si + 8.))*smoothstep(0.035, 0.05, tpx)*(1. - smoothstep(0.1, 0.16, tpx));
}
void main(){
  vec2 p = vPos.xz;
  float vD = length(vPos - cameraPosition);                    // (the sheet is too coarse a mesh to carry a distance at its corners)
  vec3 n = normalize(vNrm + vec3(0., 1e-4, 0.));
  vec2 fw2 = fwidth(p);
  float fx = max(fw2.x, 1e-5), fz = max(fw2.y, 1e-5), px = max(fx, fz);
  float h = vLand;
  float burr = vnoise(p*0.012) - 0.5;
  float cA = h + burr*5.;
  float cB = p.y + burr*30.;
  float cC = (p.x + p.y)*0.7071 + h*0.8;
  float fA = max(fwidth(h), 1e-4), fB = fz, fC = max(fwidth((p.x + p.y)*0.7071 + h*0.8), 1e-5);
  float fDg = max(fwidth((p.x + p.y)*0.7071), 1e-5);
  // the river: a meandering centre line in z, its signed distance, its width
  float rx = 430. + 130.*sin(p.y*0.0021 + 1.) + 70.*sin(p.y*0.0057 + 2.3) + 26.*sin(p.y*0.0131);
  float rxd = 0.273*cos(p.y*0.0021 + 1.) + 0.399*cos(p.y*0.0057 + 2.3) + 0.341*cos(p.y*0.0131);
  float rd = (p.x - rx)/sqrt(1. + rxd*rxd);
  float rw = 24. + 9.*sin(p.y*0.0043 + 0.7);
  float frd = max(fwidth(rd), 1e-5);
  // cloud field
  vec2 cq = p*0.0016 + uEast.z*uTime*vec2(1., -0.6);
  float cn = 0.6*vnoise(cq) + 0.4*vnoise(cq*2.7 + 5.);
  float fcn = max(fwidth(cn), 1e-5);
  vec2 cqs = cq + uSun.xz*0.08;
  float cns = 0.6*vnoise(cqs) + 0.4*vnoise(cqs*2.7 + 5.);

  float sK = smoothstep(590., 760., p.y);                       // toward the palm valley the drawn country comes close up to the foot of the page
  // (round 5) the drawn country stops at a firm edge (the same curve the world plants by): the wash ends on it, one pixel
  // firm, and the ruling trails on a few metres past it, ragged, as the lines of a vignette do
  // (by the palm valley, where we come in low over it, the country runs right up to the foot of the page)
  float sK2 = smoothstep(752., 800., p.y);
  float bEdge = mix(mix(140., 7., sK), 2.6, sK2) + (5.*sin(p.y*0.061) + 2.5*sin(p.y*0.173 + 1.3))*mix(1., 0.22, sK2) + 24.*(1. - sK)*sin(p.y*0.011 + 0.5);
  float mA = p.x - bEdge, fmA = max(fwidth(p.x - bEdge), 1e-4);
  float margin = smoothstep(-fmA, fmA, mA);
  float marginInk = smoothstep(-fmA, fmA, mA + (2. + 7.*vnoise(vec2(p.y*0.4, 3.)))*mix(1., 0.25, sK2));
  float hill = smoothstep(4., 30., h);
  float far1 = smoothstep(900., 2700., p.x);
  float snow = smoothstep(uEast.x - 30., uEast.x + 30., h + 70.*(vnoise(p*0.004) - 0.5))*smoothstep(0.3, 0.6, n.y + 0.2*vnoise(p*0.02));
  float ndl = clamp(dot(n, uSun), 0., 1.);
  float shade = (1. - smoothstep(0.3, 0.8, ndl))*hill;
  float forestN = vnoise(p*0.0035 + 7.)*0.6 + vnoise(p*0.011 + 2.)*0.4;
  float water = (1. - smoothstep(rw - frd, rw + frd, abs(rd)))*(1. - hill);
  float ffn = max(fwidth(forestN), 1e-5);                       // (round 5) wood, gallery and thicket end on firm edges: flat tints side by side
  float gallery = smoothstep(-frd, frd, rw + 34. + 22.*vnoise(p*0.03 + 5.) - abs(rd))*(1. - hill);
  float forest = max(smoothstep(0.51 - ffn, 0.51 + ffn, forestN)*(1. - smoothstep(260., 380., h)), gallery)*(1. - water)*(1. - snow);
  float lowl = (1. - hill)*(1. - water);

  // ---- the hills: contours, broken fall-line hachures, a diagonal in deep shade
  float tone = clamp(mix(0.24, 0.4, forest)*(1. - snow) + shade*(0.44 - 0.2*snow), 0., 0.86);
  vec2 hA = hatch(cA, fA, 2.5, 500., tone);
  vec2 hB = hatch(cB, fB, 1.6, 400., tone);
  vec2 hC = hatch(cC, fC, 2.0, 400., tone);
  float farA = smoothstep(5., 30., 6.*fA);
  float lA = smoothstep(0.1, 0.3, tone)*(1. - 0.6*farA);
  float lB = smoothstep(0.42 - 0.3*farA, 0.62 - 0.3*farA, tone), lC = smoothstep(0.72, 0.9, tone)*0.55;
  float ocB = log2(max(6.0*fB/1.6, 1e-4));
  float loB = floor(ocB), fBk = ocB - loB, PB = 1.6*exp2(loB);
  float brk = mix(smoothstep(0.3, 0.45, vnoise(vec2(cB/PB*0.7 + 3.1, p.x/(PB*5.)))), smoothstep(0.3, 0.45, vnoise(vec2(cB/PB*0.35 + 3.1, p.x/(PB*10.)))), fBk);
  float hillInk = (1. - (1. - hA.x*lA)*(1. - hB.x*lB*brk)*(1. - hC.x*lC))*hill;
  hillInk = mix(hillInk, hA.x*0.45*smoothstep(0.45, 0.7, vnoise(p*0.02 + 7.)) + hillInk*shade*0.6, snow);

  // ---- map marks on the plain and the lower slopes: trees as small arcs with a shadow tick, savanna as grass ticks
  float treeInk = max(max(treeMark(p, 11., px), max(treeMark(p + 37., 3.6, px), treeMark(p + 91., 1.2, px))), 0.2*smoothstep(0.2, 0.3, px/11.));
  float grass = max(grassMark(p, 6., fx, px), max(grassMark(p + 13., 2., fx, px), grassMark(p + 29., 0.66, fx, px)));
  float mapInk = max(treeInk*forest, grass*max(1. - forest, 0.5))*(1. - water)*(1. - smoothstep(0.55, 0.8, tone)*hill);
  // ---- (round 5) the floor of the wood close under us: form lines round every swell of the ground, and thickets in
  // crossed lines under a verditer shade, so that what the understorey stands on is drawn at the scale we see it from
  float hN = 5.*vnoise(p*0.017 + 3.) + 1.6*vnoise(p*0.058 + 11.);
  float thN = vnoise(p*0.043 + 21.) - 0.58 - 0.5*max(smoothstep(250., 420., p.x), 1. - smoothstep(600., 720., p.y));
  float fth = max(fwidth(thN), 1e-5);
  float thick = smoothstep(-fth, fth, thN)*forest*lowl;
  float nearG = 1. - smoothstep(0.14, 0.45, px);
  vec2 hG = hatch(hN + burr*0.6, max(fwidth(hN), 1e-5), 0.3, 1e9, 0.26 + 0.3*thick);
  vec2 hX = hatch((p.x - p.y)*0.7071 + burr*8., max(fwidth((p.x - p.y)*0.7071), 1e-5), 1.3, 1e9, 0.5);
  float woodInk = max(hG.x*0.72*nearG, max(hX.x*0.6, lineAA(thN, fth, 0.8)*0.8)*thick*(1. - smoothstep(0.4, 1.2, px)))*forest*lowl;
  mapInk = max(mapInk, woodInk);

  // ---- the river: banks drawn twice, flow lines with travelling dashes, stippled bars
  float bank = max(lineAA(abs(rd) - rw, frd, 1.0), lineAA(abs(rd) - rw - 3., frd, 0.5)*step(0.4, vnoise(vec2(p.y*0.05, sign(rd)*3.)))*0.7)*(1. - hill);
  float t4 = rd/rw*3.; float tk = floor(t4 + 0.5);
  float flow = (1. - smoothstep(0.5, 1.3, abs(t4 - tk)*rw/3./frd))*step(0.42, fract((p.y + uTime*(15. + 6.*h11(tk)))/(42. + 18.*h11(tk + 3.)) + h11(tk + 7.)))
    *(1. - smoothstep(0.2, 0.6, frd/rw*3.))*step(abs(tk), 2.5);
  float bar = smoothstep(0.64, 0.76, vnoise(vec2(p.y*0.006 + 4., rd*0.03)));
  vec2 bg = p/3.; vec2 bi = floor(bg);
  float bdot = (1. - smoothstep(0.12, 0.22, length(fract(bg) - 0.5 - 0.4*(vec2(h21(bi), h21(bi + 3.)) - 0.5))))*step(0.4, h21(bi + 9.))*(1. - smoothstep(0.1, 0.3, px/3.));
  float riverInk = max(flow*0.7*(1. - bar), bdot*bar*0.8)*water;

  // ---- fields on the plain: parcels ruled each its own way and hedged; the tint keeps to the ruling
  vec2 pcl = p/120. + 0.4*vec2(vnoise(p*0.005), vnoise(p*0.005 + 9.));
  vec2 pci = floor(pcl); float phh = h21(pci + 2.);
  float fdir = phh < 0.34 ? p.x : phh < 0.67 ? p.y : (p.x + p.y)*0.7071;
  float ffd = phh < 0.34 ? fx : phh < 0.67 ? fz : fDg;
  vec2 hF = hatch(fdir + burr*10., ffd, 2.2, 900., 0.16 + 0.2*h21(pci + 5.));
  vec2 pe = abs(fract(pcl) - 0.5);
  float hedge = lineAA((0.5 - max(pe.x, pe.y))*120., px, 0.9)*step(0.3, h21(pci + 11.));
  float fieldInk = max(hF.x*(1. - forest)*0.7, hedge*0.6)*lowl;
  float ink = max(max(hillInk, max(mapInk, fieldInk)), max(riverInk, bank));
  ink *= mix(1., 0.72, far1);
  // the bare margin by the foot of the page: the ledger ruling and its column of script run out into the drawing
  float ledger = max(hatchL(p.x, fx, 20., 1e9, 0.1, 0.).x*0.45, hatchL(p.y, fz, 100., 1e9, 0.1, 0.).x*0.3);
  float scr = script(vec2(-p.y, p.x - 30.)/5., fz/5., fx/5.)*step(p.x, 110.)*step(40., p.x)*step(abs(p.y), 700.);
  ink = mix(max(ledger, scr), ink, marginInk);

  // ---- the second plate: flat tints
  vec3 landT = mix(mix(uOlive, uGamb, 0.3), uGreen*vec3(0.95, 1., 0.92), forest);
  landT = mix(landT, mix(vec3(1.), uShade, 0.85), far1*0.8);
  landT = mix(landT, landT*uShade, shade*0.55);
  landT = mix(landT, mix(vec3(1.), uShade, shade*0.5), snow);
  landT = mix(landT, mix(vec3(1.), uShade, 0.55 - 0.3*bar), water);
  landT = mix(landT, mix(uGamb, uGreen, h21(pci + 7.)), 0.4*lowl*(1. - forest)*(1. - far1));
  landT = mix(landT, landT*mix(vec3(1.), uShade, 0.75), thick);
  float landK = mix(0.78, 0.6, far1)*margin*uEast.y*mix(1., 0.4 + 0.6*smoothstep(hF.y*0.8, hF.y*0.8 + 0.25, 0.6), lowl*(1. - forest));

  // ---- the cloud sea: blank paper in nested scalloped outlines, ruled and tinted on the flanks away from the sun
  float cl = smoothstep(1., 9., vPos.y - vLand + 8.*(vnoise(p*0.013) - 0.5));
  float lee = smoothstep(0.0, 0.035, cn - cns);
  float scal = lineAA(fract(cn*9.) - 0.5, fcn*9., 0.8)*step(0.3, vnoise(cq*7.))*(1. - smoothstep(0.12, 0.35, fcn*9.));
  float leeH = hatch(cB, fB, 1.6, 1e9, 0.2).x*lee*0.5;
  float shore = (1. - abs(cl*2. - 1.))*step(0.45, vnoise(p*0.21))*(1. - smoothstep(0.5, 2.5, px));
  float cloudInk = max(max(scal*0.7, leeH), shore*0.6);
  vec3 cloudT = mix(vec3(1.), uShade, 0.34*lee);

  ink = mix(ink, cloudInk, cl);
  vec3 wash = mix(mix(vec3(1.), landT, landK), cloudT, cl);
  vec3 paperTint = vec3(1.) - fibre(p, px) - foxing(p + 300.)*0.2*vec3(0.25, 0.5, 0.85)*(1. - margin);
  vec3 inkc = mix(uInk, uHalf, smoothstep(150., 700., vD));
  vec3 col = mix(uPaper*paperTint*wash, inkc, clamp(ink, 0., 1.));
  gl_FragColor = vec4(col, 1.);
}`;

// sleet strokes and ash stipple: short ruled dashes (or dots) falling through a box that follows the camera
const FALL_VERT = /* glsl */ `
attribute vec3 aBase; attribute float aSeed;
uniform float uTime, uResY;
uniform vec3 uCam, uVel; uniform vec3 uFall;     // uFall: amount, stroke length, dots (1) or strokes (0)
varying vec2 vQ; varying float vA;
void main(){
  vec3 c = aBase + uVel*(uTime*(0.8 + 0.4*aSeed));
  c = mod(c - uCam + 30., 60.) - 30. + uCam;
  vec4 mv = modelViewMatrix*vec4(c, 1.);
  float dist = length(mv.xyz);
  vec3 ax = normalize(mat3(modelViewMatrix)*uVel + vec3(1e-5, 0., 0.));
  vec2 sd = normalize(vec2(-ax.y, ax.x) + vec2(1e-5, 0.));
  float pxm = dist*2.0/(projectionMatrix[1][1]*uResY);
  float w = max(0.012, 0.8*pxm)*mix(1., 1.9, uFall.z);
  float len = mix(uFall.y, w, uFall.z);
  mv.xy += ax.xy*position.y*len + sd*position.x*w;
  vQ = position.xy;
  vA = step(aSeed, uFall.x)*smoothstep(3., 9., dist)*(1. - smoothstep(mix(22., 34., uFall.z), mix(30., 47., uFall.z), dist));
  gl_Position = projectionMatrix*mv;
  if (vA <= 0.01) gl_Position = vec4(0., 0., 3., 1.);
}`;
const FALL_FRAG = /* glsl */ `
varying vec2 vQ; varying float vA;
uniform vec3 uFall;
${PLATE_COMMON}
void main(){
  float d = mix(abs(vQ.x), length(vQ), uFall.z);
  float a = (1. - smoothstep(0.55, 1., d))*vA;
  if (a < 0.5) discard;
  gl_FragColor = vec4(mix(uInk, uHalf, 0.35), 1.);
}`;

// ---------------------------------------------------------------- geometry helpers (same accumulator as the hero)
const _t = new THREE.Vector3(), _n = new THREE.Vector3(), _b = new THREE.Vector3();
// a tube through pts ([x,y,z]); rad is an array or a function of t; hatch rings run round it
function accTubeG(A, pts, rad, sides, col, tone, maxP, o = {}) {
  const base = A.n, n = pts.length; let len = 0;
  const R = (i) => (typeof rad === 'function' ? rad(i / (n - 1)) : rad[i]);
  _n.set(0, 1, 0);
  for (let i = 0; i < n; i++) {
    const p = pts[i], a = pts[Math.max(i - 1, 0)], b = pts[Math.min(i + 1, n - 1)];
    _t.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize();
    if (i === 0 && Math.abs(_t.y) > 0.9) _n.set(1, 0, 0);
    _n.addScaledVector(_t, -_n.dot(_t));
    if (_n.lengthSq() < 1e-6) _n.set(_t.z, 0, -_t.x).addScalar(1e-3);
    _n.normalize(); _b.crossVectors(_t, _n);
    if (i > 0) len += Math.hypot(p[0] - a[0], p[1] - a[1], p[2] - a[2]);
    const t = i / (n - 1), r = Math.max(R(i), 0.003), sway = (o.sway0 ?? 0) + ((o.sway1 ?? 0) - (o.sway0 ?? 0)) * t;
    for (let j = 0; j <= sides; j++) {
      const an = (j / sides) * TAU, cs = Math.cos(an), sn = Math.sin(an);
      const dx = _n.x * cs + _b.x * sn * (o.flat ?? 1), dy = _n.y * cs + _b.y * sn * (o.flat ?? 1), dz = _n.z * cs + _b.z * sn * (o.flat ?? 1);
      vtx(A, [p[0] + dx * r, p[1] + dy * r, p[2] + dz * r], [_n.x * cs + _b.x * sn, _n.y * cs + _b.y * sn, _n.z * cs + _b.z * sn],
        an * (o.ru ?? Math.max(r, 0.12)), len * (o.vs ?? 1), o.colFn ? o.colFn(t, dy) : col, o.toneFn ? o.toneFn(t, dy) : tone, sway, maxP, o.kind ?? 0);
    }
  }
  for (let i = 0; i < n - 1; i++) for (let j = 0; j < sides; j++) {
    const a = base + i * (sides + 1) + j, b = a + 1, c = a + sides + 1, d = c + 1;
    A.idx.push(a, b, c, b, d, c);
  }
}
const blob = (r, k = 0.55) => (t) => r * Math.pow(Math.sin(Math.PI * clamp(t * 0.96 + 0.02, 0, 1)), k);
function shift(A, from, dx, dy, dz, du = 0) {
  for (let i = from; i < A.n; i++) { A.pos[i * 3] += dx; A.pos[i * 3 + 1] += dy; A.pos[i * 3 + 2] += dz; A.uv[i * 2] += du; }
}
// an arching pinnate frond: two ribbons hinged on the rachis, their hatching reads as leaflets
function accFrond(A, o, dir, L, rise, droop, w, col, tone, sway, maxP, segs = 5) {
  const dx = Math.cos(dir), dz = Math.sin(dir), sx = -dz, sz = dx;
  for (let h = -1; h <= 1; h += 2) {
    const pts = [], hw = [];
    for (let i = 0; i <= segs; i++) {
      const t = i / segs, out = L * Math.sin(t * 1.4) / Math.sin(1.4), y = rise * L * t - droop * L * t * t;
      const ww = w * Math.pow(Math.sin(Math.PI * Math.min(1, t * 0.9 + 0.09)), 0.7) * 0.5;
      pts.push([o[0] + dx * out + sx * h * ww * 0.92, o[1] + y - ww * 0.38, o[2] + dz * out + sz * h * ww * 0.92]);
      hw.push(Math.max(ww, 0.02));
    }
    accRibbon(A, pts, hw, [sx * h * 0.92, -0.38, sz * h * 0.92], col, tone, sway * 0.3, sway, maxP, 1, 6);
  }
}
function palmGeo(rng, S, o) {
  const A = makeAcc(), trunk = thin(S.pal[2], 0.52), leaf = S.green.clone().multiplyScalar(o.dark ?? 0.82), lean = rng.range(-1, 1) * o.lean;
  const H = o.h, top = [lean, H, 0.5 * lean];
  accTube(A, (t) => [lean * t * t, H * t, 0.5 * lean * t * t], (t) => o.r * (1 - 0.34 * t) + o.r * 0.3 * Math.exp(-t * 14) + o.r * 0.25 * Math.exp(-(1 - t) * 30), o.sides, o.segs, trunk, 0.2, o.sway, 70, true);
  for (let f = 0; f < o.fronds; f++) {
    const a = (f / o.fronds) * TAU + rng.range(-0.25, 0.25), tier = (f % 3) / 2;
    accFrond(A, [top[0], top[1] + 0.3, top[2]], a, o.L * rng.range(0.85, 1.12), lerp(1.05, 0.2, tier) + rng.range(-0.1, 0.1), lerp(0.75, 0.9, tier), o.w, leaf, 0.42, o.sway * 4, 26, o.fsegs);
  }
  return accGeometry(A);
}
function treeFernGeo(rng, S) {
  const A = makeAcc(), bark = thin(S.pal[1], 0.55), leaf = S.green.clone().lerp(S.verd, 0.25);
  accTube(A, (t) => [0.25 * Math.sin(t * 2), 7 * t, 0.15 * t], (t) => 0.3 - 0.1 * t, 5, 2, bark, 0.62, 0.3, 30, true);
  for (let f = 0; f < 10; f++) {
    const a = (f / 10) * TAU + rng.range(-0.2, 0.2), up = f % 2;
    accFrond(A, [0.25 * Math.sin(2), 7, 0.15], a, rng.range(3.3, 4.4), up ? 0.75 : 0.4, up ? 0.8 : 0.72, 1.35, leaf, 0.36 + 0.08 * up, 1.4, 22, 4);
  }
  return accGeometry(A);
}
function fernTuftGeo(rng, S) {
  const A = makeAcc(), leaf = S.green.clone().lerp(S.olive, 0.4);
  for (let f = 0; f < 5; f++) {
    const a = (f / 5) * TAU + rng.range(-0.3, 0.3), dx = Math.cos(a), dz = Math.sin(a), L = rng.range(1.1, 1.9);
    accRibbon(A, [[dx * 0.1, 0.05, dz * 0.1], [dx * L * 0.55, L * 0.62, dz * L * 0.55], [dx * L, L * 0.42, dz * L]], [0.1, 0.34, 0.03], [-dz, 0, dx], leaf, 0.4, 0.1, 0.5, 12, 1.6, 7);
  }
  return accGeometry(A);
}
// (round 12) the fern of the forest's understorey: seven arching pinnate fronds in two tiers round a heart that stands
// 5 m up a thin trunk. Stood on its trunk it is a tree fern's crown; with the trunk in the ground it is a rosette on the
// forest floor. One form for both, so that both are one draw (48 triangles: it is looked down on from 9 to 40 m).
function rosetteGeo(rng, S) {
  const A = makeAcc(), bark = thin(S.pal[1], 0.55), leaf = S.green.clone().lerp(S.olive, 0.18), deep = S.green.clone().multiplyScalar(0.84);
  accTube(A, (t) => [0, 5 * t, 0], (t) => 0.2 - 0.05 * t, 3, 1, bark, 0.62, 0, 30, true);
  for (let f = 0; f < 7; f++) {
    const up = f % 2 === 1, a = (f / 7) * TAU + rng.range(-0.2, 0.2), dx = Math.cos(a), dz = Math.sin(a), L = (up ? 2.1 : 2.7) * rng.range(0.9, 1.1);
    const rise = up ? 0.46 : 0.3, tip = up ? 0.34 : 0.04;
    // (pale leaves: under 0.2 of tone a frond a few pixels wide keeps its wash and loses its outline, so that from the
    // line a rosette is a star of its own green and not a knot of ink)
    accRibbon(A, [[dx * 0.15, 5.05, dz * 0.15], [dx * L * 0.4, 5 + L * rise * 0.9, dz * L * 0.4], [dx * L * 0.74, 5 + L * rise, dz * L * 0.74], [dx * L, 5 + L * tip, dz * L]],
      [0.12, 0.56, 0.5, 0.04], [-dz, 0, dx], up ? deep : leaf, up ? 0.19 : 0.12, 0.08, 0.5, 12, 1.5, 7);
  }
  return accGeometry(A);
}
// (round 5) a fern of the open plain, seen from 26 m up: eight arching pinnate fronds in two tiers round a dark heart
function plainFernGeo(rng, S) {
  const A = makeAcc(), leaf = S.green.clone().lerp(S.olive, 0.25), deep = S.green.clone().multiplyScalar(0.8);
  for (let f = 0; f < 8; f++) {
    const up = f % 3 === 0, a = (f / 8) * TAU + rng.range(-0.25, 0.25), dx = Math.cos(a), dz = Math.sin(a), L = (up ? 1.5 : 2.5) * rng.range(0.85, 1.15);
    const rise = up ? 1.15 : 0.55, tip = up ? 0.95 : 0.2;
    accRibbon(A, [[dx * 0.12, 0.08, dz * 0.12], [dx * L * 0.36, L * rise * 0.52, dz * L * 0.36], [dx * L * 0.72, L * rise * 0.6, dz * L * 0.72], [dx * L, L * tip * 0.5, dz * L]],
      [0.12, 0.42, 0.36, 0.03], [-dz, 0, dx], up ? deep : leaf, up ? 0.5 : 0.38, 0.1, 0.55, 12, 1.5, 7);
  }
  return accGeometry(A);
}
function heliconiaGeo(rng, S) {
  const A = makeAcc(), leaf = S.green.clone().multiplyScalar(0.9);
  for (let f = 0; f < 3; f++) {
    const a = (f / 3) * TAU + rng.range(-0.4, 0.4), dx = Math.cos(a), dz = Math.sin(a);
    accRibbon(A, [[dx * 0.1, 0, dz * 0.1], [dx * 0.5, 1.5, dz * 0.5], [dx * 1.0, 2.7, dz * 1.0], [dx * 1.7, 3.1, dz * 1.7]], [0.05, 0.32, 0.5, 0.04], [-dz, 0, dx], leaf, 0.42, 0.1, 0.6, 14, 1.2);
  }
  // the hanging bract chain: the vermilion accent of the understorey
  const pts = [], hw = [];
  for (let i = 0; i <= 5; i++) { pts.push([0.35 + 0.12 * (i % 2 ? 1 : -1), 2.2 - i * 0.3, 0.2]); hw.push(i === 0 || i === 5 ? 0.03 : 0.17); }
  accRibbon(A, pts, hw, [1, 0, 0], S.verm, 0.25, 0.2, 0.5, 10, 2.5);
  return accGeometry(A);
}
function tussockGeo(rng, S) {
  const A = makeAcc(), straw = S.olive.clone().lerp(S.gamb, 0.35), dry = thin(S.pal[2], 0.55);
  for (let f = 0; f < 5; f++) {
    const a = (f / 5) * TAU + rng.range(-0.4, 0.4), dx = Math.cos(a), dz = Math.sin(a), L = rng.range(0.55, 0.95), sp = rng.range(0.2, 0.55);
    accRibbon(A, [[dx * 0.05, 0, dz * 0.05], [dx * L * sp * 0.4, L * 0.62, dz * L * sp * 0.4], [dx * L * sp * 1.25, L * 0.92, dz * L * sp * 1.25]], [0.075, 0.05, 0.008], [-dz, 0, dx], f % 3 ? straw : dry, 0.3, 0.05, 0.4, 5, 3);
  }
  return accGeometry(A);
}
// a cloud-forest tree: mossy boughs, tank bromeliads, a few vermilion orchids, foliage in many small masses.
// bough 0 runs level along +X at 8 m: the bear's seat is at (3.6, 8.3, 0).
function forestTreeGeo(rng, S, seat) {
  const A = makeAcc(), bark = thin(S.pal[2], 0.55), moss = S.olive.clone().lerp(S.verd, 0.35), leaf = S.green.clone().multiplyScalar(0.92);
  accTubeG(A, [[0, -0.5, 0], [0.15, 3, 0.1], [0, 7, -0.1], [0.3, 10.5, 0.2], [0.1, 13, 0]], [0.85, 0.62, 0.55, 0.42, 0.2], 8, bark, 0.5, 40);
  const ends = [[0.1, 13.4, 0]];
  for (let b = 0; b < 5; b++) {
    const a = b === 0 ? 0 : seat ? lerp(1.9, 4.4, (b - 1) / 3) + rng.range(-0.2, 0.2) : (b / 5) * TAU + rng.range(-0.35, 0.35), dx = Math.cos(a), dz = Math.sin(a);
    const y0 = b === 0 ? 7.6 : rng.range(6, 10.5), L = b === 0 ? 7.2 : rng.range(5, 7.5), up = b === 0 ? 0.6 : rng.range(1.5, 3.5);
    const pts = [];
    for (let i = 0; i <= 4; i++) { const t = i / 4; pts.push([dx * (0.2 + L * t), y0 + up * t * t + 0.35 * Math.sin(t * 5 + b), dz * (0.2 + L * t)]); }
    accTubeG(A, pts, [0.36, 0.32, 0.27, 0.21, 0.1], 6, bark, 0.5, 30, { colFn: (t, dy) => (dy > 0.35 ? moss : bark), toneFn: (t, dy) => (dy > 0.35 ? 0.3 : 0.55) });
    if (!(seat && b === 0)) ends.push(pts[4], [pts[3][0] - dz * 1.2, pts[3][1] + 1.3, pts[3][2] + dx * 1.2]);
    // moss beards hanging under the bough
    for (let k = 0; k < 5; k++) {
      const t = rng.range(0.15, 0.95), i0 = Math.min(3, Math.floor(t * 4)), f = t * 4 - i0, q = [0, 1, 2].map((c) => lerp(pts[i0][c], pts[i0 + 1][c], f)), len = rng.range(0.7, 1.9);
      accRibbon(A, [[q[0], q[1] - 0.2, q[2]], [q[0], q[1] - 0.2 - len, q[2]]], [0.16, 0.02], [dx, 0, dz], moss, 0.42, 0.05, 0.45, 8, 3);
    }
    // tank bromeliads sitting on it (none on the bear's seat)
    for (let k = 0; k < 2; k++) {
      const t = b === 0 ? 0.74 + k * 0.2 : rng.range(0.25, 0.85), i0 = Math.min(3, Math.floor(t * 4)), f = t * 4 - i0, q = [0, 1, 2].map((c) => lerp(pts[i0][c], pts[i0 + 1][c], f));
      for (let l = 0; l < 7; l++) {
        const la = (l / 7) * TAU + k, lx = Math.cos(la), lz = Math.sin(la), heart = l === 6;
        accRibbon(A, [[q[0], q[1] + 0.25, q[2]], [q[0] + lx * (heart ? 0.1 : 0.6), q[1] + (heart ? 1.0 : 0.75), q[2] + lz * (heart ? 0.1 : 0.6)]], [0.13, 0.02], [-lz, 0, lx], heart ? S.verm : S.green, heart ? 0.2 : 0.4, 0.02, 0.2, 6, 3);
      }
    }
  }
  for (const e of ends) for (let k = 0; k < 3; k++) {
    const n0 = A.n, rx = rng.range(1.15, 1.9);
    accDome(A, rx, rx * rng.range(0.65, 0.95), 7, 3, 0.26, rng, k === 1 ? leaf : leaf.clone().lerp(k ? S.verd : S.olive, 0.35), 0.38 + 0.07 * k, 2.6, 0.6, 2);
    shift(A, n0, e[0] + rng.range(-2.1, 2.1), e[1] - 0.5 + rng.range(-0.4, 1.5), e[2] + rng.range(-2.1, 2.1), rng.range(0, 20));
  }
  return accGeometry(A);
}
// (round 11) a cinchona of the cloud forest: a slender grey stem, three masses of glossy leaf and rose-pink panicles standing
// out of them, the colour spark of the forest leg. 5.6 m at scale 1.
function cinchonaGeo(rng, S) {
  const A = makeAcc(), bark = thin(S.pal[2], 0.5), leaf = S.green.clone().multiplyScalar(0.88), pink = thin(S.pal[6], 0.6).lerp(new THREE.Color(0.93, 0.5, 0.6), 0.55);
  accTube(A, (t) => [0.3 * Math.sin(t * 2.4), 4.2 * t, 0.2 * t], (t) => 0.17 - 0.07 * t, 5, 2, bark, 0.5, 0.2, 20, true);
  for (let k = 0; k < 3; k++) {
    const n0 = A.n, a = (k / 3) * TAU + rng.range(-0.4, 0.4), rx = rng.range(1.1, 1.5), ox = 0.2 + Math.cos(a) * 0.9, oz = Math.sin(a) * 0.9, oy = 3.5 + 0.45 * k;
    accDome(A, rx, rx * 0.8, 6, 2, 0.25, rng, k ? leaf : leaf.clone().lerp(S.olive, 0.3), 0.4, 3, 0.5, 2);
    shift(A, n0, ox, oy, oz, k * 7);
    for (let j = 0; j < 2; j++) {
      const b = a + (j ? 1.3 : -0.9) + rng.range(-0.3, 0.3), px = ox + Math.cos(b) * rx * 0.55, pz = oz + Math.sin(b) * rx * 0.55, py = oy + rx * 0.55;
      const pp = [[px, py, pz], [px + 0.08, py + 0.5, pz], [px + 0.12, py + 1.15, pz + 0.04]];
      accRibbon(A, pp, [0.36, 0.28, 0.04], [Math.cos(b + 1.57), 0, Math.sin(b + 1.57)], pink, 0.1, 0.3, 0.6, 5, 3);
      accRibbon(A, pp, [0.36, 0.28, 0.04], [Math.cos(b), 0, Math.sin(b)], pink, 0.1, 0.3, 0.6, 5, 3);
    }
  }
  return accGeometry(A);
}
// a tree root seen in section: a taproot that forks twice, lying in the plane of the page just proud of it, 9.6 m at scale 1
function rootGeo(rng, S) {
  const A = makeAcc(), um = thin(S.pal[1], 0.7).lerp(thin(S.pal[2], 0.9), 0.3);
  const limb = (y0, z0, ang, L, w0, lvl) => {
    const pts = [], hw = [], n = lvl === 0 ? 8 : 5; let a = ang, y = y0, z = z0;
    for (let i = 0; i <= n; i++) {
      const t = i / n; pts.push([0.16 + 0.03 * lvl, y, z]); hw.push(Math.max(0.014, w0 * (1 - 0.92 * t)));
      a += rng.range(-0.3, 0.3) - 0.25 * a * (lvl === 0 ? 1 : 0.2);
      y -= Math.cos(a) * L / n; z += Math.sin(a) * L / n;
    }
    accRibbon(A, pts, hw, Math.abs(Math.sin(ang)) > 0.72 ? [0, 1, 0] : [0, 0, 1], um, 0.78, 0, 0, 6, 3, 1);
    if (lvl < 2) for (let k = 0, m = lvl === 0 ? 6 : 2; k < m; k++) {
      const i = 1 + Math.floor(rng() * (n - 2)), sgn = k % 2 ? 1 : -1;
      limb(pts[i][1], pts[i][2], ang * 0.3 + sgn * rng.range(0.55, 1.15), L * rng.range(0.28, 0.5) * (1 - 0.4 * i / n), hw[i] * 0.72, lvl + 1);
    }
  };
  limb(0, 0, 0, 9.6, 0.36, 0);
  return accGeometry(A);
}
// a rock tor: a leaning mass, a taller fin behind it and fallen blocks at its foot, 9 m to the top of the fin at scale 1
function torGeo(rng, S) {
  const A = makeAcc(), grey = thin(S.pal[2].clone().lerp(S.pal[1], 0.5), 0.7);
  const lump = (rx, ry, sides, rings, ox, oy, oz, sx, sz, shear, tone) => {
    const n0 = A.n;
    accDome(A, rx, ry, sides, rings, 0.4, rng, grey, tone, 6, 0, 4);
    for (let i = n0; i < A.n; i++) {
      const x = A.pos[i * 3], y = A.pos[i * 3 + 1], z = A.pos[i * 3 + 2];
      A.pos[i * 3] = x * sx + y * shear + ox; A.pos[i * 3 + 1] = y + oy; A.pos[i * 3 + 2] = z * sz - y * shear * 0.5 + oz; A.uv[i * 2] += n0 * 0.37;
    }
  };
  lump(3.3, 5.2, 9, 4, 0, -0.8, 0, 1.2, 0.9, 0.24, 0.36);
  lump(2.2, 9.0, 8, 5, -1.7, -0.8, 1.3, 0.9, 1.0, -0.1, 0.44);
  lump(2.0, 3.0, 7, 3, 3.2, -0.6, -0.8, 1.1, 1.2, 0.32, 0.3);
  lump(1.5, 2.1, 7, 3, -3.5, -0.5, -1.4, 1.2, 0.9, -0.25, 0.34);
  lump(1.1, 1.4, 6, 2, 1.3, -0.3, 2.7, 1.0, 1.1, 0.1, 0.28);
  lump(0.8, 1.0, 6, 2, -1.0, -0.3, 3.4, 1.3, 0.9, 0.2, 0.3);
  return accGeometry(A);
}
// passionflower vines hanging over the cut edge (three to a piece), lying just proud of the page
function vineGeo(rng, S) {
  const A = makeAcc(), stem = S.green.clone().multiplyScalar(0.85);
  for (let v = 0; v < 3; v++) {
    const z0 = (v - 1) * 1.6 + rng.range(-0.4, 0.4), L = rng.range(3.5, 8), pts = [], hw = [], n = 7;
    for (let i = 0; i <= n; i++) { const t = i / n; pts.push([0, -L * t, z0 + 0.35 * Math.sin(t * 7 + v * 2) * t]); hw.push(0.07 - 0.03 * t); }
    accRibbon(A, pts, hw, [0, 0, 1], stem, 0.6, 0, 0.4, 8, 3);
    for (let k = 1; k < n; k++) {
      const p = pts[k], sd = k % 2 ? 1 : -1, sw = 0.4 * (k / n);
      accRibbon(A, [[0.02, p[1], p[2]], [0.02, p[1] - 0.25, p[2] + sd * 0.42]], [0.2, 0.02], [0, 0.85, sd * 0.5], stem, 0.45, sw, sw, 8, 3);
      if (k % 3 === 1) {                                   // a passionflower: a four-point vermilion star
        const cy = p[1] - 0.5, cz = p[2] - sd * 0.3;
        accRibbon(A, [[0.05, cy, cz - 0.3], [0.05, cy, cz], [0.05, cy, cz + 0.3]], [0.02, 0.17, 0.02], [0, 1, 0], S.verm, 0.18, sw, sw, 6, 3);
        accRibbon(A, [[0.06, cy - 0.3, cz], [0.06, cy, cz], [0.06, cy + 0.3, cz]], [0.02, 0.17, 0.02], [0, 0, 1], S.verm, 0.18, sw, sw, 6, 3);
      }
    }
  }
  return accGeometry(A);
}

// ---------------------------------------------------------------- creature geometry
function tag(A, from, type, wfn, phase, pivot) {
  A.anim = A.anim || []; A.piv = A.piv || [];
  for (let i = from; i < A.n; i++) {
    const x = A.pos[i * 3], y = A.pos[i * 3 + 1], z = A.pos[i * 3 + 2];
    A.anim[i] = [type, wfn(x, y, z), typeof phase === 'function' ? phase(x, y, z) : phase, 0]; A.piv[i] = pivot;
  }
}
function creatureMesh(A, mat, count) {
  const g0 = accGeometry(A), g = new THREE.InstancedBufferGeometry();
  g.setIndex(g0.index);
  for (const k of ['position', 'normal', 'uv', 'aCol', 'aInfo', 'aEdge']) g.setAttribute(k, g0.attributes[k]);
  const an = new Float32Array(A.n * 4), pv = new Float32Array(A.n * 3);
  for (let i = 0; i < A.n; i++) { const a = A.anim && A.anim[i]; if (a) { an.set(a, i * 4); pv.set(A.piv[i], i * 3); } }
  g.setAttribute('aAnim', new THREE.BufferAttribute(an, 4)); g.setAttribute('aPivot', new THREE.BufferAttribute(pv, 3));
  const ip = new THREE.InstancedBufferAttribute(new Float32Array(count * 4), 4), iq = new THREE.InstancedBufferAttribute(new Float32Array(count * 4), 4),
    ia = new THREE.InstancedBufferAttribute(new Float32Array(count * 4), 4);
  for (const a of [ip, iq, ia]) a.setUsage(THREE.DynamicDrawUsage);
  for (let i = 0; i < count; i++) iq.array[i * 4 + 3] = 1;
  g.setAttribute('aIPos', ip); g.setAttribute('aIQuat', iq); g.setAttribute('aIAnim', ia);
  g.instanceCount = count;
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false;
  return {
    mesh, count,
    set(i, p, s, q, phase, amp, tone, off) {
      const o = i * 4, P = ip.array, Q = iq.array, N = ia.array;
      P[o] = p.x; P[o + 1] = p.y; P[o + 2] = p.z; P[o + 3] = s; Q[o] = q.x; Q[o + 1] = q.y; Q[o + 2] = q.z; Q[o + 3] = q.w;
      N[o] = phase; N[o + 1] = amp; N[o + 2] = tone; N[o + 3] = off;
    },
    flush() { ip.needsUpdate = true; iq.needsUpdate = true; ia.needsUpdate = true; },
  };
}
function feather(A, root, tip, bend, w, side, col, tone, uvs = 6) {
  const pts = [], N = 5, W = [0.5, 0.86, 1, 0.98, 0.84, 0.5];
  for (let i = 0; i <= N; i++) { const t = i / N; pts.push([0, 1, 2].map((c) => root[c] + (tip[c] - root[c]) * t + bend[c] * t * t)); }
  accRibbon(A, pts, W.map((k) => k * w), side, col, tone, 0, 0, 4, uvs, 3);
}
const BLACK = new THREE.Color(0.036, 0.03, 0.028), WHITE = new THREE.Color(1, 1, 1);
// feathers are washed a shade short of black so that their barbs and outlines still print on them
const SOOT = new THREE.Color(0.115, 0.095, 0.085), UMBER = new THREE.Color(0.21, 0.15, 0.11);

function condorGeo(S) {
  const A = makeAcc(), skin = thin(S.pal[6], 0.4).lerp(thin(S.pal[2], 0.5), 0.4);
  accTubeG(A, [[0, 0, 0.62], [0, 0.02, 0.3], [0, 0.04, -0.1], [0, 0.05, -0.42], [0, 0.07, -0.56]], [0.04, 0.17, 0.21, 0.16, 0.09], 8, BLACK, 0.8, 6, { vs: 4, ru: 0.6 });
  accTubeG(A, [[0, 0.07, -0.5], [0, 0.08, -0.58], [0, 0.09, -0.64]], [0.1, 0.14, 0.09], 8, WHITE, 0.05, 6, { vs: 4 });       // the white ruff
  accTubeG(A, [[0, 0.09, -0.62], [0, 0.1, -0.76], [0, 0.07, -0.86], [0, 0.03, -0.9]], [0.07, 0.075, 0.05, 0.012], 6, skin, 0.35, 6, { vs: 4 });
  for (let k = -2; k <= 2; k++) feather(A, [k * 0.03, 0.02, 0.5], [k * 0.13, 0, 1.08 - Math.abs(k) * 0.04], [0, 0, 0], 0.09, [1, 0, 0], SOOT, 0.45);
  for (let s = -1; s <= 1; s += 2) {
    const n0 = A.n, sh = [s * 0.13, 0.08, -0.12], wr = [s * 0.98, 0.1, -0.2];
    accRibbon(A, [[s * 0.1, 0.085, -0.22], [s * 0.55, 0.1, -0.3], [s * 1.0, 0.1, -0.3]], [0.17, 0.17, 0.13], [0, 0, 1], SOOT, 0.5, 0, 0, 6, 5, 3);
    for (let k = 0; k < 7; k++) {                        // secondaries: the cock's white upper-wing panel
      const x = s * (0.16 + k * 0.125);
      feather(A, [x, 0.09, -0.14], [x + s * 0.03, 0.07, 0.36 - k * 0.012], [0, 0, 0], 0.075, [s, 0, 0], k > 0 ? WHITE : SOOT, k > 0 ? 0.05 : 0.45);
    }
    for (let k = 0; k < 8; k++) {                        // black coverts over the arm, above the white panel
      const x = s * (0.14 + k * 0.115);
      feather(A, [x, 0.108, -0.34], [x + s * 0.02, 0.1, -0.1], [0, 0, 0], 0.066, [s, 0, 0], SOOT, 0.55);
    }
    for (let k = 0; k < 7; k++) {                        // primaries: seven fingers, splayed and curling up
      const a = -0.42 + k * 0.3, L = 0.62 + 0.14 * Math.sin((k / 6) * Math.PI);
      feather(A, wr, [wr[0] + s * Math.cos(a) * L, wr[1], wr[2] + Math.sin(a) * L], [0, 0.17, 0], 0.062, [-s * Math.sin(a), 0, Math.cos(a)], SOOT, 0.42 + 0.06 * (k % 2));
    }
    tag(A, n0, 1, (x) => s * (0.35 + 0.9 * Math.min(1, Math.abs(x) / 1.6)), (x) => -Math.abs(x) * 0.5, sh);
  }
  return A;
}
// (round 12) how the herd stands before we come, as shares of the stretch it grazes (the lower two thirds of the ash):
// the lower groups from its foot upward, near enough to one another that as one is passed the next two are running; the
// last two groups, the leaders, at its head. Twos and threes. (Why these shares: see the law of the herd in build.)
const HERD = {
  vicuna: { sizes: [3, 2, 3, 3, 2, 3], places: [0.05, 0.25, 0.45, 0.65, 0.89, 0.97] },
  deer: { sizes: [3, 2, 2, 2, 3], places: [0.05, 0.27, 0.5, 0.88, 0.97] },
};
// (round 11; redrawn in the fourth hand mend after round 13) our own primaries: seven separate fingers at one lower
// corner of the picture (s = +1 the right-hand corner, -1 the left). The unit is half the frame's height (round 12: or
// three quarters of its half width, where that is the smaller: see the wings in update) and the origin is the corner
// itself, so the same fan sits in the corner of a picture of any shape. The wrist lies well outside the picture, 0.36
// of the unit beyond its side and 0.03 below its foot, so that only the fingers come into it, from below and from the
// side; in a level glide the seven quills lie low and close, from 3 to 38 degrees above the foot of the picture, not
// quite six degrees apart, each a strip 0.052 wide and 0.63 to 0.79 long (the middle ones the longest), on a depth of
// its own (the lowest nearest the eye) so that where two cross only the nearer is drawn.
// Each vertex carries, in aAnim: how far along its quill it is (0 at the wrist, 1 at the tip), the quill's place in
// the fan (0 the lowest, 1 the highest), its place in the gust and how late it answers a change of load; in aPivot:
// the wrist and the quill's own share of the bend (0.14 the lowest to 0.30 the highest); in aInfo: the quill's
// length and half width, how much of the plate behind its wash lets through, and the side its shaft lies to.
function wingtipGeo(s) {
  const A = makeAcc(), WR = [s * 0.36, -0.03], LEN = [0.66, 0.72, 0.77, 0.79, 0.76, 0.7, 0.63], HW = 0.026, N = 12;
  A.anim = []; A.piv = [];
  for (let k = 0; k < 7; k++) {
    const n0 = A.n, kn = k / 6, th = ((3 + 35 * kn) * Math.PI) / 180, dx = -s * Math.cos(th), dy = Math.sin(th), ox = s * Math.sin(th), oy = Math.cos(th);
    for (let i = 0; i <= N; i++) {
      const t = i / N, r = LEN[k] * t;
      for (let e = -1; e <= 1; e += 2) {
        const j = vtx(A, [WR[0] + dx * r + e * ox * HW, WR[1] + dy * r + e * oy * HW, -0.012 * k], [0, 0, 1], e * HW, r, WHITE, LEN[k], HW, k % 2 ? 0.34 : 0.4, 0.3, e);
        A.anim[j] = [t, kn, k * 0.8 + (s > 0 ? 0 : 1.7), 0.2 + 0.8 * kn]; A.piv[j] = [WR[0], WR[1], 0.14 + 0.16 * kn];
      }
    }
    for (let i = 0; i < N; i++) { const a = n0 + i * 2; A.idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  return A;
}
// The pose of a quill is a law of four numbers the flight gives each fan (aIAnim): the gust clock, the load on the
// wing here, the load nine metres back along the route, and which side of the bank the fan is on (1 the outside of a
// full bank, -1 the inside, 0 on a straight). Each quill takes its load between here and nine metres back by its own
// lag (the lowest a fifth of the way back, the highest all of it), so that the fingers follow one another into a
// climb. The fan opens about a point a third of the way up it, by 0.12 rad on the outside of a full bank and 0.1
// under full load (and closes as much on the inside); each quill bends up about the wrist by an angle that grows as
// the square of the way along it: 0.05 rad at rest, its own share (0.14 to 0.30 rad) of the load, a fifth more on the
// outside of a full bank and a fifth less on the inside, and the gust, 0.025 rad and 0.05 more under full load (the
// round's own numbers), on the round's one clock, each quill 0.8 rad of the beat after the one below it and the
// left fan 1.7 rad after the right.
const WING_VERT = /* glsl */ `
attribute vec4 aInfo; attribute float aEdge; attribute vec4 aAnim; attribute vec3 aPivot;
attribute vec4 aIPos; attribute vec4 aIQuat; attribute vec4 aIAnim;
varying vec2 vUv; varying vec4 vInfo; varying float vEdge;
vec3 qrot(vec4 q, vec3 v){ return v + 2.*cross(q.xyz, cross(q.xyz, v) + q.w*v); }
void main(){
  float t = aAnim.x, kn = aAnim.y, sd = sign(aPivot.x), ph = aIAnim.x + aAnim.z;
  float load = mix(aIAnim.y, aIAnim.z, aAnim.w), outK = aIAnim.w;
  float open = (kn - 0.35)*(0.12*outK + 0.1*load);
  float gust = (0.025 + 0.05*load)*sin(ph);
  float a = -sd*(open + t*t*(0.05 + aPivot.z*load*(1. + 0.2*outK) + gust));
  vec2 r = position.xy - aPivot.xy; float c = cos(a), s = sin(a);
  vec3 p = vec3(aPivot.xy + vec2(r.x*c - r.y*s, r.x*s + r.y*c), position.z);
  vec3 wp = aIPos.xyz + qrot(aIQuat, p*aIPos.w);
  vUv = uv; vInfo = aInfo; vEdge = aEdge;
  gl_Position = projectionMatrix*modelViewMatrix*vec4(wp, 1.);
  if (aIPos.w <= 0.) gl_Position = vec4(0., 0., 3., 1.);
}`;
// A primary as the plate draws a feather: a clean outline (a vane narrow at the quill, full by the middle, narrower
// again in the finger, round at the tip), the shaft a third of the way to its upper edge, barbs slanting off the
// shaft toward the tip on both sides as fine hatching (lines 4 to 8 px apart at any size of picture, fixed to the
// feather), and over it one thin black wash. The wash is a wash, not a body: between the lines the feather is the
// paper under a grey of vInfo.z (0.34 and 0.4, quill and quill about), and of that only 35 parts in 100 are the
// feather's own; the other 65 are the plate behind it, seen through the wash. Only the lines are ink. So the fragment
// gives what it adds (rgb) and the share of the plate behind that it lets through (alpha), and the material lays
// them by ONE, SRC_ALPHA (see build). Its edge is softened over one pixel; outside it nothing is drawn.
const WING_FRAG = /* glsl */ `
varying vec2 vUv; varying vec4 vInfo; varying float vEdge;
${PLATE_COMMON}
void main(){
  float L = vInfo.x, hw = vInfo.y, t = vUv.y/L, e = vEdge, e0 = vInfo.w;
  float f0 = (0.36 + 0.64*smoothstep(0.2, 0.62, t))*(1. - 0.3*smoothstep(0.66, 1., t));
  float tc = 1. - 1.1*hw/L, x = clamp((t - tc)/(1. - tc), 0., 1.);
  float g = 1. - length(vec2(e/f0, x));
  float gpx = g/max(fwidth(g), 1e-5);
  float away = abs(e - e0)*hw, cB = vUv.y - 1.4*away;
  float fe = max(fwidth(e), 1e-5), fB = max(fwidth(cB), 1e-6);
  float cov = clamp(gpx, 0., 1.);
  if (cov < 0.004) discard;
  float outl = 1. - smoothstep(0.9, 1.7, gpx);
  float shaft = lineAA(e - e0, fe, 0.6)*(1. - smoothstep(0.86, 0.97, t));
  float barbs = hatch(cB, fB*0.66, 0.02, 1e9, 0.6).x*smoothstep(0.5, 1.5, abs(e - e0)/fe);
  float ink = clamp(max(outl, max(shaft*0.8, barbs*0.62)), 0., 1.);
  float body = 0.35;
  gl_FragColor = vec4((uInk*ink + uPaper*vInfo.z*body*(1. - ink))*cov, mix(1., vInfo.z*(1. - body)*(1. - ink), cov));
}`;
function parrotGeo(S) {
  const A = makeAcc(), g = S.green.clone().multiplyScalar(0.72);
  accTubeG(A, [[0, 0, 0.2], [0, 0.01, 0.05], [0, 0.02, -0.12], [0, 0.03, -0.2]], [0.03, 0.07, 0.075, 0.05], 6, g, 0.62, 3, { vs: 5, ru: 0.5 });
  accTubeG(A, [[0, 0.03, -0.17], [0, 0.045, -0.25], [0, 0.03, -0.31]], [0.05, 0.06, 0.02], 6, S.gamb, 0.3, 3, { vs: 5 });
  feather(A, [0, 0, 0.16], [0, -0.01, 0.52], [0, 0, 0], 0.055, [1, 0, 0], g, 0.72, 8);
  for (let s = -1; s <= 1; s += 2) {
    const n0 = A.n;
    accRibbon(A, [[s * 0.05, 0.02, -0.07], [s * 0.25, 0.03, -0.05], [s * 0.47, 0.03, 0.05]], [0.12, 0.11, 0.02], [0, 0, 1], g, 0.5, 0, 0, 3, 8, 3);
    tag(A, n0, 1, (x) => s * (0.5 + Math.abs(x) / 0.45), (x) => -Math.abs(x) * 1.5, [s * 0.04, 0.02, -0.05]);
  }
  return A;
}
function hummerGeo(S) {
  const A = makeAcc(), g = S.verd.clone().lerp(S.green, 0.4).multiplyScalar(0.8);
  accTubeG(A, [[0, -0.1, 0.1], [0, -0.04, 0.04], [0, 0.03, -0.03], [0, 0.07, -0.07]], [0.012, 0.042, 0.04, 0.03], 6, g, 0.55, 2, { vs: 8, ru: 0.6 });
  accTubeG(A, [[0, 0.06, -0.06], [0, 0.085, -0.1], [0, 0.085, -0.13]], [0.03, 0.036, 0.012], 5, S.verm, 0.3, 2, { vs: 8 });
  accTubeG(A, [[0, 0.085, -0.12], [0, 0.09, -0.3]], [0.011, 0.006], 4, BLACK, 0.9, 2, { vs: 8 });
  feather(A, [0, -0.08, 0.09], [0, -0.2, 0.2], [0, 0, 0], 0.04, [1, 0, 0], g, 0.7, 12);
  for (let s = -1; s <= 1; s += 2) {
    const n0 = A.n;
    accRibbon(A, [[s * 0.03, 0.03, -0.02], [s * 0.14, 0.05, 0.0], [s * 0.26, 0.05, 0.06]], [0.05, 0.055, 0.012], [0, 0, 1], thin(S.pal[4], 0.5), 0.4, 0, 0, 2, 12);
    tag(A, n0, 1, () => s, 0, [s * 0.03, 0.03, -0.02]);
  }
  return A;
}
function grazerGeo(S, deer) {
  const A = makeAcc();
  // (round 3) the deer wear a light tawny coat with a pale belly and flag, so they read light on the hatched slope
  // (round 4) the deer wear the same warm ground as the vicunas a shade browner, with a white belly, throat and flag
  const coat = deer ? S.gamb.clone().lerp(S.verm, 0.5).lerp(thin(S.pal[2], 0.9), 0.42) : S.gamb.clone().lerp(S.verm, 0.45).lerp(thin(S.pal[2], 0.8), 0.3);
  const pale = WHITE.clone().lerp(coat, 0.12), dark = thin(S.pal[1], 0.7), nb = deer ? 0.5 : 0.74, hy = 1.05 + nb;
  const belly = (t, dy) => (dy < -0.35 ? pale : coat);
  accTubeG(A, [[0, 0.98, 0.64], [0, 1.0, 0.42], [0, 0.98, 0.0], [0, 1.02, -0.38], [0, 1.08, -0.54]], [0.09, 0.24, 0.255, 0.23, 0.13], 8, coat, 0.32, 4, { colFn: belly, vs: 3, ru: 0.5, kind: 5 });
  const n0 = A.n;
  accTubeG(A, [[0, 1.02, -0.44], [0, 1.05 + nb * 0.5, -0.6], [0, hy, -0.68]], [0.14, 0.085, 0.07], 6, coat, 0.3, 4, { colFn: belly, vs: 3, kind: 5 });
  accTubeG(A, [[0, hy - 0.03, -0.62], [0, hy + 0.05, -0.76], [0, hy - 0.01, -0.96]], [0.06, 0.078, 0.034], 6, coat, 0.36, 4, { vs: 3, kind: 5, colFn: (t) => (t > 0.8 ? dark : coat) });
  for (let s = -1; s <= 1; s += 2) accRibbon(A, [[s * 0.045, hy + 0.08, -0.7], [s * 0.085, hy + 0.25, -0.67]], [0.04, 0.012], [0, 0, 1], coat, 0.5, 0, 0, 4, 6);
  if (deer) for (let s = -1; s <= 1; s += 2) {              // a stag's small antlers
    accTubeG(A, [[s * 0.04, hy + 0.08, -0.72], [s * 0.2, hy + 0.34, -0.72], [s * 0.16, hy + 0.5, -0.9]], [0.02, 0.016, 0.008], 4, pale, 0.5, 4);
    accTubeG(A, [[s * 0.18, hy + 0.3, -0.72], [s * 0.3, hy + 0.5, -0.66]], [0.014, 0.007], 4, pale, 0.5, 4);
  }
  tag(A, n0, 3, () => 1, 0.6, [0, 1.03, -0.46]);
  for (const [x, z, ph] of [[0.11, -0.36, 0], [-0.11, -0.36, 0.9], [0.1, 0.42, Math.PI], [-0.1, 0.42, Math.PI + 0.9]]) {
    const l0 = A.n;
    accTubeG(A, [[x, 0.97, z], [x, 0.56, z + 0.03], [x, 0.28, z - 0.01], [x, 0, z]], [0.09, 0.05, 0.034, 0.03], 5, coat, 0.4, 3, { vs: 3, kind: 5, colFn: (t) => (t > 0.6 ? dark : coat) });
    tag(A, l0, 2, (xx, yy) => clamp((0.97 - yy) / 0.97, 0, 1), ph, [x, 0.97, z]);
  }
  feather(A, [0, 1.0, 0.6], [0, deer ? 1.3 : 0.78, 0.74], [0, 0, 0], 0.06, [1, 0, 0], deer ? WHITE : coat, 0.25);
  return A;
}
// the spectacled bear: three rigid parts (seat and legs, torso and head, arms holding a bromeliad), facing +Z
function bearParts(S, mat) {
  const pale = thin(S.pal[5], 0.35), site = [{ x: 0, y: 0, z: 0, s: 1, rot: 0, tone: 0, ph: 0 }], o = { vs: 3, ru: 0.5 };
  const part = (A) => instancePlants(accGeometry(A), mat, site, 0);
  const A0 = makeAcc();
  accTubeG(A0, [[0, -0.1, -0.12], [0, 0.22, -0.06], [0, 0.5, 0]], [0.36, 0.47, 0.42], 8, BLACK, 0.82, 5, o);
  for (let s = -1; s <= 1; s += 2) accTubeG(A0, [[s * 0.26, 0.16, 0.08], [s * 0.36, 0.06, 0.48], [s * 0.33, -0.3, 0.6], [s * 0.33, -0.42, 0.74]], [0.2, 0.17, 0.12, 0.07], 6, BLACK, 0.84, 5, o);
  const A1 = makeAcc();
  accTubeG(A1, [[0, -0.05, 0], [0, 0.35, 0.03], [0, 0.72, 0.05], [0, 0.86, 0.06]], [0.4, 0.42, 0.33, 0.2], 8, BLACK, 0.8, 5, { ...o, colFn: (t, dy) => BLACK });
  accRibbon(A1, [[0, 0.74, 0.34], [0, 0.5, 0.42], [0, 0.3, 0.42]], [0.13, 0.17, 0.03], [1, 0, 0], pale, 0.15, 0, 0, 5, 3);   // the pale bib
  accTubeG(A1, [[0, 0.98, -0.14], [0, 1.03, 0.02], [0, 1.0, 0.2], [0, 0.95, 0.33], [0, 0.93, 0.4]], [0.08, 0.235, 0.2, 0.1, 0.05], 8, BLACK, 0.8, 5, { ...o, colFn: (t) => (t > 0.66 ? pale : BLACK), toneFn: (t) => (t > 0.66 ? 0.25 : 0.8) });
  for (let s = -1; s <= 1; s += 2) {
    accTubeG(A1, [[s * 0.17, 1.14, -0.02], [s * 0.2, 1.26, -0.03], [s * 0.21, 1.3, -0.03]], [0.07, 0.07, 0.03], 5, BLACK, 0.85, 5, o);   // ear
    accRibbon(A1, [[s * 0.035, 1.12, 0.2], [s * 0.14, 1.1, 0.17], [s * 0.15, 1.0, 0.2], [s * 0.06, 0.96, 0.27]], [0.015, 0.03, 0.03, 0.015], [0, 0.3, 1], pale, 0.1, 0, 0, 5, 4);   // spectacles
  }
  const A2 = makeAcc();
  for (let s = -1; s <= 1; s += 2) accTubeG(A2, [[s * 0.34, 0, 0], [s * 0.4, -0.2, 0.36], [s * 0.2, 0.06, 0.6], [s * 0.1, 0.16, 0.64]], [0.15, 0.13, 0.1, 0.07], 6, BLACK, 0.84, 5, o);
  for (let l = 0; l < 7; l++) {
    const la = (l / 7) * TAU, lx = Math.cos(la), ly = Math.sin(la), heart = l === 6;
    accRibbon(A2, [[0, 0.14, 0.68], [lx * (heart ? 0.05 : 0.42), 0.14 + ly * (heart ? 0.05 : 0.42) + 0.1, heart ? 1.15 : 1.0]], [0.1, 0.02], [-ly, lx, 0], heart ? S.verm : S.green, heart ? 0.2 : 0.4, 0, 0, 5, 3);
  }
  const root = new THREE.Group(), torso = new THREE.Group(), arms = new THREE.Group();
  torso.position.set(0, 0.36, 0); arms.position.set(0, 0.74, 0.1);
  torso.add(part(A1), arms); arms.add(part(A2)); root.add(part(A0), torso);
  return { root, torso, arms };
}

function quadInstances(n) {
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  g.instanceCount = n;
  return g;
}

export default {
  id: 'cut-mountain',
  name: 'The Cut Mountain',
  category: 'wilderness',
  weirdness: 0.4,
  media: ['air'],
  async build(ctx) {
    const rng = ctx.rng, vary = ctx.vary || {}, detail = ctx.quality?.detail ?? 1, dens = clamp(vary.density ?? 1, 0.7, 1.3);
    const noise = ctx.noise;

    // ---------------------------------------------------------- the look of this visit
    const lk = rng.fork('cut-mountain-look');
    const inkPick = lk.pick(['sepia', 'sanguine', 'sepia', 'sepia', 'sanguine', 'blueblack', 'blueblack']);
    const wPick = lk(), bloom = lk.pick(['puya', 'frailejon']), deer = lk.chance(0.3), cub = lk.chance(0.4), third = lk.chance(0.45);
    const hour = vary.hour || 'any';
    const ink = hour === 'day' ? 'sepia' : hour === 'golden' ? 'sanguine' : hour === 'dawn' || hour === 'night' ? 'blueblack' : inkPick;
    const weather = ink === 'blueblack' ? 'valley' : wPick < 0.28 ? 'belt' : wPick < 0.5 ? 'sleet' : 'clear';
    const rare = !!vary.rare;

    const scene = new THREE.Scene();
    const hero = await buildHero(ctx, { ink, bloom, rare, fog: 0, plain: false, snowDrop: weather === 'sleet' ? 95 : 0, pageTone: ink === 'sanguine' ? 1 : 0 });
    scene.add(hero.object);
    await ctx.yield();
    const S = hero.S, U = hero.uniforms, A_ = hero.anchors, gAt = hero.groundAt;
    scene.background = S.paper.clone();
    const path = makePath(A_.flyThrough), L = path.length;
    // (round 4) the entry leg is new and longer. Everything staged in rounds 1 to 3 is keyed to 'legacy u', u along the
    // line as it was (see the hero's camera line): toL converts the engine's u, frL goes back, DL is the distance at a legacy u
    const toL = hero.toLegacy, frL = hero.fromLegacy, DL = (uL) => frL(uL) * L, LO = hero.legacyLength;
    const P = new THREE.Vector3(), T = new THREE.Vector3(), R = new THREE.Vector3();
    const frame = (d) => { path.posAtDist(d, P); path.tangentAtDist(d, T); R.set(-T.z, 0, T.x).normalize(); };

    // ---------------------------------------------------------- sky
    const sky = new THREE.Mesh(new THREE.SphereGeometry(4200, 48, 24), new THREE.ShaderMaterial({
      uniforms: { ...U, uCone: { value: new THREE.Vector4(lerp(0.3, 0.52, (rng.range(0.72, 1.0) - 0.72) / 0.28), rng.range(0.17, 0.23), lerp(0.125, 0.155, (rng.range(0.07, 0.095) - 0.07) / 0.025), rng.sign()) },
        uFar: { value: new THREE.Vector3(lk.range(0, 40), 1, 1) },
        uSky: { value: new THREE.Vector3(62, weather === 'belt' ? 0.55 : weather === 'sleet' ? 0.5 : 0.61, 0.012) } },
      vertexShader: SKY_VERT, fragmentShader: SKY_FRAG, side: THREE.BackSide, depthWrite: false }));
    sky.renderOrder = -1; sky.frustumCulled = false; scene.add(sky);

    // ---------------------------------------------------------- the living valley east of the plane, south of the foot
    const edgeZ = (x) => 866 + 12 * noise.n2(x * 0.021, 7.7), edgeX = (z) => 205 + 45 * noise.n2(z * 0.013, 2.2);
    const valleyH = (x, z) => {
      const k = smoothstep(edgeZ(x), edgeZ(x) + 18, z) * (1 - smoothstep(edgeX(z), edgeX(z) + 55, x));
      return lerp(-1.2, gAt(-Math.max(x, 0.01), z) + 0.15, k);
    };
    const groundY = (x, z) => (x <= 0 ? gAt(x, z) : z > 846 ? Math.max(valleyH(x, z), 0) : 0);
    {
      const NX = 60, NZ = 82, pos = new Float32Array((NX + 1) * (NZ + 1) * 3), nrm = new Float32Array(pos.length), idx = [];
      for (let j = 0; j <= NZ; j++) {
        for (let i = 0; i <= NX; i++) { const x = i * 5, z = 846 + j * 5, o = (j * (NX + 1) + i) * 3; pos[o] = x; pos[o + 1] = valleyH(x, z); pos[o + 2] = z; }
        if (j % 12 === 11) await ctx.yield();
      }
      const W = NX + 1;
      for (let j = 0; j <= NZ; j++) for (let i = 0; i <= NX; i++) {
        const o = (j * W + i) * 3, hx = pos[(j * W + Math.min(i + 1, NX)) * 3 + 1] - pos[(j * W + Math.max(i - 1, 0)) * 3 + 1];
        const hz = pos[(Math.min(j + 1, NZ) * W + i) * 3 + 1] - pos[(Math.max(j - 1, 0) * W + i) * 3 + 1];
        const l = Math.hypot(hx, 10, hz); nrm[o] = -hx / l; nrm[o + 1] = 10 / l; nrm[o + 2] = -hz / l;
      }
      for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) { const a = j * W + i, b = a + 1, c = a + W, d = c + 1; idx.push(a, c, b, b, c, d); }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nrm, 3)); g.setIndex(idx);
      g.setAttribute('aTone', new THREE.BufferAttribute(new Float32Array((NX + 1) * (NZ + 1) * 3), 3));      // (round 12) no hollow, no stand, no fold: the hero's ground reads all three
      const m = new THREE.Mesh(g, hero.materials.ground); m.frustumCulled = false; scene.add(m);
    }
    await ctx.yield();

    // ---------------------------------------------------------- the east country: floodplain, river, two ranges, a cloud sea
    const cloudBase = weather === 'belt' ? 150 : weather === 'valley' ? 135 : weather === 'sleet' ? 120 : 85;
    const landE = (x, z) => {
      if (x < 520) return 0;
      const f1 = smoothstep(520, 1150, x);
      const w1 = 1450 + 190 * noise.n2(z * 0.0008, 3.1) + 70 * noise.n2(z * 0.0031, 9.2), w2 = 3000 + 300 * noise.n2(z * 0.0005, 8.4);
      const d1 = (x - w1) / 330, d2 = (x - w2) / 560;
      const hA = 250 + 95 * noise.n2(z * 0.0015, 1.7) + 40 * noise.n2(z * 0.005, 4.4), hB = 600 + 190 * noise.n2(z * 0.001, 5.5) + 60 * noise.n2(z * 0.004, 2.2);
      let h = f1 * (30 + 24 * noise.fbm2(x * 0.0035, z * 0.0035, 3)) + 60 * smoothstep(1800, 2600, x);
      h += hA * Math.exp(-d1 * d1) * (0.7 + 0.5 * noise.ridged2(x * 0.0019 + 3, z * 0.0019, 3));
      h += hB * Math.exp(-d2 * d2) * (0.72 + 0.45 * noise.ridged2(x * 0.001 + 9, z * 0.001, 2)) * smoothstep(1500, 2300, x);
      return Math.max(h, 0);
    };
    const cloudE = (x, z) => lerp(-30, cloudBase + 15 * noise.n2(x * 0.0035, z * 0.0035) + 8 * noise.n2(x * 0.011, z * 0.011), smoothstep(950, 1320, x));
    {
      const xs = [0, 150, 300, 420, 520], zs = [], half = [];
      for (let x = 565; x <= 2005; x += 45) xs.push(x);
      for (let x = 2080; x <= 3880; x += 75) xs.push(x);
      for (let x = 4080; x <= 5280; x += 200) xs.push(x);
      for (let z = 0, st = 60; z < 5300; z += st) { half.push(z); if (z > 1500) st = Math.min(260, st * 1.12); }
      for (let i = half.length - 1; i > 0; i--) zs.push(-half[i]);
      for (const v of half) zs.push(v);
      const NXe = xs.length, NZe = zs.length, pos = new Float32Array(NXe * NZe * 3), nrm = new Float32Array(NXe * NZe * 3), land = new Float32Array(NXe * NZe), idx = [];
      for (let j = 0; j < NZe; j++) {
        for (let i = 0; i < NXe; i++) {
          const x = xs[i], z = zs[j], o = j * NXe + i, hl = landE(x, z);
          land[o] = hl; pos[o * 3] = x; pos[o * 3 + 1] = Math.max(hl, cloudE(x, z)); pos[o * 3 + 2] = z;
        }
        if (j % 6 === 5) await ctx.yield();
      }
      for (let j = 0; j < NZe; j++) for (let i = 0; i < NXe; i++) {
        const o = j * NXe + i, i0 = Math.max(i - 1, 0), i1 = Math.min(i + 1, NXe - 1), j0 = Math.max(j - 1, 0), j1 = Math.min(j + 1, NZe - 1);
        const sx = (land[j * NXe + i1] - land[j * NXe + i0]) / (xs[i1] - xs[i0]), sz = (land[j1 * NXe + i] - land[j0 * NXe + i]) / (zs[j1] - zs[j0]);
        const l = Math.hypot(sx, 1, sz); nrm[o * 3] = -sx / l; nrm[o * 3 + 1] = 1 / l; nrm[o * 3 + 2] = -sz / l;
      }
      for (let j = 0; j < NZe - 1; j++) for (let i = 0; i < NXe - 1; i++) { const a = j * NXe + i, b = a + 1, c = a + NXe, d = c + 1; idx.push(a, c, b, b, c, d); }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
      g.setAttribute('aLand', new THREE.BufferAttribute(land, 1)); g.setIndex(idx);
      const east = new THREE.Mesh(g, new THREE.ShaderMaterial({
        uniforms: { ...U, uGreen: { value: S.green }, uOlive: { value: S.olive }, uGamb: { value: S.gamb },
          uEast: { value: new THREE.Vector4(weather === 'sleet' ? 470 : 660, 1, 0.004, 0) } },
        vertexShader: EAST_VERT, fragmentShader: EAST_FRAG, side: THREE.DoubleSide }));
      east.frustumCulled = false; scene.add(east);
    }
    await ctx.yield();

    // ---------------------------------------------------------- plants (the hero's own 'plate' plant material)
    const plantMat = hero.materials.plant;
    const site = (x, z, s, o = {}) => ({ x, y: groundY(x, z), z, s, rot: rng() * TAU, tone: rng.range(-0.08, 0.1), ph: rng() * TAU, ...o });
    const offPath = (d, lat) => { frame(d); return [P.x + R.x * lat, P.z + R.z * lat]; };
    const thinN = (n) => Math.max(1, Math.round(n * (0.45 + 0.55 * detail) * dens));
    const add = (geo, sites, sink) => { const m = instancePlants(geo, plantMat, sites, sink); scene.add(m); return m; };

    // (round 4) the entry looks at the cut face nearly square on: the seam foot stands 27 degrees left of the axis, the summit
    // 22 right, the lava stream on the flank between them. No tall trunk stands in that cone (it is also what shows through
    // the previous world's portal): the wax palms part either side of it, the nearest drawn dark, and only young palms,
    // their crowns kept under the axis line, fill the valley floor in front of the section.
    const e0 = path.pointAt(0), eT = path.tangentAt(0);
    const coneOf = (x, z) => { const dx = x - e0.x, dz = z - e0.z; return [dx * eT.x + dz * eT.z, dx * -eT.z + dz * eT.x]; };      // along the axis, to its right
    const inCone = (x, z) => { const [al, sd] = coneOf(x, z); return al > 10 && sd > -al * 0.57 && sd < al * 0.54; };
    const inWedge = inCone;
    const underAxis = (x, z, s, gy) => {             // young palms inside that cone keep their crowns under the axis line
      const [al, sd] = coneOf(x, z);
      return al > 8 && Math.abs(sd) < al * 0.62 ? Math.min(s, (20.5 - gy) / 17.5) : s;
    };
    // the parted aisle: two dark trunks either side of the opening at 20 to 30 m, then looser ranks falling back along its sides
    const aisle = [];
    const flankAt = (al, sd, s, dark) => {
      const x = e0.x + eT.x * al - eT.z * sd, z = e0.z + eT.z * al + eT.x * sd, st = site(x, z, s, { dark });
      // (and none in the lane up which the smoking lip is seen as the line swings in over the forest)
      const lane = z > 735 && z < 828 && Math.abs(x + 3 + 0.014 * (835 - z)) < 14;
      if (path.nearestXZ(x, z).dist > 6.8 && groundY(x, z) > 0.4 && !inCone(x, z) && !lane) aisle.push(st);
    };
    for (const [al, sd, s, dk] of [[19, -12.5, 1.08, 0.34], [29, -19.5, 0.96, 0.3], [41, -27.5, 1.1, 0.16], [22, 13.8, 1.02, 0.34], [33, 21, 1.1, 0.26], [46, 28.5, 0.94, 0.12]]) flankAt(al, sd, s, dk);
    for (let i = 0; i < 34; i++) {
      const al = rng.range(16, 170), side = i % 3 === 2 ? 1 : -1, k = rng.range(0.66, 1.3);
      flankAt(al, side * (al * k + rng.range(2, 9)), rng.range(0.82, 1.15), 0);
    }
    const valleyMeshes = [], ridgeMeshes = [];      // shown only while their stretch of the flight is in front of us
    valleyMeshes.push(add(palmGeo(rng, S, { h: 50, r: 0.46, sides: 9, segs: 7, fronds: 11, L: 6.4, w: 1.7, fsegs: 4, lean: 1.3, sway: 0.9 }), aisle, 0.5));
    await ctx.yield();
    // young palms under us: their crowns pass 6 m below the wing; one of them holds the parrots
    const young = [];
    const [srcX, srcZ] = offPath(36, -12);
    const srcS = clamp((24 - groundY(srcX, srcZ)) / 17.5, 0.7, 1.2);
    young.push(site(srcX, srcZ, srcS));
    const parrotSrc = new THREE.Vector3(srcX, groundY(srcX, srcZ) + 16.5 * srcS, srcZ);
    for (let i = 0, n = thinN(112); i < n; i++) {
      const d = rng.range(-8, DL(0.17)), [x, z] = offPath(d, rng.sign() * rng.range(3.5, 62));
      const near = path.nearestXZ(x, z), gy = groundY(x, z);
      if (gy < 0.4 || (d < 15 && near.dist < 12) || Math.hypot(x - srcX, z - srcZ) < 9) continue;
      let s = rng.range(0.78, 1.28);
      if (near.dist < 11) s = Math.min(s, (near.y - 5.5 - gy) / 17.5);
      if (x > -24 && x < 34 && z > 735 && z < 848) s = Math.min(s, (27 - gy) / 17.5);      // (round 4) under the sight of the lip as we swing in
      if (s > 0.55) young.push(site(x, z, underAxis(x, z, s, gy)));
    }
    valleyMeshes.push(add(palmGeo(rng, S, { h: 15, r: 0.3, sides: 6, segs: 3, fronds: 13, L: 5, w: 1.5, fsegs: 4, lean: 0.8, sway: 0.5, dark: 0.95 }), young, 0.3));      // (round 12: four segments to a frond, as on the plain's young palms)
    await ctx.yield();
    // far palms of the east valley
    const far = [];
    for (let i = 0, n = thinN(150); i < n; i++) {
      const x = rng.range(8, 255), z = rng.range(872, 1238);
      if (valleyH(x, z) > 0.8 && path.nearestXZ(x, z).dist > 50 && !inWedge(x, z)) far.push(site(x, z, rng.range(0.8, 1.2)));
    }
    valleyMeshes.push(add(palmGeo(rng, S, { h: 50, r: 0.5, sides: 5, segs: 2, fronds: 8, L: 6.4, w: 1.8, fsegs: 2, lean: 1.4, sway: 0.9 }), far, 0.5));      // (round 5: lighter, they stand 50 m off and more)
    await ctx.yield();
    // understorey: ferns and heliconia over the whole valley floor and the lower flank
    const ferns = [], heli = [];
    for (let i = 0, n = thinN(1900); i < n; i++) {
      const [x, z] = offPath(rng.range(-10, DL(0.31)), rng.gauss() * 26);
      const gy = groundY(x, z);
      if (gy < 0.3 || (x > 0 && z < 850)) continue;
      (i % 9 === 0 ? heli : ferns).push(site(x, z, rng.range(0.7, 1.5)));
      if ((i & 255) === 255) await ctx.yield();
    }
    valleyMeshes.push(add(fernTuftGeo(rng, S), ferns, 0.05), add(heliconiaGeo(rng, S), heli, 0.05));
    await ctx.yield();
    // (round 5) the plain under the entry leg carries real understorey up to the edge of the drawn country (the curve the
    // east country's shader ends its wash on): thickets of large ferns round heliconia, loose ferns between them, and
    // young palms whose crowns stay under the line of sight to the section. They draw from a stream of their own.
    {
      const pr = ctx.core.makeRng((((ctx.seed ?? 1) >>> 0) ^ 0x5bd1e995) >>> 0);
      const plainEdge = (z) => { const sK = smoothstep(590, 760, z), sK2 = smoothstep(752, 800, z);
        return lerp(lerp(140, 7, sK), 2.6, sK2) + (5 * Math.sin(z * 0.061) + 2.5 * Math.sin(z * 0.173 + 1.3)) * lerp(1, 0.22, sK2) + 24 * (1 - sK) * Math.sin(z * 0.011 + 0.5); };
      const onPlain = (x, z, m) => x > plainEdge(z) + m && groundY(x, z) < 0.25;
      const psite = (x, z, s, o = {}) => ({ x, y: 0, z, s, rot: pr() * TAU, tone: pr.range(-0.08, 0.1), ph: pr() * TAU, ...o });
      const keep = (x, z) => pr() < smoothstep(668, 775, z) * (1 - smoothstep(165, 255, x));
      const bigF = [], smallF = [], heliP = [], palmsP = [], cl = [];
      const spots = [];
      for (let i = 0, n = thinN(130); i < n; i++) {
        const x = pr.range(4, 240), z = pr.range(672, 900);
        if (onPlain(x, z, 4) && keep(x, z)) spots.push([x, z]);
      }
      // (none of the ground we look down on from the entry leg is left bare: a thicket every 13 m either side of the line,
      // and a file of them along the foot of the page)
      for (let d = 58; d < 200; d += 13) for (const sd of [-1, 1]) {
        const [x, z] = offPath(d, sd * pr.range(7, 30));
        if (onPlain(x, z, 3)) spots.push([x, z]);
      }
      for (let z = 730; z < 868; z += 11) { const x = plainEdge(z) + pr.range(4.5, 16); if (onPlain(x, z, 3)) spots.push([x, z + pr.range(-3, 3)]); }
      for (const [x, z] of spots) {
        cl.push([x, z]);
        for (let k = 0, m = 3 + Math.floor(pr() * 4); k < m; k++) {
          const a = pr() * TAU, r = pr.range(0.5, 6.5), fx = x + Math.cos(a) * r, fz = z + Math.sin(a) * r;
          if (onPlain(fx, fz, 2.5)) bigF.push(psite(fx, fz, pr.range(1.15, 2.1)));
        }
        for (let k = 0, m = 1 + Math.floor(pr() * 3); k < m; k++) {
          const a = pr() * TAU, r = pr.range(0, 2.6), fx = x + Math.cos(a) * r, fz = z + Math.sin(a) * r;
          if (onPlain(fx, fz, 2.5)) heliP.push(psite(fx, fz, pr.range(1.4, 2.15)));
        }
        for (let k = 0; k < 3; k++) {
          const a = pr() * TAU, r = pr.range(3, 11), fx = x + Math.cos(a) * r, fz = z + Math.sin(a) * r;
          if (onPlain(fx, fz, 1.5)) smallF.push(psite(fx, fz, pr.range(0.8, 1.5)));
        }
      }
      await ctx.yield();
      for (let i = 0, n = thinN(220); i < n; i++) {
        const x = pr.range(2, 250), z = pr.range(668, 905);
        if (onPlain(x, z, 1.2) && keep(x, z)) smallF.push(psite(x, z, pr.range(0.7, 1.45)));
      }
      for (let i = 0; i < 200 && palmsP.length < 34; i++) {
        const x = pr.range(10, 215), z = pr.range(690, 890);
        if (!onPlain(x, z, 5) || !keep(x, z) || palmsP.some((q) => Math.hypot(q.x - x, q.z - z) < 12.5)) continue;
        const near = path.nearestXZ(x, z);
        let s = pr.range(0.6, 1.16);
        if (near.dist < 11) s = Math.min(s, (near.y - 5.5) / 17.5);
        if (x > -24 && x < 34 && z > 735 && z < 848) s = Math.min(s, 27 / 17.5);
        s = underAxis(x, z, s, 0);
        if (s > 0.5) palmsP.push(psite(x, z, s));
      }
      await ctx.yield();
      valleyMeshes.push(add(plainFernGeo(pr, S), bigF, 0.05), add(fernTuftGeo(pr, S), smallF, 0.05));
      await ctx.yield();
      valleyMeshes.push(add(heliconiaGeo(pr, S), heliP, 0.05),
        add(palmGeo(pr, S, { h: 15, r: 0.3, sides: 6, segs: 3, fronds: 13, L: 5, w: 1.5, fsegs: 4, lean: 0.8, sway: 0.5, dark: 0.95 }), palmsP, 0.3));
    }
    await ctx.yield();
    // the flank: tree ferns under the wing, cloud-forest trees with mossy boughs beside it
    const treeFerns = [];
    for (let i = 0, n = thinN(135); i < n; i++) {
      const [x, z] = offPath(rng.range(DL(0.125), DL(0.318)), rng.sign() * rng.range(0, 46));
      if (x > -2.5) continue;
      const near = path.nearestXZ(x, z), gy = gAt(x, z);
      let s = rng.range(0.75, 1.3);
      if (near.dist < 10) s = Math.min(s, (near.y - 7 - gy) / 9.6);
      if (x > -36 && z > 758 && z < 846) s = Math.min(s, (29.5 - gy) / 11);      // (round 4) under the sight of the lip as we swing in
      if (s > 0.5) treeFerns.push(site(x, z, s));
    }
    add(treeFernGeo(rng, S), treeFerns, 0.2);
    await ctx.yield();
    const trees = [];
    frame(DL(0.2) + 13);
    const bearS = 1.45, bearTree = { x: P.x - R.x * 16.2, z: P.z - R.z * 16.2 };
    const bearTrees = [{ x: bearTree.x, y: gAt(bearTree.x, bearTree.z), z: bearTree.z, s: bearS, rot: Math.atan2(-R.z, R.x), tone: 0, ph: 1 }];
    const bearPos = new THREE.Vector3(bearTree.x + R.x * 3.6 * bearS, bearTrees[0].y + (8.28 - 0.4) * bearS, bearTree.z + R.z * 3.6 * bearS);
    const bearRight = R.clone();
    for (let i = 0; i < 30 && trees.length < 16; i++) {
      const [x, z] = offPath(DL(lerp(0.135, 0.305, (i + rng()) / 30)), rng.sign() * rng.range(17, 38));
      const sc = rng.range(0.9, 1.3);
      if (x > -10 || path.nearestXZ(x, z).dist < 8.6 * sc + 8.5) continue;
      if (Math.hypot(bearTree.x - x, bearTree.z - z) < 24 || trees.some((t) => Math.hypot(t.x - x, t.z - z) < 13)) continue;
      trees.push(site(x, z, sc));
    }
    add(forestTreeGeo(rng, S, false), trees, 0.4);
    await ctx.yield();
    add(forestTreeGeo(rng, S, true), bearTrees, 0.4);
    await ctx.yield();
    // (round 11) cinchonas in rose-pink flower through the forest leg: a rule of the forest's own band of the ground
    // (25 to 186 m) and of the distance from the route's line (9 to 44 m, more of them nearer), clear of the trees and
    // kept under the sight of the lip like the tree ferns. From a stream of their own.
    const cin = [];
    { const cq = ctx.core.makeRng((((ctx.seed ?? 1) >>> 0) ^ 0x2c1b3c6d) >>> 0);
      for (let t = 0; t < 1100 && cin.length < 34; t++) {
        const x = cq.range(-95, -4), z = cq.range(690, 865), k = cq(), gy = gAt(x, z);
        if (gy < 25 || gy > 186) continue;
        const near = path.nearestXZ(x, z);
        if (near.dist < 9 || near.dist > 44 || k > 1 - 0.8 * smoothstep(18, 44, near.dist)) continue;
        if (Math.hypot(bearTree.x - x, bearTree.z - z) < 15 || trees.some((q) => Math.hypot(q.x - x, q.z - z) < 8) || cin.some((q) => Math.hypot(q.x - x, q.z - z) < 7)) continue;
        let sc = cq.range(0.8, 1.25);
        if (near.dist < 13) sc = Math.min(sc, (near.y - 8 - gy) / 5.6);
        if (x > -36 && z > 758 && z < 846) sc = Math.min(sc, (29.5 - gy) / 5.6);
        if (sc > 0.6) cin.push({ x, y: gy, z, s: sc, rot: cq() * TAU, tone: cq.range(-0.06, 0.08), ph: cq() * TAU });
      } }
    const cinMesh = add(cinchonaGeo(ctx.core.makeRng((((ctx.seed ?? 1) >>> 0) ^ 0x165667b1) >>> 0), S), cin, 0.15);
    cinMesh.material = hero.materials.plantOut;      // (round 12) the same material with a size of its own: see update
    await ctx.yield();
    // (round 12) the understorey of the forest leg. The design asks for 4,000 ferns and 220 tree ferns; the forest ground
    // by the line stood half bare. A rule of the map: places are tried along the route's line through the forest (the
    // line is walked every 2 m from its start: from the first metre of it that has forest-band ground on the living side
    // of the cut under it, to the metre after that at which it crosses the cut to the page or leaves that band, whichever
    // comes first; a line that never meets such ground gets no understorey), up to 45 m either side of it,
    // two in three of them within 25 m; on the living side of the cut, on ground of the forest band (5 to 192 m up). A
    // place is taken where under 45 in 100 of the ground a rosette would cover is under a fern already (the ferns and
    // tree ferns that stand are counted first, and every one that is added), so that rosettes overlap but none is spent
    // on ground that is covered: this is what fills the ground rather than piling plants up. One in five is a tree fern's
    // crown on 2.6 to 5 m of trunk; beside the line (within 14 m on the map) its top is held 9 m under the line, and one
    // that would then have under 1.5 m of trunk is a floor rosette. A floor rosette lies to the slope. Every plant has a
    // green of its own (toward gamboge or toward verditer). Nothing that stood is moved or removed. The stream is its
    // own, named for it: nothing else is dealt differently.
    const under = [];
    {
      const uq = ctx.core.makeRng(ctx.core.hashSeed('cut-mountain:understorey:' + ctx.seed));
      const cover = new Set(), CK = (i, j) => (i + 2048) * 4096 + (j + 2048);
      const disc = (x, z, r, f) => { for (let i = Math.floor(x - r); i <= x + r; i++) for (let j = Math.floor(z - r); j <= z + r; j++) { const ex = i + 0.5 - x, ez = j + 0.5 - z; if (ex * ex + ez * ez < r * r) f(CK(i, j)); } };
      const lay = (x, z, r) => disc(x, z, r, (k) => cover.add(k));
      let nAll = 0, nHit = 0;
      const tally = (k) => { nAll++; if (cover.has(k)) nHit++; };
      // (what stands: a fern tuft reaches 1.4 m at its own size, a tree fern's crown 3.6 m)
      for (const q of ferns) if (q.x < 0) lay(q.x, q.z, 1.4 * q.s);
      for (const q of treeFerns) lay(q.x, q.z, 3.6 * q.s);
      await ctx.yield();
      const REACH = 2.5;        // (a rosette's fronds reach 2.5 m on the map at its own size)
      // (the stretch, found from the route and the ground: the same band and the same side of the cut as the loop tests)
      const forestUnder = (d) => { frame(d); if (P.x > -1.5) return false; const gy = gAt(P.x, P.z); return gy >= 5 && gy <= 192; };
      let d0 = -1, d1 = L;
      for (let d = 0, i = 0; d <= L; d += 2, i++) {
        if (i % 120 === 119) await ctx.yield();
        const f = forestUnder(d);
        if (d0 < 0) { if (f) d0 = d; } else if (!f) { d1 = d; break; }
      }
      await ctx.yield();
      for (let t = 0; d0 >= 0 && t < 5600 && under.length < 520; t++) {
        if (t % 350 === 349) await ctx.yield();
        const inner = uq() < 0.66, [x, z] = offPath(uq.range(d0, d1), uq.sign() * (inner ? uq.range(0, 25) : uq.range(25, 45)));
        const kind = uq(), sz = uq(), tr = uq(), hueK = uq(), hueA = uq.range(0.1, 0.95), rot = uq() * TAU, tone = uq.range(-0.06, 0.06), ph = uq() * TAU;
        if (x > -1.5) continue;
        const gy = gAt(x, z);
        if (gy < 5 || gy > 192) continue;
        const near = path.nearestXZ(x, z), hue = hueK < 0.55 ? -hueA : -1 - hueA;
        let crown = kind < 0.2, sc = crown ? lerp(1.15, 1.5, sz) : lerp(0.8, 1.3, sz), heart = gy + 0.25;
        if (crown) {
          heart = gy + lerp(2.6, 5, tr);
          if (near.dist < 14) heart = Math.min(heart, near.y - 9 - 1.2 * sc);                     // (its fronds stand 1.2 m over its heart at its own size)
          if (x > -36 && z > 758 && z < 846) heart = Math.min(heart, 29.5 - 1.2 * sc);          // under the sight of the lip, as the tree ferns are
          if (Math.hypot(bearTree.x - x, bearTree.z - z) < 9) heart = gy;                        // none stands before the bear
          if (heart - gy < 1.5) { crown = false; sc = lerp(0.8, 1.3, sz); heart = gy + 0.25; }
        }
        // a floor rosette under the line itself lies 7 m and more below it
        if (!crown && near.dist < REACH * sc + 4 && near.y - gy < 7 + 1.5 * sc) continue;
        if (trees.some((q) => Math.hypot(q.x - x, q.z - z) < 2.6) || Math.hypot(bearTree.x - x, bearTree.z - z) < 2.6) continue;      // not through a trunk
        nAll = 0; nHit = 0; disc(x, z, REACH * sc, tally);
        if (nHit > 0.45 * nAll) continue;
        lay(x, z, REACH * sc);
        if (crown) under.push({ x, y: heart - 5 * sc, z, s: sc, rot, tone, ph, hue });
        else {
          const sx = (gAt(x + 1.5, z) - gAt(x - 1.5, z)) / 3, sz2 = (gAt(x, z + 1.5) - gAt(x, z - 1.5)) / 3, up = new THREE.Vector3(-0.6 * sx, 1, -0.6 * sz2).normalize();
          under.push({ x: x - up.x * 5 * sc, y: heart - up.y * 5 * sc, z: z - up.z * 5 * sc, s: sc, rot, tone, ph, hue, up });
        }
      }
    }
    await ctx.yield();
    const underMesh = instancePlants(rosetteGeo(ctx.core.makeRng(ctx.core.hashSeed('cut-mountain:rosette:' + ctx.seed)), S), hero.materials.plantOut, under, 0, (q) => q.hue);
    scene.add(underMesh);
    await ctx.yield();
    // passionflower vines over the cut edge, tussock along the ridge
    const vines = [];
    for (let i = 0; i < 90; i++) {
      const z = rng.range(212, 706);
      if (A_.falls.some((f) => Math.abs(f.top.z - z) < 6) || Math.abs(z - A_.passionflowers.z) < 5) { rng(); continue; }
      vines.push({ x: 0.36, y: gAt(-0.01, z) - 0.35, z, s: rng.range(0.8, 1.5), rot: 0, tone: 0, ph: z * 0.3 });
    }
    add(vineGeo(rng, S), vines, 0);
    // tree roots hanging down the face from under the forest and the paramo, dark on the tinted beds; each stops short of
    // whatever is drawn below it (a plate, a cave, the tapir's ledge). They draw from a stream of their own.
    {
      const rr = ctx.core.makeRng((((ctx.seed ?? 1) >>> 0) ^ 0x3c6ef372) >>> 0), sitesR = [], lay = hero.layout, tb = A_.boxes[3];
      const blocks = A_.boxes.map((b) => ({ z: b.position.z, hw: b.size.x / 2 + 1.5, top: b.position.y + b.size.y / 2 }))
        .concat(lay.caves.map((c) => ({ z: c.z - (c.dark ? 0 : 3), hw: c.rx + (c.dark ? 1.5 : 5), top: c.dark ? c.y + c.ry * 1.15 : 1e4 })));
      for (let i = 0; i < 58; i++) {
        const z = lerp(712, 236, (i + rr()) / 58), top = gAt(-0.01, z), sz = rr.range(1.0, 2.7);
        if (A_.falls.some((f) => Math.abs(f.top.z - z) < 6.5) || Math.abs(z - lay.ventZ) < 9) continue;
        let room = Math.min(26, top * 0.6);
        for (const b of blocks) if (Math.abs(b.z - z) < b.hw + 3) room = Math.min(room, top - b.top - 1.2);
        if (z < tb.position.z - tb.size.x / 2 + 3 && z > tb.position.z - tb.size.x / 2 - 30) room = Math.min(room, 9.5);
        if (room < 5) continue;
        sitesR.push({ x: 0, y: top - 0.6, z, s: Math.min(sz, room / 9.6), rot: 0, tone: rr.range(-0.05, 0.08), ph: 0 });
      }
      add(rootGeo(rr, S), sitesR, 0);
    }
    const tuss = [];
    for (let i = 0, n = thinN(2500); i < n; i++) {
      frame(DL(rng.range(0.56, 0.885)));
      const x = Math.min(-1.2, Math.min(P.x, 0) * 0.8 + rng.gauss() * 15), z = P.z + rng.range(-4, 4);
      const st = { x, y: gAt(x, z), z, s: rng.range(0.7, 1.5), rot: rng() * TAU, tone: rng.range(-0.05, 0.1), ph: rng() * TAU };
      if (hero.flowAt(x, z) > 2.5 && st.y < 312) tuss.push(st);      // (round 11: tussock is of the paramo; the ash above 312 m is bare)
      if ((i & 255) === 255) await ctx.yield();
    }
    ridgeMeshes.push(add(tussockGeo(rng, S), tuss, 0.03));
    // rock outcrops on the ash and snow of the upper ridge: snow-capped above the snowline, a drift in the lee of each
    const stones = [];
    for (let i = 0, n = thinN(230); i < n; i++) {
      frame(DL(rng.range(0.76, 0.985)));
      const x = P.x + (rng.chance(0.42) ? 1 : -1) * (1.5 + Math.abs(rng.gauss()) * 9), z = P.z + rng.range(-5, 5);
      if (x > -1) { rng(); continue; }
      const y = gAt(x, z);
      if (path.distanceTo(x, y, z) < 7.5 || hero.flowAt(x, z) < 4) continue;
      stones.push({ x, y, z, s: rng.range(0.6, 2.0), rot: 0.5 + rng.range(-0.6, 0.6), tone: rng.range(-0.05, 0.1), ph: 0, snow: y > 366 - (weather === 'sleet' ? 95 : 0) ? 1 : 0 });
    }
    // (round 11) none on the vicunas' trail, 6.5 to 15.5 m left of the line on the ash
    const offTrail = (p) => { const rn = hero.routeNear(p.x, p.z); return !(p.y > 300 && rn.left > 0 && rn.d > 6.5 && rn.d < 15.5); };
    const stonesKept = stones.filter(offTrail);
    ridgeMeshes.push(add(plateKit.rockGeometry(rng, S), stonesKept, 0.1));
    await ctx.yield();
    // (round 4) rock tors left of the ridge line: the large near form of the slope pictures, the lava stream running down
    // behind them to the left of the summit. They draw from a stream of their own.
    {
      const tr = ctx.core.makeRng((((ctx.seed ?? 1) >>> 0) ^ 0x7a3d91) >>> 0), tors = [];
      for (const [uu, lat, s] of [[0.706, 17, 1.3], [0.752, 19, 0.7], [0.812, 21, 0.95]]) {
        frame(DL(uu));
        const x = P.x - R.x * lat, z = P.z - R.z * lat, y = gAt(x, z);
        if (hero.flowAt(x, z) > 7 * s) tors.push({ x, y, z, s, rot: tr() * TAU, tone: tr.range(0, 0.08), ph: 0, snow: y > 366 - (weather === 'sleet' ? 95 : 0) ? 1 : 0 });
      }
      ridgeMeshes.push(add(torGeo(tr, S), tors, 0.2));
      // (round 11) the two files of ribs that round 5 stood either side of the last run, by their distance from the end
      // of the path, are gone: the ribs are the hero's now, by a rule of the ground (ribField in src/parts/cut-mountain.js)
    }
    await ctx.yield();
    // tree ferns leaning out over the cut edge all along the page, where the forest is cut through
    const edgeFerns = [];
    for (let i = 0; i < 46; i++) {
      const z = lerp(700, 425, (i + rng()) / 46), x = -rng.range(2.2, 9.5), y = gAt(x, z);
      if (y < 196 && path.distanceTo(x, y + 8, z) > 13) edgeFerns.push({ x, y, z, s: rng.range(0.8, 1.3), rot: rng() * TAU, tone: rng.range(-0.08, 0.1), ph: rng() * TAU });
    }
    add(treeFernGeo(rng, S), edgeFerns, 0.2);
    await ctx.yield();

    // ---------------------------------------------------------- stipple mist, valley cloud, sleet or ash
    const mist = [];
    const card = (x, y, z, size, asp, seed, rate) => mist.push(x, y, z, size, asp, seed, rate);
    card(bearPos.x - bearRight.x * 6, bearPos.y + 1.2, bearPos.z - bearRight.z * 6, 5.5, 1.7, 0.5, 0);      // the pale ground the bear is read against
    // (round 11) a bank of pale stipple stands behind each forest tree as it is seen from the route's line, at the height
    // of its boughs, so that the mossy boughs are dark on pale; it thins as we come up to it but never clears. Placed from
    // each tree's own place and its bearing from the line; sizes and seeds from a stream of their own.
    { const mq = ctx.core.makeRng((((ctx.seed ?? 1) >>> 0) ^ 0x27d4eb2f) >>> 0);
      for (const t of trees) {
        const n = path.nearestXZ(t.x, t.z); path.pointAt(n.u, P);
        const dx = t.x - P.x, dz = t.z - P.z, dl = Math.hypot(dx, dz) || 1, far = 7.5 * t.s;
        card(Math.min(t.x + (dx / dl) * far, -5), t.y + mq.range(8.2, 9.6) * t.s, t.z + (dz / dl) * far, mq.range(6.2, 7.6) * t.s, mq.range(1.7, 2.2), mq(), -mq.range(0.006, 0.012));
      } }
    const belt = weather === 'belt';
    for (let i = 0, n = Math.round(36 * (0.6 + 0.4 * detail)); i < n; i++) {
      const [x, z] = offPath(DL(rng.range(0.1, 0.33)), rng.sign() * rng.range(9, 58));
      const xx = Math.min(x, -4), size = rng.range(3.2, 6.5);
      card(xx, gAt(Math.min(xx, -0.01), z) + rng.range(4, 20), z, size, rng.range(1.6, 2.6), rng(), rng.range(0.008, 0.018));
    }
    // (round 5) the cloud belt: two staggered ranks of banks right round the living flank where the cloud forest stands
    // (95 to 185 m up), the middle third of the mountain blank behind the palms, and a mass of low banks lying in the
    // trees beyond the bear's bough, so that bear and cub are black on bare paper.
    if (belt) {
      const br = ctx.core.makeRng((((ctx.seed ?? 1) >>> 0) ^ 0x68bc21eb) >>> 0), bb = [], bs = [];
      const bank = (x, y, z, hh, asp) => { bb.push(x, y, z); bs.push(hh, Math.max(1.2, Math.min(asp, (-x - 12) / (0.85 * hh))), br(), br.range(0.05, 0.11)); };
      const rAt = (a, hT) => { let lo = 200, hi = 860; for (let k = 0; k < 18; k++) { const r = (lo + hi) / 2; if (gAt(-r * Math.cos(a), r * Math.sin(a)) > hT) lo = r; else hi = r; } return (lo + hi) / 2; };
      for (let row = 0; row < 2; row++) for (let i = 0; i < 22; i++) {
        const a = lerp(-1.3, 1.36, (i + 0.5 * row + br.range(-0.2, 0.2)) / 22), hT = row ? br.range(150, 172) : br.range(104, 126), r = rAt(a, hT);
        const x = -r * Math.cos(a), z = r * Math.sin(a), hh = br.range(24, 36);
        bank(x, gAt(x, z) + hh * 0.52, z, hh, br.range(2.1, 3.1));
      }
      frame(DL(0.212));
      const cx = P.x, cy = P.y, cz = P.z, bx = bearPos.x - cx, bz = bearPos.z - cz, bl = Math.hypot(bx, bz) || 1;
      for (const [far, lat, hh, asp] of [[24, -7, 9, 2.4], [30, 13, 10, 2.2], [52, 2, 15, 2.6], [78, -26, 18, 2.5], [84, 30, 17, 2.4], [120, 4, 24, 2.8], [158, -40, 26, 2.6], [165, 44, 25, 2.6], [200, 0, 30, 3]]) {
        const x = Math.min(bearPos.x + (bx / bl) * far - (bz / bl) * lat, -6), z = bearPos.z + (bz / bl) * far + (bx / bl) * lat;
        bank(x, gAt(x, z) + hh * 0.42, z, hh, asp);
      }
      const nB = bs.length / 4, bg = quadInstances(nB);
      bg.setAttribute('aBase', new THREE.InstancedBufferAttribute(new Float32Array(bb), 3)); bg.setAttribute('aSeed', new THREE.InstancedBufferAttribute(new Float32Array(bs), 4));
      const beltMesh = new THREE.Mesh(bg, new THREE.ShaderMaterial({ uniforms: { ...U }, vertexShader: BELT_VERT, fragmentShader: BELT_FRAG }));
      beltMesh.frustumCulled = false; scene.add(beltMesh);
    }
    const nMist = mist.length / 7, mg = quadInstances(nMist), mb = new Float32Array(nMist * 3), ms = new Float32Array(nMist * 4);
    for (let i = 0; i < nMist; i++) { mb.set(mist.slice(i * 7, i * 7 + 3), i * 3); ms.set(mist.slice(i * 7 + 3, i * 7 + 7), i * 4); }
    mg.setAttribute('aBase', new THREE.InstancedBufferAttribute(mb, 3)); mg.setAttribute('aSeed', new THREE.InstancedBufferAttribute(ms, 4));
    const mistMesh = new THREE.Mesh(mg, new THREE.ShaderMaterial({ uniforms: { ...U, uDrift: { value: new THREE.Vector3(-0.45, 0.35, -0.6) }, uMistNear: { value: 26 }, uMistDots: { value: belt ? 0 : 1 } },
      vertexShader: MIST_VERT, fragmentShader: MIST_FRAG }));
    mistMesh.frustumCulled = false; scene.add(mistMesh);
    if (weather === 'valley') {
      const sea = new THREE.Mesh(new THREE.PlaneGeometry(1000, 520), new THREE.ShaderMaterial({ uniforms: { ...U }, vertexShader: SEA_VERT, fragmentShader: SEA_FRAG, side: THREE.DoubleSide }));
      sea.rotation.x = -Math.PI / 2; sea.position.set(0, 12.5, 1040); sea.frustumCulled = false; scene.add(sea);
    }
    let fallU = null, fallMesh = null;
    if (weather === 'sleet' || rare) {
      const n = Math.round((rare ? 5200 : 1700) * (0.5 + 0.5 * detail)), fg = quadInstances(n), fb = new Float32Array(n * 3), fs = new Float32Array(n);
      for (let i = 0; i < n; i++) { fb[i * 3] = rng() * 60; fb[i * 3 + 1] = rng() * 60; fb[i * 3 + 2] = rng() * 60; fs[i] = rng(); }
      fg.setAttribute('aBase', new THREE.InstancedBufferAttribute(fb, 3)); fg.setAttribute('aSeed', new THREE.InstancedBufferAttribute(fs, 1));
      fallU = { ...U, uCam: { value: new THREE.Vector3() }, uVel: { value: rare ? new THREE.Vector3(-0.7, -1.7, 0.4) : new THREE.Vector3(-5.5, -9.5, 2.6) },
        uFall: { value: new THREE.Vector3(0, 0.5, rare ? 1 : 0) } };
      const fm = new THREE.Mesh(fg, new THREE.ShaderMaterial({ uniforms: fallU, vertexShader: FALL_VERT, fragmentShader: FALL_FRAG, side: THREE.DoubleSide }));
      fm.frustumCulled = false; scene.add(fm); fallMesh = fm;
    }
    await ctx.yield();

    // ---------------------------------------------------------- creatures
    const creMat = plateMaterial(U, { uFarTint: { value: 0 } }, CREATURE_VERT, PLANT_FRAG, { side: THREE.DoubleSide });
    const nCondor = third ? 2 : 1;
    const condors = creatureMesh(condorGeo(S), creMat, nCondor); scene.add(condors.mesh);
    // (fourth hand mend after round 13) our own primaries have a material of their own in the plate family, made here
    // once: a wash laid over the plate behind it (what the fragment adds, plus the plate behind times the share it lets
    // through; the picture's own alpha is left alone). They are drawn after everything else, each quill writing its
    // depth, so that no quill is washed twice where two cross.
    const wingMat = plateMaterial(U, {}, WING_VERT, WING_FRAG, { side: THREE.DoubleSide });
    wingMat.transparent = true; wingMat.blending = THREE.CustomBlending; wingMat.blendSrc = THREE.OneFactor; wingMat.blendDst = THREE.SrcAlphaFactor;
    wingMat.blendSrcAlpha = THREE.ZeroFactor; wingMat.blendDstAlpha = THREE.OneFactor;
    const wings = [creatureMesh(wingtipGeo(-1), wingMat, 1), creatureMesh(wingtipGeo(1), wingMat, 1)]; scene.add(wings[0].mesh, wings[1].mesh);
    wings[0].mesh.visible = wings[1].mesh.visible = false; wings[0].mesh.renderOrder = wings[1].mesh.renderOrder = 20;
    const NP = 60, NB = 40;
    const parrots = creatureMesh(parrotGeo(S), creMat, NP); scene.add(parrots.mesh);
    frame(36);
    const pBirds = [], wheelA = DL(0.085), wheelB = DL(0.16), wheelC = DL(0.29);
    for (let i = 0; i < NP; i++) {
      if (i < NB) pBirds.push({ u0: rng.range(-0.036, 0.03), ph: rng() * TAU,
        s: new THREE.Vector3(rng.range(-2.5, 2.5), rng.range(-1, 1.5), rng.range(-2.5, 2.5)).add(parrotSrc),
        // (round 4) they go up and away to the left, into the ruled sky over the forest: the cut face ahead stays clear of them
        v: new THREE.Vector3().addScaledVector(R, -rng.range(2, 7)).addScaledVector(T, rng.range(3, 8)).setY(rng.range(1.5, 4)) });
      else pBirds.push({ w: rng.range(0.5, 0.85) * rng.sign(), r: rng.range(6.5, 13), h: rng.range(-1, 4), ph: rng() * TAU });
    }
    // (round 5) the burst is staged for the new entry: the birds leave the crown from 8 to 30 m into the flight, climb out
    // of the palms and fly with us, 6 to 30 m ahead and to the left of the bow, dark on the ruled sky left of the section;
    // as the line swings west they peel away to the left. Drawn from a stream of their own.
    {
      const qr = ctx.core.makeRng((((ctx.seed ?? 1) >>> 0) ^ 0x2545f491) >>> 0);
      for (let i = 0; i < NB; i++) {
        const b = pBirds[i], near = i % 4 === 0;
        b.d0 = near ? qr.range(14, 27) : qr.range(5, 30);
        b.vT = qr.range(15, 19); b.vR = near ? qr.range(2.6, 4.2) : qr.range(0.8, 3.6); b.hh = near ? qr.range(11, 15) : qr.range(10, 19);
        b.dirT = T.clone(); b.dirR = R.clone();
      }
    }
    await ctx.yield();
    // hummingbirds at the Puya towers by the ridge and at the bromeliads of the forest trees
    const hSites = [];
    hero.sites.puya.map((p) => ({ p, d: path.nearestXZ(p.x, p.z).dist })).filter((e) => e.d < 30).sort((a, b) => a.d - b.d).slice(0, 12)
      .forEach((e) => hSites.push(new THREE.Vector3(e.p.x, e.p.y + 3.2 * e.p.s, e.p.z)));
    bearTrees.concat(trees.slice(0, 7)).forEach((t) => { const c = Math.cos(t.rot), s = Math.sin(t.rot); hSites.push(new THREE.Vector3(t.x + c * 6.2 * t.s, t.y + 9.3 * t.s, t.z - s * 6.2 * t.s)); });
    const NH = hSites.length ? 40 : 0, hummers = creatureMesh(hummerGeo(S), creMat, Math.max(1, NH)); scene.add(hummers.mesh);
    const hBirds = [];
    for (let i = 0; i < NH; i++) {
      const c = hSites[i % hSites.length], a = rng() * TAU, b = a + rng.range(1, 2.6);
      hBirds.push({ c, a: new THREE.Vector3(Math.cos(a) * 0.9, rng.range(-0.5, 0.6), Math.sin(a) * 0.9), b: new THREE.Vector3(Math.cos(b) * 0.9, rng.range(-0.5, 0.6), Math.sin(b) * 0.9),
        rate: rng.range(0.16, 0.34), ph: rng() });
    }
    // pace: slow down the palm aisle, a little under the average along the page and out over the drop, where the plates wake and
    // the section stands whole, brisker up the ridge beside the herd, easy into the ring
    const speeds = (uN) => { const u = toL(uN); return 0.82 + 0.12 * smoothstep(0.08, 0.16, u) + 0.2 * smoothstep(0.6, 0.72, u) - 0.14 * smoothstep(0.86, 0.94, u); };
    const v0h = { x: 0, y: 0, z: 0 };
    // (round 11) vicunas (or white-tailed deer) on the ash. Their trail lies on the ground 11 m to the left of the route's
    // line, the living side, from where the line comes back over the living half to its end. All that the herd does is
    // decided from the trail's own ground (the foot of the ash, where it stands at 310 m; its head, where it reaches 376 m
    // and the ash gives way to rock and snow) and from the camera's own place along it, in metres: no flight fraction.
    const NV = deer ? 12 : 16, herd = creatureMesh(grazerGeo(S, deer), creMat, NV); scene.add(herd.mesh);
    const track = [];
    let dA = Math.floor(L); while (dA > 1 && path.posAtDist(dA - 1, P).x < -1) dA -= 1;
    { let len = 0, px = 0, py = 0, pz = 0;
      for (let dd = dA; dd <= L; dd += 1) {
        frame(dd);
        const x = Math.min(P.x - R.x * 11, -2), z = P.z - R.z * 11, y = gAt(x, z);
        if (track.length) len += Math.hypot(x - px, y - py, z - pz);
        track.push({ x, y, z, len, d: dd }); px = x; py = y; pz = z;
      } }
    const trackLen = track[track.length - 1].len;
    const trackAt = (s, out) => {
      let i = Math.min(track.length - 2, Math.max(0, Math.floor((s / trackLen) * (track.length - 1))));
      while (i > 0 && track[i].len > s) i--;
      while (i < track.length - 2 && track[i + 1].len < s) i++;
      const a = track[i], b = track[i + 1], f = clamp((s - a.len) / Math.max(b.len - a.len, 1e-3), 0, 1);
      out.x = lerp(a.x, b.x, f); out.z = lerp(a.z, b.z, f); out.y = lerp(a.d, b.d, f); return out;      // (y: the route metre abeam)
    };
    // the trail metre abeam of a route metre (the track holds one point to every metre of the route)
    const trailOf = (dd) => { const f = clamp(dd - dA, 0, track.length - 1.001), i = Math.floor(f); return lerp(track[i].len, track[i + 1].len, f - i); };
    const iFoot = Math.max(0, track.findIndex((q) => q.y >= 310)), iHead = track.findIndex((q, i) => i > iFoot && q.y >= 376);
    const sFoot = track[iFoot].len, sHead = iHead < 0 ? trackLen - 20 : track[iHead].len, ashLen = sHead - sFoot;
    // our own speed over the ground at a route metre, in m/s: the pace below, scaled as the engine scales it
    let paceK = 0; for (let i = 0; i < 64; i++) paceK += 2 / (speeds(i / 64) + speeds((i + 1) / 64));
    const camSpeed = (dd) => (L / 50) * speeds(clamp(dd / L, 0, 1)) * (paceK / 64);
    // (round 12) THE LAW OF THE HERD, in metres of the trail.
    // Where they graze: over the lower two thirds of the ash (the design: the gallop is 'up the ash beside us', so they
    // must have ash above them to run on), in twos and threes: the lower groups set evenly up that stretch from its foot,
    // the two highest (the leaders) at its head. The animals of a group stand 2.1 to 2.7 m apart along the trail (a
    // vicuna is 1.5 m long at this size: they can run in file as they stood without touching) in lanes 1.9 m apart across
    // it (the trail's strip is 9 m wide; three lanes keep every animal inside it and 11 m, give or take 3.6, from our
    // line: the design's 11 m off).
    // When one breaks: when we are within its lead of it along the trail. The lead is the designer's rule: a group
    // breaks when we are as far short of it as we gain on it in five seconds. We gain on a galloping animal by our own
    // speed along the trail at the foot of the ash less its 13 m/s (the design's speed), so the lead is five times
    // that difference: one number of metres for every group, worked out below from the two speeds, not written down
    // (we gain some 13 to 15 m/s: 65 to 75 m). Nothing is added for the 3 m an animal loses off the mark: we come
    // level with one that has ash enough above it a little under five seconds after it breaks, and one that has not
    // gallops for as long as the band gives. The lower groups so break while we are still below the foot of the ash;
    // if the trail below a group were shorter than its lead, it would break as we come onto the trail. A group breaks
    // together, on the lead of its lowest animal, and runs as it stood. (third mend after round 12) The leaders are a
    // group like the rest (the two highest groups break as one): they break on the same lead, run up the band in their
    // lanes and pull up where the ash lets them, before we are level; theirs is a gallop as long as the band gives.
    // How far one runs: until we are level with it (a length worked out from its lead and our speed at its place), then
    // two to three strides more (8 to 12 m; a stride is 4.27 m of the animal's size), and it pulls up behind us; none
    // runs nearer the head of the ash than 8 m (above it the trail is rock and snow), and those that would pull up there
    // stand in ranks below it, as the file's rule has it.
    // The file (third mend after round 12): no two animals are ever nearer to each other than two may stand, 2 m nose
    // to tail or 1.3 m flank to flank, at any moment of the run or after it. Two animals are in one lane if their
    // lines come that near to each other anywhere they both go. An animal that comes up behind another in its lane
    // holds its place 2 m behind it (it takes that animal's speed) and pulls up 2 m behind where that one stands;
    // two that are not in one lane may run and stand abreast.
    // What they keep clear of: the cushions, frailejones, puyas, stones and rock ribs that stand on or beside the trail
    // (none of them is moved for the herd). Each animal's line up the trail is its lane, bent round every one of them so
    // that it passes 0.6 m and more beyond the thing's own radius (its own half width, 0.3 m, and as much again), and
    // never further than 3.6 m from the middle of the trail; where no such line is to be had its run ends 2.5 m short
    // of what stands in the way. The line is worked out once, at every metre of the trail the animal will run.
    const groupsOf = deer ? HERD.deer.sizes : HERD.vicuna.sizes, placeOf = deer ? HERD.deer.places : HERD.vicuna.places, grazeLen = (2 / 3) * ashLen;
    const LOSS = 3, VRUN = 13, LANES = [-1.9, 0, 1.9];
    // our speed along the trail (the trail runs a little longer than the line it follows) at the foot and at the head
    const trailSpeed = (i) => { const j = clamp(i, 0, track.length - 9); return camSpeed(track[j].d) * (track[j + 8].len - track[j].len) / 8; };
    const vFoot = trailSpeed(iFoot), vHead = trailSpeed(iHead < 0 ? track.length - 28 : iHead - 8);
    const LEAD0 = 5 * (vFoot - VRUN);
    // what stands by the trail, in the trail's own coordinates: metres along it, metres to the right of it, and its
    // half lengths along and across the trail (a rock rib's body is long down the fall line; the rest are round)
    const stood = [];
    { const put = (x, z, rLong, rShort = rLong, ax = 0, az = 0) => {
        let bi = 0, bd = 1e18;
        for (let i = 0; i < track.length; i++) { const q = track[i], e = (q.x - x) * (q.x - x) + (q.z - z) * (q.z - z); if (e < bd) { bd = e; bi = i; } }
        if (bd > 100 || track[bi].y < 296) return;
        const q0 = track[Math.max(bi - 1, 0)], q1b = track[Math.min(bi + 1, track.length - 1)], hx = q1b.x - q0.x, hz = q1b.z - q0.z, hl = Math.hypot(hx, hz) || 1;
        const al = ((x - track[bi].x) * hx + (z - track[bi].z) * hz) / hl, lat = ((x - track[bi].x) * hz - (z - track[bi].z) * hx) / hl;
        const c = (ax * hx + az * hz) / hl, sn = Math.sqrt(Math.max(0, 1 - c * c));       // how far the long axis lies along the trail
        stood.push({ s: track[bi].len + al, lat, ra: Math.hypot(rLong * c, rShort * sn), rl: Math.hypot(rLong * sn, rShort * c) });
      };
      const hs = hero.sites;
      for (const q of hs.frail) put(q.x, q.z, 1.1 * q.s);
      for (const q of hs.frailNew || []) put(q.x, q.z, 1.1 * q.s);
      for (const q of hs.puya) put(q.x, q.z, 1.9 * q.s);
      for (const q of hs.cushNear) put(q.x, q.z, 2.0 * q.s);
      for (const q of hs.cushFar) put(q.x, q.z, 1.5 * q.s);
      for (const q of stonesKept.concat(hs.rocks || [])) put(q.x, q.z, 1.15 * q.s);      // (the rock itself: its snowdrift is low)
      for (const q of hs.ribs) { if (q.top < 0.5) continue; const r = Math.hypot(q.x, q.z) || 1; put(q.x, q.z, Math.max(q.rz, 0.6 * q.top / 0.7) - 0.25, Math.max(q.rx, 0.45 * q.top / 0.7) - 0.25, q.x / r, q.z / r); } }      // (a rib's body is cut back from these lengths: a quarter of a metre is taken off them)
    await ctx.yield();
    const hAnimals = [], leadFrom = groupsOf.length - 2;
    { let i = 0;
      for (let g = 0; g < groupsOf.length; g++) for (let m = 0; m < groupsOf[g]; m++, i++) {
        // (four draws to an animal, as before; the herd is dealt anew from them)
        const jit = rng(), latJ = rng.range(-2.8, 2.8), ph = rng() * TAU, sc = rng.range(0.84, 0.93);
        const s0 = sFoot + clamp(grazeLen * placeOf[g] + (m - (groupsOf[g] - 1) / 2) * 2.4 + 0.6 * (jit - 0.5), 1, grazeLen);
        // band: the animals that break together and run as they stood (a group; the two groups of leaders are one band)
        hAnimals.push({ s0, lat0: LANES[(m + g) % 3] + latJ * 0.15, ph, sc, band: Math.min(g, leadFrom), lead: LEAD0, dBreak: 0, run: 0 });
      } }
    const bandFirst = (an) => hAnimals.find((q) => q.band === an.band);
    // how far an animal at 13 m/s has run since we passed the place where it breaks, when we are at route metre dd
    // (Simpson's rule on our own speed)
    const gallop = (an, dd) => {
      if (dd <= an.dBreak) return 0;
      let a = 0; const h = (dd - an.dBreak) / 8;
      for (let i = 0; i <= 8; i++) a += (i === 0 || i === 8 ? 1 : i % 2 ? 4 : 2) / camSpeed(an.dBreak + i * h);
      return (VRUN * a * h) / 3;
    };
    // metres an animal has run: eased off the mark over 3 m, eased to a stand over the last 2.5 m
    const herdRun = (an, G) => { if (an.run < 0.5) return 0; const g = G * an.rate, g1 = g - LOSS * (1 - Math.exp(-g / LOSS)); return Math.max(0, an.run - 2.5 * Math.log(1 + Math.exp((an.run - g1) / 2.5))); };
    // an animal's place across the trail at a trail metre (its line is held at every metre from 1 m below where it grazes)
    const latAt = (an, sAt) => { const f = clamp(sAt - an.s0 + 1, 0, an.line.length - 1.001), k = Math.floor(f); return lerp(an.line[k], an.line[k + 1], f - k); };
    // an animal's line: the cheapest way up a lattice of places (every metre along the trail from 1 m below where it
    // stands, every 0.3 m across it) that keeps 0.55 m and more clear of everything that stands, turns no more than 0.9 m
    // across in a metre, and strays as little as may be from its lane. Returns how many metres of it could be had.
    const NLAT = 43, latOf = (j) => -6.3 + 0.3 * j;
    const findLine = (s0, lat0, n, line) => {
      const by = stood.filter((o) => o.s > s0 - 8 && o.s < s0 + n + 7), cost = new Float32Array(n * NLAT), from = new Int8Array(n * NLAT);
      let reach = -1;
      for (let k = 0; k < n; k++) {
        const sAt = s0 + k - 1; let any = false;
        for (let j = 0; j < NLAT; j++) {
          const la = latOf(j); let c = 1e9;
          if (!by.some((o) => Math.hypot((o.s - sAt) / (o.ra + 0.55), (o.lat - la) / (o.rl + 0.55)) < 1)) {
            if (k === 0) c = 0;
            else for (let e = -3; e <= 3; e++) { const j0 = j + e; if (j0 >= 0 && j0 < NLAT && cost[(k - 1) * NLAT + j0] + 0.5 * e * e < c) { c = cost[(k - 1) * NLAT + j0] + 0.5 * e * e; from[k * NLAT + j] = e; } }
            if (c < 1e8) { c += 0.2 * (la - lat0) * (la - lat0); any = true; }
          }
          cost[k * NLAT + j] = c;
        }
        if (!any) break;
        reach = k;
      }
      if (line && reach >= 0) {
        let j = 0; for (let q = 1; q < NLAT; q++) if (cost[reach * NLAT + q] < cost[reach * NLAT + j]) j = q;
        for (let k = reach; k >= 0; k--) { line[k] = latOf(j); j += from[k * NLAT + j]; }
        for (let k = reach + 1; k < n; k++) line[k] = line[reach];
        // (the lattice's corners are rounded off, except where rounding would take the line within 0.35 m of something)
        const raw = Float32Array.from(line);
        for (let pass = 0; pass < 2; pass++) { let prev = line[0]; for (let k = 1; k < n - 1; k++) { const c = line[k]; line[k] = 0.25 * prev + 0.5 * c + 0.25 * line[k + 1]; prev = c; } }
        for (let k = 1; k < n - 1; k++) if (by.some((o) => Math.hypot((o.s - (s0 + k - 1)) / (o.ra + 0.35), (o.lat - line[k]) / (o.rl + 0.35)) < 1)) line[k] = raw[k];
      }
      return reach;
    };
    // where each stands: its own place, or the nearest to it (up to 3.5 m down the trail or 9 m up it, 2 m and more
    // along it from those already placed) from which the first 20 m of a line can be had: none grazes boxed in by plants
    for (let i = 0; i < NV; i++) {
      const an = hAnimals[i], home = an.s0;
      for (const off of [0, 0.7, -0.7, 1.4, -1.4, 2.1, -2.1, 2.8, -2.8, 3.5, -3.5, 4.5, 5.5, 6.5, 7.5, 9]) {
        const c = home + off;
        if (c < sFoot + 1 || c > sFoot + grazeLen || hAnimals.some((q, j) => j < i && Math.abs(q.s0 - c) < 2)) continue;
        if (findLine(c, an.lat0, 21, null) === 20) { an.s0 = c; break; }
      }
      if (i % 2) await ctx.yield();                             // (the owner at its gate, 14 Oct: the search is long; nothing dealt here)
    }
    await ctx.yield();
    // the highest first: each stand is settled against those above it
    for (let i = NV - 1; i >= 0; i--) {
      const an = hAnimals[i];
      an.rate = 0.97 + 0.06 * (((an.band * 5) % 7) + 0.5) / 7;      // (three in a hundred either way, band by band)
      an.graze = i % 2 ? -1.15 : -0.1; an.yaw = 0.9 * ((((i * 5) % NV) + 0.5) / NV - 0.5);
      // where it would pull up: when we are level with it and two to three strides more (a length worked out from the
      // lead and our speed along the trail where it breaks), or 8 m below the head of the ash if that comes first (as
      // it does for the leaders); every animal by the one lead
      an.lead = LEAD0 + (an.s0 - bandFirst(an).s0);
      an.dBreak = trackAt(Math.max(an.s0 - an.lead, 0), v0h).y;
      const vc = trailSpeed(Math.round(an.dBreak - dA)), level = (VRUN * (an.lead - LOSS)) / Math.max(vc - VRUN, 4) - LOSS;
      let stop = Math.min(an.s0 + level + lerp(8, 12, (((i * 7) % NV) + 0.5) / NV), sHead - 8);
      const n = Math.max(4, Math.ceil(stop - an.s0) + 3), line = new Float32Array(n).fill(an.lat0), reach = findLine(an.s0, an.lat0, n, line);
      const by = stood.filter((o) => o.s > an.s0 - 8 && o.s < stop + 8);
      an.line = line;
      // (where no line is to be had, or the rounded line passes within 0.35 m of something, the run ends 2.5 m short)
      if (reach < n - 1) stop = Math.min(stop, an.s0 + reach - 1 - 1.5);
      for (let k = 1; k < n; k++) {
        const sAt = an.s0 + k - 1;
        if (sAt > stop + 1) break;
        if (by.some((o) => Math.hypot((o.s - sAt) / (o.ra + 0.35), (o.lat - line[k]) / (o.rl + 0.35)) < 1)) { stop = Math.min(stop, sAt - 2.5); break; }
      }
      // (and no two stand nearer than 2 m nose to tail, a length and a third, or 1.3 m flank to flank)
      for (let t = 0; t < 24; t++) {
        const la = latAt(an, stop);
        if (!hAnimals.some((q, j) => j > i && Math.hypot((q.s0 + q.run - stop) / 2, (latAt(q, q.s0 + q.run) - la) / 1.3) < 1)) break;
        stop -= 0.5;
      }
      an.run = Math.max(stop - an.s0, 0);
      if (i % 2) await ctx.yield();                             // (the owner at its gate, 14 Oct: as above)
    }
    await ctx.yield();
    // (third mend after round 12) the file. Which animals are in one lane: any two whose lines come nearer to each
    // other than two may stand (2 m nose to tail, 1.3 m flank to flank; a tenth is added for the steps of this
    // search) anywhere they both go, each between where it grazes and where it pulls up. The one that grazes lower
    // keeps 2 m and more behind the other for good (or as far behind as it grazes, if that is less), and its stand is
    // brought down to 2 m behind the other's: the highest first, each against those above it. (A run of under half a
    // metre is no run: the animal stands where it grazes.)
    const FILE = 2, fileOrder = hAnimals.map((an, i) => i).sort((a, b) => hAnimals[b].s0 - hAnimals[a].s0);
    for (const an of hAnimals) { an.ahead = []; an.gap = []; if (an.run < 0.5) an.run = 0; }
    for (let n = 1; n < NV; n++) {
      const i = fileOrder[n], an = hAnimals[i];
      for (let m = 0; m < n; m++) {
        const j = fileOrder[m], q = hAnimals[j], from = Math.max(an.s0, q.s0 - FILE), to = Math.min(an.s0 + an.run, q.s0 + q.run + FILE);
        let one = false;
        for (let s = from; s <= to && !one; s = s < to ? Math.min(s + 0.25, to) : to + 1) for (let e = -FILE; e <= FILE; e += 0.5) {
          const t = clamp(s + e, q.s0, q.s0 + q.run);
          if (Math.abs(t - s) <= FILE && Math.hypot((t - s) / FILE, (latAt(an, s) - latAt(q, t)) / 1.3) < 1.1) { one = true; break; }
        }
        if (one) { const r = Math.min(an.run, q.s0 + q.run - FILE - an.s0); an.ahead.push(j); an.gap.push(Math.min(FILE, q.s0 - an.s0)); an.run = r < 0.5 ? 0 : r; }
      }
    }
    await ctx.yield();
    // every animal's metres run when we are at route metre dd, the highest first: its own gallop, held behind those
    // above it in its lane (nothing is made here: the two lists are filled in place, one for the herd, one for the gaze)
    const herdX = new Float32Array(NV), herdXm = new Float32Array(NV);
    const herdPlaces = (dd, out) => {
      for (let n = 0; n < NV; n++) {
        const i = fileOrder[n], an = hAnimals[i]; let x = herdRun(an, gallop(an, dd));
        for (let k = 0; k < an.ahead.length; k++) { const j = an.ahead[k]; x = Math.min(x, hAnimals[j].s0 + out[j] - an.gap[k] - an.s0); }
        out[i] = Math.max(x, 0);
      }
      return out;
    };
    // the gaze's target: the middle of the animals ahead of us on the trail, each counted whole while it gallops between
    // just behind abeam and 34 m ahead, less and less from there to 46 m ahead, and for a twelfth of that while it stands
    // or is further off (a group breaks further off than that, on its five-second lead, and comes into the full count
    // as we close on it); and the trail's own ground for a twentieth (16 m ahead of us, or the middle of the herd's
    // grazing places while that is further), so that the target is always a place on the trail and moves without a jump
    // as animals start and stop. While the herd grazes, and while those that have broken are still far ahead, it is the
    // middle of the herd; then the animals running beside and ahead of us. When the gaze goes to it: see herdLook.
    let sRest = 0; for (let i = 0; i < NV; i++) sRest += hAnimals[i].s0 / NV;
    const herdMid = (dd, out) => {
      const sc = trailOf(dd); let w = 0.05, sm = Math.max(sc + 16, sRest) * 0.05;
      herdPlaces(dd, herdXm);                                    // (where each animal is, the file's rule kept)
      for (let i = 0; i < NV; i++) {
        const an = hAnimals[i], x = herdXm[i], ds = an.s0 + x - sc;
        const going = smoothstep(0.3, 2, x) * smoothstep(0.3, 2.5, an.run - x);
        const k = smoothstep(-4, 4, ds) * (1 / 12 + (11 / 12) * going * (1 - smoothstep(34, 46, ds)));
        w += k; sm += k * (an.s0 + x);
      }
      trackAt(sm / w, out); out.y = gAt(out.x, out.z) + 1; return out;
    };
    // (second and third mends after round 12) when the gaze goes to the herd: by the herd's own event, in metres of
    // the route, and over the lead's own length. The look opens the lead's length (LEAD0, taken as metres of route)
    // before the first place where any group breaks, and is whole as that group breaks. It closes where we come level
    // with the place where the highest animal on the ash pulls up (the herd is passed), or at the route metre abeam of
    // the trail's head if that is earlier, and eases off over the lead's length before that. Where no animal runs, or
    // none is laid, there is no look.
    let herdLook = null;
    { let first = Infinity, top = -Infinity;
      for (const an of hAnimals) { top = Math.max(top, an.s0 + an.run); if (an.run >= 0.5) first = Math.min(first, an.dBreak); }
      const open = first - LEAD0, close = Math.min(trackAt(top, v0h).y, trackAt(sHead, v0h).y);
      if (close > open) herdLook = { open, close, fade: LEAD0 / (close - open) }; }
    await ctx.yield();
    // the bear on its bough (and, some visits, a cub)
    const bear = bearParts(S, plantMat);
    bear.root.position.copy(bearPos); bear.root.scale.setScalar(1.25);
    frame(DL(0.165));
    bear.root.rotation.y = Math.atan2(P.x - bearPos.x, P.z - bearPos.z);
    scene.add(bear.root);
    let cubB = null;
    await ctx.yield();
    if (cub) {
      cubB = bearParts(S, plantMat);
      cubB.root.position.set(bearPos.x + bearRight.x * 1.9 * bearS, bearPos.y + 0.08 * bearS, bearPos.z + bearRight.z * 1.9 * bearS);
      cubB.root.scale.setScalar(0.62); cubB.root.rotation.y = bear.root.rotation.y + 0.5; scene.add(cubB.root);
    }
    await ctx.yield();

    // ---------------------------------------------------------- the flight
    const camP = new THREE.Vector3(), camQ = new THREE.Quaternion(), camS = new THREE.Vector3(), camUp = new THREE.Vector3();
    const v1 = new THREE.Vector3(), v2 = new THREE.Vector3(), v3 = new THREE.Vector3(), v4 = new THREE.Vector3(), v5 = new THREE.Vector3(), fw = new THREE.Vector3();
    const q1 = new THREE.Quaternion(), q2 = new THREE.Quaternion(), m1 = new THREE.Matrix4();
    const Y = new THREE.Vector3(0, 1, 0), Z = new THREE.Vector3(0, 0, 1), O = new THREE.Vector3();
    const cockPos = new THREE.Vector3(), cockRel = new THREE.Vector3(), poiPage = new THREE.Vector3(), poiRidge = new THREE.Vector3(), poiHerd = new THREE.Vector3();
    const facing = (fwd, upv, roll, out) => { m1.lookAt(O, fwd, upv); out.setFromRotationMatrix(m1); if (roll) out.multiply(q2.setFromAxisAngle(Z, roll)); return out; };
    // the cock's drop across the bow, in the camera's path frame (right, up, ahead)
    const drop = new THREE.CatmullRomCurve3([new THREE.Vector3(-11, 10, 2), new THREE.Vector3(-1.2, 0.9, 6.3), new THREE.Vector3(-1.5, 1.2, 10.5), new THREE.Vector3(3.2, -3.2, 13)], false, 'catmullrom', 0.5);
    const U_DROP = 0.266, DROP_LEN = 0.07;
    // relative offset of the cock at u (right, up, ahead) and his bank
    // (round 4) over the first plates he keeps to the right of our line and lower, so that he is seen from above and behind
    // against the pale plain and never lies across the dykes and the falls; he comes over to the wall for the lava
    const COCK_U = [0.33, 0.36, 0.455, 0.5, 0.54, 0.56, 0.58, 0.6, 0.63], COCK_X = [0, 2.6, 2.6, -6.2, -5.6, -2.2, 1.2, 0.8, 0];
    function cockOffset(u, time, out) {
      // along the page he flies low and close to our own line, so that we look down on his back and its white panels;
      // on the ridge he hangs out over the paper drop on the right
      const page = smoothstep(0.325, 0.37, u) * (1 - smoothstep(0.56, 0.64, u)), ridge = smoothstep(0.56, 0.68, u);
      // (round 5) into the notch he crosses our bow to the left and holds 17 m ahead, 8 m left of the ring's axis and above
      // it, banked so that his back and its white panels face us against the pale plume; from u 0.96 he goes on and away
      const e1 = smoothstep(0.885, 0.932, u), e2 = smoothstep(0.958, 1, u);
      // (round 3) while we stand off the page and look back at it he keeps to the middle of the picture, upright frames too
      let ex = 0;
      for (let i = 1; i < COCK_U.length; i++) if (u < COCK_U[i]) { ex = lerp(COCK_X[i - 1], COCK_X[i], smoothstep(COCK_U[i - 1], COCK_U[i], Math.max(u, COCK_U[0]))); break; }
      // (round 4) up the ridge he rides higher and further out over the drop: whole against the sky, above the herd
      out.set(lerp(lerp(3.2, -0.9, page) + ex + 6.0 * ridge, -6.8, e1) + 0.8 * Math.sin(time * 0.5) - 17 * e2 * e2,
        lerp(-lerp(lerp(3.2, 4.3, page), -0.4, ridge) - 1.5 * smoothstep(0.34, 0.37, u) * (1 - smoothstep(0.45, 0.5, u)), 4.6, e1) + 0.45 * Math.sin(time * 0.7 + 1) + 8 * e2, lerp(13, 12, page) + 1.5 * e1 + 29 * e2);
      const s = clamp((u - U_DROP) / DROP_LEN, 0, 1);
      if (s < 1) { drop.getPoint(s, v5); const k = smoothstep(0.75, 1, s); out.lerpVectors(v5, out, k); }
      return s;
    }
    function cockWorld(u, time, out) {
      const s = cockOffset(u, time, cockRel);
      frame(DL(u) + cockRel.z);
      out.copy(P).addScaledVector(R, cockRel.x).addScaledVector(Y, cockRel.y);
      if (u < U_DROP) {                                    // before the drop he soars high ahead, a mark of scale on the sky,
        frame(DL(u) + 120);                                // then comes down to fly ahead of us on the right before he crosses
        v4.copy(P); v4.x += 30 * Math.cos(time * 0.22); v4.y += 55 + 4 * Math.sin(time * 0.3); v4.z += 30 * Math.sin(time * 0.22);
        frame(DL(u) + 21);
        v5.copy(P).addScaledVector(R, 7 + Math.sin(time * 0.5)).addScaledVector(Y, 3 + 0.6 * Math.sin(time * 0.7));
        v4.lerp(v5, smoothstep(0.2, 0.236, u));
        out.lerpVectors(v4, out, smoothstep(0.248, U_DROP, u));
      }
      return s;
    }
    const poiSection = new THREE.Vector3();
    const tA = new THREE.Vector3(), tB = new THREE.Vector3();

    const ashU = hero.materials.ground.uniforms.uAshFall, upperDetail = hero.upperDetail || [];
    const growUp = hero.grow.up, growFar = hero.grow.far, growOut = hero.grow.out, growRib = hero.grow.rib;
    ashU.value = 0;
    function update(dt, time, camera, uN) {
      const u = toL(uN);                                    // legacy u: every moment below is keyed to it
      hero.setProgress(uN); hero.update(dt, time, camera);
      camera.matrixWorld.decompose(camP, camQ, camS);
      sky.position.copy(camP);
      // the island of watercolour widens as we climb: by the ridge the whole upper mountain is in wash
      { const k = ink === 'blueblack' ? smoothstep(0.06, 0.34, u) : 1, wk = smoothstep(0.2, 0.6, u);
        U.uWash.value.set(lerp(lerp(16, 62, k), 120, wk), lerp(lerp(50, 200, k), 460, wk)); }
      const inValley = u < 0.36, onRidge = u > 0.4;
      for (let i = 0; i < valleyMeshes.length; i++) valleyMeshes[i].visible = inValley;
      for (let i = 0; i < ridgeMeshes.length; i++) ridgeMeshes[i].visible = onRidge;
      // (round 11) the fine detail of the upper mountain (ribs, cushions, the frailejones by the line and the added ones) is
      // drawn while the eye is near the mountain's axis on the map; the cinchonas and the fern understorey of the forest,
      // and the plain form of the frailejones by the line, while it is further off: a rule of where the eye is, not of when.
      // Why at all: the upper detail is some 40,000 triangles and five draws, the forest's cinchonas and understorey some
      // 20,000 and two, and with the valley's plants (which the site's own switch puts away 634 m out) either would take
      // the forest leg over its budget of triangles and draws.
      // (round 12) Nothing is switched: each comes out of, or goes into, the point it stands on, over a band of the eye's
      // distance. From 600 m to 558 m the upper bodies grow from nothing to their size (the ribs rise out of the ground)
      // while the cinchonas and the understorey fold away; from 558 m to 530 m the plain frailejones fold away inside the
      // fine ones that now stand on their sites. Why 600 m: there the eye is out over the plain before the page, the
      // nearest of the upper bodies 190 m and more ahead and small, the forest's plants 90 m and more behind it. 42 m and
      // 28 m are a second and a half and a second of our flight: slow enough that nothing is seen to arrive.
      { const eyeD = Math.hypot(camP.x, camP.z), gUp = 1 - smoothstep(558, 600, eyeD), gFar = smoothstep(530, 558, eyeD);
        growUp.set(gUp, gUp); growRib.value = gUp; growFar.y = gFar; growOut.set(1 - gUp, 1 - gUp);
        for (let i = 0; i < upperDetail.length; i++) upperDetail[i].visible = gUp > 0;
        cinMesh.visible = underMesh.visible = gUp < 1;
        // the sleet and the ash fall are the upper mountain's weather: drawn while the eye is within that same 600 m of
        // the axis (a place, like the rest of this band; the fall's own strength is left as the site set it)
        if (fallMesh) fallMesh.visible = gUp > 0; }
      if (rare) ashU.value = smoothstep(0.42, 0.9, u);
      if (fallU) {
        fallU.uCam.value.copy(camP);
        fallU.uFall.value.x = rare ? 0.95 * smoothstep(0.38, 0.72, u) : 0.9 * smoothstep(0.4, 0.56, u) * (1 - smoothstep(0.9, 0.98, u));
      }
      const d = uN * L;

      // ---- the cock (and a third condor some visits)
      const s = cockWorld(u, time, cockPos);
      cockWorld(Math.min(u + 0.004, 1), time, v1); cockWorld(Math.max(u - 0.004, 0), time, v2);
      fw.subVectors(v1, v2);
      let roll = 0.27 * Math.sin(time * 0.62) + 0.06 * Math.sin(time * 2.3 + 1) - 0.55 * smoothstep(0.215, 0.236, u) * (1 - smoothstep(0.25, 0.266, u));
      frame(d);
      if (u >= U_DROP && s < 1) {                           // across the bow: heading swung across our line, wings near vertical
        const b = Math.exp(-Math.pow((s - 0.33) / 0.24, 2));
        fw.normalize().lerp(v3.copy(R).addScaledVector(T, 0.3).addScaledVector(Y, -0.25), 0.92 * b);
        roll += -1.22 * b + 0.5 * smoothstep(0.55, 0.8, s) * (1 - smoothstep(0.8, 1, s));
      }
      { const e1 = smoothstep(0.895, 0.935, u), e2 = smoothstep(0.958, 1, u);
        roll += -0.78 * e1 * (1 - smoothstep(0.955, 0.975, u)) + 0.85 * Math.sin(Math.PI * e2) * (e2 < 1 ? 1 : 0); }
      if (fw.lengthSq() < 1e-8) fw.copy(T);
      fw.normalize(); fw.y *= 0.75;
      facing(fw, Y, roll, q1);
      condors.set(0, cockPos, 1.4, q1, time * 1.3, 0.07, 0, 0.13 + 0.05 * Math.sin(time * 0.6));
      if (nCondor > 1) {
        v1.copy(cockPos).addScaledVector(R, 9 + 2.5 * Math.sin(time * 0.31)).addScaledVector(T, 15).addScaledVector(Y, 6 + 1.5 * Math.sin(time * 0.43));
        facing(fw, Y, 0.2 * Math.sin(time * 0.7 + 2), q1);
        condors.set(1, v1, 0.9, q1, time * 1.1 + 2, 0.07, 0, 0.16);
      }
      condors.flush();
      hero.setShadows(u > 0.001 ? camP : null, cockPos);

      // ---- our own primaries, carried in the two lower corners of the picture whatever its shape (the corners are read
      // from the camera's own projection): they flex up as we climb and under the load of a turn, and tilt with the bank.
      // Bank and climb are the path's own, here and 22 m ahead; nothing is keyed to the flight fraction.
      path.tangentAtDist(d, tA); path.tangentAtDist(d + 22, tB);
      // (fourth hand mend after round 13) the turn is read up to the site's 0.14 either way. The load on the wing is 1.1
      // times the climb plus 2.5 times the turn, at most 1: a level glide carries none, the steepest of the ridge 0.77,
      // the hardest turn 0.35. The same is read nine metres back along the route (the tangents there and 22 m ahead of
      // there), for the quills' lag: see WING_VERT, where the pose is made of these and the gust clock alone.
      const turn = clamp((tA.z * tB.x - tA.x * tB.z) * 0.8, -0.14, 0.14), climb = Math.max(0, tA.y);
      path.tangentAtDist(d - 9, v2); path.tangentAtDist(d + 13, v3);
      const load = Math.min(1, 1.1 * climb + 2.5 * Math.abs(turn));
      const loadBack = Math.min(1, 1.1 * Math.max(0, v2.y) + 2.5 * Math.abs(clamp((v2.z * v3.x - v2.x * v3.z) * 0.8, -0.14, 0.14)));
      const pe = camera.projectionMatrix.elements, tX = 1 / Math.max(pe[0], 0.05), tY = 1 / Math.max(pe[5], 0.05), WD = 2.8;
      // (round 12) the fans' unit is taken from the smaller side of the picture: half its height, or three quarters of its
      // half width where that is less. Three quarters, because a picture four wide to three high is then the narrowest
      // that keeps the full fan, and every wider one is unchanged; in a narrower one the fans shrink with its width, so
      // that the pair never covers more than a fifteenth of the picture (fourth hand mend: what shows of a fan inside
      // the picture is about a tenth of its unit squared at most, the pair a twenty-seventh of the narrowest full
      // picture and a thirty-sixth of one sixteen wide to nine high; measured there on six pictures it covers 2.3 to
      // 2.7 per cent, where the round's own pair covered 2.8 to 3.3).
      const wUnit = Math.min(tY, 0.75 * tX) * WD;
      // the fans tilt with the bank. The bank they show is 0.12 rad times tanh(turn / 0.06): twice the turn while it is
      // gentle, so that every bank of the route tilts them, and never more than 0.12, so that the fan on the inside of
      // the hardest turn still shows its fingertips. Each fan turns about the line of sight by the bank, and its
      // corner rises (the outside of the turn) or drops (the inside) by 1.3 of its unit for each radian of it, 0.16 of
      // the unit at most; on a straight both are level.
      const bank = 0.12 * Math.tanh(turn / 0.06);
      q1.copy(camQ).multiply(q2.setFromAxisAngle(Z, bank));
      for (let s = -1; s <= 1; s += 2) {
        v1.set(s * tX * WD, -tY * WD + s * bank * 1.3 * wUnit, -WD).applyQuaternion(camQ).add(camP);
        wings[s < 0 ? 0 : 1].set(0, v1, wUnit, q1, time * 2.4, load, loadBack, s * bank / 0.12);
        wings[s < 0 ? 0 : 1].flush();
        wings[s < 0 ? 0 : 1].mesh.visible = uN > 0;
      }

      // ---- parrots: forty burst from a crown and cross the bow; twenty wheel ahead of us through the palms
      // (round 4) while the face is the picture the wheel turns high on the left of it, then comes down into the palms
      const wk = 1 - smoothstep(wheelA, wheelB, d);
      path.posAtDist(clamp(d + 26, 30, wheelC), v3); v3.x += 11 * wk * tA.z; v3.z -= 11 * wk * tA.x; v3.y += 4.5 + 5 * wk;
      for (let i = 0; i < NP; i++) {
        const b = pBirds[i];
        if (i < NB) {
          // (they fly the line we fly, a little ahead and to the left of the bow, and peel away up and left over the forest)
          const tau = Math.max(0, d - b.d0) / 16, pe = Math.max(0, tau - 5.2), cl = Math.exp(-tau * 0.9), db = 36 + b.vT * tau + 1.2 * pe * pe;
          const lat = -12 + b.vR * Math.min(tau, 2.6) - 1.5 * pe * pe, dlat = (tau < 2.6 ? b.vR : 0) - 3 * pe;
          path.posAtDist(Math.min(db, L - 1), v1); path.tangentAtDist(Math.min(db, L - 1), v4); v5.set(-v4.z, 0, v4.x).normalize();
          const yRel = lerp(b.s.y - 26, b.hh - 7, 1 - cl) + 0.9 * pe * pe;
          v1.addScaledVector(v5, lat); v1.x += b.s.x - parrotSrc.x; v1.z += b.s.z - parrotSrc.z;
          v1.x += 0.45 * Math.sin(time * 1.3 + b.ph); v1.y += yRel + 0.3 * Math.sin(time * 1.7 + b.ph * 2); v1.z += 0.45 * Math.cos(time * 1.1 + b.ph);
          fw.copy(v4).multiplyScalar(b.vT).addScaledVector(v5, dlat); fw.y += (b.hh + 19 - b.s.y) * 0.9 * cl + 1.8 * pe + 0.6 * Math.sin(time * 1.7 + b.ph * 2);
          facing(fw, Y, 0.25 * Math.sin(time * 1.3 + b.ph) + clamp(0.1 * (3 * pe - (tau < 2.6 ? b.vR : 0)), -0.6, 0.6), q1);
          parrots.set(i, v1, tau > 0 ? 1.75 : 0, q1, time * 13 + b.ph, 0.85, 0, 0.1);
        } else {
          const a = time * b.w + b.ph;
          v1.set(v3.x + b.r * Math.cos(a), v3.y + b.h + 1.2 * Math.sin(a * 1.7 + b.ph), v3.z + b.r * 0.8 * Math.sin(a));
          fw.set(-Math.sin(a) * Math.sign(b.w), 0.25 * Math.cos(a * 1.7 + b.ph), 0.8 * Math.cos(a) * Math.sign(b.w));
          facing(fw, Y, -0.45 * Math.sign(b.w), q1);
          parrots.set(i, v1, 1.75, q1, time * 12 + b.ph, 0.85, 0, 0.1);
        }
      }
      parrots.flush();

      // ---- hummingbirds: hover, dart to the next flower, hover
      for (let i = 0; i < NH; i++) {
        const b = hBirds[i], c = time * b.rate + b.ph, tri = Math.abs((c % 2) - 1), k = smoothstep(0.42, 0.58, tri);
        v1.lerpVectors(b.a, b.b, k); fw.copy(v1).negate(); fw.y = -0.1;
        v1.add(b.c); v1.y += 0.05 * Math.sin(time * 7 + i);
        facing(fw, Y, 0, q1);
        hummers.set(i, v1, 1, q1, time * 61 + i, 1.1, 0, 0.2);
      }
      if (NH) hummers.flush();

      // ---- the herd on the ash: where each animal is follows from how far the camera has come along the trail. The legs
      // step by the distance run (a stride is 4.27 m of the animal's length, shorter off the mark and into the stand), so a
      // hoof that is down stays where it was put.
      herdPlaces(d, herdX);                                   // (third mend after round 12: every place by the file's rule)
      for (let i = 0; i < NV; i++) {
        // (round 12) each by its own break: its head comes up as we come from 45 m to 8 m short of the place where it
        // breaks (a second and a half of warning), and stays up
        const an = hAnimals[i], x = herdX[i], rest = an.run - x, sd = an.s0 + x, lam = 4.27 * an.sc;
        const alert = smoothstep(an.dBreak - 45, an.dBreak - 8, d);
        const amp = an.run < 0.5 ? 0.25 : Math.min(1, 0.25 + x / 4, 0.25 + rest / 4);
        const turns = x <= 3 ? (4 / lam) * Math.log(1 + x) : rest >= 3 ? (4 / lam) * Math.log(4) + (x - 3) / lam : (4 / lam) * Math.log(4) + (an.run - 6) / lam + (4 / lam) * Math.log(4 / (1 + rest));
        trackAt(sd - 0.7, v2); const ax0 = v2.x, az0 = v2.z; trackAt(sd + 0.7, v2);
        const hx0 = v2.x - ax0, hz0 = v2.z - az0, hl = Math.hypot(hx0, hz0) || 1, la = latAt(an, sd - 0.7), lb = latAt(an, sd + 0.7);
        const ax = ax0 + (hz0 / hl) * la, az = az0 - (hx0 / hl) * la, bx = v2.x + (hz0 / hl) * lb, bz = v2.z - (hx0 / hl) * lb, ay = gAt(ax, az), by = gAt(bx, bz);
        const hx = bx - ax, hz = bz - az;                                  // (its heading follows its own line, bends and all)
        const ph = turns * TAU + an.ph, moving = smoothstep(0.25, 0.6, amp);
        v1.set((ax + bx) / 2, (ay + by) / 2 + 0.02 + 0.035 * moving * Math.sin(ph * 2), (az + bz) / 2);
        // (standing, each is turned a little its own way; it straightens up the trail as it starts)
        const yw = an.yaw * (1 - smoothstep(0, 2.5, x)), cyw = Math.cos(yw), syw = Math.sin(yw);
        fw.set(hx * cyw - hz * syw, (by - ay) * 0.8 + 0.08 * moving * Math.cos(ph), hx * syw + hz * cyw);
        facing(fw, Y, 0, q1);
        // (heads down grazing, up as we come up to the place where it breaks, nodding with the stride at the gallop)
        herd.set(i, v1, an.sc, q1, ph, amp, 0, lerp(lerp(an.graze, 0.1, alert), 0.1 * Math.sin(ph), moving));
      }
      herd.flush();

      // ---- the bear sits up as we come round, pulling at a bromeliad
      const sit = smoothstep(0.1, 0.185, u), pull = 0.5 + 0.5 * Math.sin(time * 2.1);
      bear.torso.rotation.x = lerp(0.85, 0.06, sit) + 0.04 * Math.sin(time * 0.9);
      bear.arms.rotation.x = lerp(0.5, -0.1, sit) - 0.3 * pull;
      bear.torso.rotation.y = 0.18 * Math.sin(time * 0.6);
      if (cubB) { cubB.torso.rotation.x = 0.25 + 0.15 * Math.sin(time * 1.3); cubB.arms.rotation.x = -0.2 - 0.35 * (0.5 + 0.5 * Math.sin(time * 2.9)); cubB.torso.rotation.y = 0.4 * Math.sin(time * 0.8 + 1); }
    }

    const seat = A_.portalSeat.position.clone().add(new THREE.Vector3(-4, 4, -4));
    return {
      scene, path, duration: 50, pace: speeds,
      title: ink === 'sanguine' ? 'The Cut Mountain, afternoon proof' : ink === 'blueblack' ? 'The Cut Mountain, first light' : 'The Cut Mountain',
      camera: { fov: 62, near: 0.3, far: 9000 },
      pois: [
        // the opening holds the cut face while the line swings west toward the seam foot
        { at: new THREE.Vector3(0, 95, 560), from: -0.12, to: frL(0.118), weight: 0.42 },
        { at: bearPos, from: frL(0.125), to: frL(0.24), weight: 0.62 },
        // (round 4) as the line swings in over the forest the gaze leads the turn up to the smoking lip and its lava streak
        { at: new THREE.Vector3(-30, 400, 80), from: frL(0.068), to: frL(0.168), weight: 0.44 },
        // the face of the section: the gaze goes to the wall a little ahead and below, further ahead the further out we stand,
        // so that the plates, the beds, the caves and the conduit are read square on and the run is never a grazing wedge
        { at: (time, u) => { path.posAtDist(u * L, poiPage); const out = Math.max(poiPage.x, 8); poiPage.z -= 16 + 0.95 * out; poiPage.y -= 6 + 0.12 * out; poiPage.x = 0; return poiPage; }, from: frL(0.275), to: frL(0.63), weight: 0.64 },
        // out over the drop: the whole section, its conduit and the smoking lip, the herd on the skyline
        { at: (time, u) => { path.posAtDist(u * L, poiSection); poiSection.x = 0; poiSection.y += 6; poiSection.z -= 170; return poiSection; }, from: frL(0.545), to: frL(0.71), weight: 0.8 },
        // (second and third mends after round 12) the look at the herd. Its target is the middle of the animals
        // galloping ahead of us on the trail (see herdMid); its window is the herd's own event, two metres of the route
        // over the route's length (see herdLook): it comes on over the lead's length before the first group breaks and
        // lets go over the lead's length before we pass the highest animal. No animal that runs, no entry.
        ...(herdLook ? [{ at: (time, uN) => herdMid(uN * L, poiHerd), from: herdLook.open / L, to: herdLook.close / L, fade: herdLook.fade, weight: 0.7 }] : []),
        // (round 4) and the gaze is shared with the summit: the smoking lip, the lava breach and the ring stay in the
        // upper part of the picture all the way up the ridge, the herd in the lower
        { at: seat, from: frL(0.6), to: frL(0.97), weight: 0.3 },
      ],
      portal: { shape: 'circle', radius: 7, color: ink === 'blueblack' ? '#5F8F8E' : '#C6452B', glow: 0.5, revealDistance: 320, tilt: true },
      post: { exposure: 1, flat: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } },
      ride: 'none', companion: 'none', style: 'none',
      update,
      dispose() { hero.dispose?.(); },
    };
  },
};
