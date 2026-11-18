// The Shaft Between the Hexagons: a library that is the universe. Six-sided galleries of bookshelves stacked without end
// round vast air shafts; the flight starts inside one gallery, goes out over the low rail and down a shaft in a slow
// spiral, in over a rail and through a vestibule (spiral stair, mirror) into the next gallery, across a second shaft
// by its rim, rail to rail through the crimson hexagon, up a last shaft into the round chamber whose wall is one great
// book's spine, and level across the chamber to the great lamp, in whose place the portal hangs.
//
// The place is a honeycomb (src/parts/shaft-between-the-hexagons.js): cells of apothem 9 m, floors 8 m apart; a shaft
// is a cluster of seven cells left empty, shafts stand on the lattice (4i, 4j); every other cell is a gallery. Three
// shafts lie in a line along +x: A (the descent), B (crossed by its rim), C (the rise). Every make of a cell is fixed at
// build by its distance in space from the route. Nothing goes with the camera; everything alive runs on the world
// clock from start phases of its own.
import * as THREE from 'three';
import { makePath, makeRng, hashSeed, clamp, lerp, smoothstep } from '../kit/core.js';
import * as fx from '../kit/fx.js';
import * as H from '../parts/shaft-between-the-hexagons.js';

const { AP, PITCH, EYE, SQ3, DIRS } = H;
const ROW = AP * SQ3;
// the radius of the great lamp's ring of globes round the portal (the portal's own radius is 7 m)
const LAMP_G = 8.4;
// a ramp that starts and ends level: the share of a climb done at t (0..1), ends eased over the share a
const easeRamp = (t, a) => { t = clamp(t, 0, 1); const k = 1 / (2 * a * (1 - a)); return t < a ? t * t * k : t > 1 - a ? 1 - (1 - t) * (1 - t) * k : (t - a / 2) / (1 - a); };
// axial cell turned by j sixths of a turn about the origin
const turnCell = (q, r, j) => { for (let i = 0; i < ((j % 6) + 6) % 6; i++) { const t = -r; r = q + r; q = t; } return [q, r]; };

// The route, from the seed's draws: which start gallery (the turn of the descent), how many floors down, the hand of
// the last shaft. Returns the points and the places the paces, pulls and makes are told by.
function layRoute(draw) {
  const R = { turn: draw.turn, nDown: draw.nDown, hand: draw.hand };
  const j = { 180: 0, 240: 5 }[draw.turn], phi = j * Math.PI / 3, dOut = [Math.cos(phi), Math.sin(phi)];
  const g0 = turnCell(1, 1, j), c0 = H.cellXZ(g0[0], g0[1]);
  const yL = -PITCH * draw.nDown, fc = -draw.nDown + 3, yC = PITCH * fc;
  const pts = [], at0 = (k) => [c0[0] + dOut[0] * k, c0[1] + dOut[1] * k];
  // R1: one straight level line of 51 m: from the gallery behind G0 (2.5 m inside its own rail), through its door, the
  // vestibule and G0's door, across G0, out over G0's rail and on to the place where the line touches the circle of
  // the descent. A camera that arrives through a portal comes in on this line and has nothing to turn to. The line
  // runs through the middle of both door frames and of both galleries (no sideways step anywhere on it).
  // MARGINS THE INTERIOR CANNOT KEEP at 2.5 m (stated, not hidden): a door is 3.6 m wide, so its jambs pass 1.58 m
  // from the line (1.8 m less the frame's 0.22 m); the vestibule is as wide as its doors, so its wall on the stair's
  // side and its mirror pass 1.8 m and 1.76 m from the line; the stair in the vestibule's niche stands 3.15 m off it
  // (its handrail 2.1 m in plan and, lower than the eye, 2.4 m in space; the niche's globe 2.51 m, see H.VEST);
  // a door's lintel and the vestibule's ceiling are 6.2 m up, 1.9 m over the eye.
  // Everything hung or railed keeps 2.5 m: the five rails the line crosses lie 2.5 m under it (EYE; 2.49 m at G1's,
  // where the descent settles; 2.54 m at the crimson hexagon's far rail, see R4),
  // a lamp at the full of its swing is 2.5 m off (see the part's LAMPS), a corner stair's rim 2.7 m.
  for (const k of [24.5, 18, 9, 0, -9]) { const p = at0(k); pts.push([p[0], EYE, p[1]]); }
  // R2: the helix round A's axis, begun where the line touches it (27 m past G0's centre); the height falls with the
  // metres flown level, from 7 m past the touching place (58 m from the start) to G1's rail side. The circle is
  // 16.2 m in radius where the line meets it, 16.5 m half way round and 15.6 m (the row) at G1; its middle begins
  // 0.6 m beyond A's axis as seen from the line (so that a circle of 16.2 m touches a line 15.6 m from the axis) and
  // is drawn back on to the axis as the turn goes round.
  const th0 = Math.PI / 2 + phi - (j >= 4 ? 2 * Math.PI : 0), th1 = 1.5 * Math.PI, nArc = Math.round((th1 - th0) / (Math.PI / 7.2));
  const flat = [];
  { const p = at0(-18); flat.push([p[0], p[1]]); }
  const tn = at0(-27), tl = Math.hypot(tn[0], tn[1]);
  for (let i = 0; i <= nArc; i++) { const t = i / nArc, th = th0 + (th1 - th0) * t, r = ROW + 0.6 * (1 - t) + 0.6 * Math.sin(Math.PI * t), back = 0.6 * (1 - t) / tl; flat.push([r * Math.cos(th) - tn[0] * back, r * Math.sin(th) - tn[1] * back]); }
  flat.push([9, -ROW]);
  let run = 0; const runs = [];
  { let px = at0(-9)[0], pz = at0(-9)[1]; for (const f of flat) { run += Math.hypot(f[0] - px, f[1] - pz); runs.push(run); px = f[0]; pz = f[1]; } }
  flat.forEach((f, i) => pts.push([f[0], EYE + yL * easeRamp((runs[i] - 25) / (run - 25), 0.3), f[1]]));
  // R3: G1 (2,-1) in over its rail, through its middle, its door, the vestibule, G2's door and middle (3,-1), out over
  // G2's rail: one straight line on the axis of the two galleries (the row at z = -ROW)
  const yE = yL + EYE;
  for (const x of [18, 27, 36, 45, 54]) pts.push([x, yE, -ROW]);
  // across shaft B from the middle of G2's rail (54, -ROW) to the middle of the crimson hexagon's rail (99, 0), an S
  // of two gentle bends: 9.5 m straight out of G2's rail (63.5); abreast of B's axis (72, 0) and 10.6 m to its side
  // (73); half way in to the crimson hexagon's axis (82.5, -4.7); 8 m before its rail and nearly on its axis (91)
  for (const [x, z] of [[63.5, -15.6], [73, -10.6], [82.5, -4.7], [91, -0.8]]) pts.push([x, yE, z]);
  // R4: the crimson hexagon (6,0), rail to rail on its axis
  // (the knot over the far rail stands 0.12 m higher than the eye's level: the line sags a little before the rise that
  // follows, and so it passes 2.5 m over that rail as over the other four)
  for (const [x, up] of [[99, 0], [108, 0], [117, 0.12]]) pts.push([x, yE + up, 0]);
  // R5: into C, up and round to the place where the rise ends (over the well, 16.5 m from C's axis, heading +x), then
  // 75 m level and straight: the knot where the rise ends, the knot named level 15 m on, and four more to the ring.
  // The spline's last bent span ends at the first of them, so the whole last 60 m are straight and level.
  // The great lamp's ring of globes stands LAMP_G m round the portal; the level run and the lamp's middle are
  // LAMP_G + 0.7 (a globe's radius) + 2.0 (air over the floor) above the chamber floor.
  const cx = 144, s = draw.hand, yTop = yC + LAMP_G + 0.7 + 2.0, lead = [[-21, -1.0], [-14.5, -6.5]];
  for (const a of [235, 253, 270]) lead.push([16.5 * Math.cos(a * Math.PI / 180), 16.5 * Math.sin(a * Math.PI / 180)]);
  let lr = 0, lx = -27, lz = 0; const lrun = [];
  for (const p of lead) { lr += Math.hypot(p[0] - lx, p[1] - lz); lrun.push(lr); lx = p[0]; lz = p[1]; }
  lead.forEach((p, i) => pts.push([cx + p[0], lerp(yE, yTop, easeRamp(lrun[i] / lr, 0.26)), p[1] * s]));
  for (const k of [15, 30, 45, 60, 75]) pts.push([cx + k, yTop, -16.5 * s]);
  // the whole route as laid, or its mirror image across the line of the three shafts (the lattice is its own mirror)
  const mz = draw.mirror;
  if (mz < 0) for (const p of pts) p[2] = -p[2];
  const rail0 = at0(-9), exit = [-dOut[0], -dOut[1] * mz];
  Object.assign(R, { pts, mz, g0: mz < 0 ? [g0[0] + g0[1], -g0[1]] : g0, exitSide: ((Math.round(Math.atan2(exit[1], exit[0]) / (Math.PI / 3)) % 6) + 6) % 6, yL, yE, fc, yC, yTop,
    rail0: [rail0[0], rail0[1] * mz], touch: [tn[0], tn[1] * mz], top: [cx, yTop, -16.5 * s * mz], level: [cx + 15, yTop, -16.5 * s * mz], centre: [cx + 75, yC, -16.5 * s * mz] });
  return R;
}

