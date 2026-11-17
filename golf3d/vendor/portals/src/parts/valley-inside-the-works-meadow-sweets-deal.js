// valley-inside-the-works, the meadow: WHERE THE SWEETS STAND (the deal). The meadow's tallest and brightest plants:
// candy canes in groves, great lollipops in drifts, toadstools in rings and clusters, gumdrops in handfuls.
// A sweet is a record: { kind (0 cane, 1 lollipop, 2 toadstool, 3 gumdrop), x, y, z (its foot on the ground), s (its
// form's unit in metres), sy (a gumdrop's height), L (its stick or stem in units), F (the frame it leans in), turn
// (about its own axis), speed (a lollipop's slow turn), A and B (its colours), foot (the radius it stands on), cover
// (the radius no meadow plant grows within), tall, solid (what it fills, as plumb drums [x, z, radius, y0, y1]:
// every rule of place below is kept by every drum), keep (its group's lot for the machine's detail) }.
import * as P from './valley-inside-the-works-plan.js';
import { dryHeight } from './valley-inside-the-works-meadow-ground.js';
import { routeAt, bare, sightGap, SIGHT } from './valley-inside-the-works-meadow-field.js';
import { SWALLOW, swallowCourse } from './valley-inside-the-works-meadow-life.js';
import { CANE, LOLLY, TOAD, GUM } from './valley-inside-the-works-meadow-sweets-forms.js';

const RAD = Math.PI / 180;
// THE COLOURS, in linear light. The white is a cream and no colour is brighter: full sun on white sugar would burn out.
const WHITE = [0.6, 0.58, 0.53], CREAM = [0.6, 0.53, 0.38];
const CANE_A = [[0.5, 0.012, 0.02], [0.02, 0.27, 0.05]];                                  // red; one cane in five green
const LOLLY_AB = [[[0.5, 0.012, 0.02], WHITE], [[0.56, 0.14, 0.2], CREAM], [[0.6, 0.16, 0.012], [0.6, 0.48, 0.05]], [[0.03, 0.3, 0.06], WHITE]];      // red and white, rose and cream, orange and lemon, green and white
const CAPS = [[0.48, 0.014, 0.018], [0.56, 0.15, 0.21], [0.4, 0.16, 0.035]];              // red, rose, caramel
const GUMS = [[0.42, 0.008, 0.04], [0.6, 0.17, 0.012], [0.58, 0.47, 0.04], [0.2, 0.46, 0.02]];      // ruby, orange, lemon, lime

// the frame of a thing that leans by `lean` toward the plan direction `dir`: where its own x, y and z point
function frame(dir, lean) {
  const dx = Math.cos(dir), dz = Math.sin(dir), c = Math.cos(lean), s = Math.sin(lean), k = 1 - c;
  return [[c + k * dz * dz, -s * dx, -k * dx * dz], [s * dx, c, s * dz], [-k * dx * dz, -s * dz, c + k * dx * dx]];
}
// a place of a sweet's form (in its units, its stick already at its length) out in the valley
export function sweetPoint(c, px, py, pz) {
  const ct = Math.cos(c.turn), st = Math.sin(c.turn), x = ct * px + st * pz, z = ct * pz - st * px, F = c.F, s = c.s;
  return [c.x + s * (F[0][0] * x + F[1][0] * py + F[2][0] * z), c.y + s * (F[0][1] * x + F[1][1] * py + F[2][1] * z), c.z + s * (F[0][2] * x + F[1][2] * py + F[2][2] * z)];
}
// a stick as drums: from its foot to `len` units up its own axis, in pieces of about 1.3 m (r: the stick's radius in
// metres; slope: the sine of its lean, by which a piece's plumb drum is broadened)
function stickDrums(c, len, r, slope = 0.14) {
  const n = Math.max(1, Math.ceil(len * c.s / 1.3)), h = 0.5 * len * c.s / n, out = [];
  for (let i = 0; i < n; i++) { const p = sweetPoint(c, 0, (i + 0.5) / n * len, 0); out.push([p[0], p[2], r + slope * h, p[1] - h, p[1] + h]); }
  return out;
}

