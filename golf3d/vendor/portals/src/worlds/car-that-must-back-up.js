// The Car That Must Back Up: the world. CUT PAPER ON A LIGHT TABLE AT THE BLUE HOUR.
// The law of this world is design/sb/newworld5/cbu-law.md; its numbers are design/sb/newworld5/cbu-plan.json.
//
// WHERE THE PLAN'S NUMBERS ARE TYPED. The curve, the run's table, T, P, the sheets' spacing and count, the car's
// box, the far hall, the rows of the cars at rest, the route's 54 control points and the way out stand ONCE, at
// the head of src/parts/car-that-must-back-up.js, and are imported from there. The world file's own numbers stand
// in the block below: the pace's knots, the three looks, the duration, the camera's bank and far plane, the portal.
//
// THE RUN IS ON THE CLOCK ALONE. update(dt, time) hands `time` to the part's pose(): car k stands at the
// table's place at (time - k P) mod T, the table being the true motion integrated once at build. update()
// takes no route progress and no camera; birds, pennants, steam, lamp patches and beacons run on the same clock,
// each by its place. Nothing in the world reads the lens, nothing is carried with it, and there is no fog.
//
// THE LIGHT BELONGS TO THE PAPER BY PLACE. One unlit material family whose colour is the vertex's ink: a
// sheet's face gets its ink by the sheet's number and by which way it looks; the foot of every face is two
// warmer bands built as strips; the light table is one level warm sheet at y -24 under everything; the sky is
// BUILT (flat bands, pin holes, clouds, three far ranges) about the constant centre SKY_CENTER and never moves.
//
// THE WAY OUT is the engine's own portal, radius 9 m, at the route's last point, 17 m over the plain among the
// cars at rest, with the engine's own look: its 'ring' with rim and halo, its own moving veil (no flat veil is
// asked for), glow 0.8, in the afterglow's rose #E08A8C, so that the opening is a ring of light with a turning
// inside wherever no next world shows in it yet. portal.drawWithin, drawIn and revealDistance are NOT set: the far ridge itself hides the way out
// from every place of the flight until the lens is over the crest's height (the plan's reason, route.portal), so
// it needs no rule of its own. The world has no light of any kind and builds no ring or double of the portal.
//
// LOOKS BY PLACE. The three looks are the plan's (LOOKS, lookOffset): each holds over a stretch of route whose
// ends are computed in the plan from the route metres of what is looked at (the far ridge during the opening;
// the valley from the rim, from the end of the climb to the dive; the far flank from before the crest to the
// foot of the descent). The first and the third are one fixed direction each. THE SECOND TRAVELS BY PLACE AND
// GIVES THREE PICTURES IN ONE SLOW TURN: its direction is typed at four places of the route (where the look is
// first full, the rim leg's beginning, the rim leg's middle, where the look is last full) and goes from one to
// the next by the smooth step of u: ALONG THE VALLEY where the climb ends and until the rim leg begins (15
// degrees from down-valley toward the far ridge, 17 down: the trough's roofs to a vanishing point, the rim's
// end with its buffer lamps a diagonal, the upland behind the rim at the right); ACROSS THE TROUGH by the rim
// leg's middle (42 degrees, 11 down); SQUARE TO THE FAR FLANK at the rim leg's end (70 degrees, 3 down). It
// reads u alone. The world has no other look and no weight or timing of its own.
// THE OWNER'S TERM UNDER THIS LOOK, AS THE PLAN COUNTS IT (cbu-plan.json, counts.THE_TERM and theSecondLook;
// typed below as PLAN_COUNTS and returned in info.secondLook; the world counts nothing itself): at 16:9, cars
// seen whole through their last swing in one flight, least / mean / margin in s: the usual camera 6 / 8.4 /
// 3.575, the steady camera 9 / 11.84 / 5.15. Under the one fixed direction the plan had before, the steady
// camera's least was 15: that fall is the price of three pictures; the usual camera's least rose from 5.
// THE UPLAND'S HORIZON. Behind the near rim every sheet's edge ends in a back ridge (the part's RIDGE) so high
// that a sight line from the route over it, while the route flies over the near flank, meets the nearest far
// range and never the light table behind the sheets; build() measures it every 2 m of that part of the route on
// every whole degree of bearing and returns it in info.upland.
// WHAT THE WORLD ITSELF PLACES, each by a rule of place said beside its maker: the built sky's centre and shell,
// the far ranges, the paper clouds' four groups by bearing, the moon of the rare visit, and the night birds' two
// passages: the high one across the valley, over the far ridge and out over the far country, beside the line on
// which the route crosses the crest, and the low flocks over the rows of the cars at rest, on lanes along the valley.
//
// THE NIGHT BIRDS ARE THE WORLD'S OWN (no kit flock): eleven straight lanes laid by typed numbers alone (PASS,
// ROWS); no bird steers by the lens. THE LEAST DISTANCE OF ANY BIRD TO THE ROUTE, its half span counted (the
// farthest a wing tip stands from the bird's own place as the cut is built and beats: BIRD_HALF_SPAN, 2.04 m for a
// bird of the high passage and ROWS.size times that, 3.47 m, for a bird over the rows), lane by
// lane, as build() measures it and returns it in info.birdLanes (m, and the route metre nearest that place):
//   the high passage, the lane up-valley of the line over the crest 13.63 m at route m 953; the lane
//   down-valley of it 13.38 m at route m 826;
//   over the rows, the lanes at x 304, 322, 340 and 358: 12.16 m at route m 1167, 12.15 m at 1179, 12.14 m at
//   1217, 12.6 m at 1224; the lanes at x 376, 394, 412, 430 and 448: 23.36 m, 38.43 m, 54.36 m, 72.47 m and
//   90.45 m, each at the route's last metre (1224).
//
// THE STATION HALL, THE HEADLAMP'S PATCH AND THE STEAM (all three are the part's: STATION, LAMP, STEAM,
// where every figure stands). The shed of every line is one span of a long station hall along the valley's
// floor: warm paper panes between dark ribs on both slopes, a pale lantern strip on every ridge, a dark gutter along
// every eave, a grander bay with a transept on every ninth line; its ends toward the bottom step in and out by
// runs of lines, up to 9 m short of the plan's box and never beyond it, each a gable with an arched opening on a
// warm floor and lining, a pale apron on the cut edge before it; a car under a span shows on the lantern's strip
// as a darker piece. Every car lays a long tapered patch of its lamp's ink on the cut edge AHEAD of itself the way
// it travels (6 m at a crawl to 30 m at speed, gone at a stall), and while its engine drives it up a slope flat
// scalloped puffs of steam stream back along the line behind it (tall and close at a crawl, long and low at
// speed), every puff under the part's sweptTop. Both read the car's place and speed on the run's clock alone.
// build() returns the three rules in info.station, info.lampPatch and info.steam.
//
// CLEAR AIR BY PLACE. build() measures, every 2 m of route, the distance to everything that stands and to every
// place a car can be at any clock (the car's section and its steam's room swept along the whole line; a span of
// the station counts as the plan's whole box), and returns it as
// info.clearance { least, what, atRouteM }.

