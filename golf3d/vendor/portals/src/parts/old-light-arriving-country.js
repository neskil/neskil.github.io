// OLD LIGHT ARRIVING, the country: where the boats lie and go, the houses, the people and their lights, the trees.
// Everything is laid by the land's and the river's own coordinates in the unmirrored frame; the route is only asked for clearance.
import * as THREE from 'three';
import { clamp, smoothstep } from '../kit/core.js';
import { PEOPLE_KEEP, STAR_DIR, TAN_EL, groundH, starLit, townLit, southH, waterD, southG, terraceK, terrT, QUAY_Z, CREST_Z, NORTH_Z, BOWL, bowlXZ, bowlLA, LANE, KNOLL_L, KNOLL_R, southShore, northShore, DEG, RIVER, crestH, BENCH, LOW, WAY, wayD, HALLS, backStairX } from './old-light-arriving-common.js';
import { BOATS, boatGeometry, makeCraft, makeSprites, makeWakes, makeBlades, makeFigures, makeReeds, solidBuilder, makeSolid, fleetLength, fleetAt, houseGeometry, HOUSES, heldAt, TOWN_CLOTHS } from './old-light-arriving-life.js';
import * as flora from '../kit/flora.js';
import { makeSmoke, SMOKE_RISE, SMOKE_LEAN } from './old-light-arriving-wild.js';

// ---- clearance. route: the route's own points every 3 m in the unmirrored frame, [x, y, z, ...]. THE LEAST keep-clear, for anything at
// all: 7 m from the route's line, 15 m round the entry point. Each kind of thing has ONE declared clearance of its own on top of that:
// masts 60 m, barges 30 (BARGE_KEEP), sailing boats 26 (SAIL_KEEP), the great barge 20 (GREAT_KEEP), trees 22 (TREE_KEEP), a chimney's
// plume 11 along its line (SMOKE_KEEP) and 7 at its puffs' edges, people 28.5 (PEOPLE_KEEP, in the common part), the hill's shrubs 8 and their size (SHRUB_KEEP, there too).
// THE LINE BEHIND THE ENTRY (BACK): while this world is seen through the frame it is entered by, the eye stands BEHIND the entry on the
// entry frame's own level axis, so that line is kept clear as the entry's own point is: no ground and no solid within BACK.keep metres
// of it for BACK.len metres back. It is laid here from the road's first two points (level, straight back from the entry), every 3 m,
// and every box asked of the road is asked of it too: a berth, a lane, a tree or a house that would stand there is not dealt.
// stats: the least distances the build finds on this seed's own deal (back: from that line to the nearest solid or ground; fleet: from
// the road to a craft under way, anywhere on its lane's whole course), noted by note() and asked by the world when all is laid.
export const BACK = { len: 340, keep: 15 };
export function makeClear(route) {
  const n = route.length / 3, pts = Array.from(route), bx = route[0] - route[3], bz = route[2] - route[5], bl = Math.hypot(bx, bz) || 1;
  for (let d = 3; d <= BACK.len; d += 3) pts.push(route[0] + bx / bl * d, route[1], route[2] + bz / bl * d);
  const N = pts.length / 3;
  const least = (x, y, z, i0, i1) => { let d = 1e9; for (let i = i0; i < i1; i++) { const dx = pts[i * 3] - x, dy = pts[i * 3 + 1] - y, dz = pts[i * 3 + 2] - z, q = dx * dx + dy * dy + dz * dz; if (q < d) d = q; } return Math.sqrt(d); };
  // the least distance from the route to a point; and from the line behind the entry to a point
  const dist = (x, y, z) => least(x, y, z, 0, n), back = (x, y, z) => Math.min(least(x, y, z, n, N), least(x, y, z, 0, 1));
  // how far point i of the road (or of the line behind the entry) is from an upright box (middle cx, cz; heading's cosine and sine;
  // half width hw, half length hl; from the ground to top)
  const boxD = (i, cx, cz, ch, sh, hw, hl, top) => { const dx = pts[i * 3] - cx, dz = pts[i * 3 + 2] - cz, lx = dx * ch - dz * sh, lz = dx * sh + dz * ch;
    const ex = Math.max(Math.abs(lx) - hw, 0), ez = Math.max(Math.abs(lz) - hl, 0), ey = Math.max(pts[i * 3 + 1] - top, 0); return Math.sqrt(ex * ex + ey * ey + ez * ez); };
  // is an upright box clear of the route, and of the line behind the entry?
  // (keep: a wider keep-clear for the things the road's rule holds off: see K5 in the report)
  const box = (cx, cz, hd, hw, hl, top, keep = 7) => { const ch = Math.cos(hd), sh = Math.sin(hd);
    for (let i = 0; i < N; i++) if (boxD(i, cx, cz, ch, sh, hw, hl, top) < (i >= n ? BACK.keep : Math.max(i < 5 ? 15 : 7, keep))) return false;
    return true; };
  // the same box's least distances: [from the road, from the line behind the entry]
  const gaps = (cx, cz, hd, hw, hl, top) => { const ch = Math.cos(hd), sh = Math.sin(hd); let a = 1e9, b = 1e9;
    for (let i = 0; i < N; i++) { const d = boxD(i, cx, cz, ch, sh, hw, hl, top); if (i < n) a = Math.min(a, d); if (i >= n || i === 0) b = Math.min(b, d); }
    return [a, b]; };
  const stats = { back: 1e9, backBy: '', fleet: 1e9, smoke: 1e9, smokeLine: 1e9 };
  const note = (key, d, by) => { if (d < stats[key]) { stats[key] = d; if (by) stats[key + 'By'] = by; } };
  return { dist, back, box, gaps, stats, note, line: pts.slice(n * 3) };
}
// THE TREES' ONE CLEARANCE: no tree stands with any part of its crown nearer the road's line than this (a tree is a tall thing seen whole
// from the road, as a mast is; see the road's rule in layBoats)
export const TREE_KEEP = 22;
const LEAF_AMBIENT = 4.4;      // the kit's leaves: how many times the sky's fill they take (set on the whole country; the trees' shade from the star is reckoned with it)
// A CHIMNEY PLUME'S ONE CLEARANCE: metres from the road's line to the plume's middle line (a puff's radius is 3.8 m where it dies, so its
// edge then stands 7.2 m from the road's line: outside the least keep-clear)
export const SMOKE_KEEP = 11;
// a point of a boat's own frame on the map, for a boat lying still
const onBoat = (b, px, pz) => { const ch = Math.cos(b.m[2]), sh = Math.sin(b.m[2]), k = b.s[0]; return [b.m[0] + (px * ch + pz * sh) * k, b.m[1] + (-px * sh + pz * ch) * k]; };

