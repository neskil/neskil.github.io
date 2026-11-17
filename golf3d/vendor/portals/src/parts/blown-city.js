// THE TOWER BEING BLOWN: hero set piece for the world "blown-city".
//
// A grey steel blowpipe 3 m thick hangs straight down out of the fog lid, and on its end is a 95 m
// glass bell tower, unfinished and still hot: goblet foot, ribbed twisted shaft with trailed rings and
// prunts, crimped cornices, an arcaded belfry of twisted columns with a glass bell hung inside, attic
// drum, ribbed spire and the neck that wraps the pipe. Keyed to progress it starts as a white-orange
// teardrop, lengthens to the water, swells in breaths into its final form and cools from the foot
// upward to clear deep glass. In front of it a thinner pontil comes down from the upper right and
// carries the hot ring that frames the exit portal, with a molten membrane that is spun open.
// Molten drips, steam at the foot, a steam ring that rolls out when the foot touches the water, flung
// drops off the ring, the tower's coloured light shaft and its caustic on the water are all included.
//
// SPACE     origin = centre of the tower foot on the high-water surface (y = 0 is the water), +Y up,
//           front = +Z: the boat comes from +Z heading toward -Z. The ring stands at (0, 1.9, 75),
//           a third of it under water. In the brief's world frame (boat heading south) rotate the
//           hero by PI about Y and put it at the tower position.
// SIZE      tower 95 m tall, 16 m across the foot; ring at z = 75; the pontil leans out to x ~ 110 by the
//           lid; pipe to y = 175 (both dissolve in the lid above y ~ 110). The returned radius / height /
//           center frame the part viewer (a low eye that sees tower, ring and reflection), not a bound. The shaft of light reaches ~410 m along the water (anchors.shaft).
// COST      ~108k triangles including the mirrored copies (~64k without: opts.mirror false), 12 draw calls,
//           no lights, no textures, no render targets, ~200 ms of build (yields between steps).
// LIGHT     Self-lit glass shader: it ignores scene lights. It wants bright pearl fog (FogExp2), a low
//           sun (opts.sunDir, LOCAL space, toward the sun; default is the brief's sun for a hero turned
//           PI about Y: [-0.80, 0.22, -0.56]) and tight bloom: hot glass is emissive 2-7.
//           All shaders honour scene fog and fade into the fog lid (opts.lid, default 110 m).
//
// OPTS      palette    7 hex strings in brief order: pearl, celadon, cobalt, ruby, amber, orange, amethyst
//           towerColor hex for the cooled glass (default per seed: ruby mostly, sometimes cobalt or emerald)
//           sunDir     [x,y,z] local, toward the sun;  sunColor hex;  lid  fog-lid height in metres
//           water      true (default): the hero draws its own basin water disc (semi-transparent, the
//                      mirrored tower and ring show through it). 'decal': only the coloured light
//                      (tint, caustic net, glows) as an alpha decal to lay 3 cm over the world's own water. false: nothing.
//           waterRadius (default 420), mirror (default true: y-flipped tower, pipes and ring under the water)
//           shaft      false to leave out the coloured light shaft (if you use kit makeGodRays instead)
//           shaftGain  strength of shaft and caustic (default 1). The shaft is MULTIPLY-blended coloured shade:
//                      in white fog added light only washes out to pink, so it tints what is behind it.
//           haloGain   gain of the wide orange glow in the fog round the hot glass from the basin (default 1; less at night)
//           girth      widens the tower only (not the pipes or the ring): 1 = 16 m foot; the world uses 1.7 so it reads at 300 m
//           progress   starting progress (default 0.74, the "half orange, half ruby" frame)
//           dropScale  size of the drops flung off the ring (default 1); dropCount  their number, as a multiple (default 1)
//
// PROGRESS  hero.setProgress(u) with the world's path u (never wall-clock):
//           u < 0.30 teardrop 22-30 m long, a hot star under the pipe; 0.45-0.66 it lengthens to the
//           water; 0.48-0.86 it swells in five breaths into foot, shaft, belfry, spire; 0.66 the foot
//           touches and the steam ring rolls out (to ~0.82); from 0.63 it cools from the foot upward
//           (half way at 0.72, only the spire glowing at 0.9); the membrane in the ring opens from 2 m
//           to 14 m between 0.55 and 0.78. hero.uniforms is the shared uniform block.
//
// ANCHORS   (local space)
//           portalSeat  { position (0,1.9,75), facing (0,0,1), radius 7 }: centre of the 14 m portal
//           flyThrough  Vector3 list from the basin to and through the ring, x = 0, y = 1.9, >= 6 m clear
//           viewpoints  { basin, approach, ring, side }  good camera positions
//           lookAt      point on the tower to gaze at from the basin
//           towerTop, pipeTop, gather (the hot star under the pipe), belfry, foot
//           pontil      { tip, direction }   ring end of the pontil and its upward direction
//           shaft       { from, to, direction }  axis of the coloured light shaft / caustic on the water
//           steamRing   { center, maxRadius }
//           bubbleDome  suggested seat for the 40 m dome, 90 m to the tower's right, inside the shaft
//           flock       { center, radius } for the pigeons wheeling round the tower
//
// GLASS     export makeGlassMaterial(opts) is the city's glass (opaque, written once with depth):
//           tint deepened by thickness, a seen-through gradient (fog above, lagoon below, optional dim
//           floors and columns), Fresnel rim, two hard highlights (sun and a window streak), back-light
//           glow toward the sun and a caustic term. Works on Mesh and InstancedMesh.
//             opts.color       hex / Color tint (uniform uTint)
//             opts.shared      uniform block from makeGlassUniforms(palette, { sunDir, sunColor, lid })
//                              (share one block across the city: uTime, uSunDir, uSunCol, uFogCol,
//                              uLagoon, uCausticCol, uCausticAmp, uLid)
//             opts.thickness   base thickness 0..1 (default 0.35); opts.interior 0..1 parallax floors
//             opts.core        0..1 darker core seen face-on (solid pieces: columns, rods)
//             opts.vertexColors true: tint is multiplied by the 'color' attribute (and instanceColor)
//             opts.transparent / opts.opacity for the six blended pieces; opts.side
//             opts.heat        0..1 constant heat (hot gathers); opts.caustic 0..2 gain of the caustic net
//             opts.city        the world's city uniform block (see CITY_GLSL: uHouse, uQ, uSunPH, uBridge, uBridgeCol, uBoat,
//                              uWave, uMouth, uInner, uShaft, uShaftQ, uShaftN). Turns on the city features: coloured shade and caustics from the houses
//                              up-sun, the bridge wash, wake ladders, lantern glow at night (uInner), wind sway and the
//                              surface patterns chosen per vertex by attribute 'uvp' (x, y metres; z pattern id: 1 bullseye
//                              rondels, 2 pointed windows, 3 reeded, 4 pointed arcade, 5 white-thread cane, 6 barber stripes,
//                              7 gold leaf, 8 ribs and gold flecks, 9 handkerchief, 10 balustrade; +20 = colour attribute is absolute).
//                              Attribute 'sway' (float, metres; negative = tremble).
//             opts.lift        0..1: what is seen through it from above is fog pearl instead of lagoon (our own bow)
//             opts.rim, opts.spec  gains of the Fresnel rim and of the two hard highlights (default 1; large flat walls want less)
//             opts.selfMirror  geometry that is symmetric about y = 0 serves as its own reflection (poles): the part
//                              under the water ripples and pales.
//           Attributes: position, normal, optional float 'thick' (0 thin wall .. 1 solid) added to
//           opts.thickness, optional vec3 'color'.
import * as THREE from 'three';
import { clamp, lerp, smoothstep as sst } from '../kit/core.js';

const DEFAULT_PALETTE = ['#EDE7DC', '#8EC9B8', '#1E4FA8', '#C2183A', '#F2A62E', '#FF6A1A', '#7B4BB0'];
const TOP = 95, RING_Z = 75, RING_Y = 1.9, RING_R = 7, PIPE_TOP = 175;

const GLSL_COMMON = /* glsl */`
float h11(float n){ return fract(sin(n * 127.1) * 43758.5453); }
float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float h31(vec3 p){ p = fract(p * vec3(0.1031, 0.1130, 0.0973)); p += dot(p, p.yzx + 33.33); return fract((p.x + p.y) * p.z); }
float vn3(vec3 p){
  vec3 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  float a = mix(mix(h31(i), h31(i + vec3(1,0,0)), f.x), mix(h31(i + vec3(0,1,0)), h31(i + vec3(1,1,0)), f.x), f.y);
  float b = mix(mix(h31(i + vec3(0,0,1)), h31(i + vec3(1,0,1)), f.x), mix(h31(i + vec3(0,1,1)), h31(i + vec3(1,1,1)), f.x), f.y);
  return mix(a, b, f.z);
}
float vn2(vec2 p){
  vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1,0)), f.x), mix(h21(i + vec2(0,1)), h21(i + vec2(1,1)), f.x), f.y);
}
// caustic net: bright thin lines where two voronoi cells meet
float caustNet(vec2 p){
  vec2 i = floor(p), f = fract(p); float d1 = 8., d2 = 8.;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec2 g = vec2(float(x), float(y)); float n = h21(i + g);
    vec2 o = g + vec2(n, fract(n * 57.31)) - f; float d = dot(o, o);
    if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) { d2 = d; }
  }
  float e = sqrt(d2) - sqrt(d1);
  return 1. - smoothstep(0.0, 0.22, e);
}
float caustic2(vec2 p, float t){
  float a = caustNet(p * 0.55 + vec2(t * 0.11, t * 0.07));
  float b = caustNet(p * 0.83 + vec2(-t * 0.09, t * 0.13) + 3.7);
  return a * b * 2.6 + (a + b) * 0.22;
}
// hot glass: 0 cold .. 1 white-orange
vec3 heatRamp(float h, vec3 amber, vec3 orange){
  vec3 c = vec3(0.55, 0.05, 0.01) * smoothstep(0.0, 0.25, h);
  c = mix(c, amber * 1.9, smoothstep(0.18, 0.5, h));
  c = mix(c, orange * 3.1, smoothstep(0.4, 0.78, h));
  c = mix(c, vec3(1.0, 0.72, 0.42) * 5.0, smoothstep(0.78, 1.0, h));
  return c;
}
`;


// ---------------------------------------------------------------- city light (shared by the glass, the world's water and paving)
// Coloured shade laid by the houses that stand between the sun and a point: a 2-row lookup along the axis that runs across
// the light (row 0: house colour rgb + roof height, row 1: where the house stands along the light + how far its shade reaches
// under the low sun and under the high one: uShaftN.w says how far the sun has climbed from the one to the other).
export const CITY_GLSL = /* glsl */`
uniform sampler2D uHouse;
uniform vec4 uQ;        // q0, 1 / range, tan(sun elevation), half width of the bridge wash
uniform vec4 uSunPH;    // xy: unit vector across the light in plan, zw: unit vector along the light in plan
uniform vec4 uBridge;   // xz of both ends of the great bridge
uniform vec3 uBridgeCol;
uniform vec4 uBoat;     // xz of our boat, xz of its heading
uniform vec4 uWave;     // x: radius of the beams-on wave from the canal mouth, y: strength before it, z: wake gain, w: overall gain
uniform vec2 uMouth;
uniform sampler2D uShaft;   // per cell two texels: (q, Y, radius, where it starts along the light) and (colour, how far it reaches)
uniform vec4 uShaftQ;       // q0, 1 / q range, Y0, 1 / Y range
uniform vec4 uShaftN;       // rows of cells, cos(sun elevation) of the harp's own sun, strength, how far the sun has climbed (0: side canal, 1: grand canal)
vec4 cityLight(vec3 P){
  float q = P.x * uSunPH.x + P.z * uSunPH.y;
  float t = clamp((q - uQ.x) * uQ.y, 0.002, 0.998);
  vec4 a = texture2D(uHouse, vec2(t, 0.25));
  vec4 b = texture2D(uHouse, vec2(t, 0.75));
  float d = P.x * uSunPH.z + P.z * uSunPH.w - b.r;
  float yb = P.y + d * uQ.z;
  float reach = mix(b.g, b.b, uShaftN.w);
  float m = smoothstep(0.5, 4., d) * (1. - smoothstep(a.a - 5., a.a, yb)) * smoothstep(1., 6., a.a) * (1. - smoothstep(reach * 0.75, reach, d));
  return vec4(a.rgb, m);
}
float cityOn(vec3 P){
  float dm = distance(P.xz, uMouth);
  return mix(uWave.y, 1., smoothstep(uWave.x, uWave.x - 40., dm)) * uWave.w;
}
float bridgeWash(vec3 P){
  vec2 pa = P.xz - uBridge.xy, ba = uBridge.zw - uBridge.xy;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-3), 0., 1.);
  return (1. - smoothstep(uQ.w * 0.35, uQ.w, length(pa - ba * h))) * (1. - smoothstep(8., 10., P.y));
}
// The harp: the light of every pane that throws a string across the grand canal, as a disc in the plane across the light (the
// pool it lays on the water is that disc's foot; the string seen in the air is only its bright core). A point knows its place
// across the light (q) and the height its own ray of light had at the plane al = 0 (Y); the lookup holds, per cell of (q, Y),
// the one pane that can reach it. Returns the pane's colour and how deep the point stands in its light: whatever glass or
// water is there takes the colour (the water, a gondola, a pole): full over the inner two thirds, a soft rim outside.
vec4 shaftLight(vec3 P){
  float ce = clamp(uShaftN.y, 0.05, 1.), te = sqrt(1. - ce * ce) / ce;          // (the harp stands along the sun of the grand canal, wherever the sun is now)
  float q = P.x * uSunPH.x + P.z * uSunPH.y, al = P.x * uSunPH.z + P.z * uSunPH.w, Y = abs(P.y) + al * te;
  vec2 t = vec2((q - uShaftQ.x) * uShaftQ.y, (Y - uShaftQ.z) * uShaftQ.w);
  float row = floor(clamp(t.y, 0., 0.999) * uShaftN.x), tx = clamp(t.x, 0.001, 0.999);
  vec4 a = texture2D(uShaft, vec2(tx, (row * 2. + 0.5) / (uShaftN.x * 2.)));
  vec4 b = texture2D(uShaft, vec2(tx, (row * 2. + 1.5) / (uShaftN.x * 2.)));
  vec2 dv = vec2(q - a.x, (Y - a.y) * uShaftN.y) / max(a.z, 0.5);
  float m = clamp(1. - dot(dv, dv), 0., 1.) * step(0.5, a.z) * step(abs(t.x - 0.5), 0.5) * step(abs(t.y - 0.5), 0.5);
  float d = al - a.w;
  m = smoothstep(0., 0.5, m) * smoothstep(0.6, 3., d) * (1. - smoothstep(b.a - 2.5, b.a, d));
  m *= (1. - smoothstep(uWave.x - 40., uWave.x, distance(P.xz, uMouth))) * uShaftN.z;
  return vec4(b.rgb, clamp(m, 0., 1.));
}
float wakeLadder(vec3 P, float t){
  vec2 rel = P.xz - uBoat.xy;
  float al = dot(rel, uBoat.zw), la = abs(rel.x * uBoat.w - rel.y * uBoat.z);
  float k = (al - 9.) / 13.;
  float wk = exp(-k * k) * exp(-la * 0.06) * exp(-max(P.y, 0.) * 0.9);
  float lad = smoothstep(0.94, 0.995, sin(P.y * 4.4 - t * 3.3 + al * 0.6 + 1.6 * sin(al * 0.5 + t * 0.7)));
  return wk * lad * smoothstep(0.35, 0.65, vn2(vec2(al * 0.9 - t * 1.5, P.y * 0.7)));
}
`;