import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import {
  makeStyle, prepareRun, checkRun, curveY, curveDy, sweptTop, lineZ,
  N, D, T, CAR, HALL, SHED, STATION, STEAM, LAMP, steamWidest, CREST_BOX, RIM_PLATEAU_H, TABLE_Y, REST, ROOM, RIDGE,
  X_RIM, X_BOTTOM, X_CREST, X_FAR_FOOT, X_STEPS, X_END, ROUTE_POINTS, WAY_OUT,
} from '../parts/car-that-must-back-up.js';

// ---------------------------------------------------------------------------------------------------------
// THE WORLD FILE'S OWN NUMBERS (cbu-plan.json, route).
const DURATION = 93.1;                       // s, route.duration
const CAMERA = { bank: 0.35, far: 9000 };    // route.camera (bank, a share of the engine's); far in m (brief)
const PORTAL = { radius: WAY_OUT.radius };    // m, route.portal: the radius and nothing else (typed in the part's head)
// THE WAY OUT'S LOOK: the engine's 'ring' (a bright rim, a halo about it, a turning veil inside until the next
// world shows there), in the rose of the afterglow's third band; glow 0.8 of the engine's own, which the flat
// inks about it bear with the post's bloom at 0. Of the engine's six looks this one stands plainest among cut
// paper.
const PORTAL_LOOK = { style: 'ring', color: '#E08A8C', glow: 0.8 };
const ROUTE_M = 1224.58;                     // m, route.lengthM (the built path must agree to 0.05 m)
// counts.THE_TERM and theSecondLook.THE_TERM of the plan, quoted (the world counts nothing): cars seen whole
// through their last swing in one flight at 16:9, [least, mean, margin s]; before: the least under the plan's
// earlier single direction
const PLAN_COUNTS = { usual: [6, 8.4, 3.575], steady: [9, 11.84, 5.15], before: { usual: 5, steady: 15 } };
// route.pace.knots: [u, speed over the mean speed]; pace(u) is a smooth step between neighbours (route.pace.code)
const KNOTS = [[0, 0.426], [0.02286, 0.426], [0.04573, 0.426], [0.0688, 0.426], [0.09187, 0.426], [0.11514, 0.426],
  [0.13862, 1.824], [0.16802, 1.824], [0.20558, 1.824], [0.24294, 1.824], [0.27193, 1.824], [0.29541, 0.494],
  [0.32725, 0.494], [0.3591, 0.494], [0.39095, 0.494], [0.4228, 0.494], [0.43688, 0.5], [0.45179, 0.587],
  [0.46894, 0.9], [0.48711, 1.508], [0.50527, 2.208], [0.52222, 2.432], [0.53712, 2.432], [0.551, 2.432],
  [0.56509, 2.43], [0.57938, 2.412], [0.5949, 2.378], [0.61266, 2.327], [0.63205, 2.26], [0.65186, 2.175],
  [0.67105, 2.075], [0.6886, 1.957], [0.70412, 1.823], [0.7182, 1.672], [0.72841, 1.763], [0.73862, 1.853],
  [0.75046, 1.91], [0.76271, 2.019], [0.77639, 2.089], [0.79088, 2.09], [0.80517, 2.09], [0.81946, 2.09],
  [0.83375, 2.09], [0.84804, 2.09], [0.86234, 2.09], [0.87663, 2.088], [0.89071, 2.027], [0.90357, 1.92],
  [0.91541, 1.818], [0.92705, 1.773], [0.93685, 1.772491], [0.95788, 1.773], [0.97891, 1.773], [1, 1.773]];
// route.looks: from, to in u (the plan's route metres -200 to 161, 231.8 to 597.8 and 819.5 to 1119.5 over the
// route's length). The first and the third: offsetM in m, a place 300 m off the route's own point in a fixed
// direction. THE SECOND TRAVELS BY PLACE: distM in m and keys [u, degrees from down-valley toward the far ridge,
// degrees up], standing where the look is first full (route m 312.3), at the rim leg's beginning (361.8), at
// its middle (439.7) and where the look is last full (517.2); lookOffset below turns them into an offset
const LOOKS = [
  { from: -0.16332, to: 0.13147, fade: 0.15, weight: 0.5, steady: false, arc: false, offsetM: [177.54, 82.69, 227.25] },   // up the far ridge
  { from: 0.18925, to: 0.48813, fade: 0.22, weight: 0.9, steady: true, arc: true, distM: 300,                                // from the rim: three pictures
    keys: [[0.255, 15, -17], [0.29541, 15, -17], [0.3591, 42, -11], [0.42238, 70, -3]] },
  { from: 0.66921, to: 0.91419, fade: 0.3, weight: 0.8, steady: true, arc: true, offsetM: [157.2, -122.02, 224.5] },       // down the far flank
];
// THE BUILT SKY (the brief's sky and space, where it gives a figure): its constant centre and its shell; the far
// ranges and the clouds; where the world stands the moon of the rare visit
const SKY_CENTER = [0, 0, 760];              // m: the valley's middle
const SKY_R = 8000;                          // m: the shell of bands and pin holes
const RANGE_R = [3000, 4500, 6000];          // m out: the three far ranges
const RANGE_H = [[120, 190], [170, 290], [250, 380]];   // m: each range's lowest and highest tops
const CLOUD_OUT = [3000, 7000], CLOUD_UP = [500, 1400]; // m out, m up
const MOON_BEARING = 105, MOON_UP = 14;      // degrees from +x toward +z, degrees up: over the near rim's down-valley end
const BIRD_KEEP = 12;                        // m: the least a bird keeps off the route
const SHEETS_PER_MESH = 10;                  // sheets merged into one mesh

const sm = (t) => { t = Math.min(1, Math.max(0, t)); return t * t * (3 - 2 * t); };
const pace = (u) => { let i = 0; while (i < KNOTS.length - 2 && KNOTS[i + 1][0] <= u) i++; const a = KNOTS[i], b = KNOTS[i + 1];
  return a[1] + (b[1] - a[1]) * sm((u - a[0]) / Math.max(1e-9, b[0] - a[0])); };
// route.looksCode: a look's offset from the route's own point at u. A look with keys: between two neighbouring
// keys both angles go by the smooth step of u; before the first key and beyond the last the direction is the
// key's own; the offset is distM m in that direction, written into o. A function of u alone.
const lookOffset = (k, u, o) => { if (!k.keys) return k.offsetM; const K = k.keys; let i = 0; while (i < K.length - 2 && K[i + 1][0] <= u) i++;
  const a = K[i], b = K[i + 1], t = sm((u - a[0]) / (b[0] - a[0])), yaw = (a[1] + (b[1] - a[1]) * t) * (Math.PI / 180), pit = (a[2] + (b[2] - a[2]) * t) * (Math.PI / 180);
  o[0] = Math.sin(yaw) * Math.cos(pit) * k.distM; o[1] = Math.sin(pit) * k.distM; o[2] = Math.cos(yaw) * Math.cos(pit) * k.distM; return o; };

