// CITY CLOSING OVERHEAD, THE TOWN'S PLAN AS PURE DATA (builder A; design/film/city-closing-overhead.redesign.md, section 4).
// No mesh, no texture, no light: only the typed figures of the place and what named streams deal. THE AXES: the curl's plan is
// (a, z), a the arc length from the hinge (0 to 596.5) and z along the flight; the flat town's plan is (f, z), f = 56 - x from
// the promenade's right-hand fronts; x IS WORLD x in every field that says x. Every edge of a street, block, square and of the
// cut stands on a WHOLE METRE, because the land reads its class at one texel a metre and its edges must lie under walls.
// THE EXTENTS ARE THE CORE'S (PLAN): the FLAT town runs from PLAN.TOWN_Z0 to PLAN.TOWN_Z1, 100 m past the ring; THE ROLLED TOWN
// RUNS ON to PLAN.ROLL_TOWN_Z1 (a margin off the roll's tip: where the roll begins to narrow), its rows THINNING from
// PLAN.TOWN_Z1 on (plan.thin: a block stands by a falling chance, the others are hedged fields, plots and orchards). Over the
// taper to PLAN.Z_TIP the rolled land is fields, three lit farms and one lamp-lit earth lane; the flat land beyond its town is
// outskirts as before. NOTHING OF THE ROLL IS HANDED ON PAST THE LAND'S EDGE (onLand: the core's Lz at the thing's own z, its
// half-width and 2 m): the taper's fields go on as cut pieces, trees, lamps, farms and the lane are tested. No gravel and no pale line lies on the roll's open land. THE KERB ROW ON THE ROLL'S SIDE IS OPEN from
// the way's start to the fountain place's near edge (plan.kerbOpen: gardens, a low wall, limes). Nothing types a far end's metre.
// NO LATTICE: the cross streets are a DEALT WALK. The roll's wide streets (12 m) stand 135 to 186 m apart (four of them are
// anchored on typed places: the entry's, the hinge square's, the hanging square's two); between two of them each of three zones
// (foot and flank; the ceiling's inner columns; its outer columns) deals its own minor streets 45 to 62 m apart, so no lane
// runs on from zone to zone; THE FLAT TOWN DEALS ITS OWN WALK, never within 20 m of a wide street of the roll: no comb runs
// through the hinge. THE LONG STREETS JOG 6 to 14 m at every wide street (each its own dealt offset, by turns to either side)
// and some BEND 3 m at a minor street; so blocks are unequal both ways. Typed places override the walk: THE ENTRY PLACE (the
// arcaded row cut back before the first wide street's mouth: slabs from the hinge line to the fronts beyond the first long
// street), the hinge square, THE HANGING SQUARE (its two rows stand in stretches of 26 to 48 m, each set 0, 4 or 8 m into the
// square: it widens and narrows like a market place), three small squares, TWO PARKS (one block of the flank, one of the
// ceiling: grass, crossing gravel paths, hedged, trees in clumps, a gate lamp at each gate), five dealt tower houses.
// THE BRINK AND THE RIM: the brink lane at a 556 to 562; beyond it plots whose houses' backs stand on the BUILT LINE
// (brink.cutA: a 587 less a dealt walk of 0, 7 or 14 m); beyond the built line THE RIM STREET (a 587 to 594) and its PARAPET
// (a 594 to 595, the core builds it with the land) with a lamp every 24 m: the roll's free edge (brink.edgeA) is one lit line.
import { PLAN, Lz, GROUND_CLS, GROUND_SUB } from './city-closing-overhead.js';

const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];   // sRGB bytes
const SETTS = hex('#6a6660'), SLABS = hex('#8a8078'), YARD = hex('#4a4238'), GARDEN = hex('#24382a'), COURT = hex('#5a5448');
const LONG_FOOT = [34, 72, 110, 148, 186, 224, 262], LONG_CEIL = [330, 398, 466, 534];     // the long streets' middles before their jogs, 8 m wide (a 330: 12 m)
// the ceiling's plan begins at the last flank street's far kerb (a 266); the brink lane is 6 m wide
const CEIL_A0 = 266, LANE_A0 = 556, LANE_A1 = 562;
const EDGE = 595;                                            // the land's last whole metre on the full roll (the parapet's outer face stays inside L - 0.5)
// THE RIM: a street 7 m wide between the built line and the parapet; the parapet's metre; the built line's walk steps 7 m,
// so the shallowest plot (a 562 to 573) still holds a house 11 m deep
const RIM = { a0: 587, a1: 594, wall: { a0: 594, a1: 595, h: 1.1 } }, JOG = 7;
const WIDE_A = 330;                                          // the hanging town's ONE WIDE LONG STREET: its first, 12 m (the wide streets' own width)
const SQ_HINGE = { a0: 6, a1: 30, z0: 114, z1: 266 };        // the promenade's row left out for 152 m about the hinge square's wide street
const SQ_HANG = { a0: 413, a1: 451, z0: 516, z1: 773 };      // 38 m of slabs at the most between the rows of a 402 to 413 and 451 to 462
// the wide streets the typed places stand on: the entry's (30 m past the route's first point), the hinge square's mouth, the
// hanging square's near end and its middle; hangFar is the minor street on the hanging square's far end (kerb z 773)
const ANCHOR = { entry: 30, hinge: 190, hangNear: 510, hang: 670, hangFar: 777 };
const tint = (rgb, k) => rgb.map((v) => Math.max(0, Math.min(255, Math.round(v * k))));
// n gaps of 45 to 62 m, street middle to street middle, that fill G (where no whole answer stands, equal parts)
const minorGaps = (R, G) => {
  const nLo = Math.ceil(G / 62), nHi = Math.floor(G / 45), out = [];
  if (nHi < nLo) { const n = Math.max(1, Math.round(G / 53.5)); let z = 0; for (let i = 1; i <= n; i++) { const e = Math.round(G * i / n); out.push(e - z); z = e; } return out; }
  const n = R.int(nLo, nHi); let rem = G;
  for (let i = 0; i < n - 1; i++) { const left = n - i - 1, g = R.int(Math.max(45, rem - 62 * left), Math.min(62, rem - 45 * left)); out.push(g); rem -= g; }
  out.push(rem); return out;
};
// k gaps of 135 to 186 m (three or four minor gaps each) that fill G
const wideGaps = (R, G, k) => { const out = []; let rem = G; for (let i = 0; i < k - 1; i++) { const left = k - i - 1, g = R.int(Math.max(135, rem - 186 * left), Math.min(186, rem - 135 * left)); out.push(g); rem -= g; } out.push(rem); return out; };

