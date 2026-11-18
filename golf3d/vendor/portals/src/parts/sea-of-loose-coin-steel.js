// A Sea of Loose Coin: the hall's own steel out over the gold (round r6). ONE FOOTBRIDGE across the hall from catwalk
// to catwalk. Our own drawing from real things (works footbridges, gantry walkways). Nothing lettered, no figure.
// The world calls buildBridge(ctx, parts, o) through the hero's hook `more`; it returns null where no rib of the hall
// can carry the bridge by its rule of place.
//
// ITS PLACE BY RULE. The bridge hangs from one of the hall's roof ribs (they stand at z = 209 - 12 k) and stands at the
// first of BRIDGE.ribs, in that order, that passes three tests, each by place:
//   (iii) no spout stands within BRIDGE.spout (9 m) of the rib along the hall; only where the hall offers no rib at
//         all by that measure, within BRIDGE.spoutLeast (6 m): a fall's stream stays within 2.2 m of its spout's axis
//         down to the truss's underside and its nozzle within 1.25 m, so 2.9 m of air and more lie between any fall
//         and the bridge's outermost steel;
//   (ii)  the coin lies BRIDGE.under (1.0 m) and more under the truss's underside (y 19.6) along the whole span, for z
//         within BRIDGE.band (1.5 m) of the rib;
//   (i)   the flown line passes BRIDGE.clear (5.5 m) and more from the steel that carries: deck, trusses, ties, rails.
// If no rib passes there is no bridge. THE LANE: what stands over the rail at a place of its own (a pair of hangers, a
// lamp on its post) stands only where it keeps the same 5.5 m from the flown line, and its mirror place across the
// hall's axis gives way with it; so every member that stands keeps 5.5 m, whoever comes or not. (The line runs 2 to
// 3 m east of the axis down this stretch of the hall, so the pair of hangers on the axis never stands.)
// ITS MAKE. A light Warren truss footbridge hung from the roof: the deck's top at the catwalks' height, 1.4 m broad,
// from catwalk to catwalk; under each edge a truss 1.4 m deep over all (the top chord is the deck's edge beam, the
// bottom chord's underside at y 19.6, a V of diagonals every 2.4 m), cross ties under the deck and between the bottom
// chords; a deck of grating bars with dark gaps on a dark plate; a tube handrail both sides (rails 0.55 and 1.1 m over
// the deck, a post every 2.4 m) that meets the catwalks' rail; pairs of rods (radius BRIDGE.rod) from a cross girder under
// the deck up to the rib's inner chord; the hall's caged lamps on posts by the north rail, every 6.6 m, their glass
// LAMP.up over the deck, lit always. Red oxide paint, a darker shade for diagonals, ties and hangers. It stands still.
// Nothing here reads the clock, the lens or the metres flown; the seed deals nothing but the rib (by the coin and the
// spouts). One stream of its own: 'bridge-lamps' (the halos' kit call).
import * as THREE from 'three';
// the hall's own measures and makers (HALL, LAMP, makeBag, cagedLamp, tube, archY) come from the hall's part through
// the world, which hands them over once before it builds (a part does not import another part)
let HALL, LAMP, makeBag, cagedLamp, tube, archY;
export function useHall(h) { ({ HALL, LAMP, makeBag, cagedLamp, tube, archY } = h); }

