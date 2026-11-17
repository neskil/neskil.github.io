// The Ball Inside the Small Flat: the hero set piece and the makers the world shares.
//
// THE STAIR that cannot fit in the flat (flights of 24 steps and landings, a carpet, candle posts, chandeliers, the
// fireplace at its foot, the river of guests climbing) and THE BALLROOM at the head of its great landing (columns of
// a sparkling yellow stone, a polished floor with the hall mirrored in it, walls of flowers, three pools of coloured
// wine lit below, fountains). Also here: the plan of a visit and its film (pure arithmetic, so that a replay can fly
// any seed without a picture), the light every hall is shaded by, and the makers of guests and dancers, parrots,
// butterflies and flames; the winter garden, the chambers and the sitting room at the far end, and the city of roofs.
//
// Two frames. F1: the hallway and the stair; x across, z = 0 at the hallway's door, the stair runs down toward -z,
// the hallway's floor is height 0. F2: the forest and the ballroom, through the tall doorway of the great landing;
// x across, the halls run toward -z (d = -z is the distance in from the doorway), the landing's floor is height 0.
// A visit's hand (which side the landing opens to) mirrors the whole place in x.
import * as THREE from 'three';
import { makeRng, hashSeed, makePath, clamp, lerp, smoothstep } from '../kit/core.js';

export const DURATION = 50;
// the stair, in metres of F1 (zr = -z, the distance down the hall measured level out of the hallway's door)
export const ST = { HALL: 44, HEAD: 24, RUN: 24, RISE: 0.42, LAND: 10, GREAT: 52, NF: 14, HALF: 20, WALL: 46, TURN_R: 48, FLY: 7.5 };
ST.DROP = ST.RUN * ST.RISE;
ST.MOD = ST.RUN + ST.LAND;
ST.G0 = ST.HEAD + 3 * ST.RUN + 2 * ST.LAND;
ST.G1 = ST.G0 + ST.GREAT;
ST.DOOR = (ST.G0 + ST.G1) / 2;
ST.GY = -3 * ST.DROP;
ST.FOOT = ST.G1 + (ST.NF - 3) * ST.MOD - ST.LAND;
ST.FOOTY = -ST.NF * ST.DROP;
// the room at the end: a sitting room at six and a half times life, so that its door holds the portal
export const ROOM = { HALF: 17, H: 20, LEN: 62, DOORW: 7.8, DOORH: 13.6, OUTX: 35.5 / 17, OUTY: 3.2 };
export const own = (name, seed) => makeRng(hashSeed('ball-flat-' + name + ':' + seed));

// height of the stair's surface at zr; a foot climbing it is lifted over each riser (the same arithmetic as STAIR_GLSL)
const hs = (q) => { const p = q - 0.5, f = p - Math.floor(p); return clamp(Math.floor(p) + 1 + smoothstep(0.3, 0.7, f), 0, ST.RUN); };
export function stairY(zr) {
  const a = clamp(zr - ST.HEAD, 0, ST.G0 - ST.HEAD), fa = Math.min(Math.floor(a / ST.MOD), 2);
  let y = fa * ST.DROP + ST.RISE * hs(a - fa * ST.MOD);
  const b = clamp(zr - ST.G1, 0, ST.FOOT - ST.G1), fb = Math.floor(b / ST.MOD);
  y += fb * ST.DROP + ST.RISE * hs(b - fb * ST.MOD);
  return -y;
}
export const STAIR_GLSL = /* glsl */`
  float stairHs(float q){ float p = q - .5; return clamp(floor(p) + 1. + smoothstep(.3, .7, fract(p)), 0., ${ST.RUN.toFixed(1)}); }
  float stairY(float zr){
    float a = clamp(zr - ${ST.HEAD.toFixed(1)}, 0., ${(ST.G0 - ST.HEAD).toFixed(1)}), fa = min(floor(a / ${ST.MOD.toFixed(1)}), 2.);
    float y = fa * ${ST.DROP.toFixed(3)} + ${ST.RISE.toFixed(3)} * stairHs(a - fa * ${ST.MOD.toFixed(1)});
    float b = clamp(zr - ${ST.G1.toFixed(1)}, 0., ${(ST.FOOT - ST.G1).toFixed(1)}), fb = floor(b / ${ST.MOD.toFixed(1)});
    y += fb * ${ST.DROP.toFixed(3)} + ${ST.RISE.toFixed(3)} * stairHs(b - fb * ${ST.MOD.toFixed(1)});
    return -y;
  }`;

// ---------------------------------------------------------------- the plan of a visit (pure: no picture is needed)
// Every draw of the layout comes out of this one stream, in this fixed order; nothing else draws out of it.
export function ballPlan(seed, hourWish = 'any') {
  const rp = own('plan', seed);
  const hand = rp.pick([-1, 1]);
  const hourDraw = rp.pick(['night', 'night', 'night', 'night', 'golden', 'golden', 'day', 'dawn']);
  const hour = hourWish && hourWish !== 'any' ? hourWish : hourDraw;
  const cityLen = Math.round(rp.range(198, 226));
  const weave = [rp.sign() * rp.range(1.8, 3.1), rp.range(1.2, 2.2)];
  const house = { shift: rp.int(-2, 2), above: rp.int(1, 3), wide: rp.int(3, 4) };
  const forestLen = Math.round(rp.range(92, 112)), forestWeave = rp.sign() * rp.range(2.6, 4.4);
  const colPitch = rp.pick([20, 22, 24]), naveBays = rp.int(6, 7), colMake = rp.pick(['fluted', 'twisted', 'faceted']);
  const orchSide = rp.pick([-1, 1]), naveOff = rp.range(3, 5), rosesSide = rp.pick([-1, 1]);
  const poolOrder = rp.shuffle(['violet', 'ruby', 'crystal']), poolPitch = Math.round(rp.range(58, 66));
  const moonAz = rp.range(22, 36) * rp.sign(), moonEl = rp.range(11, 17);
  // places along the halls of F2, in metres in from the tall doorway
  const TUL = 18, naveLen = colPitch * naveBays, B1 = forestLen + TUL, B2 = B1 + naveLen;
  const POOL = { len: 30, half: 11, lead: 36 };
  const pools = poolOrder.map((kind, k) => ({ kind, d: B2 + POOL.lead + k * poolPitch }));
  const lastRim = pools[2].d + POOL.len / 2, B3 = lastRim + 14, bay3 = colPitch * 5, roomFront = B3 + bay3, dEnd = roomFront + ROOM.LEN;
  // THE FAR END, AS IT STANDS (nothing of it is a state of the visit but the light at its windows): the far bay keeps
  // the hall's own section, its columns and its vault for two pitches of the columns, to the hall's END WALL with its
  // great portal; behind the portal three chambers, each a pitch long and smaller than the last (two gilded, the third
  // papered), draw in to the sitting room's own width and height at the room's front. shellAt(d) = the half width and
  // the height of the place at d metres in; roomLight = where the hall's light gives way to the room's own, and where
  // the room's is whole (a light of place).
  const endWall = B3 + 2 * colPitch;
  const chambers = [[20.5, 33, true, 0.9], [18.6, 26.5, true, 0.7], [17.6, 22.6, false, 0]].map(([w, h, gilt, lamp], i) => ({ d0: endWall + i * colPitch, d1: endWall + (i + 1) * colPitch, w, h, gilt, lamp }));
  const shellAt = (d) => { if (d < endWall) return [ROOM.HALF * ROOM.OUTX, ROOM.H * ROOM.OUTY]; for (const c of chambers) if (d < c.d1) return [c.w, c.h]; return [ROOM.HALF, ROOM.H]; };
  const roomLight = [chambers[1].d1 - 10, roomFront + 6];
  const zStart = ST.HALL + cityLen;
  const w1 = (x, y, z) => [hand * x, y, z - zStart];
  const w2 = (xl, yl, d) => w1(ST.WALL + d, ST.GY + yl, -ST.DOOR + xl);
  // the line (see the rules in the header of the world): level over the roofs and through window, hallway and door;
  // down the stair 7.5 m over its mean slope; a quarter turn of 48 m radius off the great landing; the halls of F2
  const pts = [];
  const Y0 = 6.4, slope = (ST.GY + 9.5 - ST.FLY) / (ST.G0 - ST.HEAD), zrTurn = ST.DOOR - ST.TURN_R;
  // the height over the stair: level to 6 m past the door, the pitch eased in over 44 m, then the mean slope; eased out
  // again over the first 44 m of the turn, so that the turn ends level 9.5 m over the great landing
  const RAMP = 44, zrA = 6, yA = 6.2, zrB = zrA + RAMP, yB = yA + slope * RAMP / 2, yTurn = yB + slope * (zrTurn - zrB), EASE = 2 * (ST.GY + 9.5 - yTurn) / slope;
  const yDown = (zr) => (zr <= zrA ? yA : zr <= zrB ? yA + slope * (zr - zrA) * (zr - zrA) / (2 * RAMP) : yB + slope * (zr - zrB));
  const yArc = (sArc) => (sArc >= EASE ? ST.GY + 9.5 : yTurn + slope * (sArc - sArc * sArc / (2 * EASE)));
  pts.push(w1(0, Y0, zStart), w1(0, Y0, zStart - 34), w1(weave[0], Y0 + 0.4, zStart - 78), w1(-Math.sign(weave[0]) * weave[1], Y0 + 0.2, zStart - 130), w1(0, Y0, ST.HALL + 34));
  pts.push(w1(0, Y0, ST.HALL), w1(0, 6.3, 24), w1(0, 6.2, 0));
  for (const zr of [12, 24, 37, 50, 64, 79]) pts.push(w1(0, yDown(zr), -zr));
  pts.push(w1(0, yTurn, -zrTurn));
  for (let i = 1; i <= 5; i++) { const a = i * Math.PI / 12; pts.push(w1(ST.TURN_R * (1 - Math.cos(a)), yArc(ST.TURN_R * a), -zrTurn - ST.TURN_R * Math.sin(a))); }
  const fs = forestWeave, no = -orchSide * naveOff;
  pts.push(w2(0, 9.5, 2), w2(fs * 0.6, 9.3, 26), w2(fs, 9.8, 54), w2(fs * 0.3, 10, 84), w2(0, 9.8, B1 - 2));
  pts.push(w2(no, 10, B1 + 46), w2(no, 10, B2 - 50), w2(0, 8.2, B2 - 4));
  for (let k = 0; k < 3; k++) { pts.push(w2(0, 7.0, pools[k].d)); if (k < 2) pts.push(w2(0, 7.0, pools[k].d + poolPitch / 2)); }
  pts.push(w2(0, 7.0, B3 + 10), w2(0, 6.8, B3 + 50), w2(0, 6.8, dEnd - 96), w2(0, 6.8, dEnd - 64), w2(0, 6.8, dEnd - 32), w2(0, 6.8, dEnd));
  return { seed, hand, hour, cityLen, weave, house, forestLen, forestWeave, colPitch, naveBays, colMake, orchSide, naveOff, rosesSide, poolOrder, poolPitch,
    moonAz, moonEl, TUL, naveLen, B1, B2, B3, POOL, pools, lastRim, bay3, roomFront, dEnd, endWall, chambers, roomLight, shellAt, zStart, w1, w2, pts, Y0 };
}

// ---------------------------------------------------------------- the film of a visit (pure)
// Places are metres along the flown route, found on the route itself; windows of the gaze and the pace are laid
// between places. Nothing here knows a share of the flight.
export function ballFilm(plan, path) {
  const LEN = path.length, v = new THREE.Vector3(), { hand, zStart } = plan;
  // where the visitor is, in the frames of the place, after m metres of route
  const at = (m) => { path.posAtDist(clamp(m, 0, LEN), v); const x1 = hand * v.x, z1 = v.z + zStart; return { x1, y: v.y, z1, zr: -z1, d: x1 - ST.WALL, xl: z1 + ST.DOOR }; };
  // first metre at which a measure of the place passes zero (a scan every metre, then halving)
  // (the route is sampled once, every whole metre; makeRoute reads the same samples)
  const S = []; for (let m = 0, n = Math.ceil(LEN); m <= n; m++) S.push(at(Math.min(m, LEN)));
  const where = (f, from = 0) => {
    let a = from, fa = f(at(a));
    for (let i = Math.floor(from) + 1; i < S.length; i++) {
      const m = Math.min(i, LEN), fm = f(S[i]);
      if ((fa < 0) !== (fm < 0)) { let lo = a, hi = m; for (let i = 0; i < 24; i++) { const mid = (lo + hi) / 2; if ((f(at(mid)) < 0) === (fa < 0)) lo = mid; else hi = mid; } return (lo + hi) / 2; }
      a = m; fa = fm;
    }
    return LEN;
  };
  const M = {};
  M.window = where((p) => p.z1 - ST.HALL);
  M.door = where((p) => p.z1, M.window);
  M.head = where((p) => p.zr - ST.HEAD, M.door);
  M.turn = where((p) => p.zr - (ST.DOOR - ST.TURN_R), M.head);
  M.f2 = where((p) => p.d, M.turn);
  M.forestEnd = where((p) => p.d - plan.forestLen, M.f2);
  M.b1 = where((p) => p.d - plan.B1, M.f2);
  M.b2 = where((p) => p.d - plan.B2, M.b1);
  M.pools = plan.pools.map((q) => where((p) => p.d - q.d, M.b2));
  M.b3 = where((p) => p.d - plan.B3, M.b2);
  M.room = where((p) => p.d - plan.roomFront, M.b3);
  // pace: quick over the roofs, slower down the stair and round the turn, even through the halls and at the end
  const knots = [[0, 1.2], [M.window - 44, 1.2], [M.window, 0.98], [M.door, 0.92], [M.head + 30, 0.88], [M.f2, 0.86], [M.f2 + 44, 0.97], [M.b1, 1.0], [M.b2, 0.96], [M.pools[2], 0.96], [M.b3 + 30, 1.0], [LEN, 1.0]];
  const paceAt = (m) => {
    let i = 0; while (i < knots.length - 2 && m > knots[i + 1][0]) i++;
    const a = knots[i], b = knots[i + 1];
    return lerp(a[1], b[1], smoothstep(a[0], Math.max(b[0], a[0] + 1e-3), m));
  };
  // what the gaze may turn to, one at a time: the orchestra's terrace, the monkeys' stage, the cat (all of F2)
  const s = plan.orchSide, P = (xl, yl, d) => new THREE.Vector3(...plan.w2(xl, yl, d));
  const PL = ballPlaces(plan), orchD = PL.orchD, orchLen = PL.orchLen, monkD = PL.monkD, catD = PL.catD;
  const places = { orch: { side: s, d0: orchD, len: orchLen, eye: P(s * 16, 6.5, orchD + orchLen / 2) }, monk: { side: -s, d: monkD, eye: P(-s * 20, 6, monkD) }, cat: { side: s, d: PL.cat.d, eye: P(PL.cat.x, 7.6, PL.cat.d) } };
  const mAtD = (d, from) => where((p) => p.d - d, from);
  const win = (d0, d1) => [mAtD(d0, M.f2) / LEN, mAtD(d1, M.f2) / LEN];
  // the orchestra is 56 m long: the gaze rests on the players 26 m on from the visitor and slides along the terrace with it
  // (worked out here, in the pull's own function, out of u); stage and cat are let go before the visitor is level with them
  const orchEye = new THREE.Vector3();
  const orchAt = (time, u) => { const dv = at(u * LEN).d; return orchEye.set(...plan.w2(s * 16, 6.5, clamp(dv + 26, orchD + 6, orchD + orchLen - 6))); };
  // stage and cat: the gaze rests on the thing itself until the visitor is 24 m short of it, then on the wall 24 m on from
  // the visitor on that hand (so that it never swings round as the thing goes by), and is let go a little past
  const slide = (xl, yl, dObj) => { const eye = new THREE.Vector3(); return (time, u) => eye.set(...plan.w2(xl, yl, Math.max(dObj, at(u * LEN).d + 24))); };
  const wo = win(orchD - 48, orchD + orchLen - 4), wm = win(monkD - 64, monkD + 6), wc = win(PL.cat.d - 56, PL.cat.d + 12);
  const pois = [
    { at: orchAt, from: wo[0], to: wo[1], weight: 0.45, fade: 0.5 },
    { at: slide(-s * 20, 6, monkD), from: wm[0], to: wm[1], weight: 0.4, fade: 0.5 },
    { at: slide(PL.cat.x, 7.6, PL.cat.d), from: wc[0], to: wc[1], weight: 0.42, fade: 0.5 },
  ];
  return { LEN, M, S, at, where, paceAt, pace: (u) => paceAt(u * LEN), pois, places };
}

// the camera the world returns (the replay flies with the same numbers)
export const CAM = { fov: 64, near: 0.3, far: 2600, lookAhead: 16, sway: 0.5, bank: 0.3 };

// ---------------------------------------------------------------- a small geometry builder (position, normal, color, aux)
// aux = (kind of surface, glow of its own, gloss, a free number). Everything a hall is made of is merged through it.
const _v3 = new THREE.Vector3(), _n3 = new THREE.Vector3();
export const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
export const mulc = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
export const mixc = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
// (a growing typed buffer: every number is written once into its place, so that a build leaves no lists to be gathered
// up and thrown away; length = how many numbers it holds)
class Buf {
  constructor(T, n = 16384) { this.T = T; this.b = new T(n); this.length = 0; }
  need(k) { if (this.length + k > this.b.length) { const nb = new this.T(Math.max(this.b.length * 2, this.length + k)); nb.set(this.b.subarray(0, this.length)); this.b = nb; } }
  push3(x, y, z) { this.need(3); const b = this.b, n = this.length; b[n] = x; b[n + 1] = y; b[n + 2] = z; this.length = n + 3; }
  push4(x, y, z, w) { this.need(4); const b = this.b, n = this.length; b[n] = x; b[n + 1] = y; b[n + 2] = z; b[n + 3] = w; this.length = n + 4; }
  push() { const k = arguments.length; this.need(k); for (let i = 0; i < k; i++) this.b[this.length++] = arguments[i]; }
  done() { return this.b.slice(0, this.length); }
}
// The gathering buffers are lent: a Geo takes its five when it is made and gives them back when its geometry is built,
// so the buffers grow once to the largest mesh and are used again by the next (no growing, little to sweep). The world
// lets them all go at the end of its build (geoRest).
const LENT = { f: [], i: [] };
const lend = (T) => { const b = (T === Uint32Array ? LENT.i : LENT.f).pop(); if (b) { b.length = 0; return b; } return new Buf(T); };
export function geoRest() { LENT.f.length = 0; LENT.i.length = 0; }
// the box and the sphere about a geometry, read straight off its points
function bounds(g, P) {
  let x0 = Infinity, y0 = Infinity, z0 = Infinity, x1 = -Infinity, y1 = -Infinity, z1 = -Infinity;
  const n = P.length;
  for (let i = 0; i < n; i += 3) { const x = P[i], y = P[i + 1], z = P[i + 2]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; if (z < z0) z0 = z; if (z > z1) z1 = z; }
  if (!n) { x0 = y0 = z0 = x1 = y1 = z1 = 0; }
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, cz = (z0 + z1) / 2; let r2 = 0;
  for (let i = 0; i < n; i += 3) { const dx = P[i] - cx, dy = P[i + 1] - cy, dz = P[i + 2] - cz, d = dx * dx + dy * dy + dz * dz; if (d > r2) r2 = d; }
  g.boundingBox = new THREE.Box3(new THREE.Vector3(x0, y0, z0), new THREE.Vector3(x1, y1, z1));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(cx, cy, cz), Math.sqrt(Math.max(r2, 0)));
}
export class Geo {
  constructor() { this.P = lend(Float32Array); this.N = lend(Float32Array); this.C = lend(Float32Array); this.A = lend(Float32Array); this.I = lend(Uint32Array); this.c = [1, 1, 1]; this.a = [0, 0, 0, 0]; this.m = null; this.nm = new THREE.Matrix3(); }
  get tris() { return this.I.length / 3; }
  giveBack() { LENT.f.push(this.P, this.N, this.C, this.A); LENT.i.push(this.I); this.P = this.N = this.C = this.A = this.I = null; }
  col(c, k = 1) { this.c = k === 1 ? c : mulc(c, k); return this; }
  kind(k = 0, glow = 0, gloss = 0, w = 0) { this.a = [k, glow, gloss, w]; return this; }
  at(matrix) { this.m = matrix || null; if (matrix) this.nm.getNormalMatrix(matrix); return this; }
  place(x, y, z, ry = 0, s = 1) { return this.at(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), ry), new THREE.Vector3(s, s, s))); }
  v(x, y, z, nx, ny, nz, c) {
    if (this.m) { _v3.set(x, y, z).applyMatrix4(this.m); _n3.set(nx, ny, nz).applyMatrix3(this.nm).normalize(); x = _v3.x; y = _v3.y; z = _v3.z; nx = _n3.x; ny = _n3.y; nz = _n3.z; }
    const k = c || this.c, a = this.a;
    this.P.push3(x, y, z); this.N.push3(nx, ny, nz); this.C.push3(k[0], k[1], k[2]); this.A.push4(a[0], a[1], a[2], a[3]);
    return this.P.length / 3 - 1;
  }
  // flat quad, a b c d counter-clockwise seen from outside; cb, ct: colours of the first and the second pair
  quad(a, b, c, d, cb, ct) {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    const i0 = this.v(a[0], a[1], a[2], nx, ny, nz, cb), i1 = this.v(b[0], b[1], b[2], nx, ny, nz, cb), i2 = this.v(c[0], c[1], c[2], nx, ny, nz, ct || cb), i3 = this.v(d[0], d[1], d[2], nx, ny, nz, ct || cb);
    this.I.push(i0, i1, i2, i0, i2, i3); return this;
  }
  tri(a, b, c) {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    const i0 = this.v(a[0], a[1], a[2], nx, ny, nz), i1 = this.v(b[0], b[1], b[2], nx, ny, nz), i2 = this.v(c[0], c[1], c[2], nx, ny, nz);
    this.I.push(i0, i1, i2); return this;
  }
  box(x0, y0, z0, x1, y1, z1, o = {}) {
    if (o.sides !== false) {
      this.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]); this.quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]);
      this.quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]); this.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]);
    }
    if (o.top !== false) this.quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]);
    if (o.bottom) this.quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]);
    return this;
  }
  cbox(cx, y0, cz, sx, sy, sz, o) { return this.box(cx - sx / 2, y0, cz - sz / 2, cx + sx / 2, y0 + sy, cz + sz / 2, o); }
  // surface of revolution about the y axis through (cx, cz): profile [[r, y], ...] from the foot up. o.rmod(angle, y) scales
  // the radius (flutes, facets), o.twist turns the section with height (radians a metre), o.sx / o.sz squash it
  lathe(cx, cy, cz, prof, seg = 12, o = {}) {
    const a0 = o.a0 ?? 0, a1 = o.a1 ?? Math.PI * 2, n = prof.length, base = this.P.length / 3, sx = o.sx ?? 1, sz = o.sz ?? 1;
    for (let j = 0; j < n; j++) {
      const r = prof[j][0], y = prof[j][1], p0 = prof[Math.max(j - 1, 0)], p1 = prof[Math.min(j + 1, n - 1)];
      let dr = p1[0] - p0[0], dy = p1[1] - p0[1]; const dl = Math.hypot(dr, dy) || 1; dr /= dl; dy /= dl;
      const c = o.colors ? o.colors[j] : null;
      for (let i = 0; i <= seg; i++) {
        const a = a0 + (a1 - a0) * i / seg + (o.twist ? o.twist * y : 0), k = o.rmod ? o.rmod(a, y) : 1, ca = Math.cos(a), sa = Math.sin(a);
        this.v(cx + ca * r * k * sx, cy + y, cz + sa * r * k * sz, ca * dy, -dr, sa * dy, c);
      }
    }
    for (let j = 0; j < n - 1; j++) for (let i = 0; i < seg; i++) { const q = base + j * (seg + 1) + i; this.I.push(q, q + seg + 1, q + seg + 2, q, q + seg + 2, q + 1); }
    return this;
  }
  // a round tube along points (a wire, a liana, a tail, a whisker)
  tube(pts, r, seg = 5, rEnd, wf) {
    const base = this.P.length / 3, n = pts.length, up = new THREE.Vector3(0, 1, 0), t = new THREE.Vector3(), b = new THREE.Vector3(), w = new THREE.Vector3();
    for (let j = 0; j < n; j++) {
      const p = pts[j], q0 = pts[Math.max(j - 1, 0)], q1 = pts[Math.min(j + 1, n - 1)];
      t.set(q1[0] - q0[0], q1[1] - q0[1], q1[2] - q0[2]).normalize(); b.crossVectors(t, Math.abs(t.y) > 0.9 ? up.set(1, 0, 0) : up.set(0, 1, 0)).normalize(); w.crossVectors(t, b);
      const rr = rEnd == null ? r : lerp(r, rEnd, j / (n - 1));
      if (wf) this.a = [this.a[0], this.a[1], this.a[2], wf(j / (n - 1))];
      for (let i = 0; i <= seg; i++) { const a = i / seg * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a), nx = b.x * ca + w.x * sa, ny = b.y * ca + w.y * sa, nz = b.z * ca + w.z * sa; this.v(p[0] + nx * rr, p[1] + ny * rr, p[2] + nz * rr, nx, ny, nz); }
    }
    for (let j = 0; j < n - 1; j++) for (let i = 0; i < seg; i++) { const q = base + j * (seg + 1) + i; this.I.push(q, q + 1, q + seg + 2, q, q + seg + 2, q + seg + 1); }
    return this;
  }
  // a box that tapers: half sizes at the foot and at the top
  taper(cx, cz, w0, d0, w1, d1, y0, y1, top = true) {
    const a = [[cx - w0, cz + d0], [cx + w0, cz + d0], [cx + w0, cz - d0], [cx - w0, cz - d0]], b = [[cx - w1, cz + d1], [cx + w1, cz + d1], [cx + w1, cz - d1], [cx - w1, cz - d1]];
    for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; this.quad([a[i][0], y0, a[i][1]], [a[j][0], y0, a[j][1]], [b[j][0], y1, b[j][1]], [b[i][0], y1, b[i][1]]); }
    if (top) this.quad([b[0][0], y1, b[0][1]], [b[1][0], y1, b[1][1]], [b[2][0], y1, b[2][1]], [b[3][0], y1, b[3][1]]);
    return this;
  }
  ball(cx, cy, cz, rx, ry, rz, seg = 8, rings = 5, ringCol) {
    const prof = []; for (let j = 0; j <= rings; j++) { const a = -Math.PI / 2 + Math.PI * j / rings; prof.push([Math.max(Math.cos(a), 0.001), Math.sin(a)]); }
    const base = this.P.length / 3;
    for (let j = 0; j <= rings; j++) for (let i = 0; i <= seg; i++) {
      const a = i / seg * Math.PI * 2, r = prof[j][0], y = prof[j][1], ca = Math.cos(a), sa = Math.sin(a);
      this.v(cx + ca * r * rx, cy + y * ry, cz + sa * r * rz, ca * r, y, sa * r, ringCol ? ringCol(j) : null);
    }
    for (let j = 0; j < rings; j++) for (let i = 0; i < seg; i++) { const q = base + j * (seg + 1) + i; this.I.push(q, q + seg + 1, q + seg + 2, q, q + seg + 2, q + 1); }
    return this;
  }
  build(extra) {
    const g = new THREE.BufferGeometry(), nv = this.P.length / 3;
    g.setAttribute('position', new THREE.BufferAttribute(this.P.done(), 3));
    g.setAttribute('normal', new THREE.BufferAttribute(this.N.done(), 3));
    g.setAttribute('color', new THREE.BufferAttribute(this.C.done(), 3));
    g.setAttribute('aux', new THREE.BufferAttribute(this.A.done(), 4));
    g.setIndex(new THREE.BufferAttribute(nv > 65535 ? this.I.done() : new Uint16Array(this.I.b.subarray(0, this.I.length)), 1));
    if (extra) extra(g);
    bounds(g, g.attributes.position.array); this.giveBack();
    return g;
  }
  // the same in small steps, for the large meshes
  async buildA(ctx) {
    const g = new THREE.BufferGeometry(), nv = this.P.length / 3;
    await ctx.yield(); g.setAttribute('position', new THREE.BufferAttribute(this.P.done(), 3));
    g.setAttribute('normal', new THREE.BufferAttribute(this.N.done(), 3));
    await ctx.yield(); g.setAttribute('color', new THREE.BufferAttribute(this.C.done(), 3));
    g.setAttribute('aux', new THREE.BufferAttribute(this.A.done(), 4));
    await ctx.yield(); g.setIndex(new THREE.BufferAttribute(nv > 65535 ? this.I.done() : new Uint16Array(this.I.b.subarray(0, this.I.length)), 1));
    await ctx.yield(); bounds(g, g.attributes.position.array); this.giveBack();
    await ctx.yield();
    return g;
  }
}

// ---------------------------------------------------------------- the light of a hall
// Each hall (a zone) is shaded in its own frame by: a coloured ambient from above and below, a far key, up to three rows
// of lamps along the hall (candle posts, chandeliers), up to five single lamps (pools, a table lamp, a doorway).
// No three.js light takes part. The eye is the engine's own cameraPosition, carried into the hall's frame by uW2L.
export const NOISE_GLSL = /* glsl */`
  float h11(float p){ p = fract(p * .1031); p *= p + 33.33; p *= p + p; return fract(p); }
  float h21(vec2 p){ vec3 q = fract(vec3(p.xyx) * .1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
  float h31(vec3 p){ p = fract(p * .1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
  float vn2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
    return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
  float vn3(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
    float a = mix(mix(h31(i), h31(i + vec3(1., 0., 0.)), f.x), mix(h31(i + vec3(0., 1., 0.)), h31(i + vec3(1., 1., 0.)), f.x), f.y);
    float b = mix(mix(h31(i + vec3(0., 0., 1.)), h31(i + vec3(1., 0., 1.)), f.x), mix(h31(i + vec3(0., 1., 1.)), h31(i + vec3(1., 1., 1.)), f.x), f.y);
    return mix(a, b, f.z); }`;
export const LIGHT_GLSL = /* glsl */`
  uniform vec3 uAmbUp, uAmbDn, uKeyDir, uKeyC, uFogC;
  uniform vec4 uLine[3]; uniform vec3 uLineC[3]; uniform vec3 uLineP, uLineK; uniform vec2 uLineZ;
  uniform vec4 uPt[5]; uniform vec3 uPtC[5];
  // one single lamp of a hall may waver (x: which, y: how deep, z: the world's clock)
  uniform vec3 uWav;
  // shadows of clouds under the far key (x: how deep, y: one over their size, z: the world's clock)
  uniform vec3 uCld;
  uniform float uFogD;
  uniform vec4 uGrey, uFogG; uniform vec3 uAmbG;
  // the light off the boiling pools ripples (x: how deep, y: the ball's clock); the strip of light that falls through
  // the far doorway along the floor (the door's z, its half width, its strength, how far it reaches)
  uniform vec2 uShim; uniform vec4 uDoorS;
  // how far a point lies in a hall's second light (the sitting room's own, at the ballroom's far end): a light of place,
  // by the point's own distance into the hall (uGrey = where it begins, where it is whole, the share of the far key
  // that belongs to it only, how much of the rows of lamps does not reach into it)
  float hallGrey(vec3 P){ return smoothstep(uGrey.x, uGrey.y, -P.z); }
  // light on a point P with normal N seen along V (all in the hall's frame); returns diffuse light, adds the gloss to spec
  vec3 hallLight(vec3 P, vec3 N, vec3 V, float sh, out vec3 spec){
    float gr = hallGrey(P);
    vec3 dif = mix(mix(uAmbDn, uAmbUp, N.y * .5 + .5), uAmbG * (.72 + .28 * N.y), gr);
    float kd = max(dot(N, uKeyDir), 0.) * mix(1., gr, uGrey.z);
    if (uCld.x > 0.) {
      // the sky's clouds pass before the moon or the sun: their shadows drift over the roofs and the tall house's front
      vec2 q = (P.xz - uKeyDir.xz * (P.y / max(uKeyDir.y, .2))) * uCld.y;
      float cs = sin(q.x + uCld.z * .5 + 1.7 * sin(q.y * .6 - uCld.z * .17)) * sin(q.y * 1.3 - uCld.z * .33 + 1.3 * sin(q.x * .7));
      float cl = uCld.x * smoothstep(-.15, .55, cs);
      // (the sky's own light dims a little with them too, where the key does not reach)
      kd *= 1. - cl; dif *= 1. - .5 * cl;
    }
    dif += uKeyC * kd;
    spec = uKeyC * pow(clamp(dot(N, normalize(uKeyDir + V)), 0., 1.), sh) * step(0.0001, kd);
    float bump = 1. + uLineP.y * cos(6.2832 * (P.z - uLineP.z) / max(uLineP.x, .01));
    float lift = uLineK.z * (1. - smoothstep(uLineK.x, uLineK.y, P.z));
    // the rows of lamps end where the hall ends (uLineZ: they fade out between these two z)
    bump *= (1. - smoothstep(uLineZ.x, uLineZ.y, P.z)) * (1. - uGrey.w * gr);
    for (int i = 0; i < 3; i++) {
      vec3 d = vec3(uLine[i].x, uLine[i].y + uLine[i].z * P.z + lift, P.z) - P;
      float r2 = dot(d, d); vec3 L = d * inversesqrt(max(r2, 1e-4));
      float att = bump / (1. + r2 / max(uLine[i].w * uLine[i].w, 1e-4));
      float nl = clamp(dot(N, L) * .8 + .2, 0., 1.);
      dif += uLineC[i] * (att * nl);
      spec += uLineC[i] * (att * pow(clamp(dot(N, normalize(L + V)), 0., 1.), sh) * step(0., dot(N, L)));
    }
    for (int i = 0; i < 5; i++) {
      vec3 d = uPt[i].xyz - P;
      float r2 = dot(d, d); vec3 L = d * inversesqrt(max(r2, 1e-4));
      float att = 1. / (1. + r2 / max(uPt[i].w * uPt[i].w, 1e-4));
      // the light that falls through a doorway is crossed by those who pass before the candles: soft bars of shade
      // that wheel about the lamp, on the world's clock
      if (uWav.y > 0. && abs(float(i) - uWav.x) < .5) {
        float a = atan(d.x, abs(d.z) + .05);
        att *= 1. - uWav.y * smoothstep(.15, .85, .5 + .5 * sin(a * 9. + uWav.z * 2.2) * sin(a * 4. - uWav.z * .63 + 1.7));
      }
      // the light off a boiling pool (the ballroom's first three single lamps) ripples over what stands about it
      if (uShim.x > 0. && float(i) < 2.5) {
        float rp = sin(P.y * 1.7 + P.x * .9 - uShim.y * 2.3 + float(i) * 2.1) * sin(P.z * 1.1 + P.y * .6 + uShim.y * 1.6) + .5 * sin((P.x + P.z) * 2.3 + P.y * 3.1 - uShim.y * 3.4);
        att *= 1. + uShim.x * rp;
      }
      float nl = clamp(dot(N, L) * .8 + .2, 0., 1.);
      dif += uPtC[i] * (att * nl);
      spec += uPtC[i] * (att * pow(clamp(dot(N, normalize(L + V)), 0., 1.), sh) * step(0., dot(N, L)));
    }
    if (uDoorS.z > 0.) {
      // the strip of light through the far doorway: along the floor and over what lies low on it
      float td = max(P.z - uDoorS.x, 0.), wd = uDoorS.y + td * .13;
      dif += vec3(3.4, 2.6, 1.5) * ((1. - smoothstep(wd - .3, wd + 1.1, abs(P.x))) * exp(-td / max(uDoorS.w, 1.)) * uDoorS.z * max(N.y, 0.) * (1. - smoothstep(.3, 1.6, P.y)));
    }
    return dif;
  }
  // the haze between the eye and a point takes the colour and the thickness of the point's own place
  vec3 hallFog(vec3 c, float dist, vec3 P){ float gr = hallGrey(P); return mix(mix(uFogC, uFogG.rgb, gr), c, exp(-mix(uFogD, uFogG.w, gr) * dist)); }`;

// the uniforms of one hall; every material of the hall holds these same objects
export function makeZone(o = {}) {
  const V3 = (c) => new THREE.Vector3(...(c || [0, 0, 0]));
  const U = {
    uAmbUp: { value: V3(o.ambUp) }, uAmbDn: { value: V3(o.ambDn) }, uKeyDir: { value: V3(o.keyDir || [0, 1, 0]).normalize() }, uKeyC: { value: V3(o.keyC) },
    uFogC: { value: V3(o.fogC) }, uFogD: { value: o.fogD ?? 0.001 },
    uGrey: { value: new THREE.Vector4(1e5, 2e5, 0, 0) }, uAmbG: { value: new THREE.Vector3() }, uFogG: { value: new THREE.Vector4(0, 0, 0, 0.001) },
    uLine: { value: [0, 1, 2].map(() => new THREE.Vector4(0, 0, 0, 1)) }, uLineC: { value: [0, 1, 2].map(() => new THREE.Vector3()) }, uLineP: { value: new THREE.Vector3(1, 0, 0) }, uLineK: { value: new THREE.Vector3(-1, 1, 0) }, uLineZ: { value: new THREE.Vector2(1e5, 2e5) },
    uPt: { value: [0, 1, 2, 3, 4].map(() => new THREE.Vector4(0, 0, 0, 1)) }, uPtC: { value: [0, 1, 2, 3, 4].map(() => new THREE.Vector3()) },
    uWav: { value: new THREE.Vector3(-1, 0, 0) },
    uCld: { value: new THREE.Vector3(0, 0.06, 0) },
    uShim: { value: new THREE.Vector2(0, 0) }, uDoorS: { value: new THREE.Vector4(0, 1, 0, 34) },
    uW2L: { value: new THREE.Matrix4() }, uTime: { value: 0 }, uBall: { value: 0 }, uVis: { value: new THREE.Vector4(0, 0, 0, 0) },
  };
  const zone = {
    U,
    line(i, x, y0, slope, range, c) { U.uLine.value[i].set(x, y0, slope, range); U.uLineC.value[i].set(c[0], c[1], c[2]); return zone; },
    point(i, x, y, z, range, c) { U.uPt.value[i].set(x, y, z, range); U.uPtC.value[i].set(c[0], c[1], c[2]); return zone; },
    frame(group) { group.updateMatrixWorld(true); U.uW2L.value.copy(group.matrixWorld).invert(); return zone; },
  };
  return zone;
}

// ---------------------------------------------------------------- the material everything built with Geo is drawn with
// kinds of surface (aux.x): 0 plain, 1 sparkling yellow stone, 2 carpet (aux.w = its half width), 3 veined pale stone,
// 4 gilt, 6 wallpaper, 7 coffered vault, 8 wall of arched mirrors (aux.w = their pitch), 9 wood, 10 earth and moss,
// 11 parquet, 12 a mass of flowers, 13 a leaf (aux.z = the way across it), 14 a palm frond (aux.y along, aux.z across),
// 15 a house wall with its windows (aux.y along, aux.w a row's height, aux.z the share lit; uVis.z = how far it is night),
// 16 a roof of sheet iron, 17 a looking glass, 18 patterned paper, 19 glass in gilt bars (aux.w = the way across its
// panes; uVis.rgb = the hour behind it), 20 the winter garden's floor (aux.y = how far it is the tiled path; the vertex
// colour = the shade of what stands on it). aux.y is the surface's own glow (times its colour), aux.z its gloss.
// o.wind: what is built with a weight in aux.w sways.
const LIT_VERT = /* glsl */`
  attribute vec4 aux;
  uniform mat4 uW2L; uniform float uTime;
  varying vec3 vP, vN, vC, vEye; varying vec4 vAux; varying float vDist;
  void main(){
    vec4 lp = vec4(position, 1.); vec3 n = normal;
    #ifdef USE_INSTANCING
      lp = instanceMatrix * lp; n = mat3(instanceMatrix) * n;
    #endif
    #ifdef WIND
      float wph = lp.x * .31 + lp.z * .27 + lp.y * .11;
      lp.xyz += vec3(sin(uTime * 1.1 + wph), .4 * sin(uTime * 1.7 + wph * 1.3), cos(uTime * .9 + wph * .8)) * (aux.w * .5);
    #endif
    vP = lp.xyz; vN = n; vC = color; vAux = aux;
    #ifdef USE_INSTANCING_COLOR
      vC *= instanceColor;
    #endif
    vec4 mv = viewMatrix * (modelMatrix * lp);
    vDist = length(mv.xyz);
    vEye = (uW2L * vec4(cameraPosition, 1.)).xyz;
    gl_Position = projectionMatrix * mv;
  }`;
const LIT_FRAG = /* glsl */`
  varying vec3 vP, vN, vC, vEye; varying vec4 vAux; varying float vDist;
  uniform float uTime, uGlow; uniform vec4 uVis;
  ${NOISE_GLSL}
  ${LIGHT_GLSL}
  void main(){
    vec3 V = normalize(vEye - vP);
    vec3 N = normalize(vN); if (dot(N, V) < 0.) N = -N;
    vec3 alb = vC, add = vec3(0.), emis = vec3(0.);
    float kind = floor(vAux.x + .5), gloss = vAux.z, metal = 0., sh = mix(6., 80., vAux.z), glowK = vAux.y;
    if (kind == 1.) {
      float vein = vn3(vP * vec3(.35, .12, .35) + vn3(vP * .9) * 1.6);
      alb *= .76 + .36 * vein;
      vec3 cell = floor(vP * 4.);
      float g = h31(cell), ph = fract(g * 7.13 + dot(V, vec3(2.7, 3.9, 2.3)) * 1.9 + uTime * .13 * (g - .5));
      float glint = pow(clamp(1. - abs(ph - .5) * 7., 0., 1.), 3.) * step(.66, g);
      add += vec3(1., .88, .5) * glint * 2.6;
      gloss = max(gloss, .4); sh = 36.;
    } else if (kind == 2.) {
      float fuzz = clamp(1. - abs(dot(N, V)), 0., 1.); fuzz *= fuzz;
      alb *= .78 + .55 * fuzz + .14 * vn2(vP.xz * 2.6);
      float ax = abs(vP.x), w = vAux.w;
      float thread = (1. - smoothstep(.1, .2, abs(ax - (w - .8)))) + (1. - smoothstep(.05, .12, abs(ax - (w - 1.5))));
      vec2 q = fract(vec2(vP.x, vP.z + vP.y * 2.4) / 2.4) - .5;
      thread += (1. - smoothstep(.05, .09, length(q))) * step(ax, w - 2.) * .8;
      alb = mix(alb, vec3(.95, .68, .22), clamp(thread, 0., 1.) * .85);
    } else if (kind == 3.) {
      float vein = vn3(vP * vec3(.5, .5, .2) + vn3(vP * 1.3) * 1.2);
      alb *= .82 + .26 * vein - .22 * (1. - smoothstep(.0, .06, abs(vein - .52)));
    } else if (kind == 4.) {
      metal = 1.; gloss = max(gloss, .8); sh = 60.; alb *= .85 + .3 * vn3(vP * 1.7);
    } else if (kind == 6.) {
      float u = vP.x * abs(N.z) + vP.z * abs(N.x);
      float st = smoothstep(.42, .5, abs(fract(u / 2.6) - .5));
      vec2 q = fract(vec2(u / 2.6 + .5, vP.y / 2.2 + floor(u / 2.6 + .5) * .5)) - .5;
      float dot1 = 1. - smoothstep(.1, .14, length(q * vec2(1., .85)));
      alb *= .86 + .14 * st; alb = mix(alb, alb * vec3(1.25, 1.05, .8), dot1 * .7);
    } else if (kind == 7.) {
      vec2 g = vec2(vP.z, vAux.w) / 5.5; vec2 f = abs(fract(g) - .5);
      float rib = smoothstep(.36, .42, max(f.x, f.y));
      float ros = 1. - smoothstep(.1, .15, length(fract(g) - .5));
      alb = mix(alb * vec3(.36, .3, .5), vec3(1., .78, .32), max(rib, ros));
      metal = max(rib, ros); gloss = .6 * metal; sh = 30.;
    } else if (kind == 8.) {
      float pz = max(vAux.w, 1.), u = (fract((vP.z * abs(N.x) + vP.x * abs(N.z)) / pz) - .5) * pz, hw = pz * .3, y = vP.y;
      float top = 20., inside = step(abs(u), hw) * step(1.2, y) * step(y, top) + step(length(vec2(u, y - top)), hw) * step(top, y);
      inside = clamp(inside, 0., 1.);
      float fr = step(abs(u), hw + .5) * step(.6, y) * step(y, top) + step(length(vec2(u, y - top)), hw + .5) * step(top, y);
      vec3 glass = vec3(.5, .4, .24) * (.5 + .8 * vn2(vec2(u * .3 + V.x * 3., y * .12 + V.y * 2.))) + vec3(1., .8, .45) * pow(max(vn2(vec2(u * 1.3 + V.x * 9., y * .5)), 0.), 6.) * 1.6;
      alb = mix(alb, vec3(1., .76, .3), clamp(fr, 0., 1.) * (1. - inside));
      metal = clamp(fr, 0., 1.) * (1. - inside); gloss = max(gloss, .7 * metal);
      add += glass * inside * .5; alb = mix(alb, vec3(.08, .07, .1), inside);
    } else if (kind == 9.) {
      float gr = vn2(vec2(vP.x * 9. + vP.y * 7., vP.z * .5 + vP.y * .4));
      alb *= .74 + .4 * gr;
    } else if (kind == 10.) {
      float m = vn2(vP.xz * .22), m2 = vn2(vP.xz * 1.7);
      alb = mix(alb, alb * vec3(.55, 1.25, .5), smoothstep(.35, .7, m)) * (.7 + .5 * m2);
    } else if (kind == 11.) {
      vec2 g = vP.xz / 3.2; vec2 id = floor(g); vec2 f = fract(g);
      float flip = mod(id.x + id.y, 2.);
      float plank = flip > .5 ? floor(f.x * 4.) : floor(f.y * 4.);
      alb *= .8 + .28 * h21(id * 7. + plank) ;
      alb *= .9 + .1 * smoothstep(.0, .04, min(min(f.x, f.y), min(1. - f.x, 1. - f.y)));
      gloss = max(gloss, .5); sh = 50.;
    } else if (kind == 12.) {
      float u = vP.x * abs(N.z) + vP.z * abs(N.x);
      vec2 g = vec2(u, vP.y) / 1.7, id = floor(g), f = fract(g); float dm = 9., hid = 0.;
      for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
        vec2 o = vec2(float(i), float(j)), c = o + vec2(h21(id + o), h21(id + o + 17.3)) * .8 + .1; float dd = length(c - f);
        if (dd < dm) { dm = dd; hid = h21(id + o + 5.1); }
      }
      alb = mix(alb * (.5 + .75 * hid) * (.75 + .25 * cos(dm * 22.)), vec3(.016, .07, .025), smoothstep(.4, .56, dm));
    } else if (kind == 13.) {
      float rib = abs(fract(vAux.z * 9.) - .5);
      alb *= .78 + .3 * vn2(vP.xz * .8 + vP.y * .3) + .16 * smoothstep(.3, .5, rib);
      gloss = .35; sh = 24.;
    } else if (kind == 14.) {
      // a palm frond: aux.y = the way along it, aux.z = the way out from its rib; the gaps between its leaflets are cut away
      if (fract(vAux.y * 15.) > .58 && vAux.z > .16) discard;
      alb *= .8 + .3 * vn2(vP.xz * .9 + vP.y * .4);
      gloss = .3; sh = 20.; glowK = 0.;
    } else if (kind == 15.) {
      // a house wall: aux.y = the way along it, aux.w = the height of a row of windows, aux.z = the share of them lit
      float u = vAux.y, v = vP.y - vAux.w;
      vec2 cell = vec2(floor(u / 12. + .5), floor(v / 17. + .5)), q = vec2(u - cell.x * 12., v - cell.y * 17.);
      float inW = step(abs(q.x), 3.1) * step(abs(q.y), 5.), frame = step(abs(q.x), 3.7) * step(abs(q.y), 5.6) - inW;
      float h = h21(cell + fract(vAux.w * .137) * 31. + 3.), h2 = h21(cell * 1.7 + 9.);
      float lit = step(h, vAux.z * uVis.z) * step(.12, fract(h2 * 5. + uTime * (.004 + .01 * h2)));
      float bars = clamp(step(abs(q.x), .13) + step(abs(q.y - 1.7), .13), 0., 1.);
      vec3 lamp = mix(vec3(1., .66, .3), vec3(1., .86, .58), h2) * (1.3 + 1.6 * h2) * (1. - .75 * bars);
      lamp *= (.55 + .45 * smoothstep(-5., 1., q.y)) * (.7 + .3 * vn2(q * vec2(.9, .25) + cell * 5.));
      // (a lit window has its curtains drawn back to either hand, fuller toward the top, and a lamp low in the room)
      float curt = smoothstep(1.1, 2.3, abs(q.x) + .3 * sin(q.y * 1.1 + h2 * 20.) + .12 * q.y);
      vec2 lq = q - vec2((h2 - .5) * 2.4, -2.4);
      lamp = lamp * mix(vec3(1.), mix(vec3(.75, .2, .12), vec3(.8, .62, .3), h) * .5, curt) + vec3(1., .8, .5) * (1.8 * exp(-dot(lq, lq) * .9) * (1. - curt));
      // the wall: courses of stone, a sill under every window and a hood over it (paler: their tops take the sky)
      alb = mix(alb * (.82 + .3 * vn2(vec2(u, vP.y) * .22)) * (.93 + .07 * step(.5, fract(vP.y / 1.7))), alb * 1.3, frame);
      alb = mix(alb, vC * 1.7, step(abs(q.x), 3.9) * max(step(abs(q.y + 5.85), .25), step(abs(q.y - 5.85), .25)));
      if (inW > .5) { alb = (vec3(.012, .016, .026) + uAmbUp * .25) * (1. - .6 * smoothstep(3.4, 5., q.y)); gloss = .85; sh = 70.; emis = lamp * lit; }
      glowK = 0.;
    } else if (kind == 16.) {
      // a roof of sheet iron: seams up the slope, streaked
      float su = abs(N.x) > abs(N.z) ? vP.z : vP.x, f = abs(fract(su / 1.7) - .5);
      alb *= .78 + .3 * vn2(vec2(su * .4, vP.y * 1.3));
      alb = mix(alb, alb * 1.6, 1. - smoothstep(.015, .05, f));
      // (courses of sheets up the slope; the moon's shine keeps to the seams and the sheets' laps)
      float lap = abs(fract(vP.y / 1.15 + .2 * sin(su * .9)) - .5);
      alb *= .86 + .2 * smoothstep(.0, .12, lap);
      gloss = .16 + .3 * (1. - smoothstep(.02, .1, min(f, lap))); sh = 28.;
    } else if (kind == 17.) {
      // a looking glass: dark, and in it the ball's lights, points of gold that slide as the eye moves
      vec2 q = vec2(vP.z * abs(N.x) + vP.x * abs(N.z), vP.y), sl = q * .55 + V.xz * 4. + vec2(0., V.y * 3.);
      // (the lights are small and many, like candles far off: a point in rather more than half the cells of a coarse
      // lattice and a smaller one in a third of the cells of a fine one, on a dark glass with a breath of gold)
      vec2 ca = floor(sl * 1.5), fa = fract(sl * 1.5) - .5, cb = floor(sl * 3.7 + 7.), fb = fract(sl * 3.7 + 7.) - .5;
      float da = length(fa - (vec2(h21(ca + 3.1), h21(ca + 7.7)) - .5) * .56), db = length(fb - (vec2(h21(cb + 1.3), h21(cb + 5.9)) - .5) * .5);
      float gl = (1. - smoothstep(.03, .12, da)) * step(.56, h21(ca)) * 1.3 + (1. - smoothstep(.04, .16, db)) * step(.8, h21(cb)) * .6;
      alb = vec3(.05, .045, .05); gloss = .7; sh = 80.;
      // (behind the lights the glass holds the room's own tones, soft: the floor's wood low, the lamp-lit paper and
      // a hint of its lattice above)
      float up = smoothstep(2.6, 4.4, vP.y); vec2 lf = fract(sl * vec2(.9, .7)) - .5;
      vec3 refl = mix(vec3(.17, .09, .04), vec3(.3, .215, .1), up) * (.78 + .22 * vn2(sl * .4));
      refl *= 1. + .3 * up * (1. - smoothstep(.3, .38, abs(lf.x) + abs(lf.y)));
      emis = vec3(1., .72, .32) * gl + refl;
    } else if (kind == 18.) {
      // patterned paper: stripes, and a lattice of gilt diamonds with a gilt flower in each
      float u = vP.x * abs(N.z) + vP.z * abs(N.x), col2 = floor(u / 2.4);
      vec2 q = vec2(u / 2.4, vP.y / 3.2 + .5 * mod(col2, 2.)), f = fract(q) - .5;
      float dia = abs(f.x) + abs(f.y), fig = clamp(1. - smoothstep(.13, .17, length(f * vec2(1., 1.25))) + .6 * (1. - smoothstep(.02, .05, abs(dia - .36))), 0., 1.);
      alb *= .82 + .2 * smoothstep(.44, .5, abs(f.x));
      alb = mix(alb, vec3(.95, .7, .28), fig * .8);
      metal = fig * .6; gloss = max(gloss, .5 * metal);
    } else if (kind == 19.) {
      // glass in gilt bars (aux.w = the way across the panes): the hour inside stands behind the glass (uVis.rgb)
      vec2 q = vec2(vP.z / 3.2, vAux.w / 2.6), f = abs(fract(q) - .5);
      float bar = max(smoothstep(.43, .47, max(f.x, f.y)), smoothstep(.465, .49, abs(fract(vP.z / 9.6) - .5)));
      alb = mix(vec3(.02, .035, .05), vec3(1., .78, .32), bar); metal = bar; gloss = mix(.9, .7, bar); sh = 70.;
      emis = uVis.rgb * ((1. - bar) * (.75 + .5 * vn2(q * .8 + 3.)));
      glowK = 0.;
    } else if (kind == 20.) {
      // the winter garden's floor: a path of two-coloured tiles (aux.y = how far it is path), earth and moss beside
      // it; the vertex colour carries the shade of what stands on the floor (a half is no shade)
      vec2 q = vec2(vP.x + vP.z, vP.x - vP.z) / 3.1, id = floor(q), f = fract(q);
      float joint = smoothstep(.0, .05, min(min(f.x, f.y), min(1. - f.x, 1. - f.y)));
      vec3 tile = mix(vec3(.62, .56, .44), vec3(.4, .16, .1), mod(id.x + id.y, 2.)) * (.8 + .3 * h21(id)) * (.45 + .55 * joint);
      float m = vn2(vP.xz * .22), m2 = vn2(vP.xz * 1.7);
      vec3 earth = mix(vec3(.13, .1, .05), vec3(.07, .16, .04), smoothstep(.3, .65, m)) * (.7 + .5 * m2);
      float path = smoothstep(.35, .6, vAux.y + (m2 - .5) * .3);
      alb = mix(earth, mix(tile, earth * 1.3, (1. - joint) * .6), path) * vC * 2.;
      gloss = mix(.05, .35, path); sh = 30.; glowK = 0.;
    }
    vec3 spec; vec3 dif = hallLight(vP, N, V, sh, spec);
    // a leaf has a lit side and a shaded side; a little of the light on its far side comes through, greener
    if (kind == 13. || kind == 14.) { vec3 s2; dif = dif + hallLight(vP, -N, V, sh, s2) * vec3(.2, .36, .1); }
    float lum = dot(dif, vec3(.333));
    vec3 col = alb * dif * (1. - .65 * metal) + spec * gloss * mix(vec3(1.), alb * 2.2, metal) + add * min(lum, 1.6) + vC * (glowK * uGlow) + emis;
    gl_FragColor = vec4(hallFog(col, vDist, vP), 1.);
  }`;
export function litMaterial(zone, o = {}) {
  const m = new THREE.ShaderMaterial({
    uniforms: { ...zone.U, uGlow: o.glow || { value: 1 } }, vertexShader: LIT_VERT, fragmentShader: LIT_FRAG,
    vertexColors: true, side: o.side ?? THREE.DoubleSide, defines: { ...(o.wind ? { WIND: 1 } : {}) },
  });
  return m;
}

// one thing that moves as a whole (a head that turns, a pendulum): an instanced mesh of one, so that the hall's light
// finds it where it stands (the lit material works in the hall's frame, and an instance's own place is part of it)
export function mover(geometry, mat) {
  const mesh = new THREE.InstancedMesh(geometry, mat, 1), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), sc = new THREE.Vector3();
  mesh.frustumCulled = false;
  const set = (x, y, z, rx, ry, rz, k = 1) => { q.setFromEuler(e.set(rx, ry, rz)); mesh.setMatrixAt(0, m4.compose(p.set(x, y, z), q, sc.set(k, k, k))); mesh.instanceMatrix.needsUpdate = true; };
  set(0, 0, 0, 0, 0, 0, 1);
  return { mesh, set };
}

// ---------------------------------------------------------------- flames and glows: dabs that turn about their own place
// One instanced quad for every candle flame, lamp glow and glint of a hall. iPS = place and size, iCT = colour and
// (kind + phase): kind 0 a flame (a tear that flickers), 1 a soft glow, 2 a four-pointed glint.
export function makeDabs(zone, list, o = {}) {
  const n = list.length, g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0]), 3));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  const ps = new Float32Array(n * 4), ct = new Float32Array(n * 4);
  let r = 0, cx = 0, cy = 0, cz = 0;
  for (let i = 0; i < n; i++) { const q = list[i]; ps.set([q.p[0], q.p[1], q.p[2], q.size], i * 4); ct.set([q.c[0], q.c[1], q.c[2], (q.kind || 0) + (q.phase ?? 0.5) * 0.98], i * 4); cx += q.p[0] / n; cy += q.p[1] / n; cz += q.p[2] / n; }
  for (let i = 0; i < n; i++) r = Math.max(r, Math.hypot(list[i].p[0] - cx, list[i].p[1] - cy, list[i].p[2] - cz) + list[i].size);
  g.setAttribute('iPS', new THREE.InstancedBufferAttribute(ps, 4)); g.setAttribute('iCT', new THREE.InstancedBufferAttribute(ct, 4));
  g.instanceCount = n; g.boundingSphere = new THREE.Sphere(new THREE.Vector3(cx, cy, cz), r || 1);
  const uniforms = { uTime: zone.U.uTime, uFogD: zone.U.uFogD, uGain: o.gain || { value: 1 }, uFlip: { value: 1 } };
  const mk = (flip) => new THREE.ShaderMaterial({
    // (both faces: the dab is laid out in the eye's frame, and a mirrored hall, the other hand or the image under the
    // floor, turns its winding about)
    uniforms: { ...uniforms, uFlip: { value: flip } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      attribute vec4 iPS, iCT; uniform float uTime, uFlip, uFogD, uGain;
      varying vec2 vUv; varying vec3 vCol; varying float vKind, vPh;
      void main(){
        float kind = floor(iCT.w), ph = fract(iCT.w) * 61.;
        vec3 c = iPS.xyz; c.y *= uFlip;
        vec4 mv = viewMatrix * (modelMatrix * vec4(c, 1.));
        // (a glow keeps its strength at every distance: it is kept out of the lens by its place, see fitGlows)
        vec2 off = position.xy * iPS.w;
        if (kind < .5) { off.y = (position.y + .32) * iPS.w * 1.5 * uFlip; off.x += sin(uTime * 7. + ph) * .06 * iPS.w * (position.y + .5); }
        mv.xy += off;
        vUv = position.xy + .5; vKind = kind; vPh = ph;
        float fl = kind < .5 ? .8 + .2 * sin(uTime * 11. + ph * 3.) * sin(uTime * 4.3 + ph) : (kind < 1.5 ? .9 + .1 * sin(uTime * 3.1 + ph) : .55 + .45 * sin(uTime * 2.3 + ph));
        vCol = iCT.rgb * fl * uGain * exp(-uFogD * .6 * length(mv.xyz));
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      varying vec2 vUv; varying vec3 vCol; varying float vKind, vPh;
      void main(){
        vec2 p = vUv - .5; float a;
        if (vKind < .5) { float w = mix(.34, .04, clamp(vUv.y, 0., 1.)); a = (1. - smoothstep(w * .5, w, abs(p.x))) * smoothstep(0., .16, vUv.y) * (1. - smoothstep(.6, 1., vUv.y)); a += .22 * exp(-dot(p, p) * 14.); }
        else if (vKind < 1.5) { float r2 = dot(p, p); a = exp(-r2 * 18.) + .35 * exp(-r2 * 5.); a *= smoothstep(0., 1., 1. - r2 * 4.); }
        else { vec2 q = abs(p); a = exp(-dot(p, p) * 60.) + .6 * exp(-(q.x * 46. + q.y * 5.)) + .6 * exp(-(q.y * 46. + q.x * 5.)); a *= 1. - smoothstep(.4, .5, max(q.x, q.y)); }
        gl_FragColor = vec4(vCol * a, 1.);
      }`,
  });
  const mesh = new THREE.Mesh(g, mk(1)); mesh.renderOrder = 6; mesh.name = 'dabs';
  // (what each glow is, for the count of clearances)
  mesh.userData.what = list.map((q) => (q.kind === 1 ? q.what || 'lamp' : ''));
  let mirror = null;
  if (o.mirror) { mirror = new THREE.Mesh(g, mk(-1)); mirror.renderOrder = 1; mirror.frustumCulled = false; }
  return { mesh, mirror, count: n };
}
// A GLOW IS KEPT OUT OF THE LENS BY ITS PLACE. No glow's strength reads the eye; each kind is set down by a rule of its
// own (a halo over its chandelier, a ring of glows about an opening's frame, a haze glow raised off the lane), and here,
// last of all, any glow of a list whose middle would still lie within its own radius (half its size) and half a metre
// of the line is made smaller until it does not. T = the line in the list's own frame; the least clearance of each
// kind (the line's distance to the glow's middle less its radius) is written down.
export function fitGlows(T, best, list) {
  for (const q of list) {
    if (q.kind !== 1) continue;
    const g = T.dist(q.p[0], q.p[1], q.p[2]);
    if (q.size / 2 > g - 0.5) { q.size = Math.max(2 * (g - 0.5), 0.2); best['glow made smaller'] = (best['glow made smaller'] || 0) + 1; }
    const k = 'glow: ' + (q.what || 'lamp');
    best[k] = Math.min(best[k] ?? 99, Math.round((g - q.size / 2) * 100) / 100);
  }
  return list;
}

// ---------------------------------------------------------------- guests, dancers, players: instanced small figures
// A figure's geometry is built with Geo (aux.x = 1 gown, 2 plume: they take the instance's colour; aux.w = a weight for
// what swings: a hem, a bow arm). SHADE: the same deal of instances drawn as one soft dark patch under each pair, so
// that its feet meet the floor (the patch is laid on the floor at the pair's own place and turns with it).
export function actorGeometry(geo) { return geo.build(); }
ST.FIRE = ST.FOOT + 30;
const ACTOR_VERT = /* glsl */`
  #ifdef SHADE
    attribute vec4 iA, iB;
  #else
    attribute vec4 aux, iA, iB;
  #endif
  uniform mat4 uW2L; uniform float uBall, uTime, uFlip; uniform vec4 uCyc; uniform vec2 uShade;
  varying vec3 vP, vN, vC, vEye, vIC; varying vec4 vAux; varying float vDist;
  ${STAIR_GLSL}
  vec3 rotY(vec3 p, float a){ float c = cos(a), s = sin(a); return vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z); }
  void main(){
    float sc = iB.w, yaw = 0.; vec3 base;
    #ifdef SHADE
      vec3 p = vec3(position.x * uShade.x, .06, position.z * uShade.y), n = vec3(0., 1., 0.);
    #else
      vec3 p = position, n = normal;
    #endif
    #if MODE == 0
      float s = mod(iA.y + iA.z * uBall, uCyc.y), zr = uCyc.x - s;
      base = vec3(iA.x + sin(iA.w * 40. + s * 1.1) * .1, stairY(zr), -zr);
      sc *= mix(1., smoothstep(0., 5., s), uCyc.z) * mix(1., smoothstep(-8., -3., zr), uCyc.w);
    #elif MODE == 1
      float ph = iA.w * 6.2832, dir = iA.w > .5 ? 1. : -1., orb = ph * 3. + uBall * .22 * dir;
      base = vec3(iA.x + iA.z * cos(orb), 0., iA.y + iA.z * sin(orb));
      yaw = ph * 5. + uBall * 1.7 * (.8 + .4 * fract(iA.w * 7.)) * dir;
      #ifndef SHADE
        p.xz *= 1. + aux.w * (.1 + .08 * sin(uBall * 3.4 + ph * 9.));
      #endif
    #else
      base = iA.xyz; yaw = iA.w;
      float ph = fract(iA.x * .37 + iA.z * .73) * 6.2832;
      #if MODE == 2
        float bow = sin(uBall * 5.2);
        p.x += aux.w * bow * .42; p.y += aux.w * bow * .1;
        p.x += (1. - aux.w) * sin(uBall * 1.3 + ph) * .012 * p.y;
      #else
        float j = abs(sin(uBall * 3.1 + ph));
        p.y += j * .9; p.x += aux.w * sin(uBall * 6.2 + ph) * .3;
      #endif
    #endif
    p = rotY(p * sc, yaw); n = rotY(n, yaw);
    vec3 lp = base + p;
    vP = lp; vN = n; vIC = iB.rgb;
    #ifdef SHADE
      vC = vec3(position.x, 0., position.z); vAux = vec4(0.);
    #else
      vC = color; vAux = aux;
    #endif
    lp.y *= uFlip;
    vec4 mv = viewMatrix * (modelMatrix * vec4(lp, 1.));
    vDist = length(mv.xyz);
    vEye = (uW2L * vec4(cameraPosition, 1.)).xyz;
    gl_Position = projectionMatrix * mv;
  }`;
const ACTOR_FRAG = /* glsl */`
  varying vec3 vP, vN, vC, vEye, vIC; varying vec4 vAux; varying float vDist;
  uniform float uFlip;
  ${LIGHT_GLSL}
  void main(){
    #ifdef SHADE
      float r2 = dot(vC.xz, vC.xz);
      gl_FragColor = vec4(0., 0., 0., .5 * exp(-r2 * 2.4) * (1. - smoothstep(.6, 1., r2)) * exp(-uFogD * 1.5 * vDist));
    #else
    vec3 V = normalize(vEye - vP);
    vec3 N = normalize(vN); if (dot(N, V) < 0.) N = -N;
    float mask = floor(vAux.x + .5);
    vec3 alb = mask == 1. ? vIC * vC : (mask == 2. ? mix(vIC, vec3(.95), .6) * vC : vC);
    vec3 spec; vec3 dif = hallLight(vP, N, V, mix(6., 60., vAux.z), spec);
    vec3 col = alb * dif + spec * vAux.z + vC * vAux.y;
    gl_FragColor = vec4(hallFog(col, vDist, vP), 1.);
    #endif
  }`;
// mode: 0 climbing the stair (iA = lane x, start, pace, phase; o.cyc = where a cycle begins, its length, grows in, shrinks out), 1 waltzing (iA = middle x, middle z, radius, phase),
// 2 players and 3 monkeys (iA = place and the way they face); iB = colour and size
export function makeActors(zone, geometry, mode, iA, iB, o = {}) {
  const g = new THREE.InstancedBufferGeometry(); g.setIndex(geometry.index); for (const k in geometry.attributes) g.setAttribute(k, geometry.attributes[k]);
  g.setAttribute('iA', new THREE.InstancedBufferAttribute(iA, 4)); g.setAttribute('iB', new THREE.InstancedBufferAttribute(iB, 4));
  g.instanceCount = iA.length / 4;
  g.boundingSphere = o.sphere || new THREE.Sphere(new THREE.Vector3(), 1e5);
  const uniforms = (flip) => ({ ...zone.U, uFlip: { value: flip }, uCyc: { value: new THREE.Vector4(...(o.cyc || [0, 1, 0, 0])) }, uShade: { value: new THREE.Vector2(...(o.shade || [1, 1])) } });
  const mk = (flip) => new THREE.ShaderMaterial({ uniforms: uniforms(flip), vertexShader: ACTOR_VERT, fragmentShader: ACTOR_FRAG, vertexColors: true, side: THREE.DoubleSide, defines: { MODE: mode } });
  const mesh = new THREE.Mesh(g, mk(1));
  // the image under the polished floor: the same deal of instances, of a plainer make where one is given
  let mirror = null;
  if (o.mirror) {
    let gm = g;
    if (o.mirrorGeometry) { gm = new THREE.InstancedBufferGeometry(); gm.setIndex(o.mirrorGeometry.index); for (const k in o.mirrorGeometry.attributes) gm.setAttribute(k, o.mirrorGeometry.attributes[k]); gm.setAttribute('iA', g.attributes.iA); gm.setAttribute('iB', g.attributes.iB); gm.instanceCount = g.instanceCount; gm.boundingSphere = g.boundingSphere; }
    mirror = new THREE.Mesh(gm, mk(-1));
  }
  // the soft shade under each (o.shade = its half sizes across and along)
  let shade = null;
  if (o.shade) {
    const gs = new THREE.InstancedBufferGeometry();
    gs.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1]), 3)); gs.setIndex([0, 2, 1, 0, 3, 2]);
    gs.setAttribute('iA', g.attributes.iA); gs.setAttribute('iB', g.attributes.iB); gs.instanceCount = g.instanceCount; gs.boundingSphere = g.boundingSphere;
    shade = new THREE.Mesh(gs, new THREE.ShaderMaterial({ uniforms: uniforms(1), vertexShader: ACTOR_VERT, fragmentShader: ACTOR_FRAG, side: THREE.DoubleSide, transparent: true, depthWrite: false, defines: { MODE: mode, SHADE: 1 } }));
    shade.renderOrder = 3; shade.frustumCulled = false;
  }
  return { mesh, mirror, shade, count: g.instanceCount };
}

// ---------------------------------------------------------------- the figures (small, in evening dress, without faces)
const BLACK = [0.03, 0.03, 0.038], WHITE = [0.86, 0.86, 0.82];
const SKINS = [[0.72, 0.5, 0.38], [0.78, 0.58, 0.46], [0.6, 0.4, 0.3]], HAIRS = [[0.05, 0.035, 0.03], [0.16, 0.09, 0.04], [0.32, 0.3, 0.28], [0.02, 0.02, 0.025]];
// a walking pair's half width at size 1 (the lanes of the stair are laid by it)
const PAIR_HALF = 1.8;
// an arm: a thin round sleeve, shoulder to hand
const arm = (g, a, b, r = 0.13) => g.tube([a, b], r, 4, r * 0.8);
// a gentleman in a tailcoat, 4.6 m tall, feet at the matrix's origin, facing +z: trouser legs, a coat with a waist and
// shoulders, its tails, a white front, a round head with hair. hold 1: his arms in the dance's hold (the lady before him)
function man(g, v = 0, lean = 0, hold = 0) {
  const sk = SKINS[v % 3], hr = HAIRS[(v * 2 + 1) % 4];
  g.kind(0, 0, 0.3).col(BLACK);
  g.taper(-0.27, 0, 0.2, 0.25, 0.25, 0.26, 0, 2.2, false); g.taper(0.27, 0, 0.2, 0.25, 0.25, 0.26, 0, 2.2, false);
  g.lathe(0, 0, 0, [[0.5, 2.1], [0.64, 3.0], [0.8, 3.52], [0.18, 3.8]], 6, { sz: 0.6 });
  if (hold) { arm(g, [-0.74, 3.46, 0.05], [-1.02, 3.36, 1.02]); arm(g, [0.74, 3.46, 0.05], [0.4, 3.0, 1.22]); }
  else { arm(g, [-0.84, 3.44, 0], [-0.9, 2.2, 0.06]); arm(g, [0.84, 3.44, 0], [0.9, 2.2, 0.06]); }
  g.quad([-0.5, 2.1, -0.3], [-0.04, 2.1, -0.3], [-0.1, 1.0, -0.46], [-0.42, 1.0, -0.46]); g.quad([0.04, 2.1, -0.3], [0.5, 2.1, -0.3], [0.42, 1.0, -0.46], [0.1, 1.0, -0.46]);
  g.kind(0, 0, 0.1).col(WHITE);
  g.quad([-0.15, 2.5, 0.345], [0.15, 2.5, 0.345], [0.27, 3.6, 0.4], [-0.27, 3.6, 0.4]);
  g.kind(0, 0, 0.15);
  g.ball(0, 4.16, 0.02 + lean, 0.4, 0.44, 0.42, 6, 3, (j) => (j >= 2 ? hr : sk));
}
// a lady in a ball gown (aux.x 1 = gown, 2 = plume: the pair's own colour), facing +z: the gown a bell with a waist (its
// hem swings), a bodice with shoulders, long gloves, a round head with hair knotted behind and a plume
function lady(g, v = 0, hold = 0) {
  const sk = SKINS[(v + 1) % 3], hr = HAIRS[(v + 2) % 4];
  g.kind(1, 0, 0.35, 1).col([0.62, 0.62, 0.62]);
  g.lathe(0, 0, 0, [[1.04 + 0.06 * (v % 2), 0.04], [0.98, 0.6], [0.72, 1.55], [0.3, 2.52]], 8, { colors: [[0.52, 0.52, 0.52], [0.68, 0.68, 0.68], [0.88, 0.88, 0.88], [1, 1, 1]] });
  g.kind(1, 0, 0.35, 0).col([1, 1, 1]);
  g.lathe(0, 0, 0, [[0.3, 2.5], [0.5, 3.3], [0.2, 3.58]], 6, { sz: 0.62 });
  g.kind(0, 0, 0.2).col([0.9, 0.9, 0.86]);
  if (hold) { arm(g, [0.44, 3.3, 0.05], [0.98, 3.4, 0.98], 0.1); arm(g, [-0.44, 3.3, 0.05], [-0.5, 3.5, 1.1], 0.1); }
  else { arm(g, [-0.46, 3.3, 0], [-0.72, 2.45, 0.12], 0.1); arm(g, [0.46, 3.3, 0], [0.58, 2.15, 0.06], 0.1); }
  g.kind(0, 0, 0.15).col(sk);
  g.ball(0, 3.94, 0.02, 0.36, 0.4, 0.38, 6, 3, (j) => (j >= 2 ? hr : sk));
  g.col(hr); g.ball(0, 4.14, -0.34, 0.24, 0.22, 0.24, 4, 2);
  g.kind(2, 0.05, 0.2, 1).col([1, 1, 1]);
  const t = 0.25 * ((v % 3) - 1);
  g.quad([-0.1, 4.2, -0.08], [0.12, 4.2, -0.1], [0.4 + t, 5.15, -0.42], [0.05 + t, 5.2, -0.5]); g.quad([0.0, 4.2, -0.1], [-0.2, 4.2, -0.06], [-0.5 + t, 4.95, -0.3], [-0.24 + t, 5.05, -0.44]);
}
const M4 = (x, y, z, ry, s = 1) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), ry), new THREE.Vector3(s, s, s));
// a pair: 'walk' arm in arm facing +z (climbing the stair; no wider than PAIR_HALF either hand), 'waltz' closed in the
// dance's hold and turning about the pair's middle
export function pairGeometry(kind, v = 0) {
  const g = new Geo();
  if (kind === 'walk') { g.at(M4(-0.72, 0, 0, 0, 1)); man(g, v); g.at(M4(0.72, 0, 0.05, 0, 0.97)); lady(g, v); }
  else { g.at(M4(-0.62, 0, 0, Math.PI / 2, 1)); man(g, v, 0.05, 1); g.at(M4(0.78, 0, 0, -Math.PI / 2, 0.97)); lady(g, v, 1); }
  g.at(null);
  return actorGeometry(g);
}
// a plain pair, two tapered shapes and two heads: far down the stair ('walk'), and the image of a waltzing pair under
// the polished floor ('waltz')
export function farPairGeometry(kind = 'walk') {
  const g = new Geo(), xm = kind === 'walk' ? -0.72 : -0.62, xl = kind === 'walk' ? 0.72 : 0.78;
  g.kind(0, 0, 0.2).col(BLACK); g.taper(xm, 0, 0.5, 0.26, 0.7, 0.34, 0, 3.7); g.col(SKINS[0]); g.taper(xm, 0, 0.3, 0.3, 0.3, 0.3, 3.75, 4.5);
  g.kind(1, 0, 0.3, 1).col([0.8, 0.8, 0.8]); g.taper(xl, 0, 1.04, 1.04, 0.34, 0.26, 0, 3.4); g.kind(2, 0, 0.2).col([1, 1, 1]); g.taper(xl, 0, 0.3, 0.3, 0.2, 0.3, 3.45, 4.9);
  return actorGeometry(g);
}
// a player of the orchestra: seated, a fiddle under the chin, the bow arm (aux.w = 1) drawn with all the others
export function playerGeometry(v = 0) {
  const g = new Geo(), sk = SKINS[v % 3], hr = HAIRS[(v + 1) % 4], WOOD = [0.42, 0.17, 0.06];
  g.kind(0, 0, 0.3).col(BLACK);
  g.box(-0.5, 0, 0.1, -0.08, 1.3, 0.9, { top: true }); g.box(0.08, 0, 0.1, 0.5, 1.3, 0.9, { top: true });
  g.taper(0, 0, 0.56, 0.3, 0.7, 0.36, 1.2, 2.82);
  g.kind(0, 0, 0.1).col(WHITE); g.quad([-0.16, 1.7, 0.335], [0.16, 1.7, 0.335], [0.28, 2.8, 0.37], [-0.28, 2.8, 0.37]);
  g.kind(0, 0, 0.15); g.ball(0.05, 3.24, 0.04, 0.4, 0.44, 0.42, 5, 3, (j) => (j >= 2 ? hr : sk));
  g.kind(0, 0, 0.7).col(WOOD); g.box(-1.25, 2.72, 0.2, -0.3, 2.92, 0.62, { bottom: true });
  g.kind(0, 0, 0.2, 1).col([0.8, 0.74, 0.6]); g.box(-1.5, 3.0, 0.36, 0.5, 3.07, 0.44, { bottom: true });
  g.kind(0, 0, 0.3, 1).col(BLACK); g.box(0.4, 2.3, 0.2, 0.74, 3.1, 0.56, {});
  g.kind(0, 0, 0.2).col([0.2, 0.11, 0.05]); g.box(-0.6, 0, -0.5, 0.6, 1.2, 0.1, {}); g.box(-0.6, 1.2, -0.5, 0.6, 2.5, -0.38, {});
  return actorGeometry(g);
}
// a monkey of the jazz band, 3.4 m, in a red waistcoat with a brass horn or a drum; the tail and the horn (aux.w = 1) swing
export function monkeyGeometry(v = 0) {
  const g = new Geo(), FUR = [0.2, 0.11, 0.05], FACE = [0.5, 0.34, 0.2], RED = [0.55, 0.03, 0.06], BRASS = [0.9, 0.6, 0.16];
  g.kind(0, 0, 0.1).col(FUR);
  g.ball(0, 1.35, 0, 0.72, 0.95, 0.62, 6, 3); g.box(-0.5, 0, -0.2, -0.14, 0.9, 0.3, { top: false }); g.box(0.14, 0, -0.2, 0.5, 0.9, 0.3, { top: false });
  g.ball(0, 2.75, 0.05, 0.56, 0.54, 0.52, 6, 3); g.col(FACE); g.ball(0, 2.62, 0.42, 0.32, 0.28, 0.26, 5, 2);
  g.col(FUR); g.cbox(-0.6, 2.75, 0.02, 0.24, 0.34, 0.12, {}); g.cbox(0.6, 2.75, 0.02, 0.24, 0.34, 0.12, {});
  g.kind(0, 0, 0.35).col(RED); g.taper(0, 0, 0.6, 0.5, 0.66, 0.52, 1.3, 2.25, false);
  g.kind(0, 0, 0.1, 1).col(FUR);
  g.tube([[0, 0.9, -0.5], [0, 1.0, -1.2], [0.2, 1.8, -1.7], [0.3, 2.9, -1.5], [0.2, 3.3, -1.0]], 0.11, 4, 0.06);
  g.box(-0.95, 1.7, 0.0, -0.66, 2.0, 1.0, { bottom: true }); g.box(0.66, 1.7, 0.0, 0.95, 2.0, 1.0, { bottom: true });
  if (v % 3 === 2) { g.kind(0, 0, 0.3, 0).col([0.85, 0.82, 0.74]); g.lathe(0, 0.5, 1.5, [[0.8, 0], [0.8, 0.9]], 8); g.col(RED); g.lathe(0, 0.5, 1.5, [[0.84, 0.9], [0.84, 1.02], [0.01, 1.03]], 8); }
  else { g.kind(0, 0, 0.9, 1).col(BRASS); g.at(M4(0, 2.35, 0.55, 0, 1).multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2 - 0.25 * (v % 3)))); g.lathe(0, 0, 0, [[0.07, 0], [0.09, 0.9], [0.2, 1.3], [0.52, 1.55]], 6); g.at(null); }
  return actorGeometry(g);
}

// ---------------------------------------------------------------- every seeded stream of the world, taken once, in one list
// Each is its own named stream of the visit's seed and draws out of no other; a piece draws only out of its own.
// ('chand' the stair's chandeliers, 'chand2' the ballroom's; 'columns' the nave's, 'columns3' the far bay's, 'gcols' the
// winter garden's; 'hall' the tall clock's pendulum; 'cat' the cat's head; 'beds' the garden's flowers; 'frames' the
// gilded chambers' flowers; 'facade' the tall house's front; 'facing' each parrot's own bearing; 'stop' the phase of
// the rare stop)
export const STREAMS = ['guests', 'chand', 'chand2', 'hall', 'roofs', 'chimneys', 'wires', 'windows', 'trees', 'ferns', 'lianas', 'leaves', 'parrots', 'dancers', 'orch', 'monkeys',
  'roses', 'camellias', 'tulips', 'facing', 'fountains', 'butterflies', 'falling', 'room', 'sky', 'columns', 'columns3', 'gcols', 'bubbles', 'cat', 'stop', 'smoke', 'petals', 'beds', 'frames', 'facade'];
export function ballStreams(seed) { const R = {}; for (const n of STREAMS) R[n] = own(n, seed); return R; }

// (the half width of the flat's doorway: what the stair hall's arch posts leave clear; the height of a pool's kerb, the
// wine standing 0.45 m under its cap)
const DOORX = 3.9, POOLKERB = 1.5, POOLY = POOLKERB - 0.45;
const CARPET = [0.46, 0.022, 0.05], STONE = [0.6, 0.53, 0.42], GILT = [0.92, 0.62, 0.2], DARKWALL = [0.1, 0.055, 0.06], CANDLE = [1.0, 0.72, 0.36];
// a candle stand of gilt with five candles; pushes its flames (in the hall's frame) onto the list
function candelabrum(g, x, y, z, s, flames, phase) {
  g.kind(4, 0, 0.8).col(GILT);
  g.lathe(x, y, z, [[0.5 * s, 0], [0.16 * s, 0.25 * s], [0.1 * s, 1.5 * s], [0.3 * s, 1.75 * s], [0.08 * s, 1.95 * s]], 6);
  for (let k = 0; k < 5; k++) {
    const a = k * Math.PI / 2 + 0.6, r = k === 4 ? 0 : 0.95 * s, cx = x + Math.cos(a) * r, cz = z + Math.sin(a) * r, top = y + (k === 4 ? 2.75 : 2.3) * s;
    if (k < 4) { g.kind(4, 0, 0.8).col(GILT); g.quad([x, y + 1.6 * s, z], [cx, y + 1.9 * s, cz], [cx, y + 2.0 * s, cz], [x, y + 1.78 * s, z]); g.quad([cx, y + 1.9 * s, cz], [x, y + 1.6 * s, z], [x, y + 1.78 * s, z], [cx, y + 2.0 * s, cz]); }
    g.kind(0, 0.25, 0.2).col([0.9, 0.84, 0.7]); g.cbox(cx, top - 0.75 * s, cz, 0.16 * s, 0.75 * s, 0.16 * s, { top: true });
    flames.push({ p: [cx, top + 0.22 * s, cz], size: 0.62 * s, c: mulc(CANDLE, 3.2), kind: 0, phase: (phase * 0.37 + k * 0.21) % 1 });
  }
  flames.push({ p: [x, y + 2.6 * s, z], size: 7 * s, c: mulc(CANDLE, 0.3), kind: 1, phase: (phase * 0.61) % 1, what: 'candle stand' });
}
// a chandelier of gilt hoops and candles hanging by its chain; its flames are part of its own shape, so that it can sway
export function chandelierGeometry(R = 4.4, drop = 34) {
  const g = new Geo();
  g.kind(4, 0, 0.85).col(GILT);
  g.tube([[0, 0, 0], [0, drop, 0]], 0.09, 4);
  g.lathe(0, 0, 0, [[0.05, -1.4], [0.5, -0.9], [0.22, 0], [0.5, 1.2], [0.2, 2.6], [0.6, 4.2], [0.12, 5.4]], 6);
  for (const [rr, yy, n] of [[R, 0.6, 12], [R * 0.62, 2.9, 8]]) {
    g.kind(4, 0, 0.85).col(GILT);
    g.lathe(0, yy, 0, [[rr - 0.1, -0.08], [rr + 0.1, -0.08], [rr + 0.1, 0.1], [rr - 0.1, 0.1], [rr - 0.1, -0.08]], 16);
    for (let k = 0; k < n; k++) {
      const a = (k + 0.5 * (n === 8 ? 1 : 0)) / n * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
      if (k % 2 === 0) { g.kind(4, 0, 0.85).col(GILT); g.quad([c * 0.3, yy + 1.0, s * 0.3], [c * rr, yy, s * rr], [c * rr, yy + 0.12, s * rr], [c * 0.3, yy + 1.14, s * 0.3]); g.quad([c * rr, yy, s * rr], [c * 0.3, yy + 1.0, s * 0.3], [c * 0.3, yy + 1.14, s * 0.3], [c * rr, yy + 0.12, s * rr]); }
      g.kind(0, 0.3, 0.2).col([0.9, 0.84, 0.7]); g.cbox(c * rr, yy + 0.1, s * rr, 0.16, 0.7, 0.16, {});
      g.kind(0, 7, 0).col(CANDLE); g.lathe(c * rr, yy + 0.84, s * rr, [[0.01, 0], [0.12, 0.16], [0.01, 0.52]], 4);
      g.kind(0, 1.6, 0.9).col([1, 0.92, 0.78]); g.lathe(c * rr, yy - 0.75, s * rr, [[0.01, 0], [0.13, 0.22], [0.01, 0.6]], 4);
    }
  }
  return g.build();
}

// ---------------------------------------------------------------- THE STAIR (frame F1)
// Flights of 24 steps and landings under a carpet, parapets with a candle post at every flight's head, middle and foot,
// chandeliers over the landings, dark walls of arched mirrors far out either side, the great landing with its tall
// doorway, and the fireplace at the foot.
export async function buildStair(ctx, plan, zone, R, o = {}) {
  const group = new THREE.Group(), mat = litMaterial(zone), flames = [], H = ST.HALF, W = ST.WALL, CW = 9.5;
  const flights = [];
  for (let i = 0; i < ST.NF; i++) flights.push({ zr: i < 3 ? ST.HEAD + i * ST.MOD : ST.G1 + (i - 3) * ST.MOD, y: -i * ST.DROP });
  const strip = (g, zr0, zr1, y, x0, x1) => g.quad([x0, y, -zr0], [x1, y, -zr0], [x1, y, -zr1], [x0, y, -zr1]);
  const floorAt = (g, zr0, zr1, y, wide) => {
    g.kind(2, 0, 0.05, CW).col(CARPET); strip(g, zr0, zr1, y, -CW, CW);
    g.kind(3, 0, 0.35).col(STONE); strip(g, zr0, zr1, y, -(wide || H), -CW); strip(g, zr0, zr1, y, CW, wide || H);
  };
  // steps and landings
  let g = new Geo();
  floorAt(g, 0, ST.HEAD, 0, W);
  for (let i = 0; i < ST.NF; i++) {
    const f = flights[i];
    for (let k = 0; k < ST.RUN; k++) {
      const y = f.y - ST.RISE * (k + 1), zr = f.zr + k;
      for (const [x0, x1, carpet] of [[-H, -CW, 0], [-CW, CW, 1], [CW, H, 0]]) {
        if (carpet) g.kind(2, 0, 0.05, CW).col(CARPET, 0.8); else g.kind(3, 0, 0.35).col(STONE, 0.8);
        g.quad([x1, y, -zr], [x0, y, -zr], [x0, y + ST.RISE, -zr], [x1, y + ST.RISE, -zr]);
        if (carpet) g.col(CARPET); else g.col(STONE);
        if (k < ST.RUN - 1) strip(g, zr, zr + 1, y, x0, x1);
      }
    }
    const l0 = f.zr + ST.RUN - 1, l1 = i === 2 ? ST.G1 : i === ST.NF - 1 ? ST.FOOT + 30 : f.zr + ST.MOD;
    floorAt(g, l0, l1, f.y - ST.DROP, i === 2 || i === ST.NF - 1 ? W : H);
    if (i % 2 === 1) await ctx.yield();
  }
  // the runner across the great landing to the tall doorway (the side the visitor leaves by: +x in this frame)
  g.kind(2, 0, 0.05, 0).col(CARPET, 0.9); g.quad([CW, ST.GY + 0.03, -ST.DOOR + 6], [W + 4, ST.GY + 0.03, -ST.DOOR + 6], [W + 4, ST.GY + 0.03, -ST.DOOR - 6], [CW, ST.GY + 0.03, -ST.DOOR - 6]);
  group.add(new THREE.Mesh(await g.buildA(ctx), mat));
  await ctx.yield();
  // parapets and candle posts
  g = new Geo();
  const post = (x, zr, y, i) => {
    g.kind(3, 0, 0.3).col(STONE, 0.92); g.cbox(x, y - 0.6, -zr, 1.5, 5.4, 1.5, {}); g.col(STONE, 1.05); g.cbox(x, y + 4.8, -zr, 1.9, 0.4, 1.9, {});
    candelabrum(g, x, y + 5.2, -zr, 1.25, flames, i * 0.137 + (x > 0 ? 0.5 : 0));
  };
  const rail = (x, zr0, y0, zr1, y1) => {
    const t = 0.45, h = 2.5; g.kind(3, 0, 0.3).col(STONE, 0.85);
    for (const sx of [-1, 1]) { const xx = x + sx * t; const a = [xx, y0 - 0.6, -zr0], b = [xx, y1 - 0.6, -zr1], c = [xx, y1 + h, -zr1], d = [xx, y0 + h, -zr0]; if (sx > 0) g.quad(a, b, c, d); else g.quad(b, a, d, c); }
    g.col(STONE, 1.08); g.quad([x - t - 0.15, y0 + h, -zr0], [x + t + 0.15, y0 + h, -zr0], [x + t + 0.15, y1 + h, -zr1], [x - t - 0.15, y1 + h, -zr1]);
  };
  let pi = 0;
  for (let i = 0; i < ST.NF; i++) {
    const f = flights[i], yb = f.y - ST.DROP;
    for (const sx of [-1, 1]) {
      rail(sx * H, f.zr, f.y, f.zr + ST.RUN, yb);
      post(sx * H, f.zr, f.y, pi++); post(sx * H, f.zr + ST.RUN / 2, f.y - ST.DROP / 2, pi++); post(sx * H, f.zr + ST.RUN, yb, pi++);
      if (i !== 2 && i !== ST.NF - 1) rail(sx * H, f.zr + ST.RUN, yb, f.zr + ST.MOD, yb);
    }
    await ctx.yield();
  }
  for (const sx of [-1, 1]) { rail(sx * H, 0, 0, ST.HEAD, 0); post(sx * H, 8, 0, pi++); }
  group.add(new THREE.Mesh(await g.buildA(ctx), mat));
  await ctx.yield();
  await stairWalls(ctx, plan, group, mat, flames, flights);
  return { group, mat, flames, flights };
}
// the walls of the stair's hall: far out either side, stepping down with the flights; a pilaster and an arched mirror with
// two sconces to every flight; the tall doorway of the great landing; the head wall with the flat's small door between
// two tall arches the guests leave by; the fireplace at the foot
// THE SHELL ABOUT THE STAIR'S HEAD (the head wall above and beside the hallway, and the side walls of the first 82 m)
// is a group of its own, 'stair shell near': it is wider and higher than the tall house the hallway lies in, so from
// over the roofs it stood out past the house's side and over its roof as a black slab. It can be seen only out of
// the stair's hall or the hallway (through the flat's door from the window's plane a side wall shows only 265 m down
// the stair, the head wall never), so it is drawn while the eye is inside the window's plane and not before. Said as
// it is: over the roofs it WOULD be in view if it were drawn (the hall is larger than the house), and it is left
// undrawn there by where the route's point is, not by what can be seen.
async function stairWalls(ctx, plan, group, mat, flames, flights) {
  const W = ST.WALL, MIRROR = [0.5, 0.36, 0.16], near = new THREE.Group(); near.name = 'stair shell near'; group.add(near);
  let g = new Geo();
  const arch = (x, zc, y0, w, h, sx, glow) => {
    // an arched panel on the wall x = const, facing the stair (sx = -1: the wall at +x faces -x)
    const P = (u, y) => [x, y0 + y, zc + u * sx], n = 7;
    g.quad(P(-w / 2, 0), P(w / 2, 0), P(w / 2, h), P(-w / 2, h));
    for (let k = 0; k < n; k++) { const a0 = Math.PI * k / n, a1 = Math.PI * (k + 1) / n; g.tri(P(0, h), P(Math.cos(a0) * w / 2, h + Math.sin(a0) * w / 2), P(Math.cos(a1) * w / 2, h + Math.sin(a1) * w / 2)); }
  };
  const bayWall = (zr0, zr1, yFloor, door) => {
    for (const sx of [-1, 1]) {
      const x = sx * W, zc = -(zr0 + zr1) / 2, len = zr1 - zr0, isDoor = door && sx > 0;
      g.kind(0, 0, 0.1).col(DARKWALL);
      const a = [x, yFloor - 14, -zr0], b = [x, yFloor - 14, -zr1], c = [x, yFloor + 74, -zr1], d = [x, yFloor + 74, -zr0];
      if (!isDoor) { if (sx > 0) g.quad(b, a, d, c); else g.quad(a, b, c, d); }
      else {
        // the wall round the tall doorway (16 m wide, 30 m to the spring of its arch)
        const z0 = -ST.DOOR + 8, z1 = -ST.DOOR - 8;
        g.quad([x, yFloor - 14, z0], a, d, [x, yFloor + 74, z0]); g.quad(b, [x, yFloor - 14, z1], [x, yFloor + 74, z1], c);
        g.quad([x, yFloor + 38, z1], [x, yFloor + 38, z0], [x, yFloor + 74, z0], [x, yFloor + 74, z1]);
        for (let k = 0; k < 8; k++) { const a0 = Math.PI * k / 8, a1 = Math.PI * (k + 1) / 8, A = (aa) => [x, yFloor + 30 + Math.sin(aa) * 8, -ST.DOOR + Math.cos(aa) * 8], T = (aa) => [x, yFloor + 38, -ST.DOOR + Math.cos(aa) * 8]; g.quad(A(a0), A(a1), T(a1), T(a0)); }
        g.kind(4, 0, 0.8).col(GILT);
        for (const zz of [z0 + 0.6, z1 - 0.6]) g.cbox(x - 0.5, yFloor, zz, 1.6, 30, 1.6, {});
      }
      g.kind(4, 0, 0.7).col(GILT, 0.8);
      for (const zz of [-zr0 - 0.01, -zr1 + 0.01]) g.cbox(x - sx * 0.7, yFloor - 2, zz, 1.4, 44, 2.4, {});
      if (!isDoor) {
        g.kind(4, 0, 0.8).col(GILT); arch(x - sx * 0.3, zc, yFloor + 3, Math.min(len * 0.5, 13), 20, -sx);
        g.kind(0, 0.34, 0.9).col(MIRROR); arch(x - sx * 0.45, zc, yFloor + 3.8, Math.min(len * 0.5, 13) - 1.6, 19.2, -sx);
        for (const dz of [-1, 1]) flames.push({ p: [x - sx * 2.2, yFloor + 12, zc + dz * (Math.min(len * 0.5, 13) / 2 + 2.6)], size: 1.5, c: mulc(CANDLE, 3), kind: 0, phase: (zr0 * 0.013 + dz * 0.2 + 0.5) % 1 });
        for (const dz of [-1, 1]) flames.push({ p: [x - sx * 2.2, yFloor + 12, zc + dz * (Math.min(len * 0.5, 13) / 2 + 2.6)], size: 9, c: mulc(CANDLE, 0.22), kind: 1, phase: (zr0 * 0.017 + dz * 0.2 + 0.5) % 1, what: 'sconce of the stair' });
      }
    }
  };
  bayWall(0, ST.HEAD, 0);
  for (let i = 0; i < ST.NF; i++) {
    const f = flights[i], yb = f.y - ST.DROP;
    bayWall(f.zr, f.zr + ST.RUN, f.y - ST.DROP / 2);
    if (i === 1) { near.add(new THREE.Mesh(await g.buildA(ctx), mat)); g = new Geo(); }
    if (i === 2) bayWall(ST.G0, ST.G1, yb, true); else if (i < ST.NF - 1) bayWall(f.zr + ST.RUN, f.zr + ST.MOD, yb); else bayWall(ST.FOOT, ST.FOOT + 30, yb);
    if (i % 2 === 1) await ctx.yield();
  }
  group.add(new THREE.Mesh(await g.buildA(ctx), mat));
  await ctx.yield();
}

// the head wall (the flat's small door between two tall arches full of light), the hallway behind it, the fireplace
export async function buildStairEnds(ctx, plan, zone, group, mat, flames, R) {
  const W = ST.WALL, g = new Geo(), WOOD = [0.2, 0.1, 0.05], PAPER = [0.2, 0.17, 0.11];
  const rect = (x0, y0, x1, y1, z) => g.quad([x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z]);
  // head wall at z = 0, seen out of the stair's hall. What of it stands beside and over the hallway's own end (and so
  // outside the tall house's roof and sides) goes with the stair's near shell; the hallway's end about the door stays
  const gn = new Geo(), rectN = (x0, y0, x1, y1, z) => gn.quad([x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z]), HEADY = 12.6;
  gn.kind(0, 0, 0.1).col(DARKWALL, 1.3);
  rectN(-W, -2, -19.6, 74, 0); rectN(19.6, -2, W, 74, 0); rectN(-5, HEADY, 5, 74, 0);
  g.kind(0, 0, 0.1).col(DARKWALL, 1.3);
  rect(-5, 0, -DOORX, HEADY, 0); rect(DOORX, 0, 5, HEADY, 0); rect(-DOORX, 11, DOORX, HEADY, 0);
  for (const sx of [-1, 1]) {
    const cx = sx * 12.3, r = 7.3;
    for (let k = 0; k < 8; k++) { const a0 = Math.PI * k / 8, a1 = Math.PI * (k + 1) / 8, A = (a) => [cx + Math.cos(a) * r, 20 + Math.sin(a) * r, 0], T = (a) => [cx + Math.cos(a) * r, 28, 0]; gn.quad(A(a0), A(a1), T(a1), T(a0)); }
    rectN(cx - r, 28, cx + r, 74, 0);
    g.kind(4, 0, 0.8).col(GILT); for (const xx of [cx - r - 0.5, cx + r + 0.5]) g.cbox(xx, 0, -0.6, 1.2, 20, 1.2, {});
    g.kind(0, 2.4, 0).col([1, 0.74, 0.36]); rect(cx - r, 0, cx + r, 28, 9);
    g.kind(3, 0, 0.3).col(STONE, 0.7); g.quad([cx - r, 0, 0], [cx + r, 0, 0], [cx + r, 0, 9], [cx - r, 0, 9]);
    g.kind(0, 0, 0.1).col(DARKWALL); for (const xx of [cx - r, cx + r]) g.quad([xx, 0, 0], [xx, 0, 9], [xx, 28, 9], [xx, 28, 0]);
  }
  // the doorway of the flat: as wide as the stair hall's arch posts leave it (DOORX to either hand), a gilt lintel over
  // it and a gilt architrave on the hallway's side
  g.kind(4, 0, 0.8).col(GILT); g.box(-4.4, 11, -0.5, 4.4, 12, 0.3, {});
  for (const sx of [-1, 1]) g.box(Math.min(sx * DOORX, sx * 4.4), 0, 0, Math.max(sx * DOORX, sx * 4.4), 11, 0.3, {});
  // the door's two leaves stand wide open, flat along the hallway's walls: polished wood in three tiers of raised panels,
  // every panel in a gilt bead with a gilt boss at its middle, a gilt handle; the stair hall's light lies on them
  for (const sx of [-1, 1]) {
    const xo = sx * (DOORX + 0.38), xi = sx * (DOORX + 0.08), X = (t) => xi - sx * t, bx = (t0, y0, z0, t1, y1, z1) => g.box(Math.min(X(t0), X(t1)), y0, z0, Math.max(X(t0), X(t1)), y1, z1, {});
    g.kind(9, 0, 0.6).col(WOOD, 2.3); g.box(Math.min(xo, xi), 0, 0.3, Math.max(xo, xi), 10.9, 0.3 + DOORX, {});
    for (const [y0, y1] of [[0.7, 2.9], [3.5, 7.3], [7.9, 10.3]]) for (const [z0, z1] of [[0.75, 2.05], [2.45, 3.75]]) {
      g.kind(9, 0, 0.6).col(WOOD, 3.0); bx(0, y0, z0, 0.07, y1, z1);
      g.kind(4, 0.06, 0.9).col(GILT, 1.1);
      bx(0, y0 - 0.12, z0 - 0.12, 0.1, y0, z1 + 0.12); bx(0, y1, z0 - 0.12, 0.1, y1 + 0.12, z1 + 0.12); bx(0, y0, z0 - 0.12, 0.1, y1, z0); bx(0, y0, z1, 0.1, y1, z1 + 0.12);
      bx(0.07, (y0 + y1) / 2 - 0.22, (z0 + z1) / 2 - 0.22, 0.13, (y0 + y1) / 2 + 0.22, (z0 + z1) / 2 + 0.22);
    }
    g.kind(4, 0.06, 0.9).col(GILT, 1.1); bx(0, 5.0, 0.3 + DOORX - 0.5, 0.3, 5.5, 0.3 + DOORX - 0.2);
  }
  // the hallway: planks, a worn runner, papered walls over a wainscot, doors, a coat stand, a looking glass, a small lamp
  const L = ST.HALL, HW = 4.5, HH = 12.5;
  g.kind(9, 0, 0.3).col(WOOD); g.quad([-HW, 0, L], [HW, 0, L], [HW, 0, 0], [-HW, 0, 0]);
  g.kind(2, 0, 0.05, 2.2).col([0.2, 0.07, 0.05]); g.quad([-2.2, 0.04, L - 3], [2.2, 0.04, L - 3], [2.2, 0.04, 2], [-2.2, 0.04, 2]);
  g.kind(0, 0, 0.05).col([0.26, 0.24, 0.2]); g.quad([-HW, HH, 0], [HW, HH, 0], [HW, HH, L], [-HW, HH, L]);
  for (const sx of [-1, 1]) {
    const x = sx * HW;
    g.kind(6, 0, 0.05).col(PAPER); g.quad([x, 3.6, 0], [x, 3.6, L], [x, HH, L], [x, HH, 0]);
    g.kind(9, 0, 0.3).col(WOOD, 1.1); g.quad([x, 0, 0], [x, 0, L], [x, 3.6, L], [x, 3.6, 0]); g.box(Math.min(x, x - sx * 0.2), 3.5, 0, Math.max(x, x - sx * 0.2), 3.8, L, {});
    for (const zc of sx > 0 ? [12, 33] : [22]) {
      g.kind(9, 0, 0.4).col(WOOD, 1.7); g.box(Math.min(x - sx * 0.12, x), 0, zc - 2, Math.max(x - sx * 0.12, x), 8.6, zc + 2, {});
      g.col(WOOD, 1.2); g.box(Math.min(x - sx * 0.2, x), 0, zc - 2.4, Math.max(x - sx * 0.2, x), 9, zc - 2, {}); g.box(Math.min(x - sx * 0.2, x), 0, zc + 2, Math.max(x - sx * 0.2, x), 9, zc + 2.4, {});
      g.kind(4, 0, 0.9).col(GILT); g.cbox(x - sx * 0.3, 4.2, zc + 1.5, 0.3, 0.3, 0.3, {});
      // (each door of the hallway is panelled: two raised panels over a lock rail, a shade darker in their beads)
      for (const [ya, yb] of [[0.7, 3.7], [4.7, 8.0]]) {
        g.kind(9, 0, 0.4).col(WOOD, 1.25); g.box(Math.min(x - sx * 0.15, x), ya, zc - 1.5, Math.max(x - sx * 0.15, x), yb, zc + 1.5, {});
        g.col(WOOD, 1.9); g.box(Math.min(x - sx * 0.18, x), ya + 0.3, zc - 1.2, Math.max(x - sx * 0.18, x), yb - 0.3, zc + 1.2, {});
      }
    }
  }
  // window wall (the way in): the opening is 6.2 wide, 10 high, its middle at the line's height
  g.kind(6, 0, 0.05).col(PAPER);
  rect(HW, 0, 3.1, HH, L); rect(-3.1, 0, -HW, HH, L); rect(3.1, 0, -3.1, 1.4, L); rect(3.1, 11.4, -3.1, HH, L);
  g.kind(9, 0, 0.4).col([0.5, 0.46, 0.38]); g.box(-3.5, 1.0, L - 0.9, 3.5, 1.4, L + 0.4, {});
  // coat stand with coats and hats, a looking glass, a chest with the small lamp
  const cs = -3.4, cz = 36;
  g.kind(9, 0, 0.4).col(WOOD, 1.4); g.cbox(cs, 0, cz, 0.3, 8.2, 0.3, {}); g.cbox(cs, 0, cz, 1.6, 0.3, 1.6, {}); g.box(cs - 0.1, 7.4, cz - 1.4, cs + 0.1, 7.6, cz + 1.4, {});
  const coats = [[0.07, 0.07, 0.09], [0.2, 0.13, 0.08], [0.1, 0.12, 0.2]];
  for (let k = 0; k < 3; k++) { g.kind(0, 0, 0.15).col(coats[k]); g.taper(cs + 0.35, cz - 1.1 + k * 1.1, 0.3, 0.42, 0.26, 0.34, 2.6 + 0.3 * (k % 2), 7.3); g.col(mulc(coats[(k + 1) % 3], 0.8)); g.lathe(cs + 0.2, 8.2, cz - 1.1 + k * 1.1, [[0.62, 0], [0.6, 0.08], [0.34, 0.1], [0.3, 0.5], [0.01, 0.56]], 7); }
  g.kind(4, 0, 0.8).col(GILT, 0.8); g.box(HW - 0.25, 4.6, 24.5, HW - 0.05, 10.2, 28.5, {}); g.kind(17, 0, 0.9).col([0.5, 0.56, 0.7]); g.box(HW - 0.3, 5.0, 24.9, HW - 0.2, 9.8, 28.1, {});
  g.kind(9, 0, 0.45).col(WOOD, 1.6); g.box(-HW + 0.1, 0, 27.6, -HW + 1.9, 3.4, 31.6, {});
  g.kind(4, 0, 0.8).col(GILT); g.lathe(-3.4, 3.4, 29.6, [[0.4, 0], [0.12, 0.2], [0.1, 1.2]], 6);
  g.kind(0, 2.6, 0.2).col([1, 0.66, 0.3]); g.lathe(-3.4, 4.5, 29.6, [[0.75, 0], [0.42, 0.9]], 8);
  flames.push({ p: [-3.4, 5.0, 29.6], size: 5, c: mulc(CANDLE, 0.5), kind: 1, phase: 0.3, what: 'hallway lamp' });
  // two long curtains inside the open window, carried in by the draught and stirring (the heavier toward the hem)
  // (the lace is a soft grey-cream with deep folds, so that close by it hangs in folds and is no bright pane)
  const gw = new Geo(), LACE = [0.5, 0.48, 0.42];
  for (const sx of [-1, 1]) {
    const rows = [];
    for (let j = 0; j <= 8; j++) {
      const t = j / 8, y = 11.9 - t * 10.6, z = L - 0.45 - 2.5 * t * t, row = [];
      for (let i = 0; i <= 3; i++) { gw.a = [0, 0, 0.08, 1.2 * t]; row.push(gw.v(sx * (3.25 + 0.2 * t + i * 0.38 + 0.12 * Math.sin(i * 2.1 + j * 0.9)), y, z + 0.14 * Math.cos(i * 2.6), 0, 0, -1, mulc(LACE, 0.62 + 0.38 * (i % 2)))); }
      rows.push(row);
    }
    for (let j = 0; j < 8; j++) for (let i = 0; i < 3; i++) gw.I.push(rows[j][i], rows[j][i + 1], rows[j + 1][i + 1], rows[j][i], rows[j + 1][i + 1], rows[j + 1][i]);
    gw.kind(4, 0, 0.8).col(GILT, 0.8); gw.box(Math.min(sx * 3.1, sx * 4.5), 11.9, L - 0.7, Math.max(sx * 3.1, sx * 4.5), 12.15, L - 0.3, {});
  }
  group.add(new THREE.Mesh(gw.build(), litMaterial(zone, { wind: true })));
  await ctx.yield();
  // the fireplace at the foot: a black mouth 44 m wide, 34 m high in a wall of pale stone, a mantel with candle stands
  const zf = -ST.FIRE, y0 = ST.FOOTY;
  g.kind(3, 0, 0.3).col(STONE, 0.8);
  rect(22, y0, W, y0 + 90, zf); rect(-W, y0, -22, y0 + 90, zf); rect(22, y0 + 34, -22, y0 + 90, zf);
  g.kind(0, 0, 0).col([0.004, 0.004, 0.005]); rect(26, y0, -26, y0 + 36, zf - 26); for (const xx of [-22, 22]) g.quad([xx, y0, zf], [xx, y0, zf - 26], [xx, y0 + 36, zf - 26], [xx, y0 + 36, zf]);
  g.quad([-22, y0 + 34, zf], [22, y0 + 34, zf], [22, y0 + 34, zf - 26], [-22, y0 + 34, zf - 26]); g.quad([-26, y0 + 0.02, zf], [26, y0 + 0.02, zf], [26, y0 + 0.02, zf - 26], [-26, y0 + 0.02, zf - 26]);
  g.kind(3, 0, 0.4).col(STONE, 1.15); g.box(-30, y0 + 36, zf, 30, y0 + 39.5, zf + 5, { bottom: true }); for (const xx of [-26, 26]) g.cbox(xx, y0, zf + 2, 6, 36, 4, {});
  g.kind(4, 0, 0.8).col(GILT); rect(-16, y0 + 44, 16, y0 + 78, zf + 0.6); g.kind(0, 0.3, 0.9).col([0.5, 0.36, 0.16]); rect(-14, y0 + 46, 14, y0 + 76, zf + 0.8);
  for (const xx of [-24, -12, 12, 24]) candelabrum(g, xx, y0 + 39.5, zf + 2.5, 3.2, flames, xx * 0.031 + 0.5);
  group.add(new THREE.Mesh(await g.buildA(ctx), mat));
  group.getObjectByName('stair shell near').add(new THREE.Mesh(gn.build(), mat));
  await ctx.yield();
}

// chandeliers over the stair's landings (they sway on their chains), and the river of guests
export async function buildStairLife(ctx, plan, zone, group, mat, flames, flights, R, density = 1, route = null) {
  const rc = R.chand, rg = R.guests, list = [];
  const hang = (zr, y, s) => list.push({ x: 0, y, z: -zr, s, a: rc.range(0, 6.28), w: rc.range(0.5, 0.8), p: rc.range(0, 6.28) });
  hang(ST.HEAD / 2, 22, 1);
  for (let i = 0; i < ST.NF - 1; i++) { const f = flights[i], yb = f.y - ST.DROP; if (i === 2) { hang(ST.G0 + 12, yb + 24, 1.25); hang(ST.G1 - 12, yb + 24, 1.25); } else hang(f.zr + ST.RUN + ST.LAND / 2, yb + 22, rc.range(0.9, 1.15)); }
  const cg = chandelierGeometry(4.4, 60), chand = new THREE.InstancedMesh(cg, mat, list.length), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), sv = new THREE.Vector3();
  const TOP = 60;
  const sway = (time) => {
    for (let i = 0; i < list.length; i++) {
      const c = list[i], ax = Math.sin(time * c.w + c.p) * 0.012, az = Math.cos(time * c.w * 0.83 + c.p * 1.7) * 0.012;
      e.set(ax, c.a, az); q.setFromEuler(e);
      // it turns about the top of its chain
      v.set(0, -TOP * c.s, 0).applyQuaternion(q); v.x += c.x; v.y += c.y + TOP * c.s; v.z += c.z;
      chand.setMatrixAt(i, m4.compose(v, q, sv.set(c.s, c.s, c.s)));
    }
    chand.instanceMatrix.needsUpdate = true;
  };
  sway(0); chand.frustumCulled = false; group.add(chand);
  await ctx.yield();
  // (each chandelier's halo stands over its upper hoop, clear of the line's height below)
  for (const c of list) flames.push({ p: [c.x, c.y + 3.2 * c.s, c.z], size: 26 * c.s, c: mulc(CANDLE, 0.34), kind: 1, phase: c.p / 6.3, what: 'halo of a stair chandelier' });
  // guests: pairs in three lanes either hand, an even pitch along each lane. THE LANES ARE LAID BY THE STAIR'S OWN WIDTH:
  // between the inner face of the arch's inner post at the head wall (5.1 m) and the inner face of the candle posts'
  // caps (19.05 m; the arch's outer post stands at 19.5), each lane a pair's half width at its largest (the make's
  // 1.8 m at the largest size, its step aside and its sway) and a hand's clearance in from either, the middle lane
  // midway. Near the head full figures, far down plain ones: ONE PAIR IS ONE DEAL (gown, size, step aside, phase) for
  // its near figure and its far ones. The near round is CYC metres long and the far round twice that, each holding
  // whole pitches, and the far round ends where the near one begins: so a plain figure is changed for the full one of
  // the same gown and size at one place of the stair (zB), at the same instant, every round. (Two plain figures, a
  // near round apart, share each deal.) The far round begins in the fireplace's mouth.
  const PAIRW = PAIR_HALF * 1.07 + 0.1 + 0.1, HAND = 0.25, laneLo = 5.1 + PAIRW + HAND, laneHi = 19.05 - PAIRW - HAND, LANES = [laneLo, (laneLo + laneHi) / 2, laneHi];
  const CYC = (ST.FIRE + 8) / 3, CYC2 = 2 * CYC, nPer = Math.round(CYC / (5.85 / Math.pow(density, 0.8))), D = CYC / nPer, zB = CYC - 8;
  const GOWNS = ['#ffffff', '#f6a6c0', '#c2183a', '#ffd98a', '#8a4bff', '#e8f0ff', '#1f6a52', '#28306e', '#f1e3c8'].map(lin);
  const near = [[], []], nearB = [[], []], far = [], farB = [];
  for (let l = 0; l < 6; l++) {
    const x = (l < 3 ? -1 : 1) * LANES[l % 3], sp = rg.range(1.9, 2.3), ph = rg.range(0, D);
    for (let j = 0; j < nPer; j++) {
      const col = rg.pick(GOWNS), sc = rg.range(0.93, 1.07), jx = rg.range(-0.1, 0.1), p = rg();
      const k = rg.chance(0.5) ? 0 : 1;
      near[k].push(x + jx, j * D + ph, sp, p); nearB[k].push(col[0], col[1], col[2], sc);
      for (const jj of [j, j + nPer]) { far.push(x + jx, jj * D + ph, sp, p); farB.push(col[0], col[1], col[2], sc); }
    }
    if (l % 2) await ctx.yield();
  }
  await ctx.yield();
  const out = [];
  for (let k = 0; k < 2; k++) { out.push(makeActors(zone, pairGeometry('walk', k), 0, new Float32Array(near[k]), new Float32Array(nearB[k]), { cyc: [zB, CYC, 0, 1], shade: [2.0, 0.55] })); await ctx.yield(); }
  out.push(makeActors(zone, farPairGeometry(), 0, new Float32Array(far), new Float32Array(farB), { cyc: [zB + CYC2, CYC2, 1, 0], shade: [2.0, 0.55] }));
  for (const a of out) { a.mesh.frustumCulled = false; a.mesh.name = 'guests'; group.add(a.mesh); a.shade.name = 'shade'; group.add(a.shade); }
  // against the line: every lane along its whole length (a pair with its plumes, its sway and its widest), every chandelier
  if (route) {
    for (const sx of [-1, 1]) for (const x of LANES) { for (let zr = 0; zr < ST.G1 + 40; zr += 1) route.f1.note('guests on the stair', sx * x, stairY(zr), stairY(zr) + 5.3 * 1.07 + 0.3, -zr, PAIRW); await ctx.yield(); }
    for (const c of list) route.f1.note('chandelier of the stair', c.x, c.y - 1.5 * c.s, c.y + TOP * c.s, c.z, 4.6 * c.s + 0.8);
    for (const f of flights) for (const sx of [-1, 1]) for (const dz of [0, ST.RUN / 2, ST.RUN]) route.f1.note('candle post', sx * ST.HALF, f.y - ST.DROP, f.y + 9, -(f.zr + dz), 1.7);
    route.f1.noteBox('hallway walls', 4.5, 0, 0, 5, 12.5, ST.HALL); route.f1.noteBox('hallway ceiling', -4.5, 12.5, 0, 4.5, 13, ST.HALL);
    route.f1.noteBox('door of the flat (jamb and leaf)', DOORX - 0.07, 0, -0.5, 4.4, 11, 0.4 + DOORX); route.f1.noteBox('door of the flat (lintel)', -DOORX, 11, -0.5, DOORX, 12, 0.3);
    route.f1.noteBox('window (jamb)', 3.1, 0, ST.HALL - 0.2, 4.5, 12.5, ST.HALL + 0.4); route.f1.noteBox('window (sill)', -3.1, 0, ST.HALL - 0.9, 3.1, 1.4, ST.HALL + 0.4); route.f1.noteBox('window (head)', -3.1, 11.4, ST.HALL - 0.2, 3.1, 12.5, ST.HALL + 0.4);
    for (const sx of [-1, 1]) route.f1.noteBox('curtain at its fullest', Math.min(sx * 2.6, sx * 4.5), 0.6, ST.HALL - 3.7, Math.max(sx * 2.6, sx * 4.5), 12.2, ST.HALL);
    route.f1.noteBox('coat stand', -4.2, 0, 34.5, -2.6, 8.8, 37.5); route.f1.noteBox('chest and lamp', -4.4, 0, 27.6, -2.6, 5.5, 31.6);
    route.f1.noteBox('tall doorway (jamb)', ST.WALL - 1.4, ST.GY, -ST.DOOR + 8, ST.WALL + 1, ST.GY + 38, -ST.DOOR + 9.5); route.f1.noteBox('tall doorway (far jamb)', ST.WALL - 1.4, ST.GY, -ST.DOOR - 9.5, ST.WALL + 1, ST.GY + 38, -ST.DOOR - 8);
  }
  return { sway, chand, guests: out, count: out.reduce((n, a) => n + a.count, 0), lanes: LANES };
}

// ---------------------------------------------------------------- the hero: the stair and the ballroom
// opts: { plan, streams, density, detail }. Alone (the set-piece viewer) it draws its own plan out of ctx.seed, and the
// viewer circles the middle pool from inside the ballroom (radius, height and center are set for that).
// Returns the object (frame F1; f2 inside it), the two halls' zones, and update(dt, time): clocks, sway.
export async function buildHero(ctx, opts = {}) {
  const plan = opts.plan || ballPlan(ctx.seed), R = opts.streams || ballStreams(ctx.seed), density = opts.density ?? 1, detail = opts.detail ?? 1, rare = !!opts.rare;
  const film = opts.film || ballFilm(plan, makePath(plan.pts, { samples: 640 })), route = opts.route || makeRoute(film);
  const object = new THREE.Group(), f2 = new THREE.Group();
  f2.position.set(ST.WALL, ST.GY, -ST.DOOR); f2.rotation.y = -Math.PI / 2; object.add(f2);
  const K = ST.DROP / ST.MOD, warm = plan.hour === 'golden' ? 1 : 0;
  const gold = warm ? [1.0, 0.5, 0.18] : [1.0, 0.6, 0.25];
  // ---- the stair
  const zStair = makeZone({ ambUp: [0.085, 0.05, 0.045], ambDn: [0.05, 0.02, 0.03], fogC: [0.016, 0.009, 0.008], fogD: 0.0015 });
  zStair.line(0, -ST.HALF, 9 + K * ST.HEAD, K, 15, mulc(gold, 2.0)).line(1, ST.HALF, 9 + K * ST.HEAD, K, 15, mulc(gold, 2.0)).line(2, 0, 24 + K * ST.HEAD, K, 24, mulc(gold, 2.6));
  zStair.U.uLineP.value.set(12, 0.3, 0); zStair.U.uLineK.value.set(-ST.G1, -ST.G0, K * (ST.GREAT - ST.LAND));
  // the hallway behind the head wall is dark: the stair's lamps do not reach into it (its own small lamp, the window's
  // light and what comes through the door do)
  zStair.U.uLineZ.value.set(-2, 3);
  // what comes through the door wavers: the guests pass between the candles and the doorway
  zStair.U.uWav.value.set(1, 0.42, 0);
  zStair.point(0, -3.4, 5, 29.6, 7, mulc(gold, 1.6)).point(1, 0, 6.5, -4, 24, mulc(gold, 1.2)).point(2, 0, 7, ST.HALL + 2, 13, [0.25, 0.35, 0.6]).point(3, ST.WALL - 2, ST.GY + 14, -ST.DOOR, 26, [0.5, 0.9, 0.4]);
  const stair = await buildStair(ctx, plan, zStair, R);
  await buildStairEnds(ctx, plan, zStair, stair.group, stair.mat, stair.flames, R);
  const stairNear = stair.group.getObjectByName('stair shell near');
  const life = await buildStairLife(ctx, plan, zStair, stair.group, stair.mat, stair.flames, stair.flights, R, density, route);
  await ctx.yield();
  fitGlows(route.f1, route.best, stair.flames);
  stair.group.add(makeDabs(zStair, stair.flames).mesh);
  await ctx.yield();
  object.add(stair.group);
  // ---- the forest
  // (the winter garden: the ballroom's light slants in through the leaves from the far doorway, the stair's from the
  // near one; two rows of lanterns hang between the columns; the night stands behind the glass of the roof)
  const zForest = makeZone({ ambUp: [0.09, 0.15, 0.075], ambDn: [0.035, 0.055, 0.03], keyDir: [0, 0.42, -1], keyC: mulc(gold, 0.9), fogC: [0.045, 0.06, 0.026], fogD: 0.0038 });
  zForest.line(0, 0, 44, 0, 24, [0.4, 0.55, 0.3]).line(1, -(BALL.HW - 8.7), 22, 0, 17, mulc(gold, 1.5)).line(2, BALL.HW - 8.7, 22, 0, 17, mulc(gold, 1.5));
  zForest.point(0, 0, 12, 4, 30, mulc(gold, 1.3)).point(1, 0, 16, -(plan.forestLen + 8), 46, mulc(gold, 3.0));
  zForest.U.uVis.value.set(0.035, 0.06, 0.11, 0);
  const forest = await buildForest(ctx, plan, zForest, R, density, route);
  f2.add(forest.group);
  // ---- the ballroom
  const amb0 = warm ? [0.14, 0.07, 0.045] : [0.12, 0.08, 0.055], zBall = makeZone({ ambUp: amb0, ambDn: [0.06, 0.03, 0.04], fogC: [0.06, 0.036, 0.022], fogD: 0.0011 });
  const lineC = [mulc(gold, 1.7), mulc(gold, 0.9), mulc(gold, 0.9)];
  zBall.line(0, 0, 27, 0, 30, lineC[0]).line(1, -30, 14, 0, 18, lineC[1]).line(2, 30, 14, 0, 18, lineC[2]);
  zBall.U.uLineP.value.set(plan.colPitch, 0.22, -plan.B1);
  // THE ROOM'S OWN LIGHT, a light of place. The ball is lit from end to end; where its gilded chambers give way to the
  // papered one (plan.roomLight), by each lit point's own distance into the hall, the rows of chandeliers no longer
  // reach and the room's lamplight stands in their place: a warm gold all about, a thin warm haze, and at the room's
  // window the light of the hour inside (midnight's moon; on a dawn visit a grey first light), falling from the
  // window's hand. Nothing of it knows where the visitor is.
  const dawn = plan.hour === 'dawn', WINDOW = dawn ? [0.46, 0.5, 0.6] : [0.1, 0.14, 0.27];
  zBall.U.uGrey.value.set(plan.roomLight[0], plan.roomLight[1], 1, 0.92); zBall.U.uAmbG.value.set(0.36, 0.25, 0.132); zBall.U.uFogG.value.set(0.075, 0.048, 0.026, 0.0012);
  // (the panes of the far bay's high windows and of the room's window show that same hour)
  zBall.U.uVis.value.set(WINDOW[0] * 1.5, WINDOW[1] * 1.5, WINDOW[2] * 1.5, 0);
  // the three pools: boiling and lit from below, all three, from the first frame to the last
  const poolK = { value: new THREE.Vector3(1, 1, 1) }, POOLC = { violet: [0.5, 0.25, 1.0], ruby: [1.0, 0.1, 0.24], crystal: [0.4, 0.58, 0.7] };
  for (let k = 0; k < 3; k++) zBall.point(k, 0, POOLY + 1.4, -plan.pools[k].d, 21, mulc(POOLC[plan.pools[k].kind], 2.3));
  // (the light off the boiling pools ripples up the kerbs and the columns about them, on the ball's clock)
  zBall.U.uShim.value.set(0.34, 0);
  const bs = await buildBallStatics(ctx, plan, zBall, R, density, route), PL = bs.PL;
  const fl = await buildFlowers(ctx, plan, zBall, R, density, route);
  const bl = await buildBallLife(ctx, plan, zBall, R, density, route, PL);
  await ctx.yield();
  const air = await buildBallAir(ctx, plan, zBall, R, density, route, PL);
  await ctx.yield();
  const room = await buildRoom(ctx, plan, zBall, R, route);
  zBall.U.uKeyDir.value.set(-room.h * 0.8, 0.55, 0.2).normalize(); zBall.U.uKeyC.value.set(WINDOW[0], WINDOW[1], WINDOW[2]);
  const floor = makeFloor(zBall, plan, -ROOM.HALF * ROOM.OUTX - 1, ROOM.HALF * ROOM.OUTX + 1, plan.forestLen, plan.dEnd + 0.5), pools = makePools(zBall, plan, poolK);
  await ctx.yield();
  const jets = makeJets(zBall, jetList(plan, bs.jets, R.fountains, R.bubbles, density), poolK);
  await ctx.yield();
  const lamps = bs.flames.concat(air.glows);
  fitGlows(route.f2, route.best, lamps); fitGlows(route.f2, route.best, room.flames);
  const bDabs = makeDabs(zBall, lamps, { mirror: true }), rDabs = makeDabs(zBall, room.flames);
  const ball = new THREE.Group(), under = new THREE.Group();
  jets.name = 'jets';
  ball.add(bs.group, fl.group, bl.group, air.group, floor, pools, jets, bDabs.mesh, room.group, rDabs.mesh);
  under.add(bs.under, fl.under, air.under, bDabs.mirror);
  ball.add(under); f2.add(ball);
  // a slower machine (ctx.quality.detail under 1) is given fewer of what is plentiful: dancers, butterflies, loose petals
  // (each list is in the order its stream dealt it, so the first of it is as mixed as the whole)
  if (detail < 1) {
    const thin = (ig, part = ig.instanceCount) => { ig.instanceCount = Math.max(1, ig.instanceCount - Math.round(part * (1 - detail))); };
    for (const a of bl.dancers) { thin(a.mesh.geometry); a.mirror.geometry.instanceCount = a.shade.geometry.instanceCount = a.mesh.geometry.instanceCount; }
    thin(air.butterflies.geometry); thin(fl.petals.geometry);
  }
  // the room's lamp, and the light that stands in its doorway and falls in a strip along the carpet
  zBall.point(3, room.lamp[0], room.lamp[1], room.lamp[2], 19, mulc(gold, 3.0)).point(4, 0, 8, -plan.dEnd + 1.5, 26, [3.4, 2.6, 1.45]);
  zBall.U.uDoorS.value.set(-plan.dEnd, ROOM.DOORW / 2, 1, 44);
  await ctx.yield();
  // the rare visit: the ball stops still for a few seconds, and goes on, over and over for ever: one round of the
  // world's clock, stopEvery seconds long, begun at a drawn phase (a stop is as likely at any second as at any other)
  const rs = R.stop, stopEvery = rs.range(15, 19), stopFor = rs.range(3.2, 4.4), stopPh = rs() * stopEvery;
  const ballTime = (time) => { if (!rare) return time; const tt = time + stopPh, n = Math.floor(tt / stopEvery), r = tt - n * stopEvery; return time - n * stopFor - Math.min(r, stopFor); };
  const hero = {
    object, f2, plan, film, route, zStair, zForest, zBall, stair, life, forest, ball, radius: 2, height: 16, center: new THREE.Vector3(ST.WALL + plan.pools[1].d, ST.GY + 3, -ST.DOOR), ground: false,
    anchors: { door: new THREE.Vector3(0, 6, 0), landing: new THREE.Vector3(ST.WALL, ST.GY, -ST.DOOR) },
    proof: route.best, counts: { guests: life.count, pairs: bl.pairs, blooms: fl.counts.blooms, petals: fl.counts.petals, tulips: fl.counts.tulips, ...air.counts, ...forest.counts, ...room.counts, farPairs: bs.farPairs },
    // call when the object has been placed (and mirrored) in the world
    frames() { object.updateMatrixWorld(true); zStair.frame(object); zForest.frame(f2); zBall.frame(f2); },
    // WHICH HALLS ARE DRAWN: a hall is drawn while the visitor is in it or where it can be seen from (zr = metres down
    // the stair, d = metres into the halls of F2). It is the only thing here that knows where the visitor is, and it
    // changes nothing in a hall: each is whole whenever it is drawn. (The halls are larger than the house: the stair's
    // near shell is left undrawn over the roofs, where it would stand in view past the house.)
    halls(zr, d) { stair.group.visible = d < 30; stairNear.visible = zr > -ST.HALL; forest.group.visible = zr > -20 && d < plan.B1 + 40; ball.visible = zr > -20; },
    update(dt, time) {
      const bt = hero.ballTime(time);
      for (const z of [zStair, zForest, zBall]) { z.U.uTime.value = time; z.U.uBall.value = bt; }
      zStair.U.uWav.value.z = time; zBall.U.uShim.value.y = bt;
      life.sway(time); air.sway(time); bs.cat(time); room.tick(time);
    },
    ballTime,
    dispose() { object.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); }); },
  };
  hero.frames(); hero.halls(0, -ST.WALL);
  return hero;
}

// ---------------------------------------------------------------- THE BALLROOM (frame F2; d = -z in from the tall doorway)
export const BALL = { HW: 34, COLX: 23, COLH: 30, CAP: 34, BEAM: 38, VAULT2: 30, FLOWERH: 26 };
const YSTONE = lin('#e9d27a'), ROSE = lin('#c2183a'), PINK = lin('#f6a6c0');
// one column of the sparkling stone: a base, a shaft of the visit's make (fluted, twisted or faceted), a gilt capital;
// no two alike (girth, the turn of the flutes, the capital's spread come out of the columns' own stream)
function column(g, x, z, make, rc) {
  const k = rc.range(0.94, 1.07), tw = rc.sign() * rc.range(0.07, 0.11), fl = rc.range(0, 6.28), cap = rc.range(0.92, 1.12), tint = rc.range(0.9, 1.08), H = BALL.COLH;
  // (no builder: the column is dealt and not set down)
  if (!g) return;
  g.kind(1, 0, 0.45).col(YSTONE, 0.85 * tint);
  g.lathe(x, 0, z, [[3.0 * k, 0], [3.0 * k, 0.9], [2.6 * k, 1.3], [2.5 * k, 1.9]], make === 'faceted' ? 8 : 12);
  const prof = []; for (let j = 0; j <= 9; j++) { const t = j / 9; prof.push([(2.3 - 0.32 * t * t) * k, 1.9 + t * (H - 1.9)]); }
  g.col(YSTONE, tint);
  if (make === 'faceted') g.lathe(x, 0, z, prof, 8, { rmod: () => 1.04, a0: fl, a1: fl + Math.PI * 2 });
  else g.lathe(x, 0, z, prof, 28, { rmod: (a) => 1 - 0.075 * Math.abs(Math.sin(a * 7 + fl)), twist: make === 'twisted' ? tw : 0 });
  g.kind(4, 0, 0.8).col(GILT);
  g.lathe(x, 0, z, [[2.0 * k, H - 0.2], [2.35 * k, H + 0.5], [3.0 * k * cap, H + 2.5], [3.3 * k * cap, H + 3.2], [3.3 * k * cap, BALL.CAP]], 12);
  g.lathe(x, 0, z, [[2.42 * k, 2.0], [2.6 * k, 2.3], [2.4 * k, 2.6]], 12);
}
// the vaults: a barrel over the nave between the rows of columns with flat ceilings over the aisles (bays 1 and 3),
// one wide barrel wall to wall over the pools (bay 2); coffered (kind 7, aux.w = the way round the vault)
function vault(g, dA, dB, wide, step) {
  const r = wide ? BALL.HW : BALL.COLX, cy = wide ? BALL.VAULT2 : BALL.BEAM, n = 14, VC = [0.5, 0.42, 0.34];
  for (let d = dA; d < dB - 0.01; d += step) {
    const d1 = Math.min(d + step, dB);
    for (let i = 0; i < n; i++) {
      const a0 = Math.PI * i / n, a1 = Math.PI * (i + 1) / n, P = (a, dd) => [r * Math.cos(a), cy + r * Math.sin(a), -dd];
      g.kind(7, 0, 0.2, a0 * r).col(VC); const i0 = g.v(...P(a0, d), -Math.cos(a0), -Math.sin(a0), 0), i1 = g.v(...P(a0, d1), -Math.cos(a0), -Math.sin(a0), 0);
      g.kind(7, 0, 0.2, a1 * r); const i2 = g.v(...P(a1, d1), -Math.cos(a1), -Math.sin(a1), 0), i3 = g.v(...P(a1, d), -Math.cos(a1), -Math.sin(a1), 0);
      g.I.push(i0, i2, i1, i0, i3, i2);
    }
    if (!wide) for (const sx of [-1, 1]) { g.kind(7, 0, 0.2, 0).col(VC, 0.8); const i0 = g.v(sx * r, cy, -d, 0, -1, 0); g.kind(7, 0, 0.2, 11); const i1 = g.v(sx * BALL.HW, cy, -d, 0, -1, 0), i2 = g.v(sx * BALL.HW, cy, -d1, 0, -1, 0); g.kind(7, 0, 0.2, 0); const i3 = g.v(sx * r, cy, -d1, 0, -1, 0); g.I.push(i0, i1, i2, i0, i2, i3); }
  }
}
// the wall between a narrow vault and the wide one (at the ends of bay 2)
function lunette(g, d) {
  const n = 14;
  g.kind(0, 0, 0.2).col([0.42, 0.3, 0.16]);
  for (let i = 0; i < n; i++) {
    const a0 = Math.PI * i / n, a1 = Math.PI * (i + 1) / n, I = (a) => [BALL.COLX * Math.cos(a), BALL.BEAM + BALL.COLX * Math.sin(a), -d], O = (a) => [BALL.HW * Math.cos(a), BALL.VAULT2 + BALL.HW * Math.sin(a), -d];
    g.quad(I(a0), O(a0), O(a1), I(a1));
  }
  g.kind(4, 0, 0.8).col(GILT);
  for (let i = 0; i < n; i++) { const a0 = Math.PI * i / n, a1 = Math.PI * (i + 1) / n, I = (a, r) => [r * Math.cos(a), BALL.BEAM + r * Math.sin(a), -d]; g.quad(I(a0, BALL.COLX), I(a0, BALL.COLX + 1.2), I(a1, BALL.COLX + 1.2), I(a1, BALL.COLX)); }
}
// rows of columns under their beams, between dA and dB (the first column half a pitch in)
async function colonnade(ctx, g, dA, n, pitch, make, rc) {
  for (let k = 0; k < n; k++) { for (const sx of [-1, 1]) column(g, sx * BALL.COLX, -(dA + (k + 0.5) * pitch), make, rc); await ctx.yield(); }
  for (const sx of [-1, 1]) {
    const x = sx * BALL.COLX;
    g.kind(1, 0, 0.4).col(YSTONE, 0.9); g.box(x - 2.2, BALL.CAP, -(dA + n * pitch), x + 2.2, BALL.BEAM, -dA, { bottom: true });
    g.kind(4, 0, 0.8).col(GILT); g.box(x - 2.5, BALL.CAP + 1.4, -(dA + n * pitch), x + 2.5, BALL.CAP + 2.0, -dA, { bottom: true });
  }
}

// a fountain: a wide basin, a bowl on a stem, a finial; pushes its jets (origin, velocity, seconds of flight, count)
function fountain(g, x, z, s, jets) {
  g.kind(1, 0, 0.5).col(YSTONE, 0.95);
  g.lathe(x, 0, z, [[0.7 * s, 0], [0.7 * s, 0.5 * s], [4.4 * s, 0.9 * s], [4.7 * s, 1.7 * s], [4.3 * s, 1.7 * s], [1.0 * s, 1.0 * s]], 14);
  g.lathe(x, 0, z, [[0.55 * s, 1.0 * s], [0.4 * s, 4.6 * s], [2.2 * s, 5.2 * s], [2.35 * s, 5.8 * s], [2.05 * s, 5.8 * s], [0.4 * s, 5.2 * s]], 10);
  g.kind(4, 0, 0.8).col(GILT); g.lathe(x, 0, z, [[0.3 * s, 5.2 * s], [0.22 * s, 7.4 * s], [0.5 * s, 7.8 * s], [0.05 * s, 8.3 * s]], 6);
  g.kind(0, 0.5, 0.9).col([0.55, 0.75, 0.9]); g.lathe(x, 1.5 * s, z, [[0.01, 0], [4.3 * s, 0]], 14); g.lathe(x, 5.65 * s, z, [[0.01, 0], [2.05 * s, 0]], 10);
  jets.push({ o: [x, 8.2 * s, z], v: [0, 10.5 * s, 0], spread: 0.9 * s, T: 2.0, n: 46, drop: 2.4 * s });
  for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2 + 0.2; jets.push({ o: [x + Math.cos(a) * 2.2 * s, 5.7 * s, z + Math.sin(a) * 2.2 * s], v: [Math.cos(a) * 1.35 * s, 2.2 * s, Math.sin(a) * 1.35 * s], spread: 0.12 * s, T: 1.15, n: 12, drop: 4.2 * s }); }
}
// the great black cat of the ball: body, legs and tail (the head is a mesh of its own, so that it can turn)
function catBody(g) {
  const FUR = [0.014, 0.014, 0.02];
  g.kind(4, 0, 0.6).col(GILT, 0.9); g.lathe(0, 0, 0, [[3.6, 0], [3.6, 0.9], [3.2, 1.2]], 14);
  g.kind(0, 0, 0.55).col(FUR);
  g.lathe(0, 1.2, 0.2, [[2.3, 0], [2.85, 1.3], [2.6, 3.3], [1.75, 5.3], [1.3, 6.3]], 12, { sz: 1.12 });
  g.taper(-0.85, 1.75, 0.55, 0.6, 0.5, 0.55, 1.2, 5.6, false); g.taper(0.85, 1.75, 0.55, 0.6, 0.5, 0.55, 1.2, 5.6, false);
  g.ball(-0.85, 1.5, 2.1, 0.7, 0.4, 0.9, 6, 3); g.ball(0.85, 1.5, 2.1, 0.7, 0.4, 0.9, 6, 3);
  g.tube([[1.8, 1.7, -1.6], [3.0, 1.6, -0.6], [3.3, 1.7, 1.0], [2.6, 1.8, 2.4], [1.5, 2.0, 3.0]], 0.42, 6, 0.2);
  g.kind(0, 0.12, 0.2).col([0.92, 0.92, 0.9]);
  g.tri([0, 7.2, 1.55], [-1.5, 7.9, 1.4], [-1.5, 6.5, 1.4]); g.tri([0, 7.2, 1.55], [1.5, 6.5, 1.4], [1.5, 7.9, 1.4]); g.cbox(0, 6.95, 1.5, 0.5, 0.5, 0.3, {});
  g.quad([-0.7, 4.4, 1.9], [0.7, 4.4, 1.9], [0.9, 6.6, 1.5], [-0.9, 6.6, 1.5]);
}
export function catHeadGeometry(glints) {
  const g = new Geo(), FUR = [0.014, 0.014, 0.02];
  g.kind(0, 0, 0.55).col(FUR);
  g.ball(0, 0, 0, 1.95, 1.7, 1.75, 10, 6); g.ball(0, -0.55, 1.5, 0.8, 0.55, 0.6, 6, 3);
  for (const sx of [-1, 1]) g.lathe(sx * 1.15, 1.2, 0.1, [[0.75, 0], [0.4, 0.8], [0.02, 1.45]], 4, { sz: 0.5 });
  g.kind(0, 3.2, 0.9).col([0.75, 0.9, 0.2]);
  for (const sx of [-1, 1]) g.ball(sx * 0.78, 0.22, 1.56, 0.36, 0.26, 0.12, 6, 3);
  g.kind(0, 0, 0.9).col([0.01, 0.01, 0.01]); for (const sx of [-1, 1]) g.cbox(sx * 0.78, 0.0, 1.64, 0.1, 0.46, 0.08, {});
  g.kind(4, 0.5, 0.9).col(GILT, 1.2);
  for (const sx of [-1, 1]) for (let k = 0; k < 4; k++) {
    const y = -0.4 - 0.16 * k, tip = [sx * (3.5 - 0.12 * k), -0.2 - 0.45 * k + 0.5, 1.9 - 0.2 * k];
    g.tube([[sx * 0.55, y, 1.95], [sx * 2.0, y + 0.22 - 0.1 * k, 2.1], tip], 0.06, 4, 0.03);
    glints.push(tip);
  }
  return g.build();
}

// the wall over an arch: between a half circle (radius r, middle height cy) and the level top, out to wide either hand
function tympanum(g, d, r, cy, top, wide) {
  const n = 14;
  for (let i = 0; i < n; i++) { const a0 = Math.PI * i / n, a1 = Math.PI * (i + 1) / n, A = (a) => [r * Math.cos(a), cy + r * Math.sin(a), -d], T = (a) => [r * Math.cos(a), top, -d]; g.quad(A(a0), A(a1), T(a1), T(a0)); }
  if (wide > r) { g.quad([r, cy, -d], [wide, cy, -d], [wide, top, -d], [r, top, -d]); g.quad([-wide, cy, -d], [-r, cy, -d], [-r, top, -d], [-wide, top, -d]); }
}
// where things of the ballroom stand (pure, out of the plan): used by the build, the film and the proof of clearance
export function ballPlaces(plan) {
  const s = plan.orchSide, orchD = plan.B1 + 30, monkD = plan.pools[0].d + plan.poolPitch / 2, catD = plan.pools[1].d + plan.poolPitch / 2;
  const fountains = [[s * 17, monkD, 1.0], [-s * 17, catD, 1.0], [s * 15.5, catD - 8, 0.8], [17, plan.B2 + 13, 0.9], [-17, plan.B2 + 13, 0.9]];
  // (the gilt shell over the monkeys' stage: its middle shellX from the hall's middle and its radius shellR, so that it
  // stands 4 m clear of the hall's wall behind it and well clear of the flowers' faces, and still over the whole
  // band; the orchestra's terrace: five steps of tierW by tierH)
  return { s, orchD, orchLen: 56, monkD, catD, cat: { x: s * 20.5, d: catD + 4, k: 0.85 }, fountains, shellX: 19.8, shellR: 10.2, tiers: 5, tierX: 12.5, tierW: 2.0, tierY: 1.1, tierH: 1.25 };
}
// THE BALLROOM'S STANDING THINGS, one mesh and its image under the polished floor: the nave (bay 1), the bay of the
// pools (bay 2), and THE FAR BAY, which keeps the hall's columns, beams, gilded vault and flower walls to the hall's
// end wall: a gilded wall of tall mirrors with the great portal in it, through which the place draws in to the room.
export async function buildBallStatics(ctx, plan, zone, R, density = 1, route = null) {
  const group = new THREE.Group(), under = new THREE.Group(); under.scale.y = -1;
  const HW = BALL.HW, F0 = plan.forestLen, { B1, B2, B3, endWall: EW, colPitch: pitch, colMake: make } = plan, PL = ballPlaces(plan), s = PL.s;
  const mat = litMaterial(zone);
  const flames = [], jets = [];
  let g = new Geo();
  await colonnade(ctx, g, B1, plan.naveBays, pitch, make, R.columns);
  await ctx.yield();
  vault(g, F0, B2, false, 11); vault(g, B2, B3, true, 11); lunette(g, B2); lunette(g, B3); vault(g, B3, EW, false, 11);
  // THE FAR BAY'S COLUMNS, out of the bay's own stream: four pairs are dealt, a pitch apart; a pair stands only where
  // the place is wider than the pair by a column's foot and half a metre (plan.shellAt), and one that does not fit is
  // dropped after its draws. The beams run from the bay's beginning to the end wall.
  const FOOT = 3.0 * 1.07;
  let farPairs = 0;
  for (let k = 0; k < 4; k++) {
    const d = B3 + (k + 0.5) * pitch, fits = Math.min(plan.shellAt(d - FOOT)[0], plan.shellAt(d + FOOT)[0]) >= BALL.COLX + FOOT + 0.5;
    for (const sx of [-1, 1]) column(fits ? g : null, sx * BALL.COLX, -d, make, R.columns3);
    if (fits) { farPairs++; if (route) for (const sx of [-1, 1]) route.f2.note('column (the far bay)', sx * BALL.COLX, 0, BALL.BEAM, -d, 4.0); }
    await ctx.yield();
  }
  for (const sx of [-1, 1]) {
    const x = sx * BALL.COLX;
    g.kind(1, 0, 0.4).col(YSTONE, 0.9); g.box(x - 2.2, BALL.CAP, -EW, x + 2.2, BALL.BEAM, -B3, { bottom: true });
    g.kind(4, 0, 0.8).col(GILT); g.box(x - 2.5, BALL.CAP + 1.4, -EW, x + 2.5, BALL.CAP + 2.0, -B3, { bottom: true });
  }
  // the threshold's beam over the tulips, on gilt piers
  g.kind(1, 0, 0.4).col(YSTONE, 0.9);
  for (const sx of [-1, 1]) g.box(sx * BALL.COLX - 2.2, BALL.CAP, -B1, sx * BALL.COLX + 2.2, BALL.BEAM, -F0, { bottom: true });
  // side walls: tall arched mirrors along bay 1, the flat's own paper behind the flowers of bay 2
  for (const sx of [-1, 1]) {
    const x = sx * HW;
    g.kind(8, 0, 0.2, pitch).col([0.3, 0.2, 0.11]); g.quad([x, 0, -F0], [x, 0, -B2], [x, BALL.BEAM, -B2], [x, BALL.BEAM, -F0]);
    g.kind(6, 0, 0.05).col([0.3, 0.25, 0.15]); g.quad([x + sx * 0.6, 0, -B2], [x + sx * 0.6, 0, -B3], [x + sx * 0.6, BALL.VAULT2, -B3], [x + sx * 0.6, BALL.VAULT2, -B2]);
    // the far bay's walls: the same paper behind the flowers, to the aisle's ceiling; the gilt band over the flowers runs
    // on to the end wall; over it one high window in gilt bars between the two pairs of columns (its panes show the
    // hour inside: uVis)
    g.quad([x + sx * 0.6, 0, -B3], [x + sx * 0.6, 0, -EW], [x + sx * 0.6, BALL.BEAM, -EW], [x + sx * 0.6, BALL.BEAM, -B3]);
    g.kind(4, 0, 0.8).col(GILT); g.box(Math.min(x, x - sx * 0.8), BALL.FLOWERH, -EW, Math.max(x, x - sx * 0.8), BALL.FLOWERH + 1.2, -B2, { bottom: true });
    const wz = -(B3 + pitch), wl = 6.5, xi = x + sx * 0.45;
    g.box(Math.min(xi, x - sx * 0.2), 28.2, wz - wl - 0.7, Math.max(xi, x - sx * 0.2), 37, wz + wl + 0.7, {});
    for (const [y0, y1] of [[29, 36.2]]) { g.kind(19, 0, 0.9, y0).col([1, 1, 1]); const i0 = g.v(x - sx * 0.25, y0, wz - wl, -sx, 0, 0), i1 = g.v(x - sx * 0.25, y0, wz + wl, -sx, 0, 0); g.kind(19, 0, 0.9, y1); const i2 = g.v(x - sx * 0.25, y1, wz + wl, -sx, 0, 0), i3 = g.v(x - sx * 0.25, y1, wz - wl, -sx, 0, 0); g.I.push(i0, i1, i2, i0, i2, i3); }
    for (let k = 0; k < plan.naveBays; k++) {
      const z = -(B1 + (k + 0.5) * pitch);
      g.kind(1, 0, 0.4).col(YSTONE, 0.8); g.cbox(x - sx * 0.8, 0, z, 1.8, BALL.BEAM, 3.2, {});
      flames.push({ p: [x - sx * 2.4, 13, z], size: 1.7, c: mulc(CANDLE, 3), kind: 0, phase: (k * 0.173 + sx * 0.2 + 0.5) % 1 }, { p: [x - sx * 2.4, 13, z], size: 11, c: mulc(CANDLE, 0.2), kind: 1, phase: (k * 0.31 + 0.5) % 1, what: 'wall candle of the nave' });
    }
  }
  await ctx.yield();
  // THE HALL'S END WALL (at plan.endWall, 1.2 m thick): tall arched mirrors on its flanks behind the rows of columns, the
  // great portal into the first chamber between them in a gilt architrave under a gilt cornice, a gilded fan in the
  // lunette under the vault, garlands of the ball's flowers swagged across the portal's head and down its jambs, a
  // tall candle stand at either foot
  {
    const c1 = plan.chambers[0], w = c1.w, h = c1.h, z = -EW, zb = -(EW + 1.2), WOUT = ROOM.HALF * ROOM.OUTX;
    const rect = (x0, y0, x1, y1, zz) => g.quad([x0, y0, zz], [x1, y0, zz], [x1, y1, zz], [x0, y1, zz]);
    g.kind(8, 0, 0.2, (w + WOUT) / 3).col([0.3, 0.2, 0.11]); rect(-WOUT, 0, -w, BALL.BEAM, z); rect(w, 0, WOUT, BALL.BEAM, z);
    g.kind(6, 0, 0.05).col([0.34, 0.11, 0.08]); rect(-BALL.COLX, h, BALL.COLX, 64, z);
    g.kind(4, 0, 0.8).col(GILT);
    for (const sx of [-1, 1]) {
      g.box(Math.min(sx * w, sx * (w + 1.9)), 0, z, Math.max(sx * w, sx * (w + 1.9)), h, z + 0.7, {});
      g.quad([sx * w, 0, z], [sx * w, 0, zb], [sx * w, h, zb], [sx * w, h, z]);
    }
    g.box(-w - 1.9, h, z, w + 1.9, h + 2.4, z + 0.7, { bottom: true }); g.box(-w - 2.6, h + 2.4, z, w + 2.6, h + 3.3, z + 1.3, { bottom: true });
    g.quad([-w, h, zb], [w, h, zb], [w, h, z], [-w, h, z]);
    // the gilded fan of the lunette: rays out of the portal's head, two arcs across them
    const fy = h + 3.3;
    for (let i = 0; i <= 10; i++) { const a = Math.PI * (0.06 + 0.88 * i / 10), c = Math.cos(a), sn = Math.sin(a), r0 = 3, r1 = 20.5, t = 0.35; g.quad([c * r0 + sn * t, fy + sn * r0 - c * t, z + 0.06], [c * r1 + sn * t * 1.8, fy + sn * r1 - c * t * 1.8, z + 0.06], [c * r1 - sn * t * 1.8, fy + sn * r1 + c * t * 1.8, z + 0.06], [c * r0 - sn * t, fy + sn * r0 + c * t, z + 0.06]); }
    for (const r of [3, 12.5]) for (let i = 0; i < 12; i++) { const a0 = Math.PI * i / 12, a1 = Math.PI * (i + 1) / 12, P = (a, rr) => [Math.cos(a) * rr, fy + Math.sin(a) * rr, z + 0.1]; g.quad(P(a0, r), P(a0, r + 0.7), P(a1, r + 0.7), P(a1, r)); }
    // garlands (a mass of flowers, roses on the roses' hand and camellias on the other)
    for (const sx of [-1, 1]) {
      g.kind(12, 0.03, 0.1).col(sx === plan.rosesSide ? ROSE : PINK);
      const sw = []; for (let j = 0; j <= 8; j++) { const t = j / 8; sw.push([sx * w * (1 - t), h + 1.2 - 5.2 * Math.sin(Math.PI * t) * 0.9 - 1.6 * t, z + 1.5]); }
      g.tube(sw, 1.0, 6, 1.0);
      g.tube([[sx * (w + 0.95), h + 1.4, z + 1.2], [sx * (w + 0.95), h - 7, z + 1.25], [sx * (w + 0.95), h - 14, z + 1.2]], 0.9, 6, 0.35);
      const sx0 = sx * (w + 3.4), sd = EW - 2.4;
      g.kind(4, 0, 0.8).col(GILT); g.lathe(sx0, 0, -sd, [[1.1, 0], [0.36, 0.5], [0.2, 5.6], [0.6, 6]], 6);
      candelabrum(g, sx0, 6, -sd, 1.8, flames, 0.33 + sx * 0.17);
      if (route) route.f2.note('candle stand at the portal', sx0, 0, 11.5, -sd, 2.4);
    }
    if (route) { route.f2.noteBox('the end wall\'s portal (jamb)', w, 0, z, w + 1.9, h, zb); route.f2.noteBox('the end wall\'s portal (head and garlands)', -w, h - 6.6, z + 2.6, w, h + 3.3, zb); }
  }
  await ctx.yield();
  // the orchestra's terrace: five tiers rising toward the columns, a gilt rail, a podium before it
  // (built as five steps: pale risers under gilt nosings, a strip of the stair's carpet along each tread for a row of
  // chairs, stepped cheeks with gilt caps at either end, a gilt rail on balusters along the front)
  const oz0 = -(PL.orchD + PL.orchLen), oz1 = -PL.orchD;
  for (let k = 0; k < PL.tiers; k++) {
    const xa = s * (PL.tierX + PL.tierW * k), xb = s * (PL.tierX + PL.tierW * (k + 1)), top = PL.tierY + PL.tierH * k;
    g.kind(3, 0, 0.35).col(STONE, 1.25); g.box(Math.min(xa, xb), 0, oz0, Math.max(xa, xb), top, oz1, {});
    g.kind(2, 0, 0.05, 0).col(CARPET, 0.9); g.quad([Math.min(xa + s * 0.35, xb - s * 0.15), top + 0.02, oz1 - 0.8], [Math.max(xa + s * 0.35, xb - s * 0.15), top + 0.02, oz1 - 0.8], [Math.max(xa + s * 0.35, xb - s * 0.15), top + 0.02, oz0 + 0.8], [Math.min(xa + s * 0.35, xb - s * 0.15), top + 0.02, oz0 + 0.8]);
    g.kind(4, 0, 0.8).col(GILT); g.box(Math.min(xa, xa + s * 0.16), top - 0.22, oz0, Math.max(xa, xa + s * 0.16), top + 0.05, oz1, {});
    for (const zz of [oz0 - 0.5, oz1]) {
      g.kind(3, 0, 0.35).col(STONE, 1.05); g.box(Math.min(xa, xb), 0, zz, Math.max(xa, xb), top + 1.0, zz + 0.5, {});
      g.kind(4, 0, 0.8).col(GILT); g.box(Math.min(xa, xb), top + 1.0, zz - 0.08, Math.max(xa, xb), top + 1.16, zz + 0.58, {});
    }
  }
  const rx = s * (PL.tierX - 0.3);
  g.kind(4, 0, 0.8).col(GILT); g.box(rx - 0.12, 1.25, oz0, rx + 0.12, 1.45, oz1, { bottom: true });
  for (let zz = oz1 - 0.4; zz > oz0; zz -= 2.3) g.lathe(rx, 0, zz, [[0.16, 0], [0.07, 0.3], [0.13, 0.75], [0.06, 1.25]], 4);
  g.kind(3, 0, 0.35).col(STONE, 1.2); g.cbox(s * (PL.tierX - 2.6), 0, -(PL.orchD + PL.orchLen / 2), 2.4, 1.4, 2.4, {});
  for (const dd of [0, PL.orchLen]) candelabrum(g, s * (PL.tierX - 0.9), 0, -(PL.orchD + dd) + (dd ? -1.4 : 1.4), 2.0, flames, 0.3 + dd * 0.01);
  // the monkeys' stage: a platform under a gilt shell
  const m = -s, sd = PL.monkD;
  const stageX = PL.shellX + PL.shellR + 0.6;
  g.kind(3, 0, 0.35).col(STONE, 1.1); g.box(Math.min(m * 13, m * stageX), 0, -(sd + 11), Math.max(m * 13, m * stageX), 2.2, -(sd - 11), {});
  g.kind(4, 0, 0.8).col(GILT); g.box(Math.min(m * 13, m * 13.2), 1.7, -(sd + 11), Math.max(m * 13, m * 13.2), 2.24, -(sd - 11), {});
  // (the shell stands clear of the flower wall behind it: its back 4 m from the wall, its foot on the platform, the
  // platform ending just behind it, so that the floor shows between the stage and the flowers)
  const shell = []; for (let j = 0; j <= 6; j++) { const a = j / 6 * Math.PI / 2; shell.push([Math.max(PL.shellR * Math.cos(a), 0.02), PL.shellR * Math.sin(a)]); }
  g.kind(4, 0, 0.7).col(GILT, 0.85); g.lathe(m * PL.shellX, 2.2, -sd, shell, 18, { a0: m > 0 ? -Math.PI / 2 : Math.PI / 2, a1: m > 0 ? Math.PI / 2 : Math.PI * 1.5, rmod: (a) => 1 - 0.05 * Math.abs(Math.sin(a * 9)) });
  // (a gilt rib closes the shell's rim, and its back is a wall of its own)
  g.box(Math.min(m * (PL.shellX + PL.shellR - 0.1), m * (PL.shellX + PL.shellR + 0.5)), 0, -(sd + PL.shellR * 0.5), Math.max(m * (PL.shellX + PL.shellR - 0.1), m * (PL.shellX + PL.shellR + 0.5)), 2.2, -(sd - PL.shellR * 0.5), {});
  for (const dz of [-10, 10]) candelabrum(g, m * 14.2, 2.2, -(sd + dz), 1.5, flames, 0.6 + dz * 0.02);
  await ctx.yield();
  // fountains, the cat on its plinth beside one of them, the rims of the three pools with candles at their corners
  for (const [x, d, k] of PL.fountains) { fountain(g, x, -d, k, jets); await ctx.yield(); }
  // (the cat sits facing the hall's middle squarely)
  g.at(M4(PL.cat.x, 0, -PL.cat.d, -s * Math.PI / 2, PL.cat.k)); catBody(g); g.at(null);
  // (each pool stands in a RAISED KERB of pale marble, 1.5 m high: a plinth, a wall, a cap that overhangs; the wine
  // stands 0.45 m under the cap; at the pool's middle a low marble boss with a gilt rose throws a fountain: one jet
  // straight up and eight in a ring, all of them 2.5 m and more under the line that passes over the pool)
  const P = plan.POOL, RIM = 1.2, RH = POOLKERB, WINE = { violet: [0.7, 0.5, 1.0], ruby: [1.0, 0.3, 0.42], crystal: [0.8, 0.95, 1.0] };
  for (const q of plan.pools) {
    const z0 = -(q.d - P.len / 2), z1 = -(q.d + P.len / 2);
    g.kind(3, 0, 0.5).col([0.8, 0.76, 0.66]);
    for (const [out, ya, yb, inn] of [[RIM + 0.3, 0, 0.4, 0], [RIM, 0.4, RH - 0.3, 0], [RIM + 0.2, RH - 0.3, RH, 0.15]]) {
      g.box(-P.half - out, ya, z0 - inn, P.half + out, yb, z0 + out, {}); g.box(-P.half - out, ya, z1 - out, P.half + out, yb, z1 + inn, {});
      g.box(-P.half - out, ya, z1, -P.half + inn, yb, z0, {}); g.box(P.half - inn, ya, z1, P.half + out, yb, z0, {});
    }
    for (const sx of [-1, 1]) for (const zz of [z0 + RIM / 2, z1 - RIM / 2]) candelabrum(g, sx * (P.half + RIM / 2), RH, zz, 1.25, flames, 0.2 + q.d * 0.013 + sx * 0.1);
    g.kind(3, 0, 0.5).col([0.8, 0.76, 0.66]); g.lathe(0, 0, -q.d, [[1.5, 0.6], [1.3, 1.2], [0.7, 1.45], [0.5, 1.7]], 10);
    g.kind(4, 0.1, 0.9).col(GILT); g.lathe(0, 0, -q.d, [[0.5, 1.7], [0.75, 1.8], [0.3, 1.95], [0.01, 2.0]], 8, { rmod: (a) => 1 + 0.25 * Math.abs(Math.sin(a * 4)) });
    jets.push({ o: [0, 2.0, -q.d], v: [0, 5.6, 0], spread: 0.35, T: 1.4, n: 40, drop: 0.9, c: WINE[q.kind] });
    for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2 + 0.39; jets.push({ o: [Math.cos(a) * 0.7, 1.85, -q.d + Math.sin(a) * 0.7], v: [Math.cos(a) * 2.6, 4.2, Math.sin(a) * 2.6], spread: 0.1, T: 1.15, n: 10, drop: 0.75, c: WINE[q.kind] }); }
    if (route) route.f2.note('fountain of a pool and its jets', 0, 0, 4.25, -q.d, 4.4);
  }
  await ctx.yield();
  // tall candle stands along the nave between the columns (more of them on a crowded night), none where the terrace is
  const step = density > 1.05 ? pitch / 2 : pitch;
  for (let d = B1 + pitch; d < B2 - 2; d += step) for (const sx of [-1, 1]) {
    if (sx === s && d > PL.orchD - 4 && d < PL.orchD + PL.orchLen + 4) continue;
    g.kind(4, 0, 0.8).col(GILT); g.lathe(sx * 19.2, 0, -d, [[0.9, 0], [0.3, 0.4], [0.16, 4.6], [0.5, 5]], 6);
    candelabrum(g, sx * 19.2, 5, -d, 1.5, flames, 0.4 + d * 0.021 + sx * 0.13);
  }
  await ctx.yield();
  const geo = await g.buildA(ctx);
  group.add(new THREE.Mesh(geo, mat)); under.add(new THREE.Mesh(geo, mat));
  await ctx.yield();
  // the cat's head turns and nods, slowly, on the clock, each from a phase drawn out of the cat's own stream; it
  // turns as far to the one hand as to the other about the hall's middle
  const head = mover(catHeadGeometry([]), mat), catYaw = -s * Math.PI / 2, turnPh = R.cat.range(0, 6.2832), nodPh = R.cat.range(0, 6.2832);
  const hx = PL.cat.x + Math.sin(catYaw) * 0.6 * PL.cat.k, hy = 9.0 * PL.cat.k, hz = -PL.cat.d + Math.cos(catYaw) * 0.6 * PL.cat.k; group.add(head.mesh);
  const cat = (time) => { head.set(hx, hy, hz, Math.sin(time * 0.31 + nodPh) * 0.08, catYaw + Math.sin(time * 0.43 + turnPh) * 0.5, 0, PL.cat.k); };
  cat(0);
  await ctx.yield();
  return { group, under, mat, flames, jets, PL, cat, farPairs };
}

// ---------------------------------------------------------------- the polished floor, the pools, the water in the air
// The floor is parquet that lets the hall's image under it show (more at a low angle) as far as the hall's end wall
// (from uFloor.x to uFloor.y metres in the image is gone: the chambers have none); from uFloor.z on, the papered
// chamber and the room, it is the flat's own waxed planks.
export function makeFloor(zone, plan, x0, x1, dA, dB) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([x0, 0, -dA, x1, 0, -dA, x1, 0, -dB, x0, 0, -dB]), 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
  g.computeBoundingSphere();
  const m = new THREE.ShaderMaterial({
    uniforms: { ...zone.U, uFloor: { value: new THREE.Vector3(plan.endWall - 3, plan.endWall + 1, plan.chambers[2].d0 - 1) } }, transparent: true,
    vertexShader: /* glsl */`
      uniform mat4 uW2L; varying vec3 vP, vEye; varying float vDist;
      void main(){ vP = position; vec4 mv = viewMatrix * (modelMatrix * vec4(position, 1.)); vDist = length(mv.xyz); vEye = (uW2L * vec4(cameraPosition, 1.)).xyz; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: /* glsl */`
      varying vec3 vP, vEye; varying float vDist; uniform vec3 uFloor;
      ${NOISE_GLSL}
      ${LIGHT_GLSL}
      void main(){
        vec3 N = vec3(0., 1., 0.), V = normalize(vEye - vP);
        float room = smoothstep(uFloor.x, uFloor.y, -vP.z), planks = smoothstep(uFloor.z, uFloor.z + 2., -vP.z);
        vec2 g = vP.xz / 3.2, id = floor(g), f = fract(g);
        float flip = mod(id.x + id.y, 2.), plank = flip > .5 ? floor(f.x * 4.) : floor(f.y * 4.);
        vec3 par = vec3(.5, .3, .13) * (.74 + .4 * h21(id * 7. + plank)) * (.86 + .14 * smoothstep(0., .04, min(min(f.x, f.y), min(1. - f.x, 1. - f.y))));
        float pl = floor(vP.x / 1.9), fx = fract(vP.x / 1.9);
        vec3 wood = vec3(.36, .22, .11) * (.72 + .45 * h11(pl * 7.3 + 2.)) * (.82 + .3 * vn2(vec2(vP.x * 5., vP.z * .3 + pl * 3.))) * (.7 + .3 * smoothstep(0., .05, min(fx, 1. - fx)));
        vec3 alb = mix(par, wood, planks);
        // (the strip of light through the far doorway is part of the hall's light)
        vec3 spec; vec3 dif = hallLight(vP, N, V, 60., spec);
        float fres = pow(1. - clamp(V.y, 0., 1.), 3.);
        float refl = mix(.36, .86, fres) * (1. - room);
        vec3 col = alb * dif + spec * mix(.3, .14, room);
        gl_FragColor = vec4(hallFog(col, vDist, vP), 1. - refl);
      }`,
  });
  const mesh = new THREE.Mesh(g, m); mesh.renderOrder = 2;
  return mesh;
}
// the three pools of wine: boiling, lit from below; uPoolK = the light left in each
export function makePools(zone, plan, poolK) {
  const P = plan.POOL, pos = [], col = [], idx = [], ind = [];
  const COL = { violet: lin('#8a4bff'), ruby: lin('#d0123f'), crystal: [0.3, 0.42, 0.52] };
  plan.pools.forEach((q, k) => {
    const z0 = -(q.d - P.len / 2), z1 = -(q.d + P.len / 2), c = COL[q.kind], b = k * 4;
    pos.push(-P.half, POOLY, z0, P.half, POOLY, z0, P.half, POOLY, z1, -P.half, POOLY, z1); for (let i = 0; i < 4; i++) { col.push(c[0], c[1], c[2]); idx.push(k); }
    ind.push(b, b + 1, b + 2, b, b + 2, b + 3);
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3)); g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(col), 3)); g.setAttribute('pool', new THREE.BufferAttribute(new Float32Array(idx), 1)); g.setIndex(ind);
  g.computeBoundingSphere();
  const m = new THREE.ShaderMaterial({
    uniforms: { ...zone.U, uPoolK: poolK, uRose: { value: new THREE.Vector4(plan.rosesSide, BALL.HW, BALL.FLOWERH, plan.B2) } }, vertexColors: true,
    vertexShader: /* glsl */`
      attribute float pool; uniform mat4 uW2L; uniform vec3 uPoolK; varying vec3 vP, vEye, vC; varying float vDist, vK;
      void main(){ vP = position; vC = color; vK = pool < .5 ? uPoolK.x : (pool < 1.5 ? uPoolK.y : uPoolK.z);
        vec4 mv = viewMatrix * (modelMatrix * vec4(position, 1.)); vDist = length(mv.xyz); vEye = (uW2L * vec4(cameraPosition, 1.)).xyz; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: /* glsl */`
      varying vec3 vP, vEye, vC; varying float vDist, vK; uniform float uBall; uniform vec4 uRose;
      ${NOISE_GLSL}
      ${LIGHT_GLSL}
      // bubbles rising through the wine: each comes up under its own place (seen through the surface, so it slides
      // toward that place as it rises), growing and brightening, on a round of its own on the ball's clock
      float bubbles(vec2 p, vec3 V, float t, float sc, float off){
        vec2 gb = p / sc + off, ib = floor(gb); float hb = h21(ib + 2.3), pb = fract(t * (.35 + .5 * hb) + hb * 7.);
        vec2 cb = (vec2(h21(ib + 5.1), h21(ib + 9.2)) - .5) * .5 + .5 - V.xz / max(V.y, .3) * ((1. - pb) * .32 / sc);
        float rb = length(fract(gb) - cb);
        return (1. - smoothstep(.05 + .08 * pb, .08 + .11 * pb, rb)) * step(.4, hb) * pb;
      }
      void main(){
        vec2 p = vP.xz; float t = uBall;
        float n1 = vn3(vec3(p * .5, t * .8)), n2 = vn3(vec3(p * 1.3 + 7., t * 1.5)), boil = n1 * .62 + n2 * .38;
        vec2 g = p / 1.5, id = floor(g), f = fract(g) - .5; float h = h21(id), ph = fract(t * (.45 + h * .6) + h * 9.);
        vec2 c = (vec2(h21(id + 3.1), h21(id + 8.7)) - .5) * .5; float r = length(f - c), R = ph * .4, on = step(.3, h) * (1. - ph);
        float ring = (1. - smoothstep(0., .05, abs(r - R))) * on, cap = (1. - smoothstep(R * .5, R + .002, r)) * on;
        vec3 V = normalize(vEye - vP);
        float fres = pow(1. - clamp(V.y, 0., 1.), 4.);
        float bub = bubbles(p, V, t, .9, 0.) + bubbles(p, V, t, 1.7, 13.7);
        vec3 lit = vC * (.35 + 2.3 * smoothstep(.28, .8, boil) + .9 * cap) + mix(vC, vec3(1.), .6) * (ring * 1.8 + bub * 1.3);
        vec3 spec; vec3 dif = hallLight(vP, vec3(0., 1., 0.), V, 80., spec);
        vec3 dark = vC * .02 + (dif * .05 + spec * .5) * (.4 + fres) + vec3(.3, .33, .4) * fres * .25 * (.6 + .8 * n2);
        // THE HALL MIRRORED IN THE WINE: the eye's line, thrown back off the surface (stirred a little by the boil),
        // meets a flower wall (roses on one hand, camellias on the other, the gilt band over them) or the vault
        vec3 Rr = normalize(vec3(-V.x + (n1 - .5) * .16, max(V.y, .04), -V.z + (n2 - .5) * .16));
        float sgx = Rr.x < 0. ? -1. : 1., tw = (sgx * uRose.y - vP.x) / (sgx * max(abs(Rr.x), 1e-3));
        vec3 hit = vP + Rr * tw;
        vec3 flower = sgx * uRose.x > 0. ? vec3(.5, .03, .09) : vec3(.9, .42, .56);
        vec2 fc = hit.zy / 1.7; float fd = length(fract(fc + vec2(0., .5 * floor(fc.x))) - .5);
        vec3 wall = mix(vec3(.02, .07, .03), flower * (.6 + .8 * h21(floor(fc))), 1. - smoothstep(.3, .46, fd));
        wall = mix(wall, vec3(1., .72, .28), smoothstep(uRose.z - .3, uRose.z, hit.y) * (1. - smoothstep(uRose.z + 1.2, uRose.z + 1.5, hit.y)));
        wall = mix(wall, vec3(.34, .24, .12) * (.7 + .5 * step(.5, fract(hit.z / 5.5))), smoothstep(uRose.z + 1.2, uRose.z + 1.5, hit.y));
        vec3 mirror = wall * (.1 + .6 * fres) * (1. - smoothstep(60., 120., tw));
        gl_FragColor = vec4(hallFog(mix(dark, lit, vK) + spec * .2 + mirror, vDist, vP), 1.);
      }`,
  });
  return new THREE.Mesh(g, m);
}
// drops in the air: the fountains' jets (each drop flies its own arc for ever) and the spray that leaps off the boiling
// pools (which dies with its pool's light). list: { o, v, T, drop, c, pool } a drop each; pool 3 = a fountain
export function makeJets(zone, list, poolK) {
  const n = list.length, g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0]), 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
  const iO = new Float32Array(n * 4), iV = new Float32Array(n * 4), iC = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
    const q = list[i], grav = 2 * (q.v[1] * q.T + q.drop) / (q.T * q.T);
    iO.set([q.o[0], q.o[1], q.o[2], grav], i * 4); iV.set([q.v[0], q.v[1], q.v[2], q.T], i * 4); iC.set([q.c[0], q.c[1], q.c[2], q.pool + q.ph * 0.98], i * 4);
  }
  g.setAttribute('iO', new THREE.InstancedBufferAttribute(iO, 4)); g.setAttribute('iV', new THREE.InstancedBufferAttribute(iV, 4)); g.setAttribute('iC', new THREE.InstancedBufferAttribute(iC, 4));
  g.instanceCount = n; g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
  const m = new THREE.ShaderMaterial({
    uniforms: { uBall: zone.U.uBall, uFogD: zone.U.uFogD, uPoolK: poolK, uAmb: zone.U.uAmbUp }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      attribute vec4 iO, iV, iC; uniform float uBall, uFogD; uniform vec3 uPoolK, uAmb; varying vec2 vUv; varying vec3 vCol;
      void main(){
        float pool = floor(iC.w), ph = fract(iC.w) * 1.0204, T = max(iV.w, .05), t = fract(uBall / T + ph) * T, q = t / T;
        vec3 c = iO.xyz + iV.xyz * t; c.y -= .5 * iO.w * t * t;
        float k = pool > 2.5 ? 1. : (pool < .5 ? uPoolK.x : (pool < 1.5 ? uPoolK.y : uPoolK.z));
        float size = (pool > 2.5 ? .5 : .34) * (.6 + .8 * fract(ph * 7.3)) * smoothstep(0., .12, q) * (1. - smoothstep(.86, 1., q));
        vec4 mv = viewMatrix * (modelMatrix * vec4(c, 1.));
        mv.xy += position.xy * size;
        vUv = position.xy; vCol = iC.rgb * k * (.5 + 2.2 * dot(uAmb, vec3(1.))) * exp(-uFogD * .6 * length(mv.xyz));
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      varying vec2 vUv; varying vec3 vCol;
      void main(){ float r2 = dot(vUv, vUv); gl_FragColor = vec4(vCol * (exp(-r2 * 16.) * (1. - smoothstep(.2, .25, r2))), 1.); }`,
  });
  const mesh = new THREE.Mesh(g, m); mesh.renderOrder = 6; mesh.frustumCulled = false;
  return mesh;
}
// every drop of the ballroom: the fountains' specs unrolled out of their own stream, the pools' spray out of its own
export function jetList(plan, specs, rf, rb, density) {
  const out = [], P = plan.POOL, COL = { violet: [0.6, 0.35, 1.0], ruby: [1.0, 0.16, 0.3], crystal: [0.8, 0.95, 1.0] };
  for (const j of specs) for (let i = 0; i < j.n; i++) out.push({ o: j.o, v: [j.v[0] + rf.range(-1, 1) * j.spread, j.v[1] * rf.range(0.9, 1.06), j.v[2] + rf.range(-1, 1) * j.spread], T: j.T, drop: j.drop, c: j.c || [0.75, 0.86, 1.0], pool: 3, ph: rf() });
  const n = Math.round(64 * density);
  plan.pools.forEach((q, k) => {
    for (let i = 0; i < n; i++) { const vy = rb.range(3.4, 6.4); out.push({ o: [rb.range(-1, 1) * (P.half - 0.8), POOLY + 0.05, -(q.d + rb.range(-1, 1) * (P.len / 2 - 0.8))], v: [rb.range(-0.5, 0.5), vy, rb.range(-0.5, 0.5)], T: vy / 4.9, drop: 0, c: mulc(COL[q.kind], 1.5), pool: k, ph: rb() }); }
  });
  return out;
}

// ---------------------------------------------------------------- flowers
// One instanced bloom for every rose and camellia of the walls and every flower that falls from the ceiling; another
// for the tulips. iA = place and size, iB = colour and (gate + its own phase), iC = the way it faces (yaw, tilt, roll)
// and how far out from its wall it lies when it has fallen.
// gate 0 stays on its wall; 1 is a bloom of a wall's top, on a round of its own on the ball's clock (it hangs, lets go,
// falls to the wall's foot, lies, and is gone as a new one opens in its place); 3 falls from the ceiling for ever on
// the ball's clock; 4 lies fallen and stirs where it lies. Which a bloom is, is a matter of its own place and its own
// drawn phase, decided at the build.
// a petal lying on the floor: two small curled faces
export function petalGeometry() {
  const g = new Geo();
  g.kind(0, 0, 0.2).col([1, 1, 1]);
  g.quad([-0.5, -0.6, 0], [0.5, -0.6, 0], [0.75, 0.2, 0.22], [-0.75, 0.2, 0.22], [0.62, 0.62, 0.62], [1, 1, 1]); g.quad([-0.75, 0.2, 0.22], [0.75, 0.2, 0.22], [0.3, 0.9, 0.1], [-0.3, 0.9, 0.1]);
  return g.build();
}
export function bloomGeometry() {
  const g = new Geo(), n = 5;
  for (let i = 0; i < n; i++) {
    const a0 = i / n * Math.PI * 2, a1 = (i + 1) / n * Math.PI * 2, am = (a0 + a1) / 2;
    const O = (a, r, z) => [Math.cos(a) * r, Math.sin(a) * r, z];
    g.kind(0, 0, 0.2);
    g.col([1, 1, 1]); const o0 = O(a0 + 0.1, 0.86, 0), o1 = O(am, 1.08, 0.1), o2 = O(a1 - 0.1, 0.86, 0), i0 = O(a0, 0.46, 0.36), i1 = O(a1, 0.46, 0.36);
    g.quad(i0, o0, o1, O(am, 0.5, 0.4), [0.62, 0.62, 0.62], [1, 1, 1]); g.quad(O(am, 0.5, 0.4), o1, o2, i1, [1, 1, 1], [0.62, 0.62, 0.62]);
    g.col([0.4, 0.4, 0.4]); g.tri(O(a0, 0.46, 0.36), O(a1, 0.46, 0.36), [0, 0, 0.12]);
  }
  return g.build();
}
export function tulipGeometry() {
  const g = new Geo();
  g.kind(0, 0.04, 0.25).col([1, 1, 1]); g.lathe(0, 0, 0, [[0.05, 1.0], [0.3, 1.2], [0.33, 1.5], [0.24, 1.78]], 5, { colors: [[0.7, 0.78, 0.6], [0.9, 0.9, 0.86], [1, 1, 1], [1, 1, 1]] });
  g.kind(0, 0, 0.1).col([0.1, 0.32, 0.1]); g.quad([-0.04, 0, 0], [0.04, 0, 0], [0.04, 1.02, 0], [-0.04, 1.02, 0]); g.quad([0, 0, -0.04], [0, 0, 0.04], [0, 1.02, 0.04], [0, 1.02, -0.04]);
  g.col([0.08, 0.26, 0.09]); g.tri([0, 0, 0], [0.34, 0.5, 0.1], [0.2, 0.95, 0.3]); g.tri([0, 0, 0], [-0.3, 0.45, -0.14], [-0.22, 0.85, -0.3]);
  return g.build();
}
export function makeBlooms(zone, geometry, list) {
  const n = list.length, g = new THREE.InstancedBufferGeometry(); g.setIndex(geometry.index); for (const k in geometry.attributes) g.setAttribute(k, geometry.attributes[k]);
  const iA = new Float32Array(n * 4), iB = new Float32Array(n * 4), iC = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) { const q = list[i]; iA.set([q.p[0], q.p[1], q.p[2], q.size], i * 4); iB.set([q.c[0], q.c[1], q.c[2], q.gate + q.ph * 0.98], i * 4); iC.set([q.yaw, q.tilt, q.roll, q.thr || 0], i * 4); }
  g.setAttribute('iA', new THREE.InstancedBufferAttribute(iA, 4)); g.setAttribute('iB', new THREE.InstancedBufferAttribute(iB, 4)); g.setAttribute('iC', new THREE.InstancedBufferAttribute(iC, 4));
  g.instanceCount = n; g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
  const m = new THREE.ShaderMaterial({
    uniforms: { ...zone.U }, vertexColors: true, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      attribute vec4 iA, iB, iC; uniform mat4 uW2L; uniform float uBall, uTime;
      varying vec3 vP, vN, vC, vEye; varying float vDist;
      vec3 rX(vec3 p, float a){ float c = cos(a), s = sin(a); return vec3(p.x, c * p.y - s * p.z, s * p.y + c * p.z); }
      vec3 rY(vec3 p, float a){ float c = cos(a), s = sin(a); return vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z); }
      vec3 rZ(vec3 p, float a){ float c = cos(a), s = sin(a); return vec3(c * p.x - s * p.y, s * p.x + c * p.y, p.z); }
      void main(){
        float gate = floor(iB.w), ph = fract(iB.w) * 1.0204, size = iA.w, tilt = iC.y, roll = iC.z;
        vec3 c = iA.xyz, out1 = vec3(sin(iC.x), 0., cos(iC.x));
        if (gate > 3.5) {
          c.y = .2 + ph * .25;
          c += out1 * (1.2 + 5. * fract(ph * 5.3) + iC.w);
          // (it stirs where it lies, on the world's clock, from its own phase)
          tilt += 5. + 7. * ph + .16 * sin(uTime * 1.3 + ph * 40.); roll += 4. + .22 * sin(uTime * .9 + ph * 23.); size *= .6;
        } else if (gate > 2.5) {
          float Tp = 7. + 5. * fract(ph * 3.7), q = fract(uBall / Tp + ph);
          c.y = mix(iA.y, .3, q);
          c.x += sin(uBall * .6 + ph * 40.) * 1.1; c.z += cos(uBall * .5 + ph * 31.) * 1.1;
          tilt += uBall * (.9 + ph); roll += uBall * .7;
          size *= smoothstep(0., .04, q) * (1. - smoothstep(.94, 1., q));
        } else if (gate > .5) {
          float Tp = 9. + 7. * fract(ph * 3.7), q = fract(uBall / Tp + ph * 7.);
          float k = smoothstep(.5, .78, q), fall = k * k;
          c.y = mix(iA.y, .2 + ph * .25, fall);
          c += out1 * (sin(k * 1.5708) * (1.2 + 5. * fract(ph * 5.3) + iC.w)) + vec3(out1.z, 0., -out1.x) * (sin(k * 7. + ph * 20.) * .9 * (1. - k) * step(.001, k));
          tilt += k * (5. + 7. * ph); roll += k * 4.;
          size *= mix(1., .6, k) * smoothstep(0., .05, q) * (1. - smoothstep(.93, 1., q));
        } else {
          tilt += sin(uTime * 1.3 + ph * 40.) * .07;
        }
        vec3 p = rY(rX(rZ(position * size, roll), tilt), iC.x), n = rY(rX(rZ(normal, roll), tilt), iC.x);
        vec3 lp = c + p;
        vP = lp; vN = n; vC = color * iB.rgb;
        vec4 mv = viewMatrix * (modelMatrix * vec4(lp, 1.));
        vDist = length(mv.xyz); vEye = (uW2L * vec4(cameraPosition, 1.)).xyz;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vP, vN, vC, vEye; varying float vDist;
      ${LIGHT_GLSL}
      void main(){
        vec3 V = normalize(vEye - vP), N = normalize(vN); if (dot(N, V) < 0.) N = -N;
        vec3 spec; vec3 dif = hallLight(vP, N, V, 20., spec);
        gl_FragColor = vec4(hallFog(vC * (dif * 1.05 + .05) + spec * .08, vDist, vP), 1.);
      }`,
  });
  const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false;
  return mesh;
}
// the walls of flowers (roses on one hand, camellias on the other), the tulips of the threshold, the flowers that
// fall from the ceiling, the petals that lie over the far bay's floor. THE WALLS STAND WHOLE: from the first pool to
// the hall's end wall, and on along the walls of the gilded chambers behind it. Along the walls' tops a share of the
// blooms (by their own drawn phase) is on a round of its own on the ball's clock.
export async function buildFlowers(ctx, plan, zone, R, density = 1, route = null) {
  const group = new THREE.Group(), under = new THREE.Group(); under.scale.y = -1;
  const HW = BALL.HW, FH = BALL.FLOWERH, F0 = plan.forestLen, { B1, B2, B3, endWall: EW, roomFront: RF, colPitch: pitch } = plan, PL = ballPlaces(plan);
  const colOf = (side) => (side === plan.rosesSide ? ROSE : PINK);
  // the mass behind the blooms: the side walls to the end wall, and the lower two thirds of the gilded chambers' walls
  const gs = new Geo(), chFH = (c) => c.h * 0.66;
  for (const sx of [-1, 1]) {
    const x = sx * (HW - 0.05); gs.kind(12, 0.03, 0.1).col(colOf(sx)); gs.quad([x, 0, -B2], [x, 0, -EW], [x, FH, -EW], [x, FH, -B2]);
    for (const c of plan.chambers) if (c.gilt) { const xc = sx * (c.w - 0.06); gs.quad([xc, 0, -(c.d0 + 1.2)], [xc, 0, -c.d1], [xc, chFH(c), -c.d1], [xc, chFH(c), -(c.d0 + 1.2)]); }
  }
  const sideGeo = gs.build(), matSide = litMaterial(zone);
  group.add(new THREE.Mesh(sideGeo, matSide)); under.add(new THREE.Mesh(sideGeo, matSide));
  await ctx.yield();
  // blooms: each wall out of its own stream (the same deal as far as the end wall). A bloom of a wall's top two rows
  // whose own phase is under a third is on a round of its own: it lets go, falls to the wall's foot, and opens again
  const list = [], hue = (r, base) => (base === ROSE ? mulc(r.pick([ROSE, ROSE, [0.5, 0.02, 0.08], [0.85, 0.1, 0.2]]), r.range(0.8, 1.3)) : mulc(r.pick([PINK, PINK, [1, 0.86, 0.9], [0.95, 0.5, 0.66]]), r.range(0.8, 1.1)));
  const counts = { onWall: 0, round: 0, fallen: 0 };
  const tally = (gate) => { if (gate === 0) counts.onWall++; else if (gate === 1) counts.round++; else counts.fallen++; return gate; };
  for (const sx of [-1, 1]) {
    const r = sx === plan.rosesSide ? R.roses : R.camellias, base = colOf(sx);
    for (let d = B2 + 1.4, n = 0; d < EW - 1; d += 3, n++) {
      for (let y = 1.6; y < FH - 0.6; y += 2.8) {
        const off = r.range(0, 0.9), yy = y + r.range(-1, 1), dd = d + r.range(-1.1, 1.1), size = r.range(0.85, 1.3), c = hue(r, base), ph = r(), tilt = r.range(-0.45, 0.45), roll = r.range(0, 6.28);
        const gate = yy > FH - 5.2 && ph < 0.34 && dd < EW - 9 ? 1 : 0;
        list.push({ p: [sx * (HW - 0.4 - off), yy, -Math.min(dd, EW - 0.7)], size, c, gate: tally(gate), ph, yaw: -sx * Math.PI / 2, tilt, roll });
      }
      if (n % 30 === 29) await ctx.yield();
    }
  }
  await ctx.yield();
  // the gilded chambers' flower walls, out of the stream of the far bay's drawing in (all on their walls)
  for (const c of plan.chambers) if (c.gilt) for (const sx of [-1, 1]) {
    const r = R.frames, base = colOf(sx);
    for (let d = c.d0 + 2.8; d < c.d1 - 1.2; d += 3) for (let y = 1.6; y < chFH(c) - 0.6; y += 2.8) {
      const off = r.range(0, 0.7), yy = y + r.range(-1, 1), dd = d + r.range(-1.1, 1.1), size = r.range(0.85, 1.3), col = hue(r, base), ph = r(), tilt = r.range(-0.45, 0.45), roll = r.range(0, 6.28);
      list.push({ p: [sx * (c.w - 0.4 - off), yy, -dd], size, c: col, gate: tally(0), ph, yaw: -sx * Math.PI / 2, tilt, roll });
    }
  }
  await ctx.yield();
  // the flowers that fall from the ceiling, for ever, on the ball's clock. Each falls straight down its own course (it
  // sways 1.1 m about it): one whose course would pass through a thing that stands (a column and its capital, a
  // hanging chandelier, a fountain, the cat, the monkeys' shell) or within 2.5 m of the line is dropped after its draws.
  // THEY FALL ONLY BETWEEN THE FLOWER WALLS (the bay of the pools), where the walls' own blooms let go beside them:
  // one dealt among the nave's gold columns, where it would hang in the air against a column with nothing about it
  // that it could have come off, is dropped after its draws too.
  const stands = [];
  for (let k = 0; k < plan.naveBays; k++) for (const sx of [-1, 1]) stands.push([sx * BALL.COLX, B1 + (k + 0.5) * pitch, 3.6]);
  for (const q of plan.pools) for (const sx of [-1, 1]) stands.push([sx * 19, q.d + plan.poolPitch / 2 - 8, 5.2]);
  for (const [fx, fd, fk] of PL.fountains) stands.push([fx, fd, 4.8 * fk]);
  stands.push([PL.cat.x, PL.cat.d, 4.4], [-PL.s * PL.shellX, PL.monkD, PL.shellR + 0.3]);
  // (and only within 10 m of a flower wall, in the colour of that wall's flowers, beginning under the vault as it
  // stands over that place: a flower in the middle of the hall's air was a mark with nothing about it)
  const nFall = Math.round(420 * density), rf = R.falling;
  let fallers = 0;
  for (let i = 0; i < nFall; i++) {
    const d = rf.range(B1 + 10, B3 - 5), x = rf.sign() * rf.range(10.5, 30), top0 = d < B2 ? 33 : rf.range(34, 50), mixed = rf.chance(0.5);
    const top = Math.min(top0, BALL.VAULT2 + Math.sqrt(Math.max(HW * HW - x * x, 0)) - 1.5);
    const q = { p: [x, top, -d], size: rf.range(0.5, 0.85), c: hue(rf, colOf(Math.sign(x))), gate: 3, ph: rf(), yaw: rf.range(0, 6.28), tilt: rf.range(0, 6.28), roll: rf.range(0, 6.28) };
    const reach = 1.1 + q.size;
    void mixed;
    if (d < B2 + 4 || Math.abs(x) < HW - 10) continue;
    if (stands.some((st) => Math.hypot(x - st[0], d - st[1]) < st[2] + reach)) continue;
    if (route && !route.f2.keep('falling flower', x, 0, top + q.size, -d, reach)) continue;
    list.push(q); fallers++;
  }
  if (route) route.best['blooms on a round of their own'] = counts.round;
  await ctx.yield();
  const blooms = makeBlooms(zone, bloomGeometry(), list); blooms.name = 'blooms'; group.add(blooms);
  await ctx.yield();
  // the petals of the ball's flowers that lie over the far bay's floor, each where it was thrown (out of their own
  // stream, the same deal: a place across and a distance back out of the room's front), and stir there. One thrown
  // back past the end wall lies in the hall's own width; one that would lie in a thing that stands is dropped.
  const rpt = R.petals, nPet = Math.round(900 * density), EWR = ROOM.HALF - 0.6, pl = [];
  for (const sx of [-1, 1]) { for (let k = 0; k < 4; k++) stands.push([sx * BALL.COLX, B3 + (k + 0.5) * pitch, 3.5]); stands.push([sx * (plan.chambers[0].w + 3.4), EW - 2.4, 1.4]); }
  for (let i = 0; i < nPet; i++) {
    const x0 = rpt.range(-HW + 2, HW - 2) * EWR / HW, y = rpt.range(1.5, FH - 1), size = rpt.range(0.42, 0.78), thr = (5 + 62 * Math.pow(rpt(), 1.4)) * 1.5, zo = rpt.range(0.3, 0.8), c = hue(rpt, colOf(x0 > 0 ? 1 : -1)), ph = rpt(), tilt = rpt.range(-0.5, 0.5), roll = rpt.range(0, 6.28);
    const out = 1.2 + 5 * ((ph * 0.98 * 1.0204 * 5.3) % 1) + thr, dl = RF - zo - out, x = dl < EW ? x0 * 1.85 : x0;
    if (i % 300 === 299) await ctx.yield();
    if (dl < B3 + 4 || Math.abs(dl - EW) < 1.6 || stands.some((st) => Math.hypot(x - st[0], dl - st[1]) < st[2])) continue;
    pl.push({ p: [x, y, -RF + zo], size, c, gate: 4, ph, yaw: 0, tilt, roll, thr });
  }
  if (route) route.f2.noteBox('fallen blooms and petals where they lie', -HW, 0, -B2, HW, 1.6, -RF);
  const petals = makeBlooms(zone, petalGeometry(), pl); petals.name = 'petals'; group.add(petals);
  await ctx.yield();
  // the low walls of white tulips either side of the way in (14 m between them)
  const gp = new Geo(), tl = [], rt = R.tulips, D0 = F0 + 5, D1 = F0 + 9.4;
  for (const sx of [-1, 1]) {
    gp.kind(3, 0, 0.4).col([0.8, 0.76, 0.66]); gp.box(Math.min(sx * 7, sx * 31), 0, -D1, Math.max(sx * 7, sx * 31), 1.6, -D0, {});
    gp.kind(4, 0, 0.8).col(GILT); gp.box(Math.min(sx * 6.8, sx * 31.2), 1.3, -D1 - 0.2, Math.max(sx * 6.8, sx * 31.2), 1.62, -D0 + 0.2, { top: false });
    gp.kind(10, 0, 0).col([0.1, 0.07, 0.04]); gp.quad([Math.min(sx * 7.2, sx * 30.8), 1.63, -D0 - 0.2], [Math.max(sx * 7.2, sx * 30.8), 1.63, -D0 - 0.2], [Math.max(sx * 7.2, sx * 30.8), 1.63, -D1 + 0.2], [Math.min(sx * 7.2, sx * 30.8), 1.63, -D1 + 0.2]);
    const stepX = 0.8 / Math.sqrt(density);
    for (let x = 7.6; x < 30.6; x += stepX) for (let k = 0; k < 4; k++) tl.push({ p: [sx * (x + rt.range(-0.2, 0.2)), 1.6, -(D0 + 0.6 + k * 1.05 + rt.range(-0.2, 0.2))], size: rt.range(0.95, 1.35), c: [1, 1, 1], gate: 0, ph: rt(), yaw: rt.range(0, 6.28), tilt: rt.range(-0.14, 0.14), roll: 0 });
  }
  const mat = litMaterial(zone), planter = gp.build();
  group.add(new THREE.Mesh(planter, mat)); under.add(new THREE.Mesh(planter, mat));
  const tulips = makeBlooms(zone, tulipGeometry(), tl); group.add(tulips);
  await ctx.yield();
  return { group, under, blooms, petals, tulips, counts: { blooms: list.length, tulips: tl.length, petals: pl.length, bloomsOnWall: counts.onWall, bloomsOnRound: counts.round, fallingFlowers: fallers } };
}

// butterflies: two wings that beat, each on its own closed course about its own place (iA = place and size, iB = colour, phase)
export function makeButterflies(zone, list) {
  const n = list.length, g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, 0, -0.5, 1, 0, -0.7, 1.1, 0, 0.35, 0, 0, 0.5, 0, 0, -0.5, -1, 0, -0.7, -1.1, 0, 0.35, 0, 0, 0.5]), 3));
  g.setIndex([0, 1, 2, 0, 2, 3, 4, 6, 5, 4, 7, 6]);
  const iA = new Float32Array(n * 4), iB = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) { const q = list[i]; iA.set([q.p[0], q.p[1], q.p[2], q.size], i * 4); iB.set([q.c[0], q.c[1], q.c[2], q.ph], i * 4); }
  g.setAttribute('iA', new THREE.InstancedBufferAttribute(iA, 4)); g.setAttribute('iB', new THREE.InstancedBufferAttribute(iB, 4));
  g.instanceCount = n; g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
  const m = new THREE.ShaderMaterial({
    uniforms: { ...zone.U }, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      attribute vec4 iA, iB; uniform float uBall; uniform mat4 uW2L; varying vec3 vP, vC, vEye; varying vec2 vW; varying float vDist;
      void main(){
        float ph = iB.w, t = uBall, w1 = .5 + ph * .4, w2 = .8 + fract(ph * 3.1) * .5, w3 = .4 + fract(ph * 7.7) * .4, p1 = ph * 40., p2 = ph * 23., p3 = ph * 61.;
        vec3 c = iA.xyz + vec3(sin(t * w1 + p1) * 2.4, sin(t * w2 + p2) * 1.1, sin(t * w3 + p3) * 2.4);
        vec2 vel = vec2(cos(t * w1 + p1) * w1, cos(t * w3 + p3) * w3); float l = max(length(vel), 1e-3); vel /= l;
        float a = sin(t * 15. + ph * 50.) * 1.0 + .35;
        vec3 p = vec3(position.x * cos(a), abs(position.x) * sin(a), position.z) * iA.w;
        // the body lies along its course: local +z to (vel.x, 0, vel.y)
        vec3 lp = c + vec3(p.x * vel.y + p.z * vel.x, p.y, -p.x * vel.x + p.z * vel.y);
        vP = lp; vC = iB.rgb; vW = vec2(abs(position.x), position.z);
        vec4 mv = viewMatrix * (modelMatrix * vec4(lp, 1.));
        vDist = length(mv.xyz); vEye = (uW2L * vec4(cameraPosition, 1.)).xyz;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vP, vC, vEye; varying vec2 vW; varying float vDist;
      ${LIGHT_GLSL}
      void main(){
        vec3 V = normalize(vEye - vP); vec3 spec; vec3 dif = hallLight(vP, vec3(0., 1., 0.), V, 10., spec);
        // a wing is two lobes, the fore one long and the hind one round; outside them nothing is drawn but the body
        float f = min(length((vW - vec2(.5, -.3)) / vec2(.5, .3)), length((vW - vec2(.4, .2)) / vec2(.4, .24)));
        if (f > 1. && vW.x > .06) discard;
        float edge = smoothstep(.62, 1., f) + (1. - smoothstep(.0, .12, vW.x));
        float eyeSpot = 1. - smoothstep(.07, .12, length(vW - vec2(.62, -.3)));
        vec3 col = mix(vC, vec3(.03, .02, .02), clamp(edge + eyeSpot * .8, 0., 1.) * .85);
        gl_FragColor = vec4(hallFog(col * (dif * .9 + .12), vDist, vP), 1.);
      }`,
  });
  const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false;
  return mesh;
}
// the conductor: a gentleman with his back to the hall, the baton arm (aux.w = 1) beating with the bows
export function conductorGeometry() {
  const g = new Geo(); man(g, 1);
  g.kind(0, 0, 0.3, 1).col(BLACK); g.box(0.72, 3.36, 0.1, 0.98, 3.66, 1.3, { bottom: true });
  g.kind(0, 0.3, 0.2, 1).col(WHITE); g.box(0.82, 3.56, 1.3, 0.88, 3.62, 2.5, { bottom: true });
  return actorGeometry(g);
}

// ---------------------------------------------------------------- the line, for the test of clearance
// The route sampled every metre in the two frames of the place. A builder asks, for each thing it would set down with
// its own measures and its motion at its fullest (an upright drum of a girth and a height, or a box), how near the line comes;
// keep() says whether the thing may stand (2.5 m clear or more) and the nearest of each kind is written down.
// BEHIND THE ENTRY: a world entered through a portal is first drawn by a camera that flies the route's first tangent
// continued backward, level. The line of F1 therefore begins BACK metres behind the route's first point, and every
// test of clearance counts that stretch too; route.back is that stretch alone, for what may not rise across the view
// there (nothing over the eye's line within TUBE metres of the axis) and for the wider room that camera is owed the
// farther back it is (15 m in 340: 2.8 m at 64 m; chimneys and wires keep NEARBACK metres off that stretch).
export const BACK = 64, TUBE = 10, NEARBACK = 3.4;
export function makeRoute(film) {
  const N = Math.ceil(film.LEN), a = [], b = [], back = [];
  const p0 = film.S[0], p1 = film.at(0.05), tl = Math.hypot(p1.x1 - p0.x1, p1.z1 - p0.z1) || 1, tx = (p1.x1 - p0.x1) / tl, tz = (p1.z1 - p0.z1) / tl;
  for (let k = BACK; k >= 1; k--) { const q = [p0.x1 - tx * k, p0.y, p0.z1 - tz * k]; a.push(q); back.push(q); }
  back.push([p0.x1, p0.y, p0.z1]);
  for (let m = 0; m <= N; m++) {
    const p = film.S[m];
    if (m <= film.M.f2 + 12) a.push([p.x1, p.y, p.z1]);
    if (m >= film.M.turn) b.push([p.xl, p.y - ST.GY, -p.d]);
  }
  const best = {};
  const mk = (pts) => {
    const n = pts.length;
    const first = (z) => { let lo = 0, hi = n; while (lo < hi) { const mid = (lo + hi) >> 1; if (pts[mid][2] > z) lo = mid + 1; else hi = mid; } return lo; };
    // the line is kept as a point a metre: between two of them it may pass a thing nearer than either point does, by
    // no more than the root of (g squared less a quarter); every measure is given as that least
    const between = (g) => (g > 90 ? g : Math.sqrt(Math.max(g * g - 0.25, 0)));
    const gap = (x, y0, y1, z, r) => {
      let g = 99;
      for (let i = Math.max(first(z + r + 8) - 1, 0); i < n && pts[i][2] >= z - r - 8; i++) {
        const p = pts[i], dx = p[0] - x, dz = p[2] - z, dy = p[1] < y0 ? y0 - p[1] : p[1] > y1 ? p[1] - y1 : 0;
        g = Math.min(g, Math.hypot(Math.max(Math.hypot(dx, dz) - r, 0), dy));
      }
      return between(g);
    };
    const gapBox = (x0, y0, z0, x1, y1, z1) => {
      let g = 99;
      for (let i = Math.max(first(Math.max(z0, z1) + 8) - 1, 0); i < n && pts[i][2] >= Math.min(z0, z1) - 8; i++) {
        const p = pts[i], dx = Math.max(Math.min(x0, x1) - p[0], 0, p[0] - Math.max(x0, x1)), dy = Math.max(Math.min(y0, y1) - p[1], 0, p[1] - Math.max(y0, y1)), dz = Math.max(Math.min(z0, z1) - p[2], 0, p[2] - Math.max(z0, z1));
        g = Math.min(g, Math.hypot(dx, dy, dz));
      }
      return between(g);
    };
    const mark = (kind, g) => { best[kind] = Math.min(best[kind] ?? 99, Math.round(g * 100) / 100); return g; };
    // the line's least distance to a point (every metre of the line within span metres along the hall is tried)
    const dist = (x, y, z, span = 70) => {
      let g = 999;
      for (let i = Math.max(first(z + span) - 1, 0); i < n && pts[i][2] >= z - span; i++) { const p = pts[i]; g = Math.min(g, Math.hypot(p[0] - x, p[1] - y, p[2] - z)); }
      return g > 900 ? g : Math.sqrt(Math.max(g * g - 0.25, 0));
    };
    return {
      gap, gapBox, dist,
      keep(kind, x, y0, y1, z, r) { const g = gap(x, y0, y1, z, r); if (g < 2.5) { best[kind + ' (not set down)'] = (best[kind + ' (not set down)'] || 0) + 1; return false; } mark(kind, g); return true; },
      note(kind, x, y0, y1, z, r) { return mark(kind, gap(x, y0, y1, z, r)); },
      noteBox(kind, x0, y0, z0, x1, y1, z1) { return mark(kind, gapBox(x0, y0, z0, x1, y1, z1)); },
    };
  };
  // the line's place in the halls of F2 at d metres in: [x, height]
  const lineAt = (d) => { let lo = 0, hi = b.length - 1; while (lo < hi) { const mid = (lo + hi) >> 1; if (-b[mid][2] < d) lo = mid + 1; else hi = mid; } return b[lo]; };
  return { f1: mk(a), f2: mk(b), back: mk(back), best, lineAt, f1p: (m) => a[Math.min(Math.max(Math.round(m) + BACK, 0), a.length - 1)] };
}

// ---------------------------------------------------------------- the ballroom's company
// Dancers (set down by trial out of their own stream: clear of every standing thing, of each other and of the line),
// the orchestra on its terrace, the conductor, the monkeys' band, chandeliers, butterflies.
export async function buildBallLife(ctx, plan, zone, R, density, route, PL) {
  const group = new THREE.Group(), under = new THREE.Group(); under.scale.y = -1;
  const HW = BALL.HW, F0 = plan.forestLen, { B1, B2, B3, roomFront: RF, colPitch: pitch } = plan, s = PL.s, P = plan.POOL, T2 = route.f2;
  const GOWNS = ['#ffffff', '#f6a6c0', '#c2183a', '#ffd98a', '#8a4bff', '#e8f0ff', '#1f6a52', '#28306e', '#f1e3c8'].map(lin);
  // may a pair turn about (x, d) on a ring of radius r?
  const free = (x, d, r) => {
    const reach = r + 2.1, ax = Math.abs(x);
    if (ax + reach > Math.min(HW, plan.shellAt(d + reach)[0]) - 2.2) return false;
    if (d < B2 || d > B3) { if (Math.abs(ax - BALL.COLX) < 4.2 + reach) return false; }
    if (d < B2 + 2) {
      if (d - reach < F0 + 12) return false;
      if (x * s + reach > PL.tierX - 4.6 && d + reach > PL.orchD - 3 && d - reach < PL.orchD + PL.orchLen + 3) return false;
      if (Math.abs(ax - 19.2) < 1.6 + reach) return false;
    } else if (d < B3 + 1) {
      for (const q of plan.pools) if (ax - reach < P.half + 2.4 && Math.abs(d - q.d) - reach < P.len / 2 + 2.4) return false;
      for (const [fx, fd, fk] of PL.fountains) if (Math.hypot(x - fx, d - fd) < 4.9 * fk + reach) return false;
      if (-x * s + reach > 12.4 && Math.abs(d - PL.monkD) - reach < 12) return false;
      if (Math.hypot(x - PL.cat.x, d - PL.cat.d) < 4.6 + reach) return false;
    } else {
      // the far bay and the chambers behind its end wall: clear of the portal's candle stands and of the end wall
      // itself, and no pair turns in the papered chamber's last metres before the room
      if (d + reach > RF - 9) return false;
      if (d - reach < plan.endWall + 1.4 && d + reach > plan.endWall - 4.2 && ax + reach > plan.chambers[0].w - 2.2) return false;
    }
    return true;
  };
  // the same count of trials on every visit; on a crowded night the pairs stand closer
  const rd = R.dancers, tries = 6000, sep = 4.3 + 3 * clamp(1.3 - density, 0, 0.6), set = [], iA = [[], []], iB = [[], []];
  for (let i = 0; i < tries; i++) {
    if (i % 400 === 399) await ctx.yield();
    const x = rd.range(-HW, HW), d = rd.range(F0 + 12, RF - 8), r = rd.range(0.5, 1.7), ph = rd(), col = rd.pick(GOWNS), size = rd.range(0.93, 1.07), v = rd.int(0, 1);
    if (!free(x, d, r)) continue;
    let ok = true;
    for (const o of set) if (Math.abs(o.d - d) < 12 && Math.hypot(o.x - x, o.d - d) < o.r + r + sep) { ok = false; break; }
    if (!ok) continue;
    if (!T2.keep('dancer', x, 0, 5.3 * size, -d, r + 2.1 * size + 0.1)) continue;
    set.push({ x, d, r });
    iA[v].push(x, -d, r, ph); iB[v].push(col[0], col[1], col[2], size);
  }
  await ctx.yield();
  // (each pair's image under the polished floor is of the plain make; a soft shade lies under every pair)
  const dancers = [], plain = farPairGeometry('waltz');
  for (let v = 0; v < 2; v++) {
    const a = makeActors(zone, pairGeometry('waltz', v), 1, new Float32Array(iA[v]), new Float32Array(iB[v]), { mirror: true, mirrorGeometry: plain, shade: [2.3, 1.7] });
    a.mesh.frustumCulled = false; a.mirror.frustumCulled = false; a.mesh.name = 'dancers'; a.shade.name = 'shade'; group.add(a.mesh); group.add(a.mirror); group.add(a.shade); dancers.push(a);
  }
  await ctx.yield();
  // the orchestra: five tiers of players facing the hall, every bow drawn together; the conductor before them
  const ro = R.orch, pA = [[], [], []], pB = [[], [], []], perTier = 25;
  let seated = 0;
  for (let k = 0; k < PL.tiers; k++) for (let j = 0; j < perTier; j++) {
    const v = ro.int(0, 2), sz = ro.range(0.95, 1.05), jz = ro.range(-0.12, 0.12);
    // (a player whose chair would stand in a column's foot is dropped after its draws)
    const px = PL.tierX + PL.tierW * (k + 0.5), pd = PL.orchD + 1.6 + j * (PL.orchLen - 3.2) / (perTier - 1) + jz;
    let inCol = false;
    for (let c = 0; c < plan.naveBays; c++) if (Math.hypot(Math.max(Math.abs(BALL.COLX - px) - 0.75, 0), Math.max(Math.abs(B1 + (c + 0.5) * pitch - pd) - 0.75, 0)) < 3.3) inCol = true;
    if (inCol) continue;
    pA[v].push(s * px, PL.tierY + PL.tierH * k, -pd, -s * Math.PI / 2); pB[v].push(1, 1, 1, sz); seated++;
  }
  const players = [];
  for (let v = 0; v < 3; v++) { const a = makeActors(zone, playerGeometry(v), 2, new Float32Array(pA[v]), new Float32Array(pB[v])); a.mesh.frustumCulled = false; group.add(a.mesh); players.push(a); }
  const cond = makeActors(zone, conductorGeometry(), 2, new Float32Array([s * (PL.tierX - 2.6), 1.4, -(PL.orchD + PL.orchLen / 2), s * Math.PI / 2]), new Float32Array([1, 1, 1, 1]));
  cond.mesh.frustumCulled = false; group.add(cond.mesh);
  T2.noteBox('orchestra on its terrace', s * (PL.tierX - 1.6), 0, -PL.orchD, s * (PL.tierX + PL.tierW * PL.tiers), PL.tierY + PL.tierH * (PL.tiers - 1) + 3.9, -(PL.orchD + PL.orchLen));
  T2.note('conductor', s * (PL.tierX - 2.6), 0, 6.3, -(PL.orchD + PL.orchLen / 2), 2.7);
  await ctx.yield();
  // the monkeys' band on its stage
  const rm = R.monkeys, mA = [[], [], []], mB = [[], [], []], m = -s;
  for (let row = 0; row < 3; row++) for (let j = 0; j < 6; j++) {
    // (the band stands within its shell: three rows of six, under the dome's rise)
    const v = (j + row) % 3, x = m * (15.2 + 3.8 * row), z = -(PL.monkD - 7.0 + j * 2.55 + (row % 2) * 1.275), yaw = -m * Math.PI / 2 + rm.range(-0.3, 0.3), sz = rm.range(0.9, 1.12);
    mA[v].push(x, 2.2, z, yaw); mB[v].push(1, 1, 1, sz);
    T2.note('monkey', x, 2.2, 2.2 + 4.5 * sz, z, 2.0 * sz);
  }
  const monkeys = [];
  for (let v = 0; v < 3; v++) { const a = makeActors(zone, monkeyGeometry(v), 3, new Float32Array(mA[v]), new Float32Array(mB[v])); a.mesh.frustumCulled = false; group.add(a.mesh); monkeys.push(a); }
  T2.note('monkeys\' stage and shell', m * PL.shellX, 0, 2.2 + PL.shellR, -PL.monkD, PL.shellR + 0.6);
  await ctx.yield();
  return { group, under, dancers, players, cond, monkeys, pairs: set.length };
}

// chandeliers of the ballroom (they sway on their chains; their image sways under the floor), butterflies about the
// fountains and the flowers, and the measures of everything that stands, written down against the line
export async function buildBallAir(ctx, plan, zone, R, density, route, PL) {
  const group = new THREE.Group(), under = new THREE.Group(); under.scale.y = -1;
  const { B1, B2, B3, endWall: EW, colPitch: pitch } = plan, P = plan.POOL, T2 = route.f2, HW = BALL.HW;
  const rc = R.chand2, list = [], TOP = 44;
  const hang = (x, y, d, k) => list.push({ x, y, z: -d, s: k, a: rc.range(0, 6.28), w: rc.range(0.5, 0.8), p: rc.range(0, 6.28) });
  for (let k = 0; k <= plan.naveBays; k++) hang(0, 27, B1 + k * pitch, k % 2 ? 1.0 : 1.25);
  for (const q of plan.pools) { hang(0, 34, q.d, 1.5); for (const sx of [-1, 1]) hang(sx * 19, 26, q.d + plan.poolPitch / 2 - 8, 1.0); }
  // the far bay keeps the hall's chandeliers to its end, and one hangs in each of the gilded chambers it draws in by
  hang(0, 27, B3 + pitch, 1.25);
  for (const c of plan.chambers) if (c.gilt) hang(0, c.h - 15 * c.lamp, (c.d0 + c.d1) / 2, c.lamp);
  const mat = litMaterial(zone), cg = chandelierGeometry(4.4, TOP);
  const chand = new THREE.InstancedMesh(cg, mat, list.length), chandU = new THREE.InstancedMesh(cg, mat, list.length);
  chandU.instanceMatrix = chand.instanceMatrix; chand.frustumCulled = false; chandU.frustumCulled = false;
  const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), sv = new THREE.Vector3();
  const sway = (time) => {
    for (let i = 0; i < list.length; i++) {
      const c = list[i], ax = Math.sin(time * c.w + c.p) * 0.012, az = Math.cos(time * c.w * 0.83 + c.p * 1.7) * 0.012;
      e.set(ax, c.a, az); q4.setFromEuler(e);
      v.set(0, -TOP * c.s, 0).applyQuaternion(q4); v.x += c.x; v.y += c.y + TOP * c.s; v.z += c.z;
      chand.setMatrixAt(i, m4.compose(v, q4, sv.set(c.s, c.s, c.s)));
    }
    chand.instanceMatrix.needsUpdate = true;
  };
  sway(0); group.add(chand); under.add(chandU);
  const glows = [];
  for (const c of list) { glows.push({ p: [c.x, c.y + 3.2 * c.s, c.z], size: 30 * c.s, c: mulc(CANDLE, 0.26), kind: 1, phase: c.p / 6.3, what: 'halo of a chandelier' }); T2.note('chandelier', c.x, c.y - 1.5 * c.s, c.y + TOP * c.s, c.z, 4.6 * c.s + 0.8); }
  await ctx.yield();
  // butterflies
  const rb = R.butterflies, nb = Math.round(90 * density), bl = [], BCOL = [[1, 0.8, 0.15], [0.2, 0.5, 1.0], [1, 1, 0.95], [1, 0.4, 0.1], [0.5, 0.9, 0.5]];
  for (let i = 0; i < nb; i++) {
    const x = rb.sign() * rb.range(9.5, 30), y = rb.range(3, 15), d = rb.range(B2 + 5, B3 - 3), size = rb.range(0.5, 0.9), c = rb.pick(BCOL), ph = rb();
    if (!T2.keep('butterfly', x, y - 1.1 - size, y + 1.1 + size, -d, 2.4 + 1.1 * size)) continue;
    bl.push({ p: [x, y, -d], size, c, ph });
  }
  const butterflies = makeButterflies(zone, bl); butterflies.name = 'butterflies'; group.add(butterflies);
  await ctx.yield();
  // what stands, against the line
  for (let k = 0; k < plan.naveBays; k++) for (const sx of [-1, 1]) T2.note('column', sx * BALL.COLX, 0, BALL.BEAM, -(B1 + (k + 0.5) * pitch), 4.0);
  for (const [x, d, k] of PL.fountains) { T2.note('fountain', x, 0, 8.3 * k, -d, 4.8 * k); T2.note('fountain\'s jets', x, 5.6 * k, 13.4 * k, -d, 4.0 * k); }
  T2.note('the cat', PL.cat.x, 0, 11.5 * PL.cat.k, -PL.cat.d, 4.4);
  for (const q of plan.pools) {
    T2.noteBox('pool rim and spray', -P.half - 1.5, 0, -(q.d - P.len / 2 - 1.5), P.half + 1.5, POOLY + 2.5, -(q.d + P.len / 2 + 1.5));
    for (const sx of [-1, 1]) for (const dz of [-1, 1]) T2.note('candles at a pool', sx * (P.half + 0.6), POOLKERB, POOLKERB + 4.2, -(q.d + dz * (P.len / 2 - 0.6)), 1.7);
  }
  for (const sx of [-1, 1]) {
    T2.noteBox('flower wall and its falling blooms', sx * (HW - 8.8), 0, -B2, sx * HW, BALL.FLOWERH + 1, -EW);
    T2.noteBox('tulips', sx * 6.8, 0, -(plan.forestLen + 4.8), sx * 31.2, 4.1, -(plan.forestLen + 9.6));
    T2.noteBox('candle stands of the nave', sx * 17.6, 0, -B1, sx * 20.8, 10, -B2);
  }
  T2.noteBox('vaults', -HW, BALL.VAULT2, -plan.forestLen, HW, 70, -EW);
  return { group, under, sway, glows, chand, butterflies, counts: { chandeliers: list.length, butterflies: bl.length } };
}

// ---------------------------------------------------------------- THE SMALL SITTING ROOM (frame F2, the far end)
// What the hall draws in to, AS IT STANDS: behind the end wall's portal three chambers, each a plain box smaller than
// the last (two gilded, with the flower walls carried on under wine-red paper in gilt diamonds and a coffered ceiling;
// the third papered like the room, with pictures and sconces), and then the sitting room itself at its great size,
// warm and full: patterned paper over a wooden dado, a coffered ceiling, a curtained window with the hour inside in
// its panes, a tall looking glass that shows the ball's lights, a piano with its candles, a laid table under a hanging
// lamp, vases of the ball's flowers, a lamp on a table by an armchair, a sofa, a cupboard, a tall clock, a wide carpet,
// pictures; and in the far wall the doorway, the room's brightest thing, its door standing open. Nothing of it moves
// but the curtains, the flames and the pendulum.
export async function buildRoom(ctx, plan, zone, R, route) {
  const group = new THREE.Group(), mat = litMaterial(zone), rr = R.room, T2 = route.f2;
  const H = ROOM.H, HWR = ROOM.HALF, RF = plan.roomFront, DE = plan.dEnd, zE = -DE, PAPER = [0.4, 0.2, 0.1], WINE = [0.36, 0.1, 0.08], WOOD = [0.2, 0.1, 0.05];
  const FIELDS = [[0.1, 0.16, 0.12], [0.2, 0.12, 0.08], [0.1, 0.12, 0.2], [0.22, 0.2, 0.12]], flames = [];
  const h = rr.sign(), chair = rr.pick([[0.32, 0.05, 0.07], [0.1, 0.2, 0.14], [0.12, 0.14, 0.3]]), lampD = DE - rr.range(24, 30), pics = rr.int(2, 4), sofaD = DE - rr.range(34, 40);
  // the shell: the three chambers behind the hall's end wall and the room itself, each a plain box of its own width
  // and height (plan.chambers; the room 34 m by 20 m), a framed opening where one gives way to the next
  let g = new Geo();
  const secs = plan.chambers.map((c, i) => ({ ...c, a: i === 0 ? c.d0 + 1.2 : c.d0 })).concat([{ d0: RF, a: RF, d1: DE, w: HWR, h: H, gilt: false, room: true }]);
  const rect = (x0, y0, x1, y1, z) => g.quad([x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z]);
  // a flat coffered ceiling (kind 7: aux.w = the way across it)
  const coffer = (w, y, dA, dB, c) => {
    g.col(c); g.kind(7, 0, 0.2, -w); const i0 = g.v(-w, y, -dA, 0, -1, 0), i3 = g.v(-w, y, -dB, 0, -1, 0);
    g.kind(7, 0, 0.2, w); const i1 = g.v(w, y, -dA, 0, -1, 0), i2 = g.v(w, y, -dB, 0, -1, 0); g.I.push(i0, i1, i2, i0, i2, i3);
  };
  // a picture in a gilt frame on a side wall (a dark field of colour, paler to its top; nothing written), a sconce
  const picture = (x, sx, cy, zc, pw, phh, k) => {
    g.kind(4, 0, 0.8).col(GILT, 0.9); g.box(Math.min(x, x - sx * 0.3), cy - phh - 0.35, zc - pw - 0.35, Math.max(x, x - sx * 0.3), cy + phh + 0.35, zc + pw + 0.35, {});
    g.kind(0, 0, 0.3).col(FIELDS[k % 4]); g.quad([x - sx * 0.32, cy - phh, zc - pw], [x - sx * 0.32, cy - phh, zc + pw], [x - sx * 0.32, cy + phh, zc + pw], [x - sx * 0.32, cy + phh, zc - pw], null, [0.36, 0.34, 0.3]);
  };
  const sconce = (x, sx, y, zc, ph) => {
    g.kind(4, 0, 0.8).col(GILT); g.box(Math.min(x, x - sx * 0.2), y - 1.4, zc - 0.5, Math.max(x, x - sx * 0.2), y + 0.6, zc + 0.5, {});
    for (const dz of [-0.9, 0.9]) {
      g.kind(4, 0, 0.8).col(GILT); g.box(Math.min(x, x - sx * 1.2), y - 0.2, zc + dz - 0.08, Math.max(x, x - sx * 1.2), y, zc + dz + 0.08, { bottom: true });
      g.kind(0, 0.25, 0.2).col([0.9, 0.84, 0.7]); g.cbox(x - sx * 1.1, y, zc + dz, 0.22, 1.1, 0.22, {});
      flames.push({ p: [x - sx * 1.1, y + 1.5, zc + dz], size: 1.3, c: mulc(CANDLE, 3), kind: 0, phase: (ph + dz * 0.21 + 1) % 1 });
    }
    flames.push({ p: [x - sx * 1.1, y + 1.5, zc], size: 7, c: mulc(CANDLE, 0.22), kind: 1, phase: ph, what: 'sconce of the papered walls' });
  };
  for (let i = 0; i < secs.length; i++) {
    const c = secs[i], w = c.w, hh = c.h, za = -c.a, zb = -c.d1, band = c.gilt ? hh * 0.66 : 3.6 * hh / H;
    for (const sx of [-1, 1]) {
      const x = sx * w;
      if (c.gilt) {
        // a gilded chamber: the flower wall to two thirds of its height (the flowers' own builder), a gilt band over
        // it, wine-red paper in gilt diamonds above
        g.kind(18, 0, 0.1).col(WINE); g.quad([x, 0, za], [x, 0, zb], [x, hh, zb], [x, hh, za]);
        g.kind(4, 0, 0.8).col(GILT); g.box(Math.min(x, x - sx * 0.7), band, zb, Math.max(x, x - sx * 0.7), band + 1.0, za, { bottom: true });
      } else {
        g.kind(18, 0, 0.1).col(PAPER); g.quad([x, band, za], [x, band, zb], [x, hh, zb], [x, hh, za]);
        g.kind(9, 0, 0.3).col(WOOD, 1.2); g.quad([x, 0, za], [x, 0, zb], [x, band, zb], [x, band, za]); g.box(Math.min(x, x - sx * 0.25), band - 0.15, zb, Math.max(x, x - sx * 0.25), band + 0.2, za, { bottom: true });
      }
      // a gilt cornice under the ceiling
      g.kind(4, 0, 0.8).col(GILT, c.gilt ? 1 : 0.8); g.box(Math.min(x, x - sx * 0.9), hh - 1.3, zb, Math.max(x, x - sx * 0.9), hh, za, { bottom: true });
      // the papered chamber's own things: two pictures and a sconce between them on either wall
      if (!c.gilt && !c.room) {
        const len = c.d1 - c.d0;
        picture(x, sx, band + 8.4, -(c.d0 + len * 0.26), 2.4, 3.2, sx > 0 ? 0 : 2); picture(x, sx, band + 8.4, -(c.d0 + len * 0.74), 2.4, 3.2, sx > 0 ? 1 : 3);
        sconce(x, sx, band + 6.6, -(c.d0 + len * 0.5), sx > 0 ? 0.13 : 0.61);
      }
    }
    coffer(w, hh, c.a, c.d1, c.gilt ? [0.5, 0.42, 0.34] : [0.9, 0.5, 0.26]);
    // the framed opening into the next: the wall about it, a gilt architrave standing proud of it
    if (i + 1 < secs.length) {
      const n = secs[i + 1], zf = -c.d1, aw = Math.min(0.9, w - n.w);
      g.kind(18, 0, 0.1).col(c.gilt ? WINE : PAPER); rect(-w, 0, -n.w, hh, zf); rect(n.w, 0, w, hh, zf); rect(-n.w, n.h, n.w, hh, zf);
      g.kind(4, 0, 0.8).col(GILT, n.room ? 0.85 : 1);
      for (const sx of [-1, 1]) g.box(Math.min(sx * n.w, sx * (n.w + aw)), 0, zf, Math.max(sx * n.w, sx * (n.w + aw)), n.h, zf + 0.5, {});
      g.box(-n.w - aw, n.h, zf, n.w + aw, n.h + 1.1, zf + 0.5, { bottom: true });
    }
    await ctx.yield();
  }
  T2.noteBox('the room\'s wall', -HWR, 0, -RF, -HWR + 0.1, H, zE); T2.noteBox('the room\'s ceiling', -HWR, H, -RF, HWR, H + 0.1, zE);
  // the window of the wall opposite the lamp: the hour inside in its panes (uVis), glass in gilt bars, curtains drawn
  // back under a gilt pelmet
  const wx = -h * (HWR - 0.06), wz = -(DE - 26);
  { g.kind(19, 0, 0.9, 5).col([1, 1, 1]); const i0 = g.v(wx, 5, wz - 3.6, h, 0, 0), i1 = g.v(wx, 5, wz + 3.6, h, 0, 0); g.kind(19, 0, 0.9, 15.5); const i2 = g.v(wx, 15.5, wz + 3.6, h, 0, 0), i3 = g.v(wx, 15.5, wz - 3.6, h, 0, 0); g.I.push(i0, i1, i2, i0, i2, i3); }
  g.kind(4, 0, 0.8).col(GILT, 0.9); g.box(Math.min(wx, wx + h * 1.3), 16.5, wz - 7.4, Math.max(wx, wx + h * 1.3), 17.7, wz + 7.4, { bottom: true });
  g.kind(9, 0, 0.3).col([0.6, 0.56, 0.48]);
  for (const zz of [wz - 3.8, wz, wz + 3.8]) g.box(Math.min(wx, wx + h * 0.3), 4.8, zz - 0.2, Math.max(wx, wx + h * 0.3), 15.7, zz + 0.2, {});
  for (const yy of [4.6, 10.2, 15.5]) g.box(Math.min(wx, wx + h * 0.3), yy, wz - 3.8, Math.max(wx, wx + h * 0.3), yy + 0.4, wz + 3.8, {});
  // its curtains, drawn back either side, stir in the dawn's draught
  const gc = new Geo(), CURT = [0.3, 0.1, 0.12];
  for (const dz of [-1, 1]) {
    const rows = [];
    for (let j = 0; j <= 8; j++) {
      const t = j / 8, y = 16.6 - t * 16.2, row = [];
      for (let i = 0; i <= 3; i++) { gc.a = [0, 0, 0.1, 0.5 * t]; row.push(gc.v(wx + h * (0.4 + 0.26 * Math.sin(i * 2.2 + j * 0.8) + 0.3 * t), y, wz + dz * (4.3 + i * 0.62 * (1 - 0.35 * Math.sin(Math.PI * t))), h, 0, 0, mulc(CURT, 0.8 + 0.3 * (i % 2)))); }
      rows.push(row);
    }
    for (let j = 0; j < 8; j++) for (let i = 0; i < 3; i++) gc.I.push(rows[j][i], rows[j][i + 1], rows[j + 1][i + 1], rows[j][i], rows[j + 1][i + 1], rows[j + 1][i]);
  }
  const shell = new THREE.Mesh(await g.buildA(ctx), mat); group.add(shell);
  shell.add(new THREE.Mesh(gc.build(), litMaterial(zone, { wind: true })));
  await ctx.yield();
  // the wall with the doorway: the shell closes on it
  g = new Geo();
  const WX = HWR + 0.5, WY = H + 0.5, dw = ROOM.DOORW / 2, dh = ROOM.DOORH;
  g.kind(18, 0, 0.1).col(PAPER); rect(-WX, 3.6, -dw, WY, zE); rect(dw, 3.6, WX, WY, zE); rect(-dw, dh, dw, WY, zE);
  g.kind(9, 0, 0.3).col(WOOD, 1.2); rect(-WX, 0, -dw, 3.6, zE); rect(dw, 0, WX, 3.6, zE);
  // the doorway's architrave: pale paint that the light in the doorway stands on (its own glow), a gilt bead about it
  // and a gilt cornice over its head; a ring of soft glow about the frame (about the opening, never across it)
  g.kind(0, 0.55, 0.3).col([1, 0.84, 0.56]);
  for (const sx of [-1, 1]) g.box(Math.min(sx * dw, sx * (dw + 0.7)), 0, zE, Math.max(sx * dw, sx * (dw + 0.7)), dh + 0.7, zE + 0.35, {});
  g.box(-dw - 0.7, dh, zE, dw + 0.7, dh + 0.7, zE + 0.35, { bottom: true });
  g.kind(4, 0.1, 0.9).col(GILT, 1.1);
  for (const sx of [-1, 1]) g.box(Math.min(sx * (dw + 0.7), sx * (dw + 1.0)), 0, zE, Math.max(sx * (dw + 0.7), sx * (dw + 1.0)), dh + 1.0, zE + 0.5, {});
  g.box(-dw - 1.0, dh + 0.7, zE, dw + 1.0, dh + 1.0, zE + 0.5, { bottom: true }); g.box(-dw - 1.5, dh + 1.0, zE, dw + 1.5, dh + 1.6, zE + 0.9, { bottom: true });
  // (beyond the doorway a short passage stands full of light: what the strip on the carpet falls out of; the site's
  // portal stands in the doorway before it)
  g.kind(0, 2.4, 0).col([1, 0.8, 0.5]); rect(-dw - 0.3, 0, dw + 0.3, dh + 0.3, zE - 5);
  g.kind(0, 1.5, 0).col([1, 0.74, 0.42]);
  for (const sx of [-1, 1]) g.quad([sx * (dw + 0.3), 0, zE], [sx * (dw + 0.3), 0, zE - 5], [sx * (dw + 0.3), dh + 0.3, zE - 5], [sx * (dw + 0.3), dh + 0.3, zE]);
  g.quad([-dw - 0.3, dh + 0.3, zE], [dw + 0.3, dh + 0.3, zE], [dw + 0.3, dh + 0.3, zE - 5], [-dw - 0.3, dh + 0.3, zE - 5]); g.quad([-dw - 0.3, 0.02, zE], [dw + 0.3, 0.02, zE], [dw + 0.3, 0.02, zE - 5], [-dw - 0.3, 0.02, zE - 5]);
  for (const [gx, gy] of [[-5.9, 2.4], [-5.9, 7.2], [-5.9, 12], [-3.2, 16.4], [0, 16.8], [3.2, 16.4], [5.9, 12], [5.9, 7.2], [5.9, 2.4]]) flames.push({ p: [gx, gy, zE + 0.7], size: 8.5, c: [0.3, 0.22, 0.11], kind: 1, phase: (gx * 0.13 + gy * 0.07 + 2) % 1, what: 'ring of the room\'s doorway' });
  // the door, standing open into the room on the lamp's hand (85 degrees: its edge keeps 2.7 m from the line)
  const open = 85 * Math.PI / 180, hinge = new THREE.Matrix4().compose(new THREE.Vector3(h * dw, 0, zE + 0.2), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), h * open), new THREE.Vector3(1, 1, 1));
  g.at(hinge); g.kind(9, 0, 0.4).col(WOOD, 1.6); g.box(Math.min(0, -h * ROOM.DOORW), 0.1, -0.15, Math.max(0, -h * ROOM.DOORW), dh - 0.1, 0.15, {});
  g.col(WOOD, 1.2); for (const yy of [1.2, 7.4]) g.box(Math.min(-h * 1, -h * (ROOM.DOORW - 1)), yy, 0.15, Math.max(-h * 1, -h * (ROOM.DOORW - 1)), yy + 5, 0.22, {});
  g.kind(4, 0, 0.9).col(GILT); g.cbox(-h * (ROOM.DOORW - 0.8), 6.4, 0.3, 0.5, 0.5, 0.3, {}); g.at(null);
  const leafEnd = [h * (dw - ROOM.DOORW * Math.cos(open)), zE + 0.2 + ROOM.DOORW * Math.sin(open)];
  T2.noteBox('the open door', Math.min(h * dw, leafEnd[0]) - 0.15, 0, zE, Math.max(h * dw, leafEnd[0]) + 0.15, dh, leafEnd[1] + 0.3);
  T2.noteBox('door frame', dw, 0, zE, dw + 0.7, dh, zE + 0.4);
  await ctx.yield();
  // a cupboard against the door's wall on the far hand
  const cx0 = -h * 12.5;
  g.kind(9, 0, 0.45).col(WOOD, 1.5); g.box(cx0 - 3.6, 0, zE + 0.1, cx0 + 3.6, 12.4, zE + 3.2, {});
  g.col(WOOD, 1.1); g.box(cx0 - 3.9, 12.4, zE + 0.1, cx0 + 3.9, 13.0, zE + 3.5, { bottom: true }); g.box(cx0 - 0.06, 0.6, zE + 3.2, cx0 + 0.06, 11.8, zE + 3.26, {});
  g.kind(4, 0, 0.9).col(GILT); for (const sx of [-1, 1]) g.cbox(cx0 + sx * 0.5, 6.2, zE + 3.3, 0.24, 0.7, 0.2, {});
  T2.noteBox('cupboard', cx0 - 3.9, 0, zE, cx0 + 3.9, 13, zE + 3.5);
  // a tall clock against the door's wall on the lamp's hand: a plain dial with nothing written on it, two hands, and a
  // pendulum that swings in its open case (on the clock; it reads the same at any moment)
  const kx = h * 12.6, kz = zE + 0.1, kf = kz + 2.02;
  g.kind(9, 0, 0.45).col(WOOD, 1.35); g.box(kx - 1.75, 0, kz, kx + 1.75, 1.5, kz + 2.0, {}); g.box(kx - 1.75, 8.3, kz, kx + 1.75, 11.6, kz + 2.0, {});
  g.box(kx - 2.0, 11.6, kz, kx + 2.0, 12.1, kz + 2.2, { bottom: true });
  for (const sx of [-1, 1]) g.box(Math.min(kx + sx * 1.15, kx + sx * 1.4), 1.5, kz, Math.max(kx + sx * 1.15, kx + sx * 1.4), 8.3, kz + 1.7, {});
  g.kind(0, 0, 0.1).col([0.03, 0.022, 0.016]); g.quad([kx - 1.15, 1.5, kz + 0.3], [kx + 1.15, 1.5, kz + 0.3], [kx + 1.15, 8.3, kz + 0.3], [kx - 1.15, 8.3, kz + 0.3]);
  g.kind(4, 0, 0.8).col(GILT, 0.8); g.quad([kx - 1.45, 8.5, kf - 0.01], [kx + 1.45, 8.5, kf - 0.01], [kx + 1.45, 11.4, kf - 0.01], [kx - 1.45, 11.4, kf - 0.01]);
  g.kind(0, 0.3, 0.4).col([0.82, 0.78, 0.64]);
  for (let i = 0; i < 14; i++) { const a0 = i / 14 * Math.PI * 2, a1 = (i + 1) / 14 * Math.PI * 2; g.tri([kx, 9.95, kf], [kx + Math.cos(a0) * 1.25, 9.95 + Math.sin(a0) * 1.25, kf], [kx + Math.cos(a1) * 1.25, 9.95 + Math.sin(a1) * 1.25, kf]); }
  g.kind(0, 0, 0.3).col([0.03, 0.03, 0.04]);
  for (const [a, len] of [[2.2, 0.7], [0.5, 1.05]]) { const dx = Math.cos(a), dy = Math.sin(a), w = 0.05; g.quad([kx - dy * w, 9.95 + dx * w, kf + 0.03], [kx + dy * w, 9.95 - dx * w, kf + 0.03], [kx + dx * len + dy * w, 9.95 + dy * len - dx * w, kf + 0.03], [kx + dx * len - dy * w, 9.95 + dy * len + dx * w, kf + 0.03]); }
  T2.noteBox('tall clock', kx - 2, 0, zE, kx + 2, 12.1, zE + 2.4);
  const gp = new Geo();
  gp.kind(4, 0, 0.8).col(GILT, 0.7); gp.box(-0.05, -5.2, -0.05, 0.05, 0, 0.05, {});
  gp.kind(4, 0.2, 0.9).col(GILT, 1.1);
  for (const zz of [0.09, -0.09]) for (let i = 0; i < 12; i++) { const a0 = i / 12 * Math.PI * 2, a1 = (i + 1) / 12 * Math.PI * 2; gp.tri([0, -5.3, zz], [Math.cos(a0) * 0.55, -5.3 + Math.sin(a0) * 0.55, zz], [Math.cos(a1) * 0.55, -5.3 + Math.sin(a1) * 0.55, zz]); }
  // (the pendulum's swing is a habit on the world's clock, begun at a phase drawn out of the hall's own stream)
  const pendPh = R.hall.range(0, 6.28);
  const pend = mover(gp.build(), mat), tick = (time) => pend.set(kx, 8.1, kz + 1.0, 0, 0, Math.sin(time * 2.2 + pendPh) * 0.1, 1);
  tick(0); group.add(pend.mesh);
  // PICTURES in gilt frames on the door's wall (dark fields of colour, nothing written), hung BY THE WALL'S FREE
  // LENGTHS: each goes to its own hand in turn, at eye height where that hand of the wall is free of the doorway, the
  // cupboard, the clock and the pictures already hung, else above them; one that finds no free length is not hung
  const blocks = [[-dw - 1.5, dw + 1.5, 0, dh + 1.6], [cx0 - 3.9, cx0 + 3.9, 0, 13.0], [kx - 2, kx + 2, 0, 12.1]], hungAt = [];
  for (let k = 0; k < pics; k++) {
    const sx = k % 2 ? 1 : -1, w = 1.6 + 0.4 * (k % 2), hh = 2.2 - 0.3 * (k % 2), need = 2 * (w + 0.3) + 0.8;
    let spot = null;
    for (const cy of [10.5 + (k % 3) * 0.4, 16.4]) {
      let free = [[sx > 0 ? 0 : -(HWR - 0.6), sx > 0 ? HWR - 0.6 : 0]];
      for (const [b0, b1, y0, y1] of blocks) {
        if (y1 < cy - hh - 0.7 || y0 > cy + hh + 0.7) continue;
        free = free.flatMap(([a, b]) => (b1 <= a || b0 >= b ? [[a, b]] : [[a, Math.min(b0, b)], [Math.max(b1, a), b]].filter(([p, q]) => q - p > 0.01)));
      }
      free.sort((p, q) => (q[1] - q[0]) - (p[1] - p[0]));
      if (free.length && free[0][1] - free[0][0] >= need && cy + hh + 0.3 < H - 0.6) { spot = [(free[0][0] + free[0][1]) / 2, cy]; break; }
    }
    if (!spot) continue;
    const [cx, cy] = spot;
    g.kind(4, 0, 0.8).col(GILT, 0.9); g.box(cx - w - 0.3, cy - hh - 0.3, zE, cx + w + 0.3, cy + hh + 0.3, zE + 0.25, {});
    g.kind(0, 0, 0.3).col(FIELDS[k]); g.quad([cx - w, cy - hh, zE + 0.27], [cx + w, cy - hh, zE + 0.27], [cx + w, cy + hh, zE + 0.27], [cx - w, cy + hh, zE + 0.27], null, [0.36, 0.34, 0.3]);
    blocks.push([cx - w - 0.3, cx + w + 0.3, cy - hh - 0.3, cy + hh + 0.3]); hungAt.push([cx - w - 0.3, cx + w + 0.3, cy - hh - 0.3, cy + hh + 0.3]);
  }
  // (the count for the reader: pictures that overlap the cupboard, the clock or the doorway, tried again here)
  let behind = 0;
  for (const [a, b, y0, y1] of hungAt) for (const [b0, b1, , by1] of blocks.slice(0, 3)) if (a < b1 && b > b0 && y0 < by1) behind++;
  // the carpet: wide, wine-red with gilt threads, from the room's front to the doorway (the strip of light lies on it)
  g.kind(2, 0, 0.05, 9.5).col([0.36, 0.05, 0.07]); g.quad([-9.5, 0.06, -(RF + 3)], [9.5, 0.06, -(RF + 3)], [9.5, 0.06, zE + 1.2], [-9.5, 0.06, zE + 1.2]);
  // the lamp on its round table, the armchair beside it turned to the room
  const lx = h * 9.6, lz = -lampD;
  g.kind(9, 0, 0.5).col(WOOD, 1.7); g.lathe(lx, 0, lz, [[1.5, 0], [1.3, 0.3], [0.3, 0.6], [0.26, 3.6], [2.7, 3.9], [2.7, 4.2], [0.01, 4.2]], 14);
  g.kind(4, 0, 0.8).col(GILT, 0.9); g.lathe(lx, 4.2, lz, [[0.7, 0], [0.5, 0.2], [0.16, 0.5], [0.3, 1.1], [0.12, 1.7]], 8);
  g.kind(0, 3.0, 0.1).col([1, 0.62, 0.28]); g.lathe(lx, 5.7, lz, [[1.6, 0], [0.95, 1.9]], 12);
  flames.push({ p: [lx, 6.6, lz], size: 12, c: mulc(CANDLE, 0.5), kind: 1, phase: 0.4, what: 'room lamp' });
  T2.note('lamp and its table', lx, 0, 7.7, lz, 2.8);
  const ax = h * 10.4, az = lz - 8.2, yaw = Math.atan2(-h, 0.55);
  g.place(ax, 0, az, yaw, 1);
  g.kind(9, 0, 0.4).col(WOOD, 1.4); for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.cbox(sx * 1.9, 0, sz * 1.7, 0.5, 1.1, 0.5, {});
  g.kind(0, 0, 0.12).col(chair); g.box(-2.3, 1.0, -2.0, 2.3, 2.9, 2.2, { bottom: true }); g.box(-2.3, 2.9, -2.0, 2.3, 7.4, -1.1, {});
  for (const sx of [-1, 1]) g.box(Math.min(sx * 1.7, sx * 2.5), 2.9, -1.1, Math.max(sx * 1.7, sx * 2.5), 4.5, 2.2, {});
  g.col(mulc(chair, 1.5)); g.box(-1.6, 2.9, -1.0, 1.6, 3.4, 2.0, {});
  g.at(null);
  T2.note('armchair', ax, 0, 7.5, az, 3.5);
  // a sofa along the far hand's wall
  const sxw = -h, sx0 = sxw * 13.6, sz = -sofaD;
  g.kind(0, 0, 0.12).col(mulc(chair, 0.8)); g.box(sx0 - 2, 0.9, sz - 5.5, sx0 + 2, 2.8, sz + 5.5, { bottom: true }); g.box(Math.min(sx0 + sxw * 1.2, sx0 + sxw * 2), 2.8, sz - 5.5, Math.max(sx0 + sxw * 1.2, sx0 + sxw * 2), 6.6, sz + 5.5, {});
  for (const dz of [-1, 1]) g.box(sx0 - 2, 2.8, Math.min(sz + dz * 4.8, sz + dz * 5.5), sx0 + 2, 4.2, Math.max(sz + dz * 4.8, sz + dz * 5.5), {});
  g.kind(9, 0, 0.4).col(WOOD, 1.4); for (const dx of [-1, 1]) for (const dz of [-1, 1]) g.cbox(sx0 + dx * 1.7, 0, sz + dz * 5.1, 0.5, 0.9, 0.5, {});
  T2.noteBox('sofa', sx0 - 2, 0, sz - 5.5, sx0 + 2, 6.6, sz + 5.5);
  await ctx.yield();
  // a vase of the ball's flowers on a pedestal (roses on the roses' hand of the hall, camellias on the other)
  const vase = (x, y, z, s, c, stand) => {
    if (stand) { g.kind(3, 0, 0.35).col(STONE, 1.1); g.cbox(x, 0, z, 2.2, y, 2.2, {}); T2.note('vase of flowers', x, 0, y + 7.2 * s, z, 2.4 * s); }
    g.kind(0, 0.05, 0.7).col([0.78, 0.8, 0.86]); g.lathe(x, y, z, [[0.5 * s, 0], [0.7 * s, 0.2 * s], [1.15 * s, 1.5 * s], [0.9 * s, 2.7 * s], [0.45 * s, 3.3 * s], [0.7 * s, 3.8 * s]], 10);
    g.kind(13, 0, 0.3).col(LEAF2, 0.9); g.ball(x, y + 4.6 * s, z, 1.9 * s, 1.2 * s, 1.9 * s, 8, 3);
    g.kind(12, 0.05, 0.1).col(c); g.ball(x, y + 5.5 * s, z, 1.7 * s, 1.5 * s, 1.7 * s, 9, 4);
  };
  const cR = (sx) => (sx === plan.rosesSide ? ROSE : PINK);
  vase(h * 13.6, 3.4, -(RF + 5), 1, cR(h), true); vase(h * 13.6, 3.4, -(RF + 26.4), 1, cR(-h), true);
  // a tall looking glass on the lamp's wall, in a gilt frame under a gilt crest: the ball's lights stand in it
  {
    const mx = h * (HWR - 0.05), mz = -(RF + 16), fx = h * (HWR - 0.45);
    g.kind(4, 0, 0.85).col(GILT); g.box(Math.min(mx, fx), 1.0, mz - 4.1, Math.max(mx, fx), 16.2, mz + 4.1, {}); g.box(Math.min(mx, fx), 16.2, mz - 2.2, Math.max(mx, fx), 17.2, mz + 2.2, {});
    g.kind(17, 0, 0.9).col([1, 1, 1]); g.quad([fx - h * 0.03, 1.6, mz - 3.5], [fx - h * 0.03, 1.6, mz + 3.5], [fx - h * 0.03, 15.6, mz + 3.5], [fx - h * 0.03, 15.6, mz - 3.5]);
  }
  // an upright piano against the window's wall, its lid shut and its keys bare: two candles on its brackets, a pale
  // blank leaf on its desk, a round stool, a small vase on its top
  {
    const X = (t) => -h * (HWR - t), dbox = (t0, y0, z0, t1, y1, z1, o = {}) => g.box(Math.min(X(t0), X(t1)), y0, z0, Math.max(X(t0), X(t1)), y1, z1, o), pz = -(RF + 8.5);
    g.kind(0, 0, 0.75).col([0.035, 0.024, 0.02]); dbox(0.1, 0, pz - 4.9, 3.6, 8.2, pz + 4.9); dbox(3.6, 4.3, pz - 4.9, 5.5, 5.0, pz + 4.9, { bottom: true }); dbox(0, 8.2, pz - 5.1, 3.9, 8.5, pz + 5.1, { bottom: true });
    for (const dz of [-4.6, 4.6]) dbox(3.6, 0, pz + dz - 0.3, 5.2, 4.3, pz + dz + 0.3);
    g.kind(0, 0.08, 0.5).col([0.92, 0.9, 0.84]); dbox(3.75, 5.0, pz - 4.4, 5.4, 5.12, pz + 4.4);
    g.kind(0, 0, 0.6).col([0.02, 0.02, 0.02]); for (let k = 0; k < 21; k++) if (k % 7 !== 2 && k % 7 !== 6) dbox(3.75, 5.12, pz - 4.2 + k * 0.4 + 0.12, 4.75, 5.22, pz - 4.2 + k * 0.4 + 0.3);
    g.kind(4, 0, 0.8).col(GILT); dbox(3.6, 6.2, pz - 2.2, 4.0, 6.4, pz + 2.2);
    g.kind(0, 0.1, 0.2).col([0.8, 0.76, 0.64]); g.quad([X(3.95), 6.4, pz - 1.3], [X(3.95), 6.4, pz + 1.3], [X(3.7), 8.0, pz + 1.3], [X(3.7), 8.0, pz - 1.3]);
    for (const dz of [-3.3, 3.3]) {
      g.kind(4, 0, 0.8).col(GILT); dbox(3.6, 6.5, pz + dz - 0.08, 4.7, 6.66, pz + dz + 0.08, { bottom: true });
      g.kind(0, 0.25, 0.2).col([0.9, 0.84, 0.7]); g.cbox(X(4.6), 6.66, pz + dz, 0.22, 1.0, 0.22, {});
      flames.push({ p: [X(4.6), 8.05, pz + dz], size: 1.3, c: mulc(CANDLE, 3), kind: 0, phase: (0.37 + dz * 0.11 + 1) % 1 });
    }
    flames.push({ p: [X(4.6), 8.05, pz], size: 7, c: mulc(CANDLE, 0.2), kind: 1, phase: 0.77, what: 'candles of the piano' });
    g.kind(9, 0, 0.5).col(WOOD, 1.5); g.lathe(X(7.6), 0, pz, [[1.2, 0], [0.9, 0.3], [0.3, 0.6], [0.26, 2.7]], 8);
    g.kind(0, 0, 0.15).col([0.36, 0.06, 0.08]); g.lathe(X(7.6), 0, pz, [[0.3, 2.7], [1.35, 2.75], [1.4, 3.25], [0.01, 3.3]], 12);
    vase(X(1.9), 8.5, pz - 2.9, 0.55, cR(-h), false);
    T2.noteBox('piano and its stool', Math.min(X(0), X(9)), 0, pz - 5.1, Math.max(X(0), X(9)), 12, pz + 5.1);
  }
  await ctx.yield();
  // a laid table by the window's wall, between the window and the door's wall: a white cloth to its knees, six plates
  // with gilt rims and a glass of the pools' wine by each, a bowl of the ball's flowers, two candles; two chairs drawn
  // up to it; over it a lamp in a silk shade hangs from the ceiling
  {
    const tx = -h * 8.4, tz = -(DE - 12);
    g.kind(9, 0, 0.4).col(WOOD, 1.4); g.lathe(tx, 0, tz, [[1.6, 0], [1.3, 0.4], [0.45, 0.8], [0.4, 4.4], [1.2, 4.7]], 10);
    g.kind(0, 0.06, 0.25).col([0.9, 0.87, 0.8]); g.lathe(tx, 0, tz, [[4.5, 2.5], [4.42, 3.6], [4.15, 4.75], [4.0, 4.9], [0.01, 4.9]], 20, { rmod: (a, y) => 1 + (y < 4.7 ? 0.035 * Math.sin(a * 9) : 0) });
    for (let k = 0; k < 6; k++) {
      const a = k / 6 * Math.PI * 2 + 0.3, px = tx + Math.cos(a) * 2.9, pzz = tz + Math.sin(a) * 2.9, gx = tx + Math.cos(a + 0.3) * 2.2, gz = tz + Math.sin(a + 0.3) * 2.2;
      g.kind(0, 0.05, 0.6).col([0.92, 0.9, 0.86]); g.lathe(px, 4.91, pzz, [[0.01, 0], [0.6, 0.03], [0.8, 0.12]], 10, { colors: [[0.92, 0.9, 0.86], [0.92, 0.9, 0.86], GILT] });
      g.kind(0, 0.5, 0.9).col([[0.5, 0.25, 1.0], [1.0, 0.1, 0.24], [0.6, 0.74, 0.8]][k % 3], 0.8); g.lathe(gx, 4.91, gz, [[0.16, 0], [0.05, 0.06], [0.05, 0.42], [0.2, 0.52], [0.23, 0.9]], 6);
    }
    g.kind(4, 0, 0.8).col(GILT); g.lathe(tx, 4.9, tz, [[0.7, 0], [0.22, 0.2], [0.3, 0.7], [1.2, 1.0]], 8);
    g.kind(12, 0.05, 0.1).col(cR(-h)); g.ball(tx, 6.5, tz, 1.5, 1.0, 1.5, 9, 4);
    for (const dz of [-2.0, 2.0]) {
      g.kind(4, 0, 0.8).col(GILT); g.lathe(tx, 4.9, tz + dz, [[0.5, 0], [0.14, 0.14], [0.1, 1.5], [0.26, 1.62]], 6);
      g.kind(0, 0.25, 0.2).col([0.9, 0.84, 0.7]); g.cbox(tx, 6.52, tz + dz, 0.2, 1.0, 0.2, {});
      flames.push({ p: [tx, 7.9, tz + dz], size: 1.3, c: mulc(CANDLE, 3), kind: 0, phase: (0.21 + dz * 0.13 + 1) % 1 });
    }
    flames.push({ p: [tx, 7.9, tz], size: 6.5, c: mulc(CANDLE, 0.2), kind: 1, phase: 0.18, what: 'candles of the laid table' });
    T2.note('laid table', tx, 0, 8.4, tz, 4.7);
    for (const [cx, cz, yaw] of [[-h * 13.6, tz, h * Math.PI / 2], [tx, tz + 5.5, Math.PI]]) {
      g.place(cx, 0, cz, yaw, 1);
      g.kind(9, 0, 0.4).col(WOOD, 1.5); for (const dx of [-1, 1]) for (const dz of [-1, 1]) g.cbox(dx * 1.1, 0, dz * 1.1, 0.3, dz < 0 ? 7.2 : 2.9, 0.3, {});
      g.box(-1.25, 5.6, -1.25, 1.25, 7.0, -0.95, {}); g.kind(0, 0, 0.12).col(mulc(chair, 1.1)); g.box(-1.3, 2.9, -1.3, 1.3, 3.3, 1.3, { bottom: true });
      g.at(null);
      T2.note('chair at the table', cx, 0, 7.2, cz, 1.9);
    }
    g.kind(4, 0, 0.8).col(GILT, 0.8); g.cbox(tx, 14.6, tz, 0.12, H - 14.6, 0.12, {});
    g.kind(0, 2.2, 0.2).col([1, 0.58, 0.24]); g.lathe(tx, 12.2, tz, [[2.7, 0], [2.3, 1.2], [0.8, 2.4], [0.2, 2.5]], 14);
    g.kind(4, 0.2, 0.8).col(GILT); g.lathe(tx, 11.9, tz, [[2.6, 0.3], [2.78, 0.2], [2.78, 0.0]], 14);
    flames.push({ p: [tx, 12.6, tz], size: 11, c: mulc(CANDLE, 0.3), kind: 1, phase: 0.52, what: 'hanging lamp of the room' });
    T2.note('hanging lamp of the room', tx, 11.8, H, tz, 2.9);
  }
  group.add(new THREE.Mesh(await g.buildA(ctx), mat));
  await ctx.yield();
  return { group, shell, h, flames, tick, lamp: [lx, 7.0, lz], door: [0, 7, zE - 2.5], counts: { pictures: hungAt.length, picturesBehind: behind } };
}

// ---------------------------------------------------------------- THE FOREST (frame F2, d from 0 to the tulips)
const LEAF = [0.06, 0.27, 0.06], LEAF2 = [0.16, 0.4, 0.06], BARK = [0.17, 0.12, 0.07];
// a blade: rows of (left edge, rib, right edge) along its rib; aux.z = the way out from the rib, aux.w = what sways
function blade(g, rows, kind, sway, c0, c1) {
  const base = g.P.length / 3, n = rows.length;
  for (let j = 0; j < n; j++) {
    const r = rows[j], a = rows[Math.max(j - 1, 0)].c, b = rows[Math.min(j + 1, n - 1)].c, ax = b[0] - a[0], ay = b[1] - a[1], az = b[2] - a[2];
    let nx = ay * r.s[2] - az * r.s[1], ny = az * r.s[0] - ax * r.s[2], nz = ax * r.s[1] - ay * r.s[0]; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    if (ny < 0) { nx = -nx; ny = -ny; nz = -nz; }
    const col = mixc(c0, c1, r.t);
    for (const e of [-1, 0, 1]) {
      g.a = [kind, kind === 14 ? r.t : 0, Math.abs(e), sway * (r.t * r.t + (e ? 0.2 * r.t : 0))];
      g.v(r.c[0] + e * r.s[0], r.c[1] + e * r.s[1] - (e ? r.droop : 0), r.c[2] + e * r.s[2], nx, ny, nz, e ? col : mulc(col, 0.75));
    }
  }
  for (let j = 0; j < n - 1; j++) for (let e = 0; e < 2; e++) { const q = base + j * 3 + e; g.I.push(q, q + 1, q + 4, q, q + 4, q + 3); }
}
// a palm: a leaning trunk, a crown of nf arching fronds of length L. palmShape is THE PALM AS IT IS BUILT: the one
// arithmetic for the builder and for every test of it (the trunk's line, each frond's rows of rib and edges)
export function palmShape(x, z, H, lean, la, L, nf, turn) {
  const trunk = []; for (let j = 0; j <= 5; j++) { const t = j / 5; trunk.push([x + Math.cos(la) * lean * t * t, H * t, z + Math.sin(la) * lean * t * t]); }
  const T = trunk[5], fronds = [];
  for (let k = 0; k < nf; k++) {
    const a = turn + k / nf * Math.PI * 2 + (k % 2) * 0.2, e0 = 0.35 + 0.75 * ((k * 7) % nf) / nf, rows = [];
    let cx = T[0], cy = T[1], cz = T[2];
    for (let j = 0; j <= 6; j++) {
      const t = j / 6, w = 1.9 * Math.pow(Math.sin(Math.PI * (0.06 + 0.9 * t)), 0.6);
      rows.push({ c: [cx, cy, cz], s: [-Math.sin(a) * w, 0, Math.cos(a) * w], t, droop: 0.5 * w, w });
      const phi = e0 - 1.75 * t; cx += Math.cos(phi) * Math.cos(a) * L / 6; cy += Math.sin(phi) * L / 6; cz += Math.cos(phi) * Math.sin(a) * L / 6;
    }
    fronds.push(rows);
  }
  return { trunk, fronds };
}
function palm(g, sh) {
  g.kind(9, 0, 0.1, 0).col(BARK); g.tube(sh.trunk, 0.95, 6, 0.6);
  for (const rows of sh.fronds) blade(g, rows, 14, 1.0, LEAF, LEAF2);
}
// how far a frond's row sways at its fullest (the lit material's wind moves a point by at most 0.74 of its weight; the
// weight is the one blade() gives it)
const frondSway = (t, edge) => 0.74 * (t * t + (edge ? 0.2 * t : 0));
// a great leaf on its stalk, rising out of the ground and arching over
function greatLeaf(g, x, z, a, L, W, e0, bend, tint) {
  const rows = []; let cx = x, cy = 0, cz = z;
  for (let j = 0; j <= 6; j++) {
    const t = j / 6, w = W * Math.pow(Math.sin(Math.PI * clamp(t * 1.12 - 0.1, 0.02, 0.98)), 0.7);
    rows.push({ c: [cx, cy, cz], s: [-Math.sin(a) * w, 0, Math.cos(a) * w], t, droop: 0.22 * w });
    const phi = e0 - bend * t; cx += Math.cos(phi) * Math.cos(a) * L / 6; cy += Math.sin(phi) * L / 6; cz += Math.cos(phi) * Math.sin(a) * L / 6;
  }
  blade(g, rows, 13, 0.8, mulc(LEAF, tint), mulc(LEAF2, tint));
  return [cx, cy, cz];
}
// a parrot, 1.7 m from beak to tail's end: red breast, green back and tail; the wings (aux.w = 1) beat in the shader
export function parrotGeometry() {
  const g = new Geo(), GREEN = [0.06, 0.5, 0.12], RED = [0.85, 0.07, 0.05], TAIL = [0.04, 0.42, 0.22];
  g.kind(0, 0, 0.3).col(GREEN); g.ball(0, 0, 0, 0.3, 0.3, 0.52, 6, 4, (j) => (j <= 1 ? RED : GREEN));
  g.col(RED); g.ball(0, 0.22, 0.5, 0.2, 0.2, 0.22, 5, 3, (j) => (j >= 2 ? GREEN : RED));
  g.col([0.92, 0.8, 0.45]); g.tri([-0.07, 0.24, 0.68], [0.07, 0.24, 0.68], [0, 0.12, 0.86]);
  g.col(TAIL); g.quad([-0.14, 0, -0.4], [0.14, 0, -0.4], [0.2, -0.12, -1.25], [-0.2, -0.12, -1.25], TAIL, [0.03, 0.3, 0.3]);
  for (const sx of [-1, 1]) { g.kind(0, 0, 0.3, 1).col(GREEN); g.quad([sx * 0.2, 0.1, 0.3], [sx * 1.5, 0.1, 0.1], [sx * 1.3, 0.1, -0.45], [sx * 0.2, 0.1, -0.35], GREEN, [0.05, 0.3, 0.5]); }
  return g.build();
}
// parrots: EACH BIRD IS ON A ROUND OF ITS OWN, on the world's clock, whether anyone is there or not: it clings to its
// perch and bobs, bursts off, flies one closed loop among the lianas and settles again; no bird is ever gone, and at
// any moment a few are on the wing. iA = perch and the length of the round in seconds, iB = the far point of the loop
// (from the perch) and the bird's phase, iC = the loop's half width (the way the bird leaves: straight ahead of where
// it sits facing) and the share of the round spent on the wing, iD = the bearing the bird sits facing (its own, drawn
// out of its own stream: it is read off nothing else).
// The loop (the same arithmetic as the shader's): from the perch out to the far point and back.
export function parrotLoop(perch, U, V, tau) {
  const th = 2 * Math.PI * tau, a = 0.5 - 0.5 * Math.cos(th), b = Math.sin(th);
  return [perch[0] + U[0] * a + V[0] * b, perch[1] + U[1] * a + V[1] * b, perch[2] + U[2] * a + V[2] * b];
}
export function makeParrots(zone, list) {
  const n = list.length, geometry = parrotGeometry(), g = new THREE.InstancedBufferGeometry(); g.setIndex(geometry.index); for (const k in geometry.attributes) g.setAttribute(k, geometry.attributes[k]);
  const iA = new Float32Array(n * 4), iB = new Float32Array(n * 4), iC = new Float32Array(n * 4), iD = new Float32Array(n);
  for (let i = 0; i < n; i++) { const q = list[i]; iA.set([q.p[0], q.p[1], q.p[2], q.T], i * 4); iB.set([q.U[0], q.U[1], q.U[2], q.ph], i * 4); iC.set([q.V[0], q.V[1], q.V[2], q.f], i * 4); iD[i] = q.yaw; }
  g.setAttribute('iA', new THREE.InstancedBufferAttribute(iA, 4)); g.setAttribute('iB', new THREE.InstancedBufferAttribute(iB, 4)); g.setAttribute('iC', new THREE.InstancedBufferAttribute(iC, 4)); g.setAttribute('iD', new THREE.InstancedBufferAttribute(iD, 1));
  g.instanceCount = n; g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
  const m = new THREE.ShaderMaterial({
    uniforms: { ...zone.U }, vertexColors: true, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      attribute vec4 aux, iA, iB, iC; attribute float iD; uniform float uTime; uniform mat4 uW2L;
      varying vec3 vP, vN, vC, vEye; varying float vDist;
      vec3 rY(vec3 p, float a){ float c = cos(a), s = sin(a); return vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z); }
      void main(){
        float ph = iB.w, q = fract(uTime / max(iA.w, 1.) + ph), f = max(iC.w, .01);
        float tau = clamp(q / f, 0., 1.), th = 6.2832 * tau, fly = step(q, f) * smoothstep(0., .05, tau) * (1. - smoothstep(.95, 1., tau));
        vec3 c = iA.xyz + iB.xyz * (.5 - .5 * cos(th)) + iC.xyz * sin(th);
        vec3 vel = iB.xyz * (.5 * sin(th)) + iC.xyz * cos(th);
        c.y += sin(uTime * 1.7 + ph * 20.) * .06 * (1. - fly);
        float yaw = mix(iD, atan(vel.x, vel.z), fly);
        float a = mix(-1.3 + .05 * sin(uTime * 2. + ph * 30.), sin(uTime * 15. + ph * 40.) * .95 + .15, fly);
        vec3 p = position, n = normal;
        if (aux.w > .5) { float r = abs(p.x) - .2, sx = sign(p.x); p.x = sx * (.2 + r * cos(a)); p.y += r * sin(a); }
        float size = 1. + .3 * fract(ph * 9.1);
        vec3 lp = c + rY(p * size, yaw);
        vP = lp; vN = rY(n, yaw); vC = color;
        vec4 mv = viewMatrix * (modelMatrix * vec4(lp, 1.));
        vDist = length(mv.xyz); vEye = (uW2L * vec4(cameraPosition, 1.)).xyz;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vP, vN, vC, vEye; varying float vDist;
      ${LIGHT_GLSL}
      void main(){
        vec3 V = normalize(vEye - vP), N = normalize(vN); if (dot(N, V) < 0.) N = -N;
        vec3 spec; vec3 dif = hallLight(vP, N, V, 16., spec);
        gl_FragColor = vec4(hallFog(vC * (dif * 1.5 + .1) + spec * .1, vDist, vP), 1.);
      }`,
  });
  const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false;
  return mesh;
}
// THE FOREST IS THE PALACE'S OWN WINTER GARDEN: walls of tall arched mirrors like the nave's, a barrel roof of glass in
// gilt bars on gilt ribs (the night stands behind it), gold columns of the hall's make in two rows among the trunks
// (the nave's own rows carried on), each with candles on its capital, lanterns hanging between them, a floor of earth
// and moss with a tiled path under the line and shade under everything that stands on it, beds of flowers by the path;
// palms whose crowns close over the line, great leaves well off it, hanging and slung lianas, ferns, parrots on gilt
// stands, a haze of light. Everything that grows is kept inside the walls, the roof and the two end walls AS IT IS
// BUILT (every point of it at its fullest sway), and clear of the columns and the lanterns.
export const gardenRoofY = (x) => BALL.VAULT2 + Math.sqrt(Math.max(BALL.HW * BALL.HW - x * x, 0));
export async function buildForest(ctx, plan, zone, R, density, route) {
  const group = new THREE.Group(), mat = litMaterial(zone), matW = litMaterial(zone, { wind: true });
  const HW = BALL.HW, F0 = plan.forestLen, TOPY = 64, Z0 = -0.4, SPRING = BALL.VAULT2, T2 = route.f2, lx = (d) => route.lineAt(d)[0], ly = (d) => route.lineAt(d)[1];
  const roofY = gardenRoofY, pitch = plan.colPitch, best = route.best, flames = [];
  // where the columns stand: a row along either wall, a pitch apart (the nave's own stations carried on); from each a
  // gilt arm reaches toward the garden's middle and a lantern hangs from its end
  const colD = []; for (let k = 1; plan.B1 - (k + 0.5) * pitch > 10; k++) colD.push(plan.B1 - (k + 0.5) * pitch);
  const GCOLX = HW - 3.5, LAMPX = GCOLX - 5.2, LAMPY = 22;
  // is a point (with m metres about it) in a column (its base, its shaft, its capital with the candles on it), in its
  // arm or in its lantern?
  const inStand = (x, y, d, m) => {
    const ax = Math.abs(x);
    for (const dc of colD) {
      if (Math.abs(d - dc) > 4 + m) continue;
      if (y < 41.5 + m && Math.hypot(ax - GCOLX, d - dc) < (y > 30.5 - m ? 3.6 : y < 2 + m ? 3.3 : 2.6) + m) return true;
      if (ax > LAMPX - 1.3 - m && ax < GCOLX && Math.abs(d - dc) < 1.3 + m && y > LAMPY - 1.8 - m && y < LAMPY + 4.4 + m) return true;
    }
    return false;
  };
  // is a point (with m metres about it) inside the garden: within its side walls, its two end walls and its glass?
  const inside = (x, y, d, m) => Math.abs(x) <= HW - m && d >= -Z0 + m && d <= F0 - m && y <= roofY(Math.abs(x) + m) - m;
  let g = new Geo();
  // walls of arched mirrors to the roof's springing under a gilt cornice; the end walls in the hall's stone
  for (const sx of [-1, 1]) {
    const x = sx * HW;
    g.kind(8, 0, 0.2, pitch).col([0.3, 0.2, 0.11]); g.quad([x, 0, Z0], [x, 0, -F0], [x, SPRING, -F0], [x, SPRING, Z0]);
    g.kind(4, 0, 0.8).col(GILT); g.box(Math.min(x, x - sx * 0.8), SPRING - 1.4, -F0, Math.max(x, x - sx * 0.8), SPRING, Z0, { bottom: true });
  }
  g.kind(1, 0, 0.3).col(YSTONE, 0.42); tympanum(g, F0 - 0.05, BALL.COLX, BALL.BEAM, TOPY, HW);
  g.quad([-HW, 0, Z0], [-8, 0, Z0], [-8, TOPY, Z0], [-HW, TOPY, Z0]); g.quad([8, 0, Z0], [HW, 0, Z0], [HW, TOPY, Z0], [8, TOPY, Z0]); g.quad([-8, 38, Z0], [8, 38, Z0], [8, TOPY, Z0], [-8, TOPY, Z0]);
  // (a gilt frame about the tall doorway on the garden's side)
  g.kind(4, 0, 0.8).col(GILT);
  for (const sx of [-1, 1]) g.box(Math.min(sx * 8, sx * 9.3), 0, Z0 - 0.5, Math.max(sx * 8, sx * 9.3), 38, Z0, {});
  g.box(-9.3, 38, Z0 - 0.5, 9.3, 39.6, Z0, { bottom: true });
  // the roof: glass in gilt bars (kind 19: aux.w = the way round the barrel), a gilt rib over every pair of columns
  {
    const n = 16, P = (a, r, d) => [r * Math.cos(a), SPRING + r * Math.sin(a), -d];
    for (let d = -Z0; d < F0 - 0.01; d += 12) {
      const d1 = Math.min(d + 12, F0);
      for (let i = 0; i < n; i++) {
        const a0 = Math.PI * i / n, a1 = Math.PI * (i + 1) / n;
        g.kind(19, 0, 0.9, a0 * HW).col([1, 1, 1]); const i0 = g.v(...P(a0, HW, d), -Math.cos(a0), -Math.sin(a0), 0), i1 = g.v(...P(a0, HW, d1), -Math.cos(a0), -Math.sin(a0), 0);
        g.kind(19, 0, 0.9, a1 * HW); const i2 = g.v(...P(a1, HW, d1), -Math.cos(a1), -Math.sin(a1), 0), i3 = g.v(...P(a1, HW, d), -Math.cos(a1), -Math.sin(a1), 0);
        g.I.push(i0, i2, i1, i0, i3, i2);
      }
    }
    g.kind(4, 0, 0.8).col(GILT);
    for (const dc of colD.concat([F0 - 0.7, -Z0 + 0.7])) for (let i = 0; i < n; i++) {
      const a0 = Math.PI * i / n, a1 = Math.PI * (i + 1) / n, ri = HW - 1.1;
      g.quad(P(a0, ri, dc - 0.6), P(a0, ri, dc + 0.6), P(a1, ri, dc + 0.6), P(a1, ri, dc - 0.6));
      for (const e of [-0.6, 0.6]) g.quad(P(a0, ri, dc + e), P(a0, HW, dc + e), P(a1, HW, dc + e), P(a1, ri, dc + e));
    }
  }
  await ctx.yield();
  // the gold columns (the hall's own make, out of their own stream), candles on every capital; the lanterns
  for (const dc of colD) for (const sx of [-1, 1]) {
    const xc = sx * GCOLX, x = sx * LAMPX, z = -dc;
    column(g, xc, z, plan.colMake, R.gcols);
    candelabrum(g, xc, BALL.CAP, z, 2.0, flames, (dc * 0.071 + sx * 0.23 + 1) % 1);
    T2.note('column of the garden', xc, 0, 41.5, z, 3.6);
    // the arm (a gilt bar on a scrolled stay), the lantern's chain, the lantern: a six-sided gilt cage about a glass
    g.kind(4, 0, 0.8).col(GILT, 0.9); g.box(Math.min(x, xc), LAMPY + 3.9, z - 0.16, Math.max(x, xc), LAMPY + 4.2, z + 0.16, { bottom: true });
    g.tube([[xc - sx * 2.2, LAMPY + 0.6, z], [xc - sx * 3.0, LAMPY + 2.6, z], [xc - sx * 4.4, LAMPY + 3.9, z]], 0.14, 4);
    g.cbox(x, LAMPY + 2.6, z, 0.12, 1.3, 0.12, { top: false });
    g.kind(4, 0, 0.85).col(GILT); g.lathe(x, LAMPY - 1.5, z, [[0.01, 0], [0.5, 0.25], [0.95, 0.5], [0.95, 0.62]], 6); g.lathe(x, LAMPY + 1.5, z, [[1.1, 0], [1.1, 0.14], [0.5, 0.7], [0.12, 1.1]], 6);
    for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; g.cbox(x + Math.cos(a) * 0.9, LAMPY - 0.9, z + Math.sin(a) * 0.9, 0.09, 2.4, 0.09, { top: false }); }
    g.kind(0, 2.6, 0.3).col([1, 0.7, 0.32]); g.lathe(x, LAMPY - 0.9, z, [[0.78, 0], [0.78, 2.4]], 6);
    flames.push({ p: [x, LAMPY + 0.2, z], size: 1.9, c: mulc(CANDLE, 3), kind: 0, phase: (dc * 0.093 + sx * 0.31 + 1) % 1 }, { p: [x, LAMPY + 0.2, z], size: 12, c: mulc(CANDLE, 0.24), kind: 1, phase: (dc * 0.047 + sx * 0.19 + 1) % 1, what: 'lantern of the garden' });
    T2.note('lantern of the garden', x, LAMPY - 1.5, LAMPY + 4.2, z, 1.3);
  }
  group.add(new THREE.Mesh(await g.buildA(ctx), mat));
  await ctx.yield();
  // PALMS, set down by trial. A palm's foot is dealt inside the walls and the ends by its fronds' reach and its lean;
  // then THE PALM AS IT IS BUILT is tried (palmShape: the trunk's line and every frond's rib and edges, each at its
  // fullest sway): the trunk 2.5 m off the line and clear of the columns, every point of the crown 2.5 m off the line
  // (a crown may close over the line), inside the walls, the ends and the glass, clear of columns and lanterns. One
  // that fails is dropped after its draws.
  g = new Geo();
  const rt = R.trees, nPalm = Math.round(46 * Math.sqrt(density)), palms = [];
  const palmClear = (sh) => {
    let gt = 99, gc = 99;
    const no = (why) => { best['palm ' + why + ' (not set down)'] = (best['palm ' + why + ' (not set down)'] || 0) + 1; return null; };
    for (let j = 0; j <= 10; j++) {
      const a = sh.trunk[Math.min(Math.floor(j / 2), 4)], b = sh.trunk[Math.min(Math.floor(j / 2), 4) + 1], f = j / 2 - Math.min(Math.floor(j / 2), 4), p = [lerp(a[0], b[0], f), lerp(a[1], b[1], f), lerp(a[2], b[2], f)];
      gt = Math.min(gt, T2.dist(p[0], p[1], p[2], 16) - 0.95);
      if (gt < 2.5) return no('at the line');
      if (inStand(p[0], p[1], -p[2], 1.3)) return no('in a column or a lantern');
      if (!inside(p[0], p[1], -p[2], 1.2)) return no('through a wall or the glass');
    }
    for (const rows of sh.fronds) for (const r of rows) for (const e of [-1, 0, 1]) {
      const px = r.c[0] + e * r.s[0], py = r.c[1] - (e ? r.droop : 0), pz = r.c[2] + e * r.s[2], sw = frondSway(r.t, e);
      if (!inside(px, py, -pz, 0.25 + sw)) return no('through a wall or the glass');
      if (inStand(px, py, -pz, 0.3 + sw)) return no('in a column or a lantern');
      gc = Math.min(gc, T2.dist(px, py, pz, 16) - sw);
      if (gc < 2.5) return no('at the line');
    }
    return [gt, gc];
  };
  for (let i = 0; i < nPalm * 10 && palms.length < nPalm; i++) {
    const x0 = rt.range(-HW + 3, HW - 3), d0 = rt.range(5, F0 - 4), H = rt.range(19, 37), lean = rt.range(0, 4), la = rt.range(0, 6.28), L = rt.range(8, 11), nf = rt.int(8, 11), turn = rt.range(0, 6.28);
    const reach = 0.82 * L + 1.5 + lean, x = x0 * (HW - 0.5 - reach) / (HW - 3), d = 0.9 + reach + (d0 - 5) / (F0 - 9) * (F0 - 1.8 - 2 * reach);
    if (Math.abs(x - lx(d)) < 7) continue;
    let ok = true; for (const o of palms) if (Math.hypot(o.x - x, o.d - d) < 6) { ok = false; break; }
    if (!ok) continue;
    const sh = palmShape(x, -d, H, lean, la, L, nf, turn), gaps = palmClear(sh);
    if (!gaps) continue;
    best['palm (trunk)'] = Math.min(best['palm (trunk)'] ?? 99, Math.round(gaps[0] * 100) / 100); best['palm (crown)'] = Math.min(best['palm (crown)'] ?? 99, Math.round(gaps[1] * 100) / 100);
    // (what later things are tried against: the trunk's line and the fronds' ribs, each with its own half width)
    const pts = [];
    for (const rows of sh.fronds) for (const r of rows) pts.push([r.c[0], r.c[1] - r.droop * 0.5, r.c[2], r.w + frondSway(r.t, 1)]);
    palms.push({ x, d, H, T: sh.trunk[5], R: L + 3, pts, trunk: sh.trunk }); palm(g, sh);
    if (palms.length % 2 === 0) await ctx.yield();
  }
  // is a point (with m metres about it) in a palm as built: its trunk (the line of it, 0.95 m thick) or a frond?
  const segDist = (px, py, pz, a, b) => {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], t = clamp(((px - a[0]) * ux + (py - a[1]) * uy + (pz - a[2]) * uz) / Math.max(ux * ux + uy * uy + uz * uz, 1e-6), 0, 1);
    return Math.hypot(px - a[0] - ux * t, py - a[1] - uy * t, pz - a[2] - uz * t);
  };
  const inPalm = (px, py, pz, m) => {
    for (const o of palms) {
      const far = Math.hypot(px - o.T[0], py - o.T[1], pz - o.T[2]) > o.R + m;
      if (far && Math.hypot(px - o.x, pz + o.d) > 5 + m) continue;
      for (let j = 0; j < 5; j++) if (segDist(px, py, pz, o.trunk[j], o.trunk[j + 1]) < 0.95 + m) return true;
      if (!far) for (const q of o.pts) if (Math.hypot(px - q[0], py - q[1], pz - q[2]) < q[3] + m) return true;
    }
    return false;
  };
  const palmMesh = new THREE.Mesh(await g.buildA(ctx), matW); palmMesh.name = 'palms'; group.add(palmMesh);
  await ctx.yield();
  // GREAT LEAVES in clumps: a clump's foot is dealt inside the walls and the ends by its leaves' reach (their sway
  // with it), clear of the columns by that reach, and it STANDS OFF THE LANE BY ITS OWN LENGTH: its foot is no nearer
  // the line, in plan, than its longest leaf and 2.5 m (a leaf's reach is 0.85 of its length, so no leaf lies under
  // the lens). One that fails is dropped after its draws.
  g = new Geo();
  // (what shades the floor: [x, z, how wide, how deep])
  const shades = palms.map((o) => [o.trunk[0][0], o.trunk[0][2], 3.6, 0.62]);
  for (const dc of colD) for (const sx of [-1, 1]) shades.push([sx * GCOLX, -dc, 5.6, 0.62]);
  const rl = R.leaves, nClump = Math.round(92 * density);
  for (let i = 0; i < nClump; i++) {
    if (i % 12 === 11) await ctx.yield();
    const x0 = rl.range(-HW + 2, HW - 2), d0 = rl.range(2, F0 - 3), n = rl.int(4, 7), size = rl.range(0.75, 1.3), a0 = rl.range(0, 6.28), tint = rl.range(0.75, 1.25);
    const reach = 6.4 * size + 0.75, len = 7.5 * size, top = 5.4 * size;
    const x = x0 * (HW - 0.4 - reach) / (HW - 2), d = 0.8 + reach + (d0 - 2) / (F0 - 5) * (F0 - 1.6 - 2 * reach);
    if (T2.gap(x, -99, 99, -d, 0) < len + 2.5 || inStand(x, 1, d, reach)) { best['great leaves (not set down)'] = (best['great leaves (not set down)'] || 0) + 1; continue; }
    T2.note('great leaves', x, 0, top, -d, reach);
    for (let k = 0; k < n; k++) greatLeaf(g, x + Math.cos(a0 + k * 2.4) * 0.5, -d + Math.sin(a0 + k * 2.4) * 0.5, a0 + k * 2.4, (5.5 + (k % 3)) * size, (1.3 + 0.25 * (k % 2)) * size, 1.3 + 0.08 * (k % 3), 1.5 + 0.15 * (k % 2), tint);
    shades.push([x, -d, reach * 0.62, 0.5]);
  }
  await ctx.yield();
  // ferns: low undergrowth everywhere but on the tiled path and in a column's foot (dealt inside the walls likewise)
  const rf = R.ferns, nFern = Math.round(170 * density);
  for (let i = 0; i < nFern; i++) {
    if (i % 24 === 23) await ctx.yield();
    const x0 = rf.range(-HW + 1, HW - 1), d0 = rf.range(2, F0 - 1), a0 = rf.range(0, 6.28), size = rf.range(0.5, 1), tint = rf.range(0.6, 1.1);
    const reach = 3.4 * size + 0.75, x = x0 * (HW - 0.4 - reach) / (HW - 1), d = 0.8 + reach + (d0 - 2) / (F0 - 3) * (F0 - 1.6 - 2 * reach);
    if (Math.abs(x - lx(d)) < 4.6 + reach * 0.5 || inStand(x, 1, d, reach * 0.5)) continue;
    for (let k = 0; k < 5; k++) greatLeaf(g, x, -d, a0 + k * 1.26, 3.4 * size, 0.6 * size, 1.0, 1.9, tint);
    shades.push([x, -d, reach * 0.7, 0.3]);
  }
  T2.noteBox('undergrowth', -HW, 0, 1, HW, 3.4, -F0);
  // beds of the ball's flowers beside the path (out of their own stream), not in a trunk's or a column's foot
  const rb = R.beds, nBed = Math.round(44 * density);
  for (let i = 0; i < nBed; i++) {
    const d = rb.range(3, F0 - 3), side = rb.sign(), off = rb.range(5.8, 10), r = rb.range(1.3, 2.4), c = rb.pick([ROSE, PINK, [0.9, 0.86, 0.8], [0.9, 0.62, 0.12]]), tint = rb.range(0.8, 1.2);
    const x = lx(d) + side * off;
    if (inStand(x, 0.5, d, r + 0.4) || palms.some((o) => Math.hypot(o.trunk[0][0] - x, o.trunk[0][2] + d) < r + 1.4)) continue;
    g.kind(12, 0.04, 0.1, 0).col(mulc(c, tint)); g.lathe(x, 0, -d, [[r, 0], [r, 0.55], [r * 0.7, 0.95], [0.01, 1.1]], 9);
    g.kind(13, 0, 0.3, 0).col(LEAF, 1.2); g.lathe(x, 0, -d, [[r + 0.5, 0], [r + 0.35, 0.3], [r, 0.42]], 9);
    shades.push([x, -d, r + 1.1, 0.3]);
  }
  group.add(new THREE.Mesh(await g.buildA(ctx), matW));
  await ctx.yield();
  // lianas: hanging from the roof (a third of them beside the line, as near as their sway allows), and slung between
  g = new Geo();
  const rn = R.lianas, nHang = Math.round(72 * density), nSlung = Math.round(26 * density); let hung = 0, slung = 0;
  for (let i = 0; i < nHang; i++) {
    if (i % 20 === 19) await ctx.yield();
    // (every draw of a liana, its tint too, before any test of it; it hangs from the glass over its own place)
    const d = rn.range(3, F0 - 2), near = i % 3 === 0, x = near ? lx(d) + rn.sign() * rn.range(4, 7.5) : rn.range(-HW + 2, HW - 2), yb = rn.range(4, 26), r = rn.range(0.16, 0.3), ca = rn.range(0, 6.28), amp = rn.range(0.2, 0.5), tint = rn.range(0.7, 1.4);
    const top = roofY(x) - 0.3, about = r + amp + 1.0;
    if ([yb, LAMPY, top - 1].some((yy) => inStand(x, yy, d, about))) { best['liana (hanging) (not set down)'] = (best['liana (hanging) (not set down)'] || 0) + 1; continue; }
    if (!T2.keep('liana (hanging)', x, yb, TOPY, -d, about)) continue;
    const pts = []; for (let j = 0; j <= 8; j++) { const t = j / 8, w = Math.sin(t * 5 + ca) * amp * t; pts.push([x + Math.cos(ca) * w, lerp(top, yb, t), -d + Math.sin(ca) * w]); }
    g.kind(9, 0, 0.1, 0).col(mulc(BARK, tint)); g.tube(pts, r, 4, r * 0.6, (t) => 1.3 * t * t);
    hung++;
  }
  await ctx.yield();
  for (let i = 0; i < nSlung; i++) {
    if (i % 8 === 7) await ctx.yield();
    const d = rn.range(6, F0 - 8), x0 = rn.range(-HW + 3, 0), x1 = rn.range(0, HW - 3), y0 = rn.range(24, 46), y1 = rn.range(24, 46), dd = rn.range(-9, 9), sag = rn.range(4, 10), r = rn.range(0.2, 0.36);
    // slung between two places of the glass (its ends inside the garden), hanging as low as it was dealt
    const ya = roofY(x0) - 0.3, yb = roofY(x1) - 0.3, drop = Math.max((ya + yb) / 2 - ((y0 + y1) / 2 - sag), 2), de = clamp(d + dd, 1.5, F0 - 1.5);
    const pts = []; let ok = true;
    for (let j = 0; j <= 20; j++) { const t = j / 20; pts.push([lerp(x0, x1, t), lerp(ya, yb, t) - drop * 4 * t * (1 - t), -lerp(d, de, t)]); }
    for (const q of pts) if (T2.gap(q[0], q[1] - 0.5, q[1] + 0.5, q[2], r + 1.3) < 2.5 || inStand(q[0], q[1], -q[2], r + 1.3)) ok = false;
    if (!ok) { best['liana (slung) (not set down)'] = (best['liana (slung) (not set down)'] || 0) + 1; continue; }
    for (const q of pts) T2.note('liana (slung)', q[0], q[1] - 0.5, q[1] + 0.5, q[2], r + 1.3);
    g.kind(9, 0, 0.1, 0).col(mulc(BARK, 1.1)); g.tube(pts.filter((q, j) => j % 2 === 0), r, 4, r, (t) => 2.4 * t * (1 - t));
    slung++;
  }
  // PARROTS: each on the bar of its own perch, a tall gilt stand on the garden's floor beside the path. A bird sits
  // facing a bearing of its own (out of the stream of the facings; any bearing; read off nothing), its bar across
  // that facing, and it leaves straight ahead: its loop goes out, up on the hand away from the line, and comes back
  // to the bar. EVERY PART IS TRIED AS BUILT, after all the bird's draws: the stand's pole and bar against the palms as
  // built (trunks and fronds), the columns, the lanterns, the perches and the loops already set; THE WHOLE LOOP (a
  // point every 0.8 m of its length at most) 2.5 m off the line with the bird's wings out, inside the walls and the
  // glass, clear of the palms as built, the columns, the lanterns and every stand already set (its own too, but for
  // the first and the last twentieth of the loop, where it leaves and lands over its own bar). The loop is tried as
  // dealt, then with its far point turned about the perch a sixth of a turn at a time, then the same at two thirds,
  // two fifths and a quarter of its size; a bird with no clear stand or loop is not set down.
  const rp = R.parrots, rfc = R.facing, nPar = Math.round(58 * density), birds = [], stands = [], BAR = 1.25;
  // (the loops tried for a bird, in this order: [its size, sixths of a turn of its far point about the perch])
  const TRIES = []; for (const k of [1, 0.66, 0.4, 0.25]) for (const turn of [0, 1, -1, 2, -2, 3]) TRIES.push([k, turn]);
  // is a point (with m metres about it) at a stand: its pole from the floor to the bar, or the bar?
  const atStand = (s, px, py, pz, m) => (py < s.p[1] + m && Math.hypot(px - s.p[0], pz - s.p[2]) < m + 0.15) || segDist(px, py, pz, s.a, s.b) < m + 0.13;
  const loopPts = (perch, u, w) => {
    let len = 0, a = perch; for (let j = 1; j <= 32; j++) { const q = parrotLoop(perch, u, w, j / 32); len += Math.hypot(q[0] - a[0], q[1] - a[1], q[2] - a[2]); a = q; }
    const n = Math.max(33, Math.ceil(len / 0.8)), out = []; for (let j = 0; j <= n; j++) out.push(parrotLoop(perch, u, w, j / n));
    return out;
  };
  await ctx.yield();
  for (let i = 0; i < nPar; i++) {
    await ctx.yield();
    const d = rp.range(14, F0 - 6), side = rp.sign(), x = lx(d) + side * rp.range(6, 13), y = ly(d) + rp.range(-3, 6), T = rp.range(15, 32), Tf = rp.range(5, 7.5), out = rp.range(4, 10), up = rp.range(1, 6), along = rp.range(-5, 5), vz = rp.sign() * rp.range(5, 9), vy = rp.range(-1.5, 1.5), ph = rp();
    const yaw = rfc.range(-Math.PI, Math.PI), fx = Math.sin(yaw), fz = Math.cos(yaw);
    const perch = [x, y + 0.32, -d], s = { p: [x, y, -d], a: [x - BAR * fz, y, -d + BAR * fx], b: [x + BAR * fz, y, -d - BAR * fx] }, drop = (why) => { best['parrot, ' + why + ' (not set down)'] = (best['parrot, ' + why + ' (not set down)'] || 0) + 1; };
    // the stand
    let ok = inside(x, y, d, BAR + 0.6) && !inStand(x, y * 0.5, d, BAR + 0.8) && !inStand(x, y, d, BAR + 0.8);
    for (let yy = 0.4; ok && yy <= y; yy += 0.8) if (inPalm(x, yy, -d, 0.5)) ok = false;
    for (const e of [-1, -0.5, 0, 0.5, 1]) if (ok && inPalm(x + e * BAR * fz, y + 0.3, -d - e * BAR * fx, 0.6)) ok = false;
    for (const o of birds) { if (!ok) break; if (Math.hypot(o.p[0] - perch[0], o.p[1] - perch[1], o.p[2] - perch[2]) < 3.6) ok = false; for (const q of o.loop) if (atStand(s, q[0], q[1], q[2], 1.4)) { ok = false; break; } }
    if (!ok) { drop('no clear place for its stand'); continue; }
    let U = null, V = null, loop = null, why = '';
    for (const [k, turn] of TRIES) {
      if (U) break;
      if (turn === 3) await ctx.yield();
      const ct = Math.cos(turn * Math.PI / 3), st = Math.sin(turn * Math.PI / 3), ux = side * out * k, uz = along * k;
      const u = [ux * ct + uz * st, up * k, -ux * st + uz * ct], w = [fx * Math.abs(vz) * k, vy * k, fz * Math.abs(vz) * k], pts = loopPts(perch, u, w), n = pts.length - 1; let good = true;
      for (let j = 0; j <= n && good; j++) {
        const q = pts[j], mid = j >= n * 0.05 && j <= n * 0.95;
        if (q[1] < 3 || !inside(q[0], q[1], -q[2], 2.2)) { good = false; why = 'loop at a wall or the floor'; }
        else if (T2.gap(q[0], q[1] - 2, q[1] + 2, q[2], 2) < 2.5) { good = false; why = 'loop at the line'; }
        else if (inStand(q[0], q[1], -q[2], 1.6) || inPalm(q[0], q[1], q[2], 1.2)) { good = false; why = 'loop in a palm or a column'; }
        else if (mid && atStand(s, q[0], q[1], q[2], 0.35)) { good = false; why = 'loop at its own stand'; }
        else for (const o of stands) if (atStand(o, q[0], q[1], q[2], 1.4)) { good = false; why = 'loop at a stand'; break; }
      }
      if (good) { U = u; V = w; loop = pts; }
    }
    if (!U) { drop(why); continue; }
    // (a bird with its wings at their highest and lowest lies within 2 m of its middle every way)
    for (const q of loop) T2.note('parrot on its whole loop', q[0], q[1] - 2, q[1] + 2, q[2], 2);
    // (the stand: a gilt foot, a pole, the bar across the bird's facing with a knob at either end)
    g.kind(4, 0, 0.8, 0).col(GILT, 0.9); g.lathe(x, 0, -d, [[1.0, 0], [0.8, 0.25], [0.2, 0.5], [0.14, 1.2]], 8); g.cbox(x, 1.2, -d, 0.26, y - 1.2, 0.26, { top: false });
    g.tube([s.a, s.b], 0.13, 5);
    for (const e of [-1, 1]) g.cbox(x + e * BAR * fz, y - 0.2, -d - e * BAR * fx, 0.4, 0.4, 0.4, {});
    stands.push(s); shades.push([x, -d, 1.8, 0.4]);
    birds.push({ p: perch, T, U, V, f: Tf / T, ph, yaw, loop });
  }
  await ctx.yield();
  group.add(new THREE.Mesh(await g.buildA(ctx), matW));
  await ctx.yield();
  const parrots = makeParrots(zone, birds); parrots.name = 'parrots'; group.add(parrots);
  await ctx.yield();
  // THE FLOOR (kind 20): earth and moss, a path of tiles under the line (aux.y = how far a point is path), and in the
  // vertex colour the shade of everything that stands on it (trunks, columns, clumps, ferns, beds, stands)
  {
    g = new Geo();
    const nx = 44, nz = Math.max(Math.round((F0 + Z0) / 1.6), 8), row = [];
    for (let j = 0; j <= nz; j++) {
      const d = -Z0 + (F0 + Z0) * j / nz, cx = lx(d);
      for (let i = 0; i <= nx; i++) {
        const x = -HW + 2 * HW * i / nx; let sh = 1;
        for (const s of shades) { const dx = x - s[0], dz = -d - s[1], r2 = (dx * dx + dz * dz) / (s[2] * s[2]); if (r2 < 4) sh *= 1 - s[3] * Math.exp(-1.6 * r2); }
        g.a = [20, 1 - smoothstep(3.3, 4.9, Math.abs(x - cx)), 0.1, 0];
        row.push(g.v(x, 0, -d, 0, 1, 0, [0.5 * sh, 0.5 * sh, 0.5 * sh]));
      }
      if (j % 4 === 3) await ctx.yield();
    }
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const q = row[j * (nx + 1) + i]; g.I.push(q, q + 1, q + nx + 2, q, q + nx + 2, q + nx + 1); }
    const floor = new THREE.Mesh(await g.buildA(ctx), mat); floor.name = 'garden floor'; group.add(floor);
  }
  await ctx.yield();
  // a haze of green light under the roof, the glow of the two doorways
  // (each haze glow is raised until the line passes no nearer its middle than its radius and 2.5 m; the doorway's glow
  // is a ring of glows about the opening's frame, none across the opening)
  const glows = [];
  for (let k = 0; k < 12; k++) {
    const q = { p: [((k * 37) % 41) - 20, 24 + (k * 13) % 17, -(6 + k * (F0 - 12) / 11)], size: 30 + (k % 3) * 6, c: [0.05, 0.085, 0.022], kind: 1, phase: (k * 0.31) % 1, what: 'forest haze' };
    while (T2.dist(q.p[0], q.p[1], q.p[2]) < q.size / 2 + 2.5 && q.p[1] < TOPY - 6) q.p[1] += 0.5;
    glows.push(q);
  }
  const ring = [];
  for (const sx of [-1, 1]) for (const y of [6, 16, 26, 36]) ring.push([sx * BALL.COLX, y]);
  for (let i = 1; i < 6; i++) { const a = Math.PI * i / 6; ring.push([BALL.COLX * Math.cos(a), BALL.BEAM + BALL.COLX * Math.sin(a)]); }
  ring.forEach((q, i) => glows.push({ p: [q[0], q[1], -(F0 - 0.8)], size: 24, c: [0.2, 0.125, 0.045], kind: 1, phase: (0.2 + i * 0.13) % 1, what: 'ring of the forest\'s far doorway' }));
  for (const q of flames) glows.push(q);
  fitGlows(T2, route.best, glows);
  group.add(makeDabs(zone, glows).mesh);
  // (the counts for the reader, taken again on what is built, with no margins: perches whose pole or bar touches a
  // trunk, loops that pass through a trunk (a point every 0.4 m), pairs of perches within 1.2 m of each other)
  let perchAtTrunk = 0, loopThroughTrunk = 0, perchesNear = 0;
  const inTrunk = (q, r) => palms.some((o) => { for (let j = 0; j < 5; j++) if (segDist(q[0], q[1], q[2], o.trunk[j], o.trunk[j + 1]) < 0.95 + r) return true; return false; });
  for (let i = 0; i < birds.length; i++) {
    const b = birds[i], s = stands[i]; let at = false, thru = false;
    for (let yy = 0; yy <= s.p[1]; yy += 0.4) if (inTrunk([s.p[0], yy, s.p[2]], 0.13)) at = true;
    for (let e = 0; e <= 8; e++) if (inTrunk([lerp(s.a[0], s.b[0], e / 8), s.a[1], lerp(s.a[2], s.b[2], e / 8)], 0.13)) at = true;
    const n = Math.ceil(b.loop.length * 2.2);
    for (let j = 0; j <= n; j++) if (inTrunk(parrotLoop(b.p, b.U, b.V, j / n), 0)) thru = true;
    if (at) perchAtTrunk++; if (thru) loopThroughTrunk++;
    for (let k = 0; k < i; k++) if (Math.hypot(birds[k].p[0] - b.p[0], birds[k].p[1] - b.p[1], birds[k].p[2] - b.p[2]) < 1.2) perchesNear++;
    if (i % 6 === 5) await ctx.yield();
  }
  return { group, counts: { palms: palms.length, lianas: hung + slung, parrots: birds.length, gardenColumns: colD.length * 2, perchAtTrunk, loopThroughTrunk, perchesNear } };
}

// ---------------------------------------------------------------- THE CITY OF ROOFS (frame F1, before the window)
// Houses of an old city seen from chimney height: iron roofs, brick stacks, attic windows, wires, a courtyard well, and
// the tall plain house with one open lit window (the hallway's). The ground is 84 m under the hallway's floor.
const GROUND = -84;
function houseWall(g, xa, za, xb, zb, yb, yt, rowY, lit, col, u0 = 0) {
  const len = Math.hypot(xb - xa, zb - za), nx = (zb - za) / (len || 1), nz = -(xb - xa) / (len || 1);
  const put = (x, y, z, u) => { g.a = [15, u, lit, rowY]; return g.v(x, y, z, nx, 0, nz, col); };
  const i0 = put(xa, yb, za, u0), i1 = put(xb, yb, zb, u0 + len), i2 = put(xb, yt, zb, u0 + len), i3 = put(xa, yt, za, u0);
  g.I.push(i0, i1, i2, i0, i2, i3);
}
function chimney(g, x, y0, z, w, top, pots) {
  g.kind(3, 0, 0.05).col([0.3, 0.13, 0.09]); g.cbox(x, y0, z, w, top - y0, w * 0.8, { top: false });
  g.col([0.2, 0.18, 0.17]); g.cbox(x, top, z, w + 0.5, 0.45, w * 0.8 + 0.5, { bottom: true });
  g.kind(0, 0, 0.2).col([0.36, 0.16, 0.1]);
  for (let k = 0; k < pots; k++) g.lathe(x + (k - (pots - 1) / 2) * (w / pots), top + 0.45, z, [[0.34, 0], [0.28, 1.0], [0.36, 1.1], [0.3, 1.25]], 6);
}
// a house: four walls with windows, a pitched roof of sheet iron (ridge along x or along z, or hipped)
function house(g, cx, cz, w, dp, eave, rise, kind, wallC, roofC, lit, rowY) {
  const x0 = cx - w / 2, x1 = cx + w / 2, z0 = cz - dp / 2, z1 = cz + dp / 2, o = 0.9, ry = eave + rise;
  houseWall(g, x0, z1, x1, z1, GROUND, eave, rowY, lit, wallC, cx); houseWall(g, x1, z1, x1, z0, GROUND, eave, rowY, lit, wallC, cz);
  houseWall(g, x1, z0, x0, z0, GROUND, eave, rowY, lit, wallC, cx * 1.3); houseWall(g, x0, z0, x0, z1, GROUND, eave, rowY, lit, wallC, cz * 1.7);
  g.kind(16, 0, 0.5).col(roofC);
  if (kind === 0) {
    g.quad([x0 - o, eave, z1 + o], [x1 + o, eave, z1 + o], [x1 + o, ry, cz], [x0 - o, ry, cz]); g.quad([x1 + o, eave, z0 - o], [x0 - o, eave, z0 - o], [x0 - o, ry, cz], [x1 + o, ry, cz]);
    g.kind(0, 0, 0.05).col(wallC, 0.9); g.tri([x0, eave, z1], [x0, ry, cz], [x0, eave, z0]); g.tri([x1, eave, z0], [x1, ry, cz], [x1, eave, z1]);
  } else if (kind === 1) {
    g.quad([x1 + o, eave, z1 + o], [x1 + o, eave, z0 - o], [cx, ry, z0 - o], [cx, ry, z1 + o]); g.quad([x0 - o, eave, z0 - o], [x0 - o, eave, z1 + o], [cx, ry, z1 + o], [cx, ry, z0 - o]);
    g.kind(0, 0, 0.05).col(wallC, 0.9); g.tri([x0, eave, z1], [x1, eave, z1], [cx, ry, z1]); g.tri([x1, eave, z0], [x0, eave, z0], [cx, ry, z0]);
  } else {
    const hx = Math.max(w / 2 - dp / 2, 0);
    g.quad([x0 - o, eave, z1 + o], [x1 + o, eave, z1 + o], [cx + hx, ry, cz], [cx - hx, ry, cz]); g.quad([x1 + o, eave, z0 - o], [x0 - o, eave, z0 - o], [cx - hx, ry, cz], [cx + hx, ry, cz]);
    g.tri([x1 + o, eave, z1 + o], [x1 + o, eave, z0 - o], [cx + hx, ry, cz]); g.tri([x0 - o, eave, z0 - o], [x0 - o, eave, z1 + o], [cx - hx, ry, cz]);
  }
}
// THE ROOF AS IT IS BUILT: the height of a house's roof over (x, z), or null where (x, z) is not over its walls. h =
// { cx, cz, w, dp, eave, rise, kind } as house() was given them (the slopes run from the eaves' overhang to the ridge;
// a hipped roof is the lower of its long slopes and its hips).
export function roofAt(h, x, z) {
  const ax = Math.abs(x - h.cx), az = Math.abs(z - h.cz), o = 0.9;
  if (ax > h.w / 2 || az > h.dp / 2) return null;
  const alongZ = h.eave + h.rise * (1 - az / (h.dp / 2 + o)), alongX = h.eave + h.rise * (1 - ax / (h.w / 2 + o));
  if (h.kind === 0) return alongZ;
  if (h.kind === 1) return alongX;
  const hx = Math.max(h.w / 2 - h.dp / 2, 0);
  return Math.min(alongZ, h.eave + h.rise * (1 - Math.max(ax - hx, 0) / (h.w / 2 + o - hx)));
}
// an attic window standing out of a roof slope that faces +z (toward the visitor): its pane is lit at night
function dormer(g, x, y, z, roofC, warm) {
  g.kind(0, 0, 0.05).col([0.3, 0.27, 0.22]); g.box(x - 1.9, y - 1.2, z - 3.6, x + 1.9, y + 2.6, z, { top: false });
  g.kind(16, 0, 0.5).col(roofC); g.quad([x - 2.3, y + 2.5, z + 0.4], [x, y + 3.9, z + 0.4], [x, y + 3.9, z - 3.6], [x - 2.3, y + 2.5, z - 3.6]); g.quad([x, y + 3.9, z + 0.4], [x + 2.3, y + 2.5, z + 0.4], [x + 2.3, y + 2.5, z - 3.6], [x, y + 3.9, z - 3.6]);
  g.kind(0, warm, 0.6).col([1, 0.7, 0.34]); g.quad([x - 1.3, y - 0.4, z + 0.03], [x + 1.3, y - 0.4, z + 0.03], [x + 1.3, y + 2.1, z + 0.03], [x - 1.3, y + 2.1, z + 0.03]);
  g.kind(0, 0, 0.1).col([0.1, 0.09, 0.08]); g.box(x - 0.09, y - 0.4, z + 0.03, x + 0.09, y + 2.1, z + 0.1, {}); g.box(x - 1.3, y + 0.9, z + 0.03, x + 1.3, y + 1.06, z + 0.1, {});
}
// chimney smoke: soft puffs that leave a stack, rise, lean with the visit's wind, swell and thin out, for ever on the
// clock (every phase of a puff's life is in the air at once, so it reads the same at any moment). list: { p, size, ph,
// rise, T, k } a puff each; lean = how far the wind has carried a puff by the end of its life.
export function makeSmoke(zone, list, lean) {
  const n = list.length, g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0]), 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
  const iO = new Float32Array(n * 4), iV = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) { const q = list[i]; iO.set([q.p[0], q.p[1], q.p[2], q.size], i * 4); iV.set([q.ph, q.rise, q.T, q.k], i * 4); }
  g.setAttribute('iO', new THREE.InstancedBufferAttribute(iO, 4)); g.setAttribute('iV', new THREE.InstancedBufferAttribute(iV, 4));
  g.instanceCount = n; g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
  const m = new THREE.ShaderMaterial({
    uniforms: { uTime: zone.U.uTime, uAmbUp: zone.U.uAmbUp, uKeyC: zone.U.uKeyC, uFogC: zone.U.uFogC, uFogD: zone.U.uFogD, uLean: { value: new THREE.Vector3(lean[0], 0, lean[1]) } },
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      attribute vec4 iO, iV; uniform float uTime, uFogD; uniform vec3 uLean; varying vec2 vUv; varying float vA, vFog, vK;
      void main(){
        float T = max(iV.z, 1.), q = fract(uTime / T + iV.x), t = q * T;
        vec3 c = iO.xyz + vec3(0., iV.y * t, 0.) + uLean * (q * q) + vec3(sin(t * .7 + iV.w * 30.), 0., cos(t * .6 + iV.w * 17.)) * (.5 * q);
        vec4 mv = viewMatrix * (modelMatrix * vec4(c, 1.));
        mv.xy += position.xy * (iO.w * (.5 + 2.3 * q));
        vUv = position.xy * 2.; vK = iV.w;
        vA = smoothstep(0., .1, q) * (1. - q) * (1. - q) * .5;
        vFog = exp(-uFogD * length(mv.xyz));
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      varying vec2 vUv; varying float vA, vFog, vK; uniform vec3 uAmbUp, uKeyC, uFogC;
      ${NOISE_GLSL}
      void main(){
        float r2 = dot(vUv, vUv), lump = .7 + .6 * vn2(vUv * 2.2 + vK * 40.);
        float a = exp(-r2 * 2.6) * lump * (1. - smoothstep(.7, 1., r2)) * vA;
        vec3 col = uAmbUp * 1.6 + uKeyC * (.16 + .16 * vUv.y);
        gl_FragColor = vec4(mix(uFogC, col, vFog), a);
      }`,
  });
  const mesh = new THREE.Mesh(g, m); mesh.renderOrder = 5; mesh.frustumCulled = false;
  return mesh;
}
export async function buildCity(ctx, plan, zone, R, route, night) {
  const group = new THREE.Group(), glow = { value: night }, mat = litMaterial(zone, { glow }), matW = litMaterial(zone, { wind: true, glow }), T1 = route.f1;
  const rr = R.roofs, rc = R.chimneys, rw = R.windows, flames = [], stacks = [], houses = [], chims = [], yard = {};
  const ROOFS = [[0.1, 0.19, 0.15], [0.27, 0.09, 0.06], [0.2, 0.21, 0.23], [0.1, 0.1, 0.12], [0.16, 0.24, 0.2]], WALLS = [[0.42, 0.33, 0.2], [0.4, 0.3, 0.27], [0.44, 0.42, 0.37], [0.3, 0.33, 0.3], [0.36, 0.26, 0.18]];
  let g = new Geo();
  g.kind(3, 0, 0.1).col([0.05, 0.055, 0.07]); g.quad([-420, GROUND, plan.zStart + 160], [420, GROUND, plan.zStart + 160], [420, GROUND, -40], [-420, GROUND, -40]);
  // rows of houses across the line, from the street before the tall house back past the start; one yard left open under the line
  const zFirst = ST.HALL + 30, yardRow = rr.int(1, 3), yardX = rr.range(-6, 6);
  let z = zFirst, row = 0, nHouse = 0;
  const lineX = (zz) => { let best = 0, bd = 1e9; for (let m = 0; m < plan.zStart; m += 6) { const p = route.f1p(m); if (Math.abs(p[2] - zz) < bd) { bd = Math.abs(p[2] - zz); best = p[0]; } } return best; };
  while (z < plan.zStart + 110) {
    const dp = rr.range(30, 42), cz = z + dp / 2, lx0 = lineX(cz);
    let x = -300 + rr.range(0, 20);
    while (x < 300) {
      const w = rr.range(26, 46), cx = x + w / 2, near = Math.abs(cx - lx0) < w / 2 + 34, ridge = near ? rr.range(-6.5, 0.8) : rr.range(-18, 13), kind = rr.int(0, 2), rise = Math.min(w, dp) * rr.range(0.2, 0.3);
      const wallC = rr.pick(WALLS), roofC = mulc(rr.pick(ROOFS), rr.range(0.8, 1.25)), lit = rr.range(0.08, 0.42), gapW = rr.range(4, 9), gap = rr.chance(0.3) ? gapW : 0, rowY = rr.range(-8, 8), nCh = rc.int(1, 3);
      const inYard = row === yardRow && Math.abs(cx - yardX) < w / 2 + 15, hs = { cx, cz, w, dp, eave: ridge - rise, rise, kind };
      if (!inYard) {
        house(g, cx, cz, w, dp, ridge - rise, rise, kind, wallC, roofC, lit, rowY);
        houses.push(hs);
        T1.noteBox('roof', x - 1, GROUND, cz - dp / 2 - 1, x + w + 1, ridge, cz + dp / 2 + 1);
        // (the yard left open in this row: from the wall of the last house before it to the wall of the first after)
        if (row === yardRow) { if (cx < yardX) { yard.x0 = x + w; yard.eaveL = hs.eave; } else if (yard.x1 === undefined) { yard.x1 = x; yard.eaveR = hs.eave; yard.z0 = cz - dp / 2; yard.z1 = cz + dp / 2; } }
      }
      for (let k = 0; k < 3; k++) {
        const fx = rc.range(-0.36, 0.36), top = ridge + rc.range(2.4, near ? 8.5 : 6), cw = rc.range(2.2, 3.4), pots = rc.int(1, 3), fz = rc.range(-0.3, 0.3);
        if (inYard || k >= nCh) continue;
        const px = kind === 1 ? cx + fz * 4 : cx + fx * w, pz = kind === 1 ? cz + fx * dp : cz + fz * 4;
        // THE CHIMNEY'S FOOT is at the roof's own height at its own place (roofAt: gables and hips alike): 0.1 m under
        // the lowest of its four corners, all four over the house's walls; one that cannot stand so is not set down
        const hw = cw / 2, hd = cw * 0.4; let foot = 1e9;
        for (const [ex, ez] of [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]]) { const ry = roofAt(hs, px + ex, pz + ez); foot = ry === null ? -1e9 : Math.min(foot, ry); }
        if (foot < -1e8 || top < foot + 2) { route.best['chimney off its roof (not set down)'] = (route.best['chimney off its roof (not set down)'] || 0) + 1; continue; }
        if (!T1.keep('chimney', px, GROUND, top + 1.8, pz, cw * 0.75 + 0.4)) continue;
        if (route.back.gap(px, GROUND, top + 1.8, pz, cw * 0.75 + 0.4) < NEARBACK) { route.best['chimney near the axis behind the entry (not set down)'] = (route.best['chimney near the axis behind the entry (not set down)'] || 0) + 1; continue; }
        // behind the entry nothing rises over the eye's line across the view of the camera that flies in
        if (top + 1.8 > plan.Y0 - 1 && route.back.gap(px, plan.Y0 - 1, top + 1.8, pz, cw * 0.75 + 0.4) < TUBE) { route.best['chimney across the view behind the entry (not set down)'] = (route.best['chimney across the view behind the entry (not set down)'] || 0) + 1; continue; }
        chimney(g, px, foot - 0.1, pz, cw, top, pots);
        stacks.push([px, top + 1.7, pz]); chims.push({ x: px, z: pz, hw, hd, y0: foot - 0.1, top, hs });
      }
      const dx = rw.range(-0.3, 0.3), wantD = rw.chance(near ? 0.75 : 0.3), dWarm = rw.range(1.2, 2.6);
      if (!inYard && wantD && kind !== 1) { dormer(g, cx + dx * w, ridge - rise * 0.5, cz + dp * 0.25 + 1.4, roofC, dWarm); T1.noteBox('attic window', cx + dx * w - 2.3, ridge - rise * 0.5 - 1.2, cz + dp * 0.25 - 2.2, cx + dx * w + 2.3, ridge - rise * 0.5 + 3.9, cz + dp * 0.25 + 1.8); }
      x += w + gap;
      if (++nHouse % 5 === 0) await ctx.yield();
    }
    z += dp + (row % 2 ? 15 : 0); row++;
    await ctx.yield();
  }
  // THE TALL PLAIN HOUSE: its front 0.9 m before the hallway's window wall, one window open (the hole), every other dark
  const H = plan.house, nCols = 2 * H.wide + 3, mid = (nCols - 1) / 2, xL = -(mid + H.shift) * 12 - 10, xR = xL + nCols * 12 + 8, zF = ST.HALL + 0.9, zB = ST.HALL - 64;
  const eave = 6.4 + 8.5 + (H.above + 1) * 17 + 2, WC = [0.4, 0.37, 0.31];
  houseWall(g, xL, zF, -3.1, zF, GROUND, eave, 6.4, 0, WC, xL); houseWall(g, 3.1, zF, xR, zF, GROUND, eave, 6.4, 0, WC, 3.1);
  houseWall(g, -3.1, zF, 3.1, zF, GROUND, 1.4, 6.4, 0, WC, -3.1); houseWall(g, -3.1, zF, 3.1, zF, 11.4, eave, 6.4, 0, WC, -3.1);
  houseWall(g, xR, zF, xR, zB, GROUND, eave, 6.4, 0, WC, 3); houseWall(g, xL, zB, xL, zF, GROUND, eave, 6.4, 0, WC, 3);
  // the cornice: a deep band under a slab that stands 1.7 m out (its top takes the moon), a frieze under it; a
  // plinth at the foot; pale quoins up both corners of the front and round onto the sides (the moonlit edges)
  g.kind(0, 0, 0.1).col(WC, 1.25); g.box(xL - 0.8, eave - 1.6, zB, xR + 0.8, eave, zF + 0.8, { bottom: true, top: false });
  g.kind(3, 0, 0.2).col(WC, 1.5); g.box(xL - 1.7, eave - 0.5, zB, xR + 1.7, eave + 0.05, zF + 1.7, { bottom: true }); g.box(xL - 0.3, eave - 3.3, zF, xR + 0.3, eave - 2.7, zF + 0.4, { bottom: true });
  g.col(WC, 0.8); g.box(xL - 0.5, GROUND, zB, xR + 0.5, GROUND + 9, zF + 0.8, {});
  g.col(WC, 1.65);
  for (const xq of [xL, xR]) { const sq = xq === xL ? -1 : 1; g.box(Math.min(xq - sq * 1.5, xq + sq * 0.3), GROUND + 9, zF - 1.5, Math.max(xq - sq * 1.5, xq + sq * 0.3), eave - 1.6, zF + 0.3, {}); }
  // a ledge between every two rows of windows (their tops take the sky's light), and two rain pipes down the front
  for (let y = 14.9; y < eave - 4; y += 17) g.box(xL, y, zF, xR, y + 0.55, zF + 0.45, { bottom: true });
  for (let y = -2.1; y > GROUND + 4; y -= 17) g.box(xL, y, zF, xR, y + 0.55, zF + 0.45, { bottom: true });
  T1.noteBox('ledge of the tall house', xL, 14.9, zF, xR, 15.45, zF + 0.45); T1.noteBox('ledge of the tall house', xL, -2.1, zF, xR, -1.55, zF + 0.45);
  g.kind(4, 0, 0.5).col([0.3, 0.33, 0.36]);
  for (const px of [xL + 5, xR - 6]) { g.box(px, GROUND, zF, px + 0.7, eave - 3.3, zF + 0.7); g.box(px - 0.45, eave - 3.3, zF, px + 1.15, eave - 1.6, zF + 1.1, { bottom: true }); T1.noteBox('rain pipe', px - 0.45, GROUND, zF, px + 1.15, eave, zF + 1.1); }
  g.kind(16, 0, 0.5).col([0.13, 0.15, 0.17]);
  const rz = (zF + zB) / 2, ry = eave + 13;
  g.quad([xL - 1, eave, zF + 1], [xR + 1, eave, zF + 1], [xR - 30, ry, rz], [xL + 30, ry, rz]); g.tri([xR + 1, eave, zF + 1], [xR + 1, eave, zB], [xR - 30, ry, rz]); g.tri([xL - 1, eave, zB], [xL - 1, eave, zF + 1], [xL + 30, ry, rz]);
  for (const fx of [0.2, 0.5, 0.82]) { chimney(g, lerp(xL, xR, fx), eave + 4, zF - 12, 3.4, eave + 14, 3); stacks.push([lerp(xL, xR, fx), eave + 15.7, zF - 12]); }
  // the open window: warm reveals (lit by the hallway, not so bright that they stand as two white bars to either
  // hand as we pass between them), the sill, two casements swung out (their panes take the moon)
  g.kind(0, 0.6, 0.1).col([0.9, 0.56, 0.26]);
  for (const sx of [-1, 1]) g.quad([sx * 3.1, 1.4, ST.HALL], [sx * 3.1, 1.4, zF], [sx * 3.1, 11.4, zF], [sx * 3.1, 11.4, ST.HALL]);
  g.quad([-3.1, 11.4, ST.HALL], [3.1, 11.4, ST.HALL], [3.1, 11.4, zF], [-3.1, 11.4, zF]);
  g.kind(9, 0, 0.4).col([0.5, 0.46, 0.38]); g.box(-3.7, 0.9, zF, 3.7, 1.4, zF + 0.5, { bottom: true });
  for (const sx of [-1, 1]) {
    const a = 0.2, ex = sx * (3.1 + 3.05 * Math.sin(a)), ez = zF + 3.05 * Math.cos(a), P = (t, y) => [lerp(sx * 3.1, ex, t), y, lerp(zF, ez, t)];
    g.kind(9, 0, 0.4).col([0.55, 0.5, 0.42]);
    for (const [t0, t1] of [[0, 0.07], [0.93, 1], [0.47, 0.53]]) g.quad(P(t0, 1.5), P(t1, 1.5), P(t1, 11.3), P(t0, 11.3));
    for (const [y0, y1] of [[1.5, 1.85], [10.95, 11.3], [7.9, 8.15]]) g.quad(P(0, y0), P(1, y0), P(1, y1), P(0, y1));
    g.kind(0, 0.1, 0.95).col([0.08, 0.11, 0.17]); g.quad(P(0.07, 1.85), P(0.93, 1.85), P(0.93, 10.95), P(0.07, 10.95));
    T1.noteBox('casement', Math.min(sx * 3.1, ex) - 0.1, 1.4, zF, Math.max(sx * 3.1, ex) + 0.1, 11.4, ez);
  }
  // the lit window's glow: a ring of glows about its frame on the house's front, none across the opening we enter by
  for (const [gx, gy, gs] of [[5.6, 6.4, 9], [5.4, 2.6, 9.5], [5.4, 10.2, 9.5], [2.4, 14.8, 12], [2.4, -2.0, 12]]) for (const sx of [-1, 1]) flames.push({ p: [sx * gx, gy, zF + 0.5], size: gs, c: mulc(CANDLE, 0.4), kind: 1, phase: (0.3 + gx * 0.17 + gy * 0.07 + (sx > 0 ? 0.4 : 0)) % 1, what: 'ring of the lit window' });
  T1.noteBox('tall house front', xL, 11.4, zF - 1, xR, eave, zF); T1.noteBox('tall house front (under the sill)', xL, GROUND, zF - 1, xR, 1.4, zF + 0.5);
  await ctx.yield();
  // THE FRONT'S DEPTH, out of the front's own stream; every window of the front but the open one gets a hood and a
  // sill of pale stone; three in ten stand LIT WARM (a pane of lamplight behind its bars, curtains drawn back to
  // either hand, the lamp's shade low in the room: lamps and curtains, nobody at them; they burn by the hour outside
  // like every lamp of the city); two in five have a balcony: a slab on brackets, an iron rail on balusters
  const rfa = R.facade, c0 = Math.ceil((xL + 5) / 12), c1 = Math.floor((xR - 5) / 12), IRON = [0.05, 0.05, 0.06], CURTS = [[0.6, 0.14, 0.1], [0.62, 0.5, 0.24], [0.2, 0.3, 0.4], [0.5, 0.45, 0.36]];
  let litN = 0, balN = 0;
  for (let r = -3; r <= H.above + 1; r++) {
    for (let c = c0; c <= c1; c++) {
      const wantLit = rfa.chance(0.3), wantBal = rfa.chance(0.4), curt = rfa.pick(CURTS), warm = rfa.range(1.2, 2.2), lampX = rfa.range(-1.4, 1.4);
      if (r === 0 && c === 0) continue;
      const cx = c * 12, cy = 6.4 + r * 17, zp = zF + 0.05;
      g.kind(3, 0, 0.2).col(WC, 1.5); g.box(cx - 4.0, cy + 5.4, zF, cx + 4.0, cy + 5.95, zF + 0.7, { bottom: true }); g.box(cx - 3.8, cy - 5.6, zF, cx + 3.8, cy - 5.1, zF + 0.55, { bottom: true });
      if (wantLit) {
        g.kind(0, warm, 0.4).col([1, 0.68, 0.34]); g.quad([cx - 3.1, cy - 5, zp], [cx + 3.1, cy - 5, zp], [cx + 3.1, cy + 5, zp], [cx - 3.1, cy + 5, zp], [1, 0.6, 0.28], [1, 0.76, 0.44]);
        g.kind(0, warm * 0.3, 0.1).col(curt);
        for (const sx of [-1, 1]) g.quad([cx + sx * 3.1, cy - 5, zp + 0.03], [cx + sx * 2.3, cy - 5, zp + 0.03], [cx + sx * 1.3, cy + 5, zp + 0.03], [cx + sx * 3.1, cy + 5, zp + 0.03]);
        g.kind(0, warm * 2.2, 0).col([1, 0.84, 0.56]); g.quad([cx + lampX - 0.6, cy - 3.4, zp + 0.02], [cx + lampX + 0.6, cy - 3.4, zp + 0.02], [cx + lampX + 0.35, cy - 2.3, zp + 0.02], [cx + lampX - 0.35, cy - 2.3, zp + 0.02]);
        g.kind(0, 0, 0.1).col([0.07, 0.06, 0.05]); g.box(cx - 0.13, cy - 5, zp, cx + 0.13, cy + 5, zp + 0.1, {}); g.box(cx - 3.1, cy + 1.6, zp, cx + 3.1, cy + 1.86, zp + 0.1, {});
        flames.push({ p: [cx, cy, zF + 0.6], size: 10, c: mulc(CANDLE, 0.16), kind: 1, phase: (c * 0.37 + r * 0.61 + 9) % 1, what: 'lit window of the tall house' });
        litN++;
      }
      if (wantBal) {
        const yb = cy - 5.1, zo = zF + 2.0;
        g.kind(3, 0, 0.25).col(WC, 1.4); g.box(cx - 4.4, yb - 0.55, zF, cx + 4.4, yb, zo, { bottom: true });
        for (const sx of [-1, 1]) g.box(cx + sx * 3.2 - 0.25, yb - 1.9, zF, cx + sx * 3.2 + 0.25, yb - 0.55, zF + 1.2, { top: false, bottom: true });
        g.kind(4, 0, 0.4).col(IRON, 2);
        g.box(cx - 4.3, yb + 1.75, zo - 0.15, cx + 4.3, yb + 1.9, zo - 0.02, { bottom: true });
        for (const sx of [-1, 1]) g.box(cx + sx * 4.3 - 0.07, yb + 1.75, zF, cx + sx * 4.3 + 0.07, yb + 1.9, zo - 0.02, { bottom: true });
        for (let i = 0; i <= 14; i++) g.cbox(cx - 4.2 + i * 0.6, yb, zo - 0.08, 0.08, 1.75, 0.08, { top: false });
        for (const sx of [-1, 1]) for (const zz of [zF + 0.55, zF + 1.2]) g.cbox(cx + sx * 4.3, yb, zz, 0.08, 1.75, 0.08, { top: false });
        T1.noteBox('balcony of the tall house', cx - 4.4, yb - 1.9, zF, cx + 4.4, yb + 1.9, zo);
        balN++;
      }
    }
    await ctx.yield();
  }
  // THE HOUSES TO EITHER HAND of the tall one (so that its front does not end on the night): two a side, lower by a
  // storey or two, set back a little so that the tall house's side shows, their own windows lit by the hour
  for (const sx of [-1, 1]) {
    let xe = sx > 0 ? xR + 0.6 : xL - 0.6;
    for (let k = 0; k < 2; k++) {
      const w = rfa.range(70, 110), drop = rfa.int(1, 2) * 17 + rfa.range(0, 6), dpF = rfa.range(34, 46), setb = rfa.range(1.5, 6), wallC = rfa.pick(WALLS), roofC = mulc(rfa.pick(ROOFS), rfa.range(0.8, 1.2)), litF = rfa.range(0.22, 0.4);
      const hsF = { cx: xe + sx * w / 2, cz: zF - setb - dpF / 2, w, dp: dpF, eave: eave - drop, rise: 9, kind: 0 };
      house(g, hsF.cx, hsF.cz, w, dpF, hsF.eave, 9, 0, wallC, roofC, litF, 6.4);
      for (const fx of [-0.27, 0.22]) {
        const px = hsF.cx + fx * w, pz = hsF.cz + 3; let foot = 1e9;
        for (const [ex, ez] of [[-1.5, -1.2], [1.5, -1.2], [1.5, 1.2], [-1.5, 1.2]]) foot = Math.min(foot, roofAt(hsF, px + ex, pz + ez));
        chimney(g, px, foot - 0.1, pz, 3, hsF.eave + 14, 2); stacks.push([px, hsF.eave + 15.7, pz]);
      }
      xe += sx * (w + 0.5);
    }
    await ctx.yield();
  }
  group.add(new THREE.Mesh(await g.buildA(ctx), mat));
  await ctx.yield();
  // what moves: washing on its lines down in the yard, wires slung from roof to roof under the line
  g = new Geo();
  const rl = R.wires, LIN = [[0.8, 0.8, 0.78], [0.7, 0.75, 0.85], [0.85, 0.7, 0.66], [0.75, 0.8, 0.7]];
  const washing = []; let wires = 0;
  // (the washing hangs IN THE YARD THAT IS THERE: each line from the wall of the house on one hand of the yard to the
  // wall of the house on the other, under the lower of their two eaves, within the yard's own depth)
  const yardOk = yard.x0 !== undefined && yard.x1 !== undefined;
  for (let k = 0; k < 4; k++) {
    const yv = rl.range(-34, -12), zv = rl.range(-40, 90), n = rl.int(3, 6);
    const x0 = yardOk ? yard.x0 : 0, x1 = yardOk ? yard.x1 : 0, y = yardOk ? Math.min(yv, Math.min(yard.eaveL, yard.eaveR) - 1.5) : yv, zz = yardOk ? lerp(yard.z0 + 3, yard.z1 - 3, (zv + 40) / 130) : 0;
    if (yardOk) { g.kind(0, 0, 0.1, 0).col([0.3, 0.3, 0.3]); g.tube([[x0, y, zz], [(x0 + x1) / 2, y - 0.6, zz], [x1, y, zz]], 0.07, 4, 0.07, (t) => 0.5 * t * (1 - t)); washing.push([x0, x1, y, zz]); }
    for (let j = 0; j < 6; j++) {
      const t = (j + 0.7) / 6.6, xx = lerp(x0, x1, t), wd = rl.range(1.6, 3.4), hh = rl.range(2.2, 4.6), c = rl.pick(LIN);
      if (j >= n || !yardOk) continue;
      const put = (x, yy, w) => { g.a = [0, 0, 0.1, w]; return g.v(x, yy, zz, 0, 0, 1, c); };
      const i0 = put(xx - wd / 2, y - 0.5, 0.15), i1 = put(xx + wd / 2, y - 0.5, 0.15), i2 = put(xx + wd / 2, y - 0.5 - hh, 1.2), i3 = put(xx - wd / 2, y - 0.5 - hh, 1.2);
      g.I.push(i0, i1, i2, i0, i2, i3);
    }
  }
  // WIRES. A wire's end stands on a post only where a roof AS BUILT lies under that end within the post's length (the
  // post's foot on that roof); else it is made fast to a chimney that is there (within 7 m, tall enough); else the wire
  // is not strung. Nor is one strung that would pass through a roof. All of it after the wire's draws.
  const roofUnder = (x, zz) => { let r = null; for (const h of houses) { const y = roofAt(h, x, zz); if (y !== null && (r === null || y > r)) r = y; } return r; };
  const POST = 12, posts = [];
  for (let k = 0; k < 90 && wires < 14; k++) {
    const zz = rl.range(ST.HALL + 40, plan.zStart - 10), side = rl.sign(), x0 = lineX(zz) + side * rl.range(3.5, 9), x1 = x0 + side * rl.range(30, 70), y0 = rl.range(1.5, 5.5), y1 = rl.range(-2, 7), dz = rl.range(-20, 20), sag = rl.range(1, 2.6);
    const ends = [[x0, y0, zz], [x1, y1, zz + dz]], feet = []; let ok = true, why = 'wire with no roof or chimney under an end';
    for (const e of ends) {
      const ry = roofUnder(e[0], e[2]);
      if (ry !== null && ry <= e[1] - 0.8 && ry >= e[1] + 0.4 - POST) { feet.push(ry); continue; }
      const c = ry !== null && ry > e[1] - 0.8 ? null : chims.find((q) => Math.hypot(q.x - e[0], q.z - e[2]) < 7 && q.y0 < e[1] - 0.5 && q.top > e[1] + 0.3);
      if (c) { e[0] = c.x; e[2] = c.z; feet.push(null); } else ok = false;
    }
    const pts = [];
    for (let j = 0; j <= 8; j++) { const t = j / 8; pts.push([lerp(ends[0][0], ends[1][0], t), lerp(ends[0][1], ends[1][1], t) - sag * 4 * t * (1 - t), lerp(ends[0][2], ends[1][2], t)]); }
    if (ok) for (let j = 1; j < 8; j++) { const ry = roofUnder(pts[j][0], pts[j][2]); if (ry !== null && ry > pts[j][1] - 0.8) { ok = false; why = 'wire through a roof'; } }
    if (ok) for (const q of pts) if (T1.gap(q[0], q[1] - 0.4, q[1] + 0.4, q[2], 0.6) < 2.5) { ok = false; why = 'wire'; }
    // behind the entry the camera that flies in is given more room, more the farther back (NEARBACK)
    if (ok) for (const q of pts) if (route.back.gap(q[0], q[1] - 0.4, q[1] + 0.4, q[2], 0.6) < NEARBACK) { ok = false; why = 'wire'; }
    if (!ok) { route.best[why + ' (not set down)'] = (route.best[why + ' (not set down)'] || 0) + 1; continue; }
    for (const q of pts) T1.note('wire', q[0], q[1] - 0.4, q[1] + 0.4, q[2], 0.6);
    g.kind(0, 0, 0.3, 0).col([0.05, 0.05, 0.06]); g.tube(pts, 0.07, 4, 0.07, (t) => 1.6 * t * (1 - t));
    for (let e = 0; e < 2; e++) if (feet[e] !== null) {
      const q = ends[e];
      g.cbox(q[0], feet[e], q[2], 0.3, q[1] + 0.4 - feet[e], 0.3, {}); g.box(q[0] - 0.7, q[1] - 0.1, q[2] - 0.08, q[0] + 0.7, q[1] + 0.06, q[2] + 0.08, { bottom: true });
      posts.push([q[0], feet[e], q[2], q[1] + 0.4]);
    }
    wires++;
  }
  // (the count for the reader, tried again on the roofs as built: posts whose foot is not on a roof, or longer than a post)
  let postsInAir = 0;
  for (const [px, fy, pz, ty] of posts) { const ry = roofUnder(px, pz); if (ry === null || Math.abs(ry - fy) > 0.05 || ty - fy > POST + 0.01) postsInAir++; }
  let chimneyCornersClear = 0;
  for (const c of chims) for (const [ex, ez] of [[-c.hw, -c.hd], [c.hw, -c.hd], [c.hw, c.hd], [-c.hw, c.hd]]) { const ry = roofAt(c.hs, c.x + ex, c.z + ez); if (ry === null || c.y0 > ry + 0.1) chimneyCornersClear++; }
  // (washing lines of which any metre between their ends lies over a house's walls)
  let washingInAHouse = 0;
  for (const [x0, x1, , zz] of washing) { let inH = false; for (let xx = x0 + 0.5; xx < x1 - 0.5; xx += 1) if (roofUnder(xx, zz) !== null) inH = true; if (inH) washingInAHouse++; }
  const counts = { litWindows: litN, balconies: balN, wires, wirePosts: posts.length, postsInAir, chimneys: chims.length, chimneyCornersClear, washingLines: washing.length, washingInAHouse };
  group.add(new THREE.Mesh(g.build(), matW));
  // the lamps of the streets, far down
  for (let k = 0; k < 70; k++) flames.push({ p: [rl.range(-280, 280), GROUND + rl.range(5, 9), rl.range(ST.HALL + 12, plan.zStart + 120)], size: rl.range(9, 16), c: mulc(CANDLE, rl.range(0.25, 0.6)), kind: 1, phase: rl(), what: 'street lamp' });
  fitGlows(T1, route.best, flames);
  const dabs = makeDabs(zone, flames, { gain: glow }); group.add(dabs.mesh);
  await ctx.yield();
  // smoke off the stacks: one wind for the visit; a stack smokes only where its smoke's whole course (the rise, the lean,
  // a puff at its largest) stays 2.5 m clear of the line
  const rs = R.smoke, wa = rs.range(0, 6.2832), lean = [Math.cos(wa) * rs.range(7, 13), Math.sin(wa) * rs.range(7, 13)], puffs = [];
  let smoking = 0;
  for (const st of stacks) {
    const want = rs.chance(0.6), T = rs.range(8, 12), rise = rs.range(1.4, 2.2), size = rs.range(2.2, 3.2), ph0 = rs(), k0 = rs(), RAD = size * 1.4 + 0.6;
    if (!want) continue;
    const gapS = T1.gapBox(Math.min(st[0], st[0] + lean[0]) - RAD, st[1] - RAD, Math.min(st[2], st[2] + lean[1]) - RAD, Math.max(st[0], st[0] + lean[0]) + RAD, st[1] + rise * T + RAD, Math.max(st[2], st[2] + lean[1]) + RAD);
    if (gapS < 2.5) { route.best['smoke (not set down)'] = (route.best['smoke (not set down)'] || 0) + 1; continue; }
    // (and no smoke drifts across the view behind the entry)
    if (route.back.gapBox(Math.min(st[0], st[0] + lean[0]) - RAD, st[1] - RAD, Math.min(st[2], st[2] + lean[1]) - RAD, Math.max(st[0], st[0] + lean[0]) + RAD, st[1] + rise * T + RAD, Math.max(st[2], st[2] + lean[1]) + RAD) < TUBE) { route.best['smoke across the view behind the entry (not set down)'] = (route.best['smoke across the view behind the entry (not set down)'] || 0) + 1; continue; }
    route.best.smoke = Math.min(route.best.smoke ?? 99, Math.round(gapS * 100) / 100);
    for (let j = 0; j < 6; j++) puffs.push({ p: st, size, ph: (ph0 + j / 6) % 1, rise, T, k: (k0 + j * 0.37) % 1 });
    smoking++;
  }
  const smoke = makeSmoke(zone, puffs, lean), detail = ctx.quality ? ctx.quality.detail : 1;
  if (detail < 1) smoke.geometry.instanceCount = Math.max(1, Math.round(puffs.length * detail));
  smoke.name = 'smoke'; group.add(smoke);
  await ctx.yield();
  return { group, glow, smoking, counts };
}