// ASYNC: the plan is laid in pieces with ctx.yield() between them (no step of it holds the page; every draw comes from a name
// stream of its own, so a hand-back between two pieces changes no draw's order): the caller awaits it.
export async function makeTownPlan(ctx) {
  const pause = () => (ctx && ctx.yield ? ctx.yield() : null);
  const stream = (n) => ctx.core.makeRng(ctx.core.hashSeed('closing-' + n + ':' + ctx.seed));
  const Z0 = PLAN.TOWN_Z0, DZ1 = PLAN.TOWN_Z1, TZ1 = PLAN.ROLL_TOWN_Z1, ZF1 = PLAN.Z_FULL1, ZT = PLAN.Z_TIP, C = GROUND_CLS;
  // ---- THE ROLL'S WIDE STREETS (their middles): the anchors, and between them a dealt walk; the last is the town's edge road
  const Rw = stream('wide'), wides = [ANCHOR.entry, ANCHOR.hinge]; let NR0 = 0;   // NR0: the reaches of the walk to PLAN.TOWN_Z1 (their draws stand as they were)
  { const g = wideGaps(Rw, ANCHOR.hangNear - ANCHOR.hinge, 2); wides.push(ANCHOR.hinge + g[0], ANCHOR.hangNear, ANCHOR.hang);
    let z = ANCHOR.hang + Rw.int(152, 169); wides.push(z);    // (45 to 62 m past the hanging square's far street: one block between them)
    for (const q of wideGaps(Rw, DZ1 - 6 - z, 3)) { z += q; wides.push(z); }
    // THE ROLLED TOWN RUNS ON from the flat town's end (PLAN.TOWN_Z1) to PLAN.ROLL_TOWN_Z1, where the roll begins to narrow: its
    // wide streets go on at equal gaps nearest 160 m (no draw: the walk before them stands as it was), the last the edge road
    NR0 = wides.length; const G = TZ1 - 6 - z, kOn = Math.max(1, Math.round(G / 160)); if (G >= 45) for (let i = 1; i <= kOn; i++) wides.push(Math.round(z + G * i / kOn)); }
  const NR = wides.length, reachZ = (r) => [r === 0 ? Z0 : wides[r - 1], wides[r]];   // reach 0 from the town's first z; reach r between two wide streets
  // ---- each zone's own minor streets, reach by reach (the entry's reach holds one, 45 to 62 m before the first wide street)
  const zoneMinors = (name, fixed) => {
    const R = stream('minor-' + name), out = [];
    for (let r = 0; r < NR; r++) {
      const [zA, zB] = reachZ(r), list = []; let z = zA;
      if (r === 0) { out.push([zB - R.int(45, 62)]); continue; }
      const walkTo = (zE) => { const g = minorGaps(R, zE - z); for (let i = 0; i + 1 < g.length; i++) { z += g[i]; list.push(z); } z = zE; };
      if (fixed !== undefined && fixed > zA + 45 && fixed < zB - 44) { walkTo(fixed); list.push(fixed); }
      walkTo(zB); out.push(list);
    }
    return out;
  };
  const minors = { flank: zoneMinors('flank'), inner: zoneMinors('inner'), outer: zoneMinors('outer', ANCHOR.hangFar) };
  const cellsOf = (zone) => {                                 // the stretches of z between a zone's cross streets, kerb to kerb
    const out = [];
    for (let r = 0; r < NR; r++) {
      const [zA, zB] = reachZ(r), m = minors[zone][r]; let z = r === 0 ? Z0 : zA + 6;
      m.forEach((q, i) => { out.push({ z0: z, z1: q - 4, r, i }); z = q + 4; }); out.push({ z0: z, z1: zB - 6, r, i: m.length });
    }
    return out;
  };
  // ---- THE LONG STREETS' JOGS: in each reach a street stands 3 to 5 m (the hanging square's two: 6 or 7 m) to one side of its
  // typed middle, by turns reach after reach, so at a wide street it jogs 6 to 14 m; the promenade's first street and the
  // flank's last never jog (the arcaded row and the ceiling's first kerb keep their metres), and the hanging square's two
  // never jog within 60 m of the square. SOME BEND: one reach in three, at a dealt minor street, 3 m further out.
  const Ro = stream('jogs'), Ron = stream('jogs-on'), nearSq = (r) => { const [zA, zB] = reachZ(r); return zB > SQ_HANG.z0 - 60 && zA < SQ_HANG.z1 + 60; };
  const dealOff = (phase, canJog, canBend, zone, big) => {
    const out = [];
    for (let r = 0; r < NR; r++) {
      const Rj = r < NR0 ? Ro : Ron, d = Rj.int(3, 5), m = big ? 6 + (d % 2) : d, sg = (r + phase) % 2 ? -1 : 1, bend = Rj() < 0.35, bi = Rj.int(0, 7),   // (the reaches of the town's run on deal from a stream of their own)
      nm = zone ? minors[zone][r].length : 0;
      if (!canJog(r)) out.push({ o: 0, o2: 0, at: -1 });
      else out.push(canBend && bend && nm > 0 && r > 0 ? { o: sg * m, o2: sg * (m + 3), at: bi % nm } : { o: sg * m, o2: sg * m, at: -1 });
    }
    return out;
  };
  const phF = Ro.int(0, 1), phC = Ro.int(0, 1);
  const offF = LONG_FOOT.map((c, i) => dealOff(phF, () => i > 0 && i < 6, i >= 2 && i <= 4, 'flank', false));
  const offC = LONG_CEIL.map((c, i) => dealOff(phC, (r) => (i === 1 || i === 2 ? !nearSq(r) : true), i === 0, i === 0 ? 'inner' : null, i === 1 || i === 2));
  const offAt = (O, r, i) => (O[r].at >= 0 && i > O[r].at ? O[r].o2 : O[r].o);   // a street's offset in cell i of reach r
  await pause();
  // ---- the long streets, a rectangle a reach (two where one bends), from wide middle to wide middle
  const longs = [];
  const addLong = (c, hw, O, zone, mz, wide) => {
    for (let r = 0; r < NR; r++) {
      const [zA, zB] = reachZ(r), q = O[r], one = (o, z0, z1) => longs.push({ a0: c - hw + o, a1: c + hw + o, z0, z1, zone, wide });
      if (q.at < 0) one(q.o, zA, zB); else { const zm = minors[mz][r][q.at]; one(q.o, zA, zm); one(q.o2, zm, zB); }
    }
  };
  LONG_FOOT.forEach((c, i) => addLong(c, 4, offF[i], 'foot', 'flank', false));
  LONG_CEIL.forEach((c, i) => addLong(c, c === WIDE_A ? 6 : 4, offC[i], 'ceiling', 'inner', c === WIDE_A));
  longs.push({ a0: LANE_A0, a1: LANE_A1, z0: Z0, z1: TZ1, zone: 'brink' });                   // the brink lane (6 m)
  // ---- the cross streets: the wide ones from the hinge line to the rim street; each zone's minor ones across its own columns
  // (the outer zone's stop at the hanging square's far row where they would cross the square)
  const cross = [];
  for (const w of wides) cross.push({ z0: w - 6, z1: w + 6, wide: true, aStart: 0, aEnd: RIM.a0 });
  for (let r = 0; r < NR; r++) {
    for (const m of minors.flank[r]) cross.push({ z0: m - 4, z1: m + 4, wide: false, aStart: 0, aEnd: CEIL_A0 });
    for (const m of minors.inner[r]) cross.push({ z0: m - 4, z1: m + 4, wide: false, aStart: CEIL_A0, aEnd: 394 + offC[1][r].o });
    for (const m of minors.outer[r]) cross.push({ z0: m - 4, z1: m + 4, wide: false, aStart: m > SQ_HANG.z0 && m < SQ_HANG.z1 ? 462 + offC[2][r].o : 402 + offC[1][r].o, aEnd: LANE_A0 });
  }
  for (const c of cross) c.zEnd = c.z1;                       // (a street is one rectangle: a from aStart to aEnd, z0 to z1)

  await pause();
  // ---- the blocks: a zone's cells by its columns (under 20 m of z no terrace fits: left as paving)
  const blocks = [], HZ0 = SQ_HINGE.z0 - 8, HZ1 = SQ_HINGE.z1 + 8, KZ0 = ANCHOR.entry - 30, kerbBeds = []; let entry = null;   // KZ0: the way's start (its first wide street stands 30 m on)
  for (const cl of cellsOf('flank')) {
    // THE PROMENADE'S ARCADED ROW (a 6 to 30): CUT BACK before the first wide street (the entry place: the cell between the
    // entry's minor street and that wide street's near kerb), and left out along the hinge square's paving
    const own = [];
    if (cl.r === 0 && cl.i === 1) entry = { a0: 0, a1: 30, z0: cl.z0, z1: cl.z1 };
    else if (cl.z1 <= KZ0 || cl.z0 >= HZ1) own.push([cl.z0, cl.z1]);
    else { own.push([cl.z0, Math.min(cl.z1, KZ0)]); own.push([Math.max(cl.z0, HZ1), cl.z1]); }
    // THE KERB ROW IS OPEN from the way's start (KZ0) to the fountain place's near edge (HZ0): no house stands between the way and
    // the foot of the rise there; each cell's stretch of it is a kerb garden (slabs by the kerb, grass, a low wall on a 29 to 30)
    if (!(cl.r === 0 && cl.i === 1)) { const k0 = Math.max(cl.z0, KZ0), k1 = Math.min(cl.z1, HZ0); if (k1 - k0 >= 6) kerbBeds.push({ a0: 6, a1: 30, z0: k0, z1: k1 }); }
    for (const s of own) if (s[1] - s[0] >= 20) blocks.push({ a0: 6, a1: 30, z0: s[0], z1: s[1], rows: 'z', yard: 0, zone: 'promenade' });
    if (cl.z1 - cl.z0 >= 20) for (let i = 1; i < LONG_FOOT.length; i++) {
      const a0 = LONG_FOOT[i - 1] + 4 + offAt(offF[i - 1], cl.r, cl.i), a1 = LONG_FOOT[i] - 4 + offAt(offF[i], cl.r, cl.i);
      blocks.push({ a0, a1, z0: cl.z0, z1: cl.z1, rows: 'z', yard: a1 - a0 - 22, zone: i <= 2 ? 'foot' : 'flank' });   // two rows 11 m deep back to back, the yard between
    }
  }
  const colA = (ci, r, i) => (ci === 0 ? [CEIL_A0, 324 + offAt(offC[0], r, i)] : ci === 1 ? [336 + offAt(offC[0], r, i), 394 + offC[1][r].o]
    : ci === 2 ? [402 + offC[1][r].o, 462 + offC[2][r].o] : ci === 3 ? [470 + offC[2][r].o, 530 + offC[3][r].o] : [538 + offC[3][r].o, LANE_A0]);
  for (const zn of ['inner', 'outer']) for (const cl of cellsOf(zn)) for (const ci of zn === 'inner' ? [0, 1] : [2, 3, 4]) {
    if (ci === 2 && cl.z0 >= SQ_HANG.z0 && cl.z1 <= SQ_HANG.z1) continue;   // THE HANGING SQUARE takes this column from its wide street's kerb (z 516) to its far street's (773)
    const [a0, a1] = colA(ci, cl.r, cl.i);
    if (cl.z1 - cl.z0 >= 20) blocks.push({ a0, a1, z0: cl.z0, z1: cl.z1, rows: 'a', yard: Math.max(0, cl.z1 - cl.z0 - 22), zone: 'ceiling', col: ci });
  }
  // THE HANGING SQUARE'S TWO ROWS, facing each other across the slabs, parted by its wide street: each stands in stretches of 26
  // to 48 m, a stretch set 0, 4 or 8 m into the square and never as its neighbour, so the open ground is 22 to 38 m wide and
  // its outline uneven; about tower B (its first 40 m) and the church (its last 58 m) the rows stand back at the full width
  const Rh = stream('hanging-square'), hang = { near: [], far: [] }, SET = [0, 4, 8];
  for (const side of ['near', 'far']) for (const zz of [[SQ_HANG.z0, ANCHOR.hang - 6], [ANCHOR.hang + 6, SQ_HANG.z1]]) {
    let z = zz[0], prev = -1;
    while (z < zz[1]) {
      let len = Rh.int(26, 48); if (zz[1] - z - len < 22) len = zz[1] - z;
      let si = (prev + 1 + Rh.int(0, 1)) % 3; if (z < SQ_HANG.z0 + 40 || z + len > SQ_HANG.z1 - 58) si = 0;
      prev = si; const a0 = side === 'near' ? 402 + SET[si] : 451 - SET[si];
      blocks.push({ a0, a1: a0 + 11, z0: z, z1: z + len, rows: 'z', yard: 0, zone: 'ceiling', single: true, faces: side === 'near' ? 1 : -1 });
      hang[side].push({ z0: z, z1: z + len, a0: side === 'near' ? a0 + 11 : SQ_HANG.a0, a1: side === 'near' ? SQ_HANG.a1 : a0, front: side === 'near' ? a0 + 11 : a0 });
      z += len;
    }
  }
  const hangFront = (side, z) => { const q = hang[side].find((h) => z >= h.z0 && z <= h.z1); return q ? q.front : side === 'near' ? SQ_HANG.a0 : SQ_HANG.a1; };
  await pause();
  // ---- THE TYPED PLACES (they override the walk: no block and no street lamp stands inside one)
  const squares = {
    // the hinge square, paved from the hinge line to the far fronts (a 38); the mast of its strings stands in the middle of the
    // half beyond its wide street's mouth, the fountain in the nearer half
    hinge: { ...SQ_HINGE, a0far: SQ_HINGE.a0, a1far: SQ_HINGE.a1, paved: { a0: 0, a1: 38, z0: HZ0, z1: HZ1 }, mast: { a: 18, z: 215, h: 9 } },
    // the hanging square: outline is its open ground stretch by stretch (near: from the near row's front; far: to the far row's)
    hanging: { ...SQ_HANG, a0far: SQ_HANG.a0, a1far: SQ_HANG.a1, paved: { ...SQ_HANG }, mast: { a: 432, z: 630, h: 9 }, outline: hang },
    // THE ENTRY PLACE: slabs from the hinge line to the fronts beyond the first long street, from the entry's minor street to the
    // first wide street's far kerb: its mouth stands open from the route's first metre, the street seen climbing
    entry: entry && { ...entry, paved: { a0: 0, a1: 38, z0: entry.z0 - 8, z1: ANCHOR.entry + 6 } },
  };
  // FIVE TOWER HOUSES, DEALT: the town's length in five equal parts, in each a dealt court of the ceiling's columns beyond a 330
  // (its middle 30 m and more inside its part, its court 12 m deep and more), the tower in the court's middle, 24 to 32 m high
  const Rtw = stream('tower-houses'), towerHouses = [];
  for (let k = 0; k < 5; k++) {
    const zA = Z0 + (DZ1 - Z0) * k / 5, zB = Z0 + (DZ1 - Z0) * (k + 1) / 5, pick = Rtw(), h = Rtw.int(24, 32);
    const cand = blocks.filter((b) => b.rows === 'a' && b.col >= 1 && b.yard >= 12 && b.a1 - b.a0 >= 12 && (b.z0 + b.z1) / 2 >= zA + 30 && (b.z0 + b.z1) / 2 < zB - 30);
    if (!cand.length) continue;
    const b = cand[Math.floor(pick * cand.length)]; b.tower = true;
    towerHouses.push({ a: (b.a0 + b.a1) / 2, z: (b.z0 + b.z1) / 2, w: 6, d: 6, h });
  }
  // THREE SMALL SQUARES, one in each of the ceiling's columns 0, 1 and 3: in a dealt block that holds no tower, the block's last
  // 22 m toward its long street are left out and paved in slabs; a lime 12 m in its middle (the town builder's to plant)
  const Rq = stream('small-squares'); squares.small = [];
  for (const ci of [0, 1, 3]) {
    const cand = blocks.filter((b) => b.col === ci && b.rows === 'a' && !b.tower && b.z0 > 60 && b.z1 < DZ1 - 100 && b.a1 - b.a0 >= 44);
    if (!cand.length) continue;
    const b = cand[Rq.int(0, cand.length - 1)], q = { a0: b.a1 - 22, a1: b.a1, z0: b.z0, z1: b.z1 };
    b.a1 = q.a0; b.small = true; q.tree = { a: (q.a0 + q.a1) / 2, z: (q.z0 + q.z1) / 2, kind: 'lime', h: 12 };
    squares.small.push(q);
  }
  // TWO PARKS, landmarks a stranger can find: one whole block of the flank (past the hinge square) and one of the ceiling's
  // second or fourth column, each dealt among the three largest that hold no tower and no small square; trees in three or
  // four clumps of three to five (the town builder's to plant: park.trees)
  const Rk = stream('parks'), parks = [];
  const park = (name, cand) => {
    const pick = Rk(), n = Rk.int(3, 4); if (!cand.length) return;
    cand.sort((p, q) => (q.a1 - q.a0) * (q.z1 - q.z0) - (p.a1 - p.a0) * (p.z1 - p.z0));
    const b = cand[Math.floor(pick * Math.min(3, cand.length))], P = { name, a0: b.a0, a1: b.a1, z0: b.z0, z1: b.z1, trees: [] };
    blocks.splice(blocks.indexOf(b), 1);
    for (let c = 0; c < n; c++) {
      const ca = Rk.range(P.a0 + 7, P.a1 - 7), cz = Rk.range(P.z0 + 7, P.z1 - 7), m = Rk.int(3, 5);
      for (let j = 0; j < m; j++) P.trees.push({ a: Math.max(P.a0 + 3, Math.min(P.a1 - 3, ca + Rk.range(-5, 5))), z: Math.max(P.z0 + 3, Math.min(P.z1 - 3, cz + Rk.range(-5, 5))), kind: Rk() < 0.5 ? 'lime' : 'plane', h: Rk.range(10, 16) });
    }
    parks.push(P);
  };
  park('flank', blocks.filter((b) => b.zone === 'flank' && b.z0 > HZ1 && b.z1 < DZ1 - 100));
  park('ceiling', blocks.filter((b) => b.rows === 'a' && !b.tower && !b.small && (b.col === 1 || b.col === 3) && b.z0 > 100 && b.z1 < DZ1 - 100));
  squares.parks = parks;
  const sites = {
    towerB: { a: 422, z: 528, w: 9, d: 9, h: 70 },           // in the hanging square's near end
    church: { a: 432, z: 750, w: 20, d: 40, h: 20, pitch: 50 },   // the hall, its nave along z (z 730 to 770), eaves 20 m
    towerHouses,
    fountains: [{ a: 16, z: 160, w: 3.2, d: 3.2, h: 4.5, square: 'hinge' }, { a: 432, z: 600, w: 3.2, d: 3.2, h: 4.5, square: 'hanging' }],
  };
  // ---- THE THINNING STRETCH (PLAN.TOWN_Z1 to PLAN.ROLL_TOWN_Z1): the town runs on along the roll and thins into outskirts. A block
  // there stands by a dealt chance falling from 0.8 at the stretch's start to 0.3 at its end (the foot's rows beside the way
  // always stand over its first third); a block that does not stand is a FIELD of its own size (garden plots, an orchard, a
  // pasture or plough), closed by hedges: the rows stand further apart, gardens and fields between them. The blocks before
  // the stretch keep their order (their tints' draws are as they were); the stretch's standing blocks follow them.
  const Rth = stream('thin'), thinFields = [];
  { const keep = [], on = [];
    for (const b of blocks) {
      if (b.z0 < DZ1) { keep.push(b); continue; }
      const t = ((b.z0 + b.z1) / 2 - DZ1) / Math.max(1, TZ1 - DZ1), x = Rth(), y = Rth(), k = Rth.range(0.85, 1.15), plough = Rth() < 0.4;
      if ((b.a1 <= LONG_FOOT[3] && t < 1 / 3) || x < 0.8 - 0.5 * t) { b.thin = true; on.push(b); continue; }
      const f = { u0: b.a0, u1: b.a1, z0: b.z0, z1: b.z1, kind: y < 0.45 ? 'plots' : y < 0.65 ? 'orchard' : 'field', trees: [], inTown: true, k, plough };
      if (f.kind === 'orchard') for (let p = f.u0 + 8; p < f.u1 - 6; p += 14) for (let q = f.z0 + 8; q < f.z1 - 6; q += 14) f.trees.push({ u: p + Rth.range(-2, 2), z: q + Rth.range(-2, 2), kind: Rth() < 0.6 ? 'pear' : 'walnut', h: Rth.range(5, 8) });
      thinFields.push(f);
    }
    blocks.length = 0; blocks.push(...keep, ...on); }
  await pause();
  // ---- THE BRINK: slots along the built line between the wide streets' mouths (a wide street runs on to the rim street)
  const R = stream('brink'), slots = [];
  const gaps = []; { let z = Z0; for (const w of wides) { gaps.push([z, w - 6]); z = w + 6; } }
  let jog = 1, si = 0; const gPhase = R.int(0, 4);           // the walk's place among 0, 7, 14 m (it begins in the middle); the gardens' dealt phase
  for (const g of gaps) {
    const len = g[1] - g[0], nLo = Math.ceil(len / 66), nHi = Math.max(nLo, Math.floor(len / 34)), n = R.int(nLo, nHi);
    let z = g[0];
    for (let i = 0; i < n; i++) {
      const z1 = i === n - 1 ? g[1] : Math.round(g[0] + len * (i + 1) / n + R.range(-2, 2));
      jog = Math.max(0, Math.min(2, jog + R.int(-1, 1)));
      const garden = (si++ + gPhase) % 5 === 0;               // ONE SLOT IN FIVE is a walled garden, on every deal
      slots.push({ z0: z, z1, jog: jog * JOG, cut: RIM.a0 - jog * JOG, kind: garden ? 'garden' : 'house' }); z = z1;
    }
  }
  // edgeA(z): THE LAND'S last whole metre at z (the class texture's cut): a 595 on the full roll, 4 m inside L on both tapers;
  // cutA(z): THE BUILT LINE at z (a slot's own; the rim street's inner kerb at a wide street's mouth; the land's edge off the town)
  // onLand(a, z, half): THE LAW OF THE LAND'S EDGE: a thing of that half-width at (a, z) stands 2 m and more inside the land's
  // free edge at its own z (the core's Lz). Nothing of the roll is handed on (a field, a tree, a lamp, a farm, the lane) past it.
  const onLand = (a, z, half) => a + half + 2 <= Lz(z);
  const edgeA = (z) => (z >= PLAN.Z_FULL0 && z <= ZF1 ? EDGE : Math.max(0, Math.min(EDGE, Math.floor(Lz(z)) - 4)));
  // THE TAPER'S FARMS (PLAN.ROLL_TOWN_Z1 to the tip, where the land narrows): three lit farmhouses, each a lone row 11 m deep and
  // 22 to 30 m long, fronting up the land, dealt in the taper's first metres where the land is still wide; a farm is not made
  // where the land's edge at its far end stands within 12 m of its front. The first stands beside the lane.
  const Rfarm = stream('farms'), farms = [];
  [[40, 56, 10], [110, 170, 6], [190, 236, 2]].forEach(([aLo, aHi, zPlay]) => {
    const len = Rfarm.int(22, 30), z0 = Math.round(TZ1 + 8 + Rfarm.range(0, zPlay)), a0 = Math.round(Rfarm.range(aLo, aHi));
    if (a0 + 23 > edgeA(z0 + len)) return;
    farms.push({ a0, a1: a0 + 11, z0, z1: z0 + len, a: a0 + 11.6, z: z0 + len / 2, lamp: 3.2 });
    blocks.push({ a0, a1: a0 + 11, z0, z1: z0 + len, rows: 'z', yard: 0, zone: a0 < 110 ? 'foot' : 'flank', single: true, faces: 1, farm: true });
  });
  const cutA = (z) => { if (z < Z0 || z >= TZ1) return edgeA(z); for (const s of slots) if (z >= s.z0 && z < s.z1) return s.cut; return RIM.a0; };

  await pause();
  // ---- THE LAMPS (bracket lanterns on walls, gate lanterns on piers: never a post). A street's lamp stands 0.6 m off a built
  // wall or it is not made. Heights over their own ground: 4.5 m on a street (the first floor's sill), 5 m on the wide streets
  // and the squares, 3.2 m at a gate, 2.2 m on the rim's parapet, 5.5 m on the promenade's fronts (section 4).
  const built = (a, z) => {
    for (const b of blocks) if (a >= b.a0 && a <= b.a1 && z >= b.z0 && z <= b.z1) return true;
    if (a >= LANE_A1 && z >= Z0 && z < TZ1) { const s = slots.find((q) => z >= q.z0 && z < q.z1); return !!s && s.kind === 'house' && a >= s.cut - 10.6 && a <= s.cut + 0.4; }
    return false;
  };
  const lamps = [];
  // THE FAR POOLS STAY ROUND POOLS: lamps thin out up the land by the plan's own rule (fewer, never fainter): a street's
  // spacing stands as typed on the foot (a under 110, beside the way), is x 1.8 on the flank (to a 266) and x 2.8 on the
  // ceiling (the walk's streets are more than the old lattice's: the far rows stay calm), so pools 20 m in radius stand apart there and never run into a band
  const thin = (a) => (a < 110 ? 1 : a < CEIL_A0 ? 1.8 : 2.8);
  const siteList = [sites.towerB, sites.church, ...sites.towerHouses, ...sites.fountains];
  const inSite = (a, z) => siteList.some((q) => Math.abs(a - q.a) < q.w / 2 + 6 && Math.abs(z - q.z) < q.d / 2 + 6);   // a typed place and 6 m round it
  // (where the lamps thin, a street's lamp is not made within 10 m of one already standing: at a corner two pools never run into one)
  const cells = new Map(), cell = (a, z) => Math.floor(a / 10) * 4096 + Math.floor(z / 10) + 2048;   // the lamps by squares of 10 m
  const crowded = (a, z, kind) => {
    if (thin(a) === 1 || kind === 'square') return false;
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (const l of cells.get(cell(a + 10 * i, z + 10 * j)) || []) if (Math.hypot(l.a - a, l.z - z) < 10) return true;
    return false;
  };
  const put = (a, z, h, kind) => {
    if (!(z >= Z0 && z <= ZT && a < edgeA(z) - 0.5 && !inSite(a, z) && !crowded(a, z, kind))) return false;
    const l = { a, z, h, kind }, c = cell(a, z); lamps.push(l); if (cells.has(c)) cells.get(c).push(l); else cells.set(c, [l]);
    return true;
  };
  const crossAt = (a, z) => cross.find((c) => z > c.z0 - 0.7 && z < c.z1 + 0.7 && a > c.aStart && a < c.aEnd);
  const longAt = (a, z) => longs.find((l) => a > l.a0 - 0.7 && a < l.a1 + 0.7 && z >= l.z0 - 6 && z <= l.z1 + 6);
  await pause();
  // long streets: every 22 m (x thin), staggered side to side and street to street; at a crossing the lamp goes to the nearer
  // corner; THE WIDE ONE as the wide cross streets: every 18 m (x thin) on both sides, 5 m up
  longs.forEach((l, li) => {
    const step = (l.wide ? 18 : 22) * thin((l.a0 + l.a1) / 2);
    for (let i = 0, z = l.z0 + 5 + (li % 2) * 11; z < l.z1; i++, z += step) {
      let zz = z; const c = crossAt((l.a0 + l.a1) / 2, z); if (c) zz = z - c.z0 < c.z1 - z ? c.z0 - 0.8 : c.z1 + 0.8;
      const first = (i + li) % 2 === 0;
      for (const side of first ? [0, 1] : [1, 0]) {
        const wallA = side === 0 ? l.a0 - 0.6 : l.a1 + 0.6, la = side === 0 ? l.a0 + 0.6 : l.a1 - 0.6;
        if (built(wallA, zz)) { put(la, zz, l.wide ? 5 : 4.5, l.wide ? 'wide' : 'street'); if (!l.wide) break; }
      }
    }
  });
  await pause();
  // cross streets: the wide ones every 18 m on both sides, the others every 22 m staggered (x thin at each lamp's own a); at a
  // long street, the nearer corner
  cross.forEach((c, ci) => {
    const step = c.wide ? 18 : 22, zc = (c.z0 + c.z1) / 2;
    for (let i = 0, a = c.aStart + (c.wide ? 9 : 11 + (ci % 2) * 6); a < c.aEnd; i++, a += step * thin(a)) {
      let aa = a; const l = longAt(a, zc); if (l) aa = a - l.a0 < l.a1 - a ? l.a0 - 0.8 : l.a1 + 0.8;
      const sides = c.wide ? [0, 1] : [(i + ci) % 2];
      for (const side of sides) {
        const wallZ = side === 0 ? c.z0 - 0.6 : c.z1 + 0.6, lz = side === 0 ? c.z0 + 0.6 : c.z1 - 0.6;
        if (built(aa, wallZ)) put(aa, lz, c.wide ? 5 : 4.5, c.wide ? 'wide' : 'street');
      }
    }
  });
  await pause();
  // the squares: every 12 m along their fronts, where a front stands
  for (const q of [squares.hinge.paved, squares.entry && squares.entry.paved]) if (q) {
    for (let z = q.z0 + 6; z <= q.z1 - 6; z += 12) if (built(38.6, z)) put(37.4, z, 5, 'square');   // the fronts beyond the first long street
    for (const a of [10, 22]) { if (built(a, q.z0 - 0.6)) put(a, q.z0 + 0.6, 5, 'square'); if (built(a, q.z1 + 0.6)) put(a, q.z1 - 0.6, 5, 'square'); }   // and the gable ends on it
  }
  for (let z = SQ_HANG.z0 + 6; z < SQ_HANG.z1; z += 12) if (Math.abs(z - ANCHOR.hang) > 7) { put(hangFront('near', z) + 0.6, z, 5, 'square'); put(hangFront('far', z) - 0.6, z, 5, 'square'); }
  // the small squares' rings: a lamp on each gable end of the shortened terraces and on each front across its long street
  for (const q of squares.small) for (const z of [q.z0 + 5.5, q.z1 - 5.5]) {
    put(q.a0 + 0.6, z, 5, 'square');
    const l = longs.find((x) => x.a0 === q.a1 && x.z0 <= z && x.z1 >= z); if (l && built(l.a1 + 0.6, z)) put(l.a1 - 0.6, z, 5, 'square');
  }
  // the parks: a gate lantern at each of a park's four gates (its paths' ends) and one where its paths cross
  for (const P of parks) { const am = Math.round((P.a0 + P.a1) / 2), zm = Math.round((P.z0 + P.z1) / 2); for (const q of [[am + 1.6, P.z0 + 0.5], [am + 1.6, P.z1 - 0.5], [P.a0 + 0.5, zm + 1.6], [P.a1 - 0.5, zm + 1.6], [am + 3.6, zm + 3.6]]) put(q[0], q[1], 3.2, 'gate'); }
  // the brink: one gate lamp a slot, at its own dealt place (never a line)
  const Rg = stream('gate-lamps');
  for (const s of slots) {
    const z = (s.z0 + s.z1) / 2 + Rg.range(-0.3, 0.3) * (s.z1 - s.z0);
    if (s.kind === 'house') put(s.cut - 11.2, z, 3.2, 'gate'); else if (s.kind === 'garden') put(LANE_A1 + 0.6, z, 3.2, 'gate');
  }
  // THE RIM'S ROW: a lantern on the parapet every 24 m, from the town's first z to the full roll's end (the outskirts' rim too)
  for (let z = Z0 + 12; z < ZF1; z += 24) put(RIM.a1 - 0.4, z, 2.2, 'gate');
  for (const fm of farms) put(fm.a, fm.z, fm.lamp, 'gate');                                 // a gate lantern at each farm's door
  for (let z = TZ1 + 10; z < ZT; z += 30) if (LONG_FOOT[0] + 8.6 < edgeA(z)) put(LONG_FOOT[0] + 2.6, z, 3.2, 'gate');   // THE LANE IS LAMP-LIT: a gate lantern every 30 m, while the land stands 6 m and more beyond it
  // the promenade's left row (the curl's first terrace): brackets at z 6 + 16 k, a 5.4, 5.5 m up; none where the row is cut back
  const lattice = { z0: 6, step: 16, xL: 95.4, xR: 56.6, y: 12.5, gapL: [SQ_HINGE.z0, SQ_HINGE.z1] };
  for (let z = lattice.z0 - 4 * lattice.step; z <= TZ1; z += lattice.step) if (built(6.6, z)) put(5.4, z, 5.5, 'bracket');

  await pause();
  // ---- THE STRINGS (bulbs every 1.5 m are the light builder's): a under 0 is the flat promenade (x = 90 + a, y = 7 + h)
  const strings = [];
  for (let k = 0; k < 10; k++) {                              // the promenade's zigzag, z 8 to 300, from front to front
    const zA = 8 + 29.2 * k, zB = zA + 29.2, leftFirst = k % 2 === 0, zL = leftFirst ? zA : zB;
    if (!built(6.6, zL)) continue;                            // (no front to hang from where the row is cut back or left out)
    strings.push({ a0: leftFirst ? 5.4 : -33.4, z0: zA, a1: leftFirst ? -33.4 : 5.4, z1: zB, h: 2.8, h0: 2.8, h1: 2.8, kind: 'promenade' });
  }
  const fan = (sq, ends) => { const m = sq.mast; for (const e of ends) strings.push({ a0: m.a, z0: m.z, a1: e[0], z1: e[1], h: (m.h + 5.5) / 2, h0: m.h, h1: 5.5, kind: 'square' }); };
  // each fan runs from its mast to the square's fronts, one string every 20 m of front (they end short of the streets' mouths)
  fan(squares.hinge, [-60, -40, -20, 0, 20, 40].map((d) => [37.4, 215 + d]).filter((e) => built(38.6, e[1])));
  fan(squares.hanging, [-40, -20, 0, 20, 34].flatMap((d) => [[hangFront('near', 630 + d) + 0.6, 630 + d], [hangFront('far', 630 + d) - 0.6, 630 + d]]));
  await pause();
  // ---- THE FILLS, painted in order (later over earlier): cls by GROUND_CLS, rgb in sRGB bytes
  const Rt = stream('ground'), fills = [];
  const fill = (a0, a1, z0, z1, cls, rgb, plain = false, sub) => fills.push({ a0, a1, z0, z1, cls, rgb, plain, sub });   // plain: setts with no middle course; sub: GROUND_SUB
  // YARDS, COURTS AND GARDENS ARE PLACES, each laid out in whole metres and dealt from the 'ground' stream: a strip of open
  // ground (a yard between two terraces, a court, a brink garden) is parted along its length into PLOTS of 14 to 30 m by a
  // hedge line 1 m wide; each plot takes one layout of its deck, never its neighbour's, in its own tint:
  //   setts: a court paved in setts, a drain line down its middle, a worn path 2 m wide a metre off one wall, a bed along the
  //          other wall where the court is 14 m wide and more;
  //   flags: flags with a bed 1 m wide along one wall; a drain down the middle of a wide one, in a narrow one a strip of
  //          earth 2 m wide down the middle (where the town's builder stands the yard's pears);
  //   lawn:  grass; wide: a gravel path 2 m wide down the middle and one across, beds along both walls; narrow (an orchard's
  //          grass): the trees' rings run together as a strip of earth down the middle, a gravel path along one wall;
  //   beds:  a kitchen garden: beds 2 m deep across the plot, a 1 m path between and round them (two rows where it is wide).
  // lay(E, deck, c0, c1, l0, l1, cls, drain): c across the strip, l along it; E paints one rectangle; drain is the sub of a
  // drain line running along l
  const S = GROUND_SUB, EARTH = hex('#352c22'), GRASS = hex('#2f4a2c'), GRAVEL = hex('#7a705f'), FLAGS = hex('#6e665a'), HEDGE = hex('#1a2a1e');
  // THE LAYING IS A STEP OF ITS OWN: the calls are kept (later, flatLater) and run by places(), which planTextures calls after
  // its first yield; each plan deals from its own stream ('places', 'flat-places'), so the order of the calls changes nothing.
  // A place lies wholly inside its own block's open ground, so its fills may be painted last.
  let Rl = null, later = [], flatLater = [];
  const lay = (E, deck, c0, c1, l0, l1, cls, drain) => {
    const w = c1 - c0, cm = Math.floor((c0 + c1) / 2); let l = l0, prev = -1;
    while (l1 - l >= 6) {
      let len = Rl.int(14, 30); if (l1 - l - len < 12) len = l1 - l;
      let p0 = l; if (l > l0) { E(c0, c1, l, l + 1, cls, HEDGE, S.HEDGE); p0 = l + 1; }
      const p1 = l + len, v = prev < 0 ? Rl.int(0, deck.length - 1) : (prev + 1 + Rl.int(0, deck.length - 2)) % deck.length;
      const k = Rl.range(0.9, 1.1), side = Rl() < 0.5; prev = v; l = p1;
      const wallBed = (sd) => E(sd ? c1 - 1 : c0, sd ? c1 : c0 + 1, p0, p1, cls, tint(EARTH, k), S.BED);
      if (deck[v] === 'setts') {
        E(c0, c1, p0, p1, cls, tint(COURT, k), S.SETT); E(cm, cm + 1, p0, p1, cls, tint(COURT, 0.8 * k), drain);
        const wa = side ? c0 + 1 : c1 - 3; E(wa, wa + 2, p0, p1, cls, tint(COURT, 1.16 * k), S.WORN);
        if (w >= 14) wallBed(side);
      } else if (deck[v] === 'flags') {
        E(c0, c1, p0, p1, cls, tint(FLAGS, k), S.FLAG);
        if (w >= 12) E(cm, cm + 1, p0, p1, cls, tint(FLAGS, 0.8 * k), drain); else E(cm - 1, cm + 1, p0, p1, cls, tint(EARTH, 1.15 * k), S.BED);
        wallBed(side);
      } else if (deck[v] === 'lawn') {
        E(c0, c1, p0, p1, cls, tint(GRASS, k), S.GRASS);
        if (w >= 12) {
          const pm = Math.floor((p0 + p1) / 2);
          E(cm - 1, cm + 1, p0, p1, cls, tint(GRAVEL, k), S.PATH); E(c0 + 1, c1 - 1, pm - 1, pm + 1, cls, tint(GRAVEL, k), S.PATH);
          wallBed(false); wallBed(true);
        } else { E(cm - 1, cm + 1, p0, p1, cls, tint(EARTH, 1.15 * k), S.BED); E(side ? c1 - 1 : c0, side ? c1 : c0 + 1, p0, p1, cls, tint(GRAVEL, k), S.PATH); }
      } else {
        E(c0, c1, p0, p1, cls, tint(GRAVEL, 0.72 * k), S.PATH);
        const halves = w >= 12 ? [[c0 + 1, cm - 1], [cm + 1, c1 - 1]] : [[c0 + 1, c1 - 1]];
        for (let q = p0 + 1; q + 2 <= p1 - 1; q += 3) for (const h of halves) E(h[0], h[1], q, q + 2, cls, Rl() < 0.5 ? tint(EARTH, Rl.range(0.9, 1.2)) : tint(GRASS, Rl.range(0.8, 1.1)), S.BED);
      }
    }
  };
  const EZ = (c0, c1, l0, l1, cls, rgb, sub) => fill(c0, c1, l0, l1, cls, rgb, false, sub);   // a strip along z (across a)
  const EA = (c0, c1, l0, l1, cls, rgb, sub) => fill(l0, l1, c0, c1, cls, rgb, false, sub);   // a strip along a (across z)
  // THE OUTSKIRTS' FIELDS (one law for the roll and the flat land): columns 46 to 96 m wide, in each column fields 36 to 78 m of
  // z, a hedge line on each field's near and inner side; a field is GARDEN PLOTS (laid as places; three in five of the row
  // next the town, one in five beyond), an ORCHARD (three fields in twenty; grass; its trees, 14 m apart with a dealt 2 m of play, are the town
  // builder's: field.trees) or a FIELD (pasture, or plough in two of five). E paints (u across, z along).
  const fieldsOf = (Rf, u0, u1, z0, z1, E, laterList) => {
    const out = [];
    for (let u = u0; u < u1;) {
      let w = Rf.int(46, 96); if (u1 - u - w < 40) w = u1 - u;
      for (let z = z0, first = true; z < z1; first = false) {
        let d = Rf.int(36, 78); if (z1 - z - d < 30) d = z1 - z;
        const x = Rf(), k = Rf.range(0.85, 1.15), plough = Rf() < 0.4, kind = x < (first ? 0.6 : 0.2) ? 'plots' : x < (first ? 0.75 : 0.35) ? 'orchard' : 'field';
        const f = { u0: u, u1: u + w, z0: z, z1: z + d, kind, trees: [] }, ploughed = kind === 'field' && plough; out.push(f);
        E(u, u + w, z, z + d, C.GARDEN, ploughed ? tint(EARTH, 1.2 * k) : tint(GRASS, (kind === 'orchard' ? 1 : 0.85) * k), ploughed ? S.BED : S.GRASS);
        E(u, u + w, z, z + 1, C.GARDEN, HEDGE, S.HEDGE); E(u, u + 1, z, z + d, C.GARDEN, HEDGE, S.HEDGE);
        if (kind === 'plots') laterList.push(() => lay(E, ['beds', 'lawn', 'beds'], u + 2, u + w - 1, z + 2, z + d - 1, C.GARDEN, S.DRAIN_Z));
        if (kind === 'orchard') for (let p = u + 8; p < u + w - 6; p += 14) for (let q = z + 8; q < z + d - 6; q += 14) f.trees.push({ u: p + Rf.range(-2, 2), z: q + Rf.range(-2, 2), kind: Rf() < 0.6 ? 'pear' : 'walnut', h: Rf.range(5, 8) });
        z += d;
      }
      u += w;
    }
    return out;
  };
  await pause();
  fill(0, 597, PLAN.Z_NEAR, Z0, C.YARD, tint(YARD, 0.9));                                 // the bare land before the town
  fill(0, 597, Z0, TZ1, C.LONG, SETTS, true);                                            // setts wherever nothing else is said
  fill(0, 597, TZ1, ZT, C.GARDEN, tint(GRASS, 0.85), false, S.GRASS);                    // THE OUTSKIRTS: open country to the tip
  // NO PALE LINE ON THE ROLL'S OPEN LAND: a path of the roll's fields and plots is trodden earth, never gravel (EQ)
  const EQ = (c0, c1, l0, l1, cls, rgb, sub) => EZ(c0, c1, l0, l1, cls, sub === S.PATH ? tint(EARTH, 1.3) : rgb, sub === S.PATH ? S.BED : sub);
  const fields = fieldsOf(stream('fields'), 6, RIM.a0, TZ1, ZT, EQ, later);
  for (const f of thinFields) {                               // the thinning stretch's fields, painted as the outskirts' are
    const pl = f.kind === 'field' && f.plough;
    f.rgb = pl ? tint(EARTH, 1.2 * f.k) : tint(GRASS, (f.kind === 'orchard' ? 1 : 0.85) * f.k); f.sub = pl ? S.BED : S.GRASS;
    EZ(f.u0, f.u1, f.z0, f.z1, C.GARDEN, f.rgb, f.sub);
    EZ(f.u0, f.u1, f.z0, f.z0 + 1, C.GARDEN, HEDGE, S.HEDGE); EZ(f.u0, f.u0 + 1, f.z0, f.z1, C.GARDEN, HEDGE, S.HEDGE);
    if (f.kind === 'plots') later.push(() => lay(EQ, ['beds', 'lawn', 'beds'], f.u0 + 2, f.u1 - 1, f.z0 + 2, f.z1 - 1, C.GARDEN, S.BED));
    fields.push(f);
  }
  // THE KERB GARDENS of the opened kerb row: slabs 10 m by the kerb, a bed of grass under the limes to the wall's foot, the wall's own metre in earth
  const Rkg = stream('kerb-garden'), kerbTrees = [];
  for (const q of kerbBeds) {
    fill(q.a0, q.a0 + 10, q.z0, q.z1, C.SLAB, SLABS); fill(q.a0 + 10, q.a1 - 1, q.z0, q.z1, C.GARDEN, tint(GRASS, Rkg.range(0.9, 1.1)), false, S.GRASS);
    fill(q.a1 - 1, q.a1, q.z0, q.z1, C.GARDEN, tint(EARTH, 1.1), false, S.BED);
    const n = Rkg.int(2, 4), zc = q.z0 + 5 + Rkg.range(0, Math.max(0, q.z1 - q.z0 - 10 - 5 * n));   // one clump of two to four limes a garden
    for (let i = 0; i < n; i++) kerbTrees.push({ a: q.a0 + 13 + Rkg.range(0, 8), z: zc + 5 * i + Rkg.range(-1, 1), kind: 'lime', h: Rkg.range(7, 10) });
  }
  // NOTHING STANDS WHERE THE LAND IS NOT. THE LANE ends where the land's edge comes within 2 m of it (laneZ1). A FIELD OF THE
  // TAPER is handed on as CUT PIECES (its paint stands as dealt: the class texture cuts it at the land's edge): strips of 12 to
  // 20 m of z, each cut back to the land's last metre at ITS FAR z (edgeA), cut round the lane and round each farm (3 m), and
  // left out under 10 m of a; a tree is handed on inside its piece and 6 m inside the land. The thinning stretch's fields (on
  // the full roll) are handed on whole, at the places in the list they had (the taper's first pieces before them, the rest after).
  let laneZ1 = TZ1; while (laneZ1 < ZT && onLand(LONG_FOOT[0], laneZ1 + 1, 2)) laneZ1++;
  const Rts = stream('taper-strips'), pieces = [], whole = [], outTrees = []; let nTaper = 0;
  const holes = [{ a0: LONG_FOOT[0] - 4, a1: LONG_FOOT[0] + 4, z0: TZ1, z1: laneZ1 }, ...farms.map((m) => ({ a0: m.a0 - 3, a1: m.a1 + 3, z0: m.z0 - 3, z1: m.z1 + 3 }))];
  for (const f of fields) {
    f.a0 = f.u0; f.a1 = f.u1;
    if (f.z1 <= ZF1) { whole.push(f); continue; }
    nTaper++;
    for (let s0 = f.z0; s0 < f.z1;) {
      let d = Rts.int(12, 20); if (f.z1 - s0 - d < 10) d = f.z1 - s0;
      const s1 = s0 + d; let spans = [[f.a0, Math.min(f.a1, edgeA(s1))]];
      for (const h of holes) if (h.z0 < s1 && h.z1 > s0) spans = spans.flatMap(([a, b]) => (h.a1 <= a || h.a0 >= b ? [[a, b]] : [[a, Math.min(b, h.a0)], [Math.max(a, h.a1), b]]));
      for (const [a, b] of spans) if (b - a >= 10) pieces.push({ u0: a, u1: b, a0: a, a1: b, z0: s0, z1: s1, kind: f.kind, taper: true,
        trees: f.trees.filter((t) => t.u >= a + 2 && t.u <= b - 3 && t.z >= s0 + 2 && t.z < s1 - 1 && onLand(t.u, t.z, 4)) });
      s0 = s1;
    }
  }
  while (pieces.length < nTaper) pieces.push({ u0: 6, u1: 6, a0: 6, a1: 6, z0: TZ1, z1: TZ1, kind: 'field', taper: true, trees: [] });   // (an empty piece keeps the list's places: no ground, nothing built)
  const handed = [...pieces.slice(0, nTaper), ...whole, ...pieces.slice(nTaper)];
  for (const f of handed) for (const t of f.trees) outTrees.push({ a: t.u, z: t.z, kind: t.kind, h: t.h });
  // ONE LANE runs on over the taper to laneZ1 (where the land's edge comes within 2 m of it), trodden earth 4 m wide (no gravel: no pale line): the first long street's
  fill(LONG_FOOT[0] - 2, LONG_FOOT[0] + 2, TZ1, laneZ1, C.GARDEN, tint(EARTH, 1.4), false, S.BED);
  for (const l of longs) fill(l.a0, l.a1, l.z0, l.z1, C.LONG, SETTS);                    // the long streets, each with its middle course
  for (const c of cross) fill(c.aStart, c.aEnd, c.z0, c.z1, C.CROSS, c.wide ? tint(SETTS, 1.08) : SETTS);
  // A FIELD OF THE THINNING STRETCH TAKES ITS HALF OF THE STREETS ABOUT IT: its own ground runs on to their middle lines (4 m; 6 m
  // to a wide street's), so no street lies as a pale line between two fields; beside a standing row the row's half stays, its lane
  for (const f of thinFields) {
    const g0 = wides.some((w) => Math.abs(f.z0 - 6 - w) < 1) ? 6 : 4, g1 = wides.some((w) => Math.abs(f.z1 + 6 - w) < 1) ? 6 : 4;
    for (const q of [[f.u0 - 4, f.u0, f.z0 - g0, f.z1 + g1], [f.u1, f.u1 + 4, f.z0 - g0, f.z1 + g1], [f.u0, f.u1, f.z0 - g0, f.z0], [f.u0, f.u1, f.z1, f.z1 + g1]])
      fill(Math.max(0, q[0]), Math.min(RIM.a0, q[1]), q[2], q[3], C.GARDEN, f.rgb, false, f.sub);
  }
  await pause();
  for (const b of blocks) {
    fill(b.a0, b.a1, b.z0, b.z1, b.rows === 'a' ? C.COURT : C.YARD, tint(b.rows === 'a' ? COURT : YARD, Rt.range(0.92, 1.08)));
    if (b.single || b.yard < 6) continue;
    const m = Math.round((b.a0 + b.a1) / 2);                  // a court lies between its two terraces (11 m each), garden walls at its ends
    if (b.rows === 'a') later.push(() => lay(EA, ['setts', 'flags', 'setts', 'lawn', 'beds'], b.z0 + 11, b.z1 - 11, b.a0 + 1, b.a1 - 1, C.COURT, S.DRAIN_A));
    else later.push(() => lay(EZ, ['flags', 'lawn', 'beds'], b.a0 + 11, b.a1 - 11, b.z0 + 1, b.z1 - 1, C.YARD, S.DRAIN_Z));
  }
  for (const s of slots) {
    fill(LANE_A1, RIM.a0, s.z0, s.z1, C.GARDEN, tint(GARDEN, Rt.range(0.9, 1.15)));
    const g1 = s.kind === 'garden' ? s.cut : s.cut - 11;      // a walled garden runs to the built line; a house's front garden to its front
    if (g1 - LANE_A1 >= 6) later.push(() => lay(EZ, ['lawn', 'beds'], LANE_A1, g1, s.z0 + 1, s.z1 - 1, C.GARDEN, S.DRAIN_Z));
  }
  // THE PARKS: grass inside a hedge, two gravel paths crossing in a round of gravel, a gate where each path meets the hedge
  for (const P of parks) {
    const am = Math.round((P.a0 + P.a1) / 2), zm = Math.round((P.z0 + P.z1) / 2);
    fill(P.a0, P.a1, P.z0, P.z1, C.GARDEN, tint(GRASS, 1.1), false, S.GRASS);
    for (const q of [[P.a0, P.a1, P.z0, P.z0 + 1], [P.a0, P.a1, P.z1 - 1, P.z1], [P.a0, P.a0 + 1, P.z0, P.z1], [P.a1 - 1, P.a1, P.z0, P.z1]]) fill(q[0], q[1], q[2], q[3], C.GARDEN, HEDGE, false, S.HEDGE);
    fill(am - 1, am + 1, P.z0, P.z1, C.GARDEN, GRAVEL, false, S.PATH); fill(P.a0, P.a1, zm - 1, zm + 1, C.GARDEN, GRAVEL, false, S.PATH);
    fill(am - 3, am + 3, zm - 3, zm + 3, C.GARDEN, GRAVEL, false, S.PATH);
    P.paths = [{ a0: am - 1, a1: am + 1, z0: P.z0, z1: P.z1 }, { a0: P.a0, a1: P.a1, z0: zm - 1, z1: zm + 1 }];
  }
  for (const q of squares.small) fill(q.a0, q.a1, q.z0, q.z1, C.SLAB, SLABS);
  // the hanging square: slabs over its whole width, then a yard behind each row that stands forward (the rows' own ground is theirs)
  fill(SQ_HANG.a0 - 11, SQ_HANG.a1 + 11, SQ_HANG.z0, SQ_HANG.z1, C.SLAB, SLABS);
  for (const b of blocks) if (b.single) { if (b.faces > 0 && b.a0 > 402) fill(402, b.a0, b.z0, b.z1, C.YARD, YARD); if (b.faces < 0 && b.a1 < 462) fill(b.a1, 462, b.z0, b.z1, C.YARD, YARD); }
  for (const q of [squares.hinge.paved, squares.entry && squares.entry.paved]) if (q) fill(q.a0, q.a1, q.z0, q.z1, C.SLAB, SLABS);
  fill(0, 6, PLAN.Z_NEAR, ZT, C.SLAB, SLABS);                                             // the promenade's own slabs run up the first 6 m
  // THE GUTTERS (where alone water lies): the kerb's metre before the arcaded row's fronts, and before the fronts of both places
  for (const b of blocks) if (b.zone === 'promenade') fill(5, 6, b.z0, b.z1, C.SLAB, tint(SLABS, 0.86), false, S.GUTTER);
  for (const q of [squares.hinge.paved, squares.entry && squares.entry.paved]) if (q) fill(37, 38, q.z0, q.z1, C.SLAB, tint(SLABS, 0.86), false, S.GUTTER);
  // THE RIM: the rim street's setts (plain: no middle course) and the parapet's stone, along the whole full-width edge
  fill(RIM.a0, RIM.a1, PLAN.Z_FULL0, ZF1, C.LONG, tint(SETTS, 1.06), true);
  fill(RIM.wall.a0, RIM.wall.a1, PLAN.Z_FULL0, ZF1, C.SLAB, tint(SLABS, 1.12));

  await pause();
  // ---- THE FLAT TOWN (the same town underfoot), from the promenade's right-hand row to x -170: f = 56 - x. ITS OWN DEALT WALK:
  // its first wide street 45 to 75 m past the town's first z, the next 135 to 170 m on, none within 20 m of a wide street of
  // the roll (it steps 8 m on, so 210 m at the most); minor streets 45 to 62 m apart; its five long streets jog as the roll's do (the first, behind
  // the arcaded row, never jogs); its last block ends at PLAN.TOWN_Z1; beyond lie its own outskirts to the land's end
  const FZ1 = DZ1, F1 = 226, FZE = ZT + 12, fx = (f) => 56 - f;
  const Rfw = stream('flat-wide'), fWides = [];
  for (let z = Z0 + Rfw.int(105, 135); ;) { while (wides.some((w) => Math.abs(w - z) < 20)) z += 8; if (z > FZ1 - 70) break; fWides.push(z); z += Rfw.int(135, 170); }
  const FR = fWides.length + 1, fReach = (r) => [r === 0 ? Z0 : fWides[r - 1], r === FR - 1 ? FZ1 : fWides[r]];
  // an open end's reach (the town's first and last): minor streets walk off from its wide street 45 to 62 m apart, the last so
  // dealt that the end block is 20 to 54 m long; under 69 m no street is cut
  const openGaps = (Rm, G) => { const out = []; let rem = G; for (;;) { if (rem < 69) break; if (rem <= 120) { out.push(Rm.int(Math.max(45, rem - 58), Math.min(62, rem - 24))); break; } const g = Rm.int(45, 62); out.push(g); rem -= g; } return out; };
  const Rfm = stream('flat-minor'), fCross = [], fCells = [];
  for (const w of fWides) fCross.push({ z0: w - 6, z1: w + 6, wide: true });
  for (let r = 0; r < FR; r++) {
    const [zA, zB] = fReach(r), open = r === 0 || r === FR - 1, ms = [];
    if (!open) { const g = minorGaps(Rfm, zB - zA); let z = zA; for (let i = 0; i + 1 < g.length; i++) { z += g[i]; ms.push(z); } }
    else if (r === 0) { let z = zB; for (const g of openGaps(Rfm, zB - zA)) { z -= g; ms.unshift(z); } }
    else { let z = zA; for (const g of openGaps(Rfm, zB - zA)) { z += g; ms.push(z); } }
    let c0 = r === 0 ? Z0 : zA + 6;
    for (const z of ms) { fCross.push({ z0: z - 4, z1: z + 4, wide: false }); fCells.push({ z0: c0, z1: z - 4, r }); c0 = z + 4; }
    fCells.push({ z0: c0, z1: r === FR - 1 ? FZ1 : zB - 6, r });
  }
  const Rfo = stream('flat-jogs'), phX = Rfo.int(0, 1), fOff = [0, 1, 2, 3, 4].map((i) => { const out = []; for (let r = 0; r < FR; r++) { const m = Rfo.int(3, 5); out.push(i === 0 ? 0 : ((r + phX) % 2 ? -1 : 1) * m); } return out; });
  const fLongs = [];
  for (let i = 0; i < 5; i++) for (let r = 0; r < FR; r++) { const [zA, zB] = fReach(r); fLongs.push({ f0: 38 * i + 30 + fOff[i][r], f1: 38 * i + 38 + fOff[i][r], z0: Math.max(Z0, zA), z1: Math.min(FZ1, zB) }); }
  const fBlocks = [], fFills = [], fLamps = [];
  const ffill = (f0, f1, z0, z1, cls, rgb, plain = false, sub) => fFills.push({ f0, f1, z0, z1, cls, rgb, plain, sub });
  const EF = (c0, c1, l0, l1, cls, rgb, sub) => ffill(c0, c1, l0, l1, cls, rgb, false, sub);
  ffill(0, F1, -90, FZE, C.GARDEN, tint(GRASS, 0.85), false, S.GRASS);                     // open country at both ends
  const fFields = fieldsOf(stream('flat-fields'), 0, F1, FZ1, FZE, EF, flatLater);
  ffill(LONG_FOOT[0] - 2, LONG_FOOT[0] + 2, FZ1, ZF1, C.GARDEN, GRAVEL, false, S.PATH);   // its first long street runs on as a gravel lane
  ffill(0, F1, Z0, FZ1, C.LONG, SETTS, true);
  for (const l of fLongs) ffill(l.f0, l.f1, l.z0, l.z1, C.LONG, SETTS);
  for (const s of fCross) ffill(0, F1, s.z0, s.z1, C.CROSS, s.wide ? tint(SETTS, 1.08) : SETTS);
  for (const cl of fCells) if (cl.z1 - cl.z0 >= 20) for (let i = 0; i < 6; i++) {
    const f0 = i === 0 ? 0 : 38 * i + fOff[i - 1][cl.r], f1 = i === 5 ? 220 : 38 * i + 30 + fOff[i][cl.r];
    fBlocks.push({ x0: fx(f1), x1: fx(f0), z0: cl.z0, z1: cl.z1, f0, f1, rows: 'z', yard: f1 - f0 - 22, zone: i === 0 ? 'promenade' : 'flat' });
    ffill(f0, f1, cl.z0, cl.z1, C.YARD, tint(YARD, Rt.range(0.92, 1.08)));
    if (f1 - f0 - 22 >= 6) flatLater.push(() => lay(EF, ['flags', 'lawn', 'beds'], f0 + 11, f1 - 11, cl.z0 + 1, cl.z1 - 1, C.YARD, S.DRAIN_Z));   // its yards are the same places
  }
  ffill(220, F1, Z0, FZ1, C.GARDEN, GARDEN);                                               // back gardens along x -170
  const fBuilt = (f, z) => fBlocks.some((b) => f >= b.f0 && f <= b.f1 && z >= b.z0 && z <= b.z1);
  const fput = (f, z, h, kind) => fLamps.push({ x: fx(f), y: PLAN.Y0 + h, z, kind });
  for (let z = lattice.z0 - 4 * lattice.step; z <= FZ1; z += lattice.step) if (fBuilt(1, z)) fLamps.push({ x: lattice.xR, y: lattice.y, z, kind: 'bracket' });
  await pause();
  // (400 lamps at most in the flat town, section 5: a lamp every 50 m on its long streets, 58 m on its minor ones, every 40 m on both sides of the wide ones)
  fLongs.forEach((l, li) => {
    for (let k = 0, z = l.z0 + 8 + (li % 2) * 15; z < l.z1; k++, z += 50) {
      let zz = z; const s = fCross.find((q) => z > q.z0 - 0.7 && z < q.z1 + 0.7); if (s) zz = z - s.z0 < s.z1 - z ? s.z0 - 0.8 : s.z1 + 0.8;
      const near = (k + li) % 2 === 0;
      if (fBuilt(near ? l.f0 - 0.6 : l.f1 + 0.6, zz)) fput(near ? l.f0 + 0.6 : l.f1 - 0.6, zz, 4.5, 'street');
    }
  });
  fCross.forEach((s, si) => {
    const step = s.wide ? 40 : 58, zc = (s.z0 + s.z1) / 2;
    for (let k = 0, f = s.wide ? 12 : 15; f < 220; k++, f += step) {
      let ff = f; const l = fLongs.find((q) => zc >= q.z0 - 6 && zc <= q.z1 + 6 && f > q.f0 - 0.7 && f < q.f1 + 0.7); if (l) ff = f - l.f0 < l.f1 - f ? l.f0 - 0.8 : l.f1 + 0.8;
      for (const side of s.wide ? [0, 1] : [(k + si) % 2]) {
        const wallZ = side === 0 ? s.z0 - 0.6 : s.z1 + 0.6;
        if (fBuilt(ff, wallZ)) fput(ff, side === 0 ? s.z0 + 0.6 : s.z1 - 0.6, s.wide ? 5 : 4.5, s.wide ? 'wide' : 'street');
      }
    }
  });
  fput(LONG_FOOT[0] + 2.6, FZ1 + stream('flat-farm-lamp').range(30, 120), 3.2, 'gate');     // the flat outskirts' one farm lamp, on its lane
  await pause();
  // the promenade's trees, never an avenue: clumps of three to five, 7 m apart, each set 0 to 2.5 m toward the right-hand
  // fronts off the line x 66 (z 20 to 540) or x 61 (on to 880: no crown before the ring), 25 to 45 m of open paving between
  // clumps, and none within 16 m of tower A
  const towerA = { x: 62.25, z: 330, w: 7.5, d: 7.5, h: 62 };
  const Rc = stream('clumps'), trees = [];
  for (let z = 20; z <= 880;) {
    const n = Rc.int(3, 5);
    for (let j = 0; j < n; j++) {
      const tz = z + 7 * j, off = Rc.range(0, 2.5), kind = Rc() < 0.5 ? 'lime' : 'plane', h = Rc.range(12, 18);
      if (tz <= 880 && Math.abs(tz - towerA.z) >= 16) trees.push({ x: (tz < 540 ? 66 : 61) - off, z: tz, kind, h, where: 'promenade' });
    }
    z += 7 * (n - 1) + Rc.range(25, 45);
  }
  const Rp = stream('poplars');                               // along x -170 beside the town: poplars and cypresses in a loose row
  for (let z = Z0 + 6; z < FZ1 - 4; z += Rp.range(9, 16)) trees.push({ x: -167.5 + Rp.range(-1.5, 1.5), z, kind: Rp() < 0.7 ? 'poplar' : 'cypress', h: Rp.range(12, 16), where: 'outskirts' });
  for (const f of fFields) { f.f0 = f.u0; f.f1 = f.u1; for (const t of f.trees) trees.push({ x: fx(t.u), z: t.z, kind: t.kind, h: t.h, where: 'outskirts' }); }   // the flat orchards' trees stand in the list the town plants

  // THE LAMPS HANDED ON: each 2 m and more inside the land's edge at its own z (the taper's by its pool's radius, 1.6 lamp heights)
  for (let i = lamps.length - 1; i >= 0; i--) { const l = lamps[i]; if (!onLand(l.a, l.z, l.z > ZF1 ? 1.6 * l.h : 0.3)) lamps.splice(i, 1); }
  return {
    longs, cross, blocks, squares, sites, wides, parks,
    outskirts: { z0: TZ1, z1: ZT, fields: handed, trees: outTrees, lanes: [LONG_FOOT[0]], lane: { a0: LONG_FOOT[0] - 2, a1: LONG_FOOT[0] + 2, z0: TZ1, z1: laneZ1 }, farms }, onLand,
    thin: { z0: DZ1, z1: TZ1 }, kerbOpen: { a0: 6, a1: 30, z0: KZ0, z1: HZ0, wall: { a0: 29, a1: 30, h: 1.1 }, beds: kerbBeds, trees: kerbTrees },
    brink: { cutA, edgeA, slots, steps: [], lane: { a0: LANE_A0, a1: LANE_A1 }, rim: { ...RIM, z0: PLAN.Z_FULL0, z1: ZF1 } },
    lamps, strings, fills,
    places: () => { if (later) { Rl = stream('places'); for (const f of later) f(); later = null; } },
    flat: { x0: 56, x1: 90, blocks: fBlocks, fills: fFills, places: () => { if (flatLater) { Rl = stream('flat-places'); for (const f of flatLater) f(); flatLater = null; } }, lamps: fLamps, lattice, trees, towerA, f1: F1, z0: -90, z1: FZE,
      cross: fCross, longs: fLongs, wides: fWides, outskirts: { z0: FZ1, z1: FZE, fields: fFields } },
  };
}