export default {
  id: 'shaft-between-the-hexagons',
  name: 'The Shaft Between the Hexagons',
  category: 'books',
  placeKind: 'interior',
  book: 'The Library of Babel',
  author: 'Jorge Luis Borges, 1899 to 1986',
  media: ['interior'],
  weirdness: 0.85,
  async build(ctx) {
    const scene = new THREE.Scene();
    const vary = ctx.vary || {}, detail = ctx.quality ? ctx.quality.detail : 1, density = vary.density || 1;
    // ---- the streams: each thing has its own, made from the world's seed and a name (none draws from another)
    const own = (name) => makeRng(hashSeed('shaft-hexagons-' + name + ':' + ctx.seed));
    const rLayout = own('layout'), rCells = own('cells'), rPeople = own('people'), rPages = own('pages'), rProps = own('props'), rCrimson = own('crimson'), rChamber = own('chamber'), rDust = own('dust'), rSparks = own('sparks'), rMoths = own('moths');
    // casts with streams of their own (round 2): the reader at the rail, the searchers, the pilgrims, the kneelers of the
    // crimson hexagon, and the choice of the gallery whose shelves were thrown down
    const rReader = own('reader'), rSearchers = own('searchers'), rPilgrims = own('pilgrims'), rKneelers = own('kneelers'), rThrown = own('thrown');
    // ---- what this visit is like
    // The hour's pick is ALWAYS the first draw of the stream layout, so the route's draws that follow never shift; an
    // hour the viewer has set overrides the drawn one.
    const drawnHour = rLayout.pick(['day', 'day', 'golden', 'night']);
    const hour = vary.hour === 'night' ? 'night' : vary.hour === 'golden' ? 'golden' : vary.hour === 'day' || vary.hour === 'dawn' ? 'day' : drawnHour;
    const draw = { turn: rLayout.pick([180, 240]), hand: rLayout.pick([-1, 1]), mirror: rLayout.pick([-1, 1]) };
    draw.nDown = draw.turn / 60;
    const district = rLayout.pick([0, 1, 2]), rare = !!vary.rare;
    const look = H.makeLook(hour);
    const route = layRoute(draw);
    await ctx.yield();
    const path = makePath(route.pts);
    scene.background = look.depth.clone();
    await ctx.yield();
    return finish(ctx, scene, path, route, look, { hour, district, rare, detail, density, rCells, rPeople, rPages, rProps, rCrimson, rChamber, rDust, rSparks, rMoths, rReader, rSearchers, rPilgrims, rKneelers, rThrown });
  },
};

// ---------------------------------------------------------------- the honeycomb: which cells stand where, in which make
async function layCells(path, route, look, o, pause) {
  const rng = o.rCells, cells = [], lamps = [], byKey = new Map();
  const main = [[0, 0], [1, 0], [2, 0]], lo = -route.nDown - 22;
  const span = { '0,0': [lo, 22], '1,0': [lo, -route.nDown + 22], '2,0': [lo, route.fc - 1] };
  const shafts = new Map();
  for (const [i, j] of main) { shafts.set(i + ',' + j, span[i + ',' + j]); for (const d of DIRS) { const k = (i + d[0]) + ',' + (j + d[1]); if (!shafts.has(k) && !span[k]) shafts.set(k, [-route.nDown - 4, 4]); } }
  const RC = o.chamberR + 9, cen = route.centre;
  // The gallery whose shelves were thrown down (its books still tumble from its rail down shaft A): chosen here, before
  // any lamp is laid, by a stream of its own, among the galleries of A's ring on the floors of the descent whose rail
  // on A's side stands 6 m or more in plan off the route's line (if none does, the one that stands farthest).
  const thrownAt = (() => {
    const cand = []; let far = null;
    for (let dq = -2; dq <= 2; dq++) for (let dr = -2; dr <= 2; dr++) {
      if (H.hexDist(dq, dr) !== 2) continue;
      const [x, z] = H.cellXZ(dq, dr), gi = H.galleryInfo(dq, dr), toA = (sd) => { const a = (gi.rot + sd) * Math.PI / 3; return Math.hypot(x + AP * Math.cos(a), z + AP * Math.sin(a)); }, sides = gi.corner ? [toA(0) < toA(3) ? 0 : 3] : [0, 1];
      // the rail's middles on A's side (cell space: side 0 and 1 of an edge gallery, the side of a corner gallery that faces A)
      let near = 1e9;
      for (const sd of sides) { const a = (gi.rot + sd) * Math.PI / 3; near = Math.min(near, path.nearestXZ(x + AP * Math.cos(a), z + AP * Math.sin(a)).dist); }
      for (let f = -route.nDown + 1; f <= -1; f++) { const c = { q: dq, r: dr, f, near, side: sides[0] }; if (near >= 6) cand.push(c); if (!far || near > far.near) far = c; }
    }
    return cand.length ? cand[Math.floor(o.rThrown() * cand.length)] : far;
  })();
  // the crimson hexagon's own hash, of its own stream (kept under the stripped galleries' range: its shelves are full)
  const crimHash = 0.05 + 0.85 * o.rCrimson();
  let thrown = null;
  for (const [key, fl] of shafts) {
    const [si, sj] = key.split(',').map(Number), isMain = !!span[key];
    for (let dq = -2; dq <= 2; dq++) for (let dr = -2; dr <= 2; dr++) {
      if (H.hexDist(dq, dr) !== 2) continue;
      const q = 4 * si + dq, r = 4 * sj + dr, ck = q + ',' + r, [x, z] = H.cellXZ(q, r), gi = H.galleryInfo(q, r);
      let col = byKey.get(ck);
      if (!col) { col = { q, r, x, z, gi, floors: new Map(), hash: rng(), owner: key }; byKey.set(ck, col); }
      const inChamber = Math.hypot(x - cen[0], z - cen[2]) < RC;
      for (let f = fl[0]; f <= fl[1]; f++) {
        if (col.floors.has(f) || (inChamber && f >= route.fc)) continue;
        const y = f * PITCH, d = path.distanceTo(x, y + 3.5, z);
        const crim = q === 6 && r === 0 && f === -route.nDown;
        // tier: how the casts and the furniture are dealt (round 1's bands, by the centre): 0 the galleries on the way
        // (under 15 m), 1 to 46 m, 2 beyond. make: how the cell is built, by the NEAREST point of the cell to the line
        // (the centre's distance less the corner radius 10.4 m): full where that is under 15 m (centre under 25.4 m:
        // make 0, or make 4, the full make with its doors drawn shut, where no vestibule lies behind), middle to 46 m
        // by the centre, far beyond. A seam of the makes is never nearer the line than 15 m.
        const tier = d < 15 || crim ? 0 : d < 46 ? 1 : 2;
        const make = tier === 0 ? 0 : d < 25.4 ? (gi.corner ? 0 : 4) : d < 46 ? 1 : 2;
        // which of the two lamps burn (most, by the hour) comes of the same two draws in every make; which district's
        // bindings; a stripped gallery now and then. The galleries the line itself passes through (their centre within
        // 6 m of it) are tended: both their lamps burn at every hour.
        const lampsDrawn = (rng() >= look.out ? 1 : 0) + (rng() >= look.out ? 2 : 0), h = rng(), lampsOn = d < 6 ? 3 : lampsDrawn;
        const dist = x < 58 ? o.district : (o.district + 1) % 3;
        const isThrown = isMain && key === '0,0' && q === thrownAt.q && r === thrownAt.r && f === thrownAt.f;
        const c = { q, r, f, x, y, z, rot: gi.rot, kind: gi.corner ? 'corner' : 'edge', make, tier, seed: [crim ? crimHash : isThrown ? 0.94 + 0.05 * h : h, crim ? 0 : dist, crim ? 1 : 0, crim ? 3 : lampsOn],
          chunk: key + (isMain ? ':' + Math.floor((f + 64) / 10) : ''), crim, lampsOn: crim ? 3 : lampsOn, gi, d };
        if (isThrown) { thrown = c; c.thrownSide = thrownAt.side; }
        col.floors.set(f, c); cells.push(c);
        // rod 1: a gallery lamp, a globe on a rod that swings (the halo swings with it)
        LAMP_AT.forEach((L, k) => { const w = H.cellToWorld(c, L[0], L[1], L[2]); lamps.push({ x: w.x, y: w.y, z: w.z, on: (c.lampsOn >> k) & 1, hash: c.seed[0], crim: crim ? 1 : 0, rod: 1 }); });
      }
      // beyond the built floors the lamps go on as a grain of gold, up and down, in the three shafts of the route
      if (isMain) for (let f = fl[0] - 40; f <= fl[1] + 40; f++) {
        if ((f >= fl[0] && f <= fl[1]) || (inChamber && f >= route.fc) || col.dust) continue;
        for (const L of LAMP_AT) { if (rng() < look.out) continue; const w = H.cellToWorld({ x, y: f * PITCH, z, rot: gi.rot }, L[0], L[1], L[2]); lamps.push({ x: w.x, y: w.y, z: w.z, on: 1, hash: col.hash, rod: 1 }); }
      }
      if (isMain) col.dust = true;
      await pause();
    }
  }
  // the rim of the well in the chamber's floor: the ring of C on the chamber's level, rail and slab edge only
  for (let dq = -2; dq <= 2; dq++) for (let dr = -2; dr <= 2; dr++) {
    if (H.hexDist(dq, dr) !== 2) continue;
    const q = 8 + dq, r = dr, [x, z] = H.cellXZ(q, r), gi = H.galleryInfo(q, r);
    cells.push({ q, r, f: route.fc, x, y: route.yC, z, rot: gi.rot, kind: gi.corner ? 'corner' : 'edge', make: 3, tier: 3, seed: [0.5, 0, 0, 3], chunk: 'rim', rim: true, gi });
  }
  return { cells, lamps, byKey, thrown };
}
const LAMP_AT = H.LAMPS;