const CITY_PATTERN = /* glsl */`
void cityPattern(float pid, vec2 uv, float aa, out float pT, out float pane, out float white, out float gold, out vec2 pN, out float pGrad){
  pT = 0.; pane = 0.; white = 0.; gold = 0.; pN = vec2(0.); pGrad = 0.;
  if (pid < 0.5) return;
  if (pid < 1.5) {                                    // 1: bullseye rondels set in lead
    vec2 c = fract(uv / 0.8) - 0.5; float r = length(c), k = aa / 0.8;
    float disc = 1. - smoothstep(0.43 - k, 0.43 + k, r);
    pT = (1. - disc) * 0.85 + disc * 0.3 * (1. - smoothstep(0.02, 0.13, r));
    pN = c / max(r, 1e-3) * disc * sin(r * 46.) * 0.3 * (1. - smoothstep(0.02, 0.2, k));
    pane = disc;
  } else if (pid < 2.5 || (pid > 3.5 && pid < 4.5)) {  // 2: pointed windows, 4: pointed arcade
    bool arc = pid > 3.;
    vec2 cell = arc ? vec2(3.4, 5.2) : vec2(2.6, 4.2);
    vec2 p = vec2((fract(uv.x / cell.x) - 0.5) * cell.x, fract(uv.y / cell.y) * cell.y);
    float w = arc ? 1.15 : 0.72, ys = arc ? 2.7 : 2.25, y0 = arc ? -1. : 0.85;
    float ax = abs(p.x);
    float dBox = max(ax - w, max(y0 - p.y, p.y - ys));
    float dArc = max(length(vec2(ax + w, p.y - ys)) - 2. * w, ys - p.y);
    float d = min(dBox, dArc);
    float fw = arc ? 0.14 : 0.085;
    float frame = 1. - smoothstep(fw - aa, fw + aa, abs(d));
    float inside = 1. - smoothstep(-aa, aa, d);
    float lat = min(abs(fract((p.x + p.y) / 0.9) - 0.5), abs(fract((p.x - p.y) / 0.9) - 0.5)) * 0.9;      // the arcade's panes are leaded in diamonds
    float mull = arc ? inside * (1. - smoothstep(0.055 - aa, 0.055 + aa, lat)) * (1. - smoothstep(0.2, 0.7, aa)) : inside * (1. - smoothstep(0.035 - aa, 0.035 + aa, min(ax, abs(p.y - ys))));
    vec2 e = vec2(ax - cell.x * 0.5, p.y - (ys + w * 1.15));
    float re = length(e);
    float eye = 1. - smoothstep(0.06 - aa, 0.06 + aa, abs(re - 0.3));              // the roundel in each spandrel: a thick frame, so it is a window and not a drawn circle
    float eyeIn = 1. - smoothstep(0.3 - aa, 0.3 + aa, re);
    white = 1. - smoothstep(0.05 - aa, 0.05 + aa, abs(p.y - (cell.y - 0.2)));
    pT = max(frame, max(mull, eye)) * 0.9 + (1. - inside) * (1. - eyeIn) * 0.26;
    pane = max(inside * (1. - mull), eyeIn);
    if (arc) { pT += inside * 0.3 * (1. - mull); pane = inside * (1. - mull) * 0.6; }
    else pT -= pane * (1. - frame) * 0.2;                                      // the pane is the thinnest glass of the wall: lighter, and seen through
    pGrad = inside * clamp((ys + w - p.y) / (ys + w - y0), 0., 1.);           // 0 at the head of the window, 1 at its sill
    // seeds: small bubbles caught in the wall, each a bright ring
    vec2 bg = uv / 0.9, bi = floor(bg), bf = fract(bg) - 0.5; float bh = h21(bi + 5.1);
    bf -= (vec2(bh, fract(bh * 13.7)) - 0.5) * 0.5;
    float br = length(bf) * 0.9, bk = (1. - smoothstep(0.1, 0.3, aa)) * step(0.7, bh) * (1. - inside) * (1. - frame);
    float bring = (1. - smoothstep(0.014, 0.02 + aa, abs(br - 0.095))) * bk;
    white = max(white, bring * 0.05); pN += bf / max(length(bf), 1e-3) * bring * 0.3;      // a seed is a glint on its rim, not a drawn circle
    pT -= (1. - smoothstep(0.07, 0.095, br)) * bk * 0.12;
  } else if (pid < 3.5) {                             // 3: reeded
    float f = fract(uv.x / 0.42) - 0.5;
    pN.x = f * 1.3 * (1. - smoothstep(0.1, 0.5, aa / 0.42)); pT = abs(f) * 0.5;
  } else if (pid < 6.5) {                             // 5: white-thread cane, 6: barber stripes
    float s = uv.x + uv.y * (pid < 5.5 ? 0.9 : 0.55);
    float f = abs(fract(s) - 0.5), ka = aa * 1.2;
    float wdt = pid < 5.5 ? 0.14 : 0.25;
    white = 1. - smoothstep(wdt - ka, wdt + ka, f);
    white = mix(white, pid < 5.5 ? 0.28 : 0.5, smoothstep(0.15, 0.6, ka));
  } else if (pid < 7.5) { gold = 1.; }                // 7: gold leaf
  else if (pid < 8.5) {                               // 8: ribs and gold flecks
    vec2 g = floor(uv / 0.7), c = fract(uv / 0.7) - 0.5; float h = h21(g + 3.3);
    c -= (vec2(h, fract(h * 7.3)) - 0.5) * 0.55;
    gold = (1. - smoothstep(0.10, 0.12 + aa / 0.7, length(c))) * step(0.5, h) * (1. - smoothstep(0.2, 0.7, aa / 0.7));
    pN.x = sin(uv.x * 3.1416) * 0.35; pT = 0.1 * (0.5 + 0.5 * cos(uv.x * 3.1416));
  } else if (pid < 9.5) {                             // 9: glass handkerchief, flashing as it swings
    vec2 c = abs(uv - 0.5); float e = max(c.x, c.y);
    pT = smoothstep(0.36, 0.42, e) * 0.8;
    pN = 0.55 * vec2(sin(uTime * 2.3 + vWP.x * 1.3 + vWP.z * 0.7), cos(uTime * 1.7 + vWP.x * 0.9 + vWP.z));
  }
}
`;

// ---------------------------------------------------------------- the glass material
const GLASS_VERT = /* glsl */`
#include <common>
#include <fog_pars_vertex>
attribute float thick;
uniform float uTime, uClip, uSteel;
#ifdef CITY
attribute vec3 uvp;               // x, y: surface coordinates in metres, z: pattern id (+20 = absolute colour, no instance tint)
attribute float sway;             // metres of wind sway (hanging things); negative = fast tremble (leaves, beads)
varying vec3 vUvP;
#endif
#ifdef MORPH
attribute vec3 aMorph;            // x: height 0 foot .. 1 pipe, y: radius / outer radius, z: 1 on the bottom cap
uniform float uU, uLen, uBlobR, uBreath, uSwell, uCool, uTopY, uHeatMax;
float blobR(float t){ float tb = 1. - clamp(t, 0., 1.); return uBlobR * (0.3 + 0.7 * smoothstep(0., 0.85, tb)); }
#endif
varying vec3 vWP, vN, vTint;
varying float vThick, vHeat, vT, vRD, vNy;
varying vec2 vAx;
void main(){
  vec3 p = position, n = normal;
  float heat = 0.; vT = 0.; vRD = 0.; vAx = vec2(1., 0.);
  #ifdef MORPH
    float t = aMorph.x, k = aMorph.y, cap = aMorph.z;
    float form = smoothstep(0.48 + 0.25 * t, 0.66 + 0.20 * t, uU);
    float rf = length(p.xz);
    vec2 d = rf > 1e-4 ? p.xz / rf : vec2(1., 0.);
    float tb = 1. - t, bx = (tb - uBreath) * 4.5;
    float swell = 1. + uSwell * (0.13 * exp(-bx * bx) + 0.035 * sin(uBreath * 6.2832)) * (0.35 + 0.65 * (1. - form * 0.6));
    float b0 = blobR(t);
    float r = mix(b0 * k, rf, form) * swell;
    float y = uTopY - (uTopY - p.y) * uLen;
    float hemi = sqrt(max(1. - k * k, 0.));
    y -= cap * hemi * blobR(0.) * 0.85 * (1. - form);
    p = vec3(d.x * r, y, d.y * r);
    float slope = (blobR(t + 0.01) - blobR(t - 0.01)) / 0.02 / max(uTopY * uLen, 1.) * k;
    vec3 nb = normalize(vec3(d.x, -slope, d.y));
    nb = normalize(mix(nb, vec3(d.x * k, -hemi - 0.02, d.y * k), cap));
    n = normalize(mix(nb, n, form) + vec3(0., 1e-3, 0.));
    heat = uHeatMax * smoothstep(uCool - 0.2, uCool + 0.2, t + 0.03 * sin(atan(d.y, d.x + 1e-5) * 3. + t * 31.)) * (0.86 + 0.14 * smoothstep(0.5, 1., t));
    vT = t; vAx = d;
  #endif
  vTint = vec3(1.);
  #ifdef USE_COLOR
    vTint *= color;
  #endif
  vec4 lp = vec4(p, 1.);
  #ifdef USE_INSTANCING
    lp = instanceMatrix * lp;
    n = mat3(instanceMatrix) * n;
  #endif
  #ifdef USE_INSTANCING_COLOR
    #ifdef CITY
      if (uvp.z < 19.5) vTint *= instanceColor;
    #else
      vTint *= instanceColor;
    #endif
  #endif
  vec4 wp = modelMatrix * lp;
  if (uSteel > 0.5) {
    vec3 nw = normalize(mat3(modelMatrix) * n + vec3(0., 1e-5, 0.)); wp.xyz += nw * clamp(distance(cameraPosition, wp.xyz) * 0.0042 - 0.4, 0., 1.6);
    vT = length(position.xz) > 4. ? max(position.y, 0.6) : 0.;                 // the pontil (off the tower's axis): its height, so it can melt into the fog well inside the frame
    vRD = distance(position.xz, vec2(0., 75.));                                 // how far from the ring it has leaned: its mirror image is kept only beside the ring
  }
  #ifdef CITY
    vUvP = uvp;
    float sph = (wp.x + wp.z) * 0.35, sAmp = abs(sway), sRate = sway < 0. ? 3.7 : 1.;
    float gust = 0.55 + 0.45 * sin(uTime * 0.41 + sph * 0.23);
    wp.xyz += sAmp * gust * vec3(sin(uTime * 1.9 * sRate + sph), 0.25 * sin(uTime * 2.7 * sRate + sph * 1.7), cos(uTime * 1.55 * sRate + sph * 1.3));
  #endif
  #ifdef SELFMIRROR
    if (wp.y < 0.) { float dq = clamp(-wp.y * 0.12, 0., 1.5); wp.x += sin(wp.y * 1.9 + uTime * 1.7 + wp.z) * 0.16 * dq; wp.z += sin(wp.y * 2.3 - uTime * 1.3 + wp.x) * 0.12 * dq; }
  #endif
  // ripples in the mirrored copy
  if (uClip > 1.5) { float dp = clamp(-wp.y * 0.08, 0., 1.5) * (1. - 0.7 * uSteel); wp.x += sin(wp.y * 0.9 + uTime * 1.7) * 0.28 * dp; wp.z += sin(wp.y * 1.3 - uTime * 1.3) * 0.2 * dp; }
  vWP = wp.xyz;
  vN = normalize(mat3(modelMatrix) * n + vec3(0., 1e-5, 0.));
  vThick = thick; vHeat = heat;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  vNy = gl_Position.y / max(gl_Position.w, 1e-3);          // height in the frame, -1..1
  #include <fog_vertex>
}`;

