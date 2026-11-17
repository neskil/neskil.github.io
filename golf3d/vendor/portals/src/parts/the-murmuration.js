// THE MURMURATION: hero set piece for the world "the-murmuration".
//
// WHAT IT IS
//   One starling flock of ~106,000 birds drawn as a single shape-shifting body, entirely in the
//   vertex shader (no CPU boids). It moves through five held forms on a 40 s "show clock":
//     0-9 s    RIBBON     400 m long, 12 m thick, snaking just over the reeds
//     9-17 s   TEARDROP   rising 250 m, 160 m bulb, tail trailing to the reeds
//     17-25 s  HOURGLASS  600 m long, two lobes and a 30 m waist; falcon strike at 20 s punches a
//                         hole, pinches the waist, splits the flock for ~2 s, it rejoins
//     17-25 s  (the hourglass lies broadside 300 m ahead of the reveal point, centred on brief x = 670)
//     25-31 s  WAVE       a barrel lying ALONG the flight line and keeping pace with the camera: the face
//                         stands out of the flood on the south, arches over the line (crest 105 m near the
//                         camera, 155 m far ahead) and the lip falls on the north, over the windpump. The
//                         camera dives through the roof and rides the tube toward the sun
//     31-40 s  TORUS      on the flight axis around the portal, tightening 60 m -> 10 m, then the
//                         birds spiral in and drain through the portal
//   plus two peregrines (tucked teardrops) whose stoops at 20 s and 27 s launch a dark shock shell
//   (15 m thick, 80 m/s, every bird banks 70 degrees) and ~90 "wingmen" that hold loose station
//   3-14 m around the camera with visible 12 Hz wingbeats, drifting slowly so they never sit still.
//
// FRAME (local space, metres)
//   Origin = centre of the flood at water level. +Y up. The flight line runs along -Z: the camera
//   enters at z = +390 and the portal hangs at z = -390, y = 40. The SUN IS AT -Z (dead ahead).
//   North (the windpump side) is +X. Brief coordinate x (0..780 west) maps to local z = 390 - x.
//
// STYLE (so the world can match it)
//   Paper cut-out silhouette: every bird is flat near-black (palette[6] #0E0B12, linear, unlit),
//   with only a hairline warm glint (palette[3]) when a wing plane faces the sun direction. No
//   lighting, no textures, opaque, never alpha-blended. Density is done by per-bird dithered
//   discard in the vertex shader. Scene fog is honoured (three fog chunks) so far birds sit in haze.
//
// opts
//   palette        array of 7 hex strings (brief palette default); [6] silhouette, [3] rim glint
//   quads          near LOD count, folded-quad birds, 2 tris each (default 36000)
//   darts          far LOD count, 1-tri darts (default 70000)
//   dartNearCull   darts are hidden within this many metres of the eye (default 42)
//   wingmen        birds holding station around the camera (default 90, 0 disables)
//   erupt          true = dawn: at the start the far end of the ribbon is still rising out of the reedbed
//   sunDir         THREE.Vector3 toward the sun in local space (default level, -Z)
//   viewportHeight override the render-target height in px used for the 1.5 px minimum size
//                  (default: read from the renderer at draw time, also correct in reflection passes)
//   autoplay       seconds of show clock per second while setProgress() has never been called
//                  (default 1: the part viewer loops the whole show; 0 = hold at opts.startT)
//   startT         show-clock second to start from (default 0)
//   rare           true = the rare event: a third of the birds arrive as a second flock from the north
//   raptor         'peregrine' (default) | 'sparrowhawk' | 'harrier': who makes the two attacks
//
// API on the returned hero
//   setProgress(u)        u 0..1 -> show clock T = u * 40 s. Call every frame with the world's u.
//                         All five forms, both stoops, the split and the drain key off this, never
//                         wall-clock. Ambient motion (wingbeats, flow, bands) uses update() time.
//   setShowTime(T)        same, in seconds (0..40)
//   setViewportHeight(h)  force that height (normally not needed)
//   setWingmen(a)         0..1 scale of the camera's wingmen (fade them out for wide shots)
//   makeMirror(count)     returns a Mesh of `count` darts (default 15000) with the same motion,
//                         y-flipped about y = 0, for the world's quarter-res reflection pass or to
//                         sit under a semi-transparent water surface. Costs `count` tris, 1 call.
//   showSeconds (40), uniforms (shared uniform block), falconAt(i, T, outVec3)
//
// anchors (local space)
//   portalSeat    { position (0,40,-390), facing (0,0,1) }  the 14 m portal, facing back up the flight line
//   flyThrough    ordered Vector3 list with `times` (show seconds) = the bird's-eye camera line from
//                 the brief: low over the dyke, climb through the teardrop bulb, burst out at 200 m,
//                 dive back into the wave, down the torus axis to the portal. Birds part around the
//                 camera (3 m bubble in the shader), nothing solid is on the line.
//   flyTimes      show-clock second at each flyThrough point (use to map u so camera and show agree)
//   revealLook    where to pitch the gaze at the reveal (hourglass waist)
//   forms         centre of each form: ribbon, teardrop, hourglass, wave, torus (for pois)
//   stoop1, stoop2  strike points of the two falcon stoops (20 s, 27 s); stoop2 is 8 m north of
//                 flyThrough at 27 s
//   windpump      (30,0,-200) where the 12 m windpump stands; the wave parts around a 9 m column there
//   viewpoints    { reveal, outside, low } good static camera positions looking at `center`
//
// SIZE  radius 400 (use 330 for framing), height 260. center (0,90,-40).
// COST  quads*2 + darts tris = 142,000 by default, 2 draw calls; falcons 2 calls (~250 tris each);
//       wingmen 1 call (36 x 26 tris). Total ~144k tris, 5 draw calls. Build ~60 ms. No lights.
// LIGHT expects a low sun at -Z and a bright sky behind it: the piece is a silhouette and needs a
//       luminous background (sky gradient, mirror water) to read. Fog colour should be the rose
//       horizon haze, density <= 0.0012.

