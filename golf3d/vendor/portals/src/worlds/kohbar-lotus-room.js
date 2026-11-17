// THE LOTUS ROOM: the afternoon before a wedding in a mud-walled house in Mithila, twenty times life size.
//
// One room, x east (-110 .. 80), z south (-45 .. 45), eaves at 60, ridge at 96 along z 0. The east gable is
// the hero (src/parts/kohbar-lotus-room.js): the lotus wheel turning about its bamboo stem. Everything else
// is built here in the same manner: seven flat pigments, unlit, no fog, no bloom.
//   shell   floor, three walls (one strip bent round two 8 m corners, coordinate s along it), plinth, roof mat
//           and rafters, door reveal, portal niche: one mesh, painted analytically in its fragment shader
//           (floor drawing, sun patch, river band, eaves border, sun and moon discs, sown marks).
//   paint   ink figures drawn in (s, y) and bent onto the leaning, bulging plaster in the vertex shader:
//           creeper, bamboo grove, peacocks, banana plants, lamps, lotus; movers that slide in the wall (sixty
//           fish along the river, snakes, bees, the arch's parrots); peacock tail feathers that hinge open.
//   relief  real things in flat colour with a black inverted hull: grain jars, water pot, plate, incense holder,
//           baskets, clay lamps, hanging pots that turn in their slings, the bamboo arch round the niche.
//   bits    the marigold garland swinging in the doorway, petals skittering on the floor.
// The room's other lotuses answer the wheel: the big floor flower turns against it and the small floor round with
// it, their petals breathing; on the west wall beside the arch a third lotus turns inside a ring of leaves that goes
// the other way. Round it the end wall is a figure scene: an elephant bringing a curtained palanquin (no person is
// drawn, as the room's manner asks), a kalash between two big parrots in the gable, a bamboo clump with parrots in
// the corner. Tall lotus plants, tortoises, fish and parrots stand in the band under the river on both long walls.
// Casts by seed: peacocks or (one visit in seven) a pair of elephants; marigold or mango-leaf garland.
// Looks by seed (or ctx.vary.hour): late sun (all pigments, the turmeric patch climbs and opens the buds),
// grey morning in the line manner (black line on rice white, buds open in turn), blue dusk (indigo and rose,
// a lamp is lit in each niche and the buds open with them). Rare: the wheel stalls and turns the other way (and the
// three painted lotuses with it); the creatures ringing it leap and turn over one after another round the wheel, and
// the wave runs on down both side walls, every fish leaping out of the river and flipping about its middle.
// Scripted to u: peacock tails fan (or elephant trunks lift) 0.085-0.16 and 0.135-0.195; buds open with the patch
// 0.3-0.7; the west elephant lifts its trunk 0.73-0.83; the arch's parrots hop aside 0.87-0.95; rare 0.42-0.64.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep, bell } from '../kit/core.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { buildHero, makeInk, inkLoop, inkArc, PAINT_VERT, PAINT_FRAG, drawFish, drawParrot, drawTurtle, drawSprig } from '../parts/kohbar-lotus-room.js';

const TAU = Math.PI * 2;
const PALETTE = ['#F3EBD9', '#1B1714', '#E9A91C', '#D8432B', '#27407F', '#3F8E3C', '#E27A9A'];
// the wall strip: south wall (east to west), south-west corner, west wall, north-west corner, north wall
const S1 = 182, S2 = S1 + 4 * Math.PI, S3 = S2 + 74, S4 = S3 + 4 * Math.PI, SL = S4 + 182;
const S_DOOR = 24, S_NICHE = S2 + 65;                    // door centre (x 56), niche centre (z -28)
const S_MED = S2 + 33, MED_Y = 33;                       // the third lotus, on the west wall beside the arch (z 4)
const sSouth = (x) => 80 - x, sNorth = (x) => S4 + x + 102;
const f4 = (x) => x.toFixed(4);

const FOG_V = '\n#include <fog_pars_vertex>\n', FOG_VM = '\n#include <fog_vertex>\n';
const FOG_F = '\n#include <fog_pars_fragment>\n', FOG_FM = '\n#include <fog_fragment>\n';

// the plaster: where the wall strip is, how far it bulges and leans; the same in JS below (makeWall)
const WALLMAP = /* glsl */`
uniform vec4 uWB;
void wallAt(float s, out vec2 p, out vec2 n) {
  if (s < ${f4(S1)}) { p = vec2(80. - s, 45.); n = vec2(0., -1.); }
  else if (s < ${f4(S2)}) { float a = (s - ${f4(S1)}) / 8.; p = vec2(-102. - 8. * sin(a), 37. + 8. * cos(a)); n = vec2(sin(a), -cos(a)); }
  else if (s < ${f4(S3)}) { p = vec2(-110., 37. - (s - ${f4(S2)})); n = vec2(1., 0.); }
  else if (s < ${f4(S4)}) { float a = (s - ${f4(S3)}) / 8.; p = vec2(-102. - 8. * cos(a), -37. - 8. * sin(a)); n = vec2(cos(a), sin(a)); }
  else { p = vec2(-102. + (s - ${f4(S4)}), -45.); n = vec2(0., 1.); }
}
float riverY(float s) { return 40. + max(14. * (1. - smoothstep(9., 25., abs(s - ${f4(S_NICHE)}))), 16. * (1. - smoothstep(15., 33., abs(s - ${f4(S_MED)})))); }
float wallOff(float s, float y) {
  float e = smoothstep(0., 8., s) * smoothstep(0., 8., ${f4(SL)} - s) * smoothstep(3.2, 9., y);
  e *= smoothstep(0.5, 7., max(abs(s - ${f4(S_DOOR)}) - 8., y - 34.));
  e *= smoothstep(0.5, 7., length(max(vec2(abs(s - ${f4(S_NICHE)}) - 8., abs(y - 35.) - 9.), 0.)));
  float b = 0.6 * sin(s * 0.07 + y * 0.05 + uWB.x) + 0.45 * sin(s * 0.043 - y * 0.08 + uWB.y)
          + 0.3 * sin(y * 0.17 + s * 0.11 + uWB.z) + 0.014 * (y - 30.) * sin(s * 0.021 + uWB.w);
  return b * e;
}
vec3 wallPos(float s, float y, float proud) {
  vec2 p, n; wallAt(s, p, n); float o = wallOff(s, y) + proud;
  return vec3(p.x + n.x * o, y, p.y + n.y * o);
}`;
function makeWall(wb) {
  const at = (s) => {
    if (s < S1) return [80 - s, 45, 0, -1];
    if (s < S2) { const a = (s - S1) / 8; return [-102 - 8 * Math.sin(a), 37 + 8 * Math.cos(a), Math.sin(a), -Math.cos(a)]; }
    if (s < S3) return [-110, 37 - (s - S2), 1, 0];
    if (s < S4) { const a = (s - S3) / 8; return [-102 - 8 * Math.cos(a), -37 - 8 * Math.sin(a), Math.cos(a), Math.sin(a)]; }
    return [-102 + (s - S4), -45, 0, 1];
  };
  const riverY = (s) => 40 + Math.max(14 * (1 - smoothstep(9, 25, Math.abs(s - S_NICHE))), 16 * (1 - smoothstep(15, 33, Math.abs(s - S_MED))));
  const off = (s, y) => {
    let e = smoothstep(0, 8, s) * smoothstep(0, 8, SL - s) * smoothstep(3.2, 9, y);
    e *= smoothstep(0.5, 7, Math.max(Math.abs(s - S_DOOR) - 8, y - 34));
    e *= smoothstep(0.5, 7, Math.hypot(Math.max(Math.abs(s - S_NICHE) - 8, 0), Math.max(Math.abs(y - 35) - 9, 0)));
    return e * (0.6 * Math.sin(s * 0.07 + y * 0.05 + wb[0]) + 0.45 * Math.sin(s * 0.043 - y * 0.08 + wb[1])
      + 0.3 * Math.sin(y * 0.17 + s * 0.11 + wb[2]) + 0.014 * (y - 30) * Math.sin(s * 0.021 + wb[3]));
  };
  const pos = (s, y, proud = 0, out = new THREE.Vector3()) => { const a = at(s), o = off(s, y) + proud; return out.set(a[0] + a[2] * o, y, a[1] + a[3] * o); };
  const top = (s) => 60 + 36 * (1 - Math.min(45, Math.abs(at(s)[1])) / 45);
  return { at, off, pos, top, riverY };
}

// ---------------------------------------------------------------- the shell
// aW = (s or a pattern coordinate, y or a second coordinate, part)
// parts: 0 wall 1 plinth 2 floor 3 roof mat 4 rafter 5 rim 6 niche lining 7 courtyard
//        8 door reveal (metres along, 0..1 across)  9 lamp recess (metres, metres)
const SHELL_VERT = /* glsl */`
attribute vec3 aW; varying vec3 vW; varying vec3 vP;
${FOG_V}
void main() { vW = aW; vP = position; vec4 mvPosition = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mvPosition; ${FOG_VM} }`;
const SHELL_FRAG = /* glsl */`
uniform vec3 uGround, uInk, uAcc, uB, uSun, uFloor, uPaste, uSow, uMat, uSky, uRim, uWater, uDiscS, uRayS, uDiscM, uRayM, uLining, uReveal, uRecess, uRecessDot;
uniform float uTime, uPatchZ, uPatchOn, uHatch, uRevealK;
uniform vec3 uFlr, uLiningDot;                // floor lotus angles (big, small) and breathing clock; the niche's dots
uniform vec4 uDiscs;                        // sun s, sun y, moon s, moon y
varying vec3 vW; varying vec3 vP;
${FOG_F}
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float ln(float d, float w) { float aw = max(fwidth(d), 1e-4); w = max(w, 0.75 * aw); return 1. - smoothstep(w - aw, w + aw, abs(d)); }
float fillTo(float d) { float aw = max(fwidth(d), 1e-4); return 1. - smoothstep(-aw, aw, d); }
float riverY(float s) { return 40. + max(14. * (1. - smoothstep(9., 25., abs(s - ${f4(S_NICHE)}))), 16. * (1. - smoothstep(15., 33., abs(s - ${f4(S_MED)})))); }
// a faceless disc with turning ray petals
vec3 rayDisc(vec3 col, vec2 d, vec3 cd, vec3 cr, float n, float turn, inout float k) {
  float r = length(d), a = atan(d.y, d.x + (abs(d.x) + abs(d.y) < 1e-4 ? 1e-4 : 0.)) + turn;
  float f = abs(fract(a * n / 6.2831853) - 0.5) * 2.;         // 0 on a ray's axis, 1 between rays
  float ray = (r - 5.4) - 4.6 * (1. - f * 1.25);
  col = mix(col, cr, fillTo(ray) * step(5.4, r));
  k = max(k, ln(ray, 0.09) * step(5.6, r));
  col = mix(col, cd, fillTo(r - 4.6));
  k = max(k, max(ln(r - 4.6, 0.12), ln(r - 5.4, 0.08)));
  float f2 = fract(a * n * 2. / 6.2831853) - 0.5;
  float dl = length(vec2(f2 * 6.2831853 / (n * 2.) * r, r - 3.5));
  col = mix(col, uGround, fillTo(dl - 0.26));
  k = max(k, ln(r - 2.3, 0.07));
  return col;
}
void main() {
  float part = vW.z; vec3 col = uGround; float k = 0.;
  if (part < 0.5) {
    // ---- plaster
    float s = vW.x, y = vW.y; vec2 p = vec2(s, y);
    float pxm = max(fwidth(s) + fwidth(y), 1e-4);
    float west = step(${f4(S1)}, s) * step(s, ${f4(S4)});
    float top = 60. + 36. * (1. - min(abs(vP.z), 45.) / 45.);
    float db = (top - y) * mix(1., 0.781, west);
    float h = (db - 0.5) / 1.5, tri = 1. - abs(2. * fract(s / 1.9) - 1.), inB = step(0., h) * step(h, 1.);
    col = mix(col, h < tri ? uAcc : uB, inB);
    k = max(max(ln(db - 0.5, 0.08), ln(db - 2.0, 0.08)), ln((h - tri) * 1.5, 0.08) * inB);
    // the river: two hatched banks and running ripples between
    float d = y - riverY(s), ad = abs(d);
    float inR = fillTo(ad - 3.5);
    col = mix(col, uGround, inR);
    float rw = floor(d / 1.3 + 0.5), dd = d - rw * 1.3 - 0.3 * sin(s * 0.85 + uTime * 0.9 + rw * 2.1);
    float rip = ln(dd, 0.07) * step(ad, 2.6) * step(0.35, fract(s * 0.11 + rw * 0.37 + uTime * 0.05)) * (1. - smoothstep(0.25, 0.7, pxm));
    col = mix(col, uWater, rip);
    float arg = s * uHatch + d * 2.4 - uTime * 1.3, fw = max(fwidth(arg), 1e-3);
    float hatch = smoothstep(0.3 - fw, 0.3 + fw, sin(arg)) * (1. - smoothstep(0.7, 1.7, fw)) * step(2.95, ad) * step(ad, 3.5);
    k = max(k, max(hatch * 0.92, max(ln(ad - 2.95, 0.07), ln(ad - 3.5, 0.09))));
    // border round the doorway
    float dq = max(abs(s - ${f4(S_DOOR)}) - 8., y - 34.);
    float al = y > 34. - (abs(s - ${f4(S_DOOR)}) - 8.) ? s : y;
    float h2 = (dq - 0.5) / 1.6, tr2 = 1. - abs(2. * fract(al / 2.1) - 1.), in2 = step(0., h2) * step(h2, 1.);
    col = mix(col, h2 < tr2 ? uB : uAcc, in2);
    k = max(k, max(max(ln(dq - 0.5, 0.09), ln(dq - 2.1, 0.09)), ln((h2 - tr2) * 1.6, 0.08) * in2));
    // the vent under the west ridge
    vec2 dv = p - vec2(${f4(S2 + 37)}, 87.5);
    float vt = max(abs(dv.x) * 1.25 + dv.y - 4.2, -dv.y - 3.2);
    col = mix(col, uSky, fillTo(vt));
    k = max(k, max(ln(vt, 0.14), ln(vt - 0.9, 0.07)));
    // sun and moon, high on the north wall
    float kd = 0.; vec3 c0 = col;
    col = rayDisc(col, (p - uDiscs.xy) * 1.75, uDiscS, uRayS, 16., -uTime * 0.14, kd);
    col = rayDisc(col, (p - uDiscs.zw) * 1.75, uDiscM, uRayM, 12., uTime * 0.1, kd);
    float nearDisc = min(length(p - uDiscs.xy), length(p - uDiscs.zw));
    k = max(k, kd);
    // sown marks: triads of dots and chevrons in every gap
    vec2 g2 = p / 2.7; vec2 id2 = floor(g2); float hs = hash(id2 + 3.1);
    vec2 f2 = (fract(g2) - 0.5) * 2.7 - (vec2(hash(id2 + 1.7), hash(id2 + 5.9)) - 0.5) * 1.1;
    float sow = step(3.2, db) * step(4.4, ad) * step(2.9, dq) * step(4.6, y) * step(6.6, nearDisc) * step(1.6, vt);
    float tri3 = min(length(f2 - vec2(0., 0.3)), min(length(f2 - vec2(0.27, -0.16)), length(f2 - vec2(-0.27, -0.16))));
    float chev = max(abs(abs(f2.x) * 0.9 + f2.y) - 0.07, abs(f2.x) - 0.42);
    float mk = hs < 0.5 ? 1. - smoothstep(0.13 - pxm, 0.13 + pxm, tri3) : 1. - smoothstep(-pxm, pxm, chev);
    mk *= sow * (1. - smoothstep(0.2, 0.5, pxm)) * step(hs, 0.8);
    col = mix(col, hs > 0.25 && hs < 0.5 ? uAcc : uInk, mk);
    col = mix(col, uInk, k);
  } else if (part < 1.5) {
    // ---- plinth: triangles between lines
    float s = vW.x, y = vW.y;
    float h = (y - 0.25) / 2.1, tri = 1. - abs(2. * fract(s / 3.2) - 1.), inB = step(0., h) * step(h, 1.);
    col = mix(col, h < tri ? uAcc : uB, inB);
    k = max(max(ln(y - 0.25, 0.09), ln(y - 2.35, 0.09)), ln((h - tri) * 1.5, 0.09) * inB);
    k = max(k, ln(y - 2.72, 0.05));
    col = mix(col, uInk, k);
  } else if (part < 2.5) {
    // ---- floor: a wash, the rice-paste drawing, the door's sun
    vec2 p = vP.xz; float pxm = max(fwidth(p.x) + fwidth(p.y), 1e-4);
    float edge = (p.x - 48.) - (45. - p.y) * 32. / max(45. - uPatchZ, 1.);
    float inside = smoothstep(-pxm, pxm, edge) * uPatchOn;
    vec2 gs = p / 1.3; gs.x += 0.5 * floor(gs.y);
    float st = 1. - smoothstep(0.1, 0.1 + pxm, length(fract(gs) - 0.5) - 0.36 * (1. - smoothstep(0., 7., -edge)));
    st *= uPatchOn * step(edge, 0.) * step(-7., edge) * (1. - smoothstep(0.3, 0.8, pxm));
    col = mix(uFloor, uSun, max(inside, st));
    // the drawing: rings and two rounds of petals about the water pot
    // (the flower turns against the wheel on the east wall and its two rounds of petals breathe; the scalloped
    // rim round it stays where it is)
    vec2 d = p - vec2(-35., -7.); float r = length(d), a0 = atan(d.y, d.x + (abs(d.x) + abs(d.y) < 1e-4 ? 1e-4 : 0.)), a = a0 - uFlr.x;
    float w = 0., br1 = sin(uFlr.z * 0.8), br2 = sin(uFlr.z * 0.8 + 2.2);
    float pet1 = r - (8.5 + (10.3 + 0.9 * br1) * pow(abs(cos(a * 4.)), 0.7 - 0.1 * br1));
    float pet2 = r - (25. + (9.3 + 0.8 * br2) * pow(abs(cos(a * 8. + 0.4)), 0.8 - 0.12 * br2));
    float band = abs(r - 22.) - 2.4;
    float outer = abs(r - 37.6) - 1.3;
    float scal = length(vec2((fract(a0 * 30. / 6.2831853) - 0.5) * 6.2831853 / 30. * r, r - 39.1)) - 1.9;
    w = max(max(fillTo(pet1) * step(8.5, r), fillTo(band)), max(fillTo(pet2) * step(24.4, r), max(fillTo(outer), fillTo(scal) * step(38.9, r))));
    w = max(w, fillTo(r - 7.2));
    k = max(max(ln(pet1, 0.13) * step(8.6, r), ln(band, 0.11)), max(ln(pet2, 0.13) * step(24.5, r), max(ln(outer, 0.1), ln(scal, 0.1) * step(38.9, r))));
    k = max(k, max(ln(r - 7.2, 0.12), ln(r - 6.2, 0.07)));
    // inside the white: accent dots and veins
    float f1 = fract(a * 28. / 6.2831853) - 0.5;
    float dots = fillTo(length(vec2(f1 * 6.2831853 / 28. * r, r - 22.)) - 0.75);
    float f3 = fract(a * 8. / 6.2831853 + 0.5) - 0.5;
    float vein = ln(f3 * 6.2831853 / 8. * r, 0.11) * step(10.5, r) * step(pet1, -1.5);
    float eye1 = fillTo(length(vec2(f3 * 6.2831853 / 8. * r, r - 14.6)) - 1.15);
    float f4 = fract((a * 16. + 0.8) / 6.2831853 + 0.5) - 0.5;
    float eye2 = fillTo(length(vec2(f4 * 6.2831853 / 16. * r, r - 30.)) - 0.95);
    float f5 = fract(a0 * 44. / 6.2831853) - 0.5;
    float od = fillTo(length(vec2(f5 * 6.2831853 / 44. * r, r - 37.6)) - 0.5);
    float acc = max(max(dots, eye1), max(eye2, od));
    k = max(k, vein * (1. - eye1));
    // the rest of the floor: a border along the walls and sown dots
    float dw = min(min(45. - abs(p.y), p.x + 110.), 80. - p.x);
    float hb = (dw - 5.) / 2.4, trb = 1. - abs(2. * fract((abs(p.y) > 45. - dw - 0.01 ? p.x : p.y) / 3.6) - 1.), inb = step(0., hb) * step(hb, 1.);
    w = max(w, inb * step(hb, trb));
    k = max(k, max(ln(dw - 5., 0.1), ln(dw - 7.4, 0.1)) + ln((hb - trb) * 2.4, 0.09) * inb);
    vec2 g = p / 4.2; vec2 id = floor(g); float hs = hash(id + 2.3);
    vec2 ff = (fract(g) - 0.5) * 4.2 - (vec2(hash(id + 1.1), hash(id + 4.7)) - 0.5) * 1.6;
    float tri3 = min(length(ff - vec2(0., 0.55)), min(length(ff - vec2(0.48, -0.28)), length(ff - vec2(-0.48, -0.28))));
    float ringm = abs(length(ff) - 0.8) - 0.16;
    // a smaller round of petals under the middle of the orbit
    // (it turns the other way again, with the wheel)
    vec2 d2 = p - vec2(31., -3.); float r2 = length(d2), a2 = atan(d2.y, d2.x + (abs(d2.x) + abs(d2.y) < 1e-4 ? 1e-4 : 0.)) - uFlr.y;
    float br3 = sin(uFlr.z * 1.05 + 1.);
    float petB = r2 - (4.6 + (7.2 + 0.8 * br3) * pow(abs(cos(a2 * 3.)), 0.7 - 0.1 * br3)), ringB = abs(r2 - 14.4) - 0.9;
    w = max(w, max(fillTo(petB), fillTo(ringB)));
    k = max(k, max(ln(petB, 0.13), max(ln(ringB, 0.1), ln(r2 - 2.2, 0.09))));
    float fb = fract(a2 * 6. / 6.2831853 + 0.5) - 0.5, fc = fract(a2 * 26. / 6.2831853) - 0.5;
    acc = max(acc, max(fillTo(length(vec2(fb * 6.2831853 / 6. * r2, r2 - 8.2)) - 0.9), fillTo(length(vec2(fc * 6.2831853 / 26. * r2, r2 - 14.4)) - 0.42)));
    float sow = step(42., r) * step(17., r2) * step(8.6, dw) * (1. - smoothstep(0.3, 0.8, pxm));
    float sw = (hs < 0.6 ? fillTo(tri3 - 0.27) : fillTo(ringm)) * sow;
    col = mix(col, uPaste, w);
    col = mix(col, uSow, sw * (1. - inside));
    col = mix(col, uAcc, acc * step(0.5, w));
    col = mix(col, uInk, min(k, 1.) * (1. - smoothstep(0.35, 0.9, pxm) * 0.6));
  } else if (part < 3.5) {
    // ---- roof: a woven split-bamboo mat
    vec2 q = vW.xy / 2.6; vec2 id = floor(q), f = fract(q) - 0.5;
    float par = mod(id.x + id.y, 2.), pxm = max(fwidth(q.x) + fwidth(q.y), 1e-4);
    vec2 g = par < 0.5 ? f : f.yx;
    float l1 = max(abs(abs(g.y) - 0.22) - 0.07, abs(g.x) - 0.42);
    col = mix(uMat, uInk, (1. - smoothstep(-pxm, pxm, l1)) * (1. - smoothstep(0.12, 0.4, pxm) * 0.75));
  } else if (part < 4.5) {
    // ---- rafters: bamboo with node rings
    float nd = abs(fract(vW.x / 7.) - 0.5) * 7.;
    col = mix(uMat, uGround, fillTo(nd - 0.5));
    col = mix(col, uInk, max(fillTo(nd - 0.22), smoothstep(0.72, 0.72 + max(fwidth(vW.y), 1e-4), abs(vW.y))));
  } else if (part < 5.5) col = uRim;
  else if (part < 6.5) {
    // ---- niche lining: dots on a dark ground
    vec2 g = vW.xy / 1.7; g.x += 0.5 * floor(g.y);
    float l = length(fract(g) - 0.5), aw = max(fwidth(l), 1e-4);
    col = mix(uLining, uLiningDot, (1. - smoothstep(0.17 - aw, 0.17 + aw, l)) * (1. - smoothstep(0.2, 0.5, aw)));
  } else if (part < 7.5) col = uSky;
  else if (part < 8.5) {
    // ---- door reveal: one broad stroke, black at both edges, hatched between in the line manner
    float e = min(vW.y, 1. - vW.y) * 2.;
    float arg = vW.x * uHatch * 0.55 + vW.y * 4.2 - uTime * 1.3, fw = max(fwidth(arg), 1e-3);
    float hatch = smoothstep(0.3 - fw, 0.3 + fw, sin(arg)) * (1. - smoothstep(0.7, 1.7, fw)) * uRevealK;
    float aw = max(fwidth(vW.y) * 2., 1e-4);
    col = mix(uReveal, uInk, max(1. - smoothstep(0.13 - aw, 0.13 + aw, e), hatch));
  } else {
    // ---- lamp recess: dots on a dark ground
    vec2 g = vW.xy / 0.9; g.x += 0.5 * floor(g.y);
    float l = length(fract(g) - 0.5), aw = max(fwidth(l), 1e-4);
    col = mix(uRecess, uRecessDot, (1. - smoothstep(0.2 - aw, 0.2 + aw, l)) * (1. - smoothstep(0.2, 0.5, aw)));
  }
  gl_FragColor = vec4(col, 1.);
  ${FOG_FM}
}`;