const GLASS_FRAG = /* glsl */`
#include <common>
#include <fog_pars_fragment>
uniform vec3 uTint, uFogCol, uLagoon, uSunDir, uSunCol, uCausticCol, uAmber, uOrange;
uniform float uTime, uClip, uLid, uThick, uInterior, uCore, uHeatAll, uCausticAmp, uCausticGain, uOpacity, uSteel, uLift, uRim, uSpec;
varying vec3 vWP, vN, vTint;
varying float vThick, vHeat, vT, vRD, vNy;
varying vec2 vAx;
${GLSL_COMMON}
#ifdef MORPH
uniform float uHotCap;
#endif
#ifdef CITY
varying vec3 vUvP;
uniform float uInner;
uniform vec3 uRake;
${CITY_GLSL}
${CITY_PATTERN}
#endif
void main(){
  #ifdef CITY
    float pid = vUvP.z > 19.5 ? vUvP.z - 20. : vUvP.z;
    float paa = (abs(dFdx(vUvP.x)) + abs(dFdy(vUvP.x)) + abs(dFdx(vUvP.y)) + abs(dFdy(vUvP.y))) * 0.7 + 1e-4;
  #endif
  #ifdef CITY
    if (pid > 9.5 && pid < 10.5 && paa < 0.1) {                                // 10: balustrade of drawn rod: the gaps are cut out
      float bar = abs(fract(vUvP.x / 0.26) - 0.5);
      if (bar < 0.32 && vUvP.y > 0.09 && vUvP.y < 0.9) discard;
    }
  #endif
  if (uClip > 1.5) { if (vWP.y > -0.02) discard; } else if (uClip > 0.5) { if (vWP.y < -0.12) discard; }
  // the mirror image of the far pipes would be fogged by its own distance and lie on the near water as a pale hairline: let it go
  if (uSteel > 0.5 && uClip > 1.5 && h21(gl_FragCoord.xy * 0.37 + 1.5) < max(smoothstep(60., 140., distance(cameraPosition, vWP)), vT > 0.5 ? smoothstep(12., 30., vRD) : 0.)) discard;
  float lidOut = smoothstep(uLid + 12., uLid + 62., abs(vWP.y));
  if (uSteel > 0.5 && vT > 0.5) lidOut = max(lidOut, smoothstep(uLid * 0.15, uLid * 0.34, vT));        // the pontil comes down out of the fog: it is gone before it could leave the frame as a bare line
  // the blowpipe above the tower goes up into the fog before it can leave the frame as a bare line
  if (uSteel > 0.5 && uClip < 1.5 && vT < 0.5) {
    lidOut = max(lidOut, smoothstep(0.3, 0.8, vNy) * smoothstep(99., 116., vWP.y));
    lidOut = max(lidOut, smoothstep(240., 380., distance(cameraPosition, vWP)) * smoothstep(106., 136., vWP.y));   // and seen from far down the canal it is gone into the fog a little above the hot star: a dark stem, not a pale bar up the sky
  }
  if (lidOut > 0.02 && h21(gl_FragCoord.xy * 0.37 + 0.5) < lidOut) discard;
  vec3 V = normalize(cameraPosition - vWP + vec3(0., 1e-4, 0.));
  vec3 N = normalize(vN + vec3(0., 1e-5, 0.));
  if (!gl_FrontFacing) N = -N;
  #ifdef CITY
    float pT, pane, white, gold, pGrad; vec2 pN;
    cityPattern(pid, vUvP.xy, paa, pT, pane, white, gold, pN, pGrad);
    if (pid > 0.5 && pid < 4.5 && !(pid > 2.5 && pid < 3.5)) pN += (vec2(vn2(vUvP.xy * 0.7), vn2(vUvP.xy * 0.7 + 17.)) - 0.5) * 0.16;   // hand-blown walls are reamy: the highlight and what is seen through them drift as we pass
    if (abs(N.y) < 0.92) {
      vec3 Tn = normalize(cross(vec3(0., 1., 0.), N) + vec3(1e-4, 0., 0.)), Bn = cross(N, Tn);
      N = normalize(N + Tn * pN.x + Bn * pN.y);
    }
  #endif
  float sgn = uClip > 1.5 ? -1. : 1.;                 // mirrored copy: light it as its upright self
  vec3 L = normalize(vec3(uSunDir.x, uSunDir.y * sgn, uSunDir.z));
  float ndv = min(abs(dot(N, V)), 1.);
  float fres = pow(1. - ndv, 4.);
  vec3 tint = clamp(uTint * vTint, 0.012, 1.);
  float depth = clamp(uThick + vThick + (1. - ndv) * (1. - ndv) * 0.55, 0., 1.6);
  float milky = 0.;
  #ifdef CITY
    // milk glass has an opal body: near-white tints turn celadon-blue where the glass is thick, and carry a stronger rim
    milky = smoothstep(0.42, 0.6, min(tint.r, min(tint.g, tint.b))) * step(vUvP.z, 19.5);
    tint = mix(tint, tint * vec3(0.56, 0.86, 1.0), milky * smoothstep(0.25, 1.0, depth + pT));
    tint = mix(tint, vec3(0.93, 0.91, 0.86), white);
    float ream = pid > 0.5 && pid < 4.5 && !(pid > 2.5 && pid < 3.5) ? (vn2(vUvP.xy * vec2(0.45, 0.22) + 5.) - 0.5) * 0.3 : 0.;     // and never one even thickness: the colour pools and thins in slow vertical drifts
    depth = clamp(mix(depth + pT + 0.12 * milky + ream, 0.12, white), 0., 1.7);
  #endif
  // what is seen through it: fog above, lagoon below
  vec3 T = normalize(-V - N * 0.45);
  float g = T.y * sgn + (vn3(vWP * 0.11) - 0.5) * 0.22;
  vec3 through = mix(mix(uLagoon, uFogCol, uLift), uFogCol, smoothstep(-0.2, 0.14, g)) * 0.86;
  #ifdef CITY
    // a flat wall a few metres from the eye keeps one depth of colour: the pearl-over-lagoon gradient would lie on it as pale see-through panes
    if (pid > 0.5 && pid < 4.5 && !(pid > 2.5 && pid < 3.5)) through = mix(through, mix(uLagoon, uFogCol, 0.4) * 0.86, 0.6 * (1. - smoothstep(9., 24., distance(cameraPosition, vWP))));
  #endif
  vec3 q = vWP - V * (2.6 / max(ndv, 0.3));
  float fl = smoothstep(0.40, 0.48, abs(fract(q.y / 4.2) - 0.5));
  float cm = smoothstep(0.41, 0.48, abs(fract((q.x + q.z) / 3.3) - 0.5));
  through *= 1. - uInterior * 0.4 * max(fl, cm) * smoothstep(0.1, 0.42, ndv);          // seen at a grazing angle the floors behind a wall would smear into pale blotches: let them go
  #ifdef CITY
    through = mix(through * (1. + 0.22 * pane), uLagoon * 0.74, pGrad * 0.6);     // each pane: fog pearl at its head, lagoon at its sill
    float lampK = 1.;
    if (pid > 3.5 && pid < 4.5) {                                                 // the arcade: a deeper head to every pane, and by lantern a warm pool low in its centre
      through *= mix(1., 0.75 + 0.25 * pGrad, pane);
      vec2 lp = vec2((fract(vUvP.x / 3.4) - 0.5) * 3.4, fract(vUvP.y / 5.2) * 5.2 - 1.2);
      lampK = 0.35 + 0.9 * exp(-dot(lp, lp) * 0.35);
    }
  #endif
  vec3 body = through * pow(tint, vec3(0.3 + 1.9 * depth));
  body *= mix(1., 0.42, uCore * ndv * ndv);
  float wrap = 0.5 + 0.5 * dot(N, L);
  body *= 0.72 + 0.4 * wrap;
  // light coming through it from the sun side
  float bl = max(dot(-V, L), 0.); bl = bl * bl; bl = bl * bl;
  vec3 col = body + pow(tint, vec3(0.55)) * uSunCol * bl * 1.4 * (1. - 0.3 * depth);
  // bright rim, sun glint, window streak
  float fr = fres;
  #ifdef CITY
    if (pid > 0.5 && pid < 4.5 && !(pid > 2.5 && pid < 3.5)) fr = min(fres, mix(0.6, 0.3, smoothstep(6., 12., distance(cameraPosition, vWP))));          // a flat wall seen along its length keeps its colour: the bright rim belongs to edges and curved glass
  #endif
  col += uFogCol * (0.03 + uRim * fr * (1. + 0.6 * milky));
  vec3 H = normalize(L + V + vec3(0., 1e-4, 0.));
  float nh = max(dot(N, H), 0.);
  col += uSunCol * (pow(nh, 700.) * 9. + pow(nh, 70.) * 0.35) * uSpec;
  vec3 Rv = reflect(-V, N);
  vec3 Wd = normalize(vec3(-L.z, 0.42, L.x));
  vec3 Wr = normalize(cross(vec3(0., 1., 0.), Wd)), Wu = cross(Wd, Wr);
  float wa = dot(Rv, Wr), wb = dot(Rv, Wu);
  float wob = vn3(vWP * 1.3) - 0.5; wa += wob * 0.03; wb += wob * 0.12;       // hand-blown glass: the window's reflection wavers, it is never a ruled pane
  float streak = step(0., dot(Rv, Wd)) * (1. - smoothstep(0.03, 0.045, abs(wa))) * (1. - smoothstep(0.33, 0.37, abs(wb))) * smoothstep(0.006, 0.014, abs(wb - 0.07));
  vec3 dN = fwidth(vN); streak *= mix(0.12, 1., clamp((dN.x + dN.y + dN.z) * 30., 0., 1.));       // the long streak belongs to curved glass (columns, domes, hulls): on a flat wall it would hang there as a ghost pane
  col += uFogCol * streak * 1.9 * uSpec;
  // caustics laid on it by glass up-sun
  float cz = caustic2(vec2(vWP.x + vWP.z, vWP.y * 1.2 + vWP.x * 0.3) * 0.5, uTime);
  #ifdef CITY
    vec4 cl = cityLight(vWP);
    float con = cityOn(vWP), cfull = smoothstep(uWave.y + 0.02, 1., con / max(uWave.w, 1e-3));   // 0 before the sun breaks, 1 once the wave has passed
    float cov = cl.a * con * uCausticGain;
    vec3 lc = pow(clamp(cl.rgb, 0.01, 1.), vec3(0.55));
    lc = mix(lc, lc * lc, 0.5);                                                 // milk houses do not throw white nets
    float clow = mix(1. - smoothstep(0.8, 5.5, vWP.y), 1., cfull);              // before that only the water's own light crawls up the foot of a wall
    float bw = bridgeWash(vWP) * min(uCausticGain, 1.);
    vec3 bc = pow(clamp(uBridgeCol, 0.01, 1.), vec3(0.9)) * 1.3;                  // the bridge's own colour at full strength: the boat is washed blue, not drained
    float rake = max(dot(N, L), 0.) * (1. - cl.a) * cfull * step(uClip, 1.5);       // the low sun rakes whatever faces it and stands clear of the coloured shade
    col = col * (1. + 0.6 * rake * dot(uRake, vec3(0.34))) + pow(tint, vec3(0.6)) * uRake * rake * 0.45;
    col = mix(col, col * (0.35 + lc), cov * mix(0.5, 0.3, smoothstep(6., 9., vWP.y)) * cfull);
    col += lc * (0.3 + 0.7 * pow(tint, vec3(0.4))) * cz * cov * 0.28 * clow * (1. - smoothstep(5., 10., vWP.y));        // the nets stay near the waterline
    vec4 sl = shaftLight(vWP);                                                     // standing in a shaft of the harp: the glass takes that pane's colour, and its net crawls on it
    if (sl.a > 0.003) {
      vec3 sc = pow(clamp(sl.rgb, 0.01, 1.), vec3(0.6)); float sk = sl.a * min(uCausticGain, 1.);
      col = mix(col, col * (0.3 + sc * 1.15), sk * 0.7);
      col += sc * (0.3 + 0.7 * pow(tint, vec3(0.4))) * (0.16 + 0.6 * min(cz, 1.6)) * sk;
    }
    float bwm = smoothstep(0., 0.5, bw);                                             // the wash comes on whole within a metre or two: half-washed amber under an aqua bridge is only grey
    col = mix(col, bc * min(dot(col, vec3(0.3, 0.5, 0.2)) * 1.1 + 0.06, 0.62), bwm * 0.93); col += bc * cz * bw * 0.17;
    col += uFogCol * fres * uRim * 0.5 * bwm;                                         // its bright rim stays: washed glass is still glass, and our bow still stands off the water
    col += mix(uFogCol, pow(tint, vec3(0.45)) * 1.25, 0.72) * wakeLadder(vWP, uTime) * uWave.z * min(uCausticGain, 1.);      // the wake's light takes the wall's own colour: never white scribble on dark glass
    if (gold > 0.001) {
      vec3 gc = vec3(1.0, 0.64, 0.17) * (0.3 + 0.55 * wrap) + uSunCol * pow(nh, 40.) * 2.2 + uFogCol * fres * 0.6;
      col = mix(col, gc, gold);
    }
    col += pow(tint, vec3(0.75)) * uInner * (0.2 + 1.5 * pane * lampK + 0.35 * step(2.5, pid) * step(pid, 3.5) * (1. - uLift)) * (0.85 + 0.15 * sin(uTime * 1.3 + vWP.x * 0.7 + vWP.z * 0.4));   // reeded glass (bridges, roofs) holds a little of the lantern light too
  #else
    col += uCausticCol * cz * uCausticAmp * uCausticGain;
  #endif
  #ifdef SELFMIRROR
    if (vWP.y < 0.) col = mix(col * 0.8, uLagoon * 0.46, clamp(0.4 + -vWP.y * 0.17, 0., 0.93));       // its own reflection: a dim wavering streak that sinks into the lagoon
  #endif
  // grey steel (the two pipes): the only things here that are not glass
  float steelKeep = 0.;
  if (uSteel > 0.5) {
    float streaks = vn2(vec2(atan(vWP.z, vWP.x + 1e-4) * 9., vWP.y * 0.06));
    float bands = vn2(vec2(vWP.y * 0.9, 3.7));
    vec3 st = mix(vec3(0.16, 0.17, 0.19), vec3(0.42, 0.44, 0.47), 0.35 + 0.4 * streaks + 0.25 * bands) * (0.5 + 0.6 * wrap);
    st *= mix(vec3(1.), vec3(0.75, 0.6, 0.5), vThick) * min(1., 0.3 + dot(uFogCol, vec3(0.45)));           // soot and heat tint toward the hot end
    col = st + uFogCol * fres * 0.5 + uSunCol * (pow(nh, 90.) * 1.2) + uFogCol * streak * 0.35;
    float sdist = distance(cameraPosition, vWP);
    col = mix(col, uFogCol * 0.86, smoothstep(50., 330., sdist) * 0.45);                                  // far off it pales into the fog
    if (uClip < 1.5 && vT < 0.5) {                                                                        // but the blowpipe seen from far down the canal stands over the hot star: dark steel against the glow, never a pale bar
      steelKeep = 0.95 * smoothstep(240., 380., sdist);
      col = mix(col, st * 0.42 + vec3(0.05, 0.02, 0.012), steelKeep);
    }
    if (uClip > 1.5) col = mix(col, uLagoon * 0.62, 0.35 + 0.6 * smoothstep(30., 150., sdist));           // and its mirror image sinks into the lagoon's own colour
    if (vT > 0.5) {                                                                                       // the pontil: dull red where it holds the hot ring, paler as it climbs into the fog
      col += heatRamp(0.5 * (1. - smoothstep(3., 34., vT)), uAmber, uOrange) * (uClip > 1.5 ? 0.3 : 0.8);
      col = mix(col, uFogCol * 0.97, smoothstep(uLid * 0.14, uLid * 0.45, vT) * 0.5);
    }
  }
  // heat
  float h = clamp(max(vHeat, uHeatAll), 0., 1.), hotKeep = 0., hk = h;
  if (h > 0.004) {
    float skin = vn3(vec3(vWP.x * 0.5, vWP.y * 0.07 - uTime * 0.12, vWP.z * 0.5));
    float limb = 0.6 + 0.4 * ndv * ndv;                 // deeper orange at the limb, white-orange in the core
    float hh = clamp(h * limb * (0.9 + 0.16 * skin) + 0.1 * h * clamp(uThick + vThick, 0., 1.), 0., 1.);
    #ifdef MORPH
      float capK = mix(uHotCap, 1., smoothstep(0.8, 0.97, vT));              // below its top fifth the lengthening gather stays a saturated orange, so it has a silhouette against pearl
      hh = min(hh, capK);
    #endif
    vec3 em = heatRamp(hh, uAmber, uOrange) * (uClip > 1.5 ? 0.5 : 1.);
    #ifdef MORPH
      float young = 1. - smoothstep(0.62, 1., capK);
      // the young gather has form: deep amber at the hanging tip, orange in its belly, white-hot under the pipe, nine ribs, a deeper limb
      float starK = smoothstep(210., 370., distance(cameraPosition, vWP));       // seen from far down the canal it is the orange star: one saturated orange, not a pale teardrop
      hk = mix(h, smoothstep(0., 0.3, h), starK);                                // from that far, whatever of it is warm at all burns as one
      vec3 yc = mix(vec3(0.75, 0.16, 0.02), uOrange * 1.6, smoothstep(0., 0.55, vT));
      yc = mix(yc, vec3(1., 0.8, 0.5) * 4., smoothstep(0.78, 1., vT) * (1. - starK));
      float rib = cos(atan(vAx.y, abs(vAx.x) < 1e-4 ? 1e-4 : vAx.x) * 9. + vT * 5.);
      yc *= (0.4 + 0.6 * ndv * ndv) * (0.6 + 0.4 * rib) * (0.88 + 0.24 * skin);
      yc = mix(yc, uOrange * vec3(1., 0.62, 0.5) * (0.9 + 0.3 * smoothstep(0., 0.7, vT)), starK * 0.94);
      em = mix(yc * hk * (uClip > 1.5 ? 0.5 : 1.), em, 1. - young);
      em += mix(vec3(1.0, 0.78, 0.5), uOrange * 0.12, starK) * fres * 2.0 * hk * young * (uClip > 1.5 ? 0.4 : 1.);
      hotKeep = hk * young * (uClip > 1.5 ? 0.65 : mix(0.38, 0.985, starK));      // hot glass shines through the fog: it keeps its orange at 300 m, and is the star at 450
    #endif
    col = col * (1. - 0.9 * smoothstep(0.1, 0.7, hk)) + em;
  }
  #ifdef MORPH
    #ifdef FOG_EXP2
      if (uClip > 1.5) {                                                          // the mirror image sinks into the lagoon, but hot glass keeps its heat: a wavering orange streak, never a white ghost
        float fq = fogDensity * vFogDepth * 1.3, fm = clamp(0.22 + 1.3 * (1. - exp(-fq * fq)), 0., 0.86);
        col = mix(col, mix(uLagoon, uFogCol, 0.4) * 0.84, fm * (1. - 0.7 * h));
        col = mix(col, uOrange * 0.5, smoothstep(0.3, 0.6, h) * fm * 0.6);
      }
    #endif
  #endif
  // into the fog lid
  col = mix(col, uFogCol, smoothstep(uLid - 14., uLid + 26., abs(vWP.y)) * 0.92 * (1. - steelKeep));
  gl_FragColor = vec4(max(col, 0.), uOpacity);
  #include <fog_fragment>
  gl_FragColor.rgb = mix(gl_FragColor.rgb, max(col, 0.), max(hotKeep, steelKeep));
}`;