import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const DEFAULT_PALETTE = ['#2A2350', '#7A3B78', '#E85A5A', '#FF9A45', '#FFE08A', '#B8687E', '#0E0B12'];
const SHOW_SECONDS = 40;
const FD = 0.12; // finite-difference step (s) used for bird headings

// brief coords (wx west, y up, n north) -> local
const L = (wx, y, n) => new THREE.Vector3(n, y, 390 - wx);

// falcon stoops: [startT, strikeT, start(wx,y,n), strike(wx,y,n)]
function makeStoops(rng) {
  const n1 = rng.range(-12, 12), n2 = 8 + rng.range(-1, 1);
  return [
    { t0: 18.5, ts: 20.0, a: new THREE.Vector3(638 + rng.range(-8, 8), 184, n1 - 20), s: new THREE.Vector3(670, 70, n1) },
    { t0: 25.7, ts: 27.0, a: new THREE.Vector3(457, 150, n2 + 14), s: new THREE.Vector3(500, 54, n2) },
  ];
}

// spin angle of the torus as a function of show time (angular rate rises as the ring tightens)
function torusSpin(T) {
  let a = 0; const n = 24, t1 = clamp(T, 31.3, 41);
  for (let i = 0; i < n; i++) {
    const t = 31.3 + (t1 - 31.3) * (i + 0.5) / n, k = clamp((t - 32) / 8, 0, 1);
    const R = 60 * Math.pow(0.1667, k);
    a += Math.min(Math.PI, 30 / R) * (t1 - 31.3) / n;
  }
  return a;
}

// ------------------------------------------------------------------------------------------
// GLSL: the flock. Everything is computed in "brief space" p = (wx west, y up, n north) and
// converted to local at the end (local = (n, y, 390 - wx)).
// ------------------------------------------------------------------------------------------
const FLOCK_GLSL = /* glsl */`
uniform vec4 uA;        // show T, ambient time, flow phase, torus spin
uniform vec4 uB;        // the same a moment later (for headings)
uniform vec4 uVar;      // per-seed variety
uniform vec3 uStO[2];   // stoop strike points
uniform float uStT[2];  // seconds since each strike (negative = not yet)
uniform vec3 uFA[2];    // falcon line start
uniform vec3 uFD[2];    // falcon line direction
uniform vec2 uFL[2];    // distance travelled, hole strength
uniform vec3 uCam;      // camera in brief space
uniform vec3 uPump;     // windpump wx, n, clearance radius
uniform float uBubble;  // camera bubble radius (0 = off)
uniform float uErupt;   // 1 = dawn: the ribbon lifts out of the reedbed roost
uniform float uRare;    // 1 = rare event: a third of the birds arrive as a second flock from the north

float tri(float x){ return abs(fract(x) * 2. - 1.); }

vec3 sRibbon(vec4 sd, float ph, float T, float tm){
  float u = fract(ph);
  float tp = pow(max(sin(3.14159 * u), 0.), .4);
  // at the very start the densest 250 m hangs just ahead of the entry, so it reads through the portal
  float open = smoothstep(0., 3., T);
  float wx = 40. + mix(250. * u, 12. * T + 400. * u, open);
  float n = (44. + 10. * uVar.x) * sin(u * (6.5 + 2. * uVar.y) + tm * .33 + uVar.z * 6.)
          + 15. * sin(u * 17. - tm * .52 + uVar.w * 6.);
  float y = mix(18., 14., open) + 3.5 * sin(u * 12. - tm * .7 + uVar.x * 9.);
  float ang = 6.2832 * sd.y + u * 9. + tm * .3, rr = pow(sd.z, .6);
  n += cos(ang) * rr * 14. * tp;
  y += sin(ang) * rr * 6. * tp;
  if (uErupt > .5) {
    // the far end of the ribbon is still pouring up out of the reeds
    float up_ = smoothstep(0., 1., T / 2.6 + .9 - 1.6 * u);
    y = mix(2.4 + 1.6 * sd.z + 5. * up_ * (1. - up_) * sd.w, y, up_);
  }
  return vec3(wx, y, n);
}

vec3 sTear(vec4 sd, float ph, float T, float tm){
  float hf = step(.5, fract(ph));
  float q = pow(tri(ph), .4);
  float y, r;
  float wx = 215. + 135. * pow(q, .8) + 18. * uVar.x * q;
  float n = (26. * sin(q * 5. + tm * .4 + uVar.z * 6.) + 30. * uVar.y) * (1. - q * .8);
  if (q < .5) { y = 9. + 86. * pow(q / .5, 1.35); }
  else { y = 95. + 155. * (q - .5) / .5; }
  float s = clamp((q - .5) / .5 * 2. - 1., -1., 1.);
  float rb = 82. * sqrt(max(0., 1. - s * s)) * (.82 + .18 * s);
  r = mix(4.5 + 6. * q, rb, smoothstep(.44, .62, q));
  r *= 1. + .07 * sin(tm * 1.3 + q * 6.);
  float ang = 3.14159 * (sd.y + hf) + tm * .25 + q * 2.5, rr = pow(sd.z, .42);
  wx += cos(ang) * rr * r;
  n += sin(ang) * rr * r;
  y += (sd.w - .5) * 5. * step(q, .5);
  return vec3(wx, y, n);
}

vec3 sHour(vec4 sd, float ph, float T, float tm){
  float hf = step(.5, fract(ph));
  float p = tri(ph) * 2. - 1.;
  float sg = p < 0. ? -1. : 1.;
  float ap = pow(abs(p), .75);
  float lobe = max(sin(3.14159 * ap), 0.) * (1. + .16 * sg * uVar.x);
  float pinch = smoothstep(20.1, 20.6, T) * (1. - smoothstep(21.5, 22.6, T));
  float split = smoothstep(20.4, 20.9, T) * (1. - smoothstep(21.1, 21.8, T));
  float nearW = 1. - smoothstep(0., .45, ap);
  float rl = 54. * lobe + 15. * nearW * (1. - .93 * pinch);
  // the body lies across the view (yawed off the flight line and slowly turning) so the whole
  // 600 m is seen broadside against the sun from the reveal point
  float al = sg * ap * 250. + sg * 24. * split * nearW;
  float y = 70. + 11. * sin(tm * .5 + sg * 1.3 + uVar.z * 6.) * ap;
  float lt = 22. * sin(ap * 3. + tm * .3 + uVar.w * 6.) * sg * ap;
  float ang = 3.14159 * (sd.y + hf) + tm * .22 * sg + ap * 2., rr = pow(sd.z, .36);
  lt += cos(ang) * rr * rl;
  y += sin(ang) * rr * rl * .5;
  float psi = (uVar.y > 0. ? 1. : -1.) * (1.3 + .035 * (T - 17.));
  float cp = cos(psi), sp = sin(psi);
  float cx = 670.;
  return vec3(cx + al * cp - lt * sp, y, al * sp + lt * cp);
}

// The wave is a barrel lying ALONG the flight line and keeping pace with the camera: its face stands
// out of the flood on the south (left), arches over the line and the lip falls on the north (right),
// over the windpump. The camera dives through the roof and rides the tube toward the sun, so the
// sheet is always seen edge-on (dense) and its arch frames the sun; far ahead it rears taller and
// has not yet curled over.
vec3 sWave(vec4 sd, float ph, float T, float tm){
  float hf = step(.5, fract(ph)) * 2. - 1.;
  float a = sd.y;
  float wx = 410. + 27. * (T - 25.) + 400. * a;
  float grow = 1. + .5 * a;
  float q = pow(tri(ph), .8);
  float rear = smoothstep(25.2, 27., T);
  float curlEnd = mix(1.9, mix(-.8, .7, smoothstep(.25, 1., a)), rear);
  float n, y, th; vec2 nr;
  if (q < .38) {
    float s = q / .38;
    n = -25. - 52. * (1. - s) * (1. - s); y = 4. + 58. * pow(s, 1.2); th = mix(4., 7., s);
    nr = normalize(vec2(-1., .9 * (1. - s)));
  } else {
    float v = (q - .38) / .62;
    float phi = mix(3.14159, curlEnd, v), rad = 45. * (1. - .3 * v);
    nr = vec2(cos(phi), sin(phi));
    n = 20. + nr.x * rad; y = 62. + nr.y * rad; th = mix(7., 3.5, v * v);
  }
  float off = th * hf * pow(sd.z, .7);
  n += nr.x * off; y += nr.y * off;
  n = n * grow + 12. * sin(wx * .016 + tm * .45 + uVar.z * 6.) * a + 5. * uVar.x;
  y = 5. + (y - 5.) * grow * (1. + .08 * sin(wx * .023 - tm * .7));
  return vec3(wx, y, n);
}

vec3 sTorus(vec4 sd, float T, float tm, float spin){
  float k = clamp((T - 32.) / 8., 0., 1.);
  float R = 60. * pow(.1667, k);
  float th = 6.2832 * sd.x + spin * (.9 + .2 * sd.w);
  float minor = mix(15., 3., k);
  float ang = 6.2832 * sd.y + th * 2. + tm * .6, rr = sqrt(sd.z);
  float radial = R + cos(ang) * rr * minor;
  float ax = sin(ang) * rr * minor * 1.7;
  float wx = 752. + 8. * k + ax;
  // drain: each bird leaves the ring at its own moment, spirals inside the portal rim and through
  float td = 35.6 + 3.9 * fract(sd.w * 7.31 + sd.x);
  float g = clamp((T - td) / 1.3, 0., 1.);
  float gs = g * g * (3. - 2. * g);
  radial = mix(radial, 1.2 + 4.6 * sqrt(sd.z), gs);
  wx += g * g * 70.;
  float sy = sin(th), cy = cos(th);
  float squash = sy < 0. ? min(1., 33. / max(radial, 1.)) : 1.;
  return vec3(wx, 40. + sy * radial * squash, cy * radial);
}
`;

