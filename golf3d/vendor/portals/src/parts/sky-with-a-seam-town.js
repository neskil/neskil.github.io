// SKY WITH A SEAM: THE TOWN and its harbour (stage 2a). Our own small northern fishing harbour, from real ones:
// a stone-walled basin between two breakwaters, a quay of clapboard houses in red, ochre and white under dark
// slate, red boathouses on stilts, empty drying racks, a white wooden church, a small white lighthouse with one
// red band, open boats moored all at one angle. Freshly painted, evenly spaced, TOO NEAT, and nobody in it.
//
// PLACED BY THE ROUTE AS BUILT (said here, typed below, true on every seed): the town is laid in the axes of the
// route's first metre: a = metres to starboard of the flown line, b = metres along it from the entry, y up. The
// line is straight from the entry to beyond the town's north end (the proof reads the route's own mark for it), so
// in this axes the flown line is a = 0. What stands where (TOWN below):
//   the quay's edge 32 m to starboard and the house fronts 38 m, from 72 m behind the entry to the east
//   breakwater at b = 206.5; the moored boats' moorings 15.5 m to starboard and 20 m to port (their skins 12 m and
//   more off); the east boathouses' fronts 23 m off; the lighthouse on the east head 22 m to starboard at b = 210
//   (as built its skin 19.5 m off, the head's 16.4 m, the head's rocks 14.9 m); the church on the point beyond the
//   breakwater's root, 62 m to starboard; the west head 36 m to port, the west mole 128 m, with its own boathouses
//   and racks (seen against the lamp);
//   the hill, in the round, behind the town's north half: three tops 90 to 120 m to starboard with saddles between.
//   TWO MEASURES OF ITS HEIGHT, both true: the table (TOWN.hill.tops) holds each dome's own measure, 31, 40 and
//   26 m over the land at its foot, as hillAt takes it in; AS BUILT (the land's 1.3 m added, hillAt's swells over
//   the ground laid on) the ground at those three places stands 29, 40 and 26 m over still water, and the hill's
//   highest point, some 9 m to starboard of the second, 44 m: nowhere over 45 m. Its west foot is 52 m to starboard
//   behind the houses, its east foot in the water 150 to 170 m to starboard: a body with a skin all round.
//   WHAT STANDS ON IT, all round, by its own places: fields of 19 by 23 m, a tone to each (one in four mown),
//   parted by dry-stone walls that are BUILT (0.7 m thick, 1.05 m high) up to the heath line near 30 m; heath and
//   heather above that line; bare rock where the slope is steepest and in small outcrops on the heath; a path
//   (painted on the skin) from behind the houses up the north
//   top's west face to the cairn (3 m) on it; a tree by every second field corner and wind-bent ones on the crest;
//   a stone hut 5.2 m long on the middle top's west shoulder; rock tors along the crest. So it is a hill, with its
//   own things on every slope, from the basin, from the far side of the bay and from everywhere between.
// WHAT IS TURNED FROM THE LAMP (the sheds across the basin, the port boats, the hill's east side) takes the lit sky
//   wall's return, 0.28 of the lamp's key by how squarely it faces away: a rule of the surface and the lamp's place,
//   so those are lit, coloured shapes from anywhere in the harbour; the west boathouses' red is 1.45 times fresher.
// BEHIND THE ENTRY nothing of the town stands within 12 m of the entry's level axis (the tube asks 9 m for 60 m).
// THE GULLS THAT FLY are the kit's (wander, count, maxSigma 3 and keepClear with the route handed in every call);
// the gulls that sit are bodies of the town, evenly along the breakwater rails.
//
// LIGHT: no three.js light is made here and no shadow map. One paint material, lit by the dome's fill and by the
// lamp-sun from its OWN PLACE (the sky's uLamp, by reference); the shadows are laws of place in the shader: the
// rows of lamp posts and masts, the flagpole and the boathouses each throw theirs
// on what stands behind them, and our own boat throws the hero's one shadow law (GLSL_SHADOW) on the quay. Slate
// takes a faint sheen of the sky, the more the flatter it is seen (a roof turned from the lamp is a dark slope).
// THIN ROUND MEMBERS (the thin-member law, said at the paint's vertex): the houses' gutters and downpipes, the lamp
// posts' shafts, the pennant pole, the boats' masts, yards, oars and mooring lines, the washing lines and their
// posts, the drying racks' poles and rails, the rails of the breakwaters and of the lighthouse's gallery, its
// lantern's glazing bars, the rods on the lighthouse and on the spire, the boathouses' stilts, the sitting gulls'
// legs and the stems of the hill's trees. Each is built at its own true radius; where it is thinner than a pixel
// and a half it is drawn that wide and carries only the cover it truly has, so far off it is a faint line that
// comes up as the eye nears it. Where it is drawn at its own width it is a solid thing in the town's solid coat;
// where it is widened it is blended and WRITES NO DEPTH, so it hides no more than the cover it has (the paint's
// last lines). Nothing else of the town is widened for the pixel; the painted walls and the path
// on the hill, every joint and course, and a thin post's shade are filtered over their own footprint to their own
// mean. THE SMOKE is a medium: its cover is by the length of smoke the eye's ray crosses in the column's own round
// section (said at its paint).
// THE BASIN'S REFLECTIONS are the town drawn once more as its image under the still water (the same geometry, the
// same paint, MIRROR), broken by the ripples' law at the water's own place; an image is a sheen, not a body: it
// is laid in one coat (nearest the line first) and on water only, never across the foot of a stone wall.
// BY THE CLOCK (ambient loops, the same at any entry clock): the lighthouse's lamp turns, the pennant flies, the
// moored boats ride the sea's own swell at their moorings and rock a little, every chimney's smoke rises in step,
// the sheets on the washing lines stir. (THE SWELL'S EASE: what floats here rides the sea's swell as the sea's own
// sheet draws it, eased flat from 150 to 360 m of the EYE: said at THE PAINT's head, WHAT FLOATS READS WHERE THE
// EYE IS; it is the one thing of this part that the eye's place moves.) Their rates are typed; WHERE EACH BEGINS IS NOT: the lamp's turn, each
// boat's rocking, the pennant's wave, the sheets' swing, the smoke's lean, billow and puffs and the image's ripples
// each take one die of the stream 'town-clock:' + seed, all drawn first in makeTown, before anything is built.
// In the LOW SUN look a room's lamp burns in a few windows, evenly spaced (emissive paint, no light). Nothing is
// made in update().
// What this part never holds: nothing lettered, no figure, no animal but the gulls, no stair or door on the sky.
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';
import * as F from '../kit/fauna.js';
import { GLSL_HASH } from '../kit/fx.js';               // (the kit's own hashes without sine: hash12 is the one this paint reads)
import { LAMP_LIGHT, PAINTS, GLSL_SHADOW, SWELL, dirOf } from './sky-with-a-seam.js';
import { Paint, PIECES, houseShape } from './sky-with-a-seam-town-b.js';

// THE TOWN'S TYPED MEASURES (metres; a to starboard of the line, b along it from the entry, y over still water)
export const TOWN = {
  quayA: 32, quayTop: 1.6, frontA: 38, depth: 12, pitch: 12.5, slot0: -60, slots: 20, houseW: 10.4, square: [],
  south: -72, mouth: 210, moleTop: 2.4, moleW: 7, headR: 5.5, eastHeadA: 22, westHeadA: -36, westA: -131, rootA: 56, northB: 266, landA: 140,
  boats: { a: 15.5, b0: 65, n: 7, portA: -20, portB0: 52.5, portN: 9, heading: -25, len: 5.6, mast: 5.2 },
  boathouses: { a0: 23, a1: 31.4, floor: 1.9, w: 8.2, slots: [7, 8, 9, 17, 18, 19], westA0: -127.6, westA1: -119.2, westB0: 77.5, westN: 8 },
  posts: { a: 33.1, h: 4.6, r: 0.07 }, pole: { a: 40, b: 210, h: 11.5, r: 0.085 }, wind: [-0.94, 0.342],
  racks: { b0: 186.5, b1: 203.5, rows: [37.2, 43.2, 49.2], west: [[-50, -72], [-76, -98], [-102, -124]] },
  church: { a: 66.3, b: 228, len: 18, w: 9.6, eaves: 6.2, tower: 4.6, towerH: 13.6, spire: 27.2 },
  light: { r0: 2.0, r1: 1.45, h: 8.2, lamp: 9.6, top: 12.2 },
  // the hill, in the round: its tops (a, b, how far each dome reaches, the dome's own height over the land at its foot, before
  // hillAt's swells: the built heights are said at the head; the first carries the hut, the second, the highest, the cairn),
  // the ground it is made over, its skin's cell, and the land's east edge where its foot goes down into the water
  hill: { tops: [[98, 148, 46, 31], [120, 198, 50, 40], [90, 106, 36, 26]], a0: 52, a1: 172, b0: 68, b1: 252, cell: 4, edge: 140,
    field: [19, 23, 0.4, 0.06, 0.35, 0.08],                 // the fields: their size (a, b) and how their walls sway
    heath: [29.5, 2.6, 0.21, 1.0, 2.2, 0.17, 0.05],         // the heath line: its height and its two swells over the ground
    path: { a0: 58, a1: 121, b: 204, fall: 6, sway: 8, turns: 7 } },
  washing: [5, 10, 15],                       // the houses that have a washing line (every fifth)
  smoke: { bend: 21, top: 34, lean: 6.5, r0: 0.2, grow: 0.1 },   // every chimney's column: where it leans, where it ends, how far it is carried
  rock: 0.9,                                  // metres any point of a moored boat can leave its built place (swell, roll, pitch)
};
const fl = (v) => { const s = String(Math.round(v * 1e4) / 1e4); return /[.e]/.test(s) ? s : s + '.'; };
const NBOX = 10;
// END-OF-MEASURES

