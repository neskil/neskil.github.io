// Gale in Green Glass: THE INSIDE OF A BOTTLE. A three-masted ship, six times life, rides out a gale on a blue sea
// inside a bottle of thick old green glass that lies on a study table. THE ROOM STANDS BEYOND THE GLASS, SHARP, AS REAL
// SHAPES AT PLACES OF THEIR OWN (ROOM, rmTrace: met by the sight itself, so they slide against one another as we fly):
// on one side a colossal lit lamp (brass font, burner with its milled wheel, a tall clear chimney, a plain bright flame)
// and the table's things (a pile of three great books with a ribbon and a magnifying glass on its edge, a rolled chart,
// a globe in its stand, a cut-glass inkwell with a quill, brass dividers) before a panelled wall with a case of
// butterflies and a barometer; on the other the wall of shelves from floor to cornice with a tall clock and a moonlit
// window; behind the base a small landscape of hills; far off the chimney breast and its fire; overhead two beams and
// the lamp's gold disc. The glass is clear along its long wall and bends the room only where it turns in (shoulder,
// neck, base) and in a few slow waves; it tints, carries the window's and the lamp's light as soft shapes, and mirrors
// at a grazing eye (VAULT_FRAG); a great pale moth clings to its outside between the lamp and her main topsail, and
// its shadow crosses her canvas as it walks (MOTH in the part, MOTH_AT here). Ahead of her bow the shoulder closes to the neck and its cork, astern stands the base wall with its
// pushed-up dome. The sea is water and fills the bottle from wall to wall: it runs up the glass and slides back (RUNUP).
// THE FLIGHT IS FIVE PASSES, EACH LAID BY RULE OF HER OWN MEASURES (routePoints): we come in level along the bottle,
// she whole and small; sink to the sea down her weather side and pass under her bows, ahead of her stem and below her
// jib-boom's end, so she towers; run aft up her lee side, near, from her rail's height to her tops; rise out on her
// lee quarter, her stern on our quarter and the great following sea astern of her, and come round astern of her in
// one arc that closes onto her line, she whole in the bottle; stoop down the gold road of her wake, straight in through her open stern
// (one wide casement, SHIP.casement in the part), down the lamp-lit cabin, to a
// small picture in a gilt frame under its own brass lamp on the forward bulkhead. The canvas of that picture is the
// exit opening: NOTHING is built on, in or before it. The ship (hull, rig, sails, stern, cabin, frame) is the hero
// part, src/parts/gale-in-green-glass.js.
//
// FRAME. Mean sea y 0. The ship's frame at rest IS the world's: keel on x 0, bow toward -Z, port (weather) -X. The
// picture's centre is P (0, 15, 0); the last straight is the z axis at x 0, y 15. The vault is one surface of glass
// turned about the axis through (0, 56, -50) along (0.470, 0, -0.883): radius 250 along the body, the shoulder and the
// neck ahead of her (NECK), the base wall astern (FOOT); the level entry axis is parallel to it.
//
// EVERYTHING GOES BY THE WORLD CLOCK OR BY PLACE: the ship's small roll and pitch (one law, motionAt), the swells, the
// flying white, the spray at the weather bow on every plunge, the lamps. Nothing begins, turns or ends because the
// visitor comes; no light differs by the metres flown. This world reads neither the world before it nor any series.
//
// MEDIA (kept out of a tube of 2.5 m round the flown line BY PLACE, whole 1 m further out, and out of her hull and cabin): flying flecks of
// white, spindrift off the following sea, bow spray, rain. BODIES (kept off the route by place): the ship and all her
// gear, the cabin lamp, the sea, the glass.
//
// BEHIND THE ENTRY: for 60 m back along the level entry axis and 15 m to each side there is only air: the sea is 40 m
// and more below, the crown of the vault's base wall 80 m behind the entry point, the glass 220 m and more to the side.
// camera.nearThrough is not set.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { buildHero, halfBeam, SHIP, MOTION, motionAt, MOTH, MOTH_GLSL } from '../parts/gale-in-green-glass.js';

const PALETTE = ['#5FA07E', '#17392B', '#3F7F72', '#ECE6D6', '#14110F', '#C99A4A', '#B8862E', '#FFB45A'];
const AXIS = new THREE.Vector3(0.470, 0, -0.883).normalize(), MID = new THREE.Vector3(0, 56, -50), VAULT_R = 250;
const WIND = new THREE.Vector3(0.86, 0, 0.50).normalize();
// THE AIR IN THE BOTTLE IS CLEAR. Its thin haze is set from its result: HAZE.left of a colour is left at HAZE.at metres,
// and it goes toward HAZE.col, a dusk slate that is not the glass's colour. Every shader here hazes by
// 1 - exp(-(den * metres)^2), so den follows from the result.
const HAZE = { left: 0.9, at: 330, col: '#1D282E' }, FOG_DEN = Math.sqrt(-Math.log(HAZE.left)) / HAZE.at;
const P3 = (a) => new THREE.Vector3(a[0], a[1], a[2]);
// THE ENTRY (the join sheet's law: the whole ship, waterline to trucks and pennant, inside a round view 32 degrees wide
// about the level entry axis). The axis is parallel to the vault's and crosses her keel plane at ENTRY.aimZ, 30 m abaft
// her middle, so the round view is centred on her as she is seen from off her port quarter; the entry point stands
// ENTRY.back metres back along it and ENTRY.height over the mean sea. Counted at the worst of her motion: every point
// of her within 15.8 degrees of the axis (scratchpad count; the report has the angles).
// ENTRY.level: the metres flown level on the axis from the entry; ENTRY.hold: how far beyond them one more point stands
// on the axis, so that every span of those level metres is exactly straight (the same rule as the last line's z 80).
const ENTRY = { aimZ: -20, back: 345, height: 78, level: 60, hold: 10 };
const ENTRY_E = new THREE.Vector3(0, ENTRY.height, ENTRY.aimZ).addScaledVector(AXIS, -ENTRY.back);
// along the vault's axis from her middle, in metres: where the entry point stands, and the rim of the base wall, whose
// dome (pushed in FOOT.push metres) keeps its crown FOOT.behind metres behind the entry point
const S_ENTRY = ENTRY_E.clone().sub(MID).dot(AXIS), FOOT = { behind: 80, push: 40 }, S_RIM = S_ENTRY - FOOT.behind - FOOT.push;

// ------------------------------------------------------------------ the route, in metres of the place
// FIVE PASSES, EACH A RULE OF HER OWN MEASURES AND OF THE GLASS (no station is typed and none comes from a picture).
// HER MEASURES: HULL.loa, her length over all (from her jib-boom's end to her spanker boom's end); HULL.half, her half
// beam; her stem (SHIP.stemZ), her taffrail (SHIP.sternZ), her lower tops (SHIP.topY). Shares below are shares of loa.
// 1 THE ENTRY (the join; not touched): four points 20 m apart on the level entry axis and a fifth ENTRY.hold on.
// 2 DOWN TO THE SEA ON HER WEATHER BOW AND IN UNDER HER BOWS: one straight line down her weather side, sinking evenly
//   from the entry's height to BOW.low over the mean sea (2 m and more over the highest crest by count), to where a
//   quarter turn of radius BOW.r begins abeam of its own centre; the centre stands BOW.out off her weather side, so
//   the line then runs ATHWART HER BOWS, BOW.ahead ahead of her stem and under her jib-boom's end, with her stem, her
//   bowsprit and her foremast towering on our right hand; a second quarter turn of the same radius about a centre at
//   her lee side's own breadth brings the line round to run aft.
// 3 UP HER LEE SIDE, NEAR: from LEE.near off her side at her bow to LEE.far off it at her taffrail, rising from the
//   sea to the height of her tops.
// 4 OUT ASTERN AND ONE ARC ROUND ASTERN OF HER: on along her keel's way, rising, and then one arc toward her and
//   onto her own line. The arc begins WIDE and closes as it comes round: its radius falls from its first to its
//   last, ASTERN.close of her lee offing, by the power ASTERN.fall of the turning still to come; its first radius is
//   the one that brings it onto her line. So it begins while her stern is still on our quarter and she is never
//   behind us: she comes whole into the look from her lee quarter and then from astern, the seas that follow her
//   beyond. It ends on her line at ASTERN.near; every point of it stands further from the glass than ASTERN.clear
//   (counted on the wall itself; the report has the least). The line rises evenly from her taffrail abeam to the
//   arc's top, where it has turned ASTERN.top degrees.
// 5 DOWN ONTO HER WAKE AND IN: from its top the arc is the stoop: ASTERN.dive degrees down to ASTERN.lift over the
//   last line at ASTERN.near metres from the picture (from there on the whole canvas stands inside her open stern,
//   see the part's CASEMENT); the line comes level LINE.z0 + 10 metres from it and the last points lie ON it (the join).
// THE ARC'S HEIGHT IS WHAT THAT STOOP GIVES: its top stands tan(dive) times the length of the arc from there on
// over that near point. (So high and no higher: how far astern the arc stands is given by ASTERN.near and its shape.)
const DEG = Math.PI / 180;
const HULL = { loa: SHIP.boomEnd[2] - SHIP.jibEnd[2], half: halfBeam(SHIP.masts[1].z) };
const BOW = { ahead: 0.2, low: 11, r: 0.22, out: 0.2, step: 22.5 }, LEE = { near: 0.22, far: 0.35, n: 5 };
const ASTERN = { dive: 40, clear: 27, near: 150, lift: 8, step: 22.5, close: 0.25, fall: 3, top: 67.5 };
const LINE = { x: 0, y: SHIP.P[1], z0: 70 };
// her middle: on her keel's line half way between her two ends, at the height where her main lower topsail stands
const HER = [0, SHIP.mainTopsail[1], (SHIP.jibEnd[2] + SHIP.boomEnd[2]) / 2];
// a place of the bottle's frame in the world's
const SIDE = new THREE.Vector3().crossVectors(AXIS, new THREE.Vector3(0, 1, 0)).normalize();
const atSL = (s, l, y) => [MID.x + AXIS.x * s + SIDE.x * l, y, MID.z + AXIS.z * s + SIDE.z * l];
// the stations those rules give (computed once, on first use: the glass's measures stand further down this file)
let STATIONS = null;
function stations() {
  if (STATIONS) return STATIONS;
  const rB = BOW.r * HULL.loa, zB = SHIP.stemZ - BOW.ahead * HULL.loa, cxW = -(HULL.half + BOW.out * HULL.loa), xLee = HULL.half + LEE.near * HULL.loa, cxL = xLee - rB;
  const xOut = HULL.half + LEE.far * HULL.loa, yNear = LINE.y + ASTERN.lift, tan = Math.tan(ASTERN.dive * DEG);
  // THE ARC ROUND ASTERN OF HER: its radius falls from rWide to rClose by the law above (rWide is found so that the
  // arc ends on her line); laid by small steps of the turning, a point every ASTERN.step degrees. From its top
  // (ASTERN.top degrees turned) it is the stoop. shape: the points from its beginning (x from her line, z from its
  // beginning, the metres flown along it, the degrees turned); back: how far its end lies astern of its beginning;
  // half: the metres flown along it to its top; quarter: the metres from its top to its end
  const rClose = ASTERN.close * xOut, shape = [], N = 720, law = (a) => Math.pow(1 - a / Math.PI, ASTERN.fall);
  let closing = 0; for (let i = 0; i < N; i++) { const am = (i + 0.5) * Math.PI / N; closing += law(am) * Math.sin(am) * Math.PI / N; }
  const rWide = rClose + (xOut - 2 * rClose) / closing;
  let ax = xOut, az = 0, al = 0, half = 0;
  for (let i = 0; i <= N; i++) {
    const a = i * 180 / N; if (Math.abs(a / ASTERN.step - Math.round(a / ASTERN.step)) < 1e-6) shape.push([ax, az, al, a]);
    if (Math.abs(a - ASTERN.top) < 1e-6) half = al;
    const am = (i + 0.5) * Math.PI / N, rho = rClose + (rWide - rClose) * law(am), ds = rho * Math.PI / N;
    ax -= Math.sin(am) * ds; az += Math.cos(am) * ds; al += ds;
  }
  const arcLen = al, back = shape[shape.length - 1][1], quarter = arcLen - half;
  // the arc beginning z1 metres astern of the picture: its points, and its height (what the stoop from it gives)
  const turn = (z1) => {
    const zEnd = z1 + back, yTop = yNear + tan * (quarter + zEnd - ASTERN.near), leg = z1 - SHIP.sternZ;
    // (the rise is even along the way from her taffrail abeam to the arc's top)
    const rise = (l) => lerp(SHIP.topY, yTop, (leg + l) / (leg + half));
    return { yTop, zEnd, rise, leg, pts: shape.map(([x, z, l, a], i) => [i === shape.length - 1 ? LINE.x : x, a <= ASTERN.top ? rise(l) : yTop - tan * (l - half), z1 + z]) };
  };
  // the arc ends on her line at ASTERN.near: the last line's own stretch begins there
  const z1 = ASTERN.near - back;
  return (STATIONS = { rB, zB, cxW, cxL, xLee, xOut, rWide, rClose, yNear, tan, xFar: shape[(shape.length - 1) / 2][0], z1, ...turn(z1) });
}
export function routePoints() {
  const S = stations(), pts = [], yB = BOW.low, mix3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
  for (let k = 0; k * 20 <= ENTRY.level; k++) pts.push(ENTRY_E.clone().addScaledVector(AXIS, 20 * k).toArray());
  const H = ENTRY_E.clone().addScaledVector(AXIS, ENTRY.level + ENTRY.hold).toArray(); pts.push(H);
  // 2: the straight down her weather side (a point every 75 m or so), the quarter turn, athwart her bows, the quarter turn
  const A0 = [S.cxW - S.rB, yB, S.zB + S.rB], nA = Math.round(Math.hypot(A0[0] - H[0], A0[2] - H[2]) / 75);
  for (let k = 1; k < nA; k++) pts.push(mix3(H, A0, k / nA));
  for (let a = 0; a <= 90.01; a += BOW.step) pts.push([S.cxW - S.rB * Math.cos(a * DEG), yB, S.zB + S.rB - S.rB * Math.sin(a * DEG)]);
  pts.push([(S.cxW + S.cxL) / 2, yB, S.zB]);
  for (let a = 0; a <= 90.01; a += BOW.step) pts.push([S.cxL + S.rB * Math.sin(a * DEG), yB, S.zB + S.rB - S.rB * Math.cos(a * DEG)]);
  // 3: up her lee side to her taffrail abeam
  for (let k = 1; k <= LEE.n; k++) { const t = k / LEE.n, e = smoothstep(0, 1, t); pts.push([lerp(S.xLee, S.xOut, e), lerp(yB, SHIP.topY, e), lerp(S.zB + S.rB, SHIP.sternZ, t)]); }
  // 4: out astern, climbing, and the arc round astern of her
  const nO = Math.max(1, Math.round((S.z1 - SHIP.sternZ) / 50));
  for (let k = 1; k < nO; k++) pts.push([S.xOut, S.rise(S.leg * (k / nO - 1)), lerp(SHIP.sternZ, S.z1, k / nO)]);
  for (const p of S.pts) pts.push(p);
  // 5: (the arc's second half is the stoop onto her wake) the easing onto the line, the line
  pts.push([LINE.x, lerp(S.yNear, LINE.y, 0.6), (ASTERN.near + LINE.z0 + 10) / 2]);
  for (const z of [LINE.z0 + 10, LINE.z0, 60, 40, 20, 0]) pts.push([LINE.x, LINE.y, z]);
  return pts;
}
// the metres flown at which the route first meets a place (a test of the point), looking from `from` on
function metresWhere(path, test, from = 0) {
  const p = new THREE.Vector3();
  for (let m = from; m <= path.length; m += 0.5) { path.posAtDist(m, p); if (test(p, m)) return m; }
  return path.length;
}

// ------------------------------------------------------------------ the flight on that route: its places, the one look, the pace
// THE PLACES, as metres flown: each is where the route first meets a place of the ship or of its own stations (a test
// of the route's own point at even half metres): her mizzen abeam on her weather side, the turn under her bows, the
// run athwart her bows, her keel's line, her lee bow, the run up her lee side, her main mast and her taffrail abeam,
// the arc astern (its beginning, its far point where it has turned half way, its end on her line), ASTERN.near, the line.
// THE ONE LOOK, ON HER, of full weight (the gaze IS the look). Its point is always a measure of the ship and slides
// from one to the next between two places of the line, eased over the metres between them:
//   her middle (HER) from the entry down her weather side;
//   her fore top from her mizzen abeam to the run athwart her bows: THE LOOK GOES UP HER as we come in under them;
//   a point of her keel's line LOOK.ahead (a share of her length) further aft than we are, at LOOK.side of the way
//     from her rail to her tops, up her lee side (her deck, boats, shrouds and quarter go by); it ends at her lantern;
//   her middle again from the arc's beginning to its far point (she comes whole into the look, the bottle round her);
//   her lantern and then her open stern from the arc's far point to ASTERN.near, and so in.
// THE LOOK IS LED: its bearing is never handed over further than LOOK.lead off our heading (a soft minimum of
// hardness LOOK.hard: the point's turn has no corner); its height is kept. So out astern of her, where she is behind
// us, the gaze stands LOOK.lead to her side of our heading (her stern on our quarter, her wake and the seas that
// follow her) and comes back onto her by itself as the arc brings her round: there is no second look and no hand-over.
const LOOK = { weight: 1, lead: 72 * DEG, hard: 30, her: HER, ahead: 0.3, side: 0.5 };
// PACE, each change from a place to a place: PACE.down from the entry down her weather side; PACE.bow on the two
// quarter turns and athwart her bows; PACE.lee up her lee side; PACE.out astern of her, easing to PACE.turn by
// the arc's far point; PACE.stoop down its second half onto her wake; PACE.line on the last line (no braking before the exit)
const PACE = { down: 1.25, bow: 0.74, lee: 0.95, out: 1.2, turn: 0.74, stoop: 1.0, line: 1.05 };
export const wallGapAt = (p) => wallGapJS(p.x, p.y, p.z);
export function flightPlan(path) {
  const L = path.length, M = SHIP.masts, S = stations(), after = (test, from) => metresWhere(path, test, from), mHold = ENTRY.level + ENTRY.hold;
  const mMizzenW = after((p) => p.z < M[2].z, mHold), mBowIn = after((p) => p.z < S.zB + S.rB, mMizzenW), mAthwart = after((p) => p.x > S.cxW, mBowIn);
  const mKeel = after((p) => p.x > 0, mAthwart), mLeeBow = after((p) => p.x > S.cxL, mKeel), mLeeRun = after((p) => p.z > S.zB + S.rB, mLeeBow);
  const mMainL = after((p) => p.z > M[1].z, mLeeRun), mTaffL = after((p) => p.z > SHIP.sternZ, mMainL), mTurn = after((p) => p.z > S.z1, mTaffL);
  const mFar = after((p) => p.x < S.xFar, mTurn), mNear = after((p) => p.z < ASTERN.near + 0.5, mFar);
  const mLine = after((p) => p.z < LINE.z0 + 10, mNear), mLine40 = after((p) => p.z < 40, mLine);
  const _a = new THREE.Vector3(), _t = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3(), _look = new THREE.Vector3();
  const her = P3(LOOK.her), foreTop = P3(SHIP.tops[0]), lantern = P3(SHIP.lantern), sternWindow = P3(SHIP.sternWindow);
  const sideY = lerp(SHIP.railY, SHIP.topY, LOOK.side);
  // THE LOOK IS LED: its bearing is held within LOOK.lead of the heading (softly, LOOK.hard), its height is kept: the
  // handed point comes round toward the heading about the upright, never down
  const led = (target, out) => {
    out.copy(target).sub(_a); const far = Math.max(out.length(), 1e-3), flat = Math.max(Math.hypot(out.x, out.z), 1e-3), pitch = Math.atan2(out.y, flat);
    const bearing = Math.atan2(_t.x * out.z - _t.z * out.x, _t.x * out.x + _t.z * out.z), ang = Math.abs(bearing);
    const cap = Math.acos(Math.min(1, Math.cos(LOOK.lead) / Math.max(Math.cos(pitch - Math.asin(clamp(_t.y, -1, 1))), 1e-3)));
    const soft = Math.min(ang, -Math.log(Math.exp(-LOOK.hard * ang) + Math.exp(-LOOK.hard * cap)) / LOOK.hard), turn = Math.atan2(_t.z, _t.x) + Math.sign(bearing) * soft;
    return out.set(Math.cos(turn) * Math.cos(pitch), Math.sin(pitch), Math.sin(turn) * Math.cos(pitch)).multiplyScalar(far).add(_a);
  };
  const lookPoint = (m, out) => {
    path.posAtDist(m, _a); path.tangentAtDist(m, _t);
    out.copy(her).lerp(foreTop, smoothstep(mMizzenW, mAthwart, m));
    // up her lee side: the point of her keel's line further aft than we are, never abaft her lantern
    _c.set(0, sideY, Math.min(_a.z + LOOK.ahead * HULL.loa, lantern.z)).lerp(lantern, smoothstep(mMainL, mTaffL, m));
    out.lerp(_c, smoothstep(mKeel, mLeeRun, m));
    out.lerp(her, smoothstep(mTurn, mFar, m));
    _c.copy(lantern).lerp(sternWindow, smoothstep(mFar, mNear, m));
    out.lerp(_c, smoothstep(mFar, mNear, m));
    return led(_b.copy(out), out);
  };
  const pace = (u) => {
    const m = u * L;
    let v = lerp(PACE.down, PACE.bow, smoothstep(mMizzenW, mBowIn, m));
    v = lerp(v, PACE.lee, smoothstep(mLeeRun, mMainL, m));
    v = lerp(v, PACE.out, smoothstep(mMainL, mTaffL, m));
    v = lerp(v, PACE.turn, smoothstep(mTaffL, mFar, m));
    v = lerp(v, PACE.stoop, smoothstep(mFar, mNear, m));
    return lerp(v, PACE.line, smoothstep(mNear, mLine, m));
  };
  return {
    duration: 45, pace, lookPoint,
    places: { mHold, mMizzenW, mBowIn, mAthwart, mKeel, mLeeBow, mLeeRun, mMainL, mTaffL, mTurn, mFar, mNear, mLine, mLine40 },
    // the look lets go BETWEEN TWO PLACES OF THE LAST LINE (from its first point, mLine, to mLine40, 40 m before the
    // canvas), where its point lies dead ahead; it rises over the same length of the entry, where she lies on the entry's axis
    pois: [{ at: (time, u) => lookPoint(u * L, _look), from: 0, to: mLine40 / L, weight: LOOK.weight, fade: (mLine40 - mLine) / mLine40, steady: true }],
  };
}

// ------------------------------------------------------------------ the vault: one skin of green glass, seen from inside
// a surface of revolution about the axis: the base wall (a shallow dome pushed inward FOOT.push metres, its rim S_RIM along
// the axis from the ship's middle, so that its crown stands FOOT.behind metres behind the entry point), the cylinder,
// the shoulder (NECK.s0 to NECK.s1 metres ahead) closing to the neck, of radius NECK.r, that ends in a dark cork
// the wall's radius at s metres along the bottle from her middle: the base wall's dome, the body, the shoulder, the neck
const NECK = { s0: 440, s1: 680, r: 50, end: 900 };
function vaultRadius(s) {
  if (s <= S_RIM) return 0;
  if (s < S_RIM + FOOT.push) return VAULT_R * Math.sqrt(Math.max(0, 1 - (s - S_RIM) / FOOT.push));
  if (s <= NECK.s0) return VAULT_R;
  if (s >= NECK.s1) return NECK.r;
  return NECK.r + (VAULT_R - NECK.r) * (0.5 + 0.5 * Math.cos(Math.PI * (s - NECK.s0) / (NECK.s1 - NECK.s0)));
}
async function vaultGeometry(ctx) {
  const prof = [];
  for (let k = 0; k <= 12; k++) { const r = VAULT_R * k / 12; prof.push([S_RIM + FOOT.push * (1 - (r / VAULT_R) ** 2), r]); }
  for (let k = 1; k <= 12; k++) prof.push([S_RIM + (NECK.s0 - S_RIM) * k / 12, VAULT_R]);
  for (let k = 1; k <= 20; k++) { const s = NECK.s0 + (NECK.s1 - NECK.s0) * k / 20; prof.push([s, vaultRadius(s)]); }
  prof.push([790, NECK.r], [NECK.end, NECK.r], [NECK.end - 3, NECK.r - 3], [NECK.end - 9, NECK.r * 0.6], [NECK.end - 12, 0]);
  const up = new THREE.Vector3(0, 1, 0), side = new THREE.Vector3().crossVectors(AXIS, up).normalize(), N = 96, pos = [], nrm = [], idx = [], v = new THREE.Vector3();
  for (let i = 0; i < prof.length; i++) {
    if (i % 4 === 3) await ctx.yield();
    const [s, r] = prof[i];
    // the wall's own inward normal in the plane of (along, out): square to the profile's run at this ring
    const a = prof[Math.max(0, i - 1)], b = prof[Math.min(prof.length - 1, i + 1)], ds = b[0] - a[0], dr = b[1] - a[1], l = Math.hypot(ds, dr) || 1, ns = dr / l, nr = -ds / l;
    for (let j = 0; j <= N; j++) {
      const an = j / N * Math.PI * 2, c = Math.cos(an), sn = Math.sin(an);
      v.copy(MID).addScaledVector(AXIS, s).addScaledVector(up, r * c).addScaledVector(side, r * sn); pos.push(v.x, v.y, v.z);
      v.set(0, 0, 0).addScaledVector(AXIS, ns).addScaledVector(up, nr * c).addScaledVector(side, nr * sn); nrm.push(v.x, v.y, v.z);
    }
  }
  await ctx.yield();
  for (let i = 0; i < prof.length - 1; i++) for (let j = 0; j < N; j++) { const q = i * (N + 1) + j; idx.push(q, q + N + 1, q + N + 2, q, q + N + 2, q + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3)); g.setIndex(idx); return g;
}
const VAULT_VERT = /* glsl */`
  varying vec3 vW, vN;
  void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; vN = normal; gl_Position = projectionMatrix * viewMatrix * w; }`;
// THE ROOM is drawn in its own frame: x metres along the bottle from her middle (toward the neck), y the world's height,
// z metres across the bottle (toward the dark side). The bottle lies on the chart table (ROOM.tableY, 16 m under its
// lowest glass); the lamp stands at ROOM.lamp (LAMP_AT below).
// ROOM.lift: the thick foot of the glass turns a level sight by this much (a tangent; negative is up), less with the
// wall's height. ROOM.cornice, ROOM.rail: where the walls' cornice and picture rail run. ROOM.sheet: the chart's sheet on
// the table; ROOM.globe (its middle and radius), ROOM.ink, ROOM.dividers: where those things stand.
const ROOM = { tableY: -210, lift: -0.06, liftTop: 150, floorY: -1500, ceilY: 2300, cornice: 2130, rail: 1420, dado: 430, s0: -2100, s1: 3300, l0: -2600, l1: 1750,
  table: [-1650, 2800, -1900, 1380], sheet: [-1440, 2350, -1500, -285], globe: [-1250, 250, -600, 230], ink: [1330, -470], dividers: [1810, -520], win: [480, 540], bay: 503.3, bay0: -1600, winBays: 4, fire: [860, -200], star: [260, 800], lamp: [-330, -614], pile: [650, -690], flameY: 506, fall: 320, dusk: 0.1, flameH: 190, flameW: 44, chimneyTop: 1180 };
