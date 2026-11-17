// garden-in-plan: "The Garden Drawn from Above". New Kingdom painted sunk relief, flown by papyrus skiff.
// The whole world is fine cream limestone; every figure is a real slab cut a hand's depth into it and filled with one
// of six flat pigments, outlined in red-brown; the only tone is the sun in the walls of the cuts (edgeTone). The
// course: along the Register Cliff (twelve ruled registers finishing themselves 40 m ahead of the prow), round its
// corner to the garden stood up like a page, down over the hinge as the board lies back and its trees rise in rows,
// along the pool among lotus, ducks and tilapia, and up with six ranks of birds through the wreath.
// Everything is shaded with the hero's style routines (src/parts/garden-in-plan.js): STYLE_GLSL / WATER_GLSL /
// slab batches, with exact colour on the engine's flat post (no tone map). No lights, no fog, no bloom.
import * as THREE from 'three';
import { clamp, lerp, smoothstep, bell, makePath } from '../kit/core.js';
import {
  buildHero, PALETTE, OUTLINE, STYLE_GLSL, WATER_GLSL, slabMaterial, stoneMaterial, slabGeo, makeBatch,
  makeAtlas, curve, offsetPoly, ccw, ell, leaf, part,
} from '../parts/garden-in-plan.js';

const TAU = Math.PI * 2, COL = 0.3;

