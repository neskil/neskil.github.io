// TOWN ROUND ONE STAIR (television worlds crew). Inspired by the series Silo (2023; from the novels of Hugh Howey),
// by its IDEA only: a whole town
// lives inside one deep round shaft buried in the ground, its homes, farms and workshops stacked floor on floor round
// one great stair, and the land above is grey and holds many more such shafts. Every form here is our own count and
// plan (the four sections, the six-sided stair tower with one straight flight to a side and a landing jutting at every
// corner, the helix of truss bridges, the home streets with their free-standing houses, the falls onto wheels, the raked vanes and open bays, the slanted grid of
// lids, the route). No figure, nothing lettered or numbered, nothing of any production.
// BROUGHT IN: nothing. All code in this file is written anew for this world.
//
// DECLARED. SCALE about twice life (a door 4 m, a house front 7.5 m wide). DUSK IS FIXED: ctx.vary.hour is read and
// ignored; the plan, the storeys, their order and heights and the route are the same on every seed.
// THE PLACE'S OWN GRID OF LIDS: rows run east and west, 220 m apart; along a row the lids stand 220 m apart; each row
// stands 54 m west of the row south of it. THE LAST LIGHT lies in the west, along the rows, over the long flank the
// land rises in. The line leaves our lid northward by a bay (one of sixteen alike), swings left
// once and runs due west along the lane between our row and the next (z = -110), so two files of lids lead to its end.
// THE BRIDGES stand on the place's own helix of bridges (the part states it).
// OUTSIDE, THE LAND LIES UNDER A DYING SUN. THE SUN stands still, 5 degrees over the land's edge, a disc 3 degrees
// across, 8 degrees to one side of the lane's own bearing (the side the hill stands on, dealt). ONE LIGHT RULE holds
// for the whole land: a face turned to the sun is warm and bright, a face turned from it cool and dark, tops catch a
// little sky; and every body throws a long shadow away from the sun, laid on the ground by rule (the lids and our
// plinth, the light wells, the hill, the tree, the way out's seat, the ways across the lanes, the city's towers; a
// lid 26 m high throws 300 m). THE GROUND HAS RELIEF: wind ridges lie across the wind (1.5 m high near a lane's
// middle, 2.6 m beyond 75 m from it, none in a lane's middle bed, by a lid, a well, the seat or a way), with lit
// backs and shadowed lees; hardpan with hairline cracks between them; pale drifts piled against the windward side of
// every lid and of our plinth. Every pattern of the ground is drawn only where a pixel is fine enough to carry it.
// EVERY LID GLOWS FROM THE TOWN UNDER IT: a crown of glass that stands proud of its drum (violet where terraces lie
// under it, warm where homes do, by its own deal, breathing slowly), bays lit from within, two to five stacks or
// masts on every nearer lid, a real plume from each stack (it rises, leans with the wind and thins, lit orange on
// the sun's side), a red lamp blinking on some mast heads. The lids are of THREE KINDS, dealt by place so that no two
// neighbours are alike. RAISED SERVICE WAYS run lid to lid along the rows and across the lanes by the light wells,
// a low lamp at every slab, with porches at the lids, sheds and hatches. OUR OWN LID stands on a round concrete
// plinth 32 m over the plain. LIGHT WELLS (small glazed lids 28 m across over lesser shafts) stand in the middle of
// every lane: the line's last stretch passes over one, 6 m over its crown. ON THE SUN'S BEARING, 1.2 to 1.8 km
// beyond the way out, stand the broken towers of A DEAD CITY, twelve to twenty, black and unlit, the sun in a gap
// between them, shafts of dusty light fanning between their shadows. Between them and us, 230 to 260 m beyond the
// line's end and 32 m to the sun's side of the lane's middle, ONE LOW BARE HILL with ONE DEAD TREE on its crest,
// 10 to 12 m tall, black against the glow. Rounded stones lie half sunk in the lee of the nearer lids (none within
// 16 m of the line). The air moves: streamers of blown sand run over the ground and veils of dust drift on the wind
// (dealt 40 to 70 degrees off the row line, to either hand, from the east or the west), gold where the sun stands
// behind them; the plumes lean; the cloud deck drifts in two layers, its underside lit orange and rose near the sun
// and slate far from it, and its shadow crosses land and lids.
// THE SKY is a dome fixed in the world about the shaft's axis. Dust and rain are dealt by a margin in metres from
// our own lid's axis, the same on every side. No wreck, body or figure lies or stands anywhere on the land.
// AIR AND LIGHT read WHERE A THING STANDS (inside r 62, outside r 76, mixed across the vanes' depth): a state of place.
// THERE IS NO SHADOW PASS (no shadow light, no caster): what is drawn once is the renderer's whole count.
// THE WORLD SETS NEITHER portal.drawWithin NOR portal.drawIn and draws nothing in the ring at the line's end: only the
// engine draws the way out (under the ring's foot the place has its seat: a concrete sill and two lamps, 7 m under the line, a lamp-lined causeway and a low ring wall). camera.nearThrough is NOT set. THE LINE BEGINS in the engine gallery under its second crown lamp:
// BEHIND THE ENTRY the gallery runs 20 m north to its end wall, with its floor 9 m under the entry's axis (the track's
// rails 8.8 m under it), its crown 11 m over it (the crown's lamps hang 9.6 m over it) and nothing nearer than 14 m
// to either side (the exhaust stacks of the first pair of generator drums, which turn in their niches).
// PACINGS KEPT: none. Everything that moves goes on the world's clock from its own dealt phase; the one look's point
// and the pace are set by the lens's place on the route (height, bearing, metres of route), which begins, turns and
// ends nothing.
//
// THE SEED DEALS, each on a named stream of its own made from the world's seed (makeRng(hashSeed(name + ':' + seed)),
// none drawing from another), in this fixed order: the part's 'stair', 'shaft', 'hall', 'steam', 'water', 'works',
// 'homes', 'dye', 'stalls', 'farm', 'lid', 'drums', 'vanes', 'gallery', 'floor', 'lamps', 'glass', 'bays', 'wheels', 'lantern' and (in the
// hero) 'spray'; then 'sky' (the band's colour and width, the wind across the lane, the cloud), 'dust', 'rare', 'land', 'ridges', 'hill',
// 'lids', 'stones', 'wells', 'city', 'drifts', 'seat', 'ways', 'streamers'. ctx.vary.density sets washing, mist and dust; ctx.vary.rare
// brings rain on the grey land (streaming off the lids' eaves) and doubles the three falls inside.
// FRAME: metres; y above the shaft floor; axis x = 0, z = 0; +x east, +z south; bearings are compass degrees from the axis.
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';
import { GLSL_HASH, GLSL_VALUE_NOISE } from '../kit/fx.js';
import { K, D2R, TAU, COL, bx, bz, bearingOf, lipR, makeRoute, routeKnots, leaveAt, LEAVE_LEN, buildHero, dealTown, makeShared, makeWisps, cagedLamp, openWest, SUN, sunDir, FLANK_H, LID_R, LID_FORM, WAY_DIR, ridgeField, ridgeAmp, Acc, lin, mul, mix3, stream } from '../parts/town-round-one-stair.js';

