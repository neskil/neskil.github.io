// THE STRIKING HOUR: hero set piece "the strike"
// ---------------------------------------------------------------------------------------------
// The strike train of a flatbed tower clock at mouse scale (20x life), and everything it sets
// running when the hour lets go:
//   bed      cast-iron flatbed 110 x 40 m, top at y 20, four girders (z -20, -6, +8, +20), cross
//            ties, four legs, pinstripe and round bosses. The strike row is the bay z -6..+8;
//            the bays z -20..-6 (going train) and z +8..+20 (chime train) are left EMPTY for the
//            world. opts.bed = false omits the bed.
//   train    arbors at y 22, axes along Z: pin wheel 30 m (x -28) with three staggered rings of
//            pins, great wheel 40 m (x -5.5) with its barrel and the 24 m count wheel (uneven
//            notches) on the same arbor, warning wheel 14 m (x 16.5).
//   fly      on a hollow cast pedestal at (20, 1): two vanes, tips sweeping a 12 m radius circle,
//            y 44..60, red corner tips. Real vanes up to ~1 turn/s, then they dither right out
//            into a translucent swept drum (pale caps with ring streaks, two smeared steel plates,
//            thin red rims). The arbor, collars and hubs are a separate mesh that never fades.
//   levers   three red-nosed lifting levers at the west end pressed down in turn by the pins,
//            the 26 m warning lever (red end) beside the fly, the locking lever on the count wheel.
//   wire     0.4 m twisted hammer wire from the lever tail, rising EAST at 60 degrees for 163 m to
//            a bell crank, pull rod to the hammer. It is hauled ~4 m before each blow and whips
//            slack after it.
//   bell     bronze bell 34 m across the mouth, 30 m tall, mouth-down at y 184, on an oak
//            headstock; hammer on the south lip; clapper tied back, swinging aside at the end.
//            The lip shudders oval at each blow (no light pulse). opts.bell = false omits bell,
//            hammer, crank and headstock (the wire stays).
//   weight   strike weight on a line off the barrel, sinking through the bed during the strike.
//   dust     ~3000 pale motes around the fly that are dragged into a vortex as it spins up, and ~260
//            streak ribbons near the axis that trail along a rising spiral once the fly pulls.
//
// Space: X = east, Y = up, Z = south (front, +Z). Origin = centre of the bed on the floor.
// Size: radius 48, height 64, centre (-8, 34, 0) for the movement itself; the wire and bell rise
// to y 216 above x +20..+55 (anchors.bell).
//
// opts
//   palette   [opal, dialGrey, black, bedGreen, brass, steel, red] hex strings (brief default)
//   bed, bell true / true
//   blows     5      how many blows this hour strikes
//   timeline  { duration 40, warning 24, release 26, interval 2.5 } seconds of the world's journey
//   room      { center [0,75,0], half 70, dialRadius 55 } where the four dials are, hero-local
//   dust      true
//
// hooks
//   setProgress(u)     0..1 of the journey (u * timeline.duration seconds). EVERYTHING scripted is
//                      keyed to this: warning lever at 24 s, release at 26 s, fly spin-up over 3 s,
//                      blows at hero.timeline.blowTimes (28.65, 31.15, ... s). Until it is called
//                      the piece runs a 40 s demo loop from wall time (for the part viewer).
//   setStrikeTime(s)   same thing in seconds relative to the release (negative = before).
//   setHands(i, minuteAngle, hourAngle)  hand-shadow angles of dial i (0 east, 1 west, 2 south,
//                      3 north), radians clockwise from 12 as seen from inside. Drives the soft
//                      hand shadows across the machinery and the dials mirrored in the brass.
//   update(dt, time, camera)   every frame. Never caches the camera.
//   uniforms           shared table (uDialCol[4], uAmb, uRoom, uHalf, uDialR, uHands[4], uHeroInv, uGlint (how much
//                      brighter than uDialCol the dials are in their mirror image in polished metal),
//                      uLouvre colour and uBelfryY (146,160): above that height surfaces also take
//                      striped louvre daylight from four sides, so the bell is not black)
//   makeMaterial(defs) the "dial-lit" material used for every solid here, for the world to reuse on
//                      its own going train so the whole room matches (geometry needs attributes
//                      position, normal, aCol vec3 linear albedo, aPbr vec2 = metal, roughness).
//
// anchors (hero-local): see the anchors object at the end of buildHero; in short
//   flyAxis      base and top of the fly's axis, vane band y 44..60, tip radius 12
//   orbit        ring of 9 points: one rising turn round the fly at 25 m radius (13 m off the tips),
//                34 m on the west and north side (outside the vertical leading-off rod) so the drum stands
//                whole in the frame against the dials with the hatch's light above it
//   wire         { start, end, dir } of the hammer wire; clip offset for the cradle
//   flyThrough   orbit -> west along the lever shaft -> climbing half-circle -> up beside the
//                wire at 60 degrees -> portal seat. >= 6 m clear except beside the wire (1.5 m,
//                waived by the brief) and past the bell crank (2.5 m).
//   portalSeat   { position, facing, radius 7, tilt 60 deg }: 8 m inside the bell's mouth on the
//                wire's line; facing points back down the wire.
//   hatch        centre and size of the 30 m hatch the world should cut in the belfry floor (y 150)
//   bell, hammer, leverShaft, countWheel, viewpoints
//
// Cost: about 62k triangles, 20 draw calls, no lights, no textures. Build ~350 ms on the test machine.
// Lighting: NONE needed. Every solid is shaded analytically from the four dials (irradiance,
// soft hand shadows, and the dials mirrored in polished metal), so it ignores scene lights and
// reads the same anywhere; scene fog is applied. Set uniforms.uDialCol to match your dials.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { makeRng, hashSeed } from '../kit/core.js';

const DEFAULT_PALETTE = ['#E9EEF3', '#9DB0C2', '#12161A', '#1F3A35', '#B3A46E', '#56687A', '#D4442B'];
const TAU = Math.PI * 2;
const smoothstep01 = (x) => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };

// ------------------------------------------------------------------------------------------
// The dial-lit shader. Works in hero-local space (uHeroInv * world) so the room can sit anywhere.
// ------------------------------------------------------------------------------------------
const DIAL_VERT = /* glsl */`
attribute vec3 aCol; attribute vec2 aPbr;
uniform mat4 uHeroInv; uniform float uTime;
#ifdef BELL
uniform float uRing; uniform float uRingPhase;
#endif
#ifdef WIRE
uniform float uSlack; uniform float uLen;
#endif
varying vec3 vP; varying vec3 vN; varying vec3 vCol; varying vec2 vPbr; varying vec3 vO;
#include <common>
#include <fog_pars_vertex>
void main(){
  vec3 p = position; vec3 n = normal;
  #ifdef BELL
  { float lip = smoothstep(16.0, 0.0, p.y); float ph = atan(p.z, p.x + 1e-5);
    float fl = uRing * lip * lip * cos(2.0 * ph) * sin(uRingPhase);
    float r = max(length(p.xz), 1e-3); p.xz += (p.xz / r) * fl; }
  #endif
  #ifdef WIRE
  { float s = clamp(p.y / uLen, 0.0, 1.0); float bow = sin(PI * s);
    p.x -= uSlack * bow * (1.0 + 0.35 * sin(s * 19.0 - uTime * 9.0));      // it bows up and away from the cradle's line
    p.z += uSlack * 0.45 * bow * sin(s * 13.0 + uTime * 7.0); }
  #endif
  vO = position;
  vec4 wp = modelMatrix * vec4(p, 1.0);
  vP = (uHeroInv * wp).xyz;
  vN = mat3(uHeroInv) * (mat3(modelMatrix) * n);
  vCol = aCol; vPbr = aPbr;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const DIAL_FRAG = /* glsl */`
uniform mat4 uHeroInv; uniform vec3 uDialCol[4]; uniform vec3 uAmb; uniform vec3 uRoom;
uniform float uHalf; uniform float uDialR; uniform vec2 uHands[4]; uniform float uFade; uniform float uTime;
uniform vec3 uLouvre; uniform vec2 uBelfryY;
uniform vec3 uShaftO; uniform vec3 uShaftD; uniform vec3 uShaftCol;
uniform vec4 uHatch; uniform vec3 uHatchCol; uniform float uGlint; uniform vec3 uSeat; uniform vec3 uPortalCol; uniform vec3 uFillCol; uniform float uFill;
varying vec3 vP; varying vec3 vN; varying vec3 vCol; varying vec2 vPbr; varying vec3 vO;
#include <common>
#include <fog_pars_fragment>
float h31(vec3 p){ p = fract(p * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yzx + 33.33); return fract((p.x + p.y) * p.z); }
float vnoise(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h31(i), h31(i + vec3(1,0,0)), f.x), mix(h31(i + vec3(0,1,0)), h31(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(h31(i + vec3(0,0,1)), h31(i + vec3(1,0,1)), f.x), mix(h31(i + vec3(0,1,1)), h31(i + vec3(1,1,1)), f.x), f.y), f.z); }
float handSeg(vec2 q, float ang, float len, float w, float blur){
  vec2 d = vec2(sin(ang), cos(ang)); float t = clamp(dot(q, d), -len * 0.2, len);
  float dist = length(q - d * t); float ww = w * (1.0 - 0.45 * clamp(t / len, 0.0, 1.0));
  return 1.0 - smoothstep(ww - blur, ww + blur, dist); }
// light let through the dial at in-plane point q (x right as seen from inside, y up)
float dialGlass(vec2 q, vec2 hands, float blur, float frame){
  float m = max(handSeg(q, hands.x, 52.0, 2.2, blur), handSeg(q, hands.y, 36.0, 3.2, blur));
  float r = length(q);
  float rings = (1.0 - smoothstep(0.6, 0.6 + blur, abs(r - 51.0))) + (1.0 - smoothstep(0.5, 0.5 + blur, abs(r - 38.0)));
  float a = atan(q.x, q.y + 1e-5); float sp = abs(fract(a * 12.0 / 6.2831853 + 0.5) - 0.5) * 6.2831853 / 12.0 * max(r, 1.0);
  float spokes = (1.0 - smoothstep(0.35, 0.35 + blur, sp)) * step(6.0, r);
  return (1.0 - 0.82 * m) * (1.0 - frame * 0.5 * clamp(rings + spokes, 0.0, 1.0)); }