// the bridge's measures: the ribs in their order of trial; the clear air kept from the line; the coin's least depth
// under the truss and the band along the hall it is read in; the spouts' distance along the hall; the deck's end (x),
// half breadth, the truss's underside, the panel; where hangers and lamps have their places across the hall
export const BRIDGE = {
  ribs: [17, 29, 5, 41, -7], clear: 5.5, under: 1.0, band: 1.5, spout: 9, spoutLeast: 6,
  x: 29.7, half: 0.7, low: 19.6, panel: 2.4, rod: 0.05,
  hang: [0, 10, 20], lamps: [0, 6.6, 13.2, 19.8, 26.4],
};
const RED = [0.26, 0.065, 0.04], SHADE = [0.15, 0.04, 0.026], GAP = [0.008, 0.009, 0.011];
// the roof rib's inner chord (the hall's own numbers: the arch's points set 1.7 m inward): its height over x
const ARCH_X = [-32, -31.6, -30.5, -28.5, -25.5, -22, -18, -14, -10, -6.5, -1.5, 1.5, 6.5, 10, 14, 18, 22, 25.5, 28.5, 30.5, 31.6, 32];
function inward(x) {
  const e = 0.05, x0 = Math.max(-HALL.hw, x - e), x1 = Math.min(HALL.hw, x + e), dy = archY(x1) - archY(x0), dx = x1 - x0, l = Math.hypot(dx, dy) || 1;
  if (Math.abs(x) > HALL.hw - 0.2) return [-Math.sign(x), 0];
  return [dy / l, -dx / l];
}
export function chordY(x) {
  const pts = ARCH_X.map((ax) => { const n = inward(ax); return [ax + n[0] * 1.7, archY(ax) + n[1] * 1.7]; });
  for (let i = 0; i < pts.length - 1; i++) {
    if (x >= pts[i][0] && x <= pts[i + 1][0]) return pts[i][1] + (pts[i + 1][1] - pts[i][1]) * (x - pts[i][0]) / (pts[i + 1][0] - pts[i][0]);
  }
  return archY(x) - 1.7;
}
// the members' boxes at a rib [name, x0, y0, z0, x1, y1, z1]: the steel that carries; a pair of hangers; a lamp on its post
const carryBoxes = (z) => {
  const B = BRIDGE, y = HALL.catY;
  return [['bridge deck and trusses', -B.x, B.low, z - B.half - 0.06, B.x, y, z + B.half + 0.06],
    ['bridge rail south', -B.x, y, z + B.half - 0.09, B.x, y + 1.14, z + B.half],
    ['bridge rail north', -B.x, y, z - B.half, B.x, y + 1.14, z - B.half + 0.09]];
};
const hangBox = (z, x) => ['bridge hangers x ' + x, x - 0.07, HALL.catY - 0.3, z - BRIDGE.half - 0.16, x + 0.07, chordY(x) + 0.05, z + BRIDGE.half + 0.16];
const lampBox = (z, x) => ['bridge lamp x ' + x, x - 0.19, HALL.catY - 0.16, z - BRIDGE.half - 0.08, x + 0.19, HALL.catY + LAMP.up + 0.34, z - BRIDGE.half - 0.04 + LAMP.out + 0.19];

// THE RULE OF PLACE, a pure function of the flown line (path), the coin (hAt) and the spouts: every rib of the list
// with what each test reads there, in the order of trial
export function bridgeTrials(path, hAt, spouts) {
  const B = BRIDGE, v = new THREE.Vector3(), pts = [];
  for (let m = 0; m <= path.length; m += 0.25) { path.posAtDist(m, v); pts.push([v.x, v.y, v.z]); }
  const air = (b) => {
    let best = 1e9;
    for (const p of pts) {
      if (p[2] > b[6] + 40 || p[2] < b[3] - 40) continue;
      const d = Math.hypot(Math.max(0, b[1] - p[0], p[0] - b[4]), Math.max(0, b[2] - p[1], p[1] - b[5]), Math.max(0, b[3] - p[2], p[2] - b[6]));
      if (d < best) best = d;
    }
    return best;
  };
  return B.ribs.map((z) => {
    let spout = 1e9, gap = 1e9;
    for (const s of spouts) spout = Math.min(spout, Math.abs(s.z - z));
    for (let x = -B.x; x <= B.x + 1e-6; x += 0.3) for (let dz = -B.band; dz <= B.band + 1e-6; dz += B.band / 2) gap = Math.min(gap, B.low - hAt(x, z + dz));
    const carry = carryBoxes(z), steel = Math.min(...carry.map(air));
    // the lane: a place across the hall stands only if it and its mirror place keep the clear air
    const both = (box) => (x) => air(box(z, x)) >= B.clear && air(box(z, -x)) >= B.clear;
    const sides = (list) => list.flatMap((x) => (x === 0 ? [0] : [-x, x])).sort((a, b) => a - b);
    const hang = sides(B.hang.filter(both(hangBox))), lamps = sides(B.lamps.filter(both(lampBox)));
    const boxes = [...carry, ...hang.map((x) => hangBox(z, x)), ...lamps.map((x) => lampBox(z, x))];
    return { z, spout, gap, steel, air: Math.min(...boxes.map(air)), hang, lamps, boxes, fit: gap >= B.under && steel >= B.clear };
  });
}
// the first rib that passes with the spouts at their full distance; where there is none, the first with them at the least
export const chooseRib = (trials) => trials.find((t) => t.fit && t.spout >= BRIDGE.spout) || trials.find((t) => t.fit && t.spout >= BRIDGE.spoutLeast) || null;
export function placeBridge(path, hAt, spouts) {
  return chooseRib(bridgeTrials(path, hAt, spouts));
}