const V3 = THREE.Vector3;
// the flight's time in seconds (the law is 47 to 49; a second is kept in hand)
const DURATION = 48.0;
// ---------------------------------------------------------------- the grey land
// OUTSIDE: OUR LID STANDS ON A ROUND PLINTH OF ITS OWN (an apron at y 164 out to r 80, a battered concrete wall falling
// 32 m to the plain at r 92); the plain lies at y 132. So every lid round ours stands lower than ours and its top is seen
// from our eave, and no slope of bare ground stands by the line. West of about x = -300 the land rises in ONE LONG
// FLANK, 70 m by x = -2400 (low enough that the sun stands clear over it), so that the rows of lids climb it toward
// the dead city. RELIEF: long swells (from 300 m out); WIND RIDGES across the wind, by one rule that the ground's own
// points and its light both keep (the part states it: 1.5 m high within 45 m of a lane's middle, 2.6 m beyond 75 m,
// none in the beds the ways and the line's approach lie in); and ONE LOW BARE HILL in our own lane beyond the line's
// end, with one dead tree on its crest. A FEW ROUNDED STONES lie half sunk in the lee of the nearer lids. A STANDING
// LANE: no ridge stands over 2 m high within 40 m of the flown line, no stone within 16 m.
function makeLand(seed, wind) {
  const g = stream('land', seed), o1 = g.range(0, 100), o2 = g.range(0, 100), flankPh = g.range(0, TAU);
  const gq = stream('ridges', seed), ph = [gq.range(0, TAU), gq.range(0, TAU), gq.range(0, TAU), gq.range(0, TAU)];
  const flank = (x, z) => { const t = clamp((-300 + 70 * Math.sin(z * 0.0009 + flankPh) - x) / 2100, 0, 1); return FLANK_H * t * t * (3 - 2 * t); };
  const wave = (x, z) => Math.sin(x * 0.011 + o1 + 1.7 * Math.sin(z * 0.006 + o2)) * Math.cos(z * 0.017 + o2 * 0.7);
  // LONG SWELLS 6 m high and some 500 m from crest to crest, growing from nothing at 300 m from our axis to their full
  // height at 700 m (so the lids nearest ours stand level on the plain)
  const swell = (x, z) => smoothstep(300, 700, Math.hypot(x, z)) * 6 * wave(x, z);
  // (plain: the land's own level, as if our plinth were not there; ground: with the plinth's foot)
  const plain = (x, z) => K.PLAIN + flank(x, z) + swell(x, z);
  const base = (x, z) => K.GROUND - K.HILL_FALL * clamp((Math.hypot(x, z) - K.PAD_R) / (K.FOOT_R - K.PAD_R), 0, 1) + flank(x, z);
  const ground = (x, z) => base(x, z) + swell(x, z);
  const bump = (q, x, z) => { const dx = (x - q.x) / q.hx, dz = (z - q.z) / q.hz; return Math.abs(dx) >= 1 || Math.abs(dz) >= 1 ? 0 : q.h * Math.cos(dx * Math.PI / 2) ** 2 * Math.cos(dz * Math.PI / 2) ** 2; };
  // THE ONE LOW BARE HILL: beyond the last lids of our lane, 230 to 260 m past the line's end and 32 m to one side of
  // the lane's middle (the side is dealt; the sun stands on that side too, so the tree is seen against its glow from
  // the lane); 12 to 14 m high, 88 m long and 36 m across; clear of every lid's rim by 30 m and more. ONE DEAD TREE stands
  // on its crest, 10 to 12 m tall. (The 'hill' stream deals place, side, height, the tree's lean, limbs and height.)
  const gh = stream('hill', seed), hill = { x: K.END[0] - gh.range(230, 260), z: K.LANE_Z + (gh.chance(0.5) ? 1 : -1) * 32, h: gh.range(12, 14), hx: 44, hz: 18, lean: gh.range(-0.12, 0.12), limbs: [] };
  for (let q = 0; q < 5; q++) hill.limbs.push({ at: gh.range(0.4, 0.92), b: gh.range(0, TAU), len: gh.range(1.4, 3.2), up: gh.range(0.2, 0.9) });
  hill.tall = gh.range(10, 12); hill.side = Math.sign(hill.z - K.LANE_Z);
  // THE GROUND NEAR THE LINE IS LAID FINE, on a square grid 4 m apart from 520 m west of our axis to 120 m east of it and
  // from 150 m north of the lane to 150 m south of it: there the wind ridges stand in the ground's own points (they
  // fade to nothing over the grid's outer 30 m; farther off the ridges are seen by their light alone)
  const FINE = { x0: -520, x1: 120, z0: K.LANE_Z - 150, z1: K.LANE_Z + 150, cell: 4, edge: 30 };
  const fineK = (x, z) => clamp(Math.min(x - FINE.x0, FINE.x1 - x, z - FINE.z0, FINE.z1 - z) / FINE.edge, 0, 1);
  const relief = (x, z) => { const f = fineK(x, z); if (f <= 0) return 0; const a = ridgeAmp(x, z, hill); return a > 0.005 ? f * a * ridgeField(x, z, wind, ph) : 0; };
  const height = (x, z) => ground(x, z) + relief(x, z) + bump(hill, x, z);
  return { height, ground, base, plain, relief, bump, hill, FINE, fineK, ph, phases: [o1, o2, flankPh] };
}
// the least plan distance from a point to the flown line outside (the leaving curve), by metres along it
function offLine(x, z, line) { let best = 1e9; for (const p of line) best = Math.min(best, Math.hypot(p[0] - x, p[1] - z)); return best; }
// a smooth patch of ground laid over the land (the hill): its own grid of points with the slope's own normals,
// its rim sunk half a metre under the ground it rises from
function patch(A, land, q, nx, nz, col, aux) {
  const idx = [], H = (x, z) => land.plain(x, z) + land.bump(q, x, z);
  for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) { const x = q.x + (i / nx * 2 - 1) * q.hx, z = q.z + (j / nz * 2 - 1) * q.hz, rim = i === 0 || j === 0 || i === nx || j === nz;
    const e = 0.5, sx = (H(x + e, z) - H(x - e, z)) / (2 * e), sz = (H(x, z + e) - H(x, z - e)) / (2 * e), l = Math.hypot(sx, 1, sz);
    idx.push(A.vert(x, H(x, z) + (rim ? -0.5 : 0.15), z, -sx / l, 1 / l, -sz / l, col, aux)); }
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const a = idx[j * (nx + 1) + i], b = a + 1, c = a + nx + 1, d = c + 1; A.i.push(a, c, b, b, c, d); }
}
// (part 0: the far ground; part 1: our own lid's plinth; parts 2 and 4: the fine ground near the line, in two halves; part 3: the hill, its tree, the stones)
function buildLand(A, land, line, lids, part, wind, stones) {
  const col = lin('#6f7480'), dark = lin('#4c505c'), GRAVEL = [0, 4, 0, 0];
  if (part === 0) {
    const rings = [K.FOOT_R]; let r = K.FOOT_R, step = 5;
    while (r < 4200) { r += step; step *= 1.11; rings.push(r); }
    const N = 96, ring = (i) => { const out = []; for (let k = 0; k <= N; k++) { const b = (k % N) * 360 / N, x = bx(b, rings[i]), z = bz(b, rings[i]); out.push([x, land.ground(x, z) - (i === 0 ? 0.4 : 0), z]); } return out; };
    let p0 = ring(0); for (let i = 0; i < rings.length - 1; i++) { const p1 = ring(i + 1);
      // (where the fine grid lies, the coarse rings are left out: a ring's piece is laid only if a corner of it stands
      // within 30 m of the grid's edge or outside it)
      for (let k = 0; k < N; k++) { const a = p0[k], q4 = [a, p0[k + 1], p1[k + 1], p1[k]]; if (q4.every((v) => land.fineK(v[0], v[2]) >= 1)) continue;
        A.quad(a, p0[k + 1], p1[k + 1], p1[k], col, GRAVEL); }
      p0 = p1; }
    return; }
  if (part === 1) {
    // OUR OWN LID'S PLINTH: a concrete apron round the eave behind a low parapet; a battered wall that falls 32 m to
    // the plain, with a string course half way down and thirty-two buttresses standing 1.5 m proud of it
    const c = COL.conc, c2 = mix3(COL.conc, COL.stain, 0.45), y1 = K.GROUND, y0 = K.PLAIN - 0.6, Q = (b, r, y) => [bx(b, r), y, bz(b, r)];
    A.sector(0, 360, K.EAVE_R - 1, K.PAD_R, y1 - 1, y1, c, [0, 0, 0, 0], 96, 't');
    A.sector(0, 360, K.PAD_R - 0.6, K.PAD_R, y1, y1 + 0.9, c2, [0, 0, 0, 0], 96, 'tio');
    for (let k = 0; k < 96; k++) { const a = k * 3.75, b = a + 3.75; A.quad(Q(a, K.FOOT_R, y0), Q(a, K.PAD_R, y1), Q(b, K.PAD_R, y1), Q(b, K.FOOT_R, y0), c); }
    { const rm = (K.PAD_R + K.FOOT_R) / 2, ym = (y0 + y1) / 2; A.sector(0, 360, rm - 0.2, rm + 1, ym - 0.5, ym + 0.5, c2, [0, 0, 0, 0], 96, 'tuo'); }
    for (let k = 0; k < 32; k++) { const b = k * 11.25 + 5.6, w = 1.2 / 86 / D2R;
      A.quad(Q(b - w, K.FOOT_R + 1.5, y0), Q(b - w, K.PAD_R + 1.5, y1 + 0.9), Q(b + w, K.PAD_R + 1.5, y1 + 0.9), Q(b + w, K.FOOT_R + 1.5, y0), c2);
      A.quad(Q(b - w, K.FOOT_R, y0), Q(b - w, K.PAD_R, y1 + 0.9), Q(b - w, K.PAD_R + 1.5, y1 + 0.9), Q(b - w, K.FOOT_R + 1.5, y0), c);
      A.quad(Q(b + w, K.FOOT_R + 1.5, y0), Q(b + w, K.PAD_R + 1.5, y1 + 0.9), Q(b + w, K.PAD_R, y1 + 0.9), Q(b + w, K.FOOT_R, y0), c);
      A.quad(Q(b - w, K.PAD_R, y1 + 0.9), Q(b + w, K.PAD_R, y1 + 0.9), Q(b + w, K.PAD_R + 1.5, y1 + 0.9), Q(b - w, K.PAD_R + 1.5, y1 + 0.9), c2); }
    return; }
  if (part === 2 || part === 4) {
    // THE FINE GROUND (in two halves, so that neither is long in the making): its points stand on the wind ridges; its
    // rim is sunk half a metre under the coarse ground round it; nothing of it is laid under our plinth or under a lid
    const F = land.FINE, nx = Math.round((F.x1 - F.x0) / F.cell), nz = Math.round((F.z1 - F.z0) / F.cell), j0 = part === 2 ? 0 : nz >> 1, j1 = part === 2 ? nz >> 1 : nz, row = [];
    const under = (x, z) => Math.hypot(x, z) < K.FOOT_R - 6 || lids.some((l) => Math.abs(l.x - x) < 72 && Math.hypot(l.x - x, l.z - z) < LID_R - 6);
    for (let j = j0; j <= j1; j++) { const r = []; for (let i = 0; i <= nx; i++) { const x = F.x0 + i * F.cell, z = F.z0 + j * F.cell, rim = i === 0 || j === 0 || i === nx || j === nz;
      r.push(under(x, z) ? -1 : A.vert(x, land.plain(x, z) + land.relief(x, z) + (rim ? -0.5 : 0.15), z, 0, 1, 0, col, GRAVEL)); } row.push(r); }
    for (let j = 0; j < row.length - 1; j++) for (let i = 0; i < nx; i++) { const a = row[j][i], b = row[j][i + 1], c = row[j + 1][i], d = row[j + 1][i + 1]; if (a < 0 || b < 0 || c < 0 || d < 0) continue; A.i.push(a, c, b, b, c, d); }
    return; }
  // THE HILL and THE ONE DEAD TREE on its crest: a bare black trunk that leans a little, and a few broken limbs
  { const h = land.hill, bark = lin('#0d0d10'), STEEL = [0, 1, 0, 0]; patch(A, land, h, 14, 8, col, GRAVEL);
    const y0 = land.height(h.x, h.z) - 0.15, T = (t) => [h.x + h.lean * h.tall * t * t, y0 + h.tall * t, h.z + 0.4 * h.lean * h.tall * t];
    for (let q = 0; q < 4; q++) { const a = T(q / 4), b = T((q + 1) / 4), r0 = 0.66 * (1 - q / 4.6); A.beam(a, b, r0, r0, bark, STEEL); }
    // (its limbs reach mostly north and south, across the line's bearing, so that the tree is seen broadside from the line)
    for (const l of h.limbs) { const a = T(l.at), len = l.len * 1.6, cx = Math.cos(l.b) * 0.45, cz = Math.sin(l.b) >= 0 ? 1 : -1, e = [a[0] + cx * len, Math.min(a[1] + len * l.up, y0 + h.tall), a[2] + cz * len]; A.beam(a, e, 0.24, 0.24, bark, STEEL);
      A.beam(e, [e[0] + cx * len * 0.3, Math.min(e[1] + len * 0.4, y0 + h.tall), e[2] + cz * len * 0.35], 0.12, 0.12, bark, STEEL); } }
  // ROUNDED STONES, half sunk, few: two to four in the lee of each of the nearer lids (the 'stones' stream)
  for (const s of stones) { const y = land.height(s.x, s.z), top = mul(col, 0.8 * s.tone);
    A.cyl(s.x, y - 0.4, s.z, s.r, y + s.r * 0.24, s.r * 0.86, 7, top, GRAVEL, ''); A.cyl(s.x, y + s.r * 0.24, s.z, s.r * 0.86, y + s.r * 0.46, s.r * 0.5, 7, top, GRAVEL, ''); A.cyl(s.x, y + s.r * 0.46, s.z, s.r * 0.5, y + s.r * 0.54, 0.02, 7, top, GRAVEL, ''); }
}
// ---------------------------------------------------------------- the lids of the other shafts
// THE PLACE'S OWN GRID: rows run east and west, 220 m apart; along a row the lids stand 220 m apart; each row stands 54 m
// west of the row south of it. Ours is at the origin. EVERY LID GLOWS FROM THE TOWN UNDER IT: a ring of roof lights
// (upright panes of glass standing on its shell, violet over the arc where its terraces' lamps lie and warm over the
// rest, breathing slowly on the lid's own phase), bays lit from within (a low glow at the back of each bay behind a
// grille, a shutter over it), and on the nearer lids two to five vent stacks or masts (steam from the stacks, a red
// lamp on some mast heads). THREE KINDS OF LID, so that no two neighbours are alike (a lid's kind goes by its place in
// the grid, i + n counted in threes; the deal says which of the two other kinds stands next to ours on each hand):
// kind 0 as ours (eave 26 m, a round shell, sixteen raked vanes, its glass 46 m from its middle); kind 1 low and broad
// (eave 15 m, twenty-four stout piers, its glass 40 m from its middle); kind 2 tall-crowned (eave 24 m, a steep shell
// to a glazed lantern 14 m in radius and a mast, twelve fins). Each lid's height, ribs, stain and turn by the 'lids'
// stream. Detail in three sizes by distance from our own shaft in metres; no lid stands beyond 2,100 m (the dead city
// stands beyond the last of them).
const LID_FAR = 2100;
// THE GLASS CROWNS STAND PROUD OF THE DRUMS: on kinds 0 and 1 the glass is a clerestory ring just inside the eave
// (10 and 6 m in from it, 6 and 4.5 m tall) under a low dome; on kind 2 it is a lantern 10 m tall at the head of the
// steep shell. So from the lane's height (11 to 38 m over the plain) the near side's glass is seen over the lid's own
// eave from 110 m off and at every distance beyond (the world's tool proves it by the forms' own lines).
const LID_KIND = [
  { e0: 18, e1: 26, prof: [[76, 26], [66, 28.2]], glass: [66, 28.2, 34.2], top: [[66.8, 34.6], [40, 37.4], [0.01, 38.4]], bays: 16, rake: true },
  { e0: 9, e1: 15, prof: [[76, 15], [70, 16.1]], glass: [70, 16.1, 20.6], top: [[70.8, 21], [36, 23.4], [0.01, 24.2]], bays: 24, rake: false },
  { e0: 17, e1: 24, prof: [[76, 24], [58, 31], [38, 37], [16, 42.2]], glass: [16, 42.2, 52.2], top: [[16.9, 52.8], [0.01, 57]], bays: 12, rake: false },
];
// the height of a lid's shell over its own ground at r metres from its middle (below its glass)
const shellAt = (kd, r) => { const p = r >= kd.glass[0] ? kd.prof : kd.top; for (let j = 0; j < p.length - 1; j++) if (r <= p[j][0] && r >= p[j + 1][0]) return lerp(p[j][1], p[j + 1][1], (p[j][0] - r) / (p[j][0] - p[j + 1][0])); return p[p.length - 1][1]; };
function lidPlaces(seed, land) {
  const g = stream('lids', seed), out = [], swap = g.chance(0.5); out.swap = swap;
  for (let n = -5; n <= 6; n++) for (let i = -16; i <= 5; i++) {
    const x = K.ROW * i - K.SHIFT * n, z = -K.ROW * n, d = Math.hypot(x, z);
    // (every lid's draws are taken whether it is built or not, so no lid's deal moves another's)
    const o = { x, z, d, i, n, hk: g.range(0.9, 1.03), ribs: g.int(0, 2), stain: g.range(0, 1), turn: g.range(0, 22.5), violet: g.range(0.15, 0.85), glassTurn: g.range(0, 360), ph: g.range(0.05, 1), bayViolet: g.chance(0.35), vents: [] };
    const nv = g.int(2, 5);
    for (let q = 0; q < 5; q++) { const v = { b: g.range(0, 360), r: g.range(52, 66), h: g.range(6, 12), mast: g.chance(0.4), lamp: g.chance(0.6), ph: g.range(0.05, 1), steam: g.range(0, 1), life: g.range(5, 8) }; if (q < nv) o.vents.push(v); }
    if ((n === 0 && i === 0) || d > LID_FAR || x > 1000 || openWest(x, z)) continue;
    // THE HILL STANDS CLEAR OF EVERY LID: by the hill's own place its foot is 30 m and more from the nearest lid's rim;
    // and by rule no lid is built whose rim would stand within 12 m of the hill's foot
    { const h = land.hill; if (Math.hypot(Math.max(Math.abs(x - h.x) - h.hx, 0), Math.max(Math.abs(z - h.z) - h.hz, 0)) < LID_R + 12) continue; }
    const m = (((i + n) % 3) + 3) % 3; o.kind = m === 0 ? 0 : (m === 1) === swap ? 2 : 1;
    o.y = land.height(x, z) - 1.5;
    out.push(o);
  }
  return out;
}
const WARM = [1.0, 0.72, 0.40], VIO = [0.56, 0.22, 1.0];
function buildLids(A, lids, detail, from = 0, to = 1e9) {
  // (COVER: plain concrete that stands under the eave, behind the bays, where the band never shines)
  const KERB = [0, 6, 0, 0], COVER = [0, 0, 1, 0], STEEL = [0, 1, 0, 0], R = K.TANGENT_R, s0 = Math.sqrt(K.VANE_R0 ** 2 - R * R), s1 = Math.sqrt(K.VANE_R1 ** 2 - R * R), iron = lin('#2a2c32');
  for (let li = from; li < Math.min(to, lids.length); li++) {
    const L = lids[li], kd = LID_KIND[L.kind], hk = L.hk;
    const lv = L.d < 560 ? 0 : L.d < 1100 * detail ? 1 : 2, N = lv === 0 ? 32 : lv === 1 ? 24 : 12;
    const col = mix3(lin('#8a8f9a'), lin('#6c7078'), L.stain), y0 = L.y, eave0 = y0 + kd.e0 * hk, eave1 = y0 + kd.e1 * hk;
    const P = (b, r, y) => [L.x + bx(b, r), y, L.z + bz(b, r)], Y = (h) => y0 + h * hk;
    const prof = (lv === 2 ? [kd.prof[0], kd.prof[kd.prof.length - 1]] : kd.prof).map(([r, h]) => [r, Y(h)]), top = (lv === 2 ? [kd.top[0], kd.top[kd.top.length - 1]] : kd.top).map(([r, h]) => [r, Y(h)]);
    const [gr, ga, gb0] = kd.glass, gya = Y(ga), gyb = gya + (Y(gb0) - gya) * (lv === 2 ? 1.6 : 1), gg = lv === 2 ? 2.4 : lv === 1 ? 1.7 : 1.25, bayCol = mul(L.bayViolet ? VIO : WARM, 0.55);
    for (let k = 0; k < N; k++) {
      const a = L.turn + k * 360 / N, b = a + 360 / N, wet = 0.88 + 0.12 * (((k * 7 + li * 3) % 5) / 4);
      // the eave band (weather has run down it in darker and paler widths), the shell below the glass, the cap over it, the plinth
      A.quad(P(a, 76, eave0), P(a, 76, eave1), P(b, 76, eave1), P(b, 76, eave0), mul(col, wet));
      for (let j = 0; j < prof.length - 1; j++) A.quad(P(a, prof[j][0], prof[j][1]), P(a, prof[j + 1][0], prof[j + 1][1]), P(b, prof[j + 1][0], prof[j + 1][1]), P(b, prof[j][0], prof[j][1]), mul(col, 0.96 + 0.04 * (j % 2)));
      for (let j = 0; j < top.length - 1; j++) A.quad(P(a, top[j][0], top[j][1] + (gyb - Y(gb0))), P(a, top[j + 1][0], top[j + 1][1] + (gyb - Y(gb0))), P(b, top[j + 1][0], top[j + 1][1] + (gyb - Y(gb0))), P(b, top[j][0], top[j][1] + (gyb - Y(gb0))), mul(col, 0.92));
      A.quad(P(a, 77, y0 - 8), P(a, 77, y0 + 2), P(b, 77, y0 + 2), P(b, 77, y0 - 8), mul(col, 0.9));
      // the plinth's top (the floor of the bays), the dark drum behind the bays, and the eave's soffit over them
      A.quad(P(a, 61.5, y0 + 2), P(b, 61.5, y0 + 2), P(b, 77, y0 + 2), P(a, 77, y0 + 2), mul(col, 0.62), COVER);
      A.quad(P(a, 62, y0 + 2), P(a, 62, eave0), P(b, 62, eave0), P(b, 62, y0 + 2), mul(col, 0.3), COVER);
      if (lv < 2) A.quad(P(a, 62, eave0), P(a, 76, eave0), P(b, 76, eave0), P(b, 62, eave0), mul(col, 0.6), COVER);
      // the kerb along the eave: a thin strip leaning up and outward, which the band lights on its own side
      const kh = lv === 0 ? 0.7 : lv === 1 ? 1.0 : 1.6;
      A.quad(P(a, 76.5, eave1 - 0.2), P(a, 75.9, eave1 + kh), P(b, 75.9, eave1 + kh), P(b, 76.5, eave1 - 0.2), mul(col, 1.15), KERB);
      // THE ROOF LIGHTS: upright glass standing on the shell; near, each pane between dark posts with a bar across it
      const off = Math.abs((((a + b) / 2 - L.glassTurn + 540) % 360) - 180), gc = off < 180 * L.violet ? VIO : WARM, pa = lv === 0 ? a + 1.1 : a, pb = lv === 0 ? b - 1.1 : b;
      // (near, no two panes burn alike: each by its own place in the ring; the glow is steadier far off)
      A.quad(P(pa, gr, gya), P(pa, gr, gyb), P(pb, gr, gyb), P(pb, gr, gya), gc, [gg * (lv === 0 ? 0.62 + 0.38 * (((k * 5 + li * 3) % 7) / 6) : 1), 1, 0, L.ph]);
      if (lv === 0) { A.quad(P(pb, gr + 0.15, gya), P(pb, gr + 0.15, gyb), P(b + 1.1, gr + 0.15, gyb), P(b + 1.1, gr + 0.15, gya), iron, STEEL);
        const ym = (gya + gyb) / 2; A.quad(P(a, gr + 0.1, ym - 0.1), P(a, gr + 0.1, ym + 0.1), P(b, gr + 0.1, ym + 0.1), P(b, gr + 0.1, ym - 0.1), iron, STEEL);
        A.quad(P(a, gr, gyb), P(a, top[0][0], top[0][1]), P(b, top[0][0], top[0][1]), P(b, gr, gyb), mul(col, 0.7));
        // the glass's glow lies on the lid's own roof at its foot
        { const r1 = Math.min(gr + 4.5, 75.5), yr = Y(shellAt(kd, r1)) + 0.07; A.quad(P(a, r1, yr), P(a, gr + 0.25, gya + 0.07), P(b, gr + 0.25, gya + 0.07), P(b, r1, yr), gc, [0.3, 1, 0, L.ph]); } }
    }
    // THE BAYS, LIT FROM WITHIN: at the back of each bay a low glow (warm, or violet where the deal puts farm lamps
    // behind it), breathing on the lid's phase; near, a grille of four bars before it and a dark shutter over it
    const nb = kd.bays / (lv === 1 ? 2 : 1), H = eave0 - (y0 + 2), bayGlow = [0.85, 1, 0, (L.ph + 0.31) % 1 + 0.01];
    // (every lit or shuttered face of a bay is laid in pieces no wider than 8 degrees at 63.4 m and more from the lid's
    // middle, so that none of it dips behind the drum's own flat faces at 62 m)
    const arc = (b0, b1, r, ya, yb, c, aux) => { const m = Math.max(1, Math.ceil((b1 - b0) / 8)); for (let q = 0; q < m; q++) { const p0 = b0 + (b1 - b0) * q / m, p1 = b0 + (b1 - b0) * (q + 1) / m; A.quad(P(p0, r, ya), P(p0, r, yb), P(p1, r, yb), P(p1, r, ya), c, aux); } };
    if (lv === 2) for (let k = 0; k < N; k++) { const a = L.turn + k * 360 / N, b = a + 360 / N; arc(a + 4, b - 4, 63.4, y0 + 2.4, y0 + 2 + 0.5 * H, bayCol, bayGlow); }
    else for (let j = 0; j < nb; j++) { const bc = L.turn + (j + 0.5) * 360 / nb, hw = 360 / nb * 0.3;
      arc(bc - hw, bc + hw, 63.4, y0 + 2.4, y0 + 2 + 0.48 * H, bayCol, bayGlow);
      if (lv === 0) { arc(bc - hw * 1.5, bc + hw * 1.5, 64.2, y0 + 2 + 0.52 * H, eave0, mul(col, 0.34), COVER);
        for (let q = 0; q < 4; q++) { const gb = bc + hw * (-0.75 + 0.5 * q), gw = 0.16 / 64.9 / D2R; A.quad(P(gb - gw, 64.9, y0 + 2), P(gb - gw, 64.9, y0 + 2 + 0.52 * H), P(gb + gw, 64.9, y0 + 2 + 0.52 * H), P(gb + gw, 64.9, y0 + 2), iron, STEEL); } } }
    // what stands between the bays: raked vanes (as ours), stout piers, or fins
    if (lv < 2) for (let j = 0; j < nb; j++) { const ph = L.turn + j * 360 / nb, w = (kd.rake ? 0.8 : L.kind === 1 ? 1.3 : 0.9) * (lv === 0 ? 1 : 2);
      if (kd.rake) { const T = [bx(ph, R), bz(ph, R)], d = [-Math.cos(ph * D2R), -Math.sin(ph * D2R)], nn = [Math.sin(ph * D2R), -Math.cos(ph * D2R)];
        const E = (s, k, y) => [L.x + T[0] + d[0] * s + nn[0] * k, y, L.z + T[1] + d[1] * s + nn[1] * k];
        A.quad(E(s0, w, y0 + 2), E(s1, w, y0 + 2), E(s1, w, eave0), E(s0, w, eave0), col); A.quad(E(s1, -w, y0 + 2), E(s0, -w, y0 + 2), E(s0, -w, eave0), E(s1, -w, eave0), col);
        A.quad(E(s1, w, y0 + 2), E(s1, -w, y0 + 2), E(s1, -w, eave0), E(s1, w, eave0), mul(col, 0.92)); }
      else { const u = [Math.sin(ph * D2R), -Math.cos(ph * D2R)], t = [Math.cos(ph * D2R), Math.sin(ph * D2R)], E = (r, k, y) => [L.x + u[0] * r + t[0] * k, y, L.z + u[1] * r + t[1] * k];
        A.quad(E(62.5, w, y0 + 2), E(75.4, w, y0 + 2), E(75.4, w, eave0), E(62.5, w, eave0), col); A.quad(E(75.4, -w, y0 + 2), E(62.5, -w, y0 + 2), E(62.5, -w, eave0), E(75.4, -w, eave0), col);
        A.quad(E(75.4, w, y0 + 2), E(75.4, -w, y0 + 2), E(75.4, -w, eave0), E(75.4, w, eave0), mul(col, 0.92)); } }
    if (lv > 0) continue;
    // the shell's ribs (the 'lids' stream deals how many a lid shows): raised 0.5 m
    const nr = L.ribs === 0 ? 8 : 16, rc = mul(col, 0.8);
    for (let q = 0; q < nr; q++) { const rb = L.turn + (q + 0.5) * 360 / nr, w = 0.45 / 76 / D2R * 1.2;
      for (let j = 0; j < prof.length - 1; j++) { const [r0, ya] = prof[j], [r1, yb] = prof[j + 1], w0 = w * 76 / Math.max(r0, 8), w1 = w * 76 / Math.max(r1, 8);
        A.quad(P(rb - w0, r0, ya), P(rb - w1, r1, yb), P(rb, r1, yb + 0.5), P(rb, r0, ya + 0.5), rc); A.quad(P(rb, r0, ya + 0.5), P(rb, r1, yb + 0.5), P(rb + w1, r1, yb), P(rb + w0, r0, ya), mul(rc, 0.85)); }
      if (L.kind < 2) for (let j = 0; j < top.length - 1; j++) { const [r0, ya] = top[j], [r1, yb] = top[j + 1], w0 = w * 76 / Math.max(r0, 8), w1 = w * 76 / Math.max(r1, 8);
        A.quad(P(rb - w0, r0, ya), P(rb - w1, r1, yb), P(rb, r1, yb + 0.5), P(rb, r0, ya + 0.5), rc); A.quad(P(rb, r0, ya + 0.5), P(rb, r1, yb + 0.5), P(rb + w1, r1, yb), P(rb + w0, r0, ya), mul(rc, 0.85)); } }
    // VENTS: stacks (their steam is a medium, see the build) and thin masts, some with a red lamp at the head that
    // blinks slowly on its own dealt phase; kind 2 carries a mast on its lantern's cap as well
    for (const v of L.vents) { const p = P(v.b, v.r, Y(shellAt(kd, v.r)) - 0.3);
      if (v.mast) { A.beam(p, [p[0], p[1] + v.h + 7, p[2]], 0.14, 0.14, iron, STEEL); A.beam([p[0] - 1.1, p[1] + v.h + 4.6, p[2]], [p[0] + 1.1, p[1] + v.h + 4.6, p[2]], 0.06, 0.06, iron, STEEL);
        if (v.lamp) A.box(p[0], p[1] + v.h + 7.2, p[2], 0.22, 0.22, 0.22, 0, [1, 0.1, 0.06], [3.4, 1, 2, v.ph]); }
      else { A.cyl(p[0], p[1], p[2], 1.0, p[1] + v.h, 0.8, 6, mul(col, 0.7), [0, 0, 0, 0], ''); A.cyl(p[0], p[1] + v.h - 0.5, p[2], 1.0, p[1] + v.h, 1.0, 6, iron, STEEL, 't'); } }
    if (L.kind === 2) { const yt = top[top.length - 1][1]; A.beam([L.x, yt - 0.4, L.z], [L.x, yt + 8, L.z], 0.16, 0.16, iron, STEEL); A.box(L.x, yt + 8.2, L.z, 0.24, 0.24, 0.24, 0, [1, 0.1, 0.06], [3.4, 1, 2, L.ph]); }
  }
}
// a smooth sheet through a grid of points (rows of equal length), with the sheet's own normals at its points, facing up
function sheet(A, rows, col, aux) {
  const nj = rows.length, ni = rows[0].length, idx = [], at = (j, i) => rows[clamp(j, 0, nj - 1)][clamp(i, 0, ni - 1)];
  for (let j = 0; j < nj; j++) for (let i = 0; i < ni; i++) { const a = at(j, i + 1), b = at(j, i - 1), c = at(j + 1, i), d = at(j - 1, i), u = [a[0] - b[0], a[1] - b[1], a[2] - b[2]], v = [c[0] - d[0], c[1] - d[1], c[2] - d[2]];
    let n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]; const l = Math.hypot(n[0], n[1], n[2]) || 1, sg = n[1] < 0 ? -1 : 1; n = [n[0] / l * sg, n[1] / l * sg, n[2] / l * sg];
    const p = rows[j][i]; idx.push(A.vert(p[0], p[1], p[2], n[0], n[1], n[2], col, aux)); }
  for (let j = 0; j < nj - 1; j++) for (let i = 0; i < ni - 1; i++) { const a = idx[j * ni + i], b = a + 1, c = a + ni, d = c + 1, pa = rows[j][i], pb = rows[j][i + 1], pc = rows[j + 1][i];
    const up = (pc[2] - pa[2]) * (pb[0] - pa[0]) - (pc[0] - pa[0]) * (pb[2] - pa[2]) > 0; if (up) A.i.push(a, c, b, b, c, d); else A.i.push(a, b, c, b, d, c); }
}
// DRIFTS: the wind piles pale sand against the windward side of every lid (and of our own plinth): a ramp over 66
// degrees to either hand of the bearing the wind comes from, 3.4 m deep against the drum (it buries the feet of the
// piers there and the low part of the bays), 1.7 m at the plinth's edge, running out 16 to 26 m over the ground;
// its ends and its outer edge go under the ground. Each drift's run and its two lobes by the 'drifts' stream.
function buildDrifts(A, lids, land, wind, seed) {
  const g = stream('drifts', seed), bw = Math.atan2(-wind[0], wind[1]) / D2R, col = lin('#6f7480'), DRIFT = [0, 4, 1, 0];
  const one = (cx, cz, wall, ledge, deep, fine) => { const run = g.range(16, 26), p1 = g.range(0, TAU), p2 = g.range(0, TAU), rows = [], st = fine ? 6 : 12;
    // (it stands under 2 m high wherever it lies within 40 m of a lane's middle: 2.1 m at most 41 m from it, 1.7 m at the plinth's edge)
    const prof = [[wall - 14.8, deep], [wall - 8, deep * 0.62], [wall, deep * 0.5], [wall + run * 0.45, deep * 0.24], [wall + run, 0]];
    for (const [r, h] of (ledge === null ? prof.slice(2) : prof)) { const row = [];
      for (let o = -66; o <= 66.01; o += st) { const b = bw + o, x = cx + bx(b, r), z = cz + bz(b, r), k = Math.cos(o / 66 * Math.PI / 2) ** 0.8 * (0.78 + 0.22 * Math.sin(o * 0.09 + p1) * Math.sin(o * 0.031 + p2));
        row.push([x, (ledge !== null && r <= wall + 0.01 ? ledge : land.height(x, z)) + h * k - 0.35 * (1 - k) - (h === 0 ? 0.35 : 0), z]); }
      rows.push(row); }
    sheet(A, rows, col, DRIFT); };
  // (our own plinth: the sand lies against the battered wall's foot)
  one(0, 0, K.FOOT_R - 1.4, null, 3.4, true);
  // (every lid's three draws are taken whether its drift is built or not)
  for (const L of lids) { if (L.d < 1100) one(L.x, L.z, 77.2, L.y + 2, 3.4, L.d < 560); else { g.range(0, 1); g.range(0, 1); g.range(0, 1); } }
}
// where a lid's vent stacks end (the mouths their steam leaves by)
function ventMouths(lids) {
  const out = [];
  for (const L of lids) { if (L.d >= 560) continue; const kd = LID_KIND[L.kind];
    for (const v of L.vents) if (!v.mast) out.push({ p: [L.x + bx(v.b, v.r), L.y + shellAt(kd, v.r) * L.hk + v.h + 0.3, L.z + bz(v.b, v.r)], v }); }
  return out;
}

