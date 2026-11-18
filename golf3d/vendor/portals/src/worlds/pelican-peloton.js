// pelican-peloton: THE WORLD. A road race of pelicans on bicycles on a seaside road, every one drawn as a program
// draws (flat colour, one even dark line), overtaken from the hopeless at the back to the one right pelican at the
// front; the road leaves the land as a ribbon in the air and runs into the sun, which is the way out.
// Design: design/ab/pelican-peloton.design.json; build plan: design/ab/pelican-peloton.buildplan.md; every number two
// files need lives in src/parts/pelican-peloton-plan.js (places in metres of the world or of the road's own measure:
// station s along the centre line, side n to port, height h over the road; d is the metres flown).
//
// DECLARED (the design's list, in plain words):
// 1. DECLARED PACING ONE. The race travels the route with the visitor and is overtaken: every rider's station on the
//    road is offset + F(metres flown) + surge, F ONE typed function for all riders (0.6 of the metres flown, the share
//    rising to 0.76 between d 540 and d 600: the sprint, which keeps the leader ahead of the lens up the last
//    straight until d 951). Nothing in the law reads a clock, the lens, the gaze or the seed, and no rider has a
//    share of its own.
// 2. DECLARED PACING TWO. The nine pelicans of the harbour each fly a course that is a typed function of the metres
//    flown and of nothing else (a ring, a glide to a tip point ahead of the lens's own place, a stoop to a strike
//    point 35 m ahead of it).
// 3. PLACED TO BE SEEN FROM THE WAY (typed, for the whole flight, every seed). The lens flies the road's open lane
//    (n -3.4, 3.0 m up) and never crosses the road, so the race is seen from its right side against the sea; three
//    sliders ride broadside; the harbour wall brings the race back across the flight's way; the leader rides lane 2;
//    six boats and the roost stack stand 13 to 15 m from the line; the standing bank of cloud lies under the road in
//    the air; the watchers stand on the bed's lobes beside the road in the air, strings of pennants run along the
//    road's edges from the last straight on (none of either in the last 120 m), three boats ride in the bay.
//    By each rider's own lane (a place, the same on every seed): its bib hangs turned 32 degrees toward the open
//    lane, the grey hoverer rests turned toward it, and seven glances in ten go toward it.
// 4. KEYED TO METRES FLOWN: the drifter's rise, the nine, the race's sprint, the leader's turn of the head.
// 5. ON THE WORLD'S TIME (ambient): the small time term of wheels and legs, pouches, neckerchiefs, hats, fish tails,
//    waves, drifting clouds, the standing bank's swell, the lighthouse's beam, gliders, ambient divers and their
//    splashes, sitters, trees, flowers, boats, the watchers' hop and wings, the pennants' wave, the riders'
//    glances aside and back (each by its own number; the leader does not glance).
// 6. THE WAY OUT, THE ONE EXCEPTION (by the owner's leave, for this world only): the engine's opening is first drawn
//    with 204 m of route left in the middle of the picture, INSIDE THE DOME SUN'S OWN DISC, in the sun's own flat
//    colour and smaller than that disc until it is whole, so that it is born unseen, where the rule asks that an
//    opening drawn late first stands out of the picture or behind a mass.
//    (drawWithin 204, drawIn 8, revealDistance 70; the count proves the disc inside the sun's by place; no rim, ring
//    or double of the opening is built; nothing of the world at the way out comes on by the metres left.)
// 7. LOOKS WITH steady: true: all five, because the subject rides beside the route. Each opens and closes by places
//    over LOOK_RAMP metres (an explicit fade). THE LAST LOOK FOLLOWS THE LEADER (one pull of 0.7 toward a place just
//    astern of its middle, by the pack law's own mirror from the metres flown) from d 790 until the engine itself
//    lets every look go near the flight's end (its own guard); from there the gaze is the route's own heading.
// 8. STANDING BODIES OF THE PLACE: the road and its ribbon, the harbour wall with its dress (a low parapet, buttresses,
//    a quay ledge with bollards, two flights of steps, courses of stone inked on its harbour face, a sea pelican
//    sitting on each of its last two buttresses; nothing over 0.55 m above the deck), the land body with its cut
//    edges (the cove's cliff with the rock's beds inked along it) and the rounded headland, three ranks of hills with
//    their houses, the cove's row of houses and its grove, the far headlands, the trees in clumps with bushes, the
//    lighthouse and the keeper's house, the roost stack, the eight boats and the bay's three, the standing bank of
//    cloud (each circle that reaches the sea with its own level waterline) with THE BED the road in the air rests on
//    (circles under and beside the ribbon from the land's end to its far end, piers down to the fog, a heap under
//    the far end; from 204 m left every one that would stand in the sun's disc lies under the ribbon: the sea count's
//    B2), the watchers and the pennants on their poles (the sea plan's typed places), the sun.
// 9. WHAT READS THE EYE, and only as these do: the dome's and the sea fan's place (they stand at the lens); the one
//    line's width and every drawn edge, by the pixel's own footprint (a filter; with it a hull, a spoke, a tyre and a
//    detail stroke draw in to nothing when they are smaller than the line could carry); discs that turn about their
//    own place to face the eye (clouds, crowns with their lit crescent, flowers; a splash's tongues and tears turn
//    about their own axis to it); the sun's road on the water,
//    which answers the eye's bearing to the sun as light does; the far band of paler water, by the air between eye and
//    water; the bank's shaded row and its ink line, held back by the distance to the eye (optics of the drawing, as the line's width is);
//    the bank's waterline, whose line is widened along the eye's bearing so that it is even on the picture (the same optics).
//    Nothing is placed, sized, hidden or timed by the lens, the gaze, a clock of the wall or a seed.
//
// THIS FILE: the road strip, the land body and its cut edges, the standing things (hills, far headlands, stack,
// lighthouse, houses, the wall's dress), trees, flowers, grass, the standing shadows, the beam; the route, the looks,
// the pace, the way out, update. The race is the riders' part (buildPack); sky, sea, clouds, birds and boats are the
// sea part's makers; every maker is called by a plain named import and adds what it hands back. The land's own
// dealers live here, not in the plan file: dealLand (the one order of the streams 'hills', 'trees', 'flowers'),
// dealFarHeads, landTrees, coveHouses, coveTrees, noseBushes, dealDress, shadowRows; tools/ab/pp-count.mjs section (I)
// runs these same functions and builders and measures every body against the lens's place.
// AGAINST THE DESIGN'S LETTER (each is a line in design/ab/pelican-peloton.plan-changes.md): the beam's tapers reach
// 18 m, not 160 m, each one whole short wedge (a long wedge crosses the sun's disc as seen from the harbour; a 44 m one stayed 11.6
// degrees and more from the sun's middle, outside the halo, and this shorter one lies inside that sweep); the wall wears a parapet under 0.6 m; the nine of the
// harbour rise over the plan's course as they leave their ring and slant down to it (so no two of them meet); the
// gliders fly seven typed lines of the sea plan, and the ambient divers whose cycle would pass within 9.5 m of a line
// are left out (their dice are still thrown); one of the seven is an escort file beside the road in the air on the
// last straight (it stays outside the sun's disc and outside the cone to the opening as seen from that straight); the
// loose wheel of the wheel-ahead kind rolls to starboard of its rider, where the lens sees it; the design's hopeless
// number 4 is no kind and does not ride, by the second reader's ruling. The land's ambient motion is the trees' and bushes' nod,
// the flowers' sway, the surf band's slide and the beam, all on the world's time.
import * as THREE from 'three';
import { makePath, clamp, lerp } from '../kit/core.js';
import { PP, LAND, SHORE, HEAD, FLIGHT, SLOTS, NINE, BOATS, RARE, TREES, STACK, STACK_R, STACK_H, layRoad, shoreArc, headland, landEnd, placeKind, dealHills, dealTrees, crownR, routePoints, meetMiss, paceOf, dealPack, packCheck, riderPlace, nineCourse, chordPoint, lineDist,
  cloudSteps, seaBirdSteps, rareSteps } from '../parts/pelican-peloton-plan.js';
import { makeLook, flatMaterial, finish, stroke, lineOf, loft, ball, cone, plate, setPart, setInstances, makeDiscs } from '../parts/pelican-peloton.js';
import { buildPack } from '../parts/pelican-peloton-riders.js';
import { makeSky, makeSea, makeClouds, bankSteps, seaPelicanGeometry, makeGliders, makeDivers, makeNine, makeSplashes, makeSitters, makeBoats, makeWatchers, makePennants } from '../parts/pelican-peloton-sea.js';
import { bayBoats } from '../parts/pelican-peloton-plan-sea.js';

// ---------------------------------------------------------------------------------------------
// THE ROAD STRIP: one cross profile swept along the plan's road (the same table the pack's knots are read from).
// Sections stand every 3 m, and every 1.5 m on bends tighter than 100 m, so that a dash of 6 m is two (or four) whole
// spans and the road's paint is the road's own skin (nothing lies in the road's plane over it). The road is flat
// across: its skin at station s is at road.y(s) from edge to edge.
// ---------------------------------------------------------------------------------------------
const lanes = [PP.STAR_N, PP.LENS_N, ...PP.LANES];                 // the six lanes' middles, starboard first
const STRIP = {
  STEP: 3, STEP_TIGHT: 1.5, TIGHT_R: 100,
  EDGE_W: 0.3, DASH: 6, DASH_W: 0.5, THIN_W: 0.25, MAIN: 1,        // the white edge lines; dashes 6 m on and 6 m off; the wide one is between our lane and lane 1
  MARKS: lanes.slice(1).map((n, i) => (n + lanes[i]) / 2),          // a dashed line between every two lanes: n -5.6, -1.2, +2.6, +5.8, +9.0
  VERGE_N: -12, CLIFF_TOP: PP.CLIFF_N, CLIFF_FOOT: PP.CLIFF_N + 2,  // sand verges; the cliff's edge and the foot of its face
  BEACH_Y: 1.5, POINT_Y: 1.0, WALL_SURF: 0.8, SURF: [0.3, -0.1], SURF_W: 1.5, UNDER: -1.5,   // heights over the sea; the surf band crosses the water's level
  RIB_T: 0.4,                                                       // the road in the air: a ribbon 0.4 m thick
  // THE INK LINE on the strip's edges: strokes of the kit (their own skin held to the line's points; DETAIL strokes, so a
  // far edge is a clean flat shape and its line draws in to nothing instead of standing as a fat dark bar). Its true
  // width is the scenery's share of the ribbon's own width
  LINE_R: lineOf(PP.RIB_N1 - PP.RIB_N0) / 2, LINE_DETAIL: PP.INK_FULL, WATERLINE: 0.25,
  LAND_EDGE_N: -12, POINT_STAR_N: -12,                             // the strip ends at its starboard verge: THE LAND BODY (buildLand) starts on that edge's own vertices
};
const _a = {}, _b = {};
// the stations of the sections: the grid, the half steps on tight bends, and every station where the profile's kind turns
export function stripStations(road) {
  const W = STRIP, set = new Set([PP.S_BACK, LAND.ROOT[0], SHORE.S0, LAND.ROOT[1], SHORE.S1, LAND.LANDING[1], PP.S_BRINK, PP.TAPER_S0, PP.TAPER_S1, PP.S_END]);
  for (let s = Math.ceil(PP.S_BACK / W.STEP) * W.STEP; s <= PP.S_END; s += W.STEP) {
    set.add(s);
    const m = s + W.STEP / 2, bend = Math.abs(road.at(m + 2, _a).psi - road.at(m - 2, _b).psi) / 4;
    if (bend > 1 / W.TIGHT_R && s + W.STEP_TIGHT < PP.S_END) set.add(s + W.STEP_TIGHT);
  }
  return [...set].sort((x, y) => x - y);
}
// what stands to either hand of the road at station s, by the plan's own lines (LAND, SHORE): the cliff and its beach
// (to the wall's root), the wall (its faces straight to the water), the point (a low cliff); eased between as the plan eases them
function sides(road, s, yR, e0, e1) {
  const W = STRIP, tw = clamp((s - LAND.ROOT[0]) / (LAND.ROOT[1] - LAND.ROOT[0]), 0, 1), tp = clamp((s - LAND.LANDING[0]) / (LAND.LANDING[1] - LAND.LANDING[0]), 0, 1);
  // port: [top n, mid n, mid y, foot n, foot y, surf n0, surf y0, surf n1, under n] for cliff, wall and point
  const cliff = [W.CLIFF_TOP, W.CLIFF_TOP + 1, (yR + W.BEACH_Y) / 2, W.CLIFF_FOOT, W.BEACH_Y, LAND.BEACH_N - W.SURF_W, W.SURF[0], LAND.BEACH_N + 0.3, LAND.BEACH_N + 2];
  const wall = [e1, e1, yR / 2 + 0.4, e1, W.WALL_SURF, e1, W.WALL_SURF, e1, e1];
  const point = [W.CLIFF_TOP, W.CLIFF_TOP + 1, (yR + W.POINT_Y) / 2, W.CLIFF_FOOT, W.POINT_Y, LAND.POINT_N - 1, W.SURF[0], LAND.POINT_N + 0.3, LAND.POINT_N + 1.5];
  const port = cliff.map((v, i) => (tp > 0 ? lerp(wall[i], point[i], tp) : lerp(v, wall[i], tw)));
  // starboard: [verge n, land's edge n]: the cliff road's verge and the land body's first edge, the wall's own face, the point
  const ts = clamp((s - LAND.ROOT[0]) / (SHORE.S0 - LAND.ROOT[0]), 0, 1);
  const star = tp > 0 ? [lerp(e0, W.VERGE_N, tp), lerp(e0, W.POINT_STAR_N, tp)] : [lerp(W.VERGE_N, e0, ts), lerp(W.LAND_EDGE_N, e0, ts)];
  return { port, star };
}
// the cross profile at station s: points [n, y] from the starboard side over the road to the port side. On the ground
// (24 points): under the sea, the starboard face in two bands, land, verge, the road's 13 bands, verge, the port face in
// two bands, beach, surf, under the sea. In the air (17 points): a closed box, the ribbon's two sides and its underside.
function stripProfile(road, s, ribbon, P) {
  const W = STRIP, yR = road.y(s), [e0, e1] = road.edges(s), cl = (n) => clamp(n, e0 + W.EDGE_W, e1 - W.EDGE_W);
  let k = 0; const put = (n, y) => { P[k++] = n; P[k++] = y; };
  const roadPts = () => {
    put(e0, yR); put(e0 + W.EDGE_W, yR);
    W.MARKS.forEach((m, i) => { const h = (i === W.MAIN ? W.DASH_W : W.THIN_W) / 2; put(cl(m - h), yR); put(cl(m + h), yR); });
    put(e1 - W.EDGE_W, yR); put(e1, yR);
  };
  if (ribbon) { put(e0, yR - W.RIB_T); roadPts(); put(e1, yR - W.RIB_T); put(e0, yR - W.RIB_T); return k / 2; }
  const { port: p, star: q } = sides(road, s, yR, e0, e1);
  put(q[1], W.UNDER); put(q[1], yR / 2); put(q[1], yR); put(q[0], yR);
  roadPts();
  put(p[0], yR); put(p[1], p[2]); put(p[3], p[4]); put(p[5], p[6]); put(p[7], W.SURF[1]); put(p[8], W.UNDER);
  return k / 2;
}

