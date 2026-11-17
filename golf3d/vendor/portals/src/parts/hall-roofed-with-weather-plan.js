// hall-roofed-with-weather: the numbers the world and its parts share (metres; floor y = 0; the hall runs along -z from its
// low end wall to its high end wall). Written by the designer; change a number only by the designer's word.

export const HALL = {
  x0: -33, x1: 33,            // inner faces of the two long walls (66 wide)
  zLow: 20, zHigh: -150,      // inner faces of the low end wall and the high end wall (170 long)
  wallTop: 64,                // the stone stands whole to here; nothing above about 44 is ever seen from inside (cloud)
  cloudBase: 46,              // the level of the cloud's flat base (pouches may hang to 42; under the storm's shelf the skin may hang to 39.5)
};

export const HEARTH = { x: 0, z: -46, across: 8, flameTop: 7 };   // an eight-sided kerb, 8 m across, on the open floor

// One table, laid in slow bends like a river down the hall. Its centre line:
// (z1 was -136, where the centre line crosses the hall's axis aslant, so that from far off the last bend lay like a short
// cross table under the great window: the audit's caution. At -118 the line is at its outermost and runs lengthwise.)
export const TABLE = { z0: -4, z1: -118, amp: 16, wave: 72, width: 3.0, top: 2.4, bench: 1.4, dressTop: 3.7 };
export function tableX(z) { return TABLE.amp * Math.cos((2 * Math.PI * (z + 46)) / TABLE.wave); }

export const GALLERY = { z0: 12, z1: 20, floor: 13, rail: 15.5 };   // the timber screen and its gallery at the low end

export const WINDOWS = { perSide: 7, bay: 170 / 7, width: 9, sill: 16, head: 38 };
export function windowZ(i) { return HALL.zLow - (i + 0.5) * WINDOWS.bay; }   // i = 0..6, both long walls
export const GREAT_WINDOW = { x0: -11, x1: 11, sill: 14, head: 40 };         // in the high end wall, five lights

// The flight begins here, level, heading -z. x stands 11.5 m from the -x wall's face: the opening's half width (7) plus
// 2 m, plus the deepest relief of that wall (a pier's leaf capital; the hall builds it 1.67 m proud and may build
// nothing there over 1.8), plus a margin: so nothing of the wall stands in the 9 m tube behind the entry. (It was -24,
// 9.0 m from the bare face: the piers stood inside the tube.) The low end wall's own shaft stands on this line too,
// 30.3 m behind the entry: beyond the tube's 30 m.
export const ENTRY = { x: -21.5, y: 33, z: -12 };
export const EXIT = { x: 0, y: 57, z: -6 };       // the ring's centre, in the cloud over the low end

// THE WEATHER crosses the hall sideways, from the -x wall to the +x wall, as the flight goes on: the storm act goes by the
// share of the flight flown, u (the design's section 5 declares it). ITS TIMETABLE IS GIVEN BY PLACES OF THE ROUTE, never
// by a typed share: the world file finds the share of the flight at each place and hands the four in.
//   meets:    where we come round the far side of the fire and face the -x wall: the front reaches that wall's face;
//   crossed:  where the low pass ends: the front has reached the +x wall's face, the whole floor is under the weather;
//   slowFrom, slowTo: it slows while we turn round at the high end, from the top of the climb to the end of the turn,
//             so that it stands along the +x wall (our left hand) for the whole way home;
// and at the flight's end the storm's rear stands at the +x wall's face. The storm is a band STORM_WIDTH wide whose
// leading edge is at front(u); behind it the cloud is torn.
export const STORM_WIDTH = 60;
export function makeStorm(k) {
  const v = (HALL.x1 - HALL.x0) / (k.crossed - k.meets);                    // metres of crossing per whole flight while steady
  const span = k.slowTo - k.slowFrom, mid = k.slowFrom + span / 2;
  const slowed = (u) => { const t = Math.min(Math.max((u - k.slowFrom) / span, 0), 1); return u > k.slowTo ? u - mid : span * (t * t * t - 0.5 * t * t * t * t); };
  // the slowing that leaves the rear at the +x wall's face when u = 1 (never so much that the front would turn back)
  const c = Math.min(0.9 * v, (HALL.x0 + v * (1 - k.meets) - (HALL.x1 + STORM_WIDTH)) / (1 - mid));
  const front = (u) => HALL.x0 + v * (u - k.meets) - c * slowed(u);
  const back = (u) => front(u) - STORM_WIDTH;
  // 0 outside the band, 1 well inside it, eased over 10 m at each edge.
  const at = (x, u) => { const a = Math.min(Math.max((front(u) - x) / 10, 0), 1), b = Math.min(Math.max((x - back(u)) / 10, 0), 1), m = Math.min(a, b); return m * m * (3 - 2 * m); };
  return { front, back, at };
}