// ---------------------------------------------------------------- stairs and vestibules, by rules of the cells
// A spiral stair stands in every edge gallery at the corner between its two open sides (2.3 m in from the corner post),
// on every floor within 46 m of the line (tiers 0 and 1): the whole stair where the cell is built full (centre under
// 25.4 m), the plainer make beyond. A vestibule lies behind every door of the galleries on the way (tier 0).
const STAIR_AT = [(H.HR - 2.3) * Math.cos(Math.PI / 6), (H.HR - 2.3) * Math.sin(Math.PI / 6)];
function layStairs(lay, look) {
  const things = [], mirrors = [], columns = new Map(), seen = new Set();
  for (const c of lay.cells) {
    if (c.kind !== 'edge' || c.tier > 1) continue;
    const w = H.cellToWorld(c, STAIR_AT[0], 0, STAIR_AT[1]);
    // (room: the stair stands at the stair corner of its gallery and is lit by that gallery's two lamps where they hang)
    things.push({ kind: 'stair', make: c.d < 25.4 ? 0 : 1, x: w.x, y: w.y, z: w.z, rot: c.rot, seed: [c.seed[0], 0, 0, c.lampsOn], chunk: c.chunk, room: [STAIR_AT[0], STAIR_AT[1], 1, 0] });
    const ck = c.q + ',' + c.r;
    if (!columns.has(ck)) columns.set(ck, { x: w.x, z: w.z, rot: c.rot * Math.PI / 3, q: c.q, r: c.r, f0: c.f, f1: c.f });
    const col = columns.get(ck); col.f0 = Math.min(col.f0, c.f); col.f1 = Math.max(col.f1, c.f);
    if (c.tier !== 0) continue;
    for (const s of c.gi.doors) {
      const nq = c.q + DIRS[s][0], nr = c.r + DIRS[s][1], a = c.q + ',' + c.r, b = nq + ',' + nr, key = (a < b ? a + '|' + b : b + '|' + a) + '|' + c.f;
      if (seen.has(key)) continue;
      seen.add(key);
      const ang = s * Math.PI / 3, v = { x: c.x + AP * Math.cos(ang), y: c.y, z: c.z + AP * Math.sin(ang), rot: s };
      // A vestibule is a room of its own kind (room kind 1): its one lamp is the globe in the stair niche, H.VEST.lamp.
      // The same constant places the globe (the part), the light on the vestibule and on the niche's stair (the shader,
      // by lamp code 2), and the glow laid here; the niche's stair stands at (0, stairZ) of the vestibule, 0.78 its size.
      things.push({ kind: 'vest', make: 0, ...v, seed: [c.seed[0], 0, 0, 2], chunk: 'vest', room: [0, 0, 1, 1] });
      const sp = H.cellToWorld(v, 0, 0, H.VEST.stairZ), lp = H.cellToWorld(v, H.VEST.lamp[0], H.VEST.lamp[1], H.VEST.lamp[2]);
      things.push({ kind: 'stair', make: 0, x: sp.x, y: sp.y, z: sp.z, rot: s, scale: H.VEST.stairScale, seed: [c.seed[0], 0, 0, 2], chunk: 'vest', room: [0, H.VEST.stairZ, H.VEST.stairScale, 1] });
      // the globe's glow: it hangs still (rod 0: no swing)
      lay.lamps.push({ x: lp.x, y: lp.y, z: lp.z, on: 0.6, hash: c.seed[0], rod: 0 });
      mirrors.push(v);
    }
  }
  return { things, mirrors, columns: [...columns.values()] };
}

