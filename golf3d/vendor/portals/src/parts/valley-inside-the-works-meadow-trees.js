// valley-inside-the-works, the meadow: THE TREES. Small trees in ones and threes: hawthorn in white blossom, hazel,
// silver birch with its white bark, crab apple in pink-white blossom. Each grows from its own stream of the seed: a
// crooked trunk, boughs, branches, and at the branch ends sprays of PULLED SUGAR leaves and clusters of CRYSTALLISED
// blossom.
// UNDER THE ROOF: no part of a tree (wood, spray or mass) stands higher than ROOM_TOP, 3 m under the roof's girders.
// A tree's height is dealt from the room at its own place: its kind's height, or what the mark leaves over its own
// ground if that is less, allowing for the wood to grow to 1.26 of the dealt height and the leaf to stand 3 m over
// the wood: a birch is 22 to 28 m on the lower valley's floor and some 11 to 18 m in the upper valley. And as it
// grows, a limb whose end would pass the mark is left out, and a spray or a mass is made smaller or left out. The
// highest top is handed back.
// THE GREAT PIPE'S SIGHT (the field file's wedge): no trunk stands within its crown of the wedge, and a limb that
// would come over the wedge is left out, a spray made smaller or left out, at whatever height.
// ONE HAWTHORN STANDS BY DESIGN on the first tongue of meadow, 14 m to the left of the flown line: a small one of
// 11.7 m, the largest whose crown stands clear of the wedge on the one hand and of the swallows' loop on the other.
// CLEAR AIR, by the plan's routeDistance: a bough is left out if its skin would come within 5.6 m of the flown line,
// a spray is made smaller or left out so that its own reach stays 5.4 m off (the flown curve leaves the plan's
// straight pieces by 0.4 m at most, so 5 m of true air stand), and the large masses that stand for an upper tree's
// sprays far off are counted as the sprays are; BEHIND THE ENTRY boughs and sprays keep 8.5 m and their reach from
// the straight the plan lays there. The least distance kept is handed back.
// Streams: 'meadow-trees' the seed's trees, 'meadow-trees-top' the scar's top, 'meadow-trees-upper' the upper
// valley's own, 'meadow-tree-' + a tree's number its growth, 'meadow-tree-forms' the sprays' forms.
import * as P from './valley-inside-the-works-plan.js';
import { makeForm } from './valley-inside-the-works-meadow-forms.js';
import { dryHeight } from './valley-inside-the-works-meadow-ground.js';
import { routeAt, smooth, sightGap } from './valley-inside-the-works-meadow-field.js';
import { SWALLOW, swallowLeast } from './valley-inside-the-works-meadow-life.js';

const TAU = Math.PI * 2;
// THE ROOM: the roof's lattice girders hang 4.08 m below the plan's roofValley (the shed's roof file), and a tree's
// top stays 3 m under them. What a tree's height is dealt by: wood, how high its wood is allowed to grow, in its
// dealt height; leaf, its leaf over the wood, in metres.
export const ROOM_TOP = P.SHED.roofValley - 4.08 - 3;
const ROOM = { wood: 1.26, leaf: 3 };
// from how far the eye an upper tree's real sprays are drawn in (to nothing at the second), its far masses taking over there
export const TREE_LOD = [52, 64];
export const SPECIES = {
  hawthorn: { H: [13, 19], crown: 0.36, bark: [0.2, 0.15, 0.11], crook: 0.34, lift: 0.1, spread: 1.0, boughs: 6, blossom: [0.5, 0.48, 0.42], bloom: 1.1, leaf: [1, 1, 1], trunk: 0.3, girth: 0.03 },
  crab: { H: [12, 15], crown: 0.42, bark: [0.21, 0.16, 0.13], crook: 0.26, lift: 0.14, spread: 1.15, boughs: 5, blossom: [0.53, 0.4, 0.41], bloom: 1.2, leaf: [0.9, 1, 0.9], trunk: 0.28, girth: 0.03 },
  hazel: { H: [9, 12], crown: 0.44, bark: [0.3, 0.25, 0.18], crook: 0.16, lift: 0.3, spread: 0.6, boughs: 7, blossom: null, bloom: 0, leaf: [0.85, 1.05, 0.7], trunk: 0.02, girth: 0.014 },
  birch: { H: [22, 28], crown: 0.2, bark: [0.66, 0.64, 0.58], crook: 0.1, lift: 0.34, spread: 0.75, boughs: 8, blossom: null, bloom: 0, leaf: [1.15, 1.1, 0.6], trunk: 0.42, girth: 0.016 },
};

