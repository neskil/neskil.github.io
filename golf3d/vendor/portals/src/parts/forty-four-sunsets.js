// Small Planet, Empty Chair, the hero set piece: a planet no bigger than a house (72 m across at a bird's scale) that is living
// ground and does not turn. One sun stands for the whole world, so the planet keeps a day side and a night side for ever,
// and each thing on it has its hour by where it stands: an empty wooden chair on the line where the day ends, facing the
// sun; a rose bush under a plain blown-glass globe in the first dark, with her folding screen and her tin can; one small
// volcano cone smoking in the day, one a red heart in the last dark, one cold; seedling shoots on the morning line; one-day
// flowers open on the day side and shut on the night side; every long shadow lying where it lies over the curve.
// The origin is the planet's CENTRE and +Y is its axis. The night side is never black: star band above, the Earth's lit
// air below and the planet's own fire light it. This file also carries what the world shares with it: the places and the
// rules of the route, the light uniforms, the lit material and small geometry helpers.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// ---------------------------------------------------------------- the places of this world (metres; Y is up)
// ONE SUN stands for the whole world, 5 degrees over the level, and one star dome about it. It is set here, once.
export const SUN = new THREE.Vector3(-0.704, 0.087, -0.704).normalize();
export const SUN_DISC = 20;   // degrees across, as it is drawn on the dome
export const HOME = { R: 36 };
const DEG = Math.PI / 180;
// THE ROUND of the home planet: degrees about its upright axis from the midnight meridian (the one turned away from the
// sun), in the hand the line flies (clockwise seen from above): 0 midnight, 90 the line where the turns come out into the
// day, 180 noon, 270 the line where they pass into the dark.
const MIDNIGHT = Math.atan2(-SUN.z, -SUN.x);
export function surfacePoint(round, lat, h = 0, out = new THREE.Vector3()) {
  const a = MIDNIGHT + round * DEG, l = lat * DEG, r = HOME.R + h;
  return out.set(r * Math.cos(l) * Math.cos(a), r * Math.sin(l), r * Math.cos(l) * Math.sin(a));
}
// the level heading of a clockwise turn about the axis at a place of the round
export const roundHeading = (round) => { const a = MIDNIGHT + round * DEG; return new THREE.Vector3(-Math.sin(a), 0, Math.cos(a)); };
export const roundOf = (p) => { let a = (Math.atan2(p.z, p.x) - MIDNIGHT) / DEG; a %= 360; return a < 0 ? a + 360 : a; };
// THE CROSSINGS (r8): the line flies the planet OVER ITS CROWN (the top of the globe, where the ground lies under the lens
// and the horizon is level), twice, on two bearings, with one wide swing between. Bearings are degrees LEFT of the sun's
// own bearing: the first crossing heads CROWN.first (so we come up out of the dark with the sun CROWN.first degrees to the
// right of the heading), the second CROWN.second (out of the day into the dark; the two lines stand 80 degrees apart). Over the crown the line stands CROWN.over metres over the mean skin and keeps the globe's
// own curve there; away from the crown it eases to one level, CROWN.level metres over the planet's centre (one bell
// curve of the metres from the axis, crossY). THE SWING: beyond the day side the line turns right in one round bend from
// the first crossing's line onto the second's, CROWN.far metres from the planet's axis at its farthest. THE SWING IS FLOWN
// HIGHER THAN THE CROWN (r9): from CROWN.flat metres past the crown the line climbs, and at its farthest place it stands
// CROWN.high metres over the planet's centre (the crown is HOME.R over it), so that from the swing the crown's country
// is seen from over it, its things inside the globe's disc; it comes down the same way onto the second crossing and is
// on the crossing's own curve again CROWN.flat metres before the crown (swingLift: so much of the climb at so many
// metres of line from the nearer crown, eased at both ends over a quarter of the way each). The things of
// the planet stand in the crown's country: the chair and the rose within 28 degrees of the crown, cones and seedbeds
// within 35 (THINGS: each thing's metres from the crown over the skin).
export const CROWN = { over: 7, level: 34, first: 22, second: 122, far: 104, high: 110, flat: 15, lead: 70, keep: 6.2 };
// a level heading so many degrees left of the sun's bearing, and its right hand
export const sunHeading = (psi) => { const a = Math.atan2(SUN.z, SUN.x) - psi * DEG; return new THREE.Vector3(Math.cos(a), 0, Math.sin(a)); };
export const rightOf = (h) => new THREE.Vector3(-h.z, 0, h.x);
export const crossHeading = (k) => sunHeading(k ? CROWN.second : CROWN.first);
const CROSS_H = HOME.R + CROWN.over - CROWN.level, CROSS_S2 = CROSS_H * 2 * (HOME.R + CROWN.over);
// the line's height over the planet's centre at so many metres from its axis (the crown's own curve at the top)
export const crossY = (s) => CROWN.level + CROSS_H * Math.exp(-s * s / CROSS_S2);
const ease01 = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
// a ramp from 0 to 1 that quickens over its first quarter, runs even, and slows over its last quarter
const ramp01 = (t) => { t = Math.min(1, Math.max(0, t)); return t < 0.25 ? t * t / 0.375 : t > 0.75 ? 1 - (1 - t) * (1 - t) / 0.375 : (t - 0.125) / 0.75; };
// a place of the crown's country: a bearing (degrees left of the sun's) and metres over the skin from the crown
export function crownDir(psi, rho, out = new THREE.Vector3()) { const h = sunHeading(psi), q = rho / HOME.R; return out.set(Math.sin(q) * h.x, Math.cos(q), Math.sin(q) * h.z); }
// how far a place of the skin lies aside of the nearer crossing's ground track, in metres (far from the crown: far)
export function trackAside(ux, uy, uz) {
  if (uy < 0.25) return 99; let best = 99;
  for (const r of CROSS_RIGHT) best = Math.min(best, Math.abs(Math.asin(Math.max(-1, Math.min(1, ux * r.x + uz * r.z)))) * HOME.R);
  return best;
}
const CROSS_RIGHT = [rightOf(crossHeading(0)), rightOf(crossHeading(1))];
// the start stands on the night side, START.far metres from the planet's centre on the first crossing's own line, the
// planet dead ahead and level (so the sun stands START.off degrees to the right of the globe); the line is level for
// START.level metres and has risen onto the crossing's curve START.rise metres before the crown
export const START = { far: 150, off: CROWN.first, y: 16, level: 60, rise: 30 };
// THE CHAIN (r9): CROWN.lead metres past the crown on the second crossing the line begins one LEFT bend (radius CHAIN.bend,
// 193 degrees) in the night behind the home planet, onto the heading on which the sun stands CHAIN.sun degrees to the
// left. THE LAMP PLANET STANDS AT THAT BEND'S OWN CENTRE, CHAIN.lamp.under metres under the bend's first place: the line
// goes round it at one distance (CHAIN.bend metres in plan: 5.5 of its radii). From the bend's end the line runs
// straight, sinking like a stair, past the home planet's dark side (which lies 93 m to the left of it at the nearest).
// The robe planet and the ledger planet are each met at a place of that run (run: metres from the bend's end; drop: the
// line's height there under the bend's first place) and stand by ONE rule from that place: so many metres to the RIGHT
// of the line (left is negative) and so many OVER it (under is negative); each is passed at 3.1 of its own radius from
// its centre, each on its own side. THE LARGER PLANET (120 m across) LIES UNDER THE LINE: the line crosses its top,
// CHAIN.larger.over metres over its mean ground there (r11: 20 m, more air than r10's 8.5, so that the ground under the
// line keeps its own relief), and the planet's axis leans CHAIN.larger.tilt degrees from the upright toward the place
// CHAIN.larger.toward degrees left of the line's heading (r11: 50 degrees toward 140, that is back and to the left), so
// that its one thing, which stands on the axis's end, stands on the planet's shoulder TOWARD THE COMING EYE: 35 m before
// the top and 30 m to the left of the line, 47 m under it (the nearest of the book, its desk and the stool, at every
// angle of the planet's turn, 13 m and more aside of the line's track: never under the line).
// From abeam to abeam 100 and 120 m.
export const CHAIN = { bend: 55, sun: 45, lamp: { R: 10, under: 5 }, robe: { run: 90, drop: 15, R: 16, right: 49, up: -8 }, ledger: { run: 190, drop: 34, R: 13, right: -40, up: -6 },
  larger: { run: 310, drop: 60, R: 60, over: 20, tilt: 50, toward: 140 } };
// THE EARTH is one body: a sphere of EARTH.R whose top is the well's sand, its centre straight under the well, which lies
// DIVE.under metres under the line's place abeam of the larger planet. The dive goes down from there on a slope of
// DIVE.slope degrees and levels out over DIVE.ease metres on one even bend (a parabola from the slope to the skin's own). The air's layer lies AIR.lo to AIR.hi metres over the Earth's skin.
export const EARTH = { R: 2200, cap: 470, duneAir: 0.3 }, DIVE = { slope: 36, under: 132, ease: 60, after: 52 }, AIR = { lo: 30, hi: 75 };
// THE DESERT, all in metres along the straight WAY (the line's own ground track over the desert) BEFORE the place of the
// way that lies abeam of the well (back), and over the Earth's SKIN (the sphere, so the line follows the globe's own
// curve): the garden's plot (its middle, how far its middle lies left of the way, its width across and length along the
// way, its floor over the skin, the line over that floor); the line levels out DESERT.lead metres before the garden's
// near wall; DESERT.down metres past the garden's far wall it is down on its low run, DESERT.over metres over the skin
// (4.6 to 7 m over the corridor's low sand). THE ARRIVAL (r8), BY RULES FROM THE WELL AND THE RING: THE LINE PASSES BESIDE
// THE WELL, which stands DESERT.pass metres to the LEFT of the way (so 8 m and more from every stone and timber of it);
// THE RING stands upright across the way DESERT.beyond metres past the well, DESERT.ring metres in radius, its foot
// DESERT.foot metres over the sand there; the line ends at its centre and its last DESERT.level metres are STRAIGHT AND
// LEVEL at that height (the height of the well's wheel), reached from the low run by one gentle rise over DESERT.rise
// metres before them. Nothing of the line passes over the well; the ring is never before it.
export const DESERT = { over: 9.75, lead: 14, down: 62, rise: 80, level: 60, ring: 11, beyond: 14, pass: 14, foot: 1.2, sandUp: 0.6, sand: 2.4, crest: 2.0, lane: [16, 62],
  garden: { back: 307, left: 6, w: 60, l: 90, floor: 2.5, over: 9, wall: 2.5 } };