// ---------------------------------------------------------------- the librarians, by rules of the galleries
// In every gallery built full or middle: some lean on the rails looking into the shaft, some read at the shelves, some
// carry armfuls, some sleep standing by a pier. None stands within 4.8 m of the route's line (two and a half widths of
// a robed figure); one who walks his round with an armful keeps a metre more; the kneelers of the crimson hexagon,
// lower than the eye, keep 3.1 m.
// None stands in a stair (2.7 m from its newel).
const ROBES = [[0.16, 0.12, 0.085], [0.10, 0.095, 0.09], [0.19, 0.155, 0.115], [0.07, 0.085, 0.135], [0.15, 0.08, 0.055], [0.21, 0.185, 0.15]];
function layPeople(path, route, lay, stairs, look, o) {
  const people = [], climbers = [];
  // each cast places its figures by its own stream (the librarians by the stream people, as in round 1)
  const putter = (rng) => (c, pose, ap, side, lat, turn, margin) => {
    const a = side * Math.PI / 3, lx = Math.cos(a) * ap - Math.sin(a) * lat, lz = Math.sin(a) * ap + Math.cos(a) * lat, w = H.cellToWorld(c, lx, 0, lz);
    const robe = ROBES[Math.floor(rng() * ROBES.length)], k = 0.8 + 0.4 * rng(), hash = rng();
    // the margin is kept by the whole figure: at the feet, the middle and the head (a walker's round of 1 m and a
    // body's half width of 0.9 m lie inside it: 5.2 - 1.9 and 4.8 - 0.9 leave 3.3 m and 3.9 m of air)
    const mg = margin || (pose === 'kneel' ? 3.1 : pose === 'carry' ? 5.2 : 4.8);
    if (Math.min(path.distanceTo(w.x, w.y + 0.5, w.z), path.distanceTo(w.x, w.y + 2.3, w.z), path.distanceTo(w.x, w.y + EYE, w.z)) < mg) return null;
    if (c.kind === 'edge' && Math.hypot(lx - STAIR_AT[0], lz - STAIR_AT[1]) < 2.7) return null;
    const f = { pose, x: w.x, y: w.y, z: w.z, yaw: (c.rot + side) * Math.PI / 3 + turn, cell: c, robe: robe.map((v) => v * k), hash, lamps: c.lampsOn, crim: c.crim };
    people.push(f);
    return f;
  };
  const rng = o.rPeople, put = putter(rng);
  for (const c of lay.cells) {
    if (c.tier > 1 || c.crim) continue;
    const opens = c.kind === 'edge' ? [0, 1] : [0, 3], closed = c.kind === 'edge' ? [2, 5] : [1, 2, 4, 5];
    const want = (c.tier === 0 ? 1.5 : 0.85) * o.density, n = Math.floor(want) + (rng() < want % 1 ? 1 : 0);
    for (let i = 0; i < n; i++) {
      const r = rng();
      if (r < 0.48) put(c, 'lean', AP - 1.05, opens[Math.floor(rng() * 2)], lerp(-3.6, 3.6, rng()), lerp(-0.2, 0.2, rng()));
      else if (r < 0.74) put(c, 'read', 5.0, closed[Math.floor(rng() * closed.length)], lerp(-2.2, 2.2, rng()), rng() < 0.6 ? 0 : Math.PI + lerp(-0.6, 0.6, rng()));
      else if (r < 0.88) put(c, 'carry', lerp(1.5, 4, rng()), Math.floor(rng() * 6), lerp(-1.5, 1.5, rng()), lerp(0, 6.28, rng()));
      else put(c, 'sleep', 5.4, closed[Math.floor(rng() * closed.length)], lerp(-2.6, 2.6, rng()), Math.PI + lerp(-0.3, 0.3, rng()));
    }
  }
  // the reader at the rail of the start gallery (the brief's first beat), by a stream of his own: at the rail the way
  // leaves by, 4.7 m to the side of its middle that has no stair (the one figure allowed nearer the line than 4.8 m)
  const g0 = lay.byKey.get(route.g0[0] + ',' + route.g0[1]).floors.get(0), rR = o.rReader;
  const exitCell = (route.exitSide - g0.rot + 6) % 6;
  putter(rR)(g0, 'read', AP - 1.1, exitCell, exitCell === 0 ? -4.7 : 4.7, lerp(-0.25, 0.25, rR()), 4.0);
  // the dispute of searchers over an open book, in the gallery beyond the vestibule (G2), by a stream of their own: two
  // face each other by a shelf wall, one bent forward, one holding the book open, a third beside them (the same margins)
  const g2 = lay.byKey.get(route.mz < 0 ? '2,1' : '3,-1').floors.get(-route.nDown), putS = putter(o.rSearchers);
  putS(g2, 'lean', 4.9, 2, -1.0, Math.PI / 2); putS(g2, 'read', 4.9, 2, 1.0, -Math.PI / 2); putS(g2, 'read', 5.0, 2, 2.6, -1.9);
  // pilgrims climbing the corner stairs, by a stream of their own: a line on two stairs of A and one of C; on the rare
  // visit a procession with lamps on every stair of A. Each line climbs at its stair's own pace from a start of its own.
  const rP = o.rPilgrims, inRing = (col, q0) => H.hexDist(col.q - q0, col.r) === 2;
  const pick = (list, n) => { const l = list.slice(); const out = []; while (l.length && out.length < n) out.push(l.splice(Math.floor(rP() * l.length), 1)[0]); return out; };
  // A stair the line passes within 5.5 m of carries no line of climbers: a climber sweeps 2.6 m round the stair's axis
  // (the helix he walks, 0.86 m, his shoulders and the hand he holds forward), and the eye keeps 2.5 m from every
  // moving figure. A rule of place, measured against the line floor by floor.
  const clear = (col) => { for (let f = col.f0; f <= col.f1; f++) if (path.distanceTo(col.x, f * PITCH + EYE, col.z) < 5.5) return false; return true; };
  const colsA = stairs.columns.filter((c) => inRing(c, 0) && clear(c)), colsC = stairs.columns.filter((c) => inRing(c, 8) && clear(c));
  const lines = o.rare ? colsA.map((c) => [c, 3.0]).concat(pick(colsC, 1).map((c) => [c, 0.9])) : pick(colsA, 2).concat(pick(colsC, 1)).map((c) => [c, 0.9]);
  for (const [col, per] of lines) {
    const floors = col.f1 - col.f0 + 1, range = floors * PITCH, n = Math.round(floors * per * (o.rare ? 1 : o.density)), speed = lerp(0.42, 0.62, rP()), h0 = rP(), share = o.rare ? 1 : 0.55;
    for (let k = 0; k < n; k++) {
      const robe = ROBES[Math.floor(rP() * ROBES.length)];
      climbers.push({ x: col.x, y: col.f0 * PITCH, z: col.z, range, rot: col.rot, robe, hash: (h0 + share * (k + 0.3 * rP()) / n) % 1, speed });
    }
  }
  return { people, climbers, put: putter(o.rKneelers) };
}