// THE LAMP STANDS ON THE TABLE BESIDE THE BOTTLE'S BASE END (ROOM.lamp: metres along the bottle from her middle, and
// across it; its flame ROOM.flameY high): abreast of her wake, on her weather beam. So its light falls on her from
// her weather side, comes down her wake from behind whoever flies in astern of her, and the room's far end beyond
// her bow, ROOM.fall metres and more from it, is the study's unlit end. THE KEY'S BEARING IS THE LAMP'S OWN.
// The pile of books stands at ROOM.pile, beside the bottle's shoulder, its rolled chart clear of the lamp's foot
// (PILE_DS: how far that is from where its measures below were first written); the inkwell and the dividers beyond it.
// THE ROOM'S DUSK: the study is lit by this one lamp, so what stands further along the room from it stands in less
// light: all but ROOM.dusk of the room's light goes with the square of the way along the room, half at ROOM.fall
// (what gives its own light keeps it: the fire, the moon, the flame).
// THE SHELVES' BAYS: an upright stands every ROOM.bay metres along the dark wall, counted from ROOM.bay0; THE SECOND
// WINDOW stands ROOM.winBays whole bays along the wall from the first (ROOM.winPitch), so both sit alike in the shelving
ROOM.winPitch = ROOM.winBays * ROOM.bay;
// THE ROOM IS WHOLE AND LIT AT BOTH ITS ENDS: ONE LIGHT LAW FOR EVERY FACE OF ITS SHELL (the four walls and the
// ceiling; rmLit). A face is lit by
//   THE LAMP, by the face's own way from it, and then by the dusk along the room (ROOM.dusk, ROOM.fall: as above);
//   THE FIRE in the hearth of the end wall beyond the bottle's neck (ROOM.fire: metres across the room, its height):
//     red gold (FIRE.col), FIRE.k strong at its bed, half of that FIRE.fall metres from it by the square of the way,
//     breathing slowly on the world clock (FIRE.breathe of it comes and goes); the bed glows FIRE.lift over the hearth;
//   THE ROOM'S SHADE (ROOM.shade): what walls, ceiling and the moonlit windows give back. It stands wherever the
//     lamp's light has gone along the room (its share is what the dusk has taken), so no face is darker than its own
//     colour in that shade, and by the lamp nothing is changed.
// The two walls of shelves that face the lamp (the long wall and the wall behind the bottle's base) take the lamp by
// its own way to them, as strong at the wall's nearest place as on the long wall (SHELF.lamp, SHELF.cold: the lamp's
// share on spines and wood, the moon's cold share), and the fire and the shade besides.
ROOM.shade = [0.2, 0.21, 0.24];
const FIRE = { col: [1.0, 0.42, 0.13], k: 1.1, fall: 800, lift: 60, breathe: 0.3 }, SHELF = { lamp: [0.56, 0.42, 0.24], cold: [0.14, 0.22, 0.36] };
// THE HEARTH in the end wall (metres from the fire's own place, ROOM.fire): the chimney breast HEARTH.half to either
// side of it; the mantel shelf's top HEARTH.shelf over it; the candlesticks HEARTH.candle to either side, the ginger
// jar and the pile of folios HEARTH.ends out; the dark mirror's half sizes and its middle's height over the shelf.
// CANDLE: a candle's light, CANDLE.k strong at its flame, half of that CANDLE.reach metres from it. MIRROR: the
// share of the room's light the dark mirror's old glass gives back; how far its foxed edges dull that
// THE WALL OF BOOKS BEHIND THE BOTTLE'S BASE (metres across the room, and heights): the pier of panelling stands with
// its middle at BACK.pier, one bay wide; its landscape's half sizes and its middle's height (BACK.pic), its frame's
// breadth; the ladder hangs BACK.ladder bays from the pier toward the long wall of books, from the brass rail at
// BACK.rail, a rung every BACK.rung metres. BUST.y: the height of the bracket under the landscape that carries the
// marble bust. JOIST: the ceiling's joists (their pitch across the room, their half
// breadth, how much darker than the plaster they are, how deep the shade beside each)
const BUST = { y: 70 }, JOIST = { pitch: 435, half: 42, dark: 0.3, shade: 0.22 }, BACK = { pier: -70, pic: [175, 120, 640], frame: 34, ladder: 1, rail: 1480, rung: 140 };
const HEARTH = { half: 760, shelf: 566, candle: 480, ends: 660, mirror: [330, 430, 524] }, CANDLE = { k: 0.5, reach: 245 }, MIRROR = { k: 0.4, fox: 0.6 };
const LAMP_AT = P3(atSL(ROOM.lamp[0], ROOM.lamp[1], ROOM.flameY)), KEY_DIR = LAMP_AT.clone().sub(MID).normalize(), PILE_DS = ROOM.pile[0] + 330;
// THE MOTH'S PLACE ON THE GLASS (a rule of the lamp where it stands and of the ship): it clings where the straight way
// from the flame (LAMP_AT) to the middle of her main lower topsail (SHIP.mainTopsail) comes in through the long wall.
// So at the middle of its walk its shadow lies on that sail, and as it walks MOTH.walk metres each way along the
// bottle the shadow crosses her canvas from her mizzen to her fore mast. MOTH_AT.s: metres along the bottle from her
// middle; MOTH_AT.up: degrees round the wall from its top toward the lamp's side
const MOTH_AT = (() => {
  const a = LAMP_AT.clone().sub(MID), b = P3(SHIP.mainTopsail).sub(MID), rad = (v) => Math.hypot(v.dot(SIDE), v.y);
  let lo = 0, hi = 1;   // the share of the way from the flame (outside the glass) to the sail (inside it) at which the wall stands
  for (let i = 0; i < 40; i++) { const k = (lo + hi) / 2; if (rad(a.clone().lerp(b, k)) > MOTH.R) lo = k; else hi = k; }
  const h = a.clone().lerp(b, hi);
  return { s: h.dot(AXIS), up: Math.atan2(-h.dot(SIDE), h.y) / DEG };
})();
const F1 = (v) => v.toFixed(1);
// THE LAMP'S FONT IS TURNED BRASS: three beads are turned round it at these heights (the room's metres; the font stands
// from the table, ROOM.tableY, to its collar at 118): each FONT.bead metres deep, bright on its upper side, a dark line under it
const FONT = { beads: [-140, 15, 92], bead: 10 };
// PART ONE OF THE ROOM: its frame, the chart that covers the table (our own: a coast, rhumb lines to one compass
// star, no letter and no numeral), the lamp's light on the table, the room's shell
const ROOM_GLSL_A = /* glsl */`
  uniform vec3 uLampR; uniform vec4 uFlame, uRoomPh; uniform vec2 uHearthPh;
  vec3 rmP(vec3 w){ vec3 r = w - uMid; return vec3(dot(r, uAxis), w.y, dot(r, uSide)); }
  // THE LAMP'S LIGHT FALLS WITH THE SQUARE OF THE WAY FROM IT: half of it is left ROOM.fall metres off (d2: that way squared)
  float rmFall(float d2){ return 1. / (1. + d2 / ${F1(ROOM.fall * ROOM.fall)}); }
  vec3 rmD(vec3 d){ return vec3(dot(d, uAxis), d.y, dot(d, uSide)); }
  float rh(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  // THE FIRE'S LIGHT at a place p of the room (FIRE): by the square of the way from its bed, breathing on the clock
  vec3 rmFire(vec3 p){
    vec3 v = p - vec3(${F1(ROOM.s1)}, ${F1(ROOM.fire[1] + FIRE.lift)}, ${F1(ROOM.fire[0])});
    float br = ${(1 - FIRE.breathe).toFixed(2)} + ${(2 * FIRE.breathe).toFixed(2)} * texture2D(uNoise, vec2(uTime * .045 + uRoomPh.y, .61)).r;
    return vec3(${FIRE.col.map((v) => v.toFixed(2)).join(', ')}) * (${FIRE.k.toFixed(2)} * br / (1. + dot(v, v) / ${F1(FIRE.fall * FIRE.fall)}));
  }
  // THE ROOM'S LIGHT LAW: what a face of colour alb shows at p under the lamp's light there (lamp: by the face's own
  // way), the dusk along the room, the fire, and the room's shade where the lamp's light has gone
  vec3 rmLit(vec3 alb, vec3 lamp, vec3 p){
    float ds = p.x - uLampR.x, k = ${ROOM.dusk.toFixed(2)} + ${(1 - ROOM.dusk).toFixed(2)} * rmFall(ds * ds);
    return alb * (lamp * k + rmFire(p) + vec3(${ROOM.shade.map((v) => v.toFixed(3)).join(', ')}) * (1. - k));
  }
  // a line of half width w metres at d metres from it, seen from t metres off: never drawn narrower than a pixel and
  // a half (the one floor; under it the line carries its share of that width, and a third more)
  float rmLine(float d, float w, float t){ float ww = max(w, t * .0022); return (1. - smoothstep(ww, ww * 1.7, abs(d))) * min(1., w / ww + .35); }
  // the chart's paper at a place p (metres), seen from t metres: x the ink, y the land's wash
  vec2 rmInk(vec2 p, float t){
    float land = texture2D(uNoise, p * .00019 + .37).r + .3 * texture2D(uNoise, p * .0008).g;
    float fw = max(fwidth(land), 2e-4), coast = 1. - smoothstep(fw, fw * 2.6, abs(land - .62));
    vec2 v = p - vec2(${F1(ROOM.star[0])}, ${F1(ROOM.star[1])}); float r = length(v), a = atan(v.y, v.x + 1e-4);
    float da = abs(fract(a / .3927 + .5) - .5) * .3927, rhumb = rmLine(r * sin(da), 4.5, t) * smoothstep(60., 200., r) * (.45 + .55 * step(.5, fract(a / .7854 + .25)));
    // the star: eight points, each half dark and half left pale, in one ring
    float k = abs(fract(a / .7854 + .5) - .5) * 2., pt = 250. * (.26 + .74 * pow(clamp(1. - k, 0., 1.), 3.));
    float star = step(r, pt) * step(0., fract(a / .7854 + .5) - .5), ring = rmLine(r - 285., 7., t);
    return vec2(clamp(max(max(coast * .9, rhumb * .7), max(star, ring)), 0., 1.), smoothstep(.62 - fw, .62 + fw, land));
  }
  // the lamp's light on the table at p: a pool round the font's own shadow, falling with the square of the way; where
  // the flame's light to that place has passed through the bottle it lies green, with one bright line (the glass gathers it)
  vec3 rmPool(vec2 p){
    vec2 dv = p - uLampR.xz; float d2 = dot(dv, dv), e = 1.9 / (1. + d2 / 490000.) * smoothstep(350., 470., sqrt(d2));
    vec2 q = uLampR.xz + dv * ${(( ROOM.flameY - 56) / (ROOM.flameY - ROOM.tableY)).toFixed(4)};
    float inB = (1. - smoothstep(215., 250., abs(q.y))) * smoothstep(${F1(S_RIM)}, ${F1(S_RIM + 40)}, q.x) * (1. - smoothstep(560., 700., q.x));
    vec3 c = uLampCol * e * uLampK * mix(vec3(1.), vec3(.16, .5, .26) * (.3 + .8 * exp(-q.y * q.y / 2500.)), inB);
    return c + vec3(.035, .06, .12);
  }
  vec3 rmTable(vec2 p, float t){
    vec2 ink = rmInk(p, t); vec3 paper = mix(vec3(.86, .74, .47), vec3(.72, .58, .33), ink.y * .6) * (.9 + .2 * texture2D(uNoise, p * .0031).a);
    paper = mix(paper, vec3(.09, .06, .04), ink.x * .88);
    // the paper's own edge a little inside the table's, bare dark wood beyond it
    // the table's top: GREEN BAIZE inside a walnut border; the chart's sheet lies on the lamp's side, under the things
    vec2 e = min(p - vec2(${F1(ROOM.table[0])}, ${F1(ROOM.table[2])}), vec2(${F1(ROOM.table[1])}, ${F1(ROOM.table[3])}) - p); float m = min(e.x, e.y);
    vec3 top = mix(vec3(.3, .16, .07) * (.8 + .4 * texture2D(uNoise, p * vec2(.0005, .004)).r), vec3(.05, .27, .13) * (.85 + .3 * texture2D(uNoise, p * .02).g), smoothstep(150., 156., m));
    top = mix(top, vec3(.9, .64, .22), (1. - smoothstep(3., 8., abs(m - 190.))) * .7);
    float inP = step(${F1(ROOM.sheet[0])}, p.x) * step(p.x, ${F1(ROOM.sheet[1])}) * step(${F1(ROOM.sheet[2])}, p.y) * step(p.y, ${F1(ROOM.sheet[3])});
    return mix(top, paper, inP) * rmPool(p);
  }`;
// PART TWO OF THE ROOM: the wall on the dark side (z = ROOM.l1), each thing a plain great shape at a place of its own:
// the shelves (rows of upright spines in dull colours, gilt bands on some), the tall clock (its brass bob crosses its
// glass every two seconds; a dial with ticks and no figure), the window (cold blue, dark glazing bars, a small bright
// moon), the pale curtain beside it and, low and far, the fire. q: metres along the bottle and the height; t: the way
const ROOM_GLSL_B = /* glsl */`
  // THE SHELVES OF A WALL OF BOOKS (one painter for every such wall), from the floor to the cornice (ROOM.cornice):
  // boards 330 m apart, spines 58 m apart, each of its own width, height and colour, one in twelve a gap; an upright
  // every ROOM.bay metres; over them the cornice. q: metres along the wall and the height; lit: the wall's light
  // there; gk: how far its gilt answers the lamp. laid: 1 on a wall that keeps GREAT FOLIOS LAID FLAT: in one shelf
  // of a bay in six the books lie in a pile of three or four, their backs outward, each of its own length
  vec3 rmShelves(vec2 q, float t, vec3 lit, float gk, float laid){
    vec3 col = vec3(.3, .17, .08) * lit;
    float inSh = step(q.y, ${F1(ROOM.cornice)});
    float row = floor((q.y - ${F1(ROOM.floorY)}) / 330.), fy = q.y - ${F1(ROOM.floorY)} - row * 330., ci = floor(q.x / 58.), fx = q.x - ci * 58.;
    float h1 = rh(vec2(ci, row)), h2 = rh(vec2(ci + 7.7, row * 1.3 + 2.)), h3 = rh(vec2(ci * 1.7 + 3., row + 9.));
    float sw = 58. * (.6 + .38 * h1), sh = 296. * (.6 + .36 * h2), on = step(fx, sw) * step(26., fy) * step(fy, 26. + sh) * step(.08, h3);
    vec3 sp = h3 < .3 ? vec3(.56, .1, .07) : h3 < .5 ? vec3(.12, .2, .44) : h3 < .68 ? vec3(.4, .23, .09) : h3 < .84 ? vec3(.08, .32, .17) : vec3(.72, .6, .36);
    sp *= (.6 + .6 * h2) * (1. - .55 * smoothstep(sw * .25, sw * .5, abs(fx - sw * .5)));
    float gilt = step(.42, h1) * (rmLine(fy - 26. - sh * .8, 5., t) + rmLine(fy - 26. - sh * .2, 5., t)) * on;
    float glint = .55 + .45 * sin(uTime * (1.3 + 2. * h2) + h3 * 40.);
    float bi = floor((q.x - (${F1(ROOM.bay0)})) / ${F1(ROOM.bay)});
    if (laid * step(rh(vec2(bi * 1.3 + 5., row * 2.1 + 1.)), .17) > .5) {
      // (a shelf of folios: each 62 m thick, a line of shade between two of them, two gilt lines across each back)
      float bx = q.x - (${F1(ROOM.bay0)}) - bi * ${F1(ROOM.bay)}, pj = floor((fy - 26.) / 62.), py = fy - 26. - pj * 62.;
      float hf = rh(vec2(bi * 3.1 + pj, row * 1.7 + 4.)), hg = rh(vec2(bi + 9.3, row + pj * 2.3));
      float len = ${F1(ROOM.bay - 60)} * (.6 + .38 * hf), x0 = 30. + (${F1(ROOM.bay - 60)} - len) * hg;
      on = step(x0, bx) * step(bx, x0 + len) * step(26., fy) * step(pj, 2.5 + step(.5, hg)) * step(4., py);
      sp = (hf < .3 ? vec3(.56, .1, .07) : hf < .55 ? vec3(.5, .33, .14) : hf < .8 ? vec3(.08, .32, .17) : vec3(.12, .2, .44)) * (.7 + .5 * hg) * (1. - .45 * smoothstep(18., 31., abs(py - 33.)));
      gilt = step(.35, hf) * (rmLine(bx - x0 - len * .12, 5., t) + rmLine(bx - x0 - len * .88, 5., t)) * on;
    }
    // (the back of a shelf behind its books: dark wood; a wall of the room's ends has it one shade lighter, so that
    // no empty shelf of it stands under the room's shade)
    vec3 shelf = mix(vec3(.05, .04, .03) * (1. + .8 * laid), sp, on) * lit * 1.6 + vec3(1., .72, .3) * gilt * glint * (.35 + .9 * uLampK * step(.8, h2 + h3 * .4)) * gk;
    shelf = mix(shelf, vec3(.36, .2, .09) * lit * (1.25 - .5 * step(fy, 9.)), max(step(fy, 26.), step(abs(fract((q.x - (${F1(ROOM.bay0)})) / ${F1(ROOM.bay)} + .5) - .5), .028)));
    col = mix(col, shelf, inSh);
    // the cornice over them: a deep moulding of walnut, a bright roll at its foot, a shade under its lip
    float cq = (q.y - ${F1(ROOM.cornice)}) / ${F1(ROOM.ceilY - ROOM.cornice)};
    return mix(col, vec3(.4, .23, .1) * lit * (.7 + .9 * smoothstep(0., .12, cq) * (1. - smoothstep(.12, .3, cq)) + .5 * smoothstep(.5, .62, cq) - .45 * smoothstep(.8, .9, cq)), 1. - inSh);
  }
  vec3 rmDarkWall(vec2 q, float t){
    // (the shelves' light is the lamp's by its own way to them, as strong abreast of the lamp as it was; the moon's cold
    // stays; the shelves nearest the hearth take the fire's glow, by the room's law)
    float wayD = ${F1((ROOM.l1 - ROOM.lamp[1]) ** 2)}, fallD = rmFall(wayD + (q.x - uLampR.x) * (q.x - uLampR.x)) / rmFall(wayD);
    vec3 lit = uLampCol * vec3(${SHELF.lamp.map((v) => v.toFixed(2)).join(', ')}) * uLampK * fallD + vec3(${SHELF.cold.map((v) => v.toFixed(2)).join(', ')}) * (.45 + .55 * fallD) + rmFire(vec3(q.x, q.y, ${F1(ROOM.l1)}));
    vec3 col = rmShelves(q, t, lit, 1., 0.);
    // the tall clock: a trunk with a glass door, a hood with a round head, a pale dial with twelve ticks and two hands
    vec2 c = q - vec2(130., 0.);
    float body = max(step(abs(c.x), 98.) * step(q.y, 930.), max(step(abs(c.x), 128.) * step(930., q.y) * step(q.y, 1215.), step(length((q - vec2(130., 1215.)) / vec2(128., 95.)), 1.)));
    col = mix(col, vec3(.4, .2, .09) * lit * (1.25 - .5 * smoothstep(60., 98., abs(c.x)) * step(q.y, 930.)), body);
    float door = step(abs(c.x), 64.) * step(110., q.y) * step(q.y, 810.);
    float sa = .1 * sin(uTime * 1.5708 + uRoomPh.x); vec2 bob = vec2(130., 900.) + 700. * vec2(sin(sa), -cos(sa)), bq = q - bob;
    float rod = rmLine((q.x - 130.) - (900. - q.y) * tan(sa), 4., t) * step(q.y, 900.) * step(bob.y, q.y), bd = length(bq);
    vec3 inDoor = vec3(.012, .016, .018) + vec3(.5, .36, .12) * lit * rod + vec3(1., .78, .34) * (lit * 1.6 * step(bd, 38.) + (.9 + .6 * uLampK) * exp(-dot(bq + vec2(10., -10.), bq + vec2(10., -10.)) / 150.));
    col = mix(col, inDoor, door);
    vec2 dq = q - vec2(130., 1075.); float dr = length(dq), dang = atan(dq.y, dq.x + 1e-4);
    float tick = step(abs(fract(dang / .5236 + .5) - .5), .09) * step(62., dr) * step(dr, 80.);
    float hands = max(rmLine(dq.x * .829 - dq.y * .559, 5., t) * step(0., dq.x * .559 + dq.y * .829) * step(dr, 70.), rmLine(dq.x * .242 + dq.y * .97, 6., t) * step(0., dq.x * .97 - dq.y * .242) * step(dr, 48.));
    col = mix(col, vec3(.8, .74, .58) * lit * 1.7 * (1. - .85 * max(tick, hands)), step(dr, 90.));
    // the window: tall and cold, one upright bar and three across it, the moon small and bright in an upper pane
    // (two such windows stand in this wall, ROOM.winPitch metres apart; the moon is in the nearer one)
    float wi = step(${F1(ROOM.win[0] + ROOM.winPitch / 2)}, q.x); vec2 w = q - vec2(${F1(ROOM.win[0])} + ${F1(ROOM.winPitch)} * wi, ${F1(ROOM.win[1])}), hw = vec2(150., 380.);
    float inW = step(abs(w.x), hw.x) * step(abs(w.y), hw.y), fr = step(abs(w.x), hw.x + 30.) * step(abs(w.y), hw.y + 30.);
    float bars = max(max(rmLine(w.x, 7., t), rmLine(w.y, 6., t)), max(rmLine(w.y - 190., 6., t), rmLine(w.y + 190., 6., t)));
    vec2 mq = w - vec2(72., 268.); float md = length(mq);
    vec3 sky = mix(vec3(.09, .2, .62), vec3(.2, .4, .95), clamp(.5 - w.y / 760., 0., 1.)) * 1.25 + vec3(1., .97, .88) * (2.6 * (1. - smoothstep(22., 26., md)) + .45 * exp(-md / 55.)) * (1. - wi);
    col = mix(col, vec3(.16, .17, .18) * (lit + vec3(.05, .09, .16)), fr); col = mix(col, sky * (1. - .93 * bars), inW);
    // the curtain beside it: pale folds, cold where the window finds them
    float cx = q.x - ${F1(ROOM.winPitch)} * wi, inC = step(662., cx) * step(cx, 855.) * step(-320., q.y) * step(q.y, 985.), fold = .5 + .5 * sin(cx * .13 + .7 * sin(q.y * .0045));
    col = mix(col, (vec3(.5, .52, .5) * lit + vec3(.1, .16, .26) * (1. - (cx - 662.) / 193.)) * (.35 + .75 * fold), inC);
    return col;
  }`;
