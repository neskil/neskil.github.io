// The Halls Between Sea and Cloud: the parts. A house of stone halls on three levels, made anew.
//
// housePlan(seed)   the whole layout by arithmetic (replayed under node for the counts): SIX HALLS on one spine (the
//                   first hall's porch and nave, the flooded hall, the great stair, the hall of the sea doors, the
//                   cloud hall, the last hall), their floors, tiers, windows, the seaward doors with their rounds,
//                   the route, where one hall's light gives way to the next (P.joins).
// Geo               a plain triangle builder (position, normal, colour, kind, aux); wallInto, vaultInto, crossWallInto,
//                   floorInto: a hall's pavement, tiers of niches, tall windows, great doors, stairs, vault; faceWallInto:
//                   the wall that faces the great stair (three storeys of niches, a great door, two great recesses).
// makeLook          the one lit material: ONE LIGHT, AIR AND STONE TO A HALL (hallLook), blended inside the wall
//                   between two halls; bars of daylight by the windows' own numbers, the lantern's wheel, the sea
//                   doors' glare, gold through the open crown, the water's net of light, wet stone, weed and shells to
//                   the tide's mark, far air; and its twin that draws the images in the standing sea (mirror).
// figureMake        the statues: this world's own carving in flat planes (working people, mothers, masons, sowers,
//                   musicians, sleepers, beasts), each a make built from a seeded pose in two grades (plain for the
//                   far tiers, fine for the lowest); person(), giantInto (eight giants of our own subjects), lionInto,
//                   nestInto carve them; backs against the wall are not carved (cullBack).
// extrasSteps       what stands in a hall beside its walls: giants, piers, lions, colossi with their nests, the
//                   fallen giant's pieces, the far halls, the last hall's broken arch, rubble and the strewn stones
//                   of its fallen vault (handed back in steps; extrasInto runs it through).
// tideInto, airInto, lifeInto: what moves (the sea and the doors' tides with their spray; beams, dust, the mist's
//                   level strata, snow, motes; birds, crabs, weed, the last hall's dry grass), all on the world
//                   clock alone.
//
// a = metres along the spine; the way runs down -Z (z = -a); +X is the seaward and window hand; y is height.
import * as THREE from 'three';
import { makeRng, hashSeed, makePath, lerp, smoothstep, clamp } from '../kit/core.js';

export const SEA_Y = -9, LOW_Y = -14, UP_Y = 18, WT = 3, EYE = 7, DOOR_HW = 5.8, CLOUD_UNDER = 9, CLOUD_OFF = 5, CLOUD_FAR = 1400;
// (the flooded hall's four tiers and its vault's rise, and with them its crown's height over the sea: one measure
// for the plan that builds the hall and for the look, whose water light softens to the hall's crown)
const SEA_TIERS = [10.6, 6.4, 7.0, 6.0], SEA_RISE = 6.5, SEA_CROWN = LOW_Y + SEA_TIERS.reduce((q, h) => q + h, 0) + SEA_RISE - SEA_Y;
const TAU = Math.PI * 2;
export const forkOf = (seed, name) => {
  let f = null; const need = () => f || (f = makeRng(hashSeed('house:' + name + ':' + seed))), r = () => need()();
  for (const k of ['range', 'int', 'pick', 'chance', 'sign', 'gauss', 'shuffle']) r[k] = (...a) => need()[k](...a);
  return r;
};

// ---------------------------------------------------------------- the plan
// band: a storey of a wall (h high); in it niches (sill above the band's foot, nh high to the crown of their arch), n to a bay
const band = (h, sill, nh, n) => ({ h, sill, nh, n });
// the last hall's storeys (housePlan builds its walls of them; the pools' mirror reads the same numbers: RUIN_NICHE)
const RUIN_BAY = 6.4, RUIN_BANDS = [band(10.6, 1.4, 8.2, 1), band(6.4, 0.8, 4.9, 2), band(6.4, 0.8, 4.9, 1), band(5.2, 0.6, 4.0, 2)];
// (glsl) nk: 1 where a place of a side wall of the last hall (ua: bays along it; ys: its height) lies in the opening of
// a niche: the wall's own arithmetic (wallInto: n niches to a bay, half breadth hw, a round head over the springing)
const RUIN_NICHE = (() => { let y0 = UP_Y, s = ''; for (const B of RUIN_BANDS) { const w = RUIN_BAY / B.n, hw = Math.min(B.nh * 0.26, w * 0.5 - 0.5), F = (q) => q.toFixed(3);
  s += `{ float v = ys - ${F(y0 + B.sill)}, uu = (fract(ua * ${B.n}.) - .5) * ${F(w)}; if (v > 0. && v < ${F(B.nh)}) nk = max(nk, smoothstep(${F(hw + 0.1)}, ${F(hw - 0.1)}, v < ${F(B.nh - hw)} ? abs(uu) : length(vec2(uu, v - ${F(B.nh - hw)})))); } `; y0 += B.h; } return s; })();
export function housePlan(seed) {
  const rl = forkOf(seed, 'layout'), rd = forkOf(seed, 'doors');
  const V = []; let a = 0;
  const add = (o) => { o.L = o.nb * o.bay; o.a0 = a; o.a1 = a + o.L; a = o.a1 + WT; o.i = V.length; o.yB = o.yB || 0; let y = o.yB; for (const b of o.bands) { b.y0 = y; y += b.h; } o.spring = y; o.top = y + o.rise; V.push(o); return o; };
  // THE FIRST HALL is a porch and a nave. The porch: four great bays under a lintel course (on the landward hand
  // plain piers and then one rank of giants at the porch's far end, plain piers on the other)
  add({ id: 'ves', nb: 4, bay: 11.5, W: 18, rise: 6, bands: [band(15.2, 1.4, 8.4, 2), band(5.2, 0.6, 4.0, 2)], win: { b0: 1, b1: 1, hw: 1.3, n: 2 }, fl: () => 0 });
  // the nave: high and wide (34 m between its walls, three tiers of figures to 25 m and a fourth beside the high
  // windows, a barrel vault to 44 m); its windows stand in the uppermost tier of the seaward hand ONLY
  const nave = add({ id: 'nave', nb: rl.int(11, 13), bay: 7.6, W: 17, rise: 10.5, bands: [band(11.6, 1.4, 9.2, 1), band(7.0, 0.8, 5.4, 2), band(6.6, 0.7, 5.0, 1), band(9.0, 1.2, 6.4, 2)], win: { b0: 3, b1: 3, hw: 1.9, n: 1 }, fl: () => 0, endGiant: -1 });
  // THE FLOODED HALL: one bay of landing, a stair as wide as the hall going down 14 m in 38.4 (20 degrees), then the
  // flat with its pavement at -14 and the sea standing at -9; it ends at a wall whose door stands half in the sea
  const run = 38.4;
  const sea = add({ id: 'sea', nb: 7 + rl.int(8, 10), bay: 6.4, W: 14, rise: SEA_RISE, yB: LOW_Y,
    bands: [band(SEA_TIERS[0], 1.4, 8.2, 1), band(SEA_TIERS[1], 0.8, 4.9, 2), band(SEA_TIERS[2], 0.8, 5.4, 1), band(SEA_TIERS[3], 0.6, 4.6, 2)], win: { b0: 1, b1: 1, hw: 1.4, n: 1 } });
  sea.s0 = sea.a0 + 6.4; sea.s1 = sea.s0 + run;
  sea.fl = (x) => (x < sea.s0 ? 0 : x < sea.s1 ? LOW_Y * (x - sea.s0) / run : LOW_Y);
  // THE GREAT STAIR: a hall of its own, three corridors wide (84 m), the sea standing in it to either hand of a stair
  // 28 m wide that climbs out of the water in three flights (12.8 m each, 4.67 m of rise) with two landings of 4.8 m
  // to a terrace across the hall's far end; over it a cove rises from the cornice to a round drum of windows (the
  // lantern) 32 m across, its centre over the hall's middle
  const st = add({ id: 'stair', nb: 9, bay: 8, W: 42, rise: 13, yB: LOW_Y, bands: [band(10.6, 1.4, 8.2, 1), band(9.0, 1.0, 7.0, 1), band(11.0, 1.4, 8.6, 1), band(9.4, 1.0, 7.2, 1)], win: null });
  st.SW = 14; st.CW = 19.6; st.run = 12.8; st.land = 4.8; st.s0 = st.a0 + 7; st.s1 = st.s0 + 3 * st.run + 2 * st.land;
  st.stairY = (x) => { const t = x - st.s0, seg = st.run + st.land; if (t <= 0) return LOW_Y; if (x >= st.s1) return 0; const k = Math.min(2, Math.floor(t / seg)); return LOW_Y * (1 - (k + Math.min(1, (t - k * seg) / st.run)) / 3); };
  st.fl = (x, xx = 0) => (x >= st.s1 ? 0 : Math.abs(xx) > st.SW ? LOW_Y : st.stairY(x));
  st.dome = { a: st.a0 + st.L / 2, R: 16, y0: st.top, y1: st.top + 9, y2: st.top + 19, n: 12 };
  // THE WALL THAT FACES THE STAIR (the hall's far wall, over the terrace): three equal storeys between the terrace and
  // the cornice (th); in its middle a great arched door (half breadth hw, springing at spring over the terrace) in a
  // panel of its own (to xd either hand); from the panel to the side wall nm equal bays (m broad), a niche in each
  // storey of each. Where a spoke of the lantern's wheel meets the wall (the spoke next to the axis's: xs from the
  // axis, by the lantern's own place and its count of windows) the two bays about it are one great recess through
  // the two lower storeys (half breadth ghw, springing gspring), and in it stands a colossus (gx from the axis)
  { const xd = 9.6, nm = 6, m = (st.W - xd) / nm, th = st.spring / 3, xs = (st.a1 - st.dome.a) * Math.tan(TAU / st.dome.n), gi = clamp(Math.round((xs - xd) / m), 1, nm - 1), ghw = m - 0.8;
    st.face = { hw: 8, spring: 13, xd, nm, m, th, gi, gx: xd + gi * m, ghw, gspring: 2 * th - 0.7 - ghw }; }
  // the top of the stair's cheek under a place (the three blocks to either hand of the treads), or far below
  st.cheekY = (x, xx) => { const ax = Math.abs(xx), seg = st.run + st.land; if (ax < st.SW || ax > st.CW || x < st.s0 - 1.5 || x > st.s1) return -99; return LOW_Y - LOW_Y / 3 * (Math.min(2, Math.max(0, Math.floor((x - st.s0) / seg))) + 1) + 1.1; };
  // THE HALL OF THE SEA DOORS: 100 m, and its whole seaward side is tall open doors on the sea, one to every pair of
  // bays (eight; 8.4 wide, 15.6 high)
  const hero = add({ id: 'hero', nb: 16, bay: 6.25, W: 15, rise: 7.4, bands: [band(10.6, 1.4, 8.2, 1), band(6.4, 0.8, 4.9, 2), band(6.4, 0.8, 4.9, 1), band(5.2, 0.6, 4.0, 2)], win: null, fl: () => 0 });
  // each door keeps a wave on a round of its own, from the doors' own stream: the cells of the span 5 to 8 s are dealt
  // round the doors first (a shuffle), then to each door its place in its cell, its phase and its reach. One period
  // falls in each cell, 0.15 of a cell and more inside it, so NO TWO DOORS SHARE A PERIOD; every period is shorter
  // than the stay in the hall
  hero.doors = [];
  { const nd = hero.nb / 2, cells = []; for (let k = 0; k < nd; k++) cells.push(k); rd.shuffle(cells);
    for (let k = 0; k < nd; k++) { const bi = 2 * k + 1; hero.doors.push({ a: hero.a0 + bi * hero.bay, bi, hw: 4.2, spring: 11.4, T: 5 + (cells[k] + rd.range(0.15, 0.85)) * 3 / nd, ph: rd(), reach: rd.range(0.55, 1) }); } }
  // THE CLOUD HALL: a second stair up 18 m in 54 (18 degrees) and the upper hall beyond its head, one vessel; its
  // vault is broken open along its length from the fifth bay on (the crown's own stream deals the ribs that stand)
  const rise2 = 54;
  const cl = add({ id: 'cloud', nb: rl.int(21, 22), bay: 6.4, W: 14, rise: 6, bands: [band(10.6, 1.4, 8.2, 1), band(7.4, 0.8, 5.4, 2), band(10.6, 1.4, 8.2, 1), band(6.4, 0.8, 4.9, 2), band(7.0, 0.8, 5.4, 1)], win: null });
  cl.s0 = cl.a0 + 4; cl.s1 = cl.s0 + rise2; cl.fl = (x) => (x < cl.s0 ? 0 : x < cl.s1 ? UP_Y * (x - cl.s0) / rise2 : UP_Y);
  // past the colossus with the nest and the great bird's round the landward wall has fallen over three bays, almost
  // to the pavement: the hall stands open there to the sky, to a sea of cloud and to far halls of the house. WHERE the
  // fall begins is the one draw of a stream of its own ('gapbay'): any bay from the first that lies wholly beyond the
  // great bird's round (the round's middle stands two and a half bays past the colossus's pier, cl.nestBay, and it
  // reaches 6 m and half a span to either side) to the bay that leaves one whole bay standing before the hall's end.
  // What is left of the wall in each of the three bays: the gap's own stream
  cl.nestBay = Math.ceil((cl.s1 - cl.a0) / cl.bay) + 1;
  { const rg = forkOf(seed, 'gap'), first = Math.ceil(cl.nestBay + 2.5 + (6 + BIRD_SPAN[3] / 2) / cl.bay);
    cl.gap = { side: -1, i0: forkOf(seed, 'gapbay').int(first, cl.nb - 4), h: [rg.range(1.2, 3.6), rg.range(0.8, 2.4), rg.range(1.2, 3.6)] }; }
  cl.open0 = 4;
  // the crown's own stream: how many of the vault's ten courses still stand to either hand of each bay (one or two),
  // then for each pier line of the open stretch whether its rib stands whole (two in five), as two stubs (their
  // reaches drawn) or not at all; where the landward wall has fallen no rib springs from that hand
  { const rc = forkOf(seed, 'crown'); cl.edge = []; for (let i = 0; i < cl.nb; i++) cl.edge.push([rc.int(1, 2), rc.int(1, 2)]);
    cl.ribs = [];
    for (let i = cl.open0 + 1; i < cl.nb; i++) {
      const u = rc(), inGap = i >= cl.gap.i0 && i <= cl.gap.i0 + 3; let s1 = 0, s0 = 0;
      if (u < 0.4) { s1 = 1; s0 = 1; } else if (u < 0.85) { s1 = rc.range(0.25, 0.85); s0 = rc.range(0.25, 0.85); }
      if (inGap) { s0 = 0; s1 = Math.min(s1, 0.8); }
      cl.ribs.push([i, s1, s0]);
    } }
  // THE LAST HALL: its vault fallen
  const ruin = add({ id: 'ruin', nb: 14, bay: RUIN_BAY, W: 15, rise: 7, yB: UP_Y, ruin: true, bands: RUIN_BANDS.map((b) => ({ ...b })), win: null, fl: () => UP_Y });
  // how high each bay of the broken walls still stands (metres over the pavement): low on the evening hand, high on the other
  ruin.cut = [[], []];
  // two breaches in the wall of the evening hand, where it has fallen almost to the pavement and the low sun comes
  // through across the floor: by a rule of the hall, one bay of the wall's first half and one of its second, any bay
  // of each (their own stream: the two bays, then each breach's height). A breached bay takes no draw of the layout
  { const rb = forkOf(seed, 'breach'), hb = Math.floor(ruin.nb / 2), bays = [rb.int(0, hb - 1), rb.int(hb, ruin.nb - 1)];
    for (let i = 0; i < ruin.nb; i++) { ruin.cut[0].push(bays.includes(i) ? rb.range(2.2, 4.2) : rl.range(11.5, 17.5)); ruin.cut[1].push(rl.range(19, 28.5)); } }
  const P = { seed, V, nave, sea, st, hero, cl, ruin, end: ruin.a1 + 1.2 };
  // THE SEA OF CLOUD'S ONE HEIGHT (cloudInto says the rule): CLOUD_UNDER m under the cloud hall's own pavement where
  // its wall has fallen, read from that hall's floor law at the middle of its fallen bays; no height is written for it
  P.cloudY = cl.fl(cl.a0 + (cl.gap.i0 + cl.gap.h.length / 2) * cl.bay) - CLOUD_UNDER;
  P.vesselAt = (x) => { for (const v of V) if (x < v.a1 + WT * 0.5) return v; return V[V.length - 1]; };
  P.floorAt = (x) => P.vesselAt(x).fl(x);
  // the top of the tread under a place of a stair (the rule floorInto builds the steps by); elsewhere the floor
  const tread = (x, sA, sB, yA, yB2) => { const n = Math.round((sB - sA) / 0.96), t = (sB - sA) / n, r = (yB2 - yA) / n, j = Math.min(n - 1, Math.max(0, Math.floor((x - sA) / t))); return yA + r * (j + (r > 0 ? 1 : 0)); };
  P.treadY = (x) => {
    if (x > sea.s0 && x < sea.s1) return tread(x, sea.s0, sea.s1, 0, LOW_Y);
    if (x > cl.s0 && x < cl.s1) return tread(x, cl.s0, cl.s1, 0, UP_Y);
    if (x > st.s0 && x < st.s1) { const seg = st.run + st.land, k = Math.min(2, Math.floor((x - st.s0) / seg)), sA = st.s0 + k * seg, h = -LOW_Y / 3; return x < sA + st.run ? tread(x, sA, sA + st.run, LOW_Y + h * k, LOW_Y + h * (k + 1)) : LOW_Y + h * (k + 1); }
    return P.floorAt(x);
  };
  // where one hall's light, air and stone give way to the next's: inside the thickness of the wall between them, from
  // behind the backs of the niches on the wall's near face (1.7 m in) to its far face
  P.joins = V.slice(0, -1).map((v) => [v.a1 + 1.7, v.a1 + WT + 0.2]);
  P.hallMix = (x) => { let hi = 0; for (let i = 0; i < P.joins.length; i++) if (x >= P.joins[i][0]) hi = i + 1; const w = hi ? smoothstep(P.joins[hi - 1][0], P.joins[hi - 1][1], x) : 1; return [Math.max(0, hi - 1), hi, w]; };
  routeInto(P);
  return P;
}
// the route (see the rules at the head of the world file): [a, x, y] knots, a spline through them. A knot is a place
// of the plan (a door's middle, a tread of a stair, a bay of the fallen wall) or stands so many metres or such a
// share of a hall's length from one (the nave's three, the hall of the sea doors' five, the last hall's five)
function routeInto(P) {
  const V = P.V, k = [], nave = P.nave, sea = P.sea, st = P.st, hero = P.hero, cl = P.cl, ruin = P.ruin;
  const door = (v, y) => k.push([v.a1 + WT / 2, 0, y]);
  k.push([0, 0, EYE], [15, 0, EYE], [30, -0.8, EYE + 0.1]); door(V[0], EYE + 0.1);
  // the nave: toward the window hand, so that the sunlit landward wall stands broad, and back to the axis for the door
  k.push([nave.a0 + nave.L * 0.3, 4.4, EYE + 0.6], [nave.a0 + nave.L * 0.62, 3.8, EYE + 0.4], [nave.a1 - 13, 1.2, EYE + 0.1]); door(nave, EYE);
  // down the stair to 3.4 m over the standing sea, along the flat on the landward side of the wader, through the
  // half-flooded door on its axis
  { const s = sea.s0;
    k.push([s, 0.2, EYE], [s + 11, 0.6, 4.6], [s + 22, 0.4, 1.4], [s + 33, -0.6, -1.8], [s + 44, -2, -4.7], [s + 55, -3.2, -5.6]);
    k.push([(sea.s1 + sea.a1) / 2 + 6, -3.4, -5.8], [sea.a1 - 11, -1.4, -5.6]); door(sea, -5.6); }
  // up the great stair on its axis, between the giants on its cheeks: 6 to 7 m over the treads, to the terrace
  { const s = st.s0, seg = st.run + st.land;
    k.push([s + 1, 0, -5.2], [s + st.run, 0, -2.5], [s + seg + st.run * 0.5, 0, 0.4], [s + 2 * seg, 0, 2.6], [st.s1, 0, 6.5], [st.s1 + 9, 0, EYE]); door(st, EYE); }
  k.push([hero.a0 + 12, -2, 6.6], [hero.a0 + 30, -4, 6.8], [hero.a0 + 50, -4.5, 7.0], [hero.a0 + 70, -4, 7.2], [hero.a0 + 88, -2, 7.2]); door(hero, EYE);
  // up the second stair, past the colossus with the nest, toward the window hand before the fallen bays and back to
  // the axis for the last hall's door
  { const s = cl.s0, gm = cl.a0 + (cl.gap.i0 + 1.5) * cl.bay;
    k.push([s + 1, 0, EYE + 0.2], [s + 13.5, 0.8, 11.2], [s + 27, 1.6, 15.9], [s + 40.5, 2.4, 20.4], [s + 54, 3.2, 24.1], [s + 64, 3.6, UP_Y + EYE], [gm - 14, 3, UP_Y + EYE], [gm + 6, 0.4, UP_Y + EYE + 0.2]); door(cl, UP_Y + EYE); }
  for (const d of [78, 66, 50, 33, 16]) k.push([ruin.a1 - d, 0, UP_Y + EYE]);
  k.push([P.end, 0, UP_Y + EYE]);
  P.knots = k; P.path = makePath(k.map((q) => [q[1], q[2], -q[0]]), { samples: 640 }); P.Lm = P.path.length;
}
// ---------------------------------------------------------------- the triangle builder
// kind (aux.x): 0 marble, 1 pavement, 2 window glass, 3 vault, 4 the day outside the sea doors, 5 carved stone (a
// statue, a beast, a giant, rubble), 6 the sea of cloud, 7 a far hall of the house; aux.yz: metres on the face
const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm3 = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
export const MARBLE = [0.69, 0.675, 0.64];
export class Geo {
  constructor() { this.p = []; this.n = []; this.c = []; this.x = []; }
  get tris() { return this.p.length / 9; }
  v(p, n, c, s, kind, au, av) { this.p.push(p[0], p[1], p[2]); this.n.push(n[0], n[1], n[2]); this.c.push(c[0] * s, c[1] * s, c[2] * s); this.x.push(kind, au, av); }
  // a flat triangle or quad, wound to face the hint; sh: a shade for each corner; aux: [u, v] for each corner
  tri(a, b, c, hint, col = MARBLE, kind = 0, sh, aux) {
    let n = norm3(cross3(sub3(b, a), sub3(c, a))), q = [a, b, c], s = sh || [1, 1, 1], x = aux || [[0, 0], [0, 0], [0, 0]];
    if (dot3(n, hint) < 0) { n = [-n[0], -n[1], -n[2]]; q = [a, c, b]; s = [s[0], s[2], s[1]]; x = [x[0], x[2], x[1]]; }
    for (let i = 0; i < 3; i++) this.v(q[i], n, col, s[i], kind, x[i][0], x[i][1]);
  }
  quad(a, b, c, d, hint, col = MARBLE, kind = 0, sh, aux) {
    const s = sh || [1, 1, 1, 1], x = aux || [[0, 0], [0, 0], [0, 0], [0, 0]];
    this.tri(a, b, c, hint, col, kind, [s[0], s[1], s[2]], [x[0], x[1], x[2]]); this.tri(a, c, d, hint, col, kind, [s[0], s[2], s[3]], [x[0], x[2], x[3]]);
  }
  // a block's faces (outward); skip: a string of the faces left out, of x X y Y z Z
  box(x0, y0, z0, x1, y1, z1, col = MARBLE, skip = '', sh = 1) {
    const q = (a, b, c, d, h, s) => this.quad(a, b, c, d, h, col, 0, [s, s, s, s]);
    if (!skip.includes('x')) q([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0], sh * 0.92);
    if (!skip.includes('X')) q([x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0], [1, 0, 0], sh * 0.92);
    if (!skip.includes('y')) q([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [0, -1, 0], sh * 0.6);
    if (!skip.includes('Y')) q([x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1], [0, 1, 0], sh);
    if (!skip.includes('z')) q([x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], [0, 0, -1], sh * 0.92);
    if (!skip.includes('Z')) q([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1], sh * 0.92);
  }
  // append another builder's triangles, turned about y, scaled and moved
  put(o, x, y, z, yaw = 0, s = 1, tint = 1) {
    const cs = Math.cos(yaw), sn = Math.sin(yaw), P = o.p, N = o.n;
    for (let i = 0; i < P.length; i += 3) {
      this.p.push(x + (P[i] * cs + P[i + 2] * sn) * s, y + P[i + 1] * s, z + (-P[i] * sn + P[i + 2] * cs) * s);
      this.n.push(N[i] * cs + N[i + 2] * sn, N[i + 1], -N[i] * sn + N[i + 2] * cs);
      this.c.push(o.c[i] * tint, o.c[i + 1] * tint, o.c[i + 2] * tint); this.x.push(o.x[i], o.x[i + 1], o.x[i + 2]);
    }
  }
  geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3)); g.setAttribute('aux', new THREE.Float32BufferAttribute(this.x, 3));
    g.computeBoundingSphere(); return g;
  }
}
// a panel of wall with a round-headed opening in it. M(u, v, d): the face's own metres to the world, d metres into the
// wall. N: the face's normal, U: the way u runs. The opening: centre uc, half width hw, sill v0, springing vs.
// o.depth: how deep the reveal goes; o.back: { col, kind } closes it (a niche's back, a window's glass)
export function archInto(g, M, N, U, U0, U1, V0, V1, uc, hw, v0, vs, o = {}) {
  const K = o.K || 6, col = o.col || MARBLE, d = o.depth || 0, u0 = uc - hw, u1 = uc + hw, up = [0, 1, 0], nU = [-U[0], -U[1], -U[2]];
  const A = []; for (let k = 0; k <= K; k++) { const th = Math.PI * (1 - k / K); A.push([uc + hw * Math.cos(th), vs + hw * Math.sin(th)]); }
  // THE STONE IS CLOSED AT ITS SEAMS (p1): the face under the sill is three pieces that share the opening's two lower
  // corners with the pieces beside it and with the sill (one piece from edge to edge left a seam along the sill's
  // line: a sight could pass between it and the sill); o.foot: the face goes that far down past V0 (a panel that
  // stands on a pavement goes under it, so the pavement's edge meets the face and not the face's own edge)
  // (an opening that stands on the pavement, a door: the face's two sides go under the pavement as pieces of their
  // own, so the jamb's lower corner is a corner of the face too)
  const VB = V0 - (o.foot || 0);
  if (v0 > V0 + 1e-3) { g.quad(M(U0, VB, 0), M(u0, VB, 0), M(u0, v0, 0), M(U0, v0, 0), N, col); g.quad(M(u0, VB, 0), M(u1, VB, 0), M(u1, v0, 0), M(u0, v0, 0), N, col); g.quad(M(u1, VB, 0), M(U1, VB, 0), M(U1, v0, 0), M(u1, v0, 0), N, col); }
  else if (o.foot) { g.quad(M(U0, VB, 0), M(u0, VB, 0), M(u0, v0, 0), M(U0, v0, 0), N, col); g.quad(M(u1, VB, 0), M(U1, VB, 0), M(U1, v0, 0), M(u1, v0, 0), N, col); }
  g.quad(M(U0, v0, 0), M(u0, v0, 0), M(u0, vs, 0), M(U0, vs, 0), N, col); g.quad(M(u1, v0, 0), M(U1, v0, 0), M(U1, vs, 0), M(u1, vs, 0), N, col);
  g.tri(M(U0, vs, 0), M(u0, vs, 0), M(U0, V1, 0), N, col); g.tri(M(u1, vs, 0), M(U1, vs, 0), M(U1, V1, 0), N, col);
  for (let k = 0; k < K; k++) { const t0 = lerp(U0, U1, k / K), t1 = lerp(U0, U1, (k + 1) / K); g.quad(M(A[k][0], A[k][1], 0), M(A[k + 1][0], A[k + 1][1], 0), M(t1, V1, 0), M(t0, V1, 0), N, col); }
  // (a panel whose opening goes through the wall, a door, has no back to stand a backing behind: the stone round
  // its opening is doubled SKIN m behind the face, so a sight that passes a seam at the panel's edge ends on stone)
  if (!o.back) { const e = SKIN, sh = [0.8, 0.8, 0.8, 0.8];
    g.quad(M(U0, VB, e), M(u0, VB, e), M(u0, vs, e), M(U0, vs, e), N, col, 0, sh); g.quad(M(u1, VB, e), M(U1, VB, e), M(U1, vs, e), M(u1, vs, e), N, col, 0, sh);
    g.tri(M(U0, vs, e), M(u0, vs, e), M(U0, V1, e), N, col, 0, sh); g.tri(M(u1, vs, e), M(U1, vs, e), M(U1, V1, e), N, col, 0, sh);
    for (let k = 0; k < K; k++) { const t0 = lerp(U0, U1, k / K), t1 = lerp(U0, U1, (k + 1) / K); g.quad(M(A[k][0], A[k][1], e), M(A[k + 1][0], A[k + 1][1], e), M(t1, V1, e), M(t0, V1, e), N, col, 0, sh); } }
  if (d > 0) {
    const dk = o.dark ?? 0.55, sh = [1, dk, dk, 1];
    const rk = o.panel ? 3 : 0, rx = [[0.25, v0 - 0.3], [d + 0.25, v0 - 0.3], [d + 0.25, vs], [0.25, vs]];
    g.quad(M(u0, v0, 0), M(u0, v0, d), M(u0, vs, d), M(u0, vs, 0), U, col, rk, sh, rx); g.quad(M(u1, v0, 0), M(u1, v0, d), M(u1, vs, d), M(u1, vs, 0), nU, col, rk, sh, rx);
    for (let k = 0; k < K; k++) { const a = A[k], b = A[k + 1], mu = (a[0] + b[0]) / 2 - uc, mv = (a[1] + b[1]) / 2 - vs; g.quad(M(a[0], a[1], 0), M(a[0], a[1], d), M(b[0], b[1], d), M(b[0], b[1], 0), [-U[0] * mu, -mv, -U[2] * mu], col, 0, [0.9, dk * 0.9, dk * 0.9, 0.9]); }
    if (!o.noSill) g.quad(M(u0, v0, 0), M(u1, v0, 0), M(u1, v0, d), M(u0, v0, d), up, col, 0, [1, 1, dk, dk]);
  }
  if (o.back) {
    const bc = o.back.col, bk = o.back.kind || 0, ax = (u, v) => [u - uc, v - v0], s = o.back.sh || [1, 1, 1, 1];
    g.quad(M(u0, v0, d), M(u1, v0, d), M(u1, vs, d), M(u0, vs, d), N, bc, bk, [s[0], s[0], s[1], s[1]], [ax(u0, v0), ax(u1, v0), ax(u1, vs), ax(u0, vs)]);
    // (the back's round head is cut from its own first corner, so no corner of it lies in the middle of the edge
    // it shares with the back's square part: that left a seam at the springing)
    for (let k = 1; k < K; k++) g.tri(M(A[0][0], A[0][1], d), M(A[k][0], A[k][1], d), M(A[k + 1][0], A[k + 1][1], d), N, bc, bk, [s[1], s[1], s[1]], [ax(A[0][0], A[0][1]), ax(A[k][0], A[k][1]), ax(A[k + 1][0], A[k + 1][1])]);
  }
}

// ---------------------------------------------------------------- a hall's walls, vault, pavement and doors
// one side wall of a vessel: bays of bands; in each a niche (its slot is kept for a statue), a tall window on the window
// hand, a seaward door, or plain stone where a stair or a break leaves no room
// (the measures of the two halls' own wall orders, said where they are built in wallInto)
// (p1, the stone closed: how far a panel that stands on a pavement goes down past it; the backing behind a wall's
// face: how deep in it stands (side walls and the facing wall; a cross wall) and how far under the lowest tier's foot)
export const FOOT = 0.3, SKIN = 0.06, BACKING = { deep: 1.95, cross: 1.65, under: 6, corner: 2.5 };
// (p1m1) THE WALLS' ASHLAR, one measure for the look that paints it and for what is built of it (the broken ends of
// the cloud hall's fallen wall, the stones at its foot): courses h m high of stones l m long in running bond, in the
// world's own metres; and how deep a wall's masonry is where its broken top or end shows it
export const ASHLAR = { h: 0.9, l: 2.1 }, WALL_DEEP = 2.6;
export const PIER = { proud: 0.7, hw: 0.9, up: 0.52, uhw: 0.44, arch: 0.3 }, COLUMN = { proud: 0.86, hw: 0.6, r: 0.44, least: 4.5 };
export function wallInto(g, v, side, slots, wins) {
  const M = (u, y, d) => [side * (v.W + d), y, -u], N = [-side, 0, 0], U = [0, 0, -1], si = side > 0 ? 1 : 0, NB = v.bands.length;
  const doorAt = (i) => side > 0 && v.doors && v.doors.find((d) => i === d.bi - 1 || i === d.bi);
  // how high a bay of this wall stands: whole (Infinity), or broken off (the last hall; the fallen bays of a gap)
  // (p1m1: a fallen bay's stump stands so high OVER THE PAVEMENT OF ITS OWN BAY, as the plan says of it. Till now it
  // was measured from the hall's foot, which in the cloud hall lies 18 m under the upper pavement: no stump stood at
  // all, the pavement's edge fell straight into the cloud and the standing wall's end went down past the floor)
  const cutAt = (i) => (v.ruin ? v.yB + v.cut[si][i] : v.gap && side === v.gap.side && i >= v.gap.i0 && i < v.gap.i0 + v.gap.h.length ? v.fl(v.a0 + (i + 0.5) * v.bay, side * v.W) + v.gap.h[i - v.gap.i0] : Infinity);
  for (let i = 0; i < v.nb; i++) {
    const u0 = v.a0 + i * v.bay, u1 = u0 + v.bay, xs = side * v.W, fmax = Math.max(v.fl(u0, xs), v.fl(u1, xs)), fmin = Math.min(v.fl(u0, xs), v.fl(u1, xs));
    const cut = cutAt(i), sd = doorAt(i);
    for (let b = 0; b < NB; b++) {
      const B = v.bands[b], y0 = B.y0, y1 = y0 + B.h;
      if (y1 <= fmin + 0.01 || y0 >= cut) continue;
      // the course at the band's foot
      if (b > 0 && y0 > fmin && !(sd && b < 2)) g.box(side > 0 ? v.W - 0.5 : -v.W, y0 - 0.24, -u1, side > 0 ? v.W : -v.W + 0.5, y0 + 0.2, -u0, MARBLE, (side > 0 ? 'X' : 'x') + ((doorAt(i - 1) || doorAt(i + 1)) && b < 2 ? '' : 'zZ'), 1.04);
      if (sd && b < 2) continue;
      const isWin = side > 0 && v.win && b >= v.win.b0 && b <= v.win.b1;
      if (isWin && b > v.win.b0) continue;
      const yT = isWin ? v.bands[v.win.b1].y0 + v.bands[v.win.b1].h : Math.min(y1, cut), open = y0 >= fmax - 0.05 && yT <= cut && y1 <= cut;
      const ft = Math.abs(y0 - fmin) < 0.06 || Math.abs(y0 - fmax) < 0.06 ? FOOT : 0;
      if (!open) { g.quad(M(u0, y0 - ft, 0), M(u1, y0 - ft, 0), M(u1, yT, 0), M(u0, yT, 0), N); continue; }
      const n = isWin ? v.win.n : B.n, w = v.bay / n;
      for (let j = 0; j < n; j++) {
        const U0 = u0 + j * w, U1 = U0 + w, uc = U0 + w / 2, v0 = y0 + B.sill;
        if (isWin) { const hw = v.win.hw, vs = yT - 0.7 - hw; archInto(g, M, N, U, U0, U1, y0, yT, uc, hw, v0, vs, { depth: 1.1, back: { col: [1, 1, 1], kind: 2 }, dark: 0.8, foot: ft }); wins.push({ vi: v.i, a: uc, hw, v0, vs, W: v.W, fl: v.fl(uc, xs) }); }
        else {
          const hw = Math.min(B.nh * 0.26, w * 0.5 - 0.5), vs = v0 + B.nh - hw, dp = Math.min(1.9, hw * 0.9);
          archInto(g, M, N, U, U0, U1, y0, yT, uc, hw, v0, vs, { depth: dp, back: { col: MARBLE, sh: [1.0, 0.72] }, dark: 0.85, foot: ft });
          slots.push({ x: side * (v.W + dp * 0.45), y: v0, z: -uc, yaw: -side * Math.PI / 2, h: B.nh - 0.35, w: hw * 1.8, vi: v.i, bi: i, ti: b, sj: j, side });
        }
      }
    }
    // THE BACKING (p1): behind every bay of a wall, BACKING.deep m in (behind the deepest niche's back, under a
    // broken wall's top), one plain face of the wall's stone turned to the hall, from BACKING.under m below the
    // lowest tier's foot to the springing (to the break of a broken bay; from the head of the two lower tiers where a
    // sea door stands, which is open to the day). Nothing of it is seen but through a seam between two pieces of the
    // face: a sight that passes one now ends on stone, not on the day behind the house
    // (at a hall's two ends it runs BACKING.corner m on into the cross wall's own thickness, where no hall is: a
    // sight that passes a seam beside the corner ends on it; not before the porch, which has no wall before it, and
    // not past the last hall's end wall, which is broken and open above)
    { const lo = sd ? v.bands[2].y0 : Math.min(fmin, v.bands[0].y0) - BACKING.under, hi = Math.min(v.spring, cut), D = BACKING.deep;
      const b0 = u0 - (i === 0 && v.i ? BACKING.corner : 0), b1 = u1 + (i === v.nb - 1 && !v.ruin ? BACKING.corner : 0);
      if (hi > lo + 0.01) g.quad(M(b0, lo, D), M(b1, lo, D), M(b1, hi, D), M(b0, hi, D), N, MARBLE, 0, [0.8, 0.8, 0.8, 0.8]); }
    {
      // a broken wall's top and the step to the next bay (a whole wall's end shows its thickness to the spring)
      if (cut < Infinity) g.quad(M(u0, cut, 0), M(u1, cut, 0), M(u1, cut, WALL_DEEP), M(u0, cut, WALL_DEEP), [0, 1, 0], MARBLE, 0, [0.9, 0.9, 0.7, 0.7]);
      const c2 = i + 1 < v.nb ? cutAt(i + 1) : cut;
      if (c2 !== cut) { const lo = Math.min(cut, c2), hi = Math.min(Math.max(cut, c2), v.spring); g.quad(M(u1, lo, 0), M(u1, lo, WALL_DEEP), M(u1, hi, WALL_DEEP), M(u1, hi, 0), [0, 0, c2 > cut ? 1 : -1], MARBLE, 0, [0.85, 0.6, 0.6, 0.85]); }
    }
  }
  for (const d of (side > 0 && v.doors) || []) archInto(g, M, N, U, d.a - v.bay, d.a + v.bay, v.yB, v.bands[2].y0, d.a, d.hw, v.yB, v.yB + d.spring, { depth: 2.6, noSill: true, K: 8, dark: 0.7, foot: FOOT });
  // pilasters between the bays
  for (let i = 0; i <= v.nb; i++) {
    const a = v.a0 + i * v.bay, d = side > 0 && v.doors && v.doors.find((q) => q.bi === i);
    const yt = Math.min(cutAt(Math.max(0, i - 1)), cutAt(Math.min(v.nb - 1, i)), v.ruin ? Infinity : v.spring), yb = d ? v.bands[2].y0 : v.yB;
    g.box(side > 0 ? v.W - 0.34 : -v.W, yb, -a - 0.5, side > 0 ? v.W : -v.W + 0.34, yt, -a + 0.5, MARBLE, (side > 0 ? 'X' : 'x') + 'yY', 1.05);
  }
  // A WALL ORDER OF ITS OWN TO TWO HALLS (the plain pilasters above stand in every hall; these two halls have more).
  // THE HALL OF THE SEA DOORS, its landward wall (the wall the doors' daylight falls on): a stepped BUTTRESS at every
  // bay line, on the pilaster's own line: a plinth, a broad lower stage through the lowest tier, a weathering (a
  // slope of stone) under the second tier's string course, a narrower upper stage through the two tiers of the
  // middle, a second weathering back to the pilaster. PIER.proud is the most any part of it stands out of the wall's
  // face: less than the metre every bird's round keeps off that face (birdRoundsSteps: inside) and than the 1.5 m a
  // lifting bird steps out, so no round and no lift is dealt anew by it; its half breadth leaves the lowest tier's
  // niches (0.99 m from the bay line) and the paired niches over them (0.5 m) whole. 9.8 m and more from the line
  if (v.id === 'hero' && side < 0) for (let i = 0; i <= v.nb; i++) {
    const a = v.a0 + i * v.bay, Q = PIER, y1 = v.bands[1].y0 - 0.24, y3 = v.bands[3].y0 - 0.24, xw = side * v.W, X = (d) => xw - side * d, zz = (h) => [-Math.min(v.a1, a + h), -Math.max(v.a0, a - h)];
    const stage = (d, h, yA, yB, sh, top) => { const [z0, z1] = zz(h); g.box(Math.min(xw, X(d)), yA, z0, Math.max(xw, X(d)), yB, z1, MARBLE, (side > 0 ? 'X' : 'x') + 'y' + (top ? '' : 'Y'), sh); };
    // (a weathering: the slope from a stage's face and flanks up and back to the stage over it)
    const slope = (d0, h0, d1, h1, yA, yB) => { const [a0, a1] = zz(h0), [b0, b1] = zz(h1);
      g.quad([X(d0), yA, a0], [X(d0), yA, a1], [X(d1), yB, b1], [X(d1), yB, b0], [-side, 1, 0], MARBLE, 0, [1.08, 1.08, 1.0, 1.0]);
      g.quad([xw, yA, a0], [X(d0), yA, a0], [X(d1), yB, b0], [xw, yB, b0], [0, 1, -1], MARBLE, 0, [0.8, 0.8, 0.8, 0.8]); g.quad([xw, yA, a1], [X(d0), yA, a1], [X(d1), yB, b1], [xw, yB, b1], [0, 1, 1], MARBLE, 0, [0.8, 0.8, 0.8, 0.8]); };
    stage(Q.proud, Q.hw, v.yB, v.yB + 1.3, 0.98, true); stage(Q.proud - 0.1, Q.hw - 0.1, v.yB + 1.3, y1 - 1.0, 1.04);
    slope(Q.proud - 0.1, Q.hw - 0.1, Q.up, Q.uhw, y1 - 1.0, y1); stage(Q.up, Q.uhw, y1, y3, 1.04); slope(Q.up, Q.uhw, 0.34, Q.uhw, y3, y3 + 0.9);
    // and from buttress to buttress AN ARCADE: about the head of the lowest tier's niche in each bay a band of stone
    // (an archivolt, Q.arch proud: no more than the string courses) on the niche's own centre and springing, from an
    // impost on either buttress; its crown ends under the second tier's string course. The niche is as it was
    if (i < v.nb) { const B = v.bands[0], uc = a + v.bay / 2, hw = Math.min(B.nh * 0.26, v.bay * 0.5 - 0.5), vs = B.y0 + B.sill + B.nh - hw, r0 = hw + 0.22, r1 = Math.min(hw + 0.74, y1 - 0.02 - vs), K = 10, d = Q.arch;
      const pt = (t, r, dd) => [X(dd), vs + r * Math.sin(t), -(uc + r * Math.cos(t))];
      for (let k = 0; k < K; k++) { const t0 = Math.PI * k / K, t1 = Math.PI * (k + 1) / K, tm = (t0 + t1) / 2;
        g.quad(pt(t0, r0, d), pt(t1, r0, d), pt(t1, r1, d), pt(t0, r1, d), [-side, 0, 0], MARBLE, 0, [1.07, 1.07, 1.07, 1.07]);
        g.quad(pt(t0, r0, 0), pt(t1, r0, 0), pt(t1, r0, d), pt(t0, r0, d), [0, -Math.sin(tm), Math.cos(tm)], MARBLE, 0, [0.6, 0.6, 0.74, 0.74]);
        g.quad(pt(t0, r1, 0), pt(t1, r1, 0), pt(t1, r1, d), pt(t0, r1, d), [0, Math.sin(tm), -Math.cos(tm)], MARBLE, 0, [0.9, 0.9, 1, 1]); }
      if (!i) stage(Q.proud, Q.hw, vs - 0.3, vs + 0.12, 1.06, true); P1: { const al = a + v.bay, z0 = -Math.min(v.a1, al + Q.hw), z1 = -Math.max(v.a0, al - Q.hw); g.box(Math.min(xw, X(Q.proud)), vs - 0.3, z0, Math.max(xw, X(Q.proud)), vs + 0.12, z1, MARBLE, side > 0 ? 'X' : 'x', 1.06); } }
  }
  // THE CLOUD HALL, both its walls: an ORDER OF ENGAGED COLUMNS, storey over storey: at every bay line, in every tier
  // that stands clear of the stair there, a three-quarter round shaft before the pilaster on a pedestal of its own,
  // under a capital that meets the string course of the tier above (the uppermost meets the cornice). A column
  // stands on its tier's foot, or on the stair where the stair has risen past that foot; a tier of which less than
  // COLUMN.least m stands over the stair has none, and none stands at a bay line where the wall beside it has fallen
  // below that tier's head. COLUMN.proud is the most any part stands out of the wall's face: under the 1.85 m the
  // great white bird's wing keeps off it (the hall has no other round); the pedestal's half breadth leaves the
  // paired niches (0.5 m from the bay line at their nearest, the shaft 0.5 m broad there) whole. 9.5 m from the line
  if (v.id === 'cloud') for (let i = 0; i <= v.nb; i++) {
    const a = v.a0 + i * v.bay, Q = COLUMN, xw = side * v.W, X = (d) => xw - side * d, stands = Math.min(cutAt(Math.max(0, i - 1)), cutAt(Math.min(v.nb - 1, i))), fl = Math.max(v.fl(a - Q.hw), v.fl(a + Q.hw)), NB2 = v.bands.length;
    const blk = (d, h, yA, yB, sh, sk = '') => g.box(Math.min(xw, X(d)), yA, -Math.min(v.a1, a + h), Math.max(xw, X(d)), yB, -Math.max(v.a0, a - h), MARBLE, (side > 0 ? 'X' : 'x') + sk, sh);
    for (let b = 0; b < NB2; b++) {
      const B = v.bands[b], top = B.y0 + B.h - (b + 1 < NB2 ? 0.24 : 0.3), foot = Math.max(B.y0 + (b ? 0.06 : 0), fl), r = B.h > 9 ? Q.r : Q.r * 0.8, ax = Q.proud - Q.r;
      if (top - foot < Q.least || stands < B.y0 + B.h) continue;
      // the pedestal (from under the tier's string course, or from the stair's lower tread where it stands on the stair), the shaft in eight flat
      // faces round three quarters of a circle, an echinus widening to the abacus, the abacus
      blk(Q.proud, Q.hw, foot > fl ? B.y0 - 0.24 : Math.min(foot, v.fl(a - Q.hw)), foot + 0.8, 0.97, 'y'); const s0 = foot + 0.8, s1 = top - 0.75, K = 8;
      for (let k = 0; k < K; k++) { const t0 = -0.75 * Math.PI + 1.5 * Math.PI * k / K, t1 = t0 + 1.5 * Math.PI / K, P0 = [X(ax + r * Math.cos(t0)), -a + r * Math.sin(t0)], P1 = [X(ax + r * Math.cos(t1)), -a + r * Math.sin(t1)], tm = (t0 + t1) / 2, sh = 1.07 - 0.1 * Math.abs(Math.sin(tm));
        g.quad([P0[0], s0, P0[1]], [P1[0], s0, P1[1]], [P1[0], s1, P1[1]], [P0[0], s1, P0[1]], [-side * Math.cos(tm), 0, Math.sin(tm)], MARBLE, 0, [sh * 0.92, sh * 0.92, sh, sh]); }
      { const e0 = ax + r, h0 = r, e1 = Q.proud, h1 = Q.hw, yA = s1, yB = top - 0.35;
        g.quad([X(e0), yA, -a - h0], [X(e0), yA, -a + h0], [X(e1), yB, -a + h1], [X(e1), yB, -a - h1], [-side, -1, 0], MARBLE, 0, [0.82, 0.82, 0.95, 0.95]);
        for (const e of [-1, 1]) g.quad([xw, yA, -a + e * h0], [X(e0), yA, -a + e * h0], [X(e1), yB, -a + e * h1], [xw, yB, -a + e * h1], [0, -1, e], MARBLE, 0, [0.8, 0.8, 0.9, 0.9]); }
      blk(Q.proud, Q.hw, top - 0.35, top, 1.05);
    }
  }
  // the cornice under the vault (broken where a gap is)
  if (!v.ruin) { const gp = v.gap && side === v.gap.side ? v.gap : null, runs = gp ? [[v.a0, v.a0 + gp.i0 * v.bay], [v.a0 + (gp.i0 + gp.h.length) * v.bay, v.a1]] : [[v.a0, v.a1]];
    for (const [c0, c1] of runs) g.box(side > 0 ? v.W - 0.6 : -v.W, v.spring - 0.3, -c1, side > 0 ? v.W : -v.W + 0.6, v.spring + 0.25, -c0, MARBLE, (side > 0 ? 'X' : 'x') + (gp ? '' : 'zZ'), 1.04);
    // a string course under each tier above the lowest, 0.3 m proud of the wall (not across the seaward doors, which
    // rise through the two lower tiers)
    for (const [c0, c1] of runs) for (let bi = 1; bi < v.bands.length; bi++) { if (side > 0 && v.doors && bi <= 2) continue; const y = v.bands[bi].y0; g.box(side > 0 ? v.W - 0.3 : -v.W, y - 0.24, -c1, side > 0 ? v.W : -v.W + 0.3, y + 0.06, -c0, MARBLE, (side > 0 ? 'X' : 'x') + (gp ? '' : 'zZ'), 1.05); } }
}
// (the cloud hall's ribs: a stub's reach as shares of the half arch for the least and the greatest dealt reach; a
// stub's section at its broken end [inner depth, outer, half breadth]; how far an impost stands out of the wall)
export const RIB_STUB = [0.2, 0.53], RIB_END = [0.5, -0.1, 0.42], RIB_IMPOST = 1.3;
// a hall's roof, by the hall's own rule: a barrel vault (the porch, the nave, the flooded hall, the hall of the sea
// doors); a cove rising to a round drum of windows and a dome (the great stair); a vault broken open along its
// length, of which the haunches and some ribs still stand (the cloud hall); none (the last hall)
export function vaultInto(g, v) {
  const col = [MARBLE[0] * 0.96, MARBLE[1] * 0.96, MARBLE[2] * 0.96];
  if (v.id === 'stair') { coveInto(g, v, col); return; }
  const K = v.id === 'nave' ? 12 : 10, arc = Math.PI * (v.W + v.rise) / 2;
  const pt = (t, r, a) => [(v.W - r) * Math.cos(t), v.spring + (v.rise - r) * Math.sin(t), -a];
  for (let i = 0; i < v.nb; i++) {
    const u0 = v.a0 + i * v.bay, u1 = u0 + v.bay;
    // where the wall under it has fallen the vault's haunch is gone too (deepest over the middle bay of the gap)
    const gi = v.gap ? i - v.gap.i0 : -1, gone = gi >= 0 && gi < 3 ? (gi === 1 ? 4 : 3) : 0;
    // the open crown: of each bay only the haunches stand, one or two courses of the vault to either hand (v.edge)
    const open = v.edge && i >= v.open0, e = open ? v.edge[i] : null;
    for (let k = 0; k < K; k++) {
      if (gone && (v.gap.side < 0 ? k >= K - gone : k < gone)) continue;
      if (open && k >= e[1] && k < K - e[0]) continue;
      const t0 = Math.PI * k / K, t1 = Math.PI * (k + 1) / K, p0 = pt(t0, 0, u0), p1 = pt(t1, 0, u0);
      g.quad(p0, p1, pt(t1, 0, u1), pt(t0, 0, u1), [-(p0[0] + p1[0]), -1 - (p0[1] + p1[1] - 2 * v.spring), 0], col, 3, null, [[arc * k / K, u0], [arc * (k + 1) / K, u0], [arc * (k + 1) / K, u1], [arc * k / K, u1]]);
    }
    // the broken edge shows the vault's thickness (0.9 m) toward the opening
    if (open) for (const [k, sg] of [[e[1], 1], [K - e[0], -1]]) {
      if (gone && sg < 0) continue;
      const t = Math.PI * k / K; g.quad(pt(t, 0, u0), pt(t, 0, u1), pt(t, -0.9, u1), pt(t, -0.9, u0), [-Math.sin(t) * sg, Math.cos(t) * sg, 0], MARBLE, 0, [0.8, 0.8, 0.62, 0.62]);
    }
  }
  // THE RIBS THAT STILL STAND ACROSS THE OPEN CROWN, at a pier line (v.ribs: [pier line, what the crown's stream
  // dealt the seaward springing, what it dealt the landward one]: 1 and 1 a whole rib, 0 none, else a stub). The law
  // (p1): a rib is WHOLE from wall to wall, an arch of stone 1.1 m deep and 1.3 m broad as it was; or it is a STUB
  // that springs from its pier and ends within RIB_STUB of the half arch (the dealt reach of 0.25 to 0.85 laid on
  // that span, no draw moved: at the most 4.6 m out from the wall, a sixth of the hall's breadth, and 4.4 m up),
  // 1.1 m deep and 1.3 broad at the springing and RIB_END at its broken end, which is broken aslant; and EVERY
  // springing stands on an impost: the cornice breaks forward round the rib's foot (RIB_IMPOST proud of the wall,
  // 1.9 m broad) on a corbel block that takes in the abacus of the hall's uppermost column, so that pier, column,
  // corbel, impost and rib are one stone from the pavement up. No piece of a rib stands without its springing
  const ribs = v.ribs || [], Q = RIB_STUB;
  for (const [i, d1, d0] of ribs) {
    const a = v.a0 + i * v.bay, R = 10;
    for (const [dealt, sg] of [[d1, 1], [d0, -1]]) {
      if (dealt <= 0) continue;
      const whole = dealt >= 1, sh = whole ? 1 : Q[0] + clamp((dealt - 0.25) / 0.6, 0, 1) * (Q[1] - Q[0]);
      const n = whole ? Math.max(1, Math.round(sh * R / 2)) : Math.max(3, Math.round(sh * R / 1.2)), T = (q) => (sg > 0 ? q : Math.PI - q), end = sh * Math.PI / 2;
      const ri = (f) => (whole ? 1.1 : lerp(1.1, RIB_END[0], f)), ro = (f) => (whole ? -0.3 : lerp(-0.3, RIB_END[1], f)), hb = (f) => (whole ? 0.65 : lerp(0.65, RIB_END[2], f));
      // (where the inner and the outer edge of the section stand along the arch: alike, but for a stub's broken end)
      const to = (q) => T(end * q / n), ti = (q) => (whole || q < n ? to(q) : T(end * (1 - 0.4 / n)));
      for (let q = 0; q < n; q++) {
        const f0 = q / n, f1 = (q + 1) / n, i0 = ti(q), i1 = ti(q + 1), o0 = to(q), o1 = to(q + 1), tm = (o0 + o1) / 2, nn = [Math.cos(tm), Math.sin(tm), 0];
        g.quad(pt(i0, ri(f0), a - hb(f0)), pt(i1, ri(f1), a - hb(f1)), pt(i1, ri(f1), a + hb(f1)), pt(i0, ri(f0), a + hb(f0)), [-nn[0], -nn[1], 0], MARBLE, 0, [0.62, 0.62, 0.62, 0.62]);
        g.quad(pt(i0, ri(f0), a - hb(f0)), pt(i1, ri(f1), a - hb(f1)), pt(o1, ro(f1), a - hb(f1)), pt(o0, ro(f0), a - hb(f0)), [0, 0, 1]);
        g.quad(pt(i0, ri(f0), a + hb(f0)), pt(i1, ri(f1), a + hb(f1)), pt(o1, ro(f1), a + hb(f1)), pt(o0, ro(f0), a + hb(f0)), [0, 0, -1]);
        g.quad(pt(o0, ro(f0), a - hb(f0)), pt(o1, ro(f1), a - hb(f1)), pt(o1, ro(f1), a + hb(f1)), pt(o0, ro(f0), a + hb(f0)), nn, MARBLE, 0, [0.95, 0.95, 0.95, 0.95]);
      }
      if (!whole) { const t = to(n), tI = ti(n); g.quad(pt(tI, ri(1), a - hb(1)), pt(tI, ri(1), a + hb(1)), pt(t, ro(1), a + hb(1)), pt(t, ro(1), a - hb(1)), [-Math.sin(t) * sg, Math.cos(t) * sg, 0], MARBLE, 0, [0.8, 0.8, 0.7, 0.7]); }
      // the impost and its corbel
      const xw = sg * v.W, X = (d) => xw - sg * d, blk = (d, h, yA, yB, sh2) => g.box(Math.min(xw, X(d)), yA, -a - h, Math.max(xw, X(d)), yB, -a + h, MARBLE, sg > 0 ? 'X' : 'x', sh2);
      blk(RIB_IMPOST, 0.95, v.spring - 0.3, v.spring + 0.25, 1.05); blk(RIB_IMPOST - 0.25, 0.8, v.spring - 0.75, v.spring - 0.3, 0.98);
    }
  }
}
// the great stair's roof: a cove from the cornice of the four walls up to a round ring, on the ring a drum with
// twelve tall windows (the lantern), on the drum a dome. aux of the cove and dome: (the turn in window spacings, the
// share of the way up)
function coveInto(g, v, col) {
  const D = v.dome, N = 48, M = 6, Wx = v.W, Wz = v.L / 2, cz = -D.a, hp = Math.PI / 2;
  const P = (j, s) => { const th = TAU * j / N, c = Math.cos(th), sn = Math.sin(th), d = Math.min(Wx / Math.max(1e-6, Math.abs(c)), Wz / Math.max(1e-6, Math.abs(sn))), f = 1 - Math.cos(s * hp), r = lerp(d, D.R, f); return [c * r, v.spring + v.rise * Math.sin(s * hp), cz + sn * r]; };
  for (let j = 0; j < N; j++) for (let m = 0; m < M; m++) {
    const a = P(j, m / M), b = P(j + 1, m / M), c = P(j + 1, (m + 1) / M), d = P(j, (m + 1) / M);
    g.quad(a, b, c, d, [-(a[0] + b[0]), -1.5, -(a[2] + b[2] - 2 * cz)], col, 3, null, [[j / 4, m / M], [(j + 1) / 4, m / M], [(j + 1) / 4, (m + 1) / M], [j / 4, (m + 1) / M]]);
  }
  // (the cove's foot is a ring of N straight pieces on the walls' tops: the piece that passes a corner of the hall
  // cuts it off. That corner is closed with a level piece of the cove's own stone, from the foot to the corner)
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const j = Math.floor(((Math.atan2(sz * Wz, sx * Wx) + TAU) % TAU) / (TAU / N));
    g.tri(P(j, 0), [sx * Wx, v.spring, cz + sz * Wz], P(j + 1, 0), [0, -1, 0], col, 3, null, [[j / 4, 0], [(j + 0.5) / 4, 0], [(j + 1) / 4, 0]]); }
  const C = (j, y, r = D.R) => { const th = TAU * j / N; return [Math.cos(th) * r, y, cz + Math.sin(th) * r]; }, inw = (j) => { const th = TAU * (j + 0.5) / N; return [-Math.cos(th), 0, -Math.sin(th)]; };
  const w0 = D.y0 + 1.3, w1 = D.y1 - 0.9;
  for (let j = 0; j < N; j++) {
    const win = j % 4 < 2, n = inw(j);
    g.quad(C(j, D.y0), C(j + 1, D.y0), C(j + 1, w0), C(j, w0), n, MARBLE, 0, [0.8, 0.8, 0.9, 0.9]);
    g.quad(C(j, w1), C(j + 1, w1), C(j + 1, D.y1), C(j, D.y1), n, MARBLE, 0, [0.9, 0.9, 0.8, 0.8]);
    if (win) g.quad(C(j, w0), C(j + 1, w0), C(j + 1, w1), C(j, w1), n, [1, 1, 1], 2, null, [[j % 4 ? 1.2 : -1.2, 0], [j % 4 ? 3.2 : 0.8, 0], [j % 4 ? 3.2 : 0.8, w1 - w0], [j % 4 ? 1.2 : -1.2, w1 - w0]]);
    else g.quad(C(j, w0), C(j + 1, w0), C(j + 1, w1), C(j, w1), n, MARBLE, 0, [0.86, 0.86, 0.86, 0.86]);
  }
  const Q = (j, m) => { const ph = hp * m / 4; return C(j * 2, D.y1 + (D.y2 - D.y1) * Math.sin(ph), D.R * Math.cos(ph)); };
  for (let j = 0; j < N / 2; j++) for (let m = 0; m < 4; m++) {
    const a = Q(j, m), b = Q(j + 1, m), c = Q(j + 1, m + 1), d = Q(j, m + 1);
    if (m < 3) g.quad(a, b, c, d, [-(a[0] + b[0]), -1.5, -(a[2] + b[2] - 2 * cz)], col, 3, null, [[j / 2, 1 + m / 4], [(j + 1) / 2, 1 + m / 4], [(j + 1) / 2, 1 + (m + 1) / 4], [j / 2, 1 + (m + 1) / 4]]);
    else g.tri(a, b, c, [0, -1, 0], col, 3, null, [[j / 2, 1.75], [(j + 1) / 2, 1.75], [j / 2, 2]]);
  }
}
// the pavement; a stair is real steps across its whole width
export function floorInto(g, v) {
  const W = v.W, A0 = v.i ? v.a0 - WT : v.a0, A1 = v.a1 + (v.ruin ? WT + 0.5 : 0), up = [0, 1, 0];
  const steps = (sA, sB, yA, yB2, X) => {
    const dy = yB2 - yA, n = Math.round((sB - sA) / 0.96), t = (sB - sA) / n, r = dy / n;
    for (let j = 0; j < n; j++) {
      const a0 = sA + j * t, y = yA + r * (j + (r > 0 ? 1 : 0)), ar = r > 0 ? a0 : a0 + t, yr = yA + r * j;
      g.quad([-X, y, -a0], [X, y, -a0], [X, y, -a0 - t], [-X, y, -a0 - t], up, MARBLE, 1);
      g.quad([-X, yr, -ar], [X, yr, -ar], [X, yr + r, -ar], [-X, yr + r, -ar], [0, 0, r > 0 ? 1 : -1], MARBLE, 0, [0.62, 0.62, 0.8, 0.8]);
    }
  };
  const flat = (a, b, y, X = W) => { if (b - a < 0.01) return; g.quad([-X, y, -a], [X, y, -a], [X, y, -b], [-X, y, -b], up, MARBLE, 1); };
  if (v.id === 'stair') {
    // the sea's floor across the whole hall; three flights and two landings between the cheeks; the terrace across
    // the far end, and the quay wall under its edge to either hand of the stair
    flat(A0, v.s1, LOW_Y);
    const seg = v.run + v.land, h = -LOW_Y / 3;
    for (let k = 0; k < 3; k++) { const sA = v.s0 + k * seg; steps(sA, sA + v.run, LOW_Y + h * k, LOW_Y + h * (k + 1), v.SW); if (k < 2) flat(sA + v.run, sA + seg, LOW_Y + h * (k + 1), v.SW); }
    // (the terrace is three pieces that share the stair's two upper corners with the last riser and the quay walls:
    // one piece from wall to wall left a seam along the terrace's edge)
    for (const [x0, x1] of [[-W, -v.SW], [-v.SW, v.SW], [v.SW, W]]) g.quad([x0, 0, -v.s1], [x1, 0, -v.s1], [x1, 0, -A1], [x0, 0, -A1], up, MARBLE, 1);
    for (const s of [-1, 1]) g.quad([s * v.SW, LOW_Y, -v.s1], [s * W, LOW_Y, -v.s1], [s * W, 0, -v.s1], [s * v.SW, 0, -v.s1], [0, 0, 1], MARBLE, 0, [0.7, 0.7, 0.92, 0.92]);
    return;
  }
  if (v.s0 === undefined) { flat(A0, A1, v.fl((A0 + A1) / 2)); return; }
  flat(A0, v.s0, v.fl(A0)); steps(v.s0, v.s1, v.fl(v.s0), v.fl(v.s1), W); flat(v.s1, A1, v.fl(v.s1 + 0.01));
}
// the cross wall after vessel v, with its great door; niches to either hand of the door on the face we come to (a
// column of them to every 9 m or so of wall, in the three lowest tiers that stand clear of the pavement there); none
// behind a colossus that stands against the wall (v.endGiant: its hand)
export function crossWallInto(g, v, w, slots) {
  const aw = v.a1, f = v.fl(aw), hw = v.face ? v.face.hw : DOOR_HW, ds = v.face ? v.face.spring : 10.2, X = [1, 0, 0];
  const M1 = (u, y, d) => [u, y, -(aw + d)], M2 = (u, y, d) => [u, y, -(aw + WT - d)];
  if (v.face) faceWallInto(g, v, M1, slots);
  else archInto(g, M1, [0, 0, 1], X, -7.4, 7.4, f, v.top, 0, hw, f, f + 10.2, { depth: WT, noSill: true, K: 8, dark: 0.75, foot: FOOT });
  for (const s of v.face ? [] : [-1, 1]) {
    const nc = Math.max(1, Math.round((v.W - 7.4) / 9.4)), cw = (v.W - 7.4) / nc;
    for (let c = 0; c < nc; c++) {
      const U0 = s < 0 ? -v.W + c * cw : 7.4 + c * cw, U1 = U0 + cw, uc = (U0 + U1) / 2; let y = f, done = 0;
      for (let b = 0; b < v.bands.length && done < 3; b++) {
        const B = v.bands[b]; if (B.y0 < f - 0.05) continue;
        if (v.endGiant === s && B.y0 < f + 17) continue;
        if (B.y0 > y + 0.01) g.quad(M1(U0, y - (y === f ? FOOT : 0), 0), M1(U1, y - (y === f ? FOOT : 0), 0), M1(U1, B.y0, 0), M1(U0, B.y0, 0), [0, 0, 1]);
        const nh = Math.min(B.nh, 7.4), hwn = Math.min(nh * 0.26, (U1 - U0) / 2 - 0.9), v0 = B.y0 + B.sill, dp = Math.min(1.6, hwn * 0.9);
        archInto(g, M1, [0, 0, 1], X, U0, U1, B.y0, B.y0 + B.h, uc, hwn, v0, v0 + nh - hwn, { depth: dp, back: { col: MARBLE, sh: [0.42, 0.27] }, dark: 0.42, foot: Math.abs(B.y0 - f) < 0.06 ? FOOT : 0 });
        slots.push({ x: uc, y: v0, z: -(aw + dp * 0.45), yaw: 0, h: nh - 0.35, w: hwn * 1.8, vi: v.i, bi: 90 + (s > 0 ? 10 : 0) + c, ti: b, sj: 0, side: 0 });
        y = B.y0 + B.h; done++;
      }
      if (y < v.top) g.quad(M1(U0, y - (y === f ? FOOT : 0), 0), M1(U1, y - (y === f ? FOOT : 0), 0), M1(U1, v.top, 0), M1(U0, v.top, 0), [0, 0, 1]);
      // (the backing of this column of the cross wall, behind its niches: as for a side wall's bay)
      { const c0 = U0 - (s < 0 && c === 0 ? BACKING.corner : 0), c1 = U1 + (s > 0 && c === nc - 1 ? BACKING.corner : 0);
        g.quad(M1(c0, f - BACKING.under, BACKING.cross), M1(c1, f - BACKING.under, BACKING.cross), M1(c1, v.top, BACKING.cross), M1(c0, v.top, BACKING.cross), [0, 0, 1], MARBLE, 0, [0.8, 0.8, 0.8, 0.8]); }
    }
  }
  if (w) { const f2 = w.fl(w.a0); archInto(g, M2, [0, 0, -1], X, -w.W, w.W, f2, w.ruin ? w.yB + 30 : w.top, 0, hw, f2, f2 + ds, { K: 8 }); }
  // (in the doorway two halls' pavements meet edge to edge on the wall's face line, and they are not of one breadth:
  // 3 cm under that line lies a strip of pavement, 0.8 m along and the door's breadth and a metre across, so a sight
  // that passes between the two ends on pavement)
  g.quad([-hw - 0.5, f - 0.03, -(aw - 0.4)], [hw + 0.5, f - 0.03, -(aw - 0.4)], [hw + 0.5, f - 0.03, -(aw + 0.4)], [-hw - 0.5, f - 0.03, -(aw + 0.4)], [0, 1, 0], MARBLE, 1);
}
// the wall that faces the great stair, by the plan's own order (v.face): the great door in its panel; to either hand
// six bays in three storeys with a niche in each (its slot kept for a figure), but for the great recess of two bays
// and two storeys where the colossus stands; a flat pilaster at every bay line, a string course at the foot of the
// second and the third storey, a cornice under the cove
function faceWallInto(g, v, M1, slots) {
  const F = v.face, aw = v.a1, f = v.fl(aw), X = [1, 0, 0], N = [0, 0, 1], top = f + 3 * F.th, zf = -aw;
  archInto(g, M1, N, X, -F.xd, F.xd, f, v.top, 0, F.hw, f, f + F.spring, { depth: WT, noSill: true, K: 10, dark: 0.75, foot: FOOT });
  for (const s of [-1, 1]) {
    const edge = (c) => s * (F.xd + c * F.m), span = (c0, c1) => [Math.min(edge(c0), edge(c1)), Math.max(edge(c0), edge(c1))];
    for (let c = 0; c < F.nm; c++) {
      const [U0, U1] = span(c, c + 1), uc = (U0 + U1) / 2, great = c === F.gi - 1 || c === F.gi;
      for (let b = great ? 2 : 0; b < 3; b++) {
        const y0 = f + b * F.th, nh = F.th - 1.9, hwn = Math.min(nh * 0.26, F.m / 2 - 0.9), v0 = y0 + 1.2, dp = Math.min(1.6, hwn * 0.9);
        archInto(g, M1, N, X, U0, U1, y0, y0 + F.th, uc, hwn, v0, v0 + nh - hwn, { depth: dp, back: { col: MARBLE, sh: [0.42, 0.27] }, dark: 0.42, foot: b ? 0 : FOOT });
        slots.push({ x: uc, y: v0, z: -(aw + dp * 0.45), yaw: 0, h: nh - 0.35, w: hwn * 1.8, vi: v.i, bi: 90 + (s > 0 ? 10 : 0) + c, ti: b, sj: 0, side: 0 });
      }
      // (the great recess has a floor of its own, the terrace's level carried into it: the pavements end at the
      // wall's face and none lay in the recess, so the sky's dome under the house showed beside the colossus's block)
      if (c === F.gi - 1) { const [G0, G1] = span(c, c + 2); archInto(g, M1, N, X, G0, G1, f, f + 2 * F.th, s * F.gx, F.ghw, f, f + F.gspring, { depth: 1.9, K: 10, back: { col: MARBLE, sh: [0.6, 0.4] }, dark: 0.5, foot: FOOT }); }
      // (the backing of this bay, behind its niches and the great recess's back: as for a side wall's bay)
      { const c0 = U0 - (s < 0 && c === F.nm - 1 ? BACKING.corner : 0), c1 = U1 + (s > 0 && c === F.nm - 1 ? BACKING.corner : 0);
        g.quad(M1(c0, f - BACKING.under, BACKING.deep), M1(c1, f - BACKING.under, BACKING.deep), M1(c1, v.top, BACKING.deep), M1(c0, v.top, BACKING.deep), N, MARBLE, 0, [0.8, 0.8, 0.8, 0.8]); }
      // the pilaster at this bay's line (none inside the great recess), from the terrace to the cornice
      if (c !== F.gi) { const x = edge(c); g.box(x - 0.45, f, zf, x + 0.45, top - 0.6, zf + 0.34, MARBLE, 'yYz', 1.05); }
    }
    // the string courses (the lower one stops at the great recess to either hand) and the wall above the storeys
    const [R0, R1] = span(F.gi - 1, F.gi + 1), [A0, A1] = span(0, F.nm);
    for (const [c0, c1] of [[A0, R0], [R1, A1]]) g.box(c0, f + F.th - 0.24, zf, c1, f + F.th + 0.2, zf + 0.5, MARBLE, 'z', 1.05);
    g.box(A0, f + 2 * F.th - 0.24, zf, A1, f + 2 * F.th + 0.2, zf + 0.5, MARBLE, 'z', 1.05);
    if (top < v.top) g.quad(M1(A0, top, 0), M1(A1, top, 0), M1(A1, v.top, 0), M1(A0, v.top, 0), N);
  }
  // the cornice under the cove, across the whole wall
  g.box(-v.W, top - 0.6, zf, v.W, top + 0.3, zf + 0.9, MARBLE, 'z', 1.06);
}
// ---------------------------------------------------------------- carving: tubes, balls and lofts cut in flat planes
const add3 = (a, b, s = 1) => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s];
// the stone being carved (a nest of weed and sticks is carved in its own colour)
let CUR = MARBLE, OWN = 0;
// own (aux.y of a carved piece): 0 a figure (white marble; bronze or black stone by its instance's tint), 2 a fallen
// piece of the hall's own stone, 3 a thing in the colour given here
export const setStone = (c, own = c ? 3 : 0) => { CUR = c || MARBLE; OWN = own; };
// EVERY CARVED FACE IS A PLANE: a triangle of a figure takes the normal of its own face (the chisel's flat), so a
// limb is a prism, a head a cut stone and a fold a ridge with an edge; a face of no size is not made
// THE GRADE THAT IS SEEN CLOSE (the fine make of the lowest tier, which the eye passes at 2 to 4 m, and the giants)
// IS SHADED SOFTLY BY THE FORM: its faces are the same planes, but the light on a face is read from a normal that
// leans SOFT of the way from the plane's own toward the rounded form's at each corner (the limb's, the ball's, the
// robe's), so the light turns a little across a face as it does on a worked surface and a facet does not read as a
// flat card; where the form's normal looks away from the plane (an end, a cut) the plane keeps its own. By the
// grade a figure is carved in (SOFT is set while such a make is carved and 0 otherwise): never by the eye
let SOFT = 0;
const SOFT_FINE = 0.55;
function smoothTri(g, a, b, c, na, nb, nc, col, sa, sb, sc) {
  col = CUR;
  const fn = cross3(sub3(b, a), sub3(c, a)), l = Math.hypot(fn[0], fn[1], fn[2]); if (l < 1e-10) return;
  const f = dot3(fn, [na[0] + nb[0] + nc[0], na[1] + nb[1] + nc[1], na[2] + nb[2] + nc[2]]) < 0, k = (f ? -1 : 1) / l, n = [fn[0] * k, fn[1] * k, fn[2] * k];
  const sn = (q) => { if (!SOFT) return n; const u = norm3(q); return dot3(u, n) < 0.3 ? n : norm3([n[0] + (u[0] - n[0]) * SOFT, n[1] + (u[1] - n[1]) * SOFT, n[2] + (u[2] - n[2]) * SOFT]); };
  if (f) { g.v(a, sn(na), col, sa, 5, OWN, 0); g.v(c, sn(nc), col, sc, 5, OWN, 0); g.v(b, sn(nb), col, sb, 5, OWN, 0); }
  else { g.v(a, sn(na), col, sa, 5, OWN, 0); g.v(b, sn(nb), col, sb, 5, OWN, 0); g.v(c, sn(nc), col, sc, 5, OWN, 0); }
}
// what is never seen is not carved: the faces of a figure that look back into its niche (their normal's z under nz)
// and lie behind the plane z = zc of the figure's own frame
export function cullBack(g, nz, zc = 9, plane = false) {
  const o = new Geo();
  for (let i = 0; i < g.p.length; i += 9) {
    // (plane: the face's own plane is read from its corners, for a grade whose corners carry a softened normal)
    let fz = g.n[i + 2]; if (plane) { const q = cross3([g.p[i + 3] - g.p[i], g.p[i + 4] - g.p[i + 1], g.p[i + 5] - g.p[i + 2]], [g.p[i + 6] - g.p[i], g.p[i + 7] - g.p[i + 1], g.p[i + 8] - g.p[i + 2]]); fz = q[2] / (Math.hypot(q[0], q[1], q[2]) || 1); }
    if (fz < nz && (g.p[i + 2] + g.p[i + 5] + g.p[i + 8]) / 3 < zc) continue;
    for (let k = i; k < i + 9; k++) { o.p.push(g.p[k]); o.n.push(g.n[k]); o.c.push(g.c[k]); o.x.push(g.x[k]); }
  }
  return o;
}
function basis(d) { const u = Math.abs(d[1]) < 0.95 ? norm3(cross3([0, 1, 0], d)) : [1, 0, 0]; return [u, cross3(d, u)]; }
// a limb: a tapered tube from p0 to p1
export function tube(g, p0, p1, r0, r1, n = 6, sh = 1, sh1 = sh) {
  const d = norm3(sub3(p1, p0)), [u, w] = basis(d), A = [], B = [], D = [];
  for (let k = 0; k <= n; k++) { const t = TAU * k / n, dir = [u[0] * Math.cos(t) + w[0] * Math.sin(t), u[1] * Math.cos(t) + w[1] * Math.sin(t), u[2] * Math.cos(t) + w[2] * Math.sin(t)]; D.push(dir); A.push(add3(p0, dir, r0)); B.push(add3(p1, dir, r1)); }
  for (let k = 0; k < n; k++) { smoothTri(g, A[k], A[k + 1], B[k + 1], D[k], D[k + 1], D[k + 1], MARBLE, sh, sh, sh1); smoothTri(g, A[k], B[k + 1], B[k], D[k], D[k + 1], D[k], MARBLE, sh, sh1, sh1); }
}
// a rounded mass: an ellipsoid (n round, m stacks); tilt: lean of its long axis about z (radians)
export function ball(g, c, rx, ry, rz, n = 6, m = 4, sh = 1, tilt = 0) {
  const ct = Math.cos(tilt), st = Math.sin(tilt), P = [], N = [];
  for (let j = 0; j <= m; j++) { const ph = Math.PI * j / m, sy = Math.cos(ph), sr = Math.sin(ph); const row = [], nrow = [];
    for (let k = 0; k <= n; k++) { const t = TAU * k / n, lx = sr * Math.cos(t), lz = sr * Math.sin(t); let px = lx * rx, py = sy * ry, nx = lx / rx, ny = sy / ry; const nz = lz / rz;
      const qx = px * ct - py * st, qy = px * st + py * ct, mx = nx * ct - ny * st, my = nx * st + ny * ct; row.push([c[0] + qx, c[1] + qy, c[2] + lz * rz]); nrow.push(norm3([mx, my, nz])); }
    P.push(row); N.push(nrow); }
  for (let j = 0; j < m; j++) for (let k = 0; k < n; k++) {
    const s0 = sh * (0.84 + 0.16 * (1 - j / m)), s1 = sh * (0.84 + 0.16 * (1 - (j + 1) / m));
    if (j > 0) smoothTri(g, P[j][k], P[j][k + 1], P[j + 1][k + 1], N[j][k], N[j][k + 1], N[j + 1][k + 1], MARBLE, s0, s0, s1);
    if (j < m - 1) smoothTri(g, P[j][k], P[j + 1][k + 1], P[j + 1][k], N[j][k], N[j + 1][k + 1], N[j + 1][k], MARBLE, s0, s1, s1);
  }
}
// a body or a robe: rings of ellipses, each { c, rx, rz, sh, fold } (fold: how deep its pleats are cut), n points round
export function loft(g, rings, n = 10, folds = 5) {
  const P = [], N = [], S = [];
  for (const r of rings) { const row = [], nrow = [], srow = [];
    for (let k = 0; k <= n; k++) { const t = TAU * k / n, f = r.fold ? 1 + r.fold * Math.sin(t * folds + (r.ph || 0)) : 1, cx = Math.cos(t), sz = Math.sin(t);
      row.push([r.c[0] + cx * r.rx * f, r.c[1], r.c[2] + sz * r.rz * f]); nrow.push(norm3([cx / r.rx, r.ny || 0, sz / r.rz])); srow.push((r.sh || 1) * (r.fold ? 1 - (r.fs || 0.14) + (r.fs || 0.14) * Math.sin(t * folds + (r.ph || 0)) : 1)); }
    P.push(row); N.push(nrow); S.push(srow); }
  for (let j = 0; j + 1 < rings.length; j++) for (let k = 0; k < n; k++) {
    smoothTri(g, P[j][k], P[j][k + 1], P[j + 1][k + 1], N[j][k], N[j][k + 1], N[j + 1][k + 1], MARBLE, S[j][k], S[j][k + 1], S[j + 1][k + 1]);
    smoothTri(g, P[j][k], P[j + 1][k + 1], P[j + 1][k], N[j][k], N[j + 1][k + 1], N[j + 1][k], MARBLE, S[j][k], S[j + 1][k + 1], S[j + 1][k]);
  }
}
// two bones from a to the hand's place h (lengths l1, l2), the elbow or knee pushed the way of bend
function twoBone(a, h, l1, l2, bend) {
  let d = sub3(h, a), L = Math.hypot(d[0], d[1], d[2]); const mx = (l1 + l2) * 0.995;
  if (L > mx) { h = add3(a, d, mx / L); d = sub3(h, a); L = mx; }
  const dn = norm3(d), x = (l1 * l1 - l2 * l2 + L * L) / (2 * L), hh = Math.sqrt(Math.max(0, l1 * l1 - x * x));
  const bp = norm3(add3(bend, dn, -dot3(bend, dn)));
  return [add3(add3(a, dn, x), bp, hh), h];
}

// ---------------------------------------------------------------- the statues: this world's own carving
// drapery in pleats: rings { c, rx, rz, d, sh } of 2 * folds points, ridge and valley by turns (d: how deep the
// valleys are cut; a ring with d 0 is smooth: a girdle, a waist), so every fold is two planes that meet in an edge;
// tw: where round the figure the first ridge stands (a part of a pleat)
// THE GRADE SEEN CLOSE HAS ITS FOLDS BEVELLED: the ridge of each pleat is not an edge but a narrow plane (PLEAT_BEVEL
// of the way to the valley on either side of the ridge's line), so a fold is three planes, flank, ridge and flank
export const PLEAT_BEVEL = 0.27;
export function pleat(g, rings, folds, tw = 0) {
  const n = 2 * folds, P = [], S = [], A = [], bev = SOFT ? PLEAT_BEVEL : 0;
  // (A: each point of a ring: where it stands, in halves of a pleat from the first ridge, and ridge 1 or valley -1)
  for (let k = 0; k < n; k++) { if (k % 2) A.push([k, -1]); else if (bev) A.push([k - bev, 1], [k + bev, 1]); else A.push([k, 1]); }
  A.push([n - bev, 1]); const m2 = A.length - 1;
  for (const r of rings) { const row = [], srow = [];
    for (const [k, e] of A) { const t = TAU * (k + tw) / n, f = 1 + (r.d || 0) * e; row.push([r.c[0] + Math.cos(t) * r.rx * f, r.c[1], r.c[2] + Math.sin(t) * r.rz * f]); srow.push((r.sh || 1) * (r.d && e < 0 ? 0.74 : 1)); }
    P.push(row); S.push(srow); }
  for (let j = 0; j + 1 < rings.length; j++) for (let k = 0; k < m2; k++) {
    const m = [(P[j][k][0] + P[j][k + 1][0]) / 2 - rings[j].c[0], 0.2, (P[j][k][2] + P[j][k + 1][2]) / 2 - rings[j].c[2]];
    smoothTri(g, P[j][k], P[j][k + 1], P[j + 1][k + 1], m, m, m, MARBLE, S[j][k], S[j][k + 1], S[j + 1][k + 1]);
    smoothTri(g, P[j][k], P[j + 1][k + 1], P[j + 1][k], m, m, m, MARBLE, S[j][k], S[j + 1][k + 1], S[j + 1][k]);
  }
}
// a person, 1.75 m at scale 1, feet on y = 0, facing +Z; o is the pose (hands and feet by their places, lean, nod, a
// robe or a kilt, bulk); q: 1 plain (every tier above the lowest: the body's great planes, a head with its nose and
// jaw, hands as blocks, drapery in five pleats), 3 fine (the lowest tier: a second scale of form: brow, eyes, lips,
// ears and hair; shoulders, elbows, knees; hands with fingers and thumb; eight pleats, an overfold, a girdle, a
// sash), 2 colossal (as fine). Returns the joints for what the figure holds.
export function person(g, o = {}, q = 0) {
  const fine = q === 3, big = q === 2, rich = fine || big;
  const ns = rich ? 6 : 5, nb = rich ? 8 : 6, mb = rich ? 5 : 4, nf = big ? 9 : fine ? 8 : 5, nt = rich ? 8 : 6;
  const bk = (o.bulk || 1) * 1.17, py = o.py ?? 0.93, T = norm3([o.side || 0, 1, o.lean || 0]), P0 = [o.px || 0, py, o.pz || 0], at = (t) => add3(P0, T, t), tw = ((o.ph || 0) * 0.37) % 1;
  if (o.robe) {
    const R = [{ c: [P0[0], o.hem ?? 0.03, P0[2] + 0.03], rx: 0.285 * bk, rz: 0.245 * bk, d: 0.14, sh: 0.8 }, { c: [P0[0], py * 0.5, P0[2] + 0.015], rx: 0.23 * bk, rz: 0.19 * bk, d: 0.12, sh: 0.92 }, { c: add3(P0, [0, -0.1, 0]), rx: 0.2 * bk, rz: 0.15 * bk, d: 0.05 }];
    // the fine make's robe falls in an overfold at the hip (its lower edge stands out over the skirt) and is tied
    if (rich) R.push({ c: add3(P0, [0, -0.085, 0]), rx: 0.238 * bk, rz: 0.18 * bk, d: 0.08, sh: 0.7 }, { c: add3(P0, [0, 0.075, 0]), rx: 0.16 * bk, rz: 0.115 * bk, d: 0.02 });
    R.push({ c: at(0.14), rx: 0.14 * bk, rz: 0.102 * bk });
    pleat(g, R, nf, tw);
    for (const s of [-1, 1]) ball(g, [P0[0] + s * 0.1, 0.05, P0[2] + 0.23], 0.065, 0.05, 0.11, rich ? 5 : 4, rich ? 3 : 2, 0.8);
  } else {
    for (const s of [-1, 1]) {
      const hip = add3(P0, [s * 0.09, -0.03, 0]), ft = (s < 0 ? o.footL : o.footR) || [P0[0] + s * 0.11, 0.07, P0[2] + (s < 0 ? -0.03 : 0.05)];
      const [kn, an] = twoBone(hip, ft, 0.45, 0.44, o.kneeBend || [0, 0, 1]);
      tube(g, hip, kn, 0.1 * bk, 0.076 * bk, ns, 0.86, 0.9);
      if (rich) { const cm = add3(kn, sub3(an, kn), 0.36); ball(g, kn, 0.076 * bk, 0.08 * bk, 0.08 * bk, 5, 3, 0.92); tube(g, kn, cm, 0.07 * bk, 0.085 * bk, ns, 0.9, 0.9); tube(g, cm, an, 0.085 * bk, 0.048 * bk, ns, 0.9, 0.84); ball(g, add3(an, [0, -0.036, 0.175]), 0.056 * bk, 0.03, 0.065 * bk, 5, 3, 0.8); }
      else tube(g, kn, an, 0.076 * bk, 0.054 * bk, ns, 0.9, 0.84);
      ball(g, add3(an, [0, -0.02, 0.075]), 0.06 * bk, 0.052, 0.13 * bk, rich ? 5 : 4, rich ? 3 : 2, 0.82);
    }
    if (o.kilt !== 0) pleat(g, [{ c: add3(P0, [0, -0.41, 0.015]), rx: 0.22 * bk, rz: 0.18 * bk, d: 0.13, sh: 0.8 }, ...(rich ? [{ c: add3(P0, [0, -0.2, 0.01]), rx: 0.195 * bk, rz: 0.155 * bk, d: 0.09, sh: 0.9 }] : []), { c: at(0.12), rx: 0.145 * bk, rz: 0.105 * bk }], nf, tw);
  }
  loft(g, [{ c: at(-0.04), rx: 0.165 * bk, rz: 0.11 * bk, sh: 0.9 }, { c: at(0.15), rx: 0.132 * bk, rz: 0.092 * bk, sh: 0.95 }, { c: at(0.33), rx: 0.18 * bk, rz: 0.118 * bk }, { c: at(0.46), rx: 0.2 * bk, rz: 0.102 * bk }, { c: at(0.53), rx: 0.07 * bk, rz: 0.065 * bk, ny: 1.5 }], nt);
  if (rich) {
    // the chest's plane, a girdle (a band standing out round the waist), a sash from the shoulder to the far hip
    ball(g, add3(at(0.36), [0, 0, 0.066 * bk]), 0.155 * bk, 0.09 * bk, 0.06 * bk, 6, 3, 0.98);
    loft(g, [{ c: at(0.105), rx: 0.165 * bk, rz: 0.122 * bk, sh: 0.8 }, { c: at(0.115), rx: 0.172 * bk, rz: 0.128 * bk }, { c: at(0.17), rx: 0.17 * bk, rz: 0.126 * bk }, { c: at(0.18), rx: 0.15 * bk, rz: 0.11 * bk, sh: 0.8 }], 8);
    if (o.robe) tube(g, add3(at(0.47), [0.17 * bk, 0, 0.03]), add3(at(0.13), [-0.15 * bk, 0, 0.1 * bk]), 0.05, 0.06, 4, 0.9, 0.82);
  }
  const Hd = norm3([T[0] + (o.turn || 0) * 0.5, T[1], T[2] + (o.nod || 0)]), nk = at(0.5), hc = add3(nk, Hd, 0.21);
  tube(g, nk, hc, 0.052 * bk, 0.047 * bk, ns, 0.8);
  ball(g, hc, 0.09, 0.12, 0.102, nb, mb, 1);
  const F = (dx, dy, dz) => add3(hc, [dx, dy, dz]);
  // every head has its jaw and its nose (the profile reads on the upper tiers too)
  ball(g, F(0, -0.073, 0.024), 0.066, 0.058, 0.08, 5, 3, 0.96); tube(g, F(0, 0.024, 0.09), F(0, -0.036, 0.132), 0.012, 0.024, 4, 0.95);
  if (rich) {
    // the fine make's head: a brow, two hollows for the eyes, a chin, lips, ears, hair in a roll over the brow and
    // a mass at the nape (a hood or a cloth has its own)
    ball(g, F(0, 0.032, 0.082), 0.078, 0.02, 0.03, 4, 3, 0.9);
    for (const sd of [-1, 1]) { ball(g, F(sd * 0.037, 0.003, 0.088), 0.022, 0.013, 0.014, 4, 2, 0.5); ball(g, F(sd * 0.092, -0.005, 0), 0.013, 0.032, 0.021, 4, 2, 0.85); }
    ball(g, F(0, -0.105, 0.07), 0.034, 0.027, 0.032, 4, 3, 0.95); ball(g, F(0, -0.06, 0.094), 0.031, 0.011, 0.014, 4, 2, 0.72);
    if (o.cap !== 1) { ball(g, F(0, 0.086, 0.047), 0.092, 0.032, 0.058, 6, 3, 0.74); ball(g, F(0, -0.045, -0.074), 0.078, 0.078, 0.052, 5, 3, 0.74); }
    if (o.cap === 1) ball(g, add3(at(0.4), [0, 0, -0.1 * bk]), 0.2 * bk, 0.26, 0.07, 6, 3, 0.8);
  }
  // what is on the head: 0 hair, 1 a hood that falls to the shoulders, 3 hair knotted at the nape, 4 a cloth cap
  if (!o.cap) ball(g, add3(hc, [0, 0.03, -0.03]), 0.098, 0.104, 0.104, rich ? nb : 5, rich ? mb : 3, 0.82);
  if (o.cap === 1) { ball(g, add3(hc, [0, 0.02, -0.035]), 0.12, 0.14, 0.12, rich ? nb : 6, rich ? mb : 4, 0.92); if (!rich) tube(g, add3(hc, [0, -0.02, -0.06]), add3(at(0.36), [0, 0, -0.09 * bk]), 0.11, 0.17 * bk, 4, 0.84, 0.78); }
  if (o.cap === 3) ball(g, add3(hc, [0, 0.06, -0.11]), 0.075, 0.075, 0.075, 5, 3, 0.95);
  if (o.cap === 4) ball(g, add3(hc, [0, 0.085, -0.005]), 0.108, 0.06, 0.118, 6, 3, 0.9);
  const J = { hc, nk, P0, T, at };
  for (const s of [-1, 1]) {
    const sh = add3(at(0.455), [s * 0.215 * bk, 0, 0]), h = (s < 0 ? o.handL : o.handR) || [sh[0] + s * 0.07, sh[1] - 0.54, sh[2] + 0.05];
    const [el, hd] = twoBone(sh, h, 0.29, 0.27, (s < 0 ? o.bendL : o.bendR) || [s * 0.6, -0.5, -0.6]);
    tube(g, sh, el, 0.064 * bk, 0.053 * bk, ns, 0.95, 0.9); tube(g, el, hd, 0.052 * bk, 0.041 * bk, ns, 0.92);
    const d = norm3(sub3(hd, el)), sw = basis(d)[0];
    if (rich) {
      // the ball and slope of the shoulder, the elbow, a cuff, a hand with its fingers and thumb
      ball(g, sh, 0.072 * bk, 0.066 * bk, 0.07 * bk, 5, 3, 1); tube(g, add3(nk, [0, 0.035, -0.01]), sh, 0.05 * bk, 0.06 * bk, 5, 0.95); ball(g, el, 0.053 * bk, 0.053 * bk, 0.053 * bk, 5, 3, 0.9);
      tube(g, add3(hd, d, -0.07), add3(hd, d, -0.03), 0.055 * bk, 0.057 * bk, 6, 0.86);
      ball(g, hd, 0.048, 0.054, 0.042, 5, 3, 1); tube(g, hd, add3(hd, d, 0.125), 0.042, 0.02, 5, 0.96); tube(g, add3(hd, d, 0.01), add3(add3(hd, d, 0.07), sw, 0.055), 0.019, 0.012, 4, 0.9);
    } else tube(g, add3(hd, d, -0.03), add3(hd, d, 0.11), 0.05, 0.034, 4, 1, 0.92);
    J[s < 0 ? 'hl' : 'hr'] = hd; J[s < 0 ? 'sl' : 'sr'] = sh;
  }
  return J;
}
// the makes of people: each a pose and what the figure holds. r: the make's own draws; q as in person. What a figure
// holds is carved large and in few planes (a rod is never thinner than 4.5 cm at the make's own scale), so that each
// make has an outline of its own against its niche. RULES FOR EVERY MAKE: none holds a thing that gives light; none
// holds a tool of a garden (no spade, fork, hoe, rake, nothing to water with); none carries a large rounded or domed
// load under an arm, on a shoulder or on the head; none plays a wind instrument or has a hand at its lips; NOTHING LONG
// AND LEVEL IS HELD WITHIN A HEAD'S HEIGHT OF A FIGURE'S FACE, before it or to either hand of it (a head is 0.3 m at
// the make's own measure and a standing figure's face lies between 1.5 and 1.76 m: so no rod, bar, blade, string or
// small creature is held level there between 1.2 and 2.06 m); a hand that is raised holds a thing that stands upright
// at arm's length to the side (the ladder, the staff) or clear over the head (the mallet, the hammer); the one thing
// borne at the height of a head lies BEHIND the neck, across the shoulders (the shepherd's lamb). Seen from either
// hand or from before, no figure can be taken for one who pipes, blows a horn or drinks
const rod =(g, a, b, r0 = 0.024, r1 = r0, n = 4, sh = 1) => tube(g, a, b, Math.max(r0, 0.0225), Math.max(r1, 0.0225), n, sh);
const MAKES = [
  // a woman pouring from a jar
  (g, r, q) => { person(g, { robe: 1, cap: 3, side: 0.05, nod: 0.2, handR: [0.15, 1.3, 0.33], handL: [-0.12, 1.08, 0.3], ph: r() * 6 }, q); ball(g, [0.02, 1.2, 0.42], 0.14, 0.19, 0.14, 6, 4, 1, 0.7); tube(g, [-0.02, 1.12, 0.48], [-0.1, 0.98, 0.64], 0.06, 0.085, 5, 0.9); rod(g, [-0.12, 0.96, 0.66], [-0.14, 0.52, 0.7], 0.03, 0.024, 4, 0.9); },
  // a mason with a mallet and a chisel
  (g, r, q) => { const J = person(g, { lean: 0.12, cap: 4, handR: [0.5, 1.84 + r() * 0.08, -0.04], handL: [-0.14, 1.06, 0.36], footR: [0.12, 0.07, 0.16], footL: [-0.13, 0.07, -0.1] }, q); rod(g, J.hr, add3(J.hr, [0.03, 0.3, 0]), 0.026); tube(g, add3(J.hr, [-0.13, 0.36, 0]), add3(J.hr, [0.19, 0.36, 0]), 0.09, 0.09, 6); rod(g, J.hl, add3(J.hl, [0.02, -0.2, 0.16]), 0.026, 0.024); g.box(-0.34, 0, 0.3, 0.02, 0.62, 0.6, MARBLE, 'y', 0.88); },
  // a shepherd with a lamb on the shoulders
  (g, r, q) => { person(g, { nod: 0.25, handR: [0.23, 1.3, 0.15], handL: [-0.23, 1.3, 0.15], footR: [0.11, 0.07, 0.12], footL: [-0.12, 0.07, -0.06] }, q); ball(g, [0, 1.58, -0.07], 0.3, 0.12, 0.13, 6, 4, 1); ball(g, [0.34, 1.63, 0.03], 0.09, 0.08, 0.1, 5, 3, 1); for (const s of [-1, 1]) { rod(g, [s * 0.22, 1.56, 0.0], [s * 0.23, 1.3, 0.15], 0.034, 0.024); rod(g, [s * 0.13, 1.56, 0.0], [s * 0.2, 1.3, 0.13], 0.034, 0.024); } },
  // one who carries a ladder
  (g, r, q) => { person(g, { side: -0.05, handR: [0.31, 1.5, 0.26], footR: [0.1, 0.07, 0.14], footL: [-0.12, 0.07, -0.08] }, q); for (const x of [0.24, 0.5]) rod(g, [x, 0.3, -0.42], [x, 2.36, 0.5], 0.034); for (let i = 0; i < 6; i++) { const t = 0.08 + i * 0.16; rod(g, [0.24, 0.3 + 2.06 * t, -0.42 + 0.92 * t], [0.5, 0.3 + 2.06 * t, -0.42 + 0.92 * t], 0.026); } },
  // a weaver: the shuttle (a spindle pointed at both ends) carried LOW, in the right hand that hangs at the side, its
  // point forward and down; a hank of yarn over the left forearm at the waist's height, hanging in two long open
  // loops to the knee
  (g, r, q) => { const J = person(g, { robe: 1, cap: 4, nod: 0.1, side: -0.04, handR: [0.36, 0.86, 0.12], handL: [-0.3, 1.04, 0.3], bendL: [-0.5, -0.6, -0.6], ph: r() * 6 }, q);
    { const c = add3(J.hr, [0.05, -0.04, 0.02]); tube(g, add3(c, [0, 0.11, -0.235]), c, 0.02, 0.062, 5); tube(g, c, add3(c, [0, -0.11, 0.235]), 0.062, 0.02, 5); }
    for (const [x, y0, z] of [[-0.34, 0.5, 0.3], [-0.2, 0.62, 0.34]]) { rod(g, [x - 0.06, 1.06, z], [x - 0.07, y0, z], 0.04, 0.04, 5, 0.95); rod(g, [x + 0.06, 1.06, z], [x + 0.07, y0, z], 0.04, 0.04, 5, 0.9); rod(g, [x - 0.09, y0, z], [x + 0.09, y0, z], 0.045, 0.045, 5, 0.85); rod(g, [x - 0.08, 1.07, z], [x + 0.08, 1.07, z], 0.045, 0.045, 5, 1); } },
  // a walker with a staff, the other hand gathering the robe at the waist (the elbow out), the head turned to look far off
  (g, r, q) => { person(g, { robe: 1, cap: 1, turn: -0.3, handR: [0.33, 1.26, 0.2], handL: [-0.17, 1.03, 0.2], bendL: [-0.9, -0.2, -0.3], ph: r() * 6 }, q); rod(g, [0.37, 0, 0.25], [0.3, 2.12, 0.17], 0.034, 0.03, 5); ball(g, [0.3, 2.14, 0.17], 0.06, 0.06, 0.06, 4, 2, 1); },
  // a mother holding a child before her
  // (the child is held out before her breast in both hands, its head under her chin, her head bent to it: nothing is
  // held up to a face and nothing is borne over a head)
  (g, r, q) => { person(g, { robe: 1, cap: 3, nod: 0.18, handR: [0.13, 1.0, 0.34], handL: [-0.13, 1.0, 0.34], bendR: [0.9, -0.4, 0], bendL: [-0.9, -0.4, 0], ph: r() * 6 }, q); ball(g, [0, 1.07, 0.4], 0.1, 0.15, 0.09, 6, 4, 1); ball(g, [0, 1.285, 0.4], 0.078, 0.088, 0.082, 6, 4, 1); for (const s of [-1, 1]) { rod(g, [s * 0.08, 1.17, 0.4], [s * 0.24, 1.27, 0.36], 0.03, 0.024); rod(g, [s * 0.05, 0.97, 0.4], [s * 0.09, 0.77, 0.45], 0.036, 0.026); } },
  // a sower in mid cast, a flat seed satchel at the hip on its strap (flat: no make carries a rounded bundle)
  (g, r, q) => { person(g, { cap: 1, lean: 0.08, turn: 0.3, handR: [0.6, 1.2, 0.22], handL: [-0.2, 1.02, 0.17], bendR: [0, -1, 0], footR: [0.1, 0.07, 0.24], footL: [-0.11, 0.07, -0.17] }, q); loft(g, [{ c: [-0.22, 0.74, 0.15], rx: 0.16, rz: 0.05, sh: 0.9 }, { c: [-0.22, 1.08, 0.15], rx: 0.16, rz: 0.05 }], 4); ball(g, [-0.22, 1.08, 0.15], 0.16, 0.012, 0.05, 4, 2, 1); rod(g, [-0.17, 1.1, 0.08], [0.17, 1.44, 0.02], 0.026); },
  // one who stoops to bind a sandal, a foot set up on a block: both hands at the ankle, the head bent to them. The
  // figure carries nothing
  (g, r, q) => { g.box(-0.02, 0, 0.14, 0.32, 0.45, 0.5, MARBLE, 'y', 0.9); person(g, { py: 0.82, lean: 0.9, nod: 0.5, footR: [0.15, 0.52, 0.3], footL: [-0.13, 0.07, -0.14], kneeBend: [0.15, 0.4, 1], handR: [0.25, 0.64, 0.46], handL: [0.07, 0.66, 0.5], bendR: [0.9, 0.2, -0.3], bendL: [-0.9, 0.2, -0.3] }, q); },
  // one who holds a kite before the body: a flat diamond, a hand on either corner, its tail with two bows hanging to
  // the feet. Nothing is held to the face (no make plays a wind instrument and none has a hand at its lips)
  (g, r, q) => { person(g, { nod: 0.1, handR: [0.3, 1.05, 0.3], handL: [-0.3, 1.0, 0.3], footR: [0.11, 0.07, 0.1], footL: [-0.11, 0.07, -0.04] }, q); ball(g, [0, 1.02, 0.33], 0.31, 0.44, 0.03, 4, 2, 1, 0.14); rod(g, [0.05, 0.62, 0.33], [0.13, 0.36, 0.35], 0.024); rod(g, [0.13, 0.36, 0.35], [0.03, 0.08, 0.37], 0.024); ball(g, [0.11, 0.48, 0.34], 0.085, 0.04, 0.03, 4, 2, 1); ball(g, [0.08, 0.22, 0.36], 0.085, 0.04, 0.03, 4, 2, 1); },
  // a lyre player: the lyre carried LOW, its sound box against the hip, the left hand on its near arm, the right hand
  // across the body on the strings; its crossbar lies under the breast (1.15 m)
  (g, r, q) => { person(g, { robe: 1, cap: 1, turn: -0.2, nod: 0.12, handL: [-0.335, 0.95, 0.25], handR: [-0.02, 1.02, 0.29], ph: r() * 6 }, q); ball(g, [-0.2, 0.7, 0.27], 0.13, 0.1, 0.06, 5, 3, 1); rod(g, [-0.29, 0.75, 0.27], [-0.39, 1.19, 0.27], 0.032, 0.026); rod(g, [-0.11, 0.75, 0.27], [-0.01, 1.19, 0.27], 0.032, 0.026); rod(g, [-0.42, 1.15, 0.27], [0.02, 1.15, 0.27], 0.026); },
  // a watcher with folded wings
  (g, r, q) => { person(g, { robe: 1, nod: 0.15, handR: [-0.06, 1.24, 0.17], handL: [0.06, 1.18, 0.18], bendR: [1, -0.6, 0], bendL: [-1, -0.6, 0], ph: r() * 6 }, q); for (const s of [-1, 1]) { ball(g, [s * 0.27, 1.12, -0.1], 0.17, 0.7, 0.08, 6, 4, 0.9, s * 0.16); ball(g, [s * 0.36, 0.86, -0.06], 0.09, 0.42, 0.05, 4, 3, 0.8, s * 0.1); } },
  // a sleeper seated on a block
  (g, r, q) => { g.box(-0.3, 0, -0.3, 0.3, 0.5, 0.12, MARBLE, 'y', 0.9); person(g, { py: 0.58, pz: -0.05, kilt: 0, lean: 0.5, nod: 0.9, footR: [0.13, 0.07, 0.42], footL: [-0.13, 0.07, 0.42], kneeBend: [0, 1, 0.3], handR: [0.1, 0.66, 0.38], handL: [-0.1, 0.66, 0.38] }, q); },
  // a water carrier: a pail in either hand, the arms down and a little out from the body (the pails as they were; no
  // yoke: a bar across the shoulders lay level at the chin)
  (g, r, q) => { const J = person(g, { lean: 0.1, nod: 0.2, handR: [0.44, 0.88, 0.06], handL: [-0.44, 0.88, 0.06], footR: [0.11, 0.07, 0.15], footL: [-0.11, 0.07, -0.1] }, q); for (const h of [J.hr, J.hl]) { rod(g, h, add3(h, [0, -0.16, 0]), 0.0225); tube(g, add3(h, [0, -0.5, 0]), add3(h, [0, -0.16, 0]), 0.12, 0.15, 6, 0.9); } },
  // a drummer, the drum slung before the thighs, a stick in either hand
  (g, r, q) => { person(g, { lean: -0.06, turn: (r() - 0.5) * 0.4, handR: [0.21, 1.2, 0.36], handL: [-0.2, 1.1, 0.4], bendR: [0.8, -0.3, -0.3], bendL: [-0.8, -0.3, -0.3] }, q);
    tube(g, [0, 0.74, 0.27], [0, 1.0, 0.34], 0.21, 0.21, 8, 0.86, 0.95); ball(g, [0, 1.005, 0.342], 0.205, 0.02, 0.205, 8, 2, 1);
    rod(g, [0.21, 1.2, 0.36], [0.07, 1.04, 0.35], 0.024); rod(g, [-0.2, 1.1, 0.4], [-0.06, 1.03, 0.36], 0.024); rod(g, [0.2, 1.4, 0.04], [-0.17, 0.96, 0.3], 0.024, 0.024, 4, 0.85); },
  // a smith at the anvil
  (g, r, q) => { const J = person(g, { lean: 0.22, nod: 0.3, cap: 4, handR: [0.3, 1.72, 0.2], handL: [-0.15, 0.78, 0.36], footR: [0.13, 0.07, 0.1], footL: [-0.13, 0.07, -0.12] }, q); rod(g, J.hr, add3(J.hr, [0, 0.28, 0.04]), 0.028); tube(g, add3(J.hr, [-0.11, 0.32, 0.04]), add3(J.hr, [0.13, 0.32, 0.04]), 0.075, 0.075, 4); g.box(-0.3, 0, 0.3, 0.0, 0.5, 0.52, MARBLE, 'y', 0.9); g.box(-0.42, 0.5, 0.26, 0.12, 0.66, 0.56, MARBLE, '', 0.95); },
  // one with a small bird on the hand: the hand held out LOW, at the waist's height, the head bent and turned to it
  (g, r, q) => { const J = person(g, { robe: 1, hem: 0.3, cap: 1, turn: 0.4, nod: 0.25, handR: [0.4, 1.02, 0.32], bendR: [0.3, -1, -0.2], ph: r() * 6 }, q); ball(g, add3(J.hr, [0, 0.12, 0]), 0.07, 0.07, 0.11, 5, 3, 1); tube(g, add3(J.hr, [0, 0.13, -0.08]), add3(J.hr, [0, 0.09, -0.26]), 0.042, 0.02, 4); ball(g, add3(J.hr, [0, 0.18, 0.1]), 0.04, 0.04, 0.045, 4, 2, 1); },
  // two wrestlers
  (g, r, q) => { for (const s of [-1, 1]) { const h = new Geo(); person(h, { lean: 0.42, nod: 0.1, kilt: 1, handR: [0.12, 1.34, 0.46], handL: [-0.12, 1.2, 0.46], footR: [0.14, 0.07, 0.12], footL: [-0.14, 0.07, -0.3] }, q); g.put(h, s * 0.34, 0, 0, -s * 1.25, 0.95); } },
  // an archer with the bow LOWERED: the bow a bent stave held low and aslant before the body, the arrow on the string
  // and pointed at the ground (the string hand at the waist: nothing is drawn to the cheek)
  (g, r, q) => { const J = person(g, { turn: 0.5, nod: 0.2, lean: -0.04, handR: [0.46, 0.94, 0.22], handL: [0.1, 1.1, 0.2], bendL: [-0.6, -0.4, -0.5], footR: [0.2, 0.07, 0.12], footL: [-0.2, 0.07, -0.06] }, q);
    const c = J.hr, a = norm3(sub3(J.hr, J.hl)), p = norm3([-a[1], a[0], 0]), at = (u, v) => add3(add3(c, p, u), a, v);
    for (const s of [-1, 1]) { rod(g, c, at(s * 0.42, -0.1), 0.03, 0.026); rod(g, at(s * 0.42, -0.1), at(s * 0.72, -0.3), 0.026, 0.0225); } rod(g, J.hl, add3(J.hl, a, 0.78), 0.0225); },
  // a reaper, stooped to the work: the sickle LOW in the right hand, its blade a crescent that hangs from the fist
  // before the knee (it curves down, forward and up again, in an upright plane, so it shows from either hand); the
  // other hand on the hip (the elbow out). The figure carries nothing else
  (g, r, q) => { const J = person(g, { cap: 4, lean: 0.24, nod: 0.3, handR: [0.34, 0.96, 0.26], handL: [-0.23, 0.99, 0.09], bendL: [-1, 0.1, -0.3], footR: [0.12, 0.07, 0.16], footL: [-0.12, 0.07, -0.1] }, q); const c = add3(J.hr, [0, -0.07, 0.03]), bl = (t) => { const e = 0.18 - 0.18 * Math.cos(t); return add3(c, [0.25 * e, -0.24 * Math.sin(t), 0.97 * e]); };
    rod(g, J.hr, c, 0.028); for (let i = 0; i < 4; i++) rod(g, bl(i * 0.7), bl(i * 0.7 + 0.7), 0.03, 0.026); },
  // a fisher: a fish held out by the tail at the breast's height (it hangs to the thigh), a creel at the hip
  (g, r, q) => { const J = person(g, { cap: 1, side: 0.04, handR: [0.42, 1.2, 0.3], bendR: [0.6, -0.6, -0.2], handL: [-0.26, 0.96, 0.2], footR: [0.11, 0.07, 0.1], footL: [-0.12, 0.07, -0.06] }, q); const c = add3(J.hr, [0, -0.12, 0.02]); ball(g, add3(c, [0, -0.24, 0]), 0.1, 0.26, 0.05, 5, 3, 1); ball(g, add3(c, [0, 0.07, 0]), 0.13, 0.07, 0.025, 4, 2, 0.9);
    tube(g, [-0.36, 0.72, 0.16], [-0.36, 1.0, 0.16], 0.13, 0.16, 6, 0.86, 0.95); },
  // a quarryman: an iron bar set under the near edge of a squared block, both hands on the bar, a foot on the block.
  // The bar's upper end stands at the breast (1.22 m), a head's height under the chin: no rod ends at a face
  (g, r, q) => { const T = [0.14, 1.22, 0.12], B = [-0.02, 0.03, 0.46], on = (t) => [lerp(T[0], B[0], t), lerp(T[1], B[1], t), lerp(T[2], B[2], t)];
    person(g, { lean: 0.3, nod: 0.3, cap: 4, handR: on(0.06), handL: on(0.25), bendR: [0.8, -0.3, -0.3], bendL: [-0.8, -0.3, -0.3], footR: [0.2, 0.43, 0.5], kneeBend: [0.1, 0.3, 1], footL: [-0.14, 0.07, -0.12] }, q); rod(g, T, B, 0.03, 0.03, 5); g.box(-0.08, 0, 0.4, 0.4, 0.36, 0.7, MARBLE, 'y', 0.9); },
];
// the beasts, in profile (the head toward +X)
const leg4 = (g, x, z, y, bend, r0 = 0.065, ns = 5) => { const k = [x + bend, y * 0.5, z]; tube(g, [x, y, z], k, r0, r0 * 0.75, ns, 0.88); tube(g, k, [x + bend * 0.3, 0, z], r0 * 0.75, r0 * 0.62, ns, 0.84); };
const BEASTS = [
  // a stag
  (g, r, q) => { const n = q === 1 ? 5 : 7; ball(g, [0, 1.1, 0], 0.56, 0.27, 0.2, n, 4, 1); tube(g, [0.4, 1.2, 0], [0.64, 1.72, 0], 0.15, 0.09, 6, 0.95); ball(g, [0.74, 1.8, 0], 0.17, 0.095, 0.085, 6, 4, 1, -0.3);
    for (const s of [-1, 1]) { tube(g, [0.66, 1.88, s * 0.05], [0.52, 2.3, s * 0.3], 0.028, 0.02, 4); tube(g, [0.52, 2.3, s * 0.3], [0.62, 2.62, s * 0.36], 0.02, 0.01, 4); tube(g, [0.58, 2.1, s * 0.2], [0.8, 2.3, s * 0.26], 0.018, 0.008, 4); tube(g, [0.52, 2.3, s * 0.3], [0.34, 2.5, s * 0.38], 0.018, 0.008, 4); ball(g, [0.6, 1.9, s * 0.1], 0.03, 0.07, 0.03, 4, 3, 0.9, 0.5);
      leg4(g, 0.38, s * 0.1, 0.98, 0.04); leg4(g, -0.4, s * 0.11, 1.0, -0.07); } ball(g, [-0.56, 1.2, 0], 0.07, 0.06, 0.05, 4, 3, 0.9); },
  // a heron
  (g, r, q) => { ball(g, [0, 0.98, 0], 0.32, 0.17, 0.14, 6, 4, 1, 0.3); tube(g, [0.2, 1.08, 0], [0.34, 1.36, 0], 0.07, 0.045, 5); tube(g, [0.34, 1.36, 0], [0.2, 1.62, 0], 0.045, 0.04, 5); tube(g, [0.2, 1.62, 0], [0.3, 1.84, 0], 0.04, 0.04, 5); ball(g, [0.34, 1.87, 0], 0.085, 0.06, 0.055, 5, 3, 1);
    tube(g, [0.4, 1.87, 0], [0.7, 1.82, 0], 0.03, 0.006, 4); tube(g, [-0.24, 0.9, 0], [-0.52, 0.7, 0], 0.09, 0.03, 5, 0.9); for (const s of [-1, 1]) { tube(g, [0.03, 0.86, s * 0.05], [0.07, 0.42, s * 0.05], 0.035, 0.028, 4, 0.85); tube(g, [0.07, 0.42, s * 0.05], [0.0, 0, s * 0.05], 0.028, 0.03, 4, 0.85); } },
  // a horse
  (g, r, q) => { const n = q === 1 ? 5 : 8; ball(g, [0, 1.2, 0], 0.68, 0.31, 0.25, n, 4, 1); tube(g, [0.48, 1.3, 0], [0.86, 1.86, 0], 0.22, 0.13, 6, 0.95); tube(g, [0.84, 1.9, 0], [1.14, 1.64, 0], 0.115, 0.07, 6); for (const s of [-1, 1]) ball(g, [0.84, 2.02, s * 0.05], 0.025, 0.06, 0.025, 4, 3, 0.9);
    tube(g, [0.52, 1.52, 0], [0.8, 1.98, 0], 0.05, 0.04, 4, 0.8); tube(g, [-0.66, 1.3, 0], [-0.9, 0.7, 0], 0.07, 0.03, 5, 0.85);
    leg4(g, 0.44, 0.12, 1.02, 0.03, 0.08); leg4(g, -0.5, 0.13, 1.05, -0.08, 0.085); leg4(g, -0.46, -0.13, 1.05, -0.06, 0.085); tube(g, [0.46, 1.02, -0.12], [0.72, 0.78, -0.12], 0.08, 0.06, 5, 0.88); tube(g, [0.72, 0.78, -0.12], [0.62, 0.42, -0.12], 0.06, 0.05, 5, 0.85); },
  // a dog seated
  (g, r, q) => { tube(g, [-0.18, 0.26, 0], [0.16, 0.74, 0], 0.2, 0.15, 6, 0.95); ball(g, [-0.2, 0.24, 0], 0.24, 0.22, 0.22, 6, 4, 0.95); ball(g, [0.27, 0.98, 0], 0.13, 0.125, 0.115, 6, 4, 1); tube(g, [0.32, 0.96, 0], [0.5, 0.9, 0], 0.07, 0.045, 5); tube(g, [0.14, 0.76, 0], [0.26, 0.92, 0], 0.11, 0.09, 5, 0.9);
    for (const s of [-1, 1]) { ball(g, [0.22, 1.1, s * 0.08], 0.035, 0.07, 0.03, 4, 3, 0.9, 0.3); tube(g, [0.2, 0.62, s * 0.09], [0.25, 0, s * 0.09], 0.055, 0.045, 5, 0.86); ball(g, [0.02, 0.06, s * 0.2], 0.16, 0.06, 0.07, 4, 3, 0.85); } tube(g, [-0.4, 0.12, 0], [-0.62, 0.06, 0.14], 0.04, 0.02, 4, 0.85); },
];
// a lion lying on a high block, for the hands of a great door
export function lionInto(g) {
  g.box(-1.3, 0, -0.52, 1.5, 0.55, 0.52, MARBLE, 'y', 0.92);
  const y = 0.55; ball(g, [-0.15, y + 0.34, 0], 0.78, 0.29, 0.29, 8, 5, 1); ball(g, [0.45, y + 0.5, 0], 0.36, 0.4, 0.3, 7, 5, 1);
  ball(g, [0.62, y + 0.84, 0], 0.33, 0.43, 0.43, 9, 6, 0.84); ball(g, [0.5, y + 0.56, 0], 0.32, 0.32, 0.42, 8, 4, 0.82);
  ball(g, [0.9, y + 0.92, 0], 0.22, 0.23, 0.21, 8, 5, 1); ball(g, [1.07, y + 0.83, 0], 0.13, 0.11, 0.135, 7, 4, 0.97); ball(g, [1.18, y + 0.87, 0], 0.04, 0.035, 0.05, 5, 3, 0.8); ball(g, [1.04, y + 0.74, 0], 0.1, 0.05, 0.1, 6, 3, 0.86);
  for (const s of [-1, 1]) { tube(g, [0.55, y + 0.2, s * 0.21], [1.2, y + 0.09, s * 0.21], 0.11, 0.085, 6, 0.9); ball(g, [1.26, y + 0.08, s * 0.21], 0.1, 0.07, 0.09, 5, 3, 0.9); ball(g, [-0.55, y + 0.25, s * 0.25], 0.32, 0.24, 0.15, 6, 4, 0.92); tube(g, [-0.5, y + 0.1, s * 0.3], [-0.05, y + 0.07, s * 0.33], 0.08, 0.07, 5, 0.88); ball(g, [0.84, y + 1.14, s * 0.17], 0.05, 0.06, 0.04, 4, 3, 0.9); }
  tube(g, [-0.9, y + 0.2, 0], [-1.15, y + 0.08, 0.28], 0.045, 0.035, 5, 0.85); tube(g, [-1.15, y + 0.08, 0.28], [-0.7, y + 0.07, 0.44], 0.035, 0.03, 5, 0.85); ball(g, [-0.66, y + 0.08, 0.45], 0.07, 0.05, 0.05, 4, 3, 0.85);
}
// a nest of sticks: a shallow bowl of straw and round its rim sixteen sticks laid across one another (rn: the draws
// of the nest's own stream), at c of the figure's own frame, R its half breadth. The figure remembers where it lies
export function nestInto(gg, c, R, rn) {
  setStone([0.56, 0.45, 0.27]); ball(gg, c, R, R * 0.18, R, 9, 3, 0.8);
  for (let i = 0; i < 16; i++) { const t = TAU * i / 16 + rn.range(-0.15, 0.15), rr = R * rn.range(0.86, 1.12), tw = t + Math.PI / 2 + rn.range(-0.6, 0.6), L = R * rn.range(0.5, 0.86), p = [c[0] + Math.cos(t) * rr, c[1] + R * 0.09 + rn.range(0, R * 0.19), c[2] + Math.sin(t) * rr];
    tube(gg, [p[0] - Math.cos(tw) * L, p[1] - R * 0.065, p[2] - Math.sin(tw) * L], [p[0] + Math.cos(tw) * L, p[1] + R * 0.11, p[2] + Math.sin(tw) * L], R * 0.06, R * 0.043, 4, rn.range(0.75, 1.1)); }
  setStone(null); gg.nest = [c[0], c[1] + R * 0.3, c[2]];
}
// THE GIANTS (kind), each a subject of its own: 0 one who bears a lintel on back and hands (the entrance hall's
// row); 2 one who holds a nest out before the breast (the cloud hall); 3 one who stands in the sea with both hands
// held out over it (the flooded hall); 4 a door warden: a tall staff with a ring at its head in the right hand, the
// left arm laid across the body with a nest in its crook (the first hall's end); 5 a boatman seated, an oar upright
// in the right hand, the left hand on the knee, a nest in the lap; 6 one seated who holds a boat with its mast and
// sail on the knees, a nest in the boat's bow (the stair's pair); 7 one who stands behind an anchor set upright on
// its crown before him, a hand on either end of its stock; 8 one poised to dive, both arms raised over the head with
// the hands together (the two of the wall that faces the stair). rn: the nests' stream (kinds 4, 5, 6). Returns the
// figure's height in the make's own measure
// (a giant is of the grade seen close: carved with the soft shading of the form and the bevelled folds, SOFT_FINE)
export function giantInto(g, kind, r, rn, seat = true) { SOFT = SOFT_FINE; try { return giantCarve(g, kind, r, rn, seat); } finally { SOFT = 0; } }
function giantCarve(g, kind, r, rn, seat) {
  if (kind === 0) { person(g, { bulk: 1.3, lean: 0.3, nod: 0.75, cap: 4, handR: [0.37, 1.69, 0.0], handL: [-0.37, 1.69, 0.0], bendR: [1, -0.4, 0.2], bendL: [-1, -0.4, 0.2], footR: [0.16, 0.07, 0.2], footL: [-0.16, 0.07, -0.12 - 0.1 * r()] }, 2); g.box(-0.5, 1.68, -0.34, 0.5, 1.78, 0.3, MARBLE, '', 0.95); return 1.78; }
  // one who stands in the sea and holds both hands out low over it, palms down, the head bent to the water
  if (kind === 3) { person(g, { bulk: 1.2, robe: 1, cap: 1, nod: 0.4, turn: (r() - 0.5) * 0.3, handR: [0.56, 1.08, 0.26], handL: [-0.56, 1.08, 0.26], bendR: [0.3, 1, -0.4], bendL: [-0.3, 1, -0.4], ph: r() * 6 }, 2); return 1.75; }
  if (kind === 4) {
    person(g, { bulk: 1.22, robe: 1, cap: 1, nod: 0.12, turn: -0.15, handR: [0.46, 1.26, 0.22], bendR: [0.7, -0.6, -0.3], handL: [0.02, 1.13, 0.3], bendL: [-0.8, -0.5, 0.1], ph: r() * 6 }, 2);
    tube(g, [0.48, 0, 0.26], [0.45, 2.02, 0.2], 0.042, 0.036, 6); for (let i = 0; i < 8; i++) { const t0 = TAU * i / 8, t1 = TAU * (i + 1) / 8; tube(g, [0.45 + 0.13 * Math.sin(t0), 2.15 - 0.13 * Math.cos(t0), 0.2], [0.45 + 0.13 * Math.sin(t1), 2.15 - 0.13 * Math.cos(t1), 0.2], 0.03, 0.03, 4); }
    if (rn) nestInto(g, [-0.17, 1.2, 0.29], 0.15, rn); return 2.28;
  }
  if (kind === 7) {
    // the anchor: a shank on its crown, two arms curving up to their flukes, a stock across under the ring; it stands
    // before the body and reaches to the breast (nothing is held to the face)
    const ax = 0.12, az = 0.3, tn = (r() - 0.5) * 0.4;
    person(g, { bulk: 1.22, cap: 4, nod: 0.18, turn: tn, handR: [ax + 0.2, 1.13, az - 0.02], handL: [ax - 0.2, 1.13, az - 0.02], bendR: [0.9, -0.4, -0.3], bendL: [-0.9, -0.4, -0.3], footR: [0.17, 0.07, 0.08], footL: [-0.17, 0.07, 0.0] }, 2);
    tube(g, [ax, 0.05, az], [ax, 1.2, az], 0.05, 0.042, 6); tube(g, [ax - 0.25, 1.1, az], [ax + 0.25, 1.1, az], 0.04, 0.04, 5); for (const e of [-1, 1]) ball(g, [ax + e * 0.25, 1.1, az], 0.055, 0.055, 0.055, 5, 3, 0.95);
    for (let i = 0; i < 8; i++) { const t0 = TAU * i / 8, t1 = TAU * (i + 1) / 8; tube(g, [ax + 0.08 * Math.sin(t0), 1.29 - 0.08 * Math.cos(t0), az], [ax + 0.08 * Math.sin(t1), 1.29 - 0.08 * Math.cos(t1), az], 0.026, 0.026, 4); }
    for (const e of [-1, 1]) { let p0 = [ax, 0.07, az];
      for (let i = 1; i <= 3; i++) { const ph = 0.45 * i, p1 = [ax + e * 0.4 * Math.sin(ph), 0.07 + 0.4 * (1 - Math.cos(ph)), az]; tube(g, p0, p1, 0.05 - 0.005 * i, 0.045 - 0.005 * i, 5, 0.95); p0 = p1; }
      ball(g, [p0[0] + e * 0.02, p0[1] + 0.04, az], 0.075, 0.12, 0.022, 4, 2, 1, -e * 0.5); }
    return 1.8;
  }
  if (kind === 8) {
    person(g, { bulk: 1.18, lean: 0.1, nod: 0.2, turn: (r() - 0.5) * 0.3, handR: [0.1, 1.96, 0.1], handL: [-0.1, 1.96, 0.1], bendR: [1, 0.2, 0.1], bendL: [-1, 0.2, 0.1], footR: [0.08, 0.07, 0.06], footL: [-0.08, 0.07, 0.0] }, 2);
    return 2.03;
  }
  if (kind === 5 || kind === 6) {
    // (each seated giant's one draw of the giants' stream: how far its head is turned from its pose, 7 degrees at the most to either hand)
    const boat = kind === 6, tu = (r() - 0.5) * 0.5;
    if (seat) g.box(-0.36, 0, -0.34, 0.36, 0.5, 0.14, MARBLE, 'y', 0.9);
    person(g, { bulk: 1.22, py: 0.56, lean: boat ? 0.1 : 0.02, nod: boat ? 0.4 : 0.08, turn: (boat ? 0 : 0.2) + tu, cap: boat ? 3 : 4, kilt: 0, footR: [0.15, 0.07, 0.44], footL: [-0.15, 0.07, boat ? 0.44 : 0.36], kneeBend: [0, 1, 0.3],
      handR: boat ? [0.33, 0.78, 0.4] : [0.5, 1.16, 0.3], bendR: boat ? [0.9, -0.3, -0.3] : [0.7, -0.6, -0.3], handL: boat ? [-0.33, 0.78, 0.4] : [-0.17, 0.66, 0.36], bendL: [-0.9, -0.3, -0.3] }, 2);
    // a cloth over the lap and the seat
    pleat(g, [{ c: [0, 0.2, 0.2], rx: 0.29, rz: 0.3, d: 0.12, sh: 0.78 }, { c: [0, 0.56, 0.16], rx: 0.25, rz: 0.27, d: 0.07, sh: 0.92 }, { c: [0, 0.68, 0.02], rx: 0.17, rz: 0.13 }], 7, 0.3);
    if (boat) {
      ball(g, [0, 0.74, 0.42], 0.46, 0.1, 0.13, 8, 4, 1); tube(g, [0.42, 0.76, 0.42], [0.56, 0.9, 0.42], 0.05, 0.02, 4); tube(g, [0.04, 0.8, 0.42], [0.04, 1.3, 0.42], 0.024, 0.02, 4); ball(g, [-0.07, 1.06, 0.42], 0.13, 0.21, 0.014, 4, 2, 0.95, -0.25);
      if (rn) nestInto(g, [0.27, 0.83, 0.42], 0.11, rn); return 1.5;
    }
    tube(g, [0.53, 0, 0.36], [0.5, 1.5, 0.3], 0.04, 0.034, 6); ball(g, [0.5, 1.66, 0.3], 0.1, 0.24, 0.022, 6, 3, 1);
    if (rn) nestInto(g, [-0.02, 0.73, 0.3], 0.14, rn); return 1.9;
  }
  person(g, { bulk: 1.25, robe: 1, cap: 1, nod: 0.45, handR: [0.2, 1.2, 0.42], handL: [-0.2, 1.2, 0.42], bendR: [1, -1, 0], bendL: [-1, -1, 0], ph: r() * 6 }, 2); return 1.75;
}
// one make, with its plinth and its measures. kind: an index into the people and then the beasts. WHAT IS NEVER SEEN
// IS NOT CARVED, by the place a make stands in: the plain make (every tier above the lowest, seen from below and
// from far) has no face that looks back into its niche; the fine make (the lowest tier, passed at the eye's height)
// has none that looks back from behind the middle of its body
export const N_PEOPLE = MAKES.length, N_BEASTS = BEASTS.length;
// THE MEASURES OF A MAKE DO NOT CHANGE WITH THE BEVELS: the fine make's breadth, height, depth, highest point and
// reach (which set its size in its niche, the perch on its head and the room the birds keep out of) are read from
// the make carved as the plain chisel cuts it, edges for ridges (rm: a second stream of the make's own name, so
// that carving deals the same pose), and the bevelled make stands in exactly that room
// (THE RULE WITH ITS COST, measured on 130 makes of five seeds: every fine make is carved twice, once
// bevelled to be drawn and once plain only to be measured; the bevelled stone's own measures differ from the plain
// one's by 0.024 m in breadth and 0.012 m in its box at the most, its height and its perch not at all. So the
// second carving buys nothing a visitor could see, and the room the birds keep out of is the plain stone's, to
// 0.012 m short of the stone that is drawn. It stands so: a make's measures are the plain chisel's)
export function figureMake(kind, r, q, rm) {
  const make = kind < MAKES.length ? MAKES[kind] : BEASTS[kind - MAKES.length], carve = (rr, soft) => { const b = new Geo(); SOFT = soft; try { make(b, rr, q); } finally { SOFT = 0; } return b; };
  let g = carve(r, q === 3 ? SOFT_FINE : 0); const gm = q === 3 && rm ? carve(rm, 0) : g;
  let x0 = 9, x1 = -9, y1 = 0, z0 = 9, z1 = -9; for (let i = 0; i < gm.p.length; i += 3) { x0 = Math.min(x0, gm.p[i]); x1 = Math.max(x1, gm.p[i]); y1 = Math.max(y1, gm.p[i + 1]); z0 = Math.min(z0, gm.p[i + 2]); z1 = Math.max(z1, gm.p[i + 2]); }
  const beast = kind >= MAKES.length, ph = beast ? 0.55 : 0.22, hx = Math.min(Math.max(-x0, x1), 0.75) + 0.05;
  const zb = Math.max(z0, -0.34) - 0.04, zf = Math.min(z1, 0.42) + 0.04;
  // the fine make stands on a moulded plinth: a base, a waist drawn in, a cap that stands out
  if (q === 3) { g.box(-hx - 0.05, -ph, zb - 0.05, hx + 0.05, -ph * 0.7, zf + 0.05, MARBLE, 'y', 0.86); g.box(-hx + 0.02, -ph * 0.7, zb + 0.02, hx - 0.02, -ph * 0.22, zf - 0.02, MARBLE, 'yY', 0.78); g.box(-hx - 0.03, -ph * 0.22, zb - 0.03, hx + 0.03, 0, zf + 0.03, MARBLE, '', 0.95);
    // and THE MOULDING between them: a bevelled plane from the base up to the waist and one from the waist out to
    // the cap (a splay and a cove cut flat), on the front and the two flanks
    const bev = (y0, o0, y1, o1, s0, s1) => { const A = (o, y) => [[-hx - o, y, zf + o], [hx + o, y, zf + o], [hx + o, y, zb - o], [-hx - o, y, zb - o]], a = A(o0, y0), b = A(o1, y1);
      g.quad(a[0], a[1], b[1], b[0], [0, y1 > y0 && o1 < o0 ? 1 : -1, 1], MARBLE, 0, [s0, s0, s1, s1]); g.quad(a[1], a[2], b[2], b[1], [1, o1 < o0 ? 1 : -1, 0], MARBLE, 0, [s0, s0, s1, s1]); g.quad(a[3], a[0], b[0], b[3], [-1, o1 < o0 ? 1 : -1, 0], MARBLE, 0, [s0, s0, s1, s1]); };
    bev(-ph * 0.7, 0.05, -ph * 0.58, -0.02, 0.92, 0.84); bev(-ph * 0.34, -0.02, -ph * 0.22, 0.03, 0.72, 0.84); }
  else g.box(-hx, -ph, zb, hx, 0, zf, MARBLE, 'y', 0.9);
  g = q === 3 ? cullBack(g, -0.5, 0.02, true) : cullBack(g, -0.3);
  // the make's highest point (its head, or what it holds up higher than its head): where a bird perches on it
  // (of the fine make: as the plain chisel cuts it, with what is never seen left out the same way)
  const gt = gm === g || q !== 3 ? g : cullBack(gm, -0.5, 0.02);
  let ty = -9, tx = 0, tz = 0; for (let i = 0; i < gt.p.length; i += 3) if (gt.p[i + 1] > ty) { ty = gt.p[i + 1]; tx = gt.p[i]; tz = gt.p[i + 2]; }
  // (box: the make's whole reach in its own measure, plinth and all it holds: x0, x1, z0, z1)
  return { g, w: Math.max(x1 - x0, 2 * hx + (q === 3 ? 0.1 : 0)), h: y1 + ph, ph, hx, tris: g.tris, top: [tx, ty + ph, tz], box: [Math.min(x0, -hx - 0.05), Math.max(x1, hx + 0.05), Math.min(z0, zb - 0.05), Math.max(z1, zf + 0.05)] };
}
// ---------------------------------------------------------------- the light, by place
// ONE LIGHT TO A HALL, each with a source a visitor could point at and deep shade away from it; the six differ in
// colour: the first hall (porch and nave) WARM GOLD from the high windows of its seaward hand; the flooded hall SEA
// GREEN from the water; the great stair WHITE from its lantern; the hall of the sea doors SEA BLUE from its doors;
// the cloud hall PEARL from its open crown, with gold beams; the last hall its own evening, MOON BLUE with the dusk's
// gold band. Each belongs to its hall by where a point stands on the spine and gives way to the next inside the
// thickness of the wall between them (P.joins). The hour of the visit, one standing state, sets the sun's height and
// the gold's colour and casts its tint over the other lights; the last hall keeps its own evening.
const HOURS = {
  day: { exposure: 0.8, sun: [0.68, 0.66, 0.32], gold: [2.5, 1.85, 1.0], soft: [0.95, 0.78, 0.5], cast: [1, 1, 1], out: [0.72, 0.86, 1.05], tide: [0.06, 0.135, 0.125], glow: 0, haze: 1 },
  golden: { exposure: 0.84, sun: [0.76, 0.52, 0.38], gold: [3.0, 1.65, 0.68], soft: [1.05, 0.7, 0.36], cast: [1.05, 0.97, 0.9], out: [0.84, 0.82, 0.98], tide: [0.08, 0.135, 0.115], glow: 0, haze: 1.1 },
  dawn: { exposure: 0.86, sun: [0.74, 0.56, -0.37], gold: [2.6, 1.7, 1.2], soft: [0.95, 0.72, 0.56], cast: [1.02, 0.97, 1.0], out: [0.9, 0.84, 0.95], tide: [0.07, 0.13, 0.13], glow: 0, haze: 2 },
  night: { exposure: 1.0, sun: [0.8, 0.44, 0.4], gold: [2.3, 1.05, 0.42], soft: [0.8, 0.45, 0.24], cast: [0.8, 0.86, 1.05], out: [0.22, 0.33, 0.6], tide: [0.035, 0.1, 0.12], glow: 1, haze: 1.2 },
};
// a hall's light, air and stone. key: the source's colour and strength on a face turned to it; dir: the way to the
// source; sky, gnd: the deep shade from above and from below; fog; bar: the sun through windows; wall: the colour of
// the hall's own stone (the statues are white marble in every hall); mk: its veins; vault: 0 plain, 1 coffered,
// 2 ribbed, 3 the cove; lan (the great stair only): the lantern's own white, what lies in its spokes and shafts (key is
// there the cool day that fills the hall between them); floor: 0 chequer, 1 plain worn flags, 2 veined slabs, 3 the wet mirror, 4 worn flags with
// drifted sand and standing water; z: the hall's share in (sea, cloud, last, wet pavement); z2: (lantern, windows'
// sun, the tide's mark by the sea's level, 0)
function hallLook(id, H) {
  const c = H.cast, m = (a, k = 1) => [a[0] * c[0] * k, a[1] * c[1] * k, a[2] * c[2] * k], g = H.gold;
  if (id === 'ves' || id === 'nave') return { key: [H.soft[0] * 1.05, H.soft[1] * 1.05, H.soft[2] * 1.05], dir: H.sun, sky: [0.05, 0.045, 0.06], gnd: [0.11, 0.08, 0.05], fog: [0.62, 0.5, 0.36, 0.0021 * H.haze], bar: g, glass: [g[0] * 0.85, g[1] * 0.9, g[2] * 1.1], wall: [1.0, 0.83, 0.6], vault: id === 'nave' ? 1 : 0, floor: 0, mk: 1, z: [0, 0, 0, 0], z2: [0, 1, 0, 0] };
  if (id === 'sea') return { key: m([0.3, 0.8, 0.58]), dir: [0, -1, 0], sky: [0.02, 0.035, 0.035], gnd: m([0.07, 0.15, 0.12]), fog: [0.15, 0.28, 0.25, SEA_AIR], bar: m([0.6, 1.0, 0.8], 0.9), glass: m([0.9, 1.5, 1.2]), wall: [0.62, 0.78, 0.68], vault: 0, floor: 1, mk: 2, z: [1, 0, 0, 0], z2: [0, 0, 1, 0] };
  if (id === 'stair') return { key: m([0.8, 0.82, 0.92]), lan: m([1.22, 1.17, 1.04]), dir: [0, 1, 0], sky: m([0.1, 0.115, 0.17]), gnd: m([0.17, 0.17, 0.185]), fog: [0.66, 0.7, 0.8, 0.001], bar: [0, 0, 0], glass: m([2.6, 2.6, 2.5]), wall: [1.0, 0.985, 0.95], vault: 3, floor: 1, mk: 0, z: [0, 0, 0, 0], z2: [1, 0, 1, 0] };
  if (id === 'hero') return { key: m([0.6, 0.85, 1.25], 1.15), dir: [0.94, 0.34, 0], sky: m([0.035, 0.06, 0.115]), gnd: m([0.06, 0.09, 0.15]), fog: [0.5 * c[0], 0.66 * c[1], 0.86 * c[2], 0.0019], bar: [0, 0, 0], glass: m([1.5, 1.7, 2.0]), wall: [0.7, 0.78, 0.9], vault: 2, floor: 3, mk: 3, z: [0, 0, 0, 1], z2: [0, 0, 0, 0] };
  if (id === 'cloud') return { key: m([1.0, 0.9, 0.78], 0.7), dir: [0.55, 0.8, 0.2], sky: m([0.09, 0.076, 0.1]), gnd: m([0.09, 0.07, 0.068]), fog: [0.8 * c[0], 0.8 * c[1], 0.82 * c[2], 0.003], bar: [g[0] * 0.62, g[1] * 0.42, g[2] * 0.22], glass: m([1.75, 1.85, 2.05]), wall: [0.94, 0.74, 0.58], vault: 0, floor: 2, mk: 0, z: [0, 1, 0, 0], z2: [0, 0, 0, 0] };
  return { key: [2.0, 1.16, 0.52], dir: [-0.97, 0.17, -0.12], sky: [0.15, 0.22, 0.46], gnd: [0.11, 0.105, 0.15], fog: [0.3, 0.3, 0.46, 0.0016], bar: [0, 0, 0], glass: [1, 1, 1], wall: [1.0, 0.88, 0.7], vault: 0, floor: 4, mk: 1, z: [0, 0, 1, 0], z2: [0, 0, 0, 0] };
}
// the water's net of light on stone: ONE shared factor for the net in every hall that has the sea in it (the flooded hall and the
// great stair, where the sea stands; the hall of the sea doors, where it runs over the pavement); each hall's own
// strength stands beside it in its line of the look (the flooded hall's SEA_NET_K; the great stair's 1.4; the
// sea doors' 0.3 of the doors' day)
const WATER_LIGHT = 0.42;
// the way to the moon from any place of the last hall (it stands fixed in the sky beyond the broken doorway: the
// sky draws it there and the pools give it back from there). THE ONE NUMBER: the look's MOON, the sky's own moon
// (makeSky) and the shadows of the strewn stones all read it
export const MOON_DIR = [0.1305, 0.3613, -0.9233];
// the moon's law of place, as the look has it (moonAt), with hard edges, for what is built by it (the shadows of
// the stones that lie in its light): true where the moon reaches the point (x, y, z). It takes no draw
export function moonReaches(P, x, y, z) {
  const E = P.endWall, ru = P.ruin, M = MOON_DIR, d = E.aw + z; if (d < 0) return true;
  const t = d / -M[2], hx = x + M[0] * t, hy = y + M[1] * t;
  if (hx > ru.W) { const ts = (ru.W - x) / M[0], ci = clamp(Math.floor((-z - M[2] * ts - ru.a0) / ru.bay), 0, ru.nb - 1); return y + M[1] * ts > UP_Y + ru.cut[1][ci]; }
  const ax = Math.abs(hx), sd = hx > 0 ? 1 : 0;
  if (ax > E.R && hy < E.tops[sd][clamp(Math.floor((ax - E.R) / ((ru.W - E.R) / 3)), 0, 2)]) return false;
  const rho = Math.hypot(ax, hy - E.spring), ang = Math.atan2(hy - E.spring, ax);
  return !(rho > E.R && rho < E.R2 && ang > 0 && ang < E.reach[sd]);
}
// the moon's light on stone in the last hall (its colour and strength on a face turned full to it)
const MOON_LIGHT = [0.48, 0.6, 0.88];
// THE FLOODED HALL'S LIGHT IS THE SEA'S, FROM BELOW, AND IT BEHAVES AS LIGHT FROM WATER DOES, by a point's height over
// the sea's level (laws of place: the same for every visitor at every moment; nothing reads the eye, the clock's
// phase or the route). SEA_GREEN: the height over which the water's own green falls to a third (the green belongs to
// the water and to what it lights: full at the waterline; what climbs higher has been thrown from stone to stone and
// is weaker and has lost its green, SEA_GREY of the green's mean strength in each colour and less again toward the
// vault, by a half every SEA_DIM m (0.58 at the vault's crown): so the upper tiers and the vault stand in a darker,
// more neutral tone of the hall's stone and the white figures stay white against it). SEA_NET, SEA_NET_K: the net
// of light the water throws climbs the walls and the figures to the vault, weaker with the height: SEA_NET_K
// strong at the waterline (beside WATER_LIGHT, the factor the net of every hall of the sea shares), a third of that SEA_NET m
// up, under a fifth at the vault's crown; its threads fine at the waterline and wholly broad and soft at the
// crown (SEA_CROWN, the hall's own height over the sea by its plan: 31.5 m). These five numbers of the hall's light are
// chosen, not derived: no place gives them, and the law they stand in knows only the height over the sea.
// SEA_AIR: the hall's air is
// thin (the far door with the white hall beyond it is seen through it from the stair's head). SEA_DOOR: the white
// day that stands in the half-flooded door at the hall's end falls on the stone and the water about it by the
// distance from the door itself, to a half at this many metres
const SEA_GREEN = 14, SEA_GREY = [0.95, 0.95, 0.92], SEA_DIM = 40, SEA_NET = 20, SEA_NET_K = 2.3, SEA_AIR = 0.0012, SEA_DOOR = 24;
// (p1m1) what a tread or a landing of the flooded hall's stair has of the water's light, and the depth under the sea
// at which a tread still has a third of that (said at the law, in the look)
const SEA_TREAD = 0.26, SEA_TREAD_DEEP = 0.4;
export function makeLook(P, hour, rare) {
  const H = HOURS[hour] || HOURS.day, V = P.V, n3 = (a) => new THREE.Vector3(a[0], a[1], a[2]), v3n = (a) => n3(a).normalize(), n4 = (a) => new THREE.Vector4(a[0], a[1], a[2], a[3]);
  const tab = V.map((v) => hallLook(v.id, H)); while (tab.length < 8) tab.push(tab[tab.length - 1]);
  const T = { sea: tab[P.sea.i], cloud: tab[P.cl.i], ruin: tab[P.ruin.i] }, c = H.cast;
  // the four lights the small things (birds, weed, dust, spray) are lit by: the windowed and lanterned halls' mean,
  // the sea's, the cloud's, the last hall's
  const Z = [{ key: [1.0 * c[0], 0.96 * c[1], 0.88 * c[2]], dir: H.sun, sky: [0.09, 0.1, 0.13], gnd: [0.12, 0.11, 0.1], fog: tab[1].fog, bar: H.gold, glass: tab[1].glass }, T.sea, T.cloud, T.ruin];
  const winA = [], winB = [], winC = [];
  for (const v of V) {
    const ws = (P.wins || []).filter((w) => w.vi === v.i);
    if (!ws.length) { winA.push(new THREE.Vector4(0, 0, 1, 1)); winB.push(new THREE.Vector4(0, 0, 0, 0)); winC.push(new THREE.Vector4(0, 0, 0, 0)); continue; }
    const cell = v.bay / v.win.n, a0 = Math.min(...ws.map((w) => w.a)) - cell / 2, a1 = Math.max(...ws.map((w) => w.a)) + cell / 2;
    winA.push(new THREE.Vector4(a0, a1, cell, ws[0].hw)); winB.push(new THREE.Vector4(ws[0].v0, ws[0].vs, v.W + 1.1, 1)); winC.push(new THREE.Vector4(v.a0 - WT, v.a1 + WT, 0, 0));
  }
  while (winA.length < 8) { winA.push(new THREE.Vector4(0, 0, 1, 1)); winB.push(new THREE.Vector4(0, 0, 0, 0)); winC.push(new THREE.Vector4(0, 0, 0, 0)); }
  const ruin = P.ruin, cuts = ruin.cut[0].slice(); for (let i = cuts.length; i < 16; i++) cuts.push(cuts[cuts.length - 1]);
  const cutsS = ruin.cut[1].slice(); for (let i = cutsS.length; i < 16; i++) cutsS.push(cutsS[cutsS.length - 1]);
  const st = P.st, hero = P.hero, cl = P.cl, sea = P.sea, i8 = [0, 1, 2, 3, 4, 5, 6, 7];
  const uniforms = {
    uTime: { value: 0 },
    uHall: { value: i8.map((i) => (V[i] ? new THREE.Vector4(V[i].a0 - 0.2, V[i].W, tab[i].mk, tab[i].floor) : new THREE.Vector4(1e6, 1, 0, 0))) },
    uHall2: { value: i8.map((i) => (V[i] ? new THREE.Vector4(tab[i].vault, V[i].bay, V[i].a0, 0) : new THREE.Vector4(0, 1, 0, 0))) },
    uJoin: { value: i8.map((i) => (i > 0 && P.joins[i - 1] ? new THREE.Vector2(P.joins[i - 1][0], P.joins[i - 1][1]) : new THREE.Vector2(i ? 1e6 : -1e6, i ? 1e6 + 1 : -1e6 + 1))) },
    uLKey: { value: tab.map((q) => n3(q.key)) }, uLDir: { value: tab.map((q) => v3n(q.dir)) }, uLSky: { value: tab.map((q) => n3(q.sky)) }, uLGnd: { value: tab.map((q) => n3(q.gnd)) },
    uLFog: { value: tab.map((q) => n4(q.fog)) }, uLBar: { value: tab.map((q) => n3(q.bar)) }, uLGlass: { value: tab.map((q) => n3(q.glass)) }, uLWall: { value: tab.map((q) => n3(q.wall)) },
    uLZ: { value: tab.map((q) => n4(q.z)) }, uLZ2: { value: tab.map((q) => n4(q.z2)) },
    uKey: { value: Z.map((q) => n3(q.key)) }, uDir: { value: Z.map((q) => v3n(q.dir)) }, uSky: { value: Z.map((q) => n3(q.sky)) }, uGnd: { value: Z.map((q) => n3(q.gnd)) },
    uFog: { value: Z.map((q) => n4(q.fog)) }, uBar: { value: Z.map((q) => n3(q.bar)) }, uGlass: { value: Z.map((q) => n3(q.glass)) },
    uSun: { value: v3n(H.sun) }, uWinA: { value: winA }, uWinB: { value: winB }, uWinC: { value: winC }, uEyeFog: { value: new THREE.Vector4(0.7, 0.75, 0.8, 0.002) },
    uSeaY: { value: SEA_Y }, uRuin: { value: new THREE.Vector4(ruin.W, Math.tan(Math.asin(v3n(T.ruin.dir).y)), ruin.a0, ruin.bay) }, uCut: { value: cuts.map((q) => q + UP_Y) },
    uSnow: { value: rare ? 1 : 0 }, uOut: { value: n3(H.out) }, uGlow: { value: H.glow }, uStorm: { value: P.storm.map((q) => new THREE.Vector4(q.p[0], q.p[1], q.p[2], q.R)) }, uStormF: { value: new THREE.Vector3(0, 0, 0) }, uRing: { value: new THREE.Vector4(0, UP_Y + EYE, -P.end, 1) },
    // the lantern (its ring's middle and radius), the sea doors (the first door's place, their pitch, their half
    // breadth, the wall's place; their springing), the flooded hall's far door (where the stair's daylight comes
    // in), the cloud hall's open crown (the deck's height, the opening's half breadth, where it begins and ends)
    uLan: { value: new THREE.Vector4(0, st.dome.y0 + 4, -st.dome.a, st.dome.R) }, uLanK: { value: n3(tab[st.i].lan) },
    uDoorP: { value: new THREE.Vector4(hero.doors[0].a, hero.doors[1].a - hero.doors[0].a, hero.doors[0].hw, hero.W) }, uDoorQ: { value: new THREE.Vector4(hero.doors[0].spring, hero.a0, hero.a1, 0) },
    uFlat: { value: (sea.s1 + sea.a1) / 2 },
    // the flooded hall's far door: the middle of its opening over the sea (it stands half in the water)
    uSeaDoor: { value: new THREE.Vector3(0, SEA_Y + 2.6, -sea.a1) },
    // the last hall's end wall and its seaward wall, for the moon's law (moonAt): (the wall's near face on the
    // spine, the doorway's half breadth, the haunches' outer radius, their springing); the piers' ragged tops
    // (the landward's three from the jamb outward, then the seaward's); the haunches' reaches (landward, seaward);
    // how high each bay of the seaward wall stands
    uEndW: { value: new THREE.Vector4(P.endWall.aw, P.endWall.R, P.endWall.R2, P.endWall.spring) }, uEndTop: { value: [...P.endWall.tops[0], ...P.endWall.tops[1]] }, uEndT: { value: new THREE.Vector2(P.endWall.reach[0], P.endWall.reach[1]) },
    uCutS: { value: cutsS.map((q) => q + UP_Y) },
    // the cloud hall's fallen bays (where they begin and end, the mean height of what is left of the wall, the wall's place)
    uGap: { value: new THREE.Vector4(cl.a0 + cl.gap.i0 * cl.bay, cl.a0 + (cl.gap.i0 + 3) * cl.bay, UP_Y + (cl.gap.h[0] + cl.gap.h[1] + cl.gap.h[2]) / 3, cl.W) },
    uCrown: { value: new THREE.Vector4(cl.spring + 3, cl.W * 0.86, cl.a0 + cl.open0 * cl.bay, cl.a1) },
  };
  const mat = new THREE.ShaderMaterial({ uniforms, vertexColors: true, vertexShader: LOOK_VS, fragmentShader: LOOK_FS });
  // the image in the standing sea (drawn after the water, over it)
  const mirror = new THREE.ShaderMaterial({ uniforms, vertexColors: true, vertexShader: LOOK_VS, fragmentShader: LOOK_FS, defines: { MIRROR: 1 }, transparent: true, depthWrite: false, side: THREE.BackSide });
  const eyeFog = (x, y, zz) => { const [lo, hi, w] = P.hallMix(-zz), f = uniforms.uEyeFog.value, A = tab[lo].fog, B = tab[hi].fog; f.set(lerp(A[0], B[0], w), lerp(A[1], B[1], w), lerp(A[2], B[2], w), lerp(A[3], B[3], w)); };
  return { mat, mirror, uniforms, Z, H, tab, eyeFog };
}
// (MIRROR: the same stone drawn as its image in the standing sea. A point's image lies as far under the sea's level
// as the point stands over it; it is drawn where the line from the lens to that image meets the water, so it lies ON
// the water and whatever stands before that water hides it; it sways a little with the water, on the world clock.
// The image is shaded as the stone itself is, by the stone's own place)
const LOOK_VS = /* glsl */`
attribute vec3 aux; varying vec3 vW; varying vec3 vN; varying vec3 vC; varying vec3 vX;
#ifdef MIRROR
uniform float uSeaY; uniform float uTime;
#endif
void main() {
  vec4 p = vec4(position, 1.); vec3 n = normal;
  #ifdef USE_INSTANCING
    p = instanceMatrix * p; n = mat3(instanceMatrix) * n;
  #endif
  vec4 w = modelMatrix * p; vW = w.xyz; vN = normalize(mat3(modelMatrix) * n); vC = color;
  #ifdef USE_INSTANCING_COLOR
    vC *= instanceColor;
  #endif
  vX = aux;
  #ifdef MIRROR
    vec3 m = vec3(w.x, 2. * uSeaY - w.y, w.z); float dpt = clamp(uSeaY - m.y, 0., 3.);
    m.xz += vec2(sin(m.y * 1.9 + uTime * 1.1 + w.z * 0.7), cos(m.y * 1.6 + uTime * 0.9 + w.x * 0.7)) * 0.045 * dpt;
    vec3 e = cameraPosition; float t = clamp((e.y - uSeaY) / max(e.y - m.y, 1e-3), 0., 1.);
    vec4 cm = projectionMatrix * viewMatrix * vec4(m, 1.), cs = projectionMatrix * viewMatrix * vec4(e + (m - e) * t, 1.);
    float zs = cs.z / max(cs.w, 1e-4), zm = cm.z / max(cm.w, 1e-4); gl_Position = vec4(cm.xy, (zs + 0.02 * (zm - zs) - 0.0004) * cm.w, cm.w);
  #else
    gl_Position = projectionMatrix * viewMatrix * w;
  #endif
}`;
export const LOOK_COMMON = /* glsl */`
uniform float uTime; uniform vec3 uKey[4]; uniform vec3 uDir[4]; uniform vec3 uSky[4]; uniform vec3 uGnd[4]; uniform vec4 uFog[4]; uniform vec3 uBar[4]; uniform vec3 uGlass[4];
uniform vec3 uSun; uniform vec4 uWinA[8]; uniform vec4 uWinB[8]; uniform vec4 uWinC[8]; uniform vec4 uEyeFog; uniform float uSeaY; uniform vec4 uRuin; uniform float uCut[16]; uniform float uSnow; uniform vec3 uOut; uniform float uGlow; uniform vec4 uStorm[3]; uniform vec3 uStormF; uniform vec4 uRing; uniform float uFlat;
uniform vec4 uHall[8]; uniform vec4 uHall2[8]; uniform vec2 uJoin[8]; uniform vec4 uLZ[8]; uniform vec4 uLZ2[8];
uniform vec4 uLan; uniform vec3 uLanK; uniform vec4 uDoorP; uniform vec4 uDoorQ; uniform vec3 uSeaDoor; uniform vec4 uCrown; uniform vec4 uGap;
// the hall a point stands in: (where it begins on the spine, its half breadth, its stone's veins, its floor). A hall
// begins at the far face of the cross wall before it: that wall, its niches and its door's passage are of the hall
// we come from
vec4 hallAt(float a) { vec4 h = uHall[0]; for (int i = 1; i < 8; i++) { if (a >= uHall[i].x) h = uHall[i]; } return h; }
vec4 hall2At(float a) { vec4 h = uHall2[0]; for (int i = 1; i < 8; i++) { if (a >= uHall[i].x) h = uHall2[i]; } return h; }
// a point's share in (the windowed and lanterned halls, the sea's, the cloud's, the last hall's): what the small
// things of the house (birds, weed, dust, spray, the water) are lit by
vec4 zoneW(float a) { vec4 z = uLZ[0]; for (int i = 1; i < 8; i++) z = mix(z, uLZ[i], smoothstep(uJoin[i].x, uJoin[i].y, a)); return vec4(max(0., 1. - z.x - z.y - z.z), z.x, z.y, z.z); }
float hash3(vec3 p) { p = fract(p * 0.3183099 + .1); p *= 17.; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float vn(vec3 x) { vec3 i = floor(x), f = fract(x); f = f * f * (3. - 2. * f);
  return mix(mix(mix(hash3(i), hash3(i + vec3(1, 0, 0)), f.x), mix(hash3(i + vec3(0, 1, 0)), hash3(i + vec3(1, 1, 0)), f.x), f.y), mix(mix(hash3(i + vec3(0, 0, 1)), hash3(i + vec3(1, 0, 1)), f.x), mix(hash3(i + vec3(0, 1, 1)), hash3(i + vec3(1, 1, 1)), f.x), f.y), f.z); }
// the light that reaches p from the way d through a window of p's own vessel (the windows' own numbers)
float winAt(vec3 p, vec3 d) {
  float a = -p.z, s = 0., ok = step(0.02, d.x), dx = max(d.x, 0.02);
  for (int i = 0; i < 8; i++) {
    vec4 A = uWinA[i], B = uWinB[i], C = uWinC[i];
    float t = (B.z - p.x) / dx; vec3 h = p + d * t; float ha = -h.z;
    float inV = step(C.x, a) * step(a, C.y) * step(A.x, ha) * step(ha, A.y);
    float u = mod(ha - A.x, A.z) - 0.5 * A.z, dv = h.y - B.y, e = 0.25 + 0.012 * t;
    float box = smoothstep(A.w + e, A.w - e, abs(u)) * smoothstep(B.x - e, B.x + e, h.y);
    float cap = smoothstep(A.w + e, A.w - e, length(vec2(u, max(dv, 0.))));
    s += inV * B.w * (dv < 0. ? box : cap);
  }
  return s * ok;
}
// the day that reaches p from the way d through a sea door (the doors' own numbers: they stand at one pitch)
float doorAt(vec3 p, vec3 d) {
  float dx = max(d.x, 0.02), t = (uDoorP.w - p.x) / dx; vec3 h = p + d * t; float ha = -h.z;
  float u = mod(ha - uDoorP.x + 0.5 * uDoorP.y, uDoorP.y) - 0.5 * uDoorP.y, dv = h.y - uDoorQ.x, e = 0.2 + 0.012 * t;
  float box = smoothstep(uDoorP.z + e, uDoorP.z - e, abs(u)), cap = smoothstep(uDoorP.z + e, uDoorP.z - e, length(vec2(u, max(dv, 0.))));
  return step(0.02, d.x) * step(uDoorQ.y, ha) * step(ha, uDoorQ.z) * step(uDoorQ.y, -p.z) * step(-p.z, uDoorQ.z) * (dv < 0. ? box : cap) * smoothstep(-0.6, 0.1, h.y);
}
// the cloud hall's gold at a point: what the hour's sun brings down through the open crown (the crown's own numbers)
// where the cloud above it parts; the rifts drift on the world clock
float riftAt(vec3 p) { vec3 q = p + uSun * (max(uCrown.x - p.y, 0.) / max(uSun.y, 0.2)); float qa = -q.z;
  float open = smoothstep(uCrown.y + 1.5, uCrown.y - 1.5, abs(q.x)) * smoothstep(uCrown.z - 2., uCrown.z + 4., qa) * (1. - smoothstep(uCrown.w - 3., uCrown.w + 1., qa));
  return open * smoothstep(0.34, 0.54, vn(vec3(qa * 0.045 - uTime * 0.05, q.x * 0.05, 9.))); }
// the far storm's light at a point: by where the point stands from each of the storm's seats, the same from every eye
float stormAt(vec3 p) { float s = 0.; for (int i = 0; i < 3; i++) { vec3 d = p - uStorm[i].xyz; s += uStormF[i] / (1. + dot(d, d) / (uStorm[i].w * uStorm[i].w)); } return s; }
// (on stone a strike is a light with a source like every other: full on a face turned to its seat, a quarter on one turned away)
float stormOn(vec3 p, vec3 n) { float s = 0.; for (int i = 0; i < 3; i++) { vec3 d = uStorm[i].xyz - p; s += uStormF[i] / (1. + dot(d, d) / (uStorm[i].w * uStorm[i].w)) * (0.25 + 0.75 * clamp(dot(n, normalize(d)), 0., 1.)); } return s; }
// THE MOON'S LIGHT IN THE LAST HALL, A LAW OF PLACE (the moon stands fixed beyond the broken doorway, MOON the way
// to it: 21 degrees up, a little to the seaward hand): how much of it reaches a point: all where the straight way
// from the point to the moon passes through the doorway's opening or over the ragged tops of the end piers, none
// where a pier, a haunch of the broken arch or the seaward wall (bay by bay, as high as each bay stands) is in the
// way; the edge of a shadow is as soft as the way to the stone that throws it is long. So the moon lies down the
// hall in a lane through the doorway with the piers' long shadows on either flank and the haunches' at its edges,
// and further back, where it clears the end wall, in the stepped shadow of the seaward wall. The same from every
// eye at every moment; a point beyond the end wall has all of it
const vec3 MOON = vec3(${MOON_DIR.map((q) => q.toFixed(4)).join(', ')});
uniform vec4 uEndW; uniform float uEndTop[6]; uniform vec2 uEndT; uniform float uCutS[16];
float moonAt(vec3 p) {
  float d = uEndW.x + p.z; if (d < 0.) return 1.;
  float t = d / -MOON.z, W = uRuin.x; vec2 h = vec2(p.x + MOON.x * t, p.y + MOON.y * t);
  if (h.x > W) { float ts = (W - p.x) / MOON.x, as = -p.z - MOON.z * ts, sf = 0.25 + 0.012 * ts; int ci = int(clamp(floor((as - uRuin.z) / uRuin.w), 0., 15.)); return smoothstep(-sf, sf, p.y + MOON.y * ts - uCutS[ci]); }
  float soft = 0.25 + 0.012 * t, ax = abs(h.x), R = uEndW.y; int ti = int(clamp(floor((ax - R) / ((W - R) / 3.)), 0., 2.)) + (h.x > 0. ? 3 : 0);
  float open = smoothstep(-soft, soft, R - ax), over = smoothstep(-soft, soft, h.y - uEndTop[ti]);
  vec2 q = vec2(ax, h.y - uEndW.w); float rho = length(q), ang = atan(q.y, max(q.x, 1e-3)), te = h.x > 0. ? uEndT.y : uEndT.x, sa = soft / max(rho, 1.);
  float hn = smoothstep(-soft, soft, rho - R) * smoothstep(-soft, soft, uEndW.z - rho) * smoothstep(-sa, sa, ang) * (1. - smoothstep(-sa, sa, ang - te));
  return max(open, over) * (1. - hn);
}
float overcast(float a, float t) { return 0.6 * sin(a * 0.11 - t * 0.9) + 0.4 * sin(a * 0.047 + t * 0.55 + 1.3); }
// the water's net of light on stone: bright threads round dark cells some 3 m across, slowly working (a standing
// law of the water, on the world clock; one net for every hall the sea stands in: the great stair's hall and the
// hall of the sea doors read it as it is, the flooded hall 1.45 times finer and 1.25 times quicker)
// (netR: how near a point lies to a thread of the net, 1 on the thread; net: the threads as the great stair's
// hall and the hall of the sea doors wear them)
float netR(vec3 p, float t) {
  vec2 q = vec2(p.x + p.y * 0.62, p.z + p.y * 0.48) * 0.6; q += 0.5 * vec2(sin(q.y * 1.3 + t * 0.21), sin(q.x * 1.1 - t * 0.17));
  float c = sin(q.x * 2.1 + sin(q.y * 1.7 + t * 0.26) * 1.3) + sin(q.y * 2.3 + sin(q.x * 1.9 - t * 0.22) * 1.2) + sin((q.x - q.y) * 1.5 + t * 0.19);
  return clamp(1. - abs(c / 3.), 0., 1.);
}
float net(vec3 p, float t) { float k = smoothstep(0.5, 1., netR(p, t)); return k * k * k * 0.8; }
`;
const LOOK_FS = LOOK_COMMON + /* glsl */`
uniform vec3 uLKey[8]; uniform vec3 uLDir[8]; uniform vec3 uLSky[8]; uniform vec3 uLGnd[8]; uniform vec4 uLFog[8]; uniform vec3 uLBar[8]; uniform vec3 uLGlass[8]; uniform vec3 uLWall[8];
varying vec3 vW; varying vec3 vN; varying vec3 vC; varying vec3 vX;
void main() {
  vec3 n = normalize(vN); float a = -vW.z, kind = vX.x;
  vec3 toEye = cameraPosition - vW; float dist = length(toEye); vec3 E = toEye / max(dist, 1e-3);
  // the hall's light, air and stone; they give way to the next hall's inside the wall between the two
  vec3 key = uLKey[0], Ld = uLDir[0], sky = uLSky[0], gnd = uLGnd[0], bar = uLBar[0], glass = uLGlass[0], wallC = uLWall[0]; vec4 fog = uLFog[0], z = uLZ[0], z2 = uLZ2[0];
  for (int i = 1; i < 8; i++) { float w = smoothstep(uJoin[i].x, uJoin[i].y, a); key = mix(key, uLKey[i], w); Ld = mix(Ld, uLDir[i], w); sky = mix(sky, uLSky[i], w); gnd = mix(gnd, uLGnd[i], w); bar = mix(bar, uLBar[i], w); glass = mix(glass, uLGlass[i], w); wallC = mix(wallC, uLWall[i], w); fog = mix(fog, uLFog[i], w); z = mix(z, uLZ[i], w); z2 = mix(z2, uLZ2[i], w); }
  // shares: the sea's hall, the cloud's, the last; the wet pavement of the sea doors; the lantern; the windows' sun;
  // the tide's mark by the sea's level
  float zs = z.x, zc = z.y, zr = z.z, wetH = z.w, lanH = z2.x, winH = z2.y, zm = z2.z;
  // THE SEA'S LIGHT BY HEIGHT (the flooded hall; the constants' own words say the law): the water's green is full
  // at the waterline and falls with a point's height over the sea; what is left higher up is weaker and grey
  float hs0 = max(vW.y - uSeaY, 0.), wgr = exp(-hs0 * ${(Math.log(3) / SEA_GREEN).toFixed(4)});
  key = mix(key, mix(dot(key, vec3(0.3333)) * vec3(${SEA_GREY.map((q) => q.toFixed(2)).join(', ')}) * exp(-hs0 * ${(Math.log(2) / SEA_DIM).toFixed(4)}), key * 1.3, wgr), zs); gnd = mix(gnd, mix(dot(gnd, vec3(0.3333)) * vec3(${SEA_GREY.map((q) => (q * 2.2).toFixed(2)).join(', ')}), gnd, wgr), zs);
  vec4 hl = hallAt(a), h2 = hall2At(a); float mk = hl.z, hW = hl.y, fk = hl.w;
  float n1 = vn(vW * 0.55), n2 = vn(vec3(vW.x * 2.3, vW.y * 0.2, vW.z * 2.3)), n3 = vn(vW * 1.7);
  // the stone, in the world's own metres (so no face stretches it and no edge shows a seam): a broad cloud, two sets
  // of veins bent by the cloud, a fine grain near the lens
  float cl = vn(vW * 0.16 + 11.3), g9 = vn(vW * 9.), grain = (g9 - .5) * smoothstep(34., 5., dist);
  float v1 = abs(fract(dot(vW, vec3(0.17, 0.1, 0.14)) + n1 * 0.3 + cl * 0.55) - .5) * 2., v2 = abs(fract(dot(vW, vec3(-0.3, 0.24, 0.37)) + n1 * 0.22 + cl * 0.4) - .5) * 2.;
  float vein = max(smoothstep(0.2, 0.0, v1) * (0.3 + 0.7 * cl) * smoothstep(0.3, 0.55, n3 * 0.5 + n1 * 0.5), smoothstep(0.1, 0.0, v2) * 0.5 * smoothstep(0.4, 0.62, n1));
  vec3 mVein = mk < 0.5 ? vec3(0.47, 0.5, 0.55) : mk < 1.5 ? vec3(0.62, 0.42, 0.24) : mk < 2.5 ? vec3(0.25, 0.43, 0.35) : vec3(0.4, 0.45, 0.57);
  // the hall's own stone (walls, piers, vault, flags): darker than the figures and of the hall's colour
  vec3 stone = mix(wallC * (0.66 + 0.22 * cl + 0.1 * (n1 - .5)), mVein * wallC, vein * 0.5) * (1. + 0.2 * grain);
  vec3 alb = vC; float chk = 0., pool = 0., polish = 0., wetRim = 0., flagK = 1.; vec3 flagN = vec3(0.);
  bool pave = kind > 0.5 && kind < 1.5, pane = kind > 1.5 && kind < 2.5, vault = kind > 2.5 && kind < 3.5, outer = kind > 3.5 && kind < 4.5, carved = kind > 4.5 && kind < 5.5, cloudsea = kind > 5.5 && kind < 6.5, farhall = kind > 6.5;
  // what a carved piece is made of: a figure of white marble, of dark bronze or of black stone (by the tint the
  // piece itself was given), a fallen piece of the hall's own stone (2), a thing in its own colour (3: sticks, weed)
  float own = carved ? vX.y : 0.; bool fig = carved && own < 1.5, bronze = fig && vC.b < vC.r * 0.62, black = fig && vC.b > vC.r * 1.12;
  float lvl = min(min(abs(vW.y), abs(vW.y - uSeaY + 5.)), abs(vW.y - 18.));
  if (pave) {
    if (fk < 0.5) {
      // the first hall's pavement: squares of honey marble and of slate, polished (in this hall only)
      vec2 sl = vW.xz / 3.2, ci = floor(sl), e = abs(fract(sl) - .5); float joint = smoothstep(0.47, 0.492, max(e.x, e.y));
      chk = mod(ci.x + ci.y, 2.); polish = 0.6 + 1.3 * chk;
      vec3 dk = mix(vec3(0.115, 0.1, 0.1) * (0.6 + 0.8 * cl), vec3(0.5, 0.42, 0.34), vein * 0.55);
      alb = mix(alb * stone * 1.5, dk, chk) * (1. - 0.45 * joint);
    } else if (fk < 1.5 || fk > 3.5) {
      // plain worn flags of the hall's stone, 2.4 by 1.6 m in running bond, each a shade of its own, worn pale and
      // smooth along the middle of the way
      vec2 q = vW.xz / vec2(2.4, 1.6); q.x += 0.5 * mod(floor(q.y), 2.); vec2 ci = floor(q), e = abs(fract(q) - .5);
      float joint = smoothstep(0.455, 0.49, max(e.x, e.y)), wear = smoothstep(6., 1.5, abs(vW.x)) * (0.5 + 0.5 * n1);
      alb = alb * stone * (0.95 + 0.4 * hash3(vec3(ci, 3.))) * (1. + 0.22 * wear) * (1. - 0.5 * joint); polish = 0.25 * wear;
      if (fk > 3.5) {
        // the last hall lies open: sand has drifted along the feet of its walls with weeds standing in the drift,
        // and rain stands in the hollows of the worn flags
        float drift = smoothstep(hW - 3.4 - 2.6 * n1, hW - 0.3, abs(vW.x));
        alb = mix(alb, vec3(0.46, 0.37, 0.25) * (0.8 + 0.4 * n3), drift * 0.9);
        alb = mix(alb, vec3(0.2, 0.28, 0.11), drift * smoothstep(0.58, 0.7, vn(vW * 1.4 + 3.)) * 0.8);
        // A POOL'S LAW: rain stands where the pavement lies lowest: in its broad hollows (a slow rise and fall of the
        // whole floor), and in them flag by flag, for every flag has settled a little higher or lower than its
        // neighbours and a little aslant, and the joints lie lowest of all. So a pool's outline runs along the edges
        // of flags and aslant across them, never in a round; about it the stone is wet and dark (the rim) and takes
        // no image; the water itself gives back what stands over it (below, with the mirror's law)
        // (the broad hollow is read at the flag's own middle: within a flag the water's edge is the straight line of
        // the flag's tilt, so no pool, however small, is a round)
        vec2 fc = vec2((ci.x + .5 - .5 * mod(ci.y, 2.)) * 2.4, (ci.y + .5) * 1.6);
        float hol = vn(vec3(fc * 0.16, 5.)) * 0.8 + 0.1 + (n1 - .5) * 0.02, lie = hol - (hash3(vec3(ci, 11.)) - .5) * 0.085 - dot(fract(q) - .5, vec2(hash3(vec3(ci, 12.)) - .5, hash3(vec3(ci, 13.)) - .5)) * 0.07 + 0.02 * joint;
        float dry = (1. - drift) * (1. - uSnow);
        pool = zr * smoothstep(0.676, 0.684, lie) * dry; wetRim = zr * smoothstep(0.636, 0.676, lie) * dry * (1. - pool);
        alb *= (1. - 0.45 * pool) * (1. - 0.34 * wetRim);
        // (the flag's own lie, for what it mirrors: a dry flag is a dull, uneven mirror, each aslant its own way)
        // (UNDER LYING SNOW, a rare visit, no flag and no joint shows: the sheet is one even dull mirror, as dull as
        // the mean flag, and lies level)
        flagN = vec3(hash3(vec3(ci, 12.)) - .5, 0., hash3(vec3(ci, 13.)) - .5) * 0.06 * (1. - uSnow); flagK = mix((0.35 + 0.65 * hash3(vec3(ci, 14.))) * (1. - joint), 0.675, uSnow);
      }
    } else if (fk < 2.5) {
      // the cloud hall's slabs: 4.8 m square, peach marble boldly veined with a dark rose, a fine joint
      // (p1m1) EVERY SLAB IS A STONE OF ITS OWN, at its own size: its veins are its own (the two sets are shifted
      // slab by slab, and in one slab of two they run the other way, so no vein runs on through a joint into the
      // next slab: the pavement is laid of slabs, it is not one veined sheet with a grid drawn on it), and each slab
      // has a shade of its own
      // (THE JOINT IS DRAWN AS WIDE AS ITS SIZE IN THE PICTURE ALLOWS, the ashlar joint's own law of the eye: near, it
      // is the fine joint it was, 5 cm dark and soft to 17 cm; far down the hall, where a joint that lies across the
      // sight is thinner than the picture's grain, it widens to that grain and pales, and is one faint line: it
      // never breaks into dashes)
      vec2 sl = vW.xz / 4.8, ci = floor(sl), e = abs(fract(sl) - .5), jm = (0.5 - e) * 4.8, jf = vec2(fwidth(vW.x), fwidth(vW.z)) + 0.004; float jd = max(e.x, e.y);
      float joint = max((1. - smoothstep(0.024, 0.086 + jf.x, jm.x)) * clamp(0.14 / jf.x, 0., 1.), (1. - smoothstep(0.024, 0.086 + jf.y, jm.y)) * clamp(0.14 / jf.y, 0., 1.));
      vec3 pv = vec3(vW.x * (step(0.5, hash3(vec3(ci, 33.))) * 2. - 1.), vW.y, vW.z);
      float w1 = abs(fract(dot(pv, vec3(0.17, 0.1, 0.14)) + n1 * 0.3 + cl * 0.55 + hash3(vec3(ci, 31.))) - .5) * 2., w2 = abs(fract(dot(pv, vec3(-0.3, 0.24, 0.37)) + n1 * 0.22 + cl * 0.4 + hash3(vec3(ci, 32.))) - .5) * 2.;
      float bold = max(smoothstep(0.34, 0.0, w1) * (0.4 + 0.6 * cl), smoothstep(0.22, 0.0, w2) * 0.8);
      alb = alb * 1.12 * mix(vec3(0.98, 0.69, 0.5) * (0.78 + 0.26 * cl), vec3(0.4, 0.24, 0.27), bold * 0.7) * (0.94 + 0.12 * hash3(vec3(ci, 34.))) * (1. - 0.5 * joint); polish = 0.9;
      // CLOUD-DAMP IN THE JOINTS AND DUST AT THE FALLEN WALL'S FOOT (p1m1), by place: where the landward wall has
      // fallen the cloud comes in over the stumps and lies on the pavement. The joints there stand dark with damp,
      // and the damp creeps from a joint into the slab's edge (to half a metre, unevenly, by the stone): strongest at
      // the fallen wall's foot, thinner across the hall (gone 22 m from that wall) and along it (gone 9 m before and
      // after the fallen bays). Against the stumps' foot, in the fallen bays' own stretch, grit of the broken wall
      // has drifted over the first metre or two: pale, dull, no mirror
      { float dw = vW.x + uGap.w, lay = smoothstep(uGap.x - 9., uGap.x + 1., a) * (1. - smoothstep(uGap.y - 1., uGap.y + 9., a)) * (1. - smoothstep(0., 22., dw));
        float cw = 0.02 + 0.1 * lay * (0.35 + 0.65 * n1), damp = lay * smoothstep(0.5 - cw - 0.02, 0.5 - cw * 0.3, jd) * (0.55 + 0.45 * n3);
        alb *= 1. - 0.4 * damp; polish += 0.5 * damp;
        float grit = smoothstep(uGap.x - 1.5, uGap.x + 0.5, a) * (1. - smoothstep(uGap.y - 0.5, uGap.y + 1.5, a)) * (1. - smoothstep(0.2 + 1.6 * n1, 1.4 + 2.2 * n1, dw));
        alb = mix(alb, vec3(0.62, 0.52, 0.42) * (0.85 + 0.3 * n3), grit * 0.8); polish *= 1. - grit; }
    } else {
      // the pavement of the sea doors: dark slate slabs under a skin of water (it mirrors the day: below)
      vec2 sl = vW.xz / 3.6, ci = floor(sl), e = abs(fract(sl) - .5); float joint = smoothstep(0.47, 0.492, max(e.x, e.y));
      alb = alb * vec3(0.3, 0.35, 0.42) * (0.7 + 0.5 * cl) * (1. - 0.35 * joint); polish = 2.;
      // A WET FLOOR'S LAW (p1): every slab has settled a little higher or lower than its neighbours and a little
      // aslant. The sea's film stands on the low slabs, and on more of them toward the doors (the seaward hand); the
      // high slabs have run dry: paler, and dull mirrors. THE SHARES AS THE LAW BELOW GIVES THEM (a slab's hash
      // taken as even): from the landward wall to 6 m landward of the axis 48 slabs in a hundred are wholly dry and
      // 62 dry in some part; on the axis 34 and 48; 3 m seaward of it 20 and 34; 6.6 m seaward of it 5 are still
      // wholly dry and from 8.0 m none is, and over the last 3 m before the doors' wall 7 in a hundred are still dry
      // in part (to a half at the most). A joint breaks the image (flagK: how much of a mirror the place is; flagN: the slab's own lie)
      float high = hash3(vec3(ci, 21.)) - 0.55 * smoothstep(-6., 12., vW.x), dryS = smoothstep(0.38, 0.52, high);
      flagK = (1. - 0.72 * dryS) * (1. - 0.6 * joint); flagN = vec3(hash3(vec3(ci, 22.)) - .5, 0., hash3(vec3(ci, 23.)) - .5) * 0.035;
      alb *= 1. + 0.28 * dryS;
    }
  } else if (fig) {
    // the figures: white marble, faintly clouded and veined; or bronze gone green in its hollows; or black stone
    if (bronze) alb = mix(vC * (0.85 + 0.4 * cl), vec3(0.2, 0.42, 0.34) * (vC.r * 2.6), smoothstep(0.42, 0.7, n1 * 0.5 + n3 * 0.5) * (0.35 + 0.45 * clamp(n.y + 0.3, 0., 1.)));
    else if (black) alb = mix(vC * (0.85 + 0.35 * cl), vec3(0.42, 0.44, 0.5) * (vC.b * 4.), vein * 0.4);
    else { alb = vC * 1.44 * vec3(1.0, 0.99, 0.965) * (0.93 + 0.09 * cl) * (1. - 0.16 * vein); alb *= 1. - 0.12 * smoothstep(0.5, 0.85, n2) * (1. - abs(n.y)); alb = mix(alb, vec3(0.3, 0.36, 0.2), smoothstep(0.55, 0.9, n.y) * smoothstep(0.6, 0.76, n1) * 0.3); }
  } else if (own > 2.5) { alb = vC * (0.9 + 0.3 * n3);
  } else {
    alb *= stone * 1.15;
    // weather by place: dark runs down upright faces, moss and lime on ledges and on whatever looks up
    float upr = 1. - abs(n.y), led = smoothstep(0.55, 0.9, n.y);
    alb *= 1. - mix(0.07, 0.3, clamp(zm + wetH, 0., 1.)) * smoothstep(0.5, 0.85, n2) * upr * (0.35 + 0.65 * cl);
    // ashlar: courses 0.9 m high of stones 2.1 m long in running bond, in the world's own metres on whichever upright
    // plane a face lies in; a fine dark joint, each stone a shade of its own. The joint is drawn as wide as it stands
    // in the picture allows (the grain's law: fine detail fades with its size in the picture)
    if (!carved && !vault) {
      vec3 an = abs(n); float uu = an.x > an.z ? vW.z : vW.x, cy = vW.y / ${ASHLAR.h.toFixed(1)}, row = floor(cy), cu = uu / ${ASHLAR.l.toFixed(1)} + 0.5 * mod(row, 2.);
      float dy = (0.5 - abs(fract(cy) - .5)) * ${ASHLAR.h.toFixed(1)}, du = (0.5 - abs(fract(cu) - .5)) * ${ASHLAR.l.toFixed(1)}, fy = fwidth(vW.y) + 0.004, fu = fwidth(uu) + 0.004;
      float jt = max((1. - smoothstep(0.012, 0.012 + fy, dy)) * clamp(0.034 / fy, 0., 1.), (1. - smoothstep(0.012, 0.012 + fu, du)) * clamp(0.034 / fu, 0., 1.)) * (1. - smoothstep(0.6, 0.8, an.y));
      alb *= (0.94 + 0.12 * hash3(vec3(row, floor(cu), an.x > an.z ? 3. : 7.))) * (1. - 0.36 * jt);
    }
    alb = mix(alb, vec3(0.27, 0.33, 0.17), led * smoothstep(0.56, 0.74, n1) * 0.55);
    alb = mix(alb, vec3(0.9, 0.9, 0.86), led * smoothstep(0.66, 0.72, n3) * 0.5);
  }
  // the vaults: ONE is coffered (the nave's: deep and dark, the ribs between in the light); the hall of the sea
  // doors has a rib across at every pier; the others are plain courses of stone
  if (vault) {
    if (h2.x > 0.5 && h2.x < 1.5) { vec2 cf = abs(fract(vX.yz / vec2(3.2, 3.4)) - .5); float cm = max(cf.x, cf.y); alb *= mix(0.2 + 0.22 * smoothstep(0.08, 0.3, cm), 1.06, smoothstep(0.3, 0.37, cm)); }
    else { float crs = smoothstep(0.44, 0.49, abs(fract(vX.z / 1.7) - .5)); alb *= 1. - 0.22 * crs;
      if (h2.x > 1.5 && h2.x < 2.5) { float dr = (0.5 - abs(fract((a - h2.z) / h2.y) - .5)) * h2.y; alb *= mix(1.12, 0.62 + 0.3 * smoothstep(0.7, 1.5, dr), smoothstep(0.62, 0.7, dr)); } }
  }
  // the tide's mark: wet stone below it, weed and shells to it (the halls the sea stands in by the sea's level, the
  // hall of the sea doors by its pavement); the figures that stand in the water wear it like the walls
  float tide = zm * (1. - smoothstep(uSeaY + 0.5, uSeaY + 2.0 + 1.4 * n1, vW.y)) + wetH * (1. - smoothstep(0.9, 3.2 + 1.6 * n1, vW.y));
  float weed = (zm * (1. - smoothstep(uSeaY + 1.0, uSeaY + 2.6 + 1.6 * n2, vW.y)) + wetH * (1. - smoothstep(0.3, 2.2 + 2.6 * n2, vW.y))) * smoothstep(0.3, 0.72, n1 * 0.55 + n3 * 0.45 + 0.08);
  if (!pave) alb = mix(alb, vec3(0.2, 0.33, 0.15) * (0.7 + 0.6 * n2), weed * 0.72);
  alb *= 1. - 0.42 * tide;
  // shells in a band at the tide's mark
  float bar2 = zm * smoothstep(1.3, 0.2, abs(vW.y - uSeaY - 1.4 - 1.2 * n1)) + wetH * smoothstep(1.2, 0.2, abs(vW.y - 1.6 - 1.2 * n1));
  // (small, in clusters, and no whiter than wet shell: they speckle the band, they do not tile it)
  if (!pave) alb = mix(alb, vec3(0.7, 0.67, 0.58), bar2 * smoothstep(0.58, 0.7, g9) * (0.3 + 0.7 * smoothstep(0.35, 0.65, n2)) * 0.62);
  // the last hall's low sun reaches a point only over the broken wall of the evening hand
  float tr = (vW.x + uRuin.x) / 0.97, ar = a + tr * 0.12; int ci2 = int(clamp(floor((ar - uRuin.z) / uRuin.w), 0., 15.));
  float sunR = smoothstep(-1.0, 1.4, vW.y + (vW.x + uRuin.x) * uRuin.y - uCut[ci2]);
  // THE SOURCE. The windowed halls: the high windows of the seaward hand; the flooded hall: the water under it; the
  // great stair: its lantern (the way to it from where the point stands, weaker with the distance); the sea doors:
  // the sea's glare, level, from the seaward hand; the cloud hall: its open crown (the way to the crown's middle
  // line); the last hall: its low sun, shadowed by the broken wall
  vec3 toL = uLan.xyz - vW; float dl = max(length(toL), 1.); toL /= dl;
  vec2 rl = vW.xz - uLan.xz; rl.x += step(abs(rl.x) + abs(rl.y), 1e-3) * 0.01; float rr = length(rl) / max(uLan.y - vW.y, 4.);
  vec3 L = normalize(mix(Ld, toL, lanH));
  // (the water lights from below and round about: an upright face of the flooded hall has a third of it)
  float kd = mix(clamp(dot(n, L) * 0.9 + 0.1, 0., 1.), clamp(0.34 - 0.66 * n.y, 0., 1.), zs) * mix(1., sunR, zr);
  // the lantern lights what stands under it and the walls about it: its light is spent three times as far out from
  // its axis as down from it (the walls are lit to their cornice; the cove over them stands in shade)
  // (the shade of passing cloud: light on the daylight of the windowed halls and on the last hall's gold, deep in
  // the cloud hall, whose open crown stands IN the cloud: its pearl goes and comes as the cloud passes over)
  key *= (1. + 0.18 * (winH + 0.8 * zr) * overcast(a, uTime) + 0.3 * zc * (overcast(a, uTime) - 0.8)) * mix(1., (1. - smoothstep(0.8, 3.0, rr)) * clamp(1.75 - dl / 70., 0.4, 1.25), lanH);
  // the flooded hall darkens upward from the sea: its vault stands dark and grey, the water's net faint on it
  // (below)
  float deep = mix(1., 0.3 + 0.7 * exp(-max(vW.y - uSeaY, 0.) / 13.), zs);
  // the dark of hollows, by place: where wall meets pavement, and inside a niche or a reveal (stone that stands
  // behind the hall's own wall face): the niche's back is in shade, the figure before it in the light
  float ao = 1.;
  if (pave) ao *= 1. - 0.45 * exp(-max(hW - abs(vW.x), 0.) / 1.2) * step(abs(vW.x), hW + 0.1);
  else { ao *= 1. - 0.42 * exp(-lvl / 0.9) * (1. - abs(n.y)); ao *= 1. - (carved ? 0.06 : 0.8) * smoothstep(0.0, 0.9, abs(vW.x) - hW) * (1. - smoothstep(4., 8., abs(vW.x) - hW)) * (1. - 0.4 * smoothstep(0.55, 0.9, n.y)) * (1. - 0.6 * zr); }
  vec3 lit = (key * kd + mix(gnd, sky, n.y * .5 + .5) * deep) * ao;
  // THE FLOODED HALL'S STAIR IS NOT BLACK (p1m1): the water lights from below, so a face that looks up has nothing of
  // it directly (kd, above); but the walls and the vault over the stair stand in that light and throw it back down.
  // A tread or a landing of that hall (its pavement) has SEA_TREAD of the water's light at its place: less than the
  // upright face beside it has (0.34), and by the same height over the sea. Where the stair goes under, the light
  // goes with the depth: a third is left SEA_TREAD_DEEP m down, so the first tread under the water is not a black
  // bar at the sea's edge, and nothing of it is left on the flat 5 m down
  if (pave) lit += zs * exp(-max(uSeaY - vW.y, 0.) * ${(Math.log(3) / SEA_TREAD_DEEP).toFixed(4)}) * key * ${SEA_TREAD.toFixed(2)} * clamp(n.y, 0., 1.) * ao;
  // what the lit wall of the landward hand throws back across the hall (the windowed halls and the sea doors')
  lit += key * vec3(0.11, 0.09, 0.065) * clamp(dot(n, vec3(-0.85, 0.1, 0.4)), 0., 1.) * (winH + 0.7 * wetH) * ao;
  // the flooded hall's far end stands in the white daylight that comes through its half-flooded door from the stair
  // (by the distance from the door itself: strongest on the stone about the door, a half SEA_DOOR m from it, on
  // every face a little and on a face turned to the door in full)
  { vec3 td = uSeaDoor - vW; float dd = dot(td, td); lit += zs * uLanK * 0.8 / (1. + dd * ${(1 / (SEA_DOOR * SEA_DOOR)).toFixed(6)}) * (0.3 + 0.7 * clamp(dot(n, td * inversesqrt(max(dd, 1.))), 0., 1.)) * ao; }
  // the sun in bars through the windows (the first hall gold; the flooded hall's windows give the sea's green)
  float sun = winAt(vW, uSun) * clamp(dot(n, uSun) * 0.9 + 0.1, 0., 1.) * (0.56 + 0.44 * overcast(a, uTime));
  lit += bar * sun * (0.35 + 0.65 * ao) * (1. - zc);
  // what the barred pavement throws back up under a lintel, a course or a niche's head (the vault's coffers stay dark)
  if (!vault) lit += bar * 0.085 * clamp(-n.y, 0., 1.) * ao * (winH + zs);
  // THE LANTERN'S WHEEL: twelve spokes of light, one from each window of the ring, widening down the hall from the
  // lantern's axis (a standing figure of the lantern: by where a point stands from the axis and how far below it).
  // A spoke lies on whatever stone stands in its plane: the treads, the terrace, and up the walls it meets, full to
  // about a third of their height and gone under the cornice
  if (lanH > 0.01) {
    float spoke = smoothstep(0.25, 0.8, cos(atan(rl.y, rl.x) * 12.) * .5 + .5) * smoothstep(0.08, 0.2, rr) * (1. - smoothstep(1.1, 2.4, rr));
    lit += lanH * uLanK * 1.7 * spoke * clamp(dot(n, toL), 0., 1.) * ao;
  }
  // THE SEA DOORS' GLARE: the day lies in through each door in a fan across the wet pavement and up the feet of the
  // landward wall
  if (wetH > 0.01) { vec3 gd = vec3(0.951, 0.309, 0.); lit += wetH * glass * 0.8 * doorAt(vW, gd) * clamp(dot(n, gd) * 0.9 + 0.1, 0., 1.) * ao; }
  // THE CLOUD HALL'S GOLD: the hour's sun comes down through the open crown where the cloud above it parts (the
  // rifts drift on the world clock): on the upper tiers of the landward wall and whatever stands in its way
  if (zc > 0.01) {
    lit += zc * bar * 0.9 * riftAt(vW) * clamp(dot(n, uSun) * 0.9 + 0.1, 0., 1.) * (0.4 + 0.6 * ao);
    // and WHERE ITS LANDWARD WALL HAS FALLEN the low sun of the evening that stands beyond it (the last hall's own)
    // comes in over what is left of the wall: across the pavement and onto the seaward wall and its figures
    vec3 Dr = uDir[3]; vec3 hg = vW + Dr * ((vW.x + uGap.w) / max(-Dr.x, 0.2)); float ag = -hg.z;
    float gapL = smoothstep(uGap.x - 0.6, uGap.x + 0.6, ag) * (1. - smoothstep(uGap.y - 0.6, uGap.y + 0.6, ag)) * smoothstep(uGap.z - 0.4, uGap.z + 1.0, hg.y) * step(-uGap.w - 0.5, vW.x);
    lit += zc * uKey[3] * 0.85 * gapL * clamp(dot(n, Dr) * 0.9 + 0.1, 0., 1.) * (0.4 + 0.6 * ao);
  }
  float storm = stormAt(vW) * zc; lit += vec3(0.6, 0.68, 0.95) * stormOn(vW, n) * zc * 0.34;
  vec3 tr2 = uRing.xyz - vW; float rd = length(tr2); lit += vec3(0.8, 0.9, 1.1) * uRing.w * (1. + 0.16 * sin(uTime * 1.9) * sin(uTime * 0.83)) * clamp(dot(n, tr2 / max(rd, 0.1)) * 0.8 + 0.2, 0., 1.) / (1. + rd * rd / 140.);
  // THE MOON'S LIGHT on the last hall's stone (moonAt: the law of place): cool, on every face by how far it is turned
  // to the moon; thin cloud passes before the moon on the world clock, so its light on the flags goes and comes in
  // slow drifting patches (the passing cloud's habit, as on the daylight of the other halls)
  float moon = 0.;
  if (zr > 0.01) { moon = zr * moonAt(vW) * (0.42 + 0.58 * smoothstep(0.32, 0.68, vn(vec3(vW.xz * 0.075 + vec2(uTime * 0.2, -uTime * 0.07), 5.))));
    lit += vec3(${MOON_LIGHT.map((q) => q.toFixed(3)).join(', ')}) * moon * clamp(dot(n, MOON) * 0.9 + 0.1, 0., 1.) * (0.4 + 0.6 * ao); }
  // THE WATER'S NET: wherever the sea stands or runs its light works on the stone above it as a slow net: green in
  // the flooded hall on the walls, the undersides and the figures, strong by the water and fainter with the height
  // to the vault (the upper tiers and the vault stand in a greyer stone under it); on the low walls of the
  // great stair; blue-white in the hall of the sea doors. One shared factor (WATER_LIGHT) for the net in every
  // such hall, each hall's own strength beside it (the great stair's standing green below is no net and stands apart)
  float nt = net(vW, uTime), dn = 0.35 + 0.65 * clamp(0.7 - n.y * .6, 0., 1.);
  // (the flooded hall's net, by the height over the sea: fine bright threads at the waterline, broad and soft
  // higher, a third as strong SEA_NET m up and faint on the vault; it lies in patches that drift, never as one even mesh)
  float nsoft = clamp(hs0 / ${SEA_CROWN.toFixed(1)}, 0., 1.), nks = smoothstep(mix(0.52, 0.18, nsoft), 1., netR(vW * 1.45, uTime * 1.25)); nks = nks * nks * mix(1., 0.55, nsoft);
  float nsea = nks * exp(-hs0 * ${(Math.log(3) / SEA_NET).toFixed(4)}) * (0.45 + 0.55 * vn(vec3(vW.xz * 0.19 + vec2(uTime * 0.03, 0.), vW.y * 0.12 + uTime * 0.05)));
  // (in the great stair's hall the sea also gives the stone that stands near over it a standing green from below
  // and beside, whatever way the stone looks from the lantern: the foot of the stair and its cheeks are not black)
  lit += lanH * zm * vec3(0.3, 0.52, 0.44) * 0.5 * exp(-hs0 / 5.) * (0.5 + 0.5 * clamp(0.6 - n.y, 0., 1.));
  lit += (lanH * zm * vec3(0.62, 1.0, 0.86) * exp(-hs0 / 9.) * 1.4 + wetH * glass * 0.3 * exp(-max(vW.y, 0.) / 11.)) * nt * dn * ${WATER_LIGHT.toFixed(2)};
  lit += zs * vec3(0.42, 1.0, 0.7) * ${SEA_NET_K.toFixed(1)} * nsea * dn * ${WATER_LIGHT.toFixed(2)};
  float snow = uSnow * zr * smoothstep(0.35, 0.8, n.y + 0.25 * n3);
  alb = mix(alb, vec3(0.86, 0.9, 0.97), snow);
  vec3 col = alb * lit;
  float sp = clamp(dot(reflect(-L, n), E), 0., 1.); sp *= sp; sp *= sp; sp *= sp;
  float shine = bronze || black ? 0.5 : 0.04;
  col += key * sp * sp * (0.6 * tide + shine) * mix(1., sunR, zr);
  if (bronze || black) { float rim = 1. - clamp(dot(n, E), 0., 1.); col += (sky * 1.6 + key * 0.3) * rim * rim * rim * 0.7; }
  // (the stone that is turned to the moon takes a rim of its light where its face runs away from the eye: a glint,
  // by the mirror's law; never on the pavement, which has its own)
  if (moon > 0.01 && !pave) { float rm2 = 1. - clamp(dot(n, E), 0., 1.); col += vec3(${MOON_LIGHT.map((q) => q.toFixed(3)).join(', ')}) * moon * rm2 * rm2 * rm2 * clamp(dot(n, MOON) + 0.35, 0., 1.) * 0.55; }
  if (pave) {
    vec3 r = reflect(-E, normalize(n + vec3(n3 - .5, 0., g9 - .5) * (0.22 + 0.4 * (wetH + zs)) * (1. - 0.85 * step(2.5, fk) * step(fk, 3.5)))); float fr = 1. - clamp(E.y, 0., 1.); fr = 0.05 + 0.55 * fr * fr * fr; fr *= 1. + 0.8 * zs + polish;
    float wr = winAt(vW, r); col += glass * 0.3 * min(fr, 0.9) * wr * (0.5 + 0.5 * n1);
    col = mix(col, mix(key * 0.42 + sky * 1.2, sky * 1.5 + key * 0.1, zr), min(fr, 0.85) * 0.55 * (0.4 + 0.6 * wetH));
    // THE WET MIRROR of the sea doors' pavement: it gives back the day that stands in each door, and the dark of
    // the vault between; a skin of water works on it (the world clock). BY THE WET FLOOR'S LAW (p1): the image is
    // broken slab by slab (each slab's own lie throws it a little aside, a dry slab gives back a quarter of it, a
    // joint less than half); the film ripples, hardly at the landward wall and three times as much by the doors,
    // where the sea comes in, so a door's image there is torn across; the image has THE COLOUR OF THE DOOR'S SKY
    // (the pale of the horizon only where the thrown sight leaves the door low, the blue over it from 15 degrees
    // up), never white; and the door's image fades with the angle faster than the vault's dark does (a third of
    // it is left where the eye looks down at 45 degrees, none straight down)
    if (fk > 2.5 && fk < 3.5) {
      float nearD = smoothstep(-6., 12., vW.x), rs = mix(0.7, 1.6, nearD);
      vec3 nm = normalize(n + flagN + vec3(vn(vec3(vW.xz * rs, uTime * 0.35)) - .5, 0., vn(vec3(vW.zx * rs + 4., uTime * 0.3)) - .5) * mix(0.06, 0.2, nearD)), rm = reflect(-E, nm);
      float g2 = 1. - clamp(E.y, 0., 1.), f2 = 0.3 + 0.7 * g2 * g2;
      vec3 day = mix(uOut * vec3(0.84, 0.88, 0.98), uOut * vec3(0.45, 0.62, 1.02) * 0.8, smoothstep(0.0, 0.26, rm.y));
      col = mix(col, mix(sky * 1.3 + key * 0.12, day, doorAt(vW, rm) * smoothstep(0., 0.55, g2) * (0.3 + 0.7 * g2)), wetH * f2 * 0.92 * flagK);
    }
    // THE LAST HALL'S FLAGS AND POOLS AS MIRRORS (the mirror's law of the eye, as for the sea). A pool is still water
    // under a breath of air (fine ripples on the world clock): it gives back, by the way the sight is thrown from it,
    // the sky (the dusk's band low, the blue higher), THE WALLS where the thrown sight meets one (the landward wall
    // in its own shade, the seaward in the low sun, the end piers; each as high as it stands there), the moon as a
    // small disc that the ripples break into glints, and the ring. A DRY FLAG is a dull mirror, each aslant its own
    // way and none in its joints: the moon's and the ring's sheen on the flags lies in single flags, broken, and
    // fades with the angle; it has no outline of its own
    if (zr > 0.01) {
      vec3 rip = vec3(vn(vec3(vW.xz * 2.6 + uTime * vec2(0.5, 0.3), uTime * 0.4)) - .5, 0., vn(vec3(vW.zx * 2.6 - uTime * vec2(0.4, 0.35), uTime * 0.37 + 7.)) - .5) * 0.035;
      vec3 r0 = reflect(-E, normalize(n + mix(flagN, rip, pool))), rg = normalize(uRing.xyz - vW);
      float gd = clamp(dot(r0, MOON), 0., 1.), gr = clamp(dot(r0, rg), 0., 1.), gm = gd * gd; gm *= gm; gm *= gm; gm *= gm; gr *= gr; gr *= gr; gr *= gr; gr *= gr; gr *= gr;
      float f3 = 1. - clamp(E.y, 0., 1.); f3 = 0.25 + 0.75 * f3 * f3;
      // the walls' image: where the thrown sight meets a side wall or the end wall below its top
      float wimg = 0.; vec3 wcol = vec3(0.);
      { float sx = r0.x < 0. ? -1. : 1., ts = (sx * uRuin.x - vW.x) / (abs(r0.x) > 1e-3 ? r0.x : 1e-3 * sx), as = a - r0.z * ts, ys = vW.y + r0.y * ts; int cj = int(clamp(floor((as - uRuin.z) / uRuin.w), 0., 15.));
        float inh = step(uRuin.z, as) * step(as, uEndW.x), side = inh * smoothstep(0.25, -0.25, ys - (sx < 0. ? uCut[cj] : uCutS[cj]));
        float te = (-uEndW.x - vW.z) / min(r0.z, -1e-3), xe = vW.x + r0.x * te, ye = vW.y + r0.y * te; int tj = int(clamp(floor((abs(xe) - uEndW.y) / ((uRuin.x - uEndW.y) / 3.)), 0., 2.)) + (xe > 0. ? 3 : 0);
        float endw = step(abs(xe), uRuin.x) * smoothstep(-0.2, 0.2, abs(xe) - uEndW.y) * smoothstep(0.25, -0.25, ye - uEndTop[tj]);
        // THE WALL'S IMAGE IS THE WALL'S: its niches stand dark in it, tier over tier (the hall's own storeys), and
        // the low sun lies on the seaward wall's image only where it lies on that wall, over the shadow the landward
        // wall throws on it (the law of the wall's own light, sunR, at the place the thrown sight meets)
        float ua = (as - uRuin.z) / uRuin.w, nk = 0.; ${RUIN_NICHE}
        int cs = int(clamp(floor((as + 2. * uRuin.x * 0.124 - uRuin.z) / uRuin.w), 0., 15.));
        float sunW = step(0., sx) * side * (1. - endw) * smoothstep(-1.0, 1.4, ys + 2. * uRuin.x * uRuin.y - uCut[cs]);
        wimg = max(side, endw); wcol = wallC * mix(sky * 0.75, sky * 0.6 + key * 0.2, sunW) * (1. - 0.55 * nk * side * (1. - endw)); }
      vec3 skyI = mix(vec3(0.42, 0.3, 0.33), sky * 0.95, clamp(r0.y * 2.6, 0., 1.));
      // (still water is the better mirror the lower the sight; seen from steep above, the dark flags under it show)
      col = mix(col, mix(skyI, wcol, wimg), pool * (0.45 + 0.5 * f3));
      float g2 = gm * gm, disc = smoothstep(0.9982, 0.9992, gd) * (1. - wimg), open = 1. - wimg;
      col += zr * open * (vec3(0.7, 0.72, 0.8) * (0.125 * g2 * (1. - pool) * flagK * (1. - 0.5 * wetRim) + pool * (0.5 * g2 * g2 + 1.2 * disc)) + (0.25 * flagK * (1. - pool) + 0.55 * pool) * vec3(0.6, 0.72, 0.95) * gr * 0.34 * uRing.w); }
  }
  if (pave && zm > 0.01) {
    float hs = vW.y - uSeaY, top = 0.3 + 1.5 * (0.5 + 0.5 * sin(uTime * 0.8 + vW.x * 0.13) * sin(uTime * 0.37 + vW.x * 0.05 + 1.));
    float film = (1. - smoothstep(top - 0.3, top, hs)) * step(-0.4, hs), edge = smoothstep(top - 0.55, top - 0.12, hs) * (1. - smoothstep(top - 0.12, top + 0.06, hs));
    float dirn = a < uFlat ? 1. : -1., runl = smoothstep(0.5, 0.78, vn(vec3(vW.x * 2.4, a * 0.6 - dirn * uTime * 1.7, 3.)));
    // (p1m1: a tread the swell has just left is wet all over: at the sea's still level and under it the film is whole,
    // and it breaks into runnels over the 0.6 m above; so the sea's edge on a stair is not a row of pale and dark
    // blocks, a tread bared in a trough beside one that is covered)
    col = mix(col, vec3(0.86, 0.93, 0.9) * (key * 0.5 + sky * 2. + gnd), zm * clamp(edge * (0.45 + 0.55 * n3) + film * mix(1., runl, smoothstep(0., 0.6, hs)) * 0.55, 0., 1.));
    // above the sea's reach the treads are wet as far up as the tide's mark and thin water runs down them
    float wetS = zm * step(top, hs) * (1. - smoothstep(2.5, 6.5, hs));
    col = mix(col, vec3(0.8, 0.9, 0.88) * (key * 0.3 + sky * 2.2 + gnd), wetS * (0.12 + 0.3 * runl));
  }
  if (pane) {
    float mu = step(0.07, abs(fract(vX.y / 1.15 + .5) - .5) * 1.15), mv = step(0.07, abs(fract(vX.z / 1.7) - .5) * 1.7);
    float wl = zs * (1. - smoothstep(-0.5, 0.5, vW.y - uSeaY - 1.6 - 0.35 * sin(vW.z * 0.8 + uTime * 0.9)));
    col = glass * 0.5 * (0.2 + 0.8 * mu * mv) * (0.7 + 0.05 * vX.z + 0.3 * vn(vec3(vW.z * 0.21 + uTime * 0.02, vW.y * 0.33, 7.))) * mix(1., 0.45 + 0.5 * nt, wl) + vec3(0.6, 0.7, 1.0) * storm * 1.3;
  }
  float fd = 0.5 * (fog.a + uEyeFog.a); col = mix(col, 0.5 * (fog.rgb + uEyeFog.rgb) + vec3(0.5, 0.58, 0.8) * storm * 0.05, 1. - exp(-fd * dist));
  if (cloudsea) {
    // the sea of cloud beyond the fallen wall and beyond the ring: heads lit by the low sun of the last hall's
    // evening, hollows blue, drifting on the world clock, paling into the evening's own far air
    vec2 cq2 = vW.xz * 0.011 + vec2(uTime * 0.004, 0.); float s1 = vn(vec3(cq2, 1.)) * 0.6 + vn(vec3(cq2 * 2.7, 4.)) * 0.4, s2 = vn(vec3(cq2 * 2.7 + 0.3, 4.));
    col = mix(uSky[3] * 0.95 + vec3(0.03, 0.03, 0.05), uKey[3] * 0.4 + uSky[3] * 0.9, smoothstep(0.44, 0.8, s1 + (s2 - s1) * 1.2));
    col = mix(col, vec3(0.84, 0.58, 0.5), 1. - exp(-dist * 0.0014)) + vec3(0.6, 0.7, 1.0) * storm * 0.5;
  }
  if (farhall) {
    // the far halls of the house, out over the sea of cloud: dark against the evening, their arcades darker, a face
    // that looks to the low sun gold; RANK BEHIND RANK, each paler with the air that lies before it (the air's own
    // law by the distance from the eye: the far ranks come near the colour of the sky's foot)
    col = vC * (vec3(0.1, 0.105, 0.2) + uKey[3] * 0.42 * clamp(dot(n, uDir[3]), 0., 1.) + vec3(0.1, 0.08, 0.1) * clamp(n.y, 0., 1.));
    // a far hall's face is the house's own: a string course and its shadow at every storey of the house (11.5 m),
    // a darker foot where the cloud's damp stands on it
    float fst = abs(fract(vW.y / 11.5) - 0.5), fup = 1. - step(0.5, abs(n.y));
    col *= 1. - fup * (0.3 * smoothstep(0.1, 0.03, fst) - 0.16 * smoothstep(0.035, 0.0, abs(fst - 0.13)));
    // the air before it: the colour of the sky's foot low down, the dusk's lilac higher (the same air as the sky's)
    vec3 fair = mix(vec3(0.8, 0.56, 0.5), vec3(0.6, 0.5, 0.62), smoothstep(0., 70., vW.y - ${(UP_Y - 9).toFixed(1)}));
    col = mix(col, fair, (1. - exp(-dist * 0.0021)) * 0.94);
  }
  if (outer) {
    // the sky over the sea, 600 m off: pale at the horizon, deeper above; banks of cloud with bright heads and grey
    // bellies drifting on the world clock
    float h = (vW.y + 2.45) / 600.;
    col = mix(uOut * vec3(1.02, 0.98, 0.92) * 0.98, uOut * vec3(0.4, 0.58, 1.0) * 0.62, smoothstep(0.0, 0.5, h));
    vec3 cq = vec3(vW.z * 0.0034 + uTime * 0.003, vW.y * 0.012, 3.);
    float c1 = vn(cq) * 0.62 + vn(cq * 2.9 + 5.) * 0.38, c2 = vn(cq * 2.9 + vec3(0., 0.5, 5.));
    float body = smoothstep(0.5, 0.6, c1 - 0.22 * smoothstep(0.1, 0.5, h)) * smoothstep(0.0, 0.03, h);
    col = mix(col, mix(uOut * vec3(0.55, 0.57, 0.66), uOut * vec3(1.16, 1.1, 1.02), smoothstep(-0.08, 0.1, c2 - c1 + 0.04)), body * 0.92);
  }
  #ifdef MIRROR
    float md = vW.y - uSeaY; if (md < 0.02) discard;
    gl_FragColor = vec4(col * vec3(0.5, 0.8, 0.68), 0.66 * exp(-md / 7.) * smoothstep(0.6, 2.5, dist));
  #else
    gl_FragColor = vec4(col, 1.);
  #endif
}`;
// ---------------------------------------------------------------- what stands in a vessel beside its walls
// the last hall's great doorway: a broken arch of this half breadth; the ring stands in its opening
const END_HW = 10.6;
// the stones strewn over the hall's last metres (said where they are laid): the stretch, the ring's own bay, how
// far from the axis, how high at the most, how many places a stone is dealt
export const STREWN = { len: 26, bay: 6.4, off: 6, top: 0.95, tries: 8 };
// THE MOTES OF THE LAST HALL, ONE LAW FOR THE WHOLE HALL: MOTES of them over the whole hall (live's own draws, places
// and sizes, to the bit), and the evening's own AT THE OPENINGS IT COMES IN BY: the two breaches of the evening
// hand's wall (the bays the seed deals) and the great doorway in the end wall. MOTE_OPEN of them to every metre of an
// opening's breadth, each a grain MOTE_OPEN_SIZE m across, thick in the opening's own shaft and thinning along the
// hall with the distance from it (said where they are dealt: airInto), from a stream of their own ('motesend'). No
// stretch of the hall is measured out for them
export const MOTES = 700, MOTE_SIZE = [0.05, 0.12], MOTE_OPEN = 44, MOTE_OPEN_SIZE = [0.09, 0.22], MOTE_DUSK = [0.9, 0.58, 0.22];
// the dry grass in the joints of the last hall's flags (said where it is made): how many tufts at density 1, the
// flags' course (the pavement's own 1.6 m), how far from the axis, how high a blade at the most, how far from a
// tuft's root the feet of its blades stand (its spread)
export const GRASS = { tufts: 230, course: 1.6, off: 6.5, high: 0.55, spread: 0.09 };
// how far the entrance hall's lintel course stands out from either wall; the half breadth of a porch pier's foot and
// the air the piers' rule asks between a pier and the rank of giants; the room left before the porch's end wall; the
// air between two giants' stone; the least share of its full size at which a giant of the rank stands
export const LINTEL_D = 5, PORCH_PIER = 1.7, PORCH_AIR = 0.5, PORCH_END = 0.9, PORCH_GAP = 0.3, GIANT_LEAST = 0.85;
// turn a builder's triangles about the x axis (for what has fallen and lies as it fell)
function tiltX(o, ang) {
  const c = Math.cos(ang), sn = Math.sin(ang);
  for (let i = 0; i < o.p.length; i += 3) { const y = o.p[i + 1], z = o.p[i + 2], ny = o.n[i + 1], nz = o.n[i + 2]; o.p[i + 1] = y * c - z * sn; o.p[i + 2] = y * sn + z * c; o.n[i + 1] = ny * c - nz * sn; o.n[i + 2] = ny * sn + nz * c; }
}
// one heap of what fell from the vault: a drift of small stones and in it broken drums, slabs and capitals, half
// sunk. R: the drift's half breadth
function rubbleInto(h, r, R) {
  ball(h, [0, 0, 0], R, 0.28 + 0.16 * R, R * r.range(0.7, 1), 9, 4, 0.9);
  const n = 4 + r.int(0, 3);
  for (let i = 0; i < n; i++) {
    const kd = r(), b = new Geo(), th = r() * TAU, d = r.range(0, R * 0.65), yw = r() * TAU, tint = r.range(0.86, 1); let y = 0;
    if (kd < 0.4) { const rr = r.range(0.6, 1.1), L = r.range(0.6, 1.6); tube(b, [0, 0, -L / 2], [0, 0, L / 2], rr, rr, 10, 0.95); for (const e of [-1, 1]) ball(b, [0, 0, e * L / 2], rr, rr, 0.05, 8, 4, 0.82); tiltX(b, r.range(-0.3, 0.3)); y = rr * r.range(0.55, 0.85); }
    else if (kd < 0.75) { const w = r.range(1.4, 3.2), hh = r.range(0.3, 0.6), dd = r.range(1, 2.2); b.box(-w / 2, -hh / 2, -dd / 2, w / 2, hh / 2, dd / 2, MARBLE, '', 0.95); tiltX(b, r.range(-0.4, 0.4)); y = hh * 0.5 + r.range(0.05, 0.3); }
    else { b.box(-0.7, 0.5, -0.7, 0.7, 0.72, 0.7, MARBLE, '', 0.95); tube(b, [0, 0, 0], [0, 0.5, 0], 0.4, 0.62, 8, 0.85, 0.95); tube(b, [0, -0.5, 0], [0, 0, 0], 0.38, 0.38, 8, 0.9); tiltX(b, r.range(1.1, 1.7)); y = 0.5; }
    h.put(b, Math.cos(th) * d, y, Math.sin(th) * d, yw, 1, tint);
  }
  for (let i = 0; i < 7; i++) { const th = r() * TAU, d = r.range(R * 0.3, R * 1.3), rr = r.range(0.12, 0.34); ball(h, [Math.cos(th) * d, rr * 0.4, Math.sin(th) * d], rr, rr * 0.7, rr * r.range(0.7, 1.2), 5, 3, r.range(0.8, 1), r.range(-0.5, 0.5)); }
}
// the top of the fallen stone over a place of the last hall's pavement: the highest point of any heap, as it lies
// (P.heaps: each heap's own triangles, its stones and the dark painted beside it; none reaches further from the
// heap's middle than the heap's own reach), straight over that place; -Infinity where nothing of a heap lies over
// it. It takes no draw
export function heapTop(P, x, z) {
  let top = -Infinity;
  for (const h of P.heaps || []) { if (Math.hypot(x - h.x, z - h.z) > h.reach) continue; const p = h.p;
    for (let i = 0; i < p.length; i += 9) {
      const x0 = p[i] - x, z0 = p[i + 2] - z, x1 = p[i + 3] - x, z1 = p[i + 5] - z, x2 = p[i + 6] - x, z2 = p[i + 8] - z, d = x0 * (z1 - z2) + x1 * (z2 - z0) + x2 * (z0 - z1);
      if (Math.abs(d) < 1e-9) continue;
      const w0 = (x1 * z2 - x2 * z1) / d, w1 = (x2 * z0 - x0 * z2) / d, w2 = 1 - w0 - w1;
      if (w0 >= 0 && w1 >= 0 && w2 >= 0) top = Math.max(top, w0 * p[i + 1] + w1 * p[i + 4] + w2 * p[i + 7]);
    } }
  return top;
}
// the highest fallen stone over a RECTANGLE of the last hall's pavement (middle x, z; its long way along the unit
// vector fx, fz from u0 behind the middle to u1 before it; hw to either hand): every triangle of every heap is cut
// to the rectangle as it lies and the highest corner of what is left is taken, so no stone between two sampled
// places is passed over; -Infinity where no heap's stone lies over any of it. It takes no draw
export function heapOver(P, x, z, fx, fz, u0, u1, hw) {
  let top = -Infinity; const reach = Math.max(-u0, u1) + hw;
  // (cut: what of a polygon [u, w, y] lies where coordinate k is on the side sg of the bound c)
  const cut = (poly, k, sg, c) => { const out = []; for (let i = 0; i < poly.length; i++) { const a = poly[i], b = poly[(i + 1) % poly.length], da = sg * (a[k] - c), db = sg * (b[k] - c); if (da <= 0) out.push(a); if ((da < 0 && db > 0) || (da > 0 && db < 0)) { const t = da / (da - db); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]); } } return out; };
  for (const h of P.heaps || []) { if (Math.hypot(x - h.x, z - h.z) > h.reach + reach) continue; const p = h.p;
    for (let i = 0; i < p.length; i += 9) {
      let poly = []; for (let k = i; k < i + 9; k += 3) poly.push([(p[k] - x) * fx + (p[k + 2] - z) * fz, -(p[k] - x) * fz + (p[k + 2] - z) * fx, p[k + 1]]);
      if (Math.max(poly[0][2], poly[1][2], poly[2][2]) <= top) continue;
      poly = cut(poly, 0, -1, u0); if (poly.length) poly = cut(poly, 0, 1, u1); if (poly.length) poly = cut(poly, 1, -1, -hw); if (poly.length) poly = cut(poly, 1, 1, hw);
      for (const q of poly) top = Math.max(top, q[2]);
    } }
  return top;
}
// A ROOK THAT STANDS (its wings folded) is a body half a metre long. BIRD_FOLDED: the reach of the birds' own mesh as
// the birds' shader folds it, in spans, from the bird's place: its beak's end before it, its tail's end behind it,
// its folded wing to either hand, how far its lowest point (the tail's end) lies under the level of its feet; and
// how far to either hand of its place a foot stands.
// THE RULE OF ITS ROOM (rookRoom), for every rook that stands on the last hall's pavement, on every seed: it stands
// at the height of what lies at its place (the pavement, a heap's stone straight under it, or the dark that is
// painted on the flags beside a heap: heapTop) and ONLY WHERE ITS WHOLE BODY HAS ROOM: over the body's own
// footprint as it is turned (beak's end to tail's end, its breadth, and ROOK_AIR about it) nothing that fell
// stands higher than the body's own lowest point by more than ROOK_OVER (so no part of the body is under stone by
// more than that, and nothing stands 0.013 m over its feet); under each foot the stone or the pavement is there
// (no foot over a drop deeper than ROOK_DROP); and no other rook already stands within ROOK_APART of its place
// (a body's length and its air: two bodies never stand in one another) or within ROOK_MIRROR of the place across
// the hall's axis from it (no two are set as mirror images to either hand of the ring) (others: [x, z] of those
// that stand). Returns the height of its feet, or null where the body has no room. It
// reads the stone, the rooks that stand and the bird's own measure; it takes no draw
export const BIRD_FOLDED = { fore: 0.2, aft: 0.327, half: 0.1, low: 0.0172, foot: 0.047 }, ROOK_AIR = 0.05, ROOK_OVER = 0.03, ROOK_DROP = 0.05, ROOK_APART = 0.55, ROOK_MIRROR = 0.2, ROOK_TRIES = 12;
export function rookRoom(P, x, z, face, sz, others = []) {
  const fx = Math.cos(face), fz = Math.sin(face), B = BIRD_FOLDED, lies = (px, pz) => Math.max(UP_Y, heapTop(P, px, pz)), y = lies(x, z);
  for (const q of others) if (Math.hypot(q[0] - x, q[1] - z) < ROOK_APART || Math.hypot(q[0] + x, q[1] - z) < ROOK_MIRROR) return null;
  for (const s of [-1, 1]) if (lies(x - s * fz * B.foot * sz, z + s * fx * B.foot * sz) < y - ROOK_DROP) return null;
  if (heapOver(P, x, z, fx, fz, -B.aft * sz - ROOK_AIR, B.fore * sz + ROOK_AIR, B.half * sz + ROOK_AIR) > y - B.low * sz + ROOK_OVER) return null;
  return y;
}
// fragments of fallen statues: a torso (the arms broken off above the elbow, no head), an open hand
function torsoInto(b) {
  loft(b, [{ c: [0, 0, 0], rx: 0.2, rz: 0.13, sh: 0.8 }, { c: [0, 0.2, 0], rx: 0.155, rz: 0.105 }, { c: [0, 0.4, 0], rx: 0.205, rz: 0.135 }, { c: [0, 0.54, 0], rx: 0.22, rz: 0.115 }, { c: [0, 0.61, 0], rx: 0.08, rz: 0.075, ny: 1.5 }], 12);
  for (const sd of [-1, 1]) { ball(b, [sd * 0.235, 0.53, 0], 0.08, 0.075, 0.078, 6, 4, 1); tube(b, [sd * 0.24, 0.52, 0], [sd * 0.31, 0.33, 0.03], 0.07, 0.062, 7, 0.95); ball(b, [sd * 0.31, 0.33, 0.03], 0.06, 0.02, 0.06, 6, 4, 0.75); }
  tube(b, [0, 0.6, 0], [0, 0.7, 0.01], 0.06, 0.055, 7, 0.85); ball(b, [0, 0.7, 0.01], 0.054, 0.015, 0.054, 6, 4, 0.72); ball(b, [0, 0.36, 0.07], 0.17, 0.1, 0.07, 6, 3, 0.98);
}
function handInto(b) {
  ball(b, [0, 0, 0], 0.1, 0.035, 0.12, 6, 4, 1);
  for (let i = 0; i < 4; i++) { const x = -0.075 + i * 0.05, k = [x * 1.1, 0.035, 0.2], e = [x * 1.15, 0.0, 0.3 - Math.abs(i - 1.5) * 0.02]; tube(b, [x, 0, 0.1], k, 0.026, 0.023, 5, 0.95); tube(b, k, e, 0.023, 0.018, 5, 0.9); }
  tube(b, [0.09, 0, -0.02], [0.17, 0.02, 0.08], 0.03, 0.024, 5, 0.95); tube(b, [0.17, 0.02, 0.08], [0.18, 0, 0.16], 0.024, 0.018, 5, 0.9); tube(b, [0, 0, -0.1], [0, -0.01, -0.3], 0.085, 0.075, 7, 0.9);
}
// THE FALLEN GIANT of the last hall, an old fall: it stood on a plinth against the wall of the evening hand, near
// the hall's beginning (where: its own stream), and fell along the hall toward the ring. Its feet still stand on the
// plinth, the shins broken off; then, each where it came down and half sunk: an arm at the wall's foot, the body's
// drum in its pleats, an open hand, and farthest the head, on the back of its skull with its face to the sky and to
// those who pass. Each piece's place is a rule from the plinth's (6, 11, 17 and 21.5 m beyond it); as they lie, the
// hand comes to 4.83 m of the hall's axis, the body to 5.54 (seeds 1 to 100). White marble, 10.3 times the make (18 m)
function fallenInto(g, P, v, r) {
  const f = UP_Y, sc = 10.3, xw = -v.W, a0 = v.a0 + r.range(9, 13), bk = 1.2 * 1.17;
  const keep = (b, y0, y1) => { const o = new Geo(); for (let i = 0; i < b.p.length; i += 9) { const y = (b.p[i + 1] + b.p[i + 4] + b.p[i + 7]) / 3; if (y < y0 || y > y1) continue; for (let k = i; k < i + 9; k++) { o.p.push(b.p[k]); o.n.push(b.n[k]); o.c.push(b.c[k]); o.x.push(b.x[k]); } } return o; };
  const shift = (b, dy) => { for (let i = 1; i < b.p.length; i += 3) b.p[i] += dy; };
  // the dark under a piece, reaching away from the low sun (as under the heaps)
  const dark = (x, a, rx, rz) => { const c = [x + 0.8, f + 0.03, -a], pp = (t) => [Math.max(xw + 0.05, Math.min(v.W - 0.05, c[0] + rx * Math.cos(t))), f + 0.03, c[2] + rz * Math.sin(t)]; for (let k = 0; k < 12; k++) g.tri(c, pp(TAU * k / 12), pp(TAU * (k + 1) / 12), [0, 1, 0], MARBLE, 1, [0.4, 1, 1]); };
  const lay = (b, x, y, a, yaw, s, rr, hh, what) => { g.put(b, x, y, -a, yaw, s, r.range(0.94, 1)); P.solids.push({ x, z: -a, r: rr, y0: f, y1: f + hh, what }); dark(x, a, rr + 1.6, rr + 0.6); };
  // the plinth and the feet
  g.box(xw, f, -a0 - 3.3, xw + 5.6, f + 1.5, -a0 + 3.3, MARBLE, 'yx', 0.92);
  { let b = new Geo(); person(b, { bulk: 1.2, kilt: 0 }, 2); b = keep(b, 0, 0.36); for (const s of [-1, 1]) ball(b, [s * 0.107, 0.36, 0.01], 0.078 * bk, 0.008, 0.078 * bk, 6, 2, 0.7); lay(b, xw + 2.8, f + 1.5, a0, Math.PI / 2, sc, 3.4, 5.4, 'fallen feet'); }
  // an arm, broken at the shoulder and the wrist, along the wall's foot
  { const b = new Geo(); tube(b, [0, 0, -0.3], [0, 0, 0], 0.07 * bk, 0.058 * bk, 6, 0.95); ball(b, [0, 0, 0], 0.062 * bk, 0.062 * bk, 0.062 * bk, 5, 3, 0.9); tube(b, [0, 0, 0], [0.05, 0.02, 0.27], 0.056 * bk, 0.044 * bk, 6, 0.92); ball(b, [0, 0, -0.3], 0.07 * bk, 0.07 * bk, 0.006, 6, 2, 0.7); ball(b, [0.05, 0.02, 0.27], 0.044 * bk, 0.044 * bk, 0.006, 6, 2, 0.7);
    lay(b, xw + 2.4, f + 0.07 * bk * sc * 0.8, a0 + 6, r.range(-0.2, 0.2), sc, 3.2, 1.8, 'fallen arm'); }
  // the body's drum: a length of the robe in its pleats, on its side
  { const b = new Geo(); pleat(b, [{ c: [0, 0, 0], rx: 0.27, rz: 0.2, d: 0.13, sh: 0.85 }, { c: [0, 0.3, 0], rx: 0.25, rz: 0.19, d: 0.11 }, { c: [0, 0.56, 0], rx: 0.21, rz: 0.16, d: 0.05 }], 9, 0.2); ball(b, [0, 0, 0], 0.25, 0.008, 0.185, 8, 2, 0.7); ball(b, [0, 0.56, 0], 0.2, 0.008, 0.15, 8, 2, 0.7);
    tiltX(b, Math.PI / 2); lay(b, xw + 5.6, f + 0.2 * sc * 0.8, a0 + 11, r.range(-0.3, 0.3), sc, 3.6, 3.8, 'fallen body'); }
  // the open hand, palm to the sky
  { const b = new Geo(); handInto(b); tiltX(b, r.range(-0.08, 0.08)); lay(b, -8.4, f + 0.3, a0 + 17, r.range(0.6, 1.4), 12, 2.6, 1.2, 'fallen hand'); }
  // the head
  { let b = new Geo(); person(b, { bulk: 1.2 }, 2); b = keep(b, 1.475, 9); ball(b, [0, 1.478, 0], 0.062 * bk, 0.008, 0.058 * bk, 6, 2, 0.7); shift(b, -1.64); tiltX(b, -1.1 + r.range(-0.12, 0.12));
    lay(b, -9.6, f + 0.1 * sc * 0.9, a0 + 21.5, Math.PI / 2 + r.range(-0.3, 0.3), sc, 1.9, 2.4, 'fallen head'); }
}
// THE SEA OF CLOUD: ONE PLANE, AT ONE HEIGHT, IN ITS PLACE; laid once for the whole house (with the cloud hall's
// extras). Three rules:
// ITS HEIGHT: P.cloudY, which the plan reads from the cloud hall's own floor law at its fallen bays less CLOUD_UNDER
// (9 m under the upper pavement). The far halls that stand out of it and what lies beyond the last doorway take the
// same P.cloudY: there is one height and so no step.
// ITS BOUND, one rule for every hall alike: the cloud lies on the hand of the fallen wall (the landward) and beyond
// the house's end, and it keeps CLOUD_OFF m outside the inner face of every wall of every hall, the side wall and the
// walls at the hall's two ends alike (a wall is 2.6 to 3 m thick: 2 m and more of air beyond its outer face); where
// the reaches of two halls meet about the wall between them, the broader hall's holds. So no part of it lies inside
// any hall or in any hall's sea; along the upper hall and the last hall, where the fallen wall and the breaches look
// out on it, its edge lies under the wall's foot, 9 m under the pavement, where a sill hides it from the pavement's
// side. Before the house's first hall it keeps that hall's line (nothing lies across the entry). Beyond the end wall
// it lies across the whole breadth.
// ITS REACH: CLOUD_FAR m on every open hand (from the spine to landward, back before the first hall, on beyond the
// end wall, and to either hand of the spine there): past the furthest rank of far halls (1065 m to landward, 1100 m
// beyond the end), so every far hall stands IN it.
// NO EDGE OF IT SHOWS AS A CUT: its inner edges lie under the walls' feet, where no sight from the flown line
// reaches them (counted by place on seeds 1 to 40: none), and its outer edges lie CLOUD_FAR off, a third to two
// thirds of a degree under the level from 16 m over it: they are the cloud's horizon.
// It is laid in cells between the breaks of that bound, and neighbours share their corners: no two layers, no
// corner in the middle of another cell's edge, so no crack that would show sky.
function cloudInto(g, P) {
  const V = P.V, y = P.cloudY, sg = P.cl.gap.side, aS = V[0].a0 - CLOUD_FAR, aE = V[V.length - 1].a1 + CLOUD_OFF, aF = aE + CLOUD_FAR;
  // a hall's reach along the spine, and how far out from the axis the cloud keeps at a place beside the house
  const from = (v) => (v.i ? v.a0 - CLOUD_OFF : aS), to = (v) => v.a1 + CLOUD_OFF, keep = (a) => Math.max(...V.filter((v) => a > from(v) && a < to(v)).map((v) => v.W)) + CLOUD_OFF;
  const as = [...new Set([aS, aF, ...V.map(from), ...V.map(to)])].sort((p, q) => p - q), us = [...new Set([-CLOUD_FAR, CLOUD_FAR, ...V.map((v) => v.W + CLOUD_OFF)])].sort((p, q) => p - q);
  for (let i = 0; i + 1 < as.length; i++) for (let j = 0; j + 1 < us.length; j++) {
    const am = (as[i] + as[i + 1]) / 2, um = (us[j] + us[j + 1]) / 2;
    if (am < aE && um < keep(am)) continue;
    g.quad([sg * us[j], y, -as[i]], [sg * us[j + 1], y, -as[i]], [sg * us[j + 1], y, -as[i + 1]], [sg * us[j], y, -as[i + 1]], [0, 1, 0], [1, 1, 1], 6);
  }
}
// (built in steps so that a build can hand the page back inside a hall's extras: extrasSteps is the building itself
// and pauses between its great pieces; extrasInto runs it through without a pause. The draws and their order are the
// same either way)
export function extrasInto(g, P, v, o) { const it = extrasSteps(g, P, v, o); while (!it.next().done); }
export function* extrasSteps(g, P, v, o) {
  // what stands free in a hall and a bird's round must not pass through (upright rounds: place, reach, foot and top)
  P.solids = P.solids || []; P.nests = P.nests || [];
  if (v.id === 'ves') {
    // the lintel course on either hand, standing 5 m out from the wall. On the landward hand it is borne on the backs
    // of giants: three to five are dealt by a draw of the entrance hall's own stream, on that one hand only. On the
    // window hand plain square piers bear it. Giants, piers and lintel stand back against the walls: nothing of them
    // is nearer the line than 12 m
    // THE RANK'S ROOM IS GIVEN BY PLACES OF THE PORCH ALONE: it begins where the landward hand's first pier ends (the
    // pier line one bay in, the pier's own half breadth PORCH_PIER) with the half metre of air the piers' rule asks
    // (PORCH_AIR), and it ends PORCH_END m before the end wall. (From the second pier line the room would be 22.1 m:
    // three giants at 0.87 of full, and never the four or five a seed deals; so the first pier it is, on every seed.)
    // The giants stand as ONE RANK AT THE PORCH'S FAR END, elbow to elbow (PORCH_GAP m of air between two neighbours'
    // stone). EACH IS AS LARGE AS ITS SHARE OF THAT ROOM ALLOWS, never larger than the 11.5 m that stands between a
    // plinth of 1.3 m and the lintel, AND NEVER UNDER GIANT_LEAST OF IT: a place does not shrink its giants to fit a
    // count, so where the share of as many as the seed deals would be smaller THE RANK HOLDS FEWER (the first dealt
    // stand; one that does not stand is not carved and takes no draw: the entry's stream deals nothing after the
    // rank). Three stand at the full size (8.1 m from elbow to elbow; the first one's stone begins 20 m in); four at
    // 0.93 of it on plinths as much higher (2.1 m), and so each still bears the lintel; where five are dealt four
    // stand (five would stand at 0.74 of full). Before the rank the landward lintel is borne by plain piers of the
    // window hand's own make, at the entry and on each pier line whose pier stands clear of the rank by PORCH_AIR.
    // The draws of those that stand, and their order, are as they were
    const re = o.entry, ng = re.int(3, 5), g0 = v.a0 + v.bay + PORCH_PIER + PORCH_AIR, g1 = v.a1 - PORCH_END, made = []; P.giants = ng; P.giantAt = [];
    // (the share of its full size that each of n giants takes in the rank's room, the broadest of them b m broad)
    const share = (n, b) => Math.min(1, ((g1 - g0) / n - PORCH_GAP) / b); let broad = 0;
    for (const s of [-1, 1]) g.box(s > 0 ? v.W - LINTEL_D : -v.W, 12.8, -v.a1, s > 0 ? v.W : -v.W + LINTEL_D, 15.2, -v.a0, MARBLE, s > 0 ? 'X' : 'x', 1.0);
    for (let i = 0; i < ng; i++) {
      // (the next one dealt is carved only if the rank, by the broadest carved so far, still holds one more at
      // GIANT_LEAST of full; and it stands only if its own breadth allows it too)
      if (i && share(i + 1, broad) < GIANT_LEAST) break;
      const gg = new Geo(), top = giantInto(gg, 0, re), tint = 0.97 + 0.06 * re(); let lo = 9, hi = -9;
      for (let q = 0; q < gg.p.length; q += 3) { lo = Math.min(lo, gg.p[q]); hi = Math.max(hi, gg.p[q]); }
      const full = (hi - lo) * 11.5 / top;
      if (i && share(i + 1, Math.max(broad, full)) < GIANT_LEAST) break;
      broad = Math.max(broad, full); made.push({ gg, top, tint, lo, hi, full }); yield; }
    const ns = made.length, pitch = Math.min((g1 - g0) / ns, broad + PORCH_GAP);
    for (let i = 0; i < ns; i++) {
      const m = made[i], a = g1 - (ns - i - 0.5) * pitch, x = -(v.W - 2.6), k = Math.min(1, (pitch - PORCH_GAP) / m.full), sc = k * 11.5 / m.top, ph = 1.3 + 11.5 * (1 - k), hx = 2.4 * k, hz = 2.9 * k;
      g.box(x - hx, 0, -a - hz, x + hx, ph, -a + hz, MARBLE, 'y', 0.9); g.put(m.gg, x, ph, -a, Math.PI / 2, sc, m.tint);
      // (the giant's block is a plinth with its moulding: a base course 0.15 m broader than the block and a cap
      // course 0.1 m broader under the feet; its edge toward the line is 12.05 m from it and more)
      g.box(x - hx - 0.15, 0, -a - hz - 0.15, x + hx + 0.15, 0.3, -a + hz + 0.15, MARBLE, 'y', 0.84); g.box(x - hx - 0.1, ph - 0.26, -a - hz - 0.1, x + hx + 0.1, ph, -a + hz + 0.1, MARBLE, 'yY', 0.97);
      for (const [x0, z0, x1, z1] of [[-hx - 0.1, -hz - 0.1, hx + 0.1, -hz], [-hx - 0.1, hz, hx + 0.1, hz + 0.1], [-hx - 0.1, -hz, -hx, hz], [hx, -hz, hx + 0.1, hz]]) g.quad([x + x0, ph, -a + z0], [x + x1, ph, -a + z0], [x + x1, ph, -a + z1], [x + x0, ph, -a + z1], [0, 1, 0], MARBLE, 0, [0.9, 0.9, 0.9, 0.9]);
      P.giantAt.push({ a, k, ph, lo: a + m.lo * sc, hi: a + m.hi * sc });
    }
    yield;
    for (const sd of [1, -1]) for (let i = 0; i <= v.nb; i++) {
      const a = Math.min(v.a1 - 1.6, Math.max(v.a0 + 1.6, v.a0 + i * v.bay)), x = sd * (v.W - 2.6);
      if (sd < 0 && a + PORCH_PIER > P.giantAt[0].lo - PORCH_AIR) break;
      { const hp = PORCH_PIER; g.box(x - hp, 0, -a - hp, x + hp, 1.0, -a + hp, MARBLE, 'y', 0.9); g.box(x - 1.3, 1.0, -a - 1.3, x + 1.3, 11.9, -a + 1.3, MARBLE, 'y', 0.97); g.box(x - hp, 11.9, -a - hp, x + hp, 12.8, -a + hp, MARBLE, 'y', 0.93); }
    }
  }
  // a lion lying to either hand of each great door, along the hall with its head toward those who come: on the axis of
  // the cross wall's lowest niche (midway between the door's panel and the side wall), yet never more than 11 m off
  // the hall's axis (the entrance hall's giants and piers stand beyond that); so its block's inner edge is 8.9 m and
  // more off the axis. Its tail lies 0.8 m before the cross wall. Where a stair leaves only a short landing before
  // the door (the flooded hall's upper stair) the lion is as long as the landing allows
  if (!v.ruin && v.i + 1 < P.V.length && v.id !== 'sea') {
    const f = v.fl(v.a1), lg = new Geo(), sc = 2; lionInto(lg);
    for (const s of [-1, 1]) { if (v.endGiant === s) continue; const x = s * Math.min((7.4 + v.W) / 2, 11), z = -(v.a1 - 0.8 - 1.3 * sc); g.put(lg, x, f, z, -Math.PI / 2, sc, 0.98); P.solids.push({ x, z, r: 3.4, y0: f, y1: f + 3.9, what: 'lion' }); }
  }
  if (v.id === 'nave') {
    // THE COLOSSUS OF THE FIRST HALL: at the hall's far end, beside its door on the landward hand, its back to the end
    // wall and its face down the hall toward those who come; 16 m with its plinth. It stands between the door's panel
    // and the side wall, 3 m before the end wall
    const gg = new Geo(), H = 16, ph = 1.6, top = giantInto(gg, 4, o.giants, o.nests), sc = (H - ph) / top, x = -(7.4 + v.W) / 2, z = -(v.a1 - 3);
    g.box(x - 3.6, 0, z - 2.6, x + 3.6, ph, z + 2.6, MARBLE, 'y', 0.9); g.put(gg, x, ph, z, 0, sc, 1);
    P.solids.push({ x, z, r: 5, y0: 0, y1: H + 0.6, what: 'warden' }); P.warden = { x, z, top: H, sc, y: ph };
    P.nests.push({ x: x + gg.nest[0] * sc, y: ph + gg.nest[1] * sc, z: z + gg.nest[2] * sc, R: 0.15 * sc, vi: v.i, out: [0.5, 0.3, 1] });
  }
  if (v.id === 'sea') {
    // the colossus of the flooded hall: one who stands in the sea, on the hall's floor at the middle of its flat, on
    // the seaward hand 5.2 m from the wall, as high as the hall's two lower tiers (17 m), turned to the hall's axis
    // and a little toward the stair we come down. The sea stands above the knee
    const gg = new Geo(), sc = 17 / 1.75, a = (v.s1 + v.a1) / 2, x = v.W - 5.2; giantInto(gg, 3, o.wader);
    g.put(gg, x, LOW_Y, -a, -Math.PI / 2 + 0.35, sc, 1); P.wader = { x, z: -a, r: 0.62 * sc, top: LOW_Y + 1.82 * sc, sc, yaw: -Math.PI / 2 + 0.35, geo: gg };
    P.solids.push({ x, z: -a, r: 0.62 * sc, y0: -99, y1: LOW_Y + 1.82 * sc, what: 'wader' });
  }
  if (v.id === 'stair') {
    // THE STAIR'S CHEEKS: to either hand of the stair a wall of three great blocks, 5.6 m broad, each standing 1.1 m
    // over the landing or the terrace its flight climbs to. On the front edge of each TOP block sits a GIANT of dark
    // bronze, its feet on the middle block (so its seat is one flight above its feet: that sets its size, 9.3 times
    // the make: 13 to 14 m seated, the boatman's oar to 17.7 m), facing down the stair toward those who come up out
    // of the sea; the two are unlike (a boatman with his oar; one who holds a boat), which hand each has by the
    // giants' own stream. They are seen whole from the flooded door until the head of the second flight
    const seg = v.run + v.land, h = -LOW_Y / 3, flip = o.giants.sign(), sc = h / 0.5;
    P.stairGiants = [];
    for (const s of [-1, 1]) {
      const x0 = s > 0 ? v.SW : -v.CW, x1 = s > 0 ? v.CW : -v.SW, xc = (x0 + x1) / 2;
      for (let k = 0; k < 3; k++) { const aA = k ? v.s0 + k * seg : v.s0 - 1.5, aB = k < 2 ? v.s0 + (k + 1) * seg : v.s1; g.box(x0, LOW_Y, -aB, x1, LOW_Y + h * (k + 1) + 1.1, -aA, MARBLE, 'y', 0.96); }
      const gg = new Geo(), kind = s * flip > 0 ? 5 : 6, yF = LOW_Y + 2 * h + 1.1, ap = v.s0 + 2 * seg + 0.14 * sc;
      setStone([0.27, 0.2, 0.105], 0); const top = giantInto(gg, kind, o.giants, o.nests, false); setStone(null);
      g.put(gg, xc, yF, -ap, 0, sc, 1);
      P.solids.push({ x: xc, z: -ap + 0.2 * sc, r: 0.62 * sc, y0: yF - 1, y1: yF + top * sc + 0.5, what: 'stair giant' }); P.stairGiants.push({ x: xc, y: yF, z: -ap, sc, kind, top: yF + top * sc });
      P.nests.push({ x: xc + gg.nest[0] * sc, y: yF + gg.nest[1] * sc, z: -ap + gg.nest[2] * sc, R: (kind === 6 ? 0.11 : 0.14) * sc, vi: v.i, out: [-s, 0.5, 1] });
    }
    yield;
    // THE TWO COLOSSI OF THE WALL THAT FACES THE STAIR: one in each great recess of that wall (the plan's v.face:
    // where the lantern's spokes meet the wall), on a plinth on the terrace, 2.3 m before the wall's face, looking down
    // the stair toward those who come up; of dark bronze like the pair on the cheeks and unlike each other (one behind
    // an anchor, one poised to dive: which hand each has, and the turn of each head, by the colossi's own stream);
    // each as high as its recess allows: its highest point 1 m under the recess's crown (about 15.6 m over the terrace)
    const F = v.face, rc = o.colossi, flip2 = rc.sign(), ph = 1.4, crown = F.gspring + F.ghw; P.wallGiants = [];
    for (const s of [-1, 1]) {
      const gg = new Geo(), kind = s * flip2 > 0 ? 7 : 8, x = s * F.gx, z = -(v.a1 - 2.3);
      setStone([0.27, 0.2, 0.105], 0); const top = giantInto(gg, kind, rc, null); setStone(null);
      const sc = (crown - 1 - ph) / top;
      g.box(x - 3.6, 0, z - 2.1, x + 3.6, ph, z + 2.9, MARBLE, 'y', 0.9); g.put(gg, x, ph, z, 0, sc, 1);
      P.solids.push({ x, z, r: 4.6, y0: 0, y1: crown, what: 'wall colossus' }); P.wallGiants.push({ x, y: ph, z, sc, kind, top: crown - 1 });
    }
  }
  if (v.id === 'hero') {
    // outside each seaward door: a stair down to the sea, cheeks to either hand; the day beyond
    const x0 = v.W + 2.6;
    for (const d of v.doors) {
      for (let j = 0; j < 8; j++) { const xa = x0 + j * 1.3, y = -j * 0.35; g.quad([xa, y, -d.a + 5.4], [xa + 1.3, y, -d.a + 5.4], [xa + 1.3, y, -d.a - 5.4], [xa, y, -d.a - 5.4], [0, 1, 0], MARBLE, 1); g.quad([xa + 1.3, y, -d.a + 5.4], [xa + 1.3, y, -d.a - 5.4], [xa + 1.3, y - 0.35, -d.a - 5.4], [xa + 1.3, y - 0.35, -d.a + 5.4], [1, 0, 0], MARBLE, 0, [0.7, 0.7, 0.7, 0.7]); }
      g.quad([v.W, 0, -d.a + 5.4], [x0, 0, -d.a + 5.4], [x0, 0, -d.a - 5.4], [v.W, 0, -d.a - 5.4], [0, 1, 0], MARBLE, 1);
      for (const s of [-1, 1]) g.box(x0, -4, -d.a + s * 5.4 - 0.5, x0 + 11, 1.6, -d.a + s * 5.4 + 0.5, MARBLE, 'yx', 0.95);
    }
    // the day's sky beyond the sea doors, 600 m off: it runs 800 m on past the hall's end, which is as far as a
    // sight line through a seaward door reaches it (53 degrees off the door's axis) and short of where the last
    // hall's doorway would look at it
    g.quad([v.W + 600, -40, -v.a0 + 1000], [v.W + 600, -40, -v.a1 - 800], [v.W + 600, 420, -v.a1 - 800], [v.W + 600, 420, -v.a0 + 1000], [-1, 0, 0], [1, 1, 1], 4);
  }
  if (v.id === 'cloud') {
    // the colossus at the stair's head, who holds the nest: the thing the stair climbs toward. He stands at the foot
    // of the second pier past the stair's head on the landward hand, 4.8 m in from the wall, as high as the two lower
    // tiers of his hall (17 m with his plinth), turned to the stair's head on the hall's axis
    const gg = new Geo(), bi = Math.ceil((v.s1 - v.a0) / v.bay) + 1, a = v.a0 + bi * v.bay, x = -(v.W - 4.8), sc = (17 - 1.4) / 1.75, yaw = Math.atan2(-x, a - v.s1);
    // he is of BLACK STONE (the cloud hall's dark figures); the nest: a shallow bowl of straw and round its rim
    // sixteen sticks laid across one another (the nest stream's draws)
    setStone([0.108, 0.115, 0.142], 0); giantInto(gg, 2, o.nest); nestInto(gg, [0, 1.245, 0.44], 0.185, o.nest);
    g.box(x - 3.4, UP_Y, -a - 3.4, x + 3.4, UP_Y + 1.4, -a + 3.4, MARBLE, 'y', 0.9); g.put(gg, x, UP_Y + 1.4, -a, yaw, sc, 1);
    P.solids.push({ x, z: -a, r: 5.6, y0: UP_Y, y1: UP_Y + 1.4 + 1.82 * sc, what: 'nest colossus' });
    const cs = Math.cos(yaw), sn = Math.sin(yaw); P.nest = { x: x + (0.44 * sn) * sc, y: UP_Y + 1.4 + 1.3 * sc, z: -a + (0.44 * cs) * sc, yaw };
  }
  if (v.gap) {
    // beyond the fallen wall: the sea of cloud 9 m under the hall's pavement (cloudInto: the one plane, laid here for
    // the whole house), and standing out of it (from 6 m under it: y0 is the cloud's own height) nine far halls of
    // the house, some with a tower, each with its arcade toward us (their own stream): 90 to 420 m off
    const rf = o.far, y0 = P.cloudY, xw = v.gap.side * v.W, sg = v.gap.side, fh = new Geo(); P.farHalls = [];
    cloudInto(g, P);
    for (let i = 0; i < 9; i++) {
      const d = rf.range(90, 420), a = (v.a0 + v.a1) / 2 + rf.range(-0.7, 1.1) * d, w = rf.range(22, 60), len = rf.range(42, 140), h = rf.range(24, 70), x = xw + sg * d, nb = Math.max(3, Math.round(len / 14)), bw = len / nb;
      fh.box(Math.min(x, x + sg * w), y0 - 6, -a - len / 2, Math.max(x, x + sg * w), y0 + h, -a + len / 2, MARBLE, sg < 0 ? 'Xy' : 'xy', 1);
      const M = (u, y, dd) => [x + sg * dd, y, -u];
      for (let j = 0; j < nb; j++) { const u0 = a - len / 2 + j * bw; archInto(fh, M, [-sg, 0, 0], [0, 0, -1], u0, u0 + bw, y0 - 6, y0 + h, u0 + bw / 2, bw * 0.32, y0 - 6, y0 + h * 0.62 - bw * 0.32, { depth: 4, noSill: true, K: 6, dark: 0.5, back: { col: MARBLE, sh: [0.22, 0.16] } }); }
      // (each far hall is kept with the face it turns to us and its head, the top of that face)
      P.farHalls.push({ x, a, len, top: y0 + h });
      if (rf() < 0.6) { const th = rf.range(22, 60), tx = x + sg * w * 0.5, ta = a + rf.range(-0.3, 0.3) * len; fh.box(tx - 7, y0 + h, -ta - 7, tx + 7, y0 + h + th, -ta + 7, MARBLE, 'y', 0.98); fh.box(tx - 8.2, y0 + h + th, -ta - 8.2, tx + 8.2, y0 + h + th + 2.4, -ta + 8.2, MARBLE, '', 1.02); }
    }
    for (let i = 0; i < fh.x.length; i += 3) fh.x[i] = 7;
    g.put(fh, 0, 0, 0);
    yield;
    // THE BROKEN ENDS OF THE FALLEN WALL AND WHAT LIES AT ITS FOOT (p1m1; their own stream, 'gapstone'). The wall is
    // WALL_DEEP m of ashlar (ASHLAR: the look's own courses and stones), and it broke along its joints:
    //  - AT EITHER END OF THE GAP the standing wall does not end in one upright cut. From the stump's top to the
    //    springing every course ends at a joint of its own, the lower courses reaching further into the gap (a
    //    ragged rake: its reach at the stump 2.2 to 4.1 m by a draw an end, each course's by a draw of its own and
    //    never set further than the course under it; a course then ends at the next joint OF ITS OWN BOND, so no
    //    course is broken through a stone, and one may stand out up to half a stone over the course under it, as
    //    the toothing of a bonded wall does): the broken section shows the wall's whole depth, course by course;
    //  - ON THE STUMPS' TOPS single stones of the next course still lie, in one place of two (whole, or the half
    //    toward the hall, or the half away from it);
    //  - AT THE WALL'S FOOT, on the pavement inside the hall, squared stones of the wall lie where they fell: six
    //    to ten dealt by each broken end and four to seven along the stumps, each a whole stone or a half, flat on
    //    its bed or on its face, turned as it fell, 0.3 to 3.4 m in from the wall's face (its middle 1.3 m and
    //    more inside the gap's two ends); one in four lies on the stone dealt before it; by each a small stone or two. By the
    //    deal's own ranges no stone of them comes nearer the hall's axis than 7.9 m and no small stone than 6.7 m
    //    (the hall is 14 m to either hand). One that would lie in another, or on what stands free in the hall (a lion's
    //    block), is not there; its draws are taken. Nothing leans, and nothing of it is a figure's piece.
    // No bird's round is dealt in this hall and none comes this low; the plan keeps the stones for the counts
    if (o.gapstone) { const rs = o.gapstone, G = v.gap, D = WALL_DEEP, CH = ASHLAR.h, SL = ASHLAR.l, aG = [v.a0 + G.i0 * v.bay, v.a0 + (G.i0 + G.h.length) * v.bay], fl = (a) => v.fl(a, xw);
      const X = (d) => xw + sg * d, IN = [-sg, 0, 0], low = []; P.gapStone = { teeth: 0, tops: 0, blocks: [] };
      // (one stone or run of a course: along the hall from b0 to b1, y0 to y1, the wall's depth d0 to d1; the face it
      // turns to the hall, its top, its underside where it stands over air, and its bare ends: 1 the nearer, -1 the further)
      const stone = (b0, b1, y0, y1, d0, d1, ends, under) => { const lo = Math.min(b0, b1), hi = Math.max(b0, b1);
        g.quad([X(d0), y0, -lo], [X(d0), y0, -hi], [X(d0), y1, -hi], [X(d0), y1, -lo], IN);
        g.quad([X(d0), y1, -lo], [X(d0), y1, -hi], [X(d1), y1, -hi], [X(d1), y1, -lo], [0, 1, 0], MARBLE, 0, [0.9, 0.9, 0.7, 0.7]);
        if (under) g.quad([X(d0), y0, -lo], [X(d0), y0, -hi], [X(d1), y0, -hi], [X(d1), y0, -lo], [0, -1, 0], MARBLE, 0, [0.6, 0.6, 0.5, 0.5]);
        for (const [e, nz] of [[lo, 1], [hi, -1]]) if (ends.includes(nz)) g.quad([X(d0), y0, -e], [X(d1), y0, -e], [X(d1), y1, -e], [X(d0), y1, -e], [0, 0, nz], MARBLE, 0, [0.85, 0.6, 0.6, 0.85]); };
      // (the first joint of course k at or beyond the place a, the way dir goes: the look's own running bond)
      const joint = (k, a, dir) => { const par = 0.5 * (k % 2), m = a / SL - par; return SL * ((dir > 0 ? Math.ceil(m - 1e-9) : Math.floor(m + 1e-9)) + par); };
      [0, 1].forEach((e) => { const dir = e ? -1 : 1, aE = aG[e], yS = fl(aE + dir * 0.5 * v.bay) + G.h[e ? G.h.length - 1 : 0], yT = v.spring, R = rs.range(2.2, v.bay - SL - 0.2); let reach = R, first = null;
        for (let k = Math.floor(yS / CH + 1e-6); k * CH < yT - 1e-6; k++) { const y0 = Math.max(yS, k * CH), y1 = Math.min(yT, (k + 1) * CH), t = clamp(((y0 + y1) / 2 - yS) / (yT - yS), 0, 1);
          reach = Math.min(reach, R * Math.pow(1 - t, 1.7) * rs.range(0.7, 1.3) + 0.12); const aJ = joint(k, aE + dir * reach, dir);
          if (first === null) first = aJ;
          if (y1 - y0 > 0.02) { stone(aE, aJ, y0, y1, 0, D, [-dir], true); P.gapStone.teeth++; } }
        low.push(first); });
      for (let j = 0; j < G.h.length; j++) { const u0 = Math.max(aG[0] + j * v.bay, j === 0 ? low[0] : -1e9), u1 = Math.min(aG[0] + (j + 1) * v.bay, j === G.h.length - 1 ? low[1] : 1e9), yS = fl(aG[0] + (j + 0.5) * v.bay) + G.h[j];
        let k = Math.floor(yS / CH + 1e-6), y1 = (k + 1) * CH; if (y1 - yS < 0.3) { k++; y1 += CH; }
        for (let b0 = joint(k, u0, 1); b0 + SL <= u1 + 1e-6; b0 += SL) { const u = rs(), w = rs(); if (u >= 0.5) continue;
          stone(b0, b0 + SL, yS, y1, w < 0.75 ? 0 : D / 2, w < 0.5 || w >= 0.75 ? D : D / 2, [1, -1], false); P.gapStone.tops++; } }
      // the stones at the wall's foot (a: along the hall; d: clear of the wall's face; the eight draws of a stone, then
      // the six of its two small stones, are taken whether it lies there or not)
      const lie = []; let prev = null;
      const fallen = (a, d) => { const big = rs() < 0.6, bed = rs() < 0.7, deep = rs.range(0.6, 1.3), yaw = rs() * TAU, on = rs() < 0.25, tint = rs.range(0.9, 1), L = big ? SL : SL / 2, hh = bed ? CH : deep, dd = bed ? deep : CH, r = Math.hypot(L, dd) / 2;
        const small = [0, 1].map(() => [rs() * TAU, rs.range(0.2, 1.1), rs.range(0.12, 0.3)]), f = fl(a); let x = xw - sg * (d + r), y = f, top = false;
        if (on && prev && r <= prev.r * 1.05) { x = prev.x + 0.2 * Math.cos(yaw); a = prev.a + 0.2 * Math.sin(yaw); y = prev.top; top = true; }
        else if (lie.some((q) => Math.hypot(x - q.x, a - q.a) < r + q.r + 0.15) || P.solids.some((q) => q.y0 <= f + 1 && Math.hypot(x - q.x, -a - q.z) < q.r + r + 0.2)) return;
        const b = new Geo(); b.box(-L / 2, 0, -dd / 2, L / 2, hh, dd / 2, MARBLE, 'y', 1); g.put(b, x, y, -a, yaw, 1, tint);
        const q = { x, a, r, y0: y, top: y + hh }; P.gapStone.blocks.push(q); if (top) { prev = null; return; }
        lie.push(q); prev = q;
        // (the dark it lays on the flags beside it, away from the low sun that comes in over the stumps; a small
        // stone or two by it)
        const c = [x - sg * 0.5, f + 0.03, -a], pp = (t) => [xw - sg * Math.max(0.05, -sg * (c[0] + (r + 1.0) * Math.cos(t) - xw)), f + 0.03, c[2] + (r + 0.6) * Math.sin(t)];
        for (let k = 0; k < 10; k++) g.tri(c, pp(TAU * k / 10), pp(TAU * (k + 1) / 10), [0, 1, 0], MARBLE, 1, [0.45, 1, 1]);
        setStone(MARBLE, 2); for (const [th, ds, rr] of small) { const sx = xw - sg * Math.max(0.2 + rr, -sg * (x + (r + ds) * Math.cos(th) - xw)); ball(g, [sx, f + rr * 0.4, -(a + (r + ds) * Math.sin(th))], rr, rr * 0.7, rr * 0.85, 5, 3, 0.9); } setStone(null); };
      [0, 1].forEach((e) => { const dir = e ? -1 : 1, n = rs.int(6, 10), far = Math.abs(low[e] - aG[e]) + 2.2; for (let i = 0; i < n; i++) fallen(aG[e] + dir * (1.3 + rs() * far), rs.range(0.3, 3.4)); });
      { const n = rs.int(4, 7); for (let i = 0; i < n; i++) fallen(rs.range(aG[0] + 1.3, aG[1] - 1.3), rs.range(0.3, 2.6)); }
      yield; }
  }
  if (v.ruin) {
    // the end of the house: a great doorway whose arch is broken. Two piers stand to either hand of it (the evening
    // hand's the lower), ragged courses on their tops; of the arch only the haunches still spring from them and its
    // crown has fallen, so the opening stands open to the evening sky, and the ring stands in it. No figure stands at
    // the doorway and no giant in this hall. Every height and the two ends of the arch are draws of the end wall's
    // own stream.
    const aw = v.a1, f = UP_Y, D = 3, R = END_HW, R2 = R + 2.3, spring = f + 9, re = o.endwall;
    // (the end wall as it stands is kept for the moon's law: P.endWall: each pier's three ragged tops from the
    // doorway's jamb outward, the haunches' reaches; it takes no draw of its own)
    P.endWall = { aw, R, R2, spring, tops: [[], []], reach: [0, 0] };
    for (const s of [-1, 1]) {
      const h = s < 0 ? re.range(12, 15) : re.range(16, 20), x0 = s < 0 ? -v.W : R, x1 = s < 0 ? -R : v.W, w = (x1 - x0) / 3;
      g.box(x0, f, -(aw + D), x1, f + h, -aw, MARBLE, 'y', 1); P.solids.push({ x: (x0 + x1) / 2, z: -(aw + D / 2), r: Math.hypot((x1 - x0) / 2, D / 2), y0: f, y1: f + h + 2.6 });
      for (let i = 0; i < 3; i++) { const top = f + h + re.range(0.3, 2.6); g.box(x0 + i * w, f + h, -(aw + D), x0 + (i + 1) * w, top, -aw, MARBLE, 'y', 0.95); P.endWall.tops[s < 0 ? 0 : 1][s < 0 ? 2 - i : i] = top; }
    }
    const pt = (t, r, d) => [r * Math.cos(t), spring + r * Math.sin(t), -(aw + d)];
    const haunch = (t0, t1) => {
      const K = Math.max(1, Math.round(Math.abs(t1 - t0) / 0.15)), sg = Math.sign(t1 - t0);
      for (let k = 0; k < K; k++) {
        const a0 = lerp(t0, t1, k / K), a1 = lerp(t0, t1, (k + 1) / K), tm = (a0 + a1) / 2, nn = [Math.cos(tm), Math.sin(tm), 0], sh = k % 2 ? 0.9 : 1;
        g.quad(pt(a0, R, -0.12), pt(a1, R, -0.12), pt(a1, R, D + 0.12), pt(a0, R, D + 0.12), [-nn[0], -nn[1], 0], MARBLE, 0, [0.7, 0.7, 0.5, 0.5]);
        g.quad(pt(a0, R2, -0.12), pt(a1, R2, -0.12), pt(a1, R2, D + 0.12), pt(a0, R2, D + 0.12), nn, MARBLE, 0, [0.95, 0.95, 0.8, 0.8]);
        g.quad(pt(a0, R, -0.12), pt(a1, R, -0.12), pt(a1, R2, -0.12), pt(a0, R2, -0.12), [0, 0, 1], MARBLE, 0, [sh, sh, sh, sh]);
        g.quad(pt(a0, R, D + 0.12), pt(a1, R, D + 0.12), pt(a1, R2, D + 0.12), pt(a0, R2, D + 0.12), [0, 0, -1], MARBLE, 0, [0.8, 0.8, 0.8, 0.8]);
      }
      g.quad(pt(t1, R, -0.12), pt(t1, R2, -0.12), pt(t1, R2, D + 0.12), pt(t1, R, D + 0.12), [-Math.sin(t1) * sg, Math.cos(t1) * sg, 0], MARBLE, 0, [0.85, 0.85, 0.7, 0.7]);
    };
    // each haunch is a short stub that springs from its pier's own face and ends in a broken face before it has
    // left the pier's height: the seaward to 24 to 34 degrees, the evening hand's to 17 to 26. Nothing of the arch
    // hangs in the sky; the crown between them is gone
    { const t0 = re.range(0.42, 0.6), t1 = re.range(0.3, 0.45); haunch(0, t0); haunch(Math.PI, Math.PI - t1); P.endWall.reach = [t1, t0];
      for (const [sg, t] of [[1, t0], [-1, t1]]) P.solids.push({ x: sg * (R + R2 * Math.cos(t)) / 2, z: -(aw + D / 2), r: (R2 - R * Math.cos(t)) / 2 + D / 2, y0: spring - 1, y1: spring + R2 * Math.sin(t) }); }
    // beyond the doorway the sea of cloud lies on (the same plane at the same height, P.cloudY, 9 m under the
    // pavement: cloudInto lays it with the cloud hall's extras), and out of it stand four far halls of
    // the house, their arcades toward us, 150 to 380 m beyond the ring, the first two 13 to 40 m to either hand of the axis (seen beside the ring through
    // the doorway), the others 60 m and more
    // (their own stream); none stands as high in the sky as the moon
    { const rb = o.beyond, y0 = P.cloudY, fh = new Geo();
      for (let i = 0; i < 4; i++) {
        const sd = i % 2 ? 1 : -1, x0 = sd * (i < 2 ? rb.range(13, 40) : rb.range(60, 150)), w = rb.range(50, 120), A = P.end + rb.range(150, 380), h = rb.range(30, 58), nbb = Math.max(3, Math.round(w / 15)), bw = w / nbb, xa = sd > 0 ? x0 : x0 - w;
        fh.box(xa, y0 - 6, -(A + 40), xa + w, y0 + h, -A, MARBLE, 'yZ', 1);
        const M = (u, y, dd) => [u, y, -(A + dd)];
        for (let j = 0; j < nbb; j++) { const u0 = xa + j * bw; archInto(fh, M, [0, 0, 1], [1, 0, 0], u0, u0 + bw, y0 - 6, y0 + h, u0 + bw / 2, bw * 0.32, y0 - 6, y0 + h * 0.62 - bw * 0.32, { depth: 4, noSill: true, K: 6, dark: 0.5, back: { col: MARBLE, sh: [0.22, 0.16] } }); }
        if (rb() < 0.5) { const tx = xa + w * rb.range(0.25, 0.75), th = rb.range(14, 30); fh.box(tx - 7, y0 + h, -(A + 27), tx + 7, y0 + h + th, -(A + 13), MARBLE, 'y', 0.98); }
      }
      // and beyond the landward wall's breaches, out over the same sea of cloud: five more, 110 to 400 m off, their
      // arcades toward the hall, some with a tower (the same stream, drawn after the four)
      for (let i = 0; i < 5; i++) {
        const d = rb.range(110, 400), a = v.a0 + rb.range(-0.1, 1.5) * v.L, w = rb.range(24, 60), len = rb.range(50, 130), h = rb.range(26, 62), x = -v.W - d, nbb = Math.max(3, Math.round(len / 14)), bw = len / nbb;
        fh.box(x - w, y0 - 6, -a - len / 2, x, y0 + h, -a + len / 2, MARBLE, 'Xy', 1);
        const M = (u, y, dd) => [x - dd, y, -u];
        for (let j = 0; j < nbb; j++) { const u0 = a - len / 2 + j * bw; archInto(fh, M, [1, 0, 0], [0, 0, -1], u0, u0 + bw, y0 - 6, y0 + h, u0 + bw / 2, bw * 0.32, y0 - 6, y0 + h * 0.62 - bw * 0.32, { depth: 4, noSill: true, K: 6, dark: 0.5, back: { col: MARBLE, sh: [0.22, 0.16] } }); }
        if (rb() < 0.6) { const th = rb.range(20, 50), tx = x - w * 0.5, ta = a + rb.range(-0.3, 0.3) * len; fh.box(tx - 7, y0 + h, -ta - 7, tx + 7, y0 + h + th, -ta + 7, MARBLE, 'y', 0.98); }
      }
      // AND THE HOUSE GOES ON: rank behind rank to the horizon, halls with no end to them, each rank paler with the
      // air before it (the far halls' own law in the look). Two more ranks on the landward hand, 450 to 690 m and
      // 760 to 960 m off, each hall longer and higher than the near ones, spread from before the cloud hall's fallen
      // bays to far beyond the ring; and two ranks across the way beyond the ring at the same distances (the ranks'
      // own stream; these are too far for an arcade to be read and have none)
      { const rk = o.ranks, aA = P.cl.a0 - 200, aB = P.end + 500;
        for (let k = 0; k < 2; k++) { const n = 6 + k;
          for (let i = 0; i < n; i++) {
            const d = k ? rk.range(760, 960) : rk.range(450, 690), len = rk.range(110, 240), w = rk.range(40, 90), h = rk.range(34, 80) * (1 + 0.25 * k), a = lerp(aA, aB, (i + rk()) / n), x = -v.W - d;
            fh.box(x - w, y0 - 6, -a - len / 2, x, y0 + h, -a + len / 2, MARBLE, 'xy', 0.92);
            if (rk() < 0.5) { const th = rk.range(24, 60), ta = a + rk.range(-0.3, 0.3) * len; fh.box(x - w * 0.5 - 9, y0 + h, -ta - 9, x - w * 0.5 + 9, y0 + h + th, -ta + 9, MARBLE, 'y', 0.9); }
            const xx = lerp(-760, 760, (i + rk()) / n), A = P.end + d + 80, l2 = rk.range(110, 240), h2 = rk.range(34, 80) * (1 + 0.25 * k);
            fh.box(xx - l2 / 2, y0 - 6, -(A + 60), xx + l2 / 2, y0 + h2, -A, MARBLE, 'zy', 0.92);
          } } }
      for (let i = 0; i < fh.x.length; i += 3) fh.x[i] = 7;
      g.put(fh, 0, 0, 0);
    }
    yield;
    // of the fallen vault two piers of the seaward wall still stand to the springing, on each a short stout stub of a
    // rib (11 to 21 degrees of its arc) that springs from the pier seen under it and ends in a broken face (their own
    // stream): by a rule of the hall, one of the piers of the wall's first half and one of its second, any pier of each
    const rr = o.ribs;
    for (const i of [rr.int(1, Math.floor(v.nb / 2)), rr.int(Math.floor(v.nb / 2) + 1, v.nb - 1)]) {
      const a = v.a0 + i * v.bay, y0 = f + Math.min(v.cut[1][i - 1], v.cut[1][Math.min(v.nb - 1, i)]), ys = v.spring, tm = rr.range(0.2, 0.36), K = 3;
      if (ys > y0) g.box(v.W - 0.34, y0, -a - 0.7, v.W + 2.6, ys, -a + 0.7, MARBLE, 'y', 1);
      const q = (t, r, dz) => [(v.W + r) * Math.cos(t), ys + (v.rise + r) * Math.sin(t), -a + dz];
      for (let k = 0; k < K; k++) {
        const t0 = tm * k / K, t1 = tm * (k + 1) / K, nn = [Math.cos((t0 + t1) / 2), Math.sin((t0 + t1) / 2), 0];
        g.quad(q(t0, 0, -0.6), q(t1, 0, -0.6), q(t1, 0, 0.6), q(t0, 0, 0.6), [-nn[0], -nn[1], 0], MARBLE, 0, [0.6, 0.6, 0.6, 0.6]); g.quad(q(t0, 1.1, -0.6), q(t1, 1.1, -0.6), q(t1, 1.1, 0.6), q(t0, 1.1, 0.6), nn);
        g.quad(q(t0, 0, 0.6), q(t1, 0, 0.6), q(t1, 1.1, 0.6), q(t0, 1.1, 0.6), [0, 0, 1]); g.quad(q(t0, 0, -0.6), q(t1, 0, -0.6), q(t1, 1.1, -0.6), q(t0, 1.1, -0.6), [0, 0, -1]);
      }
      g.quad(q(tm, 0, -0.6), q(tm, 1.1, -0.6), q(tm, 1.1, 0.6), q(tm, 0, 0.6), [-Math.sin(tm), Math.cos(tm), 0], MARBLE, 0, [0.8, 0.8, 0.8, 0.8]);
      P.solids.push({ x: (v.W + 1.1 + v.W * Math.cos(tm)) / 2, z: -a, r: (v.W + 1.1 - v.W * Math.cos(tm)) / 2 + 0.6, y0: ys - 1, y1: ys + (v.rise + 1.1) * Math.sin(tm) });
    }
    // where the landward wall is breached its ends are ragged steps: three courses stepping down to either side of
    // each breach (by rule: 0.72, 0.46 and 0.22 of the fall from the standing wall beside it)
    const brs = []; v.cut[0].forEach((hb, b) => { if (hb < 5) brs.push(b); });
    for (const b of brs) for (const e of [-1, 1]) {
      const hb = v.cut[0][b], hn = v.cut[0][b + e]; if (!(hn > hb + 2)) continue;
      const aE = v.a0 + (e < 0 ? b : b + 1) * v.bay, wk = v.bay * 0.13;
      [0.72, 0.46, 0.22].forEach((q, k) => { const a0 = aE - e * k * wk, a1 = aE - e * (k + 1) * wk; g.box(-v.W - 2.6, f + hb, -Math.max(a0, a1), -v.W, f + hb + (hn - hb) * q + (k % 2) * 0.25, -Math.min(a0, a1), MARBLE, 'y', 0.97 - 0.03 * k); });
    }
    // what fell lies as RUBBLE: ten to sixteen heaps and never thirteen (the count is the heaps' stream's first draw),
    // each a drift of small stones with broken drums, slabs and capitals half sunk in it, seated on the pavement with
    // a dark under it that reaches away from the low sun. The first lie at the feet of the breaches, one to a
    // breach, hard under the broken wall (in the last bay too, against the end wall); the others where they fell,
    // the drift 6 m and more from the axis and 8 m before the end wall, a stray stone to 5.94 m of the axis (seeds 1 to 100)
    const r = o.blocks, nh = [10, 11, 12, 14, 15, 16][r.int(0, 5)]; P.heaps = [];
    for (let i = 0; i < nh; i++) {
      const foot = i < brs.length, sd = foot ? -1 : r.sign(), R0 = r.range(1.8, 3.4), x = foot ? -(v.W - 0.4 - R0) : sd * r.range(6 + R0 * 1.3, v.W - 0.6 - R0), a = foot ? v.a0 + (brs[i] + 0.5) * v.bay + r.range(-1.2, 1.2) : r.range(v.a0 + 4, v.a1 - 8 - R0), h = new Geo(), k0 = g.p.length; setStone(MARBLE, 2); rubbleInto(h, r, R0); setStone(null);
      g.put(h, x, f, -a, r() * TAU, 1, 1);
      const c = [x + 1.2, f + 0.03, -a], rx = R0 * 1.5 + 2.2, rz = R0 * 1.45, pp = (t) => [Math.min(v.W - 0.05, c[0] + rx * Math.cos(t)), f + 0.03, c[2] + rz * Math.sin(t)];
      for (let k = 0; k < 12; k++) g.tri(c, pp(TAU * k / 12), pp(TAU * (k + 1) / 12), [0, 1, 0], MARBLE, 1, [0.36, 1, 1]);
      // (the heap as it lies, its stone and the dark painted on the flags beside it, 0.03 m over them, is kept for
      // what sits on it: heapTop, heapOver. The dark reaches R0 * 1.5 + 3.4 m from the heap's middle at the most)
      P.heaps.push({ x, z: -a, R: R0, reach: R0 * 1.5 + 3.4, p: g.p.slice(k0) });
      if (i % 4 === 3) yield;
    }
    yield;
    // fragments of fallen statues, by chance (their own stream): none, a torso, or a torso and an open hand, each
    // where it fell, to 4.38 m of the axis (the torso; the hand 5.97) and 10.7 m of the end wall (seeds 1 to 100). None stands
    if (o.fallen) { fallenInto(g, P, v, o.fallen); yield; }
    const rf = o.frag, nf = rf.int(0, 2);
    for (let i = 0; i < nf; i++) {
      const b = new Geo(), sd = rf.sign(), x = sd * rf.range(7.5, 11), a = rf.range(v.a0 + 10, v.a1 - 12), yw = rf() * TAU;
      if (i === 0) { torsoInto(b); tiltX(b, -1.45 + rf.range(-0.15, 0.15)); g.put(b, x, f + 0.55, -a, yw, 4.6, 0.97); }
      else { handInto(b); tiltX(b, rf.range(-0.08, 0.08)); g.put(b, x, f + 0.25, -a, yw, 7, 0.97); }
      const c = [x + 0.8, f + 0.03, -a], pp = (t) => [Math.min(v.W - 0.05, c[0] + 3.6 * Math.cos(t)), f + 0.03, c[2] + 2.4 * Math.sin(t)];
      for (let k = 0; k < 12; k++) g.tri(c, pp(TAU * k / 12), pp(TAU * (k + 1) / 12), [0, 1, 0], MARBLE, 1, [0.4, 1, 1]);
      (P.frags = P.frags || []).push([x, -a]);
    }
    yield;
    // WHAT FELL FROM THE VAULT OVER THE HALL'S END LIES WHERE IT FELL (the strewn stones' own stream): single stones
    // on the flags of the hall's last STREWN.len m, by rules of the place that hold on every seed: none in the
    // ring's own bay (the hall's last: a stone and its shadow end STREWN.bay m and more before the end wall, so
    // none lies on the rooks' strip); every stone's whole reach STREWN.off m and more from the axis (the way to the
    // ring lies open) and 3 m from either wall's face; UNLIKE ON THE TWO HANDS: on the seaward hand, under the piers
    // whose ribs still stand, six to nine drums and capitals of fallen ribs; on the evening hand two to four slabs
    // of the vault's web; THINNING TOWARD THE DOORWAY (a stone's distance from the end wall is dealt so that twice
    // as far out there lie twice as many); none on a heap, on a fragment or on another stone (a place that is
    // taken is dealt anew, STREWN.tries places, then the stone is not there). No stone stands higher than
    // STREWN.top m: under every bird's round (which keeps a metre and a wing over the pavement) and far under the
    // lens. Sand has drifted against each on its evening side. A stone the moon reaches (moonReaches: the moon's
    // own law) throws its shadow along the flags away from the moon, as long as the moon's height makes it;
    // another has only the dark under it
    if (o.strewn) { const rs = o.strewn, Q = STREWN, M = MOON_DIR, ml = Math.hypot(M[0], M[2]), mx = -M[0] / ml, mz = -M[2] / ml; P.strewn = [];
      const taken = (x, z, rr) => P.heaps.some((h) => Math.hypot(x - h.x, z - h.z) < h.R * 1.35 + rr + 0.5) || (P.frags || []).some((q) => Math.hypot(x - q[0], z - q[1]) < 3 + rr) || P.strewn.some((q) => Math.hypot(x - q.x, z - q.z) < q.r + rr + 0.6);
      for (const [sd, n] of [[1, rs.int(6, 9)], [-1, rs.int(2, 4)]]) for (let i = 0; i < n; i++) for (let t = 0; t < Q.tries; t++) {
        // (every try takes the same seven draws: its kind, its measures, its place, its turn)
        const kd = rs(), m1 = rs(), m2 = rs(), ud = rs(), ux = rs(), yw = rs() * TAU, tl = rs() - 0.5, b = new Geo(); let rr, top, y = 0;
        setStone(MARBLE, 2);
        if (sd < 0) { const w = lerp(1.4, 2.6, m1), dd = lerp(0.9, 1.6, m2), hh = 0.22 + 0.18 * kd; b.box(-w / 2, -hh / 2, -dd / 2, w / 2, hh / 2, dd / 2, MARBLE, '', 0.95); tiltX(b, tl * 0.5); rr = Math.hypot(w, dd) / 2; y = hh * 0.3 + dd * 0.5 * Math.abs(Math.sin(tl * 0.5)); top = y + hh * 0.5 + dd * 0.5 * Math.abs(Math.sin(tl * 0.5)); }
        else if (kd < 0.68) { const r0 = lerp(0.3, 0.45, m1), L = lerp(0.7, 1.4, m2); tube(b, [0, 0, -L / 2], [0, 0, L / 2], r0, r0, 10, 0.95); for (const e of [-1, 1]) ball(b, [0, 0, e * L / 2], r0, r0, 0.04, 8, 3, 0.8); tiltX(b, tl * 0.16); rr = Math.hypot(L / 2, r0); y = r0 * 0.9; top = y + r0 + L * 0.5 * Math.abs(Math.sin(tl * 0.16)); }
        else { const k = lerp(0.8, 1, m1); b.box(-0.56 * k, 0, -0.56 * k, 0.56 * k, 0.2 * k, 0.56 * k, MARBLE, '', 0.95); tube(b, [0, 0.2 * k, 0], [0, 0.62 * k, 0], 0.5 * k, 0.3 * k, 8, 0.92, 0.85); tube(b, [0, 0.62 * k, 0], [0, 0.82 * k + 0.1 * m2, 0], 0.29 * k, 0.29 * k, 8, 0.9); ball(b, [0, 0.82 * k + 0.1 * m2, 0], 0.29 * k, 0.03, 0.29 * k, 8, 2, 0.7); tiltX(b, tl * 0.12); rr = 0.8 * k; y = 0.02; top = 0.95 * k; }
        setStone(null);
        const d0 = Q.bay + rr + 0.7, dist = d0 + (Q.len - d0) * Math.sqrt(ud), x = sd * lerp(Q.off + rr, v.W - 3 - rr, ux), z = -(v.a1 - dist);
        if (top > Q.top || taken(x, z, rr)) continue;
        g.put(b, x, f + y, z, yw, 1, 0.92 + 0.08 * m2);
        // the sand drifted against it on its evening side, in the sand's own colour
        { const sn = new Geo(); setStone([0.47, 0.38, 0.26]); ball(sn, [0, 0, 0], rr * 0.85, 0.1 + 0.1 * rr, rr * 0.7, 8, 3, 0.95); setStone(null); g.put(sn, x - rr * 0.55, f + 0.01, z, yw * 0.3, 1, 1); }
        // its shadow, or the dark under it (a fan on the flags, 0.02 m over them)
        const lit = moonReaches(P, x, f + top * 0.6, z), Ls = lit ? top / M[1] * ml : 0, c = [x + mx * (rr * 0.2 + Ls * 0.5), f + 0.02, z + mz * (rr * 0.2 + Ls * 0.5)], ra = rr * 0.8 + Ls * 0.5 + 0.3, rb = rr * 0.85 + 0.2;
        const pp = (q) => [c[0] + mx * ra * Math.cos(q) - mz * rb * Math.sin(q), f + 0.02, c[2] + mz * ra * Math.cos(q) + mx * rb * Math.sin(q)];
        for (let k = 0; k < 12; k++) g.tri(c, pp(TAU * k / 12), pp(TAU * (k + 1) / 12), [0, 1, 0], MARBLE, 1, [lit ? 0.4 : 0.55, 1, 1]);
        P.strewn.push({ x, z, r: rr, top, hand: sd, lit, far: dist, sh: ra + Math.hypot(c[0] - x, c[2] - z) });
        break;
      }
    }
  }
}
// ---------------------------------------------------------------- the one standing sky (seen only where the house is open)
export function makeSky() {
  const mat = new THREE.ShaderMaterial({ uniforms: { uTime: { value: 0 } }, side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: /* glsl */`varying vec3 vD; void main() { vD = position; vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.); if (abs(p.w) < 1e-4) p.w = 1e-4; gl_Position = p; }`,
    fragmentShader: /* glsl */`varying vec3 vD; uniform float uTime;
float h3(vec3 p) { p = fract(p * 0.3183099 + .1); p *= 17.; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
void main() {
  vec3 d = normalize(vD); float h = d.y; vec2 hz = d.xz / max(length(d.xz), 1e-3);
  float toSun = clamp(dot(hz, vec2(-0.99, -0.12)), -1., 1.);
  vec3 hor = mix(vec3(0.3, 0.28, 0.46), vec3(1.9, 1.0, 0.42), smoothstep(-0.3, 1., toSun));
  vec3 col = mix(hor, vec3(0.14, 0.2, 0.42), smoothstep(0.0, 0.34, h)); col = mix(col, vec3(0.03, 0.055, 0.16), smoothstep(0.25, 0.85, h));
  vec3 q = d * 150., c = floor(q), f = fract(q) - .5; float st = step(0.988, h3(c)) * smoothstep(0.3, 0.05, length(f));
  col += vec3(1.5, 1.6, 1.9) * st * (0.6 + 0.4 * sin(uTime * 2. + h3(c + 3.) * 40.)) * smoothstep(0.08, 0.4, h);
  // the moon. It is fixed in the sky. Where it stands is a rule of the place: down the last hall's length (the hall
  // runs to -z), 8 degrees to the seaward hand, which is the hand away from the low sun that gilds the seaward wall
  // from the landward side, and 21 degrees up, which is over the end piers from the hall's door. As the eye comes down
  // the hall the broken arch rises against it by parallax alone: the moon then stands in the gap where the arch's
  // crown has fallen (the seaward haunch ends at 34 degrees at the most, the moon's sight line crosses the arch's
  // ring at 65 and more), and it is only behind the ring itself in the last 15 m
  vec3 M = normalize(vec3(${MOON_DIR.map((q) => q.toFixed(4)).join(', ')})); float md = dot(d, M);
  col += vec3(2.6, 2.5, 2.2) * smoothstep(0.99955, 0.9997, md) + vec3(0.35, 0.38, 0.5) * pow(clamp(md, 0., 1.), 220.);
  col = mix(col, vec3(0.34, 0.3, 0.4), smoothstep(0.02, -0.15, h));
  gl_FragColor = vec4(col, 1.);
}` });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1900, 24, 16), mat); mesh.frustumCulled = false; mesh.renderOrder = -1;
  return { mesh, mat };
}
// ---------------------------------------------------------------- the sea: the flooded hall's swell, the tides of the sea doors
const gridGeo = (x0, x1, a0, a1, nx, na, yOf) => {
  const p = [], ix = [];
  for (let j = 0; j <= na; j++) for (let i = 0; i <= nx; i++) { const x = lerp(x0, x1, i / nx), a = lerp(a0, a1, j / na); p.push(x, yOf ? yOf(x, a) : 0, -a); }
  for (let j = 0; j < na; j++) for (let i = 0; i < nx; i++) { const k = j * (nx + 1) + i; ix.push(k, k + 1, k + nx + 2, k, k + nx + 2, k + nx + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setIndex(ix); g.computeBoundingSphere(); return g;
};
// the swell's height (metres over the mean) at a place and a clock: three long waves, 0.34 m at most. The count replays it.
export const SWELL = 0.34;
const SWELL_GLSL = /* glsl */`
float swell(vec2 p, float t) { return 0.16 * sin(p.y * 0.21 + t * 0.8) + 0.1 * sin(p.x * 0.33 - p.y * 0.12 + t * 0.6 + 1.7) + 0.08 * sin(p.x * 0.19 + p.y * 0.4 - t * 1.1); }`;
// one seaward door's wave over the pavement, by the world clock alone. D: the door's place along the spine, its period,
// its phase, its reach. q: (x, a) of a point of the pavement. Returns thickness in metres, foam, cover.
export const TIDE = { run: 0.42, hold: 0.42, thick: 0.75, len: 30 };
const WAVE_GLSL = /* glsl */`
uniform vec4 uDoor[8]; uniform float uND; uniform float uW;
vec3 wave(vec2 q, vec4 D, float t) {
  float ph = fract(t / D.y + D.z), dx = uW - q.x, dz = q.y - D.x;
  float run = clamp(ph / ${TIDE.run}, 0., 1.); run = 1. - (1. - run) * (1. - run);
  float back = clamp((ph - ${TIDE.hold}) / ${(1 - TIDE.hold).toFixed(2)}, 0., 1.); back = back * back * (3. - 2. * back);
  float R = ${TIDE.len.toFixed(1)} * D.w * run * (1. - back) + 0.6, Wd = 4.4 + 0.42 * R;
  float e = sqrt(max(dx * dx / (R * R) + dz * dz / (Wd * Wd), 0.));
  if (dx < 0.) e = abs(dz) / 4.2 * 0.7;
  float s = 1. - e, cover = smoothstep(0., 0.04, s), front = smoothstep(0.2, 0.02, s) * cover * step(0., dx);
  float thick = cover * (0.1 + 0.45 * front * (1. - back)) * (1. - 0.6 * back);
  return vec3(thick, front * (1. - 0.6 * back), cover * (1. - 0.35 * back));
}`;
export async function tideInto(ctx, scene, P, look, r, o) {
  const sea = P.sea, hero = P.hero, H = look.H, U = look.uniforms, n3 = (a) => new THREE.Vector3(a[0], a[1], a[2]);
  const st = P.st, run = sea.s1 - sea.s0, w1 = sea.s0 + run * (SEA_Y / LOW_Y) - 1.2, w2 = st.s1;
  const uni = { ...U, uTide: { value: n3(H.tide) }, uSt: { value: new THREE.Vector4(sea.s0, sea.s1, st.s0, st.s1) }, uStS: { value: new THREE.Vector4(st.run, st.land, st.SW, st.CW) }, uWd: { value: new THREE.Vector3(sea.W, st.W, st.a0 - WT / 2) }, uMode: { value: 0 } };
  const VS = LOOK_COMMON + SWELL_GLSL + /* glsl */`
uniform float uMode; varying vec3 vW;
void main() { vec4 w = modelMatrix * vec4(position, 1.); w.y += swell(w.xz, uTime) * (1. + uMode * 1.2); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
  const FS = LOOK_COMMON + SWELL_GLSL + /* glsl */`
uniform vec3 uTide; uniform vec4 uSt; uniform vec4 uStS; uniform vec3 uWd; uniform float uMode; varying vec3 vW;
void main() {
  float a = -vW.z, t = uTime; vec4 zw = zoneW(a); vec2 p = vW.xz;
  vec3 toEye = cameraPosition - vW; float dist = length(toEye); vec3 E = toEye / max(dist, 1e-3);
  float e = 0.35; float h0 = swell(p, t), hx = swell(p + vec2(e, 0.), t), hz = swell(p + vec2(0., e), t);
  float r1 = vn(vec3(p * 0.9 + vec2(t * 0.25, t * 0.1), t * 0.3)), r2 = vn(vec3(p * 2.3 - vec2(t * 0.3, 0.), t * 0.5));
  vec3 n = normalize(vec3(-(hx - h0) / e * (1. + uMode) - (r1 - .5) * 0.5 - (r2 - .5) * 0.3, 1., -(hz - h0) / e * (1. + uMode) - (r2 - .5) * 0.5 + (r1 - .5) * 0.3));
  vec3 key = mix(uKey[1], uKey[0], uMode), sky = mix(uSky[1], uSky[0] * 2.6, uMode), glass = mix(uGlass[1], uGlass[0], uMode);
  float fr = 1. - clamp(dot(n, E), 0., 1.); fr = 0.04 + 0.75 * fr * fr * fr;
  // how deep the pavement lies under this point (the stairs go down into it)
  float fl = ${LOW_Y.toFixed(1)};
  if (a < uSt.y) fl *= clamp((a - uSt.x) / (uSt.y - uSt.x), 0., 1.);
  else if (a > uSt.z && abs(vW.x) < uStS.z) { float ts = a - uSt.z, seg = uStS.x + uStS.y, ks = clamp(floor(ts / seg), 0., 2.); fl *= 1. - (ks + clamp((ts - ks * seg) / uStS.x, 0., 1.)) / 3.; }
  float depth = mix(uSeaY - fl, 6., uMode);
  vec3 deep = uTide * (0.75 + 0.4 * r1), shal = uTide * 1.6 + vec3(0.03, 0.045, 0.04);
  vec3 col = mix(shal, deep, clamp(depth / 3.5, 0., 1.)) * (key * 0.9 + sky * 1.5);
  vec3 rf = reflect(-E, n); float wr = winAt(vW, rf);
  vec3 refl = mix(sky * 0.75 + key * 0.1 + vec3(0.02), uOut * vec3(0.5, 0.64, 0.8), uMode) * (0.8 + 0.6 * n.x + 0.5 * n.z) + glass * 1.0 * wr;
  col = mix(col, refl, fr);
  float sp = clamp(dot(rf, normalize(mix(uDir[1], uSun, uMode))), 0., 1.); sp *= sp; sp *= sp; sp *= sp; col += key * sp * sp * (0.5 + 1.6 * uMode);
  float wdh = a > uWd.z ? uWd.y : uWd.x, wall = smoothstep(wdh - 2.2 - 1.2 * r1, wdh - 0.2, abs(vW.x)) * (1. - uMode);
  float shore = (1. - smoothstep(0.1, 1.3 + 0.6 * r1, depth)) * (1. - uMode);
  float lace = smoothstep(0.7, 0.86, vn(vec3(p * 0.55 + vec2(0., t * 0.35), t * 0.12)) * 0.6 + r2 * 0.4);
  float foam = clamp(wall * (0.35 + 0.65 * smoothstep(0.35, 0.65, r2)) + shore * (0.5 + 0.5 * r2) + lace * (0.3 + 0.3 * uMode) + uMode * smoothstep(0.2, 0.34, h0) * 0.6, 0., 1.);
  col = mix(col, vec3(0.9, 0.95, 0.93) * (key * 0.8 + sky * 2.2), foam);
  col += uGlow * vec3(0.03, 0.3, 0.26) * (foam * 0.9 + lace * 0.3);
  float alpha = mix(mix(0.3, 0.97, clamp(depth / 1.5, 0., 1.)), 1., max(foam, uMode));
  vec4 fog = mix(zw.x * uFog[0] + zw.y * uFog[1] + zw.z * uFog[2] + zw.w * uFog[3], vec4(uOut * vec3(0.3, 0.44, 0.58), 0.003), uMode);
  float fd = mix(0.5 * (fog.a + uEyeFog.a), fog.a, uMode); col = mix(col, mix(0.5 * (fog.rgb + uEyeFog.rgb), fog.rgb, uMode), 1. - exp(-fd * dist));
  gl_FragColor = vec4(col, alpha);
}`;
  const seaMat = new THREE.ShaderMaterial({ uniforms: uni, vertexShader: VS, fragmentShader: FS, transparent: true, depthWrite: false });
  const seaMesh = new THREE.Mesh(gridGeo(-sea.W - 2, sea.W + 2, w1, sea.a1 + WT, 32, Math.round((sea.a1 + WT - w1) / 1.2), () => SEA_Y), seaMat); seaMesh.renderOrder = 2; scene.add(seaMesh);
  const seaMesh2 = new THREE.Mesh(gridGeo(-st.W, st.W, st.a0, st.s1, 56, Math.round((st.s1 - st.a0) / 1.4), () => SEA_Y), seaMat); seaMesh2.renderOrder = 2; scene.add(seaMesh2);
  await ctx.yield();
  // the open sea outside the seaward doors (the same water, the day's light on it)
  const outMat = new THREE.ShaderMaterial({ uniforms: { ...uni, uMode: { value: 1 } }, vertexShader: VS, fragmentShader: FS, transparent: true, depthWrite: false });
  const outMesh = new THREE.Mesh(gridGeo(hero.W + 4.5, hero.W + 90, hero.a0 - 160, hero.a1 + 160, 24, 90, () => -2.45), outMat); outMesh.renderOrder = 1; scene.add(outMesh);
  // and on to the horizon (the same law; the far sky stands 600 m off)
  const farMesh = new THREE.Mesh(gridGeo(hero.W + 90, hero.W + 600, hero.a0 - 1000, hero.a1 + 1000, 12, 40, () => -2.45), outMat); farMesh.renderOrder = 1; scene.add(farMesh);
  await ctx.yield();
  // the tides of the sea doors: one sheet over the pavement and the outer stairs; each door's wave by the clock alone
  const doors = hero.doors, dU = [], x0 = hero.W + 2.6;
  for (let k = 0; k < 8; k++) { const d = doors[Math.min(k, doors.length - 1)]; dU.push(new THREE.Vector4(d.a, d.T, d.ph, d.reach)); }
  const tU = { ...uni, uDoor: { value: dU }, uND: { value: doors.length }, uW: { value: hero.W } };
  const TVS = LOOK_COMMON + WAVE_GLSL + /* glsl */`
varying vec3 vW;
void main() { vec4 w = modelMatrix * vec4(position, 1.); vec2 q = vec2(w.x, -w.z); float th = 0.;
  for (int k = 0; k < 8; k++) { if (float(k) < uND) th = max(th, wave(q, uDoor[k], uTime).x); }
  w.y += th; vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
  const TFS = LOOK_COMMON + WAVE_GLSL + /* glsl */`
uniform vec3 uTide; varying vec3 vW;
void main() {
  float a = -vW.z, t = uTime; vec2 q = vec2(vW.x, a);
  float cover = 0., foam = 0., thick = 0., runnel = 0.;
  for (int k = 0; k < 8; k++) { if (float(k) < uND) {
    vec4 D = uDoor[k]; vec3 wv = wave(q, D, t); cover = max(cover, wv.z); foam = max(foam, wv.y); thick = max(thick, wv.x);
    float ph = fract(t / D.y + D.z), back = smoothstep(0.5, 0.72, ph);
    runnel = max(runnel, wv.z * back * smoothstep(0.5, 0.72, vn(vec3(q.x * 0.8 - t * 1.2, q.y * 0.8, D.x))));
  } }
  if (cover < 0.01) discard;
  vec2 qw = q + 1.7 * vec2(vn(vec3(q * 0.37, t * 0.21)) - .5, vn(vec3(q.yx * 0.37 + 5.3, t * 0.17)) - .5), qr = vec2(qw.x * 0.83 - qw.y * 0.56, qw.x * 0.56 + qw.y * 0.83);
  float n1 = vn(vec3(qr * 1.2, t * 0.5)), n2 = vn(vec3(qr.yx * 3.1 + vec2(t * 0.4, 0.), t * 0.8));
  // foam as a surface: broad patches of lace with holes in them, densest at a wave's front and where the sheet is thick
  float n4 = vn(vec3(qr * 0.42 + 9., t * 0.16)), holes = smoothstep(0.34, 0.6, n2) * smoothstep(0.3, 0.55, n1);
  float lace = smoothstep(0.42, 0.6, n4 * 0.6 + n1 * 0.4) * (1. - 0.75 * holes);
  float porch = step(uW + 2.6, q.x);
  float fm = clamp(foam * (0.42 + 0.4 * n1) * (1. - 0.8 * holes) * smoothstep(0.26, 0.6, n4) + lace * (0.05 + thick * 0.8) + runnel * 0.3 * (1. - 0.6 * holes) + porch * (0.3 + 0.5 * smoothstep(0.35, 0.65, n1)), 0., 1.);
  vec3 toEye = cameraPosition - vW; float dist = length(toEye); vec3 E = toEye / max(dist, 1e-3);
  vec3 n = normalize(vec3((n1 - .5) * 0.5, 1., (n2 - .5) * 0.5));
  vec3 key = uKey[0], sky = uSky[0], lit = key * 0.5 + sky * 2. + uBar[0] * winAt(vW, uSun) * 0.8;
  float fr = 1. - clamp(dot(n, E), 0., 1.); fr = 0.05 + 0.7 * fr * fr * fr;
  vec3 col = mix(uTide * 1.5 * lit, key * 0.22 + sky * 1.5 + uGlass[0] * 0.45 * winAt(vW, reflect(-E, n)), fr);
  col = mix(col, vec3(0.9, 0.95, 0.94) * lit, fm);
  col += uGlow * vec3(0.03, 0.34, 0.28) * fm;
  float alpha = cover * mix(0.45 + 0.4 * clamp(thick / 0.3, 0., 1.), 1., fm);
  float fd = 0.5 * (uFog[0].a + uEyeFog.a); col = mix(col, 0.5 * (uFog[0].rgb + uEyeFog.rgb), 1. - exp(-fd * dist));
  gl_FragColor = vec4(col, alpha);
}`;
  const tMat = new THREE.ShaderMaterial({ uniforms: tU, vertexShader: TVS, fragmentShader: TFS, transparent: true, depthWrite: false });
  const tMesh = new THREE.Mesh(gridGeo(-hero.W, x0 + 10.4, hero.a0, hero.a1, 44, 110, (x) => (x < x0 ? 0.03 : -(x - x0) * 0.269 + 0.38)), tMat); tMesh.renderOrder = 3; scene.add(tMesh);
  await ctx.yield();
  // spray: where a wave bursts in at its door and where it climbs the lowest tier of the far wall (thrown in the last
  // third of the sheet's run in, ending at the moment the sheet turns: TIDE.hold of its round). Each drop a throw on
  // its door's round (place, speed and moment drawn once); P.spray keeps the law's numbers for the count.
  const sp = { p: [], v: [], s: [] }, N0 = Math.round(380 * o.detail), N1 = Math.round(520 * o.detail), LIFE = 1.9;
  doors.forEach((d, k) => {
    for (let i = 0; i < N0 + N1; i++) {
      const far = i >= N0, x = far ? -hero.W + 0.5 + r() * 1.4 : hero.W - r() * 3, a = d.a + (far ? r.range(-9, 9) : r.range(-4, 4));
      sp.p.push(x, 0.35, -a); sp.v.push(far ? r.range(0.4, 2.6) : -r.range(1.2, 5), far ? r.range(4.5, 9.4) : r.range(4, 9.8), r.range(-1.6, 1.6));
      sp.s.push(k, far ? TIDE.hold * (0.66 + 0.34 * r()) : 0.3 * r() * r(), r.range(0.08, 0.3), far ? 1 : 0);
    }
  });
  P.spray = { life: LIFE, p: sp.p, v: sp.v, s: sp.s };
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(sp.p, 3)); sg.setAttribute('aV', new THREE.Float32BufferAttribute(sp.v, 3)); sg.setAttribute('aS', new THREE.Float32BufferAttribute(sp.s, 4));
  sg.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 3, -(hero.a0 + hero.a1) / 2), 70);
  const sU = { ...tU, uH: { value: 450 } };
  const sMat = new THREE.ShaderMaterial({ uniforms: sU, transparent: true, depthWrite: false,
    vertexShader: /* glsl */`uniform float uTime; uniform vec4 uDoor[8]; uniform float uH; attribute vec3 aV; attribute vec4 aS; varying float vA;
void main() { vec4 D = uDoor[int(aS.x + 0.5)]; float te = fract(uTime / D.y + D.z) * D.y, tau = te - aS.y * D.y, ok = step(0., tau) * step(tau, ${LIFE.toFixed(1)});
  vec3 p = position + aV * tau + vec3(0., -4.9 * tau * tau, 0.); p.y = max(p.y, 0.2);
  float reach = mix(1., smoothstep(0.88, 0.97, D.w), aS.w);
  vec4 mv = viewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mv; float dist = max(-mv.z, 0.1);
  vA = ok * reach * (1. - tau / ${LIFE.toFixed(1)});
  gl_PointSize = clamp(aS.z * (1. + tau * 0.9) * projectionMatrix[1][1] * uH * 0.5 / dist, 0., 64.);
  if (ok < 0.5) gl_Position = vec4(2., 2., 2., 1.); }`,
    fragmentShader: /* glsl */`uniform vec3 uKey[4]; uniform vec3 uSky[4]; uniform float uGlow; varying float vA;
void main() { vec2 c = gl_PointCoord - .5; float r2 = dot(c, c); float m = smoothstep(0.25, 0.02, r2); gl_FragColor = vec4(vec3(0.92, 0.96, 0.95) * (uKey[0] * 0.9 + uSky[0] * 2.) + uGlow * vec3(0.0, 0.3, 0.25), m * vA * 0.8); }` });
  const sPts = new THREE.Points(sg, sMat); sPts.renderOrder = 5; scene.add(sPts);
  const size = new THREE.Vector2();
  return { update() { ctx.renderer.getDrawingBufferSize(size); sU.uH.value = size.y; }, uni, w1, w2 };
}
// ---------------------------------------------------------------- light in the air, dust, cloud (the media)
// the far storm of the cloud level. Its SEATS are places of the world, drawn once from the storm's own stream, each
// over a thing of the cloud hall (the one cloud hall there is): one in the vault, between its springing and its crown,
// anywhere over the bays of the open crown (from the first open bay's line to the hall's door) and over the middle
// half of the hall's breadth; two outside the window wall, between a half and one and a half of the hall's half
// breadth beyond its face, at the height of the two upper tiers, anywhere along that wall from the stair's head to
// the hall's door. Each seat keeps its own schedule on the world
// clock: a closed round of 24 strikes whose gaps (2.2 to 5.6 s each) are drawn once from the storm's stream; the clock
// reads the round and the round comes back on itself, so no seat is ever dark for longer than 5.6 s and there is no
// first strike. What a point receives depends on where the point stands from the seats, never on the eye.
export function stormSeats(P, r) {
  const cl = P.cl, tiers = cl.bands[cl.bands.length - 2].y0, outer = () => ({ p: [cl.W * r.range(1.5, 2.5), r.range(tiers, cl.spring), -r.range(cl.s1, cl.a1)], R: r.range(40, 60), off: r.range(0, 50) });
  const seats = [{ p: [cl.W * r.range(-0.5, 0.5), r.range(cl.spring, cl.top), -r.range(cl.a0 + cl.open0 * cl.bay, cl.a1)], R: r.range(38, 52), off: r.range(0, 50) }, outer(), outer()];
  for (const q of seats) { q.at = []; let t = 0; for (let k = 0; k < 24; k++) { q.at.push(t); t += r.range(2.2, 5.6); } q.L = t; }
  return seats;
}
export function flashAt(t, q) {
  const tm = (((t + q.off) % q.L) + q.L) % q.L; let f = 0;
  for (let i = 0; i < q.at.length; i++) { let d = tm - q.at[i]; if (d < 0) d += q.L; if (d < 3) f = Math.max(f, d < 0.1 ? d / 0.1 : Math.exp(-(d - 0.1) / 0.32)); }
  return f;
}
export async function airInto(ctx, scene, P, look, forks, o) {
  const U = look.uniforms, S = U.uSun.value, V = P.V, bp = [], bt = [], dp = [], ds = [];
  // THE SUN IN THE AIR. To each window a bundle of three NARROW shafts, one to each of its upright lights (the
  // glazing bars stand 1.15 m apart): the middle one from the window's head, the two beside it from lower down, each
  // carried down the sun's way to the pavement or the far wall. A shaft is round and soft: three sheets crossed on its
  // own axis and fixed in the world (nothing of them turns to the eye), 0.84 m across at the window and a third wider
  // at its foot, brightest on the axis and fading to nothing across the outer half, thinning down its length, broken
  // by slow dust in the world's own metres. WEAK: one sheet adds at most 0.06 of the hour's bar colour (its
  // greatest part taken as one), so a shaft seen straight across adds 0.18 at the most to the stone behind it, and the
  // blend can only add light and can never reach white. The sun's STRENGTH is on the stone (the bars of the look's
  // shader), not in the air. Veiled by the air between like any stone (the fog's law); the only law of the eye is the
  // near law, 0.6 to 2.5 m of the lens. The line crosses the shafts (they stand across the hall); it flies none
  const SH_R = 0.42, bs = [], dS = [-S.x, -S.y, -S.z], e1 = norm3(cross3(dS, [0, 1, 0])), e2 = cross3(dS, e1);
  for (const w of P.wins) {
    const v = V[w.vi], nd = Math.round(34 * o.detail), sh = [], off = Math.min(1.15, w.hw - 0.5);
    for (let j = -1; j <= 1; j++) {
      const a = w.a + j * off, y = j === 0 ? w.vs + w.hw * 0.3 : lerp(w.v0, w.vs, 0.62), t = Math.min((y - w.fl - 0.05) / S.y, (2 * v.W - 0.2) / S.x);
      const A = [v.W, y, -a], B = [v.W - S.x * t, y - S.y * t, -a - S.z * t]; sh.push([A, B]);
      for (let k = 0; k < 3; k++) {
        const th = k * Math.PI / 3 + 0.3, u = [Math.cos(th) * e1[0] + Math.sin(th) * e2[0], Math.cos(th) * e1[1] + Math.sin(th) * e2[1], Math.cos(th) * e1[2] + Math.sin(th) * e2[2]];
        const P4 = [[A, -1, 0, SH_R], [A, 1, 0, SH_R], [B, 1, 1, SH_R * 1.33], [B, -1, 1, SH_R * 1.33]].map(([c, sg, tt, R]) => [c[0] + sg * R * u[0], c[1] + sg * R * u[1], c[2] + sg * R * u[2], tt, sg]);
        for (const q of [0, 1, 2, 0, 2, 3]) { bp.push(P4[q][0], P4[q][1], P4[q][2]); bt.push(P4[q][3]); bs.push(P4[q][4]); }
      }
    }
    for (let i = 0; i < nd; i++) { const r = forks.dust, [A, B] = sh[i % 3], t = r(), an = r() * TAU, rd = SH_R * (1 + 0.33 * t) * Math.sqrt(r()), cx = Math.cos(an) * rd, sx = Math.sin(an) * rd;
      dp.push(lerp(A[0], B[0], t) + cx * e1[0] + sx * e2[0], lerp(A[1], B[1], t) + cx * e1[1] + sx * e2[1], lerp(A[2], B[2], t) + cx * e1[2] + sx * e2[2]); ds.push(r() * 6.28, r.range(0.05, 0.13), r.range(0.25, 0.7)); }
  }
  // the same thin shafts under the other two openings of the house (kind 1, 2; the windows' are kind 0):
  const bk = bt.map(() => 0);
  const shaft = (A, B, R0, R1, kind) => { const d = norm3(sub3(B, A)), f1 = norm3(cross3(d, Math.abs(d[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0])), f2 = cross3(d, f1);
    for (let k = 0; k < 3; k++) { const th = k * Math.PI / 3 + 0.3, u = [Math.cos(th) * f1[0] + Math.sin(th) * f2[0], Math.cos(th) * f1[1] + Math.sin(th) * f2[1], Math.cos(th) * f1[2] + Math.sin(th) * f2[2]];
      const P4 = [[A, -1, 0, R0], [A, 1, 0, R0], [B, 1, 1, R1], [B, -1, 1, R1]].map(([c, sg, tt, R]) => [c[0] + sg * R * u[0], c[1] + sg * R * u[1], c[2] + sg * R * u[2], tt, sg]);
      for (const q of [0, 1, 2, 0, 2, 3]) { bp.push(P4[q][0], P4[q][1], P4[q][2]); bt.push(P4[q][3]); bs.push(P4[q][4]); bk.push(kind); } } };
  // THE LANTERN's: one down the middle of each spoke of its wheel, from the ring to the stone the spoke lies on (the
  // pavement, a tread or the sea), white; not the two spokes that lie in the plane of the hall's axis, where the line
  // goes (their light is on the steps; the air over the line is left clear)
  { const st = P.st, L = U.uLan.value;
    for (let k = 0; k < 12; k++) { if (k % 6 === 3) continue; const ph = TAU * k / 12, dx = Math.cos(ph), dz = Math.sin(ph); let D = L.y, B;
      for (let it = 0; it < 2; it++) { B = [L.x + 0.42 * D * dx, 0, L.z + 0.42 * D * dz]; B[1] = Math.max(st.fl(-B[2], B[0]), SEA_Y); D = L.y - B[1]; }
      shaft([L.x + 0.5 * L.w * dx, L.y, L.z + 0.5 * L.w * dz], B, 0.7, 1.9, 1); } }
  // THE OPEN CROWN's: one to each open bay of the cloud hall, down the sun's own way from the opening to the wall of
  // the landward hand, gold, as strong as the rift over it at the time (riftAt)
  { const cl = P.cl, yc = U.uCrown.value.x;
    for (let i = cl.open0; i < cl.nb; i++) { const a = cl.a0 + (i + 0.5) * cl.bay, xA = cl.W * 0.3, t = Math.min((xA + cl.W - 1) / S.x, (yc - cl.fl(a) - 0.05) / S.y);
      shaft([xA, yc, -a], [xA - S.x * t, yc - S.y * t, -a - S.z * t], 0.5, 0.95, 2); } }
  const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute(bp, 3)); bg.setAttribute('aT', new THREE.Float32BufferAttribute(bt, 1)); bg.setAttribute('aS', new THREE.Float32BufferAttribute(bs, 1)); bg.setAttribute('aK', new THREE.Float32BufferAttribute(bk, 1)); bg.computeBoundingSphere();
  const beams = new THREE.Mesh(bg, new THREE.ShaderMaterial({ uniforms: U, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcColorFactor,
    vertexShader: /* glsl */`attribute float aT; attribute float aS; attribute float aK; varying float vT; varying float vS; varying float vK; varying vec3 vW; void main() { vT = aT; vS = aS; vK = aK; vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: LOOK_COMMON + /* glsl */`varying float vT; varying float vS; varying float vK; varying vec3 vW;
void main() { vec4 zw = zoneW(-vW.z); vec3 bar = zw.x * uBar[0] + zw.y * uBar[1] + zw.z * uBar[2]; float dist = length(cameraPosition - vW);
  if (vK > 0.5 && vK < 1.5) bar = uLanK;
  float src = vK < 0.5 ? (0.56 + 0.44 * overcast(-vW.z, uTime)) * (zw.x + zw.y + zw.z) : vK < 1.5 ? 1. : riftAt(vW);
  vec4 fog = zw.x * uFog[0] + zw.y * uFog[1] + zw.z * uFog[2] + zw.w * uFog[3];
  float dustn = 0.3 + 0.7 * vn(vW * 0.9 + vec3(uTime * 0.07, -uTime * 0.05, 0.)) * (0.6 + 0.4 * vn(vW * 2.7 - vec3(0., uTime * 0.04, uTime * 0.03)));
  float pr = 1. - smoothstep(0.3, 1., abs(vS)); pr *= pr;
  float len = (0.25 + 0.75 * (1. - vT) * (1. - vT)) * smoothstep(1., 0.72, vT) * smoothstep(0., 0.03, vT);
  float k = pr * len * src * dustn * smoothstep(0.6, 2.5, dist) * exp(-0.5 * (fog.a + uEyeFog.a) * dist);
  gl_FragColor = vec4(bar / max(max(bar.r, bar.g), max(bar.b, 0.001)) * 0.06 * k, 1.); }` }));
  beams.renderOrder = 6; scene.add(beams);
  await ctx.yield();
  // dust in the beams: motes that drift a hand's breadth round their places
  const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.Float32BufferAttribute(dp, 3)); dg.setAttribute('aS', new THREE.Float32BufferAttribute(ds, 3)); dg.computeBoundingSphere();
  const dU = { ...U, uH: { value: 450 } };
  const dust = new THREE.Points(dg, new THREE.ShaderMaterial({ uniforms: dU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: LOOK_COMMON + /* glsl */`uniform float uH; attribute vec3 aS; varying vec3 vC;
void main() { vec3 p = position + vec3(sin(uTime * aS.z + aS.x), sin(uTime * aS.z * 0.7 + aS.x * 2.) * 0.6, cos(uTime * aS.z * 0.8 + aS.x)) * 0.5;
  vec4 mv = viewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mv; float dist = max(-mv.z, 0.1); vec4 zw = zoneW(-p.z);
  float px = aS.y * projectionMatrix[1][1] * uH * 0.5 / dist; gl_PointSize = clamp(px, 1.5, 12.);
  vC = (zw.x * uBar[0] + zw.y * uBar[1] + zw.z * uBar[2]) * 0.45 * min(px / 1.5, 1.) * min(px / 1.5, 1.) * smoothstep(0.6, 2.5, dist); }`,
    fragmentShader: /* glsl */`varying vec3 vC; void main() { vec2 c = gl_PointCoord - .5; gl_FragColor = vec4(vC * smoothstep(0.25, 0.0, dot(c, c)), 1.); }` }));
  dust.renderOrder = 7; scene.add(dust);
  // THE MIST of the cloud hall: cloud lies in the hall as LOW MIST in six level bands at the height of its upper
  // tiers (10.5 to 21 m over the upper pavement: the lowest 3.3 m over the line's highest point in the hall), each a
  // level sheet between the walls, fixed in the world, thinning out over the hall's last 44 m; in each the mist stands in long drifts that move down the
  // hall on the world clock at 0.8 to 2 m a second (its speed, its seed and its depth: the mist's own stream). A medium: a sheet seen along
  // itself is deep and seen straight through is thin (the one law of the eye besides the near law, 0.6 to 2.5 m of
  // the lens); it thins to nothing toward either wall (over the last 6 m) and round the colossus, who stands out of it. It is lit
  // like the stone: pearl from the open crown, gold where the sun comes down through a rift (riftAt: the gold beams
  // lie in the mist where they lie on the wall). Over the crown, 9 m above the vault's top, one more sheet: the
  // cloud's deck that the hall stands in, pearl with brighter rifts; nothing hangs in the hall as an object
  { const cl = P.cl, r = forks.mist, mp = [], ml = [], a0 = cl.a0 + 6, a1 = cl.a1 - 1, yd = cl.top + 9;
    const sheet = (y, x0, x1, b0, b1, L) => { for (const [x, a] of [[x0, b0], [x1, b0], [x1, b1], [x0, b0], [x1, b1], [x0, b1]]) { mp.push(x, y, -a); ml.push(...L); } };
    for (const h of [10.5, 12.3, 14.2, 16.3, 18.6, 21.2]) sheet(UP_Y + h, -cl.W, cl.W, a0, a1, [r.range(0, 40), r.range(0.012, 0.03) * r.sign(), r.range(0.1, 0.15), 0]);
    sheet(yd, -110, 110, cl.a0 - 30, cl.a1 + 4, [r.range(0, 40), 0.012, 9, 1]);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(mp, 3)); g.setAttribute('aL', new THREE.Float32BufferAttribute(ml, 4)); g.computeBoundingSphere();
    const hole = P.solids.find((q) => q.what === 'nest colossus') || { x: 0, z: 0, r: -9 };
    const mU = { ...U, uMist: { value: new THREE.Vector4(a0, a1, cl.W, 0) }, uHole: { value: new THREE.Vector3(hole.x, hole.z, hole.r) } };
    P.mist = { y0: UP_Y + 10.5, y1: UP_Y + 21.2, a0, a1 };
    const mist = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: mU, transparent: true, depthWrite: false, side: THREE.DoubleSide,
      vertexShader: /* glsl */`attribute vec4 aL; varying vec4 vL; varying vec3 vW; void main() { vL = aL; vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: LOOK_COMMON + /* glsl */`uniform vec4 uMist; uniform vec3 uHole; varying vec4 vL; varying vec3 vW;
void main() { float a = -vW.z, deck = vL.w; vec3 toE = cameraPosition - vW; float dist = length(toE); vec3 E = toE / max(dist, 1e-3);
  // (p1m1) A DRIFT'S EDGE IS SOFT AND IT WINDS: the drifts lie long down the hall, and an edge that ran straight
  // down it stood as one ruled line toward the far wall. So the drifts' own field is bent across the hall by a slow
  // field of the place (it moves a drift's edge to 4 m to either hand, another way every 11 m or so down the hall;
  // fixed in the world, it does not drift), and a drift thins out over twice the breadth it did
  vec3 q = vec3(a * 0.035 - uTime * vL.y * 2.4, vW.x * 0.11 + (vn(vec3(a * 0.09, vW.x * 0.05, vL.x + 7.)) - .5) * 0.9, vL.x); float d = vn(q) * 0.62 + vn(q * 2.6 + 3.) * 0.38;
  float body = mix(smoothstep(0.3, 0.78, d), 1., deck);
  float ends = smoothstep(uMist.x, uMist.x + 16., a) * (1. - smoothstep(uMist.y - 44., uMist.y - 4., a));
  float side = mix(smoothstep(uMist.z, uMist.z - 6., abs(vW.x)) * smoothstep(uHole.z, uHole.z + 3., length(vW.xz - uHole.xy)), 1., deck);
  float thick = 1. - exp(-vL.z / max(abs(E.y), 0.2));
  float rift = riftAt(vW), far = stormAt(vW);
  // (the passing cloud shades the mist as it shades the stone under the open crown: the same law, by place)
  vec3 col = uSky[2] * 2.2 + uKey[2] * (0.5 + 0.26 * d) * (1. + 0.3 * (overcast(a, uTime) - 0.8)) + uBar[2] * 0.5 * rift;
  if (deck > 0.5) { float h = vn(vec3(a * 0.02 - uTime * 0.012, vW.x * 0.02, vL.x)) * 0.6 + d * 0.4; col = mix(uSky[2] * 2.6 + uKey[2] * 0.3, uKey[2] * 0.95 + uBar[2] * 0.16, smoothstep(0.3, 0.75, h)); ends = 1. - smoothstep(uMist.y - 34., uMist.y, a); }
  col += vec3(0.6, 0.7, 1.0) * far * 0.5;
  vec4 fog = uFog[2]; col = mix(col, 0.5 * (fog.rgb + uEyeFog.rgb), (1. - exp(-0.5 * (fog.a + uEyeFog.a) * dist)) * 0.6 * (1. - deck));
  // (A SHEET SEEN EDGE ON THINS OUT (p1): where the sight runs within 6 degrees of a band's own level the band
  // fades, to nothing at half a degree; so a band's far end is never a ruled line across the wall behind it. The
  // deck over the crown is far above every eye and keeps its own law)
  float edge = mix(smoothstep(0.01, 0.1, abs(E.y)), 1., deck);
  gl_FragColor = vec4(col, body * ends * side * thick * edge * smoothstep(0.6, 2.5, dist)); }` }));
    mist.renderOrder = 8; scene.add(mist); }
  // snow through the fallen vault on a rare visit (a medium): falling and lying from the first frame. On any other
  // visit it is not made and its stream is never drawn
  if (o.rare) { const r = forks.snow, ru = P.ruin, NS = Math.round(900 * o.detail), sp = [], ss = [];
    for (let i = 0; i < NS; i++) { sp.push(r.range(-ru.W, ru.W), r(), -r.range(ru.a0, ru.a1 + 2)); ss.push(r() * 6.28, r.range(0.05, 0.11), r.range(1.1, 2.2)); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3)); g.setAttribute('aS', new THREE.Float32BufferAttribute(ss, 3));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, UP_Y + 16, -(ru.a0 + ru.a1) / 2), 60);
    const snowU = { uTime: U.uTime, uH: dU.uH, uOn: { value: 1 } };
    const snow = new THREE.Points(g, new THREE.ShaderMaterial({ uniforms: snowU, transparent: true, depthWrite: false,
      vertexShader: /* glsl */`uniform float uTime; uniform float uH; uniform float uOn; attribute vec3 aS; varying float vA;
void main() { vec3 p = position; p.y = ${UP_Y.toFixed(1)} + 32. * fract(position.y - uTime * aS.z / 32.); p.x += sin(uTime * 0.5 + aS.x) * 0.7; p.z += cos(uTime * 0.4 + aS.x) * 0.5;
  vec4 mv = viewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mv; float dist = max(-mv.z, 0.1); float px = aS.y * projectionMatrix[1][1] * uH * 0.5 / dist; gl_PointSize = clamp(px, 1.5, 10.);
  vA = uOn * min(px / 1.5, 1.) * smoothstep(0.6, 2.5, dist); if (uOn < 0.5) gl_Position = vec4(2., 2., 2., 1.); }`,
      fragmentShader: /* glsl */`varying float vA; void main() { vec2 c = gl_PointCoord - .5; gl_FragColor = vec4(vec3(0.75, 0.8, 0.95), vA * smoothstep(0.25, 0.03, dot(c, c))); }` }));
    snow.renderOrder = 9; scene.add(snow); }
  // (the motes of the last hall's evening air, one law for the whole hall: MOTES of them over the whole hall at full
  // detail, each a grain MOTE_SIZE m across, dealt as they were; and the evening's own at the hall's openings)
  { const r = forks.motes, ru = P.ruin, NM = Math.round(MOTES * o.detail), mp = [], ms = [];
    for (let i = 0; i < NM; i++) { mp.push(r.range(-ru.W + 1, ru.W - 1), UP_Y + r.range(0.5, 20), -r.range(ru.a0 + 1, ru.a1)); ms.push(r() * 6.28, r.range(MOTE_SIZE[0], MOTE_SIZE[1]), r.range(0.3, 0.8)); }
    // THE EVENING'S OWN MOTES STAND AT THE OPENINGS IT COMES IN BY (their own stream; the same six draws a mote): the
    // two breaches of the evening hand's wall, each in the bay the seed deals it, and the great doorway in the end
    // wall. To each opening MOTE_OPEN motes for every metre of its breadth (a breach: its bay; the doorway: jamb to
    // jamb). A mote stands along the hall so far from its opening (a breach: from the middle of its bay, to either
    // hand; the doorway: from the end wall, into the hall) that half of an opening's motes stand within one breadth
    // of it, a quarter in the next breadth, and so on: thick in the opening's shaft, thinner with the distance; one
    // dealt past an end of the hall stands as far inside it. Across the hall and in height they stand as the hall's
    // own do (every mote drifts across the whole breadth on the world clock: below). No stretch of the hall is
    // measured out for them, and none before the end wall
    if (forks.motesend) { const re = forks.motesend, lo = ru.a0 + 1, hi = ru.a1, opens = [];
      ru.cut[0].forEach((hb, b) => { if (hb < 5) opens.push({ at: ru.a0 + (b + 0.5) * ru.bay, wide: ru.bay, hands: 2 }); });
      opens.push({ at: ru.a1, wide: 2 * END_HW, hands: 1 });
      for (const q of opens) { const NE = Math.round(MOTE_OPEN * q.wide * o.detail);
        for (let i = 0; i < NE; i++) { const x = re.range(-ru.W + 1, ru.W - 1), y = UP_Y + re.range(0.5, 20), t = q.hands === 2 ? re.range(-1, 1) : -re();
          let a = q.at - Math.sign(t) * q.wide * Math.log2(Math.max(1 - Math.abs(t), 1e-9));
          while (a < lo || a > hi) a = a < lo ? 2 * lo - a : 2 * hi - a;
          mp.push(x, y, -a); ms.push(re() * 6.28, re.range(MOTE_OPEN_SIZE[0], MOTE_OPEN_SIZE[1]), re.range(0.3, 0.8)); } } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(mp, 3)); g.setAttribute('aS', new THREE.Float32BufferAttribute(ms, 3)); g.computeBoundingSphere();
    const motes = new THREE.Points(g, new THREE.ShaderMaterial({ uniforms: dU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: LOOK_COMMON + /* glsl */`uniform float uH; attribute vec3 aS; varying vec3 vC;
void main() { vec3 p = position + vec3(sin(uTime * aS.z + aS.x) * 1.2, sin(uTime * aS.z * 0.7 + aS.x * 2.) * 0.8, cos(uTime * aS.z * 0.8 + aS.x) * 1.2);
  // THE MOTES DRIFT (world clock): the evening's air moves across the open hall from the evening hand, each mote at
  // its own pace (0.4 to 1.1 m a second) and rising a little as it goes; one that reaches the seaward wall comes in
  // again at the other (it fades out and in over the last 2.5 m before either wall)
  float span = 2. * uRuin.x - 2., mx = mod(p.x + uRuin.x - 1. + uTime * aS.z * 1.35, span); p.x = mx - uRuin.x + 1.; p.y += 0.5 * sin(mx * 0.21 + aS.x);
  float wall = smoothstep(0., 2.5, mx) * smoothstep(0., 2.5, span - mx);
  vec4 mv = viewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mv; float dist = max(-mv.z, 0.1);
  float px = aS.y * projectionMatrix[1][1] * uH * 0.5 / dist; gl_PointSize = clamp(px, 1.5, 12.);
  int ci = int(clamp(floor((-p.z + (p.x + uRuin.x) * 0.124 - uRuin.z) / uRuin.w), 0., 15.)); float sunR = smoothstep(-1., 1.4, p.y + (p.x + uRuin.x) * uRuin.y - uCut[ci]);
  // (gold where the low sun reaches a mote, as before; where it does not, the dusk band's last gold from the hall's
  // open end, MOTE_DUSK, at its full where the moon's lane also finds the mote and at 0.45 of it in the stone's shade)
  vC = (uKey[3] * 0.5 * sunR + vec3(${MOTE_DUSK.map((q) => q.toFixed(3)).join(', ')}) * 0.75 * (1. - sunR) * (0.45 + 0.55 * moonAt(p))) * wall * (0.5 + 0.5 * sin(uTime * 2.3 + aS.x * 7.)) * min(px / 1.5, 1.) * min(px / 1.5, 1.) * smoothstep(0.6, 2.5, dist); }`,
      fragmentShader: /* glsl */`varying vec3 vC; void main() { vec2 c = gl_PointCoord - .5; gl_FragColor = vec4(vC * smoothstep(0.25, 0.0, dot(c, c)), 1.); }` }));
    motes.renderOrder = 7; scene.add(motes); }
  const size = new THREE.Vector2();
  return { update(time) { ctx.renderer.getDrawingBufferSize(size); dU.uH.value = size.y; const S3 = P.storm; U.uStormF.value.set(flashAt(time, S3[0]), flashAt(time, S3[1]), flashAt(time, S3[2])); } };
}
// ---------------------------------------------------------------- the birds, the crabs, weed and shells (bodies)
// kinds: 0 gull, 1 rook, 2 sparrow, 3 the great white sea bird, 4 crab. Every flier keeps a closed round of its own on
// the world clock. THE TEST OF A ROUND THAT IS DEALT BY CHANCE (gulls, rooks, sparrows, the nests' rooks: offLine,
// below) holds the round's WHOLE COURSE to the flown line itself: the course in places 0.05 m apart at the most
// (a place that a clearer place near it answers for is passed over: see there), with its rise and fall taken whole
// (every height between its lowest and its highest), against the lens every half metre of the route, at the lens's
// own height there. A round is kept only where the bird's body with its wings' whole swing (BIRD_REACH) stays
// 3.5 m and more from the lens along all of that course; a bird has five tries (a nest's rook six) and one whose
// last try is refused is not flown. The great white bird and the high flocks take no test: each keeps off the line
// by place, by the law said where it is made. The birds that lift at the sea doors take a test of their own, of the
// whole reach of their lift against the same lens with the same 3.5 m asked (lifeInto: liftClear), and one that
// fails it sits. (Tested here on the seed's own layout; counted again under node, every seed built as a visit is
// dealt it.)
export const BIRD_SPAN = [1.25, 0.95, 0.45, 3.4, 0.4];
// (a flier's body with its wings' whole swing lies within 0.514 of its span of its own middle: the wing's tip, half
// a span out and a hundredth of one up, swung about the body's axis 0.06 of a span behind the middle)
export const BIRD_REACH = 0.514;
// (dealt in steps so that a build can hand the page back between halls and between flocks: birdRoundsSteps is the
// dealing itself and pauses after each hall's fliers and after each flock; birdRounds runs it through without a
// pause. The draws and their order are the same either way.)
export function birdRounds(P, forks, o) { const it = birdRoundsSteps(P, forks, o); for (;;) { const s = it.next(); if (s.done) return s.value; } }
export function* birdRoundsSteps(P, forks, o) {
  const V = P.V, path = P.path, list = [], rY = (a) => path.nearestXZ(0, -a).y;
  // (the rounds of each hall are dealt by that hall's own stream: r is the stream of the hall being dealt)
  let r = null;
  // (a round that would pass through what stands free in a hall, the colossus in the flooded hall's sea, the stair's
  // cheek figures, the last hall's end piers, haunches and rib stubs, is no round: it counts as not clear)
  // THE RULE OF THE PLACE for every bird on a round, in every hall: its whole course lies inside its own hall, a
  // wing's half span and 1 m clear of the side walls' faces and of the cross walls (so it passes no door at all), of
  // the lintel course and what stands under it in the entrance hall (5 m out from either wall), of the rib stubs of
  // the last hall (which reach 1 m in from the seaward wall), of the pavement and the stairs under it, of the vault's
  // springing over it, and of what stands free in the hall (P.solids: the colossi, the stair's cheek figures, the
  // end piers and haunches). The makers below make rounds that keep the walls by construction; `inside` tests the
  // whole rule all the same, and a round that fails it is not flown
  const reach = (v) => (v.id === 'ves' ? v.W - LINTEL_D : v.ruin ? v.W - 1 : v.W);
  const inside = (b, v, half, skip) => { const mg = half + 1, a = -b.c[2];
    if (Math.abs(b.c[0]) + b.rx > reach(v) - mg + 1e-6 || a - b.rz < v.a0 + mg - 1e-6 || a + b.rz > v.a1 - mg + 1e-6) return false;
    if (!v.ruin && b.c[1] + b.bob > v.spring - mg) return false;
    for (let i = 0; i < 28; i++) { const t = TAU * i / 28, x = b.c[0] + b.rx * Math.cos(t), z = b.c[2] + b.rz * Math.sin(t);
      // (the floor under it AND under the places a margin to either hand, before and behind it: so a round keeps the
      // same margin off a quay wall, a cheek block or a stair's rise as off the pavement)
      let fy = v.id === 'stair' || v.id === 'sea' ? SEA_Y : -99;
      for (const [dx, dz] of [[0, 0], [mg, 0], [-mg, 0], [0, mg], [0, -mg]]) fy = Math.max(fy, v.fl(-(z + dz), x + dx), v.cheekY ? v.cheekY(-(z + dz), x + dx) : -99);
      if (b.c[1] - b.bob < fy + mg) return false;
      for (const q of P.solids) if (q !== skip && b.c[1] - b.bob < q.y1 + mg && b.c[1] + b.bob > q.y0 - mg && Math.hypot(x - q.x, z - q.z) < q.r + mg) return false; }
    return true; };
  // THE LENS: the flown line's own point every half metre from its first to its last, each at its own height, kept
  // by the metre of the spine it stands over (so that a place of a round finds the lens points near it)
  const lens = {}, p3 = new THREE.Vector3();
  for (let m = 0; ; m += 0.5) { const mm = Math.min(m, path.length), k = Math.floor(-path.posAtDist(mm, p3).z); (lens[k] || (lens[k] = [])).push(p3.x, p3.y, p3.z); if (mm >= path.length) break; }
  // THE TEST (see the head): true where the round's whole course keeps KEEP m between the bird's body and the lens.
  // The places of the course stand no more than STEP apart and each is asked KEEP and half a STEP, so no point of
  // the course between two places is nearer than KEEP; at a place the bird may be at any height between its bob's
  // lowest and highest. A place found clear by more than it is asked answers for the places within that much of
  // it along the course (none of them can be nearer than asked), and they are passed over. It takes no draw
  const KEEP = 3.5, STEP = 0.05;
  const offLine = (b) => { const D = KEEP + STEP / 2 + BIRD_REACH * (b.span || BIRD_SPAN[b.kind]), W = D + 2, n = Math.ceil(TAU * Math.max(b.rx, b.rz) / STEP), y0 = b.c[1] - b.bob, y1 = b.c[1] + b.bob;
    for (let i = 0; i < n; i++) { const t = TAU * i / n, x = b.c[0] + b.rx * Math.cos(t), z = b.c[2] + b.rz * Math.sin(t); let m = W * W;
      // (m: the square of the least distance from this place to the lens, or of W where no lens point is within W)
      for (let k = Math.floor(-z - W); k <= Math.floor(-z + W); k++) { const q = lens[k]; if (!q) continue;
        for (let j = 0; j < q.length; j += 3) { const dx = q[j] - x, dy = Math.max(y0 - q[j + 1], 0, q[j + 1] - y1), dz = q[j + 2] - z; m = Math.min(m, dx * dx + dy * dy + dz * dz); } }
      if (m < D * D) return false;
      i += Math.floor((Math.sqrt(m) - D) / STEP); }
    return true; };
  // (the lens and what is asked of it are handed on: the birds that lift at the sea doors are held to the same lens
  // by the same ask, where their lift is decided: lifeInto, liftClear)
  P.lens = { at: lens, keep: KEEP };
  const clear = (b, v) => inside(b, v, BIRD_SPAN[b.kind] / 2) && offLine(b);
  const add = (kind, v, n, mk) => { for (let i = 0; i < Math.round(n * o.density); i++) { for (let t = 0; t < 5; t++) { const b = mk(kind); b.kind = kind; b.ph = r() * TAU; if (clear(b, v)) { list.push(b); break; } } } };
  const wheel = (v, lo, hi) => (kind) => { const mg = BIRD_SPAN[kind] / 2 + 1, rz = r.range(6, 15), a = r.range(v.a0 + mg + rz, v.a1 - mg - rz), x = r.range(-v.W * 0.3, v.W * 0.3), rx = r.range(3, Math.max(3.2, reach(v) - mg - Math.abs(x))), top = (v.ruin ? UP_Y + 30 : v.spring) - mg - 0.7;
    return { c: [x, Math.min(top, rY(a) + r.range(lo, hi)), -a], rx, rz, bob: 0.6, w: r.sign() * r.range(5, 8) / ((rx + rz) / 2) }; };
  // (the small birds keep further off the stone than the rule asks: the outer edge of a round 3.6 m and more from the
  // side wall's face, where a proud figure and what it holds reach to 3 m, and its ends 2.4 m and a half span from
  // the cross walls, where a figure stands out 1.1 m)
  const flit = (v) => (kind) => { const mg = BIRD_SPAN[kind] / 2 + 2.4, rx = r.range(0.8, 1.6), rz = r.range(2, 5), a = r.range(v.a0 + mg + rz, v.a1 - mg - rz), s = r.sign(), d = v.W - reach(v) + r.range(3.6, 5.6) + rx;
    return { c: [s * (v.W - d), Math.min(v.spring - mg - 0.6, Math.max(v.fl(a, s * (v.W - d)), v.id === 'stair' ? SEA_Y : -99) + r.range(5, 17)), -a], rx, rz, bob: 0.5, w: r.sign() * r.range(4, 6) / ((rx + rz) / 2) }; };
  for (const v of V) {
    if (v.id === 'cloud') continue;
    r = forks.birds[v.id];
    if (v.ruin) {
      add(1, v, 34, wheel(v, 5, 22));
      yield;
      // three flocks of small dark birds wheeling high over the open hall: each bird keeps a closed round of its own
      // beside its fellows' (one turning rate to a flock), the lowest of them 12 m over the route; the whole flock keeps
      // inside the hall's walls by its seat (the rule above), so it meets no pier, no stub and no wall's top
      // (NO TEST OF THE ROUTE, a law of place: 15 m over the lens, less 2 m, a bob of 0.7, the body 0.26: 12.0 m off it)
      for (let fk = 0; fk < 3; fk++) {
        const mg = 1.25, rz = r.range(14, 22), rx = r.range(5.5, 7), x0 = r.range(-1.5, 1.5), a = r.range(v.a0 + mg + 3 + rz * 1.08, v.a1 - mg - 3 - rz * 1.08), y0 = UP_Y + EYE + r.range(15, 24), w = r.sign() * r.range(7, 10) / ((rx + rz) / 2), ph0 = r() * TAU;
        for (let i = 0; i < Math.round(70 * o.density); i++) { const b = { kind: 1, span: 0.5, c: [x0 + r.range(-2.5, 2.5), y0 + r.range(-2, 2), -a + r.range(-3, 3)], rx: rx * r.range(0.92, 1.08), rz: rz * r.range(0.92, 1.08), bob: 0.7, w, ph: ph0 + r.range(-0.45, 0.45) }; if (inside(b, v, 0.25)) list.push(b); }
        yield;
      }
      continue;
    }
    add(0, v, v.id === 'hero' ? 20 : v.id === 'sea' ? 16 : 14, wheel(v, 4.6, 12));
    yield;
    if (v.id !== 'sea') { add(2, v, 30, flit(v)); yield; add(1, v, 6, wheel(v, 6, 15)); }
    yield;
  }
  // NO BIRD'S WING ENTERS THE ROOM A FIGURE TAKES UP. A niche's figure holds things out of its wall's face further
  // than the metre a round keeps off that face (a jar's water, a bar, a beast's head: to 2.6 m), so every round that
  // is dealt by chance is tried, when all are dealt, on every figure's whole reach as it stands (o.holds: its box
  // along the world's axes, plinth and all it holds) along its whole course as it is flown (a place every 0.2 m,
  // the rise and fall with it): a round that comes within its wing's half span and 0.15 m of such a box is not
  // flown. A round of a hall's own stream is struck out after the dealing and takes no draw, so no other round is
  // dealt anew by it; a nest's rook, which has its nest's own stream, takes another try. (The great white bird's
  // round lies by place, 3.6 m from either wall's face, and is not tried)
  const holds = o.holds || [], gap = (q, x, y, z) => Math.hypot(Math.max(q[0] - x, 0, x - q[1]), Math.max(q[2] - y, 0, y - q[3]), Math.max(q[4] - z, 0, z - q[5]));
  const brushes = (b) => { const hs = (b.span || BIRD_SPAN[b.kind]) / 2 + 0.15, by = holds.filter((q) => q[0] < b.c[0] + b.rx + hs && q[1] > b.c[0] - b.rx - hs && q[2] < b.c[1] + b.bob + hs && q[3] > b.c[1] - b.bob - hs && q[4] < b.c[2] + b.rz + hs && q[5] > b.c[2] - b.rz - hs);
    if (!by.length) return false;
    const n = Math.ceil(TAU * Math.max(b.rx, b.rz) / 0.2);
    for (let i = 0; i < n; i++) { const t = TAU * i / n, x = b.c[0] + b.rx * Math.cos(t), y = b.c[1] + b.bob * Math.sin(t * 2 + b.ph * 3), z = b.c[2] + b.rz * Math.sin(t); for (const q of by) if (gap(q, x, y, z) < hs) return true; }
    return false; };
  for (let i = list.length - 1; i >= 0; i--) if (brushes(list[i])) list.splice(i, 1);
  yield;
  // the great white bird glides ACROSS the cloud hall, wall to wall beyond the colossus with the nest, 5.4 m
  // over the route's height: a round broad across the hall (to 3.6 m of either wall) and short along it (6 m), so it
  // crosses over the line's lane side on, 69 degrees or more off the hall's axis, and never bears down the hall at
  // the lens. Its round is centred on the hall's axis at the middle of the third bay past the colossus's pier (the
  // colossus stands at the second pier past the stair's head), so its nearest pass is 10 m beyond him
  // THE NESTS' BIRDS: to each nest in a giant's arm or lap two rooks that go and come, each on a closed round of its
  // own that lies before the giant, level with the nest, and touches the nest at its nearest point (so a bird comes
  // to the nest once a round and goes out over the hall again); the rule of the place holds for it but for the
  // giant whose nest it is, and the count under node tries it on that giant's own stone. Each nest's rooks are dealt
  // by that nest's own stream (forks.nestbirds: the nest's hall and its number among the nests of that hall, as they
  // are built: the stair's landward giant's nest first), so the tries one nest takes deal no other nest anew
  const nestNo = {};
  for (const n of P.nests || []) { const v = V[n.vi], no = nestNo[v.id] || 0, rn = forks.nestbirds(v.id, no), own = P.solids.find((q) => Math.hypot(q.x - n.x, q.z - n.z) < q.r + 1 && q.what !== 'lion');
    for (let i = 0; i < 2; i++) for (let t = 0; t < 6; t++) {
      const rx = rn.range(1.2, 2.2), rz = rn.range(2.6, 5.2), b = { kind: 1, span: 0.7, nest: n, c: [n.x, n.y + 0.7 + 0.3 * i, n.z + rz + 0.15], rx, rz, bob: 0.15, w: rn.sign() * rn.range(3.2, 4.6) / ((rx + rz) / 2), ph: rn() * TAU };
      if (inside(b, v, 0.35, own) && offLine(b) && !brushes(b)) { list.push(b); break; } }
    nestNo[v.id] = no + 1;
    yield; }
  // (the great white bird: NO TEST, a law of place: 5.4 m over the line, less the line's swell 0.17, bob 0.3, body 1.75: 3.18 m)
  { const cla = P.cl, bi = Math.ceil((cla.s1 - cla.a0) / cla.bay) + 1; list.push({ kind: 3, c: [0, UP_Y + EYE + 5.4, -(cla.a0 + (bi + 2.5) * cla.bay)], rx: cla.W - 3.6, rz: 6, bob: 0.3, w: 0.5, ph: forks.great() * TAU }); P.greatInside = inside(list[list.length - 1], cla, BIRD_SPAN[3] / 2); }
  return list;
}
export async function lifeInto(ctx, scene, P, look, forks, o) {
  const U = look.uniforms, hero = P.hero, iA = [], iB = [], iC = [];
  let fl; { const it = birdRoundsSteps(P, forks, o); for (;;) { const s = it.next(); if (s.done) { fl = s.value; break; } await ctx.yield(); } }
  P.rounds = fl;
  for (const b of fl) { iA.push(b.c[0], b.c[1], b.c[2], b.rx); iB.push(b.rz, b.w, b.ph, b.span || BIRD_SPAN[b.kind]); iC.push(b.kind, 0, -1, b.bob); }
  // the perched: on the heads of statues of the two lower tiers; in the hall of the sea doors those of the lowest tier
  // of the landward wall lift with their door's wave and settle as it draws back
  P.perched = [];
  // THE TEST OF A LIFT (true where the bird may lift): its WHOLE REACH keeps the rounds' own distance (P.lens.keep)
  // between the bird's body with its wings' whole swing (BIRD_REACH) and the lens, every half metre of the route at
  // the lens's own height. The reach is what the birds' shader can make of a lift, whatever the clocks: the step
  // out, level, from the perch (x, y, z) to `out` before it; then, for every share s of the rise, the sway from
  // 0.2 s to 2.4 s further out and 1.2 s to either hand, at every height from 3.1 s to 4.1 s over the perch. The
  // rise is taken in LIFT_N shares and each share whole, as the box that holds all of it (so nothing between two
  // shares is passed over and the test asks a little more than is flown, never less). It takes no draw
  const LIFT_N = 40;
  const liftClear = (x, y, z, out, sz) => { const L = P.lens, D = L.keep + BIRD_REACH * sz;
    for (let k = Math.floor(-z - 1.2 - D); k <= Math.floor(-z + 1.2 + D); k++) { const q = L.at[k]; if (!q) continue;
      for (let j = 0; j < q.length; j += 3) for (let i = -1; i < LIFT_N; i++) { const s0 = Math.max(i, 0) / LIFT_N, s1 = (i + 1) / LIFT_N;
        // (i = -1: the step out; else the share of the rise from s0 to s1)
        const x0 = i < 0 ? x : x + out + 0.2 * s0, x1 = i < 0 ? x + out : x + out + 2.4 * s1, y0 = i < 0 ? y : y + 3.1 * s0, y1 = i < 0 ? y : y + 4.1 * s1, hz = i < 0 ? 0 : 1.2 * s1;
        const dx = Math.max(x0 - q[j], 0, q[j] - x1), dy = Math.max(y0 - q[j + 1], 0, q[j + 1] - y1), dz = Math.max(z - hz - q[j + 2], 0, q[j + 2] - z - hz);
        if (dx * dx + dy * dy + dz * dz < D * D) return false; } }
    return true; };
  for (const t of o.tops) {
    const v = P.V[t.vi], r = forks.perch[v.id], low = v.id === 'hero' && t.side < 0 && t.ti === 0; let door = -1;
    if (low) { let dm = 1e9; hero.doors.forEach((d, k) => { const dd = Math.abs(-t.z - d.a); if (dd < dm) { dm = dd; door = k; } }); }
    if (t.ti > 1 || v.id === 'cloud') continue;
    if (r() > (door >= 0 ? 0.75 : 0.17 * o.density)) continue;
    // its facing, and its kind where the kind is by chance (in the last hall every percher is a rook: no draw)
    const yw = r(); let kind = 1; if (!v.ruin) { const kd = r(); kind = kd < 0.5 ? 0 : kd < 0.72 ? 1 : 2; }
    const sz = BIRD_SPAN[kind], face = t.side < 0 ? (yw - 0.5) * 1.8 : t.side > 0 ? Math.PI + (yw - 0.5) * 1.8 : Math.PI / 2 + (yw - 0.5) * 1.8;
    // A BIRD THAT LIFTS STEPS OUT FIRST, level, until it stands 1.5 m before the wall's face (clear of its string
    // courses and sills by more than a wing) AND a wing and 0.15 m before the foremost part of every figure that
    // reaches into the air it will rise and sway through (4.1 m up, 1.2 m to either hand: its own figure, its
    // neighbours, the tier above with all they hold out: o.boxes, each figure's whole reach as it stands). If that
    // step is longer than 3.9 m, or another figure's reach lies across the step itself, the bird does not lift: it
    // sits. (It carries the step with its door: the door's number and a hundredth of the step in one number)
    // AND IT IS HELD TO THE FLOWN LINE, a rule that holds on every seed: where the whole reach of its lift (the step
    // out, the rise, the sway: liftClear, above) would bring its body within 3.5 m of the lens, the bird does not
    // lift either: it sits, as for the long step. No bird is refused and no draw is taken, so nothing else is dealt
    // anew. (By the layout alone the two keep far apart, the perches at the landward wall and the line at x >= -4.5
    // in this hall: on seeds 1 to 400 the test makes no bird sit, and the nearest lifter passes 4.9 m from the lens)
    let out = 0;
    if (door >= 0) { const hs = sz / 2; out = Math.max(0, -v.W - t.x) + 1.5;
      for (const b of o.boxes || []) { if (b[4] > t.z + 1.2 + hs || b[5] < t.z - 1.2 - hs || b[3] < t.y - hs || b[2] > t.y + 4.1 + hs) continue; out = Math.max(out, b[1] + hs + 0.15 - t.x); }
      for (const b of o.boxes || []) if (b !== t.box && b[4] < t.z + hs && b[5] > t.z - hs && b[2] < t.y + hs && b[3] > t.y - hs && b[1] > t.x && b[0] < t.x + out) out = 9;
      if (out > 3.9 || !liftClear(t.x - t.side * 0.02, t.y + sz * 0.02, t.z, out, sz)) { door = -1; out = 0; } }
    iA.push(t.x - t.side * 0.02, t.y + sz * 0.02, t.z, 0); iB.push(0, 0, face, sz); iC.push(kind, 1, door >= 0 ? door + out * 0.01 : -1, 0); P.perched.push({ x: t.x, y: t.y, z: t.z, door, sz, out, face });
  }
  // gulls on the entrance hall's lintel course (their own stream): three to five to a hand, each at its place along it
  { const ves = P.V[0], rg = forks.lintel, sz = BIRD_SPAN[0];
    for (const sd of [-1, 1]) { const ng = rg.int(3, 5); for (let i = 0; i < ng; i++) { const x = sd * (ves.W - LINTEL_D + 0.3), z = -rg.range(ves.a0 + 2, ves.a1 - 2), face = (sd < 0 ? 0 : Math.PI) + (rg() - 0.5) * 1.6;
      iA.push(x, 15.2 + sz * 0.02, z, 0); iB.push(0, 0, face, sz); iC.push(0, 1, -1, 0); P.perched.push({ x, y: 15.2, z, door: -1, sz }); } } }
  // rooks before the last doorway (their own stream): four to seven are dealt, by a rule of the place. They keep to
  // either flank of the doorway, 0.8 m and more outside its jamb and never in its opening (the opening is the
  // line's), on the strip 0.8 to 6 m before the end wall. The heaps that fell free lie short of that strip (their
  // stones end 7.2 m and more before the end wall on seeds 1 to 800, 6.5 m by the deal's own ranges), but the heap
  // at the foot of the landward wall's second breach lies ON the strip where that breach is the hall's last bay
  // (against the end wall), and can reach it from the bay before. So A ROOK STANDS ONLY WHERE ITS WHOLE BODY HAS
  // ROOM (rookRoom, above: the rule, the same for every rook on every seed): on the pavement or on a heap's stone at
  // its place, no stone over any part of its footprint higher than its body's underside, no foot over a drop, no
  // other rook within a body's length and its air of it. A place that has
  // no room is DEALT ANEW, place and facing, inside the same bounds of the same strip, from a stream of the retries'
  // own ('rookroom': so the first place of every rook is what the rooks' stream deals it whatever another rook
  // needed, and no other thing's draws move), ROOK_TRIES places in all; a rook whose last place has no room is not
  // there. The rooks never lift
  { const ru = P.ruin, rr = forks.rooks, ra = forks.rookroom, nr = rr.int(4, 7), sz = BIRD_SPAN[1];
    const deal = (r) => [r.sign() * r.range(END_HW + 0.8, ru.W - 1.5), -(ru.a1 - r.range(0.8, 6)), Math.PI / 2 + (r() - 0.5) * 1.6];
    P.doorRooks = { dealt: nr, moved: 0, gone: 0 }; const stand = [];
    for (let i = 0; i < nr; i++) { let [x, z, face] = deal(rr), y = rookRoom(P, x, z, face, sz, stand), t = 1;
      for (; t < ROOK_TRIES && y === null; t++) { [x, z, face] = deal(ra); y = rookRoom(P, x, z, face, sz, stand); }
      if (y === null) { P.doorRooks.gone++; continue; }
      if (t > 1) P.doorRooks.moved++;
      stand.push([x, z]); iA.push(x, y + sz * 0.02, z, 0); iB.push(0, 0, face, sz); iC.push(1, 1, -1, 0); P.perched.push({ x, y, z, door: -1, sz, face, rook: 1 }); } }
  // a rook sits in each giant's nest, on its bed (the bed's top lies 0.12 of the nest's radius under the place the
  // nest's own birds come to), facing out over the hall the way its nest looks (the nest's own out)
  for (const n of P.nests || []) { const y = n.y - n.R * 0.12, face = Math.atan2(n.out[2], n.out[0]); iA.push(n.x, y + 0.02, n.z, 0); iB.push(0, 0, face, 0.7); iC.push(1, 1, -1, 0); P.perched.push({ x: n.x, y, z: n.z, door: -1, sz: 0.7, out: 0, face }); }
  // the great white bird on its nest
  iA.push(P.nest.x, P.nest.y + 0.3, P.nest.z, 0); iB.push(0, 0, Math.PI / 2 - P.nest.yaw + 0.5, 3.0); iC.push(3, 1, -1, 0);
  const NB = iA.length / 4;
  // crabs on the wet pavement and on the stairs at the water's edge: small rounds of their own, 6 m and more under the route
  P.crabs = [];
  { const rc = forks.crabs, sea = P.sea, n = Math.round(46 * o.density);
    // (a crab keeps out of the stone: one whose round, with its body, would enter the plinth of a buttress of the
    // landward wall (PIER: so far out from the wall's face, so far to either hand of a bay line) is not there; its
    // draws are taken all the same, so no other crab is dealt anew)
    P.crabsGone = 0;
    for (let i = 0; i < n; i++) { const x = rc.range(-hero.W + 1.5, hero.W - 1.5), a = rc.range(hero.a0 + 3, hero.a1 - 3), rr = rc.range(0.5, 1.6), rz = rr * rc.range(0.6, 1.4), w = rc.sign() * rc.range(0.5, 1.1), ph = rc() * TAU, sz = rc.range(0.32, 0.5), da = a - hero.a0, off = Math.abs(da - Math.round(da / hero.bay) * hero.bay);
      if (x - rr - sz < -hero.W + PIER.proud && off < PIER.hw + rz + sz) { P.crabsGone++; continue; }
      iA.push(x, 0.1, -a, rr); iB.push(rz, w, ph, sz); iC.push(4, 0, -1, 0); P.crabs.push([x, 0.1, -a, rr * 1.4]); } }
  const pos = [], sh = [], T = (a, b, c, s0, s1, s2) => { pos.push(...a, ...b, ...c); sh.push(s0, s1, s2); };
  { const N = [0, 0, 0.2], Tl = [0, 0, -0.18], R = [[0.05, 0, 0.03], [0, 0.045, 0.03], [-0.05, 0, 0.03], [0, -0.04, 0.03]];
    for (let i = 0; i < 4; i++) { T(N, R[i], R[(i + 1) % 4], 1, 1, 1); T(Tl, R[(i + 1) % 4], R[i], 0.9, 1, 1); }
    T([0, 0.005, -0.14], [0.06, 0, -0.3], [-0.06, 0, -0.3], 0.9, 0.75, 0.75);
    for (const s of [-1, 1]) { const a = [s * 0.04, 0.01, 0.09], b = [s * 0.04, 0.01, -0.07], c = [s * 0.27, 0.01, -0.08], d = [s * 0.27, 0.01, 0.06], e = [s * 0.5, 0.01, -0.06], f2 = [s * 0.44, 0.01, 0.01];
      T(a, b, c, 0.95, 0.9, 0.85); T(a, c, d, 0.95, 0.85, 0.9); T(d, c, e, 0.9, 0.85, 0.5); T(d, e, f2, 0.9, 0.5, 0.55); } }
  const g = new THREE.InstancedBufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aSh', new THREE.Float32BufferAttribute(sh, 1));
  g.setAttribute('iA', new THREE.InstancedBufferAttribute(new Float32Array(iA), 4)); g.setAttribute('iB', new THREE.InstancedBufferAttribute(new Float32Array(iB), 4)); g.setAttribute('iC', new THREE.InstancedBufferAttribute(new Float32Array(iC), 4));
  g.instanceCount = iA.length / 4; g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 10, -P.end / 2), P.end / 2 + 60);
  const bU = { ...U, uDoor: { value: hero.doors.length ? [0, 1, 2, 3, 4, 5, 6, 7].map((k) => { const d = hero.doors[Math.min(k, hero.doors.length - 1)]; return new THREE.Vector4(d.a, d.T, d.ph, d.reach); }) : [] } };
  const mat = new THREE.ShaderMaterial({ uniforms: bU, side: THREE.DoubleSide,
    vertexShader: LOOK_COMMON + /* glsl */`uniform vec4 uDoor[8]; attribute vec4 iA; attribute vec4 iB; attribute vec4 iC; attribute float aSh; varying vec3 vCol; varying vec3 vW;
void main() {
  float th = iB.z + iB.y * uTime, kind = iC.x;
  if (kind > 3.5) th += 0.8 * sin(uTime * 1.3 + iB.z * 3.);
  vec3 c = iA.xyz + vec3(iA.w * cos(th), iC.w * sin(th * 2. + iB.z * 3.), iB.x * sin(th));
  vec3 tang = vec3(-iA.w * sin(th), 0., iB.x * cos(th)) * (iB.y < 0. ? -1. : 1.);
  vec3 fwd = normalize(mix(tang, vec3(cos(iB.z), 0., sin(iB.z)), step(0.5, iC.y)) + vec3(0., 1e-4, 0.));
  float lift = 0.;
  // A BIRD THAT LIFTS WITH ITS DOOR'S WAVE STEPS OUT BEFORE IT RISES, whatever the clock: over the first third of
  // its lift it only moves out of its niche, level, to 1.5 m before the wall's face; over the rest it rises 3.6 m
  // and sways, and its sway is always further out. It comes back the same way
  if (iC.z > -0.5) { float dk = floor(iC.z + 0.25), outd = (iC.z - dk) * 100.; vec4 D = uDoor[int(dk + 0.5)]; float ph = fract(uTime / D.y + D.z); lift = smoothstep(0.34, 0.42, ph) * (1. - smoothstep(0.62, 0.78, ph));
    float s0 = smoothstep(0., 0.35, lift), s1 = smoothstep(0.35, 1., lift);
    c += vec3(outd * s0 + s1 * (1.3 + 1.1 * cos(uTime * 1.3 + iB.z * 5.)), (3.6 + 0.5 * sin(uTime * 2.1 + iB.z)) * s1, s1 * 1.2 * sin(uTime * 1.3 + iB.z * 5.)); }
  float fold = iC.y * (1. - smoothstep(0.02, 0.2, lift));
  float rate = kind < 0.5 ? 5. : kind < 1.5 ? 6.5 : kind < 2.5 ? 16. : kind < 3.5 ? 1.1 : 9., amp = kind > 3.5 ? 0.25 : kind > 2.5 ? 0.16 : 0.7;
  float glide = kind < 0.5 ? smoothstep(-0.2, 0.5, sin(uTime * 0.45 + iB.z * 9.)) : 1.;
  float ang = amp * mix(0.2, 1., glide) * sin(uTime * rate + iB.z * 13.) * (1. - fold);
  vec3 p = position; float ax = abs(p.x), sg = p.x < 0. ? -1. : 1., a2 = ang * (ax > 0.3 ? 1.5 : 1.);
  p.x = sg * ax * cos(a2); p.y += ax * sin(a2);
  p.x = mix(p.x, sg * min(ax, 0.06 + ax * 0.08), fold); p.z -= fold * ax * 0.45; p.y += fold * (p.z * 0.45 + 0.11);
  // A BIRD THAT SITS SHIFTS ITS WEIGHT AND PREENS WHERE IT SITS (world clock, each by its own phase; every perched
  // bird of the house alike): its body sways a little to either hand over its feet, and once in nine seconds or so
  // it dips its head to its breast and lifts it again. Its feet do not move, it does not turn, it does not rise:
  // no part of it comes lower than it sits when still, or further than 0.03 of its span to either hand
  if (kind < 3.5) { float hb = iB.z * 7.3 + iA.x * 0.61 + iA.z * 0.37, dc = fract(uTime * 0.11 + hb * 0.37), dip = smoothstep(0., 0.07, dc) * (1. - smoothstep(0.15, 0.27, dc));
    p.x += fold * 0.1 * sin(uTime * 0.8 + hb) * max(p.y, 0.) ; p.y -= fold * dip * 0.45 * max(p.z - 0.04, 0.); }
  if (kind > 3.5) { p.y *= 0.5; p.z *= 1.6; }
  vec3 rt = normalize(cross(fwd, vec3(0., 1., 0.))), up = cross(rt, fwd);
  vec3 w = c + iB.w * (rt * p.x + up * p.y + fwd * p.z);
  vec3 base = kind < 0.5 ? vec3(0.86, 0.87, 0.88) * mix(0.5, 1., smoothstep(0.5, 0.9, aSh)) : kind < 1.5 ? vec3(0.06, 0.06, 0.08) : kind < 2.5 ? vec3(0.34, 0.25, 0.17) * aSh : kind < 3.5 ? vec3(0.95, 0.95, 0.93) * mix(0.25, 1., smoothstep(0.5, 0.9, aSh)) : vec3(0.5, 0.17, 0.1);
  vec4 zw = zoneW(-w.z);
  vec3 key = zw.x * uKey[0] + zw.y * uKey[1] + zw.z * uKey[2] + zw.w * uKey[3] * 0.5, sky = zw.x * uSky[0] + zw.y * uSky[1] + zw.z * uSky[2] + zw.w * uSky[3];
  vCol = base * (key * 0.62 + sky * 3.0) * aSh; vW = w; gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.);
}`,
    fragmentShader: LOOK_COMMON + /* glsl */`varying vec3 vCol; varying vec3 vW;
void main() { vec4 zw = zoneW(-vW.z); vec4 fog = zw.x * uFog[0] + zw.y * uFog[1] + zw.z * uFog[2] + zw.w * uFog[3]; float dist = length(cameraPosition - vW);
  gl_FragColor = vec4(mix(vCol, 0.5 * (fog.rgb + uEyeFog.rgb), 1. - exp(-0.5 * (fog.a + uEyeFog.a) * dist)), 1.); }` });
  const birds = new THREE.Mesh(g, mat); scene.add(birds);
  await ctx.yield();
  // weed and shells strewn on the wet pavement (they lie there at every phase) and on the stairs at the sea's edge
  { const rw = forks.wrack, wg = new Geo(), sgo = new Geo(), sea = P.sea, M = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), ps = new THREE.Vector3(), sc = new THREE.Vector3(), col = new THREE.Color();
    setStone([0.17, 0.2, 0.09]);
    for (let i = 0; i < 6; i++) { const t = i * 1.05 + 0.3 * Math.sin(i * 2.1), L = 0.5 + 0.35 * Math.abs(Math.sin(i * 1.7)), c = Math.cos(t), sn = Math.sin(t), w = 0.07; wg.quad([-sn * w, 0.02, c * w], [sn * w, 0.02, -c * w], [c * L * 0.6 + sn * w, 0.05, sn * L * 0.6 - c * w], [c * L * 0.6 - sn * w, 0.05, sn * L * 0.6 + c * w], [0, 1, 0], [0.14, 0.15, 0.07]); wg.quad([c * L * 0.6 - sn * w, 0.05, sn * L * 0.6 + c * w], [c * L * 0.6 + sn * w, 0.05, sn * L * 0.6 - c * w], [c * L + sn * w * 0.4, 0.02, sn * L - c * w * 0.4], [c * L - sn * w * 0.4, 0.02, sn * L + c * w * 0.4], [0, 1, 0], [0.1, 0.12, 0.06]); }
    setStone([0.74, 0.66, 0.58]); ball(sgo, [0, 0.04, 0], 0.12, 0.05, 0.1, 5, 3, 1); setStone(null);
    const nW = Math.round(190 * o.density), nS = Math.round(240 * o.density), wm = new THREE.InstancedMesh(wg.geometry(), look.mat, nW + 40), sm = new THREE.InstancedMesh(sgo.geometry(), look.mat, nS);
    const stepY = P.treadY, gs = P.st;
    for (let i = 0; i < nW + 40; i++) { const st = i >= nW, up2 = st && rw() < 0.5, a = st ? (up2 ? rw.range(gs.s0 + gs.run * 0.62, gs.s0 + gs.run + gs.land + 4) : rw.range(sea.s0 + 14, sea.s0 + 24.5)) : rw.range(hero.a0 + 1, hero.a1 - 1), x = st ? (up2 ? rw.range(-gs.SW + 1, gs.SW - 1) : rw.range(-sea.W + 1, sea.W - 1)) : (rw() < 0.45 ? -hero.W + 0.6 + Math.abs(rw.gauss()) * 3.2 : rw.range(-hero.W + 1, hero.W - 1)), s = rw.range(0.5, 1.3);
      q.setFromAxisAngle(up, rw() * TAU); wm.setMatrixAt(i, M.compose(ps.set(Math.max(-hero.W + 0.6, x), st ? stepY(a) + 0.01 : 0.01, -a), q, sc.set(s, s, s))); wm.setColorAt(i, col.setRGB(1, 1, 1)); }
    for (let i = 0; i < nS; i++) { const a = rw.range(hero.a0 + 1, hero.a1 - 1), x = rw() < 0.4 ? -hero.W + 0.5 + Math.abs(rw.gauss()) * 4 : rw.range(-hero.W + 1, hero.W - 1), s = rw.range(0.7, 1.8); q.setFromAxisAngle(up, rw() * TAU); sm.setMatrixAt(i, M.compose(ps.set(Math.max(-hero.W + 0.5, x), 0, -a), q, sc.set(s, s, s))); sm.setColorAt(i, col.setRGB(1, 1, 1)); }
    wm.computeBoundingSphere(); sm.computeBoundingSphere(); scene.add(wm); scene.add(sm); }
  await ctx.yield();
  // weed afloat on the flooded hall's sea, within 6.5 m of either wall: each frond rides the swell at its own place and
  // sways along its length on the world clock. It lies on the sea, so the sea's own clear air under the route is its own.
  { const rs = forks.weed, sea = P.sea, run = sea.s1 - sea.s0, w1 = sea.s0 + run * (SEA_Y / LOW_Y) + 0.5, w2 = sea.a1 - 1, nF = Math.round(230 * o.density), wp = [], wA = [], wB = [], SEG = 5;
    const hw = (t) => 0.5 * Math.sin(Math.PI * Math.min(1, t * 0.9 + 0.1));
    for (let j = 0; j < SEG; j++) { const t0 = j / SEG, t1 = (j + 1) / SEG, h0 = hw(t0), h1 = hw(t1); wp.push(-h0, t0, 0, h0, t0, 0, h1, t1, 0, -h0, t0, 0, h1, t1, 0, -h1, t1, 0); }
    P.weed = [];
    for (let i = 0; i < nF; i++) { const sd = rs.sign(), x = sd * (sea.W - rs.range(0.4, 6.5)), a = rs.range(w1, w2), L = rs.range(1.2, 3.2); wA.push(x, SEA_Y + 0.05, -a, L); wB.push(rs() * TAU, rs() * TAU, rs.range(0.18, 0.36), rs()); P.weed.push([x, -a, L]); }
    const wg2 = new THREE.InstancedBufferGeometry(); wg2.setAttribute('position', new THREE.Float32BufferAttribute(wp, 3));
    wg2.setAttribute('wA', new THREE.InstancedBufferAttribute(new Float32Array(wA), 4)); wg2.setAttribute('wB', new THREE.InstancedBufferAttribute(new Float32Array(wB), 4));
    wg2.instanceCount = nF; wg2.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, SEA_Y, -(w1 + w2) / 2), (w2 - w1) / 2 + sea.W + 6);
    const wmat = new THREE.ShaderMaterial({ uniforms: { ...U }, side: THREE.DoubleSide,
      vertexShader: LOOK_COMMON + SWELL_GLSL + /* glsl */`attribute vec4 wA; attribute vec4 wB; varying vec3 vW; varying vec2 vT;
void main() {
  float t = position.y, yaw = wB.x + 0.3 * sin(uTime * 0.45 + wB.y), bend = 0.55 * t * sin(t * 3.1 + uTime * 0.9 + wB.y);
  vec2 dir = vec2(cos(yaw + bend), sin(yaw + bend)), xz = wA.xz + dir * (t * wA.w) + vec2(-dir.y, dir.x) * (position.x * wB.z);
  vec3 w = vec3(xz.x, wA.y + swell(xz, uTime), xz.y); vW = w; vT = vec2(t, wB.w);
  gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.);
}`,
      fragmentShader: LOOK_COMMON + /* glsl */`varying vec3 vW; varying vec2 vT;
void main() { vec4 zw = zoneW(-vW.z); vec4 fog = zw.x * uFog[0] + zw.y * uFog[1] + zw.z * uFog[2] + zw.w * uFog[3]; float dist = length(cameraPosition - vW);
  vec3 key = zw.x * uKey[0] + zw.y * uKey[1] + zw.z * uKey[2] + zw.w * uKey[3], sky = zw.x * uSky[0] + zw.y * uSky[1] + zw.z * uSky[2] + zw.w * uSky[3];
  vec3 col = mix(vec3(0.09, 0.13, 0.045), vec3(0.2, 0.23, 0.08), vT.y) * (0.7 + 0.55 * vT.x) * (key * 0.9 + sky * 2.2);
  gl_FragColor = vec4(mix(col, 0.5 * (fog.rgb + uEyeFog.rgb), 1. - exp(-0.5 * (fog.a + uEyeFog.a) * dist)), 1.); }` });
    scene.add(new THREE.Mesh(wg2, wmat)); }
  await ctx.yield();
  // DRY GRASS IN THE JOINTS OF THE LAST HALL'S FLAGS (its own stream): tufts of four to six blades, each tuft rooted ON
  // a joint between two courses of the flags (the flags' own measure, GRASS.course), GRASS.off m and more from the
  // hall's axis (the middle of the way is worn bare) and thicker toward the walls where the sand has drifted; none
  // where a heap, a strewn stone, a fallen piece or a plinth lies, and NONE WHERE A ROOK STANDS before the doorway
  // (the rook's own footprint as it is turned, beak's end to tail's end and its folded breadth: BIRD_FOLDED by its
  // span, with the tuft's spread about it). Such a tuft is not there, and EVERY TUFT TAKES THE SAME DRAWS WHETHER IT
  // STANDS OR NOT: its place, its blades and its height are all drawn before the test, so what refuses one tuft
  // deals no other tuft anew.
  // A blade is GRASS.high m at the most: floor dress, far under the lens. IT STIRS on the world clock: every blade
  // bends with the evening's air, in waves that cross the hall from the evening hand, and trembles a little of its own
  if (forks.grass) { const rg = forks.grass, ru = P.ruin, Q = GRASS, n = Math.round(Q.tufts * o.density), gp = [], gA = [], gB = [], f = UP_Y;
    // (a blade: three triangles, its foot two units broad, drawn in to a point at its tip)
    gp.push(-1, 0, 0, 1, 0, 0, 0.45, 0.6, 0, -1, 0, 0, 0.45, 0.6, 0, -0.45, 0.6, 0, -0.45, 0.6, 0, 0.45, 0.6, 0, 0, 1, 0);
    P.grass = [];
    const rooks = P.perched.filter((q) => q.rook), BF = BIRD_FOLDED;
    const onRook = (x, z) => rooks.some((q) => { const fx = Math.cos(q.face), fz = Math.sin(q.face), u = (x - q.x) * fx + (z - q.z) * fz, w = -(x - q.x) * fz + (z - q.z) * fx;
      return u > -BF.aft * q.sz - Q.spread && u < BF.fore * q.sz + Q.spread && Math.abs(w) < BF.half * q.sz + Q.spread; });
    for (let i = 0; i < n; i++) { const sd = rg.sign(), x = sd * Math.max(Q.off, ru.W - 0.5 - Math.abs(rg.gauss()) * 3.6), z = -Math.round(rg.range(ru.a0 + 2, ru.a1 - 0.8) / Q.course) * Q.course, nb = rg.int(4, 6), tone = rg(), ph = rg() * TAU;
      const blades = []; for (let k = 0; k < 6; k++) blades.push([rg.range(-Q.spread, Q.spread), rg() * TAU, rg.range(0.1, 0.5), rg.range(0.5, 1)]);
      const hh = Q.high * rg.range(0.45, 1);
      if (onRook(x, z) || P.heaps.some((h) => Math.hypot(x - h.x, z - h.z) < h.R * 1.3 + 0.3) || (P.strewn || []).some((q) => Math.hypot(x - q.x, z - q.z) < q.r + 0.2) || (P.frags || []).some((q) => Math.hypot(x - q[0], z - q[1]) < 2.6) || P.solids.some((q) => q.y0 <= f + 0.5 && Math.hypot(x - q.x, z - q.z) < q.r + 0.2)) continue;
      P.grass.push([x, z, hh]);
      for (let k = 0; k < nb; k++) { const b = blades[k]; gA.push(x + b[0], f, z + b[0] * 0.3, hh * b[3]); gB.push(b[1], b[2], ph + k, tone); } }
    const gg = new THREE.InstancedBufferGeometry(); gg.setAttribute('position', new THREE.Float32BufferAttribute(gp, 3));
    gg.setAttribute('gA', new THREE.InstancedBufferAttribute(new Float32Array(gA), 4)); gg.setAttribute('gB', new THREE.InstancedBufferAttribute(new Float32Array(gB), 4));
    gg.instanceCount = gA.length / 4; gg.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, f, -(ru.a0 + ru.a1) / 2), ru.L / 2 + ru.W + 4);
    const gmat = new THREE.ShaderMaterial({ uniforms: { ...U }, side: THREE.DoubleSide,
      vertexShader: LOOK_COMMON + /* glsl */`attribute vec4 gA; attribute vec4 gB; varying vec3 vW; varying vec2 vT;
void main() {
  float t = position.y, h = gA.w; vec2 dir = vec2(cos(gB.x), sin(gB.x));
  float air = 0.16 * sin(uTime * 1.5 - gA.x * 0.33 + gA.z * 0.21) + 0.1 * sin(uTime * 2.6 - gA.x * 0.5 + gB.z) + 0.05 * sin(uTime * 5.3 + gB.z * 3.);
  vec3 w = vec3(gA.x, gA.y, gA.z) + vec3(dir.x * gB.y + (0.22 + air), 0., dir.y * gB.y + 0.3 * air) * (t * t * h) + vec3(-dir.y, 0., dir.x) * (position.x * 0.022);
  w.y += t * h * (1. - 0.25 * t * (gB.y + abs(air))); vW = w; vT = vec2(t, gB.w);
  gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.);
}`,
      fragmentShader: LOOK_COMMON + /* glsl */`varying vec3 vW; varying vec2 vT;
void main() { vec4 fog = uFog[3]; float dist = length(cameraPosition - vW);
  int ci = int(clamp(floor((-vW.z + (vW.x + uRuin.x) * 0.124 - uRuin.z) / uRuin.w), 0., 15.)); float sunR = smoothstep(-1., 1.4, vW.y + (vW.x + uRuin.x) * uRuin.y - uCut[ci]);
  vec3 col = mix(vec3(0.3, 0.27, 0.13), vec3(0.5, 0.43, 0.22), vT.y) * (0.55 + 0.6 * vT.x) * (uSky[3] * 2.4 + uKey[3] * 0.55 * sunR + vec3(${MOON_LIGHT.map((q) => q.toFixed(3)).join(', ')}) * 0.5 * moonAt(vW)) * (1. - 0.4 * uSnow);
  gl_FragColor = vec4(mix(col, 0.5 * (fog.rgb + uEyeFog.rgb), 1. - exp(-0.5 * (fog.a + uEyeFog.a) * dist)), 1.); }` });
    scene.add(new THREE.Mesh(gg, gmat)); }
  return { update() {}, count: NB };
}
