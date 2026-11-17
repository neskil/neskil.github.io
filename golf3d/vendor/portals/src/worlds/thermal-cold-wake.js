// The Cold Wake: riding a weather satellite at night over a living false-colour thermal image of the Atlantic.
// Styled world (satellite thermal imagery, built not filtered): returns style 'none' and post.flat = 1, so the
// tone map is skipped and every ramp colour reaches the screen exactly; a little bloom (threshold 1) is kept
// for the foil glints and the portal only, the field itself stays under 1 and never blooms.
//
// MAP OF THIS FILE
//   1. shaders        FOIL_* (the satellite; aKind 4 = the quilted deck: analytic pillow normals turned by the rig's
//                     roll, crinkle facets, stitched seams, glints that slide along creases, Earth-facing facets
//                     flushed with the nadir ramp colour; 0 = other foil; 1 metal, shaded by its albedo (frames near
//                     black, steel dark, rims pale) under a hard key with a cool rim and a thin sheen of the field's
//                     colour; 5 the louvre's slats, which turn in the vertex shader (uLouvre) and carry one wandering
//                     highlight; 6 the radiator plate under them, ember when open; 2 solar panel, 3 cable; uDay lights
//                     the foil fully by day), MIRROR_FRAG (the scan mirror's face and the telescope's objective: both
//                     sample the hero's field; uMir picks which), WING_FRAG (the solar wing's Earth-facing cells, each
//                     a dim mirror of the water under us), PUFF_* (thruster puff), STAR_* (stars).
//   2. schedule       KU.. + hermite(): altitude h and ground-track distance s keyed to u (800 km high pass, the dive
//                     from u 0.10 to 70 km, a skim that sags to 46 km, rise to 430 km; from u 0.68 the Earth's pose is
//                     frozen and the last 211 km are flown for real, straight at the portal, 40 degrees down),
//                     trackB(): the high pass runs 520 km on the shelf side with the gaze crabbed across the stream;
//                     the dive swings onto the stream's axis. THE SLEWING PLATFORM (K_PITCH, K_YAW, K_ROLL) and THE
//                     CRAFT IN FRAME (K_DROP, K_DX, K_DROLL, K_STOW, K_MYAW, K_WING + WING_A/B, SIS_1/2 + crAt()) and
//                     the look-round (K_PANX/Y): no two beats share a framing and no part of the craft is seen in
//                     the same place twice. The table of what each key does and of what is in frame when is beside
//                     the keys.
//   3. build(ctx)     seeded moods (stream / storm / instrument / hour, see "moods"), the hero (src/parts: Earth
//                     cap, cloud shells, limb) placed by poseEarth(), the satellite rig around the camera: a 10.8 m
//                     quilted deck with four stations along it (entry: the mast with its helical antenna, flanged
//                     vents, the louvre with turning slats over a radiator plate, the scan mirror in its fork on a
//                     turntable; low pass: the imager telescope, whose objective shows the loop, and the mast again
//                     from its other side; rise: a strapped propellant tank and a three-bell thruster pod; arrival:
//                     the scan mirror turned to face us and the downlink dish), our own solar wing (three hinged
//                     panels on a yoke, swung down into the top of the frame twice), the sister satellite, thruster
//                     puff, stars, the portal's veil (a depth-only disc that hides the ring until u 0.625-0.64), path, post.
//   4. update()       poseEarth(u, psi) -> hero.object (pose, then the roll about the path axis, which also takes out
//                     the tip a pan gives the horizon); scripted uniforms: uRing[0] + uNeck (the loop's neck narrows
//                     from u 0.30, is a hairline at 0.49 and snaps by 0.52; the picture shows it as it stood 3 s
//                     earlier until a repaint front has passed; the ring then turns and drifts down the shelf so the
//                     rise still frames it), uFront (repaint fronts at u 0.39-0.47, across the loop at 0.43;
//                     0.765-0.815 and 0.84-0.95, each printing 200 km more scar), uStorm / uStorm2 (storm centres),
//                     the rig (hidden while ctx.through: the whole satellite rides the camera), deck drop, station
//                     and roll, mirror nod (twice as far while a front crosses) and yaw, the mast (stands, folds,
//                     swings up), louvre (opens over warm water), the wing's swing and what its cells mirror, the
//                     sister's two passes (u 0.21-0.375 with a glint at 0.315; u 0.71-0.78 with one at 0.75), thruster
//                     puff (u 0.556-0.596), foil fill = the warmest ramp step under and just ahead of the nadir (hot
//                     pink over the stream, indigo over the shelf).
// The path is a level straight 660 unit line (1 unit = 1 km); the Earth group is posed so the level gaze looks
// 25-70 degrees below the local horizon; the one poi is the look-round (K_PANX, K_PANY). Exposure 1, no fog (depth
// comes from the ramp cooling to the limb, the growing pixels and cloud parallax); grade neutral (flat look);
// portal.blendDistance 30 keeps the flat ramp colours right up to the ring.
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import { buildHero, makeThermalUniforms, THERMAL_GLSL, R_EARTH, XP, DW, WAKE_BACK, NECK_X, ycBase, sampleT, rampColors } from '../parts/thermal-cold-wake.js';

