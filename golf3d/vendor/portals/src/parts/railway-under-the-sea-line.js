// railway-under-the-sea: the one law of the line, the route, the hours and the railcar's pacing (film worlds D; the
// lead's file). Every part of this world reads its places from here, so that the track, the halt, the way marks,
// the railcar and the route agree to the centimetre. Plain numbers and pure functions only: no three.js, no random
// draw, no clock. Metres; y up; the still sea's level is y = 0; the flight runs toward -Z.
// "West" is -x (the lens's side of the line for most of the flight), "east" is +x (the way marks' side).

const S = (t) => { t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); };       // the smooth step
const dS = (t) => (t <= 0 || t >= 1 ? 0 : 6 * t * (1 - t));

// ---- levels (y). The whole track lies UNDER the water: the rail heads 3.5 cm under the still surface.
export const LEVEL = { sea: 0, bed: -0.5, bankTop: -0.16, sleeperTop: -0.12, railHead: -0.035, haltDeck: 0.95, carFloor: 1.05 };
export const GAUGE = 1.5;                                                             // between the rails' centres
export const BANK = { topWidth: 3.4, footWidth: 5.6 };                                // the ballast bank under the track

// ---- the line's centre in plan: x = lineX(z). Straight at x = 0 for z > -250, one gentle S of 70 m toward +x
// between z = -250 and z = -860 (least radius about 885 m), straight at x = 70 from z = -860 on. One single track.
export const LINE = { z0: 340, zBend0: -250, zBend1: -860, shift: 70, zEnd: -1400 };
export function lineX(z) { return LINE.shift * S((LINE.zBend0 - z) / (LINE.zBend0 - LINE.zBend1)); }
export function lineSlope(z) { return -LINE.shift * dS((LINE.zBend0 - z) / (LINE.zBend0 - LINE.zBend1)) / (LINE.zBend0 - LINE.zBend1); }   // dx/dz
// heading (radians about +Y) of a thing that travels the line toward -Z at z: set object.rotation.y to this for a
// thing modelled with its nose toward -Z. Positive turns the nose toward... +X is reached with a NEGATIVE angle in
// three.js, so this returns atan(lineSlope) (travelling toward -Z, dx per metre flown = -lineSlope).
export function lineHeading(z) { return Math.atan(lineSlope(z)); }
// a point `off` metres to the side of the line at z (off > 0 = east, off < 0 = west), measured square to the line
export function beside(z, off) { const s = lineSlope(z), k = 1 / Math.sqrt(1 + s * s); return [lineX(z) + off * k, z - off * s * k]; }

// ---- the ring (the way out) stands on the line; the line runs on under it and beyond
export const RING = { x: 70, y: 6.4, z: -1040, radius: 6 };

// ---- the halt: a timber halt on piles EAST of the line where the railcar stands at the end of its run
export const HALT = { z0: -752, z1: -782, edge: 1.9, width: 3.4, side: 1 };          // its track-side edge 1.9 m from the line's centre
// ---- the row of pricken (the tidal flats' way marks: young birches set in the bed) EAST of the line, from the far
// south to before the halt. No pole line and no wire stand in this sea.
export const PRICKEN = { offset: 6.5, z0: 306, z1: -640, spacing: 34 };
// ---- the Hallig (a low marsh island) WEST of the line: its eastern shore runs beside the line
export const HALLIG = { z0: -430, z1: -720, shoreOff: -24, warft: { z: -565, off: -98, radius: 42, height: 4.6 } };
// ---- the near refuge beacon marks the island's landing: 30 m before the shore's near end, 4 m outside the shore line
export const BEACON = { z: HALLIG.z0 + 30, off: HALLIG.shoreOff - 4 };

// ---- the legs of the flight, by the eye's z ON THE ROUTE (each is one of the route's own knots below)
export const WAY = {
  close: -50,     // the lens has begun to close on the line
  join: -150,     // it swings onto the line between two marker posts
  rails: -210,    // it is on the line's own axis, behind the railcar
  leave: -330,    // it leaves the rails for the refuge beacon; the tidal channel crosses the line here
};
// the tidal channel marked by withies crosses the line where the lens leaves the rails and runs off south-east
export const channelZ = (off) => WAY.leave - 0.45 * off;

// ---- the route (the lens's path): [x, y, z]. Low all the way (the track vanishes from any height), and NEAR things:
// it enters 10 m west of the line (the railcar beside it stands outside the entry's tube), closes to 5 m beside the
// line and sinks to 2 m over the water beside the railcar, crosses onto the line's own axis between two marker
// posts (they stand at even 50 m) and follows the railcar, rising a little as the car draws away; it swings west
// past the refuge beacon, crosses the Hallig's stone shore and flies over its salt marsh below the dwelling mound,
// comes back over the shore to pass the standing railcar at the halt 4 m from its flank, crosses onto the axis
// again between two marker posts and is on the ring's own axis, level, from 100 m before the ring: the last three
// knots lie in one straight line, so the last span (65 m) is straight.
const R = (z, off, y) => [lineX(z) + off, y, z];
export const ROUTE = [
  R(0, -10, 2.7), R(WAY.close, -6.8, 2.3), R(-100, -5.0, 2.0), R(WAY.join, -0.4, 2.6), R(WAY.rails, 0, 3.0), R(-280, 0, 3.6), R(WAY.leave, -0.8, 3.7),
  R(-365, -7, 3.6), R(BEACON.z, -18.5, 3.9), R(-440, -27, 5.0), R(-490, -40, 6.4), R(-550, -38, 6.4), R(-605, -22, 4.6), R(-660, -10, 3.4), R(-715, -7.2, 3.0),
  R(-750, -5.4, 2.8), R(-800, -5.2, 2.9), R(-850, -4.6, 3.3), R(-900, -0.5, 4.6),
  [RING.x, RING.y, RING.z + 100], [RING.x, RING.y, RING.z + 65], [RING.x, RING.y, RING.z],
];