// ---------------------------------------------------------------- the light wells and the dead city
// LIGHT WELLS: in every lane, midway between a lid and the lid north-east of it in the next row (so on the lane's
// middle line, 220 m apart), a small glazed lid 28 m across stands over a lesser shaft: a low kerb, a frame of bars
// rising 5 m to a crown ring (the glass itself is not drawn: one looks down through the frame). Under the wells
// within 340 m of our own axis the shaft is built: a dark wall 30 m down, three lit ring lines in its top 11 m (violet and warm by the
// 'wells' stream), a row of twelve lamps, a dim glow at the bottom. A farther well shows its glow as a lit disc.
function wellPlaces(seed, land) {
  const g = stream('wells', seed), out = [], h = land.hill;
  for (let n = -4; n <= 4; n++) for (let i = -5; i <= 5; i++) {
    const x = K.ROW * i - K.SHIFT * n + (K.ROW - K.SHIFT) / 2, z = -K.ROW * n - K.ROW / 2, d = Math.hypot(x, z);
    const o = { x, z, d, violet: g.chance(0.5), ph: g.range(0.05, 1), lampPh: g.range(0.05, 0.9), turn: g.range(0, 30) };
    if (d > 700 || openWest(x, z) || (Math.abs(x - h.x) < h.hx + K.WELL_R + 4 && Math.abs(z - h.z) < h.hz + K.WELL_R + 4)) continue;
    o.y = land.ground(x, z); out.push(o);
  }
  return out;
}
function buildWells(A, wells) {
  const COVER = [0, 0, 1, 0], STEEL = [0, 1, 0, 0], col = lin('#7c818c'), iron = lin('#aab0bc'), R = K.WELL_R, Ri = R - 1.4, n = 12;
  for (const w of wells) { const P = (b, r, y) => [w.x + bx(b, r), y, w.z + bz(b, r)], y0 = w.y, yk = y0 + 1.6, yc = y0 + K.WELL_UP, near = w.d < K.WELL_NEAR, yf = y0 - (near ? 30 : 0.2);
    const c1 = w.violet ? VIO : WARM, c2 = w.violet ? WARM : VIO, hgt = (r) => yk + (yc - yk) * (Ri - r) / (Ri - 3);
    for (let k = 0; k < n; k++) { const a = w.turn + k * 30, b = a + 30;
      A.quad(P(a, R, y0 - 0.6), P(a, R, yk), P(b, R, yk), P(b, R, y0 - 0.6), col); A.quad(P(a, Ri, yk), P(b, Ri, yk), P(b, R, yk), P(a, R, yk), mul(col, 1.06));
      A.quad(P(a, Ri, yf), P(b, Ri, yf), P(b, Ri, yk), P(a, Ri, yk), mul(col, 0.4), COVER);
      // the frame: a bar up each rib to the crown ring, two rings of bars between
      const w0 = 0.24 / Ri / D2R, w1 = 0.24 / 3 / D2R; A.quad(P(a - w1, 3, yc), P(a + w1, 3, yc), P(a + w0, Ri, yk), P(a - w0, Ri, yk), iron, STEEL);
      for (const r of [10, 7.4, 5]) A.quad(P(a, r - 0.22, hgt(r - 0.22)), P(b, r - 0.22, hgt(r - 0.22)), P(b, r + 0.22, hgt(r + 0.22)), P(a, r + 0.22, hgt(r + 0.22)), iron, STEEL);
      if (!near) continue;
      // the shaft under the glass: three lit ring lines and a row of lamps on its wall
      for (const [d0, d1, c, gl] of [[2.4, 3.3, c1, 1.3], [6.2, 7.1, c2, 1.2], [10, 10.9, c1, 1.2]]) A.quad(P(a, Ri - 0.15, y0 - d1), P(b, Ri - 0.15, y0 - d1), P(b, Ri - 0.15, y0 - d0), P(a, Ri - 0.15, y0 - d0), c, [gl, 1, 0, w.ph]);
      // (each lamp stands 0.12 m out from the middle of its flat piece of wall, which lies at Ri cos 15)
      { const lw = 0.3 / Ri / D2R, rl = Ri * Math.cos(15 * D2R) - 0.12; A.quad(P(a + 15 - lw, rl, y0 - 5.1), P(a + 15 + lw, rl, y0 - 5.1), P(a + 15 + lw, rl, y0 - 4.4), P(a + 15 - lw, rl, y0 - 4.4), WARM, [3.2, 1, 0, w.lampPh + k * 0.008]); }
    }
    A.cyl(w.x, yc - 0.25, w.z, 3, yc, 3, 12, col, [0, 0, 0, 0], 't');
    if (near) A.cyl(w.x, yf - 0.2, w.z, Ri, yf, Ri, 12, WARM, [0.3, 1, 0, w.ph], 't');
    else A.cyl(w.x, y0 + 0.2, w.z, Ri, y0 + 0.4, Ri, 12, c1, [0.9, 1, 0, w.ph], 't');
  }
}
// THE DEAD CITY stands against the sun: on the sun's own bearing as it is seen from the way out, 1,200 to 1,800 m
// beyond it and up to 21 degrees to either hand: twelve to twenty broken towers (the 'city' stream), black, no light
// in any. The two tallest stand one to each hand of the sun, 2.6 to 4.5 degrees from it, and no tower's middle stands
// nearer the sun's bearing than 2.2 degrees: so the sun is seen in a gap between towers from the lane, and slides
// behind one and out again as the line runs on. The tallest reaches 7.5 to 9 degrees over the land's edge (the sun's
// own top stands at 6.5; the deck's ragged edge at about 15). Tops are broken: corners cut away, a narrower upper
// stage on some, bare frames (posts and a floor or two) left standing over a snapped top, some lean. Each tower's
// place, breadth and height go to the land's light, which lays its long shadow toward the lane.
// THE WAY OUT'S SEAT: the engine's ring stands with its foot 4 m over the plain. Under it the place has a concrete
// sill across the lane (20 m long, 5 m thick) with a darker slab on it up to the ring's foot (the slab's top stands
// 0.06 m over the sill's own) and a stout cheek at each end, 3 m higher, that carries a caged lamp on its cap (each
// lamp's breathing phase from the 'seat' stream). A LAMP-LINED CAUSEWAY comes to it from the light well in the lane
// east of it: a raised deck of slabs, a flight of eight steps, a landing against the sill (0.18 m under the slab's
// top), a low lamp to each hand every 6 m with its pool of light on the deck. A LOW RING WALL 17 m in radius stands
// round the seat, 1.3 m high under a kerb that the sun rims, open to the east where the causeway comes in. No two
// tops at the seat lie in one plane. The world still draws nothing in the ring itself.
const WAYC = [0.50, 0.44, 0.36], LAMPC = [1.0, 0.72, 0.40];
// a low lamp of the land: a post, a lit head (breathing on its own phase), a small hood
function lowLamp(A, x, y, z, ph, h = 1.45) {
  A.beam([x, y, z], [x, y + h, z], 0.06, 0.06, COL.iron); A.box(x, y + h + 0.16, z, 0.17, 0.16, 0.17, 0, LAMPC, [3.4, 1, 0, ph]); A.box(x, y + h + 0.36, z, 0.26, 0.04, 0.26, 0, COL.iron, [0, 1, 0, 0]);
}
// a deck slab's top between two cross lines (each [left, right] points), with the pools of its lamps laid in its own
// points: gl = the glow at the four corners [a left, a right, b left, b right]
function deckTop(A, pa, pb, gl) {
  const i0 = A.vert(pa[0][0], pa[0][1], pa[0][2], 0, 1, 0, WAYC, [gl[0], 0, 0, 0]), i1 = A.vert(pa[1][0], pa[1][1], pa[1][2], 0, 1, 0, WAYC, [gl[1], 0, 0, 0]);
  const i2 = A.vert(pb[0][0], pb[0][1], pb[0][2], 0, 1, 0, WAYC, [gl[2], 0, 0, 0]), i3 = A.vert(pb[1][0], pb[1][1], pb[1][2], 0, 1, 0, WAYC, [gl[3], 0, 0, 0]);
  const up = (pa[1][0] - pa[0][0]) * (pb[0][2] - pa[0][2]) - (pa[1][2] - pa[0][2]) * (pb[0][0] - pa[0][0]) < 0; if (up) A.i.push(i0, i1, i2, i1, i3, i2); else A.i.push(i0, i2, i1, i1, i2, i3);
}
function buildSeat(A, seed, land) {
  const g = stream('seat', seed), [x, , z] = K.END, y0 = K.PLAIN - 1.5, top = K.PLAIN + K.RING_FOOT - 0.15, c = mix3(COL.conc, COL.stain, 0.4), KERB = [0, 6, 0, 0];
  A.box(x, (y0 + top - 0.06) / 2, z, 2.5, (top - 0.06 - y0) / 2, 10, 0, c); A.box(x, top - 0.25, z, 2.75, 0.25, 8.2, 0, mul(c, 0.8));
  for (const e of [-1, 1]) { const zc = z + e * 9.8; A.box(x, (y0 + top + 3) / 2, zc, 3.1, (top + 3 - y0) / 2, 1.5, 0, c); A.box(x, top + 3.2, zc, 3.3, 0.2, 1.7, 0, mul(c, 0.8), KERB);
    A.beam([x, top + 3.4, zc], [x, top + 3.75, zc], 0.07, 0.07, COL.iron); cagedLamp(A, [x, top + 4.3, zc], 0.42, 3.2, g.range(0.05, 1)); }
  // the causeway: the deck (from the well's kerb), the steps, the landing
  const wellX = Math.round((x - (K.ROW - K.SHIFT) / 2) / K.ROW) * K.ROW + (K.ROW - K.SHIFT) / 2, x0 = wellX - K.WELL_R - 0.5, x3 = x + 2.75, x2 = x3 + 4.8, x1 = x2 + 6.4, yd = land.ground((x0 + x1) / 2, z) + 1.1, yl = top - 0.18;
  const cross = (xx, yy) => [[xx, yy, z + 1.6], [xx, yy, z - 1.6]], side = (xa, xb, ya, yb, e) => A.quadOut([xa, ya - 1.6, z + e * 1.6], [xb, yb - 1.6, z + e * 1.6], [xb, yb, z + e * 1.6], [xa, ya, z + e * 1.6], [(xa + xb) / 2, ya - 0.8, z], WAYC);
  const lampAtX = (xx, yy) => { for (const e of [-1, 1]) lowLamp(A, xx, yy, z + e * 1.42, g.range(0.05, 1)); };
  { const n = Math.max(1, Math.round((x0 - x1) / 6)); for (let k = 0; k < n; k++) { const xa = x0 + (x1 - x0) * k / n, xb = x0 + (x1 - x0) * (k + 1) / n, xm = (xa + xb) / 2;
      deckTop(A, cross(xa, yd), cross(xm, yd), [0.06, 0.06, 0.8, 0.8]); deckTop(A, cross(xm, yd), cross(xb, yd), [0.8, 0.8, 0.06, 0.06]); lampAtX(xm, yd);
      for (const e of [-1, 1]) { side(xa, xb, yd, yd, e); } } }
  for (let k = 0; k < 8; k++) { const xa = x1 + (x2 - x1) * k / 8, xb = x1 + (x2 - x1) * (k + 1) / 8, ya = yd + (yl - yd) * (k + 1) / 9;
    deckTop(A, cross(xa, ya), cross(xb, ya), [0.05, 0.05, 0.05, 0.05]); A.quadOut([xa, ya - (yl - yd) / 9 - 0.02, z - 1.6], [xa, ya - (yl - yd) / 9 - 0.02, z + 1.6], [xa, ya, z + 1.6], [xa, ya, z - 1.6], [xa - 1, ya, z], mul(WAYC, 0.7));
    for (const e of [-1, 1]) side(xa, xb, ya, ya, e); }
  deckTop(A, cross(x2, yl), cross((x2 + x3) / 2, yl), [0.06, 0.06, 0.8, 0.8]); deckTop(A, cross((x2 + x3) / 2, yl), cross(x3, yl), [0.8, 0.8, 0.1, 0.1]); lampAtX((x2 + x3) / 2, yl);
  A.quadOut([x2, yl - 0.32, z - 1.6], [x2, yl - 0.32, z + 1.6], [x2, yl, z + 1.6], [x2, yl, z - 1.6], [x2 - 1, yl, z], mul(WAYC, 0.7)); for (const e of [-1, 1]) side(x2, x3, yl, yl, e);
  // the ring wall (its foot under the ground, its kerb 0.25 m thick and a little proud of it); open over 20 degrees to the east
  { const P = (b, r, y) => [x + bx(b, r), y, z + bz(b, r)], N = 68, yw = K.PLAIN + 1.3, yf = K.PLAIN - 0.8, wc = mul(c, 0.95);
    for (let k = 0; k < N; k++) { const a = 100 + k * 340 / N, b = a + 340 / N;
      A.quad(P(a, 17.35, yf), P(a, 17.35, yw), P(b, 17.35, yw), P(b, 17.35, yf), wc); A.quad(P(b, 16.65, yf), P(b, 16.65, yw), P(a, 16.65, yw), P(a, 16.65, yf), wc);
      A.quad(P(a, 17.5, yw), P(a, 17.5, yw + 0.25), P(b, 17.5, yw + 0.25), P(b, 17.5, yw), wc, KERB); A.quad(P(b, 16.5, yw), P(b, 16.5, yw + 0.25), P(a, 16.5, yw + 0.25), P(a, 16.5, yw), wc, KERB);
      A.quad(P(a, 16.5, yw + 0.25), P(b, 16.5, yw + 0.25), P(b, 17.5, yw + 0.25), P(a, 17.5, yw + 0.25), mul(wc, 1.1), KERB); }
    for (const b of [100, 440]) { A.quadOut(P(b, 16.5, yf), P(b, 17.5, yf), P(b, 17.5, yw + 0.25), P(b, 16.5, yw + 0.25), P(b + (b === 100 ? 5 : -5), 17, yw), wc); lowLamp(A, ...P(b + (b === 100 ? 2 : -2), 17, yw + 0.25), g.range(0.05, 1), 1.0); } }
}
// THE SERVICE WAYS OF THE LAND: raised causeways run lid to lid. Along every row a way joins each lid to the next
// (66 m, rim to rim); across every lane a way runs from a lid to the light well in the lane's middle and on to the
// lid beyond it in the next row (two legs of 47 m; they pass under the flown line 8 m and more below it). A way is a
// deck of slabs some 12 m long and 3.2 m wide, 1.1 m over the ground on a narrower footing, a rusty pipe run on
// saddles along one side, and along the other A LOW LAMP AT EVERY SLAB (12 m apart), lit, with its pool of light on
// the deck. At a lid the way ends in a landing and three steps down to the lid's plinth, where a small porch with a
// lit lamp stands against the drum (the lid's door); at our own plinth the porch stands against the wall's foot.
// By some ways stands a small shed (a door, a lamp, a kerbed roof) or a low hatch (the 'ways' stream deals which,
// which side the pipe runs, and every lamp's phase). Ways are built to the lids within 620 m of our axis.
function buildWays(A, lids, wells, land, seed) {
  const g = stream('ways', seed), rust = lin('#6a4030'), verd = lin('#4f8f7c'), conc = mix3(COL.conc, COL.stain, 0.3), KERB = [0, 6, 0, 0], STEEL = [0, 1, 0, 0], COVER = [0, 0, 1, 0];
  const lidAt = (x, z) => (Math.hypot(x, z) < 1 ? { x: 0, z: 0, own: true, d: 0 } : lids.find((l) => Math.hypot(l.x - x, l.z - z) < 1));
  const rim = (l) => (l.own ? K.FOOT_R + 1.5 : 77.6);
  // one way from a to b (plan points); endA, endB: the lid a porch stands at there (or null)
  const way = (a, b, endA, endB) => { const len = Math.hypot(b[0] - a[0], b[1] - a[1]), u = [(b[0] - a[0]) / len, (b[1] - a[1]) / len], nn = [-u[1], u[0]], n = Math.max(1, Math.round(len / 12)), sl = len / n, ps = g.chance(0.5) ? 1 : -1, extra = g.range(0, 1), ek = g.int(0, n - 1), yaw = Math.atan2(-u[1], u[0]);
    const at = (t, o, y) => [a[0] + u[0] * t + nn[0] * o, y, a[1] + u[1] * t + nn[1] * o];
    for (let k = 0; k < n; k++) { const t0 = k * sl + 0.07, t1 = (k + 1) * sl - 0.07, tm = (t0 + t1) / 2, c = at(tm, 0, 0), y = land.ground(c[0], c[2]) + 1.1, ph = g.range(0.05, 1);
      const X = (t, o, dy) => at(t, o, y + dy), cr = (t) => [X(t, 1.6, 0), X(t, -1.6, 0)], gl = ps > 0 ? [0.3, 0.9] : [0.9, 0.3];
      deckTop(A, cr(t0), cr(tm), [0.04, 0.04, gl[0], gl[1]]); deckTop(A, cr(tm), cr(t1), [gl[0], gl[1], 0.04, 0.04]);
      for (const e of [-1, 1]) A.quadOut(X(t0, e * 1.6, -0.32), X(t1, e * 1.6, -0.32), X(t1, e * 1.6, 0), X(t0, e * 1.6, 0), X(tm, 0, -0.16), WAYC);
      A.quadOut(X(t0, -1.6, -0.32), X(t0, 1.6, -0.32), X(t0, 1.6, 0), X(t0, -1.6, 0), X(tm, 0, -0.16), WAYC); A.quadOut(X(t1, -1.6, -0.32), X(t1, 1.6, -0.32), X(t1, 1.6, 0), X(t1, -1.6, 0), X(tm, 0, -0.16), WAYC);
      for (const e of [-1, 1]) A.quadOut(X(t0 - 0.07, e * 1.05, -1.7), X(t1 + 0.07, e * 1.05, -1.7), X(t1 + 0.07, e * 1.05, -0.32), X(t0 - 0.07, e * 1.05, -0.32), X(tm, 0, -1), mul(WAYC, 0.6), COVER);
      // the lamp at the slab's middle (on the side away from the pipe), the pipe on its saddle
      { const p = X(tm, -ps * 1.42, 0); lowLamp(A, p[0], p[1], p[2], ph); }
      { const pa = X(t0 - 0.07, ps * 2.25, -0.5), pb = X(t1 + 0.07, ps * 2.25, -0.5); for (let q = 0; q < 6; q++) { const a0 = q / 6 * TAU, a1 = (q + 1) / 6 * TAU, o0 = Math.cos(a0) * 0.3, h0 = Math.sin(a0) * 0.3, o1 = Math.cos(a1) * 0.3, h1 = Math.sin(a1) * 0.3;
          A.quadOut([pa[0] + nn[0] * o0, pa[1] + h0, pa[2] + nn[1] * o0], [pb[0] + nn[0] * o0, pb[1] + h0, pb[2] + nn[1] * o0], [pb[0] + nn[0] * o1, pb[1] + h1, pb[2] + nn[1] * o1], [pa[0] + nn[0] * o1, pa[1] + h1, pa[2] + nn[1] * o1], [(pa[0] + pb[0]) / 2, pa[1], (pa[2] + pb[2]) / 2], rust, STEEL); }
        const sd = X(tm, ps * 2.25, -1.25); A.box(sd[0], sd[1], sd[2], 0.3, 0.5, 0.45, yaw, conc); }
      // a shed or a hatch beside one slab of some ways
      if (k === ek && extra < 0.5) { const o = -ps * 5.6, q = X(tm, o, 0);
        if (extra < 0.28) { A.box(q[0], q[1] + 0.3, q[2], 2.2, 1.7, 1.7, yaw, conc); A.box(q[0], q[1] + 2.12, q[2], 2.5, 0.12, 2.0, yaw, mul(conc, 0.8), KERB);
          const dq = X(tm, o + ps * 1.74, 0); A.box(dq[0], dq[1] + 0.05, dq[2], 0.55, 1.05, 0.05, yaw, lin('#2a2c32'), STEEL); const lq = X(tm, o + ps * 1.9, 1.5); A.box(lq[0], lq[1], lq[2], 0.16, 0.14, 0.16, yaw, LAMPC, [3.2, 1, 0, ph * 0.7 + 0.1]);
          const sq = X(tm, o / 2 - ps * 0.1, -0.2); A.box(sq[0], sq[1], sq[2], 0.8, 0.12, 1.15, yaw, WAYC, [0.25, 0, 0, 0]); }
        else { A.box(q[0], q[1] - 0.75, q[2], 1.3, 0.5, 1.3, yaw, conc); A.box(q[0], q[1] - 0.2, q[2], 1.05, 0.06, 1.05, yaw, verd, STEEL); A.box(q[0], q[1] - 0.05, q[2], 0.1, 0.1, 0.45, yaw, COL.iron, STEEL); } }
    }
    // the ends at the lids: a landing step by step down to the plinth, the porch against the drum (or our wall's foot)
    for (const [L, t, dir] of [[endA, 0, -1], [endB, len, 1]]) { if (!L) continue; const c = at(t, 0, 0), y = land.ground(c[0], c[2]) + 1.1, ph = g.range(0.05, 1);
      for (let q = 0; q < 3; q++) { const p = at(t + dir * (0.35 + 0.5 * q), 0, y - 0.17 * (q + 1) - 0.4); A.box(p[0], p[1], p[2], 0.25, 0.4, 1.3, yaw, mul(WAYC, 0.9)); }
      const pr = at(t + dir * (L.own ? 2.0 : 12.4), 0, L.own ? K.PLAIN + 2.0 : L.y + 2 + 1.3); A.box(pr[0], pr[1], pr[2], 1.0, 1.5, 1.5, yaw, conc, COVER); A.box(pr[0], pr[1] + 1.62, pr[2], 1.25, 0.12, 1.75, yaw, mul(conc, 0.8), COVER);
      const dr = at(t + dir * (L.own ? 0.96 : 11.36), 0, pr[1] - 0.25); A.box(dr[0], dr[1], dr[2], 0.05, 1.05, 0.6, yaw, lin('#2a2c32'), STEEL);
      const lp = at(t + dir * (L.own ? 0.85 : 11.25), 0, pr[1] + 1.15); A.box(lp[0], lp[1], lp[2], 0.14, 0.14, 0.2, yaw, LAMPC, [3.4, 1, 0, ph]); }
  };
  // along the rows: each lid to the next lid east of it; across the lanes: lid, light well, lid
  const all = [{ x: 0, z: 0, own: true, d: 0 }, ...lids.filter((l) => l.d < 620)];
  for (const L of all) { const M = lidAt(L.x + K.ROW, L.z); if (M && M.d < 620) way([L.x + rim(L), L.z], [M.x - rim(M), M.z], L, M); }
  for (const w of wells) for (const e of [-1, 1]) { const L = lidAt(w.x + e * (K.ROW - K.SHIFT) / 2, w.z - e * K.ROW / 2); if (!L || L.d >= 620) continue;
    const r = rim(L); way([L.x - e * WAY_DIR[0] * r, L.z - e * WAY_DIR[1] * r], [w.x + e * WAY_DIR[0] * (K.WELL_R + 0.5), w.z + e * WAY_DIR[1] * (K.WELL_R + 0.5)], L, null); }
}
function buildCity(A, land, seed, towers) {
  const g = stream('city', seed), n = g.int(12, 20), dk = lin('#0d0e13'), E = K.END, sunB = 270 - land.hill.side * SUN.OFF / D2R, N0 = [0, 0, 0, 0];
  for (let q = 0; q < 20; q++) {
    let off = g.range(-21, 21); const r = q < 2 ? g.range(1200, 1500) : g.range(1200, 1800), el = q === 0 ? g.range(7.5, 9) : q === 1 ? g.range(6, 7.5) : g.range(2.5, 6.5), near = g.range(2.6, 4.5);
    const w = g.range(26, 56), d = g.range(24, 44), lean = g.chance(0.3) ? g.range(-0.09, 0.09) : 0, snapped = g.chance(0.6), yaw = g.range(0, 1.2), stage = g.chance(0.5), sw = g.range(0.45, 0.7), shh = g.range(0.12, 0.3), cuts = [0, 1, 2, 3].map(() => g.range(0, 1)), posts = [0, 1, 2, 3].map(() => g.range(0.05, 0.2));
    if (q >= n) continue;
    off = q === 0 ? near : q === 1 ? -near : Math.sign(off || 1) * (2.2 + Math.abs(off) * (21 - 2.2) / 21);
    const x = E[0] + bx(sunB + off, r), z = E[2] + bz(sunB + off, r), y0 = land.height(x, z) - 12, h = E[1] + r * Math.tan(el * D2R) - y0, c = Math.cos(yaw), s = Math.sin(yaw);
    const cut = cuts.map((v) => (snapped ? 0.6 + 0.4 * v : 0.94 + 0.06 * v));
    const C = (i, t, k = 1) => { const ex = [-1, 1, 1, -1][i] * w / 2 * k, ez = [-1, -1, 1, 1][i] * d / 2 * k, hh = h * (stage ? 1 - shh : 1) * (t > 0 ? cut[i] * t : 0); return [x + ex * c + ez * s + lean * hh, y0 + hh, z - ex * s + ez * c]; };
    for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; A.quadOut(C(i, 0), C(j, 0), C(j, 1), C(i, 1), [x, y0 + h / 2, z], mul(dk, 0.8 + 0.2 * (i % 2)), N0); }
    A.quadOut(C(0, 1), C(1, 1), C(2, 1), C(3, 1), [x, y0, z], dk, N0);
    // a narrower upper stage; or, over a snapped top, the bare frame: posts of unequal height and a floor left hanging
    const top = h * (stage ? 1 - shh : 1);
    if (stage && !snapped) { const U = (i, yy) => { const p = C(i, 1, sw); return [p[0] + lean * (yy - top), y0 + yy, p[2]]; };
      for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; A.quadOut(U(i, top * 0.9), U(j, top * 0.9), U(j, h * (0.93 + 0.07 * cuts[j])), U(i, h * (0.93 + 0.07 * cuts[i])), [x, y0 + h, z], mul(dk, 0.8 + 0.2 * (i % 2)), N0); }
      A.quadOut(U(0, h * (0.93 + 0.07 * cuts[0])), U(1, h * (0.93 + 0.07 * cuts[1])), U(2, h * (0.93 + 0.07 * cuts[2])), U(3, h * (0.93 + 0.07 * cuts[3])), [x, y0, z], dk, N0); }
    else for (let i = 0; i < 4; i++) { const p = C(i, 1, 0.92), hs = posts[i] * h; A.beam([p[0], p[1] - 4, p[2]], [p[0] + lean * hs, p[1] + hs, p[2]], w * 0.035, w * 0.035, dk, N0);
      if (i === 1 && snapped) { const p0 = C(0, 1, 0.92), hf = Math.min(posts[0], posts[1]) * h * 0.7; A.beam([p0[0], p0[1] + hf, p0[2]], [p[0], p[1] + hf, p[2]], d * 0.2, 0.9, dk, N0); } }
    towers.push([x, z, Math.max(w, d) * 0.5, h * (snapped ? 0.86 : 0.97) - 12, y0 + h * (snapped ? 0.86 : 0.97)]);
  }
}
// SHAFTS OF DUSTY LIGHT between the towers: the air's own dust, lit where the sun reaches it and dark in each tower's
// long shadow. It is drawn on five upright sheets that stand across the sun's way, 260 to 1,100 m beyond the way out
// (each 1,400 m wide and 150 m tall, thinning to nothing at its ends, at its top and at the ground): one looks toward
// the sun through all five, and the lit lanes between the towers' shadows fan out toward the eye. The dust in them
// drifts on the wind.
const SHAFT_VERT = /* glsl */`varying vec3 vW; void main(){ vW = position; gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.); }`;
const SHAFT_FRAG = /* glsl */`
precision highp float;
${GLSL_HASH}
${GLSL_VALUE_NOISE}
uniform float uTime, uExpo, uTop[20]; uniform vec3 uBand, uSun, uWind, uAxis; uniform vec4 uTower[20];
varying vec3 vW;
void main(){
  vec2 aw = -normalize(uSun.xz); float tanS = uSun.y / length(uSun.xz), lit = 1.;
  for (int i = 0; i < 20; i++) { vec4 t = uTower[i]; if (t.w < 1.) continue; vec2 d = vW.xz - t.xy; float s = dot(d, aw); if (s < 0.) continue;
    float soft = 3. + 0.025 * s; lit *= 1. - (1. - smoothstep(-soft, soft, abs(d.x * aw.y - d.y * aw.x) - t.z)) * (1. - smoothstep(-8., 8., vW.y - (uTop[i] - s * tanS))); }
  float across = abs((vW.x - uAxis.x) * aw.y - (vW.z - uAxis.y) * aw.x), up = vW.y - ${K.PLAIN.toFixed(1)};
  float dens = (1. - smoothstep(520., 700., across)) * smoothstep(8., 30., up) * (1. - smoothstep(60., 150., up));
  float dust = 0.55 + 0.45 * vnoise(vec3(vW.xz * 0.011 + uWind.xz * uTime * 0.012, vW.y * 0.02));
  gl_FragColor = vec4(mix(uBand, vec3(1.0, 0.42, 0.14), 0.4) * uExpo, 0.085 * lit * dens * dust);
}`;
// STREAMERS OF BLOWN SAND: long low ribbons that run over the ground with the wind (8 m a second), each 40 to 80 m
// long and 5 to 10 m wide, lying half a metre to a metre over the ground it crosses, torn along its length, soft at
// its edges and ends; slate-pale where the sun stands behind the eye, GOLD where the sun stands behind the sand.
// They cross the lanes and the gaps between the lids (the 'streamers' stream): none runs through a lid or our plinth.
const STREAM_VERT = /* glsl */`
attribute vec2 aUv; attribute vec4 aPar; attribute float aRise;
uniform float uTime; uniform vec3 uEye, uSun; uniform vec2 uDir;
varying vec2 vUv; varying float vAl, vSeed, vGold; varying vec3 vW;
void main(){
  float age = fract(uTime / aPar.x + aPar.y);
  vec3 wp = position + vec3(uDir.x, 0., uDir.y) * (age * aPar.w) + vec3(0., aRise * age, 0.);
  vGold = pow(max(dot(normalize(wp - uEye), normalize(vec3(uSun.x, 0., uSun.z))), 0.), 3.);
  vUv = aUv; vSeed = aPar.y * 37.; vAl = aPar.z * smoothstep(0., 0.2, age) * (1. - smoothstep(0.7, 1., age)); vW = wp;
  gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.);
}`;
const STREAM_FRAG = /* glsl */`
precision highp float;
${GLSL_HASH}
${GLSL_VALUE_NOISE}
uniform float uTime, uExpo; uniform vec3 uBand, uEye;
varying vec2 vUv; varying float vAl, vSeed, vGold; varying vec3 vW;
void main(){
  // (fine threads of sand drawn out along the wind: never a blot)
  float n = vnoise(vec2(vUv.x * 2.6 - uTime * 0.45 + vSeed, vUv.y * 9. + vSeed * 1.7)) * 0.55 + vnoise(vec2(vUv.x * 7. - uTime * 0.8, vUv.y * 31. + vSeed)) * 0.45;
  float body = smoothstep(0., 0.25, vUv.x) * (1. - smoothstep(0.7, 1., vUv.x)) * smoothstep(0., 0.35, vUv.y) * (1. - smoothstep(0.65, 1., vUv.y));
  float nearK = smoothstep(0.6, 2.5, length(vW - uEye));
  gl_FragColor = vec4(mix(vec3(0.52, 0.46, 0.42), uBand * vec3(1.5, 1.25, 0.95), vGold) * uExpo, clamp(vAl * nearK * body * smoothstep(0.42, 0.8, n) * (0.6 + 0.9 * vGold), 0., 1.));
}`;
function makeStreamers(shared, list, wind) {
  const pos = [], uv = [], par = [], rise = [], idx = [];
  list.forEach((q, k) => { const u = wind, nn = [-wind[1], wind[0]];
    for (const [a, b] of [[0, 0], [1, 0], [1, 1], [0, 1]]) { pos.push(q.x + u[0] * q.len * (a - 0.5) + nn[0] * q.wid * (b - 0.5), q.y, q.z + u[1] * q.len * (a - 0.5) + nn[1] * q.wid * (b - 0.5)); uv.push(a, b); par.push(q.life, q.ph, q.a, q.run); rise.push(q.rise); }
    idx.push(k * 4, k * 4 + 1, k * 4 + 2, k * 4, k * 4 + 2, k * 4 + 3); });
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3)); geo.setAttribute('aUv', new THREE.BufferAttribute(new Float32Array(uv), 2));
  geo.setAttribute('aPar', new THREE.BufferAttribute(new Float32Array(par), 4)); geo.setAttribute('aRise', new THREE.BufferAttribute(new Float32Array(rise), 1)); geo.setIndex(idx);
  const me = new THREE.Mesh(geo, new THREE.ShaderMaterial({ uniforms: { uTime: shared.uTime, uExpo: shared.uExpo, uBand: shared.uBand, uSun: shared.uSun, uEye: shared.uEye, uDir: { value: new THREE.Vector2(wind[0], wind[1]) } },
    vertexShader: STREAM_VERT, fragmentShader: STREAM_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
  me.name = 'streamers of blown sand'; me.userData.kind = 'medium'; me.userData.reach = 120; me.frustumCulled = false; me.renderOrder = 4; return me;
}
function makeShafts(shared, hill, tops) {
  const sd = sunDir(hill.side), l = Math.hypot(sd[0], sd[2]), sh = [sd[0] / l, sd[2] / l], pos = [], idx = [], E = K.END;
  [260, 420, 620, 860, 1100].forEach((D, k) => { const cx = E[0] + sh[0] * D, cz = E[2] + sh[1] * D;
    for (const [e, y] of [[-1, K.PLAIN], [1, K.PLAIN], [1, K.PLAIN + 150], [-1, K.PLAIN + 150]]) pos.push(cx - sh[1] * 700 * e, y, cz + sh[0] * 700 * e);
    idx.push(k * 4, k * 4 + 1, k * 4 + 2, k * 4, k * 4 + 2, k * 4 + 3); });
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3)); geo.setIndex(idx);
  const me = new THREE.Mesh(geo, new THREE.ShaderMaterial({ uniforms: { uTime: shared.uTime, uExpo: shared.uExpo, uBand: shared.uBand, uSun: shared.uSun, uWind: shared.uWind, uTower: shared.uTower, uTop: { value: tops }, uAxis: { value: new THREE.Vector3(E[0], E[2], K.PLAIN) } },
    vertexShader: SHAFT_VERT, fragmentShader: SHAFT_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
  me.name = 'shafts of dusty light'; me.userData.kind = 'medium'; me.userData.reach = 0; me.frustumCulled = false; me.renderOrder = 3; return me;
}

// ---------------------------------------------------------------- the sky: a heavy cloud deck, the band of last light low in the west
// THE BAND'S BEARING is the place's own: due west (270), along the rows, over the flank's crest.
// THE SKY is a dome fixed in the world: a sphere 4,300 m in radius about the shaft's axis, its centre at the height of
// our own eave. The flown line never goes more than 215 m from the axis, so the dome stands inside the far plane (4,600 m)
// from every place on it, and every lid (the farthest 3,500 m off) stands inside the dome.
const SKY_R = 4300, SKY_Y = K.EAVE_TOP;
// THE LOOK'S ANGLE: how far on round the shaft (degrees of bearing ahead of the lens) the looked-at front stands: ONE
// figure for every storey, and the camera's own turn sets it. Measured over the whole flight with the engine's own
// rules, the fastest turn stands where the look comes on at the helix's start (125 m of route): at 85 the eased
// camera turns 24.0 degrees a second there and the gaze itself 24.7; at 100 they turn 25.9 and 26.5, and the gaze's
// own turn passes the law's 26. 85 keeps both 1.3 and more under the law; the gaze then stands 44.6 degrees off
// the heading at most (the law is 75).
const LOOK_ON = 85;
// DUST and RAIN are dealt in rings about our own lid's axis, the same on every side: dust from 97 m (clear of our eave
// and its kerb) out to 520 m; rain from 80 m out to 300 m.
const DUST_R0 = 97, DUST_R1 = 520, RAIN_R0 = 80, RAIN_R1 = 300;
const SKY_VERT = /* glsl */`
varying vec3 vDir;
void main(){ vDir = position; gl_Position = projectionMatrix * viewMatrix * vec4(position * SKY_R + vec3(0., SKY_Y, 0.), 1.); }`
  .replace('SKY_R', SKY_R.toFixed(1)).replace('SKY_Y', SKY_Y.toFixed(1));
const SKY_FRAG = /* glsl */`
precision highp float;
${GLSL_HASH}
${GLSL_VALUE_NOISE}
uniform float uTime, uBandW, uExpo; uniform vec3 uBand, uSun; uniform vec2 uWind;
varying vec3 vDir;
// cloud by its own sizes, from the great banks down to torn scud a twentieth their size (fine: how much of the small
// sizes is drawn; toward the land's edge, where the deck is seen edge on, the air takes them)
float cloud(vec2 q, float fine){ return vnoise(q) * 0.46 + vnoise(q * 2.07 + 3.1) * 0.25 + (vnoise(q * 4.3 + 7.7) * 0.15 + vnoise(q * 8.9 + 1.3) * 0.09 + vnoise(q * 18.7 + 5.) * 0.05) * fine + 0.145 * (1. - fine); }
void main(){
  vec3 d = normalize(vDir); float h = d.y;
  vec3 sh = normalize(vec3(uSun.x, 0., uSun.z)); float az = dot(normalize(vec3(d.x, 0., d.z) + vec3(1e-5, 0., 0.)), sh);
  float ang = acos(clamp(dot(d, uSun), -1., 1.));
  vec3 sc = mix(uBand, vec3(1.0, 0.42, 0.14), 0.55);
  // THE CLEAR SKY between the land's edge and the deck: brightest by the sun, falling to dusky rose and then violet
  // far to either side and overhead
  float t = smoothstep(-0.25, 1., az);
  vec3 sky = mix(vec3(0.080, 0.064, 0.140), mix(vec3(0.34, 0.15, 0.19), sc * 0.62, pow(t, 4.)), smoothstep(0.05, 0.8, t));
  sky *= mix(1.0, 0.42, smoothstep(0., 0.32, h));
  // THE SUN: a wide glow, and the disc itself, 3 degrees across, deep orange, redder at its lower limb
  sky += sc * (0.34 * exp(-ang / (0.04 + uBandW)) + 0.14 * exp(-ang / 0.30));
  // shafts of light fan out from it through the dusty air (the sky's own; they stand still)
  { vec3 rt = normalize(cross(uSun, vec3(0., 1., 0.))), up = cross(rt, uSun); float phi = atan(dot(d, up), dot(d, rt));
    sky += sc * 0.22 * smoothstep(0.42, 0.78, vnoise(vec2(phi * 7., 2.)) * 0.6 + vnoise(vec2(phi * 19., 9.)) * 0.4) * exp(-ang / 0.42) * smoothstep(0.03, 0.12, ang); }
  float disc = 1. - smoothstep(${(SUN.R * 0.9).toFixed(4)}, ${SUN.R.toFixed(4)}, ang);
  sky = mix(sky, mix(vec3(1.0, 0.16, 0.03), vec3(1.0, 0.42, 0.09), smoothstep(-${SUN.R.toFixed(4)}, ${SUN.R.toFixed(4)}, h - uSun.y)) * 1.35, disc);
  // THE CLOUD DECK, in two layers that drift at their own speeds: a high sheet, and low torn scud under it. Overhead
  // it is nearly whole; toward the land's edge it thins, breaks into ragged bars and ends: no straight edge anywhere.
  float fine = smoothstep(0.03, 0.30, h);
  vec2 q1 = d.xz / max(h + 0.10, 0.04) * 1.15 + uWind * uTime * 0.05, q2 = d.xz / max(h + 0.05, 0.03) * 0.95 + uWind * uTime * 0.085 + 17.3;
  float c1 = cloud(q1, fine), c2 = cloud(q2, fine);
  float th1 = mix(0.78, 0.36, smoothstep(0.07, 0.36, h)), th2 = mix(0.84, 0.50, smoothstep(0.03, 0.24, h));
  float k1 = smoothstep(th1 - 0.05, th1 + 0.08, c1), k2 = smoothstep(th2 - 0.04, th2 + 0.06, c2);
  // its underside is lit orange near the sun and rose farther round, most at its thin edges and low down; it goes to
  // slate far from the sun and overhead
  float nearSun = exp(-ang / 0.42), west = smoothstep(0.05, 0.95, az), lowK = 1. - smoothstep(0.08, 0.7, h);
  vec3 lit = mix(vec3(0.30, 0.12, 0.16), sc * vec3(1.05, 0.8, 0.62), nearSun) * west;
  vec3 slate = vec3(0.050, 0.054, 0.082);
  vec3 cl1 = slate * mix(1.9, 0.9, smoothstep(th1, th1 + 0.3, c1)) + lit * (0.25 * lowK + 0.85 * (1. - smoothstep(0., 0.2, c1 - th1)) * (0.35 + 0.65 * lowK));
  vec3 cl2 = slate * mix(1.5, 0.7, smoothstep(th2, th2 + 0.25, c2)) + lit * (0.18 * lowK + 0.9 * (1. - smoothstep(0., 0.14, c2 - th2)) * (0.3 + 0.7 * lowK));
  vec3 col = mix(mix(sky, cl1, k1), cl2, k2 * 0.9);
  // the land's edge goes into the low haze (gold toward the sun, dusky violet elsewhere), as the land's own air does
  vec3 haze = mix(vec3(0.085, 0.090, 0.145), sc * vec3(0.95, 0.80, 0.62), pow(max(az, 0.), 4.));
  col = mix(col, haze, smoothstep(0.03, -0.03, h));
  gl_FragColor = vec4(col * uExpo, 1.);
}`;

export default {
  id: 'town-round-one-stair',
  name: 'Town Round One Stair',
  category: 'screen',
  placeKind: 'interior',
  screen: 'Silo',
  screenYear: '2023',
  screenKind: 'series',
  media: ['air'],
  weirdness: 0.5,
  async build(ctx) {
    const seed = ctx.seed ?? 1, vary = ctx.vary || {}, detail = (ctx.quality && ctx.quality.detail) || 1;
    // dusk is fixed: the hour is read and ignored
    const hourIgnored = vary.hour; void hourIgnored;
    const density = clamp(vary.density ?? 1, 0.7, 1.3), rare = !!vary.rare;
    const scene = new THREE.Scene(), shared = makeShared();
    // every stream in one fixed list, before any loop runs
    const deal = dealTown(seed, density);
    await ctx.yield();
    const gs = stream('sky', seed), gd = stream('dust', seed), gr = stream('rare', seed);
    // the band's colour and width, the cloud; THE WIND blows ACROSS the lane: from the east or from the west side, 40 to 70 degrees off the row line to either hand
    const bandCol = [lin('#e8b058'), lin('#e0703a'), lin('#e8b0a0')][gs.int(0, 2)], bandW = gs.range(0.045, 0.085), windB = (gs.chance(0.5) ? 270 : 90) + (gs.chance(0.5) ? 1 : -1) * gs.range(40, 70), cloudK = gs.range(0.8, 1.2);
    const wind = [Math.sin(windB * D2R), -Math.cos(windB * D2R)];
    shared.uBand.value.set(bandCol[0], bandCol[1], bandCol[2]); shared.uRain.value = rare ? 1 : 0;
    shared.uRingCol.value.set(0.55, 0.85, 1.0); shared.uWind.value.set(wind[0] * 22 * cloudK, 0, wind[1] * 22 * cloudK);
    const land = makeLand(seed, wind), lids = lidPlaces(seed, land), hill = land.hill;
    // THE SUN stands on the hill's side of the lane's bearing; the land's rules go to the shader as the world deals them
    shared.uSun.value.set(...sunDir(hill.side)); shared.uLand.value.set(land.phases[0], land.phases[1], land.phases[2], lids.swap ? 1 : 0); shared.uRidge.value.set(...land.ph);
    shared.uHill.value.set(hill.x, hill.z, hill.hx, hill.hz); shared.uTree.value.set(hill.x, hill.z, hill.h + hill.tall, hill.h);
    await ctx.yield();
    const knots = routeKnots();
    await ctx.yield();
    // (the curve's own code is run once on the route's first thirty knots, so that the whole route's making is one short step)
    makeRoute({ pts: knots.pts.slice(0, 30), marks: {} });
    await ctx.yield();
    const R = makeRoute(knots), path = R.path, m = R.m, L = path.length;
    await ctx.yield();
    const hero = await buildHero(ctx, { deal, shared, density, detail, rare });
    scene.add(hero.object);
    await ctx.yield();
    const mat = hero.material, line = [];
    for (let d = 40; d <= LEAVE_LEN + 20; d += 2) { const q = leaveAt(Math.min(d, LEAVE_LEN)); line.push([q[0] - Math.max(0, d - LEAVE_LEN), q[2]]); }
    // the 'stones' stream: two to four rounded stones in the lee of each of the nearer lids; none within 16 m of the
    // flown line, on our plinth, against a lid, by a light well or on the bare hill (nothing lies on the hill)
    const gst = stream('stones', seed), stones = [], wells = wellPlaces(seed, land);
    for (const l of lids) { if (l.d >= 560) continue; const k = gst.int(2, 4);
      for (let q = 0; q < 4; q++) { const along = gst.range(84, 122), across = gst.range(-24, 24), rr = gst.range(0.8, 2.2), tone = gst.range(0.85, 1.1); if (q >= k) continue;
        const x = l.x + wind[0] * along - wind[1] * across, z = l.z + wind[1] * along + wind[0] * across;
        if (offLine(x, z, line) < 16 || Math.hypot(x, z) < K.FOOT_R + 6 || lids.some((o) => Math.hypot(o.x - x, o.z - z) < 80) || wells.some((o) => Math.hypot(o.x - x, o.z - z) < K.WELL_R + 4) || (Math.abs(x - land.hill.x) < land.hill.hx + 6 && Math.abs(z - land.hill.z) < land.hill.hz + 6)) continue;
        stones.push({ x, z, r: rr, tone }); } }
    { const A = new Acc(); for (const q of [0, 2, 4, 3]) { buildLand(A, land, line, lids, q, wind, stones); await ctx.yield(); } const me = new THREE.Mesh(A.toGeometry(), mat); me.name = 'the grey land'; me.userData.kind = 'floor'; me.frustumCulled = false; scene.add(me); }
    await ctx.yield();
    { const A = new Acc(); buildLand(A, land, line, lids, 1, wind, stones); await ctx.yield(); buildWells(A, wells); await ctx.yield();
      // (each tower's place, half breadth and height go to the land's light and to the shafts)
      const towers = []; buildCity(A, land, seed, towers); towers.forEach((t, i) => shared.uTower.value[i].set(t[0], t[1], t[2], t[3]));
      { const tops = new Array(20).fill(0); towers.forEach((t, i) => { tops[i] = t[4]; }); scene.add(makeShafts(shared, hill, tops)); }
      buildDrifts(A, lids, land, wind, seed); await ctx.yield(); buildSeat(A, seed, land);
      const me = new THREE.Mesh(A.toGeometry(), mat); me.name = 'our plinth, the light wells, the dead city, the drifts, the way out\'s seat'; me.frustumCulled = false; scene.add(me); }
    await ctx.yield();
    { const A = new Acc(); buildWays(A, lids, wells, land, seed);
      const me = new THREE.Mesh(A.toGeometry(), mat); me.name = 'the service ways of the land'; me.frustumCulled = false; scene.add(me); }
    await ctx.yield();
    // (the lids are built six at a time into four meshes, so no one step and no one mesh is long in the making)
    for (let part = 0; part < 4; part++) { const A = new Acc(), q0 = Math.ceil(lids.length * part / 4), q1 = Math.ceil(lids.length * (part + 1) / 4);
      for (let q = q0; q < q1; q += 6) { buildLids(A, lids, detail, q, Math.min(q + 6, q1)); await ctx.yield(); }
      const me = new THREE.Mesh(A.toGeometry(), mat); me.name = 'the lids of the other shafts'; me.frustumCulled = false; scene.add(me); await ctx.yield(); }
    await ctx.yield();
    const skyU = { uTime: shared.uTime, uBand: shared.uBand, uSun: shared.uSun, uExpo: shared.uExpo, uBandW: { value: bandW }, uWind: { value: new THREE.Vector2(wind[0] * cloudK, wind[1] * cloudK) } };
    const sky = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16), new THREE.ShaderMaterial({ uniforms: skyU, vertexShader: SKY_VERT, fragmentShader: SKY_FRAG, side: THREE.BackSide, depthWrite: false, depthTest: true }));
    sky.name = 'sky'; sky.userData.kind = 'far'; sky.frustumCulled = false; sky.renderOrder = -1; scene.add(sky);
    // DUST: a few low veils of blown dust drift near the ground on the wind (8 m a second), each 16 to 34 m long and
    // 2 to 3.4 m high where it starts, torn along its length, soft at its top and ends, pale against the slate
    // ground: four in the lee of each of the nearer lids and of ours, and five dozen tried in the open between
    // (the 'dust' stream), in a ring about our own lid's axis, the same on every side; none runs under an eave.
    { const list = [], hitsLid = (x, z) => lids.some((l) => Math.hypot(l.x - x, l.z - z) < 84);
      const veil = (x, z) => { const len = gd.range(26, 48), hgt = gd.range(2.2, 4.0), life = gd.range(6, 10), ph = gd.range(0, 1), a = gd.range(0.5, 0.7), rr = Math.hypot(x, z);
        const run = 8 * life, x1 = x + wind[0] * run, z1 = z + wind[1] * run;
        if (rr < DUST_R0 || rr > DUST_R1 || Math.hypot(x1, z1) < DUST_R0 || Math.hypot((x + x1) / 2, (z + z1) / 2) < DUST_R0 || hitsLid(x, z) || hitsLid(x1, z1) || hitsLid((x + x1) / 2, (z + z1) / 2)) return;
        const y0 = land.height(x, z), y1 = land.height(x1, z1);
        list.push({ p: [x, y0 + hgt * 0.5, z], size: [len, hgt], vel: [wind[0] * 8, (y1 - y0) / life, wind[1] * 8], life, ph, col: [0.50, 0.47, 0.46], a, grow: 0.35 }); };
      for (const l of [{ x: 0, z: 0, own: true }, ...lids.filter((q) => q.d < DUST_R1)]) for (let k = Math.round(4 * density); k > 0; k--) { const along = (l.own ? DUST_R0 + 2 : 86) + gd.range(0, 24), across = gd.range(-40, 40); veil(l.x + wind[0] * along - wind[1] * across, l.z + wind[1] * along + wind[0] * across); }
      await ctx.yield();
      for (let k = Math.round(60 * density); k > 0; k--) { const rr = Math.sqrt(gd.range(DUST_R0 * DUST_R0, DUST_R1 * DUST_R1)), b = gd.range(0, 360); veil(bx(b, rr), bz(b, rr)); }
      scene.add(makeWisps(shared, list, { name: 'dust on the wind', veil: true })); }
    { const gq = stream('streamers', seed), list = [], hits = (x, z) => Math.hypot(x, z) < DUST_R0 + 6 || lids.some((l) => Math.hypot(l.x - x, l.z - z) < 84) || wells.some((w) => Math.hypot(w.x - x, w.z - z) < K.WELL_R + 5);
      for (let k = Math.round(110 * density); k > 0; k--) { const x = gq.range(-560, 160), z = K.LANE_Z + gq.range(-230, 230), len = gq.range(40, 80), wid = gq.range(5, 10), life = gq.range(9, 14), ph = gq.range(0, 1), a = gq.range(0.3, 0.5), up = gq.range(0.5, 1.0), run = 8 * life;
        // (the ribbon's whole run is tried against the lids, the wells and our plinth; it lies over the highest ground
        // under it at its start and at its end, and is lifted over any crest that stands higher between)
        let bad = false; const tops = [];
        for (let q = 0; q <= 8 && !bad; q++) { let top = -1e9; for (const e of [-0.5, 0, 0.5]) { const d = q / 8 * run + e * len, px = x + wind[0] * d, pz = z + wind[1] * d; bad = bad || hits(px, pz); top = Math.max(top, land.height(px, pz)); } tops.push(top); }
        if (bad) continue;
        let lift = 0; for (let q = 1; q < 8; q++) lift = Math.max(lift, tops[q] - lerp(tops[0], tops[8], q / 8));
        list.push({ x, z, y: tops[0] + lift + up, len, wid, life, ph, a, run, rise: tops[8] - tops[0] }); }
      scene.add(makeStreamers(shared, list, wind)); }
    // STEAM from the vent stacks of the nearer lids: thin, leaning with the wind, each stack on its own dealt life and phase
    // (A REAL PLUME: ten puffs follow one another out of each stack's mouth, rise 3 m a second, lean more and more with
    // the wind, swell fourfold and thin away over the stack's own dealt life; the side turned to the sun is lit orange)
    { const list = []; for (const { p, v } of ventMouths(lids)) for (let q = 0; q < 10; q++) list.push({ p, size: [3.0, 3.2], vel: [wind[0] * 3.4, 3.0, wind[1] * 3.4], life: v.life + 2, ph: v.steam + q * 0.1, col: [0.62, 0.64, 0.72], a: 0.74, grow: 2.8 });
      scene.add(makeWisps(shared, list, { name: 'steam from the lids', plume: true })); }
    // THE RARE VISIT: rain on the grey land, each streak falling at its own place, and streaming off the eaves of the lids near the lane
    if (rare) { const list = [];
      for (let i = 0; i < 14000; i++) { const rr = Math.sqrt(gr.range(RAIN_R0 * RAIN_R0, RAIN_R1 * RAIN_R1)), b = gr.range(0, 360), x = bx(b, rr), z = bz(b, rr), ph = gr.range(0, 1); list.push({ p: [x, land.height(x, z) + 40, z], size: [0.13, 3.6], vel: [wind[0] * 3, -34, wind[1] * 3], life: 1.18, ph, col: [0.68, 0.72, 0.82], a: 0.5, grow: 0 }); if (i % 3500 === 3499) await ctx.yield(); }
      for (const Ld of [{ x: 0, z: 0, y: K.GROUND, hk: 1, own: true }, ...lids.filter((q) => q.d < RAIN_R1)]) for (let k = 0; k < 56; k++) { const b = k * 360 / 56 + gr.range(0, 4); list.push({ p: [Ld.x + bx(b, 76.6), Ld.y + (Ld.own ? 18 : LID_KIND[Ld.kind].e0) * Ld.hk, Ld.z + bz(b, 76.6)], size: [0.22, 2.6], vel: [0, -22, 0], life: 0.8, ph: gr.range(0, 1), col: [0.66, 0.7, 0.8], a: 0.4, grow: 0 }); }
      scene.add(makeWisps(shared, list, { name: 'rain', crisp: true })); }

    // PACE by the route's places (metres a second; the engine scales the whole to the duration): 17 down the gallery
    // past the generators, easing over the gallery's last 45 m to 9.6 on the eased foot where the line bends from the
    // gallery's straight into the circle, 13.3 on the climb and in the bowl, 12 where the line levels out under the
    // lid; once out through the bay 19.5 over the rise and round the turn, 25.5 down the lane, easing to 15 over the
    // last 60 m before the line's end.
    const speed = (d) => { let v = 17; v = lerp(v, 9.6, smoothstep(m.helix - 45, m.helix + 8, d)); v = lerp(v, 13.3, smoothstep(m.foot - 14, m.foot + 10, d)); v = lerp(v, 12, smoothstep(m.leave - 50, m.leave - 20, d));
      v = lerp(v, 19.5, smoothstep(m.leave + 4, m.eave + 24, d)); v = lerp(v, 25.5, smoothstep(m.eave + 90, m.eave + 140, d)); return lerp(v, 15, smoothstep(L - 60, L - 4, d)); };
    // THE ONE LOOK: its point slides with the lens and is set by the storey the lens is in, BY HEIGHT ONLY. It stands on
    // the fronts LOOK_ON degrees of bearing on round the shaft: 6 m below the lens over the machines, the canal and the
    // wheels; 2 m above it in the works; level along the home streets; 8 m above it in the lower bowl; 10 m below it
    // under the lid, so that the lit bowl lies under the lens. EACH CHANGE IS CENTRED ON THE FLOOR WHERE THE STOREY
    // CHANGES (the first works floor y 50, the first home street y 74, the bowl's foot y 126, the fourth terrace y 150)
    // and comes over 20 m of height, 10 m to each side of that floor; the front's radius changes over the same heights.
    // The pull rises over 80 m of route from the helix's start and lets go over the bowl's last 55 degrees of bearing;
    // with no pull its point is the route's own point ahead.
    const AHEAD = 16, RAMP = 10, _p = new V3(), _a = new V3(), _t = new V3();
    const ramp = (floor, y) => smoothstep(floor - RAMP, floor + RAMP, y);
    const lookUp = (y) => -6 + 8 * ramp(K.WORKS[0], y) - 2 * ramp(K.HOMES[0], y) + 8 * ramp(K.BORE_TOP, y) - 18 * ramp(K.TERRACES[3], y);
    const frontR = (y) => (y < K.BORE_TOP ? K.FRONT_R : lipR(y)) + (K.HOUSE_R - K.FRONT_R) * ramp(K.HOMES[0], y) * (1 - ramp(K.BORE_TOP, y));
    const lookAt = (time, u) => {
      const d = u * L; path.posAtDist(d, _p); path.posAtDist(d + AHEAD, _a);
      const k = smoothstep(m.helix, m.helix + 80, d) * (1 - smoothstep(m.letGo, m.leave, d));
      const b = bearingOf(_p.x, _p.z) - LOOK_ON, y = _p.y + lookUp(_p.y), r = frontR(y);
      _t.set(bx(b, r), y, bz(b, r));
      return _a.lerp(_t, k);
    };
    const eye = new V3();
    return {
      scene, path, duration: DURATION,
      pace: (u) => speed(u * L) / 12.5,
      camera: { fov: 64, near: 0.3, far: 4600, lookAhead: AHEAD, sway: 0.8, bank: 0.5 },
      pois: [{ at: lookAt, from: (m.helix - 12) / L, to: (m.leave + 12) / L, weight: 0.7, fade: 20 / L }],
      portal: { shape: 'circle', radius: K.RING_R, color: '#9fdcff', glow: 1.1 },
      post: { exposure: 1, bloom: { strength: 0.5, radius: 0.6, threshold: 0.92 }, grade: { saturation: 1.06, contrast: 1.04, vignette: 0.28, grain: 0.02 } },
      ride: 'none', companion: 'none',
      courses: hero.courses, deal, marks: m, lids,
      // the surface under a point, by the place's own rule: the floor of the buried hall and its gallery, and of the open
      // well over it; the sill under the lid; the land outside
      groundAt: (x, y, z) => { const r = Math.hypot(x, z); return y < 100 || r < K.SILL_R ? 0 : r < K.EAVE_R ? K.SILL_Y : land.height(x, z); },
      update(dt, time, camera) {
        shared.uTime.value = time;
        eye.setFromMatrixPosition(camera.matrixWorld); shared.uEye.value.copy(eye);
        hero.update(dt, time);
      },
      dispose() {},
    };
  },
};
