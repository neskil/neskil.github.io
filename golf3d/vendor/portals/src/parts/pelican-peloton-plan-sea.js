// pelican-peloton-plan-sea.js: BUILDER B'S PURE NUMBERS AND FUNCTIONS for the life of sea and sky (the lead's ruling 7
// after P1): what the frozen plan file leaves to builder B. It imports ONLY the plan file; no THREE, no kit, no clock,
// no dice of its own; the same in the page and in node (tools/ab/pp-count-sea.mjs counts with it).
//   THE SKY     the sun's law for every cloud (none stands or drifts in front of the sun's disc or of the opening as
//               seen from any metre of the route), a drifting lane's CLEAR WINDOW, the standing bank as built
//   THE BIRDS   the gliders' seven lines, the wing's law, the ambient diver's whole cycle and its splash, which
//               divers fly (those clear of the gliders' lines), the nine's rise over the plan's course, the roost's
//               fourteen places on the stack (each the mirror of the shader's own text)
//   THE BOATS   stand inside the plan's own cylinder (BOAT_R, BOAT_H); their model and rocking are the sea part's
// Places are in metres of the world, or of the road's own measure (station s, side n to port, height h), or of the
// harbour's (metres ALONG the lens's straight over it and ACROSS it, port positive), as the plan file types them.
import { PP, CLOUDS, SEA, NINE_LAW, BOATS, STACK, STACK_R, STACK_H, BOAT_R, BOAT_H, routePoints, chordPoint, ninePlace, placeKind } from './pelican-peloton-plan.js';

const D2R = Math.PI / 180, TAU = 6.283185307179586;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x)), lerp = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const fr = (v) => v - Math.floor(v);

// ---------------------------------------------------------------------------------------------
// THE ROUTE AS THIS FILE KNOWS IT: the plan's thirty waypoints joined by straight strokes and read every STEP metres,
// [[x, y, z, d], ...]. The flown line (the kit's curve through the same waypoints) lies within a metre or two of it;
// the page types cloud lanes against this one with a margin, and the count proves them against the kit's real line.
// ---------------------------------------------------------------------------------------------
export function routeCoarse(road, step = 12) {
  if (road._coarse && road._coarseStep === step) return road._coarse;
  const W = routePoints(road), out = []; let d = 0, next = 0;
  for (let i = 0; i + 1 < W.length; i++) {
    const a = W[i], b = W[i + 1], l = Math.max(Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), 1e-6);
    for (; next <= d + l; next += step) { const t = (next - d) / l; out.push([lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t), next]); }
    d += l;
  }
  const e = W[W.length - 1]; if (d - out[out.length - 1][3] > 0.5) out.push([e[0], e[1], e[2], d]);
  road._coarse = out; road._coarseStep = step;
  return out;
}
// the unit vector toward the sun: the last straight's own heading, PP.SUN_EL degrees up (the world makes the same from
// the route's last tangent)
export function sunOf(road) {
  const a = road.sunAzimuth, c = Math.cos(PP.SUN_EL * D2R);
  return [Math.sin(a) * c, Math.sin(PP.SUN_EL * D2R), Math.cos(a) * c];
}
// the opening's middle: the route's last waypoint
export function openingOf(road) { const W = routePoints(road); return W[W.length - 1]; }

// ---------------------------------------------------------------------------------------------
// THE SUN'S LAW FOR CLOUDS (the lead's ruling 9 of the freeze). From a place P of the route a ball (middle c, radius
// r) shows `sunGap` degrees of clear sky between its edge and the SUN'S MIDDLE; the sun's disc is PP.SUN_R degrees, so
// a gap over PP.SUN_R is a cloud that does not touch the disc. For the opening (a disc of PP.PORTAL_R m at the
// route's end, drawn from PP.DRAW_WITHIN m left): `openAir` is the clear air, in metres, between the ball and
// the cone from the lens to the opening's rim. SKY.LAW is what the count asks; SKY.TYPE the wider figure the lanes and the bank are typed to.
// ---------------------------------------------------------------------------------------------
export const SKY = { LAW: 8.0, TYPE: 9.0, OPEN_LAW: 2.0, ROUTE_STEP: 12, LANE_STEP: 25, MIN_WINDOW: 700, GROW: CLOUDS.GROW, SPEED: CLOUDS.SPEED };
export function sunGap(P, c, r, sun) {
  const x = c[0] - P[0], y = c[1] - P[1], z = c[2] - P[2], l = Math.max(Math.hypot(x, y, z), 1e-6);
  return (Math.acos(clamp((x * sun[0] + y * sun[1] + z * sun[2]) / l, -1, 1)) - Math.asin(Math.min(1, r / l))) / D2R;
}
// metres of clear air between a ball and THE CONE FROM THE LENS TO THE OPENING'S RIM (t: the opening's own axis, the
// route's last tangent); Infinity for a ball behind the lens or wholly beyond the opening's plane (a thing beyond the
// plane is not before the opening: the opening, growing, comes to cover it)
export function openAir(P, c, r, E, t) {
  const ex = E[0] - P[0], ey = E[1] - P[1], ez = E[2] - P[2], D = ex * t[0] + ey * t[1] + ez * t[2];
  const x = c[0] - P[0], y = c[1] - P[1], z = c[2] - P[2], a = x * t[0] + y * t[1] + z * t[2];
  if (D < 1e-3 || a <= -r || a >= D + r) return Infinity;
  const el = Math.max(Math.hypot(ex, ey, ez), 1e-6), k = (x * ex + y * ey + z * ez) / el, ac = clamp(k, 0, el);
  const rho = Math.hypot(x - ex / el * ac, y - ey / el * ac, z - ez / el * ac);       // from the line lens to opening's middle
  return rho - PP.PORTAL_R * ac / el - r;
}
// true where the ball clears the sun by `deg` from EVERY place of the route given (quick: no angle is worked out)
function ballClear(route, c, r, sun, cosT, sinT) {
  for (let i = 0; i < route.length; i++) {
    const P = route[i], x = c[0] - P[0], y = c[1] - P[1], z = c[2] - P[2], l2 = x * x + y * y + z * z, dot = x * sun[0] + y * sun[1] + z * sun[2];
    if (dot <= 0) continue;                                         // behind the eye as it looks at the sun
    const l = Math.sqrt(l2), s = Math.min(1, r / l);                // the ball's own half angle: its sine
    if (dot / l > cosT * Math.sqrt(1 - s * s) - sinT * s) return false;
  }
  return true;
}
// ---------------------------------------------------------------------------------------------
// A DRIFTING LANE'S CLEAR WINDOW. The plan deals each lane as 2,600 m of straight course (a to b). The cloud rides only
// THE LONGEST STRETCH OF IT ON WHICH no circle of the cloud, at its full size, comes within SKY.TYPE degrees of the
// sun's middle as seen from any place of the route (read every LANE_STEP m, each ball grown by half a step of lane and
// of route, so nothing slips between two readings). It rides that stretch to and fro (cloudAt, below). A lane whose longest clear stretch is under MIN_WINDOW m is
// left out and counted. Typed by place for every visit: the route and the sun are the same on every seed.
// -> { t0, t1 } in metres along the lane from a, or null
// ---------------------------------------------------------------------------------------------
// A CLOUD'S BREADTH (this part's own; the plan strings a cloud's circles along its lane only, and the lanes run along
// the coast as the road does, so from most of the route a cloud was seen end-on, as one ball): circle j stands
// cloudSide(lane, j) metres to the right of its lane, by turns to one side and the other, by 0.4 to 0.85 of its own
// radius. The window, the count and the discs all take the circle's place with it.
export const cloudSide = (lane, j) => (j % 2 ? 1 : -1) * lane.circles[j].r * (0.4 + 0.45 * fr(j * 0.618 + lane.phase * 7));
export function laneWindow(lane, road, route = routeCoarse(road, SKY.ROUTE_STEP)) {
  const sun = sunOf(road), cosT = Math.cos(SKY.TYPE * D2R), sinT = Math.sin(SKY.TYPE * D2R), LEN = CLOUDS.LEN, st = SKY.LANE_STEP;
  const ux = (lane.b[0] - lane.a[0]) / LEN, uz = (lane.b[2] - lane.a[2]) / LEN, grow = (SKY.ROUTE_STEP + st) / 2, c = [0, 0, 0];
  let R = 0; lane.circles.forEach((q, j) => { R = Math.max(R, Math.hypot(q.along, q.up, cloudSide(lane, j)) + q.r); });
  let best = null, from = -1;
  const close = (to) => { if (from >= 0 && (!best || to - from > best.t1 - best.t0)) best = { t0: from, t1: to }; from = -1; };
  for (let t = 0; t <= LEN + 1e-6; t += st) {
    c[0] = lane.a[0] + ux * t; c[1] = lane.y; c[2] = lane.a[2] + uz * t;
    let ok = ballClear(route, c, R + grow, sun, cosT, sinT);
    if (!ok) {
      ok = true;
      for (let j = 0; j < lane.circles.length && ok; j++) {
        const q = lane.circles[j], side = cloudSide(lane, j);
        c[0] = lane.a[0] + ux * (t + q.along) + uz * side; c[1] = lane.y + q.up; c[2] = lane.a[2] + uz * (t + q.along) - ux * side;
        if (!ballClear(route, c, q.r + grow, sun, cosT, sinT)) ok = false;
      }
    }
    if (ok) { if (from < 0) from = t; } else close(t - st);
  }
  close(LEN);
  return best && best.t1 - best.t0 >= SKY.MIN_WINDOW ? best : null;
}
// the plan's dealt lanes with their windows: -> { lanes: [lane + { t0, t1 }], leftOut }
export function clearLanes(lanes, road) {
  const route = routeCoarse(road, SKY.ROUTE_STEP), out = []; let leftOut = 0;
  for (const lane of lanes) { const w = laneWindow(lane, road, route); if (w) out.push({ ...lane, t0: w.t0, t1: w.t1 }); else leftOut++; }
  return { lanes: out, leftOut };
}
// MIRROR of the drifting cloud's own law (the discs' vertex text): the cloud's middle rides its window TO AND FRO on the
// world's time, eased at both ends, at SKY.SPEED m/s at its quickest; it keeps its full size (so no cloud is ever
// seen half grown beside the sun, and none comes or goes). -> { t (metres along the lane from a), size 1 }
export function cloudAt(lane, time) {
  const w = Math.max(lane.t1 - lane.t0, 1);
  return { t: lane.t0 + w * (0.5 - 0.5 * Math.cos(time * 2 * SKY.SPEED / w + TAU * lane.phase)), size: 1 };
}

