// Tables Under the Falling Sky: the hero part. One great round dining room under a dome of clear glass on a dead plain,
// and round it a dark sky of old bloated ember stars where storms of torn light pull at the few red suns that are left.
//
// This file holds (1) the PLAN: every measure of the place and the flown line, by arithmetic from the seed alone, so that
// the world and the counts in node read the same numbers; (2) the sky's shader (the world's clock and the seed only);
// (3) the room's shared material, the glass, the water and the small lights; (4) the makers of the furnishing.
//
// WHAT IS DRIVEN BY WHAT (nothing here reads u, the metres flown or a share of the flight; what reads the lens's place is
// shading only, each named at the world's head; the flown line deals four things and nothing else: the building's axis
// of leaving (the pier, the gallery's opening, the ring's lamp and the ring's sun stand by the line's end and last leg),
// the clearance (a chandelier's 18 m in plan with it), the level of faces, and WHICH ONE near table is the party's (round
// t1: the table the line holds longest on the hand of its way that is turned to the room's middle; PARTY below)):
//   the sky: the world's clock and uniforms dealt once from the seed (every sun's light added over the whole sky, each
//     falling to nothing by its own reach: no hand-over, no seam);
//   candle flames, palms, strings, steam, the fountains' water, chandeliers, the plain's low dust: the world's clock, each on a phase of its own;
//   the one small fish in the bowl of the party's table: the world's clock (a round in 4.8 s about the bowl's middle);
//   the room's light: by place (warm from below and the middle, the sky's red from the side; the great fountain's own
//     body from the lights at its foot, the dais and its gilt shell from its ring of lamps, the door from its four lamps
//     and the row of lights in its coffered soffit), the same for every visitor and at every clock;
//   every thing's stand: by the room's own plan (radius and bearing) and the law of standing;
//   a candle's colour: its cup's, by the thing (the same glow on every table, never by how far the eye is);
//   a table's dinner, flame and steam: its own lot at every level of its faces.
//
// WHAT A PARTY LEFT (rounds t1 and t2; plain things of the place, each by the plan, the same for every visitor; made
// near the file's end and laid by planRoomC): the party's table (a towel and a dressing gown on a chair, tea, two pairs
// of black glasses, a tall drink, a gold brick, a satchel, a fish in a bowl, a bowl of flowers, the table's number: the
// world's only writing, built or not by the world's one word); parked craft on the plain beside the causeway, one of
// them black all over; a drift of old shoes on the broken ground; one long table on the pier laid for a hall; an empty
// pool of light at the bandstand's front. No figure.
// ROUND t2 (the things set right against the books' prose, and a few more): the long table has NO drinking horn and NO
// hammer now: plain round iron helmets set down on its cloth and its benches, and plain drinking glasses along it;
// the pool of light at the bandstand's front is EMPTY (the microphone stand is gone; the light stays); the dressing
// gown is the room's own rust; on the party's table, by its fourth, free place, six pints of amber brown bitter in one row
// with a few small plain packets beside them, and one small iced cake alone on a large plain plate; a flat dark slab
// with one dark screen and a field of plain buttons half out of the satchel's mouth (nothing lettered on it); and on
// the plain beside the causeway, on the black ship's hand, ONE large buttoned leather sofa on a slab of the broken
// ground (planRoomC lays it by the causeway's plan; sofaInto makes it; round t3: in a patterned cloth, not leather).
// Each is in the mesh of its kind (the ground's, the room's things, the small lights, the water); the fish alone has a
// mesh of its own (one more draw call; round t2 adds none).
// ROUND t3 (four things made to READ BETTER from the line; nothing new, nothing moved, the plan untouched): the sofa's
// covering is a PATTERNED CLOTH, not leather (a deep petrol ground with one small curled drop repeated in old gold
// and a pale grey green, each a few flat faces lying on the cloth: sofaInto); the gown has ONE SLEEVE hanging to the
// floor with an open cuff, and its cord trails along the floor to a tassel (gownInto); of the two pairs of sunglasses
// one stands open and one lies folded (shadesInto, partyInto); the bowl's flowers are larger trumpets with the white a
// part of each (petuniasInto); the long table's drinking glasses are smaller, dim and unevenly set, three of them
// lying (hallInto). 1,331 triangles more on every seed; no draw call, no texture, no material, no stream, no draw.
//
// COUNTED WITH THE ENGINE'S OWN HINTS on seeds 1 to 300 (rare on 38 of them, density 0.7 to 1.3, the mood always handed):
//   suns four on 148 seeds, five on 152; middles 16.0 to 33.0 degrees up, two and more above 20 on every seed; no two
//   nearer than 32.8 degrees; none within 27.5 degrees of the exit's axis; the greatest disc of a sky 1.72 to 1.86 times
//   the least; old stars 36 to 48, each 1.7 degrees and more up, none nearer a sun's middle than the sun's radius, 7
//   degrees and its own radius, none in a storm's body; tables 1085 to 1416 a seed; chandeliers 6 to 8 hang (of the
//   ten dealt 3 to 6 are dealt outward, 2 to 4 left out), none within 18 m in plan of the flown line; triangles 352,509
//   (seed 235) to 412,855 (seed 74, the densest), the sky's dome counted by its own mesh (320).
import * as THREE from 'three';
import { makePath, makeRng, hashSeed, clamp, lerp, smoothstep } from '../kit/core.js';

const DEG = Math.PI / 180;

// ---------------------------------------------------------------- the measures of the place (metres; y = 0 is the lowest floor)
export const DIM = {
  RD: 110,        // the drum's inner face and the glass's foot
  YG: 22,         // the gallery's floor and the glass's foot
  HD: 58,         // the dome's rise over its foot (crown at 80)
  RRAIL: 94,      // the gallery's inner edge
  RTOP: 93,       // the top level (y 12) begins here
  RPIT: 26,       // the pit's edge: the first riser
  RPOOL: 12,      // the great fountain's pool
  RDAIS0: 13.6, RDAIS1: 21.2, YDAIS: 1.0,   // the bandstand: a ring dais round the pool
  YOUT: 12,       // the top level, the door's sill, the porch
  YWAY: 11.2,     // the causeway's paving
  YPLAIN: 7,
  RPORCH: 121,    // the porch's outer edge: the head of its short stair
  RSTEPS: 123,    // the stair's foot on the causeway
  DOORW: 13,
  DOORH: 9,       // the opening: 13 m wide on the wall's outer face (splayed to 18 m on its inner), 9 m high (its lintel is the gallery's slab)
  NCOL: 48,
  RING: 6,        // the exit ring's radius
  R0: 200,        // the flight begins here on the door's axis
  RHO1: 60,       // the arc from the door's axis onto the promenade
  RTOPR: 85,      // the round's distance from the middle at the top of the rise
  RHO2: 50,       // the level turn at the top
  DPASS: 45,      // the last leg passes the fountain at this distance
  REND: 96,       // the ring stands here on the gallery, at the pier's root
  PSI_L: 45, PSI_T: 150,   // bearings: the rise begins, the round ends
  YLENS0: 15,     // the lens outside and through the door
  RC: 60,         // the promenade's middle: the round's circle
  YLOW: 8.7,      // the lens on the promenade (2.7 m over it)
  YHIGH: 31,      // the lens at the top of the rise
  YEND: 28.5,     // the lens on the pier (6.5 m over its floor)
  PIERW: 10,      // the pier's half width
  PIERL: 64,      // its length back from the ring
  CLEAR: 2.6,     // every solid thing from the line, in space
  TALL: 7,        // palms, standards, columns, jets, ornaments from the line, in space
  HFOUNT: 36,     // the great fountain's kept height: the plan keeps the line clear of it to 39 (its nozzle is at 34.2, its plume to 38.5)
};

// the dome's glass: half an ellipsoid on the drum's rim; radius of the glass at height y, and its height at radius r
export const domeR = (y) => DIM.RD * Math.sqrt(Math.max(0, 1 - ((y - DIM.YG) / DIM.HD) ** 2));
export const domeY = (r) => DIM.YG + DIM.HD * Math.sqrt(Math.max(0, 1 - (r / DIM.RD) ** 2));

// THE ARENA'S FLOOR: the pit (y 0) to R 26; twelve risers of 1.0 m, each three steps (0.333 m up at the riser's foot,
// 0.35 m and 0.70 m on), so that level k is reached 0.70 m past its riser's foot; five narrow levels, THE PROMENADE
// (y 6, R 53.45 to 66.2: the round is flown along its middle), five narrow levels, the top level (y 12) from R 92.65.
export const RISERS = [26, 31.35, 36.7, 42.05, 47.4, 52.75, 66.2, 71.35, 76.5, 81.65, 86.8, 91.95];
export const RUN = 1.05, GO = 0.35;
export function makeFloor() {
  const NT = RISERS.length;
  // the level a place stands on: k risers lie inside it (0 the pit, 6 the promenade, 12 the top level)
  const terraceOf = (R) => { let k = 0; while (k < NT && R >= RISERS[k] + 2 * GO) k++; return k; };
  // the floor's true height: level on the flats, three steps at each riser
  const y = (R) => { const k = terraceOf(R); return k < NT && R >= RISERS[k] ? k + (R >= RISERS[k] + GO ? 2 / 3 : 1 / 3) : k; };
  // the flat of level k (1 to 12): from the head of riser k to the foot of riser k + 1 (the drum's wall for the top level)
  const flat = (k) => [RISERS[k - 1] + 2 * GO, k < NT ? RISERS[k] : DIM.RD];
  return { NT, drop: 1, stepsW: 2 * GO, terraceOf, y, flat };
}

// THE LENS'S HEIGHT ON THE LOW WAY, by the distance from the room's middle: 3.0 m over the sill at the door, 2.3 m over
// the upper edge of every riser it crosses (so it is 2.3 to 3.1 m over the floor it is above), 2.7 m over the promenade
export const lensLow = (R) => {
  if (R >= DIM.RTOP) return DIM.YOUT + 2.3 + 0.7 * Math.min(1, (R - DIM.RTOP) / (DIM.RD - DIM.RTOP));
  if (R >= RISERS[6]) return 7 + 2.3 + (R - (RISERS[6] + RUN)) * (5 / (DIM.RTOP - RISERS[6] - RUN));
  return lerp(DIM.YLOW, 7 + 2.3 - RUN * (5 / (DIM.RTOP - RISERS[6] - RUN)), smoothstep(DIM.RC + 0.5, RISERS[6], R));
};

// ---------------------------------------------------------------- the flown line
// In the plan's own frame (x to the right hand of the way in, z toward the porch; the seed's hand mir flips x):
//  in     straight and level along the door's axis from R 200, through the door (R 110), under the gallery;
//  arc    a right arc of 60 m (60 degrees) down across the upper terraces onto the promenade, the lens 2.3 to 3.1 m over the floor;
//  low    level along the promenade's middle (R 60) to bearing 45;
//  rise   the round about the great fountain, bearing 45 to 150, widening to R 85 and rising to y 31 (level from bearing 142);
//  top    a level left turn of 50 m until the heading's line passes the fountain at 45 m;
//  leg    straight: down to y 28.5 over its first part, then level for the last 60 m and more along the gallery's pier to the ring.
export function planRoute(mir) {
  const RC = DIM.RC, RHO1 = DIM.RHO1, z1 = Math.sqrt((RHO1 + RC) ** 2 - RHO1 ** 2), sweep = Math.atan2(z1, RHO1), psi1 = Math.atan2(RHO1, z1) / DEG;
  const sm = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  // an eased ramp: a fifth to gather, a fifth to settle, even between (its steepest is 1.25 of its mean)
  const ramp = (t) => { t = clamp(t, 0, 1); const e = 0.2, v = 1 / (1 - e); return t < e ? v * t * t / (2 * e) : t > 1 - e ? 1 - v * (1 - t) * (1 - t) / (2 * e) : v * (t - e / 2); };
  const P = [], tag = [];
  const add = (x, y, z, t) => { P.push([x, y, z]); tag.push(t); };
  for (const z of [DIM.R0, 185, 170, 155, 140, 127, 116]) add(0, DIM.YLENS0, z, 'in');
  add(0, lensLow(109.5), 109.5, 'in');
  const NA = 12;
  for (let k = 0; k <= NA; k++) { const a = sweep * k / NA, x = RHO1 * (1 - Math.cos(a)), z = z1 - RHO1 * Math.sin(a); add(x, lensLow(Math.hypot(x, z)), z, k ? 'arc' : 'in'); }
  const Rof = (psi) => RC + (DIM.RTOPR - RC) * sm((psi - DIM.PSI_L) / (DIM.PSI_T - DIM.PSI_L));
  // the rise is shared out by the metres of the round from bearing PSI_L to 8 degrees short of its end (level from there)
  const nR = Math.round((DIM.PSI_T - psi1) / 5), psiOf = (k) => lerp(psi1, DIM.PSI_T, k / nR), run = [0];
  for (let k = 1; k <= nR; k++) { const a = psiOf(k - 1), b = psiOf(k), ra = Rof(a), rb = Rof(b); run.push(run[k - 1] + (b > DIM.PSI_L ? Math.hypot(rb - ra, (ra + rb) / 2 * (b - a) * DEG) * clamp((b - DIM.PSI_L) / (b - a), 0, 1) : 0)); }
  const runTop = run[nR] - DIM.RTOPR * 8 * DEG;
  for (let k = 1; k <= nR; k++) { const psi = psiOf(k), R = Rof(psi); add(R * Math.sin(psi * DEG), DIM.YLOW + (DIM.YHIGH - DIM.YLOW) * ramp(run[k] / runTop), R * Math.cos(psi * DEG), psi <= DIM.PSI_L + 0.01 ? 'low' : 'rise'); }
  // the top turn: from the round's last heading, left about a centre RHO2 away, until the middle lies DPASS to the left of the heading's line
  let px = P[P.length - 1][0], pz = P[P.length - 1][2], hx = Math.cos(DIM.PSI_T * DEG), hz = -Math.sin(DIM.PSI_T * DEG);
  // (left of a heading (hx, hz) is (hz, -hx); the turn's centre stands RHO2 to the left; the whole angle is found first,
  // then walked in even steps of about 6 m)
  const cx = px + hz * DIM.RHO2, cz = pz - hx * DIM.RHO2, turnTo = (a) => { const c = Math.cos(a), sn = Math.sin(a); return [hx * c + hz * sn, hz * c - hx * sn]; };
  const passAt = (a) => { const [ax, az] = turnTo(a), qx = cx - az * DIM.RHO2, qz = cz + ax * DIM.RHO2; return -qx * az + qz * ax; };
  let aLo = 0.3, aHi = 2.6;
  for (let i = 0; i < 40; i++) { const am = (aLo + aHi) / 2; if (passAt(am) > DIM.DPASS) aLo = am; else aHi = am; }
  const turn = (aLo + aHi) / 2, nT = Math.round(turn * DIM.RHO2 / 6);
  for (let i = 1; i <= nT; i++) { const [ax, az] = turnTo(turn * i / nT); px = cx - az * DIM.RHO2; pz = cz + ax * DIM.RHO2; add(px, DIM.YHIGH, pz, 'top'); if (i === nT) { hx = ax; hz = az; } }
  // the leg: straight to the ring; it ends where it comes to REND beyond its nearest pass of the middle
  const along = -(px * hx + pz * hz), dn = Math.hypot(px + hx * along, pz + hz * along), legL = along + Math.sqrt(DIM.REND ** 2 - dn * dn);
  const nL = Math.round(legL / 10), level = 66;
  for (let k = 1; k <= nL; k++) { const d = legL * k / nL; add(px + hx * d, lerp(DIM.YHIGH, DIM.YEND, sm(d / (legL - level))), pz + hz * d, 'leg'); }
  const pts = P.map((q) => [mir * q[0], q[1], q[2]]);
  const path = makePath(pts, { samples: 600 });
  // the joints by the metres flown: the made line's own length shared out by the laid places
  const cum = [0];
  for (let i = 1; i < P.length; i++) cum.push(cum[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1], P[i][2] - P[i - 1][2]));
  const k = path.length / cum[cum.length - 1], last = (t) => cum[tag.lastIndexOf(t)] * k;
  const S = { arc0: last('in'), arc1: last('arc'), rise0: last('low'), rise1: last('rise'), top1: last('top'), end: path.length, leg: legL, pass: last('top') + along * k };
  const E = [mir * (px + hx * legL), DIM.YEND, pz + hz * legL], dir = [mir * hx, hz];
  return { pts, path, L: path.length, S, E, B: E, dir, mir, tag, z1, psi1 };
}

// ---------------------------------------------------------------- the sky's deal: the seed alone (G1, G2, G4)
// Bearings are degrees from the entry's own heading (0 looks along the way we come in), clockwise seen from above.
export const skyDir = (az, el) => [Math.sin(az * DEG) * Math.cos(el * DEG), Math.sin(el * DEG), -Math.cos(az * DEG) * Math.cos(el * DEG)];
const angSep = (a, b) => Math.abs(((a - b) % 360 + 540) % 360 - 180);

// THE DEAL (in the plan's own frame; the seed's hand mir turns every bearing over with the room), BY THE BUILDING'S TWO
// AXES, the same law on every seed (no seed, no lens, no still is read). A LEVEL LOOK along an axis (66 degrees, 16:9)
// holds what stands within 49 degrees to either hand of it and under 33 degrees up (less toward its upper corners).
//  THE ARRIVAL SUN (the first; the plain's key light): 27 to 33 degrees to one hand of the way in, 20.5 to 21.2 up, so
//    that the level look along the door's axis holds it WHOLE whatever its size; its storm stands beside it on the
//    dome's side, level with it or a little under, whole in that look too.
//  THE WELL-OFF ENTRY SUN: 69 to 75 degrees to the other hand, 16 to 20 up: that look holds nothing of it or of its
//    storm's body.
//  THE RING'S SUN: 27.5 to 32 degrees off the pier's axis (never on it) on the hand turned to the way in (so that the
//    level turn at the top comes round to it), 17.5 to 21.3 up and no higher than its size lets it stand whole in a
//    look along the pier that dips 4.4 degrees with the leg's fall: whole along the pier from the leg's first metre,
//    its storm beside it toward the ring. It is the ONE sun of the exit.
//  ONE OR TWO MORE (four or five suns in all), each in a place NEITHER level look holds: on the pier's side between the
//    two looks (70 to 86 degrees off the way in), or on the far side (69 to 77, or 113 to 130). The well-off entry sun
//    has one of these places; the fourth sun (always 21 to 30 up, so that two suns and more stand above 20 on every
//    seed) takes the pier's side if that is free (the round looks that way), else one of the far two by a draw; on
//    some seeds the last place has the fifth.
//  NO TWO SUNS STAND NEARER THAN 30 DEGREES: the places lie 36 degrees of bearing and more apart.
//  A storm stands on the hand of its sun that is turned to the nearer of the two axes (so it leans away from the next
//    sun; the sky adds every sun's light, so nothing is ever cut where two suns' reaches meet). A sun that a look holds has its storm beside
//    it; a sun no look holds has it steeply over it (under it, if the sun is more than 25 up), clear of both looks.
//  Hands, tearing, the storm's tilt about its sun, the count and length of its arms and how far it wraps the limb are
//    dealt from slots without return. SIZE AND HUE GO BY THE RANK IN THAT DEAL, PLAINLY SPREAD: the four suns every sky
//    has are 3.8, 4.8, 5.8 and 6.8 degrees in radius (a tenth of play), so the greatest disc of a sky is 1.72 times the
//    least and more; a fifth stands between two of them; and THE GREATER A SUN THE DEEPER AND DULLER ITS RED (the
//    greatest a deep dull red, then orange, the least a pale amber), its storm's body and shreds with it. No two suns
//    of one sky are alike: in size by 0.3 degrees and more, in hue by a sixth of the scale and more. Every one is a
//    red sun: none white, none yellow.
// the highest a thing may stand (degrees up) at `off` degrees to one hand of an axis so that a look along that axis,
// 66 degrees high and dipped 4.4 degrees, holds `reach` degrees about its middle under the frame's top
const capUnderTop = (off, reach) => {
  const T = (33 - 4.4) * DEG, A = Math.cos(T), B = Math.cos(off * DEG) * Math.sin(T), R = Math.hypot(A, B);
  return (Math.atan2(B, A) - Math.asin(clamp(Math.sin(reach * DEG) / R, -1, 1))) / DEG;
};
// THE LARGE OLD STARS (their own stream, the seed and a name): THREE TO FOUR DOZEN IN THE WHOLE SKY ON EVERY SEED (36 to 48
// by a draw, dealt one by one, so the number is the law's and not a chance of cells), unequal (0.45 to 1.5 degrees to the
// half-light, few of them great, the greater the dimmer), in loose company (near half of them bring one or two others
// 6 to 22 degrees off), no two nearer than 4 degrees. A STAR KEEPS ITS OWN RADIUS BESIDES: its middle stands no nearer a
// sun's middle than the sun's radius, 7 degrees and the star's own radius; and it STANDS IN NO STORM'S BODY: no nearer a
// storm's middle than the storm's radius, 2 degrees and the star's own radius. All stand over the horizon.
// Each: [direction, radius in degrees, gain, hue 0 (dull red) to 1 (ember), phase].
export function planStars(seed, suns) {
  const r = makeRng(hashSeed('tables-stars:' + seed)), n = r.int(36, 48), out = [];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  // (every one stands in the sky over the horizon: 1.7 degrees and more up, so the three to four dozen are all to be seen)
  const free = (v, rad) => v[1] >= 0.03 && suns.every((q) => dot(v, q.dir) < Math.cos((q.rad + 7 + rad) * DEG) && dot(v, q.storm.dir) < Math.cos((q.storm.rad + 2 + rad) * DEG)) && out.every((q) => dot(v, q.dir) < Math.cos(4 * DEG));
  const put = (v, u, g, hue, phase) => { const rad = lerp(0.45, 1.5, u * u); if (out.length < n && free(v, rad)) out.push({ dir: v, rad, gain: lerp(0.5, 0.3, u) * g, hue, phase }); };
  for (let tries = 0; out.length < n && tries < 4000; tries++) {
    const y = r.range(0.03, 1), a = r.range(0, 6.2831853), h = Math.sqrt(1 - y * y), v = [h * Math.sin(a), y, h * Math.cos(a)], c0 = r.chance(0.45), c1 = r.int(1, 2), more = c0 ? c1 : 0;
    put(v, r(), r.range(0.85, 1.15), r(), r.range(0, 100));
    // its company: one or two more, 6 to 22 degrees off it, each its own way
    const e1 = Math.abs(v[1]) < 0.9 ? [v[2], 0, -v[0]] : [1, 0, 0], l1 = Math.hypot(e1[0], e1[1], e1[2]), a1 = [e1[0] / l1, e1[1] / l1, e1[2] / l1], k1 = dot(a1, v);
    const p1 = [a1[0] - v[0] * k1, a1[1] - v[1] * k1, a1[2] - v[2] * k1], lp = Math.hypot(p1[0], p1[1], p1[2]), b1 = [p1[0] / lp, p1[1] / lp, p1[2] / lp], b2 = [v[1] * b1[2] - v[2] * b1[1], v[2] * b1[0] - v[0] * b1[2], v[0] * b1[1] - v[1] * b1[0]];
    for (let c = 0; c < 2; c++) {
      const off = r.range(6, 22) * DEG, ba = r.range(0, 6.2831853), u = r(), g = r.range(0.85, 1.15), hue = r(), phase = r.range(0, 100);
      const w = [0, 1, 2].map((i) => v[i] * Math.cos(off) + (b1[i] * Math.cos(ba) + b2[i] * Math.sin(ba)) * Math.sin(off));
      if (c < more) put(w, u, g, hue, phase);
    }
  }
  return out;
}
export function planSky(seed, exitAz, mir = 1, rare = false) {
  // TWO STREAMS, each made from the seed and a name: the sky's, which draws THE SAME DRAWS IN THE SAME ORDER ON EVERY SEED
  // whether four suns stand or five (the fifth's lot, its bearing and its height are drawn on every seed and used on some);
  // and THE FIFTH SUN'S OWN (tables-sky-fifth), from which the fifth takes the nine numbers that are its own (its size's,
  // tearing's, arm's and wrap's play, its phase, spread, its storm's tilt, distance and size). So a rare visit has the
  // same sky with one sun more: the four suns, the crowd, the sallow share, the haze, the band and the small stars' field
  // are what they would be without it.
  const r = makeRng(hashSeed('tables-sky:' + seed)), r5 = makeRng(hashSeed('tables-sky-fifth:' + seed));
  const X = exitAz * mir, suns = [];
  const u5c = r.chance(0.45), five = rare || u5c;
  const sE = r.sign();
  suns.push({ az: sE * r.range(27, 33), el: r.range(20.5, 21.2), entry: true, held: true });
  suns.push({ az: -sE * r.range(69, 75), el: r.range(16, 20), entry: true });
  // the ring's sun stands on the hand of the pier's axis that is turned to the way in (the hand the level turn comes from)
  const g = Math.sign(X) || 1;
  suns.push({ az: X - g * r.range(27.5, 32), el: r.range(17.5, 21.3), exit: true, held: true });
  // the places no look holds, as [bearing from, to]: the one on the well-off sun's hand is taken
  const pierTaken = -sE === g;
  const free = pierTaken ? [[-g * 69, -g * 77], [-g * 113, -g * 130]] : [[g * 70, g * 86], [-g * 113, -g * 130]];
  const pick = r.int(0, 1), k4 = pierTaken ? pick : 0, u4 = r(), u5 = r(), el4 = r.range(21, 30), el5 = r.range(15.5, 33);
  suns.push({ az: lerp(free[k4][0], free[k4][1], u4), el: el4 });
  if (five) suns.push({ az: lerp(free[1 - k4][0], free[1 - k4][1], u5), el: el5 });
  // slots without return
  const deal = (slots) => { const a = slots.slice(); for (let i = a.length - 1; i > 0; i--) { const j = r.int(0, i), t = a[i]; a[i] = a[j]; a[j] = t; } return a; };
  const sizes = deal([4.3, 4.95, 5.6, 6.25, 6.8]), tears = deal([0.35, 0.5, 0.65, 0.8, 0.95]), arms = deal([2, 3, 2, 3, 3]);
  const lens = deal([1.9, 2.5, 3.1, 3.7, 4.3]), wraps = deal([42, 56, 70, 84, 98]), h0 = r.sign();
  // the storm's tilt about its sun: beside it (a little under, or level) for the two suns a look holds; steeply over or
  // under it for the others
  const tiltIn = deal([-18, 3]), tiltOut = deal([62, 76, 90]);
  // SIZE AND HUE BY THE RANK IN THE DEAL (no draw more: the same shuffle of five slots as before gives each sun its
  // slot). The four suns every sky has take, by the rank of their slots among the four, the radii 3.8, 4.8, 5.8 and 6.8
  // degrees (each with a play of a tenth of a degree: so the greatest disc of a sky is 1.7 times the least and more);
  // a fifth sun takes a size between two of them (4.3, 5.3 or 6.3, by its slot's rank among the five). THE HUE GOES WITH
  // THE SIZE, one law for every sun: the greatest is a deep dull red (hue 0), the least a pale amber (hue 1), the ones
  // between orange in their order; a storm takes its sun's hue (the sky's shader). No two suns of a sky are alike in
  // size or in hue.
  const rank4 = [0, 1, 2, 3].map((i) => [0, 1, 2, 3].filter((j) => sizes[j] < sizes[i]).length), rank5 = sizes.filter((v) => v < sizes[4]).length;
  const slotRad = (i) => i < 4 ? [3.8, 4.8, 5.8, 6.8][rank4[i]] : [4.3, 4.3, 5.3, 5.3, 6.3][rank5];
  suns.forEach((q, i) => {
    const rs = i === 4 ? r5 : r;
    q.rad = slotRad(i) + rs.range(-0.15, 0.15) / 1.5; q.hue = clamp((6.8 - slotRad(i)) / 3.0, 0, 1); q.tear = tears[i] + rs.range(-0.05, 0.05); q.hand = (i % 2 ? 1 : -1) * h0; q.phase = rs.range(0, 100);
    q.arms = arms[i]; q.armLen = lens[i] + rs.range(-0.2, 0.2); q.wrap = wraps[i] + rs.range(-5, 5); q.spread = rs.range(0.75, 1.25);
    const pa = q.held ? tiltIn[i ? 1 : 0] + rs.range(-4, 4) : (q.el > 25 ? -1 : 1) * (tiltOut[i === 1 ? 0 : i - 2] + rs.range(-4, 4)), D = q.rad * rs.range(1.45, 1.9);
    const srad = q.rad * rs.range(0.85, 1.15);
    // its hand: toward the nearer of the two axes (the way in, the pier's)
    const offE = ((q.az) % 360 + 540) % 360 - 180, offX = ((q.az - X) % 360 + 540) % 360 - 180;
    const o = -(Math.sign(Math.abs(offE) < Math.abs(offX) ? offE : offX) || 1);
    // THE RING'S SUN UNDER THE LEG'S FALL: the leg comes down 2.5 m to the pier and a look along it dips with it (to 4
    // degrees), so the ring's sun, by its own size, stands no higher than the top of a look along the pier's axis dipped
    // 4.4 degrees holds it whole (half a degree to spare); its storm's body likewise. By the building's axis, on every seed.
    if (q.exit) q.el = Math.min(q.el, capUnderTop(offX, q.rad + 0.5));
    const saz = q.az + o * D * Math.cos(pa * DEG) / Math.cos(q.el * DEG);
    const sel0 = Math.max(13, q.el + D * Math.sin(pa * DEG)), sel = q.exit ? Math.max(13, Math.min(sel0, capUnderTop(((saz - X) % 360 + 540) % 360 - 180, srad + 0.5))) : sel0;
    q.tilt = sel === sel0 ? pa : Math.asin(clamp((sel - q.el) / D, -1, 1)) / DEG; q.side = o;
    q.storm = { az: saz, el: sel, rad: srad, dir: skyDir(mir * saz, sel) };
    q.dir = skyDir(mir * q.az, q.el);
  });
  const crowd = r.range(0.6, 1.0), sallow = r.range(0.15, 0.85), haze = r.chance(0.35) ? r.range(0.12, 0.3) : 0;
  // the stars' one broad band: a great circle tilted 25 to 60 degrees from the horizon's, by the seed
  const bt = r.range(25, 60) * DEG, ba = r.range(0, 360) * DEG, band = [Math.sin(bt) * Math.sin(ba), Math.cos(bt), Math.sin(bt) * Math.cos(ba)];
  const bandW = r.range(0.16, 0.26), tilt = r.range(0, 360), seedF = r.range(0, 50);
  return { suns, crowd, sallow, haze, band, bandW, tilt, seedF, X, stars: planStars(seed, suns) };
}

// ---------------------------------------------------------------- the line as samples every half metre, for every clearance law
// (with the entry's axis carried 280 m back behind the entry, level, at the entry's height: the eye of the opening flies it)
export function makeLane(route) {
  const path = route.path, L = route.L, STEP = 0.5, v = new THREE.Vector3();
  const n = Math.floor(L / STEP) + 1, back = Math.floor(280 / STEP);
  const px = new Float32Array(n + back), py = new Float32Array(n + back), pz = new Float32Array(n + back);
  for (let i = 0; i < n; i++) { path.posAtDist(Math.min(L, i * STEP), v); px[i] = v.x; py[i] = v.y; pz[i] = v.z; }
  const p0 = path.start, t0 = path.startTangent, hl = Math.hypot(t0.x, t0.z);
  for (let i = 0; i < back; i++) { const d = (i + 1) * STEP; px[n + i] = p0.x - t0.x / hl * d; py[n + i] = p0.y; pz[n + i] = p0.z - t0.z / hl * d; }
  const CELL = 8, grid = new Map(), key = (cx, cz) => cx * 4096 + cz;
  for (let i = 0; i < n + back; i++) {
    const k = key(Math.floor(px[i] / CELL), Math.floor(pz[i] / CELL));
    let a = grid.get(k); if (!a) grid.set(k, a = []); a.push(i);
  }
  // a coarse map of the plan (4 m cells): is any place of the line within about 24 m of this cell
  const CO = 4, coarse = new Set();
  for (let i = 0; i < n + back; i += 4) { const cx = Math.floor(px[i] / CO), cz = Math.floor(pz[i] / CO); for (let a = -6; a <= 6; a++) for (let b = -6; b <= 6; b++) coarse.add((cx + a) * 4096 + cz + b); }
  // least distance in space from the line to an upright cylinder (centre x,z, radius r, from y0 to y1); far ones answer 99
  const toCylinder = (x, z, r, y0, y1) => {
    let best = 99;
    if (r < 6 && !coarse.has(Math.floor(x / CO) * 4096 + Math.floor(z / CO))) return best;
    const reach = Math.ceil((r + 10) / CELL), cx = Math.floor(x / CELL), cz = Math.floor(z / CELL);
    for (let ix = cx - reach; ix <= cx + reach; ix++) for (let iz = cz - reach; iz <= cz + reach; iz++) {
      const a = grid.get(key(ix, iz)); if (!a) continue;
      for (let j = 0; j < a.length; j++) {
        const i = a[j], dh = Math.max(0, Math.hypot(px[i] - x, pz[i] - z) - r), dv = Math.max(0, y0 - py[i], py[i] - y1), d = Math.hypot(dh, dv);
        if (d < best) best = d;
      }
    }
    return best;
  };
  // THE TRUE LEAST DISTANCE IN SPACE from the line (every metre of it) to a point, however far: for the level of a thing's
  // faces (near, middling, far), which is taken by this and by nothing else
  const farFrom = (x, y, z) => { let best = 1e18; for (let i = 0; i < n + back; i += 2) { const dx = px[i] - x, dy = py[i] - y, dz = pz[i] - z, d = dx * dx + dy * dy + dz * dz; if (d < best) best = d; } return Math.sqrt(best); };
  // the least distance IN PLAN (heights left out) from the line (every half metre of it) to a place
  const planFrom = (x, z) => { let best = 1e18; for (let i = 0; i < n + back; i++) { const dx = px[i] - x, dz = pz[i] - z, d = dx * dx + dz * dz; if (d < best) best = d; } return Math.sqrt(best); };
  return { n, back, px, py, pz, STEP, toCylinder, farFrom, planFrom };
}

// THE PIER: a spur of the gallery's floor, 20 m wide, carried on columns over the terraces along the last leg's own line,
// from 64 m before the ring to the gallery's ring (where it runs into the gallery's floor at R 94).
// at(x, z) answers the place in the pier's own frame: s metres along the leg from the ring (negative before it), w metres
// to the right of the way; on(x, z): is this place on the pier's floor (not yet the gallery's)
export function makePier(route) {
  const E = route.E, d = route.dir, px = -d[1], pz = d[0];
  const at = (x, z) => ({ s: (x - E[0]) * d[0] + (z - E[2]) * d[1], w: (x - E[0]) * px + (z - E[2]) * pz });
  const xz = (sv, w) => [E[0] + d[0] * sv + px * w, E[2] + d[1] * sv + pz * w];
  // where the pier's line at w metres aside meets the gallery's inner edge (the s of that place)
  const root = (w) => { const ox = E[0] + px * w, oz = E[2] + pz * w, bq = ox * d[0] + oz * d[1], cq = ox * ox + oz * oz - DIM.RRAIL ** 2; return -bq + Math.sqrt(Math.max(0, bq * bq - cq)); };
  const on = (x, z, slack = 0) => { const q = at(x, z); return Math.abs(q.w) <= DIM.PIERW + slack && q.s >= -DIM.PIERL - slack && Math.hypot(x, z) < DIM.RRAIL; };
  return { E, d, p: [px, pz], at, xz, root, on };
}

// ---------------------------------------------------------------- the room's plan: every thing's place, by the seed alone
// Every stream is its own (the world's seed and a name), all taken here at the head, before any loop runs.
// A VISIT'S HINTS (the engine's vary): rare and mood choose among draws that are taken on every seed (a rare visit has
// the same sky with one sun more: the fifth sun's own numbers come from its own stream, tables-sky-fifth, so the four
// suns, the crowd, the haze, the band and the small stars' field are what they are without it; only the old stars that
// would stand by the fifth sun or its storm stand elsewhere). Density deals more or fewer slots in each ring of tables and more or fewer palms
// about the room: the draws that follow in those two streams (tables-tables, tables-features) are other ones at
// another density; no other stream is moved by a hint.
// THE LAW OF STANDING (C1): every solid thing keeps CLEAR (2.6 m) from the flown line in space; the pots and trunks of
// palms, lamp standards, columns, fountains with their jets and ornaments keep TALL (7 m); a palm's crown may reach over.
export async function planRoom(seed, vary = {}, brk = async () => {}) {
  const rv = makeRng(hashSeed('tables-vary:' + seed)), rst = makeRng(hashSeed('tables-stations:' + seed));
  const rf = makeRng(hashSeed('tables-features:' + seed)), rt = makeRng(hashSeed('tables-tables:' + seed));
  const rg = makeRng(hashSeed('tables-gallery:' + seed)), rp = makeRng(hashSeed('tables-plain:' + seed));
  const mir = rv.sign(), F = makeFloor(), NT = F.NT;
  await brk();
  const route = planRoute(mir);
  await brk();
  const lane = makeLane(route), pier = makePier(route);
  await brk();
  const density = clamp(vary.density ?? 1, 0.7, 1.3);
  const exitAz = Math.atan2(route.dir[0], -route.dir[1]) / DEG;
  const sky = planSky(seed, exitAz, mir, !!vary.rare);
  // shares of the cups' colours: amber leads on every seed (0.56 to 0.7), jade, rose and blue share the rest by draws
  const amber = rv.range(0.56, 0.7), sj = rv.range(0.6, 1.4), sr = rv.range(0.6, 1.4), sb = rv.range(0.5, 1.2), rest = (1 - amber) / (sj + sr + sb);
  const shadeShare = [amber, sj * rest, sr * rest, sb * rest];
  // (the mood's own draw is taken whether or not the visit hands one, so that no later draw moves by it)
  const dn0 = rv.range(0.55, 0.85), sh0 = rv.range(0, 1), rh0 = rv.range(0, 1), m0 = rv();
  const look = { dinners: dn0, stoneHue: sh0, rustHue: rh0, mood: vary.mood ?? m0, clothTurn: rv.int(0, 3), cupTurn: rv.int(0, 5) };
  const W = (R, th) => [mir * R * Math.sin(th * DEG), R * Math.cos(th * DEG)];
  const polar = (x, z) => ({ R: Math.hypot(x, z), th: ((Math.atan2(mir * x, z) / DEG) % 360 + 360) % 360 });
  const aisles = [0, 45, 90, 135, 180, 225, 270, 315];
  // metres aside of the nearest aisle's middle line (aisles run from the pit's edge up to the top level)
  const aisleOff = (R, th) => { let best = 1e9; for (const a of aisles) { const d = angSep(th, a); if (d < 90) best = Math.min(best, R * Math.sin(d * DEG)); } return best; };
  const feats = [], solids = [], columns = [];
  // a thing's body as upright cylinders [r, y0, y1, dx, dz, the distance it must keep] about its foot
  const T = DIM.TALL, Cl = DIM.CLEAR;
  const bodyOf = {
    // the pot and the bent trunk keep TALL; the crown as made (fronds to 1.15 of the reach about the trunk's head, which the
    // lean carries off the foot; tips drooping to 3.3 m under it, arches to 2.7 m over it, 0.35 m of sway) keeps CLEAR
    palm: (o) => [[1.15, 0, 1.4, 0, 0, T], [0.45 + o.lean * o.h, 0, o.h, 0, 0, T], [1.15 * o.reach + 0.4, o.h - 3.3, o.h + 2.7, Math.sin(o.turn * DEG) * o.lean * o.h, Math.cos(o.turn * DEG) * o.lean * o.h, Cl]],
    fountain: (o) => [[3.1, 0, 1.1, 0, 0, T], [2.3, 0, o.jet + 0.6, 0, 0, T]],
    ornament: (o) => [[o.wide, 0, o.h + 0.2, 0, 0, T]],
    urn: () => [[1.2, 0, 2.1, 0, 0, Cl]],
    standard: () => [[0.5, 0, 3.4, 0, 0, T], [1.08, 3.4, 5.0, 0, 0, T]],
  };
  const fits = (x, z, y, cyl) => { for (const c of cyl) if (lane.toCylinder(x + c[3], z + c[4], c[0], y + c[1], y + c[2]) < c[5]) return false; return true; };
  const freeOf = (x, z, foot) => feats.every((f) => Math.hypot(f.x - x, f.z - z) > f.foot + foot + 1.2);
  // THE BOWL IS OPEN TO THE FOUNTAIN (the room's own law, by radius and bearing of its plan; nothing of the flown line is
  // read, so it is the same wherever a line is laid): the tall things of the arena (palm, lamp standard, ornament, small
  // fountain) stand from the promenade's middle ring (R 60) outward; between that ring and the pit nothing tall stands
  // but lamp standards at the aisles' heads, and those no nearer than 14 m inward of the ring; and none stands within
  // 20 m (palm), 14 m (standard), 15 m (ornament, small fountain) to either hand of the door's aisle, wall to pit.
  const OPEN = { palm: 20, standard: 14, ornament: 15, fountain: 15 };
  const bowlOpen = (kind, R, x, z) => {
    const D = OPEN[kind];
    if (!D) return true;
    if (z > 0 && Math.abs(x) < D) return false;
    return R >= DIM.RC || (kind === 'standard' && R <= DIM.RC - D);
  };
  // is a round plan (centre, radius) under the gallery's slab or under the pier's floor
  const SOFFIT = DIM.YG - 1 - 0.55, underFloor = (px, pz, rr) => { const Rq = Math.hypot(px, pz); return (Rq + rr > DIM.RRAIL && Rq - rr < DIM.RD) || pier.on(px, pz, rr); };
  const footOf = { palm: 1.3, fountain: 3.2, ornament: 0, urn: 1.15, standard: 0.7 };
  const deal = (kind, r) => {
    if (kind === 'palm') return { h: r.range(9, 14), reach: r.range(3.3, 4.4), lean: r.range(0, 0.1), turn: r.range(0, 360), phase: r.range(0, 30), fronds: r.int(11, 15) };
    if (kind === 'fountain') return { jet: r.range(5, 8), phase: r.range(0, 30), turn: r.range(0, 360) };
    if (kind === 'ornament') { const h = r.range(5, 10); return { h, wide: h * r.range(0.24, 0.34), sort: r.int(0, 5), turn: r.range(0, 360), glaze: r.int(0, 3) }; }
    if (kind === 'urn') return { turn: r.range(0, 360), bloom: r.int(0, 2) };
    return { turn: r.range(0, 360) };
  };
  // put a thing at (R, th) if a flat holds its foot, no aisle or thing is under it and the law of standing is kept;
  // where: 'arena' (by the floor's own level), 'gallery', 'pier', 'under' (the top level under the gallery)
  const place = (kind, o, R, th, where = 'arena') => {
    const foot = kind === 'ornament' ? o.wide + 0.3 : footOf[kind];
    let y;
    if (where === 'gallery' || where === 'pier') y = DIM.YG;
    else if (where === 'under') y = DIM.YOUT;
    else {
      if (R < DIM.RPIT + 1.6 || R > DIM.RD - 2.5) return null;
      const k = F.terraceOf(R), fl = F.flat(k), lo = fl[0] + foot + 0.5, hi = fl[1] - foot - 0.5;
      if (lo > hi) return null;
      R = clamp(R, lo, hi); y = k * F.drop;
      if (aisleOff(R, th) < foot + 1.9) return null;
    }
    const [x, z] = W(R, th);
    if (where !== 'gallery' && where !== 'pier' && pier.cols.some((q) => Math.hypot(q.x - x, q.z - z) < foot + 2.6)) return null;
    if (!freeOf(x, z, foot)) return null;
    const cyl = bodyOf[kind](o);
    if (where === 'arena' && !bowlOpen(kind, R, x, z)) return null;
    // A THING UNDER A FLOOR (the pier's, the gallery's slab; by the building's plan, nothing of the line): a part of a
    // thing of the arena whose plan lies under one of them ends half a metre and more under its soffit (the beams'
    // underside, 20.45 m up), or the thing does not stand there
    if (where === 'arena' && cyl.some((q) => y + q[2] > SOFFIT - 0.5 && underFloor(x + q[3], z + q[4], q[0]))) return null;
    // a palm's fronds keep their reach from every column's shaft (the gallery's ring of columns, the pier's)
    if (kind === 'palm' && where === 'arena') { const q = cyl[2], hx = x + q[3], hz = z + q[4]; if (columns.some((k) => Math.hypot(k.x - hx, k.z - hz) < q[0] + 1.3) || pier.cols.some((k) => Math.hypot(k.x - hx, k.z - hz) < q[0] + 1.3)) return null; }
    if (!fits(x, z, y, cyl)) return null;
    const f = { kind, x, y, z, R, th, foot, where, key: seed + ':' + feats.length, ...o };
    feats.push(f);
    for (const c of cyl) solids.push({ kind, x: x + c[3], z: z + c[4], r: c[0], y0: y + c[1], y1: y + c[2], need: c[5] });
    return f;
  };
  // the pier's columns: pairs 6.5 m either side of its middle line every 12 m, from the floor under them to its soffit
  pier.cols = [];
  for (let s0 = -DIM.PIERL + 4; s0 < -3; s0 += 12) for (const w of [-6.5, 6.5]) {
    // (a column that would stand in an aisle is moved 3.5 m along the pier)
    let [x, z] = pier.xz(s0, w), R = Math.hypot(x, z);
    if (aisleOff(R, polar(x, z).th) < 3) { [x, z] = pier.xz(s0 + 3.5, w); R = Math.hypot(x, z); }
    if (R > DIM.RRAIL - 3) continue;
    const q = { x, z, y: F.terraceOf(R) * F.drop, R };
    pier.cols.push(q); solids.push({ kind: 'piercolumn', x, z, r: 1.6, y0: q.y, y1: DIM.YG - 1, need: T });
  }
  // the columns of the gallery's edge (every 7.5 degrees; the pair by the door stands 6.6 degrees either side of its axis,
  // 10.8 m from it, so that the way in and the arc that leaves it are 7 m clear of both)
  for (let i = 0; i < DIM.NCOL; i++) { let th = (i + 0.5) * 360 / DIM.NCOL; if (i === 0) th = 6.6; if (i === DIM.NCOL - 1) th = 353.4; const [x, z] = W(DIM.RRAIL, th); columns.push({ x, z, th, R: DIM.RRAIL }); }
  await brk();
  return planRoomB({ brk, seed, rv, rst, rf, rt, rg, rp, mir, NT, F, route, lane, pier, density, sky, exitAz, shadeShare, look, W, polar, aisles, aisleOff, feats, solids, fits, freeOf, deal, place, footOf, columns });
}

async function planRoomB(c) {
  const { brk, rst, rf, rg, F, NT, route, lane, pier, density, W, polar, aisles, aisleOff, feats, solids, deal, place, mir, footOf, columns } = c;
  // ---- THE PROMENADE'S ROWS (dealt by the room; nothing of the line is read): at one even spacing round the whole ring
  // from a seeded start, by turns palm, urn, palm, ornament, palm, urn: the urns and the slender ornaments on the
  // promenade's outer edge, the palms on the first terrace over it, each leaning its own way by its own draw; and on the
  // promenade's inner edge a row of low urns at the same spacing, half a step on (the bowl is open: nothing tall stands
  // there). The law of standing then decides which of them stand.
  const cycle = ['palm', 'urn', 'palm', 'ornament', 'palm', 'urn'], c0 = rst.int(0, 5), NROW = 28, th0 = rst.range(0, 360 / NROW), f6 = F.flat(6), f7 = F.flat(7);
  for (let i = 0; i < NROW; i++) {
    const kind = cycle[(c0 + i) % cycle.length], o = deal(kind, rst), th = th0 + i * 360 / NROW;
    if (kind === 'palm') { o.h = 10 + (o.h - 9) * 0.6; o.lean = 0.03 + o.lean * 0.5; }
    if (kind === 'ornament') { o.h = 4.5 + (o.h - 5) * 0.4; o.wide = Math.min(o.wide, 1.2); }
    const q = place(kind, o, kind === 'palm' ? (f7[0] + f7[1]) / 2 : f6[1] - 1.7 - (kind === 'ornament' ? o.wide : 0), th);
    if (q) q.row = 'outer';
    const u = place('urn', deal('urn', rst), f6[0] + 1.7, th + 180 / NROW);
    if (u) u.row = 'inner';
  }
  await brk();
  // ---- at the heads of the aisles on every level, by draws: an urn of flowers, a lamp standard, nothing; on the outer
  // terraces also a palm or a slender ornament (each stands as far aside of the aisle as its own foot asks)
  for (const a of aisles) for (let k = 1; k <= NT; k++) for (const sd of [-1, 1]) {
    const u = rf(), R = F.flat(k)[0] + 1.6, kind = u < 0.34 ? 'urn' : u < 0.74 ? 'standard' : u < 0.8 ? null : k < 7 ? null : u < 0.92 ? 'palm' : 'ornament';
    if (!kind) continue;
    const o = deal(kind, rf);
    if (kind === 'ornament') { o.h = 4.5 + (o.h - 5) * 0.4; o.wide = Math.min(o.wide, 1.2); }
    const aside = Math.max(3.05, (kind === 'ornament' ? o.wide + 0.3 : footOf[kind]) + 1.95);
    place(kind, o, R, a + sd * Math.asin(aside / R) / DEG);
  }
  await brk();
  // ---- about the room by draws (a draw that finds no room is passed over): small fountains on the promenade just
  // outside its middle ring, ornaments and palms from that ring outward (the bowl is open to the fountain)
  const scatter = (kind, count, r0, r1) => { for (let i = 0, tries = 0; i < count && tries < count * 14; tries++) { const o = deal(kind, rf), R = Math.sqrt(rf.range(r0 * r0, r1 * r1)), th = rf.range(0, 360); if (place(kind, o, R, th)) i++; } };
  scatter('fountain', rf.int(3, 5), DIM.RC, DIM.RC + 1);
  await brk();
  scatter('ornament', rf.int(8, 11), DIM.RC, 91);
  await brk();
  scatter('palm', Math.round(rf.int(26, 34) * density), DIM.RC, 91.5);
  await brk();
  // ---- the gallery: palms by the glass, standards along the rail, urns at the glass; the ring's surroundings kept open
  const E = route.E;
  const nearRing = (x, z, d) => Math.hypot(x - E[0], z - E[2]) < d;
  const onGallery = (kind, o, R, th, keep) => { const [x, z] = W(R, th), q = pier.at(x, z); if (nearRing(x, z, keep) || (Math.abs(q.w) < DIM.PIERW + 1.6 && q.s > -12 && q.s < 16)) return null; return place(kind, o, R, th, 'gallery'); };
  const j0 = rg.range(0, 20);
  for (let th = j0; th < 360 + j0 - 1; th += 20) { const o = deal('palm', rg); o.h = rg.range(8, 10.5); o.reach = rg.range(3.0, 3.5); onGallery('palm', o, 103.2, th + rg.range(-4, 4), 17); }
  for (let th = 7.5; th < 360; th += 15) onGallery('standard', deal('standard', rg), DIM.RRAIL + 1.5, th, 10);
  for (let th = 6; th < 360; th += 12) onGallery('urn', deal('urn', rg), 108.2, th, 10);
  await brk();
  // ---- the pier: lamp standards along both edges, two great lamp columns 8.6 m either side of the way just before the ring
  for (let sv = -DIM.PIERL + 3; sv < -8; sv += 12.2) for (const w of [-8.3, 8.3]) { const [x, z] = pier.xz(sv, w), q = polar(x, z); place('standard', deal('standard', rg), q.R, q.th, 'pier'); }
  const special = [];
  for (const w of [-8.6, 8.6]) {
    const [x, z] = pier.xz(-2.5, w);
    special.push({ kind: 'baycolumn', x, y: DIM.YG, z, h: 10.4, r: 0.85 });
    feats.push({ kind: 'baycolumn', x, y: DIM.YG, z, foot: 1.2, where: 'pier' });
    solids.push({ kind: 'baycolumn', x, z, r: 1.35, y0: DIM.YG, y1: DIM.YG + 11.6, need: DIM.TALL });
  }
  // under the gallery: urns against the wall between the columns' bearings, the door's place kept open
  for (let th = 15; th < 360; th += 15) if (angSep(th, 0) > 12) place('urn', deal('urn', rg), 107.6, th, 'under');
  for (const q of columns) solids.push({ kind: 'column', x: q.x, z: q.z, r: 1.8, y0: DIM.YOUT, y1: DIM.YG - 1, need: DIM.TALL });
  return planRoomC({ ...c, special, nearRing });
}

// THE TABLES' KINDS (C2). body: upright cylinders [r, top, dx] (dx along the table's own length) for the law of standing;
// cups: the candle cups' places on it [x, y, z, size] in its own frame (x along its length, z away from the room's middle)
export const TABLES = {
  two: { body: [[1.15, 1.3, 0]], cups: [[0, 0.8, 0, 0.85]], seats: 0.42, chairs: [2, 2] },
  four: { body: [[1.5, 1.3, 0]], cups: [[0, 0.8, 0, 1]], seats: 0.66, chairs: [2, 4] },
  eight: { body: [[2.4, 1.7, 0]], cups: [[0, 1.02, 0, 1.5]], seats: 1.36, chairs: [6, 8] },
  long: { body: [[1.75, 1.5, -2.3], [1.75, 1.5, 0], [1.75, 1.5, 2.3]], cups: [[-2.1, 0.8, 0, 1], [0, 0.8, 0, 1], [2.1, 0.8, 0, 1]], seats: 0, chairs: [0, 0] },
  booth: { body: [[2.6, 1.6, 0]], cups: [[0, 0.8, 0, 1]], seats: 0, chairs: [0, 0] },
  station: { body: [[1.9, 2.0, 0]], cups: [[-1.1, 0.96, 0, 0.7], [1.1, 0.96, 0, 0.7]], seats: 0, chairs: [0, 0] },
};

// THE PARTY'S TABLE (round t1): HOLD, the distance in space under which a table is held by the lens; ENOUGH, the hold
// a table for four must have to be the party's as it stands; N, the bearing in the table's own frame (degrees; a cover
// stands 45 degrees to either hand of it) that is turned to the line's nearest place
export const PARTY = { HOLD: 7, ENOUGH: 5, N: 16.35 };

// THE BROKEN GROUND KEEPS OFF THE BUILDING, BY EACH SLAB'S OWN OUTLINE (plan polygons [x, z], convex):
// clipHalf: the part of a polygon with x * nx + z * nz >= d; outsideRect: the parts of it outside a rectangle (to four
// pieces, each convex); circleInRect: does a round plan come within a rectangle
const clipHalf = (poly, nx, nz, d) => {
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length], da = a[0] * nx + a[1] * nz - d, db = b[0] * nx + b[1] * nz - d;
    if (da >= 0) out.push(a);
    if ((da >= 0) !== (db >= 0)) { const t = da / (da - db); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); }
  }
  return out;
};
const polyArea = (p) => { let s = 0; for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; s += a[0] * b[1] - b[0] * a[1]; } return Math.abs(s) / 2; };
const outsideRect = (poly, x0, x1, z0, z1) => {
  const mid = clipHalf(clipHalf(poly, 1, 0, x0), -1, 0, -x1);
  if (mid.length < 3 || !clipHalf(clipHalf(mid, 0, 1, z0), 0, -1, -z1).length) return [poly];
  return [clipHalf(poly, -1, 0, -x0), clipHalf(poly, 1, 0, x1), clipHalf(mid, 0, -1, -z0), clipHalf(mid, 0, 1, z1)].filter((p) => p.length >= 3 && polyArea(p) > 1.5);
};
const circleInRect = (x, z, r, q) => x + r > q[0] && x - r < q[1] && z + r > q[2] && z - r < q[3];

// THE LEVELS OF FACES, by the true distance in space from the flown line (metres), at build: a table is near under 11,
// middling under 30, far beyond; a palm is plainer beyond 24, an urn beyond 20. Faces only: no state goes out with a level.
export const LOD = { near: 11, mid: 30, palm: 24, urn: 20 };

// how far a table of each kind reaches from its middle with its chairs drawn back at their own angles (metres): about its
// middle (REACH: what must keep off a column's base and a neighbour) and along its ring (HALF: half its own length there)
const REACH = { two: 1.52, four: 1.76, eight: 2.46, long: 1.75, booth: 2.6, station: 1.9 };
const HALF = { two: 1.52, four: 1.76, eight: 2.46, long: 3.2, booth: 2.4, station: 1.65 };

async function planRoomC(c) {
  const { brk, rt, rp, F, NT, route, lane, pier, W, polar, aisleOff, feats, solids, shadeShare, look, nearRing, columns, mir, density } = c;
  // ---- the rings of tables: one on every narrow level, two on the promenade, three under the gallery and three on it
  const rings = [{ R: 23.6, y: 0, where: 'arena', mix: 'small' }];
  for (let k = 1; k <= 11; k++) {
    const fl = F.flat(k), y = k * F.drop;
    if (k === 6) rings.push({ R: 55.9, y, where: 'arena', mix: 'wide', inward: 1 }, { R: 64.1, y, where: 'arena', mix: 'wide', inward: -1 });
    else rings.push({ R: (fl[0] + fl[1]) / 2 + 0.06, y, where: 'arena', mix: 'narrow', level: k });
  }
  rings.push({ R: 96.7, y: DIM.YOUT, where: 'under', mix: 'wide', inward: 0 }, { R: 101.3, y: DIM.YOUT, where: 'under', mix: 'small' }, { R: 105.7, y: DIM.YOUT, where: 'under', mix: 'booths' });
  rings.push({ R: 98.2, y: DIM.YG, where: 'gallery', mix: 'small' }, { R: 102.4, y: DIM.YG, where: 'gallery', mix: 'wide', inward: 0 }, { R: 106.6, y: DIM.YG, where: 'gallery', mix: 'small' });
  // long tables stand on three of the narrow levels, by the seed
  const longOn = new Set([1 + Math.floor(rt() * 5), 7 + Math.floor(rt() * 3), 10 + Math.floor(rt() * 2)]);
  const CUPSEQ = [0, 0, 1, 0, 2, 0, 0, 3, 0, 1, 0, 2];
  const tables = [];
  const pick = (u) => { let a = 0; for (let i = 0; i < 4; i++) { a += shadeShare[i]; if (u < a) return i; } return 0; };
  // one table (or booth, or serving station) at a place, if the law of standing and the things already there allow it
  const put = (kind, x, y, z, rot, where, lot) => {
    if (kind === 'two' && lot.state > 1) lot.state = 1;
    const K = TABLES[kind], cs = Math.cos(rot * DEG), sn = Math.sin(rot * DEG);
    const top = lot.state === 3 ? Math.max(K.body[0][1], 1.95) : K.body[0][1];
    let dl = 99;
    for (const b of K.body) {
      const bx = x + b[2] * cs, bz = z - b[2] * sn;
      if (!feats.every((f) => Math.hypot(f.x - bx, f.z - bz) > f.foot + b[0] + 0.25)) return null;
      // a table with its chairs keeps off every column's base (1.5 m about the column's middle, and a hand more)
      const rb = Math.max(b[0], REACH[kind]) + 1.6;
      if (where !== 'gallery' && where !== 'pier' && (pier.cols.some((q) => Math.hypot(q.x - bx, q.z - bz) < rb) || (y > 10 && columns.some((q) => Math.hypot(q.x - bx, q.z - bz) < rb)))) return null;
      dl = Math.min(dl, lane.toCylinder(bx, bz, b[0], y, y + top));
    }
    if (dl < DIM.CLEAR) return null;
    // chairs [bearing about the table, distance, facing] in the table's own frame: pushed in where the table is not yet
    // used, drawn back at their own angles where dinner is under way
    // (the chairs' own stream: the seed and a name, by the table's ring and slot; never made from a draw)
    const rc = makeRng(hashSeed('tables-chairs:' + c.seed + ':' + lot.key)), chairs = [], used = lot.state > 0;
    if (kind === 'long') {
      for (const sz of [-1, 1]) for (let j = 0; j < 5; j++) { const lx = -2.4 + j * 1.2 + rc.range(-0.08, 0.08), lz = sz * (0.78 + (used ? rc.range(0.1, 0.6) : rc.range(0, 0.08))); if (rc() < 0.93) chairs.push([Math.atan2(lx, lz) / DEG, Math.hypot(lx, lz), (sz > 0 ? 0 : 180) + (used ? rc.range(-35, 35) : rc.range(-4, 4))]); }
    } else if (K.seats) {
      const nc = kind === 'two' ? 2 : lot.state === 1 ? 2 : rc.int(K.chairs[0] + (used ? 1 : 0), K.chairs[1]), a0 = rc.range(0, 360);
      for (let j = 0; j < nc; j++) { const a = a0 + j * 360 / nc + rc.range(-10, 10); chairs.push([a, K.seats + (used ? rc.range(0.2, 0.75) : rc.range(0.02, 0.12)), a + (used ? rc.range(-40, 40) : rc.range(-4, 4))]); }
    }
    // THE LEVEL OF ITS FACES (0 near, 1 middling, 2 far): by the true distance in space from the flown line to its top's
    // middle, at build. Its dinner, its flame, its steam and its glow are its own lot at every level.
    const df = lane.farFrom(x, y + 0.8, z);
    const t = { kind, x, y, z, rot, cloth: lot.cloth, shade: lot.shade, state: lot.state, chairs, lod: df < LOD.near ? 0 : df < LOD.mid ? 1 : 2, where, phase: lot.cseed * 40 };
    tables.push(t);
    for (const b of K.body) solids.push({ kind: 'table', x: x + b[2] * cs, z: z - b[2] * sn, r: b[0], y0: y, y1: y + top, need: DIM.CLEAR });
    return t;
  };
  let ri = 0;
  for (const ring of rings) {
    await brk();
    const pitch = 4.5 / Math.sqrt(density), n = Math.floor(2 * Math.PI * ring.R / pitch), ph = rt(), cup0 = CUPSEQ[(ri + look.cupTurn) % CUPSEQ.length], cloth0 = (ri + look.clothTurn) % 4;
    ri++;
    // EACH KIND TAKES ITS OWN LENGTH ALONG THE RING AND 0.6 m: a thing stands at its slot, or as far on along the ring
    // as the last thing put (with its chairs) and its own half length ask; a slot whose thing would be moved a whole
    // slot on is passed over, and the ring closes on its first thing by the same measure
    const slotM = 2 * Math.PI * ring.R / n;
    let endAt = -1e9, firstAt = null;
    for (let i = 0; i < n; i++) {
      // every slot draws its own lot first, kept or not, so that a slot's look does not hang on its neighbours' fate
      const th0 = (i + ph) * 360 / n, rot0 = rt.range(0, 360), uc = rt(), cl = rt.int(0, 3), us = rt(), sh = pick(rt()), u = rt(), cseed = rt(), uk = rt();
      const cloth = uc < 0.68 ? cloth0 : cl, shade = us < 0.72 ? cup0 : sh;
      let state = u > look.dinners ? 0 : u < look.dinners * 0.3 ? 3 : u < look.dinners * 0.64 ? 2 : 1;
      const m = ring.mix, nearAisle = ring.where === 'arena' && aisleOff(ring.R, th0) < 2.9 + pitch;
      let kind = 'four';
      if (m === 'small') kind = uk < 0.3 ? 'two' : 'four';
      else if (m === 'narrow') kind = longOn.has(ring.level) && uk < 0.16 ? 'long' : uk < 0.42 ? 'two' : nearAisle && uk > 0.8 ? 'station' : 'four';
      else if (m === 'wide') kind = uk < 0.3 ? 'eight' : uk < 0.5 ? 'two' : uk > 0.93 ? 'station' : 'four';
      else if (m === 'booths') kind = uk < 0.56 ? 'booth' : uk < 0.68 ? 'station' : 'four';
      if (kind === 'two' && state > 1) state = 1;
      if (kind === 'eight' && state === 1) state = 2;
      if (kind === 'long' || kind === 'booth') state = state ? 2 : 0;
      if (kind === 'station') state = 3;
      const a0 = th0 * DEG * ring.R, aPos = Math.max(a0, endAt + HALF[kind]), th = aPos / ring.R / DEG;
      if (aPos - a0 >= slotM || (firstAt !== null && aPos + HALF[kind] + 0.6 > firstAt + 2 * Math.PI * ring.R)) continue;
      // the eights of a wide ring stand 0.7 m further into their level; long tables, booths and stations lie along the ring
      const R = ring.R + (kind === 'eight' ? (ring.inward || 0) * 0.7 : 0), [x, z] = W(R, th), along = Math.atan2(x, z) / DEG;
      const rot = kind === 'long' || kind === 'booth' || kind === 'station' ? along : rot0;
      if (ring.where === 'arena' && aisleOff(R, th) < TABLES[kind].body[0][0] + 1.4 + (kind === 'long' ? 2.3 : 0)) continue;
      if (ring.where === 'under' && Math.abs(x) < 6.5 + TABLES[kind].body[0][0] && z > 0) continue;
      if (ring.where === 'gallery') { const q = pier.at(x, z); if (nearRing(x, z, 12) || (Math.abs(q.w) < DIM.PIERW + 2.6 && q.s > -14 && q.s < 16)) continue; }
      const t = put(kind, x, ring.y, z, rot, ring.where, { cloth, shade, state, cseed, key: (ri - 1) + ':' + i });
      if (t) { endAt = aPos + HALF[kind] + 0.6; if (firstAt === null) firstAt = aPos - HALF[kind]; }
    }
  }
  await brk();
  // ---- the pier: two rows of laid tables 4.7 m either side of the red runner, from its head to 11 m before the ring
  // THE LONG TABLE OF THE GALLERY (round t1, E), BY THE PIER'S OWN PLAN: it lies along the pier's row of tables on the hand
  // of the way that is turned to the room's middle (the fountain's hand), its middle 35 m before the ring, 18.6 m long
  // (three times a long table of the room); the five tables of that row whose places it covers do not stand (their
  // lots are drawn all the same, so no stream moves). The same on every seed, for every visitor.
  const hallSide = Math.sign(pier.at(0, 0).w) || 1, hall = { s: -35, w: hallSide * 4.7, len: 18.6, y: DIM.YG, inner: -hallSide, turn: Math.atan2(-route.dir[1], route.dir[0]) };
  { const q = pier.xz(hall.s, hall.w); hall.x = q[0]; hall.z = q[1]; }
  for (let d = -hall.len / 2 + 1; d <= hall.len / 2 - 1 + 1e-6; d += (hall.len - 2) / 8) { const q = pier.xz(hall.s + d, hall.w); solids.push({ kind: 'halltable', x: q[0], z: q[1], r: 1.9, y0: DIM.YG, y1: DIM.YG + 1.7, need: DIM.CLEAR }); }
  for (let sv = -DIM.PIERL + 2.6, j = 0; sv < -11; sv += 4.4, j++) for (const w of [-4.7, 4.7]) {
    const rot0 = rt.range(0, 360), cl = rt.int(0, 3), sh = pick(rt()), u = rt(), cseed = rt(), [x, z] = pier.xz(sv, w);
    if (w * hallSide > 0 && Math.abs(sv - hall.s) < hall.len / 2 + 0.5) continue;
    put((j + (w > 0 ? 1 : 0)) % 3 === 2 ? 'two' : 'four', x, DIM.YG, z, rot0, 'pier', { cloth: u < 0.6 ? (look.clothTurn + 1) % 4 : cl, shade: sh, state: u > look.dinners ? 0 : u < look.dinners * 0.3 ? 3 : u < look.dinners * 0.64 ? 2 : 1, cseed, key: 'pier:' + j + ':' + (w > 0 ? 1 : 0) });
  }
  // ---- THE PARTY'S TABLE (round t1, A): ONE round table of the near level, laid for four, where a party has just been
  // sitting. THE LAW (the flown line's fourth deal, at build, the same for every visitor; no seed, still, clock or lens
  // is read): every round table of the near level has a HOLD: the sum, over the half metres of the line from which its
  // top stands nearer than 7 m in space AND in the wedge between the way ahead and the room's middle (the hand the
  // gaze's one pull turns the lens to), of what its distance lacks of 7 m. THE PARTY'S TABLE IS THE TABLE FOR FOUR WITH
  // THE GREATEST HOLD, if that hold is 5 and more; else the round table of any size (two, four, eight) with the
  // greatest hold, RELAID FOR FOUR where it stands (only where a table for four keeps the law of standing there: the
  // keep from the line, from every thing and from every column, by the same measures as put() above); its cloth, cup,
  // dinner and steam stay its own lot. If no table has a hold, no party's table stands. Its four chairs stand at its
  // four covers, pushed back a little (their own stream: tables-party), and it is TURNED so that the place between two
  // of its covers looks to the line's nearest place (PARTY.N: where its number stands); c is the hand the lens comes from.
  let party = null;
  {
    const n = lane.n, holdOf = (t) => {
      let h = 0, best = 1e9, at = 0;
      for (let i = 0; i < n - 4; i++) {
        const vx = lane.px[i], vz = lane.pz[i], d = Math.hypot(vx - t.x, lane.py[i] - (t.y + 0.8), vz - t.z);
        if (d < best) { best = d; at = i; }
        if (d >= PARTY.HOLD) continue;
        const hx = lane.px[i + 4] - vx, hz = lane.pz[i + 4] - vz, tx = t.x - vx, tz = t.z - vz, aT = Math.atan2(hx * tz - hz * tx, hx * tx + hz * tz), aM = Math.atan2(hz * vx - hx * vz, -hx * vx - hz * vz);
        if (aT * aM > 0 && Math.abs(aT) <= Math.abs(aM)) h += lane.STEP * (PARTY.HOLD - d);
      }
      return { t, h, best, at };
    };
    const rb = REACH.four + 1.6, K4 = TABLES.four.body[0];
    const fitsFour = (t) => t.kind !== 'two' || (lane.toCylinder(t.x, t.z, K4[0], t.y, t.y + K4[1]) >= DIM.CLEAR && feats.every((f) => Math.hypot(f.x - t.x, f.z - t.z) > f.foot + K4[0] + 0.25)
      && (t.where === 'gallery' || t.where === 'pier' || !(pier.cols.some((q) => Math.hypot(q.x - t.x, q.z - t.z) < rb) || (t.y > 10 && columns.some((q) => Math.hypot(q.x - t.x, q.z - t.z) < rb)))));
    const held = tables.filter((t) => t.lod === 0 && (t.kind === 'four' || t.kind === 'two' || t.kind === 'eight')).map(holdOf).filter((q) => q.h > 0 && fitsFour(q.t)).sort((a, b) => b.h - a.h || a.at - b.at);
    const four = held.find((q) => q.t.kind === 'four'), got = four && four.h >= PARTY.ENOUGH ? four : held[0];
    if (got) {
      const t = got.t, wrapD = (a) => ((a % 360) + 540) % 360 - 180, was = t.kind;
      if (was !== 'four') {
        const sol = solids.find((q) => q.kind === 'table' && q.x === t.x && q.z === t.z);
        if (sol) { sol.r = K4[0]; sol.y1 = t.y + (t.state === 3 ? Math.max(K4[1], 1.95) : K4[1]); }
        t.kind = 'four';
      }
      const bN = Math.atan2(lane.px[got.at] - t.x, lane.pz[got.at] - t.z) / DEG, ic = Math.max(0, got.at - 12), bC = Math.atan2(lane.px[ic] - t.x, lane.pz[ic] - t.z) / DEG;
      const hand = wrapD(bC - bN) >= 0 ? 1 : -1, rcp = makeRng(hashSeed('tables-party:' + c.seed));
      t.rot = wrapD(bN - PARTY.N); t.party = true;
      // the four chairs at the four covers, in the order of the places: 1 (toward the line, on the hand the lens comes
      // from), 2 (toward the line, the other hand), 3 (beyond the table from the line, on the coming hand), 4
      t.chairs = [45, -45, 135, -135].map((k) => { const a = PARTY.N + hand * k; return [a, TABLES.four.seats + rcp.range(0.27, 0.4), a + rcp.range(-11, 11)]; });
      const cs = Math.cos(t.rot * DEG), sn = Math.sin(t.rot * DEG), toWorld = (lx, ly, lz) => [t.x + lx * cs + lz * sn, t.y + ly, t.z - lx * sn + lz * cs];
      party = { t, x: t.x, y: t.y, z: t.z, rot: t.rot, hand, was, hold: got.h, least: got.best, near: got.at * lane.STEP, toWorld };
    }
  }
  // ---- the porch: six columns before the door; THE CAUSEWAY's lamp standards, 8.6 m either side of the way every 17 m
  // from the stair's foot out past the flight's first metre
  const porch = { columns: [], lamps: [] };
  for (const ax of [8.6, 14.2, 19.8]) for (const sd of [-1, 1]) { porch.columns.push({ x: sd * ax, z: DIM.RPORCH - 1.2 }); solids.push({ kind: 'porchcolumn', x: sd * ax, z: DIM.RPORCH - 1.2, r: 1.5, y0: DIM.YOUT, y1: DIM.YOUT + 12.4, need: DIM.TALL }); }
  for (let k = 0; k < WAY.NL; k++) for (const sd of [-1, 1]) { const q = { x: sd * WAY.XL, z: WAY.Z0 + k * WAY.DZ }; porch.lamps.push(q); solids.push({ kind: 'waylamp', x: q.x, z: q.z, r: 1.5, y0: DIM.YPLAIN, y1: DIM.YWAY + 7.4, need: DIM.TALL }); }
  await brk();
  // ---- THE BROKEN GROUND before the dome and on both hands of the causeway: a mosaic of slabs (a warped grid of corners
  // by draws; each slab drawn in from its corners so that fissures gape between them, tilted its own way, lifted or
  // sunk), some split in two, a few missing (rubble lies there); upthrust ridges; boulders. None on the causeway.
  const ground = { slabs: [], ridges: [] }, rocks = [], dust = [];
  // WHAT THE BROKEN GROUND KEEPS OFF, by each slab's own outline (their plan and 0.5 m): BUILT, the porch, the stair, the
  // forecourt and the cheek blocks as one rectangle; the causeway with its kerb (the slabs' first line of corners stands
  // 0.5 m off it); the drum's foot (a slab is cut back along the tangent before it); and a slab under a lamp's plinth is
  // cut back from the plinth's square by 0.3 m. A slab is left out by its middle as before, or drawn back by its outline.
  const BUILT = [-27.7, 27.7, 0, DIM.RSTEPS + 7.4], plinths = porch.lamps.map((q) => [q.x - 1.15, q.x + 1.15, q.z - 1.15, q.z + 1.15]);
  // ---- THE PARKED CRAFT (round t1, B), BY THE BUILDING'S PLAN (the door's axis and the arrival sun's hand; nothing of
  // the lens): ONE BLACK SHIP lies on the broken ground beside the causeway, on the hand of the way in under the
  // arrival sun, along the way (its bow to the dome), its middle 24 m aside of the way's middle and 154 m from the
  // room's middle: 46 m long, 9 m in the beam, 5.4 m high; and two smaller dull craft of other shapes across the way
  // from it (the hull itself would hide whatever stood beyond it), further aside of the way and nearer the drum. Each is a thing of the ground: no ridge, boulder or rubble stands within its outline and a
  // metre (the same law as for the building's plan), and it keeps TALL from the line many times over.
  const sunHand = Math.sign(c.sky.suns[0].dir[0]) || 1;
  const ship = { x: sunHand * 24, z: 154, len: 46, beam: 9, high: 5.4, turn: 0, hand: sunHand, sort: 'black' };
  const craft = [{ x: -sunHand * 37, z: 135, len: 17, beam: 7.5, high: 5.2, turn: sunHand * 24, hand: -sunHand, sort: 'barrel' }, { x: -sunHand * 61, z: 123, len: 21, beam: 8, high: 3.6, turn: -sunHand * 38, hand: -sunHand, sort: 'wedge' }];
  const parked = [ship, ...craft].map((q) => { const ct = Math.abs(Math.cos(q.turn * DEG)), st = Math.abs(Math.sin(q.turn * DEG)), hx = (q.beam * ct + q.len * st) / 2 + 1, hz = (q.len * ct + q.beam * st) / 2 + 1; return [q.x - hx, q.x + hx, q.z - hz, q.z + hz]; });
  for (const q of [ship, ...craft]) { q.y = groundTop(q.x, q.z); for (let d = -q.len / 2 + q.beam / 2; d <= q.len / 2 - q.beam / 2 + 1e-6; d += Math.max(1, (q.len - q.beam) / 6)) solids.push({ kind: 'craft', x: q.x + d * Math.sin(q.turn * DEG), z: q.z + d * Math.cos(q.turn * DEG), r: q.beam / 2 + 0.6, y0: DIM.YPLAIN - 3, y1: q.y + q.high + 1.2, need: DIM.TALL }); }
  const NX = 15, colX = (i) => WAY.HALF + 0.8 + 7.4 * i + 0.5 * i * i, rowZ = (j) => (j >= 0 ? 100 + 8.5 * j + 0.13 * j * j : 100 + 11 * j);
  const corner = new Map(), cornerAt = (i, j) => { const key = i * 512 + j + 100000; let q = corner.get(key); if (!q) { const ai = Math.abs(i) - 1, x0 = Math.sign(i) * colX(ai), gx = ai > 0 ? colX(ai) - colX(ai - 1) : 6, gz = rowZ(j + 1) - rowZ(j); q = [x0 + (ai > 0 ? rp.range(-0.3, 0.3) * gx : 0), rowZ(j) + rp.range(-0.3, 0.3) * gz]; corner.set(key, q); } return q; };
  for (let j = -6; j < 23; j++) {
    for (const sd of [-1, 1]) for (let i = 1; i <= NX; i++) {
      const A = cornerAt(sd * i, j), B = cornerAt(sd * (i + 1), j), Cq = cornerAt(sd * (i + 1), j + 1), D = cornerAt(sd * i, j + 1);
      const u = rp(), gap = rp.range(0.3, 0.85), tilt = rp.range(0.03, 0.2), ta = rp.range(0, 6.283), lift = rp.range(-0.5, 0.7), u2 = rp(), tilt2 = rp.range(0.05, 0.24), ta2 = rp.range(0, 6.283), lift2 = rp.range(-0.7, 0.5);
      const cx = (A[0] + B[0] + Cq[0] + D[0]) / 4, cz = (A[1] + B[1] + Cq[1] + D[1]) / 4, R = Math.hypot(cx, cz);
      if (R < DIM.RD + 9 || R > 345) continue;
      if (cz < DIM.RPORCH + 8 && Math.abs(cx) < 31) continue;
      if (u < 0.07) {
        // (rubble where a slab is missing: only where its whole round plan is clear of the building and the plinths)
        const k = { x: cx, z: cz, r: rp.range(1.2, 2.6), h: rp.range(0.8, 2.2), turn: rp.range(0, 360), sort: rp.int(0, 2), low: 1 };
        if (!circleInRect(cx, cz, k.r * 1.3 + 0.5, BUILT) && !plinths.some((q) => circleInRect(cx, cz, k.r * 1.3 + 0.3, q))) rocks.push(k);
        continue;
      }
      const slab = (poly, tl, tang, lf) => {
        const mx = poly.reduce((a, q) => a + q[0], 0) / poly.length, mz = poly.reduce((a, q) => a + q[1], 0) / poly.length, ml = Math.hypot(mx, mz) || 1;
        const drawn = poly.map((q) => { const dx = q[0] - mx, dz = q[1] - mz, l = Math.hypot(dx, dz) || 1, k = Math.max(0.3, 1 - gap / l); return [mx + dx * k, mz + dz * k]; });
        const yc = groundTop(mx, mz) + lf, tx = tl * Math.cos(tang), tz = tl * Math.sin(tang);
        // drawn back from the building, the drum's foot and the plinths by its own outline (a piece keeps the slab's own plane)
        let parts = outsideRect(drawn, BUILT[0], BUILT[1], BUILT[2], BUILT[3]);
        if (Math.abs(mx) < 40) for (const q of plinths) parts = parts.flatMap((p) => outsideRect(p, q[0], q[1], q[2], q[3]));
        if (ml < DIM.RD + 40) parts = parts.map((p) => (p.every((q) => q[0] * mx / ml + q[1] * mz / ml >= DIM.RD + 3.2) ? p : clipHalf(p, mx / ml, mz / ml, DIM.RD + 3.2))).filter((p) => p.length >= 3 && polyArea(p) > 1.5);
        for (const p of parts) {
          if (p === drawn) { ground.slabs.push({ poly: drawn, cx: mx, cz: mz, yc, tx, tz }); continue; }
          const px = p.reduce((a, q) => a + q[0], 0) / p.length, pz = p.reduce((a, q) => a + q[1], 0) / p.length;
          ground.slabs.push({ poly: p, cx: px, cz: pz, yc: yc + tx * (px - mx) + tz * (pz - mz), tx, tz, cut: 1 });
        }
      };
      if (u2 < 0.26) { slab([A, B, Cq], tilt, ta, lift); slab([A, Cq, D], tilt2, ta2, lift2); } else slab([A, B, Cq, D], tilt, ta, lift);
    }
    if (j % 8 === 7) await brk();
  }
  // ridges: long plates thrust up steeply, 16 m and more aside of the way. WHAT ONE KIND OF THE GROUND IS KEPT OFF, EVERY
  // KIND IS: a ridge whose drawn outline (its length by its breadth and the scarp's foot, 1.1 m beyond the crest's side)
  // comes within the building's plan (BUILT, with its 0.5 m) or a plinth's square (with its 0.3 m) is LEFT OUT. It was
  // dealt all the same (dealt holds it for the others' spacing), so the stream's draws are the same on every seed.
  const dealt = [];
  for (let i = 0, tries = 0; i < 9 && tries < 80; tries++) {
    const x = rp.sign() * rp.range(17, 95), z = rp.range(112, 300), len = rp.range(13, 30), turn = rp.range(-35, 35), rise = rp.range(2.6, 5.5), wide = rp.range(3.5, 7);
    if (Math.hypot(x, z) < DIM.RD + 16 + len / 2 || dealt.some((q) => Math.hypot(q[0] - x, q[1] - z) < 30)) continue;
    // its nearest part stays 12 m and more from the way's middle
    if (Math.abs(x) - len / 2 * Math.abs(Math.sin(turn * DEG)) - wide / 2 < 12) continue;
    dealt.push([x, z]); i++;
    const face = Math.sign(x), rct = Math.cos(turn * DEG), rst = Math.sin(turn * DEG), RP = (d, e) => [x + d * rst + e * rct * face, z + d * rct - e * rst * face];
    const outline = [RP(-len / 2, -wide / 2), RP(len / 2, -wide / 2), RP(len / 2, wide / 2 + 1.1), RP(-len / 2, wide / 2 + 1.1)];
    if (outsideRect(outline, BUILT[0], BUILT[1], BUILT[2], BUILT[3])[0] !== outline || plinths.some((q) => outsideRect(outline, q[0], q[1], q[2], q[3])[0] !== outline) || parked.some((q) => outsideRect(outline, q[0], q[1], q[2], q[3])[0] !== outline)) continue;
    ground.ridges.push({ x, z, len, turn, rise, wide, face });
    for (let d = -len / 2; d <= len / 2; d += 3) solids.push({ kind: 'ridge', x: x + d * Math.sin(turn * DEG), z: z + d * Math.cos(turn * DEG), r: wide / 2 + 0.5, y0: DIM.YPLAIN - 3, y1: groundTop(x, z) + rise + 0.4, need: DIM.CLEAR });
  }
  // boulders: on the far plain all round, and nearer among the slabs (never within 9 m of the way's middle)
  for (let i = 0, tries = 0; i < 120 && tries < 1100; tries++) {
    const R = DIM.RD + 14 + 440 * Math.pow(rp(), 1.7), th = rp.range(0, 360), r = rp.range(0.9, 4.2) * (1 + R / 500), h = r * rp.range(0.35, 1.5), turn = rp.range(0, 360), sort = rp.int(0, 2);
    const x = R * Math.sin(th * DEG), z = R * Math.cos(th * DEG);
    if (z > 60 && Math.abs(x) < WAY.XL + 2.5 + r * 1.3) continue;
    if (z < DIM.RPORCH + 8 && z > 0 && Math.abs(x) < 33) continue;
    if (circleInRect(x, z, r * 1.3 + 0.5, BUILT)) continue;
    rocks.push({ x, z, r, h, turn, sort }); i++;
  }
  // (a boulder or a heap of rubble whose round plan comes within a parked craft's outline does not stand: it was dealt
  // all the same, so the stream's draws are the same)
  for (let i = rocks.length - 1; i >= 0; i--) if (parked.some((q) => circleInRect(rocks[i].x, rocks[i].z, rocks[i].r * 1.3 + 0.5, q))) rocks.splice(i, 1);
  // ---- THE DRIFT OF OLD SHOES (round t1, D), BY THE CAUSEWAY'S PLAN (its own stream: tables-shoes): on the hand of the
  // way in turned from the arrival sun (the black ship has the other), a low heap on a slab of the first row beside the
  // kerb, 9.5 m aside of the way's middle (4 m clear of the kerb, whose own height would stand before a nearer heap
  // for anyone on the way): on the slab that holds the heap's middle and a metre and a half about it and
  // lies nearest (along the way) to the place 3.5 m on toward the dome from the causeway's third pair of lamps; and a
  // scatter about it; a few more lie singly along that side. A shoe lies on the slab under it, by that slab's own
  // plane (one that would fall in a fissure or on the paving does not lie); half sunk; each its own kind, size,
  // colour and way of lying. The heap's middle is looked for from 163 m of the room's middle down to 136 m, so that no
  // shoe lies within 30 m of the flight's first place or on the porch's stair (and where that whole strip has no slab
  // to hold it, a metre and more further aside).
  const shoes = [], rs = makeRng(hashSeed('tables-shoes:' + c.seed)), heap = { x: -sunHand * 9.5, z: WAY.Z0 + 2 * WAY.DZ - 3.5, r: 1.6 };
  const slabAt = (x, z) => { for (const sl of ground.slabs) { if (Math.abs(sl.cx - x) > 14 || Math.abs(sl.cz - z) > 14) continue; const p = sl.poly; let pos = 0, neg = 0; for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length], cr = (b[0] - a[0]) * (z - a[1]) - (b[1] - a[1]) * (x - a[0]); if (cr > 0) pos++; else neg++; } if (!pos || !neg) return sl; } return null; };
  { const z0 = heap.z; let found = false;
    for (const ox of [9.5, 10.5, 11.5, 12.5, 14]) {
      const hx = -sunHand * ox, holds = (z) => { const sl = slabAt(hx, z); return sl && slabAt(hx, z - 1.3) === sl && slabAt(hx, z + 1.3) === sl && slabAt(hx - sunHand * 1.4, z) === sl; };
      for (let d = 0; d <= 25.5 && !found; d += 0.5) { if (holds(z0 - d)) { heap.x = hx; heap.z = z0 - d; found = true; } else if (d <= 1.5 && holds(z0 + d)) { heap.x = hx; heap.z = z0 + d; found = true; } }
      if (found) break;
    } }
  const shoe = (x, z, up) => {
    const uk = rs(), kind = uk < 0.35 ? 2 : uk < 0.65 ? 1 : uk < 0.9 ? 0 : 3, size = rs.range(0.95, 1.3), turn = rs.range(0, 360), col = rs.int(0, 7), lie = rs(), sink = rs.range(0.15, 0.5), sl = slabAt(x, z);
    if (!sl || Math.abs(x) < WAY.HALF + 0.9) return;
    shoes.push({ x, z, y: sl.yc + sl.tx * (x - sl.cx) + sl.tz * (z - sl.cz) + up, kind, size, turn, col, lie, sink, tx: sl.tx, tz: sl.tz });
  };
  for (let i = 0; i < 64; i++) { const rr = heap.r * Math.pow(rs(), 0.7), a = rs.range(0, 6.2831853), lift = rs.range(0.35, 1); shoe(heap.x + rr * Math.sin(a), heap.z + rr * Math.cos(a), 0.55 * Math.pow(1 - rr / heap.r, 1.4) * lift); }
  for (let i = 0; i < 26; i++) { const rr = rs.range(heap.r, 5.5), a = rs.range(0, 6.2831853); shoe(heap.x + rr * Math.sin(a), heap.z + rr * Math.cos(a), 0); }
  for (let i = 0; i < 9; i++) shoe(-sunHand * rs.range(6.3, 13), rs.range(134, 168), 0);
  // ---- THE HOST'S PLACE (round t1, F), BY THE BANDSTAND'S OWN PLAN: on the dais before the middle of its first arc of
  // chairs (the arc turned to the door; the bandstand's own stream gives that bearing as its first draw), 19.4 m from
  // the room's middle: a pool of light 2 m in radius on the dais's floor. (Round t2: the pool is EMPTY; the bare
  // microphone stand that round t1 stood in it is taken out. host.b, the bearing, is kept for whoever reads the plan.)
  const hostB = makeRng(hashSeed('tables-bandstand:' + c.seed)).range(0, 0.35), host = { b: hostB, R: 19.4, x: Math.sin(hostB) * 19.4, y: DIM.YDAIS, z: Math.cos(hostB) * 19.4, r: 2.0 };
  // (a boulder among the slabs sits on their level; one where a slab is missing lies in the hole; the rest on the plain)
  for (const k of rocks) { const among = Math.hypot(k.x, k.z) < 345 && k.z > 34; k.y = k.low ? groundTop(k.x, k.z) - 1.2 : among ? groundTop(k.x, k.z) - 0.7 : plainY(k.x, k.z) - 0.4; solids.push({ kind: 'rock', x: k.x, z: k.z, r: k.r * 1.3, y0: DIM.YPLAIN - 3, y1: k.y + k.h * 1.05, need: DIM.CLEAR }); }
  // ---- A SOFA WHERE NO SOFA SHOULD BE (round t2), BY THE CAUSEWAY'S PLAN (no stream, no draw; nothing of the lens, a
  // seed, a still or a clock): ONE large leather sofa (2.3 m long) stands alone on a slab of the broken ground beside
  // the causeway, on the hand of the way in under the arrival sun (the black ship's hand: the shoes have the other),
  // between the kerb and the ship, SQUARE TO THE WAY, its front turned out along the way (toward whoever comes to the
  // door). THE LAW: it stands as near the way as a slab will hold it. Its whole plan with a hand's margin (2.5 m by
  // 1.2 m) must lie on ONE slab (a slab cut about a lamp's plinth is still one slab: its pieces keep one plane), clear
  // of every boulder, heap of rubble, ridge, lamp and craft. Its middle is looked for 7.3 to 8 m aside of the way's
  // middle (the slabs' first line is 6 m and a little more aside): FIRST in the bay between the causeway's first and
  // second pair of lamps (139.5 m from the room's middle, and to 6 m either way along the way), on a slab that slopes
  // less than 1 in 8, and failing that on a steeper one; THEN in the next bay out (156.5 m) likewise; of the places
  // that will do, the nearest aside (a tenth of a metre at a time), then the nearest to the bay's middle (half a metre
  // at a time, the dome's way first). Only where nothing within 8 m aside holds it is it looked for further aside, half
  // a metre at a time to 13 m, by the same order. So it keeps off both pairs of lamps, stands 37 m and more from the
  // flight's first place, and keeps 6.9 m and more from the line in space. It stands ON THAT SLAB'S OWN PLANE, tilted
  // as the slab is. Where no slab holds it, no sofa stands. (Round t3 changes its covering only, to a patterned cloth:
  // nothing of this plan.)
  let sofa = null;
  {
    const HX = 1.25, HZ = 0.6, nearBy = ground.slabs.filter((sl) => sl.cx * sunHand > -2 && sl.cx * sunHand < 30 && sl.cz > 118 && sl.cz < 178), yOn = (sl, x, z) => sl.yc + sl.tx * (x - sl.cx) + sl.tz * (z - sl.cz);
    const at = (x, z) => { for (const sl of nearBy) { const p = sl.poly; let pos = 0, neg = 0; for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length], cr = (b[0] - a[0]) * (z - a[1]) - (b[1] - a[1]) * (x - a[0]); if (cr > 0) pos++; else neg++; } if (!pos || !neg) return sl; } return null; };
    const inWay = solids.filter((q) => (q.kind === 'rock' || q.kind === 'ridge' || q.kind === 'waylamp' || q.kind === 'craft') && q.x * sunHand > -4 && q.x * sunHand < 34 && q.z > 110 && q.z < 186);
    const holds = (x, z, steep) => {
      const sl = at(x, z);
      if (!sl || Math.hypot(sl.tx, sl.tz) > steep) return null;
      for (const [a, b] of [[-HX, -HZ], [HX, -HZ], [HX, HZ], [-HX, HZ], [0, -HZ], [0, HZ]]) { const s2 = at(x + a, z + b); if (!s2 || s2.tx !== sl.tx || s2.tz !== sl.tz || Math.abs(yOn(s2, x, z) - yOn(sl, x, z)) > 1e-6) return null; }
      const rect = [x - HX, x + HX, z - HZ, z + HZ];
      return inWay.some((q) => circleInRect(q.x, q.z, q.r + 0.3, rect)) ? null : sl;
    };
    const near = [], far = []; for (let k = 0; k <= 7; k++) near.push(7.3 + 0.1 * k); for (let k = 1; k <= 10; k++) far.push(8 + 0.5 * k);
    search: for (const band of [near, far]) for (const z0 of [WAY.Z0 + WAY.DZ / 2, WAY.Z0 + 1.5 * WAY.DZ]) for (const steep of [0.125, 9]) for (const ox of band) for (let d = 0; d <= 6.01; d += 0.5) for (const sg of d ? [-1, 1] : [1]) {
      const x = sunHand * ox, z = z0 + sg * d, sl = holds(x, z, steep);
      if (sl) { sofa = { x, z, y: yOn(sl, x, z), tx: sl.tx, tz: sl.tz, aside: ox, hand: sunHand, len: 2.3 }; break search; }
    }
    if (sofa) solids.push({ kind: 'sofa', x: sofa.x, z: sofa.z, r: 1.3, y0: sofa.y - 0.4, y1: sofa.y + 1.1, need: DIM.CLEAR });
  }
  // the plain's dust: low wisps (under 2 m), 70 m and more aside of the way and 60 m and more from the drum
  for (let i = 0, tries = 0; i < 30 && tries < 400; tries++) {
    const R = DIM.RD + 60 + 330 * rp(), th = rp.range(0, 360), x = R * Math.sin(th * DEG), z = R * Math.cos(th * DEG), size = rp.range(14, 24), period = rp.range(18, 34), phase = rp();
    if (Math.abs(x) < 70 && z > 0) continue;
    dust.push({ x, z, size, period, phase }); i++;
  }
  // ---- CHANDELIERS of candle cups, each HUNG BY A ROD OF DARK COPPER FROM THE DOME'S IRON OVER IT, each turning slowly on
  // the world's clock from its own phase. Ten are dealt, 36 degrees apart, under the dome's lower strong ring (R 75.3,
  // y 64); a hoop is 3.45 to 4.65 m in radius, its frame 4.5 m high, its lowest part 38.8 m up and more.
  // THE CLEARANCE (the flown line's own lawful deal, the same law as for every solid thing): NO CHANDELIER HANGS WITHIN
  // 18 M IN PLAN OF THE FLOWN LINE. One that would is dealt OUTWARD ALONG ITS OWN BEARING from the room's axis, half a
  // metre at a time, to the first place that is clear and where it still hangs under the dome at its own dealt height
  // (a rod of a metre and more over its frame, its hoop 1.4 m and more under the glass); it hangs there from a bar of
  // the dome's iron laid between the two ribs over it. If no place on its bearing is clear it is left out. No draw is
  // made for this: the ten are drawn on every seed as before. (The placing stands between hand-backs of its own.)
  await brk();
  const chand = [], nCh = 10, ch0 = rt.range(0, 36), CHK = 1.5, CHKEEP = 18;
  const ironY = (R) => DIM.YG + (DIM.HD - 0.5) * Math.sqrt(Math.max(0, 1 - (R / (DIM.RD - 0.5)) ** 2));
  for (let i = 0; i < nCh; i++) {
    const th = ch0 + i * 360 / nCh, q = { th, y: 40 + rt.range(0, 5), r: rt.range(2.3, 3.1) * CHK, k: CHK, rate: rt.sign() * rt.range(0.05, 0.09), phase: rt.range(0, 6.283), n: 12 };
    for (let R = 75.3; R <= 104 && q.R === undefined; R += 0.5) {
      const [x, z] = W(R, th);
      if (lane.planFrom(x, z) >= CHKEEP && ironY(R) - (q.y + 3.0 * CHK) >= 1.0 && domeY(R + q.r) - (q.y + 0.6) >= 1.4) { q.R = R; q.x = x; q.z = z; q.top = ironY(R); q.moved = R > 75.3; }
    }
    if (q.R !== undefined) chand.push(q);
  }
  await brk();
  for (const q of chand) solids.push({ kind: 'chandelier', x: q.x, z: q.z, r: q.r + 0.5, y0: q.y - 1.3, y1: q.top, need: DIM.TALL });
  solids.push({ kind: 'greatfountain', x: 0, z: 0, r: DIM.RPOOL + 0.9, y0: 0, y1: 1.2, need: DIM.TALL }, { kind: 'greatfountain', x: 0, z: 0, r: 10.2, y0: 0, y1: DIM.HFOUNT + 3, need: DIM.TALL }, { kind: 'bandstand', x: 0, z: 0, r: DIM.RDAIS1 + 0.6, y0: 0, y1: 5.6, need: DIM.TALL });
  const counts = { tables: tables.length, near: tables.filter((t) => t.lod === 0).length, mid: tables.filter((t) => t.lod === 1).length };
  for (const t of tables) counts[t.kind] = (counts[t.kind] || 0) + 1;
  for (const f of feats) counts[f.kind] = (counts[f.kind] || 0) + 1;
  return { seed: c.seed, mir, NT, F, route, lane, pier, sky: c.sky, exitAz: c.exitAz, shadeShare, look, aisles: c.aisles, feats, special: c.special, columns, tables, porch, ground, rocks, dust, chand, solids, counts, W, polar: c.polar, density, party, hall, ship, craft, shoes, heap, host, sofa };
}

// THE DOOR'S OWN MEASURES AND LIGHTS (one place for the building, the small glows and the room's light by place):
// the opening is 13 m wide on the wall's outer face and SPLAYED to 18 m on its inner face (so that from the stair's foot
// on the reveals and their lamps stand behind the outer arris, and the room fills more than half the frame's width at
// every metre from there in); a lamp on each reveal and on each folded leaf at the height the lens passes; a row of nine small lights let into the coffered soffit along the door's axis, from the door's head
// to the gallery's edge
export const DOOR = (() => {
  const hw = DIM.DOORW / 2, hi = hw + 2.5, lw = hw - 0.1, RO = DIM.RD + 2.2, zi = Math.sqrt(DIM.RD ** 2 - hi * hi), zo = Math.sqrt(RO ** 2 - hw * hw), len = Math.hypot(hi - hw, zo - zi);
  const yLamp = DIM.YLENS0 + 0.05, lamps = [], row = [], leaves = [];
  for (const sd of [-1, 1]) {
    // the reveal's lamp stands 0.32 m off its middle; the leaf's 0.62 m off the leaf's middle plane
    lamps.push([sd * ((hw + hi) / 2 - 0.32 * (zo - zi) / len), yLamp, (zi + zo) / 2 - 0.32 * (hi - hw) / len]);
    const xm = sd * (hw + 0.15 + lw / 2), zm = Math.sqrt(RO ** 2 - xm * xm) + 0.24, tw = Math.asin(xm / RO);
    leaves.push({ xm, zm, tw }); lamps.push([xm + 0.62 * Math.sin(tw), yLamp, zm + 0.62 * Math.cos(tw)]);
  }
  for (let z = 95; z <= 111.01; z += 2) row.push([0, DIM.YG - 1 - 0.008, z]);
  return { hw, hi, lw, RO, zi, zo, len, yLamp, lamps, row, leaves, bay: 6.6 };
})();

// THE CAUSEWAY (the crew's own): paving 5 m either side of the way from the stair's foot to 500 m out; lamp standards on
// plinths among the slabs. groundTop: the level the slabs' tops lie about, by place (a low swell before the dome's door).
export const WAY = { HALF: 5, XL: 8.6, Z0: 131, DZ: 17, NL: 10, ZEND: 500 };
export const groundTop = (x, z) => 7.7 + 3.0 * Math.exp(-((x / 50) ** 2)) * smoothstep(20, 100, z);

// ================================================================ THE SKY (its own shader)
// It takes: uTime (the world's clock), uSun[5], uStorm[5], uSunP[5], uSunQ[5], uSunR[5], uSunH[5], uSky, uBand, uTilt (all dealt once from the seed).
// Nothing else: no u, no metres, no place of the lens; the dome's vertices are turned by the view's rotation only.
const SKY_VERT = /* glsl */`
varying vec3 vDir;
void main() {
  vDir = position;
  vec4 p = projectionMatrix * vec4(mat3(viewMatrix) * position, 1.0);
  if (abs(p.w) < 1e-4) p.w = 1e-4;
  gl_Position = p.xyww;
}`;

const SKY_NOISE = /* glsl */`
float h11(float p) { p = fract(p * 0.1031); p *= p + 33.33; p *= p + p; return fract(p); }
float h21(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float h31(vec3 p3) { p3 = fract(p3 * 0.1031); p3 += dot(p3, p3.zyx + 31.32); return fract((p3.x + p3.y) * p3.z); }
vec3 h33(vec3 p3) { p3 = fract(p3 * vec3(0.1031, 0.1030, 0.0973)); p3 += dot(p3, p3.yxz + 33.33); return fract((p3.xxy + p3.yxx) * p3.zyx); }
float vn2(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }
float vn3(vec3 p) { vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  float a = mix(mix(h31(i), h31(i + vec3(1.0, 0.0, 0.0)), f.x), mix(h31(i + vec3(0.0, 1.0, 0.0)), h31(i + vec3(1.0, 1.0, 0.0)), f.x), f.y);
  float b = mix(mix(h31(i + vec3(0.0, 0.0, 1.0)), h31(i + vec3(1.0, 0.0, 1.0)), f.x), mix(h31(i + vec3(0.0, 1.0, 1.0)), h31(i + vec3(1.0, 1.0, 1.0)), f.x), f.y);
  return mix(a, b, f.z); }
float fbm2(vec2 p) { float s = 0.0, a = 0.5; s += a * vn2(p); p = p * 2.03 + 7.1; a *= 0.5; s += a * vn2(p); p = p * 2.01 + 3.7; a *= 0.5; s += a * vn2(p); return s / 0.875; }
float fbm3(vec3 p) { float s = 0.0, a = 0.5; s += a * vn3(p); p = p * 2.03 + 7.1; a *= 0.5; s += a * vn3(p); p = p * 2.01 + 3.7; a *= 0.5; s += a * vn3(p); p = p * 2.02 + 1.3; a *= 0.5; s += a * vn3(p); return s / 0.9375; }
mat2 rot2(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
`;

// THE STARS (D2): A DARK HEAVEN OF OLD STARS. cellOf: the sphere as six faces of cells; a star (or none) in the middle
// part of each cell.
// starOld: the LARGE DIM BLOATED EMBER STARS, 36 to 48 in the whole sky on every seed (planStars deals them one by one), in
// loose company: each a soft swollen glow, brightest at its middle, falling away to nothing in a wide dull halo; ember
// and dull red, sullen; no disc, no limb, no ring; never sallow, never white.
// starDust: the small stars, FEW, dim and red (ember, dull red, sallow: no white, no blue), thin everywhere and a little
// thicker in the drifts (starDens); the band is all but gone. Never an even sprinkle of soft discs of one size.
const SKY_STARS = /* glsl */`
uniform vec4 uBand;
uniform vec4 uStarA[48];
uniform vec4 uStarB[48];
void cellOf(vec3 d, float cells, out vec2 id, out float face, out vec3 f) {
  vec3 a = abs(d); vec2 uv;
  if (a.x >= a.y && a.x >= a.z) { f = vec3(sign(d.x), 0.0, 0.0); uv = d.yz / max(a.x, 1e-4); face = 0.0 + step(0.0, d.x); }
  else if (a.y >= a.z) { f = vec3(0.0, sign(d.y), 0.0); uv = d.xz / max(a.y, 1e-4); face = 2.0 + step(0.0, d.y); }
  else { f = vec3(0.0, 0.0, sign(d.z)); uv = d.xy / max(a.z, 1e-4); face = 4.0 + step(0.0, d.z); }
  vec2 w = atan(uv) * 1.2732395;
  id = min(floor((w * 0.5 + 0.5) * cells), vec2(cells - 1.0));
}
vec3 starAt(vec2 id, float face, vec3 f, float cells, vec2 jit, float margin) {
  vec2 cw = ((id + 0.5 + (jit - 0.5) * (1.0 - margin)) / cells) * 2.0 - 1.0;
  vec2 cu = tan(cw * 0.7853982);
  vec3 c;
  if (face < 2.0) c = vec3(f.x, cu.x, cu.y); else if (face < 4.0) c = vec3(cu.x, f.y, cu.y); else c = vec3(cu.x, cu.y, f.z);
  return normalize(c);
}
vec3 starHue(float h, float sallow) {
  vec3 red = vec3(0.95, 0.27, 0.17), sal = vec3(0.92, 0.72, 0.42), ember = vec3(1.0, 0.47, 0.17);
  return h < 0.3 ? ember : mix(red, sal, step(1.0 - sallow, fract(h * 7.31)));
}
// how thick the small stars stand here: the band (a great circle, ragged), the drifts, a thin scatter everywhere
float starDens(vec3 n, float seedF) {
  // (a square is written q * q: pow is kept for bases held at or over nought only)
  float bq = dot(n, uBand.xyz) / uBand.w;
  float band = exp(-bq * bq) * (0.35 + 0.65 * smoothstep(0.3, 0.7, fbm3(n * 5.0 + vec3(seedF, 2.0, 9.0))));
  float drift = smoothstep(0.56, 0.8, fbm3(n * 2.4 + vec3(4.0, seedF, 1.0)));
  return clamp(0.02 + 0.12 * band + 0.4 * drift, 0.0, 1.0);
}
// THE LARGE OLD STARS (uStarA: direction and the cosine of where a star has come to nothing; uStarB: its radius to the
// half-light in radians, its gain, its hue from dull red to ember, its phase). Each is brightest at its middle and falls
// away smoothly to nothing in a wide dull halo: no disc, no limb, no ring. Bloated, sullen; never sallow, never white.
vec3 starOld(vec3 d, float t) {
  vec3 sum = vec3(0.0);
  for (int i = 0; i < 48; i++) {
    vec4 A = uStarA[i], B = uStarB[i];
    float cd = dot(d, A.xyz);
    if (B.y <= 0.0 || cd <= A.w) continue;
    // (the angle is taken by the chord: acos of a cosine near one is coarse in 32 bits and would ring the star's heart)
    float x = length(d - A.xyz) / B.x;
    float body = exp(-x * x * 1.1), halo = 0.22 * exp(-x * 1.15), fall = 1.0 - smoothstep(2.2, 3.2, x);
    float mott = 0.82 + 0.18 * vn3((d - A.xyz) / B.x * 1.6 + vec3(B.w, t * 0.03, B.w * 0.37));
    float pulse = 1.0 + 0.12 * sin(t * 6.2831853 / (7.0 + 12.0 * fract(B.w * 0.37)) + B.w);
    // (deep hues: on the screen a light's green and blue stand nearer its red than in these numbers, and a paler
    // heart read sallow there: dull red to ember, the heart ember, none sallow, none white)
    vec3 hue = mix(vec3(0.9, 0.13, 0.07), vec3(1.0, 0.27, 0.06), B.z);
    sum += mix(hue, vec3(1.0, 0.34, 0.09), 0.35 * exp(-x * x * 4.0)) * (body + halo) * fall * mott * B.y * pulse;
  }
  return sum;
}
// A small star's lot is weighed ONCE, AT ITS OWN MIDDLE: whether it stands is the thinning read at the star's middle
// (lay: which way this layer is turned, so the middle is turned back to the heaven's own frame; thin: the layer's share),
// never at the pixel, so no star is cut through. And A STAR ENDS INSIDE ITS CELL: its light has come to nothing at rEnd,
// six tenths of its middle's least distance from the cell's edges (the cells' least stretch on the sphere is 0.667), and
// its radius is held so that its core lies wholly inside that.
vec3 starDust(vec3 d, float cells, float seed, float gain, float t, float sallow, float thin, int lay, float seedF, float rMin, float rMax) {
  vec2 id; float face; vec3 f;
  cellOf(d, cells, id, face, f);
  vec3 hs = h33(vec3(id, face * 7.0 + seed)), h2 = h33(vec3(id.yx + 1.3, face * 3.0 + seed + 5.0));
  vec3 c = starAt(id, face, f, cells, hs.xy, 0.3);
  vec2 jc = 0.5 + (hs.xy - 0.5) * 0.7;
  float cell = 1.5707963 / cells, rEnd = min(min(jc.x, 1.0 - jc.x), min(jc.y, 1.0 - jc.y)) * cell * 0.6;
  float rho = length(d - c);
  if (rho >= rEnd) return vec3(0.0);
  vec3 nc = lay == 0 ? vec3(-c.y, c.z, c.x) : lay == 1 ? vec3(c.z, -c.x, c.y) : c;
  if (hs.z > starDens(nc, seedF) * thin) return vec3(0.0);
  float r = min(mix(rMin, rMax, h2.x * h2.x * h2.x) * cell, rEnd / 2.2);
  float x = rho / max(r, 1e-5);
  float core = exp(-x * x * 1.5), glint = exp(-x * 1.3) * 0.07, ends = 1.0 - smoothstep(0.7, 1.0, rho / rEnd);
  float tw = 0.75 + 0.25 * sin(t * (0.5 + 1.6 * h2.y) + h2.z * 40.0);
  return starHue(h2.z, sallow) * vec3(1.0, 0.72, 0.6) * gain * mix(0.5, 1.6, h2.x) * tw * (core + glint) * ends;
}
`;

const SKY_SUN = /* glsl */`
// A BENT THREAD (quadratic Bezier) seen from pos: the places along it (0 at the sun, 1 in the storm) where its distance
// from pos turns, and the distances there. One place where the thread is seen from outside its bend (three = 0: x only);
// THREE inside the bend (three = 1): x and y the two near places, z the far place between them. Where the second and
// third are born they are one place, so a light summed as x + y - z has no jump there, and none where the nearer of the
// two near places changes (the old law took the nearest only and jumped there: a short line in the storm).
void bezTurns(vec2 pos, vec2 A, vec2 B, vec2 C, out vec3 dd, out vec3 tt, out float three) {
  vec2 a = B - A, b = A - 2.0 * B + C, c = a * 2.0, d = A - pos;
  float kk = 1.0 / max(dot(b, b), 1e-5);
  float kx = kk * dot(a, b), ky = kk * (2.0 * dot(a, a) + dot(d, b)) / 3.0, kz = kk * dot(d, a);
  float p = ky - kx * kx, p3 = p * p * p, q = kx * (2.0 * kx * kx - 3.0 * ky) + kz, h = q * q + 4.0 * p3;
  if (h >= 0.0) {
    h = sqrt(h);
    vec2 x = (vec2(h, -h) - q) / 2.0;
    vec2 uv = sign(x) * pow(abs(x), vec2(1.0 / 3.0));
    float t0 = clamp(uv.x + uv.y - kx, 0.0, 1.0);
    vec2 qq = d + (c + b * t0) * t0;
    tt = vec3(t0, 0.0, 0.0); dd = vec3(length(qq), 0.0, 0.0); three = 0.0;
  } else {
    float z = sqrt(max(-p, 1e-8));
    float v = acos(clamp(q / min(p * z * 2.0, -1e-8), -1.0, 1.0)) / 3.0;
    float m = cos(v), n = sin(v) * 1.732050808;
    vec3 t = clamp(vec3(m + m, -n - m, n - m) * z - kx, 0.0, 1.0);
    vec2 qx = d + (c + b * t.x) * t.x; float dx = dot(qx, qx);
    vec2 qy = d + (c + b * t.y) * t.y; float dy = dot(qy, qy);
    vec2 qz = d + (c + b * t.z) * t.z; float dz = dot(qz, qz);
    tt = t; dd = sqrt(vec3(dx, dy, dz)); three = 1.0;
  }
}
// an arm's light at one place u of its thread, seen d away: its width narrows along it, ragged; it fades out from the middle on
float armAt(float d, float u, float RS, float len, float hk, float hk2, float fk, float ph) {
  float wd = RS * mix(0.4, 0.09, u) * (0.75 + 0.5 * hk2);
  float ragw = 0.5 + 1.0 * vn2(vec2(u * len * 1.7 + hk * 9.0, fk * 5.0 + ph));
  float aq = d / (wd * ragw);
  return exp(-aq * aq) * (1.0 - smoothstep(0.5, 1.0, u));
}
// ONE RED SUN AND ITS STORM. P: the sky about the sun in sun radii, x toward the storm's middle (D away, RS its radius).
// prm = (tearing, hand, phase, on); prq = (arms: 2 or 3, the longest arm in storm radii, the wrap's half angle, the arms' spread);
// tr: the tangent of the sun's radius (the flat measure's unit on the sphere).
// The storm is A CROWD OF TORN LIGHTS OF ITS OWN KIND (its sun's fire paling toward white gold or blue white; no star of
// the heaven is like them: see the lights below) in a soft dim body that wraps part of the limb and trails away in two or three ragged arms of unequal
// length; the sun's own fire is drawn out toward it. Nothing in it is a drawn line, and the soft body never comes near white.
// hue: THE SUN'S OWN HUE, dealt with its size (0 the greatest sun of its sky: a deep dull red; a half: orange; 1 the
// least: a pale amber). Its face, its breath, its drawn-out fire, ITS STORM'S BODY AND THE STORM'S SHREDS all take it, so
// that two suns of one sky are two different stars. Every hue is a red sun's: none is white, none yellow.
float gDisc = 0.0;
vec3 hue3(vec3 a, vec3 b, vec3 c, float h) { return mix(mix(a, b, clamp(h * 2.0, 0.0, 1.0)), c, clamp(h * 2.0 - 1.0, 0.0, 1.0)); }
vec3 sunAndStorm(vec2 P, float D, float RS, vec4 prm, vec4 prq, float t, float tr, float hue) {
  float tear = prm.x, hand = prm.y, ph = prm.z;
  vec3 col = vec3(0.0);
  // (in these numbers a light's green and blue stand far under its red: on the screen they stand nearer it. The palest
  // sun is made hardly paler than the one sun of the first make, every other is redder than that one was)
  vec3 rimC = hue3(vec3(0.42, 0.025, 0.006), vec3(0.66, 0.05, 0.01), vec3(0.85, 0.14, 0.03), hue);
  vec3 midC = hue3(vec3(0.66, 0.07, 0.015), vec3(0.9, 0.16, 0.03), vec3(1.0, 0.36, 0.1), hue);
  vec3 hotC = hue3(vec3(0.9, 0.22, 0.05), vec3(1.0, 0.42, 0.12), vec3(1.0, 0.64, 0.27), hue);
  // how bright this sun's limb is, as a share of 0.75 (its shreds go by it: a dull sun's shreds are dull)
  float dullK = rimC.r / 0.75;
  float rl = length(P), phi = atan(P.y, P.x + 1e-6);
  // the face: bloated, granular, dark blotched, drawn out a little toward its storm
  float bulge = 1.0 + 0.18 * tear * pow(clamp(cos(phi), 0.0, 1.0), 3.0);
  float x = rl / bulge;
  float gran = vn3(vec3(P * 5.5, t * 0.11 + ph)) * 0.6 + vn3(vec3(P * 13.0 + 4.0, t * 0.2 + ph)) * 0.4;
  float spots = smoothstep(0.38, 0.62, vn3(vec3(P * 1.7 + ph, t * 0.03)));
  float limb = sqrt(clamp(1.0 - x * x, 0.0, 1.0));
  vec3 face = mix(rimC, midC, limb) * (0.55 + 0.9 * gran) * mix(1.0, 0.5, spots * 0.7);
  face += hotC * pow(clamp(gran, 0.0, 1.0), 4.0) * 0.9 * limb;
  float disc = 1.0 - smoothstep(0.94, 1.0, x);
  gDisc = disc;
  // its own red breath about it, ragged; and the tearing: the limb's fire drawn out toward the storm inside the wrap's window
  // (the breath's and the strands' raggedness is read BY THE PLACE ROUND THE SUN, the direction's two numbers, never by
  // the bearing's own number, which jumps on the side away from the storm and cut a straight line there)
  vec2 ud = P / max(rl, 1e-4);
  float rays = 0.65 + 0.35 * vn3(vec3(ud * 5.0 + ph, rl * 1.5 - t * 0.12));
  col += hue3(vec3(0.7, 0.07, 0.02), vec3(0.9, 0.14, 0.04), vec3(1.0, 0.26, 0.08), hue) * exp(-clamp(x - 1.0, 0.0, 20.0) * 2.5) * 0.24 * rays * (1.0 - disc);
  float win = 1.0 - smoothstep(prq.z * 0.45, prq.z, abs(phi));
  float strands = 0.3 + 0.7 * vn3(vec3(ud * 9.0 + ph, rl * 2.4 - t * 0.3));
  col += hue3(vec3(0.8, 0.16, 0.04), vec3(0.95, 0.28, 0.08), vec3(1.0, 0.44, 0.15), hue) * exp(-clamp(x - 1.0, 0.0, 20.0) * (2.4 - 1.3 * tear)) * win * strands * (0.2 + 0.45 * tear) * (1.0 - disc);
  col = mix(col, face * 1.2, disc);
  // where the crowd stands: the body, the arc of the limb it wraps, the arms
  vec2 sc = vec2(D, 0.0), Q = P - sc;
  float ql = length(Q) / RS;
  float rag = fbm2(Q * 1.7 / RS + ph);
  float body = exp(-ql * ql * (1.2 + 1.6 * (1.0 - rag)));
  float wq = (rl - 1.16) / 0.2;
  float wrapm = exp(-wq * wq) * win;
  float arms = 0.0;
  for (int k = 0; k < 3; k++) {
    float fk = float(k), on = step(fk + 0.5, prq.x), hk = h11(fk * 7.13 + ph), hk2 = h11(fk * 3.71 + ph + 5.0);
    float len = RS * prq.y * (k == 0 ? 1.0 : k == 1 ? 0.6 : 0.34) * (0.9 + 0.2 * hk);
    float a0 = (fk - 0.5 * (prq.x - 1.0)) * 1.0 * prq.w + (hk2 - 0.5) * 0.4 + 0.3 * hand;
    vec2 d0 = vec2(cos(a0), sin(a0));
    vec2 A = sc + d0 * RS * 0.4, B = A + d0 * len * 0.55, E = A + (rot2(hand * (0.45 + 0.5 * hk)) * d0) * len;
    vec3 bd, bt; float three;
    bezTurns(P, A, B, E, bd, bt, three);
    float al = armAt(bd.x, bt.x, RS, len, hk, hk2, fk, ph);
    // inside the bend the arm's light is summed over both near places, less the far place between them
    if (three > 0.5) al = clamp(al + armAt(bd.y, bt.y, RS, len, hk, hk2, fk, ph) - armAt(bd.z, bt.z, RS, len, hk, hk2, fk, ph), 0.0, 1.0);
    arms = max(arms, on * al);
  }
  float rho = clamp(body + 0.9 * wrapm + arms, 0.0, 1.0) * (0.3 + 0.7 * smoothstep(0.22, 0.62, fbm2(P * 2.1 + ph * 3.0)));
  // the soft body (dim: never near white), violet only deep inside. IT TAKES ITS OWN SUN'S HUE: more than half of its
  // colour is its sun's (a dull rose about the deep red sun, salmon about the orange, amber gold about the pale amber)
  vec3 sunT = hue3(vec3(0.85, 0.15, 0.05), vec3(0.95, 0.25, 0.08), vec3(1.0, 0.42, 0.15), hue);
  vec3 sg = mix(mix(vec3(0.5, 0.68, 1.0), vec3(1.0, 0.88, 0.68), clamp(body * 1.2, 0.0, 1.0)), sunT, 0.55);
  col += sg * rho * 0.1 * (1.0 - 0.8 * disc);
  col += vec3(0.5, 0.3, 0.95) * body * body * (1.0 - smoothstep(0.1, 0.55, ql)) * 0.05;
  // THE STORM'S LIGHTS, of their own kind: TORN SHREDS, each larger than any small star, lying along the way the storm
  // goes (round its middle inside the body, more and more outward along the arms it trails), a blunt head and a longer
  // tail, BREATHING slowly on the world's clock from its own dealt phase and period. A shred TAKES ITS SUN'S COLOUR
  // TOWARD ITS STORM'S (the sun's red fire where the storm is thin, paler toward white gold or blue white deep in its
  // body) and is DIMMER THAN ITS SUN'S LIMB, alone and where shreds lie over one another. One shred alone is at its
  // brightest 0.224 of its colour, and its colour goes by its sun's dullness (dullK: the deep dull sun's shreds are the
  // dullest). ON EACH OF THE 1,352 SUNS of seeds 1 to 300 the shreds of a storm TOGETHER stand under their own sun's
  // limb, in red and in brightness (the limb: the face's mean on the ring at 0.93 of the sun's radius; brightness: the
  // mean of the three colours); the least limb (a deep dull sun's) is 0.459 in red and 0.171 in brightness. THE GREATEST
  // FOUND, by the reader's search from every shred's own middle with every shred at the top of its breath at once (a
  // search, not a bound proved): the shreds together 0.455 in red and 0.329 in brightness at one place; of THEIR OWN
  // sun's limb 0.543 in red and 0.881 in brightness. It is NO LONGER
  // THAN THREE OF ITS OWN BREADTHS ON THE SKY'S SPHERE: its length is dealt 1.4 to 2.4 breadths in the flat measure
  // about its sun and held under three times the cosine of its own angle from the sun (the flat measure draws things
  // out by that much at the most), whichever way it lies. Nothing here reads the frame or the lens.
  // Two sheets wheel about the storm's middle, each at its own rate and size (a shred may lie over its cell's edge: the
  // four cells about a place are asked).
  for (int m = 0; m < 2; m++) {
    float fm = float(m), sca = m == 0 ? 1.7 : 3.1, wa = hand * t * (0.05 - 0.016 * fm) + ph * (1.0 + fm);
    vec2 q = (rot2(wa) * Q) * sca, c0 = floor(q - 0.5);
    float gain = m == 0 ? 0.2 : 0.16;
    for (int j = 0; j < 4; j++) {
      vec2 ci = c0 + vec2(mod(float(j), 2.0), floor(float(j) * 0.5));
      vec3 hc = h33(vec3(ci, ph + fm * 3.0)), h2 = h33(vec3(ci.yx + 7.3, ph + fm * 5.0 + 2.0));
      vec2 ctr = ci + 0.5 + (hc.xy - 0.5) * 0.6, o = q - ctr;
      float rc = length(ctr) / (sca * RS);
      vec2 e = rot2(hand * mix(1.45, 0.4, smoothstep(0.3, 2.0, rc))) * (ctr / max(length(ctr), 1e-4));
      float al = dot(o, e), ac = dot(o, vec2(-e.y, e.x));
      // the shred's own place in the flat measure about its sun, and the cosine of its angle from the sun
      vec2 pc0 = sc + rot2(-wa) * ctr / sca;
      float cth = 1.0 / sqrt(1.0 + dot(pc0, pc0) * tr * tr);
      float sz = mix(0.05, 0.1, h2.x * h2.x), lg = sz * min(mix(1.4, 2.4, h2.y), 3.0 * cth) * (al > 0.0 ? 1.4 : 0.6);
      float dq = al * al / (lg * lg) + ac * ac / (sz * sz);
      // (only where the storm stands: no shred anywhere else in the heaven)
      float on = smoothstep(hc.z - 0.08, hc.z + 0.08, rho * 1.12) * smoothstep(0.03, 0.12, rho);
      float br = 0.55 + 0.45 * sin(t * 6.2831853 / mix(4.0, 9.0, h2.z) + hc.x * 40.0);
      vec3 stormC = fract(hc.z * 13.7) < 0.58 ? vec3(1.0, 0.9, 0.64) : vec3(0.6, 0.8, 1.0);
      vec3 pc = mix(sunT, stormC, clamp(0.2 + 0.5 * body, 0.0, 0.62)) * dullK;
      // (a shred has come to nothing 0.7 of a cell from its middle: no cell that is not asked can hold any of it, so the
      // lights have no edge where the four cells asked change)
      col += pc * (exp(-dq) + 0.12 * exp(-sqrt(dq) * 1.2)) * (1.0 - smoothstep(0.5, 0.7, length(o))) * on * br * gain * (1.0 - 0.85 * disc);
    }
  }
  return col;
}
`;

const SKY_FRAG = /* glsl */`
uniform float uTime;
uniform vec4 uSun[5];
uniform vec4 uStorm[5];
uniform vec4 uSunP[5];
uniform vec4 uSunQ[5];
uniform vec4 uSunR[5];
uniform float uSunH[5];
uniform vec4 uSky;
uniform mat3 uTilt;
varying vec3 vDir;
${SKY_NOISE}
${SKY_STARS}
${SKY_SUN}
void main() {
  vec3 d = normalize(vDir);
  float t = uTime, el = d.y;
  vec3 n = uTilt * d;
  // the heaven: black and brooding, never flat: slow smoke of umber and violet
  float smoke = fbm3(n * 2.3 + vec3(uSky.w, t * 0.006, 0.0));
  float smoke2 = fbm3(n * 5.3 + vec3(3.0, uSky.w, t * 0.004));
  vec3 col = mix(vec3(0.020, 0.016, 0.025), vec3(0.042, 0.027, 0.034), smoothstep(0.3, 0.78, smoke));
  col += vec3(0.022, 0.013, 0.012) * pow(clamp(smoke2, 0.0, 1.0), 3.0);
  col += vec3(0.04, 0.018, 0.013) * exp(-clamp(abs(el), 0.0, 1.0) * 8.0);
  // the old stars: three to four dozen large dim bloated ember ones in the whole sky (dealt one by one from the seed, in
  // loose company), and the small ones few, dim and red, in three sizes (each layer turned its own way so that no grid shows)
  float crowd = uSky.x, sallow = uSky.y;
  vec3 st = starOld(d, t);
  st += starDust(n.zxy * vec3(1.0, -1.0, 1.0), 15.0, 5.0 + uSky.w, 0.6, t, sallow, 0.5 * crowd, 0, uSky.w, 0.028, 0.05);
  st += starDust(n.yzx * vec3(-1.0, 1.0, 1.0), 31.0, 9.0 + uSky.w, 0.45, t, sallow, 1.0, 1, uSky.w, 0.04, 0.085);
  st += starDust(n, 59.0, 13.0 + uSky.w, 0.32, t, sallow, 0.9, 2, uSky.w, 0.055, 0.1);
  // what is left of the band: the faintest smoke of light
  float bq2 = dot(n, uBand.xyz) / (uBand.w * 1.3);
  col += vec3(0.018, 0.008, 0.006) * exp(-bq2 * bq2) * (0.4 + 0.6 * smoke2);
  float veil = uSky.z * (0.4 + 0.6 * smoke);
  col = col * (1.0 + veil * 0.8) + st * (1.0 - veil * 0.7);
  // THE RED SUNS AND THEIR STORMS: EVERY SUN'S LIGHT IS ADDED OVER THE WHOLE SKY (no nearest sun is chosen, so there is
  // no line anywhere where one sun's picture is handed over to the next). Each sun with its storm's body and arms falls
  // to nothing by its own reach (uSunR: the cosines of where the falling begins, just beyond its farthest arm's end, and
  // of where it has come to nothing); beyond that it adds exactly nothing, and the sum is smooth.
  vec3 sun = vec3(0.0);
  float faceOf = 0.0;
  for (int i = 0; i < 5; i++) {
    vec4 S = uSun[i], Q = uStorm[i], Pm = uSunP[i];
    float cs = dot(d, S.xyz);
    if (Pm.w < 0.5 || cs <= uSunR[i].x) continue;
    float cq = clamp(dot(S.xyz, Q.xyz), 0.2, 0.9999);
    vec3 e1 = normalize(Q.xyz - S.xyz * cq), e2 = cross(S.xyz, e1);
    float tr = max(tan(S.w), 1e-3);
    vec2 P = vec2(dot(d, e1), dot(d, e2)) / max(cs, 0.2) / tr;
    float D = sqrt(1.0 - cq * cq) / cq / tr, RS = tan(Q.w) / tr;
    float fall = smoothstep(uSunR[i].x, uSunR[i].y, cs) * smoothstep(0.2, 0.4, cs);
    sun += sunAndStorm(P, D, RS, Pm, uSunQ[i], t, tr, uSunH[i]) * fall;
    faceOf = max(faceOf, gDisc * fall);
  }
  // (a sun's face hides the heaven behind it wholly, however dull its red: no small star shows through a sun)
  float cover = max(clamp(dot(sun, vec3(0.3, 0.5, 0.2)) * 1.4, 0.0, 1.0), faceOf);
  col = col * (1.0 - cover) + sun;
  // under the horizon the plain's own far tone (the plain's mesh lies over nearly all of it)
  col = mix(vec3(0.026, 0.021, 0.024), col, smoothstep(-0.03, 0.012, el));
  gl_FragColor = vec4(max(col, 0.0), 1.0);
}`;

// The dome of the sky: one unit sphere drawn on the far plane behind everything else.
export function makeSkyDome(skyPlan) {
  const V4 = (a, b, c, d) => new THREE.Vector4(a, b, c, d);
  const sun = [], storm = [], prm = [], prq = [], reach = [], hues = [];
  for (let i = 0; i < 5; i++) {
    const q = skyPlan.suns[i];
    hues.push(q ? q.hue : 0.5);
    // A SUN'S REACH on the sky (by its own deal): the angle from its middle that holds its breath, its storm's body and its
    // farthest arm's end with its breadth, in the same flat measure the shader draws them in; its light is whole within
    // that, falls smoothly beyond it and is nothing from 1.15 times that angle and a degree on (never beyond 72 degrees)
    if (q) {
      const tr = Math.tan(q.rad * DEG), cq = clamp(q.dir[0] * q.storm.dir[0] + q.dir[1] * q.storm.dir[1] + q.dir[2] * q.storm.dir[2], 0.2, 0.9999);
      const D = Math.sqrt(1 - cq * cq) / cq / tr, RS = Math.tan(q.storm.rad * DEG) / tr, ext = Math.max(6, D + RS * Math.max(2.2, 0.9 + q.armLen * 1.1));
      const aOut = Math.min(Math.atan(ext * tr) * 1.15 + DEG, 72 * DEG), aIn = Math.min(Math.atan(ext * tr), aOut - 2 * DEG);
      reach.push(V4(Math.cos(aOut), Math.cos(aIn), aOut / DEG, aIn / DEG));
    } else reach.push(V4(2, 3, 0, 0));
    if (q) { sun.push(V4(q.dir[0], q.dir[1], q.dir[2], q.rad * DEG)); storm.push(V4(q.storm.dir[0], q.storm.dir[1], q.storm.dir[2], q.storm.rad * DEG)); prm.push(V4(q.tear, q.hand, q.phase, 1)); prq.push(V4(q.arms, q.armLen, q.wrap * DEG, q.spread)); }
    else { sun.push(V4(0, -1, 0, 0.05)); storm.push(V4(0.6, -0.8, 0, 0.05)); prm.push(V4(0.5, 1, 0, 0)); prq.push(V4(2, 2, 1, 1)); }
  }
  // the large old stars: 48 places, the unused ones with no gain
  const starA = [], starB = [];
  for (let i = 0; i < 48; i++) { const q = (skyPlan.stars || [])[i]; if (q) { starA.push(V4(q.dir[0], q.dir[1], q.dir[2], Math.cos(3.2 * q.rad * DEG))); starB.push(V4(q.rad * DEG, q.gain, q.hue, q.phase)); } else { starA.push(V4(0, -1, 0, 2)); starB.push(V4(1, 0, 0, 0)); } }
  const tilt = new THREE.Matrix3().setFromMatrix4(new THREE.Matrix4().makeRotationY(skyPlan.tilt * DEG));
  const uniforms = { uTime: { value: 0 }, uSun: { value: sun }, uStorm: { value: storm }, uSunP: { value: prm }, uSunQ: { value: prq }, uSunR: { value: reach }, uSunH: { value: hues }, uStarA: { value: starA }, uStarB: { value: starB }, uSky: { value: V4(skyPlan.crowd, skyPlan.sallow, skyPlan.haze, skyPlan.seedF) }, uBand: { value: V4(skyPlan.band[0], skyPlan.band[1], skyPlan.band[2], skyPlan.bandW) }, uTilt: { value: tilt } };
  const material = new THREE.ShaderMaterial({ uniforms, vertexShader: SKY_VERT, fragmentShader: SKY_FRAG, side: THREE.BackSide, depthWrite: false, depthTest: true, fog: false });
  const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 3), material);
  mesh.frustumCulled = false; mesh.renderOrder = 900; mesh.name = 'sky';
  return { mesh, material, uniforms };
}

// ================================================================ THE ROOM'S SHARED MATERIAL
// One shader for every solid thing (floor, stone, copper, cloth, leaves, glowing glass, slag). Its light is BY PLACE:
// warm from below and from the room's middle inside the drum, the suns' dull red and the storms' passing white gold from
// their own bearings (the same uniforms the sky is drawn from, on the world's clock), the dome's glow on the plain.
// surf = (kind, gloss, glow or pool, sway): kind 0 plain, 1 inlaid floor, 2 veined stone, 3 metal, 4 cloth, 5 leaf, 6 glowing, 7 carpet, 8 slag, 9 paving, 10 the coffered soffit over the way in
const ROOM_VERT = /* glsl */`
attribute vec4 surf;
#ifdef USE_INSTANCING
attribute vec3 iTint;
attribute vec4 iGlow;
attribute vec4 iPivot;
#endif
uniform float uTime;
varying vec3 vCol;
varying vec3 vN;
varying vec3 vW;
varying vec4 vSurf;
varying vec4 vGlow;
void main() {
  mat4 M = modelMatrix;
  vec3 c = color;
  vGlow = vec4(0.0);
#ifdef USE_INSTANCING
  M = modelMatrix * instanceMatrix;
  // a vertex painted pure white takes the instance's tint (cloth, glaze); a glowing or pooled one the instance's light
  c = mix(c, c * iTint, step(1.5, surf.y));
  vGlow = iGlow;
#endif
  vec4 w = M * vec4(position, 1.0);
  vec3 nw = mat3(M) * normal;
#ifdef USE_INSTANCING
  // a chandelier's parts go round its own upright axis (iPivot = axis x, axis z, radians a second, phase): the world's clock
  if (iPivot.z != 0.0) {
    float an = iPivot.z * uTime + iPivot.w, ca = cos(an), sa = sin(an);
    vec2 o = w.xz - iPivot.xy;
    w.xz = iPivot.xy + vec2(o.x * ca + o.y * sa, -o.x * sa + o.y * ca);
    nw.xz = vec2(nw.x * ca + nw.z * sa, -nw.x * sa + nw.z * ca);
  }
#endif
  // the room's slow draught: fronds, flowers, strings (sway weight in metres at the tip)
  float sw = surf.w, ph = dot(w.xz, vec2(0.37, 0.23));
  w.x += sw * (sin(uTime * 0.9 + ph) * 0.2 + sin(uTime * 2.3 + ph * 1.7) * 0.05);
  w.z += sw * (cos(uTime * 0.75 + ph * 1.3) * 0.17);
  w.y += sw * sin(uTime * 1.4 + ph * 0.6) * 0.07;
  vN = normalize(nw);
  vW = w.xyz;
  vCol = c;
  vSurf = surf;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

const ROOM_LIGHT = /* glsl */`
uniform float uTime;
uniform vec4 uSunL[5];
uniform vec4 uStormL[5];
uniform float uStormP[5];
uniform vec4 uRing;
uniform vec4 uPier;
uniform vec4 uHost;
uniform vec3 uStoneA;
uniform vec3 uStoneB;
uniform vec3 uStoneC;
varying vec3 vCol;
varying vec3 vN;
varying vec3 vW;
varying vec4 vSurf;
varying vec4 vGlow;
${SKY_NOISE}
float wrap(float x, float k) { return clamp((x + k) / (1.0 + k), 0.0, 1.0); }
// the arena's floor by the distance from the middle (the risers smoothed), and: is this place on the pier's strip
float floorAt(float R) { return R < 26.0 ? 0.0 : R < 53.8 ? (R - 26.0) * 0.2158 : R < 66.2 ? 6.0 : R < 93.0 ? 6.0 + (R - 66.2) * 0.2239 : 12.0; }
float onPier(vec3 P) { vec2 q = P.xz - uPier.xy; float sv = dot(q, uPier.zw), w = dot(q, vec2(-uPier.w, uPier.z)); return step(abs(w), 10.6) * step(-${(DIM.PIERL + 0.6).toFixed(1)}, sv) * step(sv, 20.0); }
// the light that falls on a face at a place: rgb. sunShade: how much of the key sun's light reaches it (the long shadows
// of the broken ground, drawn by place)
vec3 placeLight(vec3 P, vec3 N, float thin, float sunShade) {
  float R = length(P.xz);
  float inside = 1.0 - smoothstep(109.0, 111.5, R);
  float pier = onPier(P);
  float onGal = step(21.4, P.y) * max(step(92.0, R), pier);
  float h = max(P.y - mix(floorAt(R), 22.0, onGal), 0.0);
  vec3 warmC = vec3(1.0, 0.8, 0.55);
  // candle light: strongest near the tables, from below and from the room's middle
  vec3 toMid = normalize(vec3(-P.x, 10.0 - P.y * 0.25, -P.z) + vec3(0.0, 1e-3, 0.0));
  float pool = 0.3 + 0.7 * exp(-h / 5.5);
  float warm = pool * (0.4 + 0.36 * wrap(dot(N, toMid), 0.5) + 0.3 * wrap(-N.y, 0.6));
  vec3 L = warmC * warm * inside * 0.74;
  // THE GREAT FOUNTAIN'S LIGHT (white water lit by its cups): from its axis, strongest on the pit and the nearest terraces
  vec3 toAx = normalize(vec3(-P.x, 15.0 - P.y * 0.6, -P.z) + vec3(0.0, 1e-3, 0.0));
  L += vec3(1.0, 0.88, 0.7) * inside * 1.05 / (1.0 + R * R / 700.0) * wrap(dot(N, toAx), 0.35) * (1.0 - 0.5 * onGal);
  // THE FOUNTAIN'S OWN BODY: the cups at its foot and the dais's lamps shine up its stem and under its bowls (by place:
  // from the ring of lights about its foot, fading slowly with the height), so that its copper and its green stone show
  float kf = (16.0 - R) / max(R, 0.05);
  vec3 toFoot = normalize(vec3(P.x * kf, 1.5 - P.y, P.z * kf));
  L += warmC * (1.0 - smoothstep(10.5, 12.5, R)) * step(1.2, P.y) * step(P.y, 42.0) * 1.5 / (1.0 + max(P.y - 1.0, 0.0) / 22.0) * wrap(dot(N, toFoot), 0.45);
  // the sky's light from the side: dull red from each sun, white gold and blue white as its storm wheels (slow, never off);
  // (ONE COLOUR OF LIGHT FOR THE PLACE: a sun's light on the room and the plain is this same dull red whatever that sun's
  // own hue in the sky, deep red, orange or pale amber)
  // little of it under the gallery and under the pier
  float under = (1.0 - smoothstep(20.6, 21.2, P.y)) * max(smoothstep(93.0, 96.0, R), pier) * inside;
  float vis = mix(1.0, 0.22, under);
  float outside = 1.0 - inside;
  for (int i = 0; i < 5; i++) {
    // outside, the first entry sun is the ground's key light (stronger, and it is the one whose long shadows are drawn)
    float key = i == 0 ? mix(1.0, 2.6 * sunShade, outside) : mix(1.0, 1.5, outside);
    float nl = mix(wrap(dot(N, uSunL[i].xyz), 0.3 - 0.2 * outside), 0.5 + 0.5 * abs(dot(N, uSunL[i].xyz)), thin);
    L += vec3(1.0, 0.34, 0.18) * uSunL[i].w * 0.4 * nl * vis * key;
    float beat = 0.6 + 0.4 * sin(uTime * 6.2831853 / uStormL[i].w + uStormP[i]);
    float ns = mix(wrap(dot(N, uStormL[i].xyz), 0.3), 0.5 + 0.5 * abs(dot(N, uStormL[i].xyz)), thin);
    L += vec3(0.9, 0.86, 0.8) * uSunL[i].w * 0.36 * beat * ns * vis;
  }
  // outside: the dome's own glow on the plain and the drum; the heaven's dim fill
  vec3 toDome = normalize(vec3(-P.x, 34.0 - P.y, -P.z) + vec3(0.0, 1e-3, 0.0));
  L += warmC * outside * 0.8 * exp(-max(R - 110.0, 0.0) / 48.0) * wrap(dot(N, toDome), 0.4);
  L += vec3(0.5, 0.41, 0.43) * outside * 0.5 * (0.55 + 0.45 * N.y);
  // THE DOOR'S LIGHT: a long warm pool on the ground before the porch, widening as it goes out (B1). BY THE PLACE, the
  // same on every seed and at every clock: it is gentle in the passage itself (under the porch and on its stair, to
  // z 119: a third of its strength, so that the cream flags and the coffers over them keep their pattern) and comes to its
  // full strength on the causeway by z 141.
  vec3 dd = vec3(0.0, 17.0, 111.0) - P; float dz = max(P.z - 111.0, 0.0), wd = 10.0 + dz * 0.22;
  L += warmC * outside * step(100.0, P.z) * 2.0 * mix(0.32, 1.0, smoothstep(119.0, 141.0, P.z)) * exp(-P.x * P.x / (wd * wd)) * exp(-dz / 50.0) * wrap(dot(N, normalize(dd)), 0.75);
  // THE BANDSTAND'S LAMPS (28 on the dais's outer edge): a warm pool on the dais and on what stands on it, by place: from
  // the nearest place of the ring of lamps (R ${(DIM.RDAIS1 - 0.3).toFixed(1)}, ${(DIM.YDAIS + 2.4).toFixed(1)} m up)
  float dais = smoothstep(${(DIM.RDAIS0 - 1.0).toFixed(1)}, ${(DIM.RDAIS0 + 0.2).toFixed(1)}, R) * (1.0 - smoothstep(${(DIM.RDAIS1 + 0.4).toFixed(1)}, ${(DIM.RDAIS1 + 2.3).toFixed(1)}, R)) * step(${(DIM.YDAIS - 0.1).toFixed(1)}, P.y) * (1.0 - smoothstep(5.0, 7.0, P.y));
  float kd = (${(DIM.RDAIS1 - 0.3).toFixed(1)} - R) / max(R, 0.05);
  L += warmC * dais * 1.3 * wrap(dot(N, normalize(vec3(P.x * kd, ${(DIM.YDAIS + 2.4).toFixed(1)} - P.y, P.z * kd))), 0.6);
  // THE DOOR'S OWN LAMPS (by place, the same at every clock): the lamp on each reveal and on each folded leaf, by the hand
  // of the axis a face stands on; and the row of small lights in the coffered soffit along the door's axis (the nearest
  // place of the row), on the soffit about them and a little on what is under them
  float nearDoor = step(92.0, P.z);
  for (int j = 0; j < 2; j++) {
    vec3 dl = vec3(sign(P.x) * (j == 0 ? ${Math.abs(DOOR.lamps[0][0]).toFixed(2)} : ${Math.abs(DOOR.lamps[1][0]).toFixed(2)}), ${DOOR.yLamp.toFixed(2)}, j == 0 ? ${DOOR.lamps[0][2].toFixed(2)} : ${DOOR.lamps[1][2].toFixed(2)}) - P; float d2 = dot(dl, dl);
    L += warmC * nearDoor * 0.9 / (1.0 + d2 / 5.0) * wrap(dot(N, dl / sqrt(max(d2, 1e-4))), 0.4);
  }
  vec3 dq = vec3(0.0, ${(DIM.YG - 1 - 0.1).toFixed(2)}, clamp(P.z, 95.0, 111.0)) - P; float q2 = dot(dq, dq);
  L += warmC * nearDoor * 0.8 / (1.0 + q2 / 9.0) * wrap(dot(N, dq / sqrt(max(q2, 1e-4))), 0.9);
  // the causeway's lamp standards (two rows, every ${WAY.DZ} m): the nearest pair by place
  float zk = ${WAY.Z0.toFixed(1)} + ${WAY.DZ.toFixed(1)} * clamp(floor((P.z - ${WAY.Z0.toFixed(1)}) / ${WAY.DZ.toFixed(1)} + 0.5), 0.0, ${(WAY.NL - 1).toFixed(1)});
  for (int j = 0; j < 2; j++) {
    vec3 dl = vec3(j == 0 ? -${WAY.XL.toFixed(1)} : ${WAY.XL.toFixed(1)}, ${(DIM.YWAY + 6.3).toFixed(1)}, zk) - P; float d2 = dot(dl, dl);
    L += warmC * outside * 1.15 / (1.0 + d2 / 26.0) * wrap(dot(N, dl / sqrt(max(d2, 1e-4))), 0.5);
  }
  // the ring's own light on the pier and the gallery (a lamp of the place: by where a face stands, the same at every clock)
  vec3 dr = uRing.xyz - P; float r2 = dot(dr, dr);
  L += vec3(1.0, 0.86, 0.62) * uRing.w / (1.0 + r2 / 120.0) * wrap(dot(N, dr / sqrt(max(r2, 1e-4))), 0.45);
  // THE HOST'S PLACE (round t1): an empty pool of light on the dais's floor before the band's first arc, by place (uHost:
  // its middle x, z, the floor's height, its radius), the same at every clock: it falls from above on what is in it
  float hq = length(P.xz - uHost.xy);
  L += vec3(1.0, 0.95, 0.85) * 2.6 * (1.0 - smoothstep(uHost.w * 0.5, uHost.w + 0.01, hq)) * step(uHost.z - 0.2, P.y) * (1.0 - smoothstep(uHost.z + 1.8, uHost.z + 2.6, P.y)) * wrap(N.y, 0.8);
  return L + vec3(0.012, 0.009, 0.014);
}
`;

const ROOM_FRAG = /* glsl */`
${ROOM_LIGHT}
void main() {
  vec3 P = vW;
  vec3 V = normalize(cameraPosition - P);
  vec3 N = normalize(vN);
  // a face shows the side that is turned to the eye (cloths, leaves and shades are seen from both)
  if (dot(N, V) < 0.0) N = -N;
  float kind = floor(vSurf.x + 0.5);
  float gloss = vSurf.y - 2.0 * step(1.5, vSurf.y);
  float R = length(P.xz);
  vec3 alb = vCol;
  float thin = 0.0;
  vec3 emis = vec3(0.0);
  if (kind == 1.0) {
    // inlaid stone in rings: bands 1.9 m deep, by turns plain green, lozenges, plain cream, wedges; a pale line between bands
    float q = R / 1.9, bi = floor(q), fr = q - bi, aw = fwidth(q) + 1e-4;
    float ang = atan(P.x, P.z + 1e-5);
    float nW = max(6.0, floor(6.2831853 * (bi + 0.5)));
    float cu = fract(ang / 6.2831853 * nW + 0.5 * mod(bi, 2.0));
    float sty = mod(bi, 4.0);
    float loz = 1.0 - smoothstep(0.34, 0.34 + aw * 2.0, abs(cu - 0.5) + abs(fr - 0.5));
    float wed = step(0.5, cu);
    vec3 fa = uStoneA, fb = uStoneB, fc = uStoneC;
    vec3 pat = sty < 0.5 ? fa : sty < 1.5 ? mix(fb, fc, loz) : sty < 2.5 ? mix(fb, fa, loz * 0.85) : mix(fa, fc, wed);
    float line = smoothstep(0.5 - 0.035 - aw, 0.5 - 0.035, abs(fr - 0.5));
    pat = mix(pat, fb * 1.05, line * 0.8);
    float marble = fbm2(P.xz * 0.6 + 11.0);
    alb = vCol * pat * (0.4 + 0.22 * marble);
  } else if (kind == 2.0) {
    float m = fbm3(P * 0.55 + 3.0);
    float vein = pow(clamp(1.0 - abs(fbm3(P * 0.9 + 17.0) - 0.5) * 5.0, 0.0, 1.0), 3.0);
    alb = vCol * (0.8 + 1.0 * m) + vec3(0.5, 0.62, 0.5) * vein * 0.05;
  } else if (kind == 4.0) {
    alb = vCol * (0.6 + 0.05 * vn2(P.xz * 40.0));
  } else if (kind == 5.0) {
    thin = 1.0;
  } else if (kind == 7.0) {
    alb = vCol * (0.8 + 0.2 * vn2(P.xz * 7.0)) * (0.9 + 0.1 * vn2(P.xz * 31.0));
  } else if (kind == 10.0) {
    // THE COFFERED SOFFIT over the way in, by paint: coffers 2 m square laid along the door's axis (one row on the axis
    // itself), copper ribs between; each panel green, its field sunk a shade darker, a small copper boss at its middle
    vec2 g = vec2(P.x * 0.5 + 0.5, (P.z - 94.0) * 0.5), gf = fract(g), aw2 = fwidth(g) + 1e-4;
    float e = min(min(gf.x, 1.0 - gf.x), min(gf.y, 1.0 - gf.y)), aa = aw2.x + aw2.y;
    float rib = 1.0 - smoothstep(0.085, 0.085 + aa, e);
    float field = smoothstep(0.17, 0.17 + aa, e);
    float boss = 1.0 - smoothstep(0.06, 0.06 + aa, length(gf - 0.5));
    vec3 green = vec3(0.07, 0.25, 0.15), copper = vec3(0.56, 0.27, 0.11);
    alb = vCol * mix(mix(green * 1.6, green * 0.9, field), copper, max(rib, boss)) * (0.85 + 0.3 * fbm2(P.xz * 0.8));
  } else if (kind == 8.0) {
    float m = fbm3(P * 0.22 + 5.0);
    float crack = pow(clamp(1.0 - abs(fbm3(P * 0.6 + 9.0) - 0.5) * 9.0, 0.0, 1.0), 2.0);
    float fine = pow(clamp(1.0 - abs(fbm3(P * 2.3 + 31.0) - 0.5) * 8.0, 0.0, 1.0), 2.0);
    alb = vCol * (1.4 + 2.6 * m) * (1.0 - 0.6 * crack) * (1.0 - 0.4 * fine);
  }
  float sunShade = 1.0;
  if (kind == 9.0) {
    // the causeway's paving: flags 2.4 m by 1.5 m laid in bond, a dark joint, each flag its own tone
    vec2 g = vec2(P.x / 2.4, P.z / 1.5); g.x += 0.5 * mod(floor(g.y), 2.0);
    vec2 gi = floor(g), gf = fract(g), aw2 = fwidth(g) + 1e-4;
    float joint = min(smoothstep(0.0, 0.035 + aw2.x, min(gf.x, 1.0 - gf.x)), smoothstep(0.0, 0.05 + aw2.y, min(gf.y, 1.0 - gf.y)));
    alb = vCol * (0.62 + 0.42 * h21(gi)) * (0.35 + 0.65 * joint) * (0.8 + 0.3 * fbm2(P.xz * 0.7));
  }
  if (kind == 8.0) {
    // long shadows across the broken ground, drawn by place along the key sun's own bearing
    vec2 sd = normalize(uSunL[0].xz + vec2(1e-4, 0.0)), q = vec2(dot(P.xz, sd), dot(P.xz, vec2(-sd.y, sd.x)));
    sunShade = 1.0 - 0.85 * smoothstep(0.5, 0.68, vn2(vec2(q.x * 0.03, q.y * 0.17) + 5.0));
  }
  vec3 L = placeLight(P, N, thin, sunShade);
  float isMetal = step(2.5, kind) * step(kind, 3.5);
  vec3 col = alb * L * (1.0 - 0.5 * isMetal);
  // the candle's own pool on its cloth (painted by place on the cloth: 1 at the candle, 0 at the hem), breathing a little
  float breath = 1.0 + 0.07 * sin(uTime * 6.3 + vGlow.a) + 0.04 * sin(uTime * 11.0 + vGlow.a * 1.7);
  if (kind == 4.0) col += alb * mix(vec3(1.0, 0.78, 0.48), vGlow.rgb, 0.85) * vSurf.z * 0.9 * breath;
  // the suns' red on the rims of the broken ground: where a slab's face turns away from the eye and toward the key sun
  if (kind == 8.0) col += alb * vec3(1.0, 0.3, 0.1) * uSunL[0].w * 5.0 * pow(clamp(1.0 - dot(N, V), 0.0, 1.0), 2.5) * wrap(dot(N, uSunL[0].xyz), 0.1) * sunShade;
  if (kind == 6.0) emis = vCol * mix(vec3(1.0), vGlow.rgb, step(0.001, dot(vGlow.rgb, vec3(1.0)))) * vSurf.z * breath;
  // polish: the warm room and each sun glance off stone, copper and glass
  vec3 Rf = reflect(-V, N);
  float inside = 1.0 - smoothstep(109.0, 111.5, R);
  vec3 toMid = normalize(vec3(-P.x, 16.0 - P.y, -P.z) + vec3(0.0, 1e-3, 0.0));
  float metal = step(2.5, kind) * step(kind, 3.5);
  vec3 specC = mix(vec3(1.0), vCol * 1.1, metal);
  float sp = pow(clamp(dot(Rf, toMid), 0.0, 1.0), mix(6.0, 22.0, gloss)) * inside * 0.45;
  vec3 spec = vec3(1.0, 0.74, 0.42) * sp;
  for (int i = 0; i < 5; i++) spec += vec3(1.0, 0.25, 0.08) * uSunL[i].w * 1.3 * pow(clamp(dot(Rf, uSunL[i].xyz), 0.0, 1.0), mix(10.0, 60.0, gloss));
  // the instruments' brass and copper on the dais catch the dais's own ring of lamps (by place)
  float daisS = smoothstep(${(DIM.RDAIS0 - 1.0).toFixed(1)}, ${(DIM.RDAIS0 + 0.2).toFixed(1)}, R) * (1.0 - smoothstep(${(DIM.RDAIS1 + 0.4).toFixed(1)}, ${(DIM.RDAIS1 + 2.3).toFixed(1)}, R)) * step(${(DIM.YDAIS - 0.1).toFixed(1)}, P.y) * (1.0 - smoothstep(5.0, 7.0, P.y));
  float kdS = (${(DIM.RDAIS1 - 0.3).toFixed(1)} - R) / max(R, 0.05);
  spec += vec3(1.0, 0.8, 0.5) * pow(clamp(dot(Rf, normalize(vec3(P.x * kdS, ${(DIM.YDAIS + 2.4).toFixed(1)} - P.y, P.z * kdS))), 0.0, 1.0), mix(4.0, 12.0, gloss)) * daisS * 1.6;
  // the great fountain's copper and stone glance the ring of lights about its foot (by place, as its own light is)
  float kf = (16.0 - R) / max(R, 0.05);
  spec += vec3(1.0, 0.74, 0.42) * pow(clamp(dot(Rf, normalize(vec3(P.x * kf, 1.5 - P.y, P.z * kf))), 0.0, 1.0), mix(5.0, 14.0, gloss)) * (1.0 - smoothstep(10.5, 12.5, R)) * step(1.2, P.y) * step(P.y, 42.0) * 0.9;
  float fres = 0.25 + 0.75 * pow(clamp(1.0 - dot(N, V), 0.0, 1.0), 3.0);
  col += spec * specC * gloss * mix(fres, 1.0, metal);
  col += emis;
  // air: clear and faintly warm inside, the plain's own dark haze outside
  float dist = length(cameraPosition - P);
  float fo = (1.0 - exp(-dist * 0.0011)) * (1.0 - inside);
  col = mix(col, vec3(0.03, 0.018, 0.02), fo);
  float fi = (1.0 - exp(-dist * 0.0007)) * inside;
  col = mix(col, vec3(0.085, 0.05, 0.026), fi);
  gl_FragColor = vec4(max(col, 0.0), 1.0);
}`;

// the room's material: one for plain meshes, the same source with instancing for the instanced ones
export function makeRoomMaterial(plan, opts = {}) {
  const V4 = (a, b, c, d) => new THREE.Vector4(a, b, c, d);
  // (a storm's beat on the room runs from the phase the sky's deal holds for its sun: uStormP)
  const sunL = [], stormL = [], stormP = [];
  for (let i = 0; i < 5; i++) {
    const s = plan.sky.suns[i];
    if (s) { sunL.push(V4(s.dir[0], s.dir[1], s.dir[2], 0.2 + 0.03 * s.rad)); stormL.push(V4(s.storm.dir[0], s.storm.dir[1], s.storm.dir[2], 19 + (s.phase % 17))); stormP.push(s.phase); }
    else { sunL.push(V4(0, 1, 0, 0)); stormL.push(V4(0, 1, 0, 20)); stormP.push(0); }
  }
  const lk = plan.look, col = (h, s, l) => new THREE.Color().setHSL(h, s, l), E = plan.route.E, d = plan.route.dir;
  const uniforms = {
    uTime: opts.time || { value: 0 }, uSunL: { value: sunL }, uStormL: { value: stormL }, uStormP: { value: stormP },
    // the ring's lamp stands in the ring's own middle; three times round 1's strength
    uRing: { value: V4(E[0], E[1], E[2], 3.0) }, uPier: { value: V4(E[0], E[2], d[0], d[1]) },
    uHost: { value: plan.host ? V4(plan.host.x, plan.host.z, plan.host.y, plan.host.r) : V4(0, 0, -100, 1) },
    uStoneA: { value: col(0.40 + 0.06 * lk.stoneHue, 0.36, 0.42) }, uStoneB: { value: col(0.11, 0.42, 0.72) }, uStoneC: { value: col(0.035 + 0.03 * lk.rustHue, 0.55, 0.34) },
  };
  return new THREE.ShaderMaterial({ uniforms, vertexShader: ROOM_VERT, fragmentShader: ROOM_FRAG, vertexColors: true, side: opts.side ?? THREE.FrontSide });
}

// ================================================================ a small merging builder for the room's material
// position, normal, color (linear), surf (kind, gloss [+2: takes the instance's tint], glow or pool, sway)
export const hexLin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
export function makeBuilder() {
  const pos = [], nrm = [], col = [], srf = [], idx = [];
  const G = { pos, nrm, col, srf, idx, get triangles() { return idx.length / 3; } };
  const vert = (p, n, c, s) => { pos.push(p[0], p[1], p[2]); nrm.push(n[0], n[1], n[2]); col.push(c[0], c[1], c[2]); srf.push(s[0], s[1], s[2], s[3]); return pos.length / 3 - 1; };
  G.vert = vert;
  G.tri = (a, b, c) => { idx.push(a, b, c); };
  // a flat four-sided face (a, b, c, d in order round it), one normal
  G.quad = (a, b, c, d, color, surf) => {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    const n = [nx, ny, nz], i0 = vert(a, n, color, surf), i1 = vert(b, n, color, surf), i2 = vert(c, n, color, surf), i3 = vert(d, n, color, surf);
    idx.push(i0, i1, i2, i0, i2, i3);
  };
  // a box about (cx, cy, cz), turned about the upright axis
  G.box = (cx, cy, cz, sx, sy, sz, turn, color, surf) => {
    const c = Math.cos(turn), s = Math.sin(turn), hx = sx / 2, hy = sy / 2, hz = sz / 2;
    const P = (x, y, z) => [cx + x * c + z * s, cy + y, cz - x * s + z * c];
    const v = [P(-hx, -hy, -hz), P(hx, -hy, -hz), P(hx, hy, -hz), P(-hx, hy, -hz), P(-hx, -hy, hz), P(hx, -hy, hz), P(hx, hy, hz), P(-hx, hy, hz)];
    for (const f of [[1, 0, 3, 2], [4, 5, 6, 7], [0, 4, 7, 3], [5, 1, 2, 6], [3, 7, 6, 2], [0, 1, 5, 4]]) G.quad(v[f[0]], v[f[1]], v[f[2]], v[f[3]], color, surf);
  };
  // a surface of revolution about the upright axis through (cx, cz): profile [[r, y], ...] from the foot upward (or inward
  // to outward for a floor); o: seg, a0, a1 (radians), color or color(r, y, a), surf or surf(r, y, a), flat (hard edges)
  G.lathe = (cx, cz, profile, o = {}) => {
    const seg = o.seg || 12, a0 = o.a0 || 0, a1 = o.a1 ?? Math.PI * 2, n = profile.length;
    const cf = typeof o.color === 'function' ? o.color : () => o.color, sf = typeof o.surf === 'function' ? o.surf : () => o.surf;
    // o.rmul(a, y): the radius times a factor by bearing (scallops, lobes, ribs)
    const rm = o.rmul || (() => 1);
    const ring = (r, y, a, nr, ny) => { const k = rm(a, y); return vert([cx + r * k * Math.sin(a), y, cz + r * k * Math.cos(a)], [nr * Math.sin(a), ny, nr * Math.cos(a)], cf(r, y, a), sf(r, y, a)); };
    for (let j = 0; j < n - 1; j++) {
      const [r0, y0] = profile[j], [r1, y1] = profile[j + 1];
      // the outward normal of this band, and of its neighbours when the surface is smooth
      const nor = (k) => { const a = profile[Math.max(0, k)], b = profile[Math.min(n - 1, k + 1)]; const dr = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dr, dy) || 1; return [dy / l, -dr / l]; };
      const nm = nor(j), na = o.flat ? nm : (() => { const p = nor(j - 1); const x = p[0] + nm[0], y = p[1] + nm[1], l = Math.hypot(x, y) || 1; return [x / l, y / l]; })();
      const nb = o.flat ? nm : (() => { const p = nor(j + 1); const x = p[0] + nm[0], y = p[1] + nm[1], l = Math.hypot(x, y) || 1; return [x / l, y / l]; })();
      const base = pos.length / 3;
      for (let i = 0; i <= seg; i++) { const a = a0 + (a1 - a0) * i / seg; ring(r0, y0, a, na[0], na[1]); ring(r1, y1, a, nb[0], nb[1]); }
      for (let i = 0; i < seg; i++) { const q = base + i * 2; idx.push(q, q + 2, q + 1, q + 1, q + 2, q + 3); }
    }
  };
  // a tube along a line of points (round, `sides` sided); radius a number or radius(t); color and surf may be functions of t
  G.tube = (pts, radius, o = {}) => {
    const sides = o.sides || 6, n = pts.length, rf = typeof radius === 'function' ? radius : () => radius;
    const cf = typeof o.color === 'function' ? o.color : () => o.color, sf = typeof o.surf === 'function' ? o.surf : () => o.surf;
    const base = pos.length / 3;
    let ux = 0, uy = 1, uz = 0;
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
      let tx = b[0] - a[0], ty = b[1] - a[1], tz = b[2] - a[2]; const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
      if (Math.abs(ux * tx + uy * ty + uz * tz) > 0.92) { ux = 1; uy = 0; uz = 0; }
      // a frame carried along the line: side = t x u, up = side x t
      let sx = ty * uz - tz * uy, sy = tz * ux - tx * uz, sz = tx * uy - ty * ux; const sl = Math.hypot(sx, sy, sz) || 1; sx /= sl; sy /= sl; sz /= sl;
      ux = sy * tz - sz * ty; uy = sz * tx - sx * tz; uz = sx * ty - sy * tx;
      const t = i / (n - 1), r = rf(t), c = cf(t), s = sf(t);
      for (let k = 0; k <= sides; k++) {
        const an = k / sides * Math.PI * 2, cs = Math.cos(an), sn = Math.sin(an), nx = sx * cs + ux * sn, ny = sy * cs + uy * sn, nz = sz * cs + uz * sn;
        vert([pts[i][0] + nx * r, pts[i][1] + ny * r, pts[i][2] + nz * r], [nx, ny, nz], c, s);
      }
    }
    for (let i = 0; i < n - 1; i++) for (let k = 0; k < sides; k++) { const q = base + i * (sides + 1) + k; idx.push(q, q + sides + 1, q + 1, q + 1, q + sides + 1, q + sides + 2); }
  };
  // a ball (or an egg: squash), as a lathe
  G.ball = (cx, cy, cz, r, o = {}) => {
    const rings = o.rings || 6, sq = o.squash || 1, prof = [];
    for (let j = 0; j <= rings; j++) { const a = -Math.PI / 2 + Math.PI * j / rings; prof.push([Math.max(1e-4, r * Math.cos(a)), cy + r * sq * Math.sin(a)]); }
    G.lathe(cx, cz, prof, o);
  };
  // another builder's content, turned about the upright axis, scaled and moved
  G.add = (B, x, y, z, turn = 0, sc = 1) => {
    const c = Math.cos(turn), s = Math.sin(turn), base = pos.length / 3, bp = B.pos, bn = B.nrm;
    for (let i = 0; i < bp.length; i += 3) {
      pos.push(x + (bp[i] * c + bp[i + 2] * s) * sc, y + bp[i + 1] * sc, z + (-bp[i] * s + bp[i + 2] * c) * sc);
      nrm.push(bn[i] * c + bn[i + 2] * s, bn[i + 1], -bn[i] * s + bn[i + 2] * c);
    }
    for (let i = 0; i < B.col.length; i++) col.push(B.col[i]);
    for (let i = 0; i < B.srf.length; i++) srf.push(B.srf[i]);
    for (let i = 0; i < B.idx.length; i++) idx.push(B.idx[i] + base);
  };
  // another builder's content through a 4x4 matrix (for things that lean or lie)
  G.addMat = (B, m) => {
    const e = m.elements, base = pos.length / 3, bp = B.pos, bn = B.nrm;
    for (let i = 0; i < bp.length; i += 3) {
      const x = bp[i], y = bp[i + 1], z = bp[i + 2], nx = bn[i], ny = bn[i + 1], nz = bn[i + 2];
      pos.push(e[0] * x + e[4] * y + e[8] * z + e[12], e[1] * x + e[5] * y + e[9] * z + e[13], e[2] * x + e[6] * y + e[10] * z + e[14]);
      const ax = e[0] * nx + e[4] * ny + e[8] * nz, ay = e[1] * nx + e[5] * ny + e[9] * nz, az = e[2] * nx + e[6] * ny + e[10] * nz, l = Math.hypot(ax, ay, az) || 1;
      nrm.push(ax / l, ay / l, az / l);
    }
    for (let i = 0; i < B.col.length; i++) col.push(B.col[i]);
    for (let i = 0; i < B.srf.length; i++) srf.push(B.srf[i]);
    for (let i = 0; i < B.idx.length; i++) idx.push(B.idx[i] + base);
  };
  G.build = () => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.setAttribute('surf', new THREE.Float32BufferAttribute(srf, 4));
    g.setIndex(pos.length / 3 > 65535 ? new THREE.Uint32BufferAttribute(idx, 1) : new THREE.Uint16BufferAttribute(idx, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 20, 0), 4200);
    return g;
  };
  G.buildAsync = async (brk) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); await brk();
    g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3)); await brk();
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); await brk();
    g.setAttribute('surf', new THREE.Float32BufferAttribute(srf, 4)); await brk();
    g.setIndex(pos.length / 3 > 65535 ? new THREE.Uint32BufferAttribute(idx, 1) : new THREE.Uint16BufferAttribute(idx, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 20, 0), 4200);
    await brk();
    return g;
  };
  return G;
}

// ================================================================ THE SHELL: floors, terraces, gallery, drum, porch, ribs
const C = {
  white: [1, 1, 1], green: hexLin('#2e5a46'), greenDk: hexLin('#1f3f31'), copper: hexLin('#b07c52'), brass: hexLin('#c9a04a'), cream: hexLin('#d9cba6'),
  rust: hexLin('#8a4a2e'), ivory: hexLin('#f2e7c9'), gold: hexLin('#e3c77a'), rib: [0.045, 0.04, 0.038], slag: hexLin('#2a2426'), plain: hexLin('#141013'),
  palm: hexLin('#2f6b3a'), palmLt: hexLin('#5f9a4a'), trunk: hexLin('#6a5238'), carpet: hexLin('#6a1f24'), wood: hexLin('#3a2416'), water: hexLin('#a9d6cc'),
  amber: hexLin('#e9a23b'), jade: hexLin('#5fae7a'), rose: hexLin('#d9708a'), blue: hexLin('#5a8fd0'), lamp: hexLin('#f1c27a'),
};
export const SHADES = [C.amber, C.jade, C.rose, C.blue];
// a flame seen through its cup's coloured glass: four fifths of the way from white to the cup's colour at full strength
const flameTint = (sc) => { const m = Math.max(sc[0], sc[1], sc[2], 1e-4); return [lerp(1, sc[0] / m, 0.8), lerp(1, sc[1] / m, 0.8), lerp(1, sc[2] / m, 0.8)]; };
// the cloths' four colours: ivory, old gold, wine, celadon
export const CLOTHS = [C.ivory, C.gold, hexLin('#8c2f3c'), hexLin('#b7d2bf')];
const S_ = { plain: (g = 0.1) => [0, g, 0, 0], floor: [1, 0.4, 0, 0], stone: (g = 0.3) => [2, g, 0, 0], metal: (g = 0.7) => [3, g, 0, 0], carpet: [7, 0.02, 0, 0], slag: [8, 0.12, 0, 0], glow: (k) => [6, 0, k, 0], coffer: [10, 0.15, 0, 0] };
const mul3 = (c, k) => [c[0] * k, c[1] * k, c[2] * k];

// the arena's floor: the pit round the pool and the dais, the levels (inlaid stone), their steps (ONE stone: the same
// green for riser and tread, the riser a little deeper in tone)
export async function buildFloors(plan, G, brk = async () => {}) {
  const F = plan.F, segOf = (R) => clamp(Math.round(2 * Math.PI * R / 5.2), 40, 120);
  G.lathe(0, 0, [[DIM.RPOOL + 0.8, 0], [DIM.RDAIS0, 0]], { seg: 56, color: C.white, surf: S_.floor, flat: true });
  G.lathe(0, 0, [[DIM.RDAIS1, 0], [23.6, 0], [DIM.RPIT, 0]], { seg: 64, color: C.white, surf: S_.floor, flat: true });
  for (let k = 1; k <= F.NT; k++) {
    const r0 = RISERS[k - 1], y0 = k - 1, seg = segOf(r0);
    for (let i = 0; i < 3; i++) {
      const ra = r0 + i * GO, ya = y0 + i / 3;
      G.lathe(0, 0, [[ra, ya], [ra, ya + 1 / 3]], { seg, color: mul3(C.green, 0.7), surf: S_.stone(0.25), flat: true });
      if (i < 2) G.lathe(0, 0, [[ra, ya + 1 / 3], [ra + GO, ya + 1 / 3]], { seg, color: mul3(C.green, 0.98), surf: S_.stone(0.3), flat: true });
    }
    const fl = F.flat(k), wide = fl[1] - fl[0] > 8, prof = wide ? [[fl[0], k], [lerp(fl[0], fl[1], 0.34), k], [lerp(fl[0], fl[1], 0.67), k], [fl[1], k]] : [[fl[0], k], [fl[1], k]];
    G.lathe(0, 0, prof, { seg: Math.max(seg, wide ? 96 : 0), color: C.white, surf: S_.floor, flat: true });
    if (k % 2 === 0) await brk();
  }
}

// the gallery's slab (R 94 to the drum), its parapet and brass rail (open where the pier runs out from it), and THE PIER:
// a floor 20 m wide along the last leg's line with its red runner, soffit, edges, parapets, rails and beams
export async function buildGallery(plan, G, brk = async () => {}) {
  const N = 240, y1 = DIM.YG, y0 = DIM.YG - 1, m = plan.mir, pier = plan.pier, RR = DIM.RRAIL, PW = DIM.PIERW;
  const at = (R, th, y) => [m * R * Math.sin(th * DEG), y, R * Math.cos(th * DEG)];
  const rails = [[], []];
  // is this bearing of the gallery's edge within the pier's root (its two root corners and half a metre more)
  const inRoot = (th) => { const q = pier.at(m * RR * Math.sin(th * DEG), RR * Math.cos(th * DEG)); return Math.abs(q.w) < PW + 0.3 && q.s > -30; };
  for (let i = 0; i < N; i++) {
    const ta = i * 360 / N, tb = (i + 1) * 360 / N;
    for (let j = 0; j < 3; j++) { const fa = j / 3, fb = (j + 1) / 3; G.quad(at(lerp(RR, DIM.RD, fa), ta, y1), at(lerp(RR, DIM.RD, fb), ta, y1), at(lerp(RR, DIM.RD, fb), tb, y1), at(lerp(RR, DIM.RD, fa), tb, y1), C.white, S_.floor); }
    // the gallery's soffit: pale plaster; THE BAY OVER THE WAY IN (between the two beams of the door's pair of columns)
    // is coffered in green and copper by paint and has the row of small lights along the door's axis
    for (const [sa, sb] of [[ta, Math.min(tb, DOOR.bay)], [Math.max(ta, DOOR.bay), Math.min(tb, 360 - DOOR.bay)], [Math.max(ta, 360 - DOOR.bay), tb]]) {
      if (sb - sa < 1e-6) continue;
      const bay = sb <= DOOR.bay + 1e-6 || sa >= 360 - DOOR.bay - 1e-6;
      G.quad(at(RR, sa, y0), at(DIM.RD, sa, y0), at(DIM.RD, sb, y0), at(RR, sb, y0), bay ? C.white : mul3(C.ivory, 0.62), bay ? S_.coffer : S_.plain(0.08));
    }
    if (i % 40 === 39) await brk();
    if (inRoot((ta + tb) / 2)) { if (rails[0].length) { rails[0].push(at(RR + 0.425, ta, y1 + 1.08)); rails[1].push(at(RR + 0.425, ta, y1 + 0.8)); rails.push(rails[0], rails[1]); rails[0] = []; rails[1] = []; } continue; }
    // the inner edge (green stone, a copper band under the lip); a low parapet 0.3 m inside it; posts for the rail
    G.quad(at(RR, ta, y0), at(RR, tb, y0), at(RR, tb, y0 + 0.62), at(RR, ta, y0 + 0.62), C.green, S_.stone(0.35));
    G.quad(at(RR, ta, y0 + 0.62), at(RR, tb, y0 + 0.62), at(RR, tb, y1), at(RR, ta, y1), C.copper, S_.metal(0.6));
    const pa = RR + 0.3;
    G.quad(at(pa, ta, y1), at(pa, tb, y1), at(pa, tb, y1 + 0.5), at(pa, ta, y1 + 0.5), C.greenDk, S_.stone(0.3));
    G.quad(at(pa + 0.25, ta, y1), at(pa + 0.25, tb, y1), at(pa + 0.25, tb, y1 + 0.5), at(pa + 0.25, ta, y1 + 0.5), C.greenDk, S_.stone(0.3));
    G.quad(at(pa, ta, y1 + 0.5), at(pa, tb, y1 + 0.5), at(pa + 0.25, tb, y1 + 0.5), at(pa + 0.25, ta, y1 + 0.5), C.green, S_.stone(0.4));
    if (i % 2 === 0) { const q = at(pa + 0.125, ta, y1 + 0.78); G.box(q[0], q[1], q[2], 0.09, 0.56, 0.09, 0, C.brass, S_.metal(0.8)); }
    rails[0].push(at(pa + 0.125, ta, y1 + 1.08)); rails[1].push(at(pa + 0.125, ta, y1 + 0.8));
    if (i === N - 1) { rails[0].push(at(pa + 0.125, tb, y1 + 1.08)); rails[1].push(at(pa + 0.125, tb, y1 + 0.8)); }
  }
  for (let k = 0; k < rails.length; k += 2) if (rails[k].length > 1) { G.tube(rails[k], 0.07, { sides: 4, color: C.brass, surf: S_.metal(0.85) }); G.tube(rails[k + 1], 0.04, { sides: 3, color: C.brass, surf: S_.metal(0.85) }); }
  for (const q of plan.columns) { const rm = (q.R + DIM.RD) / 2, c = at(rm, q.th, y0 - 0.27); G.box(c[0], c[1], c[2], 0.8, 0.55, DIM.RD - q.R + 1.2, m * q.th * DEG, C.copper, S_.metal(0.5)); }
  await brk();
  // ---- the pier (its own frame: s along the leg from the ring, w aside); its floor ends on the gallery's edge
  const PT = (sv, w, y) => { const q = pier.xz(sv, w); return [q[0], y, q[1]]; }, s0 = -DIM.PIERL, turn = Math.atan2(pier.d[0], pier.d[1]);
  const ws = [-PW, -7, -4, -1.6, 1.6, 4, 7, PW];
  for (let j = 0; j < ws.length - 1; j++) {
    const wa = ws[j], wb = ws[j + 1], ea = pier.root(wa), eb = pier.root(wb), runner = j === 3, nS = 6;
    for (let i = 0; i < nS; i++) {
      const fa = i / nS, fb = (i + 1) / nS;
      G.quad(PT(lerp(s0, ea, fa), wa, y1), PT(lerp(s0, eb, fa), wb, y1), PT(lerp(s0, eb, fb), wb, y1), PT(lerp(s0, ea, fb), wa, y1), runner ? C.carpet : C.white, runner ? S_.carpet : S_.floor);
    }
    G.quad(PT(s0, wa, y0), PT(ea, wa, y0), PT(eb, wb, y0), PT(s0, wb, y0), mul3(C.greenDk, 1.15), S_.stone(0.2));
  }
  // (the runner goes on over the gallery's floor to the ring's foot and 3 m beyond)
  G.quad(PT(pier.root(-1.6) - 0.05, -1.6, y1 + 0.03), PT(pier.root(1.6) - 0.05, 1.6, y1 + 0.03), PT(3, 1.6, y1 + 0.03), PT(3, -1.6, y1 + 0.03), C.carpet, S_.carpet);
  // edges, parapets and rails: the two long sides and the head
  const edge = (a, b) => {
    const A0 = PT(a[0], a[1], y0), B0 = PT(b[0], b[1], y0);
    G.quad(A0, B0, [B0[0], y0 + 0.62, B0[2]], [A0[0], y0 + 0.62, A0[2]], C.green, S_.stone(0.35));
    G.quad([A0[0], y0 + 0.62, A0[2]], [B0[0], y0 + 0.62, B0[2]], [B0[0], y1, B0[2]], [A0[0], y1, A0[2]], C.copper, S_.metal(0.6));
    // the parapet stands 0.42 m inside the edge (toward the pier's middle line)
    const ia = [a[0] + (a[2] || 0), a[1] - Math.sign(a[1]) * (a[3] ?? 0.42)], ib = [b[0] + (b[2] || 0), b[1] - Math.sign(b[1]) * (b[3] ?? 0.42)];
    const mx = (PT(ia[0], ia[1], 0)[0] + PT(ib[0], ib[1], 0)[0]) / 2, mz = (PT(ia[0], ia[1], 0)[2] + PT(ib[0], ib[1], 0)[2]) / 2, len = Math.hypot(ib[0] - ia[0], ib[1] - ia[1]), tr = turn + Math.atan2(ib[1] - ia[1], ib[0] - ia[0]);
    G.box(mx, y1 + 0.25, mz, 0.25, 0.5, len, tr, C.greenDk, S_.stone(0.3));
    const top = [], low = [], np = Math.max(1, Math.round(len / 3.2));
    for (let i = 0; i <= np; i++) { const q = PT(lerp(ia[0], ib[0], i / np), lerp(ia[1], ib[1], i / np), y1); top.push([q[0], y1 + 1.08, q[2]]); low.push([q[0], y1 + 0.8, q[2]]); G.box(q[0], y1 + 0.78, q[2], 0.09, 0.56, 0.09, 0, C.brass, S_.metal(0.8)); }
    G.tube(top, 0.07, { sides: 4, color: C.brass, surf: S_.metal(0.85) }); G.tube(low, 0.04, { sides: 3, color: C.brass, surf: S_.metal(0.85) });
  };
  edge([s0, -PW], [pier.root(-PW) - 0.4, -PW]); edge([s0, PW], [pier.root(PW) - 0.4, PW]);
  edge([s0, -PW + 0.01, 0.42, 0], [s0, PW - 0.01, 0.42, 0]);
  for (let sv = s0 + 4; sv < -3; sv += 12) { const c = PT(sv, 0, y0 - 0.27); if (Math.hypot(c[0], c[2]) < RR - 3) G.box(c[0], c[1], c[2], 14.4, 0.55, 0.8, turn, C.copper, S_.metal(0.5)); }
}

// the drum (a low wall of green stone with copper bands); THE DOOR, 13 m wide and 9 m high (its head is the gallery's
// slab): its reveals splayed, of fluted green stone with a copper band and a lamp each at the height the lens passes; its
// two leaves of the same fluted stone in copper stiles, folded back flat against the drum's wall either side, a lamp on
// each; its head's soffit coffered by paint with the row of small lights; the porch with its columns; a short stair of
// four steps in ONE stone with a thin brass nosing; the forecourt and THE CAUSEWAY of paving out across the broken ground
export function buildDrum(plan, G) {
  const top = DIM.YOUT + DIM.DOORH, RO = DOOR.RO;
  // the wall's inner face is open to the splay's inner breadth, its outer face to the opening's own
  const dI = Math.asin(DOOR.hi / DIM.RD), i0 = dI, i1 = Math.PI * 2 - dI, dO = Math.asin(DOOR.hw / RO);
  // inside face under the gallery (dark base, green wall, a copper band under the slab), outside face from under the
  // ground to the rim, the rim's copper curb
  G.lathe(0, 0, [[DIM.RD, DIM.YOUT], [DIM.RD, 12.8]], { seg: 150, a0: i0, a1: i1, color: C.greenDk, surf: S_.stone(0.35), flat: true });
  G.lathe(0, 0, [[DIM.RD, 12.8], [DIM.RD, 19.7]], { seg: 150, a0: i0, a1: i1, color: C.green, surf: S_.stone(0.35), flat: true });
  G.lathe(0, 0, [[DIM.RD, 19.7], [DIM.RD, DIM.YG - 1]], { seg: 150, a0: i0, a1: i1, color: C.copper, surf: S_.metal(0.6), flat: true });
  G.lathe(0, 0, [[RO + 0.5, DIM.YPLAIN - 3], [RO + 0.5, DIM.YPLAIN + 1.2], [RO, DIM.YPLAIN + 1.6], [RO, top]], { seg: 150, a0: dO, a1: Math.PI * 2 - dO, color: C.green, surf: S_.stone(0.3), flat: true });
  G.lathe(0, 0, [[RO, top], [RO + 0.25, top + 0.3], [RO + 0.25, DIM.YG + 0.5], [DIM.RD + 0.35, DIM.YG + 0.75], [DIM.RD + 0.35, DIM.YG]], { seg: 150, color: C.copper, surf: S_.metal(0.6), flat: true });
  // THE REVEALS (jambs), the head's soffit, the sill. A wall of flutes from A to B (in plan) between two heights: n
  // flutes, each sunk 0.1 m INTO the wall (never toward the way)
  const { hw, hi, lw, zi, zo, len: rl, yLamp } = DOOR, yb0 = yLamp - 0.4, yb1 = yLamp + 0.3, gstone = mul3(C.green, 1.2);
  const flutes = (pt, n, ya, yb, color) => {
    for (let j = 0; j < n; j++) {
      const q0 = pt(j / n, 0), q1 = pt((j + 0.5) / n, 0.1), q2 = pt((j + 1) / n, 0);
      G.quad([q0[0], ya, q0[1]], [q1[0], ya, q1[1]], [q1[0], yb, q1[1]], [q0[0], yb, q0[1]], color, S_.stone(0.4));
      G.quad([q1[0], ya, q1[1]], [q2[0], ya, q2[1]], [q2[0], yb, q2[1]], [q1[0], yb, q1[1]], color, S_.stone(0.4));
    }
  };
  const lampAt = (foot, q) => { G.tube([foot, q], 0.035, { sides: 4, color: C.copper, surf: S_.metal(0.7) }); G.ball(q[0], q[1], q[2], 0.2, { rings: 3, seg: 6, color: C.lamp, surf: S_.glow(1.4) }); };
  DOOR.leaves.forEach((lf, k) => {
    const sd = k ? 1 : -1, into = [sd * (zo - zi) / rl, (hi - hw) / rl];
    // t along the reveal from the outer face to the inner, d into the wall
    const pt = (t, d) => [sd * lerp(hw, hi, t) + into[0] * d, lerp(zo, zi, t) + into[1] * d], flat = (ya, yb, color, surf) => { const a = pt(0, 0), b = pt(1, 0); G.quad([a[0], ya, a[1]], [b[0], ya, b[1]], [b[0], yb, b[1]], [a[0], yb, a[1]], color, surf); };
    flat(DIM.YOUT, DIM.YOUT + 0.6, C.greenDk, S_.stone(0.35));
    flutes(pt, 5, DIM.YOUT + 0.6, yb0, gstone); flat(yb0, yb1, C.copper, S_.metal(0.65)); flutes(pt, 5, yb1, top, gstone);
    const m = pt(0.5, 0), lq = DOOR.lamps[k * 2]; lampAt([m[0], yLamp, m[1]], lq);
    // the leaf: a slab of dark stone folded back flat against the wall's outer face beside the opening; on its face
    // eleven flutes of green stone between two copper stiles, the copper band, a lamp
    const { xm, zm, tw } = lf, c = Math.cos(tw), sn = Math.sin(tw), y0 = DIM.YOUT + 0.1, y1 = top - 0.2;
    const Lp = (u, w) => [xm + u * c + w * sn, zm - u * sn + w * c], fu = lw / 2 - 0.22, lpt = (t, d) => Lp(lerp(-fu, fu, t), 0.2 - d);
    G.box(xm, (y0 + y1) / 2, zm, lw, y1 - y0, 0.2, tw, mul3(C.greenDk, 1.1), S_.stone(0.35));
    for (const u of [-(lw / 2 - 0.11), lw / 2 - 0.11]) { const q = Lp(u, 0.15); G.box(q[0], (y0 + y1) / 2, q[1], 0.22, y1 - y0, 0.12, tw, C.copper, S_.metal(0.6)); }
    flutes(lpt, 11, y0, yb0, gstone); flutes(lpt, 11, yb1, y1, gstone);
    { const a = Lp(-fu, 0.2), b = Lp(fu, 0.2); G.quad([a[0], yb0, a[1]], [b[0], yb0, b[1]], [b[0], yb1, b[1]], [a[0], yb1, a[1]], C.copper, S_.metal(0.65)); }
    const lf0 = Lp(0, 0.2); lampAt([lf0[0], yLamp, lf0[1]], DOOR.lamps[k * 2 + 1]);
  });
  // the head's soffit: coffered by paint as the bay of the gallery's soffit behind it; the row of small lights let into both
  G.quad([-hw, top, zo], [hw, top, zo], [hi, top, zi], [-hi, top, zi], C.white, S_.coffer);
  for (const q of DOOR.row) G.lathe(q[0], q[2], [[0.001, q[1]], [0.2, q[1]]], { seg: 8, color: C.lamp, surf: S_.glow(1.5), flat: true });
  G.quad([-hi - 0.1, DIM.YOUT, zi - 0.4], [hi + 0.1, DIM.YOUT, zi - 0.4], [hi + 0.1, DIM.YOUT, zo + 0.6], [-hi - 0.1, DIM.YOUT, zo + 0.6], C.white, S_.floor);
  // the porch: a floor before the door, six tall columns, an entablature whose soffit stands 12.4 m over the porch floor:
  // 3.4 m over the door's head (9 m) and 1.65 m over the drum's copper rim (10.75 m), so that the whole door and the
  // drum's rim stand under it in the open
  const zp = DIM.RPORCH, pw = 23, stone = mul3(C.green, 0.98);
  G.quad([-pw, DIM.YOUT, zo - 1.5], [pw, DIM.YOUT, zo - 1.5], [pw, DIM.YOUT, zp], [-pw, DIM.YOUT, zp], C.white, S_.floor);
  for (const q of plan.porch.columns) columnInto(G, q.x, DIM.YOUT, q.z, 0.95, 12.4, 16);
  G.box(0, DIM.YOUT + 13.6, (zo + zp) / 2 - 0.4, pw * 2 + 2, 2.4, zp - zo + 1.6, 0, C.green, S_.stone(0.3));
  G.box(0, DIM.YOUT + 15.0, (zo + zp) / 2 - 0.4, pw * 2 + 3, 0.5, zp - zo + 2.6, 0, C.copper, S_.metal(0.6));
  // the stair: four steps of 0.2 m, 0.5 m deep, riser and tread of one stone (the riser, which faces away from the door's
  // light, laid a shade paler so that the two come out near one tone), a thin brass nosing
  const ns = 4, rise = (DIM.YOUT - DIM.YWAY) / ns, go = (DIM.RSTEPS - DIM.RPORCH) / ns;
  for (let i = 0; i < ns; i++) {
    const y = DIM.YOUT - i * rise, z = zp + i * go;
    G.quad([-pw, y, z], [pw, y, z], [pw, y - rise, z], [-pw, y - rise, z], mul3(stone, 1.5), S_.stone(0.25));
    G.quad([-pw, y - rise, z], [pw, y - rise, z], [pw, y - rise, z + go], [-pw, y - rise, z + go], stone, S_.stone(0.3));
    G.box(0, y - 0.012, z + 0.012, pw * 2, 0.024, 0.03, 0, C.brass, S_.metal(0.8));
  }
  // cheek blocks either side of the porch and the stair; the forecourt at the stair's foot; the causeway and its walls
  const zf = DIM.RSTEPS, zc = zf + 6, fw = 25, yw = DIM.YWAY, yb = DIM.YPLAIN - 2, pave = mul3(C.cream, 0.62), P9 = [9, 0.25, 0, 0];
  for (const sd of [-1, 1]) {
    G.box(sd * (pw + 1.6), (DIM.YOUT + yb) / 2 + 0.3, (zo + zf) / 2 + 0.5, 3.2, DIM.YOUT - yb + 0.6, zf - zo + 3, 0, C.green, S_.stone(0.3));
    G.box(sd * (fw + 1.1), (yw + yb) / 2 + 0.45, zf + 3.2, 2.2, yw - yb + 0.9, 7.4, 0, C.greenDk, S_.stone(0.3));
    G.quad([sd * WAY.HALF, yw, zc], [sd * fw, yw, zc], [sd * fw, yb, zc], [sd * WAY.HALF, yb, zc], mul3(C.green, 0.8), S_.stone(0.25));
    // the causeway's side wall and its low kerb
    for (let z = zc; z < WAY.ZEND; z += 46) { const z2 = Math.min(WAY.ZEND, z + 46); G.quad([sd * (WAY.HALF + 0.3), yw + 0.3, z], [sd * (WAY.HALF + 0.3), yw + 0.3, z2], [sd * (WAY.HALF + 0.3), yb, z2], [sd * (WAY.HALF + 0.3), yb, z], mul3(C.green, 0.8), S_.stone(0.25)); }
    G.box(sd * (WAY.HALF + 0.05), yw + 0.15, (zc + WAY.ZEND) / 2, 0.5, 0.3, WAY.ZEND - zc, 0, mul3(C.green, 0.9), S_.stone(0.3));
  }
  G.quad([-fw, yw, zf], [fw, yw, zf], [fw, yw, zc], [-fw, yw, zc], pave, P9);
  for (let z = zc; z < WAY.ZEND; z += 46) { const z2 = Math.min(WAY.ZEND, z + 46); G.quad([-WAY.HALF, yw, z], [WAY.HALF, yw, z], [WAY.HALF, yw, z2], [-WAY.HALF, yw, z2], pave, P9); }
  // the lamp standards' plinths among the slabs
  for (const q of plan.porch.lamps) G.box(q.x, (yw + 0.4 + yb) / 2, q.z, 1.7, yw + 0.4 - yb, 1.7, 0, mul3(C.green, 0.85), S_.stone(0.3));
}

// a squat column of veined green stone with copper collars; r its radius, h its height
export function columnInto(G, x, y, z, r, h, seg = 14) {
  G.lathe(x, z, [[r * 1.3, y], [r * 1.3, y + 0.5], [r * 1.12, y + 0.7]], { seg, color: C.greenDk, surf: S_.stone(0.35), flat: true });
  G.lathe(x, z, [[r * 1.12, y + 0.7], [r * 1.12, y + 1.0]], { seg, color: C.copper, surf: S_.metal(0.7), flat: true });
  const prof = [];
  for (let j = 0; j <= 4; j++) { const t = j / 4; prof.push([r * (1 + 0.06 * Math.sin(t * Math.PI)), y + 1.0 + t * (h - 2.5)]); }
  G.lathe(x, z, prof, { seg, color: C.green, surf: S_.stone(0.45) });
  G.lathe(x, z, [[r * 1.05, y + h - 1.5], [r * 1.18, y + h - 1.3], [r * 1.18, y + h - 0.95]], { seg, color: C.copper, surf: S_.metal(0.7), flat: true });
  G.lathe(x, z, [[r * 1.18, y + h - 0.95], [r * 1.55, y + h - 0.3], [r * 1.55, y + h]], { seg, color: C.greenDk, surf: S_.stone(0.35), flat: true });
}

// the dome's ribs: 48 meridians (every fourth a main rib; half of them stop at 42 m, half the rest at 52 m over the rim),
// ten rings of glazing bars, the topmost a strong ring at the crown, of the ribs' own dark iron. All a little inside the glass.
export async function buildRibs(plan, G, brk = async () => {}) {
  const NM = 48, pt = (a, f, inset) => { const an = f * Math.PI / 2, r = (DIM.RD - inset) * Math.cos(an), y = DIM.YG + (DIM.HD - inset) * Math.sin(an); return [r * Math.sin(a), y, r * Math.cos(a)]; };
  const fTop = 0.94;
  for (let i = 0; i < NM; i++) {
    const a = (i + 0.5) / NM * Math.PI * 2, main = i % 4 === 0, f1 = main ? fTop : i % 2 === 0 ? 0.72 : 0.52, n = Math.round(18 * f1), pts = [];
    for (let j = 0; j <= n; j++) pts.push(pt(a, f1 * j / n, main ? 0.34 : 0.2));
    G.tube(pts, main ? 0.3 : 0.17, { sides: 4, color: C.rib, surf: S_.metal(0.35) });
    if (i % 12 === 11) await brk();
  }
  const fr = [0.05, 0.12, 0.2, 0.29, 0.38, 0.52, 0.62, 0.72, 0.83, fTop];
  fr.forEach((f, k) => {
    const strong = k === 5 || k === 7 || k === 9, an = f * Math.PI / 2, r = (DIM.RD - 0.26) * Math.cos(an), y = DIM.YG + (DIM.HD - 0.26) * Math.sin(an), w = strong ? 0.3 : 0.15;
    G.lathe(0, 0, [[r - w, y], [r, y + w], [r + w * 0.4, y], [r, y - w], [r - w, y]], { seg: 96, color: C.rib, surf: S_.metal(0.35), flat: true });
  });
}

// ================================================================ THE FURNISHING (prototypes for instancing; origin at the foot)
// THE TABLES IN THEIR KINDS (C2): for two, for four, for eight (a copper stand with a great cup in its middle), long
// tables (three cups), half-round booths (a low copper screen, a bench, a table), serving stations (a sideboard with
// covered dishes, bottles, plates). The cloth is white (it takes the instance's cloth colour; its top carries the candle's
// painted pool, in the cup's own colour); the cup of glass glows (it takes the instance's cup colour).
// state 0 laid and untouched, 1 dinner for two under way, 2 dinner for all its places, 3 with covered dishes that steam.
// lod 0 near, 1 middle, 2 far.
const clothOf = (reach, cx = 0, cz = 0) => (r, y, a) => [4, 2.05, y > 0.75 ? Math.pow(clamp(1 - Math.hypot(r * Math.sin(a) - cx, r * Math.cos(a) - cz) / reach, 0, 1), 1.2) : 0.1 * clamp((y - 0.2) / 0.56, 0, 1), 0];
// a candle cup of coloured glass at (x, z), its foot at y, sc its size (the flame stands in it, its tip over the rim)
function cupInto(G, x, z, y, sc, lod) {
  const prof = lod === 2 ? [[0.12, y - 0.02], [0.19, y + 0.24]] : [[0.09, y], [0.17, y + 0.1], [0.15, y + 0.22]];
  G.lathe(x, z, prof.map((q) => [q[0] * sc, y + (q[1] - y) * sc]), { seg: [6, 5, 4][lod], color: C.white, surf: [6, 0, 1.15, 0] });
}
// a cover at (px, pz): a plate; near, a folded napkin (untouched) or food left and a glass part filled (used)
function coverInto(G, px, pz, a, used, lod, k) {
  G.lathe(px, pz, [[0.001, 0.778], [0.14, 0.786]], { seg: lod === 0 ? 6 : 4, color: C.ivory, surf: S_.plain(0.7), flat: true });
  if (lod > 0) return;
  if (!used) { G.lathe(px, pz, [[0.055, 0.785], [0.001, 0.93]], { seg: 4, color: mul3(C.ivory, 0.95), surf: S_.plain(0.1), flat: true }); return; }
  G.ball(px + 0.02, 0.8, pz - 0.01, 0.06, { rings: 2, seg: 4, squash: 0.6, color: k % 2 ? hexLin('#7a4a22') : hexLin('#4f6a2a'), surf: S_.plain(0.3) });
  const gx = px + 0.2 * Math.cos(a + 1.9), gz = pz + 0.2 * Math.sin(a + 1.9), wine = k % 2 ? hexLin('#7a1622') : hexLin('#c9a04a');
  G.lathe(gx, gz, [[0.035, 0.778], [0.007, 0.86]], { seg: 3, color: C.cream, surf: S_.plain(0.9) });
  G.lathe(gx, gz, [[0.007, 0.86], [0.042, 0.91], [0.038, 0.98]], { seg: 4, color: (r, y) => (y > 0.95 ? C.cream : wine), surf: S_.plain(0.9) });
}
const bottleInto = (G, x, z, y, col = hexLin('#1c3a22')) => G.lathe(x, z, [[0.04, y], [0.04, y + 0.17], [0.015, y + 0.24], [0.015, y + 0.31]], { seg: 4, color: col, surf: S_.plain(0.9) });
// a covered dish of copper (its steam is a dab of the air)
function dishInto(G, x, z, y, r) { G.lathe(x, z, [[r * 1.06, y], [r * 1.06, y + 0.03]], { seg: 6, color: C.copper, surf: S_.metal(0.8), flat: true }); G.ball(x, y + 0.03, z, r, { rings: 3, seg: 6, squash: 0.75, color: C.copper, surf: S_.metal(0.85) }); }
export function tableGeometry(kind, state, lod) {
  const G = makeBuilder();
  if (kind === 'long') return longTableInto(G, state, lod);
  if (kind === 'booth') return boothInto(G, state, lod);
  if (kind === 'station') return stationInto(G, lod);
  const R = kind === 'two' ? 0.48 : kind === 'eight' ? 1.5 : 0.8, seg = (kind === 'eight' ? [18, 12, 8] : [12, 9, 6])[lod];
  const cloth = clothOf(kind === 'eight' ? 1.15 : R + 0.06);
  G.lathe(0, 0, [[0.001, 0.76], [R, 0.76]], { seg, color: C.white, surf: cloth, flat: true });
  G.lathe(0, 0, lod === 0 ? [[R, 0.76], [R + 0.05, 0.5], [R + 0.07, 0.16]] : [[R, 0.76], [R + 0.07, 0.16]], { seg, color: (r, y) => mul3(C.white, y > 0.6 ? 0.95 : 0.62), surf: cloth });
  if (kind === 'eight') {
    // a round rug under it; in its middle a copper stand that carries the great cup
    G.lathe(0, 0, [[0.001, 0.03], [2.5, 0.03]], { seg, color: mul3(C.carpet, 0.9), surf: S_.carpet, flat: true });
    G.lathe(0, 0, [[0.2, 0.765], [0.07, 0.83], [0.06, 0.96], [0.2, 1.02]], { seg: [8, 6, 4][lod], color: C.copper, surf: S_.metal(0.8) });
  }
  const cup = TABLES[kind].cups[0];
  cupInto(G, cup[0], cup[2], cup[1], cup[3], lod);
  const covers = kind === 'two' ? 2 : kind === 'eight' ? 8 : state === 1 ? 2 : 4, cr = kind === 'two' ? 0.27 : kind === 'eight' ? 1.14 : 0.5;
  if (lod === 2) {
    for (let k = 0; k < (kind === 'eight' ? 4 : 2); k++) { const a = k * (kind === 'eight' ? 1.5708 : 3.1) + 0.4; G.lathe(cr * 0.9 * Math.cos(a), cr * 0.9 * Math.sin(a), [[0.001, 0.775], [kind === 'eight' ? 0.2 : 0.14, 0.775]], { seg: 4, color: C.ivory, surf: S_.plain(0.6), flat: true }); }
    const o = kind === 'two' ? 0.16 : kind === 'eight' ? 0.52 : 0.22;
    farState(G, state, o * 0.9, -o, DISHES[kind]);
    return G;
  }
  for (let k = 0; k < covers; k++) {
    const a = k * Math.PI * 2 / covers + 0.5;
    coverInto(G, cr * Math.cos(a), cr * Math.sin(a), a, state > 0 && (kind !== 'eight' || k % 4 !== 3), lod, k);
  }
  if (lod === 0 && state > 0) {
    // a bottle (no label); with state 3 a covered dish of copper off the middle (two on a table for eight), else a bread dish
    const o = kind === 'two' ? 0.16 : kind === 'eight' ? 0.52 : 0.22;
    bottleInto(G, o * 0.9, -o, 0.778);
    if (kind === 'eight') bottleInto(G, -o * 0.8, o * 1.1, 0.778, hexLin('#3a1c16'));
    if (state === 3) { dishInto(G, -o * 1.2, o * 0.9, 0.778, kind === 'two' ? 0.12 : 0.16); if (kind === 'eight') dishInto(G, o * 1.3, o * 0.5, 0.778, 0.2); }
    else G.lathe(-o * 1.1, o, [[0.001, 0.778], [0.13, 0.778], [0.17, 0.83]], { seg: 6, color: C.cream, surf: S_.plain(0.6), flat: true });
  } else if (lod === 1 && state > 0) {
    // (the middling level draws its bottle too, at the near level's own place: a table's dinner is the same at every level)
    const o = kind === 'two' ? 0.16 : kind === 'eight' ? 0.52 : 0.22;
    bottleInto(G, o * 0.9, -o, 0.778);
    if (state === 3) for (const q of DISHES[kind]) dishInto(G, q[0], q[1], 0.778, 0.16);
  }
  return G;
}

// THE DINNER'S STATE ON A FAR TABLE, as a few faces: a bottle where dinner is under way, a covered dish of copper where
// it steams (at the dish's own place, so that its steam rises from it at every level)
function farState(G, state, bx, bz, dishes) {
  if (state > 0) G.lathe(bx, bz, [[0.045, 0.778], [0.045, 0.95], [0.016, 1.09]], { seg: 3, color: hexLin('#1c3a22'), surf: S_.plain(0.9) });
  if (state === 3 && dishes) for (const q of dishes) G.lathe(q[0], q[1], [[0.17, 0.778], [0.14, 0.87], [0.001, 0.92]], { seg: 4, color: C.copper, surf: S_.metal(0.85) });
}
// where the covered dishes stand on each kind (their steam rises from there): [x, z] in the table's own frame
export const DISHES = { two: [[-0.19, 0.14]], four: [[-0.26, 0.2]], eight: [[-0.62, 0.47], [0.68, 0.26]], station: [[-0.5, 0.02], [0.32, 0.06]] };
// a flat top between x0..x1 and z0..z1 at height y, as a grid whose corners carry the pools about the cups
function gridTop(G, x0, x1, z0, z1, nx, nz, y, cups, reach) {
  const pool = (x, z) => { let p = 0; for (const c of cups) p = Math.max(p, Math.pow(clamp(1 - Math.hypot(x - c[0], z - c[2]) / reach, 0, 1), 1.2)); return p; };
  const id = [];
  for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) { const x = lerp(x0, x1, i / nx), z = lerp(z0, z1, j / nz); id.push(G.vert([x, y, z], [0, 1, 0], C.white, [4, 2.05, pool(x, z), 0])); }
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const q = j * (nx + 1) + i; G.tri(id[q], id[q + nx + 1], id[q + 1]); G.tri(id[q + 1], id[q + nx + 1], id[q + nx + 2]); }
}
// a long table for ten along its own x: a cloth to near the floor, three cups, five covers a side
function longTableInto(G, state, lod) {
  const hx = 3.1, hz = 0.62, cups = TABLES.long.cups, hem = mul3(C.white, 0.74), sk = [4, 2.05, 0.03, 0];
  gridTop(G, -hx, hx, -hz, hz, [12, 6, 3][lod], lod === 2 ? 1 : 2, 0.76, cups, 1.0);
  for (const [ax, az, bx, bz] of [[-hx, -hz, hx, -hz], [hx, -hz, hx, hz], [hx, hz, -hx, hz], [-hx, hz, -hx, -hz]]) G.quad([ax, 0.76, az], [bx, 0.76, bz], [bx * 1.015, 0.16, bz * 1.09], [ax * 1.015, 0.16, az * 1.09], hem, sk);
  for (const c of cups) cupInto(G, c[0], c[2], c[1], c[3], lod);
  if (lod === 2) { for (const x of [-1.2, 1.2]) for (const z of [-0.36, 0.36]) G.lathe(x, z, [[0.001, 0.775], [0.16, 0.775]], { seg: 4, color: C.ivory, surf: S_.plain(0.6), flat: true }); farState(G, state, -1.05, 0.05); return G; }
  for (let j = 0; j < 5; j++) for (const sz of [-1, 1]) coverInto(G, -2.4 + j * 1.2, sz * 0.38, sz > 0 ? 1.57 : -1.57, state > 0 && (j + (sz > 0 ? 1 : 0)) % 5 !== 3, lod, j);
  if (lod === 0 && state > 0) { bottleInto(G, -1.05, 0.05, 0.778); bottleInto(G, 1.0, -0.06, 0.778, hexLin('#3a1c16')); G.lathe(0.55, 0.03, [[0.001, 0.778], [0.13, 0.778], [0.17, 0.83]], { seg: 6, color: C.cream, surf: S_.plain(0.6), flat: true }); }
  else if (lod === 1 && state > 0) bottleInto(G, -1.05, 0.05, 0.778);
  return G;
}
// a half-round booth: a low screen of copper on a foot of green stone round its outer side (+z), a cushioned bench
// inside the screen, a round table for four in its middle; open toward the room's middle (-z)
function boothInto(G, state, lod) {
  const seg = [14, 9, 6][lod], A0 = -100 * DEG, A1 = 100 * DEG, B0 = -86 * DEG, B1 = 86 * DEG, seat = mul3(C.carpet, 1.25);
  G.lathe(0, 0, [[2.3, 0], [2.3, 0.26]], { seg, a0: A0, a1: A1, color: C.greenDk, surf: S_.stone(0.35), flat: true });
  G.lathe(0, 0, [[2.3, 0.26], [2.3, 1.36]], { seg, a0: A0, a1: A1, color: C.copper, surf: S_.metal(0.65), flat: true, rmul: lod === 0 ? (a) => 1 + 0.012 * Math.cos(a * 18) : undefined });
  G.lathe(0, 0, [[2.24, 1.36], [2.37, 1.36], [2.37, 1.46], [2.24, 1.46]], { seg, a0: A0, a1: A1, color: C.brass, surf: S_.metal(0.8), flat: true });
  G.lathe(0, 0, [[1.5, 0.08], [1.5, 0.45], [2.12, 0.45]], { seg, a0: B0, a1: B1, color: seat, surf: S_.plain(0.12), flat: true });
  G.lathe(0, 0, [[2.12, 0.45], [2.22, 1.08]], { seg, a0: B0, a1: B1, color: mul3(seat, 0.8), surf: S_.plain(0.12), flat: true });
  const tseg = [12, 9, 6][lod], cloth = clothOf(0.86);
  G.lathe(0, 0, [[0.001, 0.76], [0.8, 0.76]], { seg: tseg, color: C.white, surf: cloth, flat: true });
  G.lathe(0, 0, [[0.8, 0.76], [0.87, 0.16]], { seg: tseg, color: (r, y) => mul3(C.white, y > 0.6 ? 0.95 : 0.62), surf: cloth });
  cupInto(G, 0, 0, 0.8, 1, lod);
  if (lod === 2) { for (const k of [0, 3]) { const a = (k - 1.5) * 0.9 + Math.PI / 2; G.lathe(0.5 * Math.cos(a), 0.5 * Math.sin(a), [[0.001, 0.775], [0.14, 0.775]], { seg: 4, color: C.ivory, surf: S_.plain(0.6), flat: true }); } farState(G, state, 0.2, -0.22); return G; }
  for (let k = 0; k < 4; k++) { const a = (k - 1.5) * 0.9 + Math.PI / 2; coverInto(G, 0.5 * Math.cos(a), 0.5 * Math.sin(a), a, state > 0, lod, k); }
  if (lod < 2 && state > 0) bottleInto(G, 0.2, -0.22, 0.778);
  return G;
}
// a serving station: a sideboard of dark wood under a runner of cloth, a copper rail at its back (+z); on it two covered
// dishes that steam, a stack of plates, bottles, two small candle cups
function stationInto(G, lod) {
  const cups = TABLES.station.cups, wood = mul3(C.wood, 1.25);
  G.box(0, 0.475, 0, 3.2, 0.95, 0.9, 0, wood, S_.plain(0.45));
  gridTop(G, -1.52, 1.52, -0.36, 0.36, lod === 2 ? 4 : 8, 1, 0.957, cups, 0.8);
  G.box(0, 1.1, 0.43, 3.2, 0.3, 0.04, 0, C.copper, S_.metal(0.7));
  for (const c of cups) cupInto(G, c[0], c[2], c[1], c[3], lod);
  DISHES.station.forEach((q, i) => dishInto(G, q[0], q[1], 0.96, i ? 0.2 : 0.24));
  if (lod === 2) return G;
  G.lathe(0.8, -0.1, [[0.13, 0.96], [0.13, 1.1]], { seg: 6, color: C.ivory, surf: S_.plain(0.6), flat: true });
  G.lathe(0.8, -0.1, [[0.001, 1.1], [0.13, 1.1]], { seg: 6, color: C.ivory, surf: S_.plain(0.7), flat: true });
  const cols = [hexLin('#1c3a22'), hexLin('#3a1c16'), hexLin('#5a4a1a')];
  [[-1.42, 0.16], [-1.34, -0.14], [-0.86, 0.24], [1.42, 0.14], [1.36, -0.16]].forEach((q, i) => bottleInto(G, q[0], q[1], 0.96, cols[i % 3]));
  return G;
}

// a dining chair: copper-brown frame, a seat of dark green; its front toward +z (the table lies toward -z when pushed in)
export function chairGeometry(lod, wood = C.wood) {
  const G = makeBuilder(), seat = mul3(C.greenDk, 1.1);
  if (lod === 2) {
    G.quad([-0.22, 0.47, -0.2], [0.22, 0.47, -0.2], [0.22, 0.47, 0.22], [-0.22, 0.47, 0.22], seat, S_.plain(0.1));
    G.quad([-0.22, 0.47, 0.22], [0.22, 0.47, 0.22], [0.2, 1.0, 0.27], [-0.2, 1.0, 0.27], wood, S_.plain(0.3));
    G.quad([-0.22, 0.0, -0.2], [0.22, 0.0, -0.2], [0.22, 0.47, -0.2], [-0.22, 0.47, -0.2], mul3(wood, 0.6), S_.plain(0.1));
    return G;
  }
  if (lod === 1) {
    G.quad([-0.22, 0.47, -0.2], [0.22, 0.47, -0.2], [0.22, 0.47, 0.22], [-0.22, 0.47, 0.22], seat, S_.plain(0.1));
    G.quad([-0.22, 0.0, 0.22], [0.22, 0.0, 0.22], [0.2, 1.0, 0.25], [-0.2, 1.0, 0.25], wood, S_.plain(0.3));
    G.quad([-0.22, 0.0, -0.2], [0.22, 0.0, -0.2], [0.22, 0.47, -0.2], [-0.22, 0.47, -0.2], mul3(wood, 0.6), S_.plain(0.1));
    for (const sx of [-1, 1]) G.quad([sx * 0.22, 0.0, -0.2], [sx * 0.22, 0.0, 0.22], [sx * 0.22, 0.47, 0.22], [sx * 0.22, 0.47, -0.2], mul3(wood, 0.7), S_.plain(0.1));
    return G;
  }
  G.box(0, 0.45, 0, 0.46, 0.07, 0.44, 0, seat, S_.plain(0.15));

  // four posts as four faces each (the back pair runs up into the back), two slats
  const post = (x, z, y0, y1) => { const h = 0.022; for (const [ax, az, bx, bz] of [[-h, -h, h, -h], [h, -h, h, h], [h, h, -h, h], [-h, h, -h, -h]]) G.quad([x + ax, y0, z + az], [x + bx, y0, z + bz], [x + bx, y1, z + bz], [x + ax, y1, z + az], wood, S_.plain(0.3)); };
  for (const sx of [-1, 1]) { post(sx * 0.2, -0.18, 0, 0.42); post(sx * 0.2, 0.2, 0, 1.0); }
  for (const y of [0.93, 0.68]) G.quad([-0.2, y - 0.06, 0.2], [0.2, y - 0.06, 0.2], [0.2, y + 0.06, 0.2], [-0.2, y + 0.06, 0.2], wood, S_.plain(0.3));
  return G;
}

const GLAZES = [hexLin('#1f5a5e'), hexLin('#7a2a22'), hexLin('#b08a2e'), hexLin('#d8ccb0'), hexLin('#27406e')];
const FLOWERS = [hexLin('#d9708a'), hexLin('#f2e7c9'), hexLin('#e3a53a'), hexLin('#b83a4a'), hexLin('#e8d0e0')];

// a palm in a great glazed pot: no two alike (height, reach, lean, the count and droop of its fronds by the thing's own draws)
export function palmInto(G, f, far) {
  const r = makeRng(hashSeed('tables-palm:' + f.key)), x = f.x, y = f.y, z = f.z;
  const glaze = GLAZES[r.int(0, 4)];
  G.lathe(x, z, [[0.72, y], [1.02, y + 0.5], [1.08, y + 1.0], [0.9, y + 1.24], [1.0, y + 1.32]], { seg: far ? 6 : 9, color: glaze, surf: S_.plain(0.85) });
  G.lathe(x, z, [[0.001, y + 1.22], [0.92, y + 1.22]], { seg: far ? 6 : 9, color: mul3(C.wood, 0.5), surf: S_.plain(0.05), flat: true });
  // the trunk: a bent line from the pot to the crown, ringed
  const lean = f.lean * f.h, la = f.turn * DEG, n = far ? 4 : 6, pts = [];
  for (let i = 0; i <= n; i++) { const t = i / n, k = t * t * lean; pts.push([x + Math.sin(la) * k, y + 1.2 + t * (f.h - 1.2), z + Math.cos(la) * k]); }
  G.tube(pts, (t) => lerp(0.36, 0.2, t), { sides: far ? 4 : 5, color: (t) => mul3(C.trunk, 0.75 + 0.35 * ((Math.round(t * n) % 2))), surf: (t) => [0, 0.1, 0, 0.12 * t * t] });
  const top = pts[n], nf = far ? Math.max(8, f.fronds - 3) : f.fronds, ns = far ? 4 : 7;
  for (let k = 0; k < nf; k++) {
    // a frond: an arching midrib; leaflets as a folded, saw-edged blade either side of it
    const a = (k + r.range(-0.3, 0.3)) / nf * Math.PI * 2, tier = k % 3, len = f.reach * r.range(0.85, 1.15) * (tier === 2 ? 0.8 : 1), lift = [1.5, 0.6, 2.3][tier] + r.range(-0.3, 0.3), droop = r.range(1.2, 2.0) + (tier === 1 ? 0.7 : 0);
    const dx = Math.sin(a), dz = Math.cos(a), px = dz, pz = -dx, wmax = len * 0.2;
    const rib = (s) => [top[0] + dx * len * s, top[1] + lift * Math.sin(Math.PI * Math.min(1, s * 1.25) * 0.5) - droop * s * s, top[2] + dz * len * s];
    const shade = r.range(0.75, 1.15), cA = mul3(C.palm, shade), cB = mul3(C.palmLt, shade * 0.9);
    let pm = null, pl = null, prr = null;
    for (let i = 0; i <= ns; i++) {
      const s = i / ns, m = rib(s), w = wmax * Math.sin(Math.PI * Math.pow(s, 0.7)) * (i % 2 ? 0.55 : 1) + 0.03, sag = w * 0.45, sway = [5, 0.05, 0, 0.9 * s * s + 0.05];
      const l = [m[0] + px * w, m[1] - sag, m[2] + pz * w], rr = [m[0] - px * w, m[1] - sag, m[2] - pz * w];
      if (pm) { const c = i % 2 ? cA : cB, s0 = [5, 0.05, 0, 0.9 * ((i - 1) / ns) ** 2 + 0.05]; quadS(G, pm, m, l, pl, c, s0, sway); quadS(G, m, pm, prr, rr, c, sway, s0); }
      pm = m; pl = l; prr = rr;
    }
  }
}
// a four-sided face whose first and last corners carry one surf and the middle two another (for sway that grows outward)
function quadS(G, a, b, c, d, color, sa, sb) {
  const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
  let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; const n = [nx / l, ny / l, nz / l];
  const i0 = G.vert(a, n, color, sa), i1 = G.vert(b, n, color, sb), i2 = G.vert(c, n, color, sb), i3 = G.vert(d, n, color, sa);
  G.tri(i0, i1, i2); G.tri(i0, i2, i3);
}

// a wide bowl on a foot, banked with many small flowers that nod in the draught and leaves that trail over its rim
// (no single bloom stands over the rest: C3)
export function urnInto(G, f, far) {
  const r = makeRng(hashSeed('tables-urn:' + f.key)), x = f.x, y = f.y, z = f.z, stone = r.chance(0.5);
  const body = stone ? mul3(C.green, 1.1) : GLAZES[r.int(0, 4)], seg = far ? 6 : 8;
  G.lathe(x, z, [[0.44, y], [0.5, y + 0.12], [0.2, y + 0.42], [0.24, y + 0.78], [0.8, y + 1.06], [0.98, y + 1.3], [0.9, y + 1.36]], { seg, color: body, surf: stone ? S_.stone(0.4) : S_.plain(0.85) });
  const nb = far ? 6 : 10, pal = FLOWERS[f.bloom], pal2 = FLOWERS[(f.bloom + r.int(1, 3)) % 5];
  for (let i = 0; i < nb; i++) {
    const a = i * 2.39996 + r.range(-0.2, 0.2), rad = 0.72 * Math.sqrt((i + 0.5) / nb), by = y + 1.42 + 0.26 * (1 - (rad / 0.72) ** 2) + r.range(-0.04, 0.04);
    G.ball(x + Math.sin(a) * rad, by, z + Math.cos(a) * rad, r.range(0.2, 0.27), { rings: 2, seg: 4, squash: 0.8, color: mul3(i % 3 ? pal : pal2, r.range(0.8, 1.1)), surf: [5, 0.05, 0, 0.1] });
  }
  for (let i = 0; i < (far ? 4 : 6); i++) { const a = (i + 0.5) / (far ? 4 : 6) * Math.PI * 2, c = Math.sin(a), sn = Math.cos(a); quadS(G, [x + c * 0.5, y + 1.4, z + sn * 0.5], [x + c * 1.0 - sn * 0.2, y + 1.42, z + sn * 1.0 + c * 0.2], [x + c * 1.15, y + 0.95, z + sn * 1.15], [x + c * 1.0 + sn * 0.2, y + 1.42, z + sn * 1.0 - c * 0.2], mul3(C.palm, 0.9), [5, 0.05, 0, 0.04], [5, 0.05, 0, 0.16]); }
}

// a lamp standard: a copper post on a stone foot, three globes of pale glass on arms and one at the head
export function standardInto(G, f, tall = 1) {
  const x = f.x, y = f.y, z = f.z, h = 4.3 * tall, t0 = f.turn * DEG;
  G.lathe(x, z, [[0.42 * tall, y], [0.42 * tall, y + 0.25], [0.2 * tall, y + 0.6], [0.09 * tall, y + 0.9], [0.075 * tall, y + h]], { seg: 6, color: (r, yy) => (yy < y + 0.3 ? C.greenDk : C.copper), surf: (r, yy) => (yy < y + 0.3 ? S_.stone(0.3) : S_.metal(0.7)) });
  const lamps = [[x, y + h + 0.3 * tall, z]];
  for (let k = 0; k < 3; k++) { const a = t0 + k * Math.PI * 2 / 3, ax = x + Math.sin(a) * 0.75 * tall, az = z + Math.cos(a) * 0.75 * tall; G.tube([[x, y + h - 0.9 * tall, z], [(x + ax) / 2, y + h - 0.35 * tall, (z + az) / 2], [ax, y + h - 0.5 * tall, az]], 0.04 * tall, { sides: 3, color: C.copper, surf: S_.metal(0.7) }); lamps.push([ax, y + h - 0.22 * tall, az]); }
  for (const q of lamps) G.ball(q[0], q[1], q[2], 0.27 * tall, { rings: 4, seg: 8, color: C.lamp, surf: S_.glow(1.35) });
  return lamps;
}

// a fountain: a shell-shaped basin, a stem, a smaller shell bowl, a nozzle (the water is another mesh: see makeWater)
export function fountainInto(G, f) {
  const x = f.x, y = f.y, z = f.z, t0 = f.turn * DEG, scallop = (a) => 1 + 0.07 * Math.abs(Math.sin((a + t0) * 7));
  G.lathe(x, z, [[2.3, y], [2.95, y + 0.4], [3.0, y + 0.95], [2.78, y + 0.95], [2.55, y + 0.5]], { seg: 28, rmul: scallop, color: mul3(C.green, 1.15), surf: S_.stone(0.5) });
  G.lathe(x, z, [[0.7, y + 0.3], [0.45, y + 0.9], [0.3, y + 1.6], [0.42, y + 2.2]], { seg: 8, color: C.copper, surf: S_.metal(0.7) });
  G.lathe(x, z, [[0.4, y + 2.2], [1.25, y + 2.5], [1.38, y + 2.85], [1.22, y + 2.85], [0.5, y + 2.5]], { seg: 14, rmul: scallop, color: mul3(C.green, 1.15), surf: S_.stone(0.5) });
  G.lathe(x, z, [[0.2, y + 2.5], [0.14, y + 3.2], [0.07, y + 3.5]], { seg: 6, color: C.copper, surf: S_.metal(0.8) });
}

// the ornaments: big, ugly-handsome abstract forms in glazed pottery and stone on a plinth. Six sorts, sized by the thing's draws.
export function ornamentInto(G, f) {
  const r = makeRng(hashSeed('tables-ornament:' + f.key)), x = f.x, y = f.y, z = f.z, h = f.h, w = f.wide, glaze = GLAZES[f.glaze], g2 = GLAZES[(f.glaze + 2) % 5];
  const ph = Math.min(1.1, h * 0.12);
  G.lathe(x, z, [[w * 0.8, y], [w * 0.8, y + ph * 0.7], [w * 0.62, y + ph]], { seg: 10, color: C.greenDk, surf: S_.stone(0.4), flat: true });
  G.lathe(x, z, [[0.001, y + ph], [w * 0.62, y + ph]], { seg: 10, color: C.copper, surf: S_.metal(0.6), flat: true });
  const y0 = y + ph, H = h - ph, sf = S_.plain(0.85);
  if (f.sort === 0) {
    // a knot: one thick rope tied through itself
    const pts = [], R = w * 0.62, n = 56;
    for (let i = 0; i <= n; i++) { const t = i / n * Math.PI * 2, c = 2 + Math.cos(3 * t); pts.push([x + R * 0.36 * c * Math.cos(2 * t), y0 + H * 0.52 + H * 0.3 * Math.sin(3 * t) * 0.9 + H * 0.12 * Math.sin(2 * t), z + R * 0.36 * c * Math.sin(2 * t)]); }
    G.tube(pts, w * 0.17, { sides: 6, color: (t) => mul3(glaze, 0.8 + 0.4 * Math.sin(t * 40) ** 2), surf: sf });
    G.lathe(x, z, [[w * 0.3, y0], [w * 0.16, y0 + H * 0.25]], { seg: 8, color: g2, surf: sf });
  } else if (f.sort === 1) {
    // hoops: three open rings of unequal size about one middle, each leaning its own way, on a short stem
    const cy = y0 + H * 0.56, t1 = r.range(0, 6.28);
    G.lathe(x, z, [[w * 0.2, y0], [w * 0.1, cy - w * 0.86]], { seg: 6, color: g2, surf: sf });
    [[0.86, 0.25, 0], [0.68, 1.1, 2.1], [0.5, 1.45, 4.2]].forEach(([k, lean, az], j) => {
      const pts = [], n = 22, cl = Math.cos(lean), sl = Math.sin(lean), ca = Math.cos(t1 + az), sa = Math.sin(t1 + az);
      for (let i = 0; i <= n; i++) { const t = i / n * Math.PI * 2, u = Math.cos(t) * w * k, v = Math.sin(t) * w * k; pts.push([x + u * ca + v * sl * sa, cy + v * cl, z - u * sa + v * sl * ca]); }
      G.tube(pts, w * (0.1 - 0.02 * j), { sides: 5, color: j === 1 ? g2 : glaze, surf: sf });
    });
  } else if (f.sort === 2) {
    // blocks: two cubes run through each other. The greater stands on one corner; the lesser grows out of its flank at half
    // its height, tipped its own way. Nothing is set on top of anything (no pile, no stack, no small block over a greater).
    const e1 = Math.min(w * 0.87, H / 1.75), e2 = e1 * 0.78;
    const cube = (cx, cy, cz, e, yaw, pitch, roll, color, down) => {
      const ca = Math.cos(yaw), sa = Math.sin(yaw), cb = Math.cos(pitch), sb = Math.sin(pitch), cc = Math.cos(roll), sc = Math.sin(roll), hf = e / 2;
      // rolled about its own z, pitched about its x, then turned about the upright axis
      const P = (px, py, pz) => { const x1 = px * cc - py * sc, y1 = px * sc + py * cc, y2 = y1 * cb - pz * sb, z2 = y1 * sb + pz * cb; return [x1 * ca + z2 * sa, y2, -x1 * sa + z2 * ca]; };
      const v = [P(-hf, -hf, -hf), P(hf, -hf, -hf), P(hf, hf, -hf), P(-hf, hf, -hf), P(-hf, -hf, hf), P(hf, -hf, hf), P(hf, hf, hf), P(-hf, hf, hf)];
      // down: set on its lowest corner at cy; else cy is its middle
      const lift = down ? -Math.min(...v.map((q) => q[1])) : 0;
      for (const q of v) { q[0] += cx; q[1] += cy + lift; q[2] += cz; }
      for (const fc of [[1, 0, 3, 2], [4, 5, 6, 7], [0, 4, 7, 3], [5, 1, 2, 6], [3, 7, 6, 2], [0, 1, 5, 4]]) G.quad(v[fc[0]], v[fc[1]], v[fc[2]], v[fc[3]], color, sf);
    };
    const t1 = r.range(0, 1.57), t2 = r.range(0, 1.57), t3 = r.range(0, 1.57), t4 = r.range(0, 1.57) * 4;
    cube(x, y0, z, e1, t1, -0.6155, 0.7854, glaze, true);
    cube(x + Math.sin(t4) * e1 * 0.46, y0 + e1 * 0.966, z + Math.cos(t4) * e1 * 0.46, e2, t2, 0.25 + 0.2 * t3, 0.62 - 0.17 * t3, g2, false);
  } else if (f.sort === 3) {
    // a shell: a horn that winds outward and widens, standing on edge
    const pts = [], n = 44, a0 = r.range(0, 6.28), ca = Math.cos(a0), sa = Math.sin(a0);
    for (let i = 0; i <= n; i++) { const t = i / n, a = t * 2.4 * Math.PI * 2, rr = w * 0.065 * Math.exp(t * 2.45), u = rr * Math.cos(a); pts.push([x + u * ca, y0 + w * 1.0 + rr * Math.sin(a) * 0.95, z + u * sa]); }
    G.tube(pts, (t) => w * 0.018 * Math.exp(t * 2.45) + 0.03, { sides: 7, color: (t) => mul3(t > 0.93 ? g2 : glaze, 0.8 + 0.3 * Math.sin(t * 60) ** 2), surf: sf });
  } else if (f.sort === 4) {
    // a fruit: a ribbed gourd on a cup, a stalk
    G.lathe(x, z, [[w * 0.35, y0], [w * 0.5, y0 + H * 0.12]], { seg: 10, color: g2, surf: sf });
    const prof = []; for (let j = 0; j <= 8; j++) { const a = -1.2 + 2.6 * j / 8; prof.push([Math.max(0.02, w * 0.9 * Math.cos(a) * (1 - 0.18 * j / 8)), y0 + H * 0.1 + H * 0.78 * j / 8]); }
    G.lathe(x, z, prof, { seg: 16, rmul: (a) => 1 + 0.09 * Math.cos(a * 8), color: (rr, yy) => mul3(glaze, 0.8 + 0.5 * (yy - y0) / H), surf: sf });
    G.tube([[x, y0 + H * 0.86, z], [x + w * 0.1, y + h - 0.2, z], [x + w * 0.32, y + h, z + w * 0.1]], w * 0.07, { sides: 5, color: C.trunk, surf: S_.plain(0.3) });
  } else {
    // cones: a stack of cups, point down, a ball between each (none in the topmost cup: it stands open)
    let yy = y0; const n = r.int(3, 4), each = H / n;
    for (let i = 0; i < n; i++) { const rw = w * (1 - 0.14 * i); G.lathe(x, z, [[rw * 0.12, yy], [rw * 0.95, yy + each * 0.78], [rw * 0.7, yy + each * 0.78]], { seg: 10, color: i % 2 ? g2 : glaze, surf: sf, flat: true }); if (i < n - 1) G.ball(x, yy + each * 0.86, z, rw * 0.2, { rings: 3, seg: 6, color: C.brass, surf: S_.metal(0.8) }); yy += each; }
  }
}

// THE GREAT FOUNTAIN (the crew's own; abstract: basins, a stem, water, lights): THREE copper basins of unequal reach, set
// unequally up a long fluted stem of green stone in a broad pool: a broad low bowl; a small one high over it on a long
// bare run of the stem; a broad one again above that; over it the bare stem to a copper nozzle and ONE tall plume (to
// 38.5 m; the dome's crown is at 80 m). No bowl at the head. Its outline is no cone: broad, narrow, broad, a spire.
// rims: [radius, height of the rim, the scallops of its lip (the water falls from the low place between two of them),
// the half share of a scallop's width that a falling sheet takes at the lip] from the lowest up.
export const FOUNT = { rims: [[9.6, 5.8, 13, 0.075], [3.2, 17.5, 5, 0.06], [6.8, 27.0, 7, 0.07]], nozzle: 34.2, plume: 38.5, pool: 0.38 };
// the stem: a slender shaft that narrows evenly, spreading to a foot only in the pool (no cone)
const stemR = (y) => lerp(2.15, 0.5, clamp(y / 34, 0, 1)) + 1.2 * Math.exp(-Math.max(0, y) / 1.8);
// where the water of basin k comes down: on the water of the highest basin under it that reaches out beyond the fall, else
// in the pool. y1: the height it ends at; spread: how far it is thrown outward on the way
export const fountFall = (k) => {
  const [R, yr] = FOUNT.rims[k];
  for (let j = k - 1; j >= 0; j--) { const [Rj, yj] = FOUNT.rims[j], spread = Math.min(0.9, 0.2 + 0.05 * (yr - yj)); if (Rj * 0.95 > R + spread + 0.4) return { y1: yj - 0.12, spread }; }
  return { y1: FOUNT.pool, spread: Math.min(0.9, 0.2 + 0.05 * (yr - FOUNT.pool)) };
};
export function greatFountainInto(G) {
  const RP = DIM.RPOOL, flute = (a) => 1 + 0.05 * Math.cos(a * 12);
  // the pool: its floor, the coping (green stone, a copper lip)
  G.lathe(0, 0, [[0.001, -0.5], [RP, -0.5]], { seg: 40, color: mul3(C.greenDk, 0.8), surf: S_.stone(0.3), flat: true });
  G.lathe(0, 0, [[RP, -0.5], [RP, 0.5], [RP + 0.18, 0.56], [RP + 0.72, 0.56], [RP + 0.8, 0.45], [RP + 0.8, 0]], { seg: 56, color: (r, y) => (y > 0.52 ? C.copper : C.green), surf: (r, y) => (y > 0.52 ? S_.metal(0.7) : S_.stone(0.4)), flat: true });
  // the stem, fluted, to the nozzle's foot, with a copper collar under each basin
  const yS = FOUNT.nozzle - 0.8, prof = []; for (let j = 0; j <= 14; j++) { const y = -0.5 + (yS + 0.5) * j / 14; prof.push([stemR(Math.max(0, y)), y]); }
  G.lathe(0, 0, prof, { seg: 24, rmul: flute, color: (r, y) => mul3(C.green, 1.25 + 0.3 * Math.sin(y * 1.7)), surf: S_.stone(0.5) });
  // two copper bands on the long bare runs of the stem
  for (const yb of [11.4, 22.6]) { const rb = stemR(yb) * 1.1; G.lathe(0, 0, [[rb, yb - 0.35], [rb * 1.06, yb], [rb, yb + 0.35]], { seg: 16, color: C.copper, surf: S_.metal(0.75) }); }
  FOUNT.rims.forEach(([R, yr, n]) => {
    const d = 0.22 * R + 0.6, rs = stemR(yr - d) * 1.04, seg = Math.round(clamp(R * 6.5, 20, 60));
    const lobes = (a) => 1 + 0.03 * Math.cos(a * n);
    // the bowl from under (copper), its rolled lip, its inner face down to the water
    G.lathe(0, 0, [[rs, yr - d], [0.5 * R, yr - 0.8 * d], [0.86 * R, yr - 0.34 * d], [R, yr - 0.03], [R + 0.1, yr + 0.05], [R, yr + 0.1]], { seg, rmul: lobes, color: (r, y) => mul3(C.copper, 1.25 + 0.5 * (r / R)), surf: S_.metal(0.75) });
    G.lathe(0, 0, [[R, yr + 0.1], [0.88 * R, yr - 0.3 * d]], { seg, rmul: lobes, color: mul3(C.copper, 1.2), surf: S_.metal(0.6) });
    G.lathe(0, 0, [[rs * 1.25, yr - d - 0.5], [rs * 1.25, yr - d], [rs * 1.02, yr - d + 0.12]], { seg: 16, color: C.brass, surf: S_.metal(0.8), flat: true });
  });
  // the head: no bowl: a copper collar on the stem's end and a plain nozzle of brass (the plume is the water's)
  const rn = stemR(yS);
  G.lathe(0, 0, [[rn * 1.5, yS - 0.6], [rn * 1.5, yS], [rn * 0.7, yS + 0.3]], { seg: 10, color: C.copper, surf: S_.metal(0.8), flat: true });
  G.lathe(0, 0, [[rn * 0.7, yS + 0.3], [0.3, yS + 0.55], [0.22, FOUNT.nozzle]], { seg: 8, color: C.brass, surf: S_.metal(0.85) });
}
// the places of the fountain's candle cups: on the pool's coping, and on the broad low rim ONLY (three on the crest of each
// scallop: the water falls from the low places between); none higher, none at the head; [x, y, z, colour, phase]
// (amber leads: four of five; the fifth is jade, rose or blue by turns)
export function fountainCups() {
  const out = [], put = (R, y, a, i, k) => out.push([R * Math.sin(a), y, R * Math.cos(a), i % 5 === 2 ? 1 + (k + Math.floor(i / 5)) % 3 : 0, (i * 7.3 + k * 3.1) % 40]);
  const nc = Math.round(2 * Math.PI * (DIM.RPOOL + 0.45) / 1.25);
  for (let i = 0; i < nc; i++) put(DIM.RPOOL + 0.45, 0.56, i / nc * Math.PI * 2, i, 0);
  const [R, yr, n] = FOUNT.rims[0];
  for (let c = 0; c < n; c++) for (let j = 0; j < 3; j++) { const a = (c + (j - 1) * 0.22) / n * Math.PI * 2; put(R * (1 + 0.03 * Math.cos(a * n)) - 0.02, yr + 0.08, a, c * 3 + j, 1); }
  return out;
}

// THE BANDSTAND AT REST: a ring dais round the fountain's pool (R 13.6 to 21.2, a metre up, two steps down to the pit),
// a ring of 28 lamps on its outer edge that light the dais by place (a warm pool; the brass catches it); four arcs of chairs (dining size, a lighter wood) with bare music stands,
// facing outward, and between them the instruments, EVERY ONE ON A STAND OF ITS OWN ON THE FLOOR: a harp, a great bass
// upright in its frame, a great horn in a ring stand, kettledrums, a great drum in a cradle, a small drum on a tripod,
// horns bell down on pegs. Nobody; nothing swinging; nothing lettered; no lectern, podium, speaker or sheet. (Round t1: at
// the dais's front, before the middle of the first arc, the host's place: a pool of light on the dais's floor. Round t2:
// the pool is empty; the microphone stand of round t1 is taken out.)
// A BAY OF THE BAND SHELL: a low gilt wall on a foot of green stone at the dais's back (its inner edge, toward the pool),
// fluted, with brass ribs, curving forward overhead into a shallow hood with a brass rim; a pier of green stone at each
// end; a gilt apron on the dais before it. Open toward the pit. ac: the bay's middle bearing (radians); it spans 44 degrees.
export const SHELL = { R: 14.3, half: 22 * DEG, wall: 2.5, top: 3.85, lip: 15.35, apron: 17.0 };
export function shellBayInto(G, ac, Y) {
  const a0 = ac - SHELL.half, a1 = ac + SHELL.half, RW = SHELL.R, gilt = mul3(C.gold, 0.8), flute = (a) => 1 + 0.005 * Math.cos((a - ac) * 65.45);
  const prof = [[RW, Y + 0.35], [RW, Y + SHELL.wall], [RW + 0.12, Y + 3.1], [RW + 0.45, Y + 3.55], [SHELL.lip, Y + SHELL.top]];
  G.lathe(0, 0, [[RW + 0.06, Y], [RW + 0.06, Y + 0.35]], { seg: 12, a0, a1, color: C.greenDk, surf: S_.stone(0.35), flat: true });
  G.lathe(0, 0, prof, { seg: 32, a0, a1, rmul: flute, color: (r, y) => mul3(gilt, 0.8 + 0.3 * clamp((y - Y) / SHELL.top, 0, 1)), surf: S_.metal(0.6) });
  // ribs up the wall and over the hood, the hood's rim, the apron on the floor
  for (let k = 0; k <= 4; k++) { const a = lerp(a0, a1, k / 4), sn = Math.sin(a), cs = Math.cos(a); G.tube(prof.map((q) => [(q[0] + 0.09) * sn, q[1], (q[0] + 0.09) * cs]), 0.065, { sides: 4, color: C.brass, surf: S_.metal(0.8) }); }
  const rim = []; for (let i = 0; i <= 12; i++) { const a = lerp(a0, a1, i / 12); rim.push([SHELL.lip * Math.sin(a), Y + SHELL.top, SHELL.lip * Math.cos(a)]); }
  G.tube(rim, 0.08, { sides: 4, color: C.brass, surf: S_.metal(0.85) });
  G.lathe(0, 0, [[RW + 0.06, Y + 0.015], [SHELL.apron, Y + 0.015]], { seg: 12, a0, a1, color: mul3(C.gold, 0.8), surf: S_.plain(0.35), flat: true });
  for (const a of [a0, a1]) { const sn = Math.sin(a), cs = Math.cos(a); G.box((RW + 0.4) * sn, Y + 1.5, (RW + 0.4) * cs, 0.5, 3.0, 1.0, a, C.green, S_.stone(0.4)); G.box((RW + 0.4) * sn, Y + 3.08, (RW + 0.4) * cs, 0.62, 0.16, 1.12, a, C.copper, S_.metal(0.7)); }
}

export async function bandstandInto(G, seed, brk = async () => {}) {
  const r = makeRng(hashSeed('tables-bandstand:' + seed)), Y = DIM.YDAIS, R0 = DIM.RDAIS0, R1 = DIM.RDAIS1, lamps = [], strings = [];
  const M4 = () => new THREE.Matrix4(), brass = C.brass, dark = [0.03, 0.028, 0.026], head = mul3(C.ivory, 0.95), light = hexLin('#a8824e');
  G.lathe(0, 0, [[R0, 0], [R0, Y - 0.12], [R0 - 0.06, Y - 0.12], [R0 - 0.06, Y]], { seg: 56, color: (rr, y) => (y > Y - 0.2 ? C.copper : C.green), surf: S_.stone(0.4), flat: true });
  G.lathe(0, 0, [[R0 - 0.06, Y], [16.2, Y], [18.8, Y], [R1, Y]], { seg: 64, color: C.white, surf: S_.floor, flat: true });
  G.lathe(0, 0, [[R1, Y], [R1, Y - 0.12], [R1, 0.5], [R1 + 0.7, 0.5], [R1 + 0.7, 0]], { seg: 64, color: (rr, y) => (y > Y - 0.2 ? C.copper : mul3(C.green, 0.95)), surf: S_.stone(0.35), flat: true });
  for (let i = 0; i < 28; i++) {
    const a = (i + 0.5) / 28 * Math.PI * 2, x = Math.sin(a) * (R1 - 0.3), z = Math.cos(a) * (R1 - 0.3);
    G.lathe(x, z, [[0.16, Y], [0.05, Y + 0.3], [0.04, Y + 2.2]], { seg: 5, color: C.copper, surf: S_.metal(0.7) });
    G.ball(x, Y + 2.4, z, 0.26, { rings: 3, seg: 6, color: C.lamp, surf: S_.glow(2.2) });
    lamps.push([x, Y + 2.4, z]);
  }
  // a thing made about its own foot, set on the dais at bearing th (radians), R from the middle, turned by tw more
  const set = (B, th, R, tw = 0, sc = 1) => G.addMat(B, M4().makeTranslation(Math.sin(th) * R, Y, Math.cos(th) * R).multiply(M4().makeRotationY(th + tw)).multiply(M4().makeScale(sc, sc, sc)));
  const tripod = (B, h, rad = 0.3, col = dark) => { for (let k = 0; k < 3; k++) { const a = k * 2.094 + 0.5; B.tube([[0, h * 0.42, 0], [Math.sin(a) * rad, 0.02, Math.cos(a) * rad]], 0.014, { sides: 3, color: col, surf: S_.metal(0.5) }); } B.tube([[0, h * 0.36, 0], [0, h, 0]], 0.016, { sides: 3, color: col, surf: S_.metal(0.5) }); };
  const chair = chairGeometry(0, light), b0 = r.range(0, 0.35);
  for (let g = 0; g < 4; g++) {
    await brk();
    const mid = b0 + g * Math.PI / 2, n = g % 2 ? 4 : 5;
    for (let i = 0; i < n; i++) {
      const th = mid + (i - (n - 1) / 2) * 0.078 + r.range(-0.006, 0.006);
      set(chair, th, 16.3, r.range(-0.2, 0.2));
      // a bare music stand before each chair: three feet, a post, an empty desk tilted back
      const st = makeBuilder(); tripod(st, 1.12);
      const desk = makeBuilder(); desk.box(0, 0, 0, 0.5, 0.34, 0.012, 0, dark, S_.metal(0.5)); desk.box(0, -0.17, -0.025, 0.5, 0.012, 0.05, 0, dark, S_.metal(0.5));
      st.addMat(desk, M4().makeTranslation(0, 1.26, 0).multiply(M4().makeRotationX(0.35)));
      set(st, th, 17.5, r.range(-0.15, 0.15));
    }
  }
  const at = (k) => b0 + Math.PI / 4 + k * Math.PI / 2;
  await brk();
  // the band shell: four bays at the dais's back, one behind each group of instruments (between the arcs of chairs)
  for (let k = 0; k < 4; k++) shellBayInto(G, at(k), Y);
  await brk();
  // the harp: a gilt frame (pillar, curved neck, sloping sound box) on its own foot; its strings tremble in the draught
  const hb = makeBuilder(), HP = (u, v) => [u, v, 0];
  hb.tube([HP(0.95, 0.05), HP(0.95, 2.35)], 0.07, { sides: 6, color: brass, surf: S_.metal(0.85) });
  const neck = []; for (let i = 0; i <= 8; i++) { const t = i / 8; neck.push(HP(0.95 - t * 1.25, 2.35 - 0.55 * t + 0.22 * Math.sin(t * Math.PI * 1.6))); }
  hb.tube(neck, 0.06, { sides: 5, color: brass, surf: S_.metal(0.85) });
  hb.tube([HP(-0.3, 1.8), HP(0.8, 0.12)], (t) => lerp(0.07, 0.17, t), { sides: 5, color: mul3(C.wood, 1.6), surf: S_.plain(0.6) });
  hb.box(0.5, 0.05, 0, 1.3, 0.1, 0.5, 0, brass, S_.metal(0.8));
  const hth = at(0), hm = M4().makeTranslation(Math.sin(hth) * 15.9, Y, Math.cos(hth) * 15.9).multiply(M4().makeRotationY(hth + 0.2)).multiply(M4().makeScale(1.2, 1.2, 1.2));
  G.addMat(hb, hm);
  for (let i = 0; i < 13; i++) { const t = (i + 0.5) / 13, pa = new THREE.Vector3(...HP(0.82 - t * 1.05, 2.28 - 0.5 * t + 0.2 * Math.sin(t * Math.PI * 1.6))).applyMatrix4(hm), pb = new THREE.Vector3(...HP(0.72 - t * 0.98, 0.22 + 1.5 * t)).applyMatrix4(hm); strings.push([pa.toArray(), pb.toArray()]); }
  await brk();
  return bandstandB(G, { r, Y, set, tripod, at, lamps, strings, brass, dark, head, M4, brk });
}

// the bass in its frame, the great horn in its ring stand, the drums, the horns on their pegs
async function bandstandB(G, c) {
  const { r, set, tripod, at, lamps, strings, brass, dark, head, M4, brk } = c;   // (c.Y: the dais's floor)
  // the great bass: a waisted body, a neck, a scroll, a spike; upright in a frame of its own (a foot, a post, a yoke at the neck)
  const bass = makeBuilder(), bp = [];
  for (let j = 0; j <= 10; j++) { const t = j / 10, w = 0.34 + 0.1 * Math.cos(t * Math.PI * 2) - 0.07 * Math.exp(-(((t - 0.52) / 0.12) ** 2)) - 0.1 * t; bp.push([Math.max(0.03, w * Math.sin(Math.PI * Math.pow(t, 0.8)) ** 0.5 + 0.02), 0.15 + t * 1.15]); }
  bass.lathe(0, 0, bp, { seg: 10, color: mul3(C.wood, 2.2), surf: S_.plain(0.75) });
  for (let i = 0; i < bass.pos.length; i += 3) bass.pos[i + 2] *= 0.36;
  bass.tube([[0, 1.25, 0.05], [0, 1.95, 0.08], [0, 2.02, 0.02]], 0.035, { sides: 4, color: dark, surf: S_.plain(0.5) });
  bass.ball(0, 2.05, 0, 0.07, { rings: 3, seg: 5, color: mul3(C.wood, 2.2), surf: S_.plain(0.7) });
  bass.tube([[0, 0.16, 0], [0, 0, 0]], 0.012, { sides: 3, color: brass, surf: S_.metal(0.8) });
  // a tailpiece and a bridge on its belly (the four strings run from the nut under the scroll over the bridge to the tailpiece)
  bass.box(0, 0.4, 0.135, 0.07, 0.26, 0.02, 0, dark, S_.plain(0.5));
  bass.box(0, 0.64, 0.115, 0.15, 0.012, 0.09, 0, mul3(C.wood, 3.0), S_.plain(0.5));
  const frame = makeBuilder(), inFrame = M4().makeTranslation(0, 0.06, 0.05).multiply(M4().makeRotationX(-0.1));
  frame.addMat(bass, inFrame);
  frame.box(0, 0.03, -0.1, 0.7, 0.06, 0.8, 0, mul3(C.wood, 1.4), S_.plain(0.4));
  frame.tube([[0, 0.06, -0.42], [0, 1.72, -0.3]], 0.03, { sides: 4, color: dark, surf: S_.metal(0.5) });
  for (const sx of [-1, 1]) frame.tube([[0, 1.7, -0.3], [sx * 0.09, 1.72, -0.16], [sx * 0.09, 1.72, -0.02]], 0.018, { sides: 3, color: dark, surf: S_.metal(0.5) });
  // (it stands close before its bay of the shell, its front to the room)
  const bth = at(1) - 0.1, bM = M4().makeTranslation(Math.sin(bth) * 15.8, c.Y, Math.cos(bth) * 15.8).multiply(M4().makeRotationY(bth + r.range(-0.3, 0.3))).multiply(M4().makeScale(1.2, 1.2, 1.2));
  G.addMat(frame, bM);
  // THE BASS'S FOUR STRINGS, by the harp's own law (each trembles in the draught): nut to bridge, bridge to tailpiece
  const bS = bM.clone().multiply(inFrame), sp = (x, y, z) => new THREE.Vector3(x, y, z).applyMatrix4(bS).toArray();
  for (let i = 0; i < 4; i++) { const k = i - 1.5; strings.push([sp(k * 0.016, 1.93, 0.12), sp(k * 0.036, 0.646, 0.165)], [sp(k * 0.036, 0.646, 0.165), sp(k * 0.017, 0.5, 0.15)]); }
  await brk();
  // a great horn, bell upward, its coils held in a ring stand on three feet
  const horn = makeBuilder(), pts = [];
  for (let i = 0; i <= 22; i++) { const t = i / 22, a = t * Math.PI * 3.1; pts.push([Math.cos(a) * 0.27 * (1 - 0.25 * t), 0.62 + Math.sin(a) * 0.3 + t * 0.35, (t - 0.5) * 0.2]); }
  horn.tube(pts, (t) => lerp(0.035, 0.085, t), { sides: 5, color: brass, surf: S_.metal(0.9) });
  const e = pts[22];
  horn.lathe(e[0], e[2], [[0.085, e[1]], [0.12, e[1] + 0.25], [0.24, e[1] + 0.5], [0.43, e[1] + 0.62]], { seg: 10, color: brass, surf: S_.metal(0.9) });
  tripod(horn, 0.5, 0.36); horn.lathe(0, 0, [[0.2, 0.3], [0.24, 0.34], [0.2, 0.38]], { seg: 8, color: dark, surf: S_.metal(0.5), flat: true });
  set(horn, at(1) + 0.12, 18.2, 0.7, 1.4);
  await brk();
  // two kettledrums of copper on three legs each, a great drum on its edge in a cradle (both heads blank), a small drum on a tripod
  const dr = makeBuilder();
  for (const [x, z, sc] of [[-0.9, 0.2, 1], [0.5, 0.5, 0.86]]) {
    dr.lathe(x, z, [[0.06 * sc, 0.42], [0.4 * sc, 0.6], [0.47 * sc, 0.92], [0.47 * sc, 0.98]], { seg: 10, color: C.copper, surf: S_.metal(0.85) });
    dr.lathe(x, z, [[0.001, 0.975], [0.455 * sc, 0.975]], { seg: 10, color: head, surf: S_.plain(0.25), flat: true });
    dr.lathe(x, z, [[0.47 * sc, 0.93], [0.49 * sc, 0.99]], { seg: 10, color: brass, surf: S_.metal(0.85), flat: true });
    for (let k = 0; k < 3; k++) { const a = k * 2.094 + 0.4; dr.tube([[x + Math.sin(a) * 0.3 * sc, 0.6, z + Math.cos(a) * 0.3 * sc], [x + Math.sin(a) * 0.5 * sc, 0, z + Math.cos(a) * 0.5 * sc]], 0.02, { sides: 3, color: brass, surf: S_.metal(0.8) }); }
  }
  const drum = makeBuilder();
  drum.lathe(0, 0, [[0.56, -0.22], [0.56, 0.22]], { seg: 14, color: C.green, surf: S_.plain(0.6), flat: true });
  for (const sy of [-1, 1]) { drum.lathe(0, 0, [[0.001, sy * 0.22], [0.55, sy * 0.22]], { seg: 14, color: head, surf: S_.plain(0.25), flat: true }); drum.lathe(0, 0, [[0.56, sy * 0.2], [0.59, sy * 0.24]], { seg: 14, color: brass, surf: S_.metal(0.85), flat: true }); }
  dr.addMat(drum, M4().makeTranslation(2.0, 0.72, -0.1).multiply(M4().makeRotationY(0.5)).multiply(M4().makeRotationX(Math.PI / 2)));
  dr.box(2.0, 0.08, -0.1, 0.9, 0.16, 0.5, 0.5, mul3(C.wood, 1.4), S_.plain(0.4));
  const sdm = makeBuilder(); tripod(sdm, 0.8, 0.36); sdm.lathe(0, 0, [[0.001, 0.8], [0.22, 0.8]], { seg: 9, color: brass, surf: S_.metal(0.6), flat: true }); sdm.lathe(0, 0, [[0.03, 0.74], [0.07, 0.8]], { seg: 5, color: dark, surf: S_.metal(0.5), flat: true }); sdm.lathe(0, 0, [[0.22, 0.8], [0.22, 0.95]], { seg: 9, color: brass, surf: S_.metal(0.85), flat: true }); sdm.lathe(0, 0, [[0.001, 0.95], [0.215, 0.95]], { seg: 9, color: head, surf: S_.plain(0.25), flat: true });
  dr.add(sdm, -2.2, 0, -0.3);
  set(dr, at(2), 17.4, 0, 1.15);
  // A GONG of bronze hanging still in its frame (two posts on feet, a top bar, two short cords), behind the drums, close
  // before its bay of the shell
  const gong = makeBuilder(), disc = makeBuilder();
  for (const sx of [-1, 1]) { gong.tube([[sx * 0.95, 0, 0], [sx * 0.95, 2.3, 0]], 0.05, { sides: 5, color: dark, surf: S_.metal(0.5) }); gong.box(sx * 0.95, 0.04, 0, 0.14, 0.08, 0.8, 0, dark, S_.metal(0.5)); gong.tube([[sx * 0.42, 2.3, 0], [sx * 0.42, 1.86, 0]], 0.012, { sides: 3, color: dark, surf: S_.metal(0.5) }); }
  gong.tube([[-1.05, 2.3, 0], [1.05, 2.3, 0]], 0.05, { sides: 5, color: dark, surf: S_.metal(0.5) });
  disc.lathe(0, 0, [[0.001, 0.05], [0.16, 0.05], [0.2, 0], [0.66, 0], [0.72, -0.06]], { seg: 16, color: (rr) => mul3(brass, rr < 0.2 ? 1.2 : 0.8 + 0.25 * Math.sin(rr * 30) ** 2), surf: S_.metal(0.8) });
  gong.addMat(disc, M4().makeTranslation(0, 1.28, 0).multiply(M4().makeRotationX(Math.PI / 2)));
  set(gong, at(2), 15.5, 0, 1.15);
  await brk();
  // three horns standing bell down, each on a peg stand of its own
  for (let k = 0; k < 3; k++) {
    const B = makeBuilder(), len = k === 2 ? 1.05 : 0.62;
    tripod(B, 0.5, 0.26);
    const t = makeBuilder();
    t.tube([[0, 0, -len / 2], [0, 0, len / 2 - 0.12]], 0.022, { sides: 4, color: brass, surf: S_.metal(0.9) });
    t.tube([[0.05, 0, -len / 2 + 0.05], [0.05, 0, len * 0.1], [0, 0, len * 0.16]], 0.02, { sides: 4, color: brass, surf: S_.metal(0.9) });
    const bell = makeBuilder(); bell.lathe(0, 0, [[0.022, 0], [0.04, 0.08], [0.1, 0.14]], { seg: 7, color: brass, surf: S_.metal(0.9) });
    t.addMat(bell, M4().makeTranslation(0, 0, len / 2 - 0.14).multiply(M4().makeRotationX(Math.PI / 2)));
    B.addMat(t, M4().makeTranslation(0, 0.3 + len / 2, 0).multiply(M4().makeRotationX(Math.PI / 2)));
    set(B, at(3) + (k - 1) * 0.07, 17.2 + (k % 2) * 0.9, r.range(0, 3), 1.3);
  }
  return { lamps, strings, r };
}

// the aisles: eight runners of carpet from the dais's steps up over every riser to the wall under the gallery, short brass
// handrails either side of the steps (left out where they would stand within 2.7 m of the flown line)
export async function buildAisles(plan, G, brk = async () => {}) {
  const F = plan.F, m = plan.mir, HW = 1.15, lane = plan.lane;
  for (const a of plan.aisles) {
    const sn = m * Math.sin(a * DEG), cs = Math.cos(a * DEG), px = cs, pz = -sn;
    const at = (R, y, w) => [R * sn + px * w, y, R * cs + pz * w];
    const strip = (r0, y0, r1, y1) => G.quad(at(r0, y0, -HW), at(r0, y0, HW), at(r1, y1, HW), at(r1, y1, -HW), C.carpet, S_.carpet);
    strip(DIM.RDAIS1 + 0.75, 0.025, DIM.RPIT - 0.02, 0.025);
    for (let k = 1; k <= F.NT; k++) {
      const r0 = RISERS[k - 1], y0 = k - 1;
      for (let i = 0; i < 3; i++) { strip(r0 + i * GO - 0.02, y0 + i / 3, r0 + i * GO - 0.02, y0 + (i + 1) / 3 + 0.025); if (i < 2) strip(r0 + i * GO - 0.02, y0 + (i + 1) / 3 + 0.025, r0 + (i + 1) * GO - 0.02, y0 + (i + 1) / 3 + 0.025); }
      strip(r0 + 2 * GO - 0.02, k + 0.025, k < F.NT ? RISERS[k] - 0.02 : DIM.RD - 1.2, k + 0.025);
      for (const sd of [-1, 1]) {
        const w = sd * (HW + 0.3), a0 = at(r0 - 0.25, y0, w), a1 = at(r0 + 2 * GO + 0.25, k, w);
        if (lane.toCylinder((a0[0] + a1[0]) / 2, (a0[2] + a1[2]) / 2, 0.75, y0, k + 1.0) < 2.7) continue;
        G.tube([[a0[0], a0[1] + 0.9, a0[2]], [a1[0], a1[1] + 0.9, a1[2]]], 0.045, { sides: 4, color: C.brass, surf: S_.metal(0.85) });
        for (const q of [a0, a1]) G.box(q[0], q[1] + 0.45, q[2], 0.08, 0.9, 0.08, a * DEG, C.brass, S_.metal(0.8));
      }
    }
    await brk();
  }
}

// ================================================================ THE PLAIN: cracked crust and slag to a true horizon
// its height by place (metres): level at the porch's foot, low swells further out, long ridges far off (never over the line)
export function plainY(x, z) {
  const R = Math.hypot(x, z), a = smoothstep(150, 420, R), far = smoothstep(700, 2200, R);
  const sw = Math.sin(x * 0.011 + 1.3) * Math.cos(z * 0.013 - 0.4) + 0.5 * Math.sin((x + z) * 0.027 + 2.0) + 0.3 * Math.sin(x * 0.06 - z * 0.05);
  const ridge = Math.abs(Math.sin(x * 0.0016 + 0.7) * Math.cos(z * 0.0019 + 1.9));
  // under the mosaic of slabs (before the dome, to 345 m) the base lies 1.9 m under the slabs' level: the fissures' floor
  const under = (1 - smoothstep(300, 345, R)) * smoothstep(20, 50, z);
  return groundTop(x, z) - 1.9 * under + a * (0.9 * sw - 0.4) * (1 - 0.6 * under) + far * (26 * ridge - 2);
}
export async function buildPlain(plan, G, brk = async () => {}) {
  const radii = [DIM.RD + 1.4, 124, 140, 160, 185, 215, 255, 305, 370, 450, 560, 700, 900, 1200, 1650, 2300, 3300], seg = 72;
  for (let j = 0; j < radii.length - 1; j++) {
    const base = G.pos.length / 3;
    for (let i = 0; i <= seg; i++) for (const R of [radii[j], radii[j + 1]]) {
      const a = i / seg * Math.PI * 2, x = R * Math.sin(a), z = R * Math.cos(a), y = plainY(x, z), e = 2;
      // the normal from the height's own slope; under the mosaic of slabs the base is the fissures' dark floor
      const nx = plainY(x - e, z) - plainY(x + e, z), nz = plainY(x, z - e) - plainY(x, z + e), l = Math.hypot(nx, 2 * e, nz);
      const tone = 0.8 + 0.4 * Math.sin(x * 0.021 + z * 0.017) * Math.sin(z * 0.009 - 1.0), under = (1 - smoothstep(300, 345, R)) * smoothstep(20, 50, z);
      G.vert([x, y, z], [nx / l, 2 * e / l, nz / l], mul3(C.slag, tone * 1.5 * (1 - 0.72 * under)), S_.slag);
    }
    for (let i = 0; i < seg; i++) { const q = base + i * 2; G.tri(q, q + 2, q + 1); G.tri(q + 1, q + 2, q + 3); }
    if (j % 3 === 2) await brk();
  }
  await brk();
  // THE SLABS: each a tilted plate; its top by its own plane, its broken sides running down dark into the fissures
  let ns = 0;
  for (const sl of plan.ground.slabs) {
    const n = sl.poly.length, nl = Math.hypot(sl.tx, 1, sl.tz), nrm = [-sl.tx / nl, 1 / nl, -sl.tz / nl], tone = 1.7 + 0.9 * Math.abs(Math.sin(sl.cx * 0.37 + sl.cz * 0.23));
    const top = sl.poly.map((q) => [q[0], sl.yc + sl.tx * (q[0] - sl.cx) + sl.tz * (q[1] - sl.cz), q[1]]);
    const id = top.map((q) => G.vert(q, nrm, mul3(C.slag, tone), S_.slag));
    for (let i = 1; i < n - 1; i++) G.tri(id[0], id[i + 1], id[i]);
    for (let i = 0; i < n; i++) {
      const A = top[i], B = top[(i + 1) % n], ex = B[0] - A[0], ez = B[2] - A[2], el = Math.hypot(ex, ez) || 1, sn = [ez / el, 0.15, -ex / el];
      // (the outward side of this edge: away from the slab's middle)
      const out = (A[0] + B[0]) / 2 - sl.cx, outz = (A[2] + B[2]) / 2 - sl.cz, sg = out * sn[0] + outz * sn[2] < 0 ? -1 : 1, nn = [sn[0] * sg, 0.15, sn[2] * sg];
      const i0 = G.vert(A, nn, mul3(C.slag, tone * 0.8), S_.slag), i1 = G.vert(B, nn, mul3(C.slag, tone * 0.8), S_.slag);
      const i2 = G.vert([B[0] + nn[0] * 0.25, B[1] - 2.7, B[2] + nn[2] * 0.25], nn, mul3(C.slag, 0.2), S_.slag), i3 = G.vert([A[0] + nn[0] * 0.25, A[1] - 2.7, A[2] + nn[2] * 0.25], nn, mul3(C.slag, 0.2), S_.slag);
      G.tri(i0, i1, i2); G.tri(i0, i2, i3);
    }
    if (++ns % 60 === 0) await brk();
  }
  await brk();
  // THE RIDGES: long plates thrust up steeply, a broken crest, a dark scarp under it
  for (const q of plan.ground.ridges) {
    const r = makeRng(hashSeed('tables-ridge:' + plan.seed + ':' + Math.round(q.x) + ':' + Math.round(q.z))), ct = Math.cos(q.turn * DEG), st = Math.sin(q.turn * DEG), g = groundTop(q.x, q.z), nseg = 5;
    // along its length d, across it e (the crest on the side `face`): the plan place
    const P = (d, e) => [q.x + d * st + e * ct * q.face, q.z + d * ct - e * st * q.face];
    let prev = null;
    for (let i = 0; i <= nseg; i++) {
      const d = lerp(-q.len / 2, q.len / 2, i / nseg), ends = Math.sin(Math.PI * i / nseg), hi = g + q.rise * (0.25 + 0.75 * ends) * r.range(0.7, 1.0), lo = P(d, -q.wide / 2), cr = P(d, q.wide / 2 + r.range(-0.6, 0.6)), ft = P(d, q.wide / 2 + 1.1);
      const cur = { L: [lo[0], g - 0.7, lo[1]], H: [cr[0], hi, cr[1]], F: [ft[0], g - 1.6, ft[1]] };
      if (prev) { G.quad(prev.L, cur.L, cur.H, prev.H, mul3(C.slag, 2.3), S_.slag); G.quad(prev.H, cur.H, cur.F, prev.F, mul3(C.slag, 0.75), S_.slag); }
      prev = cur;
    }
  }
  await brk();
  // boulders and stumps of slag, each its own lump
  let nk = 0;
  for (const k of plan.rocks) {
    if (++nk % 30 === 0) await brk();
    const r = makeRng(hashSeed('tables-rock:' + plan.seed + ':' + Math.round(k.x) + ':' + Math.round(k.z))), y = k.y, t0 = k.turn * DEG;
    const j1 = r.range(0.15, 0.4), j2 = r.range(0, 6.28), fl = k.sort === 0 ? 0.35 : 1;
    const prof = [[k.r * 1.0, y], [k.r * 0.95, y + k.h * 0.45 * fl], [k.r * 0.7 * (k.sort === 2 ? 0.6 : 1), y + k.h * fl], [0.001, y + k.h * fl * 1.04]];
    G.lathe(k.x, k.z, prof, { seg: 7, flat: true, rmul: (a) => 0.72 + j1 * Math.sin(a * 2 + j2) + 0.18 * Math.sin(a * 3 + t0), color: (rr, yy) => mul3(C.slag, yy > y + k.h * 0.5 * fl ? 2.3 : 1.5), surf: S_.slag });
  }
}

// ================================================================ THE GLASS: all but invisible
// What shows of it: a faint cool sheen at grazing angles, a red glint where a sun glances off it, the ring's light on the
// panes about it; seen from outside, the lit air within (amber, low). Added light only: it never tints the sky.
const GLASS_VERT = /* glsl */`
varying vec3 vW;
varying vec3 vN;
void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }`;
const GLASS_FRAG = /* glsl */`
uniform vec4 uSunL[5];
uniform vec4 uRing;
varying vec3 vW;
varying vec3 vN;
void main() {
  vec3 N = normalize(vN), V = normalize(cameraPosition - vW);
  float side = dot(N, V), ndv = abs(side), graze = pow(clamp(1.0 - ndv, 0.0, 1.0), 4.0);
  float outside = step(0.0, side);
  vec3 Nf = N * (outside * 2.0 - 1.0), Rf = reflect(-V, Nf);
  // a faint cool sheen at a slant; a red glint where a sun glances off it (from outside)
  vec3 col = vec3(0.32, 0.46, 0.62) * graze * 0.02;
  for (int i = 0; i < 5; i++) col += vec3(1.0, 0.3, 0.1) * uSunL[i].w * 1.6 * pow(clamp(dot(Rf, uSunL[i].xyz), 0.0, 1.0), 220.0) * outside;
  // from outside: the lit air of the room behind the pane, amber, strongest low over the gallery's lamps and thinning
  // upward to nothing (by the pane's own height: a glow of the place; seven tenths of it are the same from every side,
  // three tenths go by the angle the pane is seen at: fullest seen square on)
  col += vec3(1.0, 0.56, 0.24) * outside * 0.25 * exp(-max(vW.y - ${DIM.YG.toFixed(1)}, 0.0) / 15.0) * (0.7 + 0.3 * ndv);
  // the ring's light on the panes about it (by place: the lamp's distance), seen from inside
  vec3 dr = uRing.xyz - vW; float r2 = dot(dr, dr);
  col += vec3(1.0, 0.82, 0.56) * uRing.w * 0.03 / (1.0 + r2 / 150.0) * (1.0 - outside) * (0.5 + 0.5 * graze);
  gl_FragColor = vec4(col, 1.0);
}`;
export function makeGlass(roomUniforms) {
  const G = makeBuilder(), prof = [];
  for (let j = 0; j <= 14; j++) { const an = 0.94 * j / 14 * Math.PI / 2; prof.push([DIM.RD * Math.cos(an), DIM.YG + DIM.HD * Math.sin(an)]); }
  G.lathe(0, 0, prof, { seg: 72, color: C.white, surf: [0, 0, 0, 0] });
  const material = new THREE.ShaderMaterial({ uniforms: { uSunL: roomUniforms.uSunL, uRing: roomUniforms.uRing }, vertexShader: GLASS_VERT, fragmentShader: GLASS_FRAG, side: THREE.DoubleSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const mesh = new THREE.Mesh(G.build(), material);
  mesh.renderOrder = 950; mesh.name = 'glass';
  return { mesh, material };
}

// ================================================================ THE WATER of the fountains (its own small shader)
// wat = (sort, place along the flow 0..1, phase): 0 still water in a basin (rings), 1 a jet or a falling thread (streaks
// that run), 2 a sheet falling from a rim of the great fountain (broken sheets and threads that fall for ever), 3 the
// clear water of a small glass bowl (round t1: all but clear seen square on, a pale sheen where its side turns away)
const WATER_VERT = /* glsl */`
attribute vec3 wat;
varying vec3 vWat;
varying vec3 vW;
varying vec3 vN;
void main() { vWat = wat; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vN = normal; gl_Position = projectionMatrix * viewMatrix * w; }`;
const WATER_FRAG = /* glsl */`
uniform float uTime;
varying vec3 vWat;
varying vec3 vW;
varying vec3 vN;
${SKY_NOISE}
void main() {
  vec3 V = normalize(cameraPosition - vW);
  vec3 aqua = vec3(0.4, 0.68, 0.62), warm = vec3(1.0, 0.72, 0.4);
  vec3 col; float a;
  if (vWat.x > 2.5) {
    // a small round glass bowl of clear water: what is in it is seen through it; its side shows where it turns from the eye
    float fr = pow(clamp(1.0 - abs(dot(normalize(vN), V)), 0.0, 1.0), 2.0);
    col = mix(aqua * 0.55, vec3(0.9, 0.97, 0.95), fr) + warm * 0.12;
    a = 0.1 + 0.55 * fr;
  } else if (vWat.x < 0.5) {
    // a basin: rings going out from where the water falls in, the candle light and the sky's red on it
    float r = vWat.y, ring = 0.5 + 0.5 * sin(r * 34.0 - uTime * 3.2 + vWat.z);
    float chop = vn2(vW.xz * 3.0 + vec2(uTime * 0.4, -uTime * 0.3));
    float fres = pow(clamp(1.0 - abs(V.y), 0.0, 1.0), 3.0);
    col = aqua * (0.16 + 0.2 * chop) + warm * (0.1 + 0.5 * pow(clamp(ring * chop * 1.4, 0.0, 1.0), 3.0)) + vec3(0.9, 0.3, 0.14) * fres * 0.35;
    a = 0.82;
  } else if (vWat.x > 1.5) {
    // the water falling from a rim: ONE SEPARATE SHEET from each low place of the scalloped lip (n of them round the
    // rim), so that the copper of the bowls and the green stem show between the sheets; white water falling on the
    // world's clock, lit warm by the cups. Never a curtain round a basin, never one flat white.
    // vWat.x = 2 + (n + th) / 100: n the low places of the lip, th the half share of a scallop's width a sheet takes at
    // the lip. Each sheet has a breadth of its own (by its lip), narrows as it falls and tears into threads lower down;
    // threads fall only beside a sheet. Between two sheets there is dark air.
    float qn = (vWat.x - 2.0) * 100.0 + 0.001, n = floor(qn), th = qn - n, v = vWat.y;
    float ang = atan(vW.x, vW.z);
    // (every noise here is taken at the place itself, round the basin, and the lips are counted round: nothing breaks
    // where the bearing wraps)
    float cell = ang * n / 6.2831853, li = mod(floor(cell), n), tq = abs(fract(cell) - 0.5);
    float wide = th * (0.55 + 0.9 * h11(li * 3.7 + vWat.z * 5.0 + 1.3)) * (1.0 - 0.5 * v);
    float wob = th * 0.5 * (vn3(vec3(vec2(sin(ang), cos(ang)) * n * 0.7 + vWat.z, vW.y * 0.35 + uTime * 1.1)) - 0.5);
    float lip = 1.0 - smoothstep(wide + wob, wide + 0.035 + wob, tq);
    float beside = 1.0 - smoothstep(th * 1.6, th * 3.2, tq);
    // (held at or over nought by a clamp, since they are bases of pow below)
    float thr = clamp(vn3(vec3(vW.xz * 4.6 + vWat.z * 3.0, vW.y * 0.22 + uTime * 2.4)), 0.0, 1.0);
    float fine = clamp(vn3(vec3(vW.xz * 11.0, vW.y * 0.6 + uTime * 3.3)), 0.0, 1.0);
    float run = vn3(vec3(vW.xz * 1.7 + vWat.z, vW.y * 0.5 + uTime * 2.0));
    float tear = mix(1.0, smoothstep(0.3, 0.62, vn3(vec3(vW.xz * 0.8 + li * 1.7 + vWat.z, vW.y * 0.16 + uTime * 1.5))), 0.85 * v);
    float edge = clamp(abs(dot(normalize(vN), V)), 0.0, 1.0);
    a = clamp(lip * (0.5 + 0.4 * run) * tear + (1.0 - lip) * beside * pow(thr, 5.0) * 0.55 + lip * pow(fine, 4.0) * 0.4, 0.0, 0.9) * (0.6 + 0.4 * edge) * (1.0 - 0.3 * v);
    col = mix(vec3(0.5, 0.68, 0.7), vec3(0.93, 0.97, 0.95), clamp(0.25 + 0.75 * thr * (0.6 + 0.6 * run), 0.0, 1.0)) * 0.86 + warm * (0.1 + 0.14 * (1.0 - v)) + vec3(1.0) * pow(fine, 6.0) * 0.3;
  } else {
    // a jet or a falling thread: white streaks that run along it for ever, lit warm from under
    float run = fract(vWat.y * 3.0 - uTime * 0.9 + vWat.z);
    float streak = vn2(vec2(vWat.y * 22.0 - uTime * 6.0 + vWat.z * 7.0, vWat.z * 13.0));
    float edge = clamp(abs(dot(normalize(vN), V)), 0.0, 1.0);
    col = mix(aqua, vec3(0.95, 1.0, 0.98), 0.45 + 0.5 * streak) * (0.7 + 0.5 * run) + warm * 0.35 * (1.0 - vWat.y);
    a = (0.35 + 0.5 * streak) * (0.45 + 0.55 * edge);
  }
  gl_FragColor = vec4(col, a);
}`;
export function makeWater(fountains, time, bowl = null) {
  const pos = [], nrm = [], wat = [], idx = [];
  const vert = (p, n, w) => { pos.push(p[0], p[1], p[2]); nrm.push(n[0], n[1], n[2]); wat.push(w[0], w[1], w[2]); return pos.length / 3 - 1; };
  const disc = (x, y, z, R, ph, n = 18) => { const c = vert([x, y, z], [0, 1, 0], [0, 0, ph]); for (let i = 0; i <= n; i++) { const a = i / n * Math.PI * 2; vert([x + Math.sin(a) * R, y, z + Math.cos(a) * R], [0, 1, 0], [0, 1, ph]); if (i) idx.push(c, c + i, c + i + 1); } };
  // a thread of water along points, four sided
  const thread = (pts, r0, r1, ph) => {
    const base = pos.length / 3, n = pts.length, S = 4;
    for (let i = 0; i < n; i++) { const t = i / (n - 1), r = lerp(r0, r1, t); for (let k = 0; k <= S; k++) { const an = k / S * Math.PI * 2, nx = Math.sin(an), nz = Math.cos(an); vert([pts[i][0] + nx * r, pts[i][1], pts[i][2] + nz * r], [nx, 0, nz], [1, t, ph]); } }
    for (let i = 0; i < n - 1; i++) for (let k = 0; k < S; k++) { const q = base + i * (S + 1) + k; idx.push(q, q + S + 1, q + 1, q + 1, q + S + 1, q + S + 2); }
  };
  // a sheet falling from a rim (R0 at y0) to the water below (y1), thrown outward a little as it falls
  const sheet = (R0, y0, y1, ph, lips, th, spread) => {
    const seg = Math.round(clamp(R0 * 6.5, 24, 64)), nv = y0 - y1 > 12 ? 6 : 4, base = pos.length / 3;
    for (let j = 0; j <= nv; j++) { const v = j / nv, R = R0 + spread * Math.sqrt(v), y = lerp(y0, y1, v * v * 0.35 + v * 0.65); for (let i = 0; i <= seg; i++) { const a = i / seg * Math.PI * 2; vert([Math.sin(a) * R, y, Math.cos(a) * R], [Math.sin(a), 0, Math.cos(a)], [2 + (lips + th) / 100, v, ph]); } }
    for (let j = 0; j < nv; j++) for (let i = 0; i < seg; i++) { const q = base + j * (seg + 1) + i; idx.push(q, q + seg + 1, q + 1, q + 1, q + seg + 1, q + seg + 2); }
  };
  for (const f of fountains) {
    const x = f.x, y = f.y, z = f.z, ph = f.phase, top = y + f.jet;
    disc(x, y + 0.86, z, 2.72, ph); disc(x, y + 2.78, z, 1.2, ph + 2);
    // the middle jet, then eight threads that arch from its head into the bowl, and twelve from the bowl's lip to the basin
    const jet = []; for (let i = 0; i <= 6; i++) jet.push([x, lerp(y + 3.5, top, i / 6), z]);
    thread(jet, 0.09, 0.2, ph);
    for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2 + ph, pts = []; for (let i = 0; i <= 6; i++) { const t = i / 6, rr = 0.15 + 0.95 * t; pts.push([x + Math.sin(a) * rr, top - 0.2 + 0.5 * Math.sin(t * 1.2) - (top - y - 2.85) * t * t, z + Math.cos(a) * rr]); } thread(pts, 0.1, 0.05, ph + k); }
    for (let k = 0; k < 12; k++) { const a = (k + 0.5) / 12 * Math.PI * 2 + ph, pts = []; for (let i = 0; i <= 4; i++) { const t = i / 4, rr = 1.32 + 0.75 * t; pts.push([x + Math.sin(a) * rr, y + 2.85 + 0.12 * Math.sin(t * 2.0) - 2.0 * t * t, z + Math.cos(a) * rr]); } thread(pts, 0.06, 0.04, ph + k * 1.7); }
  }
  // THE GREAT FOUNTAIN: the pool; the water in each basin; from the low places of each lip a separate sheet to the water
  // it comes down on (the topmost basin's fall passes outside the small one to the broad low bowl); the ONE tall plume
  // from the nozzle, and the threads of its water arching back into the topmost basin
  disc(0, FOUNT.pool, 0, DIM.RPOOL - 0.04, 0, 40);
  FOUNT.rims.forEach(([R, yr, n, th], k) => { const f = fountFall(k); disc(0, yr - 0.12, 0, R * 0.95, k * 1.3, 28); sheet(R * 0.97 + 0.12, yr + 0.04, f.y1, k * 1.7, n, th, f.spread); });
  const yn = FOUNT.nozzle, yTop = FOUNT.plume, yb = FOUNT.rims[FOUNT.rims.length - 1][1] - 0.12;
  const jet = []; for (let i = 0; i <= 5; i++) jet.push([0, lerp(yn, yTop, i / 5), 0]);
  thread(jet, 0.24, 0.6, 3);
  for (let k = 0; k < 8; k++) { const a = (k + 0.5) / 8 * Math.PI * 2, pts = []; for (let i = 0; i <= 7; i++) { const t = i / 7, rr = 0.25 + 2.6 * t; pts.push([Math.sin(a) * rr, yTop - 0.15 + 0.6 * Math.sin(t * 1.3) - (yTop - 0.15 + 0.6 * Math.sin(1.3) - yb) * t * t, Math.cos(a) * rr]); } thread(pts, 0.13, 0.06, k * 1.1); }
  // (round t1) THE BOWL OF THE PARTY'S TABLE: a small globe of clear water, open at the top (bowl: its middle, its radius,
  // the height over its middle where it is cut off)
  if (bowl) {
    const nb = 6, ns = 10, base = pos.length / 3, top = Math.asin(clamp(bowl.cut / bowl.r, -1, 1));
    for (let j = 0; j <= nb; j++) { const el = lerp(-Math.PI / 2 + 0.25, top, j / nb), cr = Math.cos(el), sr = Math.sin(el); for (let i = 0; i <= ns; i++) { const a = i / ns * Math.PI * 2; vert([bowl.x + bowl.r * cr * Math.sin(a), bowl.y + bowl.r * sr, bowl.z + bowl.r * cr * Math.cos(a)], [cr * Math.sin(a), sr, cr * Math.cos(a)], [3, j / nb, 0]); } }
    for (let j = 0; j < nb; j++) for (let i = 0; i < ns; i++) { const q = base + j * (ns + 1) + i; idx.push(q, q + ns + 1, q + 1, q + 1, q + ns + 1, q + ns + 2); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3)); g.setAttribute('wat', new THREE.Float32BufferAttribute(wat, 3));
  g.setIndex(idx); g.computeBoundingSphere();
  const material = new THREE.ShaderMaterial({ uniforms: { uTime: time }, vertexShader: WATER_VERT, fragmentShader: WATER_FRAG, side: THREE.DoubleSide, transparent: true, depthWrite: false });
  const mesh = new THREE.Mesh(g, material);
  mesh.renderOrder = 960; mesh.frustumCulled = false; mesh.name = 'water';
  return { mesh, material, triangles: idx.length / 3 };
}

// ================================================================ THE SMALL LIGHTS AND THE AIR (one shader, instanced dabs)
// Each dab turns about its own place to face the eye; its place and size are the world's. iCol.a is its sort:
// 0 a candle flame in a cup of coloured glass (iCol.rgb its cup's tint; breathes and leans on its own phase), 1 a soft glow of a lamp or a cup (in its own colour), 2 a drop of
// the great fountain's falling water (falls iPrm.z metres on a loop of iPrm.y seconds), 3 steam off a dish or low dust off
// the plain (rises and fades on a loop of its own: iPrm.y seconds, iPrm.z metres; iPrm.w its flatness), 4 a candle flame
// on a chandelier (it goes round the chandelier's axis iPrm.yz at iCol.r radians a second from iCol.g).
// NO MOTES: nothing drifts in the air (D3). Steam, dust and drops are as bright from near as from far: they keep off the
// flown line by their places, counted by the plan on seeds 1 to 300 with the engine's vary: steam rises off dishes on
// tables that keep 2.6 m (the nearest steam's whole course 2.99 m off the line); the dust lies 55 m and more from the
// line (the nearest 70.5 m); no drop or spray of the great fountain comes within 36 m of it (36.8 m).
const DAB_VERT = /* glsl */`
attribute vec4 iPos;
attribute vec4 iCol;
attribute vec4 iPrm;
uniform float uTime;
varying vec2 vUv;
varying vec4 vCol;
varying float vFade;
void main() {
  float kind = iCol.a, ph = iPrm.x, size = iPos.w;
  vec3 c = iPos.xyz;
  vec2 q = position.xy;
  float fade = 1.0;
  if (kind < 0.5) {
    float br = 1.0 + 0.16 * sin(uTime * 8.3 + ph) + 0.09 * sin(uTime * 13.7 + ph * 1.9);
    float up = q.y + 0.5;
    q.y = up * iPrm.w * br;
    q.x += up * (0.3 * sin(uTime * 2.1 + ph * 0.7) + 0.16 * sin(uTime * 5.3 + ph));
  } else if (kind < 1.5) {
    q *= 1.0 + 0.05 * sin(uTime * 6.1 + ph);
  } else if (kind < 2.5) {
    float u = fract(uTime / max(iPrm.y, 0.5) + ph);
    c.y -= u * u * iPrm.z;
    q.y *= 2.4;
    fade = smoothstep(0.0, 0.12, u) * (1.0 - smoothstep(0.8, 1.0, u));
  } else if (kind < 3.5) {
    float u = fract(uTime / max(iPrm.y, 0.5) + ph);
    c.y += u * iPrm.z;
    c.x += sin(u * 5.0 + ph * 9.0) * 0.12 * iPrm.z;
    c.z += cos(u * 4.0 + ph * 7.0) * 0.1 * iPrm.z;
    size *= 0.45 + 0.9 * u;
    q.y *= iPrm.w;
    fade = sin(u * 3.14159265);
  } else {
    float an = iCol.r * uTime + iCol.g, ca = cos(an), sa = sin(an);
    vec2 o = c.xz - iPrm.yz;
    c.xz = iPrm.yz + vec2(o.x * ca + o.y * sa, -o.x * sa + o.y * ca);
    float br = 1.0 + 0.16 * sin(uTime * 8.3 + ph) + 0.09 * sin(uTime * 13.7 + ph * 1.9);
    float up = q.y + 0.5;
    q.y = up * iPrm.w * br;
    q.x += up * (0.3 * sin(uTime * 2.1 + ph * 0.7) + 0.16 * sin(uTime * 5.3 + ph));
  }
  // (no dab fades by how far the eye is: steam, dust and drops keep their places by the plan's own margins)
  vec4 mv = viewMatrix * vec4(c, 1.0);
  mv.xy += q * size;
  vUv = position.xy + 0.5;
  vCol = iCol;
  vFade = fade;
  gl_Position = projectionMatrix * mv;
}`;
const DAB_FRAG = /* glsl */`
uniform float uTime;
varying vec2 vUv;
varying vec4 vCol;
varying float vFade;
void main() {
  float kind = vCol.a;
  vec2 p = vUv * 2.0 - 1.0;
  vec3 col; float a;
  if (kind < 0.5 || kind > 3.5) {
    // a flame: a pointed tongue, pale gold at the heart, amber at the edge, blue at the wick
    float y = clamp(vUv.y, 0.0, 1.0), w = 0.72 * sqrt(clamp(y * 1.6, 0.0, 1.0)) * (1.0 - pow(y, 1.6)) + 0.02;
    float d = abs(p.x) / max(w, 1e-3);
    a = (1.0 - smoothstep(0.35, 1.0, d)) * smoothstep(0.0, 0.06, y);
    col = mix(vec3(1.0, 0.5, 0.12), vec3(1.0, 0.9, 0.6), 1.0 - smoothstep(0.1, 0.9, d)) * 2.6;
    col = mix(col, vec3(0.3, 0.45, 1.0) * 1.4, 1.0 - smoothstep(0.0, 0.16, y));
    // a table's or the fountain's candle burns in a cup of coloured glass and is seen through it: it takes the cup's
    // colour (vCol.rgb) and is no brighter than the cup's own glow carries (a chandelier's flame keeps its own)
    if (kind < 0.5) col *= vCol.rgb * 0.65;
  } else if (kind < 1.5) {
    float r2 = dot(p, p);
    a = exp(-clamp(r2, 0.0, 4.0) * 3.2) * (1.0 - smoothstep(0.7, 1.0, r2));
    col = vCol.rgb;
  } else if (kind < 2.5) {
    float r2 = dot(p, p);
    a = exp(-clamp(r2, 0.0, 4.0) * 3.0) * (1.0 - smoothstep(0.6, 1.0, r2));
    col = vCol.rgb;
  } else {
    float r2 = dot(p, p);
    a = exp(-clamp(r2, 0.0, 4.0) * 2.4) * (1.0 - smoothstep(0.6, 1.0, r2));
    col = vCol.rgb;
  }
  gl_FragColor = vec4(col * a * vFade, 1.0);
}`;
// dabs: [x, y, z, size, r, g, b, sort, phase, period, rise, aspect] each
export function makeDabs(list, time) {
  const n = list.length, base = new THREE.PlaneGeometry(1, 1), g = new THREE.InstancedBufferGeometry();
  g.index = base.index; g.setAttribute('position', base.getAttribute('position'));
  const a = new Float32Array(n * 4), b = new Float32Array(n * 4), c = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) { const d = list[i]; a.set([d[0], d[1], d[2], d[3]], i * 4); b.set([d[4], d[5], d[6], d[7]], i * 4); c.set([d[8], d[9], d[10], d[11]], i * 4); }
  g.setAttribute('iPos', new THREE.InstancedBufferAttribute(a, 4)); g.setAttribute('iCol', new THREE.InstancedBufferAttribute(b, 4)); g.setAttribute('iPrm', new THREE.InstancedBufferAttribute(c, 4));
  g.instanceCount = n;
  const material = new THREE.ShaderMaterial({ uniforms: { uTime: time }, vertexShader: DAB_VERT, fragmentShader: DAB_FRAG, transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor });
  const mesh = new THREE.Mesh(g, material);
  mesh.frustumCulled = false; mesh.renderOrder = 970; mesh.name = 'dabs';
  return { mesh, material, count: n };
}

// ================================================================ WHAT A PARTY LEFT (rounds t1 and t2): plain things of the place
// Every one is the crew's own plain form of an everyday thing, made from flat faces; none moves but the fish; none is
// lettered but the table's number (two numerals of flat strokes, built only where the world's TABLE_NUMBER is true).
// (Round t2: the gown is C.rust, the room's own rust, the one its floor's inlay has; the colours from `beer` on are
// round t2's: the pints, the plain glasses, the packets, the cake and its plate, the slab, the helmets' iron. Round t3:
// the sofa's leather browns are gone; `velvet` is its cloth's deep ground, `drop` and `drop2` the two quieter colours of
// the cloth's figure; `petP` is a lighter purple than it was, so that a purple flower shows as purple in the candles'
// warm light; `glassDim` is the bare glass of the long table's drinking glasses, far dimmer than the pale `glass` it replaces.)
const T1 = {
  towel: hexLin('#7d99ad'), stripe: hexLin('#e9e2cf'), towel2: hexLin('#b98a6c'), gown: C.rust, tea: hexLin('#7a4a1c'), bar: hexLin('#f0b62a'),
  leather: hexLin('#6f5132'), drink: hexLin('#d9b45a'), lemon: hexLin('#f1d02e'), fish: hexLin('#f6c81a'), petP: hexLin('#9048c8'), petW: hexLin('#efe9f2'),
  black: [0, 0, 0], iron: [0.24, 0.24, 0.265], wine: hexLin('#6a1826'),
  beer: hexLin('#7a3c12'), head: hexLin('#efe6cf'), ale: hexLin('#c98a2e'), pale: hexLin('#e3cf8c'), packet: hexLin('#3f7a52'), foil: [0.6, 0.62, 0.64],
  china: GLAZES[4], icing: hexLin('#f6f3ea'), sponge: hexLin('#d6b06a'), slab: [0.022, 0.022, 0.026], key: [0.085, 0.085, 0.095], screen: [0.007, 0.011, 0.013],
  velvet: hexLin('#17525f'), drop: hexLin('#a8823f'), drop2: hexLin('#96a48e'), glassDim: [0.33, 0.36, 0.35],
};
const MATT = [0, 0, 0, 0], SOFT = [0, 0.04, 0, 0];
// a place on a table's top by its bearing (degrees, in the table's own frame) and its distance from the middle
const PB = (b, r) => [r * Math.sin(b * DEG), r * Math.cos(b * DEG)];
// a hanging cloth: rows of points across its width, one colour for each band between two rows
const clothInto = (G, rows, cols, surf = SOFT) => { for (let j = 0; j < rows.length - 1; j++) for (let i = 0; i < rows[j].length - 1; i++) G.quad(rows[j][i], rows[j][i + 1], rows[j + 1][i + 1], rows[j + 1][i], cols[j], surf); };
// a flat many-sided face (points in order round it), one normal
const fanInto = (G, pts, n, color, surf, mid = null, midColor = color) => {
  const ids = pts.map((p) => G.vert(p, n, color, surf));
  if (mid) { const c = G.vert(mid, n, midColor, surf); for (let i = 0; i < ids.length; i++) G.tri(c, ids[i], ids[(i + 1) % ids.length]); } else for (let i = 1; i < ids.length - 1; i++) G.tri(ids[0], ids[i], ids[i + 1]);
};

// THE TOWEL over a chair's back (the chair's own frame: its back at z 0.2, a metre high): a bath towel folded once and
// hung, soft folds, one quiet colour, a woven stripe at each end
function towelInto(G, col, stripe) {
  const path = [[0.43, 0.27], [0.455, 0.268], [0.515, 0.265], [0.74, 0.255], [0.975, 0.246], [1.04, 0.2], [0.975, 0.154], [0.8, 0.148], [0.67, 0.144], [0.61, 0.142], [0.585, 0.141]];
  const cols = [col, stripe, mul3(col, 0.94), col, mul3(col, 1.06), mul3(col, 1.02), mul3(col, 0.9), mul3(col, 0.86), stripe, mul3(col, 0.86)];
  const xs = [-0.235, -0.13, -0.02, 0.1, 0.235];
  const rows = path.map(([y, z]) => xs.map((x, i) => { const out = z > 0.2 ? 1 : -1, hang = clamp((1.0 - y) / 0.3, 0, 1); return [x * (1 - 0.05 * hang), y + (i === 0 || i === 4 ? -0.012 * hang : 0), z + out * hang * (0.013 * Math.sin(i * 1.9 + 0.6) + 0.006)]; }));
  clothInto(G, rows, cols);
  // (folded once: the fold's doubled edge shows along one side)
  G.quad([0.235, 0.43, 0.262], [0.243, 0.43, 0.268], [0.243, 0.975, 0.246], [0.235, 0.975, 0.24], mul3(col, 0.8), SOFT);
}
// THE DRESSING GOWN left in a heap on the same chair's seat and over its side (side: the hand it hangs to), its cord hanging
// (round t2: one plain colour, the room's rust, no stripe; the cord and its knot a shade darker than the gown)
// (ROUND t3: SO THAT IT READS AS A DRESSING GOWN AND NOT A HEAP OF CLOTH) ONE SLEEVE hangs out of the heap over the chair's
// side (the same side, toward the table's number): a soft flattened tube, 14 to 16 cm wide, straight down beside the
// chair to the floor, where its last hand's breadth lies turned outward with the cuff OPEN (a turned-back cuff band a
// shade paler; the dark of the sleeve's inside in its mouth). The fold of the gown over that side is shorter and
// narrower than it was (it ends just under the seat), so that the sleeve hangs clear of it. THE CORD is thicker
// (3.2 cm) and hangs over the same side now, beside the sleeve (4 cm of air between them), down to the floor, and
// LIES OUT ALONG THE FLOOR from there in a slack curve, away from the chair, to a knot and a flared tassel 0.4 m and
// more from the chair's nearest leg: a hanging cord is one more upright line among a chair's legs, a cord trailing on
// the floor is a cord (it hung over the seat's front, under the table's cloth, where nobody saw it). All of it is
// still (no sway) and of the one plain colour, in three shades of it; it stays inside the body the table keeps from
// the line and from its neighbours (1.5 m about its middle): the tassel's end lies 0.65 m aside of the chair's middle,
// 1.32 m from the table's middle at the most (the towel's far corner comes to 1.38 m).
function gownInto(G, side, col) {
  const lt = mul3(col, 1.12), dk = mul3(col, 0.8), cd = mul3(col, 0.62);
  G.ball(0.03 * side, 0.575, -0.01, 0.21, { rings: 4, seg: 8, squash: 0.5, rmul: (a) => 1 + 0.15 * Math.sin(a * 3 + 1) + 0.08 * Math.sin(a * 5), color: (r, y) => (y > 0.6 ? lt : dk), surf: SOFT });
  const zs = [-0.21, -0.13, -0.05, 0.03], flap = [[0.06, 0.61], [0.2, 0.585], [0.262, 0.5], [0.27, 0.4], [0.274, 0.33]];
  clothInto(G, flap.map(([x, y], j) => zs.map((z, i) => [side * (x + (j > 1 ? 0.014 * Math.sin(i * 2.3 + j) : 0)), y - (j === 4 ? 0.03 * (i % 2) : 0), z * (1 + 0.06 * j)])), [lt, col, dk, col]);
  // its collar thrown up against the back
  clothInto(G, [[0.6, 0.1], [0.72, 0.16], [0.83, 0.172]].map(([y, z]) => [-0.16, -0.04, 0.09].map((x) => [x * side, y, z])), [col, lt]);
  // (round t3) the sleeve: its middle line [aside, up, along the chair's side], its half width (along the side) and half
  // thickness at each place; six flat faces round it, the broad one turned outward paler, the one turned inward darker
  const line = [[0.15, 0.645, 0.09, 0.066, 0.02], [0.265, 0.615, 0.107, 0.068, 0.02], [0.312, 0.5, 0.118, 0.068, 0.02], [0.32, 0.3, 0.128, 0.072, 0.02], [0.326, 0.12, 0.135, 0.076, 0.022], [0.345, 0.054, 0.139, 0.078, 0.027], [0.4, 0.041, 0.143, 0.08, 0.03], [0.447, 0.041, 0.145, 0.08, 0.03]];
  const ringAt = (i, grow = 0, back = 0) => {
    const p = line[i], a = line[Math.max(0, i - 1)], b = line[Math.min(line.length - 1, i + 1)], tl = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, tx = (b[0] - a[0]) / tl, ty = (b[1] - a[1]) / tl, out = [];
    for (let k = 0; k < 6; k++) { const th = k * Math.PI / 3, cw = Math.cos(th) * (p[3] + grow), st = Math.sin(th) * (p[4] + grow); out.push([side * (p[0] - tx * back - ty * st), p[1] - ty * back + tx * st, p[2] + cw]); }
    return out;
  };
  const band = (ra, rb, shade) => { for (let k = 0; k < 6; k++) G.quad(ra[k], ra[(k + 1) % 6], rb[(k + 1) % 6], rb[k], mul3(k === 1 ? lt : k === 4 ? dk : col, shade), SOFT); };
  for (let i = 0; i < line.length - 1; i++) band(ringAt(i), ringAt(i + 1), i % 2 ? 0.95 : 1);
  // its cuff: a turned-back band about the sleeve's last hand's breadth, and the dark inside in its open mouth
  band(ringAt(6, 0.008, -0.012), ringAt(7, 0.008), 1.1);
  { const m = ringAt(7, -0.004, 0.012), last = line[7]; fanInto(G, m, [side, 0, 0], mul3(col, 0.16), MATT, [side * (last[0] - 0.03), last[1], last[2]]); }
  // the cord: out of the heap, over the seat's side, down to the floor and out along it; a knot and a flared tassel at
  // its end ([aside, up, along the chair's side, its half thickness in mm] from the heap to the tassel's end)
  const cord = [[0.1, 0.62, -0.06, 16], [0.215, 0.585, -0.03, 16], [0.285, 0.5, -0.012, 16], [0.306, 0.38, -0.006, 16], [0.311, 0.2, -0.005, 16], [0.316, 0.07, -0.005, 16], [0.338, 0.022, -0.012, 16], [0.39, 0.018, -0.04, 16], [0.45, 0.018, -0.05, 16], [0.505, 0.018, -0.025, 16], [0.55, 0.019, -0.02, 16], [0.566, 0.034, -0.022, 32], [0.584, 0.03, -0.026, 17], [0.645, 0.043, -0.04, 42]];
  G.tube(cord.map((p) => [p[0] * side, p[1], p[2]]), (t) => cord[Math.round(t * (cord.length - 1))][3] / 1000, { sides: 4, color: (t) => (t > 0.9 ? mul3(cd, 1.15) : cd), surf: SOFT });
}
// A CUP OF TEA on its saucer at (cx, cz) and a small teapot at (px, pz), its spout along the bearing `turn`
function teaInto(G, cx, cz, px, pz, turn) {
  const y = 0.762, china = C.ivory, gl = S_.plain(0.7);
  G.lathe(cx, cz, [[0.001, y + 0.004], [0.05, y + 0.004], [0.073, y + 0.016]], { seg: 8, color: china, surf: gl, flat: true });
  G.lathe(cx, cz, [[0.022, y + 0.008], [0.036, y + 0.04], [0.041, y + 0.068]], { seg: 8, color: china, surf: gl });
  G.lathe(cx, cz, [[0.001, y + 0.06], [0.038, y + 0.06]], { seg: 8, color: T1.tea, surf: S_.plain(0.8), flat: true });
  const ct = Math.cos(turn), st = Math.sin(turn), H = (u, v) => [u * st, v, u * ct];
  { const h = H(0.041, 0); G.tube([[cx + h[0], y + 0.06, cz + h[2]], [cx + h[0] * 1.6, y + 0.05, cz + h[2] * 1.6], [cx + h[0] * 1.5, y + 0.028, cz + h[2] * 1.5], [cx + h[0] * 0.85, y + 0.022, cz + h[2] * 0.85]], 0.005, { sides: 3, color: china, surf: gl }); }
  G.ball(px, y + 0.058, pz, 0.068, { rings: 5, seg: 8, squash: 0.84, color: china, surf: gl });
  G.lathe(px, pz, [[0.036, y + 0.108], [0.03, y + 0.118], [0.008, y + 0.124], [0.012, y + 0.138], [0.001, y + 0.146]], { seg: 6, color: china, surf: gl });
  const sp = (u, v) => { const h = H(u, v); return [px + h[0], y + v, pz + h[2]]; };
  G.tube([sp(0.055, 0.045), sp(0.095, 0.075), sp(0.118, 0.112)], (t) => lerp(0.014, 0.008, t), { sides: 4, color: china, surf: gl });
  G.tube([sp(-0.06, 0.09), sp(-0.105, 0.085), sp(-0.11, 0.045), sp(-0.064, 0.03)], 0.007, { sides: 3, color: china, surf: gl });
}
// A PAIR OF SUNGLASSES (its own frame: the lenses look to +z and up): the lenses and the frame perfectly black, no shine.
// (ROUND t3: the two pairs were two dark blots on the cloth, run together. Each pair is of an everyday size now, 14 cm
// across: two lenses of 5.6 by 4.6 cm with 2.2 cm OF CLOTH SHOWING BETWEEN THEM under a thin bridge near their tops.
// `open`: the pair STANDS OPEN on its lenses' lower rims and the tips of its two arms, the lenses nearly upright (they
// lean back 14 degrees), the arms 12.5 cm straight back and down to the cloth; else it lies FOLDED on its two folded
// arms, the lenses leaning well back (38 degrees up from the cloth).)
function shadesInto(G, open) {
  const tau = (open ? 76 : 38) * DEG, ct = Math.cos(tau), st = Math.sin(tau), y0 = open ? 0.003 : 0.011, z0 = open ? 0 : 0.02, P = (u, v) => [u, y0 + v * st, z0 - v * ct], n = [0, ct, st], hw = 0.028, hh = 0.023, k = 0.55;
  for (const sx of [-1, 1]) {
    const cx = sx * 0.039;
    fanInto(G, [[-hw * k, -hh], [hw * k, -hh], [hw, -hh * k], [hw, hh * k], [hw * k, hh], [-hw * k, hh], [-hw, hh * k], [-hw, -hh * k]].map(([u, v]) => P(cx + u, v + hh)), n, T1.black, MATT);
    if (open) {
      // an arm: a flat band on edge and its upper face, from the hinge at the lens's upper outer corner to its tip on the cloth
      const h = P(sx * 0.07, 2 * hh - 0.01), t = [sx * 0.067, 0.003, h[2] - 0.125], in6 = -sx * 0.006;
      G.quad([h[0], h[1] + 0.006, h[2]], [t[0], t[1] + 0.009, t[2]], t, [h[0], h[1] - 0.006, h[2]], T1.black, MATT);
      G.quad([h[0], h[1] + 0.006, h[2]], [h[0] + in6, h[1] + 0.006, h[2]], [t[0] + in6, t[1] + 0.009, t[2]], [t[0], t[1] + 0.009, t[2]], T1.black, MATT);
    }
  }
  if (!open) for (const sg of [-1, 1]) G.box(0, 0.006, -0.008 + sg * 0.005, 0.13, 0.01, 0.007, sg * 0.07, T1.black, MATT);
  G.quad(P(-0.0125, 0.027), P(0.0125, 0.027), P(0.0125, 0.034), P(-0.0125, 0.034), T1.black, MATT);
}
// A TALL DRINK at (x, z) with a slice of lemon on its rim
function drinkInto(G, x, z, turn) {
  const y = 0.762, glass = [0.78, 0.86, 0.84];
  G.lathe(x, z, [[0.028, y], [0.031, y + 0.125], [0.033, y + 0.168]], { seg: 8, color: (r, yy) => (yy > y + 0.13 ? glass : T1.drink), surf: S_.plain(0.9) });
  G.lathe(x, z, [[0.001, y + 0.128], [0.031, y + 0.128]], { seg: 8, color: mul3(T1.drink, 1.1), surf: S_.plain(0.9), flat: true });
  const ct = Math.cos(turn), st = Math.sin(turn), cxl = x + 0.033 * st, czl = z + 0.033 * ct, cy = y + 0.178, pts = [];
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; pts.push([cxl + 0.031 * Math.cos(a) * st, cy + 0.031 * Math.sin(a), czl + 0.031 * Math.cos(a) * ct]); }
  fanInto(G, pts, [ct, 0, -st], T1.lemon, S_.plain(0.3), [cxl, cy, czl], hexLin('#f7eeb0'));
}
// A LARGE GOLD BRICK lying on the cloth at (x, z), its length across the bearing `turn`
function brickInto(G, x, z, turn) {
  const B = makeBuilder(), a = 0.165, b = 0.075, a1 = 0.138, b1 = 0.05, h = 0.092, s = S_.metal(0.62), col = T1.bar;
  const lo = [[-a, 0, -b], [a, 0, -b], [a, 0, b], [-a, 0, b]], hi = [[-a1, h, -b1], [a1, h, -b1], [a1, h, b1], [-a1, h, b1]];
  B.quad(hi[3], hi[2], hi[1], hi[0], mul3(col, 1.1), s);
  for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; B.quad(lo[i], lo[j], hi[j], hi[i], mul3(col, i % 2 ? 0.8 : 0.95), s); }
  G.add(B, x, 0.762, z, turn);
}
// A WORN SATCHEL on a chair's seat, leaning on its back, its strap over the back; a second towel's end hangs out of it
// (the chair's own frame; the satchel's front is turned to the table, -z)
// (round t2) ITS MOUTH stands open at the end away from the towel (the top flap lies over the rest), and HALF OUT OF IT
// A FLAT DARK SLAB the size of a large paperback (22 by 14 cm, 1.6 cm thick), leaning back a little, its face to the
// table: one dark screen of plain glass over a field of small plain square buttons of dark grey (four across; two rows
// of them show above the mouth, four more are in the bag; dark on dark, so that far off they are a quiet grain and
// never a row of pale marks that could be taken for letters). No cover, no hinge, no light, no line, no mark: nothing
// is lettered on it.
function satchelInto(G, col2, stripe) {
  const L = T1.leather, lt = mul3(L, 1.3), y0 = 0.487, s = S_.plain(0.18);
  G.box(0, y0 + 0.14, 0.075, 0.36, 0.28, 0.13, 0, L, s);
  G.box(0.0, y0 + 0.2, 0.004, 0.372, 0.17, 0.014, 0, lt, s);
  G.box(-0.078, y0 + 0.287, 0.07, 0.216, 0.016, 0.145, 0, lt, s);
  G.quad([0.032, y0 + 0.2812, 0.016], [0.178, y0 + 0.2812, 0.016], [0.178, y0 + 0.2812, 0.134], [0.032, y0 + 0.2812, 0.134], mul3(L, 0.16), MATT);
  {
    const S = makeBuilder(), hw = 0.07, hl = 0.11, zf = -0.0085, glass = S_.plain(0.85);
    S.box(0, 0, 0, 2 * hw, 2 * hl, 0.016, 0, T1.slab, S_.plain(0.3));
    S.quad([-hw + 0.01, 0.045, zf], [hw - 0.01, 0.045, zf], [hw - 0.01, hl - 0.01, zf], [-hw + 0.01, hl - 0.01, zf], T1.screen, glass);
    for (let r = 0; r < 6; r++) for (let k = 0; k < 4; k++) { const u = (k - 1.5) * 0.03, v = 0.028 - r * 0.0225; S.quad([u - 0.011, v - 0.0075, zf], [u + 0.011, v - 0.0075, zf], [u + 0.011, v + 0.0075, zf], [u - 0.011, v + 0.0075, zf], T1.key, S_.plain(0.25)); }
    G.addMat(S, new THREE.Matrix4().makeTranslation(0.106, y0 + 0.285, 0.072).multiply(new THREE.Matrix4().makeRotationX(0.3)).multiply(new THREE.Matrix4().makeRotationZ(-0.12)));
  }
  G.box(0.1, y0 + 0.14, -0.006, 0.032, 0.045, 0.01, 0, C.brass, S_.metal(0.8));
  G.tube([[-0.185, y0 + 0.24, 0.08], [-0.21, 0.9, 0.17], [-0.12, 1.035, 0.2], [0.12, 1.035, 0.2], [0.21, 0.9, 0.17], [0.185, y0 + 0.24, 0.08]], 0.012, { sides: 3, color: mul3(L, 0.75), surf: s });
  // the towel's end: out from under the flap at one side, over the satchel's edge and down
  const xs = [-0.3, -0.24, -0.17, -0.1], path = [[y0 + 0.3, 0.06], [y0 + 0.31, -0.012], [y0 + 0.2, -0.03], [y0 + 0.06, -0.034], [y0 + 0.0, -0.036], [y0 - 0.04, -0.036]];
  clothInto(G, path.map(([y, z], j) => xs.map((x, i) => [x + 0.02 * j * 0.3, y - 0.01 * i * j * 0.4, z - 0.006 * Math.sin(i * 2 + j)])), [col2, mul3(col2, 0.92), col2, stripe, mul3(col2, 0.9)]);
}
// A BOWL OF PETUNIAS at (x, z): a low glazed bowl, a mound of leaves, purple and white trumpet flowers
// (ROUND t3: the white read as white marks on a dark mound, and the purple hardly at all. Now THIRTEEN LARGER FLOWERS
// (10 cm across, where seventeen of 7 cm were), EACH A TRUMPET OF FIVE LOBES sunk to a throat, and THE WHITE IS PART OF
// EVERY FLOWER: nine are purple with a white throat that runs out as a pale star to the five notches between the
// lobes; four are white with a purple throat. The purple is a lighter one (the palette says why). They stand a
// little proud of the leaves and reach 7 mm further from the bowl's middle than the old ones did (4 cm clear of the
// table's own bottle).)
function petuniasInto(G, x, z) {
  const y = 0.762, sf = [0, 0.2, 0, 0.004], mixPW = [0, 1, 2].map((m) => lerp(T1.petP[m], T1.petW[m], 0.5));
  G.lathe(x, z, [[0.05, y + 0.002], [0.115, y + 0.03], [0.13, y + 0.07]], { seg: 8, color: GLAZES[3], surf: S_.plain(0.7) });
  G.ball(x, y + 0.085, z, 0.118, { rings: 3, seg: 7, squash: 0.62, color: mul3(C.palm, 0.85), surf: [5, 0.1, 0, 0] });
  for (let i = 0; i < 13; i++) {
    const el = lerp(22, 82, (i * 0.618 + 0.3) % 1) * DEG, az = i * 2.39996, d = [Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az)], white = i % 3 === 1;
    const lobe = white ? T1.petW : T1.petP, notch = white ? mul3(T1.petW, 0.9) : mixPW, throat = white ? T1.petP : T1.petW;
    const c = [x + d[0] * 0.128, y + 0.085 + d[1] * 0.09, z + d[2] * 0.128], e1 = [d[2], 0, -d[0]], l1 = Math.hypot(e1[0], e1[2]) || 1, a1 = [e1[0] / l1, 0, e1[2] / l1], a2 = [d[1] * a1[2], d[2] * a1[0] - d[0] * a1[2], -d[1] * a1[0]], ids = [];
    const mid = G.vert([c[0] - d[0] * 0.032, c[1] - d[1] * 0.032, c[2] - d[2] * 0.032], d, throat, sf);
    for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2 + i, rr = k % 2 ? 0.037 : 0.05; ids.push(G.vert([c[0] + (a1[0] * Math.cos(a) + a2[0] * Math.sin(a)) * rr, c[1] + a2[1] * Math.sin(a) * rr, c[2] + (a1[2] * Math.cos(a) + a2[2] * Math.sin(a)) * rr], d, k % 2 ? notch : lobe, sf)); }
    for (let k = 0; k < 10; k++) G.tri(mid, ids[k], ids[(k + 1) % 10]);
  }
}
// (round t2) A PINT OF BITTER at (x, z): a plain straight-sided pint glass (15.6 cm high, widening a little to its
// rim), the beer amber brown (not black: the book guard's word of 21:10 on 10-11, a near-black pint with a deep cream
// head is a stout's look), a thin pale head on it
function pintInto(G, x, z) {
  const y = 0.762;
  G.lathe(x, z, [[0.031, y], [0.0425, y + 0.149]], { seg: 8, color: T1.beer, surf: S_.plain(0.9) });
  G.lathe(x, z, [[0.0425, y + 0.149], [0.043, y + 0.156]], { seg: 8, color: T1.head, surf: S_.plain(0.3) });
  G.lathe(x, z, [[0.001, y + 0.154], [0.0425, y + 0.154]], { seg: 8, color: T1.head, surf: S_.plain(0.3), flat: true });
}
// (round t2) A SMALL PLAIN PACKET lying on the cloth at (x, z): a little pillow of one plain colour, pinched flat along
// its edges, nothing printed on it; `torn`: torn open and emptied, lying flat, the bare foil of its inside at the torn end
function packetInto(G, x, z, turn, torn) {
  const B = makeBuilder(), col = T1.packet, s = S_.plain(0.45);
  if (torn) {
    const pts = [[-0.06, -0.036], [0.034, -0.038], [0.048, -0.02], [0.036, -0.004], [0.052, 0.013], [0.038, 0.037], [-0.06, 0.035]];
    fanInto(B, pts.map(([u, v]) => [u, 0.003, v]), [0, 1, 0], col, s);
    fanInto(B, [[0.02, -0.032], [0.034, -0.038], [0.048, -0.02], [0.036, -0.004], [0.052, 0.013], [0.038, 0.037], [0.024, 0.032]].map(([u, v]) => [u, 0.004, v]), [0, 1, 0], T1.foil, S_.metal(0.6));
  } else {
    const a = 0.056, b = 0.035, a1 = 0.034, b1 = 0.022, h = 0.026, lo = [[-a, 0.004, -b], [a, 0.004, -b], [a, 0.004, b], [-a, 0.004, b]], hi = [[-a1, h, -b1], [a1, h, -b1], [a1, h, b1], [-a1, h, b1]];
    B.quad(hi[3], hi[2], hi[1], hi[0], mul3(col, 1.12), s);
    for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; B.quad(lo[i], lo[j], hi[j], hi[i], mul3(col, i % 2 ? 0.8 : 0.95), s); }
  }
  G.add(B, x, 0.762, z, turn);
}
// (round t2) ONE SMALL ICED CAKE alone in the middle of a LARGE plain plate at (x, z): the plate 32 cm across, of one
// plain deep blue glaze (so that it shows on any of the four cloths); the cake 7 cm across, plain white icing over it
function cakeInto(G, x, z) {
  const y = 0.762;
  G.lathe(x, z, [[0.001, y + 0.003], [0.105, y + 0.003], [0.16, y + 0.018]], { seg: 14, color: T1.china, surf: S_.plain(0.75), flat: true });
  G.lathe(x, z, [[0.034, y + 0.004], [0.034, y + 0.03]], { seg: 8, color: T1.sponge, surf: S_.plain(0.2) });
  G.lathe(x, z, [[0.036, y + 0.024], [0.036, y + 0.041], [0.027, y + 0.051], [0.001, y + 0.053]], { seg: 8, color: T1.icing, surf: S_.plain(0.45) });
}
// THE TABLE'S NUMBER (its own frame: its face to +z): a small brass plate on a stem, the numerals 4 and 2 as plain bold
// strokes on its face. THE ONLY WRITING IN THE WORLD: made only where the world's TABLE_NUMBER is true.
function numberInto(G) {
  const br = C.brass, s = S_.metal(0.8), ink = [0.012, 0.01, 0.008], w = 0.09, h = 0.06, yc = 0.265, lean = 0.16;
  G.lathe(0, 0, [[0.04, 0], [0.034, 0.012], [0.007, 0.02], [0.006, 0.21]], { seg: 6, color: br, surf: s });
  const P = (u, v, o) => [u, yc + v, o - v * lean];
  G.quad(P(-w, -h, 0.004), P(w, -h, 0.004), P(w, h, 0.004), P(-w, h, 0.004), br, s);
  G.quad(P(w, -h, -0.004), P(-w, -h, -0.004), P(-w, h, -0.004), P(w, h, -0.004), mul3(br, 0.8), s);
  const bar = (u0, v0, u1, v1) => G.quad(P(u0, v0, 0.0055), P(u1, v0, 0.0055), P(u1, v1, 0.0055), P(u0, v1, 0.0055), ink, MATT);
  const dw = 0.026, dh = 0.041, t = 0.0115, a = -0.042, b = 0.042;
  bar(a + dw - t, -dh, a + dw, dh); bar(a - dw, -t / 2, a - dw + t, dh); bar(a - dw, -t / 2 - 0.004, a + dw, t / 2 - 0.004);
  bar(b - dw, dh - t, b + dw, dh); bar(b + dw - t, 0, b + dw, dh); bar(b - dw, -t / 2, b + dw, t / 2); bar(b - dw, -dh, b - dw + t, 0); bar(b - dw, -dh, b + dw, -dh + t);
}
// THE ONE SMALL YELLOW FISH (its own mesh: it swims slow rounds about the bowl's upright axis on the world's clock, as a
// chandelier goes round its rod): a slender body, a tail, a back fin; made `ro` aside of the axis, its head to -z
export function fishGeometry(ro = 0.058) {
  const G = makeBuilder(), col = T1.fish, fin = mul3(T1.fish, 0.8), s = S_.plain(0.5), sw = [0, 0.5, 0, 0.035];
  const N = [ro, 0, -0.04], T = [ro, 0.013, -0.01], B = [ro, -0.012, -0.01], Lf = [ro - 0.008, 0, -0.008], Rt = [ro + 0.008, 0, -0.008], R = [ro, 0, 0.028];
  const tri = (a, b, c, color, sa = s, sb = s, sc = s) => { const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2], n = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx], l = Math.hypot(n[0], n[1], n[2]) || 1; G.tri(G.vert(a, [n[0] / l, n[1] / l, n[2] / l], color, sa), G.vert(b, [n[0] / l, n[1] / l, n[2] / l], color, sb), G.vert(c, [n[0] / l, n[1] / l, n[2] / l], color, sc)); };
  for (const [a, b] of [[T, Rt], [Rt, B], [B, Lf], [Lf, T]]) { tri(N, a, b, col); tri(R, b, a, col); }
  tri(R, [ro, 0.018, 0.05], [ro, -0.018, 0.05], fin, s, sw, sw);
  tri([ro, 0.012, -0.014], [ro, 0.026, 0.004], [ro, 0.007, 0.012], fin);
  return G;
}

// ALL THAT THE PARTY LEFT, in the table's own frame (the table's own cloth, cup and settings are the room's and stand as
// they are: every thing here lies clear of them). p: the plan's party; number: is the table's number made.
// The places by the bearing N that is turned to the line and the hand c the lens comes from: place 1 (N + 45c): the
// towel and the gown on its chair, the tea; place 2 (N - 45c): two pairs of sunglasses; between them toward N the gold
// brick with the tall drink beside it, the bowl with its fish, the number at the edge; place 3 (N + 135c): the satchel
// on its chair; the petunias beside the candle. Returns the bowl's and the cup's places in the table's frame.
// (Round t2) ON THE FREE QUARTER OF THE CLOTH, BY PLACE 4 (N - 135c, the free place): SIX PINTS OF AMBER BROWN BITTER in one
// straight row along the table's edge, from before the near edge of that place's cover on toward place 2 (the row's
// middle at N - 100c, 0.7 m from the table's middle, a glass every 9.4 cm), and four small plain packets on the cloth
// beside the row: two before it, two past its end toward place 2, one of these torn open and flat. ONE SMALL ICED
// CAKE alone on a large plain plate at the table's edge between places 1 and 3 (N + 94c, 0.62 m out: the one clear
// stretch of cloth there that takes a plate of its size). WHY THE ROW IS NOT STRAIGHT BEFORE THE FOURTH COVER, AND
// THE CAKE NOT AT THE FAR EDGE: the candle's glow is a dab of light at the table's middle, and what stands beyond it
// from the eye is seen through it; place 4 lies straight across the candle from the side the line comes by, so a row
// there is washed out for the whole of the approach (tried at N - 135c and seen: six pale caps in the glare). Like
// every thing round t1 laid on this table, these keep toward the part of the cloth that is turned to the line: BY
// THE TABLE'S OWN FRAME (N and c), the same for every visitor; nothing reads the lens.
// Each lies clear of the table's own covers, glasses, bottle and dish in every state of its dinner and on either hand,
// and of round t1's things (measured: 9 mm and more).
export function partyInto(G, p, number) {
  const B = makeBuilder(), N = PARTY.N, c = p.hand, ch = p.t.chairs, onChair = (k, make) => { const S = makeBuilder(); make(S); const a = ch[k][0] * DEG; B.add(S, Math.sin(a) * ch[k][1], 0, Math.cos(a) * ch[k][1], ch[k][2] * DEG); };
  onChair(0, (S) => { towelInto(S, T1.towel, T1.stripe); gownInto(S, -c, T1.gown); });
  onChair(2, (S) => satchelInto(S, T1.towel2, T1.stripe));
  const cup = PB(N + c * 45, 0.715), pot = PB(N + c * 59.5, 0.7);
  teaInto(B, cup[0], cup[1], pot[0], pot[1], (N + c * 59.5 + c * 90) * DEG);
  // (round t3) the two pairs of sunglasses at place 2, on the cloth between that cover and the table's edge, 6 cm of
  // cloth between them: [bearing from N away from c, distance of its lenses' line, the bearing it looks along, open]
  for (const [g, r, look, open] of [[36, 0.76, 15, 1], [55, 0.725, 35, 0]]) { const q = PB(N - c * g, r), S = makeBuilder(); shadesInto(S, !!open); B.add(S, q[0], 0.762, q[1], (N - c * look) * DEG); }
  const dr = PB(N - c * 8, 0.46), bk = PB(N - c * 16.35, 0.62), bowl = PB(N + c * 5.65, 0.33), pet = PB(98, 0.33), num = PB(N, 0.75);
  drinkInto(B, dr[0], dr[1], (N - c * 8 + 150) * DEG);
  brickInto(B, bk[0], bk[1], (N - c * 16.35) * DEG);
  petuniasInto(B, pet[0], pet[1]);
  // the bowl's foot and its lip of glass (its water is the water's own mesh; its fish its own)
  B.lathe(bowl[0], bowl[1], [[0.001, 0.764], [0.05, 0.764], [0.056, 0.776]], { seg: 8, color: [0.7, 0.8, 0.78], surf: S_.plain(0.9), flat: true });
  B.lathe(bowl[0], bowl[1], [[0.069, 0.955], [0.076, 0.966], [0.07, 0.976]], { seg: 10, color: [0.82, 0.9, 0.88], surf: S_.plain(0.95) });
  if (number) { const S = makeBuilder(); numberInto(S); B.add(S, num[0], 0.762, num[1], N * DEG); }
  // (round t2) the six pints, the packets beside them, the cake on its plate
  { const b4 = N - c * 100, mid = PB(b4, 0.7), ax = Math.cos(b4 * DEG), az = -Math.sin(b4 * DEG);
    for (let i = 0; i < 6; i++) pintInto(B, mid[0] + ax * (i - 2.5) * 0.094, mid[1] + az * (i - 2.5) * 0.094);
    for (const [g, r, tw, torn] of [[-93, 0.575, 0.15, 0], [-105.5, 0.572, -0.2, 0], [-73.5, 0.672, 2.3, 0], [-66, 0.6, 0.6, 1]]) { const q = PB(N + c * g, r); packetInto(B, q[0], q[1], (N + c * g) * DEG + tw, torn); }
    const ck = PB(N + c * 94, 0.62); cakeInto(B, ck[0], ck[1]); }
  G.add(B, p.x, p.y, p.z, p.rot * DEG);
  return { bowl: p.toWorld(bowl[0], 0.762 + 0.108, bowl[1]), cup: p.toWorld(cup[0], 0.762 + 0.07, cup[1]), triangles: B.triangles };
}

// A PARKED CRAFT: a hull lofted along its length (local z; its bow at -len / 2), its foot on the ground at y 0.
// section(t): [half breadth, half height, the middle's height] at t from bow (0) to stern (1); pw: how square its section is
function hullInto(G, o, section, color, surf, pw = 0.7, ns = 14, nr = 12) {
  const base = G.pos.length / 3, colOf = typeof color === 'function' ? color : () => color;
  for (let j = 0; j < ns; j++) {
    const t = j / (ns - 1), z = (t - 0.5) * o.len, [w, h, yc] = section(t);
    for (let i = 0; i <= nr; i++) { const a = i / nr * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a), x = w * Math.sign(ca) * Math.pow(Math.abs(ca), pw), y = h * Math.sign(sa) * Math.pow(Math.abs(sa), pw), nl = Math.hypot(ca / Math.max(w, 0.05), sa / Math.max(h, 0.05)) || 1; G.vert([x, yc + y, z], [ca / Math.max(w, 0.05) / nl, sa / Math.max(h, 0.05) / nl, 0], colOf(t, sa), surf); }
  }
  for (let j = 0; j < ns - 1; j++) for (let i = 0; i < nr; i++) { const q = base + j * (nr + 1) + i; G.tri(q, q + 1, q + nr + 1); G.tri(q + 1, q + nr + 2, q + nr + 1); }
  for (const j of [0, ns - 1]) { const t = j / (ns - 1), z = (t - 0.5) * o.len, [w, h, yc] = section(t), pts = []; for (let i = 0; i < nr; i++) { const a = i / nr * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a); pts.push([w * Math.sign(ca) * Math.pow(Math.abs(ca), pw), yc + h * Math.sign(sa) * Math.pow(Math.abs(sa), pw), z]); } fanInto(G, pts, [0, 0, j ? 1 : -1], colOf(t, 0), surf); }
}
// THE BLACK SHIP: one long low hull, matt black all over: no light, no window, no mark, no shine (colour nought, gloss
// nought: nothing of the room's or the suns' light comes back off it), a low fin along its back, three pairs of feet.
// THE OTHER CRAFT: a blunt barrel on four feet and a low wedge with two fins, dull and unlit, their own plain shapes.
export function craftInto(G, q) {
  const B = makeBuilder(), sm = (a, b, x) => smoothstep(a, b, x);
  if (q.sort === 'black') {
    const sec = (t) => { const w = q.beam / 2 * Math.pow(sm(0, 0.62, t), 0.75) * (1 - 0.16 * sm(0.62, 1, t)) + 0.12, h = q.high / 2 * (0.1 + 0.9 * Math.pow(sm(0, 0.72, t), 0.85)) * (1 - 0.1 * sm(0.8, 1, t)); return [w, h, 0.75 + h]; };
    hullInto(B, q, sec, T1.black, MATT, 0.62, 16, 12);
    const fin = []; for (let j = 0; j <= 6; j++) { const t = lerp(0.5, 0.985, j / 6), s = sec(t); fin.push([t, 0.75 + 2 * s[1] - 0.15, 0.75 + 2 * s[1] + 1.3 * Math.pow(j / 6, 1.3)]); }
    for (let j = 0; j < 6; j++) { const a = fin[j], b = fin[j + 1]; B.quad([0, a[1], (a[0] - 0.5) * q.len], [0, b[1], (b[0] - 0.5) * q.len], [0, b[2], (b[0] - 0.5) * q.len], [0, a[2], (a[0] - 0.5) * q.len], T1.black, MATT); }
    for (const t of [0.3, 0.6, 0.88]) for (const sx of [-1, 1]) B.box(sx * sec(t)[0] * 0.55, -0.2, (t - 0.5) * q.len, 1.3, 2.4, 2.6, 0, T1.black, MATT);
  } else if (q.sort === 'barrel') {
    const col = hexLin('#3f3632'), sec = (t) => { const k = Math.sqrt(Math.max(0.02, 1 - Math.pow(2 * t - 1, 2) * 0.9)); return [q.beam / 2 * k, (q.high - 1.1) / 2 * k, 1.1 + (q.high - 1.1) / 2]; };
    hullInto(B, q, sec, (t) => mul3(col, t > 0.42 && t < 0.56 ? 0.6 : 1), S_.plain(0.12), 0.85, 10, 10);
    for (const t of [0.3, 0.7]) for (const sx of [-1, 1]) B.box(sx * q.beam * 0.3, 0.3, (t - 0.5) * q.len, 0.5, 2.2, 0.5, 0, mul3(col, 0.6), S_.plain(0.1));
  } else {
    const col = hexLin('#33393c'), sec = (t) => { const w = 0.4 + (q.beam / 2 - 0.4) * Math.pow(t, 0.9), h = 0.25 + (q.high / 2 - 0.5) * Math.pow(t, 0.7); return [w, h, 0.9 + h]; };
    hullInto(B, q, sec, col, S_.plain(0.12), 0.5, 8, 10);
    for (const sx of [-1, 1]) { const x = sx * q.beam * 0.36, z0 = q.len * 0.2, z1 = q.len * 0.5, y0 = 0.9 + q.high - 1.2; B.quad([x, y0, z0], [x, y0, z1], [x * 1.12, y0 + 2.6, z1], [x * 1.12, y0 + 1.7, z0 + q.len * 0.18], mul3(col, 0.8), S_.plain(0.1)); }
    for (const t of [0.35, 0.85]) for (const sx of [-1, 1]) B.box(sx * q.beam * 0.25 * (0.4 + t), 0.2, (t - 0.5) * q.len, 0.4, 1.8, 0.9, 0, mul3(col, 0.6), S_.plain(0.1));
  }
  G.add(B, q.x, q.y, q.z, q.turn * DEG);
  return B.triangles;
}

// THE DRIFT OF OLD SHOES: each a plain low form in its own frame (its toe to +x), set down by the plan: low shoes, ankle
// boots, tall boots, slippers; dull colours; upright, on its side or toppled; half sunk in the dust
const SHOE_COLS = ['#7a5a3c', '#3a3432', '#8a7256', '#5a626a', '#b4ab98', '#7a7455', '#a08c70', '#34404e'].map(hexLin);
export function shoeInto(G, q, M) {
  const B = makeBuilder(), s = q.size, L = 0.3 * s, W = 0.11 * s, col = SHOE_COLS[q.col], dk = mul3(col, 0.45), sf = S_.plain(0.15), hw = W * 0.46;
  // a block whose top slopes from ya (at xa) to yb (at xb), over the sole
  const block = (xa, xb, ya, yb, c) => {
    const a = [[xa, 0.03, -hw], [xb, 0.03, -hw], [xb, 0.03, hw], [xa, 0.03, hw]], b = [[xa, ya, -hw], [xb, yb, -hw], [xb, yb, hw], [xa, ya, hw]];
    B.quad(b[3], b[2], b[1], b[0], c, sf); for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; B.quad(a[i], a[j], b[j], b[i], mul3(c, i % 2 ? 0.85 : 0.7), sf); }
  };
  B.box(0, 0.015, 0, L, 0.03, W, 0, dk, sf);
  if (q.kind === 3) block(0, L * 0.47, 0.085 * s, 0.05 * s, col);
  else {
    const hq = (q.kind === 0 ? 0.095 : 0.11) * s;
    block(-L * 0.04, L * 0.48, hq, 0.05 * s, col);
    block(-L * 0.48, -L * 0.04, hq, hq, col);
    B.quad([-L * 0.42, hq + 0.002, -hw * 0.7], [-L * 0.1, hq + 0.002, -hw * 0.7], [-L * 0.1, hq + 0.002, hw * 0.7], [-L * 0.42, hq + 0.002, hw * 0.7], mul3(col, 0.2), sf);
    if (q.kind > 0) { const H = (q.kind === 1 ? 0.1 : 0.27) * s, lean = q.kind === 2 ? (q.lie - 0.5) * 0.5 : 0, x0 = -L * 0.47, x1 = -L * 0.1, a = [[x0, hq, -hw * 0.9], [x1, hq, -hw * 0.9], [x1, hq, hw * 0.9], [x0, hq, hw * 0.9]], b = a.map((p) => [p[0] + lean * H, hq + H, p[2] + lean * H * 0.6]);
      for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; B.quad(a[i], a[j], b[j], b[i], mul3(col, i % 2 ? 0.9 : 0.75), sf); } B.quad(b[3], b[2], b[1], b[0], mul3(col, 0.2), sf); }
  }
  G.addMat(B, M);
  return B.triangles;
}

// THE LONG TABLE OF THE GALLERY, in its own frame (its length along x, 18.6 m; +z the pier's right hand): a cloth of wine
// red with a runner of old gold, five great candle cups on copper stands, brass chargers and goblets at fourteen
// places a side, covered dishes, fruit; a bench of a hall's size along each side (h.inner: the bench toward the pier's
// middle). ROUND t2: NO drinking horn and NO hammer (both taken out). In their place, what a party of that kind sets
// down when it sits to eat: TWELVE PLAIN ROUND HELMETS, eight on the cloth along the runner (where the horns were) and
// four on the benches (one where the hammer lay), each a simple iron cap of a hall's size (0.4 m across its rim): a
// plain dome with a narrow rim, no horn, no wing, no crest, no face guard; ten stand dome up, two lie tipped over,
// hollow side showing; and PLAIN DRINKING GLASSES along both sides, one by a cover at 24 of the 28 places: tall plain
// glasses, most of them part full of a pale or an amber drink, four standing empty. (ROUND t3: the glasses are
// quieter and no longer one even row: smaller, dim, four pushed beside a neighbour's, three of the empty ones lying:
// their own remark below has it.)
// Returns the cups' and the dishes' places in the world (for their flames and their steam).
export function hallInto(G, h) {
  const B = makeBuilder(), hx = h.len / 2, hz = 0.75, Y = 0.8, wood = mul3(C.wood, 1.5), wine = T1.wine, gold = mul3(C.gold, 0.9), cupsX = [-7.4, -3.7, 0, 3.7, 7.4], dishX = [-5.55, 1.85, 5.55];
  const pool = (x, z) => { let p = 0; for (const cx of cupsX) p = Math.max(p, Math.pow(clamp(1 - Math.hypot(x - cx, z) / 1.9, 0, 1), 1.2)); return p; };
  // (the pool about a great cup is painted three times as strong as an instanced table's: this cloth has no instance to tint it)
  const zs = [-hz, -0.24, 0.24, hz], nx = 30;
  for (let k = 0; k < 3; k++) for (let i = 0; i < nx; i++) {
    const x0 = lerp(-hx, hx, i / nx), x1 = lerp(-hx, hx, (i + 1) / nx), z0 = zs[k], z1 = zs[k + 1], col = k === 1 ? gold : wine, ids = [[x0, z0], [x1, z0], [x1, z1], [x0, z1]].map(([x, z]) => B.vert([x, Y, z], [0, 1, 0], col, [4, 0.05, 3.2 * pool(x, z), 0]));
    B.tri(ids[0], ids[3], ids[1]); B.tri(ids[1], ids[3], ids[2]);
  }
  for (const [ax, az, bx, bz] of [[-hx, -hz, hx, -hz], [hx, -hz, hx, hz], [hx, hz, -hx, hz], [-hx, hz, -hx, -hz]]) { B.quad([ax, Y, az], [bx, Y, bz], [bx * 1.004, 0.14, bz * 1.07], [ax * 1.004, 0.14, az * 1.07], mul3(wine, 0.7), [4, 0.05, 0.05, 0]); B.quad([ax, Y - 0.1, az * 1.012], [bx, Y - 0.1, bz * 1.012], [bx, Y - 0.16, bz * 1.02], [ax, Y - 0.16, az * 1.02], gold, [4, 0.05, 0.05, 0]); }
  for (const x of cupsX) { B.lathe(x, 0, [[0.24, Y + 0.005], [0.08, Y + 0.08], [0.07, Y + 0.24], [0.22, Y + 0.3]], { seg: 8, color: C.copper, surf: S_.metal(0.8) }); B.lathe(x, 0, [[0.14, Y + 0.3], [0.27, Y + 0.46], [0.24, Y + 0.64]], { seg: 8, color: mul3(C.amber, 1.35), surf: [6, 0, 1.15, 0] }); }
  for (const x of dishX) dishInto(B, x, 0, Y + 0.004, 0.27);
  for (let i = 0; i < 14; i++) for (const sz of [-1, 1]) {
    const x = -8.45 + 1.3 * i, z = sz * 0.5;
    B.lathe(x, z, [[0.001, Y + 0.012], [0.19, Y + 0.02]], { seg: 6, color: C.brass, surf: S_.metal(0.8), flat: true });
    B.lathe(x, z, [[0.001, Y + 0.026], [0.125, Y + 0.03]], { seg: 6, color: C.ivory, surf: S_.plain(0.7), flat: true });
    B.lathe(x + 0.27, z - sz * 0.13, [[0.05, Y + 0.004], [0.012, Y + 0.06], [0.05, Y + 0.12], [0.046, Y + 0.2]], { seg: 4, color: C.brass, surf: S_.metal(0.85) });
  }
  for (const x of [-1.85, -8.5]) { B.lathe(x, 0, [[0.1, Y + 0.004], [0.3, Y + 0.12]], { seg: 7, color: C.brass, surf: S_.metal(0.8), flat: true }); for (let k = 0; k < 6; k++) { const a = k * 1.05; B.ball(x + (k < 5 ? 0.15 * Math.sin(a) : 0), Y + (k < 5 ? 0.16 : 0.27), (k < 5 ? 0.15 * Math.cos(a) : 0), 0.085, { rings: 2, seg: 5, color: [hexLin('#b83a2a'), hexLin('#c98a2a'), hexLin('#6a7a2a')][k % 3], surf: S_.plain(0.5) }); } }
  const M4 = () => new THREE.Matrix4();
  // (round t2) a plain drinking glass by a cover: on the hand of the cover away from its goblet, a little toward the
  // runner. Which glass a place has goes by the place's own number: none at four places, empty at four, the rest part
  // full of a pale or an amber drink, each to its own level
  // (ROUND t3: FROM THE LINE THEY WERE A ROW OF SMALL BRIGHT POSTS, each 16 cm of pale shining glass with a pale drink
  // in most. QUIETER NOW, by the same law of the place's own number, nothing drawn: a glass is a plain tumbler 12.5 cm
  // high; its bare glass is dim (it shows the dark cloth through it) and hardly shines; what is left in it is lower
  // (a seventh to two fifths of the glass) and a shade duller; and they do not stand in one even row any more: of the
  // 24, FOUR have been pushed up beside a neighbouring place's glass (four places have two together, four more none),
  // THREE of the four empty ones LIE ON THEIR SIDES on the cloth, each turned its own way, and one stands empty.)
  const hg = 0.125, rAt = (t) => lerp(0.032, 0.04, t), gs = S_.plain(0.45), y0 = Y + 0.004;
  const tumbler = (x, z, fill, col) => {
    if (fill > 0) { B.lathe(x, z, [[rAt(0), y0], [rAt(fill), y0 + hg * fill]], { seg: 6, color: col, surf: gs }); B.lathe(x, z, [[0.001, y0 + hg * fill], [rAt(fill) * 0.97, y0 + hg * fill]], { seg: 6, color: mul3(col, 1.12), surf: gs, flat: true }); }
    B.lathe(x, z, [[rAt(fill), y0 + hg * fill], [rAt(1), y0 + hg]], { seg: 6, color: T1.glassDim, surf: gs });
  };
  // an empty glass in its own frame (its foot on y 0), for the ones that lie: on its side, its rim a little the higher
  const lying = makeBuilder();
  lying.lathe(0, 0, [[rAt(0), 0], [rAt(1), hg]], { seg: 6, color: T1.glassDim, surf: gs });
  lying.lathe(0, 0, [[0.001, 0.003], [rAt(0), 0.003]], { seg: 6, color: mul3(T1.glassDim, 0.8), surf: gs, flat: true });
  for (let i = 0; i < 14; i++) for (const sz of [-1, 1]) {
    const k = (i * 5 + (sz > 0 ? 3 : 0)) % 7, xg = -8.45 + 1.3 * i - 0.25, zg = sz * 0.345;
    if (!k) continue;
    if (k === 5 && !(i === 13 && sz > 0)) B.addMat(lying, M4().makeTranslation(xg + 0.03, y0 + rAt(0), zg).multiply(M4().makeRotationY(0.35 * Math.sin(i * 1.7 + sz))).multiply(M4().makeRotationZ(Math.PI / 2 - 0.064)));
    else tumbler(k === 2 ? xg - 1.3 - 0.095 : xg, zg, k === 5 ? 0 : [0, 0.3, 0.4, 0.24, 0.34, 0, 0.14][k], k < 3 ? mul3(T1.pale, 0.7) : mul3(T1.ale, 0.85));
  }
  // (round t2) a plain round helmet (its own frame: its rim on y 0): an iron cap, a plain dome with a narrow rim
  const helm = makeBuilder();
  helm.lathe(0, 0, [[0.163, 0], [0.166, 0.012], [0.126, 0.034]], { seg: 9, color: mul3(T1.iron, 0.75), surf: S_.metal(0.4) });
  helm.lathe(0, 0, [[0.126, 0.034], [0.124, 0.085], [0.106, 0.135], [0.066, 0.172], [0.001, 0.186]], { seg: 9, color: T1.iron, surf: S_.metal(0.55) });
  // [x, z, the level it is set on, its size, its turn, lying]: set down dome up, or tipped over on its rim and its dome
  const yb = 0.535, zi = h.inner * 1.3;
  for (const [x, z, y, sc, tw, lie] of [[-6.3, 0.03, Y, 1.2, 0.4, 0], [-4.3, 0.06, Y, 1.13, 1.9, 0], [-2.6, -0.04, Y, 1.25, 2.2, 0], [-1.1, -0.06, Y, 1.2, -1.2, 1], [2.75, 0.02, Y, 1.16, 4, 0], [4.75, 0.06, Y, 1.24, 1.8, 0], [6.6, -0.04, Y, 1.2, 1.1, 0], [7.95, -0.05, Y, 1.14, -1.3, 0],
    [-hx + 1.4, zi, yb, 1.24, 0.3, 0], [0.7, zi, yb, 1.15, 2.6, 0], [5.3, zi, yb, 1.2, 1.75, 1], [-3.3, -zi, yb, 1.2, 0.9, 0]]) {
    B.addMat(helm, lie ? M4().makeTranslation(x, y + 0.155 * sc, z).multiply(M4().makeRotationY(tw)).multiply(M4().makeRotationX(2.02)).multiply(M4().makeScale(sc, sc, sc)) : M4().makeTranslation(x, y + 0.004, z).multiply(M4().makeRotationY(tw)).multiply(M4().makeScale(sc, sc, sc)));
  }
  // the benches: a heavy plank on six trestles each
  for (const sz of [-1, 1]) { const zb = sz * 1.3; B.box(0, 0.49, zb, h.len - 0.4, 0.09, 0.5, 0, wood, S_.plain(0.35)); for (let k = 0; k < 6; k++) B.box(lerp(-hx + 0.8, hx - 0.8, k / 5), 0.225, zb, 0.12, 0.45, 0.44, 0, mul3(wood, 0.75), S_.plain(0.3)); B.box(0, 0.2, zb, h.len - 1.8, 0.07, 0.08, 0, mul3(wood, 0.75), S_.plain(0.3)); }
  G.add(B, h.x, h.y, h.z, h.turn);
  const ct = Math.cos(h.turn), st = Math.sin(h.turn), world = (lx, ly) => [h.x + lx * ct, h.y + ly, h.z - lx * st];
  return { cups: cupsX.map((x) => world(x, Y + 0.3)), dishes: dishX.map((x) => world(x, Y + 0.3)), triangles: B.triangles };
}

// THE HOST'S PLACE (round t2): NOTHING STANDS IN IT. The pool of light on the dais's floor is the room's light by place
// (uHost in the room's material) and stays as round t1 laid it; the bare microphone stand of round t1 and its maker are
// taken out.

// A SOFA WHERE NO SOFA SHOULD BE (round t2), in its own frame (its length along x, its front to +z, its feet on y 0)
// and set on its slab by the plan's place and the slab's own plane (q: the plan's sofa): one large DEEP-BUTTONED
// LEATHER SOFA, three seats wide (2.3 m), of worn dark brown leather: rolled arms as high as its back (0.8 m), a back
// buttoned in diamonds (every other point of its face drawn in to a button, the points between them plump), a rolled
// top to the back, three seat cushions worn paler on their crowns, a plain frame, four short turned feet of dark wood.
// Nothing on it, nobody on it, no light of its own: a thing of the ground, in the ground's own mesh.
// (ROUND t3) ITS COVERING IS A PATTERNED CLOTH NOW, not leather: a soft matt cloth of ONE DEEP GROUND COLOUR (a deep
// petrol blue green: the one hue the plain's rose dust, the red suns and the building's own greens do not have) with ONE
// SMALL FIGURE REPEATED all over it in two quieter colours, old gold and a pale grey green: a CURLED DROP of our own
// drawing (a round body drawn out to a point that curls to one side; DROP below: eight corners about a middle, and a
// small plain eye of the other colour inside it), by turns gold with a pale eye and pale with a gold eye, by turns
// curled to the one hand and the other, each turned a little its own way by its number in its row (no stream, no
// draw). EVERY FIGURE IS A FEW FLAT FACES LYING ON THE CLOTH (5 to 15 mm proud of it; no texture, no new material; in
// the ground's own mesh as the sofa is): on the three seats (five on each, the middle one on the cushion's crown), on
// the fronts of the cushions and the rail under them, on the back's buttoned face (one on each plump point between
// four buttons, its faces cut along that point's four ridges so that each lies in one face of the buttoning), on the
// back's rolled top, on the arms' rolls, their outer and inner sides and their fronts, and on the sofa's own back.
// ITS FORM IS AS ROUND t2 MADE IT: three seats, rolled arms, the back deep buttoned in diamonds (a buttoned cloth:
// the buttons are drawn in a shade darker and the points between them a shade paler, less strongly than the leather
// was), the same size, the same four feet, the same place and facing. THE CONDITIONS STAND: it is ONE, it never
// drifts, bobs, fades or moves, nothing is on it or beside it, and it stays outside and off the causeway.
const DROP = [[0, -0.38], [0.3, -0.24], [0.36, 0.06], [0.26, 0.24], [0.4, 0.52], [0.02, 0.44], [-0.3, 0.2], [-0.36, -0.12]], DROP_EYE = [[0.02, -0.2], [0.17, -0.02], [0.05, 0.19], [-0.15, 0]], DROP_MID = [0, 0.02];
export function sofaInto(G, q) {
  const B = makeBuilder(), L = T1.velvet, lt = mul3(L, 1.3), dk = mul3(L, 0.72), s = SOFT, W = q.len, hw = W / 2, AW = 0.27, IW = W - 2 * AW, zb = -0.47, zf = 0.46, zm = (zb + zf) / 2;
  // a flat three-cornered face, each corner its own colour
  const face = (a, b, c, ca, cb, cc) => { const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2], n = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx], l = Math.hypot(n[0], n[1], n[2]) || 1, nn = [n[0] / l, n[1] / l, n[2] / l]; B.tri(B.vert(a, nn, ca, s), B.vert(b, nn, cb, s), B.vert(c, nn, cc, s)); };
  for (const sx of [-1, 1]) for (const z of [zb + 0.09, zf - 0.09]) B.lathe(sx * (hw - 0.11), z, [[0.03, 0], [0.052, 0.04], [0.03, 0.075], [0.056, 0.115]], { seg: 6, color: mul3(C.wood, 1.3), surf: S_.plain(0.45) });
  B.box(0, 0.205, zm, W - 0.03, 0.19, zf - zb, 0, dk, s);
  // the three seat cushions, each crowned and worn paler on its crown
  for (let k = -1; k <= 1; k++) {
    const cx = k * IW / 3, x0 = cx - IW / 6 + 0.008, x1 = cx + IW / 6 - 0.008, z0 = -0.2, z1 = zf + 0.025, yt = 0.425, cr = [(x0 + x1) / 2, yt + 0.04, (z0 + z1) / 2 + 0.04], c4 = [[x0, yt, z0], [x1, yt, z0], [x1, yt, z1], [x0, yt, z1]];
    B.box(cx, (0.3 + yt) / 2, (z0 + z1) / 2, x1 - x0, yt - 0.3, z1 - z0, 0, L, s);
    for (let i = 0; i < 4; i++) face(c4[i], c4[(i + 1) % 4], cr, L, L, lt);
  }
  // the back: its body, its buttoned face leaning back from the seat, its rolled top
  B.box(0, 0.405, zb + 0.1, W - 0.02, 0.59, 0.2, 0, L, s);
  const nx = 16, ny = 3, pt = (i, j) => { const off = (i + j) % 2 ? 0.028 : -0.03, v = j / ny; return [-IW / 2 + IW * i / nx, 0.42 + 0.29 * v + 0.2813 * off, -0.2 - 0.085 * v + 0.9596 * off]; };
  { const deep = mul3(L, 0.62), plump = mul3(L, 1.12), cOf = (i, j) => ((i + j) % 2 ? plump : deep);
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const a = pt(i, j), b = pt(i + 1, j), c = pt(i + 1, j + 1), d = pt(i, j + 1), ca = cOf(i, j), cb = cOf(i + 1, j), cc = cOf(i + 1, j + 1), cd = cOf(i, j + 1);
      if ((i + j) % 2) { face(a, b, d, ca, cb, cd); face(b, c, d, cb, cc, cd); } else { face(a, b, c, ca, cb, cc); face(a, c, d, ca, cc, cd); }
    } }
  B.tube([[-hw + 0.08, 0.705, -0.345], [hw - 0.08, 0.705, -0.345]], 0.1, { sides: 8, color: mul3(L, 1.08), surf: s });
  // the rolled arms, as high as the back; the roll's round end shows at the front, worn paler
  for (const sx of [-1, 1]) {
    const xa = sx * (hw - AW / 2), xr = xa + sx * 0.02, pts = [];
    B.box(xa, 0.385, zm, AW, 0.55, zf - zb, 0, L, s);
    B.tube([[xr, 0.69, zb], [xr, 0.69, zf + 0.03]], 0.115, { sides: 8, color: mul3(L, 1.08), surf: s });
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; pts.push([xr + 0.115 * Math.cos(a), 0.69 + 0.115 * Math.sin(a), zf + 0.03]); }
    fanInto(B, pts, [0, 0, 1], L, s, [xr, 0.69, zf + 0.045], lt);
  }
  // (round t3) THE CLOTH'S FIGURES. figure(at, u0, v0, sc, rot, mir, n, cut): one curled drop lying on a face, its
  // middle at the face's own place (u0, v0). at(u, v, k): where the face's place (u, v) is in the sofa's frame, a little
  // proud of the cloth (k: 0 the drop's body, 1 its eye, which lies over the body); sc: metres to the drop's unit (its
  // length is 0.9 of it); rot, mir: its turn and the hand it curls to; n: its number in its row (odd: a gold body with
  // a pale eye; even: pale with a gold eye); cut: its faces are cut along the lines u = u0 and v = v0 (the four ridges
  // of a plump point of the buttoned back, so that every piece lies in one face of the buttoning)
  const gold = T1.drop, pale = T1.drop2, tw = (n) => 0.45 * Math.sin(n * 2.4 + 0.7);
  const figure = (at, u0, v0, sc, rot, mir, n, cut = false) => {
    const cr = Math.cos(rot) * sc, sr = Math.sin(rot) * sc, T = (p) => { const x = (p[0] - DROP_MID[0]) * mir, y = p[1] - DROP_MID[1]; return [u0 + x * cr - y * sr, v0 + x * sr + y * cr]; };
    const fan = (pts, col, k) => {
      const c3 = at(u0, v0, k), Q = pts.map(T);
      for (let i = 0; i < Q.length; i++) {
        const a = Q[i], b = Q[(i + 1) % Q.length], ts = [0, 1];
        if (cut) for (const ax of [0, 1]) { const o = ax ? v0 : u0, da = a[ax] - o, db = b[ax] - o; if (da * db < -1e-12) ts.push(da / (da - db)); }
        ts.sort((x, y) => x - y);
        for (let m = 0; m < ts.length - 1; m++) face(c3, at(lerp(a[0], b[0], ts[m]), lerp(a[1], b[1], ts[m]), k), at(lerp(a[0], b[0], ts[m + 1]), lerp(a[1], b[1], ts[m + 1]), k), col, col, col);
      }
    };
    fan(DROP, n % 2 ? gold : pale, 0);
    if (cut) fan(DROP_EYE, n % 2 ? pale : gold, 1);
    else { const e = DROP_EYE.map(T).map((p) => at(p[0], p[1], 1)), col = n % 2 ? pale : gold; face(e[0], e[1], e[2], col, col, col); face(e[0], e[2], e[3], col, col, col); }
  };
  // a flat face: its own place o, its two ways eu and ev, its outward way nn
  const flat = (o, eu, ev, nn) => (u, v, k) => { const h = 0.006 + 0.003 * k; return [o[0] + eu[0] * u + ev[0] * v + nn[0] * h, o[1] + eu[1] * u + ev[1] * v + nn[1] * h, o[2] + eu[2] * u + ev[2] * v + nn[2] * h]; };
  // the seats: five on each cushion's top (the top is the lower of its four crowned faces), two on its front
  for (let k = -1; k <= 1; k++) {
    const cx = k * IW / 3, x0 = cx - IW / 6 + 0.008, x1 = cx + IW / 6 - 0.008, z0 = -0.2, z1 = zf + 0.025, ax = (x0 + x1) / 2, az = (z0 + z1) / 2 + 0.04;
    const top = (u, v, kk) => [u, 0.425 + 0.04 * Math.max(-0.2, Math.min((u - x0) / (ax - x0), (x1 - u) / (x1 - ax), (v - z0) / (az - z0), (z1 - v) / (z1 - az))) + 0.007 + 0.003 * kk, v];
    [[0, 0], [-0.155, -0.17], [0.155, -0.17], [-0.155, 0.17], [0.155, 0.17]].forEach(([dx, dz], i) => { const n = (k + 1) * 5 + i; figure(top, ax + dx, az + dz, 0.2, tw(n) + (i % 2 ? 2.4 : -0.5), i % 2 ? 1 : -1, n); });
    const fr = flat([0, 0, z1], [1, 0, 0], [0, 1, 0], [0, 0, 1]);
    for (const sg of [-1, 1]) figure(fr, cx + sg * 0.14, 0.3625, 0.12, sg * 1.5708 + 0.4 * tw(k * 2 + sg + 20), sg, k + (sg > 0 ? 2 : 1));
  }
  // the back's buttoned face: one on each plump point that has its four buttons about it (a place of the face by its
  // metres across and up the lean; the face's own three-cornered faces give the place in space)
  { const dx = IW / nx, dw = Math.hypot(0.29, 0.085) / ny;
    const backAt = (u, w, k) => {
      const a = clamp((u + IW / 2) / dx, 0, nx - 1e-6), b = clamp(w / dw, 0, ny - 1e-6), i = Math.floor(a), j = Math.floor(b), fa = a - i, fb = b - j, A = pt(i, j), Bq = pt(i + 1, j), Cq = pt(i + 1, j + 1), D = pt(i, j + 1), h = 0.005 + 0.003 * k;
      let wa = 0, wb = 0, wc = 0, wd = 0;
      if ((i + j) % 2) { if (fa + fb <= 1) { wa = 1 - fa - fb; wb = fa; wd = fb; } else { wc = fa + fb - 1; wb = 1 - fb; wd = 1 - fa; } }
      else if (fb <= fa) { wa = 1 - fa; wb = fa - fb; wc = fb; } else { wa = 1 - fb; wc = fa; wd = fb - fa; }
      return [A[0] * wa + Bq[0] * wb + Cq[0] * wc + D[0] * wd, A[1] * wa + Bq[1] * wb + Cq[1] * wc + D[1] * wd + 0.2813 * h, A[2] * wa + Bq[2] * wb + Cq[2] * wc + D[2] * wd + 0.9596 * h];
    };
    for (let j = 1; j <= 2; j++) for (let i = 1; i < nx; i++) if ((i + j) % 2) figure(backAt, -IW / 2 + i * dx, j * dw, 0.15, tw(i * 3 + j) + (j === 1 ? 0.3 : 2.8), j === 1 ? 1 : -1, (i >> 1) + j, true);
  }
  // the back's rolled top (a place on it by its metres along and round from its crown toward the front)
  { const r = 0.1, roll = (u, v, k) => { const an = v / r, h = r + 0.011 + 0.003 * k; return [u, 0.705 + h * Math.cos(an), -0.345 + h * Math.sin(an)]; };
    for (let i = 0; i < 8; i++) figure(roll, -0.77 + 0.22 * i, i % 2 ? 0.085 : 0.045, 0.15, (i % 2 ? 1.5708 : -1.5708) + 0.5 * tw(i + 40), i % 2 ? 1 : -1, i); }
  // the arms: five along each roll (by turns toward its inner and its outer side), six on each outer side, two on
  // each inner side over the seat, two on each front
  for (const sx of [-1, 1]) {
    const xa = sx * (hw - AW / 2), xr = xa + sx * 0.02, r = 0.115, roll = (u, v, k) => { const an = v / r, h = r + 0.012 + 0.003 * k; return [xr + sx * h * Math.sin(an), 0.69 + h * Math.cos(an), u]; };
    for (let i = 0; i < 5; i++) figure(roll, zb + 0.13 + 0.185 * i, i % 2 ? 0.07 : -0.06, 0.15, (i % 2 ? 1.5708 : -1.5708) + 0.5 * tw(i + 50), sx * (i % 2 ? 1 : -1), i + (sx > 0 ? 1 : 0));
    const out = flat([sx * hw, 0, 0], [0, 0, 1], [0, 1, 0], [sx, 0, 0]), inn = flat([sx * IW / 2, 0, 0], [0, 0, 1], [0, 1, 0], [-sx, 0, 0]), frn = flat([xa, 0, zf], [1, 0, 0], [0, 1, 0], [0, 0, 1]);
    for (let i = 0; i < 6; i++) figure(out, (i % 2 ? -0.2 : -0.33) + 0.26 * (i >> 1), i % 2 ? 0.25 : 0.46, 0.19, tw(i + 60) + (i % 2 ? 2.6 : -0.4), sx * (i % 2 ? 1 : -1), i + (sx > 0 ? 1 : 0));
    for (let i = 0; i < 2; i++) figure(inn, 0.02 + 0.27 * i, 0.54, 0.13, (i ? 1.5708 : -1.5708) + 0.5 * tw(i + 70), sx, i + (sx > 0 ? 1 : 0));
    for (let i = 0; i < 2; i++) figure(frn, i ? 0.03 : -0.03, i ? 0.24 : 0.44, 0.17, tw(i + 80) + (i ? 2.5 : -0.3), sx * (i ? 1 : -1), i + (sx > 0 ? 1 : 0));
  }
  // the rail under the cushions (eight, lying along it) and the sofa's own back (thirteen, in two rows)
  { const rail = flat([0, 0, zf], [1, 0, 0], [0, 1, 0], [0, 0, 1]), rear = flat([0, 0, zb], [1, 0, 0], [0, 1, 0], [0, 0, -1]);
    for (let i = 0; i < 8; i++) figure(rail, -0.77 + 0.22 * i, 0.205, 0.16, (i % 2 ? 1.5708 : -1.5708) + 0.4 * tw(i + 90), i % 2 ? 1 : -1, i + 1);
    for (let i = 0; i < 13; i++) figure(rear, (i % 2 ? -0.75 : -0.9) + 0.3 * (i >> 1), i % 2 ? 0.28 : 0.52, 0.2, tw(i + 100) + (i % 2 ? 2.7 : -0.3), i % 2 ? 1 : -1, i);
  }
  // onto its slab: its feet on the slab's own plane, its length across the way, its front out along the way
  const nl = Math.hypot(q.tx, 1, q.tz), n = [-q.tx / nl, 1 / nl, -q.tz / nl], xl = Math.hypot(1, q.tx), ex = [1 / xl, q.tx / xl, 0], ez = [ex[1] * n[2] - ex[2] * n[1], ex[2] * n[0] - ex[0] * n[2], ex[0] * n[1] - ex[1] * n[0]];
  G.addMat(B, new THREE.Matrix4().set(ex[0], n[0], ez[0], q.x, ex[1], n[1], ez[1], q.y, ex[2], n[2], ez[2], q.z, 0, 0, 0, 1));
  return B.triangles;
}

// ================================================================ THE WHOLE PLACE
export async function buildHero(ctx, opts = {}) {
  const brk = ctx && ctx.yield ? () => ctx.yield() : async () => {};
  // (the visit's hints: opts.detail and opts.vary as the world reads and hands them; a caller that hands none: ctx's own)
  const detail = opts.detail || (ctx && ctx.quality && ctx.quality.detail) || 1;
  const plan = opts.plan || await planRoom(ctx.seed, opts.vary || (ctx && ctx.vary) || {}, brk);
  const time = { value: 0 }, object = new THREE.Group(), tris = {};
  const room = makeRoomMaterial(plan, { time, side: THREE.DoubleSide });
  const meshOf = async (G, name) => { await brk(); const m = new THREE.Mesh(await G.buildAsync(brk), room); m.name = name; m.frustumCulled = false; tris[name] = G.triangles; object.add(m); return m; };
  // ---- the sky (drawn once, behind everything; the ribs and the glass stand before it)
  const sky = makeSkyDome(plan.sky);
  sky.uniforms.uTime = time;
  object.add(sky.mesh);
  // ---- the shell and the ground
  let G = makeBuilder(); await buildFloors(plan, G, brk); await brk(); await meshOf(G, 'floors'); await brk();
  G = makeBuilder(); await buildGallery(plan, G, brk); await brk(); buildDrum(plan, G); await brk(); await meshOf(G, 'shell'); await brk();
  G = makeBuilder(); await buildRibs(plan, G, brk); await brk();
  // WHAT A CHANDELIER HANGS FROM (still, on its own axis; part of the ribs' mesh; between hand-backs of its own): a ROD of dark copper 0.2 m thick from
  // the boss over its frame up to the dome's iron, a CANOPY (a bell of copper, 0.75 m in radius) where the rod meets the
  // iron, a BOSS (0.5 m) where the frame's stays come together. Under the lower strong ring the canopy sits on the ring;
  // a chandelier dealt outward hangs from a BAR of the dome's iron laid between the two ribs over it (ribs stand every
  // 7.5 degrees), level, along the round.
  const darkCopper = mul3(C.copper, 0.55);
  for (const q of plan.chand) {
    const yb = q.y + 3.0 * q.k;
    G.tube([[q.x, yb, q.z], [q.x, q.top - 0.2, q.z]], 0.1, { sides: 6, color: darkCopper, surf: S_.metal(0.5) });
    G.lathe(q.x, q.z, [[0.1, q.top - 1.15], [0.3, q.top - 0.95], [0.62, q.top - 0.5], [0.75, q.top - 0.12], [0.001, q.top + 0.05]], { seg: 8, color: darkCopper, surf: S_.metal(0.6) });
    G.lathe(q.x, q.z, [[0.001, yb - 0.5], [0.34, yb - 0.3], [0.5, yb], [0.34, yb + 0.32], [0.1, yb + 0.55]], { seg: 8, color: C.copper, surf: S_.metal(0.7) });
    if (q.moved) {
      const bearing = Math.atan2(q.x, q.z), step = Math.PI * 2 / 48, a0 = (Math.floor(bearing / step - 0.5) + 0.5) * step, pts = [];
      for (let j = 0; j <= 4; j++) { const a = a0 + step * j / 4; pts.push([q.R * Math.sin(a), q.top, q.R * Math.cos(a)]); }
      G.tube(pts, 0.17, { sides: 4, color: C.rib, surf: S_.metal(0.35) });
    }
  }
  await meshOf(G, 'ribs'); await brk();
  G = makeBuilder(); await buildAisles(plan, G, brk); await meshOf(G, 'aisles'); await brk();
  G = makeBuilder(); await buildPlain(plan, G, brk); await brk();
  // (round t1) the parked craft and the drift of old shoes: things of the ground, in the ground's own mesh
  // (round t2) and the one sofa on its slab, in the same mesh; no microphone stand is made any more
  const left = { craft: 0, shoes: 0, party: 0, hall: 0, sofa: 0, fish: 0 };
  for (const q of [plan.ship, ...plan.craft]) left.craft += craftInto(G, q);
  await brk();
  if (plan.sofa) left.sofa = sofaInto(G, plan.sofa);
  await brk();
  { const M = new THREE.Matrix4(), R = new THREE.Matrix4(); let ns = 0;
    // (opts.oldShoes: the world's one word OLD_SHOES; with it false no shoe is built)
    for (const q of (opts.oldShoes === false ? [] : plan.shoes)) {
      // upright, on its side (a quarter turn about its length) or toppled; sunk by its own share; turned its own way
      const roll = q.lie > 0.72 ? (q.col % 2 ? 1 : -1) * 1.45 : (q.lie - 0.36) * 0.5, lying = q.lie > 0.72;
      M.makeTranslation(q.x, q.y - q.sink * 0.11 * q.size + (lying ? 0.05 * q.size : 0), q.z).multiply(R.makeRotationY(q.turn * DEG)).multiply(R.makeRotationX(roll)).multiply(R.makeRotationZ((q.sink - 0.3) * 0.5));
      left.shoes += shoeInto(G, q, M);
      if (++ns % 20 === 0) await brk();
    } }
  await brk(); await meshOf(G, 'plain'); await brk();
  // ---- columns (the gallery's ring, the pier's, the two by the ring with their lamps), lamp standards, the causeway's standards
  const dabs = [], lampC = mul3(C.lamp, 0.2);
  const glow = (x, y, z, size, col, ph) => dabs.push([x, y, z, size, col[0], col[1], col[2], 1, ph, 0, 0, 1]);
  G = makeBuilder();
  let nc = 0;
  for (const q of plan.columns) { columnInto(G, q.x, DIM.YOUT, q.z, 1.15, DIM.YG - 1 - DIM.YOUT, 10); if (++nc % 6 === 0) await brk(); }
  for (const q of plan.pier.cols) { columnInto(G, q.x, q.y, q.z, 1.15, DIM.YG - 1 - q.y, 10); if (++nc % 6 === 0) await brk(); }
  for (const q of plan.special) { columnInto(G, q.x, q.y, q.z, q.r, q.h, 12); G.ball(q.x, q.y + q.h + 0.55, q.z, 0.6, { rings: 4, seg: 8, color: C.lamp, surf: S_.glow(1.5) }); glow(q.x, q.y + q.h + 0.55, q.z, 2.6, lampC, q.x); }
  await brk();
  for (const f of plan.feats) if (f.kind === 'standard') { standardInto(G, f); glow(f.x, f.y + 4.3, f.z, 1.7, lampC, f.x + f.z); if (++nc % 2 === 0) await brk(); }
  for (const q of DOOR.lamps) glow(q[0], q[1], q[2], 1.5, mul3(C.lamp, 0.22), q[0] * 3 + q[2]);
  for (const q of DOOR.row) glow(q[0], q[1] - 0.06, q[2], 1.0, mul3(C.lamp, 0.2), q[2] * 1.7);
  for (const q of plan.porch.lamps) { standardInto(G, { x: q.x, y: DIM.YWAY + 0.4, z: q.z, turn: 30 }, 1.4); glow(q.x, DIM.YWAY + 0.4 + 6.1, q.z, 2.6, mul3(C.lamp, 0.24), q.x + q.z); if (++nc % 2 === 0) await brk(); }
  await brk(); await meshOf(G, 'columns'); await brk();
  // ---- palms (no two alike), urns of flowers (plainer far from the line)
  G = makeBuilder();
  let np = 0;
  for (const f of plan.feats) if (f.kind === 'palm') { palmInto(G, f, plan.lane.farFrom(f.x, f.y + f.h * 0.6, f.z) > LOD.palm); if (++np % 2 === 0) await brk(); }
  await brk(); await meshOf(G, 'palms'); await brk();
  G = makeBuilder();
  for (const f of plan.feats) if (f.kind === 'urn') { urnInto(G, f, plan.lane.farFrom(f.x, f.y + 1, f.z) > LOD.urn); if (++nc % 5 === 0) await brk(); }
  await brk(); await meshOf(G, 'urns'); await brk();
  // ---- the small fountains, the ornaments, the bandstand at rest on its ring dais
  G = makeBuilder();
  const fountains = plan.feats.filter((f) => f.kind === 'fountain');
  for (const f of fountains) { fountainInto(G, f); for (let k = 0; k < 4; k++) dabs.push([f.x, f.y + f.jet - 0.4, f.z, 0.8, 0.09, 0.115, 0.11, 3, f.phase * 0.1 + k / 4, 2.6, 1.2, 1]); }
  for (const f of plan.feats) if (f.kind === 'ornament') { ornamentInto(G, f); await brk(); }
  await brk();
  const band = await bandstandInto(G, plan.seed, brk);
  await brk();
  for (const st of band.strings) { const a = st[0], b = st[1], m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2], w = 0.011; quadS(G, [a[0] - w, a[1], a[2]], [m[0] - w, m[1], m[2]], [m[0] + w, m[1], m[2]], [a[0] + w, a[1], a[2]], C.brass, [3, 0.9, 0, 0], [3, 0.9, 0, 0.012]); quadS(G, [b[0] - w, b[1], b[2]], [m[0] - w, m[1], m[2]], [m[0] + w, m[1], m[2]], [b[0] + w, b[1], b[2]], C.brass, [3, 0.9, 0, 0], [3, 0.9, 0, 0.012]); }
  for (const q of band.lamps) glow(q[0], q[1], q[2], 1.9, mul3(C.lamp, 0.4), q[0] * 3);
  // (round t1) what a party left, in the mesh of the room's things: the long table of the gallery (a flame and a glow in
  // each of its great cups, as on every table; steam off its covered dishes); the party's table (the cup of tea steams
  // on the world's clock as the room's dishes do, a small low steam that ends under the table's own kept height).
  // (Round t2: nothing is made at the host's place on the dais: its pool of light is the room's light and stays.)
  await brk();
  { const H = hallInto(G, plan.hall), ft = flameTint(C.amber); left.hall = H.triangles;
    H.cups.forEach((q, i) => { dabs.push([q[0], q[1] + 0.26, q[2], 0.075 * 1.5, ft[0], ft[1], ft[2], 0, i * 2.7 + 1, 0, 0, 3.0]); glow(q[0], q[1] + 0.28, q[2], 1.8, mul3(C.amber, 0.6), i * 2.7 + 1); });
    H.dishes.forEach((q, i) => { for (let j = 0; j < 3; j++) dabs.push([q[0], q[1], q[2], 0.34, 0.085, 0.07, 0.055, 3, i * 0.37 + j / 3, 3.4, 0.85, 1]); }); }
  await brk();
  let partyAt = null;
  if (plan.party) {
    partyAt = partyInto(G, plan.party, opts.tableNumber !== false); left.party = partyAt.triangles;
    for (let j = 0; j < 2; j++) dabs.push([partyAt.cup[0], partyAt.cup[1] + 0.02, partyAt.cup[2], 0.11, 0.07, 0.06, 0.05, 3, 0.13 + j / 2, 3.0, 0.3, 1]);
  }
  await brk();
  await meshOf(G, 'things'); await brk();
  // ---- THE GREAT FOUNTAIN: its body; its falling water's drops and the fine spray at each fall's foot (the world's clock)
  G = makeBuilder(); greatFountainInto(G); await meshOf(G, 'fountain'); await brk();
  const rw = makeRng(hashSeed('tables-water:' + plan.seed));
  // (the drops fall and the spray stands only where a sheet falls: at the low places of each lip)
  const falls = FOUNT.rims.map(([R, yr, lips], k) => { const f = fountFall(k); return [R * 0.97 + 0.25, yr, yr - f.y1, lips, f.spread]; });
  for (const [R, y0, fall, lips, spread] of falls) {
    const n = Math.round(R * 3.2 * detail * (1 + fall / 14)), at = () => (rw.int(0, lips - 1) + 0.5 + rw.range(-0.08, 0.08)) / lips * 6.283;
    for (let i = 0; i < n; i++) { const a = at(), rr = R + rw.range(0, 0.3); dabs.push([Math.sin(a) * rr, y0, Math.cos(a) * rr, rw.range(0.13, 0.2), 0.5, 0.56, 0.56, 2, rw(), rw.range(0.95, 1.25) * Math.sqrt(fall / 4.5), fall, 1]); }
    for (let i = 0; i < Math.round(R * 0.9); i++) { const a = at(); dabs.push([Math.sin(a) * (R + spread), y0 - fall + 0.1, Math.cos(a) * (R + spread), rw.range(0.7, 1.1), 0.07, 0.08, 0.08, 3, rw(), rw.range(2.2, 3.4), 1.1, 1]); }
  }
  await brk();
  return buildHeroB({ ctx, plan, time, object, tris, room, sky, dabs, glow, fountains, brk, detail, partyAt, left });
}

async function buildHeroB(c) {
  const { ctx, plan, time, object, tris, room, sky, dabs, glow, fountains, brk, detail, partyAt, left } = c;
  const dummy = new THREE.Object3D();
  // an instanced mesh of the room's material: every instance carries a tint, a glow and a pivot (all nought unless set)
  const instanced = (geo, n, name) => {
    const mesh = new THREE.InstancedMesh(geo, room, n), tint = new Float32Array(n * 3).fill(1), gl = new Float32Array(n * 4), pv = new Float32Array(n * 4);
    geo.setAttribute('iTint', new THREE.InstancedBufferAttribute(tint, 3)); geo.setAttribute('iGlow', new THREE.InstancedBufferAttribute(gl, 4)); geo.setAttribute('iPivot', new THREE.InstancedBufferAttribute(pv, 4));
    mesh.frustumCulled = false; mesh.name = name; object.add(mesh);
    return { mesh, tint, gl, pv };
  };
  // ---- the tables: one instanced mesh for each kind, level and state; the cloth's colour and the cup's light by instance
  const groups = new Map();
  for (const t of plan.tables) { const k = t.kind + ':' + t.lod + ':' + t.state; let a = groups.get(k); if (!a) groups.set(k, a = []); a.push(t); }
  const chairLists = [[], [], []];
  for (const [k, list] of groups) {
    const [kind, lodS, stateS] = k.split(':'), lod = Number(lodS), B = tableGeometry(kind, Number(stateS), lod), n = list.length;
    await brk();
    const I = instanced(B.build(), n, 'tables:' + k), K = TABLES[kind];
    for (let i = 0; i < n; i++) {
      const t = list[i], cs = Math.cos(t.rot * DEG), sn = Math.sin(t.rot * DEG);
      if (i % 100 === 99) await brk();
      dummy.position.set(t.x, t.y, t.z); dummy.rotation.set(0, t.rot * DEG, 0); dummy.scale.set(1, 1, 1); dummy.updateMatrix(); I.mesh.setMatrixAt(i, dummy.matrix);
      const cc = CLOTHS[t.cloth], sc = SHADES[t.shade], ft = flameTint(sc);
      I.tint.set(cc, i * 3); I.gl.set([sc[0] * 1.35, sc[1] * 1.35, sc[2] * 1.35, t.phase], i * 4);
      // in every cup a flame, SEEN THROUGH ITS CUP'S GLASS (so it takes the cup's colour; its tip stands over the rim; one
      // dab, at every level) and a glow of the cup's colour, THE SAME GLOW ON EVERY TABLE (by the
      // thing, never by how far the eye is): so a candle far off is a point of its cup's colour and not a white one
      for (const q of K.cups) {
        const wx = t.x + q[0] * cs + q[2] * sn, wz = t.z - q[0] * sn + q[2] * cs, wy = t.y + q[1] + 0.17 * q[3];
        dabs.push([wx, wy, wz, 0.075 * q[3], ft[0], ft[1], ft[2], 0, t.phase + q[0], 0, 0, 3.0]);
        glow(wx, wy + 0.02, wz, 1.7 * q[3], mul3(sc, 0.85), t.phase + q[0]);
      }
      // steam off the covered dishes (the table's own lot, at every level)
      if (t.state === 3 && DISHES[kind]) for (const q of DISHES[kind]) for (let j = 0; j < 3; j++) dabs.push([t.x + q[0] * cs + q[1] * sn, t.y + (kind === 'station' ? 1.2 : 0.98), t.z - q[0] * sn + q[1] * cs, 0.3, 0.085, 0.07, 0.055, 3, t.phase * 0.07 + j / 3 + q[0], 3.4, 0.85, 1]);
      for (const ch of t.chairs) chairLists[lod].push([t, ch]);
    }
    I.mesh.instanceMatrix.needsUpdate = true;
    tris[I.mesh.name] = B.triangles * n;
    await brk();
  }
  for (let lod = 0; lod < 3; lod++) {
    const list = chairLists[lod], n = list.length; if (!n) continue;
    const B = chairGeometry(lod), I = instanced(B.build(), n, 'chairs' + lod);
    for (let i = 0; i < n; i++) {
      const t = list[i][0], ch = list[i][1];
      if (i % 300 === 299) await brk();
      const a = (ch[0] + t.rot) * DEG;
      dummy.position.set(t.x + Math.sin(a) * ch[1], t.y, t.z + Math.cos(a) * ch[1]); dummy.rotation.set(0, (ch[2] + t.rot) * DEG, 0); dummy.updateMatrix(); I.mesh.setMatrixAt(i, dummy.matrix);
    }
    I.mesh.instanceMatrix.needsUpdate = true;
    tris[I.mesh.name] = B.triangles * n;
    await brk();
  }
  // ---- the candle cups of the great fountain (on its pool's coping and its broad low rim) and of the chandeliers (which go round on the world's clock)
  const fc = fountainCups(), cupsN = fc.length + plan.chand.reduce((a, q) => a + q.n + 6, 0), cupG = makeBuilder();
  cupInto(cupG, 0, 0, 0, 1.6, 1);
  const CU = instanced(cupG.build(), cupsN, 'cups');
  let ci = 0;
  const cupAt = (x, y, z, shade, ph, sc, piv) => {
    dummy.position.set(x, y, z); dummy.rotation.set(0, 0, 0); dummy.scale.set(sc, sc, sc); dummy.updateMatrix(); CU.mesh.setMatrixAt(ci, dummy.matrix);
    const col = SHADES[shade]; CU.gl.set([col[0] * 1.35, col[1] * 1.35, col[2] * 1.35, ph], ci * 4);
    if (piv) CU.pv.set(piv, ci * 4);
    ci++;
    return col;
  };
  for (const q of fc) { const col = cupAt(q[0], q[1], q[2], q[3], q[4], 1, null), ft = flameTint(col); dabs.push([q[0], q[1] + 0.3, q[2], 0.12, ft[0], ft[1], ft[2], 0, q[4], 0, 0, 3.0]); glow(q[0], q[1] + 0.3, q[2], 1.0, mul3(col, 0.75), q[4]); }
  await brk();
  // the chandeliers: a frame (two hoops, arms, stays to the boss under its rod) and its cups; each turns about its own
  // rod. The frame is made at one metre's radius and set to the hoop's dealt radius; its heights, its cups, their flames
  // and its glow go by the chandelier's one scale (q.k, half as large again as the first make).
  const frame = makeBuilder(), ringOf = (rad, y, n) => { const p = []; for (let i = 0; i <= n; i++) { const a = i / n * Math.PI * 2; p.push([Math.sin(a) * rad, y, Math.cos(a) * rad]); } return p; };
  frame.tube(ringOf(1, 0, 20), 0.035, { sides: 4, color: C.copper, surf: S_.metal(0.75) });
  frame.tube(ringOf(0.55, 0.9, 12), 0.03, { sides: 4, color: C.copper, surf: S_.metal(0.75) });
  for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2, sx = Math.sin(a), cz = Math.cos(a); frame.tube([[sx * 0.55, 0.9, cz * 0.55], [sx * 0.85, 0.75, cz * 0.85], [sx, 0, cz]], 0.022, { sides: 3, color: C.copper, surf: S_.metal(0.75) }); if (k % 2 === 0) frame.tube([[sx * 0.55, 0.9, cz * 0.55], [0, 3.0, 0]], 0.02, { sides: 3, color: C.copper, surf: S_.metal(0.75) }); }
  frame.lathe(0, 0, [[0.001, -0.75], [0.16, -0.5], [0.05, -0.2], [0.05, 0.9]], { seg: 6, color: C.brass, surf: S_.metal(0.85) });
  const CH = instanced(frame.build(), plan.chand.length, 'chandeliers');
  plan.chand.forEach((q, i) => {
    const piv = [q.x, q.z, q.rate, q.phase], accent = 1 + i % 3;
    dummy.position.set(q.x, q.y, q.z); dummy.rotation.set(0, 0, 0); dummy.scale.set(q.r, q.k, q.r); dummy.updateMatrix(); CH.mesh.setMatrixAt(i, dummy.matrix); CH.pv.set(piv, i * 4);
    for (let k = 0; k < q.n + 6; k++) {
      const inner = k >= q.n, a = (inner ? (k - q.n + 0.5) / 6 : k / q.n) * Math.PI * 2, rad = inner ? 0.55 * q.r : q.r, x = q.x + Math.sin(a) * rad, z = q.z + Math.cos(a) * rad, y = q.y + (inner ? 0.9 * q.k : 0) + 0.04 * q.k;
      cupAt(x, y, z, k % 4 === 1 ? accent : 0, k * 3.1 + i, 0.9 * q.k, piv);
      dabs.push([x, y + 0.27 * q.k, z, 0.12 * q.k, q.rate, q.phase, 0, 4, k * 3.1 + i, q.x, q.z, 3.0]);
    }
    glow(q.x, q.y + 0.3 * q.k, q.z, 4.0 * q.k, mul3(C.amber, 0.1), i * 7);
  });
  CU.mesh.instanceMatrix.needsUpdate = true; CH.mesh.instanceMatrix.needsUpdate = true;
  tris.cups = cupG.triangles * cupsN; tris.chandeliers = frame.triangles * plan.chand.length;
  // (round t1) THE ONE SMALL YELLOW FISH of the party's table: its own mesh of one instance, going slow rounds about its
  // bowl's upright axis on the world's clock (the pivot every chandelier turns by: a round in 4.8 s, from its own phase)
  if (partyAt) {
    const FG = fishGeometry(), FI = instanced(FG.build(), 1, 'fish'), b = partyAt.bowl;
    dummy.position.set(b[0], b[1] - 0.012, b[2]); dummy.rotation.set(0, 0, 0); dummy.scale.set(1, 1, 1); dummy.updateMatrix(); FI.mesh.setMatrixAt(0, dummy.matrix);
    FI.pv.set([b[0], b[2], 1.3, 0.7], 0); FI.mesh.instanceMatrix.needsUpdate = true; tris.fish = left.fish = FG.triangles;
  }
  await brk();
  // ---- the plain's dust: low flat wisps far from the way (under 2 m); nothing else is in the air
  for (const q of plan.dust) for (let j = 0; j < 2; j++) dabs.push([q.x, plainY(q.x, q.z) + 0.95, q.z, q.size, 0.03, 0.018, 0.015, 3, q.phase + j * 0.5, q.period, 0.25, 0.06]);
  await brk();
  const dab = makeDabs(dabs, time); object.add(dab.mesh); tris.dabs = dabs.length * 2;
  await brk();
  // ---- the glass and the water
  const glass = makeGlass(room.uniforms); object.add(glass.mesh); tris.glass = 72 * 14 * 2;
  await brk();
  const water = makeWater(fountains, time, partyAt ? { x: partyAt.bowl[0], y: partyAt.bowl[1], z: partyAt.bowl[2], r: 0.115, cut: 0.091 } : null); object.add(water.mesh); tris.water = water.triangles;
  // (the sky's dome by its own mesh: an icosahedron divided three times, 320 triangles)
  const skyGeo = sky.mesh.geometry; tris.sky = skyGeo.index ? skyGeo.index.count / 3 : skyGeo.attributes.position.count / 3;
  const total = Object.values(tris).reduce((a, b) => a + b, 0);
  const materials = [room, sky.material, glass.material, dab.material, water.material];
  return {
    object, plan, time, sky, tris, total, materials, left,
    radius: 125, height: 80, center: new THREE.Vector3(0, 24, 0), ground: false,
    anchors: { entry: plan.route.path.start.clone(), exit: plan.route.path.end.clone() },
    update(dt, t) { time.value = t; },
    dispose() { for (const m of materials) m.dispose(); object.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.isInstancedMesh) o.dispose(); }); },
  };
}