// the colour name of band b (from point b to point b + 1) of a span whose middle station is sm
const ROAD_BANDS = ['dash', 'road', 0, 'road', 1, 'road', 2, 'road', 3, 'road', 4, 'road', 'dash'];   // a number: that dashed line
function bandColour(b, ribbon, sm) {
  const W = STRIP, r = b - (ribbon ? 1 : 4);
  if (r >= 0 && r < ROAD_BANDS.length) { const c = ROAD_BANDS[r]; return typeof c === 'string' ? c : ((sm % (2 * W.DASH)) + 2 * W.DASH) % (2 * W.DASH) < W.DASH ? 'dash' : 'road'; }
  if (ribbon) return b === 15 ? 'shadow' : 'road';
  const wallP = sm >= LAND.ROOT[1] && sm < LAND.LANDING[0], wallS = sm >= SHORE.S0 && sm < SHORE.S1;
  if (b < 4) return b === 0 ? (wallS ? 'wallShade' : 'cliffShade') : b === 1 ? (wallS ? 'wall' : 'cliff') : b === 2 ? 'land' : 'verge';   // starboard
  return ['verge', wallP ? 'wall' : 'cliff', wallP ? 'wallShade' : 'cliffShade', 'beach', 'surf', 'beach'][b - 17];                         // port
}
const STRIP_COLOURS = ['road', 'dash', 'verge', 'cliff', 'cliffShade', 'wall', 'wallShade', 'beach', 'surf', 'land', 'shadow', 'ink'];
// buildStrip(B, road, look, Y): the whole strip into the builder B (plain arrays in the look kit's layout: pos, nor, col,
// k, rig, idx), s -340 to 1002: cliff road, harbour wall, point, the brink's face, the ribbon with its taper.
// B.strip = { S, spans: [{ sa, sb, i0, i1 }] } names, for the counts, the index range of the ROAD'S OWN SKIN in each span.
export async function buildStrip(B, road, look, Y) {
  const W = STRIP, S = stripStations(road), col = {}; for (const n of STRIP_COLOURS) col[n] = look.col(n);
  const secs = []; for (const s of S) { if (s <= PP.S_BRINK) secs.push([s, 0]); if (s >= PP.S_BRINK) secs.push([s, 1]); }
  const pa = [], pb = [], qa = [], qb = [], spans = [];
  const world = (s, P, n, Q) => { road.at(s, _a); const c = Math.cos(_a.psi), sn = Math.sin(_a.psi); for (let i = 0; i < n; i++) { Q[i * 3] = _a.x + c * P[i * 2]; Q[i * 3 + 1] = P[i * 2 + 1]; Q[i * 3 + 2] = _a.z - sn * P[i * 2]; } };
  const vert = (x, y, z, c) => { B.pos.push(x, y, z); B.nor.push(0, 1, 0); B.col.push(c[0], c[1], c[2]); B.k.push(0, 0, 0, 1); B.rig.push(0, 0, 0, 0); return B.pos.length / 3 - 1; };
  // a quad a0 b0 (one section) a1 b1 (the next): its face looks up and outward for a profile laid starboard to port
  const quad = (Q0, Q1, i, j, c) => {
    const v = vert(Q0[i * 3], Q0[i * 3 + 1], Q0[i * 3 + 2], c); vert(Q1[i * 3], Q1[i * 3 + 1], Q1[i * 3 + 2], c);
    vert(Q0[j * 3], Q0[j * 3 + 1], Q0[j * 3 + 2], c); vert(Q1[j * 3], Q1[j * 3 + 1], Q1[j * 3 + 2], c);
    B.idx.push(v, v + 1, v + 2, v + 2, v + 1, v + 3);
  };
  let na = stripProfile(road, secs[0][0], secs[0][1], pa); world(secs[0][0], pa, na, qa);
  for (let i = 0; i + 1 < secs.length; i++) {
    const [sa, ra] = secs[i], [sb, rb] = secs[i + 1], nb = stripProfile(road, sb, rb, pb); world(sb, pb, nb, qb);
    if (ra !== rb) {                                               // THE BRINK: no face; the ground runs on beyond it as the headland (buildLand)
    } else {
      const sm = (sa + sb) / 2, r0 = ra ? 1 : 4, span = { sa, sb, i0: 0, i1: 0 };
      for (let b = 0; b + 1 < na; b++) {
        if (b === r0) span.i0 = B.idx.length;
        if (b === r0 + ROAD_BANDS.length) span.i1 = B.idx.length;
        const flat = Math.abs(pa[b * 2] - pa[b * 2 + 2]) + Math.abs(pa[b * 2 + 1] - pa[b * 2 + 3]) + Math.abs(pb[b * 2] - pb[b * 2 + 2]) + Math.abs(pb[b * 2 + 1] - pb[b * 2 + 3]);
        if (flat < 1e-6) continue;                                 // a band of no width here (a mark beyond the ribbon's edge, a verge on the wall)
        quad(qa, qb, b, b + 1, col[bandColour(b, ra, sm)]);
      }
      spans.push(span);
    }
    for (let j = 0; j < nb * 2; j++) pa[j] = pb[j];
    for (let j = 0; j < nb * 3; j++) qa[j] = qb[j];
    na = nb;
    if (i % 20 === 19) await Y();
  }
  B.strip = { S, spans };
  await Y();
  // THE INK LINES, laid after every span (so the spans' index ranges stand): one along the port top edge (the cliff's
  // edge, the wall's, the point's) and one along its foot (the beach, the wall's waterline) from the back to the brink;
  // one along the wall's starboard top edge and one at its waterline; one along each edge of the road in the air
  // (each line gathers its points in stretches of 96 with a hand-back between, then is laid whole in one stroke)
  const line = async (s0, s1, nOf, yOf) => {
    const pts = [];
    for (const s of S) {
      if (s < s0 || s > s1) continue;
      const yR = road.y(s), e = road.edges(s), n = nOf(s, yR, e); road.at(s, _a); pts.push(new THREE.Vector3(_a.x + Math.cos(_a.psi) * n, yOf(s, yR, e), _a.z - Math.sin(_a.psi) * n));
      if (pts.length % 96 === 0) await Y();
    }
    await Y();
    if (pts.length > 1) stroke(B, pts, W.LINE_R, { col: col.ink, detail: W.LINE_DETAIL });
    await Y();
  };
  const port = (s, yR, e) => sides(road, s, yR, e[0], e[1]).port;
  await line(PP.S_BACK, PP.S_BRINK, (s, yR, e) => port(s, yR, e)[0], (s, yR) => yR);
  await line(PP.S_BACK, PP.S_BRINK, (s, yR, e) => port(s, yR, e)[3], (s, yR, e) => port(s, yR, e)[4]);
  await line(SHORE.S0, SHORE.S1, (s, yR, e) => e[0], (s, yR) => yR);
  await line(SHORE.S0, SHORE.S1, (s, yR, e) => e[0], () => W.WATERLINE);
  await line(PP.S_BRINK, PP.S_END, (s, yR, e) => e[0], (s, yR) => yR);
  await line(PP.S_BRINK, PP.S_END, (s, yR, e) => e[1], (s, yR) => yR);
  return B;
}

// ---------------------------------------------------------------------------------------------
// THE LAND BODY. One sheet from the road's starboard verge landward, laid on RIBS: straight lines that leave the land's
// seaward edge and never cross one another, each at ONE height, so the sheet is the road's own height carried inland:
//   A  the cliff road (s -340 to the wall's root): a rib at every section of the strip, on the verge edge's own vertex,
//      along the road's own starboard normal (the road only bends left there, so the ribs spread);
//   B  behind the cove: ribs from the shore's cliff top, all PARALLEL to A's last rib, their height falling evenly from
//      the root's to the point's level (ROAD_Y1) across the cove;
//   C  the point (the landing to the brink): ribs from the verge edge again, parallel to B's until the road's own
//      normal has turned further, at the point's level.
// Every rib ends LAND.INSET m short of the land's end (the plan's headland line, and the line that runs on from the
// cape at its station) or LAND.FAR m out. Beyond the last rib the nose and the cape's crescent are one level polygon.
// THE CUT EDGES (the cove's shore, the headland) are faces of their own swept along the plan's lines: a sand rim that
// lies over the sheet's edge, a cliff face in two bands, a beach, a surf band; the plan's line is the beach's sea edge.
// ---------------------------------------------------------------------------------------------
const LANDS = {
  RIBS: [0, 10, 40, 130, 400, 1000, 2600], FAR_BAND: 4,            // a rib's nodes, metres out; from this band on the land is the pale far layer
  INSET: 6, COVE_N: 44,                                             // a rib's own end short of the land's line; the cove's ribs
  PATCH: [24, 0.34],                                                // FIELDS: the sheet's bands in runs of 24 m of coast, a share of them in the second green
  // a cut edge's profile, [metres inland of the plan's line, height]: yT the land's own top there, yB the beach
  RIM_IN: 8, TOP_IN: 4, MID_IN: 3, FOOT_IN: 2, SURF_IN: 1, SURF_OUT: -0.3, UNDER_OUT: -1.5, RIM_UP: 0.12, SKIRT: 0.5, SURF_SLIDE: 1.3,
  // THE GRASS BESIDE THE ROAD RUNS TO THE CLIFF'S OWN LINE (plan-changes pb 7): over the cove's pale rim, from the
  // verge's outer edge (CLEAR m outside it) for TO m along the shore's line, the land's green lies IN to OUT m inland, UP over the rim
  GRASS_RIM: { TO: 36, IN: 8.6, OUT: 4.06, UP: [0.1, 0.04], FAN: 6, CLEAR: 0.03, SKIRT: 1.2 },   // (UP: at its inland edge and at the cliff's line: the rim's skin is two triangles a span, and the strip must clear their fold)
  NOSE_DROP: [0.05, 0.5],                                           // the nose's top falls 5 cm a metre past the brink, half a metre at the most (it keeps out of the ribbon's skin)
  // THE BEDS OF THE ROCK on the cove's cliff (plan-changes 54): broken lines inked along the face. A bed: [its share of
  // the face's height from the top, how far it wanders, its wander's turns a span, its phase, its gaps' turns a span];
  // BED: samples a span of the shore, the sine under which a bed is not drawn, metres proud of the face, the stroke's radius
  BEDS: [[0.19, 0.045, 1.9, 0.4, 0.83], [0.4, 0.035, 1.3, 2.2, 1.17], [0.64, 0.05, 1.6, 4.1, 0.71], [0.85, 0.03, 2.3, 5.5, 1.01]], BED: [3, -0.25, 0.08, 0.05],
};
const _n2 = (x, z) => { const l = Math.max(Math.hypot(x, z), 1e-9); return [x / l, z / l]; };
// the land's own frame: the root of the cove, the ribs' common heading D (A's last, B's all), its square N (the way
// the coast runs on), the width Q of the cove across the ribs, the two levels
export function landFrame(road) {
  if (road._land) return road._land;
  const a = road.at(SHORE.S0), root = road.point(SHORE.S0, PP.ROAD_N0, 0), end = road.point(SHORE.S1, PP.ROAD_N0, 0);
  const D = [-Math.cos(a.psi), Math.sin(a.psi)], N = [Math.sin(a.psi), Math.cos(a.psi)];
  const F = { x: root[0], z: root[2], D, N, psi: a.psi, y0: road.y(SHORE.S0), y1: PP.ROAD_Y1 };
  F.q = (x, z) => (x - F.x) * N[0] + (z - F.z) * N[1];
  F.Q = F.q(end[0], end[2]);
  return (road._land = F);
}
// THE LAND'S HEIGHT at a place (the sheet's own law; trees, houses, flowers and shadows stand on it): short of the
// root's rib the road's height at the nearest station; across the cove the even fall; beyond it the point's level
export function landY(road, x, z) {
  const F = landFrame(road), q = F.q(x, z);
  if (q >= 0) return lerp(F.y0, F.y1, clamp(q / F.Q, 0, 1));
  return road.y(road.stationOf(x, z, PP.S_BACK, SHORE.S0).s);
}
// a line moved `d` metres to its left hand (d under 0: to its right), each point along the mean of its two runs' normals
function offsetLine(line, d) {
  const out = [];
  for (let i = 0; i < line.length; i++) {
    const a = line[Math.max(0, i - 1)], b = line[Math.min(line.length - 1, i + 1)], c = line[i];
    const n0 = i > 0 ? _n2(-(c[1] - a[1]), c[0] - a[0]) : null, n1 = i + 1 < line.length ? _n2(-(b[1] - c[1]), b[0] - c[0]) : null;
    const m = _n2((n0 || n1)[0] + (n1 || n0)[0], (n0 || n1)[1] + (n1 || n0)[1]), k = 1 / Math.max(m[0] * (n0 || n1)[0] + m[1] * (n0 || n1)[1], 0.5);
    out.push([c[0] - m[0] * d * k, c[1] - m[1] * d * k]);
  }
  return out;
}
// the metres along a ray (from o, heading u) to the first run of a line it meets, or Infinity
function rayHit(line, ox, oz, ux, uz) {
  let best = Infinity;
  for (let i = 0; i + 1 < line.length; i++) {
    const ax = line[i][0] - ox, az = line[i][1] - oz, ex = line[i + 1][0] - line[i][0], ez = line[i + 1][1] - line[i][1], det = ex * uz - ez * ux;
    if (Math.abs(det) < 1e-12) continue;
    const t = (ex * az - ez * ax) / det, w = (ux * az - uz * ax) / det;
    if (t > 0 && w >= -1e-9 && w <= 1 + 1e-9 && t < best) best = t;
  }
  return best;
}
// the land's seaward lines, in the world: the cove's shore (the plan's arc) and the land's end (the plan's headland,
// run on from the cape's last point along its station as the plan says). The land lies on the RIGHT hand of both.
// -> { shore, head, headS (each head point's station), headIn (the line LANDS.INSET m inland) }
export function landLines(road) {
  if (road._landLines) return road._landLines;
  const shore = shoreArc(road), head = headland(road).slice(), headS = [];
  for (let i = 0; i <= HEAD.N; i++) headS.push(landEnd(HEAD.NC + (LAND.POINT_N - HEAD.NC) * Math.cos(i / HEAD.N * Math.PI / 2)));
  for (let i = 1; i <= HEAD.N; i++) headS.push(landEnd(HEAD.NC - HEAD.DEEP * Math.sin(i / HEAD.N * Math.PI / 2)));
  const far = road.point(landEnd(HEAD.NC - HEAD.DEEP), HEAD.NC - HEAD.DEEP - 2 * LANDS.RIBS[LANDS.RIBS.length - 1], 0);
  head.push([far[0], far[2]]); headS.push(headS[headS.length - 1]);
  return (road._landLines = { shore, head, headS, headIn: offsetLine(head, -LANDS.INSET) });
}
// THE RIBS, in order along the coast: { x, z (the rib's own first point), dx, dz, y, g (metres of coast, for the
// fields), end (metres to its last node), s (its section of the strip, A and C) }. S: the strip's own stations
export function landRibs(road, S) {
  const F = landFrame(road), Ls = landLines(road), ribs = [], far = LANDS.RIBS[LANDS.RIBS.length - 1], a = {};
  const put = (x, z, dx, dz, y, g, s) => ribs.push({ x, z, dx, dz, y, g, s, end: Math.min(far, rayHit(Ls.headIn, x, z, dx, dz)) });
  const onRoad = (s) => {
    road.at(s, a); const yR = road.y(s), e = road.edges(s), n = sides(road, s, yR, e[0], e[1]).star[0];
    const psi = s <= SHORE.S0 ? a.psi : Math.max(a.psi, F.psi);
    put(a.x + Math.cos(a.psi) * n, a.z - Math.sin(a.psi) * n, -Math.cos(psi), Math.sin(psi), yR, s, s);
  };
  for (const s of S) if (s <= SHORE.S0) onRoad(s);
  // B: the shore's cliff top (the arc, INSET m inland) read finely; a rib where it has passed A's last and not yet C's first
  const N = LANDS.COVE_N, sh = Ls.shore, m = sh.length - 1, inl = offsetLine(sh, -LANDS.INSET);
  for (let k = 1; k < N; k++) {
    const f = k / N * m, i = Math.min(m - 1, Math.floor(f)), t = f - i, x = lerp(inl[i][0], inl[i + 1][0], t), z = lerp(inl[i][1], inl[i + 1][1], t), q = F.q(x, z);
    if (q > 0.5 && q < F.Q - 0.5) put(x, z, F.D[0], F.D[1], lerp(F.y0, F.y1, q / F.Q), SHORE.S0 + (SHORE.S1 - SHORE.S0) * q / F.Q, null);
  }
  for (const s of S) if (s >= SHORE.S1 && s <= PP.S_BRINK) onRoad(s);
  return ribs;
}
// THE LAND'S OWN TONES beside the look's palette (flat, the same in both looks): the far layer of the ground, the
// fields' second green and their straw, the shadow that lies on grass, a rock, the lamp room's glass
const TONES = { landFar: '#A6DBA0', field: '#8ED36B', straw: '#E4DC86', grassShadow: '#4C9F5B', rock: '#B9A27C', glass: '#FFF6C4', door: '#8A5A2B', bush: '#35994A', fieldLight: '#B5DE6E' };
const hash2 = (a, b) => { const v = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return v - Math.floor(v); };
// a plain vertex and a plain quad into a builder (no hull, no part): the sheet's and the faces' own skin
const pv = (B, x, y, z, c) => { B.pos.push(x, y, z); B.nor.push(0, 1, 0); B.col.push(c[0], c[1], c[2]); B.k.push(0, 0, 0, 1); B.rig.push(0, 0, 0, 0); return B.pos.length / 3 - 1; };
const pq = (B, a, b, c, d, col) => { const v = pv(B, a[0], a[1], a[2], col); pv(B, b[0], b[1], b[2], col); pv(B, c[0], c[1], c[2], col); pv(B, d[0], d[1], d[2], col); B.idx.push(v, v + 1, v + 2, v + 2, v + 1, v + 3); return v; };