// ---------------------------------------------------------------------------------------------
// THE STANDING BANK, as built (it replaces the plan's forty circles; typed in the road's measure, the same on every
// visit). Seen from the harbour and the cliff road the sun stands over the sea to PORT of the road in the air, and
// seen from the last straight it stands on the road's own line: so the sun's law leaves two places for cloud.
//   THE FLANK   to STARBOARD of the road in the air: heaps of circles whose inner edge opens away from the road like a
//               funnel (EDGE0 m at the start, FAN m more a metre from EDGE_S on), rising from far under the road to
//               well over it: rows A (inner), B, C (tall), D (the foot), E (the far backdrop)
//   THE FOG     under the road and to port of it: low domes on the water whose tops, at the height of their swell,
//               stay under the lowest place of the lens (y 10.94), so they are under the horizon from every metre
//   THE HIGH ROW (added at the gate, plan-changes 48) twelve heaps far beyond the road in the air and high over the
//               sea, each typed where no metre of the route sees it within 12 degrees of the sun's middle
// A circle swells and settles on the world's time: its radius by SW_R of itself, its middle by SW_Y of its radius
// (a fog dome's top at the height of its swell: FOG_TOP + (SW_R + SW_Y) x its radius, 9.7 m at the most).
// -> [{ x, y, z, r, own, row }]   (y: the middle's height; own: 0..1, its phase and periods)
// ---------------------------------------------------------------------------------------------
export const BANK = {
  SW_R: 0.10, SW_Y: 0.08, PER_R: [4, 7], PER_Y: [5.5, 8.5],
  S0: 724, S1: 1104, STEP: 15, EDGE0: -25, EDGE_S: 790, FAN: 0.165, S_TABLE: 1030,
  FOG_S: [724, 1047], FOG_STEP: 17, FOG_N: [-14, 16, 46, 78], FOG_R: [11, 15], FOG_TOP: [4, 7], FOOT: [3, -16],
  // the fog further to port (seen over the road's port edge from the road itself): larger domes, wider apart
  SEA_S: [730, 1110], SEA_STEP: 28, SEA_N: [118, 162, 210, 262], SEA_R: [18, 25], SEA_TOP: [2.5, 5.5],
  // THE FAR ROW: heaps on the horizon, by their bearing from the brink in degrees to port of the sun's own bearing
  // (none within the sun's sector as seen from any metre of the route: counted), FAR_D m off, flat bases at FAR_BASE
  FAR_BEAR: [-37, -27, -17.5, 25.5, 35, 45, 56, 69, 84, 102, 122], FAR_D: [1800, 2600], FAR_R: [70, 135], FAR_N: 5, FAR_BASE: 25,
  // THE HIGH ROW (plan-changes 48): tall heaps standing high over the sea beyond the road in the air, so that the
  // sky over the ribbon has ranks. Each heap is typed [its bearing from the brink in degrees to port of the sun's own,
  // the elevation of its base from the brink in degrees, metres off, its radius, the circles along its base]; over
  // its base stands a second tier, and under it a shaded tier HIGH_BACK m further off and HIGH_SHADE of a radius
  // lower. Counted like every row: no circle within the sun's law from any metre of the route.
  HIGH: [
    [-17, 23, 900, 46, 3], [-30, 17, 950, 58, 4], [-36, 27, 1050, 60, 4], [-52, 16, 1150, 74, 5],
    [-66, 25, 1300, 80, 4], [52, 15, 1200, 76, 5], [66, 24, 1350, 82, 4], [84, 17, 1300, 80, 4],
    [0, 26, 2500, 104, 3], [-13, 31, 2300, 96, 4], [24, 31, 2400, 100, 4], [37, 20, 2600, 108, 4],
  ],
  // the flank's waves (plan-changes pb 4): C [share, metres a wave, its phase, the second wave's three], B's one, the
  // metres C's top rises more by, the share over which heads stand on C, and each head [ds, dn, its top over C's top and
  // its radius as shares of C's radius, its own number]: three unlike lobes that sit half sunk in C, not one ball on it
  VARY: { C: [0.3, 97, 1.3, 0.14, 41, 0.4], B: [0.2, 71, 2.6], LIFT: 6, HEAD: 1.2, HEADS: [[-1.5, -3, 0.52, 0.5, 0.95], [7.5, 6, 0.2, 0.36, 0.41], [-9, 9, 0.12, 0.3, 0.73]] },
  HIGH_SHADE: 0.4, HIGH_BACK: 90, HIGH_UP: 0.95,   // (the shade stands well behind the white tier's own line, which the sea part draws 25 m back)
};
// a place of the road's measure, carried on straight beyond the road's table (the last straight's own line)
export function bankPoint(road, s, n) {
  const B = BANK, p = road.point(Math.min(s, B.S_TABLE), n, 0);
  if (s > B.S_TABLE) { const a = road.at(B.S_TABLE); p[0] += a.tx * (s - B.S_TABLE); p[2] += a.tz * (s - B.S_TABLE); }
  p[1] = road.y(s);
  return p;
}
export function seaBank(road) {
  if (road._bank) return road._bank;
  const B = BANK, out = [];
  const put = (s, n, top, r, own, row) => { const p = bankPoint(road, s, n); out.push({ x: p[0], y: (row === 'fog' ? 0 : p[1]) + top - r, z: p[2], r, own: fr(own), row, s, n }); };
  let i = 0;
  for (let s = B.S0; s <= B.S1 + 1e-6; s += B.STEP, i++) {
    const e = B.EDGE0 - B.FAN * Math.max(0, s - B.EDGE_S), j1 = fr(i * 0.618 + 0.11), j2 = fr(i * 0.618 + 0.47), j3 = fr(i * 0.382 + 0.29), j4 = fr(i * 0.755 + 0.63);
    const ra = lerp(9, 12, j1), rb = lerp(13, 17, j2), rc = lerp(17, 23, j3), rd = lerp(14, 19, j4);
    put(s, e - ra, lerp(-7, 1, j2), ra, i * 0.317 + 0.05, 'A');
    // THE FLANK'S HEAPS AND SADDLES (plan-changes pb 4): rows B and C rise and sink along the road by two slow waves of
    // unlike lengths (C also grows and shrinks, its inner reach held where it was), and where C stands tallest a head
    // stands on it, so that no two heaps of the wall are alike in one view
    const V = B.VARY, mc = 1 + V.C[0] * Math.sin(TAU * s / V.C[1] + V.C[2]) + V.C[3] * Math.sin(TAU * s / V.C[4] + V.C[5]), mb = 1 + V.B[0] * Math.sin(TAU * s / V.B[1] + V.B[2]);
    const nC = e - 38 - 10 * j1 - (mc - 1) * rc, tC = lerp(9, 22, j4) * mc + (mc - 1) * V.LIFT;
    put(s + 5, e - 14 - rb * 0.5 - 6 * j3, lerp(3, 11, j3) * mb, rb, i * 0.317 + 0.3, 'B');
    put(s - 4, nC, tC, rc * mc, i * 0.317 + 0.55, 'C');
    if (mc > V.HEAD) for (const h of V.HEADS) put(s + h[0], nC + h[1], tC + h[2] * rc * mc, h[3] * rc * mc, i * 0.317 + h[4], 'C');
    put(s + 7.5, e - 6 - rd * 0.7, lerp(-16, -8, j1), rd, i * 0.317 + 0.8, 'D');
    if (i % 2 === 0) put(s + 3, e - 78 - 14 * j2, lerp(14, 30, j1), lerp(24, 30, j4), i * 0.317 + 0.92, 'E');
    // the flank's foot: two domes of fog on the water at its inner edge, before the place where the heaps meet the sea
    put(s + 3, e + B.FOOT[0], lerp(B.FOG_TOP[0], B.FOG_TOP[1], j3), lerp(B.FOG_R[0], B.FOG_R[1], j4), i * 0.317 + 0.18, 'fog');
    put(s - 4, e + B.FOOT[1], lerp(B.FOG_TOP[0], B.FOG_TOP[1], j1), lerp(B.FOG_R[0], B.FOG_R[1], j2), i * 0.317 + 0.68, 'fog');
  }
  i = 0;
  for (let s = B.FOG_S[0]; s <= B.FOG_S[1] + 1e-6; s += B.FOG_STEP, i++) B.FOG_N.forEach((n, k) => {
    const j1 = fr(i * 0.618 + k * 0.271 + 0.2), j2 = fr(i * 0.382 + k * 0.529 + 0.4);
    put(s + 8 * (j2 - 0.5), n + 12 * (j1 - 0.5), lerp(B.FOG_TOP[0], B.FOG_TOP[1], j2), lerp(B.FOG_R[0], B.FOG_R[1], j1), i * 0.317 + k * 0.23, 'fog');
  });
  i = 0;
  for (let s = B.SEA_S[0]; s <= B.SEA_S[1] + 1e-6; s += B.SEA_STEP, i++) B.SEA_N.forEach((n, k) => {
    const j1 = fr(i * 0.618 + k * 0.371 + 0.6), j2 = fr(i * 0.382 + k * 0.229 + 0.1);
    put(s + 24 * (j2 - 0.5), n + 26 * (j1 - 0.5), lerp(B.SEA_TOP[0], B.SEA_TOP[1], j2), lerp(B.SEA_R[0], B.SEA_R[1], j1), i * 0.317 + k * 0.41 + 0.07, 'fog');
  });
  // the far row: FAR_N circles a heap, laid across the line of sight from the brink, their bases level
  const O = road.point(PP.S_BRINK, 0, 0);
  B.FAR_BEAR.forEach((deg, k) => {
    const a = road.sunAzimuth + deg * D2R, D = lerp(B.FAR_D[0], B.FAR_D[1], fr(k * 0.618 + 0.3)), cx = O[0] + Math.sin(a) * D, cz = O[2] + Math.cos(a) * D;
    let off = 0, last = 0;
    for (let j = 0; j < B.FAR_N; j++) {
      const r = lerp(B.FAR_R[0], B.FAR_R[1], fr(k * 0.382 + j * 0.618 + 0.15)) * (j === 0 || j === B.FAR_N - 1 ? 0.65 : 1);
      if (j > 0) off += (last + r) * 0.62; last = r;
      const q = off - 2.2 * B.FAR_R[1] * 0.62;
      out.push({ x: cx + Math.cos(a) * q, y: B.FAR_BASE + r * 0.9, z: cz - Math.sin(a) * q, r, own: fr(k * 0.317 + j * 0.21), row: 'far', s: 0, n: deg });
    }
  });
  // the high row: a heap's base circles laid across the line of sight from the brink, a tier over them, a shade under
  B.HIGH.forEach(([deg, el, D, R, N], k) => {
    const a = road.sunAzimuth + deg * D2R, sx = Math.sin(a), sz = Math.cos(a), base = O[1] + Math.tan(el * D2R) * D, rs = [];
    let off = 0, last = 0;
    for (let j = 0; j < N; j++) {
      const r = R * lerp(0.8, 1.12, fr(k * 0.382 + j * 0.618 + 0.45)) * (j === 0 || j === N - 1 ? 0.66 : 1);
      if (j > 0) off += (last + r) * 0.62; last = r; rs.push([off, r]);
    }
    const at = (q, y, r, back, own, row) => out.push({ x: O[0] + sx * (D + back) + sz * q, y, z: O[2] + sz * (D + back) - sx * q, r, own: fr(own), row, s: k, n: deg });
    rs.forEach(([o, r], j) => {
      const q = o - off / 2, own = k * 0.317 + j * 0.21 + 0.4;
      at(q, base + r * 0.9, r, 0, own, 'high');
      at(q, base + r * (0.9 - B.HIGH_SHADE), r * 0.94, B.HIGH_BACK, own + 0.5, 'shade');
      if (j > 0 && j < N - 1) at(q + (fr(k * 0.71 + j * 0.37) - 0.5) * r, base + r * (0.9 + B.HIGH_UP), r * lerp(0.66, 0.84, fr(k * 0.53 + j * 0.29)), 0, own + 0.27, 'high');
    });
  });
  for (const c of bedCircles(road)) out.push(c);                    // the bed, the piers and the heap under the road in the air (below)
  return (road._bank = out);
}
// MIRROR of the bank's swell (the discs' vertex text): a circle's radius and its middle's height at a time
// (a circle of THE BED carries `sw`, its share of the swell: the old rows carry none and swell whole)
export function bankAt(c, time, out = {}) {
  const B = BANK, o2 = fr(c.own * 7.3 + 0.19), k = c.sw ?? 1;
  out.y = c.y + B.SW_Y * k * c.r * Math.sin(time * TAU / lerp(B.PER_Y[0], B.PER_Y[1], o2) + TAU * o2);
  out.r = c.r * (1 + B.SW_R * k * Math.sin(time * TAU / lerp(B.PER_R[0], B.PER_R[1], c.own) + TAU * c.own));
  return out;
}
// a circle at the furthest reach of its swell, as a ball: [x, y (middle, raised), z, r (grown)] and its top
export const bankMost = (c) => { const k = c.sw ?? 1; return { x: c.x, z: c.z, r: c.r * (1 + BANK.SW_R * k), yLo: c.y - BANK.SW_Y * k * c.r, yHi: c.y + BANK.SW_Y * k * c.r }; };