// THE ONE BY DESIGN: a small hawthorn on the first tongue of meadow, 14 m to the left of the flown line
const FIRST = { x: -13.15, z: 113, H: 11.7 };
export function firstHawthorn() { return { x: FIRST.x, z: FIRST.z, crown: Math.max(FIRST.H * SPECIES.hawthorn.crown, 2.4) }; }

// WHERE THEY STAND. The one by design, then the seed's: tries are dealt whole (place, kind, size, company) before any test.
// walls: the field walls' deal (its distance from a place); rest: the build's own pause, taken between tries (it draws no dice).
export async function dealTrees(o, walls, rest = async () => {}) {
  const rng = o.rngFor('meadow-trees'), sites = [], want = Math.round(8.3 * (0.7 + 0.45 * (Math.min(Math.max(o.look.density, 0.7), 1.3) - 0.7)));
  // a trunk's own place: off the river and the long walls, off the flown line (its crown and 6.5 m, in plan), off the
  // great pipe's sight (its crown off the wedge), off the scar's rock, the pipes' aisle (and no crown that reaches over
  // the aisle's column row stands where a cross-beam of the pipes springs from it: at every row from z -20 up the
  // valley), the terrace, the cream spring, the hall's columns, the field walls, and the least loop of the swallows'
  // course (the life file)
  const least = swallowLeast();
  const free = (x, z, crown) => {
    if (P.bankDistance(x, z) < 4.5 + 0.3 * crown || Math.abs(x) > 73 || z > 198 || z < -196) return false;
    if (P.routeDistanceXZ(x, z) < crown + 6.5 || sightGap(x, z) < crown) return false;
    if (z < -30 && z > -50) return false;
    if (x > 14 && x < 36 && z < -12) return false;
    if (z < -12 && x + crown > 14 && x < 36 && Math.abs(z - P.columnZ(Math.round((200 - z) / 20))) < crown + 1.5) return false;
    if (x > P.TERRACE.x0 - 8 && z < P.TERRACE.z0 + 10) return false;
    if (Math.hypot(x - P.CREAM.x, z - P.CREAM.z) < 9) return false;
    for (const cx of P.COLUMN_X) { const k = Math.round((200 - z) / 20); if (Math.hypot(x - cx, z - P.columnZ(k)) < 4.5) return false; }
    return walls.distance(x, z) >= 3 && least(x, z) >= crown + SWALLOW.keep;
  };
  // a tree keeps 15 m from every tree that is not a small companion, 4.2 m from every tree
  const apart = (x, z, lone) => sites.every((s) => Math.hypot(x - s.x, z - s.z) >= (lone && !s.kin ? 15 : 4.2));
  // a kind's height by its dice (size 0 to 1, and a companion's scale)
  const tall = (kind, size, scale = 1) => (SPECIES[kind].H[0] + (SPECIES[kind].H[1] - SPECIES[kind].H[0]) * size) * scale;
  // a tree at its place: as tall as dealt, or as the room over its own ground lets it stand (ROOM) if that is less
  const add = (x, z, kind, dealt, kin, extra = {}) => {
    const y = dryHeight(x, z), H = Math.min(dealt, (ROOM_TOP - y - ROOM.leaf) / ROOM.wood);
    sites.push({ x, z, y, kind, H, crown: Math.max(H * SPECIES[kind].crown, 2.4), kin, i: sites.length, ...extra });
  };
  add(FIRST.x, FIRST.z, 'hawthorn', FIRST.H, false, { hero: true });
  const kinds = ['hawthorn', 'birch', 'hazel', 'crab', 'hawthorn', 'birch', 'hazel', 'hawthorn', 'crab'];
  for (let t = 0, made = 0; t < 400 && made < want; t++) {
    if (t % 8 === 7) await rest();
    const x = -73 + 146 * rng(), z = 196 - 392 * rng(), pick = Math.floor(rng() * kinds.length), size = rng(), company = rng(), a1 = rng() * TAU, a2 = rng() * TAU, d1 = 4.6 + 2 * rng(), d2 = 4.6 + 2 * rng(), s1 = rng(), s2 = rng();
    const kind = made < 2 ? ['crab', 'birch'][made] : kinds[pick], crown = SPECIES[kind].H[1] * SPECIES[kind].crown;
    if (!free(x, z, crown) || !apart(x, z, true)) continue;
    add(x, z, kind, tall(kind, size), false); made++;
    if (company < 0.45) {       // a group of three: two smaller neighbours, each held to the same tests of place as its leader
      for (const [a, d, s, k2] of [[a1, d1, s1, kind === 'birch' ? 'birch' : 'hazel'], [a2, d2, s2, kind === 'birch' ? 'birch' : 'hawthorn']]) {
        const cx = x + Math.cos(a) * d, cz = z + Math.sin(a) * d, cc = SPECIES[k2].H[1] * SPECIES[k2].crown * 0.72;
        if (free(cx, cz, cc) && apart(cx, cz, false)) add(cx, cz, k2, tall(k2, 0.5 * s, 0.72), true, { scale: 0.72 });
      }
    }
  }
  // a few small trees along the scar's top, off the fall and off the pipes, from a stream of their own
  const tr = o.rngFor('meadow-trees-top');
  for (let k = 0; k < 3; k++) {
    const side = tr(), along = tr(), size = tr(), pick = tr(), x = side < 0.6 ? -68 + 52 * along : 42 + 28 * along, z = -46.2 - 1.6 * size;
    if (apart(x, z, false)) add(x, z, pick < 0.6 ? 'hawthorn' : 'birch', tall(pick < 0.6 ? 'hawthorn' : 'birch', size, 0.46), true, { scale: 0.46 });
  }
  // THE UPPER VALLEY'S OWN, by one rule. The flown line is walked up the upper valley in even stretches of 30 m, and
  // in each a tree in blossom is tried on either hand from a stream of their own: hawthorn or crab apple, its place
  // along the stretch, how far it stands off the line (from its crown and 6.5 m out to 25 m) and its size all drawn,
  // a try's dice whole before its tests. The first of twelve tries that the trunk's own tests let stand is that
  // hand's tree (the river, the column rows, the pipes' aisle, the field walls and the terrace decide where; a hand
  // that finds no place in its stretch has no tree there). They are grown as finely as the hawthorn below.
  const ur = o.rngFor('meadow-trees-upper');
  for (let za = -50; za > -196; za -= 30) for (const side of [-1, 1]) {
    let done = false; await rest();
    for (let t = 0; t < 12; t++) {
      const fz = ur(), fl = ur(), size = ur(), pick = ur(), sc = ur();
      const kind = pick < 0.5 ? 'hawthorn' : 'crab', scale = 0.75 + 0.25 * sc, crown = SPECIES[kind].H[1] * SPECIES[kind].crown * scale;
      const z = za - 30 * fz, x = routeAt(z)[0] + side * (crown + 6.5 + (25 - crown - 6.5) * fl);
      if (done || !free(x, z, crown) || !apart(x, z, true)) continue;
      add(x, z, kind, tall(kind, 0.35 + 0.45 * size, scale), false, { near: true, scale }); done = true;
    }
  }
  return sites;
}

