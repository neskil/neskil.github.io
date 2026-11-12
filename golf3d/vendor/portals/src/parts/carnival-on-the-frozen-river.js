// The Carnival on the Frozen River: the hero set piece and the plan of the place.
//
// The hero is the ice itself: a floor of clear dark glass with the carnival on it and the river's dead world under it
// (fish hung where they froze, shoals of eels, and deep on the bed a sunk boat spilling red apples round a still seated
// shape), the salted bonfires burning green, orange and purple over it and doubled in it, and the broken reach below
// it (a standing edge crazed with white cracks, and floes lying parted over yellow water). This module holds:
//   carnivalPlan(seed, vary)   the whole layout as plain numbers (river, route, every thing's place and measures, the
//                              clearance test): no pictures, so a replay can fly any seed by arithmetic
//   the materials of the place (one lit material, its mirror twin, the ice, the floes, the water, what lies under the ice,
//                              sprites for flames, glows and sparks, smoke, the small figures)
//   the makers of the bonfires, of arcades, booths and pavilions, of skaters and dancers, of the ice and what it holds
//   buildHero(ctx, opts)       a round of clear ice with all of it, to be judged alone
//
// River frame: s = metres down the middle line, d = metres to the right of it. The ice's top is y = 0.
//
// WHAT IS DRIVEN BY WHAT. Nothing here reads the metres flown, the film's clock, a seed's flight or the eye's nearness.
//   BY PLACE (standing, the same for every visitor): the broken reach. Below a fixed edge (river metre sT) the river
//     is broken from the first frame to the last; every piece is built where it lies, at a fixed age that is a function
//     of its own river metre. The two lights (night over the fast ice, a yellow morning over the broken reach) are
//     joined by the river metre of the lit point. The ice is swept bare from the silken rope down to its broken edge.
//   BY THE WORLD CLOCK (habits, right at any phase): flames, sparks, glitter, smoke rising, the snow that smokes off the roofs, the waver of candle-lit
//     windows, skaters, dancers; a floe's rock
//     and bob, a slow swing or turn, an eddy's round, a foundering floe's dip, and the rounds of the small floes and
//     the apples that sail lanes of their own down to the bridge (wrapped; under water at both ends of a lane).
//   Every such course is proved against the route's whole line by geometry over every phase at once.
import * as THREE from 'three';
import { makePath, makeRng, hashSeed, clamp, lerp, smoothstep } from '../kit/core.js';
import { makeBuilder } from '../kit/structures.js';

export const DURATION = 48;
export const NFIRE = 12;
const TAU = Math.PI * 2;
const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
const mul = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
const mix3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
export const COL = {
  green: lin('#3ee08a'), orange: lin('#ff8a2a'), purple: lin('#a85cff'), red: lin('#c8203a'), frost: lin('#dbe8ff'),
  deep: lin('#14323c'), lamp: lin('#ffb060'), gold: lin('#d9a441'), thaw: lin('#b88a30'), snow: lin('#e6eefc'),
};

// every stream of the place: a fork of its own made from the seed and a name, all taken here, once
const STREAMS = ['visit', 'river', 'route', 'fires', 'arcades', 'booths', 'pavilions', 'maze', 'balloons', 'skaters', 'standers',
  'sledges', 'court', 'dancers', 'fish', 'eels', 'wreck', 'apples', 'ship', 'floes', 'bergs', 'cargo', 'city', 'spire', 'birds',
  'smoke', 'bridge', 'gulls', 'glitter', 'snow', 'lanterns', 'skyA', 'skyB', 'frost', 'mist', 'hero', 'thawApples', 'houses', 'far',
  'flames', 'piles', 'arcadeDress', 'boothDress', 'pavilionDress', 'mazeDress', 'courtDress', 'shipDress', 'bridgeDress', 'cityDress', 'cargoDress0', 'cargoDress1', 'cargoDress2', 'cargoDress3', 'cargoDress4', 'cargoDress5', 'cargoDress6', 'cargoDress7', 'cargoDress8', 'cargoFire', 'bedDress', 'farTowers', 'ground', 'glowPhase', 'alleySkaters', 'icicles', 'stars', 'heroFire', 'pairs', 'weave', 'heroFloes', 'laden', 'jams', 'sailers', 'towers', 'steam', 'drift', 'moon', 'swept', 'townTowers'];
const forks = (seed) => { const R = {}; for (const n of STREAMS) R[n] = makeRng(hashSeed('frozen-river:' + n + ':' + seed)); return R; };

// ---------------------------------------------------------------- GLSL shared by the materials
const GLSL_NOISE = /* glsl */`
float cfH(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float cfN(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(cfH(i), cfH(i + vec2(1., 0.)), f.x), mix(cfH(i + vec2(0., 1.)), cfH(i + vec2(1., 1.)), f.x), f.y); }
float cfF(vec2 p){ float a = .5, s = 0.; for (int i = 0; i < 4; i++) { s += a * cfN(p); p = p * 2.03 + 17.1; a *= .5; } return s; }
`;
// A rigid piece of the broken reach (a floe, a berg, a slab, a crumb of brash, or what stands on a floe) is BUILT where it
// lies; only its habits are worked here, all on the world clock (uFlow.z).
// fa: centre x, z, seed, phase of its lane's round.  fb: rock, bob (a piece with no bob does not move), swing, turn (rad/s).
// fc: lane speed (m/s; 0 = it does not sail), lane length, the depth it goes under by (a sailer at both ends of its lane, a
// foundering floe on a slow round of its own), the radius of the eddy it rides.
const GLSL_FLOE = /* glsl */`
uniform vec3 uFlow;
vec3 cfTurn(vec3 q, vec3 a, float th){ float c = cos(th), s = sin(th); return q * c + cross(a, q) * s + a * dot(a, q) * (1. - c); }
vec3 cfFloe(vec3 p, vec4 fa, vec4 fb, vec4 fc, inout vec3 n){
  if (fb.y <= 0.) return p;
  float t = uFlow.z, sd = fa.z * 6.2832;
  vec3 c = vec3(fa.x, 0., fa.y), q = p - c, up = vec3(0., 1., 0.), ax = vec3(cos(sd), 0., sin(sd));
  float yaw = fb.z * sin(t * (.1 + .08 * fa.z) + sd * 5.) + fb.w * t;
  float rock = fb.x * sin(t * (.5 + .5 * fa.z) + sd * 3.);
  q = cfTurn(q, up, yaw); n = cfTurn(n, up, yaw);
  q = cfTurn(q, ax, rock); n = cfTurn(n, ax, rock);
  float sails = step(.001, fc.x), life = fract(fa.w + t * fc.x / max(fc.y, 1.));
  float ends = 1. - smoothstep(0., .06, life) * (1. - smoothstep(.94, 1., life));
  float under = mix(smoothstep(.55, .95, .5 + .5 * sin(t * (.09 + .06 * fa.z) + sd * 2.)), ends, sails);
  float lift = fb.y * sin(t * .8 + sd) - fc.z * under;
  float ea = t * (.09 + .05 * fa.z) + sd * 4.;
  vec2 fl = uFlow.xy, off = fl * (fc.y * life * sails + 1.6 * fc.w * cos(ea)) + vec2(-fl.y, fl.x) * (fc.w * sin(ea));
  return c + q + vec3(off.x, lift, off.y);
}
`;
// the same habits by arithmetic (for whatever the CPU must place on a floe at clock t)
const _tq = [0, 0, 0];
const turn = (q, ax, ay, az, th) => {
  const c = Math.cos(th), s = Math.sin(th), d = (ax * q[0] + ay * q[1] + az * q[2]) * (1 - c);
  const x = q[0] * c + (ay * q[2] - az * q[1]) * s + ax * d, y = q[1] * c + (az * q[0] - ax * q[2]) * s + ay * d, z = q[2] * c + (ax * q[1] - ay * q[0]) * s + az * d;
  q[0] = x; q[1] = y; q[2] = z;
};
export function floePoint(T, f, x, y, z, t, out = _tq) {
  if (!(f.bob > 0)) { out[0] = x; out[1] = y; out[2] = z; return out; }
  const sd = f.seed * TAU, yaw = f.swing * Math.sin(t * (0.1 + 0.08 * f.seed) + sd * 5) + f.turn * t, rock = f.rock * Math.sin(t * (0.5 + 0.5 * f.seed) + sd * 3);
  out[0] = x - f.cx; out[1] = y; out[2] = z - f.cz;
  turn(out, 0, 1, 0, yaw); turn(out, Math.cos(sd), 0, Math.sin(sd), rock);
  const sails = f.sail > 0 ? 1 : 0, q = f.ph + t * f.sail / Math.max(f.len, 1), life = q - Math.floor(q);
  const under = sails ? 1 - smoothstep(0, 0.06, life) * (1 - smoothstep(0.94, 1, life)) : smoothstep(0.55, 0.95, 0.5 + 0.5 * Math.sin(t * (0.09 + 0.06 * f.seed) + sd * 2));
  const lift = f.bob * Math.sin(t * 0.8 + sd) - f.dip * under, ea = t * (0.09 + 0.05 * f.seed) + sd * 4;
  const al = f.len * life * sails + 1.6 * f.eddy * Math.cos(ea), ac = f.eddy * Math.sin(ea);
  out[0] += f.cx + T.flow[0] * al - T.flow[1] * ac; out[1] += lift; out[2] += f.cz + T.flow[1] * al + T.flow[0] * ac;
  return out;
}
// every piece of the reach is made by this: the habits a piece does not name are nought
export const reachPiece = (o) => ({ kind: 'core', seed: 0, rock: 0, bob: 0.06, swing: 0, turn: 0, sail: 0, len: 0, ph: 0, dip: 0, eddy: 0, rear: 0, pivot: 0, thick: 1.8, low: 0, top: 0, use: null, ...o });
// ---------------------------------------------------------------- the plan: the river
// a first straight reach, one bend (side and angle drawn), a straight last reach. frame(s) = [x, z, headingX, headingZ]
function makeRiver(L1, LA, bend, HW) {
  const sg = Math.sign(bend) || 1, b = Math.abs(bend), Rr = LA / b, cb = Math.cos(b), sb = Math.sin(b);
  const E = [Rr * (1 - cb), -L1 - Rr * sb];
  const frame = (s) => {
    let x, z, hx, hz;
    if (s <= L1) { x = 0; z = -s; hx = 0; hz = -1; }
    else if (s >= L1 + LA) { const t = s - L1 - LA; x = E[0] + sb * t; z = E[1] - cb * t; hx = sb; hz = -cb; }
    else { const a = (s - L1) / Rr; x = Rr * (1 - Math.cos(a)); z = -L1 - Rr * Math.sin(a); hx = Math.sin(a); hz = -Math.cos(a); }
    return [sg * x, z, sg * hx, hz];
  };
  const at = (s, d) => { const f = frame(s); return [f[0] - f[3] * d, f[1] + f[2] * d]; };
  const locate = (x, z) => {
    const X = sg * x; let best = Infinity, bs = 0;
    const tryS = (s) => { const f = frame(s), dd = (x - f[0]) ** 2 + (z - f[1]) ** 2; if (dd < best) { best = dd; bs = s; } };
    tryS(clamp(-z, -3000, L1));
    tryS(L1 + clamp(Math.atan2(-(z + L1), Rr - X), 0, b) * Rr);
    tryS(L1 + LA + clamp((X - E[0]) * sb - (z - E[1]) * cb, 0, 4000));
    const f = frame(bs);
    return { s: bs, d: (x - f[0]) * -f[3] + (z - f[1]) * f[2] };
  };
  const yawAt = (s) => { const f = frame(s); return Math.atan2(-f[2], -f[3]); };
  return { frame, at, locate, yawAt, HW, L1, LA, bend, sEnd: L1 + LA };
}

function planRiver(P) {
  const r = P.R.river, v = P.R.visit;
  P.hand = v.chance(0.5) ? 1 : -1;
  const hourDraw = v.pick(['night', 'night', 'night', 'night', 'golden', 'day', 'dawn']);
  P.hour = ['night', 'golden', 'day', 'dawn'].includes(P.varyHour) ? P.varyHour : hourDraw;
  const HW = r.range(76, 86), L1 = r.range(300, 380), LA = r.range(170, 230);
  const bend = r.range(14, 26) * Math.PI / 180 * (r.chance(0.5) ? 1 : -1);
  P.river = makeRiver(L1, LA, bend, HW); P.HW = HW;
}

// ---------------------------------------------------------------- the plan: the route and its places
// Places are river metres; the route is laid through them and every window is metres of route between two places.
function* planRoute(P) {
  const r = P.R.route, h = P.hand, HW = P.HW, Rv = P.river;
  const pl = P.places = {};
  pl.sStart = r.range(-6, 10); pl.dStart = HW + r.range(92, 108); pl.sE = pl.sStart + r.range(132, 148);
  pl.sRope = r.range(468, 492);
  pl.sClear = pl.sRope + r.range(86, 96); pl.sWreck = pl.sClear + r.range(44, 56); pl.sShip = pl.sClear + r.range(90, 102);
  pl.sT = Math.max(pl.sShip + r.range(36, 44), Rv.sEnd + 30); pl.sB = pl.sT + r.range(300, 325); pl.sPortal = pl.sB - 8;
  pl.pagSide = r.sign(); pl.wreckSide = r.sign(); pl.shipSide = r.sign();
  pl.yStart = r.range(30, 33); pl.yPortal = 8.5;
  const pts = [], add = (s, d, y) => { const q = Rv.at(s, d); pts.push([q[0], y, q[1]]); };
  const run = pl.sE - pl.sStart, dd = pl.dStart - HW;
  add(pl.sStart, -h * pl.dStart, pl.yStart);
  add(pl.sStart + 0.31 * run, -h * (pl.dStart - 0.31 * dd), pl.yStart);
  add(pl.sStart + 0.64 * run, -h * (pl.dStart - 0.64 * dd), pl.yStart - 2.6);
  add(pl.sE, -h * HW, 20.5);
  add(pl.sE + 50, -h * HW * 0.5, 10.4);
  add(pl.sE + 102, -h * HW * 0.16, 5.6);
  // the alley: a slow weave, low over the ice
  let sg = h, s = pl.sE + 162; const alley = [];
  // the weave has a stream of its own: how many turns it takes does not move any later draw of the route
  const rwv = P.R.weave;
  while (s < pl.sRope - 52) { const d = sg * rwv.range(4, 8), y = rwv.range(4.3, 4.9); add(s, d, y); alley.push([s, d]); sg = -sg; s += rwv.range(56, 68); }
  pl.alley0 = pl.sE + 34; pl.dRope = -pl.pagSide * r.range(2, 5);
  add(pl.sRope, pl.dRope * 0.6, 4.9);
  add(pl.sRope + 46, pl.dRope, 5.3);
  add(pl.sClear + 8, pl.wreckSide * 2.5, 3.9);
  add(pl.sWreck - 6, -pl.wreckSide * r.range(0.5, 2.5), 3.3);
  add(pl.sShip - 2, pl.shipSide * r.range(7, 11), 3.9);
  add(pl.sT + 6, pl.shipSide * 2, 5.8);
  const w1 = r.range(8, 12), sg2 = -pl.shipSide, Lr = pl.sPortal - 130 - pl.sT;
  add(pl.sT + 0.5 * Lr, sg2 * w1, 8.2);
  add(pl.sPortal - 130, 0, pl.yPortal);
  add(pl.sPortal - 65, 0, pl.yPortal);
  add(pl.sPortal, 0, pl.yPortal);
  P.points = pts;
  yield;
  const path = P.path = makePath(pts), L = P.L = path.length;
  yield;
  // the line at every 2 m: place, plan tangent, river metre (the route runs down the river: its s never falls)
  const n = P.n = Math.floor(L / 2) + 1, X = P.X = new Float32Array(n), Y = P.Y = new Float32Array(n), Z = P.Z = new Float32Array(n), Sr = P.Sr = new Float32Array(n);
  const v = new THREE.Vector3();
  for (let i = 0; i < n; i++) { if (i % 90 === 89) yield; path.posAtDist(Math.min(i * 2, L), v); X[i] = v.x; Y[i] = v.y; Z[i] = v.z; Sr[i] = Rv.locate(v.x, v.z).s; }
  P.mOfS = (sv) => { for (let i = 1; i < n; i++) if (Sr[i] >= sv) { const a = Sr[i - 1], b = Sr[i]; return (i - 1 + (b > a ? (sv - a) / (b - a) : 0)) * 2; } return L; };
  P.lineAt = (m) => {
    const i = clamp(Math.floor(m / 2), 0, n - 2), t = clamp(m / 2 - i, 0, 1), j = Math.min(i + 1, n - 1), k = Math.max(i - 1, 0);
    let tx = X[j] - X[k], tz = Z[j] - Z[k]; const tl = Math.hypot(tx, tz) || 1; tx /= tl; tz /= tl;
    return { x: lerp(X[i], X[j], t), y: lerp(Y[i], Y[j], t), z: lerp(Z[i], Z[j], t), tx, tz, nx: -tz, nz: tx };
  };
  // a point beside the line: off metres to the right of it at route metre m
  P.beside = (m, off) => { const f = P.lineAt(m); return [f.x + f.nx * off, f.z + f.nz * off, f]; };
  // smallest distance between the line and an upright round thing (centre x z, radius r, from y0 to y1), by kind.
  // The line is the route AND the entry axis behind its first point (the first tangent continued backward, level, for
  // 60 m: the camera that draws this world inside the opening before it flies there), so every rule keeps both clear.
  P.gaps = {};
  const NB = 30, XB = P.XB = new Float32Array(NB), ZB = P.ZB = new Float32Array(NB), YB = P.YB = Y[0];
  { let tx = X[1] - X[0], tz = Z[1] - Z[0]; const tl = Math.hypot(tx, tz) || 1; tx /= tl; tz /= tl; for (let k = 0; k < NB; k++) { XB[k] = X[0] - tx * 2 * (k + 1); ZB[k] = Z[0] - tz * 2 * (k + 1); } }
  P.gapBack = (x, z, r, y0, y1) => {
    let best = Infinity;
    for (let k = 0; k < NB; k++) { const dh = Math.max(Math.hypot(XB[k] - x, ZB[k] - z) - r, 0), dy = YB > y1 ? YB - y1 : YB < y0 ? y0 - YB : 0, dist = Math.hypot(dh, dy); if (dist < best) best = dist; }
    return best;
  };
  P.gap = (x, z, r, y0, y1, i0 = 0, i1 = n - 1) => {
    let best = i0 === 0 ? P.gapBack(x, z, r, y0, y1) : Infinity;
    for (let i = i0; i <= i1; i++) {
      const dx = X[i] - x, dz = Z[i] - z, q = dx * dx + dz * dz; if (q > best * best + 4 * r * r + 4 * best * r + 900) continue;
      const dh = Math.max(Math.sqrt(q) - r, 0), dy = Y[i] > y1 ? Y[i] - y1 : Y[i] < y0 ? y0 - Y[i] : 0, dist = Math.hypot(dh, dy);
      if (dist < best) best = dist;
    }
    return best;
  };
  // the same for a body that travels a straight course from a to b (a lane's whole round at once): radius r, from y0 to y1
  P.gapSeg = (ax, az, bx, bz, r, y0, y1) => {
    const ex = bx - ax, ez = bz - az, el = ex * ex + ez * ez || 1; let best = Infinity;
    for (let i = 0; i < n; i++) {
      const t = clamp(((X[i] - ax) * ex + (Z[i] - az) * ez) / el, 0, 1), dh = Math.max(Math.hypot(X[i] - ax - ex * t, Z[i] - az - ez * t) - r, 0);
      const dy = Y[i] > y1 ? Y[i] - y1 : Y[i] < y0 ? y0 - Y[i] : 0, dist = Math.hypot(dh, dy);
      if (dist < best) best = dist;
    }
    return best;
  };
  // accept a thing of a kind when it keeps `need` metres from the line; the smallest gap of each kind is kept for the report
  P.keep = (kind, x, z, r, y0, y1, need = 2.8) => {
    const g = P.gap(x, z, r, y0, y1); if (g < need) { P.gaps[kind + ':refused'] = (P.gaps[kind + ':refused'] || 0) + 1; return false; }
    P.gaps[kind] = Math.min(P.gaps[kind] ?? Infinity, g); return true;
  };
  yield;
  const M = P.M = {};
  for (const k of ['sE', 'alley0', 'sRope', 'sClear', 'sWreck', 'sShip', 'sT', 'sB']) M[k] = P.mOfS(pl[k]);
  M.pag = P.mOfS(pl.sRope + 50);
  // the broken reach's frame: its edge at river metre sT, the way the race runs (the last reach is straight)
  const q = Rv.frame(pl.sT + 100), spare = r.range(0.36, 0.44); P.T = { sT: pl.sT, flow: [q[2], q[3]], sB: pl.sB, spare };
  // the film's pace, between places a person standing there could name: a little faster down the alley, from its first
  // arcade bay to its last (each ramp one run of ten bays long); slower over the clear ice, from where the clear ice
  // begins to the broken edge (each ramp one length of the ship). The ends are set when the bays and the ship are planned.
  P.paceEnds = { bay0: M.alley0, bay1: M.sRope - 16, run: 38, ship: 47 };
  P.pace = (u) => {
    const m = u * L, E = P.paceEnds;
    return 1 + 0.13 * smoothstep(E.bay0, E.bay0 + E.run, m) * (1 - smoothstep(E.bay1 - E.run, E.bay1, m))
      - 0.3 * smoothstep(M.sClear, M.sClear + E.ship, m) * (1 - smoothstep(M.sT - E.ship, M.sT, m));
  };
}

// ---------------------------------------------------------------- the plan: bonfires
const FIRE3 = [COL.green, COL.orange, COL.purple];
// a salted fire's colour on the world clock: it holds one of the three, then turns into the next (reads well at every phase)
export function fireColor(f, t, out) {
  const q = t / f.per + f.ph * 3, i = Math.floor(q), k = smoothstep(0.7, 1, q - i), a = FIRE3[f.seq[i % 3]], b = FIRE3[f.seq[(i + 1) % 3]];
  out[0] = lerp(a[0], b[0], k); out[1] = lerp(a[1], b[1], k); out[2] = lerp(a[2], b[2], k); return out;
}
function planFires(P) {
  const r = P.R.fires, M = P.M, pl = P.places, Rv = P.river;
  P.fires = []; P.foot = []; P.lanterns = [];
  P.free = (x, z, rad) => { for (const f of P.foot) if ((f[0] - x) ** 2 + (f[1] - z) ** 2 < (f[2] + rad) ** 2) return false; return true; };
  P.claim = (x, z, rad) => { P.foot.push([x, z, rad]); };
  const fire = (x, z, o = {}) => {
    const f = { x, z, s: Rv.locate(x, z).s, R: r.range(2.3, 3.1), H: r.range(8, 10.5), seq: r.shuffle([0, 1, 2]), per: r.range(8, 13), ph: r(), floe: null, i: P.fires.length, ...o };
    if (P.fires.length >= NFIRE || !P.free(x, z, f.R + 5)) return null;
    // the fire's own body (flames and sparks, to the top of its smoke), and the frost that falls glittering through
    // its light as far as 12 m out: both keep clear of the line
    if (!P.keep('fire', x, z, f.R + 2.2, 0, 72) || !P.keep('glitter', x, z, 12.4, 0, 15.2)) return null;
    P.fires.push(f); P.claim(x, z, f.R + 5); return f;
  };
  // down the alley: one after another, on alternate sides, each 19 to 26 m off the line
  let side = P.hand, m = M.alley0 + r.range(24, 40);
  for (let k = 0; k < 9; k++) { const off = side * r.range(19, 26), step = r.range(46, 60); if (m < M.sRope - 34 && P.fires.length < NFIRE - 5) { const q = P.beside(m, off); fire(q[0], q[1], { m, side }); } side = -side; m += step; }
  // the court's fire (across the ground from the pagoda, 36 to 42 m from the river's middle), one by the clear ice, and two far ones across the river
  let q = Rv.at(pl.sRope + r.range(46, 58), -pl.pagSide * r.range(36, 42)); fire(q[0], q[1], {});
  q = Rv.at(pl.sShip - r.range(34, 46), -pl.shipSide * r.range(30, 38)); fire(q[0], q[1], {});
  q = Rv.at(pl.sE + r.range(170, 230), P.hand * r.range(48, 60)); fire(q[0], q[1], {});
  q = Rv.at(pl.sRope - r.range(60, 120), -P.hand * r.range(50, 60)); fire(q[0], q[1], {});
}