// PART THREE OF THE ROOM: its other faces are THE WALLS OF A STUDY, each thing a plain shape at a place of its own:
// behind the lamp walnut panelling with real relief (raised fields, each moulding bright where it faces the lamp and
// shaded where it is turned away) under a picture rail, oxblood above it, a cornice, and on it a case of butterflies
// and a banjo barometer; behind the bottle's base a wall of books with a ladder and a small old landscape on a pier;
// at the far end a wall of books and the chimney breast with its mantel, its dark mirror and the fire; the ceiling
// with two beams and the lamp's gold disc. Then the plain solids the table's things are made of (a box, an upright
// round, an egg, a thin rod), each met by the sight where it stands
const ROOM_GLSL_C = /* glsl */`
  // a panelled wall: x: 1 on a raised field; y: the light its moulding takes (L: the way to the light along the wall)
  vec2 rmPanel(vec2 q, vec2 cell, float rail, vec2 L){
    vec2 f = (fract(q / cell) - .5) * cell, e = cell * .5 - rail - abs(f); float m = min(e.x, e.y);
    vec2 n = e.x < e.y ? vec2(sign(f.x), 0.) : vec2(0., sign(f.y));
    return vec2(smoothstep(0., 12., m), (1. - smoothstep(10., 44., m)) * step(0., m) * dot(n, L));
  }
  // the wall's own dress at q (metres along it, the height): walnut panelling to the picture rail, oxblood over it, the
  // cornice; L: the way to the light along the wall
  vec3 rmWall(vec2 q, vec2 L){
    vec2 pn = rmPanel(q + vec2(0., ${F1(-ROOM.floorY)}), vec2(640., ${F1((ROOM.rail - ROOM.floorY) / 3)}), 78., L);
    float grain = texture2D(uNoise, q * vec2(.0042, .0005)).r;
    vec3 col = vec3(.46, .2, .085) * (.75 + .5 * grain) * (1. - .28 * pn.x) * (1. + .8 * pn.y);
    float up = smoothstep(${F1(ROOM.rail)}, ${F1(ROOM.rail + 6)}, q.y), rl = (q.y - ${F1(ROOM.rail)}) / 60.;
    col = mix(col, vec3(.4, .075, .06) * (.8 + .4 * texture2D(uNoise, q * .0011).g), up);
    col *= 1. + .7 * (1. - smoothstep(.0, .5, abs(rl + .5))) - .5 * (1. - smoothstep(0., .4, abs(rl - .5)));
    float cq = (q.y - ${F1(ROOM.cornice)}) / ${F1(ROOM.ceilY - ROOM.cornice)};
    return mix(col, vec3(.44, .26, .11) * (.7 + .9 * smoothstep(0., .12, cq) * (1. - smoothstep(.12, .3, cq)) + .5 * smoothstep(.5, .62, cq) - .45 * smoothstep(.8, .9, cq)), step(0., cq));
  }
  // a frame of half sizes h round c, w metres wide: x: 1 inside its sight, y: 1 on the frame, z: the moulding's light
  vec3 rmFrame(vec2 q, vec2 c, vec2 h, float w, vec2 L){
    vec2 e = h + w - abs(q - c); float m = min(e.x, e.y), on = step(0., m) * (1. - step(w, m));
    vec2 n = e.x < e.y ? vec2(sign(q.x - c.x), 0.) : vec2(0., sign(q.y - c.y));
    return vec3(step(w, m), on, (.5 - abs(m / w - .5)) * 2. * dot(n, L) + .5 * (1. - smoothstep(.0, .25, abs(m / w - .5))));
  }
  vec3 rmLampWall(vec2 q){
    vec2 v = vec2(uLampR.x, uLampR.y) - q; float fall = 1.8 / (1. + dot(v, v) / 4.4e6); vec2 L = normalize(v + 1e-3);
    vec3 col = rmWall(q, L);
    // the door, far along toward the bottle's base: six panels
    vec2 dr = q - vec2(-1650., 0.); float door = step(abs(dr.x), 330.) * step(q.y, 1240.);
    vec2 dp = rmPanel(dr + vec2(330., ${F1(-ROOM.floorY)}), vec2(330., 913.), 52., L);
    col = mix(col, vec3(.3, .16, .07) * (1. - .3 * dp.x) * (1. + .8 * dp.y), door);
    // THE CASE OF BUTTERFLIES: a dark frame, cream ground, four rows of three, each of its own colour, wings spread
    vec3 fr = rmFrame(q, vec2(-620., 880.), vec2(300., 390.), 46., L);
    vec2 bq = (q - vec2(-620., 880.) + vec2(300., 390.)) / vec2(200., 195.), bi = floor(bq), bp = (fract(bq) - .5) * vec2(2.5, 2.44); bp.x = abs(bp.x);
    float hb = rh(bi + 2.3), fore = length((bp - vec2(.52, .22)) / vec2(.5, .36 + .2 * bp.x)), hind = length((bp - vec2(.36, -.3)) / vec2(.34, .3)), wing = min(fore, hind);
    vec3 wc = hb < .2 ? vec3(.12, .36, .86) : hb < .4 ? vec3(.92, .46, .08) : hb < .58 ? vec3(.93, .8, .2) : hb < .74 ? vec3(.86, .12, .1) : hb < .88 ? vec3(.2, .62, .34) : vec3(.9, .88, .78);
    vec3 fly = mix(vec3(.84, .78, .6), wc * (1. - .75 * smoothstep(.72, .98, wing)), 1. - smoothstep(.97, 1.03, wing));
    fly = mix(fly, vec3(.07, .05, .04), 1. - smoothstep(.035, .06, length(bp * vec2(1., .13))));
    col = mix(col, fly, fr.x); col = mix(col, vec3(.16, .09, .045) * (1. + .9 * fr.z), fr.y);
    // THE BAROMETER: a banjo of walnut, its round dial low (a pale face, twelve ticks, one hand, a brass rim), a small
    // round over it, the tube with its red thread up the neck, a rounded head
    vec2 bc = q - vec2(2250., 620.); float br = length(bc), neck = step(abs(bc.x), 52. + 24. * smoothstep(300., 900., bc.y)) * step(0., bc.y) * step(bc.y, 900.);
    float bodyB = max(max(step(br, 192.), neck), max(step(length(bc - vec2(0., 900.)), 92.), step(length(bc - vec2(0., 400.)), 84.)));
    col = mix(col, vec3(.3, .15, .06) * (1.2 - .4 * smoothstep(20., 60., abs(bc.x)) * neck), bodyB);
    float ba = atan(bc.y, bc.x + 1e-4), tickB = step(abs(fract(ba / .5236 + .5) - .5), .1) * step(108., br) * step(br, 138.);
    float handB = (1. - smoothstep(4., 9., abs(bc.x * .5 + bc.y * .866))) * step(0., bc.y * .5 - bc.x * .866) * step(br, 125.);
    col = mix(col, vec3(.84, .78, .6) * (1. - .85 * max(tickB, handB)), step(br, 150.));
    col = mix(col, vec3(1., .72, .28) * (.7 + .9 * clamp(dot(normalize(bc + 1e-3), L), 0., 1.)), step(150., br) * step(br, 170.));
    col = mix(col, vec3(.8, .74, .58), step(length(bc - vec2(0., 400.)), 56.));
    col = mix(col, mix(vec3(.82, .8, .74), vec3(.8, .1, .06), step(bc.y, 640.)), step(abs(bc.x), 9.) * step(520., bc.y) * step(bc.y, 800.));
    // (the room's light law: the lamp by this wall's own way, the dusk along the room, the fire, the shade)
    return rmLit(col, uLampCol * fall * uLampK + vec3(.03, .04, .06), vec3(q.x, q.y, ${F1(ROOM.l0)}));
  }
  vec3 rmCeil(vec2 p){
    vec2 v = p - uLampR.xz; float r = length(v);
    float disc = (1. - smoothstep(470., 640., r)) * (.7 + .6 * smoothstep(300., 520., r)) + .5 * exp(-r / 1100.);
    float beam = max(step(abs(p.x + 520.), 150.), step(abs(p.x - 1560.), 150.));
    // (joists run along the room between the beams, one every JOIST.pitch metres: each a little darker than the
    // plaster, a line of shade on the side turned from the lamp)
    float jf = (fract(p.y / ${F1(JOIST.pitch)}) - .5) * ${F1(JOIST.pitch)}, js = sign(p.y - uLampR.z), joist = step(abs(jf), ${F1(JOIST.half)});
    vec3 plaster = vec3(.36, .27, .18) * (1. - ${JOIST.dark.toFixed(2)} * joist - ${JOIST.shade.toFixed(2)} * (1. - joist) * (1. - smoothstep(0., 70., jf * js - ${F1(JOIST.half)})) * step(${F1(JOIST.half)}, jf * js));
    return rmLit(mix(plaster, vec3(.14, .08, .04), beam), uLampCol * disc * 1.25 * uLampK + vec3(.12, .15, .16), vec3(p.x, ${F1(ROOM.ceilY)}, p.y));
  }
  // THE END WALL OF THE ROOM, beyond the bottle's neck: A WALL OF BOOKS AND THE HEARTH. Shelves of coloured books from
  // the floor to the cornice (rmShelves, folios among them) stand to either side of THE CHIMNEY BREAST, which stands
  // out from them the room's whole height. Below, pale stone in courses round the fire's arched mouth: an architrave
  // round the arch and its keystone, a fluted pilaster at each side, a frieze of dentils, the mantel shelf. On the
  // shelf (HEARTH): a ginger jar in blue and white, two brass candlesticks with lit candles, a pile of three folios.
  // Above it the breast is one great panel of walnut and on it hangs A DARK MIRROR in a gilt frame: old foxed glass
  // that holds only the room itself, dimly (nothing of any other place).
  // THE FIRE: tongues of red gold that climb and gutter on the clock over a bright bed. ITS LIGHT is the room's law
  // (rmFire): strong on the stone round it, a warm wash up the breast and across the mantel's things and on the
  // nearest shelves; each candle adds a small pool of its own (CANDLE)
  vec3 rmEndWall(vec2 q, float t){
    vec3 p = vec3(${F1(ROOM.s1)}, q.y, q.x);
    vec2 fq = q - vec2(${F1(ROOM.fire[0])}, ${F1(ROOM.fire[1])}); float ax = abs(fq.x), ym = fq.y - ${F1(HEARTH.shelf)};
    vec2 c1 = vec2(fq.x + ${F1(HEARTH.candle)}, ym - 286.), c2 = vec2(fq.x - ${F1(HEARTH.candle)}, ym - 286.);
    float f1 = .8 + .2 * sin(uTime * 9.1 + uHearthPh.x), f2 = .8 + .2 * sin(uTime * 7.7 + uHearthPh.y);
    vec3 lit = rmLit(vec3(1.), uLampCol * 1.2 * uLampK, p) + vec3(1., .62, .25) * ${CANDLE.k.toFixed(2)} * (f1 / (1. + dot(c1, c1) / ${F1(CANDLE.reach ** 2)}) + f2 / (1. + dot(c2, c2) / ${F1(CANDLE.reach ** 2)}));
    float glow = exp(-length(fq * vec2(1., .8) - vec2(0., 60.)) / 300.);
    // the shelves of books to either side of the breast, in its shade where they meet it
    vec3 col = rmShelves(q + vec2(4031., 0.), t, lit, clamp(dot(lit, vec3(.5)), 0., 1.), 1.) * (.7 + .3 * smoothstep(${F1(HEARTH.half)}, ${F1(HEARTH.half + 70)}, ax));
    float breast = step(ax, ${F1(HEARTH.half)}) * step(q.y, ${F1(ROOM.cornice)}), edge = smoothstep(${F1(HEARTH.half - 60)}, ${F1(HEARTH.half)}, ax);
    // the breast above the mantel: walnut, one great raised panel; the light comes up it from the fire
    vec2 Lf = normalize(vec2(-fq.x, 60. - fq.y) + 1e-3), pn = rmPanel(vec2(fq.x + ${F1(HEARTH.half)}, ym), vec2(${F1(2 * HEARTH.half)}, ${F1(ROOM.cornice - ROOM.fire[1] - HEARTH.shelf)}), 110., Lf);
    vec3 wood = vec3(.46, .2, .085) * (.75 + .5 * texture2D(uNoise, q * vec2(.0042, .0005)).r) * (1. - .28 * pn.x) * (1. + .8 * pn.y) * (1. - .35 * edge);
    col = mix(col, wood * lit, breast);
    // THE DARK MIRROR: here its frame and the dark of its old glass; what the glass holds is found where the sight is
    // known (rmTrace): the room itself, mirrored
    vec2 mc = vec2(0., ${F1(HEARTH.shelf + HEARTH.mirror[2])}), mh = vec2(${F1(HEARTH.mirror[0])}, ${F1(HEARTH.mirror[1])}), mq = (fq - mc) / mh;
    vec3 fr = rmFrame(fq, mc, mh, 64., Lf);
    vec3 glass = vec3(.03, .03, .026) * (1. + .3 * mq.y);
    col = mix(col, glass, fr.x * breast); col = mix(col, vec3(.95, .66, .22) * (.3 + .6 * fr.z) * (lit * 1.2 + .05), fr.y * breast);
    // the stone below the mantel: courses, the two fluted pilasters and their capitals, the architrave round the arch
    // with a line of shade at its outer edge, the keystone, the frieze of dentils
    vec3 stone = vec3(.62, .56, .46) * (.8 + .35 * texture2D(uNoise, q * .0016).g) * (1. - .35 * edge) * (1. - .18 * step(.5, fract((q.y + 1500.) / 300.)) * step(.94, fract(q.x / 380. + .5 * floor((q.y + 1500.) / 300.))));
    stone *= 1. - .1 * step(.955, fract((q.y + 1500.) / 300.));
    float pil = step(520., ax) * step(ax, 690.) * step(fq.y, 400.);
    stone *= 1. - pil * (.2 * (.5 + .5 * cos((ax - 520.) * .1478)) + .12 * smoothstep(640., 690., ax)) + .12 * step(500., ax) * step(ax, 710.) * step(340., fq.y) * step(fq.y, 400.);
    float arch = 330. - 150. * smoothstep(180., 400., ax), mouth = step(ax, 400.) * step(fq.y, arch);
    float archO = 395. - 150. * smoothstep(215., 470., ax), arc = step(ax, 470.) * step(fq.y, archO) * (1. - mouth);
    stone *= 1. + .15 * arc - .4 * arc * (1. - smoothstep(0., 12., min(470. - ax, archO - fq.y))) + .2 * step(ax, 46. + (fq.y - 330.) * .15) * step(330., fq.y) * step(fq.y, 418.);
    stone *= 1. - step(ax, 790.) * step(400., fq.y) * step(fq.y, 474.) * (.3 * step(.5, fract(fq.x / 76.)) * step(fq.y, 452.) + .1);
    col = mix(col, stone * (lit * 1.1 + vec3(1., .36, .1) * 1.3 * glow), breast * step(ym, 0.));
    // the mantel shelf, proud of the breast: its lip lit from below, a line of shade under it
    col = mix(col, vec3(.74, .68, .56) * (lit * 1.2 + vec3(1., .4, .12) * (.4 + 1.2 * step(fq.y, 500.)) * glow) * (1. - .25 * step(fq.y, 484.)), step(ax, ${F1(HEARTH.half + 70)}) * step(abs(fq.y - 520.), 46.));
    // THE MANTEL'S THINGS, each standing on the shelf: the ginger jar (white porcelain, blue sprigs, two blue bands,
    // a lid), the two brass candlesticks (a spread foot, a turned stem with a knop, a cup, the cream candle, its
    // flame a small leaf of white gold that shivers on the clock), the pile of three folios with gilt across their backs
    { float jx = fq.x + ${F1(HEARTH.ends)}, jb = length(vec2(jx, ym - 80.) / vec2(72., 80.)), jar = max(step(jb, 1.) * step(0., ym), max(step(abs(jx), 30.) * step(150., ym) * step(ym, 176.), step(length(vec2(jx, ym - 180.) / vec2(42., 17.)), 1.)));
      vec3 jc = mix(vec3(.8, .84, .86), vec3(.1, .2, .52), max(smoothstep(.52, .58, texture2D(uNoise, vec2(jx, ym) * .011 + .3).g), step(abs(abs(ym - 80.) - 62.), 5.)));
      col = mix(col, jc * (lit * 1.5 + vec3(1., .5, .2) * .3 * glow) * (1.15 - .7 * jx * jx / 5184. + .5 * exp(-dot(vec2(jx - 22., ym - 104.), vec2(jx - 22., ym - 104.)) / 300.)), jar);
      float cx = ax - ${F1(HEARTH.candle)}, fl = mix(f1, f2, step(0., fq.x));
      float stick = max(step(abs(cx), 46. - 30. * smoothstep(0., 30., ym)) * step(0., ym) * step(ym, 30.), max(step(abs(cx), 10. + 12. * exp(-(ym - 92.) * (ym - 92.) / 240.)) * step(30., ym) * step(ym, 152.), step(abs(cx), 27.) * step(152., ym) * step(ym, 166.)));
      col = mix(col, vec3(.95, .62, .2) * (lit * 1.5 + vec3(1., .5, .2) * .5 * glow) * (.55 + 1.1 * exp(-(cx + 5.) * (cx + 5.) / 60.)), stick);
      col = mix(col, vec3(.86, .8, .62) * (lit * 1.4 + vec3(1., .7, .3) * .9 * smoothstep(190., 262., ym)), step(abs(cx), 13.) * step(166., ym) * step(ym, 262.));
      vec2 fv = vec2(cx + 5. * (fl - .8) * (ym - 262.) / 20., ym - 286.) / vec2(11., 26.);
      col += vec3(2.6, 1.7, .6) * fl * (1. - smoothstep(.6, 1., length(fv))) + vec3(1., .55, .2) * .2 * fl * exp(-dot(fv, fv) / 5.) * step(0., ym);
      float px = fq.x - ${F1(HEARTH.ends)}, pj = floor(ym / 46.), py = ym - pj * 46., ln = 118. - 15. * pj, pxo = px - 9. * (pj - 1.);
      float fo = step(abs(pxo), ln) * step(0., ym) * step(pj, 2.5) * step(3., py);
      vec3 fc = (pj < .5 ? vec3(.5, .1, .07) : pj < 1.5 ? vec3(.09, .3, .17) : vec3(.5, .34, .15)) * (1. - .4 * smoothstep(13., 23., abs(py - 24.)));
      fc = mix(fc, vec3(1., .74, .3) * 1.4, max(rmLine(abs(pxo) - ln * .8, 4., t), rmLine(abs(pxo) - ln * .3, 4., t)));
      col = mix(col, fc * (lit * 1.5 + vec3(1., .5, .2) * .3 * glow), fo); }
    float ton = texture2D(uNoise, vec2(fq.x * .0019 + uRoomPh.y, fq.y * .0011 - uTime * .21)).r, emb = texture2D(uNoise, vec2(fq.x * .008, uTime * .05 + uRoomPh.z)).g;
    float fire = smoothstep(.28, .6, ton * (1.25 - (fq.y + 60.) / 330.) * (1. - smoothstep(200., 380., abs(fq.x)))) * (.75 + .25 * sin(uTime * 7.3 + uRoomPh.z));
    // (the fire lights its own fireback: courses of brick, red in its light, brighter toward the bed, breathing with it)
    float fbk = (1. - .35 * max(step(.9, fract(fq.y / 62.)), step(.94, fract(fq.x / 134. + .5 * floor(fq.y / 62.))))) * (.3 + .7 * (1. - smoothstep(-100., 330., fq.y))) * (.7 + .6 * texture2D(uNoise, vec2(uTime * .045 + uRoomPh.y, .61)).r);
    col = mix(col, vec3(.05, .016, .008) + vec3(.6, .19, .055) * fbk + vec3(2.2, .66, .12) * fire + vec3(1.5, .3, .05) * (.4 + .6 * emb) * (1. - smoothstep(-110., 10., fq.y)), mouth);
    return col;
  }
  // THE WALL BEHIND THE BOTTLE'S BASE: A WALL OF BOOKS. Shelves of coloured books from the floor to the cornice
  // (rmShelves, folios among them), lit by the lamp as the long wall's are at the same way from it and never more than
  // abreast of it. A brass rail runs along them BACK.rail metres up and A LIBRARY LADDER hangs from it (two rails of
  // pale oak that draw together upward, a rung every BACK.rung metres, its shade on the books beside it, away from
  // the lamp). One bay is A PIER OF PANELLED WALNUT and on it hangs THE SMALL LANDSCAPE OF HILLS in its gilt frame: an
  // old painting under dark varnish, a dull amber sky and three brown ranges of hills, a quiet thing of the room;
  // under it a marble bust on a bracket
  vec3 rmBackWall(vec2 q, float t){
    vec2 v = vec2(uLampR.z, uLampR.y) - q, L = normalize(v + 1e-3); float dl = q.x - uLampR.z;
    float fallB = min(1., rmFall(${F1((ROOM.lamp[0] - ROOM.s0) ** 2)} + dl * dl) / rmFall(${F1((ROOM.l1 - ROOM.lamp[1]) ** 2)}));
    vec3 lit = uLampCol * vec3(${SHELF.lamp.map((v) => v.toFixed(2)).join(', ')}) * uLampK * fallB + vec3(${SHELF.cold.map((v) => v.toFixed(2)).join(', ')}) * (.45 + .55 * fallB) + rmFire(vec3(${F1(ROOM.s0)}, q.y, q.x));
    vec3 col = rmShelves(q + vec2(${F1(ROOM.bay0 + 24.5 * ROOM.bay - BACK.pier)}, 0.), t, lit, fallB, 1.);
    // the brass rail and the ladder: its shade first, then the oak
    float lx = q.x - ${F1(BACK.pier + BACK.ladder * ROOM.bay)}, hh = clamp((q.y - ${F1(ROOM.floorY)}) / ${F1(BACK.rail - ROOM.floorY)}, 0., 1.), hw = 104. - 22. * hh, up = step(q.y, ${F1(BACK.rail + 30)});
    float rails = (1. - smoothstep(9., 12., abs(abs(lx) - hw))) * up, rung = step(abs(lx), hw) * step(abs(fract((q.y - ${F1(ROOM.floorY)}) / ${F1(BACK.rung)}) - .5) * ${F1(BACK.rung)}, 8.) * step(q.y, ${F1(BACK.rail - 40)});
    float shd = max((1. - smoothstep(9., 30., abs(abs(lx - 34.) - hw))) * up, step(abs(lx - 34.), hw) * step(abs(fract((q.y - ${F1(ROOM.floorY)} + 22.) / ${F1(BACK.rung)}) - .5) * ${F1(BACK.rung)}, 9.) * step(q.y, ${F1(BACK.rail - 40)}));
    float pier = step(abs(q.x - ${F1(BACK.pier)}), ${F1(ROOM.bay / 2 - 14)}) * step(q.y, ${F1(ROOM.cornice)});
    col *= 1. - .45 * shd * (1. - pier);
    col = mix(col, vec3(1., .72, .3) * (lit * 1.5 + uLampCol * uLampK * .5 * step(.9, fract(q.x / 251.65))), rmLine(q.y - ${F1(BACK.rail)}, 7., t) * (1. - pier));
    col = mix(col, vec3(.6, .43, .22) * lit * 1.7 * (1. - .3 * rung * step(abs(lx), hw - 12.)), max(rails, rung));
    // the pier and its landscape
    vec2 pn = rmPanel(vec2(q.x - ${F1(BACK.pier - ROOM.bay / 2)}, q.y - ${F1(ROOM.floorY)}), vec2(${F1(ROOM.bay)}, ${F1((ROOM.cornice - ROOM.floorY) / 3)}), 62., L);
    col = mix(col, vec3(.46, .2, .085) * (.75 + .5 * texture2D(uNoise, q * vec2(.0042, .0005)).r) * (1. - .28 * pn.x) * (1. + .8 * pn.y) * lit * 1.6, pier);
    vec2 c = vec2(${F1(BACK.pier)}, ${F1(BACK.pic[2])}), w = q - c; vec3 fr = rmFrame(q, c, vec2(${F1(BACK.pic[0])}, ${F1(BACK.pic[1])}), ${F1(BACK.frame)}, L);
    float h1 = 14. + 26. * sin(w.x * .016 + 1.) + 11. * sin(w.x * .04 + 2.), h2 = -26. + 30. * sin(w.x * .013 + 3.4) + 9. * sin(w.x * .052), h3 = -72. + 22. * sin(w.x * .01 + .5) + 6. * sin(w.x * .065 + 1.);
    vec3 land = mix(vec3(.4, .31, .16), vec3(.25, .23, .17), smoothstep(-20., 110., w.y));
    land = mix(land, vec3(.2, .19, .13), step(w.y, h1)); land = mix(land, vec3(.14, .13, .08), step(w.y, h2)); land = mix(land, vec3(.08, .07, .04), step(w.y, h3));
    col = mix(col, land * (.85 + .3 * texture2D(uNoise, w * .006).r) * lit * 1.5, fr.x); col = mix(col, vec3(.95, .66, .22) * (.3 + .6 * fr.z) * lit * 1.5, fr.y);
    // under the landscape A BUST OF WHITE MARBLE on a bracket (BUST): a socle, the shoulders, the neck, a plain smooth
    // head with no face; the lamp's side of it the lighter, its shade on the panel beside it
    vec2 b = q - vec2(${F1(BACK.pier)}, ${F1(BUST.y)}); float bx = abs(b.x), sd = sign(uLampR.z - ${F1(BACK.pier)});
    float brk = max(step(bx, 150.) * step(-26., b.y) * step(b.y, 0.), step(bx, 60. + b.y * .6) * step(-126., b.y) * step(b.y, -26.));
    col = mix(col, vec3(.4, .2, .09) * lit * (1.9 - .9 * step(b.y, -26.)), brk);
    // (its outline, by the height over the bracket: the socle, the chest widening to the shoulders, the shoulders
    // falling to the neck, the head an egg; each part round across, lighter on the lamp's side, a shade under the chin)
    float bw = b.y < 14. ? 62. : b.y < 60. ? 40. : b.y < 200. ? mix(52., 122., smoothstep(60., 185., b.y)) : b.y < 252. ? mix(122., 30., smoothstep(196., 252., b.y)) : 30.;
    float hd = length(vec2(b.x, b.y - 330.) / vec2(52., 68.)), bust = max(step(bx, bw) * step(0., b.y) * step(b.y, 290.), step(hd, 1.));
    float hs = length(vec2(b.x + sd * 40., b.y - 322.) / vec2(52., 68.)), bsh = max(step(abs(b.x + sd * 40.), bw) * step(0., b.y) * step(b.y, 290.), step(hs, 1.));
    col *= 1. - .3 * bsh * (1. - bust);
    float rnd = b.y > 268. ? sqrt(clamp(1. - hd * hd, 0., 1.)) : sqrt(clamp(1. - b.x * b.x / (bw * bw), 0., 1.)), side = clamp(sd * b.x / max(bw, 1.), -1., 1.);
    vec3 marble = vec3(.74, .72, .66) * (.42 + .5 * rnd + .22 * side) * (1. - .3 * smoothstep(262., 250., b.y) * step(252., b.y) * step(b.y, 275.) - .18 * step(b.y, 60.) * step(14., b.y)) * (.94 + .12 * texture2D(uNoise, b * .013).g);
    col = mix(col, marble * lit * 1.5, bust);
    return col;
  }
  // a box of half sizes h about c, turned by cs (cosine, sine of its yaw): x the way to it (1e9: none), yzw the place
  // of the hit in its own frame
  vec4 rmBox(vec3 o, vec3 d, vec3 c, vec3 h, vec2 cs){
    vec3 oo = o - c, dd = d; oo.xz = vec2(oo.x * cs.x + oo.z * cs.y, oo.z * cs.x - oo.x * cs.y); dd.xz = vec2(d.x * cs.x + d.z * cs.y, d.z * cs.x - d.x * cs.y);
    vec3 sg = mix(vec3(-1.), vec3(1.), step(0., dd)), id = sg / max(abs(dd), vec3(1e-4));
    vec3 t0 = (-sg * h - oo) * id, t1 = (sg * h - oo) * id; float tn = max(max(t0.x, t0.y), t0.z), tf = min(min(t1.x, t1.y), t1.z);
    if (tn > tf || tn < 0.) return vec4(1e9, 0., 0., 0.);
    return vec4(tn, oo + dd * tn);
  }
  // a shut book lying flat: boards of its cover's colour top and bottom, the pale block of its pages between them on
  // the three open sides, its back on the fourth (the side away from the bottle). Returns the colour and the way
  vec4 rmBook(vec3 o, vec3 d, vec3 c, vec3 h, vec2 cs, vec3 cover){
    vec4 b = rmBox(o, d, c, h, cs); if (b.x > 1e8) return vec4(0., 0., 0., 1e9);
    vec3 p = b.yzw, fl = uLampR - c; fl.xz = vec2(fl.x * cs.x + fl.z * cs.y, fl.z * cs.x - fl.x * cs.y);
    vec3 e = abs(p) / h, n = step(vec3(.9995), e) * sign(p), L = normalize(fl - p);
    float board = step(h.y - 9., abs(p.y)), back = step(.9995, e.z) * step(0., p.z), top = step(.9995, e.y);
    float pages = (1. - board) * (1. - back) * (1. - top);
    vec3 col = mix(cover * (.8 + .4 * texture2D(uNoise, p.xz * .0021).g), vec3(.82, .76, .6) * (.72 + .28 * step(.4, fract(p.y / 7.))), pages);
    // the back is leather in raised bands: four gilt lines across it and a dark label with a gilt edge between two of them
    float bx = abs(p.x) / h.x, bf = abs(fract(bx * 3.2 + .5) - .5) / 3.2, band = (1. - smoothstep(.016, .034, bf)) * step(.12, bx);
    col *= 1. - .45 * back * pow(abs(p.y) / h.y, 3.);
    // (between the two middle bands a gilt lozenge, the binder's tool)
    float loz = 1. - smoothstep(.75, 1., abs(p.x) / (h.x * .07) + abs(p.y) / (h.y * .5));
    col = mix(col, vec3(1., .74, .3) * 1.3, back * max(band, loz * step(abs(abs(p.x) / (h.x * .07) + abs(p.y) / (h.y * .5) - .55), .2)) * .9);
    col *= 1. - .3 * back * smoothstep(.02, .05, bf) * (1. - smoothstep(.05, .1, bf)) * step(.12, bx);
    // the page block stands a little in from the boards: a line of shade under the upper board
    col *= 1. - .55 * pages * smoothstep(h.y - 30., h.y - 9., p.y);
    float lam = clamp(dot(n, L), 0., 1.) * 1.5 / (1. + dot(fl - p, fl - p) / 1.6e6);
    // what faces the bottle takes the light the sea and the glass give back: a soft green gold
    return vec4(col * (uLampCol * lam * uLampK + vec3(.04, .06, .1) + uLampCol * vec3(.7, .9, .6) * .4 * uLampK * clamp(n.z, 0., 1.)), b.x);
  }
  // an upright round of radius r about c from y0 to y1: x the way (1e9: none), y the height of the hit, zw its level normal
  vec4 rmCyl(vec3 o, vec3 d, vec2 c, float r, float y0, float y1){
    vec2 oc = o.xz - c; float a = max(dot(d.xz, d.xz), 1e-6), b = dot(oc, d.xz), h = b * b - a * (dot(oc, oc) - r * r);
    if (h < 0.) return vec4(1e9, 0., 0., 0.);
    float t = (-b - sqrt(h)) / a, y = o.y + d.y * t;
    if (t < 0. || y < y0 || y > y1) return vec4(1e9, 0., 0., 0.);
    return vec4(t, y, (oc + d.xz * t) / r);
  }
  // an egg of half sizes R about c: x the way (1e9: none), yzw its normal
  vec4 rmEgg(vec3 o, vec3 d, vec3 c, vec3 R){
    vec3 oo = (o - c) / R, dd = d / R; float a = dot(dd, dd), b = dot(oo, dd), h = b * b - a * (dot(oo, oo) - 1.);
    if (h < 0.) return vec4(1e9, 0., 0., 0.);
    float t = (-b - sqrt(h)) / a; if (t < 0.) return vec4(1e9, 0., 0., 0.);
    return vec4(t, normalize((oo + dd * t) / R));
  }
  // a thin rod from a to b: x metres from the sight to it at their nearest, y the way to there, z the share along it
  vec3 rmRod(vec3 o, vec3 d, vec3 a, vec3 b){
    vec3 ab = b - a, ao = o - a; float abd = dot(ab, d), s = clamp((dot(ao, ab) - dot(ao, d) * abd) / max(dot(ab, ab) - abd * abd, 1e-4), 0., 1.);
    float t = max(dot(a + ab * s - o, d), 0.); return vec3(length(o + d * t - a - ab * s), t, s);
  }
  // brass, lit by the flame: N its normal, p its place
  vec3 rmBrass(vec3 N, vec3 p, vec3 d, float k){
    vec3 L = normalize(uLampR - p), R = reflect(d, N); float nl = clamp(dot(N, L) * .8 + .2, 0., 1.), rl = clamp(dot(R, L), 0., 1.), sp = pow(rl, 18.) + 2.5 * pow(rl, 180.);
    float cold = pow(clamp(dot(R, normalize(vec3(${F1(ROOM.win[0])}, ${F1(ROOM.win[1])}, ${F1(ROOM.l1)}) - p)), 0., 1.), 70.);
    return (vec3(.95, .62, .2) * (.16 + 1.1 * nl) * k + vec3(1., .9, .6) * sp * 1.4) * uLampCol * uLampK + vec3(.02, .035, .06) * (.5 + .5 * N.z) + vec3(.5, .72, 1.) * 1.1 * cold;
  }
  // the lamp's font (FONT): polished brass mirrors the room in broad bands, by the mirrored sight's own lean: the lit
  // ceiling high on it, the room's dark at its waist, the gold of the lamp-lit chart low on it; and its turned beads
  vec3 rmFont(vec3 N, vec3 p, vec3 d){
    vec3 r = reflect(d, N);
    vec3 env = mix(vec3(.9, .7, .34), vec3(.07, .05, .03), smoothstep(-.55, -.12, r.y));
    env = mix(env, vec3(.62, .46, .24), smoothstep(.1, .55, r.y));
    vec3 col = rmBrass(N, p, d, 1.) * .62 + vec3(.95, .66, .26) * env * uLampCol * uLampK * .7;
    float bead = 0., under = 0.;
    ${FONT.beads.map((h) => `{ float g = p.y - (${F1(h)}); bead += 1. - smoothstep(${F1(FONT.bead * 0.4)}, ${F1(FONT.bead * 0.9)}, abs(g - ${F1(FONT.bead * 0.5)})); under += 1. - smoothstep(${F1(FONT.bead * 0.3)}, ${F1(FONT.bead * 0.7)}, abs(g + ${F1(FONT.bead * 0.6)})); }`).join('\n    ')}
    return col * (1. - .6 * min(under, 1.)) + vec3(1., .86, .5) * uLampCol * uLampK * .45 * min(bead, 1.) * (.4 + .6 * clamp(N.y + .5, 0., 1.));
  }`;
