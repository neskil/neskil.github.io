// THE GOLDEN CITY AND ITS BRIDGE: the plan. Typed places in metres (x east, y up, z south; the world's rim lies north, toward minus z).
// Pure data and pure functions with no imports, so that a count in node reads the same places the world builds from.
//
// THE CITY stands on a steep round rock island 380 m in radius about (0, 400): four terraces one above another (their outer edges
// 40, 76, 110 and 140 m over the sea), buildings and spires on the lower three, THE PALACE on the top one: a rank of round golden
// tubes side by side, 25 m apart, stepping up from 94 m at either end to 250 m in the middle, its front toward the bridge and the rim.
export const CITY = { x: 0, z: 400, r: 380 };
// each terrace: its outer edge's radius, its inner edge's radius (where the next cliff rises), its height over the sea
export const TERR = [{ r0: 368, r1: 316, y: 40 }, { r0: 304, r1: 250, y: 76 }, { r0: 238, r1: 184, y: 110 }, { r0: 172, r1: 0, y: 140 }];
export const PALACE = { x: 0, z: CITY.z - 44, y: TERR[3].y, n: 6, step: 25, tall: 250, drop: 26, r: 13, back: 7 };      // n tubes either side of the middle one; each `drop` m lower than its inner neighbour; each pair stands `back` m further back
// THE CITY'S GATE at the island's north foot, where the bridge leaves it: two towers either side of the road and a gable over an arch
export const GATE = { z: CITY.z - CITY.r, half: 17, tower: 84, arch: 30, gable: 52 };
// THE BRIDGE: one straight slab of crystal in the line x 0, 14 m wide, its top 6 m over the sea, from the city's gate to the gate house's base
export const BRIDGE = { w: 14, y: 6, t: 1.6, z0: GATE.z + 6, z1: -1378 };
// THE SEA'S EDGE. East and west of x 300 it is the old rim, very nearly straight (an arc of 5 km over its middle kilometre about
// z -1400, straight along its tangents beyond). Between, it is cut back in THE BAY OF THE FALL: two nearly straight arms run in
// from (-300, -1409) and (300, -1409) to the apex on the bridge's line at z -700, rounded there (30 m) so that the edge passes
// under the bridge square to it. Inside the bay there is no sea: the bridge's far half and the gate house stand over open space.
export const LIP = { z: -1400, R: 5000, mid: 500, apex: -700, bay: 300, round: 30, ease: 60 };      // `ease`: the breadth over which an arm turns into the old rim
const LIP_K = LIP.mid / Math.sqrt(LIP.R * LIP.R - LIP.mid * LIP.mid);
const rimZ = (x) => { const a = Math.abs(x), m = Math.min(a, LIP.mid); return LIP.z - (LIP.R - Math.sqrt(LIP.R * LIP.R - m * m)) - LIP_K * (a - m); };
const BAY_H = LIP.apex - LIP.z, BAY_A = LIP.z + BAY_H - LIP.ease * LIP.ease / (4 * BAY_H);      // the arms' line at x 0, set so that the eased edge lies at the apex exactly
const BAY_K = (BAY_A - rimZ(LIP.bay)) / (Math.sqrt(LIP.bay * LIP.bay + LIP.round * LIP.round) - LIP.round);      // an arm's slope (metres north for a metre out)
const bayZ = (x) => BAY_A - BAY_K * (Math.sqrt(x * x + LIP.round * LIP.round) - LIP.round);
export function lipZ(x) { const b = bayZ(x), r = rimZ(x), d = b - r; return 0.5 * (b + r + Math.sqrt(d * d + LIP.ease * LIP.ease)); }      // the sea lies south of this (z greater)
// THE GATE HOUSE at the bridge's far end, out over open space: a round stepped base 48 m in radius at the deck (level with the
// bridge), a long tapering keel under it; on it a globe 60 m across, its middle 34 m over the deck; a doorway on its south side,
// toward the bridge. THE SPIKE leaves the globe's north-east shoulder and points north-east, 35 degrees above the level, 65 m long:
// the beam's nozzle.
export const HOUSE = { x: 0, z: -1420, deck: BRIDGE.y, r: 30, y: 40, base: 48, spike: 65, tilt: 35 * Math.PI / 180, bear: 45 * Math.PI / 180 };      // `bear`: the spike's bearing, east of north
const ST = Math.sin(HOUSE.tilt), CT = Math.cos(HOUSE.tilt), SB = Math.sin(HOUSE.bear), CB = Math.cos(HOUSE.bear);
export const SPIKE_DIR = [CT * SB, ST, -CT * CB];      // the spike's and the beam's one direction (a unit vector)
export const spikeAt = (d) => { const s = HOUSE.r * 0.96 + d; return [HOUSE.x + s * SPIKE_DIR[0], HOUSE.y + s * SPIKE_DIR[1], HOUSE.z + s * SPIKE_DIR[2]]; };      // a place on the spike's axis, d metres from where it leaves the globe (and on the beam's, beyond its point)
export const BEAM = { from: spikeAt(HOUSE.spike), length: 5200, r0: 0.8, r1: 150 };      // the shaft of light: from the spike's point (54.3, 93.8, -1474.3) straight on, widening
// THE RING stands free in the city on its own round platform before the brow of the second terrace, under the palace's front:
// the platform's deck 77 m up on a tall pedestal from the first terrace, the ring's foot half a metre over the deck
export const PLAT = { x: 0, z: 88, r: 12, deck: 77 };
export const RING = { x: PLAT.x, y: PLAT.deck + 9.5, z: PLAT.z, r: 9 };