// the route's points, entry to ring, every one from the rules above; also the places the world builds on (returned once)
let _route = null;
export function routePlan() {
  if (_route) return _route;
  const pts = [], V = (x, y, z) => new THREE.Vector3(x, y, z), push = (p) => pts.push([p.x, p.y, p.z]);
  // the first crossing's line from the start to the crown and on: level, then up onto the crossing's curve
  const c1 = crossHeading(0), c2 = crossHeading(1), h0 = c1, start = V(0, START.y, 0).addScaledVector(c1, -START.far);
  const y1 = (s) => crossY(s) + (START.y - CROWN.level) * (1 - ease01(-(START.far - START.level), -START.rise, s));
  // (the swing's own geometry first: its bend's radius, the length of each straight from the crown to the bend, and the
  // climb over the swing by the metres of line from the nearer crown)
  const apex = Math.acos(Math.max(-1, Math.min(1, -c1.dot(c2)))), rho = CROWN.far / (1 / Math.sin(apex / 2) + 1), tan = rho / Math.tan(apex / 2), r1 = rightOf(c1), sweep = Math.PI + apex;
  const half = tan + rho * sweep / 2, swingLift = (d) => (CROWN.high - CROWN.level) * ramp01((Math.min(d, 2 * half - d) - CROWN.flat) / (half - CROWN.flat));
  for (const s of [-150, -120, -90, -75, -60, -45, -30, -20, -10, 0]) push(V(c1.x * s, y1(s), c1.z * s));
  for (const s of [10, 20, 30, 40]) push(V(c1.x * s, crossY(s) + swingLift(s), c1.z * s));
  // THE SWING: one right bend from the first line onto the second, tangent to both, its farthest place CROWN.far metres out
  const loopC = V(c1.x * tan + r1.x * rho, 0, c1.z * tan + r1.z * rho), nArc = 12;
  const loopAt = (t) => { const q = sweep * t, x = loopC.x - r1.x * rho * Math.cos(q) + c1.x * rho * Math.sin(q), z = loopC.z - r1.z * rho * Math.cos(q) + c1.z * rho * Math.sin(q); return V(x, crossY(Math.hypot(x, z)) + swingLift(tan + rho * q), z); };
  for (let i = 0; i <= nArc; i++) push(loopAt(i / nArc));
  // the second crossing, out of the day into the dark, to the place where the line leaves for the chain
  for (const s of [-40, -30, -20, -10]) push(V(c2.x * s, crossY(s) + swingLift(-s), c2.z * s));
  for (const s of [0, 10, 20, 30, 50]) push(V(c2.x * s, crossY(s), c2.z * s));
  const e = V(c2.x * CROWN.lead, crossY(CROWN.lead), c2.z * CROWN.lead), hE = c2.clone(), rE = rightOf(hE);
  // the LEFT bend onto the chain's heading, round the lamp planet in the night (sinking a little): the angle is what
  // brings the sun CHAIN.sun degrees to the left of the heading, turning by the left
  const bendDeg = 360 - ((CROWN.second + CHAIN.sun) % 360 + 360) % 360, nB = Math.ceil(bendDeg / 20), lE = rE.clone().negate();
  push(e);
  for (let i = 1; i <= nB; i++) { const q = bendDeg * DEG * i / nB; push(e.clone().addScaledVector(hE, CHAIN.bend * Math.sin(q)).addScaledVector(lE, CHAIN.bend * (1 - Math.cos(q))).setY(e.y - 2 * i / nB)); }
  const c0 = V(pts[pts.length - 1][0], e.y, pts[pts.length - 1][2]), hC = sunHeading(-CHAIN.sun), lC = V(hC.z, 0, -hC.x);
  // the lamp planet stands at the bend's own centre (the line goes round it at one distance), CHAIN.lamp.under metres under
  // the bend's first place; the line's place abeam of it is the bend's middle
  const lampC = e.clone().addScaledVector(lE, CHAIN.bend).setY(e.y - CHAIN.lamp.under), qM = bendDeg * DEG / 2;
  const lampAt = e.clone().addScaledVector(hE, CHAIN.bend * Math.sin(qM)).addScaledVector(lE, CHAIN.bend * (1 - Math.cos(qM))).setY(e.y - 1);
  // the stair: the line's place abeam of each globe, and the midway places between them
  const on = (run, drop) => c0.clone().addScaledVector(hC, run).setY(e.y - drop), C = CHAIN, stair = [C.robe, C.ledger, C.larger];
  const robeAt = on(C.robe.run, C.robe.drop), ledgerAt = on(C.ledger.run, C.ledger.drop), largerAt = on(C.larger.run, C.larger.drop);
  for (let i = 0; i < stair.length; i++) { if (i) push(on((stair[i - 1].run + stair[i].run) / 2, (stair[i - 1].drop + stair[i].drop) / 2)); push(on(stair[i].run, stair[i].drop)); }
  // THE DESERT'S PLACES, back from the well: the Earth's fall at so many metres from its top, and a place of the line so
  // many metres before the well and over the skin
  const fall = (r) => EARTH.R - Math.sqrt(EARTH.R * EARTH.R - r * r), D = DESERT, G = D.garden, wellY = largerAt.y - DIVE.under;
  const gNear = G.back + G.l / 2, gFar = G.back - G.l / 2, gOver = G.floor + 0.6 + G.over, backLevel = gNear + D.lead;
  // the dive: straight down the slope from abeam of the larger planet, then one even bend over DIVE.ease metres of
  // ground onto the line's own course over the skin at the place where it levels out; that fixes how far on the well stands
  const sDive = -Math.tan(DIVE.slope * DEG), sSkin = backLevel / Math.sqrt(EARTH.R * EARTH.R - backLevel * backLevel), high = -(sDive + sSkin) / 2 * DIVE.ease;
  // (the stair goes on at its own slope for DIVE.after metres past abeam of the larger planet, and the dive begins there:
  // r9: the line crosses over that planet's top, CHAIN.larger.over metres over its mean ground, and goes down beyond it)
  const sStair = (C.larger.drop - C.ledger.drop) / (C.larger.run - C.ledger.run), diveAt = on(C.larger.run + DIVE.after, C.larger.drop + DIVE.after * sStair);
  const yLevel = wellY - fall(backLevel) + gOver, runD = (diveAt.y - (yLevel + high)) / -sDive;
  const well = diveAt.clone().addScaledVector(hC, runD + DIVE.ease + backLevel).setY(wellY);
  const skin = (back, over) => well.clone().addScaledVector(hC, -back).setY(wellY - fall(back) + over);
  const d1 = well.clone().addScaledVector(hC, -(backLevel + DIVE.ease)).setY(yLevel + high), level = skin(backLevel, gOver);
  push(largerAt.clone().lerp(diveAt, 0.5)); push(diveAt);
  for (const t of [0.2, 0.4, 0.6, 0.8]) push(diveAt.clone().lerp(d1, t));
  push(d1);
  for (const t of [0.25, 0.5, 0.75]) { const x = t * DIVE.ease; push(d1.clone().addScaledVector(hC, x).setY(d1.y + sDive * x + (sSkin - sDive) * x * x / (2 * DIVE.ease))); }
  push(level);
  // over the garden's whole length at one height over its floor, then down to the low run along the old wall
  push(skin(gNear, gOver)); push(skin(G.back, gOver)); push(skin(gFar, gOver));
  // (the descent eases out: a place 12 m before the low run begins stands half a metre over it; the low run is given at five places)
  // the low run begins DESERT.down metres past the garden's far wall and ends where the rise to the ring's height begins
  const ringBack = -D.beyond, ringY = wellY - fall(D.beyond) + D.sandUp + D.foot + D.ring, lowA = gFar - D.down, lowB = ringBack + D.level + D.rise;
  push(skin(lowA + 12, D.over + 0.5)); push(skin(lowA, D.over)); for (const t of [0.25, 0.5, 0.75]) push(skin(lowA + (lowB - lowA) * t, D.over));
  // the one gentle rise from the low run's end to the ring's height, eased at both ends; then the last DESERT.level metres
  // straight and level to the ring's centre, past the well that stands to the left of the way
  const cl = skin(lowB, D.over), lv = well.clone().addScaledVector(hC, -(ringBack + D.level)).setY(ringY), ring = well.clone().addScaledVector(hC, -ringBack).setY(ringY);
  for (const t of [0, 0.2, 0.4, 0.6, 0.8]) { const q = cl.clone().lerp(lv, t); q.y = cl.y + (ringY - cl.y) * t * t * (3 - 2 * t); push(q); }
  push(lv); for (const t of [1 / 3, 2 / 3, 1]) push(lv.clone().lerp(ring, t));
  // the well's own place: DESERT.pass metres left of the way, on the sand
  const wellAt = well.clone().addScaledVector(lC, D.pass);
  _route = { pts, start, h0, c1, c2, crown: V(0, HOME.R + CROWN.over, 0), far: loopAt(0.5), hC, lC, c0, e, robeAt, ledgerAt, lampAt, lampC, largerAt, diveAt, d1, level, well, ring, skin, fall, gNear, gFar, gOver, backLevel,
    gardenIn: skin(gNear, gOver), gardenOut: skin(gFar, gOver), lowIn: skin(lowA, D.over), lowBack: [lowA, lowB], climbAt: cl, wellAt, ringY, earth: V(well.x, well.y - EARTH.R, well.z) };
  return _route;
}
export const routePoints = () => routePlan().pts;

// ---------------------------------------------------------------- the chain's four globes, each by one rule from the line
// centre (so many metres right of and over the line's place abeam of it), radius, the axis it turns about and its crown
// (the axis's end, where its one thing stands). The robe planet and the ledger planet turn about the upright, so the
// one thing stands on top, on the limb against the sky as the globe comes; the larger one's axis LEANS CHAIN.larger.tilt
// degrees from the upright (toward CHAIN.larger.toward degrees left of the heading), so its one thing stands on a
// shoulder beside the line and never under it; the lamp planet's axis is the
// one square to the sun that stands nearest the upright, so the lamp on the equator of its turn goes round through its
// day and its night level with the line that goes round the planet.
let _chain = null;
export function chainPlan() {
  if (_chain) return _chain;
  const r = routePlan(), Y = new THREE.Vector3(0, 1, 0), mk = (name, at, c, period) => {
    const centre = at.clone().addScaledVector(r.lC, -c.right).addScaledVector(Y, c.up);
    return { name, at, R: c.R, centre, ax: Y.clone(), crown: centre.clone().addScaledVector(Y, c.R), period, pass: at.distanceTo(centre) / c.R };
  };
  const robe = mk('robe', r.robeAt, CHAIN.robe, 90), ledger = mk('ledger', r.ledgerAt, CHAIN.ledger, 70);
  // the larger planet under the line: its top CHAIN.larger.over metres under the line's place, its axis leaning
  const L = CHAIN.larger, lean = r.hC.clone().multiplyScalar(Math.cos(L.toward * DEG)).addScaledVector(r.lC, Math.sin(L.toward * DEG));
  const larger = { name: 'larger', at: r.largerAt, R: L.R, centre: r.largerAt.clone().addScaledVector(Y, -(L.R + L.over)), ax: Y.clone().multiplyScalar(Math.cos(L.tilt * DEG)).addScaledVector(lean, Math.sin(L.tilt * DEG)).normalize(), period: 200 };
  larger.crown = larger.centre.clone().addScaledVector(larger.ax, L.R); larger.pass = r.largerAt.distanceTo(larger.centre) / L.R;
  // the lamp planet at the bend's centre; its axis is the one square to the sun that stands nearest the upright
  const lamp = { name: 'lamp', at: r.lampAt, R: CHAIN.lamp.R, centre: r.lampC.clone(), ax: Y.clone().addScaledVector(SUN, -Y.dot(SUN)).normalize(), period: 60 };
  lamp.pass = r.lampAt.distanceTo(lamp.centre) / lamp.R; lamp.crown = lamp.centre.clone().addScaledVector(lamp.ax, lamp.R); lamp.look = lamp.centre;
  _chain = { robe, ledger, lamp, larger, list: [lamp, robe, ledger, larger] };
  return _chain;
}

// ---------------------------------------------------------------- places found ON THE LINE by tests in space (metres from the start)
// the line sampled once, every half metre (place and heading), for every test in space made along it
const _samples = new WeakMap();
export function lineSamples(path) {
  let S = _samples.get(path); if (S) return S;
  const step = 0.5, n = Math.floor(path.length / step) + 1, P = new Float32Array(n * 3), T = new Float32Array(n * 3), v = new THREE.Vector3();
  for (let i = 0; i < n; i++) { path.posAtDist(i * step, v); P[i * 3] = v.x; P[i * 3 + 1] = v.y; P[i * 3 + 2] = v.z; path.tangentAtDist(i * step, v); T[i * 3] = v.x; T[i * 3 + 1] = v.y; T[i * 3 + 2] = v.z; }
  S = { step, n, P, T }; _samples.set(path, S); return S;
}
export function routeMarks(path) {
  const r = routePlan(), LEN = path.length, p = new THREE.Vector3(), M = {}, S = lineSamples(path), ix = (d) => Math.min(S.n - 1, Math.max(0, Math.round(d / S.step)));
  const nearest = (q, from = 0, to = LEN) => { let best = 1e18, bi = ix(from); for (let i = ix(from); i <= ix(to); i++) { const dx = S.P[i * 3] - q.x, dy = S.P[i * 3 + 1] - q.y, dz = S.P[i * 3 + 2] - q.z, e = dx * dx + dy * dy + dz * dz; if (e < best) { best = e; bi = i; } } return bi * S.step; };
  const first = (test, from, to = LEN) => { for (let i = ix(from); i <= ix(to); i++) if (test(p.set(S.P[i * 3], S.P[i * 3 + 1], S.P[i * 3 + 2]), i * S.step)) return i * S.step; return to; };
  // the home planet: the two places over the crown, the swing's farthest place, where the line leaves for the chain
  M.dCross1 = nearest(r.crown, 0, START.far + 60); M.dFar = nearest(r.far, M.dCross1 + 40, M.dCross1 + 400); M.dCross2 = nearest(r.crown, M.dFar, M.dFar + 300);
  M.dMeet = M.dCross1 - 60; M.dLeave = nearest(r.e, M.dCross2, M.dCross2 + 80); M.dChain = nearest(r.c0, M.dLeave);
  // the standing edge of day: where the line's own place passes out of the planet's dark half, into it, and out again
  M.dOut1 = first((q) => q.dot(SUN) > 0, M.dMeet, M.dLeave); M.dIn = first((q) => q.dot(SUN) < 0, M.dOut1 + 1, M.dLeave); M.dOut2 = first((q) => q.dot(SUN) > 0, M.dIn + 1, M.dLeave);
  M.dLamp = nearest(r.lampAt, M.dLeave, M.dChain); M.dRobe = nearest(r.robeAt, M.dChain); M.dLedger = nearest(r.ledgerAt, M.dRobe); M.dLarger = nearest(r.largerAt, M.dLedger);
  M.dDive = nearest(r.diveAt, M.dLarger);
  // the air's layer, by the line's height over the Earth's skin
  const over = (q) => q.distanceTo(r.earth) - EARTH.R;
  M.dAirTop = first((q) => over(q) < AIR.hi, M.dDive); M.dAirFoot = first((q) => over(q) < AIR.lo, M.dAirTop);
  // the desert: where the line levels out, comes over the garden's near wall and its far wall, comes down onto its low
  // run, begins its rise to the ring's height, and ends at the ring past the well's far rim
  M.dLevel = nearest(r.level, M.dAirTop); M.dGardenIn = nearest(r.gardenIn, M.dLevel); M.dGardenOut = nearest(r.gardenOut, M.dGardenIn);
  M.dLow = nearest(r.lowIn, M.dGardenOut); M.dClimb = nearest(r.climbAt, M.dLow); M.dWell = LEN;
  return M;
}