// PART FOUR OF THE ROOM: what a sight from the glass meets (o, d in the room's frame): the shell, the table and its
// chart, the pile of three shut books, the inkwell and its quill, the dividers standing on their points, THE LAMP (its
// brass font, bright rim, collar and gallery; its glass chimney going up out of sight with two thin highlights; in it
// the flame, a tall leaf of white gold in an amber mantle that leans, shivers and recovers on the world clock:
// uFlame: its lean, its shiver, its height by the hour)
const ROOM_GLSL_D = /* glsl */`
  vec3 rmTrace(vec3 o, vec3 d){
    vec3 sg = step(0., d), tt = (mix(vec3(${F1(ROOM.s0)}, ${F1(ROOM.floorY)}, ${F1(ROOM.l0)}), vec3(${F1(ROOM.s1)}, ${F1(ROOM.ceilY)}, ${F1(ROOM.l1)}), sg) - o) * (sg * 2. - 1.) / max(abs(d), vec3(1e-4));
    float t = min(min(tt.x, tt.y), tt.z); vec3 p = o + d * t, col;
    if (tt.z <= t) { if (d.z > 0.) col = rmDarkWall(p.xy, t); else col = rmLampWall(p.xy); }
    else if (tt.y <= t) { if (d.y > 0.) col = rmCeil(p.xz); else col = vec3(.012, .01, .008); }
    else { if (d.x < 0.) col = rmBackWall(p.zy, t); else {
      col = rmEndWall(p.zy, t);
      // THE DARK MIRROR HOLDS THE ROOM: the sight, turned back by its glass, goes on to the room's own shell (the ceiling
      // and its lamp-lit round, the walls of books); the old glass gives back MIRROR.k of it, less where it is foxed at
      // its edges
      vec2 mq = (p.zy - vec2(${F1(ROOM.fire[0])}, ${F1(ROOM.fire[1] + HEARTH.shelf + HEARTH.mirror[2])})) / vec2(${F1(HEARTH.mirror[0])}, ${F1(HEARTH.mirror[1])});
      if (max(abs(mq.x), abs(mq.y)) < 1.) {
        vec3 md = vec3(-d.x, d.y, d.z), s2 = step(0., md), t2 = (mix(vec3(${F1(ROOM.s0)}, ${F1(ROOM.floorY)}, ${F1(ROOM.l0)}), vec3(${F1(ROOM.s1)}, ${F1(ROOM.ceilY)}, ${F1(ROOM.l1)}), s2) - p) * (s2 * 2. - 1.) / max(abs(md), vec3(1e-4));
        float tm = min(min(t2.x, t2.y), t2.z); vec3 pm = p + md * tm, held = vec3(.012, .01, .008);
        if (t2.z <= tm) { if (md.z > 0.) held = rmDarkWall(pm.xy, t + tm); else held = rmLampWall(pm.xy); }
        else if (t2.y <= tm) { if (md.y > 0.) held = rmCeil(pm.xz); }
        else held = rmBackWall(pm.zy, t + tm);
        col += held * vec3(.8, .86, .78) * ${MIRROR.k.toFixed(2)} * (1. - ${MIRROR.fox.toFixed(2)} * smoothstep(.6, 1., max(abs(mq.x), abs(mq.y))) * smoothstep(.3, .6, texture2D(uNoise, p.zy * .004).g));
      } } }
    // (every wall and the ceiling carry the room's light law in their own light: rmLit, the shelves' law; the dusk
    // below is for the floor and for what stands in the room)
    float tw = t, own = (tt.z > t && tt.y <= t && d.y <= 0.) ? 0. : 1.;
    float tb = (${F1(ROOM.tableY)} - o.y) / min(d.y, -1e-4); vec2 q = o.xz + d.xz * tb;
    if (d.y < 0. && tb > 0. && tb < t && q.x > ${F1(ROOM.table[0])} && q.x < ${F1(ROOM.table[1])} && q.y > ${F1(ROOM.table[2])} && q.y < ${F1(ROOM.table[3])}) { t = tb; col = rmTable(q, tb); }
    vec3 amb = vec3(.03, .05, .09);
    // THE PILE OF THREE GREAT BOOKS (oxblood, night blue, bottle green), their backs toward the bottle; the two upper
    // ones stand back from the lowest one's edge, each laid a little askew
    vec4 bk = rmBook(o, d, vec3(-330. + ${F1(PILE_DS)}, -115., -690.), vec3(430., 95., 300.), vec2(.9988, .05), vec3(.1, .4, .2)); if (bk.w < t) { t = bk.w; col = bk.rgb; }
    bk = rmBook(o, d, vec3(-350. + ${F1(PILE_DS)}, 60., -760.), vec3(390., 80., 230.), vec2(.9982, -.06), vec3(.12, .22, .56)); if (bk.w < t) { t = bk.w; col = bk.rgb; }
    bk = rmBook(o, d, vec3(-310. + ${F1(PILE_DS)}, 212., -762.), vec3(340., 72., 230.), vec2(.9968, .08), vec3(.66, .1, .07)); if (bk.w < t) { t = bk.w; col = bk.rgb; }
    // its ribbon: red silk out of the top book's pages, down over the backs onto the lowest book
    vec4 rb = rmBox(o, d, vec3(-190. + ${F1(PILE_DS)}, 128., -521.), vec3(15., 152., 3.), vec2(1., 0.));
    if (rb.x < t) { t = rb.x; col = vec3(.85, .08, .07) * (.75 + .25 * sin(rb.z * .09)) * (uLampCol * .7 * uLampK + amb * 2.); }
    // THE MAGNIFYING GLASS lying flat on the lowest book's edge: a brass ring round a lens, a turned walnut handle
    { float tm = (-16. - o.y) / min(d.y, -1e-4); vec2 mq = o.xz + d.xz * tm - vec2(-600. + ${F1(PILE_DS)}, -455.); float mr = length(mq);
      if (d.y < 0. && tm > 0. && tm < t && mr < 62.) { t = tm; col = mr > 50. ? rmBrass(vec3(0., 1., 0.), o + d * tm, d, 1.6) : mix(col, vec3(.6, .75, .7), .25) * 1.5 + uLampCol * uLampK * .5 * exp(-dot(mq - vec2(14., 10.), mq - vec2(14., 10.)) / 260.); }
      vec3 rh2 = rmRod(o, d, vec3(-540. + ${F1(PILE_DS)}, -8., -447.), vec3(-390. + ${F1(PILE_DS)}, -8., -430.)); float wh = max(11., rh2.y * .0022);
      col = mix(col, vec3(.3, .15, .06) * (uLampCol * .9 * uLampK + amb * 2.), (1. - smoothstep(wh * .8, wh * 1.2, rh2.x)) * step(rh2.y, t)); }
    // THE ROLLED CHART leaning on that edge: cream paper wound on itself, tied with a red ribbon at its middle
    { vec3 rr2 = rmRod(o, d, vec3(-905. + ${F1(PILE_DS)}, -160., -560.), vec3(-745. + ${F1(PILE_DS)}, 330., -650.)); float wr = max(56., rr2.y * .0022), kr = (1. - smoothstep(wr * .92, wr * 1.08, rr2.x)) * step(rr2.y, t);
      vec3 pc = vec3(.86, .77, .54) * (.35 + .65 * sqrt(clamp(1. - rr2.x * rr2.x / (wr * wr), 0., 1.))) * (1. - .45 * step(.96, rr2.z) * step(rr2.x, wr * .7) - .3 * step(rr2.z, .02));
      pc = mix(pc, vec3(.85, .08, .07), step(abs(rr2.z - .45), .045));
      col = mix(col, pc * (uLampCol * .85 * uLampK + amb * 2.), kr); if (kr > .5) t = min(t, rr2.y); }
    // THE GLOBE IN ITS STAND: a varnished ball of parchment seas and brown lands, lines of the degrees drawn fine on it,
    // its pole leaning; a brass meridian ring round it, a turned pillar, a round foot
    { vec3 gc = vec3(${F1(ROOM.globe[0])}, ${F1(ROOM.globe[1])}, ${F1(ROOM.globe[2])});
      vec4 cyG = rmCyl(o, d, gc.xz, 200., ${F1(ROOM.tableY)}, -168.); if (cyG.x < t) { t = cyG.x; col = vec3(.3, .15, .06) * (uLampCol * (.3 + .7 * clamp(dot(vec3(cyG.z, 0., cyG.w), normalize(uLampR - o - d * t)), 0., 1.)) * uLampK + amb * 2.); }
      float tg = (-168. - o.y) / min(d.y, -1e-4); vec2 gq = o.xz + d.xz * tg - gc.xz; if (d.y < 0. && tg > 0. && tg < t && dot(gq, gq) < 40000.) { t = tg; col = vec3(.34, .18, .07) * (uLampCol * .8 * uLampK + amb * 2.); }
      cyG = rmCyl(o, d, gc.xz, 40., -168., gc.y - ${F1(ROOM.globe[3] - 6)}); if (cyG.x < t) { t = cyG.x; col = rmBrass(vec3(cyG.z, 0., cyG.w), o + d * t, d, 1.); }
      float tp = (gc.z - o.z) / (abs(d.z) > 1e-4 ? d.z : 1e-4); vec2 pq = o.xy + d.xy * tp - gc.xy; float pr = length(pq);
      if (tp > 0. && tp < t && pr > ${F1(ROOM.globe[3] + 12)} && pr < ${F1(ROOM.globe[3] + 40)}) { t = tp; col = rmBrass(normalize(vec3(pq, .6 * sign(-d.z))), o + d * tp, d, 1.4) * (.8 + .2 * step(.5, fract(atan(pq.y, pq.x) * 5.73))); }
      vec4 eg0 = rmEgg(o, d, gc, vec3(${F1(ROOM.globe[3])}));
      if (eg0.x < t) { t = eg0.x; vec3 n = eg0.yzw, pp = o + d * t, m = vec3(n.x * .92 - n.y * .39, n.x * .39 + n.y * .92, n.z);
        float lon = atan(m.z, m.x), lat = asin(clamp(m.y, -1., 1.));
        float land = smoothstep(.5, .54, texture2D(uNoise, vec2(lon * .16 + .2, lat * .32 + .5)).r * .7 + texture2D(uNoise, vec2(lon * .5, lat * .9)).g * .3);
        float gr = max(rmLine((abs(fract(lon / .5236 + .5) - .5)) * .5236 * ${F1(ROOM.globe[3])} * cos(lat), 2.2, t), rmLine((abs(fract(lat / .5236 + .5) - .5)) * .5236 * ${F1(ROOM.globe[3])}, 2.2, t));
        vec3 gcol = mix(vec3(.78, .76, .56), vec3(.5, .34, .15), land) * (1. - .45 * gr);
        vec3 Lg = normalize(uLampR - pp); float nl = clamp(dot(n, Lg) * .75 + .25, 0., 1.);
        col = gcol * (uLampCol * nl * 1.25 * uLampK + amb * 2.5 + vec3(${ROOM.shade.map((v) => v.toFixed(3)).join(', ')}) * .7) + uLampCol * uLampK * 1.2 * pow(clamp(dot(reflect(d, n), Lg), 0., 1.), 60.) + vec3(.5, .7, 1.) * .5 * pow(clamp(dot(reflect(d, n), normalize(vec3(${F1(ROOM.win[0])}, ${F1(ROOM.win[1])}, ${F1(ROOM.l1)}) - pp)), 0., 1.), 40.); } }
    // THE INKWELL OF CUT GLASS: a squat round cut in upright facets, dark with ink to its shoulder, a brass cap; each
    // facet takes the lamp as one hard glint; the quill standing in it
    vec3 iw = vec3(${F1(ROOM.ink[0])}, 0., ${F1(ROOM.ink[1])});
    vec4 cy = rmCyl(o, d, iw.xz, 150., ${F1(ROOM.tableY)}, 70.);
    if (cy.x < t) { t = cy.x; vec3 pp = o + d * t; float fa = atan(cy.w, cy.z), fi = (floor(fa / .5236) + .5) * .5236, fe = abs(fract(fa / .5236) - .5) * 2.;
      vec3 N = vec3(cos(fi), .12, sin(fi)), Li = normalize(uLampR - pp); float ink = 1. - smoothstep(-20., 10., pp.y);
      col = mix(vec3(.3, .5, .46) * (.35 + .5 * fe), vec3(.015, .02, .06), ink * .9) * (uLampCol * uLampK + amb * 3.)
        + uLampCol * uLampK * (1.6 * pow(clamp(dot(reflect(d, N), Li), 0., 1.), 24.) + .35 * smoothstep(.8, 1., fe))
        + vec3(.5, .7, 1.) * .4 * pow(clamp(dot(reflect(d, N), normalize(vec3(${F1(ROOM.win[0])}, ${F1(ROOM.win[1])}, ${F1(ROOM.l1)}) - pp)), 0., 1.), 12.); }
    float tc = (70. - o.y) / min(d.y, -1e-4); vec2 cq = o.xz + d.xz * tc - iw.xz;
    // (a thing is seen only before the sight's own beginning: from a place of the glass below the inkwell's top, a
    // falling sight meets that top only backward, which is no meeting)
    if (d.y < 0. && tc > 0. && tc < t && dot(cq, cq) < 22500.) { t = tc; col = vec3(.2, .34, .32) * (uLampCol * .6 * uLampK + amb * 2.); }
    cy = rmCyl(o, d, iw.xz, 84., 70., 150.); if (cy.x < t) { t = cy.x; col = rmBrass(vec3(cy.z, 0., cy.w), o + d * t, d, 1.); }
    vec3 rq = rmRod(o, d, vec3(iw.x, 130., iw.z), vec3(iw.x + 250., 940., iw.z - 120.));
    float vane = 7. + 84. * pow(clamp(sin(3.1416 * clamp((rq.z - .2) / .8, 0., 1.)), 0., 1.), .6), wq = max(vane, rq.y * .0022);
    float kq = (1. - smoothstep(wq * .8, wq * 1.2, rq.x)) * step(rq.y, t);
    col = mix(col, vec3(.9, .87, .78) * (.72 + .28 * smoothstep(.0, .5, rq.x / wq)) * (1. - .12 * step(.6, fract(rq.z * 23. + rq.x / wq * 1.5))) * (uLampCol * .6 * uLampK + amb * 2.), kq);
    // THE DIVIDERS: two brass legs standing on their points, joined under a round knob
    vec3 ap = vec3(${F1(ROOM.dividers[0])}, 1050., ${F1(ROOM.dividers[1])}), ra = rmRod(o, d, ap, ap + vec3(-112., ${F1(ROOM.tableY - 1050)}, -55.)), rb2 = rmRod(o, d, ap, ap + vec3(115., ${F1(ROOM.tableY - 1050)}, 50.)), rk = rmRod(o, d, ap, ap + vec3(0., 90., 0.));
    float wa = max(mix(30., 6., ra.z), ra.y * .0022), wb = max(mix(30., 6., rb2.z), rb2.y * .0022);
    float kd = max(max((1. - smoothstep(wa * .8, wa * 1.2, ra.x)) * step(ra.y, t), (1. - smoothstep(wb * .8, wb * 1.2, rb2.x)) * step(rb2.y, t)), (1. - smoothstep(46., 54., rk.x)) * step(rk.y, t));
    col = mix(col, vec3(.98, .68, .24) * (uLampCol * (.45 + .65 * smoothstep(-.3, .6, ra.x / wa - rb2.x / wb)) * uLampK + amb), kd);
    // THE ROOM'S DUSK (ROOM.dusk, ROOM.fall), by the place the sight has met: on the table and its things and on the floor
    { float ds = o.x + d.x * t - uLampR.x, k = ${ROOM.dusk.toFixed(2)} + ${(1 - ROOM.dusk).toFixed(2)} * rmFall(ds * ds);
      if (t < tw - .01 || own < .5) col *= k; }
    // THE LAMP: the brass font like a hill, its bright rim, the collar with its slots, the gallery that holds the glass
    vec3 lp = vec3(uLampR.x, 0., uLampR.z);
    vec4 eg = rmEgg(o, d, lp + vec3(0., -60., 0.), vec3(310., 200., 310.)); if (eg.x < t) { t = eg.x; col = rmFont(eg.yzw, o + d * t, d); }
    cy = rmCyl(o, d, lp.xz, 128., 118., 172.); if (cy.x < t) { t = cy.x; col = rmBrass(vec3(cy.z, .35, cy.w), o + d * t, d, 1.5) + uLampCol * .55 * uLampK * smoothstep(150., 170., cy.y); }
    cy = rmCyl(o, d, lp.xz, 95., 172., 300.); if (cy.x < t) { t = cy.x; col = rmBrass(vec3(cy.z, 0., cy.w), o + d * t, d, .8) * (1. - .7 * step(.6, fract(atan(cy.w, cy.z) * 3.82)) * step(200., cy.y) * step(cy.y, 270.)); }
    cy = rmCyl(o, d, lp.xz, 132., 300., 336.); if (cy.x < t) { t = cy.x; col = rmBrass(vec3(cy.z, .2, cy.w), o + d * t, d, 1.3); }
    // the burner's milled wheel, on its stem at the side: a brass button, its rim cut in fine teeth
    { vec3 wc = lp + vec3(165., 236., 70.); vec4 ew = rmEgg(o, d, wc, vec3(54., 54., 22.));
      if (ew.x < t) { t = ew.x; vec3 pw = o + d * t - wc; col = rmBrass(ew.yzw, o + d * t, d, 1.3) * (1. - .55 * step(.5, fract(atan(pw.y, pw.x + 1e-4) * 4.14)) * smoothstep(36., 46., length(pw.xy))); }
      vec3 rs2 = rmRod(o, d, wc, lp + vec3(80., 236., 30.)); float ws = max(10., rs2.y * .0022);
      col = mix(col, vec3(.8, .52, .18) * uLampCol * uLampK, (1. - smoothstep(ws * .8, ws * 1.2, rs2.x)) * step(rs2.y, t)); }
    // the chimney and the flame, on the upright plane through the lamp's own axis that faces the eye
    vec2 oc = o.xz - lp.xz; float a = max(dot(d.xz, d.xz), 1e-6), tl = -dot(oc, d.xz) / a, lat = (oc.x * d.z - oc.y * d.x) / sqrt(a), yl = o.y + d.y * tl;
    float seen = step(0., tl) * step(tl, t), rc = 86. + 52. * exp(-(yl - 470.) * (yl - 470.) / 52000.), u = lat / rc, inCh = step(336., yl) * step(yl, ${F1(ROOM.chimneyTop)}) * step(abs(u), 1.) * seen;
    col *= 1. - .3 * inCh * smoothstep(.75, 1., abs(u));
    col += uLampCol * uLampK * inCh * (.05 + .2 * exp(-(u + .5) * (u + .5) / .03) + .1 * exp(-(u - .62) * (u - .62) / .02) + .16 * smoothstep(.8, 1., abs(u)) + .3 * smoothstep(${F1(ROOM.chimneyTop - 26)}, ${F1(ROOM.chimneyTop - 6)}, yl));
    float H = ${F1(ROOM.flameH)} * uFlame.z, yy = clamp((yl - (uLampR.y - ${F1(ROOM.flameH / 2)})) / H, 0., 1.);
    float xo = lat - ${F1(ROOM.flameW)} * (2.2 * uFlame.x * yy * yy + .5 * uFlame.y * yy * sin(yy * 9. - uTime * 17.));
    float w = ${F1(ROOM.flameW)} * (.05 + 1.9 * sqrt(yy) * pow(clamp(1. - yy, 0., 1.), .6)), ends = smoothstep(0., .04, yy) * (1. - smoothstep(.93, 1., yy));
    float core = (1. - smoothstep(w * .3, w * .78, abs(xo))) * ends, mantle = (1. - smoothstep(w * .7, w * 1.3, abs(xo))) * ends;
    float rr = length(vec2(lat, yl - uLampR.y));
    col = mix(col, vec3(0.), max(core, mantle * .8) * seen);
    col += (uLampHeart * core * (1.1 + .5 * yy) + uLampCol * vec3(1., .42, .08) * 1.5 * max(mantle - core * .8, 0.) + uLampCol * vec3(1., .8, .5) * (.3 * exp(-rr / 90.) + .08 * exp(-rr / 330.))) * seen * uLampK;
    return col;
  }`;
// THE GLASS AND THE ROOM BEYOND IT. The vault is thick old green glass and our whole sky: a window on a giant's room.
// Every law here is by place on the wall and by the sight's own angle to it:
// (a) THE SIGHT goes through the long wall almost true (GLASS.bend); it is bent in a few slow waves of the glass
//     (GLASS.wave), drawn evenly toward the axis where the wall turns in at shoulder, neck and base (GLASS.end: one
//     lens), and turned a little through the thick foot (ROOM.lift). (b) TINT by the depth of glass the sight crosses: a
//     clear bottle green, a little deeper where the wall turns in (THICK). (c) GLOSS: the window's light as the window's
//     own four panes, bent with the wall, pale blue; the lamp's as one gold bloom; each at its one place of the long
//     wall. At the bottle's two ends no band: a thin line of light only where the glass turns (THICK). (d) THE MIRROR:
//     at a grazing sight the wall shows the inside (the sea's blue low down, an amber smear at her canvas's place; in
//     the neck, dark glass only). (e) SEEDS: bubbles 6 to 22 m across, each a small lens with
//     the room turned over in it. (f) dust and a few fingermarks outside, where the lamp rakes. (g) THE WATERLINE: the
//     thread of foam, the wet glass over it, the thick dim foot (WET, FOOT_GLASS).
// The shader's head (precision, SEA_GLSL for the sea's own height at the wall, the room's four parts) is joined on in build.
const VAULT_HEAD = /* glsl */`
  uniform vec3 uMid, uAxis, uSide, uLamp, uLampCol, uLampHeart, uGlassLit, uGlassDeep, uFogCol, uSeaCol;
  uniform float uLampK, uPhiL, uSeedK, uFogDen, uDay;
  uniform vec4 uMoth;
  uniform sampler2D uNoise;`;
