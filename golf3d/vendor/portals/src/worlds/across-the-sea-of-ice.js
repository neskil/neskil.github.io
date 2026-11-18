// Across the Sea of Ice (Frankenstein, Mary Shelley). One line of country flown south to north: a long mountain lake under a
// night thunderstorm; the valley of the torrent that feeds it, at dawn, up to a glacier's snout; the sea of ice, a river of
// frozen waves and blue rifts between the needles of the great white dome and one bare perpendicular rock; the gate where
// the ice widens into a frozen ocean with a ship locked in it; the ice's edge, where the ground sea breaks it into floes
// and an arch of blue ice holds the ring.
//
// Frame: the heading at the entry is -Z; s is a plan metre along -Z (z = -s), x is to the right. The valley's axis V(s)
// wanders by the seed; the flown line is V(s) plus an offset keyed at places. Every place is a plan metre made of the
// lengths of things; the line's length and every u fall where they fall.
//
// NO PACING OF THE CAST. Nothing of the story begins, turns or ends as we come: every thing below stands in one state for
// the whole visit, or goes on a habit of its own on the world's clock with a phase dealt by the seed.
//   STANDING STATES: the blasted stump burns the whole visit, a beacon on its point (the whole tree is never shown, and
//     no bolt falls on it); the low roofless ruin on its crag and the cottages under it stand up the valley in the
//     valley's own hour; the ship lies held in the ice, her lanterns and stern windows lit; the ice towers stand; the
//     ocean's edge stands broken, its floes parted by leads; the four hours stand each over its own country (below).
//   THE FIGURE (once in the world: the one dark cloaked figure) goes a closed round of 78 m on the brow of an ice rise
//     that stands beside the line's furrow on the ice river, 36 m (out) and 48 m (back) to the needles' hand of the
//     line's plan, at 17 m a second. In each round he stands 2 s on each of two footfalls: the highest of the out
//     leg's last third and the far turn, and the highest of the back leg's last third and the near turn. The brow rises
//     away from the line, so both fall at the two ends of the far leg: 2 s standing, about 1 s of bounding, 2 s
//     standing, about 3.5 s of bounding round the near half (a period of 8.6 s); his head turns by a habit of his own.
//     He regards no one.
//   THREE DOG SLEDGES (each a low carriage, an ordinary bundled driver in furs) run one closed round of 247 m of the
//     frozen ocean at 10 m a second, a third of the round apart, short of the ship on her hand: 45 m aside of the line's
//     plan on the near leg (going south), 97 m on the far, half circles of 26 m.
//   THE RAFT of ice, a bare floe, rides at one station in the open water, 64 m beyond the edge and 36 m aside; it
//     rounds 5 m by 3.5 m on the swell every 47 s.
//   THE STORM's flashes and bolts fall on a schedule of the world's clock, on five quarters of the lake's own heights.
// THE HOURS ARE PLACES OF THE WORLD: storm over the lake, dawn up the valley, hard day on the ice river, polar dusk over
// the frozen ocean, joined over three bands of plan metres. Each ground, rock, water and cloud takes the light, the fog
// and the sky of the plan metre it stands on (the part's PLACE law); nothing of the light reads u or the film's clock.
//
// WHAT IS DRIVEN BY WHAT
//   metres flown (u): the film's pace alone.
//   a place of the route: the windows of the five gaze pulls (each toward a fixed place); the things that give way to
//     the line at build (pines, seracs, ridges, bergs).
//   the eye's place: how much of the rain box (under the standing storm) and of the snow box (under the standing dusk) is
//     drawn, both boxes going with the eye; the kit's makes by distance; every puff fading inside 0.6 to 2.5 m of the lens (the medium's own near law);
//     the sky's rays, each of the place a low vault puts it over.
//   the world's clock: the flashes and bolts, the fire, smoke and embers, the figure's round, the sledges' round, the
//     raft, the leads' breathing and the swell, the tipping floes, the drift over the ice, the avalanche, the lanterns,
//     the eagles and the chamois, the clouds, the aurora's folding, the torrent and the falls.
import * as THREE from 'three';
import { makePath, makeRng, hashSeed, clamp, lerp, smoothstep } from '../kit/core.js';
import { makeSky, makeLightRig } from '../kit/sky.js';
import * as Water from '../kit/water.js';
import * as flora from '../kit/flora.js';
import * as F from '../kit/fauna.js';
import * as fx from '../kit/fx.js';
import { buildHero, makeLightUniforms, setHour, makeSkyDome, makeLandMaterial, makePropMaterial, makeAcc, makeProp, stripMesh, stripOffsets, blockInto, raftInto, archInto, makeFigure, makeShip, towerInto, cottageInto, makeFlame, makeSledge, makePuffs, makeWaterMaterial, peakInto, wallInto, castleInto, stumpInto, boltGeometry, makeRound, col3, mix3 } from '../parts/across-the-sea-of-ice.js';