// ---- THE PAINT: one material for all that the town is made of. A vertex carries its colour, its surface's kind
// and place on it (aMat: kind + 16 x layer, u, v, a figure of the kind), a thin round member its axis (aAxis: the
// centre of its section, w = its radius: see THE THIN-MEMBER LAW at the vertex), a thing the clock moves its mooring
// (aMove: x, z of its pivot, a phase or a length, what moves: 1 a moored boat, 2 the pennant, 3 a buoy, 4 a hung sheet).
// WHAT FLOATS READS WHERE THE EYE IS, and it is the one thing of this part that is moved by it: a moored boat and
// a buoy ride the sea's one swell by the hero's own law (SWELL; seaWave below is the hero's, written out again), and
// the sea's sheet eases that swell flat from 150 to 360 m of the EYE's place (the hero's swellEase about its uCentre,
// the sea's own uniforms, read here by reference). So a floating thing of the town rides the whole swell within
// 150 m of the eye, less beyond, and lies still beyond 360 m: it is moved by where the eye is, exactly as the water
// under it is drawn. It is the sea's level of detail (the swell is 0.4 m from trough to crest), kept here unchanged
// so that a moored boat rides the very water that is drawn and never stands proud of it or sunk in it.
const SW = (() => { const d = dirOf(SWELL.from + 180), k = (2 * Math.PI) / SWELL.length; return { x: d.x, z: d.z, k, w: Math.sqrt(9.81 * k), a: SWELL.height / 2 }; })();
const GLSL_SEA = /* glsl */`
uniform float uTime; uniform vec2 uCentre;
vec3 seaWave(vec2 xz){ float e = 1. - smoothstep(150., 360., length(xz - uCentre));
  return vec3(0., ${fl(SW.a)} * sin(${fl(SW.k)} * dot(xz, vec2(${fl(SW.x)}, ${fl(SW.z)})) - ${fl(SW.w)} * uTime) * e, 0.); }
`;
const TOWN_VERT = /* glsl */`
attribute vec3 color; attribute vec4 aMat, aAxis, aMove;
uniform float uClock, uPix; uniform vec3 uBoatDir, uWind; uniform vec4 uPh;
varying vec3 vCol, vN, vW; varying vec4 vMat; varying float vViewZ, vCover; varying vec2 vProj;
${GLSL_SEA}
#include <fog_pars_vertex>
void main(){
  vec3 p = position, n = normal, ax = aAxis.xyz;
  if (aMove.w > .5 && aMove.w < 1.5) {
    // a moored boat: it rides the swell at its mooring, takes the water's slope, and rocks a little by the clock
    vec2 pv = aMove.xy, d2 = uBoatDir.xz, s2 = vec2(-d2.y, d2.x);
    float h0 = seaWave(pv).y, hb = seaWave(pv + d2 * 2.).y, hs = seaWave(pv + s2 * .8).y;
    float pitch = (hb - h0) * .4 + .012 * sin(uClock * .83 + aMove.z * 1.7), roll = (hs - h0) * .85 + .034 * sin(uClock * 1.07 + aMove.z);
    vec3 D = vec3(d2.x, 0., d2.y), S = vec3(s2.x, 0., s2.y), P0 = vec3(pv.x, .15, pv.y), up = vec3(0., h0 * .9, 0.);
    vec3 r = p - P0; r += pitch * cross(S, r) + roll * cross(D, r); p = P0 + r + up;
    r = ax - P0; r += pitch * cross(S, r) + roll * cross(D, r); ax = P0 + r + up;
    n += pitch * cross(S, n) + roll * cross(D, n);
  } else if (aMove.w > 1.5 && aMove.w < 2.5) {
    // the pennant: a wave runs down the cloth from the hoist, wider toward the fly; it sags a little
    float s = aMove.z, th = s * 2.3 - uClock * 5.2 + uPh.x, amp = .07 + .16 * s;
    vec3 l = vec3(-uWind.z, 0., uWind.x);
    p += l * (amp * sin(th) * min(s * 2., 1.)) + vec3(0., -.05 * s * s - .05 * s * sin(th * .5 + 1.3), 0.);
    n = normalize(l - uWind * (amp * 2.3 * cos(th) * min(s * 2., 1.)));
  } else if (aMove.w > 2.5 && aMove.w < 3.5) {
    float h = seaWave(aMove.xy).y * .9; p.y += h; ax.y += h;
  } else if (aMove.w > 3.5) {
    // a hung sheet: it swings from its line, the more the lower it hangs, and a slow ripple runs down it
    float h = aMove.z, ph = aMove.x * .9 + aMove.y * .7 + uPh.y, sw = .09 * sin(uClock * 1.15 + ph) + .04 * sin(uClock * 2.6 + ph * 1.7 + h * 2.4);
    p += n * (h * sw); n = normalize(n + vec3(0., 1.2 * sw, 0.));
  }
  vec4 wp = modelMatrix * vec4(p, 1.);
  vec3 eye = cameraPosition;
#ifdef MIRROR
  eye.y = -eye.y;                                     // the image is seen as from the eye's own image under the water
#endif
  // THE THIN-MEMBER LAW (a rule of drawing, the kit's own wire law): a round member thinner than a pixel and a half
  // is drawn a pixel and a half wide AND CARRIES ONLY THE COVER IT TRULY HAS, its own width over the width drawn
  // (vCover: whole, no floor, no share of it kept back). So far off a mast or a rail is a faint line, and it comes
  // up to its full paint as the eye nears it and the member fills its pixels. Where its cover is whole it is laid
  // by the solid coat (its image by the image's own); where it is widened, by the thin coats ('town-thin',
  // 'town-thin-image'), blended by this cover and writing no depth: said at the paint's last lines.
  vCover = 2.;                                         // (2: not a thin member; a thin member's cover is 1 or less)
  if (aAxis.w > 0.) { vec4 cw = modelMatrix * vec4(ax, 1.); float dist = length(eye - cw.xyz);
    float want = max(aAxis.w, .75 * uPix * dist / projectionMatrix[1][1]); wp.xyz = cw.xyz + (wp.xyz - cw.xyz) * (want / aAxis.w); vCover = aAxis.w / want; }
  vW = wp.xyz; vN = mat3(modelMatrix) * n; vCol = color; vMat = aMat; vProj = vec2(projectionMatrix[2][2], projectionMatrix[3][2]);
#ifdef MIRROR
  wp.y = -wp.y;
#endif
  vec4 mvPosition = viewMatrix * wp; vViewZ = -mvPosition.z; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
// END-OF-VERT

// the fragment's helpers: a hash and a soft noise, the box-filtered band (the share of a footprint w, in periods,
// that the band [0, d) of every period covers: so no fine pattern shimmers), and the shadow laws of place
const TOWN_FRAG_A = /* glsl */`
${GLSL_SHADOW}
uniform float uClock, uKey, uFill, uPlane, uLit; uniform vec3 uLampCol, uFillCol, uSkyCol, uHazeCol, uBounce, uGlowCol; uniform vec4 uPf;
uniform vec4 uOrg, uPosts, uMastS, uMastP, uPole, uLH; uniform vec3 uPostH, uMastH; uniform vec4 uBoxA[${NBOX}], uBoxB[${NBOX}];
varying vec3 vCol, vN, vW; varying vec4 vMat; varying float vViewZ, vCover;
#include <fog_pars_fragment>
${GLSL_HASH}
float hash1(vec2 p){ return hash12(p); }                // (the kit's hash12, from its fx: every tone, grain and ripple of this paint is dealt by it)
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(hash1(i), hash1(i + vec2(1., 0.)), f.x), mix(hash1(i + vec2(0., 1.)), hash1(i + vec2(1., 1.)), f.x), f.y); }
float band(float x, float d, float w){ w = max(w, 1e-4); float a = x - .5 * w, b = x + .5 * w;
  return clamp(((floor(b) * d + min(fract(b), d)) - (floor(a) * d + min(fract(a), d))) / w, 0., 1.); }