// ---------------------------------------------------------------- the plan: the carnival on the ice
function* planCarnival(P) {
  const M = P.M, pl = P.places, dens = P.density;
  const lamp = (x, y, z, size = 1, c = 0, floe = null) => P.lanterns.push({ x, y, z, size, c, floe });
  P.lamp = lamp;
  // arcades: bays of 3.8 m down both sides of the alley, in runs with gaps; a gap is left before every bonfire
  const ra = P.R.arcades, BAY = 3.8, OFF = 10.6;
  P.bays = []; P.strings = [];
  for (const side of [-1, 1]) {
    let runLeft = ra.int(6, 11), gapLeft = 0, prevOn = false;
    let cnt = 0;
    for (let m = M.alley0; m < M.sRope - 16; m += BAY) {
      if (++cnt % 10 === 0) yield;
      const drawH = ra.range(5.9, 6.6), drawL = ra.int(0, 5), drawRun = ra.int(6, 11), drawGap = ra.int(2, 4);
      if (gapLeft > 0) { gapLeft--; if (!gapLeft) runLeft = drawRun; prevOn = false; continue; }
      const q = P.beside(m + BAY / 2, side * OFF), f = q[2];
      let ok = P.lineAt(m).y < 7.5;
      for (const fi of P.fires) if (Math.hypot(fi.x - q[0], fi.z - q[1]) < 17) ok = false;
      if (ok) ok = P.keep('arcade', q[0], q[1], 2.2, 0, drawH + 1.4, 4.5);
      if (!ok) { prevOn = false; continue; }
      const a = P.beside(m, side * OFF), b = P.beside(m + BAY, side * OFF);
      P.bays.push({ a: [a[0], a[1]], b: [b[0], b[1]], nx: -side * f.nx, nz: -side * f.nz, h: drawH, first: !prevOn, lc: drawL, side, m });
      lamp((a[0] + b[0]) / 2, drawH - 2.5, (a[1] + b[1]) / 2, 1, drawL);
      P.claim(q[0], q[1], 2.4); prevOn = true;
      if (--runLeft <= 0) gapLeft = drawGap;
    }
  }
  yield;
  // strings of lanterns across the alley, from masts in the arcade lines, well over the line
  const rs = P.R.lanterns;
  for (let m = M.alley0 + rs.range(8, 20); m < M.sRope - 20; m += rs.range(19, 26)) {
    const top = rs.range(10.2, 11), sag = rs.range(0.8, 1.2), nl = 9, cols = []; for (let k = 0; k < nl; k++) cols.push(rs.int(0, 5));
    const f = P.lineAt(m), a = P.beside(m, -OFF - 0.6), b = P.beside(m, OFF + 0.6);
    let ok = f.y + 2.8 + 1.15 <= top - sag;
    for (const fi of P.fires) if (Math.hypot(fi.x - a[0], fi.z - a[1]) < 9 || Math.hypot(fi.x - b[0], fi.z - b[1]) < 9) ok = false;
    if (!ok) continue;
    P.gaps.string = Math.min(P.gaps.string ?? Infinity, top - sag - 1.15 - f.y);
    const st = { a: [a[0], top, a[1]], b: [b[0], top, b[1]], sag, lamps: [] };
    for (let k = 1; k < nl; k++) { const t = k / nl, y = top - sag * 4 * t * (1 - t) - 0.45; st.lamps.push([lerp(a[0], b[0], t), y, lerp(a[1], b[1], t)]); lamp(lerp(a[0], b[0], t), y, lerp(a[1], b[1], t), 0.8, cols[k]); }
    P.strings.push(st);
  }
  yield;
  // striped pavilions further out, on alternate sides
  const rp = P.R.pavilions; P.pavilions = [];
  let side = -P.hand;
  for (let m = M.alley0 + rp.range(10, 40); m < M.sRope - 30; m += rp.range(34, 50)) {
    const rad = rp.range(4.4, 6), hh = rp.range(9, 11.5), off = side * rp.range(25, 35), cA = rp.int(0, 4), cB = rp.int(0, 2), q = P.beside(m, off);
    side = -side;
    if (!P.free(q[0], q[1], rad + 1.5) || !P.keep('pavilion', q[0], q[1], rad + 0.6, 0, hh + 3)) continue;
    P.pavilions.push({ x: q[0], z: q[1], r: rad, h: hh, cA, cB, floe: null }); lamp(q[0], hh + 0.3, q[1], 1.3, 0);
    P.claim(q[0], q[1], rad + 1.5);
  }
  yield;
  // drinking booths behind the arcades and in their gaps
  const rb = P.R.booths; P.booths = []; let nb = 0;
  for (const side of [-1, 1]) for (let m = M.alley0 + rb.range(0, 8); m < M.sRope - 20; m += rb.range(8.5, 13) / dens) {
    if (++nb % 8 === 0) yield;
    const off = side * rb.range(15.5, 19.5), w = rb.range(3, 4.4), dp = rb.range(2.6, 3.4), hh = rb.range(3.1, 3.8), kind = rb.int(0, 2), cA = rb.int(0, 4), turnY = rb.range(-0.25, 0.25);
    const q = P.beside(m, off), f = q[2];
    if (f.y > 9 || !P.free(q[0], q[1], 2.9) || !P.keep('booth', q[0], q[1], 3.2, 0, hh + 1.5, 5)) continue;
    const yaw = Math.atan2(-side * f.nx, -side * f.nz) + turnY;
    P.booths.push({ x: q[0], z: q[1], yaw, w, d: dp, h: hh, kind, cA, floe: null });
    lamp(q[0] + Math.sin(yaw) * (dp / 2 + 0.5), hh - 0.7, q[1] + Math.cos(yaw) * (dp / 2 + 0.5), 1, 0);
    P.claim(q[0], q[1], 2.9);
  }
}

// the maze of clipped evergreens in tubs: a true maze (one way between any two cells), 8 by 6 cells, beside the alley
function planMaze(P) {
  const r = P.R.maze, M = P.M, NX = 8, NZ = 6, C = 2.8;
  const start = r.int(0, NX * NZ - 1), tries = []; for (let i = 0; i < 8; i++) tries.push([r.range(M.alley0 + 40, M.sRope - 60), r.sign()]);
  const order = []; for (let i = 0; i < NX * NZ * 4; i++) order.push(r());
  P.maze = { segs: [], h: 2.1 };
  let cx = 0, cz = 0, f = null;
  for (const [m, side] of tries) {
    const q = P.beside(m, side * (14.5 + NZ * C / 2));
    if (f || !P.free(q[0], q[1], 15) || P.gap(q[0], q[1], 14.5, 0, 3.2) < 4) continue;
    cx = q[0]; cz = q[1]; f = q[2]; P.maze = { x: cx, z: cz, tx: f.tx, tz: f.tz, nx: f.nx, nz: f.nz, segs: [], h: 2.1, m, side };
  }
  if (!f) { P.gaps['maze:refused'] = (P.gaps['maze:refused'] || 0) + 1; return; }
  P.gaps.maze = Math.min(P.gaps.maze ?? Infinity, P.gap(cx, cz, 14.5, 0, 3.2));
  P.claim(cx, cz, 14.5);
  // depth-first carve; wallsE[i][j] = wall on the +x side of cell (i,j), wallsN on its +z side
  const E = [], N = [], seen = new Uint8Array(NX * NZ); for (let i = 0; i < NX * NZ; i++) { E.push(1); N.push(1); }
  const stack = [start]; seen[start] = 1; let k = 0;
  while (stack.length) {
    const c = stack[stack.length - 1], i = c % NX, j = Math.floor(c / NX), opts = [];
    if (i > 0 && !seen[c - 1]) opts.push(c - 1); if (i < NX - 1 && !seen[c + 1]) opts.push(c + 1);
    if (j > 0 && !seen[c - NX]) opts.push(c - NX); if (j < NZ - 1 && !seen[c + NX]) opts.push(c + NX);
    if (!opts.length) { stack.pop(); continue; }
    const d = opts[Math.floor(order[k++ % order.length] * opts.length)];
    if (d === c + 1) E[c] = 0; else if (d === c - 1) E[d] = 0; else if (d === c + NX) N[c] = 0; else N[d] = 0;
    seen[d] = 1; stack.push(d);
  }
  const W = (lx, lz) => [cx + f.tx * lx + f.nx * lz, cz + f.tz * lx + f.nz * lz], x0 = -NX * C / 2, z0 = -NZ * C / 2;
  const seg = (ax, az, bx, bz) => { const a = W(ax, az), b = W(bx, bz); P.maze.segs.push([a[0], a[1], b[0], b[1]]); };
  for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) {
    const c = j * NX + i, x = x0 + i * C, z = z0 + j * C;
    if (E[c] && i < NX - 1) seg(x + C, z, x + C, z + C);
    if (N[c] && j < NZ - 1) seg(x, z + C, x + C, z + C);
  }
  for (let i = 0; i < NX; i++) { if (i !== 1) seg(x0 + i * C, z0, x0 + (i + 1) * C, z0); if (i !== NX - 2) seg(x0 + i * C, -z0, x0 + (i + 1) * C, -z0); }
  for (let j = 0; j < NZ; j++) { seg(x0, z0 + j * C, x0, z0 + (j + 1) * C); seg(-x0, z0 + j * C, -x0, z0 + (j + 1) * C); }
  for (const [lx, lz] of [[x0, z0], [-x0, z0], [x0, -z0], [-x0, -z0]]) { const w = W(lx, lz); P.lanterns.push({ x: w[0], y: 3.4, z: w[1], size: 1, c: 0, floe: null }); }
}

// balloons hanging still on their cords: seen whole, above and beside; no balloon and no cord within 14 m of the line
function* planBalloons(P) {
  const r = P.R.balloons, M = P.M, n = Math.round(r.int(14, 20) * P.density);
  P.balloons = [];
  for (let i = 0; i < 26; i++) {
    if (i % 5 === 4) yield;
    const m = r.range(M.alley0 - 30, M.sClear), off = r.sign() * r.range(15.5, 32), y = r.range(15, 28), rad = r.range(1.7, 2.5), c = r.int(0, 5), sx = r.range(-4, 4), sz = r.range(-4, 4);
    if (i >= n) continue;
    const q = P.beside(m, off), st = [q[0] + sx, q[1] + sz];
    let ok = P.gap(q[0], q[1], rad + 0.4, y - rad * 1.3, y + rad) >= 14;
    for (let k = 1; k < 6 && ok; k++) { const t = k / 6; ok = P.gap(lerp(st[0], q[0], t), lerp(st[1], q[1], t), 0.3, 0, lerp(0, y - rad * 1.3, t) + 0.5) >= 14; }
    if (!ok || !P.free(st[0], st[1], 0.6)) { P.gaps['balloon:refused'] = (P.gaps['balloon:refused'] || 0) + 1; continue; }
    P.gaps.balloon = Math.min(P.gaps.balloon ?? Infinity, P.gap(q[0], q[1], rad + 0.4, y - rad * 1.3, y + rad));
    P.balloons.push({ x: q[0], y, z: q[1], r: rad, c, stake: st }); P.claim(st[0], st[1], 0.6);
  }
}

// the court's ground past the silken rope: the pagoda, the dancers' ring, the players' stand
function* planCourt(P) {
  const r = P.R.court, pl = P.places, Rv = P.river, ps = pl.pagSide;
  const C = P.court = { posts: [], rope: [] };
  const sc = pl.sRope + 42, a = 42, b = Math.min(46, P.HW - 24), np = 84;
  for (let i = 0; i < np; i++) {
    if (i % 20 === 19) yield;
    const th = i / np * TAU, cs = Math.cos(th), sn = Math.sin(th);
    const q = Rv.at(sc + a * Math.sign(cs) * Math.sqrt(Math.abs(cs)), b * Math.sign(sn) * Math.sqrt(Math.abs(sn)));
    C.rope.push(q);
    if (P.keep('rope post', q[0], q[1], 0.25, 0, 1.4)) C.posts.push(q);
  }
  const tiers = r.int(4, 5), pw = r.range(9, 10.5), ph = 5 * tiers + 6.4, pd = r.range(38, 43), rr = r.range(7, 8.2), couples = r.int(12, 16);
  let q = Rv.at(pl.sRope + 50, ps * pd);
  C.pagoda = { x: q[0], z: q[1], yaw: Rv.yawAt(pl.sRope + 50) + (ps > 0 ? -Math.PI / 2 : Math.PI / 2), tiers, w: pw, h: ph, ok: P.keep('pagoda', q[0], q[1], pw, 0, ph + 2, 12) };
  P.claim(q[0], q[1], pw * 0.8);
  q = Rv.at(pl.sRope + 24, ps * (rr + 8.5));
  C.ring = { x: q[0], z: q[1], R: rr, couples, ok: P.keep('dancers', q[0], q[1], rr + 1.6, 0, 2.3, 3.5) };
  P.claim(q[0], q[1], rr + 2);
  q = Rv.at(pl.sRope + 30, -ps * r.range(20, 24));
  C.dais = { x: q[0], z: q[1], yaw: Rv.yawAt(pl.sRope + 30) + (ps > 0 ? Math.PI / 2 : -Math.PI / 2), ok: P.free(q[0], q[1], 4) && P.keep('dais', q[0], q[1], 3.6, 0, 6, 6) };
  P.claim(q[0], q[1], 4);
  for (let i = 0; i < 4; i++) { const t = i / 4 * TAU + 0.4, x = C.pagoda.x + Math.cos(t) * pw * 0.9, z = C.pagoda.z + Math.sin(t) * pw * 0.9; P.lanterns.push({ x, y: 3.2, z, size: 1.3, c: 0, floe: null }); }
}

// ---------------------------------------------------------------- the plan: what the ice holds
// Nothing here is near the line (all of it lies under the ice's top); places are beside the line's foot over the swept ice.
function planIce(P) {
  const pl = P.places, Rv = P.river, M = P.M, rf = P.R.fish, re = P.R.eels, rw = P.R.wreck, rap = P.R.apples;
  const I = P.ice = { fish: [], eels: [], apples: [] };
  // the bed: about 6 m down, with a pool by the wreck where the river froze deepest
  const wd = pl.wreckSide * rw.range(6, 8), wq = Rv.at(pl.sWreck, wd), depth = rw.range(9.5, 12);
  I.wreck = { x: wq[0], z: wq[1], depth, yaw: Rv.yawAt(pl.sWreck) + rw.range(-0.9, 0.9), heel: rw.range(0.18, 0.34) * rw.sign(), len: rw.range(8.5, 10), seatSide: rw.sign() };
  P.bedY = (x, z) => {
    const dx = x - wq[0], dz = z - wq[1], pool = Math.exp(-(dx * dx + dz * dz) / (2 * 15 * 15));
    return -(6.2 + 0.9 * Math.sin(x * 0.045) * Math.cos(z * 0.038) + (depth - 6.2) * pool);
  };
  // the porpoise (one or two), flounders, and the small fish, hung at their depths beside the line's foot
  const m0 = M.sClear + 6, m1 = M.sT - 30;
  const np = rf.int(1, 2), nf = rf.int(3, 5), ns = Math.min(100, Math.round(rf.int(52, 76) * 1.3 * P.density));
  for (let i = 0; i < 2; i++) {
    const m = lerp(m0 + 8, m0 + 60, (i + rf()) / 2), off = rf.sign() * rf.range(4.5, 8), y = -rf.range(1.4, 2.4), yaw = rf.range(0, TAU), len = rf.range(2.7, 3.3), arch = rf.range(0.15, 0.4);
    if (i >= np) continue;
    const q = P.beside(m, off); I.fish.push({ kind: 0, x: q[0], y, z: q[1], yaw, len, arch });
  }
  for (let i = 0; i < 5; i++) {
    const m = rf.range(m0, m1), off = rf.sign() * rf.range(3.5, 10), y = -rf.range(0.7, 1.6), yaw = rf.range(0, TAU), len = rf.range(1.0, 1.4), arch = rf.range(-0.2, 0.2);
    if (i >= nf) continue;
    const q = P.beside(m, off); I.fish.push({ kind: 1, x: q[0], y, z: q[1], yaw, len, arch });
  }
  for (let i = 0; i < 100; i++) {
    const m = rf.range(M.sRope + 40, m1 + 20), off = rf.gauss() * 11, y = -rf.range(0.5, 3.4), yaw = rf.range(0, TAU), len = rf.range(0.45, 0.9), arch = rf.range(-0.3, 0.3);
    if (i >= ns) continue;
    const q = P.beside(m, off); I.fish.push({ kind: 2, x: q[0], y, z: q[1], yaw, len, arch });
  }
  // shoals of eels lying motionless
  const nsh = re.int(2, 3);
  for (let k = 0; k < 3; k++) {
    const m = lerp(m0, m1, (k + re.range(0.15, 0.85)) / 3), off = re.sign() * re.range(4, 9), base = re.range(0, TAU), yy = -re.range(1.0, 2.2), n = Math.round(re.int(34, 56) * P.density);
    const q = P.beside(m, off);
    for (let i = 0; i < 64; i++) {
      const a = re.range(0, TAU), rad = 5.5 * Math.sqrt(re()), yaw = base + re.gauss() * 0.35, len = re.range(1.0, 1.7), y = yy + re.range(-0.5, 0.5), wig = re.range(0, TAU), amp = re.range(0.1, 0.24);
      if (k >= nsh || i >= n) continue;
      I.eels.push({ x: q[0] + Math.cos(a) * rad * 1.5, y, z: q[1] + Math.sin(a) * rad * 0.8, yaw, len, wig, amp });
    }
  }
  // the apples: in the boat, in the seated shape's lap, and spilled round them on the bed
  const na = rap.int(330, 420), cy = Math.cos(I.wreck.yaw), sy = Math.sin(I.wreck.yaw);
  for (let i = 0; i < 420; i++) {
    const t = rap(), a = rap.range(0, TAU), rad = Math.abs(rap.gauss()) * 2.6 + 0.3, lx = rap.range(-0.42, 0.42) * I.wreck.len, lz = rap.range(-0.7, 0.7), sz = rap.range(0.085, 0.12), tint = rap.range(0.7, 1.15);
    const lapX = rap.range(-0.3, 0.3), lapZ = rap.range(-0.3, 0.3);
    if (i >= na) continue;
    if (t < 0.22) I.apples.push({ lx, lz, where: 1, sz, tint });
    else if (t < 0.3) I.apples.push({ lx: lapX, lz: lapZ, where: 2, sz, tint });
    else { const x = I.wreck.x + (Math.cos(a) * rad * 1.3) * cy + (Math.sin(a) * rad) * sy, z = I.wreck.z - (Math.cos(a) * rad * 1.3) * sy + (Math.sin(a) * rad) * cy; I.apples.push({ x, z, where: 0, sz, tint }); }
  }
}

// the foreign ship frozen fast at her moorings, head to the stream as a moored ship lies (her bow up the river), masts stiff with ice
function planShip(P) {
  const r = P.R.ship, pl = P.places, Rv = P.river;
  const d = pl.shipSide * (P.HW - r.range(24, 30)), q = Rv.at(pl.sShip, d), len = r.range(44, 50), yaw = Rv.yawAt(pl.sShip) + r.range(-0.12, 0.12);
  const masts = [r.range(30, 33), r.range(36, 40), r.range(26, 29)], heel = r.range(-0.035, 0.035);
  P.ship = { x: q[0], z: q[1], yaw, len, beam: len * 0.2, masts, heel, ok: true };
  const fx = Math.sin(yaw), fz = Math.cos(yaw);
  for (let k = -2; k <= 2; k++) if (!P.keep('ship', q[0] + fx * k * len * 0.2, q[1] + fz * k * len * 0.2, 12, 0, 42, 14)) P.ship.ok = false;
  for (let k = -2; k <= 2; k++) P.claim(q[0] + fx * k * len * 0.22, q[1] + fz * k * len * 0.22, 7);
}

// the swept ice past the court is peopled at its sides: two or three small striped pavilions by river metres (24 to 38 m
// from the river's middle, each kept 8 m and more from the line), people standing round them, and a few more chairs on
// runners going their rounds 8 m and more from the line. All on a stream of its own; nothing here regards the visitor.
function planSwept(P) {
  const r = P.R.swept, pl = P.places, Rv = P.river;
  P.sweptTents = [];
  for (let i = 0; i < 3; i++) {
    const s = lerp(pl.sClear + 6, pl.sT - 40, (i + r.range(0.2, 0.8)) / 3), d = r.sign() * r.range(24, 38), rad = r.range(3.2, 4.2), hh = r.range(7, 8.6), cA = r.int(0, 4), cB = r.int(0, 2), q = Rv.at(s, d);
    if (!P.free(q[0], q[1], rad + 1.5) || !P.keep('pavilion', q[0], q[1], rad + 0.6, 0, hh + 3, 8)) continue;
    const pv = { x: q[0], z: q[1], r: rad, h: hh, cA, cB, floe: null };
    P.pavilions.push(pv); P.sweptTents.push(pv); P.lamp(q[0], hh + 0.3, q[1], 1.3, 0); pv.lamp = P.lanterns[P.lanterns.length - 1]; P.claim(q[0], q[1], rad + 1.5);
  }
}

// ---------------------------------------------------------------- the plan: the great bridge of houses
// Piers 9 m wide with pointed noses, arches of 11 to 14 m, and in the middle the widest arch (19 m) where the ring stands.
function planBridge(P) {
  const r = P.R.bridge, pl = P.places, HW = P.HW;
  const B = P.bridge = { s: pl.sB, half: 7, nose: 6, deckY: r.range(19.5, 21.5), piers: [], arches: [{ d0: -9.5, d1: 9.5, crown: 17.6, spring: 5.5 }], houses: [] };
  for (const side of [-1, 1]) {
    let d = 9.5;
    for (let k = 0; k < 6; k++) {
      const aw = r.range(11, 14), crown = r.range(11.5, 14);
      if (d > HW + 8) continue;
      B.piers.push(side > 0 ? { d0: d, d1: d + 9 } : { d0: -d - 9, d1: -d }); d += 9;
      B.arches.push(side > 0 ? { d0: d, d1: d + aw, crown, spring: 4.5 } : { d0: -d - aw, d1: -d, crown, spring: 4.5 }); d += aw;
    }
  }
  // the houses that stand on it, both edges, and the gate over the wide arch
  for (const row of [-1, 1]) {
    let d = -HW - 14;
    for (let k = 0; k < 60; k++) {
      const w = r.range(5.5, 9), hh = r.range(9, 16), rise = r.range(3, 5.5), jut = r.range(0.4, 1.4), lit = r();
      if (d > HW + 14) continue;
      if (Math.abs(d + w / 2) > 16) B.houses.push({ d: d + w / 2, w, h: hh, rise, jut, row, lit });
      d += w + 0.15;
    }
  }
  B.gate = { towerH: r.range(27, 32), w: 34 };
  // the ring's fit: the line runs through the arch's middle; the arch's nearest stone is its side at 9.5 m
  P.gaps.arch = Math.min(9.5, 17.6 - pl.yPortal);
}