// ---------------------------------------------------------------------------------------------------------
// THE FAR RANGES: three flat cut paper ranges standing on the light table all round the constant centre, each
// one flat ink, each paler than the one before; a skyline of straight cuts (no curve, no gradient).
function addRanges(b, pal, noise) {
  const rad = Math.PI / 180, c = SKY_CENTER;
  for (let i = 2; i >= 0; i--) {
    const R = RANGE_R[i], [lo, hi] = RANGE_H[i], SEG = 150 + i * 30, tops = [];
    for (let s = 0; s < SEG; s++) {
      const a = s / SEG * Math.PI * 2, cx = Math.cos(a), sz = Math.sin(a);
      const big = 0.5 + 0.5 * noise.n2(cx * 1.9 + i * 7.3, sz * 1.9 - i * 3.1), small = 0.5 + 0.5 * noise.n2(cx * 9 + i * 11, sz * 9 + 5);
      const peak = (s % 2 ? 0.16 : 0) + 0.84 * Math.min(1, Math.max(0, 0.72 * big + 0.42 * small - 0.07));
      tops.push(lo + (hi - lo) * peak);
    }
    for (let s = 0; s < SEG; s++) {
      const a0 = s * 360 / SEG * rad, a1 = (s + 1) * 360 / SEG * rad, t0 = tops[s], t1 = tops[(s + 1) % SEG];
      const p0 = [c[0] + R * Math.cos(a0), TABLE_Y, c[2] + R * Math.sin(a0)], p1 = [c[0] + R * Math.cos(a1), TABLE_Y, c[2] + R * Math.sin(a1)];
      b.quad(p0, p1, [p1[0], t1, p1[2]], [p0[0], t0, p0[2]], pal.ranges[i]);
    }
  }
}

// THE PAPER CLOUDS: long flat cut shapes fixed in the world, each standing upright across the line from the
// constant centre, of two flat inks: the body, and a strip of the afterglow's ink along its scalloped underside.
// They stand in four groups by bearing (degrees from +x toward +z, as seen from the centre):
//   IN THE GAP OF THE VALLEY (about two fifths of them): the first three stacked one over another within 12
//   degrees of the valley's own line (bearing 90), 7, 12.5 and 18.5 degrees up, the lowest the longest (CLOUD_GAP:
//   bearing off the valley's line, degrees up, length as a share of the distance); further ones to either side;
//   TOWARD THE AFTERGLOW (a quarter, bearings -35 to 35): long thick ones 21.5 to 23.5 degrees up, each a STACK;
//   where there are more than two, the second is a short thin one 9.5 to 17 degrees up instead;
//   DOWN-VALLEY OF THE AFTERGLOW (one more on every edition, beside the count): a STACK whose middle stands at a
//   bearing of 47 to 57 degrees, its foot 20 to 21.5 degrees up (CLOUD_BESIDE), cut like those toward the afterglow;
//   OVER THE NEAR RIM (the rest): a bank about bearing 150, 15 to 25 degrees up (CLOUD_RIM), the longest and the
//   thickest (a tenth of their length and more); its first three are STACKS.
// A STACK is a cloud of several leaves cut one over another, as layered paper: every leaf is a whole cloud of the
// two inks with its own scalloped underside, its body heaped about STACK.heap times higher than a plain cloud's;
// each further leaf is STACK.len times as long as the lowest (the highest STACK.last of that again) and
// STACK.thick times as thick as the one under it, begins STACK.rise thicknesses of that one above its foot,
// stands to one side of the stack's middle and then to the other by turns (STACK.aside, a share of the lowest
// leaf's length) and STACK.step m nearer the centre (so that no two leaves lie in one plane). A stack toward the afterglow has STACK.glow leaves, one over the rim
// STACK.rim.
// A cloud within 75 degrees of +x never stands lower than 9.5 degrees, so the far ridge's skyline stays clean.
// A cloud's lowest point stands between CLOUD_UP[0] and CLOUD_UP[1] over the level; a plain cloud's scallops,
// strip and body rise above that by up to 2.75 times its thickness.
const STACK = { heap: 2.6, len: [0.5, 1.0], last: 0.6, thick: 0.94, rise: 3.1, aside: [0.1, 0.3], step: 70, glow: 8, rim: 5 };
const CLOUD_GAP = [[-8, 7, 0.5], [9, 12.5, 0.36], [-2, 18.5, 0.42], [31, 9.5, 0.3], [-33, 14, 0.34], [45, 10.5, 0.28]];
const CLOUD_BESIDE = { bear: [47, 57], up: [20, 21.5], len: [0.42, 0.52], thick: [0.11, 0.13] };   // degrees, degrees, shares
const CLOUD_RIM = [[150, 23, 0.6], [122, 17.5, 0.46], [179, 22, 0.5], [216, 23, 0.36], [262, 16, 0.4], [305, 20, 0.34]];
// One leaf: its middle stands at the bearing `bear`, `dist` m out, its foot y0 m up; `shift` m to one side.
function cutCloud(b, r, bear, dist, y0, len, thick, heap, shift, body, ink2) {
  const rad = Math.PI / 180, c = SKY_CENTER, scal = Math.max(5, Math.round(len / (thick * 1.5)));
  const ca = Math.cos(bear * rad), sa = Math.sin(bear * rad), ox = c[0] + dist * ca - sa * shift, oz = c[2] + dist * sa + ca * shift;
  const P = (a, y) => [ox - sa * a, y, oz + ca * a];
  const w = len / scal, drop = thick * 0.55, hump = [], ym = y0 + drop;
  for (let j = 0; j <= scal; j++) { const f = j / scal, bell = Math.sin(Math.PI * f); const cut = r.range(0.75, 1.2);
    hump.push(thick * 0.5 + thick * (0.25 + 0.75 * bell) * (heap > 1 ? heap * (0.8 + 0.2 * cut) : cut)); }
  hump[0] = thick * 0.5; hump[scal] = thick * 0.5;
  for (let j = 0; j < scal; j++) {
    const a0 = -len / 2 + j * w, a1 = a0 + w;
    // the body over this scallop, cut straight from top to top; its lower edge is the warm strip's upper edge
    b.quad(P(a0, ym + thick * 0.5), P(a1, ym + thick * 0.5), P(a1, ym + hump[j + 1] + thick * 0.5), P(a0, ym + hump[j] + thick * 0.5), body);
    b.quad(P(a0, ym), P(a1, ym), P(a1, ym + thick * 0.5), P(a0, ym + thick * 0.5), ink2);
    const fan = [P(a0, ym)];
    for (let q = 1; q < 6; q++) { const t = q / 6 * Math.PI; fan.push(P(a0 + w * (0.5 - 0.5 * Math.cos(t)), ym - drop * Math.sin(t))); }
    fan.push(P(a1, ym));
    b.fan(fan, ink2);
  }
  // the two cut ends: a point of the body and of the strip to either side
  for (const e of [-1, 1]) {
    const a = e * len / 2;
    b.tri(P(a, ym + thick * 0.5), P(a, ym + thick), P(a + e * thick * 1.6, ym + thick * 0.5), body);
    b.tri(P(a, ym), P(a, ym + thick * 0.5), P(a + e * thick * 1.6, ym + thick * 0.5), ink2);
  }
}
function addClouds(b, pal, r, count, moon) {
  const rad = Math.PI / 180, body = pal.sky[4][1], under = [pal.sky[2][1], pal.sky[1][1]];
  const nDown = Math.round(count * 0.4), nGlow = Math.round(count * 0.25);
  // one cloud of `leaves` leaves: its middle at the bearing `bear`, its foot `el` degrees up; its length and its
  // thickness as shares of its distance
  const cut = (bear, el, lenK, thickK, leaves) => {
    const off = Math.abs(((bear + 540) % 360) - 180);
    if (off < 75) el = Math.max(el, 9.5);
    // on the visit with the moon no cloud stands before it: a cloud that would is cut higher in the sky
    if (moon && Math.abs(bear - MOON_BEARING) < lenK * 28.7 + 5 && el < MOON_UP + 4 && el + thickK * 130 > MOON_UP - 4) el = MOON_UP + 6.5;
    const tn = Math.tan(el * rad), dist = r.range(Math.max(CLOUD_OUT[0], CLOUD_UP[0] / tn), Math.min(CLOUD_OUT[1], CLOUD_UP[1] / tn));
    const len0 = dist * lenK; let len = len0, thick = dist * thickK, y0 = dist * tn, shift = 0, turn = r.chance(0.5) ? 1 : -1;
    for (let q = 0; q < leaves; q++) {
      const ink2 = under[r.chance(0.5) ? 0 : 1];
      cutCloud(b, r, bear, dist - q * STACK.step, y0, len, thick, leaves > 1 ? STACK.heap * r.range(0.8, 1.15) : 1, shift, body, ink2);
      y0 += thick * STACK.rise; turn = -turn; shift = turn * len0 * r.range(STACK.aside[0], STACK.aside[1]);
      len = len0 * r.range(STACK.len[0], STACK.len[1]) * (q === leaves - 2 ? STACK.last : 1); thick *= STACK.thick;
    }
  };
  for (let i = 0; i < count; i++) {
    let bear, el, lenK, thickK, leaves = 1;
    if (i < nDown) { const g = CLOUD_GAP[i % CLOUD_GAP.length]; bear = 90 + g[0] + r.range(-3, 3); el = g[1] + r.range(-0.8, 0.8); lenK = g[2] * r.range(0.92, 1.12); thickK = lenK * r.range(0.06, 0.075); }
    else if (i < nDown + nGlow) { bear = (-35 + (i - nDown + r.range(0.1, 0.9)) / nGlow * 70 + 360) % 360; const high = nGlow < 3 || i - nDown !== 1; leaves = high ? STACK.glow : 1; el = high ? r.range(21.5, 23.5) : r.range(9.5, 17); lenK = high ? r.range(0.4, 0.55) : r.range(0.15, 0.3); thickK = high ? lenK * r.range(0.11, 0.13) : r.range(0.015, 0.026); }
    else { const j = i - nDown - nGlow, g = CLOUD_RIM[j % CLOUD_RIM.length]; leaves = j < 3 ? STACK.rim : 1; bear = g[0] + r.range(-4, 4); el = g[1] + r.range(-1, 1); lenK = g[2] * r.range(0.92, 1.12); thickK = lenK * r.range(0.1, 0.115); }
    cut(bear, el, lenK, thickK, leaves);
  }
  // and one more on every edition, beside the count: the stack down-valley of the afterglow (CLOUD_BESIDE)
  const g = CLOUD_BESIDE, lenK = r.range(g.len[0], g.len[1]);
  cut(r.range(g.bear[0], g.bear[1]), r.range(g.up[0], g.up[1]), lenK, lenK * r.range(g.thick[0], g.thick[1]), STACK.glow);
}