// Shared uniform block: one per city, so sun, fog tint, lagoon tint, time and caustics move together.
export function makeGlassUniforms(palette = DEFAULT_PALETTE, o = {}) {
  const pal = palette && palette.length >= 7 ? palette : DEFAULT_PALETTE;
  const sd = o.sunDir ? (o.sunDir.isVector3 ? o.sunDir.clone() : new THREE.Vector3().fromArray(o.sunDir)) : new THREE.Vector3(-0.80, 0.22, -0.56);
  return {
    uTime: { value: 0 },
    uSunDir: { value: sd.normalize() },
    uSunCol: { value: new THREE.Color(o.sunColor || '#fff0d2').multiplyScalar(1.15) },
    uFogCol: { value: new THREE.Color(pal[0]) },
    uLagoon: { value: new THREE.Color(pal[1]).lerp(new THREE.Color(pal[0]), 0.25) },
    uCausticCol: { value: new THREE.Color(pal[3]) },
    uCausticAmp: { value: 0 },
    uAmber: { value: new THREE.Color(pal[4]) },
    uOrange: { value: new THREE.Color(pal[5]) },
    uLid: { value: o.lid ?? 110 },
  };
}

export function makeGlassMaterial(o = {}) {
  const shared = o.shared || makeGlassUniforms(o.palette, o);
  const uniforms = THREE.UniformsUtils.merge([THREE.UniformsLib.fog]);
  for (const k of Object.keys(shared)) uniforms[k] = shared[k];          // shared by reference
  Object.assign(uniforms, {
    uTint: { value: new THREE.Color(o.color ?? '#8EC9B8') },
    uThick: { value: o.thickness ?? 0.35 }, uInterior: { value: o.interior ?? 0 }, uCore: { value: o.core ?? 0 },
    uHeatAll: { value: o.heat ?? 0 }, uCausticGain: { value: o.caustic ?? 1 }, uOpacity: { value: o.opacity ?? 1 },
    uClip: { value: o.clip ?? 0 }, uSteel: { value: o.steel ? 1 : 0 }, uLift: { value: o.lift ?? 0 }, uRim: { value: o.rim ?? 1 }, uSpec: { value: o.spec ?? 1 },
  });
  if (o.extraUniforms) for (const k of Object.keys(o.extraUniforms)) uniforms[k] = o.extraUniforms[k];
  if (o.city) for (const k of Object.keys(o.city)) uniforms[k] = o.city[k];          // city block, shared by reference
  const defines = {};
  if (o.morph) defines.MORPH = 1;
  if (o.city) defines.CITY = 1;
  if (o.selfMirror) defines.SELFMIRROR = 1;
  const mat = new THREE.ShaderMaterial({
    uniforms, vertexShader: GLASS_VERT, fragmentShader: GLASS_FRAG, fog: true,
    vertexColors: !!o.vertexColors, side: o.side ?? THREE.FrontSide,
    transparent: !!o.transparent, depthWrite: !o.transparent,
    defines,
  });
  return mat;
}

// ---------------------------------------------------------------- geometry helpers
class Geo {
  constructor() { this.p = []; this.c = []; this.th = []; this.m = []; this.i = []; }
  get n() { return this.p.length / 3; }
  v(x, y, z, col, thick, t = 0, k = 1, cap = 0) {
    this.p.push(x, y, z); this.c.push(col.r, col.g, col.b); this.th.push(thick); this.m.push(t, k, cap);
    return this.n - 1;
  }
  build(morph) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    g.setAttribute('thick', new THREE.Float32BufferAttribute(this.th, 1));
    if (morph) g.setAttribute('aMorph', new THREE.Float32BufferAttribute(this.m, 3));
    g.setIndex(this.i);
    g.computeVertexNormals();
    return g;
  }
  async buildAsync(morph, tick) {                            // the same geometry as build(), made in short steps
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    await tick();
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    g.setAttribute('thick', new THREE.Float32BufferAttribute(this.th, 1));
    await tick();
    if (morph) g.setAttribute('aMorph', new THREE.Float32BufferAttribute(this.m, 3));
    g.setIndex(this.i);
    await tick();
    g.computeVertexNormals();
    return g;
  }
}

// densify a list of [y, r, thick] keys to at most `dy` between rings, then soften the corners
function densify(keys, dy, smooth = 1) {
  const out = [];
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i], b = keys[i + 1];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const n = Math.max(1, Math.ceil(len / dy));
    for (let j = 0; j < n; j++) { const f = j / n; out.push([lerp(a[0], b[0], f), lerp(a[1], b[1], f), lerp(a[2], b[2], f)]); }
  }
  out.push(keys[keys.length - 1].slice());
  for (let s = 0; s < smooth; s++) {
    const prev = out.map((q) => q[1]);
    for (let i = 1; i < out.length - 1; i++) out[i][1] = prev[i] * 0.5 + (prev[i - 1] + prev[i + 1]) * 0.25;
  }
  return out;
}

// lathe about a vertical axis at (cx, cz). prof: [[y, r, thick]]. o.mod(theta, y, r) -> r, o.twist(y) -> radians,
// o.col(y, theta, r) -> Color, o.mk(x, y, z) -> [t, k, cap] morph data.
function lathe(G, prof, segs, o = {}) {
  const base = G.n, cx = o.cx || 0, cz = o.cz || 0;
  for (let i = 0; i < prof.length; i++) {
    const [y, r0, th] = prof[i];
    const tw = o.twist ? o.twist(y) : 0;
    for (let j = 0; j < segs; j++) {
      const a = (j / segs) * Math.PI * 2;
      const r = o.mod ? o.mod(a, y, r0) : r0;
      const x = cx + Math.sin(a + tw) * r, z = cz + Math.cos(a + tw) * r;
      const mk = o.mk ? o.mk(x, y, z) : [0, 1, 0];
      G.v(x, y, z, o.col ? o.col(y, a, r) : o.color, o.thick ? o.thick(a, y, th) : th, mk[0], mk[1], mk[2]);
    }
  }
  for (let i = 0; i < prof.length - 1; i++) for (let j = 0; j < segs; j++) {
    const a = base + i * segs + j, b = base + i * segs + (j + 1) % segs, c = a + segs, d = b + segs;
    G.i.push(a, b, c, b, d, c);
  }
}

// tube along a list of points (open), radius r(s)
function tube(G, pts, rad, radial, o = {}) {
  const base = G.n, n = pts.length, up = new THREE.Vector3(), T = new THREE.Vector3(), N = new THREE.Vector3(), B = new THREE.Vector3();
  const ref = o.ref || new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < n; i++) {
    const p = pts[i], a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    T.subVectors(b, a).normalize();
    up.copy(ref); if (Math.abs(up.dot(T)) > 0.95) up.set(1, 0, 0);
    N.crossVectors(up, T).normalize(); B.crossVectors(T, N).normalize();
    const s = i / (n - 1), r = typeof rad === 'function' ? rad(s) : rad;
    for (let j = 0; j < radial; j++) {
      const a2 = (j / radial) * Math.PI * 2 + (o.twist ? o.twist * s : 0), ca = Math.cos(a2) * r, sa = Math.sin(a2) * r;
      const x = p.x + N.x * ca + B.x * sa, y = p.y + N.y * ca + B.y * sa, z = p.z + N.z * ca + B.z * sa;
      const mk = o.mk ? o.mk(x, y, z) : [0, 1, 0];
      G.v(x, y, z, o.col ? o.col(s, j) : o.color, typeof o.thick === 'function' ? o.thick(s) : (o.thick ?? 1), mk[0], mk[1], mk[2]);
    }
  }
  for (let i = 0; i < n - 1; i++) for (let j = 0; j < radial; j++) {
    const a = base + i * radial + j, b = base + i * radial + (j + 1) % radial, c = a + radial, d = b + radial;
    G.i.push(a, b, c, b, d, c);
  }
  if (o.caps) for (const end of [0, n - 1]) {
    const p = pts[end], mk = o.mk ? o.mk(p.x, p.y, p.z) : [0, 1, 0];
    const ci = G.v(p.x, p.y, p.z, o.col ? o.col(end ? 1 : 0, 0) : o.color, 1, mk[0], mk[1], mk[2]);
    for (let j = 0; j < radial; j++) {
      const a = base + end * radial + j, b = base + end * radial + (j + 1) % radial;
      if (end) G.i.push(a, b, ci); else G.i.push(a, ci, b);
    }
  }
}

// squashed blob (prunt, bead, knob) centred at c, radii (rx, ry, rz) in a frame whose z axis is `out`
function blob(G, c, out, rx, ry, rz, o = {}) {
  const base = G.n, lat = o.lat || 5, lon = o.lon || 8;
  const zA = out.clone().normalize(), xA = new THREE.Vector3(0, 1, 0).cross(zA);
  if (xA.lengthSq() < 1e-6) xA.set(1, 0, 0); xA.normalize();
  const yA = new THREE.Vector3().crossVectors(zA, xA);
  for (let i = 0; i <= lat; i++) {
    const ph = (i / lat) * Math.PI, sp = Math.sin(ph), cp = Math.cos(ph);
    for (let j = 0; j < lon; j++) {
      const a = (j / lon) * Math.PI * 2, lx = Math.cos(a) * sp * rx, ly = Math.sin(a) * sp * ry, lz = cp * rz;
      const x = c.x + xA.x * lx + yA.x * ly + zA.x * lz, y = c.y + xA.y * lx + yA.y * ly + zA.y * lz, z = c.z + xA.z * lx + yA.z * ly + zA.z * lz;
      const mk = o.mk ? o.mk(x, y, z) : [0, 1, 0];
      G.v(x, y, z, o.color, o.thick ?? 1, mk[0], mk[1], mk[2]);
    }
  }
  for (let i = 0; i < lat; i++) for (let j = 0; j < lon; j++) {
    const a = base + i * lon + j, b = base + i * lon + (j + 1) % lon, c2 = a + lon, d = b + lon;
    G.i.push(a, c2, b, b, c2, d);
  }
}