// THE ROUTE (1,978 m): THE TOUR, from the gate house to the city by way of the open sea. It enters out over the stars 300 m
// beyond the gate house on its north-west side, 52 m up, flying south-south-east; passes the globe's WEST side 97 m from its
// middle; crosses the bay in a long gentle S, sinking: west of the bridge by the gate house, OVER it in mid bay (23 m over the
// slab), 30 m east of it before the apex (LEAVE). From there:
//  THE CROSSING (583 m): out of the bay over its EAST arm (the sea's edge is crossed 71 m on, level, 20 m up), then low over the
//   still sea, 15.5 to 20 m up: one long arc of 1,290 m onto a straight 28.5 degrees east of south that runs between THE TWO
//   OUTWORKS of the city, 58 m from each one's middle: OUTWORK ONE (207, -524) on the left hand, OUTWORK TWO (210, -275) on the
//   right; the city stands three-quarter on the right hand all the way, its whole image in the sea.
//  THE TURN ROUND OUTWORK TWO (155 m): where outwork two is nearest (OUTTWO) one right turn of 100 m radius about (173.1, -255),
//   through 88.6 degrees, level at 15.5 m: the outwork stays on the right hand (58 m off at the nearest, 107 m at the turn's end)
//   and falls behind as the city swings in from the right.
//  THE STRAIGHT (222 m): 60.2 degrees west of south toward the gate, the city's north-east front on the left hand, the gate
//   towers ahead; it climbs from 15.5 to 43.9 m, the slope growing evenly from level to 14 degrees.
//  THE HOOK'S END (63 m): the last 60 degrees of a left turn of 60 m radius about (60, -5.6) onto the bridge's own line,
//   climbing; it comes onto the line 25.6 m north of the gate, heading south, 60.8 m up.
//  THE LAST STRAIGHT (97 m, rising 15.4 degrees): over the city gate's gable, between the two gate towers, to the ring.
// The points of each turn stand half a step either side of its joins with the straights where no named place is a point, so
// that the curve eases through each join; STRAIGHT, HOOK and ONLINE are named places on the curve, not points of it.
export const ENTRY = [-172, 52, -1666];
export const ABEAM = [-97, 47.5, -1420];      // the globe's middle is due east: it passes abeam on the left hand
export const CROSS = [0, 29, -1030];          // over the bridge in mid bay: it passes from the left hand to the right
export const LEAVE = [30, 21.5, -835];        // 30 m east of the bridge before the apex: the crossing begins
export const OUTONE = [156, 15.5, -496.4];    // nearest OUTWORK ONE: its middle 58 m off, square on the left hand
export const OUTTWO = [261, 28, -302.6];      // nearest OUTWORK TWO: its middle 58 m off, square on the right hand; the turn round it begins
export const STRAIGHT = [222.85, 28, -168.23];        // the turn's end: the straight toward the gate begins
export const HOOK = [30.13, 43.88, -57.63];   // the straight's end: it joins the hook's circle, 60 degrees of left turn still to fly
export const ONLINE = [0, 60.76, -5.59];      // the hook's end: on the bridge's own line, heading south; straight from here to the ring
export const GABLE = [0, 70, 28];             // over the city gate
export const ROUTE = [
  ENTRY, [-147, 51.5, -1584], [-122, 50, -1501], ABEAM, [-77, 42, -1345], [-58, 38, -1270], [-40, 35, -1190], [-20, 32, -1110], CROSS,
  [18, 26, -960], [28, 23.5, -890], LEAVE,
  [47.5, 19.9, -764.7], [68.9, 18.1, -695.4], [94.2, 16.5, -627.5], [123.3, 16, -561], OUTONE,      // the long arc onto the straight
  [190.3, 19, -433.1], [225.6, 26.5, -368], OUTTWO,      // between the outworks, rising to look over outwork two's bastion
  [270.2, 28, -278.6], [273.1, 28, -253.1], [269.3, 28, -227.7], [259.1, 28, -204], [243.3, 28, -183.8], [233.6, 28, -175.3],      // the turn round outwork two
  [211.6, 28, -161.8], [177.8, 28, -142.3], [143.1, 28, -122.4], [108.4, 29.3, -102.5], [73.7, 33.8, -82.6], [43.3, 40.3, -65.2],      // the straight
  [27.7, 44.6, -56.1], [14.7, 49, -45], [5.4, 53.7, -30.6], [0.6, 58.4, -14.1],      // the hook's last 60 degrees
  [0, 63.13, 3], [0, 67.85, 20.18], GABLE, [RING.x, RING.y, RING.z]];