// THE NIGHT BIRDS: THE HIGH PASSAGE. Loose flocks of five to nine flat paper birds, cut level, cross the valley
// from over the near rim, over the far ridge and out over the far country toward the afterglow, flock after
// flock, on two straight lanes, one to either side of the line on which the route runs through the bottom and
// over the crest. Each lane is laid by place from that line (the place where the route crosses the crest, and
// its level heading there):
//   in plan it runs parallel to the line, PASS.side m to the side of it, from PASS.reach[0] m before the place
//   where the line passes over the valley's bottom to PASS.reach[1] m beyond the crest; a flock that comes to the
//   lane's end begins again at its beginning. Every flock keeps its own place outward of its lane (PASS.flockOut).
// HEIGHT, by place alone: a lane flies level at PASS.level, over the rim plateau and over the valley (a little
// over the height of the route's rim leg), until the route's own height at that x (its height on its run through
// the bottom, up the far ridge and out over the far country) with PASS.over m added is the higher of the two;
// from there it keeps that (the change is rounded over about PASS.round m). So the birds cross the valley level,
// climb over the far ridge and fly out level, over the route's height wherever the two are near each other, and
// are seen from under.
// SPEED, by place alone, over the ground: PASS.speed[0] m/s on the level, less PASS.speed[1] m/s for every metre
// climbed in a metre of ground and as much more where a lane falls, never under PASS.speed[2] nor over
// PASS.speed[3]: the flocks close up where they climb the ridge.
// Where a flock is, is a closed form of the clock: the clock, plus the flock's own start, taken within the time
// a lane takes from end to end, read in the lane's table of time against place; a bird keeps its own place in
// its flock (behind the flock's head, to the lane's outer side, up or down). The wing beat is the bird
// material's. A lane whose birds could come within BIRD_KEEP of the route (the bird's half span counted) is not
// placed.
const PASS = { reach: [900, 1200], side: 14.5, level: 94, over: 13, round: 6,                                        // m
  speed: [11, 22, 6.5, 20],                                                                                // m/s
  every: [8, 9.5],                         // s: the mean time between two flocks of one lane (an edition's)
  jitter: 0.3,                             // a flock's start is off its even place by up to this share of that time
  flockOut: [0, 14], flockUp: 1.5,         // m: a flock's own place to the lane's outer side, and up or down
  along: [2.2, 4.4], sideways: 4.5, up: 1.5, bob: 0.4 };   // m: a bird's place in its flock
const BIRD_HALF_SPAN = 2.04;                 // m: the farthest a wing tip stands from the bird's own place (the part's level cut: the tip 1.6 m out and 0.4 m back, lifted up to 1.2 m by birdMat's beat)

// A LANE'S FIGURE, for info.birdLanes: the least distance to the route of any bird that can fly on the lane, its
// half span counted (`least`: the least distance of the lane's spread, taken every 4 m or closer of the lane, less
// the half span), the route metre nearest that place (looked for every metre of the route), and whether the
// lane is flown (a lane that could come within BIRD_KEEP is not placed).
function laneFigure(lane, least, at, path, flown) {
  const v = new THREE.Vector3(); let best = Infinity, atRouteM = 0;
  if (at) for (let m = 0; m <= path.length; m += 1) { path.posAtDist(m, v); const d = (v.x - at[0]) ** 2 + (v.y - at[1]) ** 2 + (v.z - at[2]) ** 2; if (d < best) { best = d; atRouteM = m; } }
  return { lane, leastM: Math.round(least * 100) / 100, atRouteM, flown };
}