// ---------------------------------------------------------------- THE PACE, by places only (metres a second before the engine scales it)
// THE LINE NEVER TURNS FASTER THAN PACE.turn degrees a second: wherever it bends (round the home planet, on the two
// bends, where the dive levels out, on the rise to the ring's height) its speed is that rate times the bend's own radius, found
// from the line itself over PACE.span metres and evened over PACE.even metres either way, wherever that is less than the free speed; so it slows as it closes in on
// the planet and quickens as it leaves, by place alone. Elsewhere it flies one free speed: slower within PACE.homeReach
// metres of the home planet's crown, within PACE.chainReach metres of the robe planet's and the ledger planet's crowns,
// within PACE.largerReach metres of the larger planet's, within PACE.reach metres of the lamp planet's centre, within
// PACE.bendReach metres of the two ends of the bend round the lamp planet (where the gaze goes to the side and comes
// back), over the garden of roses (within PACE.reach metres of its length under the line) and within PACE.wellReach
// metres of the well's beam; and faster where the line falls, by its own slope (PACE.fall times the sine of the slope:
// the dive).
// THE FREE SPEED AND THE CLOCK (r11): the free speed is SOUGHT between 8 and 80 m a second so that the pace's own sum of
// seconds is the duration. Where the bends and the slow places leave that sum longer even at 80, the free speed STANDS
// AT 80 and the sum stays what it is: on this line 66.28 s against a duration of 66 (the pace says its own sum on every
// build: paceAt.sum). (r12) WHAT IS FLOWN IS NOT THIS PACE TIMES ONE NUMBER. The engine (src/core/engine.js, makePace)
// reads the pace at 65 places evenly along the line, holds each between 0.35 and 2.5 of the mean speed, joins them by
// straight lines and scales that table of its own by ONE factor so that the table's sum is the duration. (r13) On
// this line 11 of the 65 places (0 to 64) ask more than 2.5. FIVE lie in the dive (places 42 to 46, u 0.656 to 0.719:
// the fall term asks 2.87 to 4.76 of the mean; the engine flies 0.53 to 0.87 of the pace's own speed at those places
// and down to 0.47 of it just before the first of them). SIX lie on the last run to the well (places 56 to 61, u
// 0.875 to 0.953: the pace asks 2.52 to 3.00 of the mean, the free speed itself; the free speed's bound of 80 m a
// second is 3.0 of the mean and stands above the engine's hold of 2.5 of it, 66.7 m a second, so on the last run the
// engine cannot fly the free speed and flies 0.84 to 0.995 of the pace). The one factor over the held table is 1.003,
// so at the other 54 places the flight is three parts in a thousand faster than the pace, and between two of the 65
// places it follows their straight line, not the pace's own bends: between two places that are not held that line
// stands 0.78 to 1.26 of the pace. The duration is kept by the engine; the pace's own sum is the pace's alone.
export const HAND = 60, PACE = { turn: 26.4, swing: 18, off: 68, homeReach: 60, chainIn: 30, span: 20, even: 12, lead: 44, reach: 70, chainReach: 150, largerReach: 150, wellReach: 130, fall: 1.0, bendReach: 90, slow: { home: 0.45, robe: 0.85, ledger: 0.8, lamp: 0.45, bendIn: 0.5, bendOut: 0.7, larger: 0.5, garden: 0.58, well: 0.36 } };
export function makePace(path, M, duration = 50) {
  const r = routePlan(), ch = chainPlan(), LEN = path.length, p = new THREE.Vector3(), q3 = new THREE.Vector3(), ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const beam = new THREE.Vector3(r.wellAt.x, r.wellAt.y + 13, r.wellAt.z), gA = r.gardenIn, gB = r.gardenOut, gAB = gB.clone().sub(gA), gL2 = gAB.lengthSq();
  const near = [[r.crown, PACE.slow.home, PACE.homeReach], [ch.robe.crown, PACE.slow.robe, PACE.chainReach], [ch.ledger.crown, PACE.slow.ledger, PACE.chainReach], [ch.lamp.centre, PACE.slow.lamp, PACE.reach], [r.e, PACE.slow.bendIn, PACE.bendReach], [r.c0, PACE.slow.bendOut, PACE.bendReach], [ch.larger.crown, PACE.slow.larger, PACE.largerReach], [beam, PACE.slow.well, PACE.wellReach]];
  const N = Math.ceil(LEN / 2), turnV = new Float32Array(N + 1), slow = new Float32Array(N + 1);
  const S = lineSamples(path);
  for (let i = 0; i <= N; i++) {
    const j = Math.min(S.n - 1, Math.round(i / N * LEN / S.step)); p.set(S.P[j * 3], S.P[j * 3 + 1], S.P[j * 3 + 2]);
    // the bend's radius here: the angle between the line's directions PACE.span metres before and after, over that length
    { const w = Math.round(PACE.span / S.step), a = Math.max(0, j - w) * 3, b = Math.min(S.n - 1, j + w) * 3, len = (b - a) / 3 * S.step;
      const cs = Math.min(1, S.T[a] * S.T[b] + S.T[a + 1] * S.T[b + 1] + S.T[a + 2] * S.T[b + 2]);
      // (on the swing, while the planet's centre bears more than PACE.off degrees off the heading, the gaze turns toward it as
      // the line turns: the line itself may turn only PACE.swing degrees a second there; the same where the bend round the
      // lamp planet begins and ends (within PACE.chainIn metres), where the gaze goes to the side and comes back)
      const dd = i / N * LEN, hl = Math.hypot(S.T[j * 3], S.T[j * 3 + 2]) * Math.hypot(p.x, p.z) || 1, swing = (dd > M.dCross1 && dd < M.dCross2 && (-(p.x * S.T[j * 3] + p.z * S.T[j * 3 + 2]) / hl) < Math.cos(PACE.off * DEG)) || (dd > M.dLeave - 2 * PACE.chainIn && dd < M.dLeave + PACE.chainIn) || (dd > M.dChain - PACE.chainIn && dd < M.dChain + PACE.chainIn);
      turnV[i] = (swing ? PACE.swing : PACE.turn) * DEG * len / Math.max(Math.acos(cs), 1e-4); }
    let k = 1; for (const [q, s, reach] of near) k *= 1 - s * (1 - ss(0, reach, p.distanceTo(q)));
    // the garden: the distance to the stretch of the line that lies over it
    const t = Math.min(1, Math.max(0, q3.copy(p).sub(gA).dot(gAB) / gL2)); k *= 1 - PACE.slow.garden * (1 - ss(0, PACE.reach, q3.copy(gA).addScaledVector(gAB, t).distanceTo(p)));
    slow[i] = k * (1 + PACE.fall * Math.max(0, -S.T[j * 3 + 1]));
  }
  // (evened: the least within PACE.even metres either way, then the mean of that over the same reach)
  { const w = Math.round(PACE.even / (LEN / N)), raw = turnV.slice(), low = new Float32Array(N + 1);
    for (let i = 0; i <= N; i++) { let m = 200; for (let k = Math.max(0, i - w); k <= Math.min(N, i + w); k++) m = Math.min(m, raw[k]); low[i] = m; }
    for (let i = 0; i <= N; i++) { let sum = 0, n = 0; for (let k = Math.max(0, i - w); k <= Math.min(N, i + w); k++) { sum += low[k]; n++; } turnV[i] = sum / n; } }
  // (the engine eases its speed toward the pace, so it runs late: a bend's limit holds from PACE.lead metres before the bend)
  { const w = Math.round(PACE.lead / (LEN / N)); for (let i = 0; i <= N; i++) { let m = turnV[i]; for (let k = i + 1; k <= Math.min(N, i + w); k++) m = Math.min(m, turnV[k]); turnV[i] = m; } }
  // the smaller of the two, with a soft shoulder of 3 m a second
  const vAt = (i, free) => { const a = free * slow[i], b = turnV[i], h = Math.min(1, Math.max(0, 0.5 + 0.5 * (b - a) / 3)); return b + (a - b) * h - 3 * h * (1 - h); };
  const seconds = (free) => { let t = 0; for (let i = 0; i < N; i++) t += (LEN / N) * 2 / (vAt(i, free) + vAt(i + 1, free)); return t; };
  let lo = 8, hi = 80; for (let k = 0; k < 40; k++) { const mid = (lo + hi) / 2; if (seconds(mid) > duration) lo = mid; else hi = mid; }
  const free = (lo + hi) / 2, mean = LEN / duration;
  const speedAt = (d) => { const x = Math.min(N, Math.max(0, d / LEN * N)), i = Math.min(N - 1, Math.floor(x)); return vAt(i, free) + (vAt(i + 1, free) - vAt(i, free)) * (x - i); };
  const paceAt = (d) => speedAt(d) / mean;
  paceAt.free = free; paceAt.speed = speedAt; paceAt.sum = seconds(free);
  return paceAt;
}

// ---------------------------------------------------------------- shared light: the one sun, a two-colour fill, the air's haze
// uEarth: the Earth's centre and the radius of the top of its air; haze lies only on the part of a sight line inside it.
export function makeEnv() {
  const r = routePlan();
  return {
    uSun: { value: SUN.clone() },
    uSunCol: { value: new THREE.Color(1.0, 0.56, 0.2).multiplyScalar(1.5) },
    uSkyCol: { value: new THREE.Color(0.075, 0.105, 0.29) },
    uGndCol: { value: new THREE.Color(0.05, 0.035, 0.05) },
    uRimCol: { value: new THREE.Color(0.10, 0.13, 0.26) },
    uFog: { value: new THREE.Vector4(0.82, 0.5, 0.26, 0.0016) },
    uEarth: { value: new THREE.Vector4(r.earth.x, r.earth.y, r.earth.z, EARTH.R + (AIR.lo + AIR.hi) / 2) },
    uTime: { value: 0 },
  };
}

export const GLSL_NOISE = /* glsl */`
float h31(vec3 p){ p = fract(p * vec3(.1031, .1030, .0973)); p += dot(p, p.yzx + 33.33); return fract((p.x + p.y) * p.z); }
float h21(vec2 p){ vec3 q = fract(vec3(p.xyx) * .1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float vn3(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(mix(h31(i), h31(i + vec3(1,0,0)), f.x), mix(h31(i + vec3(0,1,0)), h31(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(h31(i + vec3(0,0,1)), h31(i + vec3(1,0,1)), f.x), mix(h31(i + vec3(0,1,1)), h31(i + vec3(1,1,1)), f.x), f.y), f.z); }
float fb3(vec3 p){ return .5 * vn3(p) + .25 * vn3(p * 2.03 + 7.1) + .125 * vn3(p * 4.01 + 3.7) + .0625 * vn3(p * 8.1 + 1.3); }
`;

// the air's haze between two places: the metres of the sight line that lie inside the Earth's air, and the haze they make
export const GLSL_AIR = /* glsl */`
uniform vec4 uFog; uniform vec4 uEarth;
float airPath(vec3 a, vec3 b){
  vec3 d = b - a; float L = length(d); d = d / max(L, 1e-4);
  vec3 oc = a - uEarth.xyz; float bq = dot(oc, d), disc = bq * bq - (dot(oc, oc) - uEarth.w * uEarth.w);
  float s = sqrt(max(disc, 0.)), t0 = max(-bq - s, 0.), t1 = min(-bq + s, L);
  return step(0., disc) * max(t1 - t0, 0.);
}
float hazeOf(vec3 a, vec3 b){ float q = airPath(a, b) * uFog.w; return 1. - exp(-q * q); }
vec3 fogged(vec3 c, vec3 wp){ return mix(c, uFog.rgb, hazeOf(cameraPosition, wp)); }
`;

// uOcc: the globe a thing stands on (centre, radius; radius 0 = none). sunVis: how much of the sun a point sees past it.
export const GLSL_LIGHT = GLSL_AIR + /* glsl */`
uniform vec3 uSun, uSunCol, uSkyCol, uGndCol, uRimCol; uniform vec4 uOcc; uniform float uTime;
float sunVis(vec3 wp){
  vec3 rel = wp - uOcc.xyz; float b = dot(rel, uSun), h = sqrt(max(dot(rel, rel) - b * b, 0.));
  float w = .25 * max(-b, 0.) + .4;
  return mix(1., smoothstep(-w, w, h - uOcc.w + 2. * max(b, 0.)), step(.001, uOcc.w));
}
vec3 upAt(vec3 wp){ vec3 r = wp - uOcc.xyz; return mix(vec3(0., 1., 0.), r / max(length(r), 1e-3), step(.001, uOcc.w)); }
vec3 nightAlb(vec3 a){ return mix(a, vec3(dot(a, vec3(.3, .5, .2))), .65); }
`;