// A CANDY CANE, 5 to 11 m tall and 0.45 to 0.8 m thick (the taller the thicker, loosely), leaning 3 to 8 degrees the
// way `out` and hooked over that way or to either side of it. d: its dice (it reads the first five).
// arch: { len, thick, lean }: one half of an arch instead, as long and thick as told, leaning that far (radians) the
// way `out` and hooked straight on.
export function makeCane(x, z, d, out, arch) {
  const H = arch ? arch.len : 5 + 6 * d[0], T = arch ? arch.thick : 0.45 + 0.35 * (0.6 * d[0] + 0.4 * d[1]), L = H / T - CANE.over, hook = arch ? out : out + (d[3] - 0.5) * 1.3;
  const lean = arch ? arch.lean : (3 + 5 * d[2]) * RAD;
  const c = { kind: 0, x, z, y: dryHeight(x, z) - 0.05, s: T, sy: T, L, F: frame(out, lean), turn: -hook, speed: 0, A: CANE_A[d[4] < 0.2 ? 1 : 0], B: WHITE, foot: 0.5 * T, cover: 0.5 * T + 0.3, tall: true };
  c.solid = stickDrums(c, L, 0.5 * T, Math.max(Math.sin(lean), 0.14));
  for (let j = 1; j <= 5; j++) {      // the crook: four places round the half circle, then its hanging end
    const f = Math.min(j, 4) * Math.PI / 4, p = j < 5 ? sweetPoint(c, CANE.bend * (1 - Math.cos(f)), L + CANE.bend * Math.sin(f), 0) : sweetPoint(c, 2 * CANE.bend, L - 0.5 * CANE.drop, 0);
    c.solid.push([p[0], p[2], 0.75 * T, p[1] - 0.8 * T, p[1] + 0.8 * T]);
  }
  return c;
}
// A GREAT LOLLIPOP: a disc 2.4 to 4.4 m across on a stick 4 to 9 m tall that leans up to 4 degrees any way; it turns
// slowly on its stick, either way, so the disc's drum is the whole round it sweeps. d: its eight dice.
export function makeLolly(x, z, d) {
  const R = 1.2 + d[0], stick = 4 + 5 * d[1], pair = LOLLY_AB[Math.min(3, Math.floor(d[4] * 4))];
  const c = { kind: 1, x, z, y: dryHeight(x, z), s: R, sy: R, L: stick / R, F: frame(6.2832 * d[3], 4 * d[2] * RAD), turn: 6.2832 * d[5], speed: (d[6] < 0.5 ? -1 : 1) * (0.05 + 0.07 * d[7]), A: pair[0], B: pair[1], foot: LOLLY.stick, cover: LOLLY.stick + 0.35, tall: true };
  const p = sweetPoint(c, 0, c.L + LOLLY.centre, 0);
  c.solid = stickDrums(c, c.L, LOLLY.stick); c.solid.push([p[0], p[2], R + 0.05, p[1] - R, p[1] + R]);
  return c;
}
// A TOADSTOOL, 1.5 to 4.5 m tall (no taller than `limit`), its cap 2 to 5 m across and the broader the taller; it
// leans up to 6 degrees any way. Nothing if the limit leaves it under 1.5 m. d: its six dice.
export function makeToad(x, z, d, limit = 1e9) {
  const H = Math.min(1.5 + 3 * Math.pow(d[0], 1.5), limit); if (H < 1.5) return null;
  const R = Math.min(Math.max(H * (0.42 + 0.3 * d[1]), 1), 2.5), stem = H - TOAD.cap * R;
  const c = { kind: 2, x, z, y: dryHeight(x, z), s: R, sy: R, L: stem / R, F: frame(6.2832 * d[3], 6 * d[2] * RAD), turn: 6.2832 * d[4], speed: 0, A: CAPS[Math.min(2, Math.floor(d[5] * 3))], B: CREAM, foot: TOAD.stem * R, cover: R, tall: false };
  const p = sweetPoint(c, 0, c.L, 0);
  c.solid = [[x, z, TOAD.stem * R + 0.1 * stem, c.y, c.y + stem], [p[0], p[2], R + 0.06 * R, p[1] - 0.12 * R, p[1] + (TOAD.cap + 0.1) * R]];
  c.stem = stem; c.H = H;
  return c;
}
// A GUMDROP, 0.6 to 1.4 m across and about as high as its radius and a little more. d: its four dice.
export function makeGum(x, z, d) {
  const r = 0.3 + 0.4 * d[0], h = r * (0.95 + 0.3 * d[1]), y = dryHeight(x, z);
  return { kind: 3, x, z, y, s: r, sy: h / GUM.top, L: 1, F: frame(0, 0), turn: 6.2832 * d[2], speed: 0, A: GUMS[Math.min(3, Math.floor(d[3] * 4))], B: WHITE, foot: r, cover: r + 0.45, tall: false, solid: [[x, z, r, y, y + h]] };
}

