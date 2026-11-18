// Where the Lattice Grows: the laws of the crystal and its hero, THE SNOW CRYSTAL (one great six-armed crystal of ice
// blue frost, 220 m and more from tip to tip, standing free in one sheet of the hollow). Everything here is light:
// lamps (camera-facing sprites sized in metres) and threads (ribbons that turn about their own axis to face the eye),
// added over the deep. No three.js light, nothing that takes or casts shade.
// THE ICE is light too. The bars of round r8 along the crystal's spines and greater ribs, and THE FACETED ICE of round
// r9 (the plate crystal, the snow crystal's body, the ice on the rose's rings: bodies of flat faces), are added over
// the deep as every lamp is, write no depth and hide nothing; a face's light is a law of where its own normal points
// among fixed directions of the world (GOLD_FROM and FROST_FROM for a bar, NET_FROM and COLD_FROM for a facet); A
// FACE OF FACETED ICE IS CLEAR (round r11: its light stands along its borders and ribs, the broad of it is
// see-through by how squarely it is seen, with a faint bent tint of the deep behind: the facet's shader, declared
// below among what the eye changes). A BODY OF DEEP ICE (round r10: the plates, the snow crystal's body and bars; the materials facetBody
// and iceBody) SHOWS THE FACES TURNED TO THE EYE: its far faces are not drawn (a declared rule of how ice is drawn: a
// body is one skin of light, never the sum of its two sides), and its facets carry tints of their own (violet, teal,
// ice blue, pale). NOTHING HERE IS SOLID (round r11: the ice ridge of round r10, the one thing that wrote depth, is struck).
//
// The world (src/worlds/where-the-lattice-grows.js) and this part share ONE source for the lattice, the three
// states by place, the growth clocks, the figures, the route's points and the count of clear air:
//   latticeSites(k)            every site of sheet k inside the built bounds, with its state by place
//   snowFigure(rng, flake)     the snow crystal: its sites, its threads, its growing tips, its spines and greater
//                              ribs; with `flake` the same law at another place and size (the small flakes)
//   addSnow, addIce, addBody   a figure's threads (at its size), the ice bars along its spines and its body of
//                              faceted ice (heart plate, blades, end plates), into batches
//   armRunOn(fig)              the frost that runs on beyond each arm's tip into the net
//   buildFrostAir(ctx, rng, …) the frost air about the crystal: cold motes, each on a ring of its own about its axis
//   buildFrostGlow(ctx, rng, …) the violet and teal glow behind the crystal: broad soft clouds that turn as one body
//   netBay, netEdge            the finished net's edge toward the hollow: bays by a slow noise of the place
//   facetBatch, buildPlate     faceted ice; a plate crystal that turns about its axis (plateSpec: the great plate's
//                              place by the hollow's figures; plateClear: its disc; lesserPlates: the rose's company)
//   companySpecs               (round r11) the plate's company: nine great crystals, their places by the hollow's own figure grown
//   roseRing, roseClear        (round r11) the rose's rings by number: sheet, corners, cells of each side; how near a place stands to them
//   netThin, netThinColour     (round r11) the net thins, shrinks and cools over its outermost 130 m
//   primeFarWall, farWall      the hollow's far wall at the level (the ferns of the cold side root in it)
//   buildMist                  the violet deep behind the rose
//   netRest, netStands         the net's law of rest (whole, a third of its ranks, nothing); lampSize: lamps differ
//   wallFern(base, d, N, ...)  one small arm of the crystal's own kind, rooted on a wall of the hollow
//   fernFigure(rule, rng)      the sites and threads of one small fern of the 24 m net (dealt by the seed)
//   growthState(clock, time)   where a site stands on its clock (the mirror of the shaders' clockAges)
//   distanceToLattice(x,y,z)   the nearest thread axis of the whole lattice, lit or not
// AXES: +Z is ahead at the entry, +X is the growing side, the cold side (the left hand of an eye heading +Z), +Y up.
// A site is named by (c, j, k): x = 12 c, y = ROW (j + 2/3) in an A sheet or ROW j in a B sheet, z = 20 k, with
// c and j of the same parity; its six neighbours are 24 m off in its own sheet.
//
// THE HOLLOW (the figures the world's head repeats). The growing side is A GREAT HOLLOW INSIDE THE CRYSTAL,
// where it has not yet closed: half an almond lying along Z on the face. Its near wall is the face (about x 84, its
// ripple 8 m as before within 40 m of the route's line, a wider ripple of 20 m in y from 80 m off it); its far wall
// stands at x = face + 250 * sqrt(1 - (y / 130)^2 - ((z - 340) / 250)^2), nothing where that is negative, with a
// slow ripple of 12 m on the far wall and the rim (a fixed noise of its own): so the hollow runs from about z 90
// to z 590, is 260 m high and 250 m deep at its middle, and closes to a rim all round. Toward the entry it opens
// into THE BAY (round r6), a smaller lobe whose wall stands 50 m from the open rank's line. Above the hollow, below
// it, beyond its ends and behind its far wall the crystal stands in rank again, built out to x 430.
// A site's DEPTH is how far it stands inside the crystal from the hollow's wall (hollowDepth, in metres; under
// nothing: in the hollow). The states and the colours are laws of the depth alone, the same on every wall: over 48 m
// finished, 26 to 48 the rind that stands, 0 to 26 the live rind on clocks; pale gold at the wall, gold from 40 m,
// deepening from 144 m (x -60 on the entry's side) through orange to ember red by 304 m (x -220).
// THE WALL'S BORDER IS RAGGED GROWTH (round r8, rindClock): the share of its period for which a live site is away is
// a law of its depth too, three quarters at the very border falling to 15 in 100 from RAG_M metres in.
//
// CLOCKS. Every motion here runs on the world clock at a standing rate: tremble, arrival, lock-on flash, a thread
// drawing itself, cooling, letting go, the rose's pulse. No motion reads the eye's place, the metres flown or the
// route's parameter. The rind's periods and phases are a hash of the site itself, the same on every seed; a visit
// sets how fast the edge grows (opts.rate: the rind's, the wall ferns' and the small ferns' clocks), which cold
// white the new frost wears (opts.cold), the snow crystal's one period and first phase (the fork 'snow'), the
// small ferns' own clocks (their forks) and each mote of the frost air (its ring, its turning, its twinkle: the
// fork 'frost-air'), each cloud of the frost glow (its place, size, colour's share and breath: the fork
// 'frost-glow'), the plate's first angle (the fork 'plate'), the lesser plates (their sites among those the laws allow, breadths, first angles, rates: the
// fork 'lesser-plates') and where in the slow noise of the net's rest the visit lies (the fork 'net-rest'). The
// ice's running light goes by the world clock alone (a bar's one in ICE_RUN_S seconds, a facet's one in FACET_RUN_S,
// each body at a phase of its own by its number). The plate turns once in PLATE_TURN_S seconds; the frost glow
// turns as one body at GLOW_TURN radians a second; a cloud of mist breathes at a rate of its own.
// WHAT THE EYE DOES CHANGE is only how light is drawn (declared here and in the world's head): sprites and ribbons
// face it; light thins with the length of the sight (GLSL_LAWS: THE HAZE, and less through the hollow's clear deep
// than through amber crystal), and a gold light on the cold side cools and shrinks with it (GLSL_LAWS: DISTANCE
// READS, by the light's own x and the sight's length); a feather, which is flat, gives up light as it turns edge on, and so does a thread
// of frost seen along its own sheet (THREAD_VERT: a quarter of its light within 1 degree of the sheet's plane, whole
// from 6); (round r11) a thread of frost seen along itself gives up its feather (END_ON_COS, END_ON); a face of
// faceted ice is clear by how squarely it is seen and takes a faint tint of the deep its bent sight runs to (FACE_*).
// THE ROSE IS NOT ON THIS LIST (round r7): its light is a law of its own place, the ring's number from the
// spark, its colour and the pulse, under the same haze as every lamp (the world's SPARK_VERT); it reads neither the
// eye's place nor the angle of the sight. THE ICE'S OWN LIGHT (rounds r8 to r10) thins with the haze as every lamp
// does (the mist behind the rose is gone at a stated length of sight) and reads nothing else of the eye but which of a body's faces are turned to it and, on faceted ice, the two laws of round r11 above. The frost
// air's motes and the frost glow's clouds are sprites like the lamps. Every lamp, thread and mote keeps
// its size in metres at every distance (no least size in dots).
// ONE SMOOTHING BY THE SCREEN'S DOT IS LEFT, declared here for the lead to rule on: inside a feather's ribbon
// (which lies in its sheet at its size in metres) the drawn pattern of barbs is smoothed where a barb is finer
// than a dot (THREAD_FRAG: a barb is drawn a dot wide and as much dimmer, and crowded barbs take their mean
// length). Nothing is placed, sized, moved or timed by it; without it the barbs sparkle.
// BY PLACE, NOT BY THE EYE: a lamp BESIDE THE WAY (within 30 m of the route's fixed line, fading out by 90 m) has a
// white hot centre and six short rays on its threads, and a thread there is a fine line without a sheath.
import * as THREE from 'three';
import { makeNoise, makeRng, makePath, hashSeed, clamp, lerp, smoothstep } from '../kit/core.js';

export const SIDE = 24, ROW = 12 * Math.sqrt(3), GAP = 20;
// sheets: three of lamps only far behind the entry (z -120, -100, -80), the A sheets z 20 to 540, the B sheets z 560 to 1000
export const K_BEHIND = [-6, -5, -4], K_FIRST = 1, K_FAULT = 28, K_LAST = 50;
export const SPARK = [0, 0, GAP * K_FAULT], RIM = 5;
export const BOUNDS = { x0: -400, x1: 430, y0: -300, y1: 300 };
export const isB = (k) => k >= K_FAULT;
export const hasSheet = (k) => (k >= K_FIRST && k <= K_LAST) || (k >= K_BEHIND[0] && k <= K_BEHIND[2]);
export const rowY = (j, k) => ROW * (j + (isB(k) ? 0 : 2 / 3));
export const siteXYZ = (c, j, k) => [12 * c, rowY(j, k), GAP * k];
export const siteKey = (c, j, k) => ((c + 512) * 1024 + (j + 512)) * 128 + (k + 16);
// the six steps to a site's neighbours, in half columns and rows: 0, 60, 120, 180, 240 and 300 degrees
export const STEPS = [[2, 0], [1, 1], [-1, 1], [-2, 0], [-1, -1], [1, -1]];

// THE STATES BY PLACE (the same on every seed: every noise has a constant of its own, never the visit's seed)
const faceNoise = makeNoise(hashSeed('where-the-lattice-grows:face')), wideNoise = makeNoise(hashSeed('where-the-lattice-grows:face-wide')), wallNoise = makeNoise(hashSeed('where-the-lattice-grows:far-wall'));
export const HOLLOW = { x: 84, z: 340, ax: 250, ay: 130, az: 250, ripple: 0.05 };
// THE COLD DEEP BEGINS AT THE HOLLOW'S FAR END (round r11): beyond it the space is the deep's (clear to the haze's law; the net thins out into it).
export const DEEP_FROM = HOLLOW.x + HOLLOW.ax;
// the line of the finished crystal behind the near wall: as it was within 40 m of the route's line; from there to
// 80 m off it takes a wider ripple of 20 m in y as well (the wall point's own distance from the fixed line)
const faceMemo = new Map();
export function xFinished(y, z) {
  const key = Math.round(y * 16) * 4096 + Math.round(z * 2); let v = faceMemo.get(key);
  if (v === undefined) {
    v = 36 + 8 * faceNoise.n2(y / 90, z / 90);
    const off = lineClear(v + 48, y, z, v + 48, y, z, 80);
    v += 20 * wideNoise.n2(y / 38, z / 150) * smoothstep(40, 80, off);
    faceMemo.set(key, v);
  }
  return v;
}
export const xFace = (y, z) => xFinished(y, z) + 48;
// THE BAY (round r6): the hollow reaches toward the entry in a second, smaller lobe, a whole ellipsoid that opens into
// the almond; its wall toward the open rank stands 50 m from the rank's line (so the young rind of that wall, 26 m
// thick, stands 24 to 50 m from the rank on its +X hand from about z 30 to z 130). The same on every seed.
export const BAY = { x: 112, y: 0, z: 80, ax: 62, ay: 58, az: 70 };
const bayDepth = (x, y, z) => {
  const B = BAY, u = (x - B.x) / B.ax, v = (y - B.y) / B.ay, w = (z - B.z) / B.az, rho = Math.hypot(u, v, w);
  if (rho < 1e-6) return -Math.min(B.ax, B.ay, B.az);
  return (rho - 1) / (Math.hypot(u / B.ax, v / B.ay, w / B.az) / rho);
};
// how far a place stands inside the crystal from the hollow's wall, in metres (under nothing: in the hollow): the
// lesser of its depth from the almond's wall and from the bay's
export function hollowDepth(x, y, z) {
  const H = HOLLOW, face = xFace(y, z), u = (x - face) / H.ax, v = y / H.ay, w = (z - H.z) / H.az, rho = Math.hypot(u, v, w), bay = bayDepth(x, y, z);
  if (rho < 1e-6) return Math.min(face - x, bay);
  const R = 1 + H.ripple * wallNoise.n3(x / 110, y / 110, z / 110), g = Math.hypot(u / H.ax, v / H.ay, w / H.az) / rho;
  return Math.min(Math.max(face - x, (rho - R) / g), bay);
}
export const FINISHED = 0, RIND = 1, RIND_LIVE = 2, BEYOND = 3;
export const stateOfDepth = (d) => (d > 48 ? FINISHED : d > 26 ? RIND : d > 0 ? RIND_LIVE : BEYOND);
export const stateAt = (x, y, z) => stateOfDepth(hollowDepth(x, y, z));
// THE NET'S EDGE TOWARD THE HOLLOW IS FINGERS AND BAYS (round r9; the same on every seed). The finished net does not end
// at the hollow's wall as at a plane: by a slow noise of the place (netBay) it is CUT BACK IN BAYS, EDGE_BAY[0] to
// EDGE_BAY[1] metres deep from the wall (how deep: a second, slower noise), and between the bays it reaches the wall in
// FINGERS (there the rind grows as on every wall). Over the EDGE_SOFT metres inside a bay's border the lamps THIN (of
// those at the very border EDGE_KEEP in 1 are built, by a hash of the site) and DIM (to EDGE_DIM of their light). It
// is a law of the hollow's own walls from where the bay of the way in is left behind (nothing of it before z
// EDGE_Z[0], whole from z EDGE_Z[1]); THE OPEN RANK AND ITS OWN ROWS ARE WHOLE: no site within RANK_CORE metres of the
// open rank's line is cut. netEdge: the share of its light the edge leaves a site (nothing: the site is not built).
const edgeNoise = makeNoise(hashSeed('where-the-lattice-grows:net-edge')), reachNoise = makeNoise(hashSeed('where-the-lattice-grows:net-reach'));
export const EDGE_BAY = [30, 90], EDGE_SOFT = 40, EDGE_Z = [150, 230], RANK_CORE = 40, EDGE_SHARE = -0.1, EDGE_KEEP = 0.3, EDGE_DIM = 0.35;
export function netBay(x, y, z) {
  const env = smoothstep(EDGE_Z[0], EDGE_Z[1], z); if (env <= 0) return 0;
  const t = clamp((edgeNoise.n3(x / 75, y / 55, z / 65) - EDGE_SHARE) / (0.6 - EDGE_SHARE), 0, 1); if (t <= 0) return 0;
  return env * Math.sqrt(t) * lerp(EDGE_BAY[0], EDGE_BAY[1], clamp(0.5 + 0.8 * reachNoise.n3(x / 160, y / 120, z / 140), 0, 1));
}
export function netEdge(c, j, k, x, y, z, depth) {
  if (Math.hypot(x, y) < RANK_CORE) return 1;
  const bay = netBay(x, y, z); if (bay <= 0) return 1;
  const e = depth - bay; if (e <= 0) return 0;
  const w = smoothstep(0, EDGE_SOFT, e), soft = smoothstep(0, 12, bay);
  if (siteHash(c, j, k, 521) > lerp(1, lerp(EDGE_KEEP, 1, w), soft)) return 0;
  return lerp(1, lerp(EDGE_DIM, 1, w), soft);
}
// THE NET HAS REST (round r10): A SLOW LAW OF PLACE OVER THE LATTICE. A slow noise of the place (REST_M metres a
// wave along x, y and z; the visit's stream 'net-rest' deals where in that noise the visit lies: `shift`) says how much
// of the net stands at a place: WHOLE where the noise is high, A THIRD of it where it is middling, NOTHING where it is
// low (REST_V: nothing under the first figure, a third between the second and the third, whole from the fourth, a
// smooth passage between). WHAT STANDS IS WHOLE RANKS: a site stands when its own rank's hash (the rank of sites that
// runs straight through the sheets at its column and row: the lines that carry the eye to the vanishing point) is
// under the place's share, so a thinned region is a few clear beams with the dark between them, and a void shows only
// the deep. THE OPEN RANK AND ITS OWN ROWS ARE WHOLE: within REST_WHOLE[0] metres of the open rank's line (the entry's
// axis, the last straight) everything stands, and the law comes in from there to REST_WHOLE[1] metres.
const restNoise = makeNoise(hashSeed('where-the-lattice-grows:net-rest'));
export const REST_M = [330, 290, 370], REST_V = [0.08, 0.22, 0.56, 0.66], REST_WHOLE = [2 * SIDE, 4 * SIDE];
export function netRest(x, y, z, shift) {
  const r = Math.hypot(x, y); if (r < REST_WHOLE[0]) return 1;
  const v = clamp(0.5 + 0.8 * restNoise.n3((x + shift[0]) / REST_M[0], (y + shift[1]) / REST_M[1], (z + shift[2]) / REST_M[2]), 0, 1);
  const share = v < REST_V[2] ? smoothstep(REST_V[0], REST_V[1], v) / 3 : 1 / 3 + (2 / 3) * smoothstep(REST_V[2], REST_V[3], v);
  return Math.max(share, 1 - smoothstep(REST_WHOLE[0], REST_WHOLE[1], r));
}
// does a site stand by that law? (its rank's own hash: the A sheets' ranks and the B sheets' are ranks of their own)
export const netStands = (c, j, k, x, y, z, shift) => siteHash(c, j, isB(k) ? 1 : 0, 531) < netRest(x, y, z, shift);
// THE NET DOES NOT END AT AN EDGE (round r11; the join sheet, ONE SPACE (4); the same on every seed). HOW FAR A SITE
// STANDS INSIDE THE NET from where the net ends (netIn: the lesser of its depth from the hollow's wall and of its
// distance from the cold bound, BOUNDS.x1, where the net ends toward the cold deep) says how much of the net there is
// at it: over the outermost NET_THIN metres THE LAMPS THIN (of those at the very end NET_KEEP in 1 stand, by a hash of
// the site, all of them from NET_THIN metres in), SHRINK (to NET_SMALL of their size at the end) AND COOL (frost white
// at the end, pale gold at NET_PALE of the way in, their own gold from NET_THIN metres in), and at NET_LIGHT of their
// light at the end; a thread takes the lesser share of its two ends for its light. THE OPEN RANK AND ITS OWN ROWS
// ARE WHOLE: within REST_WHOLE[0] metres of the open rank's line nothing of this law holds, and it comes in from
// there to REST_WHOLE[1] metres. netThin: the share (nothing at the end, 1 from NET_THIN metres in); netThinStands:
// does a site stand by it?; netThinColour: a lamp's or thread's colour by it (its own colour `col`, the pale one).
export const NET_THIN = 130, NET_KEEP = 0.22, NET_SMALL = 0.45, NET_PALE = 0.55, NET_LIGHT = 0.55;
export const netIn = (x, depth) => Math.min(depth, BOUNDS.x1 - x);
export function netThin(x, y, depth) {
  const t = smoothstep(0, NET_THIN, netIn(x, depth));
  return lerp(1, t, smoothstep(REST_WHOLE[0], REST_WHOLE[1], Math.hypot(x, y)));
}
export const netThinStands = (c, j, k, t) => t >= 1 || siteHash(c, j, k, 551) < lerp(NET_KEEP, 1, t);
export function netThinColour(col, pale, frost, t) {
  if (t >= 1) return col;
  const c = t < NET_PALE ? mix3(frost, pale, t / NET_PALE) : mix3(pale, col, (t - NET_PALE) / (1 - NET_PALE));
  return scale3(c, lerp(NET_LIGHT, 1, t));
}
// LAMPS DIFFER (round r10), by a hash of the site: LAMP_GREAT of them are great soft lamps (LAMP_GREAT_SIZE common
// lamps broad, at LAMP_GREAT_LIGHT of the light: a wide soft glow, its core no broader than two common ones), the rest
// are small (LAMP_SMALL of a common lamp, most of them near the lesser figure)
export const LAMP_GREAT = 0.03, LAMP_GREAT_SIZE = [3, 4], LAMP_GREAT_LIGHT = 0.5, LAMP_SMALL = [0.5, 1];
export function lampSize(c, j, k) {
  const h = siteHash(c, j, k, 541);
  return h < LAMP_GREAT ? lerp(LAMP_GREAT_SIZE[0], LAMP_GREAT_SIZE[1], h / LAMP_GREAT) : lerp(LAMP_SMALL[0], LAMP_SMALL[1], ((h - LAMP_GREAT) / (1 - LAMP_GREAT)) ** 2);
}
// the one row that is never built: the B sites on the open rank's own line (the spark's node and the row behind it)
export const onSparkRow = (c, j, k) => isB(k) && c === 0 && j === 0;

// every site of sheet k inside the built bounds that stands in the crystal (finished or rind), with its depth; the
// hollow's sites are not listed (the ferns are figures of their own)
export function latticeSites(k) {
  const out = [], z = GAP * k;
  const j0 = Math.ceil(BOUNDS.y0 / ROW - 1), j1 = Math.floor(BOUNDS.y1 / ROW + 1);
  for (let j = j0; j <= j1; j++) {
    const y = rowY(j, k);
    if (y < BOUNDS.y0 || y > BOUNDS.y1) continue;
    const odd = j & 1;
    let c = Math.ceil(BOUNDS.x0 / 12); if ((c & 1) !== odd) c++;
    for (; 12 * c <= BOUNDS.x1; c += 2) {
      if (onSparkRow(c, j, k)) continue;
      const x = 12 * c, depth = hollowDepth(x, y, z), state = stateOfDepth(depth);
      if (state !== BEYOND) out.push({ c, j, k, x, y, z, state, depth });
    }
  }
  return out;
}