// ---------------------------------------------------------------- the tower
async function buildTower(rng, cols, V, tick) {
  const G = new Geo();
  const { glass, deep, pale, milk } = cols;
  const nRib = V.nRib, twistTurns = V.twist, nCol = V.nCol;
  // outer envelope radius by height: used to tuck inner parts inside the teardrop while it is still a gather
  const env = [[0, 8], [1.2, 7.8], [3.5, 5.6], [5, 6.5], [7, 5.4], [57, 4.8], [60.3, 6.9], [62.4, 5.7], [74, 5.7], [76.6, 6.7], [78.2, 4.5], [83.3, 4.7], [84.2, 4.0], [92.5, 1.3], [94.6, 1.9], [97, 1.9]];
  const envR = (y) => {
    if (y <= 0) return env[0][1];
    for (let i = 0; i < env.length - 1; i++) if (y <= env[i + 1][0]) return lerp(env[i][1], env[i + 1][1], (y - env[i][0]) / (env[i + 1][0] - env[i][0]));
    return env[env.length - 1][1];
  };
  const mk = (x, y, z) => [clamp(y / TOP, 0, 1), clamp(Math.hypot(x, z) / envR(y), 0, 1.12), 0];
  const mkCap = (x, y, z) => [0, clamp(Math.hypot(x, z) / 8, 0, 1), 1];
  const tmp = new THREE.Color();
  // colour: the body glass, deeper where thick, paler high up; faint streaks so it is never one flat tint
  const bodyCol = (y, a, r) => {
    const s = 0.5 + 0.5 * Math.sin(a * 3 + y * 0.21) * Math.sin(a * 7 - y * 0.13);
    return tmp.copy(glass).lerp(deep, 0.25 * s).lerp(pale, 0.10 * sst(40, 95, y)).clone();
  };
  const shaftTwist = (y) => twistTurns * Math.PI * 2 * sst(4, 60, y);
  const ribs = (amp, n, sharp = 1) => (a, y, r) => {
    const c = 0.5 + 0.5 * Math.cos(a * n);
    return r + amp(y) * (Math.pow(c, sharp) - 0.35);
  };

  // 1 bottom cap (a hemisphere while it is a gather, a flat sole once it stands in the water)
  lathe(G, [[0.0, 0.01, 1], [0.0, 1.4, 1], [0.0, 2.8, 1], [0.0, 4.2, 1], [0.0, 5.6, 1], [0.0, 6.7, 1], [0.0, 7.4, 1]], 48, { color: deep, mk: mkCap });

  // 2 goblet foot with a rolled rim, merese knop and bead
  const footKeys = [[0.0, 7.4, 0.9], [0.3, 7.9, 1], [0.75, 8.0, 1], [1.15, 7.7, 0.9], [1.5, 7.0, 0.6], [2.2, 6.0, 0.4], [3.2, 5.4, 0.35], [4.0, 5.3, 0.5],
    [4.4, 6.0, 0.9], [5.0, 6.45, 1], [5.6, 6.0, 0.9], [6.0, 5.3, 0.5], [6.3, 5.75, 0.9], [6.7, 5.75, 0.9], [7.0, 5.25, 0.3]];
  lathe(G, densify(footKeys, 0.4, 1), 72, { col: bodyCol, mk, mod: (a, y, r) => r + 0.16 * sst(1.3, 2.2, y) * (1 - sst(3.0, 4.0, y)) * Math.cos(a * nRib) });

  await tick();
  // 3 shaft: entasis, optic-mould ribs twisting up it, trailed rings
  const bands = V.bands;
  const shaftR = (y) => 5.25 - 0.62 * Math.pow(clamp((y - 7) / 50, 0, 1), 1.35);
  const shaftKeys = [];
  for (let y = 7; y <= 57.001; y += 1.0) {
    let r = shaftR(y), th = 0.12;
    for (const b of bands) { const d = Math.abs(y - b); if (d < 0.75) { r += 0.42 * (1 - (d / 0.75) * (d / 0.75)); th = 0.9; } }
    shaftKeys.push([Math.min(y, 57), r, th]);
  }
  const nearBand = (y) => bands.some((b) => Math.abs(y - b) < 0.8);
  lathe(G, shaftKeys, 96, {
    mk, twist: shaftTwist,
    mod: (a, y, r) => (nearBand(y) ? r : ribs(() => 0.26, nRib, 1.6)(a, y, r)),
    thick: (a, y, th) => th + (nearBand(y) ? 0 : 0.5 * Math.pow(0.5 + 0.5 * Math.cos(a * nRib), 2)),
    col: (y, a, r) => (nearBand(y) ? milk.clone() : bodyCol(y, a, r)),
  });

  await tick();
  // 4 lower cornice with a pincered frill, belfry floor and a little pedestal in the middle
  const frill = (y0, y1, amp, n) => (a, y, r) => r + amp * sst(y0, (y0 + y1) / 2, y) * (1 - sst((y0 + y1) / 2, y1, y)) * (Math.abs(Math.sin(a * n * 0.5)) - 0.4);
  const corn1 = [[57, 4.63, 0.3], [58, 4.9, 0.6], [59, 5.6, 0.8], [59.8, 6.5, 1], [60.3, 6.75, 1], [60.8, 6.4, 0.9], [61.3, 5.7, 0.6], [62.0, 5.55, 0.5], [62.4, 5.6, 0.6],
    [62.45, 5.2, 0.5], [62.55, 2.4, 0.4], [62.9, 1.3, 0.7], [63.6, 1.0, 1], [64.0, 0.6, 1], [64.2, 0.02, 1]];
  lathe(G, densify(corn1, 0.45, 1), 96, { col: bodyCol, mk, mod: frill(58.8, 61.6, 0.7, V.frill) });

  await tick();
  // 5 belfry arcade: twisted columns, pointed arches, rails
  const RC = 4.95, yBase = 62.4, yCap = 70.0, yCeil = 73.7;
  const colProf = densify([[yBase, 0.82, 1], [yBase + 0.3, 0.86, 1], [yBase + 0.6, 0.62, 1], [yBase + 0.9, 0.5, 1], [yBase + 3.8, 0.56, 1], [yCap - 0.9, 0.48, 1], [yCap - 0.5, 0.62, 1], [yCap - 0.15, 0.85, 1], [yCap + 0.15, 0.85, 1], [yCap + 0.4, 0.6, 1]], 0.9, 0);
  for (let i = 0; i < nCol; i++) {
    const a = (i / nCol) * Math.PI * 2;
    lathe(G, colProf, 10, {
      cx: Math.sin(a) * RC, cz: Math.cos(a) * RC, mk, twist: (y) => (y - yBase) * 0.9 * V.dir,
      mod: (th, y, r) => r + 0.07 * Math.cos(th * 5) * sst(yBase + 0.8, yBase + 1.4, y) * (1 - sst(yCap - 1.2, yCap - 0.6, y)),
      col: (y, th) => (Math.cos(th * 5) > 0.3 && y > yBase + 0.9 && y < yCap - 0.9 ? milk.clone() : deep.clone()),
    });
    const a1 = ((i + 1) / nCol) * Math.PI * 2, pts = [], rail = [];
    for (let s = 0; s <= 14; s++) {
      const f = s / 14, th = lerp(a, a1, f), e = Math.abs(2 * f - 1);
      const y = yCap + 0.3 + (yCeil - yCap - 0.5) * Math.pow(Math.max(1 - Math.pow(e, 1.7), 0), 0.6);
      pts.push(new THREE.Vector3(Math.sin(th) * RC, y, Math.cos(th) * RC));
    }
    tube(G, pts, (s) => 0.4 - 0.1 * Math.sin(s * Math.PI), 7, { color: glass, thick: 0.9, mk });
    for (let s = 0; s <= 5; s++) { const th = lerp(a, a1, s / 5); rail.push(new THREE.Vector3(Math.sin(th) * (RC + 0.25), yBase + 1.55, Math.cos(th) * (RC + 0.25))); }
    tube(G, rail, 0.15, 5, { color: milk, thick: 0.6, mk });
    for (let b = 1; b <= 3; b++) {
      const th = lerp(a, a1, b / 4), bx = Math.sin(th) * (RC + 0.25), bz = Math.cos(th) * (RC + 0.25);
      lathe(G, [[yBase, 0.16, 1], [yBase + 0.5, 0.3, 1], [yBase + 1.0, 0.12, 1], [yBase + 1.5, 0.2, 1]], 5, { cx: bx, cz: bz, color: glass, mk });
    }
    if (i % 3 === 2) await tick();
  }
  await tick();

  // 6 the bell hung in the belfry, with its clapper
  const bell = densify([[69.2, 1.5, 0.6], [66.4, 2.65, 0.7], [65.7, 3.0, 1], [65.6, 3.2, 1], [65.9, 3.15, 1], [66.6, 2.75, 0.6], [68.6, 2.1, 0.4], [70.4, 1.85, 0.4], [71.3, 1.35, 0.6], [71.7, 0.7, 1], [72.2, 0.38, 1], [yCeil, 0.34, 1]], 0.7, 1);
  lathe(G, bell, 28, { color: cols.bell, mk });
  blob(G, new THREE.Vector3(0, 65.2, 0), new THREE.Vector3(0, 1, 0), 0.55, 0.55, 0.7, { color: deep, mk, lat: 5, lon: 8 });
  tube(G, [new THREE.Vector3(0, 65.6, 0), new THREE.Vector3(0, 69.4, 0)], 0.14, 5, { color: deep, mk, ref: new THREE.Vector3(1, 0, 0) });
  return { G, mk, envR, bodyCol, shaftTwist, shaftR, ribs, frill, yCeil };
}

async function buildTowerTop(T, rng, cols, V, tick) {
  const { G, mk, bodyCol, shaftTwist, shaftR, frill, yCeil } = T;
  const { glass, deep, pale, milk } = cols;
  // 7 belfry ceiling, upper crimped cornice, attic drum with a bead
  const top1 = [[yCeil - 0.1, 0.5, 0.6], [yCeil, 5.3, 0.6], [74.3, 5.65, 0.8], [75.0, 5.6, 0.6], [75.6, 5.9, 0.9], [76.2, 6.4, 1], [76.7, 6.55, 1], [77.1, 6.1, 0.8], [77.6, 5.2, 0.5], [78.0, 4.6, 0.4],
    [78.2, 4.3, 0.2], [82.5, 4.1, 0.2], [82.8, 4.5, 0.9], [83.3, 4.65, 1], [83.8, 4.3, 0.8], [84.2, 3.9, 0.4]];
  lathe(G, densify(top1, 0.5, 1), 96, { col: bodyCol, mk, mod: frill(75.2, 77.9, 0.6, V.frill) });

  await tick();
  // 8 spire: concave cone or onion, ribbed and twisted, then the neck that wraps the pipe
  const spire = [];
  for (let i = 0; i <= 14; i++) {
    const s = i / 14, y = 84.2 + s * 8.3;
    let r = 1.15 + 2.75 * Math.pow(1 - s, V.onion ? 1.0 : 1.75);
    if (V.onion) r += 1.25 * Math.sin(Math.min(s * 1.6, 1) * Math.PI) * (1 - s);
    spire.push([y, r, 0.15 + 0.5 * s]);
  }
  const nSp = Math.max(8, Math.round(V.nRib * 0.75));
  lathe(G, spire, 72, {
    mk, twist: (y) => -V.dir * (y - 84.2) * 0.16,
    mod: (a, y, r) => r + 0.2 * (r / 3.9) * (Math.pow(0.5 + 0.5 * Math.cos(a * nSp), 1.5) - 0.3),
    thick: (a, y, th) => th + 0.5 * Math.pow(0.5 + 0.5 * Math.cos(a * nSp), 2),
    col: (y, a, r) => bodyCol(y, a, r).lerp(pale, 0.12),
  });
  const neck = [[92.5, 1.15, 0.8], [93.0, 1.0, 0.9], [93.5, 1.05, 1], [93.9, 1.4, 1], [94.4, 1.8, 1], [94.9, 1.95, 1], [95.5, 1.9, 1], [96.2, 1.75, 1], [96.6, 1.56, 1]];
  lathe(G, densify(neck, 0.35, 1), 40, { color: deep, mk, mod: (a, y, r) => r + 0.06 * Math.sin(a * 5 + y * 3) });

  await tick();
  // 9 prunts: raspberry roundels spiralling up the shaft between the trailed rings, bullseyes on the drum
  const out = new THREE.Vector3(), c = new THREE.Vector3();
  const tiers = V.pruntTiers, per = Math.max(4, Math.round(V.nRib / 2));
  for (let ti = 0; ti < tiers; ti++) {
    const y = 12 + (ti + 0.5) * (44 / tiers) + rng.range(-0.6, 0.6);
    if (V.bands.some((b) => Math.abs(y - b) < 1.6)) continue;
    for (let j = 0; j < per; j++) {
      const a = (j / per) * Math.PI * 2 + shaftTwist(y) + ti * 0.37, r = shaftR(y) + 0.12;
      out.set(Math.sin(a), 0, Math.cos(a)); c.copy(out).multiplyScalar(r); c.y = y;
      const big = (ti + j) % 2 === 0;
      blob(G, c, out, big ? 0.62 : 0.4, big ? 0.9 : 0.4, 0.3, { color: big ? pale : milk, thick: 0.7, mk, lat: 4, lon: 8 });
    }
  }
  await tick();
  for (let j = 0; j < 8; j++) {
    const a = (j / 8) * Math.PI * 2 + 0.2; out.set(Math.sin(a), 0, Math.cos(a)); c.copy(out).multiplyScalar(4.22); c.y = 80.3;
    blob(G, c, out, 0.62, 1.1, 0.26, { color: pale, thick: 0.6, mk, lat: 4, lon: 8 });
  }
  // finial beads on the upper cornice, one over each column
  for (let i = 0; i < V.nCol; i++) {
    const a = ((i + 0.5) / V.nCol) * Math.PI * 2; out.set(Math.sin(a), 0, Math.cos(a)); c.copy(out).multiplyScalar(5.45); c.y = 78.45;
    lathe(G, [[77.75, 0.3, 1], [78.0, 0.42, 1], [78.3, 0.2, 1], [78.6, 0.34, 1], [78.9, 0.36, 1], [79.3, 0.05, 1]], 6, { cx: c.x, cz: c.z, color: milk, mk });
  }
  await tick();
  return await G.buildAsync(true, tick);
}

// ---------------------------------------------------------------- steel: blowpipe and pontil
function buildSteel(rng, V, grey) {
  const G = new Geo();
  const col = (y) => grey;
  // blowpipe: 3 m thick, flanged collars, a wide heat shield just above the glass
  const keys = [[94.4, 1.3, 1], [95.2, 1.5, 0.9], [97.4, 1.5, 0.8], [97.5, 2.5, 0.8], [97.9, 2.7, 0.7], [98.3, 2.5, 0.7], [98.4, 1.5, 0.6]];
  let y = 98.4;
  while (y < PIPE_TOP - 6) {
    const seg = rng.range(9, 15), y1 = Math.min(y + seg, PIPE_TOP - 1), hot = clamp(0.6 - (y - 98) / 70, 0, 1);
    keys.push([y1 - 0.9, 1.5, hot], [y1 - 0.85, 1.82, hot], [y1 - 0.3, 1.82, hot], [y1 - 0.25, 1.62, hot], [y1 + 0.25, 1.62, hot], [y1 + 0.3, 1.5, hot]);
    y = y1 + 0.3;
  }
  keys.push([PIPE_TOP, 1.5, 0]);
  lathe(G, keys, 24, { color: grey, mod: (a, yy, r) => r + (r > 1.7 && r < 2.0 ? 0.07 * Math.cos(a * 12) : 0) });
  // pontil: a thinner rod from the upper right down to the rim of the ring
  const tip = V.pontilTip, dir = V.pontilDir, pts = [], L = (PIPE_TOP - tip.y) / dir.y;
  const side = new THREE.Vector3(0, 0, 1);
  const n = 72;
  for (let i = 0; i <= n; i++) pts.push(tip.clone().addScaledVector(dir, (i / n) * L));
  tube(G, pts, (s) => {
    const d = s * L, collar = Math.abs(((d + 4) % 13) - 6.5) > 6.0 ? 0.16 : 0;
    return 0.95 + collar * 1.9 + 0.3 * Math.exp(-d * 0.5);
  }, 12, { color: grey, thick: (s) => clamp(0.8 - s * 3, 0, 1), ref: side, caps: true });
  return G.build(false);
}

// ---------------------------------------------------------------- the hot ring on the pontil
function buildRing(rng, V, cols) {
  const G = new Geo(), pts = [], n = 112, R0 = RING_R + 1.05;
  const lump = [];
  for (let i = 0; i < 7; i++) lump.push([rng.range(0, Math.PI * 2), rng.range(0.1, 0.32), rng.range(0.15, 0.4)]);
  const minor = (a) => {
    let r = 1.0 + 0.05 * Math.sin(a * 9 + 1.3);
    for (const [la, amp, w] of lump) { let d = Math.abs(a - la) % (Math.PI * 2); d = Math.min(d, Math.PI * 2 - d); r += amp * Math.exp(-(d * d) / (w * w)); }
    return r;
  };
  for (let i = 0; i <= n; i++) {                      // seam at the bottom, under water
    const a = -Math.PI / 2 + (i / n) * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(a) * R0, RING_Y + Math.sin(a) * R0, RING_Z));
  }
  tube(G, pts, (s) => minor(s * Math.PI * 2), 14, {
    ref: new THREE.Vector3(0, 0, 1), twist: V.dir * Math.PI * 6,
    col: (s, j) => (j % 7 === 0 ? cols.milk : cols.ringGlass), thick: 1,
  });
  // the punty: a wad of glass where the pontil holds the ring, and a few sagging drips on the lower inside
  const tip = V.pontilTip;
  blob(G, tip.clone().addScaledVector(V.pontilDir, -0.2), V.pontilDir, 1.5, 1.5, 1.1, { color: cols.ringGlass, lat: 6, lon: 10 });
  blob(G, tip.clone().addScaledVector(V.pontilDir, 1.0), V.pontilDir, 0.95, 0.95, 1.3, { color: cols.ringGlass, lat: 5, lon: 10 });
  for (let i = 0; i < 9; i++) {
    const a = rng.range(0.25, Math.PI - 0.25), len = rng.range(0.6, 2.1), r = R0 + 0.3;
    const c = new THREE.Vector3(Math.cos(a) * r, RING_Y + Math.sin(a) * r - 1.0 - len * 0.5, RING_Z + rng.range(-0.3, 0.3));
    if (i % 3 === 0) c.set(Math.cos(a) * (RING_R + 0.2), RING_Y + Math.sin(a) * (RING_R + 0.2) - len * 0.5, RING_Z);
    blob(G, c, new THREE.Vector3(0, -1, 0), 0.26, 0.26, len * 0.6, { color: cols.ringGlass, lat: 5, lon: 6 });
  }
  return G.build(false);
}