// THE RULES OF THE PLACE. sweetGaps(c, walls, sites, course) -> by how much the sweet c keeps each rule (metres to
// spare): it may stand if none is under nought (sweetFree).
// The plan's own: a tall one (cane, lollipop) keeps SWEETS.tallClear from the flown line in plan; a low one keeps
// SWEETS.lowClear, and whatever of it stands nearer the line than a tall one may keeps its top 3 m under the line;
// none in the river or within SWEETS.bank of its edge (by its foot); every drum keeps SWEETS.thing from a column
// (its shaft and base), the cream basin's rim, the boat's side and the seven pipes where they stand in the pool,
// and GREAT_PIPE.clear from the great pipe's axis; none on the terrace (nor within a metre of it).
// The meadow's own: BEHIND THE ENTRY nothing stands in the tube of 8.5 m about the straight the plan lays there; none
// on the scar's rock, nor within 1.7 m of the fall's notch; a metre from a field wall; outside a tree's crown (what
// is lower than 1.2 m: 1.7 m from its trunk); a tall one keeps the swallows' own keep from their course, and in the
// pipes' aisle it stands 2 m clear of every cross-beam and 5 m under the lowest pipe; nothing beyond 64 m from the
// hall's middle or more than 18 m behind the entry. THE GREAT PIPE'S SIGHT (the field file's wedge): no drum of a
// tall one stands over the wedge, nor any drum of a low one whose top is more than SIGHT.tall over its foot (a
// toadstool on the wedge or beside it is dealt no taller than 3.5 m).
const COLUMN = 0.9, TUBE = 8.5;      // a column's half breadth at its base; the tube behind the entry
export function sweetGaps(c, walls, sites, course) {
  const S = P.SWEETS, g = { line: 1e9, under: 1e9, entry: 1e9, thing: 1e9, pipe: 1e9, wall: 1e9, tree: 1e9, swallows: 1e9, beams: 1e9, edge: 1e9, sight: 1e9 };
  g.bank = bare(c.x, c.z) ? -1 : P.bankDistance(c.x, c.z) - c.foot - S.bank;
  if (c.z > -49 && c.z < -45.4) g.bank = Math.min(g.bank, Math.abs(c.x - P.riverX(c.z)) - 9.7 - c.foot);
  const low = (v, key) => { if (v < g[key]) g[key] = v; };
  for (const [x, z, r, y0, y1] of c.solid) {
    const d = P.routeDistanceXZ(x, z) - r, kz = P.columnZ(Math.round((200 - z) / 20));
    low(d - (c.tall ? S.tallClear : S.lowClear), 'line');
    if (!c.tall && d < S.tallClear) low(routeAt(z)[1] - 3 - y1, 'under');
    if (z + r > P.ENTRY.z) low(P.routeDistance(x, Math.min(Math.max(P.ENTRY.y, y0), y1), z) - r - TUBE, 'entry');
    for (const cx of P.COLUMN_X) if (P.columnStands(cx, kz)) low(Math.hypot(x - cx, z - kz) - r - COLUMN - S.thing, 'thing');
    low(Math.hypot(x - P.CREAM.x, z - P.CREAM.z) - r - P.CREAM.r - 0.6 - S.thing, 'thing');
    low(Math.hypot(Math.max(Math.abs(x - P.boatX()) - 0.5 * P.BOAT.beam, 0), Math.max(Math.abs(z - P.BOAT.z) - 0.5 * P.BOAT.length, 0)) - r - S.thing, 'thing');
    for (let i = 0; i < P.PIPES.count; i++) low(Math.hypot(x - P.pipeX(i), z - P.PIPES.riseZ) - r - 0.5 * P.PIPES.across - S.thing, 'thing');
    low(Math.hypot(x - P.GREAT_PIPE.x, z - P.GREAT_PIPE.z) - r - P.GREAT_PIPE.clear, 'pipe');
    low(Math.hypot(Math.max(P.TERRACE.x0 - x, x - P.TERRACE.x1, 0), Math.max(z - P.TERRACE.z0, 0)) - r - 1, 'edge');
    low(Math.max(z - r + 33.5, -45.4 - z - r), 'edge');
    low(Math.min(64 - Math.abs(x) - r, P.ENTRY.z + 18 - z - r), 'edge');
    low(walls.distance(x, z) - r - 1, 'wall');
    if (c.tall || y1 - c.y > SIGHT.tall) low(sightGap(x, z) - r, 'sight');
    for (const t of sites) low(Math.hypot(x - t.x, z - t.z) - r - (y1 > t.y + 1.2 ? t.crown + 0.6 : 1.7), 'tree');
    if (c.tall && z > SWALLOW.scarFoot) low(course(x, z) - r - SWALLOW.keep, 'swallows');
    if (c.tall && z < -12 && x + r > 13 && x - r < 32) low(Math.min(Math.abs(z - kz) - r - 2, P.PIPES.run - 5 - y1), 'beams');
  }
  return g;
}
export const sweetFree = (g) => Object.keys(g).every((k) => g[k] >= 0);

