// bridges-of-marigold: the numbers the world and its parts share (metres; y up; the gulf's water at y 0; south is +z,
// east is +x). Written by the designer; change a number only by the designer's word. Import them; never retype one.
// A place on a circle about the great tower's axis is named by its bearing b in degrees: 0 is due south (+z), 90 west
// (-x), 180 north, 270 east: ring(b, R) = (-R sin b, R cos b). The flight goes round with b rising, the great tower on
// its right hand.

const RAD = Math.PI / 180;
export function ring(b, R) { return [-R * Math.sin(b * RAD), R * Math.cos(b * RAD)]; }

export const WATER = 0, MIST = 14;        // black water; a bed of slow mist up to about y 14

// THE TOWERS. Index 0 is the great tower on the axis; 1 to 7 are the ring towers, by bearing. For each: its axis
// (x, z), the radius r of its stack at the foot of the houses, how much narrower the stack is at its top (taper, a
// share of r), the stone foot (footR wide, up to footTop), where the houses begin (base) and where the roofs end
// (top); scaffolds, cranes, flag poles and water tanks may stand up to `crown` metres higher.
// NOTHING OF THE CITY STANDS OUTSIDE towerRadius(k, y): corbels, balconies, awnings, stairs and roofs included.
function T(b, d, r, top, taper = 0.2) { const [x, z] = ring(b, d); return { b, d, x, z, r, taper, footR: r + 7, footTop: 18, base: 18, top, crown: 12 }; }
export const TOWERS = [
  { b: 0, d: 0, x: 0, z: 0, r: 46, taper: 0.24, footR: 66, footTop: 40, base: 40, top: 210, crown: 16 },
  T(32, 118, 24, 165), T(75, 114, 21, 130), T(125, 120, 27, 190), T(178, 128, 23, 150),
  T(230, 112, 22, 135), T(283, 118, 26, 180),
  { b: 335.095, d: 123.483, x: 52, z: 112, r: 20, taper: 0.1, footR: 27, footTop: 18, base: 18, top: 118, crown: 5.5 },
];
// Tower 7 (the south-east one) ends in a broad level ROOF TERRACE at y 118: the high bridge springs from its south
// edge and the flight passes over it. Nothing on that terrace stands higher than top + crown (123.5).
export function towerRadius(k, y) {
  const t = TOWERS[k];
  if (y <= t.footTop) return t.footR;
  if (y >= t.top) return y <= t.top + t.crown ? t.r * (1 - t.taper) + 4 : 0;
  return t.r * (1 - t.taper * (y - t.base) / (t.top - t.base));
}

// THE GATE: on the great tower's stone foot, a broad terrace at y 40 on its south side; on it, astride the great
// bridge's end, the gate house (an arched way through it, 14 wide and 14 high, on the bridge's line).
export const GATE = { terraceY: 40, half: 16, z0: 44, z1: 60, top: 64, archHalf: 7, archTop: 54 };

// THE PETAL BRIDGES. Each is given by its deck's middle line (the top of the petal bed) and its width; the bed is
// about 3 m deep under that line. deck functions return the height of the bed's top.
// 1. THE GREAT BRIDGE: along x = 0 from z 330 (in the mist) to the gate terrace at z 60. Crown about y 65 at z 172.
export const GREAT_BRIDGE = { x: 0, z0: 330, z1: 60, y0: 16, y1: 40, rise: 144, width: 18 };
export function greatDeck(z) { const g = GREAT_BRIDGE, t = (g.z0 - z) / (g.z0 - g.z1); return g.y0 + (g.y1 - g.y0) * t + g.rise * t * (1 - t); }
// 2. THE CANYON BRIDGE: across the canyon on its north side, from the great tower's face at bearing 178 (y 108) straight out to a
// side terrace of ring tower 4 (y 116); s runs 0 at the great tower to 1 at tower 4. The flight passes under it.
export const CANYON_BRIDGE = { b: 178, r0: 41, r1: 108, y0: 108, y1: 116, rise: 36, width: 14 };
export function canyonBridge(s) { const c = CANYON_BRIDGE, [x, z] = ring(c.b, c.r0 + (c.r1 - c.r0) * s); return [x, c.y0 + (c.y1 - c.y0) * s + c.rise * s * (1 - s), z]; }
// 3. THE HIGH BRIDGE: along x = 52 from the south edge of tower 7's roof terrace (z 132, y 118) over a low crown at
// z 180 (where the ring stands) and down in a long arc into the mist at z 420.
export const HIGH_BRIDGE = { x: 52, z0: 132, z1: 420, y0: 118, y1: 14, rise: 156, width: 15 };
export function highDeck(z) { const h = HIGH_BRIDGE, t = (z - h.z0) / (h.z1 - h.z0); return h.y0 + (h.y1 - h.y0) * t + h.rise * t * (1 - t); }