// ---------------------------------------------------------------- loose pages down every shaft; props in the galleries
// Margins in plan off the route's line (a fall passes every height, so the plan is the measure), by the fullest reach:
// a leaf 2.5 m + its side-slip (1.4 m each way on two axes at the most, 1.98 m on the diagonal) + half the largest
// sheet's diagonal (0.99 m) = 5.47 m, kept at 5.52 m; a book, which drops straight, 2.5 m + half its largest diagonal
// (1.02 m), kept at 4.58 m. So no leaf comes nearer the line than 2.55 m and no book than 3.56 m: round 2's nearest
// (2.53 m of the leaves, 3.51 m and 3.55 m of the shafts' and the thrown books) or farther.
const LEAF_KEEP = 5.52, BOOK_KEEP = 4.58;
// The open well of a shaft in plan: the seven lattice hexagons round its axis. Its outer edges (eighteen, each the edge
// a gallery's slab and rail stand on, floor over floor) are what a falling thing must keep clear of.
const WELL_EDGES = (() => {
  const e = [];
  for (const [q, r] of [[0, 0], ...DIRS]) {
    const [cx, cz] = H.cellXZ(q, r);
    for (let k = 0; k < 6; k++) {
      if (H.hexDist(q + DIRS[k][0], r + DIRS[k][1]) <= 1) continue;
      const a0 = (k * 60 - 30) * Math.PI / 180, a1 = (k * 60 + 30) * Math.PI / 180;
      e.push([cx + H.HR * Math.cos(a0), cz + H.HR * Math.sin(a0), cx + H.HR * Math.cos(a1), cz + H.HR * Math.sin(a1)]);
    }
  }
  return e;
})();
const WELL_CELLS = [[0, 0], ...DIRS].map(([q, r]) => H.cellXZ(q, r)), WELL_AXES = [0, 1, 2].map((k) => [Math.cos(k * Math.PI / 3), Math.sin(k * Math.PI / 3)]);
// the room a place has in the well round the axis (ax, az): its distance to the nearest of those edges, the hexagons'
// own (not a circle); negative outside the well
function wellRoom(x, z, ax, az) {
  x -= ax; z -= az;
  let inside = false, d = 1e9;
  for (const [cx, cz] of WELL_CELLS) {
    let m = 0;
    for (const [ca, sa] of WELL_AXES) m = Math.max(m, Math.abs((x - cx) * ca + (z - cz) * sa));
    if (m <= AP) inside = true;
  }
  for (const [x0, z0, x1, z1] of WELL_EDGES) { const ex = x1 - x0, ez = z1 - z0, t = clamp(((x - x0) * ex + (z - z0) * ez) / (ex * ex + ez * ez), 0, 1); d = Math.min(d, Math.hypot(x - x0 - ex * t, z - z0 - ez * t)); }
  return inside ? d : -d;
}
// What a falling thing sweeps, and the room it must have at its resting place (the plan of its fall):
//   a leaf: its side-slip on the diagonal (its slip on x and on z, times root 2) + half the largest sheet's diagonal
//   (0.99 m) + 0.15 m of air. Its slip is the lesser of the full slip (H.PAGE_SLIP, 1.4 m) and what its place's room
//   leaves; a place is taken only where a leaf can still slip half a metre each way (room 1.85 m or more).
//   a book, which drops straight: half its largest diagonal (1.02 m) + 0.15 m of air (room 1.17 m or more).
const LEAF_HALF = 0.99, BOOK_HALF = 1.02, FALL_AIR = 0.15, SLIP_LEAST = 0.5;
const LEAF_ROOM = LEAF_HALF + FALL_AIR + SLIP_LEAST * Math.SQRT2, BOOK_ROOM = BOOK_HALF + FALL_AIR;
function layAir(path, route, lay, o) {
  const drops = [], lo = (-route.nDown - 9) * PITCH, v = new THREE.Vector3();
  const cluster = (ax, az) => { const s = [[ax, az]]; for (const d of DIRS) { const p = H.cellXZ(d[0], d[1]); s.push([ax + p[0], az + p[1]]); } return s; };
  const k = o.density * o.detail;
  // a place that fails its margin after its tries is moved straight away from the line to the margin (never parked)
  const away = (m) => (x, z) => {
    for (let i = 0; i < 6; i++) { const n = path.nearestXZ(x, z); if (n.dist >= m) break; path.pointAt(n.u, v); let dx = x - v.x, dz = z - v.z; const l = Math.hypot(dx, dz); if (l < 1e-3) { dx = 1; dz = 0; } else { dx /= l; dz /= l; } x = v.x + dx * (m + 0.2); z = v.z + dz * (m + 0.2); }
    return [x, z];
  };
  // A falling thing of a shaft keeps BOTH margins at its resting place: off the line (above) and inside its well, with
  // the room its whole swept reach needs (LEAF_ROOM, BOOK_ROOM). A place that fails after its tries is settled on the
  // nearest place that keeps both, sought on rings round it (never parked); a leaf's slip comes of its place's room.
  const fall = (book, ax, az) => {
    const m = book ? BOOK_KEEP : LEAF_KEEP, need = book ? BOOK_ROOM : LEAF_ROOM;
    const keep = (x, z) => wellRoom(x, z, ax, az) >= need && path.nearestXZ(x, z).dist > m;
    const settle = (x, z) => {
      for (let r = 1; r <= 26; r++) for (let i = 0; i < 16; i++) { const a = (i + 0.5 * (r % 2)) / 16 * 6.2832, px = x + r * Math.cos(a), pz = z + r * Math.sin(a); if (keep(px, pz)) return [px, pz]; }
      return [ax, az];
    };
    return { keep, away: settle, slip: book ? null : (x, z) => clamp((wellRoom(x, z, ax, az) - LEAF_HALF - FALL_AIR) / Math.SQRT2, 0, H.PAGE_SLIP) };
  };
  drops.push({ x: 0, z: 0, y0: lo, y1: 5 * PITCH, n: Math.round(330 * k), spots: cluster(0, 0), ...fall(0, 0, 0) });
  drops.push({ x: 72, z: 0, y0: lo, y1: (-route.nDown + 6) * PITCH, n: Math.round(210 * k), spots: cluster(72, 0), ...fall(0, 72, 0) });
  drops.push({ x: 144, z: 0, y0: lo, y1: route.yC + 20, n: Math.round(230 * k), spots: cluster(144, 0), ...fall(0, 144, 0) });
  drops.push({ x: 0, z: 0, y0: lo, y1: 5 * PITCH, n: Math.round(14 * k), book: 1, spots: cluster(0, 0), ...fall(1, 0, 0) });
  drops.push({ x: 144, z: 0, y0: lo, y1: route.yC + 8, n: Math.round(8 * k), book: 1, spots: cluster(144, 0), ...fall(1, 144, 0) });
  // Loose pages fall in the round chamber too, from the dome (no well round them: the full slip, the line's margin).
  // They are spread over two thirds of the room's radius and begin at 0.76 of the dome's height over the floor: the
  // shares round 1's room gave them (62 m of 93, 44 m of 57.9), so that they change with the room.
  drops.push({ x: route.centre[0], z: route.centre[2], y0: route.yC + 0.3, y1: route.yC + 0.76 * o.domeH, n: Math.round(190 * k), spread: o.chamberR * 2 / 3, keep: (x, z) => path.nearestXZ(x, z).dist > LEAF_KEEP, away: away(LEAF_KEEP) });
  // The gallery whose shelves were thrown down (chosen in layCells): its books and leaves leave the shelves of the wall
  // next to its rail on A's side, go out over that rail and tumble down the shaft. Each begins at a shelf (rows 3 to 5
  // of the wall) and is out at its fall line while its lowest corner is still 0.15 m over the rail's posts (2.05 m): it
  // crosses the rail in the open air between the rail and the ceiling. It falls in shaft A's well: a book 1.2 to 3.0 m out
  // (it needs 1.17 m of room), a leaf 2.0 to 4.0 m out, so that it still slips 0.6 m each way at the nearest and its
  // full 1.4 m from 3.1 m out. A fall that fails a margin (the line's or the well's) is moved to the nearest place that
  // keeps both, toward the rail, out or along it (within the 1.5 m either side of the rail's middle that the falls
  // keep to, out to 7 m); if nothing there keeps both, it is settled like any other (never parked).
  const thrown = lay.thrown;
  if (thrown) {
    const sides = thrown.kind === 'edge' ? [[0, 5, 1], [1, 2, -1]] : [[thrown.thrownSide, (thrown.thrownSide + 5) % 6, 1]];
    const at = (ap, side, lat) => { const a = side * Math.PI / 3; return H.cellToWorld(thrown, Math.cos(a) * ap - Math.sin(a) * lat, 0, Math.sin(a) * ap + Math.cos(a) * lat, new THREE.Vector3()); };
    // the places outside a rail that keep both margins, on a grid of a quarter of a metre (out 0.5 to 7 m, 1.5 m either
    // side of the rail's middle): worked out once for a rail and a kind, when a drawn place first fails
    const grid = (K, open) => { const g = []; for (let l = -1.5; l <= 1.501; l += 0.25) for (let q = 0.5; q <= 7.001; q += 0.25) { const p = at(AP + q, open, l); if (K.keep(p.x, p.z)) g.push([q, l, p.x, p.z]); } return g; };
    const place = (K, o0, o1, half) => {
      const grids = {};
      return (rng) => {
        const [open, wall, sg] = sides[Math.floor(rng() * sides.length)], row = 2 + Math.floor(rng() * 3), lat = lerp(-1.5, 1.5, rng()), O = at(H.WALL - 0.45, wall, sg * lerp(-2.5, 0, rng()));
        const out = lerp(o0, o1, rng()), p = at(AP + out, open, lat), y1 = thrown.y + H.SHELF_Y[row] + 0.6;
        let f = null;
        if (K.keep(p.x, p.z)) f = [p.x, p.z];
        else {
          // the nearest place of the grid that keeps both (drawn in toward the rail, or out, or along it)
          const g = grids[open] || (grids[open] = grid(K, open)); let best = 1e9;
          for (const c of g) { const d = (c[0] - out) ** 2 + (c[1] - lat) ** 2; if (d < best) { best = d; f = [c[2], c[3]]; } }
          if (!f) f = K.away(p.x, p.z);
        }
        return { x: f[0], z: f[1], y1, ox: O.x, oz: O.z, sOut: y1 - (thrown.y + H.RAILH + 0.25 + half + FALL_AIR) };
      };
    };
    const tb = fall(1, 0, 0), tl = fall(0, 0, 0);
    drops.push({ y0: lo, n: Math.round(46 * o.density), book: 1, place: place(tb, 1.2, 3.0, BOOK_HALF) });
    drops.push({ y0: lo, n: Math.round(60 * o.density), place: place(tl, 2.0, 4.0, LEAF_HALF), slip: tl.slip });
  }
  return { drops, thrown };
}

