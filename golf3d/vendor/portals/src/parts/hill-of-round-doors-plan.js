// hill-of-round-doors: the numbers the world and its parts share (metres; y up; the stream's water at y 0; south is
// +z, east is +x). Written by the designer; change a number only by the designer's word. Import them; never retype
// one. Everything is built about three times life size (SCALE): a round door is 4.2 m across, so that the flight is
// that of a small bird up the lane and in at the door.
export const SCALE = 3;
const ss = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };

// THE WATER: a stream flowing west along x, its middle at z = streamZ(x), its half width streamHalf(x); it widens to
// the mill pond about x = -40. Surface at y 0.
export const WATER = 0;
export function streamZ(x) { return 168 + 8 * Math.sin(x / 95); }
export function streamHalf(x) { return 13 + 9 * Math.exp(-((x + 40) / 45) * ((x + 40) / 45)); }

// THE HILL: one broad green hill north of the stream, its top about y 66 at HILL.
export const HILL = { x: 45, z: -150, height: 62, sx: 130, sz: 110, floor: 4.5 };
// A knoll on the hill's side, right behind the last home: the great oak stands on it, over the green door.
export const KNOLL = { x: 63.6, z: -86.5, height: 14, sx: 16, sz: 26 };
export const OAK = { x: 62, z: -88, trunk: 2.6, height: 38, crown: 24 };
function roll(x, z) { return 0.8 * Math.sin(x / 37 + 1.3) * Math.cos(z / 41) + 0.5 * Math.sin((x + z) / 23); }
// The untouched ground: the hill, the valley floor, the stream's bed and banks, the meadow south of the stream.
export function baseY(x, z) {
  const zs = streamZ(x), s = Math.abs(z - zs) - streamHalf(x);
  if (s <= 0) return -0.4 - 2.2 * ss(0, -8, s);
  const dx = (x - HILL.x) / HILL.sx, dz = (z - HILL.z) / HILL.sz;
  const kx = (x - KNOLL.x) / KNOLL.sx, kz = (z - KNOLL.z) / KNOLL.sz;
  const land = z < zs ? HILL.floor + HILL.height * Math.exp(-0.5 * (dx * dx + dz * dz)) + KNOLL.height * Math.exp(-0.5 * (kx * kx + kz * kz)) + roll(x, z) : 3.5 + roll(x, z);
  return -0.4 + (land + 0.4) * ss(0, 14, s);
}

// THE PARTY FIELD: a level oval meadow at the hill's foot, east of the road; in it THE PARTY TREE.
export const FIELD = { x: 78, z: 80, rx: 54, rz: 42, y: 9, blend: 14 };
export const TREE = { x: 78, z: 78, trunk: 3.2, height: 46, crown: 31, boughs: 23 };     // boughs: no bough or leaf hangs lower than this y

// THE LANES: level benches cut into the ground. Each is a line of [x, y, z] places; the lane is 7 m wide, and on its
// uphill side a level garden strip reaches 10.5 m from the middle line (the fronts of the homes stand at 10 m).
export const LANE_HALF = 3.5, GARDEN = 10.5;
export const ROAD = [[0, 4.6, 140], [0, 7, 122], [3, 9.5, 96], [10, 13.5, 68], [24, 18, 44], [40, 20.7, 30]];
const H1 = [-0.9438, -0.3304], H2 = [0.9806, -0.1961];        // the headings of lane 1 (west) and lane 2 (east)
export const LANE1 = { from: [40, 30], heading: H1, length: 106, y0: 20.7, y1: 23.3, uphill: [0.3304, -0.9438] };
export const LANE2 = { from: [-56, -62.7], heading: H2, length: 92, y0: 38, y1: 55, uphill: [-0.1961, -0.9806] };
export function laneAt(L, s) { return [L.from[0] + L.heading[0] * s, L.y0 + (L.y1 - L.y0) * s / L.length, L.from[1] + L.heading[1] * s]; }
// The bend between them: the lane turns right about BEND through 149 degrees at 30 m radius, climbing from 23.3 to 38.
export const BEND = { x: -50.09, z: -33.31, r: 30, a0: 0, turn: 149.4, y0: 23.3, y1: 38 };
export function bendAt(k) {            // k from 0 (the end of lane 1) to 1 (the start of lane 2)
  const a = k * BEND.turn * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
  // the place of lane 1's end about the bend's middle, turned to the right by a
  const rx = -60.0 - BEND.x, rz = -5.0 - BEND.z;
  return [BEND.x + rx * c - rz * s, BEND.y0 + (BEND.y1 - BEND.y0) * k, BEND.z + rx * s + rz * c];
}