// THE FLIGHT. It begins over the great bridge a little before its crown, heading north; follows the bridge down and
// bears left off it; winds once round the great tower, climbing, the tower on its right; leaves the canyon heading
// due south over tower 7's roof terrace and ends in the ring on the high bridge's crown.
export const ENTRY = { x: 0, y: 72.5, z: 210 };
export const EXIT = { x: 52, y: 128.9, z: 180 };          // the ring's centre, 6.5 m over the petals of the high bridge's crown
export const PORTAL_RADIUS = 7;
// The winding: from bearing b0 to b1 the line is at spiral(b): radius R0 falling to R1, height Y0 rising to Y1.
export const WIND = { b0: 40, b1: 290, R0: 72, R1: 66, Y0: 60, Y1: 130 };
export function spiral(b) {
  const w = WIND, k = Math.min(1, Math.max(0, (b - w.b0) / (w.b1 - w.b0))), [x, z] = ring(b, w.R0 + (w.R1 - w.R0) * k);
  return [x, w.Y0 + (w.Y1 - w.Y0) * Math.pow(k, 1.12), z];
}
// The knots of the flown line, entry first, exit last (the world file hands exactly these to the kit's makePath).
function knots() {
  const K = [[ENTRY.x, ENTRY.y, ENTRY.z], [0, 72.45, 192], [0, 72, 174], [0, 70.6, 154.5], [0, 68.8, 138]];
  // off the bridge: a left-hand curve of 50 degrees, then 30 m straight, to the winding's first place
  const b0 = WIND.b0 * RAD, s0 = spiral(WIND.b0), h0 = [-Math.cos(b0), -Math.sin(b0)], lead = 30;
  const ex = s0[0] - lead * h0[0], ez = s0[2] - lead * h0[1], rho = -ex / (1 - Math.cos(50 * RAD)), zA = ez + rho * Math.sin(50 * RAD);
  const ys = [66.8, 64.9, 63.2, 61.8, 60.8];
  [0, 12.5, 25, 37.5, 50].forEach((a, i) => K.push([-rho + rho * Math.cos(a * RAD), ys[i], zA - rho * Math.sin(a * RAD)]));
  K.push([s0[0] - 15 * h0[0], 60.2, s0[2] - 15 * h0[1]]);
  for (let b = WIND.b0; b <= WIND.b1 + 0.01; b += 12.5) K.push(spiral(b));
  // out of the winding: a short straight, then a left-hand curve of 60 m radius onto the high bridge's line x = EXIT.x
  const b1 = WIND.b1 * RAD, s1 = spiral(WIND.b1), h1 = [-Math.cos(b1), -Math.sin(b1)], L = [h1[1], -h1[0]], r2 = 60, turn = WIND.b1 - 270;
  const d = (s1[0] - r2 * (1 - L[0]) - EXIT.x) / (-h1[0]);
  const px = s1[0] + d * h1[0], pz = s1[2] + d * h1[1], cx = px + r2 * L[0], cz = pz + r2 * L[1];
  K.push([px, WIND.Y1 + 0.9, pz]);
  for (const a of [turn / 2, turn]) { const t = (turn - a) * RAD; K.push([cx - r2 * Math.cos(t), WIND.Y1 + 1.2 + 0.3 * a / turn, cz - r2 * Math.sin(t)]); }
  EXIT_LINE.z0 = K[K.length - 1][2];
  K.push([EXIT.x, 131.8, 84], [EXIT.x, 132, 102], [EXIT.x, 132, 120], [EXIT.x, 131.2, 140], [EXIT.x, 130, 160], [EXIT.x, EXIT.y, EXIT.z]);
  return K;
}
export const EXIT_LINE = { x: EXIT.x, z0: 0 };            // the last leg runs due south along x from z0 (z0 is set by knots())
export const ROUTE = knots();

// How far a place is from the flown line, to within about a metre and a half (a fine polyline through the knots;
// the world file counts the true line itself). Use it to keep things clear: nothing solid within 8 m of it, lamps,
// flags, cables and trams no nearer than 6 m; give your own things a margin of 2 m over that.
const FINE = (() => {
  const P = [];
  for (let i = 0; i < ROUTE.length - 1; i++) for (let j = 0; j < 8; j++) { const t = j / 8, a = ROUTE[i], b = ROUTE[i + 1]; P.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]); }
  P.push(ROUTE[ROUTE.length - 1]);
  return P;
})();
export function routeDistance(x, y, z) {
  let best = Infinity;
  for (const p of FINE) { const dx = p[0] - x, dy = p[1] - y, dz = p[2] - z, d = dx * dx + dy * dy + dz * dz; if (d < best) best = d; }
  return Math.sqrt(best);
}
// The height of the flown line where it passes the bearing b in the canyon (for footbridges, cables and lamp lines
// that cross the canyon: keep 12 m over or under it).
export function routeHeightAt(b) { return spiral(Math.min(WIND.b1, Math.max(WIND.b0, b)))[1]; }