// ---------------------------------------------------------------- the plan: the broken reach (a STANDING STATE)
// Below a fixed broken edge (river metre sT) the river is broken from the first frame to the last, for every visitor:
//   the field   for sixty to a hundred metres the sheet lies parted into floes (a jittered grid of cells, some joined four by
//               four into floes as broad as a green), each built where a fixed age has carried and turned it (the age
//               grows with the river metre and with nothing else), crumbs of brash low in the leads between them
//   the race    below the field, open yellow water: the laden floes held in eddies (each turning slowly on a round of
//               its own), bergs as high as a house standing reared, slabs heaped and reared against every pier's nose, and
//               small floes sailing lanes of their own down to the bridge and through its arches on wrapped rounds of
//               the world clock (each comes up out of the water in the lee of what stands above its lane and goes
//               under again beyond the bridge); red apples ride the race the same way
// Places are chosen by rules of the reach (bands of river metres, offsets beside the line, the bridge's own arches and
// piers). Clearance is proved by geometry over every phase at once: each body's whole sweep against the whole line.
export const reachAge = (sig) => 26 + 0.95 * sig;
function* planReach(P) {
  const r = P.R.floes, rl = P.R.cargo, rb = P.R.bergs, rj = P.R.jams, rs = P.R.sailers, ra = P.R.thawApples;
  const pl = P.places, Rv = P.river, HW = P.HW, T = P.T, B = P.bridge, Lr = pl.sB - pl.sT;
  const floes = P.floes = [], foot = P.reachFoot = [];
  const vF = T.vF = r.range(0.38, 0.46), lane = (d) => vF * (1 - 0.42 * (d / HW) * (d / HW));
  const add = (o) => { const f = reachPiece(o); f.i = floes.length; floes.push(f); return f; };
  const clearOf = (sig, d, R) => { for (const q of foot) if ((q.sig - sig) ** 2 + (q.d - d) ** 2 < (q.R + R + 1.5) ** 2) return false; return true; };
  const claim = (sig, d, R, kind) => foot.push({ sig, d, R, kind });
  const ngon = (cx, cz, R, n, jit, a0) => { const poly = []; for (let k = 0; k < n; k++) { const a = a0 + k / n * TAU, rr = R * jit[k % jit.length]; poly.push([cx + Math.cos(a) * rr, cz + Math.sin(a) * rr]); } return poly; };
  const note = (kind, g) => { P.gaps[kind] = Math.min(P.gaps[kind] ?? Infinity, g); };
  const refuse = (kind) => { P.gaps[kind + ':refused'] = (P.gaps[kind + ':refused'] || 0) + 1; };

  // ---- 1. the field: the sheet parted into floes below its edge. A jittered grid of cells (some joined four by four);
  // each cell is a core with a band of brash round it, and each piece is built where its fixed age has carried it
  const ND = 8, NE = r.int(3, 4), ds = 22, dd = 2 * HW / ND;
  const G = [], MH = [], MV = [];
  for (let i = 0; i <= NE; i++) { const row = []; for (let j = 0; j <= ND; j++) { const js = r.range(-0.27, 0.27) * ds, jd = r.range(-0.27, 0.27) * dd; row.push([pl.sT + i * ds + (i === 0 ? 0 : js), -HW + j * dd + (j === 0 || j === ND ? 0 : jd)]); } G.push(row); }
  for (let i = 0; i <= NE; i++) { const row = []; for (let j = 0; j < ND; j++) { const k = r.range(-2.2, 2.2), a = G[i][j], b = G[i][j + 1]; row.push([(a[0] + b[0]) / 2 + k, (a[1] + b[1]) / 2]); } MH.push(row); }
  for (let i = 0; i < NE; i++) { const row = []; for (let j = 0; j <= ND; j++) { const k = r.range(-2.2, 2.2), a = G[i][j], b = G[i + 1][j]; row.push([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + (j === 0 || j === ND ? 0 : k)]); } MV.push(row); }
  // the fast sheet's broken edge (the upstream side of the first row), as river places
  P.sheetEdgeSD = []; for (let j = 0; j < ND; j++) { P.sheetEdgeSD.push(G[0][j], MH[0][j]); } P.sheetEdgeSD.push(G[0][ND]);
  const own = []; for (let i = 0; i < NE; i++) own.push(new Int16Array(ND).fill(-1));
  const cores = P.cores = []; let cid = 0, far = 0;
  for (let i = 0; i < NE; i++) for (let j = 0; j < ND; j++) {
    if (j === 0) yield;
    const u = r(), inset = r.range(2.2, 3.2), sd = r(), yw = r.range(-1, 1), rk = r.range(0.015, 0.04), fate = r(), lastKeep = r();
    const brashDraw = []; for (let k = 0; k < 16; k++) brashDraw.push([r(), r.range(-1, 1), r.range(0.1, 0.28), r.range(0.9, 1.3), r()]);
    if (own[i][j] >= 0) continue;
    const big = u < 0.16 && i + 1 < NE && j + 1 < ND && own[i][j + 1] < 0 && own[i + 1][j] < 0 && own[i + 1][j + 1] < 0;
    const i1 = big ? i + 1 : i, j1 = big ? j + 1 : j, id = cid++;
    for (let a = i; a <= i1; a++) for (let b = j; b <= j1; b++) own[a][b] = id;
    // the last row is ragged: some of its cells are already gone down the race
    if (i === NE - 1 && lastKeep > 0.6) continue;
    const ring = [];
    for (let b = j; b <= j1; b++) ring.push(G[i][b], MH[i][b]);
    for (let a = i; a <= i1; a++) ring.push(G[a][j1 + 1], MV[a][j1 + 1]);
    for (let b = j1 + 1; b > j; b--) ring.push(G[i1 + 1][b], MH[i1 + 1][b - 1]);
    for (let a = i1 + 1; a > i; a--) ring.push(G[a][j], MV[a - 1][j]);
    let cs = 0, cd = 0; for (const q of ring) { cs += q[0]; cd += q[1]; } cs /= ring.length; cd /= ring.length;
    const inner = ring.map((q) => { const l = Math.hypot(cs - q[0], cd - q[1]) || 1, k = Math.min(inset * 1.15 / l, 0.5); return [q[0] + (cs - q[0]) * k, q[1] + (cd - q[1]) * k]; });
    // the standing state: drift and turn by the cell's fixed age (its river metre alone)
    const age = reachAge(cs - pl.sT), a1 = Math.max(age - 22, 0), D = lane(cd) * a1 * a1 / (a1 + 45), yaw = yw * (big ? 0.05 : 0.11) * smoothstep(22, 150, age);
    const put = (q, c0, c1, th, dr) => { const x = q[0] - c0, y = q[1] - c1, c = Math.cos(th), s = Math.sin(th); return Rv.at(c0 + dr + x * c - y * s, c1 + x * s + y * c); };
    const cw = Rv.at(cs + D, cd), poly = inner.map((q) => put(q, cs, cd, yaw, D));
    let Rad = 0; for (const p of poly) Rad = Math.max(Rad, Math.hypot(p[0] - cw[0], p[1] - cw[1]));
    const sig = cs + D - pl.sT; far = Math.max(far, sig + Rad);
    const founder = fate < 0.3 && !big && i >= 1;
    const core = add({ kind: 'core', big, use: founder ? 'founder' : null, cx: cw[0], cz: cw[1], poly, R: Rad, seed: sd, rock: founder ? 0.12 : big ? rk * 0.4 : rk, bob: 0.07, swing: yw * 0.03, dip: founder ? 1.1 : 0, sig, d: cd });
    cores.push(core); claim(sig, cd, Rad, 'core');
    note('floe', P.gap(cw[0], cw[1], Rad, -1, 0.4 + core.rock * Rad));
    for (let k = 0; k < ring.length; k++) {
      const k2 = (k + 1) % ring.length, bd = brashDraw[k % 16], q4 = [ring[k], ring[k2], inner[k2], inner[k]];
      let bs = 0, bdd = 0; for (const q of q4) { bs += q[0] / 4; bdd += q[1] / 4; }
      // the crumbs that foundered are gone; the rest lie low in the leads, a little further down than their floe
      if (bd[4] < 0.55) continue;
      const Db = D * (0.9 + 0.5 * bd[0]), w = Rv.at(bs + Db, bdd), yb = bd[1] * 2.2 * smoothstep(22, 150, age);
      add({ kind: 'brash', cx: w[0], cz: w[1], poly: q4.map((q) => put(q, bs, bdd, yb, Db)), R: 4, thick: 0.9, low: 0.3, seed: bd[0], rock: bd[2], bob: 0.05, swing: 0.15 * bd[1], eddy: 0.3, sig: bs + Db - pl.sT, d: bdd });
    }
  }
  yield;

  // ---- 2. the laden floes, in the race below the field: what the carnival left on the ice, each on a floe of its
  // own that an eddy holds and turns.
  // kind, the floe's radius, the height of what stands on it, nearest and furthest from the line, turn (rad/s), eddy (m)
  const ITEMS = [['table', 9.6, 2.6, 5, 12, 0.058, 2.0], ['bonfire', 7.4, 0, 9, 20, 0.02, 1.5], ['bed', 7, 4.2, 4, 11, 0.03, 1.8], ['booth', 6.4, 5, 4, 14, 0.035, 1.8],
    ['booth', 6.4, 5, 5, 16, 0.03, 1.8], ['booth', 6.4, 5, 4, 14, 0.04, 1.8], ['cat', 6, 1.9, 3, 8, 0.045, 1.6], ['pavilion', 7.8, 12, 10, 24, 0.025, 1.5], ['booth', 6.4, 5, 6, 22, 0.035, 1.8]];
  const NI = ITEMS.length, slots = rl.shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8]), firstSide = rl.sign();
  P.cargo = [];
  for (let n = 0; n < NI; n++) {
    const [kind, R, top, lo, hi, turnK, eddy] = ITEMS[n], slot = slots[n];
    yield;
    const u = rl(), yawS = rl.sign(), itemYaw = rl.range(0, TAU), v1 = rl(), v2 = rl(), fH = rl.range(7.5, 9), fSeq = rl.shuffle([0, 1, 2]), fPer = rl.range(8, 13), fPh = rl();
    const offU = [rl(), rl(), rl(), rl(), rl(), rl()], seed = rl(), a0 = rl.range(0, TAU), jit = []; for (let k = 0; k < 11; k++) jit.push(rl.range(0.84, 1));
    const Rs = R + 1.6 * eddy, side = (slot % 2 ? 1 : -1) * firstSide;
    let done = false;
    for (let t = 0; t < 6 && !done; t++) {
      const sig0 = lerp(far + 12, Lr - 78, (slot + u) / NI) + (t % 2 ? -1 : 1) * Math.ceil(t / 2) * 9, m = Math.min(P.mOfS(pl.sT + sig0), P.L - 4);
      const q = P.beside(m, side * (Rs + lerp(lo, hi, offU[t]))), loc = Rv.locate(q[0], q[1]), sig = loc.s - pl.sT;
      if (Math.abs(loc.d) > HW - Rs - 3 || sig < far - 2 || sig > Lr - 60 || !clearOf(sig, loc.d, Rs)) continue;
      // a fire's body reaches to the top of its smoke; anything else to its own height (rocking at its fullest)
      const g = kind === 'bonfire' ? Math.min(P.gap(q[0], q[1], 4.6 + 1.6 * eddy, 0, 72), P.gap(q[0], q[1], Rs, -1, 1.2)) : P.gap(q[0], q[1], Rs, -1, top + 0.6);
      if (g < 2.8) continue;
      const f = add({ kind: 'laden', use: kind, cx: q[0], cz: q[1], poly: ngon(q[0], q[1], R, 11, jit, a0), R, seed, rock: kind === 'bonfire' ? 0.07 : 0.018, bob: 0.07, turn: yawS * turnK, eddy, top, sig, d: loc.d });
      claim(sig, loc.d, Rs, 'laden'); note('laden', g);
      const item = { kind, f, x: q[0], z: q[1], yaw: itemYaw, v1, v2, n };
      if (kind === 'bonfire') { item.fire = { x: q[0], z: q[1], s: loc.s, R: 2.4, H: fH, seq: fSeq, per: fPer, ph: fPh, floe: f, i: P.fires.length }; P.fires.push(item.fire); }
      P.cargo.push(item); done = true;
    }
    if (!done) refuse('laden');
  }

  // ---- 3. slabs heaped and reared against the piers' noses (the downstream edge of each rides up the stone)
  const noseSig = Lr - B.half - B.nose;
  P.slabs = [];
  for (const p of B.piers) {
    const dm = (p.d0 + p.d1) / 2; let sigC = 0;
    yield;
    for (let j = 0; j < 4; j++) {
      const R = rj.range(3.8, 4.6) * (j === 0 ? 1.13 : 1), rear = rj.range(0.75, 0.95) - j * 0.17, jd = rj.range(-0.8, 0.8), seed = rj(), a0 = rj.range(0, TAU), thick = rj.range(1.5, 2.1), back = rj.range(4, 5.5);
      const jit = []; for (let k = 0; k < 7; k++) jit.push(rj.range(0.78, 1));
      sigC = j === 0 ? noseSig - R * Math.cos(rear) + 0.6 : sigC - back;
      if (Math.abs(dm) > HW - 7) continue;
      const q = Rv.at(pl.sT + sigC, dm + jd), top = R * Math.sin(rear) + thick + 0.4, g = P.gap(q[0], q[1], R + 0.4, -1, top);
      if (g < 2.8) { refuse('slab'); continue; }
      P.slabs.push(add({ kind: 'slab', cx: q[0], cz: q[1], poly: ngon(q[0], q[1], R, 7, jit, a0), R, thick, seed, rock: 0.006, bob: 0.03, eddy: 0.12, rear, pivot: 0.9, top, sig: sigC, d: dm + jd }));
      claim(sigC, dm + jd, R + 0.5, 'slab'); note('slab', g);
    }
  }

  // ---- 4. bergs as high as a house: single floes standing reared on end, beside the line and away from it
  const nB = rb.int(9, 13); P.bergs = [];
  for (let t = 0; t < 120; t++) {
    const sig0 = lerp(far + 6, Lr - 84, rb()), side = rb.sign(), R = rb.range(7.5, 10.5), offK = rb.range(6, 54), rear = rb.range(0.55, 0.95) * rb.sign(), seed = rb(), a0 = rb.range(0, TAU);
    const jit = []; for (let k = 0; k < 8; k++) jit.push(rb.range(0.8, 1));
    if (t % 10 === 9) yield;
    if (P.bergs.length >= nB) continue;
    const Rb = Math.hypot(R, 3.4) + 0.6, m = Math.min(P.mOfS(pl.sT + sig0), P.L - 4), q = P.beside(m, side * (Rb + offK)), loc = Rv.locate(q[0], q[1]), sig = loc.s - pl.sT;
    if (Math.abs(loc.d) > HW - R - 2 || sig < far - 4 || sig > Lr - 78 || !clearOf(sig, loc.d, R + 1)) continue;
    const g = P.gap(q[0], q[1], Rb, -1, Rb);
    if (g < 2.8) { refuse('berg'); continue; }
    P.bergs.push(add({ kind: 'berg', use: 'berg', cx: q[0], cz: q[1], poly: ngon(q[0], q[1], R, 8, jit, a0), R, thick: 6, seed, rock: 0.008, bob: 0.05, swing: 0.02, rear, pivot: 2.6, top: Rb, sig, d: loc.d, moundK: 1 }));
    claim(sig, loc.d, R + 1, 'berg'); note('berg', g);
  }
  yield;
  // ---- 5. the small floes that sail: lanes of their own through the bridge's arches, each a wrapped round of the clock
  const v0 = T.v0 = rs.range(4.2, 5.6), speedAt = (d) => v0 * (1 - 0.42 * (d / HW) * (d / HW)), endSig = Lr + 84;
  const lanes = P.lanes = []; let nSail = 0;
  for (let t = 0; t < 140; t++) {
    const d = rs.range(-HW + 6, HW - 6), rad = rs.range(1.3, 3.3), gapK = rs.range(16, 34), ph0 = rs(), tallU = rs(), mk = rs.range(0.4, 0.62);
    const dress = []; for (let k = 0; k < 9; k++) dress.push([rs(), rs.range(0, TAU), rs.range(0.03, 0.06), rs.range(0.76, 1), rs.range(0.76, 1), rs.range(0.76, 1)]);
    if (t % 12 === 11) yield;
    const arch = B.arches.find((a) => a.d0 + 1.3 <= d - rad && d + rad <= a.d1 - 1.3);
    if (!arch || nSail >= 80 || lanes.some((l) => Math.abs(l.d - d) < rad + l.rad + 0.8)) continue;
    // a lane begins in the lee of whatever stands across it (the field's last floe, a berg, a laden floe)
    let sig0 = 30; for (const q of foot) if (Math.abs(q.d - d) < q.R + rad + 1.2) sig0 = Math.max(sig0, q.sig + q.R + rad + (q.kind === 'core' ? 9 : 2));
    const len = endSig - sig0; if (sig0 > Lr - 64) continue;
    // a small berg only where the arch it sails under stands well over it
    const hs = (arch.d1 - arch.d0) / 2, ta = (Math.abs(d - (arch.d0 + arch.d1) / 2) + rad) / hs, yA = arch.spring + (arch.crown - arch.spring) * Math.sqrt(Math.max(1 - Math.pow(ta, 2.2), 0));
    const topB = 3.8 * mk, tall = tallU < 0.3 && yA >= topB + 1.6, top = tall ? topB : 0.3;
    const a = Rv.at(pl.sT + sig0, d), b = Rv.at(pl.sT + endSig, d), g = P.gapSeg(a[0], a[1], b[0], b[1], rad + 0.3, -1, top + 0.4);
    if (g < 2.8) { refuse('sailer'); continue; }
    note('sailer', g);
    const K = clamp(Math.round(len / (2 * rad + gapK)), 1, 9), v = speedAt(d);
    lanes.push({ d, rad, sig0, len, v, K, tall, top });
    for (let k = 0; k < K; k++) {
      const dr = dress[k];
      add({ kind: 'sailer', use: tall ? 'berg' : null, cx: a[0], cz: a[1], poly: ngon(a[0], a[1], rad, 6, dr.slice(3), dr[1]), R: rad, thick: tall ? 2.2 : 0.7 + 0.25 * rad, seed: dr[0], rock: dr[2], bob: 0.07, swing: 0.3,
        sail: v, len, ph: ((k + ph0) / K) % 1, dip: top + 1.2, top, moundK: mk, sig: sig0, d });
      nSail++;
    }
  }
  yield;

  // ---- 6. drift ice between: small floes, some no bigger than a hat, held in little eddies of their own (never in
  // a sailing lane, never under what stands)
  const rd = P.R.drift;
  for (let t = 0; t < 150; t++) {
    const sig = lerp(far - 6, Lr - 20, rd()), d = rd.range(-HW + 4, HW - 4), R = rd.range(0.5, 3.4), eddy = rd.range(0.3, 1.1), seed = rd(), a0 = rd.range(0, TAU), rock = rd.range(0.03, 0.08), fate = rd(), thick = rd.range(0.5, 1.1);
    const jit = []; for (let k = 0; k < 6; k++) jit.push(rd.range(0.7, 1));
    if (t % 30 === 29) yield;
    const Re = R + 1.6 * eddy;
    if (!clearOf(sig, d, Re) || lanes.some((l) => sig > l.sig0 - l.rad - Re - 2 && Math.abs(l.d - d) < l.rad + Re + 0.8)) continue;
    const q = Rv.at(pl.sT + sig, d);
    add({ kind: 'bit', use: fate < 0.25 ? 'founder' : null, cx: q[0], cz: q[1], poly: ngon(q[0], q[1], R, 6, jit, a0), R, thick, seed, rock, bob: 0.07, swing: 0.4, eddy, dip: fate < 0.25 ? 0.7 : 0, sig, d });
    claim(sig, d, Re, 'bit'); note('bit', P.gap(q[0], q[1], Re, -1, 0.5));
  }
  yield;

  // ---- 7. red apples afloat in the race, riding it on wrapped rounds (under a floe they are hidden by it)
  P.thawApples = [];
  for (let i = 0; i < 260; i++) {
    if (i % 60 === 59) yield;
    const d = clamp(ra.gauss() * 15, -HW + 4, HW - 4), sig0 = ra.range(4, Lr - 70), sd = ra(), ph = ra(), sz = ra.range(0.13, 0.19), q = Rv.at(pl.sT + sig0, d);
    P.thawApples.push(reachPiece({ kind: 'apple', cx: q[0], cz: q[1], seed: sd, bob: 0.05, sail: speedAt(d), len: Lr + 60 - sig0, ph, dip: 1, sz }));
  }
}
// a small stream of one house's own, by the stream's name and the house's name among all the places tried
export const houseStream = (P, name, id) => makeRng(hashSeed('frozen-river:' + name + ':' + P.seed + ':' + id));
// the world's one wind, which bends every column of smoke: it blows across the race and a little down it (60 degrees
// off the way the race runs), the same for the whole visit. The smoke's shader turns the race's direction the same way.
export const smokeWind = (fl) => { const x = fl[0] * 0.5 - fl[1] * 0.87, z = fl[1] * 0.5 + fl[0] * 0.87, l = Math.hypot(x, z) || 1; return [x / l, z / l]; };
// ---------------------------------------------------------------- the plan: the white city on both banks
// Rows of houses stand back from the embankments (more rows under the opening), a spire in the town, a hall across
// the river, and smoke from the chimneys (no column within 10 m of the line). Roofs and smoke are tested against the line like the rest.
function* planCity(P) {
  const r = P.R.houses, rs = P.R.spire, pl = P.places, Rv = P.river, HW = P.HW, h = P.hand;
  const C = P.city = { houses: [], smoke: [], veils: [], EMB: 3.2 }, wind = smokeWind(P.T.flow);
  // the spire stands by the TOWN's rule: at a river metre anywhere along the near bank and 14 to 120 m inland of the
  // embankment. It is built when it keeps 8 m from the line and from the level entry axis; against the route it falls
  // where it falls.
  const sm = rs.range(-220, pl.sB + 120), so = rs.range(14, 120), sq = Rv.at(sm, -h * (HW + so)), sh = rs.range(46, 52), hallS = rs.range(pl.sE + 120, pl.sRope - 40), hallO = rs.range(26, 34), hallH = rs.range(30, 36);
  C.spire = { x: sq[0], z: sq[1], yaw: Rv.yawAt(sm), w: 9, towerH: sh * 0.52, h: sh, ok: P.keep('spire', sq[0], sq[1], 6.6, 0, sh + 1, 8) };
  const hq = Rv.at(hallS, h * (HW + hallO));
  C.hall = { x: hq[0], z: hq[1], yaw: Rv.yawAt(hallS) + (h > 0 ? -Math.PI / 2 : Math.PI / 2), w: 26, d: 13, wall: hallH * 0.55, h: hallH };
  const taken = [[C.spire.x, C.spire.z, 9], [C.hall.x, C.hall.z, 17]];
  // the town's towers: nine to fourteen spires, towers and gate turrets of different heights, dealt over both banks
  // by a stream of the town's own, by the town's ground (so more of them stand where the town is deep). Each is kept
  // when it clears the line and the level entry axis by 8 m; against the route they fall where they fall. A house
  // gives way to a tower.
  const rtt = P.R.townTowers, nT = rtt.int(9, 14), wide0 = pl.sStart - 140, wide1 = pl.sE + 120, aDeep = (wide1 - wide0) * 140, aRim = (pl.sB + 390) * 100;
  C.townTowers = [];
  for (let k = 0; k < 14; k++) {
    const u = rtt(), a = rtt(), bb = rtt(), side0 = rtt.sign(), hh = rtt.range(18, 46), w = rtt.range(5, 8), kind = rtt.int(0, 2), ys = rtt.range(-0.3, 0.3), lit = rtt(), cock = rtt.range(0, TAU);
    if (k >= nT) continue;
    const deep = u < aDeep / (aDeep + aRim), s = deep ? wide0 + (wide1 - wide0) * a : -240 + (pl.sB + 390) * a, side = deep ? -h : side0, inl = deep ? 62 + bb * 140 : 12 + bb * 50;
    const q = Rv.at(s, side * (HW + inl)), top = C.EMB + hh + 2.4;
    let free = !(Math.abs(s - pl.sB) < 24 && inl < 40);
    for (const t of taken) if (Math.hypot(t[0] - q[0], t[1] - q[1]) < t[2] + w + 3) free = false;
    if (!free || P.gapBack(q[0], q[1], w * 0.9, 0, top) < 8 || !P.keep('townTower', q[0], q[1], w * 0.9, 0, top, 8)) continue;
    C.townTowers.push({ x: q[0], z: q[1], yaw: Rv.yawAt(s) + ys, w, h: hh, kind, lit, cock });
    taken.push([q[0], q[1], w * 0.9 + 1]);
  }
  const rows = [[7, 0], [27, 0], [48, 0], [70, 1], [93, 1], [117, 1], [142, 1], [168, 1], [196, 1]];
  for (const side of [-1, 1]) for (const [o, wide] of rows) {
    if (wide && side !== -h) continue;
    let s = wide ? pl.sStart - 150 : -260; const s1 = wide ? pl.sE + 130 : pl.sB + 170;
    for (let k = 0; k < 400 && s < s1; k++) {
      if (k % 30 === 29) yield;
      const w = r.range(6, 10.5), dp = r.range(7.5, 11), wall = r.range(7, 14), rise = r.range(3.2, 6), gapWide = r.range(4, 8), gapClose = r.range(0.1, 0.9), gap = r() < 0.09 ? gapWide : gapClose, alongX = r() < 0.62, jo = r.range(-1.6, 1.6), c = r.int(0, 5), lit = r(), nch = r.int(1, 2), cx1 = r.range(-0.3, 0.3), cx2 = r.range(-0.3, 0.3), ys = r.range(-0.06, 0.06);
      const sc = s + w / 2; s += w + gap;
      // the house's own name among ALL the places tried (bank, row, number along the row): its smoke and its dress
      // are dealt from streams of its own by that name, so a house that is refused or kept moves no other's draws
      const id = (side > 0 ? 'r' : 'l') + o + ':' + k, rk = houseStream(P, 'smoke', id);
      const inl = HW + o + jo + dp / 2, q = Rv.at(sc, side * inl);
      if (Math.abs(sc - pl.sB) < 17 && o < 30) continue;
      let ok = true; for (const t of taken) if (Math.hypot(t[0] - q[0], t[1] - q[1]) < t[2] + w * 0.6) ok = false;
      if (!ok) continue;
      const top = C.EMB + wall + rise + 1.9;
      if (P.gap(q[0], q[1], Math.max(w, dp) * 0.62, 0, top) < 6) { P.gaps['roof:refused'] = (P.gaps['roof:refused'] || 0) + 1; continue; }
      const near = P.gap(q[0], q[1], 0, top, top);
      P.gaps.roof = Math.min(P.gaps.roof ?? Infinity, near);
      const yaw = Rv.yawAt(sc) + (side > 0 ? -Math.PI / 2 : Math.PI / 2) + ys, hs = { id, x: q[0], z: q[1], yaw, w, dp, wall, rise, alongX, c, lit, near, chim: [] };
      const cy = Math.cos(yaw), sy = Math.sin(yaw);
      for (let i = 0; i < nch; i++) {
        const lx = (i ? cx2 : cx1) * (alongX ? w : 2), lz = (i ? cx2 : cx1) * (alongX ? 2 : dp), ch = C.EMB + wall + rise + 1.5;
        const wx = q[0] + lx * cy + lz * sy, wz = q[1] - lx * sy + lz * cy;
        hs.chim.push([lx, lz, ch]);
        // every hearth burns in the great frost: nine chimneys in ten smoke, each by its house's own draw
        const colH = rk.range(26, 48), colW = rk.range(0.8, 1.5), ph = rk(), on = rk() < 0.9;
        // the column as it stands bent by the wind (the shader's own law: half its drawn height, its width and its
        // drift at seven heights, its slow bend and its small flutter at their fullest): no part of it within 6 m of
        // the line, nor within 9.5 m of the level entry axis
        let g = on ? Infinity : -1;
        for (let k = 0; k <= 6 && g >= 6; k++) {
          const t = k / 6, hg = colH * 0.5, dr = hg * 0.55 * t * t, rad = 0.4 * colW * (1 + 3.4 * t) + 1.18 * colW * t, x = wx + wind[0] * dr, z = wz + wind[1] * dr, y0 = ch + (t - 1 / 12) * hg, y1 = ch + (t + 1 / 12) * hg;
          g = Math.min(g, P.gap(x, z, rad, y0, y1)); if (P.gapBack(x, z, rad, y0, y1) < 9.5) g = -1;
        }
        if (g >= 6) { C.smoke.push({ x: wx, y: ch, z: wz, h: colH, w: colW, ph }); P.gaps.smoke = Math.min(P.gaps.smoke ?? Infinity, g); }
      }
      // powder snow smokes off this roof in the one light wind: one to three thin veils from its ridge (more where
      // the ridge lies across the wind), now and then one from its lee eave, dealt by the house's own stream. Each is
      // tested whole as it streams (a round about its middle that holds its length, width, sway and lift): none
      // within 6 m of the line nor within 9.5 m of the level entry axis
      const rv = houseStream(P, 'veil', id), rdx = alongX ? cy : sy, rdz = alongX ? -sy : cy, acr = 1 - Math.abs(rdx * wind[0] + rdz * wind[1]);
      const nv = 1 + (rv() < acr ? 1 : 0) + (rv() < acr * 0.6 ? 1 : 0), lee = (-rdz * wind[0] + rdx * wind[1]) > 0 ? 1 : -1;
      for (let i = 0; i < 3; i++) {
        const t = rv.range(-0.42, 0.42), len = rv.range(2, 6), vw = rv.range(1.4, 3.2), lift = rv.range(0.6, 1.3), ph = rv(), eave = rv() < 0.25;
        if (i >= nv) continue;
        const rl = alongX ? w : dp, ol = alongX ? dp : w, e = eave ? lee * ol * 0.5 : 0;
        const vx = q[0] + rdx * t * rl - rdz * e, vz = q[1] + rdz * t * rl + rdx * e, vy = C.EMB + wall + (eave ? 0 : rise) + 0.05;
        const mx = vx + wind[0] * len * 0.5, mz = vz + wind[1] * len * 0.5, rad = len * 0.5 + vw * 0.7 + 0.3;
        if (P.gap(mx, mz, rad, vy - 0.6, vy + 1.6) < 6 || P.gapBack(mx, mz, rad, vy - 0.6, vy + 1.6) < 9.5) continue;
        C.veils.push({ x: vx, y: vy, z: vz, len, w: vw, lift, ph, lit });
      }
      C.houses.push(hs);
    }
  }
  // a few towers of the far town on the sky, each clear of the line and of the entry axis behind it by 10 m and more
  const rt = P.R.towers; C.towers = [];
  for (let k = 0; k < 16; k++) {
    const s = rt.range(-250, pl.sB + 560), side = rt.sign(), inl = rt.range(120, 380), hh = rt.range(30, 58), w = rt.range(6, 9), q = Rv.at(s, side * (HW + inl));
    const g = P.gap(q[0], q[1], w * 0.75, 0, C.EMB + hh);
    if (g < 10) { P.gaps['tower:refused'] = (P.gaps['tower:refused'] || 0) + 1; continue; }
    P.gaps.tower = Math.min(P.gaps.tower ?? Infinity, g); C.towers.push({ x: q[0], z: q[1], h: hh, w });
  }
}