// THE HOMES: round-doored fronts set into the turf. Each: the middle of its front at ground level (x, z), its garden's
// level y, the way it faces (fx, fz: out of the hill), the half width w and the height h of its turf mound. The
// front's outline is the mound's own section: frontTop(home, u) over the garden level, u metres along the front from
// its middle. kind 'top' is the last home, with the round GREEN door the flight goes in at.
function onLane(L, s, w, h) { const p = laneAt(L, s); return { x: p[0] + L.uphill[0] * 10, z: p[2] + L.uphill[1] * 10, y: Math.round(p[1] * 10) / 10, fx: -L.uphill[0], fz: -L.uphill[1], w, h, kind: 'lane' }; }
function free(x, z, fx, fz, w, h) { const n = Math.hypot(fx, fz); return { x, z, y: null, fx: fx / n, fz: fz / n, w, h, kind: 'far' }; }
export const TOP = { x: 34.2, z: -80.7, y: 55, fx: -H2[0], fz: -H2[1], w: 11, h: 8.2, kind: 'top' };
export const HOMES = [
  onLane(LANE1, 22, 7.5, 6.4), onLane(LANE1, 40, 7, 6), onLane(LANE1, 58, 8, 6.8), onLane(LANE1, 76, 7, 6.2), onLane(LANE1, 94, 7.5, 6.5),
  onLane(LANE2, 16, 7.5, 6.5), onLane(LANE2, 34, 7, 6), onLane(LANE2, 52, 7.5, 6.6),
  { x: -70, z: -34.8, y: 30.6, fx: -1, fz: 0, w: 7.5, h: 6.4, kind: 'lane' },             // inside the bend, facing west
  free(-24, 104, 1, 0.25, 7, 6), free(-31, 84, 1, 0.1, 7.5, 6.4),                          // two by the road north of the bridge
  free(96, -22, 0.2, 1, 7, 6), free(126, -58, 0.35, 1, 7.5, 6.3), free(-12, -32, -0.1, 1, 7, 6), free(-118, -44, -0.5, 1, 7, 6),
  free(150, 10, 0.5, 1, 7, 6), free(88, -92, 0.6, 1, 7.5, 6.4), free(-150, 20, -0.6, 1, 7, 6), free(170, -110, 1, 0.6, 7, 6),
  TOP,
];
export function frontTop(home, u) { const k = 1 - (u / home.w) * (u / home.w); return k <= 0 ? 0 : home.h * Math.pow(k, 0.7); }
export const DOOR = { r: 2.1, sill: 0.5, topR: 2.6 };          // a round door's opening: 2.1 m radius; the green door's: 2.6
// THE HALL behind the green door: a round passage, its floor 0.5 over the garden's level, running `depth` m straight
// in from the door on the door's own line. The land builder leaves the ground out over its footprint (from 0.6 m
// behind the front to depth + 1, `half` either side of the line); the homes builder closes the hall all round.
export const HALL = { depth: 13, half: 4.8, r: 3.6 };