// ---------------------------------------------------------------- wall paint: ink drawn in (s, y), bent onto the plaster
// plain: static figures that sway by their wave weight. USE_INSTANCING: sown motifs. MOVER: figures that slide
// in the wall, aR = (s, height, phase, mode: 0 slider at a fixed height, 1 slider on the river, 2 hopper, 3.. lamp
// flames, 5 + hop: a figure that keeps its place, shuffling and beating its tail).
// SPIN: painted flowers that turn about (aR.x, aR.y); aR.z picks the angle (0 uSpin.x, 1 uSpin.y), aR.w is the
// phase of the breathing, the wave weight how far a vertex breathes outward.
// FAN: hinged pieces (peacock feathers, elephant trunks) pivoted at aF.xy, final angle aF.z, order aF.w;
// aG = (which of the pair, folded angle, folded length: the shaft below 13.5 m is drawn in to this share, so a
// folded tail is a train with its eyes stepping down it).
const WP_VERT = /* glsl */`
attribute vec4 aS; attribute vec3 aN;
uniform float uTime, uViewH, uFlow, uWaveP, uAside, uLamp; uniform vec3 uFan; uniform vec2 uSpin;
varying vec3 vCol; varying vec4 vS;
#if defined(MOVER) || defined(SPIN)
attribute vec4 aR;
#endif
#ifdef FAN
attribute vec4 aF; attribute vec3 aG;
#endif
${WALLMAP}
${FOG_V}
void main() {
  vec3 p = position; vCol = color; vS = aS; vec2 nr = aN.xy; float sc = 1., s, y;
#ifdef USE_INSTANCING_COLOR
  if (color.r < 0.) vCol = instanceColor;
#endif
#ifdef MOVER
  if (aR.w < 1.5) {
    // the rare wave: it leaves the wheel's wall and runs west down both side walls at once; each fish it reaches
    // leaps out of the river and turns over about its own middle
    float c = mod(aR.x + uFlow * (aR.w < 0.5 ? -0.45 : 1.), ${f4(SL)});
    float fwv = smoothstep(0., 0.2, uWaveP * 1.2 - min(c, ${f4(SL)} - c) / ${f4(SL * 0.5)});
    float face = 1. - 2. * fwv, leap = sin(3.14159265 * fwv) * step(0.5, aR.w);
    if (abs(face) < 0.05) face = 0.05;
    p.y += aN.z * sin(uTime * 3.4 + aR.z + p.x * 0.6);
    float tip = 0.9 * leap, ct = cos(tip), st = sin(tip);
    vec2 pf = vec2(face * p.x, p.y); nr.x *= sign(face);
    pf = vec2(pf.x * ct - pf.y * st, pf.x * st + pf.y * ct); nr = vec2(nr.x * ct - nr.y * st, nr.x * st + nr.y * ct);
    s = c + pf.x;
    float ry = riverY(s);
    y = aR.y + pf.y + ry - step(12., aR.y) * 0.5875 * (ry - 40.) + 4. * leap; p.z += 0.3 * leap;   // the snakes keep under the rakes
  } else if (aR.w < 2.5) {
    s = aR.x + p.x + 1.3 * sin(uTime * 0.55 + aR.z) + sign(aR.x - ${f4(S_NICHE)}) * uAside * 4.5;
    y = aR.y + p.y + 0.9 * abs(sin(uTime * 2.3 + aR.z)) + aN.z * sin(uTime * 3.4 + aR.z + p.x * 0.6);
  } else if (aR.w > 4.5) {
    s = aR.x + p.x + 0.8 * sin(uTime * 0.4 + aR.z);
    y = aR.y + p.y + aN.z * sin(uTime * 3. + aR.z + p.x * 0.5) + (aR.w - 5.) * pow(abs(sin(uTime * 0.9 + aR.z)), 6.);
  } else {
    float lit = smoothstep(0., 1., uLamp - (aR.w - 3.) * 16.);
    s = aR.x + p.x * lit + aN.z * sin(uTime * 5.3 + aR.z + p.y * 1.3) * lit;
    y = aR.y + p.y * lit;
  }
#elif defined(SPIN)
  float sang = aR.z < 0.5 ? uSpin.x : uSpin.y, sca = cos(sang), ssa = sin(sang);
  vec2 q = p.xy * (1. + aN.z * sin(uTime * 0.9 + aR.w));
  q = vec2(q.x * sca - q.y * ssa, q.x * ssa + q.y * sca); nr = vec2(nr.x * sca - nr.y * ssa, nr.x * ssa + nr.y * sca);
  s = aR.x + q.x; y = aR.y + q.y;
#elif defined(FAN)
  float o = smoothstep(aF.w * 0.72, aF.w * 0.72 + 0.28, aG.x < 0.5 ? uFan.x : aG.x < 1.5 ? uFan.y : uFan.z);
  float ang = mix(aG.y, aF.z, o) + 0.025 * sin(uTime * 1.6 + aF.w * 23.) * o + aN.z * sin(uTime * 1.3 + aG.x * 2.);
  float ca = cos(ang), sa = sin(ang), kk = mix(aG.z, 1., o);
  p.y = p.y < 13.5 ? p.y * kk : 13.5 * kk + (p.y - 13.5);
  vec2 q = vec2(p.x * ca - p.y * sa, p.x * sa + p.y * ca);
  nr = vec2(nr.x * ca - nr.y * sa, nr.x * sa + nr.y * ca);
  s = aF.x + q.x; y = aF.y + q.y; p.z += aF.w * 0.06;
#else
  float ph = p.x * 0.21;
  #ifdef USE_INSTANCING
  ph = instanceMatrix[3].x * 0.37 + instanceMatrix[3].y * 0.53;
  #endif
  p.x += aN.z * sin(uTime * 1.7 + ph + p.y * 0.7);
  vec2 q = p.xy;
  #ifdef USE_INSTANCING
  q = (instanceMatrix * vec4(p, 1.)).xy;
  sc = length(instanceMatrix[0].xyz);
  nr = (mat3(instanceMatrix) * vec3(nr, 0.)).xy / max(sc, 1e-4);
  #endif
  s = q.x; y = q.y;
#endif
  vec3 wpos = wallPos(s, y, p.z);
  vec2 pp, nn; wallAt(s, pp, nn);
  vec3 nw = vec3(nn.y * nr.x, nr.y, -nn.x * nr.x);
  float px = 2. * length(cameraPosition - wpos) / (projectionMatrix[1][1] * uViewH);
  float add = step(0.5, aS.z) * clamp(0.8 * px - aS.w * sc, 0., aS.w * sc * 2.2 + 0.02);
  wpos += nw * add;
  vec4 mvPosition = viewMatrix * vec4(wpos, 1.);
  gl_Position = projectionMatrix * mvPosition;
  ${FOG_VM}
}`;