// ---- the boats: the fleet under way up the left half of the lower river, boats at anchor on its right half, the great barge at the
// quay, and on the basin the ranks rafted off the hill's landing stages and the craft lying out on the broad water.
// Returns the items of every draw; the lamps and the people on board ride each boat's own course.
export async function layBoats(S, clear, fleet, pause = async () => {}) {
  let R = S.boats; const barges = [], sails = [], great = [], lamps = [], sparks = [], people = [], wakes = [], stages = [], tethers = [];
  const addLamps = (kind, b) => {      // lamp strings from the mast to bow and stern, canopy lamps, the masthead lamp
    const L = (p, size, bright, sway = 0) => lamps.push({ p, size, bright, ph: R() * 6.283, sway, m: b.m, s: b.s });
    if (kind === 'barge') {
      L([0, 12.2, -13], 0.3, 3.5);
      for (let i = 1; i <= 8; i++) { const t = i / 9; L([0, 12 + (4.6 - 12) * t - 5.2 * t * (1 - t), -13 + 33 * t], 0.17, 3.5, 0.1); }
      for (let i = 1; i <= 3; i++) { const t = i / 4; L([0, 12 + (3.4 - 12) * t - 2.2 * t * (1 - t), -13 - 8.4 * t], 0.17, 3.5, 0.08); }
      for (const x of [-4.2, 4.2]) for (let z = -7.5; z <= 10; z += 4.4) L([x, 4.05, z], 0.2, 3.5, 0.05);
    } else if (kind === 'sail') { L([0, 9.6, -1], 0.24, 3.5); L([0, 1.7, 4.4], 0.15, 3.5);
    } else { L([0, 24.3, -6], 0.42, 3.5);
      for (const [w, z0, z1, y] of [[7.4, -34, 34, 2.4], [6.2, -27, 27, 6.2], [5, -19, 20, 10]]) for (const x of [-w - 0.9, w + 0.9]) for (let z = z0; z <= z1; z += 4.25) L([x, y + 2.95, z], 0.2, 3.5, 0.04); }
  };
  // people on board, with their held globes. A craft under way carries them if its whole lane keeps the people's clearance (peopleFar);
  // a craft at anchor is dealt them if its hull's middle stands beyond the clearance and half its own length, and then EACH PERSON'S
  // OWN PLACE on the deck is asked: no one stands within PEOPLE_KEEP of the road. The great barge's people are dealt from a stream of
  // their own (aboard), each to a place on one of its three decks, and each place is asked the same; aboard: how many came aboard.
  let aboard = 0;
  const addPeople = (kind, b, far) => {
    if (!far || kind === 'sail') return;
    const Q = kind === 'great' ? S.aboard : R, n = kind === 'great' ? 70 : 9 + Math.floor(Q() * 7);
    for (let i = 0; i < n; i++) {
      const p = kind === 'great' ? (() => { const d = Math.floor(Q() * 3), w = [7, 5.8, 4.6][d], z0 = [-33, -26, -18][d], z1 = [33, 26, 19][d]; return [(Q() < 0.5 ? -1 : 1) * (w - 0.4), [2.9, 6.7, 10.5][d], z0 + (z1 - z0) * Q()]; })()
        : [(Q() * 2 - 1) * 3.4, 1.55, Q() < 0.75 ? -7.5 + 17 * Q() : -19 + 9 * Q()];
      const h = Q() < 0.6 ? 1.1 : 1.7, tint = Math.floor(Q() * 5), lamp = kind === 'great' || Q() < 1 / 3, ph = lamp ? Q() * 6.283 : 0;      // (everyone on the great barge holds a globe: no number is drawn to ask it)
      if (b.s[1] > 0.5) { const w = onBoat(b, p[0], p[2]); if (clear.dist(w[0], p[1] * b.s[0] + 1, w[1]) < PEOPLE_KEEP) continue; }      // (at anchor: this person's own place)
      people.push({ p, h, tint, lamp, ph, m: b.m, s: [b.s[0], b.s[1], 1, 0] }); if (kind === 'great') aboard++;
      if (lamp) sparks.push({ p: heldAt(p, h, ph), size: 0.085, bright: 2, ph, m: b.m, s: b.s });      // (the globe a person holds hangs low at one side)
    }
  };
  // --- the fleet under way, on the left half of the river: so many boats to a hundred metres of river along the WHOLE course (from the
  // arm below the entry to the mooring pool), each lane at one speed so that no boat overhauls another. THE ROAD'S RULE (one rule for
  // everything that stands or goes beside the road): a mast with its pennant keeps 60 m from the road's line, a barge 30 m and a sailing
  // boat 26 m, all along its course: each is passed at more than twice the height of its own masthead (12 m and 9.4 m, with their
  // sway), the water a flying road leaves to the craft under it. THE GREAT BARGE is a
  // kind of its own with a clearance of its own, 20 m: it is the one craft too long to turn in the reach, so it lies where the quay is
  // deep enough for it, hard by the stair's foot; where the road passes nearest it (21.9 m off) the road is 18.4 m up: over its
  // upper deck (10.5 m) and under its masthead (24 m).
  // THE LANES: the fleet's half of the river is ruled into ten lanes at one even pitch of 8 m, from 30 m to 102 m left of the river's
  // middle; the barges keep every second lane of the inner eight (so two barges are never abreast in neighbouring lanes) and the sailing
  // boats the rest. ONE LAW OF DENSITY for every lane: so many craft to a hundred metres of course, thinned on a sparse evening by the
  // one factor SPARSE (never under half a full evening's river).
  const BARGE_KEEP = 30, SAIL_KEEP = 26, GREAT_KEEP = 20, LANE_0 = -30, LANE_PITCH = 8, SPARSE = 0.5 + 0.5 * fleet;
  // (a lane is kept only if a craft of its kind, at its largest, is clear AT EVERY PLACE ON THE LANE'S WHOLE COURSE: so it is clear at
  // every phase of the clock, whenever the world is entered. The kept lane's least distances are then counted and noted, and the build
  // fails if the count disagrees with the rule.)
  const laneClear = (o, hw, hl, top, keep) => { const L = fleetLength(o); for (let d = 0; d < L; d += 3) { const c = fleetAt(o, d); if (!clear.box(c[0], c[1], c[2], hw, hl, top, keep)) return false; }
    let a = 1e9, b = 1e9; for (let d = 0; d < L; d += 3) { const c = fleetAt(o, d), g = clear.gaps(c[0], c[1], c[2], hw, hl, top); a = Math.min(a, g[0]); b = Math.min(b, g[1]); }
    if (a < keep || b < BACK.keep) throw new Error('old-light-arriving: a craft under way in lane ' + o + ' comes within ' + a.toFixed(1) + ' m of the road, ' + b.toFixed(1) + ' m of the line behind the entry');
    clear.note('fleet', a); clear.note('back', b, 'a craft under way'); return true; };
  const peopleFar = (o) => { let m = 1e9; for (let d = 0, L = fleetLength(o); d < L; d += 6) { const c = fleetAt(o, d); m = Math.min(m, clear.dist(c[0], 3, c[1])); } return m > PEOPLE_KEEP + 4.5; };      // (the lane's middle line; a barge's deck reaches 3.4 m to either side of it)
  for (const lane of [2, 4, 6, 8]) {      // the barges' lanes
    const o = LANE_0 - LANE_PITCH * lane, L = fleetLength(o);
    if (!laneClear(o, 4.5 * 1.15, 22 * 1.15, 12.4 * 1.15, BARGE_KEEP)) continue;
    const speed = R.range(3, 5), n = Math.max(1, Math.round(L / 100 * (0.95 + 0.3 * R()) * SPARSE)), sc = [];
    for (let i = 0; i < n; i++) sc.push(R.range(0.72, 1.15));
    const far = peopleFar(o), ph = R() * L;
    for (let i = 0; i < n; i++) { const b = { m: [o, (ph + (i + 0.5 * R()) * L / n) % L, speed, R() * 6.283], s: [sc[i], 0, 1, R()] };
      barges.push(b); addLamps('barge', b); addPeople('barge', b, far); wakes.push({ m: b.m, s: b.s, stern: 21 }); }
    await pause();
  }
  await pause();
  // the small sailing boats' lanes: the two nearest the river's middle, the ones between the barges' and the outermost
  for (const lane of [0, 1, 3, 5, 7, 9]) {
    const o = LANE_0 - LANE_PITCH * lane, L = fleetLength(o);
    if (!laneClear(o, 1.5 * 1.2, 5 * 1.2, 9.8 * 1.2, SAIL_KEEP)) continue;
    const speed = R.range(3, 5), n = Math.max(1, Math.round(L / 100 * (2 + 0.6 * R()) * SPARSE)), ph = R() * L;
    for (let i = 0; i < n; i++) { const b = { m: [o, (ph + (i + 0.6 * R()) * L / n) % L, speed, R() * 6.283], s: [R.range(0.8, 1.2), 0, 1, R()] };
      sails.push(b); addLamps('sail', b); wakes.push({ m: b.m, s: [b.s[0] * 0.45, 0, 1, 0], stern: 11 }); }
    await pause();
  }
  await pause();
  // --- at anchor on the right half of the lower river, lying to the current (a boat here could only go on by crossing under the route).
  // (Every craft at anchor is dealt from the berths' own stream: a berth is tried and given up where the road's rule, the water's
  // depth or a neighbour forbids it, and the fleet under way, dealt above from the boats' stream, is not touched by that.)
  R = S.berths;
  const lying = [], apart = (x, z, r) => lying.every((q) => Math.hypot(q[0] - x, q[1] - z) > r + q[2]);
  const still = (kind, x, z, hd, sc, tries = 1) => { const B = BOATS[kind];
    if (waterD(x, z) > -B.beam * 0.5 * sc - 1 && kind !== 'great') return null;
    if (!clear.box(x, z, hd, B.beam * 0.5 * sc, B.len * 0.5 * sc, B.top * sc + 0.5, kind === 'sail' ? SAIL_KEEP : kind === 'great' ? GREAT_KEEP : BARGE_KEEP) || !apart(x, z, B.beam * 0.55 * sc)) return null;
    const b = { m: [x, z, hd, R() * 6.283], s: [sc, 1, 1, R()] }; lying.push([x, z, B.beam * 0.55 * sc]);
    clear.note('back', clear.gaps(x, z, hd, B.beam * 0.5 * sc, B.len * 0.5 * sc, B.top * sc + 0.5)[1], kind + ' at anchor');
    (kind === 'barge' ? barges : kind === 'sail' ? sails : great).push(b); addLamps(kind, b);
    addPeople(kind, b, kind === 'great' || clear.dist(x, 3, z) > PEOPLE_KEEP + B.len * 0.5 * sc); return b; };      // (the hull's middle beyond the people's clearance and half its own length; each person's own place is then asked in addPeople)
  // first of all the great barge of three lit decks, which lies along the quay, right of the stair's foot (a kind of its own: GREAT_KEEP
  // above); every other craft at anchor finds its berth clear of it
  still('great', 75, QUAY_Z + 19, Math.PI / 2, 1);
  // A NAMED THING OF THE DESIGN IS NEVER LEFT OUT IN SILENCE: if a clearance drops the great barge, or leaves no one on its decks, the
  // build fails and says so
  if (!great.length) throw new Error('old-light-arriving: the great barge was not built (its clearance GREAT_KEEP dropped it)');
  if (aboard < 20) throw new Error(`old-light-arriving: only ${aboard} people stand on the great barge's decks (the people's clearance dropped the rest)`);
  for (let i = 0, want = Math.round(15 * SPARSE), got = 0; i < 60 && got < want; i++) {      // barges, some rafted two abreast
    const x = R.range(40, 106), z = R.range(-232, 100), hd = R.range(-0.1, 0.1), sc = R.range(0.75, 1.15), b = still('barge', x, z, hd, sc);
    if (!b) continue; got++;
    if (R() < 0.4) { const p = onBoat({ m: [x, z, hd], s: [1] }, 10.2 * sc, R.range(-4, 4)); if (still('barge', p[0], p[1], hd, sc * R.range(0.85, 1))) got++; }
  }
  for (let i = 0, want = Math.round(80 * SPARSE), got = 0; i < 500 && got < want; i++) if (still('sail', R.range(15, 113), R.range(-250, 100), R.range(-0.3, 0.3), R.range(0.8, 1.2))) got++;
  await pause();
  // and at anchor in the quay's pool on the left, beyond the fleet's turn into the reach and round the reed island (not on it)
  for (let i = 0, want = Math.round(34 * SPARSE), got = 0; i < 300 && got < want; i++) { const x = R.range(-113, -15), z = R.range(-262, -152);
    if (((x + 60) / 19) ** 2 + ((z + 150) / 27) ** 2 < 1) continue; if (still('sail', x, z, R.range(-0.3, 0.3), R.range(0.8, 1.2))) got++; }
  await pause();
  // smaller barges along the quay to the west
  for (let x = -292; x < 20; x += R.range(54, 78)) still('barge', x, QUAY_Z + 8 + R() * 1.5, (R() < 0.5 ? 1 : -1) * Math.PI / 2, R.range(0.8, 1.2));
  await pause();
  // --- the basin: nothing is under way. Landing stages ring the hill's near foot; boats lie rafted off them in ranks, bows to the hill
  const rafted = [];
  for (let i = 0; i < 9; i++) {
    const f = (-75 + 18.75 * i + R.range(-3, 3)) * DEG, dl = Math.sin(f), da = -Math.cos(f), at = (r, off) => bowlXZ(dl * r - da * off, da * r + dl * off);
    const c = at(193, 0), hd = Math.atan2(c[0] - BOWL.c[0], c[1] - BOWL.c[1]);      // bows toward the hill's middle
    stages.push({ x: c[0], z: c[1], hd, hw: 3.6, hl: 8 });
    for (let rank = 0, r0 = 203; rank < 2; rank++) { if (rank && R() < 0.4) break;
      const n = 3 + Math.floor(R() * 3) - rank, sc = R.range(0.8, 1.2);
      for (let j = 0; j < n; j++) { const s2 = sc * R.range(0.8, 1), p = at(r0 + 22 * sc + R.range(-7, 7), (j - (n - 1) / 2) * 11.6 * sc + R.range(-0.8, 0.8)), b = still('barge', p[0], p[1], hd + R.range(-0.07, 0.07), s2); if (b) rafted.push(b); }      // (a rank lies loosely: no two boats alike or quite in line)
      for (const e of [-1, 1]) if (R() < 0.7) { const p = at(r0 + 8, e * ((n + 1) / 2 * 10.4 * sc + 3 * R())); still('sail', p[0], p[1], hd + R.range(-0.4, 0.4), R.range(0.8, 1.2)); }
      r0 += 44 * sc + 8; }
  }
  // craft lying out on the broad water to left and right, in small rafts, so that the basin is peopled as far as it runs
  for (let i = 0; i < 26; i++) {
    const x = R.range(-1100, 1300), z = R.range(-940, -510), hd = R() * 6.283, n = 1 + Math.floor(R() * 3), sc = R.range(0.8, 1.3);
    if (Math.hypot(x - BOWL.c[0], z - BOWL.c[1]) < 330 || z < northShore(x) + 60 || z > southShore(x) - 50) continue;
    for (let j = 0; j < n; j++) { const p = onBoat({ m: [x, z, hd], s: [1] }, (j - (n - 1) / 2) * 10.4 * sc, R.range(-3, 3)), b = still('barge', p[0], p[1], hd, sc); if (b && Math.abs(x - 100) < 520) rafted.push(b); }
    for (let j = 0; j < 2; j++) still('sail', x + R.range(-60, 60), z + R.range(-40, 40), R() * 6.283, R.range(0.8, 1.2));
  }
  await pause();
  return { barges, sails, great, lamps, sparks, people, wakes, stages, rafted, aboard };
}