const FOG_K = /* glsl */`
  float fogK = 1.;
  #ifdef USE_FOG
    #ifdef FOG_EXP2
      fogK = exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
    #else
      fogK = 1. - smoothstep(fogNear, fogFar, vFogDepth);
    #endif
  #endif
`;

// molten membrane spun open inside the ring: an annulus whose inner radius is a uniform
function buildMembrane(shared, extra) {
  const segs = 96, rings = 7, pos = [], idx = [];
  for (let i = 0; i <= rings; i++) for (let j = 0; j <= segs; j++) pos.push((j / segs) * Math.PI * 2, i / rings, 0);
  for (let i = 0; i < rings; i++) for (let j = 0; j < segs; j++) { const a = i * (segs + 1) + j, b = a + 1, c = a + segs + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, RING_Y, RING_Z), 10);
  const uniforms = THREE.UniformsUtils.merge([THREE.UniformsLib.fog]);
  Object.assign(uniforms, { uTime: shared.uTime, uAmber: shared.uAmber, uOrange: shared.uOrange, uHole: extra.uHole, uSpin: extra.uSpin });
  const m = new THREE.ShaderMaterial({
    uniforms, fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide, forceSinglePass: true,
    vertexShader: /* glsl */`
      #include <common>
      #include <fog_pars_vertex>
      uniform float uTime, uHole, uSpin;
      varying vec2 vAF; varying vec3 vWP;
      void main(){
        float a = position.x, f = position.y;
        float wob = 1. + 0.035 * sin(a * 3. + uSpin * 2.) * (1. - f) + 0.02 * sin(a * 7. - uSpin * 3.) * (1. - f);
        float r = mix(uHole * wob, ${(RING_R + 0.35).toFixed(2)}, f);
        vec3 p = vec3(cos(a) * r, ${RING_Y.toFixed(2)} + sin(a) * r, ${(RING_Z + 0.35).toFixed(2)} + 0.25 * (1. - f) * sin(a * 2. + uSpin));
        vAF = vec2(a, f);
        vec4 wp = modelMatrix * vec4(p, 1.); vWP = wp.xyz;
        vec4 mvPosition = viewMatrix * wp;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      #include <common>
      #include <fog_pars_fragment>
      uniform float uTime, uHole, uSpin; uniform vec3 uAmber, uOrange;
      varying vec2 vAF; varying vec3 vWP;
      ${GLSL_COMMON}
      void main(){
        if (vWP.y < -0.1) discard;
        float f = vAF.y, a = vAF.x;
        float lip = 1. - smoothstep(0.0, 0.16, f);
        float swirl = vn2(vec2(a * 4. + uSpin * 1.5 + f * 5., f * 6. - uSpin * 0.4));
        float swirl2 = 0.5 + 0.5 * sin(a * 23. + f * 16. + uSpin * 6.);
        float h = clamp(0.62 + 0.3 * lip + 0.2 * swirl - 0.08 * swirl2, 0., 1.);
        vec3 col = heatRamp(h, uAmber, uOrange);
        float width = max(${RING_R.toFixed(1)} - uHole, 0.) / ${RING_R.toFixed(1)};
        float alpha = clamp(0.5 + 0.5 * lip + 0.25 * swirl, 0., 1.) * smoothstep(0.0, 0.05, width + lip * 0.2);
        gl_FragColor = vec4(col, alpha);
        #include <fog_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = 6;
  return mesh;
}

function quadGeo() {
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  return g;
}

// molten drips off the tower and drops flung off the ring: ballistic, velocity-stretched, additive
function buildMotes(rng, V, shared, extra, detail, girth = 1, dropScale = 1, dropCount = 1) {
  const nA = Math.round(26 * detail), nB = Math.round(22 * detail), nC0 = Math.round(90 * detail), nC = Math.round(nC0 * dropCount), n = nA + nB + nC;
  const hx = (k) => { const q = Math.sin(k * 91.7 + 13.3) * 43758.5453; return q - Math.floor(q); };       // the extra drops take no draws from rng: the rest of the hero keeps its seeds
  const o = new Float32Array(n * 3), v = new Float32Array(n * 3), s = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
    const kind = i < nA ? 0 : i < nA + nB ? 1 : 2;
    if (kind === 0) {                                   // off the hanging foot
      const a = rng.range(0, 6.283), r = Math.sqrt(rng()) * 3.2;
      o.set([Math.sin(a) * r * girth, rng.range(0, 0.5), Math.cos(a) * r * girth], i * 3); v.set([rng.range(-0.3, 0.3), rng.range(-2, 0), rng.range(-0.3, 0.3)], i * 3);
      s.set([rng(), rng.range(3.2, 5.5), rng.range(0.55, 1.0), 0], i * 4);
    } else if (kind === 1) {                            // off the lower cornice frill
      const a = rng.range(0, 6.283);
      o.set([Math.sin(a) * 6.7 * girth, 59.6, Math.cos(a) * 6.7 * girth], i * 3); v.set([Math.sin(a) * 0.5, rng.range(-1, 0), Math.cos(a) * 0.5], i * 3);
      s.set([rng(), rng.range(4.5, 7.5), rng.range(0.45, 0.8), 1], i * 4);
    } else {                                            // flung off the spinning ring
      const ex = i >= nA + nB + nC0, R9 = []; for (let k = 0; k < 9; k++) R9.push(ex ? hx(i * 9 + k) : rng());
      const a = 0.05 + R9[0] * (Math.PI - 0.1), r = RING_R + 2.0, sp = (7 + 8 * R9[1]) * V.dir, c1 = 1 + 4 * R9[3], c2 = 1 + 4 * R9[4];
      o.set([Math.cos(a) * r, RING_Y + Math.sin(a) * r, RING_Z - 0.4 + 0.8 * R9[2]], i * 3);
      v.set([-Math.sin(a) * sp + Math.cos(a) * c1, Math.cos(a) * sp + Math.sin(a) * c2 + 2, -2.5 + 7 * R9[5]], i * 3);
      s.set([R9[6], 2.2 + 2 * R9[7], (0.26 + 0.24 * R9[8]) * dropScale, 2], i * 4);
    }
  }
  const g = quadGeo();
  g.setAttribute('iO', new THREE.InstancedBufferAttribute(o, 3));
  g.setAttribute('iV', new THREE.InstancedBufferAttribute(v, 3));
  g.setAttribute('iS', new THREE.InstancedBufferAttribute(s, 4));
  g.instanceCount = n;
  const uniforms = THREE.UniformsUtils.merge([THREE.UniformsLib.fog]);
  Object.assign(uniforms, { uTime: shared.uTime, uAmber: shared.uAmber, uOrange: shared.uOrange, uFootY: extra.uFootY, uGate: extra.uGate, uSpinA: extra.uSpinA });
  const m = new THREE.ShaderMaterial({
    uniforms, fog: true, transparent: true, depthWrite: false,       // alpha, not additive: orange has to read against white fog
    vertexShader: /* glsl */`
      #include <common>
      #include <fog_pars_vertex>
      attribute vec3 iO, iV; attribute vec4 iS;
      uniform float uTime, uFootY, uSpinA; uniform vec3 uGate;
      varying vec2 vUv; varying float vA;
      void main(){
        float kind = iS.w, per = iS.y;
        float ph = fract(uTime / per + iS.x), tt = ph * per;
        vec3 o = iO; float gate = uGate.z;
        if (kind < 0.5) { o.y += uFootY; gate = uGate.x; }
        else if (kind < 1.5) { float c = cos(uSpinA), s = sin(uSpinA); o.xz = vec2(c * o.x + s * o.z, -s * o.x + c * o.z); gate = uGate.y; }
        vec3 vel = iV + vec3(0., -9.81 * tt, 0.);
        if (kind < 1.5) { tt = max(tt - per * 0.3, 0.); vel = iV + vec3(0., -9.81 * tt, 0.); }   // hang, then let go
        vec3 p = o + iV * tt + vec3(0., -4.905 * tt * tt, 0.);
        float alive = step(0.0, p.y) * gate;
        float grow = kind < 1.5 ? smoothstep(0., 0.3, ph) : smoothstep(0., 0.04, ph);
        vec4 mv = viewMatrix * modelMatrix * vec4(p, 1.);
        vec3 vv = mat3(viewMatrix) * mat3(modelMatrix) * vel;
        vec2 dir = vv.xy; float dl = length(dir); dir = dl > 1e-3 ? dir / dl : vec2(0., -1.);
        float w = iS.z * grow * (1. + max(-mv.z - 120., 0.) * 0.006);     // stay about a pixel wide far away
        float len = w * (1.6 + min(length(vel) * 0.22, 5.));
        mv.xy += dir * position.y * len + vec2(dir.y, -dir.x) * position.x * w;   // right-handed, or the quad is culled
        vUv = position.xy; vA = alive;
        vec4 mvPosition = mv;
        gl_Position = projectionMatrix * mv;
        if (alive < 0.5) gl_Position = vec4(2., 2., 2., 1.);
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      #include <common>
      #include <fog_pars_fragment>
      uniform vec3 uAmber, uOrange;
      varying vec2 vUv; varying float vA;
      void main(){
        float x = vUv.x, y = vUv.y;
        float wdt = mix(0.25, 1.0, smoothstep(-1., 0.7, y)) * (1. - smoothstep(0.75, 1., y));   // teardrop: fat head, thin tail
        float a = (1. - smoothstep(0.3, 1., abs(x) / max(wdt, 0.05))) * step(abs(y), 1.);
        ${FOG_K}
        vec3 col = mix(uOrange * 2.6, vec3(1., 0.72, 0.4) * 5.5, smoothstep(-0.1, 0.9, y) * (1. - abs(x)));
        gl_FragColor = vec4(col, a * vA * (0.3 + 0.7 * fogK));
        #include <fog_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = 8;
  return mesh;
}

// steam: hiss at the foot, the ring that rolls out across the basin at touch-down, puffs where drips land
function buildSteam(rng, shared, extra, detail, girth = 1) {
  const nH = Math.round(64 * detail), nR = Math.round(120 * detail), nP = Math.round(18 * detail), n = nH + nR + nP;
  const d = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
    const kind = i < nH ? 0 : i < nH + nR ? 1 : 2;
    const a = kind === 1 ? ((i - nH) / nR) * 6.2832 + rng.range(-0.02, 0.02) : rng.range(0, 6.2832);
    d.set([a, rng(), rng(), kind], i * 4);
  }
  const g = quadGeo();
  g.setAttribute('iD', new THREE.InstancedBufferAttribute(d, 4)); g.instanceCount = n;
  const uniforms = THREE.UniformsUtils.merge([THREE.UniformsLib.fog]);
  Object.assign(uniforms, { uTime: shared.uTime, uFogCol: shared.uFogCol, uOrange: shared.uOrange, uSunDir: shared.uSunDir, uSteam: extra.uSteam, uRing: extra.uRing, uWarm: extra.uWarm, uGirth: { value: girth } });
  const m = new THREE.ShaderMaterial({
    uniforms, fog: true, transparent: true, depthWrite: false,
    vertexShader: /* glsl */`
      #include <common>
      #include <fog_pars_vertex>
      attribute vec4 iD;
      uniform float uTime, uGirth; uniform vec3 uSteam, uRing;      // uSteam: hiss, puffs, - ; uRing: radius, alpha, size
      varying vec2 vUv; varying vec4 vP;                     // vP: alpha, seed, warm, rot
      void main(){
        float a = iD.x, kind = iD.w; vec3 p; float size, alpha, warm = 0.;
        if (kind < 0.5) {
          float ph = fract(uTime * (0.07 + 0.05 * iD.y) + iD.z);
          float r = (7.2 + 3.5 * iD.y) * uGirth + ph * (5. + 6. * iD.z);
          p = vec3(sin(a) * r, 0.8 + ph * ph * (9. + 9. * iD.y), cos(a) * r);
          size = (2.6 + 6.5 * ph) * (0.7 + 0.3 * uGirth); alpha = uSteam.x * sin(ph * 3.1416) * 0.62; warm = (1. - ph) * 0.8;
        } else if (kind < 1.5) {
          float r = uRing.x * (0.94 + 0.12 * iD.y) + 3. * sin(a * 5. + iD.z * 6.);
          size = uRing.z * (0.75 + 0.5 * iD.z);
          p = vec3(sin(a) * r, size * (0.45 + 0.25 * sin(uTime * 0.6 + iD.y * 6.28)), cos(a) * r);
          alpha = uRing.y * (0.55 + 0.45 * iD.y);
        } else {
          float ph = fract(uTime * (0.3 + 0.2 * iD.y) + iD.z);
          float r = 3.4 * uGirth * sqrt(iD.y);
          p = vec3(sin(a) * r, 0.5 + ph * 5., cos(a) * r);
          size = 1.2 + 4.5 * ph; alpha = uSteam.y * sin(ph * 3.1416) * 0.7; warm = 0.5;
        }
        vec4 mv = viewMatrix * modelMatrix * vec4(p, 1.);
        alpha *= smoothstep(3., 16., -mv.z);
        mv.xy += position.xy * size;
        vUv = position.xy; vP = vec4(alpha, iD.z, warm, uTime * (0.1 + 0.15 * iD.y) * (iD.z > 0.5 ? 1. : -1.) + a);
        vec4 mvPosition = mv;
        gl_Position = projectionMatrix * mv;
        if (alpha < 0.004) gl_Position = vec4(2., 2., 2., 1.);
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      #include <common>
      #include <fog_pars_fragment>
      uniform vec3 uFogCol, uOrange; uniform float uWarm;
      varying vec2 vUv; varying vec4 vP;
      ${GLSL_COMMON}
      void main(){
        float r = length(vUv);
        float c = cos(vP.w), s = sin(vP.w); vec2 q = vec2(c * vUv.x - s * vUv.y, s * vUv.x + c * vUv.y);
        float nz = vn2(q * 1.7 + vP.y * 31.) * 0.65 + vn2(q * 3.9 + vP.y * 17.) * 0.35;
        float a = (1. - smoothstep(0.25, 1., r + (nz - 0.5) * 0.7)) * vP.x;
        if (a < 0.004) discard;
        vec3 col = uFogCol * (0.8 + 0.3 * vUv.y + 0.14 * nz) * mix(vec3(0.92, 0.96, 1.04), vec3(1.), smoothstep(-0.6, 0.6, vUv.y));   // lit from above, blue-grey underneath: it reads against the pearl
        col += uOrange * uWarm * vP.z * (0.35 + 0.5 * (1. - r)) * 0.9;
        ${FOG_K}
        gl_FragColor = vec4(col, a * (0.45 + 0.55 * fogK));
        #include <fog_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = 7;
  return mesh;
}

// soft additive glows: the hot star of the gather and the halo of the ring (positions updated on the CPU)
function buildHalos(shared, count) {
  const g = quadGeo();
  const pos = new THREE.InstancedBufferAttribute(new Float32Array(count * 4), 4), col = new THREE.InstancedBufferAttribute(new Float32Array(count * 4), 4);
  pos.setUsage(THREE.DynamicDrawUsage); col.setUsage(THREE.DynamicDrawUsage);
  g.setAttribute('iP', pos); g.setAttribute('iC', col); g.instanceCount = count;
  const uniforms = THREE.UniformsUtils.merge([THREE.UniformsLib.fog]);
  const m = new THREE.ShaderMaterial({
    uniforms, fog: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */`
      #include <common>
      #include <fog_pars_vertex>
      attribute vec4 iP, iC;
      varying vec2 vUv; varying vec4 vC;
      void main(){
        vec4 mv = viewMatrix * modelMatrix * vec4(iP.xyz, 1.);
        float dist = max(length(mv.xyz), 1e-3);
        float pull = min(10., dist * 0.5);
        mv.xyz -= mv.xyz / dist * pull;                           // pull toward the eye so the glass does not cut the glow
        mv.xy += position.xy * iP.w * ((dist - pull) / dist);     // and keep its size on screen: close to, the ring's halo stays round the ring
        vUv = position.xy; vC = iC;
        vec4 mvPosition = mv;
        gl_Position = projectionMatrix * mv;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      #include <common>
      #include <fog_pars_fragment>
      varying vec2 vUv; varying vec4 vC;
      void main(){
        float r = length(vUv);
        float star = exp(-r * r * 9.) * 0.9 + exp(-r * 3.2) * 0.22;
        float rr = (r - 0.6) / 0.2; float ring = exp(-rr * rr) * 0.8 + exp(-r * r * 3.) * 0.15;
        float a = mix(star, ring, vC.a) * (1. - smoothstep(0.8, 1., r));
        ${FOG_K}
        gl_FragColor = vec4(vC.rgb * a * (0.25 + 0.75 * fogK), 1.);
      }`,
  });
  const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = 9;
  return { mesh, pos, col };
}

// the coloured shaft the tower throws through the fog: the swept shadow volume of the tower, drawn as soft sheets
function buildShaft(shared, extra, D, L, girth = 1) {
  const pos = [], hs = [], idx = [];
  const perp = new THREE.Vector3(-D.z, 0, D.x).normalize();
  const sheet = (w, flag) => {
    const b = pos.length / 3, ox = perp.x * w * 6.2 * girth, oz = perp.z * w * 6.2 * girth, N = 10;
    for (let i = 0; i <= N; i++) {                      // strips of constant tower height h, s from 0 to h
      const h = i / N;
      for (let j = 0; j <= 1; j++) {
        const s = j * h;
        pos.push(ox * (1 - 0.5 * h) + D.x * L * s, h * TOP + D.y * L * s, oz * (1 - 0.5 * h) + D.z * L * s); hs.push(h, s, flag ? 2 : w);
      }
    }
    for (let i = 0; i < N; i++) { const a = b + i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  };
  for (const w of [-1, -0.66, -0.33, 0, 0.33, 0.66, 1]) sheet(w, false);
  const nSheet = pos.length / 3, NS = 14;
  for (let i = 0; i < NS; i++) {                        // cross slices, seen only when looking along the shaft
    const sc = (i + 0.4) / NS * 0.92, b = pos.length / 3;
    for (const [w, h] of [[-1.3, sc], [1.3, sc], [1.3, 1], [-1.3, 1]]) {
      const k = w * 6.2 * girth * (1 - 0.5 * h);
      pos.push(perp.x * k + D.x * L * sc, h * TOP + D.y * L * sc, perp.z * k + D.z * L * sc); hs.push(h, sc, w);
    }
    idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
  }
  const typ = new Float32Array(pos.length / 3); typ.fill(1, nSheet);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aHS', new THREE.Float32BufferAttribute(hs, 3));
  g.setAttribute('aTyp', new THREE.Float32BufferAttribute(typ, 1)); g.setIndex(idx);
  const uniforms = THREE.UniformsUtils.merge([THREE.UniformsLib.fog]);
  const hd = new THREE.Vector3(D.x, 0, D.z).normalize();
  Object.assign(uniforms, { uTime: shared.uTime, uTowerCol: extra.uTowerCol, uLen: extra.uLen, uCool: extra.uCool, uShaft: extra.uShaft, uHD: { value: hd } });
  const m = new THREE.ShaderMaterial({
    uniforms, fog: true, transparent: true, depthWrite: false, blending: THREE.MultiplyBlending, side: THREE.DoubleSide, forceSinglePass: true,
    vertexShader: /* glsl */`
      #include <common>
      #include <fog_pars_vertex>
      attribute vec3 aHS; attribute float aTyp; uniform vec3 uHD;
      varying vec3 vHS; varying vec2 vNear;
      void main(){
        vHS = aHS;
        vec4 wp = modelMatrix * vec4(position, 1.);
        vec4 mvPosition = viewMatrix * wp;
        vec3 toC = cameraPosition - wp.xyz;
        vec3 hdW = normalize(mat3(modelMatrix) * uHD + vec3(0., 1e-5, 0.));
        float along = abs(dot(toC, hdW)) / max(length(toC), 1e-3);
        float fade = smoothstep(4., 22., -mvPosition.z);
        vNear = vec2(fade * (aTyp > 0.5 ? smoothstep(0.55, 0.95, along) : 1.), aTyp);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      #include <common>
      #include <fog_pars_fragment>
      uniform float uTime, uLen, uCool, uShaft; uniform vec3 uTowerCol;
      varying vec3 vHS; varying vec2 vNear;
      ${GLSL_COMMON}
      void main(){
        float h = vHS.x, s = vHS.y, w = vHS.z;
        float foot = 1. - uLen;
        float m = smoothstep(foot - 0.02, foot + 0.14, h) * (1. - smoothstep(0.78, 1., h)) * smoothstep(0.0, 0.04, s);
        m *= exp(-s * 1.1) * (1. - 0.8 * smoothstep(0.7, 1., s / max(h, 1e-3)));
        float lat = vNear.y > 0.5 ? 1. - smoothstep(0.7, 1.3, abs(w)) : 1. - smoothstep(0.7, 1.0, abs(w)) * 0.85;
        float streaks = vn2(vec2(h * 26., w * 1.5 + 3.)) * 0.55 + vn2(vec2(h * 9. + 7., s * 6. - uTime * 0.03)) * 0.45;
        m *= lat * (0.45 + 1.1 * streaks);
        float arc = smoothstep(0.63, 0.68, h) * (1. - smoothstep(0.75, 0.80, h));
        float heat = smoothstep(uCool - 0.2, uCool + 0.2, h);
        // coloured shade, not added light: inside the shaft the fog is lit only through the tower's glass
        vec3 tc = pow(clamp(uTowerCol, 0.01, 1.), vec3(0.42));
        vec3 col = mix(tc, vec3(1., 0.6, 0.27), heat);                         // the cooled glass throws its own clean colour, the hot glass orange
        col = mix(col, vec3(1.), arc * 0.3);
        ${FOG_K}
        float k = clamp(m * uShaft * (vNear.y > 0.5 ? 0.2 : 0.15) * vNear.x * (0.3 + 0.7 * fogK), 0., 1.);
        gl_FragColor = vec4(max(mix(vec3(1.), col, k), 0.), 1.);
      }`,
  });
  const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = 5;
  return mesh;
}

// basin water: pearl reflection, the tower's caustic and the ring's, hot glow under the gather.
// decal = true draws only the coloured light, additively, to lay over the world's own water.
function buildWater(shared, extra, radius, decal, D, girth = 1) {
  const g = new THREE.CircleGeometry(radius, 72); g.rotateX(-Math.PI / 2);
  const uniforms = THREE.UniformsUtils.merge([THREE.UniformsLib.fog]);
  const hl = Math.hypot(D.x, D.z);
  Object.assign(uniforms, {
    uTime: shared.uTime, uSunDir: shared.uSunDir, uSunCol: shared.uSunCol, uFogCol: shared.uFogCol, uLagoon: shared.uLagoon, uOrange: shared.uOrange,
    uTowerCol: extra.uTowerCol, uLen: extra.uLen, uCool: extra.uCool, uShaft: extra.uShaft, uU: extra.uU, uGlow: extra.uGlow, uRingHeat: extra.uRingHeat,
    uShadow: { value: new THREE.Vector3(D.x / hl, D.z / hl, -D.y / hl) }, uD: { value: D.clone() }, uRadius: { value: radius }, uDecal: { value: decal ? 1 : 0 }, uGirth: { value: girth },
  });
  const m = new THREE.ShaderMaterial({
    uniforms, fog: true, transparent: true, depthWrite: false,
    vertexShader: /* glsl */`
      #include <common>
      #include <fog_pars_vertex>
      varying vec3 vWP; varying vec2 vLP;
      void main(){
        vLP = position.xz;
        vec4 wp = modelMatrix * vec4(position, 1.); vWP = wp.xyz;
        vec4 mvPosition = viewMatrix * wp;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      #include <common>
      #include <fog_pars_fragment>
      uniform float uTime, uLen, uCool, uShaft, uU, uRadius, uDecal, uRingHeat, uGirth;
      uniform vec3 uSunDir, uSunCol, uFogCol, uLagoon, uOrange, uTowerCol, uShadow, uD, uGlow;
      varying vec3 vWP; varying vec2 vLP;
      ${GLSL_COMMON}
      float wave(vec2 p){ return vn2(p * 0.33 + uTime * vec2(0.28, 0.17)) * 0.62 + vn2(p * 1.07 - uTime * vec2(0.22, 0.37)) * 0.38; }
      float towerR(float y){
        float r = mix(5.4, 4.8, smoothstep(7., 57., y));
        r = mix(8., r, smoothstep(0., 4.5, y));
        float a = (y - 60.3) / 1.3, b = (y - 76.5) / 1.3;
        r += 1.9 * exp(-a * a) + 1.8 * exp(-b * b);
        r = mix(r, 5.6, smoothstep(62., 63., y) * (1. - smoothstep(74., 75., y)));
        r = mix(r, 4.2, smoothstep(77.6, 78.6, y));
        r = mix(r, 1.3, smoothstep(84., 93., y));
        return r;
      }
      void main(){
        vec2 p = vLP;
        vec3 toCam = cameraPosition - vWP; float dist = length(toCam);
        vec3 V = toCam / max(dist, 1e-3);
        float k = 0.55 * (1. - smoothstep(50., 320., dist)) + 0.06;
        float w0 = wave(p), wx = wave(p + vec2(0.4, 0.)), wz = wave(p + vec2(0., 0.4));
        vec3 n = normalize(vec3((w0 - wx) * k, 1., (w0 - wz) * k));
        float ndv = clamp(dot(n, V), 0., 1.);
        float fres = pow(1. - ndv, 5.);
        vec3 R = reflect(-V, n);
        vec3 L = normalize(uSunDir);
        float sd = max(dot(R, L), 0.);
        vec3 sky = uFogCol * (0.86 + 0.08 * R.y);
        vec3 col = mix(uLagoon * 0.5, sky, 0.3 + 0.7 * fres) + uSunCol * (pow(sd, 260.) * 7. + pow(sd, 14.) * 0.22);
        // the tower's light on the water: its own shape laid down-sun, in its own colours, as a crawling net
        float s = dot(p, uShadow.xy), c = dot(p, vec2(-uShadow.y, uShadow.x));
        float hy = s * uShadow.z, yFoot = 95. * (1. - uLen);
        float Rt = mix(5.2, towerR(hy), smoothstep(0.5, 0.8, uU)) * uGirth;
        float m = (1. - smoothstep(Rt - 2.6, Rt + 3.2 + s * 0.015, abs(c) + (wave(p * 0.4) - 0.5) * 3.)) * smoothstep(0., 4., s) * smoothstep(yFoot - 1.5, yFoot + 1.5, hy) * (1. - smoothstep(92., 97., hy));
        float colm = 0.5 + 0.5 * cos(c * 2.1);
        m *= mix(1., 0.45 + 0.55 * colm, smoothstep(62.5, 63.5, hy) * (1. - smoothstep(72.5, 73.7, hy)));
        float heat = smoothstep(uCool - 0.17, uCool + 0.15, hy / 95.);
        vec3 lc = mix(pow(clamp(uTowerCol, 0.01, 1.), vec3(0.75)) * 1.6, uOrange * 1.8, heat);
        float net = caustic2(p * 0.3 + n.xz * 1.5, uTime);
        float cov = m * uShaft;
        vec3 tintC = mix(pow(clamp(uTowerCol, 0.01, 1.), vec3(0.6)), vec3(1., 0.55, 0.22), heat);
        col *= mix(vec3(1.), tintC, cov * 0.72);
        vec3 light = lc * net * cov * 0.75;
        // the ring's light: an ellipse of hot orange down-sun of it
        float dz = abs(uD.z) < 0.05 ? 0.05 : uD.z;
        float kk = (p.y - ${RING_Z.toFixed(1)}) / dz;
        vec2 q = vec2(p.x - uD.x * kk, -uD.y * kk - ${RING_Y.toFixed(1)});
        float rr = (length(q) - ${(RING_R + 1.05).toFixed(2)}) / 2.8;           // wide and soft: seen at a grazing angle a thin outline would be a hairline
        light += uOrange * 0.9 * exp(-rr * rr) * step(0., kk) * (0.3 + net) * uRingHeat * uShaft;
        // glow of hot glass close over the water
        float gd = dot(p, p) / max(uGlow.y * uGlow.y * uGirth * uGirth, 1.);
        light += uOrange * uGlow.x * exp(-gd) * (0.6 + 0.5 * w0);
        vec2 rq = p - vec2(0., ${RING_Z.toFixed(1)});
        light += uOrange * uRingHeat * 0.3 * exp(-dot(rq, rq) / 260.) * (0.6 + 0.5 * w0);
        float rim = 1. - smoothstep(uRadius * 0.82, uRadius * 0.99, length(p));
        ${FOG_K}
        if (uDecal > 0.5) {
          float a = clamp(cov * 0.72 + dot(light, vec3(0.4)), 0., 1.) * rim;
          vec3 wcol = mix(uLagoon * 0.42, sky, 0.12 + 0.45 * fres);               // the water's own depth under the tint: coloured shade, never a pale wash
          gl_FragColor = vec4(max((wcol * tintC * cov * 0.72 + light) / max(a, 0.05), 0.), a * fogK);
        }
        else {
          float graze = 1. - clamp(V.y, 0., 1.); graze *= graze;
          float alpha = clamp(0.93 - 0.7 * graze, 0.2, 0.93) * rim;
          gl_FragColor = vec4(max(col + light, 0.), alpha);
          #include <fog_fragment>
        }
      }`,
  });
  const mesh = new THREE.Mesh(g, m); mesh.renderOrder = 2; mesh.position.y = decal ? 0.03 : 0;
  return mesh;
}

// ---------------------------------------------------------------- the hero
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('blown-city-hero') : ctx.rng;
  const pal = opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE;
  const detail = ctx.quality?.detail ?? 1, girth = opts.girth ?? 1;
  const C = (h) => new THREE.Color(h);

  // ----- per-seed variety
  const castRoll = rng();
  const towerHex = opts.towerColor || (castRoll < 0.62 ? pal[3] : castRoll < 0.81 ? pal[2] : '#0f8f5c');
  const dir = rng.sign();
  const nCol = rng.pick([6, 8, 8, 10]);
  const nBands = rng.int(2, 4), bands = [];
  for (let i = 0; i < nBands; i++) bands.push(Math.round(14 + ((i + 0.5) / nBands) * 38 + rng.range(-2.5, 2.5)));
  const psi = rng.range(0.92, 1.08), phi = rng.range(0.85, 1.12);
  const V = {
    dir, nCol, bands, nRib: rng.pick([12, 16, 16, 20]), twist: dir * rng.range(0.25, 0.7), frill: nCol * rng.pick([2, 3]),
    pruntTiers: rng.int(3, 5), onion: rng.chance(0.35),
    pontilTip: new THREE.Vector3(Math.cos(phi) * (RING_R + 2.6), RING_Y + Math.sin(phi) * (RING_R + 2.6), RING_Z),
    pontilDir: new THREE.Vector3(Math.cos(psi), Math.sin(psi), -0.07).normalize(),
  };
  const glass = C(towerHex);
  const cols = {
    glass, deep: glass.clone().multiplyScalar(0.55), pale: glass.clone().lerp(C(pal[0]), 0.45), milk: C(pal[0]).multiplyScalar(0.95),
    bell: C(pal[4]), ringGlass: C(pal[5]).lerp(C(pal[4]), 0.4),
  };

  // ----- shared uniforms and progress-driven uniforms
  const ownShared = !opts.shared;
  const shared = opts.shared || makeGlassUniforms(pal, opts);
  const sunLocal = opts.sunDir ? (opts.sunDir.isVector3 ? opts.sunDir.clone() : new THREE.Vector3().fromArray(opts.sunDir)) : new THREE.Vector3(-0.80, 0.22, -0.56);
  sunLocal.normalize(); if (sunLocal.y < 0.08) { sunLocal.y = 0.08; sunLocal.normalize(); }
  const D = sunLocal.clone().negate();                       // the way the light travels
  const shaftLen = TOP / sunLocal.y;
  const X = {
    uU: { value: 0.74 }, uLen: { value: 1 }, uBlobR: { value: 5.5 }, uBreath: { value: 0 }, uSwell: { value: 0 }, uCool: { value: 0.5 }, uTopY: { value: TOP }, uHeatMax: { value: 1 },
    uHotCap: { value: 1 }, uHole: { value: RING_R }, uSpin: { value: 0 }, uFootY: { value: 0 }, uGate: { value: new THREE.Vector3() }, uSpinA: { value: 0 },
    uSteam: { value: new THREE.Vector3() }, uRing: { value: new THREE.Vector3() }, uWarm: { value: 1 },
    uTowerCol: { value: glass.clone() }, uShaft: { value: 1 }, uGlow: { value: new THREE.Vector3(0, 14, 0) }, uRingHeat: { value: 1 },
  };
  const morphU = { uU: X.uU, uLen: X.uLen, uBlobR: X.uBlobR, uBreath: X.uBreath, uSwell: X.uSwell, uCool: X.uCool, uTopY: X.uTopY, uHeatMax: X.uHeatMax, uHotCap: X.uHotCap };

  const object = new THREE.Group(); object.name = 'blown-city-hero';
  const mirror = new THREE.Group(); mirror.name = 'mirror';
  const wantMirror = opts.mirror !== false;

  // ----- tower
  const tick = async () => { await ctx.yield?.(); };
  const T = await buildTower(rng, cols, V, tick);
  await tick();
  const towerGeo = await buildTowerTop(T, rng, cols, V, tick);
  await tick();
  towerGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 48, 0), 60);
  const towerOpts = { shared, color: '#ffffff', vertexColors: true, thickness: 0.3, core: 0.6, rim: 0.75, morph: true, extraUniforms: morphU, caustic: 0 };
  const towerMat = makeGlassMaterial({ ...towerOpts, clip: 1 });
  await tick();
  const tower = new THREE.Mesh(towerGeo, towerMat); tower.name = 'tower'; tower.scale.set(girth, 1, girth); object.add(tower);
  let towerM = null;
  if (wantMirror) {
    towerM = new THREE.Mesh(towerGeo, makeGlassMaterial({ ...towerOpts, clip: 2 }));
    towerM.scale.set(girth, -1, girth); towerM.frustumCulled = false; mirror.add(towerM);
  }
  tower.frustumCulled = false;
  await tick();

  // ----- steel
  const steelGeo = buildSteel(rng, V, C('#6d7178'));
  await tick();
  const steelOpts = { shared, color: '#777b82', steel: true, vertexColors: false, caustic: 0 };
  const steel = new THREE.Mesh(steelGeo, makeGlassMaterial({ ...steelOpts, clip: 1 })); steel.name = 'pipes'; steel.frustumCulled = false; object.add(steel);
  if (wantMirror) { const sm = new THREE.Mesh(steelGeo, makeGlassMaterial({ ...steelOpts, clip: 2 })); sm.scale.y = -1; sm.frustumCulled = false; mirror.add(sm); }

  await tick();
  // ----- ring, membrane
  const ringGeo = buildRing(rng, V, cols);
  await tick();
  const ringOpts = { shared, color: '#ffffff', vertexColors: true, thickness: 0.5, core: 0.3, heat: 0.9, caustic: 0 };
  const ringMat = makeGlassMaterial({ ...ringOpts, clip: 1 });
  const ring = new THREE.Mesh(ringGeo, ringMat); ring.name = 'ring'; object.add(ring);
  let ringMatM = null;
  if (wantMirror) { ringMatM = makeGlassMaterial({ ...ringOpts, clip: 2 }); const rm = new THREE.Mesh(ringGeo, ringMatM); rm.scale.y = -1; rm.frustumCulled = false; mirror.add(rm); }
  const membrane = buildMembrane(shared, X); object.add(membrane);
  await ctx.yield?.();

  // ----- drips, steam, glows, shaft, water
  const motes = buildMotes(rng, V, shared, X, detail, girth, opts.dropScale ?? 1, opts.dropCount ?? 1); object.add(motes);
  await tick();
  const steam = buildSteam(rng, shared, X, detail, girth); object.add(steam);
  const halos = buildHalos(shared, 4); object.add(halos.mesh);
  await tick();
  let shaft = null;
  if (opts.shaft !== false) { shaft = buildShaft(shared, X, D, shaftLen, girth); object.add(shaft); }
  const waterMode = opts.water === undefined ? true : opts.water;
  let water = null;
  if (waterMode) { water = buildWater(shared, X, opts.waterRadius ?? 420, waterMode === 'decal', D, girth); object.add(water); }
  if (wantMirror) object.add(mirror);
  await ctx.yield?.();

  // ----- progress
  let progress = opts.progress ?? 0.74, lastTime = 0;
  const orange = C(pal[5]), amber = C(pal[4]), shaftGain = opts.shaftGain ?? 1, haloGain = opts.haloGain ?? 1;
  const seg = (u, pts) => {                                  // piecewise-linear through [[u, v], ...]
    if (u <= pts[0][0]) return pts[0][1];
    for (let i = 0; i < pts.length - 1; i++) if (u <= pts[i + 1][0]) return lerp(pts[i][1], pts[i + 1][1], (u - pts[i][0]) / (pts[i + 1][0] - pts[i][0]));
    return pts[pts.length - 1][1];
  };
  // the tables are constants: apply() runs every frame and must not allocate
  const SEG_LEN = [[0, 22], [0.30, 30], [0.45, 36]], SEG_COOL = [[0.6, -0.4], [0.655, -0.15], [0.7, 0.6], [0.9, 0.86], [1, 0.93]], SEG_HEAT = [[0.42, 1], [0.6, 0.9], [0.72, 0.8], [0.92, 0.7]];
  const state = { footY: 0, gatherY: 80, hotLo: 0.5, len: 1 };
  const put = (i, x, y, z, size, col, gain, shape) => {
    const P = halos.pos.array, K = halos.col.array, j = i * 4;
    P[j] = x; P[j + 1] = y; P[j + 2] = z; P[j + 3] = size; K[j] = col.r * gain; K[j + 1] = col.g * gain; K[j + 2] = col.b * gain; K[j + 3] = shape;
  };
  function apply(u, time) {
    const len = (u < 0.45 ? seg(u, SEG_LEN) : u < 0.66 ? lerp(36, TOP, Math.pow((u - 0.45) / 0.21, 1.25)) : TOP) / TOP;
    const cool = seg(u, SEG_COOL);                           // half the tower is cold glass by 0.7
    X.uU.value = u; X.uLen.value = len; X.uCool.value = cool;
    X.uHeatMax.value = seg(u, SEG_HEAT);
    X.uHotCap.value = lerp(0.6, 1, sst(0.6, 0.7, u));       // a saturated orange gather until the foot is down, then the white-orange heat of the finished frames
    X.uBlobR.value = 5.2 + 0.6 * sst(0.3, 0.5, u);
    const bx = clamp((u - 0.46) / 0.40, 0, 1) * 5 + time * 0.03;
    const active = sst(0.44, 0.48, u) * (1 - sst(0.84, 0.88, u));
    X.uBreath.value = bx - Math.floor(bx);
    X.uSwell.value = lerp(0.45, 1, active);
    X.uHole.value = lerp(1, RING_R, sst(0.55, 0.78, u));
    X.uSpin.value = time * 1.1 * V.dir;
    const form0 = sst(0.48, 0.66, u), blob0 = X.uBlobR.value;
    const footY = Math.max(0, TOP * (1 - len) - blob0 * 0.85 * (1 - form0));
    X.uFootY.value = footY;
    X.uGate.value.set(1 - sst(0.64, 0.66, u), sst(0.67, 0.70, u) * (1 - sst(0.80, 0.90, u)), sst(0.50, 0.56, u));
    X.uSteam.value.set(sst(0.6, 0.67, u) * (1 - 0.45 * sst(0.85, 1, u)), sst(0.25, 0.4, u) * (1 - sst(0.64, 0.68, u)), 0);
    const rp = clamp((u - 0.66) / 0.17, 0, 1);
    X.uRing.value.set(9 * girth + 175 * Math.pow(rp, 0.8), sst(0.655, 0.675, u) * (1 - sst(0.7, 0.775, u)) * 0.8, 5 + 9 * rp);   // it thins out before it reaches the boat: no white-out
    X.uShaft.value = sst(0.21, 0.29, u) * shaftGain;
    const heat0 = sst(cool - 0.17, cool + 0.15, 0);           // heat of the foot: 1 while it is still orange (this was inverted before)
    X.uGlow.value.set(1.5 * heat0 * sst(60, 4, footY) + 0.12, 13 + footY * 0.35, 0);
    X.uWarm.value = 0.25 + 0.75 * heat0;
    // glows: the hot star sits on the middle of whatever is still glowing
    const lo = Math.max(1 - len, cool - 0.02), hotLo = clamp(lo, 0, 0.97);
    const yBot = Math.max(TOP - (TOP - hotLo * TOP) * 1, footY), yc = (yBot + TOP) * 0.5, span = TOP - yBot;
    const farBoost = 1 + 5.5 * (1 - sst(0.3, 0.54, u));        // from the burst to the great bridge the gather is a star in the haze: three times the glow it had
    const basin = sst(0.42, 0.5, u) * (1 - sst(0.8, 0.9, u));  // from the basin the fog round the hot glass glows orange
    put(0, 0, yc, 0, lerp(10 + span * 0.62, (25 + span * 0.9) * (0.7 + 0.3 * girth), basin), orange, lerp((0.1 + 0.1 * clamp(span / 60, 0, 1)) * farBoost, lerp(0.18, 0.3, sst(0.66, 0.72, u)) * haloGain, basin), 0);
    put(1, 0, lerp(yc, TOP - 4, 0.5), 0, (7 + span * 0.22) * (0.6 + 0.4 * girth), amber, 0.16 * farBoost, 0);
    put(2, 0, RING_Y, RING_Z, 15.5, orange, 0.3, 1);
    put(3, 0, Math.max(footY, 1.5), 0, 16 * (0.5 + 0.5 * girth), orange, 0.3 * heat0 * sst(70, 5, footY), 0);
    halos.pos.needsUpdate = true; halos.col.needsUpdate = true;
    state.footY = footY; state.gatherY = yc; state.hotLo = hotLo; state.len = len;
  }
  apply(progress, 0);

  const wq = new THREE.Quaternion();
  function update(dt, time, camera) {
    lastTime = time;
    shared.uTime.value = time;
    if (ownShared) { object.getWorldQuaternion(wq); shared.uSunDir.value.copy(sunLocal).applyQuaternion(wq); }
    const a = time * 0.085 * V.dir;                           // the tower turning on the pipe
    tower.rotation.y = a; if (towerM) towerM.rotation.y = a;
    X.uSpinA.value = a;
    apply(progress, time);
  }

  // ----- anchors
  const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const hd = v3(D.x, 0, D.z).normalize();
  const anchors = {
    portalSeat: { position: v3(0, RING_Y, RING_Z), facing: v3(0, 0, 1), radius: RING_R },
    flyThrough: [v3(-42, RING_Y, 218), v3(-24, RING_Y, 188), v3(-8, RING_Y, 164), v3(0, RING_Y, 148), v3(0, RING_Y, 110), v3(0, RING_Y, RING_Z)],
    viewpoints: { basin: v3(-34, RING_Y, 205), approach: v3(0, RING_Y, 148), ring: v3(0, RING_Y, 96), side: v3(120, 30, 70) },
    lookAt: v3(0, 46, 0),
    towerTop: v3(0, TOP, 0), pipeTop: v3(0, PIPE_TOP, 0), gather: v3(0, 80, 0), belfry: v3(0, 68, 0), foot: v3(0, 0, 0),
    pontil: { tip: V.pontilTip.clone(), direction: V.pontilDir.clone() },
    shaft: { from: v3(0, TOP, 0), to: hd.clone().multiplyScalar(shaftLen * Math.hypot(D.x, D.z)), direction: D.clone() },
    steamRing: { center: v3(0, 0, 0), maxRadius: 184 },
    bubbleDome: hd.clone().multiplyScalar(98),
    flock: { center: v3(0, 70, 0), radius: 26 },
  };

  // the part viewer orbits `center` at 2.4 radii: a low, boat-like eye that sees tower, ring and reflection.
  const radius = 54, height = 16, center = v3(0, 36, 18);
  return {
    object, radius, height, center, anchors,
    update,
    setProgress(u) { progress = clamp(u, 0, 1); },             // only stored: apply() runs once per frame, in update()
    getState: () => ({ ...state, progress }),
    uniforms: { ...shared, ...X }, shared, mirror, water, shaft,
    materials: { tower: towerMat, ring: ringMat },
    towerColor: '#' + glass.getHexString(), variant: V,
    dispose() {},
    ground: false, groundY: 0,
  };
}