// ---------------------------------------------------------------- the plan: the people (small, in wide skirts, cloaks and plumed hats)
// kind 0 stands (warming hands, at a booth), 1 skates a long curve, 2 dances in a couple round the ring, 3 pushes a chair on runners
function* planFigures(P) {
  const rs = P.R.skaters, rt = P.R.standers, rl = P.R.sledges, rd = P.R.dancers, M = P.M, HW = P.HW, Rv = P.river;
  const F = P.figures = [];
  const fig = (o) => F.push({ kind: 0, cx: 0, cz: 0, rad: 0, ph: 0, w: 0, ell: 1, ori: 0, scale: 1, col: 0, ...o });
  const curve = function* (stream, kind, n, rMin, rMax, vMin, vMax, kindName) {
    for (let i = 0; i < n; i++) {
      if (i % 40 === 39) yield;
      const m = stream.range(M.alley0 - 50, M.sT - 16), off = stream.sign() * stream.range(5, 58), rad = stream.range(rMin, rMax), v = stream.range(vMin, vMax) * stream.sign(), ph = stream.range(0, TAU);
      const ell = stream.range(0.55, 1), ori = stream.range(0, TAU), scale = stream.range(0.92, 1.1), col = stream.int(0, 7);
      const q = P.beside(m, off), loc = Rv.locate(q[0], q[1]);
      if (Math.abs(loc.d) > HW - rad - 5 || !P.free(q[0], q[1], rad + 1) || P.gap(q[0], q[1], rad + 0.9, 0, 2.2) < 2.8) { P.gaps[kindName + ':refused'] = (P.gaps[kindName + ':refused'] || 0) + 1; continue; }
      P.gaps[kindName] = Math.min(P.gaps[kindName] ?? Infinity, P.gap(q[0], q[1], rad + 0.9, 0, 2.2));
      fig({ kind, cx: q[0], cz: q[1], rad, ph, w: v / rad, ell, ori, scale, col });
    }
  };
  // a skater's WHOLE closed curve against the line: points no more than half a metre apart all the way round (the line
  // within the loop's reach of its own route metre), and 0.2 m asked on top of the 2.8, which is the most the line's own
  // 2 m steps can hide at that distance. -1 when the curve crosses a thing that stands.
  const loopGap = (q, m, ori, rad, ell) => {
    const nk = Math.max(24, Math.ceil(TAU * rad / 0.5)), i0 = Math.max(0, Math.floor((m - rad - 40) / 2)), i1 = Math.min(P.n - 1, Math.ceil((m + rad + 40) / 2));
    const at = (th) => { const ex = Math.cos(th) * rad, ez = Math.sin(th) * rad * ell; return [q[0] + Math.cos(ori) * ex - Math.sin(ori) * ez, q[1] + Math.sin(ori) * ex + Math.cos(ori) * ez]; };
    for (let k = 0; k < 20; k++) { const c = at(k / 20 * TAU); if (!P.free(c[0], c[1], 0.9)) return -1; }
    let g = Infinity;
    for (let k = 0; k < nk; k++) { const c = at(k / nk * TAU); g = Math.min(g, P.gap(c[0], c[1], 0.9, 0, 2.2, i0, i1)); }
    return g;
  };
  yield* curve(rs, 1, Math.round(300 * P.density), 4, 17, 5, 9.5, 'skater');
  yield* curve(rl, 3, 7, 12, 22, 2.2, 3.6, 'sledge');
  yield;
  // down the alley itself: long thin loops beside the line, with it and against it (the skaters the visitor passes closest)
  const ra2 = P.R.alleySkaters, nA = Math.round(64 * P.density);
  for (let i = 0; i < 90; i++) {
    const m = ra2.range(M.alley0 + 10, M.sRope - 26), side = ra2.sign(), off = ra2.range(5.0, 7.0), rad = ra2.range(11, 22), minor = ra2.range(1.2, 2.0), v = ra2.range(5.5, 9.5) * ra2.sign(), ph = ra2.range(0, TAU), scale = ra2.range(0.92, 1.1), col = ra2.int(0, 7);
    if (i % 10 === 9) yield;
    if (i >= nA) continue;
    const q = P.beside(m, side * off), f = q[2], ori = Math.atan2(f.tz, f.tx), ell = minor / rad;
    const g = loopGap(q, m, ori, rad, ell), ok = g >= 3;
    if (!ok) { P.gaps['skater:refused'] = (P.gaps['skater:refused'] || 0) + 1; continue; }
    P.gaps.skater = Math.min(P.gaps.skater ?? Infinity, g);
    fig({ kind: 1, cx: q[0], cz: q[1], rad, ph, w: v / rad, ell, ori, scale, col });
  }
  yield;
  // out over the swept clear ice: pairs skating side by side in long ovals beside the line (two on one curve, a stride apart)
  const rp = P.R.pairs, nP = Math.min(20, Math.round(19 * P.density));
  for (let i = 0; i < 20; i++) {
    const m = rp.range(M.sRope + 30, M.sT - 34), side = rp.sign(), off = rp.range(5.5, 9), rad = rp.range(15, 27), minor = rp.range(1.6, 3.2), v = rp.range(6, 9.5) * rp.sign(), ph = rp.range(0, TAU), scale = rp.range(0.95, 1.1), colA = rp.int(0, 7), colB = rp.int(0, 7);
    if (i % 5 === 4) yield;
    if (i >= nP) continue;
    const q = P.beside(m, side * off), f = q[2], ori = Math.atan2(f.tz, f.tx), ell = minor / rad;
    const g = Math.min(loopGap(q, m, ori, rad, ell), loopGap(q, m, ori, rad + 0.95, ell)), ok = g >= 3;
    if (!ok) { P.gaps['skater:refused'] = (P.gaps['skater:refused'] || 0) + 1; continue; }
    P.gaps.skater = Math.min(P.gaps.skater ?? Infinity, g);
    fig({ kind: 1, cx: q[0], cz: q[1], rad, ph, w: v / rad, ell, ori, scale, col: colA });
    fig({ kind: 1, cx: q[0], cz: q[1], rad: rad + 0.95, ph, w: v / rad, ell, ori, scale: scale * 0.94, col: colB });
  }
  yield;
  // round every fire that stands on the fast ice: a ring of people warming their hands
  for (const f of P.fires) {
    for (let i = 0; i < 16; i++) {
      const a = rt.range(0, TAU), rad = f.R + rt.range(3.4, 5.6), scale = rt.range(0.9, 1.1), col = rt.int(0, 7), on = rt() < 0.8 * P.density, sway = rt.range(0.5, 1.2);
      const x = f.x + Math.cos(a) * rad, z = f.z + Math.sin(a) * rad;
      if (f.floe || !on || !P.keep('stander', x, z, 0.7, 0, 2.2, 3)) continue;
      fig({ kind: 0, cx: x, cz: z, ph: Math.atan2(f.x - x, f.z - z), scale, col, w: sway });
    }
  }
  for (const b of P.booths) {
    for (let i = 0; i < 3; i++) {
      const lx = rt.range(-1.2, 1.2), lz = b.d / 2 + rt.range(0.9, 1.8), scale = rt.range(0.9, 1.1), col = rt.int(0, 7), on = rt() < 0.6 * P.density, sway = rt.range(0.5, 1.2);
      const x = b.x + lx * Math.cos(b.yaw) + lz * Math.sin(b.yaw), z = b.z - lx * Math.sin(b.yaw) + lz * Math.cos(b.yaw);
      if (!on || !P.keep('stander', x, z, 0.7, 0, 2.2, 3)) continue;
      fig({ kind: 0, cx: x, cz: z, ph: b.yaw + Math.PI, scale, col, w: sway });
    }
  }
  // round each pavilion at the swept ice's sides: people standing; and chairs on runners going their rounds near them
  const rw = P.R.swept;
  for (const pv of P.sweptTents) for (let i = 0; i < 9; i++) {
    const a = rw.range(0, TAU), rad = pv.r + rw.range(1.4, 3.6), scale = rw.range(0.9, 1.1), col = rw.int(0, 7), on = rw() < 0.85, sway = rw.range(0.5, 1.2);
    const x = pv.x + Math.cos(a) * rad, z = pv.z + Math.sin(a) * rad;
    if (!on || !P.keep('stander', x, z, 0.7, 0, 2.2, 3)) continue;
    fig({ kind: 0, cx: x, cz: z, ph: Math.atan2(pv.x - x, pv.z - z), scale, col, w: sway });
  }
  for (let i = 0; i < 5; i++) {
    const m = rw.range(M.sClear, M.sT - 40), off = rw.sign() * rw.range(17, 32), rad = rw.range(5, 8.5), v = rw.range(2.2, 3.6) * rw.sign(), ph = rw.range(0, TAU), ell = rw.range(0.6, 1), ori = rw.range(0, TAU), scale = rw.range(0.92, 1.1), col = rw.int(0, 7);
    const q = P.beside(m, off), loc = Rv.locate(q[0], q[1]);
    if (Math.abs(loc.d) > HW - rad - 5 || !P.free(q[0], q[1], rad + 1) || P.gap(q[0], q[1], rad + 0.9, 0, 2.2) < 8) { P.gaps['sledge:refused'] = (P.gaps['sledge:refused'] || 0) + 1; continue; }
    P.gaps.sledge = Math.min(P.gaps.sledge ?? Infinity, P.gap(q[0], q[1], rad + 0.9, 0, 2.2));
    fig({ kind: 3, cx: q[0], cz: q[1], rad, ph, w: v / rad, ell, ori, scale, col });
  }
  // each of those pavilions' lamps carries its glow's phase from this same stream (its last three draws), so that no
  // other lantern's draw of the glows' stream is moved by them
  for (let i = 0; i < 3; i++) { const ph = rw(); if (P.sweptTents[i]) P.sweptTents[i].lamp.ph = ph; }
  // the dancers: couples turning, the whole ring going slowly round
  const ring = P.court.ring, om = rd.range(0.1, 0.16) * rd.sign();
  for (let i = 0; i < 16; i++) {
    const colA = rd.int(0, 7), colB = rd.int(0, 7), sp = rd.range(1.3, 1.9), ph = rd.range(0, TAU), sc = rd.range(0.95, 1.08);
    if (i >= ring.couples || !ring.ok) continue;
    const th = i / ring.couples * TAU;
    fig({ kind: 2, cx: ring.x, cz: ring.z, rad: ring.R, ph: th, w: om, ell: sp, ori: ph, scale: sc, col: colA });
    fig({ kind: 2, cx: ring.x, cz: ring.z, rad: ring.R, ph: th, w: om, ell: sp, ori: ph + Math.PI, scale: sc * 0.96, col: colB });
  }
}

// ---------------------------------------------------------------- the plan: gulls coming up the river over the broken reach
// Each flies a straight lane of its own high over the water on a wrapped round of the world clock (it grows out of
// nothing at the bridge and is gone again above the broken edge); every lane is proved clear of the whole line.
function planGulls(P) {
  const r = P.R.gulls, Rv = P.river, pl = P.places, sA = Math.max(Rv.sEnd, pl.sT - 80), len = pl.sB - 12 - sA;
  const G = P.gulls = { sA, len, list: [] };
  for (let i = 0; i < 44; i++) {
    const d = r.sign() * r.range(9, 62), y = r.range(13.5, 30), ph = r(), v = r.range(8, 12), flapPh = r.range(0, TAU), size = r.range(1.1, 1.5), amp = r.range(0.2, 0.8), flap = r.range(4.5, 6.5);
    const a = Rv.at(sA, d), b = Rv.at(sA + len, d), g = P.gapSeg(a[0], a[1], b[0], b[1], size + 0.2, y - amp - 1, y + amp + 1);
    if (g < 2.8) { P.gaps['gull:refused'] = (P.gaps['gull:refused'] || 0) + 1; continue; }
    P.gaps.gull = Math.min(P.gaps.gull ?? Infinity, g); G.list.push({ d, y, ph, v, flapPh, size, amp, flap });
  }
}

// ---------------------------------------------------------------- the plan: the film (camera, pulls) and the join of the two lights
function planFilm(P) {
  const M = P.M, L = P.L, pg = P.court.pagoda, wk = P.ice.wreck;
  P.cam = { fov: 62, near: 0.3, far: 5200, lookAhead: 26, sway: 0.5, bank: 0.5 };
  // two pulls, one at a time, each rising from nothing well past the first metres, each between two places: the pagoda
  // from the alley's last arcade bay to the far side of the dancers' ring; the sunk boat from where the clear ice begins
  // to where the boat lies abeam
  P.pois = [];
  const ring = P.court.ring, pagFrom = M.sRope - 16, pagEnd = P.mOfS(P.places.sRope + 24 + ring.R);
  if (pg.ok) P.pois.push({ at: new THREE.Vector3(pg.x, pg.h * 0.5, pg.z), from: pagFrom / L, to: pagEnd / L, weight: 0.24, fade: 0.42 });
  P.pois.push({ at: new THREE.Vector3(wk.x, -wk.depth * 0.72, wk.z), from: Math.max(M.sClear, pagEnd + 4) / L, to: M.sWreck / L, weight: 0.48, fade: 0.45 });
  // the pace's ends, now that the bays and the ship are planned
  const bm = P.bays.map((q) => q.m);
  if (bm.length) { P.paceEnds.bay0 = Math.min(...bm); P.paceEnds.bay1 = Math.max(...bm) + 3.8; }
  P.paceEnds.ship = P.ship.len;
  // the two lights join BY PLACE: night stands over the fast ice, the morning over the broken reach; the join lies
  // between 90 m above the broken edge and 40 m below it, measured along the race (the river metre of the lit point)
  P.join = { from: -90, to: 40 };
}

// a step may be a generator (it yields where the build may breathe); drain runs one to its end at once
export const drain = (it) => { if (!it || typeof it.next !== 'function') return it; let r = it.next(); while (!r.done) r = it.next(); return r.value; };
export const PLAN_STEPS = [planRiver, planRoute, planFires, planMaze, planCarnival, planBalloons, planCourt, planIce, planShip, planSwept, planBridge, planReach, planCity, planFigures, planGulls, planFilm];
export function planHead(seed, vary = {}) {
  return { seed, R: forks(seed), rare: !!vary.rare, density: vary.density ?? 1, varyHour: vary.hour || 'any' };
}
export function carnivalPlan(seed, vary = {}) { const P = planHead(seed, vary); for (const f of PLAN_STEPS) drain(f(P)); return P; }

// ================================================================ the look: one set of uniforms shared by every material
// No THREE lights. TWO STANDING LIGHTS JOINED BY PLACE: the first stands over the fast ice (a moon by night), the second
// over the broken reach (a low yellow sun). A point is lit by the one or the other according to its own river metre
// (cfHere), the same at every clock and for every visitor; nothing reads the metres flown. To each light: a key, a fill
// from the sky, a bounce off the ice, the far air's colour and thickness, how much lantern and fire light counts and how
// much the windows show. Lantern light is baked per vertex; the nearest bonfire lights per vertex in its colour of the moment.
const LIGHT_NAMES = ['uKeyDir', 'uKeyDir2', 'uKeyCol', 'uKeyCol2', 'uSkyFill', 'uSkyFill2', 'uGround', 'uGround2', 'uFogCol', 'uFogCol2', 'uSkyTop', 'uSkyTop2', 'uSkyHor', 'uSkyHor2', 'uDeep', 'uDeep2', 'uAirA', 'uAirB', 'uJoin', 'uJoinDir'];
// uAirA, uAirB: thickness of the far air, how much the windows show, how much lamp and fire light counts.
// uJoin: the broken edge's place x, z and the join's two ends in metres along the race. uJoinDir: the way the race runs.
const GLSL_LIGHT = /* glsl */`
uniform vec3 uKeyDir; uniform vec3 uKeyDir2; uniform vec3 uKeyCol; uniform vec3 uKeyCol2; uniform vec3 uSkyFill; uniform vec3 uSkyFill2;
uniform vec3 uGround; uniform vec3 uGround2; uniform vec3 uFogCol; uniform vec3 uFogCol2; uniform vec3 uSkyTop; uniform vec3 uSkyTop2;
uniform vec3 uSkyHor; uniform vec3 uSkyHor2; uniform vec3 uDeep; uniform vec3 uDeep2;
uniform vec3 uAirA; uniform vec3 uAirB; uniform vec4 uJoin; uniform vec2 uJoinDir;
float wm; vec3 keyDir; vec3 keyCol; vec3 skyFill; vec3 groundCol; vec3 fogCol; vec3 skyTop; vec3 skyHor; vec3 deepCol; float nightK; float lampK; float fogAmt;
float cfAlong(vec2 xz){ return dot(xz - uJoin.xy, uJoinDir); }
void cfHere(vec3 w){
  wm = smoothstep(uJoin.z, uJoin.w, cfAlong(w.xz));
  keyDir = normalize(mix(uKeyDir, uKeyDir2, wm)); keyCol = mix(uKeyCol, uKeyCol2, wm); skyFill = mix(uSkyFill, uSkyFill2, wm);
  groundCol = mix(uGround, uGround2, wm); fogCol = mix(uFogCol, uFogCol2, wm); skyTop = mix(uSkyTop, uSkyTop2, wm); skyHor = mix(uSkyHor, uSkyHor2, wm);
  deepCol = mix(uDeep, uDeep2, wm); nightK = mix(uAirA.y, uAirB.y, wm); lampK = mix(uAirA.z, uAirB.z, wm);
  fogAmt = 1. - exp(-length(w - cameraPosition) * mix(uAirA.x, uAirB.x, wm));
}
`;
export function makeLook() {
  const v3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
  const U = {
    uTime: { value: 0 }, uFire: { value: Array.from({ length: NFIRE }, () => v3()) }, uFirePos: { value: Array.from({ length: NFIRE }, () => new THREE.Vector4(0, -1000, 0, 1)) },
    uFlow: { value: v3(0, -1, 0) }, uRiverO: { value: new THREE.Vector2() }, uWater: { value: v3(...COL.thaw) },
    uAbs: { value: 0.045 }, uSwept: { value: -220 }, uPortal: { value: new THREE.Vector4(0, -1000, 0, 0) }, uPortalCol: { value: v3(1, 0.8, 0.45) },
    uAirA: { value: v3(0.0006, 1, 1) }, uAirB: { value: v3(0.0006, 1, 1) }, uJoin: { value: new THREE.Vector4(0, 0, 1e5, 2e5) }, uJoinDir: { value: new THREE.Vector2(0, -1) },
  };
  for (const k of ['', '2']) {
    U['uKeyDir' + k] = { value: v3(0.3, 0.6, 0.4).normalize() }; U['uKeyCol' + k] = { value: v3(0.5, 0.6, 0.9) }; U['uSkyFill' + k] = { value: v3(0.1, 0.14, 0.3) }; U['uGround' + k] = { value: v3(0.04, 0.06, 0.12) };
    U['uFogCol' + k] = { value: v3(0.05, 0.08, 0.2) }; U['uSkyTop' + k] = { value: v3(0.02, 0.03, 0.1) }; U['uSkyHor' + k] = { value: v3(0.08, 0.12, 0.3) }; U['uDeep' + k] = { value: v3(...COL.deep) };
  }
  // one of the two standing lights is set once, at the build: s = { dir, key, fill, ground, fog, fogK, night, lamp, top, hor, deep }
  const setLight = (second, s) => {
    const k = second ? '2' : '';
    U['uKeyDir' + k].value.copy(s.dir); U['uKeyCol' + k].value.fromArray(s.key); U['uSkyFill' + k].value.fromArray(s.fill); U['uGround' + k].value.fromArray(s.ground);
    U['uFogCol' + k].value.fromArray(s.fog); U['uSkyTop' + k].value.fromArray(s.top); U['uSkyHor' + k].value.fromArray(s.hor); U['uDeep' + k].value.fromArray(s.deep);
    (second ? U.uAirB : U.uAirA).value.set(s.fogK, s.night, s.lamp);
  };
  const pick = (...names) => { const o = {}; for (const n of names) o[n] = U[n]; return o; };
  const HEAD = `#define NFIRE ${NFIRE}\n`, LIGHT = GLSL_LIGHT, LIGHTU = pick(...LIGHT_NAMES);
  // ---- solids: vertex colour, baked lamp light (lt.rgb), glow (lt.w > 0 always, < 0 a window lit by night), fire (fr)
  const litVert = (floe) => HEAD + (floe ? GLSL_FLOE + 'attribute vec4 fa; attribute vec4 fb; attribute vec4 fc;\n' : '') + /* glsl */`
attribute vec4 lt; attribute vec2 fr;
uniform vec3 uFire[NFIRE];
varying vec3 vCol; varying vec3 vN; varying vec3 vLight; varying vec3 vW; varying float vEmit;
void main(){
  vec3 p = position, n = normal;
  ${floe ? 'p = cfFloe(p, fa, fb, fc, n);' : ''}
  vec4 wp = modelMatrix * vec4(p, 1.);
  vN = normalize(mat3(modelMatrix) * n + vec3(0., 1e-5, 0.)); vCol = color; vEmit = lt.w; vW = wp.xyz;
  vLight = lt.rgb + uFire[int(clamp(fr.x, 0., float(NFIRE - 1)) + .5)] * fr.y;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
  const litFrag = (mirror) => HEAD + LIGHT + /* glsl */`
uniform float uTime;
varying vec3 vCol; varying vec3 vN; varying vec3 vLight; varying vec3 vW; varying float vEmit;
void main(){
  cfHere(vW);
  vec3 n = normalize(vN + vec3(0., 1e-5, 0.));
  ${mirror ? 'n.y = -n.y; if (vW.y > 0.) discard;' : ''}
  float ndl = max(dot(n, keyDir), 0.);
  vec3 amb = mix(groundCol, skyFill, n.y * .5 + .5);
  vec3 col = vCol * (amb + keyCol * ndl + vLight * lampK);
  // a lit window is candle light: it wavers a little on the world clock, each window by its own measure
  float wph = fract(abs(vEmit) * 37.);
  col += vCol * (max(vEmit, 0.) * (.35 + .65 * lampK) + max(-vEmit, 0.) * nightK * (1. + .2 * sin(uTime * (2.2 + 3. * wph) + wph * 40.)));
  col = mix(col, fogCol, fogAmt);
  ${mirror ? `vec3 V = normalize(cameraPosition - vW); float F = .1 + .9 * pow(clamp(1. - abs(V.y), 0., 1.), 3.);
  gl_FragColor = vec4(col * .85, F * exp(vW.y * .035));` : 'gl_FragColor = vec4(col, 1.);'}
}`;
  const litU = { ...pick('uFire', 'uTime'), ...LIGHTU };
  const lit = new THREE.ShaderMaterial({ uniforms: litU, vertexShader: litVert(false), fragmentShader: litFrag(false), vertexColors: true });
  const litFloe = new THREE.ShaderMaterial({ uniforms: { ...litU, ...pick('uFlow') }, vertexShader: litVert(true), fragmentShader: litFrag(false), vertexColors: true });
  const mirror = new THREE.ShaderMaterial({ uniforms: litU, vertexShader: litVert(false), fragmentShader: litFrag(true), vertexColors: true, transparent: true, depthWrite: true });
  // ---- what lies under the ice: dimmed and tinted by the length of ice the eye looks through. It is drawn in the
  // blended pass (whole, alpha 1) after the sky and before the doubles and the sheet, and writes no depth, so that a
  // double that reaches deeper than the bed is still seen whole
  const under = new THREE.ShaderMaterial({
    uniforms: { ...pick('uFire', 'uFirePos', 'uAbs'), ...LIGHTU }, vertexColors: true, depthWrite: false, transparent: true,
    vertexShader: /* glsl */`
attribute float glow;
varying vec3 vCol; varying vec3 vN; varying vec3 vW; varying float vGlow;
void main(){ vec4 wp = modelMatrix * vec4(position, 1.); vN = normalize(mat3(modelMatrix) * normal + vec3(0., 1e-5, 0.)); vCol = color; vW = wp.xyz; vGlow = glow; gl_Position = projectionMatrix * viewMatrix * wp; }`,
    fragmentShader: HEAD + LIGHT + /* glsl */`
uniform vec3 uFire[NFIRE]; uniform vec4 uFirePos[NFIRE]; uniform float uAbs;
varying vec3 vCol; varying vec3 vN; varying vec3 vW; varying float vGlow;
void main(){
  cfHere(vW);
  vec3 n = normalize(vN + vec3(0., 1e-5, 0.)), V = normalize(cameraPosition - vW);
  vec3 light = skyFill * (1.7 + .8 * n.y) + keyCol * (.4 + .7 * max(dot(n, keyDir), 0.));
  for (int i = 0; i < NFIRE; i++) { vec2 d = vW.xz - uFirePos[i].xz; light += uFire[i] * (26. / (60. + dot(d, d))); }
  vec3 col = vCol * light * (1. + vGlow);
  float len = max(-vW.y, 0.) / max(V.y, .22), tr = exp(-len * uAbs);
  // red things (the apples) carry further through the ice than the rest
  tr = mix(tr * .8, sqrt(tr), step(.5, vGlow));
  vec3 deep = deepCol * (skyFill.b * 2.2 + .25);
  col = mix(deep, col, tr);
  col = mix(col, fogCol, fogAmt);
  gl_FragColor = vec4(col, 1.);
}`,
  });
  return { U, pick, HEAD, LIGHT, LIGHTU, setLight, litFrag, litU, mats: { lit, litFloe, mirror, under } };
}
// ---- the ice's own surface, shared by the fast sheet (clear, laid over what it holds) and by the floes (the same glass,
// closed below by the ice's depth colour): swept clear lanes, frost in patches, skate marks, the sky and the fires in it.
// The light is the place's own (cfHere is called first).
const GLSL_ICE = /* glsl */`
uniform vec3 uFire[NFIRE]; uniform vec4 uFirePos[NFIRE]; uniform float uSwept;
// rgb is premultiplied: what the surface itself sends to the eye; a is how much of what lies below it hides.
// swept: 1 where the ice was swept bare (the court's ground and on down to the broken edge): there the frost is all but gone
vec4 cfIce(vec2 xz, vec3 W, float white, float swept){
  vec3 V = normalize(cameraPosition - W); float dist = length(cameraPosition - W);
  float f1 = cfF(xz * .033), f2 = cfF(xz * .19 + 7.3);
  float frost = smoothstep(.5, .76, f1 + .22 * f2 - .1) * (1. - .86 * swept);
  float near = 1. - smoothstep(40., 150., dist);
  float c1 = cfN(xz * .1), c2 = cfN(xz.yx * .083 + 31.);
  float line = (1. - smoothstep(0., .02, abs(fract(c1 * 9.) - .5))) + (1. - smoothstep(0., .018, abs(fract(c2 * 7.) - .5)));
  float speck = smoothstep(.72, .95, cfN(xz * 5.1)) * .14;
  // skate marks are hair-thin and faint: the sheet is dark glass first
  float cover = clamp(frost * (.55 + .4 * f2) + (line * .2 + speck) * near + white, 0., 1.);
  vec3 pool = vec3(0.);
  for (int i = 0; i < NFIRE; i++) { vec2 d = xz - uFirePos[i].xz; pool += uFire[i] * (30. / (30. + dot(d, d))); }
  vec3 lightOn = skyFill * 1.25 + keyCol * max(keyDir.y, 0.) * .9 + pool * 1.6;
  vec3 frostCol = vec3(.78, .86, 1.) * lightOn;
  vec2 tilt = (vec2(cfN(xz * .7), cfN(xz * .7 + 19.)) - .5) * .05;
  vec3 R = reflect(-V, normalize(vec3(tilt.x, 1., tilt.y)));
  float F = .04 + .96 * pow(clamp(1. - V.y, 0., 1.), 4.);
  vec3 sky = mix(skyHor, skyTop, pow(clamp(R.y, 0., 1.), .5));
  float glint = pow(clamp(dot(R, keyDir), 0., 1.), 700.) * 1.6 + pow(clamp(dot(R, keyDir), 0., 1.), 40.) * .07;
  vec3 refl = sky * F + keyCol * glint;
  vec3 inner = pool * .22 * vec3(.8, 1., 1.);
  // the sky's image is added; it hides only a part of what lies below, so the doubles of the things standing on the ice
  // (drawn before the sheet) are not put out by it where the eye looks along the ice
  return vec4(cover * frostCol + (1. - cover) * (refl + inner), cover + (1. - cover) * F * .35);
}
// a net of cells: metres to the nearest cell edge (the white cracks that stand in the last of the fast ice)
float cfNet(vec2 p, float sc){
  vec2 q = p / sc, i = floor(q), f = fract(q); float d1 = 9., d2 = 9.;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec2 g = vec2(float(x), float(y)), o = vec2(cfH(i + g), cfH(i + g + 37.7)), r = g + o - f; float d = dot(r, r);
    if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) { d2 = d; }
  }
  return (sqrt(d2) - sqrt(d1)) * sc * .5;
}
`;
export function addIceMats(look) {
  const { pick, HEAD, LIGHT, LIGHTU, mats } = look;
  const iceU = { ...pick('uFire', 'uFirePos', 'uSwept'), ...LIGHTU };
  // the fast sheet. For some tens of metres above its broken edge it is crazed with white cracks that STAND in it, thicker
  // and finer toward the edge: a function of the place's river metre and of nothing else
  mats.ice = new THREE.ShaderMaterial({
    uniforms: iceU, transparent: true, depthWrite: false, premultipliedAlpha: true,
    vertexShader: 'varying vec3 vW;\nvoid main(){ vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }',
    fragmentShader: HEAD + LIGHT + GLSL_NOISE + GLSL_ICE + /* glsl */`