const PW = 0.27, PD = 0.16, PH = 0.062;      // deck quilting: pillow width, depth, height (m); mirrored in FOIL_FRAG
const MIR_X = 1.15, MIR_Y = -0.428, MIR_S = 0.62;   // scan mirror: where it stands on the bus, its scale (12% of frame height with its fork)
const BOOM_X = -1.05, BOOM_S = 0.52;                 // antenna mast: its foot (left of the entry station, right of the low pass's) and scale
const LENS_X = -3.4, LENS_Z = -1.38;                 // the imager telescope (the low pass's station)
const POD_X = -4.75;                                 // thruster pod and propellant tank (the rise's station)
const DISH_X = 2.95;                                 // downlink dish (the arrival's station)
const DECK_X0 = -6.7, DECK_NX = 270;                 // the deck runs from x = -6.7 to 4.1 m (0.04 m quads)
const DECK_Y = -0.62, LVX = 0.42, LVZ = -1.33, LX0 = LVX - 0.264, LY0 = DECK_Y + 0.072;   // deck height; louvre centre, first slat pivot (rig m)
const FOIL_VERT = /* glsl */`
attribute vec3 color; attribute float aKind;
uniform float uTime; uniform float uLouvre;
varying vec3 vView; varying vec3 vCol; varying float vKind; varying vec3 vLoc;
void main() {
  vec3 p = position;
  float deck = step(3.5, aKind) * step(aKind, 4.5);
  p.y += deck * 0.004 * sin(uTime * 1.3 + position.x * 9. + position.z * 13.) * sin(uTime * 0.7 + position.x * 4.);
  if (aKind > 4.5 && aKind < 5.5) {
    // the radiator louvre's slats (aKind 5) turn on their own pivots, one every 0.066 m: shut over cold water, open over the stream
    float px = ${LX0.toFixed(3)} + floor((position.x - ${LX0.toFixed(3)}) / 0.066 + 0.5) * 0.066;
    vec2 q = position.xy - vec2(px, ${LY0.toFixed(3)});
    float a = uLouvre * 0.95; float ca = cos(a); float sa = sin(a);
    p.xy = vec2(px, ${LY0.toFixed(3)}) + vec2(ca * q.x - sa * q.y, sa * q.x + ca * q.y);
  }
  vec4 mv = modelViewMatrix * vec4(p, 1.);
  vView = mv.xyz; vCol = color; vKind = aKind; vLoc = position;
  gl_Position = projectionMatrix * mv;
}
`;
const FOIL_FRAG = /* glsl */`
uniform vec3 uKey; uniform vec3 uKeyCol; uniform vec3 uEarth; uniform vec3 uFill; uniform float uGlint; uniform float uTime; uniform float uLimb;
uniform float uDay; uniform float uLouvre; uniform mat3 uRigRot;
varying vec3 vView; varying vec3 vCol; varying float vKind; varying vec3 vLoc;
const float PW = ${PW.toFixed(3)}; const float PD = ${PD.toFixed(3)}; const float PH = ${PH.toFixed(3)};
float fh(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
float h1(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float sq3(float x) { return x * x; }
float hemOf(float z) { float t = clamp((-1.46 - z) / 0.05, 0., 1.); return t * t * (3. - 2. * t); }
// quilted pillow height over the deck (x, z in rig metres), with the slow ripple the vertex shader also applies
float pillow(vec2 p) {
  float fx = abs(sin(3.14159 * p.x / PW)), fz = abs(sin(3.14159 * (p.y + 0.06) / PD));
  return PH * pow(min(fx, fz) * 0.45 + fx * fz * 0.55 + 1e-5, 0.72) * (1. - hemOf(p.y))
    + 0.004 * sin(uTime * 1.3 + p.x * 9. + p.y * 13.) * sin(uTime * 0.7 + p.x * 4.);
}
// nearest crinkle facet: xy = its cell, z = distance to the crease round it (in cells)
vec3 facet(vec2 p, vec2 cs) {
  vec2 g = p / cs; vec2 ip = floor(g); vec2 fp = g - ip; float d1 = 9.; float d2 = 9.; vec2 id = ip;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 o = vec2(float(i), float(j)); vec2 c = ip + o;
    vec2 r = o + vec2(h1(c), h1(c + vec2(31.7, 11.3))) - fp; float dd = dot(r, r);
    if (dd < d1) { d2 = d1; d1 = dd; id = c; } else if (dd < d2) { d2 = dd; }
  }
  return vec3(id, sqrt(d2) - sqrt(d1));
}
void main() {
  vec3 dx = dFdx(vView), dy = dFdy(vView);
  vec3 n = cross(dx, dy); float nl = length(n);
  vec3 N = nl > 1e-12 ? n / nl : vec3(0., 0., 1.);
  vec3 V = normalize(-vView + vec3(0., 0., 1e-5));
  if (dot(N, V) < 0.) N = -N;
  float deck = step(3.5, vKind) * step(vKind, 4.5);
  float foil = max(1. - step(0.5, vKind), deck);
  float occ = 1.; float stitch = 0.; float gl = 0.; float fr = 1.; float flushW = 1.;
  if (deck > 0.5) {
    // the deck is a level plane of the rig, so its normal is built analytically (pillow slope + facet tilt) and then
    // turned into view space by the rig's own roll (uRigRot)
    vec2 p = vLoc.xz; float e = 0.004; float hem = hemOf(p.y);
    float hx = clamp((pillow(p + vec2(e, 0.)) - pillow(p - vec2(e, 0.))) / (2. * e), -1.3, 1.3);
    float hz = clamp((pillow(p + vec2(0., e)) - pillow(p - vec2(0., e))) / (2. * e), -1.3, 1.3);
    float fxs = abs(sin(3.14159 * p.x / PW)), fzs = abs(sin(3.14159 * (p.y + 0.06) / PD));
    float valley = mix(smoothstep(0., 0.3, min(fxs, fzs)), 1., hem);
    vec3 f1 = facet(p, vec2(0.045, 0.06)); vec3 f2 = facet(p + vec2(3.1, 1.7), vec2(0.117, 0.138));
    float ph = h1(f1.xy + vec2(5.3, 9.1)) * 6.283;
    vec2 tl = (vec2(h1(f1.xy + vec2(17., 3.)), h1(f1.xy + vec2(41., 23.))) - 0.5) * 0.84
      + 0.07 * vec2(sin(uTime * 0.9 + ph), cos(uTime * 0.7 + ph))
      + (vec2(h1(f2.xy + vec2(1.5, 0.)), h1(f2.xy + vec2(0., 7.7))) - 0.5) * 0.32;
    N = uRigRot * normalize(vec3(-hx - tl.x, 1., -hz - tl.y));
    // stitched seams: a dark pinched groove with pale thread dashes; one more row where the hem starts
    float ax = abs(fract(p.x / PW + 0.5) - 0.5) * PW, az = abs(fract((p.y + 0.06) / PD + 0.5) - 0.5) * PD;
    float am = mix(min(ax, az), 1., hem); float along = ax < az ? p.y : p.x;
    am = min(am, abs(p.y + 1.455));
    if (abs(p.y + 1.455) < 0.006) along = p.x;
    stitch = (1. - smoothstep(0.002, 0.005, am)) * step(fract(along / 0.03), 0.55);
    occ = mix(0.35, 1., valley) * (1. - 0.5 * (1. - smoothstep(0.003, 0.012, abs(p.y + 1.455))));
    // glints: hard points that slide along the creases between facets
    float crease = 1. - smoothstep(0.04, 0.26, f1.z);
    gl = crease * step(0.9, h1(f1.xy + vec2(71., 13.))) * pow(max(0., sin((p.x * 0.8 + p.y * 0.6) * 46. - uTime * 1.4 + ph)), 9.) * 7. * valley;
    fr = mix(0.45, 1., h1(f1.xy + vec2(3.3, 57.)));
    // where the field's colour may flush the quilt: each pillow's far, Earth-facing slope and the creases
    flushW = max(smoothstep(0.08, 0.6, hz + 0.5 * tl.y), 0.8 * crease);
  } else if (foil > 0.5) {
    vec3 cell = floor(vLoc * 14. + 0.37);
    vec3 jit = vec3(fh(cell), fh(cell + 7.3), fh(cell + 13.1)) - 0.5;
    N = normalize(N + jit * 0.55 + vec3(0., 0., 1e-4));
    fr = 0.5 + 0.5 * fh(cell + 3.1);
  }
  vec3 R = reflect(-V, N);
  float ndl = max(dot(N, uKey), 0.);
  float rk = max(dot(R, uKey), 0.);
  float lobe = rk * rk * rk; lobe *= lobe;                 // rk^6
  float sp = lobe * lobe * lobe; sp *= sp;                 // rk^36
  float E = dot(R, uEarth);
  vec3 col;
  if (foil > 0.5) {
    // gold foil is a tinted mirror: dark where it reflects space, flushed with the field's colour where a facet
    // looks down past the limb at the Earth, bright only in the moon's lobes
    // (the flush is held to the pillows' far slopes and the creases, and at night to 0.6 of its strength, so the
    // quilt stays mostly dark gold with the moon's cool glints and never turns to pink satin over the stream)
    float ea = smoothstep(uLimb + 0.03, uLimb + 0.17, E) * 1.25 * fr * mix(0.7, 1., smoothstep(0., 0.5, E - uLimb))
      * mix(0.6, 1., uDay) * mix(0.15, 1., flushW);
    // (by day, uDay 1, the sun lights it fully: plain sunlit gold with hard white glints)
    col = vCol * occ * (0.075 + mix(0.22, 0.72, uDay) * ndl * uKeyCol) * (1. - 0.6 * min(ea, 1.)) + vec3(1., 0.88, 0.72) * uFill * ea * occ
      + vCol * uKeyCol * (mix(0.6, 1.25, uDay) * lobe + 3. * sp) * occ + uKeyCol * gl * (1. + 1.6 * uDay);
    col = mix(col, 0.5 * uKeyCol * (0.4 + 0.6 * ndl), stitch * 0.6);
  } else {
    float earth = 0.5 + 0.5 * dot(N, uEarth);
    // metal (aKind 1, and the louvre slats, 5): the albedo sets the value (slats and frames near black, steel dark,
    // rims and lips pale), lit hard by the key with almost no flat ambient; a cool rim on grazing faces that scales
    // with the albedo, and a thin sheen of the field's colour on faces that mirror the Earth
    float slat = step(4.5, vKind) * step(vKind, 5.5);
    float metal = step(0.5, vKind) * step(vKind, 1.5) + slat;
    float rim = 1. - max(dot(N, V), 0.); rim = rim * rim * rim;
    float er = smoothstep(uLimb - 0.02, uLimb + 0.2, E);
    float lum = min(0.2 + 2.4 * dot(vCol, vec3(0.333)), 1.2);
    float panel = step(1.5, vKind) * step(vKind, 2.5);
    col = vCol * (uKeyCol * ndl * (0.6 + 0.9 * metal) * (1. - 0.2 * uDay) + uFill * (0.03 + 0.12 * earth) + vec3(0.005, 0.006, 0.01))
      + uKeyCol * sp * (0.25 + 0.95 * metal) * (0.4 + 0.6 * lum) * (1. - panel)
      + metal * (uKeyCol * (0.26 * rim + 0.12 * lobe) * lum + uFill * er * (0.03 + 0.3 * rim));
    // one highlight that wanders along the louvre, slat by slat
    col += slat * uKeyCol * 0.8 * exp(-sq3((vLoc.x - (${LVX.toFixed(3)} + 0.27 * sin(uTime * 0.45))) / 0.04)) * (0.25 + 0.75 * ndl);
    // the radiator plate under the slats (aKind 6): finned, glowing dull ember when the louvre opens to dump heat
    float radp = step(5.5, vKind);
    col = mix(col, vec3(0.9, 0.27, 0.05) * (0.06 + 0.8 * uLouvre) * (0.5 + 0.5 * step(0.5, fract(vLoc.z * 64.))), radp);
    // the sister's solar panels: blue-black cells with a pale grid, and their one glint
    vec2 g = fract(vLoc.xz * vec2(4.2, 5.)); float grid = min(step(g.x, 0.1) + step(g.y, 0.12), 1.);
    // (a flat panel near the mirror angle would be lit from end to end for the whole pass, so the key's own
    // highlight is all but left off them: dark cells flushed with the sea's colour until the one scripted flash)
    col += panel * (vec3(0.012, 0.035, 0.15) * (0.5 + 0.7 * earth) + 0.12 * uFill * earth + vec3(0.08, 0.105, 0.17) * grid + uKeyCol * (0.05 * sp + uGlint * 5.));
  }
  gl_FragColor = vec4(min(col, vec3(3.)), 1.);
}
`;
const MIRROR_FRAG = /* glsl */`
varying vec3 vLoc;
uniform float uNod;
uniform vec4 uMir;   // x: km ahead of the nadir shown at the centre, y: km per metre of glass, z: cell size km, w: 0 = the scan mirror, 1 = the telescope's objective
${THERMAL_GLSL}
void main() {
  // the false-colour sea sliding across the beryllium flat as it nods; in the objective, the water just ahead of us
  vec2 m = uCam + vec2(uMir.x + uNod * 900. - vLoc.y * uMir.y, vLoc.x * uMir.y);
  vec2 q = floor(m / uMir.z) * uMir.z + 0.5 * uMir.z;
  tFw = uMir.z;
  vec3 col = thermalRamp(thermalField(q, uT, uWake.x));
  float r = length(vLoc.xy * vec2(1., 1.5));
  vec3 mir = col * 0.85 + vec3(0.05, 0.06, 0.08) * smoothstep(0.1, 0.17, r);
  // the objective: a deep vignette, two faint coating rings and a pale crescent of the key along its upper left rim
  float rl = length(vLoc.xy) / 0.148;
  vec2 dn = vLoc.xy / max(length(vLoc.xy), 1e-4);
  float cres = smoothstep(0.7, 0.93, rl) * (1. - smoothstep(0.95, 1., rl)) * smoothstep(0.35, 0.95, dot(dn, vec2(-0.64, 0.77)));
  vec3 lens = col * (0.95 - 0.6 * smoothstep(0.55, 1., rl)) * (1. - 0.25 * step(0.5, fract(rl * 2.5 + 0.25)) * step(0.62, rl))
    + vec3(0.42, 0.5, 0.66) * cres;
  gl_FragColor = vec4(mix(mir, lens, uMir.w), 1.);
}
`;
// the solar wing's Earth-facing side: every cell a small dark mirror of the water under us (ramp colours, dimmed
// and cooled), with pale busbars between; the fire lies along it over the stream
const WING_FRAG = /* glsl */`
varying vec3 vLoc;
uniform vec4 uWing;   // xy: our heading on the map, z: km of ground per cell, w: brightness
${THERMAL_GLSL}
void main() {
  vec2 g = vLoc.xz * 8.; vec2 id = floor(g); vec2 f = g - id;
  vec2 hd = uWing.xy;
  vec2 m = uCam + hd * ((id.x + 3.) * uWing.z) + vec2(-hd.y, hd.x) * (id.y * uWing.z * 1.6);
  tFw = uWing.z;
  vec3 fire = thermalRamp(thermalField(m, uT, uWake.x));
  float hs = fract(sin(dot(id, vec2(127.1, 311.7))) * 43758.5453);
  vec3 col = vec3(0.006, 0.012, 0.05) + fire * uWing.w * (0.55 + 0.45 * hs) * (0.35 + 0.65 * smoothstep(0.02, 0.5, f.y));
  float bar = max(1. - step(0.07, f.x), 1. - step(0.09, f.y));
  col = mix(col, vec3(0.085, 0.1, 0.14) + 0.12 * fire * uWing.w, bar);
  // every fourth busbar is a wider collector
  col = mix(col, vec3(0.17, 0.19, 0.24), (1. - step(0.16, f.y)) * step(3.5, mod(id.y + 4., 4.)));
  gl_FragColor = vec4(col, 1.);
}
`;
const MIRROR_VERT = /* glsl */`
varying vec3 vLoc;
void main() { vLoc = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }
`;
const PUFF_VERT = /* glsl */`
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }
`;
const PUFF_FRAG = /* glsl */`
varying vec2 vUv; uniform float uPuff; uniform vec3 uKeyCol;
float ph(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float pn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(ph(i), ph(i + vec2(1., 0.)), f.x), mix(ph(i + vec2(0., 1.)), ph(i + vec2(1., 1.)), f.x), f.y); }
void main() {
  // a cold-gas thruster puff: a soft cone that leaves the nozzle (bottom centre), spreads and thins
  float p = uPuff; vec2 q = vUv - vec2(0.5, 0.06);
  float reach = 0.1 + 0.78 * p; float wd = 0.03 + (0.1 + 0.26 * p) * clamp(q.y / max(reach, 1e-3), 0., 1.);
  float body = (1. - smoothstep(wd * 0.3, wd, abs(q.x))) * smoothstep(0., 0.04, q.y) * (1. - smoothstep(reach * 0.55, reach, q.y));
  float wisp = 0.45 + 0.55 * pn(vec2(q.x * 14., q.y * 9. - p * 6.));
  float a = body * wisp * (1. - p) * (1. - p) * step(0.001, p);
  gl_FragColor = vec4(mix(vec3(0.7, 0.8, 1.), uKeyCol, 0.4) * a * 0.9, 1.);
}
`;
const STAR_VERT = /* glsl */`
attribute float aMag; uniform float uPx; varying float vMag;
void main() {
  vMag = aMag;
  vec4 mv = modelViewMatrix * vec4(position, 1.);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uPx * (1.6 + 1.5 * aMag);
}
`;
const STAR_FRAG = /* glsl */`
uniform float uAmp; varying float vMag;
void main() {
  vec2 d = gl_PointCoord - 0.5; float a = 1. - smoothstep(0.15, 0.5, length(d));
  gl_FragColor = vec4(vec3(0.62, 0.68, 0.85) * (0.25 + 0.6 * vMag) * a * uAmp, 1.);
}
`;