// A CUT EDGE swept along a line of the plan (the land on its right hand): rim, cliff in two bands, beach, surf.
// yTop(i): the land's top at the line's point i; yB: the beach's height; i0..i1: the points swept
function landEdge(B, line, yTop, yB, look, beds = null, i0 = 0, i1 = line.length - 1) {
  const E = LANDS, c = (n) => look.col(n), cols = [c('verge'), c('verge'), c('cliff'), c('cliffShade'), c('beach'), c('surf'), c('beach')];
  const INS = [E.RIM_IN, E.RIM_IN, E.TOP_IN, E.MID_IN, E.FOOT_IN, E.SURF_IN, E.SURF_OUT, E.UNDER_OUT], lines = INS.map((d) => offsetLine(line, -d));
  const sec = (i) => {                                             // the rim lies RIM_UP over the land's own top under each of its two edges
    const yR = yTop(i, lines[0][i][0], lines[0][i][1]), yT = yTop(i, lines[2][i][0], lines[2][i][1]);
    const ys = [yR - E.SKIRT, yR + E.RIM_UP, yT + E.RIM_UP, (yT + yB) / 2, yB, STRIP.SURF[0], STRIP.SURF[1], STRIP.UNDER];
    return ys.map((y, k) => [lines[k][i][0], y, lines[k][i][1]]);
  };
  const top = [], foot = [], secs = []; let a = sec(i0);
  for (let i = i0; i <= i1; i++) {
    const b = i > i0 ? sec(i) : a; secs.push(b);
    if (i > i0) for (let k = 0; k + 1 < a.length; k++) {
      const v = pq(B, a[k], b[k], a[k + 1], b[k + 1], cols[k]);
      // THE SURF'S SEA EDGE slides out and in on the world's time (part 23), a wave that runs along the shore
      if (k === 5 || k === 6) for (const [w, j] of k === 5 ? [[v + 2, i - 1], [v + 3, i]] : [[v, i - 1], [v + 1, i]]) {
        const o = _n2(lines[7][j][0] - lines[6][j][0], lines[7][j][1] - lines[6][j][1]);
        B.k[w * 4 + 1] = 23; B.rig[w * 4] = o[0] * E.SURF_SLIDE; B.rig[w * 4 + 1] = o[1] * E.SURF_SLIDE; B.rig[w * 4 + 2] = j * 0.45;
      }
    }
    top.push(new THREE.Vector3(b[2][0], b[2][1], b[2][2])); foot.push(new THREE.Vector3(b[4][0], b[4][1], b[4][2]));
    a = b;
  }
  stroke(B, top, STRIP.LINE_R, { col: c('ink'), detail: STRIP.LINE_DETAIL }); stroke(B, foot, STRIP.LINE_R, { col: c('ink'), detail: STRIP.LINE_DETAIL });
  // THE BEDS: each sample lies ON the face's own skin (the band's two triangles as pq lays them), E.BED[2] m proud of
  // it toward the sea; a bed breaks where its own sine says, so no line runs the whole shore
  const [SUB, GAP, PROUD, BR] = E.BED, mix = (p, q, t) => [lerp(p[0], q[0], t), lerp(p[1], q[1], t), lerp(p[2], q[2], t)];
  for (const [f0, amp, turns, ph, gaps] of beds || []) {
    let run = [];
    const flush = () => { if (run.length > 1) stroke(B, run, BR, { col: c('ink'), detail: STRIP.LINE_DETAIL }); run = []; };
    for (let j = 0; j <= (secs.length - 1) * SUB; j++) {
      const t = j / SUB, i = Math.min(secs.length - 2, Math.floor(t)), q = t - i, A = secs[i], Z = secs[i + 1];
      if (Math.sin(t * gaps * 6.2831853 + ph * 2.1) < GAP) { flush(); continue; }
      const f = clamp(f0 + amp * Math.sin(t * turns * 6.2831853 + ph), 0.04, 0.96), k = f < 0.5 ? 2 : 3, g = f < 0.5 ? f * 2 : f * 2 - 1;
      // the band k of this span: triangle (A[k], Z[k], A[k+1]) where q + g <= 1, else (A[k+1], Z[k], Z[k+1])
      const P = q + g <= 1 ? [0, 1, 2].map((x) => A[k][x] + q * (Z[k][x] - A[k][x]) + g * (A[k + 1][x] - A[k][x]))
        : [0, 1, 2].map((x) => Z[k + 1][x] + (1 - q) * (A[k + 1][x] - Z[k + 1][x]) + (1 - g) * (Z[k][x] - Z[k + 1][x]));
      const oa = _n2(A[4][0] - A[2][0], A[4][2] - A[2][2]), oz = _n2(Z[4][0] - Z[2][0], Z[4][2] - Z[2][2]), o = mix([oa[0], 0, oa[1]], [oz[0], 0, oz[1]], q);
      run.push(new THREE.Vector3(P[0] + o[0] * PROUD, P[1], P[2] + o[2] * PROUD));
    }
    flush();
  }
}

// buildLand(B, road, look, Y, S): the sheet on its ribs, the nose's level polygon, the two cut edges. S: the strip's stations
export async function buildLand(B, road, look, Y, S) {
  const E = LANDS, F = landFrame(road), Ls = landLines(road), ribs = landRibs(road, S), R = E.RIBS, nb = R.length - 1;
  const cLand = look.col('land'), cFar = look.col(TONES.landFar), cField = look.col(TONES.field), cStraw = look.col(TONES.straw);
  const node = (r, j) => { const t = Math.min(R[j], r.end); return [r.x + r.dx * t, r.y, r.z + r.dz * t]; };
  for (let i = 0; i + 1 < ribs.length; i++) {
    const a = ribs[i], b = ribs[i + 1], run = Math.floor((a.g + b.g) / 2 / E.PATCH[0]);
    for (let j = 0; j < nb; j++) {
      if (Math.min(a.end, b.end) <= R[j]) break;                   // both ribs have ended: no band
      const h = hash2(run, j * 7 + 3), col = j >= E.FAR_BAND ? cFar : j > 0 && h < E.PATCH[1] ? (h < E.PATCH[1] * 0.3 ? cStraw : cField) : cLand;
      pq(B, node(a, j), node(b, j), node(a, j + 1), node(b, j + 1), col);
    }
    if (i % 60 === 59) await Y();
  }
  // THE NOSE AND THE CAPE'S CRESCENT: one polygon at the point's level, from the brink's own section (the strip's
  // vertices there) out along the last rib and back along the land's end (INSET m inland) round the nose
  const P = [], last = ribs[ribs.length - 1], n = stripProfile(road, PP.S_BRINK, 0, P), at = road.at(PP.S_BRINK), cs = Math.cos(at.psi), sn = Math.sin(at.psi), ring = [];
  for (let k = n - 7; k >= 3; k--) ring.push([at.x + cs * P[k * 2], PP.ROAD_Y1, at.z - sn * P[k * 2]]);   // the road's port edge to the verge's starboard edge
  for (let j = 1; j < R.length && R[j - 1] < last.end; j++) ring.push(node(last, j));
  const In = Ls.headIn; let seg = 0;
  for (let i = 0; i + 1 < In.length; i++) if (rayHit([In[i], In[i + 1]], last.x, last.z, last.dx, last.dz) < Infinity) seg = i;
  for (let i = seg; i >= 0; i--) ring.push([In[i][0], PP.ROAD_Y1 - clamp((Ls.headS[i] - E.INSET - PP.S_BRINK) * E.NOSE_DROP[0], 0, E.NOSE_DROP[1]), In[i][1]]);
  const tri = THREE.ShapeUtils.triangulateShape(ring.map((p) => new THREE.Vector2(p[0], p[2])), []), v0 = B.pos.length / 3;
  for (const p of ring) pv(B, p[0], p[1], p[2], cLand);
  for (const t of tri) B.idx.push(v0 + t[0], v0 + t[1], v0 + t[2]);
  await Y();
  // THE CUT EDGES: the cove's shore (its top the sheet's own height there) and the land's end
  landEdge(B, Ls.shore, (i, x, z) => landY(road, x, z), STRIP.POINT_Y, look, E.BEDS);   // the cove's cliff wears the rock's beds
  // THE GRASS OVER THE RIM beside the road (plan-changes pb 7; the lead's P9: where the cove's rim leaves the road it
  // lay as a band of sand square across the grass, the sheet showing through it in slivers). There the land's green
  // runs on to the cliff's own inked line: a strip over the rim from the verge's outer edge on, its far end round.
  {
    const G = E.GRASS_RIM, sh = Ls.shore, inn = offsetLine(sh, -G.IN), out = offsetLine(sh, -G.OUT), secs = [];
    // its heights are THE RIM'S OWN (the land's top under the rim's two edges at the shore's points, straight between them), UP over it
    const rimY = [E.RIM_IN, E.TOP_IN].map((d) => offsetLine(sh, -d).map((q) => landY(road, q[0], q[1])));
    const pt = (L, i, t) => [lerp(L[i][0], L[i + 1][0], t), lerp(rimY[L === inn ? 0 : 1][i], rimY[L === inn ? 0 : 1][i + 1], t) + E.RIM_UP + G.UP[L === inn ? 0 : 1], lerp(L[i][1], L[i + 1][1], t)];
    const sec = (i, t) => [pt(inn, i, t), pt(out, i, t)];
    // the strip begins where each of its two edges leaves the verge (the rim's own start lies askew over the verge's sand)
    const leaves = (L) => { for (let t = 0; t < 1; t += 0.01) { const q = pt(L, 0, t); if (road.stationOf(q[0], q[2], PP.S_BACK, SHORE.S0 + 20).n <= STRIP.VERGE_N - G.CLEAR) return t; } return 1; };
    const t0 = [leaves(inn), leaves(out)], len0 = Math.hypot(sh[1][0] - sh[0][0], sh[1][1] - sh[0][1]);
    secs.push([pt(inn, 0, t0[0]), pt(out, 0, t0[1])]);
    // the corner between the rim's own first section (square to the shore's first run) and the verge's edge: one triangle
    if (t0[0] === 0 && t0[1] > 0) {
      const I = secs[0][0], O = pt(out, 0, 0), Yq = secs[0][1]; let w = 0;
      while (w < 1 && road.stationOf(lerp(I[0], O[0], w + 0.02), lerp(I[2], O[2], w + 0.02), PP.S_BACK, SHORE.S0 + 20).n <= STRIP.VERGE_N - G.CLEAR) w += 0.02;
      const X = [0, 1, 2].map((q) => lerp(I[q], O[q], w)), up = (Yq[2] - I[2]) * (X[0] - I[0]) - (Yq[0] - I[0]) * (X[2] - I[2]) > 0;   // the triangle's turn, seen from above
      const v = pv(B, I[0], I[1], I[2], cLand); pv(B, Yq[0], Yq[1], Yq[2], cLand); pv(B, X[0], X[1], X[2], cLand);
      B.idx.push(v, up ? v + 1 : v + 2, up ? v + 2 : v + 1);
      // and the strip's own end is closed down to the ground on the verge's side (it lies a hand over the rim: seen low
      // from the road, the rim's sand showed under its edge), both faces
      const down = (q) => [q[0], q[1] - G.SKIRT, q[2]];
      for (const [p0, p1] of [[Yq, X], [X, I]]) { pq(B, p0, p1, down(p0), down(p1), cLand); pq(B, p1, p0, down(p1), down(p0), cLand); }
    }
    let l0 = 0;
    for (let i = 0; i + 1 < sh.length && l0 < G.TO; i++) {
      const len = Math.hypot(sh[i + 1][0] - sh[i][0], sh[i + 1][1] - sh[i][1]), l1 = l0 + len;
      if (i === 0 && Math.max(t0[0], t0[1]) < 0.9) secs.push(sec(0, Math.max(t0[0], t0[1]) + 0.02));
      if (l1 < G.TO && i + 2 < sh.length) secs.push(sec(i + 1, 0));
      if (G.TO >= l0 && G.TO < l1 && (i > 0 || G.TO / len0 > Math.max(t0[0], t0[1]) + 0.02)) secs.push(sec(i, (G.TO - l0) / len));
      l0 = l1;
    }
    const low = (q) => [q[0], q[1] - G.SKIRT, q[2]];                 // its own skirt on the land's side (the sheet between two ribs may lie under the rim's foot)
    for (let k = 0; k + 1 < secs.length; k++) { pq(B, secs[k][0], secs[k + 1][0], secs[k][1], secs[k + 1][1], cLand); pq(B, secs[k][0], secs[k + 1][0], low(secs[k][0]), low(secs[k + 1][0]), cLand); }
    if (secs.length > 1) {
      const z = secs[secs.length - 1], y = secs[secs.length - 2], m = [0, 1, 2].map((q) => (z[0][q] + z[1][q]) / 2), u = [0, 1, 2].map((q) => z[0][q] - m[q]);
      const f = _n2((z[0][0] + z[1][0] - y[0][0] - y[1][0]) / 2, (z[0][2] + z[1][2] - y[0][2] - y[1][2]) / 2), r = Math.hypot(u[0], u[2]), v0 = pv(B, m[0], m[1], m[2], cLand);
      for (let j = 0; j <= G.FAN; j++) { const a = j / G.FAN * Math.PI; pv(B, m[0] + Math.cos(a) * u[0] + Math.sin(a) * f[0] * r, m[1] + Math.cos(a) * u[1], m[2] + Math.cos(a) * u[2] + Math.sin(a) * f[1] * r, cLand); }
      for (let j = 0; j < G.FAN; j++) B.idx.push(v0, v0 + 1 + j, v0 + 2 + j);
    }
  }
  await Y();
  landEdge(B, Ls.head, (i) => PP.ROAD_Y1 - clamp((Ls.headS[i] - PP.S_BRINK) * E.NOSE_DROP[0], 0, E.NOSE_DROP[1]), STRIP.POINT_Y, look);
  B.land = { ribs };
  return B;
}