const FLOCK_MAIN_GLSL = /* glsl */`
vec3 flockPos(vec4 sd, vec4 A){
  float T = A.x, tm = A.y;
  float ph = sd.x + A.z * (.6 + .8 * sd.w);
  float Tb = T - .5 * fract(sd.x * 3. + sd.w * 1.7);
  vec3 p; float m = 0.;
  if (Tb < 10.3) {
    p = sRibbon(sd, ph, T, tm);
    if (Tb > 9.) { m = smoothstep(9., 10.3, Tb); p = mix(p, sTear(sd, ph, T, tm), m); }
  } else if (Tb < 18.3) {
    p = sTear(sd, ph, T, tm);
    if (Tb > 17.) { m = smoothstep(17., 18.3, Tb); p = mix(p, sHour(sd, ph, T, tm), m); }
  } else if (Tb < 26.3) {
    p = sHour(sd, ph, T, tm);
    if (Tb > 25.) { m = smoothstep(25., 26.3, Tb); p = mix(p, sWave(sd, ph, T, tm), m); }
  } else if (Tb < 32.4) {
    p = sWave(sd, ph, T, tm);
    if (Tb > 31.3) { m = smoothstep(31.3, 32.4, Tb); p = mix(p, sTorus(sd, T, tm, A.w), m); }
  } else {
    p = sTorus(sd, T, tm, A.w);
  }
  p.y += sin(3.14159 * m) * 14. * (sd.z - .35);
  // rare event: a second body comes in from the north, passes through the first like smoke and merges
  if (uRare > .5 && fract(sd.w * 3.77 + sd.y * 5.31) < .34) {
    float ra = 1. - smoothstep(2., 14.5, T);
    float rb = smoothstep(11.5, 16., T) * (1. - smoothstep(17.5, 23.5, T));
    p.z += 420. * ra - 135. * rb;
    p.y += 34. * ra + 16. * rb + 20. * sin(ra * 3.14159);
    p.x += 70. * ra - 30. * rb;
  }
  // turbulence: two octaves of swirling displacement, a travelling density wave, personal wander
  float calm = 1. - .75 * smoothstep(34., 38., T);
  vec3 tb = 5. * sin(p.yzx * .045 + tm * .6 + vec3(0., 2., 4.) + uVar.xyz * 6.)
          + 2. * sin(p.zxy * .13 - tm * 1.1 + sd.w * .6);
  tb.y *= .4;
  p += tb * calm;
  vec3 d1 = normalize(vec3(1., .15, .45));
  p += d1 * 5. * calm * sin(dot(p, d1) * .085 - tm * 2.2);
  p += .9 * sin(tm * vec3(1.3, 1.7, 1.1) * (.6 + sd.w) + sd.xyz * 40.);
  // falcon holes: a capsule of empty air that follows each stoop
  for (int i = 0; i < 2; i++) {
    float hs = uFL[i].y;
    if (hs > 0.) {
      vec3 v = p - uFA[i];
      float t = clamp(dot(v, uFD[i]), max(0., uFL[i].x - 110.), uFL[i].x);
      vec3 d = v - uFD[i] * t;
      float dl = length(d) + 1e-3;
      float ps = max(0., 13.5 - dl);
      p += d / dl * ps * (.55 + .45 * ps / 13.5) * hs;
    }
  }
  // the windpump column
  vec2 dp = p.xz - uPump.xy; float dpl = length(dp) + 1e-3;
  p.xz += dp / dpl * max(0., uPump.z - dpl) * (1. - smoothstep(14., 24., p.y));
  // bird-free bubble round the camera
  vec3 dc = p - uCam; float dcl = length(dc) + 1e-3;
  p += dc / dcl * max(0., uBubble - dcl);
  p.y = max(p.y, 2.2 + 1.6 * sd.z);
  return p;
}

// bank angle: travelling bands at all times plus the stoop shock shells
float bankAt(vec3 p, float tm, vec4 sd){
  vec3 d2 = normalize(vec3(.8, .25, -.55));
  float w = sin(dot(p, d2) * .034 - tm * 1.7 + 2. * sin(tm * .21 + uVar.w * 6.));
  float bk = 1.05 * smoothstep(.55, .95, w) + .18 * sin(tm * .9 + sd.w * 30.);
  for (int i = 0; i < 2; i++) {
    float ts = uStT[i];
    if (ts > 0. && ts < 7.) {
      float sh = 1. - smoothstep(0., 7.5, abs(length(p - uStO[i]) - 80. * ts));
      bk = mix(bk, 1.22, sh * (1. - smoothstep(5., 7., ts)));
    }
  }
  return bk;
}
`;