// ---------------------------------------------------------------------------------------------------------------
// the world's own figures, authored like the hero's: closed outlines in metres, painted into an atlas tile
// ---------------------------------------------------------------------------------------------------------------
// a beast in profile facing +x: cattle (lyre horns), donkey (long ears, a sheaf on its back), ibex (swept horns)
function figBeast(A, o) {
  const P = A.tile(300, 250, [-3.7, -2.7, 4.0, 3.9]), pig = o.pig;
  const top = o.load ? [[1.2, 2.15], [0.9, 3.1], [-0.4, 3.55], [-1.7, 3.1], [-2.0, 2.2]] : [[1.2, 2.1], [-1.5, 2.0]];
  const headTop = o.kind === 'ibex' ? [[3.25, 2.3], [2.9, 3.3], [1.9, 3.75], [1.3, 3.3], [2.1, 3.2], [2.5, 2.6]] : o.kind === 'donkey' ? [[3.2, 2.1], [3.0, 3.3], [2.6, 3.35], [2.5, 2.4]] : [[3.25, 2.05], [3.5, 2.95], [2.9, 2.6], [2.5, 3.05], [2.45, 2.3]];
  const body = curve([[-3.3, 1.6], [-3.25, 0.3], [-2.6, -0.3], [1.6, -0.4], [2.2, 0.35], [2.9, 0.8], [3.65, 0.85], [3.75, 1.5], ...headTop, [2.0, 2.2], ...top, [-2.8, 2.15]], 3);
  P.poly(curve([[-3.0, 1.55], [-2.95, 0.35], [-2.4, 0.0], [1.5, -0.1], [2.0, 0.55], [2.8, 1.1], [3.4, 1.12], [3.45, 1.45], [3.0, 1.85], [2.3, 2.0], [1.2, 1.8], [-1.5, 1.72], [-2.6, 1.85]], 3), pig);
  if (o.spots) for (const [x, y, r] of [[-1.9, 1.0, 0.5], [-0.4, 0.6, 0.62], [0.9, 1.15, 0.45], [-1.0, 1.45, 0.3]]) P.flat(ell(x, y, r, r * 0.7, 9, x), 5);
  if (o.belly != null) P.flat(curve([[-2.4, 0.25], [1.3, 0.1], [1.5, 0.5], [-0.5, 0.42]], 3), o.belly);
  if (o.kind === 'ibex') { P.ridge([[2.75, 2.0], [2.6, 3.0], [1.9, 3.45]], 5, 1.5); P.ridge([[3.3, 1.2], [3.2, 0.6]], 5, 0.8); }
  else if (o.kind === 'donkey') { P.poly(leaf(2.75, 2.0, 2.85, 3.1, 0.2, 4), 5, { sketch: false }); P.ridge([[2.2, 2.0], [1.2, 1.9]], 5, 1.2); }
  else { P.ridge([[2.75, 2.1], [2.62, 2.75]], 6, 1.3); P.ridge([[3.1, 2.0], [3.3, 2.7]], 6, 1.3); }
  P.dot(2.95, 1.55, 0.1, 5, false); P.ridge([[-2.95, 1.6], [-3.1, 0.6], [-3.0, 0.0]], 5, 0.8);
  if (o.load) { P.poly(curve([[-1.75, 2.05], [-1.45, 2.95], [-0.4, 3.3], [0.65, 2.95], [0.95, 2.05]], 3), 4); for (let i = -3; i <= 3; i++) P.ridge([[-0.4 + i * 0.32, 2.15], [-0.4 + i * 0.4, 3.1 - Math.abs(i) * 0.07]], 3, 0.55); P.ridge([[-1.6, 2.5], [0.8, 2.5]], 3, 1.1); }
  const leg = (x) => { const f = [[x - 0.26, 0.2], [x + 0.26, 0.2], [x + 0.17, -2.0], [x + 0.36, -2.4], [x - 0.24, -2.4], [x - 0.17, -2.0]]; P.poly(f, pig, { sketch: false }); P.flat([[x - 0.2, -2.12], [x + 0.3, -2.12], [x + 0.33, -2.36], [x - 0.22, -2.36]], 5); return offsetPoly(ccw(f), 0.17); };
  const lp = (x, a) => part(P, leg(x), { thick: 0.3, bevel: 0.09, hinge: [x, 0.1], amp: a, freq: 3.1 });
  return { parts: [part(P, body, { thick: 0.5 }), lp(-2.45, 0.3), lp(-1.75, -0.3), lp(1.0, -0.3), lp(1.7, 0.3)], h: 4, len: 7.4 };
}
// a boat under sail, in profile: crescent hull, mast, a white sail with ochre yards, the steering oar
function figBoat(A) {
  const P = A.tile(330, 290, [-5.6, -1.2, 5.6, 8.6]);
  const out = [[-5.3, 1.9], [-4.4, 0.2], [-3.0, -0.7], [3.0, -0.7], [4.4, 0.2], [5.3, 1.9], [4.4, 1.5], [3.1, 0.75], [3.0, 8.0], [-3.0, 8.0], [-3.1, 0.75], [-4.4, 1.5]];
  P.poly(curve([[-5.0, 1.55], [-4.1, 0.35], [-2.9, -0.4], [2.9, -0.4], [4.1, 0.35], [5.0, 1.55], [3.9, 1.0], [2.6, 0.45], [-2.6, 0.45], [-3.9, 1.0]], 3), 2);
  for (const x of [-3.4, -1.8, 0, 1.8, 3.4]) P.ridge([[x, -0.25 + Math.abs(x) * 0.08], [x, 0.38 + Math.abs(x) * 0.1]], 4, 1.2);
  P.poly([[-2.6, 2.0], [2.6, 2.0], [2.6, 7.4], [-2.6, 7.4]], 6);
  for (const y of [2.0, 7.4]) P.ridge([[-2.75, y], [2.75, y]], 4, 1.6);
  for (let k = 1; k < 5; k++) P.ridge([[-2.5, 2.0 + k * 1.08], [2.5, 2.0 + k * 1.08]], 3, 0.45);
  P.ridge([[0, 0.5], [0, 7.7]], 5, 1.1); P.ridge([[-3.9, 2.6], [-4.6, 0.3]], 5, 0.9); P.poly(leaf(-4.55, 0.5, -4.95, -0.9, 0.24, 4), 3, { sketch: false });
  return { parts: [part(P, out, { thick: 0.5 })], h: 8, len: 10.6 };
}
// a man, 2 m, a flat ochre profile with no features, striding; white kilt
function figMan(A) {
  const P = A.tile(110, 180, [-1.0, -0.1, 1.0, 2.45]);
  const out = curve([[-0.75, 0], [-0.3, 1.0], [-0.62, 1.7], [-0.25, 1.95], [-0.25, 2.3], [0.3, 2.3], [0.32, 1.95], [0.7, 1.65], [0.85, 1.0], [0.5, 1.05], [0.3, 1.0], [0.8, 0], [0.25, 0], [0, 0.6], [-0.3, 0]], 2);
  P.poly([[-0.5, 0.1], [-0.12, 0.95], [-0.42, 1.62], [0.45, 1.62], [0.16, 0.95], [0.55, 0.1], [0.3, 0.1], [0, 0.72], [-0.28, 0.1]], 3, { sketch: false });
  P.poly([[-0.24, 0.72], [-0.1, 1.08], [0.15, 1.08], [0.3, 0.72]], 6, { sketch: false }); P.dot(0.03, 1.95, 0.24, 3); P.flat(ell(-0.05, 2.02, 0.26, 0.16, 8), 5);
  P.ridge([[0.4, 1.55], [0.62, 1.1]], 3, 1.3);
  return { parts: [part(P, out, { thick: 0.3, bevel: 0.08 })], h: 2.3, len: 1.8 };
}
// the white villa of the distance register: cavetto cornice, door, barred windows, two wind-catchers on the roof
function figVilla(A) {
  const P = A.tile(360, 250, [-9.4, -0.3, 9.4, 12.6]);
  const out = [[-8.6, 0], [8.6, 0], [8.2, 8.6], [8.9, 9.4], [8.9, 10.0], [5.6, 10.0], [5.6, 12.2], [3.2, 11.2], [3.2, 10.0], [-2.2, 10.0], [-2.2, 12.2], [-4.6, 11.2], [-4.6, 10.0], [-8.9, 10.0], [-8.9, 9.4], [-8.2, 8.6]];
  P.poly([[-8.2, 0.3], [8.2, 0.3], [7.85, 8.5], [-7.85, 8.5]], 6);
  for (let i = 0; i < 16; i++) P.flat([[-8.4 + i * 1.05, 8.75], [-7.95 + i * 1.05, 8.75], [-7.95 + i * 1.05, 9.65], [-8.4 + i * 1.05, 9.65]], [1, 3, 2][i % 3]);
  P.ridge([[-8.5, 8.65], [8.5, 8.65]], -1, 1); P.ridge([[-8.6, 9.72], [8.6, 9.72]], -1, 1);
  P.poly([[-1.3, 0.3], [1.3, 0.3], [1.3, 5.2], [-1.3, 5.2]], 3); P.ridge([[0, 0.5], [0, 5.0]], 5, 0.7); P.poly([[-1.7, 5.2], [1.7, 5.2], [1.7, 5.9], [-1.7, 5.9]], 4, { sketch: false });
  for (const x of [-5.4, 5.4]) { P.poly([[x - 1.2, 4.6], [x + 1.2, 4.6], [x + 1.2, 6.8], [x - 1.2, 6.8]], 5, { sketch: false }); for (let k = -1; k <= 1; k++) P.ridge([[x + k * 0.6, 4.7], [x + k * 0.6, 6.7]], 6, 0.8); }
  for (const x of [-3.4, 4.4]) P.poly([[x - 0.9, 10.1], [x + 0.9, 10.1], [x + 0.9, 11.0], [x - 0.9, 11.75]], 3, { sketch: false });
  return { parts: [part(P, out, { thick: 0.6 })], h: 12.2, len: 18 };
}
// a desert hill of the top register: yellow ochre, strata in red, pebble dots
function figHill(A, rng) {
  const P = A.tile(430, 150, [-31, -0.5, 31, 15.5]);
  const out = curve([[-30, 0], [-22, 5.2], [-13, 8.3], [-6, 13.6], [1, 11.2], [9, 14.6], [17, 7.4], [24, 5.6], [30, 0]], 4);
  P.poly(curve([[-28.6, 0.4], [-21.5, 4.6], [-12.6, 7.6], [-6, 12.8], [1, 10.4], [9, 13.8], [16.4, 6.8], [23.6, 5.0], [28.6, 0.4]], 4), 4);
  for (let k = 0; k < 3; k++) P.ridge(curve([[-24 + k * 3, 1.2 + k * 2.2], [-12, 3.4 + k * 2.3], [-5, 6.2 + k * 2.2], [3, 4.6 + k * 2.2], [10, 6.8 + k * 2.2], [20 - k * 3.5, 1.6 + k * 1.6]], 3).slice(0, 16), 3, 0.9);
  for (let i = 0; i < 26; i++) { const x = -22 + rng() * 44, y = 0.8 + rng() * 3.2; P.dot(x, y, 0.32, i % 3 ? 3 : 5, false); }
  return { parts: [part(P, out, { thick: 0.6 })], h: 14.6, len: 60 };
}
// the skiff's bow deck drawn in plan (y runs forward): green papyrus bundles, ochre lashings, a coil of rope
function figDeck(A) {
  const P = A.tile(190, 640, [-1.8, -4.6, 1.8, 7.9]);
  const out = curve([[0, 7.6], [0.42, 6.6], [0.9, 5.0], [1.3, 2.4], [1.42, -0.8], [1.2, -4.3], [-1.2, -4.3], [-1.42, -0.8], [-1.3, 2.4], [-0.9, 5.0], [-0.42, 6.6]], 3);
  P.poly(curve([[0, 7.15], [0.3, 6.4], [0.68, 4.9], [1.04, 2.4], [1.14, -0.8], [0.95, -4.0], [-0.95, -4.0], [-1.14, -0.8], [-1.04, 2.4], [-0.68, 4.9], [-0.3, 6.4]], 3), 2);
  for (const x of [-0.55, 0, 0.55]) P.ridge([[x, -3.8], [x * 0.95, 2.2], [x * 0.55, 5.0], [x * 0.2, 6.5]], 5, 0.5);
  for (let y = -3.4; y < 6.9; y += 1.02) { const w = y < 2.4 ? 1.08 : Math.max(0.2, 1.06 - (y - 2.4) * 0.19); P.poly([[-w, y], [w, y], [w, y + 0.26], [-w, y + 0.26]], 4, { sketch: false }); P.ridge([[-w, y + 0.13], [w, y + 0.13]], 3, 0.5); }
  P.dot(0, 4.75, 0.52, 6); P.ridge(ell(0, 4.75, 0.36, 0.36, 14), 3, 0.9, true); P.ridge(ell(0, 4.75, 0.17, 0.17, 10), 3, 0.9, true); P.ridge([[0.3, 5.0], [0.42, 5.7], [0.16, 6.3]], 6, 1.2);
  return { parts: [part(P, out, { thick: 0.45, bevel: 0.16 })], h: 12 };
}
// the upturned prow, seen from astern: a bound stem ending in a papyrus umbel, green bell and red-ochre fringe
function figProw(A) {
  const P = A.tile(220, 300, [-1.25, -0.2, 1.25, 3.2]);
  const out = curve([[0.3, 0], [0.28, 1.0], [0.5, 1.55], [1.02, 2.3], [1.1, 2.72], [0.55, 2.98], [0, 3.05], [-0.55, 2.98], [-1.1, 2.72], [-1.02, 2.3], [-0.5, 1.55], [-0.28, 1.0], [-0.3, 0]], 3);
  P.poly([[-0.15, 0.1], [0.15, 0.1], [0.14, 1.3], [-0.14, 1.3]], 2, { sketch: false });
  P.poly(curve([[0.14, 1.15], [0.36, 1.65], [0.84, 2.32], [0.9, 2.6], [0.45, 2.78], [0, 2.84], [-0.45, 2.78], [-0.9, 2.6], [-0.84, 2.32], [-0.36, 1.65], [-0.14, 1.15]], 3), 2);
  for (let i = -4; i <= 4; i++) { const a = i * 0.1; P.ridge([[Math.sin(a) * 0.9, 1.45 + Math.abs(i) * 0.05], [Math.sin(a) * 2.0, 0.95 + Math.cos(a) * 1.75]], 5, 0.5); }
  for (let i = -5; i <= 5; i++) { const x = i * 0.165, y = 2.78 - i * i * 0.008; P.poly(leaf(x, y, x * 1.08, y + 0.3, 0.07, 3), 3, { sketch: false, line: false }); }
  for (const y of [0.25, 0.6, 0.95]) P.poly([[-0.17, y], [0.17, y], [0.17, y + 0.15], [-0.17, y + 0.15]], 4, { sketch: false });
  return { parts: [part(P, out, { thick: 0.35, bevel: 0.1 })], h: 3 };
}
// the shaduf: a whitewashed pier with a forked top, and the beam (pivot at y 7.6) with its mud counterweight and bucket
function figShaduf(A) {
  const P = A.tile(440, 300, [-7.8, -0.2, 7.8, 10.4]), py = 7.6;
  const post = [[-1.0, 0], [1.0, 0], [0.62, 6.6], [0.75, 8.4], [0.35, 8.4], [0.25, 7.2], [-0.25, 7.2], [-0.35, 8.4], [-0.75, 8.4], [-0.62, 6.6]];
  P.poly([[-0.72, 0.25], [0.72, 0.25], [0.4, 6.5], [-0.4, 6.5]], 6); for (const y of [1.2, 3.4, 5.6]) P.ridge([[-0.6 + y * 0.04, y], [0.6 - y * 0.04, y]], 3, 0.9);
  const beam = [[-7.3, py + 1.0], [-5.2, py + 0.5], [7.1, py + 0.34], [7.45, py - 0.1], [7.45, py - 5.1], [5.95, py - 5.1], [5.95, py - 0.42], [-5.2, py - 0.5], [-7.3, py - 1.0], [-7.6, py]];
  P.poly([[-5.4, py - 0.16], [6.9, py - 0.1], [6.9, py + 0.1], [-5.4, py + 0.16]], 3, { sketch: false });
  P.poly(ell(-6.35, py, 0.95, 0.72, 12), 5); P.ridge([[6.7, py - 0.1], [6.7, py - 3.5]], 5, 0.7);
  P.poly([[6.2, py - 3.5], [7.2, py - 3.5], [7.0, py - 4.8], [6.4, py - 4.8]], 3); P.ridge([[6.25, py - 3.9], [7.15, py - 3.9]], 4, 0.8);
  return { parts: [part(P, post, { thick: 0.5 }), part(P, beam, { thick: 0.75, bevel: 0.12, hinge: [0, py], amp: 0.26, freq: 0.9 })], h: 9 };
}
// the villa's garden wall: gypsum white, a red coping line, buttress lines; one slot of the palm band long
function figWall(A) {
  const P = A.tile(300, 84, [-7.5, -0.3, 7.5, 3.9]);
  const out = [[-7.28, 0], [7.28, 0], [7.28, 3.4], [-7.28, 3.4]];
  P.poly([[-7.02, 0.25], [7.02, 0.25], [7.02, 3.14], [-7.02, 3.14]], 6);
  P.flat([[-7.02, 2.62], [7.02, 2.62], [7.02, 3.02], [-7.02, 3.02]], 3);
  for (let x = -5.6; x < 6; x += 2.8) P.ridge([[x, 0.4], [x, 2.5]], 3, 0.6);
  for (let x = -6.3; x < 6.5; x += 1.4) P.flat([[x - 0.22, 1.5], [x + 0.22, 1.5], [x, 2.1]], 5);       // the vents under the coping
  return { parts: [part(P, out, { thick: 0.5 })], h: 3.4, len: 14.56 };
}
// the door inside the wreath: a hoop of bound papyrus (two jambs that meet over the opening) and a white threshold.
// The opening itself is the portal, round like the wreath it hangs in, and it has all of the round that a frame can
// leave it: 12.4 m across, inside a hoop 0.8 m broad (a bundle 0.6 m thick in its stone collar) that still
// shows its ties. The round itself cannot grow past 7 m: the door lies in the portal's plane, tilted to the course,
// which crosses the wreath's own plane along the level diameter, and there the wreath's cord (inner edge 7.68 m)
// sways half a metre.
const DOOR = { r: 6.2, R: 7 };
function figDoor(A) {
  const P = A.tile(250, 420, [-0.3, -7.4, 7.4, 7.4]), { r, R } = DOOR, D2R = Math.PI / 180, g = 0.1, rm = (r + R) / 2, aS = -48;
  const arc = (rad, a0, a1, n) => { const o = []; for (let i = 0; i <= n; i++) { const a = (a0 + (a1 - a0) * i / n) * D2R; o.push([Math.cos(a) * rad, Math.sin(a) * rad]); } return o; };
  // a length of the round from a0 to a1 (degrees: 0 at the right, 90 over the opening), drawn in by gi metres and by g0 and g1 degrees at its ends
  const band = (a0, a1, gi = 0, g0 = 0, g1 = 0, n = 26) => [...arc(R - gi, a0 + g0, a1 - g1, n), ...arc(r + gi, a1 - g1, a0 + g0, n)];
  P.poly(band(aS, 90, g, 1.4, 0.3), 2);
  P.ridge(arc(rm, aS + 3, 88, 30), 5, 0.6);
  for (let th = -40; th <= 70; th += 18) P.poly(band(th - 2.2, th + 2.2, g + 0.03, 0, 0, 2), 4, { sketch: false });      // the ties
  P.poly(band(85.2, 89.6, g + 0.03, 0, 0, 2), 3, { sketch: false });                 // the red tie where the bundles meet
  P.poly(band(-90, aS, g, 0, 1.4, 10), 6); P.ridge(arc(rm, -90, aS - 4, 10), 3, 1.2);      // the threshold: the foot of the round, white
  return { parts: [part(P, band(aS, 90), { thick: 0.6, bevel: 0.07 }), part(P, band(-90, aS, 0, 0, 0, 10), { thick: 0.6, bevel: 0.07 })], h: 14 };
}
/** put a figure into a batch: an = [mode, trigger, extra]; o: s, mir, rot, ph, only (indices of the parts wanted) */
function put(batch, fig, at, yaw, an, o = {}) {
  const ph = o.ph ?? 0, s = o.s ?? 1;
  fig.parts.forEach((p, i) => { if (o.only && !o.only.includes(i)) return; batch.add(p.geo, at, yaw, [an[0], an[1], ph, an[2] ?? 0], [p.hinge[0], p.hinge[1], o.still ? 0 : p.amp, p.freq], s, !!o.mir, o.rot ?? 0); });
}