// a square bar from a to b with flat faces: half breadths s (level, square to the bar) and t (the other way); its
// ends are open (they stand inside other members) unless cap is set, which closes the end at b
function bar(bag, a, b, s, t, col, cap = false) {
  const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], L = Math.hypot(d[0], d[1], d[2]) || 1;
  for (let i = 0; i < 3; i++) d[i] /= L;
  let u = [d[2], 0, -d[0]]; const ul = Math.hypot(u[0], u[2]);
  u = ul < 1e-4 ? [0, 0, 1] : [u[0] / ul, 0, u[2] / ul];
  const w = [d[1] * u[2] - d[2] * u[1], d[2] * u[0] - d[0] * u[2], d[0] * u[1] - d[1] * u[0]];
  const P = (q, i, j) => [q[0] + u[0] * s * i + w[0] * t * j, q[1] + u[1] * s * i + w[1] * t * j, q[2] + u[2] * s * i + w[2] * t * j];
  const C = [[1, 1], [-1, 1], [-1, -1], [1, -1]];
  for (let k = 0; k < 4; k++) {
    const c0 = C[k], c1 = C[(k + 1) % 4], wd = 2 * (k % 2 ? t : s);
    bag.quad(P(a, c0[0], c0[1]), P(a, c1[0], c1[1]), P(b, c1[0], c1[1]), P(b, c0[0], c0[1]), col, [[0, 0], [wd, 0], [wd, L], [0, L]]);
  }
  if (cap) bag.quad(P(b, 1, 1), P(b, -1, 1), P(b, -1, -1), P(b, 1, -1), col, [[0, 0], [2 * s, 0], [2 * s, 2 * t], [0, 2 * t]]);
}