// THE DEAL: dealSweets(ctx, o, walls, sites) -> { list, cover(x, z), gap(x, z), tall, counts, least }.
// Each kind stands in groups, and each stretch of the valley deals its groups from a stream of its own. A group draws
// ALL its dice first (its lot for the machine's detail, its size, its place, every member's own) and is tested after:
// each member by the rules of the place and against every sweet that stands already (no two drums nearer than a
// hand, 0.15 m); a group left with fewer members than its kind's least is not planted. A stretch stops at its count:
// at full detail the valley carries at most 108 canes, 142 lollipops, 97 toadstools and 450 gumdrops (60, 90, 70 and
// 300 of them by the lower valley's count, the rest the upper valley's own), and a machine of less detail keeps the
// groups whose lot falls inside its share (0.8 or 0.6 of them).
// WHERE: thickest beside the flown line in the lower valley from the entry to the pool, each group as near the line
// as its kind may stand and from there out, most often near (a first grove and a first drift along the 45 m of
// flight after the entry's straight, as near the line as the great pipe's wedge lets a tall one stand); a stand of canes and lollipops on the scar's top either
// side of the fall; toadstools round the pool's shore; lighter drifts along the upper river's banks; toadstools in a
// ring round the head pool at the terrace's foot, with gumdrops among them.
export async function dealSweets(ctx, o, walls, sites) {
  const flown = swallowCourse(sites.filter((t) => t.z > SWALLOW.scarFoot)), pts = flown ? flown.pts : [];
  const course = (x, z) => {      // how far a place is from the swallows' course on this seed's trees, in plan
    let best = 1e9;
    for (let i = 0; i < pts.length; i++) {
      const A = pts[i], B = pts[(i + 1) % pts.length], ex = B[0] - A[0], ez = B[1] - A[1], t = Math.min(Math.max(((x - A[0]) * ex + (z - A[1]) * ez) / (ex * ex + ez * ez), 0), 1);
      best = Math.min(best, Math.hypot(x - A[0] - ex * t, z - A[1] - ez * t));
    }
    return best;
  };
  const all = [], grid = new Map(), key = (x, z) => (Math.floor(x / 8) + 64) * 1024 + Math.floor(z / 8) + 512;
  const around = (c) => { const out = []; for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) { const a = grid.get(key(c.x + 8 * i, c.z + 8 * j)); if (a) out.push(...a); } return out; };
  const clash = (a, b) => a.solid.some((p) => b.solid.some((q) => p[3] < q[4] + 0.15 && q[3] < p[4] + 0.15 && Math.hypot(p[0] - q[0], p[1] - q[1]) < p[2] + q[2] + 0.15));
  // one kind's groups in one stretch: `tries` candidate groups of `least` to `most` members, `per` dice to a member
  const deal = async (name, tries, quota, per, least, most, centre, member) => {
    const rng = o.rngFor('meadow-sweets-' + name); let count = 0;
    for (let t = 0; t < tries; t++) {
      await ctx.yield();
      const g = [], m = []; for (let i = 0; i < 8; i++) g.push(rng()); for (let i = 0; i < most * per; i++) m.push(rng());
      const n = Math.min(least + Math.floor(g[1] * (most - least + 1)), most, quota - count), at = centre(g), group = [];
      for (let i = 0; i < n; i++) {
        const c = member(at, i, n, m.slice(i * per, i * per + per), g); if (!c) continue;
        c.gaps = sweetGaps(c, walls, sites, course); c.keep = g[0];
        if (sweetFree(c.gaps) && !around(c).some((b) => clash(c, b)) && !group.some((b) => clash(c, b))) group.push(c);
      }
      if (group.length < least) continue;
      for (const c of group) { all.push(c); const k = key(c.x, c.z); if (!grid.has(k)) grid.set(k, []); grid.get(k).push(c); }
      count += group.length;
    }
  };
  const TAU = 6.2832, S = P.SWEETS, zE = P.ENTRY.z + 2, zP = -3;      // (the lower valley: from just behind the entry to where the pool begins)
  // a group's place BESIDE THE FLOWN LINE between two z: on one side of the line, as near it as the kind's clear air,
  // the river and its bank (and, for the tall kinds, the great pipe's wedge) leave room for the group's own half
  // breadth, and from there out by the dice, most often near
  const beside = (zA, zB, clear, room, out) => (g) => {
    const z = zA + (zB - zA) * g[2], side = g[3] < 0.5 ? -1 : 1, lx = routeAt(z)[0], shut = (x) => P.bankDistance(x, z) < S.bank + room || (clear >= S.tallClear && sightGap(x, z) < room);
    let lat = clear + room; while (lat < 45 && shut(lx + side * lat)) lat += 0.5;
    return { x: lx + side * (lat + out * g[4] * g[4]), z, dir: -Math.PI / 2 };
  };
  // ... ON A BANK OF THE RIVER between two z: off its edge by the plan's margin and the group's half breadth, and out by the dice
  const shore = (zA, zB, room, out) => (g) => {
    const z = zA + (zB - zA) * g[2], side = g[3] < 0.5 ? -1 : 1;
    return { x: P.riverX(z) + side * (P.riverHalfWidth(z) + S.bank + room + out * g[4] * g[4]), z, dir: -Math.PI / 2 };
  };
  // ... ON THE SCAR'S TOP, left or right of the fall
  const scarTop = (g) => ({ x: g[3] < 0.5 ? -12 - 20 * g[4] : 12 + 19 * g[4], z: -47.5 - 9 * g[2], dir: 0 });
  // THE GROUPS. A grove of canes: round a middle, each leaning out from it. A drift of lollipops: a loose row along the
  // valley (across it on the scar's top). Toadstools: a ring of 6 to 9 on a round of 3.2 to 6 m, or a cluster (one, and
  // the rest close about it); beside the line none taller than its top may stand, and on the great pipe's wedge none
  // taller than 3.5 m. Gumdrops: a handful, the more the wider.
  const grove = (at, i, n, d, g) => { const a = TAU * (g[5] + (i + 0.3 + 0.4 * d[5]) / n), r = 0.8 + 0.25 * n * (0.6 + 0.4 * d[6]); return makeCane(at.x + r * Math.cos(a), at.z + r * Math.sin(a), d, a); };
  const drift = (at, i, n, d, g) => { const a = at.dir + g[5] - 0.5, s = (i - 0.5 * (n - 1)) * 4.2, w = (d[8] - 0.5) * 4.4; return makeLolly(at.x + s * Math.cos(a) - w * Math.sin(a), at.z + s * Math.sin(a) + w * Math.cos(a), d); };
  const toad = (x, z, d) => makeToad(x, z, d, Math.min(P.routeDistanceXZ(x, z) < S.tallClear + 2.7 ? routeAt(z)[1] - 3.05 - dryHeight(x, z) : 1e9, sightGap(x, z) < 3 ? SIGHT.tall - 0.5 : 1e9));
  const ring = (at, i, n, d, g) => { const a = TAU * (g[5] + (i + 0.5 * d[6]) / n), r = 3.2 + 2.8 * g[6]; return toad(at.x + r * Math.cos(a), at.z + r * Math.sin(a), d); };
  const cluster = (at, i, n, d, g) => { const a = TAU * (g[5] + (i + 0.5 * d[6]) / n), r = i ? 1.6 + 2.2 * d[7] : 0; return toad(at.x + r * Math.cos(a), at.z + r * Math.sin(a), d); };
  const handful = (at, i, n, d, g) => { const a = TAU * d[4], r = (1 + 0.3 * n) * (0.8 + 0.4 * g[6]) * Math.sqrt(d[5]); return makeGum(at.x + r * Math.cos(a), at.z + r * Math.sin(a), d); };
  // THE FIRST OF ALL, so that every visitor meets sweets at once: one grove of canes and one drift of lollipops stand
  // somewhere along the first 45 m of the flight after the entry's straight (the plan's line from its second point
  // on: the whole stretch lies ahead of a visitor who comes in), where the seed puts them, on either side of the
  // line, as near it as a tall sweet may stand there (beside the great pipe's wedge). Each has tries enough to find its
  // place: counted on a hundred seeds, both stand on every one.
  const zIn = P.ROUTE[1][2], MEET = 45;
  await deal('canes-first', 40, 6, 7, 4, 6, beside(zIn, zIn - MEET, S.tallClear, 3.2, 1.5), grove);
  await deal('lollies-first', 120, 7, 9, 4, 7, beside(zIn, zIn - MEET, S.tallClear, 2.8, 1.5), drift);
  await deal('canes-low', 48, 28, 7, 3, 7, beside(zE, zP, S.tallClear, 3.2, 12), grove);
  await deal('lollies-low', 80, 45, 9, 4, 9, beside(zE, zP, S.tallClear, 2.8, 12), drift);
  await deal('canes-scar', 24, 14, 7, 3, 7, scarTop, grove);
  await deal('lollies-scar', 120, 20, 9, 4, 9, scarTop, drift);
  await deal('canes-upper', 40, 12, 7, 3, 7, shore(-64, -182, 3.2, 9), grove);
  await deal('lollies-upper', 70, 18, 9, 4, 9, shore(-64, -182, 2.8, 9), drift);
  await deal('toads-low-rings', 30, 14, 7, 6, 9, beside(zE, zP, S.lowClear, 6.5, 14), ring);
  await deal('toads-low', 40, 11, 8, 3, 5, beside(zE, zP, S.lowClear, 3.5, 14), cluster);
  await deal('toads-pool', 90, 22, 8, 1, 3, shore(-5, -33.4, 0.9, 3.5), cluster);
  await deal('toads-upper', 40, 8, 8, 3, 5, shore(-64, -182, 3.5, 7), cluster);
  await deal('toads-head', 160, 15, 8, 1, 1, shore(-186, -204.4, 0.8, 1.5), cluster);
  await deal('gums-low', 140, 170, 6, 3, 8, beside(zE, zP, S.lowClear, 2.6, 14), handful);
  await deal('gums-upper', 90, 100, 6, 3, 8, shore(-64, -182, 2.6, 9), handful);
  await deal('gums-head', 50, 30, 6, 3, 8, shore(-186, -204, 2.6, 4), handful);
  // what a stretch could not place of its count is made up beside the line in the lower valley, where they stand thickest
  const short = (kind, full) => full - all.filter((c) => c.kind === kind).length;
  await deal('canes-more', 30, short(0, 60), 7, 3, 7, beside(zE, zP, S.tallClear, 3.2, 16), grove);
  await deal('lollies-more', 60, short(1, 90), 9, 4, 9, beside(zE, zP, S.tallClear, 2.8, 16), drift);
  await deal('toads-more', 60, short(2, 70), 8, 3, 5, beside(zE, zP, S.lowClear, 3.5, 16), cluster);
  // THE UPPER VALLEY, AS RICH AS THE LOWER, each of its thirds with a subject of its own, all by the same rules of
  // the place. ARCHES over the upper river where it swings clear of the line: two tall canes, one from each bank, 2.2 m
  // apart along the river, each leaning 40 degrees over the liquid to pass the other above its middle. A GROVE of
  // great lollipops on both banks under the line. A GREAT RING of the largest toadstools, 7 to 9 m in the round.
  // And canes, toadstool clusters and gumdrops close in on both hands of the line, with groves and drifts beside the last leg
  // right up to the head wall.
  const archAt = (g) => { const z = -58 - 46 * g[2]; return { x: P.riverX(z), z, dir: 0 }; };
  const arch = (at, i, n, d) => {
    const side = i ? 1 : -1, z = at.z + side * 1.1, T = 0.8 + 0.15 * d[1];
    let reach = P.riverHalfWidth(z) + S.bank + 0.5 * T + 0.2; while (reach < 30 && P.bankDistance(P.riverX(z) + side * reach, z) < S.bank + 0.5 * T + 0.1) reach += 0.3;
    return makeCane(P.riverX(z) + side * reach, z, d, side > 0 ? Math.PI : 0, { len: (reach + 0.5) / Math.sin(0.7), thick: T, lean: 0.7 });
  };
  const great = (at, i, n, d, g) => { const a = TAU * (g[5] + i / n), r = 7 + 2 * g[6], big = d.slice(); big[0] = 0.8 + 0.2 * d[0]; return toad(at.x + r * Math.cos(a), at.z + r * Math.sin(a), big); };
  await deal('canes-arch', 30, 12, 7, 2, 2, archAt, arch);
  await deal('canes-high', 50, 24, 7, 3, 7, beside(-50, -196, S.tallClear, 3.2, 6), grove);
  await deal('lollies-grove', 120, 36, 9, 3, 5, beside(-100, -152, S.tallClear, 2.8, 5), drift);
  await deal('toads-great', 90, 11, 8, 8, 11, beside(-156, -194, S.lowClear, 9.5, 4), great);
  await deal('toads-high', 60, 16, 8, 3, 5, beside(-52, -150, S.lowClear, 3.5, 8), cluster);
  await deal('gums-high', 120, 150, 6, 3, 8, beside(-50, -224, S.lowClear, 2.6, 10), handful);
  await deal('canes-end', 40, 12, 7, 3, 6, beside(-196, -227, S.tallClear, 3.2, 3), grove);
  await deal('lollies-end', 80, 16, 9, 3, 5, beside(-188, -227, S.tallClear, 2.8, 3), drift);
  return finish(all, Math.min(Math.max(o.look.detail || 1, 0.6), 1));
}
// WHAT IS HANDED BACK: list, the sweets the machine's detail keeps; cover(x, z), how far a place is from the nearest
// sweet's cover (no meadow plant grows inside one); gap(x, z), how far it is from the nearest drum of any sweet,
// whatever its height (the insects keep off by it): both true up to 4.5 m, and no less beyond; tall, the
// canes and lollipops as { x, z, crown } (the swallows' count takes them with the trees); counts by kind; least, the
// least each rule is kept by (metres to spare).
function finish(all, share) {
  const list = all.filter((c) => c.keep < share), discs = new Map(), counts = [0, 0, 0, 0], least = {};
  const put = (x, z, r, which) => {
    for (let ix = Math.floor((x - r - 4.5) / 4); ix <= Math.floor((x + r + 4.5) / 4); ix++) for (let iz = Math.floor((z - r - 4.5) / 4); iz <= Math.floor((z + r + 4.5) / 4); iz++) {
      const k = (ix + 64) * 1024 + iz + 512; if (!discs.has(k)) discs.set(k, [[], []]);
      discs.get(k)[which].push(x, z, r);
    }
  };
  for (const c of list) {
    counts[c.kind]++; put(c.x, c.z, c.cover, 0); for (const s of c.solid) put(s[0], s[1], s[2], 1);
    for (const k of Object.keys(c.gaps)) least[k] = Math.min(least[k] === undefined ? 1e9 : least[k], c.gaps[k]);
  }
  const nearest = (which) => (x, z) => {
    const a = discs.get((Math.floor(x / 4) + 64) * 1024 + Math.floor(z / 4) + 512); let best = 1e9;
    if (a) for (let v = a[which], i = 0; i < v.length; i += 3) best = Math.min(best, Math.hypot(x - v[i], z - v[i + 1]) - v[i + 2]);
    return best;
  };
  const tall = list.filter((c) => c.tall).map((c) => ({ x: c.x, z: c.z, crown: Math.max(...c.solid.map((s) => Math.hypot(s[0] - c.x, s[1] - c.z) + s[2])) }));
  return { list, cover: nearest(0), gap: nearest(1), tall, counts, least };
}