// THE BANK'S WATERLINE (plan-changes 53). A circle of the bank stands for a BALL of cloud. Where a ball crosses the
// sea its true cut is a LEVEL CIRCLE about its own middle, of radius sqrt(r x r - h x h) (h: the middle's height from
// the water); the flat disc that is turned to the eye meets the water in a straight chord of that same circle,
// whichever way the eye lies. So the sea part lays the level circle on the water under every circle of the flank and
// of the fog that can reach the sea, with the one line round it: the bank's foot ends in round lobes, never in a
// straight cut. Typed by the bank's own places and swell (no die, no clock but the world's time). The far row and the
// high row have none (the far row's foot is the horizon itself; the high row never reaches the water).
//   FOOT.LIFT  metres over the sea: the line, a shaded row's circle, a white row's (the order they are drawn over)
// bankFoot(road) -> the bank's own circles that can reach the water; footAt: MIRROR of the waterline's radius at a
// time (0 while the ball is clear of the water); footMost: the greatest it can be
export const FOOT = { ROWS: ['A', 'B', 'C', 'D', 'E', 'fog', 'bed', 'pier', 'heap'], LIFT: [0.03, 0.06, 0.09] };   // (the bed's and the piers' circles that come down to the water wear it too)
export function bankFoot(road) {
  return seaBank(road).filter((c) => { const m = bankMost(c); return !c.dry && FOOT.ROWS.includes(c.row) && m.yLo - m.r < PP.SEA_Y && m.yHi + m.r > PP.SEA_Y; });
}
export function footAt(c, time) { const q = bankAt(c, time), h = q.y - PP.SEA_Y; return Math.sqrt(Math.max(q.r * q.r - h * h, 0)); }
export function footMost(c) {
  const m = bankMost(c), h = m.yLo > PP.SEA_Y ? m.yLo - PP.SEA_Y : m.yHi < PP.SEA_Y ? PP.SEA_Y - m.yHi : 0;
  return Math.sqrt(Math.max(m.r * m.r - h * h, 0));
}

