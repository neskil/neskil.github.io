// The Isle of Broken Towers: a hawk's flight over a world that is all islands and sea. Down the combe of the mountain island
// at dawn, over the alder village and out between the two harbour cliffs; through the hundred isles in clear day, a gull's
// height over the small boat with the eyes painted on her prow; over open water into a bronze evening; round the tallest
// broken tower of the dragons' isle as the old dragon uncoils from it, rears and breathes fire, and under its lifted wing; and
// out over the shoal in the dusk, along the gold road to the ring standing in the shallows.
//
// Frame: heading 0 looks down -Z; the evening sun stands at azimuth 0, so the last straight flies into it. One draw mirrors the
// whole plan left for right. Places are metres along the route (geometry decides them); the route is tangent arcs and straights.
// DECLARED PACING, two casts and no more:
//   THE BOAT: her station along her own course is a function of the metres flown only (boatStation). She casts off as we
//   come down the wood, runs 58 m before us to the shoal, there loses her way and takes the sand of a bar 170 m short of the
//   ring: WE PASS HER ONCE SHE IS AGROUND, the line 16.6 m over the water there and she 18 m aside of it.
//   THE BOW-RIDERS: two or three dolphins whose place is hers and their own 6.5 to 10 m ahead of her middle and 2.2 to 3 m
//   aside of her, each leaping by its own station; they join her outside the harbour's mouth and leave her at the ruin.
// The old dragon's rise and breath and the two young dragons that pass us are beats by metres flown; everything else runs on
// the clock (the fishing boats, the pods, the gulls, the mist's tongues, the wheeling dragons, the sea).
import * as THREE from 'three';
import { makePath, makeRng, hashSeed, clamp, lerp, smoothstep } from '../kit/core.js';
import { makeSky, makeLightRig, makeCloudField } from '../kit/sky.js';
import * as Water from '../kit/water.js';
import * as S from '../kit/structures.js';
import * as flora from '../kit/flora.js';
import * as F from '../kit/fauna.js';
import * as fx from '../kit/fx.js';
import { buildHero, makeYoungDragons, buildBoat, makeLandMaterial, makeLightUniforms, makeAcc, towerInto, drawTower, wallInto, boxInto, rockInto, birdInto, archInto, hutInto, dryWallInto, tuftInto } from '../parts/isle-of-broken-towers.js';

const TAU = Math.PI * 2, DEG = Math.PI / 180, DUR = 50;
const col3 = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
const mix3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const PAL = { sea: '#1f6f8c', foam: '#e8f4f2', green: '#5f8f4a', tawny: '#c9b27a', stone: '#8a8f98', scale: '#3a3d44', fire: '#ff8a2a', evening: '#f2d9a6' };

// the route in plan: tangent arcs and straights. segs: [{ len, turn }] (turn in degrees, + to the right). Returns stations every
// `step` metres: { x, z, az, s } with the heading az (0 = -Z) and the plan distance s; mir mirrors left for right.
function layRoute(segs, mir, step = 10) {
  const out = []; let x = 0, z = 0, az = 0, s = 0;
  for (const g of segs) {
    const n = Math.max(1, Math.round(g.len / step)), dl = g.len / n, da = (g.turn || 0) * DEG * mir / n;
    for (let i = 0; i < n; i++) { out.push({ x, z, az, s }); const am = az + da / 2; x += Math.sin(am) * dl; z -= Math.cos(am) * dl; az += da; s += dl; }
  }
  out.push({ x, z, az, s });
  return out;
}
// the station of the plan route at plan distance s (straight beyond both ends)
function planAt(R, s, out) {
  const n = R.length - 1, step = R[1].s - R[0].s;
  if (s <= 0) { const a = R[0]; out.x = a.x + Math.sin(a.az) * s; out.z = a.z - Math.cos(a.az) * s; out.az = a.az; return out; }
  if (s >= R[n].s) { const a = R[n], d = s - a.s; out.x = a.x + Math.sin(a.az) * d; out.z = a.z - Math.cos(a.az) * d; out.az = a.az; return out; }
  let i = Math.min(n - 1, Math.floor(s / step)); while (i > 0 && R[i].s > s) i--; while (i < n - 1 && R[i + 1].s <= s) i++;
  const a = R[i], b = R[i + 1], t = (s - a.s) / (b.s - a.s);
  out.x = lerp(a.x, b.x, t); out.z = lerp(a.z, b.z, t); out.az = lerp(a.az, b.az, t);
  return out;
}
// nearest plan station to a point among stations i0..i1: { s, d } with d signed (+ to the right of the heading)
function planNear(R, i0, i1, x, z, out) {
  let best = 1e30, bs = 0, bd = 0;
  for (let i = i0; i < i1; i++) {
    const a = R[i], b = R[i + 1], ex = b.x - a.x, ez = b.z - a.z, el = ex * ex + ez * ez, t = clamp(((x - a.x) * ex + (z - a.z) * ez) / el, 0, 1);
    const px = a.x + ex * t, pz = a.z + ez * t, dd = (x - px) * (x - px) + (z - pz) * (z - pz);
    if (dd < best) { best = dd; bs = lerp(a.s, b.s, t); const l = Math.sqrt(el); bd = ((x - px) * (-ez) + (z - pz) * ex) / l; }
  }
  out.s = bs; out.d = Math.sign(bd || 1) * Math.sqrt(best);
  return out;
}
// a curve through keys [[x, y], ...] with smooth joins (monotone where the keys are)
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

// ---------------------------------------------------------------- the lands
// An island: a coast drawn round its middle by three lobes, a sea cliff of height Hc, land rising to H. A town isle has a low
// shelf on one bearing (town: { a, w }) where its harbour front lies.
const isleRadius = (I, th) => I.R * (1 + I.l1 * Math.sin(th * 2 + I.p1) + I.l2 * Math.sin(th * 3 + I.p2) + I.l3 * Math.sin(th * 5 + I.p3) + (I.rag ? I.rag(th) : 0));
function isleHeight(I, x, z, noise) {
  const dx = x - I.x, dz = z - I.z, r = Math.hypot(dx, dz);
  if (r > I.R * 1.75) return -16;
  const th = Math.atan2(dz, dx), Rt = isleRadius(I, th), q = 1 - r / Rt;
  if (q <= 0) return Math.max(-16, q * Rt * 0.42);
  // the cliff is not one height all round: it stands tall on some bearings and falls to a low shore on others
  const cx = Math.cos(th), sx = Math.sin(th), vary = I.plain ? 1 : 0.42 + 0.9 * smoothstep(-0.55, 0.5, noise.n2(cx * 1.3 + I.ox, sx * 1.3 + I.oz));
  let hc = I.Hc * vary, up = 1;
  const cw = I.cw * (I.plain ? 1 : 1 + 2.2 * (1 - smoothstep(0.5, 1.1, vary)));
  if (I.town) { let da = Math.abs(th - I.town.a); da = Math.min(da, TAU - da); const k = 1 - smoothstep(I.town.w * 0.55, I.town.w, da); hc = lerp(hc, 2.4, k); up = 1 - 0.45 * k; }
  const n = noise.fbm2(x * 0.011 + I.ox, z * 0.011 + I.oz, 3) * 0.5 + 0.5;
  return hc * smoothstep(0, cw, q) + up * (I.H - I.Hc) * Math.pow(q, I.pw) * (0.7 + 0.6 * n) + smoothstep(0.03, 0.2, q) * 2.2 * noise.n2(x * 0.045 + I.ox, z * 0.045);
}
// the mountain island: a mass rising from a sea cliff to its peak, and the combe our way goes down, cut into it along the
// route's first stretch: a floor that falls by places (pasture, the village's shelf, the wood, the cove) between two walls.
// The high pasture is a trough falling 3 degrees for its first 100 m (the sweeping pose looks 40 m ahead of the lens, so line
// and sweeping pose both stay within 5 degrees of level over the first 60 m flown; the steady pose looks 136 m ahead, past the
// lip, and passes 5 degrees from about 39 m flown, 7.2 at 60 m); its lip breaks down to the village's shelf after that.
const FLOOR = [[-240, 170], [-80, 90], [0, 58], [100, 52.76], [134, 45], [158, 42.5], [228, 5], [246, -3], [262, -7], [420, -9]];
const FLOOR_W = [[-80, 8], [0, 9], [96, 18], [120, 32], [142, 38], [166, 32], [186, 16], [200, 14], [240, 30], [300, 30], [345, 36]];
const WALL_K = [[0, 0.62], [150, 0.6], [215, 0.9], [245, 2.2], [330, 2.5]];
// the pasture's apron: beside the floor the ground rises gently (APRON_K) over this width before the combe's walls begin, so
// that herds, walls and huts have ground to stand on; none below the village, where the wood's ravine is narrow
const APRON = [[-80, 12], [0, 26], [110, 28], [170, 22], [196, 0]], APRON_K = 0.13;
function makeMountain(R, iEnd, M, noise) {
  const near = { s: 0, d: 0 };
  const massAt = (x, z) => {
    const dx = x - M.x, dz = z - M.z, r = Math.hypot(dx, dz), th = Math.atan2(dz, dx);
    const Rm = M.Rm * (1 + 0.09 * Math.sin(th * 2 + M.p1) + 0.06 * Math.sin(th * 3 + M.p2) + 0.035 * Math.sin(th * 7 + M.p3)), q = 1 - r / Rm;
    if (q <= 0) return Math.max(-16, q * Rm * 0.3);
    const rg = noise.ridged2(x * 0.0042 + M.ox, z * 0.0042 + M.oz, 4), n = noise.fbm2(x * 0.013, z * 0.013 + M.ox, 3);
    return M.Hc * smoothstep(0, 0.035, q) + (M.Hm - M.Hc) * Math.pow(q, 1.3) * (0.72 + 0.5 * rg) + smoothstep(0.03, 0.15, q) * 5 * n;
  };
  const heightAt = (x, z) => {
    const mass = massAt(x, z);
    if (mass <= -15.9) return mass;
    planNear(R, 0, iEnd, x, z, near);
    // behind the entry the combe's head runs straight back up toward the peak
    const a0 = R[0], back = (x - a0.x) * Math.sin(a0.az) - (z - a0.z) * Math.cos(a0.az);
    const s = back < 0 ? back : near.s, d = back < 0 ? Math.abs((x - a0.x) * Math.cos(a0.az) + (z - a0.z) * Math.sin(a0.az)) : Math.abs(near.d);
    if (s >= R[iEnd].s - 0.5 && d > 60) return mass;
    const w = keyed(FLOOR_W, s), rough = 1 + 0.35 * noise.n2(x * 0.02 + 9, z * 0.02);
    const e = Math.max(0, d - w), ap = Math.max(0, lin(APRON, s));
    const combe = lin(FLOOR, s) + (Math.min(e, ap) * APRON_K + Math.max(0, e - ap) * keyed(WALL_K, s)) * rough + 1.2 * noise.n2(x * 0.06, z * 0.06) * smoothstep(-2, 6, lin(FLOOR, s));
    // a smooth least of the two, so the combe's rims are rounded
    const k = 7, h = Math.max(0, 1 - Math.abs(mass - combe) / k);
    return Math.min(mass, combe) - h * h * k * 0.25;
  };
  return { heightAt, massAt };
}

// colour and material mix of a piece of land from its height, its steepness (ny = the normal's rise) and what grows there
const C_GREEN = col3(PAL.green), C_TAWNY = col3(PAL.tawny), C_ROCK = col3('#7f7c78'), C_SAND = col3('#cdbf9a'), C_DARKGREEN = col3('#3f6a38');
function landLook(h, ny, o, n, out) {
  // o: { rockTone [r,g,b], dry 0..1, terrace 0..1, wood 0..1, top (height of the land) }
  const steep = 1 - smoothstep(0.62, 0.82, ny), shore = (1 - smoothstep(1.2, 3.2, h)) * (1 - steep);
  let c = mix3(C_GREEN, C_TAWNY, clamp(o.dry + 0.5 * (n - 0.5), 0, 1) * 0.75);
  c = mix3(c, C_DARKGREEN, o.wood * 0.6);
  const high = smoothstep(0.6, 0.95, h / Math.max(1, o.top)) * (o.bare ?? 0);
  c = mix3(c, o.rockTone, Math.max(steep, high));
  if (o.ash) c = mix3(c, o.rockTone, o.ash * (0.75 + 0.5 * n));
  c = mix3(c, C_SAND, shore);
  const k = 0.8 + 0.4 * n;
  out.c[0] = c[0] * k; out.c[1] = c[1] * k; out.c[2] = c[2] * k;
  out.rock = Math.max(steep, high); out.ter = o.terrace * (1 - steep) * (1 - shore) * smoothstep(3, 6, h) * (1 - smoothstep(0.75, 0.9, h / Math.max(1, o.top)));
  return out;
}
// an island's mesh into the accumulator: rings from the middle out past the coast (closer together at the cliff)
async function isleInto(ctx, A, I, noise, rings, seg) {
  const id = [], look = { c: [0, 0, 0], rock: 0, ter: 0 }, e = 1.5;
  const ts = []; for (let i = 0; i <= rings; i++) { const f = i / rings; ts.push(1.16 * (1 - Math.pow(1 - f, 1.7))); }
  const hAt = (x, z) => isleHeight(I, x, z, noise);
  for (let i = 0; i <= rings; i++) for (let j = 0; j < seg; j++) {
    const th = j / seg * TAU + (i % 2) * Math.PI / seg, r = ts[i] * isleRadius(I, th), x = I.x + Math.cos(th) * r, z = I.z + Math.sin(th) * r;
    const h = hAt(x, z), gx = (hAt(x + e, z) - h) / e, gz = (hAt(x, z + e) - h) / e, ny = 1 / Math.sqrt(1 + gx * gx + gz * gz);
    landLook(h, ny, I.look, noise.n2(x * 0.03 + I.ox, z * 0.03) * 0.5 + 0.5, look);
    id.push(A.v(x, h, z, look.c, look.rock, look.ter, 0));
    if (j === seg - 1 && i % 4 === 3) await ctx.yield();
  }
  for (let i = 0; i < rings; i++) for (let j = 0; j < seg; j++) {
    const a = id[i * seg + j], b = id[i * seg + (j + 1) % seg], c = id[(i + 1) * seg + j], d = id[(i + 1) * seg + (j + 1) % seg];
    if (i % 2) { A.tri(a, d, c); A.tri(a, b, d); } else { A.tri(a, b, c); A.tri(b, d, c); }
  }
}
// a land's mesh on a grid of lines (xs across, zs along) in a frame turned by az about (ox, oz). Heights first (one reading a
// corner), then each corner's steepness from its neighbours on the grid itself
async function gridLand(ctx, xs, zs, frame, heightAt, lookOf, noise) {
  const A = makeAcc(), look = { c: [0, 0, 0], rock: 0, ter: 0 }, nx = xs.length, nz = zs.length, ca = Math.cos(frame.az), sa = Math.sin(frame.az);
  const H = new Float32Array(nx * nz), PX = new Float32Array(nx * nz), PZ = new Float32Array(nx * nz);
  for (let j = 0; j < nz; j++) {
    for (let i = 0; i < nx; i++) {
      // across is to the right of the heading, along is the heading itself
      const k = j * nx + i; PX[k] = frame.x + xs[i] * ca + zs[j] * sa; PZ[k] = frame.z + xs[i] * sa - zs[j] * ca; H[k] = heightAt(PX[k], PZ[k]);
    }
    if (j % 4 === 3) await ctx.yield();
  }
  for (let j = 0; j < nz; j++) {
    const j0 = Math.max(j - 1, 0), j1 = Math.min(j + 1, nz - 1);
    for (let i = 0; i < nx; i++) {
      const k = j * nx + i, i0 = Math.max(i - 1, 0), i1 = Math.min(i + 1, nx - 1);
      const du = (H[j * nx + i1] - H[j * nx + i0]) / (xs[i1] - xs[i0]), dv = (H[j1 * nx + i] - H[j0 * nx + i]) / (zs[j1] - zs[j0]), ny = 1 / Math.sqrt(1 + du * du + dv * dv);
      landLook(H[k], ny, lookOf(PX[k], PZ[k], H[k]), noise.n2(PX[k] * 0.03, PZ[k] * 0.03) * 0.5 + 0.5, look);
      A.v(PX[k], H[k], PZ[k], look.c, look.rock, look.ter, 0);
    }
    if (j % 16 === 15) await ctx.yield();
  }
  for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) {
    const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1;
    // skip cells wholly on the deep sea bed
    if (H[a] < -15 && H[b] < -15 && H[c] < -15 && H[d] < -15) continue;
    A.tri(a, b, d); A.tri(a, d, c);
  }
  await ctx.yield();
  // the drawn ground's own height at a place (the mesh's faces between its lines; outside the grid, the land's)
  const find = (arr, v) => { let a = 0, b = arr.length - 1; while (b - a > 1) { const m = (a + b) >> 1; if (arr[m] <= v) a = m; else b = m; } return a; };
  const heightOn = (x, z) => {
    const dx = x - frame.x, dz = z - frame.z, u = dx * ca + dz * sa, v = dx * sa - dz * ca;
    if (u < xs[0] || u >= xs[nx - 1] || v < zs[0] || v >= zs[nz - 1]) return heightAt(x, z);
    const i = find(xs, u), j = find(zs, v), fu = (u - xs[i]) / (xs[i + 1] - xs[i]), fv = (v - zs[j]) / (zs[j + 1] - zs[j]), a = j * nx + i, b = a + 1, c = a + nx, d = c + 1;
    return fu >= fv ? H[a] + (H[b] - H[a]) * fu + (H[d] - H[b]) * fv : H[a] + (H[d] - H[c]) * fu + (H[c] - H[a]) * fv;
  };
  return { geo: await A.buildBy(ctx), heightOn };
}