// ---------------------------------------------------------------------------------------------
// THE STANDING THINGS' OWN MATERIAL: the kit's flat material with A SECOND TONE, so that a solid reads as a solid.
// The tone is the fill itself, a little deeper and cooler (uTone), on the side turned from the sun (the sun's own
// bearing, lifted: SHADE_UP), cut clean where the skin turns away. A round skin (aRig.w over 0.5) takes it in the
// fragment by its own normal; a flat-faced solid (a house, a buttress) takes it face by face where it is built.
// A HILL (part 21) also carries its FIELDS: aRig = (the field's own measure along the hill, height over the hill's own,
// the side toward the road), and stripes of the second green are painted where the measure says, on the flank that
// faces the road. Part 23 moves on the world's time: a surf band's sea edge that slides out and in. (The trees' nod is
// the rows' own law: rowMaterial.)
// ---------------------------------------------------------------------------------------------
const SHADE_UP = 0.55, SHADE_AT = -0.18, TONE = [0.62, 0.73, 0.85];
function shadeDirOf(sunDir) { const l = Math.hypot(sunDir.x, SHADE_UP, sunDir.z) || 1; return [sunDir.x / l, SHADE_UP / l, sunDir.z / l]; }
const toned = (c) => [c[0] * TONE[0], c[1] * TONE[1], c[2] * TONE[2]];
function standMaterial(look, sunDir, opts = {}) {
  const sd = shadeDirOf(sunDir);
  return flatMaterial(look.U, {}, {
    uniforms: { uShadeDir: { value: new THREE.Vector3(sd[0], sd[1], sd[2]) }, uTone: { value: new THREE.Vector3(TONE[0], TONE[1], TONE[2]) }, uField: { value: new THREE.Vector3(...look.col(TONES.fieldLight)) } },
    vertexPre: /* glsl */`uniform vec3 uShadeDir; varying float vSh; varying vec4 vFx;`,
    vertexMove: /* glsl */`
      bool skin = aK.x == 0.;
      vSh = (skin && aRig.w > 0.5) ? dot(n / max(length(n), 1e-4), uShadeDir) : 2.;
      vFx = (skin && part > 20.5 && part < 21.5) ? vec4(aRig.xyz, floor(aRig.w * 0.5 + 0.01)) : vec4(-9., 0., 0., 0.);
      if (part > 22.5 && part < 23.5) {                                 // a surf band's sea edge slides out and in (aRig: out x, out z, phase, -)
        float w = 0.5 + 0.5 * sin(uTime * 0.9 + aRig.z);
        p.xz += aRig.xy * w;
      }`,
    fragPre: /* glsl */`uniform vec3 uTone, uField; varying float vSh; varying vec4 vFx;`,
    fragColor: /* glsl */`
      float fwS = clamp(fwidth(vSh), 1e-4, 0.5), fwQ = clamp(fwidth(vFx.x), 1e-4, 4.);
      if (vFx.w > 0.5) {                                                // a hill's fields: every other band of its measure, low on the flank toward the road
        float q = vFx.x, band = abs(fract(q * 0.5 + 0.25) * 2. - 1.);     // fields where q lies in (0, 1), (2, 3), (4, 5)
        float on = (1. - smoothstep(0.5 - fwQ, 0.5 + fwQ, band)) * step(0., q) * step(q, 2. * vFx.w - 1.);
        on *= smoothstep(0.10, 0.12, vFx.z) * (1. - smoothstep(0.52, 0.54, vFx.y)) * smoothstep(0.05, 0.07, vFx.y);
        col = mix(col, uField, on * (1. - smoothstep(0.35, 0.7, fwQ)));
      }
      col = mix(col * uTone, col, smoothstep(${SHADE_AT.toFixed(2)} - fwS, ${SHADE_AT.toFixed(2)} + fwS, vSh));`,
    ...opts,
  });
}
// A FLAT-FACED SOLID: corners P (THREE.Vector3) and faces (each a list of corner numbers, counter-clockwise seen from
// outside). Each face is one flat colour: o.col, or its second tone where the face is turned from the sun (o.sd, the
// shade's heading), or o.cols[f] where given. o.line: the hull's width (its corners carry the sum of their faces).
function solid(B, P, faces, o = {}) {
  const { col = [1, 1, 1], line = 0, sd = null, cols = null } = o, e1 = new THREE.Vector3(), e2 = new THREE.Vector3(), nf = [];
  const sums = P.map(() => new THREE.Vector3());
  faces.forEach((f, fi) => {
    const n = new THREE.Vector3();
    for (let i = 1; i + 1 < f.length; i++) { e1.subVectors(P[f[i]], P[f[0]]); e2.subVectors(P[f[i + 1]], P[f[0]]); n.add(e1.cross(e2)); }
    n.normalize(); nf.push(n);
    const c = cols && cols[fi] ? cols[fi] : sd && n.x * sd[0] + n.y * sd[1] + n.z * sd[2] < SHADE_AT ? toned(col) : col, v0 = B.pos.length / 3;
    for (const k of f) { B.pos.push(P[k].x, P[k].y, P[k].z); B.nor.push(n.x, n.y, n.z); B.col.push(c[0], c[1], c[2]); B.k.push(0, 0, 0, 1); B.rig.push(0, 0, 0, 0); sums[k].add(n); }
    for (let i = 1; i + 1 < f.length; i++) B.idx.push(v0, v0 + i, v0 + i + 1);
  });
  if (line > 0) {                                                  // the hull: the same faces turned about, on corners that carry the sum of their faces
    const h0 = B.pos.length / 3;
    P.forEach((p, k) => { const n = sums[k].normalize(); B.pos.push(p.x, p.y, p.z); B.nor.push(n.x, n.y, n.z); B.col.push(col[0], col[1], col[2]); B.k.push(line, 0, 0, 1.35); B.rig.push(0, 0, 0, 0); });
    for (const f of faces) for (let i = 1; i + 1 < f.length; i++) B.idx.push(h0 + f[0], h0 + f[i + 1], h0 + f[i]);
  }
}
const BOX_FACES = [[0, 3, 2, 1], [4, 5, 6, 7], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]];
// a box on the ground at c, turned to the heading (ax, az): half length hl along it, half width hw across, height h
function slab(B, c, ax, az, hl, hw, h, o = {}) {
  const P = [];
  for (const y of [0, h]) for (const [sl, sw] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) P.push(new THREE.Vector3(c[0] + ax * hl * sl + az * hw * sw, c[1] + y, c[2] + az * hl * sl - ax * hw * sw));
  solid(B, P, BOX_FACES, o);
  return P;
}

// ---------------------------------------------------------------------------------------------
// THE HILLS (the plan's deal: three ranks, typed paler by rank), their houses, and the far headlands.
// A hill is the top of an ellipsoid lying along the coast, carried HILL.UNDER m and more below its own middle so that
// the sloping land never shows under its rim; it wears the scenery's line and its fields (standMaterial, part 21).
// A house (a white box under a red prism, a door and two windows toward the road) stands on the flank that faces the
// road, above the fields, sunk into the hill. Every body made is named in B.bodies for the count: { kind, v0, v1 }.
// ---------------------------------------------------------------------------------------------
const HILL = { SEG: 28, RINGS: 6, UNDER: 8, FIELD_W: [0.15, 0.22], SKEW: 0.5,
  HOUSE: [5.5, 4, 6, 4.2, 1.4], HOUSE_W: [0.5, 0.7], HOUSE_U: 0.55,          // a house: half length, half width, wall, roof, sunk; where on the flank
  FAR: { N: [4, 6], DIST: [1700, 3600], LEN: [380, 800], H: [70, 150], DEEP: [160, 320], OFF_SUN: [20, 62], FROM: 800 } };
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const body = (B, kind, v0, more) => (B.bodies || (B.bodies = [])).push({ kind, v0, v1: B.pos.length / 3, ...more });
function hillSolid(B, h, look) {
  const H = HILL, tx = Math.sin(h.yaw), tz = Math.cos(h.yaw), lat0 = -Math.asin(Math.min(0.6, H.UNDER / h.ry)), S = [], v0 = B.pos.length / 3;
  for (let i = 0; i <= H.RINGS; i++) { const a = lerp(lat0, Math.PI / 2, i / H.RINGS), top = i === H.RINGS, k = Math.cos(a); S.push({ p: V3(h.x, h.y + Math.sin(a) * h.ry, h.z), rx: top ? 1e-4 : h.rx * k, rz: top ? 1e-4 : h.rz * k }); }
  loft(B, S, H.SEG, { col: look.col(['hillNear', 'hillMid', 'hillFar'][h.rank]), line: lineOf(2 * h.rx), axis: V3(0, 1, 0), side: V3(tx, 0, tz) });
  // its fields' own measure: bands FIELD_W of its half length wide, leaning with the height, about a place of their own
  const r1 = hash2(h.x, h.z), r2 = hash2(h.z, h.x + 7), bw = lerp(H.FIELD_W[0], H.FIELD_W[1], r1), u0 = lerp(-0.55, 0.55 - (2 * h.stripes - 1) * bw, r2), skew = (r1 - 0.5) * 2 * H.SKEW;
  const P = B.pos, loc = (v) => { const x = P[v * 3] - h.x, z = P[v * 3 + 2] - h.z; return [(x * tx + z * tz) / h.rx, (P[v * 3 + 1] - h.y) / h.ry, (x * tz - z * tx) / h.rz]; };
  setPart(B, v0, 21, (v, q) => { const l = loc(v); return q === 0 ? (l[0] - u0) / bw + skew * l[1] : q === 1 ? l[1] : q === 2 ? l[2] : 1 + 2 * h.stripes; });
  body(B, 'hill', v0, { rank: h.rank });
  return { tx, tz };
}
export function houseSolid(B, c, ax, az, look, sd) {
  const [hl, hw, wall, roof, sunk] = HILL.HOUSE, o = [c[0], c[1] - sunk, c[2]], v0 = B.pos.length / 3, W = lineOf(2 * hl + 4);
  const P = slab(B, o, ax, az, hl, hw, wall + sunk, { col: look.col('lighthouseWhite'), sd, line: W });
  // the roof: a prism on the wall's top, its ridge along the house, its eaves half a metre out
  const top = o[1] + wall + sunk, e = 0.5, R = [];
  for (const [sl, sw] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) R.push(V3(o[0] + ax * (hl + e) * sl + az * (hw + e) * sw, top, o[2] + az * (hl + e) * sl - ax * (hw + e) * sw));
  R.push(V3(o[0] - ax * (hl + e), top + roof, o[2] - az * (hl + e)), V3(o[0] + ax * (hl + e), top + roof, o[2] + az * (hl + e)));
  solid(B, R, [[0, 3, 2, 1], [0, 1, 5, 4], [2, 3, 4, 5], [1, 2, 5], [3, 0, 4]], { col: look.col('lighthouseRed'), sd, line: W });
  // a door and two windows on the wall toward the road (the port wall), a hair off it
  const face = (l0, l1, y0, y1, col) => { const q = (l, y) => V3(o[0] + ax * l + az * (hw + 0.08), o[1] + sunk + y, o[2] + az * l - ax * (hw + 0.08)); plate(B, q(l0, y0), q(l0, y1), q(l1, y1), q(l1, y0), { col, two: false }); };
  face(-0.8, 0.8, 0, 3.2, look.col(TONES.door)); face(-4, -2.2, 2.2, 4, look.col('ink')); face(2.2, 4, 2.2, 4, look.col('ink'));
  body(B, 'house', v0);
  return P;
}
// buildHills(B, road, look, hills, rng, sd, track, Y): hills, houses, far headlands. -> B.houses, B.crests for the dress
export async function buildHills(B, road, look, hills, rng, sd, Y) {
  B.houses = [];
  for (let i = 0; i < hills.length; i++) {
    const h = hills[i], { tx, tz } = hillSolid(B, h, look);
    for (let k = 0; k < h.houses; k++) {                            // spread along the flank that faces the road, above the fields
      const u = h.houses > 1 ? lerp(-HILL.HOUSE_U, HILL.HOUSE_U, k / (h.houses - 1)) + (hash2(i, k) - 0.5) * 0.2 : (hash2(i, 3) - 0.5) * 0.6, w = lerp(HILL.HOUSE_W[0], HILL.HOUSE_W[1], hash2(k, i + 5));
      const c = [h.x + tx * u * h.rx + tz * w * h.rz, h.y + h.ry * Math.sqrt(Math.max(0, 1 - u * u - w * w)), h.z + tz * u * h.rx - tx * w * h.rz];
      houseSolid(B, c, tx, tz, look, sd); B.houses.push(c);
    }
    await Y();
  }
  return B;
}
// THE FAR HEADLANDS (stream 'hills', after the hills): four to six long low pale ellipsoids sunk in the sea, FAR.DIST m
// from the brink, to starboard and to port of the sun by turns, each lying square to its own bearing. All of one's
// dice first, then the test: from every place of the flown line its whole crest stays FAR_SUN degrees and more from
// the sun's middle (nothing but the opening ever stands before the sun); one that fails is dealt again, six goes.
const FAR_SUN = 13, FAR_TRIES = 6;
export function dealFarHeads(rng, road, track, sun) {
  const F = HILL.FAR, n = rng.int(F.N[0], F.N[1]), out = [], az0 = Math.atan2(sun[0], sun[2]), o = road.at(PP.S_BRINK); let leftOut = 0;
  const clear = (h) => {
    let m = Infinity;
    for (let i = 0; i < track.length; i += 160) for (let e = -1; e <= 1; e += 0.25) for (const y of [0, h.ry * 0.75 * Math.sqrt(1 - e * e * 0.98)]) {
      const x = h.x + Math.sin(h.yaw) * h.rx * e - track[i][0], z = h.z + Math.cos(h.yaw) * h.rx * e - track[i][1], yy = y - track[i][2], l = Math.hypot(x, yy, z);
      m = Math.min(m, Math.acos(clamp((x * sun[0] + yy * sun[1] + z * sun[2]) / l, -1, 1)) * 180 / Math.PI);
    }
    return m;
  };
  for (let k = 0; k < n; k++) {
    let stood = false;
    for (let go = 0; go < FAR_TRIES && !stood; go++) {
      const side = (k + go) % 2 ? 1 : -1, off = rng.range(F.OFF_SUN[0], F.OFF_SUN[1]), dist = rng.range(F.DIST[0], F.DIST[1]), rx = rng.range(F.LEN[0], F.LEN[1]), ry = rng.range(F.H[0], F.H[1]), rz = rng.range(F.DEEP[0], F.DEEP[1]);
      const az = az0 + side * off * Math.PI / 180, h = { x: o.x + Math.sin(az) * dist, y: -0.25 * ry, z: o.z + Math.cos(az) * dist, rx, ry, rz, yaw: az + Math.PI / 2 };
      h.sun = clear(h);
      if (h.sun >= FAR_SUN && placeKind(road, h.x, h.z) === 'sea') { out.push(h); stood = true; }
    }
    if (!stood) leftOut++;
  }
  out.leftOut = leftOut;
  return out;
}
export function farHeads(B, heads, look) {
  for (const h of heads) {
    const v0 = B.pos.length / 3;
    ball(B, V3(h.x, h.y, h.z), [h.rx, h.ry, h.rz], { nseg: 20, nring: 8, col: look.col('headlandFar'), line: 0, side: V3(Math.sin(h.yaw), 0, Math.cos(h.yaw)) });
    body(B, 'far', v0);
  }
}