// LIFE: three flocks of pale birds, each wheeling on the clock alone about a typed place (its middle, the round's radius, how many,
// their size, the flock's spread across, up and along the course; `wobble`: how far the round strays from its radius, the kit's
// own 0.3 where none is typed). One over the first terrace before the ring, above the flown line and inside the city's open axis
// (nothing of the city stands there above 79 m). One round the spire of each OUTWORK in the sea (the city part's typed places
// (207, -524) and (210, -275)): 49 to 67 m up, over the bastion's top; the round itself keeps 18 to 36 m from the spire's axis
// and no bird comes nearer than 4 m to it or further than 51 m from it; the flown line passes 58 m from each middle, 15.5 m up
// by the first and 28 m up by the second, so no bird comes within 22 m of it.
export const FLOCKS = [
  { name: 'birds-terrace', center: [0, 100, 58], radius: 17, count: 66, size: 1.7, spread: [6, 2.5, 10] },
  { name: 'birds-outwork-one', center: [207, 58, -524], radius: 32, wobble: 0.12, count: 34, size: 1.6, spread: [5, 2.4, 12] },
  { name: 'birds-outwork-two', center: [210, 58, -275], radius: 32, wobble: 0.12, count: 34, size: 1.6, spread: [5, 2.4, 12] },
];
export const FLOCK_COMMON = { species: 'gulls', height: 2.5, wander: [2.2, 0.9, 2.2, 0.5], maxSigma: 3, clear: 8,      // every bell-curve draw held within 3 sigma; 8 m of clear air kept from the flown line, by place
  light: { sunDir: [-0.418, 0.518, -0.746], sunColor: '#ffd9a0', sunIntensity: 0.9, sky: '#8f86d6', skyIntensity: 0.85, ground: '#e2aa52', groundIntensity: 0.75 } };      // they take the sky's violet from above and the city's gold from below

// GLSL shared by the sea and by everything that is drawn a second time, turned over, as its image in the sea: a mirrored point w
// (below the sheet) shows only where the sight line to it meets the sheet short of the sea's edge (the edge's numbers are the plan's own)
const F1 = (v) => v.toFixed(1);
export const MIRROR_GLSL = /* glsl */`
float abLipZ(float x){
  float a = abs(x), m = min(a, ${F1(LIP.mid)});
  float rim = ${F1(LIP.z)} - (${F1(LIP.R)} - sqrt(${F1(LIP.R * LIP.R)} - m*m)) - ${LIP_K.toFixed(6)}*(a - m);
  float bay = ${BAY_A.toFixed(4)} - ${BAY_K.toFixed(6)}*(sqrt(x*x + ${F1(LIP.round * LIP.round)}) - ${F1(LIP.round)});
  float d = bay - rim;
  return .5*(bay + rim + sqrt(d*d + ${F1(LIP.ease * LIP.ease)}));
}
float abMirror(vec3 w){
  float den = max(cameraPosition.y - w.y, 1e-3);
  vec3 s = cameraPosition + (w - cameraPosition)*(max(cameraPosition.y, 0.)/den);
  return smoothstep(0., 3., s.z - abLipZ(s.x))*step(w.y, 0.);
}
vec3 abHue(float h){ return clamp(abs(fract(h + vec3(0., .6667, .3333))*6. - 3.) - 1., 0., 1.); }      // every colour of the rainbow, by a number
`;