// the two sprays every crown is made of
export function leafSpray(THREE, rng, n = 7) {
  const F = makeForm(THREE), G0 = [0.05, 0.2, 0.03], G1 = [0.19, 0.4, 0.07], S = [2.2, 2, 0.9, 0];
  for (let k = 0; k < n; k++) {
    const a = k * 2.4 + rng(), el = (rng() - 0.35) * 1.1, l = 0.36 + 0.16 * rng(), w = 0.14, r0 = 0.14 * rng();
    const dx = Math.cos(a) * Math.cos(el), dy = Math.sin(el), dz = Math.sin(a) * Math.cos(el), sx = -Math.sin(a), sz = Math.cos(a);
    const p = [dx * r0, dy * r0, dz * r0], m = [p[0] + dx * l * 0.5, p[1] + dy * l * 0.5 + 0.03, p[2] + dz * l * 0.5], q = [p[0] + dx * l, p[1] + dy * l, p[2] + dz * l];
    F.tri(p, [m[0] + sx * w, m[1], m[2] + sz * w], [m[0] - sx * w, m[1], m[2] - sz * w], G0, G1, G1, S, [0.5, 0], [1, 0.5], [0, 0.5]);
    F.tri([m[0] + sx * w, m[1], m[2] + sz * w], q, [m[0] - sx * w, m[1], m[2] - sz * w], G1, G1, G1, S, [1, 0.5], [0.5, 1], [0, 0.5]);
  }
  return F.build();
}
export function blossomSpray(THREE, rng, n = 3) {
  const F = makeForm(THREE), W = [1, 1, 1], C = [0.9, 0.85, 0.45], S = [2, 1.4, 0.3, 0];      // (1.4: crystallised, its sheen held down so that a cluster keeps its form in a bar of light)
  for (let f = 0; f < n; f++) {
    const a = f * 2.1 + rng(), out = 0.16 * (f ? 1 : 0.2), cx = Math.cos(a) * out, cz = Math.sin(a) * out, cy = 0.05 * rng(), r = 0.15, tilt = 0.5 * (rng() - 0.5), a0 = rng() * TAU;
    for (let k = 0; k < 5; k++) {
      const b0 = a0 + k * TAU / 5, b1 = b0 + TAU / 5 * 0.82;
      F.tri([cx, cy + 0.03, cz], [cx + Math.cos(b0) * r, cy + tilt * Math.cos(b0) * r, cz + Math.sin(b0) * r], [cx + Math.cos(b1) * r, cy + tilt * Math.cos(b1) * r, cz + Math.sin(b1) * r], C, W, W, S);
    }
  }
  return F.build();
}
// what a spray is far off: a mass of leaf, or of blossom, as four large blades turned every way
export function sprayMass(THREE, rng, blossom) {
  const F = makeForm(THREE), c0 = blossom ? [0.8, 0.8, 0.74] : [0.05, 0.2, 0.03], c1 = blossom ? [1, 1, 1] : [0.19, 0.4, 0.07], S = blossom ? [2, 1.4, 0.3, 0] : [2.2, 2, 0.9, 0];
  for (let k = 0; k < 4; k++) {
    const a = k * 1.7 + rng() * 1.2, el = (rng() - 0.4) * 1.2, l = 0.75 + 0.45 * rng(), w = 0.42 + 0.2 * rng(), dx = Math.cos(a) * Math.cos(el), dy = Math.sin(el), dz = Math.sin(a) * Math.cos(el), sx = -Math.sin(a), sz = Math.cos(a);
    const p = [(rng() - 0.5) * 0.5, (rng() - 0.5) * 0.4, (rng() - 0.5) * 0.5];
    F.tri([p[0] - sx * w * 0.5, p[1] - 0.1, p[2] - sz * w * 0.5], [p[0] + sx * w * 0.5, p[1] + 0.1, p[2] + sz * w * 0.5], [p[0] + dx * l, p[1] + dy * l, p[2] + dz * l], c0, c0, c1, S, [0, 0], [1, 0], [0.5, 1]);
  }
  return F.build();
}