// WET: the glass stands wet over the waterline from WET.low to WET.high metres up, by the place along the wall
const WET = { low: 2.5, high: 9 }, FOOT_GLASS = { low: 6, high: 30 };
// GLASS.bend: how far the wall's unevenness turns a sight through the long wall (little: the room stands sharp and
// true), GLASS.wave: more in a few slow waves of the glass, GLASS.end: the one lens of the wall's turn at the shoulder,
// the neck and the base (a slow, even bending: what stands beyond an end is seen a little drawn together, whole). GLASS.cell: one seed to a square of this many metres, GLASS.seed: its radius, least and most.
// GLASS.win, GLASS.bloom: the half sizes (metres along the bottle, metres round it) of the window's light on the wall
// and of the lamp's
const GLASS = { bend: 0.003, wave: 0.009, end: 0.09, cell: 58, seed: [3, 11], win: [34, 80], bloom: [34, 24], line: [85, 6], canvas: [0, 75, -66] };
// THE ENDS OF THE BOTTLE ARE THICK CLEAR GLASS, AND THE GLASS'S OWN THICKNESS RULES WHAT IS SEEN OF THEM (the shoulder,
// the neck and the base wall alike, by place, the same for every eye and at every clock). THICK.wall: the wall's
// thickness in metres. THICK.deep: toward an end's rim a sight crosses this share more glass than at its middle, and
// is tinted by that much more and no more. THICK.own: the share of its own colour the glass adds at an end over the
// long wall's (no veil of its own).
// A LINE OF LIGHT LIES ONLY WHERE THE GLASS TURNS, and it is THICK.line of the wall's thickness wide to either hand:
// one where the wall leaves the body for the shoulder (NECK.s0), one down the neck on the lamp's side (a tube takes a
// lamp as one line along it), and one at the base wall on the long wall's inner face, one thickness inside the rim.
// From there inward for THICK.heel thicknesses the base wall's rim is seen edge on: a band of deeper green that fades
// into the pane. Each line is gold on the lamp's side of the bottle and cold on the window's (THICK.gold, THICK.cold:
// their strengths). A line's breadth and strength are by its place alone; drawn, it is never narrower than a pixel
// and a half (the one floor rmLine keeps, as the far threads of her rig keep theirs), and under that floor it
// carries its true share of that width and a third more. No other term of the way to it is in them.
const THICK = { wall: 6, deep: 0.5, own: 0.06, line: 1 / 6, heel: 3, gold: 0.9, cold: 0.6 };
// THE CORK in the neck: its own pale tan and the dark red of the wax round it (both paint, lit in the shader),
// CORK.rim: the wax rim's breadth in metres, CORK.lit: the share of the lamp's light that comes to it down the neck
const CORK = { col: [0.78, 0.63, 0.43], wax: [0.4, 0.05, 0.03], rim: 7, lit: 0.45 };
// AN END OF THE BOTTLE (the shoulder with the neck, and the base wall): END.depth, END.mirror: how deep and how
// mirroring its clear glass is beside the long wall's; END.hi, END.at, END.wide, END.round: the one soft broad
// highlight of the lamp near its rim (its strength; where it lies, of the radius; how soft, of the radius and round)
const END = { depth: 0.6, mirror: 0.2, hi: 0.3, at: 0.86, wide: 0.07, round: 0.55 };
// THE WINDOW'S LIGHT ON THE GLASS is one soft reflection in the window's own shape (four panes: one upright and one
// cross bar, bowed a little as a round wall bows a mirrored thing). It only LIGHTENS what lies behind it: by WINGLOSS.over
// of that, and by WINGLOSS.air of the window's own pale blue so that it does not go out over a dark place. WINGLOSS.fade:
// its edge fades over this share of its half breadth; WINGLOSS.bar: how far a bar takes the light down;
// WINGLOSS.bow: the bars' bow
const WINGLOSS = { over: 0.22, air: 0.012, fade: 0.4, bar: 0.5, bow: 0.12 };
// WHERE A LIGHT OF THE ROOM LIES ON THE GLASS (a place of the bottle, the same for every eye): where its straight way
// to her middle on the bottle's axis comes in through the wall: [metres along the bottle, the angle round it from the top]
const glossAt = (along, across, y) => [along * VAULT_R / Math.hypot(across, y - MID.y), Math.atan2(across, y - MID.y)];
const GLOSS = { lamp: glossAt(ROOM.lamp[0], ROOM.lamp[1], ROOM.flameY), win: glossAt(ROOM.win[0], ROOM.l1, ROOM.win[1]) };
const VAULT_FRAG = /* glsl */`
  varying vec3 vW, vN;
  // (sea: the share of the sea that lies before this place of the wall; the neck holds none and mirrors its own dark glass)
  vec3 mirrorOf(vec3 r, vec3 w, float sea){
    float amb = pow(clamp(dot(r, normalize(vec3(${GLASS.canvas.map(F1).join(', ')}) - w)), 0., 1.), 10.);
    return mix(uGlassDeep * .45 * (.4 + .6 * sea), uSeaCol * .85, (1. - smoothstep(-.03, .1, r.y)) * sea) + vec3(1., .66, .25) * amb * .7 * sea;
  }
  // the room in small, as a seed of the glass turns it over: the flame a bright speck, the pale table and the dark room changed places
  vec3 roomSmall(vec3 d, vec3 w){
    float lam = clamp(dot(d, normalize(uLamp - w)), 0., 1.);
    return mix(vec3(.5, .42, .24), vec3(.03, .06, .05), smoothstep(-.25, .15, d.y)) * (.4 + .6 * uLampK) + (uLampHeart * pow(lam, 260.) * 2.5 + uLampCol * pow(lam, 14.) * .5) * uLampK;
  }
  // THE MOTH (MOTH in the part: its measures and its shade): a great moth AT REST on the OUTSIDE of the glass, seen
  // from below: a furred brown body, six feet on the glass, two feathered feelers, and two pairs of wings held as a
  // resting moth holds them: the fore wings swept back in one broad arrowhead, the hind wings showing between them and
  // the body. Cream and brown: brown at the root, two dark wavy lines across, a dark spot, a pale outer band with a
  // row of dots, a scalloped fringe. The wings stir a little and slowly on the world clock (MOTH.stir, MOTH.flap).
  // q: metres from its middle over its length (x toward its head, along the bottle). uMoth: where it is along the
  // bottle, how far its wings are stirred open (0 to 1), its shiver (radians).
  float sdSeg(vec2 p, vec2 a, vec2 b){ vec2 pa = p - a, ba = b - a; return length(pa - ba * clamp(dot(pa, ba) / dot(ba, ba), 0., 1.)); }
  // a wing as it lies on the glass, swung to an angle about its root: x cover, y the way along it, z across it.
  // tri 0: a round lobe (a hind wing); tri 1: narrow at the root, broad at its outer edge, the tip rounded (a fore wing)
  vec3 wingAt(vec2 p, float ang, float len, float wide, float tri){
    float ca = cos(ang), sa = sin(ang); vec2 w = vec2(ca * p.x + sa * p.y, -sa * p.x + ca * p.y) / vec2(len, wide);
    float t = clamp(w.x, 0., 1.), lobe = pow(max(sin(3.14159 * pow(t, .62)), 0.), .7), e = max((t - .7) / .3, 0.);
    float hw = mix(lobe, (.2 + .8 * pow(t, .85)) * sqrt(max(1. - e * e, 0.)) * smoothstep(0., .05, t), tri) + 1e-3;
    return vec3(step(0., w.x) * step(w.x, 1.) * (1. - smoothstep(hw - .06, hw, abs(w.y))), t, w.y / hw);
  }
  vec4 mothAt(vec2 q){
    vec2 p = vec2(q.x, abs(q.y)); float open = uMoth.y, sh = uMoth.z;
    float fur = texture2D(uNoise, q * 7.).g, dust = texture2D(uNoise, q * 2.3 + .4).r, scale = texture2D(uNoise, q * 19.).b;
    vec3 fw = wingAt(p - vec2(.2, .05), 2.62 - ${MOTH.stir.toFixed(2)} * open + sh, .62, .2, 1.), hw = wingAt(p - vec2(.08, .04), 2.95 - ${(MOTH.stir * 0.6).toFixed(3)} * open + sh * .7, .46, .2, 0.);
    vec3 cream = vec3(.6, .5, .33), brown = vec3(.25, .16, .09);
    // the fore wing: brown at its root, two dark wavy lines, the spot between them, the pale band, its dots, the fringe
    float wav = .035 * sin(fw.z * 7.) + .03 * (dust - .5);
    float l1 = 1. - smoothstep(.012, .04, abs(fw.y - .36 - wav)), l2 = 1. - smoothstep(.012, .04, abs(fw.y - .64 + wav * 1.4 - .05 * fw.z * fw.z));
    float spot = 1. - smoothstep(.6, 1., length(vec2((fw.y - .5) / .05, (fw.z + .25) / .22)));
    float dots = (1. - smoothstep(.2, .45, length(vec2((fw.y - .86) / .05, fract(fw.z * 3.5) - .5)))) * step(abs(fw.z), .95);
    float fringe = smoothstep(.93, .97, fw.y) * (.5 + .5 * step(.5, fract(fw.z * 9.)));
    float vein = 1. - smoothstep(0., .12, abs(fract(fw.z * 3.5 + .5) - .5));
    vec3 fcol = mix(brown * 1.3, cream, smoothstep(.14, .48, fw.y) * (.45 + .55 * smoothstep(.64, .74, fw.y)));
    fcol *= (.72 + .5 * scale) * (.85 + .3 * dust) * (1. - .16 * vein * smoothstep(.2, .5, fw.y)) * (1. - .3 * smoothstep(.7, 1., abs(fw.z)));
    fcol = mix(fcol, brown * .7, max(max(l1, l2) * .85, max(spot * .9, dots * .7)));
    fcol = mix(fcol, cream * 1.1, fringe * .6);
    // the hind wing lies under the fore wing: paler and greyer, in its shade, one curved line and a brown border
    vec3 hcol = mix(cream * vec3(.86, .88, .9), brown, smoothstep(.72, .98, hw.y) * .7) * (.55 + .4 * scale) * (1. - .3 * smoothstep(.6, 1., abs(hw.z)));
    hcol = mix(hcol, brown * .8, (1. - smoothstep(.015, .045, abs(hw.y - .58 - .06 * hw.z * hw.z))) * .7);
    vec4 o = vec4(hcol, hw.x * .92);
    o = mix(o, vec4(fcol, .95), fw.x);
    // (each leg bends once at its knee; its foot is a small pad on the glass)
    float leg = min(min(min(sdSeg(p, vec2(.22, .05), vec2(.29, .13)), sdSeg(p, vec2(.29, .13), vec2(.36, .12))), min(sdSeg(p, vec2(.16, .06), vec2(.19, .15)), sdSeg(p, vec2(.19, .15), vec2(.15, .2)))), min(sdSeg(p, vec2(.1, .05), vec2(.06, .13)), sdSeg(p, vec2(.06, .13), vec2(-.02, .15))));
    float foot = min(min(length(p - vec2(.36, .12)), length(p - vec2(.15, .2))), length(p - vec2(-.02, .15)));
    // (a feeler: a fine curved stem from the head, feathered to either hand along it)
    vec2 fa = vec2(.35, .02), fb = vec2(.56, .2); float ft = clamp(dot(p - fa, fb - fa) / dot(fb - fa, fb - fa), 0., 1.);
    vec2 pf = p + vec2(-.03, .03) * sin(3.14159 * ft);
    float feel = sdSeg(pf, fa, fb) - .024 * step(.45, fract(ft * 18.)) * sin(3.14159 * ft);
    float lines = max(1. - smoothstep(.006, .011, leg), max(1. - smoothstep(.008, .013, foot), 1. - smoothstep(.005, .009, feel)));
    o = mix(o, vec4(.1, .075, .05, 1.), lines);
    // the body: a long ringed abdomen, a broad thorax in thick fur (its edge is the fur's own), a small head, two dark eyes
    float abd = length((p - vec2(-.17, 0.)) / vec2(.27, .065 * (1. - .5 * (1. - smoothstep(-.44, -.17, q.x))))), tho = length((p - vec2(.17, 0.)) / vec2(.14, .105)), hd = length((p - vec2(.31, 0.)) / vec2(.055, .05));
    float tuft = texture2D(uNoise, q * 31.).r;
    float bd = min(abd, min(tho, hd)), body = 1. - smoothstep(.78 - .32 * fur - .18 * tuft * step(tho, abd), 1.04, bd);
    vec3 bcol = mix(brown * 1.25, cream * .85, smoothstep(.45, .8, fur) * .6) * (.6 + .7 * tuft) * (1. - .3 * step(.5, fract(q.x * 24.)) * step(abd, 1.)) * (.55 + .45 * (1. - smoothstep(.3, 1., bd)));
    bcol = mix(bcol, vec3(.05, .04, .03), 1. - smoothstep(.012, .02, length(p - vec2(.325, .032))));
    return mix(o, vec4(bcol, 1.), body);
  }
  void main(){
    vec3 rel = vW - uMid; float s = dot(rel, uAxis); vec3 rad = rel - uAxis * s; float rax = length(rad);
    float rs = dot(rad, uSide), phi = atan(rs, rad.y + 1e-5), rr = clamp(rax / 250., 0., 1.);
    vec3 N = normalize(vN), V = cameraPosition - vW; float dist = max(length(V), 1e-3); vec3 D = -V / dist;
    float c = abs(dot(D, N)), graze = 1. / max(c, .22);
    float dome = step(s, ${(S_RIM + FOOT.push + 1).toFixed(1)}) * (1. - smoothstep(244., 249.8, rax)), cork = step(${(NECK.end - 13).toFixed(1)}, s) * step(rax, ${(NECK.r - 0.4).toFixed(1)});
    float along = (1. - dome) * (1. - cork);
    // the glass is uneven: slow swells of its thickness (n1) and a finer ripple on them (n2); t1, t2: the wall's own two ways
    vec2 gu = vec2(s, phi * 250.) / 360.; vec4 n1 = texture2D(uNoise, gu), n2 = texture2D(uNoise, gu * 3.1 + .37);
    vec2 g = vec2(sin(s * .023 + 2.2 * sin(phi * 1.7 + .4)), sin(phi * 2.1 + s * .008 + 1.1));
    // where the glass bends a sight: a few slow waves of the long wall, and the wall's own turn at shoulder, neck and base
    float turnIn = max(smoothstep(${F1(NECK.s0 - 70)}, ${F1(NECK.s0 + 50)}, s), max(dome, 1. - smoothstep(${F1(S_RIM + FOOT.push)}, ${F1(S_RIM + FOOT.push + THICK.heel * THICK.wall)}, s)));
    float wavy = smoothstep(.55, 1., sin(s * .0105 + 1.9) * sin(phi * 1.3 + .7 + s * .002));
    float bendK = ${GLASS.bend.toFixed(4)} + ${GLASS.wave.toFixed(3)} * wavy;
    // (an end's thick glass is one lens: it draws the sight toward the bottle's axis, evenly, by GLASS.end at the
    // wall's own radius and by none at the end's middle: one slow bending across the whole end. It comes on slowly
    // where the long wall nears the shoulder; on the base wall it goes out again across the rim's own thickness, so
    // what is seen is whole across the rim)
    float lens = ${GLASS.end.toFixed(3)} * max(smoothstep(${F1(NECK.s0 - 70)}, ${F1(NECK.s0 + 50)}, s), dome * (1. - smoothstep(${F1(VAULT_R - THICK.heel * THICK.wall)}, ${F1(VAULT_R - 1)}, rax)));
    vec3 t1 = uAxis - N * dot(uAxis, N); t1 = dot(t1, t1) > .003 ? normalize(t1) : normalize(cross(N, uSide)); vec3 t2 = cross(N, t1);
    // (a) the bent sight
    float lift = ${ROOM.lift.toFixed(2)} * (1. - smoothstep(-20., ${F1(ROOM.liftTop)}, vW.y));
    vec3 d1 = normalize(D + (t1 * g.x + t2 * g.y) * bendK * min(graze, 2.5) - vec3(0., lift, 0.) - rad / 250. * lens), o = rmP(vW);
    vec3 room = rmTrace(o, rmD(d1));
    // the moth stands between the room and the glass (on the body of the bottle only), lit by the lamp it clings toward
    float mothOn = 0.;
    { vec2 mq = vec2(s - uMoth.x, (phi - (${(-MOTH_AT.up * Math.PI / 180).toFixed(4)})) * 250.) / ${F1(MOTH.len)};
      if (max(abs(mq.x), abs(mq.y)) < 1.1 && along > .5) { vec4 mo = mothAt(mq); mothOn = mo.a; room = mix(room, mo.rgb * (uLampCol * .5 * uLampK + vec3(.1, .14, .12)), mo.a); } }
    // (b) the tint, by the depth of glass crossed (the glass is thicker here and thinner there: n1)
    // (AT AN END THE GLASS IS CLEAR, END: the sight crosses END.depth of the long wall's depth of glass, whatever its
    // lean, and THICK.deep more of that toward the rim: what is seen through an end keeps two thirds of its light
    // and colour or more, in every part of it)
    float endDeep = ${END.depth.toFixed(2)} * (1. + ${THICK.deep.toFixed(2)} * max(dome * smoothstep(.55, .95, rr), turnIn * (1. - dome)));
    vec3 tint = exp(-vec3(.3, .03, .17) * (.7 + .5 * n1.b) * mix(1. / max(c, .3), endDeep, turnIn));
    // the glass's own body, lit where the wall faces the lamp from outside; dust on it there, and three fingermarks
    vec3 Lw = normalize(uLamp - vW); float toward = clamp(dot(-N, Lw), 0., 1.), rake = toward * (1. - toward) * 4.;
    // (the lamp's light on the glass itself falls by the wall's own way from the lamp along the bottle)
    float fallS = rmFall((s - uLampR.x) * (s - uLampR.x));
    // (the ends add THICK.own of the glass's own colour over the long wall's, and a third of that of its lit colour: no veil)
    vec3 body = uGlassDeep * (.1 + ${THICK.own.toFixed(3)} * turnIn) + (uLampCol * vec3(.8, .9, .4) * .06 * pow(toward, 1.5) * (.7 + .6 * n1.b) + uGlassLit * (.03 + ${(THICK.own / 3).toFixed(3)} * turnIn) * (.5 + .5 * toward)) * uLampK * (1. + .6 * uDay) * (.25 + .75 * fallS);
    float dust = smoothstep(.62, .9, texture2D(uNoise, gu * 23.).g) * (.4 + .6 * n2.g);
    float mark = 0.;
    ${[[-160, -1.2, 0.3], [130, -0.72, 1.9], [340, -1.33, 4.0]].map(([ms, mp, mr]) => `{ vec2 mq = vec2(s - (${F1(ms)}), (phi - (${mp.toFixed(2)})) * 250.) / vec2(26., 19.); float ml = length(mq); mark += (1. - smoothstep(.75, 1., ml)) * (.5 + .5 * sin((mq.x + .45 * mq.y * mq.y) * 34. + ${mr.toFixed(1)})); }`).join('\n    ')}
    body += uLampCol * (.1 * dust + .06 * mark) * rake * uLampK * along;
    // (the long wall goes dark where it is seen edge on; an end does not: its glass is clear at every lean)
    vec3 col = (room * tint + body) * mix(smoothstep(0., .13, c), 1., turnIn);
    // (e) SEEDS: one to a cell of the wall, GLASS.cell metres square (on the base wall the cells lie across it)
    vec2 sc = (dome > .5 ? vec2(rs, rad.y) : vec2(s, phi * 250.)) / ${F1(GLASS.cell)}, ci = floor(sc);
    float hR = rh(ci + 3.7), R = ${F1(GLASS.seed[0])} + ${F1(GLASS.seed[1] - GLASS.seed[0])} * hR * hR, mg = (R + .5) / ${F1(GLASS.cell)};
    vec2 off = (sc - ci - mg - vec2(rh(ci), rh(ci + 7.3)) * (1. - 2. * mg)) * ${F1(GLASS.cell)} * vec2(1., dome > .5 ? 1. : rr) / R;
    float bd = length(off), fwb = max(fwidth(bd), 1e-4), ball = (1. - smoothstep(1. - fwb, 1., bd)) * step(rh(ci + 53.9), uSeedK * .35) * (1. - cork);
    // (A SEED IS A SMALL BRIGHT RINGLET ON THE WALL: it never stands darker than the glass round it, so no dark speck hangs in the air)
    vec3 inBall = max(col, mix(col, roomSmall(normalize(D - (t1 * off.x + t2 * off.y) * 1.3), vW) * tint, .6));
    col = mix(col, inBall + uGlassLit * .22 * smoothstep(.62, .9, bd) * (.4 + .6 * fallS) + uLampCol * .8 * uLampK * fallS * exp(-dot(off - vec2(.3, .45), off - vec2(.3, .45)) / .03), ball);
    // (d) THE MIRROR at a grazing sight (an end mirrors END.mirror of what the long wall does)
    col = mix(col, mirrorOf(reflect(D, N), vW, 1. - smoothstep(${F1(NECK.s1 - 40)}, ${F1(NECK.s1)}, s)), (.03 + .85 * pow(clamp(1. - c, 0., 1.), 4.) * (1. - ${(1 - END.mirror).toFixed(2)} * turnIn)) * (1. - cork));
    // (c) THE GLOSS: THE WINDOW'S LIGHT lies on the wall as one soft reflection in the window's own shape (four panes
    // round one upright and one cross bar), bent with the wall, pale blue and low; THE LAMP'S as one soft gold bloom. Each lies
    // at ONE PLACE OF THE WALL (GLOSS: where the light's straight way to her middle comes in through the glass), the
    // same for every eye, on the long wall only: they are gone where the shoulder begins
    float lit = .5 + .5 * cos(phi - uPhiL);
    float h1 = ${F1(GLOSS.lamp[0])}, h2 = ${F1(GLOSS.win[0])};
    vec2 wq = vec2(s - h2, (phi - ${GLOSS.win[1].toFixed(3)} - (n1.r - .5) * .03) * 250.) / vec2(${F1(GLASS.win[0])}, ${F1(GLASS.win[1])});
    // (WINGLOSS: soft at its edge, its two bars faint and bowed; no hard side anywhere in it)
    vec2 wb = vec2(wq.x - ${WINGLOSS.bow.toFixed(2)} * (wq.y * wq.y - .33), wq.y - ${(WINGLOSS.bow * 0.7).toFixed(3)} * (wq.x * wq.x - .33));
    float pane = (1. - smoothstep(${(1 - WINGLOSS.fade).toFixed(2)}, 1., abs(wq.x))) * (1. - smoothstep(${(1 - WINGLOSS.fade).toFixed(2)}, 1., abs(wq.y)))
      * (1. - ${WINGLOSS.bar.toFixed(2)} * max(1. - smoothstep(.03, .15, abs(wb.x)), 1. - smoothstep(.02, .09, abs(wb.y))));
    vec2 lq = vec2(s - h1, (phi - (${GLOSS.lamp[1].toFixed(3)})) * 250.) / vec2(${F1(GLASS.bloom[0])}, ${F1(GLASS.bloom[1])});
    // (the lamp's light on the glass is a bright gold LINE along the wall, GLASS.line, with a small bloom round its middle, GLASS.bloom)
    vec2 lq1 = lq * vec2(${F1(GLASS.bloom[0])}, ${F1(GLASS.bloom[1])}) / vec2(${F1(GLASS.line[0])}, ${F1(GLASS.line[1])});
    // (the moth clings outside between the lamp and the wall: where it covers the glass the lamp's light does not lie on it)
    float bloom = (.55 * exp(-dot(lq, lq) * 1.5) + 1.6 * exp(-dot(lq1, lq1) * 1.5)) * (1. - mothOn);
    float onSh = smoothstep(${F1(NECK.s0 + 12)}, ${F1(NECK.s0 + 30)}, s), inNeck = step(${F1(NECK.s1)}, s);
    // THE LINES OF LIGHT WHERE THE GLASS TURNS (THICK), each lw metres to either hand (rmLine: its least drawn width
    // is a pixel and a half, the one floor): one where the wall leaves the body for the shoulder,
    // and one down the neck on the lamp's side. AN END'S CURVE IS TOLD BY ONE SOFT BROAD HIGHLIGHT OF THE LAMP (END):
    // it lies near the rim on the lamp's side of the bottle, END.at of the radius out, soft over END.wide of the
    // radius and END.round radians round, on the base wall's dome and on the shoulder alike, and it is as strong as
    // the lamp's light is at that place along the bottle (the room's dusk law)
    float lw = ${(THICK.wall * THICK.line).toFixed(2)}, dphi = phi - uPhiL; dphi -= 6.2832 * floor(dphi / 6.2832 + .5);
    float turnLine = rmLine(s - ${F1(NECK.s0)}, lw, dist), neckLine = rmLine(dphi * rax, lw, dist) * inNeck;
    col += (col * ${WINGLOSS.over.toFixed(2)} + vec3(.56, .76, 1.) * ${WINGLOSS.air.toFixed(3)}) * pane * (1. - onSh) * along;
    vec3 gloss = uLampCol * vec3(1., .86, .55) * .42 * bloom * uLampK * (1. - onSh);
    float fallW = rmFall((s - ${F1(ROOM.win[0])}) * (s - ${F1(ROOM.win[0])}));
    // (a line is gold where the wall faces the lamp, by the room's own dusk law along the bottle, and cold where it faces the window)
    vec3 gold = uLampCol * ${THICK.gold.toFixed(2)} * uLampK * (${ROOM.dusk.toFixed(2)} + ${(1 - ROOM.dusk).toFixed(2)} * fallS), cold = vec3(.5, .7, 1.) * ${THICK.cold.toFixed(2)} * (.25 + .75 * fallW);
    vec3 lineLit = gold * pow(lit, 5.) + cold * pow(1. - lit, 5.);
    vec3 hiCol = uLampCol * vec3(1., .9, .62) * ${END.hi.toFixed(2)} * uLampK * (${ROOM.dusk.toFixed(2)} + ${(1 - ROOM.dusk).toFixed(2)} * fallS) * exp(-(rr - ${END.at.toFixed(2)}) * (rr - ${END.at.toFixed(2)}) / ${(END.wide ** 2).toFixed(4)} - dphi * dphi / ${(END.round ** 2).toFixed(4)});
    gloss += lineLit * turnLine + gold * neckLine + hiCol * onSh * (1. - inNeck);
    col = (col + gloss) * along + col * (1. - along);
    // THE BASE WALL is the bottom of a bottle seen from inside (THICK, END). Its rim is the glass seen edge on: from
    // the long wall's inner face (one thickness inside the rim: one thin line of light lies there) inward for
    // THICK.heel thicknesses a band of deeper green that fades into the pane, with no edge of its own. Within it the
    // pane is clear: its curve is told by the one soft broad highlight and by the slow bending of what is seen
    float rHeel = ${F1(VAULT_R - THICK.heel * THICK.wall)}, rFace = ${F1(VAULT_R - THICK.wall)};
    float heel = smoothstep(rHeel - ${F1(THICK.wall)}, rHeel + ${F1(THICK.wall)}, rax), heelLine = rmLine(rax - rFace, lw, dist);
    col = mix(col, col * (1. - .3 * heel) + uGlassDeep * (.2 + .3 * n1.b) * heel + lineLit * heelLine + hiCol, dome);
    // THE CORK at the neck's end (CORK): a round plug of pale tan cork, pitted (fine pores, and a few deeper pits),
    // and round it the rim of the sealing wax, a darker red. It gives no light of its own: the lamp's light comes to
    // it down the neck's glass (CORK.lit of the lamp's), most on the lamp's side of its flat face, and the room's
    // shade lights the rest of it; so it stands lighter than the wall beyond it. The wax takes one small gleam
    vec2 cp = vec2(rs, rad.y); float cg = texture2D(uNoise, cp * .011).g, pores = smoothstep(.6, .8, texture2D(uNoise, cp * .05).r), pits = smoothstep(.64, .72, texture2D(uNoise, cp * .019 + .2).b);
    float faceLit = .5 + .5 * dot(cp, vec2(sin(uPhiL), cos(uPhiL))) / ${F1(NECK.r)};
    vec3 farLight = uLampCol * ${CORK.lit.toFixed(2)} * uLampK * (.35 + .9 * faceLit) + vec3(${ROOM.shade.map((v) => v.toFixed(3)).join(', ')});
    vec3 ck = vec3(${CORK.col.map((v) => v.toFixed(2)).join(', ')}) * (.8 + .35 * cg) * (1. - .4 * pores) * (1. - .55 * pits) * farLight;
    vec3 wax = vec3(${CORK.wax.map((v) => v.toFixed(2)).join(', ')}) * (.7 + .5 * cg) * farLight + uLampCol * .25 * uLampK * pow(lit, 12.) * (1. - smoothstep(.6, 1.6, abs(rax - ${F1(NECK.r - CORK.rim / 2)})));
    col = mix(col, mix(ck, wax, smoothstep(${F1(NECK.r - CORK.rim)}, ${F1(NECK.r - CORK.rim + 2.5)}, rax)), cork);
    // WHERE THE SEA MEETS THE GLASS (the sea's own law: its swells and its run up the wall, swell and bankAt). up: metres
    // of this place of the wall over the waterline. Under it the water is seen through the glass, a deep bottle green
    // going dark with the depth; on it lies A THREAD OF FOAM, torn, that the run leaves as it slides back; over it the
    // glass is wet a few metres up (WET) and mirrors the sea: its blue low down, the white of the nearest crests
    vec4 sw = swell(vW.xz); float run = bankAt(vW.xz), up = vW.y - sw.x - run;
    float wn = texture2D(uNoise, vec2((dome > .5 ? rs : s) * .021, uTime * .011)).r, wn2 = texture2D(uNoise, vec2((dome > .5 ? rs : s) * .083 + .3, vW.y * .05 - uTime * .02)).g;
    float wetTop = ${F1(WET.low)} + ${F1(WET.high - WET.low)} * wn, wet = (1. - smoothstep(wetTop * .4, wetTop, up)) * (1. - cork);
    vec2 inw = -normalize(vec2(rad.x, rad.z) + 1e-5); vec4 sw2 = swell(vW.xz + inw * (4. + 1.4 * max(up, 0.)));
    float top = smoothstep(.62, .95, clamp(sw2.x / max(sw2.w, 1.) * .5 + .5, 0., 1.));
    // THE FOOT OF THE GLASS IS THICK (FOOT_GLASS: from the waterline to that many metres over it, by the place): the
    // sight through it is dim and deep green, so what lies low outside (the table's top) is never seen beside the sea
    float foot = (1. - smoothstep(${F1(FOOT_GLASS.low)}, ${F1(FOOT_GLASS.high)} + 10. * wn, up)) * (1. - cork);
    col = mix(col, col * vec3(.12, .28, .2) + uGlassDeep * vec3(.5, 1., .72) * (.2 + .16 * lit + .12 * n1.b) * (.35 + .65 * fallS), foot * .9);
    col = mix(col, col * vec3(.5, .8, .62) + uSeaCol * (.3 + .25 * lit) + vec3(.85, .85, .8) * top * .3, wet * .6);
    col = mix(col, uGlassDeep * vec3(.35, .8, .6) * (.6 - .42 * smoothstep(0., 14., -up)) + uSeaCol * .16, (1. - smoothstep(-.8, .2, up)) * (1. - cork));
    // (WLINE: the thread lies in pieces, by the place, the same pieces the sea's own foam at the glass lies in)
    float thread = (1. - smoothstep(.25, .9 + 1.3 * wn2, abs(up - .3))) * smoothstep(.3, .52, wn2 + .25 * wn) * (1. - cork) * WLINE_PIECE_AT;
    col = mix(col, vec3(.9, .92, .88) * (.3 + .3 * lit), thread * .6);
    float f = 1. - exp(-uFogDen * uFogDen * dist * dist);
    // the glass is the end of the air: it takes two fifths of the haze
    gl_FragColor = vec4(mix(col, uFogCol, clamp(f, 0., 1.) * .4), 1.);
  }`;