// ---------------------------------------------------------------------------------------------
// THE ROOST STACK (the plan's STACK, STACK_R, STACK_H): four ochre drums, each a little narrower than the one under it,
// so three ledges and a top; white streaks down it. stackRoosts(road) names the fourteen standing places on the ledges
// and the top for the sea part's sitters: [[x, y, z, heading out from the axis], ...].
// THE LIGHTHOUSE (the plan's TREES.LIGHT, on the land body at the point's level): a plinth, five bands white and red
// by turns, a dark gallery ring, a pale lamp room, a red cone cap; a door and three windows toward the road; the
// keeper's house at its foot on the side away from the road.
// ---------------------------------------------------------------------------------------------
const STACK_D = { DRUMS: 4, R_TOP: 3.5, LEDGE: 0.45, ROOST: [5, 4, 2, 3], SEG: 14 };
const LIGHT = { PLINTH: [5.6, 1.2], R: [4.5, 3.0], BANDS: 5, TOWER: 38, GALLERY: [4.3, 1.3], LAMP: [2.5, 6], CAP: [3.3, 6.7], SEG: 16,
  KEEPER: [9.5, 0], BEAM_Y: 4.2, BEAM: [18, 1.5, 1.0, 2.2], BEAM_CUTS: [[2.2, 18]], SHADOW: [58, 7, 0.6] };   // the keeper's house: metres from the axis, away from the road; the beam: reach, half width and half height at its end, its start from the axis; BEAM_CUTS: the metres from the axis over which it is drawn: ONE whole short taper (the dashes of plan-changes pb 6 read as a fault to every stranger at the bar and went; plan-changes 80)
const stackDrum = (i) => { const D = STACK_D, f0 = i / D.DRUMS, f1 = (i + 1) / D.DRUMS, r = (f) => lerp(STACK_R, D.R_TOP + D.LEDGE * (D.DRUMS - 1), f); return [STACK_H * f0, STACK_H * f1, r(f0) - D.LEDGE * i, r(f1) - D.LEDGE * i]; };
export function stackRoosts(road) {
  const c = chordPoint(road, STACK[0], STACK[1]), out = [];
  STACK_D.ROOST.forEach((n, i) => {
    const d = stackDrum(i), top = i === STACK_D.DRUMS - 1, r = top ? d[3] * 0.55 : d[3] - STACK_D.LEDGE / 2;
    for (let k = 0; k < n; k++) { const a = (k + 0.37 * (i + 1)) / n * 6.2831853; out.push([c[0] + Math.sin(a) * r, d[1], c[1] + Math.cos(a) * r, a]); }
  });
  return out;
}
export function lightAt(road) { const p = road.point(TREES.LIGHT[0], TREES.LIGHT[1], 0), a = road.at(TREES.LIGHT[0]); return { x: p[0], y: PP.ROAD_Y1, z: p[2], psi: a.psi, lamp: PP.ROAD_Y1 + LIGHT.PLINTH[1] + LIGHT.TOWER + LIGHT.GALLERY[1] + LIGHT.BEAM_Y }; }
export async function buildStack(B, road, look, Y) {
  const c = chordPoint(road, STACK[0], STACK[1]), D = STACK_D, v0 = B.pos.length / 3, rg = [0, 0, 0, 1];
  for (let i = 0; i < D.DRUMS; i++) {
    const d = stackDrum(i);
    cone(B, V3(c[0], i ? d[0] : STRIP.UNDER, c[1]), V3(c[0], d[1], c[1]), d[2], d[3], { col: look.col(i % 2 ? 'cliffShade' : 'cliff'), line: lineOf(STACK_H), nseg: D.SEG, rig: rg, cap0: false });
    for (let k = 0; k < 3; k++) {                                   // white streaks from the ledge above, a hair off the skin
      const a = hash2(i, k) * 6.2831853, len = lerp(0.3, 0.75, hash2(k, i + 2)) * (d[1] - d[0]), r1 = d[3] + 0.07, r0 = lerp(d[3], d[2], len / (d[1] - d[0])) + 0.07;
      stroke(B, [V3(c[0] + Math.sin(a) * r1, d[1] - 0.2, c[1] + Math.cos(a) * r1), V3(c[0] + Math.sin(a) * r0, d[1] - len, c[1] + Math.cos(a) * r0)], 0.28, { col: look.col('surf') });
    }
  }
  body(B, 'stack', v0); await Y();
  return B;
}
export async function buildLight(B, road, look, sd, Y) {
  const L = LIGHT, at = lightAt(road), W = lineOf(60), rg = [0, 0, 0, 1], up = (y) => V3(at.x, at.y + y, at.z), v0 = B.pos.length / 3;
  const drum = (y0, y1, r0, r1, col, o = {}) => cone(B, up(y0), up(y1), r0, r1, { col: look.col(col), line: W, nseg: L.SEG, rig: rg, ...o });
  drum(-0.5, L.PLINTH[1], L.PLINTH[0], L.PLINTH[0], 'wall');
  let y = L.PLINTH[1];
  for (let i = 0; i < L.BANDS; i++) { const f0 = i / L.BANDS, f1 = (i + 1) / L.BANDS, h = L.TOWER / L.BANDS; drum(y, y + h, lerp(L.R[0], L.R[1], f0), lerp(L.R[0], L.R[1], f1), i % 2 ? 'lighthouseRed' : 'lighthouseWhite', { cap0: false, cap1: i === L.BANDS - 1 }); y += h; }
  drum(y, y + L.GALLERY[1], L.GALLERY[0], L.GALLERY[0], 'ink'); y += L.GALLERY[1];
  drum(y, y + L.LAMP[1], L.LAMP[0], L.LAMP[0], TONES.glass, { rig: [0, 0, 0, 0] }); y += L.LAMP[1];
  drum(y, y + L.CAP[1], L.CAP[0], 0, 'lighthouseRed');
  await Y();
  // the door and the windows look at the road: on the tower's port side, a hair off its skin
  const px = Math.cos(at.psi), pz = -Math.sin(at.psi), tx = Math.sin(at.psi), tz = Math.cos(at.psi);
  const rAt = (yy) => lerp(L.R[0], L.R[1], clamp((yy - L.PLINTH[1]) / L.TOWER, 0, 1)) + 0.1;
  const face = (hw, y0, y1, col) => { const q = (l, yy) => V3(at.x + px * rAt(yy) + tx * l, at.y + yy, at.z + pz * rAt(yy) + tz * l); plate(B, q(-hw, y0), q(-hw, y1), q(hw, y1), q(hw, y0), { col: look.col(col), two: false }); };
  face(1.1, L.PLINTH[1], L.PLINTH[1] + 4.2, TONES.door);
  for (const f of [0.3, 0.52, 0.74]) face(0.7, L.PLINTH[1] + L.TOWER * f, L.PLINTH[1] + L.TOWER * f + 2.2, 'ink');
  body(B, 'light', v0);
  // the keeper's house, away from the road
  houseSolid(B, [at.x - px * L.KEEPER[0] + tx * L.KEEPER[1], at.y, at.z - pz * L.KEEPER[0] + tz * L.KEEPER[1]], tx, tz, look, sd);
  return B;
}

// ---------------------------------------------------------------------------------------------
// THE TREES (the plan's deal: clumps of two to five, three sizes, a cone one time in eight) and the crest trees of the
// hills. A lollipop tree is a brown stick (one instanced mesh, the tree's own row: iA = foot x, y, z, size; iB = phase,
// kind) and a crown that is only a circle: a disc turned to the eye, drawn as the kit draws discs (its line first), and
// over it a second, smaller disc slid toward the light, so the crown wears its second tone as a crescent on the side
// turned from the sun. A cone tree is a stick and a cone. Every tree NODS on the world's time (NOD: metres of sway a
// metre of height, by the square of the height), stick, cone and crown by one law. A bush is a crown on the ground.
// ---------------------------------------------------------------------------------------------
const TREE = { STICK: [0.62, 0.04, 0.028], CROWN_Y: 0.75, LIT: [0.84, 0.15, 0.3], NOD: 0.05, CONE: [0.2, 0.24], W: 0.135,
  CREST: [3, 6], CREST_U: 0.62, CREST_SIZE: [6, 9], SUNK: 0.6, BUSH: [0.4, 1.1, 2.0, 5] };   // a bush: its chance beside a tree, its radius, how far off
const NOD_GLSL = /* glsl */`vec2 ppNod(float ph){ float w = 0.6 * sin(uTime * 1.3 + ph) + 0.4 * sin(uTime * 2.1 + ph * 1.7); return vec2(w, 0.6 * w); }`;
// the rows' material: standMaterial whose things are laid by their rows (unit height, scaled by the row's size)
function rowMaterial(look, sunDir) {
  const m = standMaterial(look, sunDir);
  m.vertexShader = m.vertexShader.replace('void main(){', NOD_GLSL + '\nvoid main(){').replace('bool skin = aK.x == 0.;',
    `p.xz += ppNod(iB.x) * ${TREE.NOD.toFixed(3)} * p.y * p.y; p = p * iA.w + iA.xyz;\n      bool skin = aK.x == 0.;`);
  return m;
}
async function treeGeometry(look, isCone, Y) {
  const T = TREE, B = { pos: [], nor: [], col: [], k: [], rig: [], idx: [], hulls: [] }, rg = [0, 0, 0, 1];
  const top = isCone ? T.CONE[0] + 0.04 : T.STICK[0];
  loft(B, [{ p: V3(0, -0.08, 0), rx: T.STICK[1], rz: T.STICK[1] }, { p: V3(0, top, 0), rx: T.STICK[2], rz: T.STICK[2] }], 6, { col: look.col('treeStick'), line: T.W, axis: V3(0, 1, 0), rig: rg });
  if (isCone) cone(B, V3(0, T.CONE[0], 0), V3(0, 1, 0), T.CONE[1], 0, { col: look.col('treeCone'), line: T.W, nseg: 12, rig: rg });
  return finish(B, Y, { instanced: true });
}
// makeTrees(look, sunDir, list, Y): list [{ x, y, z, size, cone, phase }] (and bushes: { bush: radius })
// -> { group, count }: sticks, cones, crowns (two passes)
async function makeTrees(look, sunDir, list, Y) {
  const T = TREE, group = new THREE.Group(), sd = shadeDirOf(sunDir), mat = rowMaterial(look, sunDir); group.name = 'pp-trees';
  const rowsOf = (pick) => list.filter(pick).map((t) => [t.x, t.y, t.z, t.size, t.phase, t.cone ? 1 : 0, 0, 0]);
  for (const [name, isCone, pick] of [['pp-sticks', false, (t) => !t.cone && !t.bush], ['pp-cones', true, (t) => t.cone]]) {
    const rows = rowsOf(pick); if (!rows.length) continue;
    const g = setInstances(await treeGeometry(look, isCone, Y), rows), m = new THREE.Mesh(g, mat); m.name = name; m.frustumCulled = false; group.add(m);
    await Y();
  }
  // the crowns: for every lollipop tree and bush a disc in the crown's deeper tone and, over it, the lit disc
  const discs = [], foot = [], more = [];
  for (const t of list) {
    if (t.cone) continue;
    const r = t.bush || crownR(t.size), cy = t.bush ? t.y + r * 0.55 : t.y + t.size * T.CROWN_Y, h = t.bush ? r * 0.55 / 9 : T.CROWN_Y, col = look.col(t.bush ? TONES.bush : 'treeHead');
    for (const lit of [0, 1]) { discs.push({ p: [t.x, cy, t.z], r, col: lit ? col : toned(col) }); foot.push(t.phase, T.NOD * (t.bush ? 9 : t.size) * h * h); more.push(lit); }
  }
  if (discs.length) {
    const crowns = makeDiscs(discs, look, { name: 'pp-crowns', ring: T.W, attributes: { iNod: { array: foot, size: 2 }, iLit: { array: more, size: 1 } },
      uniforms: { uShadeDir: { value: new THREE.Vector3(sd[0], sd[1], sd[2]) } },
      vertexPre: `attribute vec2 iNod; attribute float iLit; uniform vec3 uShadeDir;\n` + NOD_GLSL,
      vertexMove: /* glsl */`
        c.xz += ppNod(iNod.x) * iNod.y;
        if (iLit > 0.5) {                                               // the lit disc: smaller, slid toward the light across the view, a hair nearer the eye
          vec3 toE = cameraPosition - c; toE = toE / max(length(toE), 1e-4);
          vec3 s = uShadeDir - toE * dot(uShadeDir, toE);
          c += s * (${T.LIT[1].toFixed(2)} * r) + toE * ${T.LIT[2].toFixed(2)}; r *= ${T.LIT[0].toFixed(2)};
          if (uRing > 0.) r = 0.;                                       // it wears no line of its own
        }` });
    group.add(crowns);
  }
  return { group, count: list.length };
}
// may a small thing of the land stand at (x, z) with radius r? On the land body, off the cove's shore, off the lighthouse
// (the trees' own rules in the plan), and, where given its road place, behind the entry clear of the entry axis
const landOk = (road, x, z, r, s, n) => placeKind(road, x, z) === 'land' && lineDist(shoreArc(road), x, z) >= 6 + r &&
  Math.hypot(x - lightAt(road).x, z - lightAt(road).z) >= TREES.LIGHT_R + r && !(s < 0 && n > PP.LENS_N - TREES.ENTRY - r);