// ---------------------------------------------------------------------------------------------
// THE BED UNDER THE ROAD IN THE AIR (plan-changes pb 1; the lead's P3 after the first preview: seen from the side the
// ribbon was a slab hanging in the air). From where the land ends under it to its far end the ribbon RESTS ON CLOUD:
// circles of the bank's own kind (the same draws, the same swell at BED.SW of its reach), every one typed by the
// road's measure and laid so that its top, at the height of its swell, stays under the road's skin at its own station:
//   U      under the ribbon from edge to edge, two a station (its top BED.UNDER m under the skin: the ribbon is 0.4 thick)
//   UF     the same beyond s 806, one small circle a station under the ribbon's port half (it shows from no metre of the grade)
//   ST PT  beside the starboard and the port edge (seen from the road as the cloud the ribbon lies in); PO: further
//          out to port and lower (the escort's line passes over it)
//   FLOOR  two files to starboard between the ribbon and the flank, along BED.LINE (the lens's own swing out, 6 m
//          further off): the spectators' floor
//   PIER   heaps under the ribbon every 52 m, each level wider and lower, down to the fog
//   HEAP   the low heap the ribbon's far end lies on: [station, side, metres its top lies under the skin, radius]
// THE SUN'S DISC: from the place where the lens stands on the ribbon's grade (s 713, d 684) every circle that stands
// inside the disc as the lens sees it lies UNDER the ribbon as the lens sees it (the ribbon hides it); the circles that
// show beside the edges end where they would come into the disc from 204 m left on (ST at s 804, PT at s 864); and every
// circle of UF, of a pier and of the heap lies lower by THE LINE'S OWN REACH from s 640, where the last straight begins (the one line is held
// to 2.2 points of the picture: BED.INK m a metre of distance on the tallest frame), so its line too stays under. The sea
// count's section (F) reads every circle so, from every metre of the last 204.
// ---------------------------------------------------------------------------------------------
export const BED = {
  SW: 0.35, UNDER: 0.45,
  INK: 0.0117, INK_S: 640,
  U: { S: [700, 1001], STEP: 8.2, OFF: 3.4, HIDE: 806, R: [5.2, 6.4] },
  UF: { S: [811, 999], STEP: 5.6, N: 4.5, R: [3.3, 4.0] },
  ST: { S: [700, 804], STEP: 7.4, OUT: 2.4, R: [4.8, 6.0], DOWN: 0.55 },
  PT: { S: [694, 864], STEP: 7.8, OUT: 1.6, R: [4.4, 5.4], DOWN: 0.55 },
  PO: { S: [696, 858], STEP: 11.5, OUT: 9.5, R: [6.5, 8.5], DOWN: 3.2 },
  LINE: [[684, -15.2], [700, -16.6], [715, -18.3], [730, -19.0], [750, -17.7], [770, -14.6], [790, -13.2], [808, -12.6]],
  FLOOR: { S: [714, 806], STEP: 7.4, R: [5.4, 6.4], DOWN: 0.6, BACK: 7.2, BACK_R: [6.4, 8], BACK_DOWN: 1.3 },
  PIER: { S: [752, 804, 856, 908, 956], LEVELS: [[7, 1.2, 1.5], [9.5, 9.5, 3], [12, 20, 4.5], [14.5, 32, 6]], SIDE: 0.8, LOW: 3 },
  HEAP: [[968, 2, 0.5, 7.5], [984, 0, 0.5, 6.5], [992, 4, 0.5, 7], [1002, 1.5, 0.6, 7], [975, 9, 5, 10], [996, 11, 6, 10.5], [1006, 6, 8, 11],
    [962, 12, 11, 11], [985, 16, 14, 13], [1004, 15, 17, 14], [990, 4, 24, 15], [1010, 8, 28, 16]],
};
// -> the bed's circles, of the bank's own shape: { x, y, z, r, own, row ('bed' | 'pier' | 'heap'), s, n, sw, kind, dry }
// (kind: the row within the bed; dry: its ball would meet the water where the land stands, so it wears no waterline)
// bedGoes: the same in goes for the page (it hands back after the rows and after every 60 circles' look for land under
// their waterline); the bed is typed, so it is laid once a road and kept on it, as the bank and the watchers are
export function bedCircles(road) { if (road._bed) return road._bed; const g = bedGoes(road); let r = g.next(); while (!r.done) r = g.next(); return r.value; }
export function* bedGoes(road) {
  if (road._bed) return road._bed;
  const D = BED, out = [], G = (BANK.SW_R + BANK.SW_Y) * D.SW;
  const put = (s, n, down, r, own, row, kind) => {
    const p = bankPoint(road, s, n), ink = kind === 'UF' || row !== 'bed' ? D.INK * Math.max(0, s - D.INK_S) : 0;   // (the line's own reach: below)
    out.push({ x: p[0], y: p[1] - down - ink - r * (1 + G), z: p[2], r, own: fr(own), row, s, n, sw: D.SW, kind });
  };
  const span = (T, f) => { let i = 0; for (let s = T.S[0]; s <= T.S[1] + 1e-6; s += T.STEP, i++) f(s, i, fr(i * 0.618 + 0.23), fr(i * 0.382 + 0.61)); };
  span(D.U, (s, i, j1, j2) => {
    const e = road.edges(Math.min(s, PP.S_END)), mid = (e[0] + e[1]) / 2;
    if (s > D.U.HIDE) return;
    put(s, mid - D.U.OFF - 0.6 * (j1 - 0.5), D.UNDER, lerp(D.U.R[0], D.U.R[1], j1), i * 0.317 + 0.11, 'bed', 'U');
    put(s + 3.1, mid + D.U.OFF + 0.6 * (j2 - 0.5), D.UNDER, lerp(D.U.R[0], D.U.R[1], j2), i * 0.317 + 0.57, 'bed', 'U');
  });
  span(D.UF, (s, i, j1, j2) => put(s, D.UF.N + 0.8 * (j2 - 0.5), D.UNDER, lerp(D.UF.R[0], D.UF.R[1], j1), i * 0.317 + 0.67, 'bed', 'UF'));
  span(D.ST, (s, i, j1, j2) => put(s, road.edges(s)[0] - D.ST.OUT - 1.2 * (j2 - 0.5), D.ST.DOWN + 0.5 * j1, lerp(D.ST.R[0], D.ST.R[1], j1), i * 0.317 + 0.29, 'bed', 'ST'));
  span(D.PT, (s, i, j1, j2) => put(s, road.edges(s)[1] + D.PT.OUT + 1.2 * (j2 - 0.5), D.PT.DOWN + 0.5 * j1, lerp(D.PT.R[0], D.PT.R[1], j1), i * 0.317 + 0.83, 'bed', 'PT'));
  span(D.PO, (s, i, j1, j2) => put(s, road.edges(s)[1] + D.PO.OUT + 3 * (j2 - 0.5), D.PO.DOWN + 1.5 * j1, lerp(D.PO.R[0], D.PO.R[1], j1), i * 0.317 + 0.41, 'bed', 'PO'));
  span(D.FLOOR, (s, i, j1, j2) => {
    const n = bedLineN(s);
    put(s, n, D.FLOOR.DOWN, lerp(D.FLOOR.R[0], D.FLOOR.R[1], j1), i * 0.317 + 0.07, 'bed', 'F1');
    put(s + 3.7, n - D.FLOOR.BACK - 1.5 * (j1 - 0.5), D.FLOOR.BACK_DOWN + 0.8 * j2, lerp(D.FLOOR.BACK_R[0], D.FLOOR.BACK_R[1], j2), i * 0.317 + 0.49, 'bed', 'F2');
  });
  D.PIER.S.forEach((s, k) => D.PIER.LEVELS.forEach(([r, down, n], l) => {
    if (road.y(s) - down - r - PP.SEA_Y < D.PIER.LOW) return;        // no level whose middle would lie in the fog
    const j = fr(k * 0.618 + l * 0.271 + 0.37), side = D.PIER.SIDE * r;
    put(s + 4 * (j - 0.5), n, down, r, k * 0.317 + l * 0.21, 'pier', 'P' + l);
    if (l > 0) { put(s - side, n + 2, down + 0.45 * r, 0.8 * r, k * 0.317 + l * 0.21 + 0.37, 'pier', 'P' + l); put(s + side, n - 1, down + 0.55 * r, 0.75 * r, k * 0.317 + l * 0.21 + 0.71, 'pier', 'P' + l); }
  }));
  D.HEAP.forEach(([s, n, down, r], k) => put(s, n, down, r, k * 0.317 + 0.19, 'heap', 'H'));
  yield; let go = 0;
  for (const c of out) {
    if (++go % 60 === 0) yield;
    const m = footMost(c); if (!(m > 0)) continue;
    for (let k = 0; k < 16 && !c.dry; k++) { const a = k / 16 * TAU, kind = placeKind(road, c.x + Math.cos(a) * m, c.z + Math.sin(a) * m); if (kind !== 'sea' && kind !== 'road') c.dry = true; }
  }
  return (road._bed = out);
}
// the spectators' line: its side n at a station (straight between BED.LINE's typed places, held beyond its ends)
export function bedLineN(s) {
  const T = BED.LINE; if (s <= T[0][0]) return T[0][1];
  for (let i = 0; i + 1 < T.length; i++) if (s <= T[i + 1][0]) return lerp(T[i][1], T[i + 1][1], (s - T[i][0]) / (T[i + 1][0] - T[i][0]));
  return T[T.length - 1][1];
}
// ---------------------------------------------------------------------------------------------
// THE WATCHERS (plan-changes pb 2; the lead's P2: the second half was bare). Small sea birds stand in rows on the
// bed's lobes beside the road in the air, and here and there a big one (the sea's own pelican, standing folded); each
// is typed by its lobe: [metres along the road from the lobe's middle, metres to port of it]. A watcher's feet ride
// its lobe's own swell (watcherAt is the mirror of the vertex text): the ball's height at its place, SINK m in.
//   F1  the floor's near file: four small ones a lobe (one in WATCH.SKIP left out, by the lobe's own number)
//   F2  the far file: a big one on every third lobe, three small ones on the others
//   PT  beyond the port edge: two small ones on every other lobe, none beyond s WATCH.PT.S1
// None stands beyond s 866: the last 120 m (from s 881) are calm. TALL: the bird's height at size 1, legs and all;
// BIG_LEGS: the folded bird's legs (ROOST.LEGS, counted equal); a small one is the same bird at SIZE of it.
// -> [{ big, x, z, s, n, lobe, off, turn, size, phase, hop }]
// ---------------------------------------------------------------------------------------------
export const WATCH = {
  SINK: 0.1, TALL: 2.72, BIG_LEGS: 0.72, SIZE: [0.42, 0.56], HOP: [0.14, 0.34], HOP_W: 6.3, GATE_W: 0.5,
  F1: { DS: [-2.8, -0.93, 0.93, 2.8], DN: 1.3, SKIP: 0.14 },
  F2: { BIG: 3, DS: [-1.8, 0.2, 2.1], DN: 2.0, BIG_DN: 1.6, BIG_SIZE: [1.0, 1.25] },
  PT: { EVERY: 2, DS: [-1.0, 1.0], DN: 0.4, S1: 858 },
};
export function watchers(road) {
  if (road._watch) return road._watch;
  const W = WATCH, out = [], bed = bedCircles(road), idx = {};
  const stand = (c, ds, dn, big, k, toPort = 1) => {                 // toPort: 1 where the road lies to port of it, -1 to starboard
    const p = bankPoint(road, c.s + ds, c.n + dn), a = road.at(Math.min(c.s + ds, BANK.S_TABLE));
    const j = fr(k * 0.618 + c.own * 3.1), j2 = fr(k * 0.382 + c.own * 5.7 + 0.31);
    out.push({ big, x: p[0], z: p[2], s: c.s + ds, n: c.n + dn, lobe: c, off: Math.hypot(p[0] - c.x, p[2] - c.z),
      turn: Math.atan2(a.tz * toPort, -a.tx * toPort) + 0.9 * (j - 0.5), size: big ? lerp(W.F2.BIG_SIZE[0], W.F2.BIG_SIZE[1], j2) : lerp(W.SIZE[0], W.SIZE[1], j2),
      phase: fr(k * 0.7548 + c.own), hop: big ? 0 : lerp(W.HOP[0], W.HOP[1], j) });
  };
  for (const c of bed) {
    const i = (idx[c.kind] = (idx[c.kind] ?? -1) + 1), j = (q) => (fr(i * 0.618 + q * 0.271 + 0.13) - 0.5);
    if (c.kind === 'F1') W.F1.DS.forEach((ds, q) => { if (fr(i * 0.755 + q * 0.37 + 0.09) >= W.F1.SKIP) stand(c, ds + 0.5 * j(q), W.F1.DN + 0.8 * j(q + 4), false, i * 4 + q); });
    if (c.kind === 'F2') {
      if (i % W.F2.BIG === 1) stand(c, 0.4 * j(0), W.F2.BIG_DN, true, i);
      else W.F2.DS.forEach((ds, q) => stand(c, ds + 0.5 * j(q), W.F2.DN + 0.8 * j(q + 3), false, 100 + i * 3 + q));
    }
    if (c.kind === 'PT' && i % W.PT.EVERY === 1 && c.s <= W.PT.S1) W.PT.DS.forEach((ds, q) => stand(c, ds + 0.4 * j(q), W.PT.DN + 0.5 * j(q + 2), false, 200 + i * 2 + q, -1));
  }
  return (road._watch = out);
}
// MIRROR of the watcher's own law (the vertex text): its feet's height at a time, and the hop over it
export function watcherAt(w, time) {
  const q = bankAt(w.lobe, time), W = WATCH, gate = sstep(0.2, 0.6, Math.sin(time * W.GATE_W + TAU * w.phase * 3));
  return { feet: q.y + Math.sqrt(Math.max(q.r * q.r - w.off * w.off, 0)) - W.SINK * w.size, hop: w.hop * gate * Math.max(0, Math.sin(time * W.HOP_W + TAU * w.phase)) };
}
// the ball a watcher never leaves: [x, y, z, r] (its feet from the lobe's lowest to its highest, the hop and its height over them)
export function watcherMost(w) {
  const m = bankMost(w.lobe), W = WATCH, lo = m.yLo + Math.sqrt(Math.max(w.lobe.r * w.lobe.r * (1 - BANK.SW_R * (w.lobe.sw ?? 1)) ** 2 - w.off * w.off, 0)) - W.SINK * w.size;
  const hi = m.yHi + Math.sqrt(Math.max(m.r * m.r - w.off * w.off, 0)) + w.hop + W.TALL * w.size;
  return { x: w.x, z: w.z, y: (lo + hi) / 2, r: Math.max((hi - lo) / 2, 1.3 * w.size), lo, hi };
}

