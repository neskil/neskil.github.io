// boathouse-full-of-morning: A BLUE POLICE BOX ON A LAKE WHOSE DOORS LEAD ON TO A GARDEN, A SEA AND A FROZEN SEA UNDER
// A RINGED PLANET (round two, the lead's section G; ROUND FOUR: the hut is THE BLUE POLICE BOX, and wherever a name or
// a comment below still says "hut" it means that box). A great blue police box stands on a lake at the blue hour; its
// open doors lead into a walled garden in morning sun. The same box stands in a long basin at the head of the garden's
// cherry avenue; its doors lead on to a sea at sunset. The same box stands in a cove of an islet off the harbour; its
// doors lead on to the pack ice of a giant planet's ring under the stars. And out there the same box stands frozen
// into a floe, with the way out in its doorway. One builder function makes all four (the part file's buildHut and
// buildJetty: the same body, posts, panelled leaves, lit windows, sign bands, stepped roof and lamp, and the same plank
// landing; a lantern on the landings of the last three, never on the lake's); each place only dresses it.
// The hero is the crossing: three times the hut is seen whole and small, the lens flies in through its door, and the
// place beyond is of another kind, hour and colour.
// (The series is named in the module's header fields and nowhere else.)
//
// AXES: +x east, +y up, +z south. Metres. Bearings are compass bearings. Lake level y 0. The planes, the outlines, the
// line, the huts, the land and the berg massif are the same on every seed (the massif's three bergs draw their shards
// from fixed streams of their own, named for the massif as it now stands: MASSIF_WORDS); the seed deals the dressing,
// the boats' phases and the four bergs beside the ways in the stars (see FORKS OF THE SEED in build).
//
// THE THREE PLANES (src/parts/boathouse-full-of-morning.js, PLANES). EVERY OUTLINE IS THE HUT'S ARCH, the engine's own
// (the lead's rulings of 14 and 15 Oct): 6.4 m wide, 3.2 m either side of the line, its foot 2.7 m under the line (0.5 m
// under the hut's water line), straight jambs to a springing 1.4 m over the line, a half-round head of radius 3.2 m.
// The line passes each plane square, 2.2 m over the hut's water line.
//   PLANE ONE: z = 0, facing south; the line passes at (0, 2.2, 0); the water line is the lake's, y 0. Outer side: the
//     lake hut's water door. Inner side: a water gate of the same outline in a gatehouse of the garden's south wall.
//   PLANE TWO: z = -205, facing south; the line passes at (-22, 3.2, -205); the water line is the long basin's, y 1.0.
//     Outer side: the garden hut's water door. Inner side: a sea gate of the same outline at the foot of the harbour's
//     cliff.
//   PLANE THREE: upright through (98, 1.2, -304.7), its outward normal toward bearing 315; the line passes through it
//     on bearing 135; the water line is the sea's, y -1. Outer side: the islet hut's water door. Inner side: a plain
//     arch of pale stone of the same outline, standing alone on the ring's ice.
//   THE FLOOR PLANE: level, y = -5. The stars' place lies behind plane three and runs on SOUTH of plane two's whole
//     plane, under the garden's ground; there the three planes' sides alone cannot tell an eye in the stars from an
//     eye in the garden. Between planes one and two an eye over the floor plane stands in the garden, an eye under it
//     in the stars. One more fixed plane of the world, read by the eye's side of it and nothing else. WHAT THE LAW
//     ALLOWS THE STARS' LINE (round three, the lead's B4): north of plane two's plane (z < -205) the eye stands in the
//     stars by plane three's side alone, at any height; south of it only under the floor plane. So the line may rise
//     as it rounds the berg massif and must be under y -5 before it passes z -205. It goes under the floor plane soon
//     after plane three, rises a little over it only round the massif's east end, far north of plane two's plane, and
//     is well under it again before it passes plane two's plane on its last straight (layLine: the build stops if any
//     point of the line south of a metre short of that plane stands within a metre of the floor plane).
//
// THE CROSSING'S LAW, LINE 5, WORD FOR WORD:
//   WHAT DECIDES, AND WHAT NEVER DOES. Only which side of each fixed plane the eye stands on, and where each line of
//   sight crosses it: one test, the same in every material and in the skies, on every seed. Nothing goes by the clock,
//   by metres flown or by a fade. Which places are in the scene at all (the eye's place and its neighbours) goes by
//   the eye's side of the planes too, and a place is taken out only when no line of sight can reach it.
//
// HOW IT IS BUILT. One GLSL function, seenPlace (the part file), says in which place the far end of a sight line
// lies. Every material of the world comes from one helper (kit.mat) that writes that test as the last lines of its
// fragment shader: a fragment of place m stands only where the answer is m. The four skies are one dome whose every
// pixel draws the sky of the answer. Each place's sun, sky and air are its own, wherever it is seen from; a place's
// air is laid only over the part of a sight line that lies in that place. No scene.fog, no three.js light. Each
// opening's frame is the hut's own door case: it stands BEFORE its plane with its faces a millimetre inside the
// outline, so the edge one sees is the boards' own edge.
// WHICH PLACES ARE HANDED TO THE RENDERER: with the eye in place k, the places k-1, k and k+1 (by the eye's side of
// the planes, in update()); a neighbour is left out only while its one opening (the only window through which any of
// it can be seen) lies wholly beyond one of the four side planes of the eye's view. The near and the far plane are
// never asked (round three b, S6): a place stays in whenever a line of sight from the eye can cross its opening.
// THE LIGHT OF THE NEXT PLACE AT AN OPENING (the morning on the lake's water and on the hut's jambs; the sunset poured
// down the long basin and on the garden hut's jambs; the stars' cold light on the sea before the islet hut's door and
// on its jambs) is written from where the lit surface stands and how it faces, and never reads the eye. So is THE
// LANTERN's light, the same lantern on the jetties of the garden's, the sea's and the last hut (none at the lake's).
//
// THE WAY OUT (section 177): the engine draws it, as a rectangle 6.4 by 7.3 m, in the last box's open doorway, which is as
// wide (foot on foot, jamb on jamb; over its head, 6.8 m, the doorway shows the box's dark inside up to 12.8 m). This world sets NEITHER portal.drawWithin NOR portal.drawIn:
// the ring stands whole from the flight's first metre. From the lake, the garden and the sea up to its last ten metres it is
// never in a line of sight, because the water and ground of those places (opaque, written to depth) always stand
// between: its place lies at y -12.55 under them. IN THE SEA'S LAST TEN METRES, through the islet hut's door, it IS
// seen, small and far, in the door of the hut out on the ice: a hut in a hut's door, kept so by the owner's ruling 9;
// no berg, no floe, no ridge and no block stands in that sight. (Round three b: once through that door the line
// turns 45 degrees off that sight; rounds three c and d: the berg massif, its feet by the room that sight's strip and
// the line leave and its heights by the door it must hide, within the design's band for great bergs (MASSIF,
// massifHeights), hides the door from about 32 m in, and the whole hut a little farther in, where the sights from the
// line to all of the hut's points are shut; the door comes into view round the massif's east end, to the line's
// right, from about 79 m in, the whole hut a few metres farther on, and the last run is straight and low at its door.)
// Nothing of ours draws a ring, a growing lamp or an image of one, and no test of ours touches the engine's ring.
// The last hut is a body of the stars' place; behind its door, where the ring is not in sight, stands the hut's plain
// inside of tarred boards: back wall, roof timbers, an oar on pegs.
//
// WHAT MOVES, all of it on the world's clock and none of it because the visitor comes. Lake: ripples, reeds, the
// boats at the jetty, swifts, fireflies. Garden: the jets and the great jet, leaves, petals on
// the canal and the long basin, birds, butterflies (none nearer than 6 m), bees; in the second court the round pool's
// jets, cherry petals falling, crowns stirring, and over all of it the shadows of four clouds. Sea: a long swell, foam
// at the moles, the wall's foot, the stacks and the islet, moored boats rocking (the home-coming boat swinging to her
// chain at the buoy by the fairway), a fleet under sail with wakes (the second boat on a ring of its own), a far
// steamer, gulls, the two pierhead lights and the lighthouse flashing, the town's chimney smoke and lit windows, surf
// breaking at the islet's foot, clouds. Stars: the
// planet's bands and storms turning slowly, lightning on its night side, the ring's lanes running far out, ice dust,
// glints; THE PACK ICE IS STILL (round three, the lead's B3): its floes, its ridges and every block frozen into it
// stand where they are, and the last hut STANDS STILL in its floe.
//
// SOURCES (for the audit). The idea: the series' alone. The real world: tarred, turf-roofed boathouses of the north;
// English walled gardens of brick with a canal and jets, and parterres of box-edged beds; fishing harbours under a
// cliff, with moles, boat stores in the harbour wall and gaff-rigged luggers, and their towns of slate-roofed houses
// climbing the hill behind the quay in terraces with steps between; sea stacks; islets of layered rock with sea
// pinks on their turf; THE RINGS OF A GIANT PLANET, which are countless blocks of water ice from pebbles to houses in
// a sheet only tens of metres thick; and the pack ice of a polar sea in early winter: floes of 5 to 60 m, dark leads
// between them, pressure ridges of broken blocks where floes meet, great bergs frozen in. Ours: the chain,
// the planes, the line, the hut found four times. Public domain: none used. Brought in (section 181): one passage of
// the part file, named in its BROUGHT IN line at its head (three.js r170's filmic tone fit, MIT).
import * as THREE from 'three';
import { makePath, makeRng, hashSeed, clamp, lerp, smoothstep } from '../kit/core.js';
import { PLANES, HW, FLOOR_Y, eyePlace, HUT, HUTS, hutPoint, hutRoofPlan, hutTopAt, JETTY_PLAN, FENDER, CLOUDS, CLOUD_WOB, RING_V, RING_D, RING_DIR, RING_C, KIND, Bld, makeKit, buildHut, buildJetty, buildBoat, wingedGeo, lin, feed, SUN } from '../parts/boathouse-full-of-morning.js';

const RAD = Math.PI / 180;
// the unit heading of a compass bearing in the plan (x, z), and the direction to its right
const head = (b) => [Math.sin(b * RAD), -Math.cos(b * RAD)];
const right = (b) => [Math.cos(b * RAD), Math.sin(b * RAD)];

// ---------------------------------------------------------------------------------------------------------------------
// THE LINE. Straights and arcs of circles, laid by the brief's figures and handed to the engine's spline as points a
// few metres apart; three points stand on each straight either side of a plane, so the line passes each plane square.
// THE PACE IS EACH PLACE'S OWN, the brief's for it (round three b, R4), eased over 20 m either side of a plane: the
// lake's still morning water at 13 m/s; the garden, climbing and over its hedges, at 17; the open sea, low and long, at
// 17.5; the pack ice and the last hut at 12, the slowest, for the end. The flight's length falls from the places' plans.
// ---------------------------------------------------------------------------------------------------------------------
const SPEED = [13, 17, 17.5, 12];
// THE LINE'S END: the middle of the last hut's door, HUT.mid over the hut's water line (round three c: read off the hut)
const LAST = hutPoint(3, [0, HUT.mid, 0]);
// THE WAY OUT'S SHAPE, the engine's rectangle about the line's end: as wide as the doorway, and as high as twice the
// line's end's height over the doorway's foot (HUT.foot), so that its foot stands on the doorway's; top: its head
// over the box's water line
const WAYOUT = { width: 2 * HUT.r, height: 2 * (HUT.mid - HUT.foot), top: 2 * HUT.mid - HUT.foot };
// THE LINE'S PLAN, drawn with straights and arcs from a point and a bearing (a point every 6 m or so). ops: ['go', m],
// ['turn', bearing, radius] (to the right when the bearing grows), and exactly two ['free'] straights whose lengths
// are solved so that the plan ends on the given point (a plan whose free straight comes out shorter than nothing does
// not close, and the build stops). Returns [[x, z, metres along], ...], and in .ops each op's metres from and to (at0,
// at1), its bearings (b0, b1) and, for a curve, its circle's middle c, radius R and hand sg (1 right, -1 left).
function drawPlan(x0, z0, b0, ops, end) {
  const run = (fa, fb) => {
    let x = x0, z = z0, b = b0, len = 0, nf = 0;
    const P = [[x, z, 0]], put = (nx, nz, ds) => { x = nx; z = nz; len += ds; P.push([x, z, len]); };
    const go = (m) => { if (m < 0.01) return; const n = Math.max(1, Math.round(m / 6.5)), h = head(b); for (let i = 0; i < n; i++) put(x + h[0] * m / n, z + h[1] * m / n, m / n); };
    P.ops = [];
    for (const op of ops) {
      const at0 = len, bs = b, rec = { at0, b0: bs };
      if (op[0] === 'go') go(op[1]);
      else if (op[0] === 'free') go(nf++ ? fb : fa);
      else {
        const b1 = op[1], R = op[2], sg = Math.sign(b1 - b), arcL = Math.abs(b1 - b) * RAD * R, n = Math.max(1, Math.round(arcL / 6)), r0 = right(b), cx = x + sg * R * r0[0], cz = z + sg * R * r0[1];
        for (let i = 1; i <= n; i++) { const r = right(bs + (b1 - bs) * i / n); put(cx - sg * R * r[0], cz - sg * R * r[1], arcL / n); }
        b = b1;
        Object.assign(rec, { c: [cx, cz], R, sg });
      }
      P.ops.push(Object.assign(rec, { at1: len, b1: b }));
    }
    return P;
  };
  if (!end) return run(0, 0);
  const e = (P) => P[P.length - 1], p0 = e(run(0, 0)), pa = e(run(1, 0)), pb = e(run(0, 1));
  const ax = pa[0] - p0[0], az = pa[1] - p0[1], bx = pb[0] - p0[0], bz = pb[1] - p0[1], rx = end[0] - p0[0], rz = end[1] - p0[1], det = ax * bz - az * bx;
  const fa = (rx * bz - rz * bx) / det, fb = (ax * rz - az * rx) / det;
  if (!(fa >= 0 && fb >= 0)) throw new Error(`boathouse-full-of-morning: a plan's free straight comes out ${Math.min(fa, fb).toFixed(2)} m: it does not close`);
  return run(fa, fb);
}
// the lens's height along a place's part of the line: straight between the knots [metres, y], rounded over 8 m
function heightOf(knots) {
  const lin1 = (d) => { if (d <= knots[0][0]) return knots[0][1]; for (let i = 1; i < knots.length; i++) if (d <= knots[i][0]) return lerp(knots[i - 1][1], knots[i][1], (d - knots[i - 1][0]) / (knots[i][0] - knots[i - 1][0])); return knots[knots.length - 1][1]; };
  return (d) => { let sum = 0; for (let i = -4; i <= 4; i++) sum += lin1(d + i); return sum / 9; };
}
// RULING 9'S STRIP (the owner's ruling 9: from the sea's last metres the last hut is seen through the islet hut's door):
// the sight from plane three's middle to 5 m short of the last hut's door, in plan; SIGHT_B its bearing (about 154).
// sightOff(x, z, clMax): how far along that sight a point stands (cl, 0 at the plane and 1 at its end, clamped from 0
// to clMax) and how far it stands off it (lat). The strip is 3.4 m plus 7 m for every whole run either side of it.
const SIGHT0 = [PLANES[3].c[0], PLANES[3].c[2]], SIGHTD = [LAST[0] - SIGHT0[0], LAST[2] - 5 - SIGHT0[1]], SIGHT_L2 = SIGHTD[0] * SIGHTD[0] + SIGHTD[1] * SIGHTD[1];
const SIGHT_B = Math.atan2(SIGHTD[0], -SIGHTD[1]) / RAD;
function sightOff(x, z, clMax) {
  const cl = clamp(((x - SIGHT0[0]) * SIGHTD[0] + (z - SIGHT0[1]) * SIGHTD[1]) / SIGHT_L2, 0, clMax);
  return { cl, lat: Math.hypot(x - SIGHT0[0] - SIGHTD[0] * cl, z - SIGHT0[1] - SIGHTD[1] * cl) };
}
// THE STARS' PLAN (round three b; the reader's T3, the auditor's R4): 16 m straight on the lone doorway's own bearing
// (135), over the crag it stands on; a left curve that turns the line 45 degrees off ruling 9's sight (to SIGHT_B - 45,
// about 109), so that the line leaves that sight and runs east-south-east along the north face of the berg massif;
// a right curve round the massif's east end to bearing 225; a left curve square to the last hut's door (175); every
// curve of radius 30. The run along the face and the last straight are solved, so that the plan ends at the door: the
// stretch's length falls from the doorway, the massif's end and the hut.
const STARS_PLAN = [['go', 16], ['turn', SIGHT_B - 45, 30], ['free'], ['turn', 225, 30], ['turn', 175, 30], ['free']];
const STARS_LINE = drawPlan(SIGHT0[0], SIGHT0[1], 135, STARS_PLAN, [LAST[0], LAST[2]]);
// the sea's plan (the harbour's moles are laid along its first bend)
const SEA_PLAN = [['go', 20], ['turn', 36, 70], ['free'], ['turn', 14, 70], ['free'], ['turn', 135, 46], ['go', 22]];
// THE HARBOUR'S MOUTH: where the channel's first bend ends (the slip's straight and the bend's arc), metres from the sea
// gate. Both moles end there, their pierheads square across the channel, and the open sea begins.
const MOUTH = SEA_PLAN[0][1] + SEA_PLAN[1][1] * RAD * SEA_PLAN[1][2];
// THE GARDEN'S CLIMB (round three b, T1): from the canal's first bend, where the line leaves the canal's axis, the
// line climbs at one in six; THE CLIMB'S HEAD is the first metre from which the eye sees over the tall hedge's top to
// the round pool in the middle of the second court (courtSeen), and from there the line holds that height until its
// long slant down. So the climb's head stands where the hedge's height and place put it. (At build time: layLine, which
// hands the climb's foot, head and height on with the line's points, as .climb.)
const CLIMB_GRADE = 1 / 6;
// whether the sight from a point to the round pool's middle passes over the tall hedge's top (a point beyond the hedge
// sees the court)
function courtSeen(x, y, z) {
  if (z <= GD.tallZ) return true;
  const k = (z - GD.tallZ) / (z - GD.pool[1]);
  return y * (1 - k) > GD.tallH;
}
// a plan's point at a metre along it: [x, z, bearing] (past its end its last bearing runs on)
function planAt(P, m) {
  const L = P[P.length - 1][2];
  if (m >= L) { const b = P.ops ? P.ops[P.ops.length - 1].b1 : 0, h = head(b), q = P[P.length - 1]; return [q[0] + h[0] * (m - L), q[1] + h[1] * (m - L), b]; }
  let i = 1; while (i < P.length - 1 && P[i][2] < m) i++;
  const A = P[i - 1], B = P[i], k = clamp((m - A[2]) / (B[2] - A[2]), 0, 1);
  return [A[0] + (B[0] - A[0]) * k, A[1] + (B[1] - A[1]) * k, Math.atan2(B[0] - A[0], -(B[1] - A[1])) / RAD];
}
// ROUND TWO'S LINE (the lead's note of 15 Oct, sections A to D and G). The three planes are passed square, at the
// middles of their arches, 2.2 m over each hut's water line.
function layLine() {
  const pts = [], P1 = PLANES[1].c, P2 = PLANES[2].c, P3 = PLANES[3].c;
  const lay = (plan, yOf, skipFirst, endY) => { for (let i = skipFirst ? 1 : 0; i < plan.length; i++) pts.push([plan[i][0], i === plan.length - 1 && endY != null ? endY : yOf(plan[i][2]), plan[i][1]]); };
  // LAKE, 78 m: 19 m on bearing 335 from out on the water south-east of the hut (its jetty on the near side), a right curve of radius 90 to north, 20 m straight north into plane one (drawn from the door backwards)
  const lakeBack = drawPlan(P1[0], P1[2], 180, [['go', 20], ['turn', 155, 90], ['go', 19]]).reverse(), lakeLen = lakeBack[0][2];
  lay(lakeBack.map((q) => [q[0], q[1], lakeLen - q[2]]), heightOf([[0, 2.4], [40, 2.2], [lakeLen, 2.2]]), false, P1[1]);
  // GARDEN, about 236 m: north up the canal; a right curve out to the east past the great basin, climbing (see
  // CLIMB_GRADE); a long left curve round to the north-west, high and level at the climb's head's height, over the
  // tall hedge; a straight slant down
  // toward the long basin on bearing 306 (the garden hut seen three-quarter, door and east flank); a right curve to
  // north; 32 m straight down the cherry avenue, over the long basin, into plane two
  const gPlan = drawPlan(P1[0], P1[2], 0, [['go', 20], ['turn', 46, 45], ['free'], ['turn', -54, 42], ['free'], ['turn', 0, 45], ['go', 32]], [P2[0], P2[2]]), gLen = gPlan[gPlan.length - 1][2];
  const cFoot = gPlan.ops[0].at1, climbY = (m) => 2.2 + (m - cFoot) * CLIMB_GRADE;
  let cHead = cFoot;
  while (cHead < gLen) { const q = planAt(gPlan, cHead); if (courtSeen(q[0], climbY(cHead), q[1])) break; cHead += 0.1; }
  pts.climb = { foot: cFoot, head: cHead, y: climbY(cHead) };
  lay(gPlan, heightOf([[0, 2.2], [cFoot, 2.2], [cHead, climbY(cHead)], [gLen - 98, climbY(cHead)], [gLen - 90, 15.8], [gLen - 36, 5.4], [gLen - 20, 3.9], [gLen - 9, 3.2], [gLen, 3.2]]), true, P2[1]);
  // SEA, 219 m, LOW (the lead's G3: 2.2 to 4 m over the water, which lies at y -1): 20 m north down the slip; a
  // right curve of radius 70 to bearing 36 along the harbour's bent channel and out between the pierheads (the low sun
  // and the islet's hut ahead); a left curve back to bearing 14 over the open sea, past the home-coming boat at her
  // buoy and the stack on the reef at that curve's apex; THE HOOK, a right curve of radius 46 round to bearing 135 (the
  // low sun swings away to the left; the hut's door comes round); 22 m straight into plane three
  const sPlan = drawPlan(P2[0], P2[2], 0, SEA_PLAN, [P3[0], P3[2]]), sLen = sPlan[sPlan.length - 1][2];
  lay(sPlan, heightOf([[0, 3.2], [8, 3.0], [30, 2.2], [70, 2.0], [110, 2.4], [150, 2.6], [sLen - 40, 1.8], [sLen - 16, 1.2], [sLen, 1.2]]), true, P3[1]);
  // STARS (see STARS_PLAN; its length falls from its places): out of the lone doorway, sinking over the crag to 7.5 m
  // over the ice by the middle of the run along THE BERG MASSIF's north face (the massif stands between the line and
  // the last hut), and 7 m as the right curve round its east end begins; up to 12.5 m over the ice at that curve's
  // middle (the hut comes into view on the right there, in its floe, over the ice between); down to the door's own
  // height by the last straight's first metre, and level from there to the way out. The law leaves room for the rise
  // (see the head: there the line is still north of plane two's plane), and THE BUILD TESTS IT: wherever the stars'
  // line stands south of that plane it stays at least a metre under the floor plane.
  const tPlan = STARS_LINE, tLen = tPlan[tPlan.length - 1][2], tO = tPlan.ops, ICE = PLAIN_Y;
  const tY = heightOf([[0, 1.2], [8, 0.9], [(tO[2].at0 + tO[2].at1) / 2, ICE + 7.5], [tO[3].at0, ICE + 7.0], [(tO[3].at0 + tO[3].at1) / 2, ICE + 12.5], [tO[5].at0, LAST[1]], [tLen, LAST[1]]]);
  for (const q of tPlan) if (q[1] > PLANES[2].c[2] - 1 && tY(q[2]) > FLOOR_Y - 1) throw new Error(`boathouse-full-of-morning: the stars' line stands ${(tY(q[2]) - FLOOR_Y).toFixed(2)} m over the floor plane south of plane two's plane, ${q[2].toFixed(1)} m out`);
  lay(tPlan, tY, true, LAST[1]);
  return pts;
}

// ---------------------------------------------------------------------------------------------------------------------
// SMALL TOOLS OF THE BUILD. The land of every place is the same on every seed: its relief comes from this fixed noise,
// never from the seed's.
// ---------------------------------------------------------------------------------------------------------------------
// (a lattice hash with constants of this world's own choosing)
const hsh = (i, j) => { const s = Math.sin(i * 83.47 + j * 217.63) * 35917.823; return s - Math.floor(s); };
function vnC(x, z) {
  const i = Math.floor(x), j = Math.floor(z);
  let fx = x - i, fz = z - j;
  fx = fx * fx * (3 - 2 * fx); fz = fz * fz * (3 - 2 * fz);
  return lerp(lerp(hsh(i, j), hsh(i + 1, j), fx), lerp(hsh(i, j + 1), hsh(i + 1, j + 1), fx), fz);
}
function fbmC(x, z, oct = 4) {
  let a = 0.5, s = 0;
  for (let o = 0; o < oct; o++) { s += a * vnC(x, z); x = x * 2.03 + 11.7; z = z * 2.03 + 5.1; a *= 0.5; }
  return s;
}
const M4 = () => new THREE.Matrix4();
// a fixed stream of numbers for things that are the same on every seed (the kit's own generator, begun from a word;
// it never reads the seed)
const fixedRng = (word) => makeRng(hashSeed('boathouse-full-of-morning/' + word));
const place = (x, y, z, ry = 0, s = 1) => M4().makeTranslation(x, y, z).multiply(M4().makeRotationY(ry)).multiply(M4().makeScale(s, s, s));
// a land in rings about (cx, cz): rings at the radii rs, seg spokes; hOf(x, z) its height; paint(b, x, z, h) sets the colour
function ringLand(b, cx, cz, rs, seg, hOf, paint) {
  const base = b.P.length / 3, e = 1.5;
  for (let j = 0; j < rs.length; j++) for (let i = 0; i <= seg; i++) {
    const a = i / seg * Math.PI * 2, x = cx + Math.cos(a) * rs[j], z = cz + Math.sin(a) * rs[j], h = hOf(x, z);
    const gx = (hOf(x + e, z) - hOf(x - e, z)) / (2 * e), gz = (hOf(x, z + e) - hOf(x, z - e)) / (2 * e), nl = Math.hypot(gx, 1, gz);
    paint(b, x, z, h);
    b.v(x, h, z, -gx / nl, 1 / nl, -gz / nl, x, z);
  }
  for (let j = 0; j < rs.length - 1; j++) for (let i = 0; i < seg; i++) { const k = base + j * (seg + 1) + i; b.I.push(k, k + 1, k + seg + 2, k, k + seg + 2, k + seg + 1); }
  return b;
}
// a level sheet of rings about (cx, cz) at height y (a water, a plain)
function ringSheet(b, cx, cz, rs, seg, y) {
  const base = b.P.length / 3;
  for (let j = 0; j < rs.length; j++) for (let i = 0; i <= seg; i++) { const a = i / seg * Math.PI * 2, x = cx + Math.cos(a) * rs[j], z = cz + Math.sin(a) * rs[j]; b.v(x, y, z, 0, 1, 0, x, z); }
  for (let j = 0; j < rs.length - 1; j++) for (let i = 0; i < seg; i++) { const k = base + j * (seg + 1) + i; b.I.push(k, k + 1, k + seg + 2, k, k + seg + 2, k + seg + 1); }
  return b;
}
const geom = (n, r0, r1, k = 0) => { const out = []; for (let i = 0; i <= n; i++) out.push(k ? r0 + (r1 - r0) * Math.pow(i / n, k) : r0 * Math.pow(r1 / r0, i / n)); return out; };

// A FLOCK: winged things on closed courses of the clock (never begun by the visitor's coming). Each course: c (middle),
// rx, rz (reach), w (turns of the angle a second), ph, bob, size, eight (a figure of eight instead of a ring).
const _f = new THREE.Vector3(), _r = new THREE.Vector3(), _u = new THREE.Vector3(), _m = new THREE.Matrix4();
export function coursePos(c, t, out) {
  const a = c.w * t + c.ph;
  // (a ring turned in the plan: tilt is the angle of its long axis)
  if (c.tilt !== undefined) { const ct = Math.cos(c.tilt), st = Math.sin(c.tilt), u = c.rx * Math.cos(a), v = c.rz * Math.sin(a); return out.set(c.c[0] + ct * u - st * v, c.c[1] + c.bob * Math.sin(a * 1.7 + c.ph), c.c[2] + st * u + ct * v); }
  if (c.eight) return out.set(c.c[0] + c.rx * Math.sin(a), c.c[1] + c.bob * Math.sin(a * 1.7 + c.ph), c.c[2] + c.rz * Math.sin(2 * a) * 0.5);
  return out.set(c.c[0] + c.rx * Math.cos(a), c.c[1] + c.bob * Math.sin(a * 1.7 + c.ph), c.c[2] + c.rz * Math.sin(a));
}
// a course dealt again until the whole of it (every phase) keeps 2.7 m and its own span from the line in its place
// (far: a greater distance asked of it: the butterflies keep 6.2 m, the lead's B5)
function dealCourse(E, k, make) { for (let i = 0; i < 24; i++) { const c = make(); if (E.courseClear(k, c, Math.max(2.7 + 1.4 * (c.size || 0), c.far || 0))) return c; } return null; }
function flock(E, placeNo, geo, courses, name) {
  if (!courses.length) return;
  const m = new THREE.InstancedMesh(geo, E.kit.bird[placeNo], courses.length);
  const pa = new THREE.Vector3(), pb = new THREE.Vector3();
  courses.forEach((c, i) => m.setColorAt(i, _col.setRGB(c.tint ?? 1, c.beatPh ?? (i * 0.37) % 1, (c.beat ?? 6) / 20)));
  m.instanceColor.needsUpdate = true;
  m.frustumCulled = false; m.name = name; m.userData.kind = 'body'; m.userData.courses = courses;
  const tick = (dt, t) => {
    for (let i = 0; i < courses.length; i++) {
      const c = courses[i];
      coursePos(c, t, pa); coursePos(c, t + 0.06, pb);
      _f.subVectors(pb, pa).normalize(); _r.set(_f.z, 0, -_f.x).normalize(); _u.crossVectors(_f, _r);
      _m.makeBasis(_r, _u, _f).scale(pb.set(c.size, c.size, c.size)).setPosition(pa);
      m.setMatrixAt(i, _m);
    }
    m.instanceMatrix.needsUpdate = true;
  };
  tick(0, 0);
  E.tick.push(tick);
  E.G[placeNo].add(m);
  return m;
}

// THE LAKE'S LAND. The lake lies about (0, 165): about 460 m east to west, 340 m north to south; the hut stands at the
// middle of its north shore with the water running in under it. Wooded hills rise all round in four layers; due north,
// behind the hut, they stand lower and farther, so that the afterglow comes down to the hut's roof.
const LAKE_C = [0, 165];
function lakeShoreD(x, z) {
  const dx = x - LAKE_C[0], dz = z - LAKE_C[1], th = Math.atan2(dz, dx);
  const k = 1 + 0.10 * Math.sin(2 * th + 0.7) + 0.07 * Math.sin(3 * th + 2.1) + 0.035 * Math.sin(7 * th + 0.4);
  const rho = Math.hypot(dx / 230, dz / 179);
  return (rho / k - 1) * 185;
}
// the shore's distance from the lake's middle along the bearing th, and the same at d metres from the shore
const lakeShoreR = (th, d = 0) => {
  const k = 1 + 0.10 * Math.sin(2 * th + 0.7) + 0.07 * Math.sin(3 * th + 2.1) + 0.035 * Math.sin(7 * th + 0.4);
  return (d / 185 + 1) * k / Math.hypot(Math.cos(th) / 230, Math.sin(th) / 179);
};
const RIDGE = { D: [50, 140, 280, 470, 760], W: [70, 110, 150, 210, 300], A: [15, 28, 46, 68, 96] };
function lakeH(x, z) {
  const d = lakeShoreD(x, z);
  if (d < 0) return Math.max(-2.2, d * 0.22);
  const th = Math.atan2(z - LAKE_C[1], x - LAKE_C[0]);
  // due north (th = -90 degrees) the hills stand lower, so that the afterglow comes down behind the hut
  const north = Math.exp(-Math.pow((th + Math.PI / 2) / 0.75, 2));
  let h = 0.35 * smoothstep(0, 5, d) + 0.011 * Math.min(d, 60) + 0.004 * Math.max(0, d - 60);
  for (let i = 0; i < 5; i++) {
    const t = (d - RIDGE.D[i]) / RIDGE.W[i];
    if (t <= 0) continue;
    const bump = t < 0.5 ? smoothstep(0, 0.5, t) : 1 - 0.5 * smoothstep(0.5, 1.0, t);
    const n = 0.5 + 1.0 * fbmC(x * 0.006 * (1 + 0.25 * i) + 13 * i, z * 0.006 * (1 + 0.25 * i) + 7 * i, 3);
    h = Math.max(h, RIDGE.A[i] * bump * n * (1 - (i < 4 ? 0.9 : 0.55) * north));
  }
  // the woods' tops
  return h + 2.6 * (vnC(x * 0.09, z * 0.09) - 0.5) * smoothstep(7, 18, h);
}
// a land in rings that follow a shore: sOf(th, d) the distance from (cx, cz) at d metres from the shore
// (built in steps: a yield after every second ring; the vertices come in the same order, the faces after them)
async function shoreLand(ctx, b, cx, cz, ds, seg, sOf, hOf, paint) {
  const base = b.P.length / 3, e = 1.5;
  for (let j = 0; j < ds.length; j++) {
    for (let i = 0; i <= seg; i++) {
      const a = (i % seg) / seg * Math.PI * 2, s = sOf(a, ds[j]), x = cx + Math.cos(a) * s, z = cz + Math.sin(a) * s, h = hOf(x, z);
      const gx = (hOf(x + e, z) - hOf(x - e, z)) / (2 * e), gz = (hOf(x, z + e) - hOf(x, z - e)) / (2 * e), nl = Math.hypot(gx, 1, gz);
      paint(b, x, z, h);
      b.v(x, h, z, -gx / nl, 1 / nl, -gz / nl, x, z);
    }
    if (j % 2 === 1) await ctx.yield();
  }
  for (let j = 0; j < ds.length - 1; j++) for (let i = 0; i < seg; i++) { const k = base + j * (seg + 1) + i; b.I.push(k, k + 1, k + seg + 2, k, k + seg + 2, k + seg + 1); }
  return b;
}

// THE SEA'S FIXED THINGS that both the water's shader and the builders read: the islet, the sea stacks (x, z, radius at
// the water, height), the moles. The same on every seed.
// THE SEA'S FIXED THINGS (round two). The sea lies at y -1 (SEA_Y). THE ISLET: a rock about (120.6, -296.2), its shore
// about 24 m from that middle, running in and out; THE ISLET'S HUT stands at its north-west water's edge in a cove cut
// out of the rock (in the hut's own frame the cove is all that lies beside and before x -6.3, z -12.2: the rock rises
// behind the hut and on its north-east side, the jetty's side lies open to the sea). THE STACKS: three far ones out at
// sea, and THE NEAR STACK, a reef the line bends round just out of the harbour's mouth (NEAR_STACK, below).
// (the harbour wall's measures, see harbourWall)
const WALL = { x0: -5, x1: 215, z: -208.6, top: 10.5, bays: 16, quayZ: -212.0, quayY: 0.7, stairs: [2, 9], nets: [5, 12] };
const SEA_Y = -1, ISLET = [120.6, -296.2], ISLET_R = 24, COVE = [-6.3, -12.2];
const FAR_STACKS = [[150, -452, 9, 31], [236, -372, 7, 22], [-74, -468, 8, 27]];
const isletLobe = (a) => 1 + 0.10 * Math.sin(3 * a + 1.0) + 0.07 * Math.sin(5 * a + 2.3) + 0.04 * Math.sin(8 * a + 0.7);
// the islet's hut frame: (x, z) of the plan -> (across, along) of the hut (its door looks toward +along)
const toHut2 = (x, z) => { const dx = x - HUTS[2].o[0], dz = z - HUTS[2].o[2]; return [-Math.SQRT1_2 * dx + Math.SQRT1_2 * dz, -Math.SQRT1_2 * dx - Math.SQRT1_2 * dz]; };
// how far inside the islet's rock a point of the plan lies (metres; negative: in the sea)
function isletIn(x, z) {
  const dx = x - ISLET[0], dz = z - ISLET[1], base = ISLET_R * isletLobe(Math.atan2(dz, dx)) - Math.hypot(dx, dz), q = toHut2(x, z);
  const cx = q[0] - COVE[0], cz = q[1] - COVE[1], cove = cx > 0 && cz > 0 ? -Math.min(cx, cz) : Math.hypot(Math.max(-cx, 0), Math.max(-cz, 0));
  const w = 0.9 * Math.sin(0.9 * x + 1.3) * Math.sin(0.8 * z + 0.4) + 0.5 * Math.sin(2.1 * x - 1.7 * z);
  return Math.min(base + w, cove + 0.45 * w);
}
// the rock shelf the islet's hut stands on (in the hut's frame: under its body, its door's end and its jetty over water)
const shelfIn = (q) => Math.min(5.2 - q[0], -0.8 - q[1]);
// THE HARBOUR'S CHANNEL: the sea's plan (the first 75 m of it lie between the moles), as points [x, z, metres]
const SEA_PTS = (() => drawPlan(PLANES[2].c[0], PLANES[2].c[2], 0, SEA_PLAN, [PLANES[3].c[0], PLANES[3].c[2]]))();
// the channel at s metres from the sea gate: its point, its heading (hx, hz) and the direction to its right (rx, rz)
function seaAt(sm) {
  let i = 1;
  while (i < SEA_PTS.length - 1 && SEA_PTS[i][2] < sm) i++;
  const A = SEA_PTS[i - 1], B = SEA_PTS[i], k = (sm - A[2]) / Math.max(1e-6, B[2] - A[2]), hl = Math.hypot(B[0] - A[0], B[1] - A[1]) || 1, hx = (B[0] - A[0]) / hl, hz = (B[1] - A[1]) / hl;
  return { x: A[0] + (B[0] - A[0]) * k, z: A[1] + (B[1] - A[1]) * k, hx, hz, rx: -hz, rz: hx };
}
// the moles: [side (-1 west, 1 east), the metre of the channel at which its pierhead stands: both at the harbour's
// mouth]; their middle lines stand 15 m from the channel's (so their faces 13 m), each 4 m wide
const MOLES = [[-1, MOUTH], [1, MOUTH]], MOLE_OFF = 15;
const moleAt = (side, sm) => { const q = seaAt(sm); return [q.x + side * q.rx * MOLE_OFF, q.z + side * q.rz * MOLE_OFF]; };
// THE CURVE BACK TO BEARING 14 (SEA_PLAN's second turn, just out of the harbour's mouth): the metres of the channel at
// which it begins and ends, read off the plan's own points, and its apex, the metre midway, where the line's bearing
// is the mean of the curve's two (25)
const CURVE_14 = (() => {
  const brg = (i) => (Math.atan2(SEA_PTS[i + 1][0] - SEA_PTS[i][0], SEA_PTS[i][1] - SEA_PTS[i + 1][1]) / RAD + 360) % 360;
  let a = -1, e = -1;
  for (let i = 0; i < SEA_PTS.length - 1 && e < 0; i++) {
    if (SEA_PTS[i][2] < MOUTH - 1e-6) continue;
    const b = brg(i);
    if (a < 0 && b < SEA_PLAN[1][1] - 0.01) a = SEA_PTS[i][2];
    if (a >= 0 && b <= SEA_PLAN[3][1] + 0.01) e = SEA_PTS[i][2];
  }
  const m = (a + e) / 2, q = seaAt(m), bb = (SEA_PLAN[1][1] + SEA_PLAN[3][1]) / 2 * RAD;
  return { from: a, to: e, apex: m, x: q.x, z: q.z, rx: Math.cos(bb), rz: Math.sin(bb) };
})();
// THE NEAR STACK (round three b, the lead's S2): the reef the line bends round. It stands on the curve's inside, the
// line's left, on the apex's own radius, its foot (4 m in radius) 5 m from the line: the law's 2.6 m of clear air and
// the crag's own reach beyond its foot (its facets stand up to 1.4 m proud of it; the build tests the 2.6 m); 11 m high
export const NEAR_STACK = [CURVE_14.x - CURVE_14.rx * (5 + 4), CURVE_14.z - CURVE_14.rz * (5 + 4), 4, 11];
const STACKS = FAR_STACKS.concat([NEAR_STACK]);
// THE HOME-COMING BOAT'S MOORING (round three b, the lead's S2): a buoy at the same apex, 16 m to the line's right,
// outside the fairway's east edge (the fairway runs 13 m either side of the line between the pierheads); the boat lies
// 4 m downwind of it with her bow to it, her sails hung to dry
export const HOME_BUOY = [CURVE_14.x + CURVE_14.rx * 16, CURVE_14.z + CURVE_14.rz * 16];
const NWAKE = 12;

// ---------------------------------------------------------------------------------------------------------------------
// WATER (lake, canal and basins, sea): our own opaque shader, through the one helper like everything else: a soft
// mirror of its own place's sky and of the dark land round it, ripples on the clock, its own sun's glints. THE MORNING'S
// PATH ON THE LAKE is written here as a fixed light of the lake's water: a function of where the water is and of the
// ripples' clock alone. It never reads the eye, so it cannot grow, swing or warm as the eye nears.
// ---------------------------------------------------------------------------------------------------------------------
const WATER_DEFS = /* glsl */`
vec2 ripG(vec2 q, float t){
  const float e = 0.35;
  vec2 o = vec2(t, 0.6 * t), o2 = vec2(-0.7 * t, t);
  float a = fbm2(q + o), bx = fbm2(q + o + vec2(e, 0.0)), bz = fbm2(q + o + vec2(0.0, e));
  float a2 = vn(q * 3.1 + o2), bx2 = vn(q * 3.1 + o2 + vec2(e, 0.0)), bz2 = vn(q * 3.1 + o2 + vec2(0.0, e));
  return (vec2(bx - a, bz - a) + 0.35 * vec2(bx2 - a2, bz2 - a2)) / e;
}
// rings of rising fish (lake) and of falling drops (canal): cells of the plan, each with a ring that widens and dies
float rings(vec2 p, float cell, float keep, float life){
  vec2 ci = floor(p / cell), cf = p / cell - ci;
  float h = h21(ci + 31.7);
  if (h < keep) return 0.0;
  float ph = fract(uTime / (life * (2.0 + 3.0 * h21(ci + 5.1))) + h * 9.0);
  float r = ph * 0.34, d = length(cf - 0.5 - 0.12 * (vec2(h21(ci + 1.3), h21(ci + 2.9)) - 0.5));
  return sin((d - r) * 110.0) * smoothstep(0.035, 0.0, abs(d - r)) * (1.0 - ph) * smoothstep(0.0, 0.08, ph);
}
// the morning's path on the lake: from the door (plane one, x 0) toward the south for about 60 m, broken by the same
// ripples the water shows (gn: the ripples' slope, about -1 to 1)
vec3 morningPath(vec2 p, vec2 gn){
  float z = p.y;
  if (z < -0.5 || z > 72.0) return vec3(0.0);
  float w = 2.8 + 0.06 * z;
  float wob = (fbm2(vec2(p.x * 0.3, z * 0.5 - uTime * 0.3)) - 0.5) * (0.8 + 0.06 * z) + gn.x * 0.35;
  float core = smoothstep(w, 0.0, abs(p.x + wob)); core *= core;
  float along = smoothstep(68.0, 0.0, z);
  // broken into bright dashes lying across the path, close and whole by the door, sparse far out
  float n = 0.62 * fbm2(vec2(p.x * 0.8 + 0.5 * gn.x, z * 3.6 - uTime * 0.6)) + 0.38 * vn(vec2(p.x * 2.3, z * 9.0 - uTime * 1.1)) + 0.08 * gn.y;
  float th = 0.58 - 0.20 * along * along;
  float dash = smoothstep(th - 0.10, th + 0.10, n);
  float near = exp(-z / 7.0) * smoothstep(4.4, 1.0, abs(p.x)) * smoothstep(-0.5, 0.4, z);
  // and a faint spill on the water round the door's foot
  float spill = exp(-length(p) / 11.0) * smoothstep(-0.5, 1.5, z);
  // each ripple's face that looks toward the door carries the light, the face that looks away is dark
  float facet = 0.22 + 1.25 * clamp(0.5 + 1.5 * gn.y, 0.0, 1.0);
  return facet * (vec3(1.0, 0.74, 0.36) * (core * dash * (0.9 * exp(-z / 12.0) + 1.3 * smoothstep(72.0, 38.0, z)) + 0.08 * spill) + vec3(1.0, 0.78, 0.40) * near * (0.12 + 1.2 * dash));
}
// metres from a stretch of a line in the plan
float segD(vec2 p, vec2 a, vec2 b){ vec2 pa = p - a, ba = b - a; return length(pa - ba * clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0)); }
// metres from the harbour channel's middle line (the sea gate to the pierheads)
float harbourD(vec2 p){
  float d = 1e5;
  ${[0, 1, 2, 3].map((i) => { const a = seaAt(0.5 + i * 16.6), b = seaAt(0.5 + (i + 1) * 16.6); return `d = min(d, segD(p, vec2(${a.x.toFixed(2)}, ${a.z.toFixed(2)}), vec2(${b.x.toFixed(2)}, ${b.z.toFixed(2)})));`; }).join(' ')}
  return d;
}
// THE SEA. The long easy swell: two trains of waves coming in from the open sea, as a slope (metres a metre)
vec2 swellG(vec2 p){
  vec2 d1 = vec2(0.26, 0.966), d2 = vec2(-0.5, 0.866);
  float calm = smoothstep(4.0, -4.0, harbourD(p) - 13.0);
  return (d1 * 0.050 * cos(dot(p, d1) * 0.18 - uTime * 0.55) + d2 * 0.028 * cos(dot(p, d2) * 0.29 + 1.7 - uTime * 0.75)) * (1.0 - 0.75 * calm);
}
// foam, by place: metres from the nearest thing the sea breaks on (the moles and pierheads, the cliff's foot, the
// islet's shore, the stacks), the band breathing with the swell
float seaEdge(vec2 p){
  float d = 1e5;
  // the moles (each a bent line 4 m wide) and their round pierheads
  ${MOLES.map(([side, end]) => [0, 1, 2, 3].map((i) => { const a = moleAt(side, 0.5 + i * (end - 0.5) / 4), b = moleAt(side, 0.5 + (i + 1) * (end - 0.5) / 4); return `d = min(d, segD(p, vec2(${a[0].toFixed(2)}, ${a[1].toFixed(2)}), vec2(${b[0].toFixed(2)}, ${b[1].toFixed(2)})) - 2.0);`; }).join(' ') + ` d = min(d, length(p - vec2(${moleAt(side, end)[0].toFixed(2)}, ${moleAt(side, end)[1].toFixed(2)})) - 3.0);`).join('\n  ')}
  // the cliff's foot (not across the slip)
  d = min(d, -205.4 - p.y + 2.2 * step(abs(p.x + 22.0), 13.0));
  // the harbour wall's foot quay
  d = min(d, max(${WALL.quayZ.toFixed(1)} - p.y, max(${WALL.x0.toFixed(1)} - p.x, p.x - ${WALL.x1.toFixed(1)})));
  // the islet: its lobed shore, less the hut's cove
  vec2 qi = p - vec2(${ISLET[0].toFixed(1)}, ${ISLET[1].toFixed(1)});
  float ai = atan(qi.y, qi.x), lobe = 1.0 + 0.10 * sin(3.0 * ai + 1.0) + 0.07 * sin(5.0 * ai + 2.3) + 0.04 * sin(8.0 * ai + 0.7);
  vec2 qh = p - vec2(${HUTS[2].o[0].toFixed(1)}, ${HUTS[2].o[2].toFixed(1)});
  vec2 ch = vec2(-0.7071 * qh.x + 0.7071 * qh.y, -0.7071 * qh.x - 0.7071 * qh.y) - vec2(${COVE[0].toFixed(1)}, ${COVE[1].toFixed(1)});
  float cove = (ch.x > 0.0 && ch.y > 0.0) ? -min(ch.x, ch.y) : length(max(-ch, 0.0));
  float wob = 0.9 * sin(0.9 * p.x + 1.3) * sin(0.8 * p.y + 0.4) + 0.5 * sin(2.1 * p.x - 1.7 * p.y);
  d = min(d, -min(${ISLET_R.toFixed(1)} * lobe - length(qi) + wob, cove + 0.45 * wob));
  // the low shelf the hut stands on in the cove
  vec2 hh = ch + vec2(${COVE[0].toFixed(1)}, ${COVE[1].toFixed(1)});
  d = min(d, max(max(hh.x - 4.7, -6.6 - hh.x), max(hh.y + 1.3, -12.6 - hh.y)));
  ${STACKS.map((k) => `d = min(d, length(p - vec2(${k[0].toFixed(1)}, ${k[1].toFixed(1)})) - ${(k[2] + 0.5).toFixed(1)});`).join(' ')}
  return d;
}
// THE ROCKS' DARK IMAGE IN THE SEA: whether the mirrored sight line from a point of the water meets the islet or a
// stack (each taken as a dome: its middle, its reach, its height over the sea)
float rockImage(vec3 p, vec3 r){
  vec2 rd = normalize(r.xz + 1e-6);
  float ty = r.y / max(length(r.xz), 1e-4), hit = 0.0;
  ${[[ISLET[0], ISLET[1], 25, 12.5]].concat(STACKS.map((k) => [k[0] + 0.25 * k[2], k[1], k[2] * 0.95, k[3] + 1])).map((k) => `{ vec2 v = vec2(${k[0].toFixed(1)}, ${k[1].toFixed(1)}) - p.xz; float al = dot(v, rd), bb = (v.x * rd.y - v.y * rd.x) / ${k[2].toFixed(1)}; hit = max(hit, step(0.0, al) * smoothstep(0.03, -0.03, ty - ${k[3].toFixed(1)} * sqrt(max(1.0 - bb * bb, 0.0)) / max(al, 1.0))); }`).join('\n  ')}
  return hit;
}
// the wakes of the boats under way: each boat hands its place and heading to the water (x, z, heading's x and z)
uniform vec4 uWake[${NWAKE}];
float wakes(vec2 p){
  float f = 0.0;
  for (int i = 0; i < ${NWAKE}; i++) {
    vec4 b = uWake[i];
    vec2 v = p - b.xy;
    float wl = max(length(b.zw), 1e-4);
    vec2 hd = b.zw / wl;
    float al = -dot(v, hd), ac = abs(v.x * hd.y - v.y * hd.x);
    float arm = smoothstep(0.8 + 0.03 * al, 0.0, abs(ac - (1.0 + 0.24 * al)));
    float mid = smoothstep(1.3 + 0.04 * al, 0.2, ac) * exp(-max(al, 0.0) / 16.0);
    f = max(f, (0.75 * arm + mid) * smoothstep(70.0 * wl, 22.0 * wl, al) * smoothstep(-2.5, 0.5, al) * step(ac, 22.0));
  }
  return f;
}
// the path's bed: where on the lake the path of light lies, by place alone (1 on the path, 0 beside it and beyond it)
float pathBed(vec2 p){
  float z = p.y, w = 2.8 + 0.06 * z;
  return smoothstep(1.5 * w, 0.6 * w, abs(p.x)) * smoothstep(-0.5, 1.0, z) * smoothstep(72.0, 40.0, z);
}
`;
const WATER_BODY = /* glsl */`
  vec3 wv = vW - cameraPosition;
  float dist = length(wv), alpha = 1.0, airK = 1.0;
  vec3 dir = wv / max(dist, 1e-4);
  float lake = step(uPlace, 0.5), sea = step(1.5, uPlace) * step(uPlace, 2.5), gard = 1.0 - lake - sea;
  float sc = 1.7 * lake + 2.4 * gard + 0.33 * sea, amp = 0.11 * lake + 0.06 * gard + 0.42 * sea, sp = 0.3 * lake + 0.35 * gard + 0.35 * sea;
  float fw = max(fwidth(vW.x), fwidth(vW.z)) * sc;
  vec2 gr = ripG(vW.xz * sc, uTime * sp), gn = clamp(gr * 1.6, -1.0, 1.0);
  vec2 g = gr * amp * smoothstep(3.0, 0.3, fw);
  if (sea > 0.5) g += swellG(vW.xz);
  // rings: of rising fish on the lake; in the garden where the jets come down (two lines along the canal, the basin's ring and middle)
  float bd = length(vW.xz - vec2(0.0, -108.0));
  float fall = vW.z > -92.5 ? smoothstep(0.75, 0.25, abs(abs(vW.x) - 2.0)) : max(smoothstep(1.0, 0.3, abs(bd - 6.2)), smoothstep(3.2, 1.0, bd));
  g += vec2(1.0, 0.6) * rings(vW.xz, 13.0 * lake + 0.8 * gard + 40.0 * sea, 0.72 * lake + 0.1 * gard + 2.0 * sea, 3.0 * lake + 0.5 * gard + 1.0) * (0.5 * lake + 0.9 * gard * fall) * smoothstep(1.5, 0.2, fw);
  vec3 N = normalize(vec3(-g.x, 1.0, -g.y));
  vec3 r = reflect(dir, N);
  r.y = abs(r.y) + 0.004;
  r = normalize(r);
  vec3 mir = skyOf(uPlace, r, 0.004);
  // the land's dark image: hills round the lake, hedges and borders along the canal
  float az = atan(r.x, r.z + 1e-6);
  float azn = (abs(az) - 3.14159) / 0.75;
  float landH = lake * (0.035 + 0.09 * fbm2(vec2(az * 2.3, 1.0)) * (1.0 - 0.8 * exp(-azn * azn))) + gard * (0.20 + 0.25 * fbm2(vec2(az * 5.0, 3.0)));
  vec3 landC = lake * ${'vec3(' + feed('#121c3a', 0.8).join(', ') + ')'} + gard * mix(${'vec3(' + feed('#1c3c28').join(', ') + ')'}, ${'vec3(' + feed('#7cc04c', 0.7).join(', ') + ')'}, vn(vec2(az * 9.0, 2.0)));
  mir = mix(mir, landC, (1.0 - sea) * smoothstep(landH + 0.03, landH - 0.03, r.y) * (lake + 0.7 * gard));
  if (sea > 0.5) mir = mix(mir, vec3(0.040, 0.034, 0.045), 0.85 * rockImage(vW, r));
  float fres = 0.04 + 0.96 * pow(1.0 - clamp(dot(-dir, N), 0.0, 1.0), 5.0);
  // (the lake carries the afterglow's mirror to the foreground)
  fres = mix(fres, 1.0, 0.22 * lake);
  PL L = placeLight(uPlace);
  float sv = sunSeen(uPlace, vW);
  vec3 deep = lake * ${'vec3(' + feed('#0e1a3c', 0.75).join(', ') + ')'} + gard * ${'vec3(' + feed('#5c8ca8', 0.8).join(', ') + ')'} * (0.5 + 0.5 * sv) + sea * ${'vec3(' + feed('#28486c', 0.8).join(', ') + ')'};
  vec3 col = mix(deep, mir, fres);
  float sd = max(dot(r, L.sd), 0.0), s2 = sd * sd, s8 = s2 * s2 * s2 * s2, s64 = s8 * s8 * s8 * s8 * s8 * s8 * s8 * s8;
  col += L.sc * sv * (gard * 2.0 * s64 * s64 + sea * (0.9 * s64 + 0.35 * s8 * s8)) ;
  // PETALS ON THE CANAL: small pale flecks lying on the water, drifting slowly with the clock
  if (gard > 0.5 && (vW.z > -93.0 || vW.y > 0.6)) {
    vec2 pp = (vW.xz + vec2(uTime * 0.035, uTime * 0.012)) * 7.0, pi = floor(pp), pf = fract(pp) - 0.5;
    float ph = h21(pi), pk = step(0.972, ph) * smoothstep(0.34, 0.22, length(pf + 0.2 * (vec2(h21(pi + 3.0), h21(pi + 7.0)) - 0.5))) * smoothstep(0.12, 0.04, fw);
    col = mix(col, mix(vec3(0.95, 0.62, 0.68), vec3(0.98, 0.95, 0.90), step(0.5, h21(pi + 11.0))) * (L.sc * 0.24 * sv + L.sky * 0.9), pk);
  }
  // THE SEA'S FOAM: where it breaks (by place, breathing with the swell's clock) and in the wakes of the boats
  if (sea > 0.5) {
    float ed = seaEdge(vW.xz) + 0.9 * sin(dot(vW.xz, vec2(0.26, 0.966)) * 0.18 - uTime * 0.55);
    vec2 fp = vW.xz * 0.9 + vec2(uTime * 0.11, -uTime * 0.07);
    float lace = 0.6 * vn(fp) + 0.4 * vn(fp * 2.7 + 5.0);
    float foam = smoothstep(2.4, 0.2, ed) * smoothstep(0.25, 0.55, lace + 0.35 * smoothstep(1.4, 0.0, ed));
    foam = max(foam, smoothstep(9.0, 2.0, ed) * smoothstep(0.66, 0.76, lace) * 0.7);
    foam = max(foam, wakes(vW.xz) * smoothstep(0.30, 0.62, lace + 0.25));
    foam *= smoothstep(6.0, 1.5, fw);
    col = mix(col, (L.sc * 0.42 + L.sky * 1.5) * vec3(0.95, 0.95, 1.0), clamp(foam, 0.0, 1.0));
  }
  // THE PATH'S BED (the lead's ruling 7). Under the morning's path the water's mirror gives way, by place alone, to the
  // afterglow's image as the ripples' faces hold it for one fixed sight line from the south: so the sum of the poured
  // light and of the afterglow under it is the same from near and from far. Nothing here reads the eye.
  float pe = lake * pathBed(vW.xz);
  if (pe > 0.002) {
    vec3 rf = reflect(vec3(0.0, -0.0698, -0.9976), N);
    rf.y = abs(rf.y) + 0.004;
    col = mix(col, mix(deep, skyOf(uPlace, normalize(rf), 0.004), 0.55), pe);
  }
  col += lake * morningPath(vW.xz, gn);
  // THE SUNSET'S PATH ON THE LONG BASIN (round two): the sea's sunset poured out of the garden hut's door down the
  // still water, a fixed rose-gold light of the water's own place; and THE STARS' COLD LIGHT on the sea before the
  // islet hut's door. Neither reads the eye.
  if (gard > 0.5 && vW.y > 0.6) {
    vec2 pb = vW.xz - vec2(${PLANES[2].c[0].toFixed(1)}, ${PLANES[2].c[2].toFixed(1)});
    float peb = pathBed(pb * vec2(1.0, 1.5));
    vec3 rfb = reflect(vec3(0.0, -0.0698, -0.9976), N);
    rfb.y = abs(rfb.y) + 0.004;
    col = mix(col, mix(deep, skyOf(2.0, normalize(rfb), 0.004), 0.6), 0.6 * peb);
    col += morningPath(pb * vec2(1.0, 1.5), gn) * vec3(1.0, 0.80, 1.0) * 0.9;
  }
  if (sea > 0.5) {
    vec2 ps = vW.xz - vec2(${PLANES[3].c[0].toFixed(1)}, ${PLANES[3].c[2].toFixed(1)});
    vec2 ph3 = vec2(-0.7071 * ps.x + 0.7071 * ps.y, -0.7071 * ps.x - 0.7071 * ps.y);
    col += morningPath(ph3 * vec2(1.0, 2.6), gn).bgr * vec3(0.55, 0.62, 0.9) * 0.55;
  }
  col += deep * doorGlow(uPlace, vW, vec3(0.0, 1.0, 0.0)) * 0.6;
`;

// ---------------------------------------------------------------------------------------------------------------------
// PLACE 0, THE LAKE at the blue hour. Everything here belongs to the lake and to nothing else.
// ---------------------------------------------------------------------------------------------------------------------
const C_HILL = [0.28, 0.34, 0.40], C_MEADOW = [0.26, 0.38, 0.22], C_SHORE = [0.22, 0.22, 0.22];
async function buildLake(E) {
  const { kit, ctx } = E, g = E.G[0];
  // the far land: rings about the lake's middle, out to the hills' backs
  let b = new Bld();
  const paintLand = (bb, x, z, h) => {
    const d = lakeShoreD(x, z), k = smoothstep(4, 60, h);
    const c = [lerp(C_MEADOW[0], C_HILL[0], k), lerp(C_MEADOW[1], C_HILL[1], k), lerp(C_MEADOW[2], C_HILL[2], k)];
    const wet = smoothstep(1.6, 0.0, d);
    bb.c([lerp(c[0], C_SHORE[0], wet), lerp(c[1], C_SHORE[1], wet), lerp(c[2], C_SHORE[2], wet)], h > 6 ? KIND.HILL : KIND.TURF, 0.4);
  };
  await shoreLand(ctx, b, LAKE_C[0], LAKE_C[1], [-14, -5, -1.5, 0, 1.2, 2.6, 4.5, 7, 11, 17, 30, 50, 68, 85, 102, 120, 140, 168, 195, 222, 250, 280, 318, 355, 392, 430, 470, 522, 575, 627, 680, 760, 835, 910, 985, 1060, 1300, 1700], 300, lakeShoreR, lakeH, paintLand);
  const land = b.mesh(kit.solid[0], 'lake land');
  land.userData.kind = 'floor';
  g.add(land);
  await ctx.yield();
  // the water: one level sheet at y 0 (opaque: it hides what lies under it, the way out among it)
  b = new Bld();
  ringSheet(b, LAKE_C[0], LAKE_C[1], [0, 40, 90, 150, 230, 330, 460, 640], 72, 0);
  const water = b.mesh(E.water[0], 'lake water');
  water.userData.kind = 'floor';
  g.add(water);
  await ctx.yield();
  // THE BOX and its plank landing, with no lantern (no light stands beside the first box but its own lamp, whose slow
  // pulse begins on a phase dealt on a stream of its own): the box's own frame is the world's here (doorway's plane
  // z 0, water line y 0)
  b = new Bld();
  buildHut(b, { phase: E.named('lamp of the lake box')() });
  buildJetty(b, E.named('fenders of the lake hut'), false);
  const hut = b.mesh(kit.solid2[0], 'hut');
  hut.userData.kind = 'body';
  g.add(hut);
  await ctx.yield();
}
// instances of one geometry at the given matrices (and tints)
function instanced(geo, material, mats, tints, name) {
  const m = new THREE.InstancedMesh(geo, material, mats.length);
  for (let i = 0; i < mats.length; i++) { m.setMatrixAt(i, mats[i]); if (tints) m.setColorAt(i, tints[i]); }
  m.instanceMatrix.needsUpdate = true;
  if (tints) m.instanceColor.needsUpdate = true;
  m.name = name || '';
  m.computeBoundingSphere();
  return m;
}
const _col = new THREE.Color();
const tint = (r, g, b) => new THREE.Color(r, g, b);
// an alder: a leaning trunk, a few boughs, crowns of leaves that stir (its own frame: foot at the origin, leaning toward +x)
function alder(b, h, lean, rnd) {
  const top = [lean * h, h * 0.78, 0], bark = [0.20, 0.17, 0.14];
  const bump = (x, y, z) => vnC(x * 1.9 + 3, z * 1.9 + y * 1.3) - 0.5;
  const leaves = (x, y, z, r) => {
    for (let k = 0; k < 3; k++) {
      const q = 0.55 + 0.6 * rnd();
      b.c([0.11 + 0.05 * rnd(), 0.20 + 0.07 * rnd(), 0.10], KIND.LEAVES, 0, 0.10);
      b.blob(x + (rnd() - 0.5) * r * 1.5, y + (rnd() - 0.3) * r * 0.9, z + (rnd() - 0.5) * r * 1.5, r * q, r * q * 0.72, r * q, 8, 5, bump, 0.55, 0.22);
    }
  };
  b.c(bark, KIND.BARK);
  b.tube([[0, -0.3, 0], [lean * h * 0.2, h * 0.28, 0.1], [lean * h * 0.62, h * 0.56, 0], top], (t) => 0.20 * (1 - 0.7 * t), 6, (t) => 0.05 * t * t);
  for (const [t, side, len] of [[0.40, 0.9, 0.5], [0.52, -0.7, 0.55], [0.64, 0.5, 0.45], [0.74, -0.4, 0.4], [0.84, 0.2, 0.34]]) {
    const p0 = [lean * h * t, h * (0.2 + 0.52 * t), 0], p1 = [p0[0] + len * h * 0.55, p0[1] + len * h * 0.30, side * len * h * 0.55];
    b.c(bark, KIND.BARK);
    b.tube([p0, [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2 + 0.2, (p0[2] + p1[2]) / 2], p1], (q) => 0.085 * (1 - 0.6 * q), 5, (q) => 0.08 * q);
    leaves(p1[0], p1[1] + 0.15, p1[2], h * 0.15);
    leaves((p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2 + 0.5, (p0[2] + p1[2]) / 2, h * 0.11);
  }
  leaves(top[0], top[1] + h * 0.08, 0, h * 0.19);
}
// a spruce of the far shores: three skirts on a stem (its own frame: 1 m high)
function spruceGeo() {
  const b = new Bld();
  b.c([0.14, 0.11, 0.09], KIND.BARK);
  b.cyl(0, 0, 0.028, 0.02, 0, 0.24, 4, '');
  b.c([0.085, 0.135, 0.105], KIND.LEAVES);
  for (const [y0, y1, r0, r1] of [[0.15, 0.46, 0.195, 0.07], [0.35, 0.66, 0.15, 0.05], [0.55, 0.84, 0.105, 0.03], [0.74, 1.0, 0.065, 0.0]]) b.cyl(0, 0, r0, r1, y0, y1, 6, '');
  return b.geo();
}
async function buildLakeTrees(E) {
  const { kit, ctx } = E, g = E.G[0], rnd = E.rng.lake;
  // the alders by the box (the same on every seed): two lean over the water toward the doorway, others stand behind
  // them. (Round four: the west one stands 1.7 m farther out, at x -10.9, so that its crown's farthest reach toward
  // the box, 6.2 m, stays outside the box's plinth: the box's flank is a wall 14 m high, where the hut had a low eave.)
  const b = new Bld();
  const AL = [[-10.9, -2.6, 8.2, 0.34, -0.25], [11.4, -4.4, 7.4, 0.30, Math.PI + 0.35], [-15.5, -8.5, 9.5, 0.16, 0.6], [17.5, -9.5, 8.8, 0.14, 2.4], [-23, -12.5, 10.5, 0.12, -1.0], [25, -13, 9.6, 0.10, 3.6]];
  const fix = fixedRng('alders');
  for (const [x, z, h, lean, ry] of AL) { b.push(place(x, lakeH(x, z), z, ry)); alder(b, h, lean, fix); b.pop(); await ctx.yield(); }
  const am = b.mesh(kit.solid2[0], 'alders');
  am.userData.kind = 'body';
  g.add(am);
  await ctx.yield();
  // spruces on the first rises all round, none in the open strip due north of the hut (so the hut stands against the glow)
  const mats = [], tints = [], N = Math.round(440 * E.detail);
  for (let i = 0, tries = 0; i < N && tries < N * 12; tries++) {
    const th = rnd() * Math.PI * 2, d = 6 + 150 * Math.pow(rnd(), 1.6), r = lakeShoreR(th, d), x = LAKE_C[0] + Math.cos(th) * r, z = LAKE_C[1] + Math.sin(th) * r;
    const offN = Math.abs(Math.atan2(Math.sin(th + Math.PI / 2), Math.cos(th + Math.PI / 2)));
    if (offN < 0.5 || (offN < 0.75 && d < 45)) continue;
    if (vnC(x * 0.02 + 3, z * 0.02) < 0.38) continue;
    const s = (13 + 11 * rnd()) * (0.8 + 0.4 * vnC(x * 0.05, z * 0.05));
    mats.push(M4().makeTranslation(x, lakeH(x, z) - 0.3, z).multiply(M4().makeRotationY(rnd() * 6.3)).multiply(M4().makeScale(s * (0.75 + 0.3 * rnd()), s, s * (0.75 + 0.3 * rnd()))));
    const k = 0.75 + 0.5 * rnd();
    tints.push(tint(k, k, k));
    i++;
  }
  const sm = instanced(spruceGeo(), kit.solid2[0], mats, tints, 'spruces');
  sm.userData.kind = 'body';
  g.add(sm);
  await ctx.yield();
}
// a clump of reeds (its own frame: the water line at y 0), blades that sway, a few brown heads
function reedGeo(rnd) {
  const b = new Bld();
  for (let i = 0; i < 10; i++) {
    const a = rnd() * 6.283, r = 0.30 * Math.sqrt(rnd()), x = Math.cos(a) * r, z = Math.sin(a) * r, h = 1.45 + 0.95 * rnd(), la = rnd() * 6.283, lean = (0.05 + 0.16 * rnd()) * h;
    const tx = x + Math.cos(la) * lean, tz = z + Math.sin(la) * lean, w = 0.030 + 0.016 * rnd(), wa = rnd() * 3.14, wx = Math.cos(wa) * w, wz = Math.sin(wa) * w, sw = 0.05 * h;
    b.c([0.30 + 0.10 * rnd(), 0.40 + 0.10 * rnd(), 0.17], KIND.PLAIN);
    b.tri([x - wx, -0.4, z - wz], [x + wx, -0.4, z + wz], [tx, h, tz], [0, 0, sw]);
    if (i % 3 === 0) {
      b.c([0.22, 0.13, 0.07], KIND.PLAIN);
      const y0 = h * 0.80, y1 = h * 0.93, k0 = 0.80, k1 = 0.93, px = (k) => x + (tx - x) * k, pz = (k) => z + (tz - z) * k;
      b.quad([px(k0) - 0.028, y0, pz(k0)], [px(k0) + 0.028, y0, pz(k0)], [px(k1) + 0.028, y1, pz(k1)], [px(k1) - 0.028, y1, pz(k1)], 0, 0, [sw * 0.6, sw * 0.6, sw * 0.85, sw * 0.85]);
    }
  }
  return b.geo();
}
// a raft of lily pads lying on the water, one flower among them now and then
function padGeo(rnd, flower) {
  const b = new Bld();
  for (let i = 0; i < 6; i++) {
    const a = rnd() * 6.283, d = 0.75 * Math.sqrt(rnd()), cx = Math.cos(a) * d, cz = Math.sin(a) * d, r = 0.20 + 0.20 * rnd(), a0 = rnd() * 6.283, y = 0.012 + 0.002 * i;
    b.c([0.10 + 0.04 * rnd(), 0.21 + 0.06 * rnd(), 0.09], KIND.PLAIN);
    const c0 = b.v(cx, y, cz, 0, 1, 0, 0, 0), first = b.P.length / 3;
    for (let k = 0; k <= 7; k++) { const q = a0 + k / 8 * 6.283; b.v(cx + Math.cos(q) * r, y, cz + Math.sin(q) * r, 0, 1, 0, Math.cos(q) * r, Math.sin(q) * r); }
    for (let k = 0; k < 7; k++) b.I.push(c0, first + k + 1, first + k);
  }
  if (flower) {
    b.c([0.95, 0.90, 0.92], KIND.PETAL);
    for (let k = 0; k < 6; k++) { const q = k / 6 * 6.283; b.tri([0.03 * Math.cos(q - 0.5), 0.03, 0.03 * Math.sin(q - 0.5)], [0.03 * Math.cos(q + 0.5), 0.03, 0.03 * Math.sin(q + 0.5)], [0.12 * Math.cos(q), 0.10, 0.12 * Math.sin(q)]); }
    b.c([0.95, 0.75, 0.2], KIND.PLAIN);
    b.blob(0, 0.05, 0, 0.03, 0.03, 0.03, 5, 3);
  }
  return b.geo();
}
async function buildLakeReeds(E) {
  const { kit, ctx, path } = E, g = E.G[0], rnd = E.rng.lake;
  const spots = [], pads = [];
  const _q = new THREE.Vector3(), _t = new THREE.Vector3();
  // beds beside the line's first hundred metres: never nearer the line than 3.3 m, none within 15 m of the entry, and
  // the water before the door left open for the morning's path
  // the beds by the line: where they lie is the seed's; a seed whose field leaves the line bare gets a lower bar
  let bar = 0.46, tries = 0;
  const count = (th) => { let c = 0; for (let s = 17; s < 104; s += 0.55) for (const side of [-1, 1]) if (fbmC(s * 0.055 + side * 9.3 + E.seedK, side * 3.1, 2) >= th) c++; return c; };
  while (count(bar) < 110 && tries++ < 12) bar -= 0.02;
  for (let s = 17; s < 104; s += 0.55) {
    path.posAtDist(s, _q); path.tangentAtDist(s, _t);
    for (const side of [-1, 1]) {
      const bed = fbmC(s * 0.055 + side * 9.3 + E.seedK, side * 3.1, 2);
      if (bed < bar) continue;
      const o = side * (3.4 + 6.5 * Math.pow(rnd(), 1.4)), x = _q.x + _t.z * -o, z = _q.z + _t.x * o;
      if (z < 62 && Math.abs(x) < 7.5) continue;
      if (E.lineNear(0, x, 2.3, z) < 3.9) continue;
      spots.push([x, z]);
      if (rnd() < 0.5) pads.push([x + (rnd() - 0.5) * 3, z + (rnd() - 0.5) * 3]);
    }
    if (rnd() < 0.30) pads.push([_q.x + (rnd() - 0.5) * 6, _q.z + (rnd() - 0.5) * 6]);
  }
  // beds along the north shore either side of the hut
  for (let i = 0; i < 1500; i++) {
    const x = (rnd() < 0.5 ? -1 : 1) * (6.6 + 70 * rnd()), z = -14 + 26 * rnd(), d = lakeShoreD(x, z);
    if (d > 0.4 || d < -7 - 3 * fbmC(x * 0.08, 2.2, 2)) continue;
    if (x > 4.2 && x < 9.6 && z > -1) continue;
    if (fbmC(x * 0.07 + E.seedK, z * 0.07, 2) < 0.40) continue;
    if (E.lineNear(0, x, 2.3, z) < 3.9) continue;
    spots.push([x, z]);
    if (rnd() < 0.2) pads.push([x + (rnd() - 0.5) * 2, z + 1 + 2.5 * rnd()]);
  }
  await ctx.yield();
  const n = Math.min(spots.length, Math.max(200, Math.round(spots.length * E.detail)));
  for (let v = 0; v < 3; v++) {
    const mats = [], tints = [];
    for (let i = v; i < n; i += 3) { const [x, z] = spots[i], sc = 0.85 + 0.4 * rnd(), k = 0.8 + 0.4 * rnd(); mats.push(place(x, 0, z, rnd() * 6.283, sc)); tints.push(tint(k, k, k)); }
    const m = instanced(reedGeo(rnd), kit.solid2[0], mats, tints, 'reeds');
    m.userData.kind = 'body'; m.userData.sway = 0.2;
    g.add(m);
  }
  for (let v = 0; v < 2; v++) {
    const mats = [];
    for (let i = v; i < pads.length; i += 2) { const [x, z] = pads[i]; if (lakeShoreD(x, z) < -0.5 && !(x > 4.2 && x < 9.6 && z > -1 && z < 13)) mats.push(place(x, 0, z, rnd() * 6.283, 0.9 + 0.5 * rnd())); }
    const m = instanced(padGeo(rnd, v === 0), kit.solid2[0], mats, null, 'lily pads');
    m.userData.kind = 'floor';
    g.add(m);
  }
  await ctx.yield();
}
// the two rowing boats at the jetty (they rock on the clock), the heron in the shallows, the far house with its lit windows
async function buildLakeThings(E) {
  const { kit, ctx } = E, g = E.G[0], rnd = E.rng.lake;
  const boats = [[4.02, 7.2, 0.06, [0.30, 0.20, 0.12]], [7.70, 3.4, Math.PI - 0.05, [0.16, 0.22, 0.20]]].map(([x, z, ry, tintC], i) => {
    const b = new Bld();
    buildBoat(b, tintC);
    const m = b.mesh(kit.solid2[0], 'rowing boat');
    m.userData.kind = 'body'; m.userData.sweep = 0.12;
    m.position.set(x, -0.15, z); m.rotation.set(0, ry, 0);
    g.add(m);
    return { m, ph: i * 2.1 + rnd() * 6 };
  });
  E.tick.push((dt, t) => { for (const o of boats) { o.m.rotation.z = 0.055 * Math.sin(t * 0.9 + o.ph); o.m.rotation.x = 0.02 * Math.sin(t * 0.63 + o.ph * 1.7); o.m.position.y = -0.15 + 0.025 * Math.sin(t * 1.1 + o.ph); } });
  const b = new Bld();
  // their ropes to the jetty
  b.c([0.42, 0.36, 0.25], KIND.PLAIN);
  b.tube([[4.2, 0.42, 9.2], [4.7, 0.25, 9.9], [5.05, 0.62, 10.4]], 0.02, 4);
  b.tube([[7.6, 0.42, 1.4], [7.2, 0.25, 0.9], [6.7, 0.62, 0.6]], 0.02, 4);
  // the heron: grey, still, in the shallows west of the hut, looking toward the door's light
  let hz = 4;
  while (hz > -14 && lakeShoreD(-11.5, hz) < -1.6) hz -= 0.25;
  b.push(place(-11.5, 0, hz, 2.2));
  b.c([0.52, 0.55, 0.60], KIND.PLAIN);
  b.blob(0, 0.66, 0, 0.13, 0.15, 0.30, 8, 6);
  b.tube([[0, 0.72, 0.24], [0, 0.90, 0.33], [0, 1.02, 0.27], [0, 1.12, 0.31]], (t) => 0.045 - 0.02 * t, 5);
  b.c([0.80, 0.82, 0.84], KIND.PLAIN);
  b.blob(0, 1.14, 0.33, 0.035, 0.035, 0.055, 6, 4);
  b.c([0.75, 0.62, 0.25], KIND.PLAIN);
  b.tube([[0, 1.14, 0.37], [0, 1.11, 0.52]], (t) => 0.014 * (1 - t), 4);
  b.c([0.12, 0.13, 0.16], KIND.PLAIN);
  b.tube([[0, 1.17, 0.31], [0, 1.15, 0.17]], (t) => 0.012 * (1 - t), 4);
  b.c([0.30, 0.28, 0.22], KIND.PLAIN);
  for (const s of [-1, 1]) b.tube([[s * 0.05, 0.56, 0.02], [s * 0.05, -0.45, 0.04 + s * 0.03]], 0.012, 4);
  b.pop();
  // stones along the water's edge by the hut
  const fix = fixedRng('lake things');
  b.c([0.30, 0.30, 0.32], KIND.ROCK);
  for (let i = 0; i < 46; i++) {
    const x = (fix() < 0.5 ? -1 : 1) * (5.6 + 30 * fix() * fix());
    let z = 6; while (z > -16 && lakeShoreD(x, z) < 0) z -= 0.3;
    const r = 0.18 + 0.4 * fix();
    b.blob(x + fix() - 0.5, lakeH(x, z) + r * 0.2, z + (fix() - 0.5) * 2.5, r, r * 0.6, r * (0.7 + 0.5 * fix()), 6, 4, (px, py, pz) => vnC(px * 3, pz * 3) - 0.5, 0.35);
  }
  // the far house across the water (round three b, T2): it stands where the bay of the north shore ends, on the bearing
  // from the lake's middle midway between the bay's deepest point and the headland east of it (both read off the
  // shore's own reach), on the lower slope half way back to the first ridge, facing the lake's middle: dark walls, a
  // roof, three lit windows toward the lake
  const FH = (() => {
    const reach = (a) => lakeShoreR(a * RAD), ext = [];
    for (let a = -179.5; a < 180; a += 0.5) { const r = reach(a); if ((r < reach(a - 0.5) && r < reach(a + 0.5)) || (r > reach(a - 0.5) && r > reach(a + 0.5))) ext.push([a, r < reach(a - 0.5)]); }
    const bay = ext.filter((e) => e[1]).reduce((p, e) => (Math.abs(e[0] + 90) < Math.abs(p[0] + 90) ? e : p)), cape = ext.filter((e) => !e[1] && e[0] > bay[0]).reduce((p, e) => (e[0] < p[0] ? e : p));
    const th = (bay[0] + cape[0]) / 2 * RAD, r = lakeShoreR(th, RIDGE.D[0] / 2);
    return [LAKE_C[0] + Math.cos(th) * r, LAKE_C[1] + Math.sin(th) * r];
  })();
  const hx = FH[0], hz2 = FH[1];
  b.push(place(hx, lakeH(hx, hz2) - 0.2, hz2, Math.atan2(LAKE_C[0] - hx, LAKE_C[1] - hz2)));
  b.c([0.22, 0.19, 0.18], KIND.STONE);
  b.box(-5, 0, -3.3, 5, 5.2, 3.3, 'yY');
  b.c([0.16, 0.13, 0.13], KIND.PLAIN);
  b.quad([-5.4, 5.0, 3.7], [5.4, 5.0, 3.7], [5.4, 8.0, 0], [-5.4, 8.0, 0]);
  b.quad([5.4, 5.0, -3.7], [-5.4, 5.0, -3.7], [-5.4, 8.0, 0], [5.4, 8.0, 0]);
  b.c([0.22, 0.19, 0.18], KIND.STONE);
  b.tri([5, 5.2, 3.3], [5, 5.2, -3.3], [5, 7.9, 0]);
  b.tri([-5, 5.2, -3.3], [-5, 5.2, 3.3], [-5, 7.9, 0]);
  b.box(2.6, 7.2, -0.5, 3.4, 9.0, 0.3, 'y');
  const lit = [[-3.2, 1.2], [0.4, 1.2], [-1.4, 3.6]].slice(0, 2 + (rnd() < 0.6 ? 1 : 0));
  b.c([2.4, 1.25, 0.34], KIND.LIT, 1);
  for (const [wx, wy] of lit) b.quad([wx, wy, 3.32], [wx + 0.95, wy, 3.32], [wx + 0.95, wy + 1.25, 3.32], [wx, wy + 1.25, 3.32]);
  b.pop();
  const m = b.mesh(kit.solid2[0], 'lake things');
  m.userData.kind = 'body';
  g.add(m);
  await ctx.yield();
}
// swifts hunting high over the water, fireflies over the reeds
async function buildLakeLife(E) {
  const { kit, ctx } = E, g = E.G[0], rnd = E.rng.lake;
  const courses = [];
  for (let i = 0; i < 9; i++) courses.push({ c: [-20 + 70 * rnd(), 13 + 16 * rnd(), 30 + 90 * rnd()], rx: 24 + 40 * rnd(), rz: 20 + 36 * rnd(), w: (0.22 + 0.2 * rnd()) * (rnd() < 0.5 ? -1 : 1), ph: rnd() * 6.28, bob: 1.5 + 2 * rnd(), size: 0.42, eight: rnd() < 0.4, beat: 9, tint: 1 });
  flock(E, 0, wingedGeo([0.05, 0.05, 0.06], { fork: true }), courses, 'swifts');
  const spots = [];
  for (const mesh of g.children) if (mesh.name === 'reeds') {
    const e = mesh.instanceMatrix.array;
    for (let i = 0; i < mesh.count; i++) if (rnd() < 0.22) spots.push([e[i * 16 + 12] + (rnd() - 0.5), 0.7 + 1.7 * rnd(), e[i * 16 + 14] + (rnd() - 0.5)]);
  }
  const ff = kit.sparks(0, spots.filter((q) => E.lineNear(0, q[0], q[1], q[2]) >= 3.2).slice(0, Math.round(260 * E.detail)), { color: [2.6, 1.9, 0.45], size: 0.035, wander: 0.5, blink: 1, tag: 'fireflies' }, rnd);
  g.add(ff);
  await ctx.yield();
}
// ---- END LAKE ----

// ---------------------------------------------------------------------------------------------------------------------
// PLACE 1, THE WALLED GARDEN on a June morning. Level ground at y 0; the canal's water stands at y 0 too, held by a
// raised stone kerb, so that at plane one the lake's water and the canal's are one level and no sight line through the
// gate can pass between them.
// ---------------------------------------------------------------------------------------------------------------------
const GD = {
  x0: -90, x1: 90, z0: 0, z1: -290, wallH: 5, wallT: 0.6,
  canalHW: 5, canalEnd: -92, kerb: 0.5, kerbH: 0.3, walk: 4, border: 6, hedgeT: 1.2, hedgeH: 3,
  // the canal's water face (from a metre south of plane one to past the canal's end) and the kerbs' north end
  canalWater: [1, -93.2], kerbEnd: -92.9,
  basin: [0, -108, 16], tallZ: -130, tallH: 5.2, tallT: 2.2,
  // THE SECOND COURT (round two): the long basin in which the garden's hut stands (its water at y 1.0, the hut's water
  // line), the round pool at the crossing of the walks, the strip of the cherry avenue either side of the basin
  lb: { x0: -31.5, x1: -12.5, z0: -158, z1: -224, y: 1.0, kerb: 0.5, top: 1.2 },
  pool: [-22, -146, 5.0], round: 9.5, crossZ: -146, crossW: 1.8, strip: [-41, -3], rankX: [-36.5, -7.5],
  cross: [-30, -62], crossHW: 1.6,
};
// THE CLOUDS' LANES ACROSS THE WIND (round three c, the lead's C5; round three d, D4; the part's CLOUDS): the band across
// the wind (ac = 0.339 x - 0.941 z) of each thing kept in sun, read at the build from the things' own figures: the
// canal, its water face (GD.canalWater, as the garden's water lays it) with its kerbs (from the gatehouse's depth to
// GD.kerbEnd, as buildGardenWalls lays them); and the garden's box on its plinth (the part's hutRoofPlan, as
// buildHut lays it), its jetty (JETTY_PLAN) and the fenders' blobs over the
// jetty's outer side (FENDER); each band widened by the widest cloud's half-width times one and the largest wobble
// (1 + CLOUD_WOB / 2) and CLOUD_MARGIN (3 m); the four lanes laid evenly, south to north, along the gaps the widened
// bands leave of the garden's breadth across the wind. The build tests that no lane's reach (its own cloud's
// half-width times one and the largest wobble) meets either band.
const CLOUD_MARGIN = 3;
function cloudLanes() {
  const ac = (x, z) => 0.339 * x - 0.941 * z, band = (P) => { const a = P.map(([x, z]) => ac(x, z)); return [Math.min(...a), Math.max(...a)]; };
  const G = GD, cw = G.canalHW, kw = G.canalHW + G.kerb, [w0, w1] = G.canalWater, k0 = -GATE.depth, k1 = G.kerbEnd;
  const canal = band([[-cw, w0], [cw, w0], [cw, w1], [-cw, w1], [-kw, k0], [kw, k0], [kw, k1], [-kw, k1]]);
  const R = hutRoofPlan(), J = JETTY_PLAN, fx = J.x1 + FENDER.out + FENDER.r;
  const hut = band([[R.x0, R.z1], [R.x1, R.z1], [R.x1, R.z0], [R.x0, R.z0], [J.x0, J.z0], [fx, J.z0], [fx, J.z1], [J.x0, J.z1]].map(([x, z]) => { const p = hutPoint(1, [x, 0, z]); return [p[0], p[2]]; }));
  const reach = Math.max(...CLOUDS.map((c) => c.halfAcross)) * (1 + CLOUD_WOB / 2) + CLOUD_MARGIN, dom = band([[G.x0, G.z0], [G.x1, G.z0], [G.x1, G.z1], [G.x0, G.z1]]);
  let gaps = [dom];
  for (const [lo, hi] of [canal, hut]) gaps = gaps.flatMap(([a, b]) => [[a, Math.min(b, lo - reach)], [Math.max(a, hi + reach), b]]).filter(([a, b]) => b > a);
  const total = gaps.reduce((s, [a, b]) => s + b - a, 0);
  const lanes = CLOUDS.map((c, k) => { let d = (k + 0.5) / CLOUDS.length * total; for (const [a, b] of gaps) { if (d <= b - a) return a + d; d -= b - a; } return gaps[gaps.length - 1][1]; });
  return { lanes, canal, hut, gaps };
}
const C_LAWN = [0.125, 0.335, 0.058], C_GRAVEL = [0.56, 0.48, 0.35], C_SOIL = [0.13, 0.085, 0.055], C_STONE = [0.90, 0.74, 0.48], C_BRICK = [0.25, 0.082, 0.058], C_YEW = [0.030, 0.075, 0.040], C_PARK = [0.115, 0.36, 0.055];
// what the garden's floor is at (x, z): [colour, kind, extra] or null where water lies
function gardenFloor(x, z) {
  const ax = Math.abs(x), G = GD;
  const inWalls = ax < 90 && z < 0 && z > -290;
  if (!inWalls) return [C_PARK, KIND.LAWN, 0];
  // the basin's square (x -16 to 16, z -92 to -124) is laid by the basin's own rings; round it a gravel court
  if (ax < 16 && z < -92 && z > -124) return null;
  if (z > G.canalEnd && ax < G.canalHW) return null;
  if (ax < 23 && z < -86 && z > -128.9) return [C_GRAVEL, KIND.GRAVEL, 0];
  if (z > G.tallZ + 1.1) {
    if (z > G.canalEnd - 6 && ax < G.canalHW + G.kerb + G.walk) return [C_GRAVEL, KIND.GRAVEL, 0];
    for (const cz of G.cross) if (Math.abs(z - cz) < G.crossHW && ax < 86) return [C_GRAVEL, KIND.GRAVEL, 0];
    if (z > G.canalEnd + 2 && z < -3 && ax < G.canalHW + G.kerb + G.walk + G.border) return [C_SOIL, KIND.SOIL, 0];
    if (ax > 86 || z > -3.2) return [C_SOIL, KIND.SOIL, 0];
    if (x > 17 && z > -100) return (Math.floor((x - 17) / 5.6) % 2 === 0 && Math.abs(((z % 16) + 16) % 16 - 8) > 1.2) ? [C_SOIL, KIND.SOIL, 0] : [C_GRAVEL, KIND.GRAVEL, 0];
    return [C_LAWN, x < -17 ? KIND.TURF : KIND.LAWN, 1];
  }
  // THE SECOND COURT, A PARTERRE: gravel walks; the panels of beds are laid by themselves (holes here), so are the
  // long basin and the round pool; under the cherry ranks two strips of grass strewn with fallen blossom
  if (ax > 86 || z < -286.5) return [C_SOIL, KIND.SOIL, 0];
  const L = G.lb, P = G.pool;
  if (x > L.x0 && x < L.x1 && z < L.z0 && z > L.z1) return null;
  if (Math.hypot(x - P[0], z - P[1]) < P[2] + 0.55) return null;
  for (const q of PANELS) if (x > q.x0 && x < q.x1 && z > q.za && z < q.zb) return null;
  if (z < -147.8 && z > -226 && ((x > -38.6 && x < -34.5) || (x > -9.5 && x < -5.4))) return [[C_LAWN[0] * 1.15, C_LAWN[1] * 1.05, C_LAWN[2] * 1.2], KIND.TURF, 1];
  return [C_GRAVEL, KIND.GRAVEL, 0];
}
// the colours of the parterre's beds (the cut flowers of round one, and whites and pinks between them)
const BEDC = [feed('#e0587c', 0.9), feed('#4860d0'), feed('#f4f0e0', 0.9), feed('#9060c8'), feed('#f0a8c4', 0.9), feed('#ecd870', 0.85), feed('#b83058', 0.9), feed('#a8a0e0', 0.8), feed('#f09868', 0.85)];
// THE PANELS OF THE PARTERRE: each a rectangle x0..x1, za..zb (za the north side), of a kind: 0 a border of flowers
// round a small grass panel with a clipped cone and four balls; 1 a border round an inner bed with a great ball; 2 a
// border round four small beds and a gravel cross; 3 a long bed of two colours along the tall hedge. c1, c2: indexes
// into the beds' colours. The same on every seed.
const PANELS = (() => {
  const out = [], cols = [[-83.4, -63.4], [-61, -41], [-3, 16.8], [19.2, 39], [41.4, 61.2], [63.6, 83.4]], rows = [[-147.8, -168.4], [-170.8, -191.4], [-193.8, -214.4], [-216.8, -237.4], [-239.8, -260.4], [-262.8, -283.4]];
  cols.forEach((c, ci) => rows.forEach((r, ri) => out.push({ x0: c[0], x1: c[1], za: r[1], zb: r[0], kind: (ci === 0 || ci === 5) && (ri === 1 || ri === 4) ? 0 : (ci * 2 + ri) % 3, c1: (ci * 3 + ri * 5) % 9, c2: (ci * 2 + ri * 3 + 4) % 9 })));
  // behind the hut, either side of the axis walk
  [[-38.6, -24.2], [-19.8, -5.4]].forEach((c, ci) => [[-228.4, -237.4], [-239.8, -260.4], [-262.8, -283.4]].forEach((r, ri) => out.push({ x0: c[0], x1: c[1], za: r[1], zb: r[0], kind: ri === 0 ? 3 : 1 + ((ci + ri) % 2), c1: (ci * 4 + ri * 2 + 1) % 9, c2: (ci + ri * 3 + 6) % 9 })));
  // the long beds between the tall hedge and the cross walk
  [[-83.4, -63.4], [-61, -41], [2.6, 16.8], [19.2, 39], [41.4, 61.2], [63.6, 83.4]].forEach((c, ci) => out.push({ x0: c[0], x1: c[1], za: -143.6, zb: -134, kind: 3, c1: (ci * 2 + 1) % 9, c2: (ci * 5 + 3) % 9 }));
  return out;
})();
// (the four outer panels on whose grass a great lime stands)
const LIMES = [1, 31, 4, 34];
// a level rectangle of the floor (xa < xb, za < zb), and a rectangular ring of width t just inside a rectangle
const flat = (b, xa, xb, za, zb, y = 0) => b.face([[xa, y, zb], [xb, y, zb], [xb, y, za], [xa, y, za]], [0, 1, 0], (p) => [p[0], p[2]]);
const ringFlat = (b, x0, x1, za, zb, t, y = 0) => { flat(b, x0, x1, za, za + t, y); flat(b, x0, x1, zb - t, zb, y); flat(b, x0, x0 + t, za + t, zb - t, y); flat(b, x1 - t, x1, za + t, zb - t, y); };
const ringBox = (b, x0, x1, za, zb, t, h) => { b.box(x0, 0, za, x1, h, za + t, 'y'); b.box(x0, 0, zb - t, x1, h, zb, 'y'); b.box(x0, 0, za + t, x0 + t, h, zb - t, 'y'); b.box(x1 - t, 0, za + t, x1, h, zb - t, 'y'); };
// level tiles between the cuts xs and zs at height y, each painted by what(xm, zm) at its middle; null leaves a hole
function tiles(b, xs, zs, y, what) {
  for (let i = 0; i < xs.length - 1; i++) for (let j = 0; j < zs.length - 1; j++) {
    const xa = xs[i], xb = xs[i + 1], za = zs[j], zb = zs[j + 1], w = what((xa + xb) / 2, (za + zb) / 2);
    if (!w) continue;
    b.c(w[0], w[1], w[2]);
    b.face([[xa, y, zb], [xb, y, zb], [xb, y, za], [xa, y, za]], [0, 1, 0], (p) => [p[0], p[2]]);
  }
}
const cuts = (a, b, fixed, step) => {
  const set = new Set(fixed.filter((v) => v >= a && v <= b));
  set.add(a); set.add(b);
  const arr = [...set].sort((p, q) => p - q), out = [];
  for (let i = 0; i < arr.length - 1; i++) { const n = Math.max(1, Math.ceil((arr[i + 1] - arr[i]) / step)); for (let k = 0; k < n; k++) out.push(arr[i] + (arr[i + 1] - arr[i]) * k / n); }
  out.push(b);
  return out;
};
// the garden's far land: level parkland, then wooded hills in the morning's haze
function gardenFarH(x, z) {
  const r = Math.hypot(x, z + 145);
  if (r < 372) return -0.6;
  return -0.6 + 0.6 * smoothstep(372, 380, r) + smoothstep(400, 900, r) * (26 + 80 * fbmC(x * 0.0035 + 3, z * 0.0035 + 9, 3));
}
async function buildGardenGround(E) {
  const { kit, ctx } = E, g = E.G[1], G = GD;
  let b = new Bld();
  const xf = [-90, -86, -23, -17, -16, -15.5, -9.5, -5.5, -5, 5, 5.5, 9.5, 15.5, 16, 17, 23, 86, 90];
  const zf = [-131.1, -128.9, -124, -100, -98, -92, -86, -63.6, -60.4, -31.6, -28.4, -3.2, -3, 0];
  for (let x = 17; x < 86; x += 5.6) xf.push(x);
  for (let z = -3; z > -100; z -= 16) { zf.push(z - 6.8); zf.push(z - 9.2); }
  tiles(b, cuts(-90, 90, xf, 30), cuts(-131.1, 0, zf, 30), 0, gardenFloor);
  // the second court: its own cuts (the panels' sides, the basin, the strips, the pool's square)
  {
    const L = G.lb, P = G.pool, x2 = [-90, -86, 86, 90, L.x0, L.x1, -38.6, -34.5, -9.5, -5.4, P[0] - 5.6, P[0] + 5.6], z2 = [-290, -286.5, -131.1, L.z0, L.z1, -226, -147.8, P[1] - 5.6, P[1] + 5.6];
    for (const q of PANELS) { x2.push(q.x0, q.x1); z2.push(q.za, q.zb); }
    tiles(b, cuts(-90, 90, x2, 30), cuts(-290, -131.1, z2, 30), 0, gardenFloor);
    // (round the pool: gravel between its round kerb and the square left open for it)
    b.c(C_GRAVEL, KIND.GRAVEL);
    for (let i = 0; i < 48; i++) {
      const q = (a) => { const c = Math.cos(a), sn = Math.sin(a), k = 5.6 / Math.max(Math.abs(c), Math.abs(sn)); return [[P[0] + c * (P[2] + 0.5), 0, P[1] + sn * (P[2] + 0.5)], [P[0] + c * k, 0, P[1] + sn * k]]; };
      const A = q(i / 48 * Math.PI * 2), B = q((i + 1) / 48 * Math.PI * 2);
      b.face([A[0], B[0], B[1], A[1]], [0, 1, 0], (v) => [v[0], v[2]]);
    }
    await ctx.yield();
    // THE PANELS' FLOORS: soil under the box edgings, the border of flowers, a gravel path, the inner piece
    for (const q of PANELS) {
      const c1 = BEDC[q.c1], c2 = BEDC[q.c2], { x0, x1, za, zb } = q;
      b.c(C_SOIL, KIND.SOIL); ringFlat(b, x0, x1, za, zb, 0.5);
      if (q.kind === 3) {
        const zm = (za + zb) / 2;
        b.c(c1, KIND.BED); flat(b, x0 + 0.5, x1 - 0.5, zm, zb - 0.5);
        b.c(c2, KIND.BED); flat(b, x0 + 0.5, x1 - 0.5, za + 0.5, zm);
        continue;
      }
      b.c(c1, KIND.BED); ringFlat(b, x0 + 0.5, x1 - 0.5, za + 0.5, zb - 0.5, 3.1);
      b.c(C_SOIL, KIND.SOIL); ringFlat(b, x0 + 3.6, x1 - 3.6, za + 3.6, zb - 3.6, 0.4);
      b.c(C_GRAVEL, KIND.GRAVEL); ringFlat(b, x0 + 4, x1 - 4, za + 4, zb - 4, 1.4);
      const ix0 = x0 + 5.4, ix1 = x1 - 5.4, iza = za + 5.4, izb = zb - 5.4, xm = (ix0 + ix1) / 2, zm = (iza + izb) / 2;
      if (q.kind === 0) { b.c(C_LAWN, KIND.LAWN, 1); flat(b, ix0, ix1, iza, izb); }
      else if (q.kind === 1) { b.c(C_SOIL, KIND.SOIL); ringFlat(b, ix0, ix1, iza, izb, 0.4); b.c(c2, KIND.BED); flat(b, ix0 + 0.4, ix1 - 0.4, iza + 0.4, izb - 0.4); }
      else {
        b.c(C_GRAVEL, KIND.GRAVEL); flat(b, ix0, ix1, zm - 0.6, zm + 0.6); flat(b, xm - 0.6, xm + 0.6, iza, zm - 0.6); flat(b, xm - 0.6, xm + 0.6, zm + 0.6, izb);
        b.c(c2, KIND.BED);
        flat(b, ix0, xm - 0.6, iza, zm - 0.6); flat(b, xm + 0.6, ix1, iza, zm - 0.6); flat(b, ix0, xm - 0.6, zm + 0.6, izb); flat(b, xm + 0.6, ix1, zm + 0.6, izb);
      }
    }
  }
  // the parkland round the walls, level, out to 380 m and more
  const px = cuts(-420, 420, [-90, 90], 110), pz = cuts(-560, 260, [-290, 0], 110);
  tiles(b, px, pz, 0, (x, z) => (Math.abs(x) < 90 && z < 0 && z > -290 ? null : [C_PARK, KIND.LAWN, 0]));
  // the basin's own floor: gravel between the round kerb and the square
  b.c(C_GRAVEL, KIND.GRAVEL);
  const N = 64, [bx, bz, br] = G.basin;
  for (let i = 0; i < N; i++) {
    const a0 = i / N * Math.PI * 2, a1 = (i + 1) / N * Math.PI * 2, q = (a) => { const c = Math.cos(a), s = Math.sin(a), k = 16 / Math.max(Math.abs(c), Math.abs(s)); return [[bx + c * br, 0, bz + s * br], [bx + c * k, 0, bz + s * k]]; };
    const A = q(a0), B = q(a1);
    b.face([A[0], B[0], B[1], A[1]], [0, 1, 0], (p) => [p[0], p[2]]);
  }
  const floor = b.mesh(kit.solid[1], 'garden floor');
  floor.userData.kind = 'floor';
  g.add(floor);
  await ctx.yield();
  b = new Bld();
  ringLand(b, 0, -145, [330, 372, 380, 400, 440, 500, 580, 680, 800, 950, 1150, 1500], 96, gardenFarH, (bb, x, z, h) => { const far = smoothstep(430, 900, Math.hypot(x, z + 145)); bb.c(h > 3 ? [lerp(0.17, 0.25, far), lerp(0.31, 0.37, far), lerp(0.15, 0.56, far)] : C_PARK, h > 3 ? KIND.HILL : KIND.LAWN, 0); });
  g.add(b.mesh(kit.solid[1], 'garden far land'));
  // the water: the canal (it runs on a metre south of plane one, so that no gap can open at the gate) and the basin
  b = new Bld();
  b.face([[-G.canalHW, 0, G.canalWater[0]], [G.canalHW, 0, G.canalWater[0]], [G.canalHW, 0, G.canalWater[1]], [-G.canalHW, 0, G.canalWater[1]]], [0, 1, 0], (p) => [p[0], p[2]]);
  ringSheet(b, bx, bz, [0, 6, br], 48, 0);
  // (the long basin's still water, at the garden hut's water line)
  { const L = G.lb; flat(b, L.x0 + L.kerb, L.x1 - L.kerb, L.z1 + L.kerb, L.z0 - L.kerb, L.y); }
  const water = b.mesh(E.water[1], 'garden water');
  water.userData.kind = 'floor';
  g.add(water);
  await ctx.yield();
}
// THE WALLS, THE GATEHOUSE AND THE KERBS. The south wall stands in plane one, behind it (z 0 to -0.6). The water gate's
// opening is the outline less a millimetre at the plane and splays wide toward the garden (65 degrees from the axis),
// so that no face of the gate is in a sight line from the lake: the edge one sees from the lake is the hut's alone.
// (Round four: the outline is the box's tall doorway, 12.8 m over the lake's water, so the gatehouse stands 14.2 m.)
const GATE = { depth: 0.6, splay: Math.tan(65 * RAD), top: 14.2, hw: 7 };
async function buildGardenWalls(E) {
  const { kit, ctx } = E, g = E.G[1], G = GD, b = new Bld();
  const T = G.wallT, H = G.wallH, gw = GATE.hw, F = E.stamp;
  F.rect(G.x0, -T, G.x1, 0, H + 0.16); F.rect(G.x0, G.z1, G.x0 + T, 0, H + 0.16); F.rect(G.x1 - T, G.z1, G.x1, 0, H + 0.16); F.rect(G.x0, G.z1, G.x1, G.z1 + T, H + 0.16);
  F.rect(-gw, -GATE.depth, gw, 0, GATE.top + 0.2);
  b.c(C_BRICK, KIND.BRICK);
  b.box(G.x0, 0, -T, -gw, H, 0, 'Zy');
  b.box(gw, 0, -T, G.x1, H, 0, 'Zy');
  b.box(G.x0, 0, G.z1, G.x0 + T, H, -T, 'xy');
  b.box(G.x1 - T, 0, G.z1, G.x1, H, -T, 'Xy');
  b.box(G.x0 + T, 0, G.z1, G.x1 - T, H, G.z1 + T, 'zy');
  b.c(C_STONE, KIND.FLAGS);
  const cp = 0.09;
  b.box(G.x0 - cp, H, -T - cp, -gw, H + 0.16, cp, 'y');
  b.box(gw, H, -T - cp, G.x1 + cp, H + 0.16, cp, 'y');
  b.box(G.x0 - cp, H, G.z1 - cp, G.x0 + T + cp, H + 0.16, -T - cp, 'y');
  b.box(G.x1 - T - cp, H, G.z1 - cp, G.x1 + cp, H + 0.16, -T - cp, 'y');
  b.box(G.x0 + T + cp, H, G.z1 - cp, G.x1 - T - cp, H + 0.16, G.z1 + T + cp, 'y');
  // the gatehouse: brick, its square-headed opening's splayed reveals of stone (gateBack, in plane one's own frame)
  const zt = -GATE.depth, top = GATE.top, c1 = PLANES[1].c[1];
  gateBack(b, 1, { hw: gw, bot: -c1 - 0.6, top: top - c1, depth: GATE.depth, col: C_BRICK, kind: KIND.BRICK, colR: C_STONE, kindR: KIND.FLAGS });
  b.c(C_BRICK, KIND.BRICK);
  b.quad([gw, 0, 0], [gw, 0, zt], [gw, top, zt], [gw, top, 0]);
  b.quad([-gw, 0, zt], [-gw, 0, 0], [-gw, top, 0], [-gw, top, zt]);
  b.c(C_STONE, KIND.FLAGS);
  b.box(-gw - 0.12, top, zt - 0.12, gw + 0.12, top + 0.22, 0.12, 'y');
  // the kerbs of canal and basin: stone, 0.3 m proud of the gravel
  const kh = G.kerbH, cw = G.canalHW, kw = G.kerb;
  for (const s of [-1, 1]) b.box(s > 0 ? cw : -cw - kw, -0.35, G.kerbEnd, s > 0 ? cw + kw : -cw, kh, zt, 'y');
  const [bx, bz, br] = G.basin, a0 = Math.PI / 2 + Math.asin(cw / br), a1 = Math.PI * 2 + Math.PI / 2 - Math.asin(cw / br);
  b.cyl(bx, bz, br + 0.6, br + 0.6, 0, kh, 60, '', 0, a0, a1);
  const N = 60;
  for (let i = 0; i < N; i++) {
    const p = a0 + (a1 - a0) * i / N, q = a0 + (a1 - a0) * (i + 1) / N, P = (a, r, y) => [bx + Math.cos(a) * r, y, bz + Math.sin(a) * r];
    b.face([P(p, br, kh), P(q, br, kh), P(q, br + 0.6, kh), P(p, br + 0.6, kh)], [0, 1, 0], (v) => [v[0], v[2]]);
    b.quad(P(p, br, -0.35), P(q, br, -0.35), P(q, br, kh), P(p, br, kh));
  }
  const m = b.mesh(kit.solid[1], 'garden walls');
  m.userData.kind = 'body';
  g.add(m);
  await ctx.yield();
}

// THE FRAME OF AN OPENING (planes two and three): a slab standing BEFORE plane i (toward its outer
// place), from the plane out to `depth`, with the outline cut through it a millimetre inside. Built in the plane's own
// frame (x level, y up from the line, z along the outward normal). o: hw (outer half width), bot and top (y of the
// slab's foot and top, from the line), depth, col/kind of the face, colR/kindR of the reveals.
const planeFrame = (i) => { const P = PLANES[i], n = P.n; return M4().makeBasis(new THREE.Vector3(n[2], 0, -n[0]), new THREE.Vector3(0, 1, 0), new THREE.Vector3(n[0], 0, n[2])).setPosition(P.c[0], P.c[1], P.c[2]); };
// (round four: the outline's head is level, the box's doorway's: its two top corners, from +x to -x)
function headPts(i, inset) {
  const P = PLANES[i], w = HW - inset;
  return [[w, P.top - inset], [-w, P.top - inset]];
}
function doorCase(b, i, o) {
  const P = PLANES[i], w = HW - 0.001, d = o.depth, hp = headPts(i, 0.001), uvF = (p) => [p[0], p[1]], sp = hp[0][1], T = o.topOf || (() => o.top);
  b.push(planeFrame(i));
  b.c(o.col, o.kind, o.ex || 0);
  b.face([[w, o.bot, d], [o.hw, o.bot, d], [o.hw, sp, d], [w, sp, d]], [0, 0, 1], uvF);
  b.face([[-o.hw, o.bot, d], [-w, o.bot, d], [-w, sp, d], [-o.hw, sp, d]], [0, 0, 1], uvF);
  b.face([[w, sp, d], [o.hw, sp, d], [o.hw, T(o.hw), d], [w, T(w), d]], [0, 0, 1], uvF);
  b.face([[-o.hw, sp, d], [-w, sp, d], [-w, T(-w), d], [-o.hw, T(-o.hw), d]], [0, 0, 1], uvF);
  for (let k = 0; k < hp.length - 1; k++) b.face([[hp[k][0], hp[k][1], d], [hp[k][0], T(hp[k][0]), d], [hp[k + 1][0], T(hp[k + 1][0]), d], [hp[k + 1][0], hp[k + 1][1], d]], [0, 0, 1], uvF);
  // the slab's outer sides and top (a gabled front has its roof for a top)
  b.quad([o.hw, o.bot, d], [o.hw, o.bot, 0], [o.hw, T(o.hw), 0], [o.hw, T(o.hw), d]);
  b.quad([-o.hw, o.bot, 0], [-o.hw, o.bot, d], [-o.hw, T(-o.hw), d], [-o.hw, T(-o.hw), 0]);
  if (!o.topOf) b.quad([-o.hw, o.top, d], [o.hw, o.top, d], [o.hw, o.top, 0], [-o.hw, o.top, 0]);
  // the reveals: jambs and the head's soffit, facing the opening
  b.c(o.colR || o.col, o.kindR ?? o.kind, 0);
  b.quad([w, o.bot, 0], [w, o.bot, d], [w, sp, d], [w, sp, 0]);
  b.quad([-w, o.bot, d], [-w, o.bot, 0], [-w, sp, 0], [-w, sp, d]);
  for (let k = 0; k < hp.length - 1; k++) b.quad([hp[k][0], hp[k][1], 0], [hp[k][0], hp[k][1], d], [hp[k + 1][0], hp[k + 1][1], d], [hp[k + 1][0], hp[k + 1][1], 0]);
  b.pop();
}
// the back of an opening with the low head, in a wall that stands in plane i on its inner side: the wall's face round
// the opening (from the plane back to `depth`), the opening splayed wide toward the inner place
function gateBack(b, i, o) {
  const P = PLANES[i], d = -o.depth, sx = o.depth * (o.splay ?? GATE.splay), hp = headPts(i, 0.001), w = HW - 0.001, sp = hp[0][1], uvF = (p) => [-p[0], p[1]];
  const wide = hp.map((p) => [p[0] + Math.sign(p[0]) * sx * Math.min(1, Math.abs(p[0]) / w), p[1] + sx * (1 - 0.6 * Math.abs(p[0]) / w)]);
  const wo = w + sx;
  b.push(planeFrame(i));
  b.c(o.col, o.kind, 0);
  b.face([[o.hw, o.bot, d], [wo, o.bot, d], [wo, sp, d], [o.hw, sp, d]], [0, 0, -1], uvF);
  b.face([[-wo, o.bot, d], [-o.hw, o.bot, d], [-o.hw, sp, d], [-wo, sp, d]], [0, 0, -1], uvF);
  b.face([[o.hw, sp, d], [wo, sp, d], [wo, o.top, d], [o.hw, o.top, d]], [0, 0, -1], uvF);
  b.face([[-wo, sp, d], [-o.hw, sp, d], [-o.hw, o.top, d], [-wo, o.top, d]], [0, 0, -1], uvF);
  for (let k = 0; k < hp.length - 1; k++) b.face([[wide[k][0], wide[k][1], d], [wide[k + 1][0], wide[k + 1][1], d], [wide[k + 1][0], o.top, d], [wide[k][0], o.top, d]], [0, 0, -1], uvF);
  b.c(o.colR || o.col, o.kindR ?? o.kind, 0);
  b.quad([wo, o.bot, d], [w, o.bot, 0], [w, sp, 0], [wo, sp, d]);
  b.quad([-w, o.bot, 0], [-wo, o.bot, d], [-wo, sp, d], [-w, sp, 0]);
  for (let k = 0; k < hp.length - 1; k++) b.quad([hp[k][0], hp[k][1], 0], [hp[k + 1][0], hp[k + 1][1], 0], [wide[k + 1][0], wide[k + 1][1], d], [wide[k][0], wide[k][1], d]);
  b.tri([wo, sp, d], [w, sp, 0], [wo, wide[0][1], d]);
  b.tri([-w, sp, 0], [-wo, sp, d], [-wo, wide[0][1], d]);
  b.pop();
}

// THE HEDGES
const C_WHITE = [1.0, 1.0, 0.94], C_PANE = [0.60, 0.74, 0.80];
function hedgeRun(b, x0, z0, x1, z1, y1, gaps = [], F = null) {
  // an upright clipped hedge between two corners of the plan; gaps: [from, to] along its long axis
  const alongX = Math.abs(x1 - x0) > Math.abs(z1 - z0), a0 = alongX ? x0 : z0, a1 = alongX ? x1 : z1;
  const cutsA = [Math.min(a0, a1), ...gaps.flat(), Math.max(a0, a1)];
  for (let i = 0; i < cutsA.length - 1; i += 2) {
    const p = cutsA[i], q = cutsA[i + 1];
    if (q - p < 0.05) continue;
    if (alongX) b.box(p, 0, Math.min(z0, z1), q, y1, Math.max(z0, z1), 'y'); else b.box(Math.min(x0, x1), 0, p, Math.max(x0, x1), y1, q, 'y');
    if (F) { if (alongX) F.rect(p, z0, q, z1, y1); else F.rect(x0, p, x1, q, y1); }
  }
}
async function buildGardenCourt(E) {
  const { kit, ctx } = E, g = E.G[1], G = GD;
  let b = new Bld();
  // (round two: the tall hedge is 5.2 m high and a lighter clipped green, so that from the air it is no dark mass)
  b.c([C_YEW[0] * 1.6, C_YEW[1] * 1.6, C_YEW[2] * 1.5], KIND.YEW);
  // the tall hedge across the garden at z -130, its arch on the axis, its clipped finials (none within 2.6 m of the line)
  const tz0 = G.tallZ - G.tallT / 2, tz1 = G.tallZ + G.tallT / 2;
  hedgeRun(b, -89.4, tz0, 89.4, tz1, G.tallH, [[-2.1, 2.1]], E.stamp);
  E.stamp.rect(-2.1, tz0, 2.1, tz1, G.tallH);
  for (let i = 0; i < 12; i++) {
    const a0 = Math.PI * i / 12, a1 = Math.PI * (i + 1) / 12, xa = -2.1 * Math.cos(a0), ya = 2.0 + 2.1 * Math.sin(a0), xb = -2.1 * Math.cos(a1), yb = 2.0 + 2.1 * Math.sin(a1), H = G.tallH;
    b.quad([xa, ya, tz1], [xb, yb, tz1], [xb, H, tz1], [xa, H, tz1], xa, ya);
    b.quad([xb, yb, tz0], [xa, ya, tz0], [xa, H, tz0], [xb, H, tz0], -xb, yb);
    b.quad([xa, ya, tz0], [xb, yb, tz0], [xb, yb, tz1], [xa, ya, tz1], i * 0.55, 0);
  }
  b.quad([-2.1, G.tallH, tz1], [2.1, G.tallH, tz1], [2.1, G.tallH, tz0], [-2.1, G.tallH, tz0], -2.1, tz1);
  for (let x = -84; x <= 84; x += 8) { b.cyl(x, G.tallZ, 0.95, 0.12, G.tallH, G.tallH + 1.5, 9, 'Y'); b.blob(x, G.tallH + 1.62, G.tallZ, 0.34, 0.34, 0.34, 8, 5); E.stamp.disc(x, G.tallZ, 0.95, (q) => G.tallH + 1.6 * (1 - q)); }
  // the hedges behind the borders, 3 m high, open at the cross walks
  b.c(C_YEW, KIND.YEW);
  const hx = G.canalHW + G.kerb + G.walk + G.border, gaps = G.cross.map((z) => [z - 1.9, z + 1.9]).sort((p, q) => p[0] - q[0]);
  for (const s of [-1, 1]) hedgeRun(b, s * hx, -88, s * (hx + G.hedgeT), -4, G.hedgeH, gaps, E.stamp);
  const hm = b.mesh(kit.solid[1], 'hedges');
  hm.userData.kind = 'body';
  g.add(hm);
  await ctx.yield();
}
// THE GARDEN'S HUT (round two, the lead's G2): THE SAME HUT, the one builder again with its jetty and its lantern,
// standing in the long basin at the head of the cherry avenue; its door's plane is plane two. The basin: a stone tank
// 19 m by 66 m whose water stands at the hut's water line (y 1.0), with a coping, lilies, and clipped box in pots.
const BOXP = hutRoofPlan();
async function buildGardenHut(E) {
  const { kit, ctx } = E, g = E.G[1], L = GD.lb, F = E.stamp, o = HUTS[1].o;
  let b = new Bld();
  b.push(M4().makeTranslation(o[0], o[1], o[2]));
  buildHut(b, { phase: E.named('lamp of the garden box')() });
  const J = buildJetty(b, E.named('fenders of the garden hut'));
  // (the place dresses the box: clipped box in clay pots on its landing. Round four: the blossom that lay on the
  // hut's turf roof is gone with that roof)
  for (const [x, z, r] of [[J.x1 - 0.45, 10.2, 0.34], [J.x1 - 0.45, 4.4, 0.30], [J.x0 + 0.4, -1.5, 0.36]]) {
    b.c([0.50, 0.22, 0.12], KIND.PLAIN);
    b.cyl(x, z, r * 0.62, r * 0.8, J.y, J.y + r * 1.1, 9, 'Y');
    b.c(C_YEW, KIND.YEW);
    b.blob(x, J.y + r * 1.1 + r * 0.95, z, r * 1.1, r * 1.1, r * 1.1, 9, 6);
  }
  b.pop();
  const hut = b.mesh(kit.solid2[1], 'garden hut');
  hut.userData.kind = 'body';
  g.add(hut);
  // (the garden's shadows: the box is stamped by its own top over its plan, the part's hutRoofPlan and hutTopAt)
  { const R = hutRoofPlan(); F.rect(o[0] + R.x0, o[2] + R.z0, o[0] + R.x1, o[2] + R.z1, (x, z) => o[1] + hutTopAt(x - o[0], z - o[2])); }
  F.rect(o[0] + J.x0, o[2] + J.z0, o[0] + J.x1, o[2] + J.z1, o[1] + J.y);
  await ctx.yield();
  // THE LONG BASIN: its walls of stone with a plinth and a coping, box balls on stone blocks at its corners
  b = new Bld();
  const k = L.kerb, T = L.top;
  b.c(C_STONE, KIND.FLAGS);
  for (const [xa, za, xb, zb] of [[L.x0, L.z1, L.x1, L.z1 + k], [L.x0, L.z0 - k, L.x1, L.z0], [L.x0, L.z1 + k, L.x0 + k, L.z0 - k], [L.x1 - k, L.z1 + k, L.x1, L.z0 - k]]) { b.box(xa, 0, za, xb, T, zb, 'y'); F.rect(xa, za, xb, zb, T); }
  b.c([C_STONE[0] * 0.86, C_STONE[1] * 0.86, C_STONE[2] * 0.86], KIND.STONE);
  b.box(L.x0 - 0.12, 0, L.z1 - 0.12, L.x1 + 0.12, 0.3, L.z1, 'y'); b.box(L.x0 - 0.12, 0, L.z0, L.x1 + 0.12, 0.3, L.z0 + 0.12, 'y');
  b.box(L.x0 - 0.12, 0, L.z1, L.x0, 0.3, L.z0, 'y'); b.box(L.x1, 0, L.z1, L.x1 + 0.12, 0.3, L.z0, 'y');
  b.c([C_STONE[0] * 1.08, C_STONE[1] * 1.08, C_STONE[2] * 1.08], KIND.FLAGS);
  b.box(L.x0 - 0.07, T, L.z1 - 0.07, L.x1 + 0.07, T + 0.07, L.z1 + k + 0.05, ''); b.box(L.x0 - 0.07, T, L.z0 - k - 0.05, L.x1 + 0.07, T + 0.07, L.z0 + 0.07, '');
  b.box(L.x0 - 0.07, T, L.z1 + k + 0.05, L.x0 + k + 0.05, T + 0.07, L.z0 - k - 0.05, ''); b.box(L.x1 - k - 0.05, T, L.z1 + k + 0.05, L.x1 + 0.07, T + 0.07, L.z0 - k - 0.05, '');
  // (the inner faces under the water, dark)
  b.c([0.10, 0.13, 0.12], KIND.STONE);
  flat(b, L.x0 + k, L.x1 - k, L.z1 + k, L.z0 - k, 0.02);
  for (const [x, z] of [[L.x0 - 0.9, L.z0 + 0.9], [L.x1 + 0.9, L.z0 + 0.9], [L.x0 - 0.9, L.z1 - 0.9], [L.x1 + 0.9, L.z1 - 0.9]]) {
    b.c(C_STONE, KIND.FLAGS);
    b.box(x - 0.55, 0, z - 0.55, x + 0.55, 0.7, z + 0.55, 'y');
    b.c(C_YEW, KIND.YEW);
    b.blob(x, 1.42, z, 0.78, 0.76, 0.78, 10, 6);
    F.disc(x, z, 0.8, 2.1);
  }
  // LILIES on the still water: pads in drifts (none under the hut or the jetty), a few flowers, white and rose
  for (let i = 0; i < 150; i++) {
    const cl = Math.floor(hsh(i, 161) * 9), cx = L.x0 + 2 + (L.x1 - L.x0 - 4) * hsh(cl, 162), cz = L.z0 - 3 - (L.z0 - L.z1 - 6) * hsh(cl, 163);
    const x = cx + 3.4 * (hsh(i, 164) - 0.5), z = cz + 4.6 * (hsh(i, 165) - 0.5), r = 0.20 + 0.24 * hsh(i, 166);
    if (x < L.x0 + k + 0.5 || x > L.x1 - k - 0.5 || z > L.z0 - k - 0.5 || z < L.z1 + k + 0.5) continue;
    if (Math.abs(x - o[0]) < HUT.hw + 0.8 && z < o[2] + BOXP.z1 + 0.8 && z > o[2] + BOXP.z0 - 0.8) continue;
    if (x > o[0] + J.x0 - 0.6 && x < o[0] + J.x1 + 0.6 && z > o[2] + J.z0 - 0.6 && z < o[2] + J.z1 + 0.6) continue;
    const kk = 0.8 + 0.4 * hsh(i, 167);
    b.c([0.05 * kk, 0.17 * kk, 0.06 * kk], KIND.PLAIN);
    b.cyl(x, z, r, r, L.y + 0.004, L.y + 0.014, 7, 'Y', 0, 0.5 + 6 * hsh(i, 168), 6.0 + 6 * hsh(i, 168));
    if (hsh(i, 169) < 0.16) { b.c(hsh(i, 170) < 0.5 ? [1.0, 0.98, 0.92] : [0.98, 0.66, 0.74], KIND.PETAL); b.blob(x + 0.3 * r, L.y + 0.07, z, 0.10, 0.07, 0.10, 6, 3); }
  }
  const bm = b.mesh(kit.solid2[1], 'long basin');
  bm.userData.kind = 'body';
  g.add(bm);
  await ctx.yield();
}
// THE GARDEN'S SHADOWS: a map of the plan that holds, for each spot, the height up to which it lies in shadow at seven
// in the morning. Things that stand are stamped into a height field (E.stamp), and one sweep toward the sun turns that
// into the map. Made once at the build; the shaders read it (sunSeen in the part file).
const SH = { x0: -100, z0: -300, w: 200, d: 310, cell: 0.5, floor: 0 };
// (the ring's own map, round two: the great bergs, the last hut and its jetty throw long shadows under the low sun)
const SH3 = { x0: 0, z0: -380, w: 320, d: 360, cell: 1.0, floor: -100 };
function shadeField(B = SH) {
  const nx = Math.round(B.w / B.cell), nz = Math.round(B.d / B.cell), top = new Float32Array(nx * nz).fill(B.floor);
  const rect = (x0, z0, x1, z1, h) => {
    const i0 = Math.max(0, Math.floor((Math.min(x0, x1) - B.x0) / B.cell)), i1 = Math.min(nx - 1, Math.ceil((Math.max(x0, x1) - B.x0) / B.cell) - 1);
    const j0 = Math.max(0, Math.floor((Math.min(z0, z1) - B.z0) / B.cell)), j1 = Math.min(nz - 1, Math.ceil((Math.max(z0, z1) - B.z0) / B.cell) - 1);
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const k = j * nx + i, v = typeof h === 'function' ? h(B.x0 + (i + 0.5) * B.cell, B.z0 + (j + 0.5) * B.cell) : h; if (v > top[k]) top[k] = v; }
  };
  const disc = (cx, cz, r, h) => rect(cx - r, cz - r, cx + r, cz + r, (x, z) => { const q = Math.hypot(x - cx, z - cz) / r; return q > 1 ? B.floor : (typeof h === 'function' ? h(q) : h); });
  return { nx, nz, top, rect, disc, B };
}
// one sweep toward the place's sun turns the stamped heights into the map (the sun stands nearer east-west than
// north-south in both places that have a map: the columns are walked from the sun's side, each cell taking its
// shadow from the column before)
async function bakeShade(E, F = E.stamp, sun = SUN.garden, place = 1) {
  const { nx, nz, top, B } = F, hl = Math.hypot(sun[0], sun[2]), dx = sun[0] / hl, dz = sun[2] / hl, sg = dx > 0 ? 1 : -1;
  const H = new Float32Array(nx * nz).fill(-100), drop = B.cell / Math.abs(dx) * (sun[1] / hl), sh = dz / Math.abs(dx);
  for (let i = sg > 0 ? nx - 2 : 1; i >= 0 && i < nx; i -= sg) {
    for (let j = 0; j < nz; j++) {
      const q = j + sh, j0 = Math.floor(q), f = q - j0;
      if (j0 < 0 || j0 + 1 >= nz) continue;
      const a = j0 * nx + i + sg, c = a + nx;
      const v = Math.max(top[a], H[a]) * (1 - f) + Math.max(top[c], H[c]) * f - drop;
      H[j * nx + i] = v;
    }
    if (i % 40 === 0) await E.ctx.yield();
  }
  const data = new Uint16Array(nx * nz);
  for (let k = 0; k < data.length; k++) data[k] = THREE.DataUtils.toHalfFloat(Math.max(-100, H[k]));
  const tex = new THREE.DataTexture(data, nx, nz, THREE.RedFormat, THREE.HalfFloatType);
  tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearFilter; tex.needsUpdate = true;
  E.kit.shade[place].tShade.value = tex;
  E.kit.shade[place].uShadeBox.value.set(B.x0, B.z0, 1 / B.w, 1 / B.d);
  if (place === 1) E.shadeH = H;
}
// THE JETS: thin arcs along both kerbs of the canal, one every 6 m, each rising from its kerb and coming down 3 m in
// (no point of any arc nearer the line than 2.6 m: the count holds it); the great jet of the basin, 9 m, its plume
// leaning in the breeze; a ring of low jets round it; a small rainbow in the spray.
const C_JET = [1.05, 1.08, 1.12];
const jetArc = (s) => [5.2 - 3.2 * s, 0.32 * (1 - s) + 7.0 * s * (1 - s)];
async function buildJets(E) {
  const { kit, ctx } = E, g = E.G[1], G = GD;
  let b = new Bld();
  b.c(C_JET, KIND.JET, 3.2);
  const arc = [];
  for (let i = 0; i <= 12; i++) arc.push(jetArc(i / 12));
  const jetOk = (sd, z) => arc.every(([x, y]) => E.lineNear(1, sd * x, y, z) >= 2.72);
  for (let z = -3; z > -90; z -= 6) for (const sd of [-1, 1]) {
    if (!jetOk(sd, z)) continue;
    b.tube(arc.map(([x, y], i) => [sd * x, y, z + 0.02 * i]), (t) => 0.014 + 0.022 * t * t, 5, (t) => 0.035 * t);
    b.c(C_STONE, KIND.PLAIN);
    b.cyl(sd * 5.2, z, 0.07, 0.045, 0.3, 0.42, 6, 'Y');
    b.c(C_JET, KIND.JET, 3.2);
  }
  const cj = b.mesh(kit.solid2[1], 'canal jets');
  cj.userData.kind = 'body'; cj.userData.sway = 0.05;
  g.add(cj);
  b = new Bld();
  // the great jet: a column that opens into a crown of falling arcs
  const [bx, bz] = G.basin;
  b.c(C_JET, KIND.JET, 5.5);
  b.tube([[bx, 0, bz], [bx, 3, bz], [bx, 6, bz], [bx + 0.1, 8.2, bz], [bx + 0.25, 9.0, bz]], (t) => 0.13 + 0.25 * t, 8, (t) => 0.45 * t * t);
  const jf = fixedRng('jets');
  for (let i = 0; i < 26; i++) {
    const a = i / 26 * 6.283 + 0.2, r = 0.5 + 1.9 * jf(), top = 8.3 + 0.9 * jf(), end = 0.55 + 0.45 * jf(), pts = [];
    for (let k = 0; k <= 7; k++) { const s = k / 7 * end, rr = r * s * (0.35 + 0.65 * s); pts.push([bx + 0.25 + Math.cos(a) * rr + 0.9 * s, top + 1.2 * s * (1 - s) - top * s * s, bz + Math.sin(a) * rr]); }
    b.tube(pts, (t) => 0.11 * (1 - 0.8 * t) + 0.012, 4, (t) => 0.45 * (1 - t) + 0.1);
  }
  b.c(C_STONE, KIND.PLAIN);
  b.cyl(bx, bz, 0.5, 0.3, -0.2, 0.5, 10, 'Y');
  // the ring of low jets, each arching inward
  b.c(C_JET, KIND.JET, 2.4);
  for (let i = 0; i < 16; i++) {
    const a = i / 16 * 6.283, pts = [];
    for (let k = 0; k <= 8; k++) { const s = k / 8, rr = 9.4 - 3.2 * s; pts.push([bx + Math.cos(a) * rr, 0.1 + 5.2 * s * (1 - s), bz + Math.sin(a) * rr]); }
    b.tube(pts, (t) => 0.02 + 0.025 * t, 5, (t) => 0.03 * t);
  }
  const m = b.mesh(kit.solid2[1], 'great jet and ring');
  m.userData.kind = 'body'; m.userData.sway = 0.5;
  g.add(m);
  // the spray of the great jet, and the small rainbow in it (a fixed arc of faint colours standing in the spray)
  const rnd = E.rng.garden, spots = [];
  for (let i = 0; i < 420; i++) { const a = rnd() * 6.283, r = 2.8 * Math.sqrt(rnd()), y = 0.3 + 8.6 * rnd() * rnd(); spots.push([bx + 0.6 + Math.cos(a) * r * (0.3 + 0.7 * (1 - y / 9)) + 1.2 * rnd(), y, bz + Math.sin(a) * r * (0.3 + 0.7 * (1 - y / 9))]); }
  for (let z = -3; z > -90; z -= 6) for (const sd of [-1, 1]) for (let k = 0; k < 3; k++) { const q = [sd * (2.2 + 0.5 * rnd()), 0.1 + 0.4 * rnd(), z + 0.3 * (rnd() - 0.5)]; if (jetOk(sd, z)) spots.push(q); }
  g.add(kit.sparks(1, spots.filter((q) => E.lineNear(1, q[0], q[1], q[2]) >= 2.84), { color: [0.9, 0.95, 1.0], size: 0.035, wander: 0.22, blink: 0.6, tag: 'spray' }, rnd));
  const bow = kit.mat(1, { tag: 'rainbow', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, body: `
    float q = clamp(vUV.y, 0.0, 1.0), airK = 0.0, alpha = 1.0;
    vec3 sp = clamp(vec3(abs(q * 4.0 - 3.0) - 1.0, 2.0 - abs(q * 4.0 - 2.0), 2.0 - abs(q * 4.0 - 1.0)), 0.0, 1.0);
    vec3 col = sp * 0.16 * smoothstep(0.0, 0.2, q) * smoothstep(1.0, 0.8, q) * smoothstep(0.0, 0.25, vUV.x) * smoothstep(1.0, 0.75, vUV.x) * (0.6 + 0.4 * sunSeen(uPlace, vW));
  ` });
  const rb = new Bld();
  for (let i = 0; i < 20; i++) {
    const a0 = 0.5 + 1.9 * i / 20, a1 = 0.5 + 1.9 * (i + 1) / 20, P = (a, r) => [bx + 0.8 - Math.cos(a) * r * 0.55, 2.2 + Math.sin(a) * r, bz - 1.6 + Math.cos(a) * r * 0.83];
    const i0 = rb.v(...P(a0, 3.3), 0, 0, 1, i / 20, 0), i1 = rb.v(...P(a1, 3.3), 0, 0, 1, (i + 1) / 20, 0), i2 = rb.v(...P(a1, 3.75), 0, 0, 1, (i + 1) / 20, 1), i3 = rb.v(...P(a0, 3.75), 0, 0, 1, i / 20, 1);
    rb.I.push(i0, i1, i2, i0, i2, i3);
  }
  const rm = rb.mesh(bow, 'rainbow');
  rm.userData.kind = 'medium';
  g.add(rm);
  await ctx.yield();
}
// THE BORDERS: each kind of flower is one small shape set out many times. Which stands where is the seed's.
const PAL = { delph: feed('#4058d0'), lupA: feed('#c050b0'), lupB: feed('#f0a0c0'), peony: feed('#e84870'), roseA: feed('#f8d0d8', 0.8), roseB: feed('#c82040'), allium: feed('#9060c8'), catmint: feed('#a8a0e0', 0.8), fox: feed('#d880c0') };
const C_LEAF = [0.07, 0.20, 0.05];
function spireGeo(h, r, leaf = true) {
  const b = new Bld();
  b.c([1, 1, 1], KIND.PETAL, 0, 0.0);
  b.cyl(0, 0, r, r * 0.25, h * 0.38, h, 4, 'Y', 0.05 * h);
  b.c(C_LEAF, KIND.PLAIN, 0, 0.0);
  b.cyl(0, 0, 0.02, 0.02, 0, h * 0.4, 3, '', 0.01 * h);
  if (leaf) b.blob(0, h * 0.16, 0, r * 2.6, h * 0.17, r * 2.6, 4, 2);
  return b.geo();
}
function bushGeo(rnd, flowers) {
  const b = new Bld();
  b.c(C_LEAF, KIND.LEAVES);
  b.blob(0, 0.30, 0, 0.5, 0.36, 0.5, 6, 3, (x, y, z) => vnC(x * 5, z * 5 + y * 3) - 0.5, 0.3, 0.02);
  b.c([1, 1, 1], KIND.PETAL);
  for (let i = 0; i < flowers; i++) { const a = rnd() * 6.283, e = 0.3 + 1.1 * rnd(), cx = 0.44 * Math.cos(a) * Math.cos(e), cy = 0.34 + 0.33 * Math.sin(e), cz = 0.44 * Math.sin(a) * Math.cos(e); b.blob(cx, cy, cz, 0.095, 0.075, 0.095, 3, 2); }
  return b.geo();
}
function alliumGeo() {
  const b = new Bld();
  b.c(C_LEAF, KIND.PLAIN, 0, 0);
  b.cyl(0, 0, 0.012, 0.01, 0, 0.95, 3, '', 0.03);
  b.c([1, 1, 1], KIND.PETAL, 0, 0.03);
  b.blob(0, 1.0, 0, 0.085, 0.085, 0.085, 4, 3);
  return b.geo();
}
function tripodGeo(rnd) {
  const b = new Bld();
  b.c([0.30, 0.22, 0.13], KIND.BARK);
  for (let i = 0; i < 3; i++) { const a = i / 3 * 6.283; b.tube([[0.45 * Math.cos(a), 0, 0.45 * Math.sin(a)], [0, 2.3, 0]], 0.022, 3); }
  b.c(C_LEAF, KIND.LEAVES);
  b.cyl(0, 0, 0.42, 0.14, 0.1, 2.1, 7, 'Y');
  b.c([1, 1, 1], KIND.PETAL);
  for (let i = 0; i < 16; i++) { const y = 0.3 + 1.7 * rnd(), a = rnd() * 6.283, r = Math.max(0.16, 0.44 - 0.13 * y); b.blob(Math.cos(a) * r, y, Math.sin(a) * r, 0.075, 0.065, 0.075, 3, 2); }
  return b.geo();
}
// a low mound: of leaves, or (flower) of small flowers all over, such as catmint
function moundGeo(flower) {
  const b = new Bld();
  b.c([1, 1, 1], flower ? KIND.PETAL : KIND.LEAVES);
  b.blob(0, 0.12, 0, 0.5, 0.3, 0.5, 6, 3, (x, y, z) => vnC(x * 6, z * 6) - 0.5, 0.3);
  return b.geo();
}
async function buildBorders(E) {
  const { kit, ctx } = E, g = E.G[1], rnd = E.rng.garden, G = GD;
  const x0 = G.canalHW + G.kerb + G.walk, x1 = x0 + G.border;
  const sets = { delph: [], lup: [], fox: [], peony: [], rose: [], allium: [], catmint: [], mound: [] }, tn = { delph: [], lup: [], fox: [], peony: [], rose: [], allium: [], catmint: [], mound: [] };
  const col3 = (c, k = 1) => tint(c[0] * k, c[1] * k, c[2] * k);
  const N = Math.round(1050 * E.detail);
  for (let i = 0; i < N; i++) {
    const sd = rnd() < 0.5 ? -1 : 1, d = rnd(), x = sd * (x0 + 0.25 + (G.border - 0.5) * d), z = -4.5 - 82 * rnd();
    if (G.cross.some((cz) => Math.abs(z - cz) < 2.2)) continue;
    // drifts: the kind goes by a slow pattern of the plan (shifted by the seed) and by the depth in the border
    const drift = fbmC(x * 0.11 + E.seedK, z * 0.11 + sd * 7, 2), pick = (drift * 3.1 + rnd() * 0.5) % 1, k = 0.8 + 0.4 * rnd(), ry = rnd() * 6.283;
    if (d > 0.62) { if (pick < 0.5) { sets.delph.push(place(x, 0, z, ry, 0.85 + 0.35 * rnd())); tn.delph.push(col3(PAL.delph, k)); } else { sets.fox.push(place(x, 0, z, ry, 0.8 + 0.4 * rnd())); tn.fox.push(col3(PAL.fox, k)); } }
    else if (d > 0.3) { if (pick < 0.4) { sets.lup.push(place(x, 0, z, ry, 0.8 + 0.4 * rnd())); tn.lup.push(col3(rnd() < 0.5 ? PAL.lupA : PAL.lupB, k)); } else if (pick < 0.75) { sets.peony.push(place(x, 0, z, ry, 0.8 + 0.5 * rnd())); tn.peony.push(col3(PAL.peony, k)); } else { sets.allium.push(place(x, 0, z, ry, 0.8 + 0.5 * rnd())); tn.allium.push(col3(PAL.allium, k)); } }
    else { sets.catmint.push(place(sd * (x0 + 0.05 + 1.1 * rnd()), 0, z, ry, 0.55 + 0.45 * rnd())); tn.catmint.push(col3(PAL.catmint, 0.6 * k)); }
    if (i % 3 === 0) { sets.mound.push(place(sd * (x0 + 0.4 + (G.border - 0.8) * rnd()), 0, -4.5 - 82 * rnd(), ry, 0.9 + 0.9 * rnd())); const q = 0.7 + 0.6 * rnd(); tn.mound.push(tint(0.06 * q, 0.19 * q, 0.05 * q)); }
  }
  // roses on tripods, a pair every 12 m, at the border's middle depth (the same places on every seed, their colours the seed's)
  for (let z = -10; z > -86; z -= 12) for (const sd of [-1, 1]) { if (G.cross.some((cz) => Math.abs(z - cz) < 3)) continue; sets.rose.push(place(sd * (x0 + 3), 0, z, rnd() * 6.283, 1)); tn.rose.push(col3(rnd() < 0.5 ? PAL.roseA : PAL.roseB)); E.stamp.disc(sd * (x0 + 3), z, 0.45, 2.2); }
  await ctx.yield();
  const add = (geo, key, name, sway) => { if (!sets[key].length) return; const m = instanced(geo, kit.solid2[1], sets[key], tn[key], name); m.userData.kind = 'body'; m.userData.sway = sway || 0; g.add(m); };
  add(spireGeo(1.75, 0.13), 'delph', 'delphiniums', 0.09);
  add(spireGeo(1.0, 0.10), 'lup', 'lupins', 0.05);
  add(spireGeo(1.35, 0.085, false), 'fox', 'foxgloves', 0.07);
  add(bushGeo(rnd, 5), 'peony', 'peonies');
  add(alliumGeo(), 'allium', 'alliums', 0.03);
  add(moundGeo(true), 'catmint', 'catmint');
  add(tripodGeo(rnd), 'rose', 'roses on tripods');
  add(moundGeo(false), 'mound', 'border leaves');
  await ctx.yield();
}
// a broad-crowned tree (its own frame: 1 m high): trunk and one rough crown
function crownTreeGeo(seedN, leafC, trunkShare = 0.42, lobes = 1, sw = 0.004) {
  const b = new Bld(), bump = (x, y, z) => vnC(x * 7 + seedN, z * 7 + y * 5) - 0.5;
  b.c([0.20, 0.16, 0.12], KIND.BARK);
  b.cyl(0, 0, 0.035, 0.022, 0, trunkShare + 0.1, 5, '');
  b.c(leafC, KIND.LEAVES, 0, sw);
  if (lobes < 2) b.blob(0, trunkShare + 0.29, 0, 0.36, 0.30, 0.36, 8, 5, bump, 0.42, sw * 3);
  else {
    const fix = fixedRng('crown tree ' + seedN);
    b.blob(0, trunkShare + 0.36, 0, 0.30, 0.40, 0.30, 7, 4, bump, 0.4, sw * 3);
    for (let i = 0; i < lobes; i++) { const a = i / lobes * 6.283 + fix(), r = 0.20 + 0.08 * fix(), y = trunkShare + 0.18 + 0.30 * fix(), q = 0.18 + 0.08 * fix(); b.blob(Math.cos(a) * r, y, Math.sin(a) * r, q, q * 0.9, q, 5, 3, bump, 0.4, sw * 3); }
  }
  return b.geo();
}
// a fruit tree trained flat against a wall (its own frame: the wall behind it at z 0, it looks toward +z)
function espalierGeo() {
  const b = new Bld();
  b.c([0.20, 0.15, 0.11], KIND.BARK);
  b.box(-0.05, 0, 0.02, 0.05, 3.7, 0.10, 'yz');
  for (let t = 0; t < 4; t++) {
    const y = 0.75 + 0.85 * t;
    b.c([0.20, 0.15, 0.11], KIND.BARK);
    b.box(-2.3, y - 0.025, 0.03, 2.3, y + 0.025, 0.08, 'z');
    b.c([0.085, 0.24, 0.06], KIND.LEAVES);
    for (let k = 0; k < 4; k++) { const xa = -2.3 + 1.15 * k, h0 = 0.22 + 0.10 * ((k + t) % 3), h1 = 0.22 + 0.10 * ((k + t + 1) % 3); b.face([[xa, y - h0, 0.12], [xa + 1.15, y - h1, 0.12], [xa + 1.15, y + h1, 0.12], [xa, y + h0, 0.12]], [0, 0, 1], (p) => [p[0], p[1]]); }
  }
  return b.geo();
}
async function buildQuarters(E) {
  const { kit, ctx } = E, g = E.G[1], rnd = E.rng.garden, G = GD, F = E.stamp;
  // fruit trees trained against the walls, every 6 m
  const em = [];
  for (let x = -84; x <= 84; x += 6) { if (Math.abs(x) > 9) em.push(place(x, 0, -G.wallT, Math.PI)); em.push(place(x, 0, G.z1 + G.wallT, 0)); }
  for (let z = -8; z > -286; z -= 6) { em.push(place(G.x0 + G.wallT, 0, z, Math.PI / 2)); em.push(place(G.x1 - G.wallT, 0, z, -Math.PI / 2)); }
  const esp = instanced(espalierGeo(), kit.solid2[1], em, null, 'trained fruit trees');
  esp.userData.kind = 'body';
  g.add(esp);
  // THE ORCHARD, west: standard apple trees in long grass, straw beehives on a bench, the dovecote of brick
  const am = [], at = [];
  for (let x = -27; x > -84; x -= 11.5) for (let z = -11; z > -124; z -= 12.5) {
    if (Math.hypot(x + 50, z + 68) < 9 || GD.cross.some((cz) => Math.abs(z - cz) < 3.4)) continue;
    const px = x + 1.6 * (rnd() - 0.5), pz = z + 1.6 * (rnd() - 0.5), s = 4.6 + 1.4 * rnd();
    am.push(place(px, 0, pz, rnd() * 6.283, s)); const k = 0.85 + 0.3 * rnd(); at.push(tint(k, k, k));
    F.disc(px, pz, 0.36 * s, (q) => s * (0.42 + 0.29 + 0.30 * Math.sqrt(Math.max(0, 1 - q * q))));
  }
  const apples = instanced(crownTreeGeo(3, [0.10, 0.27, 0.06]), kit.solid2[1], am, at, 'apple trees');
  apples.userData.kind = 'body'; apples.userData.sway = 0.03;
  g.add(apples);
  const b = new Bld();
  b.c([0.36, 0.27, 0.17], KIND.BOARDS);
  b.box(-36.5, 0.42, -18.5, -29.5, 0.5, -17.7, '');
  for (const x of [-36.2, -33, -29.8]) b.box(x - 0.06, 0, -18.4, x + 0.06, 0.42, -17.8, 'yY');
  b.c([0.62, 0.50, 0.26], KIND.PLAIN);
  for (let i = 0; i < 6; i++) { const x = -36 + 1.2 * i; for (let k = 0; k < 4; k++) b.cyl(x, -18.1, 0.30 * Math.cos(k * 0.36), 0.30 * Math.cos((k + 1) * 0.36), 0.5 + 0.12 * k, 0.62 + 0.12 * k, 8, k === 3 ? 'Y' : ''); }
  // the dovecote: a round tower of brick with a tiled cone and a small lantern
  const dc = [-50, -68];
  b.c(C_BRICK, KIND.BRICK);
  b.cyl(dc[0], dc[1], 2.3, 2.2, 0, 6.2, 18, '');
  b.c([0.30, 0.13, 0.09], KIND.PLAIN);
  b.cyl(dc[0], dc[1], 2.75, 0.5, 6.15, 8.4, 18, 'y');
  b.c(C_WHITE, KIND.PLAIN);
  b.cyl(dc[0], dc[1], 0.5, 0.5, 8.4, 9.0, 8, '');
  b.c([0.30, 0.13, 0.09], KIND.PLAIN);
  b.cyl(dc[0], dc[1], 0.75, 0.0, 9.0, 9.7, 8, 'y');
  b.c([0.03, 0.02, 0.02], KIND.PLAIN);
  for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; b.push(place(dc[0] + Math.cos(a) * 2.24, 5.0 - 0.9 * (i % 2), dc[1] + Math.sin(a) * 2.24, Math.PI / 2 - a)); b.quad([-0.14, 0, 0.02], [0.14, 0, 0.02], [0.14, 0.3, 0.02], [-0.14, 0.3, 0.02]); b.pop(); }
  F.disc(dc[0], dc[1], 2.5, (q) => 6.2 + 3.2 * (1 - q));
  // THE KITCHEN GARDEN, east: cold frames along the south wall, a dipping pond, a wheelbarrow and cans
  for (let i = 0; i < 5; i++) {
    const x = 26 + 7 * i;
    b.c(C_BRICK, KIND.BRICK);
    b.box(x, 0, -6.2, x + 4.6, 0.38, -4.2, 'yY');
    b.c(C_PANE, KIND.PANE);
    b.quad([x, 0.38, -6.2], [x + 4.6, 0.38, -6.2], [x + 4.6, 0.95, -4.2], [x, 0.95, -4.2]);
    b.c(C_BRICK, KIND.BRICK);
    b.quad([x, 0, -4.2], [x + 4.6, 0, -4.2], [x + 4.6, 0.95, -4.2], [x, 0.95, -4.2]);
  }
  const pond = [52, -46, 2.2];
  b.c(C_STONE, KIND.FLAGS);
  b.cyl(pond[0], pond[1], pond[2] + 0.35, pond[2] + 0.35, 0, 0.36, 20, '');
  for (let i = 0; i < 20; i++) { const a0 = i / 20 * 6.283, a1 = (i + 1) / 20 * 6.283, P = (a, r, y) => [pond[0] + Math.cos(a) * r, y, pond[1] + Math.sin(a) * r]; b.face([P(a0, pond[2], 0.36), P(a1, pond[2], 0.36), P(a1, pond[2] + 0.35, 0.36), P(a0, pond[2] + 0.35, 0.36)], [0, 1, 0], (v) => [v[0], v[2]]); }
  b.push(place(40, 0, -40, 0.6));
  b.c([0.20, 0.34, 0.22], KIND.PLAIN);
  b.box(-0.35, 0.32, -0.5, 0.35, 0.62, 0.5, 'Y');
  b.c([0.12, 0.12, 0.12], KIND.PLAIN);
  b.push(M4().makeTranslation(0, 0.2, 0.72).multiply(M4().makeRotationZ(Math.PI / 2))); b.cyl(0, 0, 0.2, 0.2, -0.04, 0.04, 10, 'yY'); b.pop();
  b.c([0.36, 0.27, 0.17], KIND.BARK);
  for (const sx of [-0.3, 0.3]) b.tube([[sx, 0.3, 0.7], [sx, 0.45, -0.5], [sx, 0.62, -1.15]], 0.022, 4);
  b.pop();
  b.c([0.40, 0.44, 0.46], KIND.PLAIN);
  for (const [cx, cz] of [[42.2, -39.2], [42.9, -39.9], [49.2, -43.2]]) { b.cyl(cx, cz, 0.15, 0.13, 0, 0.36, 8, 'Y'); b.tube([[cx + 0.13, 0.2, cz], [cx + 0.42, 0.36, cz]], 0.02, 4); }
  const qm = b.mesh(kit.solid2[1], 'quarters');
  qm.userData.kind = 'body';
  g.add(qm);
  const wb = new Bld();
  ringSheet(wb, pond[0], pond[1], [0, pond[2]], 20, 0.26);
  const pw = wb.mesh(E.water[1], 'dipping pond');
  pw.userData.kind = 'floor';
  g.add(pw);
  await ctx.yield();
  // bean rows on poles, cabbages and lettuces in lines, glass cloches (the beds' places are the plan's; what grows where is the seed's)
  const bean = [], cab = [], cabT = [], let_ = [], letT = [], clo = [];
  for (let bx = 17; bx < 84; bx += 11.2) for (let k = 0; k < 7; k++) {
    const z0 = -3 - 16 * k - 9.2, z1 = z0 - 13.6 + 6.8;
    if (z1 < -99 || (bx < 58 && bx > 22 && z0 > -8)) continue;
    const kind = Math.floor(rnd() * 4);
    for (let r = 0; r < 4; r++) {
      const x = bx + 0.9 + r * 1.25;
      if (Math.hypot(x - pond[0], (z0 + z1) / 2 - pond[1]) < 6) continue;
      for (let z = z0 - 0.5; z > z1 + 0.3; z -= kind === 0 ? 1.5 : 0.8) {
        if (GD.cross.some((cz) => Math.abs(z - cz) < 2.0)) continue;
        if (kind === 0) { if (r % 2 === 0) bean.push(place(x + 0.6, 0, z, rnd() * 6.283, 0.9 + 0.2 * rnd())); }
        else if (kind === 1) { cab.push(place(x, 0, z, rnd() * 6.283, 0.55 + 0.2 * rnd())); const q = 0.8 + 0.4 * rnd(); cabT.push(tint(0.55 * q, 0.95 * q, 0.85 * q)); }
        else if (kind === 2) { let_.push(place(x, 0, z, rnd() * 6.283, 0.32 + 0.1 * rnd())); const q = 0.8 + 0.4 * rnd(); letT.push(tint(1.5 * q, 2.3 * q, 0.6 * q)); }
        else if (rnd() < 0.5) clo.push(place(x, 0, z, 0, 0.5)); else { cab.push(place(x, 0, z, rnd() * 6.283, 0.4)); cabT.push(tint(0.9, 1.5, 0.6)); }
      }
    }
  }
  const bg = new Bld();
  bg.c([0.42, 0.33, 0.20], KIND.BARK);
  for (let i = 0; i < 4; i++) { const a = i / 4 * 6.283; bg.tube([[0.5 * Math.cos(a), 0, 0.5 * Math.sin(a)], [0, 2.4, 0]], 0.02, 3); }
  bg.c([0.09, 0.26, 0.06], KIND.LEAVES);
  bg.cyl(0, 0, 0.5, 0.1, 0.05, 2.1, 6, '');
  const cg = new Bld();
  cg.c([0.10, 0.20, 0.10], KIND.LEAVES);
  cg.blob(0, 0.22, 0, 0.5, 0.36, 0.5, 6, 3, (x, y, z) => vnC(x * 9, z * 9) - 0.5, 0.25);
  const gg = new Bld();
  gg.c(C_PANE, KIND.PANE);
  gg.blob(0, 0.05, 0, 0.5, 0.75, 0.5, 8, 4);
  const addI = (geo, mats, tints, name) => { if (!mats.length) return; const m = instanced(geo, kit.solid2[1], mats, tints, name); m.userData.kind = 'body'; g.add(m); };
  addI(bg.geo(), bean, null, 'bean poles'); addI(cg.geo(), cab, cabT, 'cabbages'); addI(cg.geo(), let_, letT, 'lettuces'); addI(gg.geo(), clo, null, 'cloches');
  await ctx.yield();
}
// THE SECOND COURT's dressing (round two): the parterre's clipped box edgings, its cones and balls, low mounds of
// flowers along the borders nearest the avenue; THE CHERRY AVENUE in two ranks either side of the long basin; four
// great limes within the walls (their trunks and shade read from the air); the round pool with its jets at the
// crossing of the walks; then the rose arches over the first court's cross walks, and what stands beyond the walls.
async function buildCourtDress(E) {
  const { kit, ctx } = E, g = E.G[1], rnd = E.rng.garden, G = GD, F = E.stamp;
  let b = new Bld();
  const bedM = [], bedMT = [];
  const cone = (x, z, r, h) => { b.c(C_YEW, KIND.YEW); b.cyl(x, z, r, 0.07, 0, h, 10, 'Y'); b.blob(x, h + 0.08, z, 0.14, 0.14, 0.14, 6, 4); F.disc(x, z, r, (q) => h * (1 - q)); };
  const ball = (x, z, r) => { b.c([C_YEW[0] * 1.25, C_YEW[1] * 1.3, C_YEW[2] * 1.2], KIND.YEW); b.blob(x, r * 0.92, z, r, r * 0.95, r, 9, 6); F.disc(x, z, r, r * 1.6); };
  let n = 0;
  for (const q of PANELS) {
    const { x0, x1, za, zb } = q, xm = (x0 + x1) / 2, zm = (za + zb) / 2;
    b.c(C_YEW, KIND.YEW);
    ringBox(b, x0, x1, za, zb, 0.5, 0.42);
    if (q.kind === 3) { ball(x0 + 1.3, zm, 0.62); ball(x1 - 1.3, zm, 0.62); }
    else {
      b.c(C_YEW, KIND.YEW);
      ringBox(b, x0 + 3.6, x1 - 3.6, za + 3.6, zb - 3.6, 0.4, 0.36);
      if (q.kind === 0) { if (!LIMES.includes(PANELS.indexOf(q))) cone(xm, zm, 1.0, 2.6); for (const sx of [-1, 1]) for (const sz of [-1, 1]) ball(xm + sx * (x1 - x0 - 12.6) / 2, zm + sz * (zb - za - 12.6) / 2, 0.5); }
      else if (q.kind === 1) { ball(xm, zm, 1.05); }
      else { cone(xm, zm, 0.8, 2.1); }
      // low mounds of the border's flowers, on the panels within 50 m of the avenue (the others are read from the air)
      if (Math.abs(xm + 22) < 50) {
        const c = BEDC[q.c1], per = 2 * (x1 - x0 + zb - za - 8.2), nm = Math.round(per / 1.5);
        for (let i = 0; i < nm; i++) {
          let d = (i + 0.5 * rnd()) / nm * per, x, z; const w = x1 - x0 - 4.1, dp = zb - za - 4.1;
          if (d < w) { x = x0 + 2.05 + d; z = za + 2.05; } else if (d < w + dp) { x = x1 - 2.05; z = za + 2.05 + d - w; } else if (d < 2 * w + dp) { x = x1 - 2.05 - (d - w - dp); z = zb - 2.05; } else { x = x0 + 2.05; z = zb - 2.05 - (d - 2 * w - dp); }
          const k = 0.75 + 0.45 * rnd();
          bedM.push(place(x + 1.2 * (rnd() - 0.5), 0.05, z + 1.2 * (rnd() - 0.5), rnd() * 6.283, 1.5 + 1.0 * rnd())); bedMT.push(tint(c[0] * k, c[1] * k, c[2] * k));
        }
      }
    }
    if (++n % 8 === 0) await ctx.yield();
  }
  {
    const mb = new Bld();
    mb.c([1, 1, 1], KIND.PETAL);
    mb.blob(0, 0.1, 0, 0.5, 0.3, 0.5, 5, 2, (px, py, pz) => vnC(px * 6, pz * 6) - 0.5, 0.3);
    const m1 = instanced(mb.geo(), kit.solid2[1], bedM, bedMT, 'bed mounds');
    m1.userData.kind = 'body';
    g.add(m1);
  }
  await ctx.yield();
  // THE CHERRY AVENUE: two ranks either side of the long basin, 14.5 m from its axis, twelve trees each, in blossom,
  // 5 to 6.2 m; their shade on the walks and the water. Each of the 24 places draws its height, tint, turn and second
  // tint from the avenue's own stream (round three b) before the clear-air test, so the draws are the places' and
  // never the line's.
  {
    const tm = [], tt = [], ar = E.named('cherry avenue');
    for (const x of G.rankX) for (let i = 0; i < 12; i++) {
      const z = -152 - 6.36 * i, h = 5.0 + 1.2 * ar(), k = 0.9 + 0.2 * ar(), ry = ar() * 6.283, k2 = 0.92 + 0.12 * ar();
      if (E.lineNear(1, x, h * 0.7, z) < 2.6 + 0.4 * h) continue;
      tm.push(M4().makeTranslation(x, 0, z).multiply(M4().makeRotationY(ry)).multiply(M4().makeScale(h * 0.95, h, h * 0.95)));
      tt.push(tint(k, k * k2, k));
      E.cherries.push([x, z, h]);
      F.disc(x, z, 0.36 * h, (q) => h * (0.42 + 0.29 + 0.30 * Math.sqrt(Math.max(0, 1 - q * q))));
    }
    // (their crowns stir in the breeze: 5 cm at the crown's foot to 15 cm at its top)
    const ch = instanced(crownTreeGeo(41, [0.92, 0.66, 0.72], 0.42, 3, 0.05), kit.solid2[1], tm, tt, 'cherry trees');
    ch.userData.kind = 'body'; ch.userData.sway = 0.2;
    g.add(ch);
  }
  // box balls at the corners of the pool's round, and a row north of the tall hedge
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) ball(G.pool[0] + sx * 7.6, G.pool[1] + sz * 7.6, 0.7);
  for (let x = -78; x <= 78; x += 13) if (Math.abs(x) > 5 && E.lineNear(1, x, 1, -132.4) > 4) ball(x, -132.4, 0.55);
  // THE ROUND POOL at the crossing of the walks: a stone kerb, water that ripples, lily pads, twelve jets arching
  // inward from the kerb and a plume in the middle, on the clock (the line passes 13 m off, high)
  const PO = G.pool;
  b.c(C_STONE, KIND.FLAGS);
  b.cyl(PO[0], PO[1], PO[2] + 0.55, PO[2] + 0.5, 0, 0.42, 40, '');
  b.cyl(PO[0], PO[1], PO[2], PO[2], 0.2, 0.42, 40, '');
  for (let i = 0; i < 40; i++) { const a0 = i / 40 * 6.2832, a1 = (i + 1) / 40 * 6.2832, P = (a, r) => [PO[0] + Math.cos(a) * r, 0.42, PO[1] + Math.sin(a) * r]; b.quad(P(a0, PO[2] + 0.5), P(a0, PO[2]), P(a1, PO[2]), P(a1, PO[2] + 0.5)); }
  b.cyl(PO[0], PO[1], 0.5, 0.34, 0.1, 0.62, 10, 'Y');
  b.c([0.05, 0.16, 0.06], KIND.PLAIN);
  for (let i = 0; i < 9; i++) { const a = i * 2.4 + 0.5, r = 1.4 + 2.6 * hsh(i, 21), px = PO[0] + Math.cos(a) * r, pz = PO[1] + Math.sin(a) * r, pr = 0.28 + 0.2 * hsh(i, 22); b.cyl(px, pz, pr, pr, 0.305, 0.315, 7, 'Y', 0, 0.5, 6.0); }
  const cm = b.mesh(kit.solid2[1], 'court dressing');
  cm.userData.kind = 'body';
  g.add(cm);
  {
    const jb = new Bld();
    jb.c(C_JET, KIND.JET, 2.4);
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * 6.2832 + 0.2, pts = [];
      for (let k = 0; k <= 8; k++) { const q = k / 8, rr = PO[2] - 0.1 - 3.4 * q; pts.push([PO[0] + Math.cos(a) * rr, 0.42 * (1 - q) + 0.3 * q + 7.2 * q * (1 - q), PO[1] + Math.sin(a) * rr]); }
      jb.tube(pts, (t) => 0.02 + 0.026 * t, 5, (t) => 0.04 * t);
    }
    jb.c(C_JET, KIND.JET, 3.0);
    jb.tube([[PO[0], 0.6, PO[1]], [PO[0], 2.2, PO[1]], [PO[0] + 0.03, 3.5, PO[1]], [PO[0] + 0.12, 4.1, PO[1]]], (t) => 0.06 + 0.16 * t, 6, (t) => 0.16 * t * t);
    const jm = jb.mesh(kit.solid2[1], 'court pool jets');
    jm.userData.kind = 'body'; jm.userData.sway = 0.14;
    g.add(jm);
    const wb = new Bld();
    ringSheet(wb, PO[0], PO[1], [0, 2.5, PO[2]], 28, 0.30);
    const pw = wb.mesh(E.water[1], 'court pool');
    pw.userData.kind = 'floor';
    g.add(pw);
  }
  await ctx.yield();
  // rose arches over the cross walks (never over the canal): hoops with roses, two colours in turn
  for (let v = 0; v < 2; v++) {
    const rb = new Bld(), mats = [];
    rb.c([0.10, 0.11, 0.10], KIND.PLAIN);
    for (const dz of [-0.45, 0.45]) { const pts = []; for (let k = 0; k <= 8; k++) { const a = Math.PI * k / 8; pts.push([1.45 * Math.cos(a), 1.3 + 1.45 * Math.sin(a), dz]); } rb.tube([[1.45, 0, dz], ...pts, [-1.45, 0, dz]], 0.03, 3); }
    for (let k = 0; k < 9; k++) {
      const a = Math.PI * k / 8, px = 1.5 * Math.cos(a), py = 1.3 + 1.5 * Math.sin(a);
      rb.c([0.08, 0.22, 0.06], KIND.LEAVES);
      rb.blob(px, py, 0, 0.46, 0.34, 0.62, 5, 3, (x, y, z) => vnC(x * 6, z * 6 + y * 4) - 0.5, 0.4);
      rb.c(v ? PAL.roseB : PAL.roseA, KIND.PETAL);
      for (let q = 0; q < 3; q++) rb.blob(px * 1.2 + 0.2 * (rnd() - 0.5), py + 0.2 * (rnd() - 0.2), 0.9 * (rnd() - 0.5), 0.095, 0.085, 0.095, 3, 2);
    }
    for (const lg of [[1.45, 0.5], [-1.45, 0.5]]) { rb.c([0.08, 0.22, 0.06], KIND.LEAVES); rb.blob(lg[0], lg[1], 0, 0.3, 0.62, 0.5, 5, 3); }
    let n = 0;
    for (const cz of G.cross) for (let x = 22; x < 84; x += 10.5) for (const sd of [-1, 1]) { if ((n++ % 2) === v) { mats.push(place(sd * x, 0, cz, Math.PI / 2)); F.rect(sd * x - 0.6, cz - 1.6, sd * x + 0.6, cz + 1.6, 2.9); } }
    const m = instanced(rb.geo(), kit.solid2[1], mats, null, 'rose arches');
    m.userData.kind = 'body';
    g.add(m);
  }
  // THE BELT round the walls (round two): FOUR KINDS OF CROWN, 12 to 32 m: broad beeches, taller limes of a lighter
  // green, tall narrow poplars in threes, dark firs; set in two loose ranks with gaps through which the park and the
  // far blue hills show; single trees and clumps in the park beyond. Within the walls FOUR GREAT LIMES stand on grass
  // panels of the parterre's outer corners, their trunks and their shade read from the air.
  const KN = 5, tm = [], tt = [];
  for (let v = 0; v < KN; v++) { tm.push([]); tt.push([]); }
  const tree = (x, z, h, v, wide = 1) => { const k = 0.8 + 0.4 * rnd(), w = h * wide * (0.9 + 0.25 * rnd()); tm[v].push(M4().makeTranslation(x, -0.3, z).multiply(M4().makeRotationY(rnd() * 6.283)).multiply(M4().makeScale(w, h, w))); tt[v].push(tint(k, k * (0.95 + 0.1 * rnd()), k)); };
  // (what stands where along the belt comes from the fixed noise, so the belt is the same on every seed)
  const kindAt = (s) => { const q = vnC(s * 0.021 + 3, 7), f = hsh(Math.round(s / 9.5), 77); return q < 0.30 ? -1 : (f < 0.40 ? 0 : (f < 0.66 ? 1 : (f < 0.82 ? 3 : 2))); };
  const belt = (x, z, s, row) => {
    const v = kindAt(s + row * 37);
    if (v < 0) return;
    const jx = x + 3 * (rnd() - 0.5), jz = z + 3 * (rnd() - 0.5);
    if (v === 0) tree(jx, jz, 15 + 8 * rnd(), 0);
    else if (v === 1) tree(jx, jz, 22 + 7 * rnd(), 1, 0.8);
    else if (v === 3) tree(jx, jz, 17 + 9 * rnd(), 3, 0.62);
    else for (let k = 0; k < 3; k++) tree(jx + 3.4 * (k - 1), jz + 2 * (rnd() - 0.5), 26 + 6 * rnd(), 2, 0.30);
  };
  for (let row = 0; row < 2; row++) {
    const o = 10 + 12 * row, xa = G.x0 - o, xb = G.x1 + o, za = 0 + o, zb = G.z1 - o, st = 9.5;
    // (no tree of the first rank within 14 m of the axis on the south side: no crown hangs over the water gate)
    for (let x = xa + row * 4; x <= xb; x += st) { if (row > 0 || Math.abs(x) > 16) belt(x, za, x + 500, row); belt(x, zb, x + 1000, row); }
    for (let z = zb + st + row * 4; z < za - 2; z += st) { belt(xa, z, z + 2000, row); belt(xb, z, z + 3000, row); }
  }
  for (let i = 0; i < Math.round(80 * E.detail); i++) { const a = rnd() * 6.283, r = 180 + 200 * Math.sqrt(rnd()), x = Math.cos(a) * r, z = -145 + Math.sin(a) * r * 1.15, f = rnd(); if (z > 60) continue; tree(x, z, 12 + 12 * rnd(), f < 0.5 ? 0 : (f < 0.8 ? 1 : 3), f < 0.8 ? 1 : 0.62); }
  // the four great limes within the walls (on the grass of four outer panels, in place of their cones)
  for (const [ci, ri] of [[0, 1], [5, 1], [0, 4], [5, 4]]) {
    const q = PANELS[ci * 6 + ri], x = (q.x0 + q.x1) / 2 + 2.2, z = (q.za + q.zb) / 2 - 1.6, h = 13 + 2 * hsh(ci, ri + 60);
    tm[4].push(M4().makeTranslation(x, 0, z).multiply(M4().makeRotationY(hsh(ci, ri) * 6.283)).multiply(M4().makeScale(h * 0.9, h, h * 0.9))); tt[4].push(tint(1, 1, 1));
    F.disc(x, z, 0.33 * h, (qq) => h * (0.42 + 0.30 + 0.30 * Math.sqrt(Math.max(0, 1 - qq * qq))));
  }
  const kinds = [[11, [0.040, 0.115, 0.032], 0.17, 4], [16, [0.075, 0.170, 0.035], 0.20, 3], [21, [0.050, 0.130, 0.040], 0.10, 2], [26, [0.020, 0.070, 0.050], 0.12, 1], [31, [0.070, 0.165, 0.040], 0.42, 4]];
  for (let v = 0; v < KN; v++) {
    // (the great crowns stir: 10 cm at the crown's foot to 30 cm at its top)
    const m = instanced(v === 3 ? firGeo() : crownTreeGeo(kinds[v][0], kinds[v][1], kinds[v][2], kinds[v][3], 0.10), kit.solid2[1], tm[v], tt[v], v === 4 ? 'great limes' : 'park trees');
    m.userData.kind = 'body'; m.userData.sway = 0.35;
    g.add(m);
  }
  await ctx.yield();
}
// a dark fir of the belt: tiers of boughs on a short trunk (unit height)
function firGeo() {
  const b = new Bld();
  b.c([0.16, 0.12, 0.09], KIND.BARK);
  b.cyl(0, 0, 0.03, 0.022, 0, 0.2, 5, '');
  b.c([0.022, 0.075, 0.055], KIND.LEAVES, 0, 0.03);
  for (const [y0, y1, r0, r1] of [[0.12, 0.42, 0.30, 0.10], [0.32, 0.62, 0.24, 0.07], [0.52, 0.82, 0.17, 0.04], [0.72, 1.0, 0.10, 0.0]]) b.cyl(0, 0, r0, r1, y0, y1, 7, '');
  return b.geo();
}
// MORE TO PASS ALONG THE CANAL: stone urns with clipped box on the copings, clipped yew
// shapes of differing heights at the borders' front, a second rank behind the borders (small flowering trees whose
// crowns stand over the hedge and whose shade falls across the walk and the water). All fixed, the same on every seed
// but for the trees' tints; none nearer the line than 4.4 m (where the line bears away east over the east walk, from
// z -64 on, that side is left bare).
async function buildCanalDress(E) {
  const { kit, ctx } = E, g = E.G[1], rnd = E.rng.garden, G = GD, F = E.stamp;
  const b = new Bld(), xk = G.canalHW + G.kerb * 0.5, xs = G.canalHW + G.kerb + G.walk + 1.1;
  const free = (z) => !G.cross.some((cz) => Math.abs(z - cz) < 3.2);
  for (let z = -9, i = 0; z > -88; z -= 12, i++) for (const sd of [-1, 1]) {
    if (!free(z) || E.lineNear(1, sd * xk, 1.3, z) < 4.4) continue;
    const x = sd * xk;
    b.c(C_STONE, KIND.PLAIN);
    b.cyl(x, z, 0.22, 0.16, G.kerbH, G.kerbH + 0.22, 8, '');
    b.cyl(x, z, 0.16, 0.34, G.kerbH + 0.22, G.kerbH + 0.62, 8, '');
    b.cyl(x, z, 0.34, 0.38, G.kerbH + 0.62, G.kerbH + 0.70, 8, 'Y');
    b.c(i % 2 ? [0.06, 0.15, 0.06] : C_YEW, KIND.YEW);
    b.blob(x, G.kerbH + 0.98, z, 0.36, 0.36, 0.36, 8, 5);
    F.disc(x, z, 0.36, G.kerbH + 1.3);
  }
  await ctx.yield();
  // clipped yew at the borders' front: a cone, a ball on a stem, a cube, a tall drum, by turns down both sides
  for (let z = -6, i = 0; z > -88; z -= 8, i++) for (const sd of [-1, 1]) {
    if (!free(z) || E.lineNear(1, sd * xs, 2.2, z) < 5.4) continue;
    const x = sd * xs, v = (i + (sd > 0 ? 2 : 0)) % 4;
    b.c(C_YEW, KIND.YEW);
    if (v === 0) { b.cyl(x, z, 0.85, 0.06, 0, 2.6, 10, 'Y'); F.disc(x, z, 0.85, (q) => 2.6 * (1 - q)); }
    else if (v === 1) { b.c([0.20, 0.16, 0.12], KIND.BARK); b.cyl(x, z, 0.05, 0.045, 0, 1.7, 6, ''); b.c(C_YEW, KIND.YEW); b.blob(x, 2.3, z, 0.75, 0.75, 0.75, 10, 6); F.disc(x, z, 0.75, 3.0); }
    else if (v === 2) { b.box(x - 0.6, 0, z - 0.6, x + 0.6, 1.15, z + 0.6, 'y'); F.rect(x - 0.6, z - 0.6, x + 0.6, z + 0.6, 1.15); }
    else { b.cyl(x, z, 0.62, 0.62, 0, 1.9, 12, 'Y'); b.blob(x, 2.25, z, 0.42, 0.42, 0.42, 8, 5); F.disc(x, z, 0.62, 2.5); }
  }
  const m = b.mesh(kit.solid[1], 'canal dressing');
  m.userData.kind = 'body';
  g.add(m);
  await ctx.yield();
  // the second rank: small flowering trees just before the hedge, 5.5 to 7 m, their crowns stirring
  const tm = [], tt = [], xt = G.canalHW + G.kerb + G.walk + G.border - 1.4;
  for (let z = -12; z > -86; z -= 12) for (const sd of [-1, 1]) {
    const h = 5.5 + 1.5 * rnd(), k = 0.85 + 0.3 * rnd(), jz = z + 1.5 * (rnd() - 0.5);
    if (!free(z) || E.lineNear(1, sd * xt, 5.2, jz) < 8.2) continue;
    tm.push(M4().makeTranslation(sd * xt, 0, jz).multiply(M4().makeRotationY(rnd() * 6.283)).multiply(M4().makeScale(h * 0.95, h, h * 0.95)));
    tt.push(tint(k, k, k * (0.9 + 0.2 * rnd())));
    F.disc(sd * xt, jz, 0.36 * h, (q) => h * (0.42 + 0.29 + 0.30 * Math.sqrt(Math.max(0, 1 - q * q))));
  }
  const tr = instanced(crownTreeGeo(23, [0.085, 0.20, 0.07], 0.42, 3), kit.solid2[1], tm, tt, 'border trees');
  tr.userData.kind = 'body'; tr.userData.sway = 0.2;
  g.add(tr);
  await ctx.yield();
}
// LIFE IN THE SECOND COURT, on the clock: butterflies over the cut beds, swallows low over the lawn, petals drifting
// over the grass: all of it under the sight lines that the tall hedge cuts. (The seed deals their courses.)
async function buildCourtLife(E) {
  const { kit, ctx } = E, g = E.G[1], rnd = E.rng.garden;
  const add = (arr, make) => { const c = dealCourse(E, 1, make); if (c) arr.push(c); };
  const beds = PANELS.filter((q) => q.kind !== 3 && Math.abs((q.x0 + q.x1) / 2 + 22) < 62).map((q) => [(q.x0 + q.x1) / 2, (q.za + q.zb) / 2]);
  const bf = [], sw = [];
  for (let i = 0; i < 30; i++) { const q = beds[i % beds.length]; add(bf, () => ({ c: [q[0] + 4 * (rnd() - 0.5), 0.8 + 0.8 * rnd(), q[1] + 4 * (rnd() - 0.5)], rx: 0.6 + 1.6 * rnd(), rz: 0.6 + 1.6 * rnd(), w: (0.6 + 0.8 * rnd()) * (rnd() < 0.5 ? -1 : 1), ph: rnd() * 6.283, bob: 0.3, size: 0.11, far: 6.2, beat: 5 + 3 * rnd(), eight: rnd() < 0.5, tint: 0.7 + 0.6 * rnd() })); if (i % 6 === 5) await ctx.yield(); }
  flock(E, 1, wingedGeo([0.95, 0.55, 0.20], { wide: true }), bf.slice(0, 15), 'court butterflies');
  flock(E, 1, wingedGeo([0.95, 0.95, 1.0], { wide: true }), bf.slice(15), 'court white butterflies');
  await ctx.yield();
  for (let i = 0; i < 10; i++) add(sw, () => ({ c: [-60 + 120 * rnd(), 0.9 + 0.8 * rnd(), -150 - 120 * rnd()], rx: 14 + 16 * rnd(), rz: 10 + 14 * rnd(), w: (0.45 + 0.3 * rnd()) * (rnd() < 0.5 ? -1 : 1), ph: rnd() * 6.283, bob: 0.3, size: 0.34, beat: 8, eight: true }));
  flock(E, 1, wingedGeo([0.05, 0.06, 0.10], { fork: true }), sw, 'court swallows');
  await ctx.yield();
  // petals: over the beds, and falling from the cherry trees and drifting off over the lawn
  const pet = [];
  for (let i = 0; i < Math.round(300 * E.detail); i++) { const q = beds[Math.floor(rnd() * beds.length)], p = [q[0] + 14 * (rnd() - 0.5), 0.3 + 1.6 * rnd(), q[1] + 14 * (rnd() - 0.5)]; if (E.lineNear(1, p[0], p[1], p[2]) >= 4.3) pet.push(p); }
  for (let i = 0; i < Math.round(700 * E.detail) && E.cherries.length; i++) { const q = E.cherries[Math.floor(rnd() * E.cherries.length)], a = rnd() * 6.283, r = 7 * Math.sqrt(rnd()), p = [q[0] + Math.cos(a) * r - 2.5 * rnd(), 0.2 + 0.8 * q[2] * rnd(), q[1] + Math.sin(a) * r]; if (E.lineNear(1, p[0], p[1], p[2]) >= 4.3) pet.push(p); }
  g.add(kit.sparks(1, pet, { color: [0.98, 0.72, 0.76], size: 0.045, wander: 1.4, dot: true, tag: 'court petals' }, rnd));
  await ctx.yield();
}
// swallows along the canal's sides, doves about the dovecote, butterflies and bees over the borders, dragonflies, petals
async function buildGardenLife(E) {
  const { kit, ctx } = E, g = E.G[1], rnd = E.rng.garden, G = GD;
  const add = (arr, make) => { const c = dealCourse(E, 1, make); if (c) arr.push(c); };
  const sw = [];
  for (let i = 0; i < 8; i++) { const sd = i % 2 ? -1 : 1; add(sw, () => ({ c: [sd * (3.75 + 0.5 * rnd()), 0.75 + 0.3 * rnd(), -18 - 60 * rnd()], rx: 0.55, rz: 12 + 14 * rnd(), w: (0.5 + 0.3 * rnd()) * (rnd() < 0.5 ? -1 : 1), ph: rnd() * 6.283, bob: 0.22, size: 0.34, beat: 8 })); }
  for (let i = 0; i < 5; i++) add(sw, () => ({ c: [(rnd() - 0.5) * 120, 9 + 8 * rnd(), -40 - 180 * rnd()], rx: 18 + 20 * rnd(), rz: 14 + 22 * rnd(), w: (0.3 + 0.2 * rnd()) * (rnd() < 0.5 ? -1 : 1), ph: rnd() * 6.283, bob: 2, size: 0.34, beat: 8, eight: true }));
  flock(E, 1, wingedGeo([0.05, 0.06, 0.10], { fork: true }), sw, 'swallows');
  await ctx.yield();
  const dv = [], nd = 9 + Math.floor(rnd() * 8);
  for (let i = 0; i < nd; i++) add(dv, () => ({ c: [-50 + 6 * (rnd() - 0.5), 11.5 + 4 * rnd(), -68 + 6 * (rnd() - 0.5)], rx: 9 + 12 * rnd(), rz: 9 + 12 * rnd(), w: 0.42 + 0.2 * rnd(), ph: rnd() * 6.283 + i * 0.3, bob: 1.2, size: 0.62, beat: 5 }));
  flock(E, 1, wingedGeo([1.0, 1.0, 0.98], { wide: true }), dv, 'doves');
  await ctx.yield();
  const x0 = G.canalHW + G.kerb + G.walk, bf = [], dr = [];
  for (let i = 0; i < 46; i++) { const sd = rnd() < 0.5 ? -1 : 1; add(bf, () => ({ c: [sd * (x0 + 0.8 + 4.4 * rnd()), 0.9 + 1.0 * rnd(), -6 - 78 * rnd()], rx: 0.5 + 0.8 * rnd(), rz: 0.5 + 0.9 * rnd(), w: (0.7 + 0.8 * rnd()) * (rnd() < 0.5 ? -1 : 1), ph: rnd() * 6.283, bob: 0.3, size: 0.11, far: 6.2, beat: 5 + 3 * rnd(), eight: rnd() < 0.5, tint: 0.7 + 0.6 * rnd() })); if (i % 6 === 5) await ctx.yield(); }
  flock(E, 1, wingedGeo([1.0, 0.92, 0.55], { wide: true }), bf.slice(0, 23), 'butterflies');
  flock(E, 1, wingedGeo([0.95, 0.95, 1.0], { wide: true }), bf.slice(23), 'white butterflies');
  await ctx.yield();
  for (let i = 0; i < 7; i++) { const sd = i % 2 ? -1 : 1; add(dr, () => ({ c: [sd * (3.9 + 0.5 * rnd()), 0.6 + 0.5 * rnd(), -8 - 80 * rnd()], rx: 0.5, rz: 2 + 3 * rnd(), w: 1.1 + rnd(), ph: rnd() * 6.283, bob: 0.1, size: 0.13, beat: 19, eight: true })); }
  flock(E, 1, wingedGeo([0.10, 0.45, 0.55], {}), dr, 'dragonflies');
  await ctx.yield();
  const bees = [], pet = [];
  for (let i = 0; i < 220; i++) { const sd = rnd() < 0.5 ? -1 : 1, q = [sd * (x0 + 0.5 + 5 * rnd()), 0.5 + 1.3 * rnd(), -5 - 81 * rnd()]; if (E.lineNear(1, q[0], q[1], q[2]) >= 3.2) bees.push(q); }
  g.add(kit.sparks(1, bees, { color: [0.20, 0.13, 0.02], size: 0.02, wander: 0.55, dot: true, tag: 'bees' }, rnd));
  for (const cz of G.cross) for (let x = 22; x < 84; x += 10.5) for (const sd of [-1, 1]) for (let k = 0; k < 5; k++) pet.push([sd * x + 2.6 * (rnd() - 0.5), 0.3 + 2.4 * rnd(), cz + 2.2 * (rnd() - 0.5)]);
  g.add(kit.sparks(1, pet, { color: [0.95, 0.62, 0.68], size: 0.03, wander: 0.9, dot: true, tag: 'petals' }, rnd));
  await ctx.yield();
}
// ---- END GARDEN ----

// ---------------------------------------------------------------------------------------------------------------------
// PLACE 2, THE SEA at sunset (a fishing harbour under a cliff, the open sea with stacks and a far headland, the islet
// with its hut), and PLACE 3, THE STARS over the ring's ice (the ring's sheet, its bergs and blocks, the last hut).
// ---------------------------------------------------------------------------------------------------------------------
const TURF_L = [0.50, 0.74, 0.22];
const C_CLIFF = lin('#4c4448', 1.5), C_WALLW = lin('#f8f0e0', 0.9), C_COPPER = lin('#5c9c88', 0.9), C_ICE = lin('#eef6ff', 0.82);
function isletH(x, z) {
  const t = isletIn(x, z);
  if (t < 0) {
    // (the sea's bed; in the cove the low shelf under the hut)
    const sh = shelfIn(toHut2(x, z));
    return sh > 0 && t < -0.2 ? SEA_Y + Math.min(0.32, 0.9 * sh - 0.5) : SEA_Y + Math.max(-3.5, 1.4 * t);
  }
  // a wet foot, then the rock's rise to its crown; crags; ledges of strata about 2.2 m apart
  let h = 2.6 * (1 - Math.exp(-t / 0.9)) + 10.5 * (1 - Math.exp(-t / 6));
  h += 4.4 * (fbmC(x * 0.22 + 7, z * 0.22 + 3, 3) - 0.5) * smoothstep(1, 5, t);
  const dip = isletDip(x, z), q = (h + dip) / 2.2, qf = Math.floor(q);
  return SEA_Y + Math.max(0.05, lerp(h, (qf + smoothstep(0.7, 1.0, q - qf)) * 2.2 - dip, 0.6 * smoothstep(1, 4, t)));
}
// (the strata dip to the south-east and wander, so that no ledge runs level round the rock: a ledge's edge is where
// the height over the sea plus this dip is a whole number of strata, 2.2 m each)
function isletDip(x, z) { return 0.085 * (x - ISLET[0]) + 0.05 * (z - ISLET[1]) + 1.6 * fbmC(x * 0.06, z * 0.06 + 9, 2); }
// A FISHING BOAT of the harbour, 7.6 m long, in its own frame (bow toward +z, the water line on y = 0): hull, deck,
// a small cuddy, mast and bowsprit, stays, the riding light at the masthead. hull: the topsides' colour; strake: the
// band under the rail.
const BOAT = { L: 7.6, B: 1.3, mastZ: 0.9, mastH: 8.2, boomY: 1.9, boomL: 4.3, gaffL: 2.7 };
function boatSec(t) {
  const w = BOAT.B * Math.pow(Math.sin(Math.PI * Math.min(1, 0.05 + 0.95 * Math.pow(t, 0.8))), 0.6), sheer = 0.78 + 0.5 * Math.pow(Math.abs(t - 0.4) / 0.6, 2.0);
  return [[0, -0.75, (t - 0.5) * BOAT.L * 0.92], [w * 0.5, -0.55, (t - 0.5) * BOAT.L], [w * 0.93, -0.05, (t - 0.5) * BOAT.L], [w, sheer, (t - 0.5) * BOAT.L]];
}
function fishHullGeo(hull, strake) {
  const b = new Bld(), NS = 10;
  for (const sd of [-1, 1]) for (let i = 0; i < NS; i++) {
    const A = boatSec(i / NS), B = boatSec((i + 1) / NS);
    for (let j = 0; j < 3; j++) {
      const a = [sd * A[j][0], A[j][1], A[j][2]], a2 = [sd * A[j + 1][0], A[j + 1][1], A[j + 1][2]], c = [sd * B[j][0], B[j][1], B[j][2]], c2 = [sd * B[j + 1][0], B[j + 1][1], B[j + 1][2]];
      // the bottom dark with weed, the topsides the boat's own colour, a pale strake under the rail
      b.c(j < 1 ? [0.05, 0.07, 0.06] : hull, KIND.PLAIN);
      if (sd > 0) b.quad(a, a2, c2, c); else b.quad(a, c, c2, a2);
    }
    const r0 = [sd * A[3][0], A[3][1], A[3][2]], r1 = [sd * B[3][0], B[3][1], B[3][2]], k0 = [sd * A[3][0] * 1.03, A[3][1] - 0.16, A[3][2]], k1 = [sd * B[3][0] * 1.03, B[3][1] - 0.16, B[3][2]];
    b.c(strake, KIND.PLAIN);
    if (sd > 0) b.quad(k0, r0, r1, k1); else b.quad(k0, k1, r1, r0);
    // the deck, a hand under the rail
    b.c([0.30, 0.23, 0.15], KIND.BOARDS);
    const d0 = [0, A[3][1] - 0.22, A[3][2]], d1 = [0, B[3][1] - 0.22, B[3][2]], e0 = [sd * A[3][0] * 0.96, A[3][1] - 0.22, A[3][2]], e1 = [sd * B[3][0] * 0.96, B[3][1] - 0.22, B[3][2]];
    if (sd > 0) b.quad(d0, d1, e1, e0); else b.quad(d0, e0, e1, d1);
  }
  b.c([0.62, 0.60, 0.54], KIND.PLAIN);
  b.box(-0.55, 0.6, -2.3, 0.55, 1.35, -1.0);
  b.c([0.36, 0.27, 0.17], KIND.BARK);
  b.cyl(0, BOAT.mastZ, 0.085, 0.05, 0.5, BOAT.mastH, 6, 'Y');
  b.tube([[0, 1.25, 3.3], [0, 1.45, 5.1]], 0.05, 5);
  b.c([0.16, 0.14, 0.12], KIND.PLAIN);
  for (const [x, z] of [[0.95, 0.5], [-0.95, 0.5], [0, 5.05], [0, -3.4]]) b.tube([[0, BOAT.mastH - 0.5, BOAT.mastZ], [x, z > 4 ? 1.45 : 0.85, z]], 0.014, 3);
  b.c([1.0, 0.86, 0.6], KIND.GLOW, 7);
  b.blob(0, BOAT.mastH + 0.12, BOAT.mastZ, 0.09, 0.11, 0.09, 6, 4);
  return b.geo();
}
// what a moored boat carries: boom and gaff lowered with the sail furled along them, or the sail hung up to dry
// (drying = true: it stirs in the breeze). White, the instance gives the sail's colour.
function mooredRigGeo(drying) {
  const b = new Bld(), mz = BOAT.mastZ, by = BOAT.boomY;
  b.c([0.9, 0.7, 0.45], KIND.BARK);
  b.tube([[0, by, mz - 0.1], [0, by + 0.12, mz - BOAT.boomL]], 0.05, 5);
  if (!drying) {
    b.c([1, 1, 1], KIND.SAIL);
    b.tube([[0, by + 0.2, mz - 0.2], [0, by + 0.28, mz - 1.4], [0, by + 0.34, mz - 2.8], [0, by + 0.34, mz - BOAT.boomL + 0.2]], (q) => 0.17 - 0.06 * Math.abs(q - 0.5), 6);
  } else {
    b.c([0.9, 0.7, 0.45], KIND.BARK);
    b.tube([[0, 5.6, mz - 0.1], [0, 6.5, mz - BOAT.gaffL]], 0.04, 5);
    const N = 5;
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
      const P = (u, v) => { const top = [0, 5.6 + 0.9 * u, mz - 0.12 - (BOAT.gaffL - 0.15) * u], bot = [0, by + 0.25, mz - 0.15 - (BOAT.boomL - 0.4) * u]; return [0.22 * Math.sin(Math.PI * v) * (0.4 + u), top[1] + (bot[1] - top[1]) * v, top[2] + (bot[2] - top[2]) * v]; };
      const sw = (v) => 0.10 * Math.sin(Math.PI * v);
      b.c([1, 1, 1], KIND.SAIL);
      b.quad(P(i / N, (j + 1) / N), P((i + 1) / N, (j + 1) / N), P((i + 1) / N, j / N), P(i / N, j / N), i * 0.8, j * 0.8, [sw((j + 1) / N), sw((j + 1) / N), sw(j / N), sw(j / N)]);
    }
  }
  return b.geo();
}
// the sails of a boat under way, set to one side (side 1: the boom to starboard, -1: to port): gaff mainsail and jib,
// bellied to leeward. White, the instance gives the colour.
function setSailsGeo(side) {
  const b = new Bld(), mz = BOAT.mastZ, by = BOAT.boomY, N = 5, out = 0.42 * side;
  const boom = (u) => [out * u * BOAT.boomL, by + 0.1 * u, mz - 0.1 - Math.cos(0.42) * BOAT.boomL * u], gaff = (u) => [out * 0.8 * u * BOAT.gaffL, 6.0 + 1.5 * u, mz - 0.1 - 0.72 * BOAT.gaffL * u];
  const P = (u, v) => { const t = gaff(u), q = boom(u), bl = 0.5 * side * Math.sin(Math.PI * v) * Math.sin(Math.PI * Math.min(1, u + 0.25)); return [t[0] + (q[0] - t[0]) * v + bl, t[1] + (q[1] - t[1]) * v, t[2] + (q[2] - t[2]) * v]; };
  b.c([1, 1, 1], KIND.SAIL);
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    const a = P(i / N, (j + 1) / N), c = P((i + 1) / N, (j + 1) / N), d = P((i + 1) / N, j / N), e = P(i / N, j / N);
    if (side > 0) b.quad(a, c, d, e, i * 0.85, j * 1.0); else b.quad(c, a, e, d, i * 0.85, j * 1.0);
  }
  // the jib: from the masthead's hounds to the bowsprit's end, its clew aft and to leeward
  const J = (u, v) => { const hd = [0, 6.6, mz + 0.15], tk = [0, 1.5, 5.0], cl = [0.55 * side, 1.3, mz + 0.5], lu = [hd[0] + (tk[0] - hd[0]) * v, hd[1] + (tk[1] - hd[1]) * v, hd[2] + (tk[2] - hd[2]) * v]; const bl = 0.3 * side * Math.sin(Math.PI * v) * Math.sin(Math.PI * u * 0.9); return [lu[0] + (cl[0] - lu[0]) * u * v + bl, lu[1] + (cl[1] - lu[1]) * u * v, lu[2] + (cl[2] - lu[2]) * u * v]; };
  for (let i = 0; i < 3; i++) for (let j = 0; j < N; j++) {
    const a = J(i / 3, j / N), c = J((i + 1) / 3, j / N), d = J((i + 1) / 3, (j + 1) / N), e = J(i / 3, (j + 1) / N);
    if (side > 0) b.quad(a, c, d, e, i * 0.7, j * 1.0); else b.quad(c, a, e, d, i * 0.7, j * 1.0);
  }
  b.c([0.9, 0.7, 0.45], KIND.BARK);
  b.tube([boom(0), boom(1)], 0.05, 5);
  b.tube([gaff(0), gaff(1)], 0.04, 5);
  return b.geo();
}
// THE BOATS OF THE SEA: seven fishing boats moored in two rows along the moles' inner sides, well clear of the line
// (they rock on the swell's own clock), one hauled up on the slip, and the fleet coming home under sail on closed
// courses of the clock. THE HOME-COMING BOAT (round three b, the lead's S2) is passed close BY PLACE: she lies moored on
// a buoy at the edge of the fairway (HOME_BUOY), about 20 m to the line's right at the apex of the curve back to
// bearing 14, swinging a little to her chain on the clock, so that every visitor passes her at that distance whatever
// the clock; how she swings and rocks is drawn once from a stream of her own name and the world's seed. THE SECOND
// BOAT sails a ring north of the line's last curve, 17 m and more from it at every phase; where on its ring it stands
// and how it rocks are drawn once from a stream of its own name and the world's seed. THE FLEET UNDER SAIL, the second
// boat counted, is six to ten boats (the sea's fork deals the number); the boats after the second are dealt on a stream
// of their own, 'fleet' (round three c): the first three on small rounds about NEARC, just outside the line's curves,
// the rest far out, each course dealt again until the whole of it keeps its distance from the line and the stacks.
const NEARC = [[75, -415], [-45, -365], [150, -390]];
const BOAT_SECOND = { c: [95, 0, -362], rx: 42, rz: 18, w: 0.093, ph: 0, bob: 0, size: 9 };
const SAIL_TAN = lin('#b85c34', 1.25), SAIL_RED = lin('#8c3a2c', 1.35), WIND_TO = [0.866, 0.5];
const _e = new THREE.Euler(), _q = new THREE.Quaternion(), _s1 = new THREE.Vector3(1, 1, 1), _z0 = new THREE.Vector3(0, 0, 0);
const swellAt = (x, z, t) => 0.28 * Math.sin((x * 0.26 + z * 0.966) * 0.18 - t * 0.55) + 0.16 * Math.sin((-x * 0.5 + z * 0.866) * 0.29 + 1.7 - t * 0.75);
async function buildSeaBoats(E) {
  const { kit, ctx } = E, g = E.G[2], rnd = E.rng.sea, zc = PLANES[2].c[2];
  const hulls = [fishHullGeo(lin('#1c2430', 1.5), lin('#8c3a2c')), fishHullGeo(lin('#e8e0d0', 0.72), lin('#2c6c58'))];
  await ctx.yield();
  // the moored boats along the channel's bend, 10.4 m either side of its middle line: place, heading (the angle about
  // y of the bow), hull, drying, sail colour, rocking phase
  const moored = [];
  for (const [side, ss] of [[-1, [14, 26, 38, 50]], [1, [10, 22, 34]]]) for (const sm of ss) {
    const q = seaAt(sm + 1.6 * (rnd() - 0.5)), lat = side * (10.4 + 0.3 * (rnd() - 0.5));
    moored.push({ x: q.x + q.rx * lat, z: q.z + q.rz * lat, ry: Math.atan2(q.hx, q.hz) + (rnd() < 0.5 ? 0 : Math.PI) + 0.06 * (rnd() - 0.5), hull: rnd() < 0.5 ? 0 : 1, dry: rnd() < 0.4, sail: rnd() < 0.5 ? SAIL_TAN : SAIL_RED, ph: rnd() * 6.283, calm: 0.3 });
  }
  // THE FLEET UNDER SAIL: nFleet boats, the second boat counted, each on a closed course out at sea (see THE BOATS OF THE
  // SEA): after the second boat, each boat is dealt on the 'fleet' stream, up to sixty courses until one keeps its
  // distance from the line and the stacks. j counts the boats under sail made so far after the second (round three d,
  // the lead's D5): boats j = 0, 1 and 2 sail small rounds, each about its own NEARC[j], 44.5 to 95 m from the line, the
  // rest far out, 62 m and more from it. A deal whose sixty courses all fail makes no boat, and the same boat is dealt
  // again; boats are dealt until the fleet under sail is nFleet, and the build stops at the FLEET_LOST-th failed deal.
  const nFleet = Math.round((6 + Math.floor(rnd() * 5)) * (E.detail < 0.7 ? 0.7 : 1)), fleet = [];
  const okCourse = (c, lo, hi) => {
    let least = 1e9;
    for (let i = 0; i < 240; i++) {
      coursePos(c, (i / 240) * 2 * Math.PI / Math.abs(c.w), _c);
      if (_c.z > -296 || Math.hypot(_c.x - ISLET[0], _c.z - ISLET[1]) < 62 || (_c.x > -20 && _c.x < 110 && _c.z > -350)) return false;
      for (const k of STACKS) if (Math.hypot(_c.x - k[0], _c.z - k[1]) < k[2] + 22) return false;
      least = Math.min(least, E.lineNear(2, _c.x, 4, _c.z));
    }
    return least >= lo && least <= hi;
  };
  { const sb = E.named('second boat'); fleet.push({ course: Object.assign({}, BOAT_SECOND, { ph: sb() * 6.2832 }), hull: 0, sail: SAIL_RED, ph: sb() * 6.2832 }); }
  { const hb = E.named('home-coming boat'); moored.push({ buoy: HOME_BUOY, swing: hb() * 6.2832, x: HOME_BUOY[0] + WIND_TO[0] * 4, z: HOME_BUOY[1] + WIND_TO[1] * 4, ry: Math.atan2(-WIND_TO[0], -WIND_TO[1]), hull: 1, dry: true, sail: SAIL_TAN, ph: hb() * 6.2832, calm: 1 }); }
  const fr = E.named('fleet'), FLEET_LOST = 10;
  let lost = 0, nNear = 0;
  for (let k = 0; fleet.length < nFleet; k++) {
    const j = fleet.length - 1, near = j < 3, nc = near ? NEARC[j] : null;
    let made = false;
    for (let tr = 0; tr < 60 && !made; tr++) {
      const v = 2.4 + 0.9 * fr(), rx = near ? 27 + 9 * fr() : 60 + 110 * fr(), rz = near ? 16 + 8 * fr() : 36 + 50 * fr();
      const c = { c: near ? [nc[0] + 16 * (fr() - 0.5), 0, nc[1] + 16 * (fr() - 0.5)] : [-260 + 700 * fr(), 0, -400 - 520 * fr()], rx, rz, w: v / (0.5 * (rx + rz)) * (fr() < 0.5 ? -1 : 1), ph: fr() * 6.283, bob: 0, size: 9 };
      if (!okCourse(c, near ? 44.5 : 62, near ? 95 : 1e9)) continue;
      fleet.push({ course: c, hull: fr() < 0.5 ? 0 : 1, sail: fr() < 0.55 ? SAIL_TAN : SAIL_RED, ph: fr() * 6.283 });
      made = true; nNear += near ? 1 : 0;
    }
    if (!made && ++lost >= FLEET_LOST) throw new Error('boathouse-full-of-morning: the fleet under sail falls short of ' + nFleet + ' after ' + FLEET_LOST + ' failed deals');
    if (k % 3 === 2) await ctx.yield();
  }
  E.fleetN = fleet.length; E.fleetDeal = { near: nNear, lost };
  // one hull mesh for each paint (moored boats, the fleet, and the one on the slip), the moored rigs, the set sails
  const all = moored.concat(fleet);
  const hm = [0, 1].map((v) => { const list = all.filter((q) => q.hull === v), m = instanced(hulls[v], kit.solid2[2], list.map(() => M4()).concat(v === 1 ? [M4()] : []), null, 'boats ' + (v ? 'pale' : 'dark')); m.userData.kind = 'body'; m.userData.list = list; m.frustumCulled = false; g.add(m); return m; });
  // (the hauled boat: on the slip's east side, 5 m from the line, lying on its bilge with its bow up the slope)
  hm[1].setMatrixAt(hm[1].count - 1, M4().makeTranslation(PLANES[2].c[0] + 5.2, 0.12, zc - 3.6).multiply(M4().makeRotationFromEuler(_e.set(-0.30, 0.05, -0.21, 'YXZ'))));
  const rigs = [false, true].map((dry) => { const list = moored.filter((q) => q.dry === dry); if (!list.length) return null; const m = instanced(mooredRigGeo(dry), kit.solid2[2], list.map(() => M4()), list.map((q) => tint(q.sail[0], q.sail[1], q.sail[2])), 'moored rigs'); m.userData.kind = 'body'; m.userData.list = list; m.frustumCulled = false; g.add(m); return m; });
  await ctx.yield();
  const sails = [1, -1].map((side) => { if (!fleet.length) return null; const m = instanced(setSailsGeo(side), kit.solid2[2], fleet.map(() => M4()), fleet.map((q) => tint(q.sail[0], q.sail[1], q.sail[2])), 'sails'); m.userData.kind = 'body'; m.userData.list = fleet; m.userData.side = side; m.frustumCulled = false; g.add(m); return m; });
  for (const m of hm.concat(rigs, sails)) if (m) { m.userData.sway = 0.5; m.userData.fleet = fleet.map((q) => q.course); }
  // ON THE CLOCK: every boat's place, heading, heave on the swell, roll and pitch; the fleet's wakes handed to the water
  const mat = new Map(), zero = M4().makeScale(0, 0, 0);
  const tick = (dt, t) => {
    for (const q of all) {
      let x, z, ry, heel = 0, k = 1;
      if (q.course) {
        coursePos(q.course, t, _c); x = _c.x; z = _c.z;
        coursePos(q.course, t + 0.5, _f);
        const hx = _f.x - x, hz = _f.z - z, hl = Math.hypot(hx, hz) || 1;
        ry = Math.atan2(hx, hz);
        // the boat's +x in the world, and how squarely the wind takes it
        const lee = WIND_TO[0] * Math.cos(ry) - WIND_TO[1] * Math.sin(ry);
        q.side = lee >= 0 ? 1 : -1;
        heel = -0.24 * lee - 0.04 * q.side;
        const wk = E.wake[fleet.indexOf(q)];
        if (wk) { const wl = Math.min(1, Math.max(0.25, 0.5 * (q.course.rx + q.course.rz) / 90)); wk.set(x - hx / hl * 3.6, z - hz / hl * 3.6, hx / hl * wl, hz / hl * wl); }
      } else if (q.buoy) {
        // (the home-coming boat on her mooring: 4 m downwind of the buoy, swinging up to 16 degrees either way to her chain)
        const a = 0.22 * Math.sin(t * 0.11 + q.swing) + 0.06 * Math.sin(t * 0.37 + 2.0 * q.swing), dx = WIND_TO[0] * Math.cos(a) - WIND_TO[1] * Math.sin(a), dz = WIND_TO[0] * Math.sin(a) + WIND_TO[1] * Math.cos(a);
        x = q.buoy[0] + dx * 4; z = q.buoy[1] + dz * 4; ry = Math.atan2(-dx, -dz); k = q.calm;
      } else { x = q.x; z = q.z; ry = q.ry; k = q.calm; }
      const y = SEA_Y + 0.05 + k * swellAt(x, z, t);
      _e.set(k * 0.07 * Math.sin(t * 0.83 + q.ph), ry, heel + k * 0.10 * Math.sin(t * 0.61 + q.ph * 1.7), 'YXZ');
      let m = mat.get(q);
      if (!m) mat.set(q, m = M4());
      m.compose(_c.set(x, y, z), _q.setFromEuler(_e), _s1);
    }
    for (const mesh of hm.concat(rigs, sails)) {
      if (!mesh) continue;
      const L = mesh.userData.list, sd = mesh.userData.side;
      for (let i = 0; i < L.length; i++) mesh.setMatrixAt(i, sd && L[i].side !== sd ? zero : mat.get(L[i]));
      mesh.instanceMatrix.needsUpdate = true;
    }
  };
  tick(0, 0);
  E.tick.push(tick);
  await ctx.yield();
}
// smoke from the chimneys: thin streaks that rise, lean with the breeze and thin away; drawn by noise that climbs
// along them on the clock, soft to nothing at every edge
const SMOKE_BODY = /* glsl */`
  float u = vUV.x, v = vUV.y, airK = 1.0;
  float n = 0.6 * fbm(vec2(u * 1.3 + vW.x * 0.07, v * 5.0 - uTime * 0.32)) + 0.4 * vn(vec2(u * 3.0, v * 13.0 - uTime * 0.7));
  float e = 1.0 - u * u;
  float alpha = e * e * smoothstep(0.0, 0.07, v) * (1.0 - v) * (1.0 - v) * smoothstep(0.22, 0.62, n) * 0.62;
  PL L = placeLight(uPlace);
  vec3 col = vec3(0.50, 0.47, 0.50) * (L.sc * 0.55 + L.sky * 1.6);
`;
// THE SEA'S FAR THINGS: the stacks, the far headland with its lighthouse, the small steamer far out. (The houses that
// stood along the cliff's top in round two are gone: the town behind the harbour wall is buildTown's.)
async function buildSeaFar(E) {
  const { kit, ctx } = E, g = E.G[2], rnd = E.rng.sea, zc = PLANES[2].c[2];
  let b = new Bld();
  for (const [sx, sz, sr, sh] of STACKS) {
    // (a crag in facets: ten uneven lifts, each ring's reach by noise and by three flutes that run its whole height)
    const NL = 10, seg = 15, ring = [];
    for (let l = 0; l <= NL; l++) {
      const q = l / NL, y = l ? sh * Math.pow(q, 0.9) + (l < NL ? 0.35 * sh / NL * (hsh(l, sx) - 0.5) : 0) : -6, k = (1 - 0.6 * Math.pow(q, 1.5)) * (l % 3 === 1 ? 0.86 : 1), row = [];
      for (let i = 0; i < seg; i++) {
        const a = i / seg * 6.2832 + 0.21 * l, n = 0.72 + 0.5 * fbmC(Math.cos(a) * 2 + sx, Math.sin(a) * 2 + l * 0.9, 2) + 0.14 * Math.sin(3 * a + sx);
        row.push([sx + 0.05 * sr * l + Math.cos(a) * sr * k * n, y, sz + Math.sin(a) * sr * k * n]);
      }
      ring.push(row);
    }
    // (the near stack keeps the law's clear air from the line at every corner of it, or the build stops here)
    if (sx === NEAR_STACK[0] && sz === NEAR_STACK[1]) {
      const least = Math.min(...ring.flat().map((p) => E.lineNear(2, p[0], p[1], p[2])));
      if (!(least >= 2.6)) throw new Error('the near stack stands ' + least.toFixed(2) + ' m from the line');
      E.nearStackAir = least;
    }
    for (let l = 0; l < NL; l++) for (let i = 0; i < seg; i++) {
      const j = (i + 1) % seg, sh2 = (0.62 + 0.6 * hsh(i * 7 + l * 31, sx)) * (0.8 + 0.3 * Math.sin(l * 1.9 + 0.4 * i)) * (l > NL - 4 ? 1.35 : 1), wet = l === 0 ? 0.4 : 1;
      b.c([C_CLIFF[0] * sh2 * wet, C_CLIFF[1] * sh2 * wet, C_CLIFF[2] * sh2 * wet], KIND.ROCK, 1);
      if ((i + l) % 2) { b.tri(ring[l][j], ring[l][i], ring[l + 1][i]); b.tri(ring[l][j], ring[l + 1][i], ring[l + 1][j]); } else { b.tri(ring[l][j], ring[l][i], ring[l + 1][j]); b.tri(ring[l][i], ring[l + 1][i], ring[l + 1][j]); }
    }
    b.c(lin('#4c5c34'), KIND.TURF);
    b.cyl(sx + 0.05 * sr * NL, sz, sr * 0.42, sr * 0.2, sh - 0.3, sh + 0.7, 9, 'Y');
  }
  await ctx.yield();
  // the headland: a long ridge from far in the east to its tip, the lighthouse on the tip
  const HP = (q) => [900 + 1700 * q, -1010 - 520 * q - 160 * Math.sin(q * 2.6)], NH = 22;
  for (let i = 0; i < NH; i++) {
    const q0 = i / NH, q1 = (i + 1) / NH, A = HP(q0), B = HP(q1), w0 = 40 + 240 * Math.sqrt(q0), w1 = 40 + 240 * Math.sqrt(q1);
    const h0 = (16 + 70 * q0) * (0.6 + 0.8 * fbmC(q0 * 9, 2.2, 2)), h1 = (16 + 70 * q1) * (0.6 + 0.8 * fbmC(q1 * 9, 2.2, 2));
    b.c(lin('#3a3c50'), KIND.HILL);
    b.quad([A[0] - 0.3 * w0, -2, A[1] + w0], [B[0] - 0.3 * w1, -2, B[1] + w1], [B[0], h1, B[1]], [A[0], h0, A[1]]);
    b.quad([A[0], h0, A[1]], [B[0], h1, B[1]], [B[0] + 0.3 * w1, -2, B[1] - w1], [A[0] + 0.3 * w0, -2, A[1] - w0]);
    if (!i) b.tri([A[0] - 0.3 * w0, -2, A[1] + w0], [A[0], h0, A[1]], [A[0] + 0.3 * w0, -2, A[1] - w0]);
  }
  const LH = HP(0.03), ly0 = 14;
  b.c(lin('#e8e0d0', 0.9), KIND.PLAIN);
  b.cyl(LH[0], LH[1], 4.6, 3.0, ly0, ly0 + 36, 12, '');
  b.c(C_IRON, KIND.PLAIN);
  b.cyl(LH[0], LH[1], 4.2, 4.2, ly0 + 36, ly0 + 36.6, 12, 'Yy');
  b.cyl(LH[0], LH[1], 2.8, 0.3, ly0 + 41, ly0 + 43.5, 12, '');
  b.c([6.0, 5.6, 4.6], KIND.FLASH, 1);
  b.cyl(LH[0], LH[1], 2.5, 2.5, ly0 + 36.6, ly0 + 41, 12, '');
  const fm = b.mesh(kit.solid2[2], 'stacks and headland');
  fm.userData.kind = 'body';
  g.add(fm);
  await ctx.yield();
  // the small steamer far out to the north: on a wide slow course of the clock, its place on it drawn from the seed
  b = new Bld();
  b.c(lin('#1c2430', 1.2), KIND.PLAIN);
  for (const sd of [-1, 1]) for (let i = 0; i < 8; i++) {
    const S = (t) => { const w = 3.4 * Math.pow(Math.sin(Math.PI * Math.min(1, 0.04 + 0.96 * Math.pow(t, 0.7))), 0.5); return [sd * w, (t - 0.5) * 36]; }, A = S(i / 8), B = S((i + 1) / 8);
    if (sd > 0) b.quad([A[0], -1, A[1]], [A[0], 2.6, A[1]], [B[0], 2.6, B[1]], [B[0], -1, B[1]]); else b.quad([A[0], -1, A[1]], [B[0], -1, B[1]], [B[0], 2.6, B[1]], [A[0], 2.6, A[1]]);
    b.tri([0, 2.6, A[1]], sd > 0 ? [B[0], 2.6, B[1]] : [A[0], 2.6, A[1]], sd > 0 ? [A[0], 2.6, A[1]] : [B[0], 2.6, B[1]]);
  }
  b.c(lin('#e8e0d0', 0.8), KIND.WINDOWS, 0.85);
  for (const [x0, y0, z0, x1, y1, z1] of [[-2.4, 2.6, -8, 2.4, 5.2, 6]]) { b.quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], 0, 0.3); b.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], 0, 0.3); b.c(lin('#e8e0d0', 0.8), KIND.PLAIN); b.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]); b.quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]); b.quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]); }
  b.c(lin('#c8a060'), KIND.PLAIN);
  b.cyl(0, -1.5, 1.0, 1.0, 5.2, 9.2, 10, '');
  b.c([0.02, 0.02, 0.02], KIND.PLAIN);
  b.cyl(0, -1.5, 1.02, 1.02, 9.2, 10.4, 10, 'Y');
  for (const z of [11, -13]) b.cyl(0, z, 0.12, 0.08, 2.6, 11, 5, 'Y');
  b.c([1.0, 0.85, 0.6], KIND.GLOW, 6);
  for (const z of [11, -13]) b.blob(0, 11.2, z, 0.28, 0.28, 0.28, 6, 4);
  const steamer = b.mesh(kit.solid2[2], 'steamer');
  steamer.userData.kind = 'body'; steamer.frustumCulled = false;
  g.add(steamer);
  const sc = { c: [-150, 0, -1160], rx: 430, rz: 150, w: 0.0075, ph: 6.2832 * rnd(), bob: 0 };
  const stick = (dt, t) => {
    coursePos(sc, t, _c); coursePos(sc, t + 2, _f);
    const hx = _f.x - _c.x, hz = _f.z - _c.z, hl = Math.hypot(hx, hz) || 1;
    steamer.position.set(_c.x, 0.1 + 0.3 * swellAt(_c.x, _c.z, t), _c.z); steamer.rotation.set(0.012 * Math.sin(t * 0.5), Math.atan2(hx, hz), 0.02 * Math.sin(t * 0.37), 'YXZ');
    E.wake[NWAKE - 1].set(_c.x - hx / hl * 17, _c.z - hz / hl * 17, hx / hl, hz / hl);
  };
  stick(0, 0);
  E.tick.push(stick);
  await ctx.yield();
}
// THE SEA'S BIRDS: gulls wheeling high over the harbour, round the stacks (rising and stooping) and about the islet.
// The seed deals their number and their courses. (Round two's white splash dots at the stacks' feet are gone, the
// lead's C4: the sea's own foam breaks round every stack by place.)
async function buildSeaLife(E) {
  const { kit, ctx } = E, g = E.G[2], rnd = E.rng.sea;
  const gulls = [], add = (make) => { const c = dealCourse(E, 2, make); if (c) gulls.push(c); };
  const nH = 7 + Math.floor(rnd() * 5);
  for (let i = 0; i < nH; i++) add(() => ({ c: [-22 + 30 * (rnd() - 0.5), 13 + 10 * rnd(), -226 - 40 * rnd()], rx: 10 + 16 * rnd(), rz: 12 + 20 * rnd(), w: (0.22 + 0.16 * rnd()) * (rnd() < 0.5 ? -1 : 1), ph: rnd() * 6.283, bob: 1.5, size: 1.25, beat: 2.6 + rnd(), tint: 0.8 + 0.3 * rnd(), eight: rnd() < 0.3 }));
  await ctx.yield();
  for (const [sx, sz, sr, sh] of STACKS) {
    // (the near stack: seven and more, wheeling close about its head, dealt on a stream of their own, 'gulls of the near
    // stack' (round three c), so that the stack's place and the line's moves re-deal only them)
    const small = sr < 5, rnd = sx === NEAR_STACK[0] && sz === NEAR_STACK[1] ? E.named('gulls of the near stack') : E.rng.sea, n = small ? 7 + Math.floor(rnd() * 3) : 4 + Math.floor(rnd() * 4);
    for (let i = 0; i < n; i++) add(() => { const r = small ? sr + 1.5 + 5 * rnd() : sr + 6 + 14 * rnd(); return { c: [sx, small ? 8 + 7 * rnd() : sh * (0.35 + 0.6 * rnd()), sz], rx: r, rz: r * (0.8 + 0.4 * rnd()), w: (small ? 0.45 + 0.3 * rnd() : 0.16 + 0.14 * rnd()) * (rnd() < 0.5 ? -1 : 1), ph: rnd() * 6.283, bob: small ? 1.2 : 0.3 * sh * rnd(), size: 1.25, beat: 2.6 + rnd(), tint: 0.8 + 0.3 * rnd() }; });
  }
  await ctx.yield();
  const nI = 4 + Math.floor(rnd() * 4);
  for (let i = 0; i < nI; i++) add(() => ({ c: [ISLET[0] + 10 * (rnd() - 0.5), 17 + 9 * rnd(), ISLET[1] + 10 * (rnd() - 0.5)], rx: 20 + 18 * rnd(), rz: 20 + 18 * rnd(), w: (0.14 + 0.12 * rnd()) * (rnd() < 0.5 ? -1 : 1), ph: rnd() * 6.283, bob: 2.0, size: 1.25, beat: 2.6 + rnd(), tint: 0.8 + 0.3 * rnd() }));
  flock(E, 2, wingedGeo([1.0, 1.0, 1.0], { wide: true }), gulls, 'gulls');
  await ctx.yield();
}
const C_QUAY = lin('#8a8078'), C_IRON = [0.03, 0.035, 0.04], C_RED = feed('#ff4030', 5.0), C_GREEN = feed('#30e080', 5.0);
const cliffTop = (x) => 24 + 9 * fbmC(x * 0.03, 3.3, 3);
// THE HARBOUR WALL (round two, the lead's C4): east of the harbour the cliff's lower lift is a built wall of coursed
// stone, 220 m long and 11.5 m high over the sea, with a foot quay; sixteen bays between buttresses; in the bays arched
// boat stores with timber doors and a lit lamp over each arch, two long flights of steps up to the walk on its top, nets
// on racks, small boats at the quay. The same on every seed but for which doors stand open. (Round three, the lead's
// C2: what reads at the flight's distances is built: a string course 0.45 m proud and a coping 0.3 m proud over the
// parapet, each with its underside; buttresses 1.2 m proud, their faces lighter than their flanks; the stores 3.2 m
// deep, their reveals darkening inward; and at the quay's face the wet band: dark stone under the water, a band of
// weed with a ragged lower fringe at the waterline, wet stone above it.)
async function harbourWall(E) {
  const { kit, ctx } = E, g = E.G[2], rnd = E.rng.sea, W = WALL, bw = (W.x1 - W.x0) / W.bays, zf = W.z, T = W.top;
  const b = new Bld(), stone = (k) => b.c([C_QUAY[0] * k, C_QUAY[1] * k, C_QUAY[2] * k], KIND.STONE);
  // the foot quay, the string course, the parapet, the end piers (the walk behind the parapet is the town's, see buildTown)
  stone(0.92);
  b.box(W.x0, W.quayY - 0.6, W.quayZ, W.x1, W.quayY, zf, 'yzxXZ');
  // (the quay's face and ends, in bands from the sea's floor to the dry stone; the weed's fringe hangs from its band)
  const bands = [[-5, SEA_Y + 0.15, 0.2, KIND.STONE], [SEA_Y + 0.15, SEA_Y + 0.85, -1, KIND.LEAVES], [SEA_Y + 0.85, SEA_Y + 1.3, 0.45, KIND.STONE], [SEA_Y + 1.3, W.quayY, 0.92, KIND.STONE]];
  for (const [y0, y1, k, kind] of bands) {
    if (k < 0) b.c(lin('#283018', 0.8), kind); else b.c([C_QUAY[0] * k, C_QUAY[1] * k, C_QUAY[2] * k], kind);
    b.quad([W.x1, y0, W.quayZ], [W.x0, y0, W.quayZ], [W.x0, y1, W.quayZ], [W.x1, y1, W.quayZ], -W.x1, y0);
    b.quad([W.x0, y0, W.quayZ], [W.x0, y0, zf], [W.x0, y1, zf], [W.x0, y1, W.quayZ], W.quayZ, y0);
    b.quad([W.x1, y0, zf], [W.x1, y0, W.quayZ], [W.x1, y1, W.quayZ], [W.x1, y1, zf], -zf, y0);
  }
  b.c(lin('#1e2612', 0.8), KIND.LEAVES);
  for (let x = W.x0; x < W.x1 - 0.1; x += 0.7) {
    const x1 = Math.min(W.x1, x + 0.7), dn = 0.25 + 0.45 * hsh(x, 13);
    b.tri([x, SEA_Y + 0.2, W.quayZ - 0.03], [x1, SEA_Y + 0.2, W.quayZ - 0.03], [x + 0.35 + 0.2 * (hsh(x, 17) - 0.5), SEA_Y + 0.2 - dn, W.quayZ - 0.03]);
  }
  stone(1.08);
  b.box(W.x0, T - 0.4, zf - 0.45, W.x1, T, zf, '');
  b.box(W.x0, T, zf - 0.06, W.x1, T + 0.95, zf + 0.4, 'y');
  stone(1.22);
  b.box(W.x0, T + 0.95, zf - 0.36, W.x1, T + 1.25, zf + 0.7, '');
  stone(1.0);
  for (const x of [W.x0 - 1.2, W.x1 - 0.8]) b.box(x, -6, zf - 0.5, x + 2.0, T + 1.5, zf + 3.4, 'y');
  for (let i = 0; i < W.bays; i++) {
    const xa = W.x0 + i * bw, xb = xa + bw, cx = (xa + xb) / 2, stair = W.stairs.includes(i), k = 0.92 + 0.14 * hsh(i, 71);
    // the buttress at the bay's west side: 1.5 m wide, 1.2 m proud, a sloped head under the string course; its face
    // lighter than its flanks
    const bp = 1.2, bt = T - 2.4;
    stone(k * 1.14);
    b.box(xa - 0.75, W.quayY - 0.2, zf - bp, xa + 0.75, bt, zf, 'yZXxY');
    b.quad([xa - 0.75, bt, zf - bp], [xa + 0.75, bt, zf - bp], [xa + 0.75, T - 0.4, zf], [xa - 0.75, T - 0.4, zf], xa, 0);
    stone(k * 0.74);
    b.box(xa - 0.75, W.quayY - 0.2, zf - bp, xa + 0.75, bt, zf, 'yZzY');
    b.tri([xa - 0.75, bt, zf], [xa - 0.75, bt, zf - bp], [xa - 0.75, T - 0.4, zf]);
    b.tri([xa + 0.75, bt, zf - bp], [xa + 0.75, bt, zf], [xa + 0.75, T - 0.4, zf]);
    stone(k);
    if (stair) {
      // a long flight up the wall's face, 1.3 m wide, from the quay to the walk
      b.quad([xb, -6, zf], [xa, -6, zf], [xa, T, zf], [xb, T, zf], -xb, -6);
      const n = 40, x0 = xa + 1.0, run = bw - 2.0;
      stone(k * 1.1);
      for (let j = 0; j < n; j++) b.box(x0 + run * j / n, W.quayY, zf - 1.3, x0 + run * (j + 1) / n, W.quayY + (T - W.quayY) * (j + 1) / n, zf, 'yZ');
      b.c(C_IRON, KIND.PLAIN);
      b.tube([[x0, W.quayY + 1.2, zf - 1.26], [x0 + run, T + 1.0, zf - 1.26]], 0.03, 4);
      for (let j = 0; j <= 8; j++) { const q = j / 8; b.tube([[x0 + run * q, W.quayY + (T - W.quayY) * q, zf - 1.26], [x0 + run * q, W.quayY + (T - W.quayY) * q + 1.1, zf - 1.26]], 0.022, 3); }
    } else {
      // the bay's face with the arch of its boat store (3.6 m wide, springing 2.2 m over the quay, half-round)
      const r = 1.8, sp = W.quayY + 2.2, dp = 3.2, NA = 10;
      b.quad([cx - r, -6, zf], [xa, -6, zf], [xa, T, zf], [cx - r, T, zf], -cx + r, -6);
      b.quad([xb, -6, zf], [cx + r, -6, zf], [cx + r, T, zf], [xb, T, zf], -xb, -6);
      for (let j = 0; j < NA; j++) {
        const a0 = Math.PI * j / NA, a1 = Math.PI * (j + 1) / NA, p0 = [cx + r * Math.cos(a0), sp + r * Math.sin(a0)], p1 = [cx + r * Math.cos(a1), sp + r * Math.sin(a1)];
        stone(k);
        b.quad([p0[0], p0[1], zf], [p1[0], p1[1], zf], [p1[0], T, zf], [p0[0], T, zf], -p0[0], p0[1]);
        // (the soffit, darkening inward, and the arch's ring of longer stones proud of the face)
        stone(k * 0.5);
        b.quad([p0[0], p0[1], zf + dp / 2], [p1[0], p1[1], zf + dp / 2], [p1[0], p1[1], zf], [p0[0], p0[1], zf], a0, 0);
        stone(k * 0.22);
        b.quad([p0[0], p0[1], zf + dp], [p1[0], p1[1], zf + dp], [p1[0], p1[1], zf + dp / 2], [p0[0], p0[1], zf + dp / 2], a0, 0);
        stone(k * 1.16);
        const o0 = [cx + (r + 0.42) * Math.cos(a0), sp + (r + 0.42) * Math.sin(a0)], o1 = [cx + (r + 0.42) * Math.cos(a1), sp + (r + 0.42) * Math.sin(a1)];
        b.quad([p0[0], p0[1], zf - 0.07], [p1[0], p1[1], zf - 0.07], [o1[0], o1[1], zf - 0.07], [o0[0], o0[1], zf - 0.07], a0, 0);
      }
      for (const [za, zb, kk] of [[zf, zf + dp / 2, 0.5], [zf + dp / 2, zf + dp, 0.22]]) {
        stone(k * kk);
        b.quad([cx - r, W.quayY, zb], [cx - r, W.quayY, za], [cx - r, sp, za], [cx - r, sp, zb]);
        b.quad([cx + r, W.quayY, za], [cx + r, W.quayY, zb], [cx + r, sp, zb], [cx + r, sp, za]);
        b.quad([cx - r, W.quayY, zb], [cx + r, W.quayY, zb], [cx + r, W.quayY, za], [cx - r, W.quayY, za], cx, 0);
      }
      // the doors: two leaves of tarred boards; one in three stands open on the dark of the store
      const open = rnd() < 0.34, door = (x0, x1) => b.quad([x1, W.quayY, zf + dp - 0.02], [x0, W.quayY, zf + dp - 0.02], [x0, sp + r, zf + dp - 0.02], [x1, sp + r, zf + dp - 0.02], x0, 0);
      b.c([0.10, 0.075, 0.05], KIND.BOARDS);
      door(cx - r, open ? cx : cx + r);
      if (open) { b.c([0.012, 0.012, 0.016], KIND.PLAIN); door(cx, cx + r); }
      // the lamp over the arch on an iron bracket, lit
      b.c(C_IRON, KIND.PLAIN);
      b.tube([[cx, sp + r + 1.25, zf], [cx, sp + r + 1.35, zf - 0.55], [cx, sp + r + 1.1, zf - 0.6]], 0.03, 4);
      b.cyl(cx, zf - 0.6, 0.17, 0.05, sp + r + 1.08, sp + r + 1.2, 6, 'Y');
      b.c([1.0, 0.70, 0.34], KIND.GLOW, 7);
      b.blob(cx, sp + r + 0.93, zf - 0.6, 0.13, 0.16, 0.13, 6, 4);
    }
    // a bollard on the quay's edge; in two bays a net on a rack
    b.c(C_IRON, KIND.PLAIN);
    b.cyl(xa + 3, W.quayZ + 0.4, 0.17, 0.2, W.quayY, W.quayY + 0.45, 7, 'Y');
    if (W.nets.includes(i)) {
      b.c([0.16, 0.12, 0.09], KIND.BARK);
      for (const x of [cx - 5.2, cx - 2.8]) b.cyl(x, zf - 2.3, 0.06, 0.05, W.quayY, W.quayY + 2.1, 5, 'Y');
      b.tube([[cx - 5.2, W.quayY + 2.05, zf - 2.3], [cx - 2.8, W.quayY + 2.05, zf - 2.3]], 0.04, 5);
      b.c([0.34, 0.25, 0.15], KIND.NET, 0, 0.03);
      for (let j = 0; j < 4; j++) { const x0 = cx - 5.1 + 0.55 * j, x1 = x0 + 0.55; b.quad([x0, W.quayY + 2.02, zf - 2.3], [x1, W.quayY + 2.02, zf - 2.3], [x1, W.quayY + 0.3, zf - 2.75], [x0, W.quayY + 0.3, zf - 2.75], x0, 0); b.quad([x1, W.quayY + 2.02, zf - 2.3], [x0, W.quayY + 2.02, zf - 2.3], [x0, W.quayY + 0.6, zf - 1.95], [x1, W.quayY + 0.6, zf - 1.95], -x1, 0); }
    }
    if (i % 4 === 3) await ctx.yield();
  }
  // four small boats lying at the quay
  for (const [x, col] of [[22, [0.60, 0.58, 0.52]], [61, [0.16, 0.30, 0.34]], [118, [0.55, 0.20, 0.14]], [170, [0.60, 0.58, 0.52]]]) {
    b.push(M4().makeTranslation(x, SEA_Y - 0.12, W.quayZ - 1.3).multiply(M4().makeRotationY(1.5708 + 0.1 * (hsh(x, 3) - 0.5))));
    buildBoat(b, col);
    b.pop();
  }
  const wm = b.mesh(kit.solid2[2], 'harbour wall');
  wm.userData.kind = 'body';
  g.add(wm);
  await ctx.yield();
}
// THE TOWN (round three, the lead's C1): behind the harbour wall the cliff's upper lift gives way to a hill, and the
// town climbs it: a street on the quay behind the wall's parapet, then four terraces up the hill, each a lane with a
// row of houses standing along it and a stone-faced bank behind, the next row 6.4 m higher; three flights of steps run
// straight up the hill through gaps left in every row, evenly along the wall (at its quarters: round three b, T2).
// Houses of two or three storeys (6.3 or 9.0 m to the eaves), 6 to 10 m wide, whitewashed, stone or colour-washed,
// slate roofs, a chimney or two on the ridge; some windows lit in the dusk, some chimneys smoking. Between the wall's
// ends the hill meets the cliff's turf at the cliff's own height, so the cliff runs on into the town's two shoulders.
// The hill, the terraces and the steps stand on every seed; the seed (its own fork 'town') deals each house's width,
// height, wash, roof, chimneys, lit share and smoke.
const TOWN = { z0: WALL.z + 2.6, pitch: 16, step: 6.4, rows: 5, bank: 0.72, back: -96, stairs: [1, 2, 3].map((k) => WALL.x0 + (WALL.x1 - WALL.x0) * k / 4) };
const townBase = (z) => {
  const s = (z - TOWN.z0) / TOWN.pitch;
  if (s <= 0) return WALL.top;
  if (s >= TOWN.rows) return WALL.top + TOWN.step * TOWN.rows + 0.22 * (z - TOWN.z0 - TOWN.rows * TOWN.pitch);
  const k = Math.floor(s), f = s - k;
  return WALL.top + TOWN.step * (k + Math.max(0, f - TOWN.bank) / (1 - TOWN.bank));
};
// (the shoulders: at the wall's two ends the ground is the cliff's top, and it falls to the town's within 16 m)
const townShoulder = (x) => smoothstep(2, 16, Math.min(x - WALL.x0, WALL.x1 - x));
const townY = (x, z) => { const m = townShoulder(x), b = townBase(z); return Math.max(b, cliffTop(x) * (1 - m) + b * m); };
async function buildTown(E, zN) {
  const { kit, ctx } = E, g = E.G[2], rnd = E.rng.town, W = WALL;
  let b = new Bld();
  // the ground: the walk behind the parapet, the face of rock or of coursed stone where the ground stands above the
  // walk, then the hill in a grid whose rows follow the terraces' edges exactly
  const xs = cuts(W.x0, W.x1, TOWN.stairs.flatMap((x) => [x - 1.7, x + 1.7]), 4.4), zs = [];
  for (let k = 0; k <= TOWN.rows; k++) {
    const z = TOWN.z0 + TOWN.pitch * k;
    if (k) zs.push(z);
    if (k < TOWN.rows) for (const f of [TOWN.bank, 0.86]) zs.push(z + TOWN.pitch * f);
  }
  for (let z = TOWN.z0 + TOWN.pitch * TOWN.rows + 6; z < TOWN.back; z += 6) zs.push(z);
  zs.push(TOWN.back);
  // (steep ground is rock on the shoulders and a coursed stone face in the town; the terraces' level ground is the
  // lanes' paving; the rest turf)
  const col = (xa, xb, z0, z1) => {
    const ys = [townY(xa, z0), townY(xb, z0), townY(xa, z1), townY(xb, z1)], town = townShoulder(xa) > 0.95 && townShoulder(xb) > 0.95;
    const sl = Math.max(Math.abs(ys[1] - ys[0]) / (xb - xa), Math.abs(ys[2] - ys[0]) / Math.max(0.5, z1 - z0));
    if (sl > 0.9) return town ? b.c([C_QUAY[0] * 0.85, C_QUAY[1] * 0.85, C_QUAY[2] * 0.85], KIND.STONE) : b.c(C_CLIFF, KIND.ROCK, 1);
    if (sl < 0.12 && town && z1 < TOWN.z0 + TOWN.pitch * TOWN.rows + 1) return b.c([C_QUAY[0] * 0.8, C_QUAY[1] * 0.8, C_QUAY[2] * 0.8], KIND.FLAGS);
    return b.c(lin('#4c5c34'), KIND.TURF, 0);
  };
  for (let i = 0; i < xs.length - 1; i++) {
    const xa = xs[i], xb = xs[i + 1], za = zN(xa), zb = zN(xb), ya = townY(xa, za), yb = townY(xb, zb);
    b.c([C_QUAY[0] * 0.8, C_QUAY[1] * 0.8, C_QUAY[2] * 0.8], KIND.STONE);
    b.quad([xb, W.top, W.z], [xa, W.top, W.z], [xa, W.top, za], [xb, W.top, zb], xa, 0);
    if (ya > W.top + 0.05 || yb > W.top + 0.05) { b.c(C_CLIFF, KIND.ROCK, 1); b.quad([xb, W.top - 0.5, zb], [xa, W.top - 0.5, za], [xa, ya, za], [xb, yb, zb], -xb, W.top); }
    let pa = [xa, ya, za], pb = [xb, yb, zb];
    for (const z of zs) {
      if (z <= Math.max(za, zb) + 0.3) continue;
      const qa = [xa, townY(xa, z), z], qb = [xb, townY(xb, z), z];
      col(xa, xb, Math.max(pa[2], pb[2]), z);
      b.quad(pb, pa, qa, qb, xa, pa[2]);
      pa = qa; pb = qb;
    }
    if (i % 10 === 9) await ctx.yield();
  }
  // the steps: in every bank, at each of the three gaps, a straight flight of stone between low cheek walls
  b.c(lin('#9a9088'), KIND.STONE);
  for (const sx of TOWN.stairs) for (let k = 0; k < TOWN.rows; k++) {
    const za = TOWN.z0 + TOWN.pitch * (k + TOWN.bank), zb = TOWN.z0 + TOWN.pitch * (k + 1), ya = townBase(za), n = 16, r = TOWN.step / n, t = (zb - za) / n;
    for (let j = 0; j < n; j++) {
      const z = za + t * j, y = ya + r * j;
      b.quad([sx + 1.2, y - 0.05, z], [sx - 1.2, y - 0.05, z], [sx - 1.2, y + r, z], [sx + 1.2, y + r, z], -sx, y);
      b.quad([sx + 1.2, y + r, z + t], [sx + 1.2, y + r, z], [sx - 1.2, y + r, z], [sx - 1.2, y + r, z + t], sx, z);
    }
    for (const sd of [-1, 1]) {
      const x = sx + sd * 1.45, x2 = sx + sd * 1.2;
      const lo = [[x, ya - 0.1, za], [x, ya + TOWN.step - 0.1, zb]], hi = [[x, ya + 0.75, za], [x, ya + TOWN.step + 0.75, zb]];
      if (sd < 0) b.quad(lo[0], lo[1], hi[1], hi[0], za, ya); else b.quad(lo[1], lo[0], hi[0], hi[1], -zb, ya);
      const xw = Math.min(x, x2), xe = Math.max(x, x2);
      b.quad([xe, ya + 0.75, za], [xw, ya + 0.75, za], [xw, ya + TOWN.step + 0.75, zb], [xe, ya + TOWN.step + 0.75, zb], xw, za);
    }
  }
  const gm = b.mesh(kit.solid2[2], 'town hill');
  gm.userData.kind = 'body';
  g.add(gm);
  await ctx.yield();
  // the houses, row by row along the lanes; the smoke of the chimneys in its own soft mesh
  b = new Bld();
  const sb = new Bld(), WASH = [lin('#ece4d4', 0.85), lin('#e4dccc', 0.8), lin('#8c8680'), lin('#7c7670'), lin('#d8c8a0', 0.8), lin('#c8aca0', 0.8), lin('#a8b4b8', 0.8)];
  const DOOR = [[0.05, 0.10, 0.08], [0.04, 0.06, 0.12], [0.16, 0.04, 0.03], [0.02, 0.02, 0.02]];
  let nh = 0;
  for (let k = 0; k <= TOWN.rows; k++) {
    const zr = TOWN.z0 + TOWN.pitch * k + 3.0, yb = townBase(zr);
    for (let x = W.x0 + 16 + 4 * rnd(); x < W.x1 - 24;) {
      const w = 6 + 4 * rnd(), x1 = x + w, n = rnd() < 0.55 ? 2 : 3, e = 0.9 + 2.7 * n, d = 7 + 1.5 * rnd(), gap = rnd() < 0.35 ? 1.2 + 2 * rnd() : 0;
      const stair = TOWN.stairs.find((s) => x1 > s - 1.9 && x < s + 1.9);
      if (stair != null) { x = stair + 1.9 + 0.5 * rnd(); continue; }
      // (on the top terrace the houses stand apart; nowhere does a house stand on a shoulder's slope)
      if ((k === TOWN.rows && rnd() < 0.5) || townShoulder(x) < 0.97 || townShoulder(x1) < 0.97) { x = x1 + gap + 1.5; continue; }
      const cx = (x + x1) / 2, z0 = zr, z1 = zr + d, zm = zr + d / 2, rf = 0.68 * d / 2, ye = yb + e, yr = ye + rf, wash = WASH[Math.floor(rnd() * WASH.length)];
      const nc = Math.floor(w / 2.3), u0 = -(w - nc * 2.3) / 2, lit = 0.12 + 0.3 * rnd();
      b.c(wash, KIND.WINDOWS, lit);
      b.quad([x1, yb - 0.6, z0], [x, yb - 0.6, z0], [x, ye, z0], [x1, ye, z0], u0, -1.1);
      b.c(wash, KIND.WINDOWS, lit * 0.5);
      b.quad([x, yb - 0.6, z0], [x, yb - 0.6, z1], [x, ye, z1], [x, ye, z0], 0.4, -1.1);
      b.quad([x1, yb - 0.6, z1], [x1, yb - 0.6, z0], [x1, ye, z0], [x1, ye, z1], 0.4, -1.1);
      b.c(wash, KIND.PLAIN);
      b.tri([x, ye, z1], [x, yr, zm], [x, ye, z0]);
      b.tri([x1, ye, z0], [x1, yr, zm], [x1, ye, z1]);
      b.c(DOOR[Math.floor(rnd() * DOOR.length)], KIND.PLAIN);
      const dx = x1 + u0 - 1.15 - 2.3 * Math.floor(rnd() * 2);
      b.quad([dx + 0.48, yb, z0 - 0.04], [dx - 0.48, yb, z0 - 0.04], [dx - 0.48, yb + 2.05, z0 - 0.04], [dx + 0.48, yb + 2.05, z0 - 0.04]);
      // the slate roof, its eaves 0.35 m out, its verges 0.3 m out
      const s = 0.82 + 0.3 * rnd();
      b.c([0.055 * s, 0.06 * s, 0.072 * s], KIND.PLAIN);
      b.quad([x1 + 0.3, ye - 0.25, z0 - 0.35], [x - 0.3, ye - 0.25, z0 - 0.35], [x - 0.3, yr, zm], [x1 + 0.3, yr, zm]);
      b.quad([x - 0.3, ye - 0.25, z1 + 0.35], [x1 + 0.3, ye - 0.25, z1 + 0.35], [x1 + 0.3, yr, zm], [x - 0.3, yr, zm]);
      // the chimneys: on the ridge at one gable or at both, of the house's own stone or brick; some smoke
      const two = rnd() < 0.4, first = rnd() < 0.5 ? -1 : 1;
      for (const sd of two ? [-1, 1] : [first]) {
        const ccx = sd < 0 ? x + 0.55 : x1 - 0.55, top = yr + 1.3 + 0.4 * rnd();
        b.c(rnd() < 0.5 ? lin('#8a6a5c') : wash, KIND.BRICK);
        b.box(ccx - 0.4, yr - 0.9, zm - 0.55, ccx + 0.4, top, zm + 0.55, 'y');
        b.c(lin('#7a4a3a'), KIND.PLAIN);
        b.cyl(ccx, zm, 0.13, 0.11, top, top + 0.35, 6, '');
        if (rnd() < 0.42) {
          // (the smoke's streak: up for 2 m, then leaning away east-south-east, 13 m long, widening)
          const NS = 8, base = sb.P.length / 3, ph = rnd() * 3, cy = top + 0.35;
          for (let j = 0; j <= NS; j++) {
            const q = j / NS, len = 13 * q, lx = ccx + 0.866 * 0.75 * len * q + 0.5 * Math.sin(q * 5 + ph), ly = cy + 2.2 * Math.sqrt(q) + 2.6 * q, wd = 0.3 + 1.5 * q;
            sb.sway = 0.9 * q;
            sb.v(lx - wd, ly, zm - 0.5 * q, 0, 0, -1, -1, q);
            sb.v(lx + wd, ly + 0.5 * wd, zm - 0.5 * q, 0, 0, -1, 1, q);
          }
          for (let j = 0; j < NS; j++) { const a = base + j * 2; sb.I.push(a, a + 1, a + 3, a, a + 3, a + 2); }
        }
      }
      nh++;
      x = x1 + gap;
      if (nh % 12 === 0) await ctx.yield();
    }
  }
  const houses = b.mesh(kit.solid2[2], 'town houses');
  houses.userData.kind = 'body';
  g.add(houses);
  const smoke = sb.mesh(kit.mat(2, { body: SMOKE_BODY, transparent: true, depthWrite: false, side: THREE.DoubleSide, tag: 'smoke' }), 'smoke');
  smoke.userData.kind = 'medium'; smoke.renderOrder = 5;
  g.add(smoke);
  E.nHouses = nh;
  await ctx.yield();
}
async function buildSea(E) {
  const { kit, ctx } = E, g = E.G[2], rnd = E.rng.sea;
  let b = new Bld();
  ringSheet(b, 40, -330, [0, 50, 120, 240, 480, 900, 1700, 3200], 64, -1);
  const water = b.mesh(E.water[2], 'sea');
  water.userData.kind = 'floor';
  g.add(water);
  b = new Bld();
  // THE HARBOUR'S CLIFF: a wall of rock in plane two, from under the sea to 24 m and more, x -120 to 320, in two lifts
  // with a ledge between them; the sea gate at its foot. (Its whole length and height stand on every seed.)
  const P2 = PLANES[2], zc = P2.c[2], gx = P2.c[0];
  const out = (x, k) => (0.4 + k * fbmC(x * 0.11, 1.0, 2) + 1.4 * fbmC(x * 0.37, 4.0, 2)) * smoothstep(9, 15, Math.abs(x - gx));
  const mid = (x) => 9.5 + 5 * fbmC(x * 0.05, 8.0, 2);
  const xs = cuts(-120, 320, [gx - 9, gx + 9, WALL.x0, WALL.x1], 5.5);
  for (let i = 0; i < xs.length - 1; i++) {
    const xa = xs[i], xb = xs[i + 1];
    if (xa >= gx - 9 && xb <= gx + 9) continue;
    const k = 0.88 + 0.24 * hsh(i, 3), inWall = xa >= WALL.x0 && xb <= WALL.x1;
    b.c([C_CLIFF[0] * k, C_CLIFF[1] * k, C_CLIFF[2] * k * (0.95 + 0.1 * hsh(i, 5))], KIND.ROCK, 1);
    const za = zc - 0.4 - out(xa, 4.2), zb = zc - 0.4 - out(xb, 4.2), ua = zc - 0.4 - out(xa, 1.6) * 0.5, ub = zc - 0.4 - out(xb, 1.6) * 0.5, ma = inWall ? WALL.top - 0.5 : mid(xa), mb = inWall ? WALL.top - 0.5 : mid(xb);
    // (east of the harbour the lower lift is the built wall, see harbourWall: the rock begins on its walk)
    if (!inWall) {
      b.quad([xb, -6, zb], [xa, -6, za], [xa, ma, za], [xb, mb, zb], -xb, -6);
      b.quad([xb, mb, zb], [xa, ma, za], [xa, ma, ua], [xb, mb, ub]);
    }
    // (and above the wall, its walk, the town's hill and the town: see buildTown)
    if (inWall) continue;
    b.quad([xb, mb, ub], [xa, ma, ua], [xa, cliffTop(xa), ua], [xb, cliffTop(xb), ub], -xb, mb);
    b.c(lin('#4c5c34'), KIND.TURF, 0);
    b.quad([xb, cliffTop(xb), ub], [xa, cliffTop(xa), ua], [xa, cliffTop(xa), zc + 14], [xb, cliffTop(xb), zc + 14]);
    if (i % 12 === 11) await ctx.yield();
  }
  b.c(C_CLIFF, KIND.ROCK);
  b.quad([-120, -6, zc + 0.2], [-120, -6, zc - 6], [-120, cliffTop(-120), zc - 6], [-120, cliffTop(-120), zc + 0.2]);
  b.quad([320, -6, zc - 6], [320, -6, zc + 0.2], [320, cliffTop(320), zc + 0.2], [320, cliffTop(320), zc - 6]);
  gateBack(b, 2, { hw: 9, bot: -9.2, top: 24 - P2.c[1], depth: 0.4, splay: 2.6, col: C_CLIFF, kind: KIND.STONE, colR: C_QUAY, kindR: KIND.STONE });
  b.c(C_CLIFF, KIND.ROCK);
  b.quad([gx + 9, cliffTop(gx + 9), zc - 0.4], [gx - 9, cliffTop(gx - 9), zc - 0.4], [gx - 9, cliffTop(gx - 9), zc + 0.2], [gx + 9, cliffTop(gx + 9), zc + 0.2]);
  b.quad([gx + 9, 24, zc - 0.4], [gx - 9, 24, zc - 0.4], [gx - 9, cliffTop(gx - 9), zc - 0.4], [gx + 9, cliffTop(gx + 9), zc - 0.4]);
  const cm = b.mesh(kit.solid2[2], 'cliff');
  cm.userData.kind = 'body';
  g.add(cm);
  await ctx.yield();
  await harbourWall(E);
  await buildTown(E, (x) => zc - 0.4 - out(x, 1.6) * 0.5);
  // THE HARBOUR: the slip behind the sea gate (stone, running down under the water: the line sinks over it), a quay
  // either side of it with steps, the two moles to their round pierheads at the harbour's mouth, a parapet on the west one
  b = new Bld();
  b.c(C_QUAY, KIND.STONE);
  b.quad([gx - 7.2, 0.5, zc], [gx + 7.2, 0.5, zc], [gx + 7.2, -1.5, zc - 6.5], [gx - 7.2, -1.5, zc - 6.5], gx - 7.2, 0);
  for (const sd of [-1, 1]) {
    const x = gx + sd * 7.2, t = [[x, 0.5, zc], [x, -1.5, zc - 6.5], [x, -5, zc - 6.5], [x, -5, zc]];
    b.quad(...(sd > 0 ? t.slice().reverse() : t));
    // the quay between the slip and the mole, and four steps from it down to the slip's side
    const xq0 = sd > 0 ? gx + 7.2 : -35, xq1 = sd > 0 ? -9 : gx - 7.2;
    b.box(xq0, -5, zc - 4.6, xq1, 1.5, zc - 0.4, 'yZ');
    for (let k = 1; k <= 4; k++) { const xe = sd > 0 ? xq0 - 0.34 * k : xq1 + 0.34 * k; b.box(Math.min(xe, sd > 0 ? xq0 : xq1), -5, zc - 3.4, Math.max(xe, sd > 0 ? xq0 : xq1) , 1.5 - 0.22 * k, zc - 2.0, 'y'); }
  }
  // THE MOLES, swept along the channel 15 m either side of its middle line: 4 m wide, their tops at y 1.5, round
  // pierheads at the harbour's mouth; the west one, on the weather side (the evening breeze comes from the west-north-west),
  // carries a parapet, the east one in its lee none
  const frameAt = (sm, lat) => { const q = seaAt(sm); return M4().makeTranslation(q.x + q.rx * lat, 0, q.z + q.rz * lat).multiply(M4().makeRotationY(-Math.atan2(q.hx, -q.hz))); };
  for (const [side, end] of MOLES) {
    const n = Math.ceil(end / 3.2), st = [];
    for (let k = 0; k <= n; k++) { const q = seaAt(0.4 + (end - 0.4) * k / n), P = (lat) => [q.x + q.rx * lat, q.z + q.rz * lat]; st.push({ L: P(side * MOLE_OFF - 2), R: P(side * MOLE_OFF + 2), s: 0.4 + (end - 0.4) * k / n, q }); }
    const top = side < 0 ? 2.45 : 1.5;
    for (let k = 0; k < n; k++) {
      const A = st[k], B = st[k + 1];
      b.c(C_QUAY, KIND.STONE);
      b.quad([A.L[0], 1.5, A.L[1]], [A.R[0], 1.5, A.R[1]], [B.R[0], 1.5, B.R[1]], [B.L[0], 1.5, B.L[1]], A.s, 0);
      b.quad([A.R[0], -5, A.R[1]], [B.R[0], -5, B.R[1]], [B.R[0], 1.5, B.R[1]], [A.R[0], 1.5, A.R[1]], A.s, -5);
      b.quad([B.L[0], -5, B.L[1]], [A.L[0], -5, A.L[1]], [A.L[0], top, A.L[1]], [B.L[0], top, B.L[1]], -B.s, -5);
      if (side < 0) {
        // (the parapet: 0.55 m thick on the outer edge)
        const iA = [A.L[0] + A.q.rx * 0.55, A.L[1] + A.q.rz * 0.55], iB = [B.L[0] + B.q.rx * 0.55, B.L[1] + B.q.rz * 0.55];
        b.quad([A.L[0], top, A.L[1]], [iA[0], top, iA[1]], [iB[0], top, iB[1]], [B.L[0], top, B.L[1]], A.s, 0);
        b.quad([iA[0], 1.5, iA[1]], [iB[0], 1.5, iB[1]], [iB[0], top, iB[1]], [iA[0], top, iA[1]], A.s, 1.5);
      }
    }
    const H = moleAt(side, end);
    b.cyl(H[0], H[1], 3.0, 3.0, -5, 1.5, 18, 'Y');
    b.cyl(H[0], H[1], 3.12, 3.12, 1.2, 1.5, 18, '');
    // bollards along the inner edge; the pierhead's light on its iron post (red to the west, green to the east)
    b.c(C_IRON, KIND.PLAIN);
    for (let sm = 7; sm < end - 3; sm += 9.5) { const q = seaAt(sm), x = q.x + q.rx * side * (MOLE_OFF - 1.5), z = q.z + q.rz * side * (MOLE_OFF - 1.5); b.cyl(x, z, 0.17, 0.2, 1.5, 1.95, 7, 'Y'); b.cyl(x, z, 0.26, 0.26, 1.95, 2.03, 7, 'Y'); }
    b.cyl(H[0], H[1], 0.34, 0.22, 1.5, 2.1, 8, '');
    b.cyl(H[0], H[1], 0.12, 0.10, 2.1, 5.0, 6, '');
    for (let k = 0; k < 3; k++) { const a = k * 2.094 + 0.5; b.tube([[H[0] + 0.75 * Math.cos(a), 1.5, H[1] + 0.75 * Math.sin(a)], [H[0], 4.2, H[1]]], 0.035, 4); }
    b.cyl(H[0], H[1], 0.42, 0.42, 5.0, 5.06, 8, 'Yy');
    b.cyl(H[0], H[1], 0.36, 0.05, 5.52, 5.82, 8, '');
    b.c(side < 0 ? C_RED : C_GREEN, KIND.FLASH, 1);
    b.cyl(H[0], H[1], 0.26, 0.26, 5.06, 5.52, 8, '');
  }
  await ctx.yield();
  // lobster pots in heaps on the moles (the seed deals their heaps), and nets hung to dry: one on a rack on the east
  // quay, one over the west mole's parapet
  for (const [side, sm, lat] of [[-1, 14 + 40 * rnd(), 15.9], [1, 12 + 34 * rnd(), 15.6], [1, 9.5, 15.4]]) {
    const n = 5 + Math.floor(rnd() * 5);
    b.push(frameAt(sm, side * lat));
    for (let k = 0; k < n; k++) {
      const up = k % 3 === 2 ? 0.38 : 0;
      b.c([0.30 + 0.1 * rnd(), 0.22, 0.12], KIND.NET);
      b.push(M4().makeTranslation(0.9 * (rnd() - 0.5), 1.5 + up, 0.75 * k * 0.6 + 0.5 * (rnd() - 0.5)).multiply(M4().makeRotationY(rnd() * 3.1)));
      b.box(-0.34, 0, -0.24, 0.34, 0.2, 0.24, 'y');
      b.blob(0, 0.2, 0, 0.34, 0.2, 0.24, 6, 3);
      b.pop();
    }
    b.pop();
  }
  b.c([0.16, 0.12, 0.09], KIND.BARK);
  for (const x of [-13.6, -10.4]) b.cyl(x, zc - 2.6, 0.06, 0.05, 1.5, 3.5, 5, 'Y');
  b.tube([[-13.6, 3.45, zc - 2.6], [-10.4, 3.45, zc - 2.6]], 0.04, 5);
  b.c([0.34, 0.25, 0.15], KIND.NET, 0, 0.03);
  for (let k = 0; k < 6; k++) {
    const xa = -13.5 + 0.5 * k, xb = xa + 0.5, sag = (q) => 0.25 * Math.sin(Math.PI * (q + 13.5) / 3.0);
    b.quad([xa, 3.42, zc - 2.6], [xb, 3.42, zc - 2.6], [xb, 1.75 + sag(xb), zc - 2.25], [xa, 1.75 + sag(xa), zc - 2.25], xa, 0);
    b.quad([xb, 3.42, zc - 2.6], [xa, 3.42, zc - 2.6], [xa, 2.2 - sag(xa), zc - 2.9], [xb, 2.2 - sag(xb), zc - 2.9], -xb, 0);
  }
  b.push(frameAt(20 + 22 * rnd(), -MOLE_OFF));
  for (let k = 0; k < 8; k++) {
    const za = -0.6 * k, zb2 = za - 0.6, d0 = 0.5 + 0.25 * Math.sin(k * 1.3), d1 = 0.5 + 0.25 * Math.sin((k + 1) * 1.3);
    b.quad([-1.42, 2.47, zb2], [-1.42, 2.47, za], [-1.40, 2.47 - 0.9 - d0, za], [-1.40, 2.47 - 0.9 - d1, zb2], -za, 0);
    b.quad([-2, 2.47, za], [-2, 2.47, zb2], [-1.42, 2.47, zb2], [-1.42, 2.47, za], za, 0);
  }
  b.pop();
  const hm = b.mesh(kit.solid2[2], 'harbour');
  hm.userData.kind = 'body';
  g.add(hm);
  await ctx.yield();
  await buildSeaBoats(E);
  await buildSeaFar(E);
  await buildSeaLife(E);
  await buildIslet(E);
}
// THE SURF at the islet's foot: lace that drifts with the clock and breathes with the swell, by the world's own place;
// soft to nothing at every edge (uv.x 0: the skirt standing up the rock, 1: the apron lying on the water)
const FOAM_BODY = /* glsl */`
  float sk = 1.0 - vUV.x, v = vUV.y, airK = 1.0;
  float swell = 0.5 + 0.5 * sin(dot(vW.xz, vec2(0.26, 0.966)) * 0.18 - uTime * 0.55);
  vec2 fp = vW.xz * 0.9 + vec2(uTime * 0.11, -uTime * 0.07);
  float lace = 0.6 * vn(fp + vec2(0.0, vW.y * 2.0 - uTime * 0.5 * sk)) + 0.4 * vn(fp * 2.7 + 5.0);
  float reach = mix(0.35 + 0.55 * swell, 0.45 + 0.45 * swell, 1.0 - sk);
  float alpha = smoothstep(reach, reach * 0.35, v) * smoothstep(0.0, 0.06, v + 0.02 * sk) * smoothstep(0.28, 0.6, lace + 0.3 * (1.0 - v)) * mix(0.8, 0.9, sk);
  PL L = placeLight(uPlace);
  vec3 col = (L.sc * 0.42 + L.sky * 1.5) * vec3(0.95, 0.95, 1.0);
`;
// THE ISLET AND ITS HUT (round two, the lead's G3). Dark rock in ledges, wet and weedy at the water, turf on its crown;
// THE SAME HUT at its north-west water's edge in the cove, at sea level: the one builder again with its jetty and its
// lantern; its door's plane is plane three. The place dresses it: weed on its piles, a net and pots on its jetty, a gull
// on its ridge.
async function buildIslet(E) {
  const { kit, ctx } = E, g = E.G[2], o = HUTS[2].o;
  let b = new Bld();
  const S = 1.25, N = 54, x0 = ISLET[0] - S * N / 2, z0 = ISLET[1] - S * N / 2, H = [];
  for (let j = 0; j <= N; j++) { for (let i = 0; i <= N; i++) H.push(isletH(x0 + i * S, z0 + j * S)); if (j % 18 === 17) await ctx.yield(); }
  const tb = new Bld();
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const h00 = H[j * (N + 1) + i], h10 = H[j * (N + 1) + i + 1], h01 = H[(j + 1) * (N + 1) + i], h11 = H[(j + 1) * (N + 1) + i + 1], hm = (h00 + h10 + h01 + h11) / 4;
      if (Math.max(h00, h10, h01, h11) < SEA_Y - 3.3) continue;
      const xa = x0 + i * S, za = z0 + j * S, xb = xa + S, zb = za + S, t = isletIn(xa + S / 2, za + S / 2), steep = Math.max(h00, h10, h01, h11) - Math.min(h00, h10, h01, h11);
      const A = [xa, h01, zb], B = [xb, h11, zb], C = [xb, h10, za], D = [xa, h00, za];
      if (t > 7.5 && steep < 1.1 && hm > SEA_Y + 9) {
        const k = 0.8 + 0.4 * hsh(i * 57 + j, 31);
        tb.c([0.36 * k, 0.48 * k, 0.20 * k], KIND.TURF, 1);
        tb.tri(A, B, C); tb.tri(A, C, D);
        continue;
      }
      // (the rock: each facet its own shade; strata show as bands by height; dark and wet near the water, weed at it)
      for (const [P, Q, R] of (i + j) % 2 ? [[A, B, C], [A, C, D]] : [[A, B, D], [B, C, D]]) {
        const y = (P[1] + Q[1] + R[1]) / 3 - SEA_Y, band = 0.80 + 0.30 * Math.sin(y * 2.9 + 0.6 * fbmC(P[0] * 0.2, P[2] * 0.2, 2)), k = (0.62 + 0.6 * hsh(i * 91 + j * 7, P[1] > Q[1] ? 3 : 5)) * band;
        const wet = smoothstep(1.5, 0.35, y), weed = smoothstep(0.75, 0.1, y) * smoothstep(-1.2, -0.3, y);
        const c = [lerp(0.150 * k, 0.045, wet), lerp(0.138 * k, 0.045, wet), lerp(0.150 * k, 0.050, wet)];
        b.c([lerp(c[0], 0.050, weed), lerp(c[1], 0.075, weed), lerp(c[2], 0.030, weed)], KIND.ROCK, 1);
        b.tri(P, Q, R);
      }
    }
    if (j % 14 === 13) await ctx.yield();
  }
  const im = b.mesh(kit.solid[2], 'islet');
  im.userData.kind = 'floor';
  g.add(im);
  const tm = tb.mesh(kit.solid[2], 'islet turf');
  tm.userData.kind = 'floor';
  g.add(tm);
  await ctx.yield();
  // THE ISLET'S LEDGES, SURF AND SEA PINKS (round three, the lead's C3). Ledges: along every strata edge (where the
  // height over the sea plus the dip is a whole number of strata) a lip of rock juts 0.35 to 0.8 m from the slope, its
  // top pale, its brow mid, its underside dark: the layers show in the geometry. Surf: along the waterline all round, a
  // breaking skirt up the rock's foot and a lace apron on the water 3 m out, soft at every edge, drifting and breathing
  // with the swell's clock. Sea pinks: low cushions in clumps on the crown's turf and on its upper ledges. The same on
  // every seed; nothing within 3 m of the line.
  const FL = H.map((h, k) => h - SEA_Y + isletDip(x0 + (k % (N + 1)) * S, z0 + Math.floor(k / (N + 1)) * S));
  const contour = (F, lv) => {
    const seg = [], at = (i, j) => F[j * (N + 1) + i] - lv;
    const pt = (i0, j0, i1, j1) => { const a = at(i0, j0), c = at(i1, j1), t = a / (a - c); return [x0 + S * (i0 + (i1 - i0) * t), z0 + S * (j0 + (j1 - j0) * t)]; };
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const e = [];
      for (const [p, q] of [[[i, j], [i + 1, j]], [[i + 1, j], [i + 1, j + 1]], [[i + 1, j + 1], [i, j + 1]], [[i, j + 1], [i, j]]]) if ((at(...p) >= 0) !== (at(...q) >= 0)) e.push(pt(...p, ...q));
      if (e.length >= 2) seg.push([e[0], e[1]]);
      if (e.length === 4) seg.push([e[2], e[3]]);
    }
    return seg;
  };
  // (a quad whose face is turned to the given side, whatever the order its corners came in)
  const quadTo = (bb, P, Q, R, T, n) => {
    const ux = Q[0] - P[0], uy = Q[1] - P[1], uz = Q[2] - P[2], vx = T[0] - P[0], vy = T[1] - P[1], vz = T[2] - P[2];
    if ((uy * vz - uz * vy) * n[0] + (uz * vx - ux * vz) * n[1] + (ux * vy - uy * vx) * n[2] >= 0) bb.quad(P, Q, R, T); else bb.quad(P, T, R, Q);
  };
  const downhill = (f, x, z) => { const gx = f(x + 0.3, z) - f(x - 0.3, z), gz = f(x, z + 0.3) - f(x, z - 0.3), l = Math.hypot(gx, gz) || 1; return [-gx / l, -gz / l]; };
  const strata = (x, z) => isletH(x, z) - SEA_Y + isletDip(x, z);
  b = new Bld();
  let nl = 0;
  for (let k = 1; k <= 9; k++) for (const [A, B] of contour(FL, 2.2 * k)) {
    const P = [A, B].map(([x, z]) => { const n = downhill(strata, x, z), y = isletH(x, z), w = 0.35 + 0.45 * hsh(Math.round(x * 2), Math.round(z * 2)); return { x, z, y, n, w }; });
    if (P.some((p) => isletIn(p.x, p.z) < 0.6 || E.lineNear(2, p.x, p.y, p.z) < 3)) continue;
    const c = 0.135 + 0.03 * hsh(k, Math.round(A[0])), at = (p, out, dy) => [p.x + p.n[0] * out, p.y + dy, p.z + p.n[1] * out];
    const nOut = [(P[0].n[0] + P[1].n[0]) / 2, 0, (P[0].n[1] + P[1].n[1]) / 2];
    b.c([c * 1.9, c * 1.8, c * 1.75], KIND.ROCK, 1);
    quadTo(b, at(P[0], -0.3, 0.04), at(P[1], -0.3, 0.04), at(P[1], P[1].w, 0.02), at(P[0], P[0].w, 0.02), [0, 1, 0]);
    b.c([c * 1.1, c * 1.05, c * 1.05], KIND.ROCK, 1);
    quadTo(b, at(P[0], P[0].w, 0.02), at(P[1], P[1].w, 0.02), at(P[1], P[1].w - 0.08, -0.32), at(P[0], P[0].w - 0.08, -0.32), nOut);
    b.c([c * 0.3, c * 0.3, c * 0.32], KIND.ROCK, 1);
    quadTo(b, at(P[0], P[0].w - 0.08, -0.32), at(P[1], P[1].w - 0.08, -0.32), at(P[1], -0.3, -0.6), at(P[0], -0.3, -0.6), [0, -1, 0]);
    nl++;
    if (nl % 150 === 0) await ctx.yield();
  }
  // the sea pinks: clumps of low cushions on the crown's turf and on the two highest strata's ledges
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const x = x0 + (i + 0.5) * S, z = z0 + (j + 0.5) * S, t = isletIn(x, z), y = isletH(x, z), cl = vnC(x * 0.21, z * 0.21);
    if (t < 4 || y < SEA_Y + 7 || hsh(i * 31 + j, 77) > 0.55 * smoothstep(0.45, 0.75, cl) || E.lineNear(2, x, y, z) < 3) continue;
    const jx = x + 0.8 * (hsh(i, j + 3) - 0.5), jz = z + 0.8 * (hsh(j, i + 5) - 0.5), r = 0.22 + 0.18 * hsh(i + 9, j), yy = isletH(jx, jz);
    b.c(hsh(i, j * 3 + 1) < 0.8 ? lin('#e070a8', 0.9) : lin('#f0dce8', 0.9), KIND.PLAIN);
    b.cyl(jx, jz, r, r * 0.6, yy - 0.06, yy + 0.13 + 0.06 * hsh(j, i), 6, 'Y');
  }
  const lm = b.mesh(kit.solid2[2], 'islet ledges');
  lm.userData.kind = 'body';
  g.add(lm);
  await ctx.yield();
  // the surf: the waterline is the grid's contour at 0.12 m over the sea
  b = new Bld();
  for (const [A, B] of contour(H, SEA_Y + 0.12)) {
    const P = [A, B].map(([x, z]) => ({ x, z, n: downhill(isletH, x, z), up: 0.55 + 0.6 * hsh(Math.round(x * 3), Math.round(z * 3)) }));
    if (P.some((p) => E.lineNear(2, p.x, SEA_Y, p.z) < 3 || E.lineNear(2, p.x + 3 * p.n[0], SEA_Y, p.z + 3 * p.n[1]) < 3)) continue;
    // (the skirt: uv.y 0 at the water, 1 at its ragged top, uv.x 0; the apron: uv.y 0 at the rock, 1 at its far
    // edge, uv.x 1. The lace is drawn from the world's own place, so the pieces meet without a seam)
    const v = (p, out, y, u, w) => b.v(p.x + p.n[0] * out, y, p.z + p.n[1] * out, 0, 1, 0, u, w);
    let i0 = v(P[0], 0.15, SEA_Y - 0.1, 0, 0), i1 = v(P[1], 0.15, SEA_Y - 0.1, 0, 0), i2 = v(P[1], -0.05, SEA_Y + P[1].up, 0, 1), i3 = v(P[0], -0.05, SEA_Y + P[0].up, 0, 1);
    b.I.push(i0, i1, i2, i0, i2, i3);
    i0 = v(P[0], 0.1, SEA_Y + 0.04, 1, 0); i1 = v(P[1], 0.1, SEA_Y + 0.04, 1, 0); i2 = v(P[1], 3.0, SEA_Y + 0.04, 1, 1); i3 = v(P[0], 3.0, SEA_Y + 0.04, 1, 1);
    b.I.push(i0, i1, i2, i0, i2, i3);
  }
  const surf = b.mesh(kit.mat(2, { body: FOAM_BODY, transparent: true, depthWrite: false, side: THREE.DoubleSide, tag: 'surf' }), 'islet surf');
  surf.userData.kind = 'medium'; surf.renderOrder = 4;
  g.add(surf);
  await ctx.yield();
  // boulders in the water at the rock's foot (none in the cove, none within 9 m of the line)
  b = new Bld();
  for (let i = 0; i < 26; i++) {
    const a = i * 0.2417 + 0.2 * hsh(i, 9), r = ISLET_R * isletLobe(a) + 0.4 + 2.6 * hsh(i, 4), x = ISLET[0] + Math.cos(a) * r, z = ISLET[1] + Math.sin(a) * r, sz = 0.7 + 1.5 * hsh(i, 7), q = toHut2(x, z);
    if ((q[0] > COVE[0] - 3 && q[1] > COVE[1] - 3) || E.lineNear(2, x, 0, z) < 9) continue;
    b.c([0.085, 0.082, 0.09], KIND.ROCK, 1);
    b.blob(x, SEA_Y - 0.25 + 0.4 * sz, z, sz * 1.2, sz * 0.75, sz, 7, 5, (px, py, pz) => vnC(px * 1.3, pz * 1.3 + py) - 0.5, 0.5);
  }
  await ctx.yield();
  // THE HUT, in its own frame at plane three
  b.push(M4().makeTranslation(o[0], o[1], o[2]).multiply(M4().makeRotationY(HUTS[2].ry * RAD)));
  buildHut(b, { phase: E.named('lamp of the islet box')() });
  const J = buildJetty(b, E.named('fenders of the islet hut'));
  // THE LANDING (round three, the lead's C3): dressed stone round the box's foot on its rock side, 0.45 m over the sea
  // (in the box's frame the sea stands at y 0): a quay 1.9 m wide along the box's west side, running on 2.6 m past its
  // front and down three steps into the water, and the ground behind its back (round four: from the box's plinth to
  // where the hut's back stood); paved on top, coursed on its faces, dark and wet at the water. (Never under the
  // line: its nearest edge stands 4.7 m beside the doorway's middle.)
  const ly = 0.45, wet = [C_QUAY[0] * 0.3, C_QUAY[1] * 0.3, C_QUAY[2] * 0.32];
  const slab = (xa, za, xb, zb, y, faces) => {
    b.c([C_QUAY[0] * 0.85, C_QUAY[1] * 0.85, C_QUAY[2] * 0.85], KIND.FLAGS);
    b.quad([xa, y, zb], [xb, y, zb], [xb, y, za], [xa, y, za], xa, -zb);
    for (const [y0, y1, c] of [[-1.4, Math.min(0.18, y), wet], [0.18, y, [C_QUAY[0] * 0.7, C_QUAY[1] * 0.7, C_QUAY[2] * 0.7]]]) {
      if (y1 <= y0) continue;
      b.c(c, KIND.STONE);
      if (faces.includes('x')) b.quad([xa, y0, za], [xa, y0, zb], [xa, y1, zb], [xa, y1, za], za, y0);
      if (faces.includes('X')) b.quad([xb, y0, zb], [xb, y0, za], [xb, y1, za], [xb, y1, zb], -zb, y0);
      if (faces.includes('Z')) b.quad([xa, y0, zb], [xb, y0, zb], [xb, y1, zb], [xa, y1, zb], xa, y0);
    }
  };
  const qz = BOXP.z1 + 2.6, qb = BOXP.z0 - 0.02;
  slab(-6.6, -12.6, -4.72, qz, ly, 'xZ');
  slab(-4.72, -12.6, 5.0, qb, ly, 'XZ');
  b.c(wet, KIND.STONE);
  b.quad([-4.72, -1.4, qz], [-4.72, -1.4, BOXP.z1], [-4.72, 0.18, BOXP.z1], [-4.72, 0.18, qz], -qz, -1.4);
  b.c([C_QUAY[0] * 0.7, C_QUAY[1] * 0.7, C_QUAY[2] * 0.7], KIND.STONE);
  b.quad([-4.72, 0.18, qz], [-4.72, 0.18, BOXP.z1], [-4.72, ly, BOXP.z1], [-4.72, ly, qz], -qz, 0.18);
  for (let k = 1; k <= 3; k++) slab(-6.6, qz + 0.4 * (k - 1), -4.72, qz + 0.4 * k, ly - 0.27 * k, 'xXZ');
  // weed on the piles and on the footing at the water line
  b.c([0.045, 0.075, 0.03], KIND.PLAIN);
  for (let z = J.z1 - 0.3; z > J.z0; z -= 3.05) for (const x of [J.x0 + 0.02, J.x1 - 0.02]) b.cyl(x, z, 0.15, 0.135, -0.55, 0.16 + 0.12 * hsh(z * 7, x), 7, '');
  b.quad([HUT.hw + 0.01, -0.6, BOXP.z1], [HUT.hw + 0.01, -0.6, BOXP.z0], [HUT.hw + 0.01, 0.2, BOXP.z0], [HUT.hw + 0.01, 0.2, BOXP.z1]);
  // a net hung to dry on a rail along the jetty's outer side, and a heap of pots
  b.c([0.16, 0.12, 0.09], KIND.BARK);
  for (const z of [1.2, 4.6]) b.cyl(J.x1 - 0.1, z, 0.05, 0.045, J.y, J.y + 1.5, 5, 'Y');
  b.tube([[J.x1 - 0.1, J.y + 1.46, 1.2], [J.x1 - 0.1, J.y + 1.46, 4.6]], 0.035, 5);
  b.c([0.34, 0.25, 0.15], KIND.NET, 0, 0.03);
  for (let k = 0; k < 6; k++) {
    const za = 1.3 + 0.55 * k, zb = za + 0.55, sag = (q) => 0.22 * Math.sin(Math.PI * (q - 1.3) / 3.3);
    b.quad([J.x1 - 0.1, J.y + 1.44, zb], [J.x1 - 0.1, J.y + 1.44, za], [J.x1 - 0.42, J.y + 0.12 + sag(za), za], [J.x1 - 0.42, J.y + 0.12 + sag(zb), zb], za, 0);
    b.quad([J.x1 - 0.1, J.y + 1.44, za], [J.x1 - 0.1, J.y + 1.44, zb], [J.x1 + 0.12, J.y + 0.45 - sag(zb), zb], [J.x1 + 0.12, J.y + 0.45 - sag(za), za], -zb, 0);
  }
  for (let k = 0; k < 5; k++) {
    b.c([0.30 + 0.1 * hsh(k, 61), 0.22, 0.12], KIND.NET);
    b.push(M4().makeTranslation(J.x0 + 0.55 + 0.5 * hsh(k, 62), J.y + (k === 4 ? 0.38 : 0), -4.6 - 0.72 * (k % 4) + (k === 4 ? 0.9 : 0)).multiply(M4().makeRotationY(hsh(k, 63) * 3.1)));
    b.box(-0.34, 0, -0.24, 0.34, 0.2, 0.24, 'y');
    b.blob(0, 0.2, 0, 0.34, 0.2, 0.24, 6, 3);
    b.pop();
  }
  // a gull standing on the roof's first step over the doors: body, head, grey back, bill
  const gz = 2.95, gy = hutTopAt(0, gz);
  b.c([0.95, 0.95, 0.93], KIND.PLAIN);
  b.blob(0, gy + 0.16, gz, 0.10, 0.11, 0.22, 7, 5);
  b.blob(0, gy + 0.31, gz + 0.19, 0.065, 0.07, 0.075, 6, 4);
  b.c([0.50, 0.52, 0.56], KIND.PLAIN);
  b.blob(0, gy + 0.21, gz - 0.07, 0.085, 0.06, 0.20, 6, 4);
  b.c([0.85, 0.62, 0.10], KIND.PLAIN);
  b.tube([[0, gy + 0.31, gz + 0.25], [0, gy + 0.295, gz + 0.34]], 0.014, 4);
  b.tube([[0.03, gy, gz], [0.03, gy + 0.08, gz]], 0.008, 3); b.tube([[-0.03, gy, gz], [-0.03, gy + 0.08, gz]], 0.008, 3);
  b.pop();
  const hut = b.mesh(kit.solid2[2], 'sea hut');
  hut.userData.kind = 'body';
  g.add(hut);
  await ctx.yield();
}
// THE RING (round two, the lead's section A). ITS SHEET is a banded annulus of ice about a far centre RING_C that lies
// on the planet's bearing (178) from the leg's middle RING_V: we stand in the ring at 1400 m from that centre, the ring
// runs from 900 to 2100 m. Within 200 m of RING_V the sheet is level (y PLAIN_Y, the leads' level); beyond, it
// rises (toward 16 degrees), so that the far bands open to the eye as great arcs sweeping round the planet. Its bands and
// gaps are geometry: each band its own colour, each gap a true gap with the stars below.
const PLAIN_Y = -16.05;
const RING_IN = 900, RING_OUT = 2100, RING_TAN = Math.tan(16 * RAD);
const ringY = (x, z) => { const d = Math.hypot(x - RING_V[0], z - RING_V[1]) - 200; return PLAIN_Y + (d > 0 ? RING_TAN * d * d / (d + 400) : 0); };
const _hi = HUTS[3].ry * RAD, _hc = Math.cos(_hi), _hs = Math.sin(_hi);
const toHut3 = (x, z) => { const dx = x - HUTS[3].o[0], dz = z - HUTS[3].o[2]; return [dx * _hc - dz * _hs, dx * _hs + dz * _hc]; };
const fromHut3 = (xh, zh) => [HUTS[3].o[0] + xh * _hc + zh * _hs, HUTS[3].o[2] - xh * _hs + zh * _hc];
// THE LAST FLOE (round three c, the lead's C1): the floe that bears the last hut is one of the pack's floes, a site of
// the pack's own plan (buildPackIce): its outline is its cell, cut by its neighbours' seams and broken like theirs; its
// tone is the plates' own draw; its freeboard is the plates' own rule at its low end, FLOE_T = 0.35 m, for the hut's
// weight presses it down; so the hut's water line stands FLOE_T over the plain (HUTS[3] in the part: y -15.70, 0.30 m
// higher than round three b's floe, which lay flush with the leads). LAST_BEARS: what the floe bears, four outlines in
// the hut's own frame: the box on its plinth (the part's hutRoofPlan, as buildHut lays it: round three e, the
// lead's R4; round four), the jetty (JETTY_PLAN, by which buildJetty lays it),
// the frozen bank behind and beside it (at its widest), the boat beside the jetty; LAST_THINGS, their corners.
// FLOE_SITE: the site stands at the middle of what it bears, and its reach (half its breadth, as every site's) is the
// farthest of those things plus the widest half-lead a seam can have (5 m), the breaks' deepest step in (0.45 m) and
// half a metre; every other site must leave
// the cell's edge that far out from every one of those things (throwSites), so the floe always bears them. Round three
// d (the lead's D3): its rim is every plate's. Its cell is cut by nothing but its neighbours and the field's rim; its
// ridges carry their piles and its leads their loose blocks, for a block keeps only its reach and FLOE_BLOCK_GAP off
// what the floe bears (okBlock, buildStars). Round three e (the lead's R1, R5): its cell lies within the floe's bound
// (FLOE_BOUND, FLOE_HULL) on every seed, and every great berg keeps BERG_LEAD off its cell: the bergs beside the ways
// by their throws' test and by their homes (kept off the bound), the massif by its place; the build tests every one,
// the massif's three among them (buildStars). Round three f (the lead's S2): the floe as drawn, its corners and its
// broken edge, lies within its cell by rule, as every plate does (buildPackIce: a corner that would stand outside
// the cell takes the bevel within it, and a break's step that would leave the cell is not taken), so a berg's
// BERG_LEAD off the floe's cell is a lead off the floe as drawn.
const FLOE_T = 0.35;
const LAST_JETTY = JETTY_PLAN;
const LAST_BANK = { c: [-1.2, -8.2], rx: 7.4, rz: 8.4, k: 1.16 };
const LAST_BEARS = (() => {
  const R = hutRoofPlan(), hut = [[R.x0, R.z1], [R.x1, R.z1], [R.x1, R.z0], [R.x0, R.z0]];
  const jetty = [[LAST_JETTY.x0, LAST_JETTY.z0], [LAST_JETTY.x1, LAST_JETTY.z0], [LAST_JETTY.x1, LAST_JETTY.z1], [LAST_JETTY.x0, LAST_JETTY.z1]], bank = [], boat = [];
  for (let k = 0; k < 24; k++) { const a = k / 24 * 6.2832; bank.push([LAST_BANK.c[0] + Math.cos(a) * LAST_BANK.rx * LAST_BANK.k, LAST_BANK.c[1] + Math.sin(a) * LAST_BANK.rz * LAST_BANK.k]); }
  for (const [dx, dz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) boat.push([LAST_JETTY.x1 + 1.5 + 0.95 * dx, 5.2 + 2.5 * dz]);
  return [hut, jetty, bank, boat];
})();
const LAST_THINGS = LAST_BEARS.flat();
const FLOE_GAP = 5 + 0.45 + 0.5, FLOE_BLOCK_GAP = 0.5;
const FLOE_SITE = (() => {
  let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
  for (const [x, z] of LAST_THINGS) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
  const mh = [(x0 + x1) / 2, (z0 + z1) / 2], reach = Math.max(...LAST_THINGS.map(([x, z]) => Math.hypot(x - mh[0], z - mh[1])));
  const [x, z] = fromHut3(mh[0], mh[1]);
  return { x, z, r: reach + FLOE_GAP, things: LAST_THINGS.map(([a, c]) => fromHut3(a, c)), outlines: LAST_BEARS.map((P) => P.map(([a, c]) => fromHut3(a, c))) };
})();
// THE FLOE'S BOUND (round three e, the lead's R1): the last floe's cell reaches no farther from its site than
// FLOE_BOUND, half as far again as its reach, on any of FLOE_BEARINGS (16) bearings about it. Where the darts leave it
// reaching farther, throwSites sets a site of the floe's own reach on that bearing at twice FLOE_BOUND out, after every
// dart and with no draw, so that the edge between the two (halfway, as between any two sites of one reach) stands at
// FLOE_BOUND; that edge lies FLOE_BOUND less the reach of what the floe bears (more than FLOE_GAP) from all of it, as
// every site's edge with the floe must. So on every seed the floe's cell lies within FLOE_HULL, the sixteen-sided
// figure of those edges, and the great bergs are kept off the floe by that bound (BESIDE_HOMES, and the build's test).
const FLOE_BOUND = 1.5 * FLOE_SITE.r, FLOE_BEARINGS = 16;
const FLOE_HULL = Array.from({ length: FLOE_BEARINGS }, (_, k) => { const a = (k + 0.5) / FLOE_BEARINGS * 2 * Math.PI, R = FLOE_BOUND / Math.cos(Math.PI / FLOE_BEARINGS); return [FLOE_SITE.x + R * Math.cos(a), FLOE_SITE.z + R * Math.sin(a)]; });
// (the signed distance in plan from a point to a polygon's outline: less than 0 inside it)
function polyDist(P, x, z) {
  let d = 1e9, n = 0;
  for (let k = 0; k < P.length; k++) {
    const A = P[k], B = P[(k + 1) % P.length], ex = B[0] - A[0], ez = B[1] - A[1], l2 = ex * ex + ez * ez || 1e-9, t = clamp(((x - A[0]) * ex + (z - A[1]) * ez) / l2, 0, 1);
    d = Math.min(d, Math.hypot(x - A[0] - ex * t, z - A[1] - ez * t));
    const lo = Math.min(A[1], B[1]), hi = Math.max(A[1], B[1]);
    if (z >= lo && z < hi && A[0] + ex * (z - A[1]) / (ez || 1e-9) > x) n++;
  }
  return n % 2 ? -d : d;
}
// one block of the ring's ice: a twenty-faced lump, every corner pushed in or out, each face flat (so that it glints).
// (Round three b, S7: its twenty faces are three.js's own IcosahedronGeometry, read from the library this world is
// built on; its twelve corners are found once each, in the order the library lays them, and moved by the block's fixed
// stream.)
function iceBlockGeo(seedN) {
  const b = new Bld(), fix = fixedRng('ice block ' + seedN), ico = new THREE.IcosahedronGeometry(1, 0), pos = ico.getAttribute('position'), seen = new Map(), V = [];
  const corner = (i) => {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i), key = `${Math.round(x * 1e4)} ${Math.round(y * 1e4)} ${Math.round(z * 1e4)}`;
    if (!seen.has(key)) { const k = 0.62 + 0.55 * fix(); V.push([x * k, y * k * (0.8 + 0.3 * fix()), z * k]); seen.set(key, V.length - 1); }
    return V[seen.get(key)];
  };
  for (let i = 0; i < pos.count; i += 3) { const A = corner(i), B = corner(i + 1), C = corner(i + 2), k = 0.82 + 0.3 * fix(); b.c([C_ICE[0] * k * 0.94, C_ICE[1] * k * 0.98, C_ICE[2] * k], KIND.ICE); b.tri(A, B, C); }
  ico.dispose();
  if (V.length !== 12) throw new Error('boathouse-full-of-morning: an ice block has ' + V.length + ' corners');
  return b.geo();
}
// a faceted mass: an ellipsoid whose corners are pushed in and out, every face flat; shade: how far each face's colour strays
function crag(b, cx, cy, cz, rx, ry, rz, seg, rings, bump, amp, shade = 0) {
  const P = [], col = b.col;
  for (let j = 0; j <= rings; j++) { const ph = -Math.PI / 2 + Math.PI * j / rings, row = []; for (let i = 0; i <= seg; i++) { const th = (i % seg) / seg * Math.PI * 2 + (j % 2) * Math.PI / seg, x = Math.cos(ph) * Math.cos(th), z = Math.cos(ph) * Math.sin(th), y = Math.sin(ph), k = 1 + amp * bump(cx + x * rx, cy + y * ry, cz + z * rz); row.push([cx + x * rx * k, cy + y * ry * k, cz + z * rz * k]); } P.push(row); }
  for (let j = 0; j < rings; j++) for (let i = 0; i < seg; i++) {
    const a = P[j][i], c = P[j][i + 1], d = P[j + 1][i + 1], e = P[j + 1][i];
    for (const t of [[a, e, d], [a, d, c]]) { const k = 1 + shade * (2 * hsh(i * 7 + j * 13, (t[1] === e ? 1 : 2) + Math.round(cx)) - 1); b.col = [col[0] * k, col[1] * k, col[2] * k]; b.tri(t[0], t[1], t[2]); }
  }
  b.col = col;
  return b;
}
// (a great berg's main shard stands on this share of its foot's radius)
const MAIN_SHARD = 0.62;
// THE DESIGN'S BAND FOR GREAT BERGS (the brief's roundTwo A: the line goes low among six or more great bergs 25 to 45 m
// tall). HOW A BERG IS MEASURED (round three f, the lead's S3): at its highest corner over the plain, the highest
// corner of its top ring or its apex as greatBerg builds it. Every great berg's highest corner stands within the
// band: the four beside the ways by their draw within it (BESIDE: the height drawn is the highest corner's, and
// greatBerg builds to it), the massif's three by massifHeights (which tests their highest corners). And six of them
// stand beside the line on every seed, the massif's three and the berg of each of the three bands beside the line,
// for no band ends empty (BESIDE_HOMES; the build counts them, buildStars). The fourth band's berg stands past the
// line's end and is not counted.
const GREAT_BERG_BAND = [25, 45];
// THE GREAT BERGS' LEAD (round three e): every berg beside the ways keeps BERG_LEAD from every other great berg's
// foot, and every great berg keeps it from the last floe's cell; the massif's three stand shoulder to shoulder
const BERG_LEAD = 4;
// A GREAT BERG: a cluster of leaning towers of ice, broken off at their tops, every face flat and sharp (the main
// shard the tallest, the others lower about its foot); its foot goes 3 m under the sheet. word: the berg's own fixed
// stream (its shards' count, places, leans and corners; the seed is never read). F: the ring's shadow stamps.
// ITS HEIGHT IS MEASURED AT ITS HIGHEST CORNER over the plain (round three f, the lead's S3): greatBerg is given
// that height, hgt, and builds the berg so that its highest corner stands exactly there. bergShards builds a berg
// whose main shard's top ring stands h over the plain before its corners are lifted or let down (BERG_TOP, a share
// of h either way) and its apex set over their mean (BERG_APEX, a share of h), and returns the highest corner's
// height over the plain; every height in it is a share of h, so that corner stands bergRise(word) times h high,
// read once for each word from the berg itself, built on no builder. greatBerg builds to h = hgt / bergRise(word).
const BERG_TOP = 0.16, BERG_APEX = 0.02;
const BERG_RISE = new Map();
function bergRise(word) {
  if (!BERG_RISE.has(word)) BERG_RISE.set(word, bergShards({ c() {}, tri() {} }, 0, 0, 1, 1, word, null));
  return BERG_RISE.get(word);
}
function greatBerg(b, x, z, rad, hgt, word, F) {
  return bergShards(b, x, z, rad, hgt / bergRise(word), word, F);
}
function bergShards(b, x, z, rad, hgt, word, F) {
  const fix = fixedRng(word), n = 3 + Math.floor(fix() * 2), y0 = PLAIN_Y - 3;
  let top = -1e9;
  for (let s = 0; s < n; s++) {
    // (every shard stays within the foot's radius: the main one MAIN_SHARD of it, the others about its foot)
    const main = s === 0, a = fix() * 6.283, off = main ? 0 : rad * (0.42 + 0.2 * fix()), cx = x + Math.cos(a) * off, cz = z + Math.sin(a) * off;
    const h = main ? hgt : hgt * (0.3 + 0.38 * fix()), r = main ? rad * MAIN_SHARD : Math.min(rad * (0.3 + 0.16 * fix()), (rad * 0.98 - off) / 1.2), sides = 5 + Math.floor(fix() * 3), tw = fix() * 6.283, NL = 5, rings = [];
    const lean = Math.min(0.1, 0.3 * rad / (h + 3)) * (main ? 1 : 0.4), lx = (fix() - 0.5) * 2 * lean, lz = (fix() - 0.5) * 2 * lean;
    for (let l = 0; l <= NL; l++) {
      const q = l / NL, rr = r * (1 - 0.5 * Math.pow(q, 2.2)) * (l === NL ? 0.45 : 1), y = y0 + (h + 3) * q, row = [];
      for (let i = 0; i < sides; i++) { const an = tw + (i + 0.5 * (l % 2)) / sides * 6.283 + 0.3 * (fix() - 0.5), k = rr * (0.74 + 0.44 * fix()); row.push([cx + lx * (y - y0) + Math.cos(an) * k, y + (l === NL ? (fix() - 0.5) * BERG_TOP * h : 0), cz + lz * (y - y0) + Math.sin(an) * k]); }
      for (const q of row) top = Math.max(top, q[1]);
      rings.push(row);
    }
    // (a facet that faces the sun squarely is painted darker, so that none burns out to a flat white)
    const paint = (P, Q, R) => {
      let k = 0.54 + 0.20 * fix();
      if (P) { const ux = Q[0] - P[0], uy = Q[1] - P[1], uz = Q[2] - P[2], vx = R[0] - P[0], vy = R[1] - P[1], vz = R[2] - P[2], nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx, nl = Math.hypot(nx, ny, nz) || 1, f = Math.max(0, (nx * SUN.stars[0] + ny * SUN.stars[1] + nz * SUN.stars[2]) / nl); k *= 1 - 0.42 * f * f; }
      b.c([C_ICE[0] * k * 0.92, C_ICE[1] * k * 0.97, C_ICE[2] * k], KIND.ICE, 1);
    };
    for (let l = 0; l < NL; l++) for (let i = 0; i < sides; i++) { const A = rings[l][i], B = rings[l][(i + 1) % sides], C = rings[l + 1][(i + 1) % sides], D = rings[l + 1][i]; paint(A, D, C); b.tri(A, D, C); paint(A, C, B); b.tri(A, C, B); }
    const T = rings[NL], mid = [0, 0, 0];
    for (const q of T) { mid[0] += q[0] / sides; mid[1] += q[1] / sides + BERG_APEX * h / sides; mid[2] += q[2] / sides; }
    top = Math.max(top, mid[1]);
    for (let i = 0; i < sides; i++) { paint(); b.tri(mid, T[(i + 1) % sides], T[i]); }
    if (F) F.disc(cx + lx * (h + 3) * 0.5, cz + lz * (h + 3) * 0.5, r * 1.05, (q) => PLAIN_Y + h * (1 - Math.pow(q, 0.8)));
  }
  return top - PLAIN_Y;
}
// THE GREAT BERGS (round three b, the source reader's finding 5): each [x, z, its foot's radius] here; heights at the
// build (massifHeights).
// THE BERG MASSIF, three bergs shoulder to shoulder, the same on every seed, worked out from the stars' line and ruling
// 9's strip (round three c, the lead's C4: their feet by the room each place leaves, their heights by what they must
// hide). Its WEST berg stands square off the middle of the face stretch (the line's run along the massif's face), on
// that run's right: its foot is the widest that keeps MASSIF_GAP.line (5 m: the law's 2.6 m and room for a berg's
// lean) from the run and MASSIF_GAP.strip (1.5 m) from ruling 9's strip, so it fills the room between the two, less
// both gaps. Its EAST berg stands in the line's right curve round the massif's east end, on the radius through that
// curve's middle: its foot spans that radius less MASSIF_GAP.line, from the curve's centre to that gap short of the
// line's plan.
// Its MIDDLE berg spans the gap between those two bergs' main shards (MAIN_SHARD of each foot), its middle on the line
// between theirs, so that its foot runs into both of theirs and the three stand shoulder to shoulder. Their heights:
// massifHeights. Where the hut is hidden from the line and where it is found falls where the massif puts it
// (HIDDEN and REVEAL).
// THE BUILD TESTS, every one that stops the build for the great bergs (round three e, the lead's R5: the list whole).
// Here: if the massif finds no room (a foot's radius 3 m or less), or if a foot of the massif comes nearer the whole
// line's plan than MASSIF_GAP.line or nearer ruling 9's strip than MASSIF_GAP.strip. At load (BESIDE_HOMES): if a band
// beside the ways has no home. In massifHeights: if the massif faces no stretch of the line, if a sight to the door
// passes it at every height within the design's band, if after the margin a berg's highest corner stands outside the
// band, or if after the margin a sight is open. In build(): if the door is hidden for less than HIDE_LEAST of the
// line, or if it is not in sight again by the line's point abreast of the massif's east berg (REVEAL_BY). In
// buildStars: if fewer than six great bergs within the design's band stand beside the line; if any great berg's
// foot, the massif's three among them, stands less than MASSIF_GAP.strip clear of ruling 9's strip or comes within
// BERG_LEAD of the last floe's cell; or if any of its triangles comes within the law's 2.6 m of the line.
const MASSIF_GAP = { strip: 1.5, line: 5 };
export const MASSIF = (() => {
  // (west: the circle that fills the room square off the face stretch's middle, MASSIF_GAP.line from the line and
  // MASSIF_GAP.strip from the strip's edge, found by halving)
  const F = STARS_LINE.ops[2], Fm = planAt(STARS_LINE, (F.at0 + F.at1) / 2), into = right(F.b0);
  const at = (r) => [Fm[0] + into[0] * (MASSIF_GAP.line + r), Fm[1] + into[1] * (MASSIF_GAP.line + r)];
  const clear = (r) => { const p = at(r), so = sightOff(p[0], p[1], 1.1); return so.lat - r - (3.4 + 7 * so.cl) - MASSIF_GAP.strip; };
  let lo = 0, hi = 60;
  for (let k = 0; k < 60; k++) { const m = (lo + hi) / 2; if (clear(m) > 0) lo = m; else hi = m; }
  const rw = lo, w = at(rw);
  // (east: its breadth on the radius through the right curve's middle, from the curve's centre out to MASSIF_GAP.line
  // short of the line's plan, found by halving)
  const T = STARS_LINE.ops.find((o) => o.sg > 0), mid = right((T.b0 + T.b1) / 2), eAt = (r) => [T.c[0] - mid[0] * r, T.c[1] - mid[1] * r];
  lo = 0; hi = T.R;
  for (let k = 0; k < 60; k++) { const m = (lo + hi) / 2, p = eAt(m); if (starsNear(p[0], p[1]) - m > MASSIF_GAP.line) lo = m; else hi = m; }
  const re = lo, e = eAt(re);
  // (middle: across the gap between those two bergs' main shards)
  const D = Math.hypot(e[0] - w[0], e[1] - w[1]), u = [(e[0] - w[0]) / D, (e[1] - w[1]) / D], rm = (D - MAIN_SHARD * (rw + re)) / 2;
  if (!(rw > 3 && re > 3 && rm > 3)) throw new Error('boathouse-full-of-morning: the berg massif finds no room (' + [rw, rm, re].map((v) => v.toFixed(1)).join(', ') + ')');
  const M = [[w[0], w[1], rw], [w[0] + u[0] * (MAIN_SHARD * rw + rm), w[1] + u[1] * (MAIN_SHARD * rw + rm), rm], [e[0], e[1], re]];
  for (const [x, z, r] of M) { const so = sightOff(x, z, 1.1); if (starsNear(x, z) - r < MASSIF_GAP.line - 1e-6 || so.lat - r - (3.4 + 7 * so.cl) < MASSIF_GAP.strip - 1e-6) throw new Error('boathouse-full-of-morning: a foot of the berg massif comes too near the line or the strip'); }
  return M;
})();
// THE MASSIF'S OWN STREAMS (round three d, the lead's D2): each of its three bergs draws its shards from a fixed stream
// named for the massif as it now stands and for the berg's place in it; the four bergs beside the ways keep theirs
// ('great berg 4' to 'great berg 7', each band's own: BESIDE)
const MASSIF_WORDS = ['the berg massif, shoulder to shoulder: its west berg', 'the berg massif, shoulder to shoulder: its middle berg', 'the berg massif, shoulder to shoulder: its east berg'];
// THE FOUR BERGS BESIDE THE WAYS (round three b), one in each band beside a named stretch of the stars' line: [the
// band's name, its metres along the line from and to (past the line's end its last bearing runs on), the hand (-1
// left, 1 right), how far the foot's edge stands off the line, from and to]. Round three e (the lead's R2): each band
// throws on a stream of its own, named for the band ('great bergs: ' and the band's name), so that a band's tests move
// its own berg alone. Each throw draws four numbers (its metre, its offset, its foot within BESIDE_FOOT, 9 to 12 m,
// and its height within GREAT_BERG_BAND itself, the lead's R1; round three f, the lead's S3: that height is the
// berg's highest corner's, and greatBerg builds to it), so the count of draws is fixed by the throws; a throw
// is kept when its foot keeps MASSIF_GAP.line from the whole line's plan, stands MASSIF_GAP.strip clear of ruling 9's
// strip, keeps BERG_LEAD from every berg's foot placed before it and from the last floe's cell (siteCell: round three
// d, the lead's D3), and never stands between the line and the last hut. A band whose forty throws find no place
// takes its home (BESIDE_HOMES), so no band ends empty. Their shards keep their fixed words, 'great berg 4' to 'great
// berg 7': each band's own, by its place in BESIDE.
const BESIDE = (() => {
  const tO = STARS_LINE.ops, tL = STARS_LINE[STARS_LINE.length - 1][2];
  return [['left of the run out of the door and along the massif\'s face', 0, tO[2].at1, -1, 14, 40],
    ['outside the right curve round the massif\'s east end', tO[3].at0, tO[3].at1, -1, 14, 40],
    ['right of the last curve and the last straight, toward ruling 9\'s strip', tO[4].at0, tL, 1, 10, 34],
    ['past the last hut, left of its bearing run on', tL + 15, tL + 50, -1, 0, 30]];
})();
// the stars' plan at a metre along it (past its end, its last bearing runs on): [x, z, bearing]
const starsAt = (m) => planAt(STARS_LINE, m);
// (the tests of a foot [x, z, its radius] by places alone: how far it stands clear of ruling 9's strip, and whether it
// stands between the line and the last hut, across the sight in plan from a point of the line every 2 m to the hut's
// middle)
const STARS_END = STARS_LINE[STARS_LINE.length - 1][2], HUT3_MID = hutPoint(3, [0, HUT.mid, 0]);
const stripClear = (x, z, rad) => { const so = sightOff(x, z, 1.1); return so.lat - rad - (3.4 + 7 * so.cl); };
const hidesHut = (x, z, rad) => { for (let m = 0; m <= STARS_END; m += 2) { const p = starsAt(m), dx = HUT3_MID[0] - p[0], dz = HUT3_MID[2] - p[1], t = clamp(((x - p[0]) * dx + (z - p[1]) * dz) / (dx * dx + dz * dz), 0, 1); if (Math.hypot(p[0] + dx * t - x, p[1] + dz * t - z) < rad) return true; } return false; };
const BESIDE_FOOT = [9, 12];
// THE BANDS' HOMES (round three e, the lead's R1): the place a band's berg takes when none of its forty throws is
// kept, worked out here from places alone, the same on every seed. Of the band's places every metre along it and every
// metre out, its foot BESIDE_FOOT's least: those whose foot keeps MASSIF_GAP.line from the line's plan, stands
// MASSIF_GAP.strip clear of ruling 9's strip, keeps BERG_LEAD from the massif's feet, never stands between the line
// and the last hut, keeps BERG_LEAD off the floe's bound (FLOE_HULL, within which its cell lies on every seed), and
// keeps BERG_LEAD from every place an earlier band's berg can stand (its metres and its offsets with its feet of 9 to
// 12 m, tried every half metre along and out, less a metre for what lies between: within a run of the plan the place
// moves no faster than the metre); the home is the one of them nearest in plan to the band's middle place (its middle
// metre and its middle offset), and its highest corner stands at the middle of GREAT_BERG_BAND. So the home passes
// every test of a throw on every seed, and a later band's throws and home keep off it. The build stops here, the
// same on every seed, if a band has none.
const BESIDE_HOMES = BESIDE.map(([name, m0, m1, hand, o0, o1], k) => {
  const at = (m, d) => { const p = starsAt(m), r = right(p[2]); return [p[0] + hand * r[0] * d, p[1] + hand * r[1] * d]; };
  const rad = BESIDE_FOOT[0], mid = at((m0 + m1) / 2, (o0 + o1) / 2 + rad), C = [];
  for (let m = m0; m <= m1; m += 1) for (let o = o0; o <= o1; o += 1) { const [x, z] = at(m, o + rad); C.push([Math.hypot(x - mid[0], z - mid[1]), m, o, x, z]); }
  C.sort((a, b) => a[0] - b[0]);
  const near = (x, z, j) => {
    const [, a0, a1, hj, b0, b1] = BESIDE[j];
    let d = 1e9;
    for (let m = a0; m <= a1 + 1e-9; m += 0.5) { const p = starsAt(m), r = right(p[2]); for (let e = b0 + BESIDE_FOOT[0]; e <= b1 + BESIDE_FOOT[1] + 1e-9; e += 0.5) d = Math.min(d, Math.hypot(x - p[0] - hj * r[0] * e, z - p[1] - hj * r[1] * e)); }
    return d - 1;
  };
  for (const [, m, o, x, z] of C) {
    if (starsNear(x, z) - rad < MASSIF_GAP.line || stripClear(x, z, rad) < MASSIF_GAP.strip || MASSIF.some((q) => Math.hypot(x - q[0], z - q[1]) < rad + q[2] + BERG_LEAD)) continue;
    if (polyDist(FLOE_HULL, x, z) < rad + BERG_LEAD || hidesHut(x, z, rad)) continue;
    let ok = true;
    for (let j = 0; j < k && ok; j++) ok = near(x, z, j) >= rad + BESIDE_FOOT[1] + BERG_LEAD;
    if (ok) return { m, o, x, z, rad, hgt: (GREAT_BERG_BAND[0] + GREAT_BERG_BAND[1]) / 2 };
  }
  throw new Error('boathouse-full-of-morning: the band ' + name + ' has no home');
});
// THE MASSIF'S HEIGHTS (round three c, the lead's C4; round three d, D1), from what the massif must do: hide the last
// hut's door from the line over the stretch it faces, every berg within the design's band (GREAT_BERG_BAND). THE
// STRETCH THE MASSIF FACES: the points of the stars' line, every half metre from plane three, from which the door
// lies behind the massif: the level sight in plan from the point to the door's crown crosses the massif's spine, the
// line from its west berg's middle to its east berg's (on which the middle berg's middle stands). (A sight that only
// crosses the rim of a foot passes beside the shards, where the berg has no ice, and no height shuts it.) From every
// point of the stretch the sights to the way out's head (round four: the engine's rectangle: its top's middle and
// its two top corners, 6.8 m over the box's water line)
// must each meet a triangle of the massif's own shards (bergShards, built at the heights tried). The rise goes by a
// berg's main shard's own height (as bergShards takes it), and the band is kept by its highest corner (round three f,
// the lead's S3: bergRise times that height). Every berg starts its rise with its main shard at the band's least;
// while a sight is open, of the bergs whose feet it crosses in plan the one that shuts it with the least rise (by
// half metres, its highest corner never past the band's most) rises so far. Then each berg's main shard stands at
// the larger of its hiding height plus MASSIF_MARGIN (2 m) and the band's least, and the heights handed on are the
// bergs' highest corners'. THE BUILD STOPS (massifHeights) if the massif faces no stretch, if no height within the
// band shuts a sight, if after the margin a berg's highest corner stands outside the band, or if after the margin
// a sight of the stretch is open. HIDDEN: the first point of the run of points, about the stretch, from which every
// such sight is shut; REVEAL: the first point past it from which one is open.
const MASSIF_MARGIN = 2;
// whether the segment from o (unit direction v, length len) meets the triangle a, b, c
function segMeetsTri(o, v, len, a, b, c) {
  const e1x = b[0] - a[0], e1y = b[1] - a[1], e1z = b[2] - a[2], e2x = c[0] - a[0], e2y = c[1] - a[1], e2z = c[2] - a[2];
  const px = v[1] * e2z - v[2] * e2y, py = v[2] * e2x - v[0] * e2z, pz = v[0] * e2y - v[1] * e2x, det = e1x * px + e1y * py + e1z * pz;
  if (Math.abs(det) < 1e-12) return false;
  const sx = o[0] - a[0], sy = o[1] - a[1], sz = o[2] - a[2], u = (sx * px + sy * py + sz * pz) / det;
  if (u < 0 || u > 1) return false;
  const qx = sy * e1z - sz * e1y, qy = sz * e1x - sx * e1z, qz = sx * e1y - sy * e1x, w = (v[0] * qx + v[1] * qy + v[2] * qz) / det;
  if (w < 0 || u + w > 1) return false;
  const t = (e2x * qx + e2y * qy + e2z * qz) / det;
  return t > 0 && t < len;
}
async function massifHeights(path, d0, L, ctx) {
  const _q = new THREE.Vector3(), aim = [[0, WAYOUT.top, 0.3], [-HUT.r, WAYOUT.top, 0.3], [HUT.r, WAYOUT.top, 0.3]].map((q) => hutPoint(3, q)), S = [];
  for (let k = 0; d0 + 0.5 * k <= L; k++) { path.posAtDist(d0 + 0.5 * k, _q); S.push([_q.x, _q.y, _q.z]); }
  // (how near the sight from p to q passes a berg's middle in plan, in feet's radii)
  const plan = (p, q, b) => { const [x, z, r] = MASSIF[b], dx = q[0] - p[0], dz = q[2] - p[2], t = clamp(((x - p[0]) * dx + (z - p[2]) * dz) / (dx * dx + dz * dz), 0, 1); return Math.hypot(p[0] + dx * t - x, p[2] + dz * t - z) / r; };
  // (whether the level sight in plan from p to q crosses the massif's spine, from its west berg's middle to its east berg's)
  const W0 = MASSIF[0], W1 = MASSIF[MASSIF.length - 1], side = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  const behind = (p, q) => { const P = [p[0], p[2]], Q = [q[0], q[2]]; return side(P, Q, W0) * side(P, Q, W1) <= 0 && side(W0, W1, P) * side(W0, W1, Q) <= 0; };
  let i0 = -1, i1 = -1;
  S.forEach((p, i) => { if (behind(p, aim[0])) { if (i0 < 0) i0 = i; i1 = i; } });
  if (i0 < 0) throw new Error('boathouse-full-of-morning: the berg massif faces no stretch of the line');
  // (h: a berg's main shard's own height, as bergShards takes it; R: the share by which its highest corner tops that)
  const R = MASSIF_WORDS.map(bergRise);
  const made = new Map(), tris = (b, h) => { const key = b * 1000 + h * 2; if (!made.has(key)) { const T = []; bergShards({ col: [1, 1, 1], c() {}, tri(p, q, r) { T.push([p, q, r]); } }, MASSIF[b][0], MASSIF[b][1], MASSIF[b][2], h, MASSIF_WORDS[b], null); made.set(key, T); } return made.get(key); };
  const meets = (p, q, T) => { const l = Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]), v = [(q[0] - p[0]) / l, (q[1] - p[1]) / l, (q[2] - p[2]) / l]; return T.some((t) => segMeetsTri(p, v, l, t[0], t[1], t[2])); };
  const [LO, HI] = GREAT_BERG_BAND, H = MASSIF.map(() => LO), TR = H.map((h, b) => tris(b, h));
  const shut = (p, q) => TR.some((T, b) => plan(p, q, b) < 1.5 && meets(p, q, T));
  const open = () => { for (let i = i0; i <= i1; i++) for (const q of aim) if (!shut(S[i], q)) return [S[i], q]; return null; };
  for (let o = open(); o; o = open()) {
    const [p, q] = o;
    let best = -1, bh = 0;
    for (let b = 0; b < MASSIF.length; b++) {
      if (plan(p, q, b) >= 1) continue;
      for (let h = H[b] + 0.5; h * R[b] <= HI; h += 0.5) if (meets(p, q, tris(b, h))) { if (best < 0 || h - H[b] < bh - H[best]) { best = b; bh = h; } break; }
      await ctx.yield();
    }
    if (best < 0) throw new Error('boathouse-full-of-morning: a sight to the last hut\'s door passes the berg massif at every height within the design\'s band');
    H[best] = bh; TR[best] = tris(best, bh);
    await ctx.yield();
  }
  H.forEach((h, b) => { H[b] = Math.max(h + MASSIF_MARGIN, LO); if (!(H[b] * R[b] >= LO && H[b] * R[b] <= HI)) throw new Error('boathouse-full-of-morning: a berg of the massif stands outside the design\'s band at its highest corner'); TR[b] = tris(b, H[b]); });
  await ctx.yield();
  if (open()) throw new Error('boathouse-full-of-morning: the massif\'s margin opens a sight to the last hut\'s door');
  const all = (i) => aim.every((q) => shut(S[i], q));
  let a = i0, e = i1 + 1;
  while (a > 0 && all(a - 1)) a--;
  while (e < S.length && all(e)) e++;
  // (REVEAL_BY: the line's point abreast of the massif's east berg, the one nearest in plan to its middle)
  let k = 0;
  S.forEach((p, i) => { if (Math.hypot(p[0] - W1[0], p[2] - W1[1]) < Math.hypot(S[k][0] - W1[0], S[k][2] - W1[1])) k = i; });
  return { H: H.map((h, b) => h * R[b]), HIDDEN: d0 + 0.5 * a, REVEAL: Math.min(L, d0 + 0.5 * e), REVEAL_BY: d0 + 0.5 * k, stretch: [d0 + 0.5 * i0, d0 + 0.5 * i1] };
}
// the least distance from a point to a triangle: to its plane where the point's foot falls inside it, else to the
// nearest of its three edges
function triNear(px, py, pz, a, b, c) {
  const seg = (p, q) => { const dx = q[0] - p[0], dy = q[1] - p[1], dz = q[2] - p[2], t = clamp(((px - p[0]) * dx + (py - p[1]) * dy + (pz - p[2]) * dz) / (dx * dx + dy * dy + dz * dz || 1), 0, 1); return Math.hypot(p[0] + dx * t - px, p[1] + dy * t - py, p[2] + dz * t - pz); };
  const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
  const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx, nl = Math.hypot(nx, ny, nz);
  if (nl > 1e-9) {
    const d = ((px - a[0]) * nx + (py - a[1]) * ny + (pz - a[2]) * nz) / nl, fx = px - nx / nl * d, fy = py - ny / nl * d, fz = pz - nz / nl * d;
    const side = (p, q) => ((q[1] - p[1]) * (fz - p[2]) - (q[2] - p[2]) * (fy - p[1])) * nx + ((q[2] - p[2]) * (fx - p[0]) - (q[0] - p[0]) * (fz - p[2])) * ny + ((q[0] - p[0]) * (fy - p[1]) - (q[1] - p[1]) * (fx - p[0])) * nz;
    if (side(a, b) >= 0 && side(b, c) >= 0 && side(c, a) >= 0) return Math.abs(d);
  }
  return Math.min(seg(a, b), seg(b, c), seg(c, a));
}
// the metre along the stars' line of its nearest point in plan to a point
function starsMetre(x, z) {
  const P = STARS_LINE; let m = 1e9, at = 0;
  for (let i = 1; i < P.length; i++) { const A = P[i - 1], B = P[i], dx = B[0] - A[0], dz = B[1] - A[1], t = clamp(((x - A[0]) * dx + (z - A[1]) * dz) / (dx * dx + dz * dz), 0, 1), d = Math.hypot(A[0] + dx * t - x, A[1] + dz * t - z); if (d < m) { m = d; at = A[2] + (B[2] - A[2]) * t; } }
  return at;
}
// the least distance in plan from a point to the stars' line
function starsNear(x, z) {
  const P = STARS_LINE; let m = 1e9;
  for (let i = 1; i < P.length; i++) { const A = P[i - 1], B = P[i], dx = B[0] - A[0], dz = B[1] - A[1], t = clamp(((x - A[0]) * dx + (z - A[1]) * dz) / (dx * dx + dz * dz), 0, 1); m = Math.min(m, Math.hypot(A[0] + dx * t - x, A[1] + dz * t - z)); }
  return m;
}
// THE PACK ICE (round three, the lead's B3), NAMED BY A REAL THING: the pack ice of a polar sea in early winter. Broad
// flat floes of many sizes, about 5 to 60 m across, each a plate with its own freeboard (0.35 to 1.25 m over the water)
// and a broken edge that shows; dark leads of open or newly frozen water between them; where two floes meet instead
// of parting, a pressure ridge of blocks piled along the seam; loose blocks only along the ridges and at broken edges.
// It is read in the geometry: plates, their edges, the leads and the ridges. The floes are the cells of a power
// diagram of sites thrown as darts (each with its own reach, smaller near the line) within ICE_R of the leg's middle;
// beyond it the ring's sheet of bands runs on. The sites, the seams (a lead or a ridge, and the lead's width), each
// plate's freeboard and tone and the ridges' piles are drawn from the fork 'pack ice'; the breaks of each plate's
// sides and the loose blocks beside them from the plate's own stream (buildPackIce). A plate keeps 2.6 m of clear
// air from the line and stays under ruling 9's lowest sight (from the islet hut's door to the last hut's foot);
// blocks keep the old rules (clear air with their reach, what the last floe bears, ruling 9's strip, the bergs'
// feet) and keep off the door's side of the last floe's rim (okBlock).
const ICE_R = 330;
// THE SITES, by darts: a site's reach r is half its floe's breadth. The first is the last floe's (FLOE_SITE); every
// other must leave the edge between their two cells FLOE_GAP clear of everything that floe bears (the cells are those
// of the sites' reaches: a point belongs to the site for which its squared distance less the reach squared is least).
// They are thrown first of all the pack's draws (round three d: before the bergs beside the ways, which keep off the
// last floe's cell, siteCell); after the darts, the floe's bound (FLOE_BOUND) sets its sites where it must, with no
// draw.
const CELL = 24, cellKey = (i, j) => i * 4096 + j;
async function throwSites(E) {
  const { ctx } = E, rnd = E.rng.ice, X0 = RING_V[0], Z0 = RING_V[1];
  const S = [], grid = new Map(), key = cellKey;
  const addSite = (x, z, r) => { S.push({ x, z, r, t: 0, poly: null }); const kk = key(Math.floor(x / CELL), Math.floor(z / CELL)); if (!grid.has(kk)) grid.set(kk, []); grid.get(kk).push(S.length - 1); };
  const leavesFloe = (x, z, r) => {
    const F = FLOE_SITE, nx = x - F.x, nz = z - F.z, D = Math.hypot(nx, nz) || 1e-9, c = (x * x + z * z - F.x * F.x - F.z * F.z - r * r + F.r * F.r) / (2 * D);
    return F.things.every(([px, pz]) => c - (nx * px + nz * pz) / D >= FLOE_GAP);
  };
  addSite(FLOE_SITE.x, FLOE_SITE.z, FLOE_SITE.r);
  for (let tr = 0; tr < 9000 && S.length < 900; tr++) {
    if (tr % 700 === 699) await ctx.yield();
    const a = rnd() * 6.2832, q = Math.sqrt(rnd()) * ICE_R, x = X0 + Math.cos(a) * q, z = Z0 + Math.sin(a) * q, rr = rnd();
    const r = (2.5 + 27.5 * Math.pow(rr, 1.7)) * (0.55 + 0.45 * smoothstep(20, 120, E.lineNear(3, x, PLAIN_Y, z)));
    if (!leavesFloe(x, z, r)) continue;
    const gi = Math.floor(x / CELL), gj = Math.floor(z / CELL);
    let ok = true;
    for (let di = -3; di <= 3 && ok; di++) for (let dj = -3; dj <= 3 && ok; dj++) for (const k of grid.get(key(gi + di, gj + dj)) || []) if (Math.hypot(S[k].x - x, S[k].z - z) < 0.85 * (S[k].r + r)) { ok = false; break; }
    if (!ok) continue;
    addSite(x, z, r);
  }
  // (THE FLOE'S BOUND: on each bearing where the floe's cell still reaches past FLOE_BOUND, a site of its reach at twice
  // FLOE_BOUND out; no draw)
  E.floeBoundSites = 0;
  for (let k = 0; k < FLOE_BEARINGS; k++) {
    const a = k / FLOE_BEARINGS * 2 * Math.PI, ux = Math.cos(a), uz = Math.sin(a);
    if (Math.max(...siteCell({ S, grid }, 0).map(([x, z]) => ux * x + uz * z)) <= FLOE_BOUND) continue;
    addSite(FLOE_SITE.x + 2 * FLOE_BOUND * ux, FLOE_SITE.z + 2 * FLOE_BOUND * uz, FLOE_SITE.r);
    E.floeBoundSites++;
  }
  await ctx.yield();
  return { S, grid };
}
// (a half-plane cut of a polygon [x, z, tag of the edge that starts here], keeping nx x + nz z <= c; the new edge
// along the cut takes the tag given)
function cutPoly(poly, nx, nz, c, tag) {
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const A = poly[i], B = poly[(i + 1) % poly.length], da = nx * A[0] + nz * A[1] - c, db = nx * B[0] + nz * B[1] - c;
    if (da <= 0) out.push(A);
    if ((da <= 0) !== (db <= 0)) { const t = da / (da - db); out.push([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, da <= 0 ? tag : A[2]]); }
  }
  return out;
}
// A SITE'S CELL, about the site (its corners [x, z, tag] less the site's place): a square of 2.5 reaches and 20 m either
// way, cut by every neighbour's edge of the power diagram and by the field's rim (tag -1)
function siteCell(sites, i) {
  const { S, grid } = sites, s = S[i], h = 2.5 * s.r + 20, X0 = RING_V[0], Z0 = RING_V[1], gi = Math.floor(s.x / CELL), gj = Math.floor(s.z / CELL);
  let P = [[-h, -h, -1], [h, -h, -1], [h, h, -1], [-h, h, -1]];
  for (let di = -4; di <= 4; di++) for (let dj = -4; dj <= 4; dj++) for (const j of grid.get(cellKey(gi + di, gj + dj)) || []) {
    if (j === i) continue;
    const dx = S[j].x - s.x, dz = S[j].z - s.z;
    P = cutPoly(P, 2 * dx, 2 * dz, dx * dx + dz * dz - S[j].r * S[j].r + s.r * s.r, j);
  }
  if (Math.hypot(s.x - X0, s.z - Z0) + 2.6 * s.r + 20 > ICE_R) for (let k = 0; k < 40; k++) { const a = k / 40 * 6.2832, cx = Math.cos(a), cz = Math.sin(a); P = cutPoly(P, cx, cz, ICE_R - (cx * (s.x - X0) + cz * (s.z - Z0)), -1); }
  return P;
}
async function buildPackIce(E, g, F3, bandAt, bergAt, M, T, okBlock, sites) {
  const { kit, ctx } = E, rnd = E.rng.ice, X0 = RING_V[0], Z0 = RING_V[1], P3 = PLANES[3], { S } = sites;
  const area = (P) => { let s = 0; for (let i = 0; i < P.length; i++) { const A = P[i], B = P[(i + 1) % P.length]; s += A[0] * B[1] - B[0] * A[1]; } return s / 2; };
  // (whether a point lies in a polygon: the number of its edges that the level ray from the point toward +x crosses
  // is odd; each edge holds its lower end and not its upper, so a corner on the ray counts once)
  const inPoly = (P, x, z) => {
    let n = 0;
    for (let k = 0; k < P.length; k++) {
      const A = P[k], B = P[(k + 1) % P.length], lo = Math.min(A[1], B[1]), hi = Math.max(A[1], B[1]);
      if (z < lo || z >= hi) continue;
      if (A[0] + (B[0] - A[0]) * (z - A[1]) / (B[1] - A[1]) > x) n++;
    }
    return n % 2 === 1;
  };
  // THE SEAMS between two floes: a lead of open water (most), or a ridge where they meet
  const seams = new Map(), seamOf = (i, j) => { const k = Math.min(i, j) * 4096 + Math.max(i, j); if (!seams.has(k)) { const ridge = rnd() < 0.17, wide = rnd(); seams.set(k, { ridge, w: ridge ? 0.1 : wide < 0.12 ? 4 + 6 * rnd() : 0.5 + 2.6 * rnd(), a: null, b: null, i: Math.min(i, j), j: Math.max(i, j) }); } return seams.get(k); };
  const strip = (x, z) => { const ax = LAST[0] - P3.c[0], az = LAST[2] - P3.c[2], l2 = ax * ax + az * az, cl = ((x - P3.c[0]) * ax + (z - P3.c[2]) * az) / l2; return { cl, lat: Math.abs((x - P3.c[0]) * az - (z - P3.c[2]) * ax) / Math.sqrt(l2) }; };
  const plates = new Bld(), PA = E.packAudit = { laid: 0, mended: 0, corners: 0, atCell: 0, held: 0, outOfCell: -1e9, leastShare: 1 };
  for (let i = 0; i < S.length; i++) {
    const s = S[i], P = siteCell(sites, i);
    // (the last floe's cell is every plate's: no berg stands on it, for every great berg keeps BERG_LEAD off it, the
    // build's test in buildStars)
    if (P.length < 3 || area(P) < 12) { if (i === 0) throw new Error('boathouse-full-of-morning: the last floe has no cell'); continue; }
    // the plate: each edge drawn in by half its seam's lead, then broken into short uneven lengths
    const n = P.length, off = P.map((A, k) => A[2] < 0 ? 0.4 : seamOf(i, A[2]).w / 2), L2 = [];
    for (let k = 0; k < n; k++) { const A = P[k], B = P[(k + 1) % n], ex = B[0] - A[0], ez = B[1] - A[1], el = Math.hypot(ex, ez) || 1; L2.push([A[0] - ez / el * off[k], A[1] + ex / el * off[k], ex / el, ez / el]); if (A[2] > i) { const sm = seamOf(i, A[2]); sm.a = [s.x + A[0], s.z + A[1]]; sm.b = [s.x + B[0], s.z + B[1]]; } }
    const V = [];
    for (let k = 0; k < n; k++) {
      const a = L2[(k + n - 1) % n], b = L2[k], det = a[2] * b[3] - a[3] * b[2];
      if (Math.abs(det) < 1e-6) { V.push([b[0], b[1], P[k][2]]); continue; }
      const t = ((b[0] - a[0]) * b[3] - (b[1] - a[1]) * b[2]) / det;
      V.push([a[0] + a[2] * t, a[1] + a[3] * t, P[k][2]]);
    }
    // EVERY PLATE AS DRAWN LIES WITHIN ITS OWN CELL (round three e for the last floe; round three f, the lead's S2,
    // for every plate). Two sides nearly in one line, drawn in by different leads, meet far off, far outside the cell
    // and through whatever stands there. So (1) a drawn-in corner that would stand outside its plate's cell is taken
    // at the bevel within it: halfway between the two drawn-in sides' ends at the cell's corner, or at the cell's
    // corner itself where that too would stand outside. The cell is convex, so every side then runs within it. And
    // (2) a break of a side is stepped off the side only where the stepped point still lies within the cell;
    // otherwise the step is not taken and the break stays on its side (the draws are the same). So every point of a
    // plate's outline lies within its cell; its top and sides are laid within that outline's hull, so within the cell.
    // The cells are apart, so no plate's ice lies in another's cell, in the last floe's cell or in the other half of
    // a lead; and a great berg's BERG_LEAD off the last floe's cell (buildStars) is a lead off the floe as drawn.
    let mended = 0, atCell = 0;
    const W = V.map((c, k) => {
      if (polyDist(P, c[0], c[1]) <= 0) return c;
      mended++;
      const j = (k + n - 1) % n, a = L2[j], b = L2[k], h = [(P[k][0] - a[3] * off[j] + b[0]) / 2, (P[k][1] + a[2] * off[j] + b[1]) / 2];
      if (polyDist(P, h[0], h[1]) <= 0) return [h[0], h[1], c[2]];
      atCell++;
      return [P[k][0], P[k][1], c[2]];
    });
    if (area(W) < 0.45 * area(P) || area(W) < 8) { if (i === 0) throw new Error('boathouse-full-of-morning: the last floe is drawn in to nothing'); continue; }
    // (A PLATE'S OWN STREAM, round three f, the lead's S2, way b: the breaks of its sides and the loose blocks beside
    // them draw on a stream named for the plate, its site's number among the darts, 'ice plate 0' the last floe's;
    // the pack's stream draws nothing for them. A moved thing has a stream of its own, so that what did not move is
    // not dealt anew: a plate's own breaks and blocks never move another plate's.)
    const own = E.named('ice plate ' + i), Q = [];
    let held = 0;
    for (let k = 0; k < n; k++) {
      const A = W[k], B = W[(k + 1) % n], ex = B[0] - A[0], ez = B[1] - A[1], el = Math.hypot(ex, ez), seam = A[2] >= 0 && seamOf(i, A[2]).ridge, ns = Math.max(1, Math.round(el / (2.2 + 1.4 * own())));
      for (let m = 0; m < ns; m++) {
        const q = (m + (m ? 0.5 * (own() - 0.5) : 0)) / ns, inw = m ? (seam ? 0.12 : 0.45) * own() : 0, px = A[0] + ex * q, pz = A[1] + ez * q;
        const step = inw > 0 && polyDist(P, px - ez / (el || 1) * inw, pz + ex / (el || 1) * inw) <= 0 ? inw : 0;
        if (inw > 0 && !step) held++;
        Q.push([s.x + px - ez / (el || 1) * step, s.z + pz + ex / (el || 1) * step, A[2]]);
      }
    }
    // its freeboard, lowered where the line or ruling 9's lowest sight would come too near it; the last floe's is FLOE_T
    // (the hut stands on it, and the line comes down to the hut's door: the line's end is HUT.mid over it)
    let t = i === 0 ? FLOE_T : 0.35 + 0.9 * rnd();
    if (i > 0) {
      const farOff = E.lineNear(3, s.x, PLAIN_Y, s.z) > 2.6 * s.r + 30;
      for (const [x, z] of Q) {
        const yb = ringY(x, z), near = farOff ? 1e9 : E.lineNear(3, x, yb + t, z);
        if (near < 2.75) t = Math.min(t, t - (2.75 - near));
        const st = strip(x, z);
        if (st.cl > 0 && st.cl < 1.1 && st.lat < 3.6 + 7 * st.cl) t = Math.min(t, lerp(0.1, HUTS[3].o[1] + 0.4, Math.min(1, st.cl)) - 0.25 - yb);
      }
      if (t < 0.1) continue;
    } else {
      // (the build stops unless the last floe bears everything it should, half a metre in from its edge)
      const worst = Math.max(...FLOE_SITE.things.map(([x, z]) => polyDist(Q, x, z)));
      if (!(worst < -0.5)) throw new Error('boathouse-full-of-morning: the last floe does not bear the hut and its things (' + worst.toFixed(2) + ' m)');
    }
    s.t = t; s.poly = Q;
    // (top: clockwise in the plan so that it faces up; sides from the top down under the water; the last floe's top and
    // sides are laid with the hut, with its contact shade: buildStars)
    const k = 0.80 + 0.16 * rnd(), mx = Q.reduce((a, p) => a + p[0], 0) / Q.length, mz = Q.reduce((a, p) => a + p[1], 0) / Q.length;
    if (i === 0) {
      E.lastFloe = { Q, t, k, mx, mz };
      let br = 0; for (const A of Q) for (const B of Q) br = Math.max(br, Math.hypot(A[0] - B[0], A[1] - B[1]));
      E.lastFloeAudit = { area: +Math.abs(area(Q)).toFixed(1), breadth: +br.toFixed(1), corners: Q.length, reach: +s.r.toFixed(2), freeboard: t, edgeToThings: +(-Math.max(...FLOE_SITE.things.map(([x, z]) => polyDist(Q, x, z)))).toFixed(2), ridges: 0, ridgeBlocks: 0, mended, areaShare: +(area(W) / area(P)).toFixed(4), cell: P.map(([x, z]) => [s.x + x, s.z + z]), outline: Q.map(([x, z]) => [x, z]) };
    }
    else {
      plates.c([C_ICE[0] * k * 0.95, C_ICE[1] * k * 0.98, C_ICE[2] * k], KIND.ICE, 0);
      const c0 = plates.v(mx, ringY(mx, mz) + t, mz, 0, 1, 0, mx, mz), b0 = plates.P.length / 3;
      for (const [x, z] of Q) plates.v(x, ringY(x, z) + t, z, 0, 1, 0, x, z);
      for (let m = 0; m < Q.length; m++) plates.I.push(c0, b0 + (m + 1) % Q.length, b0 + m);
      plates.c([C_ICE[0] * k * 0.62, C_ICE[1] * k * 0.76, C_ICE[2] * k * 0.94], KIND.ICE, 1);
      for (let m = 0; m < Q.length; m++) { const A = Q[m], B = Q[(m + 1) % Q.length], ya = ringY(A[0], A[1]), yb = ringY(B[0], B[1]); plates.quad([A[0], ya + t, A[1]], [B[0], yb + t, B[1]], [B[0], yb - 0.35, B[1]], [A[0], ya - 0.35, A[1]]); }
    }
    // its shadow under the low sun (the last floe's, the broadest, in a step of its own)
    if (i === 0) await ctx.yield();
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
    for (const [x, z] of Q) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
    F3.rect(x0, z0, x1, z1, (x, z) => inPoly(Q, x, z) ? ringY(x, z) + t : -100);
    // loose blocks in the lead beside a broken edge (drawn on the plate's own stream)
    for (let m = 0; m < Q.length; m++) {
      const A = Q[m], sm = A[2] >= 0 ? seamOf(i, A[2]) : null;
      if (!sm || sm.ridge || own() > 0.045) continue;
      const B = Q[(m + 1) % Q.length], ex = B[0] - A[0], ez = B[1] - A[1], el = Math.hypot(ex, ez) || 1, o = 0.3 + Math.min(sm.w * 0.5, 1.5) * own(), size = 0.3 + 0.8 * own();
      okBlock(A[0] + ex * 0.5 + ez / el * o, A[1] + ez * 0.5 - ex / el * o, size, size * (-0.3 + 0.3 * own()), own(), own());
    }
    // (the pack's audit: the plates laid, those with a corner mended and their corners, the corners taken at the cell's
    // own corner, the breaks whose step was not taken, the farthest any outline point stands outside its plate's cell,
    // and the least share of its cell's area that a mended plate keeps)
    PA.laid++; PA.corners += mended; PA.atCell += atCell; PA.held += held;
    for (const [x, z] of Q) PA.outOfCell = Math.max(PA.outOfCell, polyDist(P, x - s.x, z - s.z));
    if (mended) { PA.mended++; PA.leastShare = Math.min(PA.leastShare, area(W) / area(P)); }
    await ctx.yield();
  }
  const pm = plates.mesh(kit.solid[3], 'ice plates');
  pm.userData.kind = 'floor'; pm.frustumCulled = false;
  g.add(pm);
  await ctx.yield();
  // THE RIDGES: blocks piled along a seam where two floes meet, higher in its middle
  let nr = 0;
  for (const sm of seams.values()) {
    if (!sm.ridge || !sm.a || !S[sm.i].poly || !S[sm.j].poly) continue;
    const ex = sm.b[0] - sm.a[0], ez = sm.b[1] - sm.a[1], el = Math.hypot(ex, ez), t = Math.max(S[sm.i].t, S[sm.j].t), hk = 0.5 + rnd();
    for (let d = 0.6; d < el - 0.6; d += 1.3 + 0.9 * rnd()) {
      const q = d / el, mid = Math.sin(Math.PI * q), size = (0.45 + 1.6 * Math.pow(rnd(), 1.4) * mid) * hk, side = (rnd() - 0.5) * 1.2;
      let kept = okBlock(sm.a[0] + ex * q - ez / el * side, sm.a[1] + ez * q + ex / el * side, size, t + size * (-0.15 + 0.45 * rnd()), rnd(), rnd());
      if (rnd() < 0.25 * mid) kept += okBlock(sm.a[0] + ex * q, sm.a[1] + ez * q, size * 0.6, t + size * 0.75, rnd(), rnd());
      if (sm.i === 0) E.lastFloeAudit.ridgeBlocks += kept;
    }
    if (sm.i === 0) E.lastFloeAudit.ridges++;
    if (++nr % 30 === 0) await ctx.yield();
  }
  // THE LEADS: dark water, open or newly frozen, under all the floes; at the field's rim it is the ring's sheet again
  const lead = new Bld(), NR = 44, NA = 120;
  for (let j = 0; j <= NR; j++) for (let a = 0; a <= NA; a++) {
    const r = (ICE_R + 6) * j / NR, an = (a % NA) / NA * 6.2832, x = X0 + Math.cos(an) * r, z = Z0 + Math.sin(an) * r;
    lead.c(bandAt(x, z), KIND.FLOE, 1.2 * smoothstep(ICE_R - 40, ICE_R + 6, r));
    lead.v(x, ringY(x, z) - 0.03 - 0.5 * smoothstep(ICE_R - 4, ICE_R + 6, r), z, 0, 1, 0, 1.0, 0);
  }
  for (let j = 0; j < NR; j++) for (let a = 0; a < NA; a++) { const k = j * (NA + 1) + a; lead.I.push(k, k + 1, k + NA + 2, k, k + NA + 2, k + NA + 1); }
  const lm = lead.mesh(kit.solid[3], 'leads');
  lm.userData.kind = 'floor'; lm.frustumCulled = false;
  g.add(lm);
  await ctx.yield();
  return S.filter((s) => s.poly).length;
}
async function buildStars(E) {
  const { kit, ctx } = E, g = E.G[3], rnd = E.rng.stars, F3 = shadeField(SH3);
  // the seed deals the comet's place and the moons' places (read by the stars' sky)
  kit.U.uDeal.value.set(1.75 + 0.15 * rnd(), 0.40 + 0.06 * rnd(), 2 * rnd() - 1, 2 * rnd() - 1);
  let b = new Bld();
  // THE SHEET: strips about RING_C, each its own colour; a strip that is a gap is left out (but for where it runs
  // within 170 m of RING_V: there it lies as a dark lane, so that the ice under the line is whole)
  const strips = [];
  {
    const fix = fixedRng('ring bands'), SEG = 192;
    for (let r = RING_IN; r < RING_OUT;) { const near = Math.abs(r - RING_D) < 150, w = near ? 5 + 5 * fix() : 10 + 22 * fix(); strips.push([r, Math.min(RING_OUT, r + w), null]); r += w; }
    let n = 0;
    for (const st of strips) {
      const [r0, r1] = st, rm = (r0 + r1) / 2, broad = vnC(rm * 0.0085, 11), gap = broad < 0.33 || (hsh(n, 91) < 0.09 && Math.abs(rm - RING_D) > 40);
      const q = 0.50 * vnC(rm * 0.0042, 3) + 0.28 * vnC(rm * 0.019, 7) + 0.22 * hsh(n, 5), lum = (0.16 + 0.84 * q * q * 1.6) * (gap ? 0.30 : 1) * smoothstep(0.33, 0.45, Math.max(broad, gap ? 1 : 0)) + 0.10, warm = vnC(rm * 0.011, 5);
      st[2] = [lerp(0.70, 0.95, warm) * lum, lerp(0.80, 0.92, warm) * lum, lerp(0.98, 0.86, warm) * lum];
      b.c(st[2], KIND.RING);
      const base = b.P.length / 3;
      for (const r of [r0, r1]) for (let i = 0; i <= SEG; i++) {
        const a = (i % SEG) / SEG * Math.PI * 2, x = RING_C[0] + Math.cos(a) * r, z = RING_C[1] + Math.sin(a) * r;
        b.ex = (x - RING_V[0]) * RING_DIR[0] + (z - RING_V[1]) * RING_DIR[1] > RING_D ? 1 : 0;
        b.v(x, ringY(x, z), z, 0, 1, 0, x, z);
      }
      for (let i = 0; i < SEG; i++) {
        const k = base + i, am = (i + 0.5) / SEG * Math.PI * 2, mx = RING_C[0] + Math.cos(am) * rm, mz = RING_C[1] + Math.sin(am) * rm;
        if (gap && Math.hypot(mx - RING_V[0], mz - RING_V[1]) > 170) continue;
        // (none under the pack ice: there the leads are the floor)
        if (Math.max(...[[i, r0], [i + 1, r0], [i, r1], [i + 1, r1]].map(([q, rr]) => Math.hypot(RING_C[0] + Math.cos(q / SEG * 6.2832) * rr - RING_V[0], RING_C[1] + Math.sin(q / SEG * 6.2832) * rr - RING_V[1]))) < ICE_R - 2) continue;
        b.I.push(k, k + 1, k + SEG + 2, k, k + SEG + 2, k + SEG + 1);
      }
      if (++n % 12 === 0) await ctx.yield();
    }
  }
  // (the sheet's own colour at a point: its strip's)
  const bandAt = (x, z) => { const r = Math.hypot(x - RING_C[0], z - RING_C[1]); for (const st of strips) if (r < st[1]) return st[2]; return strips[strips.length - 1][2]; };
  const plain = b.mesh(kit.solid[3], 'ring sheet');
  plain.userData.kind = 'floor'; plain.frustumCulled = false;
  g.add(plain);
  await ctx.yield();
  // THE GREAT BERGS (see MASSIF and BESIDE), and the crag on which the lone doorway stands. The bergs beside the ways are
  // thrown each from its band's own stream by the bands' rules, or take their bands' homes; then the tests that
  // MASSIF's comment names. Each berg: [x, z, its foot's radius, its height (its highest corner's over the plain,
  // to which greatBerg builds), its metre along the line].
  b = new Bld();
  const MH = E.massifH, [LO, HI] = GREAT_BERG_BAND, [F0, F1] = BESIDE_FOOT;
  const berg = MASSIF.map(([x, z, r], i) => [x, z, r, MH[i], starsMetre(x, z)]);
  E.massif = berg.map((q) => q.slice(0, 4).map((v) => +v.toFixed(2)));
  // (the pack's sites are thrown first, so that the bergs beside the ways keep off the last floe's cell)
  const sites = await throwSites(E), floeCell = siteCell(sites, 0).map(([x, z]) => [sites.S[0].x + x, sites.S[0].z + z]);
  E.beside = []; E.besideThrows = [];
  BESIDE.forEach(([name, m0, m1, hand, o0, o1], k) => {
    const gb = E.named('great bergs: ' + name);
    let put = null, t = 0;
    for (; t < 40 && !put; t++) {
      const m = m0 + (m1 - m0) * gb(), o = o0 + (o1 - o0) * gb(), rad = F0 + (F1 - F0) * gb(), hgt = LO + (HI - LO) * gb(), p = starsAt(m), r = right(p[2]), x = p[0] + hand * r[0] * (o + rad), z = p[1] + hand * r[1] * (o + rad);
      if (starsNear(x, z) - rad < MASSIF_GAP.line || stripClear(x, z, rad) < MASSIF_GAP.strip || berg.some((q) => Math.hypot(x - q[0], z - q[1]) < rad + q[2] + BERG_LEAD)) continue;
      if (polyDist(floeCell, x, z) < rad + BERG_LEAD || hidesHut(x, z, rad)) continue;
      put = [x, z, rad, hgt, m];
    }
    const home = !put, H = BESIDE_HOMES[k];
    if (home) put = [H.x, H.z, H.rad, H.hgt, H.m];
    berg.push(put);
    E.besideThrows.push(home ? 'home' : t);
    E.beside.push(`${name}: (${put[0].toFixed(1)}, ${put[1].toFixed(1)}), foot ${put[2].toFixed(1)} m, ${put[3].toFixed(1)} m tall` + (home ? ', at its home' : ''));
  });
  // (THE COUNT, a guard, for the placing cannot fail: six or more great bergs within the design's band stand beside the
  // line, by metres within it, not past its end)
  const along = berg.filter(([, , , h, m]) => h >= LO && h <= HI && m >= 0 && m <= STARS_END).length;
  if (along < 6) throw new Error(`boathouse-full-of-morning: only ${along} great bergs within the design's band stand beside the line`);
  E.bergsAlong = along;
  const bergAt = [], spans = [];
  E.bergFloeLead = 1e9; E.besideFloeLead = 1e9; E.besideLead = 1e9; E.bergTops = [];
  berg.forEach(([x, z, rad, hgt], i) => {
    if (stripClear(x, z, rad) < MASSIF_GAP.strip - 1e-6) throw new Error(`boathouse-full-of-morning: great berg ${i + 1} stands in ruling 9's strip`);
    // (no great berg stands on the last floe: every foot keeps BERG_LEAD from its cell)
    const lead = polyDist(floeCell, x, z) - rad;
    if (!(lead >= BERG_LEAD - 1e-6)) throw new Error(`boathouse-full-of-morning: great berg ${i + 1} comes within ${BERG_LEAD} m of the last floe's cell`);
    E.bergFloeLead = Math.min(E.bergFloeLead, +lead.toFixed(2));
    if (i >= MASSIF.length) {
      E.besideFloeLead = Math.min(E.besideFloeLead, +lead.toFixed(2));
      for (let j = 0; j < i; j++) E.besideLead = Math.min(E.besideLead, +(Math.hypot(x - berg[j][0], z - berg[j][1]) - rad - berg[j][2]).toFixed(2));
    }
    bergAt.push([x, z, rad]);
    const i0 = b.I.length;
    greatBerg(b, x, z, rad, hgt, i < MASSIF.length ? MASSIF_WORDS[i] : 'great berg ' + (i + 1), F3);
    spans.push([i0, b.I.length]);
    // (for the audit: the berg's highest corner over the plain, read from its triangles as built)
    let top = -1e9;
    for (let t = i0; t < b.I.length; t++) top = Math.max(top, b.P[3 * b.I[t] + 1]);
    E.bergTops.push(+(top - PLAIN_Y).toFixed(3));
  });
  await ctx.yield();
  // (no triangle of a great berg comes within the law's 2.6 m of the line: each berg's triangles against the stars'
  // points of the line that stand within its foot and 20 m in plan, and within each triangle's box and 12 m; the least
  // is kept for the audit)
  {
    const LP = E.linePts[3], V = b.P;
    let least = 1e9;
    for (let s = 0; s < spans.length; s++) {
      const [i0, i1] = spans[s], near = [];
      for (let i = 0; i < LP.length; i += 3) if (Math.hypot(LP[i] - berg[s][0], LP[i + 2] - berg[s][1]) < berg[s][2] + 20) near.push(LP[i], LP[i + 1], LP[i + 2]);
      for (let t = i0; t < i1 && near.length; t += 3) {
        const A = 3 * b.I[t], B = 3 * b.I[t + 1], C = 3 * b.I[t + 2], a = [V[A], V[A + 1], V[A + 2]], bb = [V[B], V[B + 1], V[B + 2]], c = [V[C], V[C + 1], V[C + 2]];
        const x0 = Math.min(a[0], bb[0], c[0]) - 12, x1 = Math.max(a[0], bb[0], c[0]) + 12, y0 = Math.min(a[1], bb[1], c[1]) - 12, y1 = Math.max(a[1], bb[1], c[1]) + 12, z0 = Math.min(a[2], bb[2], c[2]) - 12, z1 = Math.max(a[2], bb[2], c[2]) + 12;
        for (let i = 0; i < near.length; i += 3) {
          if (near[i] < x0 || near[i] > x1 || near[i + 1] < y0 || near[i + 1] > y1 || near[i + 2] < z0 || near[i + 2] > z1) continue;
          least = Math.min(least, triNear(near[i], near[i + 1], near[i + 2], a, bb, c));
        }
      }
      if (s % 2 === 1) await ctx.yield();
    }
    if (least < 2.6) throw new Error(`boathouse-full-of-morning: a great berg comes ${least.toFixed(2)} m from the line`);
    E.bergAir = least;
  }
  await ctx.yield();
  const P3 = PLANES[3];
  b.c([C_ICE[0] * 0.9, C_ICE[1] * 0.95, C_ICE[2]], KIND.ICE, 1);
  crag(b, P3.c[0] - P3.n[0] * 3.2, PLAIN_Y + 5.2, P3.c[2] - P3.n[2] * 3.2, 7.5, 9.0, 6.5, 8, 5, (px, py, pz) => fbmC(px * 0.4 + 3, pz * 0.4 + py * 0.3, 2) - 0.5, 0.5, 0.12);
  const bergs = b.mesh(kit.solid[3], 'great bergs');
  bergs.userData.kind = 'body';
  g.add(bergs);
  await ctx.yield();
  // THE BLOCKS of the pack ice (see buildPackIce): along the ridges and at broken edges, as round every floe, the last
  // hut's among them (round three c: it is one of the pack's floes, THE LAST FLOE); every one is frozen where it
  // stands. None comes within 2.6 m of the line, counting its own reach (1.25 of its size); none comes within its reach
  // and FLOE_BLOCK_GAP (0.5 m) of what the last floe bears (LAST_BEARS: the hut, the jetty, the bank, the boat); none
  // stands in the sight from the sea's hut's door to the last hut (the owner's ruling 9) above the lowest line of that
  // sight less a metre; none stands in a berg's foot.
  const L3 = E.path.length - E.at3, geos = [1, 2, 3].map(iceBlockGeo), M = [[], [], []], T = [[], [], []];
  // THE DOOR'S SIDE OF THE LAST FLOE IS NEVER PILED (round three f, the lead's S4). The reason is the owner's term f:
  // nothing of ours draws a ring or a closed line round the hut that holds the way out, and blocks piled along the
  // last floe's ridged seams on every side of the hut could close such a line. The rule, by place: no block of ice
  // stands within FLOE_OPEN.rim (3 m, and the block's own reach) of the last floe's outline, on either side of it, in
  // the third of the round that faces the jetty: within FLOE_OPEN.half (60 degrees) either side of the jetty's
  // bearing from the hut, which is the bearing in plan from the middle of the hut under its roof (hutRoofPlan) to
  // the middle of its jetty (JETTY_PLAN). So a third of the floe's rim, on the side of the door and the jetty,
  // stays open on every seed. okBlock refuses such a block and draws nothing, so no other block moves; the seams,
  // their leads and the plates' outlines are as they were.
  const FLOE_OPEN = { rim: 3, half: Math.PI / 3 };
  const doorSide = (() => {
    const R = hutRoofPlan(), [fx, fz] = fromHut3((R.x0 + R.x1) / 2, (R.z0 + R.z1) / 2), [tx, tz] = fromHut3((LAST_JETTY.x0 + LAST_JETTY.x1) / 2, (LAST_JETTY.z0 + LAST_JETTY.z1) / 2);
    const ux = tx - fx, uz = tz - fz, ul = Math.hypot(ux, uz), c = Math.cos(FLOE_OPEN.half);
    return (x, z) => { const dx = x - fx, dz = z - fz; return dx * ux + dz * uz >= c * ul * Math.hypot(dx, dz); };
  })();
  const okBlock = (x, z, size, dy, ra, rb) => {
    const y = ringY(x, z) + dy;
    if (E.lineNear(3, x, y, z) < 2.75 + size * 1.25) return false;
    if (FLOE_SITE.outlines.some((P) => polyDist(P, x, z) < size * 1.25 + FLOE_BLOCK_GAP)) return false;
    if (doorSide(x, z) && Math.abs(polyDist(E.lastFloe.Q, x, z)) < FLOE_OPEN.rim + size * 1.25) return false;
    const { cl, lat } = sightOff(x, z, 1.1);
    if (lat < 3.4 + 7 * cl + size && y + size * 0.75 > lerp(P3.c[1] - 2.7, PLAIN_Y, cl) - 1.0) return false;
    if (bergAt.some((q) => Math.hypot(x - q[0], z - q[1]) < q[2] * 0.8)) return false;
    const v = Math.floor(ra * 3) % 3, sq = 0.75 + 0.5 * rb;
    M[v].push(M4().makeTranslation(x, y, z).multiply(M4().makeRotationFromEuler(_e.set(6.283 * ra, 9.1 * rb, 2.3 * ra, 'XYZ'))).multiply(M4().makeScale(size * sq, size * (1.6 - sq) * 0.9, size)));
    // (blue: -1, frozen where it stands: the ice blocks' vertex shader then neither turns nor drifts it)
    T[v].push(tint(0.72 + 0.4 * rb, ra, -1));
    return true;
  };
  E.nFloes = await buildPackIce(E, g, F3, bandAt, bergAt, M, T, okBlock, sites);
  for (let v = 0; v < 3; v++) {
    const m = instanced(geos[v], kit.ice, M[v], T[v], 'ice blocks');
    m.userData.kind = 'body'; m.userData.sweep = 0.3; m.frustumCulled = false;
    g.add(m);
    await ctx.yield();
  }
  // fine ice dust passing as points in the sun, about the line (never nearer than 9 m), dealt on a stream of its own,
  // 'ice dust' (round three c: it is kept by the line, so a move of the line re-deals only the dust); and far glitter on
  // the ring's arcs round the planet
  const dust = [], dr = E.named('ice dust');
  for (let i = 0; i < Math.round(620 * E.detail); i++) {
    E.path.posAtDist(E.at3 + L3 * dr(), _c);
    const a = dr() * 6.283, r = 10 + 34 * dr(), q = [_c.x + Math.cos(a) * r, _c.y + (dr() - 0.4) * 16, _c.z + Math.sin(a) * r];
    if (q[1] > PLAIN_Y + 0.5 && E.lineNear(3, q[0], q[1], q[2]) >= 9 + 1.2) dust.push(q);
  }
  g.add(kit.sparks(3, dust, { color: [1.5, 1.42, 1.25], size: 0.022, wander: 1.2, blink: 0.7, tag: 'ice dust' }, dr));
  const glit = [];
  for (let i = 0; i < Math.round(700 * E.detail); i++) {
    const a = rnd() * 6.283, r = RING_IN + (RING_OUT - RING_IN) * rnd(), x = RING_C[0] + Math.cos(a) * r, z = RING_C[1] + Math.sin(a) * r, dv = Math.hypot(x - RING_V[0], z - RING_V[1]);
    if (dv < ICE_R + 10 || vnC(r * 0.0085, 11) < 0.27 || (x - RING_V[0]) * RING_DIR[0] + (z - RING_V[1]) * RING_DIR[1] > RING_D) continue;
    glit.push([x, ringY(x, z) + 0.6, z]);
  }
  g.add(kit.sparks(3, glit, { color: [1.7, 1.65, 1.5], size: 0.3, wander: 0.2, blink: 1, tag: 'far glitter' }, rnd));
  await ctx.yield();
  // THE LONE DOORWAY: a plain square-headed doorway of pale stone of the box's doorway's own outline, the back of
  // plane three, standing on its crag
  b = new Bld();
  const dt = PLANES[3].top + 1.0;
  gateBack(b, 3, { hw: 4.7, bot: -2.72, top: dt, depth: 0.5, splay: 1.2, col: C_WALLW, kind: KIND.FLAGS });
  b.push(planeFrame(3));
  b.c(C_WALLW, KIND.FLAGS);
  b.box(-5.9, -2.72, -0.5, -4.7, dt, 0, 'Z'); b.box(4.7, -2.72, -0.5, 5.9, dt, 0, 'Z'); b.box(-5.9, dt, -0.5, 5.9, dt + 0.6, 0, 'Z');
  b.box(-5.9, -4.2, -1.9, 5.9, -2.72, 0, 'Z');
  b.pop();
  const dm = b.mesh(kit.solid2[3], 'lone doorway');
  dm.userData.kind = 'body';
  g.add(dm);
  // THE SAME HUT, ON ITS FLOE: the one builder again, with its jetty and its lantern. Its door's plane is the way out's;
  // its water line y -15.70, the top of the floe that bears it (THE LAST FLOE; the build stops otherwise).
  b = new Bld();
  const hutM = M4().makeTranslation(HUTS[3].o[0], HUTS[3].o[1], HUTS[3].o[2]).multiply(M4().makeRotationY(_hi));
  b.push(hutM);
  // (round four: the last box shows its dark inside behind the way out; its lamp's phase is dealt on its own stream)
  buildHut(b, { inside: true, phase: E.named('lamp of the last box')() });
  const J = buildJetty(b, E.named('fenders of the last hut'));
  if (Math.abs(HUTS[3].o[1] - (PLAIN_Y + FLOE_T)) > 1e-9) throw new Error('boathouse-full-of-morning: the last hut does not stand on its floe');
  // its clod of shore, now a low bank frozen in behind and beside it: turf, stones along its edge, a tuft of frosted reeds
  const CL = LAST_BANK, NSG = 18;
  const edge = (a) => 0.82 + 0.3 * fbmC(Math.cos(a) * 1.7 + 4, Math.sin(a) * 1.7 + 9, 2);
  b.c([TURF_L[0] * 0.8, TURF_L[1] * 0.85, TURF_L[2] * 1.3], KIND.TURF, 1);
  const cap = b.v(CL.c[0], 0.34, CL.c[1], 0, 1, 0, CL.c[0], CL.c[1]), top0 = b.P.length / 3;
  for (let i = 0; i <= NSG; i++) { const a = (i % NSG) / NSG * 6.2832, k = edge(a), x = CL.c[0] + Math.cos(a) * CL.rx * k, z = Math.min(0.28, CL.c[1] + Math.sin(a) * CL.rz * k); b.v(x, 0.0, z, Math.cos(a) * 0.3, 0.95, Math.sin(a) * 0.3, x, z); }
  for (let i = 0; i < NSG; i++) b.I.push(cap, top0 + i + 1, top0 + i);
  for (let i = 0; i < NSG; i++) {
    const a = (i + 0.3 * hsh(i, 44)) / NSG * 6.2832, k = edge(a) * 1.02, x = CL.c[0] + Math.cos(a) * CL.rx * k, z = CL.c[1] + Math.sin(a) * CL.rz * k, sz = 0.3 + 0.35 * hsh(i, 45);
    if (z > -0.4) continue;
    b.c([0.16 + 0.1 * hsh(i, 46), 0.16 + 0.08 * hsh(i, 47), 0.17], KIND.ROCK);
    b.blob(x, 0.06 + 0.3 * sz, z, sz * 1.2, sz * 0.7, sz, 6, 4, (px, py, pz) => vnC(px * 3, pz * 3 + py) - 0.5, 0.4);
  }
  b.c([0.62, 0.66, 0.50], KIND.PLAIN, 0, 0.0);
  for (let i = 0; i < 16; i++) {
    const x = -7.0 + 1.3 * hsh(i, 71), z = -1.6 - 2.2 * hsh(i, 72), h = 1.3 + 1.0 * hsh(i, 73), lx = 0.3 * (hsh(i, 74) - 0.5);
    b.tube([[x, 0.0, z], [x + lx * 0.4, h * 0.55, z], [x + lx, h, z + 0.05]], (q) => 0.035 * (1 - 0.85 * q), 3, (q) => 0.05 * q * q);
  }
  // (the place dresses the box: icicles under the sign bands of its two flanks and along the jetty's edge; things on
  // it, never another body)
  b.c([0.80, 0.90, 1.0], KIND.ICE, 0, 0.0);
  for (let i = 0; i < 46; i++) {
    const sd = i % 2 ? -1 : 1, z = (HUT.front + HUT.back) / 2 + 6.4 * (hsh(i, 81) - 0.5), len = 0.25 + 0.75 * hsh(i, 82) * hsh(i, 83), x = sd * (HUT.w + 0.03), y = HUT.head + 0.2;
    b.cyl(x, z, 0.035, 0.004, y - len, y, 4, '');
  }
  for (let i = 0; i < 18; i++) { const z = -8.5 + 20 * hsh(i, 85), len = 0.12 + 0.3 * hsh(i, 86); b.cyl(J.x1 + 0.01, z, 0.022, 0.003, J.y - 0.2 - len, J.y - 0.2, 4, ''); }
  b.pop();
  const hut = b.mesh(kit.solid2[3], 'last hut');
  hut.userData.kind = 'body';
  g.add(hut);
  await ctx.yield();
  // THE LAST FLOE (round three c, the lead's C1): its outline, freeboard and tone are the pack's own (buildPackIce, where
  // it is the first site); here its top is laid from its middle out to that outline in rings, so that it carries the
  // contact shade under the hut, the bank, the jetty and the boat in its corners' colour, and its sides go down under
  // the water as every plate's. Round it lies the pack's own lead of each seam. The ring's frost is on the hut itself:
  // its icicles under the sign bands and along the jetty's edge.
  b = new Bld();
  {
    const F = E.lastFloe, NR = 16, n = F.Q.length, top = PLAIN_Y + F.t, boat = [J.x1 + 1.5, 5.2];
    const shadeAt = (xh, zh) => {
      const dh = Math.max(Math.abs(xh) - (HUT.hw + 0.2), Math.max(zh - BOXP.z1 - 0.3, BOXP.z0 - 0.3 - zh)), dj = Math.max(Math.abs(xh - (J.x0 + J.x1) / 2) - 0.9, Math.max(zh - J.z1, J.z0 - zh));
      const db = Math.hypot((xh - boat[0]) / 0.75, (zh - boat[1]) / 2.2) - 1, dc = (Math.hypot((xh - CL.c[0]) / CL.rx, (zh - CL.c[1]) / CL.rz) - 0.95) * 7;
      return 1 - 0.62 * Math.max(smoothstep(1.6, 0, dh), smoothstep(0.9, 0, dj), smoothstep(0.5, 0, db), 0.6 * smoothstep(1.2, 0, dc));
    };
    const base = b.P.length / 3;
    for (let j = 0; j <= NR; j++) for (let m = 0; m < n; m++) {
      const q = j / NR, x = F.mx + (F.Q[m][0] - F.mx) * q, z = F.mz + (F.Q[m][1] - F.mz) * q, h = toHut3(x, z), sh = shadeAt(h[0], h[1]);
      b.c([C_ICE[0] * F.k * 0.95 * sh, C_ICE[1] * F.k * 0.98 * sh, C_ICE[2] * F.k * sh], KIND.ICE, 0);
      b.v(x, top, z, 0, 1, 0, x, z);
    }
    for (let j = 0; j < NR; j++) for (let m = 0; m < n; m++) { const a0 = base + j * n + m, a1 = base + j * n + (m + 1) % n; b.I.push(a0, a1, a1 + n, a0, a1 + n, a0 + n); }
    b.c([C_ICE[0] * F.k * 0.62, C_ICE[1] * F.k * 0.76, C_ICE[2] * F.k * 0.94], KIND.ICE, 1);
    for (let m = 0; m < n; m++) { const A = F.Q[m], B = F.Q[(m + 1) % n], ya = ringY(A[0], A[1]), yb = ringY(B[0], B[1]); b.quad([A[0], top, A[1]], [B[0], top, B[1]], [B[0], yb - 0.35, B[1]], [A[0], ya - 0.35, A[1]]); }
  }
  const floe = b.mesh(kit.solid[3], 'last floe');
  floe.userData.kind = 'floor';
  g.add(floe);
  await ctx.yield();
  // ONE ROWING BOAT frozen in beside the jetty, pale, its oars shipped, a slack rope from the jetty's post to its bow
  b = new Bld();
  buildBoat(b, [0.60, 0.55, 0.44]);
  b.c([0.42, 0.36, 0.25], KIND.PLAIN);
  b.tube([[0, 0.5, 2.1], [-0.5, 0.25, 3.0], [-1.25, 0.45, 3.9], [-1.55, 0.9, 4.3]], 0.022, 4);
  const boat = b.mesh(kit.solid2[3], 'last boat');
  boat.userData.kind = 'body';
  boat.position.copy(_c.set(J.x1 + 1.5, -0.10, 5.2).applyMatrix4(hutM)); boat.rotation.set(0.0, _hi + 0.08, 0.05, 'YXZ');
  g.add(boat);
  // the ring's shadows: the hut, its jetty and the bergs are stamped; one sweep toward the low sun
  F3.rect(HUTS[3].o[0] - 14, HUTS[3].o[2] - 14, HUTS[3].o[0] + 14, HUTS[3].o[2] + 14, (x, z) => {
    const q = toHut3(x, z);
    const t = hutTopAt(q[0], q[1]);
    if (t > -50) return HUTS[3].o[1] + t;
    if (q[0] > J.x0 && q[0] < J.x1 && q[1] > J.z0 && q[1] < J.z1) return HUTS[3].o[1] + J.y;
    return -100;
  });
  await bakeShade(E, F3, SUN.stars, 3);
  await ctx.yield();
}

// ---------------------------------------------------------------------------------------------------------------------
// THE MODULE
// ---------------------------------------------------------------------------------------------------------------------
const _inv = new THREE.Matrix4(), _pv = new THREE.Matrix4(), _fr = new THREE.Frustum(), _c = new THREE.Vector3();
// the four corners of opening i's outline (half a metre larger all round), for update()'s test: the opening is out of
// sight only when all four corners lie beyond one of the four SIDE planes of the eye's view (planes 0 to 3 of three.js's
// frustum: right, left, bottom, top). The near and the far plane are never asked, so that in the last metres before a
// plane, and the first after it, the next place stays in while the opening fills the view.
const CORNERS = [null, 1, 2, 3].map((i) => {
  if (!i) return null;
  const P = PLANES[i], rx = P.n[2], rz = -P.n[0], w = HW + 0.5, lo = P.c[1] - P.foot - 0.5, hi = P.c[1] + P.top + 0.5;
  return [[-w, lo], [w, lo], [w, hi], [-w, hi]].map(([a, y]) => new THREE.Vector3(P.c[0] + rx * a, y, P.c[2] + rz * a));
});
function openingSeen(i) {
  const cs = CORNERS[i];
  for (let p = 0; p < 4; p++) {
    const pl = _fr.planes[p];
    let out = 0;
    for (const c of cs) if (pl.distanceToPoint(c) < 0) out++;
    if (out === 4) return false;
  }
  return true;
}

export default {
  id: 'boathouse-full-of-morning',
  name: "(working title only; the shown title is the owner's)",
  category: 'screen',
  placeKind: 'bizarre',
  screen: 'Doctor Who',
  screenYear: '1963',
  screenKind: 'series',
  media: ['air', 'open', 'water', 'space'],
  weirdness: 0.62,
  async build(ctx) {
    // FORKS OF THE SEED (the planes, the outlines, the line, the huts and the berg massif never read the seed; round
    // three d: the massif's three bergs draw their shards from fixed streams of their own, named for the massif as it
    // now stands, MASSIF_WORDS, never from round three b's 'great berg' words):
    //   'lake': reeds, lilies, boats, the heron, the far house's windows;  'garden': which flowers stand where, the
    //   quarters' dressing, the cut beds' colours, the doves' number;  'sea': which moored boats lie where and dry
    //   their sails, the fleet's number, the steamer's place on its course, which boat stores stand open, the pots'
    //   heaps, the harbour's gulls, the gulls of the other stacks and the islet;  'town': each house's width, storeys,
    //   wash, roof, chimneys, lit share and smoke;  'stars': the comet's and the moons' places, the far glitter on the
    //   ring's arcs (its places and sparks);  'pack ice': the floes' plan (sites, sizes, leads, ridges), their
    //   freeboard and tone, and where every block piled along the ridges lies, its size and turning.
    //   NAMED STREAMS (round three b): a block put in, moved or taken out from now on draws on a stream of its own,
    //   made from its name and the world's seed (named(name)), so that no other deal moves: the fenders of each
    //   jetty ('fenders of the lake hut', and of the garden hut, the islet hut, the last hut), the phase of each
    //   box's lamp (round four: 'lamp of the lake box', and of the garden box, the islet box, the last box), 'cherry avenue', 'second
    //   boat' (its phase on its ring and its rocking), 'home-coming boat' (its swing at the buoy and its rocking), 'great
    //   bergs' (the four bergs beside the ways, to round three d); and from round three c 'fleet' (the
    //   fleet under sail after the second boat: courses, hulls, sails, phases), 'ice dust' (the dust's spots and their
    //   sparks), 'gulls of the near stack'; and from round three e (the lead's R2) four streams in place of 'great
    //   bergs', one for each band of the bergs beside the ways, 'great bergs: ' and the band's name (BESIDE): the
    //   places, feet and heights of that band's throws, so that a band's tests move its own berg alone. Every berg
    //   beside the ways is dealt anew in round three e, on every seed.
    //   ROUND THREE F (the lead's S2, way b): EVERY PLATE OF THE PACK HAS A STREAM OF ITS OWN, 'ice plate ' and its
    //   number (its site's number among the darts; 'ice plate 0' is the last floe's): the breaks of the plate's sides,
    //   every side's, and all the loose blocks beside them draw on it, whether a corner of the plate is mended or
    //   not, and 'pack ice' draws nothing for them. The reason is the law's own: a moved thing has a stream of its
    //   own, so that what did not move is not dealt anew. Round three e's 'last floe's sides' is no more (the last
    //   floe's stream is 'ice plate 0'). WHAT IS DEALT ANEW IN ROUND THREE F, once, on every seed: the whole pack but
    //   for its sites and the last floe's own seams (the first draws of 'pack ice' after the darts): every other
    //   seam's lead or ridge, every plate's freeboard, tone, broken edge and loose blocks, and the ridges' piles
    //   (the breaks' draws left 'pack ice', so every draw after the last floe's seams falls anew); and the four bergs
    //   beside the ways in height (the lead's S3: the height drawn is now the berg's highest corner's), their places
    //   and feet falling where the same draws and the tests put them.
    // ctx.vary.rare: northern lights over the lake's hills, a second far ringed planet in the stars (the part file).
    const rare = !!(ctx.vary && ctx.vary.rare);
    const detail = clamp(ctx.quality && ctx.quality.detail != null ? ctx.quality.detail : 1, 0.4, 1);
    const kit = makeKit(ctx);
    await ctx.yield();
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    const G = [0, 1, 2, 3].map((i) => { const g = new THREE.Group(); g.name = 'place' + i; scene.add(g); return g; });
    scene.add(kit.sky());
    scene.userData.lawU = kit.U;
    // (the clouds' lanes across the wind, cloudLanes; the build stops if any lane's reach meets the canal's or the
    // garden hut's band)
    const CL = cloudLanes();
    CL.lanes.forEach((c, k) => { const r = CLOUDS[k].halfAcross * (1 + CLOUD_WOB / 2); for (const [lo, hi] of [CL.canal, CL.hut]) if (c + r > lo && c - r < hi) throw new Error('boathouse-full-of-morning: a cloud lane meets the ' + (lo === CL.canal[0] ? 'canal' : 'garden hut')); });
    kit.U.uCloudAc.value.set(...CL.lanes);
    // (the law's viewport, before every drawing of the scene into whatever buffer: see lawRay in the part file)
    scene.onBeforeRender = (renderer) => { renderer.getCurrentViewport(kit.U.uVP.value); };
    const wake = [];
    for (let i = 0; i < NWAKE; i++) wake.push(new THREE.Vector4(1e6, 1e6, 0, 1));
    const water = [0, 1, 2].map((p) => kit.mat(p, { body: WATER_BODY, defs: WATER_DEFS, tag: 'water' + p, uniforms: { uWake: { value: wake } } }));
    const rng = { lake: ctx.rng.fork('lake'), garden: ctx.rng.fork('garden'), sea: ctx.rng.fork('sea'), stars: ctx.rng.fork('stars'), ice: ctx.rng.fork('pack ice'), town: ctx.rng.fork('town') };
    await ctx.yield();
    const named = (name) => makeRng(hashSeed(name + ':' + ctx.seed));
    const E = { ctx, kit, G, water, wake, rng, named, detail, rare, tick: [], seedK: 0, stamp: shadeField(), cherries: [] };
    await ctx.yield();

    // the line, and the pace by place: the metres at which it passes the three planes are found on the line itself
    const linePts0 = layLine(), path = makePath(linePts0, { samples: 720 });
    const L = path.length, at = [0, 0, 0, 0], _p = new THREE.Vector3();
    await ctx.yield();
    for (let d = 0, k = 0; d <= L && k < 3; d += 0.1) { path.posAtDist(d, _p); if (eyePlace(_p.x, _p.y, _p.z) > k) { k++; at[k] = d; } }
    await ctx.yield();
    // CLEAR AIR IS TESTED IN THE BUILD ON THE LINE ITSELF: the line's points by place (every half metre), the least
    // distance from a point to them, and whether a whole course (every phase) keeps a distance from them
    const linePts = [[], [], [], []];
    for (let d = 0; d <= L; d += 0.5) { path.posAtDist(d, _p); linePts[eyePlace(_p.x, _p.y, _p.z)].push(_p.x, _p.y, _p.z); }
    E.linePts = linePts;
    E.lineNear = (k, x, y, z) => { const a = linePts[k]; let m = 1e9; for (let i = 0; i < a.length; i += 3) { const dx = a[i] - x, dy = a[i + 1] - y, dz = a[i + 2] - z, q = dx * dx + dy * dy + dz * dz; if (q < m) m = q; } return Math.sqrt(m); };
    // (the course is read at 400 phases over ten turns; half the step between two readings is added to the distance
    // asked, so that no stretch between two readings can come nearer than asked)
    E.courseClear = (k, c, need) => {
      let px = 0, py = 0, pz = 0;
      for (let i = 0; i <= 400; i++) {
        coursePos(c, (i / 400) * 20 * Math.PI / Math.abs(c.w), _p);
        const step = i ? Math.hypot(_p.x - px, _p.y - py, _p.z - pz) : 0;
        if (E.lineNear(k, _p.x, _p.y, _p.z) < need + 0.5 * step) return false;
        px = _p.x; py = _p.y; pz = _p.z;
      }
      return true;
    };
    const speedAt = (d) => { let v = SPEED[0]; for (let i = 1; i <= 3; i++) v += (SPEED[i] - SPEED[i - 1]) * smoothstep(at[i] - 20, at[i] + 20, d); return v; };
    let duration = 0;
    for (let d = 0; d < L; d += 0.5) duration += 0.5 / speedAt(d + 0.25);
    const mean = L / duration;
    // THE LOOKS, BY THEIR SUBJECTS' PLACES (round three, the lead's law of place). A look's window is metres of the line
    // between two places that the line itself gives (a plane passed, a bend or a knot of the line's own plan, the metre
    // from which the line's own heading holds the subject within 6 degrees, so that the route itself looks at it); it
    // rises and falls over one and a half seconds of its place's own pace; only at the end are its metres turned into
    // the engine's u (metres over the length). The line's places alone set it, never the clock.
    const _t = new THREE.Vector3();
    const offDeg = (d, P) => { path.posAtDist(d, _p); path.tangentAtDist(d, _t); if (Math.hypot(P[0] - _p.x, P[2] - _p.z) < 10) return 0; const a = Math.atan2(P[0] - _p.x, _p.z - P[2]) - Math.atan2(_t.x, -_t.z); return Math.abs(Math.atan2(Math.sin(a), Math.cos(a))) / RAD; };
    // (the first metre after which the subject stays within deg of the heading up to d1; within 10 m of it the line is
    // at the subject itself)
    const aheadFrom = (P, d0, d1, deg) => { let k = d1; for (let d = d1; d >= d0; d -= 0.5) { if (offDeg(d, P) > deg) break; k = d; } return k; };
    const look = (at, a, b, k, weight) => ({ at, from: a / L, to: b / L, fade: Math.min(0.5, 1.5 * SPEED[k] / Math.max(1, b - a)), weight, arc: true });
    const firstWhere = (d0, d1, test) => { for (let d = d0; d <= d1; d += 0.5) if (test(d)) return d; return d1; };
    // (the garden: the first metre of the line from which the eye sees over the tall hedge's top to the round pool)
    const COURT = firstWhere(at[1], at[2], (d) => { path.posAtDist(d, _p); return courtSeen(_p.x, _p.y, _p.z); });
    // THE HUT COMES INTO VIEW where the line's sights to its door, once the massif has hidden it, first pass the
    // massif again round its east end: the massif's heights and that stretch, by its own shards (massifHeights, whose
    // stops its comment names); and the build stops unless the run of the line from which the door is hidden (HIDDEN
    // to REVEAL) is at least two seconds long at the end's pace (HIDE_LEAST, 24 m). Round three e (the lead's R5): it
    // stops too unless the door is in sight again by REVEAL_BY, the line's point abreast of the massif's east berg (its
    // nearest in plan to that berg's middle, in the right curve round the massif's east end). There the line has come
    // round the massif, which it faced and which hid the door; a door still hidden there is hidden by the massif for
    // the rest of the way in, and the hut would not be found again before the way out.
    const HUT3 = hutPoint(3, [0, HUT.mid, 0]), MH = await massifHeights(path, at[3], L, ctx), HIDDEN = MH.HIDDEN, REVEAL = MH.REVEAL, HIDE_LEAST = 2 * SPEED[3];
    if (!(REVEAL - HIDDEN >= HIDE_LEAST)) throw new Error('boathouse-full-of-morning: the berg massif hides the last hut\'s door for less than ' + HIDE_LEAST + ' m of the line');
    if (!(REVEAL <= MH.REVEAL_BY)) throw new Error('boathouse-full-of-morning: the last hut\'s door is not in sight again by the line\'s point abreast of the massif\'s east berg');
    E.massifH = MH.H; E.hutHidden = [HIDDEN - at[3], REVEAL - at[3]]; E.revealBy = MH.REVEAL_BY - at[3]; E.massifStretch = MH.stretch.map((d) => d - at[3]);
    E.path = path; E.at3 = at[3]; E.seedK = rng.lake() * 50;
    await ctx.yield();

    await buildLake(E);
    await buildLakeTrees(E);
    await buildLakeReeds(E);
    await buildLakeThings(E);
    await buildLakeLife(E);
    await buildGardenGround(E);
    await buildGardenWalls(E);
    await buildGardenCourt(E);
    await buildGardenHut(E);
    await buildJets(E);
    await buildBorders(E);
    await buildQuarters(E);
    await buildCourtDress(E);
    await buildGardenLife(E);
    await buildCanalDress(E);
    await buildCourtLife(E);
    await bakeShade(E);
    await buildSea(E);
    await buildStars(E);
    kit.check(scene);

    return {
      scene, path, duration,
      pace: (u) => speedAt(u * L) / mean,
      // (bank 0.22: the horizon never tilts more than 3.7 degrees, the lead's C1)
      camera: { fov: 52, near: 0.3, far: 9000, sway: 0.35, bank: 0.22 },
      // THE LOOKS (each eased in and out; none looks back; see 'THE LOOKS, BY THEIR SUBJECTS' PLACES' above)
      pois: [
        // THE GREAT JET on the garden's climb: from the canal's first bend (where the line leaves the canal's axis and
        // the climb begins) to COURT, the first metre from which the eye sees over the tall hedge to the second court's
        // round pool; it holds the gaze down on the great jet and the canal's jets while the line climbs
        look([0, 4.5, -108], at[1] + linePts0.climb.foot, COURT, 1, 0.6),
        // THE GARDEN'S HUT IN ITS LONG BASIN, seen from on high: from COURT (the second court lies open below, over the
        // hedge) to the metre from which the line's own heading holds the hut ahead, down the cherry avenue
        look([-22, 2, -207], COURT, aheadFrom([-22, 2, -207], COURT, at[2], 6), 1, 0.7),
        // THE ISLET'S HUT, to the right: from the harbour's mouth (the pierheads, where the open sea begins) to the metre
        // from which the line's own hook holds the hut ahead
        look([98, 1.5, -304.7], at[2] + MOUTH, aheadFrom([98, 1.5, -304.7], at[2] + MOUTH, at[3], 6), 2, 0.4),
        // (No look at the planet: it stands low on bearing 178, and on the last straight the line's own heading, 175,
        // holds it ahead with the hut.)
        // THE LAST HUT, from where it comes into view round the massif's east end (REVEAL) to the metre from which the
        // line's own heading holds it ahead, on the last straight
        look(HUT3, REVEAL, aheadFrom(HUT3, REVEAL, L, 6), 3, 0.6),
      ],
      portal: { shape: 'rect', width: WAYOUT.width, height: WAYOUT.height, color: '#ffe8b0' },
      post: { exposure: 1, bloom: { strength: 0.22, radius: 0.55, threshold: 1.9 }, grade: { saturation: 1.04, contrast: 1.0, vignette: 0.2, grain: 0.0, aberration: 0 } },
      style: 'none', ride: 'none', companion: 'none',
      planesAt: at,
      // (the build's own figures, for the audit: the places of the bergs beside the ways, the garden's climb (metres of
      // its plan) and COURT (metres of the line), the metres of the stars' line over which the massif hides the last
      // hut, the great bergs' least clear air, the near stack's clear air, the floes' count)
      audit: { beside: E.beside, climb: linePts0.climb, court: COURT, hutHidden: E.hutHidden, hidden: [HIDDEN, REVEAL], clouds: CL, bergAir: E.bergAir, nearStackAir: E.nearStackAir, floes: E.nFloes, massif: E.massif, massifStretch: E.massifStretch, lastFloe: E.lastFloeAudit, bergFloeLead: E.bergFloeLead, besideFloeLead: E.besideFloeLead, besideLead: E.besideLead, besideThrows: E.besideThrows, bergsAlong: E.bergsAlong, floeBoundSites: E.floeBoundSites, revealBy: E.revealBy, pack: E.packAudit, bergTops: E.bergTops, fleet: E.fleetN, fleetDeal: E.fleetDeal },
      update(dt, time, camera, u) {
        kit.U.uTime.value = time;
        // WHICH PLACES ARE HANDED TO THE RENDERER: the eye's place by its side of the planes, and each neighbour unless
        // its one opening lies wholly beyond one of the four side planes of the eye's view
        const e = camera.matrixWorld.elements, k = eyePlace(e[12], e[13], e[14]);
        _fr.setFromProjectionMatrix(_pv.multiplyMatrices(camera.projectionMatrix, _inv.copy(camera.matrixWorld).invert()));
        for (let i = 0; i < 4; i++) G[i].visible = i === k || (i === k + 1 && openingSeen(i)) || (i === k - 1 && openingSeen(k));
        for (const f of E.tick) f(dt, time);
      },
      dispose() { for (const s of kit.shade) if (s.tShade.value && s.tShade.value.dispose) s.tShade.value.dispose(); },
    };
  },
};