// One lane's table: its line sampled every 2 m or closer as [x, y, z], and the time a flock takes from the
// lane's beginning to each sample. `line`: the place [x, z] where the route crosses the crest and its level heading [hx, hz] there.
function passLane(line, sg, routeYAt) {
  const P = PASS, [ex, ez, hx, hz] = line, a0 = -P.reach[0] - (ex - X_BOTTOM) / Math.max(1e-6, hx), per = P.reach[1] - a0;
  const n = Math.ceil(per / 2), ds = per / n, tab = new Float32Array((n + 1) * 3), time = new Float32Array(n + 1);
  for (let i = 0; i <= n; i++) {
    const a = a0 + i * ds, x = ex + hx * a - hz * sg * P.side, z = ez + hz * a + hx * sg * P.side, d = routeYAt(x) + P.over - P.level;
    tab.set([x, P.level + 0.5 * (d + Math.sqrt(d * d + P.round * P.round)), z], i * 3);
  }
  for (let i = 0; i < n; i++) {
    const rise = (tab[(i + 1) * 3 + 1] - tab[i * 3 + 1]) / ds;
    time[i + 1] = time[i] + ds / Math.min(P.speed[3], Math.max(P.speed[2], P.speed[0] - P.speed[1] * rise));
  }
  return { tab, time, n, per, round: time[n], ox: -hz * sg, oz: hx * sg, hx, hz };
}
async function makeBirds(style, r, path, every, yieldFn) {
  const P = PASS, v = new THREE.Vector3(), t = new THREE.Vector3();
  // the route's height by x from where its x last begins to grow (the run down, through and over) to its end
  let mDive = 0, last = Infinity;
  for (let m = Math.floor(path.length); m >= 0; m -= 2) { const x = path.posAtDist(m, v).x; if (x > last - 0.05) { mDive = m + 2; break; } last = x; }
  if (yieldFn) await yieldFn();
  const rx = [], ry = [];
  for (let m = mDive; m <= path.length; m += 2) { path.posAtDist(m, v); rx.push(v.x); ry.push(v.y); }
  path.posAtDist(path.length, v); rx.push(v.x + 1e-3); ry.push(v.y);
  const routeYAt = (x) => { if (x <= rx[0]) return ry[0]; const e = rx.length - 1; if (x >= rx[e]) return ry[e];
    let lo = 0, hi = e; while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (rx[mid] <= x) lo = mid; else hi = mid; }
    return ry[lo] + (ry[hi] - ry[lo]) * (x - rx[lo]) / Math.max(1e-6, rx[hi] - rx[lo]); };
  // the line of the route's run over the crest: the place where it crosses the crest and its level heading there
  let mCrest = mDive; for (let i = 0; i < rx.length && rx[i] < X_CREST; i++) mCrest = mDive + 2 * i;
  path.posAtDist(mCrest, v); path.tangentAtDist(mCrest, t); const hl = Math.max(1e-6, Math.hypot(t.x, t.z)), line = [v.x, v.z, t.x / hl, t.z / hl];
  if (yieldFn) await yieldFn();
  const lanes = [], figures = [], reach = P.flockOut[1] + P.sideways, lift = P.flockUp + P.up + P.bob; let least = Infinity, leastAt = null;
  for (const sg of [-1, 1]) {
    if (yieldFn) await yieldFn();
    const ln = passLane(line, sg, routeYAt), tab = ln.tab; let near = Infinity, nearAt = null;
    if (yieldFn) await yieldFn();
    // the lane's least distance to the route, for a bird anywhere in its flock's spread (outward, up and down),
    // looked for along the stretch of the lane that lies within 150 m of the route's own span of x
    for (let i = 0, c = 0; i <= ln.n; i += 2) {
      const o = i * 3; if (tab[o] < rx[0] - 150 || tab[o] > rx[rx.length - 1] + 150) continue;
      for (const a of [0, reach]) for (const b of [-lift, lift]) { const q = [tab[o] + ln.ox * a, tab[o + 1] + b, tab[o + 2] + ln.oz * a], d = path.distanceTo(q[0], q[1], q[2]); if (d < near) { near = d; nearAt = q; if (d < least) leastAt = [Math.round(tab[o]), Math.round(tab[o + 1]), Math.round(tab[o + 2])]; } }
      if (++c % 20 === 0 && yieldFn) await yieldFn();
    }
    least = Math.min(least, near);
    figures.push(laneFigure('the high passage, ' + (sg < 0 ? 'up-valley' : 'down-valley') + ' of the line over the crest', near - BIRD_HALF_SPAN, nearAt, path, near >= BIRD_KEEP + BIRD_HALF_SPAN));
    if (near < BIRD_KEEP + BIRD_HALF_SPAN) continue;
    const flocks = Math.max(1, Math.round(ln.round / every)), gap = ln.round / flocks; ln.flocks = []; ln.count = 0;
    for (let f = 0; f < flocks; f++) {
      const fl = { start: (f + r.range(-P.jitter, P.jitter)) * gap, birds: [] }, count = r.int(5, 9), fout = r.range(P.flockOut[0], P.flockOut[1]), fup = r.range(-P.flockUp, P.flockUp);
      let back = 0;
      for (let j = 0; j < count; j++) { fl.birds.push({ back, side: Math.max(0, fout + r.range(-P.sideways, P.sideways)), up: fup + r.range(-P.up, P.up), wing: r.range(0, 6.283) }); back += r.range(P.along[0], P.along[1]) * (j % 2 ? 1 : 0.35); }
      ln.flocks.push(fl); ln.count += count;
    }
    lanes.push(ln);
  }
  let total = 0, flocks = 0; for (const ln of lanes) { total += ln.count; flocks += ln.flocks.length; }
  const info = { strings: flocks, birds: total, leastToRoute: Math.round(least * 100) / 100, leastAt, rounds: lanes.map((ln) => Math.round(ln.round * 10) / 10), figures };
  if (!total) return { mesh: null, pose() {}, ...info };
  const geo = style.birdGeometry(), mesh = new THREE.InstancedMesh(geo, style.birdMat, total), wing = new Float32Array(total);
  let at = 0; for (const ln of lanes) for (const fl of ln.flocks) for (const bd of fl.birds) wing[at++] = bd.wing;
  geo.setAttribute('aPhase', new THREE.InstancedBufferAttribute(wing, 1));
  mesh.frustumCulled = false; mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const arr = mesh.instanceMatrix.array;
  // every bird flies level along the lanes' one heading: the matrices' turning part is set once
  for (let i = 0; i < total; i++) { const o = i * 16; arr.fill(0, o, o + 16); arr[o] = line[2]; arr[o + 2] = line[3]; arr[o + 5] = 1; arr[o + 8] = -line[3]; arr[o + 10] = line[2]; arr[o + 15] = 1; }
  const pose = (time) => {
    let i = 0;
    for (const ln of lanes) {
      const tab = ln.tab, tm = ln.time, n = ln.n, k = n / ln.per;
      for (const fl of ln.flocks) {
        // the flock's head: the sample whose time holds the clock (taken within the lane's time from end to end)
        let tt = (time + fl.start) % ln.round; if (tt < 0) tt += ln.round;
        let lo = 0, hi = n; while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (tm[mid] <= tt) lo = mid; else hi = mid; }
        const head = lo + (tt - tm[lo]) / Math.max(1e-6, tm[lo + 1] - tm[lo]);
        for (const bd of fl.birds) {
          let q = head - bd.back * k; if (q < 0) q += n;
          const i0 = Math.min(n - 1, Math.floor(q)), f = q - i0, a = i0 * 3, b = a + 3, o = i * 16;
          arr[o + 12] = tab[a] + (tab[b] - tab[a]) * f + ln.ox * bd.side;
          arr[o + 13] = tab[a + 1] + (tab[b + 1] - tab[a + 1]) * f + bd.up + P.bob * Math.sin(time * 0.9 + bd.wing);
          arr[o + 14] = tab[a + 2] + (tab[b + 2] - tab[a + 2]) * f + ln.oz * bd.side;
          i++;
        }
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
  };
  pose(0);
  return { mesh, pose, ...info };
}