// ------------------------------------------------------------------ the sea: blue water that heaves
// three swells run down the wind (heights 4.2, 2.6, 1.4 m; lengths 210, 130, 75 m; periods 16, 12, 9 s), crests sharpened,
// times the seed's sea state (0.8 to 1): within FOLLOW.from of her never over y 8.2, never under -7.4. Each swell's phase
// is dealt from the world's seed (the stream 'gale:sea'): no phase is typed, so no crest is stood anywhere at any clock.
// Under the hull's plan the sheet is held under her keel, so she sits in a working sea that never comes through her.
// seaHeight() is the same law in JS, for the counts.
// each swell: height (m), length (m), period (s), its turn off the wind (radians)
const SWELLS = [[4.2, 210, 16, 0.0], [2.6, 130, 12, 0.21], [1.4, 75, 9, -0.26]];
// THE FOLLOWING SEA (a habit of this sea, by place and by the world clock, the same for every visitor): the largest
// swell of all is heaped in the bottle's foot and runs up astern of her along the bottle, crest after crest, one every
// FOLLOW.per seconds. It has spent itself wholly FOLLOW.from metres along the bottle (measured from her middle; astern
// is negative): that is where the stoop onto her wake comes to ASTERN.near, so no part of it lies under the last
// ASTERN.near metres of the way; it stands FOLLOW.amp metres high from FOLLOW.rise metres further astern, astern of
// the arc (the count of the lens over the sea on seeds 1 to 100 is in the report).
const sAlong = (x, z) => (x - MID.x) * AXIS.x + (z - MID.z) * AXIS.z;
const FOLLOW = { amp: 24, len: 165, per: 14, rise: 58 };
FOLLOW.from = sAlong(LINE.x, ASTERN.near); FOLLOW.full = FOLLOW.from - FOLLOW.rise;
const crestOf = (th) => 1.9 * Math.pow(0.5 + 0.5 * Math.sin(th), 1.6) - 0.9;
const keelUnder = (z) => (z <= -6 ? -12 : -12 + 19 * Math.pow(Math.min(1, (z + 6) / 30), 2));
// her half breadth at a height (the part's own section law, with the stem's rake): where the sea meets her side
function hullBreadth(z, y) {
  if (z > 26 || z < -154) return 0;
  const w = clamp((-110 - z) / 44, 0, 1), rake = y >= 0 ? 4 * (1 - Math.min(1, y / 26)) : 4 + 20 * Math.pow(Math.min(1, -y / 12), 2);
  const zz = Math.min(z - w * w * rake, 24), yb = keelUnder(zz); if (y <= yb || zz < -154) return 0;
  const aft = clamp((zz + 6) / 30, 0, 1), fwd = clamp((-100 - zz) / 54, 0, 1), ym = 6 + 6 * aft + 9 * fwd * fwd, p = 3.2 - 1.3 * aft - 1.5 * fwd;
  if (y >= ym) return halfBeam(zz);
  return halfBeam(zz) * Math.pow(Math.max(0, 1 - Math.pow(Math.min(1, (ym - y) / Math.max(1e-3, ym - yb)), p)), 1 / p);
}
// SHE SITS IN HER SEA (a law by place, the same at every clock). Within CARRY.reach metres of her waterline's plan the
// sea's surface is carried by HER: at her side it is her own waterline (CARRY.wl metres in her frame, turned with her
// roll and pitch: shipAt), and it blends out to the free sea over that distance. On it lie, BUILT, in her frame:
// COLLAR: rolls of foam along her whole waterline (a first roll COLLAR.at metres off her skin, a lower second);
// BOWWAVE: the roll she throws at her bow, to either side: its crest leaves her stem BOWWAVE.lead metres off her skin and
// opens BOWWAVE.open metres a metre aft, gentle toward her and steep outside, where its top is pushed out over its foot
// (BOWWAVE.over); highest as her bow comes down (the pitch law itself); BOIL: the wake boiling up under her counter,
// over stern post and rudder; WAKE: astern, two spreading ridges of white round a churned middle, WAKE.len metres long.
const CARRY = { reach: 20, wl: 1.2 }, COLLAR = { h: 0.9, at: 1.6, wide: 2.2 };
const BOWWAVE = { h: 4.6, len: 46, lead: 1.5, open: 0.36, inner: 3.4, outer: 1.5, over: 2.2 }, BOIL = { h: 5.2, z: 22.5, lx: 7.5, lz: 8, tear: 0.85, skin: 1.5, free: 5, grain: 0.06 };
const WAKE = { half: 9, spread: 0.1, lee: 0.12, len: 190, ridge: 1.3, cut: 1.1, pale: [10, 70] };
// GLINT: the glints' grain is ONE SIZE IN METRES (GLINT.grain: turns of the noise to the metre) for every eye; where a
// pixel's footprint on the water covers many of them (GLINT.rest metres) they lie as their share of the water (GLINT.share)
// GLINT.fine: the grain of the glints of HER OWN lights (her stern lanterns' and her casement's ways lie close under her
// counter, on the churned water of her wake, whose faces are small): so many turns to the metre, laid to rest in the same way
const GLINT = { grain: 0.04, fine: 0.16, cut: [0.58, 0.66], rest: [0.5, 2.4], share: 0.04 };
// her three stern lanterns' light on the sea (SHIP.lanterns: each flame and its size): half its strength LANTERN.reach
// metres from a flame; the wake under them is a road of lace lit amber. LANTERN.k: the share of a flame's light the
// sea gives back at the flame's own foot: the white of the wake takes it as amber, the water between the lace as a
// cold share of it, so the water there keeps its blue (three small horn lanterns, under half of what falls on it)
// WAKE.pale: metres astern of her counter between which the churned middle's pale comes in (by place, for every eye)
const LANTERN = { reach: 46, k: 0.45, path: 190 };
// THE LIGHT OF HER OPEN STERN ON THE SEA (a law by place): the cabin's lamp light pours out of the casement and lies
// down her wake astern as a road of gold: as broad as the casement at her transom and CASEMENT.spread broader with
// every metre astern, half as strong CASEMENT.reach metres astern; the water takes it as broken glints and a low
// gold on what faces up, the white of her wake takes it whole
const CASEMENT = { reach: 150, spread: 0.14, k: 1.6, hollow: 0.3 };
// a world place (x, z) in her frame at her waterline: [x in her frame, the world height of her waterline there, z in her frame]
function shipAt(x, z, mo) {
  const sr = Math.sin(mo.roll), cr = Math.cos(mo.roll), sp = Math.sin(mo.pitch), cp = Math.cos(mo.pitch), h = CARRY.wl - SHIP.P[1];
  const zs = (z - h * sp) / cp, y1 = h * cp - zs * sp, xs = (x - y1 * sr) / cr;
  return [xs, SHIP.P[1] - xs * sr + y1 * cr, zs];
}
// her plan at the waterline (half breadth; abaft where her run closes, the counter's own plan), and metres outside it
const planHalf = (zs) => Math.max(hullBreadth(zs, CARRY.wl), halfBeam(Math.min(zs, 25)) * 0.82 * smoothstep(8, 20, zs));
function planDist(xs, zs) {
  const zc = clamp(zs, -150, 25.5), hb = planHalf(zc), dx = Math.max(Math.abs(xs) - hb, 0), dz = zs - zc, out = Math.hypot(dx, dz);
  return out > 0 ? out : Math.abs(xs) - hb;
}
// what is built on the carried sea, in metres over her waterline: collar, bow wave, boil (the highest each can stand)
function builtAt(xs, zs, d, mo, state) {
  const k = (d - COLLAR.at) / COLLAR.wide, collar = COLLAR.h * Math.exp(-k * k) * smoothstep(-1.5, 0, d);
  const az = Math.max(zs + 150, 0), plunge = clamp(0.5 - 0.5 * mo.pitch / (MOTION.pitch * Math.PI / 180), 0, 1);
  const H = BOWWAVE.h * state * (0.7 + 0.3 * plunge) * Math.exp(-az / BOWWAVE.len) * (1 - smoothstep(60, 110, az)), t = d - BOWWAVE.lead - BOWWAVE.open * az;
  const bow = H * Math.exp(-t * t / (t < 0 ? BOWWAVE.inner * BOWWAVE.inner : BOWWAVE.outer * BOWWAVE.outer)) * smoothstep(-1.5, 0.5, d);
  const boil = BOIL.h * Math.exp(-(xs * xs / (BOIL.lx * BOIL.lx) + (zs - BOIL.z) * (zs - BOIL.z) / (BOIL.lz * BOIL.lz)));
  return collar + bow + boil;
}
// the wake's two ridges, in the free sea's own frame: metres over the swell (they wander a little and stand in lumps, as a
// wake does; the same law in the shader)
function wakeRidge(x, z) {
  const wz = z - 20, wan = (1.7 * Math.sin(wz * 0.071) + 0.9 * Math.sin(wz * 0.19 + 1.7)) * smoothstep(8, 60, wz);
  const wx = Math.abs(x - wz * WAKE.lee - wan), wh = WAKE.half + wz * WAKE.spread, k = (wx - wh) / 2.2;
  const lump = 0.76 + 0.24 * Math.sin(wz * 0.33 + 2 * Math.sin(wz * 0.09));
  return WAKE.ridge * lump * Math.exp(-k * k) * smoothstep(2, 12, wz) * (1 - smoothstep(WAKE.len * 0.6, WAKE.len, wz));
}
// THE SMALL SEAS and the wake's churn (SEA_GLSL) are CUT DOWN from this surface, never raised over it: seaHeight is the
// highest the sea can stand at a place, which is what the counts need.
// phases: the four phases the seed dealt (three swells, the following sea); mo: her roll and pitch at that clock (motionAt)
export function seaHeight(x, z, t, state, phases, mo) {
  let h = 0;
  SWELLS.forEach(([A, len, per, turn], i) => {
    const c = Math.cos(turn), sn = Math.sin(turn), dx = WIND.x * c - WIND.z * sn, dz = WIND.x * sn + WIND.z * c;
    h += A * state * crestOf((x * dx + z * dz) * 6.2832 / len - t * 6.2832 / per + phases[i]);
  });
  const s = sAlong(x, z), env = 1 - smoothstep(FOLLOW.full, FOLLOW.from, s);
  h += FOLLOW.amp * state * env * crestOf(s * 6.2832 / FOLLOW.len - t * 6.2832 / FOLLOW.per + phases[3]);
  const [xs, yw, zs] = shipAt(x, z, mo), d = planDist(xs, zs), built = builtAt(xs, zs, d, mo, state);
  let y = lerp(h + wakeRidge(x, z), yw, 1 - smoothstep(0, CARRY.reach, d)) + built + bankAt(x, z);
  // inside her skin the sheet is held under her keel; under her cabin's plan it never stands within 0.8 m of the floor cloth
  const ys = CARRY.wl + (y - yw), hb = hullBreadth(zs, ys), inside = hb > 0.01 ? 1 - smoothstep(-4, -1.5, Math.abs(xs) - hb) : 0;
  y = lerp(y, Math.min(y, yw + keelUnder(zs) - 2 - CARRY.wl), inside);
  const hold = (1 - smoothstep(15.2, 16.2, Math.abs(xs))) * smoothstep(-2, -1, zs) * (1 - smoothstep(25.6, 26.4, zs));
  return lerp(y, Math.min(y, yw + SHIP.cabin.y0 - 0.8 - CARRY.wl), hold);
}
const G = (v, n = 2) => v.toFixed(n);
// THE SEA MEETS THE GLASS (a law by place and the world clock): the sea fills the bottle from wall to wall for its whole
// length. Within RUNUP.reach metres of the glass it RUNS UP THE WALL AND SLIDES BACK: the surface there rises by up to
// RUNUP.h metres, a surge that travels along the wall (RUNUP.len metres long, one every RUNUP.per seconds). No bank, no
// shore, no putty: where the sea ends is the waterline on the glass, and it is never straight.
const RUNUP = { h: 2.6, reach: 20, len: 140, per: 8 };
// THE WATERLINE IS ONE LAW ROUND THE WHOLE GLASS (the long wall, the shoulder and the base wall alike): the water
// stands dark and green for its last WLINE.dark metres before the glass (WLINE.deep of its light goes at the glass
// itself), and the thread of foam the run leaves there is TORN INTO PIECES by the place and the world clock: it lies
// only where a slow noise of the place stands over WLINE.cut (about a third of the waterline at a time, in pieces
// some tens of metres long: WLINE.grain to the metre), so it is never one unbroken line, near or far
const WLINE = { dark: 5, deep: 0.6, grain: 0.004, cut: [0.5, 0.62] };
const WLINE_PIECE = (xz) => `smoothstep(${WLINE.cut[0].toFixed(2)}, ${WLINE.cut[1].toFixed(2)}, texture2D(uNoise, ${xz} * ${WLINE.grain.toFixed(4)} + vec2(uTime * .002, 0.)).r)`;
function wallGapJS(x, y, z) {
  const rx = x - MID.x, ry = y - MID.y, rz = z - MID.z, s = rx * AXIS.x + rz * AXIS.z, rc = Math.hypot(rx - AXIS.x * s, ry, rz - AXIS.z * s);
  const R = NECK.r + (VAULT_R - NECK.r) * (0.5 + 0.5 * Math.cos(Math.PI * clamp((s - NECK.s0) / (NECK.s1 - NECK.s0), 0, 1)));
  return Math.min(R - rc, s - (S_RIM + FOOT.push * (1 - rc * rc / (VAULT_R * VAULT_R))));
}
// (for the counts: the most the run can stand at a place)
function bankAt(x, z) { const k = 1 - clamp(wallGapJS(x, 0, z) / RUNUP.reach, 0, 1); return RUNUP.h * k * k; }
const SEA_GLSL = /* glsl */`
  uniform float uTime, uState, uRunPh;
  uniform vec2 uWind, uMotion;
  uniform vec4 uPhase;
  float halfBeam(float z){
    if (z > 26. || z < -154.) return 0.;
    if (z >= -10.) return 22. - 5. * pow(clamp((z + 10.) / 34., 0., 1.), 1.7);
    if (z >= -110.) return 22.;
    return 22. * sqrt(max(0., 1. - pow(clamp((-110. - z) / 44., 0., 1.), 2.4)));
  }
  float keelUnder(float z){ return z <= -6. ? -12. : -12. + 19. * pow(clamp((z + 6.) / 30., 0., 1.), 2.); }
  // her half breadth at a height (the part's own section law, with the stem's rake): where the sea meets her side
  float hullBreadth(float z, float y){
    if (z > 26. || z < -154.) return 0.;
    float w = clamp((-110. - z) / 44., 0., 1.), rake = y >= 0. ? 4. * (1. - min(1., y / 26.)) : 4. + 20. * pow(clamp(-y / 12., 0., 1.), 2.);
    float zz = min(z - w * w * rake, 24.), yb = keelUnder(zz); if (y <= yb || zz < -154.) return 0.;
    float aft = clamp((zz + 6.) / 30., 0., 1.), fwd = clamp((-100. - zz) / 54., 0., 1.), ym = 6. + 6. * aft + 9. * fwd * fwd, p = 3.2 - 1.3 * aft - 1.5 * fwd;
    if (y >= ym) return halfBeam(zz);
    return halfBeam(zz) * pow(max(0., 1. - pow(clamp((ym - y) / max(1e-3, ym - yb), 0., 1.), p)), 1. / p);
  }
  // SHE SITS IN HER SEA (the same laws as shipAt, planHalf, planDist, builtAt and wakeRidge in JS). uMot: her roll and
  // pitch at this clock. shipAt: a world place in her frame at her waterline (x: across her, y: the world height of
  // her waterline there, z: along her)
  uniform vec2 uMot;
  vec3 shipAt(vec2 p){
    float sr = sin(uMot.x), cr = cos(uMot.x), sp = sin(uMot.y), cp = cos(uMot.y), h = ${G(CARRY.wl - SHIP.P[1])};
    float zs = (p.y - h * sp) / cp, y1 = h * cp - zs * sp, xs = (p.x - y1 * sr) / cr;
    return vec3(xs, ${G(SHIP.P[1])} - xs * sr + y1 * cr, zs);
  }
  float planHalf(float zs){ return max(hullBreadth(zs, ${G(CARRY.wl)}), halfBeam(min(zs, 25.)) * .82 * smoothstep(8., 20., zs)); }
  // metres outside her plan at the waterline (negative inside); dirOut: the way out from her, in her frame
  float planDist(vec2 q, out vec2 dirOut){
    float zc = clamp(q.y, -150., 25.5), hb = planHalf(zc), sx = q.x < 0. ? -1. : 1.;
    vec2 dv = vec2(sx * max(abs(q.x) - hb, 0.), q.y - zc); float o = length(dv);
    dirOut = o > 1e-3 ? dv / o : vec2(sx, 0.);
    return o > 0. ? o : abs(q.x) - hb;
  }
  // what is built on the carried sea (x: metres over her waterline; y: metres its top is pushed out over its foot;
  // z: the bow wave's own share, for its white). The rolls of the collar are lumps a few metres long
  vec3 builtAt(vec2 q, float d){
    float lump = .55 + .45 * abs(sin(q.y * .83 + 1.7 * sin(q.y * .21) + q.x * .3));
    float k = (d - ${G(COLLAR.at)}) / ${G(COLLAR.wide)}, k2 = (d - 5.4) / 1.5;
    float collar = ${G(COLLAR.h)} * (lump * exp(-k * k) + .45 * (1.5 - lump) * exp(-k2 * k2)) * smoothstep(-1.5, 0., d);
    float az = max(q.y + 150., 0.), plunge = clamp(.5 - .5 * uMot.y / ${G(MOTION.pitch * Math.PI / 180, 5)}, 0., 1.);
    float H = ${G(BOWWAVE.h)} * uState * (.7 + .3 * plunge) * exp(-az / ${G(BOWWAVE.len, 1)}) * (1. - smoothstep(60., 110., az)) * (.78 + .22 * sin(az * .61 + 2.1 * sin(az * .17 + q.x * .2) - uTime * 1.3));
    float t = d - ${G(BOWWAVE.lead)} - ${G(BOWWAVE.open)} * az, wd = t < 0. ? ${G(BOWWAVE.inner)} : ${G(BOWWAVE.outer)};
    float prof = exp(-t * t / (wd * wd)) * smoothstep(-1.5, .5, d), bow = H * prof;
    vec2 bq = (q - vec2(0., ${G(BOIL.z)})) / vec2(${G(BOIL.lx)}, ${G(BOIL.lz)});
    float boil = ${G(BOIL.h)} * exp(-dot(bq, bq));
    return vec3(collar + bow + boil, ${G(BOWWAVE.over)} * bow / ${G(BOWWAVE.h)} * smoothstep(.45, 1., prof) * step(-1., t), bow);
  }
  // THE WAKE astern, in the free sea: x: its two spreading ridges (metres over the swell); y: its churned middle (0 to 1),
  // where the water is lumps and pits (churnAt: 0 on a lump, 1 in a pit), cut down
  vec2 wakeAt(vec2 p){
    float wz = p.y - 20., wan = (1.7 * sin(wz * .071) + .9 * sin(wz * .19 + 1.7)) * smoothstep(8., 60., wz);
    float wx = abs(p.x - wz * ${G(WAKE.lee)} - wan), wh = ${G(WAKE.half, 1)} + wz * ${G(WAKE.spread)}, k = (wx - wh) / 2.2;
    float env = smoothstep(2., 12., wz) * (1. - smoothstep(${G(WAKE.len * 0.6, 1)}, ${G(WAKE.len, 1)}, wz));
    return vec2(${G(WAKE.ridge)} * (.76 + .24 * sin(wz * .33 + 2. * sin(wz * .09))) * exp(-k * k), 1. - smoothstep(wh - 3., wh, wx)) * env;
  }
  // metres from a place to the glass (the body's wall, the shoulder, the base wall's dome)
  float wallGap(vec3 w){
    vec3 rel = w - vec3(${G(MID.x, 1)}, ${G(MID.y, 1)}, ${G(MID.z, 1)}), ax = vec3(${AXIS.x.toFixed(5)}, 0., ${AXIS.z.toFixed(5)});
    float s = dot(rel, ax), rc = length(rel - ax * s);
    float R = ${G(NECK.r, 1)} + ${G(VAULT_R - NECK.r, 1)} * (.5 + .5 * cos(3.14159 * clamp((s - ${G(NECK.s0, 1)}) / ${G(NECK.s1 - NECK.s0, 1)}, 0., 1.)));
    return min(R - rc, s - (${G(S_RIM, 1)} + ${G(FOOT.push, 1)} * (1. - rc * rc / ${G(VAULT_R * VAULT_R, 1)})));
  }
  float churnAt(vec2 p){
    vec2 q = p + 1.7 * vec2(sin(p.y * .31 + uTime * .7), sin(p.x * .37 - uTime * .5));
    float a = sin(q.x * .83 + 1.3 * sin(q.y * .47)) * sin(q.y * .61 - uTime * 1.1), b = sin(q.x * 1.1 + q.y * .6) * sin(q.y * .9 - q.x * .4 + uTime * .8);
    return clamp(.5 - .4 * a - .14 * b, 0., 1.);
  }
  // THE SMALL SEAS: short stiff crests lying across the wind and travelling down it, each a ridge of its own in a
  // seeded scatter (uScatter: the seed's two offsets): steep to weather, long to lee, of its own length and height,
  // one in three or so left out. x: its height as a share (0 in the hollows, 1 on the tallest ridge top); y: the share
  // of white its top carries (a whitecap on the crests the scatter picks)
  uniform vec4 uScatter;
  float h21s(vec2 p){ p = fract(p * vec2(123.34, 456.21) + uScatter.xy); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  vec2 crests(float al, float ac, float lam, float lane, float pace, float set){
    float lq = ac / lane + set * .37, li = floor(lq), lf = fract(lq);
    float ph = (al - pace * uTime) / lam + h21s(vec2(li, set)) * 7., ci = floor(ph), cf = fract(ph);
    float pick = h21s(vec2(li * 1.7 + ci * .61, set + 3.1)), tall = h21s(vec2(ci * 1.3 - li, set + 7.7));
    float e = clamp(1. - abs(lf - .5) * 2. / (.45 + .55 * pick), 0., 1.); e = e * e * (3. - 2. * e);
    float up = clamp(cf / .62, 0., 1.), prof = up * up * up * (1. - smoothstep(.62, .8, cf));
    float h = e * prof * (.4 + .6 * tall) * step(.3, pick);
    return vec2(h, h * smoothstep(.5, .9, prof) * step(.62, tall));
  }
  vec2 smallSeas(vec2 p){
    float al = dot(p, uWind), ac = dot(p, vec2(-uWind.y, uWind.x));
    vec2 a = crests(al, ac, 17., 31., 5.1, 0.), b = crests(al * .97 + ac * .24, ac * .97 - al * .24, 27., 47., 6.5, 1.) * vec2(.8, 1.);
    return a.x > b.x ? a : b;
  }
  // metres along the bottle from her middle (astern is negative)
  float sAlong(vec2 p){ return dot(p - vec2(${MID.x.toFixed(1)}, ${MID.z.toFixed(1)}), vec2(${AXIS.x.toFixed(5)}, ${AXIS.z.toFixed(5)})); }
  // THE RUN UP THE GLASS (RUNUP): metres the sea stands over its own swell at a place, by its way from the wall and
  // the surge's own clock along the wall
  float bankAt(vec2 p){
    float k = 1. - clamp(wallGap(vec3(p.x, 0., p.y)) / ${F1(RUNUP.reach)}, 0., 1.), sa = sAlong(p);
    return ${F1(RUNUP.h)} * k * k * (.5 + .5 * sin(sa * ${(6.2832 / RUNUP.len).toFixed(5)} + 1.7 * sin(sa * .013 + p.x * .004) + uRunPh - uTime * ${(6.2832 / RUNUP.per).toFixed(5)}));
  }
  // the sea at a place: x its height, yz its slope, w the height it can reach there
  vec4 swell(vec2 p){
    vec4 r = vec4(0.);
    ${SWELLS.map(([A, len, per, turn], i) => `{
      vec2 d = vec2(uWind.x * ${Math.cos(turn).toFixed(5)} - uWind.y * ${Math.sin(turn).toFixed(5)}, uWind.x * ${Math.sin(turn).toFixed(5)} + uWind.y * ${Math.cos(turn).toFixed(5)});
      float k = ${(6.2832 / len).toFixed(6)}, th = dot(p, d) * k - uTime * ${(6.2832 / per).toFixed(6)} + uPhase[${i}];
      float b = clamp(.5 + .5 * sin(th), 0., 1.);
      r.x += ${A.toFixed(2)} * uState * (1.9 * pow(b, 1.6) - .9);
      r.yz += ${A.toFixed(2)} * uState * 1.52 * pow(b, .6) * cos(th) * k * d;
    }`).join('\n    ')}
    {
      // the following sea: its share by place (and that share's own slope), its crests running up the bottle toward her
      float s = sAlong(p), q = clamp((s - ${FOLLOW.full.toFixed(1)}) / ${(FOLLOW.from - FOLLOW.full).toFixed(1)}, 0., 1.);
      float env = 1. - q * q * (3. - 2. * q), denv = -6. * q * (1. - q) / ${(FOLLOW.from - FOLLOW.full).toFixed(1)};
      float k = ${(6.2832 / FOLLOW.len).toFixed(6)}, th = s * k - uTime * ${(6.2832 / FOLLOW.per).toFixed(6)} + uPhase.w;
      float b = clamp(.5 + .5 * sin(th), 0., 1.), c = 1.9 * pow(b, 1.6) - .9;
      r.x += ${FOLLOW.amp.toFixed(1)} * uState * env * c;
      r.yz += ${FOLLOW.amp.toFixed(1)} * uState * (denv * c + env * 1.52 * pow(b, .6) * cos(th) * k) * vec2(${AXIS.x.toFixed(5)}, ${AXIS.z.toFixed(5)});
      r.w = (8.2 + ${FOLLOW.amp.toFixed(1)} * env) * uState;
    }
    return r;
  }`;
// RIPPLE: the two trains of small waves the sea carries near the eye: their lengths (metres to one turn of the noise),
// their pace (turns a second), how steep
const RIPPLE = { len: [46, 17], pace: [0.05, 0.11], steep: [1.5, 1.1] };
// where the window stands, in the world (its light on the sea)
const WIN_AT = atSL(ROOM.win[0], ROOM.l1, ROOM.win[1]);
// the small seas are cut SMALL_CUT metres deep at most below the swells' surface
const SMALL_CUT = 0.95;
// LACE: the white of a breaking swell: from this share of the swell's height up; its patches drift this many m/s down the wind
const LACE = { from: 0.58, drift: 3 };
const SEA_VERT = /* glsl */`
  ${SEA_GLSL}
  varying vec3 vW; varying vec4 vSw, vShip; varying float vIn;
  void main(){
    vec3 p = position; vec4 sw = swell(p.xz);
    // the free sea (the swells and the wake's ridges) gives way to her own waterline within CARRY.reach metres of her plan
    vec3 sa = shipAt(p.xz); vec2 dir; float d = planDist(sa.xz, dir), kc = 1. - smoothstep(0., ${G(CARRY.reach, 1)}, d);
    vec3 bl = builtAt(sa.xz, d); vec2 wk = wakeAt(p.xz);
    float y = mix(sw.x + wk.x, sa.y, kc) + bl.x + bankAt(p.xz);
    // the small seas and the wake's churn are cut down from that surface (the small seas less, close under her side)
    y -= ${SMALL_CUT.toFixed(2)} * uState * (1. - smallSeas(p.xz).x) * (1. - .6 * kc) + ${G(WAKE.cut)} * wk.y * churnAt(p.xz) * (1. - kc);
    // inside her skin, at the sea's own height in her frame, the sheet is held under her keel: it meets her side and
    // never comes through; under the cabin's plan it never stands within 0.8 m of the floor cloth
    float ys = ${G(CARRY.wl)} + (y - sa.y), hb = hullBreadth(sa.z, ys); vIn = hb > .01 ? 1. - smoothstep(-4., -1.5, abs(sa.x) - hb) : 0.;
    y = mix(y, min(y, sa.y + keelUnder(sa.z) - ${G(2 + CARRY.wl)}), vIn);
    float hold = (1. - smoothstep(15.2, 16.2, abs(sa.x))) * smoothstep(-2., -1., sa.z) * (1. - smoothstep(25.6, 26.4, sa.z));
    y = mix(y, min(y, sa.y + ${G(SHIP.cabin.y0 - 0.8 - CARRY.wl)}), hold);
    // the bow wave's top is pushed out over its foot, the way out from her
    p.xz += dir * bl.y; p.y = y;
    vW = p; vSw = sw; vShip = vec4(sa.x, sa.z, d, kc);
    gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.);
  }`;