const BIRD_VERT = /* glsl */`
attribute vec4 aSeed;
uniform float uViewH, uMirror, uMinPx, uNearCull;
uniform vec3 uSun;
varying float vGl;
#include <common>
#include <fog_pars_vertex>
${FLOCK_GLSL}
${FLOCK_MAIN_GLSL}
vec3 toLocalDir(vec3 v){ return vec3(v.z, v.y * uMirror, -v.x); }
//@MIRROR_PARS
void main(){
  vec3 p0 = flockPos(aSeed, uA), p1 = flockPos(aSeed, uB);
  vec3 f = normalize(p1 - p0 + vec3(1e-4, 0., 0.));
  vec3 r = normalize(cross(f, vec3(0., 1., 0.)) + vec3(0., 0., 1e-4));
  vec3 up = cross(r, f);
  float bk = bankAt(p0, uA.y, aSeed);
  r = r * cos(bk) + up * sin(bk);
  up = cross(r, f);
  vec3 vd = normalize(uCam - p0);
  float facing = dot(up, vd);
  float flat_ = abs(facing);
  vGl = pow(max(dot(up * sign(facing), uSun), 0.), 3.);
  float id = position.x;
  vec3 lp = vec3(p0.z, p0.y * uMirror, 390. - p0.x);
  vec4 mvPosition = modelViewMatrix * vec4(lp, 1.);
  float dist = max(-mvPosition.z, .05);
  float hsh = fract(aSeed.w * 91.7 + aSeed.y * 13.3);
  bool offWater = false;
  //@MIRROR_MAIN
  // one-triangle darts never come close to the eye: only folded birds fly in the near field
  bool gone = offWater || (uA.x > 32. && p0.x > 780.) || dist < uNearCull * (.55 + .45 * hsh);
  float S = 1. + 2. * smoothstep(60., 320., dist);
  if (dist < 55. + 50. * hsh) {
    // near: a real folded bird, the fold is the wingbeat (12 Hz with short glides)
    float fl = sin(uA.y * 75.4 + aSeed.w * 44.);
    float gl = smoothstep(.5, .7, sin(uA.y * 1.9 * (.7 + aSeed.z * .6) + aSeed.y * 40.));
    float fa = mix(fl * .85, .14, gl);
    vec3 o;
    if (id < .5) o = f * .19;
    else if (id < 1.5) o = f * .02;
    else o = ((id < 2.5 ? -1. : 1.) * r * cos(fa) + up * sin(fa)) * .23 - f * .15;
    mvPosition = modelViewMatrix * vec4(lp + toLocalDir(o) * S, 1.);
    gl_Position = projectionMatrix * mvPosition;
  } else {
    // far: a screen-facing dart whose width follows how flat the wings lie to the eye
    gl_Position = projectionMatrix * mvPosition;
    vec2 hv = (modelViewMatrix * vec4(toLocalDir(f), 0.)).xy;
    hv = length(hv) > 1e-3 ? normalize(hv) : vec2(0., 1.);
    vec2 pv = vec2(-hv.y, hv.x);
    float ppm = projectionMatrix[1][1] * uViewH * .5 / dist;
    float wpx = .38 * S * ppm * mix(.3, 1., flat_);
    float lpx = .33 * S * ppm;
    // density waves: slow folds of thick and thin flock that drift through the body
    vec3 dq = p0 * vec3(.021, .034, .026);
    float dens = .5 + .25 * sin(dq.x + 1.7 * sin(dq.z - uA.y * .23) + uA.y * .5 + uVar.z * 6.)
                    + .25 * sin(dq.y * 1.3 - dq.z * .8 - uA.y * .37 + 1.3 * sin(dq.x * .7));
    float keep = mix(.6, 1., smoothstep(.2, .75, dens)) * mix(1., .55 + .45 * smoothstep(.2, .75, dens), smoothstep(100., 300., dist));
    if (wpx < uMinPx) {
      keep *= clamp(wpx / uMinPx * 3.4, .16, 1.);
      wpx = uMinPx;
    }
    if (hsh > keep) gone = true;
    lpx = max(lpx, uMinPx * 1.25);
    vec2 o;
    if (id < .5) o = hv * lpx * .55;
    else if (id < 1.5) o = -hv * lpx * .3;
    else o = (id < 2.5 ? -1. : 1.) * pv * wpx * .5 - hv * lpx * .32;
    float asp = projectionMatrix[1][1] / projectionMatrix[0][0];
    gl_Position.xy += o * 2. / vec2(uViewH * asp, uViewH) * gl_Position.w;
  }
  if (gone) gl_Position = vec4(2., 2., 2., 1.);
  #include <fog_vertex>
}
`;