// THE SNOW CRYSTAL's place (round r6; the same on every seed): the sheet z 420, its centre the lattice site
// (204, -6.93, 420) in the hollow's middle depth; its frost has a pitch of its own, a quarter of the lattice's.
export const SNOW = { k: 21, c: 17, j: -1, pitch: SIDE / 4 };
export const SNOW_AT = [12 * SNOW.c, ROW * (SNOW.j + 2 / 3), GAP * SNOW.k];
// THE ROUTE (round r6, the lead's order: anew between the fixed ends), laid from places:
//  (1) down the open rank for RANK_OUT metres (the entry's first 40 m stand);
//  (2) one wide arc (ARC_OUT: the entry's level frame is left gently) to the left onto ANOTHER DIRECTION OF THE LATTICE, the rank of nodes that runs 36 m across for
//      every 20 m along (60.9 degrees off +Z), through the ranks and through the bay's young rind into the hollow;
//  (3) an arc back onto +Z and up the hollow, face on to the crystal's sheet, before the arm that points at the near
//      wall, from Y_HIGH over the crystal's centre down to PASS_Y under it;
//  (4) a wide arc (ARC_PASS) to the right onto THE PASS: it comes round along that arm, PASS_Y under its spine, and
//      meets the middle of the slab before the crystal's sheet (30 m before it) heading -X where the last turn begins;
//  (5) ONE turn to the left, of the radius the places leave (from the pass slab to where the last rank begins: 102 m),
//      through the near wall's young rind and onto the open rank; it pierces the crystal's sheet 66 m from the
//      nearest tip, inside the wall;
//  (6) the last LAST_M metres straight and level into the spark.
// THE LAST RANK (the join sheet: the last 60 m straight and level): the turn meets the rank's axis LEAD_M before the
// last LAST_M metres and a second route point stands on the axis where they begin, so that the kit's curve (ruled
// between two points by those two and one more on either side) lies on the axis itself, to the last digit, for the
// whole of the last LAST_M metres.
// THE TYPED MEASURES OF THE LINE, each as a measure of the place (the line's length and every place along it fall
// where these put them):
//  RANK_OUT 40: two gaps of the sheets: the line holds the open rank through its first two sheets (z 20, z 40).
//  ARC_OUT 80: four gaps of the sheets: the line's one turn out of the rank is spread over the sheets z 40 to z 110
//    and is done 24 m of way before the line goes through the bay's wall, so the wall is crossed on the straight slant.
//  ARC_R 50: two and a half gaps, the tightest turn of the line (the pace slows most there): it brings the slant onto
//    +Z at z 212, the crystal's own breadth (its 216 m from tip to tip, less a frost site) before the crystal's sheet.
//  ARC_PASS 70: the reach of the near arm that the pass runs under: from the leg up the hollow (x 172: this radius and
//    the last turn's together, typed nowhere; 32 m out from the crystal's centre) round to where the last turn begins
//    (x 102, one frost site short of the arm's tip at x 96).
//  Y_HIGH 12 and PASS_Y -12: twice the frost net's pitch (SNOW.pitch 6 m) over the crystal's centre and as much under
//    it: the leg up the hollow comes down through the centre's own height, and the pass runs two frost sites under
//    the arm's spine, below its spurs (one site long).
export const RANK_OUT = 40, ARC_OUT = 80, ARC_R = 50, ARC_PASS = 70, LAST_M = 64, LEAD_M = 4, Y_HIGH = 12, PASS_Y = -12;
// the direction the line crosses the ranks by: a rank of the lattice itself (36 m in x for every sheet's 20 m)
export const SLANT = Math.atan2(3 * 12, GAP);
// the pass: the slab before the crystal's sheet, and the sheet behind that slab (the first the line pierces after the pass)
export const PASS_Z = GAP * (SNOW.k - 1.5), PASS_SHEET_Z = GAP * (SNOW.k - 1);
// the last rank's line begins where the route's turn meets the open rank's axis (a place the route is laid from)
export const RANK_Z = SPARK[2] - LAST_M - LEAD_M;
// the last turn's radius: what the places leave between the pass slab and the last rank
export const TURN_R = RANK_Z - PASS_Z;
export const ROUTE_POINTS = (() => {
  const pts = [], R = ARC_R, RP = ARC_PASS, A = SLANT, R2 = TURN_R, xRun = R2 + RP, zArc = PASS_Z - RP, y0 = SNOW_AT[1];
  const add = (x, z) => pts.push([x, 0, z]);
  for (let i = 0; i <= 4; i++) add(0, RANK_OUT * i / 4);
  const arc = (cx, cz, r, a0, a1, n) => { for (let i = 1; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; add(cx + r * Math.cos(a), cz + r * Math.sin(a)); } };
  // left onto the slant (angles about the arc's centre, measured from +X toward +Z)
  arc(ARC_OUT, RANK_OUT, ARC_OUT, Math.PI, Math.PI - A, 8);
  const sx = Math.sin(A), sz = Math.cos(A), x1 = ARC_OUT * (1 - Math.cos(A)), z1 = RANK_OUT + ARC_OUT * Math.sin(A), x2 = xRun - R * (1 - Math.cos(A)), run = (x2 - x1) / sx, z2 = z1 + run * sz;
  for (let i = 1; i <= 6; i++) add(x1 + sx * run * i / 6, z1 + sz * run * i / 6);
  arc(xRun - R, z2 + R * Math.sin(A), R, -A, 0, 6);
  const z3 = z2 + R * Math.sin(A);
  for (let i = 1; i <= 8; i++) add(xRun, z3 + (zArc - z3) * i / 8);
  arc(xRun - RP, zArc, RP, 0, Math.PI / 2, 11);
  arc(R2, PASS_Z + R2, R2, -Math.PI / 2, -Math.PI, 14);
  // on the axis: where the last LAST_M metres begin, then four even steps to the spark
  for (let i = 0; i <= 4; i++) add(0, SPARK[2] - LAST_M * (1 - i / 4));
  // height: level on the rank; up to Y_HIGH over the crystal's centre along the slant; down to PASS_Y under it along the leg
  // up the hollow; held over the first tenth of the last turn and eased up to the rank (no slope where the turn meets it)
  let onTurn = false;
  for (const q of pts) {
    if (q[2] >= PASS_Z - 1e-6 && q[0] <= R2 + 1e-6) onTurn = true;
    if (q[0] < 1e-6) { q[1] = 0; continue; }
    const turned = Math.atan2(R2 - q[0], PASS_Z + R2 - q[2]) / (Math.PI / 2);
    q[1] = onTurn ? (y0 + PASS_Y) * (1 - smoothstep(0.1, 1, clamp(turned, 0, 1))) : lerp((y0 + Y_HIGH) * smoothstep(z1, z3, q[2]), y0 + PASS_Y, smoothstep(z3, PASS_Z, q[2]));
  }
  return pts;
})();

// ---------------------------------------------------------------- distances (the count of clear air reads these)
const frac = (v) => v - Math.floor(v);
// in the plane of sheet k: the distance from (x, y) to the nearest thread axis of the sheet's whole net
export function distanceToNet(x, y, k) {
  const v = y - rowY(0, k), s = Math.sqrt(3) / 2;
  const d0 = Math.abs(frac(v / ROW + 0.5) - 0.5), d1 = Math.abs(frac((s * x - 0.5 * v) / ROW + 0.5) - 0.5), d2 = Math.abs(frac((s * x + 0.5 * v) / ROW + 0.5) - 0.5);
  return Math.min(d0, d1, d2) * ROW;
}
// the nearest thread axis of the whole lattice (every sheet's whole net, lit or not) to a point
export function distanceToLattice(x, y, z) {
  let best = Infinity; const kn = Math.round(z / GAP);
  for (let k = kn - 1; k <= kn + 1; k++) {
    if (!hasSheet(k)) continue;
    let dp = distanceToNet(x, y, k);
    // the spark's own six threads begin at the opening's rim: inside that rim the nearest of them is one of six points on it
    if (k === K_FAULT && Math.hypot(x, y) < RIM) { dp = Infinity; for (let a = 0; a < 6; a++) dp = Math.min(dp, Math.hypot(x - RIM * Math.cos(a * Math.PI / 3), y - RIM * Math.sin(a * Math.PI / 3))); }
    const d = Math.hypot(dp, z - GAP * k); if (d < best) best = d;
  }
  return best;
}
// the nearest node of the whole lattice to a point
export function distanceToNode(x, y, z) {
  let best = Infinity; const kn = Math.round(z / GAP);
  for (let k = kn - 1; k <= kn + 1; k++) {
    if (!hasSheet(k)) continue;
    const jn = Math.round((y - rowY(0, k)) / ROW);
    for (let j = jn - 1; j <= jn + 1; j++) {
      const cn = Math.round(x / 12);
      for (let c = cn - 2; c <= cn + 2; c++) {
        if (((c ^ j) & 1) || onSparkRow(c, j, k)) continue;
        const d = Math.hypot(x - 12 * c, y - rowY(j, k), z - GAP * k); if (d < best) best = d;
      }
    }
  }
  return best;
}

// THE ROUTE'S LINE as a fixed curve of the world: samples every 0.25 m of the kit's own curve through ROUTE_POINTS,
// and a coarse set every 4 m for a first sieve. lineClear gives the least distance from a segment to that line.
// R.box is the line's own extent (least and greatest x, y, z of its samples): the first sieve of every test below.
let ROUTE = null;
const routeBox = (R) => { const b = [Infinity, -Infinity, Infinity, -Infinity, Infinity, -Infinity]; for (let i = 0; i < R.n; i++) for (let a = 0; a < 3; a++) { const v = R.fine[i * 3 + a]; if (v < b[2 * a]) b[2 * a] = v; if (v > b[2 * a + 1]) b[2 * a + 1] = v; } R.box = b; return R; };
// is a ball of radius r about (x, y, z) wholly outside the line's box?
const offBox = (R, x, y, z, r) => { const b = R.box; return x < b[0] - r || x > b[1] + r || y < b[2] - r || y > b[3] + r || z < b[4] - r || z > b[5] + r; };
export const offRouteBox = (x, y, z, r) => offBox(routeLine(), x, y, z, r);
const routeBegin = () => { const path = makePath(ROUTE_POINTS), n = Math.floor(path.length / 0.25); return { path, fine: new Float32Array((n + 1) * 3), n: n + 1 }; };
const routeFill = (R, from, to, v) => { for (let i = from; i < to; i++) { R.path.posAtDist(Math.min(R.path.length, i * 0.25), v); R.fine[i * 3] = v.x; R.fine[i * 3 + 1] = v.y; R.fine[i * 3 + 2] = v.z; } };
export function routeLine() {
  if (ROUTE) return ROUTE;
  const R = routeBegin(); routeFill(R, 0, R.n, new THREE.Vector3());
  return (ROUTE = routeBox(R));
}
// the same line, sampled in pieces with a breath between them: a build calls this before anything reads the line
export async function primeRouteLine(ctx) {
  if (ROUTE) return ROUTE;
  const R = routeBegin(), v = new THREE.Vector3();
  await ctx.yield();
  for (let i = 0; i < R.n; i += 100) { routeFill(R, i, Math.min(R.n, i + 100), v); await ctx.yield(); }
  return (ROUTE = routeBox(R));
}
const segPoint = (px, py, pz, ax, ay, az, bx, by, bz) => {
  const ux = bx - ax, uy = by - ay, uz = bz - az, l2 = ux * ux + uy * uy + uz * uz;
  const t = l2 > 0 ? clamp(((px - ax) * ux + (py - ay) * uy + (pz - az) * uz) / l2, 0, 1) : 0;
  const dx = px - ax - ux * t, dy = py - ay - uy * t, dz = pz - az - uz * t;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
};
// least distance from the segment A to B to the route's line; `far` is returned at once when the segment is plainly further off
export function lineClear(ax, ay, az, bx, by, bz, far = 40) {
  const R = routeLine(), f = R.fine, half = 0.5 * Math.hypot(bx - ax, by - ay, bz - az), mx = (ax + bx) / 2, my = (ay + by) / 2, mz = (az + bz) / 2;
  if (offBox(R, mx, my, mz, far + half)) return far;
  // a first sieve every 4 m of the line; the fine samples are read only round the coarse ones that are near enough
  let best = Infinity; const reach = far + half + 4.5, reach2 = reach * reach;
  for (let i = 0; i < R.n; i += 16) {
    const dx = f[i * 3] - mx, dy = f[i * 3 + 1] - my, dz = f[i * 3 + 2] - mz;
    if (dx * dx + dy * dy + dz * dz > reach2) continue;
    for (let q = Math.max(0, i - 8); q < Math.min(R.n, i + 9); q++) { const d = segPoint(f[q * 3], f[q * 3 + 1], f[q * 3 + 2], ax, ay, az, bx, by, bz); if (d < best) best = d; }
  }
  return Math.min(best, far);
}

// least distance from a point to the route's line, out to `far`: the coarse samples first, then the fine ones round
// every coarse sample that could hold the least
export function pointClear(x, y, z, far = 90) {
  const R = routeLine(), f = R.fine;
  if (offBox(R, x, y, z, far)) return far;
  // squared distances throughout (the plain sum is many times cheaper than Math.hypot, and this is asked for every thread)
  let best2 = Infinity;
  for (let i = 0; i < R.n; i += 16) { const dx = f[i * 3] - x, dy = f[i * 3 + 1] - y, dz = f[i * 3 + 2] - z, d2 = dx * dx + dy * dy + dz * dz; if (d2 < best2) best2 = d2; }
  const best = Math.sqrt(best2);
  if (best > far + 2.1) return far;
  let fine2 = best2; const near2 = (best + 4.2) * (best + 4.2);
  for (let i = 0; i < R.n; i += 16) {
    const dx = f[i * 3] - x, dy = f[i * 3 + 1] - y, dz = f[i * 3 + 2] - z;
    if (dx * dx + dy * dy + dz * dz > near2) continue;
    for (let q = Math.max(0, i - 8); q < Math.min(R.n, i + 9); q++) { const ex = f[q * 3] - x, ey = f[q * 3 + 1] - y, ez = f[q * 3 + 2] - z, d2 = ex * ex + ey * ey + ez * ez; if (d2 < fine2) fine2 = d2; }
  }
  const fine = Math.sqrt(fine2);
  return Math.min(fine, far);
}