// THE NIGHT BIRDS OVER THE ROWS. Loose flocks of five to nine flat paper birds, cut level, fly low over the cars
// at rest on straight lanes along the valley (square to the lines), the first lane ROWS.first m beyond the far
// hall's far wall and one more every ROWS.apart m, flying down-valley and up-valley by turns. No lane runs to the
// way out or to any one place: they are parallel and cross the route's last stretch on a slant.
// A lane runs from ROWS.from m to ROWS.to m of z; a flock that comes to its end begins again at its beginning.
// HEIGHT, by place alone: ROWS.low m over the plain; within ROWS.keep m (seen from above) of the route beyond the
// far hall's mouth or of the way out a lane flies ROWS.high m over the plain, and it rises and falls between the
// two over the next ROWS.ramp m: the flocks lift over the route's line and come down again beyond it.
// Where a bird is, is a closed form of the clock: its flock's place along the lane is the clock times the lane's
// speed plus the flock's own start, less the bird's place in its flock. A lane whose birds could come within
// BIRD_KEEP of the route (the bird's half span, ROWS.size times BIRD_HALF_SPAN, counted) is not placed.
const ROWS = { first: 14, apart: 18, lanes: 9, from: 680, to: 1500, low: 11, high: 34.5, keep: 35, ramp: 45,        // m
  size: 1.7,                               // a bird over the rows is the bird's cut this many times as large
  speed: [10.5, 13], every: [46, 56],      // m/s; m: the mean distance between two flocks of one lane (an edition's)
  jitter: 0.3, along: [2.2, 4.4], sideways: 4.5, up: 1.5, bob: 0.4 };