// the town's own axes: x = metres to starboard of the line, z = metres along it from the entry
vec3 toTown(vec3 p){ vec2 q = p.xz - uOrg.xy; return vec3(dot(q, vec2(-uOrg.w, uOrg.z)), p.y, dot(q, uOrg.zw)); }
// a row of upright round members, all alike and evenly spaced (row: a, the first b, the pitch, how many; h: foot, top, radius)
float rowShade(vec3 P, vec3 D, float T, vec4 row, vec3 h, float foot){
  float da = abs(D.x) < 1e-4 ? 1e-4 : D.x, t = (row.x - P.x) / da;
  float b = P.z + D.z * t, y = P.y + D.y * t;
  float k = clamp(floor((b - row.y) / row.z + .5), 0., row.w - 1.), off = abs(b - (row.y + k * row.z)) * abs(da) / max(length(D.xz), 1e-4);
  // (across its line a member's shade is the share of a window of half width pen, the lamp's own soft edge there and
  // half the pixel's footprint, that the member's own width covers: whole while the window is narrower than the
  // member, and as the window outgrows it ITS OWN MEAN, h.z / pen: the thin shade is never thinned below that)
  float pen = .0035 * max(t, 0.) + .5 * foot + .004;
  float s = clamp((h.z + pen - off) / (2. * pen), 0., min(1., h.z / pen)) * smoothstep(h.x - pen, h.x + pen, y) * (1. - smoothstep(h.y - pen, h.y + pen, y));
  return s * step(.05, t) * step(t, T); }
// a box of the town's axes (c: its middle, h: its half sizes): the shade by the length of the light's way through it
float boxShade(vec3 P, vec3 D, float T, vec3 c, vec3 h, float soft){
  vec3 sd = mix(vec3(-1.), vec3(1.), step(0., D)), inv = sd / max(abs(D), 1e-5);
  vec3 t0 = (c - h - P) * inv, t1 = (c + h - P) * inv, tn = min(t0, t1), tf = max(t0, t1);
  float a = max(max(tn.x, tn.y), max(tn.z, .02)), b = min(min(tf.x, tf.y), min(tf.z, T));
  return smoothstep(0., soft, b - a); }
float townShade(vec3 Pw, vec3 Lw, float foot){
  vec3 P = toTown(Pw), Q = toTown(Lw), D = Q - P; float T = max(length(D), 1e-3); D /= T;
  float s = rowShade(P, D, T, uPosts, uPostH, foot);
  s = max(s, rowShade(P, D, T, uMastS, uMastH, foot)); s = max(s, rowShade(P, D, T, uMastP, uMastH, foot));
  s = max(s, rowShade(P, D, T, vec4(uPole.x, uPole.y, 1., 1.), vec3(0., uPole.z, uPole.w), foot));
  float soft = .12 + 2. * foot;
  for (int i = 0; i < ${NBOX}; i++) s = max(s, boxShade(P, D, T, uBoxA[i].xyz, uBoxB[i].xyz, soft) * uBoxB[i].w);
  return s; }
#ifdef MIRROR
// the stone's own footprint on the still water (the quay and the land, the breakwaters, the mole, the basin's inner
// end as boxes a0, b0, a1, b1; the two round heads): an image lies on water only, never across a wall's foot
uniform vec4 uStone[6], uHeads;
float onStone(vec2 p){
  float s = 0.;
  for (int i = 0; i < 6; i++) s += step(uStone[i].x, p.x) * step(p.x, uStone[i].z) * step(uStone[i].y, p.y) * step(p.y, uStone[i].w);
  vec2 e = p - uHeads.xy, w = p - vec2(uHeads.z, uHeads.y);
  return s + step(dot(e, e), uHeads.w) + step(dot(w, w), uHeads.w); }