// Ladders against the shelves and heaps of fallen books. Each is one of a few makes built in cell space (so the
// gallery's own lamps light it) and stood in a gallery by instancing, where it keeps 3 m from the route's line (a
// ladder with its foot, its middle and its top; a heap 3.4 m) and 1.6 m from every librarian.
async function layProps(path, lay, people, o, pause) {
  const rng = o.rProps, geos = {}, things = [], anchors = {};
  const frame = (ap, side, lat) => { const a = side * Math.PI / 3, n = [Math.cos(a), 0, Math.sin(a)], t = [-Math.sin(a), 0, Math.cos(a)]; return { o: [n[0] * ap + t[0] * lat, 0, n[2] * ap + t[2] * lat], n, t }; };
  for (const kind of ['edge', 'corner']) {
    const closed = kind === 'edge' ? [2, 5] : [1, 2, 4, 5];
    for (let v = 0; v < 4; v++) {
      // a ladder leaning on a shelf wall: two rails and nine rungs
      let gb = H.makeGB(), F = frame(H.WALL - 0.25, closed[Math.floor(rng() * closed.length)], lerp(-2.4, 2.4, rng()));
      // the foot stands 1.5 m out of the wall; the ladder leans TOWARD the wall and its top (6.1 m up) rests on the shelves
      const lean = [F.n[0] * 0.24, 0.97, F.n[2] * 0.24], back = [-F.n[0] * 0.97, 0.24, -F.n[2] * 0.97], base = [F.o[0] - F.n[0] * 1.5, 0, F.o[2] - F.n[2] * 1.5];
      for (const sg of [-1, 1]) gb.box(base, F.t, lean, back, sg * 0.5 - 0.06, sg * 0.5 + 0.06, 0, 6.3, -0.06, 0.06, 4, 'u');
      for (let k = 1; k <= 9; k++) gb.box(base, F.t, lean, back, -0.5, 0.5, k * 0.62 - 0.04, k * 0.62 + 0.04, -0.04, 0.04, 4, 'lr');
      geos['ladder:' + kind + v] = [gb.build()]; anchors['ladder:' + kind + v] = [0, 3.15, 6.3].map((t) => [base[0] + lean[0] * t, lean[1] * t, base[2] + lean[2] * t]);
      // a heap of fallen books: blank volumes thrown down anyhow, some lying open (cream leaves, grey hatching)
      gb = H.makeGB(); F = frame(lerp(2.5, 5.0, rng()), Math.floor(rng() * 6), lerp(-2, 2, rng()));
      for (let k = 0, n = 9 + Math.floor(rng() * 8); k < n; k++) {
        const a = rng() * 6.28, r = Math.sqrt(rng()) * 1.4, tilt = lerp(-0.45, 0.45, rng()), ca = Math.cos(a), sa = Math.sin(a);
        const e1 = [ca * Math.cos(tilt), Math.sin(tilt), sa * Math.cos(tilt)], e3 = [-sa, 0, ca], e2 = [e3[1] * e1[2] - e3[2] * e1[1], e3[2] * e1[0] - e3[0] * e1[2], e3[0] * e1[1] - e3[1] * e1[0]];
        const b = [F.o[0] + r * Math.cos(a * 1.7), 0.24 + (1.4 - r) * 0.4 * rng(), F.o[2] + r * Math.sin(a * 1.7)];
        gb.box(b, e1, e2, e3, -0.42, 0.42, -0.1, 0.1 + 0.08 * rng(), -0.3, 0.3, rng() < 0.16 ? 7 : 0);
      }
      geos['heap:' + kind + v] = [gb.build()]; anchors['heap:' + kind + v] = [[F.o[0], EYE, F.o[2]]];
      await pause();
    }
  }
  const wv = new THREE.Vector3();
  const clear = (c, key, m) => anchors[key].every((an) => { const w = H.cellToWorld(c, an[0], an[1], an[2], wv); return path.distanceTo(w.x, w.y, w.z) > m; })
    && (() => { const an = anchors[key][0], w = H.cellToWorld(c, an[0], 0, an[2], wv); return !people.some((f) => Math.abs(f.y - w.y) < 1 && Math.hypot(f.x - w.x, f.z - w.z) < 1.6); })();
  let done = 0;
  for (const c of lay.cells) {
    if (c.tier > 1 || c.crim) continue;
    if (++done % 60 === 0) await pause();
    for (const [name, p, m] of [['ladder', c.tier === 0 ? 0.6 : 0.35, 3.0], ['heap', c.tier === 0 ? 0.5 : 0.3, 3.4]]) {
      const key = name + ':' + c.kind + Math.floor(rng() * 4), take = rng() < p * Math.min(1.3, o.density);
      if (take && clear(c, key, m)) things.push({ kind: key, make: 0, x: c.x, y: c.y, z: c.z, rot: c.rot, seed: c.seed, chunk: 'props' });
    }
  }
  return { geos, things };
}

// ---------------------------------------------------------------- the crimson hexagon: lecterns with open, glowing books; kneelers
function layCrimson(route, lay, pl, o) {
  const rng = o.rCrimson, gb = H.makeGB(), X = [1, 0, 0], Y = [0, 1, 0], Z = [0, 0, 1];
  const cell = lay.byKey.get('6,0').floors.get(-route.nDown);
  // six lecterns by the shelf walls, three either side of the way (5.2 m from the line), a kneeler before each (3.5 m)
  for (const sg of [-1, 1]) for (const x of [-3.3, 0, 3.3]) {
    const z = sg * (x === 0 ? 5.75 : 5.2), o3 = [x, 0, z];
    gb.box(o3, X, Y, Z, -0.22, 0.22, 0, 3.9, -0.22, 0.22, 4, 'u');
    gb.box(o3, X, Y, Z, -0.6, 0.6, 0, 0.16, -0.5, 0.5, 4, 'u');
    // the open book on a sloped desk, tilted toward the middle of the room
    const up = [0, 0.94, sg * 0.34], out = [0, 0.34, -sg * 0.94], c = [x, 4.25, z - sg * 0.25];
    gb.box(c, X, up, out, -1.4, 1.4, -0.9, 0.9, -0.1, 0, 0);
    const q = (a, b) => [c[0] + a, c[1] + up[1] * b + out[1] * 0.015, c[2] + up[2] * b + out[2] * 0.015];
    if (sg > 0) gb.quad(q(1.3, -0.82), q(-1.3, -0.82), q(-1.3, 0.82), q(1.3, 0.82), 12); else gb.quad(q(-1.3, -0.82), q(1.3, -0.82), q(1.3, 0.82), q(-1.3, 0.82), 12);
    const f = pl.put(cell, 'kneel', Math.abs(z) - 1.6, sg > 0 ? 1.5 : 4.5, sg * x, 0);
    if (f) { f.yaw = sg * Math.PI / 2 + lerp(-0.12, 0.12, rng()); f.robe = f.robe.map((v) => v * 0.55); }
  }
  return { geo: gb.build(), thing: { kind: 'crim', make: 0, x: cell.x, y: cell.y, z: cell.z, rot: cell.rot, seed: cell.seed, chunk: 'crim' }, cell };
}