// THE TREES' LIST: the plan's dealt trees on the land's own height, each with its phase; bushes beside some (stream
// 'trees', after the deal: every bush's dice first, then its test); the crest trees of the hills (stream 'hills')
export function landTrees(road, trees, hills, rngT, rngH) {
  const T = TREE, out = [];
  for (const t of trees) out.push({ x: t.x, y: landY(road, t.x, t.z) - 0.05, z: t.z, size: t.size, cone: t.cone, phase: rngT() * 6.2831853, s: t.s, n: t.n });
  const nt = out.length; let leftOut = 0;
  for (let i = 0; i < nt; i++) {
    const t = out[i], want = rngT() < T.BUSH[0], r = rngT.range(T.BUSH[1], T.BUSH[2]), ds = rngT.range(-T.BUSH[3], T.BUSH[3]), dn = rngT.range(1.5, T.BUSH[3]), ph = rngT() * 6.2831853;
    if (!want) continue;
    const s = t.s + ds, n = Math.min(t.n - dn, TREES.ROW_N - 1.5 - r), p = road.point(s, n, 0);
    if (s < TREES.S_A[0] || (s > TREES.S_A[1] && s < TREES.S_B[0]) || s > TREES.S_B[1] || !landOk(road, p[0], p[2], r, s, n)) { leftOut++; continue; }
    out.push({ x: p[0], y: landY(road, p[0], p[2]), z: p[2], size: 0, bush: r, phase: ph, s, n });
  }
  for (const h of hills) {
    const k = rngH.int(T.CREST[0], T.CREST[1]), tx = Math.sin(h.yaw), tz = Math.cos(h.yaw);
    for (let j = 0; j < k; j++) {
      const u = lerp(-T.CREST_U, T.CREST_U, (j + rngH()) / k), size = rngH.range(T.CREST_SIZE[0], T.CREST_SIZE[1]) * (h.rank === 2 ? 1.5 : 1), ph = rngH() * 6.2831853, cone = rngH() < TREES.CONE;
      if (h.crest) out.push({ x: h.x + tx * u * h.rx, y: h.y + h.ry * Math.sqrt(1 - u * u) - T.SUNK, z: h.z + tz * u * h.rx, size, cone, phase: ph, crest: true });
    }
  }
  out.leftOut = leftOut;
  return out;
}
// THE COVE'S FAR SHORE: a row of plain houses on the cliff top behind the cove, doors to the water, at typed shares of
// the shore's arc (none near its two ends, where the flown line is close); and a grove behind them (stream 'trees',
// after the bushes: each tree's dice first, then the land's test and 9 m from every house)
const COVE = { HOUSES: 5, H_F: [0.3, 0.8], H_IN: 14, TREES: 16, T_F: [0.2, 0.9], T_IN: [24, 52] };
function shoreAt(road, f) {                                         // the shore's point at share f of its arc, and the unit toward the land
  const sh = shoreArc(road), m = sh.length - 1, g = clamp(f, 0, 1) * m, i = Math.min(m - 1, Math.floor(g)), t = g - i, n = _n2(-(sh[i + 1][1] - sh[i][1]), sh[i + 1][0] - sh[i][0]);
  return { x: lerp(sh[i][0], sh[i + 1][0], t), z: lerp(sh[i][1], sh[i + 1][1], t), nx: n[0], nz: n[1] };
}
export function coveHouses(road) {
  const out = [];
  for (let k = 0; k < COVE.HOUSES; k++) {
    const q = shoreAt(road, lerp(COVE.H_F[0], COVE.H_F[1], (k + 0.3 * hash2(k, 9)) / (COVE.HOUSES - 0.7))), x = q.x + q.nx * COVE.H_IN, z = q.z + q.nz * COVE.H_IN;
    out.push({ c: [x, landY(road, x, z) + HILL.HOUSE[4] - 0.3, z], ax: q.nz, az: -q.nx });
  }
  return out;
}
export function coveTrees(road, rng, houses) {
  const out = []; let leftOut = 0;
  for (let k = 0; k < COVE.TREES; k++) {
    const f = lerp(COVE.T_F[0], COVE.T_F[1], rng()), inl = rng.range(COVE.T_IN[0], COVE.T_IN[1]), size = TREES.SIZES[rng.int(0, 3)], cone = rng() < TREES.CONE, phase = rng() * 6.2831853;
    const q = shoreAt(road, f), x = q.x + q.nx * inl, z = q.z + q.nz * inl, r = crownR(size);
    if (!landOk(road, x, z, r, 1, 0) || houses.some((h) => Math.hypot(h.c[0] - x, h.c[2] - z) < 9 + r)) { leftOut++; continue; }
    out.push({ x, y: landY(road, x, z) - 0.05, z, size, cone, phase });
  }
  out.leftOut = leftOut;
  return out;
}

// THE NOSE'S BUSHES: low round bushes on the land's end beside the last of the road, starboard of the tree row's line
// (stream 'trees', after the grove: each bush's dice first, then the land's test, a rim's width in from the land's end)
const NOSE = { N: 14, S: [606, 686], SIDE: [-36, -14.5], R: [0.7, 1.5] };
export function noseBushes(road, rng) {
  const out = []; let leftOut = 0;
  for (let k = 0; k < NOSE.N; k++) {
    const s = rng.range(NOSE.S[0], NOSE.S[1]), n = rng.range(NOSE.SIDE[0], NOSE.SIDE[1]), r = rng.range(NOSE.R[0], NOSE.R[1]), phase = rng() * 6.2831853, p = road.point(s, n, 0);
    if (!landOk(road, p[0], p[2], r, s, n) || s > landEnd(n) - LANDS.RIM_IN - r) { leftOut++; continue; }
    out.push({ x: p[0], y: PP.ROAD_Y1 - clamp((s - PP.S_BRINK) * LANDS.NOSE_DROP[0], 0, LANDS.NOSE_DROP[1]), z: p[2], size: 0, bush: r, phase, s, n });
  }
  out.leftOut = leftOut;
  return out;
}

// ---------------------------------------------------------------------------------------------
// THE STANDING SHADOWS: one instanced mesh of flat drawn shadows on the land body, each laid from its thing's foot away
// from the sun's bearing (a stem and a round head: a lollipop's own shadow; the lighthouse's is the same shape, long).
// It is paint on the land: its far end stands on the land's own height there, and a shadow whose end would lie off the
// land (over the cove's cliff, off the land's end) is drawn shorter until it lies on land, or not at all.
// rows: [{ x, y, z (the foot), len, wide }]. Drawn just after the land, with a polygon offset.
// ---------------------------------------------------------------------------------------------
const SHADOW = { LEN: 1.25, WIDE: 0.27, STEM: 0.16, HEAD: [0.7, 0.3], UP: 0.07, TRY: [1, 0.7, 0.45], SEG: 12 };
export function shadowRows(road, things, sun) {
  const l = Math.max(Math.hypot(sun[0], sun[2]), 1e-6), dx = -sun[0] / l, dz = -sun[2] / l, rows = []; let leftOut = 0;
  for (const t of things) {
    let stood = false;
    for (const f of SHADOW.TRY) {
      const x = t.x + dx * t.len * f, z = t.z + dz * t.len * f;
      if (placeKind(road, x, z) !== 'land' || lineDist(shoreArc(road), x, z) < LANDS.RIM_IN + t.wide) continue;
      rows.push([t.x, t.y + SHADOW.UP, t.z, t.wide, x, landY(road, x, z) + SHADOW.UP, z, t.stem ?? SHADOW.STEM]); stood = true; break;
    }
    if (!stood) leftOut++;
  }
  rows.leftOut = leftOut;
  return rows;
}
async function makeStandingShadows(look, rows, Y) {
  const S = SHADOW, B = { pos: [], nor: [], col: [], k: [], rig: [], idx: [], hulls: [] }, c = look.col(TONES.grassShadow);
  const a = pv(B, 0, 1, -1, c); pv(B, S.HEAD[0], 1, -1, c); pv(B, 0, 1, 1, c); pv(B, S.HEAD[0], 1, 1, c); B.idx.push(a, a + 1, a + 2, a + 2, a + 1, a + 3);   // the stem (y 1: its width is the stem's share)
  const m = pv(B, S.HEAD[0], 0, 0, c);
  for (let i = 0; i <= S.SEG; i++) { const t = i / S.SEG * 6.2831853; pv(B, S.HEAD[0] + Math.cos(t) * S.HEAD[1], 0, Math.sin(t), c); if (i) B.idx.push(m, m + i, m + i + 1); }
  const g = setInstances(await finish(B, Y, { instanced: true }), rows);
  const mat = flatMaterial(look.U, {}, { side: THREE.DoubleSide, extra: { polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 },
    vertexMove: /* glsl */`
      vec3 d = iB.xyz - iA.xyz; vec2 sd2 = vec2(d.z, -d.x) / max(length(d.xz), 1e-4);
      float wv = position.z * iA.w * (position.y > 0.5 ? iB.w : 1.);
      p = iA.xyz + d * position.x + vec3(sd2.x, 0., sd2.y) * wv; n = vec3(0., 1., 0.);` });
  const mesh = new THREE.Mesh(g, mat); mesh.name = 'pp-shadows'; mesh.frustumCulled = false;
  return mesh;
}

// ---------------------------------------------------------------------------------------------
// THE FLOWERS AND THE GRASS (stream 'flowers'): flower heads are discs turned to the eye (a head and its middle), never
// taller than FLOWER.TOP m, on both verges of the cliff road and the point (never inside the road's edges), thinly over
// the point's ground and the headland's top, and as larger dots on the hills' flanks toward the road; the grass is 'v'
// pairs of short strokes on the starboard ground beside the verge and, larger, on the hills. Every one's dice first.
// dealDress(rng, road, hills, n) -> { heads: [{ p, r, col, mid }], vs: [{ p, h, yaw }], leftOut }; dressSteps is the same deal
// in steps for the page (it hands back every 128 points dealt: the same dice in the same order)
// ---------------------------------------------------------------------------------------------
const FLOWER = { N: 800, TOP: 0.6, R: [0.16, 0.3], COLS: ['dash', 'sun', 'bikeRed', 'dash', 'bill'], STAR: [-14.6, -10.3], PORT: [13.9, 16.5], S_A: [-340, 298], S_B: [517, 668],
  FIELD: [520, 684, -46, -12.6, 0.45, 0.3], HILL: [22, 0.55, 0.95], V: [0.5, 0.26], V_STAR: [-15.2, -12.3], V_N: 0.55, V_HILL: [10, 2.6] };   // FIELD: stations, sides, its flowers' and its grass's share of n
export function dealDress(rng, road, hills, n) { const g = dressSteps(rng, road, hills, n); let r = g.next(); while (!r.done) r = g.next(); return r.value; }
export function* dressSteps(rng, road, hills, n) {
  const F = FLOWER, heads = [], vs = [], lenA = F.S_A[1] - F.S_A[0], lenB = F.S_B[1] - F.S_B[0]; let leftOut = 0;
  const onRoad = (band) => { const inB = rng() < lenB / (lenA + lenB), u = rng(), w = rng(); return [inB ? lerp(F.S_B[0], F.S_B[1], u) : lerp(F.S_A[0], F.S_A[1], u), lerp(band[0], band[1], w)]; };
  const head = (x, y, z, r, k) => heads.push({ p: [x, y, z], r, col: F.COLS[k], mid: F.COLS[k] === 'sun' ? 'bill' : 'sun' });
  for (let i = 0; i < n; i++) {                                     // the verges: two in three to starboard (the lens's own side)
    const port = rng() < 0.34, [s, nn] = onRoad(port ? F.PORT : F.STAR), r = rng.range(F.R[0], F.R[1]), h = rng.range(0.3, F.TOP) - r, k = rng.int(0, F.COLS.length - 1);
    const p = road.point(s, nn, Math.max(h, r * 0.6)); head(p[0], p[1], p[2], r, k);
    if (i % 128 === 127) yield;
  }
  yield;
  for (let i = 0; i < Math.round(n * F.FIELD[4]); i++) {            // the point's ground and the headland's top, where it is land
    if (i % 128 === 127) yield;
    const s = rng.range(F.FIELD[0], F.FIELD[1]), nn = rng.range(F.FIELD[2], F.FIELD[3]), r = rng.range(F.R[0], F.R[1]) * 1.4, k = rng.int(0, F.COLS.length - 1), p = road.point(s, nn, 0);
    if (placeKind(road, p[0], p[2]) !== 'land' || s > landEnd(nn) - LANDS.RIM_IN) { leftOut++; continue; }
    head(p[0], PP.ROAD_Y1 - clamp((s - PP.S_BRINK) * LANDS.NOSE_DROP[0], 0, LANDS.NOSE_DROP[1]) + r * 0.7, p[2], r, k);
  }
  yield;
  for (let i = 0; i < Math.round(n * F.FIELD[5]); i++) {            // the grass of the point's ground, on the same land
    if (i % 128 === 127) yield;
    const s = rng.range(F.FIELD[0], F.FIELD[1]), nn = rng.range(F.FIELD[2], F.FIELD[3]), h = rng.range(F.V[0] * 0.7, F.V[0] * 1.3), yaw = rng() * 6.2831853, p = road.point(s, nn, 0);
    if (placeKind(road, p[0], p[2]) !== 'land' || s > landEnd(nn) - LANDS.RIM_IN) { leftOut++; continue; }
    vs.push({ p: [p[0], PP.ROAD_Y1 - clamp((s - PP.S_BRINK) * LANDS.NOSE_DROP[0], 0, LANDS.NOSE_DROP[1]), p[2]], h, yaw });
  }
  yield;
  for (let i = 0; i < Math.round(n * F.V_N); i++) {                 // the grass beside the starboard verge
    if (i % 128 === 127) yield;
    const [s, nn] = onRoad(F.V_STAR), h = rng.range(F.V[0] * 0.7, F.V[0]), yaw = rng() * 6.2831853, p = road.point(s, nn, 0);
    vs.push({ p, h, yaw });
  }
  yield;
  for (const hl of hills) {
    const tx = Math.sin(hl.yaw), tz = Math.cos(hl.yaw), on = (u, w) => [hl.x + tx * u * hl.rx + tz * w * hl.rz, hl.y + hl.ry * Math.sqrt(Math.max(0, 1 - u * u - w * w)), hl.z + tz * u * hl.rx - tx * w * hl.rz];
    for (let i = 0; i < F.HILL[0]; i++) { const u = rng.range(-0.75, 0.75), w = rng.range(0.1, 0.8), r = rng.range(F.HILL[1], F.HILL[2]), k = rng.int(0, 1), p = on(u, w); if (hl.rank < 2 && u * u + w * w < 0.9) head(p[0], p[1] + r * 0.5, p[2], r, k); }
    for (let i = 0; i < F.V_HILL[0]; i++) { const u = rng.range(-0.75, 0.75), w = rng.range(0.05, 0.8), yaw = rng() * 6.2831853, p = on(u, w); if (hl.rank < 2 && u * u + w * w < 0.9) vs.push({ p, h: F.V_HILL[1], yaw, hill: true }); }
  }
  return { heads, vs, leftOut };
}
// the flower heads as the kit's discs (each head, and its middle a hair nearer the eye); the 'v's as strokes into B
function makeFlowers(look, heads) {
  const list = [], near = [];
  for (const f of heads) { list.push({ p: f.p, r: f.r, col: f.col, sway: 0.04 }, { p: f.p, r: f.r * 0.42, col: f.mid, sway: 0.04 }); near.push(0, 1); }
  return makeDiscs(list, look, { name: 'pp-flowers', attributes: { iMid: { array: near, size: 1 } }, vertexPre: 'attribute float iMid;',
    vertexMove: /* glsl */`if (iMid > 0.5) { vec3 toE = cameraPosition - c; c += toE / max(length(toE), 1e-4) * 0.12; }` });
}
export async function grassVs(B, vs, look, Y) {
  const col = look.col('treeCone'), v0 = B.pos.length / 3; let i = 0;
  for (const g of vs) {
    if (Y && ++i % 120 === 0) await Y();
    const ax = Math.sin(g.yaw), az = Math.cos(g.yaw), w = g.h * FLOWER.V[1] / FLOWER.V[0] * 2, o = V3(g.p[0], g.p[1] - 0.03, g.p[2]);
    for (const sg of [-1, 1]) stroke(B, [o, V3(o.x + ax * w * sg, o.y + g.h, o.z + az * w * sg)], g.h * 0.07, { col });
  }
  body(B, 'grass', v0);
}