#endif
`;
// END-OF-FRAG-A

const HF = TOWN.hill.field, HH = TOWN.hill.heath, HP = TOWN.hill.path;   // (the hill's laws, the same in the paint and in the makers)
const TOWN_FRAG_B = /* glsl */`
varying vec2 vProj;
void main(){
  // every footprint is taken here, before any branch
  float fu = fwidth(vMat.y), fv = fwidth(vMat.z), foot = max(length(fwidth(vW)), 1e-4);
  vec3 E = cameraPosition;
#ifdef MIRROR
  // the still water's place where the eye's ray to the image crosses it, and the ripples' footprint there
  float k0 = clamp(E.y / max(E.y + vW.y, 1e-3), 0., 1.); vec2 wxz = E.xz + (vW.xz - E.xz) * k0; float fww = max(length(fwidth(wxz)), 1e-4);
  E.y = -E.y;
#endif
  vec3 N = normalize(vN + 1e-5), V = E - vW; float vd = max(length(V), 1e-3); V /= vd;
  float kind = floor(mod(vMat.x + .5, 16.)), layer = floor((vMat.x + .5) / 16.);
  if (kind > 6.5 && kind < 7.5 && dot(N, V) < 0.) N = -N;                 // cloth is seen from both sides
  vec3 alb = vCol, glow = vec3(0.), Ng = N; float gloss = .05, glass = 0.;
  if (kind < .5) { }
  else if (kind < 1.5) {                                                   // clapboard: the lap's shadow line under every board
    float q = vMat.z / .15, w = fv / .15;
    alb *= (1. - .3 * band(q, .16, w)) * (1. + .06 * (hash1(vec2(floor(q), 3.)) - .5) * (1. - smoothstep(.3, 1., w)));
  } else if (kind < 2.5) {                                                 // slate: courses, staggered joints, slate by slate a tone
    float q = vMat.z / .24, w = fv / .24, row = floor(q), u2 = (vMat.y + .2 * mod(row, 2.)) / .4, fade = 1. - smoothstep(.4, 1.2, max(w, fu / .4));
    // (the upright joint: a dark line over a tenth of every slate's 0.4 m, at strength .22. Where the footprint outgrows
    // the slate it is let go TO ITS OWN MEAN, .22 x .1 = .022 of the tone, never to bare slate; the slate-by-slate tone
    // is as often light as dark, so its own mean is nothing; the courses' line comes to its mean, .3 x .14, by band())
    alb *= (1. - .3 * band(q, .14, w)) * (1. - mix(.022, .22 * band(u2, .1, fu / .4), fade)) * (1. + .2 * (hash1(vec2(floor(u2), row)) - .5) * fade);
    gloss = .16;
    // (slate takes the sky's sheen, the more the flatter it is seen: a roof turned from the lamp is a dark slope, not a black blank)
    float fz = 1. - clamp(dot(N, V), 0., 1.); glow = mix(uHazeCol, uSkyCol, clamp(reflect(-V, N).y * 2.5, 0., 1.)) * (.02 + .11 * fz * fz);
  } else if (kind < 3.5) {                                                 // a window: axes, white bars, glass with its curtain
    float lampIn = step(99.5, vMat.w), par = vMat.w - 100. * lampIn;       // (a figure over 100: a room's lamp burns behind this one)
    float cols = floor(par / 10. + .01), rows = par - cols * 10.; vec2 f = vec2(.11, .075), q = (vMat.yz - f) / (1. - 2. * f), fq = vec2(fu, fv) / (1. - 2. * f);
    float inside = smoothstep(-fq.x, fq.x, q.x) * smoothstep(-fq.x, fq.x, 1. - q.x) * smoothstep(-fq.y, fq.y, q.y) * smoothstep(-fq.y, fq.y, 1. - q.y);
    float bars = 1. - (1. - band(q.x * cols + .06, .12, fq.x * cols)) * (1. - band(q.y * rows + .05, .1, fq.y * rows));
    glass = inside * (1. - bars);
    // the curtain: a pelmet and two straight side strips (plain upright shapes: nothing a mirror could turn into a sign)
    float curtain = .55 * smoothstep(.7, .78, q.y) + .3 * (1. - smoothstep(.1, .18, min(q.x, 1. - q.x)));
    vec3 pane = mix(vec3(.035, .045, .06), vec3(.42, .4, .37), curtain);
    alb = mix(alb, pane, glass); gloss = mix(.08, 1., glass);
    // old glass: every pane hangs a little out of true (the same panes in every window), so the low lamp-sun is
    // caught pane by pane; and in the LOW SUN look a room's lamp burns warm behind a few windows, evenly spaced
    vec2 pn = floor(clamp(q, 0., .999) * vec2(cols, rows)), tl = (vec2(hash1(pn + 3.), hash1(pn.yx + 11.)) - .5) * .16;
    vec3 T2 = vec3(-N.z, 0., N.x); Ng = normalize(N + (T2 * tl.x + vec3(0., tl.y, 0.)) * glass);
    glow = vec3(1., .55, .2) * (uLit * lampIn * glass * (1.6 + 2.2 * curtain));
  } else if (kind < 4.5) {                                                 // dressed stone: courses and staggered joints, the tide's stain
    float q = vMat.z / .5, w = fv / .5, row = floor(q), u2 = (vMat.y + .55 * mod(row, 2.)) / 1.1, fade = 1. - smoothstep(.4, 1.2, max(w, fu / 1.1));
    // (the upright joint: a dark line over a twentieth of every stone's 1.1 m, at strength .35; let go to ITS OWN MEAN,
    // .35 x .05 = .0175 of the tone, as the footprint outgrows the stone; the stone-by-stone tone's mean is nothing)
    alb *= (1. - .4 * band(q, .1, w)) * (1. - mix(.0175, .35 * band(u2, .05, fu / 1.1), fade)) * (1. + .26 * (hash1(vec2(floor(u2), row)) - .5) * fade);
    float wet = 1. - smoothstep(.25, .8, vW.y + .15 * vnoise(vec2(vMat.y * .7, 3.)));
    alb = mix(alb, alb * vec3(.34, .4, .33), wet); gloss = mix(.03, .3, wet);
  } else if (kind < 5.5) {                                                 // the lighthouse's lamp: its beam turns by the clock
    vec2 r = vW.xz - uLH.xy; r /= max(length(r), 1e-3); float th = uClock * uLH.w + uLH.z;
    float beam = max(dot(r, vec2(cos(th), sin(th))), 0.); beam = beam * beam; beam = beam * beam; beam = beam * beam * beam;
    glow = uGlowCol * (.5 + 7. * beam); alb = vec3(.1); gloss = .6;
  } else if (kind < 6.5) {                                                 // the hill: painted by its place on the ground (vMat.yz: metres), its height and its steepness
    vec2 p = vMat.yz; float hy = vW.y, fp = foot;
    float r0 = vnoise(p * .045) * .65 + vnoise(p * .11 + 5.) * .35, r1 = vnoise(p * .31 + 9.);
    // fields on the slopes, a tone to each and one in four mown, parted by dry-stone walls (built ones stand on
    // these lines); heath and heather above the heath line; bare rock where the slope is steepest
    vec2 c = vec2(p.x / ${fl(HF[0])} + ${fl(HF[2])} * sin(p.y * ${fl(HF[3])}), p.y / ${fl(HF[1])} + ${fl(HF[4])} * sin(p.x * ${fl(HF[5])})), ci = floor(c);
    float hl = ${fl(HH[0])} + ${fl(HH[1])} * sin(p.x * ${fl(HH[2])} + ${fl(HH[3])}) + ${fl(HH[4])} * sin(p.y * ${fl(HH[5])} + p.x * ${fl(HH[6])});
    float low = 1. - smoothstep(hl - .8, hl + .8, hy), tone = hash1(ci);
    vec3 field = mix(mix(vec3(.1, .27, .035), vec3(.27, .4, .07), tone), vec3(.47, .41, .14), step(.74, hash1(ci + 7.3)));
    vec3 heath = mix(mix(vec3(.25, .19, .06), vec3(.42, .31, .1), r0), vec3(.36, .16, .2), .45 * smoothstep(.5, .66, r1));
    vec3 land = mix(heath, field, low);
    land *= (1. + .22 * (vnoise(p * vec2(1.3, 1.1)) - .5) * (1. - smoothstep(.25, 1., fp))) * (.84 + .32 * r0);
    // THE WALLS' PAINTED FOOT: 0.7 m of wall in every field's ${HF[0]} m and in every ${HF[1]} m, AT ITS TRUE WIDTH (never widened
    // for the pixel). Each of the two families is filtered by band() over its own footprint (wx, wy: the footprint of
    // the field's own measure, worked from the ground's footprints taken above and the walls' sway), so as the
    // footprint outgrows the field the line comes OF ITSELF TO ITS OWN MEAN and stays there: 0.7 / ${HF[0]} = ${fl(0.7 / HF[0])} and
    // 0.7 / ${HF[1]} = ${fl(0.7 / HF[1])} of the ground, the two together ${fl(0.7 / HF[0] + 0.7 / HF[1] - 0.49 / (HF[0] * HF[1]))} (their sum less their crossings), at the wall's tone
    // and the .9 it is laid at. No ramp lets it go to bare grass.
    float wx = fu / ${fl(HF[0])} + abs(${fl(HF[2] * HF[3])} * cos(p.y * ${fl(HF[3])})) * fv, wy = fv / ${fl(HF[1])} + abs(${fl(HF[4] * HF[5])} * cos(p.x * ${fl(HF[5])})) * fu;
    float wall = 1. - (1. - band(c.x, ${fl(0.7 / HF[0])}, wx)) * (1. - band(c.y, ${fl(0.7 / HF[1])}, wy));
    land = mix(land, vec3(.4, .39, .36), .9 * wall * low);
    // (rock: where the slope stands over some 55 degrees, and in small outcrops on the heath)
    float crag = max((1. - smoothstep(.5, .6, abs(N.y))) * smoothstep(.3, .55, r1 * .6 + r0 * .5), (1. - low) * smoothstep(.74, .8, vnoise(p * .47 + 17.)));
    land = mix(land, vec3(.41, .4, .38) * (.72 + .5 * vnoise(p * .9 + 3.)), crag);
    // THE PATH that winds up from behind the houses to the cairn, AT ITS TRUE WIDTH: trodden earth whole to 0.48 m
    // from its middle and worn out to 0.8 m (1.28 m of earth across, counted whole). pc is the share of the path
    // in a window laid across it: the window is the path's own worn edge (0.32 m) and the pixel's footprint across
    // the path (pf: from the ground's footprints taken above and the path's own slant). So near it is the path as it
    // was, and as the footprint outgrows it its cover is its true width over the width drawn, 1.28 / pf: its own
    // mean, never widened for the pixel and never let go to bare ground.
    float ps = clamp((p.x - ${fl(HP.a0)}) / ${fl(HP.a1 - HP.a0)}, 0., 1.), pa = ps * ${fl(HP.turns)}, pd = abs(p.y - (${fl(HP.b)} - ${fl(HP.fall)} * ps + ${fl(HP.sway)} * sin(pa)));
    float pf = .32 + fv + abs(${fl(-HP.fall / (HP.a1 - HP.a0))} + ${fl(HP.sway * HP.turns / (HP.a1 - HP.a0))} * cos(pa)) * fu, pc = clamp((min(pd + .5 * pf, .64) - max(pd - .5 * pf, -.64)) / pf, 0., 1.);
    land = mix(land, vec3(.56, .5, .36), .9 * pc * step(${fl(HP.a0)}, p.x) * step(p.x, ${fl(HP.a1)}));
    land *= mix(.5, 1., smoothstep(.2, 1.1, hy));                           // dark and wet where its east foot stands in the water
    alb = land * vCol; gloss = 0.;                                         // (vCol: the hollows' shade, laid at the build)
  } else if (kind < 8.5 && kind > 7.5) {                                   // upright boards with a shadow gap between
    float q = vMat.y / .22, w = fu / .22; alb *= 1. - .34 * band(q, .1, w);
  } else if (kind > 8.5 && kind < 9.5) {                                // the shore's own rock: mottled, dark and wet at the water
    float wet = 1. - smoothstep(.2, .7, vW.y + .2 * vnoise(vW.xz * .9));
    alb *= (.8 + .4 * vnoise(vW.xz * .8 + vW.y * 1.7)) * mix(1., .42, wet); gloss = mix(.03, .35, wet);
  }
  vec3 L = uLamp - vW; float ld = max(length(L), 1.); L /= ld;
  float ndl = max(dot(N, L), 0.); ndl = max(ndl, .7 * step(6.5, kind) * step(kind, 7.5) * max(-dot(N, L), 0.));   // (thin cloth lets the lamp through)
  float sh = max(townShade(vW, uLamp, foot), boatShade(vW, min(foot, 2.)));
  vec3 lit = uFillCol * uFill * (.6 + .4 * N.y) + uBounce * (.5 - .5 * N.y) + uLampCol * (uKey * 1.25 * ndl * (1. - sh));
  lit += uLampCol * (uKey * .28 * max(-dot(N.xz, L.xz), 0.));             // the lit sky wall's return: what is turned from the lamp is not a dark shape against it
  // fresh paint's sheen and the glass: the sky's light in a pane, and the lamp caught in it
  vec3 R = reflect(-V, Ng); float rdl = max(dot(R, L), 1e-4), ndv = clamp(dot(N, V), 0., 1.);
  float r2 = rdl * rdl, r8 = r2 * r2 * r2 * r2, r32 = r8 * r8 * r8 * r8, r128 = r32 * r32 * r32 * r32, fres = 1. - ndv; fres = fres * fres * fres;
  // (the glass's catch: the lamp's own image sharp, a wide warm glint round it, and a faint sheen on every lit pane)
  vec3 c = alb * lit + uLampCol * (uKey * (1. - sh) * step(1e-3, ndl)) * (gloss * .12 * r8 + glass * (.02 * ndl + 1.2 * r8 + .9 * r32 + 9. * r128 * r128));
  c += glass * mix(uHazeCol, uSkyCol, clamp(R.y * 2.5, 0., 1.)) * (.1 + .5 * fres) + glow;
  gl_FragColor = vec4(c, clamp(vCover, 0., 1.));                           // (a thin member's own cover; whole on everything else)
  #include <fog_fragment>
#ifdef MIRROR
  // the image in the basin: stronger the flatter the eye's ray lies on the water, broken by the ripples at the
  // water's own place (their pattern is let go to ITS OWN MEAN, .5, as its footprint outgrows it: the ripples'
  // two noises stand as often over their middle as under it), and standing just over the still water in depth
  float cosT = cameraPosition.y / max(length(vec3(wxz.x - cameraPosition.x, cameraPosition.y, wxz.y - cameraPosition.z)), 1e-3), g = 1. - clamp(cosT, 0., 1.);
  float rp = vnoise(wxz * vec2(.55, .55) + uClock * vec2(.1, .16) + uPf.xy) * .55 + vnoise(wxz * 1.9 - uClock * vec2(.27, .12) + uPf.yx) * .45;
  float broken = mix(smoothstep(.36, .64, rp), .5, smoothstep(.5, 2., fww));
  float al = (.74 + .24 * g * g) * mix(1., broken, .24);
  al *= gl_FragColor.a;                                                    // (a thin member's image carries the member's own cover)
  gl_FragColor = vec4(gl_FragColor.rgb * (.88 * al), al);
  float kp = clamp((cameraPosition.y - uPlane) / max(cameraPosition.y + vW.y, 1e-3), 1e-3, 1.), zp = max(vViewZ * kp, 1e-3);
  gl_FragDepth = clamp(.5 * (-vProj.x + vProj.y / zp) + .5 - (.02 + 8e-4 * layer) * (1. - gl_FragCoord.z), 0., 1.);   // (trim stands before its wall by a share of its own depth: no tie)
  vec3 wt = toTown(vec3(wxz.x, 0., wxz.y));
  // what stands under the water has no image, and no image lies on stone; and of a thin member's image only the
  // near half is laid: a thin triangle is wound toward its own axis (below), and the image turns every face about,
  // so in the image the half that faces the eye shows its FRONTS and the far half, let go here, its backs
  if (vW.y < 0. || onStone(wt.xz) > .5 || (vCover < 1.5 && !gl_FrontFacing)) discard;
#endif
  // A THIN MEMBER'S TWO COATS. Where it is drawn at its own width (its cover whole, to a thousandth: the varying's
  // own rounding) it is a solid thing: the town's solid coat lays it, and the image's own lays its image, and each
  // writes its depth. Where it is widened for the pixel the thin coats lay it by its cover and WRITE NO DEPTH, so
  // a faint line hides no more than the cover it has. A member is round, and a widened coat lays only the half
  // that faces the eye, so its cover is laid once. WHICH HALF THAT IS: every thin triangle is wound TOWARD its own
  // axis in the world (the builder winds a tube away from its axis in the town's own axes, and those axes are
  // laid in the world by a mirror, sx = -fz, sz = fx; the proof counts the winding on every seed), so the half
  // that faces the eye shows its BACKS, and the fronts, the far half, are let go.
#ifdef THIN
  if (vCover >= .999) discard;
#ifndef MIRROR
  if (gl_FrontFacing) discard;
#endif
#else
  if (vCover < .999) discard;
#endif
}`;
// END-OF-FRAG-B

// the paint's materials: the town's solid coat, its image in the basin (MIRROR: drawn after the sea, over it), and
// the widened thin members' two (THIN: the things, and their image)
function paintMaterials(look, axes, sky, ocean, clock) {
  const P = PAINTS[look], LL = LAMP_LIGHT[look], T = TOWN, ou = ocean.uniforms, g = T.quayTop;
  const V4 = (x = 0, y = 0, z = 0, w = 0) => new THREE.Vector4(x, y, z, w), W3 = (a, b) => new THREE.Vector3(a * axes.sx + b * axes.fx, 0, a * axes.sz + b * axes.fz);
  const hd = T.boats.heading * Math.PI / 180, boxA = [], boxB = [], hw = T.moleW / 2, bq = T.mouth - hw;
  const addBox = (a0, a1, y0, y1, b0, b1) => { boxA.push(V4((a0 + a1) / 2, (y0 + y1) / 2, (b0 + b1) / 2, 0)); boxB.push(V4((a1 - a0) / 2, (y1 - y0) / 2, (b1 - b0) / 2, 1)); };
  const slot = (k) => T.slot0 + T.pitch * k, bh = T.boathouses;
  for (const k of bh.slots) addBox(bh.a0, bh.a1, bh.floor, bh.floor + 2.5, slot(k) - bh.w / 2, slot(k) + bh.w / 2);
  while (boxA.length < NBOX) { boxA.push(V4()); boxB.push(V4()); }
  const U = {
    ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
    uTime: ou.uTime, uCentre: ou.uCentre,
    uLamp: sky.shadow.uLamp, uBoat: sky.shadow.uBoat, uClock: { value: 0 }, uPix: { value: 2 / 720 }, uPlane: { value: 0.24 },
    uBoatDir: { value: W3(Math.sin(hd), Math.cos(hd)) }, uWind: { value: W3(T.wind[0], T.wind[1]) },
    uLampCol: { value: new THREE.Color().setRGB(LL.color[0], LL.color[1], LL.color[2]) }, uFillCol: { value: new THREE.Color(P.fill) }, uKey: { value: LL.key }, uFill: { value: LL.fill },
    uSkyCol: { value: new THREE.Color(P.mid) }, uHazeCol: { value: new THREE.Color(P.haze) }, uBounce: { value: new THREE.Color(look ? '#3a2c22' : '#2e2e2a') },
    uGlowCol: { value: new THREE.Color(look ? '#ffd9a0' : '#fff2d2') }, uLit: { value: look ? 1 : 0 },
    uOrg: { value: V4(axes.ox, axes.oz, axes.fx, axes.fz) },
    uPosts: { value: V4(T.posts.a, T.slot0 + T.pitch / 2, T.pitch, T.slots + 1) }, uPostH: { value: new THREE.Vector3(g, g + T.posts.h, T.posts.r) },
    uMastS: { value: V4(T.boats.a, T.boats.b0, T.pitch, T.boats.n) }, uMastP: { value: V4(T.boats.portA, T.boats.portB0, T.pitch, T.boats.portN) }, uMastH: { value: new THREE.Vector3(0.3, 0.3 + T.boats.mast, 0.06) },
    uPole: { value: V4(T.pole.a, T.pole.b, T.moleTop + T.pole.h, T.pole.r) }, uLH: { value: V4(axes.ox + T.eastHeadA * axes.sx + T.mouth * axes.fx, axes.oz + T.eastHeadA * axes.sz + T.mouth * axes.fz, clock.lamp, 0.75) },
    uPh: { value: V4(clock.pennant, clock.sheets, clock.lean, clock.billow) }, uPf: { value: V4(clock.ripple[0], clock.ripple[1], clock.puff[0], clock.puff[1]) },
    uBoxA: { value: boxA }, uBoxB: { value: boxB },
    uStone: { value: [V4(T.quayA, T.south - 10, 1e4, bq), V4(T.rootA, bq, 1e4, T.northB), V4(T.eastHeadA, bq, T.rootA, T.mouth + hw), V4(T.westA - 3, bq, T.westHeadA, T.mouth + hw),
      V4(T.westA - 3, T.south - 10, T.westA + 3, bq), V4(T.westA + 3, T.south - 10, T.quayA, T.south)] },
    uHeads: { value: V4(T.eastHeadA, T.mouth, T.westHeadA, (T.headR + 0.27) * (T.headR + 0.27)) },
  };
  const base = { uniforms: U, vertexShader: TOWN_VERT, fragmentShader: TOWN_FRAG_A + TOWN_FRAG_B, fog: true, side: THREE.DoubleSide };
  const town = new THREE.ShaderMaterial(base);
  const image = new THREE.ShaderMaterial({ ...base, defines: { MIRROR: 1 }, transparent: true, premultipliedAlpha: true, depthWrite: true });
  // the widened thin members' two coats: the same paint, blended by each member's own cover (the thin-member law)
  // and WRITING NO DEPTH. What then orders a widened member: the town's solid things, every member where it is
  // whole and the image's own coat have written their depth before it is drawn, so it is hidden where they stand
  // before it and laid over them where they stand behind; whatever see-through thing is drawn later (the smoke,
  // another part's ropes) is laid over it by that thing's own cover, never cut by it; two widened members that
  // cross are both laid, each by its cover. Of a round member only the near half is laid, so its cover is laid
  // once (the paint's last lines say which half that is, in the town and in the image).
  // (Each of these materials is drawn in a single pass: a ShaderMaterial of this three.js is.)
  const thin = new THREE.ShaderMaterial({ ...base, defines: { THIN: 1 }, transparent: true, depthWrite: false });
  const thinImage = new THREE.ShaderMaterial({ ...base, defines: { MIRROR: 1, THIN: 1 }, transparent: true, premultipliedAlpha: true, depthWrite: false });
  return { U, town, image, thin, thinImage };
}
// END-OF-MATERIALS

// THE IMAGE'S OWN ORDER OF DRAWING. An image is laid over the water in one coat, so nothing's image may be laid over
// another's behind it: the pieces are drawn nearest the flown line first (RANK), and inside a piece its triangles
// are put in order here: body by body, the nearer the line first and then the nearer along it, on a body its trim
// before its wall and its near side before its far (what is drawn behind a drawn thing fails the depth test).
const RANK = { boats: 0, boathouses: 1, shore: 2, stone: 3, lighthouse: 4, dress: 5, houses: 6, racks: 7, church: 8, hills: 9 };
function imageOrder(c, ci, bodies, axes) {
  const P = c.P, M = c.M, n = P.length / 9, key = new Float64Array(n), front = new Float32Array(n).fill(-1), along = new Float32Array(n);
  const aOf = (v) => Math.abs((P[v * 3] - axes.ox) * axes.sx + (P[v * 3 + 2] - axes.oz) * axes.sz), bOf = (v) => (P[v * 3] - axes.ox) * axes.fx + (P[v * 3 + 2] - axes.oz) * axes.fz;
  for (const b of bodies) {
    if (b.chunk !== ci) continue;
    let f = Infinity, bm = Infinity; for (let v = b.start; v < b.end; v++) { f = Math.min(f, aOf(v)); bm = Math.min(bm, bOf(v)); }
    for (let t = Math.floor(b.start / 3); t * 3 < b.end; t++) { front[t] = Math.round(f); along[t] = Math.round(bm); }
  }
  for (let t = 0; t < n; t++) {
    const v = t * 3, ac = (aOf(v) + aOf(v + 1) + aOf(v + 2)) / 3; if (front[t] < 0) { front[t] = Math.round(ac); along[t] = Math.round(bOf(v)); }
    key[t] = front[t] * 1e9 + (along[t] + 500) * 1e5 + (15 - Math.floor((M[v * 4] + 0.5) / 16)) * 1e3 + ac;
  }
  // (a thin member's triangles, those that carry an axis, are left out: their image rides at the end of the image's index)
  const order = Array.from({ length: n }, (_, t) => t).filter((t) => !(c.A[t * 12 + 3] > 0)).sort((p, q) => key[p] - key[q]), m = order.length, index = new Uint32Array(m * 3);
  for (let i = 0; i < m; i++) { const v = order[i] * 3; index[i * 3] = v; index[i * 3 + 1] = v + 1; index[i * 3 + 2] = v + 2; }
  return index;
}
// END-OF-ORDER

// ---- THE CHIMNEYS' SMOKE: a medium, not a body. Every house has the same thin pale column: it rises straight from
// the pot, leans at the one height (TOWN.smoke.bend) the way the pennant flies, and thins out; its puffs rise by the
// clock (a wrap: the pattern's lattice closes on itself) in step on every chimney. A fixed round sleeve about the
// column's line marks the smoke's own round section (level rings of the column's radius; a fixed skin: nothing is
// turned to the eye). ITS COVER IS READ AS LIGHT TAKES IT, by the length of smoke the eye's ray crosses in that
// section: the smoke is thickest on the column's line and none at its skin (its density falls as 1 - r^2 / R^2
// across the section of radius R), so a ray that meets the skin where the ring's own normal makes the cosine mu with
// the ray's level way through the column runs a half chord R mu and gathers (4/3) rho R mu^3 of smoke, the more
// by 1 / |u| the more steeply it climbs along the column (u: the ray's level way, the column's own lean taken off).
// The smoke on the line thins as the column widens (rho R is held: the same smoke over a wider section), is parted
// by the puffs and thins out with height; the cover is 1 - exp(-that). So its edge is soft because little smoke lies
// there, not because it is turned from the eye. Its image in the basin is the smoke in the town's own mirror, by
// the mirror's whole law and nothing of it held back (laid after the town's image, writing no depth).
const SMOKE_VERT = /* glsl */`
attribute vec3 aSm;                                   // how far up the column (0..1), metres above the pot, metres it leans
uniform float uClock; uniform vec3 uWind; uniform vec4 uPh;
varying vec3 vW, vN, vSm; varying float vViewZ, vLean; varying vec2 vProj;
#include <fog_pars_vertex>
void main(){
  vec4 wp = modelMatrix * vec4(position, 1.);
  float br = .14 * sin(uClock * .31 + uPh.z) + .05 * sin(uClock * .83 + aSm.y * .2 + uPh.z * 1.7);
  wp.xyz += uWind * (aSm.z * br);                                           // the lean breathes, every column as one
  // (how far the column's line leans in a metre of height, for the cover's law: the built lean is ${fl(TOWN.smoke.lean)} t^2 m, t the
  // share of the way from the bend to the top, so its slope is 2 sqrt(${fl(TOWN.smoke.lean)} x the lean) / ${fl(TOWN.smoke.top - TOWN.smoke.bend)}; it breathes with the lean)
  vLean = ${fl(2 * Math.sqrt(TOWN.smoke.lean) / (TOWN.smoke.top - TOWN.smoke.bend))} * sqrt(max(aSm.z, 1e-6)) * (1. + br);
  // it billows: swellings travel up the column by the clock (no straight-sided sleeve: a pipe is not smoke)
  float bil = .3 * sin(aSm.y * .9 - uClock * 1.3 + uPh.w) + .18 * sin(aSm.y * 2.1 - uClock * 2.2 + uPh.z + uPh.w);
  wp.xyz += mat3(modelMatrix) * normal * ((${fl(TOWN.smoke.r0)} + ${fl(TOWN.smoke.grow)} * aSm.y) * bil * smoothstep(0., 2., aSm.y));
  vW = wp.xyz; vN = mat3(modelMatrix) * normal; vSm = aSm; vProj = vec2(projectionMatrix[2][2], projectionMatrix[3][2]);
#ifdef MIRROR
  wp.y = -wp.y;
#endif
  vec4 mvPosition = viewMatrix * wp; vViewZ = -mvPosition.z; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const SMOKE_FRAG = /* glsl */`
uniform float uClock, uKey, uFill, uPlane; uniform vec3 uLamp, uLampCol, uFillCol, uWind; uniform vec4 uOrg, uStone[6], uHeads, uPf;
varying vec3 vW, vN, vSm; varying float vViewZ, vLean; varying vec2 vProj;
#include <fog_pars_fragment>
${GLSL_HASH}
float hashW(vec2 p){ p.y = mod(p.y, 64.); return hash12(p); }   // (the kit's hash12 on a lattice that closes on itself every 64 rows)
float puff(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(hashW(i), hashW(i + vec2(1., 0.)), f.x), mix(hashW(i + vec2(0., 1.)), hashW(i + vec2(1., 1.)), f.x), f.y); }
#ifdef MIRROR
// (the town's paint's own soft noise, written out again: the ripples of the one mirror break the smoke's image too)
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(hash12(i), hash12(i + vec2(1., 0.)), f.x), mix(hash12(i + vec2(0., 1.)), hash12(i + vec2(1., 1.)), f.x), f.y); }
#endif
void main(){
  vec3 E = cameraPosition;
#ifdef MIRROR
  E.y = -E.y;
#endif
  vec3 N = normalize(vN + 1e-5), V = E - vW; V /= max(length(V), 1e-3);
  float s = vSm.x, rnd = N.x * 1.7 + N.z * 1.1;
  float pat = puff(vec2(rnd + vSm.y * .13, vSm.y * .6 - mod(uClock * .9 + uPf.z, 64.))) * .6 + puff(vec2(rnd * 1.9 + 4., vSm.y * 1.3 - mod(uClock * 1.6 + uPf.w, 64.))) * .4;
  // wisps, not a sleeve: the puffs part it and it is gone before its top. THE COVER, AS LIGHT TAKES IT (the law is
  // said at this paint's head): u = the ray's level way through the column, the column's lean taken off; mu = the
  // cosine at the skin; the smoke gathered is (4/3) rho R mu^3 / |u|, where (4/3) rho R, the smoke through the
  // column's middle seen level, is .2 where a puff is thinnest and 1.15 where it is thickest (a cover of .18 to
  // .68 there: 1 - exp(-.2), 1 - exp(-1.15)), thinned by the column's own law of height
  vec2 u = V.xz - uWind.xz * (vLean * V.y); float ul = sqrt(max(dot(u, u), .01)), mu = clamp(dot(N.xz, u) / ul, 0., 1.);
  float dens = smoothstep(.25, .75, pat), through = (.2 + .95 * dens) * smoothstep(0., .05, s) * (1. - smoothstep(.18, .85, s));
  float al = 1. - exp(-through * mu * mu * mu / ul);
  vec3 L = uLamp - vW; L /= max(length(L), 1.);
  vec3 c = vec3(.86, .86, .87) * (.85 + .25 * pat) * (uFillCol * (uFill * 1.05) + uLampCol * (uKey * (.3 + .45 * max(dot(N, L), 0.))));
  gl_FragColor = vec4(c, al);
  #include <fog_fragment>
#ifdef MIRROR
  float k0 = clamp(cameraPosition.y / max(cameraPosition.y + vW.y, 1e-3), 0., 1.); vec2 w = cameraPosition.xz + (vW.xz - cameraPosition.xz) * k0, q = w - uOrg.xy;
  float cosT = cameraPosition.y / max(length(vec3(w.x - cameraPosition.x, cameraPosition.y, w.y - cameraPosition.z)), 1e-3), g = 1. - clamp(cosT, 0., 1.);
  // THE SMOKE'S IMAGE IS THE SMOKE IN THE TOWN'S OWN MIRROR, nothing of it held back: its own cover times the
  // mirror's law exactly as the town's image takes it (the paint's MIRROR lines): stronger the flatter the eye's
  // ray lies on the water, broken by the same ripples at the water's own place (let go to their own mean, .5, as
  // their footprint outgrows them), and the water's .88 of the colour
  float fww = max(length(fwidth(w)), 1e-4);
  float rp = vnoise(w * vec2(.55, .55) + uClock * vec2(.1, .16) + uPf.xy) * .55 + vnoise(w * 1.9 - uClock * vec2(.27, .12) + uPf.yx) * .45;
  al *= (.74 + .24 * g * g) * mix(1., mix(smoothstep(.36, .64, rp), .5, smoothstep(.5, 2., fww)), .24);
  gl_FragColor.rgb *= .88;
  float kp = clamp((cameraPosition.y - uPlane) / max(cameraPosition.y + vW.y, 1e-3), 1e-3, 1.), zp = max(vViewZ * kp, 1e-3);
  gl_FragDepth = clamp(.5 * (-vProj.x + vProj.y / zp) + .5 - .02 * (1. - gl_FragCoord.z), 0., 1.);
  vec2 p = vec2(dot(q, vec2(-uOrg.w, uOrg.z)), dot(q, uOrg.zw)), he = p - uHeads.xy, hw = p - vec2(uHeads.z, uHeads.y); float on = step(dot(he, he), uHeads.w) + step(dot(hw, hw), uHeads.w);
  for (int i = 0; i < 6; i++) on += step(uStone[i].x, p.x) * step(p.x, uStone[i].z) * step(uStone[i].y, p.y) * step(p.y, uStone[i].w);
  al *= 1. - step(.5, on);                                                 // no image lies on stone
#endif
  gl_FragColor = vec4(gl_FragColor.rgb * al, al);
}`;
// END-OF-SMOKE-PAINT
// the smoke's sleeves: one to a chimney, all alike from the pot up (the pot's place is the house's own)
function smokeGeometry(T, axes, detail) {
  const S = T.smoke, sides = 8, segs = 14, P = [], N = [], A = [];
  const wl = Math.hypot(T.wind[0], T.wind[1]) || 1, wa = T.wind[0] / wl, wb = T.wind[1] / wl;
  for (let k = 0; k < T.slots; k++) {
    if (detail < 0.8 && k % 2) continue;                                   // (thinned: every second chimney smokes; each column as it was)
    const H = houseShape(T, k), y0 = H.ridge + 1.62, a = H.a0 + 4.0, b = H.bc;
    const ring = (j) => { const s = j / segs, y = y0 + (S.top - y0) * s, t = Math.max(y - S.bend, 0) / (S.top - S.bend), lean = S.lean * t * t;
      return { s, y, lean, r: S.r0 + S.grow * (y - y0), a: a + wa * lean, b: b + wb * lean }; };
    for (let j = 0; j < segs; j++) { const R0 = ring(j), R1 = ring(j + 1);
      for (let i = 0; i < sides; i++) for (const [R, ii] of [[R0, i], [R0, i + 1], [R1, i + 1], [R0, i], [R1, i + 1], [R1, i]]) {
        const an = (ii / sides) * 2 * Math.PI, c = Math.cos(an), sn = Math.sin(an), pa = R.a + c * R.r, pb = R.b + sn * R.r;
        P.push(axes.ox + pa * axes.sx + pb * axes.fx, R.y, axes.oz + pa * axes.sz + pb * axes.fz);
        N.push(c * axes.sx + sn * axes.fx, 0, c * axes.sz + sn * axes.fz); A.push(R.s, R.y - y0, R.lean);
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('aSm', new THREE.Float32BufferAttribute(A, 3));
  g.computeBoundingSphere(); g.boundingSphere.radius += 2.5;
  return g;
}
// END-OF-SMOKE

// ---- THE BUILD. opts: { scene, path, length, look, sky (the hero's: sky.shadow), ocean (the hero's sea: its uTime, uCentre) }.
// opts.detail (the world's ctx.quality.detail, else 1) thins the counts of small things: the kit gulls on every wheel,
// the chimneys that smoke, the sitting gulls, flower boxes, barrels, nets, bollards, the hill's trees (every second) and
// the runs its walls are built in (6 m for 3 m, on the same lines); what remains keeps shape and place.
// Returns { object, bodies, triangles, flocks, axes, fauna, uniforms, quay(u, out), update(dt, time, camera, u), dispose() }.
export async function makeTown(ctx, opts) {
  const { path, look, sky, ocean } = opts, T = TOWN, detail = opts.detail || (ctx.quality && ctx.quality.detail) || 1;   // (the world hands detail in; it thins counts only)
  const rng = ctx.core.makeRng(ctx.core.hashSeed('town-paint:' + ctx.seed));
  // THE CLOCK'S DICE (stream 'town-clock:' + seed), all drawn here before anything is built: where each thing the
  // clock moves begins. The rates are typed in the paint; no beginning is.
  const dice = ctx.core.makeRng(ctx.core.hashSeed('town-clock:' + ctx.seed)), turn = () => dice() * 2 * Math.PI;
  const clock = { lamp: turn(), pennant: turn(), sheets: turn(), lean: turn(), billow: turn(), ripple: [dice() * 64, dice() * 64], puff: [dice() * 64, dice() * 64],
    boats: Array.from({ length: T.boats.n + T.boats.portN }, turn) };
  // the town's axes: the route's first metre and its heading there (the line is straight to beyond the town's north end)
  const p0 = path.pointAt(0, new THREE.Vector3()), t0 = path.tangentAt(0, new THREE.Vector3()), hl = Math.hypot(t0.x, t0.z) || 1;
  const axes = { ox: p0.x, oz: p0.z, fx: t0.x / hl, fz: t0.z / hl, sx: -t0.z / hl, sz: t0.x / hl };
  const place = (a, y, b, out = new THREE.Vector3()) => out.set(axes.ox + a * axes.sx + b * axes.fx, y, axes.oz + a * axes.sz + b * axes.fz);
  const B = new Paint(axes), env = { rng, detail, clock };
  for (const piece of PIECES) { piece(B, T, env); await ctx.yield(); }
  B.end();
  const M = paintMaterials(look, axes, sky, ocean, clock), object = new THREE.Group(); object.name = 'the-town';
  let triangles = 0;
  // THE TOWN IN FOUR DRAWS (its sixteen pieces were sixteen draws and their images sixteen more: the same triangles,
  // the pieces' images in the same order of RANK; only two pieces of one rank, which the engine used to sort the
  // farther first, now lie in one fixed order, the one nearer the entry first, as a piece's own triangles always
  // did: the image's own law, nearer before farther). All the pieces' vertices stand in ONE set of arrays,
  // piece after piece as they were made (a body's range is counted on that set):
  //   'town:all'         every triangle of the set, in its own order, in the solid coat (which lays a thin member
  //                      only where it is drawn at its own width: the paint's last lines);
  //   'town-image'       the image in the basin: the solid triangles piece by piece, nearest the flown line first
  //                      (RANK; of two pieces of one rank the one nearer the entry first), each in its own image
  //                      order; and after them, in the same draw, the thin members' (laid where they are whole);
  //   'town-thin'        the thin members (every triangle that carries an axis) where they are widened, blended by
  //                      their cover, no depth written;
  //   'town-thin-image'  their image likewise: the tail of the image's own index, drawn once more in the widened coat.
  // So a thin triangle is handed to the card in four draws, and each of its pixels is laid by one of two.
  const FIELDS = [['P', 3, 'position'], ['N', 3, 'normal'], ['C', 3, 'color'], ['M', 4, 'aMat'], ['A', 4, 'aAxis'], ['V', 4, 'aMove']];
  const CH = B.chunks, base = [], G = {}, sum = (a) => a.reduce((s, n) => s + n, 0); let nV = 0; for (const c of CH) { base.push(nV); nV += c.P.length / 3; }
  for (const [k, w] of FIELDS) G[k] = new Float32Array(nV * w);
  const trisOf = CH.map((c) => c.P.length / 9), thinOf = CH.map((c) => { let n = 0; for (let i = 3; i < c.A.length; i += 12) if (c.A[i] > 0) n++; return n; });
  // (the image's pieces in their order, and where each one's stretch of the image's index begins)
  const rankOf = (i) => RANK[CH[i].name.split('-')[0]] ?? 5, alongOf = CH.map((c) => { let m = Infinity; for (let v = 0; v < c.P.length; v += 9) m = Math.min(m, (c.P[v] - axes.ox) * axes.fx + (c.P[v + 2] - axes.oz) * axes.fz); return m; });
  const ranked = CH.map((c, i) => i).filter((i) => CH[i].mirror && trisOf[i] > thinOf[i]).sort((p, q) => rankOf(p) - rankOf(q) || alongOf[p] - alongOf[q]), imgAt = []; let nImg = 0;
  for (const i of ranked) { imgAt[i] = nImg; nImg += (trisOf[i] - thinOf[i]) * 3; }
  const thinIx = new Uint32Array(3 * sum(thinOf)), imageIx = new Uint32Array(nImg + 3 * sum(thinOf.filter((n, i) => CH[i].mirror)));
  let tAt = 0, tiAt = nImg;
  for (let ci = 0; ci < CH.length; ci++) {
    const c = CH[ci], nT = trisOf[ci], b0 = base[ci]; if (!nT) continue;
    for (const [k, w] of FIELDS) G[k].set(c[k], b0 * w);
    for (let t = 0; t < nT; t++) {
      if (!(c.A[t * 12 + 3] > 0)) continue;                                            // (a solid triangle: the solid coat draws the set whole, in its own order)
      const v = b0 + t * 3; thinIx[tAt++] = v; thinIx[tAt++] = v + 1; thinIx[tAt++] = v + 2;
      if (c.mirror) { imageIx[tiAt++] = v; imageIx[tiAt++] = v + 1; imageIx[tiAt++] = v + 2; }
    }
    if (imgAt[ci] !== undefined) {
      await ctx.yield();                                                             // (laying a piece's image in its order is a build step of its own)
      const o = imageOrder(c, ci, B.bodies, axes); for (let i = 0, at = imgAt[ci]; i < o.length; i++) imageIx[at + i] = o[i] + b0;
    }
    c.P = c.N = c.C = c.M = c.A = c.V = null;
    await ctx.yield();
  }
  // the four draws: one set of vertices. The town's image, at order 1.55, is laid after the sea and before the rigs'
  // joined image at 1.56 and the bay's own at 1.64; the widened members' image (1.66) after the bay's own image
  // (which writes its depth: so that image hides it where it stands before it) and before the smoke's (1.7); the
  // widened members (1.8) after every image and before the town's smoke (1.85)
  {
    const attr = {}; for (const [k, w, name] of FIELDS) attr[name] = new THREE.BufferAttribute(G[k], w);
    const geo = (ix) => { const g = new THREE.BufferGeometry(); for (const name in attr) g.setAttribute(name, attr[name]); if (ix) g.setIndex(new THREE.BufferAttribute(ix, 1)); return g; };
    const gs = geo(null), gi = geo(imageIx), gt = geo(thinIx), gti = geo(imageIx.subarray(nImg));   // (no index: the set whole; the image's tail: the thin members' image)
    gs.computeBoundingSphere(); gs.boundingSphere.radius += 2.5; gt.boundingSphere = gs.boundingSphere.clone();   // (what the clock moves stays inside)
    gi.boundingSphere = new THREE.Sphere(gs.boundingSphere.center.clone().setY(-gs.boundingSphere.center.y), gs.boundingSphere.radius);   // (the image's bounds: the town's own, mirrored)
    gti.boundingSphere = gi.boundingSphere.clone();
    const all = new THREE.Mesh(gs, M.town), image = new THREE.Mesh(gi, M.image), thin = new THREE.Mesh(gt, M.thin), thinImage = new THREE.Mesh(gti, M.thinImage);
    all.name = 'town:all'; image.name = 'town-image'; thin.name = 'town-thin'; thinImage.name = 'town-thin-image'; image.renderOrder = 1.55; thinImage.renderOrder = 1.66; thin.renderOrder = 1.8;
    for (const m of [all, image, thin, thinImage]) { m.matrixAutoUpdate = false; m.visible = !m.geometry.index || m.geometry.index.count > 0; object.add(m); }
    triangles = (nV + imageIx.length + thinIx.length + imageIx.length - nImg) / 3;      // (every triangle of every one of the four draws, as it is handed to the card)
    await ctx.yield();
  }
  // END-OF-MESHES
  // the chimneys' smoke and its image (two more draws; made here, never in update)
  const smokeBase = { uniforms: M.U, vertexShader: SMOKE_VERT, fragmentShader: SMOKE_FRAG, fog: true, side: THREE.DoubleSide, transparent: true, premultipliedAlpha: true, depthWrite: false };
  const smokeMat = new THREE.ShaderMaterial(smokeBase), smokeImageMat = new THREE.ShaderMaterial({ ...smokeBase, defines: { MIRROR: 1 } });
  const sg = smokeGeometry(T, axes, detail), sgi = new THREE.BufferGeometry(); for (const k of ['position', 'normal', 'aSm']) sgi.setAttribute(k, sg.getAttribute(k));
  sgi.boundingSphere = new THREE.Sphere(sg.boundingSphere.center.clone().setY(-sg.boundingSphere.center.y), sg.boundingSphere.radius);
  const smoke = new THREE.Mesh(sg, smokeMat), smokeImage = new THREE.Mesh(sgi, smokeImageMat);
  smoke.name = 'town-smoke'; smokeImage.name = 'town-smoke-image'; smoke.matrixAutoUpdate = smokeImage.matrixAutoUpdate = false; smoke.renderOrder = 1.85; smokeImage.renderOrder = 1.7;
  // (the smoke after the thin members: it is laid over a pole that stands behind it. A mast that stands BEFORE it
  // keeps it off by its depth where the mast is whole; where the mast is a widened, faint line the smoke is laid
  // over that line by the smoke's own cover: wrong only by the two covers multiplied, on a line a pixel and a half
  // wide, and never a line cut out of the smoke)
  object.add(smoke, smokeImage); triangles += 2 * sg.getAttribute('position').count / 3;
  await ctx.yield();
  // ---- THE GULLS THAT FLY: the kit's birds on five wheels over the basin, the quay and the heads, well over the
  // mast heads and the chimneys. Every call hands wander, count, maxSigma 3 and keepClear with the route; kept.short
  // is 0 on every seed (the proof counts it)
  const lampAt = sky.shadow.uLamp.value, LL = LAMP_LIGHT[look], P = PAINTS[look];
  const fauna = F.makeFauna(object, { light: { sunDir: lampAt.clone().sub(place(0, 0, 100)).normalize(), sunColor: new THREE.Color().setRGB(LL.color[0], LL.color[1], LL.color[2]), sunIntensity: 2.6,
    sky: P.fill, skyIntensity: 1.1, ground: P.haze, groundIntensity: 0.5 } });
  const flocks = [], clear = { path, dist: 2, step: 2, each: true, from: 0, to: Math.min(1, (T.mouth + 140) / opts.length) };
  const wheels = [{ name: 'gulls over the basin', at: [8, 16, 150], radius: 46, count: 5 }, { name: 'gulls by the west breakwater', at: [-78, 12, 186], radius: 30, count: 3 },
    { name: 'gulls over the quay', at: [30, 24, 104], radius: 34, count: 6 }, { name: 'gulls over the inner basin', at: [-8, 20, 48], radius: 38, count: 5 }, { name: 'gulls by the lighthouse', at: [27, 19, 198], radius: 22, count: 4 }];
  for (const w of wheels) {
    await ctx.yield();
    const c = place(w.at[0], w.at[1], w.at[2]);
    const flock = await F.makeFlockAsync({ rng: ctx.core.makeRng(ctx.core.hashSeed(w.name + ':' + ctx.seed)), species: 'gulls', count: Math.max(2, Math.round(w.count * Math.min(1, detail))), center: [c.x, c.y, c.z], radius: w.radius, height: 2.5,
      spread: [8, 2.5, 16], wander: [1.4, 0.7, 1.4, 0.35], maxSigma: 3, keepClear: clear }, ctx.yield);
    fauna.add(flock); flocks.push({ name: w.name, flock });
  }
  await ctx.yield();
  const size = new THREE.Vector2();
  const bodies = B.bodies.map((b) => ({ name: b.name, kind: b.kind, pad: b.pad, mesh: 'town:all', start: base[b.chunk] + b.start, end: base[b.chunk] + b.end }));   // (a body's vertices in the town's one set)
  if (opts.scene) opts.scene.add(object);
  return {
    object, bodies, triangles, flocks, axes, fauna, uniforms: M.U,
    // THE QUAY'S LOOK: a place on the quay front worked out from u alone, 50 m ahead of the boat's own place along
    // the fronts, coming to rest on the lighthouse (the proof walks it with the route's own length: ahead of the eye and
    // under 110 degrees off the line from the first metre to the harbour mouth)
    quay(u, out = new THREE.Vector3()) { const bt = clamp(u * opts.length + 50, 150, T.mouth + 4), s = smoothstep(185, T.mouth + 4, bt);
      return place(lerp(T.frontA, T.eastHeadA + 2, s), lerp(T.quayTop + 5.5, 9, s), bt, out); },
    update(dt, time, camera, u) {
      M.U.uClock.value = time;
      if (ctx.renderer) { ctx.renderer.getDrawingBufferSize(size); M.U.uPix.value = 2 / Math.max(size.y, 1); }
      fauna.update(dt, time, camera, u);
    },
    dispose() {
      object.traverse((m) => { if (m.isMesh && m.name.startsWith('town')) m.geometry.dispose(); });   // (the town's four, the smoke's two)
      M.town.dispose(); M.image.dispose(); M.thin.dispose(); M.thinImage.dispose(); smokeMat.dispose(); smokeImageMat.dispose();
      for (const f of flocks) { f.flock.geometry.dispose(); f.flock.material.dispose(); const tx = f.flock.route && f.flock.route.texture; if (tx && tx.dispose) tx.dispose(); }
    },
  };
}