varying vec3 vW;
void main(){
  cfHere(vW);
  float al = cfAlong(vW.xz), white = 0.;
  if (al > -78.) {
    float k = smoothstep(-78., -4., al), e1 = cfNet(vW.xz, 13.), e2 = cfNet(vW.xz + 41., 4.6);
    white = (1. - smoothstep(0., .05 + .32 * k, e1)) * smoothstep(0., .25, k) + (1. - smoothstep(0., .03 + .1 * k, e2)) * smoothstep(.45, .9, k) * .8;
    white = clamp(white, 0., 1.) * .95;
  }
  // past the silken rope the ice is swept bare, all the way down to its broken edge (by the place's metres along the race)
  vec4 c = cfIce(vW.xz, vW, white, smoothstep(uSwept - 10., uSwept + 40., al));
  gl_FragColor = vec4(mix(c.rgb, fogCol, fogAmt), mix(c.a, 1., fogAmt));
}`,
  });
  // the floes: tops carry the sheet's own surface by the place they were built at (so it rides with them); white along
  // every rim and in hairlines. ed: x = metres in from the rim (on a broken face: how much snow), y = 0 a floe's top,
  // 1 brash, 2 a broken face
  mats.floe = new THREE.ShaderMaterial({
    uniforms: { ...iceU, ...pick('uFlow') },
    vertexShader: HEAD + GLSL_FLOE + /* glsl */`
attribute vec4 fa; attribute vec4 fb; attribute vec4 fc; attribute vec2 ed;
varying vec3 vW; varying vec3 vRest; varying vec3 vN; varying vec2 vEd;
void main(){
  vec3 n = normal, p = cfFloe(position, fa, fb, fc, n);
  vec4 wp = modelMatrix * vec4(p, 1.);
  vW = wp.xyz; vRest = position; vN = n; vEd = ed;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`,
    fragmentShader: HEAD + LIGHT + GLSL_NOISE + GLSL_ICE + /* glsl */`
varying vec3 vW; varying vec3 vRest; varying vec3 vN; varying vec2 vEd;
void main(){
  cfHere(vW);
  vec3 n = normalize(vN + vec3(0., 1e-5, 0.));
  float rim = 1. - smoothstep(0., .5, vEd.x);
  float hair = (1. - smoothstep(0., .05, abs(fract(cfN(vRest.xz * .23 + 5.) * 6.) - .5))) * .7;
  float white = clamp(rim + hair + vEd.y, 0., 1.);
  vec3 col;
  if (vEd.y < 1.5) {
    vec4 c = cfIce(vRest.xz, vW, white * .9, 0.);
    vec3 deep = deepCol * (skyFill.b * 2.2 + .25);
    col = c.rgb + (1. - c.a) * deep;
  } else {
    // a broken face: blue-green glass, pale where the key strikes it, darker down toward the water
    float ndl = max(dot(n, keyDir), 0.), down = clamp(-vRest.y / 5., 0., 1.);
    vec3 face = mix(mix(vec3(.5, .78, .82), vec3(.1, .3, .36), down), vec3(.86, .92, .98), clamp(vEd.x, 0., 1.));
    col = face * (skyFill * 1.5 + keyCol * (.25 + ndl)) + vec3(.6, .8, .9) * keyCol * pow(clamp(1. - abs(n.y), 0., 1.), 2.) * .15;
  }
  col = mix(col, fogCol, fogAmt);
  gl_FragColor = vec4(col, 1.);
}`,
  });
  // the water of the broken reach: a yellow race from the first frame to the last, with ripples that keep their size in
  // metres and run on the world clock, the sky and the low sun in it, and white where it breaks
  mats.water = new THREE.ShaderMaterial({
    uniforms: { ...LIGHTU, ...pick('uFlow', 'uRiverO', 'uWater', 'uPortal', 'uPortalCol') },
    vertexShader: 'varying vec3 vW;\nvoid main(){ vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }',
    fragmentShader: HEAD + LIGHT + GLSL_NOISE + /* glsl */`
uniform vec3 uFlow; uniform vec2 uRiverO; uniform vec3 uWater; uniform vec4 uPortal; uniform vec3 uPortalCol;
varying vec3 vW;
void main(){
  cfHere(vW);
  vec2 fl = uFlow.xy, rel = vW.xz - uRiverO; float along = dot(rel, fl), across = dot(rel, vec2(-fl.y, fl.x)), t = uFlow.z;
  vec3 V = normalize(cameraPosition - vW);
  float n1 = cfF(vec2(along * .045 - t * .5, across * .11)), n2 = cfN(vec2(along * .5 - t * 2.4, across * .9)), n3 = cfN(vec2(along * 1.7 - t * 4., across * 2.6 + t));
  vec3 nn = normalize(vec3((n2 - .5) * .5 + (n3 - .5) * .25, 1., (n1 - .5) * .6));
  vec3 R = reflect(-V, nn); float F = .03 + .97 * pow(clamp(1. - V.y, 0., 1.), 5.);
  vec3 sky = mix(skyHor, skyTop, pow(clamp(R.y, 0., 1.), .5));
  // river water under a yellow morning: brown-gold where it heaves up, olive in its troughs, a third less colour than
  // the light that falls on it; the bridge's shade lies on it under the arches and a little way up the race
  vec3 wcol = mix(uWater * vec3(.5, .62, .42), uWater, smoothstep(.25, .7, n1));
  vec3 body = wcol * (skyFill * 1.6 + keyCol * (.35 + .5 * max(keyDir.y, 0.))) * (.45 + .8 * n1) * (.8 + .4 * n2);
  vec3 pd = vW - uPortal.xyz; float da = dot(pd.xz, fl);
  body *= 1. - .45 * smoothstep(-34., -4., da) * (1. - smoothstep(16., 26., da));
  body = mix(vec3(dot(body, vec3(.3, .55, .15))), body, .68); sky = mix(vec3(dot(sky, vec3(.3, .55, .15))), sky, .68);
  // the light's road lies only toward the sun; breaks are small and soft
  float spark = pow(clamp(dot(R, keyDir), 0., 1.), 140.) * 1.4;
  float foam = smoothstep(.76, .96, n1 * .6 + n2 * .5) * smoothstep(.35, .8, n3) * (.3 + .5 * smoothstep(-40., 240., along));
  vec3 col = mix(body, sky, F * .5) + keyCol * spark + vec3(.9, .88, .78) * foam * (skyFill * 1.6 + keyCol * .5);
  col += uPortalCol * uPortal.w * (40. / (40. + dot(pd.xz, pd.xz)));
  col = mix(col, fogCol, fogAmt);
  gl_FragColor = vec4(col, 1.);
}`,
  });
  return look;
}
// ---- sprites (flames, lantern glows, sparks, falling frost glitter, snow), smoke, and the small figures
// A sprite turns about its own place to face the eye; its place and size are the world's. (Both faces are drawn: the
// image in the ice is the same sheet turned over.) sa: x y z size. sb: kind, fire index, phase, height. sc: colour.
// kinds: 0 glow, 1 flame tongue, 2 spark, 3 glitter, 4 snowflake. fa fb fc: the floe it rides, if any.
export function addFxMats(look) {
  const { pick, HEAD, LIGHT, LIGHTU, mats } = look;
  const spriteVert = HEAD + LIGHT + GLSL_FLOE + /* glsl */`
attribute vec4 sa; attribute vec4 sb; attribute vec3 sc; attribute vec4 fa; attribute vec4 fb; attribute vec4 fc;
uniform vec3 uFire[NFIRE]; uniform float uTime; uniform float uMirror;
varying vec2 vUv; varying vec3 vCol; varying float vKind; varying float vPh; varying float vFade;
void main(){
  float kind = sb.x, ph = sb.z; vec3 nn = vec3(0., 1., 0.);
  vec3 c = cfFloe(sa.xyz, fa, fb, fc, nn);
  cfHere(c);
  int fi = int(clamp(sb.y, 0., float(NFIRE - 1)) + .5);
  vec3 eye = normalize(cameraPosition - c + vec3(1e-3, 0., 0.));
  vec3 right = normalize(vec3(eye.z, 0., -eye.x) + vec3(1e-4, 0., 0.)), up = cross(eye, right);
  vec2 q = uv - vec2(.5, .5); vec3 wp; vec3 col = sc; float fade = 1.;
  if (kind < .5) {
    c.x += sin(uTime * .9 + ph * 6.28) * .05;
    wp = c + (right * q.x + up * q.y) * sa.w; col = (sb.w > .5 ? uFire[fi] * sc : sc) * lampK;
    // a glow has one strength at every distance
    fade = .6;
  } else if (kind < 1.5) {
    vec3 tc = cameraPosition - c; vec3 r2 = normalize(vec3(tc.z, 0., -tc.x) + vec3(1e-4, 0., 0.));
    float h = sb.w * (.82 + .18 * sin(uTime * (5. + 3. * ph) + ph * 40.));
    float lean = sin(uTime * 1.7 + ph * 12.) * .06 * uv.y * uv.y * sb.w;
    wp = c + r2 * (q.x * sa.w + lean) + vec3(0., 1., 0.) * (uv.y * h);
    col = uFire[fi];
  } else if (kind < 2.5) {
    float life = fract(uTime * (.16 + .1 * ph) + ph * 7.);
    c += vec3(sin(ph * 40. + life * 5.) * (1. + life * 2.5), life * sb.w, cos(ph * 31. + life * 4.) * (1. + life * 2.5));
    wp = c + (right * q.x + up * q.y) * sa.w * (1. - .6 * life);
    col = uFire[fi] * 2. + vec3(.5, .35, .15); fade = 1. - life;
  } else if (kind < 3.5) {
    float life = fract(uTime * (.035 + .02 * ph) + ph * 13.);
    c.y -= life * sb.w; c.x += sin(uTime * .3 + ph * 20.) * .3;
    wp = c + (right * q.x + up * q.y) * sa.w;
    float tw = pow(clamp(.5 + .5 * sin(uTime * (3. + 4. * ph) + ph * 50.), 0., 1.), 6.);
    col = (uFire[fi] * 1.2 + vec3(.25, .3, .4)) * tw; fade = sin(life * 3.1416);
  } else {
    float life = fract(uTime * (.02 + .008 * ph) + ph * 13.);
    c.y += sb.w * (1. - life);
    wp = c + (right * q.x + up * q.y) * sa.w;
    col = (skyFill * 2.4 + keyCol * .8) * sc.x + uFire[fi] * sc.y; fade = smoothstep(0., .05, life) * (1. - smoothstep(.95, 1., life));
  }
  if (uMirror < 0.) wp.y = -wp.y;
  vUv = uv; vCol = col; vKind = kind; vPh = ph; vFade = fade;
  vec3 V = normalize(cameraPosition - wp);
  if (uMirror < 0.) vFade *= (.12 + .88 * pow(clamp(1. - abs(V.y), 0., 1.), 3.)) * .9;
  gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.);
}`;
  const spriteFrag = HEAD + GLSL_NOISE + /* glsl */`
uniform float uTime;
varying vec2 vUv; varying vec3 vCol; varying float vKind; varying float vPh; varying float vFade;
void main(){
  vec3 col; float d = length(vUv - .5) * 2.;
  if (vKind < .5) {
    float I = exp(-d * d * 9.) * 1.5 + exp(-d * 3.2) * .3; I *= 1. - smoothstep(.7, 1., d);
    col = vCol * I;
  } else if (vKind < 1.5) {
    float x = (vUv.x - .5) * 2., y = vUv.y;
    float n = cfF(vec2(vUv.x * 2.4 + vPh * 17., y * 2.8 - uTime * (1.5 + vPh)));
    float body = (1. - y) * (1. - x * x) * 1.25;
    float fl = smoothstep(.3, .75, body + (n - .5) * (.5 + 1.1 * y));
    float core = pow(clamp(fl * (1. - y), 0., 1.), 2.5);
    // the salt's colour all the way down: only a little white at the heart (seven tongues add up)
    col = (vCol * (1.15 * fl + .7 * core) + vec3(1., .92, .75) * core * .25) * smoothstep(0., .04, y);
  } else {
    col = vCol * exp(-d * d * 7.) * (1. - smoothstep(.7, 1., d));
  }
  gl_FragColor = vec4(col * vFade, 0.);
}`;
  const spU = (m) => ({ ...pick('uFire', 'uTime', 'uFlow'), ...LIGHTU, uMirror: { value: m } });
  const spriteMat = (m) => new THREE.ShaderMaterial({ uniforms: spU(m), vertexShader: spriteVert, fragmentShader: spriteFrag, transparent: true, depthWrite: false, side: THREE.DoubleSide, premultipliedAlpha: true, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, blendEquation: THREE.AddEquation });
  mats.sprite = spriteMat(1); mats.spriteMirror = spriteMat(-1);
  // smoke: a tall soft sheet that turns about its own upright axis and bends with the world's one wind (SMOKE_WIND, the
  // same law in the plan's test), more the higher it stands, wavering a little on the world clock. sa: x y z width.
  // sb: height, phase, kind (0 a chimney's, 1 a bonfire's, 2 steam where water laps embers), fire index
  mats.smoke = new THREE.ShaderMaterial({
    uniforms: { ...pick('uFire', 'uTime', 'uFlow'), ...LIGHTU }, transparent: true, depthWrite: false, side: THREE.DoubleSide, premultipliedAlpha: true,
    vertexShader: HEAD + GLSL_FLOE + /* glsl */`
attribute vec4 sa; attribute vec4 sb; attribute vec4 fa; attribute vec4 fb; attribute vec4 fc;
varying vec2 vUv; varying vec4 vS; varying vec3 vW;
void main(){
  vec3 nn = vec3(0., 1., 0.); vec3 c = cfFloe(sa.xyz, fa, fb, fc, nn); vec3 tc = cameraPosition - c; vec3 r2 = normalize(vec3(tc.z, 0., -tc.x) + vec3(1e-4, 0., 0.));
  float y = uv.y, chim = 1. - step(.5, sb.z), steam = step(1.5, sb.z);
  float hgt = sb.x * mix(mix(.75, 1., steam), .5, chim);
  float w = sa.w * mix(1., .8, chim) * (1. + y * mix(2.2, 3.4, chim));
  vec2 wd = normalize(vec2(uFlow.x * .5 - uFlow.y * .87, uFlow.y * .5 + uFlow.x * .87));
  // the lean with the wind, a slow bend along the column's height, and (a chimney's thin column) a faster small
  // flutter with a phase of its own: all on the world clock
  float drift = hgt * .55 * y * y * mix(.6, 1., chim) + sin(uFlow.z * .35 + sb.y * 6.28 + y * 3.5) * y * sa.w * .9
    + chim * sin(uFlow.z * 1.5 + sb.y * 37. + y * 11.) * y * sa.w * .28;
  vec3 wp = c + r2 * ((uv.x - .5) * w) + vec3(0., y * hgt, 0.) + vec3(wd.x, 0., wd.y) * drift;
  vUv = uv; vS = sb; vW = wp;
  gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.);
}`,
    fragmentShader: HEAD + LIGHT + GLSL_NOISE + /* glsl */`
uniform vec3 uFire[NFIRE]; uniform float uTime;
varying vec2 vUv; varying vec4 vS; varying vec3 vW;
void main(){
  cfHere(vW);
  float x = (vUv.x - .5) * 2., y = vUv.y, steam = step(1.5, vS.z), bon = step(.5, vS.z) * (1. - steam);
  float n = cfF(vec2(vUv.x * 1.6 + vS.y * 23., y * (6. + 2.5 * bon) - uTime * (.3 - .1 * bon + .1 * steam)));
  // thin at the foot, spread and gone toward the top; only a little lighter than the air behind it (smoke, not a beam)
  float a = pow(clamp(1. - x * x, 0., 1.), 2.4) * smoothstep(0., .08, y) * pow(clamp(1. - y, 0., 1.), mix(2.2, 1.7, bon)) * mix(.1 + 1.3 * smoothstep(.28, .7, n), .12 + 1.05 * n, bon);
  a *= mix(.52, .38, bon) + .2 * steam;
  // a column takes the air's light of its own place at its foot and goes into the hour's zenith as it rises: smoke is
  // never brighter than the sky it stands against (it is smoke, not a beam)
  vec3 foot = fogCol * .62 + keyCol * .04 + skyFill * .15, high = uSkyTop * 1.5 + skyFill * .1;
  vec3 air = mix(foot, high, smoothstep(.03, .5, y) * (1. - steam));
  vec3 col = air + steam * (skyFill * .9 + keyCol * .22);
  int fi = int(clamp(vS.w, 0., float(NFIRE - 1)) + .5);
  col += bon * uFire[fi] * exp(-y * 5.5) * .9 + (1. - bon) * (1. - steam) * vec3(.5, .3, .16) * exp(-y * 14.) * .15 + steam * uFire[fi] * exp(-y * 3.) * .35;
  a *= 1. - fogAmt * .8;
  gl_FragColor = vec4(col * a, a);
}`,
  });
  // powder snow smoking off a roof in the one light wind: a thin soft veil that streams from its place on the ridge
  // or the eave down the wind (the smoke's own wind), lifts as it goes, sways a little and thins out; it comes and
  // goes in gusts on the world clock by a phase of its own, and takes the light of its own place. It is a low sheet
  // lying across the wind; its place, length, width and lift are the world's (the plan tests them, the count
  // mirrors them). sa: x y z width. sb: length, phase, lift, fire index. sc: the nearest fire's share, the windows' share
  mats.veil = new THREE.ShaderMaterial({
    uniforms: { ...pick('uFire', 'uTime', 'uFlow'), ...LIGHTU }, transparent: true, depthWrite: false, side: THREE.DoubleSide, premultipliedAlpha: true,
    vertexShader: HEAD + /* glsl */`
attribute vec4 sa; attribute vec4 sb; attribute vec4 sc;
uniform vec3 uFlow;
varying vec2 vUv; varying vec4 vS; varying vec4 vC; varying vec3 vW;
void main(){
  vec2 wd = normalize(vec2(uFlow.x * .5 - uFlow.y * .87, uFlow.y * .5 + uFlow.x * .87));
  float y = uv.y, ph = sb.y, t = uFlow.z;
  vec3 al = vec3(wd.x, 0., wd.y), sd = vec3(-wd.y, 0., wd.x);
  float lift = sb.z * (1. - (1. - y) * (1. - y)) * (.75 + .25 * sin(t * .7 + ph * 9.));
  vec3 c = sa.xyz + al * (y * sb.x) + sd * (sin(t * .9 + ph * 6.28 + y * 3.) * .25 * y) + vec3(0., lift, 0.);
  vec3 wp = c + sd * ((uv.x - .5) * sa.w * (.6 + .8 * y));
  vUv = uv; vS = sb; vC = sc; vW = wp;
  gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.);
}`,
    fragmentShader: HEAD + LIGHT + GLSL_NOISE + /* glsl */`
uniform vec3 uFire[NFIRE]; uniform float uTime;
varying vec2 vUv; varying vec4 vS; varying vec4 vC; varying vec3 vW;
void main(){
  cfHere(vW);
  float x = (vUv.x - .5) * 2., y = vUv.y, ph = vS.y;
  float n = cfF(vec2(vUv.x * 1.3 + ph * 31., y * 2.4 - uTime * .6 + ph * 17.));
  float gust = smoothstep(-.3, .8, sin(uTime * .37 + ph * 6.28) + .4 * sin(uTime * .91 + ph * 23.));
  float a = pow(clamp(1. - x * x, 0., 1.), 2.) * smoothstep(0., .1, y) * pow(clamp(1. - y, 0., 1.), 1.3) * smoothstep(.2, .75, n) * (.2 + .8 * gust) * .8;
  int fi = int(clamp(vS.w, 0., float(NFIRE - 1)) + .5);
  vec3 col = vec3(.86, .91, 1.) * (skyFill * 1.15 + keyCol * .5 + fogCol * .2) + uFire[fi] * vC.x * .5 + vec3(1., .62, .3) * lampK * vC.y;
  a *= 1. - fogAmt * .8;
  gl_FragColor = vec4(col * a, a);
}`,
  });
  return look;
}
// ================================================================ the people
// Small figures without faces: a wide skirt or cloak, shoulders, a dark head, a broad hat with a plume. One instanced
// mesh; each instance follows its own curve on the world clock (start phases come from the figure's own stream).
// lite: the image in the ice is the cloak and a dark knob only (it is faint, and half the triangles)
function figureGeometry(sledge, lite) {
  const b = makeBuilder(2048), G = [1, 1, 1];
  const body = (x, z, k) => {
    b.surf(0).col(G, 0.55, 1);
    // a skirt or cloak that falls in a bell from a waist, a bodice, a neck
    b.lathe(x, 0, z, lite ? [[0.6 * k, 0.03], [0.5 * k, 0.55], [0.2, 1.0], [0.27, 1.3], [0.12, 1.44], [0, 1.47]] : [[0.6 * k, 0.03], [0.57 * k, 0.3], [0.4 * k + 0.04, 0.78], [0.19, 1.0], [0.25, 1.2], [0.25, 1.32], [0, 1.47]], lite ? 5 : 6, { facet: false, smooth: true });
    if (lite) { b.surf(2).col([0.08, 0.07, 0.08], 1, 1); b.cyl(x, 1.47, z, 0.3, 0.12, 0.34, 4); return; }
    // a shoulder line wider than the body is deep, and two sleeves falling from it
    b.surf(0).col(G, 0.7, 0.95); b.beam([x - 0.36, 1.3, z], [x + 0.36, 1.3, z], 0.2, 0.15);
    for (const sx of [-1, 1]) b.beam([x + sx * 0.34, 1.3, z], [x + sx * 0.4, 0.84, z + 0.1], 0.12, 0.12);
    // the shade the figure throws straight down on the ice it stands on (it does not lean with the body)
    b.surf(2).col([0.07, 0.085, 0.13], 1, 1); b.lathe(x, 0.025, z, [[0.7 * k, 0], [0, 0.015]], 8);
    b.surf(2).col([0.16, 0.11, 0.09], 1, 1); b.sphere(x, 1.58, z, 0.125, 5, 3);
    b.col([0.05, 0.05, 0.07], 1, 1); b.cyl(x, 1.66, z, 0.33, 0.33, 0.03, 7); b.cyl(x, 1.69, z, 0.15, 0.13, 0.17, 5);
    b.surf(3).col(G, 1, 1); b.tri([x + 0.1, 1.8, z - 0.05], [x + 0.14, 1.84, z - 0.5], [x + 0.2, 2.12, z - 0.34]); b.tri([x + 0.14, 1.84, z - 0.5], [x + 0.1, 1.8, z - 0.05], [x + 0.2, 2.12, z - 0.34]);
  };
  if (!sledge) body(0, 0, 1);
  else {
    body(0, -0.75, 0.8);
    b.surf(2).col([0.3, 0.16, 0.08], 0.8, 1); b.box(-0.36, 0.28, 0.0, 0.36, 0.38, 0.75); b.box(-0.36, 0.38, 0.0, 0.36, 1.15, 0.08);
    for (const sx of [-1, 1]) { b.col([0.5, 0.4, 0.2], 1, 1); b.beam([sx * 0.34, 0.04, -0.35], [sx * 0.34, 0.04, 1.15], 0.06, 0.08); b.beam([sx * 0.34, 0.06, 0.1], [sx * 0.34, 0.3, 0.1], 0.05, 0.05); b.beam([sx * 0.34, 0.06, 0.65], [sx * 0.34, 0.3, 0.65], 0.05, 0.05); }
    b.surf(0).col(G, 0.6, 1); b.lathe(0, 0.38, 0.38, [[0.34, 0], [0.3, 0.4], [0.2, 0.62], [0, 0.63]], 6, { smooth: true });
    b.surf(2).col([0.16, 0.11, 0.09], 1, 1); b.sphere(0, 1.12, 0.38, 0.12, 6, 4);
  }
  const n = b.nv, g = new THREE.InstancedBufferGeometry(), pk = new Float32Array(n); for (let i = 0; i < n; i++) pk[i] = b.W[i * 3];
  g.setAttribute('position', new THREE.BufferAttribute(b.P.slice(0, n * 3), 3)); g.setAttribute('normal', new THREE.BufferAttribute(b.N.slice(0, n * 3), 3));
  g.setAttribute('color', new THREE.BufferAttribute(b.C.slice(0, n * 3), 3)); g.setAttribute('pk', new THREE.BufferAttribute(pk, 1));
  g.setIndex(new THREE.BufferAttribute(new Uint16Array(b.I.subarray(0, b.ni)), 1));
  return g;
}
const GARB = ['#8a1f2c', '#27407a', '#5a2a6e', '#b8922c', '#1f5a46', '#a04a1c', '#3a3f4e', '#c8bfae'].map(lin);
export function makeFigures(P, look, list = P.figures) {
  const { HEAD, litFrag, litU, mats, U } = look;
  const vert = HEAD + /* glsl */`