// GROW ONE TREE: wood into the shared wood mesh (wood = { pos, nor, col, aS, aT, uv }), spray places into the two lists
async function growTree(ctx, site, rng, woods, lists, stat) {
  const up = site.z < -45, wood = site.hero ? woods.first : up ? woods.up : woods.low;
  const leaves = site.hero ? lists.leavesHi : site.near ? lists.leavesUp : up ? lists.leavesFarUp : lists.leavesFarLow;
  const blossoms = site.hero ? lists.blossomsHi : site.near ? lists.blossomsUp : up ? lists.blossomsFarUp : lists.blossomsFarLow;
  const sp = SPECIES[site.kind], hero = !!(site.hero || site.near), H = site.H, R = site.crown, x0 = site.x, y0 = site.y - 0.2, z0 = site.z;
  const norm = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
  // how far a place stands outside the great pipe's wedge (asked only of a tree whose growth could come over it)
  const sight = sightGap(x0, z0) < 4 * R + 14, wedge = (x, z) => (sight ? sightGap(x, z) : 1e9);
  const tube = (p, q, r0, r1, sides, c0, c1) => {
    const d = norm([q[0] - p[0], q[1] - p[1], q[2] - p[2]]), up = Math.abs(d[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0];
    const u = norm([d[1] * up[2] - d[2] * up[1], d[2] * up[0] - d[0] * up[2], d[0] * up[1] - d[1] * up[0]]), v = [d[1] * u[2] - d[2] * u[1], d[2] * u[0] - d[0] * u[2], d[0] * u[1] - d[1] * u[0]];
    const ring = (c, r, k) => { const a = k * TAU / sides, cs = Math.cos(a), sn = Math.sin(a); return [[c[0] + (u[0] * cs + v[0] * sn) * r, c[1] + (u[1] * cs + v[1] * sn) * r, c[2] + (u[2] * cs + v[2] * sn) * r], [u[0] * cs + v[0] * sn, u[1] * cs + v[1] * sn, u[2] * cs + v[2] * sn]]; };
    for (let k = 0; k < sides; k++) {
      const [a, na] = ring(p, r0, k), [b, nb] = ring(p, r0, k + 1), [c, nc] = ring(q, r1, k + 1), [e, ne] = ring(q, r1, k);
      for (const [pt, n, cc] of [[a, na, c0], [b, nb, c0], [c, nc, c1], [a, na, c0], [c, nc, c1], [e, ne, c1]]) {
        wood.pos.push(pt[0], pt[1], pt[2]); wood.nor.push(n[0], n[1], n[2]); wood.col.push(cc[0], cc[1], cc[2]); wood.aS.push(0.05, 0, 0, 0); wood.aT.push(x0, pt[1] - y0, z0); wood.uv.push(0, 0);
      }
    }
  };
  const spray = (p, dir, n) => {
    for (let k = 0; k < n; k++) {
      const jx = rng() - 0.5, jy = rng() - 0.5, jz = rng() - 0.5, yaw = rng() * TAU, size = rng(), kindD = rng(), tn = rng();
      const rr = (hero ? 1.7 : 2.8) * (site.scale || 1), q = [p[0] + jx * rr + dir[0] * 0.4, p[1] + jy * rr * 0.7 + 0.2, p[2] + jz * rr + dir[2] * 0.4];
      const d = P.routeDistance(q[0], q[1], q[2]), bl = sp.blossom && kindD < 0.52 * sp.bloom;
      const s0 = (hero ? 1.05 : 1.5) * (0.8 + 0.5 * size) * (site.near ? 0.4 + 0.6 * (site.scale || 1) : site.scale ? 0.7 : 1) * (bl ? 1.1 : 1);
      // the room about its place: to the flown line's clear air, to the roof's mark, to the wedge. A spray's own
      // reach from its place is 0.7 of its size (a leaf spray), 0.35 (a blossom cluster) or 1.65 (a mass)
      const lineRoom = d - (q[2] > P.ENTRY.z ? 8.5 : 5.4), roofRoom = ROOM_TOP - q[1], air = Math.min(lineRoom, roofRoom, wedge(q[0], q[2]));
      const R1 = hero ? (bl ? 0.35 : 0.7) : 1.65, room = air / R1;
      if (room < 0.5 * s0) { stat[air === lineRoom ? 'left' : air === roofRoom ? 'roof' : 'sight']++; continue; }
      const ss = Math.min(s0, room), s = bl ? ss / 1.1 : ss;
      if (d - R1 * ss < stat.minClear) stat.minClear = d - R1 * ss;
      if (q[1] + R1 * ss > stat.top) stat.top = q[1] + R1 * ss;
      // a cluster's place in its crown gives the blossom its form: warm off-white on the side the plan's light comes from and
      // on the crown's outside, pink-grey on the far side and in the depths (never white: the brightest is a cream)
      const vx = (q[0] - x0) / R, vy = (q[1] - y0 - 0.62 * H) / (0.4 * H), vz = (q[2] - z0) / R, vl = Math.hypot(vx, vy, vz) || 1;
      const lit = (vx * P.LIGHT_DIR[0] + vy * P.LIGHT_DIR[1] + vz * P.LIGHT_DIR[2]) / vl, sh = (0.5 + 0.5 * smooth(-0.55, 0.6, lit)) * (0.66 + 0.34 * smooth(0.3, 0.95, vl)), bk = (0.92 + 0.16 * tn) * sh;
      const c = bl ? [sp.blossom[0] * bk, sp.blossom[1] * bk * (0.84 + 0.16 * sh), sp.blossom[2] * bk * (0.93 + 0.07 * sh)] : [sp.leaf[0] * (0.85 + 0.3 * tn), sp.leaf[1] * (0.9 + 0.2 * tn), sp.leaf[2]];
      (bl ? blossoms : leaves).push(q[0], q[1], q[2], yaw, ss, ss, ss, c[0], c[1], c[2]);
      // a tree of the upper valley's own is a few large masses far off (they give way to the sprays near the eye):
      // each is counted as a spray is, by its own reach (1.65 of its size), and made smaller or left out for it
      if (site.near && (tn * 7.31) % 1 < 0.34) {
        const m = Math.min(2.5 * s, air / 1.65);
        if (m < 1.25 * s) stat[air === lineRoom ? 'left' : air === roofRoom ? 'roof' : 'sight']++;
        else {
          (bl ? lists.blossomsUpFar : lists.leavesUpFar).push(q[0], q[1], q[2], yaw, m, m, m, c[0], c[1], c[2]);
          stat.minClear = Math.min(stat.minClear, d - 1.65 * m); stat.top = Math.max(stat.top, q[1] + 1.65 * m);
        }
      }
    }
  };
  const bark = (t) => { const k = 0.85 + 0.3 * rng(); if (site.kind === 'birch' && rng() < 0.22) return [0.12, 0.11, 0.1]; return [sp.bark[0] * k, sp.bark[1] * k, sp.bark[2] * k]; };
  // a limb: bends as it goes, tapers, throws children; the last order carries the sprays
  const limb = async (p, dir, len, r, depth, maxDepth) => {
    const n = depth === 0 ? (hero ? 6 : 3) : hero ? 3 : depth === 1 ? 2 : 1, sides = depth === 0 ? (hero ? 7 : 4) : depth === 1 && hero ? 4 : 3;
    let c0 = bark(0);
    for (let i = 0; i < n; i++) {
      const jx = rng() - 0.5, jy = rng() - 0.5, jz = rng() - 0.5, kids = rng(), ka = rng() * TAU, kb = rng(), kl = rng();
      dir = norm([dir[0] + jx * sp.crook * 2, dir[1] + jy * sp.crook + sp.lift * (depth ? 0.5 : 0.25), dir[2] + jz * sp.crook * 2]);
      const q = [p[0] + dir[0] * len / n, p[1] + dir[1] * len / n, p[2] + dir[2] * len / n], r1 = r * (depth === maxDepth ? 0.6 : 0.82), c1 = bark(1);
      const dq = P.routeDistance(q[0], q[1], q[2]) - r;
      if (dq < (q[2] > P.ENTRY.z ? 8.5 : 5.6)) { stat.left++; return; }
      if (q[1] + r > ROOM_TOP) { stat.roof++; return; }
      // (the wedge is asked of the limb's end and of its middle: a piece is 6 m long at most)
      if (Math.min(wedge(q[0], q[2]), wedge(0.5 * (p[0] + q[0]), 0.5 * (p[2] + q[2]))) < r + 0.15) { stat.sight++; return; }
      if (dq < stat.minClear) stat.minClear = dq;
      if (q[1] + r > stat.top) stat.top = q[1] + r;
      tube(p, q, r, r1, sides, c0, c1); c0 = c1;
      const t = (i + 1) / n;
      if (depth < maxDepth && (depth > 0 || t > sp.trunk) && (depth === 0 || kids < 0.85)) {
        const count = depth === 0 ? Math.max(1, Math.round(sp.boughs / (n * (1 - sp.trunk)))) : 1;
        for (let k = 0; k < count; k++) {
          const a = ka + k * 2.4, el = 0.25 + 0.55 * kb, side = norm([Math.cos(a), 0, Math.sin(a)]);
          const cd = norm([dir[0] * (1 - sp.spread * 0.6) + side[0] * sp.spread, dir[1] * (1 - sp.spread * 0.6) + el, dir[2] * (1 - sp.spread * 0.6) + side[2] * sp.spread]);
          await limb(q, cd, len * (depth === 0 ? 0.52 + 0.2 * kl : 0.6), r1 * (depth === 0 ? 0.55 : 0.6), depth + 1, maxDepth);
        }
      }
      if (depth === maxDepth || (depth === maxDepth - 1 && t > 0.5)) spray(q, dir, site.near ? 5 : hero ? 7 : depth === maxDepth ? 9 : 6);
      if (depth === 0) await ctx.yield();
      p = q; r = r1;
    }
  };
  const maxDepth = hero ? 3 : 2, stems = site.kind === 'hazel' ? 5 : 1;
  for (let s = 0; s < stems; s++) {
    const a = s * TAU / stems + rng(), lean = stems > 1 ? 0.45 : 0.05 * (rng() - 0.5);
    await limb([x0 + (stems > 1 ? Math.cos(a) * 0.5 : 0), y0, z0 + (stems > 1 ? Math.sin(a) * 0.5 : 0)], norm([Math.cos(a) * lean, 1, Math.sin(a) * lean]), H * (stems > 1 ? 0.6 : 0.62), H * sp.girth * (stems > 1 ? 1 : 1), 0, maxDepth);
  }
}

// ALL THE TREES. The wood is three meshes (the first hawthorn's, the lower valley's, the upper valley's); the sprays
// are instanced:
//   the hawthorn of the first tongue in real sprays;
//   every other tree of the seed's as masses, the lower valley's and the upper valley's apart;
//   the upper valley's own trees in real sprays near the eye (material mode 1) and as masses far off (mode 4).
// show(z) draws what stands for a place z of the flown line's own point and says what it costs: [triangles, draw calls].
export async function buildTrees(ctx, o, sites, mats, meshesFrom) {
  const THREE = o.THREE, group = new THREE.Group(), blank = () => ({ pos: [], nor: [], col: [], aS: [], aT: [], uv: [] }), woods = { low: blank(), up: blank(), first: blank() };
  const lists = { leavesHi: [], blossomsHi: [], leavesFarLow: [], blossomsFarLow: [], leavesFarUp: [], blossomsFarUp: [], leavesUp: [], blossomsUp: [], leavesUpFar: [], blossomsUpFar: [] }, stat = { minClear: 1e9, left: 0, roof: 0, sight: 0, top: -1e9 };
  group.name = 'valley-trees';
  for (const site of sites) { await growTree(ctx, site, o.rngFor('meadow-tree-' + site.i), woods, lists, stat); await ctx.yield(); }
  const owned = [], woodMesh = (w, name) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(w.pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(w.nor, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(w.col, 3)); g.setAttribute('aS', new THREE.Float32BufferAttribute(w.aS, 4));
    g.setAttribute('aT', new THREE.Float32BufferAttribute(w.aT, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(w.uv, 2));
    g.computeBoundingSphere(); owned.push(g);
    const m = new THREE.Mesh(g, mats.wood); m.name = name; m.userData.triangles = w.pos.length / 9; group.add(m); return m;
  };
  const woodLow = woodMesh(woods.low, 'tree-wood'); await ctx.yield();
  const woodUp = woodMesh(woods.up, 'tree-wood-up'); await ctx.yield();
  const woodFirst = woodMesh(woods.first, 'tree-wood-first'); await ctx.yield();
  const fr = o.rngFor('meadow-tree-forms'), forms = [leafSpray(THREE, fr, 5), blossomSpray(THREE, fr, 2), sprayMass(THREE, fr, false), sprayMass(THREE, fr, true)];
  owned.push(...forms);
  const mk = (list, form, mat, name) => meshesFrom(THREE, { 0: list }, form, mat, 1, name, group)[0] || null;
  const mkp = async (...a) => { const m = mk(...a); await ctx.yield(); return m; };      // (one mesh a step)
  const hero = [await mkp(lists.leavesHi, forms[0], mats.still, 'tree-leaves'), await mkp(lists.blossomsHi, forms[1], mats.still, 'tree-blossom')]; await ctx.yield();
  const farLow = [await mkp(lists.leavesFarLow, forms[2], mats.still, 'tree-leaves-far'), await mkp(lists.blossomsFarLow, forms[3], mats.still, 'tree-blossom-far')]; await ctx.yield();
  const farUp = [await mkp(lists.leavesFarUp, forms[2], mats.still, 'tree-leaves-far-up'), await mkp(lists.blossomsFarUp, forms[3], mats.still, 'tree-blossom-far-up')]; await ctx.yield();
  const upReal = [await mkp(lists.leavesUp, forms[0], mats.treeNear, 'tree-leaves-up'), await mkp(lists.blossomsUp, forms[1], mats.treeNear, 'tree-blossom-up')]; await ctx.yield();
  const upFar = [await mkp(lists.leavesUpFar, forms[2], mats.treeFar, 'tree-leaves-upfar'), await mkp(lists.blossomsUpFar, forms[3], mats.treeFar, 'tree-blossom-upfar')];
  // WHAT A PLACE OF THE FLOWN LINE DRAWS. The upper valley's trees (wood and masses) stand the whole flight. A tree
  // of the lower valley is put away only when it lies behind the line's point for good (the line's z falls all the
  // way and the lens looks up the valley): once the line's z is past the tree's own z less its crown and 5 m more.
  // The first hawthorn goes so, wood and sprays together; the rest of the lower valley's trees share their meshes
  // and go together when the last of them is past. The upper trees' real sprays are drawn in to nothing beyond 64 m
  // of the eye by their own material (TREE_LOD): they come on when the line's point is within 67 m in z of the
  // nearest crown.
  const past = (t) => t.z - t.crown - 5, lows = sites.filter((t) => t.z > -45 && !t.hero), nears = sites.filter((t) => t.near);
  const firstEnd = past(sites.find((t) => t.hero)), lowEnd = lows.length ? Math.min(...lows.map(past)) : 1e9, upFrom = nears.length ? Math.max(...nears.map((t) => t.z + t.crown)) + TREE_LOD[1] + 3 : -1e9;
  const sets = [[[woodLow, ...farLow], (z) => z > lowEnd], [[woodFirst, ...hero], (z) => z > firstEnd], [[...farUp, ...upFar, woodUp], () => true], [upReal, (z) => z < upFrom]];
  const show = (eyeZ) => {
    let t = 0, c = 0;
    for (const [ms, rule] of sets) { const on = rule(eyeZ); for (const m of ms) if (m) { m.visible = on && m.userData.triangles > 0; if (m.visible) { t += m.userData.triangles; c++; } } }
    return [t, c];
  };
  const n10 = (a) => a.length / 10;
  return { object: group, show, minClear: stat.minClear, left: stat.left, roofLeft: stat.roof, sightLeft: stat.sight, top: stat.top, owned,
    counts: { woodLow: woodLow.userData.triangles, woodFirst: woodFirst.userData.triangles, woodUp: woodUp.userData.triangles, upper: nears.length, hero: n10(lists.leavesHi) + n10(lists.blossomsHi), farLow: n10(lists.leavesFarLow) + n10(lists.blossomsFarLow), farUp: n10(lists.leavesFarUp) + n10(lists.blossomsFarUp), upReal: n10(lists.leavesUp) + n10(lists.blossomsUp), upFar: n10(lists.leavesUpFar) + n10(lists.blossomsUpFar) } };
}