const BIRD_FRAG = /* glsl */`
uniform vec3 uInk, uRim;
varying float vGl;
#include <common>
#include <fog_pars_fragment>
void main(){
  gl_FragColor = vec4(uInk + uRim * vGl * .1, 1.);
  #include <fog_fragment>
}
`;

// ------------------------------------------------------------------------------------------
// Wingmen: a few dozen properly modelled starlings that hold station around the camera.
// Positioned in world space from the (smoothed) camera frame, so they bank with it.
// ------------------------------------------------------------------------------------------
const WING_VERT = /* glsl */`
attribute vec4 aOff;     // station in camera frame (right, up, ahead) and phase
attribute float aWing;   // 0 on the body, signed span fraction on the wings
uniform vec3 uCP, uCR, uCU, uCF;
uniform float uTime, uAmt, uShow;
varying float vGl;
#include <common>
#include <fog_pars_vertex>
void main(){
  float ph = aOff.w * 6.2832;
  vec3 st = aOff.xyz + vec3(sin(uTime * .7 + ph * 3.), sin(uTime * .9 + ph * 5.) * .6, sin(uTime * .5 + ph * 7.) * 1.4) * .7;
  st.xy += 2.5 * vec2(sin(uTime * .13 + uShow * .37 + ph * 11.), sin(uTime * .11 + uShow * .29 + ph * 13.)) * min(1., aOff.z * .2);
  st.x += 1.5 * sin(uShow * .21 + ph * 29.);
  st.z *= 1. + .35 * sin(uTime * .09 + uShow * .23 + ph * 17.);
  float stay = clamp((uAmt - aOff.w * .96) * 7., 0., 1.);
  st.xy *= 1. + (1. - stay) * 2.5;
  st.y -= (1. - stay) * (1. - stay) * 22.;
  st.z += (1. - stay) * 16.;
  float fl = sin(uTime * 75.4 + ph * 9.);
  float gl = smoothstep(.45, .7, sin(uTime * 1.7 * (.7 + aOff.w * .6) + ph * 4.));
  float fa = mix(fl * .95 - .1, .16, gl);
  float roll = .35 * sin(uTime * .8 + ph * 2.);
  vec3 q = position;
  float a = fa * (.75 * min(abs(aWing) * 2.2, 1.) + .3 * abs(aWing));
  float sx = sign(aWing);
  // fold the wing about the shoulder
  float sh = .018 * sx;
  float dx = q.x - sh;
  q.x = sh + dx * cos(a);
  q.y += abs(dx) * sin(a);
  q.y += -.012 * fl * (1. - gl) * (1. - min(abs(aWing) * 4., 1.));   // body bobs against the beat
  float cr = cos(roll), sr = sin(roll);
  q.xy = vec2(q.x * cr - q.y * sr, q.x * sr + q.y * cr);
  vec3 wp = uCP + uCR * (st.x + q.x) + uCU * (st.y + q.y) + uCF * (st.z - q.z);
  vGl = .5 * abs(aWing) * max(0., sin(a + .6));
  vec4 mvPosition = viewMatrix * vec4(wp, 1.);
  gl_Position = projectionMatrix * mvPosition;
  if (stay < .002) gl_Position = vec4(2., 2., 2., 1.);
  #include <fog_vertex>
}
`;