// THE SEA IS WATER, AND IT IS BLUE: deep blue (ultramarine, going to indigo and blue black in the troughs, a greener
// blue on the lit shoulders of the swells; what is turned from the lamp goes to the green of deep water), white lace
// over the crests. Its grain is laid in world space from three sides (tri) and is the same every way: nothing is drawn
// out into streaks. Near the eye it carries its own small waves (RIPPLE); the lamp, the window and her stern lanterns
// lie on it as broken paths of small glints, never as a wash.
const SEA_FRAG = /* glsl */`
  precision highp float;
  ${SEA_GLSL}
  uniform vec3 uKeyDir, uKeyCol, uSeaSky, uSeaGround, uFogCol, uDeep, uIndigo, uBlack, uLitBlue, uWhite, uWhiteShade, uSheen, uBlurC;
  uniform float uFogDen, uCaus; uniform vec3 uLant, uLantCol;
  ${MOTH_GLSL}
  uniform sampler2D uNoise;
  uniform vec2 uNet;
  varying vec3 vW; varying vec4 vSw, vShip; varying float vIn;
  float caus(vec2 p, float t){
    vec2 q = p * .085; q += .9 * vec2(sin(q.y * 1.7 + t * .5), sin(q.x * 1.9 - t * .43));
    float a = sin(q.x * 3.1 + t * .31) * sin(q.y * 2.7 - t * .27);
    float c = clamp(1. - abs(a) * 2.2, 0., 1.); return c * c * c;
  }
  vec4 tri(vec3 q, vec3 tw){ return texture2D(uNoise, q.xz) * tw.y + texture2D(uNoise, q.zy) * tw.x + texture2D(uNoise, q.xy) * tw.z; }
  // the surface without its small seas (the vertex shader's own law)
  float baseH(vec2 p){
    vec3 sa = shipAt(p); vec2 dir; float d = planDist(sa.xz, dir);
    return mix(swell(p).x + wakeAt(p).x, sa.y, 1. - smoothstep(0., ${G(CARRY.reach, 1)}, d)) + builtAt(sa.xz, d).x;
  }
  void main(){
    vec2 p = vW.xz, ex = vec2(.35, 0.), ez = vec2(0., .35); float kc = vShip.w, d = vShip.z;
    // the form of the water: near her and in her wake by the law itself, elsewhere the swells' own slope
    vec2 wk = wakeAt(p), slope = vSw.yz;
    if (d < 75.) { float h0 = baseH(p); slope = vec2(baseH(p + ex) - h0, baseH(p + ez) - h0) / .35; }
    else slope += vec2(wakeAt(p + ex).x - wk.x, wakeAt(p + ez).x - wk.x) / .35;
    slope += vec2(bankAt(p + ex) - bankAt(p), bankAt(p + ez) - bankAt(p)) / .35;
    vec2 ss = smallSeas(p); float ch = churnAt(p), cutK = ${SMALL_CUT.toFixed(2)} * uState * (1. - .6 * kc) / .35, chK = wk.y * (1. - kc) * ${G(WAKE.cut)} / .35;
    slope += vec2(smallSeas(p + ex).x - ss.x, smallSeas(p + ez).x - ss.x) * cutK + vec2(churnAt(p + ex) - ch, churnAt(p + ez) - ch) * chK;
    vec3 N = normalize(vec3(-slope.x, 1., -slope.y)), tw = pow(abs(N), vec3(4.)); tw /= tw.x + tw.y + tw.z;
    // the marks: tone patches, the brush's hairs (two ways from above, level along a steep face), tooth and grit
    vec4 t1 = tri(vW * .0061 + .1, tw), t3 = tri(vW * .13, tw), t4 = tri(vW * .011 + .37, tw);
    float al = dot(p, uWind), ac = dot(p, vec2(-uWind.y, uWind.x)), al2 = al * .47 + ac * .883, ac2 = ac * .47 - al * .883;
    // (the grain is the same every way: nothing is drawn out into streaks under the eye)
    float bristle = tri(vW * .047 + .7, tw).g * .65 + t3.r * .35;
    float tooth = t3.a, grit = t3.g, px = fwidth(ac);
    // the water carries small stiff ridges, two ways in patches; they
    // stand on what faces up (a steep face keeps its own form)
    float way = smoothstep(.44, .56, t1.r); vec2 rq = mix(vec2(al, ac), vec2(al2, ac2), way) * vec2(.027, .013);
    float rg = texture2D(uNoise, rq).r, rgx = texture2D(uNoise, rq + vec2(.004, 0.)).r, rgy = texture2D(uNoise, rq + vec2(0., .004)).r;
    vec2 rgrad = vec2(rgx - rg, rgy - rg) * (vec2(.027, .013) / .004), wa = mix(uWind, vec2(.47 * uWind.x - .883 * uWind.y, .47 * uWind.y + .883 * uWind.x), way);
    vec3 N0 = N;
    vec3 bl = builtAt(vShip.xy, d); float built = smoothstep(.12, .5, bl.x) * smoothstep(-2., -.5, d);
    N = normalize(N + vec3(-(wa.x * rgrad.x - wa.y * rgrad.y), 0., -(wa.y * rgrad.x + wa.x * rgrad.y)) * (.7 * tw.y + 3. * built));
    // THE WAVES' OWN SMALL WAVES: two trains of ripples (RIPPLE: metres long), one down the wind and one across it, each
    // running on the clock; sharp near the eye, laid to rest where a pixel covers many of them
    vec2 r1 = p / ${F1(RIPPLE.len[0])} + uWind * uTime * ${RIPPLE.pace[0].toFixed(3)}, r2 = (p * mat2(.8, .6, -.6, .8)) / ${F1(RIPPLE.len[1])} - vec2(-uWind.y, uWind.x) * uTime * ${RIPPLE.pace[1].toFixed(3)} + .37;
    vec2 rg1 = vec2(texture2D(uNoise, r1 + vec2(.006, 0.)).r - texture2D(uNoise, r1 - vec2(.006, 0.)).r, texture2D(uNoise, r1 + vec2(0., .006)).r - texture2D(uNoise, r1 - vec2(0., .006)).r);
    vec2 rg2 = vec2(texture2D(uNoise, r2 + vec2(.006, 0.)).b - texture2D(uNoise, r2 - vec2(.006, 0.)).b, texture2D(uNoise, r2 + vec2(0., .006)).b - texture2D(uNoise, r2 - vec2(0., .006)).b);
    float calmK = 1. - smoothstep(.25, 1.6, px);
    vec2 rip = (rg1 * ${RIPPLE.steep[0].toFixed(1)} + rg2 * mat2(.8, -.6, .6, .8) * ${RIPPLE.steep[1].toFixed(1)}) * calmK * (1. - .7 * built);
    N = normalize(N + vec3(-rip.x, 0., -rip.y));
    float bk0 = bankAt(p), hn = clamp((vW.y - bk0) / max(vSw.w, 1.) * .5 + .5, 0., 1.), hollow = 1. - smoothstep(0., .35, ss.x);
    // THE PAINT: blue black in the troughs, indigo, ultramarine, a greener blue on the shoulders the lamp finds
    vec3 alb = mix(uIndigo, uDeep, smoothstep(.2, .62, hn + .12 * (t1.r - .5)));
    alb = mix(uBlack, alb, smoothstep(.03, .3, hn + .1 * (t1.g - .5)));
    alb = mix(alb, uLitBlue, clamp(dot(N, uKeyDir) * 1.5, 0., 1.) * smoothstep(.45, .8, hn) * .75);
    alb = mix(alb, uIndigo * .7, hollow * .4) * (.82 + .36 * bristle) * (.85 + .3 * smoothstep(.35, .65, t1.b)) * (.9 + .2 * tooth);
    // each wave has a bright side and a deep blue-green side: what is turned from the lamp goes to the green of deep water
    alb = mix(alb, vec3(.012, .1, .115), (1. - clamp(dot(N, uKeyDir) * 1.6 + .45, 0., 1.)) * .55);
    // white over what stands highest: the crest lines of the swells, the tops of the small ridges
    // THE CRESTS BREAK IN LACE: high on a swell the white lies in patches and tatters (LACE: a web of threads round
    // dark holes, two isolines of slow noise, in patches of their own) that drift down the wind and trail down the
    // swell's back; only the very top is whole. The chop's own tops carry a touch of the same web, never a dash
    vec2 lp = p - uWind * uTime * ${G(LACE.drift, 1)};
    float la = texture2D(uNoise, lp * .0115).r, lb = texture2D(uNoise, lp * .027 + .5).b, lc = texture2D(uNoise, lp * .0038 + .2).r, ridge = smoothstep(.45, .95, ss.x);
    float web = max(1. - smoothstep(.012, .045, abs(la - .5)), .8 * (1. - smoothstep(.015, .05, abs(lb - .52))));
    float lace = smoothstep(${G(LACE.from)}, .9, hn + .14 * (lc - .5)) * smoothstep(.38, .6, lc) * (.22 + .78 * web) + smoothstep(.88, .99, hn) * .85;
    float cr = clamp(lace + ridge * ss.y * web * .7, 0., 1.) * (1. - .7 * kc);
    // the wake: A ROAD OF LACE: torn white on the lumps of its churned pale middle and on its two ridges, in the same
    // web of threads as the breaking crests
    // (the churned middle keeps its lace right up to the boil under her counter: only outside it does the sea she
    // carries lie plain)
    float torn = texture2D(uNoise, p * .023 + vec2(0., uTime * .003)).r * .6 + texture2D(uNoise, p * .071).g * .4;
    float wakeW = max(wk.y * (.1 + .8 * smoothstep(.44, .62, torn)) * (.25 + .75 * (1. - ch)) * (.3 + .7 * web), smoothstep(.15, .7, wk.x) * (.5 + .5 * smoothstep(.36, .58, torn)) * (.45 + .55 * web)) * (1. - kc * (1. - wk.y));
    float ww = clamp(max(cr, wakeW), 0., 1.), dry = bristle * .62 + tooth * .26 + .12 * t1.g;
    float white = smoothstep(.9 - .78 * ww, 1.04 - .74 * ww, dry) * smoothstep(0., .08, ww);
    // where one pixel covers many hairs the texture has already run them together: there the white is its share of the surface
    white = mix(white, smoothstep(.22, .86, ww), smoothstep(.08, .55, px));
    // (the churned middle's pale is froth spread fine, A LAW OF THE WAKE'S OWN PLACE, the same for every eye: within
    // WAKE.pale[0] metres astern of her counter the churn is new and deep water shows between the lace; by WAKE.pale[1]
    // metres astern it stands whole, in the churn's own lumps)
    alb = mix(alb, mix(uDeep, uWhite, .4), wk.y * (1. - kc) * .3 * (1. - ch) * smoothstep(${G(WAKE.pale[0], 1)}, ${G(WAKE.pale[1], 1)}, p.y - ${G(SHIP.transomOut)}) * (.5 + .5 * smoothstep(.4, .6, torn)));
    alb = mix(alb, mix(uWhiteShade, uWhite, clamp(.25 + 1.1 * bristle, 0., 1.)), white);
    // THE BUILT WHITE round her: the collar's rolls, the bow wave, the boil under her counter: thick foam
    // (the collar's rolls and the boil are white all through; the bow wave is white on its crest and its steep outer
    // face, torn where the dry brush left it, and its long inner slope shows the blue)
    float foam = max(max(smoothstep(.12, .5, bl.x - bl.z), smoothstep(.5, 1.7, bl.z) * (.5 + .5 * smoothstep(.3, .55, dry))), 1. - smoothstep(.5, 3.2, d)) * smoothstep(-2., -.5, d);
    // the boil is churned water, not a bank of snow: clear of her skin (BOIL.skin to BOIL.free metres off her plan) its
    // white is torn, in lumps BOIL.grain to the metre that work on the clock, and the blue paint shows in the gaps
    float bt = texture2D(uNoise, p * ${G(BOIL.grain)} + vec2(0., uTime * .015)).r * .65 + torn * .35;
    foam *= 1. - ${G(BOIL.tear)} * smoothstep(.12, .5, bl.x - bl.z) * smoothstep(${G(BOIL.skin)}, ${G(BOIL.free)}, d) * (1. - smoothstep(.46, .6, bt));
    // THE WHITE UNDER HER COUNTER IS LACE: in the boil's own plan the white stands only on the web's threads and the
    // lumps' tops; between them the deep water shows. The plan is THE BOIL'S OWN WHITE, the whole of it (wherever the
    // boil's height alone stands over the foam's own threshold), clear of her skin
    { vec2 bq = (vShip.xy - vec2(0., ${G(BOIL.z)})) / vec2(${G(BOIL.lx)}, ${G(BOIL.lz)}); float inBoil = smoothstep(.12, .5, ${G(BOIL.h)} * exp(-dot(bq, bq))) * smoothstep(.6, 2.2, d);
      foam *= 1. - .92 * inBoil * (1. - max(web, smoothstep(.56, .7, bt))); }
    alb = mix(alb, mix(uWhiteShade, uWhite, clamp(.3 + .8 * tooth + .4 * bristle, 0., 1.)), foam * (.75 + .25 * smoothstep(.3, .6, dry)));
    // a painted seam at her skin: a dark line where the sea meets her
    alb = mix(alb, uBlack, (1. - smoothstep(.1, .45, d)) * step(-1.4, d) * .8);
    // AT THE GLASS the water stands deep and green (the bottle's own colour comes down into it) and carries the thread
    // of foam its run leaves, torn, a few metres wide by the place
    float gap = wallGap(vW), fw2 = 1.2 + 3.5 * t4.r;
    alb = mix(alb, vec3(.01, .13, .1), (1. - smoothstep(1., 16., gap)) * .7);
    alb = mix(alb, mix(uWhiteShade, uWhite, .5 + .5 * tooth), (1. - smoothstep(fw2 * .4, fw2, gap)) * smoothstep(.42, .6, torn) * .55 * ${WLINE_PIECE('vW.xz')});
    float dif = clamp(dot(N, uKeyDir) * .8 + .2, 0., 1.);
    float ms = mothShade(vW);   // the moth's dusk on the sea: the lamp's light goes where its shadow lies
    vec3 toWin = normalize(vec3(${F1(WIN_AT[0])}, ${F1(WIN_AT[1])}, ${F1(WIN_AT[2])}) - vW);
    // (water gives the lamp back as glints, not as a wash: on the blue itself the lamp's light is taken at its strength
    // only, a little to the green, so no lit face goes brown or purple; the white takes the lamp's own gold)
    vec3 keyW = mix(vec3(dot(uKeyCol, vec3(.333))) * vec3(.6, .98, 1.12), uKeyCol, clamp(white + foam, 0., 1.));
    vec3 lightv = mix(uSeaGround, uSeaSky, .5 + .5 * N.y) + keyW * dif * dif * 2.1 * ms + vec3(.3, .5, 1.) * .5 * pow(clamp(dot(N, toWin) * .7 + .3, 0., 1.), 2.);
    lightv += keyW * uCaus * caus(p * .5 + uNet, uTime) * (1. - .5 * white) * ms;
    // her three stern lanterns throw their gold on the sea by place: on what faces each, falling with the square of
    // the way from it, and one track of gold down the wake toward the eye (from the great one)
    vec3 toL = uLant - vW; float dl = max(length(toL), 1.); toL /= dl;
    float lant = 0.;
    ${SHIP.lanterns.map((q) => `{ vec3 tq = uLant + vec3(${G(q[0] - SHIP.lantern[0], 1)}, ${G(q[1] - SHIP.lantern[1], 1)}, ${G(q[2] - SHIP.lantern[2], 1)}) - vW; float dq = max(dot(tq, tq), 1.); lant += ${G(q[3])} * clamp(dot(N, tq / sqrt(dq)) * .7 + .3, 0., 1.) / (1. + dq / ${G(LANTERN.reach * LANTERN.reach, 1)}); }`).join('\n    ')}
    // (the same law as the lamp's: on the blue itself a lantern's light is taken at its strength only, a little to the
    // green, so the lit swell under her counter never goes purple; the white takes the lantern's own gold)
    lightv += mix(vec3(dot(uLantCol, vec3(.333))) * vec3(.6, .98, 1.12), uLantCol, clamp(white + foam, 0., 1.)) * lant * ${G(LANTERN.k)};
    // the open stern's light down her wake (CASEMENT)
    float cz = p.y - ${G(SHIP.transomOut)}, cw = ${G((SHIP.casement.x1 - SHIP.casement.x0) / 2)} + ${G(CASEMENT.spread)} * max(cz, 0.);
    float cas = exp(-p.x * p.x / (cw * cw)) * smoothstep(-6., 4., cz) / (1. + cz * cz / ${G(CASEMENT.reach * CASEMENT.reach, 1)});
    // (in the road the casement's light IS the light: the white there is gold, never white hot; the water keeps its blue under a low gold.
    // The white is churned water: the gold lies on its lumps' tops and is low in the hollows between them, CASEMENT.hollow of it, by the churn's own grain)
    float road = clamp(cas * ${G(CASEMENT.k)}, 0., 1.);
    lightv = mix(lightv, mix(lightv * .8 + vec3(dot(uLantCol, vec3(.333))) * vec3(.5, .82, .9) * .3, uLantCol * vec3(1., .8, .46) * .95 * (${G(CASEMENT.hollow)} + ${G(1 - CASEMENT.hollow)} * smoothstep(.38, .62, bt)), clamp(white + foam, 0., 1.)), road);
    vec3 col = alb * lightv;
    // matt paint: the lamp lays one broad track of warm gold on it, the glass a faint green sheen at a grazing eye
    vec3 V = normalize(cameraPosition - vW), Nt = normalize(mix(N0, N, .3) + vec3(0., .7, 0.)), toB = normalize(uBlurC - vW);
    // THE LIGHTS LIE ON THE WATER AS BROKEN PATHS, never a smear: where the lamp would be mirrored to the eye (a broad
    // way toward it) every ripple that is turned right carries one small hard glint of gold; the window's way is the
    // same in pale blue; her stern lanterns lay a long broken way of gold down her wake (LANTERN.path metres)
    vec3 Ng = normalize(N + vec3(-rip.x, 0., -rip.y) * 1.5), Rg = reflect(-V, Ng);
    float way1 = pow(clamp(dot(reflect(-toB, Nt), V), 0., 1.), 10.), way2 = pow(clamp(dot(reflect(-toWin, Nt), V), 0., 1.), 9.), way3 = pow(clamp(dot(reflect(-toL, Nt), V), 0., 1.), 5.) / (1. + dl * dl / ${G(LANTERN.path * LANTERN.path, 1)});
    float sp1 = smoothstep(.9, .98, dot(Rg, toB)), sp3 = smoothstep(.84, .97, dot(Rg, toL));
    vec3 toC = normalize(vec3(${G(SHIP.sternWindow[0])}, ${G(SHIP.sternWindow[1])}, ${G(SHIP.transomOut)}) - vW);
    float way4 = pow(clamp(dot(reflect(-toC, Nt), V), 0., 1.), 4.) * cas, sp4 = smoothstep(.8, .96, dot(Rg, toC));
    // (each way is BROKEN at every distance: only the scattered small faces of the water that the grain picks carry a glint)
    // (the grain is one size in metres, GLINT, and drifts down the wind; the pixel's footprint lays it to rest far off)
    vec2 drift = uWind * uTime * .012;
    float spark = mix(smoothstep(${G(GLINT.cut[0])}, ${G(GLINT.cut[1])}, texture2D(uNoise, p * ${G(GLINT.grain)} + drift).g), ${G(GLINT.share)}, smoothstep(${G(GLINT.rest[0])}, ${G(GLINT.rest[1])}, px));
    float sparkF = mix(smoothstep(${G(GLINT.cut[0])}, ${G(GLINT.cut[1])}, texture2D(uNoise, p * ${G(GLINT.fine)} + drift * 4.).b), ${G(GLINT.share)}, smoothstep(${G(GLINT.rest[0] * GLINT.grain / GLINT.fine)}, ${G(GLINT.rest[1] * GLINT.grain / GLINT.fine)}, px));
    float still = (1. - .6 * foam) * (1. - .5 * white);
    // (where two ways cross, a glint is no brighter than the brightest of them: the ways never add up to a white sheet)
    col += max(max(uKeyCol * vec3(1., .8, .42) * (2.3 * way1 * sp1 * spark + .008 * way1) * ms, vec3(.62, .8, 1.) * .02 * way2), max(uLantCol * (2.6 * way3 * sp3 * sparkF + .02 * way3), uLantCol * 4. * way4 * sp4 * sparkF)) * still;
    col += uSheen * pow(1. - clamp(dot(N, V), 0., 1.), 3.) * .22;
    // (WLINE: the dark green line where the sea meets the glass)
    col *= (1. - .65 * vIn) * (1. - ${WLINE.deep.toFixed(2)} * (1. - smoothstep(0., ${F1(WLINE.dark)}, gap)));
    float dist = length(cameraPosition - vW), f = 1. - exp(-uFogDen * uFogDen * dist * dist);
    gl_FragColor = vec4(mix(col, uFogCol, clamp(f, 0., 1.)), 1.);
  }`;
// the sheet, 524 m wide, from behind the base wall's rim to the shoulder of the vault. Its mesh is SEA_MESH.fine metres
// square wherever the route runs low: the band is read off the route itself (every point of it that flies under
// SEA_MESH.low, and SEA_MESH.pad metres round it, along and across the bottle), so the small seas are real ridges
// under the lens there; outside it each step is SEA_MESH.grow times the last, up to SEA_MESH.coarse.
const SEA_MESH = { fine: 1.6, grow: 1.13, coarse: 16, low: 30, pad: 12, s: [Infinity, -Infinity], l: [Infinity, -Infinity] };
for (const p of routePoints()) if (p[1] < SEA_MESH.low) {
  const sa = sAlong(p[0], p[2]), la = (p[0] - MID.x) * -AXIS.z + (p[2] - MID.z) * AXIS.x;
  SEA_MESH.s = [Math.min(SEA_MESH.s[0], sa - SEA_MESH.pad), Math.max(SEA_MESH.s[1], sa + SEA_MESH.pad)]; SEA_MESH.l = [Math.min(SEA_MESH.l[0], la - SEA_MESH.pad), Math.max(SEA_MESH.l[1], la + SEA_MESH.pad)];
}
function seaSteps(lo, hi, a, b) {
  const out = []; let x = a, st = SEA_MESH.fine;
  while (x > lo) { out.unshift(x); st = x < a ? Math.min(SEA_MESH.coarse, st * SEA_MESH.grow) : st; x -= st; } out.unshift(lo);
  x = a + SEA_MESH.fine; st = SEA_MESH.fine;
  while (x < hi) { out.push(x); st = x >= b ? Math.min(SEA_MESH.coarse, st * SEA_MESH.grow) : st; x += st; } out.push(hi);
  return out;
}
async function seaGeometry(ctx) {
  const ss = seaSteps(S_RIM - 12, 690, SEA_MESH.s[0], SEA_MESH.s[1]), ls = seaSteps(-262, 262, SEA_MESH.l[0], SEA_MESH.l[1]), NS = ss.length - 1, NL = ls.length - 1;
  const side = new THREE.Vector3().crossVectors(AXIS, new THREE.Vector3(0, 1, 0)).normalize();
  const pos = new Float32Array((NS + 1) * (NL + 1) * 3), idx = new Uint32Array(NS * NL * 6);
  let o = 0;
  for (let i = 0; i <= NS; i++) {
    const s = ss[i];
    for (const l of ls) { pos[o] = MID.x + AXIS.x * s + side.x * l; pos[o + 2] = MID.z + AXIS.z * s + side.z * l; o += 3; }
    if (i % 8 === 7) await ctx.yield();
  }
  await ctx.yield();
  o = 0;
  for (let i = 0; i < NS; i++) for (let j = 0; j < NL; j++) { if (j === 0 && i % 8 === 7) await ctx.yield(); const q = i * (NL + 1) + j; idx[o] = q; idx[o + 1] = q + 1; idx[o + 2] = q + NL + 2; idx[o + 3] = q; idx[o + 4] = q + NL + 2; idx[o + 5] = q + NL + 1; o += 6; }
  await ctx.yield();
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(new THREE.BufferAttribute(idx, 1)); return g;
}

// ------------------------------------------------------------------ the media: flying white, spindrift, bow spray, rain
// MEDIA BY PLACE. THE FLOWN LINE IS A PLACE: LANE.n points laid along the route and its run-in behind the entry (uLane). No dab is drawn whose centre,
// with its own half length, lies within LANE.r metres of that line (the polyline's own stray from the route is added), and a dab's strength rises from nothing over the next
// LANE.soft metres: so none is born in, or carried through, the tube round the line, and none ends at a step. None is
// drawn within the hull's plan under her tops' height, so none is inside her or in the cabin. A dab's size is in metres;
// its strength reads neither the eye's distance, nor the projection, nor the buffer's height.
// THE ONE READING OF THE PICTURE, said here: a rain streak is RAIN_W metres wide and, by the guide's rule for thin lines,
// is drawn at least a pixel and a half wide, carrying then only its true share of that width. Haze is the place's own
// (the same law as on every body).
// LANE.stray: the stray at which LANE.n points fit the flown line as it stands (the fit in build() begins there)
const LANE = { n: 96, r: 2.5, stray: 0.2, soft: 1 }, RAIN_W = 0.05, RAIN_LEN = 3, FLECKS = 5200, BURST = { n: 300, size: [2.5, 6], life: [1.5, 2.7] };
// THE BOX the flying white and the rain stream through, fixed in the world: from wall to wall down the wind (BOX.len),
// along the bottle from BOX.s0 to BOX.s1 metres from her middle; both fade out over its last BOX.fade metres at each
// end along the bottle (and over 40 m at each end down the wind)
const BOX = { s0: -400, s1: 160, len: 520, top: 120, fade: 30 };
const MEDIUM_GLSL = /* glsl */`
  uniform float uPxH, uCutOwn; uniform vec3 uKeyDir; uniform vec3 uLane[${LANE.n}];
  varying float vAlpha, vLit, vId; varying vec2 vUv; varying float vDist;
  float clearOfShip(vec3 c){
    float top = c.z > -14. ? 31. : (c.z > -116. ? 19. : 25.);
    float beside = abs(c.x) - halfBeam(clamp(c.z, -154., 26.)) - 1.5, beyond = max(c.z - 27.5, -155.5 - c.z);
    return smoothstep(0., 4., max(max(beside, c.y - top), beyond));
  }
  // metres from a place to the flown line
  float laneDist(vec3 c){
    float d2 = 1e9;
    for (int i = 0; i < ${LANE.n - 1}; i++) {
      vec3 a = uLane[i], ab = uLane[i + 1] - a, ac = c - a; vec3 q = ac - ab * clamp(dot(ac, ab) / max(dot(ab, ab), 1e-4), 0., 1.);
      d2 = min(d2, dot(q, q));
    }
    return sqrt(d2);
  }
  // lay one dab: c its centre, e1 and e2 its own two edges in metres, reach its greatest half length; returns the clip
  // position. A dab is put out where its centre, with its reach, stands in the tube round the flown line (LANE.r metres
  // and the lane's stray), and is whole LANE.soft metres further out. A long streak (uCutOwn: the rain) is CUT where it
  // enters the tube instead: each of its corners is put out by its own place.
  vec4 dab(vec3 c, vec3 e1, vec3 e2, float reach, float fade){
    vec3 w = c + e1 * position.x + e2 * position.y; float rr = ${(LANE.r + 2 * LANE.stray).toFixed(2)} + reach * (1. - uCutOwn);
    float k = smoothstep(rr, rr + ${LANE.soft.toFixed(1)}, laneDist(mix(c, w, uCutOwn))) * clearOfShip(c);
    vAlpha = fade * k; vDist = length(cameraPosition - c); vUv = position.xy;
    vLit = .5 + .5 * abs(dot(normalize(cross(e1, e2) + 1e-5), uKeyDir));
    return projectionMatrix * viewMatrix * vec4(mix(c, w, max(step(.004, vAlpha), uCutOwn)), 1.);
  }`;
const FLECK_VERT = /* glsl */`
  ${SEA_GLSL}
  ${MEDIUM_GLSL}
  attribute vec4 aA, aB; uniform vec4 uBox;
  void main(){
    // aA: place along the wind, across it, height, speed (25 to 35 m/s); aB: size (m), tumble rate, phase. The box is fixed
    // in the world and spans the bottle from wall to wall down the wind; a fleck that leaves its lee end comes in again at
    // its weather end, faded at both. No fleck flies lower than 1.5 m over the sea under it.
    float a = mod(aA.x + aA.w * uTime, uBox.z) - uBox.z * .5;
    vec2 xz = uBox.xy + uWind * a + vec2(-uWind.y, uWind.x) * aA.y;
    float y = aA.z + 1.6 * sin(uTime * (.6 + .2 * aB.y) + aB.z) - .012 * (a + uBox.z * .5);
    vec3 c = vec3(xz.x, max(y, swell(xz).x + 1.5), xz.y);
    float th = uTime * aB.y + aB.z;
    vec3 wd = vec3(uWind.x, 0., uWind.y), cx = vec3(-uWind.y, 0., uWind.x), up = vec3(0., 1., 0.);
    vec3 e1 = cx * cos(th) + up * sin(th), e2 = normalize(wd * 1.3 + .5 * (cx * sin(th * .7) - up * cos(th * .7)));
    gl_Position = dab(c, e1 * .7 * aB.x, normalize(cross(e1, e2) + 1e-5) * .7 * aB.x, .5 * aB.x, smoothstep(0., 40., uBox.z * .5 - abs(a)) * smoothstep(0., ${BOX.fade.toFixed(1)}, ${((BOX.s1 - BOX.s0) / 2).toFixed(1)} - abs(aA.y)));
  }`;
// SPINDRIFT: the white torn off the tops of the following sea. Each dab leaves a crest where that crest stood at its
// own moment of the world clock, is carried on with the crest and down the wind, lifts off the sea and thins out.
const DRIFT_VERT = /* glsl */`
  ${SEA_GLSL}
  ${MEDIUM_GLSL}
  attribute vec4 aA, aB;
  void main(){
    // aA: metres across the bottle, life (s), its share of that life at the clock's zero, which crest (0 or 1);
    // aB: size (m), rise (m), pace down the wind (m/s), tumble phase
    float life = aA.y, age = fract(uTime / life + aA.z) * life, tb = uTime - age, len = ${FOLLOW.len.toFixed(1)}, s0 = ${(FOLLOW.full - FOLLOW.len).toFixed(1)};
    float sc = (1.5708 - uPhase.w + ${(6.2832 / FOLLOW.per).toFixed(6)} * tb) / ${(6.2832 / FOLLOW.len).toFixed(6)} + aA.w * len;
    float sb = s0 + mod(sc - s0, 2. * len), s = sb + ${(0.9 * FOLLOW.len / FOLLOW.per).toFixed(3)} * age;
    vec2 ax = vec2(${AXIS.x.toFixed(5)}, ${AXIS.z.toFixed(5)});
    vec2 xz = vec2(${MID.x.toFixed(1)}, ${MID.z.toFixed(1)}) + ax * s + vec2(-ax.y, ax.x) * aA.x + uWind * aB.z * age;
    float env = 1. - smoothstep(${FOLLOW.full.toFixed(1)}, ${FOLLOW.from.toFixed(1)}, sb), k = age / life;
    vec3 c = vec3(xz.x, swell(xz).x + .4 + aB.y * pow(clamp(k, 0., 1.), .7), xz.y);
    float th = uTime * 2.3 + aB.w;
    vec3 e1 = normalize(vec3(cos(th), sin(th), .3)), e2 = normalize(cross(e1, vec3(.3, .2, 1.)));
    float size = aB.x * (.6 + 1.2 * k);
    gl_Position = dab(c, e1 * size, e2 * size, .75 * size, smoothstep(0., .12, k) * (1. - smoothstep(.45, 1., k)) * smoothstep(.2, .6, env) * .8);
  }`;