// ---------------------------------------------------------------- the round chamber's people: lit by the great lamp
// Each stands in a cell of his own, turned and set back so that its first lamp (3.6 m off the cell's middle, a third of a
// right angle off its z axis) lies 2.5 m from him toward the great lamp: the side that faces it is lit.
function layChamberFolk(route, pl, o) {
  const rng = o.rChamber, cen = route.centre, people = pl.people;
  const add = (pose, x, z, yaw) => {
    const ux = cen[0] - x, uz = cen[2] - z, l = Math.hypot(ux, uz) || 1, a = Math.atan2(-ux / l, uz / l);
    people.push({ pose, x, y: route.yC, z, yaw, cell: { x: x - ux / l * 1.1, y: route.yC, z: z - uz / l * 1.1, rot: (a - Math.PI / 6) / (Math.PI / 3) }, robe: ROBES[Math.floor(rng() * ROBES.length)], hash: rng(), lamps: 1 });
  };
  // a ring kneeling round the lamp, facing it; readers, carriers and sleepers standing about the floor (none in the well),
  // out to three quarters of the room's radius (70 parts in 93, round 1's share: the floor is peopled alike in any room)
  for (let k = 0, n = 18; k < n; k++) { const a = (k + 0.5 * rng()) / n * 6.2832, r = lerp(12.5, 14.5, rng()); add('kneel', cen[0] + r * Math.cos(a), cen[2] + r * Math.sin(a), a + Math.PI); }
  for (let k = 0, n = Math.round(46 * o.density); k < n; k++) {
    const a = rng() * 6.2832, r = lerp(18, o.chamberR * 70 / 93, Math.sqrt(rng())), x = cen[0] + r * Math.cos(a), z = cen[2] + r * Math.sin(a);
    if (Math.hypot(x - 144, z) < 31) continue;
    add(rng() < 0.6 ? 'read' : rng() < 0.5 ? 'carry' : 'sleep', x, z, a + Math.PI + lerp(-0.8, 0.8, rng()));
  }
}

// the height of the round chamber's wall (the great spine)
const WALL_H = 30;
// ---------------------------------------------------------------- the small lamps of the night
// At night every figure that stands or kneels holds a small lamp (one who walks his round with an armful has both hands
// full and bears none): its glow sits at the hand, 0.9 m before him, 2.75 m up for one who stands and 1.35 m for one who
// kneels, and stays there (no rod, no swing). The glows are laid once every cast stands as it will, the galleries' and
// the chamber's alike, and each is marked on its figure (glow): the hand lamp's light falls on that robe and no other.
function layHandGlows(lay, people, look) {
  if (!look.handLamp) return;
  for (const f of people) {
    if (f.pose === 'carry') continue;
    f.glow = 1;
    lay.lamps.push({ x: f.x + 0.9 * Math.cos(f.yaw), y: f.y + (f.pose === 'kneel' ? 1.35 : 2.75), z: f.z + 0.9 * Math.sin(f.yaw), on: 0.45, hash: f.hash, rod: 0 });
  }
}

// ---------------------------------------------------------------- everything put together
async function finish(ctx, scene, path, route, look, o) {
  // The round chamber holds the whole well of shaft C: its wall stands 3.7 m beyond the corner of the well's seven cells
  // that lies farthest from the great lamp (104.3 m with the level run of 75 m: a wall at 108 m). No gallery is built
  // on the chamber's level or over it within 9 m of that wall (layCells).
  let wellFar = 0;
  for (const [q, r] of [[0, 0], ...DIRS]) {
    const [x, z] = H.cellXZ(8 + q, r);
    for (let k = 0; k < 6; k++) { const a = (30 + 60 * k) * Math.PI / 180; wellFar = Math.max(wellFar, Math.hypot(x + H.HR * Math.cos(a) - route.centre[0], z + H.HR * Math.sin(a) - route.centre[2])); }
  }
  o.chamberR = Math.round(wellFar + 3.7);
  // the dome's crown stands this high over the chamber's floor (the wall, and the dome's rise of 0.3 of the radius)
  o.domeH = WALL_H + 0.3 * o.chamberR;
  const L = path.length, tU = { value: 0 };
  const pause = () => ctx.yield();
  const lay = await layCells(path, route, look, o, pause);
  await ctx.yield();
  const stairs = layStairs(lay, look);
  await ctx.yield();
  const pl = layPeople(path, route, lay, stairs, look, o), crim = layCrimson(route, lay, pl, o);
  layChamberFolk(route, pl, o);
  layHandGlows(lay, pl.people, look);
  await ctx.yield();
  const air = layAir(path, route, lay, o);
  await ctx.yield();
  const props = await layProps(path, lay, pl.people, o, pause);
  await ctx.yield();
  const geos = { edge: [], corner: [], stair: [H.stairGeometry(), H.stairGeometry(1.35, 14, true)], crim: [crim.geo], ...props.geos };
  await ctx.yield();
  geos.vest = [H.vestibuleGeometry()];
  await ctx.yield();
  for (const kind of ['edge', 'corner']) for (let m = 0; m < 5; m++) { geos[kind].push(H.cellGeometry(kind, m)); await ctx.yield(); }
  const mat = H.makeLibraryMaterial(look);
  const tiles = await H.makeCells(lay.cells.concat(stairs.things, props.things, [crim.thing]), mat, geos, () => ctx.yield());
  scene.add(tiles.object);
  await ctx.yield();
  // the great lamp: a brass ring of globes round the portal, hung by four chains from the dome
  const cen = new THREE.Vector3(route.centre[0], route.yC, route.centre[2]), lampAt = new THREE.Vector3(cen.x, route.yTop, cen.z), wallH = WALL_H;
  const chamber = H.makeChamber({ center: cen, radius: o.chamberR, wallH, well: [144, 0], lamp: lampAt, look });
  scene.add(chamber.object);
  await ctx.yield();
  const brass = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.55, 0.36, 0.13) }), glowMat = new THREE.MeshBasicMaterial({ color: look.lampCol.clone().multiplyScalar(2.2) });
  // (the ring's tube runs 0.8 m inside the circle of the globes; the lowest globes clear the floor by 2.0 m: see LAMP_G)
  const ring = new THREE.Mesh(new THREE.TorusGeometry(LAMP_G - 0.8, 0.42, 8, 48), brass); ring.rotation.y = Math.PI / 2; ring.position.copy(lampAt); scene.add(ring);
  const globes = new THREE.InstancedMesh(new THREE.SphereGeometry(0.7, 10, 8), glowMat, 12), chains = new THREE.InstancedMesh(new THREE.BoxGeometry(0.16, 1, 0.16), brass, 4), m4 = new THREE.Matrix4();
  for (let k = 0; k < 12; k++) {
    const a = (k + 0.5) / 12 * Math.PI * 2, gy = lampAt.y + LAMP_G * Math.sin(a), gz = lampAt.z + LAMP_G * Math.cos(a);
    globes.setMatrixAt(k, m4.makeTranslation(lampAt.x, gy, gz));
    // the globes are fixed to the ring: their glows do not swing (rod 0)
    lay.lamps.push({ x: lampAt.x, y: gy, z: gz, on: 0.7, hash: k / 12, rod: 0 });
  }
  // each chain runs up to the dome's own surface over the place where it hangs (H.domeY: the dome as it is built), and
  // ends 5 cm inside it
  const chainR = Math.hypot(0.6, LAMP_G - 3.1), chainTop = route.yC + H.domeY(o.chamberR, wallH, chainR) + 0.05;
  for (let k = 0; k < 4; k++) {
    const sz = k < 2 ? -1 : 1, sx = k % 2 ? -1 : 1, top = chainTop, y0 = lampAt.y + (LAMP_G - 3.0), len = top - y0;
    chains.setMatrixAt(k, m4.makeScale(1, len, 1).setPosition(lampAt.x + sx * 0.6, y0 + len / 2, lampAt.z + sz * (LAMP_G - 3.1)));
  }
  scene.add(globes, chains);
  await ctx.yield();
  const halos = H.makeHalos(lay.lamps, look);
  await ctx.yield();
  const folk = H.makeLibrarians(pl.people, pl.climbers, look);
  await ctx.yield();
  const pages = await H.makePages(air.drops, o.rPages, look, pause), mirrors = H.makeMirrors(stairs.mirrors, look);
  // moths round every burning lamp of the galleries within 46 m of the line. Their rings are drawn in so that the
  // fullest stays 2.5 m off the line (s = (the lamp's distance to the line - 2.5 - the 0.25 m of bobbing) / the fullest
  // ring, 1 at most); a lamp that would leave them under a third of their ring (the line within 3.4 m of it) has none.
  const mothLamps = [];
  for (const c of lay.cells) if (c.tier < 2) H.LAMPS.forEach((Lm, k) => {
    if (!((c.lampsOn >> k) & 1)) return;
    const w = H.cellToWorld(c, Lm[0], Lm[1], Lm[2]).clone(), sc = Math.min(1, (path.distanceTo(w.x, w.y, w.z) - 2.5 - 0.25) / (H.MOTH_REACH - 0.25));
    if (sc >= 0.33) { w.s = sc; mothLamps.push(w); }
  });
  const moths = H.makeMoths(mothLamps, o.rMoths, Math.max(2, Math.round(4 * o.detail * o.density)));
  scene.add(moths.object);
  scene.add(halos.object, folk.object, pages.object, mirrors.object);
  await ctx.yield();
  // dust in the lamplight (kit), and the sparks that rise from the pictures of the crimson hexagon (kit, a fixed box)
  const dust = fx.makeParticles({ rng: o.rDust, preset: 'dust', time: tU, count: Math.round(2400 * o.detail * o.density), intensity: 0.8 });
  const cc = crim.cell, sparks = fx.makeParticles({ rng: o.rSparks, preset: 'magic', time: tU, follow: false, center: [cc.x, cc.y + 3.6, cc.z], box: [15, 6.4, 12.5], count: Math.round(420 * o.detail * o.density),
    colors: ['#ff5a30', '#ffc24a', '#ff8fb0'], intensity: 1.5 });
  scene.add(dust.object, sparks.object);
  await ctx.yield();
  return compose(ctx, scene, path, route, look, o, { L, tU, mat, halos, folk, pages, mirrors, chamber, dust, sparks, lampAt, tiles, moths });
}