// one starling, nose toward -Z, span along X: tapered body, pointed head, fanned tail, two-panel wings
function starlingGeometry() {
  const pos = [], wing = [];
  const tri = (a, b, c, wa = 0, wb = 0, wc = 0) => { pos.push(...a, ...b, ...c); wing.push(wa, wb, wc); };
  // body: beak, 4-point shoulder ring, 4-point rump ring, tail fan
  const beak = [0, 0.004, -0.115];
  const ring = (z, w, h, yo) => [[0, h + yo, z], [w, yo, z], [0, -h * 0.9 + yo, z], [-w, yo, z]];
  const r1 = ring(-0.045, 0.024, 0.022, 0.002), r2 = ring(0.035, 0.019, 0.017, -0.002);
  for (let i = 0; i < 4; i++) {
    const j = (i + 1) % 4;
    tri(beak, r1[j], r1[i]);
    tri(r1[i], r1[j], r2[j]); tri(r1[i], r2[j], r2[i]);
  }
  const tl = [-0.026, -0.002, 0.105], tr = [0.026, -0.002, 0.105];
  tri(r2[0], r2[1], tr); tri(r2[0], tr, tl); tri(r2[0], tl, r2[3]);
  tri(r2[2], tr, r2[1]); tri(r2[2], tl, tr); tri(r2[2], r2[3], tl);
  // wings: triangular starling wing, inner panel + pointed hand, swept back
  for (const s of [-1, 1]) {
    const root0 = [0.018 * s, 0.008, -0.05], root1 = [0.018 * s, 0.006, 0.03];
    const wr0 = [0.085 * s, 0.01, -0.058], wr1 = [0.08 * s, 0.008, 0.022];
    const tip = [0.19 * s, 0.008, 0.012];
    tri(root0, wr0, wr1, 0, 0.45 * s, 0.42 * s); tri(root0, wr1, root1, 0, 0.42 * s, 0);
    tri(wr0, tip, wr1, 0.45 * s, 1 * s, 0.42 * s);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aWing', new THREE.Float32BufferAttribute(wing, 1));
  return g;
}

// peregrine in the stoop: a tucked teardrop with shoulders forward, wing points and tail trailing.
// Nose toward +Z (so lookAt aims it), about 0.5 m long before scaling.
function falconGeometry() {
  const pos = [];
  const prof = [[-0.26, 0.0], [-0.2, 0.022], [-0.1, 0.05], [0.02, 0.075], [0.12, 0.068], [0.2, 0.04], [0.245, 0.016], [0.26, 0.0]];
  const N = 8;
  const pt = (i, k) => {
    const a = (k / N) * Math.PI * 2, [z, r] = prof[i];
    return [Math.cos(a) * r * 1.25, Math.sin(a) * r * 0.8, z];
  };
  for (let i = 0; i < prof.length - 1; i++) for (let k = 0; k < N; k++) {
    const a = pt(i, k), b = pt(i, k + 1), c = pt(i + 1, k + 1), d = pt(i + 1, k);
    if (i > 0) pos.push(...a, ...b, ...c);
    if (i < prof.length - 2) pos.push(...a, ...c, ...d);
  }
  for (const s of [-1, 1]) {
    // folded wing: shoulder knuckle forward, primaries trailing past the tail
    const sh = [0.1 * s, 0.01, 0.13], el = [0.27 * s, 0.0, 0.0], tp = [0.13 * s, 0.012, -0.44], inr = [0.05 * s, 0.03, 0.0];
    pos.push(...sh, ...el, ...inr, ...el, ...tp, ...inr, ...sh, ...inr, ...el, ...el, ...inr, ...tp);
  }
  pos.push(-0.045, 0.01, -0.2, 0.045, 0.01, -0.2, 0.03, 0.012, -0.47, -0.045, 0.01, -0.2, 0.03, 0.012, -0.47, -0.03, 0.012, -0.47);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  return g;
}

// instanced flock geometry: `verts` = 4 for folded quads (nose, tail, left tip, right tip), 3 for darts
function flockGeometry(rng, count, quad) {
  const g = new THREE.InstancedBufferGeometry();
  const ids = quad ? [0, 1, 2, 3] : [0, 2, 3];
  g.setAttribute('position', new THREE.Float32BufferAttribute(ids.flatMap((i) => [i, 0, 0]), 3));
  g.setIndex(quad ? [0, 1, 2, 0, 3, 1] : [0, 1, 2]);
  const sd = new Float32Array(count * 4);
  for (let i = 0; i < sd.length; i++) sd[i] = rng();
  g.setAttribute('aSeed', new THREE.InstancedBufferAttribute(sd, 4));
  g.instanceCount = count;
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 100, 0), 900);
  return g;
}