const SPRAY_VERT = /* glsl */`
  ${SEA_GLSL}
  ${MEDIUM_GLSL}
  attribute vec4 aA, aB;
  void main(){
    // the bow comes down once in every 9 s of the ship's own pitch law: cyc is 0 as she passes level going down.
    // aA: the dab's throw (m/s: outward from her side, up, along her keel) and its delay (a share of the cycle);
    // aB: size (m), its place along the bow from the stem aft (m), phase (its sign: the weather or the lee bow), life (s)
    float cyc = fract(uTime / ${MOTION.pitchPer.toFixed(1)} + (uMotion.y - 3.14159) / 6.28318);
    float t = (cyc - aA.w) * ${MOTION.pitchPer.toFixed(1)}, life = aB.w, sd = aB.z < 0. ? 1. : -1.;
    // it starts where the sea meets her bow, 1 to 4 m outside her side, is thrown outward and up, and is carried down the wind
    float zo = -153. + aB.y;
    vec3 o = vec3(sd * (halfBeam(zo) + 1. + 3. * fract(abs(aB.z) * 3.7)), 1.5, zo);
    vec3 c = o + vec3(sd * aA.x, aA.y, aA.z) * max(t, 0.) + .5 * vec3(uWind.x * 13., -12., uWind.y * 13.) * t * t;
    float fade = step(0., t) * smoothstep(0., .2, t) * (1. - smoothstep(life * .55, life, t));
    // each dab is round (never drawn out) and tumbles about the line of its own flight
    // (a dab breaks up as it flies: from a quarter of its life on it is drawn finer, down to 0.45 of its size)
    float th = uTime * 5. + aB.z * 6.28, size = aB.x * (1. + .2 * max(t, 0.)) * (1. - .55 * smoothstep(.25, .8, clamp(t / max(life, .1), 0., 1.)));
    vec3 vel = vec3(sd * aA.x, aA.y, aA.z) + vec3(uWind.x * 13., -12., uWind.y * 13.) * max(t, 0.);
    vec3 e1 = normalize(vel + 1e-4), e2 = normalize(cross(e1, vec3(cos(th), sin(th), .3)) + 1e-5);
    vId = aB.z;
    gl_Position = dab(c, e1 * size, e2 * size, .75 * size, fade);
  }`;
const RAIN_VERT = /* glsl */`
  ${SEA_GLSL}
  ${MEDIUM_GLSL}
  attribute vec4 aA; uniform vec4 uBox;
  void main(){
    // slanting threads down the wind through the whole box, RAIN_LEN metres long; aA: along the wind, across it, height, speed share
    float a = mod(aA.x + 17. * aA.w * uTime, uBox.z) - uBox.z * .5, y = uBox.w - mod(aA.z + 30. * aA.w * uTime, uBox.w);
    vec2 xz = uBox.xy + uWind * a + vec2(-uWind.y, uWind.x) * aA.y;
    vec3 c = vec3(xz.x, y, xz.y), fall = normalize(vec3(uWind.x * 17., -30., uWind.y * 17.));
    vec3 side = normalize(cross(fall, cameraPosition - c) + 1e-5);
    // the thin-line rule (the one reading of the picture): never drawn narrower than a pixel and a half
    float dist = length(cameraPosition - c), px = 2. / (projectionMatrix[1][1] * max(uPxH, 1.));
    float w = max(${RAIN_W.toFixed(2)}, 1.5 * px * dist);
    gl_Position = dab(c, side * w, fall * ${F1(RAIN_LEN)}, ${F1(RAIN_LEN / 2)}, smoothstep(0., 40., uBox.z * .5 - abs(a)) * smoothstep(0., ${BOX.fade.toFixed(1)}, ${((BOX.s1 - BOX.s0) / 2).toFixed(1)} - abs(aA.y)) * smoothstep(0., 12., min(y, uBox.w - y)) * .6 * (${RAIN_W.toFixed(2)} / w));
  }`;
const MEDIUM_FRAG = /* glsl */`
  precision highp float;
  uniform vec3 uWhite, uWhiteShade, uKeyCol, uSky, uSeaSky, uFogCol; uniform float uFogDen, uSoft, uLace; uniform sampler2D uNoise;
  varying float vAlpha, vLit, vId; varying vec2 vUv; varying float vDist;
  void main(){
    float r = length(vUv) * 2.;
    float a = vAlpha * mix(1. - smoothstep(.55, 1., r), 1. - smoothstep(.0, 1., abs(vUv.x) * 2.), uSoft);
    if (uLace > .5) {
      // A TORN SHEET OF LACE (the bow's spray): the same web as the breaking crests (threads round holes: two
      // isolines of the slow noise), each sheet a piece of its own (vId), ragged at its rim by the same noise. Where
      // the sheet is under forty pixels across the web gives way to its own mean cover (no shimmer far off).
      vec2 q = vUv * .3 + vec2(fract(vId * 7.3), fract(vId * 3.1));
      float la = texture2D(uNoise, q).r, lb = texture2D(uNoise, q * 2.3 + .5).b, lc = texture2D(uNoise, q * .6 + .2).g;
      float web = max(1. - smoothstep(.012, .05, abs(la - .5)), .8 * (1. - smoothstep(.015, .055, abs(lb - .52))));
      float rim = 1. - smoothstep(.4, 1., r + 1.2 * (lc - .5));
      a = vAlpha * rim * mix(web, .32, smoothstep(.02, .05, fwidth(vUv.x) + fwidth(vUv.y)));
    }
    if (a < .01) discard;
    // (the burst's lace is the sea's own white thrown up: it is lit as the crests are, by the sea's sky and the key)
    vec3 col = mix(uWhiteShade, uWhite, vLit) * (mix(uSky * 1.6, uSeaSky * 1.25, uLace) + uKeyCol * vLit * .9);
    float f = 1. - exp(-uFogDen * uFogDen * vDist * vDist);
    gl_FragColor = vec4(mix(col, uFogCol, clamp(f, 0., 1.)), a);
  }`;
// rows: the dab's own rows of corners along its length (a streak that is cut where it enters the tube has several)
// (a hand-back every 400 dabs dealt: no step of the build is long)
async function mediumMesh(ctx, count, fill, vert, uniforms, soft, rows = 1, lace = 0) {
  const g = new THREE.InstancedBufferGeometry(), q = new THREE.PlaneGeometry(1, 1, 1, rows);
  g.index = q.index; g.setAttribute('position', q.attributes.position);
  const A = new Float32Array(count * 4), B = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) { fill(A, B, i * 4); if (i % 400 === 399) await ctx.yield(); }
  g.setAttribute('aA', new THREE.InstancedBufferAttribute(A, 4)); g.setAttribute('aB', new THREE.InstancedBufferAttribute(B, 4));
  g.instanceCount = count;
  const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: { ...uniforms, uSoft: { value: soft }, uLace: { value: lace }, uCutOwn: { value: rows > 1 ? 1 : 0 } }, vertexShader: vert, fragmentShader: MEDIUM_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
  m.frustumCulled = false; m.renderOrder = 4; return m;
}

export default {
  id: 'gale-in-green-glass',
  name: 'Gale in Green Glass',
  category: 'ocean',
  media: ['air'],
  weirdness: 0.5,
  async build(ctx) {
    const vary = ctx.vary || {}, detail = (ctx.quality && ctx.quality.detail) || 1;
    const hour = vary.hour || 'any', mood = vary.mood ?? 0.5, density = vary.density ?? 1, rare = !!vary.rare;
    // every stream of this world, taken once, each from the world's seed and a name
    const fork = (name) => ctx.core.makeRng(ctx.core.hashSeed('gale:' + name + ':' + ctx.seed));
    const rWeather = fork('weather'), rFleck = fork('flecks'), rSpray = fork('spray'), rLace = fork('lace'), rRain = fork('rain'), rSea = fork('sea'), rLamp = fork('lamp'), rDrift = fork('spindrift'), rRoom = fork('room'), rMoth = fork('moth'), rRun = fork('runup'), rHearth = fork('hearth');
    const rain = rWeather.chance(0.4), gutterAt = rWeather.range(0, 38), seaState = 0.8 + 0.2 * mood;
    // the lamp never sinks below 0.7 of its light: its beat's low (0.85) times the gutter's low (1 - GUTTER.lamp) is 0.71
    const GUTTER = { lamp: 0.16, key: 0.86 };
    // the clock's phases, dealt: the three swells and the following sea; the lamp's two beats and its two trembles
    const seaPhases = [0, 1, 2, 3].map(() => rSea.range(0, 6.2832)), lampBeats = [0, 1, 2, 3].map(() => rLamp.range(0, 6.2832));
    // the room's own clocks (a new stream): the bob of the tall clock, the fire's two wanderings, the flame's shiver
    const roomPh = [0, 1, 2, 3].map(() => rRoom.range(0, 6.2832));
    // the mantel's two candles: where each flame is in its shiver at the clock's nought (dealt from a stream of their own)
    const hearthPh = [0, 1].map(() => rHearth.range(0, 6.2832));
    // the moth's own clock: where it is on its walk, its wings' beat, its shivers (dealt from its own stream)
    const mothPh = [0, 1, 2, 3].map(() => rMoth.range(0, 6.2832));
    // the surge up the glass: where along the wall it stands at the clock's nought (dealt from its own stream)
    const runPh = rRun.range(0, 6.2832);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(HAZE.col);
    scene.fog = new THREE.FogExp2(HAZE.col, FOG_DEN);
    // the two real lights serve only what the engine may hang in this scene; every surface of ours is its own shader
    const keyDir = KEY_DIR.clone();
    const hemi = new THREE.HemisphereLight('#6FB592', '#2C5F56', 1.0); scene.add(hemi);
    const key = new THREE.DirectionalLight('#FFD9A0', 2.6); key.position.copy(keyDir).multiplyScalar(400); scene.add(key);

    await ctx.yield();
    const routePts = routePoints();
    await ctx.yield();
    const path = makePath(routePts), L = path.length;
    await ctx.yield();
    // the flight on that route: its places, the one look on her, the pace (flightPlan, at the head of this file)
    const plan = flightPlan(path);

    await ctx.yield();
    const hero = await buildHero(ctx, { palette: PALETTE, rain: rain ? 1 : 0 });
    scene.add(hero.object);
    await ctx.yield();
    // ---- the light outside the glass, by the hour; its bearing off the port bow is the same on every seed
    const LIGHTS = {
      warm: { col: '#FFD9A0', heart: [2.0, 1.75, 1.4], flame: 1, day: 0, key: '#FFD9A0' },
      grey: { col: '#DCE8D8', heart: [1.7, 1.8, 1.7], flame: 1.1, day: 1, key: '#DCE8D8' },
      fire: { col: '#E0552A', heart: [1.2, 0.29, 0.09], flame: 0.55, day: 0, key: '#FFD9A0' },
    };
    const lightKind = hour === 'day' || hour === 'dawn' ? 'grey' : hour === 'night' ? 'fire' : 'warm', LK = LIGHTS[lightKind];
    // THE LAMP IS A BODY OF THE ROOM AND STANDS IN ONE PLACE ON EVERY HOUR (LAMP_AT: on the table beside the bottle's
    // base end, on her weather beam, 33 degrees up from her middle). The hour changes the flame only: its colour and its
    // height (warm: the lamp as it burns; the grey hours: turned up and white; the night hour: turned low and red)
    const side = new THREE.Vector3().crossVectors(AXIS, new THREE.Vector3(0, 1, 0)).normalize();
    const blurDir = keyDir.clone();
    const lampAt = LAMP_AT.clone(), phiL = Math.atan2(blurDir.dot(side), blurDir.y);
    const lampR = new THREE.Vector3(lampAt.clone().sub(MID).dot(AXIS), lampAt.y, lampAt.clone().sub(MID).dot(side));
    const hueShift = (mood - 0.5) * 12 / 360;
    const tint = (hex) => { const c = new THREE.Color(hex), h = {}; c.getHSL(h); return c.setHSL(h.h + hueShift, h.s, h.l); };
    const fogCol = new THREE.Color(HAZE.col), keyCol = new THREE.Color(LK.key);
    const noiseTex = hero.uniforms.uNoise.value, keyNow = keyCol.clone().multiplyScalar(0.95);
    // THE SEA'S PAINT: deep blue (ultramarine going to indigo and blue black in the troughs, a greener blue on the lit
    // shoulders of the swells), chalk white dragged over the ridges
    const SEA_PAINT = { deep: '#1C3F80', indigo: '#0D1A3C', black: '#040D14', lit: '#2B7396', chalk: '#EEEBE0', chalkShade: '#8E9FBE' };
    const VU = {
      uMid: { value: MID }, uAxis: { value: AXIS }, uSide: { value: side }, uLamp: { value: lampAt.clone() }, uLampCol: { value: new THREE.Color(LK.col) }, uLampHeart: { value: new THREE.Vector3().fromArray(LK.heart) },
      uLampR: { value: lampR }, uFlame: { value: new THREE.Vector4(0, 0, LK.flame, 0) }, uRoomPh: { value: new THREE.Vector4().fromArray(roomPh) }, uHearthPh: { value: new THREE.Vector2().fromArray(hearthPh) }, uGlassLit: { value: tint(PALETTE[0]) }, uGlassDeep: { value: tint(PALETTE[1]) }, uFogCol: { value: fogCol }, uSeaCol: { value: new THREE.Color(SEA_PAINT.deep) },
      uMoth: { value: new THREE.Vector4(MOTH_AT.s, 0.5, 0, 0) },
      uTime: { value: 0 }, uRunPh: { value: runPh }, uLampK: { value: 1 }, uPhiL: { value: phiL }, uSeedK: { value: 0.4 + 0.35 * mood }, uFogDen: { value: FOG_DEN }, uDay: { value: LK.day }, uNoise: { value: noiseTex },
      uState: { value: seaState }, uPhase: { value: new THREE.Vector4().fromArray(seaPhases) }, uScatter: { value: new THREE.Vector4(rSea(), rSea(), rSea(), rSea()) }, uWind: { value: new THREE.Vector2(WIND.x, WIND.z) }, uMotion: { value: new THREE.Vector2(hero.motion[0], hero.motion[1]) }, uMot: { value: new THREE.Vector2() },
    };
    await ctx.yield();
    const vaultGeo = await vaultGeometry(ctx);
    await ctx.yield();
    const vault = new THREE.Mesh(vaultGeo, new THREE.ShaderMaterial({ uniforms: VU, vertexShader: VAULT_VERT, fragmentShader: 'precision highp float;\n#define WLINE_PIECE_AT (' + WLINE_PIECE('vW.xz') + ')\n' + SEA_GLSL + VAULT_HEAD + ROOM_GLSL_A + ROOM_GLSL_B + ROOM_GLSL_C + ROOM_GLSL_D + VAULT_FRAG, side: THREE.DoubleSide }));
    vault.frustumCulled = false; scene.add(vault);
    await ctx.yield();
    const lin = (hex, k = 1) => new THREE.Color(hex).multiplyScalar(k);
    // the moth's frame on the vault: outward at its place (MOTH_AT.up degrees round from the top toward the lamp's side) and the way round the wall there
    const mothA = MOTH_AT.up * Math.PI / 180, mothN = new THREE.Vector3(0, Math.cos(mothA), 0).addScaledVector(side, -Math.sin(mothA)), mothT = new THREE.Vector3(0, Math.sin(mothA), 0).addScaledVector(side, Math.cos(mothA));
    const SU = {
      uVMid: { value: MID }, uVAxis: { value: AXIS }, uMothN: { value: mothN }, uMothT: { value: mothT }, uLampAt: { value: lampAt }, uMoth: VU.uMoth,
      uTime: VU.uTime, uRunPh: VU.uRunPh, uState: VU.uState, uPhase: VU.uPhase, uScatter: VU.uScatter, uWind: VU.uWind, uMotion: VU.uMotion, uMot: VU.uMot, uKeyDir: { value: keyDir }, uKeyCol: { value: keyNow },
      uSeaSky: { value: new THREE.Color(0.5, 0.66, 0.74).multiplyScalar(0.88) }, uSeaGround: { value: new THREE.Color(0.22, 0.34, 0.5).multiplyScalar(0.5) }, uFogCol: { value: fogCol },
      uDeep: { value: lin(SEA_PAINT.deep, 1.5) }, uIndigo: { value: lin(SEA_PAINT.indigo, 1.4) }, uBlack: { value: lin(SEA_PAINT.black, 1.5) }, uLitBlue: { value: lin(SEA_PAINT.lit, 1.25) },
      uWhite: { value: lin(SEA_PAINT.chalk) }, uWhiteShade: { value: lin(SEA_PAINT.chalkShade) }, uSheen: { value: tint(PALETTE[0]) },
      uBlurC: VU.uLamp, uFogDen: { value: FOG_DEN }, uCaus: { value: 0.35 }, uLant: { value: new THREE.Vector3(...SHIP.lantern) }, uLantCol: { value: lin(PALETTE[7]) }, uNet: { value: new THREE.Vector2() }, uNoise: { value: noiseTex },
    };
    const seaGeo = await seaGeometry(ctx);
    await ctx.yield();
    const sea = new THREE.Mesh(seaGeo, new THREE.ShaderMaterial({ uniforms: SU, vertexShader: SEA_VERT, fragmentShader: SEA_FRAG }));
    sea.frustumCulled = false; scene.add(sea);
    await ctx.yield();
    // ---- THE LANE: the flown line as LANE.n points: a new point wherever the route, at any quarter of the span, would
    // stray more than LANE.stray metres from the chord (the stray is opened 0.05 m at a time until the points fit). The
    // tube's radius carries twice that stray, so the tube round the TRUE line is LANE.r metres and more.
    let lane = [];
    for (let stray = LANE.stray; ; stray += 0.05) {
      const p = new THREE.Vector3(), q = new THREE.Vector3(), c = new THREE.Vector3(), ab = new THREE.Vector3(); let m0 = 0;
      // metres from the route's point at a share k of the span m0..m to the chord p..q
      const off = (m, k) => { path.posAtDist(m0 + (m - m0) * k, c).sub(p); ab.subVectors(q, p); return c.addScaledVector(ab, -c.dot(ab) / Math.max(ab.lengthSq(), 1e-6)).length(); };
      // its first point is ENTRY.level metres BEHIND the entry point on the entry axis: the run-in the through view looks down
      lane = [path.posAtDist(0, p).clone().addScaledVector(AXIS, -ENTRY.level), path.posAtDist(0, p).clone()];
      for (let m = 2; m < L; m += 1) {
        path.posAtDist(m0, p); path.posAtDist(m, q);
        if (m % 20 === 0) await ctx.yield();
        if (Math.max(off(m, 0.25), off(m, 0.5), off(m, 0.75)) > stray || m - m0 >= 80) { m0 = m - 1; lane.push(path.posAtDist(m0, p).clone()); }
      }
      lane.push(path.posAtDist(L, p).clone());
      if (lane.length <= LANE.n || stray > 0.6) break;
      await ctx.yield();
    }
    while (lane.length < LANE.n) lane.push(lane[lane.length - 1].clone());
    await ctx.yield();
    // ---- flying white: flecks of white torn off the crests, streaming down the wind through a box fixed in the world:
    // from wall to wall down the wind (BOX.len), and along the bottle from BOX.s0 to BOX.s1 metres from her middle, so the
    // same white streams past under the level entry stretch as round her
    const boxMid = (BOX.s0 + BOX.s1) / 2, boxHalf = (BOX.s1 - BOX.s0) / 2;
    const uPxH = { value: 450 }, _size = new THREE.Vector2();
    const MU = { ...SU, uSky: { value: tint('#6FB592').multiplyScalar(0.4) }, uPxH, uLane: { value: lane }, uBox: { value: new THREE.Vector4(MID.x + AXIS.x * boxMid, MID.z + AXIS.z * boxMid, BOX.len, BOX.top) } };
    const nFleck = Math.round(FLECKS * density * detail);
    const flecks = await mediumMesh(ctx, nFleck, (A, B, o) => {
      A[o] = rFleck.range(0, BOX.len); A[o + 1] = rFleck.range(-boxHalf, boxHalf); A[o + 2] = 3 + 78 * Math.pow(rFleck(), 1.8); A[o + 3] = rFleck.range(25, 35);
      B[o] = rFleck.range(0.15, 0.5); B[o + 1] = rFleck.range(2.5, 7) * (rFleck.chance(0.5) ? 1 : -1); B[o + 2] = rFleck.range(0, 6.28);
    }, FLECK_VERT, MU, 0);
    flecks.name = 'flying white'; scene.add(flecks);
    await ctx.yield();
    // ---- spindrift off the crests of the following sea (a stream of its own)
    const drift = await mediumMesh(ctx, Math.round(2600 * detail), (A, B, o) => {
      A[o] = rDrift.range(-235, 235); A[o + 1] = rDrift.range(2.2, 4.5); A[o + 2] = rDrift(); A[o + 3] = rDrift.chance(0.5) ? 1 : 0;
      B[o] = rDrift.range(0.5, 1.4); B[o + 1] = rDrift.range(3, 10); B[o + 2] = rDrift.range(10, 22); B[o + 3] = rDrift.range(0, 6.28);
    }, DRIFT_VERT, MU, 0);
    drift.name = 'spindrift'; scene.add(drift);
    await ctx.yield();
    // ---- the spray at her bows: a fan thrown up and outward on every plunge from each bow (six dabs in ten from the
    // weather bow), blown to lee
    const spray = await mediumMesh(ctx, Math.round(3600 * detail), (A, B, o) => {
      A[o] = rSpray.range(1, 9); A[o + 1] = 9 + 21 * Math.sqrt(rSpray()); A[o + 2] = rSpray.range(-8, 5); A[o + 3] = rSpray.range(0.05, 0.3);
      B[o] = 0.14 + 0.7 * Math.pow(rSpray(), 3); B[o + 1] = rSpray.range(0, 26); B[o + 2] = (rSpray.chance(0.6) ? 1 : -1) * rSpray.range(0.02, 1); B[o + 3] = rSpray.range(2.4, 4.2);
    }, SPRAY_VERT, MU, 0);
    spray.name = 'bow spray'; scene.add(spray);
    await ctx.yield();
    // ---- and THE BURST ITSELF, AS LACE: on the same plunge and by the same law (SPRAY_VERT) each bow throws up
    // BURST.n torn sheets of lace, BURST.size metres across (seven in ten from the weather bow), which the wind carries
    // across her fo'c'sle and away to lee, breaking up as they go. Kept out of the tube round the flown line and out
    // of her hull by place, like every dab. Dealt from a stream of its own.
    const lace = await mediumMesh(ctx, Math.round(BURST.n * detail), (A, B, o) => {
      A[o] = rLace.range(1, 7); A[o + 1] = 12 + 16 * Math.sqrt(rLace()); A[o + 2] = rLace.range(-6, 4); A[o + 3] = rLace.range(0.04, 0.22);
      B[o] = rLace.range(BURST.size[0], BURST.size[1]); B[o + 1] = rLace.range(0, 22); B[o + 2] = (rLace.chance(0.7) ? 1 : -1) * rLace.range(0.02, 1); B[o + 3] = rLace.range(BURST.life[0], BURST.life[1]);
    }, SPRAY_VERT, MU, 0, 1, 1);
    lace.name = 'bow lace'; scene.add(lace);
    await ctx.yield();
    // ---- rain, on the seeds that have it: slanting streaks down the wind (built on every seed, drawn only where it rains)
    const rainMesh = await mediumMesh(ctx, Math.round(6700 * detail), (A, B, o) => {
      A[o] = rRain.range(0, BOX.len); A[o + 1] = rRain.range(-boxHalf, boxHalf); A[o + 2] = rRain.range(0, BOX.top); A[o + 3] = rRain.range(0.8, 1.2);
    }, RAIN_VERT, MU, 1, 4);
    rainMesh.name = 'rain'; rainMesh.visible = rain; scene.add(rainMesh);
    await ctx.yield();

    hero.setLight({ moth: { mid: MID, axis: AXIS, n: mothN, t: mothT, lamp: lampAt }, keyDir, sky: tint('#6FB592').multiplyScalar(0.5), ground: tint('#3F7F72').multiplyScalar(0.45), fogCol, fogDen: FOG_DEN });
    return {
      scene, path, duration: plan.duration, pace: plan.pace,
      ride: 'none', companion: 'none',
      // the lens: 68 degrees upright; the wide pictures are made by the line's own distance from her, not by the lens
      // the lean into a bend: at the engine's steepest (0.28) the camera leans as far as she herself rolls at her most
      // (MOTION.heel + MOTION.roll) and no further, so the room's shelves and the sea's edge stay near level in every bend
      camera: { fov: 68, near: 0.3, far: 2400, lookAhead: 20, sway: 1, bank: Math.tan((MOTION.heel + MOTION.roll) * DEG) / 0.28 },
      pois: plan.pois,
      // THE JOIN (exit of this world, as the series' join sheet has it): the canvas is the opening
      portal: { shape: 'rect', width: 2 * SHIP.opening.hx, height: 2 * SHIP.opening.hy, frame: 0, veil: '#D9C88C', revealDistance: 400, blendDistance: 25 },
      post: { exposure: 1.72, bloom: { strength: 0.4, radius: 0.6, threshold: 0.95 }, grade: { saturation: 1.05, contrast: 1.03, vignette: 0.3, grain: 0.02 } },
      update(dt, time, camera, u) {
        hero.update(dt, time, camera);
        VU.uTime.value = time;
        // her roll and pitch at this clock, for the sea she carries
        { const mo = motionAt(time, hero.motion); SU.uMot.value.set(mo.roll, mo.pitch); }
        // the lamp outside wavers on two slow beats (5.3 and 13 s, their phases dealt) and trembles a degree and a half; the
        // whole green light breathes
        const beat = 0.925 + 0.045 * Math.sin(time * 6.2832 / 5.3 + lampBeats[0]) + 0.03 * Math.sin(time * 6.2832 / 13 + lampBeats[1]);
        // the rare visit: the lamp gutters every 38 s of the world clock (sinks over 1.2 s, holds 0.8 s, comes back over
        // 2.5 s). GUTTER.lamp of its light in the room and of the glints goes; the key on canvas, hull and sea keeps
        // GUTTER.key of itself at the worst
        const g = rare ? smoothstep(0, 1.2, (time + gutterAt) % 38) * (1 - smoothstep(2, 4.5, (time + gutterAt) % 38)) : 0;
        VU.uLampK.value = beat * (1 - GUTTER.lamp * g);
        // the flame trembles a degree and a half as seen from her
        const lampX = 5 * Math.sin(time * 0.9 + lampBeats[2]), lampY = 4 * Math.sin(time * 1.37 + lampBeats[3]);
        VU.uLamp.value.copy(lampAt).addScaledVector(side, lampX * 4).setY(lampAt.y + lampY * 4);
        // the flame leans on two slow beats, and now and then shivers and recovers (a burst a few times a minute)
        const shiver = Math.pow(Math.max(0, Math.sin(time * 0.37 + roomPh[3])), 8);
        VU.uFlame.value.x = 0.55 * Math.sin(time * 0.83 + lampBeats[2]) + 0.25 * Math.sin(time * 2.1 + lampBeats[3]) + 0.5 * shiver * Math.sin(time * 6.1 + roomPh[3]);
        VU.uFlame.value.y = 0.25 + 1.6 * shiver;
        // THE MOTH, on the world clock: it walks MOTH.walk metres up the bottle, rests, walks back, rests (a quarter of
        // MOTH.cycle seconds each); its wings stir a little every MOTH.flap seconds (MOTH.stir) and now and then shiver
        { const p = (time / MOTH.cycle + mothPh[0] / 6.2832) % 1, walk = smoothstep(0, 0.25, p) - smoothstep(0.5, 0.75, p);
          const quiver = Math.pow(Math.max(0, Math.sin(time * 6.2832 / 17 + mothPh[2])), 10);
          VU.uMoth.value.set(MOTH_AT.s + MOTH.walk * (2 * walk - 1), 0.5 + 0.5 * Math.sin(time * 6.2832 / MOTH.flap + mothPh[1]), 0.07 * quiver * Math.sin(time * 38 + mothPh[3]), 0);
          hero.uniforms.uMoth.value.copy(VU.uMoth.value); }
        // the light the glass throws on sea and sails shifts with the lamp's own tremble
        SU.uNet.value.set(lampX * 0.6, lampY * 0.6); hero.uniforms.uNet.value.copy(SU.uNet.value);
        keyNow.copy(keyCol).multiplyScalar(0.95 * beat * (1 - (1 - GUTTER.key) * g)); hero.setLight({ keyCol: keyNow });
        ctx.renderer.getDrawingBufferSize(_size); uPxH.value = _size.y;
      },
      dispose() { hero.dispose(); },
    };
  },
};