// a box turned on the map: middle (cx, cz), heading hd (its length runs along the heading), from y0 to y1
function obox(sb, cx, cz, hd, hw, hl, y0, y1, col, lit) {
  const P = sb.G.P, N = sb.G.N, from = P.length; sb.box(-hw, hw, y0, y1, -hl, hl, col, lit);
  const ch = Math.cos(hd), sh = Math.sin(hd);
  for (let i = from; i < P.length; i += 3) { const x = P[i], z = P[i + 2], nx = N[i], nz = N[i + 2]; P[i] = cx + x * ch + z * sh; P[i + 2] = cz - x * sh + z * ch; N[i] = nx * ch + nz * sh; N[i + 2] = -nx * sh + nz * ch; }
}
const STONE = [0.3, 0.31, 0.35], TIMBER = [0.075, 0.065, 0.06];
// the bearing every watcher of the country faces, on the map: the new star's
const FACE = (() => { const n = Math.hypot(STAR_DIR.x, STAR_DIR.z); return [STAR_DIR.x / n, STAR_DIR.z / n]; })();

// ---- the whole country's life, assembled. P: { LU, RU, S (the streams), clear, fleet, yieldFn }
export async function makeCountry(P) {
  const { LU, RU, S, clear, fleet } = P, group = new THREE.Group(), sb = solidBuilder();
  const lamps = [], sparks = [], people = [], blades = [];
  // ---- boats
  const B = await layBoats(S, clear, fleet, P.yieldFn);
  // (the line behind the entry and the LAND: every point of ground above the water within 150 m of that line, on a 3 m grid of the map,
  // is asked how far it stands from it; the nearest is noted with the boats' own. It is the river's bank, and everything that stands on
  // land, the town, the trees, the people, stands farther off than its nearest ground.)
  { const L = clear.line, e = L.length - 3, x0 = Math.min(L[0], L[e]) - 150, x1 = Math.max(L[0], L[e]) + 150, z0 = Math.min(L[2], L[e + 2]) - 30, z1 = Math.max(L[2], L[e + 2]) + 30;
    for (let x = x0; x <= x1; x += 3) { for (let z = z0; z <= z1; z += 3) { const g = groundH(x, z); if (g > 0.02) clear.note('back', clear.back(x, Math.min(g, L[1]), z), 'the ground'); }
      if (P.yieldFn && Math.round((x - x0) / 3) % 12 === 11) await P.yieldFn(); } }
  if (P.yieldFn) await P.yieldFn();
  const lit = (kind) => (b) => ({ m: b.m, s: b.s, lit: b.s[1] > 0.5 ? starLit(b.m[0], BOATS[kind].top * 0.3, b.m[1]) : 0 });
  for (const kind of ['barge', 'sail', 'great']) { const list = kind === 'barge' ? B.barges : kind === 'sail' ? B.sails : B.great; if (list.length) group.add(makeCraft(LU, boatGeometry(kind), list.map(lit(kind))).object); }
  group.add(makeWakes(LU, B.wakes).object);
  for (const st of B.stages) { const l = starLit(st.x, 2, st.z); obox(sb, st.x, st.z, st.hd, st.hw, st.hl, -1, 1.3, STONE, l);
    for (const e of [-1, 1]) for (const f of [-1, 0.2]) { const ch = Math.cos(st.hd), sh = Math.sin(st.hd), px = e * (st.hw - 0.3), pz = f * (st.hl - 0.5), x = st.x + px * ch + pz * sh, z = st.z - px * sh + pz * ch;
      sb.pole([x, 1.3, z], [x, 4.6, z], 0.09, TIMBER, l); lamps.push({ p: [x, 4.8, z], size: 0.22, bright: 3.5, ph: S.boats() * 6.283 }); } }
  lamps.push(...B.lamps); sparks.push(...B.sparks); people.push(...B.people.map((q) => ({ ...q, lit: 0 })));
  // ---- the two boat halls. The fleet goes one way, so its course has a beginning and an end, and nowhere on open water can a boat
  // honestly come from nothing or go to nothing. The arm's north half (the half the lanes use) is roofed from HALL_AHEAD before the place
  // where the course begins to HALL_BACK behind it; the mooring pool south of the cut is roofed from bank to bank, from the cut's bank to
  // its head. Each hall is closed by walls on every side but its mouth, which faces along the course, and stands HALL_H high, over the
  // tallest masthead. Every size is from the river's own lines; nothing here knows the road. (That no place on the road can see a boat
  // begin or end was then measured, with and without the land between: shots/old-light-arriving/sight.mjs.)
  { const V = RIVER, HALL_AHEAD = 100, HALL_BACK = 50, HALL_H = 19, T = 1.2, WALL = [0.12, 0.12, 0.135], ROOF = [0.1, 0.105, 0.12];
    const hall = (x0, x1, z0, z1, walls) => { const l = starLit((x0 + x1) / 2, HALL_H + 1, (z0 + z1) / 2);
      for (const w of walls) sb.box(w[0], w[1], 0, HALL_H, w[2], w[3], WALL, l);
      sb.box(x0 - 2, x1 + 2, HALL_H, HALL_H + T, z0 - 2, z1 + 2, ROOF, l); };
    { const x0 = LANE + V.ARM - HALL_AHEAD, x1 = LANE + V.ARM + HALL_BACK, z0 = V.ZB + V.ARMW / 2, z1 = V.ZB + V.ARMW;      // its mouth faces west, down the arm
      hall(x0, x1, z0, z1, [[x0, x1, z0, z0 + T], [x0, x1, z1 - T, z1], [x1 - T, x1, z0, z1]]); }
    { const x0 = -(V.XK + V.POOLW), x1 = -V.XK, z0 = -40, z1 = V.ZE + 40;                                                    // its mouth faces the cut
      hall(x0, x1, z0, z1, [[x0, x0 + T, z0, z1], [x1 - T, x1, z0, z1], [x0, x1, z1 - T, z1]]); } }
  if (P.yieldFn) await P.yieldFn();
  const C = { group, sb, lamps, sparks, people, blades, glows: [], rafted: B.rafted, boats: B };
  const sites = await layHouses(P, C);
  if (P.yieldFn) await P.yieldFn();
  // a few chimneys' smoke: one house in four (the crest's halls apart) keeps a fire in (a plain stone stack on its roof, a thin plume over it), wherever the
  // plume's line, from the stack to where it dies downwind, keeps SMOKE_KEEP metres from the road's line at five places along it.
  // THEN THE PLUME AS THE CLOCK DRAWS IT is asked whole: at every age of a puff (forty places along the line), with the puff's own
  // wander (0.6 m at the most) and its radius there (0.5 to 3.8 m), its EDGE keeps PUFF_KEEP metres from the road, or the house
  // keeps no fire. The least edge of the plumes that stand is noted, and the world asks it once more against the road's keep-clear.
  { const plumes = [], Q = S.smoke, wd = P.wind || [0.9, -0.44], wl = Math.hypot(wd[0], wd[1]) || 1, PUFF_KEEP = 7;
    for (const o of sites) { const cx = o.x - o.dx * 1.4, cz = o.z - o.dz * 1.4, top = o.y + o.top; let ok = true;
      const at = (a) => clear.dist(cx + wd[0] / wl * SMOKE_LEAN * a * a, top + 0.8 + SMOKE_RISE * a, cz + wd[1] / wl * SMOKE_LEAN * a * a);
      for (let a = 0; a <= 1 && ok; a += 0.25) ok = at(a) > SMOKE_KEEP;
      if (!ok || o.hall || Q() >= 1 / 4) continue;      // (a hall keeps no hearth: no number is drawn for it)
      let line = 1e9, edge = 1e9; for (let k = 0; k <= 40; k++) { const a = k / 40, g = at(a); line = Math.min(line, g); edge = Math.min(edge, g - 0.6 * a - (0.5 + 3.3 * a)); }
      if (edge < PUFF_KEEP) continue;
      clear.note('smoke', edge); clear.note('smokeLine', line);
      sb.box(cx - 0.42, cx + 0.42, top - 1.3, top + 0.8, cz - 0.42, cz + 0.42, STONE, starLit(cx, top, cz)); plumes.push({ p: [cx, top + 0.8, cz], ph: Q() }); }
    if (plumes.length) group.add(makeSmoke(LU, RU, plumes, wd).object); }
  C.trees = await layTrees(P, C, sites); C.sites = sites;
  if (P.skyEyes) C.skyline = skyline(P.skyEyes, sites, C.trees.crowns, C.trees.open);
  await layPeople(P, C, sites);
  if (P.yieldFn) await P.yieldFn();
  // reed beds: the reed island in the lower river and beds in the shallows under both banks
  { const R = P.S.reeds, reeds = [], REED_ISLAND = [-60, -150];
    for (let i = 0; i < 2000; i++) { const a = R() * 6.283, r = Math.sqrt(R()), x = REED_ISLAND[0] + Math.cos(a) * r * 13, z = REED_ISLAND[1] + Math.sin(a) * r * 21; reeds.push({ x, z, h: R.range(1.5, 2.4) * (1.1 - 0.4 * r), ph: R() * 6.283 }); }
    if (P.yieldFn) await P.yieldFn();
    for (let i = 0; i < 2600; i++) { const sd = R() < 0.5 ? -1 : 1, z = R.range(sd > 0 ? QUAY_Z + 20 : -38, 102), x = sd * (LANE - R.range(0.4, 4.5)), ph = R() * 6.283, h = R.range(1.4, 2.3);
      if (Math.sin(z * 0.045 + sd) + Math.sin(z * 0.013 + 2) < 0.25) continue; reeds.push({ x, z, h, ph }); }
    if (P.yieldFn) await P.yieldFn();
    if (reeds.length) group.add(makeReeds(P.LU, reeds, P.wind || [0.9, -0.44]).object); }
  if (P.yieldFn) await P.yieldFn();
  return C;
}
// the draws that close the country: one mesh of standing things, the people, the lamps and held globes with their images in the water, the blades
export async function finishCountry(P, C) {
  const { LU, RU } = P, g = C.group, pause = P.yieldFn || (async () => {});
  g.add(makeSolid(LU, C.sb.geometry(), P.wind).object); await pause();
  if (C.people.length) g.add(makeFigures(LU, C.people, { face: FACE, cloths: TOWN_CLOTHS }).object);
  await pause();
  const all = [...C.lamps, ...C.sparks];
  g.add(makeSprites(LU, RU, all).object); await pause();
  g.add(makeSprites(LU, RU, all.filter((q) => q.wet !== false), { mirror: true, gain: 0.55 }).object); await pause();
  if (C.blades.length) g.add(makeBlades(LU, C.blades).object);
  return { lamps: all.length, people: C.people.length, blades: C.blades.length };
}