// ---------------------------------------------------------------- clocks
// a hash of the site itself, 0 to 1 (never the visit's seed)
export function siteHash(c, j, k, salt) {
  let h = Math.imul(c + 512, 73856093) ^ Math.imul(j + 512, 19349663) ^ Math.imul(k + 64, 83492791) ^ Math.imul(salt + 1, 2654435761);
  h = Math.imul(h ^ (h >>> 15), 2246822519); h = Math.imul(h ^ (h >>> 13), 3266489917);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
// a clock is [period s, phase 0..1, birth share, let-go share]; STANDING never begins and never ends
export const STANDING = [0, 0, 0, 0];
export const ARRIVE_S = 2.5, ARRIVE_M = 30, LEAVE_S = 2, LEAVE_M = 6, WHITE_S = 5, COOL_S = 12, DRAW_S = 1.2;
// frost white only while it is younger than WHITE_S; then its colour goes to its cooled one in TINT_S (its feather melts back over the whole COOL_S)
export const TINT_S = 4, ICE_S = 16;
// a young thread's feather: barbs at 60 degrees, FEATHER_M long at birth (so that the feathers of a triangle's three
// threads nearly close it: a pane of frost), one every BARB_M of the spine; shortened by place near the route (featherCap)
export const FEATHER_M = 6, BARB_M = 1.2;
// NO GROWING FROST BY THE GATE: within GATE_M of the last rank's line (from where the route comes back onto the open
// rank, to the spark) the rind stands still, no frost figure is built (dark
// within GATE_M, whole from one and a half times that): what surrounds the spark is darker and quieter than it
export const GATE_M = 90;
export const lastRankZ = () => RANK_Z;
export const gateDist = (x, y, z) => Math.hypot(x, y, z - clamp(z, lastRankZ(), SPARK[2]));
export const byGate = (x, y, z) => gateDist(x, y, z) < GATE_M;
// the live rind: absent for 15 in 100 of its period, then it comes in, locks on, cools, stands, and lets go at the period's
// end. Its period is 36 to 60 s (round r6; r4: 56 to 92 s, r1: 24 to 40 s), so that at any clock about one live site in
// ten is white, four in ten are ice blue and the rest stand cooled: a wall that is seen to grow, not a wall of white wire
// THE WALL'S BORDER IS RAGGED GROWTH (round r8): THE NEARER THE DARK, THE YOUNGER. A live site's share of its period
// for which it is away is a law of its own depth from the hollow's wall (`edge`, metres): RAG_AWAY of the period at
// the very border, falling to 15 in 100 from RAG_M metres in. So no wall of the hollow begins as a full rank at a line: its outermost sites have only just
// come when they let go again (always white or ice blue), and the lamps thicken inward over RAG_M metres.
export const RAG_M = 20, RAG_AWAY = 0.75;
export function rindClock(c, j, k, rate, edge = RAG_M) {
  if (byGate(12 * c, rowY(j, k), GAP * k)) return STANDING;
  const T = (36 + 24 * siteHash(c, j, k, 1)) / rate;
  // (a site is never away for so long that it could not come in, lock on and let go within its period)
  const away = Math.min(lerp(RAG_AWAY, 0.15, smoothstep(0, RAG_M, edge)), 1 - (ARRIVE_S + LEAVE_S + 3) / T);
  return [T, siteHash(c, j, k, 2), away, 1 - (LEAVE_S + 0.2) / T];
}
// where a site stands on its clock at a world time: the mirror of the shaders' clockAges and of what they do with it
export function growthState(clock, time) {
  if (!(clock[0] > 0)) return { age: 1000, gone: -1, present: true, coming: 1, leaving: 0, white: 0 };
  const cyc = frac(time / clock[0] + clock[1]), age = (cyc - clock[2]) * clock[0], gone = (cyc - clock[3]) * clock[0];
  const coming = clamp(1 + age / ARRIVE_S, 0, 1), leaving = clamp(gone / LEAVE_S, 0, 1);
  return { age, gone, present: age >= 0 && gone < LEAVE_S, coming, leaving, white: age >= 0 ? 1 - smoothstep(WHITE_S, WHITE_S + TINT_S, age) : 1 };
}

// ---------------------------------------------------------------- the fern figures
// A fern lives in the sheets k0 - half to k0 + half and stands INWARD from a wall of the hollow. In each sheet it
// is a STEM of sites running from the wall along one row of the net (step a of STEPS: 0 along +X from the near
// wall, 3 along -X from the far wall, 4 and 5 down the 60 degree rows from the roof, 1 and 2 up them from the
// floor; one row, or the RIBBON of two rows with every thread between them) and FRONDS that leave the stem at 60
// degrees to either side, leaning the way the stem grows, with branchlets parallel to the stem. The middle pane is
// the longest; each pane away from it is shorter by taper(n) metres, so the whole is one tapering figure, broad
// at the wall and pointed in the dark. Three ranks of weight: 0 the stem, 1 a frond, 2 a branchlet.
// A FIGURE OF PANES (rule.panes; kept from round r3, not dealt in r4): a front pane in the sheet k0, the newest
// and the largest; each pane behind it (k0 + 1, k0 + 2, ...) is a third
// smaller in stem and fronds than the one before and has no braid (one stem row of common weight). Every site
// carries its pane's number (0 the front).
// rule: { k0, half or panes, root: [c, j] (a site of the stem's row in the crystal behind the wall), a, ribbon, len (metres
//   from the wall) or tip (the limit along the stem's own direction, world metres), taper, shape: 'mixed' | 'broad'
//   | 'needles' | 'sprig', period: [lo, hi], rate }
// Returns { sites: [{ c, j, k, x, y, z, clock, rank }], threads: [[a, b, rank]] } where a is an index into sites and
// b an index or, for a thread that joins the fern to the rind, the rind site's [c, j, k]. Every site is a lattice
// site in the hollow. The stem stands; its last two sites and every frond with its branchlets live on clocks.
export function fernFigure(rule, rng) {
  const sites = [], index = new Map(), threads = [], groups = [];
  const { k0, shape, rate } = rule, a = rule.a ?? 0, ribbon = !!rule.ribbon, great = rule.panes > 0, half = great ? 0 : rule.half;
  const S = (t) => STEPS[(((a + t) % 6) + 6) % 6], st = S(0), ux = st[0] * 12 / SIDE, uy = st[1] * ROW / SIDE;
  const along = (c, j, k) => 12 * c * ux + rowY(j, k) * uy;
  const ph0 = rng(), golden = 0.6180339887;
  const group = () => { const g = { T: lerp(rule.period[0], rule.period[1], rng()) / rate, ph: frac(ph0 + groups.length * golden), members: [] }; groups.push(g); return g; };
  const put = (c, j, k, rank) => {
    const key = siteKey(c, j, k); if (index.has(key)) return -1;
    const [x, y, z] = siteXYZ(c, j, k); if (stateAt(x, y, z) !== BEYOND || onSparkRow(c, j, k)) return -1;
    sites.push({ c, j, k, x, y, z, clock: STANDING, rank, weight, pane: great ? k - k0 : -1 }); index.set(key, sites.length - 1); return sites.length - 1;
  };
  const find = (c, j, k) => { const i = index.get(siteKey(c, j, k)); return i === undefined ? -1 : i; };
  const join = (i, o, rank) => threads.push([i, o, rank]);
  // the first site of the hollow along the stem's row from a root in the crystal
  const first = (c, j, k) => { for (let n = 0; n < 80; n++, c += st[0], j += st[1]) if (stateAt(12 * c, rowY(j, k), GAP * k) === BEYOND) return n ? [c, j] : null; return null; };
  const w0 = first(rule.root[0], rule.root[1], k0); if (!w0) return { sites, threads };
  const span = rule.tip !== undefined ? rule.tip - along(w0[0], w0[1], k0) + 12 : rule.len, tip = along(w0[0], w0[1], k0) - 12 + span, F0 = clamp(span / 132, 0.3, 1.6);
  const taper = great ? (n) => span * (1 - (2 / 3) ** n) : rule.taper ?? ((n) => SIDE * n);
  // a fern's weight goes with its size: the lamps and threads of a greater fern are larger and wider
  const weight = clamp(F0, 0.8, 1.5);
  for (let k = k0 - half; k <= k0 + (great ? rule.panes - 1 : half); k++) {
    if (!hasSheet(k) || k < K_FIRST) continue;
    // the older panes of a figure of panes: a third smaller again and again, one stem row, no braid
    const shrink = Math.abs(k - k0), F = great ? F0 * (2 / 3) ** shrink : F0, less = great ? 0 : shrink, rib = ribbon && !(great && shrink > 0), stemRank = (great && shrink > 0) || shape === 'sprig' ? 1 : 0;
    const roots = rib ? [rule.root, [rule.root[0] + S(5)[0], rule.root[1] + S(5)[1]]] : [rule.root], stems = [];
    for (const root of roots) {
      const w = first(root[0], root[1], k), line = []; if (!w) { stems.push(null); continue; }
      const live = shape === 'sprig' ? group() : null;
      for (let c = w[0], j = w[1], n = 0; along(c, j, k) <= tip - taper(shrink) + 1e-6; c += st[0], j += st[1], n++) {
        const i = put(c, j, k, stemRank); if (i < 0) break;
        join(i, n ? line[n - 1] : [c - st[0], j - st[1], k], stemRank);
        line.push(i); if (live) live.members.push({ i, order: n + 1 });
      }
      // the stem's tip: its last two sites come and go on a clock of their own, like a frond
      if (!live && line.length > 2) { const g = group(); g.members.push({ i: line[line.length - 2], order: 1 }, { i: line[line.length - 1], order: 2 }); }
      stems.push({ line, standing: live ? line.length : Math.max(0, line.length > 2 ? line.length - 2 : line.length), live });
    }
    // the ribbon: every thread between its two rows, and to the rind where the rows begin
    if (rib && stems[0] && stems[1]) for (const i of stems[0].line) {
      const s = sites[i];
      for (const t of [5, 4]) { const c = s.c + S(t)[0], j = s.j + S(t)[1], o = find(c, j, k); if (o >= 0) join(i, o, 0); else if (stateAt(12 * c, rowY(j, k), GAP * k) !== BEYOND) join(i, [c, j, k], 0); }
    }
    // the fronds: to one side from the first row, to the other from the second (or from the same row)
    const sides = [[stems[0], 1], [rib ? stems[1] : stems[0], 5]];
    for (const [stem, turn] of sides) {
      if (!stem) continue;
      const n = stem.standing, grown = [], fs = S(turn);
      for (let idx = 0; idx < n; idx++) {
        const t = n > 1 ? idx / (n - 1) : 0, s = sites[stem.line[idx]];
        let len = shape === 'needles' ? Math.round(lerp(6, 2, t) * F) : shape === 'broad' ? Math.max(2, Math.round(3 * F)) : shape === 'sprig' ? (rng() < 0.7 ? 1 : 0) : Math.round(lerp(4, 1.5, t) * F) - (idx & 1 ? 1 + (rng() < 0.35 ? 1 : 0) : 0);
        if (shape === 'broad' && idx % 3 === 2) len = 0;
        len = Math.max(shape === 'mixed' ? 1 : 0, len) - less;
        if (shape === 'broad' && idx % 3 === 1) len = grown[idx - 1] ? grown[idx - 1].length : 0;
        const g = shape === 'sprig' ? stem.live : shape === 'broad' && idx % 3 === 1 && grown[idx - 1] && grown[idx - 1].g ? grown[idx - 1].g : len > 0 ? group() : null;
        const frond = []; frond.g = g; let prev = stem.line[idx];
        for (let m = 1; m <= len; m++) {
          const i = put(s.c + fs[0] * m, s.j + fs[1] * m, k, 1); if (i < 0) break;
          join(i, prev, 1); g.members.push({ i, order: shape === 'sprig' ? 10 + m : 2 * m - (shape === 'broad' && idx % 3 === 1 ? 0 : 1) }); frond.push(i); prev = i;
        }
        grown.push(frond);
      }
      // branchlets of the mixed fern: one site on along the stem's own direction from a frond's site wherever the net is still free there, sometimes a second
      if (shape === 'mixed') for (const frond of grown) for (let m = 0; m < frond.length - 1; m++) {
        const s = sites[frond[m]], two = rng() < 0.4; let prev = frond[m];
        for (let q = 1; q <= (two ? 2 : 1); q++) { const i = put(s.c + st[0] * q, s.j + st[1] * q, k, 2); if (i < 0) break; join(i, prev, 2); frond.g.members.push({ i, order: 2 * (m + 1) + 0.25 * q }); prev = i; }
      }
    }
  }
  // the clocks: a frond grows site after site over the first six tenths of its period, stands, and lets go from the tip back in the last tenth
  for (const g of groups) {
    g.members.sort((p, q) => p.order - q.order);
    const n = g.members.length, bMin = (ARRIVE_S + 0.3) / g.T, gMax = 1 - (LEAVE_S + 0.2) / g.T;
    g.members.forEach((m, r) => { const t = n > 1 ? r / (n - 1) : 0; sites[m.i].clock = [g.T, g.ph, lerp(bMin, 0.6, t), lerp(gMax, Math.min(0.9, gMax), t)]; });
  }
  return { sites, threads };
}

// ---------------------------------------------------------------- THE SNOW CRYSTAL (round r6)
// ONE great snow crystal of frost in ONE sheet (SNOW.k), about the centre SNOW_AT: SIX ARMS on the sheet's own six
// directions (0, 60, ... 300 degrees), drawn on a frost net of SNOW.pitch metres (a quarter of the lattice's side).
// AN ARM IS A FEATHER: a straight SPINE of 18 or 19 frost sites (108 or 114 m); BRANCHES leave it in pairs at 60
// degrees to either hand from every second site, the longest (5 sites) about a third of the way out, shorter toward
// the centre and toward the tip, so that an arm's outline is a long leaf; one-site SPURS on the sites between; on
// every branch BRANCHLETS of one site that run with the spine, on the branch's outer sites. A branch is always
// shorter than its place on the spine is far from the centre, so no two arms' frost can meet. At the centre A KNOT:
// the six first threads of the spines and the small hexagon that joins their ends.
// THE SIX ARMS FOLLOW ONE LAW and are dealt a little unlike by a hash of the arm and the site (never the visit's
// seed: the crystal is seen from the entry, a part of the join): the spine's length, a longer branch one site short here and
// there, which branchlets have grown.
// IT GROWS AT ITS TIPS ONLY, on the world clock: the last two sites of every spine and the last site of every branch
// of three sites and more come in from the dark, lock on with a flash, stand, let go and come again, each on the
// crystal's ONE period (SNOW_T seconds, dealt once by the visit) at a phase of its own (the golden step from tip to
// tip). Everything else stands for good, so the figure is whole at every clock.
// Ranks: 0 a spine, 1 a branch, 2 a spur or a branchlet, 3 the knot.
export const SNOW_T = [15, 20], SNOW_CLEAR = 40;
// the six directions in steps of the frost net (a along 0 degrees, b along 60 degrees)
const HEX = [[1, 0], [0, 1], [-1, 1], [-1, 0], [0, -1], [1, -1]];
const armHash = (d, s, m, salt) => siteHash(d * 37 + s, m, 0, 200 + salt);
export const armSites = (d) => (armHash(d, 0, 0, 1) < 0.5 ? 18 : 19);
// the leaf's law: how many sites the branch at spine site s of an arm of N sites has
const branchLen = (s, N) => Math.max(0, Math.min(s - 1, 5, Math.ceil((N - s) / 2.5)));
// THE SAME LAW AT ANOTHER PLACE AND SIZE (round r8, the small flakes): `flake` = { at: its centre, pitch: its frost
// net's pitch in metres, arm: the sites of each spine, salt: its own number in the hashes that deal the arms unlike }.
// Without `flake` the figure is the great crystal itself, to the site.
export function snowFigure(rng, flake = null) {
  const sites = [], index = new Map(), threads = [], tips = [], P = flake ? flake.pitch : SNOW.pitch, [cx, cy, cz] = flake ? flake.at : SNOW_AT;
  const own = flake ? 6 * flake.salt : 0;
  const T = rng ? lerp(SNOW_T[0], SNOW_T[1], rng()) : 0, ph0 = rng ? rng() : 0, golden = 0.6180339887;
  // a frost site by its steps (a, b) from the centre; grow: the unit direction it grew along (it comes in from beyond)
  const put = (a, b, rank, arm, grow) => {
    const key = (a + 64) * 256 + (b + 64); if (index.has(key)) return index.get(key);
    sites.push({ a, b, x: cx + P * (a + b / 2), y: cy + P * b * Math.sqrt(3) / 2, z: cz, rank, arm, clock: STANDING, grow: [(grow[0] + grow[1] / 2), grow[1] * Math.sqrt(3) / 2] });
    index.set(key, sites.length - 1); return sites.length - 1;
  };
  const join = (i, o, rank) => threads.push([i, o, rank]);
  const centre = put(0, 0, 3, -1, [0, 0]), ring = [], spines = [], ribs = [];
  for (let d = 0; d < 6; d++) {
    const E = HEX[d], N = flake ? flake.arm : armSites(d), spine = [centre];
    for (let n = 1; n <= N; n++) { const i = put(E[0] * n, E[1] * n, n === 1 ? 3 : 0, d, E); join(i, spine[n - 1], n === 1 ? 3 : 0); spine.push(i); }
    ring.push(spine[1]); spines.push(spine);
    // the spine's own tip: its last two sites, the outer one coming after the inner and leaving before it
    tips.push([spine[N - 1], spine[N]]);
    for (const turn of [1, 5]) {
      const F = HEX[(d + turn) % 6];
      for (let s = 2; s <= N - 2; s++) {
        if (s & 1) { if (s >= 3) { const i = put(E[0] * s + F[0], E[1] * s + F[1], 2, d, F); join(i, spine[s], 2); } continue; }
        let len = branchLen(s, N); if (len >= 3 && armHash(d + own, s, turn, 2) < 0.2) len--;
        let prev = spine[s]; const rib = [prev];
        for (let m = 1; m <= len; m++) {
          const i = put(E[0] * s + F[0] * m, E[1] * s + F[1] * m, 1, d, F); join(i, prev, 1); prev = i; rib.push(i);
          // a branchlet: one site on along the spine's own direction, from the branch's second site outward
          if (m >= 2 && armHash(d + own, s, m * 8 + turn, 3) < 0.85) { const q = put(E[0] * (s + 1) + F[0] * m, E[1] * (s + 1) + F[1] * m, 2, d, E); join(q, i, 2); }
        }
        if (len >= 3) { tips.push([prev]); ribs.push(rib); }
      }
    }
  }
  for (let d = 0; d < 6; d++) join(ring[d], ring[(d + 1) % 6], 3);
  // the tips' clocks: away only while a site leaves and comes; a spine's outer site comes 3 s after its inner one has
  // locked on and has gone before the inner one lets go
  if (T > 0) tips.forEach((tip, n) => {
    const ph = frac(ph0 + n * golden), born = (ARRIVE_S + 0.3) / T, gone = 1 - (LEAVE_S + 0.2) / T;
    sites[tip[0]].clock = [T, ph, born, gone];
    if (tip.length > 1) sites[tip[1]].clock = [T, ph, born + (ARRIVE_S + 0.5) / T, gone - (LEAVE_S + 0.2) / T];
  });
  // spines: each arm's spine from the centre out; ribs: each branch of three sites and more, from its spine site out
  return { sites, threads, tips, period: T, spines, ribs };
}
// A FROST FERN OF THE WALLS (round r6): one small arm of the crystal's own kind, on the same frost net, rooted on a
// site of a wall (`base`, a standing site of the lattice) and growing into the hollow along direction d of the sheet:
// a spine of N frost sites, branch pairs on every second site (the longest near the root, one site at the tip), a
// spur between. Its last two spine sites come and go on a clock of its own (clock: [period s, phase]). Only sites
// that stand in the hollow are kept (`inHollow`), and a fern ends where one fails.
export function wallFern(base, d, N, clock, inHollow) {
  const sites = [], threads = [], P = SNOW.pitch, E = HEX[d], spine = [-1];
  const put = (a, b, rank, grow) => {
    const x = base[0] + P * (a + b / 2), y = base[1] + P * b * Math.sqrt(3) / 2;
    if (!inHollow(x, y, base[2])) return -1;
    sites.push({ a, b, x, y, z: base[2], rank, arm: d, clock: STANDING, grow: [grow[0] + grow[1] / 2, grow[1] * Math.sqrt(3) / 2] }); return sites.length - 1;
  };
  // the wall's own thread runs straight out of the wall's site (m0 frost steps, the wall's face lies within a cell of
  // it) to where the fern's first step on its own direction stands in the hollow; the spine begins there
  let m0 = 0; while (m0 < 4 && !inHollow(base[0] + P * (m0 + E[0] + E[1] / 2), base[1] + P * E[1] * Math.sqrt(3) / 2, base[2])) m0++;
  for (let n = 1; n <= N; n++) { const i = put(m0 + E[0] * n, E[1] * n, 0, E); if (i < 0) break; if (n > 1) threads.push([i, spine[n - 1], 0]); spine.push(i); }
  const M = spine.length - 1;
  for (const turn of [1, 5]) {
    const F = HEX[(d + turn) % 6];
    for (let s = 2; s <= M - 1; s++) {
      const len = s & 1 ? 1 : Math.max(1, Math.min(s - 1, Math.ceil((M - s) / 2)));
      let prev = spine[s];
      for (let m = 1; m <= len; m++) { const i = put(m0 + E[0] * s + F[0] * m, E[1] * s + F[1] * m, s & 1 ? 2 : 1, F); if (i < 0) break; threads.push([i, prev, s & 1 ? 2 : 1]); prev = i; }
    }
  }
  if (M >= 3 && clock) {
    const [T, ph] = clock, born = (ARRIVE_S + 0.3) / T, gone = 1 - (LEAVE_S + 0.2) / T;
    sites[spine[M - 1]].clock = [T, ph, born, gone]; sites[spine[M]].clock = [T, ph, born + (ARRIVE_S + 0.5) / T, gone - (LEAVE_S + 0.2) / T];
  }
  // the first spine site joins the wall's own site
  return { sites, threads, root: M >= 1 ? [spine[1], base] : null };
}
// AN ARM OF THE CRYSTAL RUNS ON INTO THE NET (round r9; the same on every seed, by the arm's own hash). Where a spine
// ends at the hollow's wall the frost does not stop: it goes on along the spine's own line on the sheet's frost net for
// ARM_ON[0] to ARM_ON[1] frost steps (24 to 36 m), THINNING: the first two steps as a branch, the rest as a branchlet,
// with a one-step fork to either hand at every second step (the net's threads part there and the frost takes both).
// It stands for good. Nothing of it within ARM_ON_CLEAR metres of the route's line. Drawn as a wall fern is.
export const ARM_ON = [4, 6], ARM_ON_CLEAR = 30.5;
export function armRunOn(fig) {
  const sites = [], threads = [], P = SNOW.pitch, [cx, cy, cz] = SNOW_AT;
  const put = (a, b, rank, arm, grow) => {
    const x = cx + P * (a + b / 2), y = cy + P * b * Math.sqrt(3) / 2;
    if (lineClear(x, y, cz, x, y, cz, ARM_ON_CLEAR + 2) < ARM_ON_CLEAR) return -1;
    sites.push({ a, b, x, y, z: cz, rank, arm, clock: STANDING, grow: [grow[0] + grow[1] / 2, grow[1] * Math.sqrt(3) / 2] }); return sites.length - 1;
  };
  fig.spines.forEach((spine, d) => {
    const E = HEX[d], N = spine.length - 1, steps = ARM_ON[0] + Math.floor(armHash(d, 0, 0, 7) * (ARM_ON[1] - ARM_ON[0] + 0.999));
    let prev = put(E[0] * N, E[1] * N, 0, d, E);
    for (let n = 1; n <= steps && prev >= 0; n++) {
      const rank = n <= 2 ? 0 : 1, i = put(E[0] * (N + n), E[1] * (N + n), rank, d, E); if (i < 0) break;
      threads.push([i, prev, rank]); prev = i;
      if (n & 1 || n >= steps) continue;
      for (const turn of [1, 5]) { const F = HEX[(d + turn) % 6], q = put(E[0] * (N + n) + F[0], E[1] * (N + n) + F[1], 2, d, F); if (q >= 0) threads.push([q, i, 2]); }
    }
  });
  return { sites, threads };
}
// how near a place stands to the crystal: the least distance to any of its sites, out to `far` (a first sieve by its centre)
export function snowClear(fig, x, y, z, far = SNOW_CLEAR) {
  const dz = z - SNOW_AT[2]; if (Math.abs(dz) >= far || Math.hypot(x - SNOW_AT[0], y - SNOW_AT[1]) > 20 * SNOW.pitch + far) return far;
  let best = far * far; const dz2 = dz * dz;
  for (const q of fig.sites) { const d2 = (q.x - x) * (q.x - x) + (q.y - y) * (q.y - y) + dz2; if (d2 < best) best = d2; }
  return Math.sqrt(best);
}

// ---------------------------------------------------------------- the shaders' shared laws
// Sizes in metres, at every distance. (aAux keeps a place for the old dot floor; nothing reads it.)
//
export const GLSL_HOLLOW = /* glsl */`
const vec3 HOL_C = vec3(${HOLLOW.x.toFixed(1)}, 0., ${HOLLOW.z.toFixed(1)}), HOL_R = vec3(${HOLLOW.ax.toFixed(1)}, ${HOLLOW.ay.toFixed(1)}, ${HOLLOW.az.toFixed(1)});
// THE HOLLOW as the shaders know it (the almond without its ripples). hollowLen: the length of the sight from p
// along the unit d that lies inside the hollow, as far as tmax (a closed form: the ray against half an ellipsoid).
// the bay: the length of the sight inside the second lobe (a whole ellipsoid)
const vec3 BAY_C = vec3(${BAY.x.toFixed(1)}, ${BAY.y.toFixed(1)}, ${BAY.z.toFixed(1)}), BAY_R = vec3(${BAY.ax.toFixed(1)}, ${BAY.ay.toFixed(1)}, ${BAY.az.toFixed(1)});
float bayLen(vec3 p, vec3 d, float tmax){
  vec3 q = (p - BAY_C) / BAY_R, e = d / BAY_R;
  float a = max(dot(e, e), 1e-9), b = dot(q, e), h = b * b - a * (dot(q, q) - 1.);
  if (h <= 0.) return 0.;
  h = sqrt(h);
  return max(0., min((-b + h) / a, tmax) - max((-b - h) / a, 0.));
}
// (round r11) THE COLD DEEP BEYOND THE CRYSTAL IS CLEAR AS THE HOLLOW IS: on the cold side the crystal ends at its own
// bound (x DEEP_X: no net stands further out), and the length of a sight that lies beyond that bound counts with the
// hollow's (a sight from the crystal to a thing out in the cold deep). No lamp stands there, so no lamp's light changes.
const float DEEP_X = ${DEEP_FROM.toFixed(1)};
float deepLen(vec3 p, vec3 d, float tmax){ return d.x > 1e-5 ? clamp(tmax - max((DEEP_X - p.x) / d.x, 0.), 0., tmax) : (p.x > DEEP_X ? tmax : 0.); }
float almondLen(vec3 p, vec3 d, float tmax){
  vec3 q = (p - HOL_C) / HOL_R, e = d / HOL_R;
  float a = max(dot(e, e), 1e-9), b = dot(q, e), h = b * b - a * (dot(q, q) - 1.);
  if (h <= 0.) return bayLen(p, d, tmax);
  h = sqrt(h); float t0 = (-b - h) / a, t1 = (-b + h) / a;
  if (abs(d.x) > 1e-5) { float tp = (HOL_C.x - p.x) / d.x; if (d.x > 0.) t0 = max(t0, tp); else t1 = min(t1, tp); }
  else if (p.x < HOL_C.x) return bayLen(p, d, tmax);
  return max(0., min(t1, tmax) - max(t0, 0.)) + bayLen(p, d, tmax);
}
float hollowLen(vec3 p, vec3 d, float tmax){ return almondLen(p, d, tmax) + deepLen(p, d, tmax); }
// how far a place stands inside the crystal from the hollow's wall (the part's hollowDepth without its ripples)
float crystalDepth(vec3 p){
  vec3 q = (p - HOL_C) / HOL_R; float rho = max(length(q), 1e-4), g = max(length(q / HOL_R) / rho, 1e-6);
  return max(HOL_C.x - p.x, (rho - 1.) / g);
}
`;
export const WHITE_GOLD = '#FFF1C8';
// THE ROSE (the join sheet, THE ROSE HAS DEPTH, round r11): A BOWL OF THE NET'S OWN RINGS OPEN TOWARD THE WAY IN. Ring n of
// ROSE_RINGS stands ROSE_PER rings to a sheet: the two nearest the spark in the spark's own sheet (the plane z 560),
// the next two one sheet before it, and so on (the tenth four sheets, 80 m, before the plane): roseRingK.
// EACH IS THE NET'S OWN RING ABOUT THE RANK'S LINE IN ITS SHEET. In the spark's sheet (a B sheet: a node stands on the
// line) that is the regular six-sided ring of side 24 n metres. In an A sheet no node stands on the line: the line
// pierces the middle of a triangle of the net, and the net's rings about it are that triangle grown cell by cell:
// SIX-SIDED RINGS OF THREE LONG AND THREE SHORT SIDES (ring n: three sides of n + 1 cells, ROW (n + 1/3) metres from
// the line, facing down and up to either hand as the triangle's own sides do; three sides of n cells, ROW (n + 2/3)
// metres from it, facing the triangle's corners). It is not the spark's ring turned: it is the same net one sheet
// on, where the stacking sets the triangle where the node was. Every corner is a node of its sheet.
// roseRing(n): { n, k, z, corners (six, in order round the line), sides: the cells of each side }.
export const ROSE_RINGS = 10, ROSE_PER = 2;
export const roseRingK = (n) => K_FAULT - Math.floor((n - 1) / ROSE_PER);
const ROSE_MEMO = [];
export function roseRing(n) {
  if (ROSE_MEMO[n]) return ROSE_MEMO[n];
  const k = roseRingK(n), z = GAP * k, corners = [], sides = [];
  if (isB(k)) for (let q = 0; q < 6; q++) { corners.push([SPARK[0] + n * SIDE * Math.cos(q * Math.PI / 3), SPARK[1] + n * SIDE * Math.sin(q * Math.PI / 3)]); sides.push(n); }
  else {
    // the six side lines by their outward directions: long sides face 270, 30 and 150 degrees, short sides 330, 90 and 210
    const line = (q) => { const a = (-90 + 60 * q) * Math.PI / 180; return [Math.cos(a), Math.sin(a), ROW * (n + (q & 1 ? 2 / 3 : 1 / 3))]; };
    for (let q = 0; q < 6; q++) {
      // the corner where side q meets side q + 1; side q runs from corner q - 1 to corner q
      const [a1, b1, c1] = line(q), [a2, b2, c2] = line(q + 1), det = a1 * b2 - a2 * b1;
      corners.push([SPARK[0] + (c1 * b2 - c2 * b1) / det, SPARK[1] + (a1 * c2 - a2 * c1) / det]);
    }
    // (turned so that side q runs from corner q to corner q + 1, as in the spark's sheet)
    corners.unshift(corners.pop());
    for (let q = 0; q < 6; q++) sides.push(q & 1 ? n : n + 1);
  }
  return (ROSE_MEMO[n] = { n, k, z, corners, sides });
}
// how near a place stands to the rose's rings (the least distance to any ring's line, out to `far`)
export function roseClear(x, y, z, far = 200) {
  let best = far;
  for (let n = 1; n <= ROSE_RINGS; n++) {
    const R = roseRing(n), dz = z - R.z; if (Math.abs(dz) >= best) continue;
    for (let q = 0; q < 6; q++) {
      const a = R.corners[q], b = R.corners[(q + 1) % 6], ux = b[0] - a[0], uy = b[1] - a[1], t = clamp(((x - a[0]) * ux + (y - a[1]) * uy) / (ux * ux + uy * uy), 0, 1);
      const d = Math.hypot(a[0] + ux * t - x, a[1] + uy * t - y, dz); if (d < best) best = d;
    }
  }
  return best;
}
// the cold side by place, and the lengths of sight over which a gold light there cools (see GLSL_LAWS: DISTANCE READS)
export const COLD_X = [60, 180], COOL_M = [70, 200, 430], COOL_SHRINK = 0.45;
export const GLSL_LAWS = /* glsl */`
uniform float uTime;
uniform vec3 uCold, uSpark, uWhiteGold;
const float FEATHER_M = ${FEATHER_M.toFixed(1)}, BARB_M = ${BARB_M.toFixed(2)};
const float ARRIVE_S = ${ARRIVE_S.toFixed(2)}, ARRIVE_M = ${ARRIVE_M.toFixed(1)}, LEAVE_S = ${LEAVE_S.toFixed(2)}, LEAVE_M = ${LEAVE_M.toFixed(1)}, WHITE_S = ${WHITE_S.toFixed(1)}, COOL_S = ${COOL_S.toFixed(1)}, TINT_S = ${TINT_S.toFixed(1)}, DRAW_S = ${DRAW_S.toFixed(2)};
float hash3(vec3 q){ q = fract(q * vec3(.1031, .1030, .0973)); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
// heat: every lamp shakes up to a quarter of a metre about its site, 3 to 5 beats a second, with a phase of its own
vec3 tremble(vec3 s){
  vec3 id = floor(s / vec3(12., 6.9282032, 20.) + .5);
  float a = hash3(id), b = hash3(id + 7.3), c = hash3(id + 19.1), w = 6.2832 * (3. + 2. * a);
  return vec3(.15 * sin(uTime * w + b * 6.2832), .15 * sin(uTime * w * 1.13 + c * 6.2832), .12 * sin(uTime * w * .87 + a * 40.));
}
${GLSL_HOLLOW}
// THE HAZE OF AMBER DARK (round r4), ONE LAW FOR EVERY LAMP AND THREAD: the share of a light that reaches the eye
// over a sight of length d of which L lies in the hollow. Through crystal (c = d - L) it sinks as in fog: half at
// 150 m, a tenth at 320 m, nothing past 500 m. Through the hollow's clear dark gold thins by exp(-L / 600) (round r6:
// clear dark dims less than amber crystal, so the hollow's far wall stands as ranks of dim gold across it; it was 260)
// and the frost's cold light by exp(-L / 700) (the hollow is clear, not haze: frost is seen across it). A thread is
// seen only as part of its net: none further than 240 m from the eye (threads are built to 240 m from the line).
float hazeAll(float c){ float q = clamp(c / 190., 0., 4.); return exp(-q * sqrt(q)) * (1. - smoothstep(380., 500., c)); }
float hazeGold(float d, float L){ return hazeAll(max(d - L, 0.)) * exp(-L / 600.); }
float hazeThread(float d, float L){ return hazeGold(d, L) * (1. - smoothstep(170., 240., d)); }
float hazeCold(float d, float L){ return hazeAll(max(d - L, 0.)) * exp(-L / 700.); }
// DISTANCE READS ON THE COLD SIDE (round r9): a gold lamp or thread that stands on the cold side (by its own place: none of
// it at x COLD_X[0], wholly from x COLD_X[1]) COOLS with the length of the sight to it, gold near, rose gold from
// COOL_M[0] to COOL_M[1] metres, violet grey by COOL_M[2], and a lamp there SHRINKS to 1 - COOL_SHRINK of its size by
// COOL_M[2]: the far rows on that side sink into the cold deep. A part of the haze (a law of the sight's length).
// Frost keeps its own cold light.
const vec3 ROSE_GOLD = vec3(1., .56, .46), VIOLET_GREY = vec3(.5, .46, .86);
float coldSide(float x){ return smoothstep(${COLD_X[0].toFixed(1)}, ${COLD_X[1].toFixed(1)}, x); }
vec3 coolFar(vec3 col, float cs, float d){
  float lum = max(col.r, max(col.g, col.b));
  col = mix(col, ROSE_GOLD * lum, cs * smoothstep(${COOL_M[0].toFixed(1)}, ${COOL_M[1].toFixed(1)}, d));
  return mix(col, VIOLET_GREY * lum, cs * smoothstep(${COOL_M[1].toFixed(1)}, ${COOL_M[2].toFixed(1)}, d));
}
float coolShrink(float cs, float d){ return 1. - ${COOL_SHRINK.toFixed(2)} * cs * smoothstep(${COOL_M[0].toFixed(1)}, ${COOL_M[2].toFixed(1)}, d); }
const vec3 ICE = vec3(${(0x9C / 255) ** 2.2}, ${(0xC4 / 255) ** 2.2}, 1.);
const float ICE_S = ${ICE_S.toFixed(1)};
// THE SPARK'S LIGHT on what stands round it: within 110 m it TINTS toward white gold and lifts nothing; within
// 60 m the surround DEEPENS to dark gold, so that the ring is the one bright thing there. keep: the share left be.
// THE DEEPENING REACHES THE ROWS ABOVE AND BELOW THE RANK AS IT REACHES THE RANK'S OWN ROWS (round r7): its measure
// counts how far a place stands off the rank's line only out to the rank's own rows (RANK_ROW metres) and again from
// the next rows on (twice that), so a lamp of the row above or below deepens as the rank's lamp of its sheet does.
const float RANK_ROW = ${(2 * ROW / 3).toFixed(3)};
vec3 sparkLaw(vec3 col, vec3 p, float keep){
  vec3 v = p - uSpark; float d2 = dot(v, v), lum = max(col.r, max(col.g, col.b)), off = length(v.xy);
  float dq = length(vec2(v.z, min(off, RANK_ROW) + max(off - 2. * RANK_ROW, 0.)));
  float w = clamp(1311. / (d2 + 1014.), 0., 1.) * (1. - smoothstep(10000., 15625., d2)), deep = (1. - smoothstep(18., 60., dq)) * (1. - keep);
  col = mix(col, uWhiteGold * lum, .8 * w);
  return mix(col, vec3(1., .45, .05) * lum, deep) * (1. - .62 * deep);
}
// a clock is (period, phase, birth share, let-go share). x: seconds since the site locked on (negative while it
// is still coming), y: seconds since it let go (negative before). A period of nothing stands for ever.
vec2 clockAges(vec4 k){ if (k.x <= 0.) return vec2(1000., -1.); float c = fract(uTime / k.x + k.y); return vec2((c - k.z) * k.x, (c - k.w) * k.x); }
`;
// the finished crystal's own life: three trains of brightness (each with a phase the visit deals), and two faults
// that run down one row each at unlike clocks
const GLSL_CRYSTAL = /* glsl */`
uniform vec4 uFault, uFaultB;    // the sheet's z, the row's y, the kink's x now, its direction along x (0: no fault)
uniform vec4 uFaultX;            // the two rows' own ends along x: nothing beyond them slides
uniform vec3 uWavePh;
float waves(vec3 p){
  return .16 * sin(6.2832 * (p.z + 22. * uTime) / 160. + uWavePh.x) + .11 * sin(6.2832 * (p.x - 15. * uTime) / 240. + uWavePh.y) + .08 * sin(6.2832 * (.5 * p.x + .866 * p.y - 6. * uTime) / 90. + uWavePh.z);
}
// x: how far a lamp of the faulted row has slid toward its neighbour's place (0 to 1), y: the ripple's lift at this site
vec2 faultOf(vec3 s, vec4 F, vec2 ends){
  if (F.w == 0. || abs(s.z - F.x) > 1.) return vec2(0.);
  float tau = (F.z - s.x) * F.w / 120., dy = abs(s.y - F.y);
  float slide = dy < 1. && s.x > ends.x - 1. && s.x < ends.y + 1. ? smoothstep(0., .5, tau) : 0.;
  // the ripple spreads at 90 m a second from the kink's own track (the row between its two ends, 10 m beyond each):
  // a lamp beside the track is reached from the point of the track nearest to it, never from beyond the row's ends
  float xc = clamp(s.x, ends.x - 10., ends.y + 10.), tauR = (F.z - xc) * F.w / 120., dist = length(vec2(s.x - xc, dy));
  float q = (dist - 90. * tauR) / 14.;
  return vec2(slide, exp(-q * q) * step(0., tauR) * (1. - smoothstep(100., 150., dist)));
}
vec2 fault(vec3 s){ return faultOf(s, uFault, uFaultX.xy); }
vec2 fault2(vec3 s){ return faultOf(s, uFaultB, uFaultX.zw); }
`;

const LAMP_VERT = /* glsl */`
attribute vec4 aSite;    // the site; w: 0 a common lamp, 1 the far end of its row, 2 the near end (finished crystal); 3 a frost stem's lamp (growth)
attribute vec4 aCol;     // the cooled colour times its strength; w: how much of the crystal's waves it takes (growth: the share of the cold white it wears when young, less on a fern's older panes)
attribute vec4 aAux;     // its size in common lamps; its skirt's share (a third within 14 m of the route's line, a half at 30 m); (a figure nothing reads); the share of it the spark's law leaves be
attribute float aNear;   // how near the route's line it stands (1 within 30 m, nothing from 90 m): its white hot centre
#ifdef GROWTH
attribute vec4 aClock; attribute vec3 aDir;
#endif
varying vec2 vP; varying vec3 vCol; varying vec2 vR; varying vec2 vN;
${GLSL_LAWS}${GLSL_CRYSTAL}
void main(){
  vec3 site = aSite.xyz, pos = site + tremble(site), col = aCol.rgb;
  float core = .35 * min(aAux.x, 2.), skirt = 2.2 * aAux.x, cold = 0., show = 1.;
#ifdef GROWTH
  vec2 ag = clockAges(aClock);
  float fl;
  if (ag.x < 0.) {
    // coming in from the dark: a small cold point that slows into its place
    float p = clamp(1. + ag.x / ARRIVE_S, 0., 1.), q = 1. - p;
    show = step(-ARRIVE_S, ag.x);
    pos = site + aDir * (ARRIVE_M * q * q) + tremble(site) * p;
    col = uCold * ((.5 + 2.7 * p * p) * aCol.w); core = mix(.14, core, p * p); skirt = mix(.7, skirt, p * p);
    fl = smoothstep(-.1, 0., ag.x); cold = 1.;
  } else {
    // locked on: frost white, then cooling to its own colour; at its period's end it dims and drifts off
    // (the cold light carries further through the amber than what has cooled: a frost stem's lamp is cold for good)
    cold = max(1. - smoothstep(ICE_S, ICE_S + TINT_S, ag.x), step(2.5, aSite.w));
    // white when new, ice blue for a while, then its own colour
    col = mix(col, ICE * (2.6 * aCol.w), 1. - smoothstep(ICE_S, ICE_S + TINT_S, ag.x));
    col = mix(col, uCold * (3.2 * aCol.w), 1. - smoothstep(WHITE_S, WHITE_S + TINT_S, ag.x));
    fl = exp(-ag.x * 8.5);
    float l = clamp(ag.y / LEAVE_S, 0., 1.);
    col *= (1. - l) * (1. - l); pos += aDir * (LEAVE_M * l * l); show = step(ag.y, LEAVE_S);
  }
  // the lock-on flash: at most one and a half times its lamp (by place, not beside the way: aAux.y), not hotter than 6
  float big = .5 * fl * clamp(1.5 * aAux.y - .5, 0., 1.);
  col += uCold * (2.8 * fl * aCol.w); core *= 1. + big; skirt *= 1. + big;
#else
  vec2 f = fault(site) , f2 = fault2(site);
  pos.x += 24. * (f.x + f2.x);
  col *= 1. + waves(site) * aCol.w + .35 * max(f.y, f2.y);
  if (aSite.w > .5) col *= aSite.w < 1.5 ? max(f.x, f2.x) : 1. - max(f.x, f2.x);
#endif
  col = sparkLaw(col, pos, aAux.w);
  vec4 mv = modelViewMatrix * vec4(pos, 1.);
  vec3 toP = pos - cameraPosition; float d = length(toP), L = hollowLen(cameraPosition, toP / max(d, 1e-3), d);
  float hz = mix(hazeGold(d, L), hazeCold(d, L), cold);
  // every lamp keeps its size in metres at every distance; far gold sinks into the haze and goes to ember
  float coreD = core, skirtD = max(skirt, coreD * 6.3);
  // (on the cold side a gold lamp cools and shrinks with the sight's length; elsewhere far gold goes to ember as before)
  float cs = coldSide(pos.x) * (1. - cold), far = smoothstep(120., 380., d - L) * (1. - cold) * (1. - cs), shrink = coolShrink(cs, d);
  coreD *= shrink; skirtD *= shrink;
  col = coolFar(col, cs, d) * vec3(1., 1. - .2 * far, 1. - .45 * far) * hz;
  show *= step(.0015, max(col.r, max(col.g, col.b)));
  mv.xy += position.xy * (skirtD * show);
  gl_Position = projectionMatrix * mv;
  vP = position.xy * skirtD; vCol = col; vR = vec2(coreD, skirtD); vN = vec2(aNear, aAux.y);
}`;
const LAMP_FRAG = /* glsl */`
varying vec2 vP; varying vec3 vCol; varying vec2 vR; varying vec2 vN;
uniform float uSkirt, uBody;
void main(){
  // a lamp: a core with a centre a quarter of it wide that is white hot beside the way (vN.x, by place), a soft body about it, a skirt out to 2.2 m
  float r2 = dot(vP, vP), core = max(vR.x, 1e-3), skirt = max(vR.y, 1e-3), q = r2 / (core * core);
  float c = exp(-1.4 * q), h = exp(-18. * q), b = exp(-q / 7.);
  float s = clamp(1. - sqrt(r2) / skirt, 0., 1.); b *= smoothstep(0., .35, s); s = s * s * s;
  float lum = max(vCol.r, max(vCol.g, vCol.b));
  gl_FragColor = vec4(vCol * (c + (uBody * b + uSkirt * s) * vN.y) + vec3(1., .97, .92) * (h * lum * (.2 + .9 * vN.x)), 1.);
}`;

// (round r11) a thread of frost seen along itself: the cosines between which its feather goes, and the share of its light the line keeps
export const END_ON_COS = [0.8, 0.97], END_ON = 0.45;
const THREAD_VERT = /* glsl */`
attribute vec4 aA, aB;   // the two sites it joins; aA.w: its feather's cap in metres (growth) or 1 on the last thread of a standing row; aB.w: its width in common threads
attribute vec4 aCol;     // its cooled colour times its strength; w: the share of its feather it keeps for good (the frost of a stem braid)
attribute vec4 aAux;     // the share of its light its feather gives up (the snow crystal's fine barbs; nothing elsewhere); its vane (none within 7 m of the line); the share of it the spark's law leaves be; how near the line it stands (1 within 30 m, nothing from 90 m)
#ifdef GROWTH
attribute vec4 aClkA, aClkB;
attribute float aDim;    // the share of the cold white it wears when young (less on a fern's older panes)
#endif
varying vec4 vT;   // metres along from the older end, across (half widths, or metres on the feather), the length, the drawn length
varying vec4 vC;   // colour; w: 0 the line, 1 the feather
varying float vL;  // on the feather: its length now; on the line: 1 (a thread is drawn at its own width in metres at every distance)
varying float vH;  // a whole number of the thread's own, so no two feathers are alike (rounded again where it is read: a varying comes back a hair off)
varying vec2 vX;   // how near the route's line it stands (1 within 30 m, nothing from 90 m); its vane's share
varying float vE;  // 1 on frost that keeps its whole feather for good (a thread of the snow crystal): its barbs do not shorten toward the thread's two ends
${GLSL_LAWS}${GLSL_CRYSTAL}
void main(){
  vec3 A = aA.xyz, B = aB.xyz, col = aCol.rgb;
  float bright = 1., front = 2., feather = 0., cold = 0.;
#ifdef GROWTH
  // as old as its younger end; it draws itself from the older end to the younger, and goes when either end lets go
  vec2 a = clockAges(aClkA), b = clockAges(aClkB);
  float age = min(a.x, b.x), l = clamp(max(a.y, b.y) / LEAVE_S, 0., 1.);
  if (b.x > a.x) { vec3 t = A; A = B; B = t; }
  front = age < DRAW_S ? clamp(age / DRAW_S, 0., 1.) : 2.;
  bright = step(0., age) * (1. - l) * (1. - l);
  cold = max(1. - smoothstep(ICE_S, ICE_S + TINT_S, age), step(.01, aCol.w));
  col = mix(col, ICE * (1.1 * aDim), 1. - smoothstep(ICE_S, ICE_S + TINT_S, age));
  col = mix(col, uCold * (1.5 * aDim), 1. - smoothstep(WHITE_S, WHITE_S + TINT_S, age));
  feather = min(aA.w, FEATHER_M * max(1. - clamp(age / (WHITE_S + COOL_S), 0., 1.), aCol.w)) * step(.001, bright);
  A += tremble(A); B += tremble(B);
#else
  // a fault: a thread of the faulted row slides with its two lamps; a thread that crosses the row dims out and relights
  vec2 fa = max(fault(A), fault2(A)), fb = max(fault(B), fault2(B));
  bright = 1. + .35 * max(fa.y, fb.y);
  float over = abs(fa.x - fb.x) * step(.5, abs(A.y - B.y));
  bright *= 1. - smoothstep(0., .15, over) * (1. - smoothstep(.85, 1., over));
  if (abs(A.y - B.y) < .5) { A.x += 24. * fa.x; B.x += 24. * fb.x; bright *= 1. - aA.w * max(fa.x, fb.x); }
  A += tremble(aA.xyz); B += tremble(aB.xyz);
#endif
  vec3 ax = B - A; float len = length(ax); ax /= max(len, 1e-4);
  vec3 P = A + ax * (len * position.x);
  vec4 mv = modelViewMatrix * vec4(P, 1.);
  vec3 toP = P - cameraPosition; float d = length(toP), L = hollowLen(cameraPosition, toP / max(d, 1e-3), d);
  float hz = mix(hazeThread(d, L), hazeCold(d, L), cold);
  col = coolFar(sparkLaw(col, P, aAux.z), coldSide(P.x) * (1. - cold), d);
  float gain = bright * hz;
  // (round r11) NO WHITE BAR: A THREAD OF FROST SEEN ALONG ITSELF. Where the sight runs along a thread its barbs lie
  // one behind another and their light would add up to one bright streak: a feather gives up its light as the sight
  // comes within 37 degrees of its own thread (all of it by 14 degrees), and the line of frost that keeps its feather
  // for good (the snow crystal, a wall fern) goes down to END_ON of its light there. The gold net's threads keep theirs.
  float endOn = smoothstep(${END_ON_COS[0].toFixed(2)}, ${END_ON_COS[1].toFixed(2)}, abs(dot(ax, toP)) / max(d, 1e-3));
  if (position.z < .5) {
    vec3 side = cross(ax, cameraPosition - P); float sl = length(side); side = sl > 1e-5 ? side / sl : vec3(0., 1., 0.);
    float hw0 = .08 * aB.w, hw = hw0;
    // frost that keeps its feather for good (the snow crystal, a wall fern) is a flat figure in its sheet: seen along the
    // sheet (within 6 degrees of edge on) its threads too give up light, down to a quarter at 1 degree
    gain *= mix(1., mix(.25, 1., smoothstep(.02, .1, abs(toP.z) / max(d, 1e-3))), step(.99, aCol.w));
    gain *= mix(1., mix(1., ${END_ON.toFixed(2)}, endOn), step(.99, aCol.w));
    P += side * (position.y * hw * 2.5 * step(.002, gain));
    vT = vec4(position.x * len, position.y * 2.5, len, front * len); vL = hw0 / hw;
  } else {
    vec3 side = cross(ax, vec3(0., 0., 1.)); float sl = length(side); side = sl > 1e-5 ? side / sl : vec3(0., 1., 0.);
    float wide = feather * .9;
    // a feather is flat, in its sheet's plane: turned edge on to the eye it has no breadth, so it gives up its light
    // between 7 and 2 degrees from edge on and only its spine is left
    gain *= smoothstep(.03, .12, abs(toP.z) / max(d, 1e-3)) * (1. - aAux.x) * (1. - endOn);
    P += side * (position.y * wide * step(.02, feather) * step(.002, gain));
    vT = vec4(position.x * len, position.y * wide, len, front * len); vL = feather;
  }
  vE = step(.99, aCol.w);
  vC = vec4(col * gain, position.z); vH = floor(mod(aA.x * .25 + aA.y * 1.7 + aB.x * .5 + aB.y * 2.3, 50.));
  // the soft frost light between the barbs is given up sooner than the barbs as the feather turns from the eye (whole from 45 degrees, nothing under 17)
  vX = vec2(aAux.w, aAux.y * smoothstep(.3, .7, abs(toP.z) / max(d, 1e-3)));
  gl_Position = projectionMatrix * modelViewMatrix * vec4(P, 1.);
}`;
const THREAD_FRAG = /* glsl */`
varying vec4 vT; varying vec4 vC; varying float vL, vH, vE; varying vec2 vX;
uniform float uLine, uBarb, uVane;
const float BARB_M = ${BARB_M.toFixed(2)};
void main(){
  float s = vT.x, len = max(vT.z, 1e-3), front = vT.w, k;
  if (vC.w < .5) {
    // the line: dim, brighter for the 2 m next to each node (beside the way brighter still: the six short rays of a
    // lamp by the route's line lie on its threads); while it draws itself, a bright head with the line behind it
    // across: a hot fine core in a faint sheath (vL is 1 on every line, so the mix below takes its second figure)
    // (beside the way the sheath goes, by place: a thread there is a fine line, never a soft bar)
    // (FROST THAT WEARS A FEATHER FOR GOOD HAS A QUARTER OF THE SHEATH, a rule of the thread's own light (round r7): its
    // feather is its soft light. Sheath on feather, thread beside thread, lay as a soft veil where the crystal's threads
    // stand close: between the spines at its centre.)
    float y2 = vT.y * vT.y, prof = mix(exp(-1.6 * y2), 1.3 * exp(-9. * y2) + .22 * (1. - .75 * vE) * (1. - .85 * vX.x) * exp(-1.2 * y2), smoothstep(.45, .9, vL));
    float node = 1. - smoothstep(.6, 2.4, min(s, len - s));
    float drawn = 1. - smoothstep(front - .4, front, s), q = (s - front) / .9;
    k = (mix(.5, .9 + 1.5 * vX.x, node) * drawn + 2.5 * exp(-q * q) * step(front, len)) * prof * uLine;
  } else {
    // the feather: barbs at 60 degrees, each of a length of its own, shorter toward the thread's two ends, a needle
    // that thins from 0.11 m at the spine to 0.03 m at its tip, brightest at the spine,
    // going out to nothing over its outer half; and on every barb small side barbs that run with the spine. Where a
    // screen's dot is wider than a barb the barb is drawn a dot wide and dimmer, and where a dot is a fifth of the
    // barbs' spacing wide (barbs that crowd toward their vanishing point, or stand far off) every barb has the mean length.
    float L = max(vL, 1e-3), t = abs(vT.y), run = min(front, len);
    float q = s - t * .57735, n = floor(q / BARB_M + .5), cell = q - n * BARB_M;
    float px = length(vec2(dFdx(q), dFdy(q))) * .866, py = length(vec2(dFdx(vT.y), dFdy(vT.y)));
    float own = mix(fract(sin((n + floor(vH + .5) + step(0., vT.y) * 31.) * 12.9898) * 43758.5453), .5, smoothstep(.05 * BARB_M, .2 * BARB_M, px));
    float reach = max(L * .866 * (.45 + .55 * own) * mix(mix(.35, 1., smoothstep(0., 7., min(q, run - q))), 1., vE), 1e-3);
    float e = clamp(t / reach, 0., 1.);
    float hb0 = mix(.055, .015, e), hb = max(hb0, .7 * px);
    float barb = (1. - smoothstep(.5 * hb, 1.5 * hb, abs(cell) * .866)) * (hb0 / hb) * (.5 + .5 * hb0 / .055);
    float tick = abs(fract(t / .45) - .5) * .45, hs = max(.02, .7 * py), far = .55 * (1. - e);
    float side = (1. - smoothstep(.5 * hs, 1.5 * hs, tick)) * (.02 / hs) * step(0., cell) * (1. - smoothstep(.4 * far, far + .01, cell)) * .7;
    float on = (1. - smoothstep(.55, 1., e)) * step(0., n) * step(n * BARB_M, run - .2) * smoothstep(.04, .16, t);
    // and between the barbs the vane's own faint body, so that a feather is a blade of frost and not a comb
    float ev = clamp(t / (reach * .725 / (.45 + .55 * own)), 0., 1.);
    float vane = uVane * vX.y * (1. - ev) * (1. - ev) * step(0., q) * (1. - smoothstep(run - .6, run, q)) * smoothstep(0., .5, L);
    k = (max(barb, side) * on * mix(1., .33, e)) * uBarb + vane;
  }
  gl_FragColor = vec4(vC.rgb * k, 1.);
}`;

// ICE ALONG THE CRYSTAL'S SPINES (round r8): a six-sided bar of clear ice, drawn as light like everything here (added
// over the dark, no depth written, so a lamp behind it glows through it). ITS LIGHT IS A LAW OF THE FACE: each of the
// six faces has its own light by where its own normal points among two fixed directions of the world, GOLD_FROM
// (toward the finished gold net behind the near wall) and FROST_FROM (toward the hollow's growing far side, straight
// across from it): a face turned to the gold is warm gold, a face turned to the growing side is cold blue white, a
// face between them is darker ice. Both directions lie in the sheet a twelfth of a turn off the net's X row, between
// two of the net's own directions, so no arm lies along them and every arm has a warm flank and a cold one. A thin
// bright line runs along each edge (each face is brightest ICE_EDGE metres inside its two long borders; a face
// narrower than ICE_FULL metres has as much less light), and a
// soft light runs out along every bar from root to tip on the world clock (one in ICE_RUN_S seconds, each bar at a
// phase of its own). Nothing of it reads the eye but the haze every frost light has.
export const GOLD_FROM = [-Math.cos(Math.PI / 6), -Math.sin(Math.PI / 6), 0], FROST_FROM = [Math.cos(Math.PI / 6), Math.sin(Math.PI / 6), 0];
export const ICE_EDGE = 0.05, ICE_FULL = 1.2, ICE_TURN = 0.5, ICE_RUN_S = 9, BAR_TINT = 0.55;
const ICE_VERT = /* glsl */`
attribute vec3 aN;    // the face's own normal
attribute vec4 aW;    // metres from the face's middle line; the face's breadth there; the share of the way from root to tip; the bar's own phase
varying vec3 vLight; varying vec4 vW; varying float vHz;
${GLSL_LAWS}
const vec3 GOLD_FROM = vec3(${GOLD_FROM.map((v) => v.toFixed(5)).join(', ')}), FROST_FROM = vec3(${FROST_FROM.map((v) => v.toFixed(5)).join(', ')});
uniform vec3 uIceDark, uIceGold, uIceCold, uIceViolet, uIceTeal;
void main(){
  vec3 toP = position - cameraPosition; float d = length(toP);
  vHz = hazeCold(d, hollowLen(cameraPosition, toP / max(d, 1e-3), d));
  // a face is wholly warm (or wholly cold) once it is turned ICE_TURN of the way toward that side; a face square to both is dark ice
  vLight = (uIceDark + uIceGold * smoothstep(0., ${ICE_TURN.toFixed(2)}, dot(aN, GOLD_FROM)) + uIceCold * smoothstep(0., ${ICE_TURN.toFixed(2)}, dot(aN, FROST_FROM))) * vHz;
#ifdef BODY
  // a body of deep ice (round r10): a face leaning out of its sheet has the ice's own colour, violet toward the way
  // in (-Z) and teal toward the far end (+Z)
  vLight += (uIceViolet * smoothstep(.2, .9, -aN.z) + uIceTeal * smoothstep(.2, .9, aN.z)) * (${BAR_TINT.toFixed(2)} * vHz);
#endif
  vW = aW;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
}`;
const ICE_FRAG = /* glsl */`
varying vec3 vLight; varying vec4 vW; varying float vHz;
uniform float uTime; uniform vec3 uIceEdge;
void main(){
  // metres to the face's nearer long border
  // (the line stands ICE_EDGE metres inside the border and the face's own light begins at the border from nothing, so no
  // face ends in a step of light; a face narrower than ICE_FULL metres has as much less light, line and all: where a
  // bar thins to its point its light thins with it, and a thin rib is a faint one)
  float e = max(.5 * vW.y - abs(vW.x), 0.), q = e / ${ICE_EDGE.toFixed(3)} - 1., rise = smoothstep(0., ${ICE_EDGE.toFixed(3)}, e) * clamp(vW.y / ${ICE_FULL.toFixed(2)}, 0., 1.);
  float edge = exp(-q * q) * rise;
  // the light that runs out along the bar: it comes in before the root and has gone beyond the tip before it comes again
  float g = (clamp(vW.z, 0., 1.) - (fract(uTime / ${ICE_RUN_S.toFixed(1)} + vW.w) * 1.4 - .2)) / .07, run = exp(-g * g);
  gl_FragColor = vec4(vLight * (rise * (1. + .8 * run)) + uIceEdge * (edge * (1. + .8 * run) * vHz), 1.);
}`;

// FACETED ICE (round r9): THE BODY OF THE WORLD'S ICE. A body of flat faces (the plate crystal, the snow crystal's heart,
// blades and end plates, the ice on the rose's rings), drawn as light like everything here: added over the dark, no
// depth written, so lamps behind it glow in it. ITS LIGHT IS THE ICE'S LAW OF THE FACE (round r8): a face has its
// own light by where its own normal points in the world: toward the finished gold net (NET_FROM) it takes the net's
// warm light, toward the growing side (COLD_FROM) the cold blue white, and every face has the dim blue of the ice
// itself; a thin pale line runs FACET_EDGE metres inside every true border of a face. A soft light runs over a body
// on the world clock by a share each corner carries (aK.x), one in FACET_RUN_S seconds at the body's own phase
// (aK.y). A body that turns (the plate) turns its faces' normals with it, so its lights wheel. Nothing of it reads
// the eye but the haze every frost light has.
export const NET_FROM = [-0.94, -0.2, -0.28], COLD_FROM = [0.94, 0.2, 0.28], FACET_EDGE = 0.22, FACET_RUN_S = 11;
// A BODY OF DEEP ICE (round r10: the plate crystals; the material `facetBody`). ITS ICE HAS LIGHT INSIDE: every face
// carries a colour of its own (aT: violet at a body's heart, teal along its arms, pale blue at its ends, given by the
// builder from the face's place in the body), and that inner light is SHADED BY WHERE THE FACE IS TURNED (whole on a
// face turned up toward the level's light, BODY_SHADE of it on one turned down), so ridge and valley are told apart
// and wheel as the body turns. THE WARM GLINT is narrow: only a face turned within about 25 degrees of the net
// (BODY_GLINT of the cosine) takes the net's gold, at BODY_GOLD of it. A BODY SHOWS THE FACES TURNED TO THE EYE: its
// far faces are not drawn (as a solid's are not seen); so no face's light is added twice and nothing of it is white.
// (round r11) NO WHITE BAR: THE TWO FACES OF A RIDGE TAKE DIFFERENT LIGHT. The shade by where a face is turned is a
// raking one (BODY_RAKE: a face leaned a fifth of a right angle up from its sheet is whole, one leaned as far down
// has BODY_SHADE of it) and it holds for the whole of the face's own light, the dark ice with the inner light: of the
// two faces of an arm's blade, to either hand of its ridge, one is light and one is dark, on every arm and every body.
export const BODY_SHADE = 0.22, BODY_RAKE = 2.4, BODY_GLINT = [0.8, 0.98], BODY_GOLD = 0.3, NO_TINT = [0, 0, 0];
// A FACE OF ICE IS CLEAR, NOT A MILKY PANE (round r11; the facet's own shader, the same for every crystal): a face's
// own light stands whole along its true borders (its edges and ribs) and falls to FACE_CLEAR of itself over
// FACE_DEEP metres into the face (in the body's own line breadths, as the border line is), so a broad flat face is
// mostly see-through and a narrow rib keeps its light; a face seen at a grazing slant shines more (FACE_SLANT of
// its light at the most: ice mirrors at a grazing sight); the border line itself is FACE_LINE times as bright as it
// was, so edges and ribs stay crisp where the faces have gone clear. THROUGH A CLEAR FACE COMES A FAINT TINT
// OF WHAT LIES BEHIND, BENT: the sight is bent at the face as ice bends it (ICE_BEND: 1 / 1.31) and the face takes
// FACE_BEHIND of the colour of the deep that the bent sight runs to (amber toward the finished net, violet toward the
// cold deep, teal low on the cold side: the dome's own law of direction, BEHIND_*), so faces turned unlike show
// unlike tints and wheel as a body turns. A GLINT, a narrow bright band, runs over a body on the world clock with
// the running light (FACE_GLINT of the edge's light at its middle).
// THE CLEAR OF A FACE IS A THING OF NEARNESS: a crystal far off is a pale jewel, not a wire figure: with the length
// of the sight (as the haze goes) a face fills again, from FACE_FAR[0] metres to FACE_FILL of its whole light by
// FACE_FAR[1], and the bent tint goes as it fills.
export const FACE_FAR = [110, 330], FACE_FILL = 0.7;
export const FACE_CLEAR = 0.08, FACE_SLANT = 0.4, FACE_DEEP = 0.3, FACE_LINE = 1.35, ICE_BEND = 1 / 1.31, FACE_BEHIND = 0.25, FACE_GLINT = 0.5;
export const BEHIND_WARM = [0.2, 0.095, 0.03], BEHIND_COLD = [0.085, 0.06, 0.23], BEHIND_TEAL = [0.03, 0.15, 0.17];
const FACET_VERT = /* glsl */`
attribute vec3 aN;    // the face's own normal (in the body's frame)
attribute vec3 aE;    // metres to each of the three borders of its triangle (a border that is not a true border of the face: far)
attribute vec4 aK;    // the share the running light reads; the body's phase; the face's strength; the line's strength
attribute vec3 aT;    // the ice's inner light (a body of deep ice)
varying vec3 vLight, vE, vBehind; varying vec4 vK; varying float vHz, vClear;
${GLSL_LAWS}
const vec3 BEHIND_WARM = vec3(${BEHIND_WARM.join(', ')}), BEHIND_COLD = vec3(${BEHIND_COLD.join(', ')}), BEHIND_TEAL = vec3(${BEHIND_TEAL.join(', ')});
const vec3 NET_FROM = vec3(${NET_FROM.map((v) => v.toFixed(3)).join(', ')}), COLD_FROM = vec3(${COLD_FROM.map((v) => v.toFixed(3)).join(', ')});
uniform vec3 uIceDark, uIceGold, uIceCold;
void main(){
  vec4 wp = modelMatrix * vec4(position, 1.);
  vec3 n = normalize(mat3(modelMatrix) * aN), toP = wp.xyz - cameraPosition; float d = length(toP);
  vHz = hazeCold(d, hollowLen(cameraPosition, toP / max(d, 1e-3), d));
#ifdef BODY
  float g = ${BODY_GOLD.toFixed(2)} * smoothstep(${BODY_GLINT[0].toFixed(2)}, ${BODY_GLINT[1].toFixed(2)}, dot(n, NET_FROM)), c = smoothstep(.35, .85, dot(n, COLD_FROM));
  vLight = ((uIceDark * 2.5 + aT) * mix(${BODY_SHADE.toFixed(2)}, 1., clamp(.5 + ${BODY_RAKE.toFixed(2)} * n.y, 0., 1.)) + uIceGold * g + uIceCold * c) * (vHz * aK.z);
#else
  float g = smoothstep(.35, .85, dot(n, NET_FROM)), c = smoothstep(.35, .85, dot(n, COLD_FROM));
  vLight = (uIceDark * 2.5 + uIceGold * g + uIceCold * c) * (vHz * aK.z);
#endif
  // (round r11) a clear face: how squarely it is seen; the sight bent at it and the colour of the deep it runs to
  vec3 v = toP / max(d, 1e-3); float nv = dot(n, v); vec3 nn = nv < 0. ? n : -n, r = refract(v, nn, ${ICE_BEND.toFixed(4)});
  float slant = 1. - abs(nv); slant *= slant; vClear = mix(${FACE_CLEAR.toFixed(2)}, ${FACE_SLANT.toFixed(2)}, slant * slant);
  // (the clear of a face is a thing of nearness: from FACE_FAR[0] metres of sight on a face fills again, to FACE_FILL of its light by FACE_FAR[1])
  float fill = ${FACE_FILL.toFixed(2)} * smoothstep(${FACE_FAR[0].toFixed(1)}, ${FACE_FAR[1].toFixed(1)}, d); vClear = mix(vClear, 1., fill);
  vec3 behind = mix(BEHIND_WARM, BEHIND_COLD, smoothstep(-.15, .75, r.x));
  behind = mix(behind, BEHIND_TEAL, smoothstep(.1, .7, r.x) * smoothstep(.05, -.35, r.y));
  vBehind = behind * (${FACE_BEHIND.toFixed(2)} * (1. - slant) * (1. - fill) * vHz * aK.z);
  vE = aE; vK = aK;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const FACET_FRAG = /* glsl */`
varying vec3 vLight, vE, vBehind; varying vec4 vK; varying float vHz, vClear;
uniform float uTime; uniform vec3 uIceEdge;
void main(){
  float e = max(min(vE.x, min(vE.y, vE.z)), 0.), q = e / ${FACET_EDGE.toFixed(3)} - 1., rise = smoothstep(0., ${FACET_EDGE.toFixed(3)}, e);
  float g = (clamp(vK.x, 0., 1.) - (fract(uTime / ${FACET_RUN_S.toFixed(1)} + vK.y) * 1.5 - .25)) / .09, run = exp(-g * g);
  // (round r11) the face's own light is whole along its borders and falls to its clear share into the face; through
  // the clear of it the bent tint of what lies behind; a narrow glint runs with the running light
  float deep = exp(-e / ${FACE_DEEP.toFixed(2)}), fill = rise * mix(vClear, 1., deep), glint = exp(-g * g * 9.);
  gl_FragColor = vec4(vLight * (fill * (1. + .7 * run)) + vBehind * (rise * (1. - deep)) + uIceEdge * ((${FACE_LINE.toFixed(2)} * exp(-q * q) * rise * vK.w * (1. + .7 * run) + ${FACE_GLINT.toFixed(2)} * glint * fill * vK.z) * vHz), 1.);
}`;
// a batch of faces: face(points, normal, k, open) adds one flat face (a fan of triangles about its first corner;
// `open`: the indices of the sides that are NO true border, a side i running from corner i to corner i + 1)
// (`wide`: the breadth of the body's border lines in FACET_EDGE: a great body seen from far wears broader lines)
// (round r10) EVERY FACE IS WOUND TOWARD ITS OWN NORMAL (its front is the side the normal names), so a body's material
// may draw only the faces turned to the eye; `tint`: THE ICE'S INNER LIGHT, a colour of its own the face carries
// (linear; nothing by default)
export function facetBatch(wide = 1) {
  const pos = [], nor = [], ed = [], kk = [], tt = [];
  const FAR = 1e3, height = (p, a, b) => { const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = p[0] - a[0], vy = p[1] - a[1], vz = p[2] - a[2]; const cx = uy * vz - uz * vy, cy = uz * vx - ux * vz, cz = ux * vy - uy * vx; return Math.hypot(cx, cy, cz) / Math.max(Math.hypot(ux, uy, uz), 1e-6) / wide; };
  return {
    get triangles() { return pos.length / 9; },
    // one triangle; real: which of its sides ab, bc, ca are true borders; ka, kb, kc: the running light's share at each corner
    tri(a, b, c, n, real, ka, kb, kc, phase = 0, strength = 1, line = 1, tint = NO_TINT) {
      for (let i = 0; i < 3; i++) tt.push(tint[0], tint[1], tint[2]);
      const ha = real[1] ? height(a, b, c) : FAR, hb = real[2] ? height(b, c, a) : FAR, hc = real[0] ? height(c, a, b) : FAR;
      pos.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
      for (let i = 0; i < 3; i++) nor.push(n[0], n[1], n[2]);
      // each corner: its distance to the side opposite it; nothing to the two sides it lies on (far where a side is no border)
      ed.push(real[0] ? 0 : FAR, ha, real[2] ? 0 : FAR, real[0] ? 0 : FAR, real[1] ? 0 : FAR, hb, hc, real[1] ? 0 : FAR, real[2] ? 0 : FAR);
      kk.push(ka, phase, strength, line, kb, phase, strength, line, kc, phase, strength, line);
    },
    face(pts, n, share, open = [], phase = 0, strength = 1, line = 1, tint = NO_TINT) {
      const N = pts.length;
      // (wound toward its normal: where its corners run the other way round they are taken in the other order, the first kept)
      const [a, b, c] = pts, gx = (b[1] - a[1]) * (c[2] - a[2]) - (b[2] - a[2]) * (c[1] - a[1]), gy = (b[2] - a[2]) * (c[0] - a[0]) - (b[0] - a[0]) * (c[2] - a[2]), gz = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
      if (gx * n[0] + gy * n[1] + gz * n[2] < 0) { pts = pts.map((v, i) => pts[(N - i) % N]); share = share.map((v, i) => share[(N - i) % N]); open = open.map((i) => N - 1 - i); }
      const isOpen = (i) => open.includes(i);
      for (let i = 1; i < N - 1; i++) this.tri(pts[0], pts[i], pts[i + 1], n, [i === 1 && !isOpen(0), !isOpen(i), i === N - 2 && !isOpen(N - 1)], share[0], share[i], share[i + 1], phase, strength, line, tint);
    },
    mesh(material) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aN', new THREE.Float32BufferAttribute(nor, 3));
      g.setAttribute('aE', new THREE.Float32BufferAttribute(ed, 3)); g.setAttribute('aK', new THREE.Float32BufferAttribute(kk, 4)); g.setAttribute('aT', new THREE.Float32BufferAttribute(tt, 3));
      const m = new THREE.Mesh(g, material); m.frustumCulled = false; return m;
    },
  };
}

// THE PLATE (rounds r9 and r10; the same on every seed: it is seen from the entry, a part of the join): THE HERO OF THE
// ARRIVAL, ONE GREAT WHOLE CRYSTAL OF ANOTHER HABIT, a six-sided plate crystal of deep ice that stands free in the
// hollow: a flat six-sided HEART, six broad SECTOR ARMS with ridges that fan from each arm's root, each arm ending in a
// six-sided END PLATE. It is 2 * PLATE_R metres from tip to tip.
// ITS PLACE IS THE HOLLOW'S OWN (round r10; found in plateSpec, typed nowhere): it stands ON THE LEVEL'S ROW (the row of
// the net nearest the entry's level, the snow crystal's own row), AT THE HOLLOW'S MIDDLE DEPTH (in a sheet, the site of
// that row nearest half way between the hollow's near and far wall), in the sheet where that site, PLATE_AHEAD[0] to
// PLATE_AHEAD[1] metres from the entry's place, has THE LEAST BEARING off the entry's axis, among the sheets in which
// the whole disc it sweeps keeps PLATE_LINE metres and more from the flown line, PLATE_SNOW from every site of the
// snow crystal, PLATE_WALL inside the hollow's walls, and PLATE_SIGHT from every straight sight from the line's places in
// the hollow to the snow crystal's centre (from no place of the way does it stand before the hero's heart: the small
// flakes' own rule). ITS FACING: its axis is A RANK OF THE LATTICE (PLATE_RANK: the rank of nodes that runs three cells
// across for every sheet along: the X rows' direction leaned 15.5 degrees toward the way in), pointing back toward
// the way in, so its face is turned to whoever comes; and it TURNS ABOUT ITS OWN AXIS on the world clock, one turn in
// PLATE_TURN_S seconds, from a first angle the visit deals. Its faces are DEEP ICE (the material facetBody).
export const PLATE_R = 70, PLATE_LINE = 35, PLATE_AHEAD = [250, 400], PLATE_RANK = [-3 * SIDE, 0, -GAP], PLATE_TURN_S = 160, PLATE_SNOW = 30, PLATE_WALL = 20, PLATE_SIGHT = 8, PLATE_THICK = 0.07;
// how near a place stands to the disc a plate sweeps as it turns (metres); `P`: { at, R, axis (a unit direction) }
export function discClear(P, x, y, z) {
  const dx = x - P.at[0], dy = y - P.at[1], dz = z - P.at[2];
  const h = dx * P.axis[0] + dy * P.axis[1] + dz * P.axis[2], r = Math.sqrt(Math.max(dx * dx + dy * dy + dz * dz - h * h, 0));
  return Math.hypot(Math.max(r - P.R, 0), Math.max(Math.abs(h) - PLATE_THICK * P.R, 0));
}
// the least distance from the flown line to a plate's disc (every metre of the line)
export function discLine(P) { const R = routeLine(), f = R.fine; let best = Infinity; for (let i = 0; i < R.n; i += 4) best = Math.min(best, discClear(P, f[i * 3], f[i * 3 + 1], f[i * 3 + 2])); return best; }
// points of a plate's disc (its rim and half way in), for the tests of place
const discPoints = (P, n = 36) => {
  const a = P.axis, ul = Math.hypot(a[2], a[0]) || 1, u = [a[2] / ul, 0, -a[0] / ul], v = [a[1] * u[2] - a[2] * u[1], a[2] * u[0] - a[0] * u[2], a[0] * u[1] - a[1] * u[0]], out = [];
  for (let q = 0; q < n; q++) for (const rr of [0.5, 1]) { const c = Math.cos(q * 2 * Math.PI / n) * P.R * rr, sn = Math.sin(q * 2 * Math.PI / n) * P.R * rr; out.push([P.at[0] + u[0] * c + v[0] * sn, P.at[1] + u[1] * c + v[1] * sn, P.at[2] + u[2] * c + v[2] * sn]); }
  return out;
};
let PLATE = null;
export function plateSpec() {
  if (PLATE) return PLATE;
  const l = Math.hypot(...PLATE_RANK), axis = PLATE_RANK.map((v) => v / l), fig = snowFigure(null), deg = 180 / Math.PI, R = routeLine(), f = R.fine, C = SNOW_AT;
  // the straight sights to the crystal's centre from the line's places in the hollow, as far as the place where the line is nearest that centre
  const sights = []; let iNear = 0, dNear = Infinity;
  for (let i = 0; i < R.n; i += 8) { const d = Math.hypot(C[0] - f[i * 3], C[1] - f[i * 3 + 1], C[2] - f[i * 3 + 2]); if (d < dNear) { dNear = d; iNear = i; } }
  for (let i = 0; i <= iNear; i += 8) if (hollowDepth(f[i * 3], f[i * 3 + 1], f[i * 3 + 2]) <= 0) sights.push([f[i * 3], f[i * 3 + 1], f[i * 3 + 2], C[0] - f[i * 3], C[1] - f[i * 3 + 1], C[2] - f[i * 3 + 2]]);
  const sightClear = (p) => { let best = Infinity; for (const [ex, ey, ez, dx, dy, dz] of sights) { const t = clamp(((p[0] - ex) * dx + (p[1] - ey) * dy + (p[2] - ez) * dz) / (dx * dx + dy * dy + dz * dz), 0, 1), d = Math.hypot(ex + dx * t - p[0], ey + dy * t - p[1], ez + dz * t - p[2]); if (d < best) best = d; } return best; };
  // the level's row: the row of an A sheet nearest the entry's level
  let j = 0; for (let q = -2; q <= 2; q++) if (Math.abs(rowY(q, K_FIRST)) < Math.abs(rowY(j, K_FIRST))) j = q;
  let best = null;
  for (let k = K_FIRST; k < K_FAULT; k++) {
    const y = rowY(j, k), z = GAP * k;
    // the hollow's near and far wall along the row (to the metre), and the row's site nearest half way between them
    let near = HOLLOW.x - 24, far = BOUNDS.x1; while (near < far && hollowDepth(near, y, z) >= 0) near++; while (far > near && hollowDepth(far, y, z) >= 0) far--;
    if (far - near < 2 * PLATE_R) continue;
    let c = Math.round((near + far) / 24); if ((c ^ j) & 1) c += 12 * (c + 1) - (near + far) / 2 < (near + far) / 2 - 12 * (c - 1) ? 1 : -1;
    const x = 12 * c, ahead = Math.hypot(x, y, z), bearing = Math.atan2(x, z) * deg; if (ahead < PLATE_AHEAD[0] || ahead > PLATE_AHEAD[1] || (best && bearing >= best.bearing)) continue;
    const P = { at: [x, y, z], R: PLATE_R, axis, k, bearing, ahead, share: (x - near) / (far - near) };
    P.line = discLine(P); if (P.line < PLATE_LINE) continue;
    P.wall = Infinity; P.snow = Infinity; P.sight = Infinity;
    for (const q of discPoints(P)) { P.wall = Math.min(P.wall, -hollowDepth(q[0], q[1], q[2])); P.snow = Math.min(P.snow, snowClear(fig, q[0], q[1], q[2], 200)); P.sight = Math.min(P.sight, sightClear(q)); }
    if (P.wall >= PLATE_WALL && P.snow >= PLATE_SNOW && P.sight >= PLATE_SIGHT) best = P;
  }
  return (PLATE = best);
}
// A PLATE'S FACES in its own frame (x, y in its plane, z along its axis), both skins alike. `habit`: the figure's own
// shares of its reach R: the heart's corner radius, an arm's half breadth, how far out the arm's broadest place and its
// end plate stand, the end plate's corner radius. ITS INNER LIGHT (the facets' tints): violet at the heart, teal along
// the arms, pale blue on the end plates, each a law of the face's own place in the figure.
export const PLATE_HABIT = { heart: 0.3, broad: 0.2, at: 0.5, end: 0.2, endAt: 0.8 };
export const PLATE_LINE_WIDE = 3, PLATE_LINE_LIGHT = 1.3;
export function plateFaces(batch, R, phase = 0, habit = PLATE_HABIT, light = 1) {
  const pt = (r, a, h) => [r * Math.cos(a), r * Math.sin(a), h], share = (q) => Math.hypot(q[0], q[1]) / R;
  const normal = (a, b, c) => { const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2]; const n = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx], l = Math.hypot(n[0], n[1], n[2]) || 1; return n.map((v) => v / l); };
  const H = habit, tintAt = (t) => (t < 0.5 ? mix3(ICE_VIOLET, ICE_TEAL, smoothstep(0.12, 0.5, t)) : mix3(ICE_TEAL, ICE_BLUE, smoothstep(0.5, 0.8, t)));
  for (const side of [1, -1]) {
    // a face from its corners (heights mirrored for the other skin; its normal turned outward from the plate's middle plane)
    const face = (pts, tint) => { const q = pts.map((v) => [v[0], v[1], v[2] * side]); let n = normal(q[0], q[1], q[2]); if (n[2] * side < 0) n = n.map((v) => -v); batch.face(q, n, q.map(share), [], phase, light, PLATE_LINE_LIGHT, tint); };
    // a six-sided plate about (cx, cy), corner radius a, turned by `turn`: a flat top (half of it) and six sloping facets down to its rim
    const hexPlate = (cx, cy, a, turn, hTop, hRim, top, slope) => {
      const c = (r, i, h) => { const q = pt(r, turn + i * Math.PI / 3, h); return [q[0] + cx, q[1] + cy, q[2]]; };
      face([0, 1, 2, 3, 4, 5].map((i) => c(0.5 * a, i, hTop)), top);
      for (let i = 0; i < 6; i++) face([c(0.5 * a, i, hTop), c(a, i, hRim), c(a, i + 1, hRim), c(0.5 * a, i + 1, hTop)], slope);
    };
    // the heart: its corners on the six arm directions
    hexPlate(0, 0, H.heart * R, 0, 0.07 * R, 0.012 * R, ICE_VIOLET, tintAt(0.3));
    for (let d = 0; d < 6; d++) {
      const A = d * Math.PI / 3, ux = Math.cos(A), uy = Math.sin(A), at = (s, t, h) => [ux * s - uy * t, uy * s + ux * t, h];
      // a sector arm: from its root on the heart's corner it broadens to H.broad R at H.at of the reach and narrows to the end
      // plate; five facets to either hand fan from the root, ridge and valley by turns (the ridges of a sector plate)
      const r0 = 0.73 * H.heart, r1 = H.endAt - 0.5 * H.end, root = at(r0 * R, 0, 0.05 * R), w = H.broad;
      const rim = [[lerp(r0, H.at, 0.07), 0.5 * w], [lerp(r0, H.at, 0.5), 0.85 * w], [H.at, w], [lerp(H.at, r1, 0.6), 0.8 * w], [r1, 0.42 * w], [r1, 0]];
      for (const hand of [1, -1]) for (let i = 0; i < rim.length - 1; i++) {
        const h0 = i & 1 ? 0.055 : 0.006, h1 = i & 1 ? 0.006 : 0.055;
        face([root, at(rim[i][0] * R, hand * rim[i][1] * R, h0 * R), at(rim[i + 1][0] * R, hand * rim[i + 1][1] * R, h1 * R)], tintAt((rim[i][0] + rim[i + 1][0]) / 2));
      }
      // the end plate: a corner on the arm's own direction, so the plate's reach is R
      hexPlate(ux * H.endAt * R, uy * H.endAt * R, H.end * R, A, 0.05 * R, 0.008 * R, ICE_PALE, ICE_BLUE);
    }
  }
}
// a plate as one body that turns: { mesh, update(time) }; `phase`: the first angle, a share of a turn (the visit deals
// it); `P`: its place, reach and axis (the great plate's by default); `turn`: the seconds of one turn
export function buildPlate(material, phase = 0, P = plateSpec(), habit = PLATE_HABIT, turn = PLATE_TURN_S) {
  const batch = facetBatch(PLATE_LINE_WIDE * P.R / PLATE_R); plateFaces(batch, P.R, phase, habit);
  const mesh = batch.mesh(material), axis = new THREE.Vector3(P.axis[0], P.axis[1], P.axis[2]).normalize();
  const stand = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), axis), spin = new THREE.Quaternion(), Z = new THREE.Vector3(0, 0, 1);
  mesh.position.set(P.at[0], P.at[1], P.at[2]); mesh.name = 'plate';
  const update = (time) => { spin.setFromAxisAngle(Z, 2 * Math.PI * (time / turn + phase)); mesh.quaternion.copy(stand).multiply(spin); };
  update(0);
  return { mesh, update, triangles: batch.triangles, axis, at: P.at, R: P.R, spec: P };
}
// how near a place stands to the disc the great plate sweeps as it turns (metres)
export const plateClear = (x, y, z) => discClear(plateSpec(), x, y, z);

// THE ROSE'S COMPANY (round r10; dealt by the visit: the world's stream 'lesser-plates'). BETWEEN THE HERO'S PASS AND
// THE ROSE STAND UP TO LESSER_N (TWO OR THREE) LESSER PLATE CRYSTALS OF ICE, each of a habit of its own (LESSER_HABITS: a star of slender
// arms, a plate of broad sectors, a broad heart with short arms) and a breadth of its own (LESSER_ACROSS metres from
// tip to tip, one from each share of that range), each on A LATTICE SITE the stream deals among the sites that pass
// these laws of place: a site of an A sheet between the snow crystal's sheet and the rose's plane (LESSER_Z), within
// LESSER_ROWS rows of the level; the place of the line nearest it lies between the pass and the last LAST_M metres;
// the whole disc it sweeps keeps LESSER_LINE metres and more from the flown line and its rim is passed within
// LESSER_NEAR metres more than that; the disc keeps LESSER_SIGHT metres from every straight sight from the line (from
// the pass on) to the spark, so none ever stands before the opening or the rose's heart; LESSER_SNOW from every site
// of the snow crystal and from the great plate's disc; (round r11) LESSER_RING from every ring of the rose, which
// now stand in the sheets before the spark's; no two centres nearer than LESSER_APART metres. ITS AXIS is a
// rank of the lattice: of the ranks that run one or two sheets back for up to LESSER_RANK[0] half cells across and
// LESSER_RANK[1] rows up or down, the one nearest the straight line from its own centre back to the pass (the line's
// place nearest the snow crystal's centre), so its face is turned to whoever comes from the hero; it turns about its
// own axis on the world clock, one turn in LESSER_TURN_S seconds, from a first angle the stream deals. The net keeps LESSER_NET metres clear of its reach (the world's rule), and no plate stands where that clearing would reach within REST_WHOLE[0] m of the open rank's line: the open rank's own rows are whole on every seed.
export const LESSER_N = 3, LESSER_ACROSS = [30, 60], LESSER_LINE = 35, LESSER_NEAR = 30, LESSER_ROWS = 2, LESSER_SIGHT = 10, LESSER_SNOW = 20, LESSER_APART = 70, LESSER_TURN_S = [70, 130], LESSER_NET = 14, LESSER_RING = 20;
export const LESSER_Z = [GAP * (SNOW.k + 1), SPARK[2] - GAP], LESSER_RANK = [8, 3];
export const LESSER_HABITS = [{ heart: 0.16, broad: 0.1, at: 0.5, end: 0.26, endAt: 0.74 }, { heart: 0.24, broad: 0.3, at: 0.55, end: 0.12, endAt: 0.88 }, { heart: 0.5, broad: 0.14, at: 0.7, end: 0.14, endAt: 0.86 }];
// (round r11m2) given the build's ctx it hands the page back between the sheets of its search and every LESSER_YIELD
// tries of a deal: no draw of the stream moves and no site is tried in another order
const LESSER_YIELD = 6;
export async function lesserPlates(rng, ctx) {
  const R = routeLine(), f = R.fine, fig = snowFigure(null), great = plateSpec(), out = [];
  // the line's stretch from the pass (its place nearest the snow crystal's centre) to the last LAST_M metres, and the sights from it to the spark
  let iPass = 0, dPass = Infinity; for (let i = 0; i < R.n; i += 4) { const d = Math.hypot(SNOW_AT[0] - f[i * 3], SNOW_AT[1] - f[i * 3 + 1], SNOW_AT[2] - f[i * 3 + 2]); if (d < dPass) { dPass = d; iPass = i; } }
  let iLast = R.n - 1; while (iLast > iPass && SPARK[2] - f[iLast * 3 + 2] < LAST_M) iLast--;
  const sights = []; for (let i = iPass; i < R.n; i += 8) sights.push([f[i * 3], f[i * 3 + 1], f[i * 3 + 2], SPARK[0] - f[i * 3], SPARK[1] - f[i * 3 + 1], SPARK[2] - f[i * 3 + 2]]);
  const sightClear = (p) => { let best = Infinity; for (const [ex, ey, ez, dx, dy, dz] of sights) { const t = clamp(((p[0] - ex) * dx + (p[1] - ey) * dy + (p[2] - ez) * dz) / (dx * dx + dy * dy + dz * dz), 0, 1), d = Math.hypot(ex + dx * t - p[0], ey + dy * t - p[1], ez + dz * t - p[2]); if (d < best) best = d; } return best; };
  const nearest = (x, y, z) => { let at = 0, best = Infinity; for (let i = 0; i < R.n; i += 4) { const d = Math.hypot(x - f[i * 3], y - f[i * 3 + 1], z - f[i * 3 + 2]); if (d < best) { best = d; at = i; } } return [at, best]; };
  // the sites that may carry one (the greatest reach a lesser plate has decides how far off the line a centre may lie)
  const sites = [], far = LESSER_LINE + LESSER_NEAR + LESSER_ACROSS[1] / 2;
  for (let k = K_FIRST; k < K_FAULT; k++) {
    const z = GAP * k; if (z < LESSER_Z[0] || z > LESSER_Z[1]) continue;
    for (let j = -LESSER_ROWS - 1; j <= LESSER_ROWS; j++) for (let c = Math.ceil(BOUNDS.x0 / 12); c <= BOUNDS.x1 / 12; c++) {
      if ((c ^ j) & 1) continue;
      const [x, y] = siteXYZ(c, j, k), [at, d] = pointClear(x, y, z, far + 1) < far ? nearest(x, y, z) : [0, Infinity];
      if (d < far && at > iPass && at < iLast) sites.push([x, y, z]);
    }
    if (ctx) await ctx.yield();
  }
  // the lattice rank nearest the way back from a place to the pass
  const pass = [f[iPass * 3], f[iPass * 3 + 1], f[iPass * 3 + 2]];
  const rankToPass = (at) => {
    const d = [pass[0] - at[0], pass[1] - at[1], pass[2] - at[2]], dl = Math.hypot(...d); let best = null, bd = -2;
    for (let kz = 1; kz <= 2; kz++) for (let cy = -LESSER_RANK[1]; cy <= LESSER_RANK[1]; cy++) for (let cx = -LESSER_RANK[0]; cx <= LESSER_RANK[0]; cx++) {
      if ((cx + cy) & 1) continue;
      const v = [12 * cx, ROW * cy, -GAP * kz], l = Math.hypot(...v), dot = (v[0] * d[0] + v[1] * d[1] + v[2] * d[2]) / (l * dl);
      if (dot > bd) { bd = dot; best = v.map((q) => q / l); }
    }
    return best;
  };
  // each plate takes its share of the breadths in a dealt order and the first dealt site that passes
  const order = [0, 1, 2].map((n) => [n, rng()]).sort((a, b) => a[1] - b[1]).map((q) => q[0]);
  // (the walk through the sites from the dealt first one goes by a step that shares no factor with their number, so it meets every site)
  const step = sites.length % 37 ? 37 : 41;
  for (let n = 0; n < LESSER_N && sites.length; n++) {
    const across = lerp(LESSER_ACROSS[0], LESSER_ACROSS[1], (order[n % 3] + rng()) / 3);
    const phase = rng(), turn = lerp(LESSER_TURN_S[0], LESSER_TURN_S[1], rng()), first = Math.floor(rng() * sites.length);
    for (let q = 0; q < sites.length; q++) {
      if (ctx && q % LESSER_YIELD === LESSER_YIELD - 1) await ctx.yield();
      const at = sites[(first + q * step) % sites.length], P = { at, R: across / 2, axis: rankToPass(at), habit: LESSER_HABITS[n % LESSER_HABITS.length], phase, turn };
      if (out.some((o) => Math.hypot(o.at[0] - at[0], o.at[1] - at[1], o.at[2] - at[2]) < LESSER_APART)) continue;
      // THE OPEN RANK'S OWN ROWS STAY WHOLE: no lesser plate takes a site from which its reach and the net's clearing (LESSER_NET) would come within REST_WHOLE[0] m of the open rank's line
      if (Math.hypot(at[0], at[1]) < REST_WHOLE[0] + P.R + LESSER_NET) continue;
      P.line = discLine(P); if (P.line < LESSER_LINE || P.line > LESSER_LINE + LESSER_NEAR) continue;
      P.sight = Infinity; P.snow = Infinity;
      for (const v of discPoints(P, 18)) { P.sight = Math.min(P.sight, sightClear(v)); P.snow = Math.min(P.snow, snowClear(fig, v[0], v[1], v[2], 200), great ? discClear(great, v[0], v[1], v[2]) : 200); }
      if (P.sight < LESSER_SIGHT || P.snow < LESSER_SNOW) continue;
      // (round r11: THE ROSE HAS DEPTH) no ring of the rose within LESSER_RING metres of the disc it sweeps (its rim, the ring half way in, its centre)
      P.rose = roseClear(at[0], at[1], at[2]); for (const v of [...discPoints(P, 18), ...discPoints({ ...P, R: P.R / 2 }, 9)]) P.rose = Math.min(P.rose, roseClear(v[0], v[1], v[2]));
      if (P.rose < LESSER_RING) continue;
      out.push(P); break;
    }
  }
  return out;
}

// THE COMPANY (round r11; the join sheet, ONE SPACE (2); THE SAME ON EVERY SEED, seen from the entry: a rule with no
// stream). BEYOND AND BESIDE THE GREAT PLATE COMPANY_N GREAT CRYSTALS OF ICE STEP AWAY INTO THE COLD DEEP, each a whole
// plate crystal of the kinds that exist (the plate's own faces in one of COMPANY_HABITS: the great plate's habit, the
// lesser plates' three, a slender star), COMPANY_ACROSS metres from tip to tip (the first the broadest, the last the
// least, even steps between), each turning about its own axis on the world clock (one turn in COMPANY_TURN_S seconds
// by its number, from a first angle by its number).
// THEIR PLACES ARE THE HOLLOW'S OWN FIGURE GROWN: crystal n stands on SHELL n, the hollow's almond grown about its
// heart (the middle of its face) by COMPANY_STEP of itself for each crystal (the last shell reaches about 900 m from
// the entry's place), at an angle round the heart, measured from straight out into the cold toward the hollow's far
// end, that goes by the golden step through COMPANY_ARC (so no two neighbours in number stand side by side), in a row
// of its sheet within COMPANY_ROWS rows of the level (the rows taken in turn), ON THE LATTICE SITE NEAREST THAT
// STATION THAT PASSES THE LAWS OF PLACE (the first that passes, going round the shell from the station by COMPANY_WALK
// degrees to either hand in turn):
//  - the whole disc it sweeps keeps COMPANY_LINE metres and more from the flown line;
//  - it stands off the open rank: its reach and the net's clearing keep outside the rank's own rows (REST_WHOLE[0]);
//  - it is not before the great plate as seen from the entry's place (nearer than the plate's far rim and within
//    the plate's breadth of sight);
//  - it stands in clear space: its middle in the cold deep beyond the hollow's far end (x DEEP_FROM and more: the
//    haze's law counts no crystal there), not in the amber crystal beyond the hollow's two ends;
//  - its disc keeps PLATE_SIGHT metres from every straight sight from the line's places in the hollow to the snow
//    crystal's centre and LESSER_SIGHT from every sight from the line (from the pass on) to the spark;
//  - PLATE_SNOW from every site of the snow crystal, LESSER_SNOW from the great plate's disc, COMPANY_RING from every
//    ring of the rose; no two of the company nearer than their two reaches and COMPANY_APART metres.
// ITS AXIS is a rank of the lattice: the one nearest the way from its own centre back to the hollow's middle (the
// middle of its depth on its long axis), so each is turned to whoever flies the hollow. The net and the frost keep
// LESSER_NET metres off its reach, as off a lesser plate's (the world's rule).
export const COMPANY_N = 9, COMPANY_STEP = 0.17, COMPANY_ARC = [-35, 65], COMPANY_WALK = 3, COMPANY_ROWS = 2, COMPANY_ACROSS = [120, 60], COMPANY_LINE = 35, COMPANY_APART = 30, COMPANY_RING = 20, COMPANY_TURN_S = [120, 220];
export const COMPANY_STAR = { heart: 0.18, broad: 0.1, at: 0.45, end: 0.13, endAt: 0.87 };
export const COMPANY_HABITS = [PLATE_HABIT, LESSER_HABITS[0], LESSER_HABITS[1], COMPANY_STAR, LESSER_HABITS[2]];
let COMPANY = null;
export function companySpecs() {
  if (COMPANY) return COMPANY;
  const R = routeLine(), f = R.fine, fig = snowFigure(null), great = plateSpec(), H = HOLLOW, golden = 0.6180339887, out = [];
  // the sights: from the line's places in the hollow to the snow crystal's centre (as far as the line's nearest place to it), and from there on to the spark
  let iPass = 0, dPass = Infinity; for (let i = 0; i < R.n; i += 8) { const d = Math.hypot(SNOW_AT[0] - f[i * 3], SNOW_AT[1] - f[i * 3 + 1], SNOW_AT[2] - f[i * 3 + 2]); if (d < dPass) { dPass = d; iPass = i; } }
  const toSnow = [], toSpark = [];
  for (let i = 0; i < R.n; i += 8) {
    const e = [f[i * 3], f[i * 3 + 1], f[i * 3 + 2]];
    if (i <= iPass && hollowDepth(e[0], e[1], e[2]) <= 0) toSnow.push([...e, SNOW_AT[0] - e[0], SNOW_AT[1] - e[1], SNOW_AT[2] - e[2]]);
    if (i >= iPass) toSpark.push([...e, SPARK[0] - e[0], SPARK[1] - e[1], SPARK[2] - e[2]]);
  }
  const sightClear = (sights, p) => { let best = Infinity; for (const [ex, ey, ez, dx, dy, dz] of sights) { const t = clamp(((p[0] - ex) * dx + (p[1] - ey) * dy + (p[2] - ez) * dz) / (dx * dx + dy * dy + dz * dz), 0, 1), d = Math.hypot(ex + dx * t - p[0], ey + dy * t - p[1], ez + dz * t - p[2]); if (d < best) best = d; } return best; };
  // the lattice rank nearest the way from a place back to the hollow's middle
  const mid = [H.x + H.ax / 2, 0, H.z];
  const rankToMid = (at) => {
    const d = [mid[0] - at[0], mid[1] - at[1], mid[2] - at[2]], dl = Math.hypot(...d); let best = null, bd = -2;
    for (let kz = -2; kz <= 2; kz++) for (let cy = -LESSER_RANK[1]; cy <= LESSER_RANK[1]; cy++) for (let cx = -LESSER_RANK[0]; cx <= LESSER_RANK[0]; cx++) {
      if ((cx + cy) & 1 || (!cx && !cy && !kz)) continue;
      const v = [12 * cx, ROW * cy, GAP * kz], l = Math.hypot(...v), dot = (v[0] * d[0] + v[1] * d[1] + v[2] * d[2]) / (l * dl);
      if (dot > bd) { bd = dot; best = v.map((q) => q / l); }
    }
    return best;
  };
  const passes = (P) => {
    const [x, y, z] = P.at, ahead = Math.hypot(x, y, z);
    if (Math.hypot(x, y) < REST_WHOLE[0] + P.R + LESSER_NET) return false;
    if (out.some((o) => Math.hypot(o.at[0] - x, o.at[1] - y, o.at[2] - z) < o.R + P.R + COMPANY_APART)) return false;
    // before the great plate as seen from the entry's place?
    const sep = Math.acos(clamp((x * great.at[0] + y * great.at[1] + z * great.at[2]) / (ahead * great.ahead), -1, 1)), wide = Math.asin(Math.min(1, P.R / ahead)), plateWide = Math.asin(great.R / great.ahead);
    if (ahead - P.R < great.ahead + great.R && sep < wide + plateWide) return false;
    // it stands in clear space: in the cold deep beyond the hollow's far end
    if (x < DEEP_FROM) return false;
    P.line = discLine(P); if (P.line < COMPANY_LINE) return false;
    P.snow = Infinity; P.sight = Infinity; P.spark = Infinity; P.rose = Infinity; P.plate = Infinity;
    for (const v of discPoints(P, 24)) {
      P.snow = Math.min(P.snow, snowClear(fig, v[0], v[1], v[2], 200)); P.plate = Math.min(P.plate, discClear(great, v[0], v[1], v[2]));
      P.sight = Math.min(P.sight, sightClear(toSnow, v)); P.spark = Math.min(P.spark, sightClear(toSpark, v)); P.rose = Math.min(P.rose, roseClear(v[0], v[1], v[2]));
    }
    P.ahead = ahead; P.bearing = Math.atan2(x, z) * 180 / Math.PI;
    return P.snow >= PLATE_SNOW && P.plate >= LESSER_SNOW && P.sight >= PLATE_SIGHT && P.spark >= LESSER_SIGHT && P.rose >= COMPANY_RING;
  };
  for (let n = 1; n <= COMPANY_N; n++) {
    // the shell's arc beyond the hollow's far end (where the shell's x is DEEP_FROM and more), within COMPANY_ARC
    const share = 1 + n * COMPANY_STEP, open = Math.acos(1 / share) * 180 / Math.PI, arc = [Math.max(COMPANY_ARC[0], -open), Math.min(COMPANY_ARC[1], open)];
    const a0 = lerp(arc[0], arc[1], frac(n * golden)), across = lerp(COMPANY_ACROSS[0], COMPANY_ACROSS[1], (n - 1) / (COMPANY_N - 1));
    const row = ((n * COMPANY_ROWS) % (2 * COMPANY_ROWS + 1)) - COMPANY_ROWS;
    for (let q = 0; q < 2 * Math.ceil((COMPANY_ARC[1] - COMPANY_ARC[0]) / COMPANY_WALK); q++) {
      const a = (a0 + (q & 1 ? 1 : -1) * Math.ceil(q / 2) * COMPANY_WALK) * Math.PI / 180;
      if (a < arc[0] * Math.PI / 180 - 1e-6 || a > arc[1] * Math.PI / 180 + 1e-6) continue;
      const k = Math.round((H.z + share * H.az * Math.sin(a)) / GAP), j = Math.round(-(isB(k) ? 0 : 2 / 3)) + row;
      let c = Math.round((H.x + share * H.ax * Math.cos(a)) / 12); if ((c ^ j) & 1) c++;
      const at = siteXYZ(c, j, k), P = { n, at, R: across / 2, axis: rankToMid(at), habit: COMPANY_HABITS[(n - 1) % COMPANY_HABITS.length], phase: frac(n * golden * golden), turn: lerp(COMPANY_TURN_S[0], COMPANY_TURN_S[1], frac(n * golden + 0.5)), shell: share, angle: a * 180 / Math.PI, walked: q };
      if (passes(P)) { out.push(P); break; }
    }
  }
  return (COMPANY = out);
}

// THE HOLLOW'S FAR WALL AT THE LEVEL (a figure of the hollow, the same on every seed): the furthest x at which a place
// of the level's own band still lies in the hollow, along the hollow's own length (FAR_Z), smoothed over FAR_SMOOTH
// metres. The ferns of the cold side root in it (the world's ICE_FERNS). (Round r11: the ice ridge that stood behind
// it is struck, with every law that read it.)
export const FAR_Z = [HOLLOW.z - HOLLOW.az, HOLLOW.z + HOLLOW.az], FAR_SMOOTH = 24;
let FAR = null;
const FAR_STEP = 4, farRaw = [];
// (the search begins 60 m beyond the almond's and the bay's plain figures: their ripples are less)
const farAt = (z) => {
  const plain = Math.max(HOLLOW.x + hollowDeep(z), Math.abs(z - BAY.z) < BAY.az ? BAY.x + BAY.ax * Math.sqrt(1 - ((z - BAY.z) / BAY.az) ** 2) : 0);
  let best = 0; for (const y of [-24, 0, 24]) { let x = Math.min(BOUNDS.x1, plain + 60); while (x > 60 && hollowDepth(x, y, z) > 0) x -= 2; if (x > best) best = x; }
  return best;
};
const farRawFill = (to) => { while (farRaw.length < to) farRaw.push(farAt(FAR_Z[0] + FAR_STEP * farRaw.length)); };
const farRawCount = () => Math.floor((FAR_Z[1] - FAR_Z[0]) / FAR_STEP) + 1;
// the same wall, its far places found in pieces with a breath between them: a build calls this before anything asks for the wall
export async function primeFarWall(ctx) {
  if (FAR) return FAR;
  for (let n = 8; farRaw.length < farRawCount(); n += 8) { farRawFill(Math.min(n, farRawCount())); await ctx.yield(); }
  return farWall();
}
export function farWall() {
  if (FAR) return FAR;
  const z0 = FAR_Z[0], step = FAR_STEP, raw = farRaw, far = [];
  farRawFill(farRawCount());
  const half = Math.round(FAR_SMOOTH / step);
  for (let i = 0; i < raw.length; i++) { let sum = 0, n = 0; for (let q = Math.max(0, i - half); q <= Math.min(raw.length - 1, i + half); q++) { sum += raw[q]; n++; } far.push(sum / n); }
  const farX = (z) => { const f = clamp((z - z0) / step, 0, far.length - 1), i = Math.min(far.length - 2, Math.floor(f)); return lerp(far[i], far[i + 1], f - i); };
  return (FAR = { farX });
}

// MIST (round r10; the same on every seed, by hashes of its own numbers: a body by place). One mesh of broad soft clouds
// (each a round fall of light to nothing at its rim, no grain, added over the dark; each breathes on a slow rate of
// its own on the world clock) that SINK INTO THE DEEP WITH THE LENGTH OF THE SIGHT (half of a cloud's light by its
// body's own half length).
// THE COOL DEEP BEHIND THE ROSE: MIST_ROSE.n clouds of violet and blue mist in a great body MIST_ROSE.z metres beyond
// the rose's plane (its middle on the open rank's line, MIST_ROSE.x and .y metres to either side, denser toward the
// middle), radii MIST_ROSE.size, violet to blue by the cloud's hash, its light MIST_ROSE.light, half by MIST_ROSE.half
// metres of sight AND GONE AT MIST_ROSE.gone METRES OF SIGHT (it begins to go at four tenths of that): from the entry
// (860 m and more from its nearest cloud) nothing of it is seen; from the last third it stands violet behind the gold
// rings. (Round r11: the teal bank at the ice ridge's feet is struck with the ridge.)
export const MIST_ROSE = { n: 30, z: [300, 900], x: 380, y: 230, size: [150, 300], light: 0.5, half: 400, gone: 820, violet: '#6B46E6', blue: '#3A6CF0' };
const MIST_VERT = /* glsl */`
attribute vec4 aAt;     // the cloud's middle; its radius
attribute vec4 aCol;    // its light (linear); the sight's length that halves it
attribute vec3 aBreath; // its rate (radians a second), its first phase; the sight's length at which it is gone
uniform float uTime;
varying vec2 vP; varying vec3 vCol;
void main(){
  vec4 mv = modelViewMatrix * vec4(aAt.xyz, 1.);
  float d = length(aAt.xyz - cameraPosition);
  vCol = aCol.rgb * exp(-.6931 * d / aCol.w) * (1. - smoothstep(.4 * aBreath.z, aBreath.z, d)) * (.85 + .15 * sin(uTime * aBreath.x + aBreath.y));
  mv.xy += position.xy * aAt.w; vP = position.xy;
  gl_Position = projectionMatrix * mv;
}`;
const MIST_FRAG = /* glsl */`
varying vec2 vP; varying vec3 vCol;
void main(){ float q = max(1. - dot(vP, vP), 0.); gl_FragColor = vec4(vCol * (q * q * q), 1.); }`;
export function buildMist(shared) {
  const at = [], col = [], breath = [], h = (n, salt) => siteHash(n, 0, 5, 700 + salt);
  const violet = lin(MIST_ROSE.violet, MIST_ROSE.light), blue = lin(MIST_ROSE.blue, MIST_ROSE.light);
  for (let n = 0; n < MIST_ROSE.n; n++) {
    // (denser toward the middle: the product of two shares to either side)
    const side = (salt) => (h(n, salt) - 0.5) * 2 * Math.sqrt(h(n, salt + 1)), c = mix3(violet, blue, h(n, 16));
    at.push(SPARK[0] + MIST_ROSE.x * side(10), SPARK[1] + MIST_ROSE.y * side(12), SPARK[2] + lerp(MIST_ROSE.z[0], MIST_ROSE.z[1], h(n, 14)), lerp(MIST_ROSE.size[0], MIST_ROSE.size[1], h(n, 15)));
    col.push(c[0], c[1], c[2], MIST_ROSE.half); breath.push(0.04 + 0.06 * h(n, 17), 6.283 * h(n, 18), MIST_ROSE.gone);
  }
  const g = QUAD();
  g.setAttribute('aAt', new THREE.InstancedBufferAttribute(new Float32Array(at), 4)); g.setAttribute('aCol', new THREE.InstancedBufferAttribute(new Float32Array(col), 4)); g.setAttribute('aBreath', new THREE.InstancedBufferAttribute(new Float32Array(breath), 3));
  g.instanceCount = at.length / 4;
  const material = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, depthTest: true, blending: THREE.AdditiveBlending, uniforms: { uTime: shared.uTime }, vertexShader: MIST_VERT, fragmentShader: MIST_FRAG });
  const mesh = new THREE.Mesh(g, material); mesh.frustumCulled = false; mesh.name = 'mist';
  return { mesh, count: at.length / 4 };
}

// the four materials every lamp and thread of the crystal is drawn with; `shared` holds the uniform objects they have in common
export function makeMaterials(shared) {
  const base = { transparent: true, depthWrite: false, depthTest: true, blending: THREE.AdditiveBlending, side: THREE.DoubleSide };
  const lampU = { ...shared, uSkirt: { value: 0.22 }, uBody: { value: 0.5 } }, threadU = { ...shared, uLine: { value: 1 }, uBarb: { value: 0.95 }, uVane: { value: 0.05 } };
  const mk = (vs, fs, uniforms, growth, more = {}) => new THREE.ShaderMaterial({ ...base, uniforms, vertexShader: vs, fragmentShader: fs, defines: growth ? { GROWTH: 1 } : {}, ...more });
  // the ice's four lights (linear): the dark ice of a face turned to neither side, the warm gold, the cold blue white, the edge's line
  const v = (c) => ({ value: new THREE.Vector3(c[0], c[1], c[2]) });
  const iceU = { ...shared, uIceDark: v(ICE_DARK), uIceGold: v(ICE_GOLD), uIceCold: v(ICE_COLD), uIceEdge: v(ICE_LINE), uIceViolet: v(ICE_VIOLET), uIceTeal: v(ICE_TEAL) };
  return { lamp: mk(LAMP_VERT, LAMP_FRAG, lampU, false), lampGrowth: mk(LAMP_VERT, LAMP_FRAG, lampU, true), thread: mk(THREAD_VERT, THREAD_FRAG, threadU, false), threadGrowth: mk(THREAD_VERT, THREAD_FRAG, threadU, true), ice: mk(ICE_VERT, ICE_FRAG, iceU, false), facet: mk(FACET_VERT, FACET_FRAG, iceU, false),
    // (round r10) a body of deep ice: the same faceted ice with its inner light, only the faces turned to the eye drawn
    facetBody: mk(FACET_VERT, FACET_FRAG, iceU, false, { defines: { BODY: 1 }, side: THREE.FrontSide }), iceBody: mk(ICE_VERT, ICE_FRAG, iceU, false, { defines: { BODY: 1 }, side: THREE.FrontSide }), lampU, threadU, iceU };
}
export function makeShared(cold) {
  return { uTime: { value: 0 }, uCold: { value: new THREE.Color(cold || '#F2F8FF') }, uSpark: { value: new THREE.Vector3(SPARK[0], SPARK[1], SPARK[2]) },
    uWhiteGold: { value: new THREE.Color(WHITE_GOLD) }, uFault: { value: new THREE.Vector4(0, 0, 0, 0) }, uFaultB: { value: new THREE.Vector4(0, 0, 0, 0) }, uFaultX: { value: new THREE.Vector4(0, 0, 0, 0) },
    uWavePh: { value: new THREE.Vector3(0, 0, 0) } };
}

// ---------------------------------------------------------------- instances
// colours (linear, times their strength). THE CRYSTAL AGES INWARD, a law of the depth: pale gold at the hollow's
// wall, gold from 40 m, deepening from 144 m through orange to ember red by 304 m; threads the same, dimmer.
const lin = (hex, k = 1) => { const c = new THREE.Color(hex); return [c.r * k, c.g * k, c.b * k]; };
// the ice's lights: dark ice (a deep blue, low), warm gold (the lamps' own gold), cold blue white (the frost's own pale blue), the edge's line
export const ICE_DARK = lin('#5C8FE0', 0.08), ICE_GOLD = lin('#F2A93B', 0.45), ICE_COLD = lin('#9CC4FF', 0.42), ICE_LINE = lin('#EAF3FF', 0.2);
// (round r10) the inner lights of deep ice: violet, teal, ice blue, pale blue white
export const ICE_VIOLET = lin('#7A5CE0', 0.6), ICE_TEAL = lin('#2FB5B0', 0.62), ICE_BLUE = lin('#8DB8FF', 0.5), ICE_PALE = lin('#DCEBFF', 0.42);
export const GOLD = lin('#F2A93B', 2.6), PALE = lin('#FFD98A', 2.2), ORANGE = lin('#E8701E', 2.5), EMBER = lin('#B5260F', 2.3);
// (round r11) the frost white a lamp and a thread cool to where the net thins out (netThinColour)
export const NET_FROST = lin('#DCEBFF', 1.5), NET_FROST_THREAD = lin('#DCEBFF', 0.4);
export const THREAD_GOLD = lin('#A8681C', 1), THREAD_PALE = lin('#FFD98A', 0.62), THREAD_ORANGE = lin('#A8481A', 1), THREAD_EMBER = lin('#8A2210', 0.9);
const mix3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const scale3 = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const aged = (d, pale, gold, orange, ember) => (d < 100 ? mix3(pale, gold, smoothstep(0, 40, d)) : d < 224 ? mix3(gold, orange, smoothstep(144, 224, d)) : mix3(orange, ember, smoothstep(224, 304, d)));
export const lampColourOf = (depth) => aged(depth, PALE, GOLD, ORANGE, EMBER);
export const threadColourOf = (depth) => aged(depth, THREAD_PALE, THREAD_GOLD, THREAD_ORANGE, THREAD_EMBER);

// NOTHING BRIGHT AND SHAPELESS BESIDE THE WAY, by a thing's own place against the route's fixed line (never the eye):
// a lamp within 14 m of the line keeps its core and draws its soft skirt at a third, at a half 30 m off (whole from 46 m); a thread within 7 m of the line
// is drawn at half its width and 0.6 of its light and its feather gives up its vane; nothing within 30 m of the
// line is drawn at any size but its true one. And by the same places: a thread wider than a common one (a stem's)
// takes its extra width only from 10 m off the line, whole from 20 m; a lamp larger than a common one (a stem's) takes
// its extra size only from 14 m off the line, whole from 30 m; a lamp's lock-on flash swells it only where its
// skirt is whole (not at all within 14 m of the line, wholly from 30 m).
// The fifth figure of a lamp and the sixth of a thread: how near the line it stands (1 within 30 m, nothing from 90 m):
// its white hot centre, its six short rays, its sheath.
export function lampAux(x, y, z, size = 1, keep = 0) {
  const d = pointClear(x, y, z, 90), off = clamp((d - 14) / 16, 0, 1);
  return [size > 1 ? lerp(1, size, off) : size, d < 30 ? lerp(1 / 3, 1 / 2, off) : lerp(1 / 2, 1, clamp((d - 30) / 16, 0, 1)), smoothstep(30, 40, d), keep, 1 - smoothstep(30, 90, d)];
}
export function threadNear(A, B) {
  const d = lineClear(A[0], A[1], A[2], B[0], B[1], B[2], 45), wide = smoothstep(7, 10, d), dm = d < 45 ? d : pointClear((A[0] + B[0]) / 2, (A[1] + B[1]) / 2, (A[2] + B[2]) / 2, 90);
  return { width: lerp(0.5, 1, wide), light: lerp(0.6, 1, wide), floor: smoothstep(30, 40, d), vane: wide, stout: smoothstep(10, 20, d), near: 1 - smoothstep(30, 90, dm) };
}

const QUAD = () => { const g = new THREE.InstancedBufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]); return g; };
const RIBBON = (feather) => {
  const g = new THREE.InstancedBufferGeometry(), p = [0, -1, 0, 1, -1, 0, 1, 1, 0, 0, 1, 0], ix = [0, 1, 2, 0, 2, 3];
  if (feather) { p.push(0, -1, 1, 1, -1, 1, 1, 1, 1, 0, 1, 1); ix.push(4, 5, 6, 4, 6, 7); }
  g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setIndex(ix); return g;
};
const inst = (g, name, arr, size) => g.setAttribute(name, new THREE.InstancedBufferAttribute(new Float32Array(arr), size));
// lamps: add(x, y, z, kind, colour, waves, clock, dir, aux); mesh(material) gives one draw call
export function lampBatch(growth) {
  const site = [], col = [], aux = [], near = [], clock = [], dir = [];
  return {
    get count() { return site.length / 4; },
    add(x, y, z, kind, c, wave, clk, d, ax) { site.push(x, y, z, kind); col.push(c[0], c[1], c[2], wave); aux.push(ax[0], ax[1], ax[2], ax[3]); near.push(ax[4] ?? 0); if (growth) { clock.push(clk[0], clk[1], clk[2], clk[3]); dir.push(d[0], d[1], d[2]); } },
    mesh(material) {
      const g = QUAD(); inst(g, 'aSite', site, 4); inst(g, 'aCol', col, 4); inst(g, 'aAux', aux, 4); inst(g, 'aNear', near, 1); if (growth) { inst(g, 'aClock', clock, 4); inst(g, 'aDir', dir, 3); }
      g.instanceCount = site.length / 4;
      const m = new THREE.Mesh(g, material); m.frustumCulled = false; return m;
    },
    // the same mesh, made with a breath after each of its lists (a build's largest batches are made this way)
    async meshInSteps(ctx, material) {
      const g = QUAD(), lists = [['aSite', site, 4], ['aCol', col, 4], ['aAux', aux, 4], ['aNear', near, 1]]; if (growth) lists.push(['aClock', clock, 4], ['aDir', dir, 3]);
      for (const [name, arr, size] of lists) { inst(g, name, arr, size); await ctx.yield(); }
      g.instanceCount = site.length / 4;
      const m = new THREE.Mesh(g, material); m.frustumCulled = false; return m;
    },
  };
}
// threads: add(A, B, cap, width, colour, clockA, clockB, keep, aux, dim)
export function threadBatch(growth) {
  const a = [], b = [], col = [], aux = [], ca = [], cb = [], dims = [];
  return {
    get count() { return a.length / 4; },
    add(A, B, cap, width, c, clkA, clkB, keep, ax, dim = 1) { a.push(A[0], A[1], A[2], cap); b.push(B[0], B[1], B[2], width); col.push(c[0], c[1], c[2], keep); aux.push(ax[0], ax[1], ax[2], ax[3] ?? 0); if (growth) { ca.push(clkA[0], clkA[1], clkA[2], clkA[3]); cb.push(clkB[0], clkB[1], clkB[2], clkB[3]); dims.push(dim); } },
    mesh(material) {
      const g = RIBBON(growth); inst(g, 'aA', a, 4); inst(g, 'aB', b, 4); inst(g, 'aCol', col, 4); inst(g, 'aAux', aux, 4); if (growth) { inst(g, 'aClkA', ca, 4); inst(g, 'aClkB', cb, 4); inst(g, 'aDim', dims, 1); }
      g.instanceCount = a.length / 4;
      const m = new THREE.Mesh(g, material); m.frustumCulled = false; return m;
    },
    async meshInSteps(ctx, material) {
      const g = RIBBON(growth), lists = [['aA', a, 4], ['aB', b, 4], ['aCol', col, 4], ['aAux', aux, 4]]; if (growth) lists.push(['aClkA', ca, 4], ['aClkB', cb, 4], ['aDim', dims, 1]);
      for (const [name, arr, size] of lists) { inst(g, name, arr, size); await ctx.yield(); }
      g.instanceCount = a.length / 4;
      const m = new THREE.Mesh(g, material); m.frustumCulled = false; return m;
    },
  };
}
// the direction a site's point comes in from the deep along (and leaves along): dealt from the site itself, the first
// of six whose whole line keeps 3 m and more from the route's line
export function arrivalDir(c, j, k) {
  const [x, y, z] = siteXYZ(c, j, k); let best = null, bd = -1;
  for (let t = 0; t < 6; t++) {
    const dx = 0.55 + 0.45 * siteHash(c, j, k, 10 + 3 * t), dy = 1.3 * (siteHash(c, j, k, 11 + 3 * t) - 0.5), dz = 1.3 * (siteHash(c, j, k, 12 + 3 * t) - 0.5), n = Math.hypot(dx, dy, dz);
    const d = [dx / n, dy / n, dz / n], clear = lineClear(x, y, z, x + d[0] * ARRIVE_M, y + d[1] * ARRIVE_M, z + d[2] * ARRIVE_M, 8);
    if (clear >= 3) return d;
    if (clear > bd) { bd = clear; best = d; }
  }
  return best;
}
// the feather a young thread may wear, shortened by place: nothing within 2.6 m of the route's line, growing by 0.45 m
// for every metre further off (its whole 6 m from 16 m off the line): no barb tip nearer the line than 2.6 m
export const featherCap = (A, B) => clamp(0.45 * (lineClear(A[0], A[1], A[2], B[0], B[1], B[2], 17) - 2.6), 0, FEATHER_M);

export const hollowDeep = (z) => HOLLOW.ax * Math.sqrt(Math.max(0, 1 - ((z - HOLLOW.z) / HOLLOW.az) ** 2));
export const hollowHigh = (z) => HOLLOW.ay * Math.sqrt(Math.max(0, 1 - ((z - HOLLOW.z) / HOLLOW.az) ** 2));

// the clock of a site by its place alone: the live rind runs on rindClock, everything inside it stands
export const placeClock = (c, j, k, rate) => {
  const depth = hollowDepth(12 * c, rowY(j, k), GAP * k);
  return stateOfDepth(depth) === RIND_LIVE ? rindClock(c, j, k, rate, depth) : STANDING;
};
// THE RIND of sheet k as growth: its live sites (those `mine` says are this builder's) and every thread with a live end
// between two sites of the crystal (`threadMine(a, b)` says whose it is; each thread is found once). The sites that
// stand (the inner rind) and the threads between two standing sites are the finished crystal's and are not listed here.
// (a site's state and its depth from the dark are read from the sheet's own list, as the builder has them: `edge`,
// where a site carries one, else its depth from the hollow's wall)
export function rindSet(k, rate, mine, threadMine, all) {
  const sites = [], threads = [], z = GAP * k;
  for (const s of all || latticeSites(k)) {
    if (s.state !== RIND_LIVE) continue;
    const clock = rindClock(s.c, s.j, k, rate, s.depth), A = { c: s.c, j: s.j, k, x: s.x, y: s.y, z, clock };
    if (mine(s.c, s.j, k)) sites.push(A);
    for (const [dc, dj] of STEPS) {
      const c = s.c + dc, j = s.j + dj, x = 12 * c, y = rowY(j, k);
      if (x < BOUNDS.x0 || x > BOUNDS.x1 || y < BOUNDS.y0 || y > BOUNDS.y1 || onSparkRow(c, j, k)) continue;
      const depth = hollowDepth(x, y, z), st = stateOfDepth(depth); if (st === BEYOND) continue;
      if (st === RIND_LIVE && siteKey(c, j, k) < siteKey(s.c, s.j, k)) continue;
      if (!threadMine(s, { c, j, k })) continue;
      threads.push([A, { c, j, k, x, y, z, clock: st === RIND_LIVE ? rindClock(c, j, k, rate, depth) : STANDING }, 1]);
    }
  }
  return { sites, threads };
}
// a fern's figure as growth: its threads by sites, a thread to the rind taking the rind site's own clock
export function fernSet(fig, rate) {
  const threads = fig.threads.map(([a, b, rank]) => {
    if (typeof b === 'number') return [fig.sites[a], fig.sites[b], rank];
    const [x, y, z] = siteXYZ(b[0], b[1], b[2]);
    return [fig.sites[a], { c: b[0], j: b[1], k: b[2], x, y, z, clock: placeClock(b[0], b[1], b[2], rate) }, rank];
  });
  return { sites: fig.sites, threads };
}
// THREE RANKS OF WEIGHT: a stem's lamps half again as large and its threads twice as wide and brighter, fronds
// common, branchlets thinner (and every rank times its fern's own weight)
const RANK_LAMP = [1.5, 1, 0.72], RANK_WIDE = [2, 1, 0.6], RANK_LIGHT = [1.6, 1, 0.8];
// the young frost of the rind and of the small ferns wears its white and its ice at this share of full strength (round r6: 0.8,
// so that a young lamp of the rind reads blue white among the gold; it was 0.45)
export const YOUNG_DIM = 0.8;
// a set of growth into the batches: a lamp for every site, a feathered thread for every pair. What has cooled is
// pale gold and dimmer (by its depth: the rind deepens toward gold).
export function addGrowth(lamps, threads, set, cold) {
  for (const s of set.sites) {
    const rank = s.rank ?? 1, d = hollowDepth(s.x, s.y, s.z), wt = s.weight ?? 1;
    const col = scale3(lampColourOf(d), d < 0 ? (rank === 0 ? 1.2 : 0.8) : 1);
    lamps.add(s.x, s.y, s.z, 0, col, YOUNG_DIM, s.clock, s.clock[0] > 0 ? arrivalDir(s.c, s.j, s.k) : [1, 0, 0], lampAux(s.x, s.y, s.z, RANK_LAMP[rank] * wt));
  }
  for (const [A, B, rk] of set.threads) {
    const rank = rk ?? 1, a = [A.x, A.y, A.z], b = [B.x, B.y, B.z], d = hollowDepth((A.x + B.x) / 2, (A.y + B.y) / 2, A.z), near = threadNear(a, b);
    // within 7 m of the line every rank alike is half a common thread wide at 0.6 of a common thread's light
    // (what has cooled is dimmer: 0.6 in the rind, 0.85 on a fern in the hollow, which is seen across the dark)
    const wt = A.weight ?? 1, full = RANK_WIDE[rank] * wt, wideOf = lerp(0.5, lerp(Math.min(1, full), full, near.stout), near.vane);
    const lightOf = lerp(0.6, RANK_LIGHT[rank] * (d < 0 ? 0.85 : 0.6), near.vane);
    threads.add(a, b, featherCap(a, b), wideOf, scale3(threadColourOf(d), lightOf), A.clock, B.clock, 0, [0, near.vane, 0, near.near], YOUNG_DIM);
  }
}

// ---------------------------------------------------------------- the hero: THE SNOW CRYSTAL
// FROST, NOT LAMPS: the crystal is threads of frost and nothing else (no lamp stands on it; a growing tip alone has a
// small point that comes in, locks on with a flash and cools). A thread keeps its width in metres at every distance:
// a spine 1.44 m across (its core a third of that), a branch half, a branchlet or spur a quarter; spines blue white
// (#DCEBFF), branches between, branchlets and spurs pale blue (#9CC4FF), the knot fine and white. Every thread wears, for
// good, a short feather of barbs in the sheet's plane (4.2 m on a spine, 3.2 on a branch, 2.2 on a branchlet) with
// almost no soft light between the barbs, so that no stretch of it adds up to white.
// THE KNOT IS FINE (round r7): its twelve threads (the six first threads of the spines and the small hexagon that joins
// their ends) are a third of a spine's width and no hotter than a spine. Six threads of a spine's width meeting in a
// hexagon of 6 m added up to one hot patch, and every hot dot feeds the glow: that glow lay as a soft veil between the
// spines at the centre. Now the centre is a small fine hexagon with the dark between its spokes.
const SNOW_WIDE = [9, 4.5, 2.2, 3], SNOW_BARB = [4.2, 3.2, 2.2, 1.6];
export const SNOW_COL = [lin('#DCEBFF', 2.1), lin('#C0DAFF', 1.5), lin('#9CC4FF', 1.3), lin('#EAF3FF', 2.0)], SNOW_POINT = lin('#9CC4FF', 1.2);
// the share of its light a crystal thread's feather gives up (its barbs are fine and pale beside the thread itself)
export const SNOW_BARB_DIM = 0.4;
// where a spine's thread begins to narrow (the share of the arm's length) and what it keeps of its width at the tip
export const SPINE_TAPER = [2 / 3, 0.5], ARM_CORE = [0.3, 0.4];
// where a wall fern's threads are fine (metres from the route's line: a third of their width within the first, whole from the second)
export const WALL_FINE = [24, 48];
// `size`: the figure's own measure against the great crystal's (a small flake: its pitch over the crystal's). Its
// threads are as much finer, though none finer than FLAKE_FINE of the crystal's (a line must stay a line); a figure
// under half the crystal's size wears no feather (its threads are shorter than the barbs' spacing). A flake's threads
// have FLAKE_LIGHT of the crystal's light: the small ones do not outshine the great one.
export const FLAKE_FINE = 0.25, FLAKE_LIGHT = 0.6;
export function addSnow(lamps, threads, fig, small = false, size = 1) {
  // (a wall fern is drawn one rank finer than the crystal, its spine as a branch, its branches as branchlets, at 0.7 of the light;
  // a GREAT fern, `small` given as 'great', is drawn one rank finer too but at the whole light and at its whole width everywhere)
  const great = small === 'great', rk = (rank) => (small ? Math.min(2, rank + 1) : rank);
  // BESIDE THE WAY A WALL FERN IS FINE (round r7), by its own place against the route's fixed line as every thread's width is:
  // a thread of a wall fern is a third as wide within WALL_FINE[0] metres of the line and takes its whole width from
  // WALL_FINE[1] metres off it (the crystal itself keeps its widths: its nearest thread stands 30 m from the line)
  const fine = (a, b) => (small && !great ? lerp(1 / 3, 1, smoothstep(WALL_FINE[0], WALL_FINE[1], lineClear(a[0], a[1], a[2], b[0], b[1], b[2], WALL_FINE[1] + 2))) : 1);
  const one = (A, B, rank, wide = 1, light = 1) => { const a = [A.x, A.y, A.z], b = [B.x, B.y, B.z]; threads.add(a, b, size < 0.5 ? 0 : Math.min(SNOW_BARB[rank] * size, featherCap(a, b)), SNOW_WIDE[rank] * Math.max(size, size < 1 ? FLAKE_FINE : 1) * wide * fine(a, b), small && !great ? scale3(SNOW_COL[rank], 0.7) : size < 1 ? scale3(SNOW_COL[rank], FLAKE_LIGHT) : light < 1 ? scale3(SNOW_COL[rank], light) : SNOW_COL[rank], A.clock, B.clock ?? STANDING, 1, [SNOW_BARB_DIM, 0.4, 0, 0], 1); };
  // AN ARM ENDS IN A TIP THAT TAPERS (round r8): a spine's thread keeps its whole width for the inner SPINE_TAPER[0] of
  // the arm and narrows from there to SPINE_TAPER[1] of it (a branch's width) at the arm's last site
  const share = new Map(); for (const spine of fig.spines || []) spine.forEach((i, n) => share.set(i, n / (spine.length - 1)));
  const taper = (i, rank) => (rank === 0 && share.has(i) ? lerp(1, SPINE_TAPER[1], smoothstep(SPINE_TAPER[0], 1, share.get(i))) : 1);
  // ON THE GREAT CRYSTAL THE ARM IS ITS ICE (round r10): where a spine's thread stands for good a body of ice lies
  // along it (addIce, addBody), and the thread is the fine core line inside that ice: ARM_CORE[0] of a spine's width,
  // ARM_CORE[1] of its light (a spine's whole thread under its ice summed to a white bar)
  const core = (i, o, rank) => !small && size === 1 && rank === 0 && !(fig.sites[i].clock[0] > 0) && !(fig.sites[o].clock[0] > 0);
  for (const [i, o, rank] of fig.threads) { const c = core(i, o, rank); one(fig.sites[i], fig.sites[o], rk(rank), taper(i, rank) * (c ? ARM_CORE[0] : 1), c ? ARM_CORE[1] : 1); }
  if (fig.root) one(fig.sites[fig.root[0]], { x: fig.root[1][0], y: fig.root[1][1], z: fig.root[1][2] }, rk(0));
  for (const q of fig.sites) {
    if (!(q.clock[0] > 0)) continue;
    // it comes in from beyond its own tip, a little out of the sheet (to one face or the other by the site): the first
    // of four such lines (either face, shallow or steep) that keeps 3 m and more from the route's line
    const face = siteHash(q.a, q.b, 0, 300) < 0.5 ? -0.3 : 0.3; let dir = null, bd = -1;
    for (const lean of [face, -face, 4 * face, -4 * face]) {
      const n = Math.hypot(q.grow[0], q.grow[1], lean), d = [q.grow[0] / n, q.grow[1] / n, lean / n];
      const clear = lineClear(q.x, q.y, q.z, q.x + d[0] * ARRIVE_M, q.y + d[1] * ARRIVE_M, q.z + d[2] * ARRIVE_M, 8);
      if (clear > bd) { bd = clear; dir = d; }
      if (clear >= 3) break;
    }
    lamps.add(q.x, q.y, q.z, 3, SNOW_POINT, 1, q.clock, dir, [0.7, 1, 0, 0, 0]);
  }
}
// ---------------------------------------------------------------- ICE ALONG THE SPINES (round r8)
// ICE STANDS ONLY ON FROST THAT STANDS FOR GOOD: a bar runs along a spine from the knot (the spine's first site, a
// frost site from the centre: the knot's own fine hexagon is the centre, and six bars do not pile up on it) to the
// last site of the spine that never leaves (the growing tip beyond it is bare frost), and along each greater rib (a
// branch of three sites and more: the branches that grow at their tips) from its spine site to its last standing site.
// A BAR IS SIX-SIDED, a ridge toward either face of its sheet: ICE_SPINE metres across its flats in the sheet at a spine's root,
// ICE_RIB[0] to ICE_RIB[1] at a rib's root by the rib's length (the shortest to the longest), and it tapers to nothing
// at its end by 1 - (the share of its length) squared: it keeps its body to its middle and comes to a point.
export const ICE_SPINE = 2.4, ICE_RIB = [0.5, 0.9], ICE_TWIG = 0.42, ICE_SEGS = 8;
export function iceBatch() {
  const pos = [], nor = [], aw = [], ix = [];
  return {
    get triangles() { return ix.length / 3; },
    // one bar from A to B in a sheet (both at one z), `wide` metres across its flats at A; `size`: the figure's own
    // measure against the great crystal's (a face's breadth is handed on in the great crystal's measure, so a small
    // flake's ice is the crystal's ice at its size: the same edge lines, the same whole light)
    bar(A, B, wide, segs, phase, size = 1) {
      const dx = B[0] - A[0], dy = B[1] - A[1], len = Math.hypot(dx, dy); if (len < 1e-3) return;
      const ax = dx / len, ay = dy / len, px = -ay, py = ax, R0 = 0.5 * wide / Math.cos(Math.PI / 6);
      const radius = (t) => R0 * (1 - t * t);
      for (let f = 0; f < 6; f++) {
        // the face between two corners a sixth of a turn apart about the axis (angles from the sheet's own direction
        // across the bar toward +Z; a corner stands toward +Z and one toward -Z: a ridge to either face of the sheet);
        // its normal stands half way between its corners
        const a0 = (f + 0.5) * Math.PI / 3, a1 = a0 + Math.PI / 3, am = a0 + Math.PI / 6;
        const n = [px * Math.cos(am), py * Math.cos(am), Math.sin(am)];
        for (let q = 0; q <= segs; q++) {
          const t = q / segs, r = radius(t), cx = A[0] + dx * t, cy = A[1] + dy * t, base = pos.length / 3;
          for (const [a, side] of [[a0, -1], [a1, 1]]) {
            pos.push(cx + px * r * Math.cos(a), cy + py * r * Math.cos(a), A[2] + r * Math.sin(a));
            nor.push(n[0], n[1], n[2]); aw.push(side * 0.5 * r / size, r / size, t, phase);
          }
          if (q < segs) ix.push(base, base + 1, base + 3, base, base + 3, base + 2);
        }
      }
    },
    mesh(material) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aN', new THREE.Float32BufferAttribute(nor, 3));
      g.setAttribute('aW', new THREE.Float32BufferAttribute(aw, 4)); g.setIndex(ix);
      const m = new THREE.Mesh(g, material); m.frustumCulled = false; return m;
    },
  };
}
// the bars of one crystal figure (its spines and its greater ribs), into a batch
export function addIce(ice, fig, size = 1) {
  const at = (i) => [fig.sites[i].x, fig.sites[i].y, fig.sites[i].z], golden = 0.6180339887;
  // the last site of a row of sites that stands for good
  const lastStanding = (row) => { let n = 0; while (n + 1 < row.length && !(fig.sites[row[n + 1]].clock[0] > 0)) n++; return n; };
  fig.spines.forEach((spine, d) => { const n = lastStanding(spine); if (n > 1) ice.bar(at(spine[1]), at(spine[n]), ICE_SPINE * size, size < 1 ? 4 : ICE_SEGS, frac(d * golden + (size < 1 ? fig.sites[0].x * 0.37 : 0)), size); });
  // THE SECOND ORDER (round r10): on the great crystal a slender needle of ice lies along every branchlet that stands
  // for good (a thread of the figure's third rank: the side twigs of the branches and of the spines), ICE_TWIG metres
  // across at its root
  if (size === 1) fig.threads.forEach(([i, o, rank], n) => { if (rank === 2 && !(fig.sites[i].clock[0] > 0) && !(fig.sites[o].clock[0] > 0)) ice.bar(at(o), at(i), ICE_TWIG, 2, frac(0.25 + n * golden)); });
  if (!fig.ribs.length) return;
  const reach = fig.ribs.map(lastStanding), lo = Math.min(...reach), hi = Math.max(...reach);
  fig.ribs.forEach((rib, r) => { const n = reach[r]; if (n > 0) ice.bar(at(rib[0]), at(rib[n]), lerp(ICE_RIB[0], ICE_RIB[1], hi > lo ? (n - lo) / (hi - lo) : 1) * size, 3, frac(0.5 + r * golden), size); });
}
// THE CRYSTAL'S BODY (round r9): ITS ICE GROWS FROM BARS TO BODY, of faceted ice by the ice's law of the face. A six-sided
// HEART PLATE at its centre (BODY_HEART metres from corner to corner, its corners on the six arms); along every spine
// A BROAD FLAT BLADE in the sheet, BODY_BLADE[0] metres broad at the heart and BODY_BLADE[1] at the spine's last
// standing site, a low ridge along its middle toward either face of the sheet (the bar of round r8 is that ridge); A
// SMALL SIX-SIDED PLATE at the end of each spine's standing part (BODY_END[0] metres across) and of each greater rib (a
// branch of BODY_RIB sites and more that stand for good; BODY_END[1] to BODY_END[2] metres across by its reach). All
// of it stands on frost that stands for good and lies within the figure's own bounds.
export const BODY_HEART = 12, BODY_BLADE = [4.4, 0.7], BODY_RIDGE = 0.3, BODY_END = [6.4, 2.4, 3.6], BODY_RIB = 4, BODY_LIGHT = 0.7, BODY_LINE = 1.5;
export function addBody(batch, fig) {
  const golden = 0.6180339887, cz = SNOW_AT[2];
  const normal = (a, b, c) => { const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2]; const n = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx], l = Math.hypot(n[0], n[1], n[2]) || 1; return n.map((v) => v / l); };
  const lastStanding = (row) => { let n = 0; while (n + 1 < row.length && !(fig.sites[row[n + 1]].clock[0] > 0)) n++; return n; };
  for (const side of [1, -1]) {
    // a face from its corners (x, y in the sheet, the height from the sheet mirrored for the other skin), its normal turned outward
    const face = (pts, share, phase, tint) => { const q = pts.map((v) => [v[0], v[1], cz + v[2] * side]); let n = normal(q[0], q[1], q[2]); if (n[2] * side < 0) n = n.map((v) => -v); batch.face(q, n, share, [], phase, BODY_LIGHT, BODY_LINE, tint); };
    const hexPlate = (cx, cy, a, turn, hTop, hRim, share, phase, tint, rim = tint) => {
      const c = (r, i, h) => [cx + r * Math.cos(turn + i * Math.PI / 3), cy + r * Math.sin(turn + i * Math.PI / 3), h];
      face([0, 1, 2, 3, 4, 5].map((i) => c(0.5 * a, i, hTop)), [0, 0, 0, 0, 0, 0].map(() => share), phase, tint);
      for (let i = 0; i < 6; i++) face([c(0.5 * a, i, hTop), c(a, i, hRim), c(a, i + 1, hRim), c(0.5 * a, i + 1, hTop)], [share, share, share, share], phase, i & 1 ? rim : tint);
    };
    hexPlate(SNOW_AT[0], SNOW_AT[1], BODY_HEART / 2, 0, 0.08 * BODY_HEART, 0.012 * BODY_HEART, 0, 0, ICE_VIOLET, ICE_BLUE);
    fig.spines.forEach((spine, d) => {
      const n = lastStanding(spine); if (n < 2) return;
      const A = fig.sites[spine[1]], B = fig.sites[spine[n]], len = Math.hypot(B.x - A.x, B.y - A.y), ux = (B.x - A.x) / len, uy = (B.y - A.y) / len, phase = frac(d * golden);
      const w0 = BODY_BLADE[0] / 2, w1 = BODY_BLADE[1] / 2;
      for (const hand of [1, -1]) face([[A.x, A.y, BODY_RIDGE * w0], [A.x - uy * w0 * hand, A.y + ux * w0 * hand, 0], [B.x - uy * w1 * hand, B.y + ux * w1 * hand, 0], [B.x, B.y, BODY_RIDGE * w1]], [0, 0, 1, 1], phase, hand > 0 ? ICE_TEAL : ICE_VIOLET);
      hexPlate(B.x, B.y, BODY_END[0] / 2, d * Math.PI / 3, 0.08 * BODY_END[0], 0.012 * BODY_END[0], 1, phase, ICE_PALE, ICE_TEAL);
    });
    const reach = fig.ribs.map(lastStanding), hi = Math.max(BODY_RIB, ...reach);
    fig.ribs.forEach((rib, r) => {
      const n = reach[r]; if (n < BODY_RIB - 1) return;
      const Q = fig.sites[rib[n]], across = lerp(BODY_END[1], BODY_END[2], hi > BODY_RIB - 1 ? (n - BODY_RIB + 1) / (hi - BODY_RIB + 1) : 1);
      hexPlate(Q.x, Q.y, across / 2, Math.atan2(Q.grow[1], Q.grow[0]), 0.08 * across, 0.012 * across, 1, frac(0.5 + r * golden), r & 1 ? ICE_BLUE : ICE_PALE, ICE_VIOLET);
    });
  }
}
// ---------------------------------------------------------------- THE FROST GLOW BEHIND THE CRYSTAL (round r9)
// The frost air about the crystal is also A SOFT VIOLET AND TEAL GLOW: GLOW_N broad soft clouds of cold light (each
// GLOW_SIZE[0] to GLOW_SIZE[1] metres in radius, violet or teal by its own dealt share, a round fall to nothing at its
// rim and no grain) that stand in the crystal's own sheet and up to GLOW_DEEP metres beyond it. THE WHOLE CLOUD TURNS AS
// ONE BODY about the crystal's axis on the world clock (GLOW_TURN radians a second, from the dealt places), and each
// cloud breathes on a slow rate of its own from a dealt first phase. ITS LEVEL IS A LAW: where the clouds lie deepest
// over one another, their light summed is GLOW_SHARE of a gold lamp's (found once from the dealt places; the cloud is
// rigid, so it holds at every clock). No cloud's ring comes within its own radius and GLOW_LINE metres of the flown
// line or of the last rank's tube. The seed deals where each stands, its size, its colour's share and its breath (a
// stream of its own).
export const GLOW_N = 20, GLOW_SIZE = [30, 56], GLOW_DEEP = 22, GLOW_REACH = 64, GLOW_TURN = 0.012, GLOW_SHARE = 0.1, GLOW_LINE = 4;
export const GLOW_VIOLET = lin('#7A5CE0', 1), GLOW_TEAL = lin('#2FB5B0', 0.55);
const GLOW_VERT = /* glsl */`
attribute vec4 aAir;   // its distance from the crystal's axis; its angle about it at clock nought; its depth beyond the sheet; its radius
attribute vec3 aTurn;  // its colour's share (violet to teal); its breath's rate; its breath's first phase
varying vec2 vP; varying vec3 vC;
${GLSL_LAWS}
uniform vec3 uGlowViolet, uGlowTeal; uniform float uGlowLevel;
const vec3 AIR_C = vec3(${SNOW_AT[0].toFixed(2)}, ${SNOW_AT[1].toFixed(3)}, ${SNOW_AT[2].toFixed(1)});
void main(){
  float a = aAir.y + ${GLOW_TURN.toFixed(4)} * uTime;
  vec3 p = AIR_C + vec3(aAir.x * cos(a), aAir.x * sin(a), aAir.z);
  vec3 toP = p - cameraPosition; float d = length(toP);
  vC = mix(uGlowViolet, uGlowTeal, smoothstep(.35, .65, aTurn.x)) * (uGlowLevel * (.8 + .2 * sin(uTime * aTurn.y + aTurn.z)) * hazeCold(d, hollowLen(cameraPosition, toP / max(d, 1e-3), d)));
  vec4 mv = modelViewMatrix * vec4(p, 1.);
  mv.xy += position.xy * aAir.w;
  gl_Position = projectionMatrix * mv; vP = position.xy;
}`;
const GLOW_FRAG = /* glsl */`
varying vec2 vP; varying vec3 vC;
void main(){
  float r2 = dot(vP, vP), g = max(1. - r2, 0.);
  gl_FragColor = vec4(vC * (exp(-2.6 * r2) * g * g), 1.);
}`;
const lumOf = (c) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
export async function buildFrostGlow(ctx, rng, shared) {
  await primeRouteLine(ctx);
  const air = [], turn = [], RING = 24, dealt = [];
  // every cloud takes the same draws whether it stands or not, so the stream has one length on every seed
  for (let n = 0; n < GLOW_N * 4; n++) dealt.push([GLOW_REACH * Math.pow(rng(), 0.7), rng() * Math.PI * 2, GLOW_DEEP * rng(), lerp(GLOW_SIZE[0], GLOW_SIZE[1], rng()), rng(), rng.range(0.05, 0.12), rng() * Math.PI * 2]);
  for (const [r, a0, dz, size, tint, rate, ph] of dealt) {
    if (air.length >= GLOW_N * 4) break;
    const keep = GLOW_LINE + size + (r + size) * (1 - Math.cos(Math.PI / RING)); let ok = true;
    for (let q = 0; q < RING && ok; q++) {
      const a = (q / RING) * Math.PI * 2, x = SNOW_AT[0] + r * Math.cos(a), y = SNOW_AT[1] + r * Math.sin(a), z = SNOW_AT[2] + dz;
      ok = pointClear(x, y, z, keep + 4) >= keep && gateDist(x, y, z) >= AIR_TUBE + keep;
    }
    if (ok) { air.push(r, a0, dz, size); turn.push(tint, rate, ph); }
    await ctx.yield();
  }
  // the level: the clouds' light summed where they lie deepest over one another (looked for at every cloud's middle, across the sheet)
  const N = air.length / 4, mix3 = (t) => { const k = smoothstep(0.35, 0.65, t); return lumOf([0, 1, 2].map((i) => lerp(GLOW_VIOLET[i], GLOW_TEAL[i], k))); };
  let deepest = 1e-6;
  for (let j = 0; j < N; j++) {
    let sum = 0;
    for (let i = 0; i < N; i++) {
      const dx = air[i * 4] * Math.cos(air[i * 4 + 1]) - air[j * 4] * Math.cos(air[j * 4 + 1]), dy = air[i * 4] * Math.sin(air[i * 4 + 1]) - air[j * 4] * Math.sin(air[j * 4 + 1]);
      const r2 = (dx * dx + dy * dy) / (air[i * 4 + 3] * air[i * 4 + 3]); if (r2 < 1) sum += mix3(turn[i * 3]) * Math.exp(-2.6 * r2) * (1 - r2) * (1 - r2);
    }
    deepest = Math.max(deepest, sum);
  }
  const level = GLOW_SHARE * lumOf(GOLD) / deepest;
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
  g.setAttribute('aAir', new THREE.InstancedBufferAttribute(new Float32Array(air), 4)); g.setAttribute('aTurn', new THREE.InstancedBufferAttribute(new Float32Array(turn), 3));
  g.instanceCount = N;
  const v3 = (c) => ({ value: new THREE.Vector3(c[0], c[1], c[2]) });
  const material = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, depthTest: true, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { ...shared, uGlowViolet: v3(GLOW_VIOLET), uGlowTeal: v3(GLOW_TEAL), uGlowLevel: { value: level } }, vertexShader: GLOW_VERT, fragmentShader: GLOW_FRAG });
  const mesh = new THREE.Mesh(g, material); mesh.frustumCulled = false; mesh.name = 'frost glow';
  return { mesh, count: N, level };
}
// opts: { shared, materials, rng (the visit's fork for the crystal's one period and first phase; seen alone the part
//   makes the same fork from ctx.seed) }. Place, arms, branches and branchlets are the same on every seed.
export const snowFork = (seed) => makeRng(hashSeed('where-the-lattice-grows:snow:' + seed));
// ---------------------------------------------------------------- FROST AIR ABOUT THE CRYSTAL (round r8)
// A standing cloud of fine frost dust in the hollow about the snow crystal: small soft cold motes, dim and blue white,
// densest in the crystal's own sheet and thinning to nothing by AIR_M metres from its centre. EVERY MOTE IS A LAW OF ITS
// OWN PLACE AND THE WORLD CLOCK: it circles the crystal's axis (the line through its centre square to its sheet) slowly
// and all in one sense, keeps its own distance from that axis and its own depth before or behind the sheet (it bobs
// AIR_BOB metres about that depth), and twinkles on its own rate. Its light falls from whole within AIR_FULL metres of
// the centre to nothing at AIR_M, so the cloud has no bound that could be seen. None is broader than 2 * AIR_SIZE[1]
// metres; the whole ring a mote circles on is tested when it is dealt: no part of it comes within AIR_LINE metres of
// the flown line or within the tube of the last rank (AIR_TUBE metres about the gate's axis), at any clock.
// The seed deals where each stands and how it turns and twinkles (a stream of its own).
export const AIR_M = 60, AIR_FULL = 22, AIR_N = 380, AIR_LINE = 6, AIR_TUBE = 6.9, AIR_BOB = 1.5;
export const AIR_TURN = [0.006, 0.02], AIR_SIZE = [0.3, 1.5], AIR_LIGHT = lin('#C4DCFF', 1.2);
const AIR_VERT = /* glsl */`
attribute vec4 aAir;   // its distance from the crystal's axis; its angle about it at clock nought; its depth from the sheet; half its breadth
attribute vec3 aTurn;  // its turning in radians a second; its twinkle's rate; its phase
varying vec2 vP; varying float vK;
${GLSL_LAWS}
const vec3 AIR_C = vec3(${SNOW_AT[0].toFixed(2)}, ${SNOW_AT[1].toFixed(3)}, ${SNOW_AT[2].toFixed(1)});
void main(){
  float a = aAir.y + aTurn.x * uTime;
  vec3 off = vec3(aAir.x * cos(a), aAir.x * sin(a), aAir.z + ${AIR_BOB.toFixed(1)} * sin(uTime * .19 + aTurn.z)), p = AIR_C + off;
  float fade = (1. - smoothstep(${AIR_FULL.toFixed(1)}, ${AIR_M.toFixed(1)}, length(off))) * (.55 + .45 * sin(uTime * aTurn.y + aTurn.z * 7.));
  vec3 toP = p - cameraPosition; float d = length(toP);
  vK = fade * hazeCold(d, hollowLen(cameraPosition, toP / max(d, 1e-3), d));
  vec4 mv = modelViewMatrix * vec4(p, 1.);
  mv.xy += position.xy * aAir.w;
  gl_Position = projectionMatrix * mv; vP = position.xy;
}`;
const AIR_FRAG = /* glsl */`
uniform vec3 uAir; varying vec2 vP; varying float vK;
void main(){
  // a small bright grain in a soft round skirt that is nothing at the mote's rim
  float r2 = dot(vP, vP), g = max(1. - r2, 0.);
  gl_FragColor = vec4(uAir * (vK * (exp(-5. * r2) + .35 * g * g)), 1.);
}`;
export async function buildFrostAir(ctx, rng, shared, count = AIR_N) {
  await primeRouteLine(ctx);
  const air = [], turn = [], RING = 24, sag = AIR_M * (1 - Math.cos(Math.PI / RING));
  for (let tries = 0; tries < count * 4 && air.length < count * 4; tries++) {
    // dealt: denser toward the axis, and far denser near the sheet than away from it (the cube of a share of the depth the bound allows)
    const r = AIR_M * Math.pow(rng(), 0.75), a0 = rng() * Math.PI * 2, side = rng() < 0.5 ? -1 : 1, deep = rng();
    const dz = side * Math.sqrt(Math.max(AIR_M * AIR_M - r * r, 0)) * deep * deep * deep, size = lerp(AIR_SIZE[0], AIR_SIZE[1], Math.pow(rng(), 2));
    const w = rng.range(AIR_TURN[0], AIR_TURN[1]), tw = rng.range(1.2, 3.2), ph = rng() * Math.PI * 2;
    // the whole ring it circles on, with its bob and its own breadth
    const keep = AIR_BOB + size + sag; let ok = true;
    for (let q = 0; q < RING && ok; q++) {
      const a = (q / RING) * Math.PI * 2, x = SNOW_AT[0] + r * Math.cos(a), y = SNOW_AT[1] + r * Math.sin(a), z = SNOW_AT[2] + dz;
      ok = pointClear(x, y, z, AIR_LINE + keep + 4) >= AIR_LINE + keep && gateDist(x, y, z) >= AIR_TUBE + keep;
    }
    if (ok) { air.push(r, a0, dz, size); turn.push(w, tw, ph); }
    if (tries % 30 === 29) await ctx.yield();
  }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
  g.setAttribute('aAir', new THREE.InstancedBufferAttribute(new Float32Array(air), 4)); g.setAttribute('aTurn', new THREE.InstancedBufferAttribute(new Float32Array(turn), 3));
  g.instanceCount = air.length / 4;
  const material = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, depthTest: true, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { ...shared, uAir: { value: new THREE.Vector3(AIR_LIGHT[0], AIR_LIGHT[1], AIR_LIGHT[2]) } }, vertexShader: AIR_VERT, fragmentShader: AIR_FRAG });
  const mesh = new THREE.Mesh(g, material); mesh.frustumCulled = false; mesh.name = 'frost air';
  return { mesh, count: air.length / 4, motes: air };
}

export async function buildHero(ctx, opts = {}) {
  const shared = opts.shared ?? makeShared(opts.cold), mats = opts.materials ?? makeMaterials(shared);
  const lamps = lampBatch(true), threads = threadBatch(true);
  await primeRouteLine(ctx);
  const figure = snowFigure(opts.rng ?? snowFork(ctx.seed));
  await ctx.yield();
  addSnow(lamps, threads, figure); addSnow(lamps, threads, armRunOn(figure), true);
  await ctx.yield();
  const ice = iceBatch(); addIce(ice, figure);
  const body = facetBatch(); addBody(body, figure);
  await ctx.yield();
  const object = new THREE.Group();
  object.add(lamps.mesh(mats.lampGrowth), threads.mesh(mats.threadGrowth), ice.mesh(mats.iceBody), body.mesh(mats.facetBody));
  const ys = figure.sites.map((q) => q.y), xs = figure.sites.map((q) => q.x), y0 = Math.min(...ys), y1 = Math.max(...ys), x0 = Math.min(...xs), x1 = Math.max(...xs);
  return {
    object, radius: (x1 - x0) / 2, height: y1 - y0, center: new THREE.Vector3(SNOW_AT[0], SNOW_AT[1], SNOW_AT[2]), ground: false,
    anchors: { centre: new THREE.Vector3(SNOW_AT[0], SNOW_AT[1], SNOW_AT[2]), tip: new THREE.Vector3(x0, SNOW_AT[1], SNOW_AT[2]) },
    figure, sites: figure.sites, counts: { lamps: lamps.count, threads: threads.count, iceTriangles: ice.triangles, bodyTriangles: body.triangles },
    update(dt, time) { shared.uTime.value = time; },
  };
}