// THE GROUND everyone stands on: the untouched ground, the party field levelled, the lanes benched in, each home's
// garden levelled and its mound raised behind its front. One function for every builder; nobody changes the ground.
const SEGS = (() => {
  const S = [], add = (a, b, side, g) => S.push({ ax: a[0], ay: a[1], az: a[2], bx: b[0], by: b[1], bz: b[2], side, g });
  for (let i = 0; i < ROAD.length - 1; i++) add(ROAD[i], ROAD[i + 1], 0, LANE_HALF);
  add(laneAt(LANE1, 0), laneAt(LANE1, LANE1.length), 1, GARDEN);
  for (let i = 0; i < 12; i++) add(bendAt(i / 12), bendAt((i + 1) / 12), 1, GARDEN);
  add(laneAt(LANE2, 0), laneAt(LANE2, LANE2.length + 3), -1, GARDEN);
  return S;
})();
function benched(x, z) {
  let y = baseY(x, z);
  { const f = FIELD, e = Math.hypot((x - f.x) / f.rx, (z - f.z) / f.rz), w = 1 - ss(1, 1 + f.blend / Math.min(f.rx, f.rz), e); y += (f.y - y) * w; }
  let best = Infinity, L = 0, d = 0, g = 0;
  for (const s of SEGS) {
    const ex = s.bx - s.ax, ez = s.bz - s.az, ll = ex * ex + ez * ez, t = Math.min(1, Math.max(0, ((x - s.ax) * ex + (z - s.az) * ez) / ll));
    const qx = s.ax + ex * t, qz = s.az + ez * t, dist = Math.hypot(x - qx, z - qz);
    if (dist < best) { best = dist; L = s.ay + (s.by - s.ay) * t; g = s.g; const cr = ex * (z - s.az) - ez * (x - s.ax); d = dist * (s.side === 0 ? 1 : (cr > 0 ? 1 : -1) * s.side); if (s.side === 0) d = dist; }
  }
  const w = d >= 0 ? 1 - ss(g, g + 5, d) : 1 - ss(LANE_HALF, LANE_HALF + 6, -d);
  return y + (L - y) * w;
}
for (const h of HOMES) if (h.y === null) h.y = Math.round(benched(h.x + h.fx * 4, h.z + h.fz * 4) * 10) / 10;
export function groundY(x, z) {
  let y = benched(x, z);
  for (const h of HOMES) {
    const rx = x - h.x, rz = z - h.z, v = -(rx * h.fx + rz * h.fz), u = rx * h.fz - rz * h.fx, au = Math.abs(u);
    if (au > h.w + 3 || v < -11 || v > 20) continue;
    if (v < 1.2) { const w = (1 - ss(h.w, h.w + 2.5, au)) * (1 - ss(8, 10.5, -v)); y += (h.y - y) * w; }
    if (v >= 1.2 && au < h.w) y = Math.max(y, h.y + frontTop(h, u) * ss(1.2, 2.2, v) * (1 - ss(8, 18, v)));
  }
  return y;
}

// THE BRIDGE, THE MILL: a stone bridge of two arches carries the road over the stream along x = 0; the mill stands
// on the north bank at the pond, its great wheel on its south wall turning in the water, seen face-on from the south.
export const BRIDGE = { x: 0, z0: 196, z1: 140, width: 9, crownY: 6, endY: 4.3, parapet: 1.2 };
export function bridgeDeck(z) { const t = (z - BRIDGE.z1) / (BRIDGE.z0 - BRIDGE.z1); return BRIDGE.endY + (BRIDGE.crownY - BRIDGE.endY) * 4 * t * (1 - t); }
export const MILL = { x0: -52, x1: -28, z0: 118, z1: 142, eaves: 16, ridge: 26, wheel: { x: -40, y: 5.5, z: 145.5, r: 7, thick: 3 } };