// one dial: adds its irradiance to E and its mirror image to R
void dial(int i, vec3 dir, vec3 right, vec3 col, vec2 hands, vec3 P, vec3 N, vec3 Rv, float rough, inout vec3 E, inout vec3 R, inout float cover, inout float shade){
  vec3 C = uRoom + dir * uHalf; vec3 toC = C - P; float d = max(length(toC), 1.0); vec3 L = toC / d;
  float depth = max(dot(toC, dir), 0.0);
  // daylight comes down through the glass: the hands' shadows fall inward and DOWN (0.9 m per metre from the dial), so the
  // minute hand lies along the bed as a soft bar of shade. Penumbra grows with distance.
  vec2 q = vec2(dot(P - C, right), P.y - C.y + 0.9 * depth);
  float bl = 1.0 + 0.065 * depth;
  float hm = max(handSeg(q, hands.x, 52.0, 3.6, bl), handSeg(q, hands.y, 36.0, 4.4, bl)) * smoothstep(2.0, 14.0, depth);
  hm = min(1.0, hm * 1.25);
  float sh = 1.0 - 0.95 * hm;
  shade *= 1.0 - 0.62 * hm;
  float w = clamp(dot(N, L) * 0.6 + 0.4, 0.0, 1.0); w *= w;
  float solid = 1.7 * uDialR * uDialR / (uDialR * uDialR + d * d);
  E += col * (w * solid * sh);
  float dn = dot(Rv, dir);
  if (dn > 1e-3) { float t = depth / dn; vec3 H = P + Rv * t - C; vec2 hq = vec2(dot(H, right), H.y);
    float soft = 1.0 + rough * 34.0; float rr = length(hq);
    float inside = 1.0 - smoothstep(uDialR - soft, uDialR + soft, rr);
    float lat = abs(dot(H, right)); float win = (1.0 - smoothstep(uHalf - soft, uHalf + soft, lat));
    float g = dialGlass(hq, hands, 0.8 + rough * 26.0, 1.0);
    float pol = 1.0 - smoothstep(0.1, 0.34, rough);                      // polished metal mirrors the glass at its true (HDR) brightness: white glints
    R += col * (inside * win * g * 1.7 * mix(1.0, uGlint, pol) * (0.4 + 0.6 * sh)); cover += inside * win; }
}
// belfry: flat cold bars of daylight through horizontal louvres on one side
vec3 louvre(vec3 dir, vec3 P, vec3 N, float flatK){
  float wrap = clamp(dot(N, dir) * 0.7 + 0.3, 0.0, 1.0);
  float bars = mix(0.3, 1.0, smoothstep(-0.35, 0.35, sin((P.y + 0.4 * dot(P, dir)) * 1.15)));
  bars = mix(bars, 0.62, flatK);                                             // inside the bell the bars are lost: one soft light
  return uLouvre * (wrap * bars * 0.5);
}
void main(){
  if (uFade < 0.999) { float dh = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715)))); if (dh > uFade) discard; }
  vec3 N = normalize(vN + vec3(1e-5)); if (!gl_FrontFacing) N = -N;
  vec3 camL = (uHeroInv * vec4(cameraPosition, 1.0)).xyz;
  vec3 V = normalize(camL - vP + vec3(1e-5));
  float metal = vPbr.x; float rough = vPbr.y;
  // procedural breakup in the part's own space so it turns with the wheel
  float n1 = vnoise(vO * 0.55 + 7.0), n2 = vnoise(vO * 3.1), n3 = vnoise(vO * vec3(9.0, 9.0, 0.6));
  // masonry (rough >= 0.95, not metal) is coursed ashlar; the underside of the ceiling is planked oak
  float stoneK = step(0.935, rough) * (1.0 - metal);
  float woodK = step(0.88, rough) * (1.0 - stoneK) * (1.0 - metal) * smoothstep(0.6, 0.9, -N.y) * step(120.0, vP.y);
  float plainK = max(stoneK, step(0.855, rough) * (1.0 - metal));          // stone and timber: no machine-grime blotch
  float pxw = fwidth(vP.x) + fwidth(vP.y) + fwidth(vP.z);
  #ifdef BELL
  // a cast and lathe-turned bell: fine concentric tool rings up the bore, a few broader bands, a faint verdigris bloom
  float tf = 1.0 / (1.0 + 2.5 * fwidth(vO.y * 5.5));
  float bore = step(0.52, vPbr.y);
  float turn = sin(vO.y * 34.5 + 1.3 * n1) * tf; float band = smoothstep(0.35, 0.65, vnoise(vec3(vO.y * 1.7, 3.0, 1.0))) * (1.0 - 0.3 * bore);                                           // the inside of the bell (its lathe carries roughness 0.6)
  vec2 bd = vO.xz / max(length(vO.xz), 1e-3);
  float run = vnoise(vec3(bd * 7.0, vO.y * 0.16)) * 0.6 + vnoise(vec3(bd * 23.0, vO.y * 0.5 + 4.0)) * 0.4;      // casting skin and verdigris runs down the bore
  vec3 alb = vCol * (0.95 + mix(0.05, 0.07, bore) * turn) * (0.93 + mix(0.1, 0.22, bore) * band) * (0.95 + 0.1 * n2) * mix(1.0, 0.6 * (0.62 + 0.7 * run), bore);
  alb = mix(alb, alb * vec3(0.72, 1.06, 1.0), bore * 0.5 * smoothstep(0.55, 0.85, run));
  alb = mix(alb, alb * vec3(0.8, 1.02, 0.98), 0.35 * smoothstep(0.5, 0.8, n1));
  float grime = 0.0; rough = clamp(rough - 0.05 * turn - 0.04 * band, 0.1, 1.0);
  // daylight reaches the lip only: up the bore the louvre light dies and the next world is the only light
  float boreK = mix(1.0, mix(1.0, 0.16, smoothstep(1.5, 16.0, vO.y)), bore);
  #else
  float boreK = 1.0; float bore = 0.0;
  #ifdef FLY
  // riveted plate: fine vertical brushed streaks, an oil-stained lower third, no cloudy mottle
  float br1 = vnoise(vec3(vO.x * 7.0, vO.y * 0.55, vO.z * 7.0)), br2 = vnoise(vec3(vO.x * 19.0 + 5.0, vO.y * 1.6, vO.z * 19.0));
  float oilLine = smoothstep(46.2, 51.0, vO.y + 2.6 * (br1 - 0.5) + 1.2 * (n1 - 0.5));
  vec3 alb = vCol * (0.8 + 0.26 * br1 + 0.14 * br2) * mix(0.5, 1.0, oilLine);
  float grime = 0.0; rough = clamp(rough + metal * (0.16 * (br2 - 0.5) + 0.12 * (br1 - 0.5) - 0.14 * (1.0 - oilLine)), 0.08, 1.0);
  #else
  vec3 alb = vCol * mix(0.78 + 0.34 * n1, 0.95 + 0.08 * n1, plainK) * (0.93 + 0.14 * n2);
  float grime = smoothstep(0.55, 0.9, n1 * 0.7 + n2 * 0.5) * (1.0 - 0.85 * plainK);
  #endif
  #endif
  if (stoneK > 0.5) {
    float su = abs(N.x) > 0.5 ? vP.z : vP.x; float sv = vP.y;
    if (abs(N.y) > 0.7) { su = vP.x; sv = vP.z; }
    float row = floor(sv / 3.0); su += 3.0 * mod(row, 2.0) + 1.3 * h31(vec3(row, 7.0, 3.0));
    vec2 cf = vec2(fract(su / 6.0) * 6.0, fract(sv / 3.0) * 3.0);
    float edge = min(min(cf.x, 6.0 - cf.x), min(cf.y, 3.0 - cf.y));
    float mortar = (1.0 - smoothstep(0.06, 0.15 + pxw, edge)) / (1.0 + 0.5 * pxw);
    float lit = (1.0 - smoothstep(0.15, 0.5, cf.y)) * (1.0 - mortar);            // the worn arris under each joint catches light
    float bv = h31(vec3(floor(su / 6.0), row, 1.7));
    float damp = smoothstep(0.45, 0.85, vnoise(vec3(su * 0.3, sv * 0.02, 4.0))) * smoothstep(0.25, 0.75, vnoise(vec3(su * 0.06, sv * 0.045, 9.0)));
    alb *= (0.84 + 0.26 * bv) * (1.0 - 0.45 * mortar) * (1.0 + 0.1 * lit) * (1.0 - 0.3 * damp) * (0.9 + 0.2 * vnoise(vec3(su, sv, 0.0) * 1.9));
  }
  if (woodK > 0.01) {
    float pz = vP.z / 3.5; float pid = floor(pz); float pf = fract(pz);
    float seam = (1.0 - smoothstep(0.012, 0.03 + pxw * 0.3, min(pf, 1.0 - pf))) / (1.0 + 0.3 * pxw);
    float bx = vP.x / 23.0 + h31(vec3(pid, 2.0, 5.0)); float bf2 = fract(bx);
    float butt = 1.0 - smoothstep(0.004, 0.009 + pxw * 0.05, min(bf2, 1.0 - bf2));
    float pv = h31(vec3(pid, floor(bx), 3.0));
    float grain = vnoise(vec3(vP.x * 0.35, vP.z * 5.0, pid)) * 0.6 + vnoise(vec3(vP.x * 1.3, vP.z * 14.0, pid)) * 0.4;
    vec2 hd = vP.xz - uHatch.xz;                                               // the ceiling falls off into the corners
    alb *= mix(1.0, (0.78 + 0.34 * pv) * (0.84 + 0.3 * grain) * (1.0 - 0.6 * max(seam, butt)) * (0.48 + 0.72 * exp(-dot(hd, hd) / 4200.0)), woodK);
  }
  { float beamK = step(0.88, rough) * (1.0 - stoneK) * (1.0 - metal) * step(120.0, vP.y) * (1.0 - woodK);
    if (beamK > 0.01) {
      float ga = abs(N.x) > 0.6 ? vP.z : vP.x; float gb = abs(N.y) > 0.6 ? (abs(N.x) > 0.6 ? vP.x : vP.z) : vP.y;
      float fd = 1.0 / (1.0 + 5.0 * pxw);
      float g1 = vnoise(vec3(ga * 0.22, gb * 4.5, 3.0)), g2 = vnoise(vec3(ga * 0.9, gb * 15.0, 7.0));
      float shake = smoothstep(0.72, 0.8, vnoise(vec3(ga * 0.12, gb * 2.2, 11.0)));          // drying checks along the grain
      alb *= mix(1.0, (0.72 + 0.5 * g1) * (0.86 + 0.28 * g2 * fd) * (1.0 - 0.45 * shake * fd), beamK);
    } }
  #ifdef WIRE
  float wireNear = 1.0 - smoothstep(5.0, 34.0, length(camL - vP));
  { float ph = 3.0 * atan(vO.z, vO.x + 1e-5) + vO.y * 5.2; float lf = 1.0 / (1.0 + 1.6 * fwidth(vO.y * 5.2));
    float lay = cos(ph), yarn = cos(ph * 5.0 + vO.y * 31.0);
    vec3 ax = vec3(0.5, 0.8660254, 0.0); vec3 tg = cross(ax, N); tg /= max(length(tg), 1e-3);
    N = normalize(N + (ax * (0.2 * sin(ph)) - tg * (0.75 * sin(ph))) * lf + vec3(1e-5));
    float valley = 1.0 - smoothstep(-0.95, 0.1, lay);
    alb *= mix(1.0, (1.0 - 0.72 * valley) * (0.86 + 0.14 * yarn), lf); rough = clamp(rough + 0.3 * valley * lf, 0.06, 1.0);
    alb *= mix(1.0, 0.75, wireNear); }
  #endif
  alb *= 1.0 - 0.35 * grime; rough = clamp(rough + 0.25 * grime + 0.12 * (n3 - 0.5) * metal, 0.06, 1.0);
  vec3 Rv = reflect(-V, N);
  vec3 E = uAmb * (0.7 + 0.3 * N.y); vec3 R = vec3(0.0); float cover = 0.0; float shade = 1.0;
  dial(0, vec3(1,0,0), vec3(0,0,1), uDialCol[0], uHands[0], vP, N, Rv, rough, E, R, cover, shade);
  dial(1, vec3(-1,0,0), vec3(0,0,-1), uDialCol[1], uHands[1], vP, N, Rv, rough, E, R, cover, shade);
  dial(2, vec3(0,0,1), vec3(-1,0,0), uDialCol[2], uHands[2], vP, N, Rv, rough, E, R, cover, shade);
  dial(3, vec3(0,0,-1), vec3(1,0,0), uDialCol[3], uHands[3], vP, N, Rv, rough, E, R, cover, shade);
  shade = max(shade, 0.2); E *= shade; R *= 0.3 + 0.7 * shade;
  float bf = smoothstep(uBelfryY.x, uBelfryY.y, vP.y);
  if (bf > 0.0) {
    E += bf * (louvre(vec3(1,0,0), vP, N, bore) + louvre(vec3(-1,0,0), vP, N, bore) + louvre(vec3(0,0,1), vP, N, bore) + louvre(vec3(0,0,-1), vP, N, bore));
    R += uLouvre * (bf * 0.7 * (1.0 - abs(Rv.y)) * mix(mix(0.35, 1.0, smoothstep(-0.3, 0.3, sin(Rv.y * 16.0))), 0.6, bore));
  }
  #ifdef BELL
  { float rimB = 1.0 - clamp(dot(N, V), 0.0, 1.0); E *= mix(2.4, 1.2, bore); R += uLouvre * (bf * 0.9 * rimB * rimB); }
  #endif
  E *= boreK; R *= boreK;
  // daylight spilling down through the belfry hatch, and the next world's light inside the bell
  vec3 Eh = vec3(0.0);
  { vec3 Lh = vec3(uHatch.x, uHatch.y + 6.0, uHatch.z) - vP; float d2 = dot(Lh, Lh); vec3 lh = Lh / sqrt(max(d2, 1.0));
    float below = 1.0 - smoothstep(uHatch.y + 1.0, uHatch.y + 8.0, vP.y);
    float wr = clamp(dot(N, lh) * 0.55 + 0.45, 0.0, 1.0);
    Eh = uHatchCol * (below * wr * wr * 1500.0 / (1500.0 + d2));
    vec2 ho = abs(vP.xz - uHatch.xz) - uHatch.w; float dh = length(max(ho, 0.0)) + min(max(ho.x, ho.y), 0.0) * 0.3;
    float zone = smoothstep(134.0, 141.0, vP.y) * (1.0 - smoothstep(uHatch.y + 0.5, uHatch.y + 3.0, vP.y));
    if (zone > 0.0) {
      vec2 th = uHatch.xz - vP.xz; th /= max(length(th), 1e-3);
      float face = clamp(dot(N.xz, th), 0.0, 1.0), under = clamp(-N.y, 0.0, 1.0);
      float rake = 0.34 + 0.66 * smoothstep(-0.3, 0.45, sin(dh * 1.75 + 1.4 * vnoise(vec3(vP.xz * 0.21, 2.0)) + (vP.x + vP.z) * 0.12));
      Eh += uHatchCol * (zone * exp(-max(dh, 0.0) / 22.0) * (0.8 * face + 0.85 * under + 0.08) * mix(1.0, rake, smoothstep(0.5, 5.0, dh)));
    }
    E += Eh; }
  { vec3 Lp = uSeat - vP; float d2 = dot(Lp, Lp); vec3 lp = Lp / sqrt(max(d2, 1.0));
    float wr = clamp(dot(N, lp) * 0.6 + 0.4, 0.0, 1.0);
    vec3 pl = uPortalCol * (wr * 240.0 / (240.0 + d2));
    #ifdef BELL
    pl *= 1.0 + 1.6 * (1.0 - smoothstep(6.0, 34.0, sqrt(d2)));   // the next world's light pools round the seat and dies up the bore
    pl *= mix(1.0, (1.0 - 0.8 * smoothstep(9.5, 21.0, sqrt(d2))) * (1.0 + 1.1 * (1.0 - smoothstep(8.0, 17.0, sqrt(d2)))), bore);   // inside, the next world's light washes the bronze from the opening out to the lip
    #endif
    E += pl; R += pl * 0.7; }
  E += uFillCol * ((uFill + 0.25 * bf) * boreK); R += uFillCol * (uFill * 1.5) + Eh * 1.2;
  // the one hard shaft of sunlight from the open pane: a square beam, no occlusion
  { vec3 rel = vP - uShaftO; float tt = dot(rel, uShaftD); vec3 pp = rel - uShaftD * tt;
    vec3 sU = normalize(cross(uShaftD, vec3(0.0, 1.0, 0.0)) + vec3(1e-5)); vec3 sV = cross(sU, uShaftD);
    float sf = 0.25 + 0.012 * max(tt, 0.0);
    float inb = (1.0 - smoothstep(3.0 - sf, 3.0 + sf, abs(dot(pp, sU)))) * (1.0 - smoothstep(3.0 - sf, 3.0 + sf, abs(dot(pp, sV)))) * step(0.0, tt);
    E += uShaftCol * (inb * clamp(dot(N, -uShaftD) * 0.8 + 0.2, 0.0, 1.0) * mix(0.55, 1.0, smoothstep(3.0, 9.0, length(camL - vP)))); }
  R += uAmb * (boreK * (1.0 - clamp(cover, 0.0, 1.0)) * (0.5 + 0.5 * clamp(Rv.y * 0.5 + 0.5, 0.0, 1.0)));
  // the dark bed and floor mirrored from below
  R *= mix(1.0, smoothstep(-0.55, 0.15, Rv.y), 0.75);
  float fres = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 5.0);
  #ifdef BELL
  fres *= 1.0 - 0.35 * bore;
  #endif
  vec3 F0 = mix(vec3(0.04), alb, metal);
  vec3 F = mix(F0, vec3(1.0), fres * (1.0 - rough * 0.8));
  #ifndef BELL
  { float warm = clamp((alb.r - alb.b) / max(alb.r, 1e-3) * 2.2, 0.0, 1.0);          // brass only: blued steel must not go navy
    R *= mix(vec3(1.0), alb / max(max(alb.r, max(alb.g, alb.b)), 1e-3), 0.55 * metal * warm);
    R = mix(R, R * 0.72, 0.6 * metal * warm); }                                        // and it stays under the white point, so the hue survives the tone map
  #endif
  vec3 col = alb * (1.0 - metal) * E * 0.62 + F * R * (1.0 - 0.55 * rough) + alb * metal * E * 0.38 * rough;
  #ifdef BELL
  col += alb * E * 0.3;
  #endif
  #ifdef WIRE
  { float rimW = 1.0 - clamp(dot(N, V), 0.0, 1.0); rimW *= rimW; col *= mix(1.0, 0.5, wireNear); col += (uFillCol * 0.2 + Eh * 0.12 + uAmb * 0.6) * (rimW * (0.4 + 0.6 * clamp(N.y * 0.5 + 0.8, 0.0, 1.0)) * mix(1.0, 0.3, wireNear)); }
  #endif
  col += alb * metal * (E * (bf * 0.3) + Eh * 0.6);            // in the belfry dull metal is lit by the louvres, not only mirrored
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`;

// ------------------------------------------------------------------------------------------
// Geometry helpers. Everything ends up non-indexed with position, normal, aCol, aPbr.
// ------------------------------------------------------------------------------------------
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _s = new THREE.Vector3(), _p = new THREE.Vector3();
function M(x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) {
  return new THREE.Matrix4().compose(_p.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz)), _s.set(sx, sy, sz));
}
// matrix that carries the unit Y axis segment (0,0,0)-(0,1,0) onto a-b (scale y = length)
function along(a, b, sx = 1, sz = sx) {
  const d = new THREE.Vector3().subVectors(b, a), len = d.length();
  _q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  return new THREE.Matrix4().compose(a, _q, _s.set(sx, len, sz));
}
function fromTris(pos) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}
// chamfered box: 6 faces, 12 edge bevels, 8 corner facets (44 triangles)
function cbox(w, h, d, c = 0.08) {
  const hx = w / 2, hy = h / 2, hz = d / 2; c = Math.min(c, hx * 0.49, hy * 0.49, hz * 0.49);
  const V = (sx, sy, sz, ax) => [sx * (ax === 0 ? hx : hx - c), sy * (ax === 1 ? hy : hy - c), sz * (ax === 2 ? hz : hz - c)];
  const polys = [], S = [-1, 1];
  for (let ax = 0; ax < 3; ax++) for (const s of S) { // main faces
    const q = [];
    for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      const sg = ax === 0 ? [s, a, b] : ax === 1 ? [a, s, b] : [a, b, s];
      q.push(V(sg[0], sg[1], sg[2], ax));
    }
    polys.push(q);
  }
  for (let ax = 0; ax < 3; ax++) { // edge bevels running along axis ax
    const b1 = (ax + 1) % 3, b2 = (ax + 2) % 3;
    for (const s1 of S) for (const s2 of S) {
      const q = [];
      for (const [t, f] of [[-1, b1], [1, b1], [1, b2], [-1, b2]]) { const sg = [0, 0, 0]; sg[ax] = t; sg[b1] = s1; sg[b2] = s2; q.push(V(sg[0], sg[1], sg[2], f)); }
      polys.push(q);
    }
  }
  for (const sx of S) for (const sy of S) for (const sz of S) polys.push([V(sx, sy, sz, 0), V(sx, sy, sz, 1), V(sx, sy, sz, 2)]);
  const pos = [];
  for (const q of polys) {
    const ax = q[1][0] - q[0][0], ay = q[1][1] - q[0][1], az = q[1][2] - q[0][2], bx = q[2][0] - q[0][0], by = q[2][1] - q[0][1], bz = q[2][2] - q[0][2];
    const nx = ay * bz - az * by, ny = az * bx - ax * bz, nz = ax * by - ay * bx;
    const flip = nx * (q[0][0] + q[2][0]) + ny * (q[0][1] + q[2][1]) + nz * (q[0][2] + q[2][2]) < 0;
    for (let i = 1; i < q.length - 1; i++) { const a = q[0], b = flip ? q[i + 1] : q[i], cc = flip ? q[i] : q[i + 1]; pos.push(a[0], a[1], a[2], b[0], b[1], b[2], cc[0], cc[1], cc[2]); }
  }
  return fromTris(pos);
}
// lathe about Y. profile: [[r, y], ...] listed bottom-to-top along the OUTSIDE (normals point to
// the right of travel). Crisp between profile segments unless smooth, always smooth around.
function lathe(profile, segs = 24, smooth = false, arc = TAU, a0 = 0) {
  const pos = [], nor = [], n = profile.length;
  const sn = [];
  for (let i = 0; i < n - 1; i++) { const dr = profile[i + 1][0] - profile[i][0], dy = profile[i + 1][1] - profile[i][1], l = Math.hypot(dr, dy) || 1; sn.push([dy / l, -dr / l]); }
  const pn = (i, k) => { // normal at profile point i for segment k
    if (!smooth) return sn[k];
    const a = sn[Math.max(0, i - 1)], b = sn[Math.min(n - 2, i)], x = a[0] + b[0], y = a[1] + b[1], l = Math.hypot(x, y) || 1; return [x / l, y / l];
  };
  for (let j = 0; j < segs; j++) {
    const t0 = a0 + (j / segs) * arc, t1 = a0 + ((j + 1) / segs) * arc, c0 = Math.cos(t0), s0 = Math.sin(t0), c1 = Math.cos(t1), s1 = Math.sin(t1);
    for (let i = 0; i < n - 1; i++) {
      const [r0, y0] = profile[i], [r1, y1] = profile[i + 1], na = pn(i, i), nb = pn(i + 1, i);
      const P = [[r0 * c0, y0, r0 * s0, na[0] * c0, na[1], na[0] * s0], [r1 * c0, y1, r1 * s0, nb[0] * c0, nb[1], nb[0] * s0],
        [r1 * c1, y1, r1 * s1, nb[0] * c1, nb[1], nb[0] * s1], [r0 * c1, y0, r0 * s1, na[0] * c1, na[1], na[0] * s1]];
      const tri = (a, b, c) => { for (const v of [a, b, c]) { pos.push(v[0], v[1], v[2]); nor.push(v[3], v[4], v[5]); } };
      if (r0 > 1e-5) tri(P[0], P[1], P[3]);   // skip the degenerate triangle on the axis
      if (r1 > 1e-5) tri(P[1], P[2], P[3]);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  return g;
}
// plain capped rod profile with chamfered ends, radius r, from y 0 to y 1 (scale it with along())
const rodProfile = (r, len, ch = 0.06) => [[0, 0], [r - ch, 0], [r, ch], [r, len - ch], [r - ch, len], [0, len]];

// toothed wheel plate in the XY plane, axis Z, centred. spec: R, teeth, depth, thick, spokes,
// hubR, rimW, spokeW, notches (array of [angle, width] cut into a plain rim instead of teeth)
function gearPlate(o) {
  const { R, teeth = 0, depth = 1, thick = 1, spokes = 6, hubR = 3, rimW = 2.5, spokeW = 1.2, bevel = 0.12 } = o;
  const pts = [];
  if (teeth > 0) {
    const Rr = R - depth, p = TAU / teeth;
    for (let i = 0; i < teeth; i++) {
      const a = i * p;
      const d = R - Rr, prof = o.leaf   // a pinion leaf: rounded flanks and crown instead of a plain trapezoid
        ? [[0.0, Rr], [0.13, Rr], [0.2, Rr + 0.3 * d], [0.26, Rr + 0.62 * d], [0.33, Rr + 0.88 * d], [0.42, R], [0.58, R], [0.67, Rr + 0.88 * d], [0.74, Rr + 0.62 * d], [0.8, Rr + 0.3 * d], [0.87, Rr]]
        : [[0.0, Rr], [0.2, Rr], [0.36, R], [0.64, R], [0.8, Rr]];
      for (const [f, r] of prof) pts.push(new THREE.Vector2(Math.cos(a + f * p) * r, Math.sin(a + f * p) * r));
    }
  } else {
    const N = 180, notches = (o.notches || []).slice().sort((a, b) => a[0] - b[0]);
    let k = 0;
    for (let i = 0; i < N; i++) {
      const a = (i / N) * TAU, a1 = ((i + 1) / N) * TAU;
      pts.push(new THREE.Vector2(Math.cos(a) * R, Math.sin(a) * R));
      while (k < notches.length && notches[k][0] >= a && notches[k][0] < a1) {
        const [na, nw] = notches[k++], Rn = R - depth;
        for (const [aa, rr] of [[na - nw / 2, R], [na - nw / 2, Rn], [na + nw / 2, Rn], [na + nw / 2, R]]) pts.push(new THREE.Vector2(Math.cos(aa) * rr, Math.sin(aa) * rr));
      }
    }
  }
  const holes = [];
  const r1 = hubR, r2 = R - (teeth > 0 ? depth : 0) - rimW;
  if (spokes > 0 && r2 > r1 + 1) {
    for (let s = 0; s < spokes; s++) {
      const a = (s / spokes) * TAU, span = TAU / spokes, h = [];
      const dA = (r, w) => Math.asin(Math.min(0.9, w / r));
      const wO = spokeW * 0.5, wI = spokeW * 0.85;
      const no = 10, ni = 5;
      for (let i = 0; i <= no; i++) { const t = a + dA(r2, wO) + (span - 2 * dA(r2, wO)) * (i / no); h.push(new THREE.Vector2(Math.cos(t) * r2, Math.sin(t) * r2)); }
      for (let i = ni; i >= 0; i--) { const t = a + dA(r1, wI) + (span - 2 * dA(r1, wI)) * (i / ni); h.push(new THREE.Vector2(Math.cos(t) * r1, Math.sin(t) * r1)); }
      holes.push(h);
    }
  }
  return extrudePlate(pts, holes, thick, bevel);
}
// A flat outline (outer contour and holes, lists of Vector2) as a plate centred on z = 0 with one straight bevel: what
// ExtrudeGeometry makes with bevelSegments 1 and the cap inset by the bevel, written straight into one array. (A 96-tooth
// wheel through ExtrudeGeometry was a single 30 to 80 ms step of the build; this is a few milliseconds.)
function extrudePlate(outer, holes, thick, bevel) {
  const area = (c) => { let a = 0; for (let i = 0, n = c.length; i < n; i++) { const p = c[i], q = c[(i + 1) % n]; a += p.x * q.y - q.x * p.y; } return a; };
  const loops = [area(outer) < 0 ? outer.slice().reverse() : outer];
  for (const h of holes) loops.push(area(h) > 0 ? h.slice().reverse() : h);      // outer anticlockwise, holes clockwise: metal on the left
  // each loop moved into the metal by the bevel (mitred, limited at sharp corners): the outline of the two flat faces
  const inset = loops.map((c) => { const n = c.length, o = new Array(n);
    for (let i = 0; i < n; i++) { const a = c[(i + n - 1) % n], p = c[i], b = c[(i + 1) % n];
      let e0x = p.x - a.x, e0y = p.y - a.y, e1x = b.x - p.x, e1y = b.y - p.y; const l0 = Math.hypot(e0x, e0y) || 1, l1 = Math.hypot(e1x, e1y) || 1;
      e0x /= l0; e0y /= l0; e1x /= l1; e1y /= l1;
      let nx = e0y + e1y, ny = -(e0x + e1x); const l = Math.hypot(nx, ny);
      if (l < 1e-6) { nx = e0y; ny = -e0x; } else { nx /= l; ny /= l; }
      const k = bevel / Math.max(0.5, nx * e0y - ny * e0x);
      o[i] = new THREE.Vector2(p.x - nx * k, p.y - ny * k); }
    return o; });
  const h = thick / 2, hw = h - bevel, all = [].concat(...inset), faces = THREE.ShapeUtils.triangulateShape(inset[0], inset.slice(1));
  let nv = faces.length * 6; for (const c of loops) nv += c.length * 18;
  const pos = new Float32Array(nv * 3); let o = 0;
  const put = (p, z) => { pos[o++] = p.x; pos[o++] = p.y; pos[o++] = z; };
  for (const f of faces) { let a = all[f[0]], b = all[f[1]]; const c = all[f[2]];
    if ((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x) < 0) { const t = a; a = b; b = t; }
    put(a, h); put(b, h); put(c, h); put(a, -h); put(c, -h); put(b, -h); }
  for (let k = 0; k < loops.length; k++) { const P = loops[k], Q = inset[k], n = P.length;
    for (let i = 0; i < n; i++) { const j = (i + 1) % n;
      put(P[i], hw); put(P[j], hw); put(Q[j], h); put(P[i], hw); put(Q[j], h); put(Q[i], h);             // front bevel
      put(P[i], -hw); put(P[j], -hw); put(P[j], hw); put(P[i], -hw); put(P[j], hw); put(P[i], hw);       // wall
      put(Q[i], -h); put(Q[j], -h); put(P[j], -hw); put(Q[i], -h); put(P[j], -hw); put(P[i], -hw); } }   // back bevel
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}

// A batch: geometry collected with colours, merged into one mesh.
class Batch {
  constructor() { this.list = []; this.tris = 0; }
  // col: THREE.Color (linear) or fn(x,y,z,out) evaluated in the geometry's own space before m
  add(geo, m, col, metal = 0, rough = 0.6, jitter = 0) {
    let g = geo.index ? geo.toNonIndexed() : geo.clone();
    for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal') g.deleteAttribute(k);
    if (!g.attributes.normal) g.computeVertexNormals();
    const n = g.attributes.position.count, P = g.attributes.position, c = new Float32Array(n * 3), pb = new Float32Array(n * 2), tmp = new THREE.Color();
    const j = 1 + jitter;
    for (let i = 0; i < n; i++) {
      if (typeof col === 'function') col(P.getX(i), P.getY(i), P.getZ(i), tmp); else tmp.copy(col);
      c[i * 3] = tmp.r * j; c[i * 3 + 1] = tmp.g * j; c[i * 3 + 2] = tmp.b * j;
      pb[i * 2] = tmp.metal !== undefined ? tmp.metal : metal; pb[i * 2 + 1] = tmp.rough !== undefined ? tmp.rough : rough;
    }
    tmp.metal = undefined; tmp.rough = undefined;
    g.setAttribute('aCol', new THREE.BufferAttribute(c, 3));
    g.setAttribute('aPbr', new THREE.BufferAttribute(pb, 2));
    if (m) g.applyMatrix4(m);
    this.list.push(g); this.tris += n / 3;
    return this;
  }
  mesh(material, name) {
    const g = mergeGeometries(this.list, false);
    for (const x of this.list) x.dispose();
    this.list.length = 0;
    const mesh = new THREE.Mesh(g, material);
    mesh.name = name || ''; mesh.frustumCulled = false;
    return mesh;
  }
}

// layout constants (hero-local metres)
const BED_TOP = 20, ARBOR_Y = 22, ROW_Z0 = -6, ROW_Z1 = 8;
const PIN_X = -28, PIN_Z = 5, GREAT_X = -6.45, GREAT_Z = 1, COUNT_Z = 2.7, WARN_X = 15.1, WARN_Z = -2.6;
const FLY_X = 26, FLY_Z = 1, FLY_Y0 = 44, FLY_Y1 = 60, FLY_R = 12;
const LEVER_X = -50, LEVER_Y = 26.6, LEVER_NOSE = 10.5, LEVER_TAIL = 8, LEVER_Z = [5.75, 6.4, 7.05];
const WIRE_Z = LEVER_Z[0], WIRE_A = new THREE.Vector3(LEVER_X - LEVER_TAIL, LEVER_Y + 0.6, WIRE_Z);
const WIRE_DIR = new THREE.Vector3(Math.cos(Math.PI / 3), Math.sin(Math.PI / 3), 0), WIRE_LEN = 163;
const BELL_Y = 184, BELL_H = 30, BELL_R = 17;

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('striking-hour-hero') : ctx.rng;
  const detail = ctx.quality?.detail ?? 1;
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE).map((h) => new THREE.Color(h));
  const [cOpal, cGrey, cBlack, cGreen, cBrass0, cSteel0, cRed] = pal;
  // as a mirror tint the brief's blued steel doubles its saturation (F0 = albedo, lit by blue glass) and reads navy:
  // pull it most of the way toward its own grey so that what reaches the eye is #56687A
  const cSteel = (() => { const l = 0.3 * cSteel0.r + 0.55 * cSteel0.g + 0.15 * cSteel0.b; return cSteel0.clone().lerp(new THREE.Color(l, l, l * 1.05), 0.6).multiplyScalar(1.25); })();
  const cBrass = cBrass0.clone().lerp(cGrey, 0.14);   // kept cold: pale greenish gold, never orange
  const TL = Object.assign({ duration: 40, warning: 24, release: 26, interval: 2.5 }, opts.timeline || {});
  const BLOWS = Math.max(1, opts.blows ?? 5);
  const room = Object.assign({ center: [0, 75, 0], half: 70, dialRadius: 55 }, opts.room || {});

  // ---- per-seed variety ----
  const liveryId = rng.pick([0, 0, 1, 2]);                // bottle green | slate blue | black
  const livery = [cGreen, new THREE.Color('#2c3a47'), new THREE.Color('#1d2226')][liveryId].clone();
  const liveryMul = [3.4, 2.5, 2.3][liveryId];
  const spokesBig = rng.pick([5, 6, 6, 8]), spokesMid = rng.pick([5, 6]), spokesSmall = rng.pick([4, 5, 6]);
  const teethGreat = rng.pick([88, 96, 104]), teethPin = rng.pick([64, 72]), teethWarn = rng.pick([36, 40, 44]);
  const vaneStyle = rng.int(0, 2);            // 0 plain doors, 1 clipped inner corners, 2 pierced
  const hour = rng.int(1, 12);                // where the hour hand's shadow sits, count wheel phase
  const wear = rng.range(0.0, 1.0);
  const bellFlare = rng.range(0.92, 1.06);
  const restVane = rng.range(-0.25, 0.25);    // how the still fly happens to stand

  // ---- shared uniforms and the material factory ----
  const dialCols = opts.dials ? opts.dials.map((h) => new THREE.Color(h)) : [
    new THREE.Color('#F4F2EE').multiplyScalar(1.28),               // east: the sun is behind it
    new THREE.Color('#BFD2EA').multiplyScalar(0.92),               // west: coolest, bluest
    cOpal.clone().lerp(cGrey, 0.18), cOpal.clone().lerp(cGrey, 0.3)];
  const uniforms = {
    uHeroInv: { value: new THREE.Matrix4() }, uTime: { value: 0 },
    uDialCol: { value: dialCols }, uAmb: { value: cGrey.clone().multiplyScalar(0.11) },
    uRoom: { value: new THREE.Vector3().fromArray(room.center) }, uHalf: { value: room.half }, uDialR: { value: room.dialRadius },
    uLouvre: { value: cGrey.clone().lerp(cOpal, 0.4).multiplyScalar(1.5) }, uBelfryY: { value: new THREE.Vector2(146, 160) },
    uHands: { value: [0, 1, 2, 3].map(() => new THREE.Vector2(-0.105, (hour - 1 / 12) / 12 * TAU)) },
    uShaftO: { value: new THREE.Vector3(70, 54, -22) }, uShaftD: { value: new THREE.Vector3(-1, -0.42, 0.1).normalize() }, uShaftCol: { value: new THREE.Color(0, 0, 0) },
    // set by the world: hatch (x, y, z, half) and its light, the portal seat and its light, a fill colour for uFill
    uHatch: { value: new THREE.Vector4(0, 150, 0, 15) }, uHatchCol: { value: new THREE.Color(0, 0, 0) },
    uGlint: { value: 1 }, uSeat: { value: new THREE.Vector3(0, 300, 0) }, uPortalCol: { value: new THREE.Color(0, 0, 0) }, uFillCol: { value: cGrey.clone().multiplyScalar(0.5) },
  };
  const materials = [];
  function makeMaterial(defines = {}, extra = {}) {
    const mat = new THREE.ShaderMaterial({
      defines, fog: true, vertexShader: DIAL_VERT, fragmentShader: DIAL_FRAG,
      uniforms: Object.assign(THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uniforms, { uFade: { value: 1 }, uFill: { value: 0 } }, extra),
    });
    materials.push(mat);
    return mat;
  }
  await ctx.yield?.();
  const matSolid = makeMaterial();
  const object = new THREE.Group(); object.name = 'the-striking-hour-hero';
  let tris = 0;
  const finish = (batch, mat, name, parent = object) => { tris += batch.tris; const m = batch.mesh(mat, name); parent.add(m); return m; };

  // ---- colours (THREE.Color carrying metal / rough for Batch.add) ----
  const C = (col, metal, rough, mul = 1) => { const c = col.clone().multiplyScalar(mul); c.metal = metal; c.rough = rough; return c; };
  const paint = C(livery, 0, 0.42, liveryMul), paintLt = C(livery, 0, 0.5, liveryMul * 1.4);
  const brass = C(cBrass, 1, 0.22), brassPol = C(cBrass, 1, 0.12, 1.08), brassDull = C(cBrass, 1, 0.34, 0.8);
  const steel = C(cSteel, 1, 0.26), steelPol = C(cSteel, 1, 0.1, 1.25), steelDark = C(cSteel, 1, 0.5, 0.6);
  const red = C(cRed, 0, 0.4), stripe = C(cBrass, 0, 0.5, 1.7);
  const oak = C(new THREE.Color('#5d564c'), 0, 0.9), bronze = C(new THREE.Color('#8a8566'), 1, 0.4), iron = C(cBlack, 0, 0.6, 1.6);
  const add = (b, geo, m, c) => b.add(geo, m, c, c.metal, c.rough, typeof c === 'function' ? 0 : rng.range(-0.06, 0.06));
  // parts added to the machine later (the strike cage, the brass edging, braces, dishes and wear arcs of the vanes' bays, the
  // clapper's shank, collar, staple and turns of rope) take their tint from a stream of their own, made of the seed and a label, so
  // that the hero's own stream deals every older part, the dust vortex and its streaks exactly as it did before they were added
  const tintNew = makeRng(hashSeed('striking-hour-hero:tint-new:' + (ctx.seed ?? 0)));
  const addNew = (b, geo, m, c) => b.add(geo, m, c, c.metal, c.rough, typeof c === 'function' ? 0 : tintNew.range(-0.06, 0.06));
  const RX = Math.PI / 2;   // lathe axis Y -> Z
  // the signal red this round puts on the rest of the strike (the wheels' pin circles, the barrel's flanges, the locking beak, the
  // weight, the wire) is added last to each part's batch and tinted from a stream of its own: nothing older moves or is dealt differently
  const tintR4 = makeRng(hashSeed('striking-hour-hero:r4-red:' + (ctx.seed ?? 0)));
  const addR4 = (b, geo, m, c) => b.add(geo, m, c, c.metal, c.rough, tintR4.range(-0.06, 0.06));
  // a painted line on a wheel's face, on the circle of radius r, half-width w, standing off the wheel's mid-plane by off (both faces)
  const redLine = (b, r, w, z, off, segs) => { const g = lathe([[r + w + 0.02, off - 0.02], [r + w, off], [r - w, off], [r - w - 0.02, off - 0.02]], segs);
    addR4(b, g, M(0, 0, z, RX), red); addR4(b, g, M(0, 0, z, -RX), red); };

  // =========================== static batch: bed, bearings, standards ===========================
  const S = new Batch();
  const gRod = (r, len, segs = 10, ch = 0.06) => lathe(rodProfile(r, len, ch), segs);
  const boss = lathe([[0, 0], [0.95, 0], [0.95, 0.1], [0.7, 0.22], [0.42, 0.22], [0.3, 0.34], [0, 0.34]], 14);
  function bearing(x, z, r = 1.25) {            // plummer block on a girder top, shaft along Z at ARBOR_Y
    add(S, cbox(3.6, 0.7, 2.2, 0.12), M(x, BED_TOP + 0.35, z), paint);
    add(S, cbox(2.2, 1.2, 1.9, 0.2), M(x, BED_TOP + 1.2, z), paint);
    add(S, lathe([[0, -1.0], [r, -1.0], [r + 0.12, -0.85], [r + 0.12, 0.85], [r, 1.0], [0, 1.0]], 14), M(x, ARBOR_Y, z, RX), paint);
    add(S, lathe([[0, -1.12], [0.95, -1.12], [0.95, 1.12], [0, 1.12]], 12), M(x, ARBOR_Y, z, RX), brassDull);
    for (const sx of [-1.45, 1.45]) add(S, lathe(rodProfile(0.2, 0.3, 0.04), 6), M(x + sx, BED_TOP + 0.7, z), steelDark);
  }
  if (opts.bed !== false) {
    for (const z of [-20, ROW_Z0, ROW_Z1, 20]) {
      add(S, cbox(110, 0.6, 2.6, 0.1), M(0, BED_TOP - 0.3, z), paint);
      add(S, cbox(110, 0.6, 2.6, 0.1), M(0, BED_TOP - 3.9, z), paint);
      add(S, cbox(109.4, 3.2, 0.7, 0.08), M(0, BED_TOP - 2.1, z), paint);
      for (let x = -50; x <= 50.1; x += 10) add(S, cbox(0.45, 3.0, 2.2, 0.1), M(x + 5, BED_TOP - 2.1, z), paint);
      for (const s of [-1, 1]) {
        for (const y of [-1.0, -3.2]) add(S, cbox(100, 0.17, 0.06, 0.01), M(0, BED_TOP + y, z + s * 0.37), stripe);
        for (let x = -40; x <= 40.1; x += 20) add(S, boss, M(x, BED_TOP - 2.1, z + s * 0.35, s * RX), x === 0 ? stripe : paintLt);
      }
      await ctx.yield?.();
    }
    await ctx.yield?.();
    for (const x of [-54, -47.5, 40, 54]) {
      add(S, cbox(1.8, 3.6, 42.4, 0.14), M(x, BED_TOP - 2.2, 0), paint);
      add(S, cbox(2.6, 0.5, 42.6, 0.1), M(x, BED_TOP - 0.25, 0), paint);
    }
    const leg = lathe([[0, 0], [3.4, 0], [3.4, 0.7], [2.9, 1.1], [2.5, 1.5], [2.1, 3.2], [1.6, 13.0], [1.9, 13.5], [1.9, 14.0], [2.6, 14.9], [2.9, 15.2], [2.9, 16.0], [0, 16.0]], 8);
    for (const x of [-46, 46]) for (const z of [-17, 17]) {
      add(S, leg, M(x, 0, z, 0, Math.PI / 8), paint);
      add(S, cbox(8.4, 0.5, 8.4, 0.16), M(x, 0.25, z), paint);
      for (let k = 0; k < 4; k++) add(S, lathe(rodProfile(0.35, 0.45, 0.06), 6), M(x + (k & 1 ? 3.4 : -3.4), 0.5, z + (k & 2 ? 3.4 : -3.4)), steelDark);
      add(S, cbox(0.5, 6.5, 9.0, 0.12), M(x, 13.2, z - Math.sign(z) * 4.2, Math.sign(z) * 0.62), paint);   // gusset toward the middle
    }
  }
  await ctx.yield?.();
  for (const x of [PIN_X, GREAT_X, WARN_X]) { bearing(x, ROW_Z0); bearing(x, ROW_Z1); }
  await ctx.yield?.();

  // =========================== the wheels ===========================
  // Each wheel is one mesh at (x, ARBOR_Y, 0) turning about Z.
  async function buildWheel(o) {
    const B = new Batch(), t = o.thick ?? 1.0, z = o.z;
    const rRoot = o.R - (o.teeth ? o.depth : 0), r2 = rRoot - o.rimW;
    const plateCol = (x, y, zz, out) => { const r = Math.hypot(x, y), tip = smoothstep01((r - (rRoot - 0.2)) / Math.max(o.depth || 1, 0.5));
      out.copy(cBrass).multiplyScalar(0.92 + 0.22 * tip + 0.06 * wear * Math.sin(r * 2.1)); out.metal = 1; out.rough = 0.3 - 0.17 * tip; };
    const gp = gearPlate(o);
    await ctx.yield?.();
    B.add(gp, M(0, 0, z), plateCol);
    await ctx.yield?.();
    const rib = lathe([[rRoot - 0.25, t / 2 - 0.02], [rRoot - 0.45, t / 2 + 0.2], [r2 + 0.5, t / 2 + 0.2], [r2 + 0.2, t / 2 - 0.02]], 72);
    const hub = lathe([[0, -1.7], [1.35, -1.7], [1.6, -1.45], [1.6, -1.05], [o.hubR * 0.7, -0.95], [o.hubR * 0.93, -0.62], [o.hubR * 0.93, 0.62], [o.hubR * 0.7, 0.95], [1.6, 1.05], [1.6, 1.45], [1.35, 1.7], [0, 1.7]], 28);
    add(B, rib, M(0, 0, z, RX), brassPol); add(B, rib, M(0, 0, z, -RX), brassPol);
    add(B, hub, M(0, 0, z, RX), brass);
    for (let s = 0; s < o.spokes; s++) {
      const a = ((s + 0.5) / o.spokes) * TAU + TAU / o.spokes / 2, len = r2 - o.hubR + 0.6, rm = (r2 + o.hubR) / 2;
      add(B, cbox(len, 0.42, t + 0.4, 0.12), M(Math.cos(a) * rm, Math.sin(a) * rm, z, 0, 0, a), brass);
    }
    for (let k = 0; k < 6; k++) { const a = (k / 6) * TAU; for (const s of [-1, 1]) add(B, lathe(rodProfile(0.24, 0.26, 0.05), 6), M(Math.cos(a) * o.hubR * 0.62, Math.sin(a) * o.hubR * 0.62, z + s * 0.8, s * RX), steelDark); }
    // arbor with collars, bearing journals at the two girders
    add(B, gRod(0.72, ROW_Z1 - ROW_Z0 + 2.9, 12, 0.12), M(0, 0, ROW_Z0 - 1.45, RX), steel);
    for (const zz of [ROW_Z0 + 1.35, ROW_Z1 - 1.35]) add(B, lathe([[0.7, -0.22], [1.05, -0.22], [1.12, -0.1], [1.12, 0.1], [1.05, 0.22], [0.7, 0.22]], 12), M(0, 0, zz, RX), steelPol);
    if (o.pinionZ !== undefined) {
      const pg = gearPlate({ R: 2.7, teeth: o.pinionLeaves || 10, depth: 1.25, thick: 3.0, spokes: 0, hubR: 0, rimW: 0, bevel: 0.1 });
      add(B, pg, M(0, 0, o.pinionZ), steelPol);
      for (const s of [-1, 1]) add(B, lathe([[0.7, 0], [2.85, 0], [2.85, 0.22], [2.6, 0.34], [0.7, 0.34]], 20), M(0, 0, o.pinionZ + s * 1.5, s * RX), steel);
    }
    await ctx.yield?.();
    o.extra?.(B);
    await ctx.yield?.();
    const mesh = finish(B, matSolid, o.name);
    mesh.position.set(o.x, ARBOR_Y, 0);
    return mesh;
  }
  // flat plate cut from a 2D outline (XY), thickness along Z, bevelled
  function plate(pts, thick, holes = [], bevel = 0.1) {
    const sh = new THREE.Shape(pts.map((p) => new THREE.Vector2(p[0], p[1])));
    for (const h of holes) sh.holes.push(new THREE.Path(h.map((p) => new THREE.Vector2(p[0], p[1]))));
    const g = new THREE.ExtrudeGeometry(sh, { depth: thick - 2 * bevel, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelOffset: -bevel, bevelSegments: 1, steps: 1, curveSegments: 1 });
    g.translate(0, 0, -(thick - 2 * bevel) / 2);
    return g;
  }
  // outline of a lever lying along +X from x0 to x1 with half-width fn w(x) and centre-line fn c(x)
  function leverOutline(x0, x1, w, c = () => 0, n = 26) {
    const top = [], bot = [];
    for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * (i / n); top.push([x, c(x) + w(x)]); bot.push([x, c(x) - w(x)]); }
    return top.concat(bot.reverse());
  }
  const D2R = Math.PI / 180;

  const pinWheel = await buildWheel({ name: 'pinWheel', x: PIN_X, z: PIN_Z, R: 15, teeth: teethPin, depth: 1.0, thick: 0.9, spokes: spokesMid, hubR: 3.2, rimW: 3.6, spokeW: 1.3, pinionZ: GREAT_Z,
    extra(B) {
      add(B, lathe([[13.5, 0.43], [13.3, 0.62], [11.7, 0.62], [11.5, 0.43]], 72), M(0, 0, PIN_Z, RX), brassPol);
      for (let k = 0; k < 3; k++) for (let i = 0; i < 8; i++) {
        const a = Math.PI - 45 * D2R + k * 6 * D2R - i * 45 * D2R, zz = LEVER_Z[k] - 0.34;
        add(B, lathe([[0, 0], [0.5, 0], [0.5, 0.56], [0.4, 0.68], [0, 0.68]], 10), M(Math.cos(a) * 12.5, Math.sin(a) * 12.5, zz, RX), steelPol);
        if (k > 0) add(B, gRod(0.3, zz - PIN_Z - 0.4, 8, 0.02), M(Math.cos(a) * 12.5, Math.sin(a) * 12.5, PIN_Z + 0.4, RX), steel);
      }
      // strike red: the circle the pins stand on is lined on both faces, each pin's head is capped, the hub's shoulders are painted
      redLine(B, 12.5, 0.2, PIN_Z, 0.675, 72);
      for (let k = 0; k < 3; k++) for (let i = 0; i < 8; i++) { const a = Math.PI - 45 * D2R + k * 6 * D2R - i * 45 * D2R;
        addR4(B, lathe([[0.5, 0.56], [0.52, 0.58], [0.42, 0.7], [0, 0.72]], 10), M(Math.cos(a) * 12.5, Math.sin(a) * 12.5, LEVER_Z[k] - 0.34, RX), red); }
      { const sh = lathe([[3.2 * 0.93 + 0.03, 0.64], [3.2 * 0.7 + 0.03, 0.975], [1.63, 1.075]], 28); addR4(B, sh, M(0, 0, PIN_Z, RX), red); addR4(B, sh, M(0, 0, PIN_Z, -RX), red); }
    } });
  await ctx.yield?.();
  const greatWheel = await buildWheel({ name: 'greatWheel', x: GREAT_X, z: GREAT_Z, R: 20, teeth: teethGreat, depth: 1.25, thick: 1.1, spokes: spokesBig, hubR: 4, rimW: 2.6, spokeW: 1.7,
    extra(B) {   // winding barrel on the north side with the rope coiled on its outer half
      const prof = [[0, -4.3], [6.1, -4.3], [6.1, -3.95], [5.0, -3.9]];
      for (let i = 0; i < 9; i++) { const z0 = -3.9 + i * 0.35; prof.push([5.0, z0 + 0.03], [5.22, z0 + 0.175], [5.0, z0 + 0.32]); }
      prof.push([5.0, -0.75], [6.1, -0.7], [6.1, -0.4], [0, -0.4]);
      B.add(lathe(prof, 36), M(0, 0, 0, RX), (x, yy, z, out) => { const rope = yy < -1.95 && yy > -3.88 && Math.hypot(x, z) > 4.9;
        out.set(rope ? '#7d7a6c' : '#000000'); if (!rope) out.copy(cSteel).multiplyScalar(0.55); out.metal = rope ? 0 : 1; out.rough = rope ? 0.9 : 0.5; });
      const sq = cbox(1.0, 1.0, 1.4, 0.12); add(B, sq, M(0, 0, ROW_Z0 - 1.9), steelDark);   // winding square
      // strike red: the rims of the barrel's two flanges, and a ring on the end that faces the going train
      for (const y of [-4.3, -0.75]) addR4(B, lathe([[6.1, y - 0.02], [6.14, y + 0.02], [6.14, y + 0.33], [6.1, y + 0.37]], 36), M(0, 0, 0, RX), red);
      addR4(B, lathe([[5.2, -4.32], [6.0, -4.32]], 36), M(0, 0, 0, RX), red);
    } });
  await ctx.yield?.();
  const U78 = TAU / 78, notches = [];
  { let cum = 0, h = hour; notches.push([Math.PI / 2, 2.6 * D2R]);
    for (let gap = BLOWS; cum + gap < 76; gap = (h++ % 12) + 1) { cum += gap; notches.push([((Math.PI / 2 - cum * U78) % TAU + TAU) % TAU, 2.6 * D2R]); } }
  const countWheel = await (async () => {
    const B = new Batch(), o = { R: 12, teeth: 0, depth: 1.5, thick: 0.7, spokes: spokesSmall, hubR: 2.6, rimW: 2.4, spokeW: 1.0, notches };
    const gp = gearPlate(o);
    await ctx.yield?.();
    B.add(gp, M(0, 0, COUNT_Z), (x, y, z, out) => { const r = Math.hypot(x, y); out.copy(cBrass).multiplyScalar(r > 11.7 ? 1.12 : 0.9); out.metal = 1; out.rough = r > 11.7 ? 0.12 : 0.34; });
    add(B, lathe([[1.5, -0.75], [2.4, -0.6], [2.4, 0.6], [1.5, 0.75]], 20), M(0, 0, COUNT_Z, RX), brass);
    const rib = lathe([[10.3, 0.33], [10.1, 0.5], [9.5, 0.5], [9.3, 0.33]], 60);
    add(B, rib, M(0, 0, COUNT_Z, RX), brassPol); add(B, rib, M(0, 0, COUNT_Z, -RX), brassPol);
    redLine(B, 9.8, 0.2, COUNT_Z, 0.52, 60);                    // strike red: a line just inside the notches' floors
    const m = finish(B, matSolid, 'countWheel'); m.position.set(GREAT_X, ARBOR_Y, 0); return m;
  })();
  await ctx.yield?.();
  const warnWheel = await buildWheel({ name: 'warningWheel', x: WARN_X, z: WARN_Z, R: 7, teeth: teethWarn, depth: 0.8, thick: 0.7, spokes: spokesSmall, hubR: 2.0, rimW: 1.3, spokeW: 0.8, pinionZ: GREAT_Z,
    extra(B) {
      add(B, gRod(0.32, 1.3, 8), M(5.3, 0, WARN_Z, RX), steelPol);                                   // the warning pin
      add(B, lathe([[0.7, 0], [1.7, 0], [1.7, 0.3], [0.9, 1.1], [0.7, 1.1]], 16), M(0, 0, 3.2, RX), steelPol);   // bevel to the fly's lay shaft
      redLine(B, 5.575, 0.15, WARN_Z, 0.57, 48);                 // strike red: the warning pin's circle, and a collar under the pin
      addR4(B, lathe([[0.34, 0.56], [0.7, 0.56], [0.7, 0.64], [0.34, 0.7]], 10), M(5.3, 0, WARN_Z, RX), red);
    } });
  await ctx.yield?.();

  await ctx.yield?.();
  // ---- standards, lever shafts, fly pedestal (static) ----
  const SHAFT_X = -13, SHAFT_Y = 45.5;
  const standard = plate([[-3.2, 0], [3.2, 0], [3.2, 0.8], [1.3, 3.2], [0.75, 24.0], [1.3, 25.0], [1.3, 26.4], [-1.3, 26.4], [-1.3, 25.0], [-0.75, 24.0], [-1.3, 3.2], [-3.2, 0.8]], 0.8,
    [[[-0.9, 4.2], [0.9, 4.2], [0.45, 11.0], [-0.45, 11.0]], [[-0.4, 12.2], [0.4, 12.2], [0.3, 21.5], [-0.3, 21.5]]], 0.12);
  for (const z of [ROW_Z0, ROW_Z1]) {
    add(S, standard, M(SHAFT_X, BED_TOP, z), paint);
    add(S, cbox(7.6, 0.5, 2.4, 0.1), M(SHAFT_X, BED_TOP + 0.25, z), paint);
    add(S, lathe([[0, -0.7], [1.1, -0.7], [1.25, -0.5], [1.25, 0.5], [1.1, 0.7], [0, 0.7]], 14), M(SHAFT_X, SHAFT_Y, z, RX), paint);
  }
  add(S, gRod(0.5, ROW_Z1 - ROW_Z0 + 2.4, 10, 0.1), M(SHAFT_X, SHAFT_Y, ROW_Z0 - 1.2, RX), steel);
  // lifting-lever shaft at the west end
  add(S, gRod(0.42, 5.6, 10, 0.08), M(LEVER_X, LEVER_Y, 4.2, RX), steel);
  const lstd = plate([[-2.0, 0], [2.0, 0], [2.0, 0.6], [0.9, 2.0], [0.8, 6.0], [1.0, 7.4], [-1.0, 7.4], [-0.8, 6.0], [-0.9, 2.0], [-2.0, 0.6]], 0.7, [[[-0.35, 2.4], [0.35, 2.4], [0.3, 5.2], [-0.3, 5.2]]], 0.1);
  add(S, lstd, M(LEVER_X, BED_TOP, ROW_Z1 + 0.9), paint);
  add(S, lstd, M(LEVER_X, BED_TOP, 4.6), paint);
  add(S, cbox(4.6, 0.6, 5.4, 0.12), M(LEVER_X, BED_TOP - 0.1, 6.6), paint);            // bracket shelf off the girder
  add(S, cbox(0.6, 3.4, 4.0, 0.12), M(LEVER_X, BED_TOP - 2.0, 6.2, 0.5), paint);
  // fly pedestal on a bridge across the strike bay
  const midZ = (ROW_Z0 + ROW_Z1) / 2;
  add(S, cbox(4.6, 1.5, ROW_Z1 - ROW_Z0 + 2.6, 0.2), M(FLY_X, BED_TOP + 0.75, midZ), paint);
  add(S, cbox(3.8, 3.4, 6.6, 0.3), M(FLY_X, BED_TOP + 2.9, 2.0), paint);
  add(S, cbox(3.0, 0.3, 5.6, 0.1), M(FLY_X, BED_TOP + 4.7, 2.0), paintLt);
  add(S, lathe([[0, 24.6], [2.9, 24.6], [2.9, 25.2], [2.3, 25.6], [1.9, 26.6], [1.75, 27.2], [1.95, 27.5], [1.95, 28.0], [1.7, 28.3], [1.15, 40.6], [1.4, 41.0], [1.4, 41.5], [1.75, 42.0], [1.75, 42.9], [1.2, 43.2], [0, 43.2]], 16), M(FLY_X, 0, FLY_Z), paint);
  add(S, lathe([[0.7, 43.1], [1.0, 43.1], [1.0, 43.5], [0.7, 43.5]], 14), M(FLY_X, 0, FLY_Z), brassPol);
  for (const s of [-1, 1]) {
    add(S, gRod(0.22, 1, 8, 0.01), along(new THREE.Vector3(FLY_X, BED_TOP + 1.4, midZ + s * 6.4), new THREE.Vector3(FLY_X, 35.5, FLY_Z + s * 1.3)), steelDark);
    for (const sx of [-1.6, 1.6]) add(S, lathe(rodProfile(0.3, 0.4, 0.05), 6), M(FLY_X + sx, BED_TOP + 1.5, midZ + s * 6.9), steelDark);
  }
  add(S, lathe([[0, 35.2], [1.75, 35.2], [1.85, 35.4], [1.85, 35.9], [1.75, 36.1], [0, 36.1]], 16), M(FLY_X, 0, FLY_Z), paintLt);
  add(S, gRod(0.38, 1, 10, 0.005), along(new THREE.Vector3(WARN_X + 1.2, ARBOR_Y, 3.9), new THREE.Vector3(FLY_X - 1.9, ARBOR_Y, 3.9)), steel);
  add(S, lathe([[0.4, 0], [1.6, 0], [1.6, 0.3], [0.8, 1.0], [0.4, 1.0]], 16), M(WARN_X + 2.1, ARBOR_Y, 3.9, 0, 0, Math.PI / 2), steelPol);
  await ctx.yield?.();
  // ---- the fly's strike cage: four cast arms off the pedestal head, four posts outside the sweep, a ring and a crossed bridge
  // above that carries the arbor's top pivot, stays down to the two girders. The posts stand at +-30 degrees from the bed's long
  // axis: the two north ones are 7.5 m clear of the cradle's line over the going train (a full ring at y 43 would be 1.3 m).
  {
    const brassHi = C(cBrass, 1, 0.12, 1.3), CR = FLY_R + 1.8, V3 = (x, y, z) => new THREE.Vector3(x, y, z);
    const post = lathe([[0, 42.0], [0.62, 42.0], [0.62, 42.5], [0.36, 43.2], [0.3, 52.5], [0.36, 61.6], [0.6, 62.1], [0.6, 62.9], [0.4, 63.3], [0.4, 64.2], [0.55, 64.4], [0.55, 64.9], [0, 65.1]], 10);
    const pband = lathe([[0.3, 0], [0.5, 0.06], [0.5, 0.5], [0.3, 0.56]], 10);
    const feet = [[18.2, ROW_Z0], [18.0, ROW_Z1], [30.6, ROW_Z0], [29.3, ROW_Z1]];
    for (let k = 0; k < 4; k++) {
      const a = (k < 2 ? Math.PI : 0) + (k % 2 ? 1 : -1) * (k < 2 ? -1 : 1) * Math.PI / 6, cx = Math.cos(a), sz = Math.sin(a);
      const px = FLY_X + cx * CR, pz = FLY_Z + sz * CR;
      addNew(S, post, M(px, 0, pz), paint);
      for (const y of [44.6, 59.4]) addNew(S, pband, M(px, y, pz), brassHi);
      // cast arm from the pedestal head out to the post foot: a deep web, a top flange
      addNew(S, cbox(CR - 1.2, 1.1, 0.34, 0.08), M(FLY_X + cx * (CR + 1.2) / 2, 42.35, FLY_Z + sz * (CR + 1.2) / 2, 0, -a, 0), paint);
      addNew(S, cbox(CR - 1.0, 0.2, 0.9, 0.06), M(FLY_X + cx * (CR + 1.0) / 2, 42.95, FLY_Z + sz * (CR + 1.0) / 2, 0, -a, 0), paintLt);
      // stops on the inside of each post, just outside the vane tips: strike parts, so their noses are red
      for (const y of [46.2, 57.8]) { addNew(S, cbox(1.0, 0.5, 0.5, 0.08), M(px - cx * 0.75, y, pz - sz * 0.75, 0, -a, 0), iron); addNew(S, cbox(0.4, 0.6, 0.6, 0.08), M(px - cx * 1.35, y, pz - sz * 1.35, 0, -a, 0), red); }
      // stay from the arm's end down to the girder
      const f = feet[sz < 0 ? (cx < 0 ? 0 : 2) : (cx < 0 ? 1 : 3)];
      addNew(S, gRod(0.2, 1, 8, 0.004), along(V3(f[0], BED_TOP - 0.1, f[1]), V3(px - cx * 0.5, 42.3, pz - sz * 0.5)), steelDark);
      addNew(S, cbox(1.6, 0.4, 1.6, 0.1), M(f[0], BED_TOP + 0.2, f[1]), paint);
      // the crossed bridge: each post top to the pivot cock
      addNew(S, cbox(CR - 0.4, 0.7, 0.4, 0.1), M(FLY_X + cx * (CR + 0.4) / 2, 64.05, FLY_Z + sz * (CR + 0.4) / 2, 0, -a, 0), paint);
      await ctx.yield?.();
    }
    addNew(S, lathe([[CR - 0.25, 62.25], [CR + 0.25, 62.25], [CR + 0.25, 62.75], [CR - 0.25, 62.75], [CR - 0.25, 62.25]], 56), M(FLY_X, 0, FLY_Z), iron);
    addNew(S, lathe([[CR + 0.25, 62.38], [CR + 0.33, 62.42], [CR + 0.33, 62.58], [CR + 0.25, 62.62]], 56), M(FLY_X, 0, FLY_Z), brassHi);
    // the table ring round the pedestal head, tangent to the girder lines, with a brass band
    addNew(S, lathe([[6.75, 42.7], [7.25, 42.7], [7.25, 43.2], [6.75, 43.2], [6.75, 42.7]], 40), M(FLY_X, 0, FLY_Z), iron);
    addNew(S, lathe([[7.25, 42.82], [7.33, 42.86], [7.33, 43.04], [7.25, 43.08]], 40), M(FLY_X, 0, FLY_Z), brassHi);
    // the pivot cock: a brass bush under the crossing, a steel end cap and two screws
    addNew(S, lathe([[0.9, 63.55], [1.5, 63.55], [1.7, 63.75], [1.7, 64.5], [1.3, 64.75], [0.5, 64.75], [0.5, 65.0], [0, 65.0]], 16), M(FLY_X, 0, FLY_Z), brassHi);
    for (const sx of [-1, 1]) addNew(S, lathe(rodProfile(0.2, 0.3, 0.04), 6), M(FLY_X + sx * 1.15, 64.7, FLY_Z), steelDark);
    // brass bands on the pedestal column
    for (const [y, r] of [[29.2, 1.72], [39.3, 1.3]]) addNew(S, lathe([[r - 0.1, y], [r + 0.12, y + 0.08], [r + 0.12, y + 0.62], [r - 0.1, y + 0.7]], 16), M(FLY_X, 0, FLY_Z), brassHi);
  }
  await ctx.yield?.();
  const staticMesh = finish(S, matSolid, 'static');
  await ctx.yield?.();

  // =========================== the fly ===========================
  const fly = new THREE.Group(); fly.position.set(FLY_X, 0, FLY_Z); object.add(fly);
  const matFly = makeMaterial({ FLY: '' });
  {
    const B = new Batch(), H = FLY_Y1 - FLY_Y0, yc = (FLY_Y0 + FLY_Y1) / 2, r0 = 1.1, r1 = FLY_R, rc = (r0 + r1) / 2, L = r1 - r0;
    const panel = C(cOpal.clone().lerp(cSteel, 0.72), 1, 0.25, 0.9);
    const brassEdge = C(cBrass, 1, 0.14, 1.25);
    const dish = lathe([[1.9, 0.0], [1.7, 0.08], [1.3, 0.2], [0.7, 0.28], [0, 0.3]], 20, true), dishRim = lathe([[1.9, 0], [2.15, 0], [2.15, 0.1], [2.0, 0.18], [1.9, 0.1]], 20);
    const wearArc = lathe([[2.55, 0], [2.85, 0], [2.85, 0.05], [2.55, 0.05]], 10, false, 1.9, -0.95);
    const bossRim = lathe([[1.25, 0], [1.75, 0], [1.75, 0.16], [1.6, 0.26], [1.4, 0.26], [1.25, 0.16]], 24), bossCap = lathe([[0, 0], [1.25, 0], [1.25, 0.12], [0.5, 0.3], [0, 0.32]], 24);
    for (let v = 0; v < 2; v++) {
      const R = M(0, 0, 0, 0, v * Math.PI, 0), at = (x, y, z, rx = 0, ry = 0, rz = 0) => R.clone().multiply(M(x, y, z, rx, ry, rz));
      add(B, cbox(L, H, 0.16, 0.04), at(rc, yc, 0), panel);
      for (const y of [FLY_Y0 + 0.4, FLY_Y1 - 0.4]) add(B, cbox(L + 0.2, 0.8, 0.5, 0.1), at(rc, y, 0), steel);
      for (const y of [FLY_Y0 + H / 3, FLY_Y0 + 2 * H / 3]) add(B, cbox(L - 0.6, 0.5, 0.4, 0.08), at(rc, y, 0), steel);
      add(B, cbox(0.8, H, 0.56, 0.1), at(r1 - 0.4, yc, 0), red);                            // the whole outer stile is signal red: it reads from the entry
      for (const s of [-1, 1]) { add(B, bossRim, at(rc, yc, s * 0.08, s * RX), brassPol); add(B, bossCap, at(rc, yc, s * 0.08, s * RX), steel); }   // maker's boss
      add(B, cbox(0.9, H, 0.6, 0.1), at(r0 + 0.45, yc, 0), steel);
      // each bay: a brass-edged stiffening frame; the top and bottom bays carry a diagonal cross-brace and a pressed dish
      for (let b = 0; b < 3; b++) {
        const y0 = FLY_Y0 + b * H / 3 + (b === 0 ? 0.8 : 0.25), y1 = FLY_Y0 + (b + 1) * H / 3 - (b === 2 ? 0.8 : 0.25), ym = (y0 + y1) / 2, bh = y1 - y0, x0 = r0 + 0.9, x1 = r1 - 0.8, bw = x1 - x0;
        for (const y of [y0 + 0.09, y1 - 0.09]) addNew(B, cbox(bw, 0.18, 0.36, 0.05), at(rc + 0.05, y, 0), brassEdge);
        for (const x of [x0 + 0.09, x1 - 0.09]) addNew(B, cbox(0.18, bh - 0.36, 0.36, 0.05), at(x, ym, 0), brassEdge);
        if (b !== 1) {
          const dl = Math.hypot(bw - 0.5, bh - 0.5), da = Math.atan2(bh - 0.5, bw - 0.5);
          for (const sgn of [-1, 1]) addNew(B, cbox(dl, 0.3, 0.3, 0.06), at(rc + 0.05, ym, 0, 0, 0, sgn * da), steel);
          for (const sgn of [-1, 1]) { addNew(B, dish, at(rc + 0.05, ym, sgn * 0.08, sgn * RX), steelPol); addNew(B, dishRim, at(rc + 0.05, ym, sgn * 0.08, sgn * RX), brassEdge); }
          await ctx.yield?.();
        } else for (const sgn of [-1, 1]) for (const ry of [0, Math.PI]) addNew(B, wearArc, at(rc, yc, sgn * 0.08, sgn * RX, 0, ry), steelPol);   // wear arcs polished round the boss
      }
      await ctx.yield?.();
      if (vaneStyle === 1) add(B, cbox(0.5, H - 1.2, 0.4, 0.08), at(rc, yc, 0), steel);
      if (vaneStyle === 2) for (const s of [-1, 1]) add(B, cbox(Math.hypot(L - 1.4, H / 3 - 0.6), 0.36, 0.34, 0.06), at(rc, yc, 0, 0, 0, s * Math.atan2(H / 3 - 0.6, L - 1.4)), steel);
      // red corner tips: the swept drum gets its red rings from these
      for (const y of [FLY_Y0 + 1.3, FLY_Y1 - 1.3]) add(B, cbox(2.6, 2.6, 0.62, 0.12), at(r1 - 1.3, y, 0), red);
      // rivets along the rails and stiles
      const rivet = lathe([[0, 0], [0.13, 0], [0.1, 0.07], [0, 0.09]], 5);
      for (const s of [-1, 1]) {
        for (let i = 0; i < 9; i++) for (const y of [FLY_Y0 + 0.4, FLY_Y0 + H / 3, FLY_Y0 + 2 * H / 3, FLY_Y1 - 0.4]) add(B, rivet, at(r0 + 1.3 + i * 0.95, y, s * (y === FLY_Y0 + 0.4 || y === FLY_Y1 - 0.4 ? 0.25 : 0.2), s * RX), steelPol);
        for (let i = 0; i < 11; i++) add(B, rivet, at(r1 - 0.4, FLY_Y0 + 3.2 + i * 0.96, s * 0.25, s * RX), steelPol);
      }
      // brass clamps holding the vane to the arbor
      for (const y of [FLY_Y0 + 1.6, yc, FLY_Y1 - 1.6]) add(B, cbox(2.0, 1.3, 1.5, 0.2), at(1.1, y, 0), brass);
      await ctx.yield?.();
    }
    fly.userData.vanes = finish(B, matFly, 'flyVanes', fly);
    await ctx.yield?.();
    // the arbor, its collars and the vane hubs are their own mesh: they never fade, so the drum of blur has a solid spinning axle
    const AB = new Batch(), yc2 = (FLY_Y0 + FLY_Y1) / 2;
    add(AB, lathe([[0, 42.6], [0.72, 42.6], [0.72, 61.2], [1.0, 61.4], [1.0, 61.8], [0.5, 62.1], [0.85, 62.7], [0.85, 63.0], [0.35, 63.7], [0, 63.8]], 14), null, steelPol);
    for (const y of [43.6, 60.5]) add(AB, lathe([[0.7, y], [1.45, y], [1.6, y + 0.15], [1.6, y + 0.45], [1.45, y + 0.6], [0.7, y + 0.6]], 16), null, brassPol);
    for (const y of [FLY_Y0 + 1.6, yc2, FLY_Y1 - 1.6]) add(AB, lathe([[0.7, y - 0.75], [1.5, y - 0.75], [1.75, y - 0.5], [1.75, y + 0.5], [1.5, y + 0.75], [0.7, y + 0.75]], 16), null, brass);
    for (let k = 0; k < 4; k++) add(AB, cbox(0.5, 15.4, 0.22, 0.06), M(Math.cos(k * Math.PI / 2) * 0.8, yc2, Math.sin(k * Math.PI / 2) * 0.8, 0, -k * Math.PI / 2), brassDull);   // keys along the arbor: they flicker as it spins
    fly.userData.arbor = finish(AB, matSolid, 'flyArbor', fly);
  }
  await ctx.yield?.();
  // the swept drum the vanes cross-fade into
  const drumUniforms = Object.assign(THREE.UniformsUtils.clone(THREE.UniformsLib.fog), {
    uBlur: { value: 0 }, uAng: { value: 0 }, uTime: uniforms.uTime, uPale: { value: cOpal.clone().lerp(cGrey, 0.35).multiplyScalar(0.8) },
    uRed: { value: cRed.clone().multiplyScalar(0.82) }, uSheen: { value: cOpal.clone().lerp(cGrey, 0.25).multiplyScalar(0.85) }, uSteel: { value: cSteel.clone().multiplyScalar(0.5) }, uDense: { value: 1 }, uY: { value: new THREE.Vector2(FLY_Y0, FLY_Y1 - FLY_Y0) }, uR: { value: FLY_R } });
  const matDrum = new THREE.ShaderMaterial({
    uniforms: drumUniforms, fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: /* glsl */`varying vec3 vL; varying vec3 vNv; varying vec3 vVv;
      #include <common>
      #include <fog_pars_vertex>
      void main(){ vL = position; vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mvPosition;
      vNv = normalMatrix * normal; vVv = -mvPosition.xyz;
      #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`uniform float uBlur, uAng, uTime, uR, uDense; uniform vec3 uPale, uRed, uSheen, uSteel; uniform vec2 uY; varying vec3 vL; varying vec3 vNv; varying vec3 vVv;
      #include <common>
      #include <fog_pars_fragment>
      float hh(float x){ return fract(sin(x * 127.1) * 43758.5453); }
      // smooth noise that closes round the drum: n cells per turn
      float streak(float a, float n, float seed){ float x = a / 6.2831853 * n; float i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
        return mix(hh(mod(i, n) + seed), hh(mod(i + 1.0, n) + seed), f); }
      // The fly at speed is a glass SHELL of blur: the surface its tips sweep, thin as a film. Looked at square on there is next
      // to nothing of it in the way, so the arbor, the cage and the train show clear through its middle; where the sight grazes
      // it (the limb) it looks along the film and through the most of it, and there it is the dense blue-grey of the smeared
      // plates. So the drum has a firm outline against a white dial, one thin red ring at each end where the corner tips run,
      // and nothing level across its body: only the fine upright streaks of the blur, faint, drifting slowly round.
      void main(){
        float r = length(vL.xz); float a = atan(vL.z, vL.x + 1e-5); float yf = clamp((vL.y - uY.x) / uY.y, 0.0, 1.0);
        float side = smoothstep(uR - 0.3, uR - 0.05, r);
        // how the sight meets the film: 0 square on, 1 along it; it falls away from the limb in a metre and a half
        float graze = abs(dot(normalize(vNv + vec3(1e-5)), normalize(vVv + vec3(1e-5)))); graze = exp(-4.0 * graze * graze);
        float sqOn = (1.0 - graze) * (1.0 - graze);                                     // the streaks live where the film is seen square on: none crowd together along the limb
        // streaks: the drum turns with the fly, so a pattern at (a - 0.96 uAng) drifts slowly in the room and never strobes
        float fine = smoothstep(0.52, 0.94, streak(a - uAng * 0.93, 18.0, 3.0));
        float hair = smoothstep(0.58, 0.97, streak(a - uAng * 1.035, 16.0, 11.0));
        float st = clamp(0.6 * fine + 0.35 * hair, 0.0, 1.0);
        // a thin red ring at the top and bottom edge: feathered inside, a brighter core
        float dEdge = mix(uR - r, min(yf, 1.0 - yf) * uY.y, side);
        float feather = mix(1.0, smoothstep(0.0, 0.25, dEdge), side);                           // no hard top and bottom edge
        // the swept corner tips: one thin ring on the very edge, half a metre of true red; the far rim is dimmer, so it reads as depth
        float redm = mix((1.0 - smoothstep(0.25, 0.6, dEdge)) * smoothstep(0.0, 0.12, dEdge) * 0.9, 0.94 * (1.0 - smoothstep(0.10, 0.28, abs(dEdge - 0.30))), side);
        redm *= gl_FrontFacing ? 1.0 : 0.45;
        float shim = 0.5 + 0.5 * sin(a * 3.0 + uAng * 0.21 + yf * 2.0) * sin(uTime * 7.0 + a * 2.0);
        // the film: nearly clear square on, dense along the sight; the end discs are thinner still, so the eye looks in at the top
        float alpha = mix(0.04 + 0.22 * graze, 0.12 + 0.72 * graze, side) + (0.24 * st + 0.02 * shim) * mix(0.5, 1.0, side) * sqOn;
        alpha = mix(alpha, 0.9, redm) * feather * uBlur;
        vec3 col = mix(uPale * 0.55, mix(uPale, uSheen, 0.5), st * sqOn);
        col = mix(col, uRed * (1.15 + 0.15 * st), redm);                              // signal red, under the bloom threshold: it must not go orange
        gl_FragColor = vec4(col, clamp(alpha * uDense, 0.0, 0.94));
        #include <fog_fragment>
      }` });
  const drum = new THREE.Mesh(lathe([[1.2, FLY_Y0], [FLY_R, FLY_Y0], [FLY_R, FLY_Y1], [1.2, FLY_Y1]], 56), matDrum);
  drum.frustumCulled = false; drum.renderOrder = 3; drum.visible = false; fly.add(drum); tris += 56 * 6;

  // =========================== levers ===========================
  const redNose = (x0) => (x, y, z, out) => { if (x > x0) { out.copy(cRed); out.metal = 0; out.rough = 0.4; } else { out.copy(cSteel).multiplyScalar(0.95); out.metal = 1; out.rough = 0.3; } };
  const liftLevers = LEVER_Z.map((z, k) => {
    const B = new Batch();
    const w = (x) => 0.34 + 0.62 * Math.exp(-((x / 1.5) ** 2)) + 0.16 * Math.exp(-(((x + LEVER_TAIL - 0.7) / 0.7) ** 2)) + (x > LEVER_NOSE - 1.6 ? 0.3 * smoothstep01((x - LEVER_NOSE + 1.6) / 0.9) * (1 - smoothstep01((x - LEVER_NOSE + 0.4) / 0.4)) : 0);
    const c = (x) => (x > LEVER_NOSE - 3 ? 0.07 * (x - LEVER_NOSE + 3) ** 2 : 0) + 0.25 * smoothstep01(-x / LEVER_TAIL);
    B.add(plate(leverOutline(-LEVER_TAIL, LEVER_NOSE, w, c, 30), 0.46, [], 0.08), null, redNose(LEVER_NOSE - 2.3));
    add(B, lathe([[0.42, -0.36], [0.95, -0.36], [1.05, -0.26], [1.05, 0.26], [0.95, 0.36], [0.42, 0.36]], 14), M(0, 0, 0, RX), brass);
    if (k === 0) add(B, lathe([[0, 0], [0.5, 0], [0.5, 0.5], [0.3, 0.9], [0, 0.9]], 8), M(-LEVER_TAIL + 0.6, 0.55, 0), steelDark);   // wire shackle
    const m = finish(B, matSolid, 'liftLever' + k); m.position.set(LEVER_X, LEVER_Y, z); return m;
  });
  await ctx.yield?.();
  // warning lever: 26 m, pivoted on the cross shaft, red end beside the fly, a drop link to the warning wheel
  const WARN_LEN = 26, WARN_LZ = -4.4;
  const warnLever = (() => {
    const B = new Batch();
    const w = (x) => 0.36 + 0.75 * Math.exp(-((x / 1.8) ** 2)) + 0.1 * smoothstep01(x / WARN_LEN) + (x < 0 ? 0.25 * smoothstep01(-x / 4) : 0);
    B.add(plate(leverOutline(-4.5, WARN_LEN, w, (x) => (x > WARN_LEN - 2.5 ? -0.09 * (x - WARN_LEN + 2.5) ** 2 : 0), 34), 0.5, [], 0.09), null, redNose(WARN_LEN - 2.6));
    add(B, lathe([[0.5, -0.4], [1.1, -0.4], [1.2, -0.28], [1.2, 0.28], [1.1, 0.4], [0.5, 0.4]], 14), M(0, 0, 0, RX), brass);
    add(B, cbox(2.2, 2.2, 1.3, 0.25), M(-3.9, 0, 0), C(cSteel, 1, 0.55, 0.5));                    // counterweight
    add(B, gRod(0.2, 14.2, 8), M(24.4, -14.6, 0.9), steel);                     // drop link
    add(B, cbox(1.2, 0.7, 2.2, 0.1), M(24.4, -0.4, 0.5), steel);
    add(B, cbox(1.5, 0.8, 0.6, 0.1), M(24.1, -14.9, 1.1), steelPol);            // detent block
    const m = finish(B, matSolid, 'warningLever'); m.position.set(SHAFT_X, SHAFT_Y, WARN_LZ); return m;
  })();
  // locking lever: from the cross shaft down to the count wheel's rim, beak in the notch
  const LOCK_TIP = new THREE.Vector2(GREAT_X - SHAFT_X, ARBOR_Y + 12 - SHAFT_Y);   // count wheel top, in pivot space
  const lockLever = (() => {
    const B = new Batch(), len = LOCK_TIP.length(), ang = Math.atan2(LOCK_TIP.y, LOCK_TIP.x);
    const w = (x) => 0.3 + 0.6 * Math.exp(-((x / 1.5) ** 2)) + (x > len - 1.2 ? 0.35 * (1 - Math.abs((x - len + 0.6) / 0.6)) : 0);
    B.add(plate(leverOutline(-2.2, len + 0.5, w, (x) => 0.9 * Math.sin(Math.PI * Math.min(1, Math.max(0, x / len))), 26), 0.44, [], 0.08), M(0, 0, 0, 0, 0, ang), redNose(1e9));
    add(B, lathe([[0.5, -0.36], [1.0, -0.36], [1.1, -0.25], [1.1, 0.25], [1.0, 0.36], [0.5, 0.36]], 14), M(0, 0, 0, RX), brass);
    add(B, cbox(0.7, 1.9, 0.5, 0.1), M(LOCK_TIP.x, LOCK_TIP.y - 0.2, 0), steelPol);               // the beak
    addR4(B, cbox(0.86, 0.7, 0.66, 0.1), M(LOCK_TIP.x, LOCK_TIP.y + 0.3, 0), red);                // strike red: a band round the beak's shoulder
    const m = finish(B, matSolid, 'lockingLever'); m.position.set(SHAFT_X, SHAFT_Y, COUNT_Z); return m;
  })();
  await ctx.yield?.();

  // =========================== hammer wire ===========================
  const WIRE_END = WIRE_A.clone().addScaledVector(WIRE_DIR, WIRE_LEN);
  const matWire = makeMaterial({ WIRE: '' }, { uSlack: { value: 0 }, uLen: { value: WIRE_LEN }, uFill: { value: 0.3 } });
  const wire = (() => {
    const nS = 230, nR = 8, pos = [], nor = [], L0 = -0.3, L1 = WIRE_LEN - 3.4;
    const ring = (i, j) => { const y = L0 + (L1 - L0) * (i / nS), a = (j / nR) * TAU, r = 0.2 * (1 + 0.05 * Math.cos(3 * a + y * 2.4)); return [Math.cos(a) * r, y, Math.sin(a) * r, Math.cos(a), 0, Math.sin(a)]; };
    for (let i = 0; i < nS; i++) for (let j = 0; j < nR; j++) {
      const a = ring(i, j), b = ring(i + 1, j), c = ring(i + 1, j + 1), d = ring(i, j + 1);
      for (const v of [a, b, d, b, c, d]) { pos.push(v[0], v[1], v[2]); nor.push(v[3], v[4], v[5]); }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    const B = new Batch(); B.add(g, null, C(cSteel, 1, 0.42, 0.8), 1, 0.42);
    // brass ferrules every 13 m: they ride with the wire when it is hauled, so the haul is seen
    { const fer = lathe([[0.2, 0], [0.33, 0.1], [0.36, 0.3], [0.36, 0.9], [0.33, 1.1], [0.2, 1.2]], 10), cf = C(cBrass, 1, 0.16, 1.3);
      for (let y = 9; y < L1 - 6; y += 13) B.add(fer, M(0, y, 0), cf, 1, 0.16); }
    // strike red: a painted band above every ferrule
    { const band = lathe([[0.2, 0], [0.31, 0.06], [0.31, 0.62], [0.2, 0.68]], 10);
      for (let y = 9; y < L1 - 6; y += 13) addR4(B, band, M(0, y + 1.3, 0), red); }
    const m = finish(B, matWire, 'hammerWire');
    m.position.copy(WIRE_A); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), WIRE_DIR);
    return m;
  })();

  await ctx.yield?.();
  // =========================== bell, hammer, clapper, crank ===========================
  // path line: beside the wire, 1.3 m north of it and 0.9 m under it (the clip is at upper right)
  const CLIP = new THREE.Vector3(1.05 * Math.sin(Math.PI / 3), -1.05 * Math.cos(Math.PI / 3), -1.75);
  const lineAtY = (y) => WIRE_A.clone().addScaledVector(WIRE_DIR, (y - WIRE_A.y) / WIRE_DIR.y).add(CLIP);
  const mouthPt = lineAtY(BELL_Y + 0.45);
  const SEAT = mouthPt.clone().addScaledVector(WIRE_DIR, 8);
  const BX = Math.round((mouthPt.x + 2.0) * 10) / 10, BZ = Math.round((mouthPt.z - 0.95) * 10) / 10;
  const HAM_S = 1.6, HAM_P = new THREE.Vector3(BX, BELL_Y + 1.6 - 4.6 * HAM_S, BZ + 16.9 + 5.2 * HAM_S);       // hammer pivot
  let bell = null, hammer = null, clapper = null, matBell = null;
  if (opts.bell !== false) {
    const f = bellFlare, outer = [[17 * f, 0.3], [16.75 * f, 1.2], [15.3 * f, 3.0], [14.2, 4.6], [14.35, 4.8], [14.0, 5.1], [13.4, 6], [11.9, 10], [10.7, 15], [9.9, 20], [9.45, 23.6], [9.6, 23.8], [9.6, 24.2], [9.35, 24.4], [8.8, 26.5], [7.2, 28.3], [4.5, 29.3], [2, 29.8], [0, 30]];
    const inner = [[0, 27.9], [2.5, 27.7], [5, 27.2], [7.4, 26], [8.4, 24], [8.9, 20.5], [8.7, 20.2], [8.72, 19.8], [8.98, 19.5], [9.75, 15], [10.6, 11.4], [10.42, 11.1], [10.46, 10.7], [10.8, 10.4], [12.3, 6], [12.75, 4.9], [12.5, 4.5], [12.55, 3.7], [13.5 * f, 2.9], [15.0 * f, 1.2], [16.0 * f, 0.3], [16.5 * f, 0], [17 * f, 0.3]];
    matBell = makeMaterial({ BELL: '' }, { uRing: { value: 0 }, uRingPhase: { value: 0 } });
    matBell.side = THREE.DoubleSide;
    const B = new Batch();
    const bellCol = C(new THREE.Color('#9c8d5c'), 1, 0.4);
    B.add(lathe(outer, 96, true), null, (x, y, z, out) => { out.copy(bellCol).multiplyScalar(y < 1.4 ? 1.25 : 1); out.metal = 1; out.rough = y < 1.4 ? 0.3 : 0.44; });
    add(B, lathe(inner, 96, true), null, C(bellCol, 1, 0.6, 0.55));
    bell = finish(B, matBell, 'bell'); bell.position.set(BX, BELL_Y, BZ);
    await ctx.yield?.();
    // static belfry parts: crown staple, oak headstock with straps, hammer beam, crank beam, pull rod
    const S2 = new Batch(), top = BELL_Y + BELL_H;
    add(S2, lathe([[0, top - 0.3], [3.4, top - 0.3], [3.4, top + 0.5], [2.4, top + 1.3], [0, top + 1.3]], 10), M(BX, 0, BZ), bronze);
    add(S2, cbox(7.5, 5.5, 46, 0.35), M(BX, top + 4.0, BZ), oak);
    add(S2, cbox(5.5, 2.4, 30, 0.3), M(BX, top + 7.9, BZ), oak);
    for (const z of [-17.5, -6, 6, 17.5]) { add(S2, cbox(8.1, 6.3, 0.9, 0.08), M(BX, top + 4.0, BZ + z), iron); for (const sx of [-1, 1]) add(S2, lathe(rodProfile(0.35, 0.5, 0.06), 6), M(BX + sx * 2.6, top + 6.75, BZ + z), iron); }
    for (const s of [-1, 1]) { add(S2, gRod(1.1, 3.2, 12, 0.15), M(BX, top + 4.0, BZ + s * 23 - (s > 0 ? 0 : 3.2), RX), iron); add(S2, cbox(9.5, 8.5, 2.6, 0.3), M(BX, top + 2.2, BZ + s * 25.2), oak); }
    add(S2, cbox(16, 2.2, 2.6, 0.2), M(BX, HAM_P.y - 2.5, HAM_P.z), oak);
    for (const sx of [-1, 1]) {
      add(S2, cbox(1.8, HAM_P.y - 1.4 - 150, 1.8, 0.15), M(BX + sx * 7, (HAM_P.y - 1.4 + 150) / 2, HAM_P.z), oak);
      add(S2, plate([[-1.6, -1.5], [1.6, -1.5], [1.0, 1.1], [-1.0, 1.1]], 0.6), M(BX + sx * 1.35, HAM_P.y, HAM_P.z, 0, Math.PI / 2), iron);
    }
    add(S2, gRod(0.5, 4.2, 10), M(BX - 2.1, HAM_P.y, HAM_P.z, 0, 0, -Math.PI / 2), steel);
    const crank = WIRE_END.clone().add(new THREE.Vector3(0.7, 1.2, 0.5)), tail = new THREE.Vector3(BX, HAM_P.y - 0.5 * HAM_S, HAM_P.z + 6.8 * HAM_S);
    add(S2, cbox(1.8, 1.8, 30, 0.16), M(crank.x + 0.6, crank.y + 1.9, crank.z + 16.4), oak);
    for (const z of [18, 30]) add(S2, cbox(1.5, crank.y + 1 - 150, 1.5, 0.14), M(crank.x + 0.6, (crank.y + 1 + 150) / 2, crank.z + z), oak);
    // the bell crank passes 2.5 m from the eye: a slim forged plate with a brass bush, bolts and a chamfered hanger, not a block
    add(S2, plate([[-0.42, -0.42], [0.42, -0.42], [2.0, 0.16], [2.1, 0.4], [2.0, 0.64], [0.5, 0.5], [0.26, 2.0], [0, 2.14], [-0.26, 2.0], [-0.5, 0.34], [-1.76, -0.72], [-1.52, -1.12]], 0.36, [], 0.08), M(crank.x, crank.y, crank.z, 0, 0, 0, 0.8), steel);
    add(S2, lathe([[0, -0.3], [0.3, -0.3], [0.38, -0.22], [0.38, 0.22], [0.3, 0.3], [0, 0.3]], 16), M(crank.x, crank.y, crank.z, RX), brassDull);
    add(S2, lathe([[0, -0.4], [0.22, -0.4], [0.22, 0.4], [0, 0.4]], 8), M(crank.x, crank.y, crank.z, RX), steelDark);
    for (const [bx, by] of [[1.48, 0.32], [0, 1.52], [-1.28, -0.72]]) add(S2, lathe([[0, -0.26], [0.13, -0.26], [0.16, -0.22], [0.16, 0.22], [0.13, 0.26], [0, 0.26]], 8), M(crank.x + bx, crank.y + by, crank.z, RX), brassDull);
    add(S2, cbox(0.7, 1.7, 0.7, 0.26), M(crank.x + 0.3, crank.y + 0.85, crank.z + 0.7), iron);
    for (const by of [0.2, 1.3]) add(S2, lathe(rodProfile(0.16, 0.2, 0.04), 6), M(crank.x - 0.16, crank.y + by, crank.z + 0.75, 0, 0, Math.PI / 2), steelPol);
    add(S2, gRod(0.3, 1, 8, 0.01), along(WIRE_END.clone().addScaledVector(WIRE_DIR, -5.2), WIRE_END.clone().addScaledVector(WIRE_DIR, 0.4)), steelDark);   // sleeve the wire slides in
    add(S2, gRod(0.2, 1, 8, 0.002), along(crank.clone().add(new THREE.Vector3(0, 1.6, 0.2)), tail), steel);
    finish(S2, matSolid, 'belfryStatic');
    await ctx.yield?.();
    // hammer: pivots about X; head on the south lip; red band on the head
    const HB = new Batch();
    HB.add(plate([[-0.9, -0.9], [0.9, -0.9], [1.8, 0.4], [3.9, 3.4], [3.9, 5.6], [2.7, 5.6], [0.6, 1.6], [-6.4, 0.3], [-7.2, 0.5], [-7.4, -0.5], [-6.6, -0.9]], 1.1, [], 0.12), M(0, 0, 0, 0, Math.PI / 2), C(cSteel, 1, 0.5, 0.55), 1, 0.5);
    HB.add(lathe([[0, -1.9], [1.35, -1.9], [1.6, -1.6], [1.6, -0.55], [1.68, -0.5], [1.68, 0.5], [1.6, 0.55], [1.6, 1.4], [1.3, 1.9], [0, 1.9]], 18), M(0, 4.6, -3.3, RX),
      (x, y, z, out) => { if (Math.abs(y) < 0.52 && Math.hypot(x, z) > 1.6) { out.copy(cRed); out.metal = 0; out.rough = 0.4; } else { out.copy(cSteel).multiplyScalar(0.7); out.metal = 1; out.rough = 0.36; } });
    // a dull leather face where it meets the lip, six bolts round the red band, a wedge key, a boss on the pivot
    HB.add(lathe([[0, -2.32], [1.22, -2.32], [1.36, -2.2], [1.36, -1.9], [0, -1.9]], 18), M(0, 4.6, -3.3, RX), C(new THREE.Color('#57534e'), 0, 0.9), 0, 0.9);
    for (let k = 0; k < 6; k++) { const a = (k / 6) * TAU + 0.3; HB.add(lathe([[0, 0], [0.16, 0], [0.2, 0.06], [0.2, 0.16], [0.12, 0.22], [0, 0.22]], 6), M(Math.cos(a) * 1.66, 4.6 + Math.sin(a) * 1.66, -3.3, 0, 0, a - Math.PI / 2), C(cSteel, 1, 0.2, 1.2), 1, 0.2); }
    HB.add(cbox(0.5, 1.0, 4.4, 0.16), M(0, 6.3, -3.3), C(cSteel, 1, 0.45, 0.6), 1, 0.45);
    HB.add(lathe([[0, -0.75], [0.9, -0.75], [1.1, -0.55], [1.1, 0.55], [0.9, 0.75], [0, 0.75]], 14), M(0, 0, 0, 0, 0, Math.PI / 2), C(cBrass, 1, 0.3, 0.9), 1, 0.3);
    hammer = finish(HB, matSolid, 'hammer'); hammer.position.copy(HAM_P); hammer.scale.setScalar(HAM_S);
    // clapper, tied back away from the camera line
    const CB = new Batch(), CL = 24;
    // a forged pear: the ball, a long flight under it, a flattened shank up to the staple; lashed back by its flight with turns of rope
    const clapIron = C(cSteel, 1, 0.5, 0.5), ropeC = C(new THREE.Color('#8a8672'), 0, 0.9);
    add(CB, lathe([[0, -CL - 5.0], [0.42, -CL - 4.9], [0.6, -CL - 4.5], [0.55, -CL - 2.7], [0.8, -CL - 2.1], [1.4, -CL - 1.4], [1.62, -CL - 0.4], [1.5, -CL + 0.6], [1.0, -CL + 1.7], [0.62, -CL + 2.5], [0.5, -CL + 3.2], [0, -CL + 3.2]], 16), null, clapIron);
    addNew(CB, cbox(0.95, CL - 3.6, 0.4, 0.12), M(0, -(CL + 2.4) / 2, 0), clapIron);
    addNew(CB, lathe([[0.5, -CL + 3.0], [0.78, -CL + 3.1], [0.78, -CL + 3.5], [0.5, -CL + 3.6]], 12), null, C(cSteel, 1, 0.3, 0.9));
    addNew(CB, lathe([[0, -1.5], [0.6, -1.4], [0.85, -0.7], [0.85, 0], [0, 0]], 10), null, clapIron);
    for (let k = 0; k < 6; k++) addNew(CB, lathe([[0.57, -0.13], [0.74, -0.08], [0.78, 0], [0.74, 0.08], [0.57, 0.13]], 10), M(0, -CL - 4.2 + k * 0.25, 0, 0.06 * (k % 2 ? 1 : -1)), ropeC);
    add(CB, gRod(0.2, 1, 6, 0.002), along(new THREE.Vector3(0.5, -CL - 3.6, 0), new THREE.Vector3(-3, -CL - 15, 0)), ropeC);
    clapper = finish(CB, matSolid, 'clapper');
    clapper.position.set(BX, BELL_Y + 27, BZ);
  }
  await ctx.yield?.();

  // =========================== strike weight and its line ===========================
  const WEIGHT_X = GREAT_X - 5.15, WEIGHT_Z = -3.0, WEIGHT_TOP = 13.5;
  const weight = new THREE.Group(); weight.position.set(WEIGHT_X, WEIGHT_TOP, WEIGHT_Z); object.add(weight);
  {
    const B = new Batch(), prof = [[0, -7.4], [2.0, -7.4], [2.2, -7.2]];
    for (let i = 0; i < 5; i++) { const y = -7.2 + i * 1.3; prof.push([2.2, y + 1.14], [2.05, y + 1.22], [2.2, y + 1.3]); }
    prof.push([2.2, -0.9], [1.5, -0.5], [0.5, -0.3], [0.5, 0.2], [0, 0.2]);
    add(B, lathe(prof, 18), null, C(cBlack, 0, 0.55, 2.2));
    add(B, lathe([[0.25, 0], [0.6, 0], [0.75, 0.3], [0.6, 0.9], [0.25, 0.9]], 8), null, steelDark);
    addR4(B, lathe([[2.2, -3.22], [2.25, -3.17], [2.25, -2.29], [2.2, -2.24]], 18), null, red);   // strike red: one course of the strike weight
    finish(B, matSolid, 'weight', weight);
    const LB = new Batch(); add(LB, gRod(0.2, 1, 8, 0.002), null, C(new THREE.Color('#7d7a6c'), 0, 0.9));
    weight.userData.line = finish(LB, matSolid, 'weightLine', weight); weight.userData.line.position.y = 0.6;
  }

  await ctx.yield?.();
  // =========================== dust vortex ===========================
  let dust = null, dustU = null, streaks = null;
  if (opts.dust !== false) {
    const N = Math.round(3000 * detail), a = new Float32Array(N * 4), p = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) { a[i * 4] = 4 + 44 * Math.sqrt(rng()); a[i * 4 + 1] = rng.range(24, 82) - 12 * rng() * rng(); a[i * 4 + 2] = rng() * TAU; a[i * 4 + 3] = rng(); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.setAttribute('aS', new THREE.BufferAttribute(a, 4));
    dustU = Object.assign(THREE.UniformsUtils.clone(THREE.UniformsLib.fog), { uTime: uniforms.uTime, uSwirl: { value: 0 }, uPull: { value: 0 }, uBufH: { value: 450 },
      uAxis: { value: new THREE.Vector2(FLY_X, FLY_Z) }, uCol: { value: cOpal.clone().lerp(cGrey, 0.3).multiplyScalar(0.36) } });
    dust = new THREE.Points(g, new THREE.ShaderMaterial({ uniforms: dustU, fog: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */`attribute vec4 aS; uniform float uTime, uSwirl, uPull, uBufH; uniform vec2 uAxis; varying float vA;
        #include <common>
        #include <fog_pars_vertex>
        void main(){ float r = aS.x; float k = 14.0 / max(r, 9.0);
          float ang = aS.z - uSwirl * k * k + uTime * 0.03 * (aS.w - 0.5);
          r *= 1.0 - 0.38 * uPull * (1.0 - smoothstep(12.0, 44.0, r));
          float y = aS.y + sin(uTime * 0.13 + aS.w * 40.0) * 1.5 + uPull * 3.0 * k * sin(ang * 0.5 + aS.w * 6.0) - uTime * 0.05 * aS.w;
          vec3 p = vec3(uAxis.x + cos(ang) * r, y, uAxis.y + sin(ang) * r);
          vec4 mvPosition = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mvPosition;
          float sz = (0.16 + 0.3 * fract(aS.w * 7.3)) * (1.0 + uPull * (0.5 + 1.1 * k));
          float arm = 0.5 + 0.5 * cos(2.0 * ang + 0.2 * r - uSwirl * 0.35); arm = mix(1.0, 0.25 + 3.2 * arm * arm * arm, uPull * (1.0 - smoothstep(30.0, 52.0, r)));
          float px = sz * projectionMatrix[1][1] * uBufH * 0.5 / max(-mvPosition.z, 0.5);
          vA = clamp(px / 1.6, 0.0, 1.0) * (0.55 + 0.45 * sin(uTime * 1.7 + aS.w * 91.0)); vA *= smoothstep(4.0, 16.0, -mvPosition.z) * arm * (1.0 + 0.8 * uPull * k) * mix(1.0, 1.7 / (1.0 + (r / 14.0) * (r / 14.0)), uPull); gl_PointSize = clamp(px, 1.6, uBufH * 0.006);
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */`uniform vec3 uCol; varying float vA;
        #include <common>
        #include <fog_pars_fragment>
        void main(){ vec2 q = gl_PointCoord - 0.5; float d = 1.0 - smoothstep(0.1, 0.5, length(q));
          gl_FragColor = vec4(uCol * d * vA, 1.0);
          #ifdef USE_FOG
            #ifdef FOG_EXP2
              float ff = 1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
            #else
              float ff = smoothstep(fogNear, fogFar, vFogDepth);
            #endif
            gl_FragColor.rgb *= 1.0 - ff;
          #endif
        }` }));
    dust.frustumCulled = false; dust.renderOrder = 4; object.add(dust);
    await ctx.yield?.();
    // the vortex made visible: motes near the axis are drawn as the streaks they leave, ribbons that trail back along a
    // rising spiral. They have no length (and no light) until the fly pulls: uPull.
    const NS = Math.round(260 * detail), SEG = 10, sa = new Float32Array(NS * SEG * 6 * 4), st = new Float32Array(NS * SEG * 6 * 2), sp = new Float32Array(NS * SEG * 6 * 3);
    let o = 0;
    for (let i = 0; i < NS; i++) {
      const r = 13.5 + 24 * Math.pow(rng(), 1.6), y = rng.range(38, 74), a0 = rng() * TAU, w = rng();
      for (let k = 0; k < SEG; k++) for (const [tt, sd] of [[k, -1], [k + 1, -1], [k, 1], [k + 1, -1], [k + 1, 1], [k, 1]]) {
        sa[o * 4] = r; sa[o * 4 + 1] = y; sa[o * 4 + 2] = a0; sa[o * 4 + 3] = w; st[o * 2] = tt / SEG; st[o * 2 + 1] = sd; o++; }
    }
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.BufferAttribute(sp, 3)); sg.setAttribute('aS', new THREE.BufferAttribute(sa, 4)); sg.setAttribute('aT', new THREE.BufferAttribute(st, 2));
    streaks = new THREE.Mesh(sg, new THREE.ShaderMaterial({ uniforms: dustU, fog: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      vertexShader: /* glsl */`attribute vec4 aS; attribute vec2 aT; uniform float uTime, uSwirl, uPull, uBufH; uniform vec2 uAxis; varying float vA; varying float vS;
        #include <common>
        #include <fog_pars_vertex>
        void main(){ float r0 = aS.x; float k = 14.0 / max(r0, 9.0);
          float len = (0.42 + 0.8 * aS.w) * uPull * k;                                      // radians of trail
          float ang = aS.z - uSwirl * k * k * (0.8 + 0.4 * aS.w) + aT.x * len;
          float r = r0 * (1.0 - 0.3 * uPull * (1.0 - smoothstep(12.0, 40.0, r0))) + aT.x * 1.6 * uPull;
          float y = aS.y + sin(uTime * 0.21 + aS.w * 40.0) * 1.2 + mod(uSwirl * (0.6 + aS.w), 9.0) - 4.5 - aT.x * 2.2 * uPull;
          vec3 p = vec3(uAxis.x + cos(ang) * r, y, uAxis.y + sin(ang) * r);
          vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
          float px = projectionMatrix[1][1] * uBufH * 0.5 / max(-mvPosition.z, 0.5);        // pixels per metre here
          float wdt = max(0.035 + 0.05 * fract(aS.w * 5.3), 0.9 / px);
          p.y += aT.y * wdt;
          mvPosition = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mvPosition;
          float cyc = mod(uSwirl * (0.6 + aS.w), 9.0) / 9.0;
          vA = uPull * (1.0 - aT.x) * (1.0 - aT.x) * smoothstep(0.0, 0.3, aT.x) * 1.5 * sin(3.14159 * cyc) / (1.0 + (r0 / 26.0) * (r0 / 26.0)) * clamp((0.035 + 0.05 * fract(aS.w * 5.3)) * px / 0.9, 0.25, 1.0)
            * smoothstep(3.0, 12.0, -mvPosition.z) * (0.6 + 0.9 * k);
          vS = aT.y;
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */`uniform vec3 uCol; varying float vA; varying float vS;
        #include <common>
        #include <fog_pars_fragment>
        void main(){ float d = 1.0 - vS * vS;
          gl_FragColor = vec4(uCol * (1.25 * d * vA), 1.0);
          #ifdef USE_FOG
            #ifdef FOG_EXP2
              float ff = 1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
            #else
              float ff = smoothstep(fogNear, fogFar, vFogDepth);
            #endif
            gl_FragColor.rgb *= 1.0 - ff;
          #endif
        }` }));
    streaks.frustumCulled = false; streaks.renderOrder = 4; streaks.visible = false; object.add(streaks); tris += NS * SEG * 2;
  }

  // =========================== timeline ===========================
  const ss = smoothstep01, T_WARN = TL.warning - TL.release, STEP = 45 * D2R, OMEGA_P = STEP / TL.interval;
  const LEAD = 0.31, A_END = BLOWS * TL.interval + 0.3 - LEAD, FALL = 0.16, OMEGA_FLY = TAU * 3.2;
  const runTime = (ts) => (ts <= 0 ? 0 : Math.min(A_END, ts - 0.15 * (1 - Math.exp(-ts / 0.15))));
  const T_END = A_END + 0.15;                                  // the train locks again
  const blowTimes = []; for (let n = 1; n <= BLOWS; n++) blowTimes.push(TL.release + n * TL.interval + 0.15 + FALL - LEAD);
  const clapAxis = new THREE.Vector3(-(SEAT.x - BX), 0, -(SEAT.z - BZ)).normalize().cross(new THREE.Vector3(0, 1, 0));
  const state = { strikeT: 0, blur: 0, haul: 0, flyAngle: 0, sinceBlow: 99 };
  let driven = false, handsSet = false;
  let _flyTh = 0, _flyOm = 0;
  function flyTheta(ts) {
    let th = restVane + Math.PI * ss((ts - T_WARN) / 0.7), om = 0;
    if (ts > 0) {
      const t = Math.min(ts, T_END), s = Math.min(t, 3);
      th += OMEGA_FLY * (s * s * s) / 27 + OMEGA_FLY * Math.max(0, t - 3);
      om = OMEGA_FLY * Math.min(1, (t / 3) ** 2);
      if (ts > T_END) { const d = Math.min(ts - T_END, 3); th += om * (d - d * d / 6); om *= 1 - d / 3; }
    }
    _flyTh = th; _flyOm = om;
  }
  function apply(ts) {
    state.strikeT = ts;
    const A = runTime(ts), alpha = OMEGA_P * (A + LEAD);
    pinWheel.rotation.z = alpha;
    greatWheel.rotation.z = -alpha * 0.3;
    countWheel.rotation.z = Math.min(A / TL.interval, BLOWS) * U78;
    warnWheel.rotation.z = A * 1.15 + 0.6 * ss((ts - T_WARN) / 0.5);
    // lifting levers follow their pins: pressed over the second half of each 45 degrees, then let go
    let haul = 0, since = 99;
    for (let k = 0; k < 3; k++) {
      const cyc = (alpha + k * 6 * D2R) / STEP, n = Math.floor(cyc), p = cyc - n;
      let dip = n < BLOWS ? 0.46 * ss((p - 0.5) / 0.5) ** 1.3 : 0;
      if (n >= 1) { const tp = (p * TL.interval) + (n >= BLOWS ? Math.max(0, ts - T_END) : 0); dip -= 0.07 * Math.exp(-tp * 7) * Math.cos(tp * 26); if (k === 0) since = tp; }
      liftLevers[k].rotation.z = -dip;
      if (k === 0) haul = Math.max(0, dip) / 0.46;
    }
    state.haul = haul; state.sinceBlow = since - FALL;
    const tb = since - FALL;                                   // seconds since the hammer landed
    wire.position.copy(WIRE_A).addScaledVector(WIRE_DIR, 3.55 * haul - 0.3 * Math.exp(-Math.max(since, 0) * 3));
    matWire.uniforms.uSlack.value = tb > 0 ? 1.3 * Math.exp(-tb * 1.5) : (since < 90 ? 1.3 * since / FALL : 0);
    if (hammer) {
      const fall = since < FALL ? 1 - (since / FALL) ** 2 : 0;
      const bounce = tb > 0 ? 0.05 * Math.exp(-tb * 9) * Math.abs(Math.sin(tb * 20)) : 0;
      hammer.rotation.x = 0.34 * Math.max(haul, fall) + bounce;
      matBell.uniforms.uRing.value = tb > 0 ? 0.55 * Math.exp(-tb * 0.85) : 0;
      matBell.uniforms.uRingPhase.value = Math.max(tb, 0) * 21;
      const tSwing = TL.duration - TL.release - 2.2;
      clapper.quaternion.setFromAxisAngle(clapAxis, 0.3 + 0.15 * ss((ts - tSwing) / 1.1) + (tb > 0 ? 0.012 * Math.exp(-tb * 1.2) * Math.sin(tb * 5) : 0));
    }
    // fly: real vanes, then the swept drum
    flyTheta(ts); const th = _flyTh, om = _flyOm;
    const blur = ss((om / TAU - 0.8) / 0.7);
    state.blur = blur; state.flyAngle = th;
    fly.rotation.y = th;
    matFly.uniforms.uFade.value = 1 - blur; fly.userData.vanes.visible = blur < 0.985;   // the vanes fade right out: a dithered ghost reads as a dot grid on the drum
    drum.visible = blur > 0.01; drumUniforms.uBlur.value = blur; drumUniforms.uAng.value = th;
    // warning lever drops at the warning, locking lever lifts at the release; both return at the end
    const tw = ts - T_WARN, back = ss((ts - T_END) / 0.5);
    warnLever.rotation.z = (0.07 - 0.16 * ss(tw / 0.25) + (tw > 0 ? 0.03 * Math.exp(-tw * 5) * Math.sin(tw * 22) : 0)) * (1 - back) + 0.07 * back;
    const te = ts - T_END;
    lockLever.rotation.z = 0.1 * ss(ts / 0.3) * (1 - ss(te / 0.2)) + (te > 0 ? 0.015 * Math.exp(-te * 8) * Math.sin(te * 30) : 0);
    // weight and its line
    weight.position.y = WEIGHT_TOP - 0.45 * A;
    weight.userData.line.scale.y = ARBOR_Y + 0.5 - (weight.position.y + 0.6);
    if (dustU) { dustU.uSwirl.value = ts > 0 ? 0.9 * (ts - 3 * (1 - Math.exp(-ts / 3))) : 0; dustU.uPull.value = ss(ts / 3.5); streaks.visible = ts > 0.05; }
    if (!handsSet) for (const h of uniforms.uHands.value) h.x = ts < 0 ? -TAU / 60 : 0;
  }
  function setStrikeTime(s) { driven = true; apply(s); }
  function setProgress(u) { setStrikeTime(u * TL.duration - TL.release); }
  function setHands(i, minute, hourAng) { handsSet = true; uniforms.uHands.value[i].set(minute, hourAng); }
  apply(opts.progress !== undefined ? opts.progress * TL.duration - TL.release : -10);

  const _inv = new THREE.Matrix4(), _sz = new THREE.Vector2();
  function update(dt, time, camera) {
    uniforms.uTime.value = time;
    object.updateWorldMatrix(true, false);
    uniforms.uHeroInv.value.copy(_inv.copy(object.matrixWorld).invert());
    if (dustU && ctx.renderer) dustU.uBufH.value = ctx.renderer.getDrawingBufferSize(_sz).y;
    if (!driven) apply(((time + 19) % TL.duration) - TL.release);     // demo loop for the part viewer
  }

  // =========================== anchors ===========================
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const orbit = [];
  for (let i = 0; i <= 8; i++) { const a = Math.PI / 2 + (i / 8) * TAU; const R = 25 + 9 * smoothstep01((i - 0.5) / 1.5) * (1 - smoothstep01((i - 4.2) / 1.6));
    orbit.push(V(FLY_X + Math.cos(a) * R, 47 + (i / 8) * 11, FLY_Z + Math.sin(a) * R)); }
  const flyThrough = [V(62, 46, 21), V(44, 46.5, 20.5), ...orbit,
    V(0, 55, 18), V(-20, 50, 21), V(-33, 47, 22), V(-42, 45, 18.5), V(-46.2, 44.5, 11.5), V(-45, 46.5, 5.6), V(-42.6, 51.4, 3.7),   // the turn passes UNDER the wire (3 m) and comes up onto its north side
    lineAtY(58), lineAtY(80), lineAtY(110), lineAtY(140), lineAtY(168), SEAT.clone()];
  uniforms.uSeat.value.copy(SEAT); { const hc = lineAtY(150); uniforms.uHatch.value.set(hc.x, 150, hc.z, 15); }
  const anchors = {
    flyAxis: { base: V(FLY_X, 43, FLY_Z), top: V(FLY_X, FLY_Y1, FLY_Z), y0: FLY_Y0, y1: FLY_Y1, tipRadius: FLY_R },
    orbit,                                                   // starts south of the fly heading west, turns through west, north, east
    flyThrough,                                              // approach from the east -> orbit -> west run -> turn -> wire -> seat
    wire: { start: WIRE_A.clone(), end: WIRE_END.clone(), dir: WIRE_DIR.clone(), radius: 0.2, clipOffset: CLIP.clone().negate() },   // camera + clipOffset = wire
    wireLine: { from: lineAtY(58), to: SEAT.clone() },       // the straight 60 degree run (153 m)
    portalSeat: { position: SEAT.clone(), facing: WIRE_DIR.clone().negate(), radius: 7, tiltDeg: 60 },
    hatch: { center: lineAtY(150).setY(150), size: 30 },
    bell: { center: V(BX, BELL_Y + BELL_H / 2, BZ), mouth: V(BX, BELL_Y, BZ), mouthRadius: BELL_R * bellFlare, height: BELL_H, innerRadiusAtSeat: 12 },
    hammer: { pivot: HAM_P.clone(), strikePoint: V(BX, BELL_Y + 1.6, BZ + BELL_R) },
    belfryPosts: [V(BX - 7, 150, HAM_P.z), V(BX + 7, 150, HAM_P.z), V(WIRE_END.x + 1.3, 150, WIRE_END.z + 18.5), V(WIRE_END.x + 1.3, 150, WIRE_END.z + 30.5)],
    leverShaft: { position: V(LEVER_X, LEVER_Y, 6.4), noses: LEVER_Z.map((z) => V(LEVER_X + LEVER_NOSE, LEVER_Y, z)) },
    crossShaft: { a: V(SHAFT_X, SHAFT_Y, ROW_Z0), b: V(SHAFT_X, SHAFT_Y, ROW_Z1), warningLeverTip: V(SHAFT_X + WARN_LEN, SHAFT_Y, WARN_LZ) },
    wheels: { pin: V(PIN_X, ARBOR_Y, PIN_Z), great: V(GREAT_X, ARBOR_Y, GREAT_Z), count: V(GREAT_X, ARBOR_Y, COUNT_Z), warning: V(WARN_X, ARBOR_Y, WARN_Z), radii: [15, 20, 12, 7] },
    bed: { top: BED_TOP, halfLength: 55, halfWidth: 20, girdersZ: [-20, ROW_Z0, ROW_Z1, 20], freeBays: [[-20, ROW_Z0], [ROW_Z1, 20]] },
    weightWell: V(WEIGHT_X, 0, WEIGHT_Z),
    viewpoints: {
      doors: { position: V(58, 47, 14), target: V(FLY_X, 52, FLY_Z) },          // 21-26 s: the still vanes ahead like two red-tipped doors
      hero: { position: V(4, 50, -9), target: V(FLY_X + 2, 60, FLY_Z) },         // 29 s: drum of blur, hatch and bell high beyond
      levers: { position: V(-34, 45, 17), target: V(-44, 27, 6) },
      upTheWire: { position: lineAtY(120), target: SEAT.clone() },
    },
  };

  return {
    object, radius: 48, height: 64, center: V(-8, 34, 0),
    anchors, update, setProgress, setStrikeTime, setHands, uniforms, makeMaterial, drumUniforms, dustUniforms: dustU,
    timeline: { ...TL, blows: BLOWS, blowTimes, strikeEnd: TL.release + T_END, hour },
    state, stats: { triangles: Math.round(tris) }, livery, liveryMul, liveryId, colors: { opal: cOpal, grey: cGrey, black: cBlack, brass: cBrass, steel: cSteel, red: cRed },
    dispose() {},
    ground: true, groundY: 0,
  };
}

// geometry helpers shared with the world (src/worlds/the-striking-hour.js)
export { M, along, cbox, lathe, rodProfile, gearPlate, Batch };