// ---- THE THREAD OUT OF THE CLEFT (the owner's order J1), TESTED IN BUILD on the seed's own country. The far side's thread stands at
// bearing 0 of the sky (the map's -Z: the common part's band law), so from an eye at (ex, ez) it stands over the map line x = ex.
// The hill's skyline is its crest (the land's ridge line z = CREST_Z: the south face rises to it at every x). For an eye and a
// bearing, K is where the bearing's line from the eye crosses the crest. The skyline there is CLOSED if a roof or a crown stands on
// the bearing's line within SKY.near metres of K and rises SKY.over metres or more above the crest's ground at K; otherwise it is
// open sky. THE TEST, at every eye given (the world gives one every 5 m of road from the entry to the crossing): the thread's own
// bearing is closed, and so is every bearing for SKY.keep degrees to either hand of it (looked for in steps of SKY.step degrees as
// far as SKY.reach): the thread stands 6 degrees or more from either edge of any open sky; and the low place itself is open (no
// roof or crown closes it on any line x = const across it). eyes: [[metre, x, y, z]]; returns the numbers and what failed.
export const SKY = { near: 24, over: 2, keep: 6, step: 0.5, reach: 80 };
export function skyline(eyes, sites, crowns, open) {
  const roofs = sites.filter((o) => Math.abs(o.z - CREST_Z) < 40).map((o) => ({ x: o.x, z: o.z, hw: HOUSES[o.v].w * 0.5, hd: HOUSES[o.v].d * 0.5, dx: o.dx, dz: o.dz, top: o.y + o.top }));
  const closed = (ex, ez, deg) => { const sb = Math.sin(deg * DEG), cb = Math.cos(deg * DEG), tK = (ez - CREST_Z) / cb, gy = southH(ex + sb * tK, CREST_Z) + SKY.over;
    for (const o of roofs) { const rx = o.x - ex, rz = o.z - ez, along = rx * sb - rz * cb, perp = Math.abs(rx * cb + rz * sb);
      if (o.top >= gy && Math.abs(along - tK) <= SKY.near + o.hw && perp <= o.hw * Math.abs(-o.dz * cb + o.dx * sb) + o.hd * Math.abs(o.dx * cb + o.dz * sb)) return 'roof'; }
    for (const c of crowns) { const rx = c.x - ex, rz = c.z - ez; if (c.top >= gy && Math.abs(rx * sb - rz * cb - tK) <= SKY.near && Math.abs(rx * cb + rz * sb) <= c.r) return 'crown'; }
    return ''; };
  const out = { ok: true, eyes: eyes.length, roof: 0, crown: 0, east: [SKY.reach, -1], west: [SKY.reach, -1], fails: [] };
  for (const [m, ex, , ez] of eyes) { const by = closed(ex, ez, 0); if (by) out[by]++; else out.fails.push('metre ' + m + ': the thread\'s bearing meets the crest on bare ground');
    for (const [side, key] of [[1, 'east'], [-1, 'west']]) { let b = SKY.step; while (b < SKY.reach && closed(ex, ez, side * b)) b += SKY.step;
      if (b < out[key][0]) out[key] = [b, m]; if (b < SKY.keep) out.fails.push('metre ' + m + ': open sky ' + b + ' degrees ' + key + ' of the thread'); } }
  // WHERE THE NEW STAR IS SEEN FROM (the owner's term T2: the reveal is the land's, not the flight's). The star stands at one place
  // of the sky; at each eye its point is hidden if the eye's ray to it passes under the land (the land's own heights) or
  // through a roof or a crown by the crest. Nothing is asked of it: it is counted, on the river stretch (to the quay line) and after.
  out.star = { river: 0, byLand: 0, byCrown: 0, seen: 0, firstSeen: -1 };
  for (const [m, ex, ey, ez] of eyes) { let hid = '';
    for (let t = 4; t < 560 && !hid; t += 2) if (ey + t * TAN_EL < groundH(ex + FACE[0] * t, ez + FACE[1] * t)) hid = 'byLand';      // (the shade law's own march, at every two metres of the ray)
    if (!hid) for (const o of roofs) { const rx = o.x - ex, rz = o.z - ez, along = rx * FACE[0] + rz * FACE[1], perp = Math.abs(rx * FACE[1] - rz * FACE[0]);
      if (along > 0 && ey + along * TAN_EL < o.top && perp <= o.hw * Math.abs(-o.dz * FACE[1] - o.dx * FACE[0]) + o.hd * Math.abs(o.dx * FACE[1] - o.dz * FACE[0])) { hid = 'byCrown'; break; } }
    if (!hid) for (const c of crowns) { const rx = c.x - ex, rz = c.z - ez, along = rx * FACE[0] + rz * FACE[1], h = ey + along * TAN_EL;
      if (along > 0 && h < c.top - 1 && h > c.bot && Math.abs(rx * FACE[1] - rz * FACE[0]) <= c.r * 0.8) { hid = 'byCrown'; break; } }
    if (ez > QUAY_Z) { out.star.river++; out.star[hid || 'seen']++; }
    if (!hid && out.star.firstSeen < 0) out.star.firstSeen = m; }
  for (let x = open[0] + 2; x < open[1] - 1; x += 2) if (closed(x, CREST_Z + 400, 0)) out.fails.push('the low place is closed at x ' + x);      // (the low place's own sky, edge to edge: no crown's part stands in it, by the trees' own rule)
  out.ok = !out.fails.length; return out;
}

