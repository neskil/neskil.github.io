// Through the Door in the Ivy (garden-behind-the-ivy-wall): the shared makers of the garden and the plan they stand on.
// Inspired by The Secret Garden, Frances Hodgson Burnett, 1849 to 1924. No figure, no lettering, no known garden or house.
//
// THE SCALE: everything is built at THREE AND A HALF TIMES LIFE SIZE, every thing alike (a brick is 0.75 m long, the
// garden walls 12 m high). THE DOOR STANDS 5.0 m WIDE in the clear (2.5 m to either hand of the flown line, the line
// through its middle) and 7.0 m high under its stone lintel, over a step 0.3 m high.
// THE PLAN'S AXES: x east is depth (the door wall's inner face is x 0, the garden lies x 0 to 185), y up, z south
// (the right hand of an eastward heading); the door's centre is z 0; the ground at the door is y 0.
// THE SEASON (step G4): one function of place, seasonAt(x, z): S is x over 130 held to 0..1 inside the garden with a slow
// wobble of place of at most 8 m of x, and 0 outside. Its figures are typed once, in SEASON below.
// THE SIGHT LANE (a rule of place, the same on every seed): a straight lane from the sill (0, 0) to the great rose tree
// (160, 14), 16 m wide as far as x 100 and widening to 30 m at the tree; no trunk in it, nothing hanging into it below 30 m.
// THE ROUTE is laid here by arithmetic (step G1), the same on every seed: straights and arcs, never a table of u.
// THE PLACE'S OWN RULE OF THE BRIDGES (G11): old roses have bridged the way through the garden (GREY_ROSE, bridgePlan).
// THE WAY UNDER THE LINE (G11, WAY): every tuft's and every flower's top, at full sway, stands 2.5 m and more from the
// flown line, by place at build: short turf and a verge under the line, the brief's grass walk, mown and trodden.
// THE SHADE AT ITS OWN HEIGHT (G12, makeSun): a wall shades what stands UNDER its top; what stands over a wall's top (a rose's or an evergreen's crest, ivy on a coping, the yew's top, a tree's top) takes the sun, by its own place and height at build.
// THE ASKS SAY THEIR WORK (G12): every ask for a hand-back in this file carries a count of the work done since the ask before it (a typed figure, or so many triangles, rows or rounds at a typed figure each; a unit is about a millisecond of the builder's machine). The world's one meter passes an ask on to the engine only when those counts are full. No clock is read; an ask, kept or left out, changes no number and no draw of a stream. The west cut's three passes run as plain functions over runs of 32768 corners or triangles (the same statements in the same order).
// WHAT READS THE EYE IN THIS FILE (the owner's rule of reading, said plainly at G8):
// - AS LIGHT DOES: the bell glasses' rim sheen; THE GLINT ON IRON, KEY AND KNOB (G11: the sun's light thrown to the
//   eye, by the sun's direction and the bearing from the place to the eye; no lamp of the view's frame); the bulbs'
//   leaves lit from either side (an up normal turned to the eye's side); the kit's sheen, backlight and rim.
// - A LEVEL OF DETAIL BY WHERE THE EYE STANDS, never by where it looks and never by a distance (the owner's law,
//   said in the open): THREE SWAPS, each one flag by the eye's side of a typed plane of the plan, with no sinking and
//   no blend, and NOTHING LEFT OUT: every set is drawn at every distance, as itself or as its far form.
//   1. THE MIDDLE'S FINE FLOWERS (LAWN's fine daffodils, narcissi, bluebells and iris wherever they are dealt, the few in a lane band too, and tier N's pools; not the lane's other sets, the crocus by the line or the washes): while the eye is west of x 0, the door wall's inner face (the line's metres 0 to 120.6), each stands as farStandIn, two triangles at its own place, turn, scale and tint; measured, near and far: the same height, the same mean colour, the same showing area (far over near 1.00).
//   2. THE LAST LAWN'S border plants and daisies and THE YEW'S SHAG: while the eye is west of x 30, where the door's shade ends (metres 0 to 151.4), the plants stand as farStandIn (height, mean colour and area as in 1) and the shag as broad kites, one for every few of a kind; measured on seeds 1 to 300, near and far: sprays 592 and 586 m2, fallen needles 107 and 96, tufts 42 and 42 (the whole shag 0.97 to 0.99 of its near area), every mean colour within 0.004.
//   3. THE DOOR WALL'S IVY (IVY_CUT: its mass, its single leaves, its sprays): while the eye is west of x -30 or east of x 30, 30 m from the wall's plane (metres 0 to 90.6 and from 151.4 on), each stands as its far form; measured, near and far: the mass 0.095 0.190 0.110 and 0.098 0.194 0.112 at the near's own cover; a leaf as a round of its own area (0.964 of its frame) in its own mean colour; the sprays 0.138 0.268 0.150 and 0.139 0.270 0.151 over the leaves' own share (0.287).
//   BESIDE THE THREE, and no level of detail by the eye: THE TWIG SPRAYS' far form reads no eye at all (a spray built
//   30 m and more from the flown line in plan stands in it from every place: a cut by the spray's own place, with
//   the near form's own colour and cover). THE WEST CUT (WEST_CUT) leaves out only WHAT CANNOT SHOW: while the eye
//   stands west of the kitchen garden door's east jamb (x -53.5, derived from the plan: the line's metres 0 to 66.5)
//   the garden's inside is drawn in the triangles that can show from that stretch over the door wall's top, through
//   the doorway or past the wall's ends (splitWest: a triangle by its own place, from the eye places of that
//   stretch); what the wall hides from every such place is drawn from that plane on. THE KIT'S GRASS has no handle
//   on its fade but the fade pair: it is handed 400 to 500 m, which begins beyond the farthest tuft from any place
//   on the line (342 m at most, by the plan's corners), so that fade never acts in this place.
// - THE TWO SHADOW SHEETS (SHADOW_SHEET and WALL_SHADE: flat multiply layers with no thickness) have no distance of
//   their own (G8b): each sheet's strength is times the fog's own clear share at that place (the scene's fog, its
//   density handed in by the world: about 96 parts in 100 at 190 m), so that a far shadow pales exactly as the ground
//   or the brick under it does and by nothing else. The ground sheet's moving dapple goes to its own mean (the baked
//   shade, whole) as the pixel's footprint on the ground outgrows it.
// - Nothing else: no bird, insect, petal, leaf, bough or wall is lit, faded, hidden, thinned or sized by its distance
//   from the lens; every drawn pattern is let go by the pixel's footprint to its own mean.
// THE ONE HASH THIS PART WRITES ITSELF IN A SHADER: gmHash (HASH_GLSL), which is the kit's own hash12, a hash without
// sine (constants .1031 and 33.33), written here only because the part needs it inside its own shader chunks; the
// kit's own stands in src/kit/fx.js, in its GLSL_HASH snippet (docs/kit/fx.md). (hash2, the makers' lattice hash in
// plain JS, is this world's own, of G8b: said at its place.)
import * as THREE from 'three';
import * as flora from '../kit/flora.js';

const RAD = Math.PI / 180;
const sstep = (a, b, v) => { const t = Math.max(0, Math.min(1, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
// THE NUMBER OF A PLACE: one number in 0..1 from two numbers (placeNum), or from a point in space and an index
// (spaceNum): the common one-line sine form with constants of this world's own. Dealt by the place alone.
const placeNum = (a, b) => { const q = Math.sin(a * 73.4186 + b * 157.9432) * 31847.2619; return q - Math.floor(q); };
const spaceNum = (p, i) => { const q = Math.sin(p[0] * 19.6427 + p[1] * 83.1759 + p[2] * 46.3283 + i * 5.7193) * 31847.2619; return q - Math.floor(q); };
// A CHANCE IS DRAWN ONLY WHERE IT IS ONE (G11): a share of 1 and more is taken and a share of 0 refused without a draw
const lot = (rng, p) => p >= 1 || (p > 0 && rng() < p);

// ---------------------------------------------------------------- the plan (typed once; metres)
export const PLAN = {
  scale: 3.5,
  start: [-120, 5],
  boundaryX: -92, boundaryH: 5, boundaryT: 2.4, gateZ: 5, gateHalf: 5.5, pierH: 8, pierW: 3.2,
  walkZ: 11, walkNorthH: 9, walkSouthH: 3, wallT: 1.2, kitchenDoorX: -56, kitchenDoorHalf: 2.5, kitchenDoorH: 7, kitchenFarZ: -62,
  doorHalf: 2.5, doorClear: 7.0, stepH: 0.3, jambW: 1.1, lintelH: 1.3,
  garden: { x0: 0, x1: 185, z0: -62, z1: 52 }, wallH: 12,
  riseEndX: 115, riseTop: 10,
  lane: { to: [160, 14], half: 8, widenFromX: 100, halfAtEnd: 15, clearBelow: 30 },
  roseTree: [160, 14], dial: [104, -8], spade: [-36, -6.5], chair: [84, -24.3], fork: [47.1, -8.7],
  ringR: 4.4,
  alcove: { half: 6.5, thick: 4, mouthToRing: 15, back: 2, backThick: 3, yewH: 11 },
  sunTo: [-0.75, 0.41, 0.52],
};
// THE SEASON'S FIGURES, typed once: S = (x + wobble * w(x, z)) / depth held to 0..1 inside the garden's four walls and 0
// outside them; w is two slow waves of place ([per metre of z, per metre of x, phase, share], the shares adding to 1, so
// the wobble never passes 8 m of x). The windows every plant takes its state from: bare under `bud`, buds and a thin
// green veil from `bud` to `leaf`, full leaf from `leaf` to `bloom`, bloom from `bloom` and most at 1; green points and
// snowdrops from 0 to `bulbs`. Nothing here reads the clock, u, the lens or a seed.
export const SEASON = { depth: 130, wobble: 8, waves: [[0.045, 0, 0.7, 0.6], [0.11, 0.021, 2.1, 0.4]], bud: 0.25, leaf: 0.5, bloom: 0.7, bulbs: 0.3 };
export function seasonAt(x, z) {
  const G = PLAN.garden;
  if (x < G.x0 || x > G.x1 || z < G.z0 || z > G.z1) return 0;
  let w = 0;
  for (const [kz, kx, ph, share] of SEASON.waves) w += share * Math.sin(z * kz + x * kx + ph);
  return Math.max(0, Math.min(1, (x + SEASON.wobble * w) / SEASON.depth));
}

// ---------------------------------------------------------------- the line (step G1's arithmetic)
export const ROUTE = { firstStraight: 60, driftR: 40, driftZ: 5, turnX: 12, leftR: 38, leftDeg: 40, neStraight: 24, arcR: 40, arcDeg: 100, lastStraight: 68 };

// the pieces of the line: straights and arcs in plan, each with its first metre. A heading th is in degrees,
// direction (cos th, sin th) in (x, z); a right-hand bend makes it grow.
export function layRoute() {
  const r = ROUTE, segs = [];
  let x = PLAN.start[0], z = PLAN.start[1], th = 0, d = 0;
  const straight = (name, len) => {
    segs.push({ name, kind: 'S', d0: d, len, x, z, th });
    x += Math.cos(th * RAD) * len; z += Math.sin(th * RAD) * len; d += len;
  };
  const arc = (name, rad, deg, dir) => {
    const len = rad * deg * RAD, cx = x - Math.sin(th * RAD) * rad * dir, cz = z + Math.cos(th * RAD) * rad * dir;
    segs.push({ name, kind: 'A', d0: d, len, x, z, th, rad, deg, dir, cx, cz });
    th += deg * dir;
    x = cx + Math.sin(th * RAD) * rad * dir; z = cz - Math.cos(th * RAD) * rad * dir; d += len;
  };
  straight('entry', r.firstStraight);
  const a = Math.acos(1 - r.driftZ / (2 * r.driftR)) / RAD;
  arc('driftLeft', r.driftR, a, -1);
  arc('driftRight', r.driftR, a, 1);
  straight('axis', r.turnX - x);
  arc('leftTurn', r.leftR, r.leftDeg, -1);
  straight('northEast', r.neStraight);
  arc('longArc', r.arcR, r.arcDeg, 1);
  straight('last', r.lastStraight);
  const route = { segs, length: d, end: [x, z], endTh: th };
  const seg = (n) => segs.find((s) => s.name === n);
  // the named places, in metres of route
  route.sill = seg('axis').d0 + (0 - seg('axis').x);
  route.gateway = PLAN.boundaryX - PLAN.start[0];
  route.leftTurn = [seg('leftTurn').d0, seg('leftTurn').d0 + seg('leftTurn').len];
  route.longArc = [seg('longArc').d0, seg('longArc').d0 + seg('longArc').len];
  route.last = seg('last').d0;
  return route;
}

// the line's place in plan at metre d: { x, z, th }
export function routeAt(route, d) {
  const segs = route.segs;
  let s = segs[segs.length - 1];
  for (const q of segs) { if (d <= q.d0 + q.len) { s = q; break; } }
  const t = Math.max(0, Math.min(s.len, d - s.d0));
  if (s.kind === 'S') return { x: s.x + Math.cos(s.th * RAD) * t, z: s.z + Math.sin(s.th * RAD) * t, th: s.th };
  const th = s.th + (t / s.rad) / RAD * s.dir;
  return { x: s.cx + Math.sin(th * RAD) * s.rad * s.dir, z: s.cz - Math.cos(th * RAD) * s.rad * s.dir, th };
}

// the least distance in plan from a place to the flown line (the whole line from its start to its end, by chords
// of 4 m: true within 0.06 m), and the distance from which a twig spray stands in its far form (gTwig)
export const TWIG_FAR = 30;
let lineChords = null;
export function lineOff(x, z) {
  if (!lineChords) {
    const r = layRoute(); lineChords = [];
    for (let d = 0; d < r.length + 4; d += 4) { const p = routeAt(r, Math.min(d, r.length)); lineChords.push(p.x, p.z); }
  }
  let best = 1e9;
  for (let i = 0; i + 3 < lineChords.length; i += 2) {
    const ax = lineChords[i], az = lineChords[i + 1], dx = lineChords[i + 2] - ax, dz = lineChords[i + 3] - az, l2 = dx * dx + dz * dz;
    const t = l2 > 0 ? Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l2)) : 0;
    best = Math.min(best, Math.hypot(x - ax - dx * t, z - az - dz * t));
  }
  return best;
}

// the garden's rise: even from y 0 at the door wall to y 10 at x 115, level beyond (the last lawn); 0 west of the wall
export function riseAt(x) { return x <= 0 ? 0 : Math.min(PLAN.riseTop, PLAN.riseTop * x / PLAN.riseEndX); }

// the flown line's height over the ground at metre d: 4.6 over the heather falling evenly to 3.8 on the walk, 3.6 at the sill,
// 4.2 under the trees, 4.6 over the last lawn (the ring's centre height)
export function lensOver(route, d) {
  const toWalk = 4.6 - 0.8 * sstep(0, 60, d);
  const toSill = -0.2 * sstep(route.sill - 40, route.sill, d) + 0.2 * sstep(route.sill, route.sill + 30, d);
  const inside = 0.4 * sstep(route.sill + 30, route.sill + 70, d) + 0.4 * sstep(route.longArc[0] + 20, route.longArc[1] - 8, d);
  return toWalk + toSill + inside;
}

// the pace by place, in metres a second: 9 over the moor, 8 on the walk and inside, 4.8 from 20 m before the sill
// to 30 m past it, each change eased over 20 m of route
export function speedAt(route, d) {
  const moor = 1 - sstep(route.gateway - 8, route.gateway + 22, d);
  const slow = sstep(route.sill - 40, route.sill - 20, d) * (1 - sstep(route.sill + 30, route.sill + 50, d));
  return 8.0 + moor - 3.2 * slow;
}

// ---------------------------------------------------------------- the gaze (S7): three pulls, each between two marks
// of the place, in metres of route; the world hands them to the engine as they stand. None in the first 30 m, none
// from 20 m before the sill to 30 m past it, none on the last straight (the ring is met straight on), never two at
// once, each 30 m long and more, and none turns the gaze to the right of the path's own heading before the long arc's
// 30th degree (metre 204, where the way out stands whole straight ahead on the path's own heading).
//  door: THE KITCHEN GARDEN'S OPEN GREEN DOOR on the left, from `before` m ahead of where its middle is abeam to
//        `past` m beyond it: whole until the door is nearly abeam, then back to the door wall.
//  grey: ONE CURTAIN-HUNG TREE OF THE NORTH SIDE (the left hand), from the sill + 30 m until that tree is abeam. The
//        tree is the seed's own: of those that come abeam `abeam` (30 m and more after the pull begins, before the
//        arc's 30th degree) and stand `off` m from the line, one that bears a bridge before one that does not, then
//        the nearest; its mark stands `up` of its height.
//  far:  THE SUN-DIAL on the right as it comes round, then THE GREAT ROSE TREE up its height: ONE pull from the long
//        arc's 30th degree to the last straight's first metre. Its mark glides from the dial's plate to the tree
//        BETWEEN TWO PLACES OF THE ARC (G11): it leaves the dial where the path's own heading is the bearing from the
//        dial to the tree (the mark then moves straight before us), and reaches the tree where the heading is the
//        bearing from the dial to the ring; so the gaze never lets go and takes hold a second time. (The dial and
//        the tree's foot come abeam only at the pull's last metre and on the last straight, where no pull may be.)
export const GAZE = {
  door: { before: 34, past: 8, weight: 0.5, fade: 0.5, y: 3.2, inside: 1.5 },
  grey: { abeam: [30, 0], off: [8, 24], weight: 0.45, fade: 0.5, up: 0.5 },
  far: { weight: 0.45, fade: 0.3, dialUp: 4.2, treeUp: 0.6, treeH: 40 },
};
// where the point (x, z) lies nearest the line between metres d0 and d1: { d, off, side } (side under 0: the left hand)
export function abeamOf(route, x, z, d0, d1) {
  let d = d0, off = 1e9;
  for (let m = d0; m <= d1; m += 0.25) { const p = routeAt(route, m), q = Math.hypot(p.x - x, p.z - z); if (q < off) { off = q; d = m; } }
  const p = routeAt(route, d);
  return { d, off, side: (x - p.x) * -Math.sin(p.th * RAD) + (z - p.z) * Math.cos(p.th * RAD) };
}
// the pulls: [{ name, from, to (metres of route), weight, fade, at(metre, v) }]; `at` sets v (anything with a set
// of three numbers) to the mark and returns it. `trees` are the grey's, `bridgesAt` its bridges (i, j: trees).
export function layGaze(route, trees, bridgesAt, heightAt) {
  const G = GAZE, P = PLAN, out = [];
  const mk = abeamOf(route, P.kitchenDoorX, -P.walkZ, 0, route.sill).d, door = [P.kitchenDoorX, G.door.y, -P.walkZ - G.door.inside];
  out.push({ name: 'door', from: mk - G.door.before, to: mk + G.door.past, weight: G.door.weight, fade: G.door.fade, at: (m, v) => v.set(door[0], door[1], door[2]) });
  const arc30 = route.longArc[0] + ROUTE.arcR * 30 * RAD, m0 = route.sill + 30, lo = m0 + G.grey.abeam[0], hi = arc30 + G.grey.abeam[1];
  const bears = new Set();
  for (const b of bridgesAt || []) { bears.add(b.i); bears.add(b.j); }
  let pick = null;
  trees.forEach((t, i) => {
    const a = abeamOf(route, t.x, t.z, m0, hi + 10);
    if (a.side >= 0 || a.d < lo || a.d > hi || a.off < G.grey.off[0] || a.off > G.grey.off[1]) return;
    const score = a.off - (bears.has(i) ? 100 : 0);
    if (!pick || score < pick.score) pick = { t, i, d: a.d, score };
  });
  if (pick) {
    const t = pick.t, y = heightAt(t.x, t.z) + G.grey.up * t.H;
    out.push({ name: 'grey', from: m0, to: pick.d, weight: G.grey.weight, fade: G.grey.fade, tree: pick.i, at: (m, v) => v.set(t.x, y, t.z) });
  }
  const D = P.dial, R = P.roseTree, dy = heightAt(D[0], D[1]) + G.far.dialUp, ty = heightAt(R[0], R[1]) + G.far.treeUp * G.far.treeH;
  // (the metre of the pull at which the path heads a given way: the arc turns one way, so it is found by halving)
  const headed = (deg) => { let a = arc30, b = route.last; for (let i = 0; i < 40; i++) { const m = (a + b) / 2; if (routeAt(route, m).th < deg) a = m; else b = m; } return (a + b) / 2; };
  const g0 = headed(Math.atan2(R[1] - D[1], R[0] - D[0]) / RAD), g1 = headed(Math.atan2(route.end[1] - D[1], route.end[0] - D[0]) / RAD);
  out.push({ name: 'far', from: arc30, to: route.last, weight: G.far.weight, fade: G.far.fade, glide: [g0, g1], at: (m, v) => {
    const k = sstep(g0, g1, m);
    return v.set(D[0] + (R[0] - D[0]) * k, dy + (ty - dy) * k, D[1] + (R[1] - D[1]) * k);
  } });
  return out;
}

// the control points of the flown path: every 8 m or less on a straight, every 2.5 m or less on a bend, joints included
export function routePoints(route) {
  const pts = [];
  const put = (d) => { const p = routeAt(route, d); pts.push([p.x, riseAt(p.x) + lensOver(route, d), p.z]); };
  for (const s of route.segs) {
    const n = Math.max(1, Math.ceil(s.len / (s.kind === 'S' ? 8 : 2.5)));
    for (let i = 0; i < n; i++) put(s.d0 + s.len * i / n);
  }
  put(route.length);
  return pts;
}

// ---------------------------------------------------------------- the ground: one height of place
// West of the boundary the moor lies in low folds, none within 10 m of the entry's axis (z 5) however far back, so the
// line continued straight back from its start has ground under it all the way; the grounds (x -92 to 0) are level; from the
// door wall east the whole hillside takes the garden's rise, so every wall stands on one slope.
// THE GARDEN'S OWN SWELL (ten years untended): broad swells and dips, old raised beds gone soft, one sunk path that
// wanders north of the line, a mound at every old tree's foot. It is nothing at the walls' feet and nothing within
// 3 m of the flown line (the line's own height stays), full from 9 m off it. Baked once on a lattice (the terrain, the
// grass, the shadows and every plant read the same height), in short steps.
export const SWELL = { cell: 1.5, broad: 0.65, beds: 6, bedUp: 0.5, path: 0.55, pathHalf: 2.4, mound: 0.75, moundR: 3.4, lineFrom: 3, lineTo: 9, wallFrom: 2.5, wallTo: 9 };
export async function makeSwell(route, trees, rng, yieldNow = null) {
  const G = PLAN.garden, c = SWELL.cell, nx = Math.ceil((G.x1 - 0) / c) + 1, nz = Math.ceil((G.z1 - G.z0) / c) + 1, H = new Float32Array(nx * nz), rule = greyRule(route);
  const beds = [];
  for (let i = 0; i < SWELL.beds; i++) beds.push({ x: rng.range(14, 150), z: rng.range(G.z0 + 12, G.z1 - 12), a: rng.range(0, Math.PI), hx: rng.range(5, 11), hz: rng.range(2.2, 4), up: SWELL.bedUp * rng.range(0.7, 1.2) });
  const p0 = rng.range(0, 6.28), pathZ = (x) => -24 - 0.1 * x - 8 * Math.sin(x * 0.043 + p0) - 3 * Math.sin(x * 0.11 + p0 * 2);
  const row = (j) => {
    for (let i = 0; i < nx; i++) {
      const x = i * c, z = G.z0 + j * c, wall = Math.min(x, G.x1 - x, z - G.z0, G.z1 - z), kw = sstep(SWELL.wallFrom, SWELL.wallTo, wall);
      if (kw <= 0) continue;
      const kl = sstep(SWELL.lineFrom, SWELL.lineTo, rule.toLine(x, z)[0]);
      if (kl <= 0) continue;
      let y = SWELL.broad * 2 * (fbm3(x * 0.055 + 3.1, z * 0.055 - 7.7) - 0.5);
      for (const b of beds) {
        const dx = x - b.x, dz = z - b.z, u = (dx * Math.cos(b.a) + dz * Math.sin(b.a)) / b.hx, v = (-dx * Math.sin(b.a) + dz * Math.cos(b.a)) / b.hz, q = Math.max(Math.abs(u), Math.abs(v));
        if (q < 1.4) y += b.up * sstep(1.4, 0.75, q);
      }
      y -= SWELL.path * sstep(SWELL.pathHalf * 1.8, SWELL.pathHalf * 0.5, Math.abs(z - pathZ(x))) * sstep(6, 14, x) * sstep(150, 135, x);
      let mound = 0;
      for (const t of trees) { const r2 = (x - t.x) * (x - t.x) + (z - t.z) * (z - t.z); if (r2 < 150) mound = Math.max(mound, Math.exp(-r2 / (2 * SWELL.moundR * SWELL.moundR))); }
      H[j * nx + i] = (y + SWELL.mound * mound) * kw * kl;
    }
  };
  for (let j = 0; j < nz; j++) { row(j); if (yieldNow && j % 12 === 11 && j < nz - 12) await yieldNow(j < 12 ? 10.5 : 4.5); }
  // the lattice read smoothly (bilinear); nothing outside the garden
  return (x, z) => {
    const fx = x / c, fz = (z - G.z0) / c;
    if (!(fx > 0 && fz > 0 && fx < nx - 1 && fz < nz - 1)) return 0;
    const i = Math.floor(fx), j = Math.floor(fz), a = fx - i, b = fz - j, q = j * nx + i;
    return (H[q] * (1 - a) + H[q + 1] * a) * (1 - b) + (H[q + nx] * (1 - a) + H[q + nx + 1] * a) * b;
  };
}
export function makeHeight(noise, swell = null) {
  const G = PLAN.garden;
  return (x, z) => {
    let y = riseAt(x);
    if (x < PLAN.boundaryX - 4) {
      const off = Math.abs(z - PLAN.gateZ);
      const m = sstep(10, 70, off) * sstep(PLAN.boundaryX - 4, PLAN.boundaryX - 60, x);
      const amp = 5 + 9 * sstep(120, 300, off);
      y += m * (1 + amp * 0.8 * noise.fbm2(x * 0.0065 + 3.7, z * 0.0065 - 1.3, 3));
    } else if (x > 0) {
      const out = Math.max(z - G.z1, G.z0 - z, x - G.x1);
      if (out > 30) y += sstep(30, 160, out) * 7 * noise.fbm2(x * 0.006 - 8.1, z * 0.006 + 4.4, 3);
      else if (swell && out < 0) y += swell(x, z);
    }
    return y;
  };
}

// ---------------------------------------------------------------- the sun on things, by place
// The fixed walls are kept as upright panels in plan ({ ax, az, bx, bz, y0, y1 }); sunAt(x, y, z) says how much of the
// one sun reaches a point of the world past them: 1 in sun, 0 in a wall's shade, with a soft edge (never a hard pane).
// It reads the place alone, the HEIGHT with it: what stands over a wall's top stands in the sun (G12). Ground, trunks, curtains and flowers take their light from it at their own place.
export function makeSun(panels) {
  const S = PLAN.sunTo, sl = Math.hypot(S[0], S[1], S[2]), sx = S[0] / sl, sy = S[1] / sl, sz = S[2] / sl;
  // each panel's foot, run, the ray's share across it, its length and its heights, kept once (the walls stand)
  const n = panels.length, PX = new Float64Array(n * 8);
  for (let i = 0; i < n; i++) { const p = panels[i], ex = p.bx - p.ax, ez = p.bz - p.az; PX.set([p.ax, p.az, ex, ez, sx * ez - sz * ex, Math.hypot(ex, ez), p.y0, p.y1], i * 8); }
  const sunAt = (x, y, z) => {
    let lit = 1;
    for (let i = 0, o = 0; i < n; i++, o += 8) {
      const den = PX[o + 4];
      if (Math.abs(den) < 1e-6) continue;
      // the ray from the point toward the sun meets the panel's plane k metres on, t along the panel (0..1)
      const dx = PX[o] - x, dz = PX[o + 1] - z, k = (dx * PX[o + 3] - dz * PX[o + 2]) / den;
      if (k <= 0.05) continue;
      // over the wall by more than the soft top, or under its foot: no shade of this panel
      const ry = y + sy * k, y0 = PX[o + 6], y1 = PX[o + 7];
      if (ry < y0 - 1.5 || ry > y1 + 2.2) continue;
      // THE SHADE AT ITS OWN HEIGHT (G12): a wall shades what stands UNDER its top. A point half a metre over a wall's
      // top stands clear of that wall whatever lies at its foot (the soft top above was the ray's alone: it left a
      // thing standing on a coping in half the wall's shade); between the top and that half metre a soft go-over
      const over = y - y1;
      if (over >= 0.5) continue;
      const t = (dx * sz - dz * sx) / den, along = Math.min(t, 1 - t) * PX[o + 5];
      if (along < -1.5) continue;
      // soft over 4.4 m of height at the top (6 to 10 m of ground at this sun), over 3 m at the ends and the foot
      const cover = sstep(-2.2, 2.2, y1 - ry) * sstep(-1.5, 1.5, along) * sstep(-1.5, 1.5, ry - y0);
      lit *= over > 0 ? 1 - cover * sstep(0.5, 0, over) : 1 - cover;
      if (lit < 0.004) return 0;
    }
    return lit;
  };
  return { sunAt, dir: [sx, sy, sz] };
}

// ---------------------------------------------------------------- masonry: the wall maker's geometry
// Boxes with their faces mapped in METRES of the wall (wuv: along the face and up it), so that the material can draw
// real courses; wk says the kind of masonry: 0 old brick, 1 dressed pale stone (coping, jambs, lintel, step),
// 2 dry-stone (the boundary and its piers). Every wall also leaves an upright panel for makeSun.
export function makeMasonry() {
  const pos = [], nor = [], wuv = [], wk = [], wt = [], idx = [], panels = [];
  let topY = 0;   // the top of the box in hand: the drawing puts more lichen and moss under a wall's coping
  const quad = (a, b, c, d, n, kind) => {
    const i0 = pos.length / 3;
    for (const p of [a, b, c, d]) {
      pos.push(p[0], p[1], p[2]); nor.push(n[0], n[1], n[2]); wk.push(kind); wt.push(topY);
      if (n[1] !== 0) wuv.push(p[0], p[2]);
      else if (n[0] !== 0) wuv.push(p[2], p[1]);
      else wuv.push(p[0], p[1]);
    }
    idx.push(i0, i0 + 1, i0 + 2, i0, i0 + 2, i0 + 3);
  };
  // an axis-aligned box; skip is a string of faces left out: any of 'x', 'X', 'y', 'Y', 'z', 'Z' (small letter = low side)
  const box = (x0, y0, z0, x1, y1, z1, kind, skip = '') => {
    topY = y1;
    if (!skip.includes('X')) quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [1, 0, 0], kind);
    if (!skip.includes('x')) quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0], kind);
    if (!skip.includes('Z')) quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1], kind);
    if (!skip.includes('z')) quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [0, 0, -1], kind);
    if (!skip.includes('Y')) quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], [0, 1, 0], kind);
    if (!skip.includes('y')) quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [0, -1, 0], kind);
  };
  // a run of wall along x (z0..z1 is its thickness) or along z, from foot to top, with a stone coping if asked;
  // it leaves its panel for the sun
  const wall = (x0, z0, x1, z1, yFoot, yTop, kind, o = {}) => {
    box(x0, yFoot, z0, x1, yTop, z1, kind, (o.under ? '' : 'y') + (o.coping ? 'Y' : '') + (o.skip || ''));
    if (o.coping) {
      const e = 0.3, t = 0.55;
      box(x0 - e, yTop, z0 - e, x1 + e, yTop + t, z1 + e, 1);
    }
    const alongX = (x1 - x0) >= (z1 - z0), top = yTop + (o.coping ? 0.55 : 0);
    if (alongX) panels.push({ ax: x0, az: (z0 + z1) / 2, bx: x1, bz: (z0 + z1) / 2, y0: yFoot, y1: top });
    else panels.push({ ax: (x0 + x1) / 2, az: z0, bx: (x0 + x1) / 2, bz: z1, y0: yFoot, y1: top });
  };
  const geometry = () => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    g.setAttribute('wuv', new THREE.Float32BufferAttribute(wuv, 2));
    g.setAttribute('wk', new THREE.Float32BufferAttribute(wk, 1));
    g.setAttribute('wt', new THREE.Float32BufferAttribute(wt, 1));
    g.setIndex(idx);
    g.computeBoundingSphere();
    return g;
  };
  return { box, wall, quad, panels, geometry, triangles: () => idx.length / 3 };
}

// ---------------------------------------------------------------- masonry: the one material of every wall
// A lit material (the world's sun and sky fill light it: a sunlit face and a face in its own shade) whose colour is
// DRAWN: brick in courses of 0.30 m with pale mortar, each brick its own tone; dressed stone in large blocks; dry-stone
// in rough courses of uneven lengths. No noise card. Where a course falls under about two pixels the drawing gives way
// to its own mean colour (a filter by the pixel's footprint, which reads no lens place).
// the small shared GLSL of every drawn material of this world: a hash, a value noise, and the share of a pixel's span
// that lies in the joints of a ruled face (an exact box filter: a joint is the first `width` of each `period`)
// gmHash is the kit's own hash12 (src/kit/fx.js, GLSL_HASH) letter for letter, under this world's name for it (the
// masonry's shader text takes none of the kit's snippets); gvNoise is the common value noise on four hashed corners.
export const HASH_GLSL = /* glsl */`
float gmHash(vec2 p) { vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float gvNoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(gmHash(i), gmHash(i + vec2(1.0, 0.0)), f.x), mix(gmHash(i + vec2(0.0, 1.0)), gmHash(i + vec2(1.0, 1.0)), f.x), f.y); }
float gmBand(float v, float period, float width, float w) {
  float a = v - 0.5 * w, b = v + 0.5 * w, ia = floor(a / period), ib = floor(b / period);
  return ((ib - ia) * width + min(b - ib * period, width) - min(a - ia * period, width)) / w;
}`;
const MASONRY_GLSL = /* glsl */`
// a DRAWN blot in each cell of a ruled field (lichen, moss): an uneven round patch with a filtered edge; prob says how
// many cells bear one and how large it has grown (a rule of place: no noise card)
float gPatch(vec2 uv, float cell, float seed, float prob, float fw) {
  vec2 id = floor(uv / cell);
  float h = gmHash(id + seed);
  vec2 d = uv - (id + 0.3 + 0.4 * vec2(gmHash(id + seed + 3.1), gmHash(id + seed + 7.7))) * cell;
  float a = atan(d.y, d.x);
  float r = cell * (0.13 + 0.17 * gmHash(id + seed + 11.0)) * clamp((prob - h) * 5.0, 0.0, 1.0);
  r *= 0.8 + 0.14 * sin(a * 3.0 + h * 40.0) + 0.08 * sin(a * 7.0 + h * 90.0);
  float e = max(fw, 0.012);
  // (ITS OWN MEAN, G9c: a soft edge of half width e swells a round blot's area by 0.2 e e over r r; that swelling is
  // taken off again, so a wall's share under blots holds (to 1 in 10 up to 0.25 m of footprint): 0.047 of the face at prob 0.6)
  return (1.0 - smoothstep(r - e, r + e, length(d))) * step(0.001, r) * (r * r + 0.0000288) / (r * r + 0.2 * e * e);
}
// lichen or moss as it grows: patches of 0.3 to 1 m made of small spots, never one flat blot (two fixed noises of
// place; where the spots fall under 0.03 to 0.1 m of footprint they give way to THEIR OWN MEAN (G9c): the share of the
// fine noise over the spots' threshold for the growth and the middle noise at hand, 0.13 at the patch's edge to 0.80
// in its heart, worked out over the fine noise and fitted to 0.006; the figure before, 0.35 at the middle, was half)
float gLichen(vec2 uv, float amount, float fw) {
  float a = clamp(amount, 0.0, 1.0);
  float lpat = smoothstep(0.62 - 0.3 * a, 0.86 - 0.3 * a, 0.6 * gvNoise(uv * 1.3 + 7.0) + 0.4 * gvNoise(uv * 3.1 + 2.0));
  float fine = gvNoise(uv * 17.0 + 31.0), mid = gvNoise(uv * 5.7 + 13.0);
  float spots = mix(smoothstep(0.62 - 0.3 * lpat, 0.72 - 0.3 * lpat, 0.65 * fine + 0.35 * mid), smoothstep(0.02, 0.98, 0.5 + (0.3 * lpat + 0.35 * mid - 0.345) / 0.65), smoothstep(0.03, 0.1, fw));
  return lpat * spots * smoothstep(0.0, 0.1, a);
}
// OUTSIDE: old pale stone, worn and weathered: courses of unlike height, stones of unlike length and tone (warm and
// cool greys), soft joints with moss in them, rain marks from the top, a damp foot, fine broken lichen; the door's
// step worn hollow in the middle of its tread; the gateway's sill as uneven flags with grass in the joints
vec3 gOldStone(vec2 uv, float fw) {
  float top = step(0.5, vWn.y), up = 1.0 - top, sill = step(v_wp.x, -80.0) * top * step(v_wp.y, 0.5);
  vec2 su = uv + (vec2(gvNoise(uv * 1.9 + 3.0), gvNoise(uv * 1.9 + 9.0)) - 0.5) * 0.09;
  float wy = su.y + 0.2 * sin(su.y * 2.3 + 1.0), rowH = mix(0.92, 1.3, sill);
  float row = floor(wy / rowH), len = mix(1.3 + 1.5 * gmHash(vec2(row, 4.0)), 1.1 + 0.9 * gmHash(vec2(row, 4.0)), sill);
  float ux = su.x / len + 7.0 * gmHash(vec2(row, 11.0));
  vec2 id = vec2(floor(ux), row), f = vec2(fract(ux), fract(wy / rowH)), e = min(f, 1.0 - f) * vec2(len, rowH);
  float jw = mix(0.02, 0.06, sill), sw = max(fw, 0.012);
  float joint = 1.0 - smoothstep(jw - sw, jw + 2.0 * sw + 0.02, min(e.x, e.y));
  // THE JOINTS GO TO THEIR OWN MEAN (G9c): 0.112 of the wall's face lies in its joints and 0.205 of the sill's flags
  // (worked out over the face as drawn at a footprint of 0.012 m and under). The soft edge widens with the footprint
  // and would swell that share (measured: by 1 + 13 (sw - 0.012) on the wall, 1 + 5.5 (sw - 0.012) on the sill): the
  // swelling is taken off, and from 0.15 to 0.5 m of footprint the joints give way to that mean, not to nothing
  joint = mix(joint / (1.0 + mix(13.0, 5.5, sill) * (sw - 0.012)), mix(0.112, 0.205, sill), smoothstep(0.15, 0.5, fw));
  float h = gmHash(id + 3.0), h2 = gmHash(id + 8.0);
  vec3 stone = mix(uStoneW, uStoneO, h2) * (0.8 + 0.3 * h) * (0.93 + 0.14 * gvNoise(uv * 5.0));
  float dTop = vWt - v_wp.y;
  float run = smoothstep(0.45, 0.8, gvNoise(vec2(uv.x * 2.6, uv.y * 0.16 + 5.0))) * (1.0 - smoothstep(0.5, 5.0, dTop));
  stone *= 1.0 - up * (0.26 * run + 0.2 * (1.0 - smoothstep(0.0, 0.7 + 0.5 * gvNoise(vec2(uv.x * 1.3, 2.0)), dTop)));
  stone *= 1.0 - 0.25 * up * (1.0 - smoothstep(0.1, 1.2, v_wp.y));
  float high = smoothstep(2.0, 3.0, v_wp.y);
  float doorSt = step(-3.0, v_wp.x);
  float lich = gLichen(uv + 2.7, mix(mix(0.2, 0.45, high), 0.2, doorSt) + 0.25 * top * high, fw);
  float moss = gLichen(uv + 14.1, mix(0.12, 0.5, high * top) * (1.0 - 0.7 * doorSt) + 0.3 * step(vWn.z, -0.5), fw);
  stone = mix(stone, uMoss * 1.1, 0.7 * moss);
  stone = mix(stone, uLichen * 0.95, 0.6 * lich);
  float ivs = doorSt * up * max(smoothstep(7.5, 8.5, v_wp.y), smoothstep(2.9, 3.6, abs(v_wp.z)) * step(0.4, v_wp.y));
  float istr = 0.35 + 0.65 * smoothstep(0.3, 0.7, gvNoise(vec2(uv.x * 3.4, uv.y * 0.3 + 11.0)));
  stone = mix(stone, stone * vec3(0.6, 0.7, 0.56), 0.75 * ivs * istr);
  float tread = top * step(abs(v_wp.y - 0.3), 0.08) * step(-2.5, v_wp.x) * (1.0 - smoothstep(0.5, 2.1, abs(v_wp.z)));
  stone = mix(stone, uStoneO * (0.7 + 0.1 * gvNoise(uv * 2.0)), 0.75 * tread);
  vec3 jc = mix(mix(stone * 0.7, mix(stone * 0.7, uMoss * 0.9, 0.55), smoothstep(0.42, 0.62, gvNoise(uv * 3.0 + 7.0))), vec3(0.3, 0.33, 0.17), sill);
  return mix(stone, jc, joint * (1.0 - 0.8 * tread));
}
vec3 gardenMasonry(vec2 uv, float kind, vec2 fwv) {
  float fw = max(fwv.x, fwv.y);
  if (kind < 0.5) {
    float gOut = 1.0 - step(-1.19, v_wp.x);
    // bed joints and upright joints are filtered each by the pixel's own span along its axis, so the courses of a wall
    // that runs along the line still stand as lines; the drawing holds to a footprint of 0.09 to 0.24 m and then gives way to its mean
    vec2 cell = vec2(0.79, 0.30);
    float wx = max(fwv.x, 0.003), wy = max(fwv.y, 0.003);
    float row = floor(uv.y / cell.y);
    float ux = uv.x + 0.5 * cell.x * mod(row, 2.0);
    vec2 id = vec2(floor(ux / cell.x), row);
    float bed = mix(gmBand(uv.y, cell.y, 0.036, wy), 0.12, smoothstep(0.12, 0.24, wy));
    float up = mix(gmBand(ux, cell.x, 0.036, wx), 0.0456, max(smoothstep(0.09, 0.2, wy), smoothstep(0.3, 0.6, wx)));
    float joint = 1.0 - (1.0 - bed) * (1.0 - up);
    float h = gmHash(id), h2 = gmHash(id + 17.3);
    // the tone changes slowly along a wall (two long waves of place, no noise)
    float slow = 0.5 + 0.27 * sin(uv.x * 0.071 + 1.3) + 0.23 * sin(uv.x * 0.023 + uv.y * 0.11 + 4.0);
    float tone = 0.9 + 0.2 * slow;
    vec3 bA = mix(uBrickA, uBrickOA, gOut), bB = mix(uBrickB, uBrickOB, gOut);
    vec3 brick = mix(bA, bB, 0.6 * h + 0.4 * slow) * (0.86 + 0.26 * h2) * tone;
    brick = mix(brick, brick * vec3(0.72, 0.66, 0.8), step(0.9, gmHash(id + 5.1)));
    vec3 mean = mix(bA, bB, 0.3 + 0.4 * slow) * 0.97 * tone;
    brick = mix(brick, mean, smoothstep(0.25, 0.6, max(wx / cell.x, wy / cell.y)));
    vec3 c = mix(brick, mix(uMortar, uMortarO, gOut) * tone, joint);
    // the face in its own shade goes wine-violet at the same lightness, and a little lifted (never black)
    float shade = 1.0 - smoothstep(-0.05, 0.3, dot(vWn, uSunTo)), cool = max(step(vWn.z, -0.5), 0.6 * shade);
    float lum = dot(c, vec3(0.2126, 0.7152, 0.0722));          // (half the wine's colour only: the shade's own cool light adds the rest)
    vec3 cIn = mix(c, mix(vec3(lum), uWine * (lum / 0.073), 0.5), 0.6 * shade) * (1.0 + 0.15 * shade);
    // (outside a face in its own shade is the palette's muted plum brown: its own colour a little cooled; the sky's
    // fill is added in the colour line)
    vec3 cO = mix(c, mean, 0.35 * shade);
    cO = mix(cO, vec3(dot(cO, vec3(0.2126, 0.7152, 0.0722))), 0.4 * shade) * mix(vec3(1.0), vec3(0.92, 0.8, 0.78), shade);
    c = mix(cIn, cO, gOut);
    // a damp darker foot with an uneven upper edge
    float hf = v_wp.y - clamp(v_wp.x, 0.0, 115.0) * 0.08696, dTop = vWt - v_wp.y;
    float damp = 1.0 - smoothstep(0.1, 1.5 + 0.7 * sin(uv.x * 0.37) + 0.4 * sin(uv.x * 1.3 + 2.0), hf);
    c *= mix(vec3(1.0), vec3(0.62, 0.62, 0.68), damp);
    // the door wall's outer face lies under the ivy: what brick shows in a hollow shows in the leaves' shade
    float gIvy = gOut * step(vWn.x, -0.5) * step(-1.25, v_wp.x);
    float gli = dot(c, vec3(0.2126, 0.7152, 0.0722));
    c = mix(c, mix(c * vec3(0.4, 0.45, 0.56), mix(gli, 0.09, 0.45) * vec3(0.70, 0.52, 0.64), 0.8) * (0.8 + 0.4 * gvNoise(uv * 1.3)), gIvy);
    // damp stains under the coping: dark tongues of unlike length and width that run down from it
    float sl = 0.3 + 1.7 * pow(0.5 + 0.5 * sin(uv.x * 1.9 + 0.7 * sin(uv.x * 0.43)), 3.0) + 1.1 * pow(0.5 + 0.5 * sin(uv.x * 4.7 + 2.0), 6.0);
    float stain = (1.0 - smoothstep(0.2 * sl, sl, dTop)) * step(0.0, dTop);
    c *= mix(vec3(1.0), vec3(0.58, 0.59, 0.66), 0.8 * stain);
    // moss in tongues along the foot and in blots, lichen in blots: more under the coping, on north faces, near the foot
    float tong = 0.32 + 0.28 * sin(uv.x * 0.9 + 0.5) + 0.2 * sin(uv.x * 2.7), ew = max(wy, 0.02);
    float underTop = 1.0 - smoothstep(0.0, 2.8, dTop), nearFoot = 1.0 - smoothstep(0.3, 2.6, hf);
    float moss = max((1.0 - smoothstep(tong - ew, tong + ew, hf)) * (0.3 + 0.7 * cool), gPatch(uv, 2.3, 31.0, 0.08 + 0.36 * nearFoot + 0.26 * underTop + 0.2 * cool, fw));
    float lichP = 0.14 + 0.5 * underTop + 0.22 * cool;
    float lich = max(gPatch(uv + 5.3, 1.45, 57.0, lichP, fw), 0.85 * gPatch(uv + 11.9, 0.62, 83.0, 0.7 * lichP, fw));
    float mossO = (1.0 - smoothstep(tong - ew, tong + ew, hf)) * (0.3 + 0.7 * cool) * (0.5 + 0.5 * smoothstep(0.35, 0.6, gvNoise(uv * 5.0)));
    moss = mix(moss, max(mossO, 0.8 * gLichen(uv + 23.0, 0.3 * nearFoot + 0.3 * underTop * cool, fw)), gOut);
    lich = mix(lich, gLichen(uv, 0.2 + 0.4 * underTop + 0.1 * cool, fw) * (0.6 + 0.4 * h) * 0.7, gOut);
    c = mix(c, uMoss * (0.8 + 0.4 * h2), 0.85 * moss);
    return mix(c, uLichen * (0.86 + 0.2 * h) * mix(1.0, 0.86, gOut), 0.8 * lich);
  }
  if (kind < 1.5) {
    if (v_wp.x < 0.55) return gOldStone(uv, fw);
    vec2 cell = vec2(2.1, 0.92);
    float row = floor(uv.y / cell.y);
    float ux = uv.x / cell.x + 0.37 * mod(row, 2.0);
    vec2 id = vec2(floor(ux), row);
    vec2 f = vec2(fract(ux), fract(uv.y / cell.y));
    vec2 e = min(f, 1.0 - f) * cell;
    float joint = 1.0 - smoothstep(0.02, 0.02 + max(fw, 0.004), min(e.x, e.y));
    // ITS OWN MEAN (G9c): 0.080 of a dressed face lies in its joints (as drawn at 0.012 m of footprint); the soft
    // edge's swelling (1 + 17.5 (fw - 0.012), measured) is taken off, and from 0.25 to 0.7 m of footprint the joints
    // go to that mean and each block's tone to its mean, 0.5; the lichen and the moss stay (before, a far face went
    // to bare stone)
    float dfar = smoothstep(0.25, 0.7, fw);
    joint = mix(joint / (1.0 + 17.5 * max(fw - 0.012, 0.0)), 0.080, dfar);
    vec3 stone = uStone * (0.88 + 0.2 * mix(gmHash(id + 3.0), 0.5, dfar));
    // lichen and moss in drawn blots: thick on a coping (high over its wall's foot, most on its top), thin on jamb and step
    float high = smoothstep(2.0, 3.0, v_wp.y - clamp(v_wp.x, 0.0, 115.0) * 0.08696);
    float lp = mix(0.1, 0.5, high) + 0.22 * high * step(0.5, vWn.y);
    float lich = max(gPatch(uv + 2.7, 1.1, 19.0, lp, fw), gPatch(uv + 8.1, 0.5, 43.0, 0.8 * lp, fw));
    stone = mix(stone, uMoss * 1.1, mix(0.7, 0.9, high) * gPatch(uv + 4.4, 1.9, 67.0, mix(0.6, 1.25, high) * lp, fw));
    stone = mix(stone, uLichen * 0.95, 0.75 * lich);
    return mix(stone, uStone * 0.55, joint);
  }
  // the boundary and its gate piers: old weathered stone in rough courses of unlike height, stones of unlike length
  // and tone (warm and cool greys), soft worn joints that wander (no ruled line), lichen and moss on the tops and the
  // north sides; a pier's cap is one worn stone
  float top = step(0.5, vWn.y), cap = step(7.7, vWt), north = step(vWn.z, -0.5), fad = smoothstep(0.12, 0.4, fw);
  vec2 dv = uv + (vec2(gvNoise(uv * 1.6), gvNoise(uv * 1.6 + 17.0)) - 0.5) * 0.13;
  float wy = dv.y + 0.2 * sin(dv.y * 1.9 + 0.6) + 0.06 * sin(dv.y * 5.3), rowH = 0.5;
  float row = floor(wy / rowH), len = 0.55 + 0.9 * gmHash(vec2(row, 4.0));
  float ux = dv.x / len + 7.0 * gmHash(vec2(row, 11.0));
  // every stone its own length: the upright joints stand off their even places
  float ci = floor(ux), lo = ci + 0.5 * (gmHash(vec2(ci, row + 31.0)) - 0.5), hi = ci + 1.0 + 0.5 * (gmHash(vec2(ci + 1.0, row + 31.0)) - 0.5);
  if (ux < lo) { hi = lo; ci -= 1.0; lo = ci + 0.5 * (gmHash(vec2(ci, row + 31.0)) - 0.5); }
  vec2 id = vec2(ci, row);
  float fy = fract(wy / rowH), ex = min(ux - lo, hi - ux) * len, ey = min(fy, 1.0 - fy) * rowH;
  float dw = max(fw, 0.012);
  // ITS OWN MEAN (G9c): 0.223 of the dry stone's face lies in its joints; the soft edge's swelling (1 + 2.1 (dw - 0.03),
  // measured) is taken off, and from 0.12 to 0.4 m of footprint the joints go to that mean, not to nothing
  float joint = mix((1.0 - smoothstep(0.012 - dw, 0.05 + dw, min(ex, ey))) / (1.0 + 2.1 * max(dw - 0.03, 0.0)), 0.223, fad) * (1.0 - cap);
  float h = mix(gmHash(id + 1.0), 0.5, fad), h2 = mix(gmHash(id + 6.0), 0.5, fad);
  // warm and cool greys (the low gold light eats a paint's blue on a sunlit face: given back there, by the face)
  float sunF = smoothstep(0.0, 0.5, dot(vWn, uSunTo));
  vec3 rough = mix(uDryW * mix(vec3(1.0), vec3(1.03, 1.2, 1.72), sunF), uDry * mix(vec3(1.0), vec3(0.98, 1.27, 2.02), sunF), h2);
  rough *= (0.66 + 0.3 * h) * (0.88 + 0.24 * gvNoise(uv * 7.0)) * (0.84 + 0.32 * gvNoise(uv * 1.9 + id * 1.7));
  rough = mix(rough, mix(uDryW, uDry, 0.4) * mix(vec3(1.0), vec3(1.02, 1.36, 2.3), sunF) * (0.9 + 0.2 * gvNoise(uv * 1.1)), cap);
  float dTop = vWt - v_wp.y;
  rough *= 1.0 - 0.3 * (1.0 - top) * (1.0 - smoothstep(0.0, 0.5 + 0.6 * gvNoise(vec2(uv.x * 1.4, 3.0)), dTop));
  float lich = gLichen(uv + 3.3, 0.3 + 0.4 * top + 0.2 * north + 0.2 * cap, fw);
  float moss = gLichen(uv + 19.0, 0.1 + 0.5 * top + 0.4 * north, fw);
  rough = mix(rough, uMoss * 1.05, 0.75 * moss);
  rough = mix(rough, uLichen, 0.7 * lich);
  return mix(rough, rough * 0.7, joint);
}`;

// (G10c) A FACE OF MASONRY TURNED FROM THE SUN, west of x -1.19, takes 0.22 of its own colour as the light the lit
// ground throws back (dry and dressed stone 0.8 of that), where brick alone took it: under the low key and the
// lesser fill the gateway's stone pier turned from the sun stood at 15 of 255, and the brief's shade is never black.
export function makeMasonryMaterial(clock = makeClock()) {
  const lin = (hex) => new THREE.Color(hex);
  const uniforms = {
    // old red-brown about 8a4a35 where lit (the two tones lie to either side of it), wine-violet in a face's own shade;
    // a dull lime mortar; lichen 9aa58a and a deep moss
    uBrickA: { value: lin('#724335') }, uBrickB: { value: lin('#88503d') }, uMortar: { value: lin('#8f8679') },
    uBrickOA: { value: lin('#8f615f') }, uBrickOB: { value: lin('#a8726c') }, uMortarO: { value: lin('#a69d90') },
    uStoneO: { value: lin('#c6ccd0') }, uStoneW: { value: lin('#d6d8d2') }, uDryW: { value: lin('#9a9080') },
    uStone: { value: lin('#d9cdb8') }, uLichen: { value: lin('#9aa58a') }, uDry: { value: lin('#8d8f93') },
    uWine: { value: lin('#6e3d55') }, uMoss: { value: lin('#56612f') },
    uSunTo: { value: new THREE.Vector3(...PLAN.sunTo).normalize() },
  };
  const material = new THREE.MeshLambertMaterial({ color: 0xffffff });
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms, { gCloudTex: clock.gCloudTex, gCloud: clock.gCloud });
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec2 wuv;\nattribute float wk;\nattribute float wt;\nvarying vec2 vWuv;\nvarying float vWk;\nvarying float vWt;\nvarying vec3 vWn;\nvarying vec3 v_wp;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWuv = wuv;\nvWk = wk;\nvWt = wt;\nvWn = normal;\nv_wp = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec2 vWuv;\nvarying float vWk;\nuniform vec3 uBrickA;\nuniform vec3 uBrickB;\nuniform vec3 uMortar;\nuniform vec3 uBrickOA;\nuniform vec3 uBrickOB;\nuniform vec3 uMortarO;\nuniform vec3 uStoneO;\nuniform vec3 uStoneW;\nuniform vec3 uDryW;\nuniform vec3 uStone;\nuniform vec3 uLichen;\nuniform vec3 uDry;\nuniform vec3 uWine;\nuniform vec3 uMoss;\nuniform vec3 uSunTo;\nvarying float vWt;\nvarying vec3 vWn;\nvarying vec3 v_wp;\nuniform sampler2D gCloudTex;\nuniform vec4 gCloud;\n' + HASH_GLSL + SHADE_GLSL + MASONRY_GLSL)
      .replace('#include <color_fragment>', '#include <color_fragment>\nvec2 gmFw = vec2(max(abs(dFdx(vWuv.x)), abs(dFdy(vWuv.x))), max(abs(dFdx(vWuv.y)), abs(dFdy(vWuv.y))));\ndiffuseColor.rgb = gShade(gardenMasonry(vWuv, vWk, gmFw), 1.0);\nfloat gmSh = (1.0 - smoothstep(-0.05, 0.3, dot(vWn, uSunTo))) * (1.0 - step(-1.19, v_wp.x));\ntotalEmissiveRadiance += diffuseColor.rgb * (0.22 * gmSh * mix(0.8, 1.0, step(vWk, 0.5)));');
  };
  material.customProgramCacheKey = () => 'garden-masonry-16';
  return { material, uniforms };
}

// ---------------------------------------------------------------- every wall of the plan (walls only: no ivy, no plant)
// The boundary with its two piers and the 11 m gateway; the walk's north wall (9 m) with the kitchen garden's 5 m door
// opening and its low south wall (3 m); the garden's four walls (12 m over their own ground, stepped up the rise with
// level courses) and the plain square-headed doorway: 5.0 m clear between pale stone jambs, 7.0 m clear over the 0.3 m step.
export function buildWalls(clock = makeClock()) {
  const M = makeMasonry(), P = PLAN, G = P.garden, T = P.wallT, sink = 1.2;
  // the boundary: dry-stone, 5 m, centred on x -92, with the gateway about z 5
  const bx0 = P.boundaryX - P.boundaryT / 2, bx1 = P.boundaryX + P.boundaryT / 2;
  const gz0 = P.gateZ - P.gateHalf, gz1 = P.gateZ + P.gateHalf, pw = P.pierW;
  M.wall(bx0, -300, bx1, gz0 - pw, -sink, P.boundaryH, 2);
  M.wall(bx0, gz1 + pw, bx1, 300, -sink, P.boundaryH, 2);
  for (const z of [gz0 - pw, gz1]) {
    M.wall(P.boundaryX - pw / 2, z, P.boundaryX + pw / 2, z + pw, -sink, P.pierH - 0.6, 2);
    M.box(P.boundaryX - pw / 2 - 0.25, P.pierH - 0.6, z - 0.25, P.boundaryX + pw / 2 + 0.25, P.pierH, z + pw + 0.25, 2, 'Y');
    const a0 = P.boundaryX - pw / 2 - 0.25, a1 = P.boundaryX + pw / 2 + 0.25, c0 = z - 0.25, c1 = z + pw + 0.25, yb = P.pierH, yt = P.pierH + 0.7, q = 1.2;
    M.quad([a0, yb, c1], [a1, yb, c1], [a1 - q, yt, c1 - q], [a0 + q, yt, c1 - q], [0, 0.86, 0.5], 2);
    M.quad([a1, yb, c0], [a0, yb, c0], [a0 + q, yt, c0 + q], [a1 - q, yt, c0 + q], [0, 0.86, -0.5], 2);
    M.quad([a1, yb, c1], [a1, yb, c0], [a1 - q, yt, c0 + q], [a1 - q, yt, c1 - q], [0.5, 0.86, 0], 2);
    M.quad([a0, yb, c0], [a0, yb, c1], [a0 + q, yt, c1 - q], [a0 + q, yt, c0 + q], [-0.5, 0.86, 0], 2);
    M.quad([a0 + q, yt, c1 - q], [a1 - q, yt, c1 - q], [a1 - q, yt, c0 + q], [a0 + q, yt, c0 + q], [0, 1, 0], 2);
  }
  // the worn sill of the gateway, flush with the ground
  M.box(P.boundaryX - pw / 2, -0.4, gz0, P.boundaryX + pw / 2, 0.08, gz1, 1, 'yzZ');
  // the walk's north wall with the kitchen garden's door opening, and the low south wall
  const kx0 = P.kitchenDoorX - P.kitchenDoorHalf, kx1 = P.kitchenDoorX + P.kitchenDoorHalf;
  M.wall(bx1, -P.walkZ - T, kx0, -P.walkZ, -sink, P.walkNorthH, 0, { coping: true });
  M.wall(kx1, -P.walkZ - T, -T, -P.walkZ, -sink, P.walkNorthH, 0, { coping: true });
  M.wall(kx0 - 0.4, -P.walkZ - T - 0.08, kx1 + 0.4, -P.walkZ + 0.08, P.kitchenDoorH, P.kitchenDoorH + 0.9, 1, { under: true });
  M.wall(kx0, -P.walkZ - T, kx1, -P.walkZ, P.kitchenDoorH + 0.9, P.walkNorthH, 0, { coping: true, skip: 'xX' });
  M.wall(bx1, P.walkZ, -T, P.walkZ + T, -sink, P.walkSouthH, 0, { coping: true });
  // the kitchen garden's far wall (north), as high as the walk's north wall
  M.wall(bx1, P.kitchenFarZ - T, -T, P.kitchenFarZ, -sink, P.walkNorthH, 0, { coping: true });
  // the door wall: brick to either hand of the doorway and over its lintel; jambs, lintel and step of pale stone,
  // standing 0.08 m proud of the brick
  const dh = P.doorHalf, jw = P.jambW, lintelY = P.stepH + P.doorClear, pr = 0.08;
  M.wall(-T, G.z0 - T, 0, -dh - jw, -sink, P.wallH, 0, { coping: true });
  M.wall(-T, dh + jw, 0, G.z1 + T, -sink, P.wallH, 0, { coping: true });
  M.wall(-T, -dh - jw, 0, dh + jw, lintelY + P.lintelH, P.wallH, 0, { coping: true, skip: 'zZ' });
  M.wall(-T - pr, -dh - jw, pr, -dh, -sink, lintelY, 1);
  M.wall(-T - pr, dh, pr, dh + jw, -sink, lintelY, 1);
  M.wall(-T - pr, -dh - jw - 0.3, pr, dh + jw + 0.3, lintelY, lintelY + P.lintelH, 1, { under: true });
  M.box(-T - 0.7, -sink, -dh - jw, 0.5, P.stepH, dh + jw, 1, 'y');
  // the north and south walls, stepped up the rise: ten runs of 11.5 m each a metre higher, then level to the east wall
  const steps = 10, run = P.riseEndX / steps;
  for (const side of [-1, 1]) {
    const z0 = side < 0 ? G.z0 - T : G.z1, z1 = z0 + T;
    for (let i = 0; i < steps; i++) {
      M.wall(i * run, z0, (i + 1) * run, z1, riseAt(i * run) - sink, P.wallH + riseAt((i + 1) * run), 0, { coping: true });
    }
    M.wall(P.riseEndX, z0, G.x1, z1, P.riseTop - sink, P.wallH + P.riseTop, 0, { coping: true });
  }
  // the east wall, its coping a hand higher than its neighbours' so that no two faces share a plane
  M.wall(G.x1, G.z0 - T, G.x1 + T, G.z1 + T, P.riseTop - sink, P.wallH + P.riseTop + 0.12, 0, { coping: true });
  const mat = makeMasonryMaterial(clock);
  const mesh = new THREE.Mesh(M.geometry(), mat.material);
  mesh.name = 'garden-walls';
  return { object: mesh, panels: M.panels, triangles: M.triangles(), material: mat.material };
}

// ---------------------------------------------------------------- the ground's colour, by place
// THE GARDEN'S FLOOR reads seasonAt at its own place. Its colours are NAMED as they come out under the low gold
// sun and PAINTED by measure (G4c): the engine's tone curve deepens a dark colour and the gold light eats
// its blue, so each paint is greyer and bluer than the swatch it comes out as (earth 1c1712, grey brown 6b5a4a, bleached
// straw c8b27a, the fresh green 5a8a3c at its brightest, the summer's 2f5a2c).
// THE END OF WINTER (to S 0.33): damp dark earth, grey brown matted on it, bleached straw in swathes: no orange, no
// yellow, no green. Then the green comes through tuft by tuft and patch by patch (never as one tide), the straw's
// patches lying on until S 0.5. THE FRESH PART: the hollows of the ground damp and dark, its ridges paler, broad
// patches of a bluer green, every tuft with a tip of its own; the summer's deep green only from S 0.9.
const C_WINTER = new THREE.Color('#8c8560'), C_TMP = new THREE.Color(), C_TMP2 = new THREE.Color();
const FLOOR = Object.fromEntries(Object.entries({ earth: '#3a3331', brown: '#76685e', straw: '#c2aa8a', strawHi: '#d2b890', stem: '#5a554f', fresh: '#62964a', freshHi: '#84b260',
  summer: '#487e44', summerHi: '#5e9a54', ridge: '#96b272', damp: '#3c5c38', young: '#90be62', blue: '#4c8660' }).map(([k, v]) => [k, new THREE.Color(v)]));
export const FLOOR_PLAN = { greyTo: 0.33, greenBy: 0.5, strawTo: 0.5, lag: 0.06, summer: [0.84, 0.95] };
// n: the broad noise of place, n3: a finer one, rel: the ground's own relief over the even rise (a hollow under 0, a
// ridge over it), tuft: under 0 for the ground itself, else a tuft's own number 0..1
export function gardenGrassInto(c, x, z, n, n3 = 0, rel = 0, tuft = -1) {
  const S = seasonAt(x, z), m = 0.5 + 0.5 * n, Fl = FLOOR, Q = FLOOR_PLAN, sm = sstep(Q.summer[0], Q.summer[1], S);
  const patch = sstep(0.1, 0.5, n3), hollow = sstep(0.05, -0.35, rel + 0.25 * n), ridge = sstep(0.15, 0.6, rel + 0.2 * n3);
  const green = C_TMP.copy(Fl.fresh).lerp(Fl.freshHi, m).lerp(C_TMP2.copy(Fl.summer).lerp(Fl.summerHi, m), sm);
  if (tuft < 0) {
    // the ground itself
    c.copy(Fl.earth).lerp(Fl.brown, 0.4 + 0.5 * sstep(-0.35, 0.3, n)).lerp(Fl.straw, 0.7 * sstep(-0.05, 0.45, n3));
    green.lerp(Fl.blue, 0.4 * sstep(0.15, 0.6, -n3)).lerp(Fl.damp, 0.45 * hollow).lerp(Fl.ridge, 0.5 * ridge);
    return c.lerp(green, sstep(Q.greyTo, Q.greenBy, S - Q.lag * patch));
  }
  // a tuft: bleached straw, grey brown or dark grey stems in winter
  const t2 = (tuft * 9.73 + 0.31) % 1, t3 = (tuft * 23.17 + 0.57) % 1, t4 = (tuft * 57.3 + 0.11) % 1;
  if (tuft < 0.5) c.copy(Fl.straw).lerp(Fl.strawHi, t2); else if (tuft < 0.86) c.copy(Fl.brown).lerp(Fl.straw, 0.35 * t2); else c.copy(Fl.stem).lerp(Fl.brown, 0.5 * t2);
  // the S at which THIS tuft turns green (later in the straw's patches), and then its own tip: young, bluer or plain
  const turn = Q.greyTo + (Q.strawTo - Q.greyTo) * (0.75 * t3 + 0.25 * patch), g = sstep(turn - 0.02, turn + 0.03, S);
  if (g <= 0) return c;
  if (t2 < 0.3) green.lerp(Fl.young, 0.55 * (1 - 0.6 * sm)); else if (t2 > 0.68) green.lerp(Fl.blue, 0.45);
  green.lerp(Fl.damp, 0.45 * hollow).lerp(Fl.ridge, 0.4 * ridge).multiplyScalar(0.74 + 0.3 * t4);
  return c.lerp(green, g);
}

// THE FAR END'S FLOOR over the summer grass: the walk of rough grass to the alcove (6 m wide, ragged, a little paler:
// trodden by nobody now), the wide pale ring of fallen petals under the great rose tree, and the low sun's light on
// the last lawn's grass
export const FAR_FLOOR = { walk: [-70, -13, 3.0, 1.2], walkTone: '#b2bf86', walkGain: 0.78, ring: [6, 9.5, 15, 20], petal: '#efdcd2', petalGain: [0.5, 0.27], light: '#a8c468', lightGain: 0.42, lightFrom: [110, 120], shade: 0.7 };
const C_WALK = new THREE.Color(FAR_FLOOR.walkTone), C_PETAL = new THREE.Color(FAR_FLOOR.petal), C_LAWN = new THREE.Color(FAR_FLOOR.light);
let farFrame = null;
function farFloorInto(c, x, z, n, tuft) {
  const Q = FAR_FLOOR, fr = farFrame || (farFrame = alcoveFrame()), ap = fr.of(x, z), wob = 1.1 * (vnoise(x * 0.21 + 3, z * 0.21 - 7) - 0.5) * 2;
  const w = sstep(Q.walk[0] - 6, Q.walk[0], ap[0]) * sstep(Q.walk[1] + 4, Q.walk[1], ap[0]) * sstep(Q.walk[2] + Q.walk[3], Q.walk[2] - Q.walk[3], Math.abs(ap[1] + wob));
  c.lerp(C_LAWN, Q.lightGain * sstep(Q.lightFrom[0], Q.lightFrom[1], x) * (0.75 + 0.25 * n));
  if (w > 0) c.lerp(C_WALK, Q.walkGain * w * (0.7 + 0.3 * n));
  const d = Math.hypot(x - PLAN.roseTree[0], z - PLAN.roseTree[1]) + 2.2 * (vnoise(x * 0.16 - 5, z * 0.16 + 11) - 0.5) * 2;
  const r = sstep(Q.ring[0], Q.ring[1], d) * sstep(Q.ring[3], Q.ring[2], d);
  if (r > 0) c.lerp(C_PETAL, Q.petalGain[tuft < 0 ? 0 : 1] * r * (0.45 + 0.55 * vnoise(x * 0.7 + 1.7, z * 0.7 - 2.9)));
  return c;
}

// one colour of place for the whole ground: the winter moor (heather brown-purple, wine, bleached gold grass), the
// boundary's worn foot, the walk's raked gravel with its grass verges, the kitchen garden's turned earth, the orchard's
// winter grass, the garden's grass; then the walls' shade by place laid on it (cool, soft-edged, never black)
export const GREY_LIT = { from: [22, 34], season: [0.5, 0.74], earth: [1.25, 1.1, 0.7], tuft: [0.45, 0.38, 0.2] };
export function makeGroundColor(noise, sunAt, way = null) {
  const P = PLAN, G = P.garden;
  const heather = new THREE.Color('#5d4a4b'), heatherMoor = new THREE.Color('#6d575a'), wine = new THREE.Color('#7a5565'), gold = new THREE.Color('#cdb880'), goldMoor = new THREE.Color('#e4d196'), peat = new THREE.Color('#5a4842');
  const gravel = new THREE.Color('#ece6da'), gravel2 = new THREE.Color('#dcd4c4'), verge = new THREE.Color('#77704a');
  const earth = new THREE.Color('#4d3d31'), orchard = new THREE.Color('#857a4e');
  return (x, z, y, ny, out, t, tuft = -1) => {   // t is the kit terrain's own sixth value: not read here
    const n = noise.fbm2(x * 0.045, z * 0.045, 2), n2 = noise.n2(x * 0.011 + 9.0, z * 0.011 - 4.0);
    if (x < P.boundaryX) {
      // the moor: heather in broad drifts, wine where it is thickest, gold grass between, dark peat in the hollows
      out.copy(heatherMoor).lerp(wine, sstep(0.1, 0.6, n2));
      out.lerp(goldMoor, sstep(-0.05, 0.45, n - 0.5 * n2));
      out.lerp(peat, 0.5 * sstep(0.35, 0.7, -n));
    } else if (x < -P.wallT) {
      const az = Math.abs(z);
      if (az <= P.walkZ) {
        // the walk: the verges' winter grass, mossier under either wall (the gravel is the walk's own sheet over it),
        // and the gravel's own colour under the sheet's middle so that its soft edge has no dark seam
        out.copy(verge).lerp(C_WINTER, 0.5 + 0.5 * n).lerp(gravel, 0.7 * sstep(6.5, 3.5, Math.abs(z - (x < -60 ? 5 : x > -32 ? 0 : 5 * (-32 - x) / 28))));
      } else if (z < 0) {
        // the kitchen garden: winter grass between its dug beds (the beds and its path are their own surfaces)
        out.copy(verge).lerp(C_WINTER, 0.5 + 0.5 * n2).lerp(earth, 0.25 * sstep(0.1, 0.6, n));
      } else {
        out.copy(orchard).lerp(C_WINTER, 0.5 + 0.5 * n2);
      }
      // the worn way through the gateway
      out.lerp(gravel2, 0.8 * sstep(P.boundaryX + 10, P.boundaryX, x) * sstep(7, 4, Math.abs(z - P.gateZ)));
    } else if (x <= G.x1 && z >= G.z0 && z <= G.z1) {
      // the garden's floor: in a wall's shade it stays cool and luminous (a blue-green lift), never dark
      gardenGrassInto(out, x, z, n, noise.n2(x * 0.085 + 31.0, z * 0.085 + 17.0), y - riseAt(x), tuft);
      // (G11) the way mown and trodden under the line: the floor's own colour of that place and season, paler and warmer
      if (way) { const k = way(x, z); if (k > 0) { const T = WAY.tone, g = k * (0.75 + 0.25 * n); out.r *= 1 + T[0] * g; out.g *= 1 + T[1] * g; out.b *= 1 + T[2] * g; } }
      if (x > 108) farFloorInto(out, x, z, n, tuft);
      const lit = sunAt(x, y + 0.05, z), wd = x < DOOR_SHADE.to[0] ? sstep(DOOR_SHADE.to[0], DOOR_SHADE.to[1], x) : 0;
      if (wd > 0) doorShadeInto(C_DOOR.copy(out), lit, tuft);
      // (in the ring's light the shade's cool lift gives way: the grass there keeps its own green)
      const pool = x > 120 ? ringPool(x, z) : 0;
      // (G10c: the lift was 1.7 and more, which drew a wall's band at seven tenths of the lit floor; at 0.45 the band
      // stands in the brief's measure, a little green-blue of the sky in it)
      shadeInto(out, lit, (0.45 + (x > FAR_FLOOR.lightFrom[0] ? 0.4 * FAR_FLOOR.shade * sstep(FAR_FLOOR.lightFrom[0], FAR_FLOOR.lightFrom[1], x) : 0)) * (1 - FAR.ring.grassWarm * Math.min(1, 1.6 * pool)));
      if (wd > 0) out.lerp(C_DOOR, wd);
      // THE GREY GARDEN, LIT (past the door's shade, while the floor is winter's): the low gold sun on earth and winter
      // grass, the lit tufts paler and warmer; nothing in a wall's shade takes it
      const gl = lit * sstep(GREY_LIT.from[0], GREY_LIT.from[1], x) * sstep(GREY_LIT.season[1], GREY_LIT.season[0], seasonAt(x, z));
      if (gl > 0) { const q = tuft < 0 ? GREY_LIT.earth : GREY_LIT.tuft; out.r *= 1 + q[0] * gl; out.g *= 1 + q[1] * gl; out.b *= 1 + q[2] * gl; }
      // the far end: the ring's own light on the grass of the alcove's court and before its mouth. The grass keeps
      // its own green in it, warmed toward yellow-green and brighter (never whitened), each tuft by its own number
      if (pool > 0) {
        const R = FAR.ring, k = pool * (tuft < 0 ? 1 : 0.7 + 0.6 * ((tuft * 37.7 + 0.23) % 1));
        out.r = out.r * (1 + R.grassGain[0] * k) + R.grassAdd[0] * k; out.g = out.g * (1 + R.grassGain[1] * k) + R.grassAdd[1] * k; out.b = out.b * (1 + R.grassGain[2] * k) + R.grassAdd[2] * k;
      }
      return out;
    } else {
      out.copy(C_WINTER).lerp(heather, 0.35 + 0.3 * n2).lerp(gold, 0.25 * sstep(0.0, 0.6, n));
    }
    return shadeInto(out, sunAt(x, y + 0.05, z));
  };
}

// the colour of shade on a lit colour: cool green-violet, 45 to 60 in 100 of the lit ground, never black
// (G10c) THE SHADE'S DEPTH IS ONE MEASURE (SHADE_KEEPS): what full shade keeps of a lit colour, counted in linear
// light: 0.22, 0.27, 0.36. On the display's curve that is drawn as about 0.50, 0.55, 0.63 of the lit colour: the
// brief's 45 to 60 in 100, and cooler. (The figures before, 0.46, 0.53, 0.64, were drawn as 0.70 to 0.82: a shade
// that hardly showed.) The ground's colour, every drawn material (gShade), the trees' field (SHADOW.tint), the
// trunks (BARK.shade) and the roses' and bushes' own dimming all keep this one measure.
export const SHADE_KEEPS = [0.22, 0.27, 0.36];
export function shadeInto(c, lit, lift = 0) {
  const k = 1 - lit, q = k * lift, K = SHADE_KEEPS;
  c.r = c.r * (1 - (1 - K[0]) * k) + 0.012 * q; c.g = c.g * (1 - (1 - K[1]) * k + 0.07 * q) + 0.022 * q; c.b = c.b * (1 - (1 - K[2]) * k + 0.14 * q) + 0.04 * q;
  return c;
}

// THE DOOR'S SHADE (the first 30 m inside the door): the winter floor asleep. Winter grass and grey stems in shade
// are a muted cool grey-brown, never blue or lilac: each colour a little bleached and greyed, then darkened with a
// small even lift (the sky's fill without its blue). By place only: whole to x 24, gone by x 34. The ground between
// the tufts there is last year's grass lying matted and bleached (mat), in the sun's patch through the doorway as in
// the wall's shade. (G10c: THE BAND IS SHADE AS THE BRIEF SAYS: `mul` is what the bleached floor keeps in the door
// wall's shade, in linear light, 0.29, 0.33, 0.42 where it was 0.7, 0.79, 0.95; drawn, the band stands at about 55 to
// 65 in 100 of the same floor in sun, grey-brown and a little cool, never blue. The hanging roses there keep 0.12
// of the lift they had, where 0.42.)
export const DOOR_SHADE = { to: [34, 24], mat: '#c5baa5', matBy: [0.75, 0.3], pale: '#b3aa9c', paleBy: [0.5, 0.25], mul: [0.29, 0.33, 0.42], add: [0.006, 0.007, 0.009], rose: [0.12, 1.05, 1.09, 1.22] };
const C_ASLEEP = new THREE.Color(DOOR_SHADE.pale), C_MAT = new THREE.Color(DOOR_SHADE.mat), C_DOOR = new THREE.Color();
export function doorShadeInto(c, lit, tuft = -1) {
  const D = DOOR_SHADE, k = 1 - lit;
  c.lerp(C_MAT, D.matBy[tuft < 0 ? 0 : 1]);
  c.lerp(C_ASLEEP, D.paleBy[tuft < 0 ? 0 : 1] * k);
  c.r = c.r * (1 - (1 - D.mul[0]) * k) + D.add[0] * k; c.g = c.g * (1 - (1 - D.mul[1]) * k) + D.add[1] * k; c.b = c.b * (1 - (1 - D.mul[2]) * k) + D.add[2] * k;
  return c;
}

// ---------------------------------------------------------------- a drawn material (the one way every surface here is coloured)
// A lit Lambert material whose colour is DRAWN in its fragment shader. `vary` names the attributes handed through to
// the fragment (name: glsl type; read there as v_<name>); `uniforms` are { value, type } objects, shared by reference
// (the world's clock is one such object, set in the world's update and nowhere else).
export function drawnMaterial({ key, uniforms = {}, vary = {}, head = '', color = '', vertexHead = '', vertex = '', after = '', extra = {} }) {
  const material = new THREE.MeshLambertMaterial({ color: 0xffffff, ...extra });
  const names = Object.keys(vary);
  const attrs = names.map((n) => `attribute ${vary[n]} ${n};`).join('\n');
  const vars = names.map((n) => `varying ${vary[n]} v_${n};`).join('\n');
  const unis = Object.keys(uniforms).map((n) => `uniform ${uniforms[n].type} ${n};`).join('\n');
  material.onBeforeCompile = (shader) => {
    for (const n of Object.keys(uniforms)) shader.uniforms[n] = uniforms[n];
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\n${attrs}\n${vars}\nvarying vec3 v_wp;\n${unis}\n${HASH_GLSL}\n${vertexHead}`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>\n${names.map((n) => `v_${n} = ${n};`).join('\n')}\n${vertex}\nv_wp = (modelMatrix * vec4(transformed, 1.0)).xyz;`);
    if (after) shader.vertexShader = shader.vertexShader.replace('#include <project_vertex>', `#include <project_vertex>\n${after}`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${vars}\nvarying vec3 v_wp;\n${unis}\n${HASH_GLSL}\n${head}`)
      .replace('#include <color_fragment>', `#include <color_fragment>\n${color}`);
  };
  material.customProgramCacheKey = () => key + '+g7';
  return material;
}
// the colour of shade laid on a drawn colour by its light of place (the same figures as shadeInto)
export const SHADE_GLSL = /* glsl */`
// ONE LAW OF CLOUD SHADE (G9c): the clouds' shade is ONE FIELD over the whole place, moor, walk, door and garden
// alike, moving on the world's clock: no switch, no edge and no change of depth by place. It is the kit terrain's
// own field (gCloudTex; gCloud = its offset, its scale and its depth, copied in the world's update), so a wall, a
// leaf or a pot darkens under the same cloud as the ground at its foot. IT IS MILD: the depth is the kit's one
// figure, handed 0.09 by the world, so ground under the thickest cloud keeps 91 parts in 100 of its lit light, and a
// lit surface drawn here 93 and more (its sun's share falls by that 0.09 toward its own shade tone, which keeps
// 0.22 to 0.36). THE BOUND, AS DRAWN (G11), counted on pictures taken with the cloud's shade and with none along
// the whole line every 5 m on five seeds (330 pairs, in blocks of 25 pixels square): no block stands under 0.82 of
// itself with no cloud, and a block of middle tone and lighter (60 of 255 and over) not under 0.93. The law is
// never under 80: the depth was 0.13 until that count, where the darkest baked shade fell to 0.75.
// the clouds' field itself over a place: 0 under clear sky, 1 under a cloud
float gCloudField() { return smoothstep(0.46, 0.66, texture2D(gCloudTex, v_wp.xz * gCloud.z + gCloud.xy).r); }
float gCloudLit(float lit) { return lit * (1.0 - gCloud.w * gCloudField()); }
vec3 gShade(vec3 c, float lit) { return c * mix(vec3(0.22, 0.27, 0.36), vec3(1.0), gCloudLit(lit)); }
`;

// the z of the flown line where it crosses a given x between the gateway and the sill (the line runs east there)
export function lineZAtX(route, x) {
  let a = 0, b = route.sill + 12;
  for (let i = 0; i < 30; i++) { const m = (a + b) / 2; if (routeAt(route, m).x < x) a = m; else b = m; }
  return routeAt(route, (a + b) / 2).z;
}

// ---------------------------------------------------------------- the walk's own surface
// One thin sheet 0.06 m over the level ground from the gateway's sill to the door wall's foot, wall to wall, drawn by
// place (G10a): RAKED GRAVEL about the flown line and on the side path to the kitchen door; a MADE EDGE (the kerb of
// brick on edge, walkKerb, stands on the gravel's edge: the sheet's own edge is one straight cut under it); short
// WINTER TURF on the verges; over all of it the walls' shade at each point, the kerbs' shadow lines and THE ORCHARD
// TREES' LONG SHADOWS (WALK_SHADE's lattice, filled by castTrees once the trees are dealt). Before the door the gravel
// widens to a court from wall to wall (the last 16 m), its corners left to the grass.
// WHAT WAS WRONG BEFORE (G10a): every grain of the gravel was faded by the pixel's GREATER span on the ground, which
// from the line's 3.8 m over the walk is the span along it and passes 0.2 m only 15 m further on, so the gravel
// beyond was one flat colour; and the verge's tones and the gravel's edge were cut at thresholds of one upright lattice of noise
// (cells 0.37 to 4.5 m), which showed its cells as blocks and stair steps. NOW every pattern of the walk runs ALONG
// it (the rake's furrows, its passes, the stones' streaks, a wheel's mark), is faded by the span ACROSS it, and goes
// to its own mean (the figures stand beside the lines); the turf has no tone cut at a threshold above 0.1 m.
// The apron past the sill (the garden's) and the kitchen garden's path north of the wall are a second mesh in the
// material and the drawing they had (the second material below), unchanged.
// the walk's stations along x and its gravel's middle and half-width there: the sheet's own lattice, so the gravel's
// edges run straight from station to station (the kerb is laid on the same figures)
export function walkStations(route) {
  const P = PLAN, xA = P.boundaryX + P.pierW / 2, xB = -P.wallT - 0.05, n = Math.max(1, Math.round((xB - xA) / 2)), xs = [], mid = [], half = [];
  for (let i = 0; i <= n; i++) { const x = xA + (xB - xA) * i / n; xs.push(x); mid.push(lineZAtX(route, x)); half.push(5.4 + 5.2 * sstep(-16, -5, x)); }
  const at = (x) => {
    const t = Math.max(0, Math.min(n, (x - xA) / (xB - xA) * n)), i = Math.min(n - 1, Math.floor(t)), k = t - i;
    return { mid: mid[i] + (mid[i + 1] - mid[i]) * k, half: half[i] + (half[i + 1] - half[i]) * k };
  };
  return { xA, xB, xs, mid, half, at };
}
// THE BARROW'S WAY (the gardener's plan, G10a; typed, the same on every seed): the wheel's mark comes down the side
// path 0.7 m east of the kitchen door's middle, turns east on a round of 2 m and runs along the walk 3.9 m north of
// its middle (wandering 0.4 m) to the barrow, which stands at x -24.5; the gardener's boot prints lie to either hand
// of it. wayOff(x): the mark's place across the walk, in metres south of the walk's middle line.
export const WALK_WAY = { doorOff: 0.7, off: -3.9, turn: 2.0, barrowX: -24.5 };
export const wayOff = (x) => WALK_WAY.off + (0.3 * Math.sin(x * 0.13) + 0.12 * Math.sin(x * 0.41)) * sstep(2, 6, x - (PLAN.kitchenDoorX + WALK_WAY.doorOff));
export function buildWalk(route, sunAt, clock = makeClock()) {
  const P = PLAN, WS = WALK_SHADE, W = walkStations(route), WW = WALK_WAY;
  const make = () => ({ pos: [], ga: [], gb: [], idx: [] });
  // relAt(x, z) is the signed distance from the sheet's own middle line (the worn way)
  const sheet = (S, xs, zs, yAt, relAt, halfAt, fadeAt, full = 0) => {
    const i0 = S.pos.length / 3, nz = zs.length;
    xs.forEach((x, i) => { for (const z of zs) {
      const y = yAt(x) + 0.06;
      S.pos.push(x, y, z); S.ga.push(x, z, relAt(x, z, i), sunAt(x, y + 0.05, z)); S.gb.push(halfAt(x, i), fadeAt(x, z), full);
    } });
    for (let i = 0; i + 1 < xs.length; i++) for (let j = 0; j + 1 < nz; j++) {
      const a = i0 + i * nz + j, b = a + nz;
      S.idx.push(a, a + 1, b + 1, a, b + 1, b);
    }
  };
  const range = (a, b, step) => { const n = Math.max(1, Math.round((b - a) / step)), out = []; for (let i = 0; i <= n; i++) out.push(a + (b - a) * i / n); return out; };
  const main = make(), paths = make(), xA = W.xA;
  sheet(main, W.xs, range(-P.walkZ, P.walkZ, 1), () => 0, (x, z, i) => z - W.mid[i], (x, i) => W.half[i], (x) => sstep(xA, xA + 1.5, x) * 0.999 + 0.001, 1);
  sheet(paths, range(0.5, 3.5, 0.5), range(-4, 4, 1), riseAt, (x, z) => z, (x) => 2.7 - 0.25 * x, (x) => 1 - sstep(1.6, 3.5, x));
  // the side path north of the wall's face, through the kitchen garden's door and between the dug beds to the far wall
  // (south of the face it is the walk's own gravel, drawn by the walk's sheet between its kerbs)
  const kx = P.kitchenDoorX;
  sheet(paths, range(kx - 6, kx + 6, 1.5), range(P.kitchenFarZ + 1, -P.walkZ + 0.7, 2.5), () => 0, (x) => x - kx, () => 2.3,
    (x, z) => sstep(P.kitchenFarZ + 1, P.kitchenFarZ + 5, z));
  const geo = (S) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(S.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(new Float32Array(S.pos.length).map((v, i) => (i % 3 === 1 ? 1 : 0)), 3));
    g.setAttribute('ga', new THREE.Float32BufferAttribute(S.ga, 4));
    g.setAttribute('gb', new THREE.Float32BufferAttribute(S.gb, 3));
    g.setIndex(S.idx); g.computeBoundingSphere();
    return g;
  };
  const shadeData = new Uint8Array(WS.w * WS.h).fill(255);
  const shade = new THREE.DataTexture(shadeData, WS.w, WS.h, THREE.RedFormat, THREE.UnsignedByteType);
  shade.magFilter = THREE.LinearFilter; shade.minFilter = THREE.LinearMipmapLinearFilter; shade.generateMipmaps = true; shade.anisotropy = 8; shade.needsUpdate = true;
  const C = (hex) => ({ value: new THREE.Color(hex), type: 'vec3' });
  const tones = { uDamp: C('#a39a88'), uGrassA: C('#84936a'), uGrassB: C('#a8a67a'), uGrassC: C('#cdc293'), uMossG: C('#667a3c'), uDriftA: C('#7d6444'), uDriftB: C('#a8956a'),
    uWorn: C('#7a6850'), uTreeShade: { value: shade, type: 'sampler2D' }, ...clock };
  const extra = { transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 };
  const shadeAt = `texture2D(uTreeShade, (v_wp.xz + gsw - vec2(${WS.x0.toFixed(1)}, ${WS.z0.toFixed(1)})) / vec2(${(WS.x1 - WS.x0).toFixed(1)}, ${(WS.z1 - WS.z0).toFixed(1)})).r`;
  const KX = kx.toFixed(1), WX = (kx + WW.doorOff).toFixed(2), G0 = WW.off.toFixed(2), TR = WW.turn.toFixed(1), XW = WW.barrowX.toFixed(2);
  const material = drawnMaterial({
    key: 'garden-walk-9', vary: { ga: 'vec4', gb: 'vec3' }, uniforms: { uGravel: C('#e6dece'), uGravelB: C('#d2c8b4'), ...tones }, head: SHADE_GLSL + GUST_GLSL,
    color: /* glsl */`
      vec2 gp = v_ga.xy; float gr = v_ga.z, ghalf = v_gb.x;
      // a pixel's spans on the ground: the greater (gfw), across the walk's middle line (gfr), along x and along z
      float gfw = max(length(dFdx(gp)), length(dFdy(gp))), gfr = max(abs(dFdx(gr)), abs(dFdy(gr)));
      float gfx = max(abs(dFdx(gp.x)), abs(dFdy(gp.x))), gfz = max(abs(dFdx(gp.y)), abs(dFdy(gp.y)));
      // THE MADE EDGE: gravel within ghalf of the walk's middle line, and on the side path (2.3 m to either hand of
      // the kitchen door's middle) north of it. gem and ge: metres inside the walk's gravel and inside either gravel;
      // the kerb of brick stands on ge 0 to -0.26, so the cut at -0.13 lies under it. No noise moves the edge.
      float gsx = abs(gp.x - (${KX})), gkx = 2.3 - gsx, gside = min(gkx, -gr), gem = ghalf - abs(gr), ge = max(gem, gside);
      float gsp = step(gem, gside) * step(gem, 0.0);                      // 1 on the side path (raked along z), 0 on the walk
      float gra = mix(gr, gp.x - (${KX}), gsp), gal = mix(gp.x, gp.y, gsp), gfa = mix(gfr, gfx, gsp), gfl = mix(gfx, gfz, gsp);
      float gverge = 1.0 - smoothstep(-0.13 - gfa, -0.13 + gfa, ge);
      // RAKED GRAVEL. The rake's passes lie 1.75 m wide along the way, each its own tone and its furrows' own start;
      // the furrows 0.28 m apart, wandering 0.1 m; a darker seam between two passes (0.14 m of 1.75: 0.08, its mean
      // from 0.05 to 0.16 m of span across). The furrows sum to nothing and fade by their own phase's span.
      float gpass = floor(gra / 1.75 + 0.5), gpt = gmHash(vec2(gpass, 3.0 + 9.0 * gsp));
      float gph = gra * 22.44 + 6.283 * gpt + 0.9 * sin(gal * 0.19 + gpass * 2.1) + 1.4 * sin(gal * 0.61 + gpass * 5.3);
      float grake = sin(gph) * (1.0 - smoothstep(1.0, 2.6, max(abs(dFdx(gph)), abs(dFdy(gph)))));
      float gseam = mix(1.0 - smoothstep(0.03, 0.11, abs(fract(gra / 1.75) - 0.5) * 1.75), 0.08, smoothstep(0.05, 0.16, gfa));
      // the stones: light and dark stones 0.13 and 0.28 m across, and streaks of them drawn out along the rake's way
      // (0.9 by 0.125 m and 3.6 by 0.32 m); each is cut about its own middle (its mean is nothing, measured 0.498
      // against 0.5) and fades as a pixel spans 0.35 to 1 of its cells: the streaks by the span across them
      vec2 gq = mat2(0.8, 0.6, -0.6, 0.8) * gp, gq3 = mat2(0.9659, 0.2588, -0.2588, 0.9659) * gp;
      float gs1 = (smoothstep(0.3, 0.7, gvNoise(gq * 7.5)) - 0.5) * (1.0 - smoothstep(0.35, 1.0, gfw * 7.5));
      float gs2 = (smoothstep(0.3, 0.7, gvNoise(gq3 * 3.6 + 5.0)) - 0.5) * (1.0 - smoothstep(0.35, 1.0, gfw * 3.6));
      float gs3 = (gvNoise(vec2(gal * 1.1, gra * 8.0) + 11.0) - 0.5) * (1.0 - smoothstep(0.35, 1.0, max(gfl * 1.1, gfa * 8.0)));
      float gs4 = (gvNoise(vec2(gal * 0.28, gra * 3.1) + 23.0) - 0.5) * (1.0 - smoothstep(0.35, 1.0, max(gfl * 0.28, gfa * 3.1)));
      // (G12) THE STONES THEMSELVES, sharp near at hand: pebbles 0.11 m across (three centimetres of life at the place's
      // three and a half), each its own tone, a dark joint where two meet (0.28 of the ground: taken off, so the grain
      // sums to nothing). It gives way to that nothing as a pixel's GREATER span passes 0.4 to 1.2 of a pebble (a
      // pebble is as long as it is wide; under a tenth of it is left where the span passes one pebble); where it is
      // gone it is not counted. The turf takes the same grain as its tufts, a little lighter.
      float gpe = 0.0, gpk = 1.0 - smoothstep(0.4, 1.2, gfw * 9.0);
      if (gpk > 0.0) {
        vec2 gpq = mat2(0.7986, 0.6018, -0.6018, 0.7986) * gp * 9.0, gpi = floor(gpq), gpf = fract(gpq);
        float gd1 = 9.0, gd2 = 9.0, gpt1 = 0.5;
        for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
          vec2 go = vec2(float(i), float(j)); float gh = gmHash(gpi + go + 31.7);
          vec2 gov = go + 0.15 + 0.7 * vec2(gh, fract(gh * 57.31)) - gpf; float gdd = dot(gov, gov);
          if (gdd < gd1) { gd2 = gd1; gd1 = gdd; gpt1 = fract(gh * 131.7); } else if (gdd < gd2) gd2 = gdd;
        }
        float gjo = 1.0 - smoothstep(0.0, 0.27, sqrt(gd2) - sqrt(gd1));
        gpe = ((gpt1 - 0.5) * (1.0 - gjo) - 0.6 * (gjo - 0.28)) * gpk;
      }
      // THE BARROW'S WAY (WALK_WAY): the wheel's mark, a groove 0.18 m wide (by the share of a pixel's span across
      // that lies in it), and the boot prints to either hand of it east of the turn, 1 m long, 1.225 m apart, left
      // and right by turns (a print covers 0.233 of its band: from 0.3 to 0.9 m of span along the way the prints
      // give way to that band at 0.291 of its middle, the same share)
      float gwx = gp.x - (${WX}), gwg = gr - (${G0}) - (0.3 * sin(gp.x * 0.13) + 0.12 * sin(gp.x * 0.41)) * smoothstep(2.0, 6.0, gwx);
      float gwd = gwx > ${TR} ? abs(gwg) : (gwg < -(${TR}) ? abs(gwx) : abs(length(vec2(gwx - ${TR}, gwg + ${TR})) - ${TR}));
      gwd += 9.0 * step(${XW}, gp.x);
      float gwheel = min(clamp((0.09 - gwd) / max(gfa, 0.002) + 0.5, 0.0, 1.0), 0.18 / max(gfa, 0.002));
      float gbs = gwx / 1.225;
      vec2 gbv = vec2((fract(gbs) - 0.5) * 1.225, gwg - (mod(floor(gbs), 2.0) < 1.0 ? -0.36 : 0.36)) / vec2(0.5, 0.19);
      float gboot = mix(1.0 - smoothstep(0.7, 1.0, length(gbv)), 0.291 * (1.0 - smoothstep(0.6, 1.0, abs(abs(gwg) - 0.36) / 0.19)), smoothstep(0.3, 0.9, gfl));
      gboot *= step(${TR}, gwx) * step(gp.x, ${XW} - 5.4);
      vec3 gc = mix(uGravel, uGravelB, 0.25 + 0.5 * gpt);
      gc *= 1.0 + 0.26 * gs1 + 0.2 * gs2 + 0.22 * gs3 + 0.16 * gs4 + 0.085 * grake * (1.0 - gboot) - 0.07 * gseam + 0.5 * gpe;
      gc *= (1.0 - 0.34 * gwheel - 0.2 * gboot) * (1.0 - 0.06 * (1.0 - smoothstep(0.0, 1.4, ge)));   // (damp toward its edges)
      // last year's leaves: single leaves 0.24 to 0.4 m long lying here and there on the gravel (0.0041 of it: their mean
      // from 0.05 to 0.18 m of span), and drifts of them along the kerbs' feet and under the south wall, each drift
      // long and narrow along the way (a drift's leaves cover 0.42 of it: their mean)
      vec2 glq = gp / 1.3, gli = floor(glq); float glh = gmHash(gli + 5.0), gla = glh * 37.0;
      vec2 glo = (fract(glq) - 0.5 - (vec2(gmHash(gli + 1.3), gmHash(gli + 8.1)) - 0.5) * 0.6) * 1.3;
      float gleaf = step(0.8, glh) * (1.0 - smoothstep(0.75, 1.0, length(vec2(cos(gla) * glo.x + sin(gla) * glo.y, cos(gla) * glo.y - sin(gla) * glo.x) / (vec2(0.2, 0.11) * (0.6 + 0.4 * fract(glh * 61.0))))));
      gleaf = mix(gleaf, 0.0041, smoothstep(0.05, 0.18, gfw)) * (1.0 - gverge) * 0.8;
      float gband = min(1.0, step(0.0, ge) * (1.0 - smoothstep(0.1, 1.6, ge)) + 0.8 * smoothstep(9.3, 10.3, gp.y));
      float gdr = smoothstep(0.42, 0.7, gvNoise(vec2(gal * 0.13, gra * 0.9) + 40.0)) * gband;
      float gfl2 = mix(0.42, smoothstep(0.5, 0.6, gvNoise(gp * 5.3 + 3.0)), 1.0 - smoothstep(0.35, 1.0, gfw * 5.3));
      // THE VERGES: short winter turf, fine and even: blades in flecks of 0.11 and 0.23 m, a soft tone over 0.5 m,
      // and the mower's fine streaks along the walk (1.2 by 0.12 m and 3 by 0.3 m, faded by the span across them);
      // each fades as a pixel spans 0.35 to 1 of its cells, to its own middle; one slow tone over 2.2 m no deeper
      // than 2 parts in 100; bleached blades among the green in streaks 0.1 m wide (0.24 of the turf: their mean).
      // THE TURF IN THE WIND (G7): as a gust's band crosses them the blades lean down the wind and stand again (the
      // drawing is read up to 0.08 m aside, with a quick tremble of 0.02 m) and show their pale sides; by place and
      // the world's clock
      float gbl = gGustBand(v_wp.xz * 1.2);
      vec2 gpl = gp + gWind.xy * (0.08 * gbl) + 0.02 * gbl * vec2(sin(uTime * 5.3 + gp.x * 3.1), sin(uTime * 4.7 + gp.y * 2.7));
      vec2 gtq = mat2(0.8, 0.6, -0.6, 0.8) * gpl, gtq3 = mat2(0.9659, 0.2588, -0.2588, 0.9659) * gpl;
      float gb1 = (smoothstep(0.3, 0.7, gvNoise(gtq * 9.0)) - 0.5) * (1.0 - smoothstep(0.35, 1.0, gfw * 9.0));
      float gb2 = (gvNoise(gtq3 * 4.3 + 5.0) - 0.5) * (1.0 - smoothstep(0.35, 1.0, gfw * 4.3));
      float gb3 = (gvNoise(gtq * 1.9 + 13.0) - 0.5) * (1.0 - smoothstep(0.35, 1.0, gfw * 1.9));
      float gb4 = (smoothstep(0.3, 0.7, gvNoise(vec2(gpl.x * 0.83, gr * 8.3) + 51.0)) - 0.5) * (1.0 - smoothstep(0.35, 1.0, max(gfx * 0.83, gfr * 8.3)));
      float gb5 = (gvNoise(vec2(gpl.x * 0.33, gr * 3.3) + 77.0) - 0.5) * (1.0 - smoothstep(0.35, 1.0, max(gfx * 0.33, gfr * 3.3)));
      vec3 gv = mix(uGrassA, uGrassB, 0.36 + 0.1 * (gvNoise(gp * 0.45 + 21.0) - 0.5) + 0.2 * gb3) * (1.0 + 0.3 * gb1 + 0.22 * gb2 + 0.3 * gb4 + 0.2 * gb5 + 0.42 * gpe);
      gv = mix(gv, uGrassC, 0.55 * mix(0.24, smoothstep(0.62, 0.72, gvNoise(vec2(gpl.x * 1.7, gr * 9.5) + 31.0)), 1.0 - smoothstep(0.35, 1.0, max(gfx * 1.7, gfr * 9.5))));
      gv = mix(gv, uGrassC, 0.1 * smoothstep(0.45, 0.85, gbl));
      // moss at both walls' feet, in tufts of 0.2 m (half the foot: its mean)
      float gmoss = mix(0.5, smoothstep(0.35, 0.65, gvNoise(gtq3 * 5.0 + 11.0)), 1.0 - smoothstep(0.35, 1.0, gfw * 5.0));
      gv = mix(gv, uMossG * (1.0 + 0.3 * gb2), smoothstep(9.1, 10.3, abs(gp.y)) * (0.35 + 0.65 * gmoss));
      // the turf WORN BY FEET to either hand of the side path before the kitchen door: trodden earth in flecks of
      // 0.13 m, thick at the door and the path's kerb, gone 2.8 m from the kerb and 7 m from the wall (the share of
      // the noise over a figure t is 1 - t * t * (3 - 2 t): its mean)
      float gwn = step(2.56, gsx) * (1.0 - smoothstep(0.0, 2.8, gsx - 2.56)) * (1.0 - smoothstep(-9.0, -3.5, gp.y)), gwt = 1.0 - 0.77 * gwn;
      float gworn = mix(1.0 - gwt * gwt * (3.0 - 2.0 * gwt), smoothstep(gwt - 0.05, gwt + 0.05, gvNoise(gtq * 7.9 + 3.0)), 1.0 - smoothstep(0.35, 1.0, gfw * 7.9));
      gv = mix(gv, uWorn * (1.0 + 0.3 * gb2), gworn);
      vec3 gcol = mix(gc, gv, gverge);
      gcol = mix(gcol, mix(uDriftA, uDriftB, gvNoise(gp * 3.1 + 70.0)), max(gleaf, 0.8 * gdr * gfl2));
      // the walls' shade and the orchard trees' long shadows. THE BOUGHS SWING (G7) AND THEIR SHADOWS WITH THEM: only
      // boughs and twigs reach the walk (a trunk's shadow ends in the orchard), so the whole lattice is read a little
      // aside, by place and the world's clock: 0.12 m in a lull, 0.32 m on a gust's crest, in slow waves of 4.7 and
      // 6 s that differ from tree to tree (the boughs' own swing is 0.2 to 0.45 m at a tip)
      vec2 gsw = vec2(sin(uTime * 1.35 + dot(v_wp.xz, vec2(0.21, 0.17))), sin(uTime * 1.05 + dot(v_wp.xz, vec2(-0.16, 0.23)) + 1.7));
      gsw *= 0.12 + 0.2 * gGustBand(v_wp.xz * 1.2);
      float gts = ${shadeAt};
      // THE KERBS' SHADOW LINES: a kerb stands 0.11 m over the sheet and the sun stands low in the south-west, so
      // its shadow lies 0.14 m to its north and 0.2 m to its east: on the gravel north of the south kerb, on the turf
      // north of the north kerb, on the side path east of its west kerb and on the turf east of its east kerb; each
      // only where its kerb stands (not where the gravel meets a wall), its edge one pixel's span wide
      float gnorth = step(gr, 0.0), gk = (1.0 - gnorth) * step(0.0, gem) * (1.0 - smoothstep(0.14 - gfa, 0.14 + gfa, gem)) * step(gp.y + gem, 10.1);
      gk = max(gk, gnorth * step(gside, gem) * step(gem, -0.26) * smoothstep(-0.4 - gfa, -0.4 + gfa, gem) * step(-10.1, gp.y - gem));
      gk = max(gk, gnorth * step(gem, 0.0) * step(gp.x, ${KX}) * step(0.0, gkx) * (1.0 - smoothstep(0.2 - gfx, 0.2 + gfx, gkx)));
      gk = max(gk, gnorth * step(gem, -0.26) * step(${KX}, gp.x) * step(gkx, -0.26) * smoothstep(-0.46 - gfx, -0.46 + gfx, gkx));
      diffuseColor.rgb = gShade(gcol, v_ga.w * gts * (1.0 - 0.9 * gk));
      diffuseColor.a = v_gb.y;`,
    extra,
  });
  // the apron's and the kitchen path's material: the drawing they had before G10a, letter for letter
  const pathsMaterial = drawnMaterial({
    key: 'garden-walk-8', vary: { ga: 'vec4', gb: 'vec3' }, uniforms: { uGravel: C('#f2ece0'), uGravelB: C('#e0d8c8'), ...tones }, head: SHADE_GLSL + GUST_GLSL,
    color: /* glsl */`
      vec2 gp = v_ga.xy; float gd = abs(v_ga.z), gfull = v_gb.z;
      float gfw = max(length(dFdx(gp)), length(dFdy(gp))), gfz = max(abs(dFdx(gp.y)), abs(dFdy(gp.y)));
      float gnear = 1.0 - smoothstep(0.03, 0.11, gfw), gmid = 1.0 - smoothstep(0.1, 0.4, gfw), gwide = 1.0 - smoothstep(0.35, 1.2, gfw);
      // the gravel's edge against the grass: uneven, the grass creeping in in tongues
      float gwob = (gvNoise(gp * 0.22) - 0.5) * 1.7 + (gvNoise(gp * 0.9) - 0.5) * 0.8 + (gvNoise(gp * 3.3) - 0.5) * 0.45 * gmid;
      float ghalf = v_gb.x + gwob;
      float gverge = smoothstep(ghalf - 0.3, ghalf + 0.3, gd);
      // raked gravel: three sizes of grain, each giving way to its mean; rake lines in passes along the walk; no track
      vec2 gwp = gp + 0.8 * (vec2(gvNoise(gp * 0.7 + 3.0), gvNoise(gp * 0.7 + 19.0)) - 0.5);
      vec2 gq = mat2(0.8, 0.6, -0.6, 0.8) * gwp, gq2 = mat2(0.6, -0.8, 0.8, 0.6) * gwp, gq3 = mat2(0.9659, 0.2588, -0.2588, 0.9659) * gwp;
      float g1 = ((gvNoise(gq * 6.0) + gvNoise(gq3 * 7.3 + 5.0)) * 0.5 - 0.5) * 1.4 * (1.0 - smoothstep(0.04, 0.085, gfw));
      float g2 = ((gvNoise(gq2 * 2.6 + 9.0) + gvNoise(gq * 3.1 + 2.0) + gvNoise(gq3 * 2.2 + 31.0)) / 3.0 - 0.5) * 1.6 * (1.0 - smoothstep(0.06, 0.13, gfw));
      float g4 = ((gvNoise(gq2 * 0.9 + 3.0) + gvNoise(gq * 1.15 + 17.0) + gvNoise(gq3 * 0.75 + 41.0)) / 3.0 - 0.5) * 1.5 * (1.0 - smoothstep(0.1, 0.22, gfw));
      float g3 = mix(gvNoise(gq * 0.3), 0.5, smoothstep(0.8, 2.0, gfw));
      vec3 gc = mix(uGravel, uGravelB, 0.75 * g3) * (1.0 + 0.36 * g1 + 0.22 * g2 + 0.07 * g4);
      float grz = gp.y + 0.1 * sin(gp.x * 0.19 + floor(gp.y / 1.75) * 2.1);
      // (the rake's fine lines sum to nothing; the dark line between two passes is 0.0517 of the gravel and goes to
      // that mean where the lines fall under 0.05 to 0.15 m of footprint)
      float grk = 1.0 - smoothstep(0.05, 0.15, gfz);
      gc *= 1.0 + (0.045 * sin(grz * 17.95) * grk - 0.04 * mix(0.0517, 1.0 - smoothstep(0.0, 0.09, abs(fract(gp.y / 1.75 + 0.5) - 0.5) * 1.75), grk)) * gfull;
      gc = mix(gc, uDamp, 0.35 * smoothstep(ghalf - 1.3, ghalf, gd) * gvNoise(gp * 1.7));
      // the verges: winter turf in tufts of unlike green, bleached blades among it; moss at both walls' feet
      // THE TURF IN THE WIND (G7): as a gust's band crosses them the blades lean down the wind and stand again (the
      // tufts' drawing is read up to 0.08 m aside, with a quick tremble of 0.02 m) and show their pale sides; by place
      // and the world's clock; the moss at the walls' feet reads the drawing unmoved
      float gbl = gGustBand(v_wp.xz * 1.2);
      vec2 gpl = gp + gWind.xy * (0.08 * gbl) + 0.02 * gbl * vec2(sin(uTime * 5.3 + gp.x * 3.1), sin(uTime * 4.7 + gp.y * 2.7));
      float gt1 = gvNoise(gp * 0.6 + 21.0), gt2 = gvNoise(gpl * 2.7 + 5.0), gt3 = gvNoise(gpl * vec2(7.0, 11.0) + 13.0), gt2s = gvNoise(gp * 2.7 + 5.0);
      vec3 gv = mix(uGrassA, uGrassB, smoothstep(0.3, 0.7, 0.55 * gt1 + mix(0.225, 0.45 * gt2, gmid)));
      gv = mix(gv, uGrassC, 0.62 * smoothstep(0.48, 0.76, gt2) * gmid + 0.196 * (1.0 - gmid));   // (0.196: 0.62 of the bleached blades' own mean, 0.316)
      gv *= 0.86 + 0.28 * mix(0.5, gt3, gnear);
      gv = mix(gv, uGrassC, 0.12 * smoothstep(0.45, 0.85, gbl));
      float gfoot = smoothstep(9.2, 10.7, abs(gp.y)) * gfull;
      gv = mix(gv, uMossG * (0.8 + 0.4 * gt2s), gfoot * (0.35 + 0.65 * smoothstep(0.35, 0.65, gvNoise(gp * 0.8 + 11.0))));
      vec3 gcol = mix(gc, gv, gverge);
      // last year's leaves, blown into drifts along the gravel's edges and under the south wall (each leaf about 0.25 m)
      float gband = min(1.0, (1.0 - smoothstep(0.3, 1.9, abs(gd - ghalf - 0.3))) + 0.8 * smoothstep(9.4, 10.6, gp.y) * gfull);
      float gdr = smoothstep(0.42, 0.7, gvNoise(gp * vec2(0.3, 0.8) + 40.0)) * gband;
      float gfl = mix(0.42, smoothstep(0.5, 0.6, gvNoise(gp * 5.3 + 3.0)), gmid);   // (0.42: the leaves' own mean over a drift)
      gcol = mix(gcol, mix(uDriftA, uDriftB, gvNoise(gp * 3.1 + 70.0)), 0.85 * gdr * gfl);
      // the walls' shade and the orchard trees' long shadows. THE BOUGHS SWING (G7) AND THEIR SHADOWS WITH THEM: only
      // boughs and twigs reach the walk (a trunk's shadow ends in the orchard), so the whole lattice is read a little
      // aside, by place and the world's clock: 0.12 m in a lull, 0.32 m on a gust's crest, in slow waves of 4.7 and
      // 6 s that differ from tree to tree (the boughs' own swing is 0.2 to 0.45 m at a tip)
      vec2 gsw = vec2(sin(uTime * 1.35 + dot(v_wp.xz, vec2(0.21, 0.17))), sin(uTime * 1.05 + dot(v_wp.xz, vec2(-0.16, 0.23)) + 1.7));
      gsw *= 0.12 + 0.2 * gGustBand(v_wp.xz * 1.2);
      float gts = mix(1.0, texture2D(uTreeShade, (v_wp.xz + gsw - vec2(${WS.x0.toFixed(1)}, ${WS.z0.toFixed(1)})) / vec2(${(WS.x1 - WS.x0).toFixed(1)}, ${(WS.z1 - WS.z0).toFixed(1)})).r, gfull);
      diffuseColor.rgb = gShade(gcol, v_ga.w * gts);
      diffuseColor.a = mix(1.0 - smoothstep(ghalf - 0.35, ghalf + 0.55, gd), 1.0, gfull) * v_gb.y;`,
    extra,
  });
  const mesh = new THREE.Mesh(geo(main), material), pathsMesh = new THREE.Mesh(geo(paths), pathsMaterial);
  mesh.name = 'garden-walk'; mesh.renderOrder = 1; pathsMesh.name = 'garden-walk-paths'; pathsMesh.renderOrder = 1;
  mesh.add(pathsMesh);
  // the orchard's shadows, laid once the trees are dealt (the world calls it after its wood is built)
  const castTrees = async (casters, yieldNow) => { await bakeWalkShade(casters, shadeData, yieldNow); shade.needsUpdate = true; };
  return { object: mesh, material, triangles: (main.idx.length + paths.idx.length) / 3, shade, castTrees, paths: { object: pathsMesh, geometry: pathsMesh.geometry, material: pathsMaterial } };
}

// ---------------------------------------------------------------- the ivy on the door wall: its drawing
// a noise of place for the makers (fixed: it reads no seed), 0..1, and three octaves of it
// hash2 (G8b): a lattice hash of this world's own (two whole numbers in, one number 0..1 out, no seed). Its numbers are
// made from the garden's own measures (the dial abeam at 252.0, the rose tree at 299.3; the garden 185 long, the season
// over 130, the sill at 120; the sill at 120.6, the straight's end at 183.1), all three odd; its mix is our own.
const hash2 = (i, j) => { let h = Math.imul((i | 0) ^ Math.imul(j | 0, 2520299301), 1851301201); h ^= h >>> 15; h = Math.imul(h, 1206183159); h ^= h >>> 14; return (h >>> 0) / 4294967296; };
export function vnoise(x, y) {
  const i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  return (hash2(i, j) * (1 - u) + hash2(i + 1, j) * u) * (1 - v) + (hash2(i, j + 1) * (1 - u) + hash2(i + 1, j + 1) * u) * v;
}
export const fbm3 = (x, y) => (vnoise(x, y) + 0.5 * vnoise(x * 2.03 + 7.1, y * 2.03 - 3.3) + 0.25 * vnoise(x * 4.1 - 1.7, y * 4.1 + 9.2)) / 1.75;

// the ivy leaf, drawn: a five-lobed evergreen leaf in its own frame (stalk low, tip toward +y), dark and glossy with
// paler veins from the stalk into each lobe and a pale sheen on the leaves that face the sky; and one layer of such
// leaves laid in cells over a face (the top leaf at a point, or nothing)
export const IVY_GLSL = /* glsl */`
float gBump(float x, float w) { float t = clamp(1.0 - (x * x) / (w * w), 0.0, 1.0); return t * t; }
float gIvyLeaf(vec2 p) {
  float a = abs(atan(p.x, p.y));
  float R = 0.40 + 0.52 * gBump(a, 0.62) + 0.34 * gBump(a - 1.2, 0.5) + 0.2 * gBump(a - 2.2, 0.45) - 0.2 * gBump(a - 3.1416, 0.4);
  return R - length(p);
}
vec3 gIvyColor(vec2 p, float h, float edge, float fw) {
  vec3 c = mix(uLeafA, uLeafB, h);
  float a = abs(atan(p.x, p.y)), r = length(p);
  float d0 = abs(p.x) + step(p.y, -0.15);
  float d1 = r * abs(sin(a - 1.2)) + step(cos(a - 1.2), 0.0);
  float d2 = r * abs(sin(a - 2.2)) + step(cos(a - 2.2), 0.0);
  // (THE VEINS GO TO THEIR OWN MEAN, G9c: 0.29 of a leaf's face, worked out over the leaf; not to nothing)
  float vein = mix((1.0 - smoothstep(0.02, 0.07, min(d0, min(d1, d2)))) * smoothstep(0.0, 0.14, edge), 0.29, smoothstep(0.1, 0.3, fw));
  c = mix(c, uVein, 0.6 * vein);
  float side = fract(h * 13.7) > 0.5 ? 1.0 : -1.0;
  float sheen = step(0.3, fract(h * 7.3)) * smoothstep(0.02, 0.5, p.x * side) * smoothstep(0.0, 0.2, edge);
  c = mix(c, uSheen, 0.5 * sheen);
  return c * (0.82 + 0.3 * r);
}
// a spray of bare twigs in a card's frame (stalk low, tip toward +y); > 0 on a twig. THE NEAR FORM (far 0): a wavy
// rib and two sets of side twigs to both hands, each 0.024 of the frame to each hand, AT ITS OWN WIDTH FROM EVERY
// PLACE (G10a, the lead's ruling: no twig is drawn wider than itself any more, and none is lifted in tone). THE FAR
// FORM (far 1: a card built 30 m and more in plan from the flown line, TWIG_FAR; a cut by the card's own place at
// build, the same from every place of the eye): the rib and ONE set of side twigs, twice as thick (0.048) and
// steeper, in the same colour. ITS COVER IS THE NEAR FORM'S OWN: the near's twigs cover 0.0877 of the frame (0.111
// of the spray's round), the far's 0.0877 (3,000,000 places over frames and hashes, by a port of these lines).
float gTwig(vec2 p, float h, float far) {
  float w = mix(0.024, 0.048, far);
  float env = 1.0 - length((p - vec2(0.0, 0.3)) / vec2(0.82, 0.74));
  float d = abs(p.x - 0.07 * sin(p.y * 5.0 + h * 20.0)) + step(p.y, -0.45);
  float s1 = p.y * mix(3.4, 2.3, far) + h * 3.0, s2 = p.y * 5.3 + h * 7.0;
  float g1 = mod(floor(s1), 2.0) < 1.0 ? 1.0 : -1.0, g2 = mod(floor(s2), 2.0) < 1.0 ? -1.0 : 1.0;
  float x1 = p.x * g1, x2 = p.x * g2;
  d = min(d, abs(x1 - (0.34 + 0.5 * gmHash(vec2(floor(s1), h * 50.0))) * fract(s1)) * mix(0.8, 1.56, far) + step(x1, -w));
  d = min(d, abs(x2 - (0.18 + 0.36 * gmHash(vec2(floor(s2), h * 80.0 + 3.0))) * fract(s2)) * 0.9 + step(x2, -w) + far);
  return min(w - d, env);
}
// a gorse spray in a card's frame (stalk low): five spiny shoots fanned from the stalk, toothed along their edges;
// .x > 0 on the spray, .y the share of flower there (the flowers sit along the shoots' outer two thirds)
vec2 gGorse(vec2 p, float h, float px) {
  vec2 q = p + vec2(0.0, 0.5);
  float r = length(q), a = atan(q.x, q.y), on = -1.0, fl = 0.0;
  for (int i = 0; i < 5; i++) {
    float fi = float(i), ai = (fi - 2.0) * 0.33 + 0.26 * (gmHash(vec2(fi, h * 40.0)) - 0.5), len = 1.05 + 0.4 * gmHash(vec2(fi + 9.0, h * 70.0));
    float da = a - ai, off = abs(sin(da)) * r, t = r / len;
    float wd = max(0.03 + 0.075 * (1.0 - t) + 0.045 * abs(fract(r * 8.0 + fi * 0.37) - 0.5), 0.8 * px);
    float sd = min(wd - off, min(len - r, cos(da) - 0.2));
    if (sd > on) { on = sd; fl = step(0.4, gmHash(vec2(floor(r * 6.0) + fi * 13.0, h * 90.0))) * step(0.2, t); }
  }
  return vec2(on, mix(fl, 0.52, smoothstep(0.06, 0.2, px)));   // (0.52: the flowers' own share of a spray, worked out over its shoots)
}
vec4 gIvyLayer(vec2 uv, float cell, float seed, float thin, float fw) {
  vec2 q = uv / cell, base = floor(q - 0.5);
  vec4 best = vec4(0.0); float bh = -1.0;
  for (int j = 0; j < 2; j++) for (int i = 0; i < 2; i++) {
    vec2 id = base + vec2(float(i), float(j));
    float h = gmHash(id + seed), h2 = gmHash(id + seed + 31.7);
    if (h2 < thin) continue;
    vec2 c = id + 0.5 + (vec2(h, gmHash(id + seed + 7.1)) - 0.5) * 0.4;
    float ang = 3.1416 + (h2 - 0.5) * 1.9, sc = 0.5 + 0.15 * h, ca = cos(ang), sa = sin(ang);
    vec2 d = (q - c) / sc;
    vec2 p = vec2(ca * d.x - sa * d.y, sa * d.x + ca * d.y) + vec2(0.0, 0.25);
    float e = gIvyLeaf(p);
    if (e > 0.0 && h > bh) { bh = h; best = vec4(gIvyColor(p, h, e, fw / (cell * sc)), 1.0); }
  }
  return best;
}`;
// THE IVY'S CUT OF PLACE (G10a, the lead's ruling): the mass, its single leaves and its sprays each stand as their FAR
// FORM while the eye stands west of x -30 or east of x 30 (the line's metres 0 to 90.6, and from 151.4 on), and as
// themselves between: one flag (uIvyFar), set in the world's update by the eye's side of these two planes, no blend
// and nothing by a distance. Each far form shows its near form's own mean colour and own mean cover, measured on the
// near form by a port of its lines (the figures stand beside each).
export const IVY_CUT = { west: -30, east: 30 };
// the ivy's colours (one set for the mass, the leaves and the trails) and the world's clock and wind (set in update only)
export function makeIvyUniforms() {
  const C = (hex) => ({ value: new THREE.Color(hex), type: 'vec3' });
  return { uLeafA: C('#3a6c56'), uLeafB: C('#5f9270'), uVein: C('#a9be92'), uSheen: C('#a9be7e'), uDeep: C('#46604c'), uBark: C('#70675c'),
    uTwigA: C('#57504a'), uTwigB: C('#7d766a'), uTwigFar: C('#6f6258'), uIvyFar: { value: 1, type: 'float' } };
}
// THE ONE WIND'S GUST as the part's own shaders read it: the kit's form (flora.js floraGust) on the kit wind's own
// figures (gWind = direction x, z, strength, speed; gGust.x = its bands' closeness), by the world's clock alone:
// 0 in a lull, 1 on a gust's crest. The bands run down the wind.
export const GUST_GLSL = /* glsl */`
float gGustBand(vec2 xz) {
  float t = uTime * gWind.w;
  float ph = dot(xz, gWind.xy) * gGust.x - t * 1.15;
  float cr = dot(xz, vec2(-gWind.y, gWind.x)) * gGust.x;
  float g = sin(ph + sin(cr * 0.7 + t * 0.31) * 1.3) * 0.5 + sin(ph * 2.7 + cr * 1.9 + 1.3) * 0.28 + sin(ph * 0.37 - t * 0.2) * 0.22;
  return clamp(0.5 + 0.5 * g, 0.0, 1.0);
}
`;
// The world's clock and wind, and THE CLOUDS' SHADOW: the kit terrain's own drifting field (its texture, and its offset,
// scale and strength, copied here in the world's update), so that every drawn surface darkens under the same cloud as
// the ground beside it. All of it moves by the world's clock alone.
export function makeClock() {
  return { uTime: { value: 0, type: 'float' }, uWind: { value: 1, type: 'float' },
    gCloudTex: { value: null, type: 'sampler2D' }, gCloud: { value: new THREE.Vector4(0, 0, 1 / 520, 0), type: 'vec4' },
    gWind: { value: new THREE.Vector4(0.92, 0.38, 0.9, 0.9), type: 'vec4' }, gGust: { value: new THREE.Vector2(0.18, 0.5), type: 'vec2' } };
}

// ---------------------------------------------------------------- the ivy's mass on the door wall (fixed: it reads no seed)
// The wall's cross-section is walked by p: 0..16 up the outer face, 17 the outer shoulder, 18 the crown, 19 the inner
// shoulder, 20 a little down the inner face. The mass stands proud of it by ivyThick. OLD IVY, UNTRIMMED: it swells
// in bosses (to 2 m from the brick) and sinks in hollows (back to the brick, which shows there in the mass's shade);
// it stands thick as a rolled-back lip right at the doorway's stone and at the folded leaf, and LAPS the stone's outer
// edge, the lintel's top and the leaf's free edge by a ragged margin (the clear region's bounds wander by a noise of
// place); along the top it is ragged: in places it stops short of the coping, whose stone shows there.
const IVY = { holeZ: 3.75, holeY: 8.63, leafZ0: -7.5, leafY: 7.84, rowH: (PLAN.wallH + 0.55) / 16 };
export function ivyProfile(p) {
  const top = PLAN.wallH + 0.55, x0 = -PLAN.wallT - 0.3;
  if (p <= 16) return [x0, top * p / 16, -1, 0];
  if (p <= 17) return [x0, top, -0.75, 0.66];
  if (p <= 18) return [-PLAN.wallT / 2, top, 0, 1];
  if (p <= 19) return [0.3, top, 0.75, 0.66];
  return [0.3, top - 1.3, 1, 0];
}
// the clear region's wandering bounds: the south jamb (z 2.5 to 3.6) keeps its outer 0.06 to 0.56 m under ivy, the
// lintel (y 7.3 to 8.6) its top 0.08 to 0.58 m, the leaf's free edge (z -7.5) up to 0.2 m; the leaf's top edge (y 7.22)
// stays clear by 0.08 m and more. Nothing of the mass is nearer the flown line (z 0) than z 3.04.
const ivyEdge = {
  south: (y) => 3.04 + 0.5 * vnoise(y * 0.9 + 3.1, 7.7),
  head: (z) => 8.02 + 0.5 * vnoise(z * 0.8 + 1.3, 2.9),
  free: (y) => -7.5 + 0.2 * vnoise(y * 1.1 + 9.0, 4.4),
  leafTop: (z) => 7.3 + 0.36 * vnoise(z * 0.9 - 2.0, 5.5),
};
// metres outside the clear region (0 inside it)
export function ivyHoleDist(z, y) {
  const a = Math.hypot(Math.max(0, z - ivyEdge.south(y), -IVY.holeZ - z), Math.max(0, y - ivyEdge.head(z)));
  const b = Math.hypot(Math.max(0, ivyEdge.free(y) - z, z + IVY.holeZ), Math.max(0, y - ivyEdge.leafTop(z)));
  return Math.min(a, b);
}
// how far the ivy stops short of the coping at z (0 where it runs over the top; none over the doorway and the leaf)
export const ivyGap = (z) => 2.0 * sstep(0.34, 0.16, vnoise(z * 0.19 + 40.3, 1.7)) * (0.6 + 0.6 * vnoise(z * 0.8 - 3.0, 8.2)) * sstep(5, 8, Math.abs(z + 2));
// the hollows of the face: 1 at a hollow's heart, 0 on the mass
export const ivyHollow = (z, y) => sstep(0.36, 0.22, fbm3(z * 0.14 + 3.7, y * 0.17 + 9.9));
// the mass's cover at (z, p): 1 on the mass, falling to 0 at the clear region's edge, in a hollow's heart (none within
// 1.2 m of the clear region) and in a gap of the top
export function ivyCover(z, p) {
  const top = PLAN.wallH + 0.55, y = Math.min(p, 16) * IVY.rowH, head = sstep(0, 0.6, top + 0.6 - 1.3 * ivyGap(z) - y);
  if (p > 16) return p >= 20 ? 0 : head;
  const dh = ivyHoleDist(z, y);
  return sstep(-0.1, 0.4, dh) * head * (1 - sstep(0.45, 0.85, ivyHollow(z, y) * sstep(1.2, 2.6, dh)));
}
// metres the mass stands out of its profile (under 0 in a hollow: back to the brick)
export function ivyThick(z, p) {
  const y = Math.min(p, 16) * IVY.rowH, cover = ivyCover(z, p);
  const n = fbm3(z * 0.17 + 11.3, p * 0.21 - 2.7), boss = sstep(0.42, 0.8, vnoise(z * 0.4 - 5.0, p * 0.33 + 1.0)), c = vnoise(z * 0.95 + 3.3, p * 0.75 - 7.7);
  if (p > 16) return (0.2 + 0.5 * n + 0.5 * boss + 0.2 * c + (p >= 20 ? -0.4 : 0.15)) * (p >= 20 ? 1 : cover) - 0.2 * (1 - cover) * (p >= 20 ? 0 : 1);
  const dh = ivyHoleDist(z, y), lip = 0.55 * Math.exp(-dh / 1.6) + 0.3 * Math.exp(-dh / 6);
  return (0.2 + 0.55 * n + 0.85 * boss + 0.2 * c + lip) * cover - 0.2 * (1 - cover) * sstep(0.3, 1.5, dh);
}
// a point of the mass's surface: [x, y, z]
export function ivyPoint(z, p) {
  const f = Math.floor(Math.min(p, 19.999)), k = p - f, a = ivyProfile(f), b = ivyProfile(f + 1), t = ivyThick(z, p);
  const nx = a[2] + (b[2] - a[2]) * k, ny = a[3] + (b[3] - a[3]) * k, nl = Math.hypot(nx, ny) || 1;
  return [a[0] + (b[0] - a[0]) * k + nx / nl * t, a[1] + (b[1] - a[1]) * k + ny / nl * t, z];
}
export async function buildIvyShell(sunAt, colors, clock = makeClock(), yieldNow) {
  const P = PLAN, G = P.garden, zs = [], ps = [], pos = [], iv = [], it = [], idx = [];
  for (let z = G.z0 - P.wallT; z < -15.01; z += 2) zs.push(z);
  for (let z = -15; z <= 15.01; z += 0.6) zs.push(z);
  for (let z = 17; z <= G.z1 + P.wallT + 0.01; z += 2) zs.push(z);
  for (let p = 0; p <= 16.01; p += 0.5) ps.push(p);
  ps.push(17, 18, 19, 20);
  const NP = ps.length, clear = [], half = zs[zs.length >> 1];
  for (const z of zs) {
    // (G8b: one breath at the half of the lattice; the same points in the same order)
    if (yieldNow && z === half) await yieldNow(15, 16.5);
    for (const p of ps) {
      const q = ivyPoint(z, p), y = Math.min(p, 16) * IVY.rowH, dh = p > 16 ? 9 : ivyHoleDist(z, y);
      pos.push(q[0], q[1], q[2]);
      iv.push(z, p * IVY.rowH, ivyCover(z, p), sunAt(q[0] - 0.1, q[1], q[2]));
      it.push(ivyThick(z, p));
      clear.push(dh <= 0);
    }
  }
  for (let i = 0; i + 1 < zs.length; i++) for (let k = 0; k + 1 < NP; k++) {
    const a = i * NP + k, b = a + NP;
    if (clear[a] && clear[b] && clear[a + 1] && clear[b + 1]) continue;
    idx.push(a, b, b + 1, a, b + 1, a + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('iv', new THREE.Float32BufferAttribute(iv, 4));
  g.setAttribute('it', new THREE.Float32BufferAttribute(it, 1));
  g.setIndex(idx); g.computeVertexNormals(); g.computeBoundingSphere();
  const material = drawnMaterial({
    key: 'garden-ivy-mass-5', vary: { iv: 'vec4', it: 'float' }, uniforms: { ...colors, ...clock }, head: IVY_GLSL + SHADE_GLSL,
    color: /* glsl */`
      vec3 iwn = inverseTransformDirection(normalize(vNormal), viewMatrix), ian = abs(iwn);
      vec2 iuv = v_iv.xy;
      // (a flank of the mass, a face turned out of the wall's plane: its leaves are laid by its own two axes, never
      // smeared along it)
      if (ian.x < 0.6) iuv = ian.z > ian.y ? vec2(v_wp.x * 1.15 + 3.7, v_iv.y) : vec2(v_iv.x, v_wp.x * 1.15 + 1.9);
      float ifw = max(length(dFdx(iuv)), length(dFdy(iuv)));
      float im = v_iv.z, ithin = 1.0 - 1.2 * im;
      float iboss = smoothstep(0.05, 1.3, v_it);                         // how far the mass stands out here
      vec4 l1 = gIvyLayer(iuv, 0.3, 0.0, ithin, ifw), l2 = gIvyLayer(iuv + 0.17, 0.38, 57.0, ithin + 0.12, ifw);
      vec3 ic = mix(mix(mix(uDeep, uLeafA, 0.4 * iboss), l2.rgb * 0.85, l2.a), l1.rgb, l1.a);
      float icover = max(max(l1.a, l2.a), smoothstep(0.45, 0.7, im));
      // THE FAR FORM (G10a; the cut of place IVY_CUT, uIvyFar 0 or 1). Measured on the near form by a port of these
      // lines (250,000 places a case): a layer's leaves cover 0.32 of its bearing cells, so the two layers cover
      // ileaf (0.113 of a face at a thinness of 0.2 and 0.316 at 0.5, as counted); a leaf's mean is its green with
      // 0.174 of the vein's colour at 0.946 of its tone, the under layer at 0.85; the mass is whole from a thinness
      // of 0.575. The far colour stands within 3 parts in 100 of the near's mean (at a thinness of 0.85: near
      // 0.0947 0.1902 0.1101, far 0.0975 0.1939 0.1119). The far cover is the near's own: whole where the near is
      // whole, and under that blots a leaf wide over the share ileaf of the face (the noise lies under t over the
      // share t * t * (3 - 2 t) of a face, within 0.002: the figure below is its inverse).
      float ispray = gvNoise(iuv * 1.9 + 9.0), iclump = gvNoise(iuv * 0.5 + 3.0);
      float ic1 = 0.32 * clamp(1.0 - ithin, 0.0, 1.0), ic2 = 0.32 * clamp(0.88 - ithin, 0.0, 1.0), ileaf = ic1 + (1.0 - ic1) * ic2;
      vec3 ilm = mix(mix(uLeafA, uLeafB, 0.2 + 0.7 * ispray), uVein, 0.174) * (0.946 * (ic1 + 0.85 * (1.0 - ic1) * ic2) / max(ileaf, 0.001));
      float iwhole = step(0.575, im);
      vec3 imean = mix(ilm, mix(mix(uDeep, uLeafA, 0.4 * iboss), ilm, clamp(ileaf * (0.6 + 0.8 * iclump), 0.0, 1.0)), iwhole);
      // (the leaves' sheen, 0.043 of the sheen's colour over a leaf in the mean, gathered in glints; the glints go to their own mean, 0.256, under 0.09 to 0.3 m of footprint)
      imean = mix(imean, uSheen, 0.168 * mix(1.0, ileaf, iwhole) * mix(smoothstep(0.52, 0.8, gvNoise(iuv * 3.3 + 21.0)), 0.256, smoothstep(0.09, 0.3, ifw)));
      float ifarc = max(iwhole, step(0.001, ileaf) * step(gvNoise(iuv * 4.3 + 5.0), 0.02 + 0.96 * (0.5 - sin(asin(1.0 - 2.0 * ileaf) / 3.0))));
      ic = mix(ic, imean, uIvyFar);
      ic *= 0.88 + 0.26 * iboss;                                         // the hollows darker, the bosses in the light
      if (mix(icover, ifarc, uIvyFar) < 0.5) discard;
      diffuseColor.rgb = gShade(ic, v_iv.w);
      // a face of the mass turned from the sun keeps the sky's light (the palette's ivy in shade, never black)
      float ish = 1.0 - smoothstep(-0.15, 0.45, dot(iwn, vec3(${SUN_N.map((v) => v.toFixed(4)).join(', ')})));
      totalEmissiveRadiance += diffuseColor.rgb * vec3(0.16, 0.2, 0.24) * ish;`,
  });
  const mesh = new THREE.Mesh(g, material);
  mesh.name = 'garden-ivy-mass';
  return { object: mesh, material, triangles: idx.length / 3 };
}

// ---------------------------------------------------------------- leaves and stems as real geometry, swung by the clock
// One mesh of leaf cards (each a real ivy leaf cut by its drawn margin), stem ribbons and small boxes. Every vertex
// carries a pivot (sa), and sb = (weight, phase, turns a second in radians, amplitude): the vertex shader swings it
// about its pivot in the wall's plane and a little out of it by the WORLD'S CLOCK and the wind alone,
//   a1 = wind * amp * weight * (sin(w t + ph) + 0.45 sin(2.31 (w t + ph) + 1.7 ph)),  a2 = 0.4 * wind * amp * weight * sin(0.83 (w t + ph) + 2.9 ph),
// so a point never leaves its rest place by more than SWING_BOUND * wind * amp * weight * (its distance from the pivot).
// THE GUST (G7): the swing is scaled by 0.5 + 0.5 * the one wind's gust band at the pivot's place (1 at most, so the
// bound above holds), and the ivy's glints gather where the band passes. `gust` = [how close the bands lie on this
// mesh (1.2: as on the kit's grass), how far a band leans with height].
export const SWING_BOUND = 1.85, WIND_MAX = 1.25;
const SUN_N = (() => { const [x, y, z] = PLAN.sunTo, l = Math.hypot(x, y, z); return [x / l, y / l, z / l]; })();
export function makeLeafMesh(colors, clock, key = 'garden-leaves-5', gust = [1.2, 0]) {
  const gk = gust[0].toFixed(2), gy = gust[1].toFixed(2);
  const pos = [], nor = [], lf = [], lk = [], sa = [], sb = [], idx = [];
  const still = { piv: [0, 0, 0], w: 0, ph: 0, om: 1, amp: 0 };
  const vert = (p, n, u, v, h, lit, kind, s) => {
    pos.push(p[0], p[1], p[2]); nor.push(n[0], n[1], n[2]); lf.push(u, v, h, lit); lk.push(kind);
    sa.push(s.piv[0], s.piv[1], s.piv[2]); sb.push(s.w, s.ph, s.om, s.amp);
  };
  const quadIdx = () => { const i = pos.length / 3 - 4; idx.push(i, i + 1, i + 2, i, i + 2, i + 3); };
  // a leaf: stalk at c, tip along T, S its side, N its face; size is the half-width of its frame in metres
  // (a twig spray, kinds 3, 5, 6 and 7, whose stalk stands TWIG_FAR and more from the flown line in plan is marked
  // for its far form by a quarter added to its kind: a cut by its place, made once, here)
  const leaf = (c, T, S, N, size, h, lit, s = still, kind = 0) => {
    const k = (kind === 3 || kind >= 5 && kind <= 7) && lineOff(c[0], c[2]) >= TWIG_FAR ? kind + 0.25 : kind;
    for (const [u, v] of [[-0.8, -0.5], [0.8, -0.5], [0.8, 1.0], [-0.8, 1.0]]) {
      vert([c[0] + (S[0] * u + T[0] * v) * size, c[1] + (S[1] * u + T[1] * v) * size, c[2] + (S[2] * u + T[2] * v) * size], N, u, v, h, lit, k, s);
    }
    quadIdx();
  };
  // a stem ribbon through points pts ([x, y, z] each), widths w0 to w1, its face toward N; swing(i, p) gives each
  // point's swing record (or nothing for a still stem); kind 1 is wood, 2 is old iron
  const ribbon = (pts, w0, w1, N, h, litAt, swing, kind = 1) => {
    let run = 0;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i], q = pts[Math.min(i + 1, pts.length - 1)], o = pts[Math.max(i - 1, 0)];
      const d = [q[0] - o[0], q[1] - o[1], q[2] - o[2]];
      let sx = d[1] * N[2] - d[2] * N[1], sy = d[2] * N[0] - d[0] * N[2], sz = d[0] * N[1] - d[1] * N[0];
      const sl = Math.hypot(sx, sy, sz) || 1, w = (w0 + (w1 - w0) * i / (pts.length - 1)) / 2, lit = litAt(p), s = swing ? swing(i, p) : still;
      sx *= w / sl; sy *= w / sl; sz *= w / sl;
      if (i > 0) run += Math.hypot(p[0] - o[0], p[1] - o[1], p[2] - o[2]);
      vert([p[0] - sx, p[1] - sy, p[2] - sz], N, -1, run, h, lit, kind, s);
      vert([p[0] + sx, p[1] + sy, p[2] + sz], N, 1, run, h, lit, kind, s);
      if (i > 0) { const k = pos.length / 3 - 4; idx.push(k, k + 1, k + 3, k, k + 3, k + 2); }
    }
  };
  // a round limb through pts, radius r0 to r1, with `sides` faces round it (wood)
  const tube = (pts, r0, r1, sides, h, litAt, swing = null, kind = 1) => {
    const i0 = pos.length / 3, np = pts.length;
    let run = 0;
    for (let i = 0; i < np; i++) {
      const p = pts[i], q = pts[Math.min(i + 1, np - 1)], o = pts[Math.max(i - 1, 0)];
      const d = v3.norm([q[0] - o[0], q[1] - o[1], q[2] - o[2]]);
      const A = v3.norm(v3.cross(d, Math.abs(d[2]) > 0.9 ? [1, 0, 0] : [0, 0, 1])), B = v3.cross(d, A);
      const r = r0 + (r1 - r0) * i / (np - 1), lit = litAt(p), s = swing ? swing(i, p) : still;
      if (i > 0) run += Math.hypot(p[0] - o[0], p[1] - o[1], p[2] - o[2]);
      for (let k = 0; k <= sides; k++) {
        const a = k / sides * Math.PI * 2, ca = Math.cos(a), sn = Math.sin(a), nn = [A[0] * ca + B[0] * sn, A[1] * ca + B[1] * sn, A[2] * ca + B[2] * sn];
        vert([p[0] + nn[0] * r, p[1] + nn[1] * r, p[2] + nn[2] * r], nn, nn[0] * SUN_N[0] + nn[1] * SUN_N[1] + nn[2] * SUN_N[2], run, h, lit, kind, s);
      }
    }
    for (let i = 0; i + 1 < np; i++) for (let k = 0; k < sides; k++) {
      const a = i0 + i * (sides + 1) + k, b = a + sides + 1;
      idx.push(a, b + 1, b, a, a + 1, b + 1);          // wound so that the face's own normal points OUT (lit on the sun's side)
    }
  };
  // the geometry's stores; with a hand-back they are laid in four steps (a long mesh: the wood's, the ivy's)
  const lay = (g, a, b) => {
    const set = [() => g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)), () => g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)),
      () => g.setAttribute('lf', new THREE.Float32BufferAttribute(lf, 4)), () => g.setAttribute('lk', new THREE.Float32BufferAttribute(lk, 1)),
      () => g.setAttribute('sa', new THREE.Float32BufferAttribute(sa, 3)), () => g.setAttribute('sb', new THREE.Float32BufferAttribute(sb, 4)),
      () => { g.setIndex(idx); g.computeBoundingSphere(); g.boundingSphere.radius += 1.5; }];
    for (let i = a; i < b; i++) set[i]();
    return g;
  };
  const stores = async (yieldNow, first = 2) => {
    const g = new THREE.BufferGeometry();
    for (let i = 0; i < 6; i++) { lay(g, i, i + 1); await yieldNow(i ? 1.7 : first); }
    return lay(g, 6, 7);
  };
  const build = (name, made = null) => {
    const g = made || lay(new THREE.BufferGeometry(), 0, 7);
    const material = drawnMaterial({
      key, vary: { lf: 'vec4', lk: 'float' }, uniforms: { ...colors, ...clock }, head: IVY_GLSL + SHADE_GLSL + GUST_GLSL,
      vertexHead: 'attribute vec3 sa;\nattribute vec4 sb;\n' + GUST_GLSL,
      vertex: /* glsl */`
        float swG = 0.5 + 0.5 * gGustBand(vec2(sa.x, sa.z + ${gy} * sa.y) * ${gk});
        float swA = uWind * sb.w * sb.x * swG, swT = uTime * sb.z + sb.y;
        float sw1 = swA * (sin(swT) + 0.45 * sin(2.31 * swT + 1.7 * sb.y)), sw2 = 0.4 * swA * sin(0.83 * swT + 2.9 * sb.y);
        vec3 swR = transformed - sa;
        swR.yz = vec2(cos(sw1) * swR.y - sin(sw1) * swR.z, sin(sw1) * swR.y + cos(sw1) * swR.z);
        swR.xy = vec2(cos(sw2) * swR.x - sin(sw2) * swR.y, sin(sw2) * swR.x + cos(sw2) * swR.y);
        transformed = sa + swR;`,
      color: /* glsl */`
        vec3 lc;
        if (v_lk < 0.5) {
          vec2 lp = v_lf.xy; float lfw = max(length(dFdx(lp)), length(dFdy(lp)));
          // THE FAR FORM (G10a; the cut of place IVY_CUT): a round of the leaf's OWN AREA (0.964 of its frame's unit:
          // radius 0.554 about the leaf's own middle, 0.153 up the frame) in the leaf's OWN MEAN COLOUR: its green by
          // its own hash with 0.174 of the vein's colour (veins over 0.29 of a face), 0.0635 of the sheen's on the
          // seven leaves in ten that bear one (0.127 of such a face), at 0.945 of its tone; all counted over the leaf
          // by a port of gIvyLeaf and gIvyColor (3,000,000 places)
          float le = mix(gIvyLeaf(lp), 0.554 - length(lp - vec2(0.0, 0.153)), uIvyFar);
          if (le < 0.0) discard;
          lc = mix(gIvyColor(lp, v_lf.z, le, lfw), mix(mix(mix(uLeafA, uLeafB, v_lf.z), uVein, 0.174), uSheen, 0.0635 * step(0.3, fract(v_lf.z * 7.3))) * 0.945, uIvyFar);
          float lg = step(0.55, fract(v_lf.z * 5.13)) * (0.5 + 0.5 * sin(uTime * (1.1 + 2.0 * fract(v_lf.z * 3.7)) + v_lf.z * 50.0));
          lg *= 0.3 + 0.9 * smoothstep(0.42, 0.8, gGustBand(vec2(v_wp.x, v_wp.z + ${gy} * v_wp.y) * ${gk}));
          lc = mix(lc, uSheen, 0.34 * lg * mix(smoothstep(0.0, 0.25, le), 0.63, uIvyFar));   // (0.63: the glint's own share of a leaf's face)
        } else if (v_lk > 10.5) {      // 11: a trained tree's shadow on the brick behind it (the brick's own shade)
          lc = vec3(0.15, 0.078, 0.084) * (0.88 + 0.24 * gvNoise(v_wp.xy * 2.3));
        } else if (v_lk > 9.5) {       // 10: a gorse spray: spiny green shoots thick with yellow flower
          vec2 gp = v_lf.xy; float gpx = max(length(dFdx(gp)), length(dFdy(gp)));
          vec2 gg = gGorse(gp, v_lf.z, gpx);
          if (gg.x < 0.0) discard;
          lc = mix(vec3(0.15, 0.23, 0.09) * (0.8 + 0.5 * v_lf.z), vec3(0.9, 0.62, 0.05) * (0.85 + 0.3 * v_lf.z), gg.y);
          totalEmissiveRadiance += lc * mix(vec3(0.2, 0.25, 0.36), vec3(0.32, 0.29, 0.2), gg.y);
        } else if (v_lk > 8.5) {       // 9: an old ivy stem: grey, furrowed, its far side filled by the sky
          lc = vec3(0.25, 0.22, 0.2) * (0.68 + 0.6 * gvNoise(vec2(v_lf.x * 5.0 + v_lf.z * 9.0, v_lf.y * 0.6)));
          totalEmissiveRadiance += lc * vec3(0.12, 0.14, 0.2) * smoothstep(0.35, -0.45, v_lf.x);
        } else if (v_lk > 7.5) {
          vec2 sp = v_lf.xy; float sfw = max(length(dFdx(sp)), length(dFdy(sp)));
          float senv = 1.0 - length((sp - vec2(0.0, 0.25)) / vec2(0.78, 0.72));
          vec4 sl = gIvyLayer(vec2(sp.x, -sp.y) + floor(v_lf.z * 97.0) * 1.37, 0.5, 0.0, 0.1, sfw);
          // THE FAR FORM (G10a; the cut of place IVY_CUT): blots a leaf wide over the leaves' OWN SHARE of the spray's
          // round, 0.287 (the noise lies under 0.361 over that share of a face), in the leaves' OWN MEAN COLOUR (near
          // 0.1378 0.2682 0.1503, far 0.1394 0.2698 0.1513: the top leaves' mean hash 0.542, with the veins, sheen and
          // tone of a single leaf), blot by blot a little its own green about that mean
          if (mix(sl.a, step(gvNoise(sp * 4.0 + v_lf.z * 31.0), 0.361), uIvyFar) * step(0.0, senv) < 0.5) discard;
          lc = mix(sl.rgb, mix(mix(mix(uLeafA, uLeafB, 0.292 + 0.5 * gvNoise(sp * 2.6 + v_lf.z * 53.0)), uVein, 0.174), uSheen, 0.043) * 0.945, uIvyFar);
          float sg = step(0.6, fract(v_lf.z * 5.13)) * (0.5 + 0.5 * sin(uTime * (1.1 + 2.0 * fract(v_lf.z * 3.7)) + v_lf.z * 50.0));
          sg *= 0.3 + 0.9 * smoothstep(0.42, 0.8, gGustBand(vec2(v_wp.x, v_wp.z + ${gy} * v_wp.y) * ${gk}));
          lc = mix(lc, uSheen, 0.32 * sg);
        } else if ((v_lk > 2.5 && v_lk < 3.5) || v_lk > 4.5) {
          // (the kind's quarter marks a card of the far form: its place at build, 30 m and more from the flown line)
          if (gTwig(v_lf.xy, v_lf.z, step(0.25, fract(v_lk + 0.125))) < 0.0) discard;
          vec3 ta = uTwigA, tb = uTwigB;                                                      // 3: bare twigs
          float hp = step(0.5, fract(v_lf.z * 7.3));
          if (v_lk > 6.5) { ta = vec3(0.36, 0.29, 0.15); tb = vec3(0.64, 0.52, 0.26); }       // 7: rough grass, bleached
          else if (v_lk > 5.5) {                                                              // 6: heather: brown, wine, purple twigs;
            // (G10a) one spray in three stands IN BLOOM, dusty pink, and one in seven is bleached: by the card's own
            // hash, the same in its near form and its far form
            ta = mix(vec3(0.085, 0.05, 0.04), vec3(0.08, 0.045, 0.085), hp); tb = mix(vec3(0.22, 0.12, 0.09), vec3(0.19, 0.105, 0.17), hp);
            float hb = fract(v_lf.z * 3.1);
            if (hb > 0.68) { ta = vec3(0.3, 0.17, 0.24); tb = vec3(0.52, 0.32, 0.44); } else if (hb > 0.54) { ta = vec3(0.3, 0.27, 0.22); tb = vec3(0.5, 0.46, 0.38); }
          }
          else if (v_lk > 4.5) { ta = vec3(0.19, 0.31, 0.15); tb = vec3(0.35, 0.48, 0.22); }  // 5: broom's green whips
          lc = mix(ta, tb, v_lf.z);                                                           // (one colour by the card's hash, near form and far form alike: no lift, G10a)
          if (v_lk > 5.5) totalEmissiveRadiance += lc * vec3(0.16, 0.2, 0.3);                 // (the moor's: the sky's fill)
        } else if (v_lk < 1.5) {       // bark (x: how far the face is turned to the sun): long furrows; the side turned away is filled by the sky, cool, never black
          lc = uBark * (0.72 + 0.5 * gvNoise(vec2(v_lf.x * 4.0 + v_lf.z * 9.0, v_lf.y * 0.5)));
          float bl = smoothstep(0.5, 0.66, 0.6 * gvNoise(v_wp.xy * 1.9 + v_wp.z * 1.3) + 0.4 * gvNoise(v_wp.yz * 5.3 + v_wp.x * 3.1));
          lc = mix(lc, vec3(0.32, 0.38, 0.25) * (0.78 + 0.44 * gvNoise(v_wp.xy * 9.0 + v_wp.z * 7.0)), 0.62 * bl);
          totalEmissiveRadiance += lc * vec3(0.2, 0.26, 0.46) * smoothstep(0.35, -0.45, v_lf.x);
        } else {
          vec3 wood = v_lk < 2.5 ? vec3(0.2, 0.17, 0.16) : vec3(0.74, 0.66, 0.46);
          lc = wood * (0.72 + 0.5 * gvNoise(vec2(v_lf.x * 2.0 + v_lf.z * 9.0, v_lf.y * 1.3))) * (0.62 + 0.38 * (1.0 - v_lf.x * v_lf.x));
        }
        diffuseColor.rgb = gShade(lc, v_lf.w);`,
      extra: { side: THREE.DoubleSide },
    });
    const mesh = new THREE.Mesh(g, material);
    mesh.name = name;
    return { object: mesh, material, triangles: idx.length / 3 };
  };
  // every vertex as built, for a count by geometry: fn(position [x, y, z], pivot [x, y, z], weight, amplitude)
  const each = (fn) => {
    for (let i = 0; i < lk.length; i++) fn([pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]], [sa[i * 3], sa[i * 3 + 1], sa[i * 3 + 2]], sb[i * 4], sb[i * 4 + 3]);
  };
  return { leaf, ribbon, tube, build, stores, still, each, count: () => idx.length / 3 };
}

// ---------------------------------------------------------------- the ivy's real leaves on its mass, and its bare stems
const v3 = {
  add: (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k],
  cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
  norm: (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; },
};
// the mass's surface frame at (z, p): its point, its two tangents (along the wall, up the profile) and its outward face
export function ivyFrame(z, p) {
  const pt = ivyPoint(z, p), Tz = v3.norm(v3.add(ivyPoint(z + 0.2, p), pt, -1)), Tp = v3.norm(v3.add(ivyPoint(z, p + 0.25), pt, -1));
  return { pt, Tz, Tp, N: v3.norm(v3.cross(Tz, Tp)) };
}
// Cards stand out of the mass at their own tilts (tips mostly down and outward), each with a light of its own, so the
// wall is thousands of small leaves turned to the sun, with a lit and a shaded side to every cluster and a leafy edge
// against the sky, the stone and the brick; each flutters a little about its stalk on its own phase. OVER THE WALL a
// card is a SPRAY of small leaves (kind 8), thicker on the bosses; ROUND THE DOORWAY'S STONE AND THE FOLDED LEAF (the
// line passes these at 2.7 to 7.5 m, at the sill, metre 120.6) every leaf is its own lobed card of about a quarter of a metre (kind 0).
// No card comes nearer the flown line (z 0, y 3.6) than 2.7 m, its whole frame counted.
export async function ivyCards(M, sunAt, rng, yieldNow = null) {
  const rest = async (i, w) => { if (yieldNow && i % 1500 === 1499) await yieldNow(w); };
  const P = PLAN, G = P.garden, TAU = Math.PI * 2;
  const place = (z, p, lift, size, kind) => {
    const F = ivyFrame(z, p), c = v3.add(F.pt, F.N, lift);
    // (the clear air first: a card that it refuses draws nothing of its own)
    if (Math.hypot(Math.max(0, Math.abs(c[2]) - 1.3 * size), Math.max(0, c[1] - 1.3 * size - 3.6)) < 2.72) return;
    const r = rng.range(-1.2, 1.2), tilt = rng.range(-0.05, 0.7);
    const T = v3.norm(v3.add(v3.add(v3.add([0, 0, 0], F.Tp, -Math.cos(r)), F.Tz, Math.sin(r)), F.N, tilt));
    const S = v3.norm(v3.cross(T, F.N));
    const N = v3.norm([F.N[0] + rng.range(-0.3, 0.3), F.N[1] + rng.range(-0.15, 0.45), F.N[2] + rng.range(-0.3, 0.3)]);   // its light: the mass's face, a little its own
    const h = rng(), sw = { piv: c, w: 1, ph: rng.range(0, TAU), om: rng.range(1.8, 4.2), amp: rng.range(0.04, 0.09) };
    M.leaf(c, T, S, N, size, h, sunAt(c[0] - 0.1, c[1], c[2]), sw, kind);
  };
  const holeAt = (z, p) => (p > 16 ? 9 : ivyHoleDist(z, p * IVY.rowH));
  for (let i = 0; i < 4600; i++) {                    // the face the walk sees: sprays, thicker on the bosses
    // (in each of these rounds: the place is dealt, the mass's own cover there is asked, then its one chance; only a
    // kept card draws its lift and its size)
    const z = rng.range(-15, 15), p = rng.range(0.2, 17.4);
    if (ivyCover(z, p) > 0.5 && rng() < 0.45 + 0.5 * ivyThick(z, p)) place(z, p, rng.range(0.03, 0.4), rng.range(0.4, 0.62), 8);
    await rest(i, 11.5);
  }
  for (let i = 0; i < 6400; i++) {                    // round the doorway's stone and the folded leaf: single lobed leaves
    const z = rng.range(-10.5, 6.8), p = rng.range(0, 14.5), d = holeAt(z, p);
    if (d >= 0.05 && d < 2.6 && rng() < 1.15 - d / 2.6) place(z, p, rng.range(0.08, 0.45), rng.range(0.15, 0.21), 0);
    await rest(i, 3.8);
  }
  for (let i = 0; i < 1900; i++) {                    // the crown along the whole wall: larger sprays, none in a gap of the top
    const z = rng.range(G.z0 - P.wallT, G.z1 + P.wallT), p = rng.range(15.2, 19.6);
    if (ivyCover(z, p) > 0.5) place(z, p, rng.range(0.05, 0.55), rng.range(0.5, 0.8), 8);
    await rest(i, 6.5);
  }
  for (let i = 0; i < 800; i++) {                     // the face beyond the walk's walls (what rises over their copings, and what stands behind the kitchen door's opening)
    const z = rng.chance(0.5) ? rng.range(G.z0, -15) : rng.range(15, G.z1), p = rng.range(1, 16);
    if (ivyCover(z, p) > 0.5) place(z, p, rng.range(0.03, 0.4), rng.range(0.55, 0.8), 8);
  }
  // the old woody stems on the brick, bare in winter where the leaves are thin: each climbs from the wall's foot,
  // wandering, tapering, with two side branches; none crosses the doorway's stone or the folded leaf
  const xs = -P.wallT - 0.12, litAt = (q) => sunAt(q[0], q[1], q[2]);
  const climb = (z, y, top, w0, w1, lean) => {
    const pts = [[xs, y, z]]; let dz = lean;
    while (y < top) {
      y += 0.6; dz = Math.max(-0.5, Math.min(0.5, dz + rng.range(-0.22, 0.22)));
      if (ivyHoleDist(z + dz * 3, y + 1.2) < 0.4) dz = (z < IVY.leafZ0 || (z < 0 && z > -IVY.holeZ) ? -1 : 1) * 0.5;
      z += dz;
      if (ivyHoleDist(z, y) < 0.3) break;
      pts.push([xs - 0.03 * rng(), y, z]);
    }
    if (pts.length > 2) M.ribbon(pts, w0, w1, [-1, 0, 0], rng(), litAt, null, 9);
    return pts;
  };
  for (let k = 0; k < 18; k++) {
    let z = rng.range(-14.5, 14.5); const top = rng.range(6, 12);
    if (ivyHoleDist(z, 0) < 0.8) z = z < -2 ? IVY.leafZ0 - 1 - rng() * 2 : IVY.holeZ + 1 + rng() * 2;
    const pts = climb(z, -0.2, top, rng.range(0.24, 0.4), 0.09, 0);
    // the foot, as thick as an arm: it climbs ON the mass's face, wandering, and sinks into the leaves as it goes
    const Hf = rng.range(2.2, 5.2), bend = rng.range(0, 6), wide = rng.range(0.2, 0.5), foot = [];
    for (let j = 0; j <= 8; j++) {
      const t = j / 8, y = -0.25 + Hf * t, zj = z + wide * Math.sin(t * 3.1 + bend);
      foot.push([-P.wallT - 0.3 - Math.max(0, ivyThick(zj, Math.max(0, y) / IVY.rowH)) - 0.14 * (1 - t) + 0.3 * t, y, zj]);
    }
    if (ivyHoleDist(z, 0) > 0.6 && ivyHoleDist(foot[8][2], Hf) > 0.6) { const r0 = rng.range(0.14, 0.22); M.tube(foot, r0, r0 * 0.5, 5, rng(), litAt, null, 9); }
    for (let b = 0; b < 2; b++) {
      const at = pts[Math.min(pts.length - 1, 2 + Math.floor(rng() * Math.max(1, pts.length - 3)))];
      climb(at[2], at[1], at[1] + rng.range(2.5, 5), 0.16, 0.07, rng.chance(0.5) ? 0.4 : -0.4);
    }
  }
  // THE STONE FOUND UNDER IVY: single lobed leaves grown over the lintel's top and down its face in tongues, over the
  // south jamb's outer edge, and over the folded leaf's top edge; sprays close the gap between the mass and the stone
  // over the lintel. (The north jamb stands behind the folded leaf.) Every card keeps the clear air's 2.7 m of the
  // flown line, its whole frame counted.
  const lay = (x, y, z, size, kind = 0) => {
    if (Math.hypot(Math.max(0, Math.abs(z) - 1.3 * size), Math.max(0, y - 1.3 * size - 3.6)) < 2.72) return;
    const r = rng.range(-1.3, 1.3), c = [x, y, z];
    const T = v3.norm([-0.2 - 0.35 * rng(), -Math.cos(r), Math.sin(r)]), S = v3.norm(v3.cross(T, [-1, 0, 0]));
    const N = v3.norm([-1 + rng.range(-0.2, 0.2), rng.range(-0.1, 0.5), rng.range(-0.35, 0.35)]);
    M.leaf(c, T, S, N, size, rng(), sunAt(x - 0.1, y, z), { piv: c, w: 1, ph: rng.range(0, TAU), om: rng.range(1.8, 4.2), amp: rng.range(0.04, 0.08) }, kind);
  };
  const xl = -P.wallT - 0.08, tongue = (a, b) => sstep(0.4, 0.72, vnoise(a, b)) * 0.75 + 0.3 * vnoise(a * 3.1 + 5.0, b + 9.1);
  for (let i = 0; i < 520; i++) {                     // the lintel (y 7.3 to 8.6, z -3.9 to 3.9): its top, and down its face in tongues
    const z = rng.range(-3.95, 3.95), low = 8.5 - 0.95 * tongue(z * 0.8 + 17.0, 3.3), y = low + (9.15 - low) * Math.pow(rng(), 0.7);
    lay(xl - rng.range(0.05, 0.3), Math.max(7.55, y), z, rng.range(0.16, 0.23));
  }
  for (let i = 0; i < 70; i++) lay(xl - rng.range(0.2, 0.45), rng.range(8.55, 9.3), rng.range(-3.9, 3.9), rng.range(0.36, 0.5), 8);
  if (yieldNow) await yieldNow(15);
  for (let i = 0; i < 300; i++) {                     // the south jamb's outer edge (z 2.5 to 3.6), in tongues
    const y = rng.range(0.35, 8.6), inner = 3.62 - 0.6 * tongue(y * 0.7 + 4.0, 12.7), z = inner + (3.85 - inner) * Math.pow(rng(), 0.7);
    lay(xl - rng.range(0.05, 0.3), y, z, rng.range(0.16, 0.23));
  }
  const xd = -P.wallT - 0.44;                         // a little proud of the folded leaf's face (x -1.59)
  for (let i = 0; i < 260; i++) {                     // over the folded leaf's top edge (y 7.22, z -7.5 to -2.55)
    const z = rng.range(-7.5, -2.8), low = 7.3 - 0.75 * tongue(z * 0.9 - 6.0, 21.4), y = low + (7.75 - low) * Math.pow(rng(), 0.6);
    lay(xd - rng.range(0.03, 0.22), y, z, rng.range(0.16, 0.23));
  }
}

// ---------------------------------------------------------------- the ivy's hanging trails, and the curtain caught back
// The curtain that hid the door is PUSHED ASIDE and stays so: its long trails are swept north from over the lintel in
// one sagging rope to an old iron holdfast by the folded leaf's top corner and fall from there beside the leaf's free
// edge; only that fall swings. Short trails are left over the lintel (their ends above the opening's head at every
// phase: a trail hangs straight under its pivot, so its rest is its lowest), side tails hang south of the doorway, and
// free trails hang from the mass along the wall. T8's figures are counted from the built vertices by ivyClearance.
export async function ivyTrails(M, sunAt, rng, yieldNow) {
  const TAU = Math.PI * 2, litAt = (q) => sunAt(q[0], q[1], q[2]);
  const trail = (pts, free, amp, size0, size1) => {
    const piv = pts[free], run = [0];
    for (let i = 1; i < pts.length; i++) run.push(run[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]));
    const total = run[pts.length - 1], L = Math.max(0.5, total - run[free]);
    const om = TAU / (4 + 2 * Math.min(1, (Math.sqrt(Math.max(1, L)) - 1) / 1.65) + rng.range(0, 1.2) / 1.2), ph = rng.range(0, TAU);
    const rec = (s) => (s <= run[free] ? M.still : { piv, w: Math.pow((s - run[free]) / L, 0.7), ph, om, amp });
    M.ribbon(pts, 0.07, 0.03, [-1, 0, 0], rng(), litAt, (i) => rec(run[i]), 9);
    let side = rng.chance(0.5) ? 1 : -1;
    for (let s = 0.15, i = 0; s < total; s += 0.21, side = -side) {
      while (i + 2 < pts.length && run[i + 1] < s) i++;
      const k = (s - run[i]) / Math.max(1e-6, run[i + 1] - run[i]), a = pts[i], b = pts[i + 1];
      const q = [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
      const t = v3.norm(v3.add(b, a, -1)), sd = v3.norm(v3.cross(t, [-1, 0, 0]));
      const T = v3.norm([sd[0] * side * 0.7 - 0.25, sd[1] * side * 0.7 - 0.7, sd[2] * side * 0.7]);
      const S = v3.norm(v3.cross(T, v3.norm([-1, 0.2, side * 0.3]))), N = v3.cross(S, T);
      const size = (size0 + (size1 - size0) * s / total) * rng.range(0.85, 1.1);
      M.leaf(v3.add(q, sd, side * 0.04), T, S, N, size, rng(), litAt(q), rec(s));
    }
  };
  const hang = (x, y, z, L, amp, size0 = 0.25, size1 = 0.17) => {
    const pts = [];
    for (let i = 0, n = Math.max(2, Math.ceil(L / 0.5)); i <= n; i++) pts.push([x, y - L * i / n, z]);
    trail(pts, 0, amp, size0, size1);
  };
  const faceX = (z, y) => ivyPoint(z, Math.min(16, y / IVY.rowH))[0];
  const swingMax = SWING_BOUND * WIND_MAX;
  // (i) left over the lintel: nine short trails, each ending above the opening's head (y 7.3) by 0.2 m and more
  for (let i = 0; i < 9; i++) {
    const z = -2.4 + 4.8 * (i + 0.5 + rng.range(-0.3, 0.3)) / 9, y = rng.range(8.75, 9.4), end = rng.range(7.55, 8.3);
    hang(-P_DOOR_X - rng.range(0.3, 0.55), y, z, Math.max(0.6, y - end - 0.32), 0.12, 0.23, 0.18);
  }
  // (ii) the side tails south of the doorway: none nearer the opening than z 3.4, a swing of 0.3 m at most at its end
  for (let i = 0; i < 7; i++) {
    const z = 3.4 + i * 0.52 + rng.range(0, 0.15), y = rng.range(8.9, 11), L = i < 5 ? y - rng.range(0.2, 0.9) : Math.min(rng.range(3, 7), y - 1.2);
    hang(faceX(z, y) - 0.28, y, z, L, Math.min(0.1, 0.3 / (swingMax * L)));
  }
  // (iii) the curtain caught back north: 30 long trails gathered along the lintel's head to its north end, then slung in
  // one sagging rope across the folded leaf's top corner to an old iron holdfast beyond the leaf's free edge, and
  // falling from there beside that edge (clear of the knob). Only the fall swings. Over the opening's width the rope
  // lies above the lintel's top (y 8.6).
  if (yieldNow) await yieldNow(6.5, 16.5);
  const hook = [-PLAN.wallT - 0.95, 6.35, -7.8];
  M.ribbon([[-PLAN.wallT, 6.3, hook[2]], [hook[0] - 0.45, 6.3, hook[2]], [hook[0] - 0.55, 6.8, hook[2]]], 0.16, 0.12, [0, 0, 1], 0.5, litAt, null, 2);
  for (let i = 0; i < 30; i++) {
    const A = [-PLAN.wallT - 0.55 - 0.3 * rng(), rng.range(8.85, 9.5), rng.range(-2.6, 2.3)];
    const B = [-PLAN.wallT - 0.7 - 0.25 * rng(), rng.range(8.75, 9.15), -3.4 + rng.range(-0.2, 0.2)];
    const C = [hook[0] - rng.range(0.05, 0.4), hook[1] + rng.range(0.05, 0.45), hook[2] + rng.range(-0.25, 0.25)], sag = rng.range(0.25, 0.6), pts = [];
    for (let k = 0; k < 5; k++) { const t = k / 5; pts.push([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t - 0.1 * 4 * t * (1 - t), A[2] + (B[2] - A[2]) * t]); }
    for (let k = 0; k <= 7; k++) { const t = k / 7; pts.push([B[0] + (C[0] - B[0]) * t - 0.15 * Math.sin(Math.PI * t), B[1] + (C[1] - B[1]) * t - sag * 4 * t * (1 - t), B[2] + (C[2] - B[2]) * t]); }
    const L = Math.min(rng.range(4.2, 6.8), C[1] - 0.3), dz = rng.range(-0.09, 0.02);
    for (let k = 1, n = Math.ceil(L / 0.5); k <= n; k++) pts.push([C[0], C[1] - L * k / n, C[2] + dz * k]);
    trail(pts, 12, Math.min(0.11, 0.45 / (swingMax * L)), 0.26, 0.18);
  }
  if (yieldNow) await yieldNow(16.5);
  // (iv) free trails from the mass along the rest of the wall the walk sees
  for (let i = 0; i < 38; i++) {
    const z = rng.chance(0.5) ? rng.range(-14.5, -9.8) : rng.range(7.2, 14.5), top = i % 2 === 0 && ivyGap(z) < 0.1;
    const y = top ? rng.range(11.9, 12.5) : rng.range(6, 11.5), L = Math.min(top ? rng.range(2.5, 6) : rng.range(1.5, 4.5), y - 1);
    hang(faceX(z, y) - (top ? 0.4 : 0.25), y, z, L, Math.min(0.13, 0.5 / (swingMax * L)));
  }
  // (vi) over the folded leaf's top edge: seven short trails hanging down its face (the leaf pushed the ivy aside)
  for (let i = 0; i < 7; i++) {
    const z = rng.range(-7.3, -3.3), L = rng.range(0.7, 1.9);
    hang(-PLAN.wallT - 0.39 - rng.range(0.1, 0.2), 7.7, z, L, Math.min(0.1, 0.25 / (swingMax * L)), 0.22, 0.17);
  }
  // (v) the top's shoots: where the ivy runs over the coping it stands 1 to 2 m over it in leaning sprays (untrimmed)
  const G = PLAN.garden;
  for (let i = 0; i < 120; i++) {
    const z = i < 64 ? rng.range(-16, 16) : rng.range(G.z0, G.z1);
    if (ivyGap(z) > 0.15) continue;                     // (G11: its place first; a shoot that the top's gap refuses has drawn its place only)
    const H = rng.range(0.9, 2.1), lx = rng.range(-0.35, 0.1), lz = rng.range(-0.3, 0.3);
    const base = ivyPoint(z, rng.range(17.2, 18.6)), ph = rng.range(0, TAU), om = rng.range(1.2, 2.2), h = rng(), n = 3 + Math.floor(H * 2.5);
    const at = (t, dx = 0, dz = 0) => [base[0] + lx * H * t * t + dx, base[1] - 0.2 + H * t, base[2] + lz * H * t + dz];
    const rec = (t) => ({ piv: at(0), w: Math.pow(t, 1.3), ph, om, amp: 0.05 });
    M.ribbon([0, 0.25, 0.5, 0.75, 1].map((t) => at(t)), 0.07, 0.03, [-1, 0, 0], h, litAt, (k) => rec(k / 4));
    for (let k = 0; k < n; k++) {
      const t = (k + 0.6) / n, q = at(t, rng.range(-0.15, 0.15), rng.range(-0.25, 0.25));
      const T = v3.norm([rng.range(-0.5, 0.2), rng.range(0.2, 1), rng.range(-0.6, 0.6)]), S = v3.norm(v3.cross(T, [-1, 0, 0]));
      M.leaf(q, T, S, v3.norm([-0.8, 0.5, rng.range(-0.3, 0.3)]), rng.range(0.32, 0.5) * (1.15 - 0.5 * t), rng(), litAt(q), rec(t), 8);
    }
  }
}
const P_DOOR_X = PLAN.wallT + 0.08;      // the lintel's outer face stands this far west of x 0

// T8 counted from the built vertices, at full swing and the strongest wind: the lowest any vertex can come over the
// opening's width (z within 2.5 m of the line, its own reach counted), and the least distance of any vertex from the
// flown line through the doorway (z 0, y 3.6). A swung vertex keeps its distance from its pivot, so it never comes
// lower than the pivot's height less that distance, nor further from its rest than its reach.
export function ivyClearance(M) {
  const out = { lowestOverOpening: 99, leastToLine: 99, vertices: 0 }, lensY = 3.6;
  M.each((p, piv, w, amp) => {
    const rel = Math.hypot(p[0] - piv[0], p[1] - piv[1], p[2] - piv[2]), reach = amp > 0 ? rel * SWING_BOUND * WIND_MAX * amp * w : 0;
    const low = amp > 0 ? Math.max(piv[1] - rel, p[1] - reach) : p[1], az = Math.max(0, Math.abs(p[2]) - reach);
    if (az <= PLAN.doorHalf) out.lowestOverOpening = Math.min(out.lowestOverOpening, low);
    out.leastToLine = Math.min(out.leastToLine, Math.hypot(az, Math.max(0, low - lensY)));
    out.vertices++;
  });
  out.lowestOverOpening = Math.round(out.lowestOverOpening * 100) / 100; out.leastToLine = Math.round(out.leastToLine * 100) / 100;
  return out;
}

// the ivy's leaves, stems and trails as one mesh; `yieldNow` hands back between its loops
// (`stream` is the world's maker of a stream from the seed and a plain name: the cards and the trails each their own)
export async function buildIvyLeaves(sunAt, colors, clock, stream, yieldNow = null) {
  const M = makeLeafMesh(colors, clock, 'garden-ivy-leaves-1', [3, 0.4]);
  await ivyCards(M, sunAt, stream('ivy-cards'), yieldNow);
  if (yieldNow) await yieldNow(2);
  await ivyTrails(M, sunAt, stream('ivy-trails'), yieldNow);
  if (yieldNow) await yieldNow(11, 16);
  const info = ivyClearance(M), r = M.build('garden-ivy-leaves', yieldNow ? await M.stores(yieldNow, 16) : null);
  r.info = info;
  return r;
}

// ---------------------------------------------------------------- the small made things (one mesh, one drawn material)
// Boxes, turned shapes and tubes under a current transform, each vertex with its own colour (tc), a surface kind (tk)
// and metres along its face (tuv): 0 plain, 1 old boards (0.5 m wide along u, grain along v), 2 old iron, 3 fired
// clay, 4 old glass (pale, streaked with the sky), 5 straw or turned earth. Light of place (the walls' shade) by vertex.
export function makeThings(sunAt, clock = makeClock(), key = 'garden-things-14', extra = {}) {
  const pos = [], nor = [], tc = [], tuv = [], tk = [], idx = [];
  let m = new THREE.Matrix4(), nm = new THREE.Matrix3();
  const v = new THREE.Vector3(), n = new THREE.Vector3(), col = new THREE.Color();
  const at = (matrix) => { m = matrix || new THREE.Matrix4(); nm = new THREE.Matrix3().getNormalMatrix(m); };
  // a transform from a place, a turn about y (radians) and tilts about x and z
  const place = (x, y, z, ry = 0, rx = 0, rz = 0, s = 1) => at(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), new THREE.Vector3(s, s, s)));
  const vert = (p, nn, u, w, c, kind) => {
    v.set(p[0], p[1], p[2]).applyMatrix4(m); n.set(nn[0], nn[1], nn[2]).applyMatrix3(nm).normalize();
    pos.push(v.x, v.y, v.z); nor.push(n.x, n.y, n.z); tuv.push(u, w); tk.push(kind);
    if (Array.isArray(c)) tc.push(c[0], c[1], c[2]); else { col.set(c); tc.push(col.r, col.g, col.b); }   // (a triple is linear light as it stands)
  };
  // A SPIKE IN TRUE GEOMETRY (G10b): a three-sided point from a small triangle about `base` (its corners `wide` from
  // the axis, turned by `turn` about it) to `tip`. Each face is wound so that its outward side is its front and
  // takes its own outward normal leaned half toward n0 (the facing of the plant's body there: so a bush keeps one
  // lit side and one far side); colour c0 at the foot, c1 at the tip; uv = (u, 0 at the foot to 1 at the tip)
  const spike = (base, tip, wide, turn, c0, c1, kind, n0, u = 0) => {
    const ax = tip[0] - base[0], ay = tip[1] - base[1], az = tip[2] - base[2], al = Math.hypot(ax, ay, az) || 1, dx = ax / al, dy = ay / al, dz = az / al;
    let ex, ey, ez;
    if (Math.abs(dy) > 0.9) { ex = 0; ey = dz; ez = -dy; } else { ex = -dz; ey = 0; ez = dx; }
    const el = Math.hypot(ex, ey, ez) || 1; ex /= el; ey /= el; ez /= el;
    const fx = dy * ez - dz * ey, fy = dz * ex - dx * ez, fz = dx * ey - dy * ex, cs = [];
    for (let k = 0; k < 3; k++) { const a = turn + k * 2.0944, ca = Math.cos(a) * wide, sa = Math.sin(a) * wide; cs.push([base[0] + ex * ca + fx * sa, base[1] + ey * ca + fy * sa, base[2] + ez * ca + fz * sa]); }
    for (let k = 0; k < 3; k++) {
      const p = cs[k], q = cs[(k + 1) % 3], ux = q[0] - p[0], uy = q[1] - p[1], uz = q[2] - p[2], wx = tip[0] - p[0], wy = tip[1] - p[1], wz = tip[2] - p[2];
      let nx = uy * wz - uz * wy, ny = uz * wx - ux * wz, nz = ux * wy - uy * wx;
      const nl = Math.hypot(nx, ny, nz) || 1, out = nx * ((p[0] + q[0]) / 2 - base[0]) + ny * ((p[1] + q[1]) / 2 - base[1]) + nz * ((p[2] + q[2]) / 2 - base[2]) >= 0, g = out ? 1 / nl : -1 / nl;
      const nn = [nx * g + n0[0], ny * g + n0[1], nz * g + n0[2]], i0 = pos.length / 3;
      vert(out ? p : q, nn, u, 0, c0, kind); vert(out ? q : p, nn, u, 0, c0, kind); vert(tip, nn, u, 1, c1, kind);
      idx.push(i0, i0 + 1, i0 + 2);
    }
  };
  const quad = (a, b, c, d, nn, color, kind, uv) => {
    const i0 = pos.length / 3, pts = [a, b, c, d];
    for (let i = 0; i < 4; i++) {
      const p = pts[i], q = uv ? uv[i] : (nn[1] !== 0 ? [p[0], p[2]] : nn[0] !== 0 ? [p[2], p[1]] : [p[0], p[1]]);
      vert(p, nn, q[0], q[1], color, kind);
    }
    idx.push(i0, i0 + 1, i0 + 2, i0, i0 + 2, i0 + 3);
  };
  const box = (x0, y0, z0, x1, y1, z1, color, kind = 0, skip = '') => {
    if (!skip.includes('X')) quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [1, 0, 0], color, kind);
    if (!skip.includes('x')) quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0], color, kind);
    if (!skip.includes('Z')) quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1], color, kind);
    if (!skip.includes('z')) quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [0, 0, -1], color, kind);
    if (!skip.includes('Y')) quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], [0, 1, 0], color, kind);
    if (!skip.includes('y')) quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [0, -1, 0], color, kind);
  };
  // a turned shape about the local y axis through a profile of [radius, height] pairs (smooth sides, open ends
  // unless a radius is 0); seg sides
  const lathe = (profile, seg, color, kind = 0) => {
    const i0 = pos.length / 3, np = profile.length;
    for (let s = 0; s <= seg; s++) {
      const a = s / seg * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
      for (let k = 0; k < np; k++) {
        const p = profile[k], q = profile[Math.min(np - 1, k + 1)], o = profile[Math.max(0, k - 1)];
        const dr = q[0] - o[0], dy = q[1] - o[1], l = Math.hypot(dr, dy) || 1;
        vert([p[0] * ca, p[1], p[0] * sa], [dy / l * ca, -dr / l, dy / l * sa], s / seg * 6.283 * Math.max(p[0], 0.05), p[1], color, kind);
      }
    }
    for (let s = 0; s < seg; s++) for (let k = 0; k + 1 < np; k++) {
      const a = i0 + s * np + k, b = a + np;
      idx.push(a, a + 1, b + 1, a, b + 1, b);
    }
  };
  const build = (name) => {
    const g = new THREE.BufferGeometry(), lit = new Float32Array(tk.length);
    for (let i = 0; i < tk.length; i++) lit[i] = sunAt(pos[i * 3] + nor[i * 3] * 0.05, pos[i * 3 + 1] + 0.05, pos[i * 3 + 2] + nor[i * 3 + 2] * 0.05);
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    g.setAttribute('tc', new THREE.Float32BufferAttribute(tc, 3));
    g.setAttribute('tuv', new THREE.Float32BufferAttribute(tuv, 2));
    g.setAttribute('tk', new THREE.Float32BufferAttribute(tk, 1));
    g.setAttribute('tl', new THREE.BufferAttribute(lit, 1));
    g.setIndex(idx); g.computeBoundingSphere();
    const material = drawnMaterial({ key, uniforms: { ...clock }, vary: { tc: 'vec3', tuv: 'vec2', tk: 'float', tl: 'float' }, head: SHADE_GLSL + THINGS_GLSL, color: THINGS_COLOR, extra: { side: THREE.DoubleSide, ...extra } });
    const mesh = new THREE.Mesh(g, material);
    mesh.name = name;
    return { object: mesh, material, triangles: idx.length / 3 };
  };
  // (G10b) the same build in steps, for a large mesh: the light of its vertices in runs of 24,000, a breath after each
  // run and after each store's copy (the same geometry, attribute for attribute, as `build` gives)
  const buildAsync = async (name, yieldNow) => {
    const g = new THREE.BufferGeometry(), lit = new Float32Array(tk.length), rest = async (w) => { if (yieldNow) await yieldNow(w); };
    for (let i = 0; i < tk.length; i++) {
      lit[i] = sunAt(pos[i * 3] + nor[i * 3] * 0.05, pos[i * 3 + 1] + 0.05, pos[i * 3 + 2] + nor[i * 3 + 2] * 0.05);
      if (i % 24000 === 23999) await rest(i < 24000 ? 8 : 5.5);
    }
    await rest((tk.length % 24000) * 0.00023);
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    await rest(3.5);
    g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    await rest(3.5);
    g.setAttribute('tc', new THREE.Float32BufferAttribute(tc, 3));
    g.setAttribute('tuv', new THREE.Float32BufferAttribute(tuv, 2));
    await rest(5.5);
    g.setAttribute('tk', new THREE.Float32BufferAttribute(tk, 1));
    g.setAttribute('tl', new THREE.BufferAttribute(lit, 1));
    g.setIndex(idx);
    await rest(3.5);
    g.computeBoundingSphere();
    const material = drawnMaterial({ key, uniforms: { ...clock }, vary: { tc: 'vec3', tuv: 'vec2', tk: 'float', tl: 'float' }, head: SHADE_GLSL + THINGS_GLSL, color: THINGS_COLOR, extra: { side: THREE.DoubleSide, ...extra } });
    const mesh = new THREE.Mesh(g, material);
    mesh.name = name;
    return { object: mesh, material, triangles: idx.length / 3 };
  };
  // a lumpy rounded mass about c with radii r ([x, y, z]), its surface pushed in and out by a noise of its own (seed),
  // coloured from `low` at its foot to `high` at its top: a clustered form with a lit and a shaded side
  // (jag: its two upper rings and its crown pushed in and out again, each point by its own figure: a broken top)
  const blob = (c, r, low, high, seed, seg = 7, rings = 4, kind = 5, jag = 0) => {
    const i0 = pos.length / 3, ca = new THREE.Color(low), cb = new THREE.Color(high), cc = new THREE.Color();
    for (let j = 0; j <= rings; j++) {
      const ph = -Math.PI / 2 * 0.8 + (Math.PI * 0.9) * j / rings, cy = Math.sin(ph), cr = Math.cos(ph);
      for (let s = 0; s <= seg; s++) {
        const a = (s % seg) / seg * Math.PI * 2, dx = Math.cos(a) * cr, dz = Math.sin(a) * cr;
        const k = j === rings ? 0.9 + 0.3 * jag * vnoise(seed * 3.1, seed * 1.7)
          : 0.72 + 0.56 * vnoise(seed + dx * 1.7 + cy * 1.3, seed * 0.7 + dz * 1.7 - cy) + (j >= rings - 2 ? jag * (vnoise(seed * 1.9 + (s % seg) * 2.7 + j * 5.3, seed + (s % seg) * 1.3) - 0.35) : 0);
        cc.copy(ca).lerp(cb, sstep(-0.5, 0.9, cy));
        vert([c[0] + dx * r[0] * k, c[1] + cy * r[1] * k, c[2] + dz * r[2] * k], [dx, cy * 1.2, dz], a * r[0], cy * r[1], '#' + cc.getHexString(), kind);
      }
    }
    for (let j = 0; j < rings; j++) for (let s = 0; s < seg; s++) {
      const a = i0 + j * (seg + 1) + s, b = a + seg + 1;
      idx.push(a, b, b + 1, a, b + 1, a + 1);
    }
  };
  // (G7) a named point of a thing as built: a local point through the transform in force, kept for the birds' perches
  const perch = {};
  const mark = (name, x, y, z) => { v.set(x, y, z).applyMatrix4(m); perch[name] = [v.x, v.y, v.z]; };
  return { at, place, quad, box, lathe, blob, spike, build, buildAsync, mark, perch, count: () => idx.length / 3 };
}
const THINGS_COLOR = /* glsl */`
  gThingN = inverseTransformDirection(normalize(vNormal), viewMatrix);
  diffuseColor.rgb = gShade(gThing(v_tc, v_tuv, v_tk), v_tl);
  if ((v_tk > 5.5 && v_tk < 7.5) || (v_tk > 11.5 && v_tk < 12.5) || v_tk > 14.5) {
    float tsd = dot(inverseTransformDirection(normalize(vNormal), viewMatrix), vec3(${SUN_N[0].toFixed(4)}, ${SUN_N[1].toFixed(4)}, ${SUN_N[2].toFixed(4)}));
    totalEmissiveRadiance += diffuseColor.rgb * vec3(0.24, 0.29, 0.42) * (1.0 - smoothstep(-0.35, 0.5, tsd));
  }
  if (v_tk > 12.5 && v_tk < 14.5) {
    vec3 gn = normalize(vNormal), gw = inverseTransformDirection(gn, viewMatrix);
    // (G7) the glass glints as the clouds' field passes over it: it mirrors the sky above its own place, so its glint
    // follows the field itself
    float rim = 1.0 - abs(gn.z), cf = gCloudField(), lit13 = v_tl * (1.0 - 0.85 * cf);
    vec3 sky = vec3(0.5, 0.66, 0.9);
    if (v_tk > 13.5) {
      float cl = max(smoothstep(0.3, 0.7, 0.6 * gvNoise(v_tuv * vec2(0.8, 0.45) + 3.0) + 0.4 * gvNoise(v_tuv * vec2(2.1, 1.2) + 9.0)), 0.85 * cf);
      totalEmissiveRadiance += mix(sky, vec3(0.96, 0.93, 0.86), cl) * mix(0.42, 0.8, rim * rim) * (1.0 - 0.2 * cf) + vec3(1.0, 0.95, 0.84) * (0.34 * (1.0 - cf) * (1.0 - cl) * (0.35 + 0.65 * rim * rim));
    } else {
      float glint = pow(max(0.0, dot(gw, vec3(-0.92, 0.27, 0.27))), 110.0) + 0.6 * pow(max(0.0, dot(gw, vec3(-0.5, 0.86, 0.1))), 70.0);
      float gside = pow(max(0.0, dot(normalize(vec3(gw.x, 0.0, gw.z) + vec3(1e-4)), vec3(-0.82, 0.0, 0.57))), 90.0) * smoothstep(0.15, 0.6, 1.0 - abs(gw.y));
      // (clear but for its turned edge, where the sky lies on it, its solid knob, and the sun's glint)
      float r2 = rim * rim, shine = (glint + 0.45 * gside) * (0.35 + 0.65 * lit13), knob = smoothstep(1.5, 1.6, v_tuv.y);
      totalEmissiveRadiance += sky * (0.5 * r2 + 0.12 * smoothstep(0.35, 0.9, gw.y)) + vec3(1.0, 0.95, 0.84) * shine;
      diffuseColor.a = clamp(0.08 + 0.5 * r2 * r2 + 0.14 * smoothstep(0.35, 0.9, gw.y) + 0.45 * knob + shine, 0.0, 1.0);
    }
  }
  if (v_tk > 9.5 && v_tk < 11.5) {
    // (G11) THE GLINT ON IRON, KEY AND KNOB is the sun's own light thrown to the eye: it stands where the face is
    // turned midway between the sun's direction and the bearing from its place to the eye (no lamp of the view's
    // frame; a bearing, never a distance), as light does
    vec3 tsv = normalize(-(viewMatrix * vec4(v_wp, 1.0)).xyz), tss = normalize((viewMatrix * vec4(${SUN_N[0].toFixed(4)}, ${SUN_N[1].toFixed(4)}, ${SUN_N[2].toFixed(4)}, 0.0)).xyz);
    float tsp = pow(max(0.0, dot(normalize(vNormal), normalize(tss + tsv))), 40.0);
    totalEmissiveRadiance += vec3(1.0, 0.86, 0.62) * tsp * (v_tk > 10.5 ? 0.9 : 0.03) * gCloudLit(v_tl);
  }`;
const THINGS_GLSL = /* glsl */`
vec3 gThingN = vec3(0.0, 1.0, 0.0);                 // the surface's facing in the world (set in the colour line)
// heather on one plane of place: x how much of a tuft (0 between two, 1 its middle), y its fine upright twigs, z the tuft's own number
vec3 gHeathOn(vec2 p, vec2 st, float close, float hfine) {
  vec2 w = p + (vec2(gvNoise(p * 1.7), gvNoise(p * 1.7 + 9.0)) - 0.5) * 0.6;
  vec2 q = w * 2.6, id = floor(q), f = fract(q) - 0.5;
  float h = gmHash(id + 2.0), h2 = gmHash(id + 7.0);
  float tuft = mix(0.38, 1.0 - smoothstep(0.08, 0.6, length(f + (vec2(h, h2) - 0.5) * 0.4)), close);   // (0.38: the tufts' own mean over the ground, G9c)
  float sprig = mix(0.5, 0.6 * gvNoise(p * st * 19.0) + 0.4 * gvNoise(p * st * 41.0 + 5.0), hfine);
  return vec3(tuft, sprig, h);
}
vec3 gHeathTint(float h) { return mix(vec3(1.3, 1.0, 0.62), mix(vec3(1.2, 0.76, 0.9), vec3(1.0, 0.86, 1.0), step(0.62, h)), step(0.3, h)); }
vec3 gThing(vec3 c, vec2 uv, float k) {
  float fw = max(length(dFdx(uv)), length(dFdy(uv)));
  float fine = 1.0 - smoothstep(0.03, 0.15, fw);
  // 20: a sprig of heather or a blade of rough grass in true geometry: its own colours from foot to tip, a fine grain along it
  if (k > 19.5) return c * (0.88 + 0.24 * mix(0.5, gvNoise(vec2(v_wp.x * 9.0 + v_wp.z * 7.0, uv.y * 2.3)), fine));
  if (k > 18.5) {                                  // 19: A GORSE SPRAY in true geometry (uv.x: how much of it bears flower; uv.y: 0 its foot to 1 its end)
    // dark spiny green from the foot; the flower massed bright at the spray's end, from 1 - 0.72 uv.x of its length
    // on, its edge ragged by 0.1 m (the ragged edge sums to nothing and gives way to the plain cut from 0.03 to
    // 0.15 of the spray in a pixel's span; the flowers' flecks to their own mean, 0.99)
    float gcut = 1.0 - 0.72 * uv.x;
    float gfl = step(0.02, uv.x) * smoothstep(gcut - 0.07, gcut + 0.07, uv.y + 0.22 * (gvNoise(v_wp.xz * 11.0 + v_wp.y * 9.0) - 0.5) * fine);
    vec3 green = c * (0.82 + 0.36 * mix(0.5, gvNoise(v_wp.xy * 23.0 + v_wp.z * 17.0), fine));
    return mix(green, vec3(0.9, 0.62, 0.05) * mix(0.99, 0.84 + 0.3 * gmHash(floor(v_wp.xz * 5.0 + v_wp.y * 3.0)), fine), gfl);
  }
  if (k > 17.5) {                                  // 18: TURNED EARTH (the dug border, the kitchen garden's beds), drawn by place
    // (G10a): dark clods 0.19 m across with crumbs of 0.08 m between and on them, the rake's lines 0.35 m apart
    // along the bed (uv.y 0: along x; 1: along z, with the beds' ridges 1.6 m apart), straw strewn where uv.x says
    // (its edge ragged by crumbs, its stalks drawn along the bed). The clods lie on 0.614 of the earth (measured
    // over the noise): from 0.35 to 1 of a cell in a pixel's span they give way to that share; crumbs and lines sum
    // to nothing.
    float ew = max(length(dFdx(v_wp.xz)), length(dFdy(v_wp.xz))), e1 = 1.0 - smoothstep(0.35, 1.0, ew * 5.2), e2 = 1.0 - smoothstep(0.35, 1.0, ew * 12.0);
    vec2 eq = mat2(0.8, 0.6, -0.6, 0.8) * v_wp.xz;
    float along = step(0.5, uv.y), eph = mix(v_wp.z, v_wp.x, along) * 17.95 + 2.0 * gvNoise(v_wp.xz * 0.7);
    float eline = sin(eph) * (1.0 - smoothstep(1.0, 2.6, max(abs(dFdx(eph)), abs(dFdy(eph)))));
    float clod = mix(0.614, smoothstep(0.25, 0.6, gvNoise(eq * 5.2)), e1);
    vec3 earth = c * (0.56 + 0.72 * clod) * (1.0 + 0.5 * (gvNoise(eq * 12.0 + 7.0) - 0.5) * e2 + 0.14 * eline + 0.14 * along * sin(v_wp.x * 3.9));
    // (the straw's stalks lie along the bed, 0.77 by 0.11 m: faded by the span across them, to their middle)
    float efx = max(abs(dFdx(v_wp.x)), abs(dFdy(v_wp.x))), efz = max(abs(dFdx(v_wp.z)), abs(dFdy(v_wp.z)));
    float stalk = mix(0.5, gvNoise(mix(v_wp.xz * vec2(1.3, 9.0), v_wp.xz * vec2(9.0, 1.3), along) + 9.0), 1.0 - smoothstep(0.35, 1.0, max(mix(efx, efz, along) * 1.3, mix(efz, efx, along) * 9.0)));
    vec3 straw = vec3(0.47, 0.37, 0.16) * (0.62 + 0.76 * stalk) * (0.85 + 0.3 * clod);
    return mix(earth, straw, smoothstep(0.45, 0.55, uv.x + 0.5 * (gvNoise(eq * 6.0 + 3.0) - 0.5) * e1));
  }
  if (k > 16.5) {                                  // 17: THE KERB'S BRICKS ON EDGE (uv: metres along the kerb, metres across
    // or up it): old red bricks 0.79 m long end to end, each its own tone, dark earth in the joints (0.045 of each
    // 0.825 m: 0.0545 of the kerb, its mean from 0.1 to 0.3 m of span), moss creeping over some
    float bid = floor(uv.x / 0.825), joint = gmBand(uv.x, 0.825, 0.045, max(fw, 0.004));
    vec3 br = c * (0.78 + 0.44 * gmHash(vec2(bid, 3.0))) * (0.9 + 0.2 * mix(0.5, gvNoise(uv * vec2(7.0, 19.0) + bid * 3.7), fine));
    br = mix(br, vec3(0.25, 0.31, 0.15), 0.6 * smoothstep(0.5, 0.72, gvNoise(v_wp.xz * 0.9 + 17.0)) * mix(0.5, smoothstep(0.35, 0.65, gvNoise(v_wp.xz * 8.0 + 3.0)), fine));
    return mix(br, vec3(0.1, 0.085, 0.075), mix(joint, 0.0545, smoothstep(0.1, 0.3, fw)));
  }
  if (k > 15.5) {                                  // 16: a rock of the moor: grey grit in level beds, cracked, lichened
    float rw = max(length(dFdx(v_wp)), length(dFdy(v_wp))), rfine = 1.0 - smoothstep(0.03, 0.14, rw);
    float bed = gvNoise(vec2(v_wp.y * 5.0 + 0.6 * gvNoise(v_wp.xz * 0.9), (v_wp.x + v_wp.z) * 0.35));
    float grit = mix(0.5, 0.6 * gvNoise(v_wp.xz * 13.0 + v_wp.y * 9.0) + 0.4 * gvNoise(v_wp.xy * 23.0 + v_wp.z * 17.0), rfine);
    vec3 rock = c * mix(vec3(1.06, 1.0, 0.92), vec3(0.92, 0.98, 1.08), gvNoise(v_wp.xz * 0.6 + 3.0)) * vec3(1.04, 1.0, 0.94) * (0.7 + 0.3 * bed + 0.36 * grit);
    // (THE CRACKS GO TO THEIR OWN MEAN, G9c: 0.081 of a rock's face lies in its cracks, worked out over the noise they
    // are cut along; under 0.03 to 0.14 m of footprint they give way to that share, not to nothing)
    rock *= 1.0 - 0.45 * mix(0.081, 1.0 - smoothstep(0.0, 0.05, abs(gvNoise(v_wp.xz * 1.1 + v_wp.y * 0.7 + 9.0) - 0.5)), rfine);
    float up = smoothstep(0.2, 0.8, gThingN.y), north = smoothstep(0.2, 0.8, -gThingN.z);
    vec2 lu = v_wp.xz + v_wp.y * vec2(0.7, 0.4);
    float lgrow = smoothstep(0.5, 0.64, 0.6 * gvNoise(lu * 1.6 + 7.0) + 0.4 * gvNoise(lu * 3.7 + 2.0) + 0.14 * up + 0.1 * north - 0.07);
    float lspots = mix(0.48, smoothstep(0.42, 0.6, gvNoise(lu * 12.0 + 31.0)), rfine);   // (0.48: the spots' own mean)
    rock = mix(rock, vec3(0.36, 0.42, 0.29) * (0.85 + 0.3 * grit), 0.8 * lgrow * lspots);
    rock = mix(rock, vec3(0.6, 0.47, 0.16), 0.55 * smoothstep(0.7, 0.8, gvNoise(lu * 2.3 + 40.0)) * lspots * up);
    float foot = 1.0 - smoothstep(0.0, 0.5, uv.y + 0.4 * gvNoise(v_wp.xz * 2.0));
    return mix(rock, vec3(0.2, 0.27, 0.1) * (0.8 + 0.4 * grit), 0.6 * foot * smoothstep(0.35, 0.6, gvNoise(v_wp.xz * 4.0)));
  }
  if (k > 14.5) {                                  // 15: an evergreen of the wood's edge: sprays in clumps, dark between
    vec2 eq = uv * vec2(0.5, 0.75) + 1.6 * vec2(gvNoise(uv * 0.33 + 3.0), gvNoise(uv * 0.33 + 11.0));
    float clump = smoothstep(0.3, 0.7, 0.6 * gvNoise(eq) + 0.4 * gvNoise(eq * 2.3 + 5.0));
    float needles = mix(0.5, 0.6 * gvNoise(uv * vec2(5.0, 9.0)) + 0.4 * gvNoise(uv * 13.0 + 3.0), fine);
    return c * mix(0.5, 1.12, clump) * (0.72 + 0.56 * needles);
  }
  if (k > 13.5) return c * (0.82 + 0.36 * gvNoise(uv * 1.3 + 2.0));   // 14: a frame's light: the earth under it (the sky on it is added in the colour line)
  if (k > 12.5) {                                  // 13: a bell glass: old greenish glass with its streaks (its clearness is set in the colour line)
    return c * (0.8 + 0.4 * mix(0.5, gvNoise(vec2(uv.x * 5.0, uv.y * 0.35)), fine));
  }
  if (k > 11.5) {                                  // 12: a heather hummock, drawn by place (no line runs to its crown): tufts
    // of fine twigs, each tuft its own tone (brown, wine, purple), dark between, bleached blades standing at the foot
    vec3 an = abs(gThingN); an *= an; an *= an; an /= an.x + an.y + an.z + 1e-4;
    float hw = max(length(dFdx(v_wp)), length(dFdy(v_wp)));
    float close = 1.0 - smoothstep(0.06, 0.22, hw), hfine = 1.0 - smoothstep(0.03, 0.12, hw);
    vec3 hx = gHeathOn(v_wp.zy + 3.0, vec2(1.0, 0.4), close, hfine), hy = gHeathOn(v_wp.xz, vec2(1.0), close, hfine), hz = gHeathOn(v_wp.xy + 11.0, vec2(1.0, 0.4), close, hfine);
    float tuft = an.x * hx.x + an.y * hy.x + an.z * hz.x, sprig = an.x * hx.y + an.y * hy.y + an.z * hz.y;
    vec3 tint = an.x * gHeathTint(hx.z) + an.y * gHeathTint(hy.z) + an.z * gHeathTint(hz.z);
    // (G10a, G10b: twig and bloom varied within the mound, from brown to wine. The tufts' three tints go to their own
    // mean, (1.154, 0.870, 0.854): three in ten russet, a third wine, the rest a dull mauve; a tuft stands light over
    // the dark hollow between two; the kind of heather drifts from russet to mauve over 1.1 m of the mound (to its
    // middle as a pixel spans 0.35 to 1 of that); and BLOOM lies on the tufts' upper sides in pale flecks of 0.1 m,
    // on 0.341 of a tuft (measured over the noise; its mean under 0.03 to 0.12 m of span))
    float kindOf = mix(0.5, gvNoise(v_wp.xz * 0.9 + 31.0), 1.0 - smoothstep(0.35, 1.0, hw * 0.9));
    vec3 tone = c * mix(vec3(1.154, 0.870, 0.854), tint, close) * mix(vec3(1.14, 0.98, 0.8), vec3(0.96, 0.95, 1.04), kindOf) * (0.6 + 0.38 * sprig + 0.58 * tuft) * (0.9 + 0.22 * gvNoise(v_wp.xz * 0.8));
    float bloom = mix(0.341, smoothstep(0.52, 0.68, gvNoise(v_wp.xz * 9.0 + v_wp.y * 5.0 + 3.0)), hfine) * tuft * smoothstep(-0.1, 0.7, gThingN.y);
    tone = mix(tone, vec3(0.56, 0.4, 0.5) * (0.85 + 0.3 * sprig), 0.55 * bloom);
    float blades = smoothstep(0.5, 0.68, mix(gvNoise(vec2((v_wp.x + v_wp.z) * 8.0, v_wp.y * 2.6)), gvNoise(v_wp.xz * 6.3 + 3.0), an.y));
    float foot = 1.0 - smoothstep(0.0, 0.5, uv.y + 0.4 * gvNoise(v_wp.xz * 3.0));
    // (the straw between the tufts goes to its own mean, 0.46 of the ground between; the standing blades to theirs, 0.357)
    float straw = max(foot, 0.3 * mix(0.46, 1.0 - smoothstep(0.12, 0.42, tuft), close)) * mix(0.357, blades, hfine);
    return mix(tone, vec3(0.62, 0.5, 0.25) * (0.8 + 0.4 * sprig), 0.75 * straw);
  }
  if (k > 7.5) {
    if (k < 8.5) {                                 // 8: the door's planks (uv = z, y of the world): green paint long ago,
      // flaked to grey wood at the foot, the edges and the seams; rain marks; the ivy's shadow under the top edge
      float px = uv.x + 7.5, id = floor(px / 0.45), seam = gmBand(px, 0.45, 0.028, max(fw, 0.004));
      float grain = mix(0.5, gvNoise(vec2(px * 24.0 + id * 7.0, uv.y * 0.7)), fine);
      vec3 wood = vec3(0.27, 0.31, 0.42) * (0.8 + 0.3 * gmHash(vec2(id, 5.0))) * (0.78 + 0.44 * grain);
      vec3 paint = c * (0.86 + 0.26 * gmHash(vec2(id, 9.0))) * (0.9 + 0.2 * gvNoise(vec2(px * 5.0, uv.y * 0.25)));
      paint = mix(paint, paint * vec3(1.12, 1.1, 0.96), smoothstep(0.45, 0.8, gvNoise(uv * vec2(0.9, 0.35) + 4.0)));   // sun-bleached
      float edge = min(min(px, 4.95 - px), min(uv.y - 0.38, 7.22 - uv.y));
      float nearSeam = 1.0 - smoothstep(0.0, 0.07, abs(fract(px / 0.45 + 0.5) - 0.5) * 0.45);
      float wear = 0.2 + 0.62 * (1.0 - smoothstep(0.5, 3.4, uv.y)) + 0.45 * (1.0 - smoothstep(0.0, 0.4, edge)) + 0.22 * nearSeam;
      float fl = 0.6 * gvNoise(uv * vec2(3.4, 1.1) + id * 3.1) + 0.4 * mix(0.5, gvNoise(uv * vec2(11.0, 3.6) + 17.0), fine);
      vec3 w = mix(paint, wood, smoothstep(0.0, 0.07, fl - (0.84 - 0.62 * min(wear, 1.0))));
      w *= 1.0 - 0.3 * (1.0 - smoothstep(0.0, 0.9, uv.y - 0.38)) * gvNoise(vec2(px * 3.0, 1.0));                        // damp at the foot
      w *= 1.0 - 0.14 * smoothstep(0.55, 0.75, gvNoise(vec2(px * 7.0, uv.y * 0.12 + 3.0)));                              // rain runs
      float drop = (7.22 - uv.y) - 1.5 * gvNoise(vec2(px * 1.1, 2.0)) - 0.5 * gvNoise(vec2(px * 4.6, 7.0));
      w *= 1.0 - 0.42 * (1.0 - smoothstep(-0.25, 0.3, drop)) * (0.6 + 0.4 * mix(0.5, gvNoise(uv * 7.0), fine));          // the ivy's shadow
      // (THE SEAMS GO TO THEIR OWN MEAN, G9c: a seam is 0.028 m of each plank's 0.45 m, 0.0622 of the leaf's face; from
      // 0.08 to 0.3 m of footprint the seams give way to that share, not to nothing)
      return mix(w, vec3(0.07, 0.07, 0.065), mix(seam, 0.0622, smoothstep(0.08, 0.3, fw)));
    }
    if (k < 9.5) {                                 // 9: ledges and braces: the same paint, worn more, the grain along the timber
      float grain = mix(0.5, gvNoise(vec2(uv.x * 0.6, uv.y * 26.0)), fine);
      vec3 wood = vec3(0.27, 0.31, 0.42) * (0.72 + 0.5 * grain);
      float fl = 0.6 * gvNoise(uv * vec2(1.2, 5.0) + 9.0) + 0.4 * mix(0.5, gvNoise(uv * vec2(4.0, 13.0) + 3.0), fine);
      return mix(c * (0.88 + 0.24 * gvNoise(uv * vec2(0.5, 3.0))), wood, smoothstep(0.0, 0.08, fl - 0.5));
    }
    if (k < 10.5) {                                // 10: forged iron: dark, hammered, a faint bloom of rust
      vec3 w = c * (0.82 + 0.36 * mix(0.5, gvNoise(uv * 15.0), fine));
      return mix(w, vec3(0.3, 0.2, 0.15), 0.3 * smoothstep(0.5, 0.8, gvNoise(uv * 3.3 + 5.0)));
    }
    return c * (0.9 + 0.2 * mix(0.5, gvNoise(uv * 13.0), fine));       // 11: the key's and the knob's worn iron
  }
  if (k < 0.5) return c;
  if (k < 1.5) {                                   // old boards: weathered silver-brown, dark gaps, flaking paint
    float id = floor(uv.x / 0.5), gap = gmBand(uv.x, 0.5, 0.035, max(fw, 0.003));
    vec3 w = c * (0.82 + 0.3 * gmHash(vec2(id, 3.0))) * (0.9 + 0.2 * mix(0.5, gvNoise(vec2(uv.x * 16.0 + id * 7.0, uv.y * 0.8)), fine));   // (the grain to its mean, 0.5)
    w = mix(w, vec3(0.33, 0.42, 0.36), 0.5 * smoothstep(0.5, 0.62, gvNoise(uv * vec2(2.6, 0.9) + id * 3.1)));
    // (THE GAPS GO TO THEIR OWN MEAN, G9c: a gap is 0.035 m of each board's 0.5 m, 0.07 of the boards' face; from 0.1
    // to 0.3 m of footprint the gaps give way to that share, not to nothing)
    return mix(w, c * 0.28, mix(gap, 0.07, smoothstep(0.1, 0.3, fw)));
  }
  if (k < 2.5) return mix(c, vec3(0.36, 0.2, 0.12), 0.6 * smoothstep(0.45, 0.7, gvNoise(uv * 7.0))) * (0.85 + 0.3 * mix(0.5, gvNoise(uv * 23.0), fine));   // (the grain to its mean, 0.5)
  if (k < 3.5) return mix(c, vec3(0.78, 0.74, 0.68), 0.35 * smoothstep(0.5, 0.8, gvNoise(uv * 3.0))) * (0.92 + 0.14 * fine * sin(uv.y * 42.0));
  if (k < 4.5) return mix(c, vec3(0.92, 0.96, 1.0), 0.55 * smoothstep(0.55, 0.8, gvNoise(vec2(uv.x * 2.2, uv.y * 0.35))));
  if (k < 5.5) return c * (0.75 + 0.5 * mix(0.5, gvNoise(uv * 6.0), fine)) * (0.9 + 0.2 * gvNoise(uv * 0.9));
  if (k < 6.5) {                                   // 6: a tussock of rough grass, drawn by place: bleached blades standing,
    // dead thatch dark between them; on its crown the blades' tips
    float bw = max(length(dFdx(v_wp)), length(dFdy(v_wp))), bfine = 1.0 - smoothstep(0.02, 0.1, bw);
    float side = 0.6 * gvNoise(vec2((v_wp.x + v_wp.z) * 11.0, v_wp.y * 1.6)) + 0.4 * gvNoise(vec2((v_wp.x - v_wp.z) * 17.0 + 3.0, v_wp.y * 2.4));
    float crown = 0.6 * gvNoise(v_wp.xz * 9.0) + 0.4 * gvNoise(v_wp.xz * 19.0 + 7.0);
    // (ITS OWN MEAN, G9c: the blades stand on 0.548 of a tussock's face, and their tone there is 0.611 of the noise's
    // span: worked out over the two noises; the figure before, 0.7 and 0.5, drew a far tussock 8 in 100 too light)
    float blr = mix(side, crown, smoothstep(0.5, 0.85, gThingN.y)), bl = mix(0.611, blr, bfine);
    vec3 thatch = c * vec3(0.5, 0.45, 0.4);
    return mix(thatch, c * (0.86 + 0.3 * bl), mix(0.548, smoothstep(0.4, 0.56, blr), bfine)) * (0.88 + 0.26 * gvNoise(v_wp.xz * 0.8));
  }
  // gorse in full flower: dark spiny green (fine upright spines), and its flowers in sprays: clusters of yellow that
  // lie thick toward the bush's top and thin in its hollows
  float away = smoothstep(0.05, 0.16, fw), h = 0.5, dotc = 0.0;
  float spray = smoothstep(0.34, 0.6, 0.65 * gvNoise(uv * 1.3 + 3.0) + 0.35 * gvNoise(uv * 3.7 + 11.0));
  vec2 bq = uv / 0.85 + (vec2(gvNoise(uv * 0.9), gvNoise(uv * 0.9 + 5.0)) - 0.5) * 0.6, bi = floor(bq);
  float boss = 1.0 - smoothstep(0.1, 0.58, length(fract(bq) - 0.5 + (vec2(gmHash(bi + 1.0), gmHash(bi + 4.0)) - 0.5) * 0.4));
  float share = clamp(0.22 + 0.74 * spray + 0.12 * clamp(uv.y, -0.5, 1.5), 0.0, 0.96) * (0.45 + 0.55 * boss);
  for (int i = 0; i < 2; i++) {
    vec2 q = (uv + float(i) * vec2(3.7, 1.9)) / (i == 0 ? 0.2 : 0.135), id = floor(q) + float(i) * 13.0;
    float hi = gmHash(id), rr = 0.2 + 0.22 * gmHash(id + 2.3);
    float d = length(fract(q) - 0.5 - (vec2(hi, gmHash(id + 9.1)) - 0.5) * 0.55);
    float dd = (1.0 - smoothstep(rr - 0.08, rr, d)) * step(1.0 - share, gmHash(id + 4.7));
    if (dd > dotc) { dotc = dd; h = hi; }
  }
  float spine = mix(0.5, 0.6 * gvNoise(vec2(uv.x * 19.0, uv.y * 8.0)) + 0.4 * gvNoise(uv * 27.0 + 3.0), fine);
  vec3 green = c * (0.8 + 0.46 * spine) * (0.86 + 0.28 * gvNoise(uv * 1.1 + 5.0)) * (0.76 + 0.44 * boss);
  // (the flowers go to their own mean: of the bearing share, 0.46 where they are few to 0.42 where they are thick lies
  // under a flower, worked out over the two layers of dots; the figure before, 0.62, drew a far bush too yellow)
  return mix(green, vec3(0.9, 0.62, 0.05) * (0.86 + 0.28 * h), mix(dotc, share * (0.47 - 0.05 * share), away));
}`;

// ---------------------------------------------------------------- the door's leaf, folded right back (it does not move)
// Hung on the north jamb to open outward, it lies flat against the wall's outer face north of the doorway, z -2.55 to
// -7.5, its foot over the step, its head under the lintel's line. The face toward the walk is its garden face: old
// eleven planks painted green long ago (the paint flaked to grey wood at the foot, the edges and the seams), three
// ledges and two braces standing proud, two long forged strap hinges with their nail heads, a round iron knob, an
// iron lock plate with the great key standing in it. No part of it is nearer the line than the north jamb's face.
export function doorLeaf(T) {
  const P = PLAN, xw = -P.wallT - 0.13, xf = xw - 0.26, zh = -P.doorHalf - 0.05, ze = -7.5, y0 = P.stepH + 0.08, y1 = P.stepH + P.doorClear - 0.08;
  const green = '#5a7a78', iron = '#454a50', knob = '#3c4046', steel = '#a8a8a2', R = Math.PI / 2;
  const nail = (x, y, z, r = 0.045) => { T.place(x, y, z, 0, 0, R); T.lathe([[r, 0], [r * 0.8, r * 0.5], [0, r * 0.8]], 5, iron, 10); T.at(null); };
  T.at(null);
  T.box(xf, y0, ze, xw, y1, zh, green, 8);
  const ledges = [1.25, 3.8, 6.4];
  for (let k = 0; k < 3; k++) {
    const y = ledges[k];
    T.box(xf - 0.1, y - 0.24, ze + 0.12, xf, y + 0.24, zh - 0.12, green, 9, 'X');
    for (let i = 0; i < 11; i++) if (k === 1 || i < 4) nail(xf - 0.1, y + (i % 2 ? 0.11 : -0.11), ze + 0.45 * (i + 0.5) + 0.05 * Math.sin(i * 2.3 + k));
  }
  for (let k = 0; k < 2; k++) {                      // the braces: from the hinge side low to the free side high
    const ya = ledges[k] + 0.3, yb = ledges[k + 1] - 0.3, za = zh - 0.45, zb = ze + 0.45, L = Math.hypot(yb - ya, zb - za);
    T.place(xf, (ya + yb) / 2, (za + zb) / 2, 0, Math.atan2(yb - ya, za - zb), 0);
    T.box(-0.085, -0.2, -L / 2, 0, 0.2, L / 2, green, 9, 'X');
    T.at(null);
  }
  for (const y of [1.25, 6.4]) {                     // the strap hinges: forged, tapering to a round end, nailed through
    const xs = xf - 0.1, xo = xs - 0.045, zH = zh, zE = zh - 3.3, hH = 0.14, hE = 0.065;
    T.quad([xo, y - hE, zE], [xo, y - hH, zH], [xo, y + hH, zH], [xo, y + hE, zE], [-1, 0, 0], iron, 10);
    T.quad([xo, y + hH, zH], [xs, y + hH, zH], [xs, y + hE, zE], [xo, y + hE, zE], [0, 1, 0], iron, 10);
    T.quad([xo, y - hE, zE], [xs, y - hE, zE], [xs, y - hH, zH], [xo, y - hH, zH], [0, -1, 0], iron, 10);
    T.place(xs, y, zE - 0.06, 0, 0, R);
    T.lathe([[0.15, 0], [0.15, 0.045], [0, 0.05]], 9, iron, 10);
    T.at(null);
    for (let i = 0; i < 6; i++) nail(xo, y + (i % 2 ? 0.03 : -0.03), zH - 0.3 - i * 0.55, 0.05);
    nail(xo, y, zE - 0.06, 0.05);
    // its eye on the pintle, on the jamb's line (none of it nearer the line than the jamb's face)
    T.place(xf - 0.06, y - 0.3, zh - 0.07);
    T.lathe([[0, 0], [0.1, 0], [0.1, 0.6], [0, 0.6]], 8, iron, 10);
    T.at(null);
  }
  // the lock plate, the round iron knob on its rose, the key standing out of the lock toward the walk
  const zk = ze + 0.6, yk = 3.7;
  T.box(xf - 0.04, yk - 1.0, zk - 0.26, xf, yk + 0.34, zk + 0.26, iron, 10, 'X');
  for (const [dy, dz] of [[-0.92, -0.19], [-0.92, 0.19], [0.27, -0.19], [0.27, 0.19]]) nail(xf - 0.04, yk + dy, zk + dz, 0.035);
  T.place(xf - 0.04, yk, zk, 0, 0, R);
  T.lathe([[0.2, 0], [0.2, 0.03], [0.07, 0.045], [0.07, 0.15], [0.17, 0.18], [0.215, 0.25], [0.19, 0.32], [0.1, 0.36], [0, 0.37]], 10, knob, 11);
  T.at(null);
  T.box(xf - 0.5, yk - 0.685, zk - 0.03, xf - 0.04, yk - 0.615, zk + 0.03, steel, 11);
  T.place(xf - 0.64, yk - 0.65, zk, 0, R, 0);
  const ring = [];
  for (let i = 0; i <= 6; i++) ring.push([0.15 + 0.035 * Math.cos(i / 6 * Math.PI * 2), 0.035 * Math.sin(i / 6 * Math.PI * 2)]);
  T.lathe(ring, 10, steel, 11);
  T.at(null);
}

// ---------------------------------------------------------------- the walk's things (winter; three and a half times life)
// THE DUG BORDER under the north wall, x -52 to -13, z -10.9 to -6.0: turned earth in clods, straw laid over parts of
// it; its height of place is borderAt. THE SPADE stands in it at its fixed place (PLAN.spade: 6.68 m left of the line at
// metre 84.6), nothing dealt within 2.5 m of it. Cabbage stalks and a straw heap by the seed's stream.
export const BORDER = { x0: -52, x1: -13, z0: -10.9, z1: -6.0 };
export function borderAt(x, z) {
  const B = BORDER, e = Math.min(x - B.x0, B.x1 - x, z - B.z0 + 0.5, B.z1 - z);
  if (e <= 0) return 0;
  return sstep(0, 0.7, e) * (0.2 + 0.16 * vnoise(x * 1.3 + 4.0, z * 1.3)) + 0.02;
}
function walkBorder(T, rng) {
  // (G10a: one dark earth, drawn by place as clods and rake lines along the border, kind 18; the straw lies where it
  // lay, said at each corner and cut by the drawing with a ragged edge: no patch of one flat colour)
  const B = BORDER, strawAt = (x, z) => 0.85 * sstep(0.56, 0.74, vnoise(x * 0.23 + 2.0, z * 0.4 + 5.0));
  T.at(null);
  const zs = [B.z0, -10, -9, -8, -7, -6.4, B.z1];
  for (let x = B.x0; x < B.x1; x += 1) for (let j = 0; j + 1 < zs.length; j++) {
    const z0 = zs[j], z1 = zs[j + 1];
    T.quad([x, borderAt(x, z1), z1], [x + 1, borderAt(x + 1, z1), z1], [x + 1, borderAt(x + 1, z0), z0], [x, borderAt(x, z0), z0], [0, 1, 0], '#4a392c', 18,
      [[strawAt(x, z1), 0], [strawAt(x + 1, z1), 0], [strawAt(x + 1, z0), 0], [strawAt(x, z0), 0]]);
  }
  // the spade: iron blade two thirds sunk, socket, ash shaft, a D grip; leaning a little back toward the wall
  const S = PLAN.spade, ash = '#a59170', iron = '#4a4644';
  T.place(S[0], borderAt(S[0], S[1]), S[1], 0.5, -0.13, 0.04);
  T.box(-0.33, -0.55, -0.02, 0.33, 0.42, 0.02, iron, 2);
  T.lathe([[0.1, 0.36], [0.075, 0.98]], 6, iron, 2);
  T.lathe([[0.066, 0.95], [0.06, 2.9]], 6, ash, 0);
  T.box(-0.25, 2.84, -0.05, 0.25, 2.95, 0.05, ash, 0);
  T.box(-0.25, 2.95, -0.045, -0.18, 3.32, 0.045, ash, 0);
  T.box(0.18, 2.95, -0.045, 0.25, 3.32, 0.045, ash, 0);
  T.box(-0.27, 3.3, -0.065, 0.27, 3.43, 0.065, ash, 0);
  T.mark('spade', 0, 3.43, 0);
  // a few cabbage stalks left standing, and a heap of straw against the wall
  for (let i = 0; i < 7; i++) {
    const x = rng.range(B.x0 + 2, B.x1 - 2), z = rng.range(-10, -7.2);
    if (Math.hypot(x - S[0], z - S[1]) < 2.5 || WALK_PLAN.forcers.some((f) => Math.hypot(x - f[0], z - f[1]) < 1.3) || (x < -42.5 && z > -8.1)) continue;   // (its place first)
    const h = rng.range(0.5, 1.1), lean = rng.range(-0.2, 0.2);
    T.place(x, borderAt(x, z) - 0.05, z, rng.range(0, 6.28), lean, lean * 0.5);
    T.lathe([[0.11, 0], [0.075, h], [0.15, h + 0.12], [0.1, h + 0.26], [0, h + 0.3]], 6, '#8a9070', 0);
  }
  T.place(rng.range(-50, -44), 0, -9.6, rng.range(0, 6.28));
  T.lathe([[1.9, 0], [1.5, 0.45], [0.7, 0.9], [0, 1.0]], 9, '#c2ae72', 5);
  T.at(null);
}

// THE GARDENER'S PLAN OF THE WALK, THE KITCHEN GARDEN AND THE ORCHARD (G9b): typed places in metres, the same on
// every seed. What a gardener set stands on this plan; the seed gives each thing its turn, its tilt and its own state
// or form (a light slid down, how many pots stand in a stack and their size, a tree's height and boughs), NEVER ITS
// PLACE. (What grew wild, on the moor and inside the garden, is the seed's by rules of place.)
// - frames: three cold frames in a row on the grass 3.6 m out from the north wall's foot, 7.4 and 7.6 m apart from x -84.
// - bells: bell glasses in rows along x: three on the grass 2.1 m apart from x -81 (z -4.2), four on the border's
//   straw 3.4 m apart from x -30 (z -8.4).
// - pots: stacks of clay pots at the walls' feet: three by the north wall west of the kitchen door, 1.8 to 1.9 m
//   apart from x -66.3; four by the low south wall before the door wall, 2.6 to 3.7 m apart from x -19.
// - can: the zinc water can by the frames.
// - fans: six fruit trees trained flat on the walk's north wall: two west of the kitchen door, 13.5 m apart from
//   x -84, and four east of it, 11.2 to 13 m apart from x -46.
// - kitchen: five bare fruit trees in the kitchen garden: two pairs to either hand of its path (x -59.7 and -52.3,
//   about z -24 and z -45) and one among the far beds.
// - orchard: four rows 13.5 m apart, the first at z 21.5 (10.5 m behind the low south wall), seven trees a row 13 m
//   apart from x -84.
// - (G10a, G12) ladder: a long ladder laid flat along the low south wall's foot, 12 m long from x -86.5. poles: a sheaf of
//   bean poles leaning on the north wall west of the pots. butt: a water butt by the north wall west of
//   the kitchen door. rake: a wooden rake leaning on the north wall east of that door. wigwam: bean poles tied as a
//   wigwam at the corner of the kitchen garden's first east bed. forcers: three tall clay forcing pots in the dug
//   border round the spade. greens: a row of seven winter greens in the border's west end, 1.2 m apart. tank: a
//   stone dipping tank against the south wall, x -25.5 to -21.5. The barrow with its fork stands at the end of its way
//   (WALK_WAY), its wheel at x -24.5.
// Every plot of the walk's things lies 3.5 m and more from the flown line (the barrow 2.6 m in plan, 3.2 m of clear
// air under the line's height); no tree stands within 14 m of it.
export const WALK_PLAN = {
  frames: [[-84, -7.4], [-76.6, -7.5], [-69, -7.3]], bells: [[-81, -4.2, 2.1, 3], [-30, -8.4, 3.4, 4]],
  pots: [[-66.3, -10.2], [-64.4, -10.25], [-62.6, -10.1], [-19, 10.2], [-16.4, 10.25], [-13.2, 10.1], [-9.5, 10.2]], can: [-72.6, -4.3],
  fans: [-84, -70.5, -46, -33, -20, -8.8], kitchen: [[-59.7, -24], [-52.3, -23], [-59.7, -45], [-52.3, -46.5], [-26.6, -34]],
  orchard: { x0: -84, z0: 21.5, dx: 13, dz: 13.5, rows: 4, cols: 7 },
  ladder: [-86.5, 12], poles: [-68.2, -9.1], butt: [-60.2, -9.3], rake: [-52.8, -9.2], wigwam: [-50.2, -17.5],
  forcers: [[-40.6, -8.0], [-38.9, -9.1], [-33.0, -8.9]], greens: [-50.6, -7.3, 1.2, 7], tank: [-25.5, -21.5, 8.3, 10.2],
};
function walkFrames(T, rng, TG = T) {
  const paint = '#8f9484', bar = '#c4c3b4', glass = '#7f8c7c', pane = '#3c4440', clay = '#b0603c', zinc = '#8f989a';
  const frame = (cx, cz, yaw, slid, name = null) => {
    T.place(cx, 0, cz, yaw);
    T.box(-2.7, 0, -1.76, 2.7, 1.6, -1.64, paint, 1);
    T.box(-2.7, 0, 1.64, 2.7, 0.9, 1.76, paint, 1);
    for (const x of [-2.7, 2.7]) T.quad([x, 0, -1.7], [x, 0, 1.7], [x, 0.9, 1.7], [x, 1.6, -1.7], [x < 0 ? -1 : 1, 0, 0], paint, 1);
    T.quad([-2.6, 0.35, 1.6], [2.6, 0.35, 1.6], [2.6, 0.35, -1.6], [-2.6, 0.35, -1.6], [0, 1, 0], '#4b3b2f', 5);
    for (let k = 0; k < 2; k++) {                    // two glazed lights on the slope; one may be slid part down
      const x0 = -2.68 + k * 2.7, dz = k === 1 ? slid : 0;
      T.at(new THREE.Matrix4().compose(new THREE.Vector3(cx, 1.27, cz), new THREE.Quaternion().setFromEuler(new THREE.Euler(0.203, yaw, 0, 'YXZ')), new THREE.Vector3(1, 1, 1)));
      T.box(x0 + 0.06, -0.01, -1.72 + dz, x0 + 2.6, 0.01, 1.76 + dz, pane, 14, 'y');
      for (let b = 0; b <= 4; b++) T.box(x0 + b * 0.645 - 0.045, 0, -1.78 + dz, x0 + b * 0.645 + 0.075, 0.08, 1.8 + dz, bar, 0, 'y');
      for (const z of [-1.78, 1.72]) T.box(x0, 0, z + dz, x0 + 2.66, 0.08, z + dz + 0.1, bar, 0, 'y');
      if (name && k === 1) T.mark(name, x0 + 2.0, 0.08, -1.73 + dz);
    }
  };
  const W = WALK_PLAN;                               // (the middle frame's second light is slid part down, how far by the seed)
  W.frames.forEach(([x, z], i) => frame(x, z, rng.range(-0.05, 0.05), i === 1 ? rng.range(0.7, 1.3) : 0, i === 2 ? 'ridge' : null));
  const bell = (x, z, s) => {
    const y = borderAt(x, z), yaw = rng.range(0, 6.28);
    // under it a round of dark turned earth and a forced plant, blanched pale (both solid, under the clear glass)
    T.place(x, y, z, yaw, 0, 0, s);
    T.lathe([[0.84, 0.03], [0.45, 0.1], [0, 0.08]], 9, '#2e2620', 5);
    T.blob([0.04, 0.22, -0.03], [0.3, 0.24, 0.27], '#3f4f2e', '#8fa05c', x * 1.3, 6, 3, 5);
    TG.place(x, y, z, yaw, 0, 0, s);
    TG.lathe([[0.72, 0], [0.75, 0.5], [0.7, 1.0], [0.55, 1.35], [0.3, 1.56], [0.1, 1.63], [0.1, 1.72], [0.17, 1.8], [0, 1.87]], 12, glass, 13);
  };
  for (const [x, z, step, n] of W.bells) for (let i = 0; i < n; i++) bell(x + i * step, z, rng.range(0.9, 1.15));
  const pot = [[0.3, 0], [0.42, 0.62], [0.48, 0.62], [0.48, 0.8], [0.41, 0.8], [0.36, 0.1]];
  const stack = (x, z, n, s, lying, name) => {
    for (let k = 0; k < n; k++) {
      if (lying) T.place(x + k * 0.24 * s, 0.47 * s, z, 0, 0, -Math.PI / 2, s); else T.place(x, k * 0.24 * s, z, rng.range(0, 6.28), 0, 0, s);
      T.lathe(pot, 9, clay, 3);
    }
    if (name && lying) T.mark(name, -0.48, 0.71, 0); else if (name) T.mark(name, 0.445, 0.8, 0);
  };
  let stackNo = 0;
  for (const [x, z] of W.pots) stack(x, z, rng.int(2, 5), rng.range(0.85, 1.35), rng.chance(0.3), stackNo++ === 2 ? 'pot' : null);
  // the water can: body, spout with its rose, a hoop handle
  const canX = W.can[0], canYaw = rng.range(0, 6.28);
  T.place(canX, 0, W.can[1], canYaw);
  T.lathe([[0, 0], [0.44, 0], [0.44, 0.98], [0.37, 1.04]], 10, zinc, 0);
  T.box(-0.03, 1.0, -0.4, 0.03, 1.42, -0.34, zinc, 0); T.box(-0.03, 1.0, 0.34, 0.03, 1.42, 0.4, zinc, 0); T.box(-0.03, 1.38, -0.4, 0.03, 1.44, 0.4, zinc, 0);
  T.at(new THREE.Matrix4().makeRotationY(canYaw).setPosition(canX, 0, W.can[1]).multiply(new THREE.Matrix4().makeRotationZ(-0.9).setPosition(0.4, 0.25, 0)));
  T.lathe([[0.1, 0], [0.055, 1.25], [0.17, 1.3], [0, 1.31]], 6, zinc, 0);
  T.at(null);
}
// THE KITCHEN GARDEN'S DUG BEDS, behind its open door on the walk's north side: four to either hand of its path, ridged across, some laid
// with straw for the winter (which, by the seed's stream)
function kitchenBeds(T, rng) {
  T.at(null);
  for (const [x0, x1] of [[-84, -61], [-51, -28]]) for (const z1 of [-15.5, -27, -38.5, -50]) {
    const z0 = z1 - 8.5, strawed = rng.chance(0.35);
    const h = (x, z) => { const e = Math.min(x - x0, x1 - x, z - z0, z1 - z); return e <= 0.01 ? 0.02 : sstep(0, 0.8, e) * (0.24 + 0.1 * Math.sin(x * 3.9) + 0.1 * vnoise(x * 1.1, z * 1.1)) + 0.02; };
    for (let i = 0; i < 20; i++) for (let j = 0; j < 4; j++) {
      const x = x0 + i * 1.15, z = z0 + j * 2.125, xb = x + 1.15, zb = z + 2.125;
      // (G10a: turned earth drawn by place, kind 18, ridged along z; a strawed bed's straw said at each corner)
      const st = (px, pz) => (strawed ? 0.8 * sstep(0.3, 0.55, vnoise(px * 0.3 + 7, pz * 0.3)) : 0);
      T.quad([x, h(x, zb), zb], [xb, h(xb, zb), zb], [xb, h(xb, z), z], [x, h(x, z), z], [0, 1, 0], '#47382d', 18, [[st(x, zb), 1], [st(xb, zb), 1], [st(xb, z), 1], [st(x, z), 1]]);
    }
  }
}
// THE KERB (G10a): the made edge between gravel and turf, BRICKS ON EDGE laid end to end, 0.26 m wide, standing 0.11 m
// over the walk's sheet: along the gravel's north edge from the gateway's north pier to the court (with a gap at the
// side path to the kitchen door, whose two edges it follows north to the wall's face), and along its south edge from
// where the gravel leaves the south wall's foot to the court; in the court each kerb runs out to its wall. True
// geometry on the sheet's own stations (walkStations): straight from station to station, as the gravel's cut is.
function walkKerb(T, route) {
  const P = PLAN, W = walkStations(route), kx = P.kitchenDoorX, brick = '#8f5540', wd = 0.26, y0 = 0.03, y1 = 0.17, face = P.walkZ - P.wallT / 2;
  T.at(null);
  // a run of kerb through points [x, z of its gravel side, z of its turf side]; u runs on along it
  const run = (pts, cap0 = false, cap1 = false) => {
    let u = 0;
    for (let i = 0; i + 1 < pts.length; i++) {
      const a = pts[i], b = pts[i + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]), ua = u, ub = u + l, sg = Math.sign(a[1] - a[2]) || 1;
      T.quad([a[0], y1, a[1]], [b[0], y1, b[1]], [b[0], y1, b[2]], [a[0], y1, a[2]], [0, 1, 0], brick, 17, [[ua, 0], [ub, 0], [ub, wd], [ua, wd]]);
      T.quad([a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]], [0, 0, sg], brick, 17, [[ua, y0], [ub, y0], [ub, y1], [ua, y1]]);
      T.quad([a[0], y0, a[2]], [b[0], y0, b[2]], [b[0], y1, b[2]], [a[0], y1, a[2]], [0, 0, -sg], brick, 17, [[ua, y0], [ub, y0], [ub, y1], [ua, y1]]);
      u = ub;
    }
    for (const [on, p, dir] of [[cap0, pts[0], -1], [cap1, pts[pts.length - 1], 1]]) if (on) T.quad([p[0], y0, p[1]], [p[0], y0, p[2]], [p[0], y1, p[2]], [p[0], y1, p[1]], [dir, 0, 0], brick, 17, [[0, y0], [wd, y0], [wd, y1], [0, y1]]);
  };
  // the kerb's two lines at x on a side (-1 north, 1 south), and a run of that side from x0 to x1 through the stations between
  const at = (x, side) => { const e = W.at(x), z = e.mid + side * e.half; return [x, z, z + side * wd]; };
  const along = (x0, x1, side) => [at(x0, side), ...W.xs.filter((x) => x > x0 + 0.05 && x < x1 - 0.05).map((x) => at(x, side)), at(x1, side)];
  // where a side's kerb meets its wall's face in the court (its turf side reaches the face): by halving
  const meets = (side, from) => { let a = from, b = W.xB; for (let i = 0; i < 30; i++) { const m = (a + b) / 2; if (Math.abs(at(m, side)[2]) < face - 0.02) a = m; else b = m; } return a; };
  const nEnd = meets(-1, -20), sEnd = meets(1, -20);
  let sFrom = W.xA; while (sFrom < -20 && Math.abs(at(sFrom, 1)[2]) >= face - 0.02) sFrom += 0.25;
  run(along(W.xA + 0.05, kx - 2.3, -1), false, false);
  run(along(kx + 2.3, nEnd, -1));
  run(along(sFrom, sEnd, 1), true, false);
  // the side path's two kerbs, from the wall's face south to the walk's kerb (x along a brick's width here)
  for (const hand of [-1, 1]) {
    const xi = kx + hand * 2.3, xo = kx + hand * (2.3 + wd), zs = at(kx + hand * (2.3 + wd / 2), -1)[2], zf = -face, l = zs - zf, ex = hand;
    T.quad([xi, y1, zf], [xi, y1, zs], [xo, y1, zs], [xo, y1, zf], [0, 1, 0], brick, 17, [[0, 0], [l, 0], [l, wd], [0, wd]]);
    T.quad([xi, y0, zf], [xi, y0, zs], [xi, y1, zs], [xi, y1, zf], [-ex, 0, 0], brick, 17, [[0, y0], [l, y0], [l, y1], [0, y1]]);
    T.quad([xo, y0, zf], [xo, y0, zs], [xo, y1, zs], [xo, y1, zf], [ex, 0, 0], brick, 17, [[0, y0], [l, y0], [l, y1], [0, y1]]);
  }
}
// MORE OF THE GARDENER'S WINTER (G10a), all on the plan (WALK_PLAN, WALK_WAY): the seed gives turns, leans and small
// states from a stream of its own ('things-more'), never a place. Three and a half times life, as all the walk.
// (G11) THE PLAN'S PLACES ARE HELD EXACTLY: the rake's foot, the sheaf's feet (nine even stations about its place),
// the wigwam's top and every winter green stand where the plan types them; a leaning thing's head lies where its
// own lean and length carry it from that foot.
function walkMore(T, rng, route) {
  const W = WALK_PLAN, P = PLAN, face = P.walkZ - P.wallT / 2, wood = '#9c8a68', hazel = '#6e5a44', clay = '#a8846e', iron = '#4a4644';
  // a stick from a to b, r thick to each hand: two crossed leaves
  const stick = (a, b, r, color, kind = 0) => {
    const d = v3.norm(v3.add(b, a, -1)), u = v3.norm(v3.cross(d, Math.abs(d[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0])), w = v3.cross(d, u), L = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    for (const [e, n] of [[u, w], [w, u]]) T.quad(v3.add(a, e, -r), v3.add(a, e, r), v3.add(b, e, r), v3.add(b, e, -r), n, color, kind, [[0, 0], [2 * r, 0], [2 * r, L], [0, L]]);
  };
  // (G12) THE LADDER LAID DOWN by the gardener: FLAT on the gravel along the south wall's foot (on its edge, leaning on
  // the brick, it read as floating or half sunk in the wall). Both rails lie on the walk's sheet (0.06 m over the
  // ground) their whole length, the rungs between them; its west end's rail lies 0.06 m off the brick and the seed
  // turns its east end up to 0.14 m further off (its one draw, as before); nothing of it enters the wall. It lies
  // wholly in the low wall's own shade (the sun of its place: under 0.1), so it throws no shadow of its own: its
  // rails' north sides stand dark on the gravel
  const [lx, ll] = W.ladder, turn = (rng.range(-0.04, 0.04) + 0.04) * 0.15;
  T.place(lx, 0.11, face - 0.06 - 1.5, turn, Math.PI / 2, 0);
  T.box(0, 0, -0.05, ll, 0.2, 0.05, wood, 0); T.box(0, 1.3, -0.05, ll, 1.5, 0.05, wood, 0);
  for (let x = 0.6; x < ll - 0.3; x += 0.9) T.box(x - 0.045, 0.2, -0.035, x + 0.045, 1.3, 0.035, '#a8977a', 0, 'yY');
  T.at(null);
  // the sheaf of bean poles leaning on the north wall, their heads on the brick
  for (let i = 0; i < 9; i++) { const fx = W.poles[0] - 0.6 + 0.15 * i, len = rng.range(7.2, 8.3); stick([fx, 0, W.poles[1] + (i % 3 - 1) * 0.2], [fx - 0.4 + len * Math.tan(rng.range(-0.07, 0.07)), len, -face + 0.08], 0.05, hazel); }
  // the water butt: oak staves, three iron hoops, the water's face under its rim
  T.place(W.butt[0], 0, W.butt[1], rng.range(0, 6.28));
  T.lathe([[0.9, 0], [1.05, 0.8], [1.1, 1.6], [1.05, 2.4], [0.92, 3.1]], 10, '#7a6a55', 1);
  for (const [r, y] of [[1.0, 0.45], [1.11, 1.55], [0.99, 2.75]]) T.lathe([[r + 0.02, y], [r + 0.02, y + 0.13]], 10, iron, 2);
  T.lathe([[0.9, 2.95], [0, 2.95]], 10, '#39413c', 14);
  T.at(null);
  // the wooden rake leaning on the north wall east of the kitchen door, its head up, its teeth out
  const rb = [W.rake[0], 0, W.rake[1]], rh = [W.rake[0] + 5.5 * Math.tan(rng.range(-0.055, 0.055)), 5.5, -face + 0.12];
  stick(rb, rh, 0.06, wood);
  stick([rh[0] - 1.2, rh[1], rh[2]], [rh[0] + 1.2, rh[1], rh[2]], 0.07, wood);
  for (let i = 0; i < 9; i++) { const x = rh[0] - 1.08 + i * 0.27; stick([x, rh[1], rh[2]], [x, rh[1] - 0.12, rh[2] + 0.36], 0.03, '#a8977a'); }
  // the wigwam of bean poles in the kitchen garden, tied at its head
  const [wx, wz] = W.wigwam, wt = [wx, 7.4, wz];
  for (let i = 0; i < 7; i++) { const a = i / 7 * 6.283 + rng.range(-0.2, 0.2); stick([wx + Math.cos(a) * 1.5, 0, wz + Math.sin(a) * 1.5], [wt[0] - Math.cos(a) * 0.3, wt[1] + 0.6, wt[2] - Math.sin(a) * 0.3], 0.05, hazel); }
  T.place(wt[0], wt[1] - 0.25, wt[2]); T.lathe([[0.2, 0], [0.2, 0.22]], 6, '#b9a66a', 0); T.at(null);
  // the tall clay forcing pots in the dug border, each with its lid (one lid set askew)
  W.forcers.forEach(([x, z], i) => {
    T.place(x, borderAt(x, z) - 0.04, z, rng.range(0, 6.28), rng.range(-0.03, 0.03), rng.range(-0.03, 0.03));
    T.lathe([[0.62, 0], [0.74, 0.5], [0.7, 1.6], [0.5, 2.05], [0.42, 2.1]], 8, clay, 3);
    T.place(x + (i === 1 ? 0.12 : 0), borderAt(x, z) - 0.04 + 2.1, z, rng.range(0, 6.28), i === 1 ? 0.16 : 0, 0);
    T.lathe([[0.47, 0], [0.3, 0.2], [0.1, 0.24], [0.13, 0.42], [0, 0.44]], 8, clay, 3);
  });
  // the row of winter greens: seven dark curled heads on their stalks
  for (let i = 0; i < W.greens[3]; i++) {
    const x = W.greens[0] + i * W.greens[2], z = W.greens[1], y = borderAt(x, z), h = rng.range(0.75, 1.05);
    T.at(null);
    T.blob([x, y + h * 0.6, z], [0.5 * h, 0.55 * h, 0.5 * h], '#35503a', '#6f9372', x * 1.7, 6, 3, 15);
  }
  // the stone dipping tank against the south wall: four walls, a rim, dark water that mirrors the sky
  const [tx0, tx1, tz0, tz1] = W.tank, th = 1.55, tr = 0.24;
  T.at(null);
  T.box(tx0, 0, tz0, tx1, th, tz1, '#8d8a80', 16, 'yY');
  for (const [a, b, c, d] of [[tx0, tz0, tx1, tz0 + tr], [tx0, tz1 - tr, tx1, tz1], [tx0, tz0 + tr, tx0 + tr, tz1 - tr], [tx1 - tr, tz0 + tr, tx1, tz1 - tr]]) T.quad([a, th, d], [c, th, d], [c, th, b], [a, th, b], [0, 1, 0], '#9a978c', 16);
  T.quad([tx0 + tr, th - 0.14, tz1 - tr], [tx1 - tr, th - 0.14, tz1 - tr], [tx1 - tr, th - 0.14, tz0 + tr], [tx0 + tr, th - 0.14, tz0 + tr], [0, 1, 0], '#2f3833', 14);
  // THE BARROW at the end of its way, its wheel on the wheel's mark, its shafts toward the kitchen door; a load of
  // leaf mould in it and the fork laid across the load
  const bx = WALK_WAY.barrowX, bz = walkStations(route).at(bx).mid + wayOff(bx), M4 = (ry, rx, x, y, z) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, 0, 'YXZ')), new THREE.Vector3(1, 1, 1));
  T.at(M4(Math.PI, Math.PI / 2, bx, 0.75, bz));
  T.lathe([[0, -0.09], [0.75, -0.09], [0.75, 0.09], [0, 0.09]], 10, '#5a5046', 2);
  T.at(M4(Math.PI, 0, bx, 0, bz));                    // (its own x runs back from the wheel toward the shafts' ends)
  const paint = '#6f7f78', q = (a, b, c, d, n) => T.quad(a, b, c, d, n, paint, 1);
  q([0.8, 1.0, -0.7], [2.8, 1.0, -0.7], [2.8, 1.0, 0.7], [0.8, 1.0, 0.7], [0, 1, 0]);
  q([0.8, 1.0, -0.7], [2.8, 1.0, -0.7], [3.1, 1.9, -1.0], [0.4, 1.9, -1.0], [0, 0.3, -1]);
  q([0.8, 1.0, 0.7], [2.8, 1.0, 0.7], [3.1, 1.9, 1.0], [0.4, 1.9, 1.0], [0, 0.3, 1]);
  q([0.8, 1.0, -0.7], [0.8, 1.0, 0.7], [0.4, 1.9, 1.0], [0.4, 1.9, -1.0], [-1, 0.4, 0]);
  q([2.8, 1.0, -0.7], [2.8, 1.0, 0.7], [3.1, 1.9, 1.0], [3.1, 1.9, -1.0], [1, 0.3, 0]);
  for (const sd of [-1, 1]) { stick([0, 0.75, sd * 0.22], [5.2, 2.05, sd * 0.9], 0.07, wood); stick([3.0, 1.2, sd * 0.84], [3.25, 0, sd * 0.84], 0.06, wood); }
  T.blob([1.75, 1.75, 0], [1.25, 0.6, 0.85], '#3a2d24', '#5a4634', 3.7, 6, 3, 5);
  stick([0.9, 2.2, -0.15], [4.6, 2.75, 0.3], 0.05, '#a59170');
  stick([0.9, 2.2, -0.42], [0.9, 2.2, 0.12], 0.05, iron, 2);
  for (let i = 0; i < 4; i++) stick([0.9, 2.2, -0.42 + i * 0.18], [0.05, 2.5, -0.42 + i * 0.18], 0.035, iron, 2);
  T.at(null);
}
async function walkThings(T, o, TG) {
  walkKerb(T, o.route);
  if (o.yieldNow) await o.yieldNow(16);
  walkMore(T, o.stream('things-more'), o.route);
  if (o.yieldNow) await o.yieldNow(6.5);
  walkBorder(T, o.stream('things-border'));
  if (o.yieldNow) await o.yieldNow(3);
  walkFrames(T, o.stream('things-frames'), TG);
  if (o.yieldNow) await o.yieldNow(8);
  kitchenBeds(T, o.stream('things-beds'));
}

// ---------------------------------------------------------------- the moor (winter): where its plants and rocks stand
// By the seed's stream, under rules of place that hold on every seed. The entry's axis is the line z 5 west of the
// boundary, however far back. Heather may grow up to 2 m from the axis (it stands under 1.6 m; the line is flown 4.6 m
// over the ground); no gorse nearer than 6.5 m of clear air from the axis, no broom nearer than 8 m, no rock nearer
// than 4 m; nothing within 3 m of the boundary wall's faces but its own rough grass. Thick near the gateway and the
// axis, thinning with distance (the far moor is the ground's own colour).
// THE ENTRY'S OPEN STRIP (G10a): beside the route's first 20 m and 4 m on (every place west of x -96) nothing large
// stands with its edge within 8 m of the axis in plan: no gorse, no broom, no rock over 1.6 m in radius, no heather
// mound over 2 m in radius (such a plant is set out to 8 m of clear ground by the same draw; no draw is added).
export const MOOR_ENTRY = { x: -96, clear: 8, rock: 1.6, heather: 2 };
export function layMoor(rng, heightAt) {
  const P = PLAN, wallX = P.boundaryX - P.boundaryT / 2, out = { heather: [], gorse: [], broom: [], rocks: [], tussocks: [] };
  const spot = (reach, spread) => {
    const x = wallX - 3 - reach * Math.pow(rng(), 1.7), side = rng.sign(), d = spread * Math.pow(rng(), 1.5);
    return { x, d, side };
  };
  const put = (list, s, clear, r, more, large = false) => {
    const x = s.x - r, d = s.d + (large && x < MOOR_ENTRY.x ? Math.max(clear, MOOR_ENTRY.clear) : clear) + r, z = P.gateZ + s.side * d;
    list.push({ x, y: heightAt(x, z), z, r, d, ...more });
  };
  for (let i = 0; i < 430; i++) { const r = rng.range(1.3, 3.2); put(out.heather, spot(330, 95), 2, r, { h: rng.range(0.7, 1.5), wine: rng(), seed: rng.range(0, 60) }, r > MOOR_ENTRY.heather); }
  for (let i = 0; i < 64; i++) { const r = rng.range(2.2, 4.2); put(out.gorse, spot(300, 80), 6.5, r, { h: rng.range(3, 5.6), seed: rng.range(0, 60) }, true); }
  for (let k = 0; k < 8; k++) {                       // eight gorse bushes more by the seed: anywhere in the 40 m before the gateway, either hand, 6.5 m and more of clear air, 5 m at most beyond it
    const r = rng.range(2.4, 3.6), more = rng.range(0, 5), x = wallX - 6 - r - rng.range(0, 40), d = (x < MOOR_ENTRY.x ? MOOR_ENTRY.clear : 6.5) + r + more, z = P.gateZ + rng.sign() * d;
    out.gorse.push({ x, y: heightAt(x, z), z, r, d, h: rng.range(3.4, 5.2), seed: rng.range(0, 60) });
  }
  for (let i = 0; i < 26; i++) put(out.broom, spot(220, 60), 8, 1.5, { h: rng.range(4.5, 7), seed: rng.range(0, 60) }, true);
  for (let i = 0; i < 46; i++) { const r = rng.range(0.9, 3.4); put(out.rocks, spot(320, 90), 4, r, { h: rng.range(0.5, 0.75) * r, seed: rng.range(0, 60) }, r > MOOR_ENTRY.rock); }
  for (let i = 0; i < 150; i++) { const r = rng.range(0.6, 1.1); put(out.tussocks, spot(260, 70), 2.2, r, { h: rng.range(0.6, 1.1), seed: rng.range(0, 60) }); }
  // the boundary's rough grass: tussocks along both faces of the wall, but not across the gateway
  // (G11: a station every 1.7 m; one within the gateway, its piers, 0.8 m and the half metre a tussock may move from
  // its station, draws nothing)
  for (let z = -120; z < 130; z += 1.7) {
    if (Math.abs(z - P.gateZ) < P.gateHalf + P.pierW + 0.8 + 0.5) continue;
    const zz = z + rng.range(-0.5, 0.5), face = rng.sign(), r = rng.range(0.6, 1.1), h = rng.range(0.6, 1.2), seed = rng.range(0, 60);
    const x = P.boundaryX + face * (P.boundaryT / 2 + r * 0.6);
    out.tussocks.push({ x, y: heightAt(x, zz), z: zz, r, d: Math.abs(zz - P.gateZ), h, seed });
  }
  return out;
}
// THE MOOR'S DETAIL BY PLACE (G9a): how far a plant of the moor stands from the flown line in plan, the line
// continued MOOR_BACK m straight back along the entry's axis (west of the boundary the line is that axis, z 5, so
// the distance is the plant's own d). The bosses of the heather, the rocks' finer form and shoulder, the tussocks'
// thatch and every tuft, and the finer build of the heather's and the gorse's bodies, stand within their typed
// metres of that line (40, 45, 40, 40 to 48, 40 and 48 m) ABEAM of it, from its back end at x -150 (the start
// less MOOR_BACK) to the boundary; a plant behind that end has none. (The whips and sprays of moorWood keep their
// own typed reach: plants east of x -185, the gorse's east of x -195, within 40 and 48 m of the axis.)
export const MOOR_BACK = 30;
const moorOff = (p) => (p.x < PLAN.start[0] - MOOR_BACK ? 1e9 : p.d);
// the moor's plants as clustered forms in the things mesh: heather cushions (wine to russet), gorse in dark spiny
// green with its yellow winter flowers, grey rocks bedded in the ground, pale tussocks of rough grass
async function moorThings(T, moor, yieldNow) {
  let laid = 0;
  const breathe = breathAfter(yieldNow, () => laid, Math.ceil((moor.heather.length * 1.6 + moor.gorse.length * 2.5 + moor.rocks.length + moor.tussocks.length) / 10) + 2, 5);
  T.at(null);
  const mixHex = (a, b, t) => '#' + new THREE.Color(a).lerp(new THREE.Color(b), t).getHexString();
  for (const p of moor.heather) {
    const near = moorOff(p) < 40;
    const low = mixHex('#5c4a4c', '#5c4a64', p.wine), high = mixHex('#70595b', '#6a5672', p.wine), seen = near && moorOff(p) < 40;
    // (G10a: a mound within 40 m of the line has a BROKEN TOP: its upper rings and crown stand in and out, and its
    // three bosses are of unlike heights, the tallest over the dome; all under 1.6 m)
    T.blob([p.x, p.y + p.h * 0.1, p.z], [p.r, p.h * 0.8, p.r * (0.8 + 0.4 * (p.seed % 1))], low, high, p.seed, near ? 10 : 6, near ? 4 : 3, 12, near ? 0.3 : 0);
    if (seen) for (let k = 0; k < 3; k++) {            // its bosses: each a tuft's own swell, a little over the dome
      const h1 = (p.seed * (k + 2.3)) % 1, h2 = (p.seed * (k + 3.7) + 0.4) % 1, a = p.seed * 2.3 + k * 2.2, o = p.r * (0.3 + 0.2 * h1), q = 0.38 + 0.17 * h2;
      const up = Math.min(p.h * (0.6 + 0.4 * q) * (0.7 + 0.5 * h1), (1.55 - 0.2 * p.h) / 1.05);
      T.blob([p.x + Math.cos(a) * o, p.y + p.h * 0.2, p.z + Math.sin(a) * o], [p.r * q, up, p.r * q], low, high, p.seed + k * 5.1 + 1.7, 7, 2, 12, 0.3);
    }
    laid += seen ? 3.6 : 1.6; await breathe();
  }
  for (const p of moor.gorse) {
    const n = 2 + Math.floor(p.seed % 2), gNear = moorOff(p) < 48;
    for (let k = 0; k < n; k++) {
      const a = p.seed * 1.7 + k * 2.3, o = k === 0 ? 0 : p.r * 0.55, s = k === 0 ? 1 : 0.7;
      T.blob([p.x + Math.cos(a) * o, p.y + p.h * 0.42 * s, p.z + Math.sin(a) * o], [p.r * 0.8 * s, p.h * 0.6 * s, p.r * 0.8 * s], '#42543a', '#65774a', p.seed + k * 7.3, gNear ? 10 : 7, gNear ? 5 : 4, 7);
    }
    laid += n; await breathe();
  }
  for (const p of moor.rocks) {
    const seen = moorOff(p) < 45, hand = p.z < PLAN.gateZ ? -1 : 1;
    T.blob([p.x, p.y + p.h * 0.25, p.z], [p.r, p.h, p.r * 0.75], '#77746e', '#a9a69c', p.seed, seen ? 10 : 6, seen ? 5 : 3, seen ? 16 : 5);
    // (the shoulder lies on the hand away from the entry's axis: no part of it nearer the axis than the body)
    if (seen) T.blob([p.x + (p.seed % 1 - 0.5) * p.r, p.y + p.h * 0.12, p.z + hand * p.r * 0.45], [p.r * 0.62, p.h * 0.72, p.r * 0.5], '#716e68', '#a39f94', p.seed + 3.3, 9, 4, 16);
    laid++; await breathe();
  }
  for (const p of moor.tussocks) {                    // (within 40 m of the line: a low thatch under its standing blades)
    const seen = moorOff(p) < 40, kh = seen ? 0.62 : 1, kr = seen ? 0.85 : 1;
    T.blob([p.x, p.y + p.h * 0.1 * kh, p.z], [p.r * kr, p.h * 0.75 * kh, p.r * kr], seen ? '#75684a' : '#8f8258', seen ? '#c2b17c' : '#dccb92', p.seed, 7, 3, 6);
    laid++; await breathe();
  }
}

// ---------------------------------------------------------------- THE MOOR CLOTHED BESIDE THE LINE (G10b, point 5)
// From MOOR_CLOTH.back m behind the line's first metre to 3 m short of the boundary wall, out to MOOR_CLOTH.reach m on
// both hands of the entry's axis, the ground is clothed: heather hummocks and tussocks of bleached grass on a lattice
// of MOOR_CLOTH.cell m (of MOOR_CLOTH.cellNear m within MOOR_CLOTH.inner m of the axis, where a hummock is 0.9 to
// 1.5 m in radius and low; beyond, 1.25 to 2.25 m, and none over 2 m within 11 m of the axis), each moved up to
// 0.35 of its cell by a stream of its own ('moor-cloth'), so that neighbours overlap. A CELL IS ASKED BEFORE ANY DRAW
// (G11), at its own middle: none on worn ground, none where a plant or a rock of the moor's own deal stands within
// its radius and MOOR_CLOTH.keep m; a cell that is kept draws its size, kind, seed and move, and none is refused
// after them (the last column of cells stands where its largest tussock, moved its farthest, keeps 0.4 m off the
// wall's foot). BARE GROUND is left only where moorWorn says: the trodden TRACK along the axis
// (2.2 m to either hand, wandering under a metre: no plant's edge nearer the axis than 2 m) and WORN
// PATCHES of dark peat by a noise of place (0.118 of the strip's ground, counted on a lattice of 0.25 m).
// All of it is true geometry in a mesh of its own (the things' material).
export const MOOR_CLOTH = { back: 4, reach: 40, cell: 2.6, cellNear: 2.0, inner: 9.1, track: 2.2, wall: 3, worn: 0.5, keep: 0.45, fine: 15, gorseFull: 30, gorseHalf: 48,
  spray: { near: 6, far: 12, n: [64, 24], len: [0.35, 0.7], wide: [0.05, 0.09], axis: 2, top: 1.58 } };
// (a place's metres across the track's middle, which wanders under a metre about the axis; the worn patches' figure)
export const moorTrackOff = (x, z) => z - PLAN.gateZ - 0.55 * Math.sin(x * 0.19) - 0.3 * Math.sin(x * 0.47 + 1.3);
export const moorPatch = (x, z) => sstep(0.66, 0.76, 0.7 * vnoise(x * 0.21 + 3.1, z * 0.21 + 7.7) + 0.3 * vnoise(x * 0.55 + 11.0, z * 0.55 + 5.0));
export function moorWorn(x, z) {
  return Math.max(sstep(MOOR_CLOTH.track + 0.5, MOOR_CLOTH.track - 0.7, Math.abs(moorTrackOff(x, z))), moorPatch(x, z));
}
export function layMoorCloth(rng, heightAt, moor) {
  const C = MOOR_CLOTH, P = PLAN, x0 = P.start[0] - C.back, x1 = P.boundaryX - P.boundaryT / 2 - C.wall, out = { hummocks: [], tussocks: [] };
  const taken = [];
  for (const [list, k] of [[moor.gorse, 0.85], [moor.rocks, 0.9], [moor.heather, 0.7], [moor.tussocks, 0.6]]) for (const p of list) if (p.x > x0 - 8 && p.d < C.reach + 8) taken.push([p.x, p.z, p.r * k]);
  for (const p of moor.broom) if (p.x > x0 - 8 && p.d < C.reach + 8) taken.push([p.x, p.z, 1.2]);
  for (const [d0, d1, cell, near] of [[0, C.inner, C.cellNear, true], [C.inner, C.reach, C.cell, false]]) for (const side of [-1, 1])
  for (let x = x0 + cell / 2; x + 0.35 * cell + 0.6 * 1.2 <= x1 + C.wall - 0.4; x += cell) for (let d = d0 + cell / 2; d < d1; d += cell) {
    const cz = P.gateZ + side * d;
    if (moorWorn(x, cz) > C.worn || taken.some((q) => Math.hypot(q[0] - x, q[1] - cz) < q[2] + C.keep)) continue;
    const px = x + rng.range(-0.35, 0.35) * cell, kind = rng(), size = rng(), seed = rng.range(0, 60);
    let pz = P.gateZ + side * (d + rng.range(-0.35, 0.35) * cell);
    const rh = near ? 0.9 + 0.6 * size : 1.25 + size * (Math.abs(pz - P.gateZ) < 11 ? 0.75 : 1);
    const hum = kind < 0.68 && px + rh <= x1, r = hum ? rh : 0.5 + 0.7 * size;   // (nothing but rough grass within 3 m of the wall's face)
    if (Math.abs(pz - P.gateZ) < r + 2) pz = P.gateZ + side * (r + 2);       // (its edge 2 m and more from the axis)
    (hum ? out.hummocks : out.tussocks).push({ x: px, y: heightAt(px, pz), z: pz, r, h: hum ? (near ? 0.45 + 0.4 * ((seed * 7.3) % 1) : 0.55 + 0.55 * ((seed * 7.3) % 1)) : 0.7 + 0.8 * size, d: Math.abs(pz - P.gateZ), seed });
  }
  return out;
}
// THE MOOR'S NEAR FORM IN TRUE GEOMETRY (G10b): one mesh of the things' material, laid from streams of its own.
//  GORSE: every bush whose edge stands within MOOR_CLOTH.gorseFull m of the flown line bears SPIKY SPRAYS all over
//   each lobe of its body (260 on the first lobe, 130 on each other; half as many out to gorseHalf m and on a bush
//   that stands wholly west of the clothed strip, behind the line's start; none beyond gorseHalf):
//   a spray is a three-sided point 0.55 to 1.1 m long standing out of the body and up, dark green from its foot, the
//   flower massed at its end (three sprays in four flower). Its tip keeps the gorse's own distance from the entry's
//   axis: 8 m west of x -96, 6.5 m east of it (a spray is shortened to that, or not built).
//  HEATHER: every hummock of the clothing, and every mound of the moor's own deal that stands in the clothed strip,
//   bears SPRIGS standing out of its top and edge (40 within MOOR_CLOTH.fine m of the axis, 14 beyond; 40 on a dealt
//   mound): three-sided points 0.2 to 0.45 m long, brown at the foot; of the tips three in ten are pale old bloom,
//   three in twenty bleached, the rest wine, russet or dull purple. No tip stands over 1.6 m above the ground.
//   (G11) SPRAYS BREAK ITS OUTLINE BY THE LINE: every hummock and dealt mound whose edge stands within
//   MOOR_CLOTH.spray.near m of the flown line bears 64 twiggy sprays more, and 24 out to spray.far m, standing OUT of
//   its flank and crown all round (three-sided points 0.35 to 0.7 m long, dark at the foot, the heather's tones at
//   the end), from a stream of their own ('moor-sprays'). A spray's place on the body is drawn first; where its foot
//   lies nearer the axis than the plants' own 2 m, or the least spray would not keep that or the 1.58 m of height,
//   none is dealt; a longer one is dealt no longer than they allow.
//  TUSSOCKS: a low thatch and eight to eleven blades of bleached grass, 0.5 to 1.9 m long, of three sizes.
const MOOR_TONES = { sprig: [[0.09, 0.06, 0.05], [0.26, 0.12, 0.15], [0.3, 0.17, 0.1], [0.2, 0.12, 0.2], [0.52, 0.38, 0.44], [0.52, 0.46, 0.36]], gorse: [[0.04, 0.07, 0.03], [0.13, 0.2, 0.075]], blade: [[0.2, 0.15, 0.07], [0.62, 0.5, 0.27], [0.74, 0.64, 0.4]] };
async function moorNear(TM, moor, stream, yieldNow) {
  const C = MOOR_CLOTH, P = PLAN, TAU = Math.PI * 2, M = MOOR_TONES, cloth = moor.cloth || { hummocks: [], tussocks: [] };
  const tone = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
  let done = 0, tris = 0;
  const breathe = async (per = 0.0013) => { if (yieldNow && ++done % 3 === 0) { const n = TM.count(), w = (n - tris) * per; tris = n; await yieldNow(w); } };
  // the blob's own surface factor toward (dx, cy, dz) (T.blob's noise, without its jag)
  const skin = (seed, dx, cy, dz) => 0.72 + 0.56 * vnoise(seed + dx * 1.7 + cy * 1.3, seed * 0.7 + dz * 1.7 - cy);
  const rg = stream('moor-gorse');
  for (const p of moor.gorse) {
    const off = lineOff(p.x, p.z) - p.r;
    if (off >= C.gorseHalf) continue;
    const lobes = 2 + Math.floor(p.seed % 2), share = (off < C.gorseFull ? 1 : 0.5) * (p.x + p.r < P.start[0] - C.back ? 0.5 : 1);
    for (let j = 0; j < lobes; j++) {
      const a0 = p.seed * 1.7 + j * 2.3, o = j === 0 ? 0 : p.r * 0.55, sc = j === 0 ? 1 : 0.7, seed = p.seed + j * 7.3;
      const cx = p.x + Math.cos(a0) * o, cy0 = p.y + p.h * 0.42 * sc, cz = p.z + Math.sin(a0) * o, rr = p.r * 0.8 * sc, hh = p.h * 0.6 * sc;
      for (let k = 0, n = Math.round((j === 0 ? 260 : 130) * share); k < n; k++) {
        const a = rg.range(0, TAU), sy = rg.range(-0.3, 1), cr = Math.sqrt(1 - sy * sy), dx = Math.cos(a) * cr, dz = Math.sin(a) * cr;
        const ks = 0.9 * skin(seed, dx, sy, dz), base = [cx + dx * rr * ks, cy0 + sy * hh * ks, cz + dz * rr * ks], dir = v3.norm([dx * 0.75, sy * 0.75 + 0.55, dz * 0.75]);
        const lim = base[0] < MOOR_ENTRY.x ? MOOR_ENTRY.clear : 6.5, side = base[2] < P.gateZ ? -1 : 1, room = (base[2] - P.gateZ) * side - lim;
        // (G11: its place on the lobe first; a spray whose foot is too near the axis or under the ground, or whose
        // room toward the axis is under 0.3 m, has drawn its place only: the least spray dealt is 0.5 m)
        const toward = -dir[2] * side;
        if (room < 0.25 || base[1] < p.y - 0.1 || (toward > 1e-3 && room / toward < 0.3)) continue;
        const len0 = rg.range(0.55, 1.1) * (0.75 + 0.25 * sc), wide = rg.range(0.07, 0.125), turn = rg.range(0, TAU), fl = rg(), tn = rg.range(0.8, 1.25);
        const len = toward > 1e-3 ? Math.min(len0, room / toward) : len0;
        TM.spike(base, v3.add(base, dir, len), wide, turn, tone(M.gorse[0], tn), tone(M.gorse[1], tn), 19, v3.norm([dx, sy * 1.2, dz]), fl < 0.75 ? 0.5 + 0.5 * rg() : 0);
      }
      await breathe(0.0019);
    }
  }
  const rs = stream('moor-sprigs');
  const sprigs = (p, n, seed) => {
    const rz = p.r * (0.8 + 0.4 * (p.seed % 1)), cy0 = p.y + p.h * 0.1, top = p.y + 1.58;
    for (let k = 0; k < n; k++) {
      const a = rs.range(0, TAU), q = 0.25 + 0.75 * Math.sqrt(rs()), up = Math.sqrt(Math.max(0, 1 - q * q)), len = rs.range(0.2, 0.45);
      const dx = Math.cos(a) * q, dz = Math.sin(a) * q, ks = 0.93 * skin(seed, dx, up, dz), base = [p.x + dx * p.r * ks, cy0 + up * p.h * 0.8 * ks, p.z + dz * rz * ks];
      const dir = v3.norm([dx * 0.7, 0.55 + up, dz * 0.7]), tip = v3.add(base, dir, len);
      if (tip[1] > top) continue;                       // (its place and length first: a sprig refused for its height draws no more)
      const wide = rs.range(0.045, 0.08), turn = rs.range(0, TAU), t = rs(), tn = rs.range(0.8, 1.25);
      TM.spike(base, tip, wide, turn, tone(M.sprig[0], tn), tone(M.sprig[t < 0.3 ? 4 : t < 0.45 ? 5 : 1 + Math.floor(3 * ((t * 7.3) % 1))], tn), 20, v3.norm([dx, 0.4 + up, dz]));
    }
  };
  const ry = stream('moor-sprays'), Y = C.spray;
  const sprays = (p, seed) => {
    const off = lineOff(p.x, p.z) - p.r, n = off < Y.near ? Y.n[0] : off < Y.far ? Y.n[1] : 0;
    const rz = p.r * (0.8 + 0.4 * (p.seed % 1)), cy0 = p.y + p.h * 0.1, top = p.y + Y.top, side = p.z < P.gateZ ? -1 : 1;
    for (let k = 0; k < n; k++) {
      const a = ry.range(0, TAU), up = ry.range(0.05, 0.92), q = Math.sqrt(1 - up * up), dx = Math.cos(a) * q, dz = Math.sin(a) * q;
      const ks = 0.9 * skin(seed, dx, up, dz), base = [p.x + dx * p.r * ks, cy0 + up * p.h * 0.8 * ks, p.z + dz * rz * ks], dir = v3.norm([dx * 0.9, 0.3 + 0.7 * up, dz * 0.9]);
      const room = (base[2] - P.gateZ) * side - Y.axis, toward = -dir[2] * side, most = Math.min(toward > 1e-3 ? room / toward : 9, (top - base[1]) / dir[1]);
      if (room < 0 || most < Y.len[0]) continue;
      const len = Math.min(ry.range(Y.len[0], Y.len[1]), most), wide = ry.range(Y.wide[0], Y.wide[1]), turn = ry.range(0, TAU), t = ry(), tn = ry.range(0.8, 1.25);
      TM.spike(base, v3.add(base, dir, len), wide, turn, tone(M.sprig[0], tn), tone(M.sprig[t < 0.3 ? 4 : t < 0.45 ? 5 : 1 + Math.floor(3 * ((t * 7.3) % 1))], tn), 20, v3.norm([dx, 0.4 + up, dz]));
    }
  };
  const mixHex = (a, b, t) => '#' + new THREE.Color(a).lerp(new THREE.Color(b), t).getHexString();
  for (const p of cloth.hummocks) {
    const fine = p.d < C.fine, wine = (p.seed * 3.7) % 1;
    TM.blob([p.x, p.y + p.h * 0.1, p.z], [p.r, p.h * 0.8, p.r * (0.8 + 0.4 * (p.seed % 1))], mixHex('#4f3f3a', '#54424a', wine), mixHex('#6b5450', '#665060', wine), p.seed, fine ? 9 : 7, fine ? 3 : 2, 12, 0.3);
    sprigs(p, fine ? 40 : 14, p.seed);
    sprays(p, p.seed);
    await breathe();
  }
  const x0 = P.start[0] - C.back - 2;
  for (const p of moor.heather) if (p.x > x0 && p.d < C.reach) { sprigs(p, 40, p.seed); sprays(p, p.seed); await breathe(); }
  const rb = stream('moor-blades');
  const blades = (p, n, thatch) => {
    if (thatch) TM.blob([p.x, p.y + p.h * 0.06, p.z], [p.r * 0.8, p.h * 0.4, p.r * 0.8], '#75684a', '#c2b17c', p.seed, 6, 2, 6);
    for (let k = 0; k < n; k++) {
      const a = TAU * (k + rb.range(-0.35, 0.35)) / n, lean = rb.range(0.2, 0.65), len = p.h * rb.range(0.75, 1.3), q = rb.range(0.1, 0.45);
      const base = [p.x + Math.cos(a) * q * p.r, p.y - 0.05, p.z + Math.sin(a) * q * p.r], dir = v3.norm([Math.cos(a) * lean, 1, Math.sin(a) * lean]);
      if (Math.abs(base[2] + dir[2] * len - P.gateZ) < 2) continue;   // (its place, lean and length first)
      const wide = rb.range(0.07, 0.13), tn = rb.range(0.85, 1.2), pale = rb();
      TM.spike(base, v3.add(base, dir, len), wide, rb.range(0, TAU), tone(M.blade[0], tn), tone(M.blade[pale < 0.4 ? 2 : 1], tn), 20, v3.norm([Math.cos(a) * 0.5, 1, Math.sin(a) * 0.5]));
    }
  };
  for (const p of cloth.tussocks) { blades(p, 8 + Math.floor(3.99 * ((p.seed * 5.1) % 1)), true); await breathe(); }
  for (const p of moor.tussocks) if (p.x > x0 && p.d < C.reach) { blades(p, 6, false); await breathe(); }
}

// THE MOOR'S FLOOR BESIDE THE LINE (G10b, point 5 c): a sheet of its own over the ground of the clothed strip, lying
// on the ground's own height, drawn by place at its own scales; it gives way to the ground's own colour over the
// last MOOR_FLOOR.fade m of its rim, over 6 m behind the clothing's west end, and over the 2.4 m east of the
// boundary wall's west face (under the wall; in the gateway, into the worn way). Laid on a lattice of 1.05 m within
// MOOR_FLOOR.fine m of the axis and 3 m beyond; each point carries the ground's own colour there (the world's
// groundColor), the worn patches' figure and its place across the track (moorWorn's two parts).
//  THATCH between the plants: dead grass lying matted in two crossed lays (streaks of 0.6 by 0.13 m and of 0.67 by
//   0.14 m) and lying stalks of 0.3 by 0.04 m: light straw where they lie thick, dark litter between (cut about
//   the middle of the three together, so half the ground is straw), lighter and darker in patches of half a metre;
//   each of these goes to its middle (0.5) from 0.35 to 1 of itself in a pixel's span, and the thatch to
//   (0.81, 0.78, 0.75) of the ground's colour, which is its mean.
//  PEAT in the worn patches: dark, in clods of 0.2 m with crumbs of 0.07 m; its edge ragged at 0.33 and 0.11 m (the
//   raggedness sums to nothing).
//  THE TRACK along the axis, 2.1 m to either hand: trodden earth, paler than the peat; two wheel ruts 0.8 m to
//   either hand of its middle, 0.26 m wide, darker; thatch again on its crown between the ruts.
//  SMALL STONES on peat and track: one cell of 0.45 m in four bears one, 0.06 to 0.14 m in radius, pale grey with a
//   darker foot: 0.038 of that ground (0.25 times the stones' mean area in a cell); from 0.35 to 1 of 0.2 m in a
//   pixel's span they give way to that share of their colour.
export const MOOR_FLOOR = { west: 6, fade: 6, fine: 16, lift: 0.07 };
export function buildMoorFloor(heightAt, groundColor, clock = makeClock()) {
  const C = MOOR_CLOTH, F = MOOR_FLOOR, P = PLAN, xw = P.start[0] - C.back - F.west, xf = P.boundaryX - P.boundaryT / 2, xe = xf + 2.6, zr = C.reach + F.fade;
  const xs = [], zs = [], pos = [], ma = [], mc = [], idx = [], col = new THREE.Color();
  for (let i = 0, n = Math.round((xe - xw) / 1.05); i <= n; i++) xs.push(xw + (xe - xw) * i / n);
  for (let z = -zr; z < -F.fine; z += 3) zs.push(P.gateZ + z);
  for (let z = -F.fine; z < F.fine; z += 1) zs.push(P.gateZ + z);
  for (let z = F.fine; z <= zr + 0.01; z += 3) zs.push(P.gateZ + z);
  for (const x of xs) for (const z of zs) {
    const y = heightAt(x, z);
    groundColor(x, z, y, 1, col, 0);
    pos.push(x, y + F.lift, z); mc.push(col.r, col.g, col.b);
    ma.push(moorPatch(x, z), moorTrackOff(x, z), sstep(xw, xw + F.west, x) * sstep(xe, xf + 0.2, x) * sstep(zr, zr - F.fade, Math.abs(z - P.gateZ)));
  }
  const nz = zs.length;
  for (let i = 0; i + 1 < xs.length; i++) for (let j = 0; j + 1 < nz; j++) { const a = i * nz + j, b = a + nz; idx.push(a, a + 1, b + 1, a, b + 1, b); }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(new Float32Array(pos.length).map((v, i) => (i % 3 === 1 ? 1 : 0)), 3));
  geometry.setAttribute('ma', new THREE.Float32BufferAttribute(ma, 3));
  geometry.setAttribute('mc', new THREE.Float32BufferAttribute(mc, 3));
  geometry.setIndex(idx); geometry.computeBoundingSphere();
  const material = drawnMaterial({
    key: 'garden-moor-floor-1', vary: { ma: 'vec3', mc: 'vec3' }, uniforms: { ...clock }, head: SHADE_GLSL,
    color: /* glsl */`
      vec2 mp = v_wp.xz; float mfw = max(length(dFdx(mp)), length(dFdy(mp)));
      float m3 = 1.0 - smoothstep(0.35, 1.0, mfw * 3.0), m5 = 1.0 - smoothstep(0.35, 1.0, mfw * 5.0), m9 = 1.0 - smoothstep(0.35, 1.0, mfw * 9.0), m14 = 1.0 - smoothstep(0.35, 1.0, mfw * 14.0);
      float mrag = 0.3 * (gvNoise(mp * 3.0 + 5.0) - 0.5) * m3 + 0.16 * (gvNoise(mp * 9.0 + 2.0) - 0.5) * m9;
      float mworn = smoothstep(0.42, 0.58, v_ma.x + mrag);
      float mto = abs(v_ma.y), mtrack = 1.0 - smoothstep(1.95, 2.25, mto + 0.8 * mrag);
      float mrut = (1.0 - smoothstep(0.09, 0.17, abs(mto - 0.8) + 0.25 * mrag)) * mtrack, mcrown = (1.0 - smoothstep(0.3, 0.55, mto + 0.6 * mrag)) * mtrack;
      vec2 mq = mat2(0.8, 0.6, -0.6, 0.8) * mp;
      float mstalk = mix(0.5, gvNoise(mq * vec2(3.3, 25.0) + 3.0), 1.0 - smoothstep(0.35, 1.0, mfw * 25.0));
      vec2 mq2 = mat2(0.5, 0.866, -0.866, 0.5) * mp;
      float mlay = mix(0.5, gvNoise(mq * vec2(1.7, 8.0) + 1.0), 1.0 - smoothstep(0.35, 1.0, mfw * 8.0)), mlay2 = mix(0.5, gvNoise(mq2 * vec2(7.0, 1.5) + 6.0), 1.0 - smoothstep(0.35, 1.0, mfw * 7.0));
      float mdark = mix(0.5, smoothstep(0.3, 0.7, gvNoise(mp * 1.9 + 3.0)), 1.0 - smoothstep(0.35, 1.0, mfw * 1.9));
      float mstraw = smoothstep(0.25, 0.75, 0.6 * mlay + 0.4 * mlay2 + 0.5 * (mstalk - 0.5));
      vec3 mthatch = v_mc * mix(vec3(0.5, 0.44, 0.38), vec3(1.12), mstraw) * (0.92 + 0.16 * mdark);
      float mclod = mix(0.5, smoothstep(0.25, 0.75, gvNoise(mq * 5.0 + 9.0)), m5), mcrumb = mix(0.5, gvNoise(mp * 14.0 + 7.0), m14);
      vec3 mpeat = vec3(0.13, 0.095, 0.075) * (0.62 + 0.5 * mclod + 0.26 * mcrumb);
      vec3 mtrod = vec3(0.3, 0.235, 0.165) * (0.74 + 0.3 * mclod + 0.22 * mcrumb);
      vec3 mbare = mix(mpeat, mix(mtrod, mpeat * 1.25, mrut), mtrack);
      float mbareK = max(mworn, mtrack * (1.0 - 0.85 * mcrown));
      vec2 sq = mp / 0.45, si = floor(sq);
      float sr = 0.13 + 0.18 * gmHash(si + 7.0), sd = length(fract(sq) - 0.5 - (vec2(gmHash(si + 11.0), gmHash(si + 17.0)) - 0.5) * 0.5);
      float mstone = step(0.75, gmHash(si + 3.0)) * (1.0 - smoothstep(sr - 0.06, sr, sd));
      vec3 mstoneC = vec3(0.4, 0.385, 0.35) * (0.8 + 0.4 * gmHash(si + 23.0)) * (0.72 + 0.28 * smoothstep(-0.3, 0.3, (fract(sq).y - 0.5) / max(sr, 0.01)));
      mbare = mix(mbare, mix(vec3(0.4, 0.385, 0.35) * 0.86, mstoneC, 1.0 - smoothstep(0.35, 1.0, mfw / 0.2)), mix(0.038, mstone, 1.0 - smoothstep(0.35, 1.0, mfw / 0.2)));
      diffuseColor.rgb = gShade(mix(mthatch, mbare, mbareK), 1.0);
      diffuseColor.a = v_ma.z;`,
    extra: { transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 },
  });
  const object = new THREE.Mesh(geometry, material);
  object.name = 'garden-moor-floor';
  return { object, geometry, material, triangles: idx.length / 3 };
}

// THE WOOD'S EDGE beyond the orchard, beyond the kitchen garden and beyond the garden's far wall: where its trees stand
// (by the seed's stream along fixed rows, on the hillside's own height). One in five is a dark evergreen; the rest are
// bare. `face` is the hand a tree shows to the grounds.
export function layFarWood(rng, heightAt) {
  const out = [];
  // THE PLAN'S RULE OF THE EVERGREENS (G11): the far wood bears no evergreen beyond the garden's east wall, nor on
  // the south side east of the yew's westmost end (the outer corner of its right wing at the alcove's mouth): bare
  // crowns only stand behind the last lawn. A tree there takes no evergreen draw.
  const yewWest = alcoveFrame().at(-PLAN.alcove.mouthToRing, -(FAR.yew.wing + FAR.yew.half));
  const bare = (x, z) => x > PLAN.garden.x1 || (x > yewWest[0] && z > yewWest[1]);
  const row = (x0, z0, x1, z1, n, depth, face) => {
    for (let i = 0; i < n; i++) {
      const t = (i + rng.range(0.1, 0.9)) / n, x = x0 + (x1 - x0) * t + rng.range(-3, 3), z = z0 + (z1 - z0) * t + depth * rng();
      out.push({ x, y: heightAt(x, z), z, H: rng.range(17, 26), w: rng.range(0.32, 0.42), ever: !bare(x, z) && rng.chance(0.2), face, seed: rng.range(0, 50) });
    }
  };
  row(-100, 82, 215, 80, 20, 10, [0, 0, -1]); row(-90, 100, 215, 98, 10, 14, [0, 0, -1]);       // south
  row(-100, -82, 215, -80, 20, -10, [0, 0, 1]); row(-90, -100, 215, -98, 10, -14, [0, 0, 1]);   // north
  row(206, -70, 206, 70, 9, 10, [-1, 0, 0]); row(224, -60, 224, 60, 4, 10, [-1, 0, 0]);         // east
  return out;
}
// the evergreens of the wood's edge: clustered forms with broken tops on their trunks (in the things mesh)
function farWood(T, far) {
  T.at(null);
  for (const t of far) {
    if (!t.ever) continue;
    const w = t.H * t.w, parts = [[0, 0.5, 0.62, 0.2], [0.42, 0.64, 0.42, 0.17], [0.36, 0.74, 0.34, 0.15], [0.14, 0.9, 0.24, 0.16]];
    T.place(t.x, t.y - 0.5, t.z); T.lathe([[0.9, 0], [0.6, t.H * 0.5]], 5, '#4a3a33', 0); T.at(null);
    parts.forEach(([d, h, r, ry], k) => {
      const a = t.seed * 3.7 + k * 2.4;
      if (t.x < 24) T.blob([t.x + Math.cos(a) * d * w, t.y + t.H * h, t.z + Math.sin(a) * d * w], [w * r, t.H * ry, w * r], '#27382c', k === 3 ? '#4d6a44' : '#3f5a40', t.seed + k * 3.1, 9, 5, 15);
      else T.blob([t.x + Math.cos(a) * d * w, t.y + t.H * h, t.z + Math.sin(a) * d * w], [w * r, t.H * ry, w * r], '#30463a', k === 3 ? '#5f7d50' : '#4b6a4e', t.seed + k * 3.1, 6, 3);
    });
  }
}
// the bare trees of the wood's edge (in the wood mesh): a trunk, five boughs, and large sprays of drawn twigs that at
// their distance read as the fine grey-brown mass of a winter crown; each spray stirs a little on its own phase
function farTrees(M, far, rng, litAt) {
  const TAU = Math.PI * 2;
  for (const t of far) {
    if (t.ever) continue;
    const H = t.H, fork = [t.x + rng.range(-0.04, 0.04) * H, t.y + 0.36 * H, t.z + rng.range(-0.04, 0.04) * H], N = t.face;
    M.tube([[t.x, t.y - 0.5, t.z], fork], 0.03 * H, 0.022 * H, 5, rng(), litAt);
    for (let b = 0; b < 5; b++) {
      const az = TAU * (b + rng.range(-0.3, 0.3)) / 5, up = rng.range(0.55, 1.1), len = rng.range(0.34, 0.46) * H, pts = [fork];
      for (let k = 1; k <= 3; k++) {
        const s = len * k / 3, c = Math.cos(up + 0.12 * k);
        pts.push([fork[0] + Math.cos(az) * c * s, fork[1] + Math.sin(up + 0.12 * k) * s, fork[2] + Math.sin(az) * c * s]);
      }
      M.ribbon(pts, 0.03 * H, 0.009 * H, N, rng(), litAt);
      for (let k = 1; k <= 3; k++) {
        const p = pts[k], o = pts[k - 1], d = v3.norm(v3.add(p, o, -1));
        const T = v3.norm([d[0] + rng.range(-0.5, 0.5), d[1] + rng.range(0, 0.6), d[2] + rng.range(-0.5, 0.5)]);
        const S = v3.norm(v3.cross(T, v3.norm([N[0] + rng.range(-0.4, 0.4), 0.25, N[2] + rng.range(-0.4, 0.4)]))), NN = v3.cross(S, T);
        const NL = t.z > 70 && t.x < 24 ? v3.norm([NN[0] + 1.4 * SUN_N[0], NN[1] + 1.4 * SUN_N[1], NN[2] + 1.4 * SUN_N[2]]) : NN;
        M.leaf(o, T, S, NL, rng.range(0.14, 0.2) * H, rng(), litAt(p), { piv: o, w: 1, ph: rng.range(0, TAU), om: rng.range(0.7, 1.4), amp: rng.range(0.01, 0.02) }, 3);
      }
    }
  }
}

// every made thing of the outside in one mesh: the leaf, the walk's things, the kitchen garden's beds, the wood's edge
// ---------------------------------------------------------------- the middle's made things (in the things' one mesh)
// THE BED of black earth where the fork stands: an oval lying along the flown line, its edge ragged
export const BED = { a: 3.3, b: 2.0, az: -0.7 };
export function bedRo(fork, x, z) {
  const c = Math.cos(BED.az), sn = Math.sin(BED.az), dx = x - fork[0], dz = z - fork[1];
  return Math.hypot((dx * c + dz * sn) / BED.a, (dz * c - dx * sn) / BED.b) * (0.85 + 0.3 * vnoise(x * 0.7 + 3, z * 0.7));
}
// where the long grass gives way: the dial's steps, the bed
export function middleClear(fork) {
  const D = PLAN.dial;
  return (x, z) => sstep(4.3, 5.3, Math.hypot(x - D[0], z - D[1])) * sstep(0.85, 1.2, bedRo(fork, x, z));
}
// what of the middle casts a long shadow beside the trees: the bushes (from x 34 on, growing in), the dial; the pool of
// sun on the chair; then the chair's and the fork's own small shadows in it
export function middleCasters(o) {
  const D = PLAN.dial, h = o.heightAt, yd = h(D[0], D[1]), forms = [], C = o.chair, K = o.fork, yc = h(C[0], C[1]), yk = h(K[0], K[1]);
  for (const m of o.mounds) { const k = sstep(34, 46, m.x), y = h(m.x, m.z); if (k > 0) forms.push([[m.x, y + 0.2 * m.H, m.z], [m.x, y + 0.72 * m.H, m.z], 0.8 * m.R, 0.55 * m.R, 0.55 * k]); }
  forms.push([[D[0], yd + 0.3, D[1]], [D[0], yd + 1.2, D[1]], 4.3, 2.7, 0.8], [[D[0], yd + 1.2, D[1]], [D[0], yd + 5.5, D[1]], 0.8, 0.9, 1]);
  return { forms, pools: [[C[0], C[1], 2.4, 4.2]], late: [[[C[0], yc + 0.8, C[1]], [C[0], yc + 3.3, C[1]], 1.25, 1.0, 0.8], [[K[0], yk, K[1]], [K[0], yk + 3.3, K[1]], 0.14, 0.24, 0.8]] };
}
// THE DIAL: old grey stone on three worn round steps 9 m across, a turned pedestal, a green bronze plate with its
// gnomon to the north and nine hour lines (nothing lettered); moss in the steps' angles, lichen on the stone
function dialThing(T, y0) {
  const D = PLAN.dial, c = new THREE.Color(), stone = new THREE.Color('#8d8b84'), moss = new THREE.Color('#5a6a38'), lichen = new THREE.Color('#b5ae8c'), dark = new THREE.Color('#5f5e5a'), TAU = Math.PI * 2;
  const tone = (x, z, k) => {
    c.copy(stone).lerp(dark, 0.5 * vnoise(x * 0.4, z * 0.4 + k)).lerp(moss, 0.5 * sstep(0.45, 0.8, vnoise(x * 0.35 + k * 7, z * 0.35))).lerp(lichen, 0.4 * sstep(0.55, 0.85, vnoise(x * 0.8 + 11, z * 0.8 + k)));
    return '#' + c.getHexString();
  };
  T.place(D[0], y0, D[1]);
  const N = 22, R = [4.5, 3.55, 2.6], top = [0.42, 0.84, 1.26];
  for (let k = 0; k < 3; k++) for (let i = 0; i < N; i++) {
    const a0 = TAU * i / N, a1 = TAU * (i + 1) / N, am = (a0 + a1) / 2, r0 = R[k], r1 = k < 2 ? R[k + 1] : 0.9, w = (a) => 1 + 0.02 * Math.sin(a * 5 + k * 2);
    const p = (r, a, y) => [Math.cos(a) * r * w(a), y, Math.sin(a) * r * w(a)], y1 = top[k] - 0.05 * vnoise(i * 1.7, k * 3.1), yb = k ? top[k - 1] - 0.1 : -0.9;
    T.quad(p(r0, a0, yb), p(r0, a1, yb), p(r0 - 0.06, a1, y1), p(r0 - 0.06, a0, y1), [Math.cos(am), 0.15, Math.sin(am)], tone(Math.cos(am) * r0 * 3, Math.sin(am) * r0 * 3, k), 0);
    T.quad(p(r0 - 0.06, a0, y1), p(r0 - 0.06, a1, y1), p(r1, a1, y1), p(r1, a0, y1), [0, 1, 0], tone(Math.cos(am) * r0 * 2, Math.sin(am) * r0 * 2, k + 5), 0);
  }
  T.lathe([[1.05, 1.2], [1.05, 1.55], [0.8, 1.72], [0.62, 1.95]], 10, '#7b8068');
  T.lathe([[0.62, 1.95], [0.5, 2.5], [0.66, 3.3], [0.56, 4.0], [0.42, 4.7], [0.46, 5.0]], 10, '#8f8c84');
  T.lathe([[0.46, 5.0], [0.85, 5.25], [0.92, 5.45], [0, 5.45]], 10, '#a5a08a');
  T.lathe([[0.8, 5.45], [0.8, 5.53], [0, 5.53]], 12, '#6c8a78');
  T.quad([0, 5.53, 0.55], [0, 5.53, -0.5], [0, 6.3, -0.5], [0, 5.57, 0.55], [1, 0, 0], '#46564c', 0);
  for (let i = 0; i < 9; i++) {
    const a = -Math.PI / 2 + (i - 4) * 0.35, ca = Math.cos(a), sa = Math.sin(a), e = 0.02;
    T.quad([ca * 0.3 - sa * e, 5.536, sa * 0.3 + ca * e], [ca * 0.74 - sa * e, 5.536, sa * 0.74 + ca * e], [ca * 0.74 + sa * e, 5.536, sa * 0.74 - ca * e], [ca * 0.3 + sa * e, 5.536, sa * 0.3 - ca * e], [0, 1, 0], '#38443c', 0);
  }
  // (G7) fallen petals lying on the three treads, by a fixed rule of the place (the golden angle round the dial)
  for (let i = 0; i < 26; i++) {
    const k = i % 3, a = 0.4 + i * 2.39996, in0 = (k < 2 ? R[k + 1] : 1.25) + 0.16, out0 = R[k] - 0.3, r = in0 + (out0 - in0) * vnoise(i * 3.3, 7.7);
    const seg = ((Math.floor(a / TAU * N) % N) + N) % N, y = top[k] - 0.05 * vnoise(seg * 1.7, k * 3.1) + 0.012, x = Math.cos(a) * r, z = Math.sin(a) * r;
    const t = i * 1.9, l = 0.1 + 0.06 * vnoise(i * 5.1, 2.2), ca = Math.cos(t) * l, sa = Math.sin(t) * l;
    T.quad([x - ca, y, z - sa], [x + sa, y, z - ca], [x + ca, y, z + sa], [x - sa, y, z + ca], [0, 1, 0], i % 4 === 1 ? '#f6efe0' : '#f4d6d9', 0);
  }
  for (let i = 0; i < 5; i++) { const a = 0.9 + i * 1.37, k = i % 3, r = R[k] - (k < 2 ? 0 : 1.5) + 0.05; T.blob([Math.cos(a) * r, (k ? top[k - 1] : -0.05) + 0.08, Math.sin(a) * r], [0.55, 0.2, 0.42], '#3c4f25', '#6c873a', 3 + i * 5, 6, 3, 0); }
  T.at(null);
}
// THE WHEELED CHAIR, empty, of a plain make: a wooden seat and slatted back on two tall spoked wheels and a small one
// before, a footboard, a push rail behind; a cushion on the seat and one at the back, a rug laid over the seat and
// hanging off its front, fallen petals on it. It faces the garden's far end, its back to the door.
function chairThing(T, C, y0, rng) {
  const wood = '#8f6e4a', dark = '#6a5038', iron = '#454240', red = '#96483c', cream = '#d6c9ae', rug = '#4f6e78', band = '#c9a455', petal = '#f4d6d9';
  const M = new THREE.Matrix4().compose(new THREE.Vector3(C[0], y0 - 0.06, C[1]), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -0.47, 0.07, 'YXZ')), new THREE.Vector3(1, 1, 1));
  const wheel = (x, y, z, r, n) => {
    T.at(M.clone().multiply(new THREE.Matrix4().makeTranslation(x, y, z)).multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2)));
    T.lathe([[r - 0.11, -0.05], [r, -0.05], [r, 0.05], [r - 0.11, 0.05], [r - 0.11, -0.05]], 14, dark);
    T.lathe([[0, -0.13], [0.14, -0.1], [0.14, 0.1], [0, 0.13]], 6, iron);
    for (let i = 0; i < n; i++) { const a = Math.PI * 2 * i / n, ca = Math.cos(a), sa = Math.sin(a), e = 0.035; T.quad([ca * 0.1 - sa * e, 0, sa * 0.1 + ca * e], [ca * (r - 0.1) - sa * e, 0, sa * (r - 0.1) + ca * e], [ca * (r - 0.1) + sa * e, 0, sa * (r - 0.1) - ca * e], [ca * 0.1 + sa * e, 0, sa * 0.1 - ca * e], [0, 1, 0], wood, 0); }
  };
  wheel(-0.15, 1.05, 1.14, 1.05, 10); wheel(-0.15, 1.05, -1.14, 1.05, 10); wheel(1.3, 0.42, 0, 0.42, 6);
  T.at(M);
  T.box(-0.2, 0.98, -1.14, -0.1, 1.08, 1.14, iron);                                  // the axle
  T.box(-0.9, 1.6, -0.9, 0.85, 1.75, 0.9, wood, 1);                                  // the seat
  for (const z of [-0.9, 0.78]) { T.box(-1.02, 0.95, z, -0.88, 3.9, z + 0.12, dark, 1); T.box(0.7, 1.05, z, 0.84, 2.55, z + 0.12, dark, 1); T.box(-0.95, 2.55, z - 0.03, 0.9, 2.68, z + 0.15, wood, 1); }
  T.box(-1.04, 3.72, -0.9, -0.88, 3.92, 0.9, wood, 1);                               // the back's top rail and slats
  for (const z of [-0.62, -0.18, 0.26]) T.box(-0.99, 1.75, z, -0.92, 3.72, z + 0.36, wood, 1);
  T.box(-1.5, 3.42, -0.98, -1.4, 3.52, 0.98, dark, 1);                               // the push rail and its two arms
  for (const z of [-0.86, 0.76]) T.box(-1.45, 3.43, z, -1.0, 3.51, z + 0.1, dark, 1);
  for (const z of [-0.55, 0.47]) T.box(0.85, 0.62, z, 0.94, 1.62, z + 0.08, dark, 1);  // down to the footboard
  T.box(0.82, 0.54, -0.68, 1.75, 0.63, 0.68, wood, 1);
  T.box(1.24, 0.42, -0.1, 1.36, 0.56, 0.1, iron);
  T.box(-0.74, 1.75, -0.74, 0.78, 2.0, 0.74, red);                                   // the cushions
  T.box(-0.9, 1.98, -0.68, -0.62, 3.35, 0.68, cream);
  T.box(-0.5, 2.0, -0.62, 0.74, 2.13, 0.3, rug);                                     // the rug, folded, one end hanging
  T.quad([0.8, 2.12, -0.56], [0.8, 2.12, 0.24], [0.93, 0.95, 0.3], [0.93, 0.95, -0.5], [1, 0.1, 0], rug, 0);
  T.quad([0.74, 2.14, -0.62], [0.74, 2.14, 0.3], [0.5, 2.14, 0.3], [0.5, 2.14, -0.62], [0, 1, 0], band, 0);
  T.quad([0.925, 1.2, -0.5], [0.925, 1.2, 0.3], [0.945, 1.02, 0.3], [0.945, 1.02, -0.5], [1, 0.1, 0], band, 0);
  for (const [x, y, z] of [[0.1, 2.14, -0.3], [-0.3, 2.14, 0.1], [0.45, 2.15, 0.0], [0.2, 2.01, 0.55], [-0.55, 2.01, 0.5], [1.2, 0.64, 0.3], [1.5, 0.64, -0.35], [-0.2, 2.69, 0.84], [0.3, 2.14, -0.5]]) {
    const a = rng.range(0, 6.28), l = rng.range(0.11, 0.16), ca = Math.cos(a) * l, sa = Math.sin(a) * l;
    T.quad([x - ca, y, z - sa], [x + sa, y, z - ca], [x + ca, y, z + sa], [x - sa, y, z + ca], [0, 1, 0], petal, 0);
  }
  // (G7) seven more, by a fixed rule (no stream drawn): on the rug's band, the cushion, the seat's edge, the footboard
  [[0.6, 2.15, -0.1], [-0.1, 2.14, -0.55], [0.0, 2.01, 0.42], [-0.45, 2.01, 0.62], [1.05, 0.64, -0.1], [1.62, 0.64, 0.45], [-0.6, 1.76, -0.82]].forEach(([x, y, z], i) => {
    const a = 0.7 + i * 2.1, l = 0.11 + 0.008 * i, ca = Math.cos(a) * l, sa = Math.sin(a) * l;
    T.quad([x - ca, y, z - sa], [x + sa, y, z - ca], [x + ca, y, z + sa], [x - sa, y, z + ca], [0, 1, 0], i % 3 === 1 ? '#f6efe0' : petal, 0);
  });
  T.at(null);
}
// THE FORK AND THE TROWEL standing in their bed of black earth with green points, a few clay pots at its edge
function forkThing(T, K, hAt, rng) {
  const iron = '#3f3d3c', wood = '#b08c5c', c = new THREE.Color(), eA = new THREE.Color('#45362c'), eB = new THREE.Color('#665040'), rim = new THREE.Color('#6c5a43');
  const top = (x, z) => hAt(x, z) + 0.03 + 0.3 * sstep(1.05, 0.45, bedRo(K, x, z)) * (0.55 + 0.45 * vnoise(x * 1.3, z * 1.3));
  T.at(null);
  { // the turned earth: a fan of 24 spokes and 4 rings out to the bed's ragged edge, each face a clod with its own tilt
    const N = 24, rings = [0, 0.36, 0.66, 0.88, 1], cb = Math.cos(BED.az), sb = Math.sin(BED.az), P = [];
    for (let i = 0; i < N; i++) {
      const a = i * 6.2832 / N + (vnoise(i * 3.1, 7) - 0.5) * 0.12, u = Math.cos(a) * BED.a, w = Math.sin(a) * BED.b, dx = u * cb - w * sb, dz = u * sb + w * cb;
      let t = 1.05;
      for (let k = 0; k < 3; k++) t = 1.05 / (0.85 + 0.3 * vnoise((K[0] + dx * t) * 0.7 + 3, (K[1] + dz * t) * 0.7));
      t *= 0.9 + 0.26 * vnoise(i * 5.7, 2.3);
      P.push(rings.map((q) => { const x = K[0] + dx * t * q, z = K[1] + dz * t * q; return [x, top(x, z), z]; }));
    }
    for (let i = 0; i < N; i++) for (let k = 0; k < 4; k++) {
      const A = P[i][k], B = P[(i + 1) % N][k], C = P[(i + 1) % N][k + 1], D = P[i][k + 1], mx = (A[0] + C[0]) / 2, mz = (A[2] + C[2]) / 2;
      c.copy(eA).lerp(eB, vnoise(mx * 1.7, mz * 1.7)); if (k === 3) c.lerp(rim, 0.3 + 0.5 * vnoise(mx * 2.3 + 5, mz * 2.3));
      T.quad(A, B, C, D, v3.norm([(vnoise(mx * 2.9, mz * 2.9) - 0.5) * 0.7 - 0.12, 1, (vnoise(mx * 2.9 + 11, mz * 2.9) - 0.5) * 0.7 + 0.08]), '#' + c.getHexString(), 5);
    }
  }
  for (let k = 0; k < 16; k++) {                                                     // green points
    const a = rng.range(0, 6.28), r = rng.range(0.5, 2.6), x = K[0] + Math.cos(a) * r, z = K[1] + Math.sin(a) * r, w = 0.07;
    if (bedRo(K, x, z) > 0.9) continue;                                              // (its place first)
    const h = rng.range(0.3, 0.55);
    const y = top(x, z), tint = k % 3 ? '#a8cf7a' : '#7fb35a';
    T.quad([x - w, y, z], [x + w, y, z], [x + 0.02, y + h, z], [x - 0.02, y + h, z], [0, 0.3, 1], tint, 0);
    T.quad([x, y, z - w], [x, y, z + w], [x, y + h, z + 0.02], [x, y + h, z - 0.02], [1, 0.3, 0], tint, 0);
  }
  T.place(K[0], top(K[0], K[1]), K[1], 0.6, 0.07, -0.06);                            // the fork
  for (const x of [-0.27, -0.09, 0.09, 0.27]) T.box(x - 0.025, -0.5, -0.02, x + 0.025, 0.47, 0.02, iron, 2);
  T.box(-0.3, 0.45, -0.035, 0.3, 0.55, 0.035, iron, 2);
  T.lathe([[0.085, 0.55], [0.068, 1.0]], 6, iron, 2);
  T.lathe([[0.066, 1.0], [0.06, 2.72]], 6, wood);
  T.box(-0.22, 2.68, -0.045, 0.22, 2.76, 0.045, wood); T.box(-0.22, 3.2, -0.05, 0.22, 3.3, 0.05, wood); T.mark('fork', 0, 3.3, 0);
  T.box(-0.22, 2.7, -0.04, -0.15, 3.22, 0.04, wood); T.box(0.15, 2.7, -0.04, 0.22, 3.22, 0.04, wood);
  const tx = K[0] + 1.0, tz = K[1] + 0.55;
  T.place(tx, top(tx, tz), tz, 2.1, 0.22, 0.1);                                      // the trowel
  T.quad([-0.13, -0.3, 0], [0, -0.34, 0.04], [0, 0.36, 0.04], [-0.1, 0.36, 0], [-0.3, 0, 1], iron, 2);
  T.quad([0, -0.34, 0.04], [0.13, -0.3, 0], [0.1, 0.36, 0], [0, 0.36, 0.04], [0.3, 0, 1], iron, 2);
  T.box(-0.025, 0.36, 0.0, 0.025, 0.52, 0.04, iron, 2);
  T.lathe([[0.055, 0.5], [0.075, 0.74], [0.06, 1.0], [0, 1.03]], 6, wood);
  const pot = (x, z, r, h, ry, rz, lift) => {
    T.place(x, hAt(x, z) + lift, z, ry, 0, rz);
    T.lathe([[0.62 * r, 0], [r, 0.82 * h], [1.09 * r, 0.84 * h], [1.09 * r, h], [0.92 * r, h], [0.86 * r, 0.3 * h]], 9, '#b3623e', 3);
  };
  const ca = Math.cos(BED.az), sa = Math.sin(BED.az), at = (u, v) => [K[0] + ca * u - sa * v, K[1] + sa * u + ca * v];
  let p = at(2.3, 1.75); pot(p[0], p[1], 0.36, 0.64, 0, 0, 0.0); pot(p[0], p[1], 0.36, 0.64, 1, 0.05, 0.27);
  p = at(1.4, 2.2); pot(p[0], p[1], 0.3, 0.52, 2, 0, 0.0);
  p = at(3.0, 2.3); pot(p[0], p[1], 0.33, 0.6, 0.8, 1.42, 0.34);
  T.at(null);
}
// o = { sunAt, stream, route, heightAt, clock, moor, far, middle, yieldNow } (`stream`: the world's maker of a stream from the seed and a plain name; the border's things, the frames,
// the beds and the middle's things each deal from their own: 'things-border', 'things-frames', 'things-beds', 'things-middle')
export async function buildThings(o) {
  const T = makeThings(o.sunAt, o.clock), TG = makeThings(o.sunAt, o.clock, 'garden-things-14g', { transparent: true, depthWrite: false });
  doorLeaf(T);
  await walkThings(T, o, TG);
  if (o.far) farWood(T, o.far);
  if (o.yieldNow) await o.yieldNow(10);
  let moorNearMesh = null;
  if (o.moor) {
    await moorThings(T, o.moor, o.yieldNow);
    const TM = makeThings(o.sunAt, o.clock);          // the moor's near form in true geometry: a mesh of its own
    await moorNear(TM, o.moor, o.stream, o.yieldNow);
    if (o.yieldNow) await o.yieldNow(0);
    moorNearMesh = await TM.buildAsync('garden-moor-near', o.yieldNow);
    if (o.yieldNow) await o.yieldNow(5.5);
  }
  if (o.middle) {
    const D = PLAN.dial, C = o.middle.chair, rng = o.stream('things-middle');
    dialThing(T, o.heightAt(D[0], D[1]) + 0.05);
    chairThing(T, C, o.heightAt(C[0], C[1]), rng);
    forkThing(T, o.middle.fork, o.heightAt, rng);
    if (o.yieldNow) await o.yieldNow(5.5);
  }
  // (the bell glasses: drawn after the solid things, the walk's gravel and the shadows)
  const glass = TG.build('garden-bell-glass');
  glass.object.renderOrder = 2;
  const made = o.yieldNow ? await T.buildAsync('garden-things', o.yieldNow) : T.build('garden-things');   // (G11: its stores in breaths)
  return { ...made, glass, perch: T.perch, moorNear: moorNearMesh };
}

// ---------------------------------------------------------------- winter wood: trained fans, bare trees (one mesh)
// A fruit tree trained as a fan, bare, flat on the walk's north wall: a short trunk, nine to eleven ribs spread from
// straight up to nearly level on both hands, short spurs, and at every 1.6 m of rib a pale tie on an iron nail. The
// ribs are tied and stand; THE SPURS TREMBLE in the wind (G7), each about its own root, quick and small.
function fanTree(M, x, rng, litAt) {
  const zf = -PLAN.walkZ + 0.14, N = [0, 0, 1], top = PLAN.walkNorthH - 0.5;
  const zs = -PLAN.walkZ + 0.04, cast = (pts, w0, w1) => M.ribbon(pts.map((p) => [p[0] + 0.43, Math.max(0.03, p[1] - 0.24), zs]), w0 * 1.15, w1 * 1.15, N, 0.5, litAt, null, 11);
  const trunk = [[x, -0.1, zf], [x + rng.range(-0.1, 0.1), 1.5, zf]];
  M.ribbon(trunk, 0.44, 0.34, N, rng(), litAt);
  cast(trunk, 0.44, 0.34);
  const n = rng.int(9, 11);
  for (let i = 0; i < n; i++) {
    const a = (-80 + 160 * i / (n - 1) + rng.range(-5, 5)) * RAD, sa = Math.sin(a), ca = Math.cos(a);
    const len = Math.min(rng.range(5.6, 7.0), ca > 0.05 ? (top - 1.5) / ca : 99), pts = [];
    let bend = 0;
    for (let k = 0; k <= 8; k++) {
      const t = len * k / 8; bend += rng.range(-0.05, 0.05);
      pts.push([x + sa * t + ca * bend * t * 0.2, 1.5 + ca * t - sa * bend * t * 0.2, zf + 0.02 * (i % 3)]);
    }
    M.ribbon(pts, 0.2, 0.07, N, rng(), litAt);
    cast(pts, 0.2, 0.07);
    for (let k = 1; k < 8; k++) {
      const p = pts[k], side = (k + i) % 2 ? 1 : -1, b = a + side * rng.range(0.5, 0.75), sl = rng.range(0.5, 1.1);
      if (k % 2) {
        const spur = [p, [p[0] + Math.sin(b) * sl, Math.min(top, p[1] + Math.cos(b) * sl), p[2]]];
        const tk = hash2(Math.round(p[0] * 40), Math.round(p[1] * 40));
        M.ribbon(spur, 0.075, 0.04, N, rng(), litAt, (j) => (j ? { piv: p, w: 1, ph: tk * 6.2832, om: 5 + 4 * hash2(Math.round(p[1] * 40), Math.round(p[0] * 40)), amp: 0.03 } : M.still));
        cast(spur, 0.075, 0.04);
      } else {                                           // the tie across the rib, and its nail in the brick
        const tx = ca * 0.2, ty = -sa * 0.2;
        M.ribbon([[p[0] - tx, p[1] - ty, p[2] + 0.02], [p[0] + tx, p[1] + ty, p[2] + 0.02]], 0.075, 0.075, N, 0.5, litAt, null, 4);
        M.ribbon([[p[0] + tx, p[1] + ty - 0.05, p[2] + 0.03], [p[0] + tx, p[1] + ty + 0.05, p[2] + 0.03]], 0.1, 0.1, N, 0.5, litAt, null, 2);
      }
    }
  }
}

// A bare old fruit tree, H metres high: a leaning trunk to its fork, four or five spreading boughs with a kink in each,
// three branches on every bough, and sprays of bare twigs at the branches' ends and along them (each spray a card of
// drawn twigs). IN THE WIND (G7) the trunk stands and EVERY BOUGH SWINGS ABOUT THE FORK with its branches and its
// sprays, as one body on its own phase and its own period (3.2 to 5.8 s, by the fork's place and the bough's number:
// no draw of the stream), weightless at the fork and whole from 0.6 H out: a tip of a 12 m tree sways 0.15 m each
// way in a lull and 0.3 m in a gust's crest, and never more than 0.085 H (the leaf mesh's bound). No tree of this
// kind stands within 14 m of the line.
export function bareTree(M, x, y, z, H, rng, litAt, rec = null, top = null) {
  const TAU = Math.PI * 2, h = rng(), lean = [rng.range(-0.08, 0.08), rng.range(-0.08, 0.08)], fy = 0.26 * H;
  const fork = [x + lean[0] * fy, y + fy, z + lean[1] * fy];
  M.tube([[x, y - 0.3, z], [x + lean[0] * fy * 0.5, y + fy * 0.5, z + lean[1] * fy * 0.5], fork], 0.046 * H, 0.036 * H, 6, h, litAt);
  const nb = rng.int(4, 5), a0 = rng.range(0, TAU);
  let sw = null;
  const swAt = (p) => ({ piv: fork, w: Math.min(1, Math.pow(Math.hypot(p[0] - fork[0], p[1] - fork[1], p[2] - fork[2]) / (0.6 * H), 1.2)), ph: sw.ph, om: sw.om, amp: sw.amp });
  const spray = (p, dir, size) => {
    const T = v3.norm([dir[0] + rng.range(-0.4, 0.4), dir[1] + rng.range(-0.1, 0.5), dir[2] + rng.range(-0.4, 0.4)]);
    const S = v3.norm(v3.cross(T, v3.norm([rng.range(-1, 1), rng.range(0.2, 1), rng.range(-1, 1)]))), N = v3.cross(S, T);
    M.leaf(p, T, S, N, size, rng(), litAt(p), swAt(p), 3);         // (a spray rides its own bough's swing)
    if (rec) rec.push({ p, size });
  };
  const limb = (from, az, up, len, r0, r1, sides, segs) => {
    const pts = [from]; let p = from, u = up;
    for (let k = 1; k <= segs; k++) {
      az += rng.range(-0.28, 0.28); u = Math.max(0.05, Math.min(1.3, u + rng.range(-0.25, 0.3)));
      const st = len / segs, c = Math.cos(u);
      p = [p[0] + Math.cos(az) * c * st, p[1] + Math.sin(u) * st, p[2] + Math.sin(az) * c * st];
      pts.push(p);
    }
    M.tube(pts, r0, r1, sides, h, litAt, sw ? (i, q) => swAt(q) : null);
    if (rec) rec.push({ pts, r0, r1 });
    return pts;
  };
  for (let b = 0; b < nb; b++) {
    const az = a0 + TAU * (b + rng.range(-0.25, 0.25)) / nb, fi = Math.round(fork[0] * 9), fj = Math.round(fork[2] * 9);
    sw = { ph: TAU * hash2(fi + b * 37, fj), om: TAU / (3.2 + 2.6 * hash2(fj + b * 53, fi + 11)), amp: 0.03 + 0.016 * hash2(b * 71 + 5, fi) };
    const bough = limb(fork, az, rng.range(0.5, 0.95), rng.range(0.4, 0.5) * H, 0.024 * H, 0.009 * H, 5, 4);
    for (let k = 2; k <= 4; k++) {
      const at = bough[k], baz = az + rng.range(-1.2, 1.2);
      const br = limb(at, baz, rng.range(0.2, 0.9), rng.range(0.2, 0.3) * H, 0.0085 * H, 0.0035 * H, 3, 3);
      if (top && !(top.p && top.p[1] >= br[3][1])) { top.p = br[3]; top.sw = swAt(br[3]); top.r = 0.0035 * H; }
      for (let t = 1; t <= 3; t++) {
        const q = br[t], o = br[t - 1];
        spray(q, v3.norm(v3.add(q, o, -1)), rng.range(0.085, 0.12) * H);
      }
    }
  }
}
// THE TREES OF THE OUTSIDE, on the gardener's plan (WALK_PLAN: places typed, no seed moves one): five bare fruit trees
// in the kitchen garden beside its path and beds (their crowns stand over the walk's north wall), and the old orchard
// south of the low wall in its four rows of seven, the nearest row 10.5 m behind the wall. Each tree's height, lean
// and boughs are the seed's, the kitchen garden's and the orchard's each by a stream of its own.
async function outsideTrees(M, o, litAt) {
  const rk = o.stream('wood-kitchen'), ro = o.stream('wood-orchard'), O = WALK_PLAN.orchard;
  for (const [x, z] of WALK_PLAN.kitchen) bareTree(M, x, 0, z, rk.range(11.5, 14.5), rk, litAt, null, o.tops ? (o.tops[o.tops.length] = {}) : null);
  if (o.yieldNow) await o.yieldNow(8.5, 14.5);
  for (let r = 0; r < O.rows; r++) {
    for (let c = 0; c < O.cols; c++) bareTree(M, O.x0 + c * O.dx, 0, O.z0 + r * O.dz, ro.range(10.5, 14), ro, litAt, r < 2 ? o.casters : null);
    if (o.yieldNow && r % 2 === 1) await o.yieldNow(14.5, 14.5);
  }
}

// THE ROOKERY: beyond the orchard the wood's edge stands thicker and taller: by every tree of its southern rows that
// the walk sees, one tall old bare tree more (31 to 41 m), and in the forks of six in ten of them the rooks' nests of
// last year as dark knots of sticks (nothing flies there: the birds are the walk's own)
function rookWood(M, far, rng, litAt) {
  const TAU = Math.PI * 2, N = [0, 0, -1];
  for (const t of far) {
    if (!(t.z > 70 && t.x < 24)) continue;
    const H = rng.range(31, 41), x = t.x + rng.range(4, 8) * rng.sign(), z = t.z + rng.range(3, 10), y = t.y;
    const fork = [x + rng.range(-0.03, 0.03) * H, y + 0.42 * H, z];
    M.tube([[x, y - 0.5, z], fork], 0.034 * H, 0.024 * H, 5, rng(), litAt);
    const nests = rng.chance(0.6) ? rng.int(2, 4) : 0;
    for (let b = 0; b < 7; b++) {
      const az = TAU * (b + rng.range(-0.3, 0.3)) / 7, up = rng.range(0.7, 1.25), len = rng.range(0.3, 0.5) * H, pts = [fork];
      for (let k = 1; k <= 3; k++) {
        const q = len * k / 3, c = Math.cos(up + 0.1 * k);
        pts.push([fork[0] + Math.cos(az) * c * q, fork[1] + Math.sin(up + 0.1 * k) * q, fork[2] + Math.sin(az) * c * q]);
      }
      M.ribbon(pts, 0.028 * H, 0.008 * H, N, rng(), litAt);
      for (let k = 1; k <= 3; k++) {
        const p = pts[k], o = pts[k - 1], d = v3.norm(v3.add(p, o, -1));
        for (let j = 0; j < 2; j++) {
          const T = v3.norm([d[0] + rng.range(-0.6, 0.6), d[1] + rng.range(0, 0.6), d[2] + rng.range(-0.5, 0.5)]);
          const S = v3.norm(v3.cross(T, v3.norm([rng.range(-0.4, 0.4), 0.25, -1 + rng.range(-0.4, 0.4)]))), NN = v3.cross(S, T);
          const NL = v3.norm([NN[0] + 1.4 * SUN_N[0], NN[1] + 1.4 * SUN_N[1], NN[2] + 1.4 * SUN_N[2]]);
          M.leaf(j ? p : o, T, S, NL, rng.range(0.15, 0.21) * H, rng(), litAt(p), { piv: o, w: 1, ph: rng.range(0, TAU), om: rng.range(0.7, 1.4), amp: rng.range(0.008, 0.016) }, 3);
        }
      }
      if (b < nests) {
        const p = pts[rng.int(1, 2)], r = rng.range(1.0, 1.5);
        M.tube([[p[0], p[1] - 0.25, p[2]], [p[0], p[1] + 0.3, p[2]]], r * 0.45, r, 5, 0.5, litAt, null, 2);
        M.tube([[p[0], p[1] + 0.3, p[2]], [p[0], p[1] + 0.85, p[2]]], r, r * 0.6, 5, 0.5, litAt, null, 2);
      }
    }
  }
}

// THE MOOR'S WHIPS: broom as tall sprays of green whips (kind 5), and dead flower spikes standing out of the heather
// cushions that lie near the entry's axis and the gateway (kind 3); each spray stirs about its own stalk
function moorWood(M, moor, rng, litAt) {
  const TAU = Math.PI * 2;
  const spray = (p, lean, size, kind) => {
    const a = rng.range(0, TAU), T = v3.norm([Math.cos(a) * lean, 1, Math.sin(a) * lean]);
    const S = v3.norm(v3.cross(T, [Math.cos(a + 1.3), 0.2, Math.sin(a + 1.3)])), N = v3.cross(S, T);
    M.leaf(p, T, S, N, size, rng(), litAt(p), { piv: p, w: 1, ph: rng.range(0, TAU), om: rng.range(1.0, 2.2), amp: rng.range(0.03, 0.06) }, kind);
  };
  for (const b of moor.broom) {
    for (let k = 0; k < 9; k++) {
      const up = k < 5 ? 0 : b.h * 0.35, o = rng.range(0, 0.8);
      spray([b.x + rng.range(-o, o), b.y + up, b.z + rng.range(-o, o)], rng.range(0.05, 0.4), b.h * (k < 5 ? 0.45 : 0.4), 5);
    }
  }
  // over a rounded plant (centre c, radii r and h): n sprays standing out of its upper surface, leaning outward
  const cover = (p, n, size0, size1, kind, hk) => {
    for (let k = 0; k < n; k++) {
      const a = rng.range(0, TAU), q = Math.sqrt(rng()) * 0.85, up = Math.sqrt(1 - q * q);
      const at = [p.x + Math.cos(a) * q * p.r, p.y + p.h * hk * (0.25 + 0.75 * up), p.z + Math.sin(a) * q * p.r];
      const T = v3.norm([Math.cos(a) * q * 0.9, 0.5 + up, Math.sin(a) * q * 0.9]);
      const S = v3.norm(v3.cross(T, [Math.cos(a + 1.3), 0.2, Math.sin(a + 1.3)])), N = v3.cross(S, T);
      M.leaf(at, T, S, N, rng.range(size0, size1), rng(), litAt(at), { piv: at, w: 1, ph: rng.range(0, TAU), om: rng.range(1.0, 2.2), amp: rng.range(0.03, 0.06) }, kind);
    }
  };
  for (const p of moor.heather) if (p.d < 40 && p.x > -185) cover(p, 11, 0.5, 0.95, 6, 0.8);
  for (const p of moor.tussocks) if (p.d < 40 && p.x > -185) cover(p, 6, 0.55, 1.0, 7, 0.75);
  for (const p of moor.gorse) if (p.d < 48 && p.x > -195) cover({ x: p.x, y: p.y + p.h * 0.3, z: p.z, r: p.r * 0.8, h: p.h }, 12, 0.8, 1.3, 5, 0.7);
}

// THE MOOR'S TUFTS within 40 m (gorse 48 m) of the flown line, the line continued 30 m straight back along the
// entry's axis (moorOff): twig sprays standing out all over each heather hummock (its outline is twigs, never a
// smooth lump), bleached grass standing round its foot and out of every tussock, and spiny flowering sprays standing
// out all over every lobe of each gorse (its outline is spines; no spray reaches nearer the entry's axis than 6.2 m
// in plan). Dealt in one pass, kind by kind in the lists' own order, from a stream of their own; a plant beyond
// its metres takes no draw.
async function moorTufts(M, moor, rng, litAt, yieldNow) {
  const P = PLAN, TAU = Math.PI * 2;
  // (G9d: what is not laid draws nothing: a card draws its four numbers only where it stands)
  const card = (at, T, size, kind, amp) => {
    const a = rng.range(0, TAU), h = rng(), ph = rng.range(0, TAU), om = rng.range(1.0, 2.2);
    const S = v3.norm(v3.cross(T, [Math.cos(a), 0.2, Math.sin(a)])), N = v3.cross(S, T);
    M.leaf(at, T, S, N, size, h, litAt(at), { piv: at, w: 1, ph, om, amp }, kind);
  };
  const clothed = (p) => p.x > P.start[0] - MOOR_CLOTH.back - 2 && p.d < MOOR_CLOTH.reach;   // (the strip where sprigs stand on a mound)
  const heatherTufts = (p) => {
    const rz = p.r * (0.8 + 0.4 * (p.seed % 1)), n = clothed(p) ? 22 : 44;   // (in the clothed strip, where sprigs stand on the mound, half as many twig cards are dealt)
    for (let k = 0; k < n; k++) {
      const a = rng.range(0, TAU), q = 0.15 + 0.83 * Math.sqrt(rng()), up = Math.sqrt(Math.max(0, 1 - q * q));
      const at = [p.x + Math.cos(a) * q * p.r, p.y + p.h * (0.1 + 0.7 * up), p.z + Math.sin(a) * q * rz];
      const size = rng.range(0.45, 0.9), amp = rng.range(0.03, 0.06);
      card(at, v3.norm([Math.cos(a) * q, 0.45 + up, Math.sin(a) * q]), size, 6, amp);
    }
    for (let k = 0; k < 6; k++) {
      const a = rng.range(0, TAU), q = rng.range(0.95, 1.5);
      const at = [p.x + Math.cos(a) * q * p.r, p.y - 0.05, p.z + Math.sin(a) * q * rz];
      if (Math.abs(at[2] - P.gateZ) < 2.2 || at[0] > P.boundaryX - P.boundaryT / 2 - 0.6) continue;   // (its place first)
      const size = rng.range(0.45, 0.85);
      card(at, v3.norm([Math.cos(a) * 0.3, 1, Math.sin(a) * 0.3]), size, 7, rng.range(0.04, 0.08));
    }
  };
  const tussockTufts = (p) => {
    for (let k = 0; k < 12; k++) {
      const a = rng.range(0, TAU), q = rng.range(0.1, 0.95);
      const at = [p.x + Math.cos(a) * q * p.r, p.y + p.h * 0.35 * (1 - q * q), p.z + Math.sin(a) * q * p.r];
      if (Math.abs(at[2] - P.gateZ) < 2.2) continue;     // (its place first)
      const size = rng.range(0.5, 0.95);
      card(at, v3.norm([Math.cos(a) * (0.25 + 0.6 * q), 1, Math.sin(a) * (0.25 + 0.6 * q)]), size, 7, rng.range(0.04, 0.08));
    }
  };
  const gorseTufts = (p) => {
    const lobes = 2 + Math.floor(p.seed % 2);            // the same lobes as its body in the things' mesh
    if (lineOff(p.x, p.z) - p.r < MOOR_CLOTH.gorseHalf) return;   // (G10b: a bush that bears true sprays bears no card; G9d: and draws none)
    for (let j = 0; j < lobes; j++) {
      const a0 = p.seed * 1.7 + j * 2.3, o = j === 0 ? 0 : p.r * 0.55, sc = j === 0 ? 1 : 0.7;
      const cx = p.x + Math.cos(a0) * o, cy = p.y + p.h * 0.42 * sc, cz = p.z + Math.sin(a0) * o, rr = p.r * 0.8 * sc, hh = p.h * 0.6 * sc;
      for (let k = 0, n = j === 0 ? 46 : 24; k < n; k++) {
        const a = rng.range(0, TAU), sy = rng.range(-0.25, 1), cr = Math.sqrt(1 - sy * sy);
        const at = [cx + Math.cos(a) * cr * rr * 0.86, cy + hh * 0.86 * sy, cz + Math.sin(a) * cr * rr * 0.86];
        const T = v3.norm([Math.cos(a) * cr, 0.3 + sy, Math.sin(a) * cr]);
        const most = (Math.abs(at[2] - P.gateZ) - 6.2) / 1.3;
        if (most < 0.4) continue;                        // (its place first: the least card dealt is 0.55 m)
        const size = Math.min(rng.range(0.8, 1.5) * (0.75 + 0.25 * sc), most);
        card(at, T, size, 10, rng.range(0.015, 0.03));
      }
    }
  };
  const kinds = [[moor.heather, 40, heatherTufts], [moor.tussocks, 40, tussockTufts], [moor.gorse, 48, gorseTufts]];
  let done = 0;
  for (const [list, d, tufts] of kinds) for (const p of list) {
    if (!(moorOff(p) < d)) continue;
    tufts(p);
    if (yieldNow && ++done % 40 === 0) await yieldNow(done === 40 ? 12 : done === 80 ? 7.5 : 4);
  }
}

// A BARE CLIMBER on the gateway's north pier: three old stems from its foot up the sunlit west face (their feet 1 m
// apart from 0.5 m in from the pier's north corner: typed; how each wanders up the stone is the seed's), short side
// shoots, and sprays of bare twigs standing a little off the stone and over the cap (5.5 m and more from the line)
function pierClimber(M, rng, litAt) {
  const P = PLAN, TAU = Math.PI * 2, xw = P.boundaryX - P.pierW / 2 - 0.07, z0 = P.gateZ - P.gateHalf - P.pierW, z1 = P.gateZ - P.gateHalf, top = P.pierH - 0.6;
  const spray = (p, dir, size) => {
    const T = v3.norm([dir[0] - 0.25 + rng.range(-0.2, 0.2), dir[1] + rng.range(0, 0.5), dir[2] + rng.range(-0.4, 0.4)]);
    const S = v3.norm(v3.cross(T, [-1, rng.range(-0.3, 0.3), rng.range(-0.3, 0.3)])), N = v3.cross(S, T);
    M.leaf(p, T, S, N, size, rng(), litAt(p), { piv: p, w: 1, ph: rng.range(0, TAU), om: rng.range(1.2, 2.6), amp: rng.range(0.02, 0.04) }, 3);
  };
  for (let i = 0; i < 3; i++) {
    let z = z0 + 0.5 + i * 1.0;
    const pts = [[xw - 0.05, -0.2, z]], h = rng(), H = top + rng.range(-1.6, 0.9), n = 9;
    for (let k = 1; k <= n; k++) {
      z = Math.max(z0 + 0.15, Math.min(z1 - 0.1, z + rng.range(-0.45, 0.5)));
      pts.push([xw - 0.03 - 0.05 * rng(), -0.2 + (H + 0.2) * k / n, z]);
    }
    M.tube(pts, 0.11, 0.035, 4, h, litAt);
    for (let k = 2; k <= n; k++) {
      const p = pts[k], side = rng.sign(), L = rng.range(0.7, 1.7), up = rng.range(0.2, 0.9);
      const q = [p[0] - 0.02, Math.min(top + 0.9, p[1] + L * Math.sin(up)), Math.max(z0 - 0.3, Math.min(z1 + 0.3, p[2] + side * L * Math.cos(up)))];
      const m = [(p[0] + q[0]) / 2 - 0.03, (p[1] + q[1]) / 2 + rng.range(-0.1, 0.15), (p[2] + q[2]) / 2];
      M.tube([p, m, q], 0.035, 0.014, 3, h, litAt);
      spray(q, v3.norm(v3.add(q, p, -1)), rng.range(0.7, 1.1));
      if (k % 2 === 0) spray(m, [0, 0.6, side * 0.8], rng.range(0.55, 0.85));
    }
    spray(pts[n], [0, 1, 0], rng.range(0.8, 1.2));
  }
}

// every bare woody thing of the outside in one mesh: the fans, the trees, the moor's whips
// o = { sunAt, stream, colors, clock, moor, far, yieldNow } (`stream`: the world's maker of a stream from the seed and a plain name; each set deals from its own: 'wood-fans',
// 'wood-kitchen', 'wood-orchard', 'wood-moor', 'wood-far', 'wood-pier', 'wood-tufts', 'wood-rookery')
export async function buildWood(o) {
  const M = makeLeafMesh(o.colors, o.clock), litAt = (q) => o.sunAt(q[0], q[1], q[2]), breathe = async (w, next) => { if (o.yieldNow) await o.yieldNow(w, next); };
  o.casters = [];                                    // the orchard's two nearest rows: limbs and sprays, for the walk's shadows
  // (G7) the five kitchen-garden trees' topmost twigs, each { p, sw (its bough's swing), r }: the robin's high perch
  o.tops = [];
  // (every set by a stream of its own name, made by the world's maker from the seed: o.stream)
  const fans = o.stream('wood-fans');
  for (const x of WALK_PLAN.fans) fanTree(M, x, fans, litAt);
  await breathe(10.5, 8.5);
  await outsideTrees(M, o, litAt);
  await breathe(0.1, 16.5);
  if (o.moor) moorWood(M, o.moor, o.stream('wood-moor'), litAt);
  await breathe(16.5, 9);
  if (o.far) farTrees(M, o.far, o.stream('wood-far'), litAt);
  await breathe(9);
  pierClimber(M, o.stream('wood-pier'), litAt);
  if (o.moor) await moorTufts(M, o.moor, o.stream('wood-tufts'), litAt, o.yieldNow);
  await breathe(0.5);
  if (o.far) rookWood(M, o.far, o.stream('wood-rookery'), litAt);
  await breathe(5);
  const built = M.build('garden-wood', o.yieldNow ? await M.stores(o.yieldNow) : null);
  built.casters = o.casters;
  built.tops = o.tops;
  return built;
}

// ---------------------------------------------------------------- THE ROBIN AND ITS MATE (G7): form, material, pose
// A small bird of 0.5 m from bill to tail as a real form: a round body carried breast-up, a head, a fine bill, two
// eyes, a tail, two wings with thickness that fold along the flanks or spread, thin legs. Its feet stand at the
// origin and it faces +z. Breast and face c9522a, back 6b5a45, belly e9e2d2. The parts turn in the vertex stage by a
// pose (uBird = wings spread 0..1, wing beat, tail lift, head turn; uBirdB = throat, legs tucked, the light of its
// place, head pitch): nothing in it reads the lens. On a swinging twig it rides that twig's own swing (uSwA, uSwB:
// the bare wood's formula, on the world's clock).
const BIRD_GLSL = /* glsl */`
attribute vec2 bq;
vec3 bRotX(vec3 p, float a) { float c = cos(a), s = sin(a); return vec3(p.x, c * p.y - s * p.z, s * p.y + c * p.z); }
vec3 bRotY(vec3 p, float a) { float c = cos(a), s = sin(a); return vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z); }
vec3 bRotZ(vec3 p, float a) { float c = cos(a), s = sin(a); return vec3(c * p.x - s * p.y, s * p.x + c * p.y, p.z); }
`;
const BIRD_VERTEX = /* glsl */`
  vec3 bn = objectNormal;
  if (bq.x > 0.5 && bq.x < 1.5) {
    vec3 hc = vec3(0.0, 0.287, 0.1);
    transformed = hc + bRotY(bRotX(transformed - hc, uBirdB.w), uBird.w); bn = bRotY(bRotX(bn, uBirdB.w), uBird.w);
  } else if (bq.x > 1.5 && bq.x < 2.5) {
    vec3 tc = vec3(0.0, 0.15, -0.12);
    transformed = tc + bRotX(transformed - tc, uBird.z); bn = bRotX(bn, uBird.z);
  } else if (bq.x > 2.5 && bq.x < 4.5) {
    float sg = bq.x < 3.5 ? 1.0 : -1.0, fo = 1.0 - uBird.x;
    vec3 wc = vec3(sg * 0.085, 0.165, 0.045);
    float wy = sg * 1.5708 * fo, wr = sg * (uBird.y * uBird.x - 1.05 * fo);
    transformed = wc + bRotZ(bRotY(transformed - wc, wy), wr); bn = bRotZ(bRotY(bn, wy), wr);
  } else if (bq.x > 4.5) {
    transformed.y = mix(transformed.y, 0.09, 0.85 * uBirdB.y);
  }
  transformed += bn * (bq.y * uBirdB.x * 0.016);
  vNormal = normalize(normalMatrix * bn);`;
const BIRD_AFTER = /* glsl */`
  float bsA = uWind * uSwB.w * uSwB.x * (0.5 + 0.5 * gGustBand(uSwA.xz * 1.2)), bsT = uTime * uSwB.z + uSwB.y;
  float bs1 = bsA * (sin(bsT) + 0.45 * sin(2.31 * bsT + 1.7 * uSwB.y)), bs2 = 0.4 * bsA * sin(0.83 * bsT + 2.9 * uSwB.y);
  vec3 bsR = (modelMatrix * vec4(transformed, 1.0)).xyz - uSwA;
  bsR.yz = vec2(cos(bs1) * bsR.y - sin(bs1) * bsR.z, sin(bs1) * bsR.y + cos(bs1) * bsR.z);
  bsR.xy = vec2(cos(bs2) * bsR.x - sin(bs2) * bsR.y, sin(bs2) * bsR.x + cos(bs2) * bsR.y);
  mvPosition = viewMatrix * vec4(uSwA + bsR, 1.0);
  gl_Position = projectionMatrix * mvPosition;`;
export function makeBird(clock) {
  const pos = [], nor = [], bc = [], bq = [], idx = [], c = new THREE.Color(), throatAt = [0, 0.232, 0.15];
  const red = new THREE.Color('#c9522a'), back = new THREE.Color('#6b5a45'), belly = new THREE.Color('#e9e2d2'), dark = new THREE.Color('#57483a'), horn = new THREE.Color('#3b3129'), leg = new THREE.Color('#6a4f3a'), black = new THREE.Color('#16120f');
  // an ellipsoid about o with radii r, tipped about x by `tilt`; paint(n, into) colours the face whose normal is n
  const ball = (o, r, seg, rings, tilt, part, paint) => {
    const i0 = pos.length / 3, ct = Math.cos(tilt), st = Math.sin(tilt);
    for (let j = 0; j <= rings; j++) for (let s = 0; s <= seg; s++) {
      const ph = -Math.PI / 2 + Math.PI * j / rings, a = (s % seg) / seg * Math.PI * 2, d = [Math.cos(ph) * Math.cos(a), Math.sin(ph), Math.cos(ph) * Math.sin(a)];
      let p = [d[0] * r[0], d[1] * r[1], d[2] * r[2]], n = [d[0] / r[0], d[1] / r[1], d[2] / r[2]];
      p = [p[0], ct * p[1] - st * p[2], st * p[1] + ct * p[2]]; n = [n[0], ct * n[1] - st * n[2], st * n[1] + ct * n[2]];
      const l = Math.hypot(n[0], n[1], n[2]), q = [o[0] + p[0], o[1] + p[1], o[2] + p[2]];
      n = [n[0] / l, n[1] / l, n[2] / l];
      paint(n, c);
      pos.push(q[0], q[1], q[2]); nor.push(n[0], n[1], n[2]); bc.push(c.r, c.g, c.b);
      bq.push(part, part < 1.5 ? Math.max(0, 1 - Math.hypot(q[0] - throatAt[0], q[1] - throatAt[1], q[2] - throatAt[2]) / 0.075) : 0);
    }
    for (let j = 0; j < rings; j++) for (let s = 0; s < seg; s++) {
      const a = i0 + j * (seg + 1) + s, b = a + seg + 1;
      idx.push(a, b, b + 1, a, b + 1, a + 1);
    }
  };
  const flat = (col) => (n, into) => into.copy(col);
  // the body: red on its front down to the belly, whitish beneath, the back's brown above and behind
  ball([0, 0.17, 0], [0.105, 0.108, 0.155], 10, 7, -0.42, 0, (n, into) => into.copy(back).lerp(belly, sstep(-0.1, -0.5, n[1])).lerp(red, sstep(0.05, 0.4, n[2]) * sstep(-0.8, -0.45, n[1]) * (1 - sstep(0.55, 0.9, n[1]))));
  // the head (red face and throat, brown crown and nape), the eyes, the bill
  ball([0, 0.287, 0.1], [0.074, 0.07, 0.078], 8, 6, 0, 1, (n, into) => into.copy(back).lerp(red, sstep(-0.05, 0.3, n[2]) * (1 - sstep(0.3, 0.62, n[1]))));
  for (const sx of [-1, 1]) ball([sx * 0.052, 0.3, 0.14], [0.013, 0.013, 0.013], 5, 3, 0, 1, flat(black));
  ball([0, 0.281, 0.2], [0.016, 0.014, 0.05], 5, 3, 0, 1, flat(horn));
  // the tail, the two wings (laid spread: the vertex stage folds them), the legs and feet
  ball([0, 0.13, -0.19], [0.036, 0.008, 0.08], 6, 4, -0.2, 2, flat(dark));
  for (const sx of [1, -1]) ball([sx * 0.22, 0.165, -0.005], [0.135, 0.008, 0.065], 8, 4, 0, sx > 0 ? 3 : 4, flat(dark));
  for (const sx of [-1, 1]) {
    ball([sx * 0.035, 0.045, -0.004], [0.007, 0.05, 0.007], 4, 2, 0.1, 5, flat(leg));
    ball([sx * 0.035, 0.006, 0.012], [0.014, 0.006, 0.032], 5, 2, 0, 5, flat(leg));
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('bc', new THREE.Float32BufferAttribute(bc, 3)); g.setAttribute('bq', new THREE.Float32BufferAttribute(bq, 2));
  g.setIndex(idx); g.computeBoundingSphere(); g.boundingSphere.radius += 0.8;
  const U = { uBird: { value: new THREE.Vector4(0, 0, 0, 0), type: 'vec4' }, uBirdB: { value: new THREE.Vector4(0, 0, 1, 0), type: 'vec4' },
    uSwA: { value: new THREE.Vector3(), type: 'vec3' }, uSwB: { value: new THREE.Vector4(0, 0, 1, 0), type: 'vec4' } };
  const material = drawnMaterial({ key: 'garden-bird-1', uniforms: { ...clock, ...U }, vary: { bc: 'vec3' }, head: SHADE_GLSL, vertexHead: BIRD_GLSL + GUST_GLSL,
    vertex: BIRD_VERTEX, after: BIRD_AFTER, color: 'diffuseColor.rgb = gShade(v_bc, uBirdB.z);', extra: { side: THREE.DoubleSide } });
  const mesh = new THREE.Mesh(g, material);
  mesh.name = 'garden-bird'; mesh.rotation.order = 'YXZ';
  // the pose of this instant (birdPose's record) laid on the mesh: a place, two turns and eight figures
  const set = (P) => {
    mesh.position.set(P.p[0], P.p[1], P.p[2]); mesh.rotation.set(P.pitch, P.yaw, 0);
    U.uBird.value.set(P.spread, P.beat, P.tail, P.head); U.uBirdB.value.set(P.throat, P.tuck, P.lit, P.nod);
    if (P.sw) { U.uSwA.value.set(P.sw.piv[0], P.sw.piv[1], P.sw.piv[2]); U.uSwB.value.set(P.sw.w * P.swW, P.sw.ph, P.sw.om, P.sw.amp); } else U.uSwB.value.x = 0;
  };
  return { object: mesh, geometry: g, material, triangles: idx.length / 3, set };
}// A ROUND: perches [{ p, yaw (its own facing there), sit (seconds), lit, sw (a swinging twig's record or null), h }]
// and, from each perch to the next, a flight { c1, c2 } (a cubic course). The whole is a loop of T seconds on the
// world's clock: sit, fly, sit, ... back to the first perch. `phase` sets where the clock's zero falls in it.
const bez = (a, c1, c2, b, s, out) => {
  const m = 1 - s, w0 = m * m * m, w1 = 3 * m * m * s, w2 = 3 * m * s * s, w3 = s * s * s;
  for (let k = 0; k < 3; k++) out[k] = w0 * a[k] + w1 * c1[k] + w2 * c2[k] + w3 * b[k];
  return out;
};
const bezD = (a, c1, c2, b, s, out) => {
  const m = 1 - s;
  for (let k = 0; k < 3; k++) out[k] = 3 * m * m * (c1[k] - a[k]) + 6 * m * s * (c2[k] - c1[k]) + 3 * s * s * (b[k] - c2[k]);
  return out;
};
export function makeRound(perches, flights, phase, speed = 9.5) {
  const legs = [], n = perches.length, d = [0, 0, 0], q = [0, 0, 0], r = [0, 0, 0];
  let T = 0, long = 0;
  for (let i = 0; i < n; i++) {
    const A = perches[i], B = perches[(i + 1) % n], F = flights[i], G = flights[(i + n - 1) % n], Z = perches[(i + n - 1) % n];
    let len = 0;
    q[0] = A.p[0]; q[1] = A.p[1]; q[2] = A.p[2];
    for (let k = 1; k <= 24; k++) { bez(A.p, F.c1, F.c2, B.p, k / 24, r); len += Math.hypot(r[0] - q[0], r[1] - q[1], r[2] - q[2]); q[0] = r[0]; q[1] = r[1]; q[2] = r[2]; }
    bezD(Z.p, G.c1, G.c2, A.p, 1, d);
    const yawIn = Math.atan2(d[0], d[2]);
    bezD(A.p, F.c1, F.c2, B.p, 0, d);
    legs.push({ kind: 0, at: i, t0: T, D: A.sit, yawIn, yawOut: Math.atan2(d[0], d[2]) });
    T += A.sit; long = Math.max(long, A.sit);
    const D = Math.max(0.8, len / speed);
    legs.push({ kind: 1, at: i, t0: T, D, len });
    T += D;
  }
  return { T, phase, legs, perches, flights, share: long / T };
}
const turnTo = (a, b, k) => { let e = (b - a) % 6.283185307; if (e > Math.PI) e -= 6.283185307; else if (e < -Math.PI) e += 6.283185307; return a + e * k; };
const pulse = (x, x0, w) => { const e = (x - x0) / w; return e > 0 && e < 1 ? Math.sin(Math.PI * e) ** 2 : 0; };
const POSE_D = [0, 0, 0];
// THE POSE OF A BIRD AT A TIME OF THE WORLD'S CLOCK: a pure function of the clock and the round, of nothing else.
export function birdPose(R, time, P = {}) {
  const tt = ((time + R.phase) % R.T + R.T) % R.T, p = P.p || (P.p = [0, 0, 0]);
  let L = R.legs[0];
  for (const l of R.legs) if (tt >= l.t0) L = l;
  const A = R.perches[L.at], B = R.perches[(L.at + 1) % R.perches.length], F = R.flights[L.at], t = tt - L.t0, D = L.D;
  P.leg = L.at; P.fly = L.kind;
  if (L.kind === 0) {
    // ON A PERCH. Its habits run in slots counted from the alighting, each dealt by the perch's number:
    // the body turns with a small hop, the head turns and holds, a bob, a flick of the tail, a spell of song.
    const base = Math.floor(A.h * 977) + L.at * 31, hs = (k, salt) => hash2(k * 17 + salt, base + k * 5);
    const gate = sstep(0, 0.4, t) * (1 - sstep(D - 0.6, D - 0.3, t));
    const kMax = Math.max(0, Math.floor((D - 0.8) / 3.1)), kb = Math.min(Math.floor(t / 3.1), kMax), xb = t - kb * 3.1;
    const off = (k) => (k <= 0 ? 0 : (hs(k, 3) - 0.5) * 1.7);
    let yaw = A.yaw + off(kb - 1) + (off(kb) - off(kb - 1)) * sstep(0, 0.16, xb);
    let hop = kb > 0 ? pulse(xb, 0, 0.16) : 0;
    yaw = turnTo(L.yawIn, yaw, sstep(0, 0.4, t));
    yaw = turnTo(yaw, L.yawOut, sstep(D - 0.28, D - 0.02, t));
    hop += pulse(t, D - 0.28, 0.27);
    const kh = Math.floor(t / 1.15), xh = t - kh * 1.15, hd = (k) => (k <= 0 ? 0 : (Math.floor(hs(k, 7) * 5) - 2) * 0.45);
    const kq = Math.floor(t / 2.3), bob = gate * (hs(kq, 13) > 0.45 ? pulse(t - kq * 2.3, 0.7, 0.24) : 0);
    const kt = Math.floor(t / 1.7), flick = gate * (hs(kt, 19) > 0.4 ? pulse(t - kt * 1.7, 1.0, 0.2) : 0);
    const ks = Math.floor(t / 7), xs = t - ks * 7, sing = gate * (hs(ks, 23) > 0.35 ? sstep(1.0, 1.4, xs) * (1 - sstep(4.6, 5.0, xs)) : 0);
    p[0] = A.p[0]; p[1] = A.p[1] + 0.035 * hop - 0.015 * bob; p[2] = A.p[2];
    P.yaw = yaw; P.pitch = 0.3 * bob;
    P.spread = 0; P.beat = 0; P.tuck = 0;
    P.tail = 0.55 * flick + 0.12 * bob;
    P.head = gate * (hd(kh - 1) + (hd(kh) - hd(kh - 1)) * sstep(0, 0.1, xh));
    P.nod = -0.22 * sing; P.throat = sing * (0.55 + 0.45 * Math.sin(xs * 41));
    P.lit = A.lit; P.sw = A.sw || null; P.swW = 1;
    return P;
  }
  // ON THE WING: a short low flight along its course, eased at both ends, the wings beating eleven times a second
  const x = t / D, e = 0.7 * x * x * (3 - 2 * x) + 0.3 * x, d = bezD(A.p, F.c1, F.c2, B.p, e, POSE_D);
  const on = sstep(0, 0.07, x) * (1 - sstep(0.94, 1, x));
  bez(A.p, F.c1, F.c2, B.p, e, p);
  P.yaw = Math.atan2(d[0], d[2]); P.pitch = on * (0.42 - 0.8 * d[1] / Math.hypot(d[0], d[1], d[2]));
  P.spread = on; P.beat = 0.95 * Math.sin(t * 69 + A.h * 6); P.tuck = on;
  P.tail = 0.12 * on; P.head = 0; P.nod = -0.25 * on; P.throat = 0;
  P.lit = A.lit + (B.lit - A.lit) * e;
  if (A.sw) { P.sw = A.sw; P.swW = 1 - sstep(0, 0.35, e); } else if (B.sw) { P.sw = B.sw; P.swW = sstep(0.65, 1, e); } else P.sw = null;
  return P;
}// THE ROBIN'S ROUND, outside (the brief's `robin`), 96 s on the world's clock: the spade's grip its long sit, then
// the rim of a clay pot by the north wall, the ridge of a glass frame, the wall's coping, the topmost twig of a
// kitchen-garden tree beyond the wall, and back. Spade to pot to frame to coping run AWAY from the door along the
// border; the travel back toward the door's end is carried by the two high flights beyond and above the kitchen wall
// (coping to twig, and the twig's flight as far as the spade's own x), and the last comes down to the spade ACROSS
// the border, not along it. Every point that shapes a course lies north of z -6 (a
// cubic course lies within the hull of its four points), so the whole round keeps 6 m and more in plan from the
// flown line (which runs at z 0 and south of it there) at every phase and on every seed; the perch nearest the
// doorway is the spade, 36 m off.
// ITS PHASE IS THE SEED'S (G9b): a number of the round's 96 s from a stream of its own (`rng`), so where the bird
// is at clock zero is not typed. THAT IT IS LIKELY BY THE LINE AS THE LINE PASSES IS THE ROUND'S OWN DOING, the same on every seed: it RESTS
// ROBIN.rest (0.56) OF ITS ROUND, 53.8 s of 96, ON THE SPADE'S GRIP, 7.0 m in plan from the flown line and the
// round's one perch within 12 m of it (the pot's rim 14.7 m, the frame's ridge 14.0 m, the coping 16.0 m, the twig
// beyond the wall 26 m and more); the four other sits share what the rest and the five flights leave, in the
// proportions of ROBIN.sits. (Counted by the world's own update through 200 s of its clock on twenty seeds spread
// over 1 to 300: of those 53.8 s it stands still 51.0 s and more; the rest is its own hops and turns on the grip.)
export const ROBIN = { T: 96, rest: 0.56, sits: [0, 7, 6, 8, 11], yaws: [0.5, 2.2, 0.35, -0.6, 1.2], north: -6 };
export function layRobin(perch, tops, sunAt, rng) {
  const S = perch.spade, Pt = perch.pot, Rg = perch.ridge;
  // the twig: of the two kitchen trees nearest the walk, the one whose top stands higher over the straight line drawn
  // from the flown line on the walk across the north wall's coping
  const over = (t) => t.p[1] - (4.2 + 5.35 * (5 - t.p[2]) / 15.7), top = over(tops[0]) >= over(tops[1]) ? tops[0] : tops[1];
  const Tw = [top.p[0], top.p[1] + top.r, top.p[2]], Cp = [Rg[0] - 2.6, PLAN.walkNorthH + 0.55, -10.95];
  const add = (a, x, y, z) => [a[0] + x, a[1] + y, Math.min(ROBIN.north, a[2] + z)];
  const mid = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
  const flights = [
    { c1: add(mid(S, Pt, 1 / 3), 0, 0.5, 1.0), c2: add(mid(S, Pt, 2 / 3), 0, 0.5, 0.6) },
    { c1: add(Pt, -1, 1.6, 1.2), c2: add(Rg, 1, 1.2, 0.8) },
    { c1: add(Rg, -0.6, 3.5, 2.2), c2: add(Cp, 0.6, 1.2, 2.6) },
    { c1: add(Cp, 1, 2, -3), c2: add(Tw, -1.5, 1.2, 2) },
    { c1: [Tw[0] + (S[0] - Tw[0]) * 0.8, Math.max(Tw[1], 13) + 1.5, -15], c2: [S[0] + 0.3, 13.5, -10.2] },
  ];
  const at = [S, Pt, Rg, Cp, Tw];
  const phase = rng.range(0, ROBIN.T);
  const make = (first, k) => makeRound(at.map((p, i) => ({ p, yaw: ROBIN.yaws[i], sit: i ? ROBIN.sits[i] * k : first, lit: sunAt(p[0], p[1], p[2]), sw: i === 4 ? top.sw : null, h: 0.13 + 0.19 * i })), flights, phase);
  // the long sit is its typed share of the round's 96 s; the other sits share what it and the five flights leave
  const long = ROBIN.rest * ROBIN.T, R = make(long, (ROBIN.T - long - make(0, 0).T) / ROBIN.sits.reduce((a, b) => a + b, 0));
  R.rest = long / R.T;
  return R;
}// THE MATE'S ROUND, inside (the brief's `robin`), 84 s on the world's clock: a low bough of an old grey tree its long
// sit, then the top of a rose bush, the fork's handle, a bough of a blossom tree, and back. The fork stands on the
// flown line's right hand, and no flight may cross the line: so every perch is taken on that side. The perches are
// the seed's (the trees and bushes stand where it dealt them); the rule is the part's and is held AT BUILD on every
// seed: a perch stands MATE.perch and more in plan from the flown line, and each flight's bow is one of a dealt few
// (sideways, upward) whose whole course, sampled at 49 places, keeps MATE.line and more in plan from the line on
// that same side. That test is never relaxed: a perch whose flight cannot pass is left out of the round, and with
// fewer than two perches no mate is laid. Of the lawful bows the one is taken that meets least trunk, bush and ground.
// ITS PLACES (G9b): the fork's handle is the gardener's (the plan's place of the fork). The three other perches are
// the seed's BY ONE RULE: of the lawful perches of its kind (a low bough of an old grey tree within MATE.reach of
// the handle by the bough's own measure, the top of a bush, a bough of a blossom tree within MATE.far), the one
// NEAREST THE FORK'S HANDLE. No place of the round is typed. ITS PHASE IS THE SEED'S, by a stream of its own.
export const MATE = { T: 84, sits: [0, 7, 6, 8], reach: 40, far: 46, perch: 4.5, line: 3.2, trunk: 1.3, lat: [0, 2, -2, 4, -4, 7, -7], lift: [1, 2, 0.5, 3.5], speed: 8.5 };
export function layMate(o) {
  const { rule, grey, blossom, mounds, fork, sunAt, heightAt } = o, M = MATE, q = [0, 0, 0];
  if (!fork) return null;                              // (the round hangs on the fork's handle)
  const by = [fork[0], fork[2]];
  // a place's plan distance from the flown line; 0 where it is not on the line's right hand
  const off = (x, z) => { const l = rule.toLine(x, z); return l[4] * (z - l[3]) - l[5] * (x - l[2]) > 0 ? l[0] : 0; };
  // a low bough: of the trees' first limbs the point (1 to 3 out from the trunk) nearest `at`, the lower and the more
  // level the better; the feet stand on its upper side and the bird sits ACROSS it
  const bough = (trees, at, far) => {
    let best = null, bs = far;
    for (const t of trees) for (const L of t.built.limbs) {
      if (L.lv !== 0) continue;
      const m = L.pts.length - 1;
      for (let i = 1; i <= Math.min(3, m); i++) {
        const p = L.pts[i], d = L.dirs[i], s = Math.hypot(p[0] - at[0], p[2] - at[1]) + 0.8 * (p[1] - heightAt(p[0], p[2]) - 6) + 6 * Math.abs(d[1]);
        if (s >= bs || off(p[0], p[2]) < M.perch) continue;
        const r = 0.9 * (L.r + (L.rEnd - L.r) * Math.pow(i / m, 0.8)), k = Math.sqrt(Math.max(0.05, 1 - d[1] * d[1]));
        bs = s; best = { p: [p[0] - r * d[1] * d[0] / k, p[1] + r * k, p[2] - r * d[1] * d[2] / k], yaw: Math.atan2(d[2], -d[0]) };
      }
    }
    return best;
  };
  const list = [], put = (name, c, sit) => { if (c && off(c.p[0], c.p[2]) >= M.perch) list.push({ name, p: c.p, yaw: c.yaw, sit }); };
  put('bough', bough(grey, by, M.reach), 0);
  let rose = null, rs = 36;
  for (const m of mounds) {
    if (!m.top) continue;
    const s = Math.hypot(m.top[0] - by[0], m.top[2] - by[1]) + (m.rose ? 0 : 12);
    if (s < rs && off(m.top[0], m.top[2]) >= M.perch) { rs = s; rose = { p: m.top, yaw: 2.4 }; }
  }
  put('rose', rose, M.sits[1]);
  put('fork', { p: fork, yaw: -0.7 }, M.sits[2]);
  put('blossom', bough(blossom, by, M.far), M.sits[3]);
  const trunks = [...grey, ...blossom];
  const course = (a, b) => {
    const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], l = Math.hypot(dx, dz) || 1, nx = -dz / l, nz = dx / l;
    let best = null, bs = 1e8;
    for (const lat of M.lat) for (const lift of M.lift) {
      const up = lift + 0.04 * l, c1 = [a[0] + dx / 3 + nx * lat, a[1] + dy / 3 + up, a[2] + dz / 3 + nz * lat], c2 = [a[0] + dx * 2 / 3 + nx * lat, a[1] + dy * 2 / 3 + up, a[2] + dz * 2 / 3 + nz * lat];
      let bad = Math.abs(lat) * 0.2 + lift * 0.1, least = 1e9;
      for (let i = 0; i <= 48 && bad < bs; i++) {
        bez(a, c1, c2, b, i / 48, q);
        const d = off(q[0], q[2]);
        if (d < M.line) { bad = 1e9; break; }
        least = Math.min(least, d);
        if (i < 4 || i > 44) continue;
        if (q[1] - heightAt(q[0], q[2]) < 0.8) bad += 4;
        for (const t of trunks) if (Math.hypot(q[0] - t.x, q[2] - t.z) < M.trunk) bad += 4;
        for (const m of mounds) if (Math.hypot(q[0] - m.x, q[2] - m.z) < 0.8 * m.R && q[1] - heightAt(m.x, m.z) < m.H + 0.2) bad += 1;
      }
      if (bad < bs) { bs = bad; best = { c1, c2, least, bad }; }
    }
    return best;
  };
  let flights = null;
  while (list.length > 1 && !flights) {
    flights = [];
    for (let i = 0; i < list.length && flights; i++) {
      const c = course(list[i].p, list[(i + 1) % list.length].p);
      if (c) flights.push(c); else { list.splice((i + 1) % list.length || i, 1); flights = null; }
    }
  }
  if (!flights) return null;
  const phase = o.rng.range(0, M.T);   // (the seed's, drawn only where a mate is laid: what is not built draws nothing)
  const make = (first) => makeRound(list.map((c, i) => ({ p: c.p, yaw: c.yaw, sit: i ? c.sit || 7 : first, lit: sunAt(c.p[0], c.p[1], c.p[2]), sw: null, h: 0.61 + 0.23 * i })), flights, phase, M.speed);
  // the long sit takes what the other sits and the flights leave of the round's 84 s
  const R = make(M.T - make(0).T);
  // (the round's own figures, counted here by geometry: its perches, each flight's least plan distance from the flown
  // line and what its course meets)
  R.info = { perches: list.map((c) => c.name + ' ' + c.p.map((v) => v.toFixed(1)).join(' ')), least: flights.map((c) => +c.least.toFixed(2)), meets: flights.map((c) => +c.bad.toFixed(1)), T: R.T, long: +R.legs[0].D.toFixed(1) };
  return R;
}

// ---------------------------------------------------------------- THE REST OF THE LIFE (G7 piece 3): one mesh
// Bees, white butterflies, small birds, rooks, larks and the sunlit gaps' motes are ONE mesh of one drawn material. Every
// creature is a small body of real faces (its wings two-sided faces, never a card turned to the lens) laid in its own
// frame (x right, y up, z forward) and MOVED IN THE VERTEX STAGE ON THE WORLD'S CLOCK ALONE: its place is a function
// of the phase of its own round (whole harmonics only, so every round closes on itself), its heading the course's
// own direction, its wings beating on the clock. Nothing reads the lens; nothing is faded, sized or thinned by it;
// nothing runs on the processor for it while the world runs.
// Kinds: 0 a KNOT about a place (a bee, a butterfly of a pair circling the pair's shared point, a mote); 1 a CIRCLE
// (a rook); 2 a CHORD between two tree tops with a sit at each end (a small bird); 3 a LARK's widening spiral up
// over its own foot and its drop back to it.
// la: the place (or the chord's first end), the round in seconds. lb: the radii (or the chord's far end; a lark's
// radius, height and whole turns), the phase. lq: kind, wing face, wing beats a second, the creature's own number.
// lr: the pair's radius (a chord's share of the round in one flight), the wing's swing, 1 where the wings beat while
// it hardly moves, the pair's side (a chord's bow in metres). lc: colour and the light of its place (2: it glows).
const LIFE_GLSL = /* glsl */`
attribute vec4 la, lb, lq, lr;
vec3 lifeAt(float ph) {
  float a = 6.2831853 * ph, s = lq.w;
  if (lq.x < 0.5) {
    float q = 7.0 * a + lr.w * 3.14159;
    vec3 k = vec3(0.62 * sin(a + s) + 0.38 * sin(3.0 * a + 2.1 * s), 0.6 * sin(2.0 * a + 1.7 * s) + 0.4 * sin(5.0 * a + s), 0.62 * cos(a + 0.6 * s) + 0.38 * sin(4.0 * a + 3.3 * s));
    return la.xyz + lb.xyz * k + lr.x * vec3(cos(q), 0.5 * sin(2.0 * q + s), sin(q));
  }
  if (lq.x < 1.5) return la.xyz + lb.xyz * vec3(cos(a + s), sin(2.0 * a + 1.3 * s), sin(a + s));
  if (lq.x < 2.5) {
    float f = lr.x, g = 0.5 - f, e = clamp((ph - g) / f, 0.0, 1.0), b = clamp((ph - 0.5 - g) / f, 0.0, 1.0);
    float w = e * e * (3.0 - 2.0 * e) - b * b * (3.0 - 2.0 * b);
    return mix(la.xyz, lb.xyz, w) + vec3(0.0, lr.w * (sin(3.14159 * e) + sin(3.14159 * b)), 0.0);
  }
  float up = smoothstep(0.04, 0.55, ph) * (1.0 - smoothstep(0.8, 0.97, ph)), r = lb.x * smoothstep(0.0, 0.3, up);
  return la.xyz + vec3(r * cos(lb.z * a + s), lb.y * up, r * sin(lb.z * a + s));
}`;
const LIFE_VERTEX = /* glsl */`
  float lph = fract(uTime / la.w + lb.w), le = 0.03 / la.w;
  vec3 lp = lifeAt(lph), ld = lifeAt(fract(lph + le)) - lifeAt(fract(lph + 1.0 - le));
  float lbeat = max(lr.z, smoothstep(0.02, 0.09, length(ld)));
  vec3 lf = ld + 0.004 * vec3(cos(lq.w * 7.0), 0.0, sin(lq.w * 7.0));
  lf.y *= 0.6;
  lf = normalize(lf);
  vec3 lR = normalize(cross(vec3(0.0, 1.0, 0.0), lf)), lU = cross(lf, lR), lv = position, ln = normal;
  if (lq.y > 0.5) {
    float th = lr.y * lbeat * sin(6.2831853 * fract(uTime * lq.z) + lq.w * 3.0 + lr.w * 1.3), sx = sign(lv.x), wide = abs(lv.x) * mix(0.25, 1.0, lbeat);
    lv.x = sx * wide * cos(th);
    lv.y += wide * sin(th);
    ln = vec3(-sx * sin(th) * ln.y, cos(th) * ln.y, 0.0);
  }
  transformed = lp + lR * lv.x + lU * lv.y + lf * lv.z;
  vNormal = normalize(normalMatrix * normalize(lR * ln.x + lU * ln.y + lf * ln.z));`;
// the mesh of a list of creatures: { form, kind, c, r, T, phase, seed, hz, amp, still, f1, f2, light, size, tone }
export function makeLife(clock, list) {
  const P = [], N = [], C = [], A = [], B = [], Q = [], R = [], col = new THREE.Color(), n = new THREE.Vector3(), e1 = new THREE.Vector3(), e2 = new THREE.Vector3();
  let cur = null;
  // one face of the creature in hand, its winding and its normal agreeing; a body's face is turned outward
  const tri = (p, q, r, hex, wing) => {
    n.crossVectors(e1.set(q[0] - p[0], q[1] - p[1], q[2] - p[2]), e2.set(r[0] - p[0], r[1] - p[1], r[2] - p[2])).normalize();
    const out = wing ? n.y : n.x * (p[0] + q[0] + r[0]) + n.y * (p[1] + q[1] + r[1]) + n.z * (p[2] + q[2] + r[2] - 3 * cur.z0);
    if (out < 0) n.negate();
    col.set(hex);
    for (const v of out < 0 ? [p, r, q] : [p, q, r]) {
      P.push(v[0], v[1], v[2]); N.push(n.x, n.y, n.z); C.push(col.r, col.g, col.b, cur.light);
      A.push(cur.c[0], cur.c[1], cur.c[2], cur.T); B.push(cur.r[0], cur.r[1], cur.r[2], cur.phase);
      Q.push(cur.kind, wing ? 1 : 0, cur.hz || 0, cur.seed); R.push(cur.f1 || 0, cur.amp || 0, cur.still || 0, cur.f2 || 0);
    }
  };
  // a body of eight faces, its greatest girth at z0; back above, belly below
  const body = (L, W, H, z0, back, belly) => {
    const f = [0, 0, L], b = [0, 0, -L], r = [W, 0, z0], l = [-W, 0, z0], t = [0, H, z0], u = [0, -H, z0];
    cur.z0 = z0;
    tri(f, r, t, back); tri(f, t, l, back); tri(b, t, r, back); tri(b, l, t, back);
    tri(f, u, r, belly); tri(f, l, u, belly); tri(b, r, u, belly); tri(b, u, l, belly);
  };
  // two wings of two faces each, from the root x0 out to `span`, between zf and zb, swept by `sweep`
  const wings = (x0, span, zf, zb, y, hex, sweep) => {
    for (const s of [1, -1]) {
      tri([s * x0, y, zf], [s * x0, y, zb], [s * span * 0.55, y, zf + sweep], hex, true);
      tri([s * span * 0.55, y, zf + sweep], [s * x0, y, zb], [s * span, y, zb + sweep * 0.3], hex, true);
    }
  };
  const forms = {
    bee: () => { body(0.055, 0.032, 0.03, 0.008, '#33260f', '#c9962a'); wings(0.012, 0.075, 0.025, -0.02, 0.028, '#d5dadc', -0.015); },
    butterfly: () => { body(0.07, 0.012, 0.012, 0, '#3b3a36', '#55524a'); wings(0.008, 0.15, 0.075, -0.075, 0.006, '#f5f3ea', 0.02); },
    bird: (o) => {
      const S = o.size, t = o.tone;
      body(S, 0.42 * S, 0.38 * S, 0.25 * S, t[0], t[1]);
      tri([0, 0, -0.6 * S], [0.28 * S, 0, -1.6 * S], [-0.28 * S, 0, -1.6 * S], t[2]);
      wings(0.3 * S, o.span * S, 0.5 * S, -0.25 * S, 0.1 * S, t[2], -0.25 * S);
    },
    mote: (o) => { const d = o.size; cur.z0 = 0; tri([d, d, d], [d, -d, -d], [-d, d, -d], o.tone); tri([d, d, d], [-d, -d, d], [d, -d, -d], o.tone); tri([d, d, d], [-d, d, -d], [-d, -d, d], o.tone); tri([d, -d, -d], [-d, -d, d], [-d, d, -d], o.tone); },
  };
  for (const o of list) { cur = o; cur.z0 = 0; forms[o.form](o); }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
  for (const [name, arr] of [['lc', C], ['la', A], ['lb', B], ['lq', Q], ['lr', R]]) geometry.setAttribute(name, new THREE.Float32BufferAttribute(arr, 4));
  const material = drawnMaterial({ key: 'garden-life-1', uniforms: { ...clock }, vary: { lc: 'vec4' }, head: SHADE_GLSL, vertexHead: LIFE_GLSL, vertex: LIFE_VERTEX,
    color: 'diffuseColor.rgb = gShade(v_lc.rgb, min(v_lc.w, 1.0)); totalEmissiveRadiance += v_lc.rgb * (0.55 * step(1.5, v_lc.w) * gCloudLit(1.0));', extra: { side: THREE.DoubleSide } });
  const object = new THREE.Mesh(geometry, material);
  object.name = 'garden-life'; object.frustumCulled = false;
  return { object, geometry, material, triangles: P.length / 9 };
}

// ---------------------------------------------------------------- THE PLACES OF THE LIFE (G7 piece 3), each by place
// Every place is dealt once at the build, each kind from a stream of its own plain name (life-shafts, life-motes,
// life-bees, life-white, life-small, life-rooks, life-larks), and tested THERE against the flown line, the trunks
// and the bushes; nothing is placed by the lens. The shafts are laid first (their motes are of the life's one mesh).
// EVERY PHASE IS THE SEED'S. THE LARKS (G9b): ALL SIX BY ONE RULE, none typed: a foot dealt on the moor between 30 m
// behind the start and 7 m short of the boundary wall (x), 14 to 60 m to either hand of the entry's axis (z).
export const LIFE = {
  shafts: { r: [0.9, 1.3], len: [15, 20], least: 9, side: [7.5, 14], clear: 3.2, apart: 14, lit: 0.22, trunk: 0.9, each: 2, chair: [1.3, 16, 1.46], motes: 28, tries: 120 },
  // tall: the height of each border kind's form (FAR_END.kinds in their order); head: where on it the bees hang
  // white.clear: the least plan distance a pair's box keeps from the flown line: 2.5 m of clear air, the pair's radius
  // 0.45, a wing 0.17 and the half step 0.25 of the walk round the box's rim
  bees: { tree: 18, ring: [13, 18], arc: 1.7, over: [3, 10], border: 12, each: 3, head: [0.5, 0.9], tall: [5, 3.5, 2.5, 3.5, 1.7], edge: 6.2, apart: 3, toLine: 4.6, r: [0.8, 0.35, 0.8], T: [9, 17] },
  white: { pairs: 5, toLine: 5.8, best: [5.8, 13], r: [2.5, 0.7, 2.5], T: [22, 34], pair: 0.45, h: 2.1, trunk: 4.2, apart: 9, clear: 3.4 },
  small: { n: 6, span: [14, 38], T: [34, 58], speed: 9, over: 6, within: 6 },
  rooks: [[6, [10, 50], [88, 104], [36, 48], [14, 30]], [4, [150, 190], [96, 108], [50, 60], [12, 22]]],
  larks: { n: 6, x: [-150, -99], z: [14, 60], r: [3, 5], h: [34, 46], T: [60, 76] },
};
// THE SUNLIT GAPS' PLACES (the stream keeps its name, life-shafts): each a slant of lit air from a truly sunlit spot of the ground up along the sun
// (no wall's shade there, the trees' baked shade light at its foot and the darker about it the better: a gap in the
// boughs), clear of the flown line by its radius and LIFE.shafts.clear through all its length (it is cut short where
// it would come nearer), clear of every trunk and bush; the wheeled chair's first, through the chair itself.
// THEIR STRETCHES ARE PIECES OF THE LINE (G11): LIFE.shafts.each beside the left turn and the north-east straight
// (from the turn's first metre to the long arc's first), and as many beside the long arc (its first metre to its
// last). A try draws its place, then its radius, then its length, each only when the test before it has passed.
export function layShafts(o) {
  const { rule, route, rng, heightAt, sunAt, shadeAt, trees, mounds } = o, S = LIFE.shafts, sun = PLAN.sunTo, out = [];
  // the length a shaft may have from the ground point (x, z): 0 where a trunk or a bush stands in it
  const reach = (x, z, r, want, free) => {
    const y0 = heightAt(x, z);
    let len = want;
    for (let s = 0; s <= want; s += 1.5) {
      const px = x + sun[0] * s, py = y0 + sun[1] * s, pz = z + sun[2] * s, q = rule.toLine(px, pz);
      if (Math.hypot(q[0], py - q[1]) < r + S.clear) { len = s - 1.5; break; }
      if (free) continue;
      if (s <= 10.5 && trees.some((t) => Math.hypot(t.x - px, t.z - pz) < r + S.trunk)) return 0;
      if (mounds.some((m) => py - heightAt(m.x, m.z) < m.H + 0.5 && Math.hypot(m.x - px, m.z - pz) < m.R + 0.6 * r)) return 0;
    }
    return len >= S.least ? len : 0;
  };
  const put = (x, z, r, len) => out.push({ g: [x, heightAt(x, z), z], r, len, seed: rng.range(0, 6.28) });
  // the chair's: its foot within the chair's own pool of sun, of nine places the one whose axis passes the trunks
  // widest (the tree by the chair may stand at the beam's side: it is not asked to stand clear as the others are)
  const C = PLAN.chair, gap = (x, z) => { let g = 9; for (let s = 0; s <= 10.5; s += 1.5) for (const t of trees) g = Math.min(g, Math.hypot(t.x - x - sun[0] * s, t.z - z - sun[2] * s)); return g; };
  let cb = null;
  for (let i = 0; i < 9; i++) {
    const a = i * 0.7854, d = i < 8 ? 1.1 : 0, x = C[0] - sun[0] * S.chair[2] + Math.cos(a) * d, z = C[1] - sun[2] * S.chair[2] + Math.sin(a) * d, g = gap(x, z);
    if (!cb || g > cb[2]) cb = [x, z, g];
  }
  const cl = reach(cb[0], cb[1], S.chair[0], S.chair[1], true);
  if (cl) put(cb[0], cb[1], S.chair[0], cl);
  for (const [a, b] of [[route.leftTurn[0], route.longArc[0]], route.longArc]) {
    const cand = [], n = S.each;
    for (let k = 0; k < S.tries; k++) {
      const p = routeAt(route, rng.range(a, b)), side = rng.sign(), d = rng.range(...S.side);
      const x = p.x - Math.sin(p.th * RAD) * d * side, z = p.z + Math.cos(p.th * RAD) * d * side;
      if (sunAt(x, heightAt(x, z) + 0.05, z) < 0.9) continue;
      const r = rng.range(...S.r);
      // lit at its heart and at four places of its foot; the darker the ring about it, the better it shows
      let lit = shadeAt(x, z), ring = 0;
      for (let i = 0; i < 4; i++) lit = Math.max(lit, shadeAt(x + Math.cos(i * 1.5708) * 0.6 * r, z + Math.sin(i * 1.5708) * 0.6 * r));
      if (lit > S.lit) continue;
      for (let i = 0; i < 8; i++) ring += shadeAt(x + Math.cos(i * 0.7854) * (r + 2.6), z + Math.sin(i * 0.7854) * (r + 2.6)) / 8;
      const len = reach(x, z, r, rng.range(...S.len));
      if (len) cand.push({ x, z, r, len, ring });
    }
    cand.sort((p, q) => q.ring - p.ring);
    let got = 0;
    for (const c of cand) {
      if (got >= n) break;
      if (out.some((s) => Math.hypot(s.g[0] - c.x, s.g[2] - c.z) < S.apart)) continue;
      put(c.x, c.z, c.r, c.len); got++;
    }
  }
  return out;
}
// THE CREATURES' PLACES: the list for makeLife. Each kind deals from a stream of its own (o.stream); every box is tested against
// the flown line by its whole reach (a bee's knot 0.8 m, a pair's box 3 m about its point).
export function layLife(o) {
  const { rule, stream, heightAt, sunAt, shadeAt, grey, trees, lawns, far, shafts } = o, L = LIFE, list = [], sun = PLAN.sunTo, info = {}, TAU = Math.PI * 2;
  const lineAt = (x, z) => rule.toLine(x, z)[0], light = (x, y, z) => sunAt(x, y, z) * (1 - 0.6 * shadeAt(x, z));
  // the shafts' motes: slow knots within each column, glowing where they hang in the lit air
  const rm = stream('life-motes');
  for (const s of shafts) for (let i = 0; i < L.shafts.motes; i++) {
    const t = rm.range(2, 0.7 * s.len), a = rm.range(0, TAU), d = 0.4 * s.r * Math.sqrt(rm()), k = 0.3 * s.r;
    list.push({ form: 'mote', kind: 0, c: [s.g[0] + sun[0] * t + Math.cos(a) * d, s.g[1] + sun[1] * t, s.g[2] + sun[2] * t + Math.sin(a) * d], r: [k, 0.8 * k, k], T: rm.range(38, 80), phase: rm(), seed: rm.range(0, 6.28), light: 2, size: rm.range(0.022, 0.04), tone: '#ffe2a8' });   // (G10c: the key's own gold)
  }
  info.shafts = shafts.map((s) => [Math.round(s.g[0]), Math.round(s.g[2]), +s.len.toFixed(1)]);
  // bees about the great rose tree (at the crown's skirt on the side that faces the flown line, among the lower blooms
  // and the hanging curtains) and over the far end's borders: a few to a drift's blob, about its flower heads by the
  // height of its kind and on the blob's side toward the line, the nearest blobs first; all by place, none by the lens
  const rb = stream('life-bees'), B = L.bees, root = PLAN.roseTree;
  const bee = (x, y, z) => list.push({ form: 'bee', kind: 0, c: [x, y, z], r: B.r, T: rb.range(...B.T), phase: rb(), seed: rb.range(0, 6.28), hz: 11, amp: 0.7, still: 1, light: light(x, y, z) });
  const tl = rule.toLine(root[0], root[1]), face = Math.atan2(tl[3] - root[1], tl[2] - root[0]);
  let nb = 0, nf = 0;
  for (let k = 0; k < 200 && nb < B.tree; k++) {
    const a = face + rb.range(-B.arc, B.arc), d = rb.range(...B.ring), x = root[0] + Math.cos(a) * d, z = root[1] + Math.sin(a) * d;
    if (lineAt(x, z) < B.toLine || x > PLAN.garden.x1 - 2) continue;   // (its place first)
    bee(x, heightAt(x, z) + rb.range(...B.over), z); nb++;
  }
  const spots = [], took = [];
  for (const d of far) for (const b of d.blobs) spots.push([b[0], b[1], lineAt(b[0], b[1]), d.kind, b[2]]);
  spots.sort((p, q) => p[2] - q[2]);
  for (const s of spots) {
    if (took.length >= B.border) break;
    if (s[2] < B.toLine || took.some((t) => Math.hypot(t[0] - s[0], t[1] - s[1]) < B.apart)) continue;
    took.push(s);
    const tall = B.tall[s[3]] || 2.5, t = rule.toLine(s[0], s[1]), dx = (t[2] - s[0]) / Math.max(s[2], 0.01), dz = (t[3] - s[1]) / Math.max(s[2], 0.01);
    for (let i = 0; i < B.each; i++) {
      let x = s[0], z = s[1];
      for (let k = 0; k < 6; k++) {
        const a = rb.range(0, TAU), q = s[4] * 0.7 * Math.sqrt(rb()), px = s[0] + dx * s[4] * 0.3 + Math.cos(a) * q, pz = s[1] + dz * s[4] * 0.3 + Math.sin(a) * q;
        if (lineAt(px, pz) >= B.edge) { x = px; z = pz; break; }
      }
      bee(x, heightAt(x, z) + tall * rb.range(...B.head), z); nf++;
    }
  }
  info.bees = [nb, nf];
  // white butterflies in pairs over the bulb lawns: the two circle their own shared point, which wanders its box
  const rw = stream('life-white'), W = L.white, pairs = [], cand = [];
  for (const d of lawns) for (const b of [[d.cx, d.cz], ...d.blobs]) {
    const c = [b[0], b[1], lineAt(b[0], b[1])];
    if (c[2] >= W.toLine && !trees.some((t) => Math.hypot(t.x - c[0], t.z - c[1]) < W.trunk)) cand.push(c);
  }
  const rank = (c) => (c[2] >= W.best[0] && c[2] <= W.best[1] ? 0 : 1) + (c[0] >= 48 ? 0 : c[0] >= 30 ? 2 : 4);
  cand.sort((p, q) => rank(p) - rank(q) || p[2] - q[2]);
  for (const c of cand) {
    if (pairs.length >= W.pairs) break;
    if (pairs.some((p) => Math.hypot(p[0] - c[0], p[1] - c[1]) < W.apart)) continue;
    pairs.push(c);
    // CLEAR AIR BY PLACE (G8): the pair's shared point wanders its whole box, corners too. The box's rim is walked every
    // half metre in plan; where the whole box would come within W.clear of the flown line it is drawn in about its
    // own centre, a twentieth at a time, until it does not. No draw of the stream is added or moved by it.
    const rim = (k) => { let m = 1e9; for (let i = -5; i <= 5; i++) for (const [a, b] of [[i / 5, -1], [i / 5, 1], [-1, i / 5], [1, i / 5]]) m = Math.min(m, lineAt(c[0] + a * k * W.r[0], c[1] + b * k * W.r[2])); return m; };
    let kb = 1;
    while (kb > 0.4 && rim(kb) < W.clear) kb -= 0.05;
    c.push(kb);
    const y = heightAt(c[0], c[1]) + W.h, T = rw.range(...W.T), phase = rw(), seed = rw.range(0, 6.28), hz = rw.range(4.5, 6), lit = light(c[0], y, c[1]);
    for (const side of [0, 1]) list.push({ form: 'butterfly', kind: 0, c: [c[0], y, c[1]], r: [W.r[0] * kb, W.r[1], W.r[2] * kb], T, phase, seed, hz, amp: 1.0, still: 1, f1: W.pair, f2: side, light: lit });
  }
  info.white = pairs.map((c) => [Math.round(c[0]), Math.round(c[1]), +c[2].toFixed(1), +c[3].toFixed(2)]);
  // small birds between the tops of the old trees: each sits on a top, crosses to another, sits and crosses back
  const rs = stream('life-small'), Sm = L.small, tones = [['#5b5a48', '#c9b86a', '#3d3c38'], ['#6a5a4a', '#b9826a', '#3d3a36'], ['#4e5560', '#d9d2bd', '#33363c']], used = new Set();
  const tops = grey.map((t) => { let top = null; for (const b of t.built.limbs) for (const p of b.pts) if (!top || p[1] > top[1]) top = p; return top; }).filter(Boolean);
  let ns = 0;
  for (let k = 0; k < 400 && ns < Sm.n && tops.length > 1; k++) {
    const i = Math.floor(rs() * tops.length), j = Math.floor(rs() * tops.length);   // (its two tops first; a pair that the rules refuse draws no more)
    if (i === j || used.has(i) || used.has(j)) continue;
    const a = tops[i], b = tops[j], len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), plan = Math.hypot(b[0] - a[0], b[2] - a[2]), bow = 1.2 + 0.05 * len;
    if (plan < Sm.span[0] || plan > Sm.span[1]) continue;
    let ok = true;
    for (let s = 0; s <= 12 && ok; s++) {
      const f = s / 12, x = a[0] + (b[0] - a[0]) * f, z = a[2] + (b[2] - a[2]) * f, y = a[1] + (b[1] - a[1]) * f + bow * Math.sin(Math.PI * f), q = rule.toLine(x, z);
      if (q[0] < Sm.within && y - q[1] < Sm.over) ok = false;
    }
    if (!ok) continue;
    const T = rs.range(...Sm.T), phase = rs(), tone = tones[Math.floor(rs() * 3)], seed = rs.range(0, 6.28);
    used.add(i); used.add(j); ns++;
    list.push({ form: 'bird', kind: 2, c: [a[0], a[1] + 0.12, a[2]], r: [b[0], b[1] + 0.12, b[2]], T, phase, seed, hz: 8, amp: 0.9, still: 0, f1: Math.max(0.04, Math.min(0.3, len / Sm.speed / T)), f2: bow, light: 1, size: 0.22, span: 1.6, tone });
  }
  info.small = ns;
  // rooks circling over the far trees beyond the orchard and beyond the garden's south wall; every third the other way
  const rr = stream('life-rooks');
  for (const [n, xs, zs, ys, rad] of L.rooks) for (let i = 0; i < n; i++) {
    const r = rr.range(...rad), v = rr.range(8, 11);
    list.push({ form: 'bird', kind: 1, c: [rr.range(...xs), rr.range(...ys), rr.range(...zs)], r: [r, rr.range(2, 4), i % 3 === 2 ? -r : r], T: TAU * r / v, phase: rr(), seed: rr.range(0, 6.28), hz: 2.6, amp: 0.6, still: 1, light: 1, size: 0.8, span: 2.1, tone: ['#16161b', '#1b1b20', '#121216'] });
  }
  // larks over the moor: each climbs in a widening spiral over its own foot, hangs there, and drops back to it
  const rl = stream('life-larks'), K = L.larks;
  const lark = (x, z, r, phase) => list.push({ form: 'bird', kind: 3, c: [x, heightAt(x, z) + 0.3, z], r: [r, rl.range(...K.h), 5 + Math.floor(rl() * 3)], T: rl.range(...K.T), phase, seed: rl.range(0, 6.28), hz: 9, amp: 0.9, still: 0, light: 1, size: 0.3, span: 1.8, tone: ['#7a6a50', '#d8cdb0', '#6a5c46'] });
  for (let i = 0; i < K.n; i++) lark(rl.range(...K.x), PLAN.gateZ + rl.sign() * rl.range(...K.z), rl.range(...K.r), rl());
  list.info = info;
  return list;
}
// THE STANDING COLUMNS OF LIT AIR ARE TAKEN OUT (G10b, point 2). What stays of each sunlit gap in the boughs: the
// gap itself (the baked shade leaves its foot in the sun, the darker the ring about it the better: layShafts), the
// pool of sun on the wheeled chair, and the motes that hang and glow in the lit air along the sun's slant.




// ---------------------------------------------------------------- the orchard's long shadows across the walk
// The bare orchard trees south of the low wall throw the shadows of their boughs, branches and twigs across the walk: a
// lattice over the walk's own rectangle, one value a cell (how much of the sun is left there), filled ONCE at build
// from the trees' own limbs as the seed dealt them, and read by the walk's sheet. The cast runs on the ground in the
// sun's own direction and is drawn WALK_SHADE.stretch times as long as the plan's sun throws it (a drawn rule of
// place, said here: so the nearest rows' crowns reach across the whole width, as the plan asks), each limb's shadow
// WALK_SHADE.wide times the limb's own width (a drawn rule of place likewise: the line is flown 3.6 to 3.8 m over this ground). The low wall's own
// shade is the walls' (sunAt). Nothing here moves. (G10a: each limb's shadow keeps a softer edge only by its height,
// 0.05 m and 0.008 m a metre up; the thinnest limb's shadow is half as deep as a bough's (least); the twigs' haze is
// lighter: so the boughs' and branches' lines read on the gravel and the turf.)
export const WALK_SHADE = { w: 512, h: 128, x0: -92, x1: 0, z0: -11, z1: 11, stretch: 1.9, wide: 1.6, soft: 0.05, softPer: 0.008, deep: 0.95, least: 0.5, haze: 0.26, hazeMost: 0.45 };
export async function bakeWalkShade(casters, data, yieldNow) {
  const S = WALK_SHADE, W = S.w, Hh = S.h, cx = W / (S.x1 - S.x0), cz = Hh / (S.z1 - S.z0);
  const kx = -PLAN.sunTo[0] / PLAN.sunTo[1] * S.stretch, kz = -PLAN.sunTo[2] / PLAN.sunTo[1] * S.stretch;
  const core = new Float32Array(W * Hh), haze = new Float32Array(W * Hh);
  // one soft stroke on the ground from a to b (metres), half-width ra to rb, softness sf: by the greater, or added
  const stroke = (into, ax, az, bx, bz, ra, rb, sf, gain, add) => {
    const n = add ? 1 : Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 1.5));
    for (let i = 0; i < n; i++) {
      const t0 = i / n, t1 = (i + 1) / n, x0 = ax + (bx - ax) * t0, z0 = az + (bz - az) * t0, x1 = ax + (bx - ax) * t1, z1 = az + (bz - az) * t1;
      const r0 = ra + (rb - ra) * t0, r1 = ra + (rb - ra) * t1, pad = Math.max(r0, r1) + sf;
      const i0 = Math.max(0, Math.floor((Math.min(x0, x1) - pad - S.x0) * cx)), i1 = Math.min(W - 1, Math.ceil((Math.max(x0, x1) + pad - S.x0) * cx));
      const j0 = Math.max(0, Math.floor((Math.min(z0, z1) - pad - S.z0) * cz)), j1 = Math.min(Hh - 1, Math.ceil((Math.max(z0, z1) + pad - S.z0) * cz));
      if (i1 < i0 || j1 < j0) continue;
      const dx = x1 - x0, dz = z1 - z0, dd = dx * dx + dz * dz || 1e-9;
      for (let j = j0; j <= j1; j++) {
        const pz = S.z0 + (j + 0.5) / cz;
        for (let ii = i0; ii <= i1; ii++) {
          const px = S.x0 + (ii + 0.5) / cx, t = Math.max(0, Math.min(1, ((px - x0) * dx + (pz - z0) * dz) / dd));
          const d = Math.hypot(px - x0 - dx * t, pz - z0 - dz * t), r = r0 + (r1 - r0) * t;
          const v = gain * (1 - sstep(Math.max(0, r - sf), r + sf, d));
          if (v <= 0) continue;
          const q = j * W + ii;
          if (add) into[q] += v; else if (v > into[q]) into[q] = v;
        }
      }
    }
  };
  let k = 0;
  for (const c of casters) {
    if (c.pts) {
      const n = c.pts.length - 1;
      for (let i = 0; i < n; i++) {
        const a = c.pts[i], b = c.pts[i + 1], ra = S.wide * (c.r0 + (c.r1 - c.r0) * i / n), rb = S.wide * (c.r0 + (c.r1 - c.r0) * (i + 1) / n);
        const sf = S.soft + S.softPer * (a[1] + b[1]) / 2;
        stroke(core, a[0] + kx * a[1], a[2] + kz * a[1], b[0] + kx * b[1], b[2] + kz * b[1], ra, rb, sf, S.deep * Math.min(1, Math.max(S.least, 1.6 * (ra + rb) / (2 * sf))), false);
      }
    } else {
      // a spray of twigs: a thin soft blot drawn out along the cast
      const ya = c.p[1] - 0.25 * c.size, yb = c.p[1] + 0.45 * c.size;
      stroke(haze, c.p[0] + kx * ya, c.p[2] + kz * ya, c.p[0] + kx * yb, c.p[2] + kz * yb, 0.4 * c.size, 0.4 * c.size, 0.3 * c.size + 0.2, S.haze, true);
    }
    if (yieldNow && ++k % 100 === 0) await yieldNow(k === 100 ? 12 : k <= 300 ? 4 : 0.4);
  }
  for (let q = 0; q < data.length; q++) data[q] = Math.round(255 * (1 - core[q]) * (1 - Math.min(S.hazeMost, haze[q])));
}

// ---------------------------------------------------------------- a long mesh in bands (drawn by region)
// One long mesh cut into n meshes along one axis (2: z, 0: x) by its triangles' middles: the same material, the same
// triangles, drawn the same; but three's own test of each band's own sphere now leaves out the bands that lie
// behind the line's heading or off to a side of it (a wall 114 m long is otherwise drawn whole from any place inside its sphere). Nothing here reads
// the lens or the metres flown. Nothing is copied: the bands SHARE the old geometry's stores; each has its own index
// and its own sphere, taken from its own triangles (the caller frees the bands).
function bandsOf(mesh, n, axis) {
  const g = mesh.geometry, P = g.attributes.position.array, I = g.index.array, nt = I.length / 3;
  let lo = Infinity, hi = -Infinity;
  for (let i = axis; i < P.length; i += 3) { if (P[i] < lo) lo = P[i]; if (P[i] > hi) hi = P[i]; }
  const span = (hi - lo) / n || 1, band = new Uint8Array(nt), cnt = new Uint32Array(n), out = [];
  for (let t = 0, i = 0; t < nt; t++, i += 3) {
    const b = Math.max(0, Math.min(n - 1, Math.floor(((P[I[i] * 3 + axis] + P[I[i + 1] * 3 + axis] + P[I[i + 2] * 3 + axis]) / 3 - lo) / span)));
    band[t] = b; cnt[b] += 3;
  }
  const idxs = [], fill = new Uint32Array(n), B = new Float64Array(n * 6);
  for (let b = 0; b < n; b++) { idxs.push(new Uint32Array(cnt[b])); B.fill(Infinity, b * 6, b * 6 + 3); B.fill(-Infinity, b * 6 + 3, b * 6 + 6); }
  return { g, P, I, nt, n, band, cnt, idxs, fill, B, out };
}
function bandsFill(S, t0, t1) {
  const { P, I, band, idxs, fill, B } = S;
  for (let t = t0, i = t0 * 3; t < t1; t++, i += 3) {
    const b = band[t], q = b * 6, idx = idxs[b];
    let k = fill[b];
    for (let j = 0; j < 3; j++) {
      const v = I[i + j], o = v * 3, x = P[o], y = P[o + 1], z = P[o + 2];
      idx[k++] = v;
      if (x < B[q]) B[q] = x; if (y < B[q + 1]) B[q + 1] = y; if (z < B[q + 2]) B[q + 2] = z;
      if (x > B[q + 3]) B[q + 3] = x; if (y > B[q + 4]) B[q + 4] = y; if (z > B[q + 5]) B[q + 5] = z;
    }
    fill[b] = k;
  }
}
function bandsMeshes(S, mesh, pad) {
  const { g, n, cnt, idxs, B, out } = S;
  for (let b = 0; b < n; b++) {
    if (!cnt[b]) continue;
    const idx = idxs[b], q = b * 6, x0 = B[q], y0 = B[q + 1], z0 = B[q + 2], x1 = B[q + 3], y1 = B[q + 4], z1 = B[q + 5];
    const ng = new THREE.BufferGeometry();
    for (const name of Object.keys(g.attributes)) ng.setAttribute(name, g.attributes[name]);
    ng.setIndex(new THREE.BufferAttribute(idx, 1));
    ng.boundingSphere = new THREE.Sphere(new THREE.Vector3((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), Math.hypot(x1 - x0, y1 - y0, z1 - z0) / 2 + pad);
    const part = new THREE.Mesh(ng, mesh.material);
    part.name = mesh.name + '-' + 'abcdefgh'[b]; part.renderOrder = mesh.renderOrder;
    part.position.copy(mesh.position); part.quaternion.copy(mesh.quaternion); part.scale.copy(mesh.scale);
    out.push(part);
  }
  g.dispose();
  return out;
}
export function splitBands(mesh, n, axis = 2, pad = 1.5) {
  const S = bandsOf(mesh, n, axis);
  bandsFill(S, 0, S.nt);
  return bandsMeshes(S, mesh, pad);
}
// the same cut in three breaths, for a mesh of very many triangles (no own step over 50 ms)
export async function splitBandsAsync(mesh, n, axis, pad, yieldNow) {
  const S = bandsOf(mesh, n, axis), h = S.nt >> 1;
  await yieldNow(3.5);
  bandsFill(S, 0, h);
  await yieldNow(2);
  bandsFill(S, h, S.nt);
  return bandsMeshes(S, mesh, pad);
}

// ---------------------------------------------------------------- THE WEST CUT (G10b): what cannot show from the moor
// THE PLANE IS A PLACE (G11): THE KITCHEN GARDEN DOOR'S EAST JAMB (x -53.5, derived from the plan). While the eye
// stands west of it (the line's metres 0 to 66.5 and all behind the start: over the moor, through the gateway and
// along the walk until the kitchen door is passed; the moor's own near mesh then lies wholly behind the eye's plane)
// the garden's inside can show only OVER THE DOOR WALL'S TOP (y 12 along x 0), THROUGH THE OPEN DOORWAY or PAST
// THE DOOR WALL'S ENDS (G11: the wall ends at the garden's north and south walls; a sight that crosses its plane
// beyond an end is hidden by nothing of it, so whatever lies there counts as shown). splitWest
// cuts a mesh of the inside in two by its triangles, sharing its stores as the bands do: `shown` (a corner can show)
// and `hidden` (no corner can, from any eye place of those metres); the world draws `hidden` only while the eye
// stands east of that line. A cut by the eye's side of a typed plane; nothing here reads a distance.
// THE COUNT OF WHAT SHOWS, by true geometry: the eye's places are the line's metres 0 to 66.5, each WEST_CUT.eye m up,
// down and to either hand (the lens's own sway); a corner is allowed WEST_CUT.reach m of its own swing in the wind.
// OVER THE TOP: the lowest sight is from metre 0 (the eye highest there and farthest back), so a corner under the
// plane through that eye and the wall's top less the reach is under every sight. THROUGH THE DOORWAY (its half
// width and its height widened by 0.5 and 0.4 m and by the reach): a triangle's sights from the corners of the box
// that holds those eye places cross the door wall's plane within the bounds of its corners' crossings, so it is
// kept as `shown` whenever those bounds touch the doorway.
export const WEST_CUT = { x: PLAN.kitchenDoorX + PLAN.kitchenDoorHalf, top: 12, reach: 2.2, doorHalf: PLAN.doorHalf + 0.5, doorTop: PLAN.doorClear + 0.4, eye: 0.6 };
// the eye places' figures: the box that holds them (xa and xb m west of the door wall; the lowest lens height; the
// least and the greatest z), the plane of the lowest sight over the wall's top (T at the wall, rising s0 a metre)
export function westEye(route) {
  const W = WEST_CUT, xa = -PLAN.start[0], xb = -W.x, ya = lensOver(route, 0), T = W.top - W.reach;
  let yb = ya, z0 = 1e9, z1 = -1e9;
  for (let d = 0; d < 200; d += 2) { const p = routeAt(route, d); if (p.x > W.x + 0.01) break; yb = Math.min(yb, lensOver(route, d)); z0 = Math.min(z0, p.z); z1 = Math.max(z1, p.z); }
  return { xa, xb, T, s0: (T - ya - W.eye) / xa, z0: z0 - W.eye, z1: z1 + W.eye, yb: yb - W.eye, dz: W.doorHalf + W.reach, n0: PLAN.garden.z0 + W.reach, n1: PLAN.garden.z1 - W.reach };
}
// whether one point of the inside can show from those eye places (over the top, or through the doorway)
export function westShows(E, x, y, z) {
  if (x < 0.5 || y > E.T + E.s0 * x) return true;
  const fa = E.xa / (x + E.xa), fb = E.xb / (x + E.xb), yr = y - WEST_CUT.reach;
  const lo = Math.min(E.z0 * (1 - fa) + z * fa, E.z0 * (1 - fb) + z * fb), hi = Math.max(E.z1 * (1 - fa) + z * fa, E.z1 * (1 - fb) + z * fb);
  return lo < E.n0 || hi > E.n1 || (lo < E.dz && hi > -E.dz && Math.min(E.yb * (1 - fa) + yr * fa, E.yb * (1 - fb) + yr * fb) < WEST_CUT.doorTop);
}
function* westSteps(mesh, route) {
  const W = WEST_CUT, g = mesh.geometry, P = g.attributes.position.array, I = g.index.array, nt = I.length / 3, nv = P.length / 3;
  const { xa, xb, T, s0, z0, z1, yb, dz, n0, n1 } = westEye(route), over = new Uint8Array(nv), zlo = new Float32Array(nv), zhi = new Float32Array(nv), ylo = new Float32Array(nv);
  const corners = (i0, i1) => { for (let i = i0, o = i0 * 3; i < i1; i++, o += 3) {
    // (G12: each pass is a plain function over a run of corners or triangles, called by this stepped one: the same statements in the same order. A long loop inside a stepped function ran slowly on its first calls. Each step hands out its own work as a count: so many corners or triangles at a typed figure each.)
    const x = P[o], y = P[o + 1], z = P[o + 2];
    if (x < 0.5 || y > T + s0 * x) { over[i] = 1; continue; }
    const fa = xa / (x + xa), fb = xb / (x + xb);
    zlo[i] = Math.min(z0 * (1 - fa) + z * fa, z0 * (1 - fb) + z * fb); zhi[i] = Math.max(z1 * (1 - fa) + z * fa, z1 * (1 - fb) + z * fb);
    if (zlo[i] < n0 || zhi[i] > n1) { over[i] = 1; continue; }   // (past an end of the door wall)
    ylo[i] = Math.min(yb * (1 - fa) + (y - W.reach) * fa, yb * (1 - fb) + (y - W.reach) * fb);
  } };
  for (let i = 0; i < nv; i += 32768) { corners(i, Math.min(nv, i + 32768)); yield Math.min(32768, nv - i) * 0.00008; }
  const hid = new Uint8Array(nt), cnt = [0, 0];
  const hide = (t0, t1) => { for (let t = t0, i = t0 * 3; t < t1; t++, i += 3) {
    // (a triangle is hidden when no corner of it can show over the wall, past its ends or through the doorway)
    const a = I[i], b = I[i + 1], c = I[i + 2];
    const h = !(over[a] || over[b] || over[c]) && !(Math.min(zlo[a], zlo[b], zlo[c]) < dz && Math.max(zhi[a], zhi[b], zhi[c]) > -dz && Math.min(ylo[a], ylo[b], ylo[c]) < W.doorTop);
    hid[t] = h ? 1 : 0; cnt[hid[t]] += 3;
  } };
  for (let t = 0; t < nt; t += 32768) { hide(t, Math.min(nt, t + 32768)); yield Math.min(32768, nt - t) * 0.00008; }
  const idx = [new Uint32Array(cnt[0]), new Uint32Array(cnt[1])], fill = [0, 0], B = [[1e9, 1e9, 1e9, -1e9, -1e9, -1e9], [1e9, 1e9, 1e9, -1e9, -1e9, -1e9]], out = { shown: null, hidden: null, triangles: [cnt[0] / 3, cnt[1] / 3] };
  const sort = (t0, t1) => { for (let t = t0, i = t0 * 3; t < t1; t++, i += 3) {
    const k = hid[t], q = B[k], ix = idx[k];
    for (let j = 0; j < 3; j++) {
      const v = I[i + j], o = v * 3;
      ix[fill[k]++] = v;
      for (let e = 0; e < 3; e++) { const p = P[o + e]; if (p < q[e]) q[e] = p; if (p > q[e + 3]) q[e + 3] = p; }
    }
  } };
  for (let t = 0; t < nt; t += 32768) { sort(t, Math.min(nt, t + 32768)); yield Math.min(32768, nt - t) * 0.00008; }
  for (const k of [0, 1]) {
    if (!cnt[k]) continue;
    const q = B[k], ng = new THREE.BufferGeometry();
    for (const name of Object.keys(g.attributes)) ng.setAttribute(name, g.attributes[name]);
    ng.setIndex(new THREE.BufferAttribute(idx[k], 1));
    ng.boundingSphere = new THREE.Sphere(new THREE.Vector3((q[0] + q[3]) / 2, (q[1] + q[4]) / 2, (q[2] + q[5]) / 2), Math.hypot(q[3] - q[0], q[4] - q[1], q[5] - q[2]) / 2 + W.reach);
    const part = new THREE.Mesh(ng, mesh.material);
    part.name = mesh.name + (k ? '-inner' : '-seen'); part.renderOrder = mesh.renderOrder; part.frustumCulled = mesh.frustumCulled;
    part.position.copy(mesh.position); part.quaternion.copy(mesh.quaternion); part.scale.copy(mesh.scale);
    out[k ? 'hidden' : 'shown'] = part;
  }
  g.dispose();
  return out;
}
// the cut at once, and the same cut in breaths (between its passes and every 32768 corners or triangles of a pass)
// for a mesh of very many triangles (G11: the same result)
export function splitWest(mesh, route) { const it = westSteps(mesh, route); let r = it.next(); while (!r.done) r = it.next(); return r.value; }
export async function splitWestAsync(mesh, route, yieldNow) { const it = westSteps(mesh, route); let r = it.next(); while (!r.done) { await yieldNow(r.value); r = it.next(); } return r.value; }

// ================================================================ THE GARDEN INSIDE (step G4 on)
// ---------------------------------------------------------------- the kit's flora in this world (step G4b)
// The old trees, their climbing canes and the hanging roses are ONE mesh drawn by the kit's ONE wind material. This
// buffer gives every vertex the kit's attributes (position, normal, color in linear light, uv into the kit's atlas, wind:
// sway in metres, flutter, leaf mask, glow), so the kit's bark is drawn on the wood and the kit's one wind moves it all.
// FLORA.swing is this part's bound on a vertex's throw per metre of its `sway` at the strongest wind the world sets,
// FLORA.flutter the bound of a card's flutter in metres: the rule of place is counted with them.
export const FLORA = { woodUV: [0.88, 0.75], swing: 2.0, flutter: 0.3 };
const linRGB = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
export function makeFloraBuf() {
  // typed stores that grow by doubling: nv vertices of room for cap, ni indices of room for icap
  let cap = 16384, P = new Float32Array(cap * 3), N = new Float32Array(cap * 3), C = new Float32Array(cap * 3), U = new Float32Array(cap * 2), Wd = new Float32Array(cap * 4), nv = 0;
  let icap = 65536, I = new Uint32Array(icap), ni = 0;
  const TAU = Math.PI * 2, grown = (a, n) => { const b = new a.constructor(n); b.set(a); return b; };
  const room = () => { cap *= 2; P = grown(P, cap * 3); N = grown(N, cap * 3); C = grown(C, cap * 3); U = grown(U, cap * 2); Wd = grown(Wd, cap * 4); };
  const iroom = (n) => { while (ni + n > icap) icap *= 2; I = grown(I, icap); };
  const F = { count: () => ni / 3 };
  const put = (p, n, c, u, v, sway, flut, mask) => {
    if (nv === cap) room();
    const a = nv * 3, b = nv * 2, d = nv * 4;
    P[a] = p[0]; P[a + 1] = p[1]; P[a + 2] = p[2]; N[a] = n[0]; N[a + 1] = n[1]; N[a + 2] = n[2]; C[a] = c[0]; C[a + 1] = c[1]; C[a + 2] = c[2];
    U[b] = u; U[b + 1] = v; Wd[d] = sway; Wd[d + 1] = flut; Wd[d + 2] = mask; Wd[d + 3] = 0;
    return nv++;
  };
  const six = (a, b, c, d, e, g) => { if (ni + 6 > icap) iroom(6); I[ni] = a; I[ni + 1] = b; I[ni + 2] = c; I[ni + 3] = d; I[ni + 4] = e; I[ni + 5] = g; ni += 6; };
  // a limb: rings round the points `pts`; rad(i, a) is the radius of ring i at the angle a (so a foot can be fluted),
  // col(p, n, i, a) its colour, sway(i) its sway in metres; `tip` closes the last ring to a point
  F.tube = (pts, sides, rad, col, sway, tip, mask = 0) => {
    const n = pts.length, base = nv;
    let ref = null;
    for (let i = 0; i < n; i++) {
      const T = v3.norm(v3.add(pts[Math.min(n - 1, i + 1)], pts[Math.max(0, i - 1)], -1));
      if (!ref) ref = v3.norm(v3.cross(T, Math.abs(T[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0]));
      else { const d = ref[0] * T[0] + ref[1] * T[1] + ref[2] * T[2]; ref = v3.norm(v3.add(ref, T, -d)); }
      const S = v3.cross(T, ref), sw = sway(i);
      for (let k = 0; k < sides; k++) {
        const an = TAU * k / sides, cs = Math.cos(an), sn = Math.sin(an), nr = [ref[0] * cs + S[0] * sn, ref[1] * cs + S[1] * sn, ref[2] * cs + S[2] * sn];
        const p = v3.add(pts[i], nr, tip && i === n - 1 ? 0.004 : rad(i, an));
        put(p, nr, col(p, nr, i, an), FLORA.woodUV[0], FLORA.woodUV[1], sw, 0, mask);
      }
    }
    for (let i = 0; i + 1 < n; i++) for (let k = 0; k < sides; k++) {
      const a = base + i * sides + k, b = base + i * sides + (k + 1) % sides, c = a + sides, d = b + sides;
      six(a, b, c, b, d, c);
    }
  };
  // an alpha-cut card of the kit's atlas from `a` (the cell's root) to `b` (its tip), w0 and w1 wide, facing `face`
  // (nrm, when given, is the normal it is lit by: a crown's cards are lit as one soft body); c0, c1 its colours and
  // s0, s1 its sway at root and tip
  F.card = (a, b, w0, w1, face, cell, c0, c1, s0, s1, flut, nrm) => {
    const T = v3.add(b, a, -1), S = v3.norm(v3.cross(T, face)), nr = nrm || v3.norm(v3.cross(S, T)), [u0, vt, u1, vr] = cell;
    const i0 = put(v3.add(a, S, -w0 / 2), nr, c0, u0, vr, s0, flut * 0.3, 1), i1 = put(v3.add(a, S, w0 / 2), nr, c0, u1, vr, s0, flut * 0.3, 1);
    const i2 = put(v3.add(b, S, -w1 / 2), nr, c1, u0, vt, s1, flut, 1), i3 = put(v3.add(b, S, w1 / 2), nr, c1, u1, vt, s1, flut, 1);
    six(i0, i1, i2, i1, i3, i2);
  };
  // a piece can be built, tried against the rule of place and dropped again
  F.mark = () => [nv, ni];
  F.rewind = (m) => { nv = m[0]; ni = m[1]; };
  // a geometry of the kit's whose places are the world's (a vine between its anchors), taken in whole
  F.take = (g) => {
    const base = nv, A = g.attributes, cs = A.color.itemSize, n = A.position.count, gi = g.index.array;
    for (let i = 0; i < n; i++) {
      if (nv === cap) room();
      const a = nv * 3, b = nv * 2, d = nv * 4;
      P[a] = A.position.getX(i); P[a + 1] = A.position.getY(i); P[a + 2] = A.position.getZ(i); N[a] = A.normal.getX(i); N[a + 1] = A.normal.getY(i); N[a + 2] = A.normal.getZ(i);
      C[a] = A.color.array[i * cs]; C[a + 1] = A.color.array[i * cs + 1]; C[a + 2] = A.color.array[i * cs + 2]; U[b] = A.uv.getX(i); U[b + 1] = A.uv.getY(i);
      Wd[d] = A.wind.array[i * 4]; Wd[d + 1] = A.wind.array[i * 4 + 1]; Wd[d + 2] = A.wind.array[i * 4 + 2]; Wd[d + 3] = A.wind.array[i * 4 + 3];
      nv++;
    }
    if (ni + gi.length > icap) iroom(gi.length);
    for (let i = 0; i < gi.length; i++) I[ni++] = base + gi[i];
    g.dispose();
  };
  // every vertex from a mark on with its reach at the strongest wind: cb(x, y, z, reach)
  F.each = (cb, m) => {
    for (let i = m ? m[0] : 0; i < nv; i++) cb(P[i * 3], P[i * 3 + 1], P[i * 3 + 2], Wd[i * 4] * FLORA.swing + (Wd[i * 4 + 2] > 0 ? Wd[i * 4 + 1] * FLORA.flutter : 0));
  };
  // the colour of every vertex from a mark on, by col(p, n)
  F.paint = (m, col) => {
    for (let i = m[0]; i < nv; i++) { const c = col([P[i * 3], P[i * 3 + 1], P[i * 3 + 2]], [N[i * 3], N[i * 3 + 1], N[i * 3 + 2]]); C[i * 3] = c[0]; C[i * 3 + 1] = c[1]; C[i * 3 + 2] = c[2]; }
  };
  // a plain triangle on the atlas's opaque block (a petal, a blade), lit by `nrm` when given: colours and sways at
  // its three corners
  F.tri = (a, b, c, ca, cb, cc, sa, sb, sc, flut, nrm, mk = 1) => {
    const nr = nrm || v3.norm(v3.cross(v3.add(b, a, -1), v3.add(c, a, -1)));
    if (ni + 3 > icap) iroom(3);
    I[ni++] = put(a, nr, ca, FLORA.woodUV[0], FLORA.woodUV[1], sa, flut, mk); I[ni++] = put(b, nr, cb, FLORA.woodUV[0], FLORA.woodUV[1], sb, flut, mk); I[ni++] = put(c, nr, cc, FLORA.woodUV[0], FLORA.woodUV[1], sc, flut, mk);
  };
  // a smooth body: its own vertices (their own normals) and faces over them (a mound of rose)
  F.vert = (p, n, c, sway = 0, flut = 0, mask = 1) => put(p, n, c, FLORA.woodUV[0], FLORA.woodUV[1], sway, flut, mask);
  F.face = (i, j, k) => { if (ni + 3 > icap) iroom(3); I[ni++] = i; I[ni++] = j; I[ni++] = k; };
  F.geometry = () => F.build('', null).geometry;
  F.build = (name, material) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(P.slice(0, nv * 3), 3)); g.setAttribute('normal', new THREE.BufferAttribute(N.slice(0, nv * 3), 3));
    g.setAttribute('color', new THREE.BufferAttribute(C.slice(0, nv * 3), 3)); g.setAttribute('uv', new THREE.BufferAttribute(U.slice(0, nv * 2), 2));
    g.setAttribute('wind', new THREE.BufferAttribute(Wd.slice(0, nv * 4), 4)); g.setIndex(new THREE.BufferAttribute(I.slice(0, ni), 1));
    g.computeBoundingSphere(); g.boundingSphere.radius += 3;
    const mesh = new THREE.Mesh(g, material);
    mesh.name = name;
    return { object: mesh, geometry: g, triangles: ni / 3 };
  };
  return F;
}

// A breath hands the page some milliseconds whatever was built before it, so a builder takes one only when it has done
// enough since its last: counted in work (done(): triangles built, or rounds), never in time. (G12) It says that work to the asker as a count: `usual` for every `every` done, `cold` more at its first ask (cold code runs slower); breathe(true) asks whatever was done, and may name the piece that follows.
export const breathAfter = (yieldNow, done, every, usual = 4, cold = 0) => { let at = done(); return async (now = false, next = 0) => { const n = done(); if (yieldNow && (now || n - at >= every)) { const w = usual * (n - at) / every + cold; at = n; cold = 0; await yieldNow(w, next); } }; };

// ---------------------------------------------------------------- the grey's own atlas: bare twig and hanging rose
// The kit's atlas holds leaves and no bare twig (at a twig spray's size its cells read as paddles), so the grey's mesh is
// drawn by a second instance of the kit's wind material (the same wind, the same options) whose map is this sheet:
// alpha-cut cells of fine bare twig, of hanging canes (bare, veiled with first green, in leaf), a leafy shoot and a
// bloom spray, the blossom's cloud, and in its heart an opaque dab where the kit's wood uv (0.88, 0.75) falls. A cell's root is its low edge (v), its
// tip its high edge; cells are listed as the kit lists its own: [u0, v at the tip, u1, v at the root]. The same on every
// seed (its own small generator). The mips keep each cell's coverage at the cut, so a far crown stays a haze.
export const TWIG_ATLAS = { size: 1024, cut: 0.4, rects: { hangA: [0, 0, 256, 512], hangB: [256, 0, 256, 512], veil: [512, 0, 256, 512], leaf: [768, 0, 256, 512],
  twigA: [0, 512, 256, 256], twigB: [256, 512, 256, 256], twigC: [512, 512, 256, 256], shoot: [0, 768, 256, 256], bloom: [256, 768, 256, 256], bud: [512, 768, 256, 256],
  heads: [768, 512, 256, 192], mass: [768, 832, 256, 192], puff: [768, 704, 256, 128] } };
export const TWIG_CELLS = Object.fromEntries(Object.entries(TWIG_ATLAS.rects).map(([k, [x, y, w, h]]) => [k, [(x + 2) / 1024, (y + h - 2) / 1024, (x + w - 2) / 1024, (y + 2) / 1024]]));
function makeInk(size) {
  const A = new Float32Array(size * size), R = new Uint8Array(size * size * 3);
  let clip = [0, 0, size, size], seed = 20240613;
  const K = { A, R, size };
  // the atlas's own generator (G8b): numbers of our own (the route's 321.40 m and 45.24 s; the ring at 149.16 and 45.21); its round is whole
  K.rnd = () => { seed = (Math.imul(seed, 3214045241) + 1491645213) >>> 0; return seed / 4294967296; };
  // a cell is cleared to its ink's colour (so no dark fringe is filtered in) and strokes are held 3 px inside it
  K.cell = ([x, y, w, h], rgb, alpha = 0) => {
    clip = [x + 3, y + 3, x + w - 3, y + h - 3];
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) { const q = j * size + i; A[q] = alpha; R[q * 3] = rgb[0]; R[q * 3 + 1] = rgb[1]; R[q * 3 + 2] = rgb[2]; }
  };
  // a tapered stroke, w0 to w1 px wide, soft by one px; later ink lies over earlier ink
  K.stroke = (x0, y0, x1, y1, w0, w1, rgb) => {
    const m = Math.max(w0, w1) / 2 + 1, dx = x1 - x0, dy = y1 - y0, l2 = dx * dx + dy * dy || 1e-6;
    const ax = Math.max(clip[0], Math.floor(Math.min(x0, x1) - m)), bx = Math.min(clip[2] - 1, Math.ceil(Math.max(x0, x1) + m));
    const ay = Math.max(clip[1], Math.floor(Math.min(y0, y1) - m)), by = Math.min(clip[3] - 1, Math.ceil(Math.max(y0, y1) + m));
    for (let j = ay; j <= by; j++) {
      // of this row only the pixels within m of the stroke's stretch that lies within m of the row
      const py = j + 0.5 - y0;
      let ia = ax, ib = bx;
      if (Math.abs(dy) > 1e-9) {
        const fa = (py - m) / dy, fb = (py + m) / dy, lo = Math.max(0, Math.min(fa, fb)), hi = Math.min(1, Math.max(fa, fb));
        if (lo > hi) continue;
        const xa = x0 + dx * lo, xb = x0 + dx * hi;
        ia = Math.max(ax, Math.floor(Math.min(xa, xb) - m)); ib = Math.min(bx, Math.ceil(Math.max(xa, xb) + m));
      }
      for (let i = ia; i <= ib; i++) {
        const px = i + 0.5 - x0, f = Math.max(0, Math.min(1, (px * dx + py * dy) / l2)), qx = px - dx * f, qy = py - dy * f, d = Math.sqrt(qx * qx + qy * qy);
        const a = Math.max(0, Math.min(1, (w0 + (w1 - w0) * f) / 2 + 0.5 - d)), q = j * size + i;
        if (a > 0 && a >= A[q]) { A[q] = a; R[q * 3] = rgb[0]; R[q * 3 + 1] = rgb[1]; R[q * 3 + 2] = rgb[2]; }
      }
    }
  };
  return K;
}
// the sheet's levels from its ink: each level the mean of the one above (colour weighed by alpha), its alpha then
// raised cell by cell until as much of the cell passes the cut as passes it in the ink itself
// (plain functions: a long loop in the body of an async function runs slowly)
// one level's bytes: the colour as it stands, the alpha rounded (times the cell's gain where one is laid)
function inkFill(data, c, a, gain, n) {
  if (gain) for (let q = 0, q3 = 0, q4 = 0; q < n; q++, q3 += 3, q4 += 4) { data[q4] = c[q3]; data[q4 + 1] = c[q3 + 1]; data[q4 + 2] = c[q3 + 2]; data[q4 + 3] = Math.min(255, (255 * a[q] * gain[q] + 0.5) | 0); }
  else for (let q = 0, q3 = 0, q4 = 0; q < n; q++, q3 += 3, q4 += 4) { data[q4] = c[q3]; data[q4 + 1] = c[q3 + 1]; data[q4 + 2] = c[q3 + 2]; data[q4 + 3] = (255 * a[q] + 0.5) | 0; }
}
// the next level: alpha the mean of four, colour their mean weighted by alpha (their plain mean where none is inked)
// (rows j0 to j1 of the new level; `into`: the level begun by an earlier call)
function inkHalve(a, c, w, j0 = 0, j1 = w >> 1, into = null) {
  const h = w >> 1, a2 = into ? into[0] : new Float32Array(h * h), c2 = into ? into[1] : new Float32Array(h * h * 3);
  for (let j = j0, q2 = j0 * h; j < j1; j++) for (let i = 0, qa = j * 2 * w; i < h; i++, qa += 2, q2++) {
    const qc = qa + w, a0 = a[qa], a1 = a[qa + 1], a2v = a[qc], a3 = a[qc + 1], sa = a0 + a1 + a2v + a3, o3 = q2 * 3, pa = qa * 3, pc = qc * 3;
    a2[q2] = sa / 4;
    if (sa > 0.01) {
      c2[o3] = (a0 * c[pa] + a1 * c[pa + 3] + a2v * c[pc] + a3 * c[pc + 3]) / sa; c2[o3 + 1] = (a0 * c[pa + 1] + a1 * c[pa + 4] + a2v * c[pc + 1] + a3 * c[pc + 4]) / sa;
      c2[o3 + 2] = (a0 * c[pa + 2] + a1 * c[pa + 5] + a2v * c[pc + 2] + a3 * c[pc + 5]) / sa;
    } else { c2[o3] = (c[pa] + c[pa + 3] + c[pc] + c[pc + 3]) / 4; c2[o3 + 1] = (c[pa + 1] + c[pa + 4] + c[pc + 1] + c[pc + 4]) / 4; c2[o3 + 2] = (c[pa + 2] + c[pa + 5] + c[pc + 2] + c[pc + 5]) / 4; }
  }
  return [a2, c2];
}
// a cell's gain at a level: the alpha that as great a share of the cell reaches as passes the cut in the ink, by a
// count in 4096 steps
function inkGain(a, gain, w, x0, y0, nw, nh, want, cut, s0 = 0, s1 = 0) {
  const hist = new Uint32Array(4097);
  for (let j = 0; j < nh; j++) for (let i = 0; i < nw; i++) hist[j >= s0 && j < s1 ? 4096 : Math.min(4096, Math.floor(a[(y0 + j) * w + x0 + i] * 4096))]++;
  let b = 4096, over = hist[4096];
  while (b > 0 && over < want) { b--; over += hist[b]; }
  const q = b / 4096, k = Math.max(1, q > 0.02 ? Math.min(6, cut * 1.02 / q) : 6);
  for (let j = 0; j < nh; j++) for (let i = 0; i < nw; i++) gain[(y0 + j) * w + x0 + i] = k;
}
async function inkLevels(K, yieldNow) {
  // the right-hand column (heads, the blossom's cell, mass) shares one gain, taken as when its middle block was plain
  // and solid: rows 192 to 320 of it count as solid; the blossom's cell then takes its own gain, last
  const cut = TWIG_ATLAS.cut, R0 = TWIG_ATLAS.rects, rects = [...Object.keys(R0).filter((k) => k !== 'puff').map((k) => R0[k]), [768, 512, 256, 512], R0.puff], levels = [], col = rects.length - 2;
  let w = K.size, a = K.A, c = K.R;
  const coverOf = ([x, y, cw, ch], r) => { let n = 0; for (let j = y; j < y + ch; j++) for (let i = x; i < x + cw; i++) if (a[j * w + i] > cut || (r === col && j >= 704 && j < 832)) n++; return n / (cw * ch); };
  const cover = [];
  for (let r = 0; r < rects.length; r++) { cover.push(coverOf(rects[r], r)); if (yieldNow && r === (rects.length >> 1)) await yieldNow(10.5, 6.5); }
  if (yieldNow) await yieldNow(6.5, 12);
  for (let lv = 0; w >= 1; lv++) {
    const data = new Uint8Array(w * w * 4), gain = lv > 0 && lv < 6 ? new Float32Array(w * w).fill(1) : null, s = K.size / w;
    if (lv > 0 && lv < 6) for (let r = 0; r < rects.length; r++) {
      if (cover[r] > 0.97 || cover[r] <= 0) continue;
      const [x, y, cw, ch] = rects[r];
      inkGain(a, gain, w, x / s, y / s, cw / s, ch / s, (cw / s) * (ch / s) * cover[r], cut, r === col ? 192 / s : 0, r === col ? 320 / s : 0);
    }
    inkFill(data, c, a, gain, w * w);
    levels.push({ data, width: w, height: w });
    if (w === 1) break;
    if (yieldNow && w >= 512) await yieldNow(12, 12.5);
    let half;
    if (yieldNow && w >= 1024) { half = inkHalve(a, c, w, 0, w >> 2); await yieldNow(12.5); inkHalve(a, c, w, w >> 2, w >> 1, half); } else half = inkHalve(a, c, w);
    w >>= 1; a = half[0]; c = half[1];
    if (yieldNow && w >= 256) await yieldNow(w >= 512 ? 3.5 : 12.5);
  }
  return levels;
}
export async function makeTwigAtlas(yieldNow = null) {
  const K = makeInk(TWIG_ATLAS.size), rects = TWIG_ATLAS.rects, rr = (a, b) => a + (b - a) * K.rnd(), pick = (l) => l[Math.floor(K.rnd() * l.length)];
  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const WOOD = ['#8a7f74', '#a39686', '#6f665c', '#b5a68c', '#94836c'].map(hex), GREEN = ['#7fa04a', '#5f8a3a', '#9ab65c'].map(hex), BUD = ['#a9b86a', '#8fae58', '#b98a62'].map(hex);
  const ROSE = ['#f6efe2', '#f1d3cb', '#e7a6aa'].map(hex), HEART = hex('#d9b25a');
  // one cane or twig from (x, y) heading a (0 runs to the cell's tip), len px long and w px wide at its root: it wanders,
  // is drawn back toward the tip by `fall`, throws side twigs and forks at its end while `depth` lasts; `deco` clothes it
  const cane = (x, y, a, len, w, col, depth, o) => {
    const n = Math.max(2, Math.round(len / o.step)), l = len / n;
    for (let i = 0; i < n; i++) {
      const f1 = (i + 1) / n, w0 = w * (1 - 0.6 * i / n), w1 = w * (1 - 0.6 * f1);
      a += rr(-o.wander, o.wander) - a * o.fall;
      const x1 = x + Math.sin(a) * l, y1 = y + Math.cos(a) * l;
      K.stroke(x, y, x1, y1, w0, w1, col);
      x = x1; y = y1;
      if (depth > 0 && i > 0 && K.rnd() < o.side) cane(x, y, a + (K.rnd() < 0.5 ? -1 : 1) * rr(0.35, 0.95), len * (1 - f1) * rr(0.45, 0.85) + o.step * 2, Math.max(1.3, w1 * 0.7), col, depth - 1, o);
      if (o.deco && K.rnd() < o.decoEach) o.deco(x, y, a);
    }
    if (depth > 0) for (const s of [-1, 1]) cane(x, y, a + s * rr(0.2, 0.6), len * rr(0.3, 0.55), Math.max(1.3, w * 0.4), col, depth - 1, o);
  };
  const leafAt = (x, y, a, L = 8) => { for (const s of [-1, 1]) { const b = a + s * rr(0.7, 1.4), l = L * rr(0.7, 1.2); K.stroke(x, y, x + Math.sin(b) * l, y + Math.cos(b) * l, 5, 1.6, pick(GREEN)); } };
  const budAt = (x, y, a) => { const b = a + rr(-1.2, 1.2), l = rr(2, 4.5); K.stroke(x, y, x + Math.sin(b) * l, y + Math.cos(b) * l, 3.6, 2.2, pick(BUD)); };
  const bloomAt = (x, y) => { const r = rr(4, 6.5), c = pick(ROSE); for (let k = 0; k < 5; k++) { const b = k * 1.257 + rr(0, 0.5); K.stroke(x + Math.sin(b) * r * 0.5, y + Math.cos(b) * r * 0.5, x + Math.sin(b) * r * 0.5, y + Math.cos(b) * r * 0.5, r * 1.1, r * 1.1, c); } K.stroke(x, y, x, y, r * 0.55, r * 0.55, HEART); };
  // a spray: canes fanned from the middle of the cell's root edge
  const spray = (name, canes, o) => {
    const [x, y, w, h] = rects[name];
    K.cell(rects[name], WOOD[0]);
    for (let i = 0; i < canes; i++) cane(x + w / 2 + rr(-3, 3), y + 4, (canes > 1 ? -o.fan + 2 * o.fan * i / (canes - 1) : 0) + rr(-0.12, 0.12), h * rr(o.len[0], o.len[1]), rr(o.w[0], o.w[1]), pick(WOOD), o.depth, o);
  };
  // a fall: canes of unlike length and thickness rooted along the whole root edge, hanging to the tip
  const fall = (name, canes, o) => {
    const [x, y, w, h] = rects[name];
    K.cell(rects[name], WOOD[0]);
    // every third cane is a stout long one, the others fine and of unlike length
    for (let i = 0; i < canes; i++) {
      const stout = i % 3 === 0;
      cane(x + 14 + (w - 28) * (i + rr(0.1, 0.9)) / canes, y + 4, rr(-0.45, 0.45), h * (stout ? rr(0.78, 0.95) : rr(0.3, 0.75)), stout ? rr(o.stout[0], o.stout[1]) : rr(o.w[0], o.w[1]), pick(WOOD), o.depth, o);
    }
  };
  const bare = { step: 11, wander: 0.27, fall: 0, side: 0.36, depth: 3, fan: 0.8, len: [0.5, 0.76], w: [2.6, 3.6] };
  spray('twigA', 4, { ...bare, side: 0.42 });
  if (yieldNow) await yieldNow(14.5);
  spray('twigB', 5, { ...bare, fan: 1.0, side: 0.36 }); spray('twigC', 3, { ...bare, fan: 0.45, side: 0.4, len: [0.6, 0.85] });
  if (yieldNow) await yieldNow(5, 9);
  const hang = { step: 15, wander: 0.3, fall: 0.14, side: 0.22, depth: 2, w: [2.2, 4], stout: [5.5, 8] };
  fall('hangA', 7, hang);
  fall('hangB', 9, { ...hang, side: 0.26, w: [2, 3.4], stout: [5, 7] });
  if (yieldNow) await yieldNow(9, 13);
  fall('veil', 7, { ...hang, deco: (x, y, a) => (K.rnd() < 0.3 ? leafAt(x, y, a, 5) : budAt(x, y, a)), decoEach: 0.55 });
  fall('leaf', 7, { ...hang, side: 0.18, deco: (x, y, a) => leafAt(x, y, a, 8), decoEach: 0.6 });
  if (yieldNow) await yieldNow(13, 10.5);
  spray('bud', 3, { ...bare, depth: 2, deco: budAt, decoEach: 0.6 });
  spray('shoot', 3, { ...bare, depth: 1, side: 0.3, deco: (x, y, a) => leafAt(x, y, a, 9), decoEach: 0.95 });
  spray('bloom', 3, { ...bare, depth: 1, side: 0.3, deco: (x, y, a) => (K.rnd() < 0.3 ? bloomAt(x, y) : leafAt(x, y, a, 8)), decoEach: 0.95 });
  // the walls' roses: bloom heads alone, white (the plant's own colour is its vertices'), and a dense leaf mass in
  // plain greys, dark under light (yew, ivy, rose leaf and dead straw all take their colour from the vertices)
  {
    const [x, y, w, h] = rects.heads, put = [];
    K.cell(rects.heads, [246, 240, 232]);
    // in trusses, as a rambler carries them: clusters of touching heads, each truss one mass
    for (let tr = 0; tr < 90 && put.length < 5; tr++) {
      const gx = x + rr(46, w - 46), gy = y + rr(46, h - 46);
      if (put.some((q) => Math.hypot(q[0] - gx, q[1] - gy) < 74)) continue;
      put.push([gx, gy]);
      const m = 4 + Math.floor(rr(0, 2.99)), a0 = rr(0, 6.283);
      for (let j = 0; j < m; j++) {
        const r = rr(13, 18), b0 = a0 + j * 6.283 / (m - 1), cx = j ? gx + Math.sin(b0) * rr(20, 27) : gx, cy = j ? gy + Math.cos(b0) * rr(20, 27) : gy;
        K.stroke(cx, cy, cx, cy, r * 1.9, r * 1.9, [206, 196, 186]);
        for (let k = 0; k < 5; k++) { const b = k * 1.257 + rr(0, 0.5), px = cx + Math.sin(b) * r * 0.5, py = cy + Math.cos(b) * r * 0.5; K.stroke(px, py, px, py, r * 1.1, r * 1.1, pick([[255, 255, 255], [246, 242, 236], [236, 230, 222]])); }
        K.stroke(cx, cy, cx, cy, r * 0.5, r * 0.5, [226, 200, 140]);
      }
    }
  }
  {
    const [x, y, w, h] = rects.mass, tones = [[120, 120, 120], [165, 165, 165], [210, 210, 210], [255, 255, 255]];
    K.cell(rects.mass, [165, 165, 165]);
    for (let k = 0; k < 440; k++) {
      // a dome on the root edge: thick at its foot and heart, ragged at its rim; the dark leaves first, the light last
      const f = Math.pow(K.rnd(), 0.7), a = rr(-1.5, 1.5), cx = x + w / 2 + Math.sin(a) * f * (w / 2 - 12), cy = y + 6 + Math.cos(a) * f * (h - 20) * 0.98, b = rr(0, 6.283), l = rr(10, 18);
      K.stroke(cx, cy, cx + Math.sin(b) * l, cy + Math.cos(b) * l, rr(6.5, 9.5), 2, tones[Math.min(3, Math.floor(k / 110))]);
    }
  }
  if (yieldNow) await yieldNow(10.5, 10.5);
  // the blossom's own cell, where the plain block stood: ONE CLOUD of petal dabs in light tones alone (a mauve grey
  // under, white above; no dark ink, so a crown in shade cannot speckle), lobed like a cumulus, each lobe lighter
  // toward its top, its rim ragged. The wood uvs (the kit's vine at 896, this part's at 901, both on row 768) lie
  // under one opaque white dab in the cloud's heart: all wood reads level 0 there (its uv is one point).
  {
    const [x, y] = rects.puff, lobes = [[50, 44, 30], [84, 60, 40], [128, 66, 46], [172, 60, 40], [208, 44, 30], [108, 36, 28], [150, 36, 28]];
    const tones = [[192, 180, 196], [208, 198, 210], [226, 218, 224], [240, 235, 232], [250, 247, 242], [255, 255, 255]];
    K.cell(rects.puff, [236, 230, 230]);
    for (let k = 0; k < 520; k++) {
      const L = lobes[k % lobes.length], rim = k < 91, f = Math.sqrt(K.rnd()) * (rim ? 1.14 : 1), a = rr(0, 6.283), cx = L[0] + Math.sin(a) * f * L[2], cy = L[1] + Math.cos(a) * f * L[2] * 0.9;
      const lift = 0.55 * (cy - L[1]) / L[2] + 0.45 * (cy - 52) / 52 + rr(-0.3, 0.3), d = rim ? rr(6, 9) : rr(9, 15);
      K.stroke(x + cx, y + cy, x + cx, y + cy, d, d, tones[Math.max(0, Math.min(5, Math.floor(3 + 2.6 * lift)))]);
    }
    K.stroke(x + 126, y + 64, x + 135, y + 64, 16, 16, [255, 255, 255]);
  }
  const levels = await inkLevels(K, yieldNow);
  const texture = new THREE.DataTexture(levels[0].data, K.size, K.size, THREE.RGBAFormat, THREE.UnsignedByteType);
  texture.mipmaps = levels; texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearMipmapLinearFilter; texture.magFilter = THREE.LinearFilter;
  texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 4; texture.needsUpdate = true;
  return { texture, levels };
}

// ---------------------------------------------------------------- an old tree of the grey (the kit's bark on its own form)
// H metres high (24 to 32). A foot flared and fluted in four to six buttresses that run out as roots; a trunk that leans
// and winds, its flutes twisting up it; great boughs that leave it at unlike heights, bend at an elbow and fork three
// times, tapering, to twigs; a limb the rule of place stops is a broken stub. At the limb ends, alpha-cut twig sprays of
// the kit's atlas, lit as one body: the crown reads as a soft grey cloud. Lichen and moss on the north (-z) sides and
// the upper sides, gold only where the sun strikes, cool in a wall's shade.
// t = { x, z, H, ok(p, margin), hAt(x, z), litAt(p) } and, for the great rose tree alone, heavy (its girth's factor),
// girth (the trunk's greatest radius), lean (the lean's factor), twigs: false (no twig haze: it is clothed). Returns its limbs.
const BARK = { a: linRGB('#8a7f74'), b: linRGB('#a39686'), dark: linRGB('#3a352f'), gold: linRGB('#cdb58a'), lichen: linRGB('#9aa58a'), moss: linRGB('#66703f'), rootMoss: linRGB('#8c9c4c'), shade: [0.24, 0.29, 0.38], tone: [0.6, 0.65, 0.76], gild: 0.65, sunGain: 0.5, fill: [0.2, 0.25, 0.34],
  twig: [0.46, 0.52, 0.66], twigTip: [0.68, 0.75, 0.92], twigSun: [0.95, 0.84, 0.6] };
export const GREY_TREE = { segs: [7, 5, 2], sides: [5, 4, 3], wander: [0.26, 0.38, 0.5], arc: [0.16, 0.22, 0.2], taper: [0.34, 0.32, 0.18], sway: [0.05, 0.16, 0.34], twigSway: 0.5, twigFlutter: 0.35, clearOfGround: 6 };
export function greyTree(F, t, rng) {
  const TAU = Math.PI * 2, { x, z, H, ok, hAt, litAt } = t, g0 = hAt(x, z), r0 = 0.03 * H * (t.heavy || 1), seed = rng.range(0, 50);
  const S = PLAN.sunTo, sl = Math.hypot(S[0], S[1], S[2]), flip = () => (rng.chance(0.5) ? 1 : -1);
  const shaded = (c, lit) => { const k = 1 - lit; return [c[0] * (1 - (1 - BARK.shade[0]) * k), c[1] * (1 - (1 - BARK.shade[1]) * k), c[2] * (1 - (1 - BARK.shade[2]) * k)]; };
  const bark = (p, n, damp) => {
    const hg = p[1] - g0, nN = -n[2], w = vnoise(p[0] * 0.9 + p[1] * 0.35 + seed, p[2] * 0.9 - p[1] * 0.3), w2 = vnoise(p[0] * 0.23 + seed * 2, p[1] * 0.23 + p[2] * 0.21);
    let c = mix3(BARK.a, BARK.b, w);
    c = mix3(c, BARK.lichen, 0.62 * sstep(0.55, 0.8, w2) * sstep(-0.35, 0.45, nN + 0.5 * n[1]));
    c = mix3(c, BARK.moss, 0.8 * sstep(0.35, 0.75, 1 - w2 + 0.3 * w) * Math.max(sstep(0.1, 0.8, nN) * sstep(9, 1.5, hg), 0.7 * sstep(0.45, 0.9, n[1]) * sstep(0.02, 0.2, damp)));
    c = mix3(c, BARK.dark, Math.min(0.85, 0.55 * sstep(2.2, 0, hg) + damp));
    c = mix3(c, BARK.rootMoss, 0.8 * sstep(1.5, 0.3, hg) * sstep(0.1, 0.65, n[1]) * (0.55 + 0.45 * w));   // moss on the roots' backs
    const lit = litAt(p), sun = Math.max(0, (n[0] * S[0] + n[1] * S[1] + n[2] * S[2]) / sl) * lit;
    // the side the sun strikes gold-grey and brighter; the side turned from it filled by the sky, cool, never black
    const away = Math.max(0, -(n[0] * S[0] + n[1] * S[1] + n[2] * S[2]) / sl), o = shaded(mix3(c, BARK.gold, BARK.gild * sun), lit), up = 1 + BARK.sunGain * sun;
    return [o[0] * BARK.tone[0] * (up + BARK.fill[0] * away), o[1] * BARK.tone[1] * (up + BARK.fill[1] * away), o[2] * BARK.tone[2] * (up + BARK.fill[2] * away)];
  };
  // the trunk: its foot sunk 0.8 m and upright for its first metres, then leaning and winding to the fork
  const fy = rng.range(0.3, 0.38) * H, lean = rng.range(0, TAU), la = rng.range(0.05, 0.14) * fy * (t.lean || 1), wa = rng.range(0.25, 0.6) * r0, wp = rng.range(0, TAU), wq = rng.range(0, TAU);
  const axis = (f) => { const e = sstep(0.06, 1, f); return [x + Math.cos(lean) * la * e * e + wa * Math.sin(wp + f * 5.5) * e, g0 - 0.8 + (fy + 0.8) * f, z + Math.sin(lean) * la * e * e + wa * Math.cos(wq + f * 4.3) * e]; };
  const lobes = rng.int(4, 6), lph = rng.range(0, TAU), tw = rng.range(1.2, 3) * flip(), oph = rng.range(0, TAU), TF = [0, 0.05, 0.11, 0.2, 0.33, 0.48, 0.64, 0.82, 1];
  const flute = (f, a) => (0.05 + 0.25 * Math.exp(-f * 6)) * Math.cos(lobes * a + lph + tw * f) + 0.07 * Math.cos(2 * a + oph + f * 2);
  const trad = (f, a) => Math.min(t.girth || GREY.trunkGirth - 0.05, r0 * (0.8 + 0.2 * (1 - f) + 0.85 * Math.exp(-f * 11)) * (1 + flute(f, a)));
  F.tube(TF.map(axis), 16, (i, a) => trad(TF[i], a), (p, n, i, a) => bark(p, n, Math.max(0, -2.2 * flute(TF[i], a))), () => 0);
  // the roots: one from a buttress (the tube's first ring is upright, so its angle a points along (-sin a, 0, -cos a))
  for (let k = 0; k < lobes; k++) {
    if (rng.chance(0.2)) continue;                      // (one buttress in five bears no root, and draws no more)
    const a = (TAU * k - lph) / lobes + rng.range(-0.15, 0.15), len = rng.range(2.5, 5.5), bend = rng.range(-0.6, 0.6), rr = r0 * rng.range(0.34, 0.5), pts = [];
    for (let i = 0; i <= 4; i++) {
      const g = i / 4, d = r0 * 0.7 + len * [0, 0.18, 0.42, 0.72, 1][i], an = a + bend * g * g, px = x - Math.sin(an) * d, pz = z - Math.cos(an) * d;
      const p = [px, hAt(px, pz) + [1.3, 0.55, 0.2, 0.04, -0.3][i] * rr / 0.36, pz];
      if (i > 0 && !ok(p, 0.5)) break;
      pts.push(p);
    }
    const m = pts.length - 1;
    if (m > 0) F.tube(pts, 4, (i) => rr * [1.15, 0.8, 0.55, 0.36, 0.2][i], (p, n) => bark(p, n, 0.1), () => 0, m === 4);
  }
  // a limb of its level from `from` along `dir`: it wanders, bends hard at one elbow, forks on the way and at its end
  const limbs = [], top = g0 + H;
  const turned = (d, ang) => { const q = v3.norm(v3.cross(d, [rng.range(-1, 1), rng.range(-0.2, 1), rng.range(-1, 1)])); return v3.norm([d[0] * Math.cos(ang) + q[0] * Math.sin(ang), d[1] * Math.cos(ang) + q[1] * Math.sin(ang) + 0.12, d[2] * Math.cos(ang) + q[2] * Math.sin(ang)]); };
  const grow = (from, dir, len, r, lv, s0) => {
    const n = GREY_TREE.segs[lv], st = len / n, elbow = rng.int(1, n - 1), pts = [from], dirs = [dir], wander = GREY_TREE.wander[lv];
    let d = dir, p = from, stub = false, arc = v3.norm([rng.range(-1, 1), rng.range(-0.9, 0.5), rng.range(-1, 1)]);
    for (let k = 1; k <= n && !stub; k++) {
      const j = wander * (k === elbow ? 2.4 : 1), ak = GREY_TREE.arc[lv];
      if (k === elbow) arc = [-arc[0], Math.abs(arc[1]) + 0.3, -arc[2]];
      let q = null;
      for (let tr = 0; tr < 3 && !q; tr++) {
        const e = v3.norm([d[0] + rng.range(-1, 1) * j + arc[0] * ak, d[1] + rng.range(-1, 1) * j * 0.7 + arc[1] * ak + (lv === 0 ? 0.06 : 0.12) - (p[1] > top - 0.1 * H ? 0.5 : 0) - (t.bow ? t.bow[lv] * k / n : 0), d[2] + rng.range(-1, 1) * j + arc[2] * ak]);
        const c = v3.add(p, e, st);
        if (c[1] < top && c[1] - hAt(c[0], c[2]) > GREY_TREE.clearOfGround && ok(c, 1.3)) { q = c; d = e; }
      }
      if (q) { pts.push(q); dirs.push(d); p = q; } else stub = true;
    }
    const m = pts.length - 1;
    if (m < 1) return null;
    const rEnd = stub ? r * 0.6 : r * GREY_TREE.taper[lv], L = { pts, dirs, lv, r, rEnd, stub, s0, n };
    F.tube(pts, GREY_TREE.sides[lv], (i) => r + (rEnd - r) * Math.pow(i / m, 0.8), (q, nr) => bark(q, nr, lv === 2 ? 0.25 : 0.14 * Math.max(0, -nr[1])), (i) => s0 + (GREY_TREE.sway[lv] - s0) * i / n, lv === 2 && !stub);
    limbs.push(L);
    if (lv < 2 && (!stub || (t.stubFork && m >= 2))) {
      const cl = len * (lv === 0 ? 0.56 : 0.6), cr = (i) => (r + (rEnd - r) * Math.pow(i / m, 0.8)) * 0.66, cs = (i) => s0 + (GREY_TREE.sway[lv] - s0) * i / n;
      for (let k = lv === 0 ? 2 : 1; k < m; k += lv === 0 ? 1 : 2) if (rng.chance(lv === 0 ? 0.7 : 0.5)) grow(pts[k], turned(dirs[k], rng.range(0.7, 1.25)), cl * rng.range(0.7, 1.1), cr(k), lv + 1, cs(k));
      grow(p, turned(d, rng.range(0.25, 0.5)), cl * rng.range(0.85, 1.15), rEnd * 0.97, lv + 1, cs(m));
      grow(p, turned(d, rng.range(0.6, 1.0)), cl * rng.range(0.55, 0.9), rEnd * 0.78, lv + 1, cs(m));
    }
    return L;
  };
  // the boughs: the leader from the fork, the others from the trunk's upper part at unlike heights, round the compass
  // (a tree of the PLAN, t.sides: that many side boughs, typed, and no leader of the seed's: its leader is the plan's,
  // the first of t.extra; nothing is drawn for a bough that is not grown)
  const nb = t.sides ? t.sides + 1 : rng.int(4, 5), a0 = rng.range(0, TAU);
  for (let b = t.sides ? 1 : 0; b < nb; b++) {
    const f = [1, 1, 0.9, 0.78, 0.66][b], az = a0 + TAU * (b + rng.range(-0.25, 0.25)) / nb, el = b === 0 ? rng.range(1.0, 1.3) : rng.range(0.35, 0.8) + 0.3 * (f - 0.66);
    grow(axis(f), [Math.cos(az) * Math.cos(el), Math.sin(el), Math.sin(az) * Math.cos(el)], (H - fy) * (b === 0 ? rng.range(0.5, 0.6) : rng.range(0.55, 0.8)), r0 * [0.62, 0.52, 0.46, 0.4, 0.36][b], 0, 0);
  }
  for (const e of t.extra || []) {   // (the PLAN's boughs: the great rose tree's leader, its bridge bough and its vast boughs; the neighbour's bridge bough: a plain bow to a typed place)
    const a = axis(e.f), n = GREY_TREE.segs[0], pts = [], dirs = [], r = r0 * e.r, rEnd = r * 0.5, sw = (i) => GREY_TREE.sway[0] * i / n;
    for (let i = 0; i <= n; i++) { const g = i / n; pts.push([a[0] + (e.to[0] - a[0]) * g, a[1] + (e.to[1] - a[1]) * g + e.bow * Math.sin(Math.PI * g), a[2] + (e.to[2] - a[2]) * g]); }
    for (let i = 0; i <= n; i++) dirs.push(v3.norm(v3.add(pts[Math.min(n, i + 1)], pts[Math.max(0, i - 1)], -1)));
    F.tube(pts, GREY_TREE.sides[0], (i) => r + (rEnd - r) * Math.pow(i / n, 0.8), (q, nr) => bark(q, nr, 0.14 * Math.max(0, -nr[1])), sw);
    limbs.push({ pts, dirs, lv: 0, r, rEnd, stub: false, s0: 0, n });
    for (const k of [3, 5, n]) grow(pts[k], turned(dirs[k], rng.range(0.5, 1.0)), 0.45 * (H - fy) * rng.range(0.7, 1.0), (r + (rEnd - r) * k / n) * 0.66, 1, sw(k));
  }
  // the twig haze: two sprays crossed at every branchlet's end and one from its middle, lit as one body round the
  // crown's heart (so the crown has a sunny side and a shaded one), paler and gold toward the sun
  const heart = [axis(1)[0], g0 + 0.62 * H, axis(1)[2]];
  const cells = [TWIG_CELLS.twigA, TWIG_CELLS.twigB, TWIG_CELLS.twigC];
  const spray = (e, d, len0, wide, crossed = false) => {
    // a spray is kept only where its whole card stands inside the rule at full swing; it is tried smaller twice
    const swing = GREY_TREE.twigSway * FLORA.swing + GREY_TREE.twigFlutter * FLORA.flutter + 0.05;
    let len = len0;
    while (len > 0.3 * len0 && !(ok(e, len * wide * 0.5 + swing) && ok(v3.add(e, d, len), len * wide * 0.5 + swing))) len *= 0.6;
    if (len <= 0.3 * len0) return;
    const tip = v3.add(e, d, len), nrm = v3.norm(v3.add(tip, heart, -1)), lit = litAt(tip), sun = Math.max(0, (nrm[0] * S[0] + nrm[1] * S[1] + nrm[2] * S[2]) / sl) * lit;
    const f1 = v3.norm(v3.cross(d, [rng.range(-1, 1), rng.range(-1, 1), rng.range(-1, 1)]));
    // (the last old trees: a thin green veil on the twig tips, by the season at the tree's root and a hash of place)
    const gv = sstep(0.27, 0.4, seasonAt(x, z)) * (0.3 + 0.7 * vnoise(tip[0] * 0.9 + tip[1], tip[2] * 0.9));
    const c0 = shaded(BARK.twig, lit), c1 = shaded(mix3(mix3(BARK.twigTip, BARK.twigSun, 0.75 * sun), [0.34, 0.74, 0.3], 0.6 * gv), lit);
    F.card(e, tip, len * wide, len * wide, f1, rng.pick(cells), c0, c1, GREY_TREE.sway[2], GREY_TREE.twigSway, GREY_TREE.twigFlutter, nrm);
    if (crossed) F.card(e, tip, len * wide, len * wide, v3.norm(v3.cross(d, f1)), rng.pick(cells), c0, c1, GREY_TREE.sway[2], GREY_TREE.twigSway, GREY_TREE.twigFlutter, nrm);
  };
  for (const L of t.twigs === false ? [] : limbs) {
    const m = L.pts.length - 1, e = L.pts[m], d = L.dirs[m];
    if (L.lv === 1) for (let k = 2; k <= m; k++) spray(L.pts[k], turned(L.dirs[k], rng.range(0.6, 1.2)), rng.range(0.08, 0.12) * H, rng.range(0.85, 1.1), k % 2 === 0);
    if (L.lv !== 2) continue;
    if (L.stub && rng.chance(0.5)) continue;
    spray(e, turned(d, rng.range(0.05, 0.3)), rng.range(0.1, 0.15) * H, rng.range(0.85, 1.1), true);
    spray(e, turned(d, rng.range(0.5, 1.0)), rng.range(0.08, 0.13) * H, rng.range(0.85, 1.1));
    for (let k = 1; k < m; k++) spray(L.pts[k], turned(L.dirs[k], rng.range(0.5, 1.1)), rng.range(0.07, 0.12) * H, rng.range(0.85, 1.1), k === 1);
  }
  return { limbs, g0, r0, fy, axis, trad, bark, shaded, heart };
}

// ---------------------------------------------------------------- the rule of place for the grey (never the seed's)
// THE SIGHT LANE (T3): no trunk in it and nothing of a tree or a rose anywhere in its plan (so nothing can hang into it
// below 30 m). THE LINE (S5): no trunk within 7 m of it in plan; no bough, curtain, crown or bridge within 5 m of it in
// plan at full swing, unless it passes 10 m or more over the flown line there. Typed figures:
// (G8, said truly: trunkToLine and trunkGirth hold the TRUNK: measured alone on seeds 1 to 300 its bark stands 7.07 m
// and more from the line in plan, 7.8 m in space. Its ROOTS lie on the ground beyond the foot, their middles held 5.6 m
// and more from the line in plan (ok(p, 0.5) in greyTree): the nearest 5.58 m in plan, 6.56 m in space, 3.2 m under the flown line.)
export const GREY = { to: 70, thinTo: 104, trees: 18, trunkToLine: 7, trunkToLane: 0, trunkGirth: 1.9, nearLine: 5, over: 10, wallGap: 4.5, apart: 12.5, apartNearWall: 10.5, bridges: 6 };
export function greyRule(route) {
  const line = routePoints(route).filter((p) => p[0] > -6), L = PLAN.lane, [tx, tz] = L.to, tl2 = tx * tx + tz * tz;
  // the plan distance from the flown line, the line's height there, the line's nearest place and its run there: [d, y, x, z, ex, ez]
  // (asked many thousand times a build: the line's pieces lie in flat arrays, eight to a block with its bounding
  // circle, and a block that cannot hold a nearer place is passed over)
  const n = line.length - 1, B = 8, nb = Math.ceil(n / B), SG = new Float64Array(n * 7), BK = new Float64Array(nb * 3);
  for (let i = 0; i < n; i++) {
    const a = line[i], b = line[i + 1], ex = b[0] - a[0], ez = b[2] - a[2], l2 = ex * ex + ez * ez;
    SG.set([a[0], a[2], ex, ez, l2 > 0 ? 1 / l2 : 0, a[1], b[1] - a[1]], i * 7);
  }
  for (let k = 0; k < nb; k++) {
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
    for (let i = k * B; i <= Math.min(n, k * B + B); i++) { x0 = Math.min(x0, line[i][0]); x1 = Math.max(x1, line[i][0]); z0 = Math.min(z0, line[i][2]); z1 = Math.max(z1, line[i][2]); }
    BK.set([(x0 + x1) / 2, (z0 + z1) / 2, Math.hypot(x1 - x0, z1 - z0) / 2 + 1e-6], k * 3);
  }
  const toLine = (x, z) => {
    let best = 1e18, bi = -1, bf = 0;
    for (let k = 0; k < nb; k++) {
      const dx = x - BK[k * 3], dz = z - BK[k * 3 + 1], r = BK[k * 3 + 2], dd = dx * dx + dz * dz;
      if (dd > r * r) { const g = Math.sqrt(dd) - r; if (g * g >= best) continue; }
      for (let i = k * B, e = Math.min(n, i + B); i < e; i++) {
        const j = i * 7, ax = SG[j], az = SG[j + 1], ex = SG[j + 2], ez = SG[j + 3];
        let f = ((x - ax) * ex + (z - az) * ez) * SG[j + 4];
        f = f < 0 ? 0 : f > 1 ? 1 : f;
        const px = x - ax - ex * f, pz = z - az - ez * f, d2 = px * px + pz * pz;
        if (d2 < best) { best = d2; bi = i; bf = f; }
      }
    }
    if (bi < 0) return [1e9, 0, 0, 0, 1, 0];
    const j = bi * 7;
    return [Math.sqrt(best), SG[j + 5] + SG[j + 6] * bf, SG[j] + SG[j + 2] * bf, SG[j + 1] + SG[j + 3] * bf, SG[j + 2], SG[j + 3]];
  };
  // the plan distance outside the lane's edge (negative inside it) and the axis's nearest place: [d, x, z]
  const toLane = (x, z) => {
    const f = Math.max(0, Math.min(1, (x * tx + z * tz) / tl2)), cx = tx * f, cz = tz * f;
    const half = L.half + (L.halfAtEnd - L.half) * Math.max(0, Math.min(1, (cx - L.widenFromX) / (tx - L.widenFromX)));
    return [Math.hypot(x - cx, z - cz) - half, cx, cz];
  };
  const ok = (p, m) => {
    if (toLane(p[0], p[2])[0] < m + 0.12) return false;
    const q = toLine(p[0], p[2]);
    return q[0] >= GREY.nearLine + m + 0.12 || p[1] - q[1] >= GREY.over + m + 0.12;   // a hand's width to spare for a card's corners
  };
  return { toLine, toLane, ok };
}

// ---------------------------------------------------------------- the grey trees, by the seed
// The seed deals the trees' places INSIDE the rule (and their heights, forks, boughs and curtains): first the rows that
// flank the lane on both hands from the door, then the two hands of the flown line, then the walls' sides (denser
// there); all thin beyond x 70 and none stands beyond 104. Then the bridges, those nearest the route first.
// layGrey reads the plan alone (no height), so the ground can take its mounds from the trees' places before it is built.
export function layGrey(rng, route) {
  const G = PLAN.garden, rule = greyRule(route), trees = [];
  const wallD = (x, z) => Math.min(x - G.x0, z - G.z0, G.z1 - z);
  const thin = (x) => (x <= GREY.to ? 1 : Math.max(0, 0.6 * (GREY.thinTo - x) / (GREY.thinTo - GREY.to)));
  const fits = (x, z) => {
    const wd = wallD(x, z);
    if (x > GREY.thinTo || wd < GREY.wallGap || rule.toLane(x, z)[0] < GREY.trunkGirth || rule.toLine(x, z)[0] < GREY.trunkToLine + GREY.trunkGirth) return false;
    const gap = wd < 16 ? GREY.apartNearWall : GREY.apart;
    return !trees.some((t) => Math.hypot(t.x - x, t.z - z) < gap);
  };
  // (G11: the rules of place first; the thinning's chance is drawn only for a place that has passed them, and only
  // where it is a chance: west of GREY.to every such place is taken)
  const tryPut = (x, z, cap) => { if (trees.length < cap && fits(x, z) && (thin(x) >= 1 || rng() < thin(x))) trees.push({ x, z }); };
  const [tx, tz] = PLAN.lane.to, tl = Math.hypot(tx, tz), ax = tx / tl, az = tz / tl;
  for (let s = 9; s < GREY.thinTo; s += 14) for (const side of [1, -1]) {
    const d = s + rng.range(-3, 3), off = (PLAN.lane.half + rng.range(2.6, 6)) * side;
    tryPut(ax * d - az * off, az * d + ax * off, 10);
  }
  for (let d = route.sill + 16; d < route.sill + 110; d += 13) for (const side of [1, -1]) {
    const p = routeAt(route, d + rng.range(-3, 3)), off = (GREY.trunkToLine + GREY.trunkGirth + rng.range(0.4, 4.5)) * side;
    tryPut(p.x - Math.sin(p.th * RAD) * off, p.z + Math.cos(p.th * RAD) * off, 14);
  }
  for (let k = 0; k < 260; k++) {
    const x = rng.range(G.x0 + GREY.wallGap, GREY.thinTo), z = rng.range(G.z0 + GREY.wallGap, G.z1 - GREY.wallGap);
    if (k < 160 && wallD(x, z) > 16) continue;
    tryPut(x, z, GREY.trees);
  }
  for (const t of trees) { t.H = rng.range(24, 32); t.S = seasonAt(t.x, t.z); }
  return { trees, rule };
}
// ---------------------------------------------------------------- the blossom trees of the middle (plum and cherry)
// An own maker in the grey tree's family: dark wet bark (the cherry's banded), a short trunk, a low wide crown of
// twisting boughs; its last twigs are cards of the bare twig cells, and along every limb and twig stand CLOUDS of
// blossom: a dome of the dense cell and a truss of heads crossed in it, lit as one body round the crown's heart, white
// or shell pink BY TREE. State by S at the root: buds and thin at 0.5, fullest 0.6 to 0.8, thinning with green leaf
// toward 0.88. t = { x, z, H, S, pink, ok(p, margin), hAt, litAt }. Returns its limbs and clouds ([x, y, z, radius]).
export const BLOSSOM = { H: [10, 15], overH: [15, 16], trunkToLine: 7, barkHair: 0.02, girth: 0.9, nearLine: 5, apart: 9.5, fromGrey: 7.5, fromDial: 10.5, segs: [4, 3, 1], sides: [5, 3], wander: [0.34, 0.46, 0.5], arc: [0.22, 0.26, 0.2],
  taper: [0.42, 0.4], sway: [0.03, 0.1, 0.2], woodTo: [6.75, 7.1, 6.1], fineTo: 9.5, fineHeads: 7, finePuff: 0.72, cloudSway: 0.3, flutter: 0.3, clearOfGround: 3.4, carpet: 44, carpetLift: 0.07, cloud: [2.1, 3.1], white: linRGB('#f6efe0'), pink: linRGB('#f1c9dc'), cream: linRGB('#fff1d8'), shell: linRGB('#ffd6cf'), petal: [0.8, 1.4, 2.2], bud: linRGB('#d98aa0'), bronze: [0.72, 0.42, 0.3],
  leaf: [0.3, 0.46, 0.34], puffGain: 1.0, under: [[1.06, 0.88, 1.12], [1.28, 0.85, 0.84]], flowers: 12, flower: [1.0, 1.35], shade: [0.86, 0.73, 0.85], bark: [linRGB('#7a5d4e'), linRGB('#94735e')], band: linRGB('#a5846e'), bandBy: 0.2, moss: linRGB('#5d6a3a'),
  // (barkLit: the bark's own tone, its gain on a face to the sun, and (G10c) its gain on a face turned from the sun:
  // the light the sunlit grass throws back on dark wet bark, without which such a face, lit by the sky's fill alone,
  // stood at 23 of 255 where the brief's shade is never black)
  barkLit: [1.0, 0.3, 0.6], damp: 0.3, twig: [0.5, 0.36, 0.36] };
export function blossomTree(F, t, rng) {
  const TAU = Math.PI * 2, B = BLOSSOM, { x, z, H, ok, hAt, litAt, pink, toLine } = t, g0 = hAt(x, z), r0 = 0.042 * H, seed = rng.range(0, 50);
  const S = PLAN.sunTo, sl = Math.hypot(S[0], S[1], S[2]), sunOn = (n, lit) => Math.max(0, (n[0] * S[0] + n[1] * S[1] + n[2] * S[2]) / sl) * lit;
  const bark = (p, n, damp = 0) => {
    const w = vnoise(p[0] * 1.1 + p[1] * 0.4 + seed, p[2] * 1.1 - p[1] * 0.3), lit = litAt(p), k = (B.barkLit[0] + B.barkLit[1] * sunOn(n, lit) + B.barkLit[2] * (1 - sunOn(n, 1))) * (1 - B.damp * damp), d = 1 - lit;
    let c = mix3(B.bark[0], B.bark[1], w);
    if (pink) c = mix3(c, B.band, B.bandBy * sstep(0.5, 0.72, vnoise(seed * 3, p[1] * 2.6)) * (0.6 + 0.4 * w));   // the cherry's bands
    c = mix3(c, B.moss, 0.6 * sstep(0.2, 0.8, 0.4 * n[1] - n[2]) * sstep(0.45, 0.8, vnoise(p[0] * 0.3 + seed, p[1] * 0.3 + p[2] * 0.3)));
    return [c[0] * k * (1 - 0.3 * d), c[1] * k * (1 - 0.26 * d), c[2] * k * (1 - 0.12 * d)];
  };
  // the trunk: short, leaning, its foot sunk and flared
  const fy = rng.range(0.23, 0.3) * H, clear = Math.min(B.clearOfGround, 0.85 * fy), lean0 = rng.range(0, TAU), la0 = rng.range(0.08, 0.2) * fy, TF = [0, 0.08, 0.25, 0.5, 0.78, 1], lobes = rng.int(3, 5), lph = rng.range(0, TAU);
  let lean = lean0, la = la0;
  const axis = (f) => { const e = sstep(0.06, 1, f); return [x + Math.cos(lean) * la * e * e, g0 - 0.6 + (fy + 0.6) * f, z + Math.sin(lean) * la * e * e]; };
  const trad = (f, a) => Math.min(B.girth, r0 * (0.86 + 0.14 * (1 - f) + 0.7 * Math.exp(-f * 9)) * (1 + (0.04 + 0.16 * Math.exp(-f * 6)) * Math.cos(lobes * a + lph)));
  // THE LEANING BARK KEEPS 7.0 m OF THE FLOWN LINE (G8b): the whole trunk is tried in plan at its own rings, the axis
  // less the thickest bark there (and a hair, B.barkHair, for the mesh's rounding and the line's bend). A lean that
  // fails is dealt again by the same rule (up to eight times); if none holds, the trunk stands upright over its foot,
  // which the lay keeps 7 m and the girth from the line. No tree is dropped or moved for it.
  const thick = (f) => Math.min(B.girth, r0 * (0.86 + 0.14 * (1 - f) + 0.7 * Math.exp(-f * 9)) * (1.04 + 0.16 * Math.exp(-f * 6)));
  const barkToLine = () => Math.min(...TF.map((f) => { const p = axis(f); return toLine(p[0], p[2])[0] - thick(f); }));
  if (toLine) {
    for (let tr = 0; tr < 8 && barkToLine() < B.trunkToLine + B.barkHair; tr++) lean = rng.range(0, TAU);
    if (barkToLine() < B.trunkToLine + B.barkHair) la = 0;
  }
  F.tube(TF.map(axis), 9, (i, a) => trad(TF[i], a), (p, n) => bark(p, n, 0.5 * sstep(1.6, 0, p[1] - g0)), () => 0);
  const limbs = [], clouds = [], top = g0 + H, heart = [axis(1)[0], g0 + 0.58 * H, axis(1)[2]], twigs = [TWIG_CELLS.twigA, TWIG_CELLS.twigB, TWIG_CELLS.twigC];
  const turned = (d, ang) => { const q = v3.norm(v3.cross(d, [rng.range(-1, 1), rng.range(-0.2, 1), rng.range(-1, 1)])); return v3.norm([d[0] * Math.cos(ang) + q[0] * Math.sin(ang), d[1] * Math.cos(ang) + q[1] * Math.sin(ang) + 0.1, d[2] * Math.cos(ang) + q[2] * Math.sin(ang)]); };
  // (G10b, THE BOUGH RULE) NO WOOD OF A BLOSSOM TREE WITHIN 6 m OF THE FLOWN LINE IN SPACE, above it or beside it. At
  // its laying, by its own place alone, a point of a bough, a branch or a twig that stands under B.woodTo[1] m from
  // the line in space is moved straight away from the line: 6.1 to 7.1 m become 6.75 to 7.1 m. A bough's bark (0.38 m
  // at most in radius; 0.15 m for the chord between two of its points) so keeps 6.2 m and more. The rule takes no
  // draw: the tree grows by its own places, and the rule moves only what is laid. (The old trees' and the great rose
  // tree's limbs keep 6.4 m in plan or 11.4 m over the line at their points by their own rule: counted on seeds 1 to
  // 300 along the whole line, no wood thicker than a wrist, 0.21 m through, stands within 6.3 m of the line beside
  // it or above it; on one seed of the 300 a wall rose's stem behind the ring stands 5.7 m AHEAD of the line's end.)
  const WT = B.woodTo, off = (p) => {
    if (!toLine) return p;
    const q = toLine(p[0], p[2]), dx = p[0] - q[2], dy = p[1] - q[1], dz = p[2] - q[3], d = Math.hypot(dx, dy, dz);
    if (d >= WT[1] || d < 1e-6) return p;
    const k = (WT[0] + (WT[1] - WT[0]) * Math.max(0, d - WT[2]) / (WT[1] - WT[2])) / d;
    return [q[2] + dx * k, q[1] + dy * k, q[3] + dz * k];
  };
  // a limb: it twists more than a grey tree's, levels out as it runs, and where the rule of the line would stop it, it
  // climbs (each further try steeper), so that a bough goes OVER the flown line and not into it
  const grow = (from, dir, len, r, lv, s0) => {
    const n = B.segs[lv], st = len / n, pts = [from], dirs = [dir], wander = B.wander[lv];
    if (lv === 2 && !ok(from, 0.43 * st + 0.4)) return null;          // a twig's card is as wide at its root as at its end
    const elbow = rng.int(1, n);
    let d = dir, p = from, stub = false, arc = v3.norm([rng.range(-1, 1), rng.range(-0.7, 0.4), rng.range(-1, 1)]);
    for (let k = 1; k <= n && !stub; k++) {
      const j = wander * (k === elbow ? 2.2 : 1), ak = B.arc[lv];
      if (k === elbow) arc = [-arc[0], Math.abs(arc[1]) + 0.2, -arc[2]];
      let q = null;
      for (let tr = 0; tr < 4 && !q; tr++) {
        const e = v3.norm([d[0] + rng.range(-1, 1) * j + arc[0] * ak, d[1] + rng.range(-1, 1) * j * 0.6 + arc[1] * ak + 0.04 + 0.6 * tr - 0.22 * Math.max(0, d[1]) - (p[1] > top - 0.12 * H ? 0.6 : 0), d[2] + rng.range(-1, 1) * j + arc[2] * ak]);
        const c = v3.add(p, e, st);
        if (c[1] < top && c[1] - hAt(c[0], c[2]) > clear && ok(c, lv === 2 ? 0.5 * st + 0.6 : 0.9)) { q = c; d = e; }
      }
      if (q) { pts.push(q); dirs.push(d); p = q; } else stub = true;
    }
    const m = pts.length - 1;
    if (m < 1) return null;
    const rEnd = lv === 2 ? 0.02 : stub ? r * 0.6 : r * B.taper[lv], L = { pts, dirs, lv, r, rEnd, stub }, sw = (i) => s0 + (B.sway[lv] - s0) * i / n;
    if (lv === 2) {
      // (the twig sheet's own ink is wood grey and darkens what it is laid in: a twig takes a light warm brown)
      const kq = 0.75 + 0.45 * litAt(from), c0 = [B.twig[0] * kq, B.twig[1] * kq, B.twig[2] * kq], nrm = v3.norm([p[0] - heart[0], p[1] - heart[1] + 0.25 * H, p[2] - heart[2]]);
      F.card(off(from), off(p), st * 0.85, st * 0.85, v3.norm(v3.cross(d, [rng.range(-1, 1), rng.range(-1, 1), rng.range(-1, 1)])), rng.pick(twigs), c0, c0, s0, B.sway[2], B.flutter, nrm);
    } else F.tube(pts.map(off), B.sides[lv], (i) => r + (rEnd - r) * Math.pow(i / m, 0.8), (q, nr) => bark(q, nr, 0.12 * Math.max(0, -nr[1])), sw, false);
    L.sw = sw; limbs.push(L);
    if (lv < 2 && !stub) {
      const cl = len * (lv === 0 ? 0.6 : 0.62), cr = (i) => (r + (rEnd - r) * Math.pow(i / m, 0.8)) * 0.66;
      for (let k = lv === 0 ? 2 : 1; k < m; k++) if (rng.chance(lv === 0 ? 0.75 : 0.6)) grow(pts[k], turned(dirs[k], rng.range(0.7, 1.25)), cl * rng.range(0.7, 1.1), cr(k), lv + 1, sw(k));
      grow(p, turned(d, rng.range(0.25, 0.5)), cl * rng.range(0.85, 1.15), rEnd * 0.97, lv + 1, sw(m));
      grow(p, turned(d, rng.range(0.6, 1.0)), cl * rng.range(0.55, 0.9), rEnd * 0.78, lv + 1, sw(m));
    }
    return L;
  };
  // the boughs: low and wide round the compass from the short trunk's head, one leader; `toward` (a plan direction, the
  // flown line's side) takes one steep bough that arches up and over
  const nb = rng.int(5, 6), a0 = t.toward ? Math.atan2(t.toward[1], t.toward[0]) : rng.range(0, TAU);
  for (let b = 0; b < nb; b++) {
    const over = t.toward && (b === 0 || b === nb - 1), lead = b === 1, f = [1, 1, 0.92, 0.84, 0.76, 0.7][b], az = over ? a0 + (b ? -1 : 1) * rng.range(0.3, 0.55) : a0 + TAU * (b + rng.range(-0.25, 0.25)) / nb;
    const el = over ? rng.range(0.7, 0.9) : lead ? rng.range(0.9, 1.2) : rng.range(0.3, 0.75);
    grow(axis(f), [Math.cos(az) * Math.cos(el), Math.sin(el), Math.sin(az) * Math.cos(el)], (H - fy) * (over ? rng.range(0.86, 0.98) : lead ? rng.range(0.5, 0.62) : rng.range(0.58, 0.8)), r0 * [0.6, 0.56, 0.5, 0.45, 0.4, 0.36][b], 0, 0);
  }
  return blossomClouds(F, t, rng, { limbs, clouds, heart, g0, r0, fy, axis, trad, sunOn });
}
// the blossom on a built tree: clouds at every twig's end and middle and at the limbs' joints, each kept only where it
// stands inside the rule at full swing. A CLOUD is rounded: cards of the blossom's own cell (light tones alone) about
// its centre, wide and half as high, their foot turned from the sun and the sky and laid in the shaded tone (a mauve
// grey under white, a deeper rose under pink), their head in the lit tone; the first cloud of a place is two crossed
// cards, its fellow one. Within B.flowers metres of the flown line (in space) a cloud carries real five-petalled
// flowers in clusters. (G10b) NEAR THE LINE THE BLOSSOM IS FINE: a cloud whose middle stands within B.fineTo m of the
// line in space is laid B.finePuff as large and carries B.fineHeads clusters of real flowers over it (each cluster
// under a metre: a flower 0.25 m across), placed by a hash of the cloud's own place; nothing is dealt for it.
// (Dealt after the tree's limbs, from the same stream.)
function blossomClouds(F, t, rng, built) {
  const B = BLOSSOM, { limbs, clouds, heart, sunOn } = built, { H, ok, litAt, pink } = t, full = sstep(0.46, 0.6, t.S), late = sstep(0.8, 0.9, t.S), S = PLAN.sunTo;
  const tint = pink ? B.pink : B.white, un = B.under[pink ? 1 : 0], foot = [tint[0] * un[0], tint[1] * un[1], tint[2] * un[2]], keep = (0.42 + 0.58 * full) * (1 - 0.25 * late), swing = (B.sway[2] + 0.1) * FLORA.swing + B.flutter * FLORA.flutter + 0.05;
  const size = () => rng.range(B.cloud[0], B.cloud[1]);
  const cloud = (e, sw, size0, one) => {
    if (!rng.chance(keep)) return;
    let ax = v3.norm([rng.range(-1, 1), rng.range(-0.3, 1), rng.range(-1, 1)]), h = size0 * rng.range(0.8, 1.25), c = v3.add(e, ax, h * 0.45), far = ok(c, h * 0.86 + swing);
    if (!far) {
      ax = v3.norm([rng.range(-0.4, 0.4), 1, rng.range(-0.4, 0.4)]); h *= 0.62; c = v3.add(e, ax, h * 0.45); far = ok(c, h * 0.86 + swing);
      if (!far) return;
    }
    const nrm = v3.norm([c[0] - heart[0], c[1] - heart[1] + 0.3 * H, c[2] - heart[2]]), k = 0.5 + 0.5 * sunOn(nrm, litAt(c)), face = v3.norm(v3.cross(ax, [rng.range(-1, 1), rng.range(-1, 1), rng.range(-1, 1)]));
    const col = (c3, g) => [c3[0] * g * (B.shade[0] + (1 - B.shade[0]) * k), c3[1] * g * (B.shade[1] + (1 - B.shade[1]) * k), c3[2] * g * (B.shade[2] + (1 - B.shade[2]) * k)];
    const s1 = sw + 0.1, tip = v3.add(e, ax, h), roll = rng.range(0, 1);
    if (roll < 0.35 * late) { const cc = col(B.leaf, 1); F.card(e, tip, h * 0.9, h * 0.9, face, TWIG_CELLS.shoot, cc, cc, sw, s1, B.flutter, nrm); }
    else if (roll > 0.93) { const cc = col(B.bronze, 1); F.card(e, v3.add(e, ax, h * 0.7), h * 0.6, h * 0.6, face, TWIG_CELLS.shoot, cc, cc, sw, s1, B.flutter, nrm); }
    else if (rng.chance(0.7 * (1 - full))) { const cc = col(B.bud, 1.1); F.card(e, tip, h * 0.9, h * 0.9, face, TWIG_CELLS.bud, cc, cc, sw, s1, B.flutter, nrm); }
    else {
      // (all of it within the ball about c that the rule of place has just tried: 0.86 h)
      const fine = far < B.fineTo, wv = rng.range(0.85, 1.1), up = v3.norm([S[0] * 0.55 + ax[0] * 0.3, 0.8 + S[1] * 0.55 + ax[1] * 0.2, S[2] * 0.55 + ax[2] * 0.3]), ww = h * 1.36 * wv * (fine ? B.finePuff : 1), hh = ww * 0.52;
      const c0 = col(foot, B.puffGain), c1 = col(tint, B.puffGain), a = v3.add(c, up, -0.5 * hh), b = v3.add(c, up, 0.5 * hh);
      F.card(a, b, ww, ww, face, TWIG_CELLS.puff, c0, c1, sw, s1, B.flutter, nrm);
      if (!one) F.card(a, b, ww * 0.92, ww * 0.92, v3.norm(v3.cross(up, face)), TWIG_CELLS.puff, c0, c1, sw, s1, B.flutter, nrm);
      if (far < B.flowers) for (let i = 0, nf = fine ? B.fineHeads : 2; i < nf; i++) {
        const j = i < 2 ? i : 14 + i * 5, l = Math.min(1.2 * h, (B.flower[0] + (B.flower[1] - B.flower[0]) * spaceNum(c, j)) * (i < 2 ? 1 : 0.78)), d = v3.norm([spaceNum(c, j + 2) * 2 - 1, spaceNum(c, j + 4) * 1.4 - 0.4, spaceNum(c, j + 6) * 2 - 1]), p = v3.add(c, d, Math.max(0, Math.min(0.6 * h, 0.86 * h - 0.72 * l)));
        F.card(v3.add(p, up, -0.5 * l), v3.add(p, up, 0.5 * l), l, l, d, TWIG_CELLS.heads, c1, c1, sw, s1, B.flutter, nrm);
      }
      clouds.push([c[0], c[1], c[2], h * 0.6]);
    }
  };
  for (const L of limbs) {
    const m = L.pts.length - 1, a = L.pts[0], b = L.pts[m];
    if (L.lv === 2) { cloud(b, B.sway[2], size()); cloud(b, B.sway[2], size() * 0.85, true); cloud([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2], (L.sw(0) + B.sway[2]) / 2, size() * 0.85); continue; }
    for (let k = L.lv === 0 ? 2 : 1; k <= m; k++) { cloud(L.pts[k], L.sw(k), size() * (L.lv === 0 ? 0.8 : 0.95)); if (L.lv === 1 && rng.chance(0.5)) cloud(L.pts[k], L.sw(k), size() * 0.8, true); }
  }
  return built;
}
// THE CHAIR'S PLACE by the seed: the plan's place, or the nearest place along the line's side (9 m from it) that no
// old tree stands within 5 m of. THE FORK'S PLACE likewise (7 m from the line).
export function placeBy(rule, grey, at, far, side) {
  for (const dx of [0, -2, 2, -4, 4, -6, 6, 8, -8, 10]) {
    const x = at[0] + dx;
    let z = at[1] + side * 6;
    for (let k = 0; k < 140 && rule.toLine(x, z)[0] > far; k++) z -= side * 0.1;
    if (!grey.some((t) => Math.hypot(t.x - x, t.z - z) < 5) && rule.toLane(x, z)[0] > 3) return [x, z];
  }
  return [at[0], at[1]];
}
// THEIR PLACES ARE THE PLAN'S (G9b): typed stations, the same on every seed. A tree stands AT its station; only
// where the rule refuses that place (an old tree of the seed's stands too near, or another of its own) it stands at
// the first place the rule allows on a FIXED spiral about the station (0.35 m a step, 0.2 m for the chair's two; no
// draw of any stream). The seed deals which trees are pink and each tree's height. Kind 2: the tree whose shade lies on the wheeled chair (6.5 m up the sun from it) and the
// tree whose boughs hang over it, hardly shifted. Kind 1: the line's own trees, by the METRE of route and the hand
// (-1 north, 1 south), 9.2 m from the line: five north and three south, so that their boughs meet over it. Kind 0: the
// rest, by the lane's north edge and south of the lane. None in the lane, no FOOT within 7 m and its girth of the line;
// the short trunk LEANS up to a metre, and its whole leaning bark keeps 7.0 m of the line in plan (G8b: tried in
// blossomTree, where the lean is dealt; a lean that fails is dealt again), none within 7.5 m of an old tree. White or shell pink by tree, dealt. A tree within 12.5 m of the line is a tall one with two boughs toward it.
// THE FALLING PETALS (G9c): the part's own field, one mesh of one call, moved in its vertex stage on the world's
// clock alone. THE LAW: NO PETAL IS EVER WITHIN PETAL_FALL.clear (3 m since G11, where 2.5) OF THE FLOWN LINE, true BY PLACE AT BUILD:
// each petal is dealt a FALL COLUMN (a start under or beside a blossom tree, a straight fall to the ground slanted
// down the wind, a sway to either hand of that course), and a column is kept only where its whole course IN PLAN,
// with its sway and the petal's own reach added, stays `clear` and more from the line in plan: so it keeps that
// distance at every height, the heights the line is flown at among them. Nothing is tested while the world runs,
// and no petal is hidden, moved, faded or sized by where the eye is. A petal falls its own column again and again;
// it grows from nothing in its first 0.04 of the fall, among the blossom, and goes to nothing in its last 0.04, on
// the grass (by its own phase).
// WHERE: `count` columns. `byLine` of them are dealt beside the flown line: under or beside a blossom tree that
// stands within `near` of the line, the middle of the course no farther than band[1] (9 m) from it. The rest fall
// anywhere under or beside any blossom tree. Under or beside: within `crown` of the tree's height from its trunk
// and `beside` m more. THE SIZE, said plainly (G11, the lead's look: at 0.22 to 0.30 m the nearest read as pale
// shards): a petal is `size` long (0.10 to 0.16 m) and 0.6 of that wide, two to three times a plum petal at this
// place's scale of three and a half times life. A TRY draws its start; one that the garden's bounds or the line's
// clear air (with the largest sway and reach) refuse draws no more. It turns about the vertical
// `spin` times in a fall, tumbles end over end and rocks; white under a white tree, shell pink under a pink one.
export const PETAL_FALL = { count: 2400, clear: 3, byLine: 0.7, band: [3, 9], near: 16, crown: 0.55, beside: 2.5, from: [0.45, 0.95], least: 5, wall: 2,
  size: [0.1, 0.16], fall: [0.9, 1.4], drift: [0.35, 0.6], sway: [0.2, 0.45], swayTurns: [1.5, 3], spin: [2, 5], tries: 40,
  white: ['#f6efe0', '#f8f4ea'], pink: ['#f1c9cf', '#f8e2e2'], wind: [0.92, 0.38], through: 0.28 };
// o = { rng, rule (the grey's: its toLine), trees (layBlossom's), heightAt, sunAt, wind (the visit's wind figure), yieldNow }
// It hands back the columns: { p (the start), d (the course to the ground), T (seconds a fall), phase, sway, turns,
// spin, seed, size, c (linear colour), lit, clear (the course's least plan distance from the line, its sway and
// reach taken off) }.
export async function layPetals(o) {
  const F = PETAL_FALL, { rng, rule, trees, heightAt } = o, G = PLAN.garden, list = [], wl = Math.hypot(F.wind[0], F.wind[1]), wx = F.wind[0] / wl, wz = F.wind[1] / wl;
  const nearTrees = trees.filter((t) => rule.toLine(t.x, t.z)[0] < F.near), col = new THREE.Color();
  const inside = (x, z) => x > G.x0 + F.wall && x < G.x1 - F.wall && z > G.z0 + F.wall && z < G.z1 - F.wall;
  // the least plan distance of a straight course from the line, sampled every 0.4 m of it
  const least = (x0, z0, x1, z1) => { const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 0.4)); let d = 1e9; for (let i = 0; i <= n; i++) d = Math.min(d, rule.toLine(x0 + (x1 - x0) * i / n, z0 + (z1 - z0) * i / n)[0]); return d; };
  for (let i = 0; i < F.count && trees.length; i++) {
    const by = nearTrees.length > 0 && i < F.byLine * F.count, pool = by ? nearTrees : trees;
    for (let tr = 0; tr < F.tries; tr++) {
      const t = rng.pick(pool), R = F.crown * t.H + F.beside, a = rng.range(0, 6.2832), d = R * Math.sqrt(rng()), x0 = t.x + Math.cos(a) * d, z0 = t.z + Math.sin(a) * d;
      if (!inside(x0, z0) || rule.toLine(x0, z0)[0] < F.clear + F.sway[1] + 0.75 * F.size[1] + 0.05) continue;
      const sway = rng.range(F.sway[0], F.sway[1]), size = rng.range(F.size[0], F.size[1]), keep = F.clear + sway + 0.75 * size + 0.05;
      const g0 = heightAt(x0, z0), y0 = g0 + Math.max(F.least, t.H * rng.range(F.from[0], F.from[1]) * (1 - 0.35 * (d / R) * (d / R)));
      const v = rng.range(F.fall[0], F.fall[1]), w = rng.range(F.drift[0], F.drift[1]) * o.wind, run = w * (y0 - g0) / v, x1 = x0 + wx * run, z1 = z0 + wz * run;
      if (!inside(x1, z1)) continue;
      const dl = least(x0, z0, x1, z1);
      if (dl < keep || (by && rule.toLine((x0 + x1) / 2, (z0 + z1) / 2)[0] > F.band[1])) continue;
      const g1 = heightAt(x1, z1) + 0.05;
      col.set(rng.pick(t.pink ? F.pink : F.white));
      list.push({ p: [x0, y0, z0], d: [x1 - x0, g1 - y0, z1 - z0], T: (y0 - g1) / v, phase: rng(), sway, turns: rng.range(F.swayTurns[0], F.swayTurns[1]), spin: rng.range(F.spin[0], F.spin[1]) * rng.sign(), seed: rng.range(0, 6.2832), size,
        c: [col.r, col.g, col.b], lit: o.sunAt((x0 + x1) / 2, (y0 + g1) / 2, (z0 + z1) / 2), clear: dl - sway - 0.75 * size });
      break;
    }
    if (o.yieldNow && i % 300 === 299) await o.yieldNow(i < 600 ? 6.5 : i < 1800 ? 4.5 : 2);
  }
  return list;
}
// pa: the start, the fall's seconds. pb: the course to the ground, the phase. pq: sway, its turns a fall, spins a
// fall, the petal's own number. pc: colour and the light of its place. pv: the petal's own (u, v), -1..1 along it.
const PETAL_GLSL = /* glsl */`
attribute vec4 pa, pb, pq;`;
const PETAL_VERTEX = /* glsl */`
  float qph = fract(uTime / pa.w + pb.w), qa = 6.2831853 * qph;
  vec2 qw = vec2(${(PETAL_FALL.wind[0] / Math.hypot(PETAL_FALL.wind[0], PETAL_FALL.wind[1])).toFixed(5)}, ${(PETAL_FALL.wind[1] / Math.hypot(PETAL_FALL.wind[0], PETAL_FALL.wind[1])).toFixed(5)});
  // (the sway: 0.9 of it across the wind and 0.4 along it, so never more than its own figure from the course)
  float qs1 = 0.9 * pq.x * sin(pq.y * qa + pq.w), qs2 = 0.4 * pq.x * sin(1.37 * pq.y * qa + 2.0 * pq.w);
  vec3 qc = pa.xyz + pb.xyz * qph + vec3(-qw.y * qs1 + qw.x * qs2, 0.0, qw.x * qs1 + qw.y * qs2);
  // turning as it falls: about the vertical, end over end, and rocking about its own length
  float qt1 = pq.z * qa + pq.w, qt2 = 0.6 * pq.z * qa + 1.7 * pq.w, qt3 = 0.7 * sin(2.3 * qa + 3.0 * pq.w);
  vec3 qX = vec3(cos(qt1), 0.0, sin(qt1)), qH = vec3(-sin(qt1), 0.0, cos(qt1));
  vec3 qY = qH * cos(qt2) + vec3(0.0, sin(qt2), 0.0), qN = cross(qX, qY);
  vec3 qB = qX * cos(qt3) + qN * sin(qt3);
  float qg = smoothstep(0.0, 0.04, qph) * (1.0 - smoothstep(0.96, 1.0, qph));
  transformed = qc + (qB * position.x + qY * position.y) * qg;
  vNormal = normalize(normalMatrix * cross(qB, qY));`;
// (the petal's outline inside its one triangle: narrow at the base, broad toward a notched tip; a blush at the base;
// lit as every drawn thing here, and `through` of its colour more where the sun reaches it: a petal lets light through)
const PETAL_COLOR = /* glsl */`
  float qpw = 0.5 + 0.28 * v_pv.y;
  if (v_pv.x * v_pv.x / (qpw * qpw) + v_pv.y * v_pv.y > 1.0 || (v_pv.y > 0.72 && abs(v_pv.x) < 0.8 * (v_pv.y - 0.72))) discard;
  vec3 qcol = v_pc.rgb * mix(vec3(0.95, 0.86, 0.88), vec3(1.0), smoothstep(-1.0, 0.1, v_pv.y));
  diffuseColor.rgb = gShade(qcol, v_pc.w);
  totalEmissiveRadiance += qcol * (${PETAL_FALL.through.toFixed(2)} * gCloudLit(v_pc.w));`;
// the mesh of the columns: ONE TRIANGLE a petal (its outline is cut inside it), so `count` triangles and one call.
// Its sphere holds every course, so three's own test leaves it out where no column lies in what is drawn.
export function makePetals(clock, list) {
  const P = [], N = [], V = [], A = [], B = [], Q = [], C = [], lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];
  for (const o of list) {
    const h = o.size / 2, w = o.size * 0.4;
    for (const [u, v] of [[0, -1.35], [1.15, 1.05], [-1.15, 1.05]]) {
      P.push(u * w, v * h, 0); N.push(0, 0, 1); V.push(u, v);
      A.push(o.p[0], o.p[1], o.p[2], o.T); B.push(o.d[0], o.d[1], o.d[2], o.phase); Q.push(o.sway, o.turns, o.spin, o.seed); C.push(o.c[0], o.c[1], o.c[2], o.lit);
    }
    for (let k = 0; k < 3; k++) { lo[k] = Math.min(lo[k], o.p[k], o.p[k] + o.d[k]); hi[k] = Math.max(hi[k], o.p[k], o.p[k] + o.d[k]); }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
  geometry.setAttribute('pv', new THREE.Float32BufferAttribute(V, 2));
  for (const [name, arr] of [['pa', A], ['pb', B], ['pq', Q], ['pc', C]]) geometry.setAttribute(name, new THREE.Float32BufferAttribute(arr, 4));
  if (list.length) geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3((lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, (lo[2] + hi[2]) / 2), Math.hypot(hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]) / 2 + 1);
  const material = drawnMaterial({ key: 'garden-petals-1', uniforms: { ...clock }, vary: { pc: 'vec4', pv: 'vec2' }, head: SHADE_GLSL, vertexHead: PETAL_GLSL, vertex: PETAL_VERTEX, color: PETAL_COLOR, extra: { side: THREE.DoubleSide } });
  const object = new THREE.Mesh(geometry, material);
  object.name = 'garden-petals';
  return { object, geometry, material, triangles: list.length };
}
// THE LINE TREES STAND AT EVEN STATIONS OF THE LINE (G11), `off` m from it: the north row (the left hand) every `step`
// m from the metre `first`, `north` of them; the south row (the right hand, the dial's side) from the same first
// station every one and a half steps, `south` of them: the rows part after the first pair and share a station again
// at every third step (the metre `first` + 3 `step`), where both trees stand on some seeds. The pair
// by the chair and the seven of the lawns are the plan's typed places.
export const BLOSSOM_ROW = { first: 203, step: 10, north: 5, south: 3, off: 9.2 };
const lineTrees = (n, step, hand) => Array.from({ length: n }, (_, i) => [BLOSSOM_ROW.first + step * i, hand, 1]);
export const BLOSSOM_AT = [[-5.3, 3.7, 2], [3.2, 4.2, 2], ...lineTrees(BLOSSOM_ROW.north, BLOSSOM_ROW.step, -1), ...lineTrees(BLOSSOM_ROW.south, BLOSSOM_ROW.step * 1.5, 1),
  [69.5, 23, 0], [95, 24, 0], [93, -6.5, 0], [108, 32.5, 0], [70.5, -14.5, 0], [82, 31, 0], [83, -7.5, 0]];
export function layBlossom(rng, rule, grey, chair, route) {
  const B = BLOSSOM, G = PLAN.garden, trees = [], D = PLAN.dial, deal = rng.shuffle([1, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0]);
  const fits = (x, z, kind) => x > 64 && x < 117.5 && rule.toLane(x, z)[0] >= B.girth + 3 && rule.toLine(x, z)[0] >= B.trunkToLine + B.girth && z - G.z0 > 12 && G.z1 - z > 12 && Math.hypot(x - D[0], z - D[1]) >= B.fromDial
    && Math.hypot(x - chair[0], z - chair[1]) > 3.6 && !grey.some((t) => Math.hypot(t.x - x, t.z - z) < (kind === 2 ? 6 : B.fromGrey)) && !trees.some((t) => Math.hypot(t.x - x, t.z - z) < (kind === 2 ? 7 : B.apart));
  for (const [ax, az, kind] of BLOSSOM_AT) {
    if (trees.length >= 14) break;
    let sx = ax, sz = az;
    if (kind === 2) { sx = chair[0] + ax; sz = chair[1] + az; }
    if (kind === 1) { const p = routeAt(route, ax), q = routeAt(route, ax + 1), l = Math.hypot(q.x - p.x, q.z - p.z) || 1; sx = p.x - az * (q.z - p.z) / l * BLOSSOM_ROW.off; sz = p.z + az * (q.x - p.x) / l * BLOSSOM_ROW.off; }
    for (let tr = 0; tr < 40; tr++) {
      const r = (kind === 2 ? 0.2 : 0.35) * tr, a = 2.39996 * tr, x = sx + Math.cos(a) * r, z = sz + Math.sin(a) * r;
      if (!fits(x, z, kind)) continue;
      const q = rule.toLine(x, z), near = q[0] < 12.5, t = { x, z, kind, S: seasonAt(x, z), pink: deal[trees.length] === 1, H: near ? rng.range(B.overH[0], B.overH[1]) : rng.range(B.H[0], B.H[1]) };
      if (near) { const l = Math.hypot(q[2] - x, q[3] - z); t.toward = [(q[2] - x) / l, (q[3] - z) / l]; }
      trees.push(t);
      break;
    }
  }
  return trees;
}
// THE STANDARD ROSES near the dial: six to eight, 5 to 7 m, scattered unevenly round it (no ring, no line), none in
// the lane, each 9.5 m and more from the flown line, off the trees
export function layStandards(rng, rule, grey, blossom) {
  const D = PLAN.dial, out = [], n = rng.int(6, 8), far = (list, x, z, d) => !list.some((t) => Math.hypot(t.x - x, t.z - z) < d);
  for (let k = 0; k < 1400 && out.length < n; k++) {
    const e = k > 600 ? 1 : 0, r = rng.range(5.6, 17 + 4 * e), a = rng.range(0, Math.PI * 2), x = D[0] + Math.cos(a) * r, z = D[1] + Math.sin(a) * r;
    if (x > 118 || rule.toLane(x, z)[0] < 3.3 || rule.toLine(x, z)[0] < 9.5 - e || !far(grey, x, z, 4.5 - e) || !far(blossom, x, z, 5 - e) || !far(out, x, z, 4.4 - 0.4 * e)) continue;
    out.push({ x, z, H: rng.range(5, 7), S: seasonAt(x, z), tint: rng.pick(WALL_ROSE.colors), seed: rng.range(0, 9) });
  }
  return out;
}
// THE BLOSSOM, built: in three meshes of the grey's one material by region (west of x 88, east of it, south of the
// lane), so that three's own test leaves out a region the line has passed. Over the line a bough or a cloud keeps 5 m
// from the flown line at full swing (measured in space, not in plan: the line passes UNDER the blossom).
// o = { trees (layBlossom's), rule, sunAt, rng (the trees' limbs and clouds), rngStd (the standards' heads), stream
//       (for 'blossom-cloth<buffer>', 'blossom-dial', 'blossom-petals'), heightAt, material, standards, dial, yieldNow, dry }
export async function buildBlossom(o) {
  const { rng, heightAt, rule, trees } = o, B = BLOSSOM, G = PLAN.garden, litAt = (q) => o.sunAt(q[0], q[1], q[2]), bufs = [makeFloraBuf(), makeFloraBuf(), makeFloraBuf()];
  const ok = (p, m) => {
    if (rule.toLane(p[0], p[2])[0] < m + 0.12 || p[2] - G.z0 < m + 3.5) return false;
    const q = rule.toLine(p[0], p[2]), d = Math.hypot(q[0], p[1] - q[1]);
    return d >= B.nearLine + m + 0.2 ? d : 0;
  };
  let done = 0, clouds = 0, space = 99, cold = 7;
  const bufOf = (x, z) => bufs[z > 10 ? 2 : x < 88 ? 0 : 1];
  for (const t of trees) {
    const F = bufOf(t.x, t.z), n0 = F.count();
    t.built = blossomTree(F, { ...t, ok, hAt: heightAt, litAt, toLine: rule.toLine }, rng);
    done += F.count() - n0; clouds += t.built.clouds.length;
    if (o.yieldNow && done > 4500) { const w = done * 0.0013 + cold; done = 0; cold = 0; await o.yieldNow(w); }
  }
  // THE STANDARD ROSES near the dial: real small trees, a stout stem and a FULL ROUND HEAD of rose in bloom (the bloom
  // by the season at each one's own root), by a stream of their own (o.rngStd); the cloth of each region by its own.
  const W = WALL_ROSE, S3 = v3.norm(PLAN.sunTo), forms = [], TAU = Math.PI * 2;
  for (const t of trees) for (const c of t.built.clouds) forms.push([c, c, c[3] * SHADOW.cloud[0], c[3] * SHADOW.cloud[0], SHADOW.cloud[1]]);
  {
    const cloths = [], near = (p) => rule.toLine(p[0], p[2])[0] < ROSE_TREE.flowers, test = (v) => !!ok(v, 0.3), rs = o.rngStd;
    for (const q of o.standards || []) {
      const i = bufs.indexOf(bufOf(q.x, q.z)), cloth = cloths[i] || (cloths[i] = makeRoseCloth({ F: bufs[i], rng: o.stream('blossom-cloth' + i), ok: () => true, litAt, seed: 0, near }));
      const y0 = heightAt(q.x, q.z), R = Math.min(rs.range(1.6, 2.0), (rule.toLane(q.x, q.z)[0] - 0.3) / 1.6, (rule.toLine(q.x, q.z)[0] - 5.4) / 1.6);
      forms.push(...roseStandard(bufs[i], cloth, rs, { x: q.x, z: q.z, H: q.H, R, tint: linRGB(q.tint).map((v) => v * ROSE_TREE.bloom), bloom: 0.45 + 0.55 * sstep(0.62, 0.9, q.S), seed: q.seed }, y0, litAt([q.x, y0 + q.H, q.z]), test));
    }
  }
  // THE FIRST ROSES OF THE YEAR tangled up the dial: three canes from the grass over the steps and wound round the
  // pedestal, shoots standing off them, a few heads of bloom; fallen petals on the steps (a stream of their own)
  if (o.dial) {
    const rng = o.stream('blossom-dial');
    const D = PLAN.dial, F = bufOf(D[0], D[1]), y0 = heightAt(D[0], D[1]) + 0.05, lit = litAt([D[0], y0 + 4, D[1]]), tint = linRGB(W.colors[1]).map((v) => v * W.headGain * 1.3);
    const sun = (n) => 0.55 + 0.45 * lit * Math.max(0, n[0] * S3[0] + n[1] * S3[1] + n[2] * S3[2]), at = (a, r, y) => [D[0] + Math.cos(a) * r, y0 + y, D[1] + Math.sin(a) * r];
    for (let k = 0; k < 3; k++) {
      const a0 = rng.range(0, TAU), turn = rng.sign() * rng.range(2.4, 3.8), topY = rng.range(4.4, 5.9), pts = [at(a0, 4.75, -0.25), at(a0 + 0.05, 3.75, 0.72), at(a0 + 0.1, 2.8, 1.12), at(a0 + 0.2, 1.7, 1.42)];
      for (let i = 1; i <= 6; i++) { const q = i / 6, h = 1.4 + (topY - 1.4) * q; pts.push(at(a0 + 0.2 + turn * q, 1.22 - 0.42 * sstep(1.5, 2.1, h) + 0.34 * sstep(4.7, 5.2, h), h)); }
      F.tube(pts, 3, (i) => 0.075 - 0.005 * i, (p, n) => { const kk = sun(n); return [0.2 * kk, 0.24 * kk, 0.14 * kk]; }, () => 0, false);
      for (let i = 3; i < pts.length; i++) {
        const p = pts[i], out = v3.norm([p[0] - D[0], rng.range(0.2, 1.1), p[2] - D[1]]), d = v3.norm([out[0] + rng.range(-0.5, 0.5), out[1], out[2] + rng.range(-0.5, 0.5)]), l = rng.range(1.0, 1.7), kk = sun(d);
        F.card(p, v3.add(p, d, l), l * 0.9, l * 0.9, v3.norm(v3.cross(d, [rng.range(-1, 1), rng.range(-1, 1), rng.range(-1, 1)])), TWIG_CELLS.shoot, [0.3 * kk, 0.5 * kk, 0.5 * kk], [0.42 * kk, 0.66 * kk, 0.6 * kk], 0.02, 0.1, 0.3, d);
        if (i > 4 && rng.chance(0.6)) { const c = v3.add(p, d, 0.5), h = rng.range(0.8, 1.15), cc = tint.map((v) => v * kk); F.card(v3.add(c, d, -0.5 * h), v3.add(c, d, 0.5 * h), h, h, v3.norm(v3.cross(d, [rng.range(-1, 1), rng.range(-1, 1), rng.range(-1, 1)])), TWIG_CELLS.heads, cc, cc, 0.03, 0.1, 0.3, d); }
      }
    }
    for (let k = 0; k < 14; k++) {
      const a = rng.range(0, TAU), r = rng.range(1.4, 4.3), y = (r > 3.55 ? 0.42 : r > 2.6 ? 0.84 : 1.26) + 0.04, l = rng.range(0.7, 1.2), a2 = rng.range(0, TAU), p = at(a, r, y), gg = rng.range(0.74, 0.92), cc = (k % 3 ? B.pink : B.white).map((v) => v * gg);
      F.card([p[0] - Math.cos(a2) * l / 2, p[1], p[2] - Math.sin(a2) * l / 2], [p[0] + Math.cos(a2) * l / 2, p[1], p[2] + Math.sin(a2) * l / 2], l, l, [0, 1, 0], TWIG_CELLS.heads, cc, cc, 0, 0, 0, [0, 1, 0]);
    }
  }
  // the rule of place is for what stands (measured here, before the carpets are laid on the floor)
  const standing = o.dry ? bufs.map((F) => floraClearance(F, rule)).reduce((a, c) => ({ ...a, ...c }), {}) : null;
  if (o.dry) for (const F of bufs) F.each((x, y, z, reach) => { const q = rule.toLine(x, z); space = Math.min(space, Math.hypot(q[0], y - q[1]) - reach); });
  // THE FALLEN PETALS under each tree: single small petals lying on the turf (small flat cards of the loose cell: a
  // few round dabs each, never a filled square), cream and shell pink, thick under the crown and thinning outward
  // with no edge, over an oval one and a half times as long downwind as across; the long grass gives way in it.
  // Dealt once, by a stream of their own: a place under the crown, then that place's own petals about it (two near
  // the heart, one or none outward), each its offset, size, turn and tone.
  const wind = v3.norm([0.92, 0, 0.38]), carpets = [], rp = o.stream('blossom-petals'), inG = (x, z) => x >= G.x0 + 2 && x <= G.x1 - 2 && z >= G.z0 + 2 && z <= G.z1 - 2;
  for (const t of trees) {
    const F = bufOf(t.x, t.z), R = 0.42 * t.H, n = Math.round(B.carpet * (0.3 + 0.7 * sstep(0.48, 0.66, t.S))), cx = t.x + wind[0] * 0.45 * R, cz = t.z + wind[2] * 0.45 * R;
    carpets.push([cx, cz, R * 1.5, R * 0.95]);
    for (let k = 0; k < n; k++) {
      const ro = Math.pow(rp(), 0.7) * 1.1, an = rp.range(0, TAU), u = Math.cos(an) * ro * R * 1.5, v = Math.sin(an) * ro * R * 0.95, x = cx + wind[0] * u - wind[2] * v, z = cz + wind[2] * u + wind[0] * v;
      if (!inG(x, z)) continue;
      const m = ro < 0.55 ? 2 : rp.chance(ro < 0.8 ? 0.6 : 0.2) ? 1 : 0;
      for (let j = 0; j < m; j++) {
        const px = x + rp.range(-0.5, 0.5) * B.petal[2], pz = z + rp.range(-0.5, 0.5) * B.petal[2];
        if (!inG(px, pz)) continue;                      // (its place first)
        const h3 = rp(), b = rp.range(0, TAU), g0 = rp.range(0.72, 0.94);
        const sz = (B.petal[0] + (B.petal[1] - B.petal[0]) * h3) * (ro > 0.8 ? 0.8 : 1), ex = Math.cos(b) * sz / 2, ez = Math.sin(b) * sz / 2;
        const g = (0.9 + 0.1 * g0) * (0.86 + 0.14 * litAt([px, heightAt(px, pz) + 0.5, pz])), tt = h3 < (t.pink ? 0.65 : 0.2) ? B.shell : B.cream, cc = [tt[0] * g, tt[1] * g, tt[2] * g];
        F.card([px - ex, heightAt(px - ex, pz - ez) + B.carpetLift, pz - ez], [px + ex, heightAt(px + ex, pz + ez) + B.carpetLift, pz + ez], sz, sz, [0, 1, 0], TWIG_CELLS.heads, cc, cc, 0, 0, 0, [0, 1, 0]);
      }
    }
  }
  const clear = (x, z) => {
    let k = 1;
    for (const c of carpets) { const dx = x - c[0], dz = z - c[1], u = (dx * wind[0] + dz * wind[2]) / c[2], v = (dz * wind[0] - dx * wind[2]) / c[3], ro = u * u + v * v; if (ro < 1) k = Math.min(k, 0.12 + 0.88 * ro); }
    return k;
  };
  const info = { trees: trees.length, triangles: bufs.reduce((a, F) => a + F.count(), 0), clouds, pink: trees.filter((t) => t.pink).length };
  info.standards = (o.standards || []).length;
  if (o.dry) return { info: { ...info, ...standing, space }, trees, bufs, clear, forms };
  const meshes = bufs.filter((F) => F.count() > 0).map((F, i) => F.build('garden-blossom-' + i, o.material));
  return { objects: meshes.map((m) => m.object), geometries: meshes.map((m) => m.geometry), info, trees, clear, carpets, forms };
}
// ---------------------------------------------------------------- THE BULB LAWNS (the middle): the flowers' forms
// Each kind by its own window of S; a drift is of one kind and one colour. A flower is made at 3.5 times life with the
// kit's attributes (it nods in the one wind): FINE within LAWN.near of the flown line (a crocus a goblet of six petals
// over striped leaves, a daffodil a nodding bloom of six petals and a trumpet, a bluebell an arched stem with hanging
// bells, an iris three falls and three standards over sword leaves), and a POOL clump of the same flowers in few
// triangles, which is the drift's mass far and near.
export const LAWN = { gain: 0.8, near: 15, full: 5, hollows: 11, cap: { L: 7000, N: 3500, A: 3400, B: 3000, C: 5000 },
  // the bands across the sight lane, one behind the other up the rise, BY THE SEED UNDER A RULE OF PLACE: the lane
  // from x lane[0] to lane[1] is cut into as many equal stretches as `bands` has entries (6.33 m each) and every
  // stretch bears one band, dealt in its middle half; an entry is its stretch's [kind (the season by depth), thin]
  lane: [22, 98], bands: [[0], [0], [0], [0], [1], [2], [1], [3], [1, 1], [3], [3], [3, 1]],
  kinds: [
    // share: its weight where windows overlap; sp: metres between a drift's clumps; n: fine flowers to a clump;
    // clear: how much of the grass a drift of it takes away; tones: the colours an instance's petals may take
    { id: 'crocus', form: 'crocus', win: [0.15, 0.42], tones: ['#6b4aa0', '#e7b53a', '#f3efe2'], h: 0.45, share: 1, sp: 1.05, n: 3, clear: 0.94 },
    { id: 'daffodil', form: 'daffodil', win: [0.33, 0.62], petal: '#f2d23c', deep: '#eaa91c', cup: 0.15, sides: 4, h: 1.3, share: 0.62, sp: 1.15, n: 3, clear: 0.8, wash: true },
    { id: 'narcissus', form: 'daffodil', win: [0.33, 0.62], petal: '#f3efe2', deep: '#e8822a', cup: 0.055, sides: 3, h: 1.3, share: 0.38, sp: 1.15, n: 3, clear: 0.8, wash: true },
    { id: 'bluebell', form: 'bluebell', win: [0.5, 0.75], petal: '#6c69bd', deep: '#5560b4', h: 1.2, share: 0.75, sp: 1.0, n: 3, clear: 0.78, wash: true },
    { id: 'iris', form: 'iris', win: [0.5, 0.75], petal: '#5a50a8', deep: '#8b85cf', h: 2.5, share: 0.25, sp: 1.5, n: 2, clear: 0.5 },
  ] };
export function bulbForms() {
  const g = LAWN.gain, lin = (hex, k = 1) => linRGB(hex).map((v) => v * g * k), up = [0, 1, 0], hh = (i, k) => vnoise(i * 7.31 + k * 3.7, k * 1.93 - i * 2.2);
  const blade = lin('#47804a'), bladeTip = lin('#7fae62'), pale = lin('#dbe6c8'), stem = lin('#6c9850'), signal = lin('#ecd98a');
  const pol = (o, a, r, y) => [o[0] + Math.cos(a) * r, o[1] + y, o[2] + Math.sin(a) * r], soft = (a) => v3.norm([Math.cos(a) * 0.5, 0.85, Math.sin(a) * 0.5]);
  // a blade from the foot `o` arching toward the angle a (reach r, height h, half width w): fine, a kite with a pale rib
  const leaf = (F, o, a, r, h, w, fine, sw) => {
    const T = pol(o, a, r, h), c = Math.cos(a + 1.571) * w, sn = Math.sin(a + 1.571) * w;
    if (!fine) return F.tri([o[0] - c, o[1], o[2] - sn], [o[0] + c, o[1], o[2] + sn], T, blade, blade, bladeTip, 0, 0, sw, 0.15, up);
    const M = pol(o, a, r * 0.45, h * 0.62), L = [M[0] - c, M[1], M[2] - sn], R = [M[0] + c, M[1], M[2] + sn];
    F.tri(o, L, T, pale, blade, bladeTip, 0, sw * 0.5, sw, 0.15, up); F.tri(o, T, R, pale, bladeTip, blade, 0, sw, sw * 0.5, 0.15, up);
  };
  const crocus = (F, o, s, a0, K, fine) => {
    const col = [0.86, 0.86, 0.86], base = [1, 1, 1], dark = [0.68, 0.68, 0.68], B = [o[0], o[1] + 0.06 * s, o[2]], sw = 0.03 * s;
    for (let k = 0; k < 3; k++) {
      const a = a0 + k * 2.094, a2 = a + 1.047;
      if (!fine) { F.tri(B, pol(o, a - 0.78, 0.1 * s, 0.42 * s), pol(o, a + 0.78, 0.1 * s, 0.42 * s), base, col, col, 0, sw, sw, 0.1, soft(a)); continue; }
      const L = pol(o, a - 0.66, 0.09 * s, 0.27 * s), R = pol(o, a + 0.66, 0.09 * s, 0.27 * s), T = pol(o, a, 0.08 * s, 0.47 * s);
      F.tri(B, L, T, base, col, col, 0, sw * 0.6, sw, 0.1, soft(a)); F.tri(B, T, R, base, col, col, 0, sw, sw * 0.6, 0.1, soft(a));
      F.tri(pol(o, a2 - 0.7, 0.03 * s, 0.13 * s), pol(o, a2 + 0.7, 0.03 * s, 0.13 * s), pol(o, a2, 0.045 * s, 0.43 * s), dark, dark, col, sw * 0.3, sw * 0.3, sw, 0.1, soft(a2));
    }
  };
  const daffodil = (F, o, s, a0, K, fine) => {
    const pet = lin(K.petal), cup = lin(K.deep), ca = Math.cos(a0), sa = Math.sin(a0), d = v3.norm([ca, -0.16, sa]), side = [-sa, 0, ca], upv = v3.norm(v3.cross(side, d)), sw = 0.07 * s;
    const N = [o[0] + ca * 0.05 * s, o[1] + 1.2 * s, o[2] + sa * 0.05 * s], C = v3.add(N, d, 0.05 * s), E = v3.add(C, d, K.cup * s), nf = v3.norm(v3.add(d, up, 0.8));
    const ring = (c, r, a) => v3.add(v3.add(c, side, Math.cos(a) * r), upv, Math.sin(a) * r);
    F.tri(v3.add(o, side, -0.03 * s), v3.add(o, side, 0.03 * s), N, stem, stem, stem, 0, 0, sw, 0, up);
    if (!fine) {
      const r = 0.2 * s, p2 = pet.map((v) => v * 0.9); F.tri(ring(C, r, 1.571), ring(C, r, 3.665), ring(C, r, 5.76), pet, pet, pet, sw, sw, sw, 0.3, nf); F.tri(ring(C, r, 0.524), ring(C, r, 2.618), ring(C, r, 4.712), p2, p2, p2, sw, sw, sw, 0.3, nf);
      return F.tri(ring(C, 0.07 * s, 1.571), ring(C, 0.07 * s, 4.712), v3.add(E, d, 0.04 * s), cup, cup, cup, sw, sw, sw, 0.3, up);
    }
    for (let k = 0; k < 6; k++) { const a = k * 1.047 + 0.3; F.tri(ring(C, 0.05 * s, a - 0.62), ring(C, 0.05 * s, a + 0.62), v3.add(ring(C, 0.18 * s, a), d, -0.025 * s), pet, pet, pet.map((v) => v * 1.06), sw, sw, sw, 0.3, nf); }
    for (let k = 0; k < K.sides; k++) {
      const a = k * 6.2832 / K.sides, b = a + 6.2832 / K.sides, p0 = ring(C, 0.05 * s, a), p1 = ring(C, 0.05 * s, b), q0 = ring(E, 0.082 * s, a), q1 = ring(E, 0.082 * s, b), n = v3.norm(v3.add(v3.add(q0, C, -1), up, 0.12 * s)), c2 = cup.map((v) => v * 1.08);
      F.tri(p0, p1, q0, cup, cup, c2, sw, sw, sw, 0.2, n); F.tri(p1, q1, q0, cup, c2, c2, sw, sw, sw, 0.2, n);
    }
  };
  const bluebell = (F, o, s, a0, K, fine) => {
    const col = lin(K.petal), deep = lin(K.deep, 0.85), ca = Math.cos(a0), sa = Math.sin(a0), side = [-sa, 0, ca], sw = 0.09 * s;
    const P = [[0, 0], [0.05, 0.62], [0.2, 1.05], [0.4, 1.13], [0.56, 1.0]].map(([r, y]) => [o[0] + ca * r * s, o[1] + y * s, o[2] + sa * r * s]), step = fine ? 1 : 2;
    for (let i = 0; i + step < 5; i += step) F.tri(v3.add(P[i], side, -0.022 * s), v3.add(P[i], side, 0.022 * s), P[i + step], stem, stem, stem, sw * i / 4, sw * i / 4, sw * (i + step) / 4, 0, up);
    for (let k = 0, n = fine ? 5 : 3; k < n; k++) {
      const t = 1.7 + 2.3 * (k + 0.5) / n, i = Math.floor(t), A = v3.add(P[i], v3.add(P[i + 1], P[i], -1), t - i), w = 0.05 * s, y = -0.15 * s, lean = (k % 2 ? 1 : -1) * 0.04 * s, c = [A[0] + side[0] * lean, A[1] + y, A[2] + side[2] * lean];
      if (!fine) { F.tri(A, v3.add(c, side, -w * 1.3), v3.add(c, side, w * 1.3), deep, col, col, sw, sw, sw, 0.3, up); continue; }
      for (let j = 0; j < 3; j++) F.tri(A, pol(c, a0 + j * 2.094, w, 0), pol(c, a0 + (j + 1) * 2.094, w, 0), deep, col, col, sw, sw, sw, 0.3, soft(a0 + (j + 0.5) * 2.094));
    }
  };
  const iris = (F, o, s, a0, K, fine) => {
    const col = lin(K.petal), light = lin(K.deep), dark = col.map((v) => v * 0.8), C = [o[0], o[1] + 2.25 * s, o[2]], sw = 0.1 * s;
    F.tri(pol(o, a0, -0.035 * s, 0), pol(o, a0, 0.035 * s, 0), C, stem, stem, stem, 0, 0, sw, 0, up);
    for (let k = 0; k < 3; k++) {
      const a = a0 + k * 2.094, a2 = a + 1.047;
      if (!fine) { F.tri(C, pol(C, a - 0.4, 0.27 * s, -0.11 * s), pol(C, a + 0.4, 0.27 * s, -0.11 * s), signal, col, col, sw, sw, sw, 0.3, soft(a)); continue; }
      const M = pol(C, a, 0.17 * s, 0.04 * s), px = Math.cos(a + 1.571) * 0.095 * s, pz = Math.sin(a + 1.571) * 0.095 * s, T = pol(C, a, 0.31 * s, -0.17 * s);
      F.tri(C, [M[0] - px, M[1], M[2] - pz], T, signal, col, dark, sw, sw, sw, 0.3, soft(a)); F.tri(C, T, [M[0] + px, M[1], M[2] + pz], signal, dark, col, sw, sw, sw, 0.3, soft(a));
      F.tri(pol(C, a2 - 0.6, 0.045 * s, 0.02 * s), pol(C, a2 + 0.6, 0.045 * s, 0.02 * s), pol(C, a2, 0.08 * s, 0.3 * s), light, light, light, sw, sw, sw, 0.3, soft(a2));
    }
    if (!fine) F.tri(pol(C, a0, -0.06 * s, 0), pol(C, a0, 0.06 * s, 0), [C[0], C[1] + 0.28 * s, C[2]], light, light, light, sw, sw, sw, 0.3, up);
  };
  const forms = { crocus, daffodil, bluebell, iris }, leaves = { crocus: [3, 0.3, 0.4, 0.035, 0.02], daffodil: [2, 0.2, 1.05, 0.045, 0.05], bluebell: [2, 0.42, 0.55, 0.05, 0.04], iris: [4, 0.3, 1.9, 0.075, 0.07] };
  const clump = { crocus: [6, 0.45, 0], daffodil: [4, 0.4, 3], bluebell: [3, 0.36, 3], iris: [2, 0.3, 4] };
  const out = { fine: [], pool: [], wash: null, low: null, tuft: null };
  { // the crocus' striped leaves, a tuft of four
    const F = makeFloraBuf(), lf = leaves.crocus;
    for (let i = 0; i < 4; i++) leaf(F, [0, 0, 0], 0.6 + i * 1.571 + hh(i, 31), lf[1] * (0.8 + 0.6 * hh(i, 3)), lf[2] * (0.75 + 0.5 * hh(i, 5)), lf[3], true, lf[4]);
    out.tuft = F.geometry();
  }
  { // the WASH: three standing cards of bloom heads, pale green at the foot and white above; its colour comes by place
    const F = makeFloraBuf(), top = [1, 1, 1], foot = [0.42, 0.6, 0.4];
    for (let i = 0; i < 3; i++) {
      const a = 0.3 + i * 1.047 + (hh(i, 17) - 0.5) * 0.5, r = 0.3 * hh(i, 19), o2 = [Math.cos(a * 2.1 + i) * r, -0.05, Math.sin(a * 2.1 + i) * r], h = 1.25 * (0.95 + 0.25 * hh(i, 21)), w = 1.35 + 0.5 * hh(i, 23);
      F.card(o2, [o2[0] + (hh(i, 25) - 0.5) * 0.3, h, o2[2] + (hh(i, 27) - 0.5) * 0.3], w * 0.8, w, [Math.cos(a), 0, Math.sin(a)], TWIG_CELLS.heads, foot, top, 0, 0.07, 0.2, v3.norm([Math.cos(a) * 0.3, 1, Math.sin(a) * 0.3]));
    }
    out.wash = F.geometry();
  }
  { // the LOW wash, the far crocus: two low standing cards and one lying over the ground, white (coloured by place)
    const F = makeFloraBuf(), top = [1, 1, 1], foot = [0.6, 0.66, 0.55];
    for (let i = 0; i < 2; i++) { const a = 0.5 + i * 1.6; F.card([0, -0.04, 0], [0, 0.52 + 0.1 * i, 0], 1.3, 1.6, [Math.cos(a), 0, Math.sin(a)], TWIG_CELLS.heads, foot, top, 0, 0.03, 0.1, v3.norm([Math.cos(a) * 0.3, 1, Math.sin(a) * 0.3])); }
    F.card([-0.8, 0.22, 0.1], [0.8, 0.3, -0.1], 1.5, 1.5, [0, 1, 0], TWIG_CELLS.heads, top, top, 0.01, 0.02, 0.1, [0, 1, 0]);
    out.low = F.geometry();
  }
  LAWN.kinds.forEach((K, ki) => {
    const lf = leaves[K.form], cl = clump[K.form];
    let F = makeFloraBuf();
    forms[K.form](F, [0, 0, 0], 1, 0, K, true);
    if (K.form !== 'crocus') for (let i = 0; i < lf[0]; i++) leaf(F, [0, 0, 0], 1.3 + i * 6.2832 / lf[0] + hh(i, ki), lf[1] * (0.75 + 0.5 * hh(i, 3)), lf[2] * (0.75 + 0.4 * hh(i, 5)), lf[3], true, lf[4]);
    out.fine.push(F.geometry());
    F = makeFloraBuf();
    for (let i = 0; i < cl[0]; i++) { const a = i * 2.4 + hh(i, 7) * 2, r = cl[1] * Math.sqrt((i + 0.4) / cl[0]); forms[K.form](F, [Math.cos(a) * r, 0, Math.sin(a) * r], 0.8 + 0.4 * hh(i, 9), (hh(i, 11) - 0.5) * 2.6, K, false); }
    for (let i = 0; i < cl[2]; i++) { const a = i * 2.1 + 0.7; leaf(F, [Math.cos(a) * cl[1] * 0.5, 0, Math.sin(a) * cl[1] * 0.5], a + hh(i, 13), lf[1], lf[2] * (0.8 + 0.3 * hh(i, 15)), lf[3], false, lf[4]); }
    out.pool.push(F.geometry());
  });
  return out;
}

// ---------------------------------------------------------------- the bulb lawns, laid (places only)
// DRIFTS: each a ragged pool of ONE kind and one colour, a union of a few round blobs whose edge noise breaks, with
// outliers beyond it. They lie (1) across the sight lane in bands one behind the other up the rise, (2) beside the
// flown line from where it leaves the lane, (3) round tree feet, (4) along the lost beds' edging, (5) in the hollows
// of the open grass, (6) round the fork's bed (a full pool of gold crocus right up to it). A drift's kind is dealt by
// the season at its own middle; each flower is then kept by the window of the season at ITS OWN root (thickest in
// the middle of the window, thin at its ends), so the kinds pass into each other along the depth.
// o = { rng, route, rule, heightAt, grey, blossom, standards, mounds, edging, chair, fork, free(x, z), forms }
export async function layLawns(o) {
  const L = LAWN, rng = o.rng, G = PLAN.garden, rule = o.rule, drifts = [], h = o.heightAt;
  const win = (K, S) => { const w = (K.win[1] - K.win[0]) * 0.4; return sstep(K.win[0], K.win[0] + w, S) * (1 - sstep(K.win[1] - w, K.win[1], S)); };
  const isL = (x, z) => x < 62 || z > 0.0875 * x;
  const kindAt = (x, z, noIris) => {
    const S = seasonAt(x, z), w = L.kinds.map((K, i) => (noIris && i === 4 ? 0 : K.share * win(K, S)));
    let sum = 0; for (const v of w) sum += v;
    if (sum < 0.08) return -1;
    let r = rng() * sum;
    for (let i = 0; i < w.length; i++) { r -= w[i]; if (r <= 0) return i; }
    return 0;
  };
  // tier L is always drawn (the lane's bands, the west, the south); N (north of the lane from x 62) by distance
  const add = (kind, blobs, tone, full, band) => {
    if (kind < 0 || !blobs.length) return;
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9, cx = 0, cz = 0;
    for (const [x, z, r] of blobs) { x0 = Math.min(x0, x - r * 1.4); x1 = Math.max(x1, x + r * 1.4); z0 = Math.min(z0, z - r * 1.4); z1 = Math.max(z1, z + r * 1.4); cx += x / blobs.length; cz += z / blobs.length; }
    const tier = band || isL(cx, cz) ? 'L' : 'N';
    if (kind === 4 && tier === 'L') kind = 3;
    drifts.push({ kind, tier, tone: kind === 0 ? (tone ?? rng.int(0, 2)) : -1, full: !!full, blobs, box: [x0, x1, z0, z1], cx, cz, sx: rng.range(0, 60), sz: rng.range(0, 60), toLine: rule.toLine(cx, cz)[0] });
  };
  const blobsAt = (x, z, n, r0, r1, spread) => { const out = []; for (let i = 0; i < n; i++) { const a = rng.range(0, 6.2832), d = i ? rng.range(0.5, 1) * spread : 0; out.push([x + Math.cos(a) * d, z + Math.sin(a) * d, rng.range(r0, r1)]); } return out; };
  // (1) the bands across the lane, the seed's under a rule of place: one band in each of the lane's equal stretches
  // (its station dealt in the stretch's middle half), and across the lane's 20 m four pools, one dealt in the middle
  // half of each quarter, slanting a little. The two pools nearest the lane's middle stand in every band on every
  // seed; an end one is missing at times. So every 6.33 m of the lane from the door's side bears bloom of its depth.
  const toneDeal = rng.shuffle([0, 1, 2, 0]), bw = (L.lane[1] - L.lane[0]) / L.bands.length;
  L.bands.forEach(([kind, thin], bi) => {
    const blobs = [], slant = rng.range(-0.22, 0.22), x = L.lane[0] + bw * (bi + rng.range(0.25, 0.75)), k = thin ? 0.75 : 1;
    for (let j = 0; j < 4; j++) {
      if ((j === 0 || j === 3) && rng.chance(thin ? 0.5 : 0.18)) continue;
      const tt = -10 + 5 * (j + rng.range(0.25, 0.75)), xx = x + slant * tt + rng.range(-1.3, 1.3);
      blobs.push([xx - 0.087 * tt, 0.0875 * xx + 0.996 * tt, rng.range(3.6, 5) * k]);
    }
    add(kind, blobs, toneDeal[bi], false, true);
  });
  // (2) beside the flown line, FROM THE LEFT TURN'S END TO THE BLOSSOM ROW'S LAST TREE (G11: both are places of the plan)
  const side0 = rng.sign();
  for (let m = o.route.leftTurn[1], i = 0; m < BLOSSOM_ROW.first + BLOSSOM_ROW.step * (BLOSSOM_ROW.north - 1); m += rng.range(5.5, 7.5), i++) {
    const p = routeAt(o.route, m), q = routeAt(o.route, m + 1), l = Math.hypot(q.x - p.x, q.z - p.z) || 1;
    const sd = (i % 2 ? 1 : -1) * side0 * (rng.chance(0.2) ? -1 : 1), off = rng.range(3, 15), x = p.x - (q.z - p.z) / l * sd * off, z = p.z + (q.x - p.x) / l * sd * off;
    const kind = kindAt(x, z, off < 9.5 || rule.toLane(x, z)[0] < 1);   // (G11: blobs are dealt only where a kind is in season)
    if (kind >= 0) add(kind, blobsAt(x, z, rng.int(2, 3), 2.5, 5.5, 4.5));
  }
  // (3) round tree feet
  for (const t of [...o.grey, ...o.blossom]) {
    if (t.x < 18 || t.x > 100 || !rng.chance(0.55)) continue;
    const a = rng.range(0, 6.2832), d = rng.range(2, 4), x = t.x + Math.cos(a) * d, z = t.z + Math.sin(a) * d;
    const kind = kindAt(x, z, true);
    if (kind >= 0) add(kind, blobsAt(x, z, rng.int(2, 3), 2.4, 4, 3.2));
  }
  // (4) along the lost beds' edging
  // (a run of three stations of the edging, or fewer where it breaks; its kind by the season at its first station;
  // a run whose kind is out of season draws nothing more)
  const edge = (run) => { const kind = kindAt(run[0][0], run[0][1], true); if (kind >= 0) add(kind, run.map((e) => [e[0] + rng.range(-1, 1), e[1] + rng.range(-1, 1), rng.range(2, 3)])); };
  for (let i = rng.int(0, 4), run = []; i < o.edging.length; i += 5) {
    const e = o.edging[i];
    if (run.length && Math.hypot(e[0] - run[0][0], e[1] - run[0][1]) > 12) { edge(run); run = []; }
    run.push(e);
    if (run.length === 3 || i + 5 >= o.edging.length) { edge(run); run = []; }
  }
  // (5) in the hollows of the open grass, two of them large. (G11: ONE place is dealt; the hollow is the lowest,
  // under the even rise, of that place and six about it at 7 m, off the lane: no place is dealt to be thrown away)
  for (let i = 0; i < L.hollows; i++) {
    const hx = rng.range(22, 98), hz = rng.range(G.z0 + 9, G.z1 - 9);
    let best = null;
    for (let k = 0; k < 7; k++) {
      const x = k ? Math.max(22, Math.min(98, hx + 7 * Math.cos(k * 1.0472))) : hx, z = k ? Math.max(G.z0 + 9, Math.min(G.z1 - 9, hz + 7 * Math.sin(k * 1.0472))) : hz, low = h(x, z) - 0.087 * x;
      if (rule.toLane(x, z)[0] > 3 && (!best || low < best[2])) best = [x, z, low];
    }
    if (!best) continue;
    const big = i < 2, kind = kindAt(best[0], best[1], rule.toLine(best[0], best[1])[0] < 9.5);
    if (kind >= 0) add(kind, blobsAt(best[0], best[1], big ? rng.int(5, 6) : rng.int(2, 4), big ? 4.5 : 3, big ? 7 : 6, big ? 9 : 5));
  }
  // (6) the fork's pool: gold crocus right up to the bed, whatever the window says
  { const K = o.fork, a0 = rng.range(0, 6.2832); add(0, [0, 1, 2].map((i) => [K[0] + Math.cos(a0 + i * 2.1) * 2.9, K[1] + Math.sin(a0 + i * 2.1) * 2.9, rng.range(3.4, 4.2)]), 1, true); }
  return layLawnSites(o, drifts, win);
}

// THE FLOWERS of the drifts: sites on a jittered lattice in each drift's box, kept by the drift's ragged edge and by
// the window of the season at each site's own place. A site is a POOL clump (the drift's mass far and near); within
// LAWN.near of the flown line it is FINE flowers instead (and a thinner pool); far from the line (over 26 m) mostly a
// WASH (standing cards of bloom, a low one for the crocus). The SETS are what the world hands the kit's scatter, one
// call each, every one of the grey's one material and drawn at every distance (G9a: no fade, no cull by distance).
// Tier L (the lane's bands) but for its few fine daffodils and narcissi, the crocus by the line and every wash stand
// as themselves from every place; the real
// forms and pools of tier N (in two regions) and every other fine set, a lane band's too, are marked `far`: while the eye stands west
// of x 0 (the line's metres 0 to 120.6) each stands as its far stand-in (farStandIn below), from the sill on as
// itself. A set whose form is white (the crocus, the washes) takes each flower's colour by place (tint: a map by
// the point's x and z).
async function layLawnSites(o, drifts, win) {
  // (it hands back between drifts, by the lattice cells visited: no draw of the stream is added by it)
  let seen = 0, seenAt = 0;
  const breathe = async (per) => { if (o.yieldNow && seen - seenAt > 2500) { const w = (seen - seenAt) * per + (seenAt ? 0 : 4); seenAt = seen; await o.yieldNow(w); } };
  const L = LAWN, rng = o.rng, G = PLAN.garden, rule = o.rule, h = o.heightAt, D0 = PLAN.dial, sets = {};
  const inOf = (D, x, z) => { let m = -9; for (const b of D.blobs) m = Math.max(m, 1 - Math.hypot(x - b[0], z - b[1]) / b[2]); return m + (vnoise(x * 0.33 + D.sx, z * 0.33 + D.sz) - 0.5) * 0.7 + (vnoise(x * 1.1 + D.sz, z * 1.1 + D.sx) - 0.5) * 0.25; };
  const off = (list, x, z, d) => { for (const t of list) if (Math.hypot(t.x - x, t.z - z) < (d || t.R * 0.85)) return false; return true; };
  const free = (x, z) => x > 1.5 && x < G.x1 - 1.5 && z > G.z0 + 2.5 && z < G.z1 - 2.5 && o.free(x, z) > 0.5 && off(o.grey, x, z, 2.1) && off(o.blossom, x, z, 1.3) && off(o.standards, x, z, 0.9) && off(o.mounds, x, z, 0)
    && Math.hypot(x - D0[0], z - D0[1]) > 5.2 && Math.hypot(x - o.chair[0], z - o.chair[1]) > 1.7 && bedRo(o.fork, x, z) > 1.05;
  const set = (name, geo, kind, group) => sets[name] || (sets[name] = { name, geo, kind, group, far: group !== 'L' && group !== 'A' && (geo === 'fine' || geo === 'pool'), points: [], tint: geo === 'wash' || geo === 'low' || (kind === 0 && geo !== 'tuft') ? new Map() : null });
  const tones = L.kinds[0].tones.map((t, i) => linRGB(t).map((v, j) => v * L.gain * (i ? 1 : [1.3, 1.05, 0.86][j]))), washTone = L.kinds.map((K) => (K.petal ? linRGB(K.petal).map((v) => v * L.gain) : null));
  const rot0 = Math.atan2(-PLAN.sunTo[2], PLAN.sunTo[0]);
  const put = (S, x, z, sc, d, tone) => { S.points.push({ x, y: h(x, z), z, s: sc, rot: rng.chance(0.25) ? rng.range(0, 6.2832) : rot0 + rng.range(-1.1, 1.1), d, u: 0.5 }); if (S.tint) S.tint.set(x + '|' + z, tone); };
  // THE CHANCES OF A SITE at (x, z) of the drift D, by place alone: null where a rule of place refuses it, else [its
  // chance to be taken, its chance to be fine, whether a wash may stand there, its distance from the line]
  const chances = (D, K, x, z) => {
    const m = inOf(D, x, z);
    if (m < -0.35 || !free(x, z)) return null;
    const d = rule.toLine(x, z)[0];
    if (D.kind === 4 && d < 8) return null;
    if (o.way && d < 12) { const B = wayOf[D.kind]; if (!o.way.ok(x, z, B[0], B[1], B[2] + 0.55 * spOf(D))) return null; }
    const w = D.full ? 1 : win(K, seasonAt(x, z)), p = (m > 0 ? sstep(0, 0.3, m) : 0.07) * w;
    return p > 0 ? [p, d < L.near ? 1 - sstep(L.full, L.near, d) : 0, d > 26 && (!!K.wash || D.kind === 0), d] : null;
  };
  const spOf = (D) => L.kinds[D.kind].sp * (1 + (D.kind === 0 ? 0.2 : 0.5) * sstep(14, 34, D.toLine));
  // THE WAY UNDER THE LINE (G11): by kind, the top, the throw and the reach from its foot of the tallest thing a site
  // of it may bear (its fine form, its pool, the crocus' leaves), each at WAY.flower times the form
  const ext = (g) => { const P = g.attributes.position, Wn = g.attributes.wind, e = [0, 0, 0, 0]; for (let i = 0; i < P.count; i++) { e[0] = Math.max(e[0], P.getY(i)); e[3] = Math.max(e[3], Math.hypot(P.getX(i), P.getZ(i))); if (Wn) { e[1] = Math.max(e[1], Wn.getX(i)); e[2] = Math.max(e[2], Wn.getY(i)); } } return e; };
  const wayOf = L.kinds.map((K, k) => { const E = [ext(o.forms.fine[k]), ext(o.forms.pool[k]), ...(k === 0 ? [ext(o.forms.tuft)] : [])], m = (i) => Math.max(...E.map((e) => e[i])); return [m(0) * WAY.flower, m(1) * WAY.flower * FLORA.swing + m(2) * FLORA.flutter, m(3) * WAY.flower]; });
  // THE CAPS (G11: nothing is dealt and then thinned, and no set is dealt and then dropped). Each group's triangles are
  // summed BEFORE the deal as the deal's own expectation: every lattice cell is asked at its middle by the same rules
  // of place and the same chances as the deal below, and no draw is taken. Where a group would pass its cap, the
  // chance of every thing of that group is made that much smaller (share), so what the cap refuses has drawn that
  // one chance and nothing else. The cap is held within the deal's own scatter.
  const triOf = (geo, kind) => (geo === 'fine' || geo === 'pool' ? o.forms[geo][kind] : o.forms[geo]).index.count / 3, fineGroup = (kind) => (kind === 0 ? 'A' : kind < 3 ? 'B' : 'C'), expect = {};
  for (const D of drifts) {
    const K = L.kinds[D.kind], sp = spOf(D), [x0, x1, z0, z1] = D.box, gF = fineGroup(D.kind), low = D.kind === 0;
    for (let gx = x0; gx < x1; gx += sp) for (let gz = z0; gz < z1; gz += sp) {
      const c = chances(D, K, gx + sp / 2, gz + sp / 2);
      seen++;
      if (!c) continue;
      expect[gF] = (expect[gF] || 0) + c[0] * c[1] * (K.n * triOf('fine', D.kind) + (low ? triOf('tuft') : 0));
      expect[D.tier] = (expect[D.tier] || 0) + c[0] * ((1 - c[1]) * (c[2] ? 0.65 * triOf(low ? 'low' : 'wash') + 0.35 * triOf('pool', D.kind) : triOf('pool', D.kind)) + c[1] * 0.45 * triOf('pool', D.kind));
    }
    await breathe(0.004);
  }
  const share = (g) => Math.min(1, L.cap[g] / Math.max(1, expect[g] || 0));
  for (const D of drifts) {
    const K = L.kinds[D.kind], sp = spOf(D), [x0, x1, z0, z1] = D.box, kF = share(fineGroup(D.kind)), kT = share(D.tier);
    for (let gx = x0; gx < x1; gx += sp) for (let gz = z0; gz < z1; gz += sp) {
      const x = gx + rng.range(0, sp), z = gz + rng.range(0, sp), c = chances(D, K, x, z);
      seen++;
      // (its place first, then its one chance; every further draw is of a thing that is laid)
      if (!c || !lot(rng, c[0])) continue;
      const d = c[3];
      let tone = null;
      const toneOf = () => tone || (tone = D.kind === 0 ? tones[rng.chance(0.06) ? rng.int(0, 2) : D.tone] : washTone[D.kind]);
      const fine = lot(rng, c[1]);
      if (fine) {
        const F = set('F-' + K.id, 'fine', D.kind, fineGroup(D.kind));
        for (let i = 0; i < K.n; i++) { if (!lot(rng, kF)) continue; const a = rng.range(0, 6.2832), r = i ? rng.range(0.25, 0.55) * sp : 0; put(F, x + Math.cos(a) * r, z + Math.sin(a) * r, rng.range(0.8, 1.2), d, toneOf()); }
        if (D.kind === 0 && lot(rng, share('A'))) put(set('F-tuft', 'tuft', 0, 'A'), x, z, rng.range(0.9, 1.3), d);
        if (!rng.chance(0.45)) continue;
      }
      if (!lot(rng, kT)) continue;
      const low = D.kind === 0, tier = D.tier, at = tier === 'L' ? 'L' : x < 80 ? 'N' : 'M';
      if (!fine && c[2] && rng.chance(0.65)) put(set(at + (low ? '-low' : '-wash'), low ? 'low' : 'wash', -1, tier), x, z, (low ? 1 : K.h / 1.25) * rng.range(0.85, 1.2), d, toneOf());
      else put(set(at + '-' + K.id, 'pool', D.kind, tier), x, z, rng.range(0.85, 1.2), d, toneOf());
    }
    await breathe(0.003);
  }
  // every set that bears a point stands
  const list = Object.values(sets).filter((S) => S.points.length), tri = (S) => triOf(S.geo, S.kind);
  let triangles = 0;
  for (const S of list) {
    S.triangles = S.points.length * tri(S); triangles += S.triangles;
    let cx = 0, cz = 0, R = 0;
    for (const p of S.points) { cx += p.x / S.points.length; cz += p.z / S.points.length; }
    for (const p of S.points) R = Math.max(R, Math.hypot(p.x - cx, p.z - cz));
    S.center = [cx, cz]; S.radius = R;
  }
  // where the grass gives way to a drift: a lattice of 1 m, the least of the drifts' takings
  const X0 = 12, Z0 = G.z0, NX = 100, NZ = G.z1 - G.z0 + 1, grid = new Float32Array(NX * NZ).fill(1);
  for (const D of drifts) {
    const K = L.kinds[D.kind];
    for (let i = Math.max(1, Math.floor(D.box[0] - X0)); i <= Math.min(NX - 2, Math.ceil(D.box[1] - X0)); i++) for (let j = Math.max(1, Math.floor(D.box[2] - Z0)); j <= Math.min(NZ - 2, Math.ceil(D.box[3] - Z0)); j++) {
      const x = X0 + i, z = Z0 + j, m = inOf(D, x, z);
      if (m < -0.1) continue;
      const v = 1 - K.clear * sstep(-0.1, 0.22, m) * (D.full ? 1 : Math.min(1, win(K, seasonAt(x, z)) * 1.5));
      if (v < grid[j * NX + i]) grid[j * NX + i] = v;
    }
    seen += (D.box[1] - D.box[0]) * (D.box[3] - D.box[2]) / 3;
    await breathe(0.002);
  }
  const clear = (x, z) => {
    const fx = Math.min(NX - 1.001, Math.max(0, x - X0)), fz = Math.min(NZ - 1.001, Math.max(0, z - Z0)), i = Math.floor(fx), j = Math.floor(fz), a = fx - i, b = fz - j, k = j * NX + i;
    return (grid[k] * (1 - a) + grid[k + 1] * a) * (1 - b) + (grid[k + NX] * (1 - a) + grid[k + NX + 1] * a) * b;
  };
  return { sets: list, drifts, clear, triangles };
}
// a set's shade for the kit's scatter: the baked shadows, times the flower's own colour where the form is white
export function lawnShade(S, shade) {
  if (!S.tint) return shade;
  return (x, z) => { const a = shade(x, z), t = S.tint.get(x + '|' + z) || [1, 1, 1]; return [a[0] * t[0], a[1] * t[1], a[2] * t[2]]; };
}
// A FAR STAND-IN of a flower form (G9a): two upright triangles on the form's own axis at right angles, AS HIGH AS
// THE FORM and of THE FORM'S OWN MEAN COLOUR. Each runs from the foot to the head with its third corner out at half
// height; how far out is the form's own area as projected along eight bearings round it, each tilted a little down, shared
// over the two at the same bearings (so as much of it shows as of the form). Its colour is the form's mean by that
// same area (the foot darker or lighter than the head by the form's own lower and upper halves, the mean kept); its
// normal the form's mean normal; its wind the form's at the foot and at the head; its place in the map the form's.
// The world hangs it on the real set's own store of places, turns, scales and tints, so the two differ in detail
// alone. FAR_CUT: the planes (x) west of which the eye sees the stand-ins: the middle's flowers at the door wall's
// inner face, the last lawn's where the door's shade ends, 30 m inside (the last lawn is 86 m and more from there).
export const FAR_CUT = { lawn: 0, end: 30 };
export function farStandIn(form) {
  const P = form.attributes.position, C = form.attributes.color, N = form.attributes.normal, W = form.attributes.wind, U = form.attributes.uv, I = form.index;
  const nt = (I ? I.count : P.count) / 3, vi = (t, k) => (I ? I.getX(t * 3 + k) : t * 3 + k), el = 0.1, ce = Math.cos(el), se = Math.sin(el), nw = W.itemSize;
  let y0 = 1e9, y1 = -1e9, x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9, foot = 0;
  for (let i = 0; i < P.count; i++) {
    if (P.getY(i) < y0) { y0 = P.getY(i); foot = i; }
    y1 = Math.max(y1, P.getY(i)); x0 = Math.min(x0, P.getX(i)); x1 = Math.max(x1, P.getX(i)); z0 = Math.min(z0, P.getZ(i)); z1 = Math.max(z1, P.getZ(i));
  }
  const H = Math.max(1e-3, y1 - y0), mid = (y0 + y1) / 2, lo = [0, 0, 0, 0], hi = [0, 0, 0, 0], nrm = [0, 0, 0], at = [0, 0];
  let seen = 0;
  for (let t = 0; t < nt; t++) {
    const a = vi(t, 0), b = vi(t, 1), c = vi(t, 2);
    const ux = P.getX(b) - P.getX(a), uy = P.getY(b) - P.getY(a), uz = P.getZ(b) - P.getZ(a), vx = P.getX(c) - P.getX(a), vy = P.getY(c) - P.getY(a), vz = P.getZ(c) - P.getZ(a);
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;   // twice the triangle's area along its normal
    let w = 0;
    for (let k = 0; k < 8; k++) { const th = k * Math.PI / 4; w += Math.abs(nx * Math.cos(th) * ce - ny * se + nz * Math.sin(th) * ce) / 16; }
    seen += w;
    for (const i of [a, b, c]) {
      const S = P.getY(i) < mid ? lo : hi;
      S[0] += C.getX(i) * w / 3; S[1] += C.getY(i) * w / 3; S[2] += C.getZ(i) * w / 3; S[3] += w / 3;
      nrm[0] += N.getX(i) * w; nrm[1] += N.getY(i) * w; nrm[2] += N.getZ(i) * w; at[0] += P.getX(i) * w / 3; at[1] += P.getZ(i) * w / 3;
    }
  }
  const all = Math.max(1e-9, seen), M = [0, 1, 2].map((k) => (lo[k] + hi[k]) / all), ml = lo[3] > 0 ? lo.slice(0, 3).map((v) => v / lo[3]) : M, mh = hi[3] > 0 ? hi.slice(0, 3).map((v) => v / hi[3]) : M;
  const g = M.map((m, k) => Math.max(-0.9 * m, Math.min(0.9 * m, mh[k] - ml[k]))), cFoot = M.map((m, k) => m - g[k]), cHead = M.map((m, k) => m + g[k]);
  const nl = Math.hypot(nrm[0], nrm[1], nrm[2]), n = nl > 1e-9 ? nrm.map((v) => v / nl) : [0, 1, 0], cx = at[0] / all, cz = at[1] / all;
  // (the two triangles' own showing area at those eight bearings: out * H / 2 * ce * 1.2071. G11: a low wide form, the
  // crocus' pool, needs its corner out past its own width to show as much as the form does: the bound is one and a
  // half widths, so every form's stand-in shows the form's own area)
  const out0 = Math.max(0.03, Math.min(1.5 * Math.max(x1 - x0, z1 - z0), 2 * all / (1.2071 * H * ce)));
  const wFoot = [], wHead = [];
  for (let k = 0; k < nw; k++) { let m = -1e9; for (let i = 0; i < W.count; i++) m = Math.max(m, W.array[i * nw + k]); wFoot.push(W.array[foot * nw + k]); wHead.push(k < 2 ? m : W.array[k]); }
  const pos = [], col = [], nor = [], uv = [], wind = [], wMid = wFoot.map((v, k) => (k < 2 ? (v + wHead[k]) / 2 : v));
  for (const [x, y, z, c, w] of [[cx, y0, cz, cFoot, wFoot], [cx, y1, cz, cHead, wHead], [cx + out0, mid, cz, M, wMid], [cx, mid, cz + out0, M, wMid]]) { pos.push(x, y, z); col.push(c[0], c[1], c[2]); nor.push(n[0], n[1], n[2]); uv.push(U.getX(0), U.getY(0)); wind.push(...w); }
  const idx = [0, 1, 2, 0, 1, 3];
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); out.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  out.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); out.setAttribute('wind', new THREE.Float32BufferAttribute(wind, nw)); out.setIndex(idx);
  if (form.boundingSphere) out.boundingSphere = form.boundingSphere.clone(); else out.computeBoundingSphere();
  return out;
}

// ---------------------------------------------------------------- the long shadows of the old trees
// The sun stands 24 degrees up, so every trunk, bough and limb throws a long shadow over the grass. Each is cast along
// the sun onto the ground's own height and drawn into ONE lattice as a soft stroke: as wide as its wood, its edge
// softer and its heart fainter the higher the wood stands over the ground (a trunk's foot throws a dark sharp bar, a
// high limb a pale wide one, the twigs a breath). Where a wall's shade already lies the trees add nothing (the lattice
// is taken times the sun of place). The sheet and the grass read the same lattice.
// (G10c) THE ONE SHADE FIELD OF THE GARDEN'S FLOOR. It is of the place: built once from the dealt trees and the
// fixed walls, read by place, the same from every side. What it holds now:
//  - THE DEPTH. `tint` is what full shade takes from the lit light, in linear light: 0.78, 0.73, 0.64, so full shade
//    keeps 0.22, 0.27, 0.36 of it, which is drawn (the display's curve) as about 0.50, 0.55, 0.63 of the lit colour:
//    the brief's 45 to 60 in 100, cooler. (At 0.54, 0.46, 0.34 the drawn shade stood at 0.70 to 0.83.)
//  - THE GREY'S WOOD AT FULL DEPTH: a trunk's and a bough's bar is no longer thinned in the grey (bare[3] is 0, was
//    0.55): a trunk 1.5 m through and 15 m high lays a bar 33 m long. At full depth the bar is drawn nearer the
//    wood's own width (fat: 1.2 times a trunk's radius and 0.2 m, where 1.6 times and 0.3 m).
//  - A NET OF TWIG SHADOW under bare crowns: the fine casters' half shade (`fine`, in the grey less by bare[0]) is
//    taken times a net by place: two lays of lines drawn out along the shadows' own way on the ground (a twig's
//    shadow is 2.2 times as long as the twig is high), one a little across the other, each line about 0.7 m wide (two cells of the lattice and more, so that no line breaks into a comb)
//    (net: the first lay's waves along and across in metres, the second's, the line's half width in the noise's
//    value, the floor between lines, the line's gain).
//  - THE CROWNS OF BLOSSOM AND LEAF: every cloud or heap that stands `crownFrom` m and more over the ground is cast
//    into a lattice of its own (cloud: its radius' share, its gain) and comes to the ground as one shade with DAPPLE:
//    flecks of sun by place (fleck: their size in metres, the noise's two bounds, how far a fleck clears the shade),
//    about four tenths of the crown's shadow. Low things (bushes, mounds, the dial) cast whole as before.
//  - WITH THE WALLS' BANDS (`all`, `shadeAll`): the same lattice joined with the sun of place past the walls, for
//    what stands on the ground and has no other word of the walls' shade (the flower sets, the bulbs).
export const SHADOW = { cell: 0.35, x1: 184, soft: 0.2, softPer: 0.022, deep: 0.95, haze: 0.16, fat: [[1.2, 0.2], [1.1, 0.1], [1, 0]], fall: [0.14, 0.36], fallWide: 0.36, tint: [0.78, 0.73, 0.64], cloud: [0.8, 0.4], fine: 0.55, fineFrom: 1, bare: [0.3, 58, 80, 0],
  crownFrom: 3, fleck: [2.4, 0.44, 0.6, 0.85], net: [4.5, 1.7, 3.0, 1.4, 0.4, 0.45, 1.3] };
export async function bakeShadows(o) {
  let turn = 0;
  const G = PLAN.garden, c = SHADOW.cell, nx = Math.ceil(SHADOW.x1 / c) + 1, nz = Math.ceil((G.z1 - G.z0) / c) + 1, S = PLAN.sunTo, hAt = o.heightAt;
  const K = new Float32Array(nx * nz), Kf = new Float32Array(nx * nz), Kc = new Float32Array(nx * nz), KA = new Float32Array(nx * nz), tmp = new Float32Array(nx * nz), stamp = new Uint32Array(nx * nz);
  let id = 0, KT = K;   // KT: the lattice the strokes are laid into (the wood's own, or the fine casters')
  // where a point's shadow falls: [x, z, the way down the ray]
  const cast = (p) => {
    let t = Math.max(0, (p[1] - hAt(p[0], p[2])) / S[1]);
    for (let k = 0; k < 2; k++) t = Math.max(0, (p[1] - hAt(p[0] - S[0] * t, p[2] - S[2] * t)) / S[1]);
    return [p[0] - S[0] * t, p[2] - S[2] * t, t];
  };
  // one soft stroke between two cast points with the wood's radii there; within one limb (one id) the strokes join by
  // the greater, limbs lie over one another as shade does (never darker than full)
  const stroke = (a, b, ra, rb, gain = 1) => {
    const pa = SHADOW.soft + SHADOW.softPer * a[2], pb = SHADOW.soft + SHADOW.softPer * b[2], m = Math.max(ra + pa, rb + pb);
    const i0 = Math.max(0, Math.floor((Math.min(a[0], b[0]) - m) / c)), i1 = Math.min(nx - 1, Math.ceil((Math.max(a[0], b[0]) + m) / c));
    const j0 = Math.max(0, Math.floor((Math.min(a[1], b[1]) - m - G.z0) / c)), j1 = Math.min(nz - 1, Math.ceil((Math.max(a[1], b[1]) + m - G.z0) / c));
    const ex = b[0] - a[0], ez = b[1] - a[1], l2 = ex * ex + ez * ez || 1e-6;
    for (let j = j0; j <= j1; j++) {
      // of this row only the cells within m of the stroke's stretch that lies within m of the row
      const pz = G.z0 + j * c - a[1];
      let ia = i0, ib = i1;
      if (Math.abs(ez) > 1e-9) {
        const fa = (pz - m) / ez, fb = (pz + m) / ez, lo = Math.max(0, Math.min(fa, fb)), hi = Math.min(1, Math.max(fa, fb));
        if (lo > hi) continue;
        const xa = a[0] + ex * lo, xb = a[0] + ex * hi;
        ia = Math.max(i0, Math.floor((Math.min(xa, xb) - m) / c)); ib = Math.min(i1, Math.ceil((Math.max(xa, xb) + m) / c));
      }
      for (let i = ia; i <= ib; i++) {
      const px = i * c - a[0], f = Math.max(0, Math.min(1, (px * ex + pz * ez) / l2)), qx = px - ex * f, qz = pz - ez * f, d2 = qx * qx + qz * qz;
      const r = ra + (rb - ra) * f, pen = pa + (pb - pa) * f;
      if (d2 >= (r + pen) * (r + pen)) continue;
      const d = Math.sqrt(d2), v = gain * SHADOW.deep * Math.min(1, 1.6 * r / (r + 0.6 * pen)) * sstep(r + pen, Math.max(0, r - 0.5 * pen), d), q = j * nx + i;
      const prev = stamp[q] === id ? tmp[q] : 0;
      if (v > prev) { KT[q] = 1 - (1 - KT[q]) * (1 - v) / (1 - prev); tmp[q] = v; stamp[q] = id; }
      }
    }
  };
  const TF = [0, 0.11, 0.25, 0.4, 0.55, 0.7, 0.85, 1], fat = (r, lv = 0) => r * SHADOW.fat[lv][0] + SHADOW.fat[lv][1];
  for (const t of o.trees) {
    const B = t.built;
    if (!B) continue;
    id++;
    let a = cast(B.axis(TF[0]));
    for (let k = 1; k < TF.length; k++) { const b = cast(B.axis(TF[k])); stroke(a, b, fat(B.trad(TF[k - 1], 0)), fat(B.trad(TF[k], 0))); a = b; }
    for (const L of B.limbs) {
      const m = L.pts.length - 1;
      id++;
      a = cast(L.pts[0]);
      KT = L.lv >= SHADOW.fineFrom ? Kf : K;
      for (let k = 1; k <= m; k++) { const b = cast(L.pts[k]); stroke(a, b, fat(L.r + (L.rEnd - L.r) * Math.pow((k - 1) / m, 0.8), L.lv), fat(L.r + (L.rEnd - L.r) * Math.pow(k / m, 0.8), L.lv)); a = b; }
      KT = K;
      // the twig haze at a branchlet's end: a wide breath
      if (L.lv === 2 && !L.stub) { id++; const e = cast(v3.add(L.pts[m], L.dirs[m], 2)); KT = Kf; stroke(a, e, 0.9, 1.3, SHADOW.haze); KT = K; }
    }
    if (o.yieldNow && ++turn % 8 === 4) await o.yieldNow(turn < 8 ? 18 : turn < 16 ? 12 : 8);
  }
  // the hanging falls: one soft stroke a strand, root to foot, thin when bare and fuller in leaf
  KT = Kf;
  if (o.falls) for (let k = 0; k < o.falls.length; k++) {
    const [root, foot, wide, Sr] = o.falls[k], r = wide * SHADOW.fallWide;
    id++;
    stroke(cast(root), cast(foot), r, r * 1.15, SHADOW.fall[0] + (SHADOW.fall[1] - SHADOW.fall[0]) * sstep(SEASON.bud, SEASON.leaf, Sr));
    if (o.yieldNow && k % 500 === 499) await o.yieldNow(k < 500 ? 14 : 6);
  }
  // the fine casters' lattice comes to the ground as a half shade under the wood's own strokes
  // (bare wood throws little shade: in the grey, by place, the half shade is fainter still, so that the low sun lies
  // in long flecks between the boughs' thin shadows)
  // (G10c: times the net of twig shadow, by place; column by column, a breath every 64 columns)
  KT = K;
  const NT = SHADOW.net, gl = Math.hypot(S[0], S[2]), ux = -S[0] / gl, uz = -S[2] / gl, wx = ux * 0.906 - uz * 0.423, wz = uz * 0.906 + ux * 0.423;   // (the second lay 25 degrees across the first)
  const lineOf = (v) => 1 - sstep(0, NT[4], Math.abs(v - 0.5) * 2);
  const netAt = (x, z) => NT[5] + NT[6] * Math.max(lineOf(vnoise((x * ux + z * uz) / NT[0] + 3.1, (z * ux - x * uz) / NT[1] - 7.7)), 0.8 * lineOf(vnoise((x * wx + z * wz) / NT[2] - 5.3, (z * wx - x * wz) / NT[3] + 2.9)));
  for (let i = 0; i < nx; i++) {
    const gy = sstep(SHADOW.bare[2], SHADOW.bare[1], i * c), fine = SHADOW.fine * (1 - SHADOW.bare[0] * gy), thin = 1 - SHADOW.bare[3] * gy;
    for (let q = i, j = 0; q < K.length; q += nx, j++) { if (Kf[q] > 0) K[q] = 1 - (1 - K[q]) * (1 - Math.min(1, fine * Kf[q] * netAt(i * c, G.z0 + j * c))); if (thin < 1) K[q] *= thin; }
    if (o.yieldNow && i % 64 === 63) await o.yieldNow(i < 64 ? 8 : i < 384 ? 4.5 : 2);
  }
  // FURTHER CASTERS (o.forms, then o.late after the pools): [a, b, ra, rb, gain], each ONE soft stroke from a to b (a
  // blossom cloud, a bush, a standard rose's stem and head, the dial). A POOL OF SUN (o.pools: [x, z, r0, r1]): the
  // shade cleared within r0 of the place, untouched beyond r1.
  // (G10c: a form that stands SHADOW.crownFrom m and more over the ground where its shadow falls, and is not solid
  // (gain under 1), is a crown's cloud or heap: it goes into the crowns' lattice, which comes to the ground dappled)
  const forms = (list, from, to) => {
    for (let k = from; k < Math.min(to, list.length); k++) {
      const q = list[k], a = cast(q[0]), b = cast(q[1]);
      id++;
      KT = q[4] < 1 && Math.min(a[2], b[2]) * S[1] >= SHADOW.crownFrom ? Kc : K;
      stroke(a, b, q[2], q[3], q[4]);
    }
    KT = K;
  };
  if (o.forms) for (let k = 0; k < o.forms.length; k += 400) { forms(o.forms, k, k + 400); if (o.yieldNow) await o.yieldNow(1.7); }
  // the crowns' lattice onto the ground: one shade, cleared in flecks of sun by place
  const FK = SHADOW.fleck;
  for (let i = 0; i < nx; i++) {
    for (let q = i, j = 0; q < K.length; q += nx, j++) if (Kc[q] > 0) K[q] = 1 - (1 - K[q]) * (1 - Kc[q] * (1 - FK[3] * sstep(FK[1], FK[2], vnoise(i * c / FK[0] + 11.3, (G.z0 + j * c) / FK[0] - 4.9))));
    if (o.yieldNow && i % 64 === 63) await o.yieldNow(1.4);
  }
  const pool = (px, pz, r0, r1) => {
    for (let j = Math.max(0, Math.floor((pz - r1 - G.z0) / c)); j <= Math.min(nz - 1, Math.ceil((pz + r1 - G.z0) / c)); j++) for (let i = Math.max(0, Math.floor((px - r1) / c)); i <= Math.min(nx - 1, Math.ceil((px + r1) / c)); i++) {
      const w = 0.25 * vnoise(i * 0.31, j * 0.31), d = Math.hypot(i * c - px, G.z0 + j * c - pz) * (0.87 + w);
      K[j * nx + i] *= sstep(r0, r1, d);
    }
  };
  if (o.pools) for (const p of o.pools) pool(p[0], p[1], p[2], p[3]);
  if (o.late) forms(o.late, 0, o.late.length);
  if (o.yieldNow) await o.yieldNow(1);
  // times the sun of place (a wall's band is not darkened twice), row by row
  // (G10c: KA is the same lattice JOINED WITH the walls' bands: 1 less the trees' clear share times the sun of place)
  const sunRow = (j) => { for (let i = 0; i < nx; i++) { const q = j * nx + i, x = i * c, z = G.z0 + j * c, sn = o.sunAt(x, hAt(x, z) + 0.05, z); KA[q] = 1 - (1 - K[q]) * sn; if (K[q] > 0.004) K[q] *= sn; } };
  for (let j = 0; j < nz; j++) { sunRow(j); if (o.yieldNow && j % 16 === 15) await o.yieldNow(2.2); }
  // the shade at a place, 0 (sun) to 1, and the grass's own factor there (the sheet's multiply)
  const at = (x, z) => {
    const fx = x / c, fz = (z - G.z0) / c;
    if (!(fx >= 0 && fz >= 0 && fx < nx - 1 && fz < nz - 1)) return 0;
    const i = Math.floor(fx), j = Math.floor(fz), u = fx - i, v = fz - j, q = j * nx + i;
    return (K[q] * (1 - u) + K[q + 1] * u) * (1 - v) + (K[q + nx] * (1 - u) + K[q + nx + 1] * u) * v;
  };
  const T = SHADOW.tint, shade = (x, z) => { const k = at(x, z); return [1 - T[0] * k, 1 - T[1] * k, 1 - T[2] * k]; };
  // the field with the walls' bands, at a place (outside the lattice: the sun of place alone)
  const all = (x, z) => {
    const fx = x / c, fz = (z - G.z0) / c;
    if (!(fx >= 0 && fz >= 0 && fx < nx - 1 && fz < nz - 1)) return 1 - o.sunAt(x, hAt(x, z) + 0.05, z);
    const i = Math.floor(fx), j = Math.floor(fz), u = fx - i, v = fz - j, q = j * nx + i;
    return (KA[q] * (1 - u) + KA[q + 1] * u) * (1 - v) + (KA[q + nx] * (1 - u) + KA[q + nx + 1] * u) * v;
  };
  const shadeAll = (x, z) => { const k = all(x, z); return [1 - T[0] * k, 1 - T[1] * k, 1 - T[2] * k]; };
  return { K, nx, nz, cell: c, at, shade, all, shadeAll };
}

// the lattice laid on the ground as ONE multiply sheet in the opaque pass (renderOrder 0.5, after the ground, before
// the grass; it writes no depth): a grid draped over the ground's height on the terrain's own near lattice (3 m, from
// x 1 and z -63), only the cells some shade touches, lifted a hand and drawn a hair toward the eye so that it lies
// over the drawn ground at any distance. Its strength is times the fog's own clear share at that place and nothing
// else (G8b). THE LEAF SHADOW MOVES (G7) under the trees in leaf (east of x 55 to 75, by place): the baked shade is
// read a hand's breadth aside on a slow sway of the world's clock and a dapple drifts through it about its own mean,
// so the shade's sum is kept; the dapple goes to that mean as the pixel's footprint on the ground outgrows its waves
// (2.3 to 2.7 m; G8b); the grey trees' shadow west of that lies still, as bare boughs' shadow does.
export const SHADOW_SHEET = { step: 3, x0: 1, z0: -63, lift: 0.15, bias: 0.006, dapple: [0.5, 2.3] };
export function buildShadowSheet(B, heightAt, clock, fogDensity = 0) {
  const G = PLAN.garden, st = SHADOW_SHEET.step, c = B.cell, data = new Uint8Array(B.nx * B.nz);
  for (let q = 0; q < data.length; q++) data[q] = Math.round(255 * B.K[q]);
  const texture = new THREE.DataTexture(data, B.nx, B.nz, THREE.RedFormat, THREE.UnsignedByteType);
  texture.unpackAlignment = 1; texture.magFilter = THREE.LinearFilter; texture.minFilter = THREE.LinearMipmapLinearFilter; texture.generateMipmaps = true; texture.needsUpdate = true;
  const gx = Math.ceil((SHADOW.x1 - SHADOW_SHEET.x0) / st), gz = Math.ceil((G.z1 - SHADOW_SHEET.z0) / st), P = [], U = [], I = [], seen = new Map(), n = Math.ceil(st / c) + 1;
  const vert = (i, j) => {
    const key = j * (gx + 1) + i;
    let v = seen.get(key);
    if (v === undefined) {
      const x = Math.max(0.05, Math.min(SHADOW.x1, SHADOW_SHEET.x0 + i * st)), z = Math.max(G.z0 + 0.05, Math.min(G.z1 - 0.05, SHADOW_SHEET.z0 + j * st));
      v = P.length / 3; P.push(x, heightAt(x, z), z); U.push((x / c + 0.5) / B.nx, ((z - G.z0) / c + 0.5) / B.nz); seen.set(key, v);
    }
    return v;
  };
  for (let j = 0; j < gz; j++) for (let i = 0; i < gx; i++) {
    const i0 = Math.max(0, Math.floor((SHADOW_SHEET.x0 + i * st) / c) - 1), j0 = Math.max(0, Math.floor((SHADOW_SHEET.z0 + j * st - G.z0) / c) - 1);
    let any = false;
    for (let b = j0; b <= Math.min(B.nz - 1, j0 + n + 1) && !any; b++) for (let a = i0; a <= Math.min(B.nx - 1, i0 + n + 1); a++) if (B.K[b * B.nx + a] > 0.004) { any = true; break; }
    if (!any) continue;
    const v00 = vert(i, j), v10 = vert(i + 1, j), v01 = vert(i, j + 1), v11 = vert(i + 1, j + 1);
    I.push(v00, v01, v10, v10, v01, v11);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2));
  geometry.setIndex(I);
  geometry.computeBoundingSphere();
  const material = new THREE.ShaderMaterial({
    uniforms: { uMap: { value: texture }, uTint: { value: new THREE.Vector3(...SHADOW.tint) }, uLift: { value: SHADOW_SHEET.lift }, uBias: { value: SHADOW_SHEET.bias }, uFog: { value: fogDensity }, uDap: { value: new THREE.Vector2(...SHADOW_SHEET.dapple) }, uTime: clock ? clock.uTime : { value: 0 }, uPerM: { value: new THREE.Vector2(1 / (c * B.nx), 1 / (c * B.nz)) } },
    vertexShader: /* glsl */`
      uniform float uLift, uBias;
      varying vec2 vUv; varying float vDepth; varying vec3 vWp;
      void main() {
        vUv = uv; vWp = position;
        vec4 mv = modelViewMatrix * vec4(position.x, position.y + uLift, position.z, 1.0);
        vDepth = -mv.z;
        mv.xyz *= 1.0 - uBias;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      uniform sampler2D uMap; uniform vec3 uTint; uniform vec2 uDap, uPerM; uniform float uTime, uFog;
      varying vec2 vUv; varying float vDepth; varying vec3 vWp;
      void main() {
        float leaf = smoothstep(55.0, 75.0, vWp.x);
        vec2 sway = vec2(sin(uTime * 0.9 + vWp.z * 0.21 + vWp.x * 0.13), sin(uTime * 0.7 + vWp.x * 0.17 - vWp.z * 0.11)) * (0.16 * leaf);
        float dap = sin(vWp.x * 2.3 + uTime * 1.1 + 1.7 * sin(vWp.z * 1.9 - uTime * 0.6)) * sin(vWp.z * 2.7 - uTime * 0.8 + 1.3 * sin(vWp.x * 1.6 + uTime * 0.5));
        float foot = max(length(dFdx(vWp.xz)), length(dFdy(vWp.xz)));
        dap *= 1.0 - smoothstep(uDap.x, uDap.y, foot);
        float air = exp(-uFog * uFog * vDepth * vDepth);
        float k = clamp(texture2D(uMap, vUv + sway * uPerM).r * (1.0 + 0.3 * leaf * dap), 0.0, 1.0) * air;
        gl_FragColor = vec4(vec3(1.0) - uTint * k, 1.0);
      }`,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.ZeroFactor, blendDst: THREE.SrcColorFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
    depthWrite: false, depthTest: true, transparent: false, side: THREE.DoubleSide, fog: false, toneMapped: false,
  });
  const object = new THREE.Mesh(geometry, material);
  object.name = 'garden-shadows'; object.renderOrder = 0.5;
  return { object, geometry, material, texture, triangles: I.length / 3 };
}

// ---------------------------------------------------------------- THE WAY UNDER THE LINE (G11, point 19)
// THE LAW: the top of every tuft of grass and of every flower, at full sway, stands WAY.clear (2.5 m) and more from
// the flown line. It is held BY PLACE AT BUILD, as a way mown and trodden through the lawns (the brief's grass walk).
// A thing whose top may stand `top` m over its own ground, that throws `reach` m in the strongest wind and reaches
// `radius` m to any hand of its foot, stands only where way.slack(x, z, top, reach, radius) is 0 and more: the
// metres by which its foot lies beyond the least plan distance from the line that such a top needs there (by the
// line's own height over the ground of that place, swell and all; `margin` for the line's curve between its points).
// So, from the line outward: SHORT TURF (the set 'turf': the kit's tufts `turfH` high, of one card each, so that
// `turf` of them cost what half as many whole tufts would; their tips lighter over their roots than the long
// grass's, `turfTip`, and each a little lighter or darker than the next, `turfTint`, so that mown blades show on
// the mown floor) over the way's own width
// (`half` to either hand) and wherever nothing taller may stand; a VERGE of middling grass (the set 'verge',
// `vergeH`) from where the rule lets it; the long grass from where the rule lets it; a set comes in over `edge` m.
// A flower of the lawns stands only where the tallest thing of its kind at its greatest scale (`flower` times its
// form: counted on what the kit lays) keeps the law: the crocus under the line, the taller kinds beside the way.
// The floor takes the tone of mown grass there (`tone`: added to the red, green and blue of the floor's own colour
// of that place, so the season stays), its edge ragged by a noise of place (`rag` m).
// The turf and the verge are dealt along the line itself, from the sill to the line's end, `band` m to either hand
// (the kit's grass by a path: evenly across the band), and kept by the same rule of place.
// A TUFT'S BOUND, from the kit's own tuft: its top no higher than its dealt height; `grass`: its throw at the
// strongest wind the world sets, as a share of that height (the kit's sway and flutter at mood 1 come to 0.46 on a
// built tuft); `wide`: how far its cards reach from its foot, of its dealt width (half a card, its offset, its
// lean); `tilt`: how far its top leans with the ground it stands on, of its height. `kitFar`: the kit's grass by
// a path lays a tuft so much taller and broader, of itself, at the band's edge (none at the path): the rule takes
// each tuft at the size the kit will give it there.
export const WAY = { clear: 2.5, margin: 0.12, half: 2.2, edge: 1.2, grass: 0.55, wide: 0.76, tilt: 0.15, band: 9, kitFar: 0.55, turf: 4500, turfH: [0.3, 0.55], turfW: [0.8, 1.4], turfTip: '#a0a0a0', turfTint: 0.25, verge: 700, vergeH: [0.6, 1.2], vergeW: [1.0, 1.8], tone: [0.2, 0.17, 0.02], rag: 0.7, flower: 1.5 };
export function makeWay(rule, heightAt) {
  const W = WAY;
  const slackOf = (q, y, top, reach, radius) => { const need = W.clear + reach + W.margin, dy = q[1] - y - top; return dy >= need ? 1e9 : q[0] - radius - Math.sqrt(need * need - Math.max(0, dy) ** 2); };
  const slack = (x, z, top, reach = 0, radius = 0, hAt = heightAt) => slackOf(rule.toLine(x, z), hAt(x, z), top, reach, radius);
  const tuft = (H, Wd, k = 1) => [H[1] * k, W.grass * H[1] * k, (W.wide * Wd[1] + W.tilt * H[1]) * k];
  // how much of a set of grass stands at a place: none where the rule refuses its tallest tuft and none in the
  // way's own width, all of it from `edge` m beyond
  const grass = (x, z, H, Wd, k = 1) => { const b = tuft(H, Wd, k), q = rule.toLine(x, z), g = Math.min(slackOf(q, heightAt(x, z), b[0], b[1], b[2]), q[0] - W.half); return g <= 0 ? 0 : sstep(0, W.edge, g); };
  const long = tuft(GRASS_PLAN.longH, GRASS_PLAN.longW), plain = (x) => riseAt(x);
  const tone = (x, z) => 1 - sstep(-W.edge, 0.5, slack(x, z, long[0], long[1], long[2], plain) + W.rag * 2 * (vnoise(x * 0.21 + 5.3, z * 0.21 - 3.1) - 0.5));
  return { slack, ok: (x, z, top, reach, radius) => slack(x, z, top, reach, radius) >= 0, tuft, grass, tone };
}
// THE GRASS OF THE GARDEN (the kit's makeGrass carries it; this is only its plan): long and unmown over the whole
// floor but the way under the line (WAY above: short turf and a verge there, sets of their own), each tuft taking
// the ground's own colour at its foot (so the season of its place shows in the blade) and
// the baked shadow of its place; flattened and paler under the old trees; thin on the sunk path; none in bloom.
// EVERY TUFT STANDS WHOLE AT EVERY DISTANCE (G9a). The kit's grass has no handle on its fade by distance but the
// fade pair itself (left out, it takes 70 to 100 m): the pair handed here, 400 to 500 m, begins beyond the farthest
// tuft from any place on the flown line (342 m at most on every seed, by the plan's own corners: from the garden's
// far corner (185, -62) to the line continued 30 m straight back), so neither the fade nor its cull acts in this place.
export const GRASS_PLAN = { long: 5200, flat: 1300, near: [70, 24], far: 0.3, longH: [1.2, 2.6], longW: [1.5, 2.7], flatH: [0.4, 0.9], flatW: [1.6, 2.8], pale: [0.6, 0.56, 0.5], paleBy: 0.4,
  under: [0.11, 0.3], fade: [400, 500], chunks: 4, step: 1.5, wallFoot: [0.5, 2.5], skyInShade: [0.01, 0.015, 0.013] };
export function makeGrassPlan(o) {
  const G = PLAN.garden, Q = GRASS_PLAN, c = new THREE.Color();
  // how far under an old tree a place lies (1 at the foot, 0 past three tenths of its height)
  const under = (x, z) => {
    let u = 0;
    for (const t of o.trees) u = Math.max(u, sstep(Q.under[1] * t.H, Q.under[0] * t.H, Math.hypot(x - t.x, z - t.z)));
    return u;
  };
  const wallFoot = (x, z) => sstep(Q.wallFoot[0], Q.wallFoot[1], Math.min(x, G.x1 - x, z - G.z0, G.z1 - z));
  const colour = (x, z, y) => {
    // each tuft has a number of its own (by its foot), so that no two tips are alike; the floor's colour does the rest
    o.groundColor(x, z, y, 1, c, 0, placeNum(x, z));
    const k = Q.paleBy * under(x, z), m = o.shade ? o.shade(x, z) : null, sh = m ? (1 - m[0]) / SHADOW.tint[0] : 0, L = Q.skyInShade;
    // in a tree's shade a tuft keeps a little of the sky's light (the kit multiplies by the shade: laid in before it)
    return [c.r + (Q.pale[0] * (c.r + c.g + c.b) / 1.64 - c.r) * k + (m ? L[0] * sh / m[0] : 0), c.g + (Q.pale[1] * (c.r + c.g + c.b) / 1.64 - c.g) * k + (m ? L[1] * sh / m[1] : 0),
      c.b + (Q.pale[2] * (c.r + c.g + c.b) / 1.64 - c.b) * k + (m ? L[2] * sh / m[2] : 0)];
  };
  const share = 0.9 + 0.12 * (o.density ?? 0.5), clear = o.clear || (() => 1);   // the grass gives way where the undergrowth lies
  const near = (x, z) => Q.far + (1 - Q.far) * sstep(Q.near[0], Q.near[1], o.rule.toLine(x, z)[0]);   // the tufts crowd toward the flown line
  // (G11) the way under the line: how much of each set stands at a place (1 everywhere when no way is handed in)
  const way = o.way, wayOf = (H, Wd) => (way ? (x, z) => way.grass(x, z, H, Wd) : () => 1), wLong = wayOf(Q.longH, Q.longW), wFlat = wayOf(Q.flatH, Q.flatW);
  // the sets dealt along the line: each tuft at the size the kit gives it by its distance `lat` from the path
  const far = (lat) => 1 + WAY.kitFar * lat / WAY.band, wVerge = (x, z, lat) => way.grass(x, z, WAY.vergeH, WAY.vergeW, far(lat));
  const turfOk = (x, z, lat) => { const b = way.tuft(WAY.turfH, WAY.turfW, far(lat)); return way.ok(x, z, b[0], b[1], b[2]); };
  const base = { bounds: [0.3, G.z0 + 0.3, G.x1 - 0.3, G.z1 - 0.3], heightAt: o.heightAt, heightStep: Q.step, groundColor: colour, shade: o.shade, flowers: 0, cards: 2,
    chunks: Q.chunks, fade: Q.fade, root: '#5a5a5a', tip: '#828282', rootGain: 1.05, materialOptions: { ambient: 1.15, leafAmbient: 1.15, wrap: 0.35, backlight: 0.4, sheen: 0.25, detail: 0 } };
  const { bounds: garden, ...free } = base, band = o.path ? { ...free, path: o.path, uRange: [o.sill, 1], radius: WAY.band, bias: 1 } : base;
  return {
    under,
    sets: [
      { ...base, name: 'long', count: Math.round(Q.long * share), height: Q.longH, width: Q.longW, density: (x, z) => (1 - under(x, z)) * wallFoot(x, z) * near(x, z) * clear(x, z) * wLong(x, z) },
      { ...base, name: 'flat', count: Math.round(Q.flat * share), height: Q.flatH, width: Q.flatW, density: (x, z) => under(x, z) * wallFoot(x, z) * near(x, z) * clear(x, z) * wFlat(x, z) },
      ...(way ? [
        { ...band, name: 'verge', chunks: 1, count: Math.round(WAY.verge * share), height: WAY.vergeH, width: WAY.vergeW, density: (x, z, lat) => (1 - under(x, z)) * wallFoot(x, z) * clear(x, z) * wVerge(x, z, lat) * (1 - wLong(x, z)) },
        { ...band, name: 'turf', chunks: 1, cards: 1, tip: WAY.turfTip, tint: WAY.turfTint, count: Math.round(WAY.turf * share), height: WAY.turfH, width: WAY.turfW, density: (x, z, lat) => (turfOk(x, z, lat) ? wallFoot(x, z) * clear(x, z) * (1 - wLong(x, z)) * (1 - 0.7 * wVerge(x, z, lat)) : 0) },
      ] : []),
    ],
  };
}

// the rule counted from the built vertices of the flora mesh at the strongest wind (the bounds of FLORA): the least plan
// distance of anything from the lane's edge, and from the line of anything lower than 10 m over the flown line
export function floraClearance(F, rule) {
  const out = { leastToLane: 99, leastToLine: 99, vertices: 0 };
  F.each((x, y, z, reach) => {
    const q = rule.toLine(x, z);
    out.leastToLane = Math.min(out.leastToLane, rule.toLane(x, z)[0] - reach);
    if (y - reach - q[1] < GREY.over) out.leastToLine = Math.min(out.leastToLine, q[0] - reach);
    out.vertices++;
  });
  out.leastToLane = Math.round(out.leastToLane * 100) / 100; out.leastToLine = Math.round(out.leastToLine * 100) / 100;
  return out;
}
// ---------------------------------------------------------------- the hanging roses of the grey stretch
// The roses that climbed the old trees. On a trunk: three to seven canes of unlike thickness that wander, part and
// rejoin. From the boughs: ragged FALLS of fine canes (a fall is many strands of unlike length, width and facing; a
// strand is one hang cell bent once, thick at the bough and wispy at the foot). From a climbed crown to the next:
// BRIDGES, each a sheaf of thin canes (the thickest 0.1 m through, GREY_ROSE.caneMost its radius) that lie along the
// boughs at both ends, with strands and side sprays hung all along them. State by S at the rose's own ROOT (the foot of the tree it
// climbed). A SIDE SHOOT OF A TRUNK'S CANE is one card standing off the bark. ITS BEARING IS A RULE OF PLACE (G11): it
// takes a bearing within 0.7 of its node's own bearing on the trunk; where the node stands within R.shootFace m of
// the line in plan, the bearings within R.shootCone (a cosine) of the way to the line's nearest place, and of the way
// to the line's place as far before that as the node stands from it, are taken off, so the side shoots of a trunk
// by the way stand out to its sides and behind it. A node with no bearing left bears none and draws nothing; its
// chance is the share of its bearings that is left. By S: bare grey and gold-grey under SEASON.bud, a thin green veil and buds to SEASON.leaf, leaf to SEASON.bloom,
// bloom beyond. Every piece stands inside the rule of place at full swing, or is not built. Typed figures (len in H):
export const GREY_ROSE = { falls: [7, 11], strands: [6, 10], len: [0.3, 0.6], wide: [1.3, 2.6], foot: 5.5, high: 11, sway: 0.075, swayMost: 1.0, flut: 0.25,
  canes: [3, 7], caneR: [0.035, 0.13], shootFace: 30, shootCone: 0.6, climbs: 0.85, bridgeSpan: [3, 13], sheaf: [9, 14], caneMost: 0.05, caneThin: [0.012, 0.032], sag: [0.14, 0.24], bridgeTop: 0.88, bridgeLen: [0.18, 0.42], bridgeX: [8, 82], bridgeNear: 26, bridgeSprays: 1.6,
  edge: [5, 8], edgeLen: [3.5, 7.5], edgeStrands: [4, 7], edgeHang: [0.4, 0.75], edgeWide: 1.5, edgeTo: 0.55,
  bare: [[0.48, 0.48, 0.53], [0.71, 0.69, 0.74]], green: [[0.36, 0.42, 0.42], [0.5, 0.58, 0.54]], flower: [0.62, 0.62, 0.64], sun: [0.95, 0.82, 0.56],
  roseFrom: 0.25, knotNear: 24, cane: [[0.34, 0.38, 0.36], [0.5, 0.54, 0.5]], roseLeaf: [[0.14, 0.35, 0.37], [0.2, 0.48, 0.45]], young: [0.5, 0.42, 0.36] };
function makeRoser(F, rule, hAt, litAt, rng) {
  const R = GREY_ROSE, S3 = PLAN.sunTo, sl = Math.hypot(S3[0], S3[1], S3[2]), TAU = Math.PI * 2, bareCells = [TWIG_CELLS.hangA, TWIG_CELLS.hangB], hung = [];
  const dim = (c, lit) => { const k = 1 - lit; return [c[0] * (1 - 0.76 * k), c[1] * (1 - 0.71 * k), c[2] * (1 - 0.62 * k)]; };
  const cellFor = (S) => {
    if (S < SEASON.bud) return rng.pick(bareCells);
    if (S < SEASON.leaf) return rng.chance(0.25 + 0.6 * (S - SEASON.bud) / (SEASON.leaf - SEASON.bud)) ? TWIG_CELLS.veil : rng.pick(bareCells);
    return rng.chance(0.78) ? TWIG_CELLS.leaf : TWIG_CELLS.veil;
  };
  const at = (a, b, f) => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
  // one strand from `root` (its sway s0) down by about len0: tried shorter twice, kept only where five places along it
  // pass the rule at full swing and its foot stays R.foot over the grass; `out` is the side it is lit from.
  // IN THE WIND (G7), by its season: a BARE strand is light and stiff (half the hang's own swing beyond its root, and
  // its lower length trembling: flutter up to 1.3); a strand IN LEAF OR BLOOM is heavy (the full slow swing as it
  // was counted, hardly a tremble: 0.4 of the flutter). The rule above is counted on the full figures as before, and
  // no point of a strand reaches farther than it did by that counting.
  const strand = (root, s0, len0, wide, S, out, own) => {
    const g = rng.range(0.38, 0.56);
    const lean = [rng.range(-0.09, 0.09), rng.range(-0.09, 0.09)], kink = [rng.range(-0.05, 0.05), rng.range(-0.05, 0.05)];
    let len = len0, joint, foot, sj, sf;
    for (let tr = 0; ; tr++) {
      joint = [root[0] + (lean[0] * g + kink[0]) * len, root[1] - g * len, root[2] + (lean[1] * g + kink[1]) * len];
      foot = [root[0] + lean[0] * len, root[1] - len, root[2] + lean[1] * len];
      sj = Math.min(R.swayMost, s0 + R.sway * g * len); sf = Math.min(R.swayMost, s0 + R.sway * len);
      const rj = sj * FLORA.swing + R.flut * FLORA.flutter + wide * 0.55, rf = sf * FLORA.swing + R.flut / 0.3 * FLORA.flutter + wide * 0.55;
      if (foot[1] - hAt(foot[0], foot[2]) >= (own ? own.foot : R.foot) && rule.ok(root, s0 * FLORA.swing + wide * 0.55) && rule.ok(joint, rj) && rule.ok(foot, rf)
        && rule.ok(at(root, joint, 0.5), rj) && rule.ok(at(joint, foot, 0.5), rf)) break;
      if (tr === 2) return 0;
      len *= 0.62;
    }
    // (its shape first; the cell is drawn for a strand that stands)
    const cell0 = cellFor(S), green = cell0 === TWIG_CELLS.veil || cell0 === TWIG_CELLS.leaf;
    // a tree's hanging rose stem in leaf: bare cane, its leaf in knots and side shoots (below), not a green fringe
    const rose = !own && green && S >= R.roseFrom, cell = rose ? bareCells[vnoise(root[0] * 3.7 + root[1], root[2] * 3.7) < 0.5 ? 0 : 1] : cell0;
    const lt = green ? 1 : 0.5, A = (v) => s0 + (v - s0) * lt, fj = green ? R.flut * 0.4 : R.flut, ff = green ? R.flut / 0.3 * 0.4 : Math.min(1.3, R.flut / 0.3 + 3.3 * (sj - s0));
    const lit = litAt(joint), sun = Math.max(0, (out[0] * S3[0] + out[1] * S3[1] + out[2] * S3[2]) / sl) * lit, T = rose ? R.cane : green ? R.green : R.bare;
    const dk = root[0] < DOOR_SHADE.to[0] ? sstep(DOOR_SHADE.to[0], DOOR_SHADE.to[1], root[0]) : 0, DR = DOOR_SHADE.rose, litD = lit + (1 - lit) * DR[0] * dk;
    const asleep = (c) => (dk > 0 ? [c[0] * (1 + (DR[1] - 1) * dk), c[1] * (1 + (DR[2] - 1) * dk), c[2] * (1 + (DR[3] - 1) * dk)] : c);
    // (G12: a wall's strand is rooted on the arch over its coping: its root end takes the sun of its own height, never less)
    const litR = own ? Math.max(lit, litAt(root)) : lit, litRD = litR + (1 - litR) * DR[0] * dk;
    const cR = asleep(dim(mix3(T[0], R.sun, 0.3 * sun), litRD)), c1 = asleep(dim(mix3(T[1], R.sun, 0.65 * sun), litD)), cm = mix3(own ? asleep(dim(mix3(T[0], R.sun, 0.3 * sun), litD)) : cR, c1, g), c0 = cR;
    const [u0, vt, u1, vr] = cell, uw = rng.range(0.55, 1), uo = rng.range(0, 1 - uw), flip = rng.chance(0.5), vm = vr + (vt - vr) * g;
    const ua = u0 + (u1 - u0) * (flip ? uo + uw : uo), ub = u0 + (u1 - u0) * (flip ? uo : uo + uw), az = rng.range(0, TAU), face = [Math.cos(az), 0, Math.sin(az)];
    F.card(root, joint, wide, wide * 1.05, face, [ua, vm, ub, vr], c0, cm, s0, A(sj), fj, out);
    F.card(joint, foot, wide * 1.05, wide * 1.12, face, [ua, vt, ub, vm], cm, c1, A(sj), A(sf), ff, out);
    if (rose) {
      // KNOTS: short lengths of the leafed fall laid over the cane at two to four nodes, turned out of the strand's
      // plane; from most nodes a leafy SIDE SHOOT arches out. Young leaf is smaller and a little bronze.
      const L = TWIG_CELLS.leaf, grown = sstep(R.roseFrom, SEASON.leaf + 0.05, S), nearL = rule.toLine(root[0], root[2])[0] < R.knotNear, nk = nearL ? 2 + Math.floor(1.99 * vnoise(root[0] * 1.9, root[2] * 1.9 + 5)) : 1;
      const P = (q) => (q < g ? at(root, joint, q / g) : at(joint, foot, (q - g) / (1 - g))), sw = (q) => (q < g ? s0 + (sj - s0) * q / g : sj + (sf - sj) * (q - g) / (1 - g));
      const la = L[0] + (L[2] - L[0]) * (flip ? uo + uw : uo), lb = L[0] + (L[2] - L[0]) * (flip ? uo : uo + uw), f2 = [Math.cos(az + 0.9), 0, Math.sin(az + 0.9)];
      for (let k = 0; k < nk; k++) {
        const h1 = vnoise(root[0] * 5.3 + k * 7.1, root[2] * 5.3 + root[1]), h2 = vnoise(root[2] * 4.1 - k * 3.3, root[0] * 4.7 + k), q = 0.04 + 0.9 * (k + 0.2 + 0.6 * h1) / nk;
        const kl = (1.1 + 1.1 * h2) * (0.6 + 0.4 * grown) * (nearL ? 1 : 1.8), qa = Math.max(0, q - 0.35 * kl / len), qb = Math.min(1, q + 0.65 * kl / len);
        const green1 = mix3(mix3(R.roseLeaf[0], R.roseLeaf[1], h1), R.young, 0.3 * (1 - grown) * h2), ck = dim(mix3(green1, R.sun, 0.12 * sun), lit);
        F.card(P(qa), P(qb), wide * 1.02, wide * 1.1, f2, [la, L[3] + (L[1] - L[3]) * qb, lb, L[3] + (L[1] - L[3]) * qa], ck, ck, sw(qa), sw(qb), q < g ? fj : ff, out);
        if (h2 > (nearL ? 0.55 : 0.2)) continue;
        const p = P(q), l = (1.1 + 0.9 * h1) * (0.65 + 0.35 * grown), a2 = TAU * vnoise(k * 3.9 + root[0], root[2] * 2.2 + k * 1.3), sp = sw(q);
        const tip = [p[0] + Math.cos(a2) * l * 0.8, p[1] + l * (0.3 - 0.75 * h2), p[2] + Math.sin(a2) * l * 0.8];
        if (!rule.ok(tip, sp * FLORA.swing + 0.6 * FLORA.flutter + l * 0.5)) continue;
        F.card(p, tip, l * 0.75, l * 0.85, [Math.cos(a2 + 1.3), 0.3, Math.sin(a2 + 1.3)], TWIG_CELLS.shoot, ck, ck.map((v) => v * 1.12), sp, Math.min(R.swayMost, sp + 0.06), 0.5, out);
      }
    }
    // what the season hangs on it: buds from SEASON.bud, a leafy shoot from SEASON.leaf, blooms from SEASON.bloom
    const n = S < SEASON.bud ? 0 : S < SEASON.bloom ? (rng.chance(0.6) ? 1 : 0) : rng.int(1, 2);
    for (let k = 0; k < n; k++) {
      const f = rng.range(0.15, 0.9), p = f < g ? at(root, joint, f / g) : at(joint, foot, (f - g) / (1 - g)), sp = s0 + (sf - s0) * f, l = rng.range(1.0, 2.0), a2 = rng.range(0, TAU);
      const tip = [p[0] + Math.cos(a2) * l * 0.5, p[1] - l * rng.range(0.3, 0.85), p[2] + Math.sin(a2) * l * 0.5];
      if (!rule.ok(tip, sp * FLORA.swing + 0.6 * FLORA.flutter + l * 0.5)) continue;
      const head = own && S >= SEASON.bloom && rng.chance(0.75);   // a wall's rose blooms in its plant's one colour
      const c = head ? TWIG_CELLS.heads : S < SEASON.leaf ? TWIG_CELLS.bud : S < SEASON.bloom || own ? TWIG_CELLS.shoot : rng.chance(0.75) ? TWIG_CELLS.bloom : TWIG_CELLS.shoot, cc = head ? dim(own.tint, lit) : dim(mix3(R.flower, R.sun, 0.3 * sun), lit);
      F.card(p, tip, l * 0.9, l * 0.9, [Math.cos(a2 + 1.3), 0, Math.sin(a2 + 1.3)], c, cc, cc, A(sp), Math.min(R.swayMost, A(sp) + 0.08), 0.6, out);
    }
    hung.push([root, foot, wide, S]);
    return len;
  };
  // a fall: n strands rooted along the stretch a..b (its sway sa..sb), the longest lenMost; `heart` is what it hangs round
  const fall = (a, b, sa, sb, n, lenMost, S, heart) => {
    let kept = 0;
    for (let k = 0; k < n; k++) {
      const f = rng.range(0, 1), root = at(a, b, f), out = v3.norm([root[0] - heart[0], 0.4 * Math.hypot(root[0] - heart[0], root[2] - heart[2]) + 0.01, root[2] - heart[2]]);
      root[0] += rng.range(-0.3, 0.3); root[1] -= rng.range(0.1, 0.5); root[2] += rng.range(-0.3, 0.3);
      if (strand(root, sa + (sb - sa) * f, lenMost * (0.45 + 0.55 * Math.pow(rng.range(0, 1), 0.8)), rng.range(R.wide[0], R.wide[1]), S, out)) kept++;
    }
    return kept;
  };
  // the falls of one tree: from stretches of its boughs and branches that stand R.high and more over the grass
  const onTree = (t) => {
    const B = t.built, H = t.H, at0 = [];
    for (const L of B.limbs) {
      if (L.lv > 1) continue;
      const m = L.pts.length - 1, sw = (i) => (L.lv === 0 ? GREY_TREE.sway[0] * i / m : GREY_TREE.sway[0] + (GREY_TREE.sway[1] - GREY_TREE.sway[0]) * i / m);
      for (let i = L.lv === 0 ? 1 : 0; i < m; i++) if ((L.pts[i][1] + L.pts[i + 1][1]) / 2 - B.g0 >= R.high) at0.push([L.pts[i], L.pts[i + 1], sw(i), sw(i + 1)]);
    }
    rng.shuffle(at0);
    let strands = 0;
    for (let k = 0, n = Math.min(at0.length, rng.int(R.falls[0], R.falls[1])); k < n; k++) {
      const [a, b, sa, sb] = at0[k], room = Math.min(a[1], b[1]) - B.g0 - R.foot;
      strands += fall(a, b, sa, sb, rng.int(R.strands[0], R.strands[1]), Math.min(room, H * rng.range(R.len[0], R.len[1])), t.S, B.heart);
    }
    return strands;
  };
  // the canes on one trunk: R.canes of unlike thickness (the first the stoutest) rooted under the grass round one
  // side of the foot; each climbs on the bark by a drift and a wander of its own, so they cross, part and rejoin; the
  // stout ones go on along a bough; side shoots stand off them (bare twig, bud, leafy shoot or bloom by S)
  const canesOn = (t) => {
    const B = t.built, S = t.S, n = rng.int(R.canes[0], R.canes[1]), a0 = rng.range(0, TAU), NS = 7, boughs = B.limbs.filter((L) => L.lv === 0);
    const green = sstep(SEASON.bud, SEASON.leaf, S) * 0.35, wood = mix3(mix3(BARK.dark, BARK.a, 0.55), [0.2, 0.26, 0.1], green);
    const col = (p, nr) => {
      const lit = litAt(p), sun = Math.max(0, (nr[0] * S3[0] + nr[1] * S3[1] + nr[2] * S3[2]) / sl) * lit, c = B.shaded(mix3(wood, BARK.gold, 0.35 * sun), lit);
      return [c[0] * 0.62, c[1] * 0.64, c[2] * 0.74];
    };
    // the bearings a side shoot may take at the node p whose own bearing on the trunk is a0: pieces [from, to]
    const cone = Math.acos(R.shootCone), bearings = (p, a0) => {
      let pieces = [[a0 - 0.7, a0 + 0.7]];
      const ql = rule.toLine(p[0], p[2]);
      if (ql[0] >= R.shootFace) return pieces;
      const el = Math.hypot(ql[4], ql[5]) || 1;
      for (const [tx, tz] of [[ql[2], ql[3]], [ql[2] - ql[4] / el * ql[0], ql[3] - ql[5] / el * ql[0]]]) {
        const ak = Math.atan2(p[0] - tx, p[2] - tz), mid = a0 + (ak - a0) - TAU * Math.round((ak - a0) / TAU), next = [];   // (the bearing that points there, the turn nearest a0)
        for (const [u, v] of pieces) { if (mid + cone <= u || mid - cone >= v) next.push([u, v]); else { if (mid - cone > u) next.push([u, mid - cone]); if (mid + cone < v) next.push([mid + cone, v]); } }
        pieces = next;
      }
      return pieces;
    };
    let made = 0;
    for (let c = 0; c < n; c++) {
      const r = c === 0 ? R.caneR[1] : R.caneR[0] + (R.caneR[1] - R.caneR[0]) * 0.8 * Math.pow(rng.range(0, 1), 1.7), top = c === 0 ? 1 : rng.range(0.55, 1);
      const base = a0 + rng.range(-0.8, 0.8), drift = rng.range(-1.7, 1.7), w1 = rng.range(0.25, 0.7), q1 = rng.range(0, TAU), f1 = rng.range(5, 11), pts = [], angs = [];
      for (let i = 0; i <= NS; i++) {
        const f = 0.03 + (top - 0.03) * i / NS, a = base + drift * f + w1 * Math.sin(q1 + f * f1), ax = B.axis(f), rad = B.trad(f, a) + r * 0.75, p = [ax[0] - Math.sin(a) * rad, ax[1], ax[2] - Math.cos(a) * rad];
        if (!rule.ok(p, r + 0.02)) break;
        pts.push(p); angs.push(a);
      }
      const onTrunk = pts.length, L = top > 0.97 && onTrunk === NS + 1 && boughs.length > 1 && r > 0.06 ? boughs[rng.int(0, 1)] : null;
      if (L) for (let i = 1; i <= Math.min(2, L.pts.length - 1); i++) {
        const m = L.pts.length - 1, lr = L.r + (L.rEnd - L.r) * Math.pow(i / m, 0.8), d = L.dirs[i], side = v3.norm(v3.cross(d, [0, 1, 0])), k = rng.sign();
        const p = v3.add(L.pts[i], v3.norm([side[0] * k, 0.7, side[2] * k]), lr + r * 0.6);
        if (rule.ok(p, r + 0.3)) pts.push(p);
      }
      const m = pts.length - 1;
      if (m < 2) continue;
      F.tube(pts, r > 0.07 ? 4 : 3, (i) => r * (1 - 0.55 * i / m), col, (i) => (i < onTrunk ? 0 : GREY_TREE.sway[0] * (i - onTrunk + 1) / 7), true);
      made++;
      for (let i = 2; i < onTrunk; i++) {
        // (G11: the node's bearings by its place, before any draw; then its chance; then its bearing among them)
        const may = bearings(pts[i], angs[i]), open = may.reduce((q, m) => q + m[1] - m[0], 0);
        if (!lot(rng, 0.3 * open / 1.4)) continue;
        let u = rng.range(0, open), a = may[0][0];
        for (const m of may) { if (u <= m[1] - m[0]) { a = m[0] + u; break; } u -= m[1] - m[0]; }
        const l = rng.range(1.1, 2.3), tip = [pts[i][0] - Math.sin(a) * l * 0.8, pts[i][1] + l * rng.range(0.1, 0.7), pts[i][2] - Math.cos(a) * l * 0.8];
        if (!rule.ok(tip, l * 0.5 + 0.5)) continue;
        const lit = litAt(tip), bare = S < SEASON.bud, cc = bare ? dim(R.bare[1], lit) : dim(R.flower, lit);
        const cell = bare ? TWIG_CELLS.twigA : S < SEASON.leaf ? TWIG_CELLS.bud : S < SEASON.bloom || rng.chance(0.4) ? TWIG_CELLS.shoot : TWIG_CELLS.bloom;
        F.card(pts[i], tip, l * 0.9, l * 0.9, [Math.cos(a), 0, -Math.sin(a)], cell, bare ? dim(R.bare[0], lit) : cc, cc, 0, 0.12, 0.4);
      }
    }
    return made;
  };
  // THE MANTLE'S REACH: from the outer ends of a crown's branches long shoots arch out and down beyond the crown, first
  // toward the neighbouring crowns, and long wide strands hang off them: so crown joins crown in one haze with sky
  // between its strands (in the grey stretch and its first green: the trees whose S is under R.edgeTo)
  const reach = (t, trees) => {
    const B = t.built, ends = [], paint = caneCol(t.S), NS = 4;
    for (const L of B.limbs) {
      const m = L.pts.length - 1, e = L.pts[m], ox = e[0] - B.heart[0], oz = e[2] - B.heart[2], ol = Math.hypot(ox, oz);
      if (L.lv !== 1 || L.stub || e[1] - B.g0 < R.high || ol < 3) continue;
      let toward = 0;
      for (const o of trees) if (o !== t) { const dx = o.x - t.x, dz = o.z - t.z, d = Math.hypot(dx, dz); if (d < 34) toward = Math.max(toward, (dx * ox + dz * oz) / (d * ol)); }
      ends.push([toward + 0.6 * spaceNum(e, 3), e, ox / ol, oz / ol]);   // (a number of the end's own place: no draw for an end that bears nothing)
    }
    ends.sort((a, b) => b[0] - a[0]);
    let strands = 0, shoots = 0;
    for (let k = 0, n = Math.min(ends.length, rng.int(R.edge[0], R.edge[1])); k < n; k++) {
      const [, e, ox, oz] = ends[k], len = rng.range(R.edgeLen[0], R.edgeLen[1]), up = rng.range(0.1, 0.5), drop = rng.range(0.2, 0.55), r = rng.range(0.045, 0.08), tw = rng.range(-0.5, 0.5), pts = [], sw = [];
      const dx = ox * Math.cos(tw) - oz * Math.sin(tw), dz = ox * Math.sin(tw) + oz * Math.cos(tw);
      for (let i = 0; i <= NS; i++) {
        const f = i / NS, p = [e[0] + dx * len * f, e[1] + len * (up * f - (up + drop) * f * f), e[2] + dz * len * f], sway = GREY_TREE.sway[1] + 0.3 * f;
        if (!(rule.ok(p, sway * FLORA.swing + r + 0.1) && p[1] - hAt(p[0], p[2]) >= R.foot + 3)) break;
        pts.push(p); sw.push(sway);
      }
      const m = pts.length - 1;
      if (m < 2) continue;
      F.tube(pts, 3, (i) => r * (1 - 0.7 * i / m), paint, (i) => sw[i], true);
      shoots++;
      for (let q = 0, nq = rng.int(R.edgeStrands[0], R.edgeStrands[1]); q < nq; q++) {
        const f = rng.range(0.2, 1) * m, i = Math.min(m - 1, Math.floor(f)), root = at(pts[i], pts[i + 1], f - i), room = root[1] - hAt(root[0], root[2]) - R.foot;
        if (strand([root[0], root[1] - 0.05, root[2]], sw[i] + (sw[i + 1] - sw[i]) * (f - i), Math.min(room, t.H * rng.range(R.edgeHang[0], R.edgeHang[1])), rng.range(R.wide[0], R.wide[1]) * R.edgeWide, t.S, v3.norm([dx, 0.6, dz]))) strands++;
      }
    }
    return [strands, shoots];
  };
  // the wood of a cane or a rope by the season at its rose's root
  const caneCol = (S) => {
    const wood = mix3(mix3(BARK.dark, BARK.a, 0.6), [0.2, 0.26, 0.1], sstep(SEASON.bud, SEASON.leaf, S) * 0.35);
    return (p, nr) => {
      const lit = litAt(p), sun = Math.max(0, (nr[0] * S3[0] + nr[1] * S3[1] + nr[2] * S3[2]) / sl) * lit, c = dim(mix3(wood, BARK.gold, 0.35 * sun), lit);
      return [c[0] * 0.62, c[1] * 0.64, c[2] * 0.74];
    };
  };
  // THE BRIDGES (G10b: built anew). A rose caught from one crown to the NEXT: it begins at the end of a bough or branch
  // of a tree the rose has climbed (canes up its trunk, the mantle over its boughs) and ends at the end of a bough or
  // branch of a neighbour that it has climbed too. Both ends stand on their own tree's side toward the other, R.high
  // and more over the grass and no higher than R.bridgeTop of their tree (inside the crowns, never over them), and
  // lie R.bridgeSpan apart (no more than the gap between two neighbouring crowns). THE PLACE'S OWN RULE (G11, said at
  // the part's head): OLD ROSES HAVE BRIDGED THE WAY THROUGH THE GARDEN, so of each pair of trees the two ends are
  // taken that lie nearest each other and squarest across the way, and the pairs whose middle lies within
  // R.bridgeNear of it (its x there within R.bridgeX) stand in the plan, the nearest and squarest first (the order
  // moved a little by a number of each pair's own place: no draw is taken for a pair that bears nothing).
  const bareTwigs = [TWIG_CELLS.twigA, TWIG_CELLS.twigB, TWIG_CELLS.twigC];
  const bridgePlan = async (trees, yieldNow) => {
    const ends = (t) => { const out = []; if (t.caned) for (const L of t.built.limbs) { const h = L.pts[L.pts.length - 1][1] - t.built.g0; if (L.lv <= 1 && !L.stub && L.pts.length > 2 && h >= R.high && h <= R.bridgeTop * t.H) out.push(L); } return out; };
    const Es = trees.map(ends), plan = [], cut = Math.round(trees.length * 0.3);
    for (let i = 0; i < trees.length; i++) for (let j = i + 1; j < trees.length; j++) {
      if (yieldNow && i === cut && j === i + 1) await yieldNow(3.5);
      const dx = trees[j].x - trees[i].x, dz = trees[j].z - trees[i].z, d = Math.hypot(dx, dz);
      if (d > 36 || !Es[i].length || !Es[j].length) continue;
      const q = rule.toLine((trees[i].x + trees[j].x) / 2, (trees[i].z + trees[j].z) / 2);
      if (q[2] < R.bridgeX[0] || q[2] > R.bridgeX[1] || q[0] > R.bridgeNear) continue;
      const el = Math.hypot(q[4], q[5]) || 1, hx = q[4] / el, hz = q[5] / el;
      let best = null;
      for (const la of Es[i]) for (const lb of Es[j]) {
        const a = la.pts[la.pts.length - 1], b = lb.pts[lb.pts.length - 1], ex = b[0] - a[0], ez = b[2] - a[2], ey = b[1] - a[1], pl = Math.hypot(ex, ez), span = Math.hypot(pl, ey);
        if (span < R.bridgeSpan[0] || span > R.bridgeSpan[1] || pl < 1) continue;
        if ((a[0] - trees[i].x) * dx + (a[2] - trees[i].z) * dz < 0 || (b[0] - trees[j].x) * dx + (b[2] - trees[j].z) * dz > 0) continue;
        const sq = Math.abs(ex * hz - ez * hx) / pl, v = 6 * sq - 0.5 * span - 0.5 * Math.abs(ey);
        if (!best || v > best.v) best = { v, a, b, la, lb, span, sq };
      }
      if (best) { const mx = (best.a[0] + best.b[0]) / 2, mz = (best.a[2] + best.b[2]) / 2; plan.push({ ...best, i, j, mx, mz, score: q[0] - 14 * best.sq + 6 * placeNum(mx, mz) }); }
    }
    return plan.sort((a, b) => a.score - b.score);
  };
  // one bridge of the plan: A SHEAF OF THIN CANES, R.sheaf of them, never a rope: the first is the stoutest (R.caneMost
  // in radius: 0.1 m through, thin beside any bough), the rest R.caneThin; each LIES ALONG ITS BOUGH for a metre or
  // two at either end (its hold) and swings free between, of its own sag and wander, so the canes part and cross;
  // each hangs as deep as the rule lets it (over the line 10 m and more above it at full swing, elsewhere R.foot + 4
  // over the grass). Strands hang off the whole length of every cane and side sprays stand off them: each is rooted
  // at a point of a cane. WHAT IS BUILT STANDS (G11): none is taken out again. A PAIR BEARS A BRIDGE only where
  // three plain canes pass the rule (bears, asked before any draw): hung from the two limbs at their ends, 0.9 m
  // back and 1.8 m back, with the least sag a cane is dealt (or what its room lets), no wander, the stoutest girth.
  const free = (x, y, z, reach) => rule.ok([x, y, z], reach + 0.1) && y - reach - hAt(x, z) >= R.foot + 4;
  const room = (pa, pb) => {
      let most = 1e9;
      for (let k = 1; k < 12; k++) {
        const f = k / 12, x = pa[0] + (pb[0] - pa[0]) * f, z = pa[2] + (pb[2] - pa[2]) * f, q = rule.toLine(x, z);
        const floor = Math.max(hAt(x, z) + R.foot + 6.5, q[0] < GREY.nearLine + 3 ? q[1] + GREY.over + 4.2 : -1e9);
        most = Math.min(most, (pa[1] + (pb[1] - pa[1]) * f - floor) / (4 * f * (1 - f)));
      }
      return most;
  };
  // a place on a limb `back` metres from its end along it, with the limb's own sway there
  const onLimb = (L, back) => {
    const m = L.pts.length - 1, sw = (f) => (L.lv === 0 ? GREY_TREE.sway[0] * f : GREY_TREE.sway[0] + (GREY_TREE.sway[1] - GREY_TREE.sway[0]) * f);
    for (let i = m; i > 0; i--) {
      const A = L.pts[i], B = L.pts[i - 1], dl = Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]) || 1;
      if (back <= dl || i === 1) { const g = Math.min(1, back / dl), p = at(A, B, g); p.push(sw((i - g) / m)); return p; }
      back -= dl;
    }
    return [...L.pts[0], 0];
  };
  const bears = (it) => {
    for (const back of [0, 0.9, 1.8]) {
      const pa = onLimb(it.la, back), pb = onLimb(it.lb, back), sp = Math.hypot(pb[0] - pa[0], pb[1] - pa[1], pb[2] - pa[2]), sag = Math.min(0.7 * R.sag[0] * sp, room(pa, pb));
      if (sp < 2 || sag < 0.05 * sp) return false;
      for (let i = 1; i < 11; i++) {
        const f = i / 11, e = 4 * f * (1 - f), sway = Math.min(1, pa[3] + (pb[3] - pa[3]) * f + 3.5 * e * sag / sp);
        if (!free(pa[0] + (pb[0] - pa[0]) * f, pa[1] + (pb[1] - pa[1]) * f - sag * e + R.caneMost * (1 - e), pa[2] + (pb[2] - pa[2]) * f, sway * FLORA.swing + R.caneMost)) return false;
      }
    }
    return true;
  };
  const bridge = (trees, it) => {
    const { a, b, la, lb, span } = it, S = trees[it.i].S, Hm = (trees[it.i].H + trees[it.j].H) / 2, paint = caneCol(S), pts = [];
    const side = v3.norm([a[2] - b[2], 0, b[0] - a[0]]);
    let ropes = 0, strands = 0;
    for (let k = 0, n = rng.int(R.sheaf[0], R.sheaf[1]); k < n; k++) {
      const ba = rng.range(0, 1.8), bb = rng.range(0, 1.8), pa = onLimb(la, ba), pb = onLimb(lb, bb), sp = Math.hypot(pb[0] - pa[0], pb[1] - pa[1], pb[2] - pa[2]), most = room(pa, pb);
      if (sp < 2 || most < 0.05 * sp) continue;         // (its two ends first: the least sag dealt is 0.098 of its span)
      const qa = onLimb(la, ba + rng.range(1.2, 2.4)), qb = onLimb(lb, bb + rng.range(1.2, 2.4));
      const r = k === 0 ? R.caneMost : R.caneThin[0] + (R.caneThin[1] - R.caneThin[0]) * Math.pow(rng.range(0, 1), 1.6);
      const sag = Math.min(rng.range(0.7, 1.35) * rng.range(R.sag[0], R.sag[1]) * sp, most), wob = rng.range(0.1, 0.5), ph = rng.range(0, TAU), nw = rng.range(1.2, 3.2), NS = k === 0 ? 11 : 8;
      const line = [[qa[0], qa[1] + r, qa[2]]], sw = [qa[3]];
      let good = true;
      for (let i = 0; i <= NS && good; i++) {
        const f = i / NS, e = 4 * f * (1 - f), o = wob * e * Math.sin(ph + f * nw * Math.PI), sway = Math.min(1, pa[3] + (pb[3] - pa[3]) * f + 3.5 * e * sag / sp);
        const p = [pa[0] + (pb[0] - pa[0]) * f + side[0] * o, pa[1] + (pb[1] - pa[1]) * f - sag * e + 0.3 * wob * e * Math.cos(ph * 1.7 + f * 7) + r * (1 - e), pa[2] + (pb[2] - pa[2]) * f + side[2] * o];
        good = i === 0 || i === NS || free(p[0], p[1], p[2], sway * FLORA.swing + r);
        line.push(p); sw.push(sway);
      }
      if (!good) continue;
      line.push([qb[0], qb[1] + r, qb[2]]); sw.push(qb[3]);
      F.tube(line, 3, (i) => r * (0.85 + 0.15 * Math.cos(i * 1.9 + ph)), paint, (i) => sw[i]);
      for (let i = 1; i <= NS + 1; i++) pts.push([line[i][0], line[i][1], line[i][2], sw[i]]);
      ropes++;
    }
    for (let q = 0, nq = pts.length ? Math.round(span / rng.range(0.3, 0.45)) : 0; q < nq; q++) {
      const p = pts[Math.min(pts.length - 1, Math.floor((q + rng.range(0, 1)) / nq * pts.length))], ql = rule.toLine(p[0], p[2]), over = ql[0] < GREY.nearLine + 3.6;
      // over the line a strand is a short fringe that stays 10 m and more over the flown line at full swing
      const most = over ? Math.min(3.5, p[1] - ql[1] - GREY.over - 3.1) : p[1] - hAt(p[0], p[2]) - R.foot;
      if (most < 1) continue;                            // (its root first: the least length dealt is over 4 m)
      const az = rng.range(0, TAU), len = over ? most : Math.min(most, Hm * rng.range(R.bridgeLen[0], R.bridgeLen[1]));
      if (strand([p[0], p[1] - 0.05, p[2]], p[3], len, over ? rng.range(0.9, 1.2) : rng.range(R.wide[0], R.wide[1]), S, v3.norm([Math.cos(az), 1.1, Math.sin(az)]))) strands++;
    }
    // side sprays stand off the canes all along (bare twig, bud, leafy shoot or bloom by S)
    for (let q = 0, nq = pts.length ? Math.round(span * R.bridgeSprays) : 0; q < nq; q++) {
      const p = rng.pick(pts), l = rng.range(1.0, 2.2), az = rng.range(0, TAU), tip = [p[0] + Math.cos(az) * l * 0.7, p[1] + l * rng.range(-0.5, 0.7), p[2] + Math.sin(az) * l * 0.7], sway = Math.min(1, p[3] + 0.12);
      if (!free(p[0], p[1], p[2], p[3] * FLORA.swing + l * 0.5) || !free(tip[0], tip[1], tip[2], sway * FLORA.swing + 0.4 * FLORA.flutter + l * 0.5)) continue;
      const lit = litAt(tip), bare = S < SEASON.bud, cc = bare ? dim(R.bare[1], lit) : dim(R.flower, lit);
      const cell = bare ? rng.pick(bareTwigs) : S < SEASON.leaf ? TWIG_CELLS.bud : S < SEASON.bloom || rng.chance(0.4) ? TWIG_CELLS.shoot : TWIG_CELLS.bloom;
      F.card(p, tip, l * 0.9, l * 0.9, [Math.cos(az + 1.4), 0, Math.sin(az + 1.4)], cell, bare ? dim(R.bare[0], lit) : cc, cc, p[3], sway, 0.4);
    }
    return { ropes, strands };
  };
  // the plan's bridges in their order until `most` stand: no crown bears more than two, none stands within 8 m of
  // another, and none where the pair's three plain canes do not pass the rule (bears)
  const bridges = async (trees, most, yieldNow, breathe) => {
    const out = { bridges: 0, ropes: 0, strands: 0, at: [] }, used = new Map(), n = (i) => used.get(i) || 0, plan = await bridgePlan(trees, yieldNow);
    for (const it of plan) {
      if (out.bridges >= most) break;
      if (n(it.i) > 1 || n(it.j) > 1 || out.at.some((o) => (o.i === it.i && o.j === it.j) || Math.hypot(o.mx - it.mx, o.mz - it.mz) < 8) || !bears(it)) continue;
      const b = bridge(trees, it);
      if (breathe) await breathe();
      if (!b.ropes) continue;
      used.set(it.i, n(it.i) + 1); used.set(it.j, n(it.j) + 1);
      const q = rule.toLine(it.mx, it.mz);
      out.bridges++; out.ropes += b.ropes; out.strands += b.strands;
      out.at.push({ i: it.i, j: it.j, mx: it.mx, mz: it.mz, lineX: +q[2].toFixed(1), toLine: +q[0].toFixed(1), square: +it.sq.toFixed(2), span: +it.span.toFixed(1), low: +(Math.min(it.a[1], it.b[1]) - q[1]).toFixed(1), ropes: b.ropes, strands: b.strands });
    }
    return out;
  };
  // (use: the stream every later piece is dealt by; G10b: the bridges have their own)
  return { strand, fall, onTree, canesOn, reach, bridges, dim, at, hung, climbs: () => rng.chance(R.climbs), use: (r) => { rng = r; } };
}
// THE GREY, built: every old tree, its canes and the hanging roses in ONE mesh of the kit's one wind material.
// o = { lay (layGrey's), sunAt, rng, stream (for 'grey-roses' and 'grey-bridges'), heightAt, material (the kit's), yieldNow, dry (count only, build no mesh) }
export async function buildGrey(o) {
  const { rng, heightAt } = o, { trees, rule } = o.lay, F = makeFloraBuf(), litAt = (q) => o.sunAt(q[0], q[1], q[2]);
  for (let i = 0, at = 0; i < trees.length; i++) {
    const t = trees[i], n = (t.built = greyTree(F, { x: t.x, z: t.z, H: t.H, ok: rule.ok, hAt: heightAt, litAt }, rng), F.count());
    // (the first tree stands alone: cold code; then by 5500 triangles)
    if (o.yieldNow && (i === 0 || i === trees.length - 1 || n - at >= 5500)) { const w = i === 0 ? 12 : (n - at) * 0.0015; at = n; await o.yieldNow(w); }
  }
  const wood = F.count(), roser = makeRoser(F, rule, heightAt, litAt, o.stream('grey-roses')), breathe = breathAfter(o.yieldNow, F.count, 5000, 10.5);
  let strands = 0, canes = 0, shoots = 0;
  for (const t of trees) {
    if (roser.climbs()) { const made = roser.canesOn(t); t.caned = made > 0; canes += made; } else t.caned = false;
    strands += roser.onTree(t);
    if (t.S < GREY_ROSE.edgeTo) { const e = roser.reach(t, trees); strands += e[0]; shoots += e[1]; }
    await breathe();
  }
  // (the bridges are dealt by a stream of their own, 'grey-bridges'; the trees' own roses by 'grey-roses')
  roser.use(o.stream('grey-bridges'));
  const br = await roser.bridges(trees, GREY.bridges, o.yieldNow, breathe);
  const info = { trees: trees.length, triangles: F.count(), wood, strands: strands + br.strands, canes, shoots, bridges: br.bridges, ropes: br.ropes, bridgesAt: br.at };
  if (o.dry) return { info: { ...info, ...floraClearance(F, rule) }, trees, falls: roser.hung };
  await breathe(true, 12);
  const mesh = F.build('garden-grey', o.material);
  return { object: mesh.object, geometry: mesh.geometry, info, trees, falls: roser.hung };
}

// ---------------------------------------------------------------- the undergrowth of the grey stretch
// What ten years left on the floor, off the flown line: brambles and old rose bushes as arching mounds of bare canes;
// one fallen trunk under moss and a few fallen boughs; drifts of dead leaves lying low in the ground's hollows;
// long dead grass lying in swathes; the stone edging of lost beds, half sunk, in broken runs. Thinly the same along the
// walls' feet everywhere, each plant in the state of S at its own root. LAID OUT first (places only), so that the grass
// gives way where a thing lies; then built as one mesh of the grey's one material. Typed figures:
export const UNDER = { to: 74, mounds: 13, wallMounds: 12, moundR: [2.4, 4.8], moundH: [3, 7], canes: [16, 28], caneR: [0.11, 0.025], apart: 7, logs: 3, trunkLen: [11, 15], trunkR: [0.6, 0.38],
  boughLen: [5, 8.5], boughR: [0.24, 0.09], logToLine: 7.6, drifts: 22, wallDrifts: 10, driftR: [2.2, 4.6], driftH: [0.45, 0.8], swathes: 26, wallSwathes: 10, swatheR: [2.2, 4], swatheTo: 0.45,
  beds: 4, bedA: [5, 9], bedB: [3, 5], stone: [0.75, 1.25], stoneR: [0.24, 0.36], cell: 1,
  // the greening thickets of the middle: old rose bushes in clusters, in young leaf
  thickets: 11, thicketX: [44, 72], thicketR: [2.6, 4.6], thicketH: [3, 6], thicketCanes: [8, 11], leafFrom: 0.33,
  roseLeaf: [[0.2, 0.4, 0.37], [0.31, 0.56, 0.45]], youngLeaf: [0.34, 0.62, 0.4], bronze: [0.75, 0.42, 0.4], oldCane: [[0.11, 0.105, 0.085], [0.2, 0.19, 0.14]] };
// o = { rng, rngT (the thickets' own stream), rule (the grey's), heightAt, trees }
export function layUnder(o) {
  const { rng, rule, heightAt: hAt, trees } = o, U = UNDER, G = PLAN.garden, TAU = Math.PI * 2;
  const nx = Math.ceil((G.x1 - G.x0) / U.cell) + 1, nz = Math.ceil((G.z1 - G.z0) / U.cell) + 1, K = new Float32Array(nx * nz).fill(1);
  // the grass gives way: an oval (rx along the angle az, rz across it) in which the tufts thin to v. K is the lattice
  // of PLACE: what lies where, for all that is laid after and for the grass. Only what is built stamps it.
  const stamp = (x, z, rx, rz, az, v) => {
    const c = Math.cos(az), sn = Math.sin(az), m = Math.max(rx, rz);
    for (let j = Math.max(0, Math.floor((z - m - G.z0) / U.cell)); j <= Math.min(nz - 1, Math.ceil((z + m - G.z0) / U.cell)); j++) {
      for (let i = Math.max(0, Math.floor((x - m - G.x0) / U.cell)); i <= Math.min(nx - 1, Math.ceil((x + m - G.x0) / U.cell)); i++) {
        const dx = G.x0 + i * U.cell - x, dz = G.z0 + j * U.cell - z, a = (dx * c + dz * sn) / rx, b = (-dx * sn + dz * c) / rz;
        if (a * a + b * b < 1) { const q = j * nx + i; K[q] = Math.min(K[q], v); }
      }
    }
  };
  const clear = (x, z) => { const i = Math.round((x - G.x0) / U.cell), j = Math.round((z - G.z0) / U.cell); return i >= 0 && j >= 0 && i < nx && j < nz ? K[j * nx + i] : 1; };
  const offTrees = (x, z, d) => trees.every((t) => Math.hypot(t.x - x, t.z - z) > d + 0.03 * t.H);
  const inGarden = (x, z, m) => x > G.x0 + m && x < G.x1 - m && z > G.z0 + m && z < G.z1 - m;
  const offDoor = (x, z) => !(x < 9 && Math.abs(z) < 11) && Math.hypot(x - PLAN.roseTree[0], z - PLAN.roseTree[1]) > 15;
  const toLine = (x, z) => rule.toLine(x, z)[0];
  // a place at a wall's foot, d in from its face: [x, z, the wall's run as an angle]
  const wallFoot = (d) => {
    const w = rng.int(0, 3), q = rng();
    return w === 0 ? [G.x0 + d, G.z0 + 3 + q * (G.z1 - G.z0 - 6), TAU / 4] : w === 3 ? [G.x1 - d, G.z0 + 3 + q * (G.z1 - G.z0 - 6), TAU / 4] : [G.x0 + 3 + q * (G.x1 - G.x0 - 6), w === 1 ? G.z0 + d : G.z1 - d, 0];
  };
  // THE MOUNDS of bramble and old rose: nearer the line rather than far from it, never on it nor in the lane
  const mounds = [];
  // (G11: its place first, then its chance by its place, then its radius, which the rule of the line tries; a mound
  // that stands draws the rest)
  const tryMound = (x, z, p, r0, r1) => {
    if (!inGarden(x, z, 1.2) || !offDoor(x, z) || !offTrees(x, z, 2.2) || mounds.some((m) => Math.hypot(m.x - x, m.z - z) < U.apart) || !lot(rng, p)) return;
    const R = rng.range(r0, r1);
    if (!rule.ok([x, hAt(x, z) + 2, z], R + 0.9)) return;
    mounds.push({ x, z, R, H: U.moundH[0] + (U.moundH[1] - U.moundH[0]) * (R - U.moundR[0]) / (U.moundR[1] - U.moundR[0]) * rng.range(0.7, 1), S: seasonAt(x, z), rose: rng.chance(0.5) });
    stamp(x, z, R * 0.55, R * 0.55, 0, 0.25);
  };
  for (let k = 0; k < 500 && mounds.length < U.mounds; k++) { const x = rng.range(2, U.to), z = rng.range(G.z0 + 2, G.z1 - 2); tryMound(x, z, sstep(46, 14, toLine(x, z)), U.moundR[0], U.moundR[1]); }
  for (let k = 0, n = mounds.length + U.wallMounds; k < 300 && mounds.length < n; k++) { const p = wallFoot(rng.range(1.6, 3.6)); tryMound(p[0], p[1], 1, U.moundR[0], U.moundR[0] + 1.4); }
  // THE FALLEN WOOD: the first is the trunk; every place of each U.logToLine and its stubs' reach from the line
  const logs = [];
  for (let k = 0; k < 900 && logs.length < U.logs + 1; k++) {
    const trunk = logs.length === 0, L = rng.range(...(trunk ? U.trunkLen : U.boughLen)), x = rng.range(6, U.to - 6), z = rng.range(G.z0 + 6, G.z1 - 6), az = rng.range(0, TAU);
    const at = (f) => [x + Math.cos(az) * L * (f - 0.5), z + Math.sin(az) * L * (f - 0.5)];
    let ok = toLine(x, z) < (trunk ? 22 : 27) && !logs.some((l) => Math.hypot(l.x - x, l.z - z) < 14);
    for (let f = 0; f <= 1 && ok; f += 0.125) { const p = at(f); ok = inGarden(p[0], p[1], 2) && toLine(p[0], p[1]) > U.logToLine + 2.6 && rule.toLane(p[0], p[1])[0] > 1.2 && offTrees(p[0], p[1], 1.2) && !mounds.some((m) => Math.hypot(m.x - p[0], m.z - p[1]) < m.R * 0.7); }
    if (!ok) continue;
    logs.push({ x, z, az, L, trunk, seed: rng.range(0, 99) });
    for (let f = 0; f <= 1; f += 0.125) { const p = at(f); stamp(p[0], p[1], 1.7, 1.7, 0, 0); }
  }
  // THE DRIFTS of dead leaves: in the lowest of the ground's hollows, and blown against the walls' feet
  // (G11: THE HOLLOWS ARE THE GROUND'S OWN: the stations of a 4 m lattice over the grey stretch, each moved within
  // its cell by a number of its own place, the lowest first, a little the nearer the line; no place is dealt to be
  // thrown away. A drift's place is asked before its size is dealt.)
  const drifts = [], cand = [];
  for (let gx = 2; gx < U.to - 4; gx += 4) for (let gz = G.z0 + 3; gz < G.z1 - 7; gz += 4) {
    const x = gx + 4 * placeNum(gx, gz), z = gz + 4 * placeNum(gz + 0.37, gx);
    cand.push([hAt(x, z) - riseAt(x) + 0.25 * placeNum(x, z) + 0.012 * toLine(x, z), x, z]);
  }
  cand.sort((p, q) => p[0] - q[0]);
  const tryDrift = (x, z, deal) => {
    if (!inGarden(x, z, 0.6) || !offDoor(x, z) || !offTrees(x, z, 1.5) || clear(x, z) < 1) return;
    const [az, rx, rz] = deal();
    if (toLine(x, z) < rx + 3.5 || drifts.some((d) => Math.hypot(d.x - x, d.z - z) < d.rx + rx + 1.5)) return;
    // THE DOOR'S RULE: no leaf within 8 m of the lane's centre line in the first 25 m inside the door (there the floor
    // is winter grass, green points and snowdrops): a drift that would reach there is laid smaller (k of its oval,
    // and it IS that smaller drift from here on), or not at all: then it takes no draw and stamps nothing (G9b)
    const room = Math.max(Math.abs(z - 0.0875 * x) - 8, x - 25) - 0.7, k = Math.max(0, Math.min(1, room / (1.3 * rx)));
    if (k < 0.4) return;
    drifts.push({ x, z, az, rx: rx * k, rz: rz * k, h: rng.range(...U.driftH), seed: rng.range(0, 99) });
    stamp(x, z, rx * k * 0.9, rz * k * 0.9, az, 0.08);
  };
  for (const c of cand) { if (drifts.length >= U.drifts) break; tryDrift(c[1], c[2], () => { const R = rng.range(...U.driftR); return [rng.range(0, TAU), R * rng.range(1, 1.6), R]; }); }
  for (let k = 0, n = drifts.length + U.wallDrifts; k < 200 && drifts.length < n; k++) { const d = rng.range(1.3, 2.4), p = wallFoot(d); tryDrift(p[0], p[1], () => [p[2], d * rng.range(2, 3.4), d * 0.95]); }
  // THE SWATHES of long dead grass, lying one way with the winter's wind (while the place is still grey)
  const swathes = [];
  for (let k = 0, n = U.swathes + U.wallSwathes; k < 1500 && swathes.length < n; k++) {
    const wall = swathes.length >= U.swathes, p = wall ? wallFoot(rng.range(1.5, 4)) : [rng.range(2, U.to), rng.range(G.z0 + 3, G.z1 - 3)], x = p[0], z = p[1];
    if (seasonAt(x, z) > U.swatheTo || !inGarden(x, z, 1) || !offDoor(x, z) || clear(x, z) < 1 || toLine(x, z) < 2.5 || (!wall && !lot(rng, sstep(50, 12, toLine(x, z))))) continue;
    const R = rng.range(...U.swatheR);                   // (its place and its chance first)
    if (swathes.some((w) => Math.hypot(w.x - x, w.z - z) < w.R + R)) continue;
    const az = 0.6 + rng.range(-0.5, 0.5);
    swathes.push({ x, z, R, az });
    stamp(x, z, R * 1.2, R * 0.8, az, 0.2);
  }
  // THE LOST BEDS: ovals whose stone edging stands on in broken runs; some stones are places for the bulbs
  const beds = [], stones = [], edging = [];
  for (let k = 0; k < 400 && beds.length < U.beds; k++) {
    const x = rng.range(8, U.to - 6), z = rng.range(G.z0 + 10, G.z1 - 10), d = toLine(x, z);
    if (d < 5 || d > 24 || !offDoor(x, z) || !offTrees(x, z, 3) || beds.some((b) => Math.hypot(b.x - x, b.z - z) < 22)) continue;   // (its place first)
    const B = rng.range(...U.bedB);
    if (mounds.some((m) => Math.hypot(m.x - x, m.z - z) < m.R + B)) continue;
    const A = rng.range(...U.bedA), az = rng.range(0, Math.PI);
    beds.push({ x, z, A, B, az });
    const c = Math.cos(az), sn = Math.sin(az);
    let on = true, left = rng.range(4, 9);
    for (let a = rng.range(0, 1); a < TAU;) {
      const len = rng.range(...U.stone), ca = Math.cos(a), sa = Math.sin(a), px = x + c * ca * A - sn * sa * B, pz = z + sn * ca * A + c * sa * B;
      const tx = -c * sa * A - sn * ca * B, tz = -sn * sa * A + c * ca * B;
      if (on && toLine(px, pz) > 1.6 && offTrees(px, pz, 0.8) && clear(px, pz) > 0.1) {
        stones.push({ x: px, z: pz, az: Math.atan2(tz, tx) + rng.range(-0.25, 0.25), len, r: rng.range(...U.stoneR), tilt: rng.range(-0.3, 0.3), sunk: rng(), seed: rng.range(0, 99) });
        if (rng.chance(0.3)) edging.push([px, pz]);
      }
      a += (len + rng.range(0.03, 0.2)) / Math.hypot(tx, tz); left -= len;
      if (left < 0) { on = !on; left = on ? rng.range(4, 10) : rng.range(1.5, 4.5); }
    }
    stamp(x, z, A * 0.85, B * 0.85, az, 0.45);
  }
  for (const q of stones) stamp(q.x, q.z, 1, 1, 0, 0);
  // THE GREENING THICKETS (laid last, by a stream of their own): clusters of two to
  // four old rose bushes on the lane's two flanks and on the far side of the line, never in the lane, never by the fork
  if (o.rngT) {
    const rt = o.rngT, F0 = PLAN.fork, firs = [];
    const fits = (x, z, R) => inGarden(x, z, 3) && offTrees(x, z, 2.2) && rule.ok([x, hAt(x, z) + 2, z], R + 0.9) && rule.toLane(x, z)[0] > R * 1.1 + 0.6
      && Math.hypot(x - F0[0], z - F0[1]) > R + 6.5 && (o.blossom || []).every((t) => Math.hypot(t.x - x, t.z - z) > R + 4.5)
      && mounds.every((m) => Math.hypot(m.x - x, m.z - z) > (m.thicket ? 0.72 : 0.85) * (m.R + R))
      && logs.every((l) => [0, 0.25, 0.5, 0.75, 1].every((q) => Math.hypot(l.x + Math.cos(l.az) * l.L * (q - 0.5) - x, l.z + Math.sin(l.az) * l.L * (q - 0.5) - z) > R * 0.7 + 1.6))
      && drifts.every((d) => Math.hypot(d.x - x, d.z - z) > d.rx * 0.7 + R * 0.5);
    for (let k = 0, n = mounds.length + U.thickets; k < 1600 && mounds.length < n; k++) {
      const x = rt.range(...U.thicketX), zone = rt.int(0, 2), cz = 0.0875 * x, zl = rule.toLine(x, cz - 30)[3];
      const z = zone === 0 ? cz - 8 - rt.range(4.5, 11) : zone === 1 ? cz + 8 + rt.range(4.5, 12) : zl - rt.range(10, 19);
      if (firs.some((p) => Math.hypot(p[0] - x, p[1] - z) < 11)) continue;
      let made = 0, R0 = 0;
      for (let j = 0, nj = rt.int(2, 4); j < 9 && made < nj && mounds.length < n; j++) {
        const R = made ? rt.range(U.thicketR[0], U.thicketR[1] - 0.7) : rt.range(U.thicketR[0] + 0.8, U.thicketR[1]), a = rt.range(0, TAU), r = made ? rt.range(0.75, 1.1) * (R0 + R) : 0, mx = x + Math.cos(a) * r, mz = z + Math.sin(a) * r;
        if (!fits(mx, mz, R)) { if (!made) break; continue; }
        if (!made) R0 = R;
        mounds.push({ x: mx, z: mz, R, H: U.thicketH[0] + (U.thicketH[1] - U.thicketH[0]) * (R - U.thicketR[0]) / (U.thicketR[1] - U.thicketR[0]) * rt.range(0.75, 1), S: seasonAt(mx, mz), rose: true, thicket: true });
        stamp(mx, mz, R * 0.55, R * 0.55, 0, 0.25);
        made++;
      }
      if (made) firs.push([x, z]);
    }
  }
  return { mounds, logs, drifts, swathes, beds, stones, edging, clear, feet: trees.map((t) => [t.x, t.z, t.H]) };
}

// o = { lay (layUnder's), rule, sunAt, shade (the baked shadows' factor at a place), rng, rngT (the thickets' own stream), heightAt, material (the grey's), yieldNow, dry (count only, build no mesh) }
export async function buildUnder(o) {
  const { rng, heightAt: hAt, rule, lay } = o, U = UNDER, G = PLAN.garden, TAU = Math.PI * 2, F = makeFloraBuf(), S3 = v3.norm(PLAN.sunTo), GR = GREY_ROSE, W = WALL_ROSE, breathe = breathAfter(o.yieldNow, F.count, 3500, 4.3, 10);
  // (THE FAR END'S SOUTH WALL IN ITS OWN SHADE: a mound that stands in it is filled by its own place, as the wall's
  // roses are, so it reads soft and never black: W.under)
  let fill = 0;
  const farFill = (x, z) => sstep(W.fill[4], W.fill[5], x) * sstep(G.z1 - W.under[4], G.z1 - W.under[5], z);
  const litAt = (q) => o.sunAt(q[0], q[1], q[2]), dim = (c, lit) => {
    const k = 1 - lit, d = [c[0] * (1 - 0.76 * k), c[1] * (1 - 0.71 * k), c[2] * (1 - 0.62 * k)], t = fill * k, Q = W.under;
    return t > 0 ? [d[0] * (1 + Q[0] * t) + Q[1] * t, d[1] * (1 + Q[0] * t) + Q[2] * t, d[2] * (1 + Q[0] * t) + Q[3] * t] : d;
  };
  const twigs = [TWIG_CELLS.twigA, TWIG_CELLS.twigB, TWIG_CELLS.twigC], inX = (v) => Math.max(G.x0 + 0.35, Math.min(G.x1 - 0.35, v)), inZ = (v) => Math.max(G.z0 + 0.35, Math.min(G.z1 - 0.35, v));
  const info = { mounds: 0, canes: 0, logs: 0, drifts: 0, swathes: 0, stones: 0, triangles: 0 };
  // a colour in the low sun at p (its normal n): gilded where the sun strikes, cooled in shade
  const lit3 = (c, p, n, gild = 0.35) => { const l = litAt(p), s = gild * Math.max(0, n[0] * S3[0] + n[1] * S3[1] + n[2] * S3[2]) * l; return dim([c[0] * (1 + 1.5 * s), c[1] * (1 + 1.3 * s), c[2] * (1 + 0.95 * s)], l); };
  // A MOUND: canes that spring from one root, arch over and come down again, twig sprays standing off them (bare, in
  // bud, in leaf or in bloom by S at the mound's root; an old rose blooms in its one colour, a bramble not at all)
  // LEAF AS SPRAYS: n small leafy shoots fanned from a place on a cane, each its own length and lift, gaps between
  // them so the cane shows through; the rose leaf's green, young tips lighter, a few bronze; lighter on the sun's side
  const leafSpray = (a, a3, l, sw, lit, g, n) => {
    for (let j = 0; j < n; j++) {
      const hj = vnoise(a[0] * 3.3 + j * 5.1 + g * 9, a[2] * 3.3 + a[1] * 2.1 + j), az = a3 + (j - (n - 1) / 2) * 1.05 + (hj - 0.5) * 0.6, lj = l * (0.5 + 0.35 * hj);
      const b = [inX(a[0] + Math.cos(az) * lj * 0.85), a[1] + lj * (0.6 * vnoise(a[2] * 2.7 + j * 3.7, g * 7 + a[0]) - 0.12), inZ(a[2] + Math.sin(az) * lj * 0.85)];
      if (b[1] < hAt(b[0], b[2]) + 0.25 || !rule.ok(b, 0.45 * lj + 0.2)) continue;
      const gl = 1 + 0.4 * Math.max(0, Math.cos(az) * S3[0] + Math.sin(az) * S3[2]), tip = hj < 0.16 ? U.bronze : mix3(U.roseLeaf[1], U.youngLeaf, 0.3 + 0.6 * hj);
      F.card(a, b, lj * 0.5, lj * 0.64, [Math.cos(az + 1.4), 0.4 + hj, Math.sin(az + 1.4)], TWIG_CELLS.shoot, dim(mix3(U.roseLeaf[0], U.roseLeaf[1], 0.7 * g).map((v) => v * gl), lit), dim(tip.map((v) => v * gl), lit), sw, sw + 0.07, 0.45);
    }
  };
  for (const m of lay.mounds) {
    if (m.thicket) continue;
    fill = farFill(m.x, m.z);
    const nearM = rule.toLine(m.x, m.z)[0] < 24;
    const y0 = hAt(m.x, m.z), n = Math.round(U.canes[0] + (U.canes[1] - U.canes[0]) * (m.R - U.moundR[0]) / (U.moundR[1] - U.moundR[0])), lit = litAt([m.x, y0 + m.H * 0.6, m.z]);
    const twig = m.rose ? GR.bare : [[0.36, 0.3, 0.35], [0.5, 0.42, 0.47]], wood = m.rose ? [[0.105, 0.105, 0.115], [0.16, 0.16, 0.175]] : [[0.095, 0.066, 0.078], [0.15, 0.108, 0.122]], tint = linRGB(rng.pick(W.colors)).map((v) => v * W.headGain);
    const lo = linRGB(W.leaf[0]).map((v) => v * W.gain), hi = linRGB(W.leaf[1]).map((v) => v * W.gain);
    for (let k = 0; k < n; k++) {
      const az = TAU * (k + rng.range(0, 0.8)) / n, L = m.R * rng.range(0.55, 1.1), Hc = m.H * rng.range(0.5, 1), bend = rng.range(-0.5, 0.5), off = 0.3 * rng.range(0.3, 1.4), reach = rng.range(1.6, 2), pts = [];
      for (let i = 0; i < 6; i++) {
        const fr = i / 5, r = off + L * Math.pow(fr, 1.3), x = inX(m.x + Math.cos(az + bend * fr) * r), z = inZ(m.z + Math.sin(az + bend * fr) * r), drop = reach * fr - 1;
        pts.push([x, y0 + (hAt(x, z) - y0) * fr + Hc * (1 - drop * drop) + 0.02, z]);
      }
      if (!pts.every((p, i) => rule.ok(p, 0.4 + 0.06 * i))) continue;
      const r0 = rng.range(0.45, 1) * U.caneR[0];       // (its girth is drawn for a cane that stands)
      F.tube(pts, 3, (i) => r0 + (U.caneR[1] - r0) * i / 5, (p, nr) => lit3(mix3(wood[0], wood[1], 0.5 + 0.5 * nr[1]), p, nr), (i) => 0.01 + 0.005 * i * i, true);
      info.canes++;
      // (G7) the top of the mound's highest cane, kept as a perch of the place: the cane's apex and its radius there
      { const q = pts[2][1] >= pts[3][1] ? 2 : 3, y = pts[q][1] + r0 + (U.caneR[1] - r0) * q / 5; if (!m.top || y > m.top[1]) m.top = [pts[q][0], y, pts[q][2]]; }
      for (let j = 0, nj = rng.int(3, 4); j < nj; j++) {
        const fr = rng.range(0.3, 0.999) * 5, i = Math.floor(fr), a = v3.add(pts[i], v3.add(pts[i + 1], pts[i], -1), fr - i), l = rng.range(1.7, 3), a3 = rng.range(0, TAU), sw = 0.01 + 0.005 * fr * fr;
        const b = [inX(a[0] + Math.cos(a3) * l * 0.8), a[1] + rng.range(-0.2, 0.9) * l * 0.6, inZ(a[2] + Math.sin(a3) * l * 0.8)];
        if (b[1] < hAt(b[0], b[2]) + 0.3 || !rule.ok(b, 0.45 * l + 0.2) || !rule.ok(a, 0.45 * l + 0.2)) continue;
        const bare = m.S < SEASON.bud || (m.S < SEASON.leaf && rng.chance(0.55)), head = m.rose && m.S >= SEASON.bloom && rng.chance(0.45), g = rng();
        const cell = bare ? rng.pick(twigs) : head ? TWIG_CELLS.heads : m.S < SEASON.leaf ? TWIG_CELLS.bud : rng.chance(0.6) ? TWIG_CELLS.mass : TWIG_CELLS.shoot;
        const c0 = dim(bare ? twig[0] : head ? tint : m.S < SEASON.leaf ? GR.flower : mix3(lo, hi, 0.6 * g), lit), c1 = dim(bare ? twig[1] : head ? tint : m.S < SEASON.leaf ? GR.flower : mix3(lo, hi, 0.3 + 0.7 * g), lit);
        // (from U.leafFrom a mound's leaf is sprays, not one large card: more of them the further the season)
        if (!head && m.S >= U.leafFrom && (m.S >= SEASON.leaf || vnoise(a[0] * 2.3 + k, a[2] * 2.3 + j) < sstep(U.leafFrom - 0.04, SEASON.leaf, m.S))) { leafSpray(a, a3, l, sw, lit, g, nearM && g > 0.45 ? 2 : 1); continue; }
        F.card(a, b, l * 0.9, l * 0.9, [Math.cos(a3 + 1.4), 0.15, Math.sin(a3 + 1.4)], cell, c0, c1, sw, sw + 0.08, 0.4);
      }
    }
    info.mounds++;
    await breathe();
  }
  // THE GREENING THICKETS: old rose bushes as arching mounds of cane, five or so leaf sprays along each cane
  for (const m of lay.mounds) {
    if (!m.thicket || !o.rngT) continue;
    fill = farFill(m.x, m.z);
    const rt = o.rngT, y0 = hAt(m.x, m.z), n = Math.round(U.thicketCanes[0] + (U.thicketCanes[1] - U.thicketCanes[0]) * (m.R - U.thicketR[0]) / (U.thicketR[1] - U.thicketR[0])), lit = litAt([m.x, y0 + m.H * 0.6, m.z]), grown = sstep(0.3, 0.56, m.S);
    for (let k = 0; k < n; k++) {
      const az = TAU * (k + rt.range(0, 0.8)) / n, L = m.R * rt.range(0.6, 1.12), Hc = m.H * rt.range(0.5, 1), bend = rt.range(-0.6, 0.6), off = 0.3 * rt.range(0.3, 1.6), reach = rt.range(1.6, 2.05), pts = [];
      for (let i = 0; i < 5; i++) {
        const fr = i / 4, r = off + L * Math.pow(fr, 1.3), x = inX(m.x + Math.cos(az + bend * fr) * r), z = inZ(m.z + Math.sin(az + bend * fr) * r), drop = reach * fr - 1;
        pts.push([x, y0 + (hAt(x, z) - y0) * fr + Hc * (1 - drop * drop) + 0.02, z]);
      }
      if (!pts.every((p, i) => rule.ok(p, 0.4 + 0.08 * i))) continue;
      const r0 = rt.range(0.5, 1) * U.caneR[0] * 0.9;
      F.tube(pts, 3, (i) => r0 + (U.caneR[1] - r0) * i / 4, (p, nr) => lit3(mix3(U.oldCane[0], U.oldCane[1], 0.5 + 0.5 * nr[1]), p, nr), (i) => 0.01 + 0.008 * i * i, true);
      info.canes++;
      // (G7) the top of the thicket's highest cane, kept as a perch of the place
      { const q = pts[2][1] >= pts[3][1] ? 2 : 3, y = pts[q][1] + r0 + (U.caneR[1] - r0) * q / 4; if (!m.top || y > m.top[1]) m.top = [pts[q][0], y, pts[q][2]]; }
      for (let j = 0, nj = rt.int(4, 5); j < nj; j++) {
        const fr = (0.2 + 0.8 * (j + rt()) / nj) * 3.996, i = Math.floor(fr), a = v3.add(pts[i], v3.add(pts[i + 1], pts[i], -1), fr - i);
        leafSpray(a, az + bend + rt.range(-1.5, 1.5), rt.range(2, 3.3) * (0.7 + 0.3 * grown), 0.01 + 0.008 * fr * fr, lit, rt(), rt.chance(0.25) ? 2 : 1);
      }
    }
    info.thickets = (info.thickets || 0) + 1;
    await breathe();
  }
  // THE FALLEN WOOD: the trunk lies along the ground under moss, broken at both ends, a few stubs of its boughs standing
  // from it; a fallen bough rests on its own forks, one end raised
  fill = 0;
  const k6 = (c) => c.map((v) => v * 0.62), fallen = linRGB('#7d736a'), moss = k6(linRGB('#7f8f48')), under = k6(linRGB('#35302c'));
  for (const q of lay.logs) {
    const n = q.trunk ? 9 : 6, R = q.trunk ? U.trunkR : U.boughR, lift = q.trunk ? 0 : rng.range(0.6, 1.5), pts = [], ca = Math.cos(q.az), sa = Math.sin(q.az);
    const rad = (i) => (i === 0 ? 0.3 : 1) * (R[0] + (R[1] - R[0]) * i / (n - 1)) * (0.9 + 0.2 * vnoise(i * 1.7 + q.seed, q.seed));
    for (let i = 0; i < n; i++) { const fr = i / (n - 1), w = 0.35 * Math.sin(fr * 5 + q.seed), x = q.x + ca * q.L * (fr - 0.5) - sa * w, z = q.z + sa * q.L * (fr - 0.5) + ca * w; pts.push([x, hAt(x, z) + rad(i) * 0.7 + lift * fr * fr, z]); }
    const col = (p, nr) => lit3(mix3(mix3(fallen, moss, 0.85 * sstep(0.05, 0.6, nr[1] + 0.5 * vnoise(p[0] * 0.8 + q.seed, p[2] * 0.8) - 0.25)), under, 0.8 * sstep(0.1, -0.6, nr[1])), p, nr, 0.2);
    F.tube(pts, q.trunk ? 8 : 5, rad, col, () => 0, true);
    for (let k = 0, nk = q.trunk ? 3 : 2; k < nk; k++) {
      const i = 1 + Math.floor((n - 3) * (k + rng.range(0.2, 0.8)) / nk), side = rng.sign(), l = q.trunk ? rng.range(1.4, 2.6) : rng.range(1.4, 2), up = q.trunk ? rng.range(0.5, 1.2) : rng.range(-0.1, 0.5), r1 = rad(i) * (q.trunk ? 0.42 : 0.6);
      const d = v3.norm([-sa * side + ca * rng.range(-0.5, 0.5), up, ca * side + sa * rng.range(-0.5, 0.5)]), a = pts[i], e = v3.add(a, d, l);
      if (e[1] < hAt(e[0], e[2]) + 0.15) e[1] = hAt(e[0], e[2]) + 0.15;
      F.tube([a, v3.add(v3.add(a, d, l * 0.5), [0, 1, 0], 0.12 * l), e], 4, (j) => r1 * (1 - 0.35 * j), col, () => 0, true);
      if (!q.trunk) F.card(e, v3.add(e, d, 1.2), 1.5, 1.5, [sa, 0.3, -ca], rng.pick(twigs), dim(GR.bare[0], litAt(e)), dim(GR.bare[1], litAt(e)), 0.01, 0.06, 0.3);
    }
    info.logs++;
  }
  const standing = o.dry ? floraClearance(F, rule) : null;   // the rule of place is for what stands: mounds and wood
  // the ground's own normal at a place (a low form lies in the slope's plane)
  const up = (x, z) => v3.norm([hAt(x - 0.8, z) - hAt(x + 0.8, z), 1.6, hAt(x, z - 0.8) - hAt(x, z + 0.8)]);
  // A DRIFT of dead leaves: blown together they lie LOW and ragged (a hand deep): a shallow lobed shield in the
  // litter's own warm tones, lit as the ground it lies on and sunk at its rim, and on it and about it the leaves as
  // small flat ragged patches of the light cell (no dome, no dark ground between them): last year's russet, tan and
  // old gold. The trees' baked shadows lie on them as on the grass.
  const russet = [0.26, 0.115, 0.052], tanC = [0.42, 0.25, 0.11], gold = [0.58, 0.34, 0.12], dead = (g) => (g < 0.5 ? mix3(russet, tanC, 2 * g) : mix3(tanC, gold, Math.min(1, 2 * g - 1)));
  const shadeAt = o.shade || (() => [1, 1, 1]), inDoor = (x, z, m) => x < 25 + m && Math.abs(z - 0.0875 * x) < 8 + m;
  let driftsLaid = 0;
  for (const d of lay.drifts) {
    const rx = d.rx * 0.8, rz = d.rz * 0.8, ca = Math.cos(d.az), sa = Math.sin(d.az), N = up(d.x, d.z), H = 0.1 + 0.12 * d.h;
    const y = Math.max(hAt(d.x, d.z), 0.25 * (hAt(d.x + ca * rx * 0.5, d.z + sa * rx * 0.5) + hAt(d.x - ca * rx * 0.5, d.z - sa * rx * 0.5) + hAt(d.x - sa * rz * 0.5, d.z + ca * rz * 0.5) + hAt(d.x + sa * rz * 0.5, d.z - ca * rz * 0.5)));
    const lit = litAt([d.x, y + 0.5, d.z]), lob = (an) => 0.68 + 0.4 * vnoise(an * 1.6 + d.seed, d.seed * 1.3) + 0.26 * vnoise(an * 4.7 + d.seed * 2.1, 3.3);
    // the drift's own measure of a place: [its share of the lobed rim's radius, the shield's plane there]
    const at = (x, z) => {
      const ox = x - d.x, oz = z - d.z, an = Math.atan2(-ox, -oz);
      return [Math.hypot((ox * ca + oz * sa) / rx, (oz * ca - ox * sa) / rz) / lob(an < 0 ? an + TAU : an), y - (N[0] * ox + N[2] * oz) / N[1]];
    };
    const lowY = (x, z) => { const [q, pl] = at(x, z); return Math.max(hAt(x, z), pl + (q < 0.55 ? H * (1 - 0.4 * q / 0.55) : q < 0.95 ? 0.6 * H - (0.6 * H + 0.1) * (q - 0.55) / 0.4 : -1)) + 0.035; };
    const tone = (c, x, z) => { const sh = shadeAt(x, z), k = 1.6 - 0.6 * lit, cd = dim(c, lit); return [cd[0] * k * sh[0], cd[1] * k * sh[1], cd[2] * k * sh[2]]; };
    {
      const ring = (f, dy) => {
        const pts = [];
        for (let j = 0; j < 10; j++) {
          const an = TAU * j / 10, ph = Math.atan2(-Math.cos(an), -Math.sin(an)) - d.az, r = f * lob(an) * rx * rz / Math.hypot(rz * Math.cos(ph), rx * Math.sin(ph)), ox = -Math.sin(an) * r, oz = -Math.cos(an) * r;
          pts.push([d.x + ox, y - (N[0] * ox + N[2] * oz) / N[1] + dy, d.z + oz]);
        }
        return pts;
      };
      const col = (p) => tone(dead(0.1 + 0.55 * vnoise(p[0] * 1.3 + d.seed, p[2] * 1.3)).map((v) => v * 0.85), p[0], p[2]);
      const top = [d.x, y + H, d.z], r1 = ring(0.55, 0.6 * H), r2 = ring(0.95, -0.1), c0 = col(top), c1 = r1.map(col), c2 = r2.map(col);
      for (let j = 0; j < 10; j++) {
        const k = (j + 1) % 10;
        F.tri(top, r1[j], r1[k], c0, c1[j], c1[k], 0, 0, 0, 0, N, 0);
        F.tri(r1[j], r2[j], r2[k], c1[j], c2[j], c2[k], 0, 0, 0, 0, N, 0);
        F.tri(r1[j], r2[k], r1[k], c1[j], c2[k], c1[k], 0, 0, 0, 0, N, 0);
      }
      info.drifts++;
    }
    // one patch of leaves: small, flat, a little tilted; none in the door's stretch of the lane
    const shingle = (x, z, l, a2, g, tx, tz) => {
      const dx = Math.cos(a2) * l * 0.26, dz = Math.sin(a2) * l * 0.26, ya = lowY(x - dx, z - dz), yb = lowY(x + dx, z + dz), e = Math.max(0, lowY(x, z) - (ya + yb) / 2);
      F.card([x - dx, ya + e, z - dz], [x + dx, yb + e, z + dz], l, l, [tx * 0.4, 1, tz * 0.4], TWIG_CELLS.puff, tone(dead(0.8 * g), x, z), tone(dead(0.8 * g + 0.2), x, z), 0, 0.004, 0.1, v3.norm([tx * 0.5, 1, tz * 0.5]));
    };
    for (let k = 0, n = Math.round(5 + d.rx * d.rz * 1.2); k < n; k++) {
      // (a quarter are outliers on the grass beyond the rim; each has a smaller neighbour laid by a hash of its place)
      const hk = vnoise(k * 7.3 + d.seed, d.seed * 0.7 + k * 1.9), far = hk < 0.25, r0 = Math.sqrt(rng()), ro = far ? 0.95 + 0.5 * r0 : 0.2 + 0.75 * r0, an = rng.range(0, TAU);
      const ux = ca * Math.cos(an) * rx - sa * Math.sin(an) * rz, uz = sa * Math.cos(an) * rx + ca * Math.sin(an) * rz, wa = Math.atan2(-ux, -uz), lb = ro * lob(wa < 0 ? wa + TAU : wa), x = d.x + ux * lb, z = d.z + uz * lb;
      // (G11: the two places first: the patch and its neighbour; where the door's stretch of the lane refuses both,
      // nothing more is drawn)
      const a3 = TAU * vnoise(k * 3.1 + d.seed, 9.1 + k), r3 = 0.45 + 0.7 * hk, x3 = x + Math.cos(a3) * r3, z3 = z + Math.sin(a3) * r3, lay1 = !inDoor(x, z, 0.75), lay3 = !inDoor(x3, z3, 0.75);
      if (!lay1 && !lay3) continue;
      const l = rng.range(1.5, 2.4) * (far ? 0.5 : 0.75), a2 = rng.range(0, TAU), g = rng(), tx = rng.range(-0.1, 0.1) * 4, tz = rng.range(-0.1, 0.1) * 4;
      if (lay1) shingle(x, z, l, a2, g, tx, tz);
      if (lay3) shingle(x3, z3, l * 0.7, a2 + 1.9 + 2 * hk, 1 - g, -tz, tx);
    }
    if (o.yieldNow && ++driftsLaid % 6 === 0) await o.yieldNow(2.2);
  }
  if (o.yieldNow) await o.yieldNow(0.5);
  // LEAVES AGAINST THE TREE FEET: a few low patches blown against each old tree's foot, on its side away from the lane
  // (laid by a hash of the tree's place: no draw)
  for (const t of lay.feet || []) {
    const side = t[1] - 0.0875 * t[0] < 0 ? -1 : 1, h0 = vnoise(t[0] * 3.7, t[1] * 3.7), lit = litAt([t[0], hAt(t[0], t[1]) + 0.5, t[1]]), k = 1.6 - 0.6 * lit;
    for (let j = 0; j < 5; j++) {
      const hj = vnoise(t[0] * 1.9 + j * 4.3, t[1] * 1.9 - j * 2.7), an = side * (Math.PI / 2 + (j - 2) * 0.5 + (h0 - 0.5)), r = 0.05 * t[2] + 0.75 + 0.9 * hj, x = t[0] + Math.cos(an) * r, z = t[1] + Math.sin(an) * r;
      if (inDoor(x, z, 0.75) || rule.toLine(x, z)[0] < 3) continue;
      const l = 0.9 + 0.6 * hj, a2 = an + hj - 0.5, dx = Math.cos(a2) * l * 0.26, dz = Math.sin(a2) * l * 0.26, sh = shadeAt(x, z);
      const tone2 = (g) => { const cd = dim(dead(g), lit); return [cd[0] * k * sh[0], cd[1] * k * sh[1], cd[2] * k * sh[2]]; };
      F.card([x - dx, hAt(x - dx, z - dz) + 0.05, z - dz], [x + dx, hAt(x + dx, z + dz) + 0.05, z + dz], l, l, [(hj - 0.5) * 0.3, 1, (h0 - 0.5) * 0.3], TWIG_CELLS.puff, tone2(0.75 * hj), tone2(0.75 * hj + 0.25), 0, 0.004, 0.1, [0, 1, 0]);
    }
  }
  // A SWATHE of long dead grass: fine straw cards lying one way, low over the ground, like shingles
  const st0 = [0.38, 0.33, 0.3], st1 = [0.8, 0.69, 0.57], st2 = [0.98, 0.85, 0.7], lying = [TWIG_CELLS.hangA, TWIG_CELLS.hangB, TWIG_CELLS.veil];
  for (const w of lay.swathes) {
    const ca = Math.cos(w.az), sa = Math.sin(w.az), lit = litAt([w.x, hAt(w.x, w.z) + 0.6, w.z]);
    for (let k = 0, n = Math.round(w.R * 6); k < n; k++) {
      const u = rng.range(-1.1, 0.5) * w.R, v = rng.range(-0.7, 0.7) * w.R, a2 = w.az + rng.range(-0.22, 0.22), l = rng.range(2.6, 4.2), x = inX(w.x + ca * u - sa * v), z = inZ(w.z + sa * u + ca * v);
      const bx = inX(x + Math.cos(a2) * l), bz = inZ(z + Math.sin(a2) * l), g = rng();
      F.card([x, hAt(x, z) + 0.06, z], [bx, hAt(bx, bz) + rng.range(0.25, 0.6), bz], rng.range(1.8, 2.8), rng.range(1.8, 2.8), [rng.range(-0.15, 0.15), 1, rng.range(-0.15, 0.15)], rng.pick(lying),
        dim(mix3(st0, st1, 0.5 * g), lit), dim(mix3(st1, st2, g), lit), 0.005, 0.03, 0.25, [0, 1, 0]);
    }
    info.swathes++;
  }
  // THE EDGING: rough stones on end to end, half sunk and tilted, lichen and moss on them
  const stone = linRGB('#9a978c'), stoneDark = linRGB('#4a4640');
  for (const q of lay.stones) {
    const t = v3.norm([Math.cos(q.az), q.tilt * 0.3, Math.sin(q.az)]), c = [q.x, hAt(q.x, q.z) + q.r * (0.25 - 0.5 * q.sunk), q.z], y0 = hAt(q.x, q.z);
    F.tube([v3.add(c, t, -q.len / 2), v3.add(c, t, -q.len * 0.36), v3.add(c, t, q.len * 0.36), v3.add(c, t, q.len / 2)], 5, (i, an) => q.r * (i === 0 ? 0.5 : 1) * (0.8 + 0.4 * vnoise(an * 2.3 + q.seed, q.seed)),
      (p, nr) => lit3(mix3(mix3(mix3(stone, BARK.lichen, 0.7 * sstep(0.45, 0.75, vnoise(p[0] * 1.7 + q.seed, p[2] * 1.7))), moss, 0.7 * sstep(0.3, 0.8, nr[1]) * sstep(0.5, 0.75, vnoise(q.seed, p[0] * 0.6 + p[2] * 0.6))), stoneDark, 0.7 * sstep(0.22, 0, p[1] - y0)), p, nr, 0.25), () => 0, true);
    info.stones++;
  }
  info.triangles = F.count();
  if (o.dry) return { info: { ...info, ...standing } };
  if (o.yieldNow) await o.yieldNow(5.5);
  const mesh = F.build('garden-undergrowth', o.material);
  return { object: mesh.object, geometry: mesh.geometry, info };
}

// ---------------------------------------------------------------- the roses on the walls' inner faces (real form)
// No skin: the brick shows as brick. Each rose is a plant with its root at the wall's foot (6 to 14 m apart): main
// canes thick as an arm that rise as a fan standing 0.2 to 1.5 m off the brick, fork into side canes that arch and
// cross, and tumble over the coping to hang forward and down; fine sprays as cards on all of them, in the one wind. A
// plant's state is S at its own ROOT: a bare grey lattice under SEASON.bud, buds and a thin green veil to SEASON.leaf,
// leaf mounds to SEASON.bloom, blooms of the plant's ONE colour beyond. Cover is uneven: in the grey every gap between
// two plants keeps 4 m and more of bare brick, in leaf and bloom about every second one. Dark evergreens gone wild
// stand before the walls at a few places. Every cane and mass leaves a soft shade in the wall's own lattice (drawn by
// buildWallShade as one multiply layer), cast along the sun where the face is lit. One mesh a wall, of the grey's one
// material. Typed figures:
export const WALL_ROSE = { fill: [1.6, 0.006, 0.01, 0.008, 96, 108], under: [0.7, 0.01, 0.016, 0.02, 17, 10], gap: [6, 14], canes: [2, 4], footR: [0.125, 0.2], bare: [4, 6.5], closed: 0.75, over: [0.4, 1.8], drop: [0.4, 2.2], fork: 0.62, forkLen: [3, 6.5],
  spray: [1.3, 2.4], strands: [2, 4], hang: [2.2, 6.5], foot: 1.6, mound: [2, 4.5], colors: ['#f3ead2', '#f0c3c0', '#d9728a'], headGain: 0.62,
  leaf: ['#2a5226', '#5a8a3c'], deep: ['#1f4420', '#44702f'], gain: 1.1, rimTint: [0.27, 0.4, 0.36], mantle: 0.92, cloth: [2.6, 2.1], lattice: 0.8, topLight: 0.45, yew: '#17301f', yewLight: [1.5, 1.05, 0.62], ivy: '#1f3d2a', dark: [2, 4.5], evergreens: 6, cell: 0.25, y0: -1.5, rows: 100 };
// a wall's inner face: its length, its inward normal n and its run t, the plan place s metres along it and d metres in
// from the face, its top (the coping's) at s, the sun on the face (the cosine; none where it faces away)
export function wallFaces() {
  const G = PLAN.garden, S3 = v3.norm(PLAN.sunTo);
  const topNS = (x) => PLAN.wallH + 0.55 + (x < PLAN.riseEndX ? riseAt(Math.min(PLAN.riseEndX, (Math.floor(x / 11.5) + 1) * 11.5)) : PLAN.riseTop);
  return [
    { len: G.z1 - G.z0, n: [1, 0, 0], t: [0, 0, 1], at: (s, d) => [G.x0 + d, G.z0 + s], top: () => PLAN.wallH + 0.55, runs: 0 },
    { len: G.x1 - G.x0, n: [0, 0, 1], t: [1, 0, 0], at: (s, d) => [G.x0 + s, G.z0 + d], top: topNS, runs: 11.5 },
    { len: G.x1 - G.x0, n: [0, 0, -1], t: [1, 0, 0], at: (s, d) => [G.x0 + s, G.z1 - d], top: topNS, runs: 11.5 },
    { len: G.z1 - G.z0, n: [-1, 0, 0], t: [0, 0, 1], at: (s, d) => [G.x1 - d, G.z0 + s], top: () => PLAN.wallH + PLAN.riseTop + 0.67, runs: 0 },
  ].map((w) => ({ ...w, sun: w.n[0] * S3[0] + w.n[2] * S3[2], sunT: w.t[0] * S3[0] + w.t[2] * S3[2], sunY: S3[1] }));
}
// o = { sunAt, stream (each wall deals from its own: 'roses-wall<wall>', its hanging roses from the stream 'roses-hang<wall>'),
//       heightAt, rule (the grey's), material (the grey's), yieldNow, dry (count only, build no mesh) }
export async function buildWallRoses(o) {
  const { heightAt, rule } = o, W = WALL_ROSE, TAU = Math.PI * 2, S3 = v3.norm(PLAN.sunTo), faces = wallFaces(), GR = GREY_ROSE;
  const nsMost = Math.ceil(Math.max(...faces.map((w) => w.len)) / W.cell), K = new Float32Array(nsMost * W.rows * faces.length), objects = [], geometries = [];
  const info = { plants: 0, canes: 0, forks: 0, strands: 0, mounds: 0, lace: 0, evergreens: 0, triangles: 0, byWall: [], leastToLine: 99, leastToLane: 99 };
  const twigs = [TWIG_CELLS.twigA, TWIG_CELLS.twigB, TWIG_CELLS.twigC], c01 = (v) => Math.max(0, Math.min(1, v));
  for (let wi = 0; wi < faces.length; wi++) {
    const w = faces[wi], F = makeFloraBuf(), breathe = breathAfter(o.yieldNow, F.count, 5000, 9.5), rng = o.stream('roses-wall' + wi), roser = makeRoser(F, rule, heightAt, (q) => o.sunAt(q[0], q[1], q[2]), o.stream('roses-hang' + wi)), turnedW = w.sun <= 0.05;
    // THE FAR END'S WALL IN ITS OWN SHADE (G6): on a face turned from the sun the roses are filled, by the plant's own
    // place (W.fill = gain, a floor's red, green, blue, and the x it comes in over), so they read soft and never black
    let fill = 0;
    const dim = (c, lit) => { const d = roser.dim(c, lit), U = W.fill, k = 1 + fill * U[0]; return fill > 0 ? [d[0] * k + U[1] * fill, d[1] * k + U[2] * fill, d[2] * k + U[3] * fill] : d; };
    const P3 = (s, d, y) => { const q = w.at(s, d); return [q[0], y, q[1]]; }, inS = (s) => Math.max(0.4, Math.min(w.len - 0.4, s)), base = wi * W.rows * nsMost;
    // the shade a thing d off the brick leaves on it: along the sun on a lit face, a little below it on a face in shade
    const kS = w.sun > 0.05 ? Math.min(2.6, 1 / w.sun) : 0, shS = -w.sunT * kS, shY = w.sun > 0.05 ? -w.sunY * kS : -0.3, kLit = w.sun > 0.05 ? 1 : 0.7;
    const blob = (s, y, d, rs, ry, k) => {
      const cs = s + shS * d, cy = y + shY * d, i0 = Math.max(0, Math.floor((cs - rs) / W.cell)), i1 = Math.min(Math.ceil(w.len / W.cell) - 1, Math.ceil((cs + rs) / W.cell));
      const j0 = Math.max(0, Math.floor((cy - ry - W.y0) / W.cell)), j1 = Math.min(W.rows - 1, Math.ceil((cy + ry - W.y0) / W.cell));
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
        const a = (i * W.cell - cs) / rs, b = (j * W.cell + W.y0 - cy) / ry, q = a * a + b * b;
        if (q < 1) { const v = k * kLit * (1 - q * q), at = base + j * nsMost + i; if (v > K[at]) K[at] = v; }
      }
    };
    // the shade of a cane (its places as [s, d, y]): a bar as wide as the cane and a hand more
    const trail = (L, rad, k) => {
      for (let i = 0; i + 1 < L.length; i++) for (let f = 0; f < 1; f += 0.34) blob(L[i][0] + (L[i + 1][0] - L[i][0]) * f, L[i][2] + (L[i + 1][2] - L[i][2]) * f, L[i][1] + (L[i + 1][1] - L[i][1]) * f, rad, rad, k);
    };
    // a mound: cards of the dense leaf cell laid as shingles on the half of an ellipsoid that faces the garden (rs along
    // the wall, ry high, rd deep), lit as one body, dark at its foot and heart, each mound of its own tone; its rim is
    // ragged (leafy tongues hang from its lower edge, shoots stand from its upper); 'heads' (a colour) lays bloom on it
    const mound = (s, y, d, rs, ry, rd, lo0, hi0, lit, heads, sway, rim = 1) => {
      const c = P3(s, d, y), n = Math.round(3 + rs * ry * 0.8), soft = w.top(s) - 2.2;
      if (!rule.ok(c, Math.max(rs, rd) + 1.2)) return 0;
      // THE SHADE AT ITS OWN HEIGHT (G12): a card that stands at or over the coping takes the sun of its OWN place and
      // height, never less (its plant's, its heap's or its evergreen's one sample is taken down the face, in the
      // wall's shade on a face turned from the sun: a crest over the coping stood black against the sky); from 2.2 m
      // under the coping, where the wall's shade is whole, so that no step shows at the coping
      const own = (p) => (p[1] > soft ? Math.max(lit, o.sunAt(p[0], p[1], p[2])) : lit);
      const tk = rng.range(0.7, 1.1), lo = lo0.map((v) => v * tk), hi = hi0.map((v) => v * tk), nh = heads ? Math.round(n * 0.7) : 0, nr = Math.round((1.5 + rs * 0.9) * rim);
      for (let k = 0; k < n + nh + nr; k++) {
        const head = k >= n && k < n + nh, edge = k >= n + nh, down = edge && rng.chance(0.68), a = rng.range(-1.35, 1.35);
        const e = edge ? (down ? rng.range(-0.95, -0.25) : rng.range(0.45, 1.2)) : head ? rng.range(-0.35, 1.25) : rng.range(-0.7, 1.25);
        const ce = Math.cos(e), sa = Math.sin(a) * ce, ca = Math.cos(a) * ce, se = Math.sin(e), out = head ? 1.16 : edge ? 0.92 : rng.range(0.62, 1);
        const dir = v3.norm([w.t[0] * sa + w.n[0] * ca, se, w.t[2] * sa + w.n[2] * ca]), p = [c[0] + (w.t[0] * rs * sa + w.n[0] * rd * ca) * out, c[1] + ry * se * out, c[2] + (w.t[2] * rs * sa + w.n[2] * rd * ca) * out];
        // (G12) over the coping of a face turned from the sun the sun comes from over the wall: there the normal a card
        // is lit by is turned to the wall's far side (wholly from 1 m over the coping; every such normal faced the
        // garden, so a crest in full sun was drawn with no sun on it, from the walk as from within)
        const tf = turnedW && p[1] > soft + 2.2 ? 2 * sstep(soft + 2.2, soft + 3.2, p[1]) * (dir[0] * w.n[0] + dir[2] * w.n[2]) : 0;
        const nrm = tf !== 0 ? v3.norm([dir[0] - tf * w.n[0], dir[1] + 0.35, dir[2] - tf * w.n[2]]) : v3.norm([dir[0], dir[1] + 0.35, dir[2]]), faceOf = () => v3.norm([dir[0] + rng.range(-0.3, 0.3), 0.05, dir[2] + rng.range(-0.3, 0.3)]);
        if (edge) {
          // a tongue or a shoot of the rim: its length and lean give its end; one that would end in the grass is not laid
          const l = down ? rng.range(1.4, 3.4) : rng.range(1, 1.9), lean = rng.range(-0.5, 0.5), ax = v3.norm(down ? [dir[0] * 0.2 + w.t[0] * lean * 0.3, -1, dir[2] * 0.2 + w.t[2] * lean * 0.3] : [dir[0] * 0.5 + w.t[0] * lean, 1, dir[2] * 0.5 + w.t[2] * lean]);
          const b = v3.add(p, ax, l);
          if (b[1] - heightAt(b[0], b[2]) <= 1.2) continue;
          const kk = tk * (down ? 0.7 : 1) * hi0[1] / 0.28, cc = dim(W.rimTint.map((v) => v * kk), own(p));   // (these cells carry their own green)
          F.card(p, b, l * (down ? 0.55 : 0.9), l * (down ? 0.5 : 0.9), faceOf(), down ? TWIG_CELLS.leaf : TWIG_CELLS.shoot, cc, cc, sway, sway + (down ? 0.14 : 0.06), 0.4, nrm);
          continue;
        }
        const g = c01(0.5 + 0.5 * se + rng.range(-0.15, 0.15)), face = faceOf(), h = head ? rng.range(1.3, 1.9) : rng.range(1.7, 2.9), lean = rng.range(-0.3, 0.6), ax = v3.norm(e < -0.2 ? [dir[0] * 0.5, -0.8, dir[2] * 0.5] : [dir[0] * lean, 1, dir[2] * lean]), heart = 0.5 + 0.5 * (out - 0.62) / 0.38;
        const lp = own(p), c0 = head ? dim(v3.add([0, 0, 0], heads, rng.range(0.85, 1.1)), lp) : dim(mix3(lo, hi, g * 0.55).map((v) => v * heart), lp), c1 = head ? c0 : dim(mix3(lo, hi, 0.25 + g * 0.75).map((v) => v * heart * (1 + W.topLight * Math.max(0, se))), lp);
        F.card(v3.add(p, ax, -h / 2), v3.add(p, ax, h / 2), h * 1.33, h * 1.33 * rng.range(0.85, 1.1), face, head ? TWIG_CELLS.heads : TWIG_CELLS.mass, c0, c1, sway, sway + 0.03, 0.3, nrm);
      }
      blob(s, y, d, rs + 0.3, ry + 0.3, 0.5);
      info.mounds++;
      return 1;
    };
    // a fine spray standing off a cane at `at` (its place as [s, d, y]): bare twig, bud, leafy shoot or bloom heads by S
    const spray = (L, S, lit, tint, sway) => {
      const l = rng.range(W.spray[0], W.spray[1]), a = P3(L[0], L[1], L[2]), ts = rng.range(-0.9, 0.9), tn = rng.range(0.3, 0.8), up = rng.range(0, 0.9);
      const u = v3.norm([w.t[0] * ts + w.n[0] * tn, up, w.t[2] * ts + w.n[2] * tn]), b = v3.add(a, u, l);
      if (!rule.ok(b, l * 0.5 + 0.6)) return;
      const face = v3.norm([w.n[0] + w.t[0] * rng.range(-0.5, 0.5), 0.1, w.n[2] + w.t[2] * rng.range(-0.5, 0.5)]);
      const bare = S < SEASON.bud || (S < SEASON.leaf && rng.chance(0.5)), head = S >= SEASON.bloom && rng.chance(0.5);
      const cell = bare ? rng.pick(twigs) : head ? TWIG_CELLS.heads : S < SEASON.leaf ? TWIG_CELLS.bud : TWIG_CELLS.shoot;
      const c0 = bare ? dim(GR.bare[0], lit) : head ? dim(tint, lit) : dim(GR.flower, lit), c1 = bare ? dim(GR.bare[1], lit) : c0;
      F.card(a, b, l * 0.9, l * 0.9, face, cell, c0, c1, sway, sway + 0.1, 0.4);
    };
    // a spray of the cloth before leaf: bare twigs that stand off the brick in the wall's plane; from SEASON.bud buds,
    // and a thin green veil that hangs
    const lace = (L, S, lit) => {
      const l = rng.range(2, 3.4), a = P3(L[0], L[1], L[2]), veil = S >= SEASON.bud && rng.chance(0.5), ts = rng.range(-1, 1) * (veil ? 0.25 : 1), up = veil ? -1 : rng.range(-0.2, 1);
      const u = v3.norm([w.t[0] * ts + w.n[0] * 0.15, up, w.t[2] * ts + w.n[2] * 0.15]), b = v3.add(a, u, l);
      if (!rule.ok(b, l * 0.5 + 0.6) || b[1] - heightAt(b[0], b[2]) < 0.8) return;
      const face = v3.norm([w.n[0] + w.t[0] * rng.range(-0.3, 0.3), 0.1, w.n[2] + w.t[2] * rng.range(-0.3, 0.3)]);
      const bare = S < SEASON.bud || (!veil && rng.chance(0.4)), cell = bare ? rng.pick(twigs) : veil ? TWIG_CELLS.veil : TWIG_CELLS.bud;
      const c0 = bare ? dim(GR.bare[0], lit) : veil ? dim(GR.green[0], lit) : dim(GR.flower, lit), c1 = bare ? dim(GR.bare[1], lit) : veil ? dim(GR.green[1], lit) : c0;
      F.card(a, b, l * 0.9, l * 0.9, face, cell, c0, c1, 0, veil ? 0.12 : 0.05, 0.4);
      blob(L[0], L[2] + up * l * 0.5, L[1], 1.1, 1.1, 0.22);
      info.lace++;
    };
    // one cane, built from its places L ([s, d, y]); `still` is how many of them lie on the wall (those beyond stir);
    // dropped whole where the rule of place refuses a place of it
    const cane = (L, r, sides, col, still, shadeK) => {
      const m = L.length - 1, pts = L.map((q) => P3(q[0], q[1], q[2])), sw = (i) => (i <= still ? 0 : 0.02 * Math.pow(i - still, 1.5));
      for (let i = 0; i <= m; i++) if (!rule.ok(pts[i], r + sw(i) * FLORA.swing + 0.3)) return null;
      F.tube(pts, sides, (i) => r * (1 - 0.82 * Math.pow(i / m, 0.75)), col, sw, true);
      trail(L, r + 0.22, shadeK);
      return sw;
    };
    // a plant rooted at s0 that fans hwL to the one hand and hwR to the other; a heavy one carries more of everything
    const plant = (s0, hwL, hwR, heavy) => {
      const q0 = w.at(s0, 0.35), S = seasonAt(q0[0], q0[1]), y0 = heightAt(q0[0], q0[1]) - 0.3, H = w.top(s0) - y0;
      fill = turnedW ? sstep(W.fill[4], W.fill[5], q0[0]) : 0;
      const qt = w.at(s0, 1.2), lit = [o.sunAt(q0[0], y0 + H * 0.45, q0[1]), o.sunAt(qt[0], y0 + H + 0.8, qt[1])], litAt = (y) => lit[0] + (lit[1] - lit[0]) * c01((y - y0) / H * 2 - 0.9);
      const wood = mix3(mix3(BARK.dark, BARK.a, 0.55), [0.2, 0.26, 0.1], sstep(SEASON.bud, SEASON.leaf, S) * 0.35), tint = linRGB(rng.pick(W.colors)).map((v) => v * W.headGain), own = { tint, foot: W.foot };
      const col = (p, nr) => { const l = litAt(p[1]), sun = Math.max(0, nr[0] * S3[0] + nr[1] * S3[1] + nr[2] * S3[2]) * l, c = dim(mix3(wood, BARK.gold, 0.35 * sun), l); return [c[0] * 0.62, c[1] * 0.64, c[2] * 0.74]; };
      const leafy = sstep(0.42, 0.6, S), deep = sstep(SEASON.bloom, 0.95, S), lo = mix3(linRGB(W.leaf[0]), linRGB(W.deep[0]), deep).map((v) => v * W.gain), hi = mix3(linRGB(W.leaf[1]), linRGB(W.deep[1]), deep).map((v) => v * W.gain);
      const heads = S >= SEASON.bloom ? tint : null, n = rng.int(W.canes[0], W.canes[1]) + (heavy ? 1 : 0), r0 = rng.range(W.footR[0], W.footR[1]);
      info.plants++;
      for (let c = 0; c < n; c++) {
        const st = inS(n > 1 ? s0 - hwL + (hwL + hwR) * (c + rng.range(0.15, 0.85)) / n : s0), pw = rng.range(0.7, 1.7), bulge = rng.range(0.1, 0.85), ph = rng.range(0, TAU);
        const full = c === 0 || rng.chance(0.7), top = w.top(st), hgt = full ? top - y0 + 0.15 : H * rng.range(0.5, 0.85), r = c === 0 ? r0 : r0 * rng.range(0.55, 0.95), L = [];
        for (let i = 0; i <= 7; i++) { const f = i / 7; L.push([inS(s0 + (st - s0) * Math.pow(f, pw) + 0.45 * Math.sin(ph + f * 5) * f), 0.28 + r * (1 - f) + bulge * Math.sin(Math.PI * Math.pow(f, 0.8)), y0 + hgt * f]); }
        // over the coping, forward and down
        const up = rng.range(W.over[0], W.over[1]), ds = rng.range(-1.6, 1.6), drop = rng.range(W.drop[0], W.drop[1]);
        if (full) L.push([inS(st + ds * 0.3), 0.5, top + up * 0.8], [inS(st + ds * 0.65), 0.95, top + up], [inS(st + ds), 1.35, top + up * 0.3 - 0.3], [inS(st + ds * 1.15), 1.5, top - drop]);
        const sw = cane(L, r, r > 0.15 && leafy < 0.5 ? 4 : 3, col, 7, 0.5);
        if (!sw) continue;
        info.canes++;
        for (let i = 1; i < L.length; i++) if (rng.chance((heavy ? 0.85 : 0.65) * (1 - 0.7 * leafy))) spray(L[i], S, litAt(L[i][2]), tint, sw(i));
        // the side canes: they leave the main cane, arch to one hand and cross their neighbours
        for (const i of [2, 3, 4, 5]) {
          if (!rng.chance(W.fork * (1 - 0.75 * leafy))) continue;
          const sg = rng.sign(), fl = rng.range(W.forkLen[0], W.forkLen[1]), bow = rng.range(0.15, 0.6), rise = rng.range(0.5, 0.95), Lf = [];
          for (let j = 0; j <= 4; j++) { const f = j / 4, s = inS(L[i][0] + sg * fl * 0.8 * f), y = Math.min(w.top(s) + 1, L[i][2] + fl * (rise * f - 0.45 * f * f)); Lf.push([s, Math.min(1.5, L[i][1] + bow * Math.sin(Math.PI * f) + 0.1 * f), y]); }
          if (!cane(Lf, r * (1 - 0.82 * Math.pow(i / (L.length - 1), 0.75)) * 0.6, 3, col, 9, 0.32)) continue;
          info.forks++;
          for (const j of [2, 3, 4]) if (j !== 3 || rng.chance(0.5)) spray(Lf[j], S, litAt(Lf[j][2]), tint, 0);
          if (leafy > 0 && rng.chance(leafy * (heavy ? 0.6 : 0.3))) mound(Lf[3][0], Lf[3][2], Lf[3][1] + 0.3, rng.range(1.5, 3), rng.range(1.2, 2.4), rng.range(0.6, 1.1), lo, hi, litAt(Lf[3][2]), heads, 0.02);
        }
        if (!full) continue;
        // what tumbles over: strands hung along the arch (bare, veiled or in leaf by S) and, in leaf, a mound on it
        const e = L[L.length - 2];
        for (let k = 0, nk = rng.int(W.strands[0], W.strands[1]) + (heavy ? 2 : 0); k < nk; k++) {
          const i = rng.int(9, 11), q = L[i], wide = rng.range(GR.wide[0], GR.wide[1]), len = rng.range(W.hang[0], W.hang[1]) * (heavy ? 1 : 0.7);
          const got = roser.strand(P3(inS(q[0] + rng.range(-0.8, 0.8)), q[1] + rng.range(-0.1, 0.3), q[2] - 0.05), sw(i), len, wide, S, v3.norm([w.n[0], 0.6, w.n[2]]), own);
          if (got) { info.strands++; blob(q[0], q[2] - got / 2, q[1], wide / 2 + 0.4, got / 2 + 0.5, 0.55); }
        }
        if (leafy > 0 && rng.chance(leafy * (heavy ? 1 : 0.5))) {
          const rs = rng.range(W.mound[0], W.mound[1]) * (heavy ? 1 : 0.7), ry = rng.range(1.4, 2.8) * (0.6 + 0.4 * leafy);
          if (mound(e[0], top + up * 0.3 - ry * rng.range(0.1, 0.7), 0.75, rs, ry, rng.range(0.8, 1.4), lo, hi, lit[1], heads, 0.04)) {
            blob(e[0], top - 1.3, 0.9, rs * 0.9, 1.7, 0.72);
            // tongues of leaf that hang from it down the face, of unlike length
            for (let k = 0, nk = rng.int(1, 3); k < nk; k++) {
              const tr = rng.range(0.9, 1.8), ty = rng.range(1.5, 3.2);
              mound(inS(e[0] + rng.range(-1, 1) * rs * 0.7), top - ty * rng.range(0.5, 1.1), rng.range(0.6, 0.95), tr, ty, rng.range(0.5, 0.9), lo, hi, lit[1], heads, 0.05, 0.8);
            }
          }
        }
      }
      // the cloth over the plant's fan, from the coping down (deep over the root, shallow at the fan's edges, holes in
      // it): in leaf mounds that overlap into one ragged mass; before leaf a lattice of bare sprays, then buds and a thin
      // green veil. Its upper edge rises and falls along the wall: crests that stand 2 to 4 m over the coping, and
      // stretches where the coping lies bare
      const ph = rng.range(0, TAU), ph2 = rng.range(0, TAU), fq = rng.range(0.3, 0.6), wl = rng.range(0.45, 0.8);
      for (let s = s0 - hwL + rng.range(0.3, 1.5); s < s0 + hwR; s += W.cloth[0] * rng.range(0.8, 1.25)) {
        const top = w.top(inS(s)), side = s < s0 ? (s0 - s) / Math.max(1, hwL) : (s - s0) / Math.max(1, hwR), lift = Math.pow(0.5 + 0.5 * Math.sin(ph2 + s * fq), 1.5);
        const low = y0 + H * c01((side - wl) / (1 - wl)) * rng.range(0.25, 0.6) + 1.2 + 1.8 * (0.5 + 0.5 * Math.sin(ph + s * 0.55));
        if (leafy > 0.5 && lift > 0.72 && rng.chance(0.8) && mound(inS(s), top + rng.range(0.8, 1.9), 0.6, rng.range(2.2, 3.4), rng.range(1.8, 2.6), rng.range(0.9, 1.4), lo, hi, lit[1], heads, 0.05, 1)) blob(s, top - 1.5, 1, 2.4, 2, 0.7);
        for (let y = top - 2.6 + 4 * lift + rng.range(-0.4, 0.4); y > low; y -= W.cloth[1] * rng.range(0.8, 1.25)) {
          const f = (top - y) / H;
          if (rng.chance(W.mantle * leafy)) {
            const rs = rng.range(1.5, 2.4) * (heavy ? 1.15 : 1), ry = rng.range(1.2, 1.9);
            mound(inS(s + rng.range(-0.6, 0.6)), y, 0.45 + 0.4 * (1 - f) + rng.range(0, 0.25), rs, ry, rng.range(0.5, 0.9), lo, hi, litAt(y), f < 0.45 || rng.chance(0.4) ? heads : null, 0.012, f < 0.2 ? 0.7 : 0.35);
          } else if (leafy < 1) for (let k = 0; k < 2; k++) if (rng.chance(W.lattice)) lace([inS(s + rng.range(-1.2, 1.2)), rng.range(0.3, 0.8), y + rng.range(-0.8, 0.8)], S, litAt(y));
        }
      }
      return heads;
    };
    // a heavy mass down the face (4 to 9 m deep): leaf mounds stacked from the coping down, the widest high
    const heap = (s0, S, lo, hi, heads) => {
      const top = w.top(s0), depth = rng.range(4, 9), q = w.at(s0, 1.2), lit = o.sunAt(q[0], top - depth * 0.4, q[1]);
      for (let y = top + 0.4, k = 0; y > top - depth; k++) {
        const ry = rng.range(1.5, 2.6), rs = rng.range(W.mound[0], W.mound[1]) * (1 - 0.12 * k);
        mound(inS(s0 + rng.range(-1.6, 1.6)), y - ry * 0.5, rng.range(0.55, 0.95), rs, ry, rng.range(0.9, 1.5), lo, hi, lit, heads, 0.03);
        y -= ry * rng.range(0.9, 1.3);
      }
    };
    // a dark evergreen gone wild before the wall: a yew (a trunk and stacked dark mounds standing well off the brick)
    // or old ivy (flat mats to the coping and a crest over it)
    const evergreen = (s0) => {
      const yew = rng.chance(0.55), q0 = w.at(s0, yew ? 2 : 0.4), y0 = heightAt(q0[0], q0[1]), top = w.top(s0), hgt = yew ? rng.range(6, 12) : top - y0 + 1.2;
      const base = linRGB(yew ? W.yew : W.ivy), lo = base.map((v) => v * W.dark[0]), hi = base.map((v, i) => v * W.dark[1] * (yew ? W.yewLight[i] : 1));
      if (!rule.ok([q0[0], y0 + hgt * 0.5, q0[1]], 4)) return;
      const d = yew ? rng.range(1.7, 2.6) : 0.3, lit = o.sunAt(q0[0] + w.n[0], y0 + hgt * 0.6, q0[1] + w.n[2]);
      if (yew) cane([[s0, d - 0.4, y0 - 0.3], [s0 + 0.2, d - 0.2, y0 + hgt * 0.3], [s0 - 0.1, d - 0.3, y0 + hgt * 0.62], [s0 + 0.1, d - 0.3, y0 + hgt * 0.9]], 0.34, 5, () => dim(BARK.dark, lit), 9, 0.5);
      for (let y = y0 + 0.6, k = 0; y < y0 + hgt; k++) {
        const f = (y - y0) / hgt, ry = yew ? rng.range(1.6, 2.4) : rng.range(1.8, 3), rs = yew ? rng.range(2.2, 3.4) * (1 - 0.55 * f) : rng.range(2.2, 4.2) * (0.7 + 0.5 * Math.sin(f * 3));
        mound(inS(s0 + rng.range(-0.8, 0.8) * (yew ? 1 : 2.2)), y + ry * 0.5, d + (yew ? rng.range(-0.3, 0.3) : 0), rs, ry, yew ? rs * rng.range(0.6, 0.85) : rng.range(0.4, 0.6), lo, hi, lit, null, yew ? 0.03 : 0, yew ? 0 : 0.6);
        y += ry * rng.range(0.75, 1.05);
      }
      info.evergreens++;
    };
    // the roots, 6 to 14 m apart, and the cover between each two of them: in the grey every gap keeps bare brick, in
    // leaf and bloom about every second gap is closed; what is covered is shared unevenly between the two neighbours
    const roots = [], bare = [];
    for (let s = rng.range(2, 6); s < w.len - 2; s += rng.range(W.gap[0], W.gap[1])) roots.push(s);
    for (let k = 0; k + 1 < roots.length; k++) {
      const g = roots[k + 1] - roots[k], qm = w.at((roots[k] + roots[k + 1]) / 2, 0.35), S = seasonAt(qm[0], qm[1]);
      bare.push(S < 0.42 || !rng.chance(W.closed) ? Math.min(g * 0.6, rng.range(W.bare[0], W.bare[1]) + (S < 0.42 ? 0 : 0.5)) : 0);
    }
    const hw = roots.map(() => [0, 0]), ever = [];
    for (let k = 0; k + 1 < roots.length; k++) { const cov = roots[k + 1] - roots[k] - bare[k], f = rng.range(0.25, 0.75); hw[k][1] = cov * f; hw[k + 1][0] = cov * (1 - f); }
    if (roots.length) { hw[0][0] = Math.min(roots[0] - 0.5, rng.range(1, 4)); hw[roots.length - 1][1] = Math.min(w.len - roots[roots.length - 1] - 0.5, rng.range(1, 4)); }
    for (let k = 0, ne = Math.max(1, Math.round(W.evergreens * w.len / 600)); k < ne; k++) ever.push(rng.int(1, Math.max(1, roots.length - 2)));
    for (let k = 0; k < roots.length; k++) {
      const q0 = w.at(roots[k], 0.35), S = seasonAt(q0[0], q0[1]), stands = rule.ok([q0[0], heightAt(q0[0], q0[1]) + 1.7, q0[1]], 2.5);
      const heavy = stands && rng.chance(0.4), heads = stands ? plant(roots[k], hw[k][0], hw[k][1], heavy) : undefined;
      if (heavy && S > 0.5) {
        const deep = sstep(SEASON.bloom, 0.95, S), lo = mix3(linRGB(W.leaf[0]), linRGB(W.deep[0]), deep).map((v) => v * W.gain), hi = mix3(linRGB(W.leaf[1]), linRGB(W.deep[1]), deep).map((v) => v * W.gain);
        heap(inS(roots[k] + rng.range(-1, 1) * Math.min(hw[k][0], hw[k][1])), S, lo, hi, heads);
      }
      if (ever.includes(k) && bare[k] > 0) evergreen(roots[k] + hw[k][1] + bare[k] * rng.range(0.3, 0.7));
      await breathe();
    }
    const tri = F.count();
    if (o.dry) { const clr = floraClearance(F, rule); info.leastToLine = Math.min(info.leastToLine, clr.leastToLine); info.leastToLane = Math.min(info.leastToLane, clr.leastToLane); }
    info.triangles += tri; info.byWall.push(tri);
    if (!o.dry && tri) { const b = F.build('garden-wall-roses-' + wi, o.material); objects.push(b.object); geometries.push(b.geometry); }
    await breathe(true);
  }
  return { objects, geometries, info, shade: { K, ns: nsMost, rows: W.rows, cell: W.cell, y0: W.y0 } };
}
// The roses' shade on the brick: ONE multiply layer a hand before the four inner faces, read from the lattice the roses
// left (a band of rows a wall). Never black (the tint leaves the blue of the sky in it) and soft (a blob's edge is a
// metre wide); its strength is times the fog's own clear share at that place and nothing else, as the ground's sheet's (G8b).
export const WALL_SHADE = { off: 0.06, bias: 0.001, tint: [0.92, 0.86, 0.74], run: 11.5 };
export function buildWallShade(shade, fogDensity = 0) {
  const faces = wallFaces(), { K, ns, rows, cell, y0 } = shade, data = new Uint8Array(K.length), P = [], U = [], I = [];
  for (let q = 0; q < data.length; q++) data[q] = Math.round(255 * Math.min(1, K[q]));
  const texture = new THREE.DataTexture(data, ns, rows * faces.length, THREE.RedFormat, THREE.UnsignedByteType);
  texture.unpackAlignment = 1; texture.magFilter = THREE.LinearFilter; texture.minFilter = THREE.LinearFilter; texture.generateMipmaps = false; texture.needsUpdate = true;
  faces.forEach((w, wi) => {
    const nr = Math.ceil(w.len / WALL_SHADE.run - 1e-6);
    for (let k = 0; k < nr; k++) {
      const s0 = k * w.len / nr, s1 = (k + 1) * w.len / nr, top = w.top((s0 + s1) / 2), base = P.length / 3;
      for (const [s, y] of [[s0, y0], [s1, y0], [s0, top], [s1, top]]) {
        const q = w.at(s, WALL_SHADE.off);
        P.push(q[0], y, q[1]); U.push((s / cell + 0.5) / ns, (wi * rows + (y - y0) / cell + 0.5) / (rows * faces.length));
      }
      I.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
    }
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2));
  geometry.setIndex(I);
  geometry.computeBoundingSphere();
  const material = new THREE.ShaderMaterial({
    uniforms: { uMap: { value: texture }, uTint: { value: new THREE.Vector3(...WALL_SHADE.tint) }, uBias: { value: WALL_SHADE.bias }, uFog: { value: fogDensity } },
    vertexShader: /* glsl */`
      uniform float uBias;
      varying vec2 vUv; varying float vDepth;
      void main() {
        vUv = uv;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vDepth = -mv.z;
        mv.xyz *= 1.0 - uBias;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      uniform sampler2D uMap; uniform vec3 uTint; uniform float uFog;
      varying vec2 vUv; varying float vDepth;
      void main() {
        float k = texture2D(uMap, vUv).r * exp(-uFog * uFog * vDepth * vDepth);
        gl_FragColor = vec4(vec3(1.0) - uTint * k, 1.0);
      }`,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.ZeroFactor, blendDst: THREE.SrcColorFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
    depthWrite: false, depthTest: true, transparent: false, side: THREE.DoubleSide, fog: false, toneMapped: false,
  });
  const object = new THREE.Mesh(geometry, material);
  object.name = 'garden-wall-shade'; object.renderOrder = 0.5;
  return { object, geometry, material, texture, triangles: I.length / 3 };
}

// ---------------------------------------------------------------- the green points and the snowdrops (instanced)
// From the very sill while S is under SEASON.bulbs: pale green points pushing through the matted grass and snowdrops in
// clumps, lying in DRIFTS (thick to both hands of the line FROM THE SILL TO THE LEFT TURN'S END, round the feet of the
// grey trees, and a few of their own as far east as the bulbs' season reaches: SEASON.bulbs of its depth and the
// wobble). The seed deals the drifts; the season's window is not the seed's: a clump stands by a chance of S at its
// own place and is sized by it, so they thin out and end where the grass greens. None outside the garden. They stand still.
export const BULBS = { points: 1250, drops: 640, tread: 0.9, point: '#b8d98a', drop: '#f4f4ee', foot: '#5d8a52' };
export async function buildBulbs(o) {
  const { rng, route, heightAt, sunAt } = o, G = PLAN.garden, TAU = Math.PI * 2, rule = greyRule(route);
  // the two clumps' own shapes, flat triangles each with its own true normal; bc = (0 blade, 1 petal; height 0..1)
  const shape = (drop) => {
    const pos = [], nor = [], bc = [];
    const tri = (a, b, c, ka, kb, kc) => {
      const n = v3.norm(v3.cross(v3.add(b, a, -1), v3.add(c, a, -1)));
      for (const [p, k] of [[a, ka], [b, kb], [c, kc]]) { pos.push(p[0], p[1], p[2]); nor.push(n[0], n[1], n[2]); bc.push(k[0], k[1]); }
    };
    const blade = (x, z, az, h, w, lean) => {
      const c = Math.cos(az), s = Math.sin(az);
      tri([x - s * w, 0, z + c * w], [x + s * w, 0, z - c * w], [x + c * lean, h, z + s * lean], [0, 0], [0, 0], [0, 1]);
    };
    const n = drop ? 3 : 7;
    for (let i = 0; i < n; i++) {
      const az = TAU * (i + 0.37 * (i % 3)) / n, r = drop ? 0.12 : 0.05 + 0.1 * ((i * 5) % 7) / 7, x = Math.cos(az) * r, z = Math.sin(az) * r;
      if (!drop) { blade(x, z, az + 0.4 * i, 0.15 + 0.1 * ((i * 3) % 5) / 5, 0.022, 0.05 + 0.03 * (i % 3)); continue; }
      const c = Math.cos(az), s = Math.sin(az), h = 0.2 + 0.035 * i, top = [x + c * 0.03, h, z + s * 0.03], nod = [x + c * 0.085, h - 0.025, z + s * 0.085];
      blade(x - s * 0.04, z + c * 0.04, az + 1.2, 0.15, 0.02, 0.03); blade(x + s * 0.04, z - c * 0.04, az - 1.2, 0.13, 0.02, 0.035);
      tri([x - s * 0.007, 0, z + c * 0.007], [x + s * 0.007, 0, z - c * 0.007], top, [0, 0.3], [0, 0.3], [0, 0.8]);
      tri(top, [x + s * 0.007, 0, z - c * 0.007], nod, [0, 0.8], [0, 0.3], [0, 0.9]);
      for (let k = 0; k < 3; k++) {   // the nodding bell: three pointed petals hung from the stalk's end
        const pa = az + TAU * k / 3, pc = Math.cos(pa), ps = Math.sin(pa), qa = pa + 1.1, qc = Math.cos(qa), qs = Math.sin(qa);
        tri(nod, [nod[0] + pc * 0.034, nod[1] - 0.05, nod[2] + ps * 0.034], [nod[0] + (pc + qc) * 0.02, nod[1] - 0.09, nod[2] + (ps + qs) * 0.02], [1, 0], [1, 0.5], [1, 1]);
        if (k === 0) tri(nod, [nod[0] + (pc + qc) * 0.02, nod[1] - 0.09, nod[2] + (ps + qs) * 0.02], [nod[0] + qc * 0.034, nod[1] - 0.05, nod[2] + qs * 0.034], [1, 0], [1, 1], [1, 0.5]);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    g.setAttribute('bc', new THREE.Float32BufferAttribute(bc, 2));
    return g;
  };
  // the drifts: [x, z, radius, weight]
  const drifts = [];
  for (let d = route.sill + 0.5; d < route.leftTurn[1]; d += rng.range(1.6, 3.2)) for (const side of [1, -1]) {
    const p = routeAt(route, d), off = (BULBS.tread + rng.range(0.6, 7.5)) * side;
    drifts.push([p.x - Math.sin(p.th * RAD) * off, p.z + Math.cos(p.th * RAD) * off, rng.range(1.3, 3.2), 1]);
  }
  for (const t of o.trees || []) for (let k = 0; k < 3; k++) { const a = rng.range(0, TAU), r = rng.range(1.6, 4.2); drifts.push([t.x + Math.cos(a) * r, t.z + Math.sin(a) * r, rng.range(1.5, 3), 0.8]); }
  for (let k = 0; k < 46; k++) drifts.push([rng.range(1, SEASON.bulbs * SEASON.depth + SEASON.wobble), rng.range(G.z0 + 2, G.z1 - 2), rng.range(2, 5), 0.6]);
  for (const e of o.edging || []) drifts.push([e[0], e[1], rng.range(0.8, 1.5), 0.5]);   // clumps along the lost beds' edging
  const wsum = drifts.reduce((a, d) => a + d[3], 0);
  const C = (h) => ({ value: new THREE.Color(h), type: 'vec3' });
  const material = drawnMaterial({
    key: 'garden-bulbs-1', vary: { bc: 'vec2', bi: 'vec2' }, uniforms: { uPoint: C(BULBS.point), uDrop: C(BULBS.drop), uFoot: C(BULBS.foot), ...o.clock }, head: SHADE_GLSL,
    after: 'vNormal = normalize(mat3(viewMatrix) * vec3(0.0, 1.0, 0.0)) * (dot(transformedNormal, mvPosition.xyz) < 0.0 ? 1.0 : -1.0);',
    color: 'vec3 bcol = mix(mix(uFoot, uPoint * (0.9 + 0.2 * v_bi.y), smoothstep(0.0, 0.75, v_bc.y)), uDrop * mix(0.86, 1.0, v_bc.y), v_bc.x);\ndiffuseColor.rgb = gShade(bcol, v_bi.x);',
    extra: { side: THREE.DoubleSide },
  });
  const out = [], M = new THREE.Matrix4(), Q = new THREE.Quaternion(), P = new THREE.Vector3(), SC = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0);
  for (const drop of [false, true]) {
    const want = Math.round((drop ? BULBS.drops : BULBS.points) * (0.75 + 0.5 * (typeof o.density === 'number' ? o.density : 0.5))), mats = [], bi = [];
    for (let k = 0; k < want * 3 && bi.length / 2 < want; k++) {
      if (o.yieldNow && (k & 1023) === 1023) await o.yieldNow(8);
      let pick = rng() * wsum, di = 0;
      while (di < drifts.length - 1 && pick > drifts[di][3]) { pick -= drifts[di][3]; di++; }
      const dr = drifts[di], a = rng.range(0, TAU), r = dr[2] * Math.sqrt(-Math.log(1 - 0.92 * rng())) * 0.75, x = dr[0] + Math.cos(a) * r, z = dr[1] + Math.sin(a) * r;
      if (x < G.x0 + 0.5 || x > G.x1 - 1 || z < G.z0 + 0.8 || z > G.z1 - 0.8) continue;
      const S = seasonAt(x, z), live = 1 - Math.pow(Math.min(1, S / SEASON.bulbs), 2.2);
      // (the rules of place first; then its one chance by the season at its own place; only a kept clump is dealt)
      if (rule.toLine(x, z)[0] < BULBS.tread || (o.trees || []).some((t) => Math.hypot(t.x - x, t.z - z) < 1.3) || !lot(rng, live)) continue;
      const size = rng.range(0.85, 1.5), turn = rng.range(0, TAU), hh = rng();
      const y = heightAt(x, z), s = size * (0.75 + 0.25 * live) * (drop ? 1.25 * (x < 30 ? 1 + 0.5 * sstep(30, 20, x) : 1) : 1.15);
      M.compose(P.set(x, y - 0.012, z), Q.setFromAxisAngle(UP, turn), SC.set(s, s * (0.9 + 0.3 * hh), s));
      mats.push(M.clone()); bi.push(sunAt(x, y + 0.2, z), hh);
    }
    if (o.yieldNow) await o.yieldNow(4);
    const g = shape(drop);
    // THE WEST CUT (G10b): the clumps that can show from the line's metres west of the cut's plane (through the doorway: none
    // stands over the wall's top) are laid FIRST in the store, in their own order as dealt, the others after them;
    // the world draws the first `shown` only while the eye stands west of that plane, and all of them east of it
    const E = westEye(route), ord = [], hid = [];
    mats.forEach((m, i) => (westShows(E, m.elements[12], m.elements[13] + 0.6, m.elements[14]) ? ord : hid).push(i));
    const shown = ord.length;
    for (const i of hid) ord.push(i);
    g.setAttribute('bi', new THREE.InstancedBufferAttribute(new Float32Array(ord.flatMap((i) => [bi[i * 2], bi[i * 2 + 1]])), 2));
    const mesh = new THREE.InstancedMesh(g, material, mats.length);
    ord.forEach((i, k) => mesh.setMatrixAt(k, mats[i]));
    mesh.instanceMatrix.needsUpdate = true; mesh.name = drop ? 'garden-snowdrops' : 'garden-green-points';
    mesh.computeBoundingSphere();
    out.push({ object: mesh, geometry: g, count: mats.length, shown, triangles: mats.length * g.attributes.position.count / 3 });
    if (o.yieldNow && !drop) await o.yieldNow(3.3);
  }
  return { points: out[0], drops: out[1], material, triangles: out[0].triangles + out[1].triangles };
}

// ================================================================ THE FAR END (x over 115)
// ---------------------------------------------------------------- the yew alcove and the way out
// THE ALCOVE'S FRAME: a metres along the last straight from the ring (under 0 before it), p metres across it (over 0
// on the route's left hand, the east-north-east; under 0 on its right hand, the sun's side). The ring stands at (0, 0),
// its middle at the flown line's height. Everything here is FIXED GEOMETRY of the place: no seed moves the yew's mass.
// Typed figures. yew: the wings' middle line (p), their half thickness, the back's middle (a) and half thickness, the
// corner's radius, the leaf (lo, hi: the body's dark and light of WALL_ROSE.yew through the mass cell; needle, tip: the
// same dark and the new growth through a spray's ink; per station the standing shoots; a shoot's size: [least, most,
// times on the outer faces, width by length]), the faces nearest the ring (inner: the wings' least |p| beside the ring, mouth: at the mouth, 13 m
// wide; backInner: the back's least a: a card at full swing stays 2 m and more from the ring's rim), the south
// wall's bound (z), how shaggy (metres), a station every `step` metres, `round` faces round a section, how far a card
// may stand off the skin, the yew's dark and light (of WALL_ROSE.yew), the new growth's tint.
export const FAR = {
  yew: { wing: 10, half: 2.9, back: 4.8, backHalf: 1.6, corner: 4.5, inner: 7.05, mouth: 6.5, backInner: 3.2, wallZ: 51.5, shag: 0.65, step: 0.85, round: 16, cards: 0.45, lo: 0.9, hi: 2.0, needle: [0.05, 0.098, 0.046], tip: [0.23, 0.33, 0.15], shoots: 8, farOf: 5,
    shoot: [1.0, 1.9, 1, 0.9], sunTo: [1.35, 1.08, 0.7], shadeTo: [1.0, 0.85, 0.85], shadeFloor: [0.048, 0.046, 0.044], sunFloor: [0.025, 0.033, 0.01], hullFill: 0.6,
    // (G10b) the hull's own lattice; the small lumps along its top (metres); how much taller it stands against the
    // south wall; the yew's own shade floor and its lift where turned from the sun (deep green, not grey; both raised
  // in G10c: under the lesser fill the wing turned from the sun stood at 15 of 255, now about 29)
    hullStep: 0.6, hullRound: 20, shag3: [14, 18, 5, 9], lump: 0.42, wallRise: 0.26, wallLump: 0.9, shadeFloorY: [0.045, 0.075, 0.05], turnedY: [3.6, 0.13, 0.23, 0.12, 0.9, 1.6] },
  urn: { ahead: 1.5, high: 5, r: 1.75, sides: 14, plinth: 1.3, stone: '#8d8b84', moss: '#5a6a38', lichen: '#b5ae8c', stain: '#5f5e5a' },
  seat: { a: [1.6, 3.3], half: 4.5, high: 1.9, slab: 0.45 },
  ring: { color: [1.0, 0.82, 0.52], half: 12, near: 8, yew: 0.07, yewGain: 2.2, hull: 0.4, stone: 0.55, rose: 0.3, grassGain: [1.9, 1.4, 0.25], grassAdd: [0.035, 0.04, 0], grassWarm: 0.85 },
  // (rose: a bloom head's card by its height, on which a truss of the cell reads as one bloom of 0.28 m; how many on an
  // urn, on a climber's heap and to a metre of garland)
  // (G10b, the finale: urnMore more and larger heads on each urn with urnFalls more garlands over its rim; morePlants
  // more climbers over the U, three heaps each, and two at each mouth end, four heaps each)
  rose: { plants: 9, heaps: [3, 4], foot: 1.2, sway: 0.02, urnAir: 4.3, head: [0.6, 0.85], urnHeads: 24, climbHead: [0.7, 1.0], climbHeads: 9, strung: 1.7, urnMore: 22, urnFalls: 5, morePlants: 12, mouthPlants: [0.03, 0.07, 0.93, 0.97] },
};
let FRAME = null;
export function alcoveFrame() {
  if (FRAME) return FRAME;
  const route = layRoute(), e = routeAt(route, route.length), c = Math.cos(e.th * Math.PI / 180), sn = Math.sin(e.th * Math.PI / 180);
  return (FRAME = { x: e.x, z: e.z, y: riseAt(e.x) + lensOver(route, route.length), c, s: sn, length: route.length,
    at: (a, p) => [e.x + a * c + p * sn, e.z + a * sn - p * c], of: (x, z) => [(x - e.x) * c + (z - e.z) * sn, (x - e.x) * sn - (z - e.z) * c] });
}
// the yew's shade: its two wings and its back as upright panels for makeSun (their middle planes, a little under the
// shaggy top), so that the court lies in the right wing's shade and the yew's own far sides are dimmed by place
export function alcovePanels() {
  const fr = alcoveFrame(), Y = FAR.yew, m = PLAN.alcove.mouthToRing, y0 = PLAN.riseTop - 2, y1 = PLAN.riseTop + PLAN.alcove.yewH - 0.8, out = [];
  const pan = (a0, p0, a1, p1) => { const A = fr.at(a0, p0), B = fr.at(a1, p1); out.push({ ax: A[0], az: A[1], bx: B[0], bz: B[1], y0, y1 }); };
  pan(-m + 1, -Y.wing, Y.back - 1, -Y.wing); pan(-m + 1, Y.wing, Y.back - 1, Y.wing); pan(Y.back, -Y.wing + 1.5, Y.back, Y.wing - 1.5);
  return out;
}
// the yew in plan: ONE loaf bent to a U (the right wing from its mouth end, the back, the left wing to its mouth end).
// Its stations along the middle: the place (a, p), the outward normal (na, np), the half thickness h, the height's
// share k (the mouth ends round off a little; they stay taller than the ring), t metres along
export function alcovePath(step = FAR.yew.step) {
  const Y = FAR.yew, m = PLAN.alcove.mouthToRing, rc = Y.corner, a1 = Y.back - rc, pc = Y.wing - rc, out = [];
  const wingL = a1 + m, arcL = rc * Math.PI / 2, backL = 2 * pc, L = 2 * wingL + 2 * arcL + backL, n = Math.round(L / step);
  const fat = (a) => 0.5 * (Y.inner - Y.mouth) * sstep(-3, -9, a);   // the wings grow inward toward the mouth
  for (let i = 0; i <= n; i++) {
    const t0 = L * i / n, mouth = Math.min(t0, L - t0);
    let t = t0, st;
    if (t < wingL) { const f = fat(-m + t); st = { a: -m + t, p: -Y.wing + f, na: 0, np: -1, h: Y.half + f }; }
    else if ((t -= wingL) < arcL) { const q = t / rc; st = { a: a1 + rc * Math.sin(q), p: -pc - rc * Math.cos(q), na: Math.sin(q), np: -Math.cos(q), h: Y.half + (Y.backHalf - Y.half) * sstep(0, arcL, t) }; }
    else if ((t -= arcL) < backL) st = { a: Y.back, p: -pc + t, na: 1, np: 0, h: Y.backHalf };
    else if ((t -= backL) < arcL) { const q = t / rc; st = { a: a1 + rc * Math.cos(q), p: pc + rc * Math.sin(q), na: Math.cos(q), np: Math.sin(q), h: Y.backHalf + (Y.half - Y.backHalf) * sstep(0, arcL, t) }; }
    else { t -= arcL; const f = fat(a1 - t); st = { a: a1 - t, p: Y.wing - f, na: 0, np: 1, h: Y.half + f }; }
    st.k = 0.84 + 0.16 * sstep(0, 1.8, mouth); st.h *= 0.6 + 0.4 * sstep(0, 1.6, mouth); st.t = t0; st.end = t0 < L / 2 ? 1 : -1;
    out.push(st);
  }
  return out;
}
// a place on the yew's skin: at the station st, phi round its section (0 the outer foot, half pi the top, pi the inner
// foot), `off` metres out from it. Shaggy by a noise of PLACE, and held off the ring and the wall: no face nearer the
// line than FAR.yew.inner, the back no nearer than backInner (a card may stand `off` inside that), nothing through
// the south wall. Gives the place p, the skin's normal n, a and pp in the frame, y over the ground, d (in or out).
// (G10b) TRUE LUMPS: over the top and the shoulders small lumps of 1.2 m stand on the broad swells (Y.lump); against
// the south wall the yew is heaped Y.wallRise taller (over the last 5 m before the wall: its top stands over the
// wall's coping there), and its bound at the wall is itself lumped by a noise of place (to Y.wallLump m before the
// brick): no part of the skin is a plane with a straight top.
export const alcoveInner = (a) => FAR.yew.inner - (FAR.yew.inner - FAR.yew.mouth) * sstep(-3, -9, a);
export function alcoveSkin(st, phi, off = 0) {
  const fr = alcoveFrame(), Y = FAR.yew, cs = Math.cos(phi), sn = Math.sin(phi), w = st.h * Math.sign(cs) * Math.abs(cs) ** 0.55;
  let a = st.a + st.na * w, p = st.p + st.np * w;
  const H = PLAN.alcove.yewH * st.k * (1 + Y.wallRise * sstep(Y.wallZ - 5, Y.wallZ - 1, fr.at(a, p)[1]));
  const y = H * Math.max(0, sn) ** 0.6, nl = Math.hypot(H * cs, st.h * sn) || 1, nw = H * cs / nl, ny = st.h * sn / nl;
  // (G11) THE BROAD SWELL IS MEASURED FROM THE RING: a noise of the place as it lies from the ring's own middle, with
  // no offset typed, dealt or tried. WHAT WOULD SWELL INTO THE COURT IS FOLDED BACK from the court's bound (the relief
  // stays, turned inside out), so no part of an inner face lies flat on that bound. The yew is fixed geometry, the same
  // on every seed, and its bounds hold on every seed: counted at every 0.2 m of its length and 31 places up each inner
  // section, none lies on the wings' bound (the back's bound holds 2.5 in 100, where the south wall presses the corner);
  // the swell runs from 0.73 m inward to 1.14 m outward; the skin's foot stands 0.3 m under the grass at every station.
  const q0 = fr.at(a, p), fine = fbm3(q0[0] * 0.3 + y * 0.19, q0[1] * 0.3 - y * 0.23) - 0.5, broad = vnoise((q0[0] - fr.x) * 0.11 + y * 0.07, (q0[1] - fr.z) * 0.11 + y * 0.05) - 0.5;
  const lump = (vnoise(q0[0] * 0.83 + 4.7 + y * 0.31, q0[1] * 0.83 + 2.2 - y * 0.27) - 0.42) * sstep(0.15, 0.7, Math.max(0, sn));
  const d = (Y.shag * (2.2 * fine + 1.4 * broad) + Y.lump * 2 * lump) * sstep(0, 1.5, y + 0.4), bb = Y.backInner - off;
  a += st.na * nw * (d + off); p += st.np * nw * (d + off);
  const bi = alcoveInner(a) - off;
  if (a < bb && Math.abs(p) < bi) { if (bi - Math.abs(p) < bb - a) p = (p < 0 ? -1 : 1) * (2 * bi - Math.abs(p)); else a = 2 * bb - a; }
  let q = fr.at(a, p);
  const yy = Math.max(-0.3, y + ny * (d + off)), wz = Y.wallZ - Y.wallLump * vnoise(q[0] * 0.45 + 8.3, yy * 0.45 + 1.7);
  if (q[1] > wz) {
    a -= (q[1] - wz) / fr.s;
    if (a < bb && Math.abs(p) < alcoveInner(a) - off) a = bb;   // (never into the court: back to its bound, which lies before the brick)
    q = fr.at(a, p);
  }
  return { p: [q[0], PLAN.riseTop - 0.3 + yy, q[1]], n: [st.na * nw * fr.c + st.np * nw * fr.s, ny, st.na * nw * fr.s - st.np * nw * fr.c], a, pp: p, y: yy, d };
}
// THE RING'S LIGHT, by place (section 177: no image of the ring anywhere; neither portal.drawWithin nor portal.drawIn):
// how much of its warm white gold reaches the point p on a face turned n. It falls with the distance from the ring's
// middle; a face turned from the ring takes none (the yew is not passed)
export function ringLight(p, n, half = FAR.ring.half) {
  const fr = alcoveFrame(), dx = fr.x - p[0], dy = fr.y - p[1], dz = fr.z - p[2], d = Math.hypot(dx, dy, dz) || 1, q = d / half;
  return (n ? Math.max(0, 0.25 + 0.75 * (n[0] * dx + n[1] * dy + n[2] * dz) / d) : 1) / (1 + q * q);
}
const ringOn = (c, p, n, k, G = 0, half = FAR.ring.half) => { const g = ringLight(p, n, half), R = FAR.ring.color, m = G * g, e = k * g; return [c[0] * (1 + m * R[0]) + R[0] * e, c[1] * (1 + m * R[1]) + R[1] * e, c[2] * (1 + m * R[2]) + R[2] * e]; };
// the pool of the ring's light on the grass: in the alcove's court and out through its mouth in a widening fan
export function ringPool(x, z) {
  const fr = alcoveFrame(), Y = FAR.yew, m = PLAN.alcove.mouthToRing, a = (x - fr.x) * fr.c + (z - fr.z) * fr.s;
  if (a > Y.backInner + 1 || a < -m - 16) return 0;
  const p = (x - fr.x) * fr.s - (z - fr.z) * fr.c, wide = a > -m ? Y.inner : Y.inner + (-m - a) * 0.55, q = Math.hypot(a, p, 4.4) / FAR.ring.near;
  return sstep(wide + 1.2, wide - 1.6, Math.abs(p)) * sstep(-m - 16, -m - 3, a) * sstep(Y.backInner + 1, Y.backInner - 0.5, a) / (1 + q * q);
}

// THE STONE OF THE ALCOVE: two tall urns at its mouth (each a turned body on a square plinth, a little out of true) and
// the plain seat at its back (a slab on three blocks, its back in the yew). Plain faces of the grey's material, coloured
// by place: the stone's grey mottled, moss low down, on every ledge and on the side from the sun, pale lichen toward it,
// a dark stain under the rim; dimmed by the sun's place, lit by the ring. Gives the urns' tops (where their roses root).
const URN_PROFILE = [[0.55, 0.95], [0.78, 0.9], [0.98, 0.5], [1.45, 0.42], [1.7, 0.7], [1.92, 0.5], [2.15, 0.75], [2.5, 1.3], [3.1, 1.7], [3.6, 1.75], [4.0, 1.5], [4.3, 1.18], [4.55, 1.3], [4.8, 1.6], [4.93, 1.63], [5.0, 1.45], [5.02, 0.9], [5.05, 0.1]];
function alcoveStone(F, sunAt, dim) {
  const fr = alcoveFrame(), U = FAR.urn, ST = FAR.seat, S3 = v3.norm(PLAN.sunTo), g0 = PLAN.riseTop, m = PLAN.alcove.mouthToRing, c01 = (v) => Math.max(0, Math.min(1, v));
  const stone = linRGB(U.stone), moss = linRGB(U.moss), lichen = linRGB(U.lichen), stain = linRGB(U.stain);
  // the stone at p on a face turned n: `ledge` (0..1) where moss lies thick, `under` (0..1) where the stain runs
  const col = (p, n, ledge, under) => {
    const h = p[1] - g0, n1 = fbm3(p[0] * 0.9 + p[1] * 0.6, p[2] * 0.9 - p[1] * 0.4), n2 = vnoise(p[0] * 2.3 + 7 + p[1], p[2] * 2.3 + p[1] * 1.7), sunSide = n[0] * S3[0] + n[2] * S3[2];
    let c = mix3(stone, stain, c01(under * 0.8 + (0.5 - n2) * 0.5));
    c = mix3(c, lichen, sstep(0.6, 0.75, n2) * c01(0.4 + sunSide) * 0.7);
    c = mix3(c, moss, c01(0.5 - h * 0.22 + 0.5 * ledge - 0.3 * sunSide + (n1 - 0.5) * 1.6)).map((v) => v * (0.8 + 0.4 * n1) * (1 - 0.3 * under + 0.12 * ledge));
    return ringOn(dim(c, sunAt(p[0] + n[0] * 0.5, p[1] + n[1] * 0.5 + 0.1, p[2] + n[2] * 0.5)), p, n, FAR.ring.stone);
  };
  const quad = (A, B, C, D, n, ledge, under) => {
    const cA = col(A, n, ledge, under), cB = col(B, n, ledge, under), cC = col(C, n, ledge, under), cD = col(D, n, ledge, under), x = v3.cross(v3.add(B, A, -1), v3.add(C, A, -1));
    if (x[0] * n[0] + x[1] * n[1] + x[2] * n[2] >= 0) { F.tri(A, B, C, cA, cB, cC, 0, 0, 0, 0, n); F.tri(A, C, D, cA, cC, cD, 0, 0, 0, 0, n); }
    else { F.tri(A, C, B, cA, cC, cB, 0, 0, 0, 0, n); F.tri(A, D, C, cA, cD, cC, 0, 0, 0, 0, n); }
  };
  // a block in the alcove's frame, cut in np lengths across (its foot is not built)
  const block = (a0, a1, p0, p1, y0, y1, np) => {
    const P = (a, p, y) => { const q = fr.at(a, p); return [q[0], y, q[1]]; }, dA = [fr.c, 0, fr.s], dP = [fr.s, 0, -fr.c], neg = (v) => [-v[0], 0, -v[2]];
    for (let k = 0; k < np; k++) {
      const pa = p0 + (p1 - p0) * k / np, pb = p0 + (p1 - p0) * (k + 1) / np;
      quad(P(a0, pa, y1), P(a0, pb, y1), P(a1, pb, y1), P(a1, pa, y1), [0, 1, 0], 0.7, 0);
      quad(P(a0, pa, y0), P(a0, pb, y0), P(a0, pb, y1), P(a0, pa, y1), neg(dA), 0, 0.25);
      quad(P(a1, pa, y0), P(a1, pb, y0), P(a1, pb, y1), P(a1, pa, y1), dA, 0, 0.25);
    }
    quad(P(a0, p0, y0), P(a1, p0, y0), P(a1, p0, y1), P(a0, p0, y1), neg(dP), 0, 0.25);
    quad(P(a0, p1, y0), P(a1, p1, y0), P(a1, p1, y1), P(a0, p1, y1), dP, 0, 0.25);
  };
  const urn = (pU, lean) => {
    const aU = -m - U.ahead, q = fr.at(aU, pU), ky = U.high / 5, kr = U.r / 1.75, n = URN_PROFILE.length;
    const pts = URN_PROFILE.map(([y]) => [q[0] + lean[0] * y, g0 + y * ky, q[1] + lean[1] * y]);
    const slope = (i) => { const a = URN_PROFILE[Math.max(0, i - 1)], b = URN_PROFILE[Math.min(n - 1, i + 1)]; return (b[1] - a[1]) / Math.max(0.05, b[0] - a[0]); };
    F.tube(pts, U.sides, (i) => URN_PROFILE[i][1] * kr, (p, nr, i) => { const sl = slope(i); return col(p, nr, c01(-sl * 0.7), c01(sl * 0.45)); }, () => 0, true, 1);
    block(aU - U.plinth, aU + U.plinth, pU - U.plinth, pU + U.plinth, g0 - 0.3, g0 + 0.56, 2);
    return [q[0] + lean[0] * 5, g0 + U.high, q[1] + lean[1] * 5];
  };
  const tops = [urn(-PLAN.alcove.half, [0.012, -0.008]), urn(PLAN.alcove.half, [-0.006, 0.014])];
  block(ST.a[0], ST.a[1], -ST.half, ST.half, g0 + ST.high - ST.slab, g0 + ST.high, 9);
  for (const p of [-3.4, 0, 3.4]) block(ST.a[0] + 0.2, ST.a[1] - 0.1, p - 0.45, p + 0.45, g0 - 0.3, g0 + ST.high - ST.slab, 1);
  return tops;
}

// THE ROSES OF THE ALCOVE: from each urn a mound of leaf and bloom whose sprays spill down its sides; over the yew's
// top, its shoulders and its mouth ends long sprays of climbing rose: heaps of leaf and bloom on the skin and garlands
// hanging from them down the faces, outside the ring and never across it (every card's corners pass `clear`: the yew's
// side of the court's bound). One colour a plant: cream and shell pink on the right wing, shell and deep pink on the
// left. Lit by the sun's place and by the ring. Gives the number of cards.
function alcoveRoses(F, sunAt, dim, clear, rng, tops, path, more) {
  const W = WALL_ROSE, R = FAR.ring, E = FAR.rose, PI = Math.PI, TAU = PI * 2, fr = alcoveFrame(), g0 = PLAN.riseTop;
  const lo = linRGB(W.leaf[0]).map((v) => v * W.gain), hi = linRGB(W.leaf[1]).map((v) => v * W.gain), tints = W.colors.map((h) => linRGB(h).map((v) => v * W.headGain));
  const corners = (a, b, wd, face) => { const Sd = v3.norm(v3.cross(v3.add(b, a, -1), face)); return [v3.add(a, Sd, wd / 2), v3.add(a, Sd, -wd / 2), v3.add(b, Sd, wd / 2), v3.add(b, Sd, -wd / 2)]; };
  let n = 0;
  // a card of leaf mass (tint null) or of bloom heads centred at p along ax, lit as the body nrm
  const tuft = (p, ax, nrm, h, tint, sway, test) => {
    const a = v3.add(p, ax, -h / 2), b = v3.add(p, ax, h / 2), face = v3.norm([nrm[0] + rng.range(-0.3, 0.3), 0.05, nrm[2] + rng.range(-0.3, 0.3)]), wd = h * 1.33;
    if (!corners(a, b, wd, face).every(test)) return;
    const lit = sunAt(p[0] + nrm[0] * 0.6, p[1] + nrm[1] * 0.6, p[2] + nrm[2] * 0.6), g = rng.range(0.2, 1), ln = v3.norm([nrm[0], nrm[1] + 0.35, nrm[2]]), tk = rng.range(0.85, 1.1);
    const c0 = ringOn(dim(tint ? tint.map((v) => v * tk) : mix3(lo, hi, g * 0.55), lit), p, nrm, R.rose);
    const c1 = tint ? c0 : ringOn(dim(mix3(lo, hi, 0.25 + g * 0.75).map((v) => v * (1 + W.topLight * Math.max(0, nrm[1]))), lit), p, nrm, R.rose);
    F.card(a, b, wd, wd * rng.range(0.85, 1.1), face, tint ? TWIG_CELLS.heads : TWIG_CELLS.mass, c0, c1, sway, sway + 0.03, 0.3, ln); n++;
  };
  // a garland from `root` down by l, drifting `drift` of l outward: the hanging rose in leaf, bloom heads along it
  const garland = (root, out, l, drift, tint, sway, test) => {
    const foot = [root[0] + out[0] * drift * l, root[1] - l, root[2] + out[2] * drift * l];
    if (foot[1] < g0 + E.foot) return;
    const face = v3.norm([out[0] + rng.range(-0.25, 0.25), 0.05, out[2] + rng.range(-0.25, 0.25)]), wd = rng.range(1.2, 1.9);
    if (!corners(root, foot, wd * 1.1, face).every(test)) return;
    const lit = sunAt(root[0] + out[0], root[1] - l / 2, root[2] + out[2]), cc = ringOn(dim(W.rimTint.map((v) => v * 0.75), lit), foot, out, R.rose), sf = sway + E.sway * l;
    F.card(root, foot, wd, wd * 1.1, face, TWIG_CELLS.leaf, cc, cc, sway, sf, 0.4, out); n++;
    for (let k = 0, nk = Math.round(l * E.strung); k < nk; k++) {
      const q = (k + rng.range(0.2, 0.8)) / nk, p = [root[0] + (foot[0] - root[0]) * q + out[0] * 0.12, root[1] - l * q, root[2] + (foot[2] - root[2]) * q + out[2] * 0.12];
      tuft(p, v3.norm([rng.range(-0.3, 0.3), -1, rng.range(-0.3, 0.3)]), out, rng.range(E.head[0], E.head[1]), tint, sway + (sf - sway) * q, test);
    }
  };
  // the urns: a mound of rose leaf on each, small heads strewn over it, and sprays over its rim (cream on the left
  // hand, shell pink on the right)
  const urnAir = (q) => Math.abs(fr.of(q[0], q[2])[1]) >= E.urnAir;
  tops.forEach((T, u) => {
    const tint = tints[u === 0 ? 1 : 0];
    for (let k = 0; k < 14; k++) {
      const az = TAU * (k + rng.range(0, 1)) / 14, el = rng.range(0.15, 1.35), d = [Math.cos(az) * Math.cos(el), Math.sin(el), Math.sin(az) * Math.cos(el)];
      tuft([T[0] + d[0] * 1.25, T[1] + 0.1 + d[1] * 1.1, T[2] + d[2] * 1.25], v3.norm([d[0] * 0.4, 1, d[2] * 0.4]), d, rng.range(1.2, 1.6), null, 0.02, urnAir);
    }
    for (let k = 0; k < E.urnHeads; k++) {
      const az = TAU * (k + rng.range(0, 1)) / E.urnHeads, el = rng.range(0.1, 1.3), d = [Math.cos(az) * Math.cos(el), Math.sin(el), Math.sin(az) * Math.cos(el)];
      tuft([T[0] + d[0] * 1.5, T[1] + 0.15 + d[1] * 1.3, T[2] + d[2] * 1.5], v3.norm([d[0] * 0.4 + rng.range(-0.3, 0.3), 1, d[2] * 0.4 + rng.range(-0.3, 0.3)]), d, rng.range(E.head[0], E.head[1]), tint, 0.02, urnAir);
    }
    for (let k = 0; k < 7; k++) {
      const az = TAU * (k + rng.range(0.1, 0.9)) / 7, out = [Math.cos(az), 0, Math.sin(az)];
      garland([T[0] + out[0] * 1.35, T[1] - 0.05, T[2] + out[2] * 1.35], out, rng.range(1.4, 3.0), 0.2, tint, 0.02, urnAir);
    }
  });
  // the climbers over the yew: a plant every ninth of the U and one at each mouth end
  const last = path.length - 1, plants = [0.015, 0.985];
  for (let k = 0; k < E.plants; k++) plants.push((k + rng.range(0.2, 0.8)) / E.plants);
  for (const pf of plants) {
    const i0 = Math.round(pf * last), tint = pf < 0.42 ? tints[rng.chance(0.55) ? 0 : 1] : pf < 0.58 ? tints[1] : tints[rng.chance(0.5) ? 1 : 2];
    for (let h = 0, nh = rng.int(E.heaps[0], E.heaps[1]); h < nh; h++) {
      const st = path[Math.max(0, Math.min(last, i0 + rng.int(-3, 3)))], sk = alcoveSkin(st, PI * rng.range(0.22, 0.72), 0.55), flat = v3.norm([sk.n[0], 0, sk.n[2]]);
      for (let k = 0; k < 5; k++) {
        const p = [sk.p[0] + rng.range(-0.9, 0.9), sk.p[1] + rng.range(-0.5, 0.6), sk.p[2] + rng.range(-0.9, 0.9)];
        tuft(p, v3.norm([sk.n[0] * 0.3 + rng.range(-0.3, 0.3), 1, sk.n[2] * 0.3 + rng.range(-0.3, 0.3)]), sk.n, rng.range(1.2, 1.8), null, 0.02, clear);
      }
      for (let k = 0; k < E.climbHeads; k++) {
        const p = [sk.p[0] + rng.range(-1.1, 1.1) + sk.n[0] * 0.3, sk.p[1] + rng.range(-0.7, 0.8) + sk.n[1] * 0.3, sk.p[2] + rng.range(-1.1, 1.1) + sk.n[2] * 0.3];
        tuft(p, v3.norm([rng.range(-0.4, 0.4), 1, rng.range(-0.4, 0.4)]), sk.n, rng.range(E.climbHead[0], E.climbHead[1]), tint, 0.02, clear);
      }
      for (let k = 0, ng = rng.int(1, 3); k < ng; k++) {
        const inner = st.a < -4 && Math.abs(st.np) > 0.9 && rng.chance(0.4), gs = path[Math.max(0, Math.min(last, i0 + rng.int(-4, 4)))];
        const r = alcoveSkin(gs, PI * (inner ? rng.range(0.7, 0.8) : rng.range(0.14, 0.34)), 0.4), out = v3.norm([r.n[0], 0, r.n[2]]);
        garland(r.p, out[0] || out[2] ? out : flat, inner ? rng.range(1.8, 3.2) : rng.range(2.5, 5.2), inner ? 0 : 0.22, tint, 0.02, clear);
      }
    }
  }
  // (G10b) THE FINALE, by a stream of its own ('alcove-finale'): the same rose, more of it
  // about the way out. Each URN in full flower (more and larger heads all over its mound, more garlands over its
  // rim); more CLIMBERS over the top and down both faces of the wings and the back; two more at each MOUTH END.
  // Every card passes the same tests as above (the urns' air; the yew's side of the court's bound).
  if (!more) return n;
  rng = more;
  tops.forEach((T, u) => {
    const tint = tints[u === 0 ? 1 : 0];
    for (let k = 0; k < E.urnMore; k++) {
      const az = TAU * (k + rng.range(0, 1)) / E.urnMore, el = rng.range(0.05, 1.25), d = [Math.cos(az) * Math.cos(el), Math.sin(el), Math.sin(az) * Math.cos(el)];
      tuft([T[0] + d[0] * 1.7, T[1] + 0.2 + d[1] * 1.45, T[2] + d[2] * 1.7], v3.norm([d[0] * 0.4 + rng.range(-0.3, 0.3), 1, d[2] * 0.4 + rng.range(-0.3, 0.3)]), d, rng.range(0.75, 1.05), tint, 0.02, urnAir);
    }
    for (let k = 0; k < E.urnFalls; k++) {
      const az = TAU * (k + rng.range(0.1, 0.9)) / E.urnFalls, out = [Math.cos(az), 0, Math.sin(az)];
      garland([T[0] + out[0] * 1.45, T[1] + 0.1, T[2] + out[2] * 1.45], out, rng.range(1.6, 3.2), 0.2, tint, 0.02, urnAir);
    }
  });
  const climber = (pf, nh) => {
    const i0 = Math.round(pf * last), tint = pf < 0.42 ? tints[rng.chance(0.55) ? 0 : 1] : pf < 0.58 ? tints[1] : tints[rng.chance(0.5) ? 1 : 2];
    for (let h = 0; h < nh; h++) {
      const st = path[Math.max(0, Math.min(last, i0 + rng.int(-3, 3)))], sk = alcoveSkin(st, PI * rng.range(0.22, 0.78), 0.55), flat = v3.norm([sk.n[0], 0, sk.n[2]]);
      for (let k = 0; k < 4; k++) {
        const p = [sk.p[0] + rng.range(-0.9, 0.9), sk.p[1] + rng.range(-0.5, 0.6), sk.p[2] + rng.range(-0.9, 0.9)];
        tuft(p, v3.norm([sk.n[0] * 0.3 + rng.range(-0.3, 0.3), 1, sk.n[2] * 0.3 + rng.range(-0.3, 0.3)]), sk.n, rng.range(1.2, 1.8), null, 0.02, clear);
      }
      for (let k = 0; k < E.climbHeads + 3; k++) {
        const p = [sk.p[0] + rng.range(-1.2, 1.2) + sk.n[0] * 0.3, sk.p[1] + rng.range(-0.8, 0.9) + sk.n[1] * 0.3, sk.p[2] + rng.range(-1.2, 1.2) + sk.n[2] * 0.3];
        tuft(p, v3.norm([rng.range(-0.4, 0.4), 1, rng.range(-0.4, 0.4)]), sk.n, rng.range(E.climbHead[0], E.climbHead[1]), tint, 0.02, clear);
      }
      for (let k = 0, ng = rng.int(2, 3); k < ng; k++) {
        const inner = st.a < -2 && Math.abs(st.np) > 0.9 && rng.chance(0.5), gs = path[Math.max(0, Math.min(last, i0 + rng.int(-4, 4)))];
        const r = alcoveSkin(gs, PI * (inner ? rng.range(0.68, 0.8) : rng.range(0.14, 0.34)), 0.4), out = v3.norm([r.n[0], 0, r.n[2]]);
        garland(r.p, out[0] || out[2] ? out : flat, inner ? rng.range(2.0, 4.2) : rng.range(2.5, 5.2), inner ? 0 : 0.22, tint, 0.02, clear);
      }
    }
  };
  for (let k = 0; k < E.morePlants; k++) climber((k + rng.range(0.2, 0.8)) / E.morePlants, 3);
  for (const pf of E.mouthPlants) climber(pf, 4);
  return n;
}

// THE YEW'S OWN SKIN (G10b, point 3): old yew, deep soft green in layered sprays of fine needles. Its hull and its
// shag are meshes of ONE drawn material of their own; the light of the place (the sun's, the shade's, the turned
// faces' lift, the ring's warm light) is laid in each point's colour at build, as on every leaf here.
//  THE HULL bears SPRAYS drawn by place on the skin's own measure (yq.xy: metres along the skin and metres up it
//   from the foot, both taken on the built faces themselves, so no face stretches it): tongues to 0.2 m wide hanging
//   0.33 to 0.57 m, rooted in rows 0.21 m apart and set unevenly along them, each over the next rows; a spray is dark
//   at its root under the one above and light at its end, where the new growth is yellower; each its own tone; in
//   the gaps between sprays the dark of the body (0.149 of the skin, counted by a port over 1.44 million points). On
//   every spray NEEDLES in two ranks, 0.05 m apart (their stripes' mean is 1). The sprays give way to THEIR OWN MEAN,
//   (0.770, 0.760, 0.717) of the point's colour (the same count), from 0.35 to 1 of 0.137 m in a pixel's span; the
//   needles from 0.35 to 1 of 0.025 m.
//  THE SHAG is true geometry, a kite of two triangles to a spray (yq: across -1..1, along 0..1, the kind, its length
//   in metres): kind 1 a yew spray, its edge toothed by its needles (the teeth take 0.225 of the kite; where the
//   needles fall under a pixel the kite is drawn 0.775 wide: the same cover); kind 2 a drift of fallen needles
//   lying on the grass, its edge ragged by a noise of place (0.75 of the kite in the mean, and so drawn far off);
//   kind 3 a tuft of grass at the yew's foot, cut into blades toward its top (0.61 of the kite, and so drawn far
//   off). Sprays and tufts stir 0.03 m at their ends on the world's clock.
export const YEW = { mean: [0.770, 0.760, 0.717], stir: 0.03, fine: 1.9 };
const YEW_GLSL = /* glsl */`
// the sprays at q (the skin's measure times YEW.fine): (the light, the place across the spray's middle, 0 its root to
// 1 its end or -1 between sprays, the spray's own number)
vec4 gYew(vec2 q) {
  float row = floor(q.y / 0.4), sh = 1.0;
  for (int jj = 0; jj < 3; jj++) {
    float rj = row + 3.0 - float(jj), off = 0.5 * mod(rj, 2.0), ci = floor(q.x / 0.52 + off);
    vec2 id = vec2(ci, rj);
    float h = gmHash(id), cx = (ci + 0.5 - off + (h - 0.5) * 0.27) * 0.52, ry = (rj + 0.35 * gmHash(id + 7.3)) * 0.4;
    float t = (ry - q.y) / (0.9 * (0.7 + 0.5 * gmHash(id + 5.9))), dx = q.x - cx;
    if (t >= 0.0 && t <= 1.0) {
      float w = 0.19 * sqrt(1.0 - t * t) * (0.8 + 0.2 * gmHash(id + 3.1)), e = abs(dx) - w;
      if (e < 0.0) return vec4(sh * (0.62 + 0.45 * t), dx, t, h);
      sh = min(sh, 0.5 + 0.5 * smoothstep(0.0, 0.08, e));
    }
  }
  return vec4(0.42 * sh, 0.0, -1.0, 0.5);
}`;
export function makeYewMaterial(clock = makeClock()) {
  return drawnMaterial({
    key: 'garden-yew-1', vary: { yq: 'vec4', yc: 'vec3' }, uniforms: { ...clock }, head: SHADE_GLSL + YEW_GLSL,
    vertex: /* glsl */`
      if (yq.z > 0.5 && (yq.z < 1.5 || yq.z > 2.5)) transformed.xz += gWind.xy * (${YEW.stir.toFixed(3)} * yq.y * yq.y * min(uWind, 1.5) * sin(uTime * 1.7 + position.x * 0.9 + position.z * 1.3));`,
    color: /* glsl */`
      vec3 ycol = v_yc; float yk = v_yq.z;
      if (yk < 0.5) {
        vec2 yq2 = v_yq.xy; float yfw = max(length(dFdx(yq2)), length(dFdy(yq2)));
        float ynear = 1.0 - smoothstep(0.35, 1.0, yfw / 0.137), yfine = 1.0 - smoothstep(0.35, 1.0, yfw / 0.025);
        vec4 ys = gYew(yq2 * ${YEW.fine.toFixed(2)});
        float ycov = step(0.0, ys.z), ytip = ycov * ys.z * ys.z;
        float ystripe = smoothstep(0.2, 0.3, abs(fract((ys.z * 0.9 - abs(ys.y) * 1.2) / 0.095) - 0.5));
        vec3 ym = ys.x * (0.86 + 0.28 * ys.w) * mix(vec3(1.0), vec3(1.3, 1.22, 0.9), 0.55 * ytip) * mix(1.0, 0.76 + 0.48 * ystripe, yfine * ycov);
        ycol *= mix(vec3(${YEW.mean.map((v) => v.toFixed(3)).join(', ')}), ym, ynear);
      } else {
        float kx = abs(v_yq.x), ky = v_yq.y, kl = v_yq.w, kg = ky < 0.4 ? ky / 0.4 : (1.0 - ky) / 0.6;
        float kfw = length(vec2(dFdx(ky), dFdy(ky))) * kl;
        if (yk < 1.5) {
          float kfine = 1.0 - smoothstep(0.35, 1.0, kfw / 0.05);
          float kstripe = smoothstep(0.2, 0.3, abs(fract((ky - kx * 0.3) * kl / 0.05) - 0.5));
          if (kx > kg * mix(0.775, 0.55 + 0.45 * kstripe, kfine)) discard;
          ycol *= mix(1.0, 0.76 + 0.48 * kstripe, kfine);
        } else if (yk < 2.5) {
          float knear = 1.0 - smoothstep(0.35, 1.0, kfw / 0.17);
          if (kx > kg * mix(0.75, 0.5 + 0.5 * gvNoise(v_wp.xz * 6.0), knear)) discard;
          ycol *= mix(1.0, 0.8 + 0.4 * gvNoise(v_wp.xz * 23.0), 1.0 - smoothstep(0.35, 1.0, kfw / 0.045));
        } else {
          float knear = 1.0 - smoothstep(0.35, 1.0, kfw * 5.0);
          float kblade = abs(fract(v_yq.x * 2.5 / (0.3 + 0.7 * ky) + kl * 7.0) - 0.5) * 2.0;
          if (kx > kg * mix(0.61, 1.0, knear) || kblade * knear > 1.0 - 0.84 * ky) discard;
        }
      }
      diffuseColor.rgb = gShade(ycol, 1.0);`,
    extra: { side: THREE.DoubleSide },
  });
}
// the yew's store of points: vert gives a point's number; tri and kite lay triangles (a kite: root, two shoulders
// 0.4 along, end; wound to face `n`); build gives the mesh
export function makeYewBuf() {
  const pos = [], nrm = [], col = [], yq = [], idx = [];
  const vert = (p, n, c, a, b, k, l) => { pos.push(p[0], p[1], p[2]); nrm.push(n[0], n[1], n[2]); col.push(c[0], c[1], c[2]); yq.push(a, b, k, l); return pos.length / 3 - 1; };
  const tri = (a, b, c, n) => {
    const ux = pos[b * 3] - pos[a * 3], uy = pos[b * 3 + 1] - pos[a * 3 + 1], uz = pos[b * 3 + 2] - pos[a * 3 + 2], vx = pos[c * 3] - pos[a * 3], vy = pos[c * 3 + 1] - pos[a * 3 + 1], vz = pos[c * 3 + 2] - pos[a * 3 + 2];
    if ((uy * vz - uz * vy) * n[0] + (uz * vx - ux * vz) * n[1] + (ux * vy - uy * vx) * n[2] >= 0) idx.push(a, b, c); else idx.push(a, c, b);
  };
  const kite = (root, L, R, end, n, c0, c1, kind, l) => {
    const cm = [c0[0] + (c1[0] - c0[0]) * 0.4, c0[1] + (c1[1] - c0[1]) * 0.4, c0[2] + (c1[2] - c0[2]) * 0.4];
    const a = vert(root, n, c0, 0, 0, kind, l), b = vert(L, n, cm, -1, 0.4, kind, l), c = vert(R, n, cm, 1, 0.4, kind, l), d = vert(end, n, c1, 0, 1, kind, l);
    tri(a, b, c, n); tri(b, d, c, n);
  };
  const each = (fn, from = 0) => { for (let i = from; i < pos.length / 3; i++) fn(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2], yq[i * 4 + 2], yq[i * 4 + 1]); };
  const build = (name, material) => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
    geometry.setAttribute('yc', new THREE.Float32BufferAttribute(col, 3));
    geometry.setAttribute('yq', new THREE.Float32BufferAttribute(yq, 4));
    geometry.setIndex(idx); geometry.computeBoundingSphere();
    const object = new THREE.Mesh(geometry, material);
    object.name = name;
    return { object, geometry, triangles: idx.length / 3 };
  };
  return { vert, tri, kite, each, build, count: () => idx.length / 3, points: () => pos.length / 3 };
}

// THE YEW ALCOVE, built: the hull (a real mass: its skin drawn by place with sprays of needles, deepest in its
// hollows), over it the shag (true sprays, tufts and fallen needles, dealt by 'alcove-yew') and shoots of lighter new
// growth standing from its top, its shoulders and its mouth ends (nothing clipped). The 'alcove' stream deals the
// shoots only: the mass that hides the ring is the fixed hull. Hull and shag are of the yew's own material; the
// shoots and the roses are one mesh of the grey's one material.
// o = { sunAt, rng, stream (for 'alcove-roses', 'alcove-finale' and 'alcove-yew'), material, yew (the yew's own material), heightAt, yieldNow, dry (count only) }
export async function buildAlcove(o) {
  const F = makeFloraBuf(), fr = alcoveFrame(), Y = FAR.yew, R = FAR.ring, rng = o.rng, path = alcovePath(), K = Y.round, PI = Math.PI, H = PLAN.alcove.yewH;
  const base = linRGB(WALL_ROSE.yew), lo = base.map((v) => v * Y.lo), hi = base.map((v) => v * Y.hi), breathe = breathAfter(o.yieldNow, F.count, 1200, 6);
  // the yew out of the sun: a soft cool shade with a floor under it (T10: never black; the hollows too keep a tone)
  const dim = (c, lit) => { const k = 1 - lit, T = Y.shadeTo, B = Y.shadeFloor, U = Y.sunTo, L = Y.sunFloor; return [c[0] * (U[0] * lit + T[0] * k) + B[0] * k + L[0] * lit, c[1] * (U[1] * lit + T[1] * k) + B[1] * k + L[1] * lit, c[2] * (U[2] * lit + T[2] * k) + B[2] * k + L[2] * lit]; };
  const S0 = PLAN.sunTo, sl0 = Math.hypot(S0[0], S0[1], S0[2]);
  const sunOn = (p, n) => o.sunAt(p[0] + n[0] * 0.6, p[1] + n[1] * 0.6, p[2] + n[2] * 0.6), c01 = (v) => Math.max(0, Math.min(1, v));
  const info = { hull: 0, shingles: 0, shoots: 0, stone: 0, roses: 0, triangles: 0, leastToLine: 99, leastToRim: 99, stoneToRim: 99, sprays: 0, tufts: 0, drifts: 0, shagToLine: 99, shagToRim: 99 };
  // a place is clear of the court when it stands no nearer the ring than a card may (and not in the wall)
  const clear = (q) => { const [a, p] = fr.of(q[0], q[2]); return !(a < Y.backInner - Y.cards - 0.02 && Math.abs(p) < alcoveInner(a) - Y.cards - 0.02) && q[2] < PLAN.garden.z1 - 0.1; };
  // (G10b) THE YEW'S OWN TONE at a place of its skin, on a face turned n: lighter on its lumps and toward its top,
  // deeper in its hollows, broad patches of tone by place; the sun's light and the shade's by place; where turned
  // from the sun lifted in its own green (Y.turnedY: a face turned from the sun takes the sky's light only, which on
  // so dark a leaf falls under the brief's floor; less where the ring's warm light falls, its share [4], so that the
  // court stays the ring's); the ring's warm light by place
  const dimY = (c, lit) => { const k = 1 - lit, T = Y.shadeTo, B = Y.shadeFloorY, U = Y.sunTo, L = Y.sunFloor; return [c[0] * (U[0] * lit + T[0] * k) + B[0] * k + L[0] * lit, c[1] * (U[1] * lit + T[1] * k) + B[1] * k + L[1] * lit, c[2] * (U[2] * lit + T[2] * k) + B[2] * k + L[2] * lit]; };
  const turnedY = (c, n, p) => { const G = Y.turnedY, t = sstep(0.4, -0.2, (n[0] * S0[0] + n[1] * S0[1] + n[2] * S0[2]) / sl0) * (p ? 1 - G[4] * Math.min(1, G[5] * ringLight(p, n)) : 1); return [c[0] * (1 + G[0] * t) + G[1] * t, c[1] * (1 + G[0] * t) + G[2] * t, c[2] * (1 + G[0] * t) + G[3] * t]; };
  const yewTone = (sk, n, k = 1) => ringOn(turnedY(dimY(mix3(lo, hi, c01(0.4 + sk.d * 0.7 + 0.3 * sk.y / H)).map((v) => v * k * (0.8 + 0.4 * vnoise(sk.p[0] * 0.8 + sk.p[1] * 0.5, sk.p[2] * 0.8 - sk.p[1] * 0.4))), sunOn(sk.p, n)), n, sk.p), sk.p, n, R.yew, R.yewGain, R.near);
  // a shingle's place round the section, dealt evenly over its length (the outer face, the top, the inner face)
  const roundAt = (st, u) => {
    const Hs = H * st.k, t = u * (2 * Hs + 2 * st.h), up = (y) => Math.asin(Math.min(1, y / Hs) ** (1 / 0.6));
    if (t < Hs) return Math.max(0.02 * PI, up(t));
    if (t > Hs + 2 * st.h) return Math.min(0.98 * PI, PI - up(2 * Hs + 2 * st.h - t));
    const w = 1 - (t - Hs) / st.h;
    return Math.acos(Math.sign(w) * Math.abs(w) ** (1 / 0.55));
  };
  // THE HULL (G10b): the skin itself in the yew's own drawn material, a station every Y.hullStep m and Y.hullRound
  // faces round a section, its mouth ends rounded off in plan over 1.5 m (four narrower sections, four fifths and
  // more as tall, and a narrow fan). Each
  // point's normal is the built faces' own (so every lump and hollow takes its own light); its measure for the
  // drawn sprays is taken on the built faces: metres along its own row from the right wing's mouth end, metres up
  // its own section from the nearer foot (the outer foot for the outer half, the inner foot for the inner half:
  // the sprays hang down both faces from the ridge, where the two halves meet on a doubled row).
  const YB = makeYewBuf(), fineP = alcovePath(Y.hullStep), KH = Y.hullRound, KM = KH / 2, capT = [1.5, 1.2, 0.79, 0.38];
  const capOf = (st, th) => ({ ...st, a: st.a - 1.5 * Math.sin(th), h: st.h * Math.cos(th) ** 0.8 + 0.1, k: st.k * (0.8 + 0.2 * Math.cos(th)) });
  const stations = [...capT.map((th) => capOf(fineP[0], th)), ...fineP, ...capT.slice().reverse().map((th) => capOf(fineP[fineP.length - 1], th))];
  const grid = [];
  const rest = async (i, n, w, w0) => { if (o.yieldNow && i % n === n - 1) await o.yieldNow(i < n ? w0 : w); };
  for (const st of stations) { const r = []; for (let k = 0; k <= KH; k++) r.push(alcoveSkin(st, PI * k / KH)); grid.push(r); await rest(grid.length, 10, 0.5, 4.5); }
  const dist = (A, B) => Math.hypot(A.p[0] - B.p[0], A.p[1] - B.p[1], A.p[2] - B.p[2]), nI = grid.length, along = new Float64Array(KH + 1), ids = [];
  for (let i = 0; i < nI; i++) {
    const r = grid[i], up = [0], down = new Array(KH + 1).fill(0), row = [[], []];
    for (let k = 1; k <= KH; k++) up.push(up[k - 1] + dist(r[k], r[k - 1]));
    for (let k = KH - 1; k >= 0; k--) down[k] = down[k + 1] + dist(r[k], r[k + 1]);
    for (let k = 0; k <= KH; k++) {
      if (i) along[k] += dist(r[k], grid[i - 1][k]);
      const A = grid[Math.max(0, i - 1)][k].p, B = grid[Math.min(nI - 1, i + 1)][k].p, C = r[Math.max(0, k - 1)].p, D = r[Math.min(KH, k + 1)].p, sk = r[k];
      let n = v3.cross(v3.add(B, A, -1), v3.add(D, C, -1));
      const nl = Math.hypot(n[0], n[1], n[2]);
      n = nl > 1e-6 ? n.map((v) => v / nl) : sk.n;
      if (n[0] * sk.n[0] + n[1] * sk.n[1] + n[2] * sk.n[2] < 0) n = n.map((v) => -v);
      n = v3.norm([n[0] * 0.7 + sk.n[0] * 0.3, n[1] * 0.7 + sk.n[1] * 0.3, n[2] * 0.7 + sk.n[2] * 0.3]);
      const c = yewTone(sk, n);
      if (k <= KM) row[0][k] = YB.vert(sk.p, n, c, along[k], up[k], 0, 0);
      if (k >= KM) row[1][k] = YB.vert(sk.p, n, c, along[k], down[k], 0, 0);
    }
    ids.push(row);
    if (i) for (let k = 0; k < KH; k++) {
      const h = k < KM ? 0 : 1, P = ids[i - 1][h], Q = row[h], n = grid[i][k].n;
      YB.tri(P[k], Q[k], P[k + 1], n); YB.tri(Q[k], Q[k + 1], P[k + 1], n);
    }
    await rest(i, 10, 1.2, 2.3);
  }
  for (const i of [0, nI - 1]) {
    // a mouth end's last small section, closed by a fan about its own middle
    const r = grid[i], m = [0, 0, 0], nE0 = [-fr.c, 0, -fr.s];
    for (const sk of r) for (let q = 0; q < 3; q++) m[q] += sk.p[q] / r.length;
    const mid = YB.vert(m, nE0, yewTone({ p: m, d: 0, y: m[1] - PLAN.riseTop }, nE0), 0, m[1] - PLAN.riseTop, 0, 0);
    for (let k = 0; k < KH; k++) { const h = k < KM ? 0 : 1; YB.tri(mid, ids[i][h][k], ids[i][h][k + 1], nE0); }
  }
  info.hull = YB.count();
  // THE YEW'S STANDING SHOOTS of new growth, up and out from the top, the shoulders and the mouth ends (nothing
  // clipped): cards of the shoot's cell in the yew's own green, their ends lighter, Y.shoots to a station, dealt by
  // the 'alcove' stream, which deals nothing else. (G9d: the tufts, the flat sprays, the fronds and the mouth ends'
  // shingles are the hull's drawn sprays and the shag since G10b; they were still drawn here and not laid. What is
  // not built draws nothing: only the shoots are dealt.) A shoot whose corners do not all pass `clear`, or that
  // ends under the last lawn's level, is not laid.
  const sprayCol = (g, tk, tipK) => mix3(Y.needle, Y.tip, tipK).map((v) => v * tk * (0.75 + 0.5 * g));
  const nT = Math.round(path.length * Y.shoots), Z = Y.shoot;
  for (let j = 0; j < nT; j++) {
    const i = rng.int(0, path.length - 1), st = path[i], nx = path[Math.min(path.length - 1, i + 1)], pv = path[Math.max(0, i - 1)];
    const phi = PI * rng.range(0.14, 0.86), sk = alcoveSkin(st, phi, rng.range(0.1, Y.cards));
    const n = sk.n, A = fr.at(pv.a, pv.p), B = fr.at(nx.a, nx.p), tg = v3.norm([B[0] - A[0], 0, B[1] - A[1]]);
    const inner = phi > PI * 0.55, out = rng.range(0.5, 1.1), tl = rng.range(0.2, 0.6) * (rng.chance(0.5) ? 1 : -1);
    const ax = v3.norm([-n[0] * n[1] + tg[0] * tl + n[0] * out, 1 - n[1] * n[1] + 0.5 + n[1] * out, -n[2] * n[1] + tg[2] * tl + n[2] * out]);
    const l = rng.range(Z[0], Z[1]) * (inner ? 1 : Z[2]), wd = l * Z[3];
    const face = inner ? v3.norm([n[0], n[1] * 0.4 + 0.05, n[2]]) : v3.norm([n[0] + rng.range(-0.3, 0.3), n[1] * 0.4 + 0.05, n[2] + rng.range(-0.3, 0.3)]), nrm = v3.norm([n[0], n[1] + 0.35, n[2]]);
    const a = sk.p, b = v3.add(sk.p, ax, l), Sd = v3.norm(v3.cross(v3.add(b, a, -1), face));
    if (b[1] < PLAN.riseTop + 0.15 || ![v3.add(a, Sd, wd / 2), v3.add(a, Sd, -wd / 2), v3.add(b, Sd, wd / 2), v3.add(b, Sd, -wd / 2)].every(clear)) continue;
    const lit = sunOn(sk.p, n), tk = rng.range(0.75, 1.2), g = c01(0.5 + 0.5 * sk.y / H + rng.range(-0.2, 0.2)), tipK = rng.range(0.45, 0.95);
    const c0 = ringOn(turnedY(dimY(sprayCol(g, tk, 0.18), lit), nrm, a), a, n, R.yew, R.yewGain, R.near), c1 = ringOn(turnedY(dimY(sprayCol(g, tk, tipK), lit), nrm, b), b, n, R.yew, R.yewGain, R.near);
    F.card(a, b, wd, wd, face, TWIG_CELLS.shoot, c0, c1, 0.02, 0.08, 0.35, nrm);
    info.shoots++;
    if (j % 64 === 63) await breathe();
  }
  // THE SHAG (G10b), true geometry in the yew's own material, a kite of two triangles to each, dealt by a stream of
  // its own ('alcove-yew'): SPRAYS of needles standing up and out from the top and the shoulders (Y.shag3[0] to a
  // station of 0.6 m), hanging outward down the inner faces ([1]) and the outer faces ([2]; [3] within 9 m of the
  // mouth) and round the mouth ends, their ends lighter and yellower (the new growth); at the FOOT a skirt of
  // drooping sprays, TUFTS OF GRASS standing against it and DRIFTS OF FALLEN NEEDLES lying on the grass before it,
  // so that the yew meets the grass with no bare line. Every point of a spray passes `clear` (the yew's side of the
  // court's bound); tufts and drifts lie on the ground 5.4 m and more from the line's last straight in plan and
  // 2.2 m and more from the ring's rim. The whole shag is one mesh; the world shows it while the eye stands east
  // of FAR_CUT.end. (G11) ITS FAR FORM is a mesh of its own, shown while the eye stands west of that plane: ONE
  // BROAD KITE FOR EVERY Y.farOf OF A KIND as they are laid (the last one's root, end, length and facing; widened to
  // bear their summed area, less where the court's bound or the foot's rule holds it; of their mean colours by
  // area): a swap, nothing left out. No stream is drawn for it. info.shagMeans gives both forms' area and mean
  // colour by kind.
  const YS = makeYewBuf(), YF = makeYewBuf(), rs = o.stream('alcove-yew'), g0 = PLAN.riseTop, hAt = o.heightAt || (() => g0), nP = fineP.length, TIP = [1.45, 1.3, 0.95];
  const kiteArea = (a, b, c, d) => (Math.hypot(...v3.cross(v3.add(b, a, -1), v3.add(c, a, -1))) + Math.hypot(...v3.cross(v3.add(d, b, -1), v3.add(c, b, -1)))) / 2;
  const farG = {}, means = { 1: [0, 0, 0, 0, 0, 0, 0, 0], 2: [0, 0, 0, 0, 0, 0, 0, 0], 3: [0, 0, 0, 0, 0, 0, 0, 0] };   // by kind: near area, its colour's sum; far area, its colour's sum
  const tally = (kind, at, area, c0, c1) => { const M = means[kind]; M[at] += area; for (let q = 0; q < 3; q++) M[at + 1 + q] += area * (0.533 * c0[q] + 0.467 * c1[q]); };
  const farOut = (kind) => {
    const g = farG[kind];
    if (!g) return;
    const f0 = g.c0.map((v) => v / g.A), f1 = g.c1.map((v) => v / g.A);
    tally(kind, 4, g.lay(g.A / g.own, f0, f1), f0, f1);
    farG[kind] = null;
  };
  const farAdd = (kind, area, c0, c1, lay) => {
    const g = farG[kind] || (farG[kind] = { n: 0, A: 0, c0: [0, 0, 0], c1: [0, 0, 0] });
    g.n++; g.A += area; g.own = area; g.lay = lay;
    for (let q = 0; q < 3; q++) { g.c0[q] += c0[q] * area; g.c1[q] += c1[q] * area; }
    tally(kind, 0, area, c0, c1);
    if (g.n >= Y.farOf) farOut(kind);
  };
  const tgAt = (i) => { const u = fineP[Math.max(0, i - 1)], v = fineP[Math.min(nP - 1, i + 1)], A = fr.at(u.a, u.p), B = fr.at(v.a, v.p); return v3.norm([B[0] - A[0], 0, B[1] - A[1]]); };
  const footOk = (q) => { const [a, p] = fr.of(q[0], q[2]); return Math.hypot(Math.hypot(p, q[1] - fr.y) - PLAN.ringR, a) >= 2.2 && (Math.abs(p) >= 5.4 || a > 0.5) && q[2] < PLAN.garden.z1 - 0.3; };
  const pool = (c, x, z) => { const g = ringPool(x, z), G = R.grassGain, A = R.grassAdd; return [c[0] * (1 + g * G[0]) + A[0] * g, c[1] * (1 + g * G[1]) + A[1] * g, c[2] * (1 + g * G[2]) + A[2] * g]; };
  const spray = (st, tg, phi, zone) => {
    const sk = alcoveSkin(st, phi, -0.04), n = sk.n;
    if (sk.p[1] < g0 + 0.1) return;   // (a root in the grass bears no spray: asked before any draw)
    const upK = zone === 0 ? 0.55 : zone === 1 ? -0.8 : zone === 2 ? -0.4 : -0.45, outK = zone === 0 ? 0.75 : zone === 3 ? 0.85 : 0.5, tl = rs.range(-0.5, 0.5);
    const ax = v3.norm([n[0] * outK + tg[0] * tl, n[1] * outK + upK, n[2] * outK + tg[2] * tl]), l = rs.range(0.45, 0.95) * (zone === 0 ? 1.15 : 1), wd = l * rs.range(0.42, 0.6);
    let Sd = v3.cross(ax, n);
    const sl = Math.hypot(Sd[0], Sd[1], Sd[2]);
    Sd = sl > 0.05 ? Sd.map((v) => v / sl) : tg;
    const mid = v3.add(sk.p, ax, l * 0.4), end = v3.add(sk.p, ax, l), L = v3.add(mid, Sd, wd / 2), Rr = v3.add(mid, Sd, -wd / 2);
    if (zone) end[1] = Math.max(g0 + 0.06, end[1] - l * 0.12);
    if (![L, Rr, end].every(clear)) return;
    const tk = rs.range(0.8, 1.2), tipK = rs.range(0.2, 0.9), nk = v3.norm([n[0], n[1] + 0.3, n[2]]);
    const c0 = yewTone(sk, n, tk * 0.85), c1 = yewTone({ p: end, d: sk.d + 0.3, y: sk.y }, n, tk * 1.2).map((v, q) => v * (1 + (TIP[q] - 1) * tipK));
    YS.kite(sk.p, L, Rr, end, nk, c0, c1, 1, l);
    info.sprays++;
    farAdd(1, kiteArea(sk.p, L, Rr, end), c0, c1, (k, f0, f1) => {
      let w = wd * k;
      while (w > wd && ![v3.add(mid, Sd, w / 2), v3.add(mid, Sd, -w / 2)].every(clear)) w = Math.max(wd, w * 0.8);
      const A = v3.add(mid, Sd, w / 2), B = v3.add(mid, Sd, -w / 2);
      YF.kite(sk.p, A, B, end, nk, f0, f1, 1, l);
      return kiteArea(sk.p, A, B, end);
    });
  };
  const faceAt = (u, inner) => { const q = Math.asin(Math.min(1, u ** (1 / 0.6))); return inner ? PI - q : q; };
  // a thing on the grass at the foot: r metres out from the foot line of the station st (inner or outer)
  const onGrass = (st, inner, r) => { const f = alcoveSkin(st, inner ? PI * 0.995 : PI * 0.005), nl = Math.hypot(f.n[0], f.n[2]) || 1, x = f.p[0] + f.n[0] / nl * r, z = f.p[2] + f.n[2] / nl * r, q = [x, hAt(x, z), z]; q.out = [f.n[0] / nl, 0, f.n[2] / nl]; return q; };
  const tuft = (st, inner) => {
    const q = onGrass(st, inner, rs.range(0, 0.8));
    if (!footOk(q)) return;
    const h = rs.range(0.25, 0.6), az = rs.range(-0.7, 0.7), sd = [q.out[2] * Math.cos(az) + q.out[0] * Math.sin(az), 0, -q.out[0] * Math.cos(az) + q.out[2] * Math.sin(az)], wd = h * rs.range(0.7, 1.1), tk = rs.range(0.8, 1.25), ln = rs.range(-0.2, 0.2);
    const lit = o.sunAt(q[0], q[1] + 0.4, q[2]), c = pool([0.1 * tk, 0.19 * tk, 0.055 * tk].map((v) => v * (0.55 + 0.6 * lit)), q[0], q[2]), end = [q[0] + sd[2] * ln, q[1] + h, q[2] - sd[0] * ln];
    const root = [q[0], q[1] - 0.03, q[2]], side = (w, e) => [q[0] + e * sd[0] * w / 2, q[1] + h * 0.4, q[2] + e * sd[2] * w / 2], nk = v3.norm([q.out[0], 0.6, q.out[2]]), c0 = c.map((v) => v * 0.7), c1 = c.map((v) => v * 1.25), ph = rs.range(0, 1);
    YS.kite(root, side(wd, 1), side(wd, -1), end, nk, c0, c1, 3, ph);
    info.tufts++;
    farAdd(3, kiteArea(root, side(wd, 1), side(wd, -1), end), c0, c1, (k, f0, f1) => {
      let w = wd * k;
      while (w > wd && ![side(w, 1), side(w, -1)].every(footOk)) w = Math.max(wd, w * 0.8);
      YF.kite(root, side(w, 1), side(w, -1), end, nk, f0, f1, 3, ph);
      return kiteArea(root, side(w, 1), side(w, -1), end);
    });
  };
  const drift = (st, inner) => {
    const u = rs.range(0, 1), q = onGrass(st, inner, -0.2 + 1.3 * u * u), l = rs.range(0.4, 1.0), az = rs.range(0, PI * 2), d = [Math.cos(az), 0, Math.sin(az)], wd = l * rs.range(0.6, 1.0);
    const at = (k, s) => { const x = q[0] + d[0] * l * k + d[2] * s, z = q[2] + d[2] * l * k - d[0] * s; return [x, hAt(x, z) + 0.05, z]; }, P4 = [at(0, 0), at(0.4, wd / 2), at(0.4, -wd / 2), at(1, 0)];
    if (!P4.every(footOk)) return;
    const tk = rs.range(0.7, 1.2), lit = o.sunAt(q[0], q[1] + 0.3, q[2]), c = pool([0.2 * tk, 0.115 * tk, 0.05 * tk].map((v) => v * (0.6 + 0.5 * lit)), q[0], q[2]);
    YS.kite(P4[0], P4[1], P4[2], P4[3], [0, 1, 0], c, c, 2, l);
    info.drifts++;
    farAdd(2, kiteArea(P4[0], P4[1], P4[2], P4[3]), c, c, (k, f0, f1) => {
      let w = wd * k;
      while (w > wd && ![at(0.4, w / 2), at(0.4, -w / 2)].every(footOk)) w = Math.max(wd, w * 0.8);
      const A = at(0.4, w / 2), B = at(0.4, -w / 2);
      YF.kite(P4[0], A, B, P4[3], [0, 1, 0], f0, f1, 2, l);
      return kiteArea(P4[0], A, B, P4[3]);
    });
  };
  const Z3 = Y.shag3;
  for (let i = 0; i < nP; i++) {
    const st = fineP[i], tg = tgAt(i), byMouth = Math.min(st.t, fineP[nP - 1].t - st.t) < 9;
    for (let k = 0; k < Z3[0]; k++) spray(st, tg, PI * rs.range(0.2, 0.8), 0);
    for (let k = 0; k < Z3[1]; k++) spray(st, tg, faceAt(rs.range(0.1, 0.92), true), 1);
    for (let k = 0, n = byMouth ? Z3[3] : Z3[2]; k < n; k++) spray(st, tg, faceAt(rs.range(0.1, 0.92), false), 2);
    for (let k = 0; k < 3; k++) spray(st, tg, faceAt(rs.range(0.05, 0.11), true), 3);
    for (let k = 0; k < 4; k++) tuft(st, true);
    for (let k = 0; k < 5; k++) drift(st, true);
    if (byMouth) { for (let k = 0; k < 2; k++) { spray(st, tg, faceAt(rs.range(0.05, 0.11), false), 3); tuft(st, false); drift(st, false); } }
    await rest(i, 5, 2.3, 13);
  }
  for (const i of [0, 1, 2, 3, nI - 4, nI - 3, nI - 2, nI - 1]) for (let k = 0; k < 16; k++) spray(stations[i], [fr.s, 0, -fr.c], PI * rs.range(0.04, 0.96), 2);
  for (const kind of [1, 2, 3]) farOut(kind);
  info.shagMeans = means; info.shagFar = YF.count();
  const yewMark = F.mark(), n0 = F.count(), tops = alcoveStone(F, o.sunAt, dim);
  info.stone = F.count() - n0;
  const stoneEnd = F.mark();
  await breathe();
  info.roses = alcoveRoses(F, o.sunAt, dim, clear, o.stream('alcove-roses'), tops, path, o.stream('alcove-finale'));
  if (o.yieldNow) await o.yieldNow(15.5, 16.5);
  // the clear air, counted on what was built: the least distance of any vertex at full swing to the flown line and
  // to the ring's rim
  let nth = 0;
  F.each((x, y, z, reach) => {
    const [a, p] = fr.of(x, z), r = Math.hypot(p, y - fr.y), rim = Math.hypot(r - PLAN.ringR, a) - reach, stone = nth >= yewMark[0] && nth < stoneEnd[0];
    info.leastToLine = Math.min(info.leastToLine, (a > 0 ? Math.hypot(r, a) : r) - reach);
    if (stone) info.stoneToRim = Math.min(info.stoneToRim, rim); else info.leastToRim = Math.min(info.leastToRim, rim);
    nth++;
  });
  // (the shag's own clear air: a spray's end and a tuft's top at full stir)
  for (const Yb of [YS, YF]) Yb.each((x, y, z, kind, along) => {
    const [a, p] = fr.of(x, z), r = Math.hypot(p, y - fr.y), reach = kind > 1.5 && kind < 2.5 ? 0 : YEW.stir * 1.5 * along * along;
    info.shagToLine = Math.min(info.shagToLine, (a > 0 ? Math.hypot(r, a) : r) - reach); info.shagToRim = Math.min(info.shagToRim, Math.hypot(r - PLAN.ringR, a) - reach);
  });
  info.shag = YS.count(); info.triangles = F.count() + YB.count() + YS.count() + YF.count();
  if (o.dry) return { info };
  if (o.yieldNow) await o.yieldNow(16.5);
  const built = F.build('garden-alcove', o.material), hull = YB.build('garden-yew', o.yew);
  if (o.yieldNow) await o.yieldNow(1.2);
  const shag = YS.build('garden-yew-shag', o.yew), shagFar = YF.build('garden-yew-shag-far', o.yew);
  return { object: built.object, geometry: built.geometry, hull, shag, shagFar, triangles: built.triangles + hull.triangles + shag.triangles + shagFar.triangles, info };
}

// ---------------------------------------------------------------- THE FAR END: THE GREAT ROSE TREE
// At the lane's end (160, 10, 14): the oldest tree, 40 m, its crown 34 m across, by the old trees' maker grown heavier
// (a great leaning trunk, a few vast boughs, one bough broken off short and grown over), clothed from foot to top in
// climbing roses in full bloom: MOUNDS with real form on trunk and boughs (smooth lumped bodies, leaf in their
// undersides and hollows, bloom over their upper and sunlit sides), trusses standing off them, CURTAINS hanging from
// the boughs; cream, shell pink and deep pink in drifts by place, one accent of crimson low on the sunlit side
// (`pink`: on the far end's cloths the deep pink is held a little to the blue, so the low warm sun leaves it pink).
// ONE GREAT BRIDGE of rose crosses the last walk from it to a neighbour old tree on the route's right hand.
// (G9b) NO PICKED DEAL: ITS BOUNDS, held by rule on every seed and counted by dry builds on seeds 1 to 300.
// THE TOP: the leader is the plan's, from the fork to `top` (38 m) over the root; the clothed top stands 38.0 to
// 42.1 m over the grass. THE CROWN ROUND THE COMPASS: a vast bough of the plan in every eighth of the compass (seven,
// and the bridge's bough in the eighth it crosses); the farthest mass reaches 16.0 to 16.7 m from the root, and in
// every eighth one reaches 10.4 m and more (14.6 m and more on 205 of the 300 seeds). THE MASSES: eight up the trunk and the crimson one, then at most 33, 56
// and 64 on boughs, branches and branchlets (`masses`: an even share of the places where a tree grew more), 105 to
// 157 in all. THE CURTAINS: 24 on every seed, the neighbour's 12. THE NEIGHBOUR: masses on 0.7 of its places, never
// fewer than 60 where it has so many and never more than 90 (46 to 90 counted). THE BRIDGE stands on every seed
// between its two typed ends: span 24.5 m, sag 7.85 m, its lowest part 17.6 to 19.0 m over the flown line and 16.7 to
// 18.0 m at full swing (the rule: 16.5 and more). THE SEED'S: the trunk's lean (0.7 to 5.7 m at the fork, any way),
// `sides` (2) side boughs, every branch and branchlet, sizes, tints, 19 to 81 shoots over the top. The whole mesh:
// 18,154 to 24,186 triangles.
export const ROSE_TREE = {
  H: 40, crown: 17, rim: 1.2, heavy: 1.5, girth: 3.2, lean: 2.4, wallGap: 4.5, alcove: [-20, 15, 14],
  // (G9b) THE BOUNDS: the leader's end over the root, m over the grass; the side boughs the seed turns; the masses its
  // limbs bear at most, by level (boughs, branches, branchlets)
  top: 38, sides: 2, masses: [33, 56, 64],
  colors: ['#f3ead2', '#f0c3c0', '#d9728a'], crimson: '#9c1f2e', deep: [0.5, 1.05, 2.4], pink: [0.92, 1.0, 1.32], leaf: ['#2f5a2c', '#7aa64a'], bloom: 0.74, leafGain: 1.05,
  drift: [0.44, 0.6, 0.05, 0.075],   // the drift's noise: cream under [0], deep pink over [1], softness, its scale per metre
  // a bloom's tone by its side of the mass: [the far side's red, green, blue, the sun's side's, leaf green cast into the shade]
  shade: [0.27, 0.3, 0.42, 1.05, 1.0, 0.93, 0.5], truss: [1.4, 2.1],
  under: [0.62, 0.62, 0.72], underSoft: [0.86, 0.82, 0.84], head: 1.5, flowers: 34,   // a cloud's shaded tone; a truss of heads (m: a bloom 0.28 m) within `flowers` m of the line
  mound: { r: [[3.3, 4.3], [2.6, 3.4], [2.2, 3.0]], least: 1.25, trunk: [1.9, 2.6], sides: 5, body: 0.5, dark: 0.4, cards: [7, 6, 5], leafy: 1.5, cloudy: 1.5, card: [1.3, 3.2], topLight: 0.45, sunLight: 0.5, toSun: 0.35, cloud: 2.4, flat: 0.8 },
  curtain: { most: 24, len: [8, 20], least: 7.9, foot: 6.9, wide: [2.0, 3.2], from: 14.5, truss: 0.9, edge: 9.5 },
  // the crown's hull: 17 m round the root up to `mid` over the grass, drawn in as a dome above it, ragged by the compass;
  // its underside (`under`: no bough or mass but the trunk's own within [2] m lower than [0], the whole crown from [1]);
  // the boughs' bow by level; shoots standing over the top: [from this height, chance, length]
  dome: { mid: 21, rag: 0.26, under: [8, 16, 6] }, bow: [0.15, 0.2, 0.25], shoots: [27, 0.7, [2.4, 4.2]],
  // the vast boughs: [compass in degrees (0 east, 90 south), reach from the root, their ends' height over the grass,
  // the bow's rise at the middle, girth by the trunk's]
  // (G9b: one in every eighth of the compass, the bridge's bough standing in the eighth from 90 to 135)
  boughs: [[-95, 15.0, 18, 5.5, 0.48], [-62, 14.5, 19.5, 5.5, 0.44], [-28, 14.0, 20, 5, 0.42], [12, 14.5, 19, 5.5, 0.44], [52, 14.5, 19, 6, 0.45], [138, 14.5, 21, 5, 0.42], [205, 15.5, 17.5, 6, 0.5]],
  // SOFT (the great tree, its neighbour, the bridge): the leaf turned from the sun is filled [gain, + red, green, blue]
  // between the sun's cosines `from`; a heart's tone; a cloud's foot by its head and the leaf cast into it; a cloud's
  // width at most; under `far` of a mass's sun side no cloud stands (trusses there, leaf between them)
  // (by tone only on the far end's standards and cascades: a standard's cloud stands at `side` of the sun's side at
  // least, its foot by `stdUnder`)
  soft: { thru: [2.2, 0.07, 0.065, 0.095], from: [0.45, -0.3], heart: 0.6, under: [0.38, 0.4, 0.56], underLeaf: 0.35, cloud: 2.0, far: 0.4, side: 0.3, stdUnder: [0.6, 0.6, 0.74] },
  stub: { f: 0.74, len: 3.4, r: [0.62, 0.45] }, great: [3.0, 2.6], thru: [0.8, 0.006, 0.010, 0.004],   // the great tree's own bloom share and cloud at most
  neighbour: { at: [-26, -19], H: 30, near: -12, low: 12, share: 0.7, masses: [60, 90], from: 14, curtains: 12, len: [5, 9], cloudy: 1.0 },
  // the bridge: its ends' places (a: the end of the great tree's reaching south-west bough, b: of the neighbour's), its
  // floor over the flown line's height within 8 m of the line, its sag by its span at most with the low point at 1 / (1 + skew) of the
  // way from a, its bend in plan, mounds every `step` (`thick`: their size [at the ends, + at the low point]), hanging
  // sprays of unequal length, sway [ends, + middle]
  // (G10b: the bridge is a SHEAF of `sheaf` thin canes, the first caneMost in radius (0.1 m through), the rest
  // caneThin; the first `core` hold close to the one curve, the rest stray wider; a heap of leaf and bloom at every
  // third station of the string (stations `step` apart), `heap` of a mound's size, the canes showing between;
  // `on`: the chance of a small spray of leaf or bloom at each point of the first eight canes.
  // G11: EACH CANE AND EACH HEAP THAT STANDS IS DEALT ONCE, the canes by 'rose-bridge-canes', the heaps by
  // 'rose-bridge-heaps', the hanging sprays by 'rose-bridge'; nothing else is drawn)
  bridge: { over: 16.5, flutter: 0.4, core: 5, sheaf: 16, caneMost: 0.05, caneThin: [0.015, 0.04], heap: 0.8, on: 0.55, sag: 0.32, skew: 2.6, bend: [1.3, 0.5], a: [156.5, 45, 30.4], b: [132.6, 39.5, 30.5], mound: [1.5, 1.9], thick: [0.8, 0.42], step: 1.6, sprays: 36, spray: [4, 10], least: 3.5, sway: [0.05, 0.2] },
};
// the rose's cloth on a tree: o = { F, rng, ok(p, margin), litAt(p), heart, seed }
function makeRoseCloth(o) {
  const T = ROSE_TREE, F = o.F, rng = o.rng, S = PLAN.sunTo, sl = Math.hypot(S[0], S[1], S[2]), sun = [S[0] / sl, S[1] / sl, S[2] / sl], TAU = Math.PI * 2;
  const lo = linRGB(T.leaf[0]).map((v) => v * T.leafGain), hi = linRGB(T.leaf[1]).map((v) => v * T.leafGain);
  const tints = T.colors.map((h, j) => linRGB(h).map((v, i) => v * T.bloom * (o.soft && j === 2 ? T.pink[i] : 1))), crimson = linRGB(T.crimson).map((v, i) => v * T.bloom * T.deep[i]);
  const dim = (c, lit) => { const k = 1 - lit; return [c[0] * (1 - 0.76 * k), c[1] * (1 - 0.71 * k), c[2] * (1 - 0.62 * k)]; };
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  // LIGHT THROUGH THE LEAF: a card turned from the sun is filled with it (the lit material alone leaves a turned face
  // near black; T10), by T.thru = [gain, and a floor's red, green, blue]
  const SO = o.soft ? T.soft : null, FE = o.soft === 'tone';
  const thru = (c, n) => { const U = SO ? SO.thru : T.thru, t = (SO ? sstep(SO.from[0], SO.from[1], dot(n, sun)) : sstep(0.3, -0.4, dot(n, sun))) * U[0]; return t > 0 ? [c[0] * (1 + t) + U[1] * t, c[1] * (1 + t) + U[2] * t, c[2] * (1 + t) + U[3] * t] : c; };
  const card = (a, b, w0, w1, face, cell, c0, c1, s0, s1, flut, nrm) => F.card(a, b, w0, w1, face, cell, thru(c0, nrm), thru(c1, nrm), s0, s1, flut, nrm);
  // the drift's colour at a place: one colour a mass, passing into the next
  const drift = (p) => {
    const D = T.drift, t = vnoise(p[0] * D[3] + p[1] * D[3] * 0.6 + o.seed, p[2] * D[3] - p[1] * D[3] * 0.5 + o.seed * 0.37);
    return mix3(mix3(tints[0], tints[1], sstep(D[0] - D[2], D[0] + D[2], t)), tints[2], sstep(D[1] - D[2], D[1] + D[2], t));
  };
  // A MASS OF ROSE round c (radius R0): its HEART, a small closed form in the darkest leaf (what lies in the hollows
  // between the sprays, and what stops the sky showing through); `clothe` builds the mass itself round it
  const RINGS = [[0, 0.92], [1, 0.06], [0, -0.68]];
  const mound = (c, R0, tint, sway) => {
    const n = T.mound.sides, R = R0 * T.mound.body, lit = o.litAt(c), ph = rng.range(0, TAU), rows = [];
    for (let j = 0; j < RINGS.length; j++) {
      const [rf, hf] = RINGS[j], row = [];
      for (let i = 0, m = rf === 0 ? 1 : n; i < m; i++) {
        const a = ph + TAU * (i + 0.5 * (j % 2)) / n, d = [Math.cos(a) * rf, hf * T.mound.flat, Math.sin(a) * rf];
        const lump = R * (0.74 + 0.5 * vnoise((c[0] + d[0] * R) * 0.6 + d[1] * 2, (c[2] + d[2] * R) * 0.6 - d[1] * 1.5));
        const p = [c[0] + d[0] * lump, c[1] + d[1] * lump, c[2] + d[2] * lump], nr = v3.norm([d[0], d[1] + 0.25, d[2]]);
        const u = sstep(-0.75, 0.35, nr[1]), sf = Math.max(0, dot(nr, sun));
        row.push(F.vert(p, nr, thru(dim(mix3(lo, hi, 0.04 + 0.12 * u + 0.1 * sf * lit).map((v) => v * ((SO ? SO.heart : T.mound.dark) + 0.25 * u)), lit), nr), sway, 0.1));
      }
      rows.push(row);
    }
    for (let j = 0; j < RINGS.length - 1; j++) {
      const A = rows[j], B = rows[j + 1];
      for (let i = 0; i < n; i++) {
        const i1 = (i + 1) % n;
        if (A.length === 1) F.face(A[0], B[i1], B[i]);
        else if (B.length === 1) F.face(A[i], A[i1], B[0]);
        else { F.face(A[i], A[i1], B[i]); F.face(A[i1], B[i1], B[i]); }
      }
    }
  };
  // a truss card centred at p along ax, lit as the body nrm: bloom heads in `tint`, or leaf mass when tint is null
  const tuft = (p, ax, nrm, h, tint, sway, test) => {
    const a = v3.add(p, ax, -h / 2), b = v3.add(p, ax, h / 2), face = v3.norm([nrm[0] + rng.range(-0.3, 0.3), 0.05, nrm[2] + rng.range(-0.3, 0.3)]), wd = h * 1.33;
    const Sd = v3.norm(v3.cross(v3.add(b, a, -1), face));
    if (test && ![v3.add(a, Sd, wd / 2), v3.add(a, Sd, -wd / 2), v3.add(b, Sd, wd / 2), v3.add(b, Sd, -wd / 2)].every(test)) return 0;
    const lit = o.litAt(p), g = rng.range(0.2, 1), ln = v3.norm([nrm[0], nrm[1] + 0.35, nrm[2]]), tk = rng.range(0.85, 1.12), sf = Math.max(0, dot(nrm, sun));
    const c0 = dim(tint ? tint.map((v) => v * tk) : mix3(lo, hi, g * 0.4).map((v) => v * 0.8), lit), c1 = tint ? c0 : dim(mix3(lo, hi, 0.25 + 0.45 * g + 0.3 * sf).map((v) => v * (1 + 0.45 * Math.max(0, nrm[1]))), lit);
    card(a, b, wd, wd * rng.range(0.85, 1.1), face, tint ? TWIG_CELLS.heads : TWIG_CELLS.mass, c0, c1, sway, sway + 0.03, 0.3, ln);
    return 1;
  };
  // A CLOUD OF BLOOM about p, ww wide and half as high: two crossed cards of the blossom's cloud (one when `one`),
  // leaned toward the sun and the sky, the foot in the colour's shaded tone, the head lit
  const quad = (a, b, w, face) => { const Sd = v3.norm(v3.cross(v3.add(b, a, -1), face)); return [v3.add(a, Sd, w / 2), v3.add(a, Sd, -w / 2), v3.add(b, Sd, w / 2), v3.add(b, Sd, -w / 2)]; };
  // THE SIDE of a mass a bloom stands on (d from the mass's heart): 1 toward the sun, and on the tops by the sky; 0 on
  // the far side. Its tone there; and the normal it is lit by (never turned from the sun: the tone carries the shade)
  const sideOf = (d) => Math.min(1, sstep(-0.45, 0.55, dot(d, sun)) + 0.3 * Math.max(0, d[1]));
  const toned = (tint, w, k = 1) => { const Sd = T.shade, u = 1 - w; return [0, 1, 2].map((i) => tint[i] * k * (Sd[i] + (Sd[i + 3] - Sd[i]) * w) + lo[i] * Sd[6] * u); };
  const lightN = (d) => v3.norm([d[0] * 0.4 + sun[0], d[1] * 0.3 + sun[1] + 0.5, d[2] * 0.4 + sun[2]]);
  // A TRUSS of real heads (the heads' cell: clusters of four to six blooms) h high on the mass's skin at p, facing out
  const truss = (p, d, h, tint, sway, test) => {
    const ax = v3.norm([d[0] * 0.5 + rng.range(-0.25, 0.25), 0.9, d[2] * 0.5 + rng.range(-0.25, 0.25)]), a = v3.add(p, ax, -h / 2), b = v3.add(p, ax, h / 2), wd = h * 1.33;
    const face = v3.norm([d[0] + rng.range(-0.3, 0.3), d[1] * 0.5 + 0.05, d[2] + rng.range(-0.3, 0.3)]);
    if (test && !quad(a, b, wd, face).every(test)) return 0;
    const c = dim(toned(tint, sideOf(d), rng.range(0.98, 1.16)), o.litAt(p));
    F.card(a, b, wd, wd * rng.range(0.85, 1.1), face, TWIG_CELLS.heads, c, c, sway, sway + 0.03, 0.3, lightN(d));
    return 1;
  };
  // (`soft`: on a standard's small head the shaded tone stays near the colour)
  const cloud = (p, ww, tint, nrm, sway, one, test, soft = false) => {
    const up = v3.norm([sun[0] * 0.5 + nrm[0] * 0.3, 0.8 + sun[1] * 0.5 + nrm[1] * 0.2, sun[2] * 0.5 + nrm[2] * 0.3]), hh = ww * 0.52, a = v3.add(p, up, -0.5 * hh), b = v3.add(p, up, 0.5 * hh);
    const az = rng.range(0, TAU), face = v3.norm(v3.cross(up, [Math.cos(az), rng.range(-0.3, 0.3), Math.sin(az)])), f2 = v3.norm(v3.cross(up, face));
    if (test && !(quad(a, b, ww, face).every(test) && (one || quad(a, b, ww, f2).every(test)))) return 0;
    const std = soft && FE, lit = o.litAt(p), w = soft ? Math.max(std ? SO.side : 0.62, sideOf(nrm)) : sideOf(nrm), U = std ? SO.stdUnder : soft ? T.underSoft : SO ? SO.under : T.under, t1 = toned(tint, w, rng.range(0.9, 1.08)), nL = lightN(nrm), ul = SO && (std || !soft) ? SO.underLeaf : 0;
    const c1 = dim(t1, lit), c0 = dim([t1[0] * U[0] + lo[0] * ul, t1[1] * U[1] + lo[1] * ul, t1[2] * U[2] + lo[2] * ul], lit);
    card(a, b, ww, ww, face, TWIG_CELLS.puff, c0, c1, sway, sway + 0.03, 0.3, nL);
    if (!one) card(a, b, ww * 0.92, ww * 0.92, f2, TWIG_CELLS.puff, c0, c1, sway, sway + 0.03, 0.3, nL);
    return 1;
  };
  // THE MASS (the wall roses' way, all round): LEAF in cards of the dense leaf cell that STAND in its volume at every
  // depth from heart to skin, each facing outward (the inner ones darker: the hollows; no smooth face anywhere), a
  // shoot or two standing from its upper edge and tongues of leaf hanging from its lower (a ragged rim); over the leaf
  // BLOOM: clouds on its upper and sunlit sides (the far form) and, within T.flowers metres of the line, trusses of
  // real heads on them. All of it lies within 1.6 R of c; every card is tested by `test` at its four corners.
  const clothe = (c, R, tint, sway, nc, test) => {
    const M = T.mound, near = o.near ? o.near(c) : false, lit = o.litAt(c), tk = rng.range(0.82, 1.1), c01 = (v) => Math.max(0, Math.min(1, v));
    const put = (a, b, wd, face, cell, c0, c1, s1, nrm) => {
      if (test && !quad(a, b, wd, face).every(test)) return 0;
      card(a, b, wd, wd * rng.range(0.85, 1.1), face, cell, c0, c1, sway, s1, 0.3, nrm);
      return 1;
    };
    const nl = Math.round(nc * M.leafy), ne = R > 1.6 ? 3 : 1;
    for (let k = 0; k < nl + ne; k++) {
      const edge = k >= nl, down = edge && k > nl, az = rng.range(0, TAU), e = edge ? (down ? rng.range(-0.9, -0.2) : rng.range(0.5, 1.2)) : rng.range(-0.75, 1.25);
      const ce = Math.cos(e), se = Math.sin(e), out = edge ? 0.9 : rng.range(0.5, 1), dir = [Math.cos(az) * ce, se, Math.sin(az) * ce];
      const p = [c[0] + dir[0] * R * out, c[1] + dir[1] * R * out * M.flat, c[2] + dir[2] * R * out], sf = Math.max(0, dot(dir, sun)), lean = rng.range(-0.3, 0.6);
      const face = v3.norm([dir[0] + rng.range(-0.3, 0.3), 0.05, dir[2] + rng.range(-0.3, 0.3)]), nrm = v3.norm([dir[0], dir[1] + 0.35, dir[2]]);
      if (edge) {
        const l = R * (down ? rng.range(0.7, 1.3) : rng.range(0.5, 0.8)), ax = v3.norm(down ? [dir[0] * 0.2, -1, dir[2] * 0.2] : [dir[0] * 0.5, 1, dir[2] * 0.5]);
        const cc = dim(mix3(lo, hi, down ? 0.4 : 0.8).map((v) => v * tk), lit);
        put(p, v3.add(p, ax, l), l * (down ? 0.6 : 0.9), face, down ? TWIG_CELLS.leaf : TWIG_CELLS.shoot, cc, cc, sway + (down ? 0.1 : 0.05), nrm);
        continue;
      }
      const h = Math.min(M.card[1], Math.max(M.card[0], R * rng.range(0.8, 1.15))), ax = v3.norm(e < -0.2 ? [dir[0] * 0.5, -0.8, dir[2] * 0.5] : [dir[0] * lean, 1, dir[2] * lean]);
      const g = c01(0.5 + 0.5 * se + rng.range(-0.15, 0.15)), heart = (0.45 + 0.55 * (out - 0.5) / 0.5) * tk;
      put(v3.add(p, ax, -h / 2), v3.add(p, ax, h / 2), h * 1.33, face, TWIG_CELLS.mass, dim(mix3(lo, hi, g * 0.5).map((v) => v * heart), lit),
        dim(mix3(lo, hi, 0.2 + g * 0.55 + 0.25 * sf).map((v) => v * heart * (1 + M.topLight * Math.max(0, se) + M.sunLight * sf)), lit), sway + 0.03, nrm);
    }
    for (let k = 0, nk = Math.round(nc * (o.cloudy || M.cloudy)); k < nk; k++) {
      const az = rng.range(0, TAU), e = rng.range(-0.45, 1.25), ce = Math.cos(e), d = v3.norm([Math.cos(az) * ce + sun[0] * M.toSun, Math.sin(e) + sun[1] * M.toSun, Math.sin(az) * ce + sun[2] * M.toSun]);
      const p = [c[0] + d[0] * R, c[1] + d[1] * R * M.flat, c[2] + d[2] * R], ww = Math.min(R * rng.range(0.6, 0.9), SO && !FE ? SO.cloud : o.cloud || M.cloud);
      if (k % 3 !== 0 || (SO && !FE && sideOf(d) < SO.far)) { truss(v3.add(p, d, 0.25), d, Math.min(rng.range(T.truss[0], T.truss[1]), R * 1.1), tint, sway, test); continue; }
      if (cloud(p, ww, tint, d, sway, true, test) && near) truss(v3.add(p, d, 0.2 * ww), d, T.head * rng.range(0.9, 1.25), tint, sway, test);
    }
  };
  // A CURTAIN of rose from `root` (its sway s0) down by len0: two lengths of hanging cane in leaf, trusses of bloom
  // all down it; tried shorter twice, kept only where five places along it pass the rule at full swing, its foot stays
  // `low` over the grass and it is `least` long
  const at = (a, b, q) => [a[0] + (b[0] - a[0]) * q, a[1] + (b[1] - a[1]) * q, a[2] + (b[2] - a[2]) * q];
  // (on a wall: `stir` of a free curtain's swing, and its two cards lie `flat` to the wall's normal).
  // IN THE WIND (G7) these are the heaviest hangings of the place and the slowest: the full slow swing as counted,
  // and a fifth of a strand's flutter
  const curtain = (root, s0, len0, wide, tint, out, hAt, low, least, falls, stir = 1, flat = null) => {
    const G = GREY_ROSE, g = rng.range(0.38, 0.56), lean = [rng.range(-0.06, 0.06), rng.range(-0.06, 0.06)], kink = [rng.range(-0.04, 0.04), rng.range(-0.04, 0.04)], mg = Math.max(wide * 0.55, 1.4);
    let len = len0, joint, foot, sj, sf;
    for (let tr = 0; ; tr++) {
      joint = [root[0] + (lean[0] * g + kink[0]) * len, root[1] - g * len, root[2] + (lean[1] * g + kink[1]) * len];
      foot = [root[0] + lean[0] * len, root[1] - len, root[2] + lean[1] * len];
      sj = Math.min(G.swayMost, s0 + G.sway * stir * g * len); sf = Math.min(G.swayMost, s0 + G.sway * stir * len);
      const rj = sj * FLORA.swing + G.flut * FLORA.flutter + mg, rf = sf * FLORA.swing + G.flut / 0.3 * FLORA.flutter + mg;
      if (len >= least && foot[1] - hAt(foot[0], foot[2]) >= low && o.ok(root, s0 * FLORA.swing + mg) && o.ok(joint, rj) && o.ok(foot, rf) && o.ok(at(root, joint, 0.5), rj) && o.ok(at(joint, foot, 0.5), rf)) break;
      if (tr === 2 || len * 0.72 < least) return 0;
      len *= 0.72;
    }
    const lit = o.litAt(joint), sf0 = Math.max(0, dot(out, sun)), cell = rng.chance(0.8) ? TWIG_CELLS.leaf : TWIG_CELLS.veil;
    const c0 = dim(mix3(lo, hi, 0.2 + 0.3 * sf0), lit), c1 = dim(mix3(lo, hi, 0.45 + 0.5 * sf0), lit), cm = mix3(c0, c1, g);
    const [u0, vt, u1, vr] = cell, uw = rng.range(0.6, 1), uo = rng.range(0, 1 - uw), flip = rng.chance(0.5), vm = vr + (vt - vr) * g;
    const ua = u0 + (u1 - u0) * (flip ? uo + uw : uo), ub = u0 + (u1 - u0) * (flip ? uo : uo + uw), az = rng.range(0, TAU), face = flat || [Math.cos(az), 0, Math.sin(az)];
    card(root, joint, wide, wide * 1.05, face, [ua, vm, ub, vr], c0, cm, s0, sj, G.flut * 0.2, out);
    card(joint, foot, wide * 1.05, wide * 1.12, face, [ua, vt, ub, vm], cm, c1, sj, sf, G.flut / 0.3 * 0.2, out);
    // a garland: leaf in hanging masses and bloom in clouds all down it (real heads among them near the line)
    const near = o.near ? o.near(joint) : false;
    for (let k = 0, nk = Math.round(len * T.curtain.truss); k < nk; k++) {
      const q = (k + rng.range(0.15, 0.85)) / nk, p = q < g ? at(root, joint, q / g) : at(joint, foot, (q - g) / (1 - g)), sw = q < g ? s0 + (sj - s0) * q / g : sj + (sf - sj) * (q - g) / (1 - g);
      const pp = [p[0] + out[0] * 0.12 + rng.range(-0.12, 0.12) * wide, p[1], p[2] + out[2] * 0.12 + rng.range(-0.12, 0.12) * wide], down = v3.norm([rng.range(-0.3, 0.3), -1, rng.range(-0.3, 0.3)]);
      if (k % 3 === 0) { tuft(pp, down, out, Math.min(rng.range(1.3, 2.0), wide * 0.75), null, sw, null); continue; }
      const sd = v3.norm([out[0], 0.12, out[2]]);
      if (k % 3 === 1) cloud(pp, Math.min(1.8, wide * rng.range(0.5, 0.75)), tint, sd, sw, true, null);
      else truss([pp[0] + sd[0] * 0.2, pp[1], pp[2] + sd[2] * 0.2], sd, Math.min(rng.range(1.2, 1.8), wide * 0.8), tint, sw, null);
      if (near && k % 3 === 1) truss([pp[0] + sd[0] * 0.3, pp[1] - 0.5, pp[2] + sd[2] * 0.3], sd, Math.min(T.head, wide * 0.75), tint, sw, null);
    }
    falls.push([root, foot, wide, 1]);
    return len;
  };
  return { T, tints, crimson, lo, hi, dim, sun, drift, mound, tuft, cloud, clothe, curtain };
}

// The great rose tree's OWN RULE OF PLACE: clear of the east wall; S5 to the line as every tree's; its own crown (17 m
// round its root) IS the lane's end, and beyond that nothing of it stands in the lane's plan under 30 m.
export function roseTreeRule(rule) {
  const T = ROSE_TREE, G = PLAN.garden, [tx, tz] = PLAN.roseTree, fr = alcoveFrame();
  return (p, m) => {
    if (p[0] > G.x1 - T.wallGap - m) return false;
    const ap = fr.of(p[0], p[2]);   // (over the alcove, its mouth and its urns: nothing under 14 m)
    if (ap[0] > T.alcove[0] - m && Math.abs(ap[1]) < T.alcove[1] + m && p[1] - m < PLAN.riseTop + T.alcove[2]) return false;
    const q = rule.toLine(p[0], p[2]);
    if (!(q[0] >= GREY.nearLine + m + 0.12 || p[1] - q[1] >= GREY.over + m + 0.12)) return false;
    if (Math.hypot(p[0] - tx, p[2] - tz) + m <= T.crown) return true;
    return rule.toLane(p[0], p[2])[0] >= m + 0.12 || p[1] - m - riseAt(p[0]) >= PLAN.lane.clearBelow;
  };
}
// a tree clothed: mounds on its limbs by level (every second place of a bough, every branchlet's end), their trusses.
// clothePlaces lists the places of limbs as [limb, k] in the limbs' own order (the order they grew in: bough by bough
// round the tree). evenShare keeps `most` of a list evenly through it, with no draw: entry i of n stays where
// floor((i + 1) most / n) steps past floor(i most / n). So a tree that grew more places than its typed count of masses
// bears them on an even share of its limbs round the whole of it; the count is bounded on every seed; and a place left
// bare takes no number from any stream.
// clotheTree: c = the cloth, places = [limb, k], ok = its rule, accent = [place, reach, colour] or null. Returns the
// mounds as [centre, radius].
const clothePlaces = (limbs) => limbs.flatMap((L) => { const m = L.pts.length - 1; return (L.lv === 2 ? [m] : [2, 4, 6].filter((k) => k <= m)).map((k) => [L, k]); });
const evenShare = (list, most) => (list.length <= most ? list : list.filter((_, i) => Math.floor((i + 1) * most / list.length) > Math.floor(i * most / list.length)));
function clotheTree(c, places, ok, rng, accent) {
  const M = ROSE_TREE.mound, out = [];
  for (const [L, k] of places) {
    const sway = L.s0 + (GREY_TREE.sway[L.lv] - L.s0) * k / L.n, d = L.dirs[k], p = L.pts[k];
    let R = rng.range(M.r[L.lv][0], M.r[L.lv][1]);
    const at = (r) => (L.lv === 2 ? [p[0] + d[0] * r * 0.3, p[1] + d[1] * r * 0.3 + r * 0.15, p[2] + d[2] * r * 0.3] : [p[0], p[1] + r * 0.3, p[2]]);
    // (a mass fits itself to the rule: smaller at the crown's rim, down to M.least)
    let fit = false;
    for (let tr = 0; tr < 5 && R >= M.least && !(fit = ok(at(R), R * 1.1 + sway * FLORA.swing)); tr++) R *= 0.78;
    if (!fit) continue;
    const q = at(R), tint = accent && Math.hypot(q[0] - accent[0][0], q[1] - accent[0][1], q[2] - accent[0][2]) < accent[1] ? accent[2] : c.drift(q);
    c.mound(q, R, tint, sway);
    c.clothe(q, R, tint, sway, M.cards[L.lv], (v) => ok(v, sway * FLORA.swing + 0.3));
    out.push([q, R]);
  }
  return out;
}

// THE GREAT ROSE TREE AND ITS NEIGHBOUR, built as one mesh of the grey's one material.
// o = { rule (the grey's), sunAt, rng (the tree's own stream), stream (the world's maker of named streams), material,
//       yieldNow, dry (count only) }
// THE PLAN AND THE SEED (G9b). The PLAN's, the same on every seed: the root, the height and the crown's hull; the
// leader, from the fork to T.top over the root; the seven vast boughs and the bridge's bough, to their typed ends; the
// neighbour's root and its bough to the bridge's other end; the bridge's two ends, so its span, curve and sag; the
// counts (eight masses up the trunk, the crimson one, T.curtain.most curtains and the neighbour's, masses at most
// T.masses by level, the neighbour's within its two counts). The SEED's, by streams of plain names made from the seed
// ('rose-tree', 'rose-tree-wood', 'rose-tree-cloth', 'rose-tree-shoots', 'rose-neighbour', 'rose-neighbour-wood',
// 'rose-neighbour-cloth', 'rose-bridge', 'rose-bridge-canes', 'rose-bridge-heaps', 'rose-bridge-cloth'): the trunk's lean and winding, T.sides side boughs
// round the compass, every branch and branchlet, each mass's size and tint, which boughs the curtains hang from and
// how long, the shoots, the bridge's canes, heaps and sprays. No name carries a letter or a number picked among tries.
// Its rules measure from the PLAN's ground (the level lawn), not from the seed's swells; a curtain's foot
// (ROSE_TREE.curtain.foot) allows for the highest swell under it.
export async function buildRoseTree(o) {
  const T = ROSE_TREE, [tx, tz] = PLAN.roseTree, F = makeFloraBuf(), rng = o.rng, hAt = (x) => riseAt(x), rule = o.rule, g0 = hAt(tx, tz), TAU = Math.PI * 2, fr = alcoveFrame();
  const sunAt = (q) => o.sunAt(q[0], q[1], q[2]), breathe = breathAfter(o.yieldNow, F.count, 2000, 8), info = {}, falls = [], forms = [], ok = roseTreeRule(rule);
  // (the tree's own limbs, mounds and curtains: inside its crown of 34 m)
  const domeR = (p, under = false) => {
    const D = T.dome, h = p[1] - g0, az = Math.atan2(p[2] - tz, p[0] - tx), q = Math.max(0, (h - D.mid) / (T.H - D.mid));
    const low = under ? D.under[2] + (T.crown - D.under[2]) * sstep(D.under[0], D.under[1], h) : T.crown;
    return Math.min(low, T.crown * Math.sqrt(Math.max(0, 1 - q * q))) * (1 - D.rag * Math.max(0, vnoise(Math.cos(az) * 1.9 + 5.3, Math.sin(az) * 1.9 + h * 0.13) - 0.3) / 0.7);
  };
  // (its masses keep the underside; its curtains hang below it, anywhere within the crown's round)
  const okC = (p, m) => ok(p, m) && Math.hypot(p[0] - tx, p[2] - tz) + Math.min(m, 1) <= T.crown + 0.3;
  const okM = (p, m) => ok(p, m) && Math.hypot(p[0] - tx, p[2] - tz) + Math.min(m, 3) <= domeR(p, true);
  const okT = (p, m) => ok(p, m) && Math.hypot(p[0] - tx, p[2] - tz) + Math.min(m, 3) <= domeR(p), dseed = rng.range(0, 40);
  // (its wood a little inside that, so that the masses at its bough ends fill the crown; near: real heads there)
  const okW = (p, m) => ok(p, m) && Math.hypot(p[0] - tx, p[2] - tz) + Math.min(m, 3) <= domeR(p, true) - T.rim, near = (p) => rule.toLine(p[0], p[2])[0] < T.flowers;
  const wood = greyTree(F, { x: tx, z: tz, H: T.H, ok: okW, hAt, litAt: sunAt, heavy: T.heavy, girth: T.girth, lean: T.lean, twigs: false, bow: T.bow, stubFork: true, sides: T.sides, extra: [{ f: 1, to: [tx, g0 + T.top, tz], bow: 0, r: 0.62 }, { f: 1, to: T.bridge.a, bow: 3.0, r: 0.72 }, ...T.boughs.map((b) => ({ f: 1, to: [tx + Math.cos(b[0] * TAU / 360) * b[1], g0 + b[2], tz + Math.sin(b[0] * TAU / 360) * b[1]], bow: b[3], r: b[4] }))] }, o.stream('rose-tree-wood'));
  info.wood = F.count();
  const rngN = o.stream('rose-neighbour'), rngB = o.stream('rose-bridge');   // the neighbour's own stream, and the bridge's hanging sprays'
  await breathe(true);
  // a crown shades itself: what lies behind its heart from the sun stands in soft shade
  const S = PLAN.sunTo, sl = Math.hypot(S[0], S[1], S[2]);
  const shadeOf = (h, reach) => (q) => sunAt(q) * (0.45 + 0.55 * sstep(-0.9, 0.15, ((q[0] - h[0]) * S[0] + (q[1] - h[1]) * S[1] + (q[2] - h[2]) * S[2]) / sl / reach));
  const cloth = makeRoseCloth({ F, rng: o.stream('rose-tree-cloth'), ok: okC, litAt: shadeOf(wood.heart, T.crown), heart: wood.heart, seed: dseed, near, cloudy: T.great[0], cloud: T.great[1], soft: true });
  // the bough broken off short long ago, low on the sunlit side, grown over with the one crimson rose
  const sa = Math.atan2(S[2], S[0]) + rng.range(-0.3, 0.3), sd = [Math.cos(sa), 0.32, Math.sin(sa)], base = wood.axis(T.stub.f);
  const stub = [0.4, 0.4 + T.stub.len * 0.5, 0.4 + T.stub.len].map((l, i) => [base[0] + sd[0] * l, base[1] + sd[1] * l - 0.12 * i * i, base[2] + sd[2] * l]);
  F.tube(stub, 6, (i) => T.stub.r[0] + (T.stub.r[1] - T.stub.r[0]) * i / 2, (p, n) => wood.bark(p, n, 0.1), () => 0);
  const accent = [[stub[2][0], stub[2][1] + 0.6, stub[2][2]], 0, cloth.crimson], M = T.mound;
  cloth.mound(accent[0], 2.3, cloth.crimson, 0); cloth.clothe(accent[0], 2.3, cloth.crimson, 0, 8, null);
  forms.push([accent[0], accent[0], 2.3, 2.3, 0.7]);
  // the trunk clothed from its foot: mounds winding up it, bark between them
  for (let k = 0, a = rng.range(0, TAU); k < 8; k++, a += 2.4) {
    const q = 0.1 + 0.86 * (k + rng.range(0, 0.6)) / 8, R = rng.range(M.trunk[0], M.trunk[1]), c0 = wood.axis(q), d = wood.trad(q, a) + R * 0.4;
    const c = [c0[0] + Math.cos(a) * d, c0[1], c0[2] + Math.sin(a) * d], tint = cloth.drift(c);
    cloth.mound(c, R, tint, 0); cloth.clothe(c, R, tint, 0, 6, null);
    forms.push([c, c, R, R, 0.7]);
  }
  await breathe();
  // the boughs clothed, level by level
  let mounds = 9;
  const heaps = [];
  info.places = []; info.fitted = [0, 0, 0];
  for (let lv = 0; lv < 3; lv++) {
    const all = clothePlaces(wood.limbs.filter((L) => L.lv === lv)), places = evenShare(all, T.masses[lv]);
    info.places.push(all.length);
    for (let i = 0; i < places.length; i += 12) {
      for (const [c, R] of clotheTree(cloth, places.slice(i, i + 12), okM, rng, null)) { forms.push([c, c, R * 0.95, R * 0.95, 0.7]); heaps.push([c, R]); mounds++; info.fitted[lv]++; }
      await breathe();
    }
  }
  // SHOOTS standing over the crown's top: long young canes in light leaf from its upper masses (a ragged top)
  {
    const Sh = T.shoots, rs = o.stream('rose-tree-shoots'), sun = cloth.sun;
    let n = 0, wide = 0, high = 0;
    for (const [c, R] of heaps) {
      wide = Math.max(wide, Math.hypot(c[0] - tx, c[2] - tz) + R); high = Math.max(high, c[1] + R * T.mound.flat - g0);
      if (c[1] - g0 < Sh[0] || !rs.chance(Sh[1])) continue;
      for (let k = 0, nk = rs.int(1, 2); k < nk; k++) {
        const az = rs.range(0, TAU), l = rs.range(Sh[2][0], Sh[2][1]), a = [c[0] + Math.cos(az) * R * 0.45, c[1] + R * 0.45, c[2] + Math.sin(az) * R * 0.45];
        const b = [a[0] + Math.cos(az) * l * rs.range(0.1, 0.45), Math.min(a[1] + l, g0 + T.H + 1.5), a[2] + Math.sin(az) * l * rs.range(0.1, 0.45)];
        if (!ok(b, 0.8)) continue;
        const lit = sunAt(b), c0 = cloth.dim(mix3(cloth.lo, cloth.hi, 0.45), lit), c1 = cloth.dim(mix3(cloth.lo, cloth.hi, 0.95).map((v) => v * 1.15), lit), fa = rs.range(0, TAU);
        F.card(a, b, l * 0.55, l * 0.5, [Math.cos(fa), 0, Math.sin(fa)], TWIG_CELLS.shoot, c0, c1, 0.2, 0.42, 0.3, v3.norm([sun[0] * 0.6, 1, sun[2] * 0.6]));
        n++;
      }
    }
    info.shoots = n; info.wide = wide; info.high = high;
  }
  info.mounds = mounds; info.cloth = F.count();
  // the curtains: from the boughs' places 14.5 m and more over the grass, dealt round the crown
  const C = T.curtain, roots = [];
  for (const L of wood.limbs) for (let k = L.lv === 2 ? L.pts.length - 1 : 1; k < L.pts.length; k++) if (L.pts[k][1] - g0 >= C.from && Math.hypot(L.pts[k][0] - tx, L.pts[k][2] - tz) >= C.edge) roots.push([L, k]);
  rng.shuffle(roots);
  let hung = 0;
  for (let i = 0; i < roots.length && hung < C.most; i++) {
    const [L, k] = roots[i], p = L.pts[k], s0 = L.s0 + (GREY_TREE.sway[L.lv] - L.s0) * k / L.n, out = v3.norm([p[0] - wood.heart[0], 6, p[2] - wood.heart[2]]);
    const root = [p[0], p[1] - 0.3, p[2]], len = Math.min(rng.range(C.len[0], C.len[1]), root[1] - hAt(root[0], root[2]) - C.foot);
    if (cloth.curtain(root, s0, len, rng.range(C.wide[0], C.wide[1]), cloth.drift(root), out, hAt, C.foot, C.least, falls)) hung++;
    if (i % 16 === 15) await breathe();
  }
  info.curtains = hung; info.tree = F.count();
  // THE NEIGHBOUR: an old tree on the route's right hand in leaf and rose; it bears nothing lower than 12 m over the
  // grass nearer the line than 12 m (the walk and the straight line from the long arc to the ring stay open) nor over the alcove
  const Nb = T.neighbour, [nx, nz] = fr.at(Nb.at[0], Nb.at[1]);
  const okN = (p, m) => { const ap = fr.of(p[0], p[2]); return rule.ok(p, m) && !(ap[1] > Nb.near - m && p[1] - m < g0 + Nb.low) && !(ap[0] > T.alcove[0] - m && p[1] - m < g0 + T.alcove[2]); };
  const nwood = greyTree(F, { x: nx, z: nz, H: Nb.H, ok: okN, hAt, litAt: sunAt, twigs: false, extra: [{ f: 1, to: T.bridge.b, bow: 2.5, r: 0.62 }] }, o.stream('rose-neighbour-wood'));
  await breathe();
  const ncloth = makeRoseCloth({ F, rng: o.stream('rose-neighbour-cloth'), ok: okN, litAt: shadeOf(nwood.heart, 11), heart: nwood.heart, seed: rngN.range(0, 40), near, cloudy: Nb.cloudy, soft: true });
  await breathe(true);
  // (masses on Nb.share of its places, never fewer than Nb.masses[0] where it has so many and never more than
  // Nb.masses[1], on an even share of its limbs; six at a time, a breath between)
  const nall = clothePlaces(nwood.limbs), nplaces = evenShare(nall, Math.max(Math.min(nall.length, Nb.masses[0]), Math.min(Nb.masses[1], Math.round(Nb.share * nall.length))));
  info.nplaces = nall.length; info.nmounds = 0;
  for (let i = 0; i < nplaces.length; i += 6) {
    for (const [c, R] of clotheTree(ncloth, nplaces.slice(i, i + 6), okN, rngN, null)) { forms.push([c, c, R * 0.95, R * 0.95, 0.7]); info.nmounds++; }
    await breathe(true);
  }
  {   // its own curtains, shorter and fewer, from its boughs 14 m and more over the grass
    const rn = [], gn = hAt(nx, nz);
    for (const L of nwood.limbs) for (let k = L.lv === 2 ? L.pts.length - 1 : 2; k < L.pts.length; k++) if (L.pts[k][1] - gn >= Nb.from) rn.push([L, k]);
    rngN.shuffle(rn);
    let hung = 0;
    for (let i = 0; i < rn.length && hung < Nb.curtains; i++) {
      const [L, k] = rn[i], p = L.pts[k], s0 = L.s0 + (GREY_TREE.sway[L.lv] - L.s0) * k / L.n, out = v3.norm([p[0] - nwood.heart[0], 6, p[2] - nwood.heart[2]]);
      const root = [p[0], p[1] - 0.3, p[2]], len = Math.min(rngN.range(Nb.len[0], Nb.len[1]), root[1] - hAt(root[0], root[2]) - C.foot);
      if (ncloth.curtain(root, s0, len, rngN.range(1.5, 2.3), ncloth.drift(root), out, hAt, C.foot, 5, falls)) hung++;
      if (i % 12 === 11) await breathe();
    }
    info.ncurtains = hung;
  }
  await breathe();
  info.neighbour = F.count() - info.tree;
  // THE ONE GREAT BRIDGE: from the great tree's south-west bough across the last walk to the neighbour's top: a
  // swag of rose (G10b: a sheaf of thin canes held along both boughs, heaps of leaf and bloom where they knot, small
  // sprays seated on the canes between, hanging sprays). Every part of it within 8 m of the line stays
  // B.over (16.5 m) and more over the flown line at full swing (it is fitted to a floor B.flutter higher, which is its
  // cards' own flutter beyond their swing); beyond the great tree's crown it lies outside the lane's plan.
  const B = T.bridge, lensY = fr.y, nearest = (limbs, to) => {
    let best = null, bd = 1e9;
    for (const L of limbs) if (L.lv < 2) for (let k = 1; k < L.pts.length; k++) {
      const p = L.pts[k], d = Math.hypot(p[0] - to[0], p[1] - to[1], p[2] - to[2]) + (p[1] < to[1] - 3 ? 50 : 0);
      if (d < bd) { bd = d; best = p; }
    }
    return best;
  };
  const pa = nearest(wood.limbs, B.a), pb = nearest(nwood.limbs, B.b), mark = F.mark();
  const bcloth = makeRoseCloth({ F, rng: o.stream('rose-bridge-cloth'), ok, litAt: shadeOf(wood.heart, T.crown), heart: wood.heart, seed: dseed, near, soft: true });
  info.bridge = null;
  if (pa && pb) {
    const span = Math.hypot(pb[0] - pa[0], pb[1] - pa[1], pb[2] - pa[2]), swayAt = (q) => B.sway[0] + B.sway[1] * 4 * q * (1 - q);
    // ONE UNEVEN CURVE: steep from the great tree's bough to its low point, long and slow up to the neighbour's; bent in
    // plan to the south (away from the lane)
    const q0 = 1 / (1 + B.skew), sN = q0 * Math.pow(1 - q0, B.skew), sh = (q) => q * Math.pow(1 - q, B.skew) / sN, RA = (q) => B.thick[0] + B.thick[1] * sh(q);
    const bl = Math.hypot(pb[0] - pa[0], pb[2] - pa[2]), bx = -(pb[2] - pa[2]) / bl, bz = (pb[0] - pa[0]) / bl, bs = bz > 0 ? 1 : -1;
    const at = (q, sag) => { const w = bs * (B.bend[0] * Math.sin(Math.PI * q) + B.bend[1] * Math.sin(3 * Math.PI * q)); return [pa[0] + (pb[0] - pa[0]) * q + bx * w, pa[1] + (pb[1] - pa[1]) * q - sag * sh(q), pa[2] + (pb[2] - pa[2]) * q + bz * w]; };
    const floor = (p, m = 0) => (Math.abs(fr.of(p[0], p[2])[1]) < 8 + m ? lensY + B.over + B.flutter : -1e9);
    const fits = (sag) => { for (let i = 1; i < 16; i++) { const p = at(i / 16, sag), m = B.mound[1] * RA(i / 16) * 0.9 + swayAt(i / 16) * FLORA.swing; if (!ok(p, m) || p[1] - m < floor(p, 2.5)) return false; } return true; };
    let sag = B.sag * span;
    while (sag > 0.4 && !fits(sag)) sag -= 0.4;
    if (fits(sag)) {
      // (G10b) THE SHEAF: every cane begins a stretch back ALONG the great tree's bough and ends a stretch along the
      // neighbour's (its hold), and winds about the one curve between; the later canes stray wider from it
      const rngC = o.stream('rose-bridge-canes'), rngH = o.stream('rose-bridge-heaps'), backOf = (limbs, p) => { for (const L of limbs) { const k = L.pts.indexOf(p); if (k > 0) return L.pts[k - 1]; } return null; };
      const holdA = backOf(wood.limbs, pa), holdB = backOf(nwood.limbs, pb), lines = [];
      for (let c = 0; c < B.sheaf; c++) {
        const k = rngC.range(0.9, 1.06), o1 = rngC.range(0, TAU), o2 = rngC.range(0.25, 0.6) * (c < B.core ? 1 : 1.9), tw = rngC.range(1, 2.5) * TAU;
        const r = c === 0 ? B.caneMost : rngC.range(B.caneThin[0], B.caneThin[1]), pts = holdA ? [holdA] : [], n0 = pts.length;
        for (let i = 0; i <= 12; i++) { const q = i / 12, w = o2 * 4 * q * (1 - q), p = at(q, sag * k); pts.push([p[0] + Math.cos(o1 + tw * q) * w, p[1] + Math.sin(o1 + tw * q) * w * 0.6, p[2] + Math.sin(o1 + tw * q) * w]); }
        lines.push(pts.slice(n0));
        if (holdB) pts.push(holdB);
        F.tube(pts, 3, () => r, (p, n) => wood.bark(p, n, 0.2), (i) => swayAt(Math.max(0, Math.min(1, (i - n0) / 12))));
      }
      const nm = Math.round(span / B.step), heap = (c, R, sw) => {
        if (!ok(c, R * 1.1 + sw * FLORA.swing) || c[1] - R * 0.8 - sw * FLORA.swing < floor(c, R)) return false;
        const tint = bcloth.drift(c);
        bcloth.mound(c, R, tint, sw); bcloth.clothe(c, R, tint, sw, 6, (v) => ok(v, sw * FLORA.swing + 0.3) && v[1] - sw * FLORA.swing > floor(v));
        forms.push([c, c, R, R, 0.7]);
        return true;
      };
      // THE HEAPS (G11): the leaf lies in heaps where the canes knot, at every third station of the string, and the
      // canes show between them; where it hangs heaviest a heap that stands may bear a second on its shoulder
      for (let i = 1; i < nm; i += 3) {
        const q = (i + rngH.range(0.25, 0.75)) / nm, Rk = rngH.range(B.mound[0], B.mound[1]) * RA(q) * B.heap, sw = swayAt(q), c = at(q, sag);
        if (heap(c, Rk, sw) && sh(q) > 0.5 && rngH.chance(0.65)) { const az = rngH.range(0, TAU), up = rngH.range(0.5, 0.9), k2 = rngH.range(0.65, 0.85); heap([c[0] + Math.cos(az) * Rk * 0.7, c[1] + Rk * up, c[2] + Math.sin(az) * Rk * 0.7], Rk * k2, sw); }
        await breathe();
      }
      // (G10b) ON THE CANES between the heaps: small sprays of leaf and clouds of bloom, each seated at a point of a
      // cane (none floats), by the canes' own stream; each keeps the bridge's floor over the line at full swing
      for (let c = 0; c < Math.min(8, lines.length); c++) for (let i = 1; i < 12; i++) {
        if (!rngC.chance(B.on)) continue;
        const p = lines[c][i], sw = swayAt(i / 12), fine = (v) => ok(v, sw * FLORA.swing + 0.3) && v[1] - sw * FLORA.swing > floor(v), az = rngC.range(0, TAU), l = rngC.range(0.9, 1.7);
        if (rngC.chance(0.45)) { bcloth.cloud([p[0], p[1] + 0.25, p[2]], rngC.range(0.9, 1.5), bcloth.drift(p), [Math.cos(az) * 0.5, 0.8, Math.sin(az) * 0.5], sw, true, fine, true); continue; }
        const down = rngC.chance(0.6), tip = [p[0] + Math.cos(az) * l * 0.6, p[1] + l * (down ? -0.75 : 0.6), p[2] + Math.sin(az) * l * 0.6], face = [Math.cos(az + 1.4), 0.1, Math.sin(az + 1.4)], Sd = v3.norm(v3.cross(v3.add(tip, p, -1), face)), wd = l * 0.8;
        if (![v3.add(p, Sd, wd / 2), v3.add(p, Sd, -wd / 2), v3.add(tip, Sd, wd / 2), v3.add(tip, Sd, -wd / 2)].every(fine)) continue;
        const cc = bcloth.dim(mix3(bcloth.lo, bcloth.hi, rngC.range(0.3, 0.9)), sunAt(p));   // (G11: the light of its own place; it was asked with three numbers where this builder's sunAt takes a point, so these cards' colour was no number and they drew black)
        F.card(p, tip, wd, wd, face, down ? TWIG_CELLS.leaf : TWIG_CELLS.shoot, cc, cc.map((v) => v * 1.12), sw, Math.min(1, sw + 0.06), 0.4, [0, 1, 0]);
      }
      let sprays = 0, lowest = 1e9, swung = 1e9, a0 = 1e9, a1 = -1e9;
      for (let i = 0; i < B.sprays; i++) {
        const q = rngB.range(0.05, 0.95), p = at(q, sag), root = [p[0] + rngB.range(-0.5, 0.5), p[1] - 0.4, p[2] + rngB.range(-0.5, 0.5)], g = hAt(root[0], root[2]);
        // (the foot's floor: over the spray's own swing and the lowest truss's half height; its length a share of the most
        // its place lets it, so that no two feet hang level)
        const base = Math.max(floor(root, 1.5) - g, 16) + 0.75 + GREY_ROSE.flut / 0.3 * FLORA.flutter, sw = swayAt(q);
        const most = (root[1] - g - base - sw * FLORA.swing) / (1 + GREY_ROSE.sway * FLORA.swing);
        if (most < B.least) continue;   // (its place lets no spray of the least length hang: asked before its length is dealt)
        const len = Math.min(rngB.range(B.spray[0], B.spray[1]), most * rngB.range(Math.max(0.72, B.least / most), 1));
        const low = base + (sw + GREY_ROSE.sway * len) * FLORA.swing;
        if (bcloth.curtain(root, sw, len, rngB.range(1.3, 2.3), bcloth.drift(root), v3.norm([rngB.range(-1, 1), 3, rngB.range(-1, 1)]), hAt, low, B.least, falls)) sprays++;
      }
      F.each((x, y, z, reach) => {
        const ap = fr.of(x, z);
        if (Math.abs(ap[1]) > GREY.nearLine + reach) return;
        lowest = Math.min(lowest, y - lensY); swung = Math.min(swung, y - reach - lensY); a0 = Math.min(a0, ap[0]); a1 = Math.max(a1, ap[0]);
      }, mark);
      info.bridge = { span, sag, lowest, swung, from: fr.length + a0, to: fr.length + a1, sprays, a: pa, b: pb };
    }
  }
  info.triangles = F.count();
  const trees = [{ x: tx, z: tz, H: T.H, built: wood }, { x: nx, z: nz, H: Nb.H, built: nwood }];
  if (o.dry) return { info: { ...info, ...floraClearance(F, rule) }, trees, falls, forms };
  if (o.yieldNow) await o.yieldNow(7);
  const mesh = F.build('garden-rose-tree', o.material);
  return { object: mesh.object, geometry: mesh.geometry, info, trees, falls, forms };
}

// ---------------------------------------------------------------- the standard roses and the rose bushes (G6 piece 3)
// A STANDARD ROSE is a real small tree: a stout leaning stem that forks under its head, and a FULL ROUND HEAD of rose
// after the rose tree's cloth (leaf standing in its volume at every depth, bloom in clouds all round it, real trusses
// near the line; `q.bloom` of the full bloom where the season at its root is not so far). A BUSH (q.bush) is the same
// head sat on the grass. q = { x, z, H, R, tint (linear), bloom, seed, bush }; every card is tested at its corners by
// `test`; it hands back the forms that cast its shadow.
function roseStandard(F, cloth, rng, q, y0, lit, test) {
  const TAU = Math.PI * 2, R = q.R, sun = cloth.sun, forms = [];
  const hy = q.bush ? R * 0.5 : q.H - R * 0.95, lx = q.bush ? 0 : 0.55 * Math.sin(q.seed * 2.3), lz = q.bush ? 0 : 0.55 * Math.cos(q.seed * 1.7), c = [q.x + lx, y0 + hy, q.z + lz];
  if (!q.bush) {
    const top = hy - R * 0.45, pts = [0, 0.3, 0.62, 1].map((g) => [q.x + lx * g * g + 0.14 * Math.sin(g * 5 + q.seed) * g, y0 - 0.3 + (top + 0.3) * g, q.z + lz * g * g + 0.14 * Math.cos(g * 4 + q.seed) * g]);
    const bark = (p, n) => { const k = 0.85 + 0.15 * lit * Math.max(0, n[0] * sun[0] + n[1] * sun[1] + n[2] * sun[2]); return [0.23 * k, 0.21 * k, 0.16 * k]; };   // (G10c: a face turned from the sun keeps 0.85 of the stem's tone, where 0.5: the low key itself now shades it)
    F.tube(pts, 5, (i) => 0.22 - 0.03 * i, bark, (i) => 0.012 * i, false);
    for (let k = 0; k < 3; k++) {
      const a = q.seed + k * 2.1, e = [c[0] + Math.cos(a) * R * 0.5, c[1] + R * 0.15, c[2] + Math.sin(a) * R * 0.5], m = [(pts[3][0] + e[0]) / 2, (pts[3][1] + e[1]) / 2 - 0.1, (pts[3][2] + e[2]) / 2];
      F.tube([pts[3], m, e], 3, (i) => 0.1 - 0.025 * i, bark, (i) => 0.036 + 0.004 * i, false);
    }
    forms.push([pts[0], pts[3], 0.32, 0.24, 1]);
  }
  if (q.bush) {
    // A BUSH: a low dome of leaf (cards of the dense leaf cell standing from the grass, crossed), a long shoot or
    // two over it, trusses of real heads LEANING on its shoulders, a small cloud or two on its top
    const quad = (a, b, w, face) => { const Sd = v3.norm(v3.cross(v3.add(b, a, -1), face)); return [v3.add(a, Sd, w / 2), v3.add(a, Sd, -w / 2), v3.add(b, Sd, w / 2), v3.add(b, Sd, -w / 2)]; };
    const card = (a, b, w, face, cell, c0, c1, nrm) => { if (quad(a, b, w, face).every(test)) F.card(a, b, w, w * rng.range(0.85, 1.05), face, cell, c0, c1, 0.01, 0.05, 0.3, nrm); };
    const leafAt = (g, d, k) => cloth.dim(mix3(cloth.lo, cloth.hi, g + 0.25 * Math.max(0, d[0] * sun[0] + d[2] * sun[2])).map((v) => v * k), lit);
    for (let k = 0; k < 6; k++) {
      const az = q.seed + k * 1.047 + rng.range(-0.3, 0.3), d = [Math.cos(az), 0, Math.sin(az)], off = k < 3 ? 0.1 : 0.5, h = R * (k < 3 ? rng.range(1.5, 1.8) : rng.range(1.05, 1.4)), a = [q.x + d[0] * R * off, y0 - 0.06, q.z + d[2] * R * off];
      card(a, [a[0] + d[0] * R * 0.25, a[1] + h, a[2] + d[2] * R * 0.25], R * (k < 3 ? 2.5 : 2.1), d, TWIG_CELLS.mass, leafAt(0.1, d, 0.62), leafAt(0.5, d, 1.1), v3.norm([d[0] * 0.5, 0.85, d[2] * 0.5]));
    }
    for (let k = 0; k < 2; k++) { const az = rng.range(0, TAU), d = [Math.cos(az), 0, Math.sin(az)], a = [q.x + d[0] * R * 0.3, y0 + R * 0.9, q.z + d[2] * R * 0.3], cc = leafAt(0.75, d, 1.05); card(a, [a[0] + d[0] * R * 0.6, a[1] + R * rng.range(0.7, 1.0), a[2] + d[2] * R * 0.6], R * 0.8, d, TWIG_CELLS.shoot, cc, cc, [0, 1, 0]); }
    for (let k = 0, n = 6; k < n; k++) {
      const az = TAU * (k + rng.range(0.1, 0.9)) / n, d = [Math.cos(az), 0, Math.sin(az)], h = rng.range(0.85, 1.15), yc = y0 + R * rng.range(0.75, 1.25), pc = [q.x + d[0] * R * 0.78, yc, q.z + d[2] * R * 0.78];
      const ax = v3.norm([-d[0] * 0.55, 0.83, -d[2] * 0.55]), face = v3.norm([d[0] * 0.83, 0.55, d[2] * 0.83]), ta = v3.add(pc, ax, -h / 2), tb = v3.add(pc, ax, h / 2);
      if (!quad(ta, tb, h * 1.3, face).every(test)) continue;
      const tk = rng.range(0.9, 1.12), cc = cloth.dim(q.tint.map((v) => v * tk * 1.05), lit);
      F.card(ta, tb, h * 1.3, h * 1.3 * rng.range(0.85, 1.05), face, TWIG_CELLS.heads, cc.map((v) => v * 0.86), cc, 0.01, 0.05, 0.3, face);
    }
    for (let k = 0; k < 2; k++) cloth.cloud([q.x + rng.range(-0.4, 0.4) * R, y0 + R * 1.25, q.z + rng.range(-0.4, 0.4) * R], R * rng.range(0.9, 1.15), q.tint, [0, 1, 0], 0.03, true, test, true);
    forms.push([c, c, R * 0.95, R * 0.95, 0.5]);
    return forms;
  }
  cloth.mound(c, R, q.tint, 0.04); cloth.clothe(c, R, q.tint, 0.04, 7, test);
  // bloom all round it, down to its flanks (the cloth's own clouds lie on its upper and sunlit sides)
  for (let k = 0, n = Math.round(9 * q.bloom); k < n; k++) {
    const az = TAU * (k + rng.range(0, 0.9)) / n, e = rng.range(-0.45, 0.5), ce = Math.cos(e), d = [Math.cos(az) * ce, Math.sin(e), Math.sin(az) * ce];
    cloth.cloud([c[0] + d[0] * R * 0.95, c[1] + d[1] * R * 0.8, c[2] + d[2] * R * 0.95], R * rng.range(0.75, 1.05), q.tint, d, 0.04, k % 2 === 1, test, true);
  }
  forms.push([c, c, R * 0.95, R * 0.95, 0.68]);
  return forms;
}
// ---------------------------------------------------------------- the cascades (G6 piece 2)
// THE CASCADES on the far end's walls (x over CASCADE.fromX: the north wall, the whole east wall, the south wall but
// behind the alcove): the walls' roses lifted into HEAPS over the coping that pour down the face in GARLANDS 6 to 10 m
// long with brick between them, and SWAGS of bloom from heap to heap; one colour a unit by the drift at its place
// (cream, shell pink, deep pink: the one crimson is the great tree's). A stream of their own (the walls' own roses
// are not touched) and the rose tree's cloth; their shade goes into the walls' lattice before the layer is made. A
// mesh a wall, of the grey's one material. Typed figures: units `gap` apart; a heap of `masses` masses, the first
// `heap` in radius; `garlands` to a heap, `len` long and `wide`, hung `off` the brick, ending `low` over the grass,
// stirring `stir` of a free curtain's swing; a swag sags `swag`; on the south wall nothing within `alcove` metres
// of the route's last line
export const CASCADE = { fromX: 116, gap: [9, 15], heap: [2.5, 3.6], masses: [2, 3], cards: 6, garlands: [3, 5], len: [6, 10], wide: [1.7, 2.5], off: 0.8, low: 2.2, stir: 0.12, swag: [2, 3.4], swagStep: 1.7, swags: 0.7, alcove: 11 };
// the shade a thing d off a wall's brick leaves in the walls' lattice `sh` (the wall roses' own arithmetic)
function wallShadeBlob(sh, wi, w, s, y, d, rs, ry, k) {
  const C = sh.cell, lit = w.sun > 0.05, kS = lit ? Math.min(2.6, 1 / w.sun) : 0, cs = s - w.sunT * kS * d, cy = y + (lit ? -w.sunY * kS : -0.3) * d, base = wi * sh.rows * sh.ns;
  const i0 = Math.max(0, Math.floor((cs - rs) / C)), i1 = Math.min(Math.ceil(w.len / C) - 1, Math.ceil((cs + rs) / C)), j0 = Math.max(0, Math.floor((cy - ry - sh.y0) / C)), j1 = Math.min(sh.rows - 1, Math.ceil((cy + ry - sh.y0) / C));
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
    const a = (i * C - cs) / rs, b = (j * C + sh.y0 - cy) / ry, q = a * a + b * b;
    if (q < 1) { const v = k * (lit ? 1 : 0.7) * (1 - q * q), at = base + j * sh.ns + i; if (v > sh.K[at]) sh.K[at] = v; }
  }
}
// o = { sunAt, stream (each wall deals from its own: 'cascades-wall<wall>', its cloth from the stream 'cascades-cloth<wall>'),
//       heightAt, rule (the grey's), material (the grey's), shade (the wall roses' lattice), yieldNow, dry }
export async function buildCascades(o) {
  const C = CASCADE, G = PLAN.garden, { rule, heightAt } = o, faces = wallFaces(), A = alcoveFrame(), objects = [], geometries = [];
  const info = { units: 0, garlands: 0, swags: 0, triangles: 0, byWall: [], leastToLine: 99 };
  for (const wi of [1, 3, 2]) {
    const w = faces[wi], F = makeFloraBuf(), rng = o.stream('cascades-wall' + wi), breathe = breathAfter(o.yieldNow, F.count, 1500, 3.8), falls = [], flat = [w.n[0], 0, w.n[2]], out = v3.norm([w.n[0], 0.3, w.n[2]]);
    const P3 = (s, d, y) => { const q = w.at(s, d); return [q[0], y, q[1]]; }, sA = wi === 3 ? 3 : C.fromX - G.x0, sB = w.len - 3, sd = rng.range(0, 40);
    const cloth = makeRoseCloth({ F, rng: o.stream('cascades-cloth' + wi), ok: rule.ok, litAt: (p) => o.sunAt(p[0] + w.n[0] * 0.5, p[1], p[2] + w.n[2] * 0.5), seed: sd, near: (p) => rule.toLine(p[0], p[2])[0] < ROSE_TREE.flowers, soft: 'tone' });
    const shade = (s, y, d, rs, ry, k) => { if (o.shade) wallShadeBlob(o.shade, wi, w, s, y, d, rs, ry, k); };
    let prev = null;
    for (let s = sA + rng.range(1, 5); s < sB; s += rng.range(C.gap[0], C.gap[1])) {
      const q = w.at(s, 0.5), top = w.top(s);
      if (wi === 2 && Math.abs(A.of(q[0], q[1])[1]) < C.alcove) { prev = null; continue; }
      const tint = cloth.drift([q[0], top, q[1]]), R = rng.range(C.heap[0], C.heap[1]), nm = rng.int(C.masses[0], C.masses[1]);
      // the heap over the coping
      let lo = s, hi = s;
      for (let k = 0; k < nm; k++) {
        const r = R * (k === 0 ? 1 : rng.range(0.62, 0.85)), sk = s + (k === 0 ? 0 : (k === 1 ? -1 : 1) * R * rng.range(0.8, 1.15)), c = P3(sk, rng.range(0.25, 0.7), top + r * rng.range(0.15, 0.4));
        cloth.mound(c, r, tint, 0.02); cloth.clothe(c, r, tint, 0.02, C.cards, null);
        lo = Math.min(lo, sk - r * 0.7); hi = Math.max(hi, sk + r * 0.7);
      }
      shade((lo + hi) / 2, top - 1.3, 0.9, (hi - lo) / 2 + 0.5, 1.9, 0.62);
      // the garlands that pour from it down the face
      for (let k = 0, ng = rng.int(C.garlands[0], C.garlands[1]); k < ng; k++) {
        const sg = lo + (hi - lo) * (k + rng.range(0.2, 0.8)) / ng, wide = rng.range(C.wide[0], C.wide[1]), root = P3(sg, C.off + rng.range(-0.1, 0.25), top - rng.range(0, 0.7));
        const got = cloth.curtain(root, 0.02, rng.range(C.len[0], C.len[1]), wide, tint, out, heightAt, C.low, C.len[0] - 0.1, falls, C.stir, flat);
        if (got) { info.garlands++; shade(sg, root[1] - got / 2, C.off, wide / 2 + 0.35, got / 2 + 0.4, 0.55); }
      }
      // a swag of bloom from the last heap to this one
      if (prev && lo - prev.hi > 2 && rng.chance(C.swags)) {
        const span = lo - prev.hi + 1.6, sag = Math.min(rng.range(C.swag[0], C.swag[1]), span * 0.4), n = Math.max(3, Math.round(span / C.swagStep));
        for (let i = 0; i <= n; i++) {
          const fq = i / n, ss = prev.hi - 0.8 + span * fq, y = prev.top + (top - prev.top) * fq - 0.5 - sag * 4 * fq * (1 - fq), p = P3(ss, C.off * 0.9, y + rng.range(-0.25, 0.25));
          cloth.cloud(p, rng.range(1.5, 2.2), mix3(prev.tint, tint, fq), out, 0.03, i % 2 === 1, null);
          if (i % 2 === 0) cloth.tuft([p[0], p[1] - 0.7, p[2]], [0, -1, 0], out, rng.range(1.3, 1.9), null, 0.05, null);
          shade(ss, y, C.off, 1.1, 1.0, 0.4);
        }
        info.swags++;
      }
      prev = { hi, top, tint }; info.units++;
      await breathe();
    }
    await breathe(true);
    const tri = F.count();
    if (o.dry) info.leastToLine = Math.min(info.leastToLine, floraClearance(F, rule).leastToLine);
    info.triangles += tri; info.byWall.push(tri);
    if (!o.dry && tri) { const b = F.build('garden-cascades-' + wi, o.material); objects.push(b.object); geometries.push(b.geometry); }
    if (o.yieldNow) await o.yieldNow(0.2);
  }
  return { objects, geometries, info };
}
// ---------------------------------------------------------------- the last lawn, laid (G6 piece 3; places only)
// THE LAST LAWN (x over FAR_END.fromX; the season 0.9 to 1 at every root there: its kinds know no other window). Laid
// here: (1) BORDERS gone wild along the walls' feet in three bands (tall at the back: delphinium, then lilies and
// foxgloves, then poppies and columbines spilling on to the grass), each band broken into loose drifts of ONE kind
// with gaps; (2) three ISLAND BEDS off the walk (a heart of the tallest, a rim that spills); (3) STANDARD ROSES by the
// walk where it lies outside the sight lane (north of it on the left hand, south of it on the right; the dial's own
// stand on its right hand at its start) and LOW ROSE BUSHES under 2 m on both hands where the walk crosses the lane,
// unevenly, no row; (4) FALLEN PETALS, a wide ring under the great rose tree and a few under every standard and bush;
// (5) DAISIES in the grass by the line. No plant of (1) and (2) stands in the lane or within `toLine` of the line. A
// plant is a FINE form within `near` of the flown line and a POOL of its colour elsewhere (and at some fine sites
// too: `pool`). Every set is drawn at every distance (G9a: no fade, no cull by distance); the fine forms and the
// daisies are marked `far`: while the eye stands west of x 30 (FAR_CUT.end: the line's metres 0 to 151.4) each
// stands as its far stand-in (farStandIn), east of it as itself.
export const FAR_END = {
  fromX: 118, near: 30, full: 14, pool: 0.4, toLine: 7.6, wall: 1.3, thin: [36, 0.62, 1.2],   // (thin: past [0] m of the line a pool stands by the chance [1], [2] larger)
  // a kind: the scale dealt (its form stands at its own height), metres between plants, plants to a fine site
  kinds: [{ id: 'delph', s: [0.9, 1.08], sp: 1.45, n: 2 }, { id: 'lily', s: [0.92, 1.16], sp: 1.35, n: 1 }, { id: 'poppy', s: [0.72, 0.98], sp: 1.05, n: 2 }, { id: 'fox', s: [0.85, 1.15], sp: 1.4, n: 2 }, { id: 'col', s: [0.8, 1.15], sp: 1.1, n: 2 }],
  // an island bed: x, z, radius (typed: the gardener's beds, the same on every seed), the kinds of its heart, its
  // middle and its rim (which of them, and the turn of its drifts about the heart, are the seed's)
  beds: [[133, -12, 6.5, [0], [1, 3], [2, 4]], [124.2, 26.4, 4, [3], [2], [4, 2]], [160.5, 31.5, 3.8, [1], [1, 3], [4]]],
  // a border is GROUPS with green between: a group's length (a third of them half as long), the grass between two; in
  // a group the tall ones against the brick (back: metres from the wall's face [from, to], a blob's radius, the
  // kinds), by the chance [4] a second tall kind before a part of it (mid), by the chance [4] the low ones spilling
  // before a part of it (front): never one ribbon
  group: [6, 17], green: [3.5, 9], back: [1.5, 3.3, [1.6, 2.3], [0, 0, 1, 1, 3]], mid: [3.5, 5.4, [1.5, 2.1], [1, 0, 3], 0.5], front: [5.0, 7.8, [1.4, 2.1], [2, 2, 4], 0.62],
  // (G11: the south standards' span runs from `southFrom` m before the ring TO THE URNS' CLEAR GROUND: abeam of the
  // mouth's urns, less the ground an urn keeps (finale.urn) and the widest head)
  standards: { north: 3, south: 2, southFrom: -28, R: [1.45, 1.8], H: [5.6, 7], toLine: 8.7, apart: 6.5 }, bushes: { n: 9, R: [0.78, 0.92], off: [7, 10.5], a: [-52, -24] },
  ring: [7, 10, 15.5, 19], petals: 190, under: 5, daisy: [24, 2.3],
  // (G10b, the finale: so many more bushes from `a` metres before the ring, off the line; nothing within `urn` metres
  // of an urn's middle; the approach's two borders from `border` metres before the ring, their back and front bands
  // off the line, the kinds of each. G11: THE BUSHES' SPAN ENDS AT THE URNS' CLEAR GROUND (abeam of the urns, less
  // `urn` and the widest bush), THE BORDERS' ABEAM OF THE URNS)
  finale: { bushes: 8, a: -26, off: [6.6, 9.6], urn: 2.8, border: -28, backOff: [12.0, 13.6], frontOff: [9.6, 10.8], back: [0, 3, 1], front: [2, 4, 2] },
};
// o = { rng, rule, heightAt, grey, blossom, standards (the dial's), more (the finale's own stream), yieldNow }
export async function layFarEnd(o) {
  let rng = o.rng;
  const E = FAR_END, G = PLAN.garden, rule = o.rule, h = o.heightAt, A = alcoveFrame(), RT = PLAN.roseTree, NB = A.at(ROSE_TREE.neighbour.at[0], ROSE_TREE.neighbour.at[1]), TAU = Math.PI * 2, faces = wallFaces();
  const off = (list, x, z, d) => { for (const t of list) if (Math.hypot(t.x - x, t.z - z) < d) return false; return true; };
  // (3) the walk's standards (outside the lane: a head clear of the lane and 5 m and more off the line) and its bushes
  // (a place and a head's radius are dealt, the rules of place are asked, and only one that stands is dealt the rest)
  const stds = [], Sd = E.standards, bushes = [], Bq = E.bushes, aU = -PLAN.alcove.mouthToRing - FAR.urn.ahead;
  const tryStd = (a, p) => {
    const [x, z] = A.at(a, p), R = rng.range(Sd.R[0], Sd.R[1]);
    if (x < E.fromX + 0.5 || rule.toLane(x, z)[0] < 1.6 * R + 1 || rule.toLine(x, z)[0] < Sd.toLine || !off(stds, x, z, Sd.apart) || !off(o.blossom, x, z, 5) || !off(o.grey, x, z, 5) || !off(o.standards, x, z, 5) || Math.hypot(x - NB[0], z - NB[1]) < 6) return false;
    stds.push({ x, z, H: rng.range(Sd.H[0], Sd.H[1]), R, seed: rng.range(0, 100) }); return true;
  };
  for (let i = 0, k = 0; i < Sd.north && k < 60; k++) if (tryStd(-69 + 17 * (i + rng.range(0.1, 0.9)) / Sd.north, rng.range(8.8, 15))) i++;
  for (let i = 0, k = 0; i < Sd.south && k < 60; k++) if (tryStd(rng.range(Sd.southFrom, aU - E.finale.urn - Sd.R[1]), -rng.range(8.8, 15))) i++;
  for (let i = 0; i < Bq.n; i++) {
    const a = Bq.a[0] + (Bq.a[1] - Bq.a[0]) * (i + rng.range(0.1, 0.9)) / Bq.n, p = (i % 2 ? 1 : -1) * (rng.chance(0.25) ? -1 : 1) * rng.range(Bq.off[0], Bq.off[1]), [x, z] = A.at(a, p);
    if (off(stds, x, z, 4) && off(bushes, x, z, 3.5)) bushes.push({ x, z, R: rng.range(Bq.R[0], Bq.R[1]), seed: rng.range(0, 100), bush: true });
  }
  // (1), (2) the drifts: a few round blobs of ONE kind each, their edge broken by noise
  const drifts = [];
  const addDrift = (kind, blobs) => {
    if (!blobs.length) return;
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
    for (const [x, z, r] of blobs) { x0 = Math.min(x0, x - r * 1.4); x1 = Math.max(x1, x + r * 1.4); z0 = Math.min(z0, z - r * 1.4); z1 = Math.max(z1, z + r * 1.4); }
    drifts.push({ kind, blobs, box: [x0, x1, z0, z1], sx: rng.range(0, 60), sz: rng.range(0, 60) });
  };
  const groups = [];
  for (const wi of [1, 3, 2]) {
    const w = faces[wi], sA = wi === 3 ? 3 : E.fromX - G.x0, sB = w.len - 3;
    // a run of ONE kind from a to b along the wall, in the band B
    const run = (kind, a, b, B) => {
      const blobs = [];
      for (let t = a + B[2][0] * 0.6; t < b;) { const r = rng.range(B[2][0], B[2][1]), q = w.at(t, rng.range(B[0], B[1])); blobs.push([q[0], q[1], r]); t += r * rng.range(1.1, 1.6); }
      addDrift(kind, blobs);
      if (blobs.length) groups.push(drifts[drifts.length - 1].box);
    };
    for (let s = sA + rng.range(0, 5); s < sB - 3;) {
      const L = rng.range(E.group[0], E.group[1]) * (rng.chance(0.33) ? 0.5 : 1), e = Math.min(sB, s + L), back = rng.pick(E.back[3]);
      run(back, s, e, E.back);
      if (rng.chance(E.mid[4])) { const k2 = rng.pick(E.mid[3].filter((k) => k !== back)), l2 = (e - s) * rng.range(0.3, 0.6), a = s + (e - s - l2) * rng.range(0, 1); run(k2, a, a + l2, E.mid); }
      if (rng.chance(E.front[4])) { const l3 = (e - s) * rng.range(0.3, 0.7), a = s + (e - s - l3) * rng.range(0, 1); run(rng.pick(E.front[3]), a, a + l3, E.front); }
      s = e + rng.range(E.green[0], E.green[1]);
    }
  }
  for (const [bx, bz, R, heart, mid, rim] of E.beds) {
    const a0 = rng.range(0, TAU);
    addDrift(rng.pick(heart), [[bx, bz, R * 0.42]]);
    for (let i = 0; i < 3; i++) { const a = a0 + i * 2.094 + rng.range(-0.3, 0.3); addDrift(mid[i % mid.length], [[bx + Math.cos(a) * R * 0.5, bz + Math.sin(a) * R * 0.5, R * 0.36]]); }
    for (let i = 0; i < 5; i++) { const a = a0 + 0.6 + i * 1.257 + rng.range(-0.3, 0.3); addDrift(rim[i % rim.length], [[bx + Math.cos(a) * R * 0.86, bz + Math.sin(a) * R * 0.86, R * rng.range(0.26, 0.36)]]); }
  }
  // the plants: sites on a jittered lattice in each drift's box, kept by its ragged edge; fine by the line, else a pool
  const inOf = (D, x, z) => { let m = -9; for (const b of D.blobs) m = Math.max(m, 1 - Math.hypot(x - b[0], z - b[1]) / b[2]); return m + (vnoise(x * 0.33 + D.sx, z * 0.33 + D.sz) - 0.5) * 0.7 + (vnoise(x * 1.1 + D.sz, z * 1.1 + D.sx) - 0.5) * 0.25; };
  const hull = (x, z) => { const ap = A.of(x, z); return ap[0] > -16 && Math.abs(ap[1]) < 13.4; };
  const free = (x, z) => x > E.fromX && x < G.x1 - E.wall && z > G.z0 + E.wall && z < G.z1 - E.wall && !hull(x, z) && rule.toLane(x, z)[0] > 1.3 && rule.toLine(x, z)[0] > E.toLine
    && off(o.grey, x, z, 2.1) && off(o.blossom, x, z, 1.5) && off(o.standards, x, z, 1.1) && off(stds, x, z, 1.1) && Math.hypot(x - RT[0], z - RT[1]) > 3.2 && Math.hypot(x - NB[0], z - NB[1]) > 2.6;
  const sets = {}, set = (name, geo, kind, far) => sets[name] || (sets[name] = { name, geo, kind, far, points: [] });
  const put = (S, x, z, sc, d) => S.points.push({ x, y: h(x, z), z, s: sc, rot: rng.range(0, TAU), d, u: 0.5 });
  let turn = 0;
  for (const D of drifts) {
    const K = E.kinds[D.kind], [x0, x1, z0, z1] = D.box;
    for (let gx = x0; gx < x1; gx += K.sp) for (let gz = z0; gz < z1; gz += K.sp) {
      const x = gx + rng.range(0, K.sp), z = gz + rng.range(0, K.sp), m = inOf(D, x, z);
      if (m < -0.3 || !free(x, z) || !lot(rng, m > 0 ? sstep(0, 0.3, m) : 0.07)) continue;
      const d = rule.toLine(x, z)[0], fine = d < E.near && lot(rng, 1 - sstep(E.full, E.near, d));
      if (fine) {
        for (let i = 0; i < K.n; i++) { const a = rng.range(0, TAU), r = i ? rng.range(0.3, 0.55) * K.sp : 0; put(set('B-' + K.id, 'fine', D.kind, true), x + Math.cos(a) * r, z + Math.sin(a) * r, rng.range(K.s[0], K.s[1]), d); }
        if (!rng.chance(E.pool)) continue;
      }
      const far = d > E.thin[0];
      if (far && !rng.chance(E.thin[1])) continue;
      put(set('P-' + K.id, 'pool', D.kind, false), x, z, rng.range(K.s[0], K.s[1]) * (far ? E.thin[2] : 1), d);
    }
    if (o.yieldNow && ++turn % 30 === 0) await o.yieldNow(6);
  }
  // (4) the fallen petals: the wide ring under the great tree, and a few under every standard and bush
  const Rg = E.ring, ringAt = (r) => sstep(Rg[0], Rg[1], r) * sstep(Rg[3], Rg[2], r), pet = set('P-petal', 'petal', 0, false);
  for (let i = 0; i < E.petals; i++) {
    const a = rng.range(0, TAU), r = Math.sqrt(Rg[0] * Rg[0] + (Rg[3] * Rg[3] - Rg[0] * Rg[0]) * rng()), x = RT[0] + Math.cos(a) * r, z = RT[1] + Math.sin(a) * r;
    if (x < G.x1 - 1.5 && lot(rng, ringAt(r))) put(pet, x, z, rng.range(0.8, 1.5), rule.toLine(x, z)[0]);
  }
  for (const q of [...stds, ...bushes]) for (let i = 0; i < E.under; i++) { const a = rng.range(0, TAU), r = q.R * rng.range(0.4, 2.3); put(pet, q.x + Math.cos(a) * r, q.z + Math.sin(a) * r, rng.range(0.6, 1.1), 0); }
  // (5) the daisies: clumps in the grass within reach of the line, thick and thin by a noise of place
  for (let gx = E.fromX - 2; gx < G.x1 - 2; gx += E.daisy[1]) for (let gz = G.z0 + 2; gz < G.z1 - 2; gz += E.daisy[1]) {
    const x = gx + rng.range(0, E.daisy[1]), z = gz + rng.range(0, E.daisy[1]), d = rule.toLine(x, z)[0];
    if (d < E.daisy[0] && !hull(x, z) && lot(rng, 1.5 * sstep(0.35, 0.7, vnoise(x * 0.13 + 4, z * 0.13 - 9)) * (1 - 0.6 * sstep(12, E.daisy[0], d)))) put(set('B-daisy', 'daisy', 0, true), x, z, rng.range(0.8, 1.3), d);
  }
  // (G10b) THE FINALE, by a stream of its own (o.more): more of the garden's own
  // bloom about the way out, nothing new in kind. Low ROSE BUSHES on both hands of the last walk before the alcove's
  // mouth (by the walk's own rule: under 2 m, 5.3 m and more off the line), and a BORDER on either hand of the
  // approach up to the mouth's urns: a tall kind at its back, away from the line, a low kind spilling toward the
  // walk; drifts of one kind each, laid as the walls' borders are, in sets of their own (B2-, P2-: the fine forms
  // with their far stand-ins west of x 30, as every fine set here).
  if (o.more) {
    rng = o.more;
    const Fq = E.finale, first = drifts.length, nb0 = bushes.length, aB = aU - Fq.urn - Bq.R[1];
    const byUrn = (x, z) => { const ap = A.of(x, z); return Math.hypot(ap[0] - aU, Math.abs(ap[1]) - PLAN.alcove.half) < Fq.urn; };
    for (let i = 0; i < Fq.bushes; i++) {
      const a = Fq.a + (aB - Fq.a) * (i + rng.range(0.1, 0.9)) / Fq.bushes, p = (i % 2 ? 1 : -1) * rng.range(Fq.off[0], Fq.off[1]), [x, z] = A.at(a, p);
      if (off(stds, x, z, 4) && off(bushes, x, z, 3.2)) bushes.push({ x, z, R: rng.range(Bq.R[0], Bq.R[1]), seed: rng.range(0, 100), bush: true });
    }
    for (const side of [-1, 1]) {
      const back = [], front = [], kb = rng.pick(Fq.back), kf = rng.pick(Fq.front);
      for (let a = Fq.border + rng.range(0, 1.5); a < aU;) { const r = rng.range(1.5, 2.2), q = A.at(a, side * rng.range(Fq.backOff[0], Fq.backOff[1])); back.push([q[0], q[1], r]); a += r * rng.range(1.1, 1.5); }
      for (let a = Fq.border + rng.range(1, 3); a < aU;) { const r = rng.range(1.3, 1.9), q = A.at(a, side * rng.range(Fq.frontOff[0], Fq.frontOff[1])); front.push([q[0], q[1], r]); a += r * rng.range(1.2, 1.8); }
      addDrift(kb, back); addDrift(kf, front);
    }
    for (let k = first; k < drifts.length; k++) {
      const D = drifts[k], K = E.kinds[D.kind], [x0, x1, z0, z1] = D.box;
      for (let gx = x0; gx < x1; gx += K.sp) for (let gz = z0; gz < z1; gz += K.sp) {
        const x = gx + rng.range(0, K.sp), z = gz + rng.range(0, K.sp), m = inOf(D, x, z);
        if (m < -0.3 || !free(x, z) || byUrn(x, z) || !lot(rng, m > 0 ? sstep(0, 0.3, m) : 0.07)) continue;
        const d = rule.toLine(x, z)[0];
        for (let i = 0; i < K.n; i++) { const a = rng.range(0, TAU), r = i ? rng.range(0.3, 0.55) * K.sp : 0; put(set('B2-' + K.id, 'fine', D.kind, true), x + Math.cos(a) * r, z + Math.sin(a) * r, rng.range(K.s[0], K.s[1]), d); }
        if (rng.chance(E.pool)) put(set('P2-' + K.id, 'pool', D.kind, false), x, z, rng.range(K.s[0], K.s[1]), d);
      }
    }
    const pet2 = set('P2-petal', 'petal', 0, false);
    for (const q of bushes.slice(nb0)) for (let i = 0; i < E.under; i++) { const a = rng.range(0, TAU), r = q.R * rng.range(0.4, 2.3); put(pet2, q.x + Math.cos(a) * r, q.z + Math.sin(a) * r, rng.range(0.6, 1.1), 0); }
    if (o.yieldNow) await o.yieldNow(3);
  }
  // where the grass gives way: the beds, the borders, a little under the petals
  const clear = (x, z) => {
    if (x < E.fromX - 2) return 1;
    // (by the walls only where a group stands: the green between the groups is whole grass)
    const byWall = sstep(8.5, 6.5, Math.min(z - G.z0, G.z1 - z, G.x1 - x)) * sstep(E.fromX - 2, E.fromX + 2, x);
    let v = 1;
    if (byWall > 0) for (const b of groups) if (x > b[0] && x < b[1] && z > b[2] && z < b[3]) { v = 1 - 0.45 * byWall; break; }
    for (const b of E.beds) v = Math.min(v, 1 - 0.55 * sstep(b[2] * 1.05, b[2] * 0.7, Math.hypot(x - b[0], z - b[1])));
    return v * (1 - 0.3 * ringAt(Math.hypot(x - RT[0], z - RT[1])));
  };
  return { standards: stds, bushes, sets: Object.values(sets).filter((S) => S.points.length), drifts, clear };
}
// ---------------------------------------------------------------- the far end's roses (G6 piece 3)
// The walk's STANDARD ROSES and its low BUSHES in ONE mesh of the grey's material, by the standards' maker: one colour
// a plant (the drift's at its place or one dealt; none in crimson). A standard's every card keeps the
// grey's rule (out of the lane, 5 m and more off the line); a bush is the lane's floor: under 2 m, 5.3 m and more off
// the line. It hands back the forms that cast their shadows.
// o = { standards, bushes (of layFarEnd), rule, sunAt, rng, stream (for 'lastlawn-cloth'), heightAt, material, yieldNow, dry }
export async function buildFarRoses(o) {
  const { rule, heightAt, rng } = o, F = makeFloraBuf(), forms = [], litAt = (p) => o.sunAt(p[0], p[1], p[2]), info = { standards: o.standards.length, bushes: o.bushes.length, triangles: 0 };
  const cloth = makeRoseCloth({ F, rng: o.stream('lastlawn-cloth'), ok: () => true, litAt, seed: rng.range(0, 40), near: (p) => rule.toLine(p[0], p[2])[0] < ROSE_TREE.flowers, soft: 'tone' });
  let i = 0;
  for (const q of o.standards) {
    const y0 = heightAt(q.x, q.z), tint = rng.chance(0.4) ? cloth.drift([q.x, y0, q.z]) : rng.pick(cloth.tints);
    forms.push(...roseStandard(F, cloth, rng, { ...q, tint, bloom: 1 }, y0, litAt([q.x, y0 + q.H, q.z]), (v) => !!rule.ok(v, 0.3)));
    if (o.yieldNow && ++i % 2 === 0) await o.yieldNow(1);
  }
  if (o.dry) { const c = floraClearance(F, rule); info.stdToLane = c.leastToLane; info.stdToLine = c.leastToLine; }
  const m = F.mark ? F.count() : 0;
  for (const q of o.bushes) {
    const y0 = heightAt(q.x, q.z), tint = rng.chance(0.3) ? rng.pick(cloth.tints) : cloth.drift([q.x, y0, q.z]);
    forms.push(...roseStandard(F, cloth, rng, { ...q, tint, bloom: 1 }, y0, litAt([q.x, y0 + q.R, q.z]), (v) => v[1] < y0 + 1.95 && rule.toLine(v[0], v[2])[0] > 5.3));
    if (o.yieldNow && ++i % 3 === 0) await o.yieldNow(0.4);
  }
  info.triangles = F.count(); info.stdTriangles = m;
  if (o.dry) info.leastToLine = floraClearance(F, rule).leastToLine;
  const objects = [], geometries = [];
  if (!o.dry && info.triangles) { const b = F.build('garden-far-roses', o.material); objects.push(b.object); geometries.push(b.geometry); }
  return { objects, geometries, forms, info };
}
// ---------------------------------------------------------------- the border flowers' forms (G6 piece 3)
// About the origin, each at its own height, its colours its own (the lawns' gain). FINE, in FAR_END.kinds' order: a
// delphinium's two spires of florets (5 m), a sheaf of two white lilies with trumpets of six petals (3.5 m), a poppy
// with two bowls of four petals and a bud (2.5 m), a foxglove's bells down one side (3.5 m), a columbine's nodding
// stars (1.7 m). POOL: tapered standing cards of bloom heads in the kind's colour (deeper at the root) over a card of
// leaf: what a drift is far off. The daisy clump; the fallen petals, pale dabs lying on the grass.
export function farForms() {
  const g = LAWN.gain, lin = (hex, k = 1) => linRGB(hex).map((v) => v * g * k), up = [0, 1, 0], hh = (i, k) => vnoise(i * 5.17 + k * 2.9, k * 1.37 - i * 3.1), TAU = Math.PI * 2;
  const leafLo = lin('#2f5a2c'), leafHi = lin('#5f8f48'), stem = lin('#557f45'), O = [0, 0, 0];
  const pol = (o, a, r, y) => [o[0] + Math.cos(a) * r, o[1] + y, o[2] + Math.sin(a) * r], soft = (a, k = 0.5) => v3.norm([Math.cos(a) * k, 0.85, Math.sin(a) * k]);
  const stalk = (F, o, T, w, sw, fine) => { for (let k = 0; k < (fine ? 2 : 1); k++) { const a = k * 1.571 + 0.4; F.tri(pol(o, a, -w, 0), pol(o, a, w, 0), T, stem, stem, stem, 0, 0, sw, 0, up); } };
  const leaf = (F, p, a, r, rise, w, sw) => {
    const T = pol(p, a, r, rise), M = pol(p, a, r * 0.5, rise * 0.7), c = Math.cos(a + 1.571) * w, sn = Math.sin(a + 1.571) * w;
    F.tri(p, [M[0] - c, M[1], M[2] - sn], T, leafLo, leafLo, leafHi, sw * 0.4, sw * 0.7, sw, 0.15, up); F.tri(p, T, [M[0] + c, M[1], M[2] + sn], leafLo, leafHi, leafLo, sw * 0.4, sw, sw * 0.7, 0.15, up);
  };
  // a flower's own frame: its axis d, and a ring of radius r about the point c at the angle q
  const frame = (d) => { const side = v3.norm(v3.cross(d, Math.abs(d[1]) > 0.9 ? [0, 0, 1] : up)), fw = v3.cross(side, d); return (c, r, q, y = 0) => v3.add(v3.add(v3.add(c, side, Math.cos(q) * r), fw, Math.sin(q) * r), d, y); };
  const pool = (cTop, cRoot, n, y0, y1, w, tip, leafH, leafW, sw) => {
    const F = makeFloraBuf();
    for (let i = 0; i < n; i++) {
      const a = 0.4 + i * 1.3 + hh(i, 11), o = pol(O, a * 2.3 + i, n > 1 ? 0.28 + 0.25 * hh(i, 12) : 0, 0), k = 0.82 + 0.3 * hh(i, 13);
      F.card([o[0], y0 * k, o[2]], [o[0] + (hh(i, 14) - 0.5) * 0.3, y1 * k, o[2] + (hh(i, 15) - 0.5) * 0.3], w, tip, [Math.cos(a), 0, Math.sin(a)], TWIG_CELLS.heads, cRoot, cTop, sw * y0 / y1, sw, 0.2, v3.norm([Math.cos(a) * 0.3, 1, Math.sin(a) * 0.3]));
    }
    F.card([0, -0.05, 0], [0.1, leafH, -0.05], leafW * 0.8, leafW, [0.8, 0, 0.6], TWIG_CELLS.mass, leafLo, leafHi, 0, sw * 0.4, 0.15, v3.norm([0.3, 1, 0.2]));
    return F.geometry();
  };
  const out = { fine: [], pool: [], petal: null, daisy: null };
  { // DELPHINIUM
    const F = makeFloraBuf(), cA = lin('#3f58b0'), cB = lin('#2f4092'), cE = lin('#93a4e6'), H = 5;
    const spire = (o, H2, n, ph) => {
      stalk(F, o, [o[0], H2, o[2]], 0.07, 0.12 * H2 / H, true);
      for (let i = 0; i < n; i++) {
        const t = i / (n - 1), y = H2 * (0.42 + 0.58 * t), a = ph + i * 2.4, w = 0.2 * (1 - 0.6 * t), c = pol(o, a, 0.15 * (1 - 0.75 * t) + 0.03, y), tx = Math.cos(a + 1.571) * w, tz = Math.sin(a + 1.571) * w, sw = 0.12 * y / H, col = i % 3 === 1 ? cB : cA, nn = soft(a, 0.9);
        const L = [c[0] - tx, c[1], c[2] - tz], R = [c[0] + tx, c[1], c[2] + tz];
        F.tri(L, pol(c, a, w * 0.3, w * 0.8), R, col, cE, col, sw, sw, sw, 0.2, nn); F.tri(L, R, pol(c, a, -w * 0.1, -w * 0.7), col, col, cB, sw, sw, sw, 0.2, nn);
      }
    };
    spire(O, H, 20, 0.3); spire([0.34, 0, 0.2], H * 0.74, 9, 1.9);
    for (let i = 0; i < 5; i++) leaf(F, [0.1, 0.25 + 0.3 * hh(i, 1), 0.05], 0.5 + i * 1.257 + hh(i, 2), 0.8 + 0.3 * hh(i, 3), 0.7 + 0.6 * hh(i, 4), 0.3, 0.03);
    out.fine.push(F.geometry()); out.pool.push(pool(cA.map((v) => v * 1.1), cB, 4, 1.6, 5, 0.85, 0.25, 1.8, 1.9, 0.12));
  }
  { // WHITE LILIES
    const F = makeFloraBuf(), W = lin('#f7f5ee'), W2 = lin('#e6e3d2'), throat = lin('#c2d294'), gold = lin('#d8a23a');
    const trumpet = (B, a, tilt, L, sw) => {
      const d = v3.norm([Math.cos(a), tilt, Math.sin(a)]), ring = frame(d), C = v3.add(B, d, L * 0.45), E = v3.add(B, d, L), nn = v3.norm(v3.add(d, up, 0.7));
      for (let k = 0; k < 6; k++) { const q = k * 1.047 + 0.2; F.tri(ring(C, L * 0.13, q - 0.6), ring(C, L * 0.13, q + 0.6), ring(E, L * (k % 2 ? 0.52 : 0.62), q), W2, W2, W, sw, sw, sw, 0.25, nn); }
      for (let k = 0; k < 3; k++) { const q = k * 2.094; F.tri(B, ring(C, L * 0.13, q), ring(C, L * 0.13, q + 2.094), throat, W2, W2, sw, sw, sw, 0.1, v3.norm(v3.add(ring(C, 1, q + 1.047), C, -1))); }
      F.tri(ring(C, L * 0.04, 0), ring(C, L * 0.04, 2.6), v3.add(E, d, -L * 0.12), gold, gold, gold, sw, sw, sw, 0.2, up);
    };
    for (const [o, H, n, ph] of [[O, 3.5, 3, 0.4], [[0.32, 0, 0.22], 2.9, 2, 2.2]]) {
      const T = [o[0] + 0.05, H, o[2]];
      stalk(F, o, T, 0.06, 0.1, o === O);
      for (let i = 0; i < n; i++) trumpet([T[0], T[1] - 0.12 * i, T[2]], ph + i * TAU / n, 0.12 + 0.2 * hh(i, 21), 0.48, 0.1);
      for (let i = 0; i < 4; i++) { const y = H * (0.2 + 0.17 * i), a = ph + i * 2.4, p = [o[0], y, o[2]]; F.tri(pol(p, a + 1.571, 0.05, 0), pol(p, a + 1.571, -0.05, 0), pol(p, a, 0.45, 0.3), leafLo, leafLo, leafHi, 0.1 * y / H, 0.1 * y / H, 0.1 * y / H, 0.15, up); }
    }
    out.fine.push(F.geometry()); out.pool.push(pool(W, lin('#b4c69c'), 2, 2.0, 3.7, 1.5, 1.2, 2.4, 1.3, 0.1));
  }
  { // POPPIES
    const F = makeFloraBuf(), red = lin('#cf3a26'), hot = lin('#e8552f'), deep = lin('#701a14'), dark = lin('#1d1418');
    const bowl = (C, d, r) => {
      const ring = frame(d);
      for (let k = 0; k < 4; k++) {
        const q = 0.7 + k * 1.571, L = ring(C, r * 0.74, q - 0.85, r * 0.5), R = ring(C, r * 0.74, q + 0.85, r * 0.5), T = ring(C, r, q, r * 0.74), nn = v3.norm(v3.add(d, v3.add(T, C, -1), 1.2));
        F.tri(C, L, R, deep, red, red, 0.1, 0.1, 0.1, 0.3, nn); F.tri(L, T, R, red, hot, red, 0.1, 0.1, 0.1, 0.3, nn);
      }
      F.tri(ring(C, r * 0.2, 0, r * 0.2), ring(C, r * 0.2, 2.094, r * 0.2), ring(C, r * 0.2, 4.189, r * 0.2), dark, dark, dark, 0.1, 0.1, 0.1, 0, d);
    };
    const C1 = [0.1, 2.5, 0.05], C2 = [-0.42, 1.95, 0.3], Bd = [0.4, 1.7, -0.3];
    stalk(F, O, C1, 0.05, 0.1, true); bowl(C1, v3.norm([0.22, 1, 0.1]), 0.25);
    stalk(F, [0.04, 0, 0.04], C2, 0.04, 0.09, false); bowl(C2, v3.norm([-0.5, 0.8, 0.35]), 0.22);
    stalk(F, [0.05, 0, -0.03], [Bd[0], Bd[1] + 0.12, Bd[2]], 0.035, 0.08, false);
    F.tri([Bd[0] - 0.07, Bd[1] + 0.1, Bd[2]], [Bd[0] + 0.07, Bd[1] + 0.1, Bd[2]], [Bd[0] + 0.03, Bd[1] - 0.16, Bd[2] - 0.03], stem, stem, leafHi, 0.08, 0.08, 0.08, 0.1, up);
    for (let i = 0; i < 3; i++) leaf(F, [0, 0.1, 0], 1 + i * 2.1, 0.55, 0.45 + 0.2 * hh(i, 7), 0.16, 0.02);
    out.fine.push(F.geometry()); out.pool.push(pool(red, lin('#6f7f3e'), 2, 0.7, 2.2, 1.5, 1.3, 1.0, 1.4, 0.1));
  }
  { // FOXGLOVES
    const F = makeFloraBuf(), pink = lin('#b0508a'), pale = lin('#e3b0cd'), deep = lin('#8a3a6c'), H = 3.5, a0 = 0.9;
    stalk(F, O, [0.06, H, 0], 0.06, 0.09, true);
    for (let i = 0; i < 11; i++) {
      const t = i / 10, y = H * (0.45 + 0.52 * t), k = 1 - 0.62 * t, a = a0 + (hh(i, 31) - 0.5) * 1.1, A = [0.06 * y / H, y, 0], M = pol(A, a, 0.3 * k, -0.2 * k), sw = 0.09 * y / H;
      const L = pol(M, a + 1.571, 0.1 * k, 0), R = pol(M, a + 1.571, -0.1 * k, 0);
      F.tri(A, L, R, deep, pink, pink, sw, sw, sw, 0.2, soft(a, 0.9)); F.tri(L, R, pol(M, a, 0.09 * k, -0.1 * k), pink, pink, pale, sw, sw, sw, 0.2, soft(a, 0.9));
    }
    for (let i = 0; i < 4; i++) leaf(F, [0, 0.1, 0], 0.3 + i * 1.571 + hh(i, 33), 0.75, 0.35 + 0.3 * hh(i, 34), 0.24, 0.02);
    out.fine.push(F.geometry()); out.pool.push(pool(pink.map((v) => v * 1.12), deep, 2, 1.3, 3.5, 0.75, 0.22, 1.2, 1.5, 0.09));
  }
  { // COLUMBINES
    const F = makeFloraBuf(), vio = lin('#6f62b4'), cream = lin('#f0e6c8'), deep = lin('#4c4290');
    for (let i = 0; i < 5; i++) {
      const a = i * 1.257 + hh(i, 41), C = pol(O, a, 0.25 + 0.3 * hh(i, 42), 1.05 + 0.65 * hh(i, 43)), d = v3.norm([Math.cos(a) * 0.6, -0.5, Math.sin(a) * 0.6]), ring = frame(d), r = 0.17;
      if (i < 3) stalk(F, O, [C[0], C[1] + 0.1, C[2]], 0.035, 0.07, false);
      F.tri(ring(C, r, 0.5), ring(C, r, 2.6), ring(C, r, 4.7), vio, vio, deep, 0.07, 0.07, 0.07, 0.3, v3.norm(v3.add(up, d, 0.5))); F.tri(ring(C, r, 1.55), ring(C, r, 3.65), ring(C, r, 5.75), vio, deep, vio, 0.07, 0.07, 0.07, 0.3, v3.norm(v3.add(up, d, 0.5)));
      F.tri(ring(C, r * 0.45, 0, 0.05), ring(C, r * 0.45, 2.094, 0.05), ring(C, r * 0.45, 4.189, 0.05), cream, cream, cream, 0.07, 0.07, 0.07, 0.3, up);
    }
    for (let i = 0; i < 3; i++) leaf(F, [0, 0.05, 0], 0.6 + i * 2.094, 0.5, 0.4, 0.3, 0.02);
    out.fine.push(F.geometry()); out.pool.push(pool(vio.map((v) => v * 1.15), deep, 2, 0.6, 1.8, 1.3, 1.1, 0.8, 1.4, 0.07));
  }
  { // a DAISY clump: five flat white stars, each with a gold eye
    const F = makeFloraBuf(), W = lin('#f6f3e8'), eye = lin('#e3b63a');
    for (let i = 0; i < 5; i++) {
      const C = pol(O, i * 1.257 + hh(i, 51) * 0.8, i ? 0.3 + 0.35 * hh(i, 52) : 0, 0.42 + 0.2 * hh(i, 53)), ring = frame(v3.norm([(hh(i, 54) - 0.5) * 0.5, 1, (hh(i, 55) - 0.5) * 0.5])), r = 0.13;
      F.tri(ring(C, r, 0.3), ring(C, r, 2.39), ring(C, r, 4.49), W, W, W, 0.03, 0.03, 0.03, 0.2, up); F.tri(ring(C, r, 1.35), ring(C, r, 3.44), ring(C, r, 5.54), W, W, W, 0.03, 0.03, 0.03, 0.2, up);
      F.tri(ring(C, r * 0.36, 0, 0.012), ring(C, r * 0.36, 2.094, 0.012), ring(C, r * 0.36, 4.189, 0.012), eye, eye, eye, 0.03, 0.03, 0.03, 0.2, up);
    }
    out.daisy = F.geometry();
  }
  { // the FALLEN PETALS: a patch of pale dabs lying on the grass
    const F = makeFloraBuf(), pale = lin('#f8ead6', 1.2), pink = lin('#f6cfcf', 1.2), rose = lin('#eeb4bc', 1.15);
    F.card([-0.75, 0.13, 0.15], [0.25, 0.15, -0.1], 1.0, 1.0, up, TWIG_CELLS.heads, pale, pink, 0, 0, 0, up);
    F.card([0.3, 0.16, -0.75], [0.05, 0.17, 0.2], 0.9, 0.9, up, TWIG_CELLS.heads, pink, pale, 0, 0, 0, up);
    F.card([0.35, 0.12, 0.25], [1.0, 0.13, 0.75], 0.75, 0.75, up, TWIG_CELLS.heads, rose, pink, 0, 0, 0, up);
    out.petal = F.geometry();
  }
  return out;
}
// ---------------------------------------------------------------- the hero for the part viewer
// The set piece is the door wall with its doorway; the viewer's front is +Z, so the group is turned to show the
// wall's outer (west) face there. The world file does not use this: it lays the plan itself with the makers above.
export async function buildHero(ctx, opts = {}) {
  const walls = buildWalls();
  const group = new THREE.Group();
  walls.object.rotation.y = -Math.PI / 2;
  group.add(walls.object);
  if (ctx && ctx.yield) await ctx.yield();
  return {
    object: group, radius: 70, height: 14, center: new THREE.Vector3(0, 5, 0), anchors: {},
    update() {}, dispose() {}, ground: true, groundY: 0, opts,
  };
}