// ---------------------------------------------------------------------------------------------
// THE PENNANTS (plan-changes pb 3; P2). Strings of small pennants on short poles, a pole every PENNANT.SPAN m:
//   port   along the road's port edge, OUT m outside it, from s 604 (the land's last straight) to s 856
//   star   along the starboard verge from s 604 to the brink (beyond it the lens itself flies over that edge)
//   spec   behind the watchers of the floor: along BED.LINE, BACK m further off, the poles standing in the cloud
// Each line: [first station, last, the side n (a number, or a function of s), the pole's top over the road]. A string
// sags SAG m between two poles and carries N pennants, each W wide and DROP long, dealt the four flat colours in turn.
// None beyond s 856: from 204 m left a pole's top is never nearer the sun's middle than the count's (F) says, and
// the last 120 m are calm.  -> pennantPoles(road): [[{ s, n, x, y (the top), z, foot (the pole's own length) }, ...] a line]
// ---------------------------------------------------------------------------------------------
export const PENNANT = { SPAN: 12, SAG: 0.5, N: 6, W: 0.62, DROP: 0.78, OUT: 1.0, BACK: 1.6, WAVE: [0.2, 6.5],
  LINES: [['port', 604, 856, null, 3.1, 3.1], ['star', 604, 676, -11.3, 2.7, 2.7], ['spec', 690, 810, null, 2.1, 3.6]] };