// ---------------------------------------------------------------------------------------------
// THE HARBOUR WALL'S DRESS (plain shapes of our own; nothing on the wall stands over WALL.TOP m above its deck, and
// nothing reaches a metre out from a face, so the plan's water stays water): a low PARAPET along the seaward edge,
// outside the road's own edge; BUTTRESSES on both faces, every WALL.STEP m; a QUAY LEDGE with BOLLARDS along the
// harbour face between the two places where the lens crosses that edge (none within WALL.KEEP of them); two flights of
// STEPS down the harbour face to the water. Stations are the wall's own (the root's eased end to the landing).
// ---------------------------------------------------------------------------------------------
const WALL = { S: [306, 497], TOP: 0.55, PARAPET: [0.8, 0.5], STEP: 15, BUTT: [1.2, 0.9, 1.3], LEDGE: [376, 446, 0.9, 0.8], BOLLARD: [12, 0.45, 0.3, 0.5],
  STAIRS: [[356, 1], [458, -1]], STAIR: [1.6, 0.95, 1.1],            // a flight: its top's station and the way it goes down; a step: run, width, rise
  // THE COURSES OF STONE on the harbour face (plan-changes 54): the first level joint's height over the sea, the metres
  // between joints, the room a joint keeps under the deck, how far the strokes stand proud of the face, their radius;
  // an upright joint every JOINT[0] m of wall (each row half a stone along from the row below), none shorter than JOINT[1]
  COURSE: [1.8, 1.75, 0.6, 0.04, 0.045], JOINT: [6.4, 0.7],
  // THE PERCHES (plan-changes 54): the harbour-face buttresses beyond the quay ledge on whose tops a sea pelican sits, [station, the way it faces along the wall]
  PERCH: [[462, 1], [477, -1]], PERCH_N: 0.6, PERCH_SINK: 0.15 };   // (the seat lies PERCH_SINK m in the buttress's top: the bird's head stays under WALL.TOP over the deck)
export async function buildWallDress(BL, B, road, look, sd, S, Y) {                 // BL: the land's builder (plain skins, both faces drawn); B: the standing things'
  const W = WALL, cw = look.col('wall'), cs = look.col('wallShade'), ink = look.col('ink'), a = {}, v0 = B.pos.length / 3;
  const at = (s, n, y) => { road.at(s, a); return [a.x + Math.cos(a.psi) * n, y, a.z - Math.sin(a.psi) * n]; };
  const St = S.filter((s) => s >= W.S[0] && s <= W.S[1]), e0 = PP.ROAD_N0, e1 = PP.ROAD_N1, lines = [[], [], []];
  for (let i = 0; i < St.length; i++) {                             // the parapet: inner face, top, outer face, underside; the ledge: top and face
    const s = St[i], y = road.y(s), sec = (ss, yy) => [at(ss, e1, yy), at(ss, e1, yy + W.TOP), at(ss, e1 + W.PARAPET[0], yy + W.TOP), at(ss, e1 + W.PARAPET[0], yy - W.PARAPET[1]), at(ss, e1, yy - W.PARAPET[1])];
    const p = sec(s, y);
    lines[0].push(V3(...p[1])); lines[1].push(V3(...p[2]));
    if (i + 1 < St.length) { const q = sec(St[i + 1], road.y(St[i + 1])); [cs, cw, cw, cs].forEach((c, k) => pq(BL, p[k], q[k], p[k + 1], q[k + 1], c)); }
    if (s >= W.LEDGE[0] && s <= W.LEDGE[1]) {
      const l = (ss, yy) => [at(ss, e0, yy), at(ss, e0 - W.LEDGE[2], yy), at(ss, e0 - W.LEDGE[2], yy - W.LEDGE[3]), at(ss, e0, yy - W.LEDGE[3])], lp = l(s, y);
      lines[2].push(V3(...lp[1]));
      if (i + 1 < St.length && St[i + 1] <= W.LEDGE[1]) { const lq = l(St[i + 1], road.y(St[i + 1])); [cw, cs, cs].forEach((c, k) => pq(BL, lp[k + 1], lq[k + 1], lp[k], lq[k], c)); }
    }
  }
  for (const ln of lines) if (ln.length > 1) stroke(BL, ln, STRIP.LINE_R, { col: ink, detail: STRIP.LINE_DETAIL });
  await Y();
  // the courses: level joints from the root to the landing, each as far as the deck stands over it; then the upright
  // joints row by row (the lowest row stands on the waterline). DETAIL strokes: a far wall is a clean flat again.
  {
    const [y0, dy, room, proud, r] = W.COURSE, n = e0 - proud, top = (s) => road.y(s) - room, o = { col: ink, detail: STRIP.LINE_DETAIL };
    for (let y = y0; y <= top(St[0]); y += dy) {
      const ln = St.filter((s) => y <= top(s)).map((s) => V3(...at(s, n, y)));
      if (ln.length > 1) stroke(BL, ln, r, o);
      await Y();
    }
    for (let row = 0, lo = STRIP.WATERLINE; lo <= top(St[0]); row++, lo = y0 + (row - 1) * dy) {
      for (let s = W.S[0] + W.JOINT[0] * (row % 2 ? 0.7 : 0.2); s <= W.S[1]; s += W.JOINT[0]) {
        const hi = Math.min(y0 + row * dy, top(s));
        if (hi - lo >= W.JOINT[1]) stroke(BL, [V3(...at(s, n, lo)), V3(...at(s, n, hi))], r, o);
      }
      await Y();
    }
  }
  const W1 = lineOf(12), put = (s, n, y0, y1, hl, hw, o) => { road.at(s, a); slab(B, [a.x + Math.cos(a.psi) * n, y0, a.z - Math.sin(a.psi) * n], a.tx, a.tz, hl, hw, y1 - y0, { col: cw, sd, line: W1, ...o }); };
  for (let s = W.S[0] + 6; s <= W.S[1] - 6; s += W.STEP) {          // buttresses on both faces, their tops under the deck
    const y = road.y(s) - W.BUTT[2], stairs = W.STAIRS.some(([s0, way]) => (s - s0) * way > -3 && (s - s0) * way < 21);
    if (!stairs) put(s, e0 - W.BUTT[1] / 2, STRIP.UNDER, y, W.BUTT[0], W.BUTT[1] / 2);
    put(s, e1 + W.BUTT[1] / 2, STRIP.UNDER, y, W.BUTT[0], W.BUTT[1] / 2);
  }
  for (let s = W.LEDGE[0] + 3; s <= W.LEDGE[1] - 3; s += W.BOLLARD[0]) {   // bollards on the quay ledge: a drum and a round head
    const p = at(s, e0 - W.BOLLARD[1], road.y(s));
    cone(B, V3(p[0], p[1], p[2]), V3(p[0], p[1] + W.BOLLARD[3] - 0.12, p[2]), W.BOLLARD[2], W.BOLLARD[2] * 0.8, { col: look.col('shadow'), line: 0.05, nseg: 8, rig: [0, 0, 0, 1], cap0: false });
    ball(B, V3(p[0], p[1] + W.BOLLARD[3] - 0.14, p[2]), [W.BOLLARD[2] * 1.2, 0.14, W.BOLLARD[2] * 1.2], { nseg: 8, nring: 4, col: look.col('shadow'), line: 0.05, rig: [0, 0, 0, 1] });
  }
  for (const [s0, way] of W.STAIRS) {                               // steps: each a block from under the water to its own tread
    const n = Math.floor((road.y(s0) - 1.2) / W.STAIR[2]);
    for (let k = 0; k < n; k++) { const s = s0 + way * (k + 0.5) * W.STAIR[0]; put(s, e0 - W.STAIR[1] / 2, STRIP.UNDER, road.y(s0) - (k + 1) * W.STAIR[2], W.STAIR[0] / 2, W.STAIR[1] / 2); }
  }
  body(B, 'wall dress', v0);
  return B;
}

// THE PERCHES' PLACES: [[x, y (the seat), z, the heading], ...] by the wall's own stations (typed; no die)
export function wallPerches(road) {
  const W = WALL, a = {};
  return W.PERCH.map(([s, way]) => { road.at(s, a); const n = PP.ROAD_N0 - W.PERCH_N; return [a.x + Math.cos(a.psi) * n, road.y(s) - W.BUTT[2] - W.PERCH_SINK, a.z - Math.sin(a.psi) * n, Math.atan2(a.tx * way, a.tz * way)]; });
}

// THE LAND'S DEAL, in the build's one order (the count runs this same function): stream 'hills' deals the hills, then
// the far headlands, then the crest trees; stream 'trees' the plan's trees, then the bushes, the cove's grove, the nose's bushes;
// stream 'flowers' the flowers and the grass. -> { hills, fars, village, trees, dress }
export async function dealLand(road, R, track, sun3, density, Y = async () => {}) {
  const hills = dealHills(R.hills, road); await Y();
  const fars = dealFarHeads(R.hills, road, track, sun3), village = coveHouses(road); await Y();
  const dealt = dealTrees(R.trees, density, road); await Y();
  const trees = landTrees(road, dealt, hills, R.trees, R.hills).concat(coveTrees(road, R.trees, village), noseBushes(road, R.trees)); await Y();
  return { hills, fars, village, trees, dress: await inSteps(dressSteps(R.flowers, road, hills, Math.round(FLOWER.N * density)), Y) };
}
// the things that throw a standing shadow: every tree of the land (not a crest tree, not a bush), the lighthouse, the cove's houses
export function shadowThings(road, trees, village) {
  const lamp = lightAt(road), things = trees.filter((t) => !t.crest && !t.bush).map((t) => ({ x: t.x, y: t.y, z: t.z, len: SHADOW.LEN * t.size, wide: SHADOW.WIDE * t.size }));
  things.push({ x: lamp.x, y: lamp.y, z: lamp.z, len: LIGHT.SHADOW[0], wide: LIGHT.SHADOW[1], stem: LIGHT.SHADOW[2] });
  for (const h of village) things.push({ x: h.c[0], y: h.c[1] - HILL.HOUSE[4] + 0.3, z: h.c[2], len: 11, wide: 5.5, stem: 0.9 });
  return things;
}
// THE MEASURES OF THE ROWS for the count (the makers' own numbers): a tree -> { crown: [x, y, z, r, its bare radius] or null, pole: [x, y0, z,
// r, y1] } (a cone tree's pole is its cone's whole drum; r carries the nod's whole swing, the line and the lit disc's slide);
// the beam -> the drum its turning wedges sweep about the lamp: { x, y, z, r, h }
export function treeBody(t) {
  const T = TREE, pad = T.W + T.LIT[2], nod = 1.17 * T.NOD * (t.bush ? 9 * (t.bush * 0.55 / 9) ** 2 : t.size);
  if (t.bush) return { crown: [t.x, t.y + t.bush * 0.55, t.z, t.bush + nod + pad], pole: null };
  if (t.cone) return { crown: null, pole: [t.x, t.y - 0.08 * t.size, t.z, T.CONE[1] * t.size + nod * T.CONE[0] * T.CONE[0] + T.W, t.y + t.size + T.W] };   // widest at its base, where it nods least
  return { crown: [t.x, t.y + t.size * T.CROWN_Y, t.z, crownR(t.size) + nod * T.CROWN_Y * T.CROWN_Y + pad, crownR(t.size)], pole: [t.x, t.y - 0.08 * t.size, t.z, T.STICK[1] * t.size + nod + T.W, t.y + t.size * T.STICK[0]] };
}
export function beamBody(road) { const a = lightAt(road), [reach, hw, hh] = LIGHT.BEAM; return { x: a.x, y: a.lamp, z: a.z, r: Math.hypot(reach, hw), h: hh }; }