// ---- THE RAILCAR'S PACING (declared): the z of its NOSE as a function of the z of the eye ON THE ROUTE. The world
// reads the eye's z from the route at u (path.pointAt(u).z), never from the camera. Smooth, never turning back.
// Every knot is a place of this law (the eye's z, then where the car's nose is then):
//   at the entry the railcar is drawing past on the east: its tail 1.9 m beyond the entry plane (its body stands
//   8.6 m from the entry's axis, outside the entry's tube), and it runs 1.4 times the eye's pace;
//   by the time the lens begins to close on the line (WAY.close) it has taken its STATION, its tail 9 m ahead of
//   the eye, and it keeps that station until the lens is on the rails behind it (WAY.rails);
//   then it draws away down the line: its nose passes the refuge beacon as the lens leaves the rails (WAY.leave),
//   and the last way mark as the lens comes abeam the dwelling mound;
//   it has come to a stand at the halt (its nose at CAR.noseStop, 4 m short of the halt's far end) when the lens
//   reaches the island's far end, and stands there to the end.
export const CAR = { length: 12.6, width: 2.7, noseStop: HALT.z1 + 4, wheelRadius: 0.42, axles: [-3.1, 3.1] };
// the two still semaphore posts east of the line: one where the line leaves the straight, one three and a half
// car lengths before the halt
export const SEMAPHORES = [{ z: LINE.zBend0, off: 3.7 }, { z: HALT.z0 + 3.5 * CAR.length, off: 3.7 }];
const STATION = 9, AHEAD = STATION + CAR.length;
const KNOTS = [                                                                                     // [eye z, nose z]
  [0, -(CAR.length + 1.9)], [WAY.close, WAY.close - AHEAD], [WAY.rails, WAY.rails - AHEAD], [WAY.leave, BEACON.z],
  [HALLIG.warft.z, PRICKEN.z1], [HALLIG.z1, CAR.noseStop], [RING.z, CAR.noseStop],
];
const SLOPE = [1.4, 1.0, 1.0, 1.25, 1.15, 0.0, 0.0];                                                // d(nose z) / d(eye z) at each knot
export function noseZ(eyeZ) {
  const e = eyeZ > 0 ? 0 : eyeZ < RING.z ? RING.z : eyeZ;
  let i = 0; while (i < KNOTS.length - 2 && e < KNOTS[i + 1][0]) i++;
  const [e0, n0] = KNOTS[i], [e1, n1] = KNOTS[i + 1], h = e1 - e0, t = (e - e0) / h;
  const t2 = t * t, t3 = t2 * t;                                                                    // a cubic Hermite piece
  return (2 * t3 - 3 * t2 + 1) * n0 + (t3 - 2 * t2 + t) * h * SLOPE[i] + (-2 * t3 + 3 * t2) * n1 + (t3 - t2) * h * SLOPE[i + 1];
}
// metres the nose runs per metre the eye runs (its pace over the water against the eye's own): 0 when it stands
export function noseRate(eyeZ) { const d = 0.5; return (noseZ(eyeZ - d) - noseZ(eyeZ + d)) / (-2 * d); }

// ---- THE HOURS ARE PLACES ON THIS LINE (never the clock): by the eye's z on the route.
//   gold: the share of the late light, a pale silver sun behind a high veil. Full day holds for two thirds of the
//         flight; the late light comes on as the lens leaves the island for the halt, from 30 m before the island's
//         far end to 18 m beyond the halt's far end (the lens is then past the halt and the standing railcar);
//   lamps: the night value for windows and lamps: it begins where the late light is whole (so the railcar's
//         windows are unlit while it is in view) and is whole 120 m on;
//   dusk: the share of the grey-blue dusk: the last 125 m before the ring, whole 35 m before it.
const LATE = { from: HALLIG.z1 + 30, to: HALT.z1 - 18 }, DUSK = { from: RING.z + 125, to: RING.z + 35 }, LAMPS = { from: LATE.to, run: 120 };
export function hours(eyeZ) {
  return { gold: S((LATE.from - eyeZ) / (LATE.from - LATE.to)), dusk: S((DUSK.from - eyeZ) / (DUSK.from - DUSK.to)), lamps: S((LAMPS.from - eyeZ) / LAMPS.run) };
}