attribute float pk; attribute vec4 ia; attribute vec4 ib; attribute vec4 ic; attribute vec3 icol;
uniform float uTime; uniform float uMirror; uniform vec3 uFire[NFIRE];
varying vec3 vCol; varying vec3 vN; varying vec3 vLight; varying vec3 vW; varying float vEmit;
void main(){
  float kind = ib.y, th = ia.w + ib.x * uTime, face, lean = 0., roll = 0.; vec2 c = ia.xy, pos;
  vec3 p = position * ib.z, n = normal;
  if (kind < .5) { pos = c; face = ia.w + sin(uTime * ib.x + ic.x) * .14; p.y *= 1. + .014 * sin(uTime * 2.1 * ib.x + ic.x * 5.); }
  else if (kind > 1.5 && kind < 2.5) {
    float phi = ic.x + uTime * ib.w;
    pos = c + ia.z * vec2(cos(th), sin(th)) + .52 * vec2(cos(phi), sin(phi)); face = atan(-cos(phi), -sin(phi)); p.y *= 1. + .02 * sin(phi * 2.);
  } else {
    float co = cos(ic.x), so = sin(ic.x); vec2 e = vec2(cos(th), sin(th) * ib.w) * ia.z, tg = vec2(-sin(th), cos(th) * ib.w) * sign(ib.x);
    pos = c + vec2(co * e.x - so * e.y, so * e.x + co * e.y); tg = vec2(co * tg.x - so * tg.y, so * tg.x + co * tg.y);
    face = atan(tg.x, tg.y); lean = kind > 2.5 ? .05 : .2; roll = kind > 2.5 ? 0. : sin(uTime * 2.6 + ia.w * 3.) * .13 - sign(ib.x) * .1;
  }
  if (position.y < .045) { lean = 0.; roll = 0.; }
  float cl = cos(lean), sl = sin(lean); p = vec3(p.x, p.y * cl - p.z * sl, p.y * sl + p.z * cl); n = vec3(n.x, n.y * cl - n.z * sl, n.y * sl + n.z * cl);
  float cr = cos(roll), sr = sin(roll); p = vec3(p.x * cr - p.y * sr, p.x * sr + p.y * cr, p.z); n = vec3(n.x * cr - n.y * sr, n.x * sr + n.y * cr, n.z);
  float cf = cos(face), sf = sin(face);
  vec3 w = vec3(pos.x + p.x * cf + p.z * sf, p.y, pos.y - p.x * sf + p.z * cf); n = vec3(n.x * cf + n.z * sf, n.y, -n.x * sf + n.z * cf);
  if (uMirror < 0.) { w.y = -w.y; n.y = -n.y; }
  vCol = pk < .5 ? icol * color : (pk < 2.5 ? color : icol.gbr * 1.6 + .25);
  vN = n; vW = w; vEmit = 0.; vLight = vec3(1., .62, .3) * ic.y + uFire[int(clamp(ic.z, 0., float(NFIRE - 1)) + .5)] * ic.w;
  gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.);
}`;
  const mat = new THREE.ShaderMaterial({ uniforms: { ...litU, uTime: U.uTime, uMirror: { value: 1 } }, vertexShader: vert, fragmentShader: litFrag(false), vertexColors: true });
  const matM = new THREE.ShaderMaterial({ uniforms: { ...litU, uTime: U.uTime, uMirror: { value: -1 } }, vertexShader: vert, fragmentShader: litFrag(true), vertexColors: true, transparent: true, depthWrite: true, side: THREE.BackSide });
  const group = new THREE.Group(), out = { object: group, count: 0, triangles: 0 };
  for (const sledge of [false, true]) {
    const sel = list.filter((f) => (f.kind === 3) === sledge), n = sel.length; if (!n) continue;
    const g = figureGeometry(sledge, false), gm = figureGeometry(sledge, true), ia = new Float32Array(n * 4), ib = new Float32Array(n * 4), ic = new Float32Array(n * 4), icol = new Float32Array(n * 3);
    sel.forEach((f, i) => {
      let bi = 0, bk = 0; for (const fi of P.fires) { if (fi.floe) continue; const k = 1.5 / (1 + ((fi.x - f.cx) ** 2 + (fi.z - f.cz) ** 2) / 150); if (k > bk) { bk = k; bi = fi.i; } }
      ia.set([f.cx, f.cz, f.rad, f.ph], i * 4); ib.set([f.w, f.kind, f.scale, f.ell], i * 4); ic.set([f.ori, 0.22, bi, bk], i * 4); icol.set(GARB[f.col % GARB.length], i * 3);
    });
    const A = { ia: new THREE.InstancedBufferAttribute(ia, 4), ib: new THREE.InstancedBufferAttribute(ib, 4), ic: new THREE.InstancedBufferAttribute(ic, 4), icol: new THREE.InstancedBufferAttribute(icol, 3) };
    for (const q of [g, gm]) { for (const k in A) q.setAttribute(k, A[k]); q.instanceCount = n; }
    const m = new THREE.Mesh(g, mat), mm = new THREE.Mesh(gm, matM); m.frustumCulled = false; mm.frustumCulled = false; mm.renderOrder = 0.5;
    group.add(m, mm); out.count += n; out.triangles += n * (g.index.count + gm.index.count) / 3;
  }
  mats.fig = mat; mats.figMirror = matM;
  return out;
}

// ================================================================ geometry out of a Builder, with the place's light baked in
// Surfaces: surf(0) plain, surf(8, 0, k) a glow that is always lit (lanterns, embers), surf(1, 0, k) a window lit by night.
const LCOL = [COL.lamp, COL.lamp, mix3(COL.lamp, [1, 0.25, 0.1], 0.5), COL.lamp, mix3(COL.lamp, [0.4, 1, 0.5], 0.45), mix3(COL.lamp, [1, 0.9, 0.5], 0.5)];
export const lampColor = (c) => LCOL[c % LCOL.length];
const NONE = [];
function lampGrid(P) {
  if (P.lampCells) return P.lampCells;
  const cells = new Map();
  for (const l of P.lanterns) { if (l.floe) continue; const k = (Math.floor(l.x / 10) + 4096) * 8192 + Math.floor(l.z / 10) + 4096; let a = cells.get(k); if (!a) cells.set(k, a = []); a.push(l); }
  return (P.lampCells = cells);
}
// the box and the sphere round n corners, by one plain loop (the renderer's own first use of its bounds code is a long step)
function setBounds(g, Pp, n) {
  let x0 = Infinity, y0 = Infinity, z0 = Infinity, x1 = -Infinity, y1 = -Infinity, z1 = -Infinity;
  for (let i = 0; i < n; i++) { const x = Pp[i * 3], y = Pp[i * 3 + 1], z = Pp[i * 3 + 2]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; if (z < z0) z0 = z; if (z > z1) z1 = z; }
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, cz = (z0 + z1) / 2; let r2 = 0;
  for (let i = 0; i < n; i++) { const dx = Pp[i * 3] - cx, dy = Pp[i * 3 + 1] - cy, dz = Pp[i * 3 + 2] - cz, d = dx * dx + dy * dy + dz * dz; if (d > r2) r2 = d; }
  g.boundingBox = new THREE.Box3(new THREE.Vector3(x0, y0, z0), new THREE.Vector3(x1, y1, z1)); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(cx, cy, cz), Math.sqrt(r2));
}
// o.floe: the floe the thing rides (then only that floe's own lanterns and fire light it); o.under: a mesh under the ice
export function bakeGeo(b, P, o = {}) { return drain(bakeGeoGen(b, P, o)); }
export function* bakeGeoGen(b, P, o = {}) {
  const n = b.nv, Pp = b.P, N = b.N, W = b.W, lt = new Float32Array(n * 4), fr = new Float32Array(n * 2), cells = lampGrid(P);
  const own = o.floe ? P.lanterns.filter((l) => l.floe === o.floe) : null, fires = P.fires.filter((f) => (o.floe ? f.floe === o.floe : !f.floe));
  let lastKey = -1, near = [];
  for (let i = 0; i < n; i++) {
    if (i % 300 === 299) yield;
    const x = Pp[i * 3], y = Pp[i * 3 + 1], z = Pp[i * 3 + 2], nx = N[i * 3], ny = N[i * 3 + 1], nz = N[i * 3 + 2], st = W[i * 3];
    lt[i * 4 + 3] = st === 8 ? W[i * 3 + 2] : st === 1 ? -W[i * 3 + 2] : 0;
    if (o.plain) near = NONE;
    else if (own) near = own;
    else {
      const cx = Math.floor(x / 10), cz = Math.floor(z / 10), key = (cx + 4096) * 8192 + cz + 4096;
      if (key !== lastKey) { lastKey = key; near = []; for (let a = -1; a <= 1; a++) for (let c = -1; c <= 1; c++) { const q = cells.get((cx + a + 4096) * 8192 + cz + c + 4096); if (q) for (const l of q) near.push(l); } }
    }
    let r = 0, g = 0, bl = 0;
    for (const l of near) {
      const dx = l.x - x, dy = l.y - y, dz = l.z - z, d2 = dx * dx + dy * dy + dz * dz; if (d2 > 110) continue;
      const d = Math.sqrt(d2) || 1, k = 1.5 * l.size / (1 + d2 / 4.5) * Math.max(0.3, (nx * dx + ny * dy + nz * dz) / d), c = l.rgb || LCOL[l.c % LCOL.length];
      r += c[0] * k; g += c[1] * k; bl += c[2] * k;
    }
    lt[i * 4] = r; lt[i * 4 + 1] = g; lt[i * 4 + 2] = bl;
    let bk = 0, bi = 0;
    if (!o.plain) for (const f of fires) {
      const dx = f.x - x, dy = 3.5 - y, dz = f.z - z, d2 = dx * dx + dy * dy + dz * dz; if (d2 > 8000) continue;
      const k = 2 / (1 + d2 / 110) * Math.max(0.25, (nx * dx + ny * dy + nz * dz) / Math.sqrt(d2 + 1e-6));
      if (k > bk) { bk = k; bi = f.i; }
    }
    fr[i * 2] = bi; fr[i * 2 + 1] = bk;
  }
  yield;
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(Pp.slice(0, n * 3), 3)); g.setAttribute('normal', new THREE.BufferAttribute(N.slice(0, n * 3), 3));
  g.setAttribute('color', new THREE.BufferAttribute(b.C.slice(0, n * 3), 3)); g.setAttribute('lt', new THREE.BufferAttribute(lt, 4)); g.setAttribute('fr', new THREE.BufferAttribute(fr, 2));
  g.setIndex(new THREE.BufferAttribute(n > 65535 ? b.I.slice(0, b.ni) : new Uint16Array(b.I.subarray(0, b.ni)), 1));
  yield;
  if (o.floe) yield* floeAttrsGen(g, n, () => o.floe);
  if (n) setBounds(g, Pp, n);
  return g;
}
// the three attributes of a piece's habits (see GLSL_FLOE); pieceOf(i) names the piece vertex i belongs to
export function floeAttrs(g, n, pieceOf) { return drain(floeAttrsGen(g, n, pieceOf)); }
export function* floeAttrsGen(g, n, pieceOf) {
  const fa = new Float32Array(n * 4), fb = new Float32Array(n * 4), fc = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
    if (i % 5000 === 4999) yield;
    const f = pieceOf(i), k = i * 4; if (!f) continue;
    fa[k] = f.cx; fa[k + 1] = f.cz; fa[k + 2] = f.seed; fa[k + 3] = f.ph; fb[k] = f.rock; fb[k + 1] = f.bob; fb[k + 2] = f.swing; fb[k + 3] = f.turn; fc[k] = f.sail; fc[k + 1] = f.len; fc[k + 2] = f.dip; fc[k + 3] = f.eddy;
  }
  g.setAttribute('fa', new THREE.BufferAttribute(fa, 4)); g.setAttribute('fb', new THREE.BufferAttribute(fb, 4)); g.setAttribute('fc', new THREE.BufferAttribute(fc, 4));
  return g;
}
// a mesh of the place's lit material; with o.mirror its flipped twin (the image in the ice) is added to the same group
export function litMesh(b, P, look, o = {}) { return drain(litMeshGen(b, P, look, o)); }
export function* litMeshGen(b, P, look, o = {}) {
  const g = yield* bakeGeoGen(b, P, o), group = new THREE.Group(), m = new THREE.Mesh(g, o.floe ? look.mats.litFloe : look.mats.lit);
  if (o.floe) m.frustumCulled = false;
  group.add(m);
  if (o.mirror) { const mm = new THREE.Mesh(g, look.mats.mirror); mm.scale.y = -1; mm.renderOrder = 0.5; group.add(mm); }
  group.userData.triangles = b.ni / 3 * (o.mirror ? 2 : 1);
  return group;
}

// ================================================================ the ice and what it holds
const _M4 = new THREE.Matrix4(), _M4b = new THREE.Matrix4();
// a fish body: a spindle along +X with a tail fin; top and belly colours; hgt and wid are half sizes at the thickest
function fishInto(b, len, hgt, wid, top, belly, arch, o = {}) {
  const prof = (u) => Math.pow(Math.sin(Math.PI * clamp(u * 0.94 + 0.03, 0, 1)), o.blunt || 0.75);
  b.surf(0);
  b.grid(8, 6, (u, v) => { const a = v * TAU, r = prof(u); return [(u - 0.5) * len, r * hgt * Math.sin(a) + arch * len * 0.5 * Math.sin(Math.PI * u), r * wid * Math.cos(a)]; },
    { colorFn: (u, v) => mix3(belly, top, clamp(Math.sin(v * TAU) * 1.4 + 0.5, 0, 1)) });
  const tx = -len * 0.5, fin = (pts, c) => { b.tri(pts[0], pts[1], pts[2], c); b.tri(pts[0], pts[2], pts[1], c); };
  if (o.flukes) { fin([[tx + len * 0.06, 0, 0], [tx - len * 0.1, 0, len * 0.16], [tx - len * 0.04, 0, 0]], top); fin([[tx + len * 0.06, 0, 0], [tx - len * 0.04, 0, 0], [tx - len * 0.1, 0, -len * 0.16]], top); }
  else fin([[tx + len * 0.05, 0, 0], [tx - len * 0.16, hgt * 1.5, 0], [tx - len * 0.16, -hgt * 1.5, 0]], top);
  if (o.dorsal) fin([[len * 0.02, hgt * 0.9, 0], [-len * 0.12, hgt * 0.9, 0], [-len * 0.1, hgt * 2.1, 0]], top);
}
function* underIceGen(P) {
  const I = P.ice, b = makeBuilder(16384), wk = I.wreck; let cnt = 0;
  for (const f of I.fish) {
    yield;
    b.push(_M4.makeRotationY(f.yaw).setPosition(f.x, f.y, f.z));
    // what the glass holds is seen from some metres over it: each is built a good size and pale against the depth
    if (f.kind === 0) fishInto(b, f.len * 1.35, 0.57, 0.46, [0.27, 0.32, 0.4], [0.78, 0.82, 0.86], f.arch, { flukes: true, dorsal: true, blunt: 0.6 });
    else if (f.kind === 1) fishInto(b, f.len * 1.6, 0.07, 0.58 * f.len, [0.46, 0.37, 0.22], [0.56, 0.48, 0.32], 0, { blunt: 0.5 });
    else fishInto(b, f.len * 1.7, 0.27 * f.len, 0.1 * f.len, [0.42, 0.55, 0.66], [0.9, 0.94, 0.98], f.arch * 0.3, {});
    b.pop();
  }
  for (const e of I.eels) {
    if (++cnt % 8 === 0) yield;
    const pts = [], cy = Math.cos(e.yaw), sy = Math.sin(e.yaw);
    for (let k = 0; k <= 8; k++) { const t = k / 8, lx = (t - 0.5) * e.len * 1.5, lz = Math.sin(t * 7 + e.wig) * e.amp * 1.4; pts.push([e.x + lx * cy + lz * sy, e.y + 0.05 * Math.sin(t * 4 + e.wig), e.z - lx * sy + lz * cy]); }
    b.surf(0).col([0.3, 0.36, 0.2], 0.7, 1.25); b.tube(pts, (t) => 0.08 * (0.35 + 0.65 * Math.sin(Math.PI * Math.min(1, t * 0.85 + 0.12))), 4);
  }
  yield;
  // the sunk wherry on the bed, heeled over, her planks sprung; the seated shape on the stern thwart; the apples
  const by = P.bedY(wk.x, wk.z), L = wk.len, B = 2.3, wood = [0.26, 0.17, 0.1];
  _M4.makeRotationY(wk.yaw).setPosition(wk.x, by + 0.35, wk.z).multiply(_M4b.makeRotationX(wk.heel)); b.push(_M4);
  const half = (u) => B / 2 * Math.pow(Math.max(1 - Math.pow(Math.abs(u * 2 - 1), 2.4), 0), 0.55), sheer = (u) => 0.55 + 0.4 * Math.pow(Math.abs(u * 2 - 1), 2.2);
  b.surf(0).col(wood, 0.6, 1.1);
  for (const sg of [-1, 1]) b.grid(10, 3, (u, v) => [(u - 0.5) * L, lerp(-0.3, sheer(u), v), sg * half(u) * (0.45 + 0.55 * Math.sqrt(v))], { flip: sg < 0, double: true });
  b.col(mul(wood, 0.8), 1, 1); b.grid(10, 1, (u, v) => [(u - 0.5) * L, -0.26, (v * 2 - 1) * half(u) * 0.5], { flip: true });
  // a pale line of rime along each gunwale draws the boat's shape
  for (const sg of [-1, 1]) { const rim = []; for (let k = 0; k <= 10; k++) { const u = k / 10; rim.push([(u - 0.5) * L, sheer(u) + 0.03, sg * half(u)]); } b.col([0.8, 0.82, 0.78], 1, 1); b.tube(rim, 0.07, 4); }
  yield;
  for (const tx of [-0.32, -0.08, 0.2]) { b.col(mul(wood, 1.3), 1, 1); b.box(tx * L - 0.14, 0.32, -half(tx + 0.5) * 0.95, tx * L + 0.14, 0.4, half(tx + 0.5) * 0.95); }
  const sx = -0.32 * L, sz = wk.seatSide * 0.12;
  const plaid = [[0.2, 0.26, 0.2], [0.34, 0.14, 0.13], [0.2, 0.26, 0.2], [0.36, 0.3, 0.2], [0.24, 0.2, 0.22], [0.3, 0.27, 0.25], [0.3, 0.27, 0.25]];
  b.lathe(sx, 0.36, sz, [[0.78, -0.55], [0.7, -0.2], [0.5, 0.12], [0.3, 0.48], [0.36, 0.78], [0.2, 0.98], [0, 1.0]], 9, { smooth: true, colors: plaid });
  b.col([0.3, 0.27, 0.25], 1, 1); b.sphere(sx, 1.46, sz, 0.17, 7, 4); b.col([0.26, 0.22, 0.24], 0.9, 1); b.lathe(sx, 1.36, sz - 0.02, [[0.25, -0.12], [0.24, 0.12], [0.12, 0.3], [0, 0.32]], 7, { smooth: true });
  const red = COL.red;
  yield;
  for (const a of I.apples) {
    if (a.where === 0) continue;
    if (++cnt % 20 === 0) yield;
    b.surf(8, 0, 1).col(mul(red, 1.15 * a.tint), 0.8, 1.2);
    if (a.where === 1) b.sphere(a.lx, 0.0 + Math.abs(a.lz) * 0.25, a.lz * half(a.lx / L + 0.5) * 0.8, a.sz, 5, 3);
    else b.sphere(sx + a.lx * 1.3 + 0.25, 0.62 + Math.abs(a.lz) * 0.2, sz + a.lz * 1.2, a.sz, 5, 3);
  }
  b.pop();
  for (const a of I.apples) { if (a.where !== 0) continue; if (++cnt % 20 === 0) yield; b.surf(8, 0, 1).col(mul(red, 1.15 * a.tint), 0.8, 1.2); b.sphere(a.x, P.bedY(a.x, a.z) + a.sz * 0.9, a.z, a.sz, 5, 3); }
  yield;
  const n = b.nv, g = new THREE.BufferGeometry(), glow = new Float32Array(n); for (let i = 0; i < n; i++) glow[i] = b.W[i * 3] === 8 ? 1 : 0;
  yield;
  g.setAttribute('position', new THREE.BufferAttribute(b.P.slice(0, n * 3), 3)); g.setAttribute('normal', new THREE.BufferAttribute(b.N.slice(0, n * 3), 3));
  yield;
  g.setAttribute('color', new THREE.BufferAttribute(b.C.slice(0, n * 3), 3)); g.setAttribute('glow', new THREE.BufferAttribute(glow, 1));
  g.setIndex(new THREE.BufferAttribute(n > 65535 ? b.I.slice(0, b.ni) : new Uint16Array(b.I.subarray(0, b.ni)), 1));
  yield;
  setBounds(g, b.P, n);
  return g;
}

// the fast sheet: one clear floor over the whole river down to its broken edge (the upstream side of the field's first row)
export function iceSheet(P, look) {
  const Rv = P.river, E = P.sheetEdgeSD, nc = E.length, s0 = -320, sLast = P.places.sT - 14, nr = Math.ceil((sLast - s0) / 12) + 1;
  const pos = new Float32Array((nr + 1) * nc * 3), idx = [];
  for (let i = 0; i <= nr; i++) for (let j = 0; j < nc; j++) {
    const s = i < nr ? lerp(s0, sLast, i / (nr - 1)) : E[j][0], q = Rv.at(s, E[j][1] * 1.02);
    pos.set([q[0], 0, q[1]], (i * nc + j) * 3);
    if (i < nr && j < nc - 1) { const a = i * nc + j, b = a + nc; idx.push(a, a + 1, b, b, a + 1, b + 1); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(idx);
  const m = new THREE.Mesh(g, look.mats.ice); m.renderOrder = 1; m.frustumCulled = false; m.userData.triangles = idx.length / 3;
  return m;
}
// the river's bed under the sheet, and everything the ice holds, drawn before the sheet and without writing depth
export function iceBed(P, look) { return drain(iceBedGen(P, look)); }
export function* iceBedGen(P, look) {
  const Rv = P.river, HW = P.HW, s0 = -320, s1 = P.places.sT + 16, ns = Math.ceil((s1 - s0) / 8), nd = 22, wk = P.ice.wreck;
  const n = (ns + 1) * (nd + 1), pos = new Float32Array(n * 3), col = new Float32Array(n * 3), nor = new Float32Array(n * 3), glow = new Float32Array(n), idx = [];
  for (let i = 0; i <= ns; i++) for (let j = 0; j <= nd; j++) {
    if (j === 0 && i % 10 === 9) yield;
    const q = Rv.at(lerp(s0, s1, i / ns), lerp(-HW - 2, HW + 2, j / nd)), y = P.bedY(q[0], q[1]), k = i * (nd + 1) + j;
    // the bed's own slope gives the normal
    const gx = (P.bedY(q[0] + 0.5, q[1]) - y) * 2, gz = (P.bedY(q[0], q[1] + 0.5) - y) * 2, gl = Math.hypot(gx, 1, gz); nor.set([-gx / gl, 1 / gl, -gz / gl], k * 3);
    const t = 0.5 + 0.5 * Math.sin(q[0] * 0.21 + Math.sin(q[1] * 0.13) * 2.2) * Math.cos(q[1] * 0.17);
    // pale sand in a pool round the wreck, so that the dark hull reads on it
    const wdx = q[0] - wk.x, wdz = q[1] - wk.z, pale = 1 + 2.4 * Math.exp(-(wdx * wdx + wdz * wdz) / 200);
    pos.set([q[0], y, q[1]], k * 3); col.set([(0.2 + 0.1 * t) * pale, (0.2 + 0.06 * t) * pale, (0.15 + 0.03 * t) * pale], k * 3);
    if (i < ns && j < nd) { const a = k, b = k + nd + 1; idx.push(a, a + 1, b, b, a + 1, b + 1); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  yield;
  g.setAttribute('glow', new THREE.BufferAttribute(glow, 1)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); g.setIndex(idx);
  yield;
  const m = new THREE.Mesh(g, look.mats.under); m.renderOrder = -0.8; m.frustumCulled = false; m.userData.triangles = idx.length / 3;
  return m;
}
export function iceHeld(P, look) { return drain(iceHeldGen(P, look)); }
export function* iceHeldGen(P, look) {
  const g = yield* underIceGen(P), m = new THREE.Mesh(g, look.mats.under); m.renderOrder = -0.7; m.frustumCulled = false; m.userData.triangles = g.index.count / 3;
  return m;
}
// the water of the broken reach: it begins exactly under the sheet's broken edge and runs on past the bridge
export function iceWater(P, look) {
  const Rv = P.river, E = P.sheetEdgeSD, nc = E.length, s1 = P.places.sB + 900, y = -0.45, pos = new Float32Array(nc * 6), idx = [];
  for (let j = 0; j < nc; j++) {
    const a = Rv.at(E[j][0] - 0.3, E[j][1] * 1.04), c = Rv.at(s1, E[j][1] * 3.1); pos.set([a[0], y, a[1], c[0], y, c[1]], j * 6);
    if (j < nc - 1) idx.push(j * 2, j * 2 + 2, j * 2 + 1, j * 2 + 1, j * 2 + 2, j * 2 + 3);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(idx);
  const m = new THREE.Mesh(g, look.mats.water); m.frustumCulled = false; m.userData.triangles = idx.length / 3;
  return m;
}

// the floes: every piece of the broken reach (cores, the brash between them, laden floes, slabs, bergs, the small floes
// that sail), each BUILT where it lies: lowered, reared about its own pivot. edge: the sheet's broken edge as world
// points, closed by a face of broken ice down to the water. ed: x = metres in from the rim (on a broken face: how much
// snow), y = 0 a floe's top, 1 brash, 2 a broken face
export function iceFloes(P, look, list, rnd, edge, flow) { return drain(iceFloesGen(P, look, list, rnd, edge, flow)); }
export function* iceFloesGen(P, look, list = P.floes, rnd = P.R.frost, edge = null, flow = P.T.flow) {
  let cnt = 0;
  const pos = [], nor = [], ed = [], idx = [], owner = [], q3 = [0, 0, 0];
  const v = (f, x, y, z, nx, ny, nz, e0, e1) => { pos.push(x, y, z); nor.push(nx, ny, nz); ed.push(e0, e1); owner.push(f); return owner.length - 1; };
  const face = (f, a, b, c, snow) => {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], wx = c[0] - a[0], wy = c[1] - a[1], wz = c[2] - a[2];
    let nx = uy * wz - uz * wy, ny = uz * wx - ux * wz, nz = ux * wy - uy * wx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    const sn = snow < 0 ? clamp((ny - 0.45) * 3, 0, 1) : snow, i = v(f, a[0], a[1], a[2], nx, ny, nz, sn, 2); v(f, b[0], b[1], b[2], nx, ny, nz, sn, 2); v(f, c[0], c[1], c[2], nx, ny, nz, sn, 2);
    idx.push(i, i + 1, i + 2);
  };
  for (const f of list) {
    if (++cnt % 10 === 0) yield;
    const jit = []; for (let k = 0; k < 40; k++) jit.push(rnd());
    let poly = f.poly, area = 0; const n = poly.length, v0 = owner.length;
    for (let k = 0; k < n; k++) { const p = poly[k], q = poly[(k + 1) % n]; area += p[0] * q[1] - q[0] * p[1]; }
    if (area > 0) poly = poly.slice().reverse();
    const berg = f.use === 'berg', brash = f.kind === 'brash', th = f.thick, taper = berg ? 0.3 : 0.08, cx = f.cx, cz = f.cz, mk = f.moundK ?? 1;
    let inR = 1e9; for (let k = 0; k < n; k++) { const p = poly[k], q = poly[(k + 1) % n], ex = q[0] - p[0], ez = q[1] - p[1]; inR = Math.min(inR, Math.abs(ex * (cz - p[1]) - ez * (cx - p[0])) / (Math.hypot(ex, ez) || 1)); }
    const low = poly.map((p) => [lerp(p[0], cx, taper), -th, lerp(p[1], cz, taper)]);
    if (!berg) {
      const c = v(f, cx, 0, cz, 0, 1, 0, inR, brash ? 1 : 0), r0 = owner.length;
      for (const p of poly) v(f, p[0], 0, p[1], 0, 1, 0, 0, brash ? 1 : 0);
      for (let k = 0; k < n; k++) idx.push(c, r0 + k, r0 + (k + 1) % n);
    } else {
      // a berg: a broken mound over the slab, snow on what looked up
      const mid = poly.map((p, k) => [lerp(p[0], cx, 0.42 + 0.1 * jit[k]), (1.2 + 1.9 * jit[k + 17]) * mk, lerp(p[1], cz, 0.42 + 0.1 * jit[k])]), top = [cx, (3.2 + 0.6 * jit[39]) * mk, cz];
      for (let k = 0; k < n; k++) {
        const k2 = (k + 1) % n, a = [poly[k][0], 0, poly[k][1]], b = [poly[k2][0], 0, poly[k2][1]];
        face(f, a, b, mid[k2], -1); face(f, a, mid[k2], mid[k], -1); face(f, top, mid[k], mid[k2], -1);
      }
    }
    for (let k = 0; k < n; k++) {
      const k2 = (k + 1) % n, a = [poly[k][0], 0, poly[k][1]], b = [poly[k2][0], 0, poly[k2][1]];
      face(f, a, low[k], low[k2], 0); face(f, a, low[k2], b, 0);
    }
    if (!brash) for (let k = 1; k < n - 1; k++) face(f, low[0], low[k + 1], low[k], 0);
    // the standing state: reared about its own pivot (a line across the race, under its middle), and lowered
    if (f.rear || f.low) for (let i = v0; i < owner.length; i++) {
      for (const arr of [pos, nor]) {
        const isP = arr === pos; q3[0] = arr[i * 3] - (isP ? cx : 0); q3[1] = arr[i * 3 + 1] + (isP ? f.pivot : 0); q3[2] = arr[i * 3 + 2] - (isP ? cz : 0);
        if (f.rear) turn(q3, -flow[1], 0, flow[0], f.rear);
        arr[i * 3] = q3[0] + (isP ? cx : 0); arr[i * 3 + 1] = q3[1] - (isP ? f.pivot + f.low : 0); arr[i * 3 + 2] = q3[2] + (isP ? cz : 0);
      }
    }
  }
  // the sheet's broken edge: a face of broken ice from its top down under the water, looking down the race
  if (edge) for (let k = 0; k + 1 < edge.length; k++) {
    const a = [edge[k][0], 0, edge[k][1]], b = [edge[k + 1][0], 0, edge[k + 1][1]], a2 = [a[0], -1.1, a[2]], b2 = [b[0], -1.1, b[2]];
    const down = (b[2] - a[2]) * flow[0] - (b[0] - a[0]) * flow[1] > 0;
    if (down) { face(null, a, b, b2, 0); face(null, a, b2, a2, 0); } else { face(null, b, a, a2, 0); face(null, b, a2, b2, 0); }
  }
  yield;
  const nv = owner.length, g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3)); yield;
  g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(nor), 3)); yield;
  g.setAttribute('ed', new THREE.BufferAttribute(new Float32Array(ed), 2)); g.setIndex(new THREE.BufferAttribute(new Uint32Array(idx), 1));
  yield;
  yield* floeAttrsGen(g, nv, (i) => owner[i]);
  yield;
  const m = new THREE.Mesh(g, look.mats.floe); m.frustumCulled = false; m.userData.triangles = idx.length / 3;
  return m;
}
// the apples afloat in the race: half out of the water, each riding its own lane
export function thawApples(P, look) { return drain(thawApplesGen(P, look)); }
export function* thawApplesGen(P, look) {
  const b = makeBuilder(4096), owner = []; let cnt = 0;
  for (const a of P.thawApples) { if (++cnt % 40 === 0) yield; const n0 = b.nv; b.surf(0).col(mul(COL.red, 1.7), 0.8, 1.15); b.sphere(a.cx, -0.4, a.cz, a.sz, 5, 3); for (let i = n0; i < b.nv; i++) owner.push(a); }
  const g = yield* bakeGeoGen(b, P, { plain: true }); yield* floeAttrsGen(g, b.nv, (i) => owner[i]);
  const m = new THREE.Mesh(g, look.mats.litFloe); m.frustumCulled = false; m.userData.triangles = b.ni / 3;
  return m;
}
// ================================================================ fires, glows, smoke
// a sheet of a few stages up its height (smoke bends: one quad would only lean)
const STRIP = (n = 4) => {
  const g = new THREE.InstancedBufferGeometry(), uv = [], idx = [];
  for (let k = 0; k <= n; k++) uv.push(0, k / n, 1, k / n);
  for (let k = 0; k < n; k++) idx.push(2 * k, 2 * k + 1, 2 * k + 2, 2 * k + 1, 2 * k + 3, 2 * k + 2);
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array((n + 1) * 6), 3)); g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uv), 2)); g.setIndex(idx);
  return g;
};
const QUAD = () => { const g = new THREE.InstancedBufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(12), 3)); g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), 2)); g.setIndex([0, 1, 2, 2, 1, 3]); return g; };
const floeRow = (f) => (f ? [f.cx, f.cz, f.seed, f.ph, f.rock, f.bob, f.swing, f.turn, f.sail, f.len, f.dip, f.eddy] : null);
function instFloe(g, items) {
  const n = items.length, fa = new Float32Array(n * 4), fb = new Float32Array(n * 4), fc = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) { const f = items[i].floe; if (!f) continue; const q = floeRow(f), k = i * 4; for (let j = 0; j < 4; j++) { fa[k + j] = q[j]; fb[k + j] = q[4 + j]; fc[k + j] = q[8 + j]; } }
  g.setAttribute('fa', new THREE.InstancedBufferAttribute(fa, 4)); g.setAttribute('fb', new THREE.InstancedBufferAttribute(fb, 4)); g.setAttribute('fc', new THREE.InstancedBufferAttribute(fc, 4));
}
// items: { x, y, z, size, kind, fi, ph, h, col: [r, g, b], floe, mirror }. A group: the sprites, and their doubles in the ice
export function spriteMesh(look, items) {
  const group = new THREE.Group(); let tris = 0;
  for (const mir of [false, true]) {
    const sel = mir ? items.filter((it) => it.mirror && !it.floe) : items, n = sel.length; if (!n) continue;
    const g = QUAD(), sa = new Float32Array(n * 4), sb = new Float32Array(n * 4), sc = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { const it = sel[i], k = i * 4, c = it.col; sa[k] = it.x; sa[k + 1] = it.y; sa[k + 2] = it.z; sa[k + 3] = it.size; sb[k] = it.kind; sb[k + 1] = it.fi || 0; sb[k + 2] = it.ph || 0; sb[k + 3] = it.h || 0; sc[i * 3] = c ? c[0] : 1; sc[i * 3 + 1] = c ? c[1] : 1; sc[i * 3 + 2] = c ? c[2] : 1; }
    g.setAttribute('sa', new THREE.InstancedBufferAttribute(sa, 4)); g.setAttribute('sb', new THREE.InstancedBufferAttribute(sb, 4)); g.setAttribute('sc', new THREE.InstancedBufferAttribute(sc, 3));
    instFloe(g, sel); g.instanceCount = n;
    const m = new THREE.Mesh(g, mir ? look.mats.spriteMirror : look.mats.sprite); m.frustumCulled = false; m.renderOrder = mir ? 0.6 : 4; group.add(m); tris += n * 2;
  }
  group.userData.triangles = tris;
  return group;
}
// the veils of powder snow off the roofs. items: { x, y, z, w, len, lift, ph, fi, fk, warm }
export function veilMesh(look, items) {
  const n = items.length, g = STRIP(3), sa = new Float32Array(n * 4), sb = new Float32Array(n * 4), sc = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) { const it = items[i], k = i * 4; sa[k] = it.x; sa[k + 1] = it.y; sa[k + 2] = it.z; sa[k + 3] = it.w; sb[k] = it.len; sb[k + 1] = it.ph; sb[k + 2] = it.lift; sb[k + 3] = it.fi || 0; sc[k] = it.fk || 0; sc[k + 1] = it.warm || 0; }
  g.setAttribute('sa', new THREE.InstancedBufferAttribute(sa, 4)); g.setAttribute('sb', new THREE.InstancedBufferAttribute(sb, 4)); g.setAttribute('sc', new THREE.InstancedBufferAttribute(sc, 4)); g.instanceCount = n;
  const m = new THREE.Mesh(g, look.mats.veil); m.frustumCulled = false; m.renderOrder = 2; m.userData.triangles = n * 6;
  return m;
}
// items: { x, y, z, w, h, ph, kind, fi, floe }
export function smokeMesh(look, items) {
  const n = items.length, g = STRIP(4), sa = new Float32Array(n * 4), sb = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) { const it = items[i], k = i * 4; sa[k] = it.x; sa[k + 1] = it.y; sa[k + 2] = it.z; sa[k + 3] = it.w; sb[k] = it.h; sb[k + 1] = it.ph; sb[k + 2] = it.kind || 0; sb[k + 3] = it.fi || 0; }
  g.setAttribute('sa', new THREE.InstancedBufferAttribute(sa, 4)); g.setAttribute('sb', new THREE.InstancedBufferAttribute(sb, 4)); instFloe(g, items); g.instanceCount = n;
  const m = new THREE.Mesh(g, look.mats.smoke); m.frustumCulled = false; m.renderOrder = 2; m.userData.triangles = n * 8;
  return m;
}
// a salted bonfire's dressing: tongues of flame, a glow, sparks, frost glittering down through its light, its smoke
export function fireItems(f, r, sprites, smoke) {
  const fl = f.floe || null, mirror = !fl;
  for (let k = 0; k < 7; k++) {
    const a = r.range(0, TAU), d = f.R * 0.55 * Math.sqrt(r()), hk0 = r.range(0.45, 0.85), hk = k === 0 ? 1 : hk0, wk = r.range(1.5, 2.3), ph = r();
    sprites.push({ x: f.x + Math.cos(a) * d * (k ? 1 : 0), y: 0.5, z: f.z + Math.sin(a) * d * (k ? 1 : 0), size: f.R * wk * (k ? 0.8 : 1.15), kind: 1, fi: f.i, ph, h: f.H * hk, floe: fl, mirror });
  }
  sprites.push({ x: f.x, y: f.H * 0.32, z: f.z, size: f.H * 1.4, kind: 0, fi: f.i, ph: r(), h: 1, col: [0.16, 0.16, 0.16], floe: fl, mirror });
  for (let k = 0; k < 18; k++) sprites.push({ x: f.x, y: 1.4, z: f.z, size: r.range(0.16, 0.3), kind: 2, fi: f.i, ph: r(), h: f.H * r.range(1.2, 1.9), floe: fl, mirror: k < 6 && mirror });
  for (let k = 0; k < 30; k++) {
    const a = r.range(0, TAU), d = r.range(3, 12), top = r.range(7, 15), sz = r.range(0.12, 0.2), ph = r();
    if (!fl) sprites.push({ x: f.x + Math.cos(a) * d, y: top, z: f.z + Math.sin(a) * d, size: sz, kind: 3, fi: f.i, ph, h: top - 0.3 });
  }
  smoke.push({ x: f.x, y: f.H * 0.45, z: f.z, w: f.R * 1.3, h: f.H * 4.2, ph: r(), kind: 1, fi: f.i, floe: fl });
  // a fire that burns on a floe: steam stands where the water laps its embers (two wisps at the floe's low rim)
  const sa = r.range(0, TAU), sp1 = r(), sp2 = r();
  if (fl) for (const [da, ph] of [[0, sp1], [2.3, sp2]]) smoke.push({ x: f.x + Math.cos(sa + da) * f.R * 2.2, y: 0, z: f.z + Math.sin(sa + da) * f.R * 2.2, w: 2.4, h: 9, ph, kind: 2, fi: f.i, floe: fl });
}
// the pile itself: cedar and oak logs stacked to a cone, embers at its foot
export function pileInto(b, f, r) {
  const n = 11, wood = [0.2, 0.12, 0.07];
  for (let k = 0; k < n; k++) {
    const a = k / n * TAU + r.range(-0.15, 0.15), rr = f.R * r.range(0.82, 1), th = r.range(0.34, 0.5), top = r.range(3.0, 4.1), lean = r.range(0.05, 0.3);
    b.surf(0).col(wood, 0.7, 1.2);
    b.beam([f.x + Math.cos(a) * rr, 0, f.z + Math.sin(a) * rr], [f.x + Math.cos(a + 2.4) * lean, top, f.z + Math.sin(a + 2.4) * lean], th, th);
  }
  for (let k = 0; k < 5; k++) { const a = r.range(0, TAU), l = f.R * r.range(0.7, 1.1), y = r.range(0.2, 0.5), th = r.range(0.3, 0.42); b.surf(0).col(wood, 0.7, 1.2); b.beam([f.x + Math.cos(a) * l, y, f.z + Math.sin(a) * l], [f.x - Math.cos(a) * l, y, f.z - Math.sin(a) * l], th, th); }
  b.surf(8, 0, 2.2).col([1, 0.42, 0.1], 0.8, 1.2); b.cyl(f.x, 0.05, f.z, f.R * 0.7, f.R * 0.45, 0.7, 8);
}

// ================================================================ the carnival's makers (all write into a Builder, in the world's metres)
const SILK_A = ['#b3202c', '#1f3f9a', '#6a2a9a', '#c9951f', '#1f7a4a'].map(lin), SILK_B = ['#e8dcc0', '#dfe6f0', '#e6cf8a'].map(lin);
const SNOW = [0.8, 0.86, 0.96], GILT = [0.75, 0.52, 0.16], PAINT = ['#243a2c', '#3a2430', '#22304a', '#4a3320'].map(lin);
// a flat quad laid so that it looks up (or down), whichever way its corners were given
export function quadUp(b, p0, p1, p2, p3, up) {
  const ny = (p1[2] - p0[2]) * (p3[0] - p0[0]) - (p1[0] - p0[0]) * (p3[2] - p0[2]);
  if ((ny > 0) === up) b.quad(p0, p1, p2, p3); else b.quad(p1, p0, p3, p2);
}
// a lantern's own body (its glow is a sprite): a small paper drum, lit, under a dark cap
export function lanternInto(b, l) {
  const c = l.rgb || lampColor(l.c), s = 0.2 * l.size + 0.06;
  b.surf(8, 0, 1.6).col(mul(c, 1.2), 0.8, 1.2); b.lathe(l.x, l.y - s, l.z, [[s * 0.55, 0], [s, s * 0.7], [s, s * 1.5], [s * 0.55, s * 2.1]], 6);
  b.surf(0).col([0.05, 0.04, 0.04], 1, 1); b.lathe(l.x, l.y + s * 1.1, l.z, [[s * 0.75, 0], [s * 0.2, s * 0.5], [0.02, s * 1.6]], 5);
}
// one bay of a lantern-hung arcade: four slim posts, an arch to the alley, a canopy with snow on it. Within 2.2 m of its middle.
export function arcadeBayInto(b, bay, r) {
  const { a, b: e, nx, nz, h, first } = bay, D = 1.05, paint = PAINT[bay.lc % PAINT.length], y1 = h - 1.3;
  const A = (t, dep, y) => [lerp(a[0], e[0], t) + nx * dep, y, lerp(a[1], e[1], t) + nz * dep];
  b.surf(0);
  for (const t of first ? [0, 1] : [1]) for (const dep of [-D, D]) { b.col(paint, 0.7, 1.15); b.beam(A(t, dep, 0), A(t, dep, y1), 0.22, 0.22); b.col(GILT, 1, 1); b.beam(A(t, dep, y1), A(t, dep, y1 + 0.16), 0.36, 0.36); }
  // the arch on the alley's side and its twin behind
  for (const dep of [-D, D]) for (let k = 0, ns = dep > 0 ? 6 : 4; k < ns; k++) {
    const t0 = k / ns, t1 = (k + 1) / ns, yA = y1 + Math.sin(Math.PI * t0) * 1.25, yB = y1 + Math.sin(Math.PI * t1) * 1.25;
    b.col(k % 2 ? paint : GILT, 0.9, 1.1); b.beam(A(0.5 - 0.5 * Math.cos(Math.PI * t0), dep, yA), A(0.5 - 0.5 * Math.cos(Math.PI * t1), dep, yB), 0.16, 0.2);
  }
  // the canopy: two slopes of striped cloth, snow lying on them
  const silk = SILK_A[(bay.lc + (bay.side > 0 ? 1 : 3)) % SILK_A.length], ridge = h + 0.85, eave = h - 0.05;
  for (const sg of [-1, 1]) {
    const p0 = A(0, sg * (D + 0.12), eave), p1 = A(1, sg * (D + 0.12), eave), r1 = A(1, 0, ridge), r0 = A(0, 0, ridge);
    b.col(SNOW, 0.75, 1); quadUp(b, p0, p1, r1, r0, true);
    b.col(silk, 0.45, 0.6); quadUp(b, p0, p1, r1, r0, false);
    const u0 = A(0, sg * (D + 0.12), eave - 0.5), u1 = A(1, sg * (D + 0.12), eave - 0.5);
    b.col(silk, 0.6, 0.9); b.quad(u0, u1, p1, p0); b.quad(u1, u0, p0, p1);
  }
  b.col(GILT, 1, 1); b.beam(A(0.5, 0, ridge), A(0.5, 0, ridge + 0.45), 0.1, 0.1);
  // the cord the bay's lantern hangs by
  b.col([0.06, 0.05, 0.05], 1, 1); b.beam(A(0.5, 0, h - 2.3), A(0.5, 0, y1 + 1.25), 0.04, 0.04);
}
// a drinking booth: plank walls open to the front over a counter, a striped awning, kegs, a shelf of lit bottles
export function boothInto(b, bo, r) {
  const w = bo.w, d = bo.d, h = bo.h, silk = SILK_A[bo.cA % SILK_A.length], cream = SILK_B[bo.cA % SILK_B.length], wood = [0.28, 0.17, 0.09];
  b.tr(bo.x, 0, bo.z, bo.yaw);
  b.surf(0).col(wood, 0.6, 1.05);
  b.box(-w / 2, 0, -d / 2, w / 2, h, -d / 2 + 0.12, { top: false }); b.box(-w / 2, 0, -d / 2, -w / 2 + 0.12, h, d / 2, { top: false }); b.box(w / 2 - 0.12, 0, -d / 2, w / 2, h, d / 2, { top: false });
  b.col(mul(wood, 1.25), 0.8, 1.1); b.box(-w / 2, 0, d / 2 - 0.5, w / 2, 1.05, d / 2);
  // inside: a shelf of bottles and a dim warm back wall
  b.surf(8, 0, 0.55).col([0.9, 0.55, 0.25], 1, 1); b.quad([-w / 2 + 0.14, 0.3, -d / 2 + 0.14], [w / 2 - 0.14, 0.3, -d / 2 + 0.14], [w / 2 - 0.14, h - 0.2, -d / 2 + 0.14], [-w / 2 + 0.14, h - 0.2, -d / 2 + 0.14]);
  const nb = 5 + bo.kind * 2;
  for (let k = 0; k < nb; k++) { const x = lerp(-w / 2 + 0.4, w / 2 - 0.4, (k + 0.5) / nb), c = [[0.3, 1, 0.5], [1, 0.6, 0.2], [0.8, 0.3, 1], [1, 0.9, 0.5]][k % 4]; b.surf(8, 0, 1.3).col(c, 0.8, 1.2); b.cyl(x, 1.55, -d / 2 + 0.34, 0.07, 0.05, 0.3, 5); }
  b.surf(0).col(mul(wood, 0.8), 1, 1); b.box(-w / 2 + 0.14, 1.47, -d / 2 + 0.14, w / 2 - 0.14, 1.55, -d / 2 + 0.55);
  // the awning: stripes of silk falling to the front, snow lying on the flat of the roof
  const ns = 6, yF = h - 0.55, zF = d / 2 + 0.3, yB = h + 0.75;
  for (let k = 0; k < ns; k++) {
    const x0 = lerp(-w / 2 - 0.1, w / 2 + 0.1, k / ns), x1 = lerp(-w / 2 - 0.1, w / 2 + 0.1, (k + 1) / ns);
    b.col(k % 2 ? silk : cream, 0.7, 1); b.quad([x0, yF, zF], [x1, yF, zF], [x1, yB, -d / 2 + 0.3], [x0, yB, -d / 2 + 0.3]);
    b.col(k % 2 ? mul(silk, 0.45) : mul(cream, 0.4), 1, 1); b.quad([x1, yF - 0.03, zF], [x0, yF - 0.03, zF], [x0, yB - 0.03, -d / 2 + 0.3], [x1, yB - 0.03, -d / 2 + 0.3]);
    b.col(k % 2 ? silk : cream, 0.6, 0.9); b.tri([x0, yF, zF], [(x0 + x1) / 2, yF - 0.34, zF], [x1, yF, zF]); b.tri([x1, yF, zF], [(x0 + x1) / 2, yF - 0.34, zF], [x0, yF, zF]);
  }
  b.col(SNOW, 0.8, 1); b.quad([-w / 2 - 0.1, yB, -d / 2 + 0.3], [w / 2 + 0.1, yB, -d / 2 + 0.3], [w / 2 + 0.1, yB - 0.25, -d / 2 - 0.12], [-w / 2 - 0.1, yB - 0.25, -d / 2 - 0.12]);
  b.col(wood, 0.8, 1); b.beam([-w / 2, 0, d / 2 + 0.2], [-w / 2, yF, zF], 0.1, 0.1); b.beam([w / 2, 0, d / 2 + 0.2], [w / 2, yF, zF], 0.1, 0.1);
  // kegs by the side, a frosted pennant on a pole
  const sx = bo.kind === 1 ? -1 : 1;
  b.col([0.33, 0.2, 0.1], 0.7, 1.1); b.lathe(sx * (w / 2 - 0.55), 1.05, d / 2 - 0.25, [[0.2, 0], [0.26, 0.25], [0.2, 0.5], [0, 0.5]], 7);
  b.col(GILT, 1, 1); b.beam([sx * w / 2, h, -d / 2 + 0.1], [sx * w / 2, h + 1.4, -d / 2 + 0.1], 0.06, 0.06);
  b.col(silk, 0.9, 1.1); b.tri([sx * w / 2, h + 1.38, -d / 2 + 0.1], [sx * w / 2, h + 0.95, -d / 2 + 0.1], [sx * w / 2 - sx * 0.9, h + 1.1, -d / 2 + 0.16]); b.tri([sx * w / 2, h + 0.95, -d / 2 + 0.1], [sx * w / 2, h + 1.38, -d / 2 + 0.1], [sx * w / 2 - sx * 0.9, h + 1.1, -d / 2 + 0.16]);
  b.pop();
}
// a striped silk pavilion: a round wall, a peaked roof with a scalloped edge, a pole with a stiff pennant; snow on the roof's north
export function pavilionInto(b, pv, r) {
  const R = pv.r, h = pv.h, wallH = h * 0.4, A1 = SILK_A[pv.cA % SILK_A.length], B1 = SILK_B[pv.cB % SILK_B.length], n = 18, open = r.int(0, n - 1);
  const P3 = (k, rad, y) => { const a = k / n * TAU; return [pv.x + Math.cos(a) * rad, y, pv.z + Math.sin(a) * rad]; };
  b.surf(0);
  for (let k = 0; k < n; k++) {
    const c = k % 2 ? A1 : B1, snow = clamp(0.5 + 0.5 * Math.cos(k / n * TAU + 0.6), 0, 1);
    // wall() order: the quad must look outward: at angle a the outward way is (cos a, sin a); going round by +a turns left seen from above
    b.col(k === open ? [0.04, 0.03, 0.03] : c, 0.55, 0.95); b.quad(P3(k + 1, R, 0), P3(k, R, 0), P3(k, R * 1.04, wallH), P3(k + 1, R * 1.04, wallH));
    b.col(mix3(c, SNOW, snow * 0.75), 0.8, 1.05); b.quad(P3(k + 1, R * 1.1, wallH), P3(k, R * 1.1, wallH), P3(k, R * 0.5, wallH + (h - wallH) * 0.45), P3(k + 1, R * 0.5, wallH + (h - wallH) * 0.45));
    b.quad(P3(k + 1, R * 0.5, wallH + (h - wallH) * 0.45), P3(k, R * 0.5, wallH + (h - wallH) * 0.45), P3(k, 0.12, h), P3(k + 1, 0.12, h));
    // the scalloped valance
    b.col(k % 2 ? B1 : A1, 0.6, 0.9); b.tri(P3(k + 1, R * 1.1, wallH), P3(k + 0.5, R * 1.1, wallH - 0.6), P3(k, R * 1.1, wallH)); b.tri(P3(k, R * 1.1, wallH), P3(k + 0.5, R * 1.1, wallH - 0.6), P3(k + 1, R * 1.1, wallH));
  }
  b.col(GILT, 1, 1); b.beam([pv.x, h, pv.z], [pv.x, h + 2.3, pv.z], 0.1, 0.1); b.sphere(pv.x, h + 0.1, pv.z, 0.28, 6, 4);
  const pa = r.range(0, TAU), px = Math.cos(pa), pz = Math.sin(pa);
  b.col(A1, 0.9, 1.1); b.tri([pv.x, h + 2.25, pv.z], [pv.x, h + 1.6, pv.z], [pv.x + px * 1.5, h + 1.85, pv.z + pz * 1.5]); b.tri([pv.x, h + 1.6, pv.z], [pv.x, h + 2.25, pv.z], [pv.x + px * 1.5, h + 1.85, pv.z + pz * 1.5]);
}
// the maze: clipped evergreen walls standing in wooden tubs, snow along their tops
export function* mazeInto(b, P, r) {
  const mz = P.maze, h = mz.h; let cnt = 0;
  for (const [ax, az, bx, bz] of mz.segs) {
    if (++cnt % 12 === 0) yield;
    const l = Math.hypot(bx - ax, bz - az) || 1, tx = (bx - ax) / l, tz = (bz - az) / l, nx = -tz * 0.34, nz = tx * 0.34, g = r.range(0.8, 1.15);
    const c = (t, s, y) => [ax + (bx - ax) * t + nx * s, y, az + (bz - az) * t + nz * s];
    b.surf(0).col([0.3, 0.19, 0.1], 0.7, 1); for (const s of [-1, 1]) quadSide(b, c(0, s * 1.15, 0), c(1, s * 1.15, 0), c(1, s * 1.15, 0.5), c(0, s * 1.15, 0.5), s * nx, s * nz);
    b.col(mul([0.07, 0.2, 0.1], g), 0.6, 1.1); for (const s of [-1, 1]) quadSide(b, c(-0.04, s, 0.5), c(1.04, s, 0.5), c(1.04, s * 0.85, h), c(-0.04, s * 0.85, h), s * nx, s * nz);
    b.col(SNOW, 0.85, 1); quadUp(b, c(-0.04, -0.85, h), c(1.04, -0.85, h), c(1.04, 0.85, h), c(-0.04, 0.85, h), true);
  }
}
// a flat quad laid so that it looks toward (nx, nz)
export function quadSide(b, p0, p1, p2, p3, nx, nz) {
  const ux = p1[0] - p0[0], uy = p1[1] - p0[1], uz = p1[2] - p0[2], vx = p3[0] - p0[0], vy = p3[1] - p0[1], vz = p3[2] - p0[2];
  if ((uy * vz - uz * vy) * nx + (ux * vy - uy * vx) * nz > 0) b.quad(p0, p1, p2, p3); else b.quad(p1, p0, p3, p2);
}
// the balloons: silk globes hanging motionless, each on its cord to a stake in the ice; they take the light of what burns below
const BALLOON = ['#d8342c', '#e8a020', '#2f6fd0', '#8a3fd0', '#2fa860', '#e6d8b0'].map(lin);
export function* balloonsInto(b, P) {
  for (const q of P.balloons) {
    yield;
    const c = BALLOON[q.c % BALLOON.length], n = 10;
    for (let k = 0; k < n; k++) {
      // gores of two shades, a little glow of their own so that they read as lit fruit against the night
      b.surf(8, 0, 0.16).col(k % 2 ? c : mul(c, 0.72), 0.55, 1.15);
      b.lathe(q.x, q.y, q.z, [[0.14 * q.r, -1.3 * q.r], [0.62 * q.r, -0.72 * q.r], [0.95 * q.r, -0.2 * q.r], [q.r, 0.2 * q.r], [0.8 * q.r, 0.66 * q.r], [0.4 * q.r, 0.94 * q.r], [0, q.r]], 1, { smooth: true, arc: TAU / n, start: k / n * TAU });
    }
    b.surf(0).col([0.5, 0.42, 0.3], 1, 1); b.beam([q.stake[0], 0, q.stake[1]], [q.x, q.y - 1.3 * q.r, q.z], 0.06, 0.06);
    b.col([0.25, 0.15, 0.08], 1, 1); b.cbox(q.stake[0], 0, q.stake[1], 0.3, 0.35, 0.3);
  }
}
// the strings of lanterns across the alley, mast to mast
export function* stringsInto(b, P) {
  for (const st of P.strings) {
    yield;
    const pts = []; for (let k = 0; k <= 9; k++) { const t = k / 9; pts.push([lerp(st.a[0], st.b[0], t), st.a[1] - st.sag * 4 * t * (1 - t), lerp(st.a[2], st.b[2], t)]); }
    b.surf(0).col([0.08, 0.06, 0.05], 1, 1); for (let k = 0; k < 9; k++) b.beam(pts[k], pts[k + 1], 0.05, 0.05);
    for (const e of [st.a, st.b]) { b.col(PAINT[1], 0.7, 1.1); b.beam([e[0], 0, e[2]], [e[0], e[1] + 0.3, e[2]], 0.2, 0.2); b.col(GILT, 1, 1); b.sphere(e[0], e[1] + 0.45, e[2], 0.2, 6, 4); }
  }
}
// the court's ground: the silken rope on its gilt posts, the royal pagoda, the players' stand
export function* courtInto(b, P, r) {
  const C = P.court, rope = C.rope, n = rope.length, red = mul(COL.red, 1.25);
  b.surf(0);
  for (let i = 0; i < n; i++) { if (i % 20 === 19) yield; const p = rope[i], q = rope[(i + 1) % n]; b.col(red, 0.8, 1.1); b.beam([p[0], 1.08, p[1]], [(p[0] + q[0]) / 2, 0.96, (p[1] + q[1]) / 2], 0.09, 0.09); b.beam([(p[0] + q[0]) / 2, 0.96, (p[1] + q[1]) / 2], [q[0], 1.08, q[1]], 0.09, 0.09); }
  for (const p of C.posts) { b.col(GILT, 0.6, 1.1); b.cyl(p[0], 0, p[1], 0.1, 0.07, 1.15, 5, { cap: false }); b.sphere(p[0], 1.22, p[1], 0.13, 5, 3); }
  yield;
  const pg = C.pagoda;
  if (pg.ok) {
    b.tr(pg.x, 0, pg.z, pg.yaw);
    let w = pg.w, y = 0.9; const lac = [0.5, 0.06, 0.05], roofC = mix3([0.7, 0.5, 0.16], SNOW, 0.62);
    b.col([0.42, 0.4, 0.42], 0.8, 1); b.cbox(0, 0, 0, w + 2.4, 0.9, w + 2.4); b.col(SNOW, 1, 1); b.cbox(0, 0.9, 0, w + 2.4, 0.04, w + 2.4, { sides: false });
    for (let t = 0; t < pg.tiers; t++) {
      yield;
      const hh = t === 0 ? 4.4 : 3.1, hw = w / 2;
      b.surf(0).col(lac, 0.7, 1.05); for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.cbox(sx * hw * 0.94, y, sz * hw * 0.94, 0.42, hh, 0.42);
      for (const k of [-0.33, 0.33]) for (const sg of [-1, 1]) { b.cbox(k * w, y, sg * hw * 0.94, 0.3, hh, 0.3); b.cbox(sg * hw * 0.94, y, k * w, 0.3, hh, 0.3); }
      // paper walls lit warm from inside, set back behind the columns
      b.surf(8, 0, 0.75).col([1, 0.66, 0.3], 0.75, 1.1); b.cbox(0, y + 0.5, 0, w * 0.8, hh - 0.9, w * 0.8, { top: false });
      b.surf(0).col(GILT, 0.8, 1.1); b.cbox(0, y, 0, w * 0.84, 0.5, w * 0.84, { top: false }); b.cbox(0, y + hh - 0.4, 0, w * 0.98, 0.4, w * 0.98);
      y += hh;
      yield;
      b.col(roofC, 0.85, 1.05); b.sweepRoof(0, 0, w, w, y, 1.9, { overhang: 1.5, lift: 1.1, top: 0.52, style: 0, nu: 6, nv: 3, underColor: mul(lac, 0.6), edgeColor: GILT });
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) { b.surf(8, 0, 1.5).col([1, 0.7, 0.3], 1, 1); b.sphere(sx * (hw + 1.35), y + 0.55, sz * (hw + 1.35), 0.2, 5, 3); }
      y += 1.9; w *= 0.8;
    }
    b.surf(0).col(GILT, 0.8, 1.2); b.lathe(0, y - 0.2, 0, [[w * 0.3, 0], [0.5, 0.7], [0.16, 1.2], [0.42, 1.7], [0.1, 2.4], [0.3, 2.9], [0, 4.2]], 8, { smooth: true });
    b.pop();
  }
  yield;
  const ds = C.dais;
  if (ds.ok) {
    b.tr(ds.x, 0, ds.z, ds.yaw);
    b.surf(0).col([0.3, 0.18, 0.1], 0.7, 1); b.box(-2.5, 0, -1.7, 2.5, 0.6, 1.7);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { b.col(GILT, 0.7, 1.1); b.beam([sx * 2.35, 0.6, sz * 1.55], [sx * 2.35, 3.7, sz * 1.55], 0.14, 0.14); }
    const silk = SILK_A[0];
    for (let k = 0; k < 6; k++) { const x0 = -2.7 + k * 0.9, x1 = x0 + 0.9; b.col(k % 2 ? silk : SILK_B[0], 0.75, 1); b.quad([x0, 3.7, 1.9], [x1, 3.7, 1.9], [x1, 4.9, 0], [x0, 4.9, 0]); b.quad([x1, 3.7, -1.9], [x0, 3.7, -1.9], [x0, 4.9, 0], [x1, 4.9, 0]); }
    // the players' stands and their brass, small and bright
    for (let k = 0; k < 5; k++) { const x = -1.8 + k * 0.9; b.col([0.1, 0.08, 0.08], 1, 1); b.beam([x, 0.6, 0.4], [x, 1.7, 0.4], 0.05, 0.05); b.surf(8, 0, 0.5).col([1, 0.8, 0.35], 1, 1); b.cbox(x, 1.7, 0.4, 0.4, 0.3, 0.04); b.surf(0); }
    b.pop();
  }
}

// ================================================================ the hero alone: a round of the clear ice with what it holds,
// two salted fires and their doubles, a booth, a pavilion and skaters on it
export async function buildHero(ctx, opts = {}) {
  const seed = ctx.seed ?? 1, R = forks(seed), r = R.hero, look = addFxMats(addIceMats(makeLook()));
  const P = { seed, R, fires: [], lanterns: [], density: 1, ice: { fish: [], eels: [], apples: [] } };
  const wk = P.ice.wreck = { x: 5, z: 3, depth: 11.5, yaw: r.range(0, TAU), heel: 0.26, len: 9.2, seatSide: 1 };
  P.bedY = (x, z) => -(6 + (wk.depth - 6) * Math.exp(-((x - wk.x) ** 2 + (z - wk.z) ** 2) / 300));
  P.ice.fish.push({ kind: 0, x: -9, y: -1.8, z: 7, yaw: 0.6, len: 3, arch: 0.3 }, { kind: 1, x: 12, y: -1.1, z: -8, yaw: 2.2, len: 1.2, arch: 0 });
  for (let i = 0; i < 26; i++) { const a = r.range(0, TAU), d = r.range(6, 30); P.ice.fish.push({ kind: 2, x: Math.cos(a) * d, y: -r.range(0.5, 3.2), z: Math.sin(a) * d, yaw: r.range(0, TAU), len: r.range(0.45, 0.9), arch: r.range(-0.3, 0.3) }); }
  for (let i = 0; i < 44; i++) { const a = r.range(0, TAU), d = 5.5 * Math.sqrt(r()); P.ice.eels.push({ x: -14 + Math.cos(a) * d * 1.5, y: -r.range(1, 2), z: -12 + Math.sin(a) * d * 0.8, yaw: 0.4 + r.gauss() * 0.35, len: r.range(1, 1.7), wig: r.range(0, TAU), amp: r.range(0.1, 0.24) }); }
  const cy = Math.cos(wk.yaw), sy = Math.sin(wk.yaw);
  for (let i = 0; i < 360; i++) {
    const t = r(), a = r.range(0, TAU), rad = Math.abs(r.gauss()) * 2.6 + 0.3, lx = r.range(-0.42, 0.42) * wk.len, lz = r.range(-0.7, 0.7), sz = r.range(0.085, 0.12), tint = r.range(0.7, 1.15);
    if (t < 0.22) P.ice.apples.push({ lx, lz, where: 1, sz, tint });
    else if (t < 0.3) P.ice.apples.push({ lx: lx * 0.07, lz: lz * 0.4, where: 2, sz, tint });
    else P.ice.apples.push({ x: wk.x + Math.cos(a) * rad * 1.3 * cy + Math.sin(a) * rad * sy, z: wk.z - Math.cos(a) * rad * 1.3 * sy + Math.sin(a) * rad * cy, where: 0, sz, tint });
  }
  const rf = R.heroFire;
  for (const [x, z] of [[-15, -5], [14, 11]]) P.fires.push({ x, z, s: 0, R: rf.range(2.4, 3), H: rf.range(8, 10), seq: rf.shuffle([0, 1, 2]), per: rf.range(7, 10), ph: rf(), floe: null, i: P.fires.length });
  const booth = { x: -3, z: -17, yaw: 0.2, w: 4, d: 3, h: 3.5, kind: 1, cA: 0 }, pav = { x: 11, z: -14, r: 5, h: 10, cA: 1, cB: 0 };
  P.lanterns.push({ x: booth.x + Math.sin(booth.yaw) * 2, y: 2.8, z: booth.z + Math.cos(booth.yaw) * 2, size: 1, c: 0, floe: null }, { x: pav.x, y: pav.h + 0.3, z: pav.z, size: 1.3, c: 0, floe: null });
  const group = new THREE.Group(), circle = (rad, y, mat, order) => { const g = new THREE.CircleGeometry(rad, 48); g.rotateX(-Math.PI / 2); g.translate(0, y, 0); const m = new THREE.Mesh(g, mat); m.renderOrder = order; return m; };
  // the bed (a dish), what the ice holds, the solids and their doubles, the sheet over all, then fire
  // rings of corners (a fan from the middle would cut straight through the pool the wreck lies in)
  const NR = 14, NS = 40, bn = (NR + 1) * NS, bpos = new Float32Array(bn * 3), bnor = new Float32Array(bn * 3), bc = new Float32Array(bn * 3), bidx = [];
  for (let i = 0; i <= NR; i++) for (let j = 0; j < NS; j++) {
    const rad = 60 * Math.pow(i / NR, 1.3), a = j / NS * TAU, x = Math.cos(a) * rad, z = Math.sin(a) * rad, y = P.bedY(x, z), k = i * NS + j;
    const gx = (P.bedY(x + 0.5, z) - y) * 2, gz = (P.bedY(x, z + 0.5) - y) * 2, gl = Math.hypot(gx, 1, gz), pale = 1 + 2.4 * Math.exp(-((x - wk.x) ** 2 + (z - wk.z) ** 2) / 200);
    bpos.set([x, y, z], k * 3); bnor.set([-gx / gl, 1 / gl, -gz / gl], k * 3); bc.set([0.24 * pale, 0.22 * pale, 0.16 * pale], k * 3);
    if (i < NR) { const k2 = i * NS + (j + 1) % NS; bidx.push(k, k2, k + NS, k2, k2 + NS, k + NS); }
  }
  const bedG = new THREE.BufferGeometry();
  bedG.setAttribute('position', new THREE.BufferAttribute(bpos, 3)); bedG.setAttribute('normal', new THREE.BufferAttribute(bnor, 3)); bedG.setAttribute('color', new THREE.BufferAttribute(bc, 3));
  bedG.setAttribute('glow', new THREE.BufferAttribute(new Float32Array(bn), 1)); bedG.setIndex(bidx);
  const bed = new THREE.Mesh(bedG, look.mats.under); bed.renderOrder = -0.8; bed.frustumCulled = false; group.add(bed, iceHeld(P, look));
  await ctx.yield?.();
  const b = makeBuilder(8192), sprites = [], smoke = [];
  for (const f of P.fires) { pileInto(b, f, R.piles); fireItems(f, R.flames, sprites, smoke); }
  boothInto(b, booth, R.boothDress); pavilionInto(b, pav, R.pavilionDress);
  for (const l of P.lanterns) { lanternInto(b, l); sprites.push({ x: l.x, y: l.y, z: l.z, size: 2.6 * l.size, kind: 0, ph: r(), col: mul(lampColor(l.c), 0.5), mirror: true }); }
  group.add(litMesh(b, P, look, { mirror: true }));
  const figs = [];
  for (let i = 0; i < 14; i++) figs.push({ kind: 1, cx: r.range(-12, 12), cz: r.range(-10, 14), rad: r.range(5, 13), ph: r.range(0, TAU), w: r.range(0.4, 0.9) * r.sign(), ell: r.range(0.6, 1), ori: r.range(0, TAU), scale: r.range(0.92, 1.1), col: r.int(0, 7) });
  for (const f of P.fires) for (let i = 0; i < 9; i++) { const a = r.range(0, TAU), d = f.R + r.range(3.4, 5); figs.push({ kind: 0, cx: f.x + Math.cos(a) * d, cz: f.z + Math.sin(a) * d, rad: 0, ph: Math.atan2(-Math.cos(a), -Math.sin(a)), w: r.range(0.5, 1.2), ell: 1, ori: r.range(0, TAU), scale: r.range(0.9, 1.1), col: r.int(0, 7) }); }
  // one side of the round is the broken reach as it stands: the sheet ends in a broken edge, and beyond it floes lie
  // parted over the yellow water (further apart the further out), rocking on the clock, some reared up as bergs
  const rh = R.heroFloes, HF = [], X0 = 23, NX = 4, NZ = 8, gx = [];
  P.T = { flow: [1, 0] };
  for (let i = 0; i <= NX; i++) { const row = []; for (let j = 0; j <= NZ; j++) { const jx = rh.range(-2.4, 2.4), jz = rh.range(-2.6, 2.6); row.push([X0 + i * 10 + (i ? jx : jx * 0.4), (j - NZ / 2) * 11 + jz]); } gx.push(row); }
  for (let i = 0; i < NX; i++) for (let j = 0; j < NZ; j++) {
    const q = [gx[i][j], gx[i][j + 1], gx[i + 1][j + 1], gx[i + 1][j]], cx = (q[0][0] + q[1][0] + q[2][0] + q[3][0]) / 4, cz = (q[0][1] + q[1][1] + q[2][1] + q[3][1]) / 4;
    const sd = rh(), yw = rh.range(-1, 1), rk = rh.range(0.015, 0.04), berg = rh() < 0.1 && i > 0, rear = rh.range(0.55, 0.95) * rh.sign(), bd = [0, 1, 2, 3].map(() => [rh(), rh.range(-1, 1), rh.range(0.1, 0.28), rh.range(0.9, 1.3), rh()]);
    if (Math.hypot(cx, cz) > 58) continue;
    const inner = q.map((c) => { const l = Math.hypot(cx - c[0], cz - c[1]) || 1, k = Math.min(1.5 / l, 0.5); return [c[0] + (cx - c[0]) * k, c[1] + (cz - c[1]) * k]; });
    // the piece's fixed age (by its distance below the edge) has carried and turned it
    const age = reachAge((cx - X0) * 1.6), a1 = Math.max(age - 22, 0), D = 0.42 * a1 * a1 / (a1 + 45), yaw = yw * 0.11 * smoothstep(22, 150, age);
    const put = (c, c0, c1, th, dr) => { const x = c[0] - c0, z = c[1] - c1, co = Math.cos(th), si = Math.sin(th); return [c0 + dr + x * co - z * si, c1 + x * si + z * co]; };
    HF.push(reachPiece({ kind: 'core', use: berg ? 'berg' : null, cx: cx + D, cz, poly: inner.map((c) => put(c, cx, cz, yaw, D)), seed: sd, rock: berg ? 0.008 : rk, bob: 0.07, swing: yw * 0.03, thick: berg ? 6 : 1.8, rear: berg ? rear : 0, pivot: berg ? 2.6 : 0 }));
    for (let k = 0; k < 4; k++) {
      const k2 = (k + 1) % 4, q4 = [q[k], q[k2], inner[k2], inner[k]], d = bd[k], bx = (q4[0][0] + q4[1][0] + q4[2][0] + q4[3][0]) / 4, bz = (q4[0][1] + q4[1][1] + q4[2][1] + q4[3][1]) / 4;
      if (d[4] < 0.55) continue;
      const Db = D * (0.9 + 0.5 * d[0]);
      HF.push(reachPiece({ kind: 'brash', cx: bx + Db, cz: bz, poly: q4.map((c) => put(c, bx, bz, d[1] * 2.2 * smoothstep(22, 150, age), Db)), thick: 0.9, low: 0.3, seed: d[0], rock: d[2], bob: 0.05, swing: 0.15 * d[1], eddy: 0.3 }));
    }
  }
  // the sheet: the round less the broken side (its edge is the floes' first row)
  const edge = gx[0].map((c) => [c[0], c[1]]), sp = [0, 0, 0], si = [];
  const a0 = Math.atan2(edge[NZ][1], edge[NZ][0]), a1 = Math.atan2(edge[0][1], edge[0][0]) + TAU, ring = [];
  for (let k = 0; k <= 40; k++) { const a = lerp(a0, a1, k / 40); ring.push([Math.cos(a) * 60, Math.sin(a) * 60]); }
  for (const c of [...ring, ...edge]) sp.push(c[0], 0, c[1]);
  for (let k = 1; k < ring.length + edge.length; k++) si.push(0, k + 1, k);
  si.push(0, 1, ring.length + edge.length);
  const sheetG = new THREE.BufferGeometry(); sheetG.setAttribute('position', new THREE.BufferAttribute(new Float32Array(sp), 3)); sheetG.setIndex(si);
  const sheet = new THREE.Mesh(sheetG, look.mats.ice); sheet.renderOrder = 1; sheet.frustumCulled = false;
  const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.BufferAttribute(new Float32Array([21, -0.45, -420, 21, -0.45, 420, 520, -0.45, -420, 520, -0.45, 420]), 3)); wg.setIndex([0, 1, 2, 2, 1, 3]);
  const water = new THREE.Mesh(wg, look.mats.water); water.frustumCulled = false;
  group.add(makeFigures(P, look, figs).object, water, iceFloes(P, look, HF, R.frost, edge, [1, 0]), sheet, smokeMesh(look, smoke), spriteMesh(look, sprites));
  const U = look.U, fc = [0, 0, 0];
  // one standing light for the piece looked at alone: a low warm key and a dusk sky in the ice
  look.setLight(false, { dir: new THREE.Vector3(-0.6, 0.5, 0.4).normalize(), key: [1.2, 0.66, 0.34], fill: [0.17, 0.17, 0.31], ground: [0.1, 0.08, 0.09], fog: [0.42, 0.22, 0.18], fogK: 0.0005, night: 0.8, lamp: 0.9, top: [0.03, 0.03, 0.12], hor: [0.7, 0.3, 0.16], deep: COL.deep });
  // the race runs along +x from the broken edge
  U.uFlow.value.set(1, 0, 0); U.uRiverO.value.set(X0, 0); U.uPortal.value.set(0, -1000, 0, 0);
  const tick = (t) => { U.uTime.value = t; U.uFlow.value.z = t; P.fires.forEach((f, i) => { fireColor(f, t, fc); U.uFire.value[i].set(fc[0], fc[1], fc[2]).multiplyScalar(2.2); U.uFirePos.value[i].set(f.x, 3, f.z, 1); }); };
  tick(0);
  return {
    // the height and the centre keep a viewer that circles between 0.2 heights under the centre and 0.5 over it above the ice
    object: group, radius: 24, height: 40, center: new THREE.Vector3(0, 11, 0), ground: false, anchors: { top: new THREE.Vector3(0, 12, 0), wreck: new THREE.Vector3(wk.x, -wk.depth, wk.z) },
    update(dt, t) { tick(t); },
    dispose() { group.traverse((o) => { if (o.geometry) o.geometry.dispose(); }); for (const k in look.mats) look.mats[k].dispose(); },
  };
}