// ---------------------------------------------------------------- the paces, the gaze, the film
function compose(ctx, scene, path, route, look, o, P) {
  const L = P.L, v3 = new THREE.Vector3(), s = route.hand;
  // places on the route in metres from its start (found on the line itself at every half metre)
  const mOf = (x, y, z) => { let best = 1e9, bm = 0; for (let m = 0; m <= L; m += 0.5) { path.posAtDist(m, v3); const d = (v3.x - x) ** 2 + (v3.y - y) ** 2 + (v3.z - z) ** 2; if (d < best) { best = d; bm = m; } } return bm; };
  // the places the paces and pulls are told by, each a thing that stands in the world:
  //   mRail0   the middle of the start gallery's rail, where the line goes out over shaft A
  //   mRail1   the middle of G1's rail, where the descent comes in from shaft A
  //   mRail2   the middle of G2's rail, where the line goes out over shaft B
  //   mCrimIn, mCrimOut   the crimson hexagon's two rails
  //   mTop     the place over the well where the rise ends (16.5 m from C's axis); mLevel the knot 15 m on
  const mRail0 = mOf(route.rail0[0], EYE, route.rail0[1]), mRail1 = mOf(18, route.yE, -ROW * route.mz), mRail2 = mOf(54, route.yE, -ROW * route.mz);
  const mCrimIn = mOf(99, route.yE, 0), mCrimOut = mOf(117, route.yE, 0), mTop = mOf(route.top[0], route.top[1], route.top[2]), mLevel = mOf(route.level[0], route.level[1], route.level[2]);
  // metres a second between places (each change is eased over the metres given):
  //   6.2 from the start, through the two galleries and out over the rail;
  //   6.7 in the helix, taken up over 24 m from 38 m past the start rail (20 m past the place where the line touches
  //       the helix: the descent is then well under way, its slope 66 to 81 in a hundred of its steepest; it comes
  //       within a twentieth of the steepest 43 m past the rail on the three-floor ways, 48 m on the four-floor ways),
  //       the pace its radius allows the eye (under 30 degrees a second);
  //   10.5 across shaft B, taken up over 14 m from 2 m before G2's rail;
  //   5.2 in the crimson hexagon, slowed over 16 m ending 1 m before its first rail;
  //   8.0 up the last shaft, taken up over 15 m from 2 m before the hexagon's far rail;
  //   10.0 on the level run, taken up over the 30 m from where the rise ends.
  // (the place where the line touches the helix, and the end of the turn, a quarter past: for the pull's middle)
  const mTouch = mOf(route.touch[0], EYE, route.touch[1]), mArcEnd = mOf(0, route.yE, -ROW * route.mz);
  const S = smoothstep;
  const speed = (m) => 6.2 + 0.5 * S(mRail0 + 38, mRail0 + 62, m) + 3.8 * S(mRail2 - 2, mRail2 + 12, m)
    - 5.3 * S(mCrimIn - 17, mCrimIn - 1, m) + 2.8 * S(mCrimOut - 2, mCrimOut + 13, m) + 2.0 * S(mTop, mTop + 30, m);
  // (the paces sum to 48.3 s where the descent is three floors and to 51.2 s where it is four: a flight lasts 50 s at
  // the most, so on the longer way every pace is flown 2.4 % faster, the same all along)
  let T = 0; for (let m = 0.25; m < L; m += 0.5) T += 0.5 / speed(m);
  const duration = clamp(T, 36, 50), mean = L / T;
  // The two pulls of the gaze, one at a time.
  // In the descent, toward the middle of the circle the eye winds round, 9 m below the eye (worked out from u in its own
  // function; that middle begins 0.6 m beyond A's axis and comes on to it as the turn goes round): from 36 m past the start
  // rail (the descent is under way there: its slope is 56 to 73 in a hundred of its steepest) to 12 m before G1's rail,
  // rising and falling over 0.4 of that span (18.0 m each end on the three-floor ways, 25.6 m on the four-floor ways).
  // In the rise, toward the great lamp (a fixed place), so the eye comes up through the well looking at it: from 6 m
  // past the crimson hexagon's far rail to 26 m past the place where the rise ends, rising and falling over 0.3 of
  // that span (20 m each end).
  const g1 = new THREE.Vector3();
  const pois = [
    { at: (time, u) => { path.pointAt(u, g1); const k = 0.6 * (1 - clamp((u * L - mTouch) / (mArcEnd - mTouch), 0, 1)) / ROW; return g1.set(-route.touch[0] * k, g1.y - 9, -route.touch[1] * k); }, from: (mRail0 + 36) / L, to: (mRail1 - 12) / L, weight: 0.26, fade: 0.4 },
    { at: P.lampAt, from: (mCrimOut + 6) / L, to: (mTop + 26) / L, weight: 0.5, fade: 0.3 },
  ];
  const size = new THREE.Vector2();
  const sets = [P.mat.uniforms, P.halos.uniforms, P.folk.uniforms, P.pages.uniforms, P.mirrors.uniforms, P.chamber.uniforms, P.moths.uniforms];
  return {
    scene, path, duration,
    pace: (u) => speed(u * L) / mean,
    camera: { fov: 64, near: 0.25, far: 900, lookAhead: 12, sway: 0.5, bank: 0.2 },
    pois,
    // the next world is called for from 10 m before G1's rail, the foot of the descent (some 235 m before the ring), so
    // that its build is done before the slow crimson hexagon and the rise, whence the ring is first seen
    portal: { shape: 'circle', radius: 7, color: '#ffd98a', glow: 0.8, revealDistance: Math.round(L - mRail1 + 10) },
    post: { exposure: look.handLamp ? 1.35 : 1.2, bloom: { strength: 0.5, radius: 0.7, threshold: 0.92 },
      grade: { saturation: 1.06, contrast: 1.05, tint: '#ffffff', shadowTint: '#0b0812', vignette: 0.34, grain: 0.02, aberration: 0 } },
    update(dt, time, camera, u) {
      P.tU.value = time;
      for (const un of sets) un.uTime.value = time;
      ctx.renderer.getDrawingBufferSize(size);
      P.halos.uniforms.uPx.value = size.y * 0.8; P.moths.uniforms.uPx.value = size.y * 0.8;
      P.dust.update(dt, time, camera); P.sparks.update(dt, time, camera);
    },
    dispose() {},
    info: { hour: o.hour, turn: route.turn, nDown: route.nDown, hand: s, mirror: route.mz, district: o.district, rare: o.rare, seconds: T, metres: L, places: { mRail0, mRail1, mRail2, mCrimIn, mCrimOut, mTop, mLevel } },
  };
}