// ---------------------------------------------------------------- relief: real things in flat colour
// aK = (u, v, pattern, parameter)  aV = (pivot x, pivot z, turn amplitude, phase)  color = pigment A, aC2 = pigment B
// patterns: 0 flat  1 bamboo (v metres, node spacing)  2 fish scales (u, v metres)  3 triangle band (u metres, v 0..1)
//           4 weave (u, v metres)  5 coils (v metres, spacing)
const RELIEF_VERT = /* glsl */`
attribute vec4 aK; attribute vec4 aV; attribute vec3 aC2;
uniform float uTime, uViewH;
varying vec3 vCol; varying vec3 vC2; varying vec4 vK;
${FOG_V}
void main() {
  vCol = color; vC2 = aC2; vK = aK;
  vec3 p = position, n = normal;
  float a = aV.z * sin(uTime * 0.45 + aV.w), ca = cos(a), sa = sin(a);
  vec2 d = p.xz - aV.xy; p.xz = aV.xy + vec2(d.x * ca - d.y * sa, d.x * sa + d.y * ca);
  n.xz = vec2(n.x * ca - n.z * sa, n.x * sa + n.z * ca);
  vec4 wp = modelMatrix * vec4(p, 1.);
#ifdef HULL
  float px = 2. * length(cameraPosition - wp.xyz) / (projectionMatrix[1][1] * uViewH);
  vec3 nw = mat3(modelMatrix) * n;
  wp.xyz += nw / max(length(nw), 1e-4) * clamp(1.5 * px, 0.16, 1.4);
#endif
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  ${FOG_VM}
}`;
const RELIEF_FRAG = /* glsl */`
uniform vec3 uInk, uGround;
varying vec3 vCol; varying vec3 vC2; varying vec4 vK;
${FOG_F}
float ln(float d, float w) { float aw = max(fwidth(d), 1e-4); w = max(w, 0.75 * aw); return 1. - smoothstep(w - aw, w + aw, abs(d)); }
float fillTo(float d) { float aw = max(fwidth(d), 1e-4); return 1. - smoothstep(-aw, aw, d); }
void main() {
#ifdef HULL
  vec3 col = uInk;
#else
  vec3 col = vCol; float u = vK.x, v = vK.y, pat = vK.z, P = max(vK.w, 1e-3), k = 0.;
  if (pat > 4.5) {
    float nd = (fract(v / P) - 0.5) * P;
    k = ln(nd, 0.07);
  } else if (pat > 3.5) {
    vec2 q = vec2(u, v) / P; vec2 id = floor(q), f = fract(q) - 0.5;
    vec2 g = mod(id.x + id.y, 2.) < 0.5 ? f : f.yx;
    float pxm = max(fwidth(q.x) + fwidth(q.y), 1e-4);
    k = (1. - smoothstep(-pxm, pxm, max(abs(abs(g.y) - 0.22) - 0.08, abs(g.x) - 0.44))) * (1. - smoothstep(0.15, 0.5, pxm) * 0.7);
  } else if (pat > 2.5) {
    float tri = 1. - abs(2. * fract(u / P) - 1.);
    col = v < tri ? vCol : vC2;
    k = max(ln((v - tri) * P * 0.5, 0.08), max(ln(v * P * 0.5, 0.09), ln((1. - v) * P * 0.5, 0.09)));
  } else if (pat > 1.5) {
    float row = floor(v / P), gy = fract(v / P);
    float band = mod(row, 4.);
    if (band > 2.5) {
      float tri = 1. - abs(2. * fract(u / P) - 1.);
      col = gy < tri ? vC2 : uGround;
      k = ln((gy - tri) * P * 0.5, 0.07);
    } else {
      float x = u / P + 0.5 * mod(row, 2.);
      vec2 f = vec2(fract(x) - 0.5, gy - 1.);
      float r = length(f) * P;
      vec2 f0 = vec2(fract(x + 0.5) - 0.5, gy);
      float r0 = length(f0) * P;
      float inS = step(r, 0.5 * P);
      col = mix(vCol, vC2, fillTo(r - 0.27 * P));
      col = mix(col, uGround, fillTo(r - 0.11 * P));
      k = max(ln(r - 0.5 * P, 0.07), ln(r - 0.27 * P, 0.05));
      k = max(k, ln(r0 - 0.5 * P, 0.07) * (1. - inS));
    }
    k = max(k, ln(gy * P, 0.09));
  } else if (pat > 0.5) {
    float nd = (fract(v / P) - 0.5) * P, an = abs(nd);
    col = mix(col, uGround, fillTo(an - 0.42));
    k = max(fillTo(an - 0.18), max(ln(an - 0.42, 0.045), smoothstep(0.8, 0.8 + max(fwidth(u), 1e-4), abs(u))));
    k = max(k, ln(abs(u) - 0.42, 0.03) * step(0.9, an) * step(fract(v * 0.4), 0.6));
  }
  col = mix(col, uInk, clamp(k, 0., 1.));
#endif
  gl_FragColor = vec4(col, 1.);
  ${FOG_FM}
}`;

// ---------------------------------------------------------------- bits: garland flowers, loose petals
// BITS  aI = garland (t along, swag, kind 0 flower 2 leaf, phase) | petal (x, z, size, phase); aJ.x = mode 0 | 1
const BITS_VERT = /* glsl */`
attribute vec4 aI; attribute vec4 aJ; attribute vec3 aCol; attribute vec3 aCol2;
uniform float uTime, uGust, uViewH; uniform vec3 uInk;
varying vec3 vCol;
${FOG_V}
void main() {
  vec3 p = position; vCol = color;
  if (color.r < -1.5) vCol = aCol2; else if (color.r < 0.) vCol = aCol;
  vec3 w;
  if (aJ.x < 0.5) {
    float t = aI.x, sag = mix(4.5, 9.5, aI.y) * 4. * t * (1. - t);
    float th = (0.2 + 0.12 * uGust) * sin(uTime * 1.15 + aI.y * 1.4) + 0.05 * sin(uTime * 2.6 + t * 9.);
    float rot = aI.w + 0.35 * sin(uTime * 1.9 + aI.w * 3.);
    float cr = cos(rot), sr = sin(rot);
    p.xy *= 0.78;
    if (aI.z > 1.5) { p.xy = vec2(p.x * 0.5, p.y * 1.6 - 1.45); cr = cos(0.25 * sin(uTime * 2.2 + aI.w)); sr = sin(0.25 * sin(uTime * 2.2 + aI.w)); }
    p.xy = vec2(p.x * cr - p.y * sr, p.x * sr + p.y * cr);
    w = vec3(48.4 + 15.2 * t + p.x, 32.4 - sag * cos(th) + p.y, 43.4 - sag * sin(th) - 0.3 * aI.y - p.z);
  } else {
    float t = uTime * 0.33 + aI.w, hop = floor(t) + smoothstep(0., 0.4, fract(t));
    float wr = fract(hop * 0.09 + aI.w * 0.37);
    float sz = aI.z * smoothstep(0., 0.06, wr) * (1. - smoothstep(0.94, 1., wr));
    float rot = aI.w * 5. + hop * 1.7, cr = cos(rot), sr = sin(rot);
    // a loose petal: a pointed teardrop with a black vein down its middle
    vec2 q0 = p.xy; float ql = length(q0);
    if (color.r < -1.5) { vCol = uInk; q0 = vec2(q0.x * 0.13, q0.y * 2.3 + 0.1); }
    else {
      if (ql > 0.01) q0 *= (color.r < -0.5 ? 1. : 1.16) / ql;
      q0 = vec2(q0.x * mix(0.95, 0.2, smoothstep(-0.35, 0.95, q0.y)) + sign(q0.x) * step(0., color.r) * 0.05, q0.y * (q0.y > 0. ? 1.55 : 1.));
    }
    vec2 q = vec2(q0.x, q0.y * 0.8) * sz; q = vec2(q.x * cr - q.y * sr, q.x * sr + q.y * cr);
    vec2 dir = normalize(vec2(-0.62, -0.78) + 0.35 * vec2(sin(aI.w * 7.), cos(aI.w * 5.)));
    vec2 g = aI.xy + dir * (wr - 0.5) * 34.;
    float lift = sin(3.14159265 * smoothstep(0., 0.4, fract(t)));
    w = vec3(g.x + q.x, 0.08 + p.z * 0.2 + lift * (0.5 + 0.5 * abs(q.x)), g.y + q.y);
  }
  vec4 mvPosition = viewMatrix * vec4(w, 1.);
  gl_Position = projectionMatrix * mvPosition;
  ${FOG_VM}
}`;
const BITS_FRAG = /* glsl */`
varying vec3 vCol;
${FOG_F}
void main() { gl_FragColor = vec4(vCol, 1.); ${FOG_FM} }`;

// ---------------------------------------------------------------- small geometry collectors
function shellCollector() {
  const P = [], A = [], I = [];
  const c = {
    v(x, y, z, a, b, part) { P.push(x, y, z); A.push(a, b, part); return P.length / 3 - 1; },
    quad(a, b, c2, d) { I.push(a, b, c2, a, c2, d); },
    tri(a, b, c2) { I.push(a, b, c2); },
    build() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
      g.setAttribute('aW', new THREE.Float32BufferAttribute(A, 3));
      g.setIndex(I); return g;
    },
  };
  return c;
}
// relief collector: lathes, tubes and slabs with pattern coordinates
function reliefCollector() {
  const P = [], N = [], C = [], C2 = [], K = [], V = [], I = [];
  let piv = [0, 0, 0, 0], M = null;
  const tp = new THREE.Vector3(), tn = new THREE.Vector3();
  const r = {
    pivot(x, z, amp, ph) { piv = [x, z, amp, ph]; return r; },
    mx(m) { M = m; return r; },
    v(p, n, ca, cb, u, v, pat, par) {
      if (M) { tp.set(p[0], p[1], p[2]).applyMatrix4(M); tn.set(n[0], n[1], n[2]).transformDirection(M); p = [tp.x, tp.y, tp.z]; n = [tn.x, tn.y, tn.z]; }
      P.push(p[0], p[1], p[2]); N.push(n[0], n[1], n[2]); C.push(ca.r, ca.g, ca.b); C2.push(cb.r, cb.g, cb.b);
      K.push(u, v, pat, par); V.push(piv[0], piv[1], piv[2], piv[3]); return P.length / 3 - 1;
    },
    quad(a, b, c2, d) { I.push(a, b, c2, a, c2, d); },
    // a lathe about a vertical axis at (cx, cz): prof = [[radius, y, band]], bands = { band: [ca, cb, pattern, param] }
    lathe(cx, cz, prof, bands, seg = 40, squash = 1) {
      for (let i = 0; i < prof.length - 1; i++) {
        const a = prof[i], b = prof[i + 1], bd = bands[a[2]] || bands[0];
        let ny = -(b[0] - a[0]), nr = b[1] - a[1]; const l = Math.hypot(ny, nr) || 1; ny /= l; nr /= l;   // outward normal (nr radial, ny up)
        const base = P.length / 3;
        for (let j = 0; j <= seg; j++) {
          const t = (j / seg) * TAU, ct = Math.cos(t), st = Math.sin(t) * squash;
          for (const q of [a, b]) {
            const uu = bd[2] === 3 ? t * Math.max(a[0], b[0]) : bd[2] === 1 ? 0 : t * (a[0] + b[0]) * 0.5;
            const vv = bd[2] === 3 ? (q === a ? 0 : 1) : q[1];
            r.v([cx + ct * q[0], q[1], cz + st * q[0]], [ct * nr, ny, st * nr], bd[0], bd[1], uu, vv, bd[2], bd[3]);
          }
        }
        for (let j = 0; j < seg; j++) { const o = base + j * 2; I.push(o, o + 1, o + 2, o + 1, o + 3, o + 2); }
      }
      return r;
    },
    // a tube along points: rad(t), half = only the part facing `front` (a unit vector); pattern coordinates (around -1..1, metres along)
    tube(pts, rad, ca, cb, pat, par, seg = 8, front = null) {
      const n = pts.length, base = P.length / 3, T = new THREE.Vector3(), A = new THREE.Vector3(), B = new THREE.Vector3(), up = new THREE.Vector3();
      let along = 0;
      for (let i = 0; i < n; i++) {
        const p = pts[i], q0 = pts[Math.max(0, i - 1)], q1 = pts[Math.min(n - 1, i + 1)];
        T.set(q1[0] - q0[0], q1[1] - q0[1], q1[2] - q0[2]).normalize();
        if (front) up.set(front[0], front[1], front[2]); else up.set(0, 1, 0);
        if (Math.abs(T.dot(up)) > 0.95) up.set(1, 0, 0);
        A.crossVectors(T, up).normalize(); B.crossVectors(A, T).normalize();          // B points toward `front`
        if (i > 0) along += Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1], p[2] - pts[i - 1][2]);
        const rr = typeof rad === 'function' ? rad(i / (n - 1)) : rad;
        for (let j = 0; j <= seg; j++) {
          const ph = front ? -1.75 + 3.5 * (j / seg) : (j / seg) * TAU, cs = Math.cos(ph), sn = Math.sin(ph);
          const nx = A.x * sn + B.x * cs, ny = A.y * sn + B.y * cs, nz = A.z * sn + B.z * cs;
          r.v([p[0] + nx * rr, p[1] + ny * rr, p[2] + nz * rr], [nx, ny, nz], ca, cb, front ? ph / 1.75 : Math.sin(ph), along, pat, par);
        }
      }
      for (let i = 0; i < n - 1; i++) for (let j = 0; j < seg; j++) { const o = base + i * (seg + 1) + j, q = o + seg + 1; I.push(o, o + 1, q, o + 1, q + 1, q); }
      return r;
    },
    count() { return I.length / 3; },
    build() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
      g.setAttribute('aC2', new THREE.Float32BufferAttribute(C2, 3));
      g.setAttribute('aK', new THREE.Float32BufferAttribute(K, 4));
      g.setAttribute('aV', new THREE.Float32BufferAttribute(V, 4));
      g.setIndex(I); return g;
    },
  };
  return r;
}