// ---- schedule: u keys of the flight (brief: times are u x 44 s) ----
const KU = [0, 0.10, 0.31, 0.52, 0.68];
const KS = [0, 254, 667, 818, 978], DS = [2540, 2400, 720, 720, 505];       // ground-track km and km per u
const KH = [800, 800, 70, 70, 430], DH = [0, 0, 0, 0, -424];                 // altitude km
const U_FREEZE = 0.68;
function hermite(K, D, u) {
  const x = Math.max(0, Math.min(U_FREEZE, u));
  let i = 0; while (i < KU.length - 2 && x > KU[i + 1]) i++;
  const w = KU[i + 1] - KU[i], t = (x - KU[i]) / w, t2 = t * t, t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * K[i] + (t3 - 2 * t2 + t) * w * D[i] + (-2 * t3 + 3 * t2) * K[i + 1] + (t3 - t2) * w * D[i + 1];
}
const sst = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
// keyed(K, u): K = [u0, v0, u1, v1, ...], eased with smoothstep between neighbours, held outside
function keyed(K, u) {
  if (u <= K[0]) return K[1];
  for (let i = 2; i < K.length; i += 2) if (u < K[i]) { const t = (u - K[i - 2]) / (K[i] - K[i - 2]); return K[i - 1] + (K[i + 1] - K[i - 1]) * t * t * (3 - 2 * t); }
  return K[K.length - 1];
}
// THE SLEWING PLATFORM: the view is never held, and no two beats share a framing.
//   K_PITCH  gaze depression (degrees): 38 at entry; 47 (with K_YAW across the stream) for the tilted plan view of the
//            river; 61 at u 0.16, down the wall with the coast a wedge in the corner; 58-56 over the plan view; 29 as the
//            dive ends (0.34); 25 for THE SKIM (u 0.385-0.44, 46-65 km up: the limb a level line across the top fifth, the
//            neck dead ahead); 41 by 0.472 and 46 on the snap at 0.52 (no limb, so it is never seen edge-on); 46
//            until the bank of the rise begins, 40 for the approach
//   K_ROLL   roll about the path axis (radians): the limb and the stars swing through the corners; level at entry,
//            banked one way over the river (0.085) and the other down the wall (0.13-0.16), level on the skim and the
//            snap; banked on the rise (0.61), level down the scar (0.79), banked again as the gaze comes back (0.83),
//            level at the arrival
//   THE CRAFT IN FRAME. Something of the satellite, or its sister, is in about half of the flight, never the same
//   part in the same place twice, and each swings or slides in over a second or more:
//              u 0-0.07       entry: the deck level across the bottom fifth (mast left, vents, louvre, scan mirror
//                             right), then it banks with the horizon, slides and sinks away to the lower right
//              u 0.21-0.375   the sister satellite: small and far to the lower left (0.25), across the left at a
//                             fifth of the frame wide (0.295), away over the limb upper left (0.34), out over the top
//              u 0.36-0.425   our own solar wing swings down from the top right, the fire mirrored in its cells
//              u 0.41-0.45    the deck rolls up in the lower left corner with the telescope, the eddy in its glass
//              u 0.455-0.50   and rocks over to the lower right corner with the mast and its coil
//              u 0.54-0.60    the rise: the deck banks up lower right with the tank and the thruster pod, which fires
//              u 0.58-0.655   the wing again, from the top left, over black space
//              u 0.71-0.78    the sister crosses the sky upper right, above the limb, and glints
//              u 0.895-1      the arrival: the deck level, the scan mirror lower left, the dish lower right
//   K_DROP   the deck's height in the rig (m; under -0.9 = out of frame), K_DX where along the bus the camera stands
//            (m; changed only while the deck is out of frame, except the slide at entry), K_DROLL the deck's own roll
//   K_WING   how far the wing has swung in (0..1); WING_A / WING_B its two poses (root, tip when in, tip when out, tilt)
//   SIS_1/2  the sister's two passes: u of the first key, u between keys, then the keys (rig metres), Catmull-Rom
//   K_PANX/Y the gaze itself (a poi; radians right / up of the path, before the poi's weight PAN_W). ONE slow
//            look-round: out to the right and a little up by 0.70 (the storm under the limb), one sweep left along
//            the horizon (up at 0.745, the sister in the sky; level down the length of the scar at 0.79), back and
//            down onto the crossing at 0.87 (15 degrees down: no limb, no storm, the ring in the upper quarter),
//            level on the path's axis from 0.935. No turn is faster than about 20 degrees a second.
const K_PITCH = [0, 38, 0.03, 38, 0.09, 47, 0.13, 54, 0.16, 61, 0.21, 58, 0.25, 56, 0.30, 43, 0.34, 29, 0.385, 25, 0.44, 26, 0.472, 41, 0.52, 46, 0.575, 46, 0.61, 43.5, 0.68, 40];
const K_ROLL = [0, 0, 0.03, 0, 0.085, 0.21, 0.13, -0.22, 0.16, -0.38, 0.20, -0.05, 0.27, 0, 0.30, 0, 0.34, 0.14, 0.385, 0, 0.54, 0, 0.575, 0, 0.61, 0.27, 0.67, 0.1, 0.72, 0.03, 0.79, 0, 0.83, 0.2, 0.87, 0.09, 0.935, 0];
const K_DROP = [0, -0.5, 0.016, 0.12, 0.03, 0.12, 0.052, -0.08, 0.078, -1.2, 0.405, -1.2, 0.43, -0.12, 0.4525, -0.6, 0.477, -0.12, 0.507, -1.2, 0.534, -1.2, 0.562, -0.1, 0.578, -0.1, 0.606, -1.2, 0.888, -1.2, 0.922, 0];
const K_DX = [0, 0.2, 0.026, 0.2, 0.06, 1.15, 0.10, 1.15, 0.30, -2.5, 0.435, -2.5, 0.47, -1.95, 0.508, -1.95, 0.534, -5.55, 0.61, -5.55, 0.85, 2.25];
const K_DROLL = [0, 0, 0.028, 0, 0.055, 0.24, 0.075, 0.42, 0.10, 0.42, 0.39, -0.5, 0.405, -0.5, 0.43, -0.35, 0.475, 0.41, 0.503, 0.55, 0.538, 0.5, 0.562, 0.3, 0.578, 0.3, 0.602, 0.45, 0.88, 0.1, 0.93, 0];
const K_WING = [0.356, 0, 0.382, 1, 0.40, 1, 0.426, 0, 0.582, 0, 0.606, 1, 0.63, 1, 0.654, 0];
const WING_A = [2.5, 1.6, -1.7, 1.7, 1.2, -4.3, 1.5, 3.6, -3.0, -0.9];
const WING_B = [-1.9, 1.9, -1.2, -1.5, 1.2, -3.5, -1.6, 3.6, -3.0, 0.7];
const SIS_1 = [0.205, 0.045, -78, -20, -60, -23, -13, -38, -13, -1, -32, -16.3, 11.3, -31.9, -14, 36, -36];
const SIS_2 = [0.70, 0.045, 66, 15, -50, 22, 17, -52, -4, 44, -54];
const PAN_W = 0.6;
const K_PANX = [0.59, 0, 0.705, 0.58, 0.785, -0.75, 0.797, -0.75, 0.864, 0.1, 0.877, 0.1, 0.935, 0];
const K_PANY = [0.59, 0, 0.645, -0.12, 0.705, 0.15, 0.745, 0.27, 0.785, 0.06, 0.82, -0.03, 0.864, -0.58, 0.877, -0.58, 0.935, 0];
const K_YAW = [0, 0, 0.03, 0, 0.09, 0.38, 0.15, 0.38, 0.21, 0, 0.28, 0, 0.34, -0.12, 0.40, 0];   // extra gaze heading (rad): the slew that keeps the river through the centre
const K_STOW = [0.1, 0, 0.3, 1, 0.447, 1, 0.474, 0, 0.484, 0, 0.506, 1];   // the mast: standing at entry, folded flat along the bus after it, swung up as the deck rocks over on the low pass and folded again as it sinks
const K_MYAW = [0, -0.6, 0.6, -0.6, 0.8, 0.6];   // the scan mirror's turntable: it faces the camera from the right (entry) and from the left (arrival)
// a point on a Catmull-Rom curve through keys P = [u0, du, x0, y0, z0, x1, ...] at u (clamped at both ends)
function crAt(P, u, out) {
  const n = (P.length - 2) / 3, f = Math.max(0, Math.min(n - 1 - 1e-6, (u - P[0]) / P[1])), i = Math.floor(f), t = f - i, t2 = t * t, t3 = t2 * t;
  const a = 2 + 3 * Math.max(i - 1, 0), b = 2 + 3 * i, c = 2 + 3 * (i + 1), d = 2 + 3 * Math.min(i + 2, n - 1);
  const w0 = -0.5 * t3 + t2 - 0.5 * t, w1 = 1.5 * t3 - 2.5 * t2 + 1, w2 = -1.5 * t3 + 2 * t2 + 0.5 * t, w3 = 0.5 * t3 - 0.5 * t2;
  return out.set(w0 * P[a] + w1 * P[b] + w2 * P[c] + w3 * P[d], w0 * P[a + 1] + w1 * P[b + 1] + w2 * P[c + 1] + w3 * P[d + 1], w0 * P[a + 2] + w1 * P[b + 2] + w2 * P[c + 2] + w3 * P[d + 2]);
}
const LOW_DIP = 24;                          // the skim: the low pass sags from 70 km to 46 km at u 0.38 and is back at 70 by 0.45
// the ground track and the gaze. High pass: the satellite runs parallel to the stream, 520 km on the shelf side, with
// its gaze crabbed 37 degrees across it, so the river holds its diagonal through the frame; during the dive the track
// swings into the gaze (we fall towards the wall) and both come round onto the stream's axis for the low pass.
// out.b = km right of the map's a axis at along-track distance s, out.psi = gaze heading, radians right of that axis
const TB0 = 520, TS1 = 250, TS2 = 640, TPSI = 0.64, TP1 = 430;
function trackB(s, out) {
  out.b = -TB0 * (1 - sst(TS1, TS2, s)); out.psi = TPSI * (1 - sst(TP1, TS2, s));
  return out;
}

// merges pieces (each non-indexed position/color/aKind) into one geometry, a few at a time so no build step is long
async function mergeParts(ctx, list) {
  let n = 0; for (const g of list) n += g.attributes.position.count;
  const P = new Float32Array(n * 3), C = new Float32Array(n * 3), K = new Float32Array(n);
  let o = 0, k = 0;
  for (const g of list) {
    P.set(g.attributes.position.array, o * 3); C.set(g.attributes.color.array, o * 3); K.set(g.attributes.aKind.array, o);
    o += g.attributes.position.count; g.dispose();
    if (++k % 12 === 0) await ctx.yield();
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(P, 3));
  out.setAttribute('color', new THREE.BufferAttribute(C, 3));
  out.setAttribute('aKind', new THREE.BufferAttribute(K, 1));
  await ctx.yield();
  return out;
}
// a round tube along at(t, out), t in 0..1, as a non-indexed position-only geometry, laid out ring by ring in short
// steps (a TubeGeometry of the same size is one long step: arc lengths, frames and all its faces at once)
async function tubeGeo(ctx, at, segs, radius, radial) {
  const ring = new Float32Array((segs + 1) * radial * 3), p = new THREE.Vector3(), q = new THREE.Vector3(), t = new THREE.Vector3(), n = new THREE.Vector3(), b = new THREE.Vector3();
  for (let i = 0; i <= segs; i++) {
    at(i / segs, p); at(Math.min(1, i / segs + 1e-3), q); at(Math.max(0, i / segs - 1e-3), t);
    t.subVectors(q, t).normalize(); n.set(0, 1, 0).cross(t).normalize(); b.crossVectors(t, n);
    for (let k = 0; k < radial; k++) {
      const a = k / radial * Math.PI * 2, c = Math.cos(a) * radius, sn = Math.sin(a) * radius, o = (i * radial + k) * 3;
      ring[o] = p.x + c * n.x + sn * b.x; ring[o + 1] = p.y + c * n.y + sn * b.y; ring[o + 2] = p.z + c * n.z + sn * b.z;
    }
    if (i % 24 === 23) await ctx.yield();
  }
  const pos = new Float32Array(segs * radial * 18);
  let w = 0;
  const put = (i, k) => { const o = (i * radial + k % radial) * 3; pos[w++] = ring[o]; pos[w++] = ring[o + 1]; pos[w++] = ring[o + 2]; };
  for (let i = 0; i < segs; i++) {
    // (n, b, t) is right-handed, so going round k and then along i winds each face outwards
    for (let k = 0; k < radial; k++) { put(i, k); put(i, k + 1); put(i + 1, k); put(i, k + 1); put(i + 1, k + 1); put(i + 1, k); }
    if (i % 24 === 23) await ctx.yield();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  return g;
}
// geometry helper: any geometry -> non-indexed position/color/aKind, transformed
function piece(geo, hex, kind, mat4) {
  const g = geo.index ? geo.toNonIndexed() : geo;
  for (const k of Object.keys(g.attributes)) if (k !== 'position') g.deleteAttribute(k);   // the shader builds its normals from derivatives
  if (mat4) g.applyMatrix4(mat4);
  const n = g.attributes.position.count, c = new THREE.Color(hex);
  const col = new Float32Array(n * 3), kd = new Float32Array(n);
  for (let i = 0; i < n; i++) { col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; kd[i] = kind; }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setAttribute('aKind', new THREE.BufferAttribute(kd, 1));
  if (geo !== g) geo.dispose();
  return g;
}
const T4 = (x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) =>
  new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(sx, sy, sz));