export function pennantPoles(road) {
  const T = PENNANT, out = [];
  for (const [name, s0, s1, side, top, foot] of T.LINES) {
    const line = [], n = Math.round((s1 - s0) / T.SPAN);
    for (let i = 0; i <= n; i++) {
      const s = s0 + (s1 - s0) * i / n, nn = name === 'port' ? road.edges(s)[1] + T.OUT : name === 'spec' ? bedLineN(s) - T.BACK : side, p = road.point(s, nn, 0);
      line.push({ s, n: nn, x: p[0], y: road.y(s) + top, z: p[2], foot });
    }
    line.name = name; out.push(line);
  }
  return out;
}
// ---------------------------------------------------------------------------------------------
// THE BAY'S BOATS (plan-changes pb 3; P2: "a few boats on the sea below"). Between the land's end and the bed's floor
// lies a bay of open water to starboard of the road in the air; three boats ride there, typed [s, n, the turn from
// the road's own heading in degrees, 1 for red sails, the phase of the rocking]. No diver strikes to starboard and no
// sitter is dealt beyond s 640 (the plan's SEA), so the deal's birds never meet them (counted on every seed). The
// turns are typed so that each mainsail stands 30 degrees and more off every sight from the road's last straight
// (the sights lie 28 to 80 degrees to starboard of the heading): no needle.
// ---------------------------------------------------------------------------------------------
export const BAY_BOATS = [[697, -34, 220, 1, 0.13], [698, -52, 45, 0, 0.61], [700.5, -68, 215, 0, 0.37]];
export function bayBoats(road) {
  return BAY_BOATS.map(([s, n, deg, red, phase]) => { const p = road.point(s, n, 0); return { x: p[0], z: p[2], s, n, turn: road.at(s).psi + deg * D2R, red: !!red, phase }; });
}

// ---------------------------------------------------------------------------------------------
// THE GLIDERS' SEVEN LINES (54 birds in single file; typed, the same on every visit; on the world's time). Each line
// flies a closed SMOOTH course: eight to ten control points blended as a uniform cubic B-spline (the plan's coursePoint is
// the mirror of the shader's law). Points are typed [s, n, y] in the road's measure, or (the two harbour lines)
// [along, across, y] in the harbour's; y is the height in the world, or `h` over the road's own level where marked.
//   1, 2, 3  three long loops, one inside the other, beside the cliff road from behind the entry to the leaving: out
//            along the cliff's edge WITH the race (n +24, +29.5, +35; 3, 6.5 and 2 m over the road's level), so the lens
//            overtakes them slowly, and back AGAINST it further out to sea and over every diver's ring (y 68, 66, 64)
//   4        a wheel low over the harbour's near basin, 5 m over the water (the line that passes nearest the flown
//            line: 8 m beside it and 12 m under the lens; see WHAT THE DESIGN ASKED AND IS NOT BUILT below)
//   5        a long wheel low over the harbour to starboard, past the roost stack with 4 m of air and more
//   6        outside the harbour wall along its seaward face (n +27, 5 m over the road's level), back high over the sea
//   7        THE ESCORT: nine birds beside the road in the air on the last straight, out WITH the race 20 to 27 m to
//            port at the road's own level (under the lens's eye, so under the sun's disc; outside the cone to the
//            opening's rim), back against it 62 m out and higher (the count reads the sun and the opening for it)
// Lines part from one another by 5 m and more, by height where their courses cross in plan (the count reads every
// pair). Points are [s, n] at the line's own height h over the road's level, [s, n, y] at a height in the world, or
// (rel) [s, n, h over the road's level there].
// WHAT THE DESIGN ASKED AND IS NOT BUILT: one harbour line crossing UNDER the flown line. Between the wall's face and
// the first boat, and with the nine's strikes and corks laid along the line from 81 m on, the harbour leaves one
// passage 8 m wide under the line and no room for a loop to close through it; line 4 wheels beside it instead.
// ---------------------------------------------------------------------------------------------
export const GLIDE = {
  SPAN: SEA.HALF_SPAN, GAP: 9, SPEED: 14, SPEED_LOW: 8, PART: SEA.LINE_GAP,
  FLAP_T: 5, BEATS: 3, BEAT_SHARE: 0.42, FLAP: 0.55, DIHEDRAL: 0.12, TIP: 0.35,   // the wing: three slow beats, then a long glide
  LINES: [
    { name: 'cliff 1', n: 8, at: 0.00, gap: 16, h: 3, road: [[-110, 24], [8, 24], [126, 24], [245, 24], [282, 34, 30], [288, 104, 60], [245, 114, 68], [-110, 114, 68], [-173, 104, 60], [-167, 34, 30]] },
    { name: 'cliff 2', n: 8, at: 0.36, gap: 16, h: 6.5, road: [[-75, 29.5], [25, 29.5], [125, 29.5], [225, 29.5], [258, 38, 32], [262, 89, 60], [225, 98, 66], [-75, 98, 66], [-124, 89, 60], [-120, 38, 32]] },
    { name: 'cliff 3', n: 8, at: 0.71, gap: 16, h: 2, road: [[-40, 35], [42, 35], [124, 35], [205, 35], [232, 42, 30], [236, 75, 58], [205, 82, 64], [-40, 82, 64], [-78, 75, 58], [-76, 42, 30]] },
    { name: 'near basin', n: 7, at: 0.2, low: true, chord: [[48, -7.8, 5], [56.6, -11.4, 5], [60.2, -20, 5], [56.6, -28.6, 5], [48, -32.2, 5], [39.4, -28.6, 5], [35.8, -20, 5], [39.4, -11.4, 5]] },
    { name: 'stack wheel', n: 7, at: 0.55, low: true, chord: [[72, -26, 5], [86, -26, 5], [100, -27, 5], [108, -38, 5], [100, -49, 5], [86, -50, 5], [73, -49, 5], [63, -38, 5]] },
    { name: 'seaward', n: 7, at: 0.1, h: 5, road: [[378, 27], [404, 27], [432, 27], [458, 27], [474, 40, 24], [472, 62, 50], [450, 68, 62], [386, 68, 62], [368, 62, 50], [366, 40, 24]] },
    { name: 'escort', n: 9, at: 0.45, gap: 14, rel: true, road: [[735, 20, 1], [810, 22, 1], [885, 24.5, 1], [960, 27, 1], [989, 36, 4], [989, 55, 8], [960, 62, 9], [735, 62, 9], [708, 54, 7], [708, 28, 2]] },
  ],
};
// -> [{ name, pts: [[x, y, z], ...], n, at, speed, len, gap }]: the courses in the world, as the plan's coursePoint reads them
export function gliderLines(road) {
  if (road._lines) return road._lines;
  const out = GLIDE.LINES.map((ln) => {
    const pts = ln.road
      ? ln.road.map((q) => { const p = road.point(q[0], q[1], 0); return [p[0], q.length > 2 ? (ln.rel ? road.y(q[0]) + q[2] : q[2]) : road.y(q[0]) + ln.h, p[2]]; })
      : ln.chord.map((q) => { const p = chordPoint(road, q[0], q[1]); return [p[0], q[2], p[1]]; });
    const c = { name: ln.name, pts, n: ln.n, at: ln.at, speed: ln.low ? GLIDE.SPEED_LOW : GLIDE.SPEED, low: !!ln.low };
    c.len = courseLength(c); c.gap = (ln.gap || GLIDE.GAP) / c.len;
    return c;
  });
  return (road._lines = out);
}
// a place of a closed course (the plan's coursePoint, written again so that this file's mirrors need nothing more):
// u 0..1 round the loop; out = [x, y, z]; with `tan` the course's own direction there (not a unit)
export function courseAt(c, u, out = [0, 0, 0], tan = null) {
  const P = c.pts, n = P.length, f = fr(u) * n, i = Math.floor(f) % n, t = f - Math.floor(f), t2 = t * t, t3 = t2 * t;
  const w = [(1 - 3 * t + 3 * t2 - t3) / 6, (4 - 6 * t2 + 3 * t3) / 6, (1 + 3 * t + 3 * t2 - 3 * t3) / 6, t3 / 6];
  const d = [-(1 - t) * (1 - t) / 2, (3 * t2 - 4 * t) / 2, (-3 * t2 + 2 * t + 1) / 2, t2 / 2];
  for (let k = 0; k < 3; k++) {
    out[k] = 0; if (tan) tan[k] = 0;
    for (let j = 0; j < 4; j++) { const v = P[(i + j) % n][k]; out[k] += w[j] * v; if (tan) tan[k] += d[j] * v; }
  }
  return out;
}
export function courseLength(c, N = 512) {
  const a = [0, 0, 0], b = [0, 0, 0]; let len = 0; courseAt(c, 0, a);
  for (let j = 1; j <= N; j++) { courseAt(c, j / N, b); len += Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]); a[0] = b[0]; a[1] = b[1]; a[2] = b[2]; }
  return len;
}
// MIRROR: bird k of a line at a time: its share of the loop (the birds fly in single file, GAP m apart)
export const gliderU = (c, k, time) => fr(time * c.speed / c.len + c.at - k * c.gap);
// the least metres between two courses, middle to middle, over every pair of places (N readings a loop): -> { gap, a, b }
export function lineGap(ca, cb, N = 384) {
  const A = [], B = [], p = [0, 0, 0]; let gap = Infinity, ia = 0, ib = 0;
  for (let j = 0; j < N; j++) { courseAt(ca, j / N, p); A.push(p[0], p[1], p[2]); courseAt(cb, j / N, p); B.push(p[0], p[1], p[2]); }
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    const v = Math.hypot(A[i * 3] - B[j * 3], A[i * 3 + 1] - B[j * 3 + 1], A[i * 3 + 2] - B[j * 3 + 2]);
    if (v < gap) { gap = v; ia = i; ib = j; }
  }
  return { gap, a: [A[ia * 3], A[ia * 3 + 1], A[ia * 3 + 2]], b: [B[ib * 3], B[ib * 3 + 1], B[ib * 3 + 2]] };
}