// ---- reading the terraces. A tread is the level part of a step of the smooth form: at(x, z) says where a point stands.
function siteAt(x, z) {
  const d = waterD(x, z); if (d <= 0) return null;
  const g = southG(x, z, d), b = terrT(x, z, g)[0] - 1.6, k = terraceK(z, g), f = b <= 0 ? -1 : b < 24 ? (b / 6) % 1 : ((b - 24) / 9) % 1;
  const e = 2, gx = southG(x + e, z, waterD(x + e, z)) - southG(x - e, z, waterD(x - e, z)), gz = southG(x, z + e, waterD(x, z + e)) - southG(x, z - e, waterD(x, z - e)), gl = Math.hypot(gx, gz);
  return { d, g, k, f, dx: gl > 1e-4 ? -gx / gl : 0, dz: gl > 1e-4 ? -gz / gl : 1, slope: gl / (2 * e), y: southH(x, z) };      // (dx, dz): downhill
}
const FINE = [[120, 232, -280, 104], [-424, -120, -40, 104], [-312, 456, -430, -280]];      // where the land's mesh carries the terraces exactly
// the blade a thing of height h throws: its top carried down the star's ray until it meets the ground (at most 110 m), stations on the ground
function bladeFor(x, y, z, h, w, w1, k = 1) {
  const n = Math.hypot(STAR_DIR.x, STAR_DIR.z), ax = -STAR_DIR.x / n, az = -STAR_DIR.z / n; let t = 0, gy = y;
  for (t = 1.5; t < 110; t += 1.5) { gy = groundH(x + ax * t, z + az * t); if (y + h - t * TAN_EL <= gy) break; }
  if (t < 3) return null;
  const m = t * 0.5;
  return { a: [x, y, z], b: [x + ax * m, Math.max(groundH(x + ax * m, z + az * m), 0), z + az * m], c: [x + ax * t, Math.max(gy, 0), z + az * t], w, w1: w1 ?? w, k };
}

// ---- houses, their stair-foot lamps and the watchers out on the terrace edge before them
export async function layHouses(P, C) {
  const R = P.S.houses, { clear } = P, lists = [[], [], [], []], sites = [], pause = P.yieldFn || (async () => {});
  const area = FINE.map((q) => (q[1] - q[0]) * (q[3] - q[2])), total = area[0] + area[1] + area[2];
  // the crest's three long halls (the common part's HALLS), laid first so that everything else of the town keeps off them: each on the
  // bench's level ground, its door and its lit yard toward the river. A hall is a house like any other and keeps the houses' clearance.
  for (const [x, z] of HALLS) { const v = 3, H = HOUSES[v], y = southH(x, z), hw = H.w * 0.5 + 2.3, G = P.S.crest;
    if (!clear.box(x, z, Math.PI, hw, H.d * 0.5 + 2.5, y + H.top + 2)) continue;
    sites.push({ x, z, hw, y, hd: Math.PI, dx: 0, dz: 1, v, top: H.top, hall: true });
    lists[v].push({ m: [x, z, Math.PI, 0], s: [1, 1, 0, G()], lit: starLit(x, y + H.top, z), y });
    C.glows.push({ p: [x, y, z + H.d * 0.5 + 1.2], r: 8, k: 0.5, h: 2.4, foot: false }); }
  for (let tries = 0, got = 0; tries < 9000 && got < 240; tries++) {
    if (tries % 200 === 199) await pause();
    let r = R() * total, q = FINE[2]; for (let i = 0; i < 3; i++) { if (r < area[i]) { q = FINE[i]; break; } r -= area[i]; }
    const x = R.range(q[0], q[1]), z = R.range(q[2], q[3]), v = Math.floor(R() * 4) % 4, rot = R(), tint = R(), H = HOUSES[v], s = siteAt(x, z);
    if (!s || s.d < 13 || s.k < 0.97) continue;
    const upland = s.slope < 0.03;
    if (!upland && (s.f < 0.27 || s.f > 0.4)) continue;                                              // mid tread: room for the porch before and the wall behind
    if (upland && s.g > 20 && rot > 0.35) continue;                                                // the upland behind the banks is thinly built
    if (wayD(x, z) < H.w * 0.5 + 4) continue;                                                     // the way up the town stays open
    const dx = upland ? -Math.sign(x) : s.dx, dz = upland ? 0 : s.dz, hd = Math.atan2(-dx, -dz), hw = H.w * 0.5 + 2.3;
    const e1 = siteAt(x - dz * hw, z + dx * hw), e2 = siteAt(x + dz * hw, z - dx * hw);
    if (!e1 || !e2 || Math.abs(e1.y - s.y) > 0.4 || Math.abs(e2.y - s.y) > 0.4) continue;       // the whole house on one tread
    if (!sites.every((o) => Math.hypot(o.x - x, o.z - z) > hw + o.hw + 3.5)) continue;
    if (!clear.box(x, z, hd, hw, H.d * 0.5 + 2.5, s.y + H.top + 2)) continue;
    const lit = starLit(x, s.y + H.top, z);
    sites.push({ x, z, hw, y: s.y, hd, dx, dz, v, top: H.top }); got++;
    lists[v].push({ m: [x, z, hd, 0], s: [1, 1, 0, tint], lit, y: s.y });
    // a lamp at the stair's foot, on a post at the porch's corner
    const side = rot < 0.5 ? -1 : 1, px = x - dz * side * (hw - 0.4) + dx * (H.d * 0.5 + 3.2), pz = z + dx * side * (hw - 0.4) + dz * (H.d * 0.5 + 3.2);
    if (clear.dist(px, s.y + 2.8, pz) > 7.5) { C.sb.pole([px, s.y - 0.5, pz], [px, s.y + 2.7, pz], 0.07, TIMBER, 0); C.lamps.push({ p: [px, s.y + 2.9, pz], size: 0.2, bright: 3.5, ph: R() * 6.283, wet: s.d < 60 }); }
    if (lit > 0.5 && starLit(x + dx * 6, s.y + 0.5, z + dz * 6) > 0.5) { const b = bladeFor(x, s.y, z, H.top, hw * 0.9, hw * 0.9); if (b) C.blades.push(b); }
    // its yard: the windows' light lying on the terrace before the door, and a lamp or two hung under the porch's eave
    { const Y = P.S.yards, f = H.d * 0.5 + 1.2, gx = x + dx * f, gz = z + dz * f, n = Math.floor(Y() * 3);      // (under the porch's eave: on the plinth and the ground before it)
      C.glows.push({ p: [gx, s.y, gz], r: 8, k: 0.5, h: 2.4, foot: false });
      for (let i = 0; i < n; i++) { const l = Y.range(-hw + 1.6, hw - 1.6), lx = x + dx * (H.d * 0.5 + 2.1) - dz * l, lz = z + dz * (H.d * 0.5 + 2.1) + dx * l, lp = Y() * 6.283;
        if (clear.dist(lx, s.y + 2.6, lz) > 7.5) C.lamps.push({ p: [lx, s.y + 2.75, lz], size: 0.15, bright: 3, ph: lp, sway: 0.03, wet: s.d < 60 }); } }
  }
  for (let v = 0; v < 4; v++) if (lists[v].length) C.group.add(makeCraft(P.LU, houseGeometry(v), lists[v], [0, 30, -150, 620], null, { house: true }).object);
  return sites;
}