// deck surface (rig metres): quilted pillows, a flat hem beyond z = -1.46, and a rolled-off far lip. The mesh carries
// about a third of the relief the shader shades, so the pillows' far, Earth-facing slopes stay in view at this grazing angle
const hemJS = (z) => sst(-1.46, -1.51, z);
function deckY(x, z) {
  const fx = Math.abs(Math.sin(Math.PI * x / PW)), fz = Math.abs(Math.sin(Math.PI * (z + 0.06) / PD));
  const lip = sst(-1.56, -1.66, z);
  return DECK_Y + 0.35 * PH * Math.pow(Math.min(fx, fz) * 0.45 + fx * fz * 0.55 + 1e-5, 0.72) * (1 - hemJS(z)) - 0.075 * lip * lip;
}

export default {
  id: 'thermal-cold-wake',
  name: 'The Cold Wake',
  category: 'sky',
  weirdness: 0.5,
  media: ['space'],
  async build(ctx) {
    const rng = ctx.rng;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#030308');

    // ---- moods (seeded): stream shape, storm kind, instrument state, hour ----
    //   stream 0: a tight S (standing meanders, a swing before the scar) with two warm rings and a cold-core ring
    //   stream 1: a ruler-straight jet lined with shingles and one huge warm ring
    //   stream 2: a deep omega: a cold tongue wrapped by the stream, about to close, in the entry view
    const streamKind = rng.int(0, 2), stormKind = rng.int(0, 2), instKind = rng.int(0, 2);
    const hourPick = rng();
    const vary = ctx.vary || {};
    const hour = vary.hour === 'dawn' || vary.hour === 'golden' ? 'dawn' : vary.hour === 'day' ? 'day' : vary.hour === 'night' ? 'night' : (hourPick < 0.62 ? 'night' : hourPick < 0.86 ? 'dawn' : 'day');
    const rare = !!vary.rare;
    const density = vary.density ?? 1;
    const uniforms = makeThermalUniforms();
    const BEND = 70, DN = 100, RING_R = 42;                                       // wall bulge at the neck, loop centre to wall, loop radius (km)
    const shape = streamKind === 0 ? [380, 230, 100] : streamKind === 1 ? [110, 0, 0] : [380, 0, 0];
    uniforms.uShape.value.set(shape[0], shape[1], shape[2], 0);
    uniforms.uVar.value.set(streamKind === 1 ? 0.25 : streamKind === 0 ? 1.3 : 1, streamKind === 1 ? 1.25 : 1, BEND, stormKind === 2 ? 1 : 0);
    const yb = (x) => ycBase(x, BEND, shape);
    const neckY0 = yb(NECK_X);
    const rings = uniforms.uRing.value, neck = uniforms.uNeck.value;
    rings[0].set(NECK_X, neckY0 - DN, RING_R, 0);                                 // the loop whose neck closes
    rings[1].set(330, yb(330) - 250, 62, 0.07);                                   // two finished warm-core rings, sparks off the stream
    rings[2].set(760, yb(760) - 260, 62, 0.07);
    rings[3].set(-230, yb(-230) + 185, 62, 0);                                    // cold-core ring, indigo heart
    if (streamKind === 1) { rings[1].set(290, yb(290) - 380, 140, 0.05); rings[3].set(640, yb(640) + 230, 55, 0); }   // one huge ring
    else if (streamKind === 2) { rings[3].set(-1150, yb(-1150) + 135, 90, 26); }  // the omega: a cold tongue on a 52 km channel
    neck.set(14, DN + 30, 220, 0);
    const stormSize = [1.2, 1.25, 1.3][stormKind];
    uniforms.uWake.value.set(630, 0, [0.8, 1.15, 1.15][stormKind], [1, 0.85, 0.7][stormKind]);
    // dropped rows only on the noisy instrument (a few indigo runs over the cold water, each ending in a teal tick),
    // which also stripes faintly; the clean and the striping instruments drop none; no gore on any (it read as a crack)
    uniforms.uInst.value.set(instKind === 1 ? 0.0006 * density : 0, 0, instKind === 2 ? 1 : instKind === 1 ? 0.5 : 0, 0);
    uniforms.uStorm.value.set(0, 0, stormSize, stormKind);
    uniforms.uStorm2.value.set(0, 0, rare ? 0.9 : 0, 0);
    const ramp = rampColors();
    await ctx.yield();

    // ---- the hero: the Earth cap with the river of fire, cloud shells, limb ----
    const hero = await buildHero(ctx, { uniforms });
    scene.add(hero.object);
    await ctx.yield();

    // ---- hour: only the real things change (key light on the foil, stars, a sunrise hairline on the limb) ----
    const keyCol = new THREE.Color(hour === 'night' ? '#BFD0FF' : hour === 'dawn' ? '#FFC46A' : '#FFF6E8').multiplyScalar(hour === 'day' ? 1.15 : 1);
    const foilU = {
      uTime: { value: 0 }, uKey: { value: new THREE.Vector3(-0.55, 0.57, 0.6).normalize() }, uKeyCol: { value: keyCol },
      uEarth: { value: new THREE.Vector3(0, -0.77, -0.64) }, uFill: { value: new THREE.Color(0.02, 0.02, 0.2) }, uGlint: { value: 0 }, uLimb: { value: 0.46 },
      uDay: { value: hour === 'day' ? 1 : hour === 'dawn' ? 0.4 : 0 }, uLouvre: { value: 0 }, uRigRot: { value: new THREE.Matrix3() },
    };
    const foilMat = new THREE.ShaderMaterial({ uniforms: foilU, vertexShader: FOIL_VERT, fragmentShader: FOIL_FRAG });
    if (hour === 'dawn') hero.uDawn.value.set(-0.98, 0.1, 0.17).normalize().multiplyScalar(1);

    // ---- the satellite, built around the camera (rig space = camera space: -Z ahead, +Y up) ----
    const rig = new THREE.Group();
    const deckG = new THREE.Group(); deckG.position.y = -0.08; rig.add(deckG);    // the deck fills the bottom 13% of frame
    const GOLD = '#FFCE76', GOLD2 = '#D9A23A', DARK = '#0B0C10', GREY = '#666C78', STEEL = '#262A32', PALE = '#B4BCCA';
    const parts = [], mountParts = [];
    const lensAxis = new THREE.Vector3(0.34, 0.5, 0.8).normalize(), lensC = new THREE.Vector3(LENS_X, DECK_Y + 0.27, LENS_Z);
    const lensT = new THREE.Vector3(lensAxis.z, 0, -lensAxis.x).normalize();    // the trunnion axis: level, across the barrel
    {
      // quilted, crinkled foil deck: the edge of the bus across the bottom of the frame (shaded analytically, aKind 4)
      // (10.8 x 1.1 m, 270 x 28 quads: four camera stations along it, see K_DX; deep enough behind the edge that a rolled deck shows no back; laid out
      // triangle by triangle in short steps, as a PlaneGeometry would be, so no step of the build is long)
      const NX = DECK_NX, NZ = 28, nz = ctx.noise, hgt = new Float32Array((NX + 1) * (NZ + 1));
      const gx = (ix) => Math.fround(ix * 0.04 + DECK_X0), gz = (iz) => Math.fround(iz * (1.1 / NZ) - 0.55) - 1.11;
      for (let iz = 0; iz <= NZ; iz++) {
        for (let ix = 0; ix <= NX; ix++) { const x = gx(ix), z = gz(iz); hgt[iz * (NX + 1) + ix] = deckY(x, z) + 0.004 * nz.n2(x * 21, z * 21); }
        if (iz % 2 === 1) await ctx.yield();
      }
      await ctx.yield();
      const dpos = new Float32Array(NX * NZ * 18);
      let dq = 0;
      const dv = (ix, iz) => { dpos[dq++] = gx(ix); dpos[dq++] = hgt[iz * (NX + 1) + ix]; dpos[dq++] = gz(iz); };
      for (let iz = 0; iz < NZ; iz++) {
        for (let ix = 0; ix < NX; ix++) { dv(ix, iz); dv(ix, iz + 1); dv(ix + 1, iz); dv(ix, iz + 1); dv(ix + 1, iz + 1); dv(ix + 1, iz); }
        if (iz % 4 === 3) await ctx.yield();
      }
      const dgn = new THREE.BufferGeometry();
      dgn.setAttribute('position', new THREE.BufferAttribute(dpos, 3));
      await ctx.yield();
      parts.push(piece(dgn, GOLD, 4, null));
      await ctx.yield();
      // the hem: two bolt rows, a grey cable loom with clamps between them, and the edge rail
      for (let i = 0; i < 85; i++) {
        const x = -6.55 + i * 0.1256;
        parts.push(piece(new THREE.CylinderGeometry(0.011, 0.013, 0.014, 6), GREY, 1, T4(x, deckY(x, -1.618) + 0.006, -1.618)));
        if (i % 2 === 0) parts.push(piece(new THREE.CylinderGeometry(0.012, 0.014, 0.012, 6), PALE, 1, T4(x + 0.03, deckY(x, -1.528) + 0.005, -1.528)));
        if (i % 4 === 3) await ctx.yield();
      }
      parts.push(piece(new THREE.CylinderGeometry(0.014, 0.014, 10.8, 8), STEEL, 1, T4(-1.3, DECK_Y - 0.075, -1.66, 0, 0, Math.PI / 2)));
      await ctx.yield();
      for (let c = 0; c < 3; c++) {
        const pts = [];
        for (let i = 0; i <= 55; i++) { const x = -6.67 + i * 0.196; pts.push(new THREE.Vector3(x, DECK_Y + 0.009 + 0.004 * Math.sin(i * 1.7 + c), -1.572 + c * 0.016 + 0.012 * Math.sin(i * 0.63 + c * 0.4))); }
        await ctx.yield();
        const cc = new THREE.CatmullRomCurve3(pts);
        const cable = await tubeGeo(ctx, (t, out) => cc.getPoint(t, out), 128, 0.0075, 6);
        await ctx.yield();
        parts.push(piece(cable, c === 1 ? '#5B6068' : GREY, 3, null));
        await ctx.yield();
      }
      for (let i = 0; i < 18; i++) parts.push(piece(new THREE.BoxGeometry(0.03, 0.024, 0.07), STEEL, 1, T4(-6.5 + i * 0.62, DECK_Y + 0.012, -1.556)));
      await ctx.yield();
      // black radiator louvre: a bevelled steel frame let into the quilting, a finned radiator plate, and nine
      // near-black slats (aKind 5: they turn in the vertex shader), each with a pale lip that catches the key
      const lx = LVX, lz = LVZ;
      parts.push(piece(new THREE.BoxGeometry(0.64, 0.05, 0.22), DARK, 1, T4(lx, DECK_Y + 0.012, lz)));
      parts.push(piece(new THREE.BoxGeometry(0.6, 0.004, 0.19), '#2A0E05', 6, T4(lx, DECK_Y + 0.041, lz)));
      for (const sz of [-1, 1]) {
        parts.push(piece(new THREE.BoxGeometry(0.66, 0.022, 0.016), GREY, 1, T4(lx, DECK_Y + 0.05, lz + sz * 0.108, sz * 0.5, 0, 0)));
        for (let i = 0; i < 9; i++) parts.push(piece(new THREE.CylinderGeometry(0.006, 0.006, 0.012, 6), PALE, 1, T4(lx - 0.264 + i * 0.066, DECK_Y + 0.066, lz + sz * 0.1, Math.PI / 2)));
        await ctx.yield();
      }
      for (let i = 0; i < 9; i++) {
        const sx = lx - 0.264 + i * 0.066;
        parts.push(piece(new THREE.BoxGeometry(0.054, 0.004, 0.18), '#090A0F', 5, T4(sx, LY0, lz, 0, 0, 0.22)));
        parts.push(piece(new THREE.BoxGeometry(0.008, 0.007, 0.184), PALE, 5, T4(sx + 0.0263, LY0 + 0.0059, lz, 0, 0, 0.22)));
        if (i % 3 === 2) await ctx.yield();
      }
      for (const sx of [-1, 1]) {
        parts.push(piece(new THREE.BoxGeometry(0.016, 0.05, 0.236), STEEL, 1, T4(lx + sx * 0.322, DECK_Y + 0.045, lz)));
        parts.push(piece(new THREE.BoxGeometry(0.022, 0.008, 0.24), PALE, 1, T4(lx + sx * 0.322, DECK_Y + 0.073, lz)));
      }
      await ctx.yield();
      // vent holes: dark throats in flanged collars standing through the foil, bright rolled rims, three bolts each
      for (let i = 0; i < 5; i++) {
        const vx = -0.42 + i * 0.105, vz = -1.29 - (i % 2) * 0.09;
        parts.push(piece(new THREE.CylinderGeometry(0.046, 0.05, 0.008, 14), GREY, 1, T4(vx, DECK_Y + 0.012, vz)));
        parts.push(piece(new THREE.CylinderGeometry(0.027, 0.034, 0.07, 14, 1, true), STEEL, 1, T4(vx, DECK_Y + 0.045, vz)));
        parts.push(piece(new THREE.TorusGeometry(0.036, 0.004, 5, 14), GREY, 1, T4(vx, DECK_Y + 0.03, vz, Math.PI / 2)));
        parts.push(piece(new THREE.TorusGeometry(0.0275, 0.0075, 6, 16), PALE, 1, T4(vx, DECK_Y + 0.08, vz, Math.PI / 2)));
        parts.push(piece(new THREE.CylinderGeometry(0.023, 0.023, 0.004, 12), '#020203', 1, T4(vx, DECK_Y + 0.072, vz)));
        for (let k = 0; k < 3; k++) { const ba = k * 2.094 + i; parts.push(piece(new THREE.CylinderGeometry(0.005, 0.005, 0.008, 5), PALE, 1, T4(vx + Math.cos(ba) * 0.041, DECK_Y + 0.019, vz + Math.sin(ba) * 0.041))); }
        await ctx.yield();
      }
      await ctx.yield();
      // scan-mirror mount: a low turntable and a fork that holds the mirror by its two side trunnions, so the whole
      // face is clear (the mirror itself nods on its own group). The mount is a mesh of its own in the group that
      // yaws (K_MYAW): the turntable turns the mirror to face the camera at whichever station it stands
      const F4 = T4;
      mountParts.push(piece(new THREE.CylinderGeometry(0.1, 0.12, 0.03, 18), STEEL, 1, F4(0, -0.262, 0)));
      mountParts.push(piece(new THREE.CylinderGeometry(0.075, 0.09, 0.03, 18), GREY, 1, F4(0, -0.236, 0)));
      mountParts.push(piece(new THREE.TorusGeometry(0.1, 0.006, 5, 20), PALE, 1, F4(0, -0.247, 0, Math.PI / 2)));
      mountParts.push(piece(new THREE.BoxGeometry(0.58, 0.026, 0.06), STEEL, 1, F4(0, -0.212, 0)));
      mountParts.push(piece(new THREE.BoxGeometry(0.5, 0.008, 0.066), PALE, 1, F4(0, -0.197, 0)));
      for (const sx of [-1, 1]) {
        mountParts.push(piece(new THREE.BoxGeometry(0.026, 0.2, 0.05), STEEL, 1, F4(sx * 0.277, -0.11, 0)));
        mountParts.push(piece(new THREE.BoxGeometry(0.008, 0.2, 0.056), PALE, 1, F4(sx * 0.293, -0.11, 0)));
        mountParts.push(piece(new THREE.BoxGeometry(0.07, 0.022, 0.04), STEEL, 1, F4(sx * 0.25, -0.185, 0, 0, 0, sx * 0.75)));
        mountParts.push(piece(new THREE.CylinderGeometry(0.034, 0.034, 0.036, 12), STEEL, 1, F4(sx * 0.277, 0, 0, 0, 0, Math.PI / 2)));
        mountParts.push(piece(new THREE.CylinderGeometry(0.02, 0.02, 0.05, 10), PALE, 1, F4(sx * 0.283, 0, 0, 0, 0, Math.PI / 2)));
        await ctx.yield();
      }
      await ctx.yield();
      // boom foot: a bolted flange, a short socket with four gussets, and the hinge clevis with its pin
      const bx = BOOM_X, bz = -1.4;
      parts.push(piece(new THREE.CylinderGeometry(0.085, 0.092, 0.012, 16), GREY, 1, T4(bx, DECK_Y + 0.016, bz)));
      parts.push(piece(new THREE.CylinderGeometry(0.036, 0.05, 0.05, 12), STEEL, 1, T4(bx, DECK_Y + 0.045, bz)));
      parts.push(piece(new THREE.TorusGeometry(0.037, 0.006, 5, 14), PALE, 1, T4(bx, DECK_Y + 0.07, bz, Math.PI / 2)));
      await ctx.yield();
      for (let k = 0; k < 4; k++) {
        const ga = k * Math.PI / 2 + 0.6;
        parts.push(piece(new THREE.BoxGeometry(0.05, 0.034, 0.006), GREY, 1, T4(bx + Math.cos(ga) * 0.055, DECK_Y + 0.036, bz - Math.sin(ga) * 0.055, 0, ga, -0.6)));
      }
      for (let k = 0; k < 6; k++) { const ba = k * 1.047; parts.push(piece(new THREE.CylinderGeometry(0.007, 0.007, 0.01, 6), PALE, 1, T4(bx + Math.cos(ba) * 0.072, DECK_Y + 0.026, bz + Math.sin(ba) * 0.072))); }
      await ctx.yield();
      for (const sx of [-1, 1]) parts.push(piece(new THREE.BoxGeometry(0.008, 0.05, 0.04), GREY, 1, T4(bx + sx * 0.03, DECK_Y + 0.062, bz)));
      parts.push(piece(new THREE.CylinderGeometry(0.009, 0.009, 0.086, 8), PALE, 1, T4(bx, DECK_Y + 0.062, bz, 0, 0, Math.PI / 2)));
      // the rise's station (far port): a propellant tank half sunk in the quilt under two crossed straps, its feed line,
      // and a thruster pod on a bolted bracket: three canted bells with dark throats; the nearest one fires
      {
        const tx = POD_X - 0.36, tz = -1.3;
        parts.push(piece(new THREE.SphereGeometry(0.17, 20, 12), GOLD2, 0, T4(tx, DECK_Y + 0.05, tz)));
        parts.push(piece(new THREE.TorusGeometry(0.174, 0.009, 6, 28), STEEL, 1, T4(tx, DECK_Y + 0.05, tz, 0, 0.5, 0)));
        parts.push(piece(new THREE.TorusGeometry(0.174, 0.009, 6, 28), STEEL, 1, T4(tx, DECK_Y + 0.05, tz, 0, -1.07, 0)));
        parts.push(piece(new THREE.CylinderGeometry(0.03, 0.036, 0.03, 10), PALE, 1, T4(tx, DECK_Y + 0.232, tz)));
        parts.push(piece(new THREE.CylinderGeometry(0.014, 0.014, 0.05, 8), GREY, 1, T4(tx, DECK_Y + 0.27, tz)));
        parts.push(piece(new THREE.TorusGeometry(0.2, 0.012, 6, 28), GREY, 1, T4(tx, DECK_Y + 0.012, tz, Math.PI / 2)));
        await ctx.yield();
        parts.push(piece(new THREE.CylinderGeometry(0.011, 0.011, 0.24, 6), GREY, 1, T4(POD_X - 0.16, DECK_Y + 0.06, -1.36, 0, -0.35, Math.PI / 2)));
        parts.push(piece(new THREE.BoxGeometry(0.22, 0.09, 0.17), STEEL, 1, T4(POD_X, DECK_Y + 0.05, -1.4)));
        parts.push(piece(new THREE.BoxGeometry(0.24, 0.01, 0.19), PALE, 1, T4(POD_X, DECK_Y + 0.099, -1.4)));
        parts.push(piece(new THREE.BoxGeometry(0.26, 0.012, 0.21), GREY, 1, T4(POD_X, DECK_Y + 0.008, -1.4)));
        for (let k = 0; k < 4; k++) parts.push(piece(new THREE.CylinderGeometry(0.008, 0.008, 0.012, 6), PALE, 1, T4(POD_X + (k % 2 ? 0.115 : -0.115), DECK_Y + 0.02, -1.4 + (k < 2 ? 0.09 : -0.09))));
        const NZL = [[-0.055, -1.38, -0.25, 0.4], [0.06, -1.37, -0.25, -0.45], [0.0, -1.46, -0.8, 0]];
        for (const [ox, oz, rx, rz] of NZL) {
          const NM = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(rx, 0, rz)).setPosition(POD_X + ox, DECK_Y + 0.105, oz);
          parts.push(piece(new THREE.CylinderGeometry(0.016, 0.02, 0.03, 10), STEEL, 1, NM.clone().multiply(T4(0, 0.012, 0))));
          parts.push(piece(new THREE.CylinderGeometry(0.04, 0.014, 0.075, 14, 1, true), PALE, 1, NM.clone().multiply(T4(0, 0.062, 0))));
          parts.push(piece(new THREE.CylinderGeometry(0.036, 0.012, 0.07, 14, 1, true), '#17110C', 1, NM.clone().multiply(T4(0, 0.063, 0, 0, 0, 0, -1, 1, 1))));
          parts.push(piece(new THREE.TorusGeometry(0.04, 0.004, 5, 16), PALE, 1, NM.clone().multiply(T4(0, 0.1, 0, Math.PI / 2))));
        }
        await ctx.yield();
      }
      // the arrival's station (starboard): a small downlink dish on a short mast, tipped back at the Earth ahead,
      // its feed held on three struts; a junction box and its conduit run to the hem
      {
        const DM = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(-0.95, -0.35, 0)).setPosition(DISH_X, DECK_Y + 0.21, -1.36);
        const D4 = (...a) => DM.clone().multiply(T4(...a));
        parts.push(piece(new THREE.CylinderGeometry(0.06, 0.07, 0.012, 14), GREY, 1, T4(DISH_X, DECK_Y + 0.016, -1.36)));
        parts.push(piece(new THREE.CylinderGeometry(0.016, 0.022, 0.19, 8), STEEL, 1, T4(DISH_X, DECK_Y + 0.11, -1.36)));
        parts.push(piece(new THREE.SphereGeometry(0.03, 10, 6), GREY, 1, T4(DISH_X, DECK_Y + 0.2, -1.36)));
        for (let k = 0; k < 4; k++) { const ba = k * Math.PI / 2 + 0.4; parts.push(piece(new THREE.CylinderGeometry(0.006, 0.006, 0.01, 6), PALE, 1, T4(DISH_X + Math.cos(ba) * 0.047, DECK_Y + 0.025, -1.36 + Math.sin(ba) * 0.047))); }
        await ctx.yield();
        // the bowl: a shallow open cone (apex at the hub, mouth towards +Y of the dish frame), pale outside, with a rolled rim
        parts.push(piece(new THREE.ConeGeometry(0.17, 0.06, 24, 2, true), '#C9CED6', 1, D4(0, 0.04, 0, Math.PI)));
        parts.push(piece(new THREE.TorusGeometry(0.17, 0.006, 5, 24), PALE, 1, D4(0, 0.07, 0, Math.PI / 2)));
        parts.push(piece(new THREE.CylinderGeometry(0.022, 0.03, 0.02, 10), STEEL, 1, D4(0, 0.016, 0)));
        await ctx.yield();
        for (let k = 0; k < 3; k++) {
          const ba = k * 2.094 + 0.5, cx = Math.cos(ba), sz = Math.sin(ba);
          // strut from the rim (0.16 out, 0.07 up) to the feed (on the axis, 0.2 up): length 0.206, leaning in
          parts.push(piece(new THREE.CylinderGeometry(0.004, 0.004, 0.206, 5), GREY, 1, D4(cx * 0.08, 0.135, sz * 0.08, 0, -ba, 0.888)));
        }
        parts.push(piece(new THREE.CylinderGeometry(0.014, 0.02, 0.035, 8), DARK, 1, D4(0, 0.2, 0)));
        parts.push(piece(new THREE.CylinderGeometry(0.021, 0.021, 0.006, 8), PALE, 1, D4(0, 0.182, 0)));
        await ctx.yield();
        parts.push(piece(new THREE.BoxGeometry(0.16, 0.05, 0.1), STEEL, 1, T4(DISH_X + 0.34, DECK_Y + 0.03, -1.3, 0, 0.2, 0)));
        parts.push(piece(new THREE.BoxGeometry(0.17, 0.006, 0.11), PALE, 1, T4(DISH_X + 0.34, DECK_Y + 0.058, -1.3, 0, 0.2, 0)));
        parts.push(piece(new THREE.CylinderGeometry(0.008, 0.008, 0.26, 6), GREY, 1, T4(DISH_X + 0.34, DECK_Y + 0.014, -1.45, Math.PI / 2, 0, 0)));
        await ctx.yield();
      }
      // the low pass's station (port): the imager, a foil-wrapped telescope barrel in a fork, tipped back so that its
      // objective looks past us: pedestal, cheeks and trunnions, straps, a black hood with a pale rolled rim, a finder
      {
        const lc = lensC, t = lensT, ry = Math.atan2(-t.z, t.x);
        const LM = new THREE.Matrix4().compose(lc, new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), lensAxis), new THREE.Vector3(1, 1, 1));
        const L4 = (...a) => LM.clone().multiply(T4(...a));
        parts.push(piece(new THREE.CylinderGeometry(0.2, 0.22, 0.016, 22), GREY, 1, T4(LENS_X, DECK_Y + 0.014, LENS_Z)));
        for (let k = 0; k < 8; k++) { const ba = k * 0.785 + 0.3; parts.push(piece(new THREE.CylinderGeometry(0.007, 0.007, 0.012, 6), PALE, 1, T4(LENS_X + Math.cos(ba) * 0.195, DECK_Y + 0.026, LENS_Z + Math.sin(ba) * 0.195))); }
        parts.push(piece(new THREE.CylinderGeometry(0.07, 0.1, 0.05, 16), STEEL, 1, T4(LENS_X, DECK_Y + 0.045, LENS_Z)));
        parts.push(piece(new THREE.BoxGeometry(0.44, 0.03, 0.09), STEEL, 1, T4(LENS_X, DECK_Y + 0.075, LENS_Z, 0, ry, 0)));
        parts.push(piece(new THREE.BoxGeometry(0.4, 0.008, 0.096), PALE, 1, T4(LENS_X, DECK_Y + 0.093, LENS_Z, 0, ry, 0)));
        await ctx.yield();
        for (const sx of [-1, 1]) {
          const cx = lc.x + t.x * 0.2 * sx, cz = lc.z + t.z * 0.2 * sx;
          parts.push(piece(new THREE.BoxGeometry(0.024, 0.22, 0.08), STEEL, 1, T4(cx, lc.y - 0.085, cz, 0, ry, 0)));
          parts.push(piece(new THREE.BoxGeometry(0.008, 0.22, 0.088), PALE, 1, T4(cx + t.x * 0.015 * sx, lc.y - 0.085, cz + t.z * 0.015 * sx, 0, ry, 0)));
          parts.push(piece(new THREE.CylinderGeometry(0.045, 0.045, 0.04, 14), STEEL, 1, T4(cx, lc.y, cz, 0, ry, Math.PI / 2)));
          parts.push(piece(new THREE.CylinderGeometry(0.024, 0.024, 0.06, 10), PALE, 1, T4(cx, lc.y, cz, 0, ry, Math.PI / 2)));
        }
        await ctx.yield();
        parts.push(piece(new THREE.CylinderGeometry(0.15, 0.15, 0.36, 30, 4), GOLD, 0, L4(0, 0, 0)));
        parts.push(piece(new THREE.CylinderGeometry(0.15, 0.1, 0.06, 24), STEEL, 1, L4(0, -0.21, 0)));
        parts.push(piece(new THREE.BoxGeometry(0.15, 0.09, 0.15), DARK, 1, L4(0, -0.27, 0)));
        parts.push(piece(new THREE.BoxGeometry(0.16, 0.008, 0.16), PALE, 1, L4(0, -0.318, 0)));
        for (const sy of [-0.1, 0.08]) parts.push(piece(new THREE.TorusGeometry(0.153, 0.007, 5, 30), STEEL, 1, L4(0, sy, 0, Math.PI / 2)));
        await ctx.yield();
        parts.push(piece(new THREE.CylinderGeometry(0.172, 0.158, 0.13, 30, 1, true), '#0C0D11', 1, L4(0, 0.235, 0)));
        parts.push(piece(new THREE.CylinderGeometry(0.166, 0.15, 0.13, 30, 1, true), '#050507', 1, L4(0, 0.235, 0, 0, 0, 0, -1, 1, 1)));
        parts.push(piece(new THREE.TorusGeometry(0.17, 0.008, 6, 34), PALE, 1, L4(0, 0.3, 0, Math.PI / 2)));
        parts.push(piece(new THREE.TorusGeometry(0.142, 0.007, 5, 30), '#30343C', 1, L4(0, 0.2, 0, Math.PI / 2)));
        await ctx.yield();
        // finder scope along the top of the barrel, and a cable down to the deck
        parts.push(piece(new THREE.CylinderGeometry(0.026, 0.026, 0.24, 10), GREY, 1, L4(0, 0.04, -0.19)));
        parts.push(piece(new THREE.TorusGeometry(0.027, 0.005, 5, 12), PALE, 1, L4(0, 0.16, -0.19, Math.PI / 2)));
        parts.push(piece(new THREE.CylinderGeometry(0.02, 0.02, 0.004, 10), '#020203', 1, L4(0, 0.161, -0.19)));
        for (const sy of [-0.05, 0.12]) parts.push(piece(new THREE.BoxGeometry(0.02, 0.014, 0.05), STEEL, 1, L4(0, sy, -0.165)));
        await ctx.yield();
      }
    }
    const bus = new THREE.Mesh(await mergeParts(ctx, parts), foilMat);
    bus.frustumCulled = false; deckG.add(bus);
    await ctx.yield();

    // scan mirror: an elliptical beryllium face inside a black stepped baffle, nodding 9 degrees and back every 2 s
    const mirrorYaw = new THREE.Group();
    mirrorYaw.position.set(MIR_X, MIR_Y, -1.47); mirrorYaw.scale.setScalar(MIR_S); mirrorYaw.rotation.y = -0.6;
    const mount = new THREE.Mesh(await mergeParts(ctx, mountParts), foilMat);
    mount.frustumCulled = false; mirrorYaw.add(mount);
    await ctx.yield();
    const mirror = new THREE.Group();                                       // nods about the trunnion axis, inside the yawing group
    {
      const bp = [];
      for (let k = 0; k < 3; k++) { bp.push(piece(new THREE.TorusGeometry(0.175 + k * 0.022, 0.011, 6, 28), k === 1 ? '#22252C' : '#0C0D11', 1, T4(0, 0, 0.012 + k * 0.022, 0, 0, 0, 1, 0.67, 1))); await ctx.yield(); }
      bp.push(piece(new THREE.CylinderGeometry(0.2, 0.2, 0.02, 28), '#0A0B0E', 1, T4(0, 0, -0.016, Math.PI / 2, 0, 0, 1, 1, 0.67)));
      for (const sx of [-1, 1]) bp.push(piece(new THREE.CylinderGeometry(0.013, 0.013, 0.08, 8), GREY, 1, T4(sx * 0.235, 0, 0, 0, 0, Math.PI / 2)));   // side trunnions, into the fork's bearings
      await ctx.yield();
      const baffle = new THREE.Mesh(await mergeParts(ctx, bp), foilMat);
      const fg = new THREE.CircleGeometry(0.168, 40); fg.scale(1, 0.67, 1);
      const face = new THREE.Mesh(fg, new THREE.ShaderMaterial({ uniforms: { ...uniforms, uNod: { value: 0 }, uMir: { value: new THREE.Vector4(260, 1500, 6, 0) } }, vertexShader: MIRROR_VERT, fragmentShader: MIRROR_FRAG }));
      mirror.add(baffle, face); mirror.userData.face = face;
    }
    mirrorYaw.add(mirror); deckG.add(mirrorYaw);
    await ctx.yield();
    // the telescope's objective: the water 105 km ahead of the nadir, which on the low pass is the loop itself
    const glass = new THREE.Mesh(new THREE.CircleGeometry(0.148, 40), new THREE.ShaderMaterial({ uniforms: { ...uniforms, uNod: { value: 0 }, uMir: { value: new THREE.Vector4(105, 900, 3, 1) } }, vertexShader: MIRROR_VERT, fragmentShader: MIRROR_FRAG }));
    glass.position.copy(lensC).addScaledVector(lensAxis, 0.186); glass.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), lensAxis);
    deckG.add(glass);
    await ctx.yield();

    // the mast with its helical antenna: it stands at entry, lies folded along the bus after it and swings up again
    // as the deck rocks over on the low pass (K_STOW), flexing slowly
    const boom = new THREE.Group();
    boom.position.set(BOOM_X, -0.56, -1.4);
    {
      const bp = [];
      bp.push(piece(new THREE.CylinderGeometry(0.02, 0.03, 0.62, 8), GREY, 1, T4(0, 0.31, 0)));
      for (let k = 0; k < 4; k++) bp.push(piece(new THREE.TorusGeometry(0.034, 0.009, 5, 10), k % 2 ? PALE : STEEL, 1, T4(0, 0.1 + k * 0.15, 0, Math.PI / 2)));
      await ctx.yield();
      await ctx.yield();
      const helix = await tubeGeo(ctx, (t, out) => { const a = t * Math.PI * 14; return out.set(Math.cos(a) * 0.075, 0.63 + t * 0.36, Math.sin(a) * 0.075); }, 196, 0.0095, 5);
      await ctx.yield();
      bp.push(piece(helix, '#C9CED6', 3, null));
      await ctx.yield();
      bp.push(piece(new THREE.CylinderGeometry(0.1, 0.1, 0.012, 16), GOLD2, 0, T4(0, 0.615, 0)));
      bp.push(piece(new THREE.TorusGeometry(0.1, 0.007, 5, 18), PALE, 1, T4(0, 0.615, 0, Math.PI / 2)));
      bp.push(piece(new THREE.CylinderGeometry(0.008, 0.008, 0.4, 5), GREY, 1, T4(0, 0.8, 0)));
      const bm = new THREE.Mesh(await mergeParts(ctx, bp), foilMat);
      bm.frustumCulled = false; boom.add(bm);
    }
    boom.rotation.set(-0.3, 0, 0.1);
    boom.scale.setScalar(BOOM_S);
    deckG.add(boom);
    await ctx.yield();

    // thruster puff (u 0.556-0.596): one soft additive card standing on the pod's nearest bell, always in the scene, dark until fired
    const puffU = { uPuff: { value: 0 }, uKeyCol: foilU.uKeyCol };
    const puffGeo = new THREE.PlaneGeometry(0.5, 0.56); puffGeo.translate(0, 0.25, 0);
    const puff = new THREE.Mesh(puffGeo, new THREE.ShaderMaterial({ uniforms: puffU, vertexShader: PUFF_VERT, fragmentShader: PUFF_FRAG, depthTest: false, depthWrite: false, transparent: true, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor }));
    puff.position.set(POD_X - 0.094, DECK_Y + 0.19, -1.4); puff.rotation.z = 0.4; puff.frustumCulled = false; puff.renderOrder = 5;
    deckG.add(puff);
    await ctx.yield();

    // sister satellite: foil bus, two long blue-black ribbed panel wings, dish and mast; two passes (SIS_1, SIS_2)
    const sister = new THREE.Group();
    {
      const sp = [];
      sp.push(piece(new THREE.BoxGeometry(0.9, 0.9, 1.1, 3, 3, 3), GOLD, 0, null));
      sp.push(piece(new THREE.BoxGeometry(0.5, 0.2, 0.6), DARK, 1, T4(0, 0.55, 0.1)));
      sp.push(piece(new THREE.BoxGeometry(0.92, 0.5, 0.04), PALE, 1, T4(0, 0, 0.57)));
      await ctx.yield();
      for (const sx of [-1, 1]) {
        sp.push(piece(new THREE.BoxGeometry(2.4, 0.03, 0.8), '#0B1230', 2, T4(sx * 1.85, 0, 0)));
        for (let k = 0; k < 5; k++) sp.push(piece(new THREE.BoxGeometry(0.03, 0.06, 0.84), PALE, 1, T4(sx * (0.65 + k * 0.6), 0, 0)));
        for (const sz of [-1, 1]) sp.push(piece(new THREE.BoxGeometry(2.4, 0.045, 0.03), PALE, 1, T4(sx * 1.85, 0, sz * 0.41)));
        sp.push(piece(new THREE.CylinderGeometry(0.035, 0.035, 0.22, 6), GREY, 1, T4(sx * 0.55, 0, 0, 0, 0, Math.PI / 2)));
        await ctx.yield();
      }
      sp.push(piece(new THREE.ConeGeometry(0.36, 0.17, 16, 1, true), '#C9CED6', 1, T4(0, -0.56, 0.1, Math.PI)));
      sp.push(piece(new THREE.CylinderGeometry(0.012, 0.012, 0.3, 5), GREY, 1, T4(0, -0.75, 0.1)));
      sp.push(piece(new THREE.CylinderGeometry(0.012, 0.012, 0.8, 5), GREY, 1, T4(0.3, 0.85, -0.3)));
      await ctx.yield();
      const sm = new THREE.Mesh(await mergeParts(ctx, sp), foilMat);
      sister.add(sm);
    }
    sister.position.set(-24, 7, -30);
    sister.scale.setScalar(2.6);
    rig.add(sister);
    await ctx.yield();

    // our own solar wing: three hinged panels on a yoke, seen from below: every cell of its Earth-facing side is a
    // small dark mirror of the water under us (WING_FRAG). It hangs above and beside the camera and swings down into
    // the top of the frame twice (K_WING): from the right on the skim, from the left on the rise.
    const wingG = new THREE.Group();
    const wingU = { ...uniforms, uWing: { value: new THREE.Vector4(1, 0, 12, 0.5) } };
    {
      const wp = [], cells = new Float32Array(3 * 18);
      const strut = (ax, ay, az, bx, by, bz, r, hex) => { const d = new THREE.Vector3(bx - ax, by - ay, bz - az), L = d.length();
        return piece(new THREE.CylinderGeometry(r, r, L, 6), hex, 1, new THREE.Matrix4().compose(new THREE.Vector3((ax + bx) / 2, (ay + by) / 2, (az + bz) / 2), new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()), new THREE.Vector3(1, 1, 1))); };
      let cq = 0;
      for (let i = 0; i < 3; i++) {
        const x0 = 0.25 + i * 0.96, x1 = x0 + 0.9, xm = (x0 + x1) / 2;
        for (const [x, z] of [[x0, -0.47], [x1, -0.47], [x1, 0.47], [x0, -0.47], [x1, 0.47], [x0, 0.47]]) { cells[cq++] = x; cells[cq++] = 0; cells[cq++] = z; }
        for (const sz of [-1, 1]) {
          wp.push(piece(new THREE.BoxGeometry(0.94, 0.036, 0.03), PALE, 1, T4(xm, 0, sz * 0.485)));
          wp.push(piece(new THREE.BoxGeometry(0.94, 0.012, 0.012), STEEL, 1, T4(xm, 0, sz * 0.506)));
        }
        for (const ex of [x0 - 0.008, x1 + 0.008]) wp.push(piece(new THREE.BoxGeometry(0.024, 0.036, 1.0), GREY, 1, T4(ex, 0, 0)));
        // corner gussets and the latch at mid-span
        for (const ex of [x0 + 0.03, x1 - 0.03]) for (const sz of [-1, 1]) wp.push(piece(new THREE.BoxGeometry(0.07, 0.04, 0.05), STEEL, 1, T4(ex, 0, sz * 0.47, 0, sz * 0.78, 0)));
        // hinge knuckles to the next panel
        if (i < 2) for (const hz of [-0.36, 0, 0.36]) wp.push(piece(new THREE.CylinderGeometry(0.017, 0.017, 0.1, 8), STEEL, 1, T4(x1 + 0.03, 0, hz, Math.PI / 2)));
        await ctx.yield();
      }
      // yoke: two struts from the root hinge to the first panel and a cross tie; a tip bracket with a pale lamp
      for (const sz of [-1, 1]) wp.push(strut(0, 0, 0, 0.25, 0, sz * 0.34, 0.016, GREY));
      wp.push(strut(0.16, 0, -0.22, 0.16, 0, 0.22, 0.01, STEEL));
      wp.push(piece(new THREE.CylinderGeometry(0.04, 0.04, 0.09, 10), STEEL, 1, T4(0, 0, 0)));
      wp.push(piece(new THREE.BoxGeometry(0.05, 0.045, 0.34), STEEL, 1, T4(3.16, 0, 0)));
      wp.push(piece(new THREE.SphereGeometry(0.022, 8, 6), PALE, 1, T4(3.2, 0, 0)));
      await ctx.yield();
      const cg = new THREE.BufferGeometry();
      cg.setAttribute('position', new THREE.BufferAttribute(cells, 3));
      const cm = new THREE.Mesh(cg, new THREE.ShaderMaterial({ uniforms: wingU, vertexShader: MIRROR_VERT, fragmentShader: WING_FRAG, side: THREE.DoubleSide }));
      cm.frustumCulled = false;
      const wf = new THREE.Mesh(await mergeParts(ctx, wp), foilMat);
      wf.frustumCulled = false;
      wingG.add(cm, wf);
    }
    rig.add(wingG);                                                         // (always drawn: parked above the frame when K_WING is 0)
    scene.add(rig);
    await ctx.yield();

    // ---- stars: 2,500 faint steady points that turn with the Earth frame ----
    const starN = Math.round(2500 * (ctx.quality?.detail ?? 1));
    const sp = new Float32Array(starN * 3), sm = new Float32Array(starN);
    const srng = rng.fork('stars');
    for (let i = 0; i < starN; i++) {
      const z = srng.range(-1, 1), a = srng.range(0, Math.PI * 2), r = Math.sqrt(1 - z * z);
      sp[i * 3] = r * Math.cos(a) * 5000; sp[i * 3 + 1] = z * 5000; sp[i * 3 + 2] = r * Math.sin(a) * 5000;
      sm[i] = Math.pow(srng(), 2.2);
      if (i % 400 === 399) await ctx.yield();   // (srng is a private fork: yielding here changes no draw order)
    }
    await ctx.yield();
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(sp, 3));
    starGeo.setAttribute('aMag', new THREE.BufferAttribute(sm, 1));
    // (by day only the brightest few stay, faint, so the black above the limb is never quite empty)
    const starU = { uPx: { value: 1 }, uAmp: { value: hour === 'day' ? 0.3 : hour === 'dawn' ? 0.7 : 1 } };
    const stars = new THREE.Points(starGeo, new THREE.ShaderMaterial({ uniforms: starU, vertexShader: STAR_VERT, fragmentShader: STAR_FRAG, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending, transparent: false }));
    stars.material.blending = THREE.CustomBlending; stars.material.blendSrc = THREE.OneFactor; stars.material.blendDst = THREE.OneFactor;
    stars.frustumCulled = false; stars.renderOrder = -20;
    scene.add(stars);
    await ctx.yield();

    // ---- the portal's veil: the Earth is drawn without depth, so nothing would hide the ring, and it would sit at
    // frame centre like a reticle for the whole flight. A depth-only disc on the path just in front of it keeps it
    // out of the picture until the limb swings back; it shrinks away at u 0.60-0.64 and the ring appears.
    const veil = new THREE.Mesh(new THREE.CircleGeometry(27, 40), new THREE.ShaderMaterial({
      vertexShader: 'void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
      fragmentShader: 'void main() { gl_FragColor = vec4(0.); }', colorWrite: false, depthWrite: true, depthTest: true }));
    veil.position.set(0, 0, -658); veil.renderOrder = -5; veil.frustumCulled = false;
    scene.add(veil);
    const panAt = new THREE.Vector3();
    const vWr = new THREE.Vector3(), vWx = new THREE.Vector3(), vWo = new THREE.Vector3(), vWy = new THREE.Vector3(), vWz = new THREE.Vector3(), mW = new THREE.Matrix4(), UP_Y = new THREE.Vector3(0, 1, 0);

    // ---- path: a level, dead-straight 660 km line; the Earth is posed around it ----
    await ctx.yield();
    const path = makePath([[0, 0, 0], [0, 0, -220], [0, 0, -440], [0, 0, -660]]);
    await ctx.yield();
    const earth = hero.object;
    const vU = new THREE.Vector3(), vF = new THREE.Vector3(), vG = new THREE.Vector3(), vUp = new THREE.Vector3(), vC = new THREE.Vector3();
    const vF0 = new THREE.Vector3(), vR0 = new THREE.Vector3(), vR = new THREE.Vector3();
    const vP = new THREE.Vector3(), mB = new THREE.Matrix4(), camPos = new THREE.Vector3(), camQ = new THREE.Quaternion();
    const pose = { h: 800, p: 0.66, s: 0 }, tb = { b: 0, psi: 0 };
    const AX_Z = new THREE.Vector3(0, 0, 1), qRoll = new THREE.Quaternion(), camQi = new THREE.Quaternion(), vN = new THREE.Vector3();
    // puts the Earth so that the camera at path point u flies at altitude h over the ground-track point (s, trackB(s)),
    // its gaze heading trackB().psi and pitched p below the local horizon
    // (psi = how far the gaze is panned right of the path: a pan about the path's vertical tips the horizon, since the
    // local vertical leans 40 degrees from it, so the roll takes that tip back out and K_ROLL is the bank seen on screen)
    function poseEarth(u, psi) {
      const uu = Math.min(Math.max(u, 0), U_FREEZE);
      const dip = uu > 0.31 && uu < 0.45 ? Math.sin(Math.PI * (uu - 0.31) / 0.14) : 0;
      const h = hermite(KH, DH, uu) - LOW_DIP * dip * dip, p = keyed(K_PITCH, uu) * Math.PI / 180, s = hermite(KS, DS, uu), al = s / R_EARTH;
      trackB(s, tb); tb.psi += keyed(K_YAW, uu);
      const be = tb.b / R_EARTH, ca = Math.cos(al), sa = Math.sin(al), cb = Math.cos(be), sb = Math.sin(be), cp = Math.cos(tb.psi), sps = Math.sin(tb.psi);
      pose.h = h; pose.p = p; pose.s = s;
      vU.set(sb, cb * ca, -cb * sa); vF0.set(0, -sa, -ca); vR0.set(cb, -sb * ca, sb * sa);
      vF.copy(vF0).multiplyScalar(cp).addScaledVector(vR0, sps);
      vR.copy(vR0).multiplyScalar(cp).addScaledVector(vF0, -sps);
      vC.copy(vU).multiplyScalar(R_EARTH + h); vC.y -= R_EARTH;
      vG.copy(vF).multiplyScalar(Math.cos(p)).addScaledVector(vU, -Math.sin(p));
      vUp.copy(vU).multiplyScalar(Math.cos(p)).addScaledVector(vF, Math.sin(p));
      mB.makeBasis(vR, vUp, vG.negate()).transpose();
      earth.quaternion.setFromRotationMatrix(mB);
      path.pointAt(uu, vP);
      earth.position.copy(vP).sub(vC.applyMatrix4(mB));
      // roll about the gaze: the path is the Z axis and the camera looks straight down it, so turning the Earth about
      // that axis is a pure roll at every u, the real approach included (the portal and the scar behind it stay put)
      qRoll.setFromAxisAngle(AX_Z, keyed(K_ROLL, u) + Math.asin(Math.max(-0.8, Math.min(0.8, Math.tan(p) * Math.tan(psi)))) * sst(0.56, 0.6, u));
      earth.quaternion.premultiply(qRoll); earth.position.applyQuaternion(qRoll);
    }
    poseEarth(0, 0);
    await ctx.yield();
    const fillTarget = new THREE.Color(); let fillU = -1, louvre = 0;
    const FILL_PTS = [0, 0, 0.6, 0, 1.2, 0, 0.4, 0.8, 0.4, -0.6];             // (ahead, right) in units of altitude (60..200 km)
    const WO = [XP[0] - DW[0] * WAKE_BACK, XP[1] - DW[1] * WAKE_BACK];
    const bufSize = new THREE.Vector2();
    const frontAt = (u, a, b, f0, len) => (u < a ? -1e5 : u > b ? 1e5 : f0 + (u - a) / (b - a) * len);
    const neckAt = (u) => 14 - 11 * sst(0.30, 0.42, u) - 9.5 * sst(0.44, 0.494, u) - 26 * sst(0.494, 0.52, u);

    return {
      scene, path, duration: 44,
      camera: { fov: 60, near: 0.3, far: 9000, lookAhead: 20, sway: 0, bank: 0 },
      // the look-round (K_PANX, K_PANY): the one stretch in which the gaze leaves the path's axis
      pois: [{ at: (time, u) => panAt.set(100 * Math.tan(keyed(K_PANX, u)), 100 * Math.tan(keyed(K_PANY, u)), -660 * u - 100), from: 0.5, to: 0.95, weight: PAN_W, fade: 0.06 }],
      portal: { shape: 'circle', radius: 7, color: '#BFF3EE', glow: 1, revealDistance: 260, tilt: false, blendDistance: 30 },
      post: { exposure: 1, flat: 1, bloom: { strength: 0.2, radius: 0.5, threshold: 1 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } },
      ride: 'none', style: 'none',
      update(dt, time, camera, u) {
        // the Earth under the satellite
        camera.getWorldDirection(vN);
        poseEarth(u, Math.atan2(vN.x, -vN.z));
        // the loop: its neck narrows, is a hairline at u 0.49 and snaps; the wall recoils; the ring turns and drifts down the shelf
        const e = sst(0.50, 0.68, u);
        uniforms.uVar.value.z = BEND - 25 * sst(0.495, 0.56, u);
        rings[0].set(NECK_X + 446 * e, neckY0 - DN - 30 * Math.sin(Math.PI * e) + 21 * e, RING_R, 0.06 * sst(0.5, 0.56, u));
        // (the magenta band reaches ~7 km outside the capsule, so a half-width of -6.5 is the hairline)
        // (.w is the neck now; .x is the neck as it stood 3 s ago, which is what the picture shows until a repaint
        // front has passed: across the front of u 0.39-0.47 the neck steps 10 km narrower)
        neck.w = neckAt(u); neck.x = neckAt(u - 0.07);
        // repaint fronts (km along the sweep): the first is half way across the loop at u 0.43; the last two each print
        // 200 km more scar behind the storm and are mid-frame at 0.79 and 0.87 (the last crosses under the ring while the gaze is tipped down onto the crossing)
        uniforms.uFront.value.set(frontAt(u, 0.39, 0.47, 492, 620), frontAt(u, 0.765, 0.815, 450, 1600), frontAt(u, 0.84, 0.95, 781, 1719));
        // the storm slides north-east, a storm-width during the approach
        const ls = 760 + 300 * Math.min(u, U_FREEZE) + 1720 * Math.max(0, u - U_FREEZE) + 1000 * Math.max(0, u - 0.795);
        uniforms.uStorm.value.x = WO[0] + DW[0] * ls; uniforms.uStorm.value.y = WO[1] + DW[1] * ls;
        if (rare) {
          uniforms.uStorm2.value.x = WO[0] + DW[0] * (ls - 250) - DW[1] * 110; uniforms.uStorm2.value.y = WO[1] + DW[1] * (ls - 250) + DW[0] * 110;
          uniforms.uWake.value.y = ls - 270;
        }
        hero.update(dt, time, camera);
        // (it stays larger than the ring's glow until it goes, so no empty halo shows before the ring does)
        const vk = 1 - sst(0.625, 0.64, u);
        veil.scale.setScalar(Math.max(vk, 1e-3)); veil.visible = vk > 0.004;
        // the satellite rides the camera it is given
        // (hidden while this world is the picture inside the previous world's portal, where it would be sliced)
        camera.getWorldPosition(camPos); camera.getWorldQuaternion(camQ);
        rig.visible = !ctx.through;
        rig.position.copy(camPos); rig.quaternion.copy(camQ);
        const dRoll = keyed(K_DROLL, u), cr = Math.cos(dRoll), sr = Math.sin(dRoll);
        deckG.position.set(-keyed(K_DX, u), -0.08 + keyed(K_DROP, u), 0).applyAxisAngle(AX_Z, dRoll);
        deckG.rotation.set(0, 0, dRoll);
        foilU.uRigRot.value.set(cr, -sr, 0, sr, cr, 0, 0, 0, 1);
        stars.position.copy(camPos); stars.quaternion.copy(earth.quaternion);
        ctx.renderer.getDrawingBufferSize(bufSize);
        starU.uPx.value = Math.max(1, bufSize.y / 450);
        foilU.uTime.value = time;
        camQi.copy(camQ).invert();
        foilU.uEarth.value.copy(vN.set(0, -R_EARTH, 0).applyQuaternion(earth.quaternion).add(earth.position).sub(camPos).normalize().applyQuaternion(camQi));   // straight down, in view space
        const cl = uniforms.uCamL.value, rr = Math.max(R_EARTH + 1, Math.hypot(cl.x, cl.y + R_EARTH, cl.z)), kr = R_EARTH / rr;
        foilU.uLimb.value = Math.sqrt(Math.max(0, 1 - kr * kr));              // cosine of the limb's angle from straight down
        // the glow of the field under us: the ramp step at the nadir point, lifted so indigo still reads on dark foil
        // (the warmest of five points under and just ahead of us, so the stream beside the track counts as underneath)
        const hh = Math.max(60, Math.min(200, rr - R_EARTH)), hx = Math.cos(tb.psi), hy = Math.sin(tb.psi), ca = uniforms.uCam.value.x, cb = uniforms.uCam.value.y;
        let T = 0;
        for (let i = 0; i < 5; i++) { const f = FILL_PTS[i * 2] * hh, r = FILL_PTS[i * 2 + 1] * hh; T = Math.max(T, sampleT(ca + f * hx - r * hy, cb + f * hy + r * hx, uniforms)); }
        // the stream and its shoulders glow as the core does: hot pink
        const rc = ramp[T > 0.72 ? 23 : Math.max(0, Math.min(23, Math.floor(T * 24)))], mx = 0.5 / Math.max(rc.x, rc.y, rc.z, 0.05);
        fillTarget.setRGB(rc.x * (0.4 + 0.6 * mx), rc.y * (0.4 + 0.6 * mx), rc.z * (0.4 + 0.6 * mx));
        const ease = Math.abs(u - fillU) < 0.02; fillU = u;                   // eased, except after a jump in u
        foilU.uFill.value.lerp(fillTarget, ease ? Math.min(1, dt * 3) : 1);
        // the radiator louvre opens over warm water and shuts over the shelf
        louvre += (sst(0.5, 0.76, T) - louvre) * (ease ? Math.min(1, dt * 1.6) : 1);
        foilU.uLouvre.value = louvre;
        // the scan mirror nods 9 degrees and back every 2 s, and sweeps twice as far while a repaint front crosses
        const fa = sst(0.38, 0.40, u) * (1 - sst(0.46, 0.48, u)) + sst(0.755, 0.775, u) * (1 - sst(0.805, 0.825, u)) + sst(0.83, 0.85, u) * (1 - sst(0.91, 0.93, u));
        const nod = 0.0785 * (1 + fa) * Math.sin(time * Math.PI);
        mirror.rotation.set(-0.25 + nod, 0, 0);
        mirrorYaw.rotation.y = keyed(K_MYAW, u);
        mirror.userData.face.material.uniforms.uNod.value = nod;
        // the mast stands (leaning a little with its station), lies folded along the bus, or swings between; it flexes
        const stow = keyed(K_STOW, u);
        boom.rotation.set(-0.3 + 0.015 * Math.sin(time * 0.83 + 1), 0, ((u < 0.2 ? 0.1 : -0.1) + 0.025 * Math.sin(time * 0.6)) * (1 - stow) - 1.5 * stow);
        boom.scale.setScalar(u < 0.2 ? BOOM_S : 0.78);                         // (it is nearer the lens on the low pass: a taller mast there; changed while it lies folded out of frame)
        // the sister satellite. First pass: in over the left edge far below us (small, over the shelf at u 0.25), up
        // across the left at a fifth of the frame wide (0.295), away against the limb upper left (0.34, its glint at
        // 0.315) and out over the top. Second pass, on the look-round: across the black sky upper right, above the
        // limb (0.745, glint at 0.75). It is outside the frame at both ends of each pass.
        const pass2 = u > 0.6;
        sister.visible = pass2 ? (u > 0.7 && u < 0.79) : (u > 0.205 && u < 0.385);
        crAt(pass2 ? SIS_2 : SIS_1, u, sister.position);
        const k = (u - 0.25) / 0.14;
        if (pass2) sister.rotation.set(0.5 + time * 0.03, -0.9 + (u - 0.7) * 6, -0.35); else sister.rotation.set(0.95 + time * 0.03, 0.25 + k * 0.4, 0.2);
        // (a quarter-second flash with a slower decay; outside it the wings are dark)
        const gu = pass2 ? 0.75 : 0.315, gk = (u - gu) / (u < gu ? 0.004 : 0.008);
        foilU.uGlint.value = 0.6 * Math.exp(-gk * gk);
        // our own wing swings down about its root into the top of the frame (K_WING), and its cells mirror the water
        // under and ahead of us, a dozen kilometres to a cell on the skim, more from altitude
        const kw = keyed(K_WING, u), W = u < 0.5 ? WING_A : WING_B, tilt = W[9] + 0.02 * Math.sin(time * 0.7);
        vWr.set(W[0], W[1], W[2]);
        vWx.set(W[3], W[4], W[5]).sub(vWr).normalize(); vWo.set(W[6], W[7], W[8]).sub(vWr).normalize();
        vWx.sub(vWo).multiplyScalar(kw * kw * (3 - 2 * kw)).add(vWo).normalize();
        vWz.crossVectors(vWx, UP_Y).normalize(); vWy.crossVectors(vWz, vWx);
        vWz.multiplyScalar(Math.cos(tilt)).addScaledVector(vWy, Math.sin(tilt)); vWy.crossVectors(vWz, vWx);
        mW.makeBasis(vWx, vWy, vWz);
        wingG.quaternion.setFromRotationMatrix(mW); wingG.position.copy(vWr);
        wingU.uWing.value.set(Math.cos(tb.psi), Math.sin(tb.psi), Math.max(10, Math.min(60, (rr - R_EARTH) * 0.2)), 0.5);
        // thruster puff at 24.5 s, as the pod comes into frame on the rise
        const pk = (u - 0.556) / 0.04;
        puffU.uPuff.value = pk > 0 && pk < 1 ? pk : 0;
      },
      dispose() {},
    };
  },
};