// ---------------------------------------------------------------- the lit material for every built thing (vertex colours)
// attributes: position, normal, color, aGlow (emitted share of the colour), aSway (metres of tremble along the normal)
export function makeLit(env, o = {}) {
  const lampA = o.lampA || [new THREE.Vector4(0, 0, 0, 0), new THREE.Vector4(0, 0, 0, 0)];
  return new THREE.ShaderMaterial({
    side: o.side ?? THREE.FrontSide, transparent: !!o.show,
    uniforms: { ...env, uShow: o.show || { value: 1 }, uOcc: { value: o.occ || new THREE.Vector4(0, 0, 0, 0) }, uLampA: { value: lampA }, uLampCol: { value: o.lampCol || new THREE.Color(0, 0, 0) },
      uWrap: { value: o.wrap ?? 0.12 }, uGild: { value: o.gild ?? 0.5 } },
    vertexShader: /* glsl */`
      attribute vec3 color; attribute float aGlow, aSway;
      uniform float uTime;
      varying vec3 vW, vN, vC; varying float vG;
      void main(){
        #ifdef USE_INSTANCING
          mat4 m = modelMatrix * instanceMatrix;
        #else
          mat4 m = modelMatrix;
        #endif
        vec3 p = position + normal * aSway * sin(uTime * 2.6 + position.x * 1.9 + position.y * 2.3 + position.z * 1.3);
        vec4 w = m * vec4(p, 1.);
        vW = w.xyz; vN = mat3(m) * normal; vC = color; vG = aGlow;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: GLSL_LIGHT + /* glsl */`
      uniform vec4 uLampA[2]; uniform vec3 uLampCol; uniform float uWrap, uGild, uShow;
      varying vec3 vW, vN, vC; varying float vG;
      void main(){
        vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n;
        vec3 v = normalize(cameraPosition - vW);
        float vis = sunVis(vW), ndl = dot(n, uSun);
        float dif = clamp((ndl + uWrap) / (1. + uWrap), 0., 1.);
        vec3 amb = mix(uGndCol, uSkyCol, .5 + .5 * dot(n, upAt(vW)));
        vec3 c = vC * uSunCol * dif * vis + nightAlb(vC) * amb * 1.5;
        for (int i = 0; i < 2; i++) {
          vec3 d = uLampA[i].xyz - vW; float q = dot(d, d);
          c += vC * uLampCol * uLampA[i].w / (1. + q * .3) * (.35 + .65 * clamp(dot(n, d / sqrt(max(q, 1e-4))), 0., 1.));
        }
        float rim = 1. - clamp(dot(n, v), 0., 1.); rim = rim * rim * rim;
        float toSun = clamp(-dot(v, uSun), 0., 1.);
        c += vC * uRimCol * rim + uSunCol * (.25 + .75 * vC) * rim * vis * toSun * toSun * uGild;
        c += vC * vG;
        gl_FragColor = vec4(fogged(c, vW), uShow);
      }`,
  });
}

const _col = new THREE.Color();
export const lin = (hex) => { _col.set(hex); return [_col.r, _col.g, _col.b]; };
// a geometry made ready to merge: not indexed, with colour, glow and sway on every vertex. o: { m: Matrix4, glow, sway, shade: fn(x,y,z)->factor }
export function paint(geo, color, o = {}) {
  let g = geo.index ? geo.toNonIndexed() : geo;
  if (o.m) g.applyMatrix4(o.m);
  if (!g.attributes.normal) g.computeVertexNormals();
  const n = g.attributes.position.count, P = g.attributes.position, c = Array.isArray(color) ? color : lin(color);
  const col = new Float32Array(n * 3), glow = new Float32Array(n), sway = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const k = o.shade ? o.shade(P.getX(i), P.getY(i), P.getZ(i)) : 1;
    col[i * 3] = c[0] * k; col[i * 3 + 1] = c[1] * k; col[i * 3 + 2] = c[2] * k; glow[i] = o.glow || 0; sway[i] = o.sway || 0;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', P); out.setAttribute('normal', g.attributes.normal);
  out.setAttribute('color', new THREE.BufferAttribute(col, 3)); out.setAttribute('aGlow', new THREE.BufferAttribute(glow, 1)); out.setAttribute('aSway', new THREE.BufferAttribute(sway, 1));
  return out;
}
export const merge = (list) => mergeGeometries(list, false);
const _e = new THREE.Euler(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _p = new THREE.Vector3();
// a placing matrix: position, rotation (radians, XYZ order), scale
export function xf(px = 0, py = 0, pz = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) {
  return new THREE.Matrix4().compose(_p.set(px, py, pz), _q.setFromEuler(_e.set(rx, ry, rz)), _s.set(sx, sy, sz));
}
// the frame of a thing that stands on a globe: +Y along the radius through `at`, +Z turned by `yaw` from the direction of flight
export function standAt(at, yaw = 0, centre = null, lean = 0, leanDir = 0) {
  const up = new THREE.Vector3().copy(at); if (centre) up.sub(centre); up.normalize();
  const fwd = new THREE.Vector3(0, 1, 0).cross(up); if (fwd.lengthSq() < 1e-6) fwd.set(1, 0, 0); fwd.normalize();
  const side = new THREE.Vector3().crossVectors(up, fwd).normalize();
  const m = new THREE.Matrix4().makeBasis(side, up, fwd).setPosition(at);
  const r = new THREE.Matrix4().makeRotationY(yaw);
  if (lean) r.premultiply(new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(Math.cos(leanDir), 0, Math.sin(leanDir)), lean));
  return m.multiply(r);
}

// ---------------------------------------------------------------- long shadows: eight tapered capsules, tested along the sun ray
const NCAP = 8;
const GLSL_CAPS = /* glsl */`
uniform vec4 uCapA[${NCAP}]; uniform vec4 uCapB[${NCAP}]; uniform float uCapK[${NCAP}];
float capShade(vec3 p){
  float sh = 1.;
  for (int i = 0; i < ${NCAP}; i++) {
    vec3 a = uCapA[i].xyz, ab = uCapB[i].xyz - a, ap = p - a;
    float d1 = dot(ab, ab), d2 = dot(ab, uSun), d3 = dot(ab, ap), d4 = dot(uSun, ap);
    float u = clamp((d3 - d2 * d4) / max(d1 - d2 * d2, 1e-4), 0., 1.);
    float t = max(d2 * u - d4, 0.);
    u = clamp((d3 + t * d2) / max(d1, 1e-4), 0., 1.);
    float d = length(ap + t * uSun - u * ab), r = mix(uCapA[i].w, uCapB[i].w, u), w = .045 * t + .2;
    sh *= 1. - uCapK[i] * (1. - smoothstep(r - w, r + w, d)) / (1. + t * .012);
  }
  return sh;
}
`;

// WHERE EACH THING OF THE HOME PLANET STANDS, by the planet's own geography (r8). The sun stands 5 degrees over the level,
// so the standing EDGE OF DAY passes 5 degrees from the crown: the crown is the country of sunset. The two crossings' four
// rays part that country into four fields, and each thing has its hour by the field it stands in:
//  the CHAIR stands ON the edge of day, THINGS.chair.aside metres to the sun's hand of the first crossing's track;
//  the ROSE stands in the dark field between the way we come up and the way we go down (the first dark, where the sun
//   still catches the top of her glass), in the middle of that field;
//  the cone that glows stands in the dark beyond the chair; the cone that smokes in the day field between the two tracks'
//   sunward rays; the cold cone in the day of the fourth field; a seedbed at the edge of day in the fourth field, one in the
//   low light beyond the chair, one on the crown's own day ground between the tracks.
// A field is named by its two rays (degrees left of the sun's bearing); a thing's own stream draws its share of the way
// across its field (frac) and its metres from the crown (rho): two draws a deal, always both. EACH THING'S FIELD, ITS frac
// AND ITS rho ARE TYPED BELOW FOR THAT THING AS ITS PLACE BY THIS GEOGRAPHY (r9, said plainly: the typed stands do keep the
// things apart, and no thing moved for saying so). Why each:
//  chair: on the edge of day because it is the chair of the sunsets; 8.2 to 9.6 m aside of the first track so that it
//   stands on that crossing's horizon against the sun and (6.5 m tall) keeps CROWN.keep from the line;
//  rose: the middle tenth (0.45 to 0.55) of the dark field between the way up and the way down, 16 to 17.4 m out: the first
//   dark, where the sun still catches the top of her glass; the middle keeps her glass (half 4.5 m) clear of both tracks;
//  coneNight: 0.2 to 0.33 of the dark field beyond the chair, 19 to 21.3 m out: a red heart is seen only in the night, and
//   that share lies behind the chair as the first crossing sees it;
//  coneDay: the middle (0.3 to 0.7) of the day field between the tracks' sunward rays, 13 to 19 m out: its smoke stands in the sun;
//  coneCold: 0.25 to 0.6 of the fourth field, 12 to 18 m out: the day ground left to it, clear of both tracks;
//  bed1: the fourth field's half toward the edge of day, 7 to 21.5 m out; bed2: the dark field's far half, beyond the glowing
//   cone's share, 12 to 21.5 m out; bed3: anywhere in the smoking cone's field, 2 to 21.5 m out: dug ground lies flat under
//   the line's 7 m and may lie wherever its field has room.
// BESIDES THE TYPED STANDS feet are kept apart by a test in metres between the dealt feet (THINGS.apart of clear ground
// between two footprints); a standing thing keeps CROWN.keep metres from the line (its top against the line's height over
// the crown, its half breadth against each crossing's track; a seedbed lies flat under the line's 7 m and needs none);
// and a deal again from the thing's own stream, THINGS.deals deals at the most. A THING THAT FINDS NO ROOM IS NOT STOOD.
const F1 = CROWN.first, F2 = CROWN.second;
export const THINGS = {
  apart: 1.2, deals: 40, span: HOME.R * SUN_DISC * DEG,
  chair: { on: true, aside: [8.2, 9.6], tall: 6.5, half: 1.75 },
  rose: { field: [F2, F1 + 180], frac: [0.45, 0.55], rho: [16, 17.4], tall: 4.4, half: 4.5 },
  coneNight: { field: [F1 + 180, F2 + 180], frac: [0.2, 0.33], rho: [19, 21.3], half: 1.15 },
  coneDay: { field: [F2 + 180, F1 + 360], frac: [0.3, 0.7], rho: [13, 19], half: 1.15 },
  coneCold: { field: [F1, F2], frac: [0.25, 0.6], rho: [12, 18], half: 1.15 },
  bed1: { field: [F1, F2], frac: [0.5, 1.0], rho: [7, 21.5] }, bed2: { field: [F1 + 180, F2 + 180], frac: [0.5, 1.0], rho: [12, 21.5] }, bed3: { field: [F2 + 180, F1 + 360], frac: [0, 1], rho: [2, 21.5] },
  // a seedbed: so wide and so long, dug so deep, the dug earth thrown up in a lip so high
  bed: { w: 6, l: 9, dig: 0.24, lip: 0.3 }, apron: 2.4, pad: 3, under: 0.3,
  // THE RELIEF: knolls and hollows up to about RELIEF.full metres over and under the mean skin; under the crossings' ground
  // tracks they are lower (RELIEF.low within RELIEF.near metres aside, full from RELIEF.far metres), so the lens keeps its room
  relief: { low: 0.35, full: 1.3, near: 4, far: 9, wide: 0.1, fine: 0.27 },
};
// the home planet's forks, one stream to a thing, and the layout they deal (also replayed without a build: homeLayout)
export function homeForks(core, seed) {
  const fork = (name) => core.makeRng(core.hashSeed('forty-four-sunsets:' + name + ':' + seed));
  return { coneNight: fork('home-cone-night'), coneDay: fork('home-cone-day'), coneCold: fork('home-cone-cold'), chair: fork('home-chair'), rose: fork('home-rose-place'), bed: [fork('home-bed-1'), fork('home-bed-2'), fork('home-bed-3')] };
}
export function homeLayout(core, seed) { return layoutHome(homeForks(core, seed)); }
function layoutHome(forks) {
  const B = THINGS.bed, placed = [], c1 = crossHeading(0), rights = [rightOf(crossHeading(0)), rightOf(crossHeading(1))];
  const stand = (t, rng) => {
    const qa = rng(), qb = rng(), dir = new THREE.Vector3();
    if (t.on) {
      // on the edge of day, so many metres to the right (the sun's hand) of the first crossing's track: found along the track
      const a = t.aside[0] + (t.aside[1] - t.aside[0]) * qa, at = (b) => dir.set(c1.x * b + rights[0].x * a, 0, c1.z * b + rights[0].z * a).setY(Math.sqrt(HOME.R * HOME.R - a * a - b * b)).normalize();
      let lo = -30, hi = 20; for (let k = 0; k < 30; k++) { const mid = (lo + hi) / 2; if (at(mid).dot(SUN) < 0) lo = mid; else hi = mid; } at((lo + hi) / 2);
    } else crownDir(t.field[0] + (t.field[1] - t.field[0]) * (t.frac[0] + (t.frac[1] - t.frac[0]) * qa), t.rho[0] + (t.rho[1] - t.rho[0]) * qb, dir);
    const rho = Math.acos(Math.min(1, dir.y)) * HOME.R;
    return { dir, rho, deg: rho / HOME.R / DEG, lat: 90 - rho / HOME.R / DEG, sun: dir.dot(SUN) };
  };
  const cone = (t, rng) => { const c = { ...stand(t, rng), h: rng.range(3.2, 4), lean: rng.range(0.02, 0.1), leanDir: rng.range(0, Math.PI * 2), spin: rng.range(0, Math.PI * 2) }; c.rad = c.h * 0.7 + THINGS.apron; c.tall = c.h; c.half = t.half; return c; };
  // the clear ground between a dealt foot and those that already stand (metres over the skin between the two footprints)
  const room = (s) => { let m = 1e9; for (const o of placed) m = Math.min(m, Math.acos(Math.min(1, s.dir.dot(o.dir))) * HOME.R - s.rad - o.rad); return m; };
  // a standing thing's room to the line: its top under the line's height over the crown, its half breadth aside of each track
  const toLine = (s) => { if (!s.tall) return 99; const v = Math.max(0, CROWN.over - s.tall); let m = 1e9; for (const r of rights) m = Math.min(m, Math.hypot(Math.max(0, Math.abs(Math.asin(s.dir.x * r.x + s.dir.z * r.z)) * HOME.R - s.half), v)); return m; };
  // a deal, and again while the foot finds no room, THINGS.deals deals at the most; a thing that has found none is not stood
  const deal = (make) => { let s = null; for (let k = 0; k < THINGS.deals; k++) { s = make(); s.clear = room(s); s.line = toLine(s); s.dealt = k + 1; s.stood = s.clear >= THINGS.apart && s.line >= CROWN.keep; if (s.stood) break; } if (s.stood) placed.push(s); return s; };
  const plain = (t, rng, rad) => deal(() => { const s = stand(t, rng); s.rad = rad; s.tall = t.tall; s.half = t.half; return s; });
  // THE ORDER OF DEALING IS FIXED: the chair first, the rose second (so the two that the planet is kept for always find
  // room), then the cones (night, day, cold), then the seedbeds; each on its own fork. So only a cone or a seedbed can go unstood.
  const chair = plain(THINGS.chair, forks.chair, THINGS.pad), rose = plain(THINGS.rose, forks.rose, THINGS.pad + 1.6), bedRad = Math.hypot(B.w, B.l) / 2;
  const cone1 = deal(() => cone(THINGS.coneNight, forks.coneNight)), cone2 = deal(() => cone(THINGS.coneDay, forks.coneDay)), dead = deal(() => cone(THINGS.coneCold, forks.coneCold));
  const beds = [THINGS.bed1, THINGS.bed2, THINGS.bed3].map((t, i) => { const b = plain(t, forks.bed[i], bedRad); b.rng = forks.bed[i]; return b; });
  return { cone1, cone2, dead, chair, rose, beds: beds.filter((b) => b.stood), unstood: [cone1, cone2, dead, chair, rose, ...beds].filter((t) => !t.stood).length };
}
// THE SKIN'S HEIGHT RULE, one function for the ground's shape, for where every thing and blade stands and for the room:
// metres over the mean skin at a direction from the planet's centre. Knolls and hollows from the relief's own noise; round
// the foot of each standing thing the ground is its own level (a pad); a seedbed's plot is dug (the bed's own earth lies in it).
function makeRelief(noise, L) {
  const Q = THINGS.relief, R = HOME.R, sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const base = (x, y, z) => {
    const r = Math.hypot(x, y, z) || 1, ux = x / r, uy = y / r, uz = z / r;
    const amp = Q.low + (Q.full - Q.low) * sm(Q.near, Q.far, trackAside(ux, uy, uz));
    return amp * (0.72 * noise.n3(ux * R * Q.wide + 4.1, uy * R * Q.wide - 2.7, uz * R * Q.wide + 9.3) + 0.38 * noise.n3(ux * R * Q.fine - 6.2, uy * R * Q.fine + 1.9, uz * R * Q.fine + 3.3));
  };
  // the pads: a round one under each cone (out to its cinder apron), the chair and the rose; a plot under each seedbed
  const pads = [], B = THINGS.bed;
  const round = (t, rad) => { const d = t.dir; t.h0 = base(d.x, d.y, d.z); if (t.stood) pads.push({ d, rad, h0: t.h0 }); };
  for (const c of [L.cone1, L.cone2, L.dead]) round(c, c.h * 0.7 + THINGS.apron);
  round(L.chair, THINGS.pad); round(L.rose, THINGS.pad + 1.6);
  for (const b of L.beds) {
    const d = b.dir; b.h0 = base(d.x, d.y, d.z);
    // the bed's own frame on the skin: along the round's heading (its length) and toward the crown (its width)
    b.e1 = new THREE.Vector3(0, 1, 0).cross(d).normalize().negate(); b.e2 = new THREE.Vector3().crossVectors(b.e1, d).normalize();
    b.local = (x, y, z, out) => { const r = Math.hypot(x, y, z) || 1; out[0] = (x * b.e1.x + y * b.e1.y + z * b.e1.z) / r * R; out[1] = (x * b.e2.x + y * b.e2.y + z * b.e2.z) / r * R; out[2] = (x * d.x + y * d.y + z * d.z) / r; return out; };
    b.at = (a, c, h, out) => out.copy(d).addScaledVector(b.e1, a / R).addScaledVector(b.e2, c / R).normalize().multiplyScalar(R + h);
  }
  const _l = [0, 0, 0];
  const relief = (x, y, z) => {
    let h = base(x, y, z); const r = Math.hypot(x, y, z) || 1;
    for (const p of pads) { const c = (x * p.d.x + y * p.d.y + z * p.d.z) / r; if (c < 0.9) continue; const m = Math.acos(Math.min(1, c)) * R; if (m < p.rad * 1.6) h += (p.h0 - h) * (1 - sm(p.rad * 0.7, p.rad * 1.6, m)); }
    for (const b of L.beds) { b.local(x, y, z, _l); if (_l[2] < 0.9) continue; const q = Math.max(Math.abs(_l[0]) / (B.l / 2), Math.abs(_l[1]) / (B.w / 2)); if (q < 2) h += (b.h0 - h) * (1 - sm(1.05, 2, q)) - (B.dig + 0.12) * (1 - sm(0.8, 1.02, q)); }
    return h;
  };
  relief.base = base;
  return relief;
}
// the turn about a thing's own upright that points its front along the sun's way over the ground there
function yawToSun(at) {
  const m = standAt(at, 0), side = new THREE.Vector3(), up = new THREE.Vector3(), fwd = new THREE.Vector3(); m.extractBasis(side, up, fwd);
  return Math.atan2(SUN.dot(side), SUN.dot(fwd));
}

export async function buildHero(ctx, opts = {}) {
  const core = ctx.core, { clamp, lerp, smoothstep } = core;
  const detail = ctx.quality?.detail ?? 1, density = opts.density ?? 1;
  // forks, in one fixed order, each a stream of its own from the world's seed and a name
  const fork = (name) => core.makeRng(core.hashSeed('forty-four-sunsets:' + name + ':' + ctx.seed));
  const rCone = fork('home-cones'), rGrass = fork('home-grass'), rFlower = fork('home-flowers'), rSeed = fork('home-seedlings'), rRose = fork('home-rose'), rWood = fork('home-wood');
  // (r4: every thing's place has a stream of its own; the relief its own noise; the beds' earth and the aprons' cinder theirs)
  const forks = homeForks(core, ctx.seed);
  const rEarth = fork('home-bed-earth'), rCinder = fork('home-cinder');
  const env = opts.env || makeEnv();
  const L = layoutHome(forks), relief = makeRelief(core.makeNoise(core.hashSeed('forty-four-sunsets:home-relief:' + ctx.seed)), L);
  // every thing's foot stands on the relief
  // (a thing that found no room is not stood: it is kept deep inside the globe, THINGS.under of the radius from the centre,
  // where the ground hides all of it, its smoke and its glow)
  for (const t of [L.cone1, L.cone2, L.dead, L.chair, L.rose]) t.pos = t.dir.clone().multiplyScalar(t.stood ? HOME.R + t.h0 : HOME.R * THINGS.under);
  await ctx.yield();
  const R = HOME.R, root = new THREE.Group();
  const occ = new THREE.Vector4(0, 0, 0, R);
  const capA = [], capB = [], capK = [];
  for (let i = 0; i < NCAP; i++) { capA.push(new THREE.Vector4(0, -500, 0, 0)); capB.push(new THREE.Vector4(0, -500, 0, 0)); capK.push(0); }
  const lampA = [new THREE.Vector4(0, 0, 0, 0), new THREE.Vector4(0, 0, 0, 0)];
  const lampCol = new THREE.Color(1.0, 0.24, 0.045).multiplyScalar(2.6);
  const soil = []; for (let i = 0; i < 8; i++) soil.push(new THREE.Vector4(0, -500, 0, 1));
  const globeU = new THREE.Vector4(0, -500, 0, 1);
  const U = { ...env, uOcc: { value: occ }, uCapA: { value: capA }, uCapB: { value: capB }, uCapK: { value: capK }, uLampA: { value: lampA }, uLampCol: { value: lampCol },
    uSoilAt: { value: soil }, uGlobe: { value: globeU },
    uGrassA: { value: new THREE.Color(0.085, 0.21, 0.06) }, uGrassB: { value: new THREE.Color(0.16, 0.26, 0.05) }, uSoil: { value: new THREE.Color(...lin('#6b4a33')).multiplyScalar(1.25) },
    // the night side's standing light: the star band from above (cool blue-green) and the Earth's lit air from below (rose-gold)
    uStarFill: { value: new THREE.Color(0.25, 0.4, 0.46).multiplyScalar(opts.hour === 'night' ? 2.8 : 2.0) }, uEarthFill: { value: new THREE.Color(0.5, 0.3, 0.2).multiplyScalar(0.5) } };
  let capN = 0, soilN = 0;
  const addCap = (a, ra, b, rb, k) => { if (capN >= NCAP) return; capA[capN].set(a.x, a.y, a.z, ra); capB[capN].set(b.x, b.y, b.z, rb); capK[capN] = k; capN++; };
  const addSoil = (p, r) => { if (soilN < 8) soil[soilN++].set(p.x, p.y, p.z, r); };
  const frames = {};
  const lit = makeLit(env, { occ, lampA, lampCol, wrap: 0.15 });
  const lit2 = makeLit(env, { occ, lampA, lampCol, wrap: 0.3, side: THREE.DoubleSide });
  // dug earth and cinder lie in the ground's own light: on the night side they take the star band's fill as the grass does
  const litEarth = makeLit(env, { occ, lampA, lampCol, wrap: 0.3, side: THREE.DoubleSide });
  litEarth.uniforms.uStarFill = U.uStarFill;
  litEarth.fragmentShader = litEarth.fragmentShader.replace('uniform float uWrap, uGild, uShow;', 'uniform float uWrap, uGild, uShow; uniform vec3 uStarFill;').replace('nightAlb(vC) * amb * 1.5', 'nightAlb(vC) * (amb * 1.5 + uStarFill * (.62 + .38 * upAt(vW).y) * 1.4)');
  const parts = [], parts2 = [], parts3 = [];

  // ------------------------------------------------------------ the ground: soil showing through short grass, the night line, long shadows
  await ctx.yield();
  const groundMat = new THREE.ShaderMaterial({
    uniforms: U,
    vertexShader: /* glsl */`
      attribute float aBare; varying vec3 vW, vNs; varying float vBare;
      void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; vNs = mat3(modelMatrix) * normal; vBare = aBare; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: GLSL_NOISE + GLSL_LIGHT + GLSL_CAPS + /* glsl */`
      uniform vec4 uLampA[2]; uniform vec3 uLampCol; uniform vec4 uSoilAt[8]; uniform vec4 uGlobe; uniform vec3 uGrassA, uGrassB, uSoil, uStarFill, uEarthFill;
      varying vec3 vW, vNs; varying float vBare;
      void main(){
        vec3 n = normalize(vW), ns = normalize(vNs), v = normalize(cameraPosition - vW);
        float px = length(fwidth(vW));
        float big = fb3(vW * .11), mid = fb3(vW * .52 + 11.);
        // small detail gives way to its mean where a pixel is wider than it (no sparkle on the far globe)
        float fine = mix(.5, vn3(vW * 3.3), clamp(1.3 - px * 4., 0., 1.)), grit = mix(.5, vn3(vW * 9.7 + 5.), clamp(1.3 - px * 11., 0., 1.));
        float peb = mix(.5, vn3(vW * 21. + 2.), clamp(1.3 - px * 24., 0., 1.));
        float bare = smoothstep(.5, .66, vBare + (mid - .5) * .8 + (fine - .5) * .3) * (.55 + .45 * grit);
        for (int i = 0; i < 8; i++) { float d = distance(vW, uSoilAt[i].xyz); bare = max(bare, (1. - smoothstep(uSoilAt[i].w * .55, uSoilAt[i].w, d + (mid - .5) * 1.6)) * .92); }
        vec3 grass = mix(uGrassA, uGrassB, smoothstep(.3, .7, big)) * (.62 + .7 * fine) * (.7 + .6 * grit);
        vec3 dirt = uSoil * (.6 + .6 * mid) * (.7 + .6 * grit) * (.8 + .5 * smoothstep(.55, .8, peb)) * (1. - .35 * (1. - smoothstep(.3, .62, peb)) * grit);
        vec3 alb = mix(grass, dirt, bare);
        float ndl = dot(n, uSun), day = smoothstep(-.16, .3, ndl), low = 1. - clamp(ndl * 2.2, 0., 1.);
        // the relief's own shade: a slope turned to the low sun is bright, one turned from it dark (the knolls read by their light)
        float slope = clamp(1. + (dot(ns, uSun) - ndl) * 3.2, .22, 1.9);
        // the tufts' own small shadows, drawn out along the sun's way over the ground while it is low
        vec3 sT = uSun - n * ndl; sT = sT / max(length(sT), 1e-3);
        vec3 q = vW * 1.7; q -= sT * dot(q, sT) * .86;
        float streak = mix(1., .35 + .9 * vn3(q), low * (1. - bare * .6));
        float sh = capShade(vW);
        vec3 gp = vW - uGlobe.xyz; float gt = max(-dot(gp, uSun), 0.), gd = length(gp + gt * uSun);
        float caustic = (1. - smoothstep(.15, 1.1, gd)) * step(1., gt) / (1. + gt * .05);
        // the night: blue-green under the star band, a little rose-gold on the under-curve from the Earth's air; soil and grass keep their own tones
        vec3 nA = mix(nightAlb(alb), vec3(.36, .2, .11) * (.7 + .5 * mid) * (.8 + .4 * grit), bare);
        vec3 night = nA * (uStarFill * (.62 + .38 * n.y) * (.86 + .28 * fine) * (.9 + .2 * big) + uEarthFill * clamp(.25 - n.y, 0., 1.));
        // (the dark half is never black: no place of it falls under a share of the star band's own light)
        night = max(night, uStarFill * .075);
        vec3 c = alb * uSunCol * day * (.42 + .58 * clamp(ndl, 0., 1.)) * slope * streak * (sh + caustic * 2.2) + night * (.86 + .14 * clamp(dot(ns, n) * 4. - 3., 0., 1.));
        for (int i = 0; i < 2; i++) { vec3 d = uLampA[i].xyz - vW; c += alb * uLampCol * uLampA[i].w * 1.6 / (1. + dot(d, d) * .16); }
        float rim = 1. - clamp(dot(n, v), 0., 1.); float rim3 = rim * rim * rim;
        float toSun = clamp(-dot(v, uSun), 0., 1.);
        c += uSunCol * (.3 + alb) * rim3 * rim * smoothstep(-.3, .12, ndl) * toSun * toSun * .9;
        c += uRimCol * alb * rim3 * 1.2;
        gl_FragColor = vec4(c, 1.);
      }`,
  });
  // the ground's shape is the relief; brown earth shows only in the deep of the hollows (one function for the ground's
  // colour and for where grass and flowers are planted)
  const bareAt = (x, y, z) => smoothstep(0.4, 0.85, -relief.base(x, y, z)) * 0.8;
  await ctx.yield();
  const groundGeo = new THREE.SphereGeometry(R, 144, 96), GH = new Float32Array(145 * 97);
  await ctx.yield();
  {
    const P = groundGeo.attributes.position, bare = new Float32Array(P.count);
    for (let i = 0; i < P.count; i++) {
      const x = P.getX(i), y = P.getY(i), z = P.getZ(i), k = (R + (GH[i] = relief(x, y, z))) / R;
      bare[i] = bareAt(x, y, z); P.setXYZ(i, x * k, y * k, z * k); if (i % 1200 === 1199) await ctx.yield();
    }
    groundGeo.setAttribute('aBare', new THREE.BufferAttribute(bare, 1));
    await ctx.yield();
    groundGeo.computeVertexNormals();
    await ctx.yield();
    // (the sphere's seam: the first and the last point of each ring are one place, and take one normal)
    const N = groundGeo.attributes.normal, W = 145;
    for (let j = 0; j <= 96; j++) { const a = j * W, b = a + 144; _p.set(N.getX(a) + N.getX(b), N.getY(a) + N.getY(b), N.getZ(a) + N.getZ(b)).normalize(); N.setXYZ(a, _p.x, _p.y, _p.z); N.setXYZ(b, _p.x, _p.y, _p.z); }
    groundGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), R + 1.5);
  }
  const ground = new THREE.Mesh(groundGeo, groundMat);
  root.add(ground);
  // the thin limb of air all round the planet: brightest and gold toward the sun, a faint cool line elsewhere, thinning
  // upward to nothing well inside its shell (no shell edge)
  const limb = new THREE.Mesh(new THREE.SphereGeometry(R + 3.4, 72, 48), new THREE.ShaderMaterial({
    uniforms: U, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */`
      varying vec3 vW;
      void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */`
      uniform vec3 uSun, uSunCol; varying vec3 vW;
      void main(){
        vec3 n = normalize(vW), v = normalize(cameraPosition - vW);
        float h = length(cross(v, cameraPosition)), up = max(h - ${R.toFixed(1)}, 0.);
        float air = exp(-up * 1.5) * (1. - smoothstep(2.2, 3.2, up)) * smoothstep(${(R - 1.2).toFixed(1)}, ${R.toFixed(1)}, h);
        float toSun = clamp(-dot(v, uSun), 0., 1.), lit = smoothstep(-.5, .25, dot(n, uSun));
        // (the sunward limb carries a thin lit rim of air from wherever it is seen; it is brightest against the sun)
        vec3 c = uSunCol * air * (.04 + lit * (.34 + 1.1 * toSun * toSun * toSun)) + vec3(.1, .16, .3) * air * .16;
        gl_FragColor = vec4(c, 1.);
      }`,
  }));
  limb.renderOrder = 2; root.add(limb);
  await ctx.yield();

  // ------------------------------------------------------------ the three cones: dark stone, swept clean at the rim; two with a hearth in the mouth
  const stone = [0.12, 0.1, 0.092], ember = [1.0, 0.24, 0.045];
  const mouths = [];
  const addCone = (c, alive, k) => {
    const h = c.h, rb = h * 0.7, rm = 0.95, prof = [];
    for (let i = 0; i <= 9; i++) { const t = i / 9; prof.push(new THREE.Vector2(rm + 0.2 + (rb - rm - 0.2) * Math.pow(1 - t, 1.6), h * t)); }
    // the crater: a funnel a man could look down into, 1.3 m deep, its floor the hearth
    prof.push(new THREE.Vector2(rm, h), new THREE.Vector2(rm * 0.86, h - 0.22), new THREE.Vector2(0.62, h - 0.8), new THREE.Vector2(0.5, h - 1.25), new THREE.Vector2(0.001, h - 1.3));
    const g = new THREE.LatheGeometry(prof, 22), P = g.attributes.position, gul = rCone.int(5, 8), ph = rCone.range(0, 6.28), sd = rCone.range(0, 50);
    for (let i = 0; i < P.count; i++) {
      const x = P.getX(i), y = P.getY(i), z = P.getZ(i), r = Math.hypot(x, z);
      if (r < 1e-4 || y > h * 0.9) continue;
      const a = Math.atan2(z, x), w = 1 - y / h;
      const q = 1 + w * (0.07 * Math.sin(gul * a + ph + y * 0.8) + 0.11 * ctx.noise.n3(x * 0.9 + sd, y * 0.9, z * 0.9));
      P.setX(i, x * q); P.setZ(i, z * q);
    }
    g.computeVertexNormals();
    const m = standAt(c.pos, c.spin, null, c.lean, c.leanDir);
    parts.push(paint(g, stone, { m, shade: (x, y, z) => { _p.set(x, y, z); const up = _p.length() - R, rr = 0.75 + 0.5 * ctx.noise.n3(x * 1.3, y * 1.3, z * 1.3); return up > h * 0.96 ? 1.5 * rr : rr; } }));
    const top = new THREE.Vector3(0, h - 0.9, 0).applyMatrix4(m), foot = new THREE.Vector3(0, 0.2, 0).applyMatrix4(m), lip = new THREE.Vector3(0, h + 0.9, 0).applyMatrix4(m);
    addCap(foot, rb * 0.82, new THREE.Vector3(0, h, 0).applyMatrix4(m), rm + 0.15, 0.86);
    // its apron of dark cinder: a ragged round of clinker lying on the ground out to THINGS.apron metres from the foot
    // (it follows the skin's curve; its edge goes under the grass), with loose clinker stones on it
    {
      const am = standAt(c.pos, c.spin), rA = rb + THINGS.apron, SEG = 26, rings = [0.55, 0.8, 1.0, 1.12], pos = [], idx = [], ph = rCinder.range(0, 6.28), cinder = lin('#3a2e30');
      const edge = (a) => rA * (0.84 + 0.13 * Math.sin(a * 3 + ph) + 0.09 * Math.sin(a * 7 + ph * 2.3) + 0.05 * Math.sin(a * 13 + ph * 0.7));
      for (let j = 0; j < rings.length; j++) for (let i = 0; i < SEG; i++) {
        const a = i / SEG * Math.PI * 2, r = j === 0 ? rb * 0.7 : edge(a) * rings[j], y = j === 0 ? 0.3 : j === 1 ? 0.16 : j === 2 ? 0.07 : -0.2;
        _p.set(Math.cos(a) * r, 0, Math.sin(a) * r).applyMatrix4(am).normalize().multiplyScalar(R + c.h0 + y); pos.push(_p.x, _p.y, _p.z);
      }
      for (let j = 0; j < rings.length - 1; j++) for (let i = 0; i < SEG; i++) { const a = j * SEG + i, b = j * SEG + (i + 1) % SEG, d = a + SEG, e = b + SEG; idx.push(a, b, d, b, e, d); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
      parts3.push(paint(g, cinder, { shade: (x, y, z) => 0.9 + 1.3 * Math.abs(ctx.noise.n3(x * 1.7, y * 1.7, z * 1.7)) + (ctx.noise.n3(x * 0.5 + 9, y * 0.5, z * 0.5) > 0.25 ? 0.7 : 0) }));
      for (let i = 0; i < 12; i++) {
        const a = rCinder.range(0, 6.28), r = rCinder.range(rb * 0.95, edge(a) * 0.95), sz = rCinder.range(0.14, 0.42);
        _p.set(Math.cos(a) * r, 0, Math.sin(a) * r).applyMatrix4(am).normalize().multiplyScalar(R + c.h0 + 0.1 + sz * 0.3);
        parts3.push(paint(new THREE.IcosahedronGeometry(sz, 0), cinder.map((v) => v * rCinder.range(0.8, 1.9)), { m: standAt(_p.clone(), rCinder.range(0, 6.28)).multiply(xf(0, 0, 0, rCinder.range(0, 3), 0, rCinder.range(0, 3), 1, rCinder.range(0.5, 0.9), 1)) }));
      }
    }
    frames[k] = { m, top: new THREE.Vector3(0, h, 0).applyMatrix4(m), h, alive };
    if (alive) {
      const i = mouths.length;
      parts.push(paint(new THREE.CircleGeometry(0.6, 14), ember, { m: m.clone().multiply(xf(0, h - 0.95, 0, -Math.PI / 2, 0, 0)), glow: 3.4 }));
      lampA[i].set(lip.x, lip.y, lip.z, 1);
      mouths.push({ top, lip, up: new THREE.Vector3().copy(c.pos).normalize(), ph: rCone.range(0, 6.28), m });
    } else {
      parts.push(paint(new THREE.CircleGeometry(0.6, 14), [0.02, 0.017, 0.018], { m: m.clone().multiply(xf(0, h - 0.95, 0, -Math.PI / 2, 0, 0)) }));
    }
  };
  addCone(L.cone1, true, 'cone1'); await ctx.yield();
  addCone(L.cone2, true, 'cone2'); await ctx.yield();
  addCone(L.dead, false, 'dead'); await ctx.yield();

  // ------------------------------------------------------------ the empty chair: plain wood, 6.5 m to a bird, its back to the track, facing across the cap where the sun goes down
  {
    const m = standAt(L.chair.pos, yawToSun(L.chair.pos)), wood = () => { const k = rWood.range(0.8, 1.15); return [0.36 * k, 0.215 * k, 0.105 * k]; };
    const box = (w, h, d, x, y, z, rx = 0, rz = 0) => parts.push(paint(new THREE.BoxGeometry(w, h, d), wood(), { m: m.clone().multiply(xf(x, y, z, rx, 0, rz)) }));
    const sw = 1.45, leg = 0.36, seatY = 3.0, topY = 6.5, BED = 0.4;
    for (const sx of [-1, 1]) {
      // (its feet go BED metres into the ground, and the grass stands up round them: it is bedded, not set down)
      box(leg, seatY + BED, leg, sx * sw, (seatY - BED) / 2, sw);
      box(leg, topY + BED, leg, sx * sw, (topY - BED) / 2, -sw, -0.03);
      box(0.2, 0.26, sw * 2, sx * sw, 1.15, 0);
    }
    box(sw * 2 + 0.6, 0.3, sw * 2 + 0.6, 0, seatY + 0.05, 0);
    box(sw * 2, 0.26, 0.2, 0, 1.5, sw); box(sw * 2, 0.26, 0.2, 0, 1.5, -sw);
    box(sw * 2 + 0.36, 0.62, 0.24, 0, topY - 0.36, -sw - 0.1); box(sw * 2, 0.34, 0.2, 0, 4.25, -sw - 0.04);
    for (const sx of [-0.8, 0, 0.8]) box(0.34, 1.75, 0.14, sx, 5.2, -sw - 0.07);
    const W = (x, y, z) => new THREE.Vector3(x, y, z).applyMatrix4(m);
    addCap(W(0, 0.3, 0), 1.75, W(0, seatY, 0), 1.75, 0.8);
    addCap(W(0, seatY, -sw), 1.6, W(0, topY - 0.3, -sw - 0.1), 1.45, 0.8);
    addSoil(W(0, 0, 2.7), 2.7);
    frames.chair = { m, top: W(0, topY, -sw), h: topY };
  }
  await ctx.yield();

  // ------------------------------------------------------------ the rose: a real small bush, her glass globe, the screen on her sunset side, the tin can
  let glass = null;
  {
    const m = standAt(L.rose.pos, yawToSun(L.rose.pos)), W = (x, y, z) => new THREE.Vector3(x, y, z).applyMatrix4(m);
    const put = (geo, col, o = {}) => (o.two ? parts2 : parts).push(paint(geo, col, { ...o, m: m.clone().multiply(o.m || new THREE.Matrix4()) }));
    const stemC = [0.07, 0.085, 0.04], leafC = [0.035, 0.105, 0.04];
    const stems = [], nStem = 4;
    for (let i = 0; i < nStem; i++) {
      const a = i / nStem * Math.PI * 2 + rRose.range(-0.4, 0.4), hgt = i === 0 ? 3.75 : rRose.range(2.3, 3.2), out = i === 0 ? 0.25 : rRose.range(0.7, 1.15);
      const cv = new THREE.CatmullRomCurve3([new THREE.Vector3(Math.cos(a) * 0.12, 0, Math.sin(a) * 0.12), new THREE.Vector3(Math.cos(a) * out * 0.5, hgt * 0.4, Math.sin(a) * out * 0.5),
        new THREE.Vector3(Math.cos(a + 0.5) * out * 0.9, hgt * 0.75, Math.sin(a + 0.5) * out * 0.9), new THREE.Vector3(Math.cos(a + 0.8) * out, hgt, Math.sin(a + 0.8) * out)]);
      stems.push({ cv, hgt });
      put(new THREE.TubeGeometry(cv, 8, i === 0 ? 0.085 : 0.06, 5), stemC);
      const nLeaf = i === 0 ? 14 : 10;
      for (let k = 0; k < nLeaf; k++) {
        const t = rRose.range(0.22, 0.98), p = cv.getPoint(t), ya = rRose.range(0, 6.28), s = rRose.range(0.34, 0.58);
        const leaf = new THREE.BufferGeometry();
        leaf.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0.45, 0.12, 0.5, 0, 0.2, 1.15, 0, 0, 0, 0, 0.2, 1.15, -0.45, 0.12, 0.5], 3));
        leaf.computeVertexNormals();
        put(leaf, [leafC[0] * rRose.range(0.7, 1.3), leafC[1] * rRose.range(0.75, 1.25), leafC[2]], { two: true, sway: 0.035, m: xf(p.x, p.y, p.z, rRose.range(-0.5, 0.3), ya, 0, s) });
      }
    }
    // four thorns on the tall stem, and the one bloom at its head
    for (let k = 0; k < 4; k++) { const p = stems[0].cv.getPoint(0.2 + k * 0.17); put(new THREE.ConeGeometry(0.075, 0.36, 5), [0.16, 0.09, 0.05], { m: xf(p.x, p.y, p.z, 0, k * 1.9, Math.PI / 2 - 0.3) }); }
    const head = stems[0].cv.getPoint(1), crimson = [0.5, 0.018, 0.07];
    put(new THREE.SphereGeometry(0.3, 8, 6), [0.3, 0.008, 0.04], { m: xf(head.x, head.y + 0.16, head.z, 0, 0, 0, 1, 0.9, 1), glow: 0.16 });
    for (let ring = 0; ring < 2; ring++) for (let k = 0; k < 5; k++) {
      const a = k / 5 * Math.PI * 2 + ring * 0.63, tilt = ring ? 0.95 : 0.5, rad = ring ? 0.3 : 0.2;
      put(new THREE.SphereGeometry(0.34, 6, 4, 0, Math.PI), crimson.map((v) => v * (ring ? 1 : 0.8)), { two: true, glow: 0.2,
        m: xf(head.x + Math.cos(a) * rad, head.y + 0.14 - ring * 0.08, head.z + Math.sin(a) * rad, 0, -a + Math.PI / 2, 0).multiply(xf(0, 0, 0, -tilt, 0, 0, 1, 1.15, 0.5)) });
    }
    for (let k = 0; k < 5; k++) put(new THREE.ConeGeometry(0.09, 0.42, 4), leafC, { m: xf(head.x, head.y - 0.12, head.z, 0, k * 1.257, 2.2) });
    await ctx.yield();
    // the folding screen (r9: its place and its zigzag are r8b's; its form is new): THREE PALE LEAVES OF WOVEN STUFF, each
    // SCREEN.w by SCREEN.h metres, standing in a zigzag across the way the sun goes down, LOWER THAN THE GLASS (whose top
    // stands 4.25 m up); a leaf is woven in level bands of two pale tones between thin pale reeds, with a paler rail along
    // its upper edge, where the last light lies when it reaches so low (light by place, as everywhere). No dark frame.
    const SCREEN = { w: 1.4, h: 3.0, bands: 9 }, reedC = [0.6, 0.53, 0.38], cloth = [0.8, 0.73, 0.58], railC = [0.93, 0.88, 0.72];
    for (let k = -1; k <= 1; k++) {
      const ry = k === 0 ? -0.42 : 0.42, pm = xf(k * 1.42, 0, 3.7 + (k === 0 ? 0 : 0.3), 0, ry, 0), tone = rRose.range(0.9, 1.08), bh = (SCREEN.h - 0.2) / SCREEN.bands;
      for (let q = 0; q < SCREEN.bands; q++) put(new THREE.PlaneGeometry(SCREEN.w - 0.06, bh, 2, 1), cloth.map((v) => v * tone * (q % 2 ? 0.86 : 1)), { two: true, sway: 0.02, m: pm.clone().multiply(xf(0, 0.12 + (q + 0.5) * bh, 0)) });
      for (const sx of [-SCREEN.w / 2, 0, SCREEN.w / 2]) put(new THREE.BoxGeometry(0.06, SCREEN.h, 0.06), reedC, { m: pm.clone().multiply(xf(sx, SCREEN.h / 2, 0)) });
      put(new THREE.BoxGeometry(SCREEN.w + 0.08, 0.1, 0.1), railC, { m: pm.clone().multiply(xf(0, SCREEN.h, 0)) });
    }
    await ctx.yield();
    // the tin watering can, 2.5 m to the top of its hoop
    const tin = [0.36, 0.38, 0.4], cm = xf(-3.1, 0, -1.3, 0, 0.9, 0);
    put(new THREE.CylinderGeometry(0.78, 0.86, 1.95, 14), tin, { m: cm.clone().multiply(xf(0, 0.725, 0)) });
    put(new THREE.CylinderGeometry(0.1, 0.2, 2.1, 7), tin, { m: cm.clone().multiply(xf(1.35, 1.35, 0, 0, 0, -0.75)) });
    put(new THREE.CylinderGeometry(0.3, 0.1, 0.3, 9), tin, { m: cm.clone().multiply(xf(2.12, 2.07, 0, 0, 0, -0.75)) });
    put(new THREE.TorusGeometry(0.72, 0.06, 5, 12, Math.PI), tin, { m: cm.clone().multiply(xf(0, 1.72, 0)) });
    put(new THREE.TorusGeometry(0.55, 0.06, 5, 10, Math.PI), tin, { m: cm.clone().multiply(xf(-0.8, 0.9, 0, 0, 0, Math.PI / 2)) });
    const gc = W(0, 1.75, 0);
    globeU.set(gc.x, gc.y, gc.z, 2.5);
    addCap(gc, 2.45, gc, 2.45, 0.3);
    addCap(W(-1.5, 1.5, 3.9), 1.6, W(1.5, 1.5, 3.9), 1.6, 0.78);
    addCap(W(-3.1, 0.5, -1.3), 0.95, W(-3.1, 1.6, -1.3), 0.9, 0.8);
    addSoil(W(0, 0, 0.4), 3.4);
    frames.rose = { m, top: W(0, 4.25, 0), h: 4.25, centre: gc };
    glass = new THREE.Mesh(new THREE.SphereGeometry(2.5, 36, 24), new THREE.ShaderMaterial({
      uniforms: U, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */`
        varying vec3 vW, vN;
        void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; vN = mat3(modelMatrix) * normal; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: GLSL_LIGHT + /* glsl */`
        varying vec3 vW, vN;
        void main(){
          if (length(vW) < ${(R + L.rose.h0 - 0.06).toFixed(2)}) discard;
          vec3 n = normalize(vN), v = normalize(cameraPosition - vW);
          float f = 1. - clamp(dot(n, v), 0., 1.); float f2 = f * f, vis = sunVis(vW);
          float sp = clamp(dot(reflect(-v, n), uSun), 0., 1.); sp = sp * sp; sp = sp * sp; sp = sp * sp; sp = sp * sp; sp = sp * sp;
          float toSun = clamp(-dot(v, uSun), 0., 1.); float bead = toSun * toSun; bead = bead * bead * bead;
          vec3 c = vec3(.10, .16, .14) * f2 * (.35 + vis) + vec3(.09, .12, .2) * f2 * f;
          c += uSunCol * vis * (sp * 2.4 + bead * (.18 + 1.6 * f2)) + uSunCol * f2 * f * .22 * (.4 + .6 * clamp(dot(n, uSun), 0., 1.));
          float cold = clamp(dot(reflect(-v, n), normalize(vec3(.3, .9, .35))), 0., 1.); cold = cold * cold; cold = cold * cold; cold = cold * cold; cold = cold * cold;
          c += vec3(.5, .62, .9) * cold * cold * .9;
          gl_FragColor = vec4(c, 1.);
        }`,
    }));
    glass.position.copy(gc); glass.renderOrder = 3; root.add(glass);
  }
  await ctx.yield();

  // ------------------------------------------------------------ the three seedbeds: plots of dug brown earth, THINGS.bed metres, each with its lip of thrown-up
  // earth, raked in rows along its length, clods lying where the spade left them, and young shoots standing in the rows
  // with gaps (some places are bare). The shoots' places are kept for the planting below.
  const shootAt = [];
  {
    const B = THINGS.bed, earth = lin('#6b4a33'), ROWS = 6, gap = B.w * 0.86 / ROWS, steps = (n) => { const o = [-1.14, -1.07, -1, -0.93]; for (let i = 0; i <= n; i++) o.push(-0.86 + 1.72 * i / n); o.push(0.93, 1, 1.07, 1.14); return o; };
    const al = steps(12), ac = steps(30);
    for (const b of L.beds) {
      const pos = [], idx = [], ph = rEarth.range(0, 6.28), W = ac.length;
      const hAt = (a, c) => {
        const q = Math.max(Math.abs(a) / (B.l / 2), Math.abs(c) / (B.w / 2)), ang = Math.atan2(c, a), rag = 0.75 + 0.25 * Math.sin(ang * 5 + ph) + 0.2 * Math.sin(ang * 11 + ph * 1.7);
        const floor = -B.dig + 0.07 * Math.cos((c / gap + 0.5 * (ROWS % 2 ? 1 : 0)) * Math.PI * 2 + Math.PI) + 0.03 * ctx.noise.n3(a * 1.3 + ph, c * 1.3, 4.4);
        return q < 0.86 ? floor : q < 1 ? lerp(floor, B.lip * rag, smoothstep(0.86, 1, q)) : lerp(B.lip * rag, -0.22, smoothstep(1, 1.14, q));
      };
      for (const ta of al) for (const tc of ac) { const a = ta * B.l / 2, c = tc * B.w / 2; b.at(a, c, b.h0 + hAt(a, c), _p); pos.push(_p.x, _p.y, _p.z); }
      for (let i = 0; i < al.length - 1; i++) for (let j = 0; j < W - 1; j++) { const k = i * W + j; idx.push(k, k + 1, k + W, k + 1, k + W + 1, k + W); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
      const _l = [0, 0, 0];
      // (the earth's colour: darker in the furrows and where it is damp, paler and drier on the rows' tops and the lip)
      parts3.push(paint(g, earth, { shade: (x, y, z) => { const up = Math.hypot(x, y, z) - R - b.h0; return (1.05 + 2.2 * clamp(up + B.dig, -0.1, 0.5)) * (0.75 + 0.5 * Math.abs(ctx.noise.n3(x * 2.1, y * 2.1, z * 2.1))); } }));
      for (let i = 0; i < 26; i++) {
        const a = rEarth.range(-1.05, 1.05) * B.l / 2, c = rEarth.range(-1.05, 1.05) * B.w / 2, sz = rEarth.range(0.1, 0.28);
        b.at(a, c, b.h0 + hAt(a, c) + sz * 0.35, _p);
        parts3.push(paint(new THREE.IcosahedronGeometry(sz, 0), earth.map((v) => v * rEarth.range(0.8, 1.5)), { m: standAt(_p.clone(), rEarth.range(0, 6.28)).multiply(xf(0, 0, 0, rEarth.range(0, 3), 0, rEarth.range(0, 3), 1, rEarth.range(0.55, 0.9), 1)) }));
      }
      // the shoots: every half metre along each row, by a draw; three places in four are taken
      const rng = b.rng, here = [];
      for (let k = 0; k < ROWS; k++) for (let a = -B.l / 2 * 0.8; a <= B.l / 2 * 0.8; a += 0.5) {
        if (!rng.chance(0.76)) continue;
        const aa = a + rng.range(-0.12, 0.12), c = (k + 0.5 - ROWS / 2) * gap + rng.range(-0.06, 0.06); here.push(b.at(aa, c, b.h0 + hAt(aa, c) - 0.03, new THREE.Vector3()));
      }
      b.shoots = here.length; shootAt.push(...here);
      await ctx.yield();
    }
  }

  // ------------------------------------------------------------ grass, one-day flowers and seedling shoots: instanced, bent and lit in the vertex shader
  const floraMat = new THREE.ShaderMaterial({
    uniforms: U, side: THREE.DoubleSide,
    vertexShader: GLSL_LIGHT + GLSL_CAPS + /* glsl */`
      attribute vec3 color; attribute float aTip, aFold, aSlope;
      uniform vec4 uLampA[2]; uniform vec3 uLampCol, uStarFill, uEarthFill;
      varying vec3 vC, vL, vW, vN2;
      void main(){
        mat4 m = modelMatrix * instanceMatrix;
        vec3 root = (m * vec4(0., 0., 0., 1.)).xyz, nR = normalize(root - uOcc.xyz);
        // a flower is open or shut by where it stands against the standing night line, on every visit (a rare visit only has more of them)
        float ndl = dot(nR, uSun), open = smoothstep(-.02, .3, ndl);
        vec3 p = position;
        float r = length(p.xz), phi = (1. - open) * 1.3, fold = step(.5, aFold);
        vec2 dir = p.xz / max(r, 1e-4);
        p.xz = mix(p.xz, dir * r * cos(phi) * (.55 + .45 * open), fold); p.y += fold * r * sin(phi) * (.55 + .45 * open);
        vec4 w = m * vec4(p, 1.);
        vec3 wind = cross(nR, vec3(.31, .9, .22)); wind = wind / max(length(wind), 1e-3);
        float ph = dot(root, vec3(.9, .7, 1.1));
        w.xyz += (wind * sin(uTime * 1.7 + ph) + cross(nR, wind) * .5 * sin(uTime * 2.3 + ph * 1.3)) * aTip * aTip * .1 * mix(1., open, fold);
        float day = smoothstep(-.16, .3, ndl), low = 1. - clamp(ndl * 2.2, 0., 1.);
        vL = uSunCol * day * (.42 + .58 * clamp(ndl, 0., 1.)) * (1. + aSlope) * capShade(root) * (1. + aTip * low * .9); vN2 = (uStarFill * (.62 + .38 * nR.y) + uEarthFill * clamp(.25 - nR.y, 0., 1.)) * (.85 + .75 * aTip) * mix(1., .55, fold * (1. - open));
        for (int i = 0; i < 2; i++) { vec3 d = uLampA[i].xyz - root; vL += uLampCol * uLampA[i].w * 1.6 / (1. + dot(d, d) * .16); }
        vC = color;
        #ifdef USE_INSTANCING_COLOR
          vC *= instanceColor;
        #endif
        vW = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vC, vL, vW, vN2;
      uniform vec3 uStarFill;
      void main(){ vec3 c = max(vC * vL + min(mix(vC, vec3(dot(vC, vec3(.3, .5, .2))), .65), vec3(.3)) * vN2, uStarFill * .07); gl_FragColor = vec4(c, 1.); }`,
  });
  const rawGeo = (pos, col, tip, fold) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.setAttribute('aTip', new THREE.Float32BufferAttribute(tip, 1)); g.setAttribute('aFold', new THREE.Float32BufferAttribute(fold, 1));
    return g;
  };
  // a tuft: four blades, each one tapering triangle leaning outward
  const tuftGeo = (() => {
    const pos = [], col = [], tip = [], fold = [];
    for (let b = 0; b < 4; b++) {
      const a = b / 4 * Math.PI * 2 + rGrass.range(-0.5, 0.5), o = rGrass.range(0.03, 0.12), w = rGrass.range(0.07, 0.1), hgt = rGrass.range(0.7, 1), lean = rGrass.range(0.12, 0.4);
      const cx = Math.cos(a) * o, cz = Math.sin(a) * o, tx = -Math.sin(a) * w, tz = Math.cos(a) * w;
      pos.push(cx - tx, 0, cz - tz, cx + tx, 0, cz + tz, cx + Math.cos(a) * lean, hgt, cz + Math.sin(a) * lean);
      col.push(0.55, 0.6, 0.5, 0.55, 0.6, 0.5, 1.25, 1.2, 0.8); tip.push(0, 0, 1); fold.push(0, 0, 0);
    }
    return rawGeo(pos, col, tip, fold);
  })();
  // a flower: a stem, a yellow eye and one ring of five petals that fold up when the day is gone
  const flowerGeo = (() => {
    const pos = [], col = [], tip = [], fold = [], y = 1;
    pos.push(-0.03, 0, 0, 0.03, 0, 0, 0, y, 0); col.push(0.3, 0.5, 0.25, 0.3, 0.5, 0.25, 0.4, 0.6, 0.3); tip.push(0, 0, 1); fold.push(0, 0, 0);
    for (let k = 0; k < 5; k++) {
      const a = k / 5 * Math.PI * 2, a0 = a - 0.42, a1 = a + 0.42, r0 = 0.3, r1 = 0.52;
      const P = (aa, rr, yy) => [Math.cos(aa) * rr, y + yy, Math.sin(aa) * rr];
      pos.push(...P(a, 0.08, 0.02), ...P(a0, r0, 0.04), ...P(a, r1, 0.03), ...P(a, 0.08, 0.02), ...P(a, r1, 0.03), ...P(a1, r0, 0.04));
      for (let q = 0; q < 6; q++) { col.push(4.2, 4.2, 4.2); tip.push(1); fold.push(1); }
      pos.push(0, y + 0.07, 0, ...P(a, 0.11, 0.05), ...P(a + 1.257, 0.11, 0.05)); col.push(5, 3.2, 0.4, 5, 3.2, 0.4, 5, 3.2, 0.4); tip.push(1, 1, 1); fold.push(0, 0, 0);
    }
    return rawGeo(pos, col, tip, fold);
  })();
  // a seedling shoot: a stem and two pairs of small leaves
  const shootGeo = (() => {
    const pos = [], col = [], tip = [], fold = [];
    pos.push(-0.05, 0, 0, 0.05, 0, 0, 0, 1, 0, 0, 0, -0.05, 0, 0, 0.05, 0, 1, 0);
    for (let q = 0; q < 6; q++) { col.push(0.9, 1, 0.6); tip.push(q % 3 === 2 ? 1 : 0); fold.push(0); }
    for (const [yy, s, a0] of [[0.55, 0.42, 0], [0.98, 0.3, 1.57]]) for (const sg of [-1, 1]) {
      const a = a0 + (sg > 0 ? 0 : Math.PI), cx = Math.cos(a), cz = Math.sin(a);
      pos.push(0, yy, 0, cx * s * 0.5 - cz * s * 0.3, yy + s * 0.25, cz * s * 0.5 + cx * s * 0.3, cx * s, yy + s * 0.3, cz * s, 0, yy, 0, cx * s, yy + s * 0.3, cz * s, cx * s * 0.5 + cz * s * 0.3, yy + s * 0.25, cz * s * 0.5 - cx * s * 0.3);
      for (let q = 0; q < 6; q++) { col.push(1.1, 1.3, 0.7); tip.push(yy); fold.push(0); }
    }
    return rawGeo(pos, col, tip, fold);
  })();

  // where nothing is planted: the feet of the things
  const keepOff = [[frames.cone1.m, L.cone1.h * 0.7 + THINGS.apron * 0.85], [frames.cone2.m, L.cone2.h * 0.7 + THINGS.apron * 0.85], [frames.dead.m, L.dead.h * 0.7 + THINGS.apron * 0.85], [frames.chair.m, 1.9], [frames.rose.m, 2.3]]
    .map(([m, r]) => ({ p: new THREE.Vector3().setFromMatrixPosition(m), r }));
  keepOff.push({ p: new THREE.Vector3(0, 0, 3.8).applyMatrix4(frames.rose.m), r: 1.5 }, { p: new THREE.Vector3(-3.1, 0, -1.3).applyMatrix4(frames.rose.m), r: 1.3 });
  const onSphere = (rng, out) => { const y = rng.range(-1, 1), a = rng.range(0, Math.PI * 2), q = Math.sqrt(1 - y * y); return out.set(q * Math.cos(a) * R, y * R, q * Math.sin(a) * R); };
  const _fl = [0, 0, 0];
  const free = (p) => { for (const k of keepOff) if (p.distanceToSquared(k.p) < k.r * k.r) return false;
    for (const b of L.beds) { b.local(p.x, p.y, p.z, _fl); if (_fl[2] > 0.9 && Math.max(Math.abs(_fl[0]) / (THINGS.bed.l / 2), Math.abs(_fl[1]) / (THINGS.bed.w / 2)) < 1.1) return false; }
    return true; };
  const _pt = new THREE.Vector3(), _sc = new THREE.Matrix4(), _ic = new THREE.Color();
  // standAt for the many: the same frame, made in place (no new vector or matrix for each of twenty thousand tufts)
  const _up = new THREE.Vector3(), _fw = new THREE.Vector3(), _sd = new THREE.Vector3(), _m1 = new THREE.Matrix4(), _m2 = new THREE.Matrix4();
  const standFast = (at, yaw) => { _up.copy(at).normalize(); _fw.set(0, 1, 0).cross(_up); if (_fw.lengthSq() < 1e-6) _fw.set(1, 0, 0); _fw.normalize(); _sd.crossVectors(_up, _fw).normalize(); return _m1.makeBasis(_sd, _up, _fw).setPosition(at).multiply(_m2.makeRotationY(yaw)); };
  // the slope's light where a blade stands: the ground's own normal there against the sun, as the ground counts it
  const GN = groundGeo.attributes.normal;
  // the ground's height where a blade stands: read from the ground's own points (so a blade stands on the drawn ground)
  const skinAt = (p) => { const r = p.length(), tj = Math.acos(clamp(p.y / r, -1, 1)) / Math.PI * 96; let ph = Math.atan2(p.z, -p.x); if (ph < 0) ph += Math.PI * 2; const ti = ph / (Math.PI * 2) * 144;
    const j = Math.min(95, Math.floor(tj)), i = Math.min(143, Math.floor(ti)), fj = tj - j, fi = ti - i, k = j * 145 + i;
    return (GH[k] * (1 - fi) + GH[k + 1] * fi) * (1 - fj) + (GH[k + 145] * (1 - fi) + GH[k + 146] * fi) * fj; };
  const slopeAt = (p) => { const r = p.length(), j = Math.round(Math.acos(clamp(p.y / r, -1, 1)) / Math.PI * 96); let ph = Math.atan2(p.z, -p.x); if (ph < 0) ph += Math.PI * 2; const k = j * 145 + Math.round(ph / (Math.PI * 2) * 144);
    return clamp(1 + ((GN.getX(k) * SUN.x + GN.getY(k) * SUN.y + GN.getZ(k) * SUN.z) - (p.x * SUN.x + p.y * SUN.y + p.z * SUN.z) / r) * 3.2, 0.22, 1.9) - 1; };
  const scatter = async (geo, count, rng, pick, size, tint, sloped) => {
    const mesh = new THREE.InstancedMesh(geo, floraMat, count), slope = sloped ? new Float32Array(count) : null; let n = 0;
    for (let tries = 0; n < count && tries < count * 6; tries++) {
      // (a place picked on the mean skin is lifted onto the relief and must be free; one given whole (2) stands as it is)
      const got = pick(_pt, rng); if (!got) continue;
      if (got !== 2) { _pt.multiplyScalar((R + skinAt(_pt)) / R); if (!free(_pt)) continue; }
      const s = size(rng, _pt); if (slope) slope[n] = slopeAt(_pt);
      mesh.setMatrixAt(n, standFast(_pt, rng.range(0, 6.28)).multiply(_sc.makeScale(s[0], s[1], s[0])));
      const c = tint(rng, _pt); mesh.setColorAt(n, _ic.setRGB(c[0], c[1], c[2])); n++;
      if (tries % 200 === 199) await ctx.yield();
    }
    mesh.count = n; mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    if (slope) geo.setAttribute('aSlope', new THREE.InstancedBufferAttribute(slope, 1));
    mesh.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), R + 3); root.add(mesh);   // every instance stands on the globe
    return mesh;
  };
  const nTuft = Math.round(21000 * detail * Math.min(density, 1.15)), nFlower = Math.round(2600 * detail * density * (opts.rare ? 1.5 : 1));
  const tufts = await scatter(tuftGeo, nTuft, rGrass,
    (p, rng) => { onSphere(rng, p); return bareAt(p.x, p.y, p.z) < 0.5 || rng.chance(0.4); },
    // (the grass stands in clumps: where the clump noise is high a tuft is up to twice as tall, 0.3 to 1.2 m in all)
    (rng, p) => { const cl = smoothstep(0.05, 0.6, ctx.noise.n3(p.x * 0.33 + 5, p.y * 0.33, p.z * 0.33 - 8)); return [rng.range(1.05, 1.8) * (1 + 0.25 * cl), rng.range(0.34, 0.66) * (1 + 0.95 * cl)]; },
    (rng, p) => { const k = rng.range(0.75, 1.2), g = 0.5 + 0.5 * ctx.noise.n3(p.x * 0.09, p.y * 0.09, p.z * 0.09); return [lerp(0.085, 0.16, g) * k, lerp(0.21, 0.26, g) * k, 0.055 * k]; }, true);
  await ctx.yield();
  const petal = opts.flowerColor || rFlower.pick([[0.17, 0.17, 0.165], [0.19, 0.17, 0.085], [0.125, 0.155, 0.21]]);
  const flowers = await scatter(flowerGeo, nFlower, rFlower,
    (p, rng) => { onSphere(rng, p); return bareAt(p.x, p.y, p.z) < 0.4 && (ctx.noise.fbm3(p.x * 0.045 + 17, p.y * 0.045, p.z * 0.045, 2) > 0.02 || rng.chance(0.22)); },
    (rng) => { const s = rng.range(0.42, 0.64); return [s, rng.range(0.5, 0.95)]; },
    (rng) => { const k = rng.range(0.85, 1.1); return [petal[0] * k, petal[1] * k, petal[2] * k]; });
  await ctx.yield();
  // the seedlings: young shoots in the rows of the three dug beds, each at its own place there
  let shootK = 0;
  const shoots = await scatter(shootGeo, shootAt.length, rSeed,
    (p) => { if (shootK >= shootAt.length) return 0; p.copy(shootAt[shootK++]); return 2; },
    (rng) => { const s = rng.range(0.45, 0.9); return [s, s]; },
    (rng) => { const k = rng.range(0.8, 1.2); return [0.085 * k, 0.21 * k, 0.045 * k]; });
  await ctx.yield();

  // every built thing in two meshes: one-sided stone, wood and tin; two-sided leaves, petals and cloth
  const built = new THREE.Mesh(merge(parts), lit), built2 = new THREE.Mesh(merge(parts2), lit2);
  built.frustumCulled = false; built2.frustumCulled = false; root.add(built, built2);
  const built3 = new THREE.Mesh(merge(parts3), litEarth); built3.frustumCulled = false; root.add(built3);
  await ctx.yield();

  // ------------------------------------------------------------ one thread of smoke from each live mouth, and the hearth's small glow
  {
    const N = 26, pos = [], aT = [], aX = [], aBase = [], aUp = [], aBend = [], aPh = [], idx = [];
    mouths.forEach((mo, k) => {
      const fwd = new THREE.Vector3(0, 1, 0).cross(mo.up).normalize(), o = k * (N + 1) * 2;
      for (let i = 0; i <= N; i++) for (const x of [-1, 1]) {
        pos.push(mo.top.x, mo.top.y, mo.top.z); aT.push(i / N); aX.push(x); aBase.push(mo.top.x, mo.top.y, mo.top.z); aUp.push(mo.up.x, mo.up.y, mo.up.z); aBend.push(fwd.x, fwd.y, fwd.z); aPh.push(mo.ph);
      }
      for (let i = 0; i < N; i++) { const a = o + i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aT', new THREE.Float32BufferAttribute(aT, 1)); g.setAttribute('aX', new THREE.Float32BufferAttribute(aX, 1));
    g.setAttribute('aBase', new THREE.Float32BufferAttribute(aBase, 3)); g.setAttribute('aUp', new THREE.Float32BufferAttribute(aUp, 3)); g.setAttribute('aBend', new THREE.Float32BufferAttribute(aBend, 3));
    g.setAttribute('aPh', new THREE.Float32BufferAttribute(aPh, 1)); g.setIndex(idx);
    const smoke = new THREE.Mesh(g, new THREE.ShaderMaterial({
      uniforms: U, transparent: true, depthWrite: false, side: THREE.DoubleSide,
      vertexShader: /* glsl */`
        attribute float aT, aX, aPh; attribute vec3 aBase, aUp, aBend;
        uniform float uTime;
        varying float vT, vX; varying vec3 vW;
        vec3 at(float t){
          vec3 side = cross(aUp, aBend);
          float wv = t * t;
          return aBase + aUp * (12. * t - 2.5 * wv) + aBend * (5.5 * wv + .5 * wv * sin(uTime * .7 + aPh + t * 5.))
            + side * (.45 * t * sin(uTime * 1.1 + aPh * 2. + t * 7.) + .25 * wv * sin(uTime * .53 + aPh * 3. + t * 3.));
        }
        void main(){
          vec3 c = at(aT), tg = normalize(at(aT + .02) - c);
          vec3 sd = cross(tg, normalize(cameraPosition - c)); sd = sd / max(length(sd), 1e-3);
          vec3 w = c + sd * aX * (.1 + .5 * aT);
          vT = aT; vX = aX; vW = w;
          gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.);
        }`,
      fragmentShader: GLSL_LIGHT + /* glsl */`
        varying float vT, vX; varying vec3 vW;
        void main(){
          float x = clamp(vX, -1., 1.), t = clamp(vT, 0., 1.);
          float a = (1. - x * x) * smoothstep(0., .06, t) * (1. - smoothstep(.5, 1., t)) * .55;
          vec3 c = vec3(.34, .32, .33) * (uSunCol * sunVis(vW) * .95 + uSkyCol * 2.2) + vec3(1., .2, .04) * (1. - smoothstep(0., .3, t)) * 1.1;
          gl_FragColor = vec4(c, a);
        }`,
    }));
    smoke.frustumCulled = false; smoke.renderOrder = 4; root.add(smoke);
    const dp = [], dc = [], dph = [], di = [];
    mouths.forEach((mo, k) => {
      for (const [x, y] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { dp.push(mo.lip.x, mo.lip.y, mo.lip.z); dc.push(x, y); dph.push(mo.ph); }
      di.push(k * 4, k * 4 + 1, k * 4 + 2, k * 4, k * 4 + 2, k * 4 + 3);
    });
    const dg = new THREE.BufferGeometry();
    dg.setAttribute('position', new THREE.Float32BufferAttribute(dp, 3)); dg.setAttribute('aC', new THREE.Float32BufferAttribute(dc, 2)); dg.setAttribute('aPh', new THREE.Float32BufferAttribute(dph, 1)); dg.setIndex(di);
    const dabs = new THREE.Mesh(dg, new THREE.ShaderMaterial({
      uniforms: U, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */`
        attribute vec2 aC; attribute float aPh; uniform float uTime; varying vec2 vC; varying float vK;
        void main(){
          vC = aC; vK = .85 + .15 * sin(uTime * .9 + aPh);
          vec4 mv = viewMatrix * vec4(position, 1.); mv.xy += aC * 1.5;
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */`
        varying vec2 vC; varying float vK;
        void main(){ float d = clamp(1. - length(vC), 0., 1.); gl_FragColor = vec4(vec3(1., .24, .045) * d * d * vK * .75, 1.); }`,
    }));
    dabs.frustumCulled = false; dabs.renderOrder = 5; root.add(dabs);
  }

  const things = [
    { name: 'cone1', deg: L.cone1.deg, lat: L.cone1.lat, top: frames.cone1.top, h: L.cone1.h }, { name: 'chair', deg: L.chair.deg, lat: L.chair.lat, top: frames.chair.top, h: 6.5 },
    { name: 'rose', deg: L.rose.deg, lat: L.rose.lat, top: frames.rose.top, h: 4.25 }, { name: 'cone2', deg: L.cone2.deg, lat: L.cone2.lat, top: frames.cone2.top, h: L.cone2.h },
    { name: 'dead', deg: L.dead.deg, lat: L.dead.lat, top: frames.dead.top, h: L.dead.h },
  ];
  return {
    object: root, radius: R, height: R * 2, center: new THREE.Vector3(0, 0, 0), ground: false, env, layout: L, relief,
    solids: { 'the home planet: cones, chair, screen, table and stem': built, 'the home planet: leaves, petals and cloth': built2, 'the home planet: dug earth, clods and cinder': built3, 'the glass globe over the rose': glass },
    anchors: { things, beds: L.beds.map((b) => ({ deg: b.deg, lat: b.lat, at: b.dir.clone().multiplyScalar(R + b.h0), shoots: b.shoots })), mouths: mouths.map((mo) => mo.lip), globe: frames.rose.centre, crown: new THREE.Vector3(0, R, 0) },
    counts: { tufts: tufts.count, flowers: flowers.count, shoots: shoots.count },
    update(dt, time) {
      if (!opts.env) env.uTime.value = time;
      for (let i = 0; i < mouths.length; i++) lampA[i].w = 1 + 0.16 * Math.sin(time * 0.9 + mouths[i].ph);
    },
    dispose() { tuftGeo.dispose(); flowerGeo.dispose(); shootGeo.dispose(); },
  };
}