// instanced plants on the kit's one wind material: items [{ x, y, z, s, rot }]
function plant(geo, mat, items) {
  const mesh = new THREE.InstancedMesh(geo, mat, items.length), m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), s = new THREE.Vector3();
  items.forEach((it, i) => { e.set(0, it.rot, 0); q.setFromEuler(e); v.set(it.x, it.y, it.z); s.set(it.s, it.s * (it.sy || 1), it.s); mesh.setMatrixAt(i, m.compose(v, q, s)); });
  // (a tree's own share of light, set once at build from where it stands: see layTrees)
  if (items.some((it) => it.k !== undefined && it.k < 1)) { const c = new THREE.Color(); items.forEach((it, i) => mesh.setColorAt(i, c.setScalar(it.k ?? 1))); mesh.instanceColor.needsUpdate = true; }
  mesh.instanceMatrix.needsUpdate = true; mesh.computeBoundingSphere(); mesh.boundingSphere.radius += 6;
  return mesh;
}
// ---- trees: spire trees in rows along terrace edges and in a ring outside the bowl's rim; round crowns in the gardens, on the knolls and
// all down the bluff's wooded north face. Laid by the land: a row follows its terrace's edge, a wood fills its slope.
export async function layTrees(P, C, sites) {
  const R = P.S.trees, { clear } = P, spires = [[], [], [], []], rounds = [[], [], [], []];      // regions: banks, bluff south, north face, the bowl's ring
  const free = (x, z, r) => sites.every((o) => Math.hypot(o.x - x, o.z - z) > o.hw + r) && wayD(x, z) > 2.5 + r && !(z < CREST_Z + 4 && z > NORTH_Z && Math.abs(x - backStairX(z)) < 5 + r);      // (off every house, off the way up the town and off the back stair)
  // THE LOW PLACE'S SKY IS PLAIN: between the foot of the west swell and the grove's west end no crown stands higher than the crest
  // behind it, wherever on the slope the tree stands (a crown lower on the slope is seen against the hill, not against the sky)
  const GROVE = { x0: BENCH.x0 - 6, gable: 1.5, step: 5 };      // (the grove's ruled row: its west end, a trunk's distance from a hall's gable, the trunks' spacing)
  const OPEN = [LOW[0] - LOW[2] * 0.72, GROVE.x0 - 4], openSky = (x, top, r = 0) => x + r > OPEN[0] && x - r < OPEN[1] && top > crestH(x) - 1;      // (no part of a crown that would top the crest stands in the low place's open sky)
  const crowns = [], tops = [], note = (x, z, r, top, bot = top - 6) => { tops.push({ x, z, r: r * 2, top: top + 1 }); if (Math.abs(z - CREST_Z) < 40) crowns.push({ x, z, r, top, bot }); };      // (every crown near the crest, for the skyline's test; and every tree of the country with its whole spread and its top, for whatever flies over it)
  // THE KIT'S TREES AND THE STAR. The kit's leaves take the star from the scene's one star light, which knows no shade. So a tree
  // that stands in the town's hill's shade (the common part's townLit, asked at the tree's own crown) is dealt, once, at build, the
  // SHARE of an upward leaf's light that is not the star's: reckoned here from the four lights as they are set (the sky's fill with
  // the leaves' own ambient, the thread, the afterglow, against the same with the star). A constant of the tree's place; north of the
  // crest the town's hill shades nothing and every tree keeps its whole light.
  const lum = (c) => 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
  const SHADE = (() => { const L = P.LU, a = lum(L.uHemiSky.value) * LEAF_AMBIENT + lum(L.uBandCol.value) * Math.max(L.uBandDir.value.y, 0) + lum(L.uGlowCol.value) * Math.max(L.uGlowDir.value.y, 0), st = lum(L.uStarCol.value) * Math.max(L.uStarDir.value.y, 0); return a / Math.max(a + st, 1e-6); })();
  const put = (list, x, z, y, h, r, sc) => { if (openSky(x, y + h, r) || !clear.box(x, z, 0, r, r, y + h + 1, TREE_KEEP)) return false; list.push({ x, y: y - 0.3, z, s: sc, rot: R() * 6.283, h, k: 1 - (1 - SHADE) * (1 - townLit(x, y + h * 0.7, z)) }); note(x, z, r * 0.75, y + h * 0.95);
    if (starLit(x, y + h * 0.7, z) > 0.5 && starLit(x, y + 0.5, z) > 0.5 && list !== rounds[2]) { const b = bladeFor(x, y, z, h, r * 0.6, r * 0.25, 0.9); if (b) C.blades.push(b); } return true; };
  // rows along terrace edges: walk each tread's outer edge in runs of trees with gaps between the runs
  const rowAt = (reg, x, z) => { const s = siteAt(x, z); if (!s || s.k < 0.97 || s.f < 0.02 || s.f > 0.16 || !free(x, z, 4)) return; const sc = R.range(0.85, 1.25); put(spires[reg], x, z, s.y, 17 * sc, 2.2, sc); };
  for (let k = 0; k < 4; k++) for (const sd of [-1, 1]) { const x = sd * (LANE + 9.6 + 20 * k);      // the banks' four terraces
    for (let z = 96 + R() * 8, run = 0; z > (sd > 0 ? QUAY_Z + 12 : -34); z -= 10.5) { if (run <= 0) { run = 3 + Math.floor(R() * 6); z -= R.range(24, 70); } run--; rowAt(0, x, z); } }
  if (P.yieldFn) await P.yieldFn();
  for (const lev of [1.6, 7.6, 13.6, 19.6, 25.6, 34.6, 43.6, 52.6]) {      // the bluff's terraces: find the edge of each by bisection down the slope
    if (P.yieldFn) await P.yieldFn();
    for (let x = -306 + R() * 10, run = 0; x < 452; x += 10.5) { if (run <= 0) { run = 4 + Math.floor(R() * 7); x += R.range(30, 80); } run--;
      let z0 = QUAY_Z - 9, z1 = CREST_Z + 3; const gAt = (z) => { const d = waterD(x, z); return d > 0 ? terrT(x, z, southG(x, z, d))[0] : 0; };      // (the terrace coordinate: every plot's own levels)
      if (gAt(z1) < lev + 0.5) continue;
      for (let i = 0; i < 14; i++) { const zm = (z0 + z1) / 2; if (gAt(zm) < lev + 0.45) z0 = zm; else z1 = zm; }
      rowAt(1, x, z1 - 0.4); } }
  if (P.yieldFn) await P.yieldFn();
  // round crowns in the gardens (banks and bluff), thinly
  for (let i = 0; i < 2200; i++) { if (i % 200 === 199 && P.yieldFn) await P.yieldFn(); const q = FINE[i % 3], x = R.range(q[0], q[1]), z = R.range(q[2], q[3]), sc = R.range(0.75, 1.15), s = siteAt(x, z);
    if (!s || s.d < 10 || s.k < 0.97 || (s.slope > 0.03 && (s.f < 0.2 || s.f > 0.62)) || !free(x, z, 5) || rounds[i % 3 === 2 ? 1 : 0].length >= (i % 3 === 2 ? 60 : 44)) continue;
    put(rounds[i % 3 === 2 ? 1 : 0], x, z, s.y, 11 * sc, 4, sc); }
  if (P.yieldFn) await P.yieldFn();
  // the top lawn's own garden: round trees on the smooth lawn under the crest, from the low place to the high head's foot
  for (let i = 0, got = 0; i < 500 && got < 26; i++) { const z = R.range(CREST_Z + 4, CREST_Z + 50), x = R.range(LOW[0] - LOW[2], BENCH.x1 + 30), sc = R.range(0.8, 1.15);
    if (waterD(x, z) < 10 || !free(x, z, 5) || !rounds[1].every((t) => Math.hypot(t.x - x, t.z - z) > 9)) continue;
    if (put(rounds[1], x, z, southH(x, z), 11 * sc, 4, sc)) got++; }
  // lamps hung in the garden trees, under the crowns (tethered lights, each on its bough)
  const H = P.S.hung, hang = (x, y, z, h, sc, n, rim = 0) => { for (let i = 0; i < n; i++) { const a = H() * 6.283, r = (rim || H.range(1.6, 3.6)) * sc, p = [x + Math.cos(a) * r, y + h * H.range(0.36, 0.5), z + Math.sin(a) * r];
    if (clear.dist(p[0], p[1], p[2]) > 7.5) C.lamps.push({ p, size: 0.15, bright: 3, ph: H() * 6.283, wet: false }); } };
  for (const list of [rounds[0], rounds[1]]) for (const t of list) hang(t.x, t.y, t.z, t.h, t.s, 2 + Math.floor(H() * 3));
  // the knolls' wooded heads and the north face: one wood from the crest down to the basin's shore
  // (a wood is one dark mass: its trees are plain crowns in the country's one mesh of standing things, not leaf cards)
  for (let i = 0, got = 0; i < 2600 && got < 330; i++) { if (i % 40 === 39 && P.yieldFn) await P.yieldFn(); const x = R.range(-300, 520), z = R.range(NORTH_Z - 2, CREST_Z + 34), sc = R.range(0.8, 1.3), d = waterD(x, z);
    if (d < 5 || !free(x, z, 3)) continue; const g = southG(x, z, d); if (z > CREST_Z + 3 && g < 70) continue;      // south of the crest only the knolls' heads are wooded
    const y = southH(x, z), h = 11 * sc; if (openSky(x, y + h, 4.5 * sc) || !clear.box(x, z, 0, 4.5 * sc, 4.5 * sc, y + h + 1, TREE_KEEP)) continue; got++; note(x, z, 3.7 * sc, y + h);
    const lit = starLit(x, y + h * 0.8, z), col = [0.05 + 0.02 * R(), 0.085 + 0.03 * R(), 0.06 + 0.015 * R()];
    const beat = 1 + Math.floor(R() * 7);
    C.sb.blob([x, y + h * 0.68, z], 4.1 * sc, h * 0.33, col, lit, beat); C.sb.blob([x + R.range(-2.5, 2.5) * sc, y + h * 0.56, z + R.range(-2.5, 2.5) * sc], 3.3 * sc, h * 0.27, col, lit, beat);      // (crowns stand clear of the ground on their trunks)
    C.sb.pole([x, y - 0.5, z], [x, y + h * 0.5, z], 0.22 * sc, [0.085, 0.07, 0.06], 0);
    if (Math.abs(x - backStairX(z)) < 64 && H() < 0.6) hang(x, y, z, h, sc, 2 + Math.floor(H() * 3), 4.8); }      // the wood beside the back stair is hung with lamps too
  // THE GROVE (the owner's order J1): the high head's wood comes down its west foot onto the bench and goes on along the crest past
  // the halls to the bench's west end: a ruled row of round crowns GROVE.step metres apart, each a little out of line, so that crown
  // meets crown and this length of the skyline is closed by crowns from wherever it is seen; a second, looser row stands before it.
  // Plain crowns of the wood's own kind (the grove is the wood's edge), each with the trees' clearance from the road; a trunk stands
  // GROVE.gable metres off a hall's gable end, its crown over the gable. Dealt on the grove's own stream (a crown that the road's
  // clearance, the way or a house does not let stand draws nothing, and no other thing reads this stream after it).
  { const G = P.S.grove, hw = HOUSES[3].w * 0.5, x1 = HALLS[0][0] - hw - GROVE.gable, x2 = HALLS[HALLS.length - 1][0] + hw + GROVE.gable;
    const crown = (x, z, sc) => { const y = southH(x, z), h = 11 * sc; if (wayD(x, z) < 6 || Math.abs(x - backStairX(z)) < 8 || !sites.every((o) => o.hall || Math.hypot(o.x - x, o.z - z) > o.hw + 3) || !clear.box(x, z, 0, 4.5 * sc, 4.5 * sc, y + h + 1, TREE_KEEP)) return;
      const lit = starLit(x, y + h * 0.8, z), col = [0.05 + 0.02 * G(), 0.085 + 0.03 * G(), 0.06 + 0.015 * G()], beat = 1 + Math.floor(G() * 7);
      C.sb.blob([x, y + h * 0.68, z], 4.1 * sc, h * 0.33, col, lit, beat); C.sb.blob([x + G.range(-2.5, 2.5) * sc, y + h * 0.56, z + G.range(-2.5, 2.5) * sc], 3.3 * sc, h * 0.27, col, lit, beat);
      C.sb.pole([x, y - 0.5, z], [x, y + h * 0.5, z], 0.22 * sc, [0.085, 0.07, 0.06], 0); note(x, z, 3.7 * sc, y + h);
      if (H() < 0.5) hang(x, y, z, h, sc, 2, 4.8); };      // (half the grove's trees carry two hung lamps)
    for (let x = x1; x > GROVE.x0; x -= GROVE.step) crown(x + G.range(-0.75, 0), CREST_Z + G.range(1, 6), G.range(0.95, 1.3));      // west of the halls, along the crest
    for (let x = x1 - 3; x > GROVE.x0; x -= G.range(7, 13)) crown(x, CREST_Z + G.range(8, 10.5), G.range(0.8, 1.2));                   // the looser row before it, behind the bench's path
    for (let x = x2; x < KNOLL_R[0]; x += GROVE.step) crown(x + G.range(0, 0.75), CREST_Z + G.range(1, 6), G.range(0.95, 1.3));       // east of the halls, up the head's foot
    // and it goes on BEHIND the halls, on the crest's north side, wherever the road's clearance lets a crown stand: tall crowns
    // over the long roofs (the far side's thread, where it stands over a hall, is crossed at its foot by a crown)
    for (let x = x1 + GROVE.gable + 2.5; x < x2; x += GROVE.step) crown(x + G.range(-0.75, 0.75), CREST_Z - G.range(3, 8), G.range(1.1, 1.35)); }
  if (P.yieldFn) await P.yieldFn();
  // the ring of spire trees outside the bowl's rim (open at the notch and where the landing stair comes up)
  for (let a = 0; a < 360; a += 6) { const dn = Math.abs(((a + 180) % 360) - 180), near = Math.abs(a - 180); if (dn < 29 || near < 5) continue;      // (open over the notch and its stepped sides, and where the landing stair comes up)
    const r = 147.5, f = a * DEG, p = bowlXZ(Math.sin(f) * r, Math.cos(f) * r), sc = R.range(0.9, 1.2); put(spires[3], p[0], p[1], groundH(p[0], p[1]), 17 * sc, 2.2, sc); }
  if (P.yieldFn) await P.yieldFn();
  const wind = flora.makeWind({ direction: P.wind || [0.9, -0.44], strength: 0.9, speed: 0.9 });      // (the evening's wind in every crown: tuned on the whole country)
  const matOpts = { wind, backlight: 0, ambient: 3, leafAmbient: LEAF_AMBIENT, wrap: 0.8, sheen: 0.25 };      // (the night's light on bark and leaf, set on the whole country: a crown out of the star's light is a deep blue-green mass with lighter and darker boughs, never the picture's black)
  await flora.prepareLeafTexture(matOpts, P.yieldFn);
  const mat = flora.windMaterial(matOpts);
  if (P.yieldFn) await P.yieldFn();
  // (leaf colours a tone lighter than the dusk makes them, so that a near crown is never a black shape; on a snow visit the crowns carry snow)
  const snowy = !!P.snow;
  const spire = flora.cypressGeometry({ rng: R, height: 17, detail: 0, girth: 0.1, leaf: snowy ? '#5a706b' : '#4f7c5f', leafLight: snowy ? '#c2cede' : '#7fae86', leafDark: '#2c4a36', bark: '#4a3e34' });
  if (P.yieldFn) await P.yieldFn();
  const round = flora.oakGeometry({ rng: R, height: 11, detail: 0, leaf: snowy ? '#52645e' : '#456b4c', leafLight: snowy ? '#c2cede' : '#6e9668', leafDark: '#263c2b', bark: '#4a3e34' });
  if (P.yieldFn) await P.yieldFn();
  let tris = 0;
  for (let i = 0; i < 4; i++) { if (spires[i].length) { C.group.add(plant(spire, mat, spires[i])); tris += spires[i].length * spire.userData.triangles; } if (rounds[i].length) { C.group.add(plant(round, mat, rounds[i])); tris += rounds[i].length * round.userData.triangles; } }
  return { wind, mat, tris, crowns, tops, open: OPEN, count: spires.reduce((a, l) => a + l.length, 0) + rounds.reduce((a, l) => a + l.length, 0) };
}