const TAU = Math.PI * 2, DEG = Math.PI / 180;
// a curve through keys [[x, y], ...] with smooth joins
function keyed(keys, x) {
  if (x <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (x <= keys[i][0]) { const a = keys[i - 1], b = keys[i]; return lerp(a[1], b[1], smoothstep(a[0], b[0], x)); }
  return keys[keys.length - 1][1];
}
function lin(keys, x) {
  if (x <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (x <= keys[i][0]) { const a = keys[i - 1], b = keys[i]; return lerp(a[1], b[1], (x - a[0]) / (b[0] - a[0])); }
  return keys[keys.length - 1][1];
}
const bump = (x, w) => Math.exp(-(x / w) * (x / w));
const C = {
  rock: col3('#5c636a'), rock2: col3('#787b7e'), warm: col3('#7d7166'), snow: col3('#e6edf6'), pine: col3('#22332f'), moss: col3('#465a3e'), meadow: col3('#5f7347'),
  gravel: col3('#82837c'), bed: col3('#27313a'), scree: col3('#7f8284'), ice: col3('#b4dcee'), iceOld: col3('#93c4dd'),
};

export default {
  id: 'across-the-sea-of-ice',
  name: 'Across the Sea of Ice',
  category: 'books',
  placeKind: 'wilderness',
  book: 'Frankenstein',
  author: 'Mary Shelley, 1797 to 1851',
  media: ['air', 'open'],
  weirdness: 0.45,
  async build(ctx) {
    const scene = new THREE.Scene(), noise = ctx.noise, vary = ctx.vary || {}, detail = clamp((ctx.quality && ctx.quality.detail) || 1, 0.5, 1);
    const dens = clamp(vary.density ?? 1, 0.7, 1.3), rare = !!vary.rare;
    // FORKS: one stream to a thing, each made of the world's seed and its name, all taken here before any loop runs
    const fk = (name) => makeRng(hashSeed(name + ':' + ctx.seed));
    const R_ = {};
    for (const name of ['plan', 'hour', 'islets', 'oak', 'storm', 'bolts', 'castle', 'falls', 'pines', 'shorepines', 'peaks', 'rock', 'rifts', 'leads', 'floes', 'runner', 'sledge', 'ship', 'raft', 'arch',
      'ridges', 'seracs', 'bergs', 'sky', 'birds', 'chamois', 'mist', 'aval', 'aval2', 'drift', 'seasmoke', 'blocks', 'melt', 'rain', 'snow', 'embers', 'glows', 'hang', 'hummocks', 'towers', 'cottages', 'sparks', 'torrent', 'figclock', 'castleplace', 'shipset', 'pineshapes', 'stumpsmoke', 'galleysmoke', 'cottagesmoke']) R_[name] = fk(name);
    const measure = {};
    // THE HOUR: the visit's own, or one drawn here (dawn as the book has it most often)
    const hr = R_.hour(), drawnHour = hr < 0.55 ? 'dawn' : hr < 0.7 ? 'day' : hr < 0.85 ? 'golden' : 'night';
    const hour = vary.hour && vary.hour !== 'any' ? vary.hour : drawnHour, night = hour === 'night';

    // ------------------------------------------------------------ THE PLAN
    // D: the hand the dome and its needles stand on (the rock stands opposite); O: the oak's shore; SH: the ship's hand (the
    // raft lies on her hand, and the sledges' round lies short of her on the same hand: what her crew see pass)
    const pr = R_.plan, D = pr.chance(0.5) ? 1 : -1, O = pr.chance(0.5) ? 1 : -1, SH = pr.chance(0.5) ? 1 : -1;
    const sHead = pr.range(190, 220), A1 = pr.range(34, 46), L1 = pr.range(540, 680), A2 = pr.range(5, 8), L2 = pr.range(280, 360), P2 = pr.range(0, TAU);
    const latA = pr.range(30, 40), latB = pr.range(60, 70);
    // places: the lake's head, the snout (320 m of valley), the gate (350 m of ice river), the ship (150 m past the gate), the
    // break (80 m past her), the end (160 m of floes and open water); the ice's edge lies 46 m short of the ring
    const s0 = sHead + 320, sGate = s0 + 350, sShip = sGate + 150, sBreak = sShip + 80, sEnd = sBreak + 160, sEdge = sEnd - 46, sBack = -420;
    // the valley's axis: two sines, straight over the first 100 m, the first bend toward the dome, dying out over the ocean
    const V = (s) => smoothstep(100, 330, s) * (1 - smoothstep(sGate - 40, sBreak, s)) * (D * A1 * Math.sin(TAU * (s - 100) / L1) + A2 * Math.sin(TAU * s / L2 + P2));
    // the line's offset aside of the axis: over the torrent up the valley, onto the needles' hand of the ice by the snout, then
    // one long crossing to the rock's hand, ended 60 m past the gate (it keeps that hand over the ocean)
    const LAT = [[s0 - 160, 0], [s0 + 40, D * latA], [sGate + 60, -D * latB]];
    const route = (s) => V(s) + keyed(LAT, s);
    // heights: the torrent's water (the lake at 0, rising 60 m to the snout), the ice's mean level (24 m over the torrent at
    // the brink, rising with the glacier's own slope to the ocean's level at the gate)
    const yR = (s) => 60 * Math.pow(clamp((s - sHead) / 320, 0, 1), 1.15);
    const Lv = (s) => { const d = clamp(s - s0, 0, 350); return 84 + 14 * (1 - Math.exp(-d / 60)) + 0.03 * d; };
    const LvO = Lv(sGate);
    // the lake's shores (metres aside of the axis): the oak's shore near, with the oak's point; the far shore; both close on
    // the torrent's mouth at the lake's head
    const sOak = sHead - 62;
    const nearShore = (s) => lerp(lerp(30 + 16 * (0.5 + 0.5 * noise.n2(s * 0.013 + 11.3, 4.7)), 17, bump(s - sOak, 24)), 8, smoothstep(sHead - 50, sHead + 10, s));
    const farShore = (s) => lerp(230 + 34 * noise.n2(s * 0.007 + 3.3, 9.1), 8, Math.pow(smoothstep(sHead - 190, sHead + 10, s), 0.8));
    // the ice river's half width by hand (the needles' side wider, the rock 165 m off the axis), opening 6 for 1 beyond the gate
    const hwOf = (s, needles) => (needles ? 200 : 165) + 6 * Math.max(0, s - (sGate - 40));
    // metres inside the ice's margin (0 and under: land): its sides, and the snout's rounded front
    const inside = (x, s) => { const xa = x - V(s), h = hwOf(s, xa * D >= 0), q = xa / h; return Math.min(h - Math.abs(xa), s - s0 - 50 * q * q); };
    await ctx.yield();

    // ------------------------------------------------------------ THE LAND (one function of the place: lake, valley, the ice's banks)
    // what stands in it by its own draws: three islets of the lake on the hand away from the oak (their rock 10 to 14 m off the
    // line), the castle's crag on the rock's hand, the two falls' pools in the gorge, two hanging glaciers on the walls
    const islets = [];
    for (let i = 0; i < 3; i++) { const s = 46 + i * 42 + R_.islets.range(-9, 9), r = R_.islets.range(4, 6), gap = R_.islets.range(10, 14); islets.push({ s, x: V(s) - O * (gap + r), z: -s, r, h: R_.islets.range(2.4, 3.8) }); }
    const castleB = makeProp(), castle = castleInto(castleB, R_.castle);
    // (the ruin stands up the valley, 215 to 245 m beyond the lake's head: past the storm's join on every hour, the night's
    // too, which ends 190 m beyond the head; it is never under the storm's roof)
    const sC = sHead + R_.castleplace.range(215, 245), crag = { s: sC, x: V(sC) - D * (64 + castle.radius), z: -sC, r: castle.radius + 3, top: yR(sC) + 62 };
    // two or three cottages among the pines on the bench below the ruin (37 to 42 m off the axis, on its hand): plain
    // houses 7 by 5 m; none in a fall's bay
    const cottages = [];
    const cottagePlan = (falls) => { for (const ds of [-58, -38, 46, 66]) { const cr = R_.cottages, s = sC + ds + cr.range(-5, 5), a = cr.range(37, 42), yaw = cr.range(-0.5, 0.5), sm = cr.range(0, 1); let p = 0; for (const f of falls) if (f.side === -D) p = Math.max(p, 1 - smoothstep(14, 36, Math.abs(s - f.s))); if (p <= 0 && cottages.length < 3) cottages.push({ s, x: V(s) - D * a, z: -s, yaw, sm }); } };
    const fS1 = sHead + R_.falls.range(125, 150), fSide = R_.falls.chance(0.5) ? 1 : -1, fS2 = fS1 + R_.falls.range(38, 52);
    const falls = [{ s: fS1, side: fSide }, { s: fS2, side: -fSide }];
    cottagePlan(falls);
    const hang = [{ s: sHead + R_.hang.range(190, 230), side: -D, w: R_.hang.range(30, 42) }, { s: s0 - R_.hang.range(60, 100), side: D, w: R_.hang.range(30, 42) }];
    const bayAt = (s, sd) => { let p = 0; for (const f of falls) if (f.side === sd) p = Math.max(p, 1 - smoothstep(14, 30, Math.abs(s - f.s))); return p; };
    const landAt = (x, z, o) => {
      const s = -z, xa = x - V(s), a = Math.abs(xa), sd = xa >= 0 ? 1 : -1, needles = sd === D;
      const kV = smoothstep(sHead - 20, sHead + 60, s), kI = smoothstep(s0 - 120, s0 - 20, s), kG = smoothstep(s0 + 5, s0 + 60, s), kO = smoothstep(sGate - 40, sGate + 60, s);
      // the water's half width on this hand (the lake's shore, the torrent, a fall's pool; under the ice: the ice's margin), the
      // bank's foot and top, the floor's height, the bank's height (the gorge is 30 m deep where it is whole)
      let gi = s < sHead + 10 ? (sd === O ? nearShore(s) : farShore(s)) : 8;
      // A FALL'S BAY: round each fall the gorge's wall stands back 30 m behind an apron of wet scree that rises one in ten
      // from the torrent, and is a cliff there (its 30 m in a run of 7 m), so the fall comes down a wall of rock whole, its
      // lip 45 m from the axis: one and a half to two of its own height (27 m) from a line flown over the torrent
      const pool = bayAt(s, sd);
      const gb = lerp(gi, hwOf(s, needles), kG), run = lerp(lerp(lerp(14, 22, kV), 7, pool), 2, kG), bay = 30 * pool * (1 - kG);
      gi = gb;
      const go = gb + bay + run, floor = lerp(yR(s), Lv(s) - 1, kG), dg = lerp(1.2, 30, kV) * (1 - 0.75 * kI) * (1 - kG);
      const n1 = noise.n2(x * 0.03, z * 0.03), n2 = noise.n2(x * 0.011 + 3, z * 0.011);
      let y, c, d = -1;
      if (a < gi) { y = floor - Math.min(lerp(8, 1.2, kV), 0.3 + (gi - a) * 0.3); c = C.bed; }
      else if (a < gi + bay) { y = floor + 0.1 * (a - gi) + 0.7 * n1 * smoothstep(0, 6, a - gi); c = mix3(C.gravel, C.bed, 0.45 + 0.3 * n1); }
      else if (a < go) {
        const t = (a - gi - bay) / run;
        // (the bank is rock: creased and stepped by a finer grain of its own, most where it is steepest; plain behind a fall)
        y = floor + 0.1 * bay * (1 - t) + (dg - 0.1 * bay) * smoothstep(0, 1, t) + 0.1 * bay * t + (5 * n1 + 22 * Math.abs(noise.n2(x * 0.085 + 5.5, z * 0.085)) - 7) * t * (1 - t) * kV * (1 - 0.8 * pool);
        c = mix3(mix3(C.gravel, mix3(C.rock, C.rock2, 0.5 + 0.5 * n1), kV), C.scree, kI);
        // (its beds show: bands of warmer stone by height)
        c = mix3(c, C.warm, 0.55 * kV * (1 - kI) * smoothstep(-0.2, 0.6, Math.sin(y * 0.7 + 4 * n1)));
      } else {
        const wb = lerp(lerp(60, 45, kV), needles ? 34 : 6, kG) + (1 - kG) * 30 * (0.5 + 0.5 * noise.n2(s * 0.008 + sd * 17.3, 2.2));
        d = a - go - wb;
        y = floor + dg + 0.14 * Math.min(a - go, wb) + 1.6 * n1 * smoothstep(0, 12, a - go);
        c = mix3(mix3(mix3(C.moss, C.meadow, 0.5 + 0.5 * n2), C.scree, Math.max(kI, kO)), C.gravel, (1 - kV) * (1 - smoothstep(0, 10, a - go)));
        if (d > 0) {
          // the wall: precipices on the rock's hand, long piny slopes on the dome's (so that the dome stands over them)
          const Lw = lerp(lerp(320, needles ? 420 : 130, kV), needles ? 200 : 26, kG), Hw = lerp(200 + 70 * noise.n2(s * 0.004 + sd * 31.7, 5.5), needles ? 150 : 215, kG);
          y += Hw * (1 - Math.exp(-d / Lw)) + 0.1 * d + 40 * noise.fbm2(x * 0.004, z * 0.004, 4) * smoothstep(0, 150, d) + 6 * n1 * smoothstep(0, 30, d)
            + 180 * Math.pow(Math.max(0, noise.n2(x * 0.0016 + 7, z * 0.0016)), 1.5) * smoothstep(250, 700, d);
        }
      }
      let ice = 0, depth = 0;
      // the castle's crag: a spur with a level top, falling steeply round it
      { const r = Math.hypot(x - crag.x, z - crag.z), yc = crag.top - 2.4 * Math.max(0, r - crag.r) - 0.05 * r + 1.2 * n1; if (yc > y) { y = yc; c = mix3(C.rock, C.warm, 0.5 + 0.5 * n1); d = -1; } }
      for (const q of islets) { const r2 = ((x - q.x) * (x - q.x) + (z - q.z) * (z - q.z)) / (q.r * q.r); if (r2 < 1.6) { const yi = q.h * (1 - r2) + 0.5 * n1; if (yi > y) { y = yi; c = mix3(C.rock2, C.warm, 0.4); d = -1; } } }
      // snow above its line (lower toward the ice; everything is white on the frozen ocean's coast), forest below it
      const ys = lerp(lerp(190, 105, smoothstep(sHead, s0, s)), Lv(s) - 30, kO);
      let snow = smoothstep(ys - 25, ys + 45, y + 28 * n2);
      if (d > 0) {
        const steep = needles ? 0 : kV * (1 - smoothstep(60, 260, d));
        const wood = (1 - smoothstep(ys - 120, ys - 40, y)) * smoothstep(-0.5, 0.1, noise.n2(x * 0.02 + 9, z * 0.02)) * (1 - kG) * (1 - 0.6 * steep);
        c = mix3(mix3(mix3(C.rock, C.rock2, 0.5 + 0.5 * n1), C.warm, 0.25 + 0.2 * n2), C.pine, wood * 0.85);
        snow *= 1 - 0.5 * steep;
        for (const g of hang) if (g.side === sd) {
          const m = bump(s - g.s, g.w) * smoothstep(25, 70, d) * (1 - smoothstep(300, 420, d));
          if (m > 0.02) { y += 7 * m; ice = Math.max(ice, smoothstep(0.25, 0.6, m)); depth = Math.max(depth, 2.4 * ice * Math.max(0, Math.sin(d * 0.3 + 3 * n2))); }
        }
      }
      if (ice > 0) { c = mix3(c, C.iceOld, ice); snow = Math.max(snow * (1 - ice), 0.55 * ice * (0.5 + 0.5 * n1)); }
      o.y = y; o.c = mix3(c, C.snow, snow); o.snow = snow; o.ice = ice * (1 - snow); o.depth = depth;
    };
    const _lo = { y: 0, c: C.rock, ice: 0, snow: 0, depth: 0 };
    const landY = (x, z) => { landAt(x, z, _lo); return _lo.y; };
    await ctx.yield();

    // ------------------------------------------------------------ THE SEA OF ICE (the hero part lays it on this place)
    const U = makeLightUniforms();
    const offs = stripOffsets(2.5, 30, 1.15, 1300), floeHalf = offs.find((v) => v >= 100);
    // THE RAFT rides at one station in the open water beyond the ice's edge, 64 m past the edge (18 m beyond the ring) and
    // 36 m to the ship's hand of the line's plan (a standing state: see the cast). The floes lie whole across the lane.
    const RAFT_R = 7.5, sRaft = sEdge + 64, RAFT_OFF = 36;
    // THE SHIP's place aside of the line's plan (r2): her middle 56 m off, so her side (her beam is 9.5 m) is passed at 51 m:
    // one and a half to two of her mainmast's height over the ice (33 m)
    const SHIP_OFF = 56;
    // the ground of THE FIGURE's round (see the cast; r3): THE BROW OF AN ICE RISE on the needles' hand of the furrow. The
    // round's near leg lies 36 m aside of the line's plan and its far leg 48 m, from 190 to 210 m past the brink; the brow
    // reaches from 31 to 53 m aside and 30 m beyond the legs' ends (the round is laid on the plan's own normal, which may
    // carry a place of it 14 m along the way). THE WEDGE between the line and the round is kept low and
    // bare by place: from 135 m short of the brow its reach aside grows from 10 m to 59 m (every sight line from a point of
    // the line within 120 m of him to a place of his round lies 13 m and more inside it); in it the ice keeps the furrow's
    // low law (the parts' waveAt) and no tower, serac, ridge slab or hummock stands
    const FIG_A1 = 36, FIG_A2 = 48, sFigA = s0 + 190, sFigB = s0 + 210;
    const FIG_ZONE = { a0: 32, sA: sFigA - 30, sB: sFigB + 30, b0: FIG_A1 - 5, b1: FIG_A2 + 5, D };
    FIG_ZONE.lim = (s) => (s < FIG_ZONE.sA - 150 || s > FIG_ZONE.sB + 30 ? 0 : lerp(10, FIG_ZONE.b1 + 6, clamp((s - FIG_ZONE.sA + 135) / 135, 0, 1)));
    FIG_ZONE.on = (s) => smoothstep(FIG_ZONE.sA - 150, FIG_ZONE.sA - 135, s) * (1 - smoothstep(FIG_ZONE.sB + 4, FIG_ZONE.sB + 30, s));
    // THE SLEDGES' round (a habit on the world's clock: see the cast): one closed round of the frozen ocean on the ship's
    // hand, short of her, in the foreground of the way in to her: its near leg 45 m aside of the line from 42 m to 84 m past
    // the gate, round on a half circle of 26 m (its top 25 m short of her stern), back by a far leg 97 m aside, round again
    // 16 m past the gate: 247 m in all, every metre of it within 120 m of the line. Three teams ride it a third of the round
    // apart (82 m, 8.2 s), so at every clock one of them is on any third of it. No lead of black water reaches within 22 m of
    // its near leg; no ridge's slab stands within 14 m of it, no hummock within 8 m, no tower within 12 m.
    // (r3) THE ROUND LIES ON LEVEL SWEPT ICE, AND THE WEDGE BETWEEN IT AND THE LINE IS BARE, by place: from 112 m short of
    // the gate to 26 m past the round's top, from the line out to slLim (8 m growing to 112 m where the round begins: every
    // sight line from a point of the line within 120 m of a place of the round lies inside it), the swells keep a sixteenth of
    // their height (swept), no ridge slab, hummock or tower stands (inWedge), and no rift or lead reaches within 12 m of the
    // near leg at any row that can touch the round (cutLimit; the leads' older bound, 22 m, holds at every row)
    const SL_OFF = 45, SL_R = 26, sSlA = sGate + 42, sSlB = sGate + 84, slLeg = sSlB - sSlA, SL_Q = 2 * slLeg + TAU * SL_R, slT = -D * latB + SH * SL_OFF;
    const sledgeAt = (q, o) => {
      const a = ((q % SL_Q) + SL_Q) % SL_Q; let s, lat, th;
      if (a < slLeg) { s = sSlA + a; lat = SL_OFF; th = 0; }
      else if (a < slLeg + Math.PI * SL_R) { th = (a - slLeg) / SL_R; s = sSlB + SL_R * Math.sin(th); lat = SL_OFF + SL_R * (1 - Math.cos(th)); }
      else if (a < 2 * slLeg + Math.PI * SL_R) { th = Math.PI; s = sSlB - (a - slLeg - Math.PI * SL_R); lat = SL_OFF + 2 * SL_R; }
      else { th = Math.PI + (a - 2 * slLeg - Math.PI * SL_R) / SL_R; s = sSlA + SL_R * Math.sin(th); lat = SL_OFF + SL_R * (1 - Math.cos(th)); }
      o.s = s; o.x = route(s) + SH * lat; o.z = -s; o.fx = SH * Math.sin(th); o.fz = -Math.cos(th);
      return o;
    };
    const slLim = (s) => (s < sGate - 112 || s > sSlB + SL_R + 26 ? 0 : lerp(8, SL_OFF + 2 * SL_R + 15, clamp((s - sGate + 112) / (sSlA - SL_R - sGate + 112), 0, 1)));
    const swept = (x, s) => { const sl = slLim(s); if (sl <= 0) return 0; const a = (x - route(s)) * SH; return smoothstep(sGate - 112, sGate - 90, s) * (1 - smoothstep(sSlB + SL_R + 6, sSlB + SL_R + 26, s)) * smoothstep(-14, 0, a) * (1 - smoothstep(sl, sl + 20, a)); };
    const inWedge = (x, s, r) => { const a = x - route(s), fl = FIG_ZONE.lim(s), sl = slLim(s); return (fl > 0 && a * D + r > 0 && a * D - r < fl + 10) || (sl > 0 && a * SH + r > 0 && a * SH - r < sl); };
    // (the bound is taken where the cut's own row, bent as the parts bend it, meets the place: sAt gives the row's metre of
    // the way at a place aside. No rift cuts the ice rise of the figure's round either: at the rows that can touch it a
    // rift ends at the rise's foot, 15 m short of its brow, closing over its last 12 m: under the line it keeps its width)
    const nearAt = (sw, hand, off, sAt) => { let s = sw, n = 0; for (let i = 0; i < 3; i++) { n = (route(s) - V(s)) * hand + off; s = sAt(V(s) + hand * n); } let m = 1e9; for (let q = s - 6; q <= s + 6; q += 3) m = Math.min(m, (route(q) - V(q)) * hand + off); return m; };
    const cutLimit = (sw, sAt) => { const sl = sw > sGate - 22 && sw < sGate + 146, fg = !sl && sw > FIG_ZONE.sA - 40 && sw < FIG_ZONE.sB + 40; if (!sl && !fg) return null; const hand = sl ? SH : D, n = nearAt(sw, hand, sl ? SL_OFF - 12 : FIG_ZONE.b0 - 15, sAt); return hand > 0 ? [-1e9, n, sl ? 40 : 12] : [-n, 1e9, sl ? 40 : 12]; };
    const field = { noise, dens, offs, s0, sGate, sBreak, sEdge, floeHalf, rim: 12, route, axis: V, level: Lv, inside, land: landAt, figZone: FIG_ZONE, cutLimit, swept, leadLimit: slT > 0 ? [-1e9, slT - 22] : [slT + 22, 1e9] };
    const hero = await buildHero(ctx, { field, U, streams: { rifts: R_.rifts, leads: R_.leads, floes: R_.floes, figure: R_.runner } });
    scene.add(hero.object);
    const sea = hero.sea, SEA_Y = hero.floes.sea, FLOE_TOP = hero.floes.top;
    // the drawn ground anywhere: the ice's strip where it is laid, the land elsewhere
    const groundY = (x, z) => (-z >= s0 - 40 ? (-z > sEdge ? SEA_Y : sea.surfAt(x, z)) : landY(x, z));
    await ctx.yield();

    // ------------------------------------------------------------ THE LINE
    // heights by places: level 5.5 m over the lake; 24 m over the torrent up the valley (in the gorge's upper part, the
    // benches at the eye); 14 m more by the snout, to cross its brink 14 m over the ice; down to 8.5 m over the ice's mean
    // surface (its crests reach 3.5 m); 9 m over the frozen ocean and level into the ring
    // (r2) up the valley the line flies OVER the gorge, 36 m over the torrent: 6 m over the benches' lip (the gorge is 30 m
    // deep), so no bank stands beside the eye (the nearest ground is the gorge's rim, 30 m aside and 6 m under). On the ice
    // river it runs in the furrow, 5 m over the ice's mean level there (the furrow's troughs lie 2.4 m under the mean: the
    // eye is 6 to 8 m over them, and the great waves' crests on its hands stand 4.5 to 10.5 m over the mean); 7.5 m over
    // the frozen ocean (the ship's rail stands 5 to 7 m over the ice: a third of her mast is 11 m); 9 m at the ring.
    const yDesign = (s) => {
      const val = lerp(5.5, yR(s) + 36, smoothstep(sHead - 70, sHead + 110, s)) + 2 * smoothstep(s0 - 200, s0 + 10, s);
      const ice = Lv(s) + lerp(14, 5, smoothstep(s0 + 10, s0 + 100, s)) + 2.5 * smoothstep(sGate - 30, sGate + 60, s) + 1.5 * smoothstep(sBreak - 20, sBreak + 50, s);
      return lerp(val, ice, smoothstep(s0 - 40, s0 + 20, s));
    };
    const nRT = Math.round(sEnd / 10), RT = [];
    for (let i = 0; i <= nRT; i++) { const s = sEnd * i / nRT; RT.push({ s, x: route(s), z: -s }); }
    // CLEARANCE of the ground, on this seed's own land and ice at every station (and 3.3 m either way along, 6 m either hand):
    // the line keeps 4.5 m over the highest of it
    const under = [];
    for (let i = 0; i <= nRT; i++) {
      const q = RT[i]; let h = -1e9;
      for (const ds of [-3.3, 0, 3.3]) for (const dx of [-6, 0, 6]) h = Math.max(h, groundY(route(q.s + ds) + dx, -(q.s + ds)));
      under.push(h + 4.5);
      if (i % 12 === 11) await ctx.yield();
    }
    let ys = RT.map((q, i) => Math.max(yDesign(q.s), under[i]));
    for (let pass = 0; pass < 3; pass++) ys = ys.map((y, i) => (i === 0 || i === nRT ? y : 0.25 * ys[i - 1] + 0.5 * y + 0.25 * ys[i + 1]));
    ys = ys.map((y, i) => Math.max(y, under[i]));
    const path = makePath(RT.map((q, i) => [q.x, ys[i], q.z]), { samples: 640 }), L = path.length;
    await ctx.yield();
    // plan metres to metres flown and back (the line is a little longer than its plan where it bends and climbs)
    const cum = [0]; for (let i = 1; i <= nRT; i++) cum.push(cum[i - 1] + Math.hypot(RT[i].x - RT[i - 1].x, ys[i] - ys[i - 1], RT[i].z - RT[i - 1].z));
    const mOf = (s) => { const f = clamp(s / sEnd, 0, 1) * nRT, i = Math.min(nRT - 1, Math.floor(f)); return L * lerp(cum[i], cum[i + 1], f - i) / cum[nRT]; };
    const sOf = (m) => { const c = clamp(m / L, 0, 1) * cum[nRT]; let lo = 0, hi = nRT; while (hi - lo > 1) { const k = (lo + hi) >> 1; if (cum[k] <= c) lo = k; else hi = k; } return sEnd * (lo + (c - cum[lo]) / (cum[hi] - cum[lo])) / nRT; };
    const lineY = (s) => { const f = clamp(s / sEnd, 0, 1) * nRT, i = Math.min(nRT - 1, Math.floor(f)); return lerp(ys[i], ys[i + 1], f - i); };
    const mHead = mOf(sHead), mSnout = mOf(s0), mGate = mOf(sGate), mShip = mOf(sShip), mBreak = mOf(sBreak), mEdge = mOf(sEdge), mOak = mOf(sOak);
    const endP = new THREE.Vector3(route(sEnd), ys[nRT], -sEnd);
    // how far a place (x, s) with a reach r and a top yTop stands off the line: the least gap over the line's stations within
    // 40 m of it along the way, every 2 m (a thing lower than the line by more than its reach is measured in height too)
    const lineGap = (x, s, r, yTop) => {
      let g = 1e9;
      for (let q = s - 40; q <= s + 40; q += 2) { const dx = x - route(q), dz = s - q, dy = Math.max(0, lineY(clamp(q, 0, sEnd)) - yTop); g = Math.min(g, Math.hypot(Math.max(0, Math.hypot(dx, dz) - r), dy)); }
      return g;
    };
    measure.gaps = [];
    // (a thing more than 80 m aside of the line at its own plan metre needs no walk along the line: the line bends no faster)
    const stands = (kind, x, s, r, yTop, need) => { const far = Math.abs(x - route(s)) - r; if (far > 80) return true; const g = lineGap(x, s, r, yTop); if (g >= need) measure.gaps.push([kind, g]); return g >= need; };

    // ------------------------------------------------------------ THE VALLEY'S STRIP: lake bed, shores, gorge and walls
    // (rows 8 m apart behind the entry, 3 m from there to the row 40 m short of the snout, where the ice's strip takes over)
    const landMat = sea.material, vrows = [];
    for (let s = sBack; s < -80; s += 8) vrows.push(s);
    for (let s = -80; s < s0 - 41.5; s += 3) vrows.push(s);
    vrows.push(s0 - 40);
    const valley = new THREE.Mesh(await stripMesh(ctx, vrows.length, offs.length, (j, i, o) => { const s = vrows[j], x = route(s) + offs[i]; o.x = x; o.z = -s; landAt(x, -s, o); }), landMat);
    valley.name = 'valley'; scene.add(valley);
    await ctx.yield();

    // ------------------------------------------------------------ THE MOUNTAINS: the dome, its needles, the perpendicular rock
    // (a thing that fails its clearance is not stood: it is dealt all the same, into VOID, so that no draw hangs on a test)
    const MA = makeAcc(), VOID = makeAcc(), pk = R_.peaks;
    // the dome: summit 380 m over the ice, 470 m across its foot, on the needles' hand by the gate; its foot comes down to
    // the ice's margin (its middle 410 to 450 m off the axis: its flank fills the needles' side of the ice river's sky)
    const dome = { x: V(sGate) + D * pk.range(410, 450), s: sGate - pk.range(0, 80), R: 235, H: 410, y0: LvO - 30 };
    peakInto(MA, pk, noise, { kind: 'dome', x: dome.x, z: -dome.s, y0: dome.y0, R: dome.R, H: dome.H, rings: 26, seg: 52, snowLine: 0.3 });
    await ctx.yield();
    // needles along the ice's margin on the dome's hand (120 to 300 m high, their feet 40 m and more behind the margin), and
    // three before the dome itself
    const needles = [];
    for (let i = 0; i < 8; i++) {
      const s = lerp(s0 + 20, sGate + 70, (i + pk.range(0.1, 0.9)) / 8), H = pk.range(120, 300), R = H * pk.range(0.26, 0.36), off = hwOf(s, true) + R * 0.5 + pk.range(40, 150);
      needles.push({ x: V(s) + D * off, s, H, R, y0: Lv(s) + 6 });
    }
    for (let i = 0; i < 3; i++) { const a = pk.range(-0.5, 0.5) + (i - 1) * 0.8, H = pk.range(150, 260), R = H * pk.range(0.26, 0.34); const s = dome.s + Math.sin(a) * (dome.R + R * 0.4), xa = Math.max(Math.abs(dome.x - D * Math.cos(a) * (dome.R + R * 0.4) - V(s)), hwOf(s, true) + R * 0.5 + 30), x = V(s) + D * xa;
      // (r2: each stands on the land behind the ice's margin, its foot on that ground: none over the ice)
      needles.push({ x, s, H, R, y0: landY(x, -s) + 2 }); }
    for (const q of needles) { peakInto(MA, pk, noise, { kind: 'needle', x: q.x, z: -q.s, y0: q.y0, R: q.R, H: q.H, rings: 12, seg: 18 }); await ctx.yield(); }
    await ctx.yield();
    // the rock: a sheer face 190 m high along the ice's margin on the other hand, 165 m off the axis, turning out with the
    // margin at the gate (its end is the gate's jamb)
    {
      const pts = [];
      for (let s = s0 - 66; s < sGate - 40; s += 12) pts.push([V(s) - D * hwOf(s, false), -s, Lv(s) - 3]);
      for (let s = sGate - 40; s <= sGate + 2; s += 2) pts.push([V(s) - D * hwOf(s, false), -s, Lv(s) - 3]);
      // (the face looks to the left of the line it is given: the ice must lie on that hand)
      if (D > 0) pts.reverse();
      const hs = pts.map(() => R_.rock.range(170, 215));
      wallInto(MA, R_.rock, noise, pts, { H: (i) => hs[i], depth: 60, levels: 11 });
    }
    await ctx.yield();
    // seracs on the snout's brow: broken towers of old ice 4.5 to 11 m high, where the tongue breaks over its brink (r2: each
    // a six-sided, stepped, leaning tower with a snow cap, bedded in drift, as the ice towers beyond: no plain block)
    for (let i = 0; i < 26; i++) {
      const sr = R_.seracs, xa = sr.range(-150, 150), s = s0 + 50 * (xa / 165) * (xa / 165) + sr.range(13, 52), x = V(s) + xa;
      const hx = sr.range(2, 4.5), hy = sr.range(2, 5), hz = sr.range(2, 4.5), yaw = sr.range(0, TAU), tx = sr.range(-0.25, 0.25), tz = sr.range(-0.25, 0.25), y = sea.surfAt(x, -s);
      const sR = 0.95 * Math.min(hx, hz), sH = 2.25 * hy, sLean = 0.6 * tx * sH;
      towerInto(stands('serac', x, s, sR * 1.25 + Math.abs(sLean), y + sH, 5) && !inWedge(x, s, sR * 1.8) ? MA : VOID, sr, x, y - 1.2, -s, sR, sH, Math.abs(sLean), yaw + (sLean < 0 ? Math.PI : 0));
      if (i % 6 === 5) await ctx.yield();
    }
    await ctx.yield();
    // ICE TOWERS (r2): seracs and leaning blocks 12 to 40 m high in clusters between the line and the walls, from 70 m past
    // the snout's brink to 300 m past the gate. A cluster stands every 75 m of the way (62 to 88 by its own draw), on
    // alternate hands (the first hand by a draw), its tallest tower H high and its middle 1.5 to 2 H aside of the line's
    // plan (so the nearest is passed at one and a half to two of its own heights: a tower of 14 m at 21 to 28 m, one of
    // 40 m at 60 to 80 m); 4 to 7 towers a cluster, the others 0.45 to 0.9 H, each 1.1 to 2.6 radii from the next (no tower
    // stands in another), none in a rift or a lead, each bedded in its own drift. With 75 m between clusters and the far
    // ones 40 m high, one cluster at least stands within 150 m ahead at every place. Clearance: its own reach plus 6 m.
    const towers = [];
    {
      const tw = R_.towers; let hand = tw.chance(0.5) ? 1 : -1, sT = s0 + 70 + tw.range(0, 20), k = 0;
      while (sT < sGate + 300) {
        const H = k % 3 === 1 ? tw.range(26, 40) : tw.range(12, 24), off = H * tw.range(1.5, 2), cnt = tw.int(4, 7), ocean = sT > sGate + 40, la0 = tw.range(0, TAU);
        const cx = route(sT) + hand * off; let px = 0, ps = 0, pr = 0;
        for (let i = 0; i < cnt; i++) {
          const h = i === 0 ? H : H * tw.range(0.45, 0.9), r = h * tw.range(0.2, 0.3), a = la0 + i * 2.4 + tw.range(-0.4, 0.4), gap = (pr + r) * tw.range(1.1, 1.6), lean = h * tw.range(0.04, 0.2), la = tw.range(0, TAU);
          // (the first at the cluster's middle; each next beside the last, never nearer the line than the first)
          let x = i === 0 ? cx : px + Math.cos(a) * gap, s = i === 0 ? sT : ps + Math.sin(a) * gap;
          if ((x - route(s)) * hand < off) x = route(s) + hand * (off + Math.abs(x - route(s) - hand * off));
          // (on the needles' hand along the figure's ground a tower stands beyond his round: at middle distance there)
          // (r3: and beyond the whole wedge between the line and his round)
          { const fl = FIG_ZONE.lim(s); if (hand === D && fl > 0 && (x - route(s)) * D < fl + 16 + 2 * r) x = route(s) + D * (fl + 16 + 2 * r + 0.5 * Math.abs((x - route(s)) * D - FIG_ZONE.a0)); }
          // (on the ship's hand, from 60 m short of the gate to 50 m past her, a tower stands beyond her far side: none
          // between the line and the ship, so that she is seen whole all the way in)
          // (r3: and beyond the sledges' wedge)
          { const sl = Math.max(s > sGate - 60 && s < sShip + 50 ? SHIP_OFF + 50 : 0, slLim(s) > 0 ? slLim(s) + 8 + r : 0); if (hand === SH && sl > 0 && (x - route(s)) * SH < sl + r) x = route(s) + SH * (sl + r + 0.5 * Math.abs((x - route(s)) * SH)); }
          const y = sea.surfAt(x, -s), sw = sea.swOf(x, s), wet = sea.cutDepth(x, s, sw) > 0.01 || sea.cutDepth(x + r, s + r, sea.swOf(x + r, s + r)) > 0.01 || sea.cutDepth(x - r, s - r, sea.swOf(x - r, s - r)) > 0.01;
          let clear = true; for (const q of towers) if (Math.hypot(x - q.x, s - q.s) < (r + q.r) * 1.05) clear = false;
          const far = Math.abs(Math.hypot((x - route(s)) * SH - SL_OFF - SL_R, s - clamp(s, sSlA, sSlB)) - SL_R) > r + 12 && Math.hypot(x - route(sShip) - SH * SHIP_OFF, s - sShip) > 40 + r;
          const ok = !wet && clear && far && !inWedge(x, s, r * 1.8) && inside(x, s) > r + 8 && s < sBreak - r - 6 && stands('tower', x, s, r * 1.25 + lean, y + h, 6);
          towerInto(ok ? MA : VOID, tw, x, y - 0.3, -s, r, h, lean, la);
          if (ok) towers.push({ x, s, y, r, h });
          px = x; ps = s; pr = r;
        }
        sT += tw.range(62, 88); hand = -hand; k++;
        await ctx.yield();
      }
    }
    const towerFree = (x, s, r) => { for (const q of towers) if (Math.hypot(x - q.x, s - q.s) < q.r * 1.8 + r) return false; return true; };
    await ctx.yield();
    // pressure ridges of the frozen ocean (r2: 3 to 9 m high): rows of thrown-up, tilted slabs lying mostly across the way at
    // near and middle distance; none within 12 m of the line (where a ridge meets the line its slabs are not stood: the pass
    // we fly through)
    const ridges = [];
    for (let i = 0, n = Math.round(10 * dens); i < n; i++) {
      const rr = R_.ridges, sM = lerp(sGate + 30, sBreak - 16, (i + rr.range(0.15, 0.85)) / n), uM = rr.range(-150, 150), ang = rr.range(-0.6, 0.6), len = rr.range(60, 150), bend = rr.range(-0.004, 0.004);
      const slabs = Math.round(len / 5.4);
      for (let k = 0; k < slabs; k++) {
        const t = (k + 0.5) / slabs - 0.5, w = t * len, s = sM + Math.sin(ang) * w + bend * w * w, x = route(s) + uM + Math.cos(ang) * w + rr.range(-1.2, 1.2);
        const hx = rr.range(2, 4.2), hy = rr.range(1.5, 4.2) * (1 - 1.4 * t * t), hz = rr.range(1, 2.4), y = sea.surfAt(x, -s);
        const ok = stands('ridge', x, s, Math.hypot(hx, hz) * 1.12, y + 2.3 * hy, 12) && !inWedge(x, s, Math.hypot(hx, hz) * 1.2) && towerFree(x, s, Math.max(hx, hz)) && inside(x, s) > 20 && Math.abs(Math.hypot((x - route(s)) * SH - SL_OFF - SL_R, s - clamp(s, sSlA, sSlB)) - SL_R) > 14 && Math.hypot(x - route(sShip) - SH * SHIP_OFF, s - sShip) > 50;
        blockInto(ok ? MA : VOID, rr, x, y, -s, hx, hy, hz, ang + rr.range(-0.5, 0.5), rr.range(-0.5, 0.5), rr.range(-0.5, 0.5), 0.5);
        if (ok && k === (slabs >> 1)) ridges.push({ x, s, y });
      }
      await ctx.yield();
    }
    await ctx.yield();
    // hummocks of the frozen ocean: knots of small broken ice (blocks half a metre to two metres high) thrown up all over the
    // plain from the gate to the floes, under the line too (the line is 9 m over the ice: they keep 5 m of it and more);
    // none in a lead, none within 30 m of the ship's middle across her beam or on the sledge's way
    for (let i = 0, n = Math.round(34 * dens); i < n; i++) {
      const hr2 = R_.hummocks, sM = hr2.range(sGate - 10, sBreak - 12), xM = route(sM) + hr2.range(-120, 120), cnt = hr2.int(6, 13);
      for (let k = 0; k < cnt; k++) {
        const a = hr2.range(0, TAU), rd = 9 * Math.sqrt(hr2()), x = xM + Math.cos(a) * rd, s = sM + Math.sin(a) * rd * 0.6, hx = hr2.range(0.5, 1.8), hy = hr2.range(0.25, 0.95), hz = hr2.range(0.5, 1.6), yaw = hr2.range(0, TAU), tx = hr2.range(-0.4, 0.4), tz = hr2.range(-0.4, 0.4);
        const y = sea.surfAt(x, -s), wet = sea.cutDepth(x, s, sea.swOf(x, s)) > 0.01 || sea.cutDepth(x + 2, s + 2, sea.swOf(x + 2, s + 2)) > 0.01 || sea.cutDepth(x - 2, s - 2, sea.swOf(x - 2, s - 2)) > 0.01;
        const ok = !wet && !inWedge(x, s, Math.hypot(hx, hz) * 1.2) && towerFree(x, s, Math.max(hx, hz)) && inside(x, s) > 20 && stands('hummock', x, s, Math.hypot(hx, hz) * 1.12, y + 2.3 * hy, 5) && Math.abs(Math.hypot((x - route(s)) * SH - SL_OFF - SL_R, s - clamp(s, sSlA, sSlB)) - SL_R) > 8 && Math.hypot(x - route(sShip) - SH * SHIP_OFF, s - sShip) > 32;
        blockInto(ok ? MA : VOID, hr2, x, y, -s, hx, hy, hz, yaw, tx, tz, 0.4);
      }
      if (i % 4 === 3) await ctx.yield();
    }
    await ctx.yield();
    // bergs in the open water beyond the edge (far, either hand of the ring)
    for (let i = 0; i < 9; i++) {
      const br = R_.bergs, sd = i % 2 ? 1 : -1, x = endP.x + sd * br.range(70, 520), s = sEnd + br.range(-10, 760), hx = br.range(7, 26), hy = br.range(3, 12), hz = br.range(7, 22);
      // (none within 24 m of the raft's station, each by its own half width)
      const clear = Math.hypot(x - (route(sRaft) + SH * RAFT_OFF), s - sRaft) > Math.max(hx, hz) * 1.3 + RAFT_R + 24;
      blockInto(clear ? MA : VOID, br, x, SEA_Y - 0.5, -s, hx, hy, hz, br.range(0, TAU), br.range(-0.12, 0.12), br.range(-0.12, 0.12), 3);
    }
    const mountains = new THREE.Mesh(await MA.buildBy(ctx), landMat); mountains.name = 'mountains'; scene.add(mountains);
    await ctx.yield();
    // THE ARCH of blue ice on the last ice at the open water's edge: the ring in it (the ring's middle 9 m over the ice's level,
    // the arch's inner side and its foot 8.5 m and more from it all round: the ring is 7 m in radius)
    const AA = makeAcc(), archM = archInto(AA, R_.arch, noise, { ax: 15.5, ay: 18, yc: 4 });
    const arch = new THREE.Mesh(await AA.buildBy(ctx), landMat); arch.name = 'arch'; arch.position.set(endP.x, endP.y - 9, endP.z); scene.add(arch);
    // THE RAFT: one plate of ice by itself, at its station in the open water (the cast, below)
    const RA = makeAcc(); raftInto(RA, R_.raft, RAFT_R);
    // (a hummock of thrown-up ice on its far side; the raft is bare: no one stands on it)
    for (let k = 0; k < 4; k++) { const rr = R_.raft, a = (k - 1.5) * 0.5; blockInto(RA, rr, SH * 1.6 + Math.sin(a) * 4.4 * SH, 0.2, -3.2 - Math.cos(a) * 1.2, rr.range(1.1, 1.9), rr.range(1.5, 2.1), rr.range(0.9, 1.5), rr.range(0, TAU), rr.range(-0.3, 0.3), rr.range(-0.3, 0.3), 0.3); }
    const raft = new THREE.Mesh(await RA.buildBy(ctx), landMat); raft.name = 'raft'; raft.frustumCulled = false; scene.add(raft);
    await ctx.yield();

    // ------------------------------------------------------------ WATERS: the lake, the torrent, the falls, the black sea
    // the lake's sheet lies on the valley strip's own corners (so its shore is the drawn shore): depth is the land's own
    const lakeMat = makeWaterMaterial(U, { deep: '#0b2233', band: 0.1, ripple: 1, foam: 1, fire: 1 });
    {
      const j1 = vrows.findIndex((s) => s > sHead + 14), cols = []; offs.forEach((v, i) => { if (Math.abs(v) < 420) cols.push(i); });
      const pos = [], sh = [], idx = [], nc = cols.length;
      for (let j = 0; j < j1; j++) { for (const i of cols) { const s = vrows[j], x = route(s) + offs[i]; pos.push(x, 0, -s); sh.push(-landY(x, -s)); } if (j % 8 === 7) await ctx.yield(); }
      for (let j = 0; j < j1 - 1; j++) for (let i = 0; i < nc - 1; i++) { const a = j * nc + i, b = a + 1, c = a + nc, d = c + 1; if (Math.max(sh[a], sh[b], sh[c], sh[d]) > -0.5) idx.push(a, b, c, b, d, c); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aShore', new THREE.Float32BufferAttribute(sh, 1)); g.setIndex(idx); g.computeBoundingSphere();
      const lake = new THREE.Mesh(g, lakeMat); lake.name = 'lake'; lake.renderOrder = 1; scene.add(lake);
      measure.lakeTris = idx.length / 3;
    }
    // the black sea under the floes and beyond the edge, out to the far plane
    const seaMat = makeWaterMaterial(U, { deep: '#04090f', band: 0, ripple: 1.2, foam: 0, fire: 0 });
    {
      const g = new THREE.BufferGeometry(), x0 = endP.x - 2600, x1 = endP.x + 2600, z0 = -(sBreak - 4), z1 = -(sEnd + 3600);
      g.setAttribute('position', new THREE.Float32BufferAttribute([x0, SEA_Y, z0, x1, SEA_Y, z0, x0, SEA_Y, z1, x1, SEA_Y, z1], 3)); g.setAttribute('aShore', new THREE.Float32BufferAttribute([40, 40, 40, 40], 1)); g.setIndex([0, 1, 2, 1, 3, 2]); g.computeBoundingSphere();
      const m = new THREE.Mesh(g, seaMat); m.name = 'sea'; m.renderOrder = 1; scene.add(m);
    }
    await ctx.yield();

    // ------------------------------------------------------------ THE HOURS: four, each standing over its own country
    // LIGHT BY EACH THING'S OWN PLACE (never by the eye's, never by the metres flown): hour 0 stands over the lake, hour 1
    // over the valley, hour 2 over the ice river, hour 3 over the frozen ocean, joined over three bands of plan metres. The
    // ground, the ice, the waters, the cast and the sky's own dome all take the hour of the place they lie at (the part's
    // PLACE law), so the storm stands over the lake for the whole visit and is seen from the valley, and the dusk stands
    // over the ocean and is seen from the ice. Linear colours; sun = the light a facing surface takes.
    const dirOf = (el, az) => new THREE.Vector3(Math.sin(az * DEG) * Math.cos(el * DEG), Math.sin(el * DEG), -Math.cos(az * DEG) * Math.cos(el * DEG));
    const back = 180 + D * 52;
    const HOURS = {
      // the storm by night: lit by its own glow (a blue fill) so that every phase of the clock reads; its flashes are below
      stormN: { sunDir: dirOf(30, D * 8), sun: [0.26, 0.35, 0.6], sky: [0.18, 0.3, 0.76], gnd: [0.09, 0.155, 0.37], fog: [0.12, 0.19, 0.36], zen: [0.03, 0.05, 0.11], fogDen: 0.0012,
        cloudLit: [0.34, 0.46, 0.74], cloudShade: [0.07, 0.105, 0.21], cov: 1.25 },
      stormD: { sunDir: dirOf(30, D * 8), sun: [0.24, 0.28, 0.33], sky: [0.19, 0.24, 0.33], gnd: [0.11, 0.14, 0.16], fog: [0.24, 0.32, 0.36], zen: [0.03, 0.04, 0.055], fogDen: 0.0012,
        cloudLit: [0.4, 0.48, 0.56], cloudShade: [0.09, 0.12, 0.155], cov: 1.25 },
      // the valley: a low sun behind on the rock's hand; the gorge lies in blue shade under the band of heights `shade`, which
      // is metres over the torrent at each place (the walls' shadow keeps the gorge's own depth the whole valley long)
      dawn: { sunDir: dirOf(8, back), sun: [0.891, 0.407, 0.241], sky: [0.22, 0.31, 0.68], gnd: [0.449, 0.252, 0.247], fog: [0.862, 0.464, 0.362], zen: [0.012, 0.042, 0.195], fogDen: 0.0007,
        cloudLit: [1, 0.61, 0.503], cloudShade: [0.127, 0.125, 0.27], cov: 0.36, shade: [8, 36] },
      dayB: { sunDir: dirOf(26, back), sun: [1.019, 0.904, 0.752], sky: [0.227, 0.331, 0.573], gnd: [0.163, 0.22, 0.287], fog: [0.328, 0.517, 0.772], zen: [0.005, 0.058, 0.418], fogDen: 0.0006,
        cloudLit: [0.922, 0.888, 0.823], cloudShade: [0.205, 0.27, 0.413], cov: 0.42, shade: [0, 22] },
      goldB: { sunDir: dirOf(9, back), sun: [0.923, 0.498, 0.193], sky: [0.166, 0.218, 0.37], gnd: [0.307, 0.187, 0.086], fog: [0.873, 0.451, 0.184], zen: [0.01, 0.063, 0.323], fogDen: 0.0007,
        cloudLit: [1, 0.694, 0.392], cloudShade: [0.153, 0.127, 0.279], cov: 0.34, shade: [8, 36] },
      // the ice river: a high sun on the needles' hand, 38 degrees up; the one low sun of the world is the dusk's
      day: { sunDir: dirOf(38, D * 24), sun: [1.019, 0.904, 0.752], sky: [0.17, 0.248, 0.43], gnd: [0.122, 0.165, 0.215], fog: [0.328, 0.517, 0.772], zen: [0.005, 0.058, 0.418], fogDen: 0.0004,
        cloudLit: [0.922, 0.888, 0.823], cloudShade: [0.205, 0.27, 0.413], cov: 0.3, cloudShadow: 0.5 },
      goldC: { sunDir: dirOf(12, D * 24), sun: [0.923, 0.498, 0.193], sky: [0.166, 0.218, 0.37], gnd: [0.307, 0.187, 0.086], fog: [0.873, 0.451, 0.184], zen: [0.01, 0.063, 0.323], fogDen: 0.00045,
        cloudLit: [1, 0.694, 0.392], cloudShade: [0.153, 0.127, 0.279], cov: 0.3 },
      // a night of moon over valley and ice
      nightM: { sunDir: dirOf(28, D * 48), sun: [0.56, 0.68, 1.02], sky: [0.14, 0.24, 0.6], gnd: [0.06, 0.1, 0.24], fog: [0.035, 0.08, 0.2], zen: [0.004, 0.008, 0.03], fogDen: 0.0006,
        cloudLit: [0.4, 0.5, 0.8], cloudShade: [0.04, 0.07, 0.2], cov: 0.26, stars: 1, disc: [0.75, 0.85, 1], discSize: 2.2, scat: 0.05 },
      // the frozen ocean: a long polar dusk, a low red sun 5 degrees up on the needles' hand (its disc stands where its light
      // comes from), stars, and the lights of the north
      polar: { sunDir: dirOf(5, D * 24), sun: [0.509, 0.207, 0.121], sky: [0.06, 0.182, 0.284], gnd: [0.033, 0.063, 0.112], fog: [0.154, 0.091, 0.138], zen: [0.003, 0.009, 0.034], fogDen: 0.0005,
        cloudLit: [0.3, 0.12, 0.12], cloudShade: [0.012, 0.03, 0.06], cov: 0.22, stars: 0.8, aurora: 1, disc: [1, 0.254, 0.102], discSize: 1.7, scat: 0.55 },
    };
    const SET = { dawn: ['stormN', 'dawn', 'day', 'polar'], day: ['stormD', 'dayB', 'day', 'polar'], golden: ['stormN', 'goldB', 'goldC', 'polar'], night: ['stormN', 'nightM', 'nightM', 'polar'] }[hour] || ['stormN', 'dawn', 'day', 'polar'];
    // the three joins, in plan metres: at the lake's head (by night the storm stands further up the valley), over the snout,
    // through the gate
    const JOIN = [night ? [sHead + 40, sHead + 190] : [sHead - 30, sHead + 110], [s0 - 40, s0 + 120], [sGate - 60, sGate + 140]];
    U.uJA.value.set(JOIN[0][0], JOIN[1][0], JOIN[2][0]); U.uJB.value.set(JOIN[0][1], JOIN[1][1], JOIN[2][1]);
    const skyDome = makeSkyDome(U, { vault: 40, rag: 45 }); scene.add(skyDome.mesh);
    SET.forEach((name, i) => { setHour(U, i, HOURS[name]); skyDome.setSky(i, HOURS[name]); });
    const H1 = HOURS[SET[1]], H2 = HOURS[SET[2]];
    if (H1.shade) { U.uShadeY.value.set(H1.shade[0], H1.shade[1]); U.uShadeOn.value = 1; U.uFloorK.value.set(sHead, 320, 60, 1.15); }
    U.uCloudAmt.value = H2.cloudShadow || 0;
    // how much of hour 0 (the storm) and of hour 3 (the dusk) stands at a plan metre
    const stormAt = (s) => 1 - smoothstep(JOIN[0][0], JOIN[0][1], s), duskAt = (s) => smoothstep(JOIN[2][0], JOIN[2][1], s);
    // WHAT THE KIT LIGHTS (the pines, the torrent and its falls, the eagles and chamois: all of the valley, and the lake's
    // pines, which are darkened each by its own place): one standing light, the valley's own hour with its floor in shade.
    // A kit sky is made for that hour only to hand the kit's water and rig their light; it is never drawn.
    const VSKY = { dawn: { preset: 'dawn', sunElevation: 7, sunAzimuth: back, lightColor: '#ffb48e', lightIntensity: 2.8, ambientColor: '#7f95d8', ambientIntensity: 2.4 }, dayB: { preset: 'day', sunElevation: 26, sunAzimuth: back },
      goldB: { preset: 'goldenHour', sunElevation: 9, sunAzimuth: back }, nightM: { preset: 'night', bodyOverrides: { 0: { elevation: 28, azimuth: D * 48, size: 2.4 } }, lightIntensity: 1.6, ambientIntensity: 2.7 } };
    const vsky = makeSky({ rng: R_.sky, ...VSKY[SET[1]] }), L_ = Water.waterLight(vsky);
    const rig = makeLightRig(vsky, { bounce: 0.5, flash: 0 }); scene.add(rig.object);
    const KIT_SUN = H1.shade ? 0.2 : 1;
    // (the torrent and its falls lie on that shaded floor: their sun is the floor's, and under a low sun they mirror the
    // gorge's own shaded walls and take the blue of the sky overhead, not the lit horizon they cannot see)
    L_.sunColor.multiplyScalar(KIT_SUN);
    const lowSun = SET[1] === 'dawn' || SET[1] === 'goldB';
    const LT = lowSun ? Water.waterLight(L_, { horizon: new THREE.Color(0.3, 0.36, 0.56), mid: new THREE.Color(0.2, 0.25, 0.5), ambient: new THREE.Color(0.3, 0.35, 0.52) }) : L_;
    scene.fog = new THREE.FogExp2(new THREE.Color(H1.fog[0], H1.fog[1], H1.fog[2]), H1.fogDen);
    await ctx.yield();
    // THE STORM'S FLASHES, on the world's clock by a seeded schedule, for the whole visit and whether anyone is by the lake or
    // not: slots of 0.52 s, four in ten struck; a flash rises in 0.1 s and dies in 0.35 s with a flicker; each falls in one
    // of five quarters of the storm's own sky (its bolt is drawn there); none on the stump, which needs no bolt to burn
    const SLOT = 0.52, stormSeed = R_.storm.range(0, 100), hash1 = (k, j) => { const v = Math.sin(k * 127.1 + j * 311.7 + stormSeed) * 43758.5453; return v - Math.floor(v); };
    const flash = { f: 0, q: 0 };
    const flashAt = (time) => {
      const k = Math.floor(time / SLOT); let f = 0, q = 0;
      for (let j = 0; j < 2; j++) {
        const kk = k - j; if (hash1(kk, 0) > 0.4) continue;
        const t = time - kk * SLOT - 0.07 * hash1(kk, 1); if (t <= 0) continue;
        const v = (t < 0.1 ? t / 0.1 : Math.exp(-(t - 0.1) * 9) * (0.6 + 0.4 * Math.sin(t * 55) ** 2)) * (0.6 + 0.4 * hash1(kk, 2));
        if (v > f) { f = v; q = Math.min(4, Math.floor(hash1(kk, 3) * 5)); }
      }
      flash.f = f; flash.q = q; return flash;
    };
    const updaters = [], disposers = [], time = { value: 0 };
    // THE BLASTED STUMP of an old oak on its point of the shore (a standing state: it burns from the first frame to the last)
    const propMat = makePropMaterial(U);
    const oakP = new THREE.Vector3(V(sOak) + O * 24, 0, -sOak); oakP.y = landY(oakP.x, oakP.z) - 0.15;
    const stumpB = makeProp(), stumpM = stumpInto(stumpB, R_.oak);
    const stump = new THREE.Mesh(stumpB.build(), propMat); stump.position.copy(oakP); stump.rotation.y = R_.oak.range(0, TAU); stump.name = 'stump'; scene.add(stump);
    await ctx.yield();
    // the bolts: one mesh, each bolt shown by its own number while its flash is on (unlit, added): the five quarters of the
    // sky's storm
    const quarters = [];
    {
      const br = R_.bolts, P = [], W = [];
      const add = (g, q) => { const p = g.getAttribute('position'); for (let i = 0; i < p.count; i++) { P.push(p.getX(i), p.getY(i), p.getZ(i)); W.push(q); } g.dispose(); };
      for (let q = 0; q < 5; q++) {
        // (all within the storm's own country: three on the shoulders of the lake's head, either hand, two on the walls beside the lake)
        // (r2: none on the ruin's hand of the valley's mouth: a head quarter that falls on that hand is stood on the lake's
        // own wall instead, 140 m back and 320 m and more aside, so no bolt is drawn on or before the ruin's crag)
        const head = q < 3, sd = q % 2 ? 1 : -1, onRuin = head && sd === -D, sq = (head ? sHead + br.range(-50, 40) : br.range(50, sHead - 40)) - (onRuin ? 140 : 0), x = V(sq) + sd * (head ? (onRuin ? 320 : 95) + q * 45 + br.range(0, 40) : br.range(300, 480)), z = -sq;
        const top = [x + br.range(-60, 60), 470, z + br.range(-60, 60)], foot = [x, Math.max(0, landY(x, z)), z];
        add(boltGeometry(br, top, foot, head ? 2.4 : 3.6, 3), q);
        quarters.push(new THREE.Vector3(x, 240, z));
        await ctx.yield();
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aWhich', new THREE.Float32BufferAttribute(W, 1)); g.computeBoundingSphere();
      const mat = new THREE.ShaderMaterial({ uniforms: { uWhich: { value: 0 }, uAmt: { value: 0 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
        vertexShader: 'attribute float aWhich; uniform float uWhich, uAmt; varying float vA; void main(){ vA = uAmt*(1. - step(.5, abs(aWhich - uWhich))); gl_Position = projectionMatrix*modelViewMatrix*vec4(position, 1.); }',
        fragmentShader: 'varying float vA; void main(){ gl_FragColor = vec4(vec3(.82, .9, 1.)*3.2*vA, vA); }' });
      const m = new THREE.Mesh(g, mat); m.name = 'bolts'; m.renderOrder = 2; m.frustumCulled = false; scene.add(m);
      measure.boltU = mat.uniforms;
    }
    await ctx.yield();
    // its fire: flames, embers, a column of smoke blown along the lake and away from the line, and the fire's own light on
    // the ground and the wood round it (the part's point light), flickering on the world's clock
    const fireP = new THREE.Vector3(oakP.x, oakP.y + 3.2, oakP.z);
    // (r2) A BEACON: real flame from the split of the trunk, 9 m high (the stump is 2.5 m wide: three to four of its
    // widths), 3.4 m wide at its foot, climbing and flickering on the world's clock; one soft glow at its foot; sparks and
    // embers rising; grey soft smoke above (no red in it); its light reaches 80 m over the shore, the rocks of the point,
    // the nearest pines, and lies as a broken warm path on the lake toward wherever the eye is (the water's own mirror)
    U.uFire.value.set(fireP.x, fireP.y + 1.6, fireP.z, 80);
    const flame = makeFlame(U, { width: 3.4, height: 9, sheets: 4, gain: 1.6 }); flame.mesh.position.set(oakP.x, oakP.y + 1.4, oakP.z); scene.add(flame.mesh);
    const flames = fx.makeGlows({ time, positions: [[fireP.x, fireP.y - 0.2, fireP.z]], colors: ['#ffb860'], sizes: [5.5], size: 1, intensity: 1.5, flicker: 0.5 });
    scene.add(flames.object);
    const embers = fx.makeParticles({ rng: R_.embers, preset: 'embers', follow: false, center: [fireP.x, fireP.y + 9, fireP.z], box: [22, 24, 22], count: Math.round(420 * detail), time });
    scene.add(embers.object);
    const sparks = fx.makeParticles({ rng: R_.sparks, preset: 'sparks', follow: false, center: [fireP.x, fireP.y + 6, fireP.z], box: [9, 16, 9], count: Math.round(260 * detail), time });
    scene.add(sparks.object);
    const oakSmoke = fx.makeSmokeColumn({ rng: R_.stumpsmoke, time, position: [fireP.x, fireP.y + 5, fireP.z], height: 44, radius: [0.7, 7], size: [2.2, 13], count: 52, color: '#4c505c', colorTop: '#80848f', softness: 0.9, opacity: 0.6, wind: [O * 0.6, 0, -0.8] });
    scene.add(oakSmoke.object);
    updaters.push((dt, t, camera) => {
      const fl = 0.75 + 0.25 * Math.sin(t * 11) * Math.sin(t * 7.3 + 1);
      U.uFireCol.value.setRGB(4.4 * fl, 1.9 * fl, 0.5 * fl);
      oakSmoke.update(dt, t, camera);
    });
    // the kit's leaf material (the pines); under the storm they stand in its dim light
    const STORM_TINT = night || hour === 'golden' || hour === 'dawn' ? [0.5, 0.58, 0.8] : [0.6, 0.62, 0.6];
    const matOptions = { wind: flora.makeWind({ direction: [0.8, 0.5], strength: 1.5 }) };
    await flora.prepareLeafTexture(matOptions, ctx.yield);
    const leafMat = flora.windMaterial(matOptions);
    // (the pines by their own place: the kit lights them with the valley's standing hour; here each fragment of them is
    // darkened where the storm stands over it, takes the storm's flash by its own distance, and the fog of its own place)
    {
      const kitCompile = leafMat.onBeforeCompile;
      leafMat.onBeforeCompile = (shader, renderer) => {
        kitCompile(shader, renderer);
        Object.assign(shader.uniforms, { uJA: U.uJA, uJB: U.uJB, uFogColH: U.uFogColH, uFogDenH: U.uFogDenH, uFlashAmt: U.uFlashAmt, uFlashCol: U.uFlashCol, uFire: U.uFire, uFireCol: U.uFireCol, uStormTint: { value: new THREE.Vector3(STORM_TINT[0], STORM_TINT[1], STORM_TINT[2]) } });
        shader.fragmentShader = shader.fragmentShader
          .replace('#include <common>', '#include <common>\nuniform vec3 uJA, uJB, uFogColH[4], uFlashCol, uStormTint, uFireCol; uniform vec4 uFogDenH, uFire; uniform float uFlashAmt;')
          .replace('#include <fog_fragment>', `{
            vec3 kP = smoothstep(uJA, uJB, vec3(-vFloraWorld.z));
            vec3 pFog = mix(mix(mix(uFogColH[0], uFogColH[1], kP.x), uFogColH[2], kP.y), uFogColH[3], kP.z);
            float pDen = mix(mix(mix(uFogDenH.x, uFogDenH.y, kP.x), uFogDenH.z, kP.y), uFogDenH.w, kP.z);
            float pFlash = uFlashAmt*(1. - smoothstep(uJA.x, uJB.x + 160., -vFloraWorld.z));
            float pFire = clamp(1. - length(uFire.xyz - vFloraWorld)/uFire.w, 0., 1.);
            gl_FragColor.rgb = gl_FragColor.rgb*mix(uStormTint, vec3(1.), kP.x) + diffuseColor.rgb*(uFlashCol*pFlash*.5 + uFireCol*pFire*pFire*.6);
            pFog = mix(pFog, vec3(.27, .36, .6), min(.6, .35*pFlash));
            gl_FragColor.rgb = mix(gl_FragColor.rgb, pFog, 1. - exp(-pDen*pDen*vFogDepth*vFogDepth));
          }`);
      };
    }
    await ctx.yield();

    // ------------------------------------------------------------ THE TORRENT, raging white down its gorge, and the two falls
    const rpts = []; for (let s = s0 + 6; s > sHead - 15; s -= 10) rpts.push([V(s), yR(s) + 0.3, -s]);
    const rLen = s0 + 6 - (sHead - 15);
    await ctx.yield();
    const river = Water.makeRiver({ rng: R_.torrent, light: LT, points: rpts, width: (t) => 17 + 8 * smoothstep(0.9, 1, t), speed: 6.6, foam: 0.72, bankFoam: 1, ripple: 1.2, opacity: 0.85,
      deep: '#3d6e78', shallow: '#a9cfd0', wetColor: '#23282a', segments: Math.round(rLen / 1.8), across: 10 });
    river.object.name = 'torrent'; scene.add(river.object);
    await ctx.yield();
    const fallList = [];
    for (const f of falls) {
      // (its lip on the bay's cliff, 45.6 m from the axis; it comes down to the apron's top, 3 m over the torrent; 5 m wide
      // in four strands, a plume of spray at its foot)
      const x = V(f.s) + f.side * 45.6, yTop = landY(x, -f.s) - 0.3, h = yTop - yR(f.s) - 3.2;
      const w = Water.makeWaterfall({ rng: R_.falls, light: LT, top: [x, yTop, -f.s], height: h, width: 5, layers: 4, dir: [-f.side, 0, 0], launch: 2.3, tint: river.uniforms.uDeep.value, mistCount: Math.round(170 * detail), rainbow: 0.3, poolSize: 1.3 });
      scene.add(w.object); fallList.push(w); f.x = x; f.top = yTop; f.h = h;
      await ctx.yield();
    }
    updaters.push((dt, t, camera) => { river.update(dt, t, camera); for (const w of fallList) w.update(dt, t, camera); });

    // ------------------------------------------------------------ THE RUINED CASTLE on its crag (64 m and more off the line)
    const castleMesh = new THREE.Mesh(castleB.build(), propMat); castleMesh.name = 'castle'; castleMesh.position.set(crag.x, crag.top - 0.6, crag.z); castleMesh.rotation.y = R_.castleplace.range(0, TAU); scene.add(castleMesh);

    // the cottages on the bench below it: plain walls, plain snowy roofs, a thread of smoke from each chimney
    {
      const CB = makeProp();
      for (const c of cottages) { c.y = landY(c.x, c.z); c.top = cottageInto(CB, c.x, c.y, c.z, c.yaw + Math.atan2(V(c.s + 2) - V(c.s - 2), 4), 5, 7, 2.7); }
      if (cottages.length) { const cm = new THREE.Mesh(CB.build(), propMat); cm.name = 'cottages'; scene.add(cm); }
      for (const c of cottages) { const sm = fx.makeSmokeColumn({ rng: R_.cottagesmoke, time, position: c.top, height: 16, radius: [0.2, 1.8], size: [0.8, 3.6], count: 18, color: '#7c8090', colorTop: '#a8acb8', wind: [0.8, 0, 0.5], opacity: 0.42 }); scene.add(sm.object); updaters.push((dt, t, camera) => sm.update(dt, t, camera)); }
    }

    // ------------------------------------------------------------ THE PINES: the valley's benches and lower walls, the lake's shores, the islets
    // (a pine stands where the land is below the snow, off the crag, 15 m and more from the burning stump, and 5 m and more
    // clear of the line with its own crown)
    const pinePts = [];
    const pineAt = (rr, s, a, sd, sc, rot, v) => {
      const x = V(s) + sd * a, y = landY(x, -s), pb = bayAt(s, sd), inBay = pb > 0.01 && a < 8 + 30 * pb + lerp(22, 7, pb) + 5;
      let bare = _lo.snow > 0.35 || _lo.ice > 0.1 || y < 0.25 || Math.hypot(x - crag.x, -s - crag.z) < crag.r + 3 || Math.hypot(x - oakP.x, -s - oakP.z) < 15 || inBay;
      for (const c of cottages) if (Math.hypot(x - c.x, -s - c.z) < 8) bare = true;
      if (!bare && stands('pine', x, s, 3.4 * sc, y + 21 * sc, 5)) pinePts.push({ x, y, z: -s, s: sc, rot, v, d: Math.abs(x - route(s)), u: clamp((s + 150) / (s0 + 150), 0, 0.999) });
    };
    for (let i = 0, n = Math.round(400 * dens * detail); i < n; i++) {
      const rr = R_.pines, s = rr.range(sHead - 20, s0 - 20), sd = rr.chance(0.5) ? 1 : -1, t = rr(), sc = rr.range(0.72, 1.3), rot = rr.range(0, TAU), v = rr.int(0, 3);
      pineAt(rr, s, 33 + 170 * Math.pow(t, 1.5), sd, sc, rot, v);
      if (i % 10 === 9) await ctx.yield();
    }
    for (let i = 0, n = Math.round(230 * dens * detail); i < n; i++) {
      const rr = R_.shorepines, s = rr.range(-150, sHead - 4), near = rr.chance(0.6), t = rr(), sc = rr.range(0.72, 1.3), rot = rr.range(0, TAU), v = rr.int(0, 3);
      pineAt(rr, s, (near ? nearShore(s) : farShore(s)) + 5 + (near ? 120 : 170) * Math.pow(t, 1.5), near ? O : -O, sc, rot, v);
      if (i % 10 === 9) await ctx.yield();
    }
    for (const q of islets) { const rr = R_.islets, sc = rr.range(0.42, 0.6), rot = rr.range(0, TAU), ok = stands('islet-pine', q.x, q.s, 3.4 * sc, q.h + 21 * sc, 5); if (ok) pinePts.push({ x: q.x, y: q.h - 0.4, z: q.z, s: sc, rot, v: 0, d: Math.abs(q.x - route(q.s)), u: clamp((q.s + 150) / (s0 + 150), 0, 0.999) }); }
    const PINE = { leaf: '#24402e', leafLight: '#3c5c40', leafDark: '#101c18', bark: '#4a3c30', barkDark: '#241c18' };
    const pineV = [], pineF = [];
    for (let k = 0; k < 4; k++) { pineV.push(flora.coniferGeometry({ rng: R_.pineshapes, height: 15 + k * 2.2, detail: 1, snow: [0, 0.12, 0.3, 0.5][k], slim: 0.85 + 0.12 * k, ...PINE })); await ctx.yield(); }
    for (let k = 0; k < 2; k++) pineF.push(flora.coniferGeometry({ rng: R_.pineshapes, height: 16 + k * 4, detail: 0, snow: 0.15 + 0.3 * k, ...PINE }));
    await ctx.yield();
    await ctx.yield();
    const pines = flora.makeScatter({ rng: R_.pineshapes, variants: pineV, farVariants: pineF, farDistance: 62, points: pinePts, material: leafMat, chunks: 4, cullDistance: 700, tilt: 0.04 });
    pines.object.name = 'pines'; scene.add(pines.object);
    updaters.push((dt, t, camera) => pines.update(dt, t, camera));
    measure.pines = pinePts.length; measure.pinePts = pinePts;
    await ctx.yield();

    // ------------------------------------------------------------ THE CAST (nothing of it begins, turns or ends as we come)
    // THE FIGURE: a habit on the world's clock. He bounds a closed round of his own on the brow of the ice rise that stands
    // on the needles' hand of the furrow (the plan's FIG round): out to the north 36 m aside of the line's plan (he wanders
    // 2 m either way of it), round by a half circle of 6 m, back 48 m aside, round again: 20 m from end to end, 78 m round.
    // He goes 17 m a second by bounds of about 9 m and stands 2 s on each of two footfalls in every round (which two: see
    // below), his head turning about by a habit of its own: a period of 8.6 s. The look is held toward his ground from
    // 190 m short of its middle until 30 m past abeam of it, at the flight's slow pace; the wedge between the line and his round is low and
    // bare by place (the plan), so nothing of the ice stands between him and the line. He regards no one.
    const rn = R_.runner, ph1 = rn.range(0, TAU), ph2 = rn.range(0, TAU);
    const FIG_R = (FIG_A2 - FIG_A1) / 2, figLeg = sFigB - sFigA, FIG_Q = 2 * figLeg + TAU * FIG_R, FIG_V = 17, FIG_STAND = 2;
    // a place of the round: the line's plan at s, a metres to the needles' hand along the plan's own normal
    const _rt = { x: 0, s: 0, tx: 0, ts: 0, nx: 0, ns: 0 };
    const frameAt = (s) => { const r1 = (route(s + 1) - route(s - 1)) / 2, l = Math.hypot(r1, 1); _rt.x = route(s); _rt.s = s; _rt.tx = r1 / l; _rt.ts = 1 / l; _rt.nx = D / l; _rt.ns = -D * r1 / l; return _rt; };
    const figWander = (s, k) => (1.5 * Math.sin(s * 0.043 + ph1 + k) + 0.6 * Math.sin(s * 0.11 + ph2 + 2 * k)) * Math.sin(Math.PI * clamp((s - sFigA) / figLeg, 0, 1));
    const figCurve = (q, o) => {
      const capL = Math.PI * FIG_R;
      if (q < figLeg) { const f = frameAt(sFigA + q), a = FIG_A1 + figWander(f.s, 0); o.x = f.x + f.nx * a; o.s = f.s + f.ns * a; }
      else if (q < figLeg + capL) { const f = frameAt(sFigB), th = (q - figLeg) / FIG_R, a = FIG_A1 + FIG_R * (1 - Math.cos(th)), b = FIG_R * Math.sin(th); o.x = f.x + f.nx * a + f.tx * b; o.s = f.s + f.ns * a + f.ts * b; }
      else if (q < 2 * figLeg + capL) { const f = frameAt(sFigB - (q - figLeg - capL)), a = FIG_A2 + figWander(f.s, 1.7); o.x = f.x + f.nx * a; o.s = f.s + f.ns * a; }
      else { const f = frameAt(sFigA), th = (q - 2 * figLeg - capL) / FIG_R, a = FIG_A2 - FIG_R * (1 - Math.cos(th)), b = -FIG_R * Math.sin(th); o.x = f.x + f.nx * a + f.tx * b; o.s = f.s + f.ns * a + f.ts * b; }
      return o;
    };
    const round = await makeRound(rn, sea, figCurve, FIG_Q, 9, ctx);
    await ctx.yield();
    // the two footfalls he stands on, 2 s each in every round: the highest footfall of the out leg's last third and the
    // far turn; and (r3) the highest of the back leg's last third and the near turn, never under 6 m of the round past
    // the first. The brow rises away from the line, so both fall on the far leg, 46 to 51 m aside, at its two ends: he
    // stands 2 s, bounds about 1 s along the far leg (1.0 to 1.7 s by seed), stands 2 s, then bounds about 3.5 s round
    // the near half (2.9 to 3.6 s by seed) to the first again
    let kCrest = 1, kCrest2 = 0;
    { let best = -1e9, best2 = -1e9; const capL = Math.PI * FIG_R; round.footfalls.forEach((q, k) => { const qq = q - round.f0; if (qq > figLeg * 0.66 && qq < figLeg + capL && round.heights[k] > best) { best = round.heights[k]; kCrest = k; } if (qq > 1.66 * figLeg + capL && qq < FIG_Q - 1 && round.heights[k] > best2) { best2 = round.heights[k]; kCrest2 = k; } }); }
    const qCrest = round.footfalls[kCrest] - round.f0, qCrest2 = Math.max(qCrest + 6, round.footfalls[kCrest2] - round.f0), FIG_P = FIG_Q / FIG_V + 2 * FIG_STAND, figPhase = R_.figclock.range(0, FIG_P), lookPh = R_.figclock.range(0, TAU), _st = {};
    // where he is at a clock (o: x, y, z, yaw and his pose)
    const figAt = (t, o) => {
      const tau = (((t + figPhase) % FIG_P) + FIG_P) % FIG_P, tc = qCrest / FIG_V, tc2 = qCrest2 / FIG_V + FIG_STAND;
      const q = tau < tc ? tau * FIG_V : tau < tc + FIG_STAND ? qCrest : tau < tc2 ? (tau - FIG_STAND) * FIG_V : tau < tc2 + FIG_STAND ? qCrest2 : (tau - 2 * FIG_STAND) * FIG_V, dq = Math.min(Math.abs(q - qCrest), Math.abs(q - qCrest2));
      round.at(round.f0 + q, _st);
      o.x = _st.x; o.y = _st.y; o.z = _st.z; o.yaw = _st.yaw; o.c = _st.c; o.fly = _st.fly; o.rise = _st.rise;
      // he gathers himself over the last 3 m on to the crest and the first 3 m off it; while he stands his head goes about
      o.stand = 1 - smoothstep(0.3, 3.2, dq);
      o.look = 0.8 * Math.sin(t * 0.9 + lookPh);
      return o;
    };
    measure.figRound = { curve: figCurve, Q: FIG_Q, period: FIG_P, round };
    // (r3) SEEN IS A RULE OF THE PLACE, tested here on this seed's own surface: from points of the line (every 5 m of the
    // way from 126 m short of his round; for the sledges every 10 m) the straight sight to each footfall of his round, half
    // a metre over the ice, is walked every 2 m over the ice as it is drawn, from 3 m off the eye to 2 m short of the
    // place (places within 120 m and 10 m and more ahead). measure.sight carries the lines walked, the least room under
    // any of them and the lines the ice breaks: the count reads it on every seed
    const _eye = new THREE.Vector3();
    const sightRoom = (e, x, y, z) => { const dx = x - e.x, dy = y - e.y, dz = z - e.z, d = Math.hypot(dx, dy, dz); let g = 1e9; for (let q = 3; q < d - 2; q += 2) { const f = q / d; g = Math.min(g, e.y + dy * f - sea.surfAt(e.x + dx * f, e.z + dz * f)); } return g; };
    const sightOf = (pts, sA, sB, step) => { const r = { lines: 0, least: 1e9, broken: 0 }; for (let s = sA; s <= sB; s += step) { path.posAtDist(mOf(s), _eye); for (const q of pts) { if (-q.z < s + 10 || Math.hypot(q.x - _eye.x, q.z - _eye.z) > 120) continue; const g = sightRoom(_eye, q.x, q.y + 0.5, q.z); r.lines++; if (g < r.least) r.least = g; if (g < 0.15) r.broken++; } } return r; };
    measure.sight = { figure: sightOf(round.footfalls.map((q, k) => { round.at(q, _st); return { x: _st.x, y: round.heights[k], z: _st.z }; }), sFigA - 126, sFigB, 5) };
    await ctx.yield();
    const figure = hero.figure;
    // THE SLEDGE: a habit on the world's clock. The dog team runs its closed round of the frozen ocean (the plan's SL round)
    // at 10 m a second with its driver standing in the carriage, from the first frame to the last; no berth, no
    // waiting, no boarding. The dogs' legs go by the metres of the round they have run.
    const SL_V = 10, slPhase = R_.sledge.range(0, SL_Q), _sl = {};
    // (r2) THREE TEAMS go the one round, a third of it apart (82 m), all one way at every clock: southward on its near
    // leg, northward on its far leg; a team passes any place of the round every 8.2 s.
    // Each driver is an ordinary bundled man in brown furs, 1.75 m (the figure's mesh at two thirds of its size, in furs).
    const SL_N = 3, sledges = [];
    for (let k = 0; k < SL_N; k++) {
      const sledge = makeSledge(U, R_.sledge); scene.add(sledge.mesh);
      const driver = makeFigure(U, { coat: '#6b5a46', coat2: '#8a765c', hair: '#4a3d30', skin: '#7a6450', boot: '#3a3028' }); driver.mesh.name = 'driver'; driver.mesh.scale.setScalar(0.65); scene.add(driver.mesh);
      sledges.push({ sledge, driver });
    }
    const sledgePlace = (t, o, k = 0) => { sledgeAt(slPhase + k * SL_Q / SL_N - SL_V * t, o); o.fx = -o.fx; o.fz = -o.fz; o.y = sea.surfAt(o.x, o.z) + 0.04; return o; };
    await ctx.yield();
    // (r3: the same sight test for the round of the sledges, a place every 19 m of it)
    { const pts = []; for (let q = 0; q < SL_Q; q += SL_Q / 13) { sledgeAt(q, _sl); pts.push({ x: _sl.x, y: sea.surfAt(_sl.x, _sl.z), z: _sl.z }); } measure.sight.sledges = sightOf(pts, sGate - 100, sSlB + SL_R, 10); }
    await ctx.yield();
    // THE SHIP, locked in the ice 56 m to one hand of the line, 150 m past the gate: her bow to the north by a draw, heeled
    const ship = makeShip(R_.ship), shipR = R_.shipset, shipYaw = Math.PI + shipR.range(-0.35, 0.35), shipHeel = shipR.range(0.04, 0.08) * (shipR.chance(0.5) ? 1 : -1);
    const shipP = new THREE.Vector3(route(sShip) + SH * SHIP_OFF, 0, -sShip); shipP.y = sea.surfAt(shipP.x, shipP.z) - 0.4;
    const shipMesh = new THREE.Mesh(ship.geometry, propMat); shipMesh.name = 'ship'; shipMesh.position.copy(shipP); shipMesh.rotation.set(0, shipYaw, shipHeel, 'YXZ'); shipMesh.updateMatrixWorld(); scene.add(shipMesh);
    measure.shipGap = lineGap(shipP.x, sShip, 22, shipP.y + ship.mastTop);
    await ctx.yield();
    // her pool (hardly wider than herself) and the ice thrown up round it
    {
      const SA = makeAcc(), pos = [shipP.x, shipP.y + 0.65, shipP.z], sh = [40], idx = [], cy = Math.cos(shipYaw), sy = Math.sin(shipYaw), n = 28;
      for (let k = 0; k < n; k++) {
        const a = k / n * TAU, lx = Math.cos(a) * 7.2 * shipR.range(0.9, 1.15), lz = Math.sin(a) * 25 * shipR.range(0.94, 1.08);
        const px = shipP.x + lx * cy + lz * sy, pz = shipP.z - lx * sy + lz * cy;
        // (the sheet lies on the ice's own surface at its rim, a hand above it)
        pos.push(px, sea.surfAt(px, pz) + 0.25, pz); sh.push(0); idx.push(0, 1 + (k + 1) % n, 1 + k);
        const bx = shipP.x + (lx * cy + lz * sy) * 1.12, bz = shipP.z + (-lx * sy + lz * cy) * 1.12;
        // (r2: on the hand toward the line the ice is heaped against her side in a pressure ridge 2 to 5 m high: she is held)
        const toLine = (bx - shipP.x) * -SH > 2 ? 1 : 0;
        blockInto(SA, shipR, bx, sea.surfAt(bx, bz), bz, shipR.range(1.2, 2.8) * (1 + 0.5 * toLine), shipR.range(0.4, 1.3) * (1 + 1.3 * toLine), shipR.range(1.2, 2.6), shipR.range(0, TAU), shipR.range(-0.4, 0.4) * (1 + toLine), shipR.range(-0.4, 0.4), 0.5);
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aShore', new THREE.Float32BufferAttribute(sh, 1)); g.setIndex(idx); g.computeBoundingSphere();
      const pool = new THREE.Mesh(g, seaMat); pool.name = 'pool'; pool.renderOrder = 1; scene.add(pool);
      const rim = new THREE.Mesh(await SA.buildBy(ctx), landMat); rim.name = 'ship-ice'; scene.add(rim);
    }
    await ctx.yield();
    const _v = new THREE.Vector3(), lanternP = ship.lanterns.map((q) => new THREE.Vector3(q[0], q[1], q[2]).applyMatrix4(shipMesh.matrixWorld));
    const lanterns = fx.makeGlows({ time, positions: lanternP.map((p) => [p.x, p.y, p.z]), color: '#d98a3a', sizes: ship.lanterns.map((q) => q[3]), size: 2.3, intensity: 2.4, flicker: 0.12 });
    scene.add(lanterns.object);
    const lanternPh = ship.lanterns.map(() => R_.glows.range(0, TAU));
    // (a thread of smoke from her galley; her lanterns' and her stern window's warm light as paint on her deck's snow, her
    // spars and the ice by her side: two lamps of the place, 26 m and 20 m of reach)
    const galley = fx.makeSmokeColumn({ rng: R_.galleysmoke, time, position: _v.set(ship.smokeAt[0], ship.smokeAt[1], ship.smokeAt[2]).applyMatrix4(shipMesh.matrixWorld).toArray(), height: 30, radius: [0.25, 2.6], size: [1.0, 5], count: 40, color: '#5a5a62', colorTop: '#9a9ca8', wind: [SH, 0, 0.4], opacity: 0.5 });
    { const a = _v.set(0, ship.sheer(0.47) + 3.2, ship.zAt(0.47)).applyMatrix4(shipMesh.matrixWorld); U.uLamp.value.set(a.x, a.y, a.z, 26);
      const b = _v.set(0, ship.sheer(0) - 0.6, ship.zAt(0) - 3).applyMatrix4(shipMesh.matrixWorld); U.uLamp2.value.set(b.x, b.y, b.z, 20); U.uLampCol.value.setRGB(2.6, 1.25, 0.42); }
    scene.add(galley.object);
    await ctx.yield();
    // THE RAFT: a standing state. One plate of ice rides at its station in the open water beyond the ice's edge (the plan's
    // sRaft, RAFT_OFF), rising, falling and rocking on the swell by the world's clock and going a slow small round of 5 m
    // about its station every 47 s: a bare floe with a hummock on it (r2: no figure stands on it).
    const raftYaw = R_.raft.range(-0.3, 0.3), raftPh = R_.raft.range(0, TAU), raftP = new THREE.Vector3(route(sRaft) + SH * RAFT_OFF, FLOE_TOP + 0.2, -sRaft), _rf = {};
    const raftAt = (t, o) => { const a = t * TAU / 47 + raftPh; o.x = raftP.x + 5 * Math.cos(a); o.z = raftP.z + 3.5 * Math.sin(a); o.y = raftP.y + 0.5 * Math.sin(t * 0.9 + 1.3); return o; };

    // ------------------------------------------------------------ LIFE
    // the light the kit's creatures take: the rig's own standing light
    const fLight = { _resolved: true, sunDir: new THREE.Vector3(0, 1, 0), sunColor: new THREE.Color(), sky: new THREE.Color(), ground: new THREE.Color() };
    const setFLight = () => { fLight.sunDir.copy(rig.direction); fLight.sunColor.copy(rig.sun.color).multiplyScalar(rig.sun.intensity); fLight.sky.copy(rig.hemi.color).multiplyScalar(rig.hemi.intensity); fLight.ground.copy(rig.hemi.groundColor).multiplyScalar(rig.hemi.intensity); };
    setFLight();
    await ctx.yield();
    const fauna = F.makeFauna(scene, { light: fLight });
    // eagles soaring over the valley, kept off the line by place: their slow round (40 m, 52 m at its widest, rising and
    // falling 5 m), each bird's own station in it (45 m about, 14 m up or down) and its circles (26 m, 47 m at their widest,
    // lifting 5 m) reach 144 m in plan and 26 m down of the centre, and the centre stands 112 m over the torrent; chamois
    // on a ledge of the dome's hand, 46 m off the axis
    const sE = sHead + R_.birds.range(150, 230), EAGLE = { x: V(sE) + D * 50, y: yR(sE) + 112, s: sE, reach: 144, down: 26 };
    fauna.add(F.makeFlock({ rng: R_.birds, species: 'eagles', count: Math.round(3 * dens) + 1, size: 1.5, center: [EAGLE.x, EAGLE.y, -sE], radius: 40, height: 4, spread: [45, 14, 45], soarRadius: 26, soarLift: 5, light: fLight }));
    measure.eagles = EAGLE;
    await ctx.yield();
    const sCh = sHead + R_.chamois.range(215, 255), chX = V(sCh) + D * 47;
    fauna.add(F.makeHerd({ rng: R_.chamois, species: 'antelope', count: 5, size: 0.8, coat: '#7a6650', center: [chX, 0, -sCh], radius: 9, heightAt: landY, light: fLight }));
    updaters.push((dt, t, camera) => { setFLight(); fauna.setLight(fLight); fauna.update(dt, t, camera, 0); });
    await ctx.yield();
    // rain with the storm, a little snow with the dusk; mist lying in the pines of the benches
    // (r2: fine short streaks, slanting down the world's one wind; the box 90 m across and 44 deep; a drop fades only inside 0.6 to 2.5 m of the lens, a medium's law, so
    // most of the drops drawn are far: a grey veil, never long white lines)
    const rain = fx.makeParticles({ rng: R_.rain, preset: 'rain', time, count: Math.round(7000 * detail), box: [90, 44, 90], velocity: [-D * 5.5, -21, -1.6], velocityRandom: [1.2, 5, 1.2], size: [0.012, 0.02], stretch: 0.016, opacity: 0.22, near: [0.6, 2.5] }); scene.add(rain.object);
    await ctx.yield();
    const snowfall = fx.makeParticles({ rng: R_.snow, preset: 'snow', time, count: Math.round(2600 * detail) }); snowfall.setOpacity(0); scene.add(snowfall.object);
    const mistP = [];
    // (the mist is the valley's: it lies beyond the storm's edge, and takes the colour of the valley floor's own light)
    for (let i = 0; i < 46; i++) { const mr = R_.mist, s = mr.range(JOIN[0][1] + 10, s0 - 60), sd = mr.chance(0.5) ? 1 : -1, a = mr.range(58, 150), x = V(s) + sd * a; mistP.push([x, landY(x, -s) + mr.range(5, 12), -s]); }
    const mist = fx.makeMist({ rng: R_.mist, time, positions: mistP, size: [16, 34], color: { dawn: '#8d98c2', dayB: '#c4cfe0', goldB: '#a39aa8', nightM: '#2a3760' }[SET[1]], opacity: night ? 0.12 : 0.16, drift: [0.5, 0, 0.2] }); scene.add(mist.object);
    await ctx.yield();
    // THE AVALANCHE on the far wall opposite the castle (350 to 500 m off): two tracks out of step, each a train of powder
    // clouds born down the slope one after another every 11 s; a third beside us onto the ice on the rare visit
    const avalTrack = (rr, s, a0, a1, sd, per, ph0, sz, list) => {
      const n = 22;
      for (let k = 0; k < n; k++) {
        const f = k / (n - 1), a = lerp(a0, a1, f), sk = s + 30 * f + rr.range(-8, 8), x = V(sk) + sd * a, y = landY(x, -sk) + sz * 0.7, drop = (landY(x - sd * 10, -sk) - landY(x, -sk)) / 10;
        list.push({ p: [x + rr.range(-9, 9), y, -sk], v: [-sd * 9, 9 * drop + 2.5, rr.range(-2, 2)], size: sz * rr.range(0.7, 1.3) * (0.6 + 0.8 * f), per, ph: per - ph0 - f * 4.2 - rr.range(0, 0.4), life: 5.2, grow: 2.4, a: 0.75, tone: 0.12 });
      }
    };
    const avList = [], sAv = sC + R_.aval.range(10, 60);
    avalTrack(R_.aval, sAv, 500, 320, D, 11, 0, 20, avList); avalTrack(R_.aval, sAv + 70, 470, 300, D, 11, 5.5, 17, avList);
    const aval = makePuffs(U, avList, { name: 'avalanche', shade: '#8a9ab8' }); scene.add(aval.mesh);
    const av2List = []; avalTrack(R_.aval2, s0 + R_.aval2.range(120, 190), 330, 216, D, 9, 0, 11, av2List);
    const aval2 = makePuffs(U, av2List, { name: 'avalanche-near', shade: '#8a9ab8' }); aval2.amount.value = rare ? 1 : 0; scene.add(aval2.mesh);
    await ctx.yield();
    // spindrift blowing off the crests of the ice river, sea smoke over the leads of the ocean: low soft sheets, each at a
    // place of its own. MEDIA: a puff whose whole course (grown to its fullest) would come within 2.5 m of the line is not
    // made (kept off the lens by place), and the part's puffs fade only inside 0.6 to 2.5 m of the lens (a medium's law)
    const drift = [], wind = [5.5 * -D, 0.25, -1.6];
    U.uWind.value.set(wind[0], wind[2]);
    const puffClear = (p, v, size, grow, life) => {
      // (r3: its square's corners count: 1.42 of its full half size, at five places of its course)
      const r = 1.42 * size * (1 + grow);
      for (const f of [0, 0.25, 0.5, 0.75, 1]) { const x = p[0] + v[0] * life * f, y = p[1] + v[1] * life * f, s = -(p[2] + v[2] * life * f); if (lineGap(x, s, r, y + r) < 2.5) return false; }
      return true;
    };
    for (let i = 0, n = Math.round(520 * dens); i < n; i++) {
      const dr = R_.drift, s = dr.range(s0 + 12, sGate + 30), x = route(s) + dr.range(-130, 130), size = dr.range(1.6, 3.4), per = dr.range(2.8, 5.5), ph = dr.range(0, 6), y = sea.surfAt(x, -s);
      // (only where the surface stands above its mean: a crest)
      const p = [x, y + 0.4, -s], ok = y > Lv(s) + 0.8 && inside(x, s) > 20 && puffClear(p, wind, size, 1.3, 2.5);
      if (ok) drift.push({ p, v: wind, size, per, ph, life: 2.5, grow: 1.3, a: 0.58, tone: 0 });
      if (i % 12 === 11) await ctx.yield();
    }
    // the wind falls off the glacier's brow: over the snout the snow smokes everywhere, not on crests only (MEDIA, as above)
    for (let i = 0, n = Math.round(70 * dens); i < n; i++) {
      const dr = R_.drift, s = dr.range(s0 + 4, s0 + 120), x = route(s) + dr.range(-75, 75), size = dr.range(1.8, 3.6), per = dr.range(2.6, 4.8), ph = dr.range(0, 6), y = sea.surfAt(x, -s);
      if (inside(x, s) > 14 && puffClear([x, y + 0.5, -s], wind, size, 1.3, 2.5)) drift.push({ p: [x, y + 0.5, -s], v: wind, size, per, ph, life: 2.5, grow: 1.3, a: 0.58, tone: 0 });
      if (i % 12 === 11) await ctx.yield();
    }
    for (const c of sea.cuts) if (c.kind === 1) {
      for (let k = 0; k < 9; k++) {
        const sr = R_.seasmoke, xa = lerp(c.x0 + c.tap, c.x1 - c.tap, sr()), sw = c.sw, x = V(sw) + xa, s = sw + sea.warp(x, sw) * (1 - smoothstep(sBreak - 90, sBreak - 30, sw)), size = sr.range(2.4, 4.6), per = sr.range(4.5, 8), ph = sr.range(0, 8);
        const p = [x, sea.surfAt(x, -s) + 1.2, -s], v = [1.1 * -D, 1.5, 0.3], ok = c.x1 - c.x0 > 2 * c.tap + 10 && puffClear(p, v, size, 1.5, 3.6);
        if (ok) drift.push({ p, v, size, per, ph, life: 3.6, grow: 1.5, a: 0.3, tone: 0.3 });
      }
    }
    const driftPuffs = makePuffs(U, drift.length ? drift : [{ p: [0, -500, 0], v: [0, 0, 0], size: 0.1, per: 5, ph: 0, life: 1, grow: 0, a: 0, tone: 0 }], { name: 'spindrift', shade: '#93a6c6' }); scene.add(driftPuffs.mesh);
    measure.drift = drift.length;
    await ctx.yield();
    // blocks of ice that tip and fall into the rifts, on the clock (each on its own period and phase; it heaves up at the lip,
    // leans over and falls): five, at the upstream lips of rifts by their own draws, 16 m and more from the line
    const tippers = [];
    {
      const rifts = sea.cuts.filter((c) => c.kind === 0);
      for (let i = 0; i < 5; i++) {
        const tr = R_.blocks, c = rifts[Math.min(rifts.length - 1, Math.floor(tr() * rifts.length))], sgn = tr.chance(0.5) ? 1 : -1, off = tr.range(16, 48), hx = tr.range(1.1, 2), hy = tr.range(0.7, 1.3), hz = tr.range(0.8, 1.3), per = tr.range(9, 15), ph = tr.range(0, 15);
        const BA = makeAcc(); blockInto(BA, tr, 0, 0, 0, hx, hy, hz, 0, 0, 0, 0.2);
        if (!c) continue;
        // (r3: where the dealt hand of the rift is closed, by the figure's rise or the sledges' ground, or lies in a wedge
        // kept bare for the cast, it stands on the rift's other hand)
        const rT = Math.hypot(hx, hz) * 1.12, at = (sg) => { const xw = route(c.sw) + sg * off, tp = sea.taper(c, xw - V(c.sw)), sw = c.sw + c.w * 0.5 * tp + hz * 0.6, s = sw + sea.warp(xw, sw); return { xw, tp, s, y: sea.surfAt(xw, -s), ok: tp >= 0.6 && !inWedge(xw, s, rT + 2) }; };
        let pl = at(sgn); if (!pl.ok) pl = at(-sgn);
        const xw = pl.xw, s = pl.s, y = pl.y, tp = pl.tp;
        if (!pl.ok || !stands('tipper', xw, s, rT, y + 2.6 * hy, 4)) continue;
        const mesh = new THREE.Mesh(await BA.buildBy(null), landMat); mesh.name = 'tipper'; mesh.position.set(xw, y, -s); scene.add(mesh);
        tippers.push({ mesh, x: xw, y, z: -s, per, ph, hy, D: c.D * Math.pow(tp, 0.7) });
        await ctx.yield();
      }
    }
    updaters.push((dt, t) => {
      for (const b of tippers) {
        const tau = (t + b.ph) % b.per, rest = b.per - 3.4;
        // heaving up out of the lip (1.2 s), leaning (to 0.5 rad as it rests), then the fall: 2.2 s by its own weight
        const up = smoothstep(0, 1.2, tau), lean = 0.5 * Math.pow(clamp(tau / rest, 0, 1), 2.4), tf = Math.max(0, tau - rest), fall = Math.min(4.9 * tf * tf, b.D + 4);
        b.mesh.position.set(b.x, b.y - (1 - up) * 2.4 * b.hy - fall, b.z + 0.25 * fall + lean * 0.8);
        b.mesh.rotation.x = lean + 1.9 * tf * tf * 0.4;
      }
    });

    await ctx.yield();

    // ------------------------------------------------------------ PACE, GAZE, THE FRAME
    // paces at places (metres a second; the engine scales the whole to the duration): slow over the lake and past the stump,
    // steady up the valley, fast over the ice, slower by the ship and by the broken edge
    // (21 m a second on to the ice river, 11.5 by the figure's ground, 24 through the gate, 15 abeam of the ship)
    const PACE = [[0, 19], [mOak, 17], [mHead + 40, 22], [mSnout - 70, 22], [mSnout + 50, 21], [mOf(sFigA - 110), 11.5], [mOf(sFigB + 10), 11.5], [mGate - 40, 24], [mGate, 24], [mShip - 110, 20], [mShip - 30, 15], [mShip + 30, 16], [mBreak, 22], [L, 20]];
    const pace = (u) => lin(PACE, clamp(u, 0, 1) * L) / 23;
    // the gaze: one pull at a time, each under 1, each toward a fixed place of the world, each window metres between places:
    // the burning stump (from 130 m to 32 m short of it), the castle (140 m to 36 m short), the ground of the figure's round
    // (its middle, 42 m aside: from 190 m short of it until 30 m past abeam; he is wherever his clock has him),
    // the ship (from 40 m short of the gate until 36 m past abeam of her), the raft's station (from 50 m short of the break to 36 m
    // short of the edge)
    const sAim = sFigA + 0.5 * figLeg, fa = frameAt(sAim), aimX = fa.x + fa.nx * (FIG_A1 + FIG_A2) / 2, aimS = fa.s + fa.ns * (FIG_A1 + FIG_A2) / 2;
    const figAim = new THREE.Vector3(aimX, sea.surfAt(aimX, -aimS) + 2, -aimS);
    const _g0 = new THREE.Vector3(), _g1 = new THREE.Vector3(), _g3 = new THREE.Vector3(), _g4 = new THREE.Vector3();
    const pois = [
      { at: () => _g0.set(oakP.x, oakP.y + 5, oakP.z), from: (mOak - 130) / L, to: (mOak - 32) / L, weight: 0.45, fade: 0.4 },
      { at: () => _g1.set(crag.x, crag.top + 12, crag.z), from: mOf(sC - 140) / L, to: mOf(sC - 36) / L, weight: 0.34, fade: 0.42 },
      // (r2: toward the middle of the figure's ground, 42 m aside, from 190 m short of it; let go over the 59 m from 29 m
      // short of abeam to 30 m past it)
      { at: () => figAim, from: mOf(sAim - 190) / L, to: mOf(sAim + 30) / L, weight: 0.5, fade: 0.27 },
      // (r2: toward her from 40 m short of the gate, where she comes clear of the gate's last ridge; weight 0.6; it is let go
      // over the 63 m from 27 m short of abeam to 36 m past it, and the pace there is the flight's slowest (15 against 23), so the look swings back to the way at under 30 degrees a second:
      // she stands whole in the picture while she is the nearest great thing)
      { at: () => _g3.set(shipP.x, shipP.y + 13, shipP.z), from: mOf(sGate - 40) / L, to: mOf(sShip + 36) / L, weight: 0.6, fade: 0.28 },
      // (after her the gaze goes to the edge and the ring: a light pull toward the arch's foot on the raft's hand)
      { at: () => _g4.set(raftP.x, raftP.y + 1.5, raftP.z), from: mOf(sBreak - 20) / L, to: mOf(sEdge - 36) / L, weight: 0.25, fade: 0.45 },
    ];
    // the ring's light on the arch and the last ice
    // (r2: it reaches 110 m: over the last floes, and as a broken path on the water before it, the water's own mirror)
    U.uPortal.value.set(endP.x, endP.y, endP.z, 110); U.uPortalCol.value.setRGB(0.6, 1.1, 1.4);
    const _f = {}, _cp = new THREE.Vector3();
    const update = (dt, t, camera) => {
      time.value = t; U.uTime.value = t;
      // the storm's flash on the world's clock, the whole visit long; it comes of the struck quarter's own place, and each
      // ground takes of it by its own distance from the lake (the part's PLACE law)
      const fl = flashAt(t);
      U.uFlashAmt.value = 1.3 * fl.f; U.uFlashPos.value.copy(quarters[fl.q]);
      measure.boltU.uWhich.value = fl.q; measure.boltU.uAmt.value = fl.f;
      // the kit's standing light: the valley's hour, its floor in shade
      rig.update(dt, t, camera); rig.sun.intensity *= KIT_SUN;
      // the broken edge: the leads stand open and breathe slowly, the ground swell never stops
      U.uOpen.value = 0.82 + 0.12 * Math.sin(t * TAU / 23); U.uSwell.value = 1;
      // rain falls where the storm stands and a little snow where the dusk stands: the box of drops goes with the eye, and how
      // much of it is drawn is read from the place the eye is in
      camera.getWorldPosition(_cp);
      rain.setOpacity(stormAt(-_cp.z)); snowfall.setOpacity(0.5 * duskAt(-_cp.z));
      // the cast, each on the world's clock
      figAt(t, _f);
      figure.mesh.position.set(_f.x, _f.y, _f.z); figure.mesh.rotation.y = _f.yaw; figure.pose({ c: _f.c, fly: _f.fly, rise: _f.rise, stand: _f.stand, look: _f.look, time: t });
      for (let k = 0; k < SL_N; k++) {
        const q = sledges[k]; sledgePlace(t, _sl, k);
        const slYaw = Math.atan2(_sl.fx, _sl.fz);
        q.sledge.mesh.position.set(_sl.x, _sl.y, _sl.z); q.sledge.mesh.rotation.y = slYaw; q.sledge.run.value = slPhase + SL_V * t;
        q.driver.mesh.position.set(_sl.x - 0.55 * _sl.fx, _sl.y + 0.5, _sl.z - 0.55 * _sl.fz); q.driver.mesh.rotation.y = slYaw; q.driver.pose({ stand: 1, look: 0, time: t });
      }
      raftAt(t, _rf);
      raft.position.set(_rf.x, _rf.y, _rf.z); raft.rotation.set(0.035 * Math.sin(t * 0.8 + 2), raftYaw, 0.03 * Math.sin(t * 1.1));
      // her shroud lanterns swing
      for (let i = 1; i < 4; i++) { const p = lanternP[i], a = lanternPh[i]; lanterns.setPosition(i, p.x + 0.22 * Math.sin(t * 1.3 + a), p.y - 0.03, p.z + 0.16 * Math.sin(t * 1.1 + a * 2)); }
      galley.update(dt, t, camera); mist.update(dt, t, camera);
      for (let i = 0; i < updaters.length; i++) updaters[i](dt, t, camera);
    };
    Object.assign(measure, { hour, drawnHour, rare, dens, D, O, SH, L, sHead, s0, sGate, sShip, sBreak, sEdge, sEnd, sOak, sC, mOf, sOf, route, V, lineY, lineGap, groundY, landY, sea, figAt, sledgePlace, sledgeAt, SL_Q, raftAt, raftP, JOIN, stormAt, duskAt,
      falls, crag, islets, oakP, shipP, dome, needles, ridges, tippers, towers, cottages, SHIP_OFF, chamois: { x: chX, s: sCh, r: 9 }, plates: hero.floes.plates.length, cuts: sea.cuts, archM, FLOE_TOP, SEA_Y, U });
    return {
      scene, path, duration: 50, pace, pois,
      camera: { fov: 62, near: 0.5, far: 5200, lookAhead: 40, sway: 0.4, bank: 0.5 },
      portal: { shape: 'circle', radius: 7, color: '#9fe8ff', glow: 1.1, revealDistance: 300 },
      post: { exposure: night ? 1.3 : 1.12, bloom: { strength: 0.42, radius: 0.6, threshold: 0.9 } },
      update, measure,
      dispose() { vsky.dispose(); for (const d of disposers) d(); },
    };
  },
};