// ================================================================ the world
export default {
  id: 'kohbar-lotus-room',
  name: 'The Lotus Room',
  category: 'interior',
  weirdness: 0.4,
  media: ['interior', 'tiny'],
  async build(ctx) {
    await ctx.yield();   // the build starts on a fresh step
    const rng = ctx.rng, detail = ctx.quality?.detail ?? 1, dens = ctx.vary?.density ?? 1, rare = !!ctx.vary?.rare;
    const hour = ctx.vary?.hour, roll = rng();
    const look = hour === 'dawn' ? 'line' : hour === 'night' ? 'dusk' : hour === 'golden' || hour === 'day' ? 'sun'
      : roll < 0.52 ? 'sun' : roll < 0.7 ? 'line' : 'dusk';
    const pal = PALETTE.map((h) => new THREE.Color(h));
    const remap = look === 'line' ? [0, 1, 0, 0, 0, 0, 0] : look === 'dusk' ? [0, 1, 6, 6, 4, 4, 6] : [0, 1, 2, 3, 4, 5, 6];
    const f = (i) => pal[remap[i]];
    const W = pal[0], K = pal[1], ACC = look === 'dusk' ? pal[6] : pal[3];
    const castDraw = rng(), elephants = castDraw >= 0.3 && castDraw < 0.44, leafGarland = look === 'line' || rng.chance(0.3);
    const scene = new THREE.Scene();
    scene.background = W.clone();
    const size = new THREE.Vector2();

    // ---- the flight
    const pts = [[-92, 6, 14], [-72, 6, 14], [-52, 6, 14], [-32, 6, 14.4], [-14, 10.5, 17], [4, 17.5, 21.5], [20, 23.5, 24.4]];
    for (let k = 0; k <= 18; k++) {
      const ph = k * Math.PI / 6;
      pts.push([38 + 27 * Math.sin(ph), 26 + 18 * smoothstep(0.75 * Math.PI, 2.0 * Math.PI, ph), -1 + 27 * Math.cos(ph)]);
    }
    pts.push([18, 43.3, -28], [-2, 41.2, -28], [-22, 37.8, -28], [-40, 34.8, -28], [-58, 34, -28], [-78, 34, -28], [-98, 34, -28], [-116.5, 34, -28]);
    const path = makePath(pts);
    await ctx.yield();

    // ---- the hero: the east gable and its wheel
    const hero = await buildHero(ctx, { palette: PALETTE, look, demo: false });
    hero.object.position.set(80, 0, 6); hero.object.rotation.y = -Math.PI / 2;
    scene.add(hero.object);
    hero.object.updateMatrixWorld(true);
    await ctx.yield();
    const HU = hero.uniforms;
    const wb = [rng.range(0, TAU), rng.range(0, TAU), rng.range(0, TAU), rng.range(0, TAU)];
    const wall = makeWall(wb);
    const U = {
      uTime: HU.uTime, uViewH: HU.uViewH, uHatch: HU.uHatch, uGround: HU.uGround, uInk: HU.uInk,
      uWB: { value: new THREE.Vector4(wb[0], wb[1], wb[2], wb[3]) },
      uFlow: { value: 0 }, uWaveP: { value: 0 }, uAside: { value: 0 }, uFan: { value: new THREE.Vector3(0, 0, 0) }, uGust: { value: 0 },
      uFlr: { value: new THREE.Vector3(0, 0.4, 0) }, uSpin: { value: new THREE.Vector2(0, 0) },
      uLamp: { value: 9 }, uPatchZ: { value: 38 }, uPatchOn: { value: look === 'sun' ? 1 : 0 },
    };
    const fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
    const mat = (vs, fs, extra, defines) => new THREE.ShaderMaterial({ vertexShader: vs, fragmentShader: fs, fog: true, side: THREE.DoubleSide, defines: defines || {}, uniforms: { ...fogU(), ...extra } });
    const add = (geo, m, order = 0, parent = scene) => { const me = new THREE.Mesh(geo, m); me.frustumCulled = false; me.renderOrder = order; parent.add(me); return me; };

    // sun disc at x 20, moon at x -14, high on the north wall
    const discs = new THREE.Vector4(sNorth(22), 49.6, sNorth(-12), 49.6);
    const shellMat = mat(SHELL_VERT, SHELL_FRAG, {
      uTime: U.uTime, uHatch: U.uHatch, uGround: U.uGround, uInk: U.uInk, uPatchZ: U.uPatchZ, uPatchOn: U.uPatchOn,
      uAcc: { value: ACC }, uB: { value: f(4) }, uSun: { value: pal[2] }, uFloor: { value: look === 'line' ? W : pal[3] }, uPaste: { value: W }, uSow: { value: look === 'line' ? ACC : W },
      uMat: { value: f(2) }, uSky: { value: look === 'sun' ? pal[2] : look === 'line' ? W : pal[4] },
      uRim: { value: look === 'line' ? K : f(3) }, uWater: { value: look === 'line' ? K : pal[4] },
      uDiscS: { value: f(2) }, uRayS: { value: look === 'dusk' ? pal[4] : f(3) },
      uDiscM: { value: look === 'dusk' ? pal[2] : W }, uRayM: { value: f(4) },
      uLining: { value: look === 'line' ? W : pal[4] }, uLiningDot: { value: look === 'line' ? ACC : W }, uFlr: U.uFlr, uDiscs: { value: discs },
      uReveal: { value: look === 'line' ? W : f(3) }, uRevealK: { value: look === 'line' ? 0.92 : 0 },
      uRecess: { value: look === 'line' ? W : pal[4] }, uRecessDot: { value: look === 'line' ? ACC : W },
    });

    const lampS = [118, 139, 160, 174.5, sNorth(-88), sNorth(-57), sNorth(-24), sNorth(-6.5), sNorth(64)], LAMP_Y = 22;
    await ctx.yield();
    // ---- the shell
    {
      const c = shellCollector();
      // floor (runs under the door to the outer face of the wall)
      const fl = [c.v(-112, 0, -47, 0, 0, 2), c.v(82, 0, -47, 0, 0, 2), c.v(82, 0, 45, 0, 0, 2), c.v(-112, 0, 45, 0, 0, 2)];
      c.quad(fl[0], fl[3], fl[2], fl[1]);
      const th = [c.v(48, 0, 45, 0, 0, 2), c.v(64, 0, 45, 0, 0, 2), c.v(64, 0, 46.6, 0, 0, 2), c.v(48, 0, 46.6, 0, 0, 2)];
      c.quad(th[0], th[3], th[2], th[1]);
      // walls: columns in s, rows in y, with holes for the door and the niche
      const ss = [];
      for (let s = 0; s < SL; s += 3.05) ss.push(s);
      const special = [SL, 16, 32, S_NICHE - 8, S_NICHE + 8];
      for (const ls of lampS) special.push(ls - 2, ls + 2);
      ss.push(...special);
      ss.sort((a, b) => a - b);
      const cols = ss.filter((s, i) => i === 0 || special.includes(s) || (s - ss[i - 1] > 0.4 && !special.some((q) => Math.abs(q - s) < 0.4)));
      const ys = [3.1]; for (let y = 6; y <= 57; y += 3) ys.push(y);
      ys.push(26, 34, 44, LAMP_Y - 2.7, LAMP_Y + 2.9); ys.sort((a, b) => a - b);
      const inLamp = (s, y) => y > LAMP_Y - 2.7 && y < LAMP_Y + 2.9 && lampS.some((ls) => Math.abs(s - ls) < 2);
      const NF = ys.length, NT = 6, NR = NF + NT, v3 = new THREE.Vector3();
      const yAt = (s, j) => (j < NF ? ys[j] : 57 + (wall.top(s) - 57) * ((j - NF + 1) / NT));
      const idx = [];
      for (let i = 0; i < cols.length; i++) {
        const s = cols[i];
        for (let j = 0; j < NR; j++) { const y = yAt(s, j); wall.pos(s, y, 0, v3); idx.push(c.v(v3.x, v3.y, v3.z, s, y, 0)); }
        if ((i & 31) === 31) await ctx.yield();   // a long loop: yield every 32 columns
      }
      for (let i = 0; i < cols.length - 1; i++) {
        const sm = (cols[i] + cols[i + 1]) / 2;
        for (let j = 0; j < NR - 1; j++) {
          const ym = (yAt(sm, j) + yAt(sm, j + 1)) / 2;
          if (Math.abs(sm - S_DOOR) < 8 && ym < 34) continue;
          if (Math.abs(sm - S_NICHE) < 8 && ym > 26 && ym < 44) continue;
          if (inLamp(sm, ym)) continue;
          const a = i * NR + j, b = a + NR;
          c.quad(idx[a], idx[b], idx[b + 1], idx[a + 1]);
        }
      }
      await ctx.yield();
      // spandrels over the niche arch, the niche lining, its back and sill
      const NA = 20, zc = -28, prof = [];
      for (let i = 0; i <= NA; i++) { const a = Math.PI * (i / NA); prof.push([8 * Math.cos(a), 36 + 8 * Math.sin(a)]); }   // dz, y over the arch
      for (let i = 0; i < NA; i++) {
        const p0 = prof[i], p1 = prof[i + 1];
        const s0 = S_NICHE - p0[0], s1 = S_NICHE - p1[0];
        const a = c.v(-110, p0[1], zc + p0[0], s0, p0[1], 0), b = c.v(-110, p1[1], zc + p1[0], s1, p1[1], 0);
        const d = c.v(-110, 44, zc + p0[0], s0, 44, 0), e = c.v(-110, 44, zc + p1[0], s1, 44, 0);
        c.quad(a, b, e, d);
      }
      const ring = [[8, 26], ...prof, [-8, 26]]; let al = 0;
      const back = c.v(-119.5, 34, zc, 0, 34, 6);
      for (let i = 0; i < ring.length - 1; i++) {
        const p0 = ring[i], p1 = ring[i + 1], l = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
        const a = c.v(-109.6, p0[1], zc + p0[0], al, 0, 6), b = c.v(-109.6, p1[1], zc + p1[0], al + l, 0, 6);
        const d = c.v(-119.5, p0[1], zc + p0[0], al, 9.9, 6), e = c.v(-119.5, p1[1], zc + p1[0], al + l, 9.9, 6);
        c.quad(a, b, e, d); al += l;
        const g = c.v(-119.5, p0[1], zc + p0[0], p0[0], p0[1], 6), h = c.v(-119.5, p1[1], zc + p1[0], p1[0], p1[1], 6);
        c.tri(back, g, h);
      }
      // the sill: a solid slab, or in the line look a hatched band like the door's reveal
      { const sp = look === 'line' ? 8 : 5;
        const a = c.v(-108.4, 26, zc + 8.6, 0, 0, sp), b = c.v(-108.4, 26, zc - 8.6, 17.2, 0, sp), d = c.v(-119.5, 26, zc - 8.6, 17.2, 1, sp), e = c.v(-119.5, 26, zc + 8.6, 0, 1, sp);
        c.quad(a, b, d, e);
        const a1 = c.v(-108.4, 26, zc + 8.6, 0, 0, sp), b1 = c.v(-108.4, 26, zc - 8.6, 17.2, 0, sp), a2 = c.v(-108.4, 25.1, zc + 8.6, 0, 1, sp), b2 = c.v(-108.4, 25.1, zc - 8.6, 17.2, 1, sp); c.quad(a1, a2, b2, b1); }
      // plinth
      const pp = [[1.3, 0], [1.3, 2.3], [1.2, 2.72], [0.9, 3.0], [0.35, 3.1], [0, 3.1]];
      let prev = null;
      for (let i = 0; i < cols.length; i++) {
        const s = cols[i], inDoor = s > 16.01 && s < 31.99, row = [];
        if (inDoor) { prev = null; continue; }
        for (const q of pp) { wall.pos(s, 3.1, q[0], v3); row.push(c.v(v3.x, q[1], v3.z, s, q[1], 1)); }
        if (prev && !(cols[i - 1] >= 16 && s <= 32 && s > 16)) for (let j = 0; j < pp.length - 1; j++) c.quad(prev[j], row[j], row[j + 1], prev[j + 1]);
        prev = row;
      }
      // door reveal (jambs and lintel stand 1.5 m into the room and cap the plinth) and the courtyard beyond
      // the reveal carries (metres along, 0..1 across) so its faces can be drawn as one hatched stroke
      const reveal = (x0, x1, y0, y1, z0, z1, long) => {
        const lo = [x0, y0, z0], hi = [x1, y1, z1];
        for (let ax = 0; ax < 3; ax++) for (const sd of [0, 1]) {
          const u = (ax + 1) % 3, w = (ax + 2) % 3, id = [];
          for (const [a, b] of [[0, 0], [1, 0], [1, 1], [0, 1]]) {
            const q = [0, 0, 0]; q[ax] = sd ? hi[ax] : lo[ax]; q[u] = a ? hi[u] : lo[u]; q[w] = b ? hi[w] : lo[w];
            const al = ax === long ? q[u] : q[long], ac = ax === long || u === long ? b : a;
            id.push(c.v(q[0], q[1], q[2], al, ac, 8));
          }
          c.quad(id[0], id[1], id[2], id[3]);
        }
      };
      reveal(46.6, 48, 0, 35.4, 43.5, 46.6, 1); reveal(64, 65.4, 0, 35.4, 43.5, 46.6, 1); reveal(46.6, 65.4, 34, 35.4, 43.5, 46.6, 0);
      // the courtyard: one flat field of the sky pigment closed round the door, so every sight line through it ends on it
      {
        const X0 = -320, X1 = 520, Y0 = -0.02, Y1 = 320, Z0 = 46.6, Z1 = 420, q = (a, b, c2, d) => c.quad(c.v(...a, 0, 0, 7), c.v(...b, 0, 0, 7), c.v(...c2, 0, 0, 7), c.v(...d, 0, 0, 7));
        q([X0, Y0, Z0], [X1, Y0, Z0], [X1, Y0, Z1], [X0, Y0, Z1]); q([X0, Y1, Z0], [X1, Y1, Z0], [X1, Y1, Z1], [X0, Y1, Z1]);
        q([X0, Y0, Z1], [X1, Y0, Z1], [X1, Y1, Z1], [X0, Y1, Z1]);
        q([X0, Y0, Z0], [X0, Y0, Z1], [X0, Y1, Z1], [X0, Y1, Z0]); q([X1, Y0, Z0], [X1, Y0, Z1], [X1, Y1, Z1], [X1, Y1, Z0]);
      }
      // lamp recesses: let 1.8 m into the wall behind each painted arch, lined with dots
      for (const ls of lampS) {
        const D = -1.8, ya = LAMP_Y - 2.7, yb = LAMP_Y + 2.9, cn = [[ls - 2, ya], [ls + 2, ya], [ls + 2, yb], [ls - 2, yb]];
        const fr = cn.map(([s, y]) => wall.pos(s, y, 0.0, new THREE.Vector3())), bk = cn.map(([s, y]) => wall.pos(s, y, D, new THREE.Vector3()));
        for (let k = 0; k < 4; k++) {
          const k2 = (k + 1) % 4, len = k & 1 ? 5.6 : 4;
          c.quad(c.v(fr[k].x, fr[k].y, fr[k].z, 0, 0, 9), c.v(fr[k2].x, fr[k2].y, fr[k2].z, len, 0, 9), c.v(bk[k2].x, bk[k2].y, bk[k2].z, len, 1.8, 9), c.v(bk[k].x, bk[k].y, bk[k].z, 0, 1.8, 9));
        }
        c.quad(c.v(bk[0].x, bk[0].y, bk[0].z, 0, 0, 9), c.v(bk[1].x, bk[1].y, bk[1].z, 4, 0, 9), c.v(bk[2].x, bk[2].y, bk[2].z, 4, 5.6, 9), c.v(bk[3].x, bk[3].y, bk[3].z, 0, 5.6, 9));
      }
      // roof mat and rafters
      for (const sd of [-1, 1]) {
        const a = c.v(-113, 96, 0, -113, 0, 3), b = c.v(83, 96, 0, 83, 0, 3), d = c.v(83, 56.8, sd * 49, 83, 62.8, 3), e = c.v(-113, 56.8, sd * 49, -113, 62.8, 3);
        c.quad(a, b, d, e);
        for (let x = -104; x <= 78; x += 9.1) {
          const NS = 5, rows = [];
          for (const t of [0, 1]) {
            const cy = 95.2 - 38.4 * t, cz = sd * 48 * t, row = [];
            for (let j = 0; j <= NS; j++) { const ph = -Math.PI / 2 + Math.PI * (j / NS); row.push(c.v(x + Math.sin(ph) * 0.62, cy - Math.cos(ph) * 0.62, cz, t * 61.5, Math.sin(ph), 4)); }
            rows.push(row);
          }
          for (let j = 0; j < NS; j++) c.quad(rows[0][j], rows[1][j], rows[1][j + 1], rows[0][j + 1]);
        }
      }
      { const NS = 6, rows = [];
        for (const x of [-113, 83]) { const row = []; for (let j = 0; j <= NS; j++) { const ph = -Math.PI / 2 + Math.PI * (j / NS); row.push(c.v(x, 94.6 - Math.cos(ph) * 0.9, Math.sin(ph) * 0.9, x + 3, Math.sin(ph), 4)); } rows.push(row); }
        for (let j = 0; j < NS; j++) c.quad(rows[0][j], rows[1][j], rows[1][j + 1], rows[0][j + 1]); }
      add(c.build(), shellMat);
    }
    await ctx.yield();

    // ---- wall paint
    const wpU = { uTime: U.uTime, uViewH: U.uViewH, uFlow: U.uFlow, uWaveP: U.uWaveP, uAside: U.uAside, uLamp: U.uLamp, uFan: U.uFan, uSpin: U.uSpin, uWB: U.uWB, uGround: U.uGround, uHatch: U.uHatch };
    const wpMat = mat(WP_VERT, PAINT_FRAG, wpU); wpMat.vertexColors = true;
    const moverMat = mat(WP_VERT, PAINT_FRAG, wpU, { MOVER: 1 }); moverMat.vertexColors = true;
    const fanMat = mat(WP_VERT, PAINT_FRAG, wpU, { FAN: 1 }); fanMat.vertexColors = true;
    const ell = (cx, cy, rx, ry, n = 14, rot = 0) => { const o = [], cr = Math.cos(rot), sr = Math.sin(rot); for (let i = 0; i < n; i++) { const a = (i / n) * TAU, x = Math.cos(a) * rx, y = Math.sin(a) * ry; o.push([cx + x * cr - y * sr, cy + x * sr + y * cr]); } return o; };
    const PEA = [[90, -1], [51, -1]];                    // tail pivots (s) and facing
    const WEL = S2 + 1, keepOut = [[S2 - 7.5, S2 + 17, 8, 37], [S3 + 6, S4 + 4, 4, 37]];   // the west elephant; where no small motif is sown
    {
      const ink = makeInk();
      // creeper of heart leaves along the plinth
      const creeper = (a, b) => {
        const pts = []; for (let s = a; s <= b; s += 1.2) pts.push([s, 5.7 + 0.75 * Math.sin(s * 0.52)]);
        ink.xf(null).wave(0).z(0.05).stroke(pts, 0.17, K);
        for (let s = a + 1.5; s < b - 1; s += 3.02) {
          const y0 = 5.7 + 0.75 * Math.sin(s * 0.52), up = Math.cos(s * 0.52) > 0 ? -1 : 1;
          const h = inkLoop([[0, 0], [0.7, 0.35], [0.8, 1.1], [0.32, 1.3], [0, 1.0], [-0.32, 1.3], [-0.8, 1.1], [-0.7, 0.35]], 2).map((p) => [s + p[0], y0 + up * (0.2 + 1.45 - p[1])]);
          ink.wave((x, y) => 0.13 * clamp(Math.abs(y - y0) / 1.6, 0, 1)).z(0.06).shape(h, f(5), K, 0.09);
          ink.z(0.07).stroke([[s, y0 + up * 0.5], [s, y0 + up * 1.3]], 0.06, K);
        }
      };
      creeper(3, 14.2); creeper(34, SL - 3);
      // lotus buds and pads on the river banks
      ink.xf(null);
      for (let s = 8, k = 0; s < SL - 6; s += 11.3, k++) {
        const yr = wall.riverY(s);
        if (k & 1 || yr > 46) {
          ink.wave(0).z(0.06).shape(inkArc(s, yr - 2.95, 1.6, 0, Math.PI, 8), f(5), K, 0.1);
          for (let j = 1; j < 4; j++) { const a = j * Math.PI / 4; ink.z(0.075).stroke([[s, yr - 2.95], [s + Math.cos(a) * 1.3, yr - 2.95 + Math.sin(a) * 1.3]], 0.06, K); }
        } else {
          ink.wave((x, y) => 0.12 * clamp((y - yr - 3.5) / 3, 0, 1)).z(0.06).stroke([[s, yr + 3.5], [s + 0.25, yr + 4.6], [s + 0.1, yr + 5.5]], 0.11, K);
          const bud = inkLoop([[0, 0], [0.62, 0.6], [0.42, 1.4], [0, 2.0], [-0.42, 1.4], [-0.62, 0.6]], 3).map((p) => [s + 0.1 + p[0], yr + 5.4 + p[1]]);
          ink.z(0.07).shape(bud, f(6), K, 0.09);
          ink.z(0.08).stroke([[s + 0.1, yr + 5.5], [s + 0.1, yr + 6.6]], 0.05, K).disc(s + 0.1, yr + 5.45, 0.2, ACC, 6);
        }
      }
      await ctx.yield();   // keeps this block's steps short
      // lamp niches: an arched frame, a dark ground, a clay lamp
      lampS.forEach((s0) => {
        const y0 = LAMP_Y, arch = [[-2, -2.7], [2, -2.7], ...inkArc(0, 0.9, 2, 0, Math.PI, 10)].map((p) => [s0 + p[0], y0 + p[1]]);
        ink.xf(null).wave(0);
        for (const sd of [-1, 1]) ink.z(0.03).fill([[sd * 2.3, 0.9], ...inkArc(0, 0.9, 2, 0, Math.PI / 2, 6).map((p) => [sd * p[0], p[1]]), [0, 3.2], [sd * 2.3, 3.2]].map((p) => [s0 + p[0], y0 + p[1]]), W);
        ink.z(0.045).stroke(arch, 0.5, K, true, 2);
        ink.z(0.05).stroke([[s0 - 2.9, y0 - 2.95], [s0 + 2.9, y0 - 2.95]], 0.4, K, false, 2);
        ink.z(-0.9).shape(inkArc(0, 0, 1, Math.PI, TAU, 8).map((p) => [s0 + p[0] * 1.35, y0 - 1.55 + p[1] * 0.85]), ACC, K, 0.1);
        ink.z(-0.88).stroke([[s0 - 1.5, y0 - 1.55], [s0 + 1.75, y0 - 1.55]], 0.14, K);
        for (let j = 0; j < 5; j++) { const a = Math.PI * (0.15 + 0.175 * j); ink.z(0.05).disc(s0 + Math.cos(a) * 3.1, y0 + 0.9 + Math.sin(a) * 3.1, 0.24, f(2), 7); }
      });
      // leaves fluttering on the bamboo arch
      ink.xf(null);
      for (let i = 0; i < 22; i++) {
        const sd = i & 1 ? 1 : -1, t = rng.range(0.15, 1), bx = S_NICHE + sd * (2.5 + 9.5 * t) + rng.range(-0.6, 0.6), by = 49.5 - 9 * t * t + rng.range(-1.2, 1.6);
        const L = rng.range(2.6, 4.0), a = sd * rng.range(0.5, 1.5) + (rng.chance(0.3) ? Math.PI : 0), ca = Math.sin(a), sa = Math.cos(a);
        const bl = inkLoop([[0, 0], [L * 0.35, 0.42], [L, 0], [L * 0.35, -0.42]], 3).map((p) => [bx + p[0] * ca - p[1] * sa, by + p[0] * sa + p[1] * ca]);
        ink.wave((x, y) => 0.2 * clamp(Math.hypot(x - bx, y - by) / 4, 0, 1) ** 2).z(0.06).shape(bl, f(5), K, 0.11);
        ink.z(0.075).stroke([[bx, by], [bx + L * 0.8 * ca, by + L * 0.8 * sa]], 0.06, K);
      }
      // banana plant painted beside the door
      {
        const s0 = 8.6, B = (x, y) => [s0 - x, 3.2 + y];
        ink.xf(B).wave((x, y) => 0.3 * clamp((y - 3.2) / 24, 0, 1) ** 2);
        ink.z(0.05).stroke([[0, 0], [0.3, 6], [0.2, 12], [0, 16.5]], 1.5, K, false, 2);
        [-1.2, -0.6, 0.02, 0.62, 1.22].forEach((a, i) => {
          const L = 8.6 + (i & 1) * 1.6, ca = Math.sin(a), sa = Math.cos(a);
          const R = (p) => [p[0] * ca - p[1] * sa, 16 + p[0] * sa + p[1] * ca - 0.045 * p[0] * p[0] * Math.abs(ca)];
          const blade = inkLoop([[0, 0], [L * 0.3, 1.5], [L * 0.75, 1.3], [L, 0], [L * 0.7, -1.2], [L * 0.3, -1.4]], 3).map(R);
          ink.z(0.06 + i * 0.01).shape(blade, f(5), K, 0.13);
          ink.z(0.075 + i * 0.01).stroke([R([0.3, 0]), R([L * 0.5, 0.05]), R([L * 0.95, 0])], 0.1, K);
          for (let j = 1; j < 6; j++) { const x = L * j / 6.5; ink.stroke([R([x, 0.05]), R([x + 0.5, 0.95])], 0.06, K).stroke([R([x, 0.05]), R([x + 0.5, -0.85])], 0.06, K); }
        });
      }
      add(ink.build(), wpMat, 1);
    }
    await ctx.yield();
    {
      const ink = makeInk();
      // the bamboo grove on the north wall: sixteen canes swaying from the root
      const cane = (s0, i, H = rng.range(27, 33.5)) => {
        const bow = rng.range(-1.7, 1.7);
        const cx = (y) => s0 + bow * ((y - 3) / H) ** 2, pts = [];
        for (let y = 3.3; y <= H; y += 1.9) pts.push([cx(y), y]);
        const sway = (x, y) => 0.55 * ((y - 3) / 30) ** 2;
        ink.xf(null).wave(sway).z(0.05 + (i % 4) * 0.01).stroke(pts, 0.95 - 0.25 * (i & 1), K, false, 2);
        let nd = 0;
        for (let y = 5 + rng.range(0, 2); y < H - 1; y += rng.range(3.6, 4.8), nd++) {
          ink.wave(sway).z(0.1).stroke([[cx(y) - 0.7, y], [cx(y) + 0.7, y]], 0.24, K);
          if (y < 11 || rng.chance(0.25)) continue;
          for (const sd of nd & 1 ? [1] : [-1, 1]) {
            const L = rng.range(3.0, 4.6), a = sd * rng.range(0.55, 1.15), ca = Math.sin(a), sa = Math.cos(a), bx = cx(y) + sd * 0.4;
            const bl = inkLoop([[0, 0], [L * 0.35, 0.42], [L, 0], [L * 0.35, -0.42]], 3).map((p) => [bx + p[0] * ca - p[1] * sa, y + p[0] * sa + p[1] * ca]);
            ink.wave((x, yy) => sway(x, yy) + 0.16 * clamp(Math.hypot(x - bx, yy - y) / 4.5, 0, 1) ** 2);
            ink.z(0.11).shape(bl, f(5), K, 0.11);
          }
        }
      };
      for (let i = 0; i < 16; i++) cane(sNorth(3 + i * 3.5 + rng.range(-0.6, 0.6)), i);
      for (let i = 0; i < 3; i++) cane(S3 + 9 + i * 2.5 + rng.range(-0.3, 0.3), i, 35.5 + i * 1.2);
      await ctx.yield();
      // the peacocks: body, neck, head; the tails are hinged feathers
      if (!elephants) PEA.forEach(([s0, m]) => {
        const X = (x, y) => [s0 + m * x, 14 + y];
        ink.xf(X).wave(0);
        for (const lx of [2.1, 4.3]) {
          ink.z(0.3).stroke([[lx, -2.8], [lx - 0.25, -6.6], [lx + 0.2, -10.1]], 0.3, K);
          for (const t of [-1, 0, 1]) ink.stroke([[lx + 0.2, -10.1], [lx + 0.9 + t * 0.5, -10.6 + Math.abs(t) * 0.35]], 0.16, K);
        }
        const body = inkLoop([[8.2, 1.2], [6.5, 3.6], [2.5, 3.9], [-1.2, 2.2], [-2.2, -0.4], [0.5, -3], [4.5, -3.4], [7.6, -1.6]], 5);
        ink.z(0.4).fill(body, f(4)).z(0.415).stroke(body, 0.55, K, true, 2);
        const neck = inkLoop([[5.6, 2.6], [7.3, 6], [7.9, 10], [9.2, 12.5], [11.0, 12.2], [10.5, 9.2], [9.7, 5.4], [8.5, 1.6]], 4);
        ink.z(0.42).fill(neck, f(4)).z(0.43).stroke(neck, 0.2, K, true);
        for (let j = 0; j < 5; j++) ink.z(0.44).disc(8.1 + j * 0.33, 3.6 + j * 1.75, 0.3, f(2), 7);
        const head = ell(10.3, 12.9, 1.6, 1.45, 16);
        ink.z(0.45).fill(head, f(4)).z(0.46).stroke(head, 0.2, K, true);
        ink.z(0.47).disc(10.6, 13.2, 0.52, W, 10).z(0.48).disc(10.7, 13.2, 0.22, K, 7);
        ink.z(0.44).shape([[11.6, 13.5], [13.5, 12.6], [11.6, 12.1]], f(2), K, 0.12);
        for (const t of [-0.5, 0, 0.5]) { ink.z(0.44).stroke([[10.1, 14.3], [10.1 + t * 1.6, 16.6 - Math.abs(t) * 0.6]], 0.11, K).z(0.45).disc(10.1 + t * 1.8, 17.0 - Math.abs(t) * 0.6, 0.36, ACC, 8); }
        const wing = inkLoop([[5.6, 1.6], [2.4, 2.4], [-0.6, 0.8], [1.4, -1.6], [4.8, -1.4]], 4);
        ink.z(0.44).shape(wing, f(5), K, 0.16);
        for (let j = 0; j < 4; j++) ink.z(0.455).stroke(inkArc(4.6 - j * 1.2, 0.5, 1.0, 2.2, 4.1, 5), 0.1, K);
        for (let j = 0; j < 3; j++) ink.z(0.44).disc(6.9 - j * 0.2, 0.9 - j * 1.1, 0.26, W, 7);
      });
      // or a pair of elephants facing each other across the jar; their trunks are hinged and lift as we pass
      const eBody = look === 'dusk' ? pal[4] : f(6), eCloth = look === 'dusk' ? pal[6] : f(4);
      const elephant = (s0, m, sc = 1.1, y0 = 15.5) => {
        // big fills are cut into small pieces from their middle outward so they follow the bulging plaster,
        // and the layers are kept well apart
        const X = (x, y) => [s0 + m * x * sc, y0 + y * sc];
        const starFill = (pts, col, rings) => {
          let cx = 0, cy = 0; for (const q of pts) { cx += q[0]; cy += q[1]; } cx /= pts.length; cy /= pts.length;
          const at = (q, t) => [cx + (q[0] - cx) * t, cy + (q[1] - cy) * t];
          for (let i = 0; i < pts.length; i++) {
            const a = pts[i], b = pts[(i + 1) % pts.length];
            for (let r = 0; r < rings; r++) {
              const t0 = r / rings, t1 = (r + 1) / rings;
              if (r === 0) ink.fill([at(a, 0), at(a, t1), at(b, t1)], col); else ink.fill([at(a, t0), at(a, t1), at(b, t1), at(b, t0)], col);
            }
          }
        };
        // long straight edges are cut into short ones for the same reason
        const cut = (pts) => { const o = []; pts.forEach((a, i) => { const b = pts[(i + 1) % pts.length], n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 1.4)); for (let k = 0; k < n; k++) o.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]); }); return o; };
        ink.xf(X).wave(0);
        for (const lx of [-5.2, 5.6, -7.4, 3.4]) {
          const leg = cut([[lx - 1.5, -3.1], [lx - 1.6, -10], [lx + 1.7, -10], [lx + 1.5, -3.1]]);
          ink.z(0.2); starFill(leg, eBody, 2);
          ink.z(0.3).stroke(leg, 0.3, K);
          for (let t = -1; t <= 1; t++) ink.z(0.32).stroke(inkArc(lx + t * 0.95, -10, 0.45, 0, Math.PI, 4), 0.1, K);
        }
        const body = inkLoop([[-9, 2], [-8, 8], [-2, 10.5], [5, 10], [9.5, 7.5], [9.5, 1], [7, -3], [-6, -3.5]], 5);
        ink.z(0.2); starFill(body, eBody, 4);
        ink.z(0.36).stroke(body, 0.7, K, true, 2);
        ink.wave((x, y) => 0.3 * clamp((24 - y) / 10, 0, 1)).z(0.3).stroke([[-9, 6.5], [-10.6, 3], [-10.2, -1.5]], 0.22, K).z(0.31).disc(-10.2, -2, 0.55, K, 6);
        ink.wave(0);
        const cloth = cut([[-5.5, 10.2], [4.5, 10.3], [5.2, 2], [-6.2, 2]]);
        ink.z(0.5); starFill(cloth, eCloth, 2);
        ink.z(0.62).stroke(cloth, 0.45, K, true, 2);
        for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) ink.z(0.62).disc(-4 + i * 2.6, 8.3 - j * 2.2, 0.4, (i + j) & 1 ? W : f(2), 7);
        for (let i = 0; i < 6; i++) ink.z(0.45).shape([[-6 + i * 1.9, 2], [-4.2 + i * 1.9, 2], [-5.1 + i * 1.9, 0.6]], f(2), K, 0.09);
        const head = inkLoop([[8.5, 11], [12, 12.5], [15.5, 10], [16, 6], [13.5, 3], [9.5, 4]], 5);
        ink.z(0.45); starFill(head, eBody, 2);
        ink.z(0.52).stroke(head, 0.5, K, true, 2);
        const ear = inkLoop([[9.5, 11], [6.5, 12.5], [4.6, 8.5], [6.5, 4], [9.3, 5.5]], 5);
        ink.wave(0.14).z(0.66); starFill(ear, f(2), 2);
        ink.z(0.74).stroke(ear, 0.18, K, true);
        for (let i = 0; i < 4; i++) ink.z(0.76).stroke([[9, 8.4], [5.6 + i * 0.35, 11 - i * 1.9]], 0.08, K);
        ink.wave(0).z(0.56).disc(13.3, 8.8, 0.6, W, 10).z(0.62).disc(13.4, 8.8, 0.28, K, 7).z(0.59).stroke(inkArc(13.3, 8.8, 0.6, 0, TAU, 10), 0.08, K);
        ink.z(0.6).shape([[14, 4.4], [17.5, 2.6], [19.6, 3.6], [17.6, 3.9], [15.2, 5.6]], W, K, 0.14);
        ink.z(0.58).disc(12.4, 11.3, 0.45, ACC, 8).disc(14.2, 10.5, 0.32, f(2), 7);
        for (let i = 0; i < 5; i++) ink.z(0.3).disc(-6.4 + i * 3.4, -1.2 + (i & 1) * 0.9, 0.5, i & 1 ? f(2) : W, 7);
      };
      // the trunk: one hinged piece drawn root-up like a feather; hanging it is turned half round, lifted it
      // stands up and forward with its tip curled back over the brow
      const trunk = (s0, m, which, sc = 1.1, y0 = 15.5) => {
        const ti = makeInk(), L = [], R = [], mid = [];
        for (let t = 0; t <= 14; t++) {
          const q = t / 14, x = -(1.4 * q + 2.8 * q * q * q), y = 11 * q - 5.5 * q * q * q, dx = -(1.4 + 8.4 * q * q), dy = 11 - 16.5 * q * q, l = Math.hypot(dx, dy) || 1, hw = 1.05 - 0.5 * q;
          L.push([x - dy / l * hw, y + dx / l * hw]); R.push([x + dy / l * hw, y - dx / l * hw]); mid.push([x, y, -dy / l * hw, dx / l * hw]);
        }
        ti.xf((x, y) => [m * x * sc, y * sc]).wave(0.07);
        ti.z(0.5).fill([...L, ...R.reverse()], eBody).z(0.53).stroke([...L, ...R], 0.3, K, true);
        for (let t = 2; t < 13; t++) { const q = mid[t]; ti.z(0.54).stroke([[q[0] - q[2] * 0.75, q[1] - q[3] * 0.75], [q[0] + q[2] * 0.75, q[1] + q[3] * 0.75]], 0.1, K); }
        ti.z(0.56).disc(mid[14][0], mid[14][1], 0.8, ACC, 8).z(0.57).disc(mid[4][0], mid[4][1], 0.34, f(2), 7).disc(mid[8][0], mid[8][1], 0.3, f(2), 7);
        const tg = ti.build(), ig = new THREE.InstancedBufferGeometry();
        ig.index = tg.index; for (const k of Object.keys(tg.attributes)) ig.setAttribute(k, tg.attributes[k]);
        ig.setAttribute('aF', new THREE.InstancedBufferAttribute(new Float32Array([s0 + m * 15.4 * sc, y0 + 5.6 * sc, m * Math.PI * 11 / 6, 0.3]), 4));
        ig.setAttribute('aG', new THREE.InstancedBufferAttribute(new Float32Array([which, m * Math.PI, 1]), 3));
        ig.instanceCount = 1;
        add(ig, fanMat, 1);
      };
      // the palanquin on its back: a platform, closed curtains between two posts, a bowed roof with a finial,
      // a pennant and tassels
      const palanquin = (s0, m, sc, y0) => {
        ink.xf((x, y) => [s0 + m * x * sc, y0 + y * sc]).wave(0);
        ink.z(0.66).shape([[-7, 10.4], [6, 10.4], [5.4, 12.2], [-6.4, 12.2]], f(2), K, 0.2);
        for (let i = 0; i < 8; i++) ink.z(0.68).shape([[-6 + i * 1.45, 10.6], [-4.75 + i * 1.45, 10.6], [-5.37 + i * 1.45, 11.9]], i & 1 ? f(4) : ACC, K, 0.08);
        ink.wave(0.05).z(0.64).fill([[-5.6, 12.2], [4.6, 12.2], [4.6, 19.2], [-5.6, 19.2]], look === 'line' ? W : ACC);
        for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++) ink.z(0.66).disc(-4.3 + i * 1.9, 13.7 + j * 1.9, 0.36, (i + j) & 1 ? (look === 'line' ? ACC : W) : f(2), 7);
        ink.z(0.67).stroke([[-0.5, 12.2], [-0.3, 15.5], [-0.5, 19.2]], 0.16, K);
        ink.wave(0);
        for (const px of [-5.6, 4.6]) ink.z(0.68).stroke([[px, 12.2], [px, 19.6]], 0.62, K, false, 2);
        const roof = [[-7.4, 19.2], [-6, 20.8], [-3, 22.2], [-0.5, 22.7], [2, 22.2], [5, 20.8], [6.4, 19.2]];
        ink.z(0.7).fill(roof, f(4)).z(0.72).stroke(roof, 0.5, K, true, 2);
        for (let i = 0; i < 6; i++) ink.z(0.73).disc(-5 + i * 1.8, 20.25, 0.32, f(2), 7);
        ink.z(0.72).stroke([[-0.5, 22.7], [-0.5, 25.6]], 0.2, K).z(0.73).disc(-0.5, 23.6, 0.62, f(2), 8).disc(-0.5, 24.8, 0.42, ACC, 8);
        ink.wave(0.2).z(0.72).shape([[-0.5, 25.7], [2.9, 25.0], [-0.5, 24.3]], ACC, K, 0.1);
        for (let i = 0; i < 8; i++) { const tx = -6.6 + i * 1.75; ink.wave(0.1).z(0.74).stroke([[tx, 19.2], [tx, 18.0]], 0.1, K).disc(tx, 17.8, 0.32, f(2), 6); }
      };
      if (elephants) { elephant(90, -1); elephant(49, 1); }
      // on the west wall, left of the lotus: an elephant bringing the curtained palanquin (nobody is shown)
      elephant(WEL, 1, 0.7, 16.5); palanquin(WEL, 1, 0.7, 16.5);
      add(ink.build(), wpMat, 1);
      if (elephants) { trunk(90, -1, 0); trunk(49, 1, 1); }
      trunk(WEL, 1, 2, 0.7, 16.5);
      // feathers
      if (!elephants) {
      const fi = makeInk();
      fi.z(0.05).stroke([[0, 1.5], [0.18, 8], [0, 15]], 0.14, K);
      for (let b = 0; b < 6; b++) { const y = 3.6 + b * 1.8; fi.stroke([[0.1, y], [0.95, y + 1.15]], 0.07, K).stroke([[0.1, y], [-0.8, y + 1.15]], 0.07, K); }
      fi.z(0.06).shape(ell(0, 16.2, 1.5, 2.15, 14), f(5), K, 0.12).z(0.075).shape(ell(0, 16.0, 0.98, 1.45, 12), f(2), K, 0.08);
      fi.z(0.09).fill(ell(0, 15.8, 0.52, 0.8, 10), f(4)).z(0.1).disc(0, 15.75, 0.2, ACC, 6);
      const fg = fi.build(), ig = new THREE.InstancedBufferGeometry();
      ig.index = fg.index; for (const k of Object.keys(fg.attributes)) ig.setAttribute(k, fg.attributes[k]);
      const NFE = 40, F = new Float32Array(NFE * 2 * 4), G = new Float32Array(NFE * 2 * 3);
      PEA.forEach(([s0, m], b) => {
        for (let i = 0; i < NFE; i++) {
          const o = (b * NFE + i);
          F[o * 4] = s0; F[o * 4 + 1] = 15; F[o * 4 + 2] = m * lerp(-1.75, 1.75, i / (NFE - 1)); F[o * 4 + 3] = i / (NFE - 1);
          // folded: fifteen places in three files, the eyes stepping down the train like scales
          const cl = i % 15, file = cl % 3, row = Math.floor(cl / 3);
          G[o * 3] = b; G[o * 3 + 1] = m * (1.9 + (file - 1) * 0.125); G[o * 3 + 2] = 1 - 0.185 * row - 0.062 * file;
        }
      });
      ig.setAttribute('aF', new THREE.InstancedBufferAttribute(F, 4)); ig.setAttribute('aG', new THREE.InstancedBufferAttribute(G, 3));
      ig.instanceCount = NFE * 2;
      add(ig, fanMat, 1);
      }
    }
    await ctx.yield();
    // ---- movers: fish along the river, snakes under the eaves, bees, the arch's parrots, the lamp flames
    {
      const mk = makeInk(), bodies = look === 'dusk' ? [pal[4], pal[6]] : [f(2), f(6), f(4)];
      for (let i = 0; i < 60; i++) {
        const b = bodies[i % bodies.length];
        mk.ext([(i + 0.5) * SL / 60 + (i & 1 ? -0.55 : 0.55), rng.range(-0.3, 0.3), rng.range(0, TAU), 1]);
        drawFish(mk, { W, K, acc: ACC, body: b, second: b === f(2) ? f(3) : f(2), third: f(5) }, rng.range(0.78, 0.9), rng);
        if ((i & 15) === 15) await ctx.yield();
      }
      await ctx.yield();
      for (let i = 0; i < 6; i++) {
        mk.ext([(i + (i & 1 ? 0.2 : 0.55)) * SL / 6, 16.4, rng.range(0, TAU), 0]);
        const pts = []; for (let x = -6.5; x <= 4.61; x += 0.55) pts.push([x, 0.5 * Math.sin(x * 1.15)]);
        mk.xf(null).wave(0.26).z(0.08).stroke(pts, 0.85, K, false, 2);
        const hy = 0.5 * Math.sin(4.6 * 1.15);
        mk.z(0.09).shape([[4.3, hy + 0.55], [5.5, hy + 0.8], [6.6, hy], [5.5, hy - 0.8], [4.3, hy - 0.55]], f(5), K, 0.12);
        mk.z(0.1).disc(5.6, hy + 0.2, 0.2, W, 7).stroke([[6.6, hy], [7.3, hy + 0.1], [7.8, hy + 0.4]], 0.09, ACC).stroke([[7.3, hy + 0.1], [7.8, hy - 0.25]], 0.09, ACC);
      }
      for (let i = 0; i < 14; i++) {
        mk.ext([(i + rng.range(0.1, 0.9)) * SL / 14, rng.range(5.6, 8.4), rng.range(0, TAU), 0]);
        mk.xf(null).wave(0.5).z(0.1).shape(ell(0, 0, 0.85, 0.55, 10), f(2), K, 0.09);
        mk.z(0.11).stroke([[-0.15, 0.5], [-0.15, -0.5]], 0.14, K).stroke([[0.3, 0.42], [0.3, -0.42]], 0.12, K).disc(0.62, 0.08, 0.1, K, 5);
        mk.z(0.09).shape(ell(-0.25, 0.8, 0.6, 0.3, 8, 0.5), W, K, 0.07).shape(ell(0.3, 0.85, 0.5, 0.26, 8, -0.3), W, K, 0.07);
      }
      for (const sd of [-1, 1]) {
        mk.ext([S_NICHE + sd * 6.2, 47.9, rng.range(0, TAU), 2]);
        drawParrot(mk, { W, K, acc: ACC, body: f(5), second: look === 'dusk' ? pal[6] : f(5), third: f(2) }, 0.8);
      }
      lampS.forEach((s0, i) => {
        mk.ext([s0, LAMP_Y - 1.5, rng.range(0, TAU), 3 + i / 16]);
        const fl = inkLoop([[0, 0], [0.6, 0.65], [0.34, 1.6], [0, 2.6], [-0.34, 1.6], [-0.6, 0.65]], 3);
        mk.xf(null).wave((x, y) => 0.2 * clamp(y / 2.6, 0, 1) ** 2).z(-0.86).shape(fl, look === 'line' ? W : pal[2], K, 0.09);
        mk.z(-0.84).fill(fl.map((p) => [p[0] * 0.5, 0.25 + p[1] * 0.55]), ACC);
      });
      add(mk.build(), moverMat, 2);
    }
    await ctx.yield();
    // ---- the west wall's scene and the big figures between the bands
    // one figure drawn about the origin, then scaled (strokes and all), mirrored and set down at (s, y): still ink,
    // or with ext = [phase, mode] a mover that keeps its place
    const still = [], live = [];
    const stamp = (draw, s0, y0, k = 1, m = 1, ext = null) => {
      const t = makeInk(); draw(t);
      const g = t.build(), p = g.attributes.position, A = g.attributes.aS, N = g.attributes.aN;
      for (let i = 0; i < p.count; i++) {
        p.setXYZ(i, (ext ? 0 : s0) + p.getX(i) * k * m, (ext ? 0 : y0) + p.getY(i) * k, p.getZ(i) + (ext ? 0.16 : 0));   // movers stand over the still ink
        A.setY(i, A.getY(i) * k); A.setW(i, A.getW(i) * k);
        N.setXYZ(i, N.getX(i) * m, N.getY(i), N.getZ(i) * k);
      }
      if (ext) { const R = new Float32Array(p.count * 4); for (let i = 0; i < p.count; i++) { R[i * 4] = s0; R[i * 4 + 1] = y0; R[i * 4 + 2] = ext[0]; R[i * 4 + 3] = ext[1]; } g.setAttribute('aR', new THREE.Float32BufferAttribute(R, 4)); }
      (ext ? live : still).push(g);
    };
    const fishBodies = look === 'dusk' ? [pal[4], pal[6]] : [f(2), f(6), f(4)];
    const fishKit = (i) => { const b = fishBodies[i % fishBodies.length]; return { W, K, acc: ACC, body: b, second: b === f(2) ? f(3) : f(2), third: f(5) }; };
    const parrotKit = { W, K, acc: ACC, body: f(5), second: look === 'dusk' ? pal[6] : f(5), third: f(2) };
    const turtleKit = { W, K, acc: ACC, body: f(5), second: f(2), third: look === 'dusk' ? pal[6] : f(5) };
    const bigFish = (s, y, k, m, i) => { stamp((t) => drawFish(t, fishKit(i), 1, rng), s, y, k, m, [rng.range(0, TAU), 5]); keepOut.push([s - 5.6 * k, s + 5.6 * k, y - 2.3 * k, y + 2.3 * k]); };
    const bigParrot = (s, y, k, m, hop = 0.5) => { stamp((t) => drawParrot(t, parrotKit, 1), s, y, k, m, [rng.range(0, TAU), 5 + hop]); keepOut.push([s - 4.6 * k, s + 4.6 * k, y - 2.2 * k, y + 1.9 * k]); };
    const bigTurtle = (s, y, k, m) => { stamp((t) => drawTurtle(t, turtleKit, 1), s, y, k, m, [rng.range(0, TAU), 5]); keepOut.push([s - 3.6 * k, s + 3.6 * k, y - 2.5 * k, y + 2.5 * k]); };
    {
      // the third lotus: sixteen outer petals over green sepals, eight inner petals, a dotted boss; it turns and
      // breathes. Round it a ring of twelve lotus leaves and buds that goes the other way, between two still rings.
      const sp = makeInk(), rad = (a, r, v = 0) => [Math.cos(a) * r - Math.sin(a) * v, Math.sin(a) * r + Math.cos(a) * v];
      const petal = (a, r0, L, wd) => inkLoop([[0, 0], [L * 0.3, wd], [L * 0.72, wd * 0.78], [L, 0], [L * 0.72, -wd * 0.78], [L * 0.3, -wd]], 3).map((q) => rad(a, r0 + q[0], q[1]));
      const breathe = (amt) => (x, y) => amt * clamp((Math.hypot(x, y) - 3) / 8, 0, 1);
      sp.ext([S_MED, MED_Y, 0, 0]).xf(null);
      for (let i = 0; i < 16; i++) {
        const a = (i + 0.5) * TAU / 16;
        sp.wave(breathe(0.05)).z(0.05).shape([rad(a, 8.4, 1.2), rad(a, 12.1, 0), rad(a, 8.4, -1.2)], f(5), K, 0.12);
      }
      for (let i = 0; i < 16; i++) {
        const a = i * TAU / 16, o = petal(a, 5.0, 6.3, 1.66), zz = 0.08 + (i & 1) * 0.03;
        sp.wave(breathe(0.065)).z(zz).fill(o, f(6)).z(zz + 0.012).stroke(o, 0.5, K, true, 2);
        sp.z(zz + 0.014).shape(petal(a, 6.6, 3.1, 0.66), f(2), K, 0.07);
        sp.z(zz + 0.016).stroke([rad(a, 5.9), rad(a, 6.7)], 0.08, K).disc(...rad(a, 10.25), 0.2, ACC, 6);
      }
      sp.ext([S_MED, MED_Y, 0, 2.4]);
      for (let i = 0; i < 8; i++) {
        const a = (i + 0.5) * TAU / 8, o = petal(a, 2.0, 5.0, 1.75);
        sp.wave(breathe(0.05)).z(0.15).fill(o, f(2)).z(0.162).stroke(o, 0.42, K, true, 2);
        sp.z(0.165).shape(petal(a, 3.2, 2.5, 0.7), f(6), K, 0.07).disc(...rad(a, 6.1), 0.2, look === 'line' ? ACC : W, 6);
      }
      sp.wave(0).z(0.18).disc(0, 0, 2.7, ACC, 24).z(0.19).stroke(inkArc(0, 0, 2.7, 0, TAU, 24).slice(0, 24), 0.46, K, true, 2);
      for (let i = 0; i < 10; i++) sp.z(0.2).disc(...rad(i * TAU / 10, 1.82), 0.23, W, 6);
      sp.z(0.2).disc(0, 0, 1.05, f(2), 12).z(0.21).stroke(inkArc(0, 0, 1.05, 0, TAU, 12).slice(0, 12), 0.1, K, true).disc(0, 0, 0.32, K, 6);
      sp.ext([S_MED, MED_Y, 1, 0]);
      for (let i = 0; i < 12; i++) {
        const a = i * TAU / 12, c = rad(a, 14.25), b = a + TAU / 24;
        const leaf = [[c[0] - Math.cos(a) * 0.25, c[1] - Math.sin(a) * 0.25], ...inkArc(c[0], c[1], 1.85, a + Math.PI + 0.3, a + 3 * Math.PI - 0.3, 14)];
        sp.z(0.06).shape(leaf, f(5), K, 0.15);
        for (let j = 0; j < 5; j++) { const v = a + Math.PI + 0.9 + j * (TAU - 1.8) / 4; sp.z(0.08).stroke([c, [c[0] + Math.cos(v) * 1.45, c[1] + Math.sin(v) * 1.45]], 0.07, K); }
        sp.z(0.085).disc(c[0], c[1], 0.3, f(2), 7);
        sp.z(0.06).shape(inkLoop([rad(b, 13.3), rad(b, 14.0, 0.6), rad(b, 15.5), rad(b, 14.0, -0.6)], 3), f(6), K, 0.1);
        sp.z(0.07).shape([rad(b, 13.0), rad(b, 13.7, 0.5), rad(b, 13.7, -0.5)], f(5), K, 0.08);
      }
      const spinMat = mat(WP_VERT, PAINT_FRAG, wpU, { SPIN: 1 }); spinMat.vertexColors = true;
      add(sp.build(), spinMat, 1);
      const fr = makeInk();
      fr.z(0.05).stroke(inkArc(S_MED, MED_Y, 12.75, 0, TAU, 72).slice(0, 72), 0.7, K, true, 2);
      for (let i = 0; i < 64; i++) { const a = i * TAU / 64; fr.z(0.05).disc(S_MED + Math.cos(a) * 16.65, MED_Y + Math.sin(a) * 16.65, 0.26, ACC, 6); }
      still.push(fr.build());
    }
    await ctx.yield();
    {
      // above the river on the west gable: a kalash with mango leaves and a coconut, a big parrot either side
      const GS = S2 + 37;
      stamp((t) => {
        t.xf(null).wave(0).z(0.05).shape([[-2.4, 0], [2.4, 0], [1.6, 1.3], [-1.6, 1.3]], look === 'line' ? W : f(3), K, 0.16);
        const body = ell(0, 5.3, 5.3, 4.3, 26);
        t.z(0.06).fill(body, f(2)).z(0.075).stroke(body, 0.56, K, true, 2);
        for (let i = 0; i < 7; i++) t.z(0.08).shape([[-4.2 + i * 1.2, 4.5], [-3.0 + i * 1.2, 4.5], [-3.6 + i * 1.2, 6.3]], i & 1 ? f(4) : ACC, K, 0.08);
        for (let i = 0; i < 6; i++) t.z(0.08).disc(-3 + i * 1.2, 3.0, 0.32, look === 'line' ? ACC : W, 7);
        t.z(0.08).stroke([[-4.6, 7.2], [4.6, 7.2]], 0.12, K).stroke([[-3.9, 2.0], [3.9, 2.0]], 0.12, K);
        t.z(0.07).shape([[-2.4, 9.1], [2.4, 9.1], [3.2, 10.8], [-3.2, 10.8]], look === 'line' ? W : f(3), K, 0.16);
        [-1.2, -0.62, 0, 0.62, 1.2].forEach((a, i) => {
          const L = 6.0 - Math.abs(a) * 0.8, ca = Math.sin(a), sa = Math.cos(a);
          const lf = inkLoop([[0, 0], [L * 0.35, 1.0], [L, 0], [L * 0.35, -1.0]], 3).map((q) => [q[0] * ca - q[1] * sa, 10.8 + q[0] * sa + q[1] * ca]);
          t.wave(0.07).z(0.05 + i * 0.004).shape(lf, f(5), K, 0.13); t.z(0.07).stroke([[0, 10.8], [L * 0.8 * ca, 10.8 + L * 0.8 * sa]], 0.07, K);
        });
        t.wave(0).z(0.09).shape(ell(0, 12.6, 2.0, 2.3, 14), f(2), K, 0.15).z(0.1).disc(0, 14.0, 0.36, ACC, 7);
      }, GS, 65.6, 1.05, 1);
      keepOut.push([GS - 6.5, GS + 6.5, 64, 84]);
      await ctx.yield();
      bigParrot(GS - 15.5, 70.2, 2.05, 1, 0.7); bigParrot(GS + 15.5, 70.2, 2.05, -1, 0.7);
      // the corner by the wheel: a tortoise and two parrots, one above the other
      bigTurtle(sNorth(73.3), 14.6, 1.5, -1); bigParrot(sNorth(72.6), 24.2, 1.3, -1); bigParrot(sNorth(73.6), 31.6, 1.3, 1);
      // the parrots of the bamboo clump in the north-west corner
      bigParrot(S3 + 10.8, 36.4, 1.1, 1); bigParrot(S3 + 12.6, 27.6, 1.1, -1); bigParrot(S3 + 10.6, 18.8, 1.1, 1); bigParrot(S3 + 13, 10.8, 1.0, -1);
      // under the sill, between the canes: the pair of fish
      bigFish(S_NICHE - 0.4, 21.4, 1.1, 1, 1); bigFish(S_NICHE + 0.4, 14.6, 1.1, -1, 2);
      await ctx.yield();
      // tall lotus plants between the lamps and behind the jars: a fan of seven petals, a round leaf and a bud on
      // three stems that sway from the root; big creatures keep their places in the band between them
      const pl = makeInk();
      const lotusPlant = (s0, m, top) => {
        const H = top - 4.6, sway = (x, y) => 0.42 * clamp((y - 5) / 30, 0, 1) ** 2;
        pl.xf((x, y) => [s0 + m * x, 4.6 + y]).wave(sway);
        const stem = (x1, h, bend) => { const pts = []; for (let i = 0; i <= 12; i++) { const q = i / 12; pts.push([x1 * q * q * q + bend * Math.sin(q * Math.PI), h * q]); } return pts; };
        pl.z(0.05).stroke(stem(0.4, H - 6.8, 0.6), 0.34, K).stroke(stem(-5.8, H - 8.2, -0.3), 0.24, K).stroke(stem(4.8, H - 8.4, 0.3), 0.24, K);
        const fx = 0.4, fy = H - 6.8;
        for (const i of [0, 6, 1, 5, 2, 4, 3]) {
          const a = (i - 3) * 0.3, L = 6.3 - Math.abs(i - 3) * 0.5, ca = Math.sin(a), sa = Math.cos(a), zz = 0.06 + (3 - Math.abs(i - 3)) * 0.02;
          const R = (q) => [fx + q[0] * ca - q[1] * sa, fy + q[0] * sa + q[1] * ca];
          const o = inkLoop([[0, 0], [L * 0.35, 1.15], [L * 0.75, 0.85], [L, 0], [L * 0.75, -0.85], [L * 0.35, -1.15]], 3).map(R);
          pl.z(zz).fill(o, f(6)).z(zz + 0.008).stroke(o, 0.36, K, true, 2);
          pl.z(zz + 0.01).fill(inkLoop([[L * 0.2, 0], [L * 0.45, 0.42], [L * 0.75, 0], [L * 0.45, -0.42]], 3).map(R), f(2));
        }
        pl.z(0.15).shape([[fx - 1.7, fy + 0.3], [fx, fy - 1.2], [fx + 1.7, fy + 0.3], [fx, fy + 1.7]], f(5), K, 0.13);
        const lx = -5.8, ly = H - 6.4, leaf = [[lx, ly - 0.25], ...inkArc(lx, ly, 2.1, -Math.PI / 2 + 0.3, 1.5 * Math.PI - 0.3, 16)];
        pl.z(0.07).shape(leaf, f(5), K, 0.16);
        for (let j = 0; j < 7; j++) { const a = -Math.PI / 2 + 0.75 + j * (TAU - 1.5) / 6; pl.z(0.09).stroke([[lx, ly - 0.25], [lx + Math.cos(a) * 1.7, ly + Math.sin(a) * 1.7]], 0.07, K); }
        pl.z(0.095).disc(lx, ly - 0.25, 0.32, f(2), 7);
        const bx = 4.8, by = H - 8.4;
        pl.z(0.07).shape(inkLoop([[0, 0], [0.95, 1.0], [0.62, 2.5], [0, 3.8], [-0.62, 2.5], [-0.95, 1.0]], 3).map((q) => [bx + q[0], by + q[1]]), f(6), K, 0.14);
        pl.z(0.09).stroke([[bx, by + 1.0], [bx, by + 3.1]], 0.07, K).z(0.085).shape([[bx - 0.95, by + 0.35], [bx, by - 0.6], [bx + 0.95, by + 0.35], [bx, by + 1.1]], f(5), K, 0.1);
        keepOut.push([s0 - 8.2, s0 + 8.2, 25.5, 36], [s0 - 3.6, s0 + 3.6, 5, 26]);
      };
      lotusPlant(128.5, 1, 35); lotusPlant(149.5, -1, 35.3); lotusPlant(167.2, 1, 34.8);
      lotusPlant(sNorth(-72), 1, 35.2); lotusPlant(sNorth(-40.5), -1, 35);
      still.push(pl.build());
      await ctx.yield();
      bigFish(115.5, 30.8, 1.35, -1, 0); bigParrot(138.6, 31.2, 1.15, -1); bigFish(178.6, 30.6, 1.1, -1, 1);
      bigTurtle(sNorth(-87.5), 30.6, 1.25, -1); bigFish(sNorth(-56.5), 30.8, 1.4, -1, 2); bigFish(sNorth(-21.5), 30.8, 1.4, -1, 0); bigTurtle(sNorth(-8.3), 30.6, 1.2, -1);
      await ctx.yield();
      add(mergeGeometries(still, false), wpMat, 1);
      add(mergeGeometries(live, false), moverMat, 2);
      for (const g of still) g.dispose();
      for (const g of live) g.dispose();
    }
    await ctx.yield();
    // ---- sown motifs in every gap
    {
      const ok = (s, y, r) => {
        if (y < 9.2 + r || y > wall.top(s) - 3.6 - r) return false;
        const yr = wall.riverY(s);
        if (Math.abs(y - yr) < 6.4 + r && y < yr + 8.6 + r) return false;                 // river, lotus, bees
        if (Math.abs(y - yr - 16.4 + 0.5875 * (yr - 40)) < 1.7 + r) return false;          // snakes
        for (const q of keepOut) if (s > q[0] - r && s < q[1] + r && y > q[2] - r && y < q[3] + r) return false;
        if (Math.hypot(s - S_MED, y - MED_Y) < 17.3 + r) return false;                     // the west lotus
        if (Math.abs(s - S_DOOR) < 11 + r && y < 37.5 + r) return false;
        if (s < 21 && y < 31) return false;                                                // banana
        if (Math.abs(s - S_NICHE) < 14 + r && y < 52) return false;
        if (Math.hypot(s - discs.x, y - discs.y) < 6.4 + r || Math.hypot(s - discs.z, y - discs.w) < 6.4 + r) return false;
        for (const [ps] of PEA) if (Math.hypot(s - ps, y - 15) < 19.8 + r) return false;
        if (s > sNorth(0) && s < sNorth(60) && y < 35.5 + r) return false;                 // grove
        if (Math.abs(s - (S2 + 37)) < 6.5 && Math.abs(y - 88) < 6.5) return false;         // vent
        for (const ls of lampS) if (Math.hypot(s - ls, y - LAMP_Y) < 4.6 + r) return false;
        return true;
      };
      const spots = [[], []], keep = Math.min(1, 0.92 * detail * dens);
      for (let cs = 4; cs < SL - 3; cs += 3.9) for (let cy = 9; cy < 92; cy += 3.9) {
        const s = cs + rng.range(-1.3, 1.3), y = cy + rng.range(-1.3, 1.3), kindRoll = rng(), pick = rng(), sz = rng.range(1.0, 1.75), rot = rng.range(0, TAU), take = rng();
        if (take > keep || !ok(s, y, sz)) continue;
        spots[kindRoll < 0.56 ? 0 : 1].push({ s, y, sz, rot, pick });
      }
      const fl = makeInk(), mk = new THREE.Color(-1, 0, 0);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * TAU, c = Math.cos(a), sn = Math.sin(a);
        fl.z(0.05).shape([[0.26, 0], [0.62, 0.21], [1.0, 0], [0.62, -0.21]].map((p) => [p[0] * c - p[1] * sn, p[0] * sn + p[1] * c]), mk, K, 0.07);
      }
      fl.z(0.07).disc(0, 0, 0.3, W, 8).z(0.08).disc(0, 0, 0.14, ACC, 5);
      const sp = makeInk(); drawSprig(sp, { W, K, acc: ACC });
      const geos = [fl.build(), sp.build()], m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), zax = new THREE.Vector3(0, 0, 1), v = new THREE.Vector3(), sv = new THREE.Vector3();
      const tints = look === 'line' ? [W] : look === 'dusk' ? [pal[6], pal[4]] : [pal[2], pal[3], pal[6], pal[4]];
      for (let g = 0; g < 2; g++) {
        const n = spots[g].length; if (!n) continue;
        const im = new THREE.InstancedMesh(geos[g], wpMat, n); im.frustumCulled = false; im.renderOrder = 1;
        spots[g].forEach((o, i) => {
          q.setFromAxisAngle(zax, g === 0 ? o.rot : (o.rot / TAU - 0.5) * 0.9);
          m4.compose(v.set(o.s, o.y, 0), q, sv.set(o.sz, o.sz, 1)); im.setMatrixAt(i, m4);
          im.setColorAt(i, g === 0 ? tints[Math.floor(o.pick * tints.length)] : f(5));
        });
        im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true;
        scene.add(im);
      }
    }
    await ctx.yield();

    // ---- relief: jars, pots, baskets, the bamboo arch
    const JARS = [{ x: 13, z: 39, k: 1, sg: -1 }, { x: -40, z: -41, k: 0.667, sg: 1 }, { x: -72, z: -41, k: 0.667, sg: 1 }];
    const POTS = [[-60, 47, -8], [-24, 50, 31], [60, 56, -30], [-5, 52, -11]];
    {
      const rc = reliefCollector(), solid = look === 'line' ? W : f(3);
      for (const j of JARS) {
        const k = j.k, pr = [[3.4, 2, 0], [5.2, 3.2, 0], [6, 6, 1], [6, 15.5, 1], [5.6, 17.5, 2], [4.2, 19.6, 2], [3.5, 20.4, 3], [3.5, 21.2, 3], [4.3, 22, 4], [4.0, 22.4, 4], [3.3, 22.2, 4], [3.1, 21, 5], [0, 21, 5]].map((q) => [q[0] * k, q[1] * k, q[2]]);
        rc.lathe(j.x, j.z, pr, { 0: [solid, solid, 0, 1], 1: [f(2), f(4), 2, 1.9 * (k < 1 ? 0.8 : 1)], 2: [ACC, f(4), 3, 2.4 * k], 3: [f(2), f(2), 5, 0.42], 4: [solid, solid, 0, 1], 5: [look === 'line' ? K : pal[4], K, 0, 1] }, 44);
        for (const a of [0.785, 2.356, 3.927, 5.498]) rc.lathe(j.x + Math.cos(a) * 3.3 * k, j.z + Math.sin(a) * 3.3 * k, [[1.3 * k, 0, 0], [1.1 * k, 2.6 * k, 0]], { 0: [solid, solid, 0, 1] }, 10);
      }
      await ctx.yield();
      // the water pot at the heart of the floor drawing, coconut and mango leaves in its mouth
      rc.lathe(-35, -7, [[2.2, 0, 0], [4.6, 2.5, 1], [5, 5.5, 1], [4.2, 8.5, 2], [2.6, 10, 3], [2.6, 10.8, 3], [3.4, 11.6, 4], [3.0, 11.7, 4], [2.4, 11.0, 5]],
        { 0: [solid, solid, 0, 1], 1: [f(2), f(4), 2, 1.5], 2: [f(4), W, 3, 1.9], 3: [f(2), f(2), 5, 0.4], 4: [solid, solid, 0, 1], 5: [K, K, 0, 1] }, 36);
      rc.lathe(-35, -7, [[2.3, 11.2, 0], [2.5, 12.4, 0], [1.9, 13.8, 0], [0.7, 14.6, 1], [0, 14.9, 1]], { 0: [f(5), f(5), 5, 0.55], 1: [f(2), f(2), 0, 1] }, 18);
      for (let i = 0; i < 6; i++) {
        const a = (i + 0.5) * TAU / 6, pts = [];
        for (let t = 0; t <= 6; t++) { const d = 2.2 + t * 0.85, yy = 11.8 + 1.5 * Math.sin(t * 0.45) - 0.07 * t * t; pts.push([-35 + Math.cos(a) * d, yy, -7 + Math.sin(a) * d]); }
        rc.tube(pts, (t) => 0.12 + 0.75 * Math.sin(Math.PI * Math.min(1, t * 1.05)) ** 0.8, f(5), f(5), 0, 1, 4);
      }
      // brass plate of rice and the incense holder
      rc.lathe(-27.5, 1.5, [[0, 0.02, 0], [2.9, 0.02, 0], [3.6, 0.9, 0], [3.8, 0.9, 0], [3.0, 0.3, 1], [2.4, 0.5, 2], [1.4, 1.5, 2], [0, 1.9, 2]], { 0: [f(2), f(2), 5, 0.3], 1: [f(2), f(2), 0, 1], 2: [W, W, 0, 1] }, 24);
      rc.lathe(-42, 3, [[1.5, 0, 0], [1.2, 0.9, 0], [0.5, 1.3, 0], [0, 1.3, 0]], { 0: [ACC, f(2), 3, 0.9] }, 14);
      const STICKS = [[-42.5, 7.4, 3], [-42, 7.9, 3], [-41.4, 7.3, 3]];
      STICKS.forEach((q, i) => rc.tube([[-42 + (i - 1) * 0.25, 1.2, 3], q], 0.1, K, K, 0, 1, 4));
      // baskets by the door
      rc.mx(new THREE.Matrix4().makeRotationX(-1.2).setPosition(40.5, 4.9, 43.0));
      rc.lathe(0, 0, [[0, 0, 0], [4.2, 0, 0], [4.8, 0.9, 1], [4.55, 1.0, 1], [4.0, 0.3, 0], [0, 0.3, 0]], { 0: [f(2), f(2), 4, 0.7], 1: [solid, solid, 0, 1] }, 28);
      rc.mx(null);
      rc.lathe(70.5, 37.5, [[2.6, 0, 0], [3.3, 0.4, 0], [3.6, 4.2, 0], [3.85, 4.4, 2], [3.85, 5.0, 2], [3.0, 6.6, 3], [1.0, 7.6, 3], [0.7, 8.4, 4], [1.1, 8.9, 4], [0, 9.1, 4]],
        { 0: [f(2), f(2), 4, 0.62], 2: [ACC, f(4), 3, 1.2], 3: [f(6), f(6), 4, 0.5], 4: [solid, solid, 0, 1] }, 28);
      await ctx.yield();
      // four clay pots in rope slings under the rafters, turning a little
      POTS.forEach(([px, yb, pz], i) => {
        rc.pivot(px, pz, 0.55, i * 1.7);
        rc.lathe(px, pz, [[0, 0, 0], [1.2, 0.1, 0], [2.9, 1.6, 1], [3.1, 3.4, 1], [2.2, 5.2, 2], [1.6, 5.8, 3], [2.1, 6.5, 3], [1.5, 6.3, 4], [0, 6.2, 4]].map((q) => [q[0], q[1] + yb, q[2]]),
          { 0: [solid, solid, 0, 1], 1: [i & 1 ? f(2) : ACC, i & 1 ? f(4) : f(2), 2, 1.25], 2: [f(4), W, 3, 1.5], 3: [solid, solid, 0, 1], 4: [K, K, 0, 1] }, 26);
        const top = 96 - Math.abs(pz) * 0.8 - 1.2;
        for (let r = 0; r < 4; r++) { const a = r * TAU / 4 + 0.4; rc.tube([[px + Math.cos(a) * 2.2, yb + 0.6, pz + Math.sin(a) * 2.2], [px + Math.cos(a) * 3.15, yb + 3.2, pz + Math.sin(a) * 3.15], [px + Math.cos(a) * 1.9, yb + 6.2, pz + Math.sin(a) * 1.9], [px, yb + 10.5, pz]], 0.13, K, K, 0, 1, 4); }
        rc.tube([[px, yb + 10.5, pz], [px, top, pz]], 0.15, K, K, 0, 1, 4);
      });
      rc.pivot(0, 0, 0, 0);
      // the bamboo arch round the niche: two clumps of canes that bend to cross above it
      for (const sd of [-1, 1]) for (let j = 0; j < 3; j++) {
        const pts = [], z0 = -28 + sd * (10.2 + j * 1.5), top = 45.6 - j * 1.1;
        for (let t = 0; t <= 26; t++) {
          const q = t / 26, lift = Math.sin(q * Math.PI * 0.56) / Math.sin(Math.PI * 0.56);
          const zz = z0 - sd * (10.2 + j * 1.5 + 5.5 - j) * q ** 4;
          pts.push([-109.25 + 0.5 * j * (1 - q) + 0.35 * (sd > 0 ? 1 : 0) * q, 3.0 + (top - 3.0) * lift + (q > 0.86 ? -(q - 0.86) * 9 : 0), zz]);
        }
        rc.tube(pts, (t) => 0.78 - 0.34 * t, f(2), f(2), 1, 4.4 - j * 0.5, 7, [1, 0, 0]);
      }
      const rg = rc.build();
      const reliefU = { uTime: U.uTime, uViewH: U.uViewH, uInk: U.uInk, uGround: U.uGround };
      const reliefMat = mat(RELIEF_VERT, RELIEF_FRAG, reliefU); reliefMat.vertexColors = true;
      const hullMat = mat(RELIEF_VERT, RELIEF_FRAG, reliefU, { HULL: 1 }); hullMat.vertexColors = true; hullMat.side = THREE.BackSide;
      add(rg, hullMat, 2); add(rg, reliefMat, 3);
    }
    await ctx.yield();

    // ---- ink that stands in the room: the jars' parrot panels, the courtyard plants, the incense
    const STICK_TIPS = [[-42.5, 7.4, 3], [-42, 7.9, 3], [-41.4, 7.3, 3]];
    {
      const wsMat = mat(PAINT_VERT, PAINT_FRAG, { uTime: U.uTime, uViewH: U.uViewH, uRing: HU.uRing, uFace: HU.uFace, uHatch: U.uHatch, uGround: U.uGround, uWall: HU.uWall, uGable: HU.uGable });
      wsMat.vertexColors = true;
      const pieces = [], smoke = [];
      const piece = (ink, fn, into = pieces) => {
        const g = ink.build(), p = g.attributes.position;
        for (let i = 0; i < p.count; i++) { const o = fn(p.getX(i), p.getY(i), p.getZ(i)); p.setXYZ(i, o[0], o[1], o[2]); }
        into.push(g);
      };
      const pk = { W, K, acc: ACC, body: f(5), second: look === 'dusk' ? pal[6] : f(5), third: f(2) };
      for (const j of JARS) {
        const k = j.k, R = 6 * k, th0 = j.sg < 0 ? 0.3 : 0.42;
        const on = (dx, m) => (x, y, z) => { const th = th0 + (dx + m * x) / R, r = R + 0.07 + z; return [j.x + j.sg * r * Math.sin(th), 10.8 * k + y, j.z + j.sg * r * Math.cos(th)]; };
        const a = makeInk(); a.z(0).fill(ell(0, 0, 5.3 * k, 3.3 * k, 28), W).z(0.02).stroke(ell(0, 0, 5.3 * k, 3.3 * k, 28), 0.55 * k, K, true, 2);
        a.z(0.04).disc(0, 0.3 * k, 0.4 * k, ACC, 8).disc(0, -1.5 * k, 0.26 * k, f(2), 7).disc(0, 2.0 * k, 0.26 * k, f(2), 7);
        piece(a, on(0, 1));
        for (const m of [1, -1]) { const b = makeInk(); drawParrot(b, pk, 0.5 * k); piece(b, on(-m * 2.5 * k, m)); }
      }
      // beyond the door: a banana plant and a basil planter, leaves nodding
      {
        const out = (xc) => (x, y, z) => [xc - x, y, 51 - z];
        const b = makeInk();
        b.wave((x, y) => 0.35 * clamp(y / 30, 0, 1) ** 2).z(0.05).stroke([[0, -1], [0.4, 8], [0.2, 16], [0, 22]], 2.2, K, false, 2);
        [-1.25, -0.7, -0.15, 0.4, 0.9, 1.35].forEach((a, i) => {
          const L = 11 + (i & 1) * 2.5, ca = Math.sin(a), sa = Math.cos(a);
          const R = (p) => [p[0] * ca - p[1] * sa, 21.5 + p[0] * sa + p[1] * ca - 0.04 * p[0] * p[0] * Math.abs(ca)];
          b.z(0.06 + i * 0.01).shape(inkLoop([[0, 0], [L * 0.3, 1.9], [L * 0.75, 1.6], [L, 0], [L * 0.7, -1.5], [L * 0.3, -1.8]], 3).map(R), f(5), K, 0.16);
          b.z(0.075 + i * 0.01).stroke([R([0.3, 0]), R([L * 0.5, 0.05]), R([L * 0.95, 0])], 0.13, K);
          for (let q = 1; q < 7; q++) { const x = L * q / 7.5; b.stroke([R([x, 0.05]), R([x + 0.6, 1.2])], 0.07, K).stroke([R([x, 0.05]), R([x + 0.6, -1.1])], 0.07, K); }
        });
        piece(b, out(69.5));
        const t = makeInk();
        t.wave(0).z(0.05).shape([[-3, -1], [3, -1], [3.5, 5], [-3.5, 5]], f(3), K, 0.18);
        for (let q = 0; q < 5; q++) t.z(0.07).shape([[-3 + q * 1.2, 0.4], [-1.8 + q * 1.2, 0.4], [-2.4 + q * 1.2, 2.4]], f(4), K, 0.09);
        t.z(0.07).stroke([[-3.4, 3.6], [3.4, 3.6]], 0.4, K, false, 2);
        t.wave((x, y) => 0.22 * clamp((y - 5) / 9, 0, 1)).z(0.06).stroke([[0, 5], [0.2, 9], [0, 13.5]], 0.2, K);
        for (let q = 0; q < 8; q++) for (const sd of [-1, 1]) {
          const y0 = 6 + q * 0.95, L = 2.6 - q * 0.18;
          t.z(0.07).shape([[0, y0], [sd * L * 0.5, y0 + 0.75], [sd * L, y0 + 0.55], [sd * L * 0.55, y0 - 0.1]], f(5), K, 0.08);
        }
        t.z(0.08).disc(0, 13.9, 0.45, ACC, 8);
        piece(t, out(61));
      }
      add(mergeGeometries(pieces, false), wsMat, 2);
      for (const g of pieces) g.dispose();
      // incense: three curling ribbons (drawn upside down in a flipped mesh so the curl travels upward)
      STICK_TIPS.forEach((tip, i) => {
        const r = makeInk(), pts = [];
        for (let h = 0; h <= 17; h += 0.55) pts.push([0.55 * Math.sin(h * 0.42 + i * 2.1) * (h / 17), h]);
        r.wave((x, y) => 0.1 + 1.25 * (y / 17) ** 1.4).z(0).stroke(pts, 0.4, K, false, 2);
        piece(r, (x, y, z) => [tip[0] + x, -(tip[1] + y), tip[2] + z + i * 0.02], smoke);
      });
      const sm = add(mergeGeometries(smoke, false), wsMat, 3); sm.scale.y = -1;
      for (const g of smoke) g.dispose();
    }
    await ctx.yield();

    // ---- bits: the garland in the doorway and loose petals on the floor
    const bitsU = { uTime: U.uTime, uGust: U.uGust, uViewH: U.uViewH, uInk: U.uInk };
    {
      const P = [], C = [], I = [];
      const ring = (r0, r1, z, col, n = 12) => {
        const b = P.length / 3; P.push(0, 0, z); C.push(col[0], col[1], col[2]);
        for (let i = 0; i < n; i++) { const a = (i / n) * TAU, r = i & 1 ? r1 : r0; P.push(Math.cos(a) * r, Math.sin(a) * r, z); C.push(col[0], col[1], col[2]); }
        for (let i = 0; i < n; i++) I.push(b, b + 1 + i, b + 1 + (i + 1) % n);
      };
      ring(1.14, 0.98, -0.06, [K.r, K.g, K.b]); ring(1.0, 0.82, 0, [-1, 0, 0]); ring(0.46, 0.46, 0.06, [-2, 0, 0], 8);
      const ig = new THREE.InstancedBufferGeometry();
      ig.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); ig.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); ig.setIndex(I);
      const AI = [], AJ = [], C1 = [], C2 = [];
      const push = (a, b, c1, c2) => { AI.push(...a); AJ.push(...b); C1.push(c1.r, c1.g, c1.b); C2.push(c2.r, c2.g, c2.b); };
      const NG = 120;
      for (let sw = 0; sw < 2; sw++) for (let i = 0; i < NG; i++) {
        const t = (i + 0.5) / NG, ph = rng.range(0, TAU);
        const leaf = leafGarland ? (i % 4) !== 0 : false;
        if (leaf) push([t, sw, 2, ph], [0, 0, 0, 0], f(5), f(5));
        else push([t, sw, 0, ph], [0, 0, 0, 0], i & 1 ? f(3) : f(2), i & 1 ? f(2) : ACC);
        if (!leafGarland && i % 6 === 3) push([t, sw, 2, ph + 1], [0, 0, 0, 0], f(5), f(5));
      }
      const NP = Math.round(110 * detail * dens), tints = look === 'line' ? [W] : look === 'dusk' ? [W, pal[2], pal[4]] : [pal[2], W, pal[6]];
      for (let i = 0; i < NP; i++) {
        const near = rng.chance(0.55), x = near ? rng.range(-95, 40) : rng.range(-100, 72), z = near ? rng.range(-6, 30) : rng.range(-38, 38), c = rng.pick(tints);
        push([x, z, rng.range(0.55, 1.05), rng.range(0, TAU)], [1, 0, 0, 0], c, c);
      }
      ig.setAttribute('aI', new THREE.InstancedBufferAttribute(new Float32Array(AI), 4)); ig.setAttribute('aJ', new THREE.InstancedBufferAttribute(new Float32Array(AJ), 4));
      ig.setAttribute('aCol', new THREE.InstancedBufferAttribute(new Float32Array(C1), 3)); ig.setAttribute('aCol2', new THREE.InstancedBufferAttribute(new Float32Array(C2), 3));
      ig.instanceCount = AI.length / 4;
      const bitsMat = mat(BITS_VERT, BITS_FRAG, bitsU); bitsMat.vertexColors = true;
      add(ig, bitsMat, 3);
    }
    await ctx.yield();

    // ---------------------------------------------------------------- animation
    let flowCorr = 0, fanA = 0, fanB = 0, fanC = 0, lampV = look === 'dusk' ? 0 : 9, lastU = 0;
    // the sun look starts with the patch already a wedge on the wall foot, so it reads from the entry
    const p0 = look === 'sun' ? 0.14 : 0, prog = (u) => 0.1 + 0.9 * hero.progressFromU(u) + p0 * (1 - smoothstep(0.26, 0.5, u));
    const wheel0 = HU.uWheel.value;

    function update(dt, time, camera, u) {
      dt = Math.min(Math.max(dt || 0, 0), 0.1);
      if (u < lastU - 0.3) { fanA = 0; fanB = 0; fanC = 0; hero.resetProgress(); if (look === 'dusk') lampV = 0; }
      lastU = u;
      // rare: the wheel slows and stalls (u 0.42 to 0.45), holds, then turns the other way (from u 0.47); the ring's
      // creatures leap and turn over one after another (u 0.46 to 0.57) and the wave runs on down the walls (u 0.51 to 0.64)
      const spin = rare ? 1 - smoothstep(0.42, 0.45, u) - smoothstep(0.47, 0.51, u) : 1;
      hero.setSpin(spin);
      if (rare) hero.setFlip(clamp((u - 0.46) / 0.11, 0, 1));
      hero.setProgress(prog(u));
      hero.update(dt, time, camera);
      U.uPatchZ.value = 6 + hero.patch.footX;
      // the three painted lotuses answer the wheel: the big floor flower turns against it, the small floor round
      // with it, the west medallion against it inside a ring of leaves that goes the other way (all stall and
      // reverse with the wheel on a rare visit)
      const rel = HU.uWheel.value - wheel0;
      U.uFlr.value.set(-rel * 0.9, rel * 1.5 + 0.4, time);
      U.uSpin.value.set(-rel * 1.3, rel * 0.7);
      flowCorr += (rare ? -2 * smoothstep(0.51, 0.62, u) : 0) * dt * 2.6;
      U.uFlow.value = time * 2.6 + flowCorr;
      U.uWaveP.value = rare ? clamp((u - 0.51) / 0.13, 0, 1) : 0;
      fanA = Math.max(fanA, smoothstep(0.085, 0.16, u)); fanB = Math.max(fanB, smoothstep(0.135, 0.195, u)); fanC = Math.max(fanC, smoothstep(0.73, 0.83, u));
      U.uFan.value.set(fanA, fanB, fanC);
      U.uAside.value = smoothstep(0.87, 0.95, u);
      U.uGust.value = 0.5 + 0.5 * Math.sin(time * 0.23);
      if (look === 'dusk') { const want = clamp(prog(u) * 9 + 0.6, 0, 9); lampV = want - lampV > 2.5 ? want : Math.min(want, lampV + dt * 1.1); }
      U.uLamp.value = lampV;
    }

    const hubW = new THREE.Vector3(78.5, 42, 6), tp = new THREE.Vector3(), tq = new THREE.Vector3();
    return {
      scene, path, duration: 46,
      // lingers for the peacocks and through the door's pass, eases at the hub
      pace: (u) => 1.1 - 0.55 * bell(u, 0.15, 0.295, 0.2) - 0.25 * bell(u, 0.58, 0.7, 0.3) - 0.1 * smoothstep(0.7, 0.76, u),
      title: look === 'line' ? 'The Lotus Room, Grey Morning' : look === 'dusk' ? 'The Lotus Room, Blue Dusk' : 'The Lotus Room',
      camera: { fov: 62, near: 0.3, far: 900, lookAhead: 20, sway: 0.6, bank: 0.12 },
      pois: [
        { at: hubW, from: 0.0, to: 0.1, weight: 0.45 },
        { at: (time, u) => { path.pointAt(u, tp); return tq.set(tp.x + 26, 17, 45); }, from: 0.07, to: 0.235, weight: 0.62 },
        // the doorway, then the lower pads of the wheel sliding by on the east wall
        { at: [56, 19, 45], from: 0.165, to: 0.262, weight: 0.8 },
        { at: (time, u) => { path.pointAt(u, tp); const k = smoothstep(0.25, 0.29, u); return tq.set(lerp(56, 79, k), lerp(20, 27, k), lerp(45, Math.min(tp.z - 9, 22), k)); }, from: 0.225, to: 0.31, weight: 0.75 },
        // the first pass of the wheel; then the gaze slides round the corner and along the grove on the north wall
        { at: (time, u) => { path.pointAt(u, tp); const s1 = smoothstep(0.34, 0.4, u), s2 = smoothstep(0.325, 0.36, u); return tq.set(80 - 70 * s1, 28 - 3 * s1, lerp(tp.z - 5, -45, s2)); }, from: 0.275, to: 0.4, weight: 0.7 },
        // level out through the climb so the roof stays a band along the top
        { at: (time, u) => { path.pointAt(u, tq); const y0 = tq.y; path.pointAt(u + 0.04, tp); return tp.setY(Math.min(tp.y, y0) - 6); }, from: 0.335, to: 0.5, weight: 0.5, fade: 0.2 },
        { at: [-80, 14, -22], from: 0.37, to: 0.437, weight: 0.75 },
        { at: hubW, from: 0.43, to: 0.685, weight: 0.9 },
        // the west wall's lotus and its elephant, left of the arch, on the way out
        { at: [-110, 32, 6], from: 0.72, to: 0.9, weight: 0.3 },
      ],
      portal: { shape: 'arch', width: 14, height: 14, color: look === 'dusk' ? '#E27A9A' : look === 'line' ? '#F3EBD9' : '#E9A91C', glow: look === 'line' ? 0.35 : 0.5, revealDistance: 220 },
      post: { flat: 1, exposure: 1, bloom: { strength: 0, radius: 0.5, threshold: 1 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } },
      ride: 'none', style: 'none', companion: 'none',
      update,
      dispose() {},
    };
  },
};