// ---- the watchers of the country and the lamps of its quays and stairs. No one is nearer the route than PEOPLE_KEEP (28.5 m); no one stands apart on a
// raised place (the knolls' heads carry crowds, not a figure); every held globe is a steady light.
export async function layPeople(P, C, sites) {
  const R = P.S.people, { clear } = P, pause = P.yieldFn || (async () => {});
  const person = (x, z, y, opts = {}) => {
    if (y === undefined) { const d = waterD(x, z); if (d <= 0.5) return; y = southH(x, z); }
    if (clear.dist(x, y + 1, z) < PEOPLE_KEEP) return;
    // (a number is drawn only where it is read: no seat is drawn where no one may sit, and a far person, who is a held light
    // and nothing else, draws no chance of carrying one)
    const Q = opts.Q || R, lit = opts.far ? 0 : starLit(x, y + 1, z), seat = opts.seated ?? 0.3, h = seat > 0 && Q() < seat ? 1.1 : 1.7, spark = !opts.far && Q() < (opts.spark ?? 0.4);
    const ph = spark || opts.far ? Q() * 6.283 : 0;
    if (!opts.far) C.people.push({ p: [x, y, z], h, lit, tint: Math.floor(Q() * 5), lamp: spark, ph });
    if (spark || opts.far) C.sparks.push({ p: heldAt([x, y, z], h, ph, FACE), size: 0.085, bright: 2, ph, wet: opts.wet ?? false });
    if (lit > 0.6 && !opts.far && Q() < 0.5) { const b = bladeFor(x, y, z, h, 0.3, 0.2, 0.8); if (b) C.blades.push(b); }
  };
  // NO ONE IS ALONE ON THE TOWN'S HILL (the owner's order J4): the watchers stand and sit in KNOTS. A knot's places are drawn first
  // and each is asked the people's own questions (dry ground, the clearance from the road); the knot is laid only if KNOT or more of
  // its places stand, so that the road's clearance never leaves one or two of a knot behind by themselves.
  const KNOT = 3, knot = (places, opts = {}) => { const at = [];
    for (const [x, z] of places) { let y = opts.y; if (y === undefined) { if (waterD(x, z) <= 0.5) continue; y = southH(x, z); } if (clear.dist(x, y + 1, z) >= PEOPLE_KEEP) at.push([x, y, z]); }
    if (at.length < KNOT) return 0; for (const q of at) person(q[0], q[2], q[1], opts); return at.length; };
  const group = (x, z, n, spread, opts = {}) => { const Q = opts.Q || R, places = []; for (let i = 0; i < n; i++) places.push([x + Q.range(-spread, spread), z + Q.range(-spread, spread) * (opts.flat ?? 1)]); return knot(places, opts); };
  // before each house, out at its terrace's edge: one knot, somewhere along the house's front
  for (const o of sites) { const n = KNOT + Math.floor(R() * 5), l0 = R.range(-o.hw + 2.4, o.hw - 2.4), places = []; for (let i = 0; i < n; i++) { const f = R.range(4.6, 6.4) + (o.hall ? 0 : 4), l = l0 + R.range(-2.4, 2.4); places.push([o.x + o.dx * f - o.dz * l, o.z + o.dz * f + o.dx * l]); } knot(places, { y: o.y, wet: true }); }
  await pause();
  // along the terrace edges between the houses, in knots
  for (let i = 0; i < 3600; i++) { if (i % 250 === 249) await pause(); const q = FINE[i % 3], x = R.range(q[0], q[1]), z = R.range(q[2], q[3]), n = KNOT + Math.floor(R() * 4), d = waterD(x, z); if (d < 9) continue;
    const g = southG(x, z, d), b = terrT(x, z, g)[0] - 1.6, f = b < 24 ? (b / 6) % 1 : ((b - 24) / 9) % 1; if (terraceK(z, g) < 0.97 || f < 0.02 || f > 0.09) continue;
    group(x, z, n, 2.2, { y: southH(x, z), wet: d < 60 }); }
  await pause();
  // the quay at the bluff's foot and the banks' own quays, close along the water
  for (let i = 0; i < 70; i++) group(R.range(-310, 117), QUAY_Z - R.range(2.6, 5.9), KNOT + Math.floor(R() * 4), 2.4, { flat: 0.25, wet: true, spark: 0.5 });
  await pause();
  for (let i = 0; i < 60; i++) { const sd = R() < 0.5 ? -1 : 1, x = sd * (LANE + R.range(2.6, 5.9)), z = R.range(sd > 0 ? QUAY_Z + 4 : -36, 100), n = KNOT + Math.floor(R() * 4), places = [];
    for (let k = 0; k < n; k++) places.push([x + R.range(-0.6, 0.6), z + R.range(-2.4, 2.4)]); knot(places, { wet: true, spark: 0.5 }); }
  await pause();
  // the knolls' heads: crowds, seen against the sky from the river
  for (const kn of [KNOLL_L, KNOLL_R]) for (let i = 0; i < 110; i++) { const a = R() * 6.283, r = 26 * Math.sqrt(R()); person(kn[0] + Math.cos(a) * r, kn[2] + 8 + Math.sin(a) * r * 0.5, undefined, { far: true }); }
  await pause();
  // the basin's near shore under the wood
  for (let i = 0; i < 420; i++) { const x = R.range(-300, 540); person(x, southShore(x) + R.range(1.5, 5), undefined, { wet: true, far: R() < 0.6 }); }
  await pause();
  // THE CREST'S WALK (the owner's order J4): watchers standing in a loose line along the crest, from the grove's west end across the low
  // place and up the west swell: knot after knot a few strides apart, every one turned (as every watcher of the country is) to the
  // star's side of the sky, where it stands over the basin; not to the far side's thread. Dealt on the walk's own stream.
  { const G = P.S.walk; for (let x = C.trees.open[1] - G.range(2, 8); x > KNOLL_L[0] + 20; x -= G.range(7, 16)) group(x, CREST_Z + 2.5, KNOT + Math.floor(G() * 4), 2.6, { flat: 0.35, seated: 0, spark: 0.3, Q: G }); }
  await pause();
  // the basin's far bank: too far for bodies, a line of small lights doubled in the water
  for (let i = 0; i < 2400; i++) { if (i % 800 === 799) await pause(); const x = R.range(-1250, 1500), dz = 3 + 60 * R() * R(), z = northShore(x) - dz; if (Math.hypot(x - BOWL.c[0], z - BOWL.c[1]) < 215) continue;
    C.sparks.push({ p: [x, Math.min(dz * 0.25, 9) + 1.2, z], size: 0.085, bright: 2, ph: R() * 6.283, wet: dz < 25 }); }
  await pause();
  // ---- braziers: fires in iron bowls on terrace edges, on the quay, on the two heads and by the back stair's head, each with its
  // knot of watchers and its pool of firelight on the ground
  const F = P.S.fires, fires = C.glows;
  const fire = (x, z) => { const d = waterD(x, z); if (d < 2.5) return false; const y = southH(x, z); if (clear.dist(x, y + 1.6, z) < 9 || Math.abs(southH(x + 3, z) - y) + Math.abs(southH(x, z + 3) - y) + Math.abs(southH(x - 3, z) - y) + Math.abs(southH(x, z - 3) - y) > 2.4) return false;
    const ph = F() * 6.283;
    C.sb.pole([x, y - 0.3, z], [x, y + 0.85, z], 0.07, [0.03, 0.03, 0.035], 0); C.sb.box(x - 0.42, x + 0.42, y + 0.85, y + 1.05, z - 0.42, z + 0.42, [0.03, 0.03, 0.035], 0);
    C.lamps.push({ p: [x, y + 1.32, z], size: 0.4, bright: 3.5, ph, wet: d < 40 }); fires.push({ p: [x, y, z], r: 10, k: 1.15, h: 1.3 });
    { const places = []; for (let i = 0, n = 5 + Math.floor(F() * 6); i < n; i++) { const a = F() * 6.283, r = F.range(1.6, 4.2); places.push([x + Math.cos(a) * r, z + Math.sin(a) * r]); } knot(places, { wet: d < 40, spark: 0.15 }); }
    return true; };
  for (let i = 0, got = 0; i < 1200 && got < 30; i++) { if (i % 150 === 149) await pause(); const q = FINE[i % 3], x = F.range(q[0], q[1]), z = F.range(q[2], q[3]), s = siteAt(x, z);
    if (!s || s.d < 9 || s.k < 0.97 || s.f < 0.08 || s.f > 0.2 || !sites.every((o) => Math.hypot(o.x - x, o.z - z) > o.hw + 5)) continue; if (fire(x, z)) got++; }
  await pause();
  for (let x = -280 + F() * 30; x < 110; x += F.range(50, 80)) fire(x, QUAY_Z - 4.2);
  for (const kn of [KNOLL_L, KNOLL_R]) for (let i = 0; i < 2; i++) fire(kn[0] + F.range(-14, 14), kn[2] + 10 + F.range(-5, 5));
  for (const e of [-1, 1]) fire(backStairX(CREST_Z - 14) + e * 7.5, CREST_Z - 14);      // either side of the back stair's head, behind the halls
  for (let i = 0; i < 9; i++) { const x = F.range(-280, 520); fire(x, southShore(x) + 4); }
  await pause();
  // ---- lamps: the back stair, the way's landings, the quay's edge, the banks' quays
  const post = (x, z, h, wet) => { const d = waterD(x, z); if (d <= 0) return; const y = southH(x, z); if (clear.dist(x, y + h, z) < 7.5) return;
    const ph = R() * 6.283;
    C.sb.pole([x, y - 0.4, z], [x, y + h, z], 0.075, TIMBER, 0); C.lamps.push({ p: [x, y + h + 0.2, z], size: 0.21, bright: 3.5, ph, wet });
    fires.push({ p: [x, y, z], r: 8, k: 0.6, h });      // each lamp's own pool of light on the ground under it
  };
  for (let z = CREST_Z - 7; z > NORTH_Z + 4; z -= 12.5) for (const e of [-1, 1]) post(backStairX(z) + e * 3.7, z, 2.8, false);      // (the back stair, down the north face)
  // THE WAY'S LANDINGS (the owner's orders J3 and J4): the way up the town is lit as any path of the town is, by ONE lamp where a flight
  // meets a terrace's walk, and people use it at their ease: at each landing a low stone wall along the terrace's lip beside the
  // flight, a lamp post at the wall's end, and a knot of three or more sitting along the wall or standing by it. Which side of the
  // flight the wall stands is the land's (the side where the terrace runs level). The quay's foot of the first flight has the quay's
  // own lamps and people. Dealt on the landings' own stream.
  { const G = P.S.landings, WALL = { len: 6, h: 0.5, t: 0.45, in: 0.3 }, ends = WAY.flights.flatMap((f, i) => (i ? [[f.x, f.z0, f.hw], [f.x, f.z1, f.hw]] : [[f.x, f.z1, f.hw]]));
    for (const [x, z, hw] of ends) { const y = southH(x, z - WALL.in), side = [1, -1].find((e) => Math.abs(southH(x + e * (hw + 0.6 + WALL.len), z - WALL.in) - y) < 0.2 && Math.abs(southH(x + e * (hw + 0.6 + WALL.len), z - 3) - y) < 0.2);
      if (!side) continue; const xa = x + side * (hw + 0.6), xb = xa + side * WALL.len;
      if (clear.dist((xa + xb) / 2, y + 1, z - WALL.in) < 9) continue;
      C.sb.box(Math.min(xa, xb), Math.max(xa, xb), y - 0.3, y + WALL.h, z - WALL.in - WALL.t, z - WALL.in, STONE, starLit((xa + xb) / 2, y + 1, z));
      post(xa - side * 0.1, z - WALL.in - WALL.t - 0.35, 2.8, false);
      const n = KNOT + Math.floor(G() * 4), places = []; for (let i = 0; i < n; i++) places.push([xa + side * G.range(0.6, WALL.len - 0.3), z - WALL.in - WALL.t - G.range(0.35, 1.5)]);
      knot(places, { seated: 0.7, spark: 0.2, Q: G }); }
    // at the west path's end before the halls: a lamp and a knot on the bench beside it
    for (const [x, z] of [WAY.paths[0][WAY.paths[0].length - 1]]) { post(x - 1.6, z - 1.2, 2.8, false); group(x - 4.4, z - 2.2, KNOT + Math.floor(G() * 3), 1.8, { seated: 0.5, spark: 0.2, Q: G }); } }
  for (let x = -306; x < 118; x += 17) post(x, QUAY_Z - 1.3, 3.6, true);
  for (const sd of [-1, 1]) for (let z = 96; z > (sd > 0 ? QUAY_Z + 6 : -34); z -= 23) post(sd * (LANE + 1.3), z, 3.6, true);
  await pause();
  for (let i = 0; i < fires.length; i++) { const g = fires[i]; if (i % 16 === 15) await pause(); P.lampMap.stamp(g.p[0], g.p[2], g.r, g.k ?? 1, g.h ?? 0, g.foot !== false); }      // every pool of lamp and fire light, into the country's map
}