// parts: what the hero hands on { U, sea, seaMesh, steel, steelWeb, object, updaters, ... }
// o: { path (the flown line), fx, stream (a named stream of the seed), hour }
export async function buildBridge(ctx, parts, o = {}) {
  const S = parts.seaMesh, hAt = (x, z) => S.bil((x + HALL.hw) / S.dx, (HALL.zS - z) / S.dz);
  const at = placeBridge(o.path, hAt, parts.sea.spouts);
  if (!at) return null;
  await ctx.yield();
  const B = BRIDGE, Z = at.z, X = B.x, yT = HALL.catY, e = B.half - 0.06, n = Math.floor(X / B.panel), hp = B.panel / 2;
  const bag = makeBag(), glow = makeBag(), group = new THREE.Group();
  group.name = 'footbridge';
  // a level face looking up (the plate's plain middle for its uv) and one looking down
  const up = (x0, x1, z0, z1, y, col, u0) => bag.quad([x0, y, z1], [x1, y, z1], [x1, y, z0], [x0, y, z0], col, [[u0, 0.8], [u0 + x1 - x0, 0.8], [u0 + x1 - x0, 0.8 + z1 - z0], [u0, 0.8 + z1 - z0]]);
  // the two trusses: the top chord is the deck's edge beam from catwalk to catwalk; the bottom chord hangs under it
  // between the end diagonals; a V of diagonals in every panel
  for (const s of [-1, 1]) {
    const zc = Z + s * e;
    bag.box(-X, yT - 0.16, zc - 0.06, X, yT, zc + 0.06, RED);
    bag.box(-n * B.panel + hp - 0.1, B.low, zc - 0.06, n * B.panel - hp + 0.1, B.low + 0.12, zc + 0.06, RED);
    for (let k = -n; k < n; k++) {
      const x = k * B.panel;
      bar(bag, [x, yT - 0.08, zc], [x + hp, B.low + 0.06, zc], 0.03, 0.04, SHADE);
      bar(bag, [x + hp, B.low + 0.06, zc], [x + B.panel, yT - 0.08, zc], 0.03, 0.04, SHADE);
    }
    // the handrail: two tubes that run into the catwalk's rail, a post at every panel point
    for (const dy of [0.55, 1.1]) tube(bag, [-X + 0.04, yT + dy, Z + s * (B.half - 0.04)], [X - 0.04, yT + dy, Z + s * (B.half - 0.04)], 0.04, RED, 6);
    for (let k = -n; k <= n; k++) bar(bag, [k * B.panel, yT, Z + s * (B.half - 0.04)], [k * B.panel, yT + 1.1, Z + s * (B.half - 0.04)], 0.035, 0.035, RED);
  }
  await ctx.yield();
  // cross ties: under the deck at every panel point, between the bottom chords at every low point of the V
  for (let k = -n; k <= n; k++) bar(bag, [k * B.panel, yT - 0.13, Z - e + 0.05], [k * B.panel, yT - 0.13, Z + e - 0.05], 0.04, 0.03, SHADE);
  for (let k = -n; k < n; k++) bar(bag, [k * B.panel + hp, B.low + 0.06, Z - e + 0.05], [k * B.panel + hp, B.low + 0.06, Z + e - 0.05], 0.035, 0.035, SHADE);
  // the deck between the edge beams: a dark plate, three bearers along it, grating bars across it (0.18 m bars, 0.12 m
  // gaps), and its underside
  const z0 = Z - e + 0.06, z1 = Z + e - 0.06;
  up(-X, X, z0, z1, yT - 0.04, GAP, 1.0);
  for (const dz of [-0.3, 0, 0.3]) bag.quad([-X, yT - 0.025, Z + dz + 0.03], [X, yT - 0.025, Z + dz + 0.03], [X, yT - 0.025, Z + dz - 0.03], [-X, yT - 0.025, Z + dz - 0.03], SHADE, [[1.15, 0], [1.15, 2 * X], [1.21, 2 * X], [1.21, 0]]);
  for (let i = 0, x = -X; x < X - 0.01; i++, x = -X + i * 0.3) up(x + 0.06, Math.min(X, x + 0.24), z0, z1, yT - 0.01, RED, 1.0);
  bag.quad([-X, yT - 0.1, z0], [X, yT - 0.1, z0], [X, yT - 0.1, z1], [-X, yT - 0.1, z1], SHADE, [[0.5, 0.5], [0.5 + 2 * X, 0.5], [0.5 + 2 * X, 0.5 + z1 - z0], [0.5, 0.5 + z1 - z0]]);
  await ctx.yield();
  // the hangers: at each place a cross girder under the edge beams, a rod from each of its ends up to a crosshead
  // under the rib's inner chord (the rods lean in to the rib, which stands over the bridge's middle)
  for (const x of at.hang) {
    const yc = chordY(x);
    bag.box(x - 0.06, yT - 0.3, Z - B.half - 0.16, x + 0.06, yT - 0.16, Z + B.half + 0.16, RED);
    bag.box(x - 0.07, yc - 0.14, Z - 0.2, x + 0.07, yc + 0.02, Z + 0.2, SHADE);
    for (const s of [-1, 1]) tube(bag, [x, yT - 0.23, Z + s * (B.half + 0.1)], [x, yc - 0.06, Z + s * 0.13], B.rod, SHADE, 6);
  }
  // the lamps: a post on the north edge beam's outer face, the hall's caged lamp on its arm over the deck
  const zp = Z - B.half - 0.04, lit = [];
  for (const x of at.lamps) {
    bar(bag, [x, yT - 0.16, zp], [x, yT + LAMP.up + 0.34, zp], 0.04, 0.04, RED, true);
    cagedLamp(bag, glow, x, yT + LAMP.up, zp + LAMP.out, 0, 1);
    lit.push([x, yT + LAMP.up, zp + LAMP.out]);
  }
  const steel = new THREE.Mesh(bag.geometry(), parts.steel); steel.name = 'footbridge-steel'; group.add(steel);
  let tris = bag.count();
  if (lit.length) {
    const night = o.hour === 'night';
    const lampMat = new THREE.MeshBasicMaterial({ color: night ? new THREE.Color().setRGB(4.6, 3.3, 1.6) : new THREE.Color().setRGB(4.0, 2.7, 1.1) });
    const glass = new THREE.Mesh(glow.geometry(), lampMat); glass.name = 'footbridge-lamp-glass'; group.add(glass);
    tris += glow.count();
    if (o.fx && o.stream) {
      // a small warm halo round each lamp, as round the hall's own
      const halos = o.fx.makeGlows({ rng: o.stream('bridge-lamps'), positions: lit, color: '#ffc27a', size: night ? 1.8 : 1.5, intensity: night ? 2.6 : 1.9, time: parts.U.uTime });
      group.add(halos.object); parts.updaters.push((dt, t, cam) => halos.update(dt, t, cam));
      tris += 2 * lit.length;
    }
  }
  parts.object.add(group);
  const out = { z: Z, tris, boxes: at.boxes, air: at.air, gap: at.gap, spout: at.spout, hang: at.hang, lamps: at.lamps };
  parts.bridge = out;
  return out;
}