// ---------------------------------------------------------------------------------------------
// THE AMBIENT DIVER'S CYCLE (on the world's time; the plan deals the row, this is its one unbroken course and the
// shader's law is this function written again). With u = fract(time / per + phase):
//   u under CIRCLE       on its ring, TURN radians round by its hand, coming to the ring's place nearest the strike
//   CIRCLE .. STRIKE     it tips, folds and stoops in a straight line in plan to the strike on the water
//   STRIKE .. UP         under the surface (one sixth of the cycle) to the place it comes up
//   UP .. SIT            up like a cork, and sits
//   SIT .. 1             a low run over the water, then the climb back to the place of the ring it began at
// In plan every place of it lies inside the triangle ring middle, strike, cork grown by the ring's radius (the plan's
// diverReach counts exactly that shape against the flown line).
// THE SPLASH rides the same row: from STRIKE on for SPLASH_T seconds, a plume, drops thrown up and foam running out,
// all inside the plan's SPLASH_R; the nine's (by the metres flown) is larger and sinks back over NINE_Q metres.
// ---------------------------------------------------------------------------------------------
export const DIVE = { CIRCLE: 0.30, STRIKE: 0.44, UP: 0.44 + 1 / 6, SIT: 0.70, TURN: 4.712389, DEEP: 3, SPAN: SEA.HALF_SPAN, FOLDED: NINE_LAW.FOLDED,
  SPLASH_T: 1.3, DROPS: 4, FOAM: 6, TALL: 5, OUT: 2.2, PLUME: 1.25, NINE_Q: 23, NINE_DROPS: 6, NINE_TALL: 8, NINE_OUT: 4.2, NINE_PLUME: 2.1,
  // THE CROWN (plan-changes pb 5): CROWN tongues of water stand round the strike, their feet from CROWN_R[0] to
  // CROWN_R[1] of the plume's figure out, each CROWN_TALL of it tall at its height and CROWN_W of it wide, leaning
  // LEAN outward; the foam is FOAM dashes of a ring that runs out to FOAM_R of the plan's splash radius, each dash
  // DASH of its own arc long (so the line is broken)
  CROWN: 6, CROWN_R: [0.3, 1.0], CROWN_TALL: 2.0, CROWN_W: 0.42, LEAN: 0.35, FOAM_R: 0.93, DASH: [0.35, 0.65], DROP: [0.1, 0.1, 1.7] };   // DROP: a tear's half width (of the plume, and metres more), its length over its width
// the furthest any part of a splash reaches from its strike, in plan (the count holds it under the plan's radius):
// a tongue's top and half its width, a drop and its radius, a dash's end
export const splashReach = (plume, out, reach) => Math.max(plume * (DIVE.CROWN_R[1] + DIVE.LEAN * DIVE.CROWN_TALL + DIVE.CROWN_W), out + (DIVE.DROP[0] * plume + DIVE.DROP[1]) * DIVE.DROP[2], DIVE.FOAM_R * reach * Math.hypot(1, Math.PI / DIVE.FOAM * DIVE.DASH[1]));
export function diverPlace(row, u, out = [0, 0, 0]) {
  const D = DIVE, R = row.ringR, H = row.ringY, a1 = Math.atan2(row.strike[1] - row.ring[1], row.strike[0] - row.ring[0]), a0 = a1 - row.hand * D.TURN;
  u = fr(u);
  if (u < D.CIRCLE) {
    const a = a0 + row.hand * D.TURN * (u / D.CIRCLE);
    out[0] = row.ring[0] + R * Math.cos(a); out[1] = H; out[2] = row.ring[1] + R * Math.sin(a); out.span = D.SPAN;
  } else if (u < D.STRIKE) {
    const t = (u - D.CIRCLE) / (D.STRIKE - D.CIRCLE), g = 0.35 * t + 0.65 * t * t, ex = row.ring[0] + R * Math.cos(a1), ez = row.ring[1] + R * Math.sin(a1);
    out[0] = lerp(ex, row.strike[0], g); out[1] = H * (1 - t * t); out[2] = lerp(ez, row.strike[1], g); out.span = lerp(D.SPAN, D.FOLDED, clamp(t * 2, 0, 1));
  } else if (u < D.UP) {
    const t = (u - D.STRIKE) / (D.UP - D.STRIKE), g = t * t * (3 - 2 * t);
    out[0] = lerp(row.strike[0], row.cork[0], g); out[2] = lerp(row.strike[1], row.cork[1], g);
    out[1] = -D.DEEP * sstep(0, 0.15, t) * (1 - sstep(0.85, 1, t)); out.span = D.FOLDED;
  } else if (u < D.SIT) {
    const t = (u - D.UP) / (D.SIT - D.UP);
    out[0] = row.cork[0]; out[2] = row.cork[1]; out[1] = 0.3 + 0.6 * Math.sin(Math.PI * t) * (1 - t); out.span = D.FOLDED;
  } else {
    const t = (u - D.SIT) / (1 - D.SIT), ex = row.ring[0] + R * Math.cos(a0), ez = row.ring[1] + R * Math.sin(a0);
    out[0] = lerp(row.cork[0], ex, t); out[2] = lerp(row.cork[1], ez, t); out[1] = lerp(0.3, H, t * t * (3 - 2 * t)); out.span = lerp(D.FOLDED, D.SPAN, clamp(t * 4, 0, 1));
  }
  return out;
}