// THE BEAM: two flat-coloured tapers about the lamp, LIGHT.BEAM[0] m long (so short that, from no place of the flown
// line, any part of them comes within the sun's disc: the count proves it), turning once in PP.BEAM_PERIOD s on the
// world's time from a start dealt by the stream 'beam'. No line: it is light, not a thing. Each taper is SHORT and
// WHOLE (LIGHT.BEAM_CUTS: one piece, 18 m, 3 m wide at its end): a wedge of light that stays at its lamp, so that
// no slab and no row of pieces hangs in the air where the lamp is out of the frame.
function makeBeam(look, at, start) {
  const [reach, hw, hh, r0] = LIGHT.BEAM, B = { pos: [], nor: [], col: [], k: [], rig: [], idx: [], hulls: [] }, c = look.col('beam'), e = 0.5;
  for (const sg of [1, -1]) for (const [ra, rb] of LIGHT.BEAM_CUTS) {
    const ring = (r) => { const t = (r - r0) / (reach - r0), w = lerp(e, hw, t), h = lerp(e, hh, t); return [[r * sg, -h, -w], [r * sg, -h, w], [r * sg, h, w], [r * sg, h, -w]]; }, A = ring(ra), Z = ring(rb);
    for (let k = 0; k < 4; k++) pq(B, A[k], Z[k], A[(k + 1) % 4], Z[(k + 1) % 4], c);
    pq(B, Z[0], Z[1], Z[3], Z[2], c);
    if (ra > r0) pq(B, A[0], A[1], A[3], A[2], c);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(B.pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(B.nor, 3));
  g.setAttribute('aCol', new THREE.Float32BufferAttribute(B.col, 3)); g.setAttribute('aK', new THREE.Float32BufferAttribute(B.k, 4)); g.setAttribute('aRig', new THREE.Float32BufferAttribute(B.rig, 4));
  g.setIndex(B.idx);
  const mesh = new THREE.Mesh(g, flatMaterial(look.U, {}, { side: THREE.DoubleSide })); mesh.name = 'pp-beam';
  mesh.position.set(at.x, at.lamp, at.z); mesh.rotation.y = start;
  return mesh;
}

// ---------------------------------------------------------------------------------------------
// THE ROUTE'S HELPERS
// ---------------------------------------------------------------------------------------------
const STREAMS = ['look', 'hopeless', 'guests', 'dress', 'livery', 'hills', 'trees', 'clouds', 'seabirds', 'boats', 'flowers', 'beam', 'rare'];
// THE LOOKS, by PLACES: the metres flown at which each opens and closes, and its weight (the design's five). The last
// has no closing place of its own (null: the route's end): the engine lets every look go near the flight's end.
// LOOK_RAMP: the metres over which a look takes hold and lets go (its explicit fade, a share of its own window)
const LOOK_D = [[0, 290], [300, 432], [436, 640], [650, 780], [790, null]], LOOK_W = [0.7, 0.6, 0.7, 0.6, 0.7], LOOK_H = 3.2, LOOK_RAMP = 24;
// THE LAST LOOK'S TARGET: the leader's own place by the pack law's mirror, LOOK_ASTERN m astern of its middle (so the
// whole bird, its rear wheel too, is carried into the picture as it comes near) and LOOK_LEAD_H m over the road
const LOOK_ASTERN = 3, LOOK_LEAD_H = 3.6;
const LOOK_LANE = PP.LANES[1], LOOK_LINE = (PP.LANES[0] + PP.LANES[1]) / 2, LOOK_FAR_LIMB = 476;   // lane 2; the line between lanes 1 and 2; the far limb's station
const TRACK_STEP = 0.25;
// the lens's own road station at u (400 steps, built once), for the looks' targets only: read on the cliff road
// (s 0 to 330) while under 330 m are flown, and on the far limb, the point and the ribbon (s 480 on) from the metre
// look 3 opens; between the two no look asks (the lens is over the harbour), and the table runs evenly across
async function stationTable(path, road, Y) {
  const N = 400, T = new Float32Array(N + 1), v = new THREE.Vector3(), L = path.length, D_A = 330, D_B = LOOK_D[2][0];
  let ia = 0, ib = N;
  for (let i = 0; i <= N; i++) {
    const d = i / N * L; path.posAtDist(d, v);
    if (d < D_A) { T[i] = road.stationOf(v.x, v.z, 0, 330).s; ia = i; }
    else if (d >= D_B) { T[i] = road.stationOf(v.x, v.z, 480, PP.S_END).s; ib = Math.min(ib, i); }
    if (i % 40 === 39) await Y();
  }
  for (let i = ia + 1; i < ib; i++) T[i] = lerp(T[ia], T[ib], (i - ia) / (ib - ia));
  return (u) => { const f = clamp(u, 0, 1) * N, i = Math.min(N - 1, Math.floor(f)); return lerp(T[i], T[i + 1], f - i); };
}
// the flown line sampled every 0.25 m as the plan's mirrors and dealers take it: [[x, z, y, d], ...], the entry axis
// back to s -340 first (d under 0)
async function sampleTrack(path, Y) {
  const track = [], v = new THREE.Vector3(), p = path.start, t = path.startTangent, L = path.length, n = Math.round(L / TRACK_STEP);
  for (let d = PP.S_BACK; d < 0; d += TRACK_STEP) track.push([p.x + t.x * d, p.z + t.z * d, p.y, d]);
  for (let i = 0; i <= n; i++) { path.posAtDist(Math.min(i * TRACK_STEP, L), v); track.push([v.x, v.z, v.y, i * TRACK_STEP]); if (i % 800 === 799) await Y(); }
  return track;
}
// a deal in steps (the plan's generators hand back between goes): the context yields at every hand-back
async function inSteps(gen, Y) { let r = gen.next(); while (!r.done) { await Y(); r = gen.next(); } return r.value; }

export default {
  id: 'pelican-peloton', name: 'The Pelican Peloton', category: 'bizarre', weirdness: 0.75, media: ['air'],
  async build(ctx) {
    const Y = () => ctx.yield();
    const scene = new THREE.Scene();
    // 1. THE STREAMS by name, all thirteen on every visit (ctx.rng itself is not drawn from); the look
    const stream = (name) => ctx.core.makeRng(ctx.core.hashSeed(name + ':' + ctx.seed));
    const R = {}; for (const name of STREAMS) R[name] = stream(name);
    const vary = ctx.vary, hour = vary.hour, first = R.look();                       // the look stream's first draw is taken on every visit
    const key = hour === 'day' || hour === 'golden' ? 'day' : hour === 'dawn' ? 'morning' : first < 0.6 ? 'day' : 'morning';
    const look = makeLook(key);
    const U = look.U, detail = ctx.quality.detail, density = vary.density, rare = !!vary.rare;
    await Y();

    // 2. THE ROAD and its 64 knots into the shared uniform; THE ROUTE from the plan's rules; the sampled track; the sun
    const road = layRoad();
    await Y();
    look.setRoad(road);
    await Y();
    const miss = meetMiss(road);
    if (!(miss < 0.3)) throw new Error('pelican-peloton: the meeting point lies ' + miss.toFixed(2) + ' m off the lens\'s straight over the harbour');
    await Y();
    const path = makePath(routePoints(road)), L = path.length;
    await Y();
    const track = await sampleTrack(path, Y);
    await Y();
    const sCam = await stationTable(path, road, Y);
    await Y();
    // THE SUN stands on the last straight's own line: the route's last tangent (its heading, its climb of 8 degrees)
    const sunDir = path.endTangent.clone().normalize(), sunHex = look.hex.sun;
    U.uSunDir.value.copy(sunDir);

    // 4. SKY and SEA (the sea part's makers, each called by its signature)
    const shoal = rare ? (() => { const p = road.point(RARE.S, RARE.N, 0); return { x: p[0], z: p[2], r: RARE.R }; })() : null;
    // THE SUN IS ON THE DOME: the sky draws it about sunDir (at infinity on the last straight's own line), and the
    // water's road of light runs under it along sunDir's bearing from the eye, as light does. No place of the world is
    // handed to the sea for the sun: a road of light laid toward the route's end would lie off the dome sun's middle
    // from every place that is not on the last straight (seen over the harbour)
    const sky = makeSky(look, sunDir, { domeSun: true });
    sky.mesh.renderOrder = -10; scene.add(sky.mesh);
    await Y();
    const sea = makeSea(look, sunDir, { strokes: Math.round(2400 * detail), shoal });
    sea.group.renderOrder = -5; scene.add(sea.group);
    await Y();

    // 5. THE STRIP: cliff road, harbour wall, point, ribbon
    const SB = await buildStrip({ pos: [], nor: [], col: [], k: [], rig: [], idx: [], hulls: [] }, road, look, Y);
    const strip = new THREE.Mesh(await finish(SB, Y), flatMaterial(U, {}, {})); strip.name = 'pp-strip';
    scene.add(strip);
    await Y();

    // 6. THE LAND BODY on its ribs, with its cut edges (no hull in it: both faces drawn)
    const sd = shadeDirOf(sunDir), sun3 = [sunDir.x, sunDir.y, sunDir.z], newB = () => ({ pos: [], nor: [], col: [], k: [], rig: [], idx: [], hulls: [] });
    const LB = await buildLand(newB(), road, look, Y, SB.strip.S);
    await Y();

    // 7. THE STANDING THINGS in one mesh: the hills in three ranks with their houses, the far headlands, the roost
    // stack, the lighthouse and the keeper's house, the wall's dress (the hills' stream deals the hills, then the far
    // headlands, then the crest trees)
    const deal = await dealLand(road, R, track, sun3, density, Y), { hills, fars, village, dress } = deal;
    await Y();
    const TB = await buildHills(newB(), road, look, hills, R.hills, sd, Y);
    farHeads(TB, fars, look);
    await buildStack(TB, road, look, Y);
    await buildLight(TB, road, look, sd, Y);
    for (const h of village) houseSolid(TB, h.c, h.ax, h.az, look, sd);
    await buildWallDress(LB, TB, road, look, sd, SB.strip.S, Y);
    await Y();

    // 8. THE TREES (the plan's deal, bushes beside some, the hills' crest trees), THE FLOWERS AND THE GRASS, THE SHADOWS.
    // Detail thins trees, flowers and grass only (never the hills, the lighthouse or the stack)
    const thin = (list) => (detail >= 1 ? list : list.filter((t, i) => hash2(i, 1.5) < detail));
    const trees = thin(deal.trees);
    await grassVs(TB, thin(dress.vs), look, Y);
    await Y();
    const land = new THREE.Mesh(await finish(LB, Y), standMaterial(look, sunDir, { side: THREE.DoubleSide })); land.name = 'pp-land';
    const standing = new THREE.Mesh(await finish(TB, Y), standMaterial(look, sunDir)); standing.name = 'pp-standing';
    strip.renderOrder = -4; land.renderOrder = -3;
    scene.add(land); scene.add(standing);
    await Y();
    const lamp = lightAt(road), things = shadowThings(road, trees, village);
    const shadows = await makeStandingShadows(look, shadowRows(road, things, sun3), Y); shadows.renderOrder = -2;
    scene.add(shadows);
    await Y();
    scene.add((await makeTrees(look, sunDir, trees, Y)).group);
    await Y();
    scene.add(makeFlowers(look, thin(dress.heads)));
    await Y();
    // 16. THE BEAM: its start from the stream 'beam'
    const beam = makeBeam(look, lamp, R.beam() * 6.2831853), beam0 = beam.rotation.y;
    scene.add(beam);
    await Y();

    // 9. THE CLOUDS: the drifting lanes dealt (dice first, then each lane's reach to the flown line), the bank typed
    const cloudDeal = await inSteps(cloudSteps(R.clouds, density, track, road), Y);
    await Y(); await inSteps(bankSteps(look), Y); await Y();                                          // the typed bank is laid in steps of its own (the gate: the clouds' step was 35 to 60 ms with the bed in it)
    const clouds = makeClouds(look, cloudDeal, { detail });                                  // detail thins the bank's fog and far row only
    scene.add(clouds.group);
    await Y();

    // 10. THE PACK'S DEAL: 96 rows from the plan's places; riders keep to themselves or the build stops
    const rows = dealPack(SLOTS, { hopeless: R.hopeless, guests: R.guests, dress: R.dress, livery: R.livery });
    const bad = packCheck(rows);
    if (bad.length) throw new Error('pelican-peloton: ' + bad.length + ' pairs of riders meet (the first: places ' + bad[0].a + ' and ' + bad[0].b + ')');
    await Y();

    // 11, 12. THE RACE (the riders' part's buildPack): every mesh of the pack from the dealt rows, moved by the pack law
    const pack = await buildPack(ctx, look, rows, Y);
    scene.add(pack.group);
    await Y();

    // 13. THE SEA PELICAN (open and folded) and the sea birds' deal, in steps; 15. the rare visit's deal from its own stream
    const birdOpen = await seaPelicanGeometry(look, Y, {});
    const birdFolded = await seaPelicanGeometry(look, Y, { folded: true });
    const seaDeal = await inSteps(seaBirdSteps(R.seabirds, { density }, road, track), Y);
    const rareDeal = rare ? await inSteps(rareSteps(R.rare, road, track, seaDeal), Y) : null;
    await Y();

    // 14. THE BIRDS AND THE BOATS (the sea part's makers, each by its signature). The gliders fly the sea plan's seven
    // typed lines (the maker lays them). Detail thins the ambient divers only (never the nine, the gliders, the roost
    // or the boats). The rare visit's boats are named to the divers' and the splashes' makers, which leave out every
    // diver whose course would meet one (the sea plan's law of places), so no maker leans on the order of the calls
    const divers = thin(seaDeal.divers), rareBoats = rareDeal ? rareDeal.boats : [];
    scene.add(makeGliders(look, birdOpen)); await Y();
    scene.add(makeDivers(look, birdOpen, divers, { boats: rareBoats })); await Y();
    scene.add(makeSplashes(look, divers, { boats: rareBoats })); await Y();
    scene.add(makeSitters(look, birdFolded, seaDeal.sitters, stackRoosts(road), wallPerches(road))); await Y();  // the fourteen of the roost stand where the stack's builder says; two sit on the wall's last buttresses
    const nine = NINE.map((spec, i) => nineCourse(i, track));                                // the typed points of each of the nine's courses
    scene.add(makeNine(look, birdOpen, nine)); await Y();
    scene.add(makeSplashes(look, nine, { byD: true })); await Y();
    if (rareDeal) {
      scene.add(makeDivers(look, birdOpen, rareDeal.divers, { boats: rareBoats })); await Y();
      scene.add(makeSplashes(look, rareDeal.divers, { boats: rareBoats })); await Y();
    }
    // the eight typed boats (and the rare visit's three beyond the shoal); each sail's colour, turn and phase from its stream
    // A boat is TURNED BY ITS PLACE (plan-changes 49): a boat to port of the straight the lens holds from the leaving
    // point lies SAIL_TURN[0] radians from that straight and a boat to starboard SAIL_TURN[1] (port positive), either
    // end first and up to SAIL_OFF off by the stream's one number. Its mainsail (swung 0.34 off the keel) then stands
    // 30 degrees and more off every line of sight from the road before the leaving and from the crossing: no needle.
    const SAIL_TURN = [-0.49, 1.48], SAIL_OFF = 0.26, lv = road.at(PP.S_LEAVE), lvAt = road.point(PP.S_LEAVE, PP.LENS_N, 0), along = Math.atan2(lv.tx, lv.tz);
    const sailOf = (rng, p) => {
      const red = rng() < 0.5, t = rng() * 2, port = (p[0] - lvAt[0]) * lv.tz - (p[1] - lvAt[2]) * lv.tx > 0;
      return { red, turn: along + SAIL_TURN[port ? 0 : 1] + (t < 1 ? 0 : Math.PI) + ((t % 1) * 2 - 1) * SAIL_OFF, phase: rng() };
    };
    const boatAt = BOATS.map((b) => chordPoint(road, b[0], b[1])), sails = boatAt.map((q) => sailOf(R.boats, q));
    if (rareDeal) for (const q of rareDeal.boats) { boatAt.push(q); sails.push(sailOf(R.rare, q)); }
    // the bay's three boats (plan-changes pb 3): typed whole in the sea plan, turn and sail and phase; they draw no number
    // from any stream and are laid after the dealt boats, in the same one mesh
    for (const b of bayBoats(road)) { boatAt.push([b.x, b.z]); sails.push({ red: b.red, turn: b.turn, phase: b.phase }); }
    scene.add(makeBoats(look, boatAt, sails));
    await Y();
    // THE SECOND HALF'S DRESS (plan-changes pb 2, 3): the watchers on the bed's lobes beside the road in the air and the
    // strings of pennants along the road's edges, every one typed by place in the sea plan (no stream, no die); they
    // move on the world's time alone. Detail thins neither.
    scene.add(makeWatchers(look, birdFolded)); await Y();
    scene.add(makePennants(look)); await Y();

    // THE LOOKS open and close by PLACES (metres flown over the route's length); each target is worked out from u
    // inside the look's own function: looks 1 and 3 the road 10 m ahead of the lens's own station in lane 2; look 2
    // the fixed point of the wall's far limb; look 4 the ribbon 30 m ahead on the line between lanes 1 and 2; look 5
    // THE LEADER, where the pack law puts it at u's own metres (the plan's riderPlace: no clock, no lens, no state)
    const aim = LOOK_D.map(() => new THREE.Vector3()), _p = [0, 0, 0], _rp = {}, leader = rows.find((r) => r.band === 'leader');
    const at = (k, s, n) => { road.point(s, n, LOOK_H, _p); return aim[k].set(_p[0], _p[1], _p[2]); };
    const atLeader = (u) => { riderPlace(leader, clamp(u, 0, 1) * L, road, _rp); road.hermite(_rp.s - LOOK_ASTERN, _rp.n, LOOK_LEAD_H, _p); return aim[4].set(_p[0], _p[1], _p[2]); };
    at(1, LOOK_FAR_LIMB, LOOK_LINE);
    const targets = [(t, u) => at(0, sCam(u) + 10, LOOK_LANE), aim[1], (t, u) => at(2, sCam(u) + 10, LOOK_LANE),
      (t, u) => at(3, sCam(u) + 30, LOOK_LINE), (t, u) => atLeader(u)];
    const pois = targets.map((target, k) => {
      const d0 = LOOK_D[k][0], d1 = LOOK_D[k][1] ?? L;
      return { at: target, from: d0 / L, to: d1 / L, fade: LOOK_RAMP / (d1 - d0), weight: LOOK_W[k], steady: true };
    });

    // THE WAY OUT: the engine's bare round window at the route's last point, square to the last straight, its veil the
    // sun's own flat colour; no rim, ring or double is built by the world
    const portal = { shape: 'circle', radius: PP.PORTAL_R, style: 'ring', frame: 0, glow: 0, halo: false, color: sunHex, veil: sunHex, tilt: true,
      drawWithin: PP.DRAW_WITHIN, drawIn: PP.DRAW_IN, revealDistance: PP.REVEAL, dewash: 0 };

    // UPDATE copies and nothing else: the world's time, the metres flown (0 while seen through a portal), the drawing
    // buffer's height, the lens's place for the dome and the sea. No material, define, light or visibility is touched
    const _v2 = new THREE.Vector2(), camP = path.start.clone();
    function update(dt, time, camera, u) {
      U.uTime.value = time;
      U.uD.value = ctx.through ? 0 : clamp(u, 0, 1) * L;
      U.uResY.value = Math.max(1, ctx.renderer.getDrawingBufferSize(_v2).y);
      if (camera) camera.getWorldPosition(camP);                 // the build's own first call hands no lens: the dome and the fan stay at the route's first point
      U.uCamP.value.copy(camP);
      sky.update(time, camP);
      sea.update(time, camP);
      clouds.update(time);
      beam.rotation.y = beam0 + time * 6.2831853 / PP.BEAM_PERIOD;
    }
    update(0, 0, null, 0);

    return {
      scene, path, duration: FLIGHT.DURATION, pace: (u) => paceOf(clamp(u, 0, 1) * L),
      camera: { fov: 62, near: 0.3, far: 6000, lookAhead: 24, sway: 0.35, bank: 0.5, nearThrough: 0.3 },
      pois, portal,
      post: { flat: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } },
      style: 'none', ride: 'none', companion: 'none',
      update, dispose() {},
    };
  },
};