export default {
  id: 'isle-of-broken-towers',
  name: 'The Isle of Broken Towers',
  category: 'books',
  placeKind: 'ocean',
  book: 'A Wizard of Earthsea',
  author: 'Ursula K. Le Guin, 1929 to 2018',
  media: ['air', 'open'],
  weirdness: 0.5,
  async build(ctx) {
    const scene = new THREE.Scene(), noise = ctx.noise, vary = ctx.vary || {}, detail = (ctx.quality && ctx.quality.detail) || 1;
    const dens = clamp(vary.density ?? 1, 0.7, 1.3), hour = vary.hour || 'any', rare = !!vary.rare;
    // FORKS: one stream to a thing, each made from the world's seed and its name, all taken here before any loop runs
    const fk = (name) => makeRng(hashSeed(name + ':' + ctx.seed));
    const R_ = { plan: fk('plan'), mount: fk('mount'), village: fk('village'), woods: fk('woods'), goats: fk('goats'), mist: fk('mist'), isles: fk('isles'), far: fk('far'),
      towns: fk('towns'), boats: fk('boats'), light: fk('light'), birds: fk('birds'), dolph: fk('dolph'), ruin: fk('ruin'), old: fk('old'), young: fk('young'), boat: fk('boat'),
      sky: fk('sky'), cloud: fk('cloud'), ocean: fk('ocean'), weather: fk('weather'), smoke: fk('smoke'),
      shoal: fk('shoal'), skerry: fk('skerry'), fleet: fk('fleet'), pasture: fk('pasture'), yard: fk('yard'), rest: fk('rest'), moor: fk('moor') };
    // the things placed, as data. The world's own placing tests read it further down (stands keeps the drowned stones apart,
    // herds keeps the herds apart, boats.fleet says where two gull flocks fly), so it is part of the deal; the engine reads none of it.
    const measure = { flocks: [], pods: [], puffs: null, stands: [], herds: [], cast: null };

    // ------------------------------------------------------------ THE PLAN: the route by tangent arcs and straights
    const pr = R_.plan, mir = pr.chance(0.5) ? 1 : -1, weave = pr.chance(0.5) ? 1 : -1;
    const c0 = pr.range(9, 14), a1 = pr.range(22, 30), a2 = pr.range(34, 44), a3 = pr.range(26, 34);
    // the dragon's arc: 50 degrees toward the dragon's side at 240 m radius, the pass, 50 degrees back at 220 m, the last straight
    const ARC = 50, R_IN = 240, R_OUT = 220, PASS = 100, ABEAM = 40, OFF = 72, LAST = 70;
    // the high pasture is a straight trough (70 m) before the combe's first bend: we come in level along it
    const segs = [
      { len: 70, turn: 0 }, { len: 80, turn: -c0 }, { len: 160, turn: c0 },
      { len: 150, turn: weave * a1 }, { len: 180, turn: -weave * a2 }, { len: 150, turn: weave * a3 }, { len: 80, turn: weave * (a2 - a1 - a3) },
      { len: 290, turn: 0 },
      { len: R_IN * ARC * DEG, turn: -ARC }, { len: PASS, turn: 0 }, { len: R_OUT * ARC * DEG, turn: ARC }, { len: LAST, turn: 0 },
    ];
    const RT = layRoute(segs, mir), nRT = RT.length - 1, sEnd = RT[nRT].s;
    const dSide = -mir;
    // places in plan metres
    const sQuay = 237, sMouth = 310, sIsles1 = sMouth + 560, sArc0 = sIsles1 + 290, sArc1 = sArc0 + R_IN * ARC * DEG, sAbeam = sArc1 + ABEAM, sPass1 = sArc1 + PASS, sR1 = sEnd - LAST;
    // where the boat takes the sand: on the last arc, 170 m short of the ring (she is passed before the line comes down)
    const sGround = sEnd - 170;
    const iMount = RT.findIndex((q) => q.s >= sMouth + 20);
    const _pl = { x: 0, z: 0, az: 0 };
    // the tallest tower: OFF metres to the dragon's side of the pass straight, abeam ABEAM metres after the arc's end
    planAt(RT, sAbeam, _pl);
    const towerX = _pl.x + dSide * Math.cos(_pl.az) * OFF, towerZ = _pl.z + dSide * Math.sin(_pl.az) * OFF;
    const awayX = dSide * Math.cos(_pl.az), awayZ = dSide * Math.sin(_pl.az), passAz = _pl.az;
    await ctx.yield();

    // ------------------------------------------------------------ THE LANDS
    // the mountain: its peak behind the entry, its coast set so that the sea cliffs end 25 m past the harbour's mouth
    const mr = R_.mount;
    const M = { x: mr.range(-30, 30), z: mr.range(165, 200), Rm: 500, Hm: mr.range(235, 270), Hc: mr.range(31, 37), p1: mr.range(0, TAU), p2: mr.range(0, TAU), p3: mr.range(0, TAU), ox: mr.range(0, 60), oz: mr.range(0, 60) };
    planAt(RT, sMouth + 25, _pl);
    {
      const th = Math.atan2(_pl.z - M.z, _pl.x - M.x);
      M.Rm = Math.hypot(_pl.x - M.x, _pl.z - M.z) / (1 + 0.09 * Math.sin(th * 2 + M.p1) + 0.06 * Math.sin(th * 3 + M.p2) + 0.035 * Math.sin(th * 7 + M.p3));
    }
    const mount = makeMountain(RT, iMount, M, noise);
    await ctx.yield();
    // the isles. Kinds: what each is (its measures are drawn whole before any test of its place)
    const ROCKS = [col3('#8a8378'), col3('#9a8f7c'), col3('#77777a'), col3('#a39680')];
    const KIND = {
      cliff: { R: [46, 68], Hc: [34, 46], up: [8, 20], pw: 0.7, look: { dry: 0.5, terrace: 0, wood: 0.1, bare: 0.5 } },
      town: { R: [82, 108], Hc: [22, 30], up: [26, 40], pw: 0.9, look: { dry: 0.55, terrace: 0.55, wood: 0.15, bare: 0 } },
      terrace: { R: [76, 104], Hc: [22, 30], up: [30, 45], pw: 1.0, look: { dry: 0.7, terrace: 1, wood: 0.05, bare: 0 } },
      light: { R: [44, 58], Hc: [26, 34], up: [6, 12], pw: 0.6, look: { dry: 0.6, terrace: 0, wood: 0.15, bare: 0.2 } },
      wood: { R: [70, 98], Hc: [22, 28], up: [20, 35], pw: 0.9, look: { dry: 0.1, terrace: 0, wood: 1, bare: 0 } },
      far: { R: [60, 190], Hc: [14, 40], up: [14, 80], pw: 1.0, look: { dry: 0.45, terrace: 0.3, wood: 0.4, bare: 0.3 } },
      great: { R: [260, 420], Hc: [30, 50], up: [110, 210], pw: 1.25, look: { dry: 0.4, terrace: 0.2, wood: 0.5, bare: 0.7 } },
      dragon: { R: [150, 150], Hc: [4.5, 5.5], up: [24, 30], pw: 0.8, look: { dry: 0.8, terrace: 0, wood: 0, bare: 0.9 } },
      skerry: { R: [9, 17], Hc: [2.2, 4.2], up: [1.5, 5], pw: 0.8, look: { dry: 0.7, terrace: 0, wood: 0, bare: 1 } },
    };
    const drawIsle = (rng, kind) => {
      const K = KIND[kind], Hc = rng.range(K.Hc[0], K.Hc[1]), big = kind === 'far' || kind === 'great';
      const I = { kind, x: 0, z: 0, R: rng.range(K.R[0], K.R[1]), Hc, H: Hc + rng.range(K.up[0], K.up[1]), cw: big ? 0.07 : 0.045, pw: K.pw,
        l1: rng.range(0.05, 0.16), l2: rng.range(0.03, 0.1), l3: rng.range(0.01, 0.04), p1: rng.range(0, TAU), p2: rng.range(0, TAU), p3: rng.range(0, TAU),
        ox: rng.range(0, 90), oz: rng.range(0, 90), town: null, look: { ...K.look, rockTone: rng.pick(ROCKS), top: 1 }, gap: Hc * rng.range(1, 1.6), turn: rng.range(-0.25, 0.25) };
      I.look.dry = clamp(I.look.dry + rng.range(-0.15, 0.15), 0, 1); I.look.top = I.H;
      // the coast's ragged edge (small bays and points), fixed to the isle
      I.rag = (th) => 0.06 * noise.n2(Math.cos(th) * 2.6 + I.ox, Math.sin(th) * 2.6 + I.oz) + 0.025 * noise.n2(Math.cos(th) * 7 + I.oz, Math.sin(th) * 7 + I.ox);
      if (kind === 'skerry') { I.cw = 0.4; I.look.rockTone = col3('#5d5852'); I.look.ash = 0.7; }
      if (kind === 'dragon') { I.l1 = 0.06; I.l2 = 0.04; I.l3 = 0.02; I.look.rockTone = col3('#77757a'); I.cw = 0.03; I.plain = true; I.look.ash = 0.8; }
      return I;
    };
    // an isle's least gap from the route (shore to line, in plan) over a stretch of stations
    const shoreGap = (I, i0, i1) => {
      let g = 1e30;
      for (let i = Math.max(0, i0); i <= Math.min(nRT, i1); i++) { const q = RT[i], dx = q.x - I.x, dz = q.z - I.z; g = Math.min(g, Math.hypot(dx, dz) - isleRadius(I, Math.atan2(dz, dx))); }
      return g;
    };
    const ir = R_.isles, isles = [], nearIsles = [];
    {
      // near isles: stations every 85 to 115 m of the weave on alternating sides, each shore at 1 to 1.6 of its cliff's height
      // (the first four stations always hold a town, the lighthouse rock, a terraced isle and a cliff)
      const kinds = ir.shuffle(['town', 'light', 'terrace', 'cliff']).concat(ir.shuffle(['wood', 'town', 'cliff']));
      let s = sMouth + ir.range(150, 180), sg = ir.chance(0.5) ? 1 : -1, k = 0;
      while (s < sIsles1 - 30) {
        const I = drawIsle(ir, kinds[k % kinds.length]), step = ir.range(85, 115);
        planAt(RT, s, _pl);
        const rx = Math.cos(_pl.az) * sg, rz = Math.sin(_pl.az) * sg, i0 = Math.round(s / 10) - 30, i1 = Math.round(s / 10) + 30;
        let off = I.gap + I.R;
        for (let it = 0; it < 4; it++) { I.x = _pl.x + rx * off; I.z = _pl.z + rz * off; off += I.gap - shoreGap(I, i0, i1); }
        I.x = _pl.x + rx * off; I.z = _pl.z + rz * off; I.s = s; I.side = sg;
        if (I.kind === 'town') I.town = { a: Math.atan2(-rz, -rx) + I.turn, w: 0.95 };
        isles.push(I); nearIsles.push(I);
        s += step; sg = -sg; k++;
        await ctx.yield();
      }
    }
    await ctx.yield();
    // the dragons' isle: low and bare, its middle 105 m beyond the tallest tower; made smaller until its shore stands 26 m or more
    // off the line all the way round the arc and the pass
    const dragonIsle = drawIsle(R_.ruin, 'dragon');
    dragonIsle.x = towerX + awayX * 105; dragonIsle.z = towerZ + awayZ * 105;
    for (let it = 0; it < 6; it++) { const g = shoreGap(dragonIsle, Math.round(sArc0 / 10) - 6, nRT); if (g < 26) dragonIsle.R -= 26 - g; }
    isles.push(dragonIsle);
    {
      // the isles of the middle distance and the far ones: dealt over the sea the weave crosses, never past the last isle's line
      // (beyond it the sea goes on empty but for the dragons' isle); each is drawn whole, then tested
      const fr = R_.far, mR = M.Rm * 1.12;
      planAt(RT, sIsles1 + 40, _pl);
      const zLast = _pl.z, i1 = Math.round((sIsles1 + 40) / 10);
      const tryIsle = (kind, band0, band1, spanX) => {
        const I = drawIsle(fr, kind), x = fr.range(-spanX, spanX), z = fr.range(zLast, M.z + 500), thin = fr();
        I.x = x; I.z = z;
        // (its gap from the line: read at the seven stations about the one nearest its middle)
        let bi = 0, bd = 1e30; for (let i = 0; i <= i1; i++) { const d2 = (RT[i].x - x) * (RT[i].x - x) + (RT[i].z - z) * (RT[i].z - z); if (d2 < bd) { bd = d2; bi = i; } }
        const g = shoreGap(I, bi - 3, Math.min(i1, bi + 3));
        I.gapLine = g;
        if (g < band0 || g > band1) return false;
        if (Math.hypot(x - M.x, z - M.z) < mR + I.R * 1.2) return false;
        // thinning toward the open water: fewer isles within 300 m of the last line
        if (thin > (z - zLast) / 300 + 0.25) return false;
        for (const J of isles) if (Math.hypot(J.x - x, J.z - z) < (J.R + I.R) * 1.25 + 20) return false;
        isles.push(I);
        return true;
      };
      let n = 0; const nMid = fr.int(8, 11);
      for (let t = 0; t < 300 && n < nMid; t++) { if (tryIsle('far', 120, 260, 600)) n++; if (t % 40 === 39) await ctx.yield(); }
      n = 0;
      for (let t = 0; t < 40 && n < 4; t++) if (tryIsle('great', 700, 1700, 2000)) n++;
      await ctx.yield();
      n = 0;
      for (let t = 0; t < 700 && n < 46; t++) { if (tryIsle('far', 260, 1500, 1700)) n++; if (t % 40 === 39) await ctx.yield(); }
      await ctx.yield();
    }
    // the skerries of the open water between the last isle and the ruin (their own stream, dealt after every isle, so the
    // isles stay as dealt): two or three bare rocks, and one more nearer the ruin that carries a burnt tower's stump and a
    // wreck. Each is drawn whole and stood by a rule that cannot fail on open water: its shore 30 to 60 m from the line.
    const skerries = [];
    {
      const kr = R_.skerry, n = kr.int(2, 3); let sg = kr.chance(0.5) ? 1 : -1;
      for (let k = 0; k <= n; k++) {
        const I = drawIsle(kr, 'skerry'), last = k === n, s = last ? kr.range(sArc0 - 110, sArc0 - 40) : lerp(sIsles1 + 70, sArc0 - 140, (k + kr.range(0.2, 0.8)) / n), gap = kr.range(30, 60);
        if (last) { I.R = Math.max(I.R, 13); I.wreck = true; }
        planAt(RT, s, _pl);
        const rx = Math.cos(_pl.az) * sg, rz = Math.sin(_pl.az) * sg, i0 = Math.round(s / 10) - 14, i1 = Math.round(s / 10) + 14;
        let off = gap + I.R;
        for (let it = 0; it < 4; it++) { I.x = _pl.x + rx * off; I.z = _pl.z + rz * off; off += gap - shoreGap(I, i0, i1); }
        I.x = _pl.x + rx * off; I.z = _pl.z + rz * off; I.s = s; I.side = sg; I.gapLine = shoreGap(I, i0, i1); I.rx = rx; I.rz = rz;
        skerries.push(I); sg = -sg;
      }
    }
    // the land's height anywhere: the mountain, or the isles whose reach covers the place (kept by cells of 240 m)
    const CELL = 240, cells = new Map(), mR2 = (M.Rm * 1.2) ** 2;
    for (const I of isles.concat(skerries)) {
      const r = I.R * 1.75;
      for (let cx = Math.floor((I.x - r) / CELL); cx <= Math.floor((I.x + r) / CELL); cx++) for (let cz = Math.floor((I.z - r) / CELL); cz <= Math.floor((I.z + r) / CELL); cz++) {
        const key = cx * 8192 + cz; if (!cells.has(key)) cells.set(key, []); cells.get(key).push(I);
      }
    }
    await ctx.yield();
    const landH = (x, z) => {
      let h = -16; const list = cells.get(Math.floor(x / CELL) * 8192 + Math.floor(z / CELL));
      if (list) for (let i = 0; i < list.length; i++) { const v = isleHeight(list[i], x, z, noise); if (v > h) h = v; }
      if ((x - M.x) * (x - M.x) + (z - M.z) * (z - M.z) < mR2) { const v = mount.heightAt(x, z); if (v > h) h = v; }
      return h;
    };
    await ctx.yield();

    // ------------------------------------------------------------ THE LINE'S HEIGHTS (after the lands, so that it can be tested on them)
    // heights: 11 m over the combe's floor on the mountain, a gull's height over the sea; 17 m (two masts) over the water where
    // the boat lies aground, so that she is passed below us; then down to the ring's level, level from 84 m before the ring
    const RING_Y = 7.5;
    const HKEY = [[sQuay + 26, 15], [sMouth + 20, 17], [sMouth + 110, 23], [sIsles1 - 230, 20], [sIsles1, 24], [sIsles1 + 150, 17], [sArc0, 21], [sArc1, 22], [sPass1, 22], [sGround - 40, 17], [sGround + 6, 17], [sEnd - 84, RING_Y], [sEnd, RING_Y]];
    let ys = RT.map((q) => (q.s < sQuay + 26 ? Math.max(lin(FLOOR, q.s) + 11, 15) : lin(HKEY, q.s)));
    // CLEARANCE, on this seed's own lands at every station of the line (10 m; the land between is the same slope): the line
    // keeps 9 m over the highest ground within 6 m of it (where there is ground: over the sea its height is the design's),
    // tested before the smoothing and again after it
    const landUnder = (q) => { const rx = Math.cos(q.az) * 6, rz = Math.sin(q.az) * 6, h = Math.max(landH(q.x, q.z), landH(q.x + rx, q.z + rz), landH(q.x - rx, q.z - rz)); return h > 0.5 ? h + 9 : 0; };
    const under = RT.map(landUnder);
    await ctx.yield();
    ys = ys.map((y, i) => Math.max(y, under[i]));
    for (let pass = 0; pass < 3; pass++) ys = ys.map((y, i) => (i === 0 || i === nRT ? y : 0.25 * ys[i - 1] + 0.5 * y + 0.25 * ys[i + 1]));
    ys = ys.map((y, i) => Math.max(y, under[i]));
    const path = makePath(RT.map((q, i) => [q.x, ys[i], q.z]), { samples: 640 }), L = path.length;
    await ctx.yield();
    // plan metres to route metres (the route is a little longer than its plan where it climbs or falls)
    const cum = [0]; for (let i = 1; i <= nRT; i++) cum.push(cum[i - 1] + Math.hypot(RT[i].x - RT[i - 1].x, ys[i] - ys[i - 1], RT[i].z - RT[i - 1].z));
    const mOf = (s) => { const i = clamp(Math.floor(s / sEnd * nRT), 0, nRT - 1); let k = i; while (k > 0 && RT[k].s > s) k--; while (k < nRT - 1 && RT[k + 1].s <= s) k++; return L * lerp(cum[k], cum[k + 1], clamp((s - RT[k].s) / (RT[k + 1].s - RT[k].s), 0, 1)) / cum[nRT]; };
    const mQuay = mOf(sQuay), mMouth = mOf(sMouth), mIsles1 = mOf(sIsles1), mArc0 = mOf(sArc0), mArc1 = mOf(sArc1), mAbeam = mOf(sAbeam), mPass1 = mOf(sPass1), mR1 = mOf(sR1);
    const _rp = new THREE.Vector3();
    await ctx.yield();
    // the line itself at even metres (every 2 m: x, y, z; its last place is the ring itself), kept for the tests that read
    // many places of it
    const LN_N = Math.ceil(L / 2) + 1, LN = new Float32Array(LN_N * 3);
    for (let i = 0; i < LN_N; i++) { path.posAtDist(Math.min(L, i * 2), _rp); LN[i * 3] = _rp.x; LN[i * 3 + 1] = _rp.y; LN[i * 3 + 2] = _rp.z; if (i % 300 === 299) await ctx.yield(); }
    // the least distance of a place from the line between two of its metres (in plan where y is null), and the line's lowest
    // height within a plan distance r of a place (1e9 where no metre of it is so near)
    const lineNear = (x, y, z, m0 = 0, m1 = L) => {
      let b2 = 1e30; const i1 = Math.min(LN_N - 1, Math.ceil(m1 / 2));
      for (let i = Math.max(0, Math.floor(m0 / 2)); i <= i1; i++) { const dx = LN[i * 3] - x, dz = LN[i * 3 + 2] - z, dy = y === null ? 0 : LN[i * 3 + 1] - y, d = dx * dx + dy * dy + dz * dz; if (d < b2) b2 = d; }
      return Math.sqrt(b2);
    };
    const routeDist = lineNear;
    const lineLow = (x, z, r, m0 = 0, m1 = L) => {
      let low = 1e9; const i1 = Math.min(LN_N - 1, Math.ceil(m1 / 2)), r2 = r * r;
      for (let i = Math.max(0, Math.floor(m0 / 2)); i <= i1; i++) { const dx = LN[i * 3] - x, dz = LN[i * 3 + 2] - z; if (dx * dx + dz * dz <= r2 && LN[i * 3 + 1] < low) low = LN[i * 3 + 1]; }
      return low;
    };
    await ctx.yield();

    // ------------------------------------------------------------ THE BOAT'S COURSE (DECLARED PACING): her station by the metres flown
    // She lies at the quay, casts off as we come down the wood, runs 58 m before us through the isles and over the open water,
    // and on the shoal she loses her way and takes the sand of a bar at mGround while we are still 30 m short of her: we pass
    // her once she is aground, two masts over the water. Nothing else hangs on her.
    const mGround = mOf(sGround), mBoat0 = mOf(250), B_M0 = mBoat0 - 150, B_M1 = mBoat0 + 110, B_LEAD = 58, B_MA = mGround - 190, B_MS = mGround - 30;
    const boatStation = (m) => {
      if (m <= B_M0) return mBoat0;
      // she casts off as we come down the wood and gathers way, so that we come up to 58 m behind her outside the mouth
      if (m < B_M1) { const x = (m - B_M0) / (B_M1 - B_M0), k = (B_M1 - B_M0) / (B_M1 + B_LEAD - mBoat0); return mBoat0 + (B_M1 + B_LEAD - mBoat0) * ((3 - k) * x * x + (k - 2) * x * x * x); }
      if (m < B_MA) return m + B_LEAD;
      if (m >= B_MS) return mGround;
      // over the shoal her way falls to nothing: a curve from our pace to rest
      const x = (m - B_MA) / (B_MS - B_MA), k = (B_MS - B_MA) / (mGround - B_MA - B_LEAD);
      return B_MA + B_LEAD + (mGround - B_MA - B_LEAD) * (k * (x - 2 * x * x + x * x * x) + 3 * x * x - 2 * x * x * x);
    };
    // her way: 1 running with us, 0 at rest (the rate of her station by the metres flown)
    const boatWay = (m) => clamp((boatStation(m + 1) - boatStation(m - 1)) / 2, 0, 1);
    const _bp = new THREE.Vector3(), _bt = new THREE.Vector3();
    // her place on the sea at a station: the line's plan shifted 9 m to the dragon's side; round the last arc she cuts inside
    // the line (under it, far before us) to 18 m on the arc's inner side, where the ring lies: so she is before us to the
    // end, and where she takes the ground she and her bar are more than 15 m aside of the line
    const boatAt = (b, out) => {
      path.posAtDist(b, _bp); path.tangentAtDist(b, _bt);
      const l = Math.hypot(_bt.x, _bt.z) || 1, side = lerp(9, -18, smoothstep(mPass1, mGround - 20, b)) * dSide;
      out.set(_bp.x - _bt.z / l * side, 0, _bp.z + _bt.x / l * side);
      return out;
    };
    await ctx.yield();

    // ------------------------------------------------------------ THE LANDS' MESHES (one material: rock, terraces, masonry)
    const U = makeLightUniforms(), landMat = makeLandMaterial(U);
    // (the mountain's ground as it is drawn: read by what stands on the pasture and the shelf)
    let drawnH = landH;
    {
      // the mountain on a grid of lines laid along the entry's heading: 4 m apart about the combe, opening to 45 m far out
      const lines = (a, b, fine0, fine1, step) => {
        const out = [];
        for (let v = fine0; v <= fine1 + 0.01; v += step) out.push(v);
        let d = step, v = fine1; while (v < b) { d = Math.min(45, d * 1.2); v += d; out.push(v); }
        d = step; v = fine0; while (v > a) { d = Math.min(45, d * 1.2); v -= d; out.unshift(v); }
        return out;
      };
      const xs = lines(-M.Rm * 1.2, M.Rm * 1.2, -84, 84, 4), zs = lines(-M.Rm - 220, sMouth + 90, -30, sMouth + 46, 4.5);
      const mLook = { rockTone: col3('#85807a'), dry: 0.2, terrace: 0, wood: 0, top: M.Hm, bare: 0.85 };
      const lookOf = (x, z, h) => {
        // forest on the lower slopes, pasture above it, bare rock toward the peak
        mLook.wood = smoothstep(3, 9, h) * (1 - smoothstep(40, 52, h)) * (0.6 + 0.4 * noise.n2(x * 0.02, z * 0.02));
        mLook.dry = 0.15 + 0.3 * smoothstep(70, 170, h);
        return mLook;
      };
      const land = await gridLand(ctx, xs, zs, { x: RT[0].x, z: RT[0].z, az: RT[0].az }, mount.heightAt, lookOf, noise);
      const mesh = new THREE.Mesh(land.geo, landMat); mesh.name = 'mountain'; scene.add(mesh); drawnH = land.heightOn;
    }
    await ctx.yield();
    {
      // the isles: the near ones and the dragons' isle fine, the middle distance coarser, the far ones a few rings
      const A = makeAcc(), A2 = makeAcc(); let k = 0;
      for (const I of isles) {
        const near = nearIsles.includes(I) || I === dragonIsle, fine = Math.min(1, detail);
        if (near) await isleInto(ctx, A, I, noise, Math.round(30 * fine), Math.round(96 * fine));
        else if (I.kind === 'great') await isleInto(ctx, A2, I, noise, 16, 44);
        else if (I.gapLine < 300) await isleInto(ctx, A2, I, noise, 16, 48);
        else await isleInto(ctx, A2, I, noise, 9, 28);
        if (near || ++k % 3 === 0) await ctx.yield();
      }
      for (const I of skerries) await isleInto(ctx, A, I, noise, 9, 22);
      await ctx.yield();
      const mesh = new THREE.Mesh(await A.buildBy(ctx), landMat); mesh.name = 'isles'; scene.add(mesh);
      await ctx.yield();
      const mesh2 = new THREE.Mesh(await A2.buildBy(ctx), landMat); mesh2.name = 'far-isles'; scene.add(mesh2);
    }
    await ctx.yield();

    // ------------------------------------------------------------ THE SKIES: four lights of one crossing, cross-faded at places
    const sr = R_.sky, sunSide = sr.chance(0.5) ? 1 : -1, night = hour === 'night';
    const squall = R_.weather.chance(0.35) && !night, squallAt = R_.weather.range(0.3, 0.7);
    const SKY = {
      dawn: { o: { preset: 'dawn', sunElevation: 14, sunAzimuth: 180 + sunSide * 32, clouds: { coverage: 0.3 }, lightIntensity: 2.7, ambientIntensity: 2.3 }, fog: 0.0011 },
      morn: { o: { preset: 'day', sunElevation: 30, sunAzimuth: 180 + sunSide * 70, clouds: { coverage: 0.36 } }, fog: 0.0007 },
      day: { o: { preset: 'day', sunElevation: squall ? 28 : 50, sunAzimuth: sunSide * 112, clouds: { coverage: squall ? 0.56 : 0.4 } }, fog: 0.00034 },
      goldA: { o: { preset: 'goldenHour', sunElevation: 9, sunAzimuth: 180 + sunSide * 58 }, fog: 0.0008 },
      goldB: { o: { preset: 'goldenHour', sunElevation: 14, sunAzimuth: sunSide * 96 }, fog: 0.0004 },
      bronze: { o: { preset: 'goldenHour', zenith: '#33507e', mid: '#8791a6', horizon: PAL.evening, scatterColor: '#ffab5c', scatter: 0.95, scatterPow: 3.2, sunElevation: 7, sunAzimuth: 0, sunIntensity: 10,
        sunColor: '#ffc88e', clouds: { coverage: 0.5, lit: '#f8d4a2', shade: '#57566a', silver: 1.6 }, lightColor: '#ffbf80', lightIntensity: 2.7, ambientColor: '#8c9bc2', ambientIntensity: 1.5 }, fog: 0.0006 },
      dusk: { o: { preset: 'sunset', zenith: '#18285e', mid: '#66669e', horizon: '#eab27c', scatterColor: '#ff9a3a', scatter: 1.0, sunElevation: -0.7, sunAzimuth: 0, stars: 0.55, twinkle: 0.4,
        clouds: { coverage: 0.3, lit: '#ff9a5e', shade: '#2e2a52' }, ambientIntensity: 2.6 }, fog: 0.00045 },
      // (one night sky for the whole crossing: its moon low at azimuth 0, so that its road lies on the open water and to the ring)
      nightB: { o: { preset: 'night', bake: true, bakeSize: 256, renderer: ctx.renderer, bodyOverrides: { 0: { elevation: 11, azimuth: 0, size: 2.6 } } }, fog: 0.00045 },
    };
    const SET = { any: ['dawn', 'day', 'bronze', 'dusk'], dawn: ['dawn', 'day', 'bronze', 'dusk'], day: ['morn', 'day', 'bronze', 'dusk'], golden: ['goldA', 'goldB', 'bronze', 'dusk'], night: ['nightB', 'nightB', 'nightB', 'nightB'] }[hour] || ['dawn', 'day', 'bronze', 'dusk'];
    const made = {}, skies = [], fogD = [];
    for (const name of SET) {
      if (!made[name]) { made[name] = makeSky({ rng: sr, transparent: true, ...SKY[name].o }); made[name].setOpacity(0); made[name].object.visible = false; scene.add(made[name].object); await ctx.yield(); }
      skies.push(made[name]); fogD.push(SKY[name].fog);
    }
    const skyList = Object.values(made), Ls = skies.map((s) => Water.waterLight(s)), L_ = Water.waterLight(skies[0]);
    await ctx.yield();
    const rig = makeLightRig(skies[0], { bounce: 0.4 }); scene.add(rig.object);
    scene.fog = new THREE.FogExp2(skies[0].fogColor.clone(), fogD[0]);
    // where the light changes (metres flown): out of the harbour's mouth; where the last isles fall behind; past the dragon
    const FADE = [[mMouth + (hour === 'dawn' ? 200 : 0), mMouth + (hour === 'dawn' ? 380 : 170)], [mIsles1 - 60, mIsles1 + 180], [mAbeam + 40, mAbeam + 230]];
    const skyState = { a: 0, b: 0, t: 0 };
    const skyAt = (m) => {
      let i = 0; while (i < 2 && m >= FADE[i][1]) i++;
      skyState.a = i; skyState.b = i + 1; skyState.t = smoothstep(FADE[i][0], FADE[i][1], m);
      return skyState;
    };
    const blendLight = (o, A, B, t) => {
      o.sunDir.copy(A.sunDir).lerp(B.sunDir, t).normalize(); o.scatDir.copy(A.scatDir).lerp(B.scatDir, t).normalize();
      for (const k of ['sunColor', 'zenith', 'mid', 'horizon', 'scatterColor', 'ambient', 'fogColor', 'cloudLit', 'cloudShade']) o[k].copy(A[k]).lerp(B[k], t);
      o.skyP.copy(A.skyP).lerp(B.skyP, t); o.skyQ.copy(A.skyQ).lerp(B.skyQ, t); o.cloud.copy(A.cloud).lerp(B.cloud, t);
    };
    await ctx.yield();
    // (the route's own box in plan: the cloud field lies about its middle, the sea's depth map about the whole of it)
    let bx0 = 1e9, bx1 = -1e9, bz0 = 1e9, bz1 = -1e9;
    for (const q of RT) { bx0 = Math.min(bx0, q.x); bx1 = Math.max(bx1, q.x); bz0 = Math.min(bz0, q.z); bz1 = Math.max(bz1, q.z); }
    const clouds = makeCloudField({ rng: R_.cloud, sky: skies[0], count: Math.round(15 * (squall ? 1.4 : 1)), puffs: 40, altitude: 520, size: [260, 620], center: [(bx0 + bx1) / 2, 0, (bz0 + bz1) / 2], extent: [3400, 3800] });
    scene.add(clouds.object);
    await ctx.yield();

    // ------------------------------------------------------------ THE SEA: one ocean, its depth from the lands, the shoal at the end
    const endP = path.posAtDist(L, new THREE.Vector3()), endT = new THREE.Vector3(Math.sin(RT[nRT].az), 0, -Math.cos(RT[nRT].az));
    const endR = new THREE.Vector3(-endT.z, 0, endT.x), shoalA = path.posAtDist(mPass1 + 40, new THREE.Vector3());
    // the shoal: all the water from the pass's end about the way to the ring and 400 m beyond it, sand 0.9 to 2.9 m under the keel
    const shoalAt = (x, z) => {
      const ex = endP.x + endT.x * 400 - shoalA.x, ez = endP.z + endT.z * 400 - shoalA.z, t = clamp(((x - shoalA.x) * ex + (z - shoalA.z) * ez) / (ex * ex + ez * ez), 0, 1);
      return 1 - smoothstep(110, 290, Math.hypot(x - shoalA.x - ex * t, z - shoalA.z - ez * t));
    };
    // THE SHOAL IS A PLACE: bars of sand whose crests stand awash, each an ellipse { x, z, a, b (half length and width), ca, sa
    // (its long axis), top (its crest over the still water) } with a ragged waterline; outside it the sand falls 1 m in 8
    const bars = [], sh_ = R_.shoal; let shelf = null;
    // (the waterline's raggedness: the ellipse's measure times 0.62 to 1.38 by the place)
    const barRag = (B, x, z) => 1 + 0.26 * noise.n2(x * 0.07 + B.o, z * 0.07) + 0.12 * noise.n2(x * 0.21, z * 0.21 + B.o);
    const barH = (B, x, z) => {
      const dx = x - B.x, dz = z - B.z, u = dx * B.ca + dz * B.sa, v = dz * B.ca - dx * B.sa;
      const e = 1 - Math.hypot(u / B.a, v / B.b) / barRag(B, x, z);
      return e >= 0 ? B.top * smoothstep(0, 0.45, e) : Math.max(-4, e * B.b * 0.125);
    };
    const addBar = (x, z, a, b, yaw, top) => { const B = { x, z, a, b, ca: Math.cos(yaw), sa: Math.sin(yaw), top, o: bars.length * 7.3, reach: a * 1.4 + 34 }; bars.push(B); return B; };
    // a bar's waterline (sixteen places round it, at 1.4 of its measures: the ragged edge's farthest) against the line in plan
    // (her course over the shoal at even metres, every 3 m of her station: a bar's waterline keeps 10 m from it, a standing
    // thing 6 m and its own radius)
    const laneXZ = []; { const v = new THREE.Vector3(); for (let b = mPass1 - 80; b <= mGround; b += 3) { boatAt(b, v); laneXZ.push(v.x, v.z); } }
    const laneGap = (x, z) => { let b2 = 1e30; for (let i = 0; i < laneXZ.length; i += 2) { const dx = laneXZ[i] - x, dz = laneXZ[i + 1] - z, d = dx * dx + dz * dz; if (d < b2) b2 = d; } return Math.sqrt(b2); };
    const barGap = (x, z, a, b, yaw, m0, m1) => { let g = 1e9; for (let k = 0; k < 16; k++) { const t = k / 16 * TAU, u = Math.cos(t) * a * 1.4, v = Math.sin(t) * b * 1.4; g = Math.min(g, routeDist(x + u * Math.cos(yaw) - v * Math.sin(yaw), null, z + u * Math.sin(yaw) + v * Math.cos(yaw), m0, m1)); } return g; };
    {
      // 1. the bar she takes: across her course and reaching away from the line, its near tip just before her stem where
      // she lies; moved straight out from the line, 2 m at a time, until its waterline keeps 15 m from the line in plan.
      // Under her the shoal is RAISED TO HER DRAUGHT: a shelf of sand 0.58 m under the still water (she draws 0.68 m), a round
      // of 5 m about a place 2 m before her middle where she lies, falling away over 3 m more: she comes onto it in her
      // last five metres, with a third of her way still on her, and her keel takes it
      const pg = boatAt(mGround, new THREE.Vector3()), pg0 = boatAt(mGround - 3, new THREE.Vector3()), hx = pg.x - pg0.x, hz = pg.z - pg0.z, hl = Math.hypot(hx, hz) || 1, ox = dSide * hz / hl, oz = -dSide * hx / hl;
      for (let k = 0; k < 12; k++) {
        const x = pg.x + hx / hl * 9 + ox * (18 + k * 2), z = pg.z + hz / hl * 9 + oz * (18 + k * 2);
        if (k === 11 || barGap(x, z, 20, 6.5, Math.atan2(hx, -hz), mArc0 - 160, L) >= 15.3) { addBar(x, z, 20, 6.5, Math.atan2(hx, -hz), 0.5); break; }
      }
      shelf = { x: pg.x + hx / hl * 2, z: pg.z + hz / hl * 2, ca: hx / hl, sa: hz / hl, a: 5, b: 5, d: 0.58 };
      // 2. the reef's last bar, where the ring stands: its middle 14 m beyond the ring, lying across the way (its sand begins
      // behind the ring's foot: before the ring there is water for its light to lie on), and two horns that come back toward
      // us on either hand (their sand 20 m and more from the line): we fly into its bay
      addBar(endP.x + endT.x * 14, endP.z + endT.z * 14, 36, 9, Math.atan2(endR.z, endR.x), 0.55);
      for (const sd of [-1, 1]) addBar(endP.x - endT.x * 16 + endR.x * 38 * sd, endP.z - endT.z * 16 + endR.z * 38 * sd, 22, 7.5, Math.atan2(endT.z, endT.x) - 0.45 * sd, 0.5);
      // 3. four to six more on both hands of the last arc and the last straight: each drawn whole, then tested (its waterline
      // 15 m or more from the line in plan, open water at its middle, clear of the other bars)
      const want = sh_.int(4, 6);
      for (let k = 0; k < want * 12 && bars.length < 4 + want; k++) {
        const m = sh_.range(mPass1 + 20, L - 70), sd = sh_.chance(0.5) ? 1 : -1, off = sh_.range(30, 125), a = sh_.range(14, 30), b = sh_.range(6, 12), turn = sh_.range(-0.6, 0.6), top = sh_.range(0.3, 0.7);
        path.posAtDist(m, _rp); path.tangentAtDist(m, _bt);
        const l = Math.hypot(_bt.x, _bt.z) || 1, x = _rp.x - _bt.z / l * off * sd, z = _rp.z + _bt.x / l * off * sd, yaw = Math.atan2(_bt.z, _bt.x) + turn;
        if (landH(x, z) > -8 || shoalAt(x, z) < 0.7) continue;
        if (barGap(x, z, a, b, yaw, mArc0 - 160, L) < 15.3) continue;
        { let g = 1e9; for (let j = 0; j < 16; j++) { const t = j / 16 * TAU, u = Math.cos(t) * a * 1.4, v = Math.sin(t) * b * 1.4; g = Math.min(g, laneGap(x + u * Math.cos(yaw) - v * Math.sin(yaw), z + u * Math.sin(yaw) + v * Math.cos(yaw))); } if (g < 10) continue; }
        if (bars.some((B) => Math.hypot(B.x - x, B.z - z) < (B.a + a) * 0.9)) continue;
        addBar(x, z, a, b, yaw, top);
        await ctx.yield();
      }
    }
    await ctx.yield();
    let cx0 = 1e9, cx1 = -1e9, cz0 = 1e9, cz1 = -1e9;
    for (let i = Math.round(210 / 10); i <= iMount; i++) { const q = RT[i]; cx0 = Math.min(cx0, q.x - 80); cx1 = Math.max(cx1, q.x + 80); cz0 = Math.min(cz0, q.z - 80); cz1 = Math.max(cz1, q.z + 80); }
    const landD = (x, z) => {
      let h = -16; const list = cells.get(Math.floor(x / CELL) * 8192 + Math.floor(z / CELL));
      if (list) for (let i = 0; i < list.length; i++) { const v = isleHeight(list[i], x, z, noise); if (v > h) h = v; }
      if ((x - M.x) * (x - M.x) + (z - M.z) * (z - M.z) < mR2) { const v = x > cx0 && x < cx1 && z > cz0 && z < cz1 ? mount.heightAt(x, z) : mount.massAt(x, z); if (v > h) h = v; }
      return h;
    };
    const depthOf = (x, z) => {
      const h = landD(x, z), sh = shoalAt(x, z);
      const deep = h <= -15.9 ? 40 : -h;
      let d = sh > 0 ? Math.min(deep, lerp(40, 1.9 + 1.0 * noise.n2(x * 0.016 + 5, z * 0.05), sh)) : deep;
      for (let i = 0; i < bars.length; i++) { const B = bars[i]; if (Math.abs(x - B.x) < B.reach && Math.abs(z - B.z) < B.reach) { const h = barH(B, x, z); if (-h < d) d = -h; } }
      if (shelf && Math.abs(x - shelf.x) < 16 && Math.abs(z - shelf.z) < 16) { const dx = x - shelf.x, dz = z - shelf.z, e = Math.hypot((dx * shelf.ca + dz * shelf.sa) / shelf.a, (dz * shelf.ca - dx * shelf.sa) / shelf.b); d = Math.min(d, lerp(shelf.d, d, smoothstep(0.8, 1.4, e))); }
      return d;
    };
    const DR = [bx0 - 430, bz0 - 330, bx1 + 430, bz1 + 110], DN = 256, depthGrid = new Float32Array(DN * DN);
    for (let j = 0; j < DN; j++) {
      const z = DR[1] + ((j + 0.5) / DN) * (DR[3] - DR[1]);
      for (let i = 0; i < DN; i++) depthGrid[j * DN + i] = depthOf(DR[0] + ((i + 0.5) / DN) * (DR[2] - DR[0]), z);
      if (j % 8 === 7) await ctx.yield();
    }
    const depthAt = (x, z) => depthGrid[clamp(Math.round((z - DR[1]) / (DR[3] - DR[1]) * DN - 0.5), 0, DN - 1) * DN + clamp(Math.round((x - DR[0]) / (DR[2] - DR[0]) * DN - 0.5), 0, DN - 1)];
    const SHALLOW_DAY = new THREE.Color('#46cdb8'), SHALLOW_SAND = new THREE.Color('#f0e4c0'), SHORE_DAMP = 0.35, SHOAL_D = 7;
    const ocean = Water.makeOcean({ rng: R_.ocean, light: L_, preset: 'breeze', height: squall ? 0.9 : 0.7, foam: squall ? 0.4 : 0.26, deep: '#12597a', shallowColor: SHALLOW_DAY,
      windAngle: -Math.PI / 2 + R_.ocean.range(-0.4, 0.4), radius: 3600, depthAt, depthRect: DR, depthRes: DN, shoalDepth: SHOAL_D, shoalWidth: 26, shoreDamp: SHORE_DAMP });
    scene.add(ocean.object);
    // the sea's height where a thing floats: the kit's waves scaled by the damping the drawn sea shows at that place (its
    // shader's own: mix(shoreDamp, 1, smoothstep(0, 1, depth / shoalDepth)), the depth read between the same map's cells)
    const depthLin = (x, z) => {
      const fx = clamp((x - DR[0]) / (DR[2] - DR[0]) * DN - 0.5, 0, DN - 1.001), fz = clamp((z - DR[1]) / (DR[3] - DR[1]) * DN - 0.5, 0, DN - 1.001), i = Math.floor(fx), j = Math.floor(fz), tx = fx - i, tz = fz - j, k = j * DN + i;
      return lerp(lerp(depthGrid[k], depthGrid[k + 1], tx), lerp(depthGrid[k + DN], depthGrid[k + DN + 1], tx), tz);
    };
    const seaDamp = (x, z) => lerp(SHORE_DAMP, 1, smoothstep(0, 1, depthLin(x, z) / SHOAL_D));
    const seaAt = (x, z, time) => ocean.heightAt(x, z, time) * seaDamp(x, z);
    await ctx.yield();

    // ------------------------------------------------------------ WHAT STANDS IN THE SEA (one mesh): the shoal's sand and reef,
    // the old town's drowned stones, sea birds at rest. Every standing thing is drawn whole, then tested: 15 m or more (and
    // its own radius) from the line in plan, over the route's whole last part; nothing stands between us and the ring.
    const landMat2 = makeLandMaterial(U, true), seaA = makeAcc(), surf = [];
    const standOK = (x, z, r, m0 = mArc0 - 160, m1 = L) => routeDist(x, null, z, m0, m1) >= 15.3 + r && laneGap(x, z) >= 6 + r;
    const bedAt = (x, z) => -depthOf(x, z);
    const ROCK_C = col3('#55504c'), STONE_C = col3('#777b84'), SAND_C = [C_SAND[0] * 1.95, C_SAND[1] * 1.85, C_SAND[2] * 1.62];
    const lumps = (rng, n = 7) => { const a = []; for (let i = 0; i < n; i++) a.push(rng()); return a; };
    {
      const A = seaA, rs = R_.rest;
      // the bars' sand: rings out of each bar's middle to a little under the water, rippled
      for (const B of bars) {
        const rings = 9, seg = 36, id = [];
        for (let i = 0; i <= rings; i++) for (let j = 0; j < seg; j++) {
          const t = i / rings * 1.5, a = j / seg * TAU + (i % 2) * Math.PI / seg, u = Math.cos(a) * B.a * t, v = Math.sin(a) * B.b * t;
          const x = B.x + u * B.ca - v * B.sa, z = B.z + u * B.sa + v * B.ca, h = Math.max(-0.9, barH(B, x, z)), k = 0.86 + 0.28 * noise.n2(x * 0.3, z * 0.3);
          id.push(A.v(x, h + 0.05 * noise.n2(x * 0.9, z * 0.9), z, [SAND_C[0] * k, SAND_C[1] * k, SAND_C[2] * k], 0, 0, 0));
        }
        for (let i = 0; i < rings; i++) for (let j = 0; j < seg; j++) {
          const a = id[i * seg + j], b = id[i * seg + (j + 1) % seg], c = id[(i + 1) * seg + j], d = id[(i + 1) * seg + (j + 1) % seg];
          if (i % 2) { A.tri(a, d, c); A.tri(a, b, d); } else { A.tri(a, b, c); A.tri(b, d, c); }
        }
      }
      await ctx.yield();
      // the reef: rocks on the bars (most on the ring's bar and its horns), each with a chance of a bird at rest on it
      const rock = (rng, x, z, r, h, lump, turn, bird, yawB, sB) => {
        if (!standOK(x, z, r * 1.2)) return;
        const y = Math.max(-0.5, bedAt(x, z)) - 0.1;
        rockInto(A, { x, y, z, r, h, lump, turn, c: ROCK_C }); surf.push([x, z, r * 1.15]); measure.stands.push({ x, z, r: r * 1.2, kind: 'rock' });
        if (bird) birdInto(A, x, y + h * 1.0, z, yawB, sB);
      };
      for (let bi = 0; bi < bars.length; bi++) {
        const B = bars[bi], n = bi >= 1 && bi <= 3 ? sh_.int(5, 8) : sh_.int(2, 4);
        for (let k = 0; k < n; k++) {
          const fu = sh_.range(-0.95, 0.95), fv = sh_.range(-0.8, 0.8), r = sh_.range(1.2, 3.3), h = sh_.range(0.9, 2.7), lump = lumps(sh_), turn = sh_.range(0, TAU);
          const bird = rs.chance(0.55), yawB = rs.range(0, TAU), sB = rs.range(1.6, 2.2);
          rock(sh_, B.x + fu * B.a * B.ca - fv * B.b * B.sa, B.z + fu * B.a * B.sa + fv * B.b * B.ca, r, h, lump, turn, bird, yawB, sB);
        }
        // and birds standing on the sand of its crest
        for (let k = rs.int(1, 4); k > 0; k--) {
          const fu = rs.range(-0.6, 0.6), fv = rs.range(-0.45, 0.45), yawB = rs.range(0, TAU), sB = rs.range(1.6, 2.2), x = B.x + fu * B.a * B.ca - fv * B.b * B.sa, z = B.z + fu * B.a * B.sa + fv * B.b * B.ca;
          if (standOK(x, z, 0.5) && barH(B, x, z) > 0.1) birdInto(A, x, barH(B, x, z) + 0.03, z, yawB, sB);
        }
      }
      await ctx.yield();
      // the old town's drowned stones on both hands of the last arc: two stumps of towers, three wall ends, one broken arch
      const place = (m, sd, off, out) => { path.posAtDist(m, _rp); path.tangentAtDist(m, _bt); const l = Math.hypot(_bt.x, _bt.z) || 1; out[0] = _rp.x - _bt.z / l * off * sd; out[1] = _rp.z + _bt.x / l * off * sd; out[2] = Math.atan2(_bt.z, _bt.x); return out; };
      const q = [0, 0, 0], open = (x, z) => landH(x, z) < -8 && shoalAt(x, z) > 0.5;
      for (let k = 0, n = 0; k < 40 && n < 2; k++) {
        const T = drawTower(sh_, sh_.range(8, 13)); place(sh_.range(mPass1 + 10, L - 110), sh_.chance(0.5) ? 1 : -1, sh_.range(24, 85), q);
        if (!open(q[0], q[1]) || !standOK(q[0], q[1], T.r0 * 1.2) || measure.stands.some((o) => o.kind !== 'rock' && Math.hypot(o.x - q[0], o.z - q[1]) < 22)) continue;
        towerInto(A, { ...T, x: q[0], z: q[1], base: Math.min(-1.5, bedAt(q[0], q[1])) - 1.2, c: STONE_C }); surf.push([q[0], q[1], T.r0 * 1.2]); measure.stands.push({ x: q[0], z: q[1], r: T.r0 * 1.2, kind: 'stump' }); n++;
      }
      for (let k = 0, n = 0; k < 60 && n < 3; k++) {
        const w = sh_.range(5, 9), ya = sh_.range(0, TAU), hh = sh_.range(5, 8); place(sh_.range(mPass1 + 10, L - 100), sh_.chance(0.5) ? 1 : -1, sh_.range(22, 90), q);
        const cx = Math.cos(ya) * w, cz = Math.sin(ya) * w;
        if (!open(q[0], q[1]) || !standOK(q[0] + cx * 0.5 - cz * 0.5, q[1] + cz * 0.5 + cx * 0.5, w * 1.1) || measure.stands.some((o) => o.kind !== 'rock' && Math.hypot(o.x - q[0], o.z - q[1]) < 20)) continue;
        wallInto(A, sh_, q[0], q[1], q[0] + cx, q[1] + cz, bedAt, hh, STONE_C); wallInto(A, sh_, q[0] + cx, q[1] + cz, q[0] + cx - cz, q[1] + cz + cx, bedAt, hh, STONE_C);
        measure.stands.push({ x: q[0] + cx * 0.5 - cz * 0.5, z: q[1] + cz * 0.5 + cx * 0.5, r: w * 1.1, kind: 'wall' }); n++;
      }
      for (let k = 0, n = 0; k < 40 && n < 1; k++) {
        const span = sh_.range(5, 7), h = sh_.range(4.5, 6), yaw = sh_.range(0, TAU), lie = []; for (let j = sh_.int(3, 4); j > 0; j--) lie.push([sh_.range(-0.3, 0.3) * span, sh_.range(-2.5, 2.5), sh_.range(0, TAU), sh_.range(-0.5, 0.5)]);
        place(sh_.range(mPass1 + 30, L - 100), sh_.chance(0.5) ? 1 : -1, sh_.range(22, 60), q);
        if (!open(q[0], q[1]) || !standOK(q[0], q[1], span * 0.5 + 2.6) || measure.stands.some((o) => o.kind !== 'rock' && Math.hypot(o.x - q[0], o.z - q[1]) < 20)) continue;
        archInto(A, { x: q[0], z: q[1], base: Math.min(-1.2, bedAt(q[0], q[1])), yaw, span, h: h + 1.6, c: STONE_C, lie });
        surf.push([q[0] + Math.cos(yaw) * span / 2, q[1] - Math.sin(yaw) * span / 2, 2], [q[0] - Math.cos(yaw) * span / 2, q[1] + Math.sin(yaw) * span / 2, 2]); measure.stands.push({ x: q[0], z: q[1], r: span * 0.5 + 2.6, kind: 'arch' }); n++;
      }
      await ctx.yield();
      // the skerries: sea birds at rest on each; on the one nearest the ruin a burnt tower's stump on its highest ground and
      // a boat's charred ribs and mast on its shore away from the line
      const CHAR = [0.04, 0.036, 0.034], kr = R_.skerry;
      for (const I of skerries) {
        for (let k = rs.int(3, 6); k > 0; k--) {
          const a = rs.range(0, TAU), rr = rs.range(0.1, 0.6) * I.R, yawB = rs.range(0, TAU), sB = rs.range(1.6, 2.2), x = I.x + Math.cos(a) * rr, z = I.z + Math.sin(a) * rr, h = isleHeight(I, x, z, noise);
          if (h > 1.2) birdInto(A, x, h + 0.02, z, yawB, sB);
        }
        measure.stands.push({ x: I.x, z: I.z, r: I.R * 1.25, kind: 'skerry', gap: I.gapLine });
        if (!I.wreck) continue;
        const T = drawTower(kr, kr.range(8, 12)), wa = Math.atan2(I.rz, I.rx) + kr.range(-1.1, 1.1), lean = kr.range(0.3, 0.55) * kr.sign(), wy = kr.range(0, TAU);
        let bx = I.x, bz = I.z, bh = -1e9;
        for (let k = 0; k < 9; k++) { const x = I.x + (k % 3 - 1) * I.R * 0.2, z = I.z + (Math.floor(k / 3) - 1) * I.R * 0.2, h = isleHeight(I, x, z, noise); if (h > bh) { bh = h; bx = x; bz = z; } }
        towerInto(A, { ...T, x: bx, z: bz, base: bh - 1.6, c: [STONE_C[0] * 0.55, STONE_C[1] * 0.52, STONE_C[2] * 0.5] });
        // the wreck lies where the rock's shore is, on the bearing wa from its middle
        let rr = I.R * 0.5; while (rr < I.R * 1.3 && isleHeight(I, I.x + Math.cos(wa) * rr, I.z + Math.sin(wa) * rr, noise) > 0.5) rr += 0.5;
        const wx = I.x + Math.cos(wa) * rr, wz = I.z + Math.sin(wa) * rr, cw = Math.cos(wy), sw = Math.sin(wy), along = (l, o) => [wx + l * cw + o * sw, wz - l * sw + o * cw];
        boxInto(A, wx, 0.25, wz, 3.6, 0.16, 0.18, wy, 0, CHAR);
        for (let k = 0; k < 5; k++) for (const sd of [-1, 1]) { const [qx, qz] = along(-2.6 + k * 1.3, sd * 0.75); boxInto(A, qx, 0.75, qz, 0.07, 0.62, 0.07, wy, sd * 0.5, CHAR); }
        { const [qx, qz] = along(0.6, 0); boxInto(A, qx, 3.0, qz, 0.11, 3.1, 0.11, wy, lean, CHAR); const [yx, yz] = along(0.6, -Math.sin(lean) * 2.4); boxInto(A, yx, 3.0 + Math.cos(lean) * 2.4, yz, 1.5, 0.07, 0.07, wy, lean, CHAR); }
        { const [qx, qz] = along(3.7, 0); boxInto(A, qx, 0.9, qz, 0.1, 0.8, 0.1, wy, 0, CHAR); }
      }
    }
    await ctx.yield();
    { const mesh = new THREE.Mesh(await seaA.buildBy(ctx), landMat2); mesh.name = 'sea-things'; scene.add(mesh); }
    await ctx.yield();
    // SURF where the sea breaks on them: a band of foam round every bar's waterline, every rock and stone standing in the
    // shallows and every skerry (one mesh, one shader: sets of foam washing in toward the thing on the clock; it lies a hand
    // over the still water, so the swell covers and uncovers it), and THE RING'S LIGHT lying long on the water before it
    {
      const pos = [], uv = [], idx = [];
      const loop = (pts, wOut, wIn) => {
        let cx = 0, cz = 0; for (const q of pts) { cx += q[0] / pts.length; cz += q[1] / pts.length; }
        const i0 = pos.length / 3; let run = 0;
        for (let i = 0; i <= pts.length; i++) {
          const q = pts[i % pts.length], pq = pts[(i + pts.length - 1) % pts.length], dx = q[0] - cx, dz = q[1] - cz, l = Math.hypot(dx, dz) || 1;
          if (i) run += Math.hypot(q[0] - pq[0], q[1] - pq[1]);
          pos.push(q[0] + dx / l * wOut, 0.13, q[1] + dz / l * wOut, q[0] - dx / l * wIn, 0.13, q[1] - dz / l * wIn); uv.push(run / 5, 0, run / 5, 1);
          if (i) { const a2 = i0 + (i - 1) * 2; idx.push(a2, a2 + 1, a2 + 2, a2 + 1, a2 + 3, a2 + 2); }
        }
      };
      for (const B of bars) {
        const pts = [];
        for (let j = 0; j < 48; j++) {
          const t = j / 48 * TAU; let k = 1, x = 0, z = 0;
          for (let it = 0; it < 3; it++) { const u = Math.cos(t) * B.a * k, v = Math.sin(t) * B.b * k; x = B.x + u * B.ca - v * B.sa; z = B.z + u * B.sa + v * B.ca; k = barRag(B, x, z); }
          pts.push([x, z]);
        }
        loop(pts, 4.2, 1.2);
      }
      for (const q of surf) { const pts = []; for (let j = 0; j < 10; j++) pts.push([q[0] + Math.cos(j / 10 * TAU) * q[2], q[1] + Math.sin(j / 10 * TAU) * q[2]]); loop(pts, 2.2, 0.3); }
      for (const I of skerries) { const pts = []; for (let j = 0; j < 28; j++) { const th = j / 28 * TAU, r = isleRadius(I, th); pts.push([I.x + Math.cos(th) * r, I.z + Math.sin(th) * r]); } loop(pts, 4.5, 0.8); }
      await ctx.yield();
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aUv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeBoundingSphere();
      const fU = { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: U.uTime, uSunCol: U.uSunCol, uSkyCol: U.uSkyCol };
      const VS = /* glsl */`attribute vec2 aUv; varying vec2 vUv; varying vec3 vW;
#include <fog_pars_vertex>
void main(){ vUv = aUv; vec4 wp = modelMatrix*vec4(position,1.); vW = wp.xyz; vec4 mvPosition = viewMatrix*wp; gl_Position = projectionMatrix*mvPosition;
#include <fog_vertex>
}`;
      const fm = new THREE.ShaderMaterial({ uniforms: fU, transparent: true, depthWrite: false, fog: true, side: THREE.DoubleSide, vertexShader: VS,
        fragmentShader: /* glsl */`uniform float uTime; uniform vec3 uSunCol, uSkyCol; varying vec2 vUv; varying vec3 vW;
${fx.GLSL_NOISE}
#include <fog_pars_fragment>
void main(){
  float n = vnoise(vW.xz*1.9+vec2(uTime*.2, 0.))*.6+vnoise(vW.xz*5.3-vec2(0., uTime*.3))*.4;
  float wash = .5+.5*sin((vUv.y*1.3-uTime*.2+vnoise(vec2(vUv.x*.6, uTime*.05))*1.4)*6.2832);
  float edge = smoothstep(0., .3, vUv.y)*(1.-smoothstep(.8, 1., vUv.y));
  float a = edge*smoothstep(.36, .74, n*.62+wash*.5)*.85;
  gl_FragColor = vec4(vec3(.93,.96,.95)*(uSkyCol*1.3+uSunCol*.55), a);
  #include <fog_fragment>
}` });
      const foam = new THREE.Mesh(g, fm); foam.renderOrder = 2; foam.name = 'surf'; scene.add(foam);
      // the ring's light: a long narrow glow on the water along the last straight, brightest at the ring's foot, broken by
      // the ripples; 120 m long (twice the straight's last 60 m), 9 m a side at the ring and narrowing away from it
      const lp = [], lu = [], li = [], RL = 120;
      for (let i = 0; i <= 12; i++) { const t = i / 12, d = 1 + t * RL, hw = lerp(9, 3.5, t); for (const sx of [-1, 1]) { lp.push(endP.x - endT.x * d + endR.x * hw * sx, 0.16, endP.z - endT.z * d + endR.z * hw * sx); lu.push(sx, t); } if (i) { const a2 = (i - 1) * 2; li.push(a2, a2 + 1, a2 + 2, a2 + 1, a2 + 3, a2 + 2); } }
      const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3)); lg.setAttribute('aUv', new THREE.Float32BufferAttribute(lu, 2)); lg.setIndex(li); lg.computeBoundingSphere();
      const lm = new THREE.ShaderMaterial({ uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: U.uTime, uCol: { value: new THREE.Color('#ffd28a') } }, transparent: true, depthWrite: false, fog: true, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, vertexShader: VS,
        fragmentShader: /* glsl */`uniform float uTime; uniform vec3 uCol; varying vec2 vUv; varying vec3 vW;
${fx.GLSL_NOISE}
#include <fog_pars_fragment>
void main(){
  float ux = clamp(vUv.x, -1., 1.), uy = clamp(vUv.y, 0., 1.);
  float across = exp(-ux*ux*3.2), along = pow(clamp(1.-uy, 0., 1.), 1.6)*smoothstep(0., .02, uy);
  float rip = .35+.65*smoothstep(.3, .7, vnoise(vec2(vW.x*.9+vW.z*.2, vW.z*2.6+uTime*.9))*.6+vnoise(vW.xz*4.+uTime*.4)*.4);
  gl_FragColor = vec4(uCol*across*along*rip*.55, 1.);
  #include <fog_fragment>
}` });
      const glow = new THREE.Mesh(lg, lm); glow.renderOrder = 2; glow.name = 'ring-light'; scene.add(glow);
      measure.surf = { tris: idx.length / 3 };
    }
    await ctx.yield();

    // ------------------------------------------------------------ THE OLD DRAGON on the tallest tower, and the ruined town
    // its chest faces back along the pass, turned 25 degrees toward the line, so one wing lifts over the way we go
    const towerY = landH(towerX, towerZ) - 0.6, c25 = Math.cos(25 * DEG), s25 = Math.sin(25 * DEG);
    const passDx = Math.sin(passAz), passDz = -Math.cos(passAz);
    const faceX = -passDx * c25 - awayX * s25, faceZ = -passDz * c25 - awayZ * s25;
    // where a ruin may stand: on the isle's land, and (a thing h metres high) no nearer the line than 1.2 h and 30 m
    const ruinGround = (x, z) => landH(x + towerX, z + towerZ) - towerY;
    // (the line near the isle, at even metres: every 3 m from 100 m before the arc to 200 m past the pass)
    const lineXZ = []; for (let m = mArc0 - 100; m <= Math.min(L, mPass1 + 200); m += 3) { path.posAtDist(m, _rp); lineXZ.push(_rp.x - towerX, _rp.z - towerZ); }
    const lineGap = (x, z) => { let b2 = 1e30; for (let i = 0; i < lineXZ.length; i += 2) { const dx = lineXZ[i] - x, dz = lineXZ[i + 1] - z, d = dx * dx + dz * dz; if (d < b2) b2 = d; } return Math.sqrt(b2); };
    const ruinClear = (x, z, h) => landH(x + towerX, z + towerZ) > 1.2 && lineGap(x, z) > Math.max(30, 1.2 * h);
    // the two towers of the old mole stand in the shallows off the town, toward the line: 34 m from it each
    const moles = [];
    for (const k of [-58, 62]) {
      const px = towerX - awayX * (OFF - 34) + passDx * k, pz = towerZ - awayZ * (OFF - 34) + passDz * k;
      moles.push([px - towerX, pz - towerZ, 21 + Math.max(0, -landH(px, pz))]);
    }
    await ctx.yield();
    const hero = await buildHero(ctx, { U, rng: R_.old, Ht: 50, face: Math.atan2(faceZ, faceX), dir: mir,
      ruin: { rng: R_.ruin, groundAt: ruinGround, clear: ruinClear, fixed: moles, count: 11, reach: 120 } });
    hero.object.position.set(towerX, towerY, towerZ); scene.add(hero.object);
    await ctx.yield();
    // the beats of the dragon by metres flown: the places where the tower stands 240, 125, 140 and 85 m off
    const whereNear = (dist) => { for (let m = mArc0 - 60; m < mAbeam; m += 2) { path.posAtDist(m, _rp); if (Math.hypot(_rp.x - towerX, _rp.z - towerZ) <= dist) return m; } return mAbeam; };
    const mRise0 = whereNear(240), mRise1 = whereNear(125), mFire0 = whereNear(140), mFire1 = whereNear(85);
    const dragonState = { rise: 0, fire: 0, look: new THREE.Vector3() };
    const dragonAt = (m) => {
      dragonState.rise = smoothstep(mRise0, mRise1, m);
      dragonState.fire = smoothstep(mFire0, mFire0 + 22, m) * (1 - smoothstep(mFire1, mFire1 + 34, m));
      // its head follows us: it looks at the water 30 m before us on our line
      path.posAtDist(Math.min(L, m + 30), dragonState.look); dragonState.look.y = 2;
      return dragonState;
    };

    await ctx.yield();
    // ------------------------------------------------------------ THE BOAT herself (her course is laid above, before the sea)
    const boat = buildBoat({ rng: R_.boat }); boat.object.scale.setScalar(1.25); scene.add(boat.object);
    // (her keel's depth under her waterline, at this scale)
    const DRAUGHT = 0.68;

    await ctx.yield();
    // ------------------------------------------------------------ THE YOUNG DRAGONS: five to nine by the draw
    // (the rare visit: all nine fly, and the first comes out of the sun with two more at its wings)
    const yr = R_.young, nDraw = yr.int(5, 9), nYoung = rare ? 9 : nDraw, nEsc = rare ? 2 : 0, young = makeYoungDragons({ U, count: nYoung, rng: yr }); scene.add(young.mesh);
    // the wheelers (on the clock): rings about the town, 95 to 150 m out and 48 to 92 m up, clear of the old one's wings (60 m)
    // and 26 m or more over our line: TESTED, each ring at the lowest of its bob against the line's highest metre about the
    // ruin, and lifted by what it lacks. Where more than three are dealt, the fourth and the fifth wheel instead far over
    // the ring in the shallows (about a place 140 m beyond it, at their own drawn radius and height over the sea), against
    // the dusk
    const wheel = [];
    for (let i = 2 + nEsc; i < nYoung; i++) wheel.push({ r: yr.range(95, 150), h: yr.range(48, 92), v: yr.range(20, 28), ph: yr.range(0, TAU), sg: yr.chance(0.5) ? 1 : -1, bob: yr.range(3, 7), bph: yr.range(0, TAU), size: yr.range(0.85, 1.15) });
    const wheelX = towerX + awayX * 20, wheelZ = towerZ + awayZ * 20;
    {
      let top = 0; for (let i = Math.floor((mArc0 - 160) / 2); i <= Math.min(LN_N - 1, Math.ceil((mPass1 + 260) / 2)); i++) top = Math.max(top, LN[i * 3 + 1]);
      wheel.forEach((w, i) => {
        if (i >= 3 && i < 5) { w.cx = endP.x + endT.x * 140; w.cz = endP.z + endT.z * 140; w.base = 0; w.ring = true; }
        else { w.cx = wheelX; w.cz = wheelZ; w.base = towerY; w.h = Math.max(w.h, top + 26 + w.bob - towerY); }
      });
      measure.wheel = { wheel, top };
    }
    // the first one (a beat by metres flown): out of the evening sun, over the place 150 m out on the open water where the
    // line dips to 17 m, 13 m over us there, closing at one and a quarter of our own way
    const mCross = mIsles1 + 150, crossC = path.posAtDist(mCross, new THREE.Vector3()), sunAz = 0;
    const crossD = new THREE.Vector3(Math.sin(sunAz), 0, -Math.cos(sunAz));
    // the diver (a beat by metres flown): down from the town's side across our bow, 40 m before us and 10 m over the line
    // (it comes no nearer than 20 m to the lens: its wing is 12.5 m)
    // at the place 60 m into the last arc
    // TESTED: its whole course against the lens's own place at the same metre flown (every 2 m); where 40 m before us
    // would bring it within 20.5 m, it crosses 4 m further before us, and so on until it keeps that
    const mDive = mPass1 + 60, diveC = new THREE.Vector3(), diveT = path.tangentAtDist(mDive, new THREE.Vector3());
    const diveD = new THREE.Vector3(-awayX * 0.75 - diveT.x * 0.6, -0.28, -awayZ * 0.75 - diveT.z * 0.6).normalize();
    const diverAt = (m, out) => { const k = (m - mDive) * 1.5; return out.set(diveC.x + diveD.x * k, Math.max(5, diveC.y + 10 + diveD.y * k), diveC.z + diveD.z * k); };
    for (let lead = 40; lead <= 80; lead += 4) {
      path.posAtDist(mDive + lead, diveC);
      let least = 1e9;
      for (let i = Math.floor((mDive - 300) / 2); i <= Math.min(LN_N - 1, Math.ceil((mDive + 140) / 2)); i++) { diverAt(i * 2, _rp); least = Math.min(least, Math.hypot(_rp.x - LN[i * 3], _rp.y - LN[i * 3 + 1], _rp.z - LN[i * 3 + 2])); }
      measure.diver = { lead, least, diverAt, mDive };
      if (least >= 20.5) break;
    }
    const youngAt = (m, time) => {
      {
        const k = (mCross - m) * 1.25, sz = smoothstep(mCross - 520, mCross - 420, m);
        young.place(0, crossC.x + crossD.x * k, crossC.y + 13 + Math.max(0, k) * 0.045, crossC.z + crossD.z * k, Math.atan2(-crossD.x, -crossD.z), -0.04, 0.08 * Math.sin(time * 0.7), sz * 1.1);
        young.hold(0, smoothstep(mCross - 190, mCross - 150, m) * (1 - smoothstep(mCross + 10, mCross + 40, m)));
        // its two followers: 16 m out on either wing, 22 m behind it and 5 m higher
        for (let e = 0; e < nEsc; e++) {
          const sd = e ? 1 : -1, ke = k + 22;
          young.place(2 + e, crossC.x + crossD.x * ke - crossD.z * 16 * sd, crossC.y + 18 + Math.max(0, ke) * 0.045, crossC.z + crossD.z * ke + crossD.x * 16 * sd, Math.atan2(-crossD.x, -crossD.z), -0.04, -0.12 * sd + 0.06 * Math.sin(time * 0.6 + e), sz);
        }
      }
      {
        const k = (m - mDive) * 1.5, sz = smoothstep(mDive - 300, mDive - 240, m);
        diverAt(m, _rp); young.place(1, _rp.x, _rp.y, _rp.z, Math.atan2(diveD.x, diveD.z), -0.28 * (1 - smoothstep(40, 85, k)), 0.3, sz);
        young.hold(1, smoothstep(mDive - 110, mDive - 80, m) * (1 - smoothstep(mDive, mDive + 30, m)));
      }
      for (let i = 0; i < wheel.length; i++) {
        const w = wheel[i], a = w.ph + w.sg * w.v / w.r * time;
        young.place(i + 2 + nEsc, w.cx + Math.cos(a) * w.r, w.base + w.h + w.bob * Math.sin(time * 0.37 + w.bph), w.cz + Math.sin(a) * w.r, Math.atan2(-Math.sin(a) * w.sg, Math.cos(a) * w.sg), 0.05 * Math.cos(time * 0.37 + w.bph), -0.42 * w.sg, w.size);
      }
      young.commit();
    };
    await ctx.yield();

    const updaters = [], disposers = [];
    // ------------------------------------------------------------ LIFE ON THE MOUNTAIN
    const fxTime = { value: 0 }, fxSet = fx.fxGroup(); scene.add(fxSet.object);
    updaters.push((dt, time, camera) => { fxTime.value = time; fxSet.update(dt, time, camera); });
    await ctx.yield();
    const mats = S.makeMaterials({ night: night ? 1 : 0 });
    await ctx.yield();
    updaters.push((dt, time) => mats.update(dt, time));
    // the creatures' light: the rig's, kept in step every frame
    const fLight = { _resolved: true, sunDir: new THREE.Vector3(0, 1, 0), sunColor: new THREE.Color(), sky: new THREE.Color(), ground: new THREE.Color() };
    const setFLight = () => { fLight.sunDir.copy(rig.direction); fLight.sunColor.copy(rig.sun.color).multiplyScalar(rig.sun.intensity); fLight.sky.copy(rig.hemi.color).multiplyScalar(rig.hemi.intensity); fLight.ground.copy(rig.hemi.groundColor).multiplyScalar(rig.hemi.intensity); };
    setFLight();
    const fauna = F.makeFauna(scene, { light: fLight }), huts = [], vA = makeAcc();
    const _bq0 = new THREE.Vector3(), _bq1 = new THREE.Vector3();
    updaters.push((dt, time, camera, u) => { setFLight(); fauna.setLight(fLight); fauna.update(dt, time, camera, u); });
    {
      // THE VILLAGE of goatherds on its shelf: low huts of small stones laid dry under turf and thatch, either side of the
      // line. A hut is drawn whole (its place, its measures, its door, its yard and its stack), then tested:
      //   its floor is the highest ground under its four corners, each corner's foot half a metre under that corner's own
      //   ground, and a place where the highest and the lowest corner ground differ by more than 1.5 m (what the wall can
      //   hide) is refused; so is one whose ground stands over the floor anywhere along its walls or under its middle, or
      //   falls under the wall's foot between two corners; the ground is read both as the land gives it and as its mesh
      //   draws it, the lower for a foot and the higher for a floor;
      //   its door is in the long side toward the lane where the ground before it lies between a step (0.8 m) under the
      //   floor and a hand over it; else in the other long side; else the place is refused;
      //   its eaves, its stack and its yard keep 15 m from the line in plan; its middle 15 m from the next hut's.
      const vr = R_.village, yr = R_.yard, want = Math.round(14 * dens), mV0 = mOf(50), mV1 = mOf(230);
      const gLo = (x, z) => Math.min(landH(x, z), drawnH(x, z)), gHi = (x, z) => Math.max(landH(x, z), drawnH(x, z));
      const ROOFS = [col3('#5c6a3a'), col3('#8a7b58'), col3('#6b6048'), col3('#4f6034')];
      for (let k = 0; k < want * 40 && huts.length < want; k++) {
        const s = vr.range(92, 176), d = (vr.chance(0.5) ? 1 : -1) * vr.range(22, 58), w = vr.range(5.6, 8.2), dp = vr.range(4.2, 5.4), hw = vr.range(1.9, 2.4), hr = vr.range(1.5, 2.0), turn = vr.range(-0.5, 0.5), tone = vr.range(0.85, 1.12), roofK = vr.int(0, 3);
        const doorX = vr.range(-0.25, 0.25) * w, holeX = (vr.chance(0.5) ? 1 : -1) * w * vr.range(0.2, 0.34);
        const yardOn = yr.chance(0.75), yd = yr.range(4, 6.5), ya = yr.range(0.6, 3), yb = yr.range(0.6, 3), stackEnd = yr.chance(0.5) ? 1 : -1, stackL = yr.range(0.7, 1.3), yv = [yr.range(0.8, 1.12), yr.range(0.8, 1.12), yr.range(0.8, 1.12), yr.range(0.8, 1.12), yr.range(0.8, 1.12)];
        if (k % 6 === 5) await ctx.yield();
        planAt(RT, s, _pl);
        // on level ground the ridge lies along the lane, turned a little; on a slope it lies along the slope's own contour
        // (the fall of the ground over 8 m at the place), so that the fall is taken across the hut's short measure
        const x = _pl.x + Math.cos(_pl.az) * d, z = _pl.z + Math.sin(_pl.az) * d, gx = (landH(x + 4, z) - landH(x - 4, z)) / 8, gz = (landH(x, z + 4) - landH(x, z - 4)) / 8, fall = Math.hypot(gx, gz);
        const yaw = fall > 0.07 ? Math.atan2(gx, gz) + turn * 0.25 : Math.PI / 2 - _pl.az + turn, ca = Math.cos(yaw), sa = Math.sin(yaw), X = w / 2, Z = dp / 2;
        const W2 = (lx, lz) => [x + lx * ca + lz * sa, z - lx * sa + lz * ca];
        if (huts.some((q) => Math.hypot(q.x - x, q.z - z) < 15)) continue;
        const C = [[-X, Z], [X, Z], [X, -Z], [-X, -Z]].map((c) => W2(c[0], c[1])), lo = C.map((c) => gLo(c[0], c[1])), floor = Math.max(...C.map((c) => gHi(c[0], c[1]))), low = Math.min(...lo);
        if (floor - low > 1.5) continue;
        let ok = true;
        for (const fx of [-0.5, 0, 0.5]) for (const fz of [-0.5, 0, 0.5]) { const q = W2(fx * X, fz * Z); if (gHi(q[0], q[1]) > floor + 0.2) ok = false; }
        for (let e = 0; e < 4 && ok; e++) for (const f of [0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875]) { const a = C[e], b = C[(e + 1) % 4], px = lerp(a[0], b[0], f), pz = lerp(a[1], b[1], f); if (gHi(px, pz) > floor + 0.2 || gLo(px, pz) < lerp(lo[e], lo[(e + 1) % 4], f) - 0.4) ok = false; }
        if (!ok) continue;
        // (the long side that looks toward the lane first)
        let face = (sa * Math.cos(_pl.az) + ca * Math.sin(_pl.az)) * d > 0 ? -1 : 1, gDoor = 0; ok = false;
        for (let t = 0; t < 2 && !ok; t++) { const q = W2(doorX, face * (Z + 0.7)); gDoor = gLo(q[0], q[1]); if (gHi(q[0], q[1]) <= floor + 0.25 && gDoor >= floor - 0.8) ok = true; else face = -face; }
        if (!ok) continue;
        // the yard: a wall round three sides of the ground before the door, a gap for the gate before the door itself
        const yz = face * (Z + yd), walk = (pts) => { const out = []; for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1], n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 1.6)); for (let j = i ? 1 : 0; j <= n; j++) { const q = W2(lerp(a[0], b[0], j / n), lerp(a[1], b[1], j / n)); out.push([q[0], q[1], gLo(q[0], q[1])]); } } return out; };
        const yard = yardOn ? [walk([[-X - ya, face * Z], [-X - ya, yz], [doorX - 0.9, yz]]), walk([[doorX + 0.9, yz], [X + yb, yz], [X + yb, face * Z]])] : [];
        let gap = 1e9;
        for (const c of [[-X - 1.4, Z + 0.6], [X + 1.4, Z + 0.6], [X + 1.4, -Z - 0.6], [-X - 1.4, -Z - 0.6]]) { const q = W2(c[0], c[1]); gap = Math.min(gap, routeDist(q[0], null, q[1], mV0, mV1)); }
        for (const ch of yard) for (const q of ch) gap = Math.min(gap, routeDist(q[0], null, q[1], mV0, mV1) - 0.3);
        if (gap < 15) continue;
        const wallC = mix3(col3('#8d877c'), col3('#a39a88'), tone - 0.85).map((c) => c * tone);
        hutInto(vA, { x, z, yaw, w, d: dp, hw, hr, floor, feet: lo.map((g) => g - 0.5), gDoor, wallC, roofC: ROOFS[roofK], face, doorX, holeX, lit: night });
        for (const ch of yard) dryWallInto(vA, ch, 1.0, 0.55, wallC, yv);
        // the stack of peat by a gable, under the verge
        { const q = W2(stackEnd * (X + 0.8), 0), g = gLo(q[0], q[1]), g1 = gHi(q[0], q[1]); boxInto(vA, q[0], (g - 0.3 + g1 + 1.05) / 2, q[1], 0.5, (g1 + 1.05 - g + 0.3) / 2, stackL, yaw, 0, [0.2, 0.15, 0.115], [0, 0, 2]); }
        huts.push({ x, y: floor, z, h: hw + hr + 0.28, yaw, w, d: dp, floor, foot: low - 0.5, feet: lo.map((g) => g - 0.5), holeX, gap, face });
      }
      await ctx.yield();
      // THE PASTURE has things on it, so that its ground reads as we come down it (all in the village's one mesh). Each is
      // drawn whole from the pasture's stream and then tested on the ground it would stand on.
      const pr = R_.pasture, at2 = (s, d) => { planAt(RT, s, _pl); return [_pl.x + Math.cos(_pl.az) * d, _pl.z + Math.sin(_pl.az) * d]; };
      const offHuts = (x, z, r) => !huts.some((q) => Math.hypot(q.x - x, q.z - z) < r + 0.5 * q.w + 5);
      // a path down the combe's floor, winding within the floor's own width, to the lane between the huts and on down the
      // wood to the quay's root: a strip of trodden earth laid 0.12 m over the ground AS ITS MESH DRAWS IT (not as the land's
      // formula gives it), a metre between its rows; where a fold of the mesh rises between two neighbouring points of the
      // strip, both are lifted by that rise, so that the strip neither floats over the turf nor dips under it
      const pp1 = pr.range(0, TAU), pp2 = pr.range(0, TAU);
      const pathD = (s) => { const half = keyed(FLOOR_W, s) * 0.55; return lerp(clamp(5 * Math.sin(s * 0.045 + pp1) + 2.5 * Math.sin(s * 0.11 + pp2), -half, half), 12.5 * dSide, smoothstep(186, 232, s)); };
      {
        const EARTH = col3('#9b8a68'), EDGE = col3('#7c7a52'), rows = [];
        for (let s = 3; s <= 236; s += 1) {
          const d = pathD(s), wd = 0.75 + 0.2 * Math.sin(s * 0.3 + pp2);
          const q = [at2(s, d - wd), at2(s, d), at2(s, d + wd)]; if (drawnH(q[1][0], q[1][1]) < 0.7) break;
          rows.push(q.map((v) => [v[0], v[1], drawnH(v[0], v[1]), 0]));
        }
        // the rise of the drawn ground over the middle of an edge of the strip (its rows, its rungs and each quad's diagonal)
        const rise = (a, b) => { const r = drawnH((a[0] + b[0]) / 2, (a[1] + b[1]) / 2) - (a[2] + b[2]) / 2; if (r > a[3]) a[3] = r; if (r > b[3]) b[3] = r; };
        for (let i = 0; i < rows.length; i++) for (let j = 0; j < 3; j++) {
          if (j < 2) rise(rows[i][j], rows[i][j + 1]);
          if (i < rows.length - 1) { rise(rows[i][j], rows[i + 1][j]); if (j < 2) rise(rows[i][j], rows[i + 1][j + 1]); }
        }
        const ids = rows.map((q) => q.map((v, j) => vA.v(v[0], v[2] + v[3] + 0.12, v[1], j === 1 ? EARTH : EDGE, 0, 0, 0)));
        for (let i = 0; i < ids.length - 1; i++) for (let j = 0; j < 2; j++) vA.quad(ids[i][j], ids[i + 1][j], ids[i + 1][j + 1], ids[i][j + 1]);
      }
      await ctx.yield();
      // dry stone walls running down the pasture to the village, one each side and a third by the draw: each keeps 15 m
      // from the line along its whole length, and ends where it would meet a hut
      for (let k = 0, nW = pr.int(2, 3); k < nW; k++) {
        const side = k === 0 ? 1 : k === 1 ? -1 : (pr.chance(0.5) ? 1 : -1), s0 = pr.range(6, 46), s1 = pr.range(98, 128), d0 = pr.range(19, 36), d1 = pr.range(20, 40), ph = pr.range(0, TAU), wv = pr.range(1.5, 4), tone = pr.range(0.85, 1.05);
        const vary = [pr.range(0.8, 1.1), pr.range(0.8, 1.1), pr.range(0.8, 1.1), pr.range(0.5, 1.1), pr.range(0.8, 1.1), pr.range(0.8, 1.1), pr.range(0.8, 1.1)], ch = [];
        let ok = true;
        for (let s = s0; s <= s1; s += 1.7) {
          const q = at2(s, side * (lerp(d0, d1, (s - s0) / (s1 - s0)) + wv * Math.sin(s * 0.07 + ph)));
          if (routeDist(q[0], null, q[1], 0, mV1) < 15.4) { ok = false; break; }
          if (!offHuts(q[0], q[1], 2)) break;
          ch.push([q[0], q[1], gLo(q[0], q[1])]);
        }
        if (ok && ch.length > 6) dryWallInto(vA, ch, 1.05, 0.6, col3('#8f897e').map((c) => c * tone), vary);
        await ctx.yield();
      }
      // outcrops of the mountain's rock standing out of the turf
      const lumpOf = (n) => { const l = []; for (let i = 0; i < n; i++) l.push(pr()); return l; };
      for (let k = 0, n = pr.int(10, 15); k < n; k++) {
        const s = pr.range(-14, 150), d = (pr.chance(0.5) ? 1 : -1) * pr.range(17, 72), r = pr.range(1.2, 3.4), h = r * pr.range(0.55, 1.05), lump = lumpOf(7), turn = pr.range(0, TAU), tone = pr.range(0.8, 1.1), q = at2(s, d);
        if (routeDist(q[0], null, q[1], 0, mV1) < 15 + r || !offHuts(q[0], q[1], r)) continue;
        rockInto(vA, { x: q[0], y: gLo(q[0], q[1]) - 0.15, z: q[1], r, h, lump, turn, c: col3('#85807a').map((c) => c * tone) });
      }
      await ctx.yield();
      // heather in clumps and rough grass in tufts, in several greens, thick near the floor and thinning up the slopes; none
      // on the path
      const HEATH = [col3('#4d5a3c'), col3('#58633f'), col3('#5b5548'), col3('#66584f'), col3('#465536')], GRASS = [col3('#5f7a38'), col3('#7f8d44'), col3('#8c8a4e'), col3('#48682f')];
      for (let k = 0, n = Math.round(120 * dens); k < n; k++) {
        const s = pr.range(-20, 126), d = (pr.chance(0.5) ? 1 : -1) * (5 + 70 * pr() * pr()), r = pr.range(0.5, 1.4), h = r * pr.range(0.25, 0.45), lump = lumpOf(6), turn = pr.range(0, TAU), c = pr.pick(HEATH), q = at2(s, d);
        if (!offHuts(q[0], q[1], r) || Math.abs(d - pathD(s)) < r + 1.4) continue;
        rockInto(vA, { x: q[0], y: gLo(q[0], q[1]) - 0.05, z: q[1], r, h, lump, turn, c, soft: true });
        if (k % 24 === 23) await ctx.yield();
      }
      for (let k = 0, n = Math.round(190 * dens); k < n; k++) {
        const s = pr.range(-20, 126), d = (pr.chance(0.5) ? 1 : -1) * (3 + 60 * pr() * pr()), c = pr.pick(GRASS), lean = [], q = at2(s, d);
        for (let i = 0, nb = pr.int(5, 7); i < nb; i++) lean.push([pr.range(0, TAU), pr.range(0.35, 0.85), pr.range(0.4, 0.95)]);
        if (!offHuts(q[0], q[1], 1) || Math.abs(d - pathD(s)) < 1.6) continue;
        tuftInto(vA, q[0], gLo(q[0], q[1]), q[1], lean, c);
        if (k % 48 === 47) await ctx.yield();
      }
      await ctx.yield();
      const vm = new THREE.Mesh(vA.build(), makeLandMaterial(U, true)); vm.name = 'village'; scene.add(vm);
      await ctx.yield();
      // smoke rising thin from four hearths
      const sr2 = R_.smoke, hs = sr2.shuffle(huts.slice()).slice(0, 4);
      for (const h of hs) {
        fxSet.add(fx.makeSmokeColumn({ rng: sr2, time: fxTime, position: [h.x + Math.cos(h.yaw) * h.holeX, h.y + h.h + 0.5, h.z - Math.sin(h.yaw) * h.holeX], height: sr2.range(20, 28), radius: [0.25, 2.6], size: [0.7, 3.6], count: 30,
          color: '#b9b4ae', colorTop: '#e6e2dc', shadowColor: '#6f6a70', ambient: '#3a3840', opacity: 0.42, rate: 0.07, wind: [0.6, 0, -0.5], bend: 0.5 }));
        await ctx.yield();
      }
      // goats on the pasture, white and dun: three herds wanted, each dealt whole from the goats' stream over the pasture's
      // own length (its station, its side, its distance, its ring, its count and coat), then tested: level ground under
      // its ring, the ring's edge 12 m or more from the line in plan, clear of the huts and of the other herds. Thirty
      // draws to a herd; what finds no place is left out.
      const gr = R_.goats; let herds = 0;
      for (let k = 0; k < 90 && herds < 3; k++) {
        const s = gr.range(6, 122), d = (gr.chance(0.5) ? 1 : -1) * gr.range(21, 44), rad = gr.range(7, 11), n = gr.int(6, 9), coat = gr.pick(['#e9e4d6', '#d8d0bc', '#b8a88a']), q = at2(s, d);
        if (Math.abs(landH(q[0] + rad, q[1]) - landH(q[0] - rad, q[1])) + Math.abs(landH(q[0], q[1] + rad) - landH(q[0], q[1] - rad)) > rad * 0.75) continue;
        if (routeDist(q[0], null, q[1], 0, mV1) < 12 + rad || !offHuts(q[0], q[1], rad) || measure.herds.some((o) => Math.hypot(o.x - q[0], o.z - q[1]) < o.r + rad + 6)) continue;
        fauna.add(F.makeHerd({ rng: gr, species: 'antelope', coat, count: Math.round(n * dens), size: 0.95, center: [q[0], 0, q[1]], radius: rad, heightAt: drawnH, path, clear: 12 }));
        measure.herds.push({ x: q[0], z: q[1], r: rad }); herds++;
        await ctx.yield();
      }
      // MIST lying at dawn in thin TONGUES that move, on the pasture and the village's shelf and on the cove's water (not on
      // the steep wood between them): each tongue has its reach along the combe, its place across the floor's own width, a slow sway and its drift down the combe on the clock
      // (0.8 to 2.2 m a second); its puffs are small (12 to 22 m) and follow one another down its course, swelling out of
      // nothing at its head and thinning to nothing at its foot, so that the tongues part and close as they pass.
      // A puff is drawn whole and then tested over its WHOLE course (every 3 m of it, at its full size): its top (the
      // ground at its middle, its lift and 0.15 of its size) keeps 3 m or more under the lowest metre of the line within
      // half its size in plan (tested with 0.6 m and 2 m to spare, for the ground and the line between the places read).
      // A puff that fails anywhere on its course is left out.
      if (!night) {
        const mr2 = R_.mist, list = [], nT = mr2.int(7, 10), mM = mOf(370);
        for (let t = 0; t < nT; t++) {
          const cove = mr2.chance(0.4), lo = cove ? 236 : 8, hi = cove ? 350 : 156, len = mr2.range(60, 120), sA = mr2.range(lo, Math.max(lo + 1, hi - len)), sB = Math.min(sA + len, hi), off = mr2.range(-1, 1), sway = mr2.range(1, 4), wl = mr2.range(30, 60), ph = mr2.range(0, TAU), v = mr2.range(0.8, 2.2), n = Math.round(mr2.int(9, 14) * dens);
          // the tongue's course at every 3 m: its place, the ground there, the line's normal in plan
          const nS = Math.max(2, Math.ceil((sB - sA) / 3) + 1), C = new Float32Array(nS * 5);
          for (let k = 0; k < nS; k++) {
            const sk = lerp(sA, sB, k / (nS - 1)); planAt(RT, sk, _pl);
            const d = off * (sk > 232 ? 13 : keyed(FLOOR_W, sk) * 0.8) + sway * Math.sin(sk / wl * TAU + ph), x = _pl.x + Math.cos(_pl.az) * d, z = _pl.z + Math.sin(_pl.az) * d;
            C[k * 5] = x; C[k * 5 + 1] = Math.max(landH(x, z), 0); C[k * 5 + 2] = z; C[k * 5 + 3] = Math.cos(_pl.az); C[k * 5 + 4] = Math.sin(_pl.az);
          }
          await ctx.yield();
          for (let i = 0; i < n; i++) {
            const q = { C, nS, per: (sB - sA) / v, f0: (i + mr2()) / n, S: mr2.range(12, 22), lift: mr2.range(0.6, 2), jit: mr2.range(-2.5, 2.5) };
            let ok = true;
            for (let k = 0; k < nS && ok; k++) {
              const x = C[k * 5] + C[k * 5 + 3] * q.jit, z = C[k * 5 + 2] + C[k * 5 + 4] * q.jit, low = lineLow(x, z, q.S / 2 + 2, 0, mM);
              if (C[k * 5 + 1] + 0.4 + q.lift + 0.15 * q.S > low - 3.6) ok = false;
            }
            if (ok) list.push(q);
          }
        }
        if (list.length) {
          const ms = fx.makeMist({ rng: mr2, time: fxTime, positions: list.map((q) => [q.C[0], q.C[1] + q.lift, q.C[2]]), count: list.length, size: [12, 22], color: PAL.foam, opacity: hour === 'day' ? 0.05 : 0.09, drift: [0, 0, 0], flatten: 0.3 });
          ms.object.frustumCulled = false;
          const pa = ms.aPos.array, ia = ms.aInfo.array;
          const mistAt = (time) => {
            for (let i = 0; i < list.length; i++) {
              const q = list[i], f = (q.f0 + time / q.per) % 1, g = f * (q.nS - 1), k = Math.min(q.nS - 2, Math.floor(g)), t = g - k, C = q.C, a = k * 5, b = a + 5;
              pa[i * 3] = lerp(C[a], C[b], t) + lerp(C[a + 3], C[b + 3], t) * q.jit; pa[i * 3 + 1] = lerp(C[a + 1], C[b + 1], t) + q.lift; pa[i * 3 + 2] = lerp(C[a + 2], C[b + 2], t) + lerp(C[a + 4], C[b + 4], t) * q.jit;
              ia[i * 4] = q.S * smoothstep(0, 0.2, f) * (1 - smoothstep(0.78, 1, f));
            }
            ms.aPos.needsUpdate = true; ms.aInfo.needsUpdate = true;
          };
          mistAt(0); fxSet.add(ms); measure.puffs = ms; measure.mistAt = mistAt; measure.mistList = list;
          updaters.push((dt, time) => mistAt(time));
        }
      }
    }
    await ctx.yield();
    // ------------------------------------------------------------ TREES: alders in the combe and about the village, woods on the isles
    const wind = flora.makeWind({ direction: [0.2, -0.95], strength: 0.8, speed: 0.8 });
    const fmatO = { wind, backlight: 0.7, ambient: 2.1, leafAmbient: 1.9 };
    await flora.prepareLeafTexture(fmatO, ctx.yield);
    const fmat = flora.windMaterial(fmatO);
    updaters.push((dt, time) => flora.updateWind(wind, time));
    {
      const wr = R_.woods, ALD = { leaf: '#3f6d2e', leafLight: '#75a044', leafDark: '#1d3818', bark: '#5c5248', barkDark: '#2e2824' };
      const nearV = [], farV = [];
      nearV.push(flora.birchGeometry({ rng: wr, detail: 1, height: 10.5, ...ALD })); await ctx.yield();
      nearV.push(flora.oakGeometry({ rng: wr, detail: 1, height: 9.5, ...ALD })); await ctx.yield();
      farV.push(flora.birchGeometry({ rng: wr, detail: 0, height: 10.5, ...ALD })); await ctx.yield();
      farV.push(flora.oakGeometry({ rng: wr, detail: 0, height: 9.5, ...ALD })); await ctx.yield();
      farV.push(flora.oakGeometry({ rng: wr, detail: 0, height: 11, ...ALD, leaf: '#35602a' })); await ctx.yield();
      const pts = [];
      // a tree may stand where the wood is (the slopes between the shore and the pasture) and never in the line's way:
      // 14 m or more aside of it, and within 26 m of it only with its crown 3 m under the line
      const tryTree = (s, d, sc, v, want) => {
        planAt(RT, s, _pl);
        const x = _pl.x + Math.cos(_pl.az) * d, z = _pl.z + Math.sin(_pl.az) * d, h = landH(x, z);
        if (h < 2.5 || h > 60 || Math.abs(d) < 14) return;
        const wood = smoothstep(3, 9, h) * (1 - smoothstep(44, 56, h));
        if (wood < want) return;
        for (const q of huts) if (Math.hypot(q.x - x, q.z - z) < 6.5) return;
        if (Math.abs(d) < 26 && h + 11.5 * sc > path.posAtDist(mOf(clamp(s, 0, sEnd)), _rp).y - 3) return;
        if (Math.abs(landH(x + 4, z) - h) + Math.abs(landH(x, z + 4) - h) > 5.6) return;
        pts.push({ x, y: h, z, s: sc, rot: v * 1.7 + s, d: Math.abs(d), u: 0, v: Math.floor(v * 3) });
      };
      // about the village (alders among the houses), then the wood below it, then the far slopes
      for (let k = 0; k < 500 && pts.length < Math.round(34 * dens); k++) { tryTree(wr.range(96, 168), wr.range(-1, 1) * 62, wr.range(0.75, 1.15), wr(), 0); if (k % 50 === 49) await ctx.yield(); }
      const n1 = pts.length;
      for (let k = 0; k < 1400 && pts.length < n1 + Math.round(120 * dens); k++) { tryTree(wr.range(150, 262), wr.range(-1, 1) * 90, wr.range(0.8, 1.3), wr(), wr() * 0.8); if (k % 50 === 49) await ctx.yield(); }
      const n2 = pts.length;
      for (let k = 0; k < 1800 && pts.length < n2 + Math.round(120 * dens); k++) { tryTree(wr.range(60, 330), wr.sign() * wr.range(60, 240), wr.range(0.9, 1.5), wr(), 0.3 + wr() * 0.6); if (k % 50 === 49) await ctx.yield(); }
      await ctx.yield();
      // the isles' woods and orchards: on the near isles by what each is, on the dragons' isle none
      for (const I of nearIsles) {
        const want = Math.round((I.kind === 'wood' ? 54 : I.kind === 'town' ? 16 : I.kind === 'terrace' ? 12 : 7) * dens);
        for (let k = 0, got = 0; k < want * 8 && got < want; k++) {
          const a = wr.range(0, TAU), rr = Math.sqrt(wr()) * 0.9, sc = wr.range(0.6, 1.05), v = wr(), x = I.x + Math.cos(a) * rr * I.R, z = I.z + Math.sin(a) * rr * I.R, h = isleHeight(I, x, z, noise);
          if (h < 4 || Math.abs(isleHeight(I, x + 3, z, noise) - isleHeight(I, x - 3, z, noise)) + Math.abs(isleHeight(I, x, z + 3, noise) - isleHeight(I, x, z - 3, noise)) > 7) continue;
          if (I.town) { let da = Math.abs(a - I.town.a); da = Math.min(da, TAU - da); if (da < I.town.w * 0.7 && rr > 0.45) continue; }
          pts.push({ x, y: h, z, s: sc, rot: v * 6.28, d: 999, u: 0, v: Math.floor(v * 3) }); got++;
        }
        await ctx.yield();
      }
      const trees = flora.makeScatter({ rng: wr, points: pts, variants: nearV, farVariants: farV, farDistance: 40, material: fmat, sink: 0.05, tint: 0.2, hue: 0.04 });
      scene.add(trees.object); updaters.push((dt, time, camera) => trees.update(dt, time, camera));
    }
    await ctx.yield();
    // ------------------------------------------------------------ THE HARBOUR, THE TOWNS, THE LIGHTHOUSE
    const seaY = seaAt;
    {
      // the quay she lies at: a pier along the cove's shore 15 m to the dragon's side of the line
      const at = (s, d, out) => { planAt(RT, s, _pl); out[0] = _pl.x + Math.cos(_pl.az) * d; out[1] = _pl.z + Math.sin(_pl.az) * d; return out; };
      const a = at(234, 15 * dSide, [0, 0]), b = at(262, 15 * dSide, [0, 0]);
      const pier = S.makePier({ rng: R_.boats, from: [a[0], 0, a[1]], to: [b[0], 0, b[1]], width: 3.4, height: 1.5, pileDepth: 6, head: false, railing: false, ladder: true, lamps: night, mats });
      scene.add(pier.object);
      await ctx.yield();
      // rowboats MOORED BY A RULE OF THE PLACE: a drawn count (four to seven wanted); each is drawn whole (a metre along the
      // cove, a side, a distance from the line, a heading) and then tested: the water under it 1 to 3 m deep (the cove's
      // head and the foot of its shores), 18 m or more from the line in plan, 4 m from the next. Thirty draws to a boat.
      const positions = [], headings = [], br = R_.moor, wantRow = br.int(4, 7);
      for (let k = 0; k < wantRow * 30 && positions.length < wantRow; k++) {
        const q = at(br.range(236, 278), (br.chance(0.5) ? 1 : -1) * br.range(18.5, 36), [0, 0]), hd = br.range(0, TAU), dep = depthOf(q[0], q[1]);
        if (dep < 1 || dep > 3 || lineNear(q[0], null, q[1], 0, mOf(420)) < 18 || positions.some((o) => Math.hypot(o[0] - q[0], o[2] - q[1]) < 4)) continue;
        // (clear of the pier's own planks: 3 m from its middle line)
        { const px = b[0] - a[0], pz = b[1] - a[1], pl = Math.hypot(px, pz) || 1, t = clamp(((q[0] - a[0]) * px + (q[1] - a[1]) * pz) / (pl * pl), 0, 1); if (Math.hypot(q[0] - a[0] - px * t, q[1] - a[1] - pz * t) < 3) continue; }
        positions.push([q[0], 0, q[1]]); headings.push(hd);
      }
      measure.rows = positions;
      if (positions.length) {
        const row = S.makeBoats({ rng: br, types: ['rowboat'], variants: 2, positions, headings, moving: false, heightAt: seaY, mats, palette: { hull: ['#7a5234', '#6a4a30', '#8a6a44', '#5a4634'] } });
        scene.add(row.object); updaters.push((dt, time, camera) => row.update(dt, time, camera));
      }
    }
    await ctx.yield();
    {
      // white towns on the harbour shelves of the town isles, and the lighthouse on its rock
      const tr = R_.towns, WHITE = { wall: ['#f2efe6', '#e9e4d6', '#f6f3ec', '#efe6d2'], roof: ['#b5653a', '#c27a48', '#a85a38'], trim: '#d8cfba', accent: '#3f6a8a' };
      for (const I of nearIsles) {
        if (I.kind === 'town') {
          const hAt = (x, z) => isleHeight(I, x, z, noise);
          const town = S.makeVillage({ rng: tr, center: [I.x + Math.cos(I.town.a) * I.R * 0.66, I.z + Math.sin(I.town.a) * I.R * 0.66], radius: I.R * 0.46, count: Math.round(20 * dens), heightAt: hAt, styles: ['mediterranean'],
            landmark: false, maxSlope: 0.7, waterLevel: 1.2, detail: 0.7, lamps: night, mats, building: { mediterranean: WHITE } });
          scene.add(town.object);
          await ctx.yield();
        }
        if (I.kind === 'light') {
          // on the rock's highest ground of nine places tried about its middle
          let bx = I.x, bz = I.z, bh = -1e9;
          for (let k = 0; k < 9; k++) { const x = I.x + (k % 3 - 1) * I.R * 0.22, z = I.z + (Math.floor(k / 3) - 1) * I.R * 0.22, h = isleHeight(I, x, z, noise); if (h > bh) { bh = h; bx = x; bz = z; } }
          const lh = S.makeBuilding({ rng: R_.light, style: 'lighthouse', height: 27, stripes: false, cottage: true, position: [bx, bh - 0.5, bz], rotationY: R_.light.range(0, TAU), mats, palette: { wall: '#efeadc', roof: '#8a4a36', trim: '#d8d0bc' } });
          scene.add(lh.object); updaters.push((dt, time, camera) => lh.update(dt, time, camera));
        }
      }
    }
    await ctx.yield();
    // ------------------------------------------------------------ FISHING BOATS, GULLS, DOLPHINS, THE TOWERS' SMOKE
    {
      // FISHING BOATS (the part's plain boat, two canvases), the wanted count on every seed. Each sails a slow ring on the
      // clock. Among the isles: drawn whole, then tested (deep water all round its ring, never within 45 m of the line, so
      // none is taken for the boat we follow); what the isles' water did not take joins THE FLEET.
      const br = R_.boats, fr = R_.fleet, nF = Math.round(8 * dens), nIsle = nF - Math.max(3, Math.round(nF * 0.4)), list = [];
      const ringOK = (q, gap, mWin) => {
        const m0 = mOf(clamp(q.s, 0, sEnd));
        for (let j = 0; j < 12; j++) { const a = j / 12 * TAU, x = q.x + Math.cos(a) * q.r, z = q.z + Math.sin(a) * q.r; if (depthOf(x, z) < 12 || routeDist(x, null, z, m0 - mWin, m0 + mWin) < gap) return false; }
        for (const o of list) if (Math.hypot(o.x - q.x, o.z - q.z) < o.r + q.r + 14) return false;
        return true;
      };
      for (let k = 0; k < nF * 8 && list.length < nIsle; k++) {
        const q = { s: br.range(sMouth + 50, sIsles1 + 30), d: (br.chance(0.5) ? 1 : -1) * br.range(70, 170), r: br.range(18, 34), v: br.range(1.5, 2.8), ph: br.range(0, TAU), sg: br.chance(0.5) ? 1 : -1, kind: br.int(0, 1), net: 0, x: 0, z: 0 };
        planAt(RT, q.s, _pl); q.x = _pl.x + Math.cos(_pl.az) * q.d; q.z = _pl.z + Math.sin(_pl.az) * q.d;
        if (ringOK(q, 46, 220)) list.push(q);
        if (k % 4 === 3) await ctx.yield();
      }
      // THE FLEET, on the open water between the last isle and the ruin, at its nets: one boat to each even share of that
      // water's length (its station drawn within its share), on a drawn side, its small ring 40 m or more clear of the line
      // (the first two near: 40 to 50 m), each trailing a net's floats. A place that fails its test (a skerry, another boat,
      // the line's bend) is moved straight out from the line by 8 m at a time until it passes: the open sea is wide, so the
      // rule ends, and the count is the wanted count.
      const nFleet = nF - list.length, fleet = [];
      for (let i = 0; i < nFleet; i++) {
        const q = { s: lerp(sIsles1 + 40, sArc0 - 60, (i + fr.range(0.15, 0.85)) / nFleet), d: 0, r: fr.range(11, 18), v: fr.range(0.7, 1.3), ph: fr.range(0, TAU), sg: fr.chance(0.5) ? 1 : -1, kind: fr.int(0, 1), net: fr.int(9, 14), x: 0, z: 0 };
        const side = fr.chance(0.5) ? 1 : -1, extra = i < 2 ? fr.range(0, 10) : fr.range(8, 70);
        planAt(RT, q.s, _pl);
        for (let k = 0; k < 80; k++) {
          q.d = side * (41 + q.r + extra + k * 8); q.x = _pl.x + Math.cos(_pl.az) * q.d; q.z = _pl.z + Math.sin(_pl.az) * q.d;
          if (ringOK(q, 41, 260)) break;
        }
        list.push(q); fleet.push(q);
        await ctx.yield();
      }
      measure.boats = { want: nF, list, fleet };
      const _m4 = new THREE.Matrix4(), _q4 = new THREE.Quaternion(), _e4 = new THREE.Euler(0, 0, 0, 'YXZ'), _p4 = new THREE.Vector3(), _s4 = new THREE.Vector3(1, 1, 1), sets = [];
      for (const [kind, sailC] of [[0, '#b9a274'], [1, '#a65a3c']]) {
        const mine = list.filter((q) => q.kind === kind); if (!mine.length) continue;
        const fb = buildBoat({ rng: br, plain: true, sail: sailC });
        const hull = new THREE.InstancedMesh(fb.hull.geometry, fb.hull.material, mine.length), sail = new THREE.InstancedMesh(fb.sail.geometry, fb.sail.material, mine.length);
        hull.frustumCulled = false; sail.frustumCulled = false; scene.add(hull, sail); sets.push({ mine, hull, sail, sailU: fb.sailU });
        await ctx.yield();
      }
      // the nets' floats: corks in a line astern of each fleet boat, lying along the ring she rounds (one mesh)
      const nFloat = fleet.reduce((n, q) => n + q.net, 0), floats = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.42, 0), new THREE.MeshLambertMaterial({ color: '#ffffff' }), Math.max(1, nFloat));
      { let k = 0; const c = new THREE.Color(); for (const q of fleet) for (let j = 0; j < q.net; j++) floats.setColorAt(k++, c.set(j % 4 === 0 ? '#a8452e' : '#9a8156')); }
      floats.count = nFloat; floats.frustumCulled = false; floats.name = 'net-floats'; scene.add(floats);
      updaters.push((dt, time) => {
        let k = 0;
        for (const q of fleet) for (let j = 0; j < q.net; j++) {
          const a = q.ph + q.sg * (q.v * time - 8 - j * 2.1) / q.r, x = q.x + Math.cos(a) * q.r, z = q.z + Math.sin(a) * q.r;
          _m4.makeTranslation(x, seaAt(x, z, time) + 0.08, z); floats.setMatrixAt(k++, _m4);
        }
        floats.instanceMatrix.needsUpdate = true;
        for (const S_ of sets) {
          for (let i = 0; i < S_.mine.length; i++) {
            const q = S_.mine[i], a = q.ph + q.sg * q.v / q.r * time, x = q.x + Math.cos(a) * q.r, z = q.z + Math.sin(a) * q.r;
            _e4.set(0.04 * Math.sin(time * 0.8 + q.ph), Math.atan2(-Math.sin(a) * q.sg, Math.cos(a) * q.sg), 0.07 * Math.sin(time * 0.6 + q.ph * 2));
            _m4.compose(_p4.set(x, seaAt(x, z, time) - 0.05, z), _q4.setFromEuler(_e4), _s4);
            S_.hull.setMatrixAt(i, _m4); S_.sail.setMatrixAt(i, _m4);
          }
          S_.hull.instanceMatrix.needsUpdate = true; S_.sail.instanceMatrix.needsUpdate = true; S_.sailU.uSailT.value = time;
        }
      });
    }
    await ctx.yield();
    {
      // GULLS: about the head of one of the harbour mouth's two cliffs (a drawn side: the flock stands off the line there),
      // round every cliff isle, the lighthouse rock and the towns, over the two fishing boats nearest us and over the reef.
      // Every flock is made whole and then tested BIRD BY BIRD, as the fishing boats are: each bird's own course (the
      // flock's loop at 96 places and the bird's standing place in the flock) against every metre of the line near it,
      // the reach of its wander (a ball of 8.9 m for these gulls) taken off; a flock with a bird's course nearer the line
      // than 4 m beyond that reach is made again closer in (half the spread), and left out if it still fails.
      const gr = R_.birds, GULL = { species: 'gulls', size: 1.5 }, _fp = new THREE.Vector3();
      const flockGap = (fl) => {
        const iA = fl.geometry.getAttribute('iA').array, iB = fl.geometry.getAttribute('iB').array, n = 96, uw = fl.uniforms.uWander.value, ball = Math.hypot(1.5 * uw.x, uw.y, uw.z), loop = new Float32Array(n * 3);
        let cx = 0, cz = 0, rad = 0, lat = 0, best = 1e30;
        for (let k = 0; k < n; k++) { fl.route.pointAt(k / n * fl.route.length, _fp); loop[k * 3] = _fp.x; loop[k * 3 + 1] = _fp.y; loop[k * 3 + 2] = _fp.z; cx += _fp.x / n; cz += _fp.z / n; }
        for (let k = 0; k < n; k++) rad = Math.max(rad, Math.hypot(loop[k * 3] - cx, loop[k * 3 + 2] - cz));
        for (let i = 0; i < fl.count; i++) lat = Math.max(lat, Math.hypot(iA[i * 4], iB[i * 4 + 3]));
        const near = [], reach = rad + lat + ball + 40;
        for (let i = 0; i < LN_N; i++) if (Math.hypot(LN[i * 3] - cx, LN[i * 3 + 2] - cz) < reach) near.push(i);
        if (!near.length) return { gap: 1e9, ball };
        for (let i = 0; i < fl.count; i++) {
          const ox = iA[i * 4], oy = iA[i * 4 + 1], oz = iB[i * 4 + 3];
          for (let k = 0; k < n; k++) { const x = loop[k * 3] + ox, y = loop[k * 3 + 1] + oy, z = loop[k * 3 + 2] + oz; for (const j of near) { const dx = LN[j * 3] - x, dy = LN[j * 3 + 1] - y, dz = LN[j * 3 + 2] - z, d = dx * dx + dy * dy + dz * dz; if (d < best) best = d; } }
        }
        return { gap: Math.sqrt(best), ball };
      };
      const addFlock = async (o, spread = [34, 12, 34]) => {
        for (const k of [1, 0.5]) {
          const fl = F.makeFlock({ rng: gr, ...GULL, ...o, spread: spread.map((v) => v * k) }), g = flockGap(fl);
          await ctx.yield();
          if (g.gap >= g.ball + 4) { fauna.add(fl); measure.flocks.push({ fl, gap: g.gap, ball: g.ball, name: o.name }); return fl; }
          fl.geometry.dispose(); fl.material.dispose();
        }
        return null;
      };
      {
        const sd = gr.chance(0.5) ? 1 : -1, sC = sMouth - 10;
        planAt(RT, sC, _pl);
        const off = sd * (keyed(FLOOR_W, sC) + 30), cx = _pl.x + Math.cos(_pl.az) * off, cz = _pl.z + Math.sin(_pl.az) * off;
        await addFlock({ name: 'mouth', count: Math.round(16 * dens), center: [cx, Math.max(landH(cx, cz), 8) + 12, cz], radius: 20, height: 4 }, [18, 6, 18]);
      }
      for (const I of nearIsles) if (I.kind === 'cliff' || I.kind === 'light' || I.kind === 'town') await addFlock({ name: I.kind, count: Math.round((I.kind === 'cliff' ? 14 : 9) * dens), center: [I.x, I.H + 9, I.z], radius: I.R * 0.8, height: 8 });
      for (const q of measure.boats.fleet.slice(0, 2)) await addFlock({ name: 'fleet', count: Math.round(7 * dens), center: [q.x, 11, q.z], radius: q.r + 3, height: 2.5 }, [11, 4, 11]);
      { const B = bars.slice(3).sort((a, b) => b.a - a.a)[0] || bars[1]; await addFlock({ name: 'reef', count: Math.round(10 * dens), center: [B.x, 13, B.z], radius: 15, height: 3 }, [12, 4, 12]); }
      // DOLPHINS. The bow-riders are a cast by the metres flown, like her (DECLARED PACING, see the header): two or three,
      // each at HER place and its own 6.5 to 10 m ahead of her middle along her heading and 2.2 to 3 m aside of her (her
      // beam is 1.8 m a side, her stem 5.9 m ahead: never through her hull); each leaps by its own station (hers and its
      // metres ahead: a leap to every 55 to 80 m of it). They join her outside the harbour's mouth and leave her where the
      // open water ends at the ruin's isle.
      const dr = R_.dolph, nRide = dr.int(2, 3), riders = [];
      for (let i = 0; i < nRide; i++) riders.push({ ahead: 6.5 + i * 1.3 + dr.range(0, 0.9), aside: (i % 2 ? -1 : 1) * dr.range(2.2, 3), wl: dr.range(55, 80), ph: dr.range(0, TAU), amp: dr.range(1.1, 1.5) });
      {
        const dg = F.dolphinGeometry({ len: 2.6 }), dm = new THREE.InstancedMesh(dg, new THREE.MeshLambertMaterial({ vertexColors: true }), nRide);
        dm.frustumCulled = false; dm.name = 'bow-riders'; scene.add(dm); disposers.push(() => { dg.dispose(); dm.material.dispose(); });
        const _d1 = new THREE.Vector3(), _d2 = new THREE.Vector3(), _dm = new THREE.Matrix4(), _dq = new THREE.Quaternion(), _de = new THREE.Euler(0, 0, 0, 'YXZ'), _ds = new THREE.Vector3();
        const mJoin = mMouth + 30, mLeave = mArc0 - 70;
        const riderAt = (i, b, time, out) => {
          const q = riders[i], st = b + q.ahead; boatAt(b, _d1); boatAt(b + 4, _d2);
          const hx = _d2.x - _d1.x, hz = _d2.z - _d1.z, hl = Math.hypot(hx, hz) || 1, x = _d1.x + hx / hl * q.ahead - hz / hl * q.aside, z = _d1.z + hz / hl * q.ahead + hx / hl * q.aside, a = st / q.wl * TAU + q.ph;
          const k = smoothstep(mJoin, mJoin + 50, b) * (1 - smoothstep(mLeave, mLeave + 50, b));
          out.x = x; out.z = z; out.y = seaAt(x, z, time) - 0.35 + q.amp * Math.sin(a) - 3 * (1 - k); out.yaw = Math.atan2(hx, hz); out.pitch = -0.42 * Math.cos(a) * k; out.k = k;
          return out;
        };
        const _r = { x: 0, y: 0, z: 0, yaw: 0, pitch: 0, k: 0 };
        measure.cast = { riders, riderAt, mJoin, mLeave };
        updaters.push((dt, time, camera, u, m) => {
          const b = boatStation(m);
          for (let i = 0; i < nRide; i++) {
            riderAt(i, b, time, _r); _de.set(_r.pitch, _r.yaw, 0);
            _dm.compose(_d1.set(_r.x, _r.y, _r.z), _dq.setFromEuler(_de), _ds.setScalar(_r.k > 0.02 ? 1 : 0)); dm.setMatrixAt(i, _dm);
          }
          dm.instanceMatrix.needsUpdate = true;
        });
      }
      await ctx.yield();
      // The pods: two, leaping in rings on the clock, one in each half of the water between the harbour's mouth and the
      // ruin, each kept CLEAR OF HER LANE by metres: drawn whole (its station, its side, 46 to 74 m from her course), then tested: its ring's middle 35 m or more from her
      // course and from the line, deep water round its ring; twenty draws to a pod, and what finds no place is left out
      for (let p = 0; p < 2; p++) for (let k = 0; k < 20; k++) {
        const s = p ? dr.range((sMouth + sArc0) / 2, sArc0 - 120) : dr.range(sMouth + 120, (sMouth + sArc0) / 2), off = (dr.chance(0.5) ? 1 : -1) * dr.range(46, 74), st = mOf(s);
        boatAt(st, _bq0); boatAt(st + 3, _bq1);
        const hx = _bq1.x - _bq0.x, hz = _bq1.z - _bq0.z, hl = Math.hypot(hx, hz) || 1, x = _bq0.x - hz / hl * off, z = _bq0.z + hx / hl * off;
        let gap = lineNear(x, null, z, st - 200, st + 200), deep = 1e9;
        for (let b = st - 150; b <= st + 150; b += 3) { boatAt(b, _bq1); gap = Math.min(gap, Math.hypot(_bq1.x - x, _bq1.z - z)); }
        for (let j = 0; j < 8; j++) deep = Math.min(deep, depthOf(x + Math.cos(j / 8 * TAU) * 13, z + Math.sin(j / 8 * TAU) * 13));
        if (gap < 35 || deep < 8) continue;
        fauna.add(F.makeDolphins({ rng: dr, count: 4, level: 0, length: 2.6, center: [x, 0, z], radius: 13 }));
        measure.pods.push({ x, z, r: 13, gap });
        await ctx.yield();
        break;
      }
      // smoke drifting from the broken towers: the thread seen from the open water, and two lesser ones
      const smr = R_.smoke, tw = hero.towers.filter((q) => q.h > 16).slice(0, 2);
      fxSet.add(fx.makeSmokeColumn({ rng: smr, time: fxTime, position: [towerX + awayX * 34, towerY + 8, towerZ + awayZ * 34], height: 150, radius: [1.6, 15], size: [5, 30], count: 70,
        color: '#3f3d46', colorTop: '#7d7a84', shadowColor: '#1c1a22', ambient: '#141318', opacity: 0.6, rate: 0.045, wind: [0.5, 0, 0.7], bend: 0.4 }));
      for (const q of tw) fxSet.add(fx.makeSmokeColumn({ rng: smr, time: fxTime, position: [towerX + q.x, towerY + q.base + q.h * 0.8, towerZ + q.z], height: 46, radius: [0.8, 7], size: [2.4, 13], count: 40,
        color: '#4a4852', colorTop: '#8a8790', shadowColor: '#201e26', ambient: '#16151b', opacity: 0.5, rate: 0.06, wind: [0.5, 0, 0.7], bend: 0.5 }));
    }
    await ctx.yield();
    // ------------------------------------------------------------ THE BOAT'S WAKE: laid along her own course on the sea's surface
    {
      const NW = boat.wakeXZ.length, WC = boat.wakeCols, rows = NW / WC, wpos = new Float32Array(NW * 3), wuv = new Float32Array(NW * 2), widx = [];
      for (let i = 0; i < rows; i++) for (let j = 0; j < WC; j++) { wuv[(i * WC + j) * 2] = j / (WC - 1) * 2 - 1; wuv[(i * WC + j) * 2 + 1] = i / (rows - 1); }
      for (let i = 0; i < rows - 1; i++) for (let j = 0; j < WC - 1; j++) { const a = i * WC + j, b = a + 1, c = a + WC, d = c + 1; widx.push(a, c, b, b, c, d); }
      const wg = new THREE.BufferGeometry(), wpa = new THREE.BufferAttribute(wpos, 3); wpa.setUsage(THREE.DynamicDrawUsage);
      wg.setAttribute('position', wpa); wg.setAttribute('aUv', new THREE.BufferAttribute(wuv, 2)); wg.setIndex(widx);
      wg.boundingSphere = new THREE.Sphere(new THREE.Vector3(), Infinity);
      const wU = { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: U.uTime, uSunCol: U.uSunCol, uSkyCol: U.uSkyCol, uWay: { value: 0 } };
      const wmat = new THREE.ShaderMaterial({ uniforms: wU, transparent: true, depthWrite: false, fog: true, side: THREE.DoubleSide,
        vertexShader: /* glsl */`attribute vec2 aUv; varying vec2 vUv; varying vec3 vW;
#include <fog_pars_vertex>
void main(){ vUv = aUv; vec4 wp = modelMatrix*vec4(position,1.); vW = wp.xyz; vec4 mvPosition = viewMatrix*wp; gl_Position = projectionMatrix*mvPosition;
#include <fog_vertex>
}`,
        fragmentShader: /* glsl */`uniform float uTime, uWay; uniform vec3 uSunCol, uSkyCol; varying vec2 vUv; varying vec3 vW;
${fx.GLSL_NOISE}
#include <fog_pars_fragment>
void main(){
  float ax = abs(vUv.x), back = clamp(vUv.y, 0., 1.);
  // FOAM, one V: whole and bright under her stern, soft at both edges, broken into patches that thin as they are left
  // astern (the patches lie on the water: the noise is the sea's own place, not hers), gone within three boat lengths
  float across = 1.-smoothstep(.1, 1., ax); across *= across*(3.-2.*across);
  float n = vnoise(vW.xz*.8+vec2(0.,uTime*.22))*.5+vnoise(vW.xz*2.3-vec2(uTime*.18,0.))*.32+vnoise(vW.xz*6.1)*.18;
  float brk = smoothstep(mix(.16,.56,back), mix(.42,.8,back), n);
  float along = pow(1.-back, 1.5)*smoothstep(0.,.06,back);
  float a = clamp(across*brk*along, 0., 1.)*uWay*.85;
  gl_FragColor = vec4(vec3(.92,.96,.95)*(uSkyCol*1.3+uSunCol*.55), a);
  #include <fog_fragment>
}` });
      const wake = new THREE.Mesh(wg, wmat); wake.renderOrder = 2; wake.name = 'wake'; scene.add(wake);
      const _w = new THREE.Vector3(), _w2 = new THREE.Vector3(), BS = boat.object.scale.x;
      updaters.push((dt, time, camera, u, m) => {
        const b = boatStation(m);
        // her way: 0 at rest, 1 running with us (the rate of her station by the metres flown)
        wU.uWay.value = boatWay(m);
        for (let i = 0; i < rows; i++) {
          const back = -boat.wakeXZ[i * WC][1] * BS;
          boatAt(Math.max(0, b - back), _w); boatAt(Math.max(0, b - back) + 2, _w2);
          const tx = _w2.x - _w.x, tz = _w2.z - _w.z, tl = Math.hypot(tx, tz) || 1;
          for (let j = 0; j < WC; j++) {
            const ac = boat.wakeXZ[i * WC + j][0] * BS, x = _w.x - tz / tl * ac, z = _w.z + tx / tl * ac, k = (i * WC + j) * 3;
            wpos[k] = x; wpos[k + 1] = seaAt(x, z, time) + 0.07; wpos[k + 2] = z;
          }
        }
        wpa.needsUpdate = true;
      });
    }
    // ------------------------------------------------------------ THE WEATHER OF THE CROSSING: clear, or a squall line with a rainbow
    if (squall) {
      // the squall stands off the weave opposite the day's sun (which is lower in this weather: 28 degrees), 640 m from a
      // drawn place of the weave: three curtains of rain under the heavier cloud, and the bow in them
      const sd = skies[1].sunDirection, hl = Math.hypot(sd.x, sd.z) || 1;
      planAt(RT, lerp(sMouth + 120, sIsles1, squallAt), _pl);
      const cx = _pl.x - sd.x / hl * 640, cz = _pl.z - sd.z / hl * 640, ax = -sd.z / hl, az = sd.x / hl;
      const rp = [], ruv = [], ri = [];
      for (let k = 0; k < 3; k++) {
        const off = (k - 1) * 150, back = k * 70, half = 380 - k * 40, n = rp.length / 3;
        for (const [u, v] of [[0, 0], [1, 0], [1, 1], [0, 1]]) { rp.push(cx + ax * (off + (u * 2 - 1) * half) - sd.x / hl * back, v * 430, cz + az * (off + (u * 2 - 1) * half) - sd.z / hl * back); ruv.push(u, v); }
        ri.push(n, n + 1, n + 2, n, n + 2, n + 3);
      }
      const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.Float32BufferAttribute(rp, 3)); rg.setAttribute('uv', new THREE.Float32BufferAttribute(ruv, 2)); rg.setIndex(ri);
      const rU = { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: U.uTime, uSkyCol: U.uSkyCol, uAmt: { value: 0 } };
      const rain = new THREE.Mesh(rg, new THREE.ShaderMaterial({ uniforms: rU, transparent: true, depthWrite: false, fog: true, side: THREE.DoubleSide,
        vertexShader: /* glsl */`varying vec2 vUv; varying vec3 vW;
#include <fog_pars_vertex>
void main(){ vUv = uv; vec4 wp = modelMatrix*vec4(position,1.); vW = wp.xyz; vec4 mvPosition = viewMatrix*wp; gl_Position = projectionMatrix*mvPosition;
#include <fog_vertex>
}`,
        fragmentShader: /* glsl */`uniform float uTime, uAmt; uniform vec3 uSkyCol; varying vec2 vUv; varying vec3 vW;
${fx.GLSL_NOISE}
#include <fog_pars_fragment>
void main(){
  // slanting streaks of rain, thick in the middle of the curtain, thinning to its sides and toward the sea
  float sx = (vW.x+vW.z)*.02+vW.y*.006;
  float streak = .55+.45*vnoise(vec2(sx*3., vW.y*.012+uTime*.5));
  float body = smoothstep(0.,.3,vUv.x)*(1.-smoothstep(.7,1.,vUv.x))*smoothstep(0.,.12,vUv.y)*(.45+.55*smoothstep(.1,.9,vUv.y));
  float bank = smoothstep(.3,.75, vnoise(vec2(sx*.35, 2.3)));
  gl_FragColor = vec4(uSkyCol*vec3(.5,.56,.66), clamp(body*streak*(.35+.65*bank)*.5*uAmt, 0., 1.));
  #include <fog_fragment>
}` }));
      rain.renderOrder = 3; rain.name = 'rain'; scene.add(rain);
      const bow = fx.makeRainbow({ sunDir: sd, intensity: 0 }); scene.add(bow.object);
      updaters.push((dt, time, camera, u, m) => {
        // shown while the day's light is on the sea (the day sky's share of the blend)
        const st = skyAt(m), w = st.b === 1 ? st.t : st.a === 1 ? 1 - st.t : 0;
        rU.uAmt.value = w; bow.uniforms.uIntensity.value = 0.3 * w;
      });
    }
    // ---- LIFE GOES HERE

    // ------------------------------------------------------------ PACE, GAZE, THE FRAME
    // paces at places (metres a second; the engine scales the whole to the duration)
    const PACE = [[0, 26], [mMouth, 26], [mMouth + 120, 40], [mIsles1 - 20, 40], [mIsles1 + 60, 48], [mArc0 - 150, 48], [mArc0, 28], [mPass1, 28], [mPass1 + 100, 36], [L, 36]];
    const pace = (u) => lin(PACE, clamp(u, 0, 1) * L) / 34;
    // the gaze: one pull at a time, each target found from the metres flown inside its own function
    const _g1 = new THREE.Vector3(), _g2 = new THREE.Vector3(), _g3 = new THREE.Vector3();
    const mG1 = mOf(160), G_HAND = 150, G_RAMP = 110;
    const pois = [
      // G1 the boat: before us and below on the water, from the village to the hand-over before the dragon's arc. The
      // hand-over is one shared stretch (mArc0 - 150 to mArc0 - 40, 110 m): her out-ramp and the dragon's in-ramp have the
      // same span and the same shape, so that the two never add to more than the larger (0.8)
      { at: (time, u) => { boatAt(boatStation(clamp(u, 0, 1) * L), _g1); _g1.y = 2.5; return _g1; }, from: mG1 / L, to: (mArc0 - G_HAND + G_RAMP) / L, weight: 0.45, fade: G_RAMP / (mArc0 - G_HAND + G_RAMP - mG1) },
      // G2 the old dragon: the tower's top, and the head as it rears; let go 60 m into the pass (its bearing is 75 degrees 20 m in)
      { at: (time, u) => { const st = dragonAt(clamp(u, 0, 1) * L); _g2.set(towerX, towerY + 44 + 24 * st.rise, towerZ); return _g2; }, from: (mArc0 - G_HAND) / L, to: (mArc1 + 60) / L, weight: 0.8, fade: G_RAMP / (mArc1 + 60 - mArc0 + G_HAND) },
      // G3 the ring in the shallows: its window by places, from 70 m past the pass to the ring itself; its ramps 90 m
      { at: () => _g3.copy(endP), from: (mPass1 + 70) / L, to: 1, weight: 0.5, fade: 90 / (L - mPass1 - 70) },
    ];
    const _bq = new THREE.Vector3(), _bq2 = new THREE.Vector3(), _col = new THREE.Color(), _ride = { x: 0, y: 0, z: 0, pitch: 0, yaw: 0, roll: 0, afloat: 1, dep: 0 };
    // HER RIDE at a metre flown: on her course, riding the sea as the sea is DRAWN there (the kit's waves damped as its
    // shader damps them over shoals); and her way decides nothing by itself: her keel cannot go under the sand, so where
    // the water is shallower than her draught (the bar she takes, raised to it) she sits on the sand, a little down by the
    // stern and heeled to the dragon's side, and her roll and her pitch still as she takes the ground
    const rideAt = (m, time, o) => {
      const b = boatStation(m);
      boatAt(b, _bq); boatAt(b + 4, _bq2);
      const hx = _bq2.x - _bq.x, hz = _bq2.z - _bq.z, hl = Math.hypot(hx, hz) || 1, y0 = seaAt(_bq.x, _bq.z, time), y1 = seaAt(_bq.x + hx / hl * 4, _bq.z + hz / hl * 4, time), y2 = seaAt(_bq.x - hx / hl * 4, _bq.z - hz / hl * 4, time);
      const dep = depthOf(_bq.x, _bq.z), afloat = smoothstep(-0.1, 0.5, dep - DRAUGHT);
      o.x = _bq.x; o.z = _bq.z; o.y = lerp(DRAUGHT - dep, (y0 + y1 + y2) / 3 - 0.05, afloat); o.sea = (y0 + y1 + y2) / 3; o.raw = ocean.heightAt(_bq.x, _bq.z, time);
      o.pitch = -Math.atan2(y1 - y2, 8) * 0.8 * afloat - 0.035 * (1 - afloat); o.yaw = Math.atan2(hx, hz); o.roll = 0.05 * Math.sin(time * 0.9) * afloat + 0.085 * dSide * (1 - afloat);
      o.afloat = afloat; o.dep = dep; o.b = b;
      return o;
    };
    const update = (dt, time, camera, u) => {
      const m = clamp(u || 0, 0, 1) * L, st = skyAt(m), A = skies[st.a], B = skies[st.b], t = A === B ? 0 : st.t;
      for (const s of skyList) { const on = s === A || (s === B && t > 0); s.object.visible = on; if (on) { s.setOpacity(s === A ? 1 : t); s.update(dt, time, camera); } }
      rig.match(A, B, t).update(dt, time, camera); clouds.match(A, B, t).update(dt, time, camera);
      scene.fog.color.copy(A.fogColor).lerp(B.fogColor, t); scene.fog.density = lerp(fogD[st.a], fogD[st.b], t);
      blendLight(L_, Ls[st.a], Ls[st.b], t);
      // the lands' and the dragons' light: the rig's, as a lit surface takes it (over pi)
      U.uSunDir.value.copy(rig.direction); U.uSunCol.value.copy(rig.sun.color).multiplyScalar(rig.sun.intensity / Math.PI);
      U.uSkyCol.value.copy(rig.hemi.color).multiplyScalar(rig.hemi.intensity / Math.PI); U.uGndCol.value.copy(rig.hemi.groundColor).multiplyScalar(rig.hemi.intensity / Math.PI);
      U.uTime.value = time; U.uCloud.value = clamp(L_.cloud.x * 2, 0, 1) * (1 - smoothstep(FADE[1][0], FADE[1][1], m));
      // the shoal's water pales to sand over the last arc
      ocean.uniforms.uShallowColor.value.copy(SHALLOW_DAY).lerp(SHALLOW_SAND, smoothstep(mPass1 - 40, mPass1 + 120, m));
      ocean.update(dt, time, camera);
      // the old dragon
      const ds = dragonAt(m);
      hero.update(dt, time, camera, ds);
      U.uFire.value.set(hero.anchors.fireAt.x, hero.anchors.fireAt.y, hero.anchors.fireAt.z, ds.fire * 1.2);
      youngAt(m, time);
      rideAt(m, time, _ride);
      boat.object.position.set(_ride.x, _ride.y, _ride.z); boat.object.rotation.set(_ride.pitch, _ride.yaw, _ride.roll, 'YXZ');
      boat.sailU.uSailT.value = time;
      for (let i = 0; i < updaters.length; i++) updaters[i](dt, time, camera, u, m);
    };
    for (const s of skyList) { await s.prewarm(ctx.renderer, null, scene); await ctx.yield(); }
    return {
      scene, path, duration: DUR, pace, pois,
      camera: { fov: 62, near: 0.5, far: 4300, lookAhead: 40, sway: 0.6, bank: 0.6 },
      portal: { shape: 'circle', radius: 8, color: '#ffd28a', glow: 1, revealDistance: 300 },
      post: { exposure: night ? 1.25 : 1, bloom: { strength: 0.4, radius: 0.6, threshold: 0.92 } },
      update, measure: Object.assign(measure, { landH, drawnH, depthAt, depthOf, seaAt, huts, RT, mOf, boatStation, boatAt, boatWay, rideAt, bars, barH, ocean, L, mGround, mMouth, mPass1, mArc0, DRAUGHT, mir, squall }),
      dispose() { for (const s of skyList) s.dispose(); for (const d of disposers) d(); },
    };
  },
};