// ---------------------------------------------------------------------------------------------
// THE ROOST: fourteen standing places on the stack's three ledges and its top. The stack is the land builder's (four
// drums, each LEDGE narrower than the one under it); this table is the same law as its own stackRoosts, written here
// so that the sea part and the count need nothing of the world file. -> [[x, y, z, bearing out from the axis], ...]
// ---------------------------------------------------------------------------------------------
export const ROOST = { DRUMS: 4, R_TOP: 3.5, LEDGE: 0.45, N: [5, 4, 2, 3], OUT: 0, LEGS: 0.72, R: 1.0 };
export function roostPlaces(road) {
  const c = chordPoint(road, STACK[0], STACK[1]), Q = ROOST, out = [];
  Q.N.forEach((n, i) => {
    const r1 = lerp(STACK_R, Q.R_TOP + Q.LEDGE * (Q.DRUMS - 1), (i + 1) / Q.DRUMS) - Q.LEDGE * i, top = i === Q.DRUMS - 1, r = top ? r1 * 0.55 : r1 - Q.LEDGE / 2;
    for (let k = 0; k < n; k++) { const a = (k + 0.37 * (i + 1)) / n * TAU; out.push([c[0] + Math.sin(a) * r, STACK_H * (i + 1) / Q.DRUMS, c[1] + Math.cos(a) * r, a]); }
  });
  return out;
}

// ---------------------------------------------------------------------------------------------
// WHICH DIVERS FLY (a law of places; no die): the plan deals a diver's row against the flown line, the land and the
// boats; the gliders' lines are typed here, after it. A row is LEFT OUT (and counted) where any place of its cycle
// over the water comes within KEEP.LINE m of any place of a glider's line (or, where the caller hands boats over as
// `more`, within KEEP.BOAT m of such a boat's own cylinder; the plan itself keeps every strike and cork off the boats,
// and the count reads every diver against every boat). keepDivers(rows, road, more) -> { rows, leftOut }; the answer
// is kept on the rows' own array, so the birds' maker and the splashes' take the same ones.
// ---------------------------------------------------------------------------------------------
export const KEEP = { LINE: 9.5, BOAT: 1.5, READ: 120, EVERY: 5, COARSE: 7 };   // COARSE: more than half the furthest a diver moves between two coarse readings (a thirtieth of its cycle)
const CELL = 64, cellKey = (x, z) => Math.floor(x / CELL) * 4096 + Math.floor(z / CELL);
export function linePlaces(road) {                                  // every EVERY m of every line, and the same places by cells of 64 m
  if (road._linePts) return road._linePts;
  const pts = [], cells = new Map();
  for (const c of gliderLines(road)) { const n = Math.ceil(c.len / KEEP.EVERY), p = [0, 0, 0];
    for (let j = 0; j < n; j++) { courseAt(c, j / n, p); const k = cellKey(p[0], p[2]); if (!cells.has(k)) cells.set(k, []); cells.get(k).push(pts.length); pts.push(p[0], p[1], p[2]); } }
  return (road._linePts = { pts, cells });
}
export function diverKeeps(row, road, more = null) {
  const LP = linePlaces(road), L = LP.pts, near = [], p = [0, 0, 0], K = KEEP, boats = more || [];
  // the whole cycle lies within `reach` of the strike in plan: only the lines' places inside that (and LINE more) can matter
  const reach = Math.max(Math.hypot(row.ring[0] - row.strike[0], row.ring[1] - row.strike[1]) + row.ringR, Math.hypot(row.cork[0] - row.strike[0], row.cork[1] - row.strike[1])) + K.LINE;
  for (let cx = -1; cx <= 1; cx++) for (let cz = -1; cz <= 1; cz++) {   // reach is under one cell: the nine cells about the strike hold every place that can matter
    const list = LP.cells.get(cellKey(row.strike[0] + cx * CELL, row.strike[1] + cz * CELL)); if (!list) continue;
    for (const i of list) { const dx = L[i] - row.strike[0], dz = L[i + 2] - row.strike[1]; if (dx * dx + dz * dz < reach * reach) near.push(i); }
  }
  const boatNear = boats.filter((b) => Math.hypot(b[0] - row.strike[0], b[1] - row.strike[1]) < reach + BOAT_R + SEA.HALF_SPAN);
  if (!near.length && !boatNear.length) return true;
  if (!boatNear.length) {                                          // a first coarse reading: where nothing comes within LINE + COARSE m the row stands
    let m = Infinity; const far = (K.LINE + K.COARSE) * (K.LINE + K.COARSE);
    for (let j = 0; j < K.READ && m >= far; j += 4) {
      diverPlace(row, j / K.READ, p); if (p[1] < -1) continue;
      for (const i of near) { const dx = L[i] - p[0], dy = L[i + 1] - p[1], dz = L[i + 2] - p[2], v = dx * dx + dy * dy + dz * dz; if (v < m) m = v; }
    }
    if (m >= far) return true;
  }
  for (let j = 0; j < K.READ; j++) {
    diverPlace(row, j / K.READ, p); if (p[1] < -1) continue;
    for (const i of near) { const dx = L[i] - p[0], dy = L[i + 1] - p[1], dz = L[i + 2] - p[2]; if (dx * dx + dy * dy + dz * dz < K.LINE * K.LINE) return false; }
    if (p[1] < BOAT_H + 1) for (const b of boatNear) if (Math.hypot(b[0] - p[0], b[1] - p[2]) < BOAT_R + p.span + K.BOAT) return false;
  }
  return true;
}
export function keepDivers(rows, road, more = null) {
  if (!rows) return { rows: [], leftOut: 0 };
  if (rows._keep) return rows._keep;
  const kept = rows.filter((r) => diverKeeps(r, road, more));
  return (rows._keep = { rows: kept, leftOut: rows.length - kept.length });
}

// ---------------------------------------------------------------------------------------------
// THE NINE'S RISE (a departure from the plan's ninePlace, told to the lead; LIFT 0 gives the plan's law back). By the
// plan's law alone the nine come down their glides nearly abreast and each stoops forward through the place the next
// arrives at: fourteen pairs pass through one another (bodies overlapping by up to 0.65 m; the count names the worst).
// Here every bird climbs on the ring, over its last 120 m of flight there, to LIFT m over the plan's course, and from
// the ring's edge comes down to it at one steady slope (0.3 m a metre flown) until the first half of its stoop is
// done: of two birds near one another on the way down the one further on in its course is always the lower. Ring in
// plan, tip point in plan, strike, cork, timing and the splash are the plan's own; the lens is never nearer than before.
//   nineLift(q) with q = d - (di - AHEAD); ninePlaceSea(i, d, track, out, course) = the plan's ninePlace, lifted
// ---------------------------------------------------------------------------------------------
export const NINE_SEA = { LIFT: 29, Q: [NINE_LAW.Q_GLIDE - 120, NINE_LAW.Q_GLIDE - 3, NINE_LAW.Q_TIP + 14] };
export const nineLift = (q) => NINE_SEA.LIFT * clamp(Math.min((q - NINE_SEA.Q[0]) / (NINE_SEA.Q[1] - NINE_SEA.Q[0]), (NINE_SEA.Q[2] - q) / (NINE_SEA.Q[2] - NINE_SEA.Q[1])), 0, 1);
export function ninePlaceSea(i, d, track, out = [0, 0, 0], course = null) {
  ninePlace(i, d, track, out, course);
  out[1] += nineLift(d - ((course ? course.di : 0) - NINE_LAW.AHEAD));
  return out;
}