// ------------------------------------------------------------------------------------------
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('murmuration') : ctx.rng;
  const palette = opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE;
  const ink = new THREE.Color(palette[6]), rim = new THREE.Color(palette[3]);
  const nQuads = Math.max(1000, Math.floor(opts.quads ?? 36000));
  const nDarts = Math.max(1000, Math.floor(opts.darts ?? 70000));
  const nWing = Math.floor(opts.wingmen ?? 90);
  const sunLocal = (opts.sunDir ? opts.sunDir.clone() : new THREE.Vector3(0, 0.03, -1)).normalize();
  const autoplay = opts.autoplay ?? 1, startT = opts.startT ?? 0;
  let viewH = opts.viewportHeight ?? 1080;   // corrected from the render target at draw time (sizeProbe)

  const object = new THREE.Group();
  object.name = 'the-murmuration-hero';
  const stoops = makeStoops(rng);
  for (const s of stoops) { s.dir = s.s.clone().sub(s.a); s.len = s.dir.length(); s.dir.normalize(); }

  // per-seed variety: snake phase and amplitude, lean, hourglass yaw side and lobe balance, band phase
  const uVar = new THREE.Vector4(rng.range(-1, 1), rng.chance(0.5) ? rng.range(0.3, 1) : -rng.range(0.3, 1), rng(), rng());
  const uniforms = {
    ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
    uA: { value: new THREE.Vector4() }, uB: { value: new THREE.Vector4() },
    uVar: { value: uVar },
    uStO: { value: stoops.map((s) => s.s.clone()) }, uStT: { value: [-1, -1] },
    uFA: { value: stoops.map((s) => s.a.clone()) }, uFD: { value: stoops.map((s) => s.dir.clone()) },
    uFL: { value: [new THREE.Vector2(), new THREE.Vector2()] },
    uCam: { value: new THREE.Vector3(0, -9999, 0) },
    uPump: { value: new THREE.Vector3(590, 30, 9) },
    uBubble: { value: 3.2 }, uRare: { value: opts.rare ? 1 : 0 }, uErupt: { value: opts.erupt ? 1 : 0 },
    uViewH: { value: viewH }, uMirror: { value: 1 }, uMinPx: { value: 1.5 }, uNearCull: { value: 0 },
    uSun: { value: new THREE.Vector3(-sunLocal.z, sunLocal.y, sunLocal.x) },
    uInk: { value: ink }, uRim: { value: rim },
  };
  // the 1.5 px minimum needs the height of whatever target is being drawn into (main view or a
  // low-res reflection pass); read it from the renderer at draw time
  const _sz = new THREE.Vector2();
  function sizeProbe(renderer, scene, camera, geometry, material) {
    if (opts.viewportHeight) return;
    const rt = renderer.getRenderTarget();
    const h = rt ? rt.height : renderer.getDrawingBufferSize(_sz).y;
    if (h > 0 && material.uniforms.uViewH.value !== h) { material.uniforms.uViewH.value = h; material.uniformsNeedUpdate = true; }
  }
  const makeMat = (u, vert = BIRD_VERT) => new THREE.ShaderMaterial({
    uniforms: u, vertexShader: vert, fragmentShader: BIRD_FRAG, fog: true, side: THREE.DoubleSide,
  });
  const mat = makeMat(uniforms);
  const addFlock = (count, quad, m, name) => {
    const mesh = new THREE.Mesh(flockGeometry(rng, count, quad), m);
    mesh.frustumCulled = false; mesh.name = name;
    mesh.onBeforeRender = sizeProbe;
    return mesh;
  };
  object.add(addFlock(nQuads, true, mat, 'flock-quads'));
  await ctx.yield?.();
  const dartMat = makeMat({ ...uniforms, uNearCull: { value: opts.dartNearCull ?? 42 }, uViewH: { value: viewH } });
  object.add(addFlock(nDarts, false, dartMat, 'flock-darts'));
  await ctx.yield?.();

  // falcons
  const falconMat = new THREE.MeshBasicMaterial({ color: ink.clone().multiplyScalar(0.8), fog: true, side: THREE.DoubleSide });
  const falconGeo = falconGeometry();
  // cast swap: the same tucked silhouette, broader and half-open for a sparrowhawk or a harrier
  const raptorScale = opts.raptor === 'harrier' ? new THREE.Vector3(2.3, 1, 1.25)
    : opts.raptor === 'sparrowhawk' ? new THREE.Vector3(1.5, 1, 0.9) : new THREE.Vector3(1, 1, 1);
  const falcons = stoops.map((s, i) => {
    const m = new THREE.Mesh(falconGeo, falconMat);
    m.name = 'falcon-' + i; m.visible = false; m.frustumCulled = false; object.add(m);
    return m;
  });

  // wingmen
  let wingMesh = null, wingAmt = 1;
  const wingU = {
    ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
    uCP: { value: new THREE.Vector3() }, uCR: { value: new THREE.Vector3(1, 0, 0) },
    uCU: { value: new THREE.Vector3(0, 1, 0) }, uCF: { value: new THREE.Vector3(0, 0, -1) },
    uTime: { value: 0 }, uAmt: { value: 1 }, uShow: { value: 0 }, uInk: { value: ink }, uRim: { value: rim },
  };
  if (nWing > 0) {
    const base = starlingGeometry();
    const g = new THREE.InstancedBufferGeometry();
    g.setAttribute('position', base.getAttribute('position'));
    g.setAttribute('aWing', base.getAttribute('aWing'));
    const off = new Float32Array(nWing * 4);
    for (let i = 0; i < nWing; i++) {
      // stations 3-8 m out, ahead and to the sides, never dead centre of the view
      let x, y, z, k = 0;
      do {
        const d = i < 36 ? rng.range(3.2, 8) : rng.range(6, 14.5), az = rng.range(-1.05, 1.05), el = rng.range(-0.5, 0.5);
        x = Math.sin(az) * Math.cos(el) * d; y = Math.sin(el) * d - 0.2; z = Math.cos(az) * Math.cos(el) * d;
      } while (Math.hypot(x, y) < 1.0 + 0.12 * z && ++k < 20);
      off.set([x, y, z, (i + 0.5) / nWing], i * 4);
    }
    g.setAttribute('aOff', new THREE.InstancedBufferAttribute(off, 4));
    g.instanceCount = nWing;
    wingMesh = new THREE.Mesh(g, new THREE.ShaderMaterial({
      uniforms: wingU, vertexShader: WING_VERT, fragmentShader: BIRD_FRAG, fog: true, side: THREE.DoubleSide,
    }));
    wingMesh.frustumCulled = false; wingMesh.name = 'wingmen';
    object.add(wingMesh);
  }

  // falcon position in brief space at show time T; returns false when it is not in the air
  const _fa = new THREE.Vector3(), _fb = new THREE.Vector3();
  function falconBrief(i, T, out) {
    const s = stoops[i];
    if (T < s.t0 - 3.2 || T > s.ts + 5) return false;
    if (T < s.t0) {
      const e = (T - (s.t0 - 3.2)) / 3.2, k = e * (0.35 + 0.65 * e);
      out.set(s.a.x - 185, s.a.y + 42, s.a.z + (i ? 6 : -10)).lerp(s.a, k);
      out.y += Math.sin(e * Math.PI) * 10;
    } else if (T < s.ts) {
      out.copy(s.a).addScaledVector(s.dir, 80 * (T - s.t0));
    } else {
      const tau = T - s.ts, tp = 1.2, tq = Math.min(tau, tp);
      out.set(s.s.x + s.dir.x * 80 * tau, s.s.y + s.dir.y * 80 * (tq - tq * tq / (2 * tp)), s.s.z + s.dir.z * 80 * tau);
      if (tau > tp) { const r = tau - tp; out.x += 45 * r; out.y += 7 * r * r; }
    }
    return true;
  }
  function falconAt(i, T, out) {
    if (!falconBrief(i, T, _fa)) return false;
    out.set(_fa.z, _fa.y, 390 - _fa.x);
    return true;
  }

  // ---- anchors -----------------------------------------------------------------------------
  const fly = [
    [0, 0, 2.5, 0], [3, 58, 2.5, 0], [6, 118, 3, 0], [9, 172, 30, 4], [12, 225, 72, 10], [14, 262, 105, 6],
    [16, 298, 160, 0], [17.5, 322, 205, -4], [19, 345, 222, -4], [20.6, 372, 226, -2], [22.2, 400, 215, 0],
    [24, 430, 182, 0], [26.2, 478, 70, 0], [28.5, 530, 22, 0], [31, 585, 25, 0], [32, 610, 34, 0],
    [34, 660, 40, 0], [36, 705, 40, 0], [38, 745, 40, 0], [40, 780, 40, 0],
  ];
  const anchors = {
    portalSeat: { position: L(780, 40, 0), facing: new THREE.Vector3(0, 0, 1) },
    flyThrough: fly.map((f) => L(f[1], f[2], f[3])),
    flyTimes: fly.map((f) => f[0]),
    revealLook: L(670, 70, 0),
    forms: { ribbon: L(300, 14, 0), teardrop: L(323, 172, 0), hourglass: L(670, 70, 0), wave: L(560, 60, 0), torus: L(756, 40, 0) },
    stoop1: L(stoops[0].s.x, stoops[0].s.y, stoops[0].s.z),
    stoop2: L(stoops[1].s.x, stoops[1].s.y, stoops[1].s.z),
    windpump: L(590, 0, 30),
    viewpoints: { reveal: L(372, 226, -2), outside: L(380, 60, -420), low: L(120, 4, -60) },
  };

  // ---- update ------------------------------------------------------------------------------
  let manualT = null, lastCam = null;
  const _c = new THREE.Vector3(), _r = new THREE.Vector3(), _u = new THREE.Vector3(), _f = new THREE.Vector3();
  const _p = new THREE.Vector3(), _q = new THREE.Vector3(), _inv = new THREE.Matrix4();
  const FLOW = 0.036;

  function showTime(time) {
    if (manualT !== null) return manualT;
    return autoplay > 0 ? (startT + time * autoplay) % SHOW_SECONDS : startT;
  }

  function update(dt, time, camera) {
    const T = showTime(time);
    uniforms.uA.value.set(T, time, time * FLOW, torusSpin(T));
    uniforms.uB.value.set(T + FD, time + FD, (time + FD) * FLOW, torusSpin(T + FD));
    for (let i = 0; i < 2; i++) {
      const s = stoops[i];
      uniforms.uStT.value[i] = T - s.ts;
      const hs = smoothstep(s.t0 + 0.5, s.t0 + 1.0, T) * (1 - smoothstep(s.ts + 1.2, s.ts + 3.4, T));
      uniforms.uFL.value[i].set(clamp(80 * (T - s.t0), 0, s.len + 60), hs);
      const m = falcons[i];
      m.visible = falconBrief(i, T, _p);
      if (m.visible) {
        falconBrief(i, Math.min(T + 0.05, s.ts + 5), _q);
        m.position.set(_p.z, _p.y, 390 - _p.x);
        _fb.set(_q.z, _q.y, 390 - _q.x);
        if (_fb.distanceToSquared(m.position) > 1e-6) m.lookAt(object.localToWorld(_fb));
      }
    }
    if (camera) {
      object.updateMatrixWorld();
      camera.getWorldPosition(_c);
      _p.copy(_c).applyMatrix4(_inv.copy(object.matrixWorld).invert());
      uniforms.uCam.value.set(390 - _p.z, _p.y, _p.x);
      // the falcons stay at least ~3 px long however far off they are
      for (const m of falcons) if (m.visible) {
        const d = m.getWorldPosition(_q).distanceTo(_c);
        m.scale.copy(raptorScale).multiplyScalar(Math.max(2.2, d * 0.009));
      }
      // wingmen follow a slightly lagged camera frame (snap when the camera changes or jumps)
      if (wingMesh) {
        const e = camera.matrixWorld.elements;
        _r.set(e[0], e[1], e[2]).normalize(); _u.set(e[4], e[5], e[6]).normalize(); _f.set(-e[8], -e[9], -e[10]).normalize();
        const jump = lastCam !== camera || wingU.uCP.value.distanceToSquared(_c) > 400;
        const k = jump ? 1 : 1 - Math.exp(-Math.min(dt, 0.1) * 5);
        wingU.uCP.value.copy(_c);
        wingU.uCR.value.lerp(_r, k).normalize(); wingU.uCU.value.lerp(_u, k).normalize(); wingU.uCF.value.lerp(_f, k).normalize();
        wingU.uAmt.value = wingAmt;
        wingU.uTime.value = time; wingU.uShow.value = T;
        lastCam = camera;
      }
    }
  }
  update(0, 0, null);

  // mopts: { maskGLSL: GLSL defining `float mirrorMask(vec2 xz)` in local space, > 0 where there is NO
  //          water (reflections are dropped there), maskUniforms: {..}, ink: colour of the reflection }
  function makeMirror(count = 15000, mopts = {}) {
    const u = { ...uniforms, ...(mopts.maskUniforms || {}), uNearCull: { value: 0 }, uMirror: { value: -1 }, uBubble: { value: 0 }, uMinPx: { value: 1.1 }, uViewH: { value: viewH } };
    if (mopts.ink) u.uInk = { value: new THREE.Color(mopts.ink) };
    let vert = BIRD_VERT;
    if (mopts.maskGLSL) {
      vert = vert.replace('//@MIRROR_PARS', mopts.maskGLSL).replace('//@MIRROR_MAIN', `{
        vec3 cl = vec3(uCam.z, uCam.y, 390. - uCam.x);
        vec3 xs = mix(cl, lp, clamp(cl.y / max(cl.y - lp.y, 1e-3), 0., 1.));
        offWater = mirrorMask(xs.xz) > 0.;
      }`);
    }
    const mesh = new THREE.Mesh(flockGeometry(rng, Math.floor(count), false), makeMat(u, vert));
    mesh.frustumCulled = false; mesh.name = 'flock-mirror'; mesh.onBeforeRender = sizeProbe;
    return mesh;
  }

  return {
    object,
    radius: 400, height: 260,
    center: new THREE.Vector3(0, 90, -40),
    anchors, uniforms, showSeconds: SHOW_SECONDS,
    setProgress(u) { manualT = clamp(u, 0, 1) * SHOW_SECONDS; },
    setShowTime(T) { manualT = clamp(T, 0, SHOW_SECONDS); },
    setViewportHeight(h) { if (h > 0) { viewH = h; opts.viewportHeight = h; uniforms.uViewH.value = h; dartMat.uniforms.uViewH.value = h; } },
    setWingmen(a) { wingAmt = clamp(a, 0, 1); },
    makeMirror, falconAt,
    update,
    dispose() { /* everything is reachable from `object`; a mirror mesh belongs to whoever added it */ },
    ground: true, groundY: 0,
  };
}