const HOURS = [
  { name: 'morning', pal: PALETTE, line: OUTLINE, sun: [0.8, 0.29, 0.53], rim: [1.27, 1.27, 1.27], shade: '#8fa3c4' },
  { name: 'golden', pal: PALETTE, line: OUTLINE, sun: [-0.72, 0.22, 0.66], rim: [1.34, 1.15, 0.82], shade: '#b08ad8' },
  { name: 'moon', pal: ['#C3C8CE', '#3466AC', '#2F6A52', '#84503C', '#A48D5C', '#17181C', '#F2F4F6'], line: '#4A3B3C', sun: [0.62, 0.42, 0.66], rim: [1.3, 1.34, 1.4], shade: '#7f97d6' },
];

export default {
  id: 'garden-in-plan',
  name: 'The Garden Drawn from Above',
  category: 'domestic',
  weirdness: 0.5,
  media: ['air', 'water', 'tiny'],
  async build(ctx) {
    const rng = ctx.rng, vary = ctx.vary || {}, detail = clamp(ctx.quality?.detail ?? 1, 0.6, 1), dens = clamp(vary.density ?? 1, 0.7, 1.3);
    const scene = new THREE.Scene();

    // ---- the edition: hour, season, finish (seeded), and the rare unfinished wall ----
    const vr = rng.fork('edition'), hr = vr(), sr = vr(), fr = vr();
    const hour = HOURS[vary.hour === 'golden' ? 1 : vary.hour === 'night' ? 2 : (vary.hour === 'dawn' || vary.hour === 'day') ? 0 : hr < 0.52 ? 0 : hr < 0.86 ? 1 : 2];
    const season = sr < 0.53 ? 0 : sr < 0.78 ? 1 : 2;            // 0 high pool, 1 inundation, 2 low water
    const weathered = fr > 0.8, rare = !!vary.rare;
    const pal = hour.pal, sunW = new THREE.Vector3(...hour.sun).normalize();
    scene.background = new THREE.Color(pal[0]);

    // ---- the hero: the pool and the thicket (hero-local space = world space; the board turns about z = +210) ----
    const hero = await buildHero(ctx, { palette: pal, outline: hour.line, detail, weather: weathered ? 0.62 : 0.03 + 0.08 * fr, season });
    hero.uniforms.uRise.value.y = 0.5; hero.uniforms.uFrontMin.value = 2.5; hero.uniforms.uFrontX.value = 0.2;
                    // trees, lotus and ducks are fully up at half their trigger distance
    scene.add(hero.object); hero.setSun(sunW);
    const U = hero.uniforms, A = hero.anchors, F = hero.figures;
    U.uRimC.value.set(...hour.rim); U.uShadeC.value.set(hour.shade);
    await ctx.yield();

    // ---- the course: along the cliff, round its corner, over the hinge, down the pool's axis, up through the wreath ----
    const H0 = new THREE.Vector3(0.5, 0, -0.8660254), LFT = new THREE.Vector3(-0.8660254, 0, -0.5);
    const CORNER = new THREE.Vector3(0, 40, 292), P0 = CORNER.clone().addScaledVector(H0, -86);
    const pts = [];
    for (const a of [0, 20, 40, 60] ) pts.push(P0.clone().addScaledVector(H0, a).toArray());
    pts.push([-6.2, 40, 300], [-1.2, 40, 282], [0, 39.8, 262], [0, 39, 236], [0, 38, 210], [0, 29, 181], [0, 20, 152], [0, 11, 123], [0, 5.2, 104], [0, 2.7, 91], [0, 2.2, 76], [0, 2.2, 40], [0, 2.2, -10], [0, 2.2, -60]);
    for (const p of A.flyThrough.slice(5)) pts.push(p);
    const path = makePath(pts);
    const LEN = path.length;
    const tiltAt = (z) => (Math.PI / 6) * (1 - smoothstep(0, 100, 210 - z));          // the board lies down as we cross it
    // the finishing front in the garden (local z of the line where colour is complete); on a rare visit it stops halfway.
    // From the arrival it LEADS THE EYE BY A SET LENGTH: it stands FRONT_LEAD metres down the board from the eye's own
    // place on the course (the course's z; the board's long axis is z). The length is the board's own, from its hinge
    // (z 210) to the far end of the pool (z -120): so the pool still without colour is at every moment as long as our
    // way to the hinge is, and it is always the pool's FAR end, a band under the thicket that narrows as we come (the
    // page has "the far end still only red grid and black outline"), never a field of bare outline across the middle
    // of the plan; the last of the pool takes its colour as we cross the hinge and the page lies down. The colour is
    // seen to arrive the whole way, at our own speed.
    // Past the pool the table takes the front on wherever it leads further (keyed to u: up the fan ahead of the prow).
    const FRONT_LEAD = 210 + 120;
    const FKEY = [[0.38, -120], [0.44, -200], [0.5, -290], [0.56, -420]];
    const _fz = new THREE.Vector3();
    const frontAt = (u) => {
      let f = path.pointAt(u, _fz).z - FRONT_LEAD;
      if (u >= FKEY[0][0]) {
        let k = FKEY[FKEY.length - 1][1];
        for (let i = 1; i < FKEY.length; i++) if (u < FKEY[i][0]) { const a = FKEY[i - 1], b = FKEY[i]; k = lerp(a[1], b[1], (u - a[0]) / (b[0] - a[0])); break; }
        f = Math.min(f, k);
      }
      return rare ? Math.max(f, 12) : f;
    };
    const uOfZ = (z) => { let best = 0.5, bd = 1e9; const v = new THREE.Vector3(); for (let i = 60; i <= 400; i++) { path.pointAt(i / 400, v); const d = Math.abs(v.z - z) + Math.abs(v.x) * 4; if (d < bd) { bd = d; best = i / 400; } } return best; };
    const U_WATER = uOfZ(84); await ctx.yield(); const U_LIFT = uOfZ(-96); await ctx.yield(); const U_BIRDS = uOfZ(44);
    await ctx.yield();

    // one uniform set per drawing space, all sharing the pigments, the line, the clock and the weather by reference
    const CLIFF_B = 9, CLIFF_LEAD = 64, CLIFF_LEAN = 0.5;      // the cliff's finishing front: metres per band, lead at the foot, lean back with height
    const mkSet = (extra = {}) => ({
      ...U, uSunL: { value: sunW.clone() }, uFront: { value: new THREE.Vector4(0, 0, 1, 1e4) }, uFrontW: { value: 130 }, uFrontX: { value: 0 }, uFrontMin: { value: 0 },
      uCamL: { value: new THREE.Vector3() }, uEyeL: { value: new THREE.Vector3() }, uRise: { value: new THREE.Vector4(-1, 0.25, 0, 280) }, ...extra,
    });

    // ---- the world's own atlas ----
    const WA = makeAtlas(1536, pal, hour.line), W = {}; await ctx.yield();
    W.ox = figBeast(WA, { pig: 3, kind: 'ox', belly: 6 }); await ctx.yield(); W.cow = figBeast(WA, { pig: 6, kind: 'ox', spots: true }); await ctx.yield();
    W.donkey = figBeast(WA, { pig: 6, kind: 'donkey', load: true }); await ctx.yield(); W.ibex = figBeast(WA, { pig: 4, kind: 'ibex', belly: 6 }); await ctx.yield();
    W.boat = figBoat(WA); await ctx.yield(); W.man = figMan(WA); W.villa = figVilla(WA); await ctx.yield(); W.hill = figHill(WA, rng.fork('hill')); await ctx.yield();
    W.deck = figDeck(WA); await ctx.yield(); W.prow = figProw(WA); W.shaduf = figShaduf(WA); await ctx.yield();
    W.wall = figWall(WA); W.door = figDoor(WA); await ctx.yield();
    const [wC, wD] = WA.finish(ctx.renderer);
    const own = (set) => ({ ...set, uAtlasC: { value: wC }, uAtlasD: { value: wD } });

    // ---- the sky: the wall that has not been carved yet. A stone drum fixed in the world (it is the still reference
    // while the board lies down): chisel strokes at sky scale, two ruled baselines for the registers of distance on
    // the far arc, and the draughtsman's red grid still showing in its upper reaches and on the ceiling ----
    const SKY_R = 540, SKY_C = [0, 30], SKY_H = 640, YB1 = 40, YB2 = 150, YB3 = 204, YB4 = 345;
    const SKY_FS = /* glsl */`
      ${STYLE_GLSL}
      uniform vec4 uSky;                      // centre x, z, baseline 1, baseline 2
      uniform vec2 uSky3;                     // baselines 3 and 4
      varying vec3 vG, vN;
      void main(){
        vec3 fw = fwidth(vG); float px = max(max(length(fw.xz), fw.y)*0.75, 1e-4);
        vec2 d = vG.xz - uSky.xy; float wall = step(abs(vN.y), 0.5);
        float ang = atan(d.x, -d.y + 1e-4);
        vec2 p = mix(vG.xz, vec2(ang*${SKY_R.toFixed(1)}, vG.y), wall);
        vec3 col = stoneAt(p*0.04 + 7., px*0.04)*(1. + 0.03*(vnoise(p*0.012) - 0.5));
        float lw = max(0.5, 0.9*px), far = wall*(1. - smoothstep(2.2, 2.35, abs(ang)));
        float b1 = min(abs(vG.y - uSky.z), abs(vG.y - uSky.z + 3.2)), b2 = min(abs(vG.y - uSky.w), abs(vG.y - uSky.w + 3.2));
        float b3 = min(min(abs(vG.y - uSky3.x), abs(vG.y - uSky3.x + 3.2)), min(abs(vG.y - uSky3.y), abs(vG.y - uSky3.y + 3.2)));
        col = mix(col, uLineC, (1. - smoothstep(lw, lw + px, min(min(b1, b2), b3)))*far*0.9);
        float up = mix(1., smoothstep(418., 500., vG.y), wall);
        col = mix(col, uPig[3], gridAt(p*0.25, px*0.25, 1.)*0.3*up);
        gl_FragColor = vec4(edgeTone(col, 0.), 1.);
      }`;
    const skyMat = stoneMaterial(U, { uSky: { value: new THREE.Vector4(SKY_C[0], SKY_C[1], YB1, YB2) }, uSky3: { value: new THREE.Vector2(YB3, YB4) } }, SKY_FS);
    skyMat.side = THREE.DoubleSide;
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(SKY_R, SKY_R, SKY_H, 96, 1, true).translate(SKY_C[0], SKY_H / 2 - 20, SKY_C[1]), skyMat);
    const lid = new THREE.Mesh(new THREE.CircleGeometry(SKY_R + 2, 64).rotateX(Math.PI / 2).translate(SKY_C[0], SKY_H - 20, SKY_C[1]), skyMat);
    drum.frustumCulled = lid.frustumCulled = false; scene.add(drum, lid);

    // ---- the ground: the workshop floor. Stone, the red grid, and the canal that runs out from the cliff's foot
    // to the hinge of the board, with its coping and block border; it is finished by the same front as the cliff ----
    const UG = mkSet();                                   // world space, the cliff's front
    UG.uFrontW.value = CLIFF_B;
    const GROUND_FS = /* glsl */`
      ${STYLE_GLSL}
      ${WATER_GLSL}
      uniform vec4 uLeg;                      // P0.xz, H0.xz
      uniform vec4 uWallG;                    // the cliff's corner (xz) and the direction of its face (xz)
      uniform vec3 uEyeL;
      varying vec3 vG, vN;
      vec3 segD(vec2 p, vec2 a, vec2 b){ vec2 ab = b - a; float t = clamp(dot(p - a, ab)/max(dot(ab, ab), 1e-4), 0., 1.); vec2 c = a + ab*t; return vec3(length(p - c), p - c); }
      void main(){
        vec2 p = vG.xz; vec2 fw = fwidth(p); float px = max(max(fw.x, fw.y)*0.75, 1e-4);
        float st = stageAt(vG), cut = smoothstep(2.5, 3.5, st), ink = smoothstep(1.9, 2.5, st);
        vec3 stone = stoneAt(p, px), col = stone; float e = 0.;
        vec2 sun2 = uSunL.xz/max(length(uSunL.xz), 1e-3);
        vec3 d1 = segD(p, uLeg.xy - uLeg.zw*60., uLeg.xy + uLeg.zw*66.), d2 = segD(p, uLeg.xy + uLeg.zw*66., vec2(0., 292.)), d3 = segD(p, vec2(0., 292.), vec2(0., 212.));
        vec3 dm = d1.x < d2.x ? d1 : d2; dm = dm.x < d3.x ? dm : d3;
        float d = dm.x - 14.4; vec2 g = dm.yz/max(dm.x, 1e-3);
        // the water lies against the foot of the cliff: everything between its face and the course is canal
        vec2 wn = vec2(-uWallG.w, uWallG.z), pc = p - uWallG.xy; float wf = dot(pc, wn), wx = dot(pc, uWallG.zw);
        float dW = max(max(-wf, wx), max(-wx - 136., -dot(p - uLeg.xy, vec2(uLeg.w, -uLeg.z)))), byWall = step(dW, d);
        d = min(d, dW);
        float along = dot(p - uLeg.xy, uLeg.zw);
        float lw = max(0.09, 0.8*px), lk = min(0.09/lw + 0.15, 1.);
        if (d < 0.) {
          float zc; gZig = 1.3*(1. - smoothstep(3.6, 4.0, st));
          vec4 w = waterAt(p, px, sun2, smoothstep(300., 400., distance(vG, uEyeL))*smoothstep(3.6, 4.0, st), zc);
          float pnt = paintAt(p*0.5, st, px);
          col = mix(mix(stone*(1. - 0.04*cut), mix(uPig[5], uPig[3], gLost), ink*zc*mix(0.85, 0.42, gLost)), w.rgb, pnt);
          e = w.a*cut*step(0.5, pnt + 0.5*cut);
          float wl = (1. - smoothstep(1.2, 1.2 + px, -d))*dot(-g, sun2)*2.2*(1. - byWall); e = abs(wl) > 0.05 ? min(clamp(wl, -1., 1.), 0.) : e;
        } else {
          float v = d - 4.6, cell = floor(along/3.2), f = (fract(along/3.2) - 0.5)*3.2;
          float inBand = step(abs(v), 1.9), small = smoothstep(0.5, 1.6, px);
          float inB = step(abs(f), 1.25)*step(abs(v), 1.25)*(1. - small);
          float k = mod(cell, 4.);
          vec3 pg = k < 0.5 ? uPig[1] : k < 1.5 ? uPig[3] : k < 2.5 ? uPig[2] : uPig[4];
          vec3 bandC = mix(mix(uPig[6], pg, inB), mix(uPig[6], (uPig[1] + uPig[3] + uPig[2] + uPig[4])*0.25, 0.5), small);
          col = mix(col, bandC, inBand*paintAt(p*0.5 + 9., st, px)); gChipE *= inBand; gChipS *= inBand;
          float bl = max(1. - smoothstep(lw, lw + px, abs(abs(v) - 1.9)), inB > 0.5 ? 1. - smoothstep(lw, lw + px, min(1.25 - abs(f), 1.25 - abs(v))) : 0.);
          float cop = 1. - smoothstep(lw, lw + px, abs(d - 1.1));
          col = mix(col, mix(uPig[5], uLineC, smoothstep(3.6, 4.4, st)), max(bl*step(abs(v), 2.1), cop)*lk*ink);
          vec2 bq = vec2(f, v), dd = vec2(1.25) - abs(bq), bb = (1. - smoothstep(0.22, 0.22 + px, dd))*inB;
          e = clamp(-sign(v)*dot(g, sun2)*bb.y*2.2, -1., 1.)*cut;
        }
        col = mix(col, uPig[3], gridAt(p, px, st - 1.)*0.6*(1. - smoothstep(3.6, 4.6, st)*step(d, 7.)));
        gl_FragColor = vec4(edgeTone(col, e), 1.);
      }`;
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(1300, 1300, 1, 1).rotateX(-Math.PI / 2).translate(0, -2.4, 30),
      stoneMaterial(UG, { uLeg: { value: new THREE.Vector4(P0.x, P0.z, H0.x, H0.z) }, uWallG: { value: new THREE.Vector4() } }, GROUND_FS));
    ground.frustumCulled = false; scene.add(ground);
    await ctx.yield();

    // ---- the Register Cliff: twelve registers 8 m tall on ruled baselines, its foot register a band of water.
    // Cliff space: x along the course, y up, z out of the face toward the skiff (12 m off). The front that finishes
    // it travels ahead of the prow and leans back, so colour rises from the water register by register ----
    // It stands 13 m off the course at its corner (the wall is the thing we pass close) and runs back at 8.6 degrees
    // to it (23 m off where we enter), so the registers are read square-on at the start.
    const CLIFF_D = 13, CLIFF_A = 0.15, cliff = new THREE.Group();
    const cornerW = P0.clone().addScaledVector(H0, 66).addScaledVector(LFT, CLIFF_D).setY(0);
    cliff.rotation.y = Math.PI / 3 - CLIFF_A; cliff.position.copy(cornerW).sub(new THREE.Vector3(66, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), cliff.rotation.y));
    scene.add(cliff); cliff.updateMatrixWorld(true);
    { const wd = new THREE.Vector3(1, 0, 0).applyQuaternion(cliff.quaternion); ground.material.uniforms.uWallG.value.set(cornerW.x, cornerW.z, wd.x, wd.z); }
    const UC = mkSet(); UC.uFrontW.value = CLIFF_B;
    const CX0 = -70, CX1 = 66, CH = 100;
    const CLIFF_FS = /* glsl */`
      ${STYLE_GLSL}
      ${WATER_GLSL}
      varying vec3 vG, vN;
      // the block border that closes the wall's end is the cornice's border cut at half its size: 1.9 m across with
      // its two white bars, less than the smallest figure of the registers is tall (a man, 2.2 m). We pass it close,
      // so beside any figure it is the painted wall's own edge and never a bar of blocks across the picture.
      const float EB = 0.5;
      void main(){
        vec2 p = vG.xy; vec2 fw = fwidth(p); float px = max(max(fw.x, fw.y)*0.75, 1e-4);
        float st = stageAt(vG), cut = smoothstep(2.5, 3.5, st), ink = smoothstep(1.9, 2.5, st);
        vec3 stone = stoneAt(p*vec2(1., 0.93) + 31., px), col = stone; float e = 0.;
        vec2 s2 = uSunL.xy/max(length(uSunL.xy), 1e-3);
        float lw = max(0.09, 0.8*px), lk = min(0.09/lw + 0.15, 1.);
        if (abs(vN.z) < 0.5) { e = clamp(dot(vN, uSunL)*1.7, -1., 1.); }
        else if (p.y < 7.4 || vG.z > 0.3) {                        // the foot register, and the ford of register 4: water
          float zc; gZig = 1.3*(1. - smoothstep(3.6, 4.0, st)); vec4 w = waterAt(p, px, s2, 0., zc); float pnt = paintAt(p*0.5, st, px);
          col = mix(mix(stone*(1. - 0.04*cut), mix(uPig[5], uPig[3], gLost), ink*zc*mix(0.85, 0.42, gLost)), w.rgb, pnt); e = w.a*cut*step(0.5, pnt + 0.5*cut);
          float top = (1. - smoothstep(0.5, 0.5 + px, 7.4 - p.y))*step(vG.z, 0.3); e = top > 0.05 ? -top*max(s2.y, 0.3)*cut : e;
        } else if (p.y < 96. && p.x < 66. - 3.8*EB) {
          float k = floor(p.y/8.), v = p.y - k*8.;                 // the ruled baseline: a sunk band of pigment under each register
          float kk = mod(k, 3.); vec3 pg = kk < 0.5 ? uPig[2] : kk < 1.5 ? uPig[3] : uPig[1];
          float inB = step(abs(v - 0.05), 0.33)*step(7.5, p.y);
          col = mix(col, pg, inB*paintAt(p*0.5 + 3., st, px)); gChipE *= inB; gChipS *= inB;
          float bl = 1. - smoothstep(lw, lw + px, min(abs(v - 0.38), min(abs(v + 0.28), abs(v - 7.72))));
          col = mix(col, mix(uPig[5], uLineC, smoothstep(3.6, 4.4, st)), bl*lk*ink*step(7.5, p.y));
          float hw = 0.14 + px*0.5;
          e = ((1. - smoothstep(hw, hw + px, abs(v + 0.2))) - (1. - smoothstep(hw, hw + px, abs(v - 0.3))))*s2.y*1.6*cut*inB;
        } else {                       // the cornice: blocks of the four colours between white bars; the same border closes the wall's end
          // (the end's border is the cornice's cut at EB of its size: q, qw and qx are a metre, a line and a pixel in its own measure)
          float eb = step(p.y, 96.), q = mix(1., EB, eb), al = mix(p.x, p.y, eb)/q, qx = px/q, qw = lw/q;
          float v = mix(p.y - 98., p.x - (66. - 1.9*EB), eb)/q, f = (fract(al/3.2) - 0.5)*3.2, k = mod(floor(al/3.2), 4.), small = smoothstep(0.5, 1.6, qx);
          float inB = step(abs(f), 1.25)*step(abs(v), 1.25)*(1. - small);
          vec3 pg = k < 0.5 ? uPig[1] : k < 1.5 ? uPig[3] : k < 2.5 ? uPig[2] : uPig[4];
          vec3 bandC = mix(mix(uPig[6], pg, inB), mix(uPig[6], (uPig[1] + uPig[3] + uPig[2] + uPig[4])*0.25, 0.5), small);
          col = mix(col, bandC, step(abs(v), 1.9)*paintAt(p*0.5 + 9., st, px)); gChipE *= step(abs(v), 1.9); gChipS *= step(abs(v), 1.9);
          float bl = max(1. - smoothstep(qw, qw + qx, abs(abs(v) - 1.9)), inB > 0.5 ? 1. - smoothstep(qw, qw + qx, min(1.25 - abs(f), 1.25 - abs(v))) : 0.);
          col = mix(col, mix(uPig[5], uLineC, smoothstep(3.6, 4.4, st)), bl*lk*ink);
          vec2 dd = vec2(1.25) - abs(vec2(f, v)), bb = (1. - smoothstep(0.22/q, 0.22/q + qx, dd))*inB;
          e = clamp((-sign(mix(f, v, eb))*s2.x*mix(bb.x, bb.y, eb) - sign(mix(v, f, eb))*s2.y*mix(bb.y, bb.x, eb))*2.2, -1., 1.)*cut;
        }
        col = mix(col, uPig[3], gridAt(p, px, st - 1.)*0.6*(1. - smoothstep(3.6, 4.6, st)));
        gl_FragColor = vec4(edgeTone(col, e), 1.);
      }`;
    {
      const pos = [], nrm = [], idx = [];
      const quad = (q, n) => { const k = pos.length / 3; for (const v of q) { pos.push(...v); nrm.push(...n); } idx.push(k, k + 1, k + 2, k, k + 2, k + 3); };
      quad([[CX0, 0, 0], [CX1, 0, 0], [CX1, CH, 0], [CX0, CH, 0]], [0, 0, 1]);
      quad([[CX1, 0, 0], [CX1, 0, -46], [CX1, CH, -46], [CX1, CH, 0]], [1, 0, 0]);
      quad([[CX0, 32.38, 0.62], [CX1, 32.38, 0.62], [CX1, 33.65, 0.62], [CX0, 33.65, 0.62]], [0, 0, 1]);        // the ford
      quad([[CX0, 33.65, 0.62], [CX1, 33.65, 0.62], [CX1, 33.65, 0], [CX0, 33.65, 0]], [0, 1, 0]);
      quad([[CX1, 32.38, 0.62], [CX1, 32.38, 0], [CX1, 33.65, 0], [CX1, 33.65, 0.62]], [1, 0, 0]);
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3)); g.setIndex(idx);
      const m = new THREE.Mesh(g, stoneMaterial(UC, {}, CLIFF_FS)); m.frustumCulled = false; cliff.add(m);
    }
    // the figures of the registers: real slabs that slide along their baselines in step (mode 7), trees that stand
    const cOwn = makeBatch(46000), cHero = makeBatch(42000);
    const RUN = CX1 - CX0 - 8, XM = (CX0 + CX1) / 2, crng = rng.fork('cliff');
    const LIFT = new Map([[W.ox, 2.42], [W.cow, 2.42], [W.donkey, 2.42], [W.ibex, 2.42], [W.boat, 0.9], [W.man, 0.05], [F.birds[0], 1.25], [F.birds[1], 1.1], [F.duck, 0.45], [F.fish[0], 2.0], [F.fish[1], 2.0]]);
    const file = (batch, figs, k, pitch, speed, s, lift, o = {}) => {
      const n = Math.max(2, Math.round(RUN / pitch));
      for (let i = 0; i < n; i++) {
        const fig = figs[i % figs.length], y = k * 8 + 0.45 + (LIFT.get(fig) ?? lift) * s;
        if (o.stand) put(batch, fig, [CX0 + (i + 0.5) * RUN / n, y, 0.22], 0, [0, 0, 0.25], { s, ph: crng(), mir: crng() < 0.5, only: o.only });
        else put(batch, fig, [XM, y, 0.24], 0, [7, RUN, speed], { s, ph: (i + (o.off ?? 0)) / n, mir: speed < 0, only: o.only });
      }
    };
    file(cOwn, [W.boat], 0, 21, -0.8, 0.74, 0.9); await ctx.yield(); file(cHero, [F.birds[0]], 1, 8.2, 1.0, 1.35, 1.6, { only: [0] });
    file(cOwn, [W.donkey], 2, 10.5, 1.1, 0.98, 2.42); await ctx.yield();
    file(cHero, [F.trees[0], F.pom, F.trees[1]], 3, 7.6, 0, 0.31, 0, { stand: true }); await ctx.yield();
    file(cOwn, [W.ox, W.cow], 4, 9.4, 1.25, 1.0, 2.42); await ctx.yield(); file(cHero, [F.duck, F.fish[0], F.duck, F.fish[1]], 5, 8.6, -0.7, 1.3, 1.6, { only: [0] }); await ctx.yield();
    file(cOwn, [W.cow, W.ox], 6, 9.4, -1.2, 1.0, 2.42); await ctx.yield(); file(cHero, [F.trees[1], F.trees[2]], 7, 7.6, 0, 0.31, 0, { stand: true }); await ctx.yield();
    file(cOwn, [W.boat], 8, 17, 0.9, 0.74, 0.9); await ctx.yield(); file(cOwn, [W.man, W.man, W.donkey], 9, 5.4, 1.0, 1.0, 0.1, { off: 0.2 }); await ctx.yield();
    file(cOwn, [W.ibex, W.man, W.ibex], 10, 8.2, -1.3, 0.95, 0.1); await ctx.yield(); file(cHero, [F.birds[1], F.birds[0]], 11, 7.4, -1.1, 1.3, 1.6, { only: [0] });
    await ctx.yield();
    cliff.add(cOwn.mesh(slabMaterial(own(UC)))); await ctx.yield(); cliff.add(cHero.mesh(slabMaterial(UC)));
    await ctx.yield();

    // ---- the registers of distance, standing on their baselines on the far arc of the sky wall: a band of palms
    // round the white villa, and over it the ochre hills with ibex. Not paler for being far, only higher ----
    const UF = mkSet(), fOwn = makeBatch(14000), fHero = makeBatch(40000), frng = rng.fork('far');
    const onWall = (batch, fig, phi, y, s, o = {}) => put(batch, fig, [SKY_C[0] + (SKY_R - 4) * Math.sin(phi), y, SKY_C[1] - (SKY_R - 4) * Math.cos(phi)], -phi, [0, 0, 0], { s, ph: frng(), still: true, ...o });
    // what this round adds to the wall (the garden wall's slabs, the fourth rank) takes no draw: the far stream is for the old registers
    const onWallNew = (batch, fig, phi, y, s, o = {}) => put(batch, fig, [SKY_C[0] + (SKY_R - 4) * Math.sin(phi), y, SKY_C[1] - (SKY_R - 4) * Math.cos(phi)], -phi, [0, 0, 0], { s, ph: 0, still: true, ...o });
    const villaPhi = (frng() < 0.5 ? 1 : -1) * frng.range(0.4, 0.56);
    onWall(fOwn, W.villa, villaPhi, YB1, 4.6);
    const WALL_H = 3.4 * 4.6, wallAt = (phi) => { const a = Math.abs(phi - villaPhi); return a > 0.078 && a < 0.33; };
    for (const sd of [-1, 1]) for (const k of [0, 1]) onWallNew(fOwn, W.wall, villaPhi + sd * (0.078 + 0.0625 + k * 0.125), YB1, 4.6, { mir: sd < 0 });
    for (let i = -17; i <= 17; i++) {
      const phi = i * 0.125 + frng.range(-0.015, 0.015);
      if (Math.abs(phi - villaPhi) < 0.13) continue;
      const ps = frng.range(3.1, 3.6), on = wallAt(phi);
      onWall(fHero, F.trees[1], phi, YB1 + (on ? WALL_H : 0), on ? Math.min(ps, 3.0) : ps, { mir: frng() < 0.5 });
      if ((i & 7) === 7) await ctx.yield();
    }
    for (let i = -7; i <= 7; i++) {
      const phi = i * 0.31 + frng.range(-0.02, 0.02);
      onWall(fOwn, W.hill, phi, YB2, frng.range(2.2, 2.6), { mir: frng() < 0.5 });
      if (i < 7) onWall(fOwn, W.ibex, phi + 0.155, YB2 + 2.42 * 5.6, 5.6, { mir: frng() < 0.5 });
    }
    await ctx.yield();
    // a third register higher still, as it has always stood (boats under sail and cattle in file on y 204), and over
    // it ONE rank more, cattle in file and in step, no larger in the picture than the third's figures: higher is
    // further, not more important. Above it the stone is empty.
    const fUp = makeBatch(30000);
    for (let i = -8; i <= 8; i++) {
      const phi = i * 0.25 + 0.12 + frng.range(-0.02, 0.02), m = frng() < 0.5;
      if ((i & 1) === 0) onWall(fUp, W.boat, phi, YB3 + 0.9 * 9, 9, { mir: m, still: false });
      else onWall(fUp, frng() < 0.5 ? W.ox : W.cow, phi, YB3 + 2.42 * 11, 11, { mir: m, still: false });
      onWallNew(fUp, (i & 1) ? W.ox : W.cow, i * 0.25 - 0.005, YB4 + 2.42 * 10, 10, { mir: false, still: false });
      if ((i & 3) === 3) await ctx.yield();
    }
    await ctx.yield();
    scene.add(fUp.mesh(slabMaterial(own(UF)))); await ctx.yield();
    scene.add(fOwn.mesh(slabMaterial(own(UF)))); await ctx.yield(); scene.add(fHero.mesh(slabMaterial(UF)));
    await ctx.yield();

    // ---- the skiff, built round the camera: bow deck in plan, the upturned prow with its umbel at lower centre ----
    const US = own(mkSet({ uWeather: { value: 0 } })), sk = makeBatch(4000);
    put(sk, W.deck, [0, -2.5, 0], 0, [5, 0, 0]);
    put(sk, W.prow, [0, -2.62, -7.5], 0, [0, 0, 0], { s: 0.52 });
    const skiff = sk.mesh(slabMaterial(US)); skiff.renderOrder = 2;
    const carried = new THREE.Group(); carried.add(skiff); scene.add(carried);      // everything that rides with the camera

    // ---- the ribbon of water the skiff rides: 5 m wide, drawn 30 m ahead of the prow and rubbed out behind;
    // over the pool it sinks into the painted surface ----
    const SD_WATER = path.length * U_WATER, SD_LIFT = path.length * U_LIFT;
    const uRib = { value: new THREE.Vector4(0, SD_WATER, SD_LIFT, 0) };
    const RIB_VS = /* glsl */`
      attribute vec2 aS; uniform vec4 uRib; uniform float uTime;
      varying vec3 vG, vN; varying vec2 vS; varying float vSink;
      void main(){
        float sink = smoothstep(uRib.y - 30., uRib.y - 4., aS.x)*(1. - smoothstep(uRib.z + 2., uRib.z + 16., aS.x));
        vec3 p = position; p.y -= 1.3*sink; p.y += 0.07*sin(aS.x*0.7 - uTime*2.4)*(1. - sink);
        vG = p; vN = normal; vS = aS; vSink = sink; gl_Position = projectionMatrix*modelViewMatrix*vec4(p, 1.);
      }`;
    const RIB_FS = /* glsl */`
      ${STYLE_GLSL}
      ${WATER_GLSL}
      uniform vec4 uRib;
      varying vec3 vG, vN; varying vec2 vS; varying float vSink;
      void main(){
        vec2 p = vS*2.; vec2 fw = fwidth(vS); float px = max(max(fw.x, fw.y)*1.5, 1e-4);
        float ahead = vS.x - uRib.x, rag = vnoise(vec2(vS.y*1.7, vS.x*0.35 + uTime*0.2)) + 0.3*vnoise(vec2(vS.y*5.3, vS.x*1.4 + 3.));
        // the paint front on the ribbon: a hard ragged brush edge (one pixel of the stage value), then crisp soot
        // zigzags on clean stone, then only the two border lines out to the tip
        float sF = 17. + 4.*rag - ahead, wF = max(0.7*fwidth(sF), 1e-3), rubN = vnoise(vS.yx*vec2(1.1, 0.8));
        if (ahead > 29. + 3.*rag) discard;
        float rub = (ahead + 15.)/9.;                               // behind the stern the paint is rubbed away
        if (rubN > rub || ahead < -15.) discard;
        float sunk = step(0.002, vSink);
        float pnt0 = max(smoothstep(-wF, wF, sF), sunk), ink = max(smoothstep(-wF, wF, sF + 7.5), sunk), cut = max(smoothstep(-wF, wF, sF + 2.5), sunk);
        vec3 stone = stoneAt(vS.yx, px*0.5), col; float e;
        if (vN.y < 0.5) { col = stone; e = clamp(dot(vN, uSunL)*1.7, -1., 1.); }
        else {
          float pnt = pnt0;
          vec2 s2 = vec2(0.3, 0.95); float zc; gZig = 1.3*(1. - pnt); vec4 w = waterAt(p, px, s2, 0., zc);
          col = mix(mix(stone, uPig[5], ink*0.85*zc), w.rgb, pnt); e = w.a*cut;
          float lw = max(0.07, 0.8*px*0.5), bd = 2.5 - abs(vS.y);
          col = mix(col, uLineC, 1. - smoothstep(lw, lw + px*0.5, abs(bd - 0.22)));
          col = mix(col, stone, 1. - smoothstep(0.2 - px*0.5, 0.2, bd));
        }
        gl_FragColor = vec4(edgeTone(col, e), 1.);
      }`;
    {
      const pos = [], nrm = [], aS = [], idx = [], c = new THREE.Vector3(), t = new THREE.Vector3(), sd = new THREE.Vector3(), STEP = 0.8, n = Math.ceil((LEN + 60) / STEP);
      for (let i = 0; i <= n; i++) {
        const d = -22 + i * STEP; path.posAtDist(d, c); path.tangentAtDist(d, t); sd.set(-t.z, 0, t.x).normalize();
        // the ribbon lies 2.78 m under the course along the course's OWN normal (not straight down), so the gap under the
        // hull is the same on the level, on the descent and on the 36 degree climb
        { const h = Math.max(Math.hypot(t.x, t.z), 1e-3); c.x += 2.78 * t.x * t.y / h; c.y -= 2.78 * h; c.z += 2.78 * t.z * t.y / h; }
        for (const [k, dy, ny, ns] of [[-1, -0.5, 0, -1], [-1, 0, 0, -1], [-1, 0, 1, 0], [1, 0, 1, 0], [1, 0, 0, 1], [1, -0.5, 0, 1]]) { pos.push(c.x + sd.x * 2.5 * k, c.y + dy, c.z + sd.z * 2.5 * k); nrm.push(sd.x * ns, ny, sd.z * ns); aS.push(d, 2.5 * k); }
        if (i < n) { const a = i * 6, b = a + 6; for (const j of [0, 2, 4]) idx.push(a + j, a + j + 1, b + j, b + j, a + j + 1, b + j + 1); }
        if (i % 300 === 299) await ctx.yield();
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3)); g.setAttribute('aS', new THREE.Float32BufferAttribute(aS, 2)); g.setIndex(idx);
      const m = new THREE.Mesh(g, stoneMaterial(UF, { uRib }, RIB_FS, RIB_VS)); m.material.side = THREE.DoubleSide; m.frustumCulled = false; scene.add(m);
    }
    await ctx.yield();

    // ---- on the board: the shaduf on the left coping, dipping and lifting by itself ----
    const gOwn = makeBatch(1500);
    put(gOwn, W.shaduf, [-58.4, 0, -6], Math.PI * 0.3, [0, 0, 0], { s: 1.3, ph: 0.2 });
    hero.garden.add(gOwn.mesh(slabMaterial(own(U))));
    const gHero = makeBatch(1500);            // a doum palm of the right bank's own avenue, hinging up with its row
    hero.place(gHero, F.trees[2], [58.6, 0, 99], -Math.PI / 2, [1, 150, 0], { s: 0.52, ph: 0.4, sock: true, rock: [0.02, 0.8] });
    hero.garden.add(gHero.mesh(slabMaterial(U)));

    // ---- beside the way in, at the board's near starboard corner: six trees of the bank rows' kind and size (22 m) on
    // the workshop floor in front of the hinge line, lying flat as the painter laid them with their crowns to starboard,
    // away from the course, and hinging upright about their roots as the boat comes level with each one's own place
    // along the board's long axis. It is the starboard corner because no cliff stands on that side: the Register Cliff
    // runs along the port side of the way in. Their space: the origin is on the floor at the foot of the board's near
    // starboard corner (the starboard end of its hinge line, A.hinge.b: the board's half-width and its hinge), +x runs
    // to starboard, out from the board's long axis, z is the board's long axis, counted from the hinge line out toward
    // the arriving boat; its axes are the world's own. Two files of three parallel to the board's side edge: roots
    // 13.5 m inside that edge's line and 24.5 m further in, 13.1 m apart, the second file 6.5 m on (the bank rows' own
    // distances from their pool's edge, their pitch and their stagger); the first root stands a whole pitch out from
    // the hinge line, so that no lying crown reaches the board. The place is stated by the board's corner and its
    // lines alone: the same at every seed.
    // They rise by the world's rule for a lying thing and by the bank rows' own numbers (150 m, upright at half of
    // it), read from the eye's own place along the board's long axis in world metres against the root's own (update:
    // UE.uCamL), never from a share of the flight or a time: so where the course starts, 111 to 143 m before their
    // roots, the furthest of them is already part risen and the nearest has barely begun. Their colour is complete
    // from the start (their own front stands 10 km ahead), like the trees of the bank that the garden's front has
    // passed. What is drawn by chance (which tree is which, size, mirror, phase, rock) has a stream of its own.
    const entry = new THREE.Group(); entry.position.set(A.hinge.b[0], -2.4, A.hinge.b[2]);
    scene.add(entry); entry.updateMatrixWorld(true);
    const UE = mkSet({ uRise: { value: new THREE.Vector4(-1, 0.5, 0, 280) } });
    {
      const er = ctx.core.makeRng(ctx.core.hashSeed('garden-in-plan-entry-trees:' + ctx.seed)), kinds = er.shuffle([0, 1, 2]), gEntry = makeBatch(6000);
      const PITCH = 13.1;
      for (let i = 0; i < 6; i++) {
        const file = i % 2, k = i >> 1;
        hero.place(gEntry, F.trees[kinds[(k + file) % 3]], [-(13.5 + file * 24.5), 0, PITCH + k * PITCH + file * 6.5], -Math.PI / 2, [1, 150, 0],
          { s: er.range(0.93, 1.02), mir: er.chance(0.5), ph: er(), sock: true, rock: [0.02, er.range(0.6, 1)] });
      }
      entry.add(gEntry.mesh(slabMaterial(UE)));
    }
    await ctx.yield();

    // ---- the tilapia that leaps as a slab over the bow (twice in a crossing, keyed to the course) ----
    const UL = { ...U, uFront: { value: new THREE.Vector4(0, 0, 1, 1e4) } };
    const lb = makeBatch(1200); put(lb, F.fish[0], [0, 0, 0], 0, [0, 0, 0], { s: 0.9 });
    const leaper = lb.mesh(slabMaterial(UL)); leaper.visible = false; scene.add(leaper);
    await ctx.yield();
    const LEAPS = [{ z: 30, dir: 1, s0: uOfZ(57) * LEN }]; await ctx.yield(); LEAPS.push({ z: -48, dir: -1, s0: uOfZ(-21) * LEN });

    // ---- the door inside the wreath (it is a door, not a sun): a hoop of bound papyrus and a white sill round the
    // opening, in the plane of the portal, as large as the pane it frames ----
    const UD = own(mkSet({ uWeather: { value: 0 } })), db = makeBatch(3000);
    put(db, W.door, [0, 0, 0], 0, [0, 0, 0], { still: true }); put(db, W.door, [0, 0, 0], 0, [0, 0, 0], { still: true, mir: true });
    const door = db.mesh(slabMaterial(UD));
    { const t = new THREE.Vector3(); path.tangentAt(1, t); door.quaternion.setFromRotationMatrix(new THREE.Matrix4().lookAt(new THREE.Vector3(), t, new THREE.Vector3(0, 1, 0))); door.position.fromArray(A.portalSeat.position).addScaledVector(t, -0.4); }
    scene.add(door); UD.uSunL.value.copy(sunW).applyQuaternion(door.quaternion.clone().invert()).normalize();

    // ---- flakes of old paint let go from high up and tumble across the bow, pigment on one side and plaster on
    // the other; and chips and puffs of gypsum dust where the chisel is sinking the cliff's figures ----
    const NFL = Math.round(64 * detail * dens), NCH = Math.round(300 * detail);
    const uFl = { uCtr: { value: new THREE.Vector3() }, uEye: { value: new THREE.Vector3() }, uChisel: { value: new THREE.Vector4(75, CLIFF_LEAN, CLIFF_B, 0) },
      uCO: { value: cliff.position.clone() }, uCX: { value: new THREE.Vector3(1, 0, 0).applyQuaternion(cliff.quaternion) }, uCZ: { value: new THREE.Vector3(0, 0, 1).applyQuaternion(cliff.quaternion) } };
    const FL_VS = /* glsl */`
      attribute vec4 aSeed; attribute float aPig;
      uniform vec3 uCtr, uEye, uCO, uCX, uCZ, uPig[7]; uniform vec4 uChisel; uniform float uTime, uPxAng;
      varying vec3 vCol, vN; varying vec2 vQ; varying float vE, vKind;
      void main(){
        vec3 c; float size = 0.42 + 0.5*aSeed.w, spin = uTime*(0.3 + 0.8*aSeed.w) + aSeed.x*40., pmin = 4.5, pmax = 11.;
        vE = position.z; vKind = aPig;
        if (aPig < 6.5) {
          vec3 box = vec3(84., 44., 84.);
          vec3 q = aSeed.xyz*box + vec3(uTime*(1.1 + 0.9*aSeed.w), -uTime*(0.45 + 0.8*aSeed.z), uTime*0.25);
          q.x += 1.6*sin(uTime*0.6 + aSeed.y*30.);
          c = uCtr + mod(q - uCtr + box*0.5, box) - box*0.5;
        } else {                                      // a chip struck from the face where the cut is being sunk
          float t = fract(uTime*(0.35 + 0.3*aSeed.w) + aSeed.x*7.), y = aSeed.y*94. + 1.;
          float x = uChisel.x - uChisel.y*y + (aSeed.z*1.1 - 0.05)*uChisel.z;
          c = uCO + uCX*(x + (aSeed.w - 0.5)*2.5*t) + vec3(0., y + 1.5*t - 7.*t*t, 0.) + uCZ*(0.4 + (2. + 5.*aSeed.z)*t);
          size = (0.1 + 0.17*aSeed.w)*(1. + t)*step(x, 65.)*step(-70., x); pmin = 2.2; pmax = 9.;
        }
        vec3 ax = normalize(vec3(aSeed.y - 0.5, 0.35, aSeed.z - 0.5) + 1e-3);
        float cs = cos(spin), sn = sin(spin);
        vec3 l = vec3(position.xy*size, 0.);
        // a flake is a tumbling chip the eye can read: its half-width is held between pmin and pmax pixels
        float dist = distance(c, uEye), pxs = size/max(uPxAng*dist, 1e-5); l *= clamp(pxs, pmin, pmax)/max(pxs, 1e-3)*smoothstep(7., 11., dist)*step(1e-4, size);
        vec3 r = l*cs + cross(ax, l)*sn + ax*dot(ax, l)*(1. - cs);
        vec3 n0 = vec3(0., 0., 1.); vN = n0*cs + cross(ax, n0)*sn + ax*dot(ax, n0)*(1. - cs);
        int i = int(min(aPig, 6.) + 0.5); vCol = uPig[i]; vQ = position.xy;
        gl_Position = projectionMatrix*viewMatrix*vec4(c + r, 1.);
      }`;
    const FL_FS = /* glsl */`
      ${STYLE_GLSL}
      varying vec3 vCol, vN; varying vec2 vQ; varying float vE, vKind;
      void main(){
        vec3 N = vN/max(length(vN), 1e-4); float f = dot(N, uSunL)*(gl_FrontFacing ? 1. : -1.);
        vec3 plaster = mix(uPig[0], uPig[6], 0.6), col = gl_FrontFacing ? vCol : plaster;
        float big = step(vKind, 6.5), rim = step(0.84, vE)*big, line = 0.;
        if (gl_FrontFacing && vKind < 1.5) {                      // a flake of the water still carries its zigzag
          float tz = abs(fract(vQ.x*1.2 + 0.25) - 0.5)*2. - 0.5;
          col = mix(col, uPig[5], 1. - smoothstep(0.075, 0.12, abs(vQ.y*0.9 - tz*0.42)));
        }
        if (gl_FrontFacing) col = mix(col, uLineC, line);
        col = mix(col, plaster, rim);
        gl_FragColor = vec4(edgeTone(col, clamp(f*1.3, -1., 1.)*mix(0.3, 1., max(rim, 1. - big))), 1.);
      }`;
    {
      const g = new THREE.InstancedBufferGeometry(), n = NFL + NCH, seed = new Float32Array(n * 4), pg = new Float32Array(n), frg = rng.fork('flakes');
      g.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, -1, -0.7, 1, 0.8, -1, 1, 1, 0.5, 1, 0.1, 1, 1, -0.9, 0.6, 1], 3)); g.setIndex([0, 1, 2, 0, 2, 3, 0, 3, 4, 0, 4, 5, 0, 5, 1]);      // z = 1 on the rim
      for (let i = 0; i < n; i++) {
        seed[i * 4] = frg(); seed[i * 4 + 1] = frg(); seed[i * 4 + 2] = frg(); seed[i * 4 + 3] = frg();
        const r = frg(); pg[i] = i >= NFL ? 7 : r < 0.56 ? 1 : r < 0.72 ? 2 : r < 0.84 ? 3 : r < 0.93 ? 4 : 6;
        if (i % 800 === 799) await ctx.yield();
      }
      g.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seed, 4)); g.setAttribute('aPig', new THREE.InstancedBufferAttribute(pg, 1)); g.instanceCount = n;
      const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: { ...UF, ...uFl }, vertexShader: FL_VS, fragmentShader: FL_FS, side: THREE.DoubleSide }));
      m.frustumCulled = false; scene.add(m);
    }
    await ctx.yield();

    // ---- running it ----
    const DURATION = 44;
    const _m = new THREE.Matrix4(), _up = new THREE.Vector3(0, 1, 0);
    const _p = new THREE.Vector3(), _eye = new THREE.Vector3(), _fw = new THREE.Vector3(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _qc = new THREE.Quaternion(), _c8 = new THREE.Vector3();
    UC.uSunL.value.copy(sunW).applyQuaternion(cliff.quaternion.clone().invert()).normalize();
    const H0P0 = H0.dot(P0);
    const _ee = new THREE.Vector3();
    function update(dt, time, camera, u = 0) {
      path.pointAt(u, _p);
      const front = frontAt(u), flight = Math.max(0, u - U_BIRDS) * DURATION;
      hero.setTilt(tiltAt(_p.z)); hero.setFront(front); hero.setFlight(flight);
      hero.update(dt, time, camera);
      // the work's bands are 13 m deep, the pitch of the bank rows' trees: what is drawn and not yet painted (two bands)
      // is two trees of a row and a creature or two of the pool at a time, a narrow band at the edge of the colour
      // (35 m bands held a field of bare contours, and far off on the page those close up into black)
      U.uFrontW.value = 13; U.uFront.value.y = -1.2;          // up the fan the colour climbs after the water
      // what stands on the far bank (the thicket, the two columns, the wreath) is a line drawing until it is 480 m ahead
      // of the eye along the board, and painted by 430 m (so it has its colour when we pass the cliff's corner, 441 m off)
      U.uFrontMin.value = rare ? 2.5 : 2.5 + 2.2 * (1 - smoothstep(430, 480, U.uEyeL.value.z + 165));
      U.uCamL.value.z += 70 * smoothstep(236, 270, _p.z);      // the trees stay laid flat while the garden is a page
      if (rare) {                        // the unfinished wall: beyond the stopped front only outline; colour comes down the fan as the tiers rise
        U.uFrontW.value = 45; U.uFront.value.set(0, 1.1 + 3.4 * smoothstep(0.5, 9, flight), 1, -front);
      }
      camera.matrixWorld.decompose(_eye, _qc, _s); _fw.set(0, 0, -1).applyQuaternion(_qc);
      const camA = _p.dot(H0) - H0P0, lead = CLIFF_LEAD;
      UC.uFront.value.set(-1, -CLIFF_LEAN, 0, camA + lead);
      UG.uFront.value.set(-H0.x, 0, -H0.z, camA + lead + H0P0);
      UG.uEyeL.value.copy(_eye); UF.uEyeL.value.copy(_eye); _s.copy(_eye); cliff.worldToLocal(_s); UC.uEyeL.value.copy(_s);
      uFl.uEye.value.copy(_eye); uFl.uCtr.value.copy(_eye).addScaledVector(_fw, 40); uFl.uChisel.value.x = camA + lead;
      uRib.value.x = u * LEN;
      // the six trees beside the board's near end: the camera's own position taken into their space (z = world metres
      // along the board's long axis, counted from its hinge line), which is what their rising and their drawing read
      _ee.copy(_eye); entry.worldToLocal(_ee); UE.uCamL.value.copy(_ee); UE.uEyeL.value.copy(_ee);
      // the skiff rides with the eye, rocking a little on its ribbon
      // (it keeps the heading of the course, not of the gaze, so the deck lies along its ribbon)
      // Seen through the previous portal it is parked where a camera at the very start of the course would carry it.
      // Its pitch follows the gaze when the gaze lifts off the course (the descent over the board), so the bound
      // umbel of the prow stays at lower centre: never more than 8 degrees under the line of sight.
      if (ctx.through) { _eye.copy(P0); _fw.copy(H0); }
      // the hull is straight and the course is not: it takes the pitch of the chord from the eye to the place the bow
      // is over (8 m on), so where the course curves up at lift-off the bow rides up with its ribbon, not through it
      path.posAtDist(u * LEN + 8, _s).sub(_c8.copy(path.posAtDist(u * LEN, _c8))).normalize();
      _s.x = _s.x * 0.6 + _fw.x * 0.4; _s.z = _s.z * 0.6 + _fw.z * 0.4;
      { const hl = Math.max(Math.hypot(_s.x, _s.z), 1e-3), pp = Math.atan2(_s.y, hl), pg = Math.asin(clamp(_fw.y, -1, 1)); _s.y = Math.tan(clamp(Math.max(pp, pg - 0.14), -1.2, 1.2)) * hl; }
      _m.lookAt(_eye, _fw.copy(_eye).add(_s), _up); carried.position.copy(_eye); carried.quaternion.setFromRotationMatrix(_m);
      carried.rotateZ(0.018 * Math.sin(time * 1.1)); carried.translateY(0.05 * Math.sin(time * 1.7));
      // the wake leaves the bow while the skiff is on the pool
      _s.set(0, 0, -7.7).applyQuaternion(carried.quaternion).add(carried.position); hero.garden.worldToLocal(_s);
      U.uWake.value.set(_s.x, _s.z, smoothstep(SD_WATER - 4, SD_WATER + 10, u * LEN) * (1 - smoothstep(SD_LIFT - 2, SD_LIFT + 10, u * LEN)), 0);
      US.uSunL.value.copy(sunW).applyQuaternion(_q.copy(carried.quaternion).invert()).normalize();
      // the leaping tilapia
      const sc = u * LEN; let on = false;
      for (const l of LEAPS) {
        const k = (sc - l.s0) / 17;
        if (k <= 0 || k >= 1) continue;
        on = true;
        const vy = 6.8 * Math.PI * Math.cos(Math.PI * k), a = Math.atan2(vy, 19);
        leaper.position.set(l.dir * lerp(-9.5, 9.5, k), -1.9 + 6.8 * Math.sin(Math.PI * k), l.z);
        leaper.scale.x = l.dir; leaper.rotation.z = l.dir * a;
        UL.uFront.value.set(0, 0, 1, l.z - front);
      }
      leaper.visible = on;
    }
    update(0, 0, { matrixWorld: new THREE.Matrix4().makeTranslation(P0.x, P0.y, P0.z), projectionMatrix: new THREE.Matrix4() }, 0);

    const ring = A.portalSeat.position;
    const _gz = new THREE.Vector3(), _gp = new THREE.Vector3();
    const onBoard = (u, y, z) => { path.pointAt(u, _gp); const t = tiltAt(_gp.z), dz = z - 210; return _gz.set(0, y * Math.cos(t) - dz * Math.sin(t), 210 + dz * Math.cos(t) + y * Math.sin(t)); };
    const gazePage = (time, u) => { const k = smoothstep(0.24, 0.31, u); return onBoard(u, lerp(0, 40, k), lerp(60, -162, k)); };
    const gazeFan = (time, u) => onBoard(u, 30, -165);
    const basePois = [
      { at: gazePage, from: 0.1, to: 0.46, weight: 0.52, fade: 0.2 },
      { at: gazeFan, from: 0.36, to: 0.86, weight: 0.3, fade: 0.12 },
      { at: [-58, 10, -6], from: 0.6, to: 0.72, weight: 0.45, fade: 0.35 },      // a look to the port bank: the shaduf and the avenue
      { at: [ring[0] + 5, ring[1], ring[2]], from: 0.86, to: 0.97, weight: 0.3 },
    ];
    return {
      scene, path, duration: DURATION,
      pace: (u) => lerp(0.62, 1.08, smoothstep(0.06, 0.3, u)),
      title: rare ? 'The Garden Drawn from Above: the Unfinished Wall' : undefined,
      camera: { fov: 62, near: 0.3, far: 2600, lookAhead: 26, sway: 0.35, bank: 0.4 },
      pois: basePois,
      portal: { shape: 'circle', radius: DOOR.r, color: '#f3e2b0', glow: 0, halo: false, veil: pal[4], tilt: true, revealDistance: 240 },
      post: { flat: 1, exposure: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1, tint: '#ffffff', shadowTint: '#000000', vignette: 0, grain: 0, aberration: 0 } },
      ride: 'none', style: 'none', companion: 'none',
      update,
      dispose() { hero.dispose(); wC.dispose(); wD.dispose(); },
    };
  },
};