// THE FLIGHT: in over the water, over the bridge, right into the party field and once round the party tree under
// its boughs (the tree on the left hand), up to lane 1 and west along it past five homes (on the right), round the
// bend to the right, climbing, and straight east along lane 2 to the green door, in at it and along the hall.
export const ENTRY = { x: 25, y: 12, z: 235 };
const LAST = 101;                                             // the last leg: lane 2's line from its start to 9 m inside the door
export const EXIT = { x: LANE2.from[0] + H2[0] * LAST, y: 50 + 0.088 * LAST, z: LANE2.from[1] + H2[1] * LAST };
export const DOOR_AT = { x: TOP.x, y: 50 + 0.088 * 92, z: TOP.z, left: LAST - 92 };      // the green door's middle; `left`: metres of route still to fly there
export const PORTAL_RADIUS = 2.3;
// THE GREEN DOOR'S SWING AND THE RING'S FIRST DRAWING, in metres of route still to fly (one place for both builders):
// the ring is first drawn where the last leg begins (lane 2's line, LAST metres from the end), behind the shut leaf;
// the leaf stands shut until 5 m further on, swings inward as we fly up the lane toward it, and rests open with 60 m
// still to fly, so that the whole of the lane is flown toward the open, glowing doorway. The door's own plane is
// passed with DOOR_AT.left (9) metres still to fly.
export const DOOR_SWING = { drawWithin: LAST, shutUntil: LAST - 5, openAt: 60 };
function knots() {
  const R = Math.PI / 180;
  const K = [[25, 12, 235], [16.3, 12, 219.3], [8.4, 12, 204.2], [2.6, 12, 190], [0, 12, 176], [0, 12, 160], [0, 12.3, 147]];
  for (const a of [0, 22.5, 45, 67.5, 90]) K.push([32 - 32 * Math.cos(a * R), 12.6 + 2.4 * a / 90, 138 - 32 * Math.sin(a * R)]);     // right, onto the field
  K.push([46, 15, 106], [62, 15, 106]);
  const loop = 157, rr = 28;                                   // once round the party tree, the tree on the left hand
  for (const a of [0, 26, 52, 78, 104, 130, loop]) K.push([TREE.x + rr * Math.sin(a * R), 15 + 2.5 * Math.max(0, (a - 100) / (loop - 100)), TREE.z + rr * Math.cos(a * R)]);
  const e = K[K.length - 1], hx = Math.cos(loop * R), hz = -Math.sin(loop * R), to = [laneAt(LANE1, 0)[0] - LANE1.uphill[0] * 1.5, LANE1.y0 + 8, laneAt(LANE1, 0)[2] - LANE1.uphill[1] * 1.5];
  const run = Math.hypot(to[0] - e[0], to[2] - e[2]);
  for (const t of [run / 3, 2 * run / 3]) K.push([e[0] + hx * t, e[1] + (to[1] - e[1]) * t / run, e[2] + hz * t]);
  const off = (p, L, m) => [p[0] - L.uphill[0] * m, p[1] + 8, p[2] - L.uphill[1] * m];
  for (const s of [0, 20, 40, 60, 80, 98]) K.push(off(laneAt(LANE1, s), LANE1, 1.5));
  for (let i = 1; i <= 8; i++) {                               // round the bend, 1.5 m outside the lane's middle, easing back to it
    const k = i / 8, p = bendAt(k), m = 1.5 * (1 - Math.max(0, (k - 0.6) / 0.4)), ox = (p[0] - BEND.x) / BEND.r, oz = (p[2] - BEND.z) / BEND.r;
    K.push([p[0] + ox * m, 31.3 + 18.7 * k, p[2] + oz * m]);
  }
  for (const s of [20, 40, 60, 80, 92]) K.push([LANE2.from[0] + H2[0] * s, 50 + 0.088 * s, LANE2.from[1] + H2[1] * s]);
  K.push([EXIT.x, EXIT.y, EXIT.z]);
  return K;
}
export const ROUTE = knots();
// How far a place is from the flown line, to within about a metre (a fine polyline through the knots; the world
// file counts the true line itself).
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
// How far a place is from the flown line in plan only, and the line's height there (for things on the ground).
export function routeOver(x, z) {
  let best = Infinity, y = 0;
  for (const p of FINE) { const dx = p[0] - x, dz = p[2] - z, d = dx * dx + dz * dz; if (d < best) { best = d; y = p[1]; } }
  return { dist: Math.sqrt(best), y };
}