async function makeRowBirds(style, r, path, every, yieldFn) {
  const P = ROWS, v = new THREE.Vector3();
  // the route beyond the far hall's mouth, seen from above, every 2 m, with the way out as its last place
  const near = []; for (let m = 0; m <= path.length; m += 2) { path.posAtDist(m, v); if (v.x >= HALL.x0) near.push(v.x, v.z); }
  path.posAtDist(path.length, v); near.push(v.x, v.z);
  if (yieldFn) await yieldFn();
  const n = Math.ceil((P.to - P.from) / 2), dz = (P.to - P.from) / n, lanes = [], figures = [], lift = P.up + P.bob; let least = Infinity;
  for (let j = 0; j < P.lanes; j++) {
    const x = HALL.x1 + P.first + j * P.apart, ys = new Float32Array(n + 1); let nearest = Infinity, nearAt = null;
    for (let i = 0; i <= n; i++) {
      const z = P.from + i * dz; let d2 = Infinity;
      for (let q = 0; q < near.length; q += 2) { const a = near[q] - x, b = near[q + 1] - z, d = a * a + b * b; if (d < d2) d2 = d; }
      const f = Math.min(1, Math.max(0, (Math.sqrt(d2) - P.keep) / P.ramp)); ys[i] = P.high + (P.low - P.high) * f * f * (3 - 2 * f);
      if (d2 < 150 * 150) for (const a of [-P.sideways, P.sideways]) for (const b of [-lift, lift]) { const d = path.distanceTo(x + a, ys[i] + b, z); if (d < nearest) { nearest = d; nearAt = [x + a, ys[i] + b, z]; } }
      if (i % 60 === 0 && yieldFn) await yieldFn();
    }
    least = Math.min(least, nearest);
    figures.push(laneFigure('over the rows, the lane at x ' + x, nearest - BIRD_HALF_SPAN * P.size, nearAt, path, nearest >= BIRD_KEEP + BIRD_HALF_SPAN * P.size));
    if (nearest < BIRD_KEEP + BIRD_HALF_SPAN * P.size) continue;
    const ln = { x, ys, dir: j % 2 ? -1 : 1, speed: r.range(P.speed[0], P.speed[1]), flocks: [] }, count = Math.max(1, Math.round((P.to - P.from) / every)), gap = (P.to - P.from) / count;
    for (let f = 0; f < count; f++) {
      const fl = { start: (f + r.range(-P.jitter, P.jitter)) * gap, birds: [] }, birds = r.int(5, 9), side = r.range(-P.sideways * 0.5, P.sideways * 0.5); let back = 0;
      for (let q = 0; q < birds; q++) { fl.birds.push({ back, side: Math.max(-P.sideways, Math.min(P.sideways, side + r.range(-P.sideways * 0.5, P.sideways * 0.5))), up: r.range(-P.up, P.up), wing: r.range(0, 6.283) }); back += r.range(P.along[0], P.along[1]) * (q % 2 ? 1 : 0.35); }
      ln.flocks.push(fl);
    }
    lanes.push(ln);
  }
  let total = 0, flocks = 0; for (const ln of lanes) for (const fl of ln.flocks) { total += fl.birds.length; flocks++; }
  const info = { strings: flocks, birds: total, leastToRoute: Math.round(least * 100) / 100, lanes: lanes.map((ln) => ln.x), figures };
  if (!total) return { mesh: null, pose() {}, ...info };
  const geo = style.birdGeometry(), mesh = new THREE.InstancedMesh(geo, style.birdMat, total), wing = new Float32Array(total);
  mesh.frustumCulled = false; mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const arr = mesh.instanceMatrix.array, per = P.to - P.from; let at = 0;
  // a bird flies level along its lane, down-valley or up-valley: the matrices' turning part is set once
  for (const ln of lanes) for (const fl of ln.flocks) for (const bd of fl.birds) { const o = at * 16; wing[at++] = bd.wing; arr.fill(0, o, o + 16); arr[o + 2] = ln.dir * P.size; arr[o + 5] = P.size; arr[o + 8] = -ln.dir * P.size; arr[o + 15] = 1; }
  geo.setAttribute('aPhase', new THREE.InstancedBufferAttribute(wing, 1));
  const pose = (time) => {
    let i = 0;
    for (const ln of lanes) for (const fl of ln.flocks) {
      const head = time * ln.speed + fl.start;
      for (const bd of fl.birds) {
        let q = (head - bd.back) % per; if (q < 0) q += per;
        const zq = (ln.dir > 0 ? q : per - q) / dz, i0 = Math.min(n - 1, Math.floor(zq)), f = zq - i0, o = i * 16;
        arr[o + 12] = ln.x + bd.side;
        arr[o + 13] = ln.ys[i0] + (ln.ys[i0 + 1] - ln.ys[i0]) * f + bd.up + P.bob * Math.sin(time * 0.9 + bd.wing);
        arr[o + 14] = P.from + zq * dz;
        i++;
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
  };
  pose(0);
  return { mesh, pose, ...info };
}

// CLEAR AIR BY PLACE: the least distance from the route (every 2 m) to everything that stands, measured in
// the valley's cross-section (x, y), which holds whatever z a line stands at and is therefore a lower bound.
// A car counts at every place it can be: its box's top edge on the tangent at its middle, with its steam's
// room (CAR.plume) over it, for the middle at every half metre of the line from the rim's end to the far hall's far wall.
async function clearAir(path, yieldFn) {
  const cloud = [], step = 0.5, n = Math.round((HALL.x1 - X_RIM) / step);
  for (let i = 0; i <= n; i++) {
    const xm = X_RIM + i * step, p = curveDy(xm), q = Math.sqrt(1 + p * p), cs = 1 / q, sn = p / q, ym = curveY(xm);
    for (let e = -2; e <= 2; e++) {
      const along = e * CAR.L / 4, x = xm + along * cs - CAR.H * sn, y = ym + along * sn + CAR.H * cs;
      cloud.push(x, y + CAR.plume);
    }
  }
  const rimY = curveY(X_RIM), boxes = [
    ['the crest things of a line (staff, pennant, beacon)', X_CREST - CREST_BOX.before, X_CREST + CREST_BOX.beyond, curveY(X_CREST) + CREST_BOX.h],
    ['the rim plateau (hills, pines, buildings)', X_STEPS, X_RIM, rimY + RIM_PLATEAU_H],
    ['the far hall', HALL.x0, HALL.x1, HALL.y1],
    ['the cars at rest', REST.x0, X_END, CAR.H],
    ['the far country (the sheets\' level edges)', X_FAR_FOOT, X_END, 0],
  ];
  const v = new THREE.Vector3(), out = { least: Infinity, what: '', atRouteM: 0, neverUnderALine: true, leastOverTheRails: Infinity };
  // beyondTheCrest: the same least, taken over the part of the route that lies beyond the crest (x over the crest's)
  const far = out.beyondTheCrest = { least: Infinity, what: '', atRouteM: 0 }; let isFar = false;
  const take = (d, what, m) => { if (d < out.least) { out.least = d; out.what = what; out.atRouteM = m; } if (isFar && d < far.least) { far.least = d; far.what = what; far.atRouteM = m; } };
  for (let m = 0; m <= path.length; m += 2) {
    path.posAtDist(m, v); isFar = v.x > X_CREST;
    if (v.x >= X_RIM && v.x <= HALL.x1) {
      const over = v.y - sweptTop(v.x); if (over <= 0) out.neverUnderALine = false;
      out.leastOverTheRails = Math.min(out.leastOverTheRails, v.y - curveY(v.x));
      const i0 = Math.max(0, Math.floor((v.x - 45 - X_RIM) / step)), i1 = Math.min(n, Math.ceil((v.x + 45 - X_RIM) / step));
      let best = Infinity;
      for (let i = i0 * 10, e = (i1 + 1) * 10; i < e; i += 2) { const dx = cloud[i] - v.x, dy = cloud[i + 1] - v.y, d = dx * dx + dy * dy; if (d < best) best = d; }
      take(Math.sqrt(best), 'a car\'s run with its steam\'s room, swept along the line', m);
    }
    for (let x = SHED.x - SHED.halfL; x <= SHED.x + SHED.halfL; x += 1) take(Math.hypot(x - v.x, Math.max(0, v.y - (curveY(x) + SHED.h))), 'a span of the station at the bottom (the plan\'s box)', m);
    for (const [what, x0, x1, top] of boxes) take(Math.hypot(Math.max(x0 - v.x, 0, v.x - x1), Math.max(0, v.y - top)), what, m);
    if (m % 200 === 0 && yieldFn) await yieldFn();
  }
  far.least = Math.round(far.least * 100) / 100;
  out.least = Math.round(out.least * 100) / 100; out.leastOverTheRails = Math.round(out.leastOverTheRails * 100) / 100;
  out.holds = out.least >= ROOM.clear && out.neverUnderALine;
  return out;
}

// THE UPLAND'S HORIZON: for every 2 m of the route over the near flank (x under the bottom's) that lies higher
// than the back ridge's lowest top, and for every whole degree of bearing from down-valley round to up-valley
// on the rim's side: the sight line from the route over that top at the ridge's nearer end comes down to the
// light table's level `reach` m from the route, and the nearest far range stands `range` m from it on that
// bearing. While reach is the greater on every bearing, such a line meets the range's face and never the light
// table behind the sheets. Returned: the least of reach less range, with its place and bearing.
function uplandHorizon(path) {
  const v = new THREE.Vector3(), out = { ridgeLow: RIDGE.low, leastSpareM: Infinity, atRouteM: 0, bearingDeg: 0, holds: true }, R = RANGE_R[0];
  for (let m = 0; m <= path.length; m += 2) {
    path.posAtDist(m, v); if (v.x >= X_BOTTOM || v.y <= RIDGE.low) continue;
    const across = (v.y - TABLE_Y) * (v.x - RIDGE.x[1]) / (v.y - RIDGE.low), ox = v.x - SKY_CENTER[0], oz = v.z - SKY_CENTER[2];
    for (let deg = 1; deg < 180; deg++) {
      const a = deg * Math.PI / 180, dx = -Math.sin(a), dz = Math.cos(a), bq = ox * dx + oz * dz;
      const spare = across / Math.sin(a) - (-bq + Math.sqrt(Math.max(0, bq * bq - (ox * ox + oz * oz - R * R))));
      if (spare < out.leastSpareM) { out.leastSpareM = Math.round(spare); out.atRouteM = m; out.bearingDeg = deg; }
      if (spare < 0) out.holds = false;
    }
  }
  return out;
}

export default {
  id: 'car-that-must-back-up',
  name: 'The Car That Must Back Up',
  category: 'bizarre',
  weirdness: 0.5,
  media: ['air', 'open'],
  async build(ctx) {
    const scene = new THREE.Scene();
    const detail = Math.min(1, Math.max(0.6, (ctx.quality && ctx.quality.detail) || 1));
    const vary = ctx.vary || {}, density = Math.min(1.3, Math.max(0.7, vary.density || 1));
    // THE EDITION (the inks of the hour): the viewer's hour, where one is asked for, names it; otherwise the
    // style draws it once from the seed. It changes inks only.
    const byHour = { night: 'ultramarine', golden: 'plum', dawn: 'teal' };
    const style = makeStyle(ctx, { detail, edition: byHour[vary.hour] });
    const pal = style.palette, r = ctx.rng.fork ? ctx.rng.fork('cbu-world') : ctx.rng;
    style.pineShare = style.pineShare * density;
    scene.background = pal.deep.clone();
    const add = (geo, mat = style.paper, cull = true) => { const m = new THREE.Mesh(geo, mat); m.frustumCulled = cull; m.matrixAutoUpdate = false; scene.add(m); return m; };

    // the run's table, integrated once in slices, and its check against the plan's event times
    await prepareRun(() => ctx.yield());
    const runCheck = checkRun();
    await ctx.yield();

    // THE ROUTE: the plan's control points, none moved
    const path = makePath(ROUTE_POINTS);
    const v = new THREE.Vector3();
    await ctx.yield();

    // THE SKY, BUILT about the constant centre: bands, pin holes, and on the rare visit the thin moon, MOON_UP degrees
    // up at MOON_BEARING, over the near rim where the valley runs out
    const stars = Math.round(350 + 150 * (0.5 + 0.5 * r()) * (detail - 0.6) / 0.4), cloudCount = r.chance(0.5) ? 8 : 14, birdEvery = r.chance(0.5) ? PASS.every[0] : PASS.every[1];
    add(style.skyGeometry({ center: SKY_CENTER, radius: SKY_R, stars, even: 0.7, high: true, large: true, fill: true, moon: vary.rare ? { bearing: MOON_BEARING, up: MOON_UP } : null }), style.paper, false);
    await ctx.yield();
    const far = style.batch();
    addRanges(far, pal, ctx.noise);
    await ctx.yield();
    addClouds(far, pal, r.fork ? r.fork('clouds') : r, cloudCount, !!vary.rare);
    add(far.geometry(), style.paper, false);
    await ctx.yield();
    // THE LIGHT TABLE: one level sheet of lit paper under everything, out beyond the far ranges
    const reach = RANGE_R[2] + 1500;
    add(style.tableGeometry(SKY_CENTER[0] - reach, SKY_CENTER[0] + reach, SKY_CENTER[2] - reach, SKY_CENTER[2] + reach), style.paper, false);
    await ctx.yield();

    // THE LAND: the 190 sheets with their rack lines, the station's spans, buffers, crest things, pines and buildings
    for (let k = 0; k < N; k += SHEETS_PER_MESH) {
      add(await style.buildSheets(k, Math.min(N, k + SHEETS_PER_MESH)));
      await ctx.yield();
    }
    add(style.hallGeometry());
    await ctx.yield();
    const hallPlumes = style.hallPlumes();   // the plumes of the far hall's vents, on the clock
    hallPlumes.mesh.matrixAutoUpdate = false; scene.add(hallPlumes.mesh);
    await ctx.yield();
    // what the clock moves on every line, and the cars that got over
    const lines = style.makeLines(0, N);
    lines.group.matrixAutoUpdate = false;
    scene.add(lines.group);
    await ctx.yield();
    const rest = style.restCars(0, N);
    scene.add(rest);
    await ctx.yield();
    const birds = await makeBirds(style, r.fork ? r.fork('birds') : r, path, birdEvery / (0.5 + 0.5 * detail), () => ctx.yield());
    if (birds.mesh) scene.add(birds.mesh);
    await ctx.yield();
    const rowBirds = await makeRowBirds(style, r.fork ? r.fork('row-birds') : r, path, (r.chance(0.5) ? ROWS.every[0] : ROWS.every[1]) / (0.5 + 0.5 * detail), () => ctx.yield());
    if (rowBirds.mesh) scene.add(rowBirds.mesh);
    await ctx.yield();

    const clearance = await clearAir(path, () => ctx.yield());
    const routeM = Math.round(path.length * 100) / 100, upland = uplandHorizon(path);

    return {
      scene, path, duration: DURATION, pace,
      camera: { ...CAMERA },
      pois: LOOKS.map((k) => { const o = [0, 0, 0]; return { at: (time, u) => { path.posAtDist(u * path.length, v); const off = lookOffset(k, u, o); return [v.x + off[0], v.y + off[1], v.z + off[2]]; },
        from: k.from, to: k.to, fade: k.fade, weight: k.weight, steady: k.steady, arc: k.arc }; }),
      // the way out: the engine's own ring with its rim, its halo and its own moving veil, in the afterglow's rose
      // (PORTAL_LOOK); no flat veil, and drawWithin, drawIn and revealDistance are not set
      portal: { ...PORTAL, color: PORTAL_LOOK.color, style: PORTAL_LOOK.style, glow: PORTAL_LOOK.glow },
      post: { flat: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } },
      ride: 'none', style: 'none', companion: 'none',
      info: { runCheck, clearance, upland, routeM,
        station: { what: 'the shed of every line is one span of a station hall of cut paper lit from behind along the valley\'s floor, warm paper panes between dark ribs under a pale lantern strip; its ends toward the bottom step in and out by runs of lines and are arched openings on a warm floor, each with a pale apron on the cut edge', spans: N,
          mouthsShortOfTheBoxM: STATION.back, linesToARun: STATION.runs, grandBayEvery: STATION.grandEvery, highestOverTheLineM: STATION.ridge + STATION.lanternUp + STATION.grandUp, theBoxM: SHED },
        lampPatch: { what: 'a tapered patch of the lamp\'s ink on the cut edge ahead of every car the way it travels, by the car\'s speed on the run\'s clock; gone at a stall', lengthM: LAMP.len, fullLengthAtMs: LAMP.atSpeed, foldsUnderMs: LAMP.fold },
        steam: { what: 'while the engine drives a car up a slope, flat scalloped puffs stream back along the line behind it in the sheet\'s plane, by the car\'s place and speed on the run\'s clock; none coasting down, none under a span of the station; every puff under the part\'s sweptTop', puffs: STEAM.puffs,
          trailNeverOverM: STEAM.back[2], widestM: steamWidest(), roomOverTheCarsBoxM: CAR.plume },
        secondLook: { pictures: ['along the valley', 'across the trough', 'square to the far flank'], keysStandAt: ['where the look is first full', 'the rim leg\'s beginning', 'the rim leg\'s middle', 'where the look is last full'],
          keys: LOOKS[1].keys, distM: LOOKS[1].distM, thePlansCountsAt16to9: PLAN_COUNTS }, routeAgrees: Math.abs(routeM - ROUTE_M) <= 0.05, edition: style.edition,
        clouds: cloudCount, birdStrings: birds.strings, birds: birds.birds, birdsLeastToRoute: birds.leastToRoute, birdsLeastAt: birds.leastAt, birdRounds: birds.rounds, rowBirdFlocks: rowBirds.strings, rowBirds: rowBirds.birds, rowBirdsLeastToRoute: rowBirds.leastToRoute, rowBirdLanes: rowBirds.lanes, birdLanes: [...birds.figures, ...rowBirds.figures], hallVents: hallPlumes.vents, stars, moon: !!vary.rare, period: T, sheets: N, spacing: D, lastLineZ: lineZ(N - 1) },
      update(dt, time) {
        style.update(dt, time);
        lines.pose(time);
        hallPlumes.pose(time);
        birds.pose(time);
        rowBirds.pose(time);
      },
      dispose() {},
    };
  },
};
