// GREEN GATE PAST THE POPPIES: THE FIELD PART. The land and its far hills, the road of worn brick, the poppies in
// three layers, the farmland and everything that stands outside the wall. The world file joins it to the city part.
// Metres; y up; the gate's threshold is the origin; the wall's outer face is the plane z = 0; the country lies on -z.
// SOURCES: L. Frank Baum's prose of 1900 and the real world (real field poppies, real handmade brick paving, real
// round farm buildings, real dry-stone walls). Words alone.
//
// EVERY DRAW comes from a name stream: makeRng(hashSeed(name + ':' + ctx.seed)). Everything is made in build; the
// clock only moves uniforms. NOTHING here is placed, sized, shown, hidden, lit or moved by the lens, the frame, the
// gaze, a seed's number or the wall clock. THE ONE TYPED CHOICE BY PLACE: the standing blooms (P2) stand
// within 28 m either side of the ROAD's centre line, on every seed alike, because that is where the road runs.
// What reads the eye here (the world's head carries the whole list): the built textures' mipmaps and anisotropic
// filtering, one fwidth filter in the ground's paint (crop rows, the bloom mask and the apron's courses give way
// to their own mean where a pixel is larger than they are), the air by distance (scene fog), the kit's near fade of the petals,
// and one level of detail by where the eye is, in TWO RULES: (1) a chunk of the standing blooms' cards farther than
// CARD_FAR (160 m) from the eye's place is not drawn, a chunk of the low dress (verge tufts, crop rows, the lane's
// fern and parsley) farther than DRESS_FAR (100 m); a chunk of the near ground's
// cards (grass, crops, flowers: they stand within NEAR_REACH, 40 m, of the ROAD'S centre line, full within NEAR_IN,
// 12 m) farther than NEAR_FAR (80 m; the thinner outer bands NEAR_OUT, 60 m) is not drawn; (2) every card FADES IN
// by its alpha cut over the last FADE (20 m) before its chunk's reach, from its own distance from the eye's place,
// so no block of cards comes on at once.
import * as THREE from 'three';
import * as flora from '../kit/flora.js';
import * as fx from '../kit/fx.js';
import { buildLeafCrowns } from './green-gate-past-the-poppies-leaf.js';

// ---- the frame (design sections 3 and 14, R1). The knots of the road's centre line (x, z); the last four lie on
// x = 0, so the last 65 m run dead straight along +z.
export const KNOTS = [[-400, -770], [-310, -700], [-290, -610], [-350, -520], [-330, -430], [-240, -380], [-170, -300],
  [-180, -225], [-120, -168], [-37, -136], [-18, -124], [-5, -106], [0, -84], [0, -62], [0, -30], [0, 3]];
// THE DEALT PLACES (land.places; prepareField hands them to the world file): ROAD METRES as the land deals them or the
// part builds them this build, so each falls on its own metre on every seed. bridge: the brook's crossing, the lowest
// fold of the plain under the road between the entry and the field's edge (BRIDGE_REACH clear of both: the hump's
// 15 m and a farmyard's 25). edge: where the road crosses the dry-stone wall, the first metre that stands WALL_BEFORE
// metres before the cover law's boundary (the other colours' drifts begin 18 m before it; the wall stands 10 m
// before them). lane0, lane1: the sunk lane's ends, where the uncut land stands 1.5 m over the brick. sward: the
// first metre from which the cover law's envelope is nothing. court: the apron's outer edge (APRON metres before the
// road's end). farm: the first farmstead that stands by the road, or null. No road metre is typed in this part but
// the ridge's own crossing (RIDGE.at: the land's form) and margins counted from these places.
export const WALL_BEFORE = 28, BRIDGE_REACH = 40, PARAPET = 10, BANKS = 30, APRON = 30;
// a monotone cubic through keys [x, y] (Fritsch and Carlson's tangents: it passes each key at the slope the keys either
// side give it and never overshoots)
const monoCubic = (K) => {
  const n = K.length, d = [], m = new Array(n).fill(0);
  for (let i = 0; i < n - 1; i++) d.push((K[i + 1][1] - K[i][1]) / (K[i + 1][0] - K[i][0]));
  m[0] = d[0]; m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : 2 * d[i - 1] * d[i] / (d[i - 1] + d[i]);
  return (x) => {
    let k = 0; while (k < n - 2 && K[k + 1][0] < x) k++;
    const h = K[k + 1][0] - K[k][0], u = sat((x - K[k][0]) / h), u2 = u * u, u3 = u2 * u;
    return (2 * u3 - 3 * u2 + 1) * K[k][1] + (u3 - 2 * u2 + u) * h * m[k] + (3 * u2 - 2 * u3) * K[k + 1][1] + (u3 - u2) * h * m[k + 1];
  };
};
// a seeded walk over a stretch [a, b): `per` stands to 100 m, none nearer the last than `gap`; the first stand is drawn
// over the whole first gap, so a family begins on its own metre on every seed
const walk = (rng, a, b, per, gap) => { const mean = 100 / per, out = []; for (let s = a + rng() * mean; s < b; s += gap + rng() * 2 * (mean - gap)) out.push(s); return out; };
export const BEHIND = 400;                       // the road and its farmland run on behind the entry
export const EYE = 4.5;                          // the eye's height over the brick
export const RING = { x: 0, y: 9.5, z: 3, r: 7 };
// THE EYE'S HEIGHT, BY PLACES (the lead's ruling of the fifth mend, which replaces the design's V2). Over every stretch
// of open ground the eye flies OPEN = HEAD + 2 * AIR over the ground UNDER THE FLOWN LINE: HEAD 1.2 m is the tallest
// standing thing beside the line (a fence rail; crop and flower heads stand about 1.1 m), AIR 1 m of clear air over
// it, and a metre more. It rises only where the land asks: (1) over any crest (the little bridge's hump, the rise at
// the field's edge) by exactly what keeps OPEN over the ground under it (makeLand: the crest's own deficit, eased
// over 12 m either way), and over a BUILT thing under or within CLEAR_BY metres of the flown line (a fence, the wall's
// posts) by what keeps CLEAR metres of air over its top, eased the same way; (2) into the sunk lane, where it keeps EYE over the brick as before, the rise laid over one
// old oak's crown (CROWN, 24 m) before the lane's first metre AS DEALT, and the fall over the MOUTH metres (56) past
// its last metre as dealt, in which the mouth's great trees stand; a monotone cubic through those four keys; (3) in ONE ramp to the ring's own height
// that begins where the flown line begins to come in to the brick's centre (FLOWN_EASE before the sward's edge as dealt) and ENDS two of
// the route's chords before its last LEVEL metres, so the curve through the route's points is level over them at the ring's centre height.
export const HEAD = 1.2, AIR = 1.0, OPEN = HEAD + 2 * AIR, LEVEL = 60, CHORD = 6;   // (LEVEL: the route's last metres, straight and level at the ring's centre height; CHORD: the route's points stand every 6 m of the road)
const CROWN = 24, MOUTH = 56, CLEAR = 2.1, CLEAR_BY = 3, POST = 1.3, PIER = 1.9;   // (POST: a fence post's top over the ground; PIER: the wall's two stone posts with their caps; CLEAR: 2 m of air and a tenth for the ground's own wave)
// THE FLOWN LINE, BY ONE LAW OF THE ROAD ITSELF (laid each build in makeLand; land.flown(s): metres to the RIGHT of the
// road's heading). The line runs WIDE of every bend by the bend's own rise over a chord of FLOWN_CHORD metres: the
// road's curvature, smoothed over that chord, times the chord squared over eight; never more than FLOWN_MOST (a
// farmstead by the road keeps its house and shed 9.9 m and more from the centre line: the line keeps CLEAR_BY and more
// from them). It keeps the brick's centre on the bridge (its parapets' length), in the sunk lane and from the sward's
// edge on, coming in to the centre and leaving it over FLOWN_EASE metres. Every tree's law keeps its crown's reach
// and 3 m from THIS line.
export const FLOWN_CHORD = 70, FLOWN_MOST = 6, FLOWN_EASE = 40;
// THE RIDGE (R3): its crest line crosses the road at the metre `at`, square to the road; `high`
// over the plain, level for `flat` metres either side of the crest line and down by `foot`; the road goes through it
// in a cut `cut` deep (the sunk lane), so the brick keeps its grade.
export const RIDGE = { at: 484, high: 12, cut: 11, flat: 34, foot: 70 };
export const BAND = 28, BAND_FADE = 8;           // P2: metres either side of the road's centre line, and its thinning
const SHOULDER = 3.3, SLOPE = Math.tan(35 * Math.PI / 180), REACH = 90, KNOLL_HIGH = 6.5;
const TAU = Math.PI * 2;
const { LinearFilter: MAG_FILTER, LinearMipmapLinearFilter: MIP_FILTER } = THREE;   // (the textures' filters)
const sat = (x) => Math.min(1, Math.max(0, x));
const sstep = (a, b, x) => { const t = sat((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a + (b - a) * t;
export const streamOf = (ctx, name) => ctx.core.makeRng(ctx.core.hashSeed(name + ':' + ctx.seed));

// ---- THE ROAD'S CENTRE LINE: a centripetal Catmull-Rom curve through the knots (the kit's own curve of a route), so
// the last three pieces, whose knots lie in one line, are straight. Tabled at every metre from BEHIND metres before
// the first knot (straight on the first knot's own heading: the entry frame's axis) to the last knot. knotS: the
// metre of each knot.
export function layRoad() {
  const K = KNOTS, n = K.length, curve = new THREE.CatmullRomCurve3(K.map((k) => new THREE.Vector3(k[0], 0, k[1])), false, 'centripetal', 0.5);
  const px = [], pz = [], cum = [0], M = 240, v = new THREE.Vector3(), knotI = [];
  for (let i = 0; i < n - 1; i++) { knotI.push(px.length); for (let j = 0; j < M; j++) { curve.getPoint((i + j / M) / (n - 1), v); px.push(v.x); pz.push(v.z); } }
  knotI.push(px.length); px.push(K[n - 1][0]); pz.push(K[n - 1][1]);
  const l0 = Math.hypot(px[1] - px[0], pz[1] - pz[0]), dir = [[(px[1] - px[0]) / l0, (pz[1] - pz[0]) / l0]];
  for (let i = 1; i < px.length; i++) cum.push(cum[i - 1] + Math.hypot(px[i] - px[i - 1], pz[i] - pz[i - 1]));
  const L = cum[cum.length - 1], N = Math.ceil(L) + BEHIND + 1, X = new Float32Array(N), Z = new Float32Array(N), TX = new Float32Array(N), TZ = new Float32Array(N);
  let k = 0;
  for (let i = 0; i < N; i++) {
    const s = Math.min(L, i - BEHIND);
    if (s <= 0) { X[i] = K[0][0] + dir[0][0] * s; Z[i] = K[0][1] + dir[0][1] * s; continue; }
    while (k < cum.length - 2 && cum[k + 1] < s) k++;
    const t = (s - cum[k]) / Math.max(1e-9, cum[k + 1] - cum[k]); X[i] = mix(px[k], px[k + 1], t); Z[i] = mix(pz[k], pz[k + 1], t);
  }
  for (let i = 0; i < N; i++) {
    const a = Math.max(0, i - 1), b = Math.min(N - 2, i + 1), dx = X[b] - X[a], dz = Z[b] - Z[a], l = Math.hypot(dx, dz) || 1;
    TX[i] = dx / l; TZ[i] = dz / l;
  }
  TX[N - 1] = 0; TZ[N - 1] = 1;
  const road = {
    L, N, X, Z, TX, TZ, knotS: knotI.map((i) => cum[i]),
    // the place and heading at metre s of the road (clamped to the table)
    at(s, out = {}) {
      const f = Math.min(N - 1.001, Math.max(0, s + BEHIND)), i = Math.floor(f), t = f - i;
      out.x = mix(X[i], X[i + 1], t); out.z = mix(Z[i], Z[i + 1], t); out.tx = mix(TX[i], TX[i + 1], t); out.tz = mix(TZ[i], TZ[i + 1], t);
      return out;
    },
    // the nearest place of the centre line to (x, z): its metre s and the signed offset d (positive to the right of
    // the heading). hint: a metre near which to search (a narrow search); without it the whole table is read coarsely.
    near(x, z, hint, out = {}) {
      let bi = 0, bd = Infinity, lo = 0, hi = N - 1, step = 6;
      if (hint !== undefined) { lo = Math.max(0, Math.floor(hint + BEHIND) - 14); hi = Math.min(N - 1, lo + 28); step = 1; }
      for (let i = lo; i <= hi; i += step) { const dx = x - X[i], dz = z - Z[i], d = dx * dx + dz * dz; if (d < bd) { bd = d; bi = i; } }
      if (step > 1) { const a = Math.max(0, bi - step), b = Math.min(N - 1, bi + step); for (let i = a; i <= b; i++) { const dx = x - X[i], dz = z - Z[i], d = dx * dx + dz * dz; if (d < bd) { bd = d; bi = i; } } }
      const along = (x - X[bi]) * TX[bi] + (z - Z[bi]) * TZ[bi], f = Math.min(N - 1, Math.max(0, bi + along)), i = Math.min(N - 2, Math.floor(f)), t = f - i;
      const cx = mix(X[i], X[i + 1], t), cz = mix(Z[i], Z[i + 1], t), tx = mix(TX[i], TX[i + 1], t), tz = mix(TZ[i], TZ[i + 1], t);
      out.s = f - BEHIND; out.d = (x - cx) * -tz + (z - cz) * tx; out.dist = Math.hypot(x - cx, z - cz);
      return out;
    },
  };
  return road;
}

// ---- THE TONE FIELD: one tiling array of smooth noise, four channels, 256 square (stream 'gate-tone'). It is the
// source of every tone field, of the drifts in the poppy cover, of the wind's gust bands and of the cloud shadows,
// on the card (as a texture) and here (bilinear, the same law), so that what is counted and what is drawn agree.
export async function makeTone(ctx) {            // (in short steps: it hands the page back after every channel)
  const rng = streamOf(ctx, 'gate-tone'), S = 256, data = new Uint8Array(S * S * 4), lat = [16, 32, 64], wt = [0.55, 0.3, 0.15];
  // (once for each lattice: every texel's cell, the next cell round and its eased share, the same across and down)
  const acc = new Float64Array(S * S), cells = lat.map((n) => { const i0 = new Int32Array(S), i1 = new Int32Array(S), t = new Float64Array(S); for (let x = 0; x < S; x++) { const f = x / S * n, i = Math.floor(f), e = f - i; i0[x] = i; i1[x] = (i + 1) % n; t[x] = e * e * (3 - 2 * e); } return { i0, i1, t }; });
  for (let ch = 0; ch < 4; ch++) {
    const grids = lat.map((n) => { const g = new Float32Array(n * n); for (let i = 0; i < g.length; i++) g[i] = rng(); return g; });
    acc.fill(0);                                   // (each lattice in turn over the whole square, its cells and eased shares read from the tables: no call to a texel)
    for (let o = 0; o < 3; o++) {
      const n = lat[o], g = grids[o], w = wt[o], i0 = cells[o].i0, i1 = cells[o].i1, t = cells[o].t;
      for (let y = 0; y < S; y++) {
        const r0 = i0[y] * n, r1 = i1[y] * n, ty = t[y], row = y * S;
        for (let x = 0; x < S; x++) { const a = i0[x], b = i1[x], tx = t[x], p = g[r0 + a] + (g[r0 + b] - g[r0 + a]) * tx, q = g[r1 + a] + (g[r1 + b] - g[r1 + a]) * tx; acc[row + x] += w * (p + (q - p) * ty); }
      }
    }
    for (let i = 0; i < S * S; i++) { let v = (acc[i] - 0.5) * 1.9 + 0.5; v = v < 0 ? 0 : v > 1 ? 1 : v; data[i * 4 + ch] = Math.round(255 * v); }
    await ctx.yield();
  }
  const texture = new THREE.DataTexture(data, S, S, THREE.RGBAFormat);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping; texture.magFilter = MAG_FILTER; texture.minFilter = MIP_FILTER;
  texture.generateMipmaps = true; texture.needsUpdate = true;
  // the same bilinear read as the card's (texel centres at half texels, wrapped), channel ch, 0..1
  const at = (u, v, ch) => {
    const fx0 = u * S - 0.5, fy0 = v * S - 0.5, ix = Math.floor(fx0), iy = Math.floor(fy0), tx = fx0 - ix, ty = fy0 - iy;
    const x0 = ix & 255, y0 = iy & 255, x1 = (x0 + 1) & 255, y1 = (y0 + 1) & 255;      // (wrapped: S is 256)
    return mix(mix(data[(y0 * S + x0) * 4 + ch], data[(y0 * S + x1) * 4 + ch], tx), mix(data[(y1 * S + x0) * 4 + ch], data[(y1 * S + x1) * 4 + ch], tx), ty) / 255;
  };
  return { texture, data, at };
}

// ---- THE LAND (design sections 4 and 14): h0, the plain with its low swells (five broad waves from the stream
// 'gate-land': 3 to 6 m from trough to crest through the farmland and the field, lying low round the lane and the
// knoll past its mouth; level on the sward under the wall and behind it), ONE RIDGE that crosses the road at the metre RIDGE.at, the road's own grade, and the ground as it
// is cut and filled along the road (banks of 35 degrees: where the ridge stands over the road they are the sunk
// lane's).
// ---- THE COVER FIELD c (design sections 6 and 14, R3, R4, R7): ONE law for the ground's scarlet, the standing
// blooms and the petals. The boundary lies at about z -535; c is 1 from z -470 to z -130 and 0 from z -100 on (the
// sward). On the sunk lane's banks and 10 m beyond their rims c is 0: grass, fern and thorn. Along the boundary
// Baum's other colours stand in DRIFTS of 5 to 15 m, each mostly of one colour, scattered by a tone field; a drift
// stands IN the poppies' place (c gives way to it), so its colour is never mixed through the scarlet.
const REACH_K = 1.2;                             // (F8: a reach of grass takes 0.84 of the scarlet off the road, 1.2 of the lanes' own share there, and 0.3 beside it)
const TONGUE = 120, TONGUE_RISE = 40;            // (F8. TONGUE: the deepest a tongue of grass reaches into the field from the cover law's bound, under one tongue's own breadth (the tone field's 150 m), so none is deeper than broad; TONGUE_RISE: the metres over which the scarlet thickens behind a tongue, an outlier's breadth and a half)
export function makeLand(ctx, road, tone) {
  const rng = streamOf(ctx, 'gate-land'), waves = [];
  for (let i = 0; i < 5; i++) { const th = rng.range(0, Math.PI), lam = rng.range(170, 430), a = rng.range(0.7, 1.3); waves.push([Math.cos(th) * TAU / lam, Math.sin(th) * TAU / lam, rng.range(0, TAU), a]); }
  const ridgePhase = rng.range(0, TAU);
  const fr = streamOf(ctx, 'gate-field'), edge = [fr.range(0, TAU), fr.range(0, TAU), fr.range(0, TAU)];
  const R0 = road.at(RIDGE.at), ux = -R0.tz, uz = R0.tx;                        // along the crest line (the road's own normal)
  const zS = (x) => -535 + 12 * (0.6 * Math.sin(x * TAU / 700 + edge[0]) + 0.4 * Math.sin(x * TAU / 260 + edge[1])), zN = () => -100;   // (the cover law's two bounds)
  let bridge = 0, fold = 0, edgeS = 0, lane0 = RIDGE.at, lane1 = RIDGE.at, sward = 0;      // (the dealt places: laid below)
  // (round the lane and the knoll past its mouth the swells lie low, so that the lane's floor and the knoll's crest
  // stand alike in every dealt land: there the ridge, the knoll and the lane's shoulders are the land's form)
  const M0 = road.at(RIDGE.at + 70);
  const swell = (x, z) => {
    let h = 0; for (const w of waves) h += w[3] * Math.sin(x * w[0] + z * w[1] + w[2]);
    const mx = x - M0.x, mz = z - M0.z; h *= 1 - 0.85 * (1 - sstep(170, 330, Math.sqrt(mx * mx + mz * mz)));
    return Math.max(0.2, 3.8 + 0.95 * h) * sstep(-70, -270, z);
  };
  // THE SWELLS' HEIGHTS ARE WORKED OUT ONCE AND SHARED (by the strip, the far sheet, the cards and all that stands):
  // a grid of GRID metres over the country the road crosses (GX0, GZ0 and GN cells each way: the knots' own span
  // and the dressed reach beside them), filled as it is read and read between its four corners. The swells are 170
  // to 430 m long, so a 4 m grid stands within a centimetre of the law itself; beyond the grid the law is read.
  const GRID = 4, GN = 384, GX0 = -1024, GZ0 = -1280, grid = new Float32Array(GN * GN).fill(NaN);
  const plain = (x, z) => {
    const fx = (x - GX0) / GRID, fz = (z - GZ0) / GRID, i = Math.floor(fx), j = Math.floor(fz);
    if (i < 0 || j < 0 || i > GN - 2 || j > GN - 2) return swell(x, z);
    const k = j * GN + i, tx = fx - i, tz = fz - j;
    let a = grid[k], b = grid[k + 1], c = grid[k + GN], d = grid[k + GN + 1];
    if (a !== a) a = grid[k] = swell(GX0 + i * GRID, GZ0 + j * GRID);
    if (b !== b) b = grid[k + 1] = swell(GX0 + (i + 1) * GRID, GZ0 + j * GRID);
    if (c !== c) c = grid[k + GN] = swell(GX0 + i * GRID, GZ0 + (j + 1) * GRID);
    if (d !== d) d = grid[k + GN + 1] = swell(GX0 + (i + 1) * GRID, GZ0 + (j + 1) * GRID);
    return (a + (b - a) * tx) * (1 - tz) + (c + (d - c) * tx) * tz;
  };
  const ridge = (x, z) => {
    const dx = x - R0.x, dz = z - R0.z, p = dx * ux + dz * uz, ap = Math.abs(p), q = dx * uz - dz * ux + 9 * Math.sin(p / 130 + ridgePhase);
    if (ap > 950 || Math.abs(q) > RIDGE.foot + 1) return 0;
    return RIDGE.high * (1 - sstep(RIDGE.flat, RIDGE.foot, Math.abs(q))) * (1 - sstep(520, 940, ap)) * (1 - 0.12 * (0.5 - 0.5 * Math.cos(p / 75)) * (0.6 + 0.4 * Math.sin(p / 211 + ridgePhase)));
  };
  // (G3: THE RIDGE IS A GREEN DOWN: the scarlet stops at its foot, so no red lies stretched on a slope; the paint's gateRidge is the same law)
  const ridgeK = (x, z) => { const dx = x - R0.x, dz = z - R0.z, p = dx * ux + dz * uz, q = dx * uz - dz * ux + 9 * Math.sin(p / 130 + ridgePhase); return (1 - sstep(RIDGE.flat + 14, RIDGE.foot + 22, Math.abs(q))) * (1 - sstep(520, 940, Math.abs(p))); };
  // the brook's notch: it crosses the road square at the bridge's metre, a few metres of water either side
  const notch = (s, d) => { const a = Math.abs(d); if (a > 31) return 0; const ds = s - (bridge + 2.5 * Math.sin(d / 9)); return 1.25 * Math.exp(-(ds * ds) / 4.84) * (1 - sstep(23, 30, a)); };
  // the road's grade at every metre: the plain under the centre line, smoothed over 20 m either way; through the
  // ridge it rises only by what the cut leaves, and the bridge has its hump
  const N = road.N, raw = new Float32Array(N), rdg = new Float32Array(N), RY = new Float32Array(N), EY = new Float32Array(N);
  for (let i = 0; i < N; i++) { raw[i] = plain(road.X[i], road.Z[i]); rdg[i] = Math.max(0, ridge(road.X[i], road.Z[i]) - RIDGE.cut); }
  const box = (src, i, w) => { let a = 0, n = 0; for (let j = Math.max(0, i - w); j <= Math.min(N - 1, i + w); j++) { a += src[j]; n++; } return a / n; };
  // THE EDGE AND THE BRIDGE AS DEALT (see THE DEALT PLACES)
  while (edgeS < road.L - 1 && road.Z[edgeS + BEHIND] <= zS(road.X[edgeS + BEHIND]) - WALL_BEFORE) edgeS++;
  // (R-c: THE BRIDGE STANDS AT A TRUE FOLD OF THE LAND strictly inside its reach, never at the reach's first or last metre: the
  // lowest metre that lies under both its neighbours in the ground smoothed over 20 m either way; where that ground has
  // no fold inside the reach, in the ground smoothed over 10, 5, then 2 m (a smaller fold is the brook's still); where the
  // land is one even fall through the whole reach, the brook runs down that fall and its crossing is dealt by the stream
  // 'gate-brook' strictly inside the reach: the world file reads the bridge as a metre on every seed)
  { bridge = -1; for (const w of [20, 10, 5, 2]) { let low = Infinity; for (let s = BRIDGE_REACH + 1; s < edgeS - BRIDGE_REACH; s++) { const v = box(raw, s + BEHIND, w); if (v < low && v <= box(raw, s - 1 + BEHIND, w) && v < box(raw, s + 1 + BEHIND, w)) { low = v; bridge = s; } } if (bridge >= 0) { fold = w; break; } }
    if (bridge < 0) { const span = edgeS - 2 * BRIDGE_REACH - 2; bridge = BRIDGE_REACH + 1 + Math.floor(streamOf(ctx, 'gate-brook')() * Math.max(1, span)); } }   // (no fold: the brook's crossing is DEALT inside the reach)
  for (let i = 0; i < N; i++) { const s = i - BEHIND, b = (s - bridge) / 7; RY[i] = box(raw, i, 20) + box(rdg, i, 20) + 1.2 * Math.exp(-b * b); }
  const tab = (T, s) => { const f = Math.min(N - 1.001, Math.max(0, s + BEHIND)), i = Math.floor(f); return mix(T[i], T[i + 1], f - i); };
  const roadY = (s) => tab(RY, s), eyeY = (s) => tab(EY, s);
  // a KNOLL on the outer hand of the bend past the lane's mouth (KNOLL_HIGH, its crown 33 m off the centre line): the
  // copse stands on it, in the line of the lane's own axis
  const KA = road.at(RIDGE.at + 133), knX = KA.x + KA.tz * 33, knZ = KA.z - KA.tx * 33;
  const knoll = (x, z) => { const dx = x - knX, dz = z - knZ, r2 = dx * dx + dz * dz; return r2 > 6400 ? 0 : KNOLL_HIGH * Math.exp(-r2 / 800) * (1 - sstep(4900, 6400, r2)); };
  // and a low SHOULDER on the rim of the inner hand at the lane's mouth (2.6 m, 19 m off the centre line): it closes the
  // last sight lines that grazed that rim
  const SA = road.at(RIDGE.at + 36), shX = SA.x - SA.tz * 19, shZ = SA.z + SA.tx * 19, SC = road.at(RIDGE.at + 62), scX = SC.x - SC.tz * 21, scZ = SC.z + SC.tx * 21;
  const lump = (x, z, x0, z0, high) => { const dx = x - x0, dz = z - z0, r2 = dx * dx + dz * dz; return r2 > 2500 ? 0 : high * Math.exp(-r2 / 300) * (1 - sstep(1600, 2500, r2)); };
  const shoulder = (x, z) => lump(x, z, shX, shZ, 2.6) + lump(x, z, scX, scZ, 4.2);
  // (and its like on the same hand where the lane begins, where the banks are still low)
  const SB = road.at(RIDGE.at - 44), sbX = SB.x - SB.tz * 20, sbZ = SB.z + SB.tx * 20;
  const shoulder0 = (x, z) => { const dx = x - sbX, dz = z - sbZ, r2 = dx * dx + dz * dz; return r2 > 2500 ? 0 : 2.6 * Math.exp(-r2 / 300) * (1 - sstep(1600, 2500, r2)); };
  const h0 = (x, z) => plain(x, z) + ridge(x, z) + knoll(x, z) + shoulder(x, z) + shoulder0(x, z);
  // the ground at the offset d from the road's metre s, where the uncut land stands at base
  const cut = (s, d, base) => {
    const a = Math.abs(d), yr = roadY(s);
    if (a <= 2.5) return yr + 0.06 * (1 - (a / 2.5) * (a / 2.5));
    if (a <= SHOULDER) return yr - 0.05 * (a - 2.5) / (SHOULDER - 2.5);
    const steep = d > 0 ? 1 + 0.3 * sstep(RIDGE.at + 8, RIDGE.at + 22, s) * (1 - sstep(RIDGE.at + 70, RIDGE.at + 84, s)) : 1;   // the mouth's inner bank stands steeper
    const nt = notch(s, d), lim = (a - SHOULDER) * SLOPE * steep + 0.02 + 30 * (nt / 1.25) * (nt / 1.25), v = base - nt - (yr - 0.05);   // (the brook's channel runs up to the bridge's own wall)
    // the bank: the lesser of the slope's own height and the land's, the rim rounded over about 2 m (cut or fill alike)
    const k = Math.min(2, 0.5 * lim), av = Math.abs(v), m = (av + lim - Math.sqrt((av - lim) * (av - lim) + k * k)) / 2 - (lim - Math.sqrt(lim * lim + k * k)) / 2;
    return yr - 0.05 + (v < 0 ? -m : m);
  };
  const nr = {};
  const ground = (x, z, hint) => { const b = h0(x, z); road.near(x, z, hint, nr); return nr.dist < REACH ? cut(nr.s, nr.d, b) : b; };
  // THE SUNK LANE's metres as the land deals them: outward from the ridge's crossing, as far as the uncut land stands
  // 1.5 m and more over the brick
  while (lane0 > 1 && h0(road.X[lane0 - 1 + BEHIND], road.Z[lane0 - 1 + BEHIND]) - RY[lane0 - 1 + BEHIND] >= 1.5) lane0--;
  while (lane1 < road.L - 1 && h0(road.X[lane1 + 1 + BEHIND], road.Z[lane1 + 1 + BEHIND]) - RY[lane1 + 1 + BEHIND] >= 1.5) lane1++;
  // THE SWARD'S EDGE on the road: the first metre from which the cover law's envelope is nothing (its bound zN)
  sward = Math.floor(road.L); while (sward > lane1 && road.Z[sward - 1 + BEHIND] >= zN()) sward--;
  // THE FENCES' LINES (stream 'gate-fence-line': each hand's own slow wave, 4.6 to 6.2 m off the centre line) from 150 m
  // behind the entry to the wall's posts; none over the bridge's parapets and a rail's length more, none in the 62 m
  // behind the entry. THE WALL'S TWO POSTS stand where the fences end; the dry-stone wall runs off from each along the
  // cover law's boundary (its top WALL_TOP over the ground).
  const fl = streamOf(ctx, 'gate-fence-line'), fencePh = [fl() * TAU, fl() * TAU], WALL_TOP = 1.2;
  const fenceD = (s, side) => 5.4 + 0.8 * Math.sin(s / 41 + fencePh[side > 0 ? 0 : 1]);
  const fenced = (s) => s >= -150 && s <= edgeS - 2 && Math.abs(s - bridge) >= PARAPET + 2.5 && !(s > -62 && s < 0.5);
  const posts = [1, -1].map((side) => { const a = road.at(edgeS), d = side * (fenceD(edgeS, side) + 0.1), x = a.x - a.tz * d, z = a.z + a.tx * d; return { side, x, z, y: ground(x, z, edgeS), off: z - zS(x), out: -Math.sign(a.tz * side) || 1 }; });
  // the top (its height in the world) of the tallest built thing under or within CLEAR_BY metres of the place (x, z),
  // o metres right of the road's metre s: a fence on its own ground, a post of the wall, the wall
  const pa = {}, builtTop = (s, o, x, z) => {
    let top = -1e9;
    if (fenced(s)) for (const side of [1, -1]) { const d = side * fenceD(s, side); if (Math.abs(o - d) < CLEAR_BY + 0.4) { road.at(s, pa); top = Math.max(top, ground(pa.x - pa.tz * d, pa.z + pa.tx * d, s) + POST); } }
    for (const p of posts) { if (Math.hypot(x - p.x, z - p.z) < CLEAR_BY + 0.7) top = Math.max(top, p.y + PIER); else if ((x - p.x) * p.out > 0 && Math.abs(z - zS(x) - p.off) < CLEAR_BY + 0.7) top = Math.max(top, ground(x, zS(x) + p.off) + WALL_TOP); }
    return top;
  };
  // THE FLOWN LINE's offset at every metre (FLOWN_CHORD's law, stated at the head): the road's turn to the right in
  // radians a metre, smoothed twice over half the chord either way; wide of the bend is the hand away from the turn
  const FO = new Float32Array(N), KR = new Float32Array(N), KS = new Float32Array(N), HC = FLOWN_CHORD / 2;
  for (let i = 1; i < N - 1; i++) KR[i] = ((road.TX[i + 1] - road.TX[i - 1]) * -road.TZ[i] + (road.TZ[i + 1] - road.TZ[i - 1]) * road.TX[i]) / 2;
  for (let i = 0; i < N; i++) KS[i] = box(KR, i, HC);
  const centred = (s, a, b) => sstep(a - FLOWN_EASE, a, s) * (1 - sstep(b, b + FLOWN_EASE, s));
  for (let i = 0; i < N; i++) {
    const s = i - BEHIND, wide = -box(KS, i, HC) * FLOWN_CHORD * FLOWN_CHORD / 8;
    FO[i] = FLOWN_MOST * Math.tanh(wide / FLOWN_MOST) * (1 - centred(s, bridge - PARAPET, bridge + PARAPET)) * (1 - centred(s, lane0, lane1)) * (1 - sstep(sward - FLOWN_EASE, sward, s));
  }
  const flown = (s) => tab(FO, s);
  // THE EYE'S HEIGHT at every metre: the ground under the flown line, smoothed over 12 m either way, and the lift over
  // it (OPEN; EYE in the lane: a monotone cubic through the lane's ends as dealt); where a crest stands over that
  // smoothed ground, or a built thing under or beside the line asks more than the lift, the eye rises by that deficit
  // (its greatest within 12 m, eased over 12 m); and the one ramp to the ring's height, from FLOWN_EASE before the sward's edge to two chords before the road's last LEVEL metres.
  const lift = monoCubic([[-BEHIND, OPEN], [lane0 - CROWN, OPEN], [lane0, EYE], [lane1, EYE], [lane1 + MOUTH, OPEN], [road.L, OPEN]]);
  { const G = new Float32Array(N), D = new Float32Array(N), M = new Float32Array(N), B = new Float32Array(N), at = {};
    for (let i = 0; i < N; i++) { const s = i - BEHIND, o = FO[i]; road.at(s, at); const x = at.x - at.tz * o, z = at.z + at.tx * o; G[i] = Math.abs(o) < 0.05 ? RY[i] : ground(x, z, s); B[i] = builtTop(s, o, x, z); }
    for (let i = 0; i < N; i++) { const g = box(G, i, 12); let top = -1e9; for (let j = Math.max(0, i - CLEAR_BY); j <= Math.min(N - 1, i + CLEAR_BY); j++) if (B[j] > top) top = B[j];   // (a thing within CLEAR_BY along the line as well as beside it)
      D[i] = Math.max(0, G[i] - g) + Math.max(0, top + CLEAR - g - lift(i - BEHIND)); }
    for (let i = 0; i < N; i++) { let m = 0; for (let j = Math.max(0, i - 12); j <= Math.min(N - 1, i + 12); j++) if (D[j] > m) m = D[j]; M[i] = m; }
    for (let i = 0; i < N; i++) { const s = i - BEHIND; EY[i] = mix(box(G, i, 12) + box(M, i, 12) + lift(s), RING.y, sstep(sward - FLOWN_EASE, road.L - LEVEL - 2 * CHORD, s)); } }
  // the banks' share (1 on the banks and 10 m beyond their rims, 0 from 34 m off the centre line and outside the lane)
  const laneAt = (s, d) => sstep(lane0 - 14, lane0 + 2, s) * (1 - sstep(lane1 - 2, lane1 + 14, s)) * (1 - sstep(29, 33.5, Math.abs(d)));
  const lr = {}, R1 = road.at((lane0 + lane1) / 2), laneR = (lane1 - lane0) / 2 + 60;
  // the cover field
  // (G3: THE FIELD'S LONG DRIFTS, by place alone: lanes of grass some 50 m broad and some hundreds long cross the scarlet
  // on one bearing dealt by the stream 'gate-field'; the same law in the paint's gateDrift)
  const dth = 0.5 + 0.3 * Math.sin(edge[2]), dcs = Math.cos(dth), dsn = Math.sin(dth);
  const cover = (x, z, out = {}, s, d) => {
    const e = zS(x), toHills = 1 - sstep(1500, 1900, Math.hypot(x - HILLS_AT[0], z - HILLS_AT[1]));
    let bank = 0;
    if (s !== undefined) bank = laneAt(s, d); else if (Math.abs(x - R1.x) < laneR && Math.abs(z - R1.z) < laneR) { road.near(x, z, undefined, lr); bank = laneAt(lr.s, lr.d); }
    // (F8, THE COVER'S NEAR EDGE, by the land's own deal: the scarlet begins in TONGUES of unlike depth, 0 to TONGUE metres past
    // the law's bound by a tone field of 150 m, and in the grass before each tongue OUTLIERS stand, stands of 25 m by a
    // finer field; nothing stands before the bound itself, so the wall keeps its place; the same law in the paint's gateCover)
    let rim = 1;
    if (z - e < TONGUE + TONGUE_RISE) { const dp = TONGUE * sstep(0.30, 0.72, tone.at(x / 2400 + 0.61, z / 2400 + 0.61, 1)); rim = Math.max(sstep(e + dp, e + dp + TONGUE_RISE, z), 0.62 * sstep(e + 4, e + 22, z) * sstep(0.60, 0.72, tone.at(x / 400 + 0.23, z / 400 + 0.23, 0))); }
    const ce = rim * (1 - sstep(-130, -100, z)) * toHills * (1 - bank) * (1 - 0.92 * ridgeK(x, z));
    // (thin, grassy places of 15 to 60 m break the scarlet: the same law in the paint's gateCover)
    const thin = sstep(0.54, 0.80, 0.6 * tone.at(x / 960 + 0.11, z / 960 + 0.11, 3) + 0.4 * tone.at(x / 192 + 0.37, z / 192 + 0.37, 2));
    const lanes = sstep(0.50, 0.70, tone.at((x * dcs + z * dsn) / 8000 + 0.27, (-x * dsn + z * dcs) / 800 + 0.71, 3));
    // (F8, THE RED LIES IN DRIFTS: reaches of grass of 200 m by a broad tone field part the scarlet, so far off it is drifts with green between, never one band; by the road they are a thinning, as the lanes are; the same law in the paint's gateCover)
    const lk = d === undefined ? 0.7 : mix(0.25, 0.7, sstep(22, 34, Math.abs(d))), reach = sstep(0.50, 0.64, tone.at(x / 3200 + 0.83, z / 3200 + 0.83, 0));
    const c = ce * (0.6 + 0.4 * sstep(0.3, 0.7, tone.at(x / 1280, z / 1280, 2))) * (1 - 0.82 * thin) * (1 - lk * lanes) * (1 - REACH_K * lk * reach);   // (by the road, where we fly, the scarlet stands thick: a lane of grass is a thinning there, a break of grass farther off)
    const W = toHills * (1 - bank) * sstep(-18, 2, z - e) * (1 - sstep(16, 50, z - e));        // (P4: no drifts of other colours at the sward's edge: far from the eye they read as smears of paint)
    const drift = W * sstep(0.60, 0.68, tone.at(x / 160 + 0.43, z / 160 + 0.43, 0)), sel = tone.at(x / 420 + 0.77, z / 420 + 0.77, 1);
    const cd = c * (1 - 0.85 * drift);                                           // a drift stands IN the poppies' place: mostly its one colour
    out.c = cd; out.W = W; out.bank = bank; out.drift = drift; out.total = cd + 0.5 * drift * (1 - cd); out.wild = out.total > 1e-4 ? 0.5 * drift * (1 - cd) / out.total : 0;
    out.kind = sel < 0.42 ? 0 : sel < 0.5 ? 1 : sel < 0.58 ? 2 : 3;               // yellow, white, blue, purple: the drift's own colour
    return out;
  };
  const places = { farm: null, bridge, edge: edgeS, lane0, lane1, sward, court: road.L - APRON };
  return { fold, h0, plain, ridge, roadY, eyeY, cut, ground, cover, zS, zN, edge, drift: [dcs, dsn], ridgeU: [R0.x, R0.z, ux, uz, ridgePhase], notch, R0, lane: [lane0, lane1], laneAt, places, flown, fenceD, fenced, posts, waterY: tab(RY, bridge) - 1.2 - 0.85 };
}

// ---- THE BUILT TEXTURES (each from a name stream, at load, in short steps; mipmaps; the renderer's greatest
// anisotropic filtering, and the brick sixteen-fold or the card's most: it is read at a low angle all along the road). sRGB bytes are decoded by the card, so their mipmaps are means of light.
const aniso = (ctx) => (ctx.renderer && ctx.renderer.capabilities ? ctx.renderer.capabilities.getMaxAnisotropy() : 1);
function dataTex(ctx, data, w, h, srgb) {
  const t = new THREE.DataTexture(data, w, h, THREE.RGBAFormat);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = MAG_FILTER; t.minFilter = MIP_FILTER;
  t.generateMipmaps = true; t.anisotropy = aniso(ctx); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.needsUpdate = true;
  return t;
}

// THE ROAD'S BRICK (design section 5; stream 'gate-brick'): the whole 5 m of the road's width by 10 m of its length,
// 512 by 1024 texels, about a centimetre each. OUR OWN BOND, a running bond laid ACROSS the road: four courses of
// handmade bricks (a quarter of a metre long) laid side by side across the road, each course shifted half a brick
// and a little more or less against the last, then one course of bricks laid lengthwise; the courses wander a
// little. Every brick has its own tone between straw, honey and ochre, some darker, some paler, its own worn,
// rounded edges and its own tilt; a few have sunk and lie lower and darker; a few have a corner gone to moss. No
// brick is missing and nothing is black: the joints are earth and moss, darker than the brick. Alpha is the joint
// (1 in a joint): the ground's paint grows grass and moss there, thicker toward the road's edges.
export async function buildBrick(ctx) {
  const rng = streamOf(ctx, 'gate-brick'), W = 512, H = 1024, data = new Uint8Array(W * H * 4), NP = 13, SY = H / (NP * 6), NA = 20, LU = W / NA;
  const nCourse = NP * 5, rc = new Float32Array(nCourse * 2), rv = new Float32Array(nCourse * 40 * 6), ph = [rng() * TAU, rng() * TAU];
  for (let i = 0; i < rc.length; i++) rc[i] = rng();
  for (let i = 0; i < rv.length; i++) rv[i] = rng();
  const straw = [214, 184, 104], honey = [222, 172, 82], ochre = [196, 146, 64], dark = [156, 112, 60], pale = [230, 208, 146], earth = [104, 88, 54], moss = [80, 104, 48];
  const wander = new Float32Array(W); for (let x = 0; x < W; x++) wander[x] = 1.6 * Math.sin(x * TAU / W * 3 + ph[0]) + 1.1 * Math.sin(x * TAU / W * 7 + ph[1]);   // (laid once for the width: it is the same on every row)
  // (once for the width: the place across the road in bricks and the moss's gain toward the edges; once for each
  // brick: its tone, straw to ochre, some darker, some paler, a sunk one in its neighbours' shade; the grain's dice
  // drawn once, each row reading a run of them from its own start: no call and no die to a texel)
  const uOf = new Float32Array(W), edgeM = new Float32Array(W), GR = 8192, grainT = new Float32Array(GR), nB = nCourse * 40, bc = new Float32Array(nB * 3);
  for (let x = 0; x < W; x++) { const e = Math.abs(x - W / 2) / (W / 2); uOf[x] = x / LU; edgeM[x] = 0.5 * e * e; }
  for (let i = 0; i < GR; i++) grainT[i] = rng();
  for (let id = 0; id < nB; id++) {
    const q = id * 6, t = rv[q], r2 = rv[q + 1], A = t < 0.5 ? straw : honey, B = t < 0.5 ? honey : ochre, f = t < 0.5 ? t * 2 : t * 2 - 1, k = (0.92 + 0.16 * rv[q + 4]) * (rv[q + 2] < 0.07 ? 0.80 : 1);
    for (let c = 0; c < 3; c++) { let v = mix(A[c], B[c], f); if (r2 < 0.15) v = mix(v, dark[c], 0.55); else if (r2 > 0.83) v = mix(v, pale[c], 0.5); bc[id * 3 + c] = v * k; }
  }
  const e0 = earth[0], e1 = earth[1], e2 = earth[2], m0 = moss[0] - e0, m1 = moss[1] - e1, m2 = moss[2] - e2;
  for (let y = 0; y < H; y++) {
    const g0 = Math.floor(rng() * GR);
    for (let x = 0; x < W; x++) {
      // (the courses wander by a centimetre or two; the wander closes over the width and the length)
      let vy = y + wander[x]; if (vy < 0) vy += H; else if (vy >= H) vy -= H; vy /= SY;   // (the wander is under 3 texels: one turn closes it)
      const per = Math.min(NP - 1, Math.floor(vy / 6)), r = vy - per * 6, u = uOf[x];
      let id, bu, bv, lu, lv;                              // brick id; place in the brick 0..1 (long, short); its sizes in texels
      if (r < 4) {
        const j = Math.floor(r), ci = per * 5 + j, bx = u + (ci & 1 ? 0.5 : 0) + (rc[ci * 2] - 0.5) * 0.24 + NA, fb = bx | 0;
        id = ci * 40 + fb % NA; bu = bx - fb; bv = r - j; lu = LU; lv = SY;
      } else {
        const ci = per * 5 + 4, bx = u * 2 + (rc[ci * 2] - 0.5) * 0.4 + 2 * NA, fb = bx | 0;
        id = ci * 40 + fb % (2 * NA); bu = (r - 4) / 2; bv = bx - fb; lu = 2 * SY; lv = LU / 2;
      }
      const q = id * 6, r3 = rv[q + 2], r4 = rv[q + 3], r5 = rv[q + 4], r6 = rv[q + 5];
      const au = (bu < 0.5 ? bu : 1 - bu) * lu, av = (bv < 0.5 ? bv : 1 - bv) * lv, jd = au < av ? au : av, corner = au + av;   // (corner: worn, rounded corners)
      const inset = 0.55 + 0.75 * r4 + (r3 < 0.07 ? 0.5 : 0);
      const chip = r3 > 0.94 && (r5 < 0.5 ? bu * lu + bv * lv : (1 - bu) * lu + (1 - bv) * lv) < 4 + 5 * r6;   // a corner gone to moss
      const joint = chip || jd < inset || corner < inset + 2.2, o = (y * W + x) * 4, grain = grainT[(g0 + x) & (GR - 1)];
      let cr, cg, cb;
      if (joint) {
        let m = (chip ? 0.6 : 0.22) + edgeM[x] + (grain - 0.5) * 0.9; m = m < 0 ? 0 : m > 1 ? 1 : m; const k = 0.72 + 0.36 * grain;
        cr = (e0 + m0 * m) * k; cg = (e1 + m1 * m) * k; cb = (e2 + m2 * m) * k;
      } else {
        let w = ((jd < corner - 2.2 ? jd : corner - 2.2) - inset) / 2.6; w = w < 0 ? 0 : w > 1 ? 1 : w;
        let k = (0.78 + 0.22 * w) * (1 + 0.30 * ((r6 - 0.5) * (bu - 0.5) + (r4 - 0.5) * (bv - 0.5))) * (0.94 + 0.12 * grain);   // worn edges take less light; each brick lies a little out of true; grain
        if (grain > 0.988) k *= 0.8;                                                           // small pits
        const b3 = id * 3; cr = bc[b3] * k; cg = bc[b3 + 1] * k; cb = bc[b3 + 2] * k;
      }
      data[o] = cr > 255 ? 255 : cr; data[o + 1] = cg > 255 ? 255 : cg; data[o + 2] = cb > 255 ? 255 : cb; data[o + 3] = joint ? 255 : 0;
    }
    if (y % 32 === 31) await ctx.yield();
  }
  // (THE BRICK IS READ AT A LOW ANGLE ALONG THE WHOLE ROAD: sixteen-fold anisotropic filtering, or the card's most)
  const tex = dataTex(ctx, data, W, H, true); tex.anisotropy = 16;
  return tex;
}

// THE FIELD'S GROUND SEEN FROM ABOVE (P1; stream 'gate-bloom'): 5 m square, 512 texels, about a centimetre each.
// R: each bloom's RANK (0 where no bloom lies; a bloom shows where its rank stands over 1 - cover, so thin cover
// keeps the same blooms and loses the rest); G: the grass between; B: a die per bloom (which of Baum's colours it
// takes at the field's edges); A: the bloom's own shade (four petals, a dark blotch at the base).
export const BLOOM_K = 1.9;                      // the share of ground under blooms at cover c is 1 - exp(-BLOOM_K * c)
export async function buildBloom(ctx) {
  const rng = streamOf(ctx, 'gate-bloom'), S = 512, data = new Uint8Array(S * S * 4);
  for (let i = 0; i < S * S; i++) data[i * 4 + 1] = 118 + Math.floor(rng() * 20);
  await ctx.yield();
  for (let k = 0; k < 7000; k++) {                 // grass blades from above: short strokes
    const x0 = rng() * S, y0 = rng() * S, an = rng() * TAU, len = 5 + rng() * 10, v = 40 + rng() * 215, dx = Math.cos(an), dy = Math.sin(an);
    for (let t = 0; t < len; t++) { const x = ((Math.floor(x0 + dx * t) % S) + S) % S, y = ((Math.floor(y0 + dy * t) % S) + S) % S; data[(y * S + x) * 4 + 1] = v; }
    if (k % 400 === 399) await ctx.yield();
  }
  const N = Math.round(BLOOM_K * S * S / (Math.PI * 4.0 * 4.0));
  for (let k = 0; k < N; k++) {
    const cx = rng() * S, cy = rng() * S, R = 3.3 + rng() * 1.5, rank = 1 + Math.floor(rng() * 254), sel = Math.floor(rng() * 256), ph = rng() * TAU, lit = 0.8 + 0.2 * rng();
    const cp = Math.cos(ph), sp = Math.sin(ph), cq = Math.cos(ph * 1.7), sq = Math.sin(ph * 1.7);
    const X0 = Math.floor(cx), Y0 = Math.floor(cy), far2 = R * R * 1.3456;       // (a bloom reaches 1.16 of its radius at most: a texel beyond that, or under a higher bloom, is turned away before any root)
    for (let j = -6; j <= 6; j++) for (let i = -6; i <= 6; i++) {
      const X = X0 + i, Y = Y0 + j, dx = X + 0.5 - cx, dy = Y + 0.5 - cy, rr = dx * dx + dy * dy;
      if (rr > 29.16 || rr > far2) continue;
      const o = (((Y & (S - 1)) * S) + (X & (S - 1))) * 4;
      if (rank <= data[o]) continue;
      // (the angle's double and fourfold sines from the texel's own offsets: no arc function to a texel)
      const r = Math.sqrt(rr), ir = 1 / Math.max(1e-6, rr), c2 = (dx * dx - dy * dy) * ir, s2 = 2 * dx * dy * ir, c4 = c2 * c2 - s2 * s2, s4 = 2 * s2 * c2;
      const Re = R * (1 + 0.09 * (c4 * cp - s4 * sp) + 0.07 * (c2 * cq - s2 * sq));
      if (r > Re) continue;
      let sh = lit * (0.62 + 0.38 * r / Re); if (Math.abs(s2 * cp + c2 * sp) < 0.16) sh *= 0.78; if (r < 0.24 * R) sh = 0.12;
      data[o] = rank; data[o + 2] = sel; data[o + 3] = Math.round(255 * sh);
    }
    if (k % 160 === 159) await ctx.yield();
  }
  const t = dataTex(ctx, data, S, S, false);
  return t;
}

// THE STANDING BLOOMS' CARDS (P2; stream 'gate-card'): four cards in one built texture, 256 texels each, a card
// 0.7 m wide and 0.8 m tall: three to six field poppies at true size on hairy stems of 45 to 75 cm among grass
// blades and toothed leaves: open flowers of four overlapping petals with the dark blotch at the base, nodding
// buds, seed heads. R: light and shade; G: 1 on a petal (the petal's colour is the field's own red law, or one of
// the other colours at the edges), 0 on green; B: the dark blotch; A: alpha, its cover kept through the mipmaps.
export async function buildCards(ctx) {
  const rng = streamOf(ctx, 'gate-card'), S = 512, C = 256, F = new Float32Array(S * S * 4);
  const put = (cell, x, y, sh, pet, dk, a) => {
    if (a <= 0 || x < 3 || x > C - 4 || y < 0 || y > C - 4) return;
    const o = (((cell >> 1) * C + y) * S + (cell & 1) * C + x) * 4;
    F[o] = mix(F[o], sh, a); F[o + 1] = mix(F[o + 1], pet, a); F[o + 2] = mix(F[o + 2], dk, a); F[o + 3] = Math.max(F[o + 3], a);
  };
  const oval = (cell, cx, cy, rx, ry, rot, sh, pet, dk) => {
    const c = Math.cos(rot), s = Math.sin(rot), R = Math.ceil(Math.max(rx, ry)) + 1;
    for (let j = -R; j <= R; j++) for (let i = -R; i <= R; i++) {
      const X = Math.round(cx) + i, Y = Math.round(cy) + j, dx = X - cx, dy = Y - cy, u = (dx * c + dy * s) / rx, v = (-dx * s + dy * c) / ry, e = u * u + v * v;
      if (e < 1) put(cell, X, Y, sh * (0.86 + 0.14 * (1 - e)), pet, dk, sat((1 - e) * Math.min(rx, ry) * 0.9));
    }
  };
  const stroke = (cell, x0, y0, x1, y1, x2, y2, w0, w1, sh) => {            // a bent blade or stem (a quadratic curve)
    const n = Math.ceil((Math.abs(x2 - x0) + Math.abs(y2 - y0) + Math.abs(x1 - x0)) * 1.6) + 2;
    for (let k = 0; k <= n; k++) {
      const t = k / n, a = (1 - t) * (1 - t), b = 2 * t * (1 - t), c = t * t, x = a * x0 + b * x1 + c * x2, y = a * y0 + b * y1 + c * y2, w = mix(w0, w1, t) / 2;
      const X0 = Math.floor(x - w), X1 = Math.ceil(x + w), Y0 = Math.floor(y - w), Y1 = Math.ceil(y + w);
      for (let Y = Y0; Y <= Y1; Y++) for (let X = X0; X <= X1; X++) { const ex = X - x, ey = Y - y, a = w + 0.6 - Math.sqrt(ex * ex + ey * ey); if (a > 0) put(cell, X, Y, sh, 0, 0, a > 1 ? 1 : a); }
    }
  };
  for (let cell = 0; cell < 4; cell++) {
    for (let g = 0; g < 16; g++) { const bx = 16 + rng() * 224, h = 26 + rng() * 70, ln = (rng() - 0.5) * 44; stroke(cell, bx, 0, bx + ln * 0.3, h * 0.6, bx + ln, h, 2.4, 0.9, 0.42 + 0.4 * rng()); }
    const np = 3 + Math.floor(rng() * 4), plants = [];
    for (let p = 0; p < np; p++) plants.push({ bx: 34 + (p + rng()) * 188 / np, hy: 146 + rng() * 92, lean: (rng() - 0.5) * 52, kind: rng(), R: 11 + rng() * 5, bend: (rng() - 0.5) * 22, sh: 0.55 + 0.3 * rng(), tw: rng() });
    plants.sort((a, b) => b.hy - a.hy);
    for (const P of plants) {
      const hx = Math.min(C - 24, Math.max(24, P.bx + P.lean)), hy = P.hy, mx = P.bx + P.lean * 0.3 + P.bend, my = hy * 0.55, R = P.R;
      for (let l = 0; l < 3; l++) { const ly = hy * (0.12 + 0.13 * l + 0.06 * rng()), dir = rng() < 0.5 ? -1 : 1, len = 22 + rng() * 26, lx = mix(P.bx, mx, ly / my); stroke(cell, lx, ly, lx + dir * len * 0.6, ly + len * 0.2, lx + dir * len, ly + len * (0.45 + 0.3 * rng()), 4.2, 1.0, 0.5 + 0.3 * rng()); }
      stroke(cell, P.bx, 0, mx, my, hx, hy, 2.2, 1.7, P.sh);
      if (P.kind < 0.68) {                           // an open flower, seen from the side and a little from above
        const tip = (P.tw - 0.5) * 0.5;
        oval(cell, hx, hy + 0.3 * R, R, 0.72 * R, tip, 0.5, 1, 0);
        oval(cell, hx, hy + 0.02 * R, 0.4 * R, 0.24 * R, tip, 0.2, 1, 1);
        oval(cell, hx - 0.44 * R, hy - 0.12 * R, 0.7 * R, 0.6 * R, tip + 0.35, 0.98, 1, 0);
        oval(cell, hx + 0.44 * R, hy - 0.12 * R, 0.7 * R, 0.6 * R, tip - 0.35, 0.8, 1, 0);
      } else if (P.kind < 0.84) {                    // a nodding bud
        const dir = P.lean < 0 ? -1 : 1; stroke(cell, hx, hy, hx + dir * 5, hy + 5, hx + dir * 9, hy - 6, 1.7, 1.5, P.sh);
        oval(cell, hx + dir * 9.5, hy - 12, 3.6, 6.6, dir * 0.2, 0.62, 0, 0); oval(cell, hx + dir * 9.5, hy - 17.5, 1.8, 2.2, 0, 0.9, 1, 0);
      } else { oval(cell, hx, hy + 2, 4.2, 5.6, 0, 0.74, 0, 0); oval(cell, hx, hy + 7.4, 5.4, 1.7, 0, 0.42, 0, 0); }   // a seed head
    }
    await ctx.yield();
  }
  return F;
}

// the cards' texture from its drawing: mipmaps made here, colour weighted by alpha (no dark fringe), alpha scaled
// at each level so the share of texels over the cut-off is the first level's (thin stems and far blooms keep their cover)
export const CARD_CUT = 0.42;
export async function cardTexture(ctx, F) {
  let S = 512, cur = F; const mips = [], share = (A, n, k) => { let c = 0; for (let i = 0; i < n; i++) if (A[i * 4 + 3] * k >= CARD_CUT) c++; return c / n; };
  const want = share(F, S * S, 1); await ctx.yield();
  for (let level = 0; S >= 1; level++) {
    const n = S * S, bytes = new Uint8Array(n * 4), cl = new Uint8ClampedArray(bytes.buffer); let k = 1;   // (cl: the same bytes, written rounded and held to 0..255 by the array itself)
    if (level > 0) { let lo = 0.5, hi = 6; for (let it = 0; it < 14; it++) { k = (lo + hi) / 2; if (share(cur, n, k) < want) lo = k; else hi = k; } }
    for (let o = 0; o < n * 4; o += 4) { cl[o] = 255 * cur[o]; cl[o + 1] = 255 * cur[o + 1]; cl[o + 2] = 255 * cur[o + 2]; cl[o + 3] = 255 * k * cur[o + 3]; }
    mips.push({ data: bytes, width: S, height: S });
    if (S === 1) break;
    if (level === 0) await ctx.yield();                 // (the largest level's bytes and its halving are two steps, not one)
    const h = S >> 1, nx = new Float32Array(h * h * 4);
    for (let y = 0; y < h; y++) for (let x = 0; x < h; x++) {
      let a = 0, r = 0, g = 0, b = 0, r0 = 0, g0 = 0, b0 = 0;
      for (let q = 0; q < 4; q++) { const o = ((y * 2 + (q >> 1)) * S + x * 2 + (q & 1)) * 4, w = cur[o + 3]; a += w; r += cur[o] * w; g += cur[o + 1] * w; b += cur[o + 2] * w; r0 += cur[o]; g0 += cur[o + 1]; b0 += cur[o + 2]; }
      const o = (y * h + x) * 4;
      if (a > 1e-4) { nx[o] = r / a; nx[o + 1] = g / a; nx[o + 2] = b / a; } else { nx[o] = r0 / 4; nx[o + 1] = g0 / 4; nx[o + 2] = b0 / 4; }
      nx[o + 3] = a / 4;
    }
    cur = nx; S = h; await ctx.yield();
  }
  const t = new THREE.DataTexture(mips[0].data, 512, 512, THREE.RGBAFormat);
  t.mipmaps = mips; t.generateMipmaps = false; t.magFilter = MAG_FILTER; t.minFilter = MIP_FILTER;
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.anisotropy = Math.min(4, aniso(ctx)); t.needsUpdate = true;
  return t;
}

// THE GROUND'S CRISP GRAIN (stream 'gate-grit'): 256 square, laid at 8 m and at 21 m to a tile (a texel 3 and 8 cm),
// so its things are 0.25 to 1 m on the ground. R: light and shade of grass seen from above (tufts as fans of long
// blades, each with its shaded side; mean a half); G: seed heads in loose clusters; B: small stones; A: the stones'
// and heads' own shade (lit on one side). It tiles; it is filtered by its own mipmaps alone.
export async function buildGrit(ctx) {
  const rng = streamOf(ctx, 'gate-grit'), S = 256, M = S - 1, data = new Uint8Array(S * S * 4);
  for (let i = 0; i < S * S; i++) { data[i * 4] = 118 + Math.floor(rng() * 20); data[i * 4 + 3] = 128; }
  const put = (x, y, ch, v, add) => { const i = (((y & M) << 8) | (x & M)) * 4 + ch; data[i] = Math.max(0, Math.min(255, add ? data[i] + v : v)); };
  for (let k = 0; k < 520; k++) {                  // tufts: a dark foot on the shaded side, then a fan of blades, pale and dark
    const cx = rng() * S, cy = rng() * S, r = 4 + rng() * 9, n = 5 + Math.floor(rng() * 6), lean = rng() * TAU;
    for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) { const q = 1 - (x * x + y * y) / (r * r); if (q > 0) put(Math.round(cx + x + 0.35 * r), Math.round(cy + y + 0.35 * r), 0, -70 * q, true); }
    for (let b = 0; b < n; b++) { const th = lean + (rng() - 0.5) * 2.6, len = r * (0.7 + 0.9 * rng()), v = rng() < 0.72 ? 60 + rng() * 75 : -(40 + rng() * 50), dx = Math.cos(th), dy = Math.sin(th);
      for (let t = 0; t < len; t += 0.7) { const x = Math.round(cx + dx * t), y = Math.round(cy + dy * t); put(x, y, 0, v * (1 - 0.5 * t / len), true); if (t < len * 0.5) put(x + (Math.abs(dx) > Math.abs(dy) ? 0 : 1), y + (Math.abs(dx) > Math.abs(dy) ? 1 : 0), 0, v * 0.6, true); } }
    if (k % 130 === 129) await ctx.yield();
  }
  for (let k = 0; k < 70; k++) {                   // seed heads: loose clusters of pale dots
    const cx = rng() * S, cy = rng() * S, r = 4 + rng() * 12, n = 4 + Math.floor(rng() * 7);
    for (let b = 0; b < n; b++) { const th = rng() * TAU, rr = r * Math.sqrt(rng()), x0 = cx + Math.cos(th) * rr, y0 = cy + Math.sin(th) * rr, hr = 1.1 + rng() * 1.3, sh = 150 + rng() * 105;
      for (let y = -3; y <= 3; y++) for (let x = -3; x <= 3; x++) { const q = 1 - (x * x + y * y) / (hr * hr); if (q > 0) { put(Math.round(x0 + x), Math.round(y0 + y), 1, 255 * Math.min(1, q * 2.2), false); put(Math.round(x0 + x), Math.round(y0 + y), 3, sh, false); } } }
  }
  await ctx.yield();
  for (let k = 0; k < 44; k++) {                   // small stones, 0.2 to 0.6 m across, lit from one side, a dark foot
    const cx = rng() * S, cy = rng() * S, ra = 3 + rng() * 6.5, rb = ra * (0.55 + 0.4 * rng()), th = rng() * TAU, c = Math.cos(th), sn = Math.sin(th), R = Math.ceil(ra) + 2;
    for (let y = -R; y <= R; y++) for (let x = -R; x <= R; x++) { const u = (x * c + y * sn) / ra, v = (-x * sn + y * c) / rb, q = 1 - (u * u + v * v);
      if (q > 0) { put(Math.round(cx + x), Math.round(cy + y), 2, 255 * Math.min(1, q * 3), false); put(Math.round(cx + x), Math.round(cy + y), 3, 128 + 100 * Math.max(-1, Math.min(1, -(x + y) / (1.4 * ra))) + (rng() - 0.5) * 30, false); }
      else if (q > -0.5) put(Math.round(cx + x + 1), Math.round(cy + y + 1), 0, -80 * (1 + 2 * q), true); }
  }
  await ctx.yield();
  return dataTex(ctx, data, S, S, false);
}

// ---- THE PAINT (GLSL). ONE wind field (gateGust), ONE cover field (gateCover), one law for the red and one for
// the grass: the ground (P1), the cards (P2) and the built things all read these, so they agree at every place.
// GT is the tone field's read (by level 0 in a vertex stage). Two hash calls at most in a fragment (the plots).
const GLSL_PARS = /* glsl */`
uniform sampler2D tTone; uniform float uTime; uniform vec4 uWind; uniform vec4 uEdge; uniform vec4 uCloud; uniform vec4 uPlot; uniform vec4 uRoad; uniform vec4 uLane; uniform vec4 uRidge;
// the ridge's share (its crest line through uRidge.xy along uRidge.zw, waved by uLane.z): 1 on the down, 0 from its foot
float gateRidge(vec2 p) { vec2 d = p - uRidge.xy; float a = dot(d, uRidge.zw), q = d.x * uRidge.w - d.y * uRidge.z + 9. * sin(a / 130. + uLane.z); return (1. - smoothstep(48., 92., abs(q))) * (1. - smoothstep(520., 940., abs(a))); }
float gateGust(vec2 p) {
  vec2 q = vec2(dot(p, uWind.xy) - uTime * uWind.z, dot(p, vec2(-uWind.y, uWind.x)));
  float a = GT(vec2(q.x / 420., q.y / 1700.)).r, b = GT(vec2(q.x / 150. + .5, q.y / 520.)).a;
  return smoothstep(.36, .78, a * .7 + b * .3);
}
float gateCloud(vec2 p) {
  vec2 q = p - uTime * uCloud.xy;
  float n = GT(q / 2600.).g * .75 + GT(q / 900. + .3).b * .25;
  // (a cloud's shade takes .28 of the ground's light at most, so the shaded ground is never darker than .72 of the
  // lit; its edge runs over .26 of the field's range, some 25 to 50 m of ground, so no shade has a hard rim)
  return 1. - min(uCloud.w, .28) * smoothstep(uCloud.z - .05, uCloud.z + .21, n);
}
vec2 gateEdges(float x) {
  return vec2(-535. + 12. * (.6 * sin(x * .00897598 + uEdge.x) + .4 * sin(x * .0241661 + uEdge.y)), -100.);
}
// the sunk lane's banks and 10 m beyond their rims, by the road's own (offset, metre): grass, fern and thorn, no poppy
float gateLane(vec2 road) {
  return smoothstep(uLane.x - 14., uLane.x + 2., road.y) * (1. - smoothstep(uLane.y - 2., uLane.y + 14., road.y)) * (1. - smoothstep(29., 33.5, abs(road.x)));
}
// G3, the field's long drifts (by place alone; uEdge.zw: their bearing): x: lanes of grass across the scarlet; y: a drift's own tone
vec2 gateDrift(vec2 p) {
  vec2 q = vec2(dot(p, uEdge.zw), dot(p, vec2(-uEdge.w, uEdge.z)));
  vec4 t = GT(vec2(q.x / 8000. + .27, q.y / 800. + .71));
  return vec2(smoothstep(.50, .70, t.a), t.g);
}
// x: the poppies' cover c; y: the share of a DRIFT of Baum's other colours; z: all blooms; w: the share of them that are not poppies
vec4 gateCover(vec2 p, vec2 e, float bank, float lk) {
  float toHills = 1. - smoothstep(1500., 1900., length(p - vec2(-200., -400.)));
  float dp = ${TONGUE.toFixed(1)} * smoothstep(.30, .72, GT(p / 2400. + .61).g);       // (F8: the edge's tongues and outliers, as in the land's cover)
  float rim = max(smoothstep(e.x + dp, e.x + dp + ${TONGUE_RISE.toFixed(1)}, p.y), .62 * smoothstep(e.x + 4., e.x + 22., p.y) * smoothstep(.60, .72, GT(p / 400. + .23).r));
  float ce = rim * (1. - smoothstep(-130., -100., p.y)) * toHills * (1. - bank) * (1. - .92 * gateRidge(p));
  float thin = smoothstep(.54, .80, .6 * GT(p / 960. + .11).a + .4 * GT(p / 192. + .37).b);
  float c = ce * (.6 + .4 * smoothstep(.3, .7, GT(p / 1280.).b)) * (1. - .82 * thin) * (1. - lk * gateDrift(p).x) * (1. - ${REACH_K.toFixed(2)} * lk * smoothstep(.50, .64, GT(p / 3200. + .83).r));   // (F8: the reaches of grass between the red's drifts)
  float W = toHills * (1. - bank) * smoothstep(-18., 2., p.y - e.x) * (1. - smoothstep(16., 50., p.y - e.x));
  float drift = W * smoothstep(.60, .68, GT(p / 160. + .43).r);
  c *= 1. - .85 * drift;
  float tot = c + .5 * drift * (1. - c);
  return vec4(c, drift, tot, .5 * drift * (1. - c) / max(tot, .0001));
}
// the red: orange-scarlet to deep crimson by the tone fields; a gust turns the petals to the light: brighter and more
// orange, its saturation kept (nothing pale, silvered or whitened: R5)
vec3 gateRed(float tone, float gust) {
  vec3 red = mix(vec3(.56, .050, .014), vec3(.25, .013, .018), smoothstep(.15, .85, tone));
  return red * mix(vec3(.86, .80, .92), vec3(1.17, 1.24, .97), gust * .8);     // (G3: a gust is a soft sheen, never a painted streak far off)
}
float gH1(float n) { n = fract(n * .1031); n *= n + 33.33; n *= n + n; return fract(n); }
vec2 gH2(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973)); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.xx + p3.yz) * p3.zy); }
// T2, THE GROUND'S CRISP FINE LAYER (by place alone; each scale goes to its own mean by the pixel's footprint f):
// one round dot to a cell of s metres on a lattice shifted by o; x: its mask, soft by f; y: the dot's own die
vec2 gDot(vec2 p, float s, float o, float pr, float f) {
  vec2 g = p / s + o, c = floor(g), h = gH2(c + o * 31.7), j = fract(h * 7.31 + h.yx * 3.17);
  vec2 d = fract(g) - .5 - (j - .5) * .16;
  float r = .27 + .19 * j.x, w = clamp(f / s, .03, .5);
  return vec2(step(h.x, pr) * (1. - smoothstep(r - w, r + w, sqrt(dot(d, d) + .00001))), h.y);
}
// blooms as dots at the scale s whose mean cover is t (two lattices laid over each other, so no grid shows)
vec2 gDots(vec2 p, float s, float t, float f) {
  float pr = (1. - sqrt(max(1. - t, .0001))) / .42;
  vec2 a = gDot(p, s, 0., pr, f), b = gDot(p, s, .5, pr, f);
  return vec2(mix(1. - (1. - a.x) * (1. - b.x), 1., clamp((t - .66) / .34, 0., 1.)), a.x > b.x ? a.y : b.y);
}
// flecks and tufts of grass at the scale s: dark and light, their mean 0
float gFleck(vec2 p, float s, float f) {
  vec2 a = gDot(p * vec2(1., .6), s, 0., .66, f), b = gDot(p.yx * vec2(1., .68), s * .83, .5, .5, f);
  return a.x * (a.y - .5) * 2. + b.x * (b.y - .46) * 1.7;
}
// which crop the plot at p carries (the ground's own dealing: grain under .30, a crop in rows under .52, mown hay under .68, pasture under .86, ley)
float gatePlotKind(vec2 p) {
  vec2 q = vec2(dot(p, uPlot.xy), dot(p, vec2(-uPlot.y, uPlot.x)));
  float jx = floor(q.x / 44.), iy = floor((q.y + gH1(jx) * 150.) / 150.);
  return gH2(vec2(jx, iy)).x;
}
vec3 gateGrass(float tone) { return mix(vec3(.058, .112, .030), vec3(.205, .268, .082), tone); }
// a drift's own colour by the tone field k at its place: yellow, white, blue or purple
vec3 gateWild(float k) { return k < .42 ? vec3(.70, .53, .05) : k < .50 ? vec3(.64, .63, .48) : k < .58 ? vec3(.11, .19, .50) : vec3(.13, .10, .40); }
`;
const VERT_PARS = '\n#define GT(u) textureLod(tTone, u, 0.)\n' + GLSL_PARS + 'varying vec3 vGW;\n';
const FRAG_PARS = '\n#define GT(u) texture2D(tTone, u)\n' + GLSL_PARS + 'varying vec3 vGW;\n';
const VERT_WORLD = '\n{ vec4 gwp = vec4(transformed, 1.);\n#ifdef USE_INSTANCING\n gwp = instanceMatrix * gwp;\n#endif\n vGW = (modelMatrix * gwp).xyz; }\n';
// a Lambert material with this world's paint laid in: pars and body for each stage (so fog, lights and the shadow
// map are three's own). key names the program.
export function gateMaterial(U, key, o, vPars, vBody, fPars, fBody) {
  const m = new THREE.MeshLambertMaterial(o);
  m.onBeforeCompile = (sh) => {
    for (const k in U) sh.uniforms[k] = U[k];
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>' + VERT_PARS + vPars).replace('#include <project_vertex>', vBody + '#include <project_vertex>' + VERT_WORLD);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>' + FRAG_PARS + fPars).replace('#include <color_fragment>', '#include <color_fragment>' + fBody);
    if (m.userData.more) m.userData.more(sh);
  };
  m.customProgramCacheKey = () => 'gate-' + key;
  return m;
}

// THE GROUND'S PAINT: grass, the farmland's plots (long strips: ripening grain the wind runs over, green crops in
// rows, mown hay in swaths, pasture, ley; rough baulks between), the sward under the wall, THE POPPIES' GROUND (P1:
// grass green under scarlet by the cover field, orange-scarlet to deep crimson by tone fields at 3, 12 and 60 m,
// clumps at under a metre, the gust bands shifting it between orange-scarlet and crimson, never paler), and THE ROAD (the built brick along the road's own metres,
// tone fields so no repeat shows, faint wheel ruts, grass and moss in the joints thicker toward the edges, a verge
// that overlaps the edge irregularly; at the gate it widens to the apron). vRoad: (offset d, metre s) on the
// road's own strip, d = 1000 elsewhere. THE fwidth FILTER: where a pixel is larger than a bloom's texels or a
// crop's rows the paint gives way to their own mean (the pixel's footprint on the ground, no metre from the eye).
const GROUND_FPARS = /* glsl */`
#define BLOOM_K ${BLOOM_K.toFixed(3)}
uniform sampler2D tBrick; uniform sampler2D tBloom; uniform sampler2D tGrit; varying vec2 vRoad; varying vec2 vSlip;
// J1, THE LAND'S OWN SURFACE: ps is the place measured ALONG the ground (p plus the slip its mesh carries: the metres a
// slope adds to the plan), so every layer of grain (the blades, flecks, dots and blooms, of 12 m and under) keeps its
// true size on a bank, a flank or a swell. The broad fields (cover, tone at 48 m and over, the plots and their rows)
// stay by the plan's place, because the cards and the things that stand read them there.
vec3 gateGround(vec3 wp, vec2 road, vec2 slip) {
  vec2 p = wp.xz, ps = p + slip;
  vec4 n3 = GT(p / 48.), n12 = GT(p / 192. + .37), n60 = GT(p / 960. + .11), nc = GT(ps / 12. + .61);
  float tone = n3.r * .3 + n12.g * .35 + n60.b * .35, tone2 = mix(n3.g * .3 + n12.a * .3 + n60.r * .4, gateDrift(p).y, .45);
  vec4 ft = texture2D(tBloom, ps / 5.);
  vec2 q = vec2(dot(p, uPlot.xy), dot(p, vec2(-uPlot.y, uPlot.x)));
  vec4 fm = texture2D(tBloom, ps / 17. + .19), fl = texture2D(tBloom, ps / 61. + .57);   // the same blooms larger: clumps of a quarter metre and of a metre
  float fa = length(dFdx(ps)), fb = length(dFdy(ps)), fp = max(min(fa, fb), max(fa, fb) / 16.), fq = fwidth(q.x);
  float fc = max(min(fa, fb), max(fa, fb) / 6.);
  vec4 KS = 1. - smoothstep(vec4(.08, .24, .75, 2.3), vec4(.24, .72, 2.2, 6.8), vec4(fc));   // (T2: the fine layer's four scales, each faded to its mean by the footprint)
  // (J1: the lattices lie on the land's surface, turned 37 degrees off the world's axes (a 3-4-5 turn: no stretch) and
  // wandering by 2.4 m at most over the 960 m field, whose steepest fall is 0.08 a metre: the wander never stretches a
  // dot by more than a fifth, so no dot is drawn out into a streak and no row of dots lines up with the road)
  vec2 pv = mat2(.8, .6, -.6, .8) * ps + (vec2(n60.a, n60.r) - .5) * 2.4;
  float nearK = 1. - smoothstep(.02, .07, fp), midK = 1. - smoothstep(.07, .24, fp), farK = 1. - smoothstep(.25, .9, fp);
  float detail = (.74 + .52 * mix(.5, ft.g, nearK)) * (.80 + .40 * mix(.5, fm.g, midK)) * (.88 + .24 * mix(.5, fl.g, farK));   // (T2: the soft larger layers are quieter now; the crisp fine layer carries the grain)
  float gust = gateGust(p);
  vec2 e = gateEdges(p.x);
  float bank = gateLane(road);
  vec4 cv = gateCover(p, e, bank, mix(.25, .7, smoothstep(22., 34., abs(road.x))));
  float onApron = smoothstep(uRoad.x - 30.1, uRoad.x - 29.9, road.y);       // (the apron: a clean oblong 41 m wide from 27 m before the wall, the frames' own width; the road keeps its 5 m as far as its edge)
  float flare = clamp((road.y - (uRoad.x - 62.)) / 32., 0., 1.);          // (G5: over the 30 m before the apron the road opens out to the apron's own 41 m, a long fan of the same brick: it never arrives as a thin strip)
  float a = abs(road.x), hw = 2.5 + 18. * max(onApron, flare);       // (straight splayed edges, crisp as laid)
  vec4 bk = texture2D(tBrick, vec2(road.x / 5. + .5, road.y / 10.));
  // F8, THE BRICK IS CRISP UNDER THE EYE: where a pixel is smaller than the sheet's texel (102.4 texels to the metre: the eye
  // within some 6 m of the brick), the joints are drawn again from the sheet's own joint channel at the brick's own
  // coordinates, cut at its half and softened by the pixel's footprint alone, and each brick's face takes its tone back
  // from under the blurred joint (a joint is half a brick's tone). Where a pixel is over a texel the sheet stands as it is.
  { float bt = fp * 102.4, jw = clamp(.5 * bt, .05, .5), jc = smoothstep(.5 - jw, .5 + jw, bk.a), crisp = 1. - smoothstep(.6, 1.2, bt);
    bk.rgb *= mix(1., mix(1., .5, jc) / mix(1., .5, bk.a), crisp); }
  vec4 rn = GT(road / 48. + .23);
  float verge = 1. - smoothstep(hw + .1, hw + 1.1, a + ((n3.g - .5) * 1.2 + (nc.b - .5) * 1.2 + (fm.g - .5) * .5) * (1. - .9 * max(onApron, smoothstep(0., .15, flare))));
  // grass, and the close sward under the wall
  vec3 grass = gateGrass(tone) * detail * (.92 + .16 * nc.g) * (.80 + .40 * smoothstep(.25, .75, nc.g * .45 + n12.a * .55));
  grass = mix(grass, grass * vec3(1.28, 1.12, .66), .5 * smoothstep(.52, .8, n3.a * .6 + n60.a * .4));     // drier, seeding patches
  float sward = smoothstep(e.y - 30., e.y + 15., p.y);
  // (the sward is grazed turf, never one flat green: darker clover and paler, drier patches of 10 to 50 m)
  vec3 turf = gateGrass(.20 + .66 * smoothstep(.2, .8, n3.g * .55 + nc.b * .45)) * vec3(1.05, 1.08, .95) * (.80 + .40 * nc.g) * detail;   // (M4: the sward carries the grass's own blades and tufts at three sizes, never a blur)
  turf = mix(turf, turf * vec3(1.28, 1.12, .66), .55 * smoothstep(.5, .78, n12.g * .6 + n3.a * .4));
  turf = mix(turf, vec3(.74, .75, .66), smoothstep(.42, .68, n3.b * .55 + nc.r * .45) * mix(.07, step(.86, ft.r) * (.5 + .5 * ft.a), nearK));   // (G5: daisies in the turf)
  grass = mix(grass, turf, sward);
  // T2: flecks and tufts of 0.1 to 0.4 m, then of a metre and of some metres as the pixel grows, and a few daisies
  vec4 KG = KS * smoothstep(vec4(-1., .012, .04, .12), vec4(0., .045, .15, .45), vec4(fc));     // (a larger scale comes in only where the finer one is going out: no broad plates near us)
  float fk = gFleck(pv, .31, fc) * KG.x + gFleck(pv, .95, fc) * KG.y + gFleck(pv, 3.1, fc) * KG.z * .7 + gFleck(pv, 9.7, fc) * KG.w * .5;
  grass *= 1. + .58 * clamp(fk, -1.2, 1.2);
  vec2 dz = gDot(pv, .15, .25, .03 + .10 * sward + .05 * smoothstep(.5, .8, n3.b), fc);
  grass = mix(grass, vec3(.70, .71, .60), dz.x * .9 * (1. - smoothstep(.035, .11, fc)));
  // the farmland's plots
  float jx = floor(q.x / 44.), offy = gH1(jx) * 150., iy = floor((q.y + offy) / 150.);
  vec2 hv = gH2(vec2(jx, iy));
  float ed = min((.5 - abs(fract(q.x / 44.) - .5)) * 44., (.5 - abs(fract((q.y + offy) / 150.) - .5)) * 150.);
  float rows = mix(.5, smoothstep(.3, .7, abs(fract(q.x / .9) - .5) * 2.), clamp(1. - fq / .9 * 3.6, 0., 1.) * (.3 + .7 * n3.r));   // (P4: rows show near us, unequal; never even bands far off)
  float qw = q.x + (n3.b - .5) * 3.4 + (nc.g - .5) * .8;              // (P4: swaths wander and are unequal, never even machine bands)
  float swath = mix(.5, smoothstep(.2, .8, abs(fract(qw / 3.2) - .5) * 2.), clamp(1. - fq / 3.2 * 2.4, 0., 1.) * (.25 + .75 * n12.r));
  vec3 crop;
  float tram = 1. - .07 * mix(.12, 1. - smoothstep(.02, .06, abs(fract(q.x / 12.) - .5) - .0), clamp(1. - fq / 12. * 30., 0., 1.));
  float drill = mix(.5, smoothstep(.2, .8, abs(fract(q.x / .55) - .5) * 2.), clamp(1. - fq / .55 * 3.6, 0., 1.) * (.3 + .7 * n3.a));
  // (L5: richer crops in clear rows: ripe gold grain in drills, a leafy crop in dark and green rows, green oats, pasture, a clover plot)
  if (hv.x < .30) crop = mix(vec3(.44, .27, .03), vec3(.74, .51, .07), tone * .55 + nc.r * .45) * (.74 + .50 * gust) * tram * (.74 + .5 * n3.b) * (.72 + .56 * drill);
  else if (hv.x < .52) crop = mix(vec3(.15, .105, .06), vec3(.10, .30, .05), .40 + .52 * rows * (.55 + .9 * n3.g)) * (.8 + .4 * tone);
  else if (hv.x < .68) crop = mix(vec3(.17, .30, .11), vec3(.33, .47, .19), swath * (.5 + n3.g)) * (.85 + .3 * tone) * (.80 + .40 * drill);
  else if (hv.x < .86) crop = grass * vec3(1.04, 1.1, .9);
  else crop = mix(vec3(.06, .20, .055), vec3(.13, .31, .08), tone2);
  crop *= (.9 + .2 * hv.y) * mix(1., detail, .7);
  if (hv.x < .68) crop *= 1. + .44 * clamp(fk, -1.2, 1.2);      // (T3: ears, leaves and stubble as crisp flecks near us; the pasture has the grass's own)
  // THE BAULKS between plots (M5: the dark band with a hard straight edge across the first fields was the baulk itself,
  // painted near black between two straight lines): a baulk is rough uncut grass a little darker than the pasture,
  // and a crop ends against it raggedly, by the tone fields of 48 and 12 m and the bloom grain (0.8 to 3.4 m in).
  crop = mix(crop, grass * vec3(.74, .82, .70), 1. - smoothstep(.8, 3.4, ed + (n3.a - .5) * 2.4 + (nc.g - .5) * 1.6 + (fm.g - .5) * .9));
  float farm = 1. - smoothstep(e.x - 40., e.x + 4., p.y + (n12.r - .5) * 14.);
  vec3 col = mix(grass, crop, farm * (1. - verge));
  // the lane's banks: rough grass and fern, darker in patches, bare earth showing on the steep
  col = mix(col, mix(vec3(.064, .142, .040), vec3(.165, .235, .066), fm.g * .6 + n3.r * .4) * (.75 + .5 * ft.g * nearK + .25 * (1. - nearK)), bank * (.55 + .45 * smoothstep(.3, .6, nc.r)));
  // (G2: at the banks' foot a little bare earth shows in patches, darker and damp under the edging)
  col = mix(col, vec3(.150, .105, .062) * (.62 + .7 * mix(.5, ft.g, nearK)) * (.8 + .4 * nc.b), bank * (1. - smoothstep(3.5, 5.4, a + (n3.g - .5) * 2.4)) * smoothstep(.34, .6, nc.g * .6 + n3.a * .4) * .85);
  // THE CRISP FINE LAYER, everywhere on the land (grass, crop, turf and the green under the blooms): blades in tufts,
  // seed heads and small stones of 0.25 to 1 m from the built grain (tGrit) at two sizes, the second turned 3-4-5 so
  // the two never beat; fixed to the ground (ps) and filtered by the texture's own mipmaps alone. Strong contrast;
  // the grain's mean is a half, so the land's tone stands where a pixel is larger than a tuft.
  vec4 g1 = texture2D(tGrit, ps / 8.), g2 = texture2D(tGrit, (mat2(.8, .6, -.6, .8) * ps) / 21. + .37);
  col *= .52 + .96 * (g1.r * .6 + g2.r * .4);
  col = mix(col, vec3(.50, .42, .19) * (.55 + .9 * g1.a), g1.g * .85 * (.4 + .6 * smoothstep(.3, .7, n3.a)));
  col = mix(col, vec3(.30, .29, .26) * (.45 + 1.0 * g1.a), g1.b * (1. - bank) * smoothstep(.5, .62, n12.b));     // (stones only at the fine size, 0.2 to 0.6 m, and only in stony places)
  // P1: the poppies' ground
  float cT = clamp(cv.z * (.70 + .60 * mix(nc.a, n3.b, .4)), 0., 1.);
  float th = 1. - cT;
  // FAR: the standing blooms hide the green between them: a scarlet land, soft clumps of a metre and of some metres
  // (the tone field's own mipmaps: no speck), the thin places green. NEAR (a pixel smaller than a bloom): single
  // blooms seen from above stand apart in clumps with grass between them (the cards carry the flowers that stand).
  float clump = smoothstep(.22, .78, nc.a * .5 + n3.b * .5);
  float cov = (1. - exp(-BLOOM_K * 1.25 * cT)) * mix(1., .62 + .38 * smoothstep(.25, .75, nc.r * .6 + n3.r * .4), farK);
  cov = mix(cov, smoothstep(th - .3, th + .3, fm.r) * step(.002, fm.r), midK * .45);     // (clumps of a quarter metre, soft)
  // T2: single blooms as scarlet dots on the green, 0.26 m apart by the same cover; far off they gather to clumps of a
  // metre, of 2.4 m and of 7.6 m, each scale faded to the cover's own mean (so near us the cards stand among painted
  // blooms of their own size, and far off the dots merge into the red)
  vec2 b4 = gDots(pv, 7.6, cov, fc); float c4 = mix(cov, mix(cov, b4.x, .5), KS.w);
  vec2 b3 = gDots(pv, 2.4, c4, fc); float c3 = mix(c4, mix(c4, b3.x, .62), KS.z);
  vec2 b2 = gDots(pv, .78, c3, fc); float c2 = mix(c3, mix(c3, b2.x, .78), KS.y);
  vec2 b1 = gDots(pv, .26, c2, fc); cov = mix(c2, b1.x, KS.x);
  float dotShade = mix(mix(.5, b2.y, KS.y), b1.y, KS.x);
  float thN = 1. - cT * (.44 + .52 * clump);
  cov = mix(cov, smoothstep(thN - .03, thN + .03, ft.r) * step(.002, ft.r), nearK);
  cov *= mix(1., .42, cv.w * (1. - nearK));                          // (P4: a drift of other colours seen from afar is flowers IN grass, its own mean, never a flat patch of paint)
  col *= 1. - .3 * cT;                                               // the green under the blooms stands in their shade (G1: a soft shade, never near black)
  vec3 red = gateRed(tone2, gust);
  float kd = GT(p / 420. + .77).g;
  // T1 (the owner's term 11): the scarlet is NEVER blended with a drift's white, blue or purple (their mean is a pink or a
  // magenta). A place is the poppies' or the drift's, whole; between them the cover falls to nothing, so green lies there.
  float wk = step(.5, cv.w);
  cov *= clamp(abs(cv.w - .5) * 6., 0., 1.);
  vec3 bloom = mix(red, gateWild(kd) * .85, wk) * mix(1., .80 + .40 * n3.a, farK) * mix(1., .84 + .32 * nc.g, midK) * (.74 + .52 * dotShade);
  bloom = mix(bloom, mix(red, gateWild(fract(ft.b * 3.71) < .86 ? kd : ft.b), wk) * (.35 + .95 * ft.a), nearK);
  col = mix(col, bloom, cov * (1. - verge));
  // the road
  float rt = rn.r * .4 + n12.r * .35 + n60.g * .25;
  vec3 brick = bk.rgb * (.66 + .46 * rt);
  brick *= 1. - .15 * exp(-((a - .78) * (a - .78)) / .05);
  float mossK = smoothstep(.5, .95, bk.a * (.3 + .95 * smoothstep(.5, hw, a + (rn.g - .5) * 1.4)) + (rn.b - .5) * .3);
  brick = mix(brick, grass * .85, mossK * .85);
  float lip = smoothstep(hw - .30, hw - .06, a + ((n3.a - .5) * 1.1 + (rn.a - .5) * .5 + (nc.r - .5) * .55) * (1. - .9 * max(onApron, smoothstep(0., .15, flare))) + .16 * bk.a);
  // the apron before the gate: the same brick laid in panels of 2.5 m between courses of darker brick on edge
  float apron = onApron;
  vec2 pc = vec2(road.x, road.y - uRoad.x) / 2.5, pf = .5 - abs(fract(pc) - .5);
  float pw = fwidth(pc.x) + fwidth(pc.y), pl = mix(1. - smoothstep(.028, .05, min(pf.x, pf.y)), .15, clamp(pw * 7., 0., 1.));   // (far off the courses give way to their own mean)
  // J3, THE BRICK KEEPS ITS BRICKS TO THE APRON: the road and its fan are laid in bays of 2.5 m, as the apron is: a
  // spine course and cross courses of darker bricks on edge, each bay of its own firing (straw to ochre) and each
  // lengthwise run a little its own. The courses that run with the road stay sharp far off (a pixel is narrow across
  // them), so the paving reads as laid brick all the way in; each layer goes to its own mean by the pixel's footprint.
  vec2 bw = vec2(fwidth(pc.x), fwidth(pc.y));
  float lx = (1. - smoothstep(.028, .05, pf.x)) * (1. - clamp(bw.x * 7., 0., 1.)), ly = (1. - smoothstep(.028, .05, pf.y)) * (1. - clamp(bw.y * 7., 0., 1.));
  float bay = mix(1., .86 + .28 * GT((floor(pc) + .5) / 19.2 + .31).g, 1. - clamp(max(bw.x, bw.y) * 2.5, 0., 1.));
  float run = mix(1., .92 + .16 * gH1(floor(pc.x) + 17.), 1. - clamp(bw.x * 2.5, 0., 1.));
  brick *= mix(bay * run * (1. - .30 * max(lx, ly)), 1., apron);
  // THE SPLAY (where the road widens to the court, the 32 m before the apron): the road's own brick at the road's own
  // scale, each bay's firing told apart more strongly than on the narrow road, and a BORDER COURSE half a metre broad
  // of darker bricks on edge along both splayed edges, 0.15 m inside the brick's lip.
  float splay = smoothstep(0., .08, flare) * (1. - apron);
  brick *= mix(1., .80 + .40 * GT((floor(pc) + .5) / 19.2 + .31).b, splay * (1. - clamp(max(bw.x, bw.y) * 1.2, 0., 1.)));
  brick *= 1. - .40 * splay * smoothstep(hw - .70, hw - .62, a) * (1. - smoothstep(hw - .20, hw - .12, a)) * (.8 + .2 * step(.5, fract(road.y / .25)));
  brick *= mix(1., (.84 + .34 * GT((floor(pc) + .5) / 19.2 + .31).g) * (1. - .42 * pl), apron);
  brick *= 1. - .9 * smoothstep(uRoad.x - 1., uRoad.x + 7., road.y);          // the passage behind the ring lies in the dark
  return mix(brick, col, lip);
}
`;
// (the far ground has no triangle within NEAR_CUT metres of the road, where the strip lies: buildLand cuts its sheet
// along that line at build, between the strip's columns at 24 and 28 m; nothing is discarded in the fragment)
const NEAR_CUT = 26;
const GROUND_FBODY = '\n diffuseColor.rgb = gateGround(vGW, vRoad, vSlip) * gateCloud(vGW.xz);\n';

// ---- THE LAND'S MESHES. (1) THE ROAD'S STRIP: columns across the road at every 3 m of it (closer at the bridge),
// 34 m either side, carrying (d, s) so the brick lies along the road's own metres; its outer edge sinks under the
// far ground. (2) THE FAR GROUND: a graded grid to the hills, the uncut land at its true height, with no triangle
// within NEAR_CUT of the road. Both are painted by place alone (one law), so where they meet nothing shows. (3) THE
// HILLS: three rings of low hills at 1.7 to 4.9 km round the plain's middle, crests 26 to 220 m, none behind the city, where the
// plain runs on; they take the ground's paint (the patchwork runs up them), the air's haze, and cast nothing.
const DS = [-34, -28, -24, -20.5, -17, -13.5, -10.5, -8, -6, -4.4, -3.3, -2.9, -2.5, -1.25, 0, 1.25, 2.5, 2.9, 3.3, 4.4, 6, 8, 10.5, 13.5, 17, 20.5, 24, 28, 34];
export const HILLS_AT = [-200, -400], RANGE_BEHIND = 0.8;   // (RANGE_BEHIND: the ranges' share of their own height behind the city and west of it: crests of 24 to 56 m, 56 to 120 m and 120 to 224 m at 1.85, 2.5 and 3.3 km from HILLS_AT, under the city's domes as the road sees them)
const COURT_HALF = 20.5, COURT_DEEP = 15.5;      // (R-e: the court's paving as the city part lays it: 20.5 m either hand of the road's line (the strip's own line there), 15.5 m from the court's edge to the bastions' fronts, where its steps begin)
export async function buildLand(ctx, env) {
  const { road, land, U } = env, L = road.L, group = new THREE.Group();
  const mat = gateMaterial(U, 'ground', {}, 'attribute vec2 aRoad; attribute vec2 aSlip; varying vec2 vRoad; varying vec2 vSlip;\n', '\n vRoad = aRoad; vSlip = aSlip;\n', GROUND_FPARS, GROUND_FBODY);
  const nrm = (x, z, hint, out, o) => {
    const e = 0.6, gx = land.ground(x + e, z, hint) - land.ground(x - e, z, hint), gz = land.ground(x, z + e, hint) - land.ground(x, z - e, hint), l = Math.hypot(gx, 2 * e, gz);
    out[o] = -gx / l; out[o + 1] = 2 * e / l; out[o + 2] = -gz / l;
  };
  // (1) the strip
  const ss = [];
  for (let s = -BEHIND; s < -60; s += 6) ss.push(s);
  for (let s = -60; s <= L + 14.01; s += 3) ss.push(s);
  for (let s = land.places.bridge - 8; s <= land.places.bridge + 8; s += 1) ss.push(s);
  ss.push(land.places.court, land.places.court + COURT_DEEP);   // (R-e: a line of the strip on the court's edge and on its paving's far end)
  ss.sort((a, b) => a - b);
  const cols = ss.filter((s, i) => i === 0 || s - ss[i - 1] > 0.3), nc = cols.length, nd = DS.length;
  // J1, THE SLIP (aSlip): the metres the land's rise and fall add to the plan, so the paint's grain is laid along the
  // ground itself. On the strip it is summed across the road from the centre line outward over the true profile (the
  // camber, the shoulder, a bank, the brook's fold), laid along the road's own cross line: exact on every bank.
  const pos = new Float32Array(nc * nd * 3), nor = new Float32Array(nc * nd * 3), ar = new Float32Array(nc * nd * 2), slip = new Float32Array(nc * nd * 2), idx = [], at = {};
  const yy = new Float32Array(nd), sl = new Float32Array(nd), J0 = DS.indexOf(0);
  for (let i = 0; i < nc; i++) {
    const s = cols[i]; road.at(Math.min(s, L), at); const over = Math.max(0, s - L), cx = at.x + at.tx * over, cz = at.z + at.tz * over;
    for (let j = 0; j < nd; j++) yy[j] = land.cut(Math.min(s, L), DS[j], land.h0(cx - at.tz * DS[j], cz + at.tx * DS[j]));
    sl[J0] = 0;
    for (let j = J0 + 1; j < nd; j++) sl[j] = sl[j - 1] + Math.hypot(DS[j] - DS[j - 1], yy[j] - yy[j - 1]) - (DS[j] - DS[j - 1]);
    for (let j = J0 - 1; j >= 0; j--) sl[j] = sl[j + 1] - Math.hypot(DS[j + 1] - DS[j], yy[j + 1] - yy[j]) + (DS[j + 1] - DS[j]);
    for (let j = 0; j < nd; j++) {
      const d = DS[j], x = cx - at.tz * d, z = cz + at.tx * d, o = (i * nd + j) * 3;
      pos[o] = x; pos[o + 1] = yy[j]; pos[o + 2] = z; nrm(x, z, Math.min(s, L), nor, o);
      ar[(i * nd + j) * 2] = d; ar[(i * nd + j) * 2 + 1] = s; slip[(i * nd + j) * 2] = -at.tz * sl[j]; slip[(i * nd + j) * 2 + 1] = at.tx * sl[j];
      if (i < nc - 1 && j < nd - 1 && !(s > land.places.court - 0.01 && cols[i + 1] < land.places.court + COURT_DEEP + 0.01 && Math.abs(DS[j]) <= COURT_HALF && Math.abs(DS[j + 1]) <= COURT_HALF)) { const a = i * nd + j, b = a + nd; idx.push(a, a + 1, b, a + 1, b + 1, b); }   // (R-e: THE LAND ENDS AT THE COURT'S EDGE: no ground lies under the court's paving)
    }
    if (i % 24 === 23) await ctx.yield();
  }
  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); sg.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); sg.setAttribute('aRoad', new THREE.BufferAttribute(ar, 2)); sg.setAttribute('aSlip', new THREE.BufferAttribute(slip, 2)); sg.setIndex(idx);
  const strip = new THREE.Mesh(sg, mat); strip.receiveShadow = true; group.add(strip);
  await ctx.yield();
  // (2) the far ground
  const lines = (lo, hi, step, outLo, outHi) => { const a = []; for (let v = lo; v <= hi + 0.01; v += step) a.push(v); let st = step * 1.4, v = lo; while (v > outLo) { v -= st; a.unshift(v); st *= 1.4; } st = step * 1.4; v = a[a.length - 1]; while (v < outHi) { v += st; a.push(v); st *= 1.4; } return a; };
  const xs = lines(-860, 300, 24, -5200, 4800), zs = lines(-1180, 60, 24, -5400, 4600), nx = xs.length, nz = zs.length;
  const fp = new Float32Array(nx * nz * 3), fn = new Float32Array(nx * nz * 3), fa = new Float32Array(nx * nz * 2), fs = new Float32Array(nx * nz * 2), fd = new Float32Array(nx * nz), fi = [], nr = {};
  const nrm0 = (x, z, out, o) => { const e = 0.6, gx = land.h0(x + e, z) - land.h0(x - e, z), gz = land.h0(x, z + e) - land.h0(x, z - e), l = Math.hypot(gx, 2 * e, gz); out[o] = -gx / l; out[o + 1] = 2 * e / l; out[o + 2] = -gz / l; };   // (the uncut land's own normal)
  // (J1: the far ground's slip: along every line of its grid the uncut land's rise and fall are summed in 6 m steps,
  // east-west for x and north-south for z, over the close grid (its 24 m cells: the ridge's flanks and the swells);
  // on the wide outer cells toward the hills it is held)
  const more = (x0, z0, x1, z1) => { const len = Math.hypot(x1 - x0, z1 - z0); if (len > 24.5) return 0; const n = Math.max(1, Math.round(len / 6)), st = len / n; let a = 0, hp = land.h0(x0, z0); for (let k = 1; k <= n; k++) { const hq = land.h0(mix(x0, x1, k / n), mix(z0, z1, k / n)); a += Math.hypot(st, hq - hp) - st; hp = hq; } return a; };
  for (let j = 0; j < nz; j++) {
    for (let i = 0; i < nx; i++) {
      const k = (j * nx + i) * 2;
      fs[k] = i > 0 ? fs[k - 2] + more(xs[i - 1], zs[j], xs[i], zs[j]) : 0; fs[k + 1] = j > 0 ? fs[k + 1 - 2 * nx] + more(xs[i], zs[j - 1], xs[i], zs[j]) : 0;
    }
    if (j % 6 === 5) await ctx.yield();
  }
  for (let j = 0; j < nz; j++) {
    for (let i = 0; i < nx; i++) {
      const x = xs[i], z = zs[j], o = (j * nx + i) * 3; road.near(x, z, undefined, nr);
      const gy = land.h0(x, z);                     // (the far ground is the uncut land itself, at its true height; within NEAR_CUT of the road it has no triangle)
      fp[o] = x; fp[o + 1] = gy; fp[o + 2] = z; nrm0(x, z, fn, o); fd[j * nx + i] = nr.dist;
      fa[(j * nx + i) * 2] = 1000; fa[(j * nx + i) * 2 + 1] = 0;
      if (i < nx - 1 && j < nz - 1) { const a = j * nx + i, b = a + nx; fi.push(a, b, a + 1, a + 1, b, b + 1); }
    }
    if (j % 6 === 5) await ctx.yield();
  }
  const fg = new THREE.BufferGeometry();
  // NO TRIANGLE WITHIN NEAR_CUT OF THE ROAD: a triangle wholly inside that line is left out of the index; one the line
  // crosses is cut along it (a new corner on each crossed edge, every attribute laid between the edge's two ends by
  // the corners' own distances from the road), so the sheet's rim runs along the line itself.
  const nv = nx * nz, ex = [], ci = [], seen = new Map();
  const cutAt = (a, b) => { const key = a < b ? a * nv + b : b * nv + a; let k = seen.get(key); if (k === undefined) { k = nv + ex.length / 3; ex.push(a, b, (NEAR_CUT - fd[a]) / (fd[b] - fd[a])); seen.set(key, k); } return k; };
  for (let q = 0; q < fi.length; q += 3) {
    let a = fi[q], b = fi[q + 1], c = fi[q + 2]; const n = (fd[a] >= NEAR_CUT ? 1 : 0) + (fd[b] >= NEAR_CUT ? 1 : 0) + (fd[c] >= NEAR_CUT ? 1 : 0);
    if (n === 3) ci.push(a, b, c);
    else if (n === 1) { while (fd[a] < NEAR_CUT) { const o = a; a = b; b = c; c = o; } ci.push(a, cutAt(a, b), cutAt(a, c)); }
    else if (n === 2) { while (fd[c] >= NEAR_CUT) { const o = a; a = b; b = c; c = o; } const p = cutAt(b, c), r = cutAt(a, c); ci.push(a, b, p, a, p, r); }
  }
  const ne = ex.length / 3, grown = (A, w) => { const O = new Float32Array((nv + ne) * w); O.set(A); for (let e = 0; e < ne; e++) { const a = ex[e * 3], b = ex[e * 3 + 1], k = ex[e * 3 + 2]; for (let c = 0; c < w; c++) O[(nv + e) * w + c] = mix(A[a * w + c], A[b * w + c], k); } return O; };
  fg.setAttribute('position', new THREE.BufferAttribute(grown(fp, 3), 3)); fg.setAttribute('normal', new THREE.BufferAttribute(grown(fn, 3), 3)); fg.setAttribute('aRoad', new THREE.BufferAttribute(grown(fa, 2), 2)); fg.setAttribute('aSlip', new THREE.BufferAttribute(grown(fs, 2), 2)); fg.setIndex(ci);
  await ctx.yield();
  // (J3, NO FOLD WHERE THE STRIP MEETS THE FAR GROUND: the strip's outermost column, 34 m off the centre line, dives
  // 0.35 m under the far ground's OWN surface there (its grid's own triangles), so the two sheets cross with no trench
  // and no step on level land, and the far ground covers the strip's edge on every stretch)
  const cellOf = (A, v) => { let k = 0; while (k < A.length - 2 && A[k + 1] <= v) k++; return k; };
  const farY = (x, z) => { const i = cellOf(xs, x), j = cellOf(zs, z), u = sat((x - xs[i]) / (xs[i + 1] - xs[i])), v = sat((z - zs[j]) / (zs[j + 1] - zs[j])), a = (j * nx + i) * 3 + 1, b = a + nx * 3;
    return u + v <= 1 ? fp[a] + u * (fp[a + 3] - fp[a]) + v * (fp[b] - fp[a]) : fp[b + 3] + (1 - u) * (fp[b] - fp[b + 3]) + (1 - v) * (fp[a + 3] - fp[b + 3]); };
  // (L2, NO SLIT UNDER THE FAR GROUND'S RIM: where the far ground's coarser sheet stands OVER the strip, an outer column
  // 0.35 m under it left a slit under that sheet through which the pale air showed as a thin straight line along the
  // road, 34 m off. There the outer column now rises to the far sheet's own surface and closes it; where the strip
  // stands over the far sheet it dives under it as before.)
  for (let i = 0; i < nc; i++) { for (const j of [0, nd - 1]) { const o = (i * nd + j) * 3, fy = farY(pos[o], pos[o + 2]); pos[o + 1] = pos[o + 1] < fy ? fy + 0.03 : fy - 0.35; } if (i % 64 === 63) await ctx.yield(); }
  const far = new THREE.Mesh(fg, mat); far.receiveShadow = true; group.add(far);
  await ctx.yield();
  // (3) the hills
  const hr = streamOf(ctx, 'gate-hills'), SEG = 360, hp = [], ha = [], hi = [];
  for (let ring = 0; ring < 3; ring++) {           // (the third ring: nearer, lower downs at 1.7 to 2.7 km, so the land rises to the sky in three soft pale layers)
    const r0 = [2000, 2700, 1500][ring], r1 = [2500, 3300, 1850][ring], r2 = [3100, 3900, 2300][ring], lo = [70, 150, 30][ring], hiH = [150, 280, 70][ring],   // (THE RANGES ARE SEEN: the world's air keeps a half of a thing's colour at 1.7 km, a quarter at 2.5 km and a twelfth at 3.3 km, so the downs' crest stands at 1.85 km, the middle range's at 2.5 km and the far range's, the highest, at 3.3 km, where it clears the haze that lies low on the sky)
       ph = [hr.range(0, TAU), hr.range(0, TAU), hr.range(0, TAU), hr.range(0, TAU)], base = hp.length / 3;
    for (let k = 0; k <= SEG; k++) {
      const an = k / SEG * TAU, sx = Math.sin(an), cz = Math.cos(an);                       // an = 0 looks along +z (behind the city)
      const off = Math.min(Math.abs(an), TAU - Math.abs(an)), open = mix(RANGE_BEHIND, 1, sstep(0.55, 1.05, off));   // (THE RANGES STAND ROUND THE WHOLE HORIZON: behind the city and west of it they run on at RANGE_BEHIND of their height, so the horizon is nowhere a level line and the city's domes and towers still keep the outline over them)
      const w = 0.5 + 0.22 * Math.sin(an * 3 + ph[0]) + 0.16 * Math.sin(an * 7 + ph[1]) + 0.08 * Math.sin(an * 17 + ph[2]) + 0.04 * Math.sin(an * 41 + ph[3]);
      const H = mix(lo, hiH, sat(w)) * open, rc = r1 + 160 * Math.sin(an * 5 + ph[1]);
      const rows = [[r0, 0], [mix(r0, rc, 0.55), 0.5 * H], [rc, H], [r2, 0.2 * H]];
      for (const [r, y] of rows) { hp.push(HILLS_AT[0] + sx * r, y + 1.5 * open - 1, HILLS_AT[1] + cz * r); ha.push(1000, 0); }
      if (k < SEG) for (let q = 0; q < 3; q++) { const a = base + k * 4 + q, b = a + 4; hi.push(a, a + 1, b, a + 1, b + 1, b); }
    }
    await ctx.yield();
  }
  const hg = new THREE.BufferGeometry();
  hg.setAttribute('position', new THREE.Float32BufferAttribute(hp, 3)); hg.setAttribute('aRoad', new THREE.Float32BufferAttribute(ha, 2)); hg.setAttribute('aSlip', new THREE.BufferAttribute(new Float32Array(ha.length), 2)); hg.setIndex(hi);
  // (the far hills carry no grain: no slip)
  hg.computeVertexNormals();
  const hills = new THREE.Mesh(hg, mat); group.add(hills);
  return { object: group, strip, far, hills, material: mat, columns: nc };
}

// ---- P2, THE STANDING BLOOMS (design sections 6 and 14, R6): cards of three to six poppies, 0.7 m wide, each a
// crossed pair (four triangles), casting no shadow, BY PLACE within BAND metres either side of the road's centre line
// (a typed choice, true on every seed: it is where the road runs): two thirds of them within CARD_NEAR metres of the
// centre line, the rest thinning out to BAND; never nearer the centre line than 3.5 m. A candidate stands at every
// STEP (0.7 m) of the road and of the offset within CARD_NEAR, at every 1.22 m beyond (jittered); all its dice are drawn
// before any test; it is kept with a chance
// that is the cover field's own total there, so the cards' cover and P1's red agree and nothing shows where they
// stop. Their red is the ground's own red law at their place; in a drift at the field's edge they take the drift's
// own colour. They sway by the one wind field.
// CARD_NEAR: the close lattice's reach from the centre line (the flown line's greatest offset, FLOWN_MOST, and the
// eye's near reach, EYE_NEAR: the ground the eye passes right over). No cut by count: the lattice and the cover law
// set how many stand. CARD_FAR: a chunk of blooms farther than this from the eye's place is not drawn, and every card
// FADES IN by its alpha cut over the last FADE metres before that distance (in the card's shader, from its own
// distance), so no block of cards comes on at once.
// THE NEAR GROUND'S CARDS stand by distance from the ROAD'S CENTRE LINE alone: at full density within NEAR_IN metres
// of it (FLOWN_MOST + EYE_NEAR), thinning to nothing at NEAR_REACH by (1 - smoothstep(NEAR_IN, NEAR_REACH))^1.5; in
// chunks of NEAR_CH metres of road, drawn within NEAR_FAR metres of the eye's place (the thinner outer bands within
// NEAR_OUT), fading in over the last FADE metres by the same law.
export const EYE_NEAR = 6, CARD_NEAR = FLOWN_MOST + EYE_NEAR, CARD_FAR = 160, FADE = 20;   // (EYE_NEAR: twice the eye's height over open ground, what it passes right over; CARD_FAR: a BUDGET figure, the reach the heaviest view's triangles allow)
export const NEAR_REACH = 40, NEAR_IN = FLOWN_MOST + EYE_NEAR, NEAR_FAR = 80, NEAR_OUT = 60, NEAR_CH = 36, DRESS_FAR = 100;   // (DRESS_FAR: a BUDGET figure, as CARD_FAR is)
const WILD = [[0.70, 0.53, 0.05], [0.64, 0.63, 0.48], [0.11, 0.19, 0.50], [0.13, 0.10, 0.40]];   // yellow, white, blue, a deep blue-violet (never pink)
const BRICK_HALF = 2.5, SINGLE_REACH = 12, SINGLE_STEP = 0.45;   // (F8. BRICK_HALF: the brick's half width; SINGLE_REACH: the single plants' reach off the road's centre, the near lattice's own; SINGLE_STEP: under a card's breadth, 0.7 m, so two may stand touching)
export async function buildPoppies(ctx, env) {
  const { road, land, U } = env, rng = streamOf(ctx, 'gate-poppy'), group = new THREE.Group(), STEP = 0.7, PL = land.places, S0 = PL.edge, S1 = PL.sward, CH = 90;   // (the lattice runs from the wall's crossing to the sward's edge, both as dealt: the cover law's own stretch on the road)   // (F-6: STEP is the card's own breadth, 0.7 m: the blooms stand shoulder to shoulder)
  const inYard = (x, z) => { for (const h of env.things.homes) if (Math.hypot(x - h.x, z - h.z) < h.r + 1) return true; return false; };   // (F-8: nothing of the ground's dress stands through a farmyard's wall or a house: h.r is the yard's own reach)
  const cardMat = (far) => { const mat = gateMaterial({ ...U, uFar: { value: far } }, 'card', { side: THREE.DoubleSide, alphaTest: CARD_CUT },
    'attribute vec3 aSway; attribute vec4 aTint; attribute vec2 aCuv; uniform float uFar; varying vec2 vCuv; varying vec4 vTint; varying float vGust; varying float vFade;\n',
    `\n { float g = gateGust(position.xz); vGust = g; vCuv = aCuv; vTint = aTint;
      vFade = 1. - smoothstep(uFar - ${FADE.toFixed(1)}, uFar, distance(cameraPosition, (modelMatrix * vec4(position, 1.)).xyz));
      float amp = aSway.x * uWind.w * (.04 + .17 * g), ph = aSway.y * 6.2832 + uTime * (2.4 + 1.3 * aSway.y);
      transformed.xz += uWind.xy * amp * (1. + .5 * sin(ph)) + vec2(-uWind.y, uWind.x) * amp * .4 * cos(ph * 1.31);
      transformed.y -= amp * amp * .8;
      if (aSway.z > 0.) { float pk = gatePlotKind(position.xz); transformed.y -= aSway.z * (1. - (pk < .30 ? 1. : pk < .52 ? .62 : pk < .68 ? .24 : pk < .86 ? .32 : .5)); } }\n`,
    'uniform sampler2D tCard; varying vec2 vCuv; varying vec4 vTint; varying float vGust; varying float vFade;\n',
    `\n { vec4 ct = texture2D(tCard, vCuv); vec2 p = vGW.xz;
      // (F8, NO SPARKLE FAR OFF: where a pixel takes in more than a texel of the card (512 texels across the sheet), its light and shade go to the middle of their range and its dark blotch goes out, by the card's own footprint: a far card is its mean tone, never bright strokes)
      { float cf = max(fwidth(vCuv.x), fwidth(vCuv.y)) * 512., ck = smoothstep(1., 4., cf); ct.r = mix(ct.r, .5, ck); ct.b *= 1. - ck; }
      vec4 n3 = GT(p / 48.), n12 = GT(p / 192. + .37), n60 = GT(p / 960. + .11);
      float tone = n3.r * .3 + n12.g * .35 + n60.b * .35, tone2 = mix(n3.g * .3 + n12.a * .3 + n60.r * .4, gateDrift(p).y, .45);
      float wild = max(vTint.a, 0.);
      vec3 petal = mix(gateRed(tone2, vGust), vTint.rgb, wild), green = gateGrass(tone) * (.26 + .62 * ct.r) * (1. + 2.2 * vTint.rgb * step(abs(vTint.a), .25));
      if (vTint.a < -.5) { float pk = gatePlotKind(p);        // a crop's card: ripening grain the wind runs over, a leafy crop in rows, or grass
        green = pk < .30 ? mix(vec3(.36, .225, .03), vec3(.74, .51, .08), ct.r) * (.76 + .5 * vGust) : pk < .52 ? vec3(.080, .215, .048) * (.45 + .95 * ct.r) : gateGrass(tone) * (.45 + .7 * ct.r); }
      vec3 col = mix(green, petal * (.34 + 1.25 * ct.r) + vec3(.05, .016, .0) * ct.r * (1. - wild), ct.g * step(-.5, vTint.a));
      col = mix(col, vec3(.012, .008, .012), ct.b * ct.g);
      diffuseColor = vec4(col * gateCloud(p), ct.a * mix(.3, 1., vFade) * step(.001, vFade)); }\n`);
    mat.userData.more = (sh) => { sh.fragmentShader = sh.fragmentShader.replace('#include <normal_fragment_begin>', '#include <normal_fragment_begin>\n normal = normalize(vNormal);\n'); };
    return mat; };
  const mats = new Map(), matOf = (far) => { let m = mats.get(far); if (!m) mats.set(far, m = cardMat(far)); return m; };   // (one program; a material to each reach, so each carries its own uFar)
  const chunks = [], at = {}, cv = {}; let count = 0, nearCount = 0;
  // (EVERY CARD SET IS FOUR TYPED ARRAYS laid once and doubled when full: a card is twelve, twelve, sixteen and eight floats written in place)
  const WIDE = [['pos', 12], ['sway', 12], ['tint', 16], ['uv', 8]];
  const setOf = (far, cap) => { const C = { n: 0, cap, far }; for (const [nm, w] of WIDE) C[nm] = new Float32Array(cap * w); return C; };
  const grow = (C) => { for (const [nm, w] of WIDE) { const A = new Float32Array(C.cap * 2 * w); A.set(C[nm]); C[nm] = A; } C.cap *= 2; };
  const chunkOf = (s) => { const k = Math.floor((s + 200) / CH); return chunks[k] || (chunks[k] = setOf(0, 4096)); };
  // (THE LOW DRESS, the verge's tufts, the crops' rows and the lane's fern and parsley, lies in its own chunks of half that length, drawn within DRESS_FAR of the eye's place and fading in like every card)
  const dress = [], dressOf = (s) => { const k = Math.floor((s + 200) / (CH / 2)); return dress[k] || (dress[k] = setOf(DRESS_FAR, 2048)); };
  const quadOf = (C, x, y, z, yaw, w, h, lx, lz, cell, vTop, phase, sw, tintOf, hz = 0) => {
    if (C.n === C.cap) grow(C);
    const i = C.n++, rx = Math.cos(yaw) * w / 2, rz = Math.sin(yaw) * w / 2, u0 = (cell & 1) * 0.5 + 0.006, v0 = (cell >> 1) * 0.5 + 0.004, u1 = u0 + 0.488, v1 = v0 + vTop;
    const P = C.pos, o = i * 12, Q = C.uv, q = i * 8, S = C.sway, Tn = C.tint, t = i * 16, t0 = tintOf[0], t1 = tintOf[1], t2 = tintOf[2], t3 = tintOf[3];
    P[o] = x - rx; P[o + 1] = y; P[o + 2] = z - rz; P[o + 3] = x + rx; P[o + 4] = y; P[o + 5] = z + rz; P[o + 6] = x + rx + lx; P[o + 7] = y + h; P[o + 8] = z + rz + lz; P[o + 9] = x - rx + lx; P[o + 10] = y + h; P[o + 11] = z - rz + lz;
    Q[q] = u0; Q[q + 1] = v0; Q[q + 2] = u1; Q[q + 3] = v0; Q[q + 4] = u1; Q[q + 5] = v1; Q[q + 6] = u0; Q[q + 7] = v1;
    S[o + 1] = phase; S[o + 4] = phase; S[o + 6] = sw; S[o + 7] = phase; S[o + 8] = hz; S[o + 9] = sw; S[o + 10] = phase; S[o + 11] = hz;
    Tn[t] = t0; Tn[t + 1] = t1; Tn[t + 2] = t2; Tn[t + 3] = t3; Tn[t + 4] = t0; Tn[t + 5] = t1; Tn[t + 6] = t2; Tn[t + 7] = t3; Tn[t + 8] = t0; Tn[t + 9] = t1; Tn[t + 10] = t2; Tn[t + 11] = t3; Tn[t + 12] = t0; Tn[t + 13] = t1; Tn[t + 14] = t2; Tn[t + 15] = t3;
  };
  // two lattices of candidates, each drawn whole before any test: NEAR (3.5 to CARD_NEAR metres off the centre line,
  // every STEP) and FAR (CARD_NEAR to BAND, every 1.22 m, thinning over the outer BAND_FADE)
  const NONE = [0, 0, 0, 0], LIFT = [0.8, 0.85, 0.5, 0], TW = [0, 0, 0, 1], FAR_STEP = 1.22, nNear = Math.ceil((CARD_NEAR - 3.5) / STEP), nFar = Math.ceil((BAND - CARD_NEAR) / FAR_STEP);
  const stand = (sc, d, zone, keep, wildDie, colDie, yaw, sz, cell, phase, lean, leanA, shade, cell2, turn2, tall = 1) => {
    const a = Math.abs(d); if (keep >= zone) return;       // (the cover is 1 at most: a die over the zone's share never stands, and its place need not be read)
    road.at(sc, at); const x = at.x - at.tz * d, z = at.z + at.tx * d; land.cover(x, z, cv, sc, d);
    if (keep >= cv.total * zone) return;
    const y = land.cut(sc, d, land.h0(x, z)) - 0.03, w = 0.7 * (0.88 + 0.24 * sz) * tall, h = (a <= CARD_NEAR ? 0.9 : 0.8) * (0.74 + 0.5 * sz) * tall;   // (F8: a stand's blooms taller and shorter by its own die, 0.6 to 1.1 m about a field poppy's true height, never one level top)
    const lx = Math.cos(leanA) * lean * 0.12, lz = Math.sin(leanA) * lean * 0.12, C = chunkOf(sc);
    const wild = wildDie < sstep(0.42, 0.58, cv.wild), wc = WILD[colDie < 0.86 ? cv.kind : Math.min(3, Math.floor((colDie - 0.86) / 0.035))], k = 0.8 + 0.3 * shade, tn = wild ? TW : NONE; if (wild) { TW[0] = wc[0] * k; TW[1] = wc[1] * k; TW[2] = wc[2] * k; }
    quadOf(C, x, y, z, yaw, w, h, lx, lz, cell, 0.49, phase, 1, tn);
    quadOf(C, x, y, z, yaw + 1.2 + 0.75 * turn2, w, h, lx, lz, cell2, 0.49, phase, 1, tn);
    count++; if (a <= CARD_NEAR) nearCount++;
  };
  for (let s = S0, row = 0; s < S1; s += STEP, row++) {
    for (let j = 0; j < 2 * nNear; j++) {
      const js = rng(), jd = rng(), keep = rng(), wildDie = rng(), colDie = rng(), yaw = rng() * TAU, sz = rng(), cell = Math.floor(rng() * 4), phase = rng(), lean = rng(), leanA = rng() * TAU, shade = rng(), cell2 = Math.floor(rng() * 4), turn2 = rng();
      const a = 3.5 + ((j >> 1) + jd) * (CARD_NEAR - 3.5) / nNear;
      stand(s + (js - 0.5) * STEP, j & 1 ? a : -a, 0.86, keep, wildDie, colDie, yaw, sz, cell, phase, lean, leanA, shade, cell2, turn2);
    }
    if (row % 4 === 3) await ctx.yield();
  }
  for (let s = S0, row = 0; s < S1; s += FAR_STEP, row++) {
    for (let j = 0; j < 2 * nFar; j++) {
      const js = rng(), jd = rng(), keep = rng(), wildDie = rng(), colDie = rng(), yaw = rng() * TAU, sz = rng(), cell = Math.floor(rng() * 4), phase = rng(), lean = rng(), leanA = rng() * TAU, shade = rng(), cell2 = Math.floor(rng() * 4), turn2 = rng();
      const a = CARD_NEAR + ((j >> 1) + jd) * (BAND - CARD_NEAR) / nFar;
      stand(s + (js - 0.5) * FAR_STEP, j & 1 ? a : -a, 0.86 * (1 - sstep(BAND - BAND_FADE, BAND, a)), keep, wildDie, colDie, yaw, sz, cell, phase, lean, leanA, shade, cell2, turn2);
    }
    if (row % 4 === 3) await ctx.yield();
  }
  // F8, SINGLE POPPIES STAND BESIDE THE ROAD AS PLANTS (stream 'gate-poppy-single'; dice before test; BY THE ROAD'S OWN METRES:
  // every SINGLE_STEP of the cover law's stretch, one to each side): from a foot off the brick's edge to SINGLE_REACH off
  // the centre line, crowding toward the brick by the die's square; each one card's plants (stems, nodding buds, open
  // blooms) shorter or taller by its own die, 0.55 to 1.05 of a stand's height (0.37 to 1.17 m: the tallest stays under HEAD, the tallest thing the flown line reckons beside it); where the cover law is thin it stands
  // alone in the grass. Its chance is the cover field's own total there.
  const lone = streamOf(ctx, 'gate-poppy-single'); let singles = 0;
  for (let s = S0, row = 0; s < S1; s += SINGLE_STEP, row++) {
    for (let j = 0; j < 2; j++) {
      const js = lone(), jd = lone(), keep = lone(), wildDie = lone(), colDie = lone(), yaw = lone() * TAU, sz = lone(), cell = Math.floor(lone() * 4), phase = lone(), lean = lone(), leanA = lone() * TAU, shade = lone(), cell2 = Math.floor(lone() * 4), turn2 = lone(), tl = lone();
      const a = BRICK_HALF + 0.3 + jd * jd * (SINGLE_REACH - BRICK_HALF - 0.3), before = count;
      stand(s + (js - 0.5) * SINGLE_STEP, j ? a : -a, 0.9, keep, wildDie, colDie, yaw, sz, cell, phase, lean, leanA, shade, cell2, turn2, 0.55 + 0.5 * tl * tl);
      singles += count - before;
    }
    if (row % 40 === 39) await ctx.yield();
  }
  // THE BANKS' FERN AND ROUGH GRASS: on the sunk lane's banks and 10 m beyond their rims, where no poppy stands: tufts
  // (the lower third of a card: blades and toothed leaves), green by the grass law at their place. Dice before test.
  let ferns = 0;
  for (let s = land.lane[0] - 12, row = 0; s < land.lane[1] + 12; s += 0.8, row++) {
    for (let j = 0; j < 76; j++) {
      const js = rng(), jd = rng(), keep = rng(), yaw = rng() * TAU, sz = rng(), cell = Math.floor(rng() * 4), phase = rng();
      const d = -30.4 + (j + jd) * 0.8, sc = s + (js - 0.5) * 0.8, a = Math.abs(d);
      if (a < 3.4 || keep >= 0.26 * land.laneAt(sc, d)) continue;
      road.at(sc, at); const x = at.x - at.tz * d, z = at.z + at.tx * d;
      quadOf(dressOf(sc), x, land.cut(sc, d, land.h0(x, z)) - 0.03, z, yaw, 0.9 * (0.8 + 0.5 * sz), 0.42 * (0.7 + 0.8 * sz), 0, 0, cell, 0.25, phase, 0.6, LIFT);
      ferns++;
    }
    if (row % 10 === 9) await ctx.yield();
  }
  // G2, THE HOLLOWAY'S BANKS DRESSED (stream 'gate-holloway'; dice before test; BY PLACE: the lane's own metres, 3.5
  // to 18.5 m off the centre line, on the banks alone): tall grass and fern (the card's lower quarter, drawn large,
  // thickest at the banks' foot) and COW PARSLEY in drifts of 5 to 15 m by a tone field (whole cards 1.1 m tall,
  // white; a few yellow and blue-violet among them; never pink). No poppy stands here, so no white lies on the red.
  const hr = streamOf(ctx, 'gate-holloway'), tone = env.tone; let dressed = 0;
  for (let s = land.lane[0] - 6, row = 0; s < land.lane[1] + 6; s += 0.7, row++) {
    for (let j = 0; j < 40; j++) {
      const js = hr(), jd = hr(), keep = hr(), yaw = hr() * TAU, sz = hr(), cell = Math.floor(hr() * 4), phase = hr(), kindDie = hr(), cell2 = Math.floor(hr() * 4), turn2 = hr();
      const a = 3.5 + ((j >> 1) + jd) * 0.75, d = (j & 1 ? 1 : -1) * a, sc = s + (js - 0.5) * 0.7;
      if (keep >= 0.62 || land.laneAt(sc, d) < 0.5) continue;
      road.at(sc, at); const x = at.x - at.tz * d, z = at.z + at.tx * d, y = land.cut(sc, d, land.h0(x, z)) - 0.03, C = dressOf(sc);
      const drift = sstep(0.46, 0.62, tone.at(x / 64 + 0.21, z / 64 + 0.63, 1)), foot = 1 - sstep(4.5, 9, a);
      if (kindDie < 0.45) {
        if (keep >= 0.55 * (0.3 + 0.7 * foot)) continue;
        const w = 1.3 * (0.8 + 0.5 * sz), h = 0.72 * (0.7 + 0.7 * sz);
        quadOf(C, x, y, z, yaw, w, h, 0, 0, cell, 0.25, phase, 0.6, LIFT); quadOf(C, x, y, z, yaw + 1.2 + 0.75 * turn2, w, h, 0, 0, cell2, 0.25, phase, 0.6, LIFT);
      } else {
        if (keep >= 0.62 * drift * (1 - sstep(13, 18, a))) continue;
        const wc = WILD[kindDie < 0.9 ? 1 : kindDie < 0.96 ? 0 : 3], k = 0.9 + 0.3 * sz, tn = TW, w = 0.95 * (0.85 + 0.3 * sz), h = 1.1 * (0.85 + 0.3 * sz);
        TW[0] = wc[0] * k; TW[1] = wc[1] * k; TW[2] = wc[2] * k;
        quadOf(C, x, y, z, yaw, w, h, 0, 0, cell, 0.49, phase, 1, tn); quadOf(C, x, y, z, yaw + 1.2 + 0.75 * turn2, w, h, 0, 0, cell2, 0.49, phase, 1, tn);
      }
      dressed++;
    }
    if (row % 8 === 7) await ctx.yield();
  }
  // THE VERGE'S GRASS: tufts of blades (the lower fifth of a card, green by the grass law at their place) along the
  // road's edges, 2.75 to 6.6 m from the centre line, thinning outward, from behind the entry to the apron; they
  // give way where the poppies' cards stand. The same dice-before-test law.
  let tufts = 0;
  for (let s = -150, row = 0; s < road.L - 34; s += 0.6, row++) {
    for (let j = 0; j < 14; j++) {
      const js = rng(), jd = rng(), keep = rng(), yaw = rng() * TAU, sz = rng(), cell = Math.floor(rng() * 4), phase = rng();
      const a = 2.75 + ((j % 7) + jd) * 0.55, d = (j < 7 ? -1 : 1) * a, sc = s + (js - 0.5) * 0.6;
      if (Math.abs(sc - land.places.bridge) < 13 || a < 2.7 + 18 * sat((sc - (road.L - 62)) / 32) || keep >= 0.42 * (1 - sstep(4.0, 6.6, a))) continue;       // (never on the brick of the road's fan before the apron)
      road.at(sc, at); const x = at.x - at.tz * d, z = at.z + at.tx * d; land.cover(x, z, cv, sc, d);
      if (keep >= 0.42 * (1 - sstep(4.0, 6.6, a)) * (1 - 0.8 * sstep(0.05, 0.3, cv.total) * sstep(3.4, 4.2, a))) continue;
      quadOf(dressOf(sc), x, land.cut(sc, d, land.h0(x, z)) - 0.02, z, yaw, 0.8 * (0.85 + 0.4 * sz), 0.4 * (0.8 + 0.5 * sz), 0, 0, cell, 0.165, phase, 0.5, NONE);
      tufts++;
    }
    if (row % 40 === 39) await ctx.yield();
  }
  // THE CROPS' ROWS (stretch A, F4): cards of blades and leaves standing ON THE PLOTS' OWN ROW LINES (every 0.9 m
  // across the plots' bearing, where the paint draws its rows), 6.9 to 20.4 m either side of the centre line from
  // the entry to the wall's crossing as dealt (and off the road to the cover law's boundary), turned along the row: the card takes its
  // plot's height and colour in its shader (grain stands 0.95 m and sways, the leafy crop 0.6 m, mown hay and
  // pasture a quarter of that), so the crops stand in rows with real height. Dice before test.
  let crops = 0; const turn = env.look.plotTurn, pcs = Math.cos(turn), psn = Math.sin(turn), ROW = 0.9, CROP = [0, 0, 0, -1];
  for (let s = 0, row = 0; s < PL.edge; s += 1, row++) {
    for (let j = 0; j < 30; j++) {
      const js = rng(), jd = rng(), keep = rng(), yawJ = rng(), sz = rng(), cell = Math.floor(rng() * 4), phase = rng();
      const a = 6.9 + ((j >> 1) + jd) * 0.9, d = (j & 1 ? 1 : -1) * a, sc = s + (js - 0.5);
      if (Math.abs(sc - land.places.bridge) < 15 || keep > 0.48) continue;
      road.at(sc, at); let x = at.x - at.tz * d, z = at.z + at.tx * d;
      const qx = x * pcs + z * psn, qy = -x * psn + z * pcs, rx = Math.round(qx / ROW) * ROW; x = rx * pcs - qy * psn; z = rx * psn + qy * pcs;
      if (z > land.zS(x) - 30 || inYard(x, z)) continue;
      const hh = 0.95 * (0.85 + 0.3 * sz);
      quadOf(dressOf(sc), x, land.ground(x, z, sc) - 0.03, z, turn + Math.PI / 2 + (yawJ - 0.5) * 0.7, 1.15, hh, 0, 0, cell, 0.18, phase, 0.8, CROP, hh);
      crops++;
    }
    if (row % 30 === 29) await ctx.yield();
  }
  // THE NEAR GROUND'S STANDING THINGS (stream 'gate-near'; dice before test; typed arrays, one pass, no card kept as
  // an object). ONE LAW OF DISTANCE FROM THE ROAD'S CENTRE LINE: from 8 m behind the entry to 2 m short of the
  // apron's edge the cards stand at one density within
  // NEAR_IN metres either side of that line (candidates a card's own breadth, 0.7 m, apart across it at every half
  // metre of it: about 2.9 to a square metre) and thin from NEAR_IN to nothing at NEAR_REACH by
  // (1 - smoothstep(NEAR_IN, NEAR_REACH))^1.5. TRUE SIZES: grass blades 0.4 to 0.7 m and seeding grass 0.6 to 0.8 m;
  // on the farmland's plots the plot's own crop, 0.9 to 1.1 m, on its row lines across the plot; daisies and Baum's
  // other colours (yellow, blue, purple; never pink) as heads on stalks of 0.5 to 0.7 m, in drifts of 5 to 15 m by a
  // tone field. THE SWARD'S VERGES: within 8 m of the brick on the sward the daisies and the seeding
  // grass stand thicker (a flowering meadow, never a lawn). WHERE THE SCARLET THINS OUT (cover under a half) single
  // poppies stand, a few blooms to a card of 0.35 m: the field ends in single blooms. Green cards stand only where
  // the ground is green (their chance falls by the cover field's own total), never on the brick or its fan, the
  // brook, the lane's dressed banks or the apron. Their chunks (NEAR_CH metres of road; the inner band and each
  // outer hand apart) are drawn only within NEAR_FAR (inner) or NEAR_OUT (outer) metres of the eye's place.
  const nq = {}, ng = streamOf(ctx, 'gate-near'), nearSet = [], NS = 0.5, NI = Math.round(NEAR_IN / STEP), NO = Math.round((NEAR_REACH - NEAR_IN) / (2 * STEP)), BROAD = 1.6, apronS = road.L - 30, SEEDING = [1.05, 0.78, 0.26, 0], BLADE = [0.4, 0.45, 0.2, 0], TN = [0, 0, 0, 1];   // (a lift of the grass law's green: a standing blade catches more light than the turf under it; seeding heads go to straw)
  const nearOf = (s, band) => { const k = Math.floor((s + 60) / NEAR_CH) * 3 + band; let C = nearSet[k]; if (!C) { C = nearSet[k] = { n: 0, cap: 2048, far: band ? NEAR_OUT : NEAR_FAR }; for (const [nm, w] of WIDE) C[nm] = new Float32Array(C.cap * w); } return C; };
  const card = (C, x, y, z, yaw, w, h, cell, uAt, uWide, vTop, phase, sw, T, hz) => {
    if (C.n === C.cap) { for (const [nm, w2] of WIDE) { const A = new Float32Array(C.cap * 2 * w2); A.set(C[nm]); C[nm] = A; } C.cap *= 2; }
    const i = C.n++, rx = Math.cos(yaw) * w / 2, rz = Math.sin(yaw) * w / 2, P = C.pos, o = i * 12, Q = C.uv, q = i * 8, S = C.sway, Tn = C.tint, t = i * 16;
    const u0 = (cell & 1) * 0.5 + 0.006 + 0.488 * uAt, u1 = u0 + 0.488 * uWide, v0 = (cell >> 1) * 0.5 + 0.004, v1 = v0 + vTop;
    P[o] = x - rx; P[o + 1] = y; P[o + 2] = z - rz; P[o + 3] = x + rx; P[o + 4] = y; P[o + 5] = z + rz; P[o + 6] = x + rx; P[o + 7] = y + h; P[o + 8] = z + rz; P[o + 9] = x - rx; P[o + 10] = y + h; P[o + 11] = z - rz;
    Q[q] = u0; Q[q + 1] = v0; Q[q + 2] = u1; Q[q + 3] = v0; Q[q + 4] = u1; Q[q + 5] = v1; Q[q + 6] = u0; Q[q + 7] = v1;
    S[o + 1] = phase; S[o + 4] = phase; S[o + 6] = sw; S[o + 7] = phase; S[o + 8] = hz; S[o + 9] = sw; S[o + 10] = phase; S[o + 11] = hz;
    for (let c = 0; c < 16; c += 4) { Tn[t + c] = T[0]; Tn[t + c + 1] = T[1]; Tn[t + c + 2] = T[2]; Tn[t + c + 3] = T[3]; }
  };
  let nearCards = 0, nearTris = 0;
  for (let s = -8, row = 0; s < apronS - 2; s += NS, row++) {
    road.at(s, at);
    let yards = false; for (const h of env.things.homes) if (Math.hypot(at.x - h.x, at.z - h.z) < h.r + NEAR_REACH + 16) { yards = true; break; }   // (a farmyard within this row's reach: only then is each card asked)
    const nj = 2 * (NI + (row & 1 ? 0 : NO));        // (FEWER, LARGER CARDS FAR FROM THE CENTRE LINE: beyond NEAR_IN the candidates stand twice as far apart each way, on every other row, and their grass and crop cards are BROAD times as broad)
    for (let j = 0; j < nj; j++) {
      const js = ng(), jd = ng(), keep = ng(), yaw = ng() * TAU, sz = ng(), cell = Math.floor(ng() * 4), phase = ng(), kindDie = ng(), colDie = ng(), cell2 = Math.floor(ng() * 4);
      const hj = j >> 1, inner = hj < NI, a = inner ? NEAR_IN * (hj + jd) / NI : NEAR_IN + (NEAR_REACH - NEAR_IN) * (hj - NI + jd) / NO, q = inner ? 1 : Math.pow(1 - sstep(NEAR_IN, NEAR_REACH, a), 1.5);
      if (keep >= q) continue;
      const sc = s + (js - 0.5) * (inner ? NS : 2 * NS), d = j & 1 ? a : -a, wk = inner ? 1 : BROAD;
      road.at(sc, at); let x = at.x - at.tz * d, z = at.z + at.tx * d;
      if (Math.abs(d) > 12) road.near(x, z, sc, nq); else { nq.s = sc; nq.d = d; }        // (beyond 12 m the road's bends may bring another reach of it nearer: the true nearest metre is read there)
      if (yards && inYard(x, z)) continue;
      const ad = Math.abs(nq.d), fan = 2.5 + 18 * sat((nq.s - (road.L - 62)) / 32);       // (the brick's half width: 2.5 m, opening over the fan's 32 m to the apron's)
      if (ad < fan + 0.4 || nq.s > apronS - 2 || (Math.abs(nq.s - land.places.bridge) < 13 && ad < 31) || land.laneAt(nq.s, nq.d) > 0.5) continue;
      const C = nearOf(sc, inner ? 0 : (j & 1) ? 1 : 2);
      if (z < land.zS(x) - 30 && ad > 3.4) {             // a plot of the farmland (the crops' own bound of the field's edge; the plots come to the road's shoulder, 3.3 m, as the paint has them): the plot's crop on its row line
        const qx = x * pcs + z * psn, qy = -x * psn + z * pcs, rx = Math.round(qx / ROW) * ROW; x = rx * pcs - qy * psn; z = rx * psn + qy * pcs;
        const hh = 0.9 + 0.2 * sz;
        card(C, x, land.ground(x, z, sc) - 0.03, z, turn + Math.PI / 2 + (colDie - 0.5) * 0.7, 1.15 * wk, hh, cell, 0, 1, 0.18, phase, 0.8, CROP, hh);
        nearCards++; nearTris += 2; continue;
      }
      land.cover(x, z, cv, nq.s, nq.d);
      const thinK = sstep(0.01, 0.10, cv.c) * (1 - sstep(0.30, 0.55, cv.c)) * (1 - cv.drift), single = colDie < 0.5 * thinK;
      if (!single && keep >= q * (1 - 0.92 * cv.total)) continue;          // (the ground's height is read only for a card that stands)
      const y = land.cut(nq.s, nq.d, land.h0(x, z)) - 0.03;
      if (single) { card(C, x, y, z, yaw, 0.35, 0.5 + 0.2 * sz, cell, 0.5 * js, 0.5, 0.49, phase, 0.8, NONE, 0); nearCards++; nearTris += 2; continue; }
      const sward = sstep(-130, -85, z), last = sward * (1 - sstep(fan + 8, fan + 14, ad));          // (the sward: from where the cover law gives way, z -130, to its full turf; its verges: within 8 m of the brick on the sward)
      const drift = sstep(0.50, 0.66, tone.at(x / 64 + 0.21, z / 64 + 0.63, 1)), dry = sstep(0.52, 0.8, 0.6 * tone.at(x / 48, z / 48, 3) + 0.4 * tone.at(x / 960 + 0.11, z / 960 + 0.11, 3));
      const flower = 0.14 + 0.24 * drift + 0.12 * sward + 0.20 * last;
      if (kindDie < flower) {
        const sel = tone.at(x / 150 + 0.77, z / 150 + 0.31, 2), kind = cv.drift > 0.3 ? cv.kind : drift > 0.5 && colDie < 0.8 ? (sel < 0.42 ? 0 : sel < 0.6 ? 2 : 3) : 1;
        const wc = WILD[kind], k = 0.85 + 0.3 * sz, w = 0.5 * (0.8 + 0.4 * sz), h = 0.5 + 0.2 * sz; TN[0] = wc[0] * k; TN[1] = wc[1] * k; TN[2] = wc[2] * k;
        card(C, x, y, z, yaw, w, h, cell, 0, 1, 0.49, phase, 0.7, TN, 0); card(C, x, y, z, yaw + 1.45, w, h, cell2, 0, 1, 0.49, phase, 0.7, TN, 0); nearTris += 4;
      } else if (kindDie < flower + 0.08 + 0.36 * dry + 0.30 * last) { card(C, x, y, z, yaw, 0.6 * wk * (0.8 + 0.5 * sz), 0.6 + 0.2 * sz, cell, 0, 1, 0.25, phase, 0.9, SEEDING, 0); nearTris += 2; }
      else { card(C, x, y, z, yaw, 0.85 * wk * (0.8 + 0.5 * sz), 0.4 + 0.3 * sz, cell, 0, 1, 0.165, phase, 0.5, BLADE, 0); nearTris += 2; }
      nearCards++;
    }
    if (row % 4 === 3) await ctx.yield();
  }
  const meshes = [];
  for (const C of chunks.concat(dress, nearSet)) {
    if (!C || !C.n) continue;
    for (const [nm, w] of WIDE) C[nm] = C[nm].slice(0, C.n * w);
    const n = C.pos.length / 12, g = new THREE.BufferGeometry(), idx = new Uint32Array(n * 6), nor = new Float32Array(n * 12);
    for (let i = 0; i < n; i++) { const o = i * 6, b = i * 4; idx[o] = b; idx[o + 1] = b + 1; idx[o + 2] = b + 2; idx[o + 3] = b; idx[o + 4] = b + 2; idx[o + 5] = b + 3; nor[b * 3 + 1] = 1; nor[b * 3 + 4] = 1; nor[b * 3 + 7] = 1; nor[b * 3 + 10] = 1; }
    const arr = (A, w) => new THREE.BufferAttribute(A, w);
    g.setAttribute('position', arr(C.pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    g.setAttribute('aSway', arr(C.sway, 3)); g.setAttribute('aTint', arr(C.tint, 4)); g.setAttribute('aCuv', arr(C.uv, 2));
    g.setIndex(new THREE.BufferAttribute(idx, 1)); g.computeBoundingSphere(); g.boundingSphere.radius += 1;
    const far = C.far || CARD_FAR, mesh = new THREE.Mesh(g, matOf(far)); mesh.receiveShadow = true; mesh.userData.far = far; group.add(mesh); meshes.push(mesh);
    await ctx.yield();
  }
  return { object: group, meshes, material: matOf(CARD_FAR), count, nearCount, tufts, ferns, crops, dressed, nearCards, nearTris, triangles: count * 4 + (tufts + ferns + crops) * 2 + dressed * 4 + nearTris };
}

// ---- THE THINGS THAT STAND (design section 7). A small maker of solids: every thing is drawn into one of a few
// merged meshes with a colour at each corner; round things have 48 sides. Paint: the tone field breaks each face
// (lime wash, stone, paint that has weathered), the cloud shadows cross it; light, shadow map and air are three's.
function makeSolids() {
  const pos = [], nor = [], col = [], idx = [];
  const S = {
    pos, nor, col, idx,
    quad(a, b, c, d, n, k, k2) {                      // corners counter-clockwise seen from the side the normal n points to; k2: the colour of c and d
      const base = pos.length / 3, e = k2 || k; pos.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2], d[0], d[1], d[2]);
      for (let q = 0; q < 4; q++) { nor.push(n[0], n[1], n[2]); const u = q < 2 ? k : e; col.push(u[0], u[1], u[2]); }
      idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
    },
    // a box on the ground at (cx, y0, cz), sx wide (its local x), sz deep, turned by yaw; top heights may differ along
    // local z (h at -z, h2 at +z: a lean-to); kTop: the top's colour; noBottom always
    box(cx, y0, cz, sx, h, sz, yaw, k, kTop, h2) {
      const c = Math.cos(yaw), s = Math.sin(yaw), hx = sx / 2, hz = sz / 2, hb = h2 === undefined ? h : h2;
      const P = (lx, y, lz) => [cx + lx * c + lz * s, y, cz - lx * s + lz * c], N = (lx, lz) => [lx * c + lz * s, 0, -lx * s + lz * c];
      const a0 = P(-hx, y0, -hz), b0 = P(hx, y0, -hz), c0 = P(hx, y0, hz), d0 = P(-hx, y0, hz), a1 = P(-hx, y0 + h, -hz), b1 = P(hx, y0 + h, -hz), c1 = P(hx, y0 + hb, hz), d1 = P(-hx, y0 + hb, hz);
      S.quad(b0, a0, a1, b1, N(0, -1), k); S.quad(d0, c0, c1, d1, N(0, 1), k); S.quad(a0, d0, d1, a1, N(-1, 0), k); S.quad(c0, b0, b1, c1, N(1, 0), k);
      const sl = Math.atan2(hb - h, sz), tn = [Math.sin(-sl) * s, Math.cos(sl), Math.sin(-sl) * c];
      S.quad(a1, d1, c1, b1, tn, kTop || k);
    },
    // a round wall or drum: radius r0 at y0, r1 at y1, sides round; k at the foot, k1 at the head; cap: a flat top
    drum(cx, cz, y0, y1, r0, r1, sides, k, k1, cap) {
      const sl = Math.atan2(r0 - r1, y1 - y0), cy = Math.cos(sl), sy = Math.sin(sl);
      for (let i = 0; i < sides; i++) {
        const a0 = i / sides * TAU, a1 = (i + 1) / sides * TAU, base = pos.length / 3;
        for (const [a, r, y, kk] of [[a0, r0, y0, k], [a1, r0, y0, k], [a1, r1, y1, k1 || k], [a0, r1, y1, k1 || k]]) { pos.push(cx + Math.sin(a) * r, y, cz + Math.cos(a) * r); nor.push(Math.sin(a) * cy, sy, Math.cos(a) * cy); col.push(kk[0], kk[1], kk[2]); }
        idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
        if (cap) { const b2 = pos.length / 3, kk = k1 || k; pos.push(cx, y1, cz, cx + Math.sin(a0) * r1, y1, cz + Math.cos(a0) * r1, cx + Math.sin(a1) * r1, y1, cz + Math.cos(a1) * r1); for (let q = 0; q < 3; q++) { nor.push(0, 1, 0); col.push(kk[0], kk[1], kk[2]); } idx.push(b2, b2 + 1, b2 + 2); }
      }
    },
    // a low dome: radius r at y0, rising h, round by its normals; k at the rim, k1 at the crown
    dome(cx, cz, y0, r, h, sides, rings, k, k1) {
      const base = pos.length / 3;
      for (let j = 0; j <= rings; j++) {
        const t = j / rings * Math.PI / 2, rr = r * Math.cos(t), y = y0 + h * Math.sin(t), f = j / rings;
        for (let i = 0; i <= sides; i++) {
          const a = i / sides * TAU, nx = Math.sin(a) * Math.cos(t) * h, ny = Math.sin(t) * r, nz = Math.cos(a) * Math.cos(t) * h, l = Math.hypot(nx, ny, nz) || 1;
          pos.push(cx + Math.sin(a) * rr, y, cz + Math.cos(a) * rr); nor.push(nx / l, ny / l, nz / l); col.push(mix(k[0], k1[0], f), mix(k[1], k1[1], f), mix(k[2], k1[2], f));
        }
      }
      for (let j = 0; j < rings; j++) for (let i = 0; i < sides; i++) { const a = base + j * (sides + 1) + i, b = a + sides + 1; idx.push(a, a + 1, b + 1); if (j < rings - 1) idx.push(a, b + 1, b); }
    },
    mesh(material, shadows = true) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx);
      const m = new THREE.Mesh(g, material); m.castShadow = shadows; m.receiveShadow = true; return m;
    },
  };
  return S;
}
const builtMaterial = (U) => gateMaterial(U, 'built', { vertexColors: true }, '', '', '',
  '\n diffuseColor.rgb *= (.74 + .52 * GT(vGW.xz / 9. + vGW.y / 7.).r) * (.86 + .28 * GT(vGW.xz / 1.7 + vGW.y * .9).g) * gateCloud(vGW.xz);\n');
const tint = (k, f, g = 0) => [k[0] * f + g, k[1] * f + g, k[2] * f + g];

const STONE = [0.36, 0.34, 0.30], STRAW = [0.60, 0.48, 0.21], DARK = [0.03, 0.032, 0.04];
// the blue is a weathered, greyed lime-wash blue (R8); the green of the houses and fences under the wall likewise
const BLUE = { wall: [0.56, 0.63, 0.70], roof: [0.23, 0.31, 0.42], fence: [0.37, 0.45, 0.54] }, GREEN = { wall: [0.47, 0.59, 0.46], roof: [0.14, 0.29, 0.17], fence: [0.19, 0.33, 0.21] };
// a vertical panel facing the bearing yaw, r from (cx, cz): a dark doorway or casement that reads at 300 m
const panel = (S, cx, cz, yaw, r, y0, y1, halfW, k, off = 0) => {
  const c = Math.cos(yaw), s = Math.sin(yaw), px = cx + s * r + c * off, pz = cz + c * r - s * off;
  S.quad([px - c * halfW, y0, pz + s * halfW], [px + c * halfW, y0, pz - s * halfW], [px + c * halfW, y1, pz - s * halfW], [px - c * halfW, y1, pz + s * halfW], [s, 0, c], k);
};
// ONE ROUND FARMHOUSE (Baum: round, with a dome for a roof; drawn from real round farm buildings): a stone footing,
// a thick lime-washed wall a little battered, a low dome of 48 sides with a broad eave, a deep doorway, small
// shuttered casements, a stone chimney with its cap, a lean-to shed, a walled yard, ricks. o deals each its own
// measures, so no two are alike. face: the bearing its doorway looks to.
function house(S, land, x, z, face, o, rng, rk = rng) {
  const y = land.ground(x, z) - 0.25, R = o.R, wh = o.wall, kw = o.pal.wall, kr = o.pal.roof, top = y + wh + 0.16;
  S.drum(x, z, y, y + 0.6, R * 1.07, R * 1.04, 48, tint(STONE, 0.75), tint(STONE, 1.0));
  S.drum(x, z, y + 0.6, y + wh, R * 1.025, R, 48, tint(kw, 0.86), tint(kw, 1.04));
  S.drum(x, z, y + wh - 0.04, top, R + 0.55, R + 0.46, 48, tint(kr, 0.5), tint(kr, 0.72));
  S.dome(x, z, top, R + 0.46, o.domeH, 48, 7, tint(kr, 0.8), tint(kr, 1.15));
  // the doorway: a deep frame standing a little proud, the opening dark
  S.box(x + Math.sin(face) * (R - 0.02), y, z + Math.cos(face) * (R - 0.02), 1.6, 2.3, 0.56, face, tint(kw, 0.9), tint(STONE, 1.05));
  panel(S, x, z, face, R + 0.32, y + 0.3, y + 2.1, 0.52, DARK);
  for (let w = 0; w < o.wins.length; w++) {              // small casements with a shutter either side
    const a = face + o.wins[w], bx = x + Math.sin(a) * (R - 0.1), bz = z + Math.cos(a) * (R - 0.1);
    S.box(bx, y + 1.3, bz, 0.95, 1.0, 0.5, a, tint(kw, 0.92), tint(STONE, 1.0));
    panel(S, x, z, a, R + 0.21, y + 1.45, y + 2.15, 0.3, DARK);
    panel(S, x, z, a, R + 0.22, y + 1.42, y + 2.18, 0.14, tint(kr, 0.9), 0.46); panel(S, x, z, a, R + 0.22, y + 1.42, y + 2.18, 0.14, tint(kr, 0.8), -0.46);
  }
  const ca = face + o.chim, cx = x + Math.sin(ca) * R * 0.86, cz = z + Math.cos(ca) * R * 0.86, ch = wh + o.domeH + 1.1;
  S.box(cx, y + 0.4, cz, 0.85, ch - 0.4, 0.85, ca, tint(STONE, 0.9), tint(STONE, 0.6)); S.box(cx, y + ch, cz, 1.1, 0.2, 1.1, ca, tint(STONE, 1.1), tint(STONE, 0.35));
  const sa = face + o.shed, sx = x + Math.sin(sa) * (R + 1.15), sz = z + Math.cos(sa) * (R + 1.15);          // the lean-to
  S.box(sx, y, sz, o.shedW, 2.35, 2.7, sa, tint(kw, 0.8), tint(kr, 0.62), 1.55);
  panel(S, x, z, sa, R + 2.56, y + 0.2, y + 1.4, 0.45, DARK, o.shedW * 0.18);
  const n = 13, a0 = face + 0.62, a1 = face + TAU - 0.62, yr = R + o.yard;                                    // the walled yard, open before the door
  for (let k = 0; k < n; k++) {
    const am = mix(a0, a1, (k + 0.5) / n), wx = x + Math.sin(am) * yr, wz = z + Math.cos(am) * yr, len = (a1 - a0) / n * yr + 0.25, gy = land.ground(wx, wz);
    S.box(wx, gy - 0.2, wz, len, 1.1 + 0.12 * rng(), 0.5, am, tint(STONE, 0.78 + 0.3 * rng()), tint(STONE, 1.15));
  }
  for (let k = 0; k < (o.bare ? 0 : o.ricks); k++) {                                                                        // ricks of hay
    // (F-8: a rick stands OUTSIDE the yard's wall, clear of it by 0.4 m, the ricks side by side along it)
    const r0 = 1.5 + 0.5 * rk(), rr = yr + 0.25 + 1.08 * r0 + 0.4, ra = face + Math.PI - Math.sign(o.shed) * (0.9 + k * (2.16 * r0 + 0.7) / rr),   // (behind the house, on the hand away from the shed: never toward the road)
       rx = x + Math.sin(ra) * rr, rz = z + Math.cos(ra) * rr, gy = land.ground(rx, rz) - 0.1;                          // (J3: no rick stands on the sward before the wall: a pale mound there reads as a boulder)
    S.drum(rx, rz, gy, gy + 1.3, r0, r0 * 1.08, 48, tint(STRAW, 0.8), tint(STRAW, 1.0)); S.dome(rx, rz, gy + 1.3, r0 * 1.08, r0 * 0.95, 48, 5, tint(STRAW, 0.95), tint(STRAW, 1.2));
  }
  return yr + (o.bare ? 1 : 5.5);                 // (the farmstead's reach: its yard, and its ricks outside the wall)
}

// THE FARMSTEADS OF THE FARMLAND, DEALT (stream 'gate-steads'; prepareField deals them, so the world file is handed
// the first by the road): a seeded walk over the WHOLE farmland, from the entry to the wall's crossing as dealt,
// STEADS.per to 100 m and none nearer the last than STEADS.gap (two yards' breadth: a yard is some 20 m across). Each
// on a dealt hand; a share STEADS.byRoad of them BY THE ROAD (a yard's breadth behind the fence: 17 to 21 m off the
// centre line), the rest 34 to 88 m back. One that falls on the brook's banks (BANKS either way of the bridge), past
// the cover law's boundary off the road, or where a bend brings another reach of the road within its own reach, the
// flown line's greatest offset and CLEAR_BY (by the road: into its yard, 14 m), or whose reach would lie behind the
// entry (nothing stands behind it) is DROPPED.
const STEADS = { per: 2, gap: 40, byRoad: 1 / 3, reach: 17.6 };   // (reach: the greatest a farmstead back from the road takes up: its yard, 12.1 m, and its ricks outside the wall, 5.5 m)
export function dealSteads(ctx, road, land) {
  const rng = streamOf(ctx, 'gate-steads'), PL = land.places, out = [], at = {}, nr = {};
  for (const s of walk(rng, 0, PL.edge, STEADS.per, STEADS.gap)) {
    const side = rng() < 0.5 ? 1 : -1, close = rng() < STEADS.byRoad, set = rng(), d = side * (close ? mix(17, 21, set) : mix(34, 88, set));
    road.at(s, at); const x = at.x - at.tz * d, z = at.z + at.tx * d; road.near(x, z, undefined, nr);
    if (nr.s < STEADS.reach || Math.abs(s - PL.bridge) < BANKS || z > land.zS(x) - WALL_BEFORE || nr.dist <= (close ? 14 : STEADS.reach + FLOWN_MOST + CLEAR_BY)) continue;
    if (out.some((h) => Math.hypot(h.x - x, h.z - z) < 2 * STEADS.reach)) continue;      // (R-b: none within two reaches of one already kept, as the crow flies: where the road bends back, two walks' metres apart may lie yard on yard)
    out.push({ x, z, close, s: nr.s, dist: nr.dist });
  }
  const first = out.filter((h) => h.close)[0]; PL.farm = first ? first.s : null;
  return out;
}

// WHAT STANDS WHERE (stream 'gate-farm'; the looks deal which farmhouse and tree stands where inside these places).
// A FARMLAND: post-and-rail fences each side, 4.6 to 6.2 m from the centre line, a weathered lime-wash blue; round
// blue farmhouses dealt by a seeded walk over the whole farmland (dealSteads), a third of them by the road, the rest
// 34 to 88 m back; the humped bridge of grey
// stone over the brook. B FIELD EDGE (where the road meets the field's boundary, by place): the fences end in two
// plain stone posts and a dry-stone wall runs off both ways along the boundary. C DEEP FIELD: nothing built stands
// (no culvert). D UNDER THE WALL: no fence; two green farmhouses on the sward, one either hand, each clear of
// the ground between the road and its chord to the gate (R9: nothing there stands over 2 m).
// CLEAR AIR: nothing stands within 4.6 m of the centre line but the bridge's two low kerbs of stone (3.06 m off the
// centre line, their coping 0.4 m over the brick, with their end stones); nothing stands on the road. BEHIND THE ENTRY
// nothing stands but the fences beyond 62 m and the ground's own dress.
export async function buildThings(ctx, env) {
  const { road, land, U } = env, rng = streamOf(ctx, 'gate-farm'), mat = builtMaterial(U), group = new THREE.Group(), L = road.L;
  const SA = makeSolids(), SD = makeSolids(), at = {}, nr = {}, taken = [], trees = [];
  const place = (s, d) => { road.at(s, at); const x = at.x - at.tz * d, z = at.z + at.tx * d; return { x, z, y: land.ground(x, z, s), yaw: Math.atan2(at.tx, at.tz) }; };
  const PL = land.places, edgeS = PL.edge;         // (the wall's crossing as the land deals it)
  // (F-1: each family draws from its own name stream, so none leans on another's dice: the fences, the stones of the
  // wall and the bridge, the ricks; 'gate-farm' deals the farmsteads alone. No die is drawn and thrown away.)
  const fr = streamOf(ctx, 'gate-fence'), wr = streamOf(ctx, 'gate-stone'), rk = streamOf(ctx, 'gate-rick');
  const fence = (S, s0, s1, side, pal) => {   // (the fences' lines and where none stands are the land's: land.fenceD, land.fenced)
    let prev = null;
    for (let s = s0; s <= s1; s += 2.6) {
      const k = tint(pal.fence, 0.8 + 0.35 * fr());
      if (!land.fenced(s)) { prev = null; continue; }
      const P = place(s, side * land.fenceD(s, side));
      S.box(P.x, P.y - 0.2, P.z, 0.13, 1.5, 0.13, P.yaw, k, tint(k, 1.3));
      if (prev) for (const h of [0.42, 0.78, 1.12]) {
        const dx = P.x - prev.x, dz = P.z - prev.z, l = Math.hypot(dx, dz) || 1, nx = -dz / l * 0.025, nz = dx / l * 0.025, a = [prev.x, prev.y + h, prev.z], b = [P.x, P.y + h, P.z];
        const q = (o, sgn, top) => [o[0] + nx * sgn, o[1] + (top ? 0.1 : 0), o[2] + nz * sgn];
        S.quad(q(a, 1, 0), q(b, 1, 0), q(b, 1, 1), q(a, 1, 1), [nx * 40, 0, nz * 40], k); S.quad(q(b, -1, 0), q(a, -1, 0), q(a, -1, 1), q(b, -1, 1), [-nx * 40, 0, -nz * 40], k);
        S.quad(q(a, 1, 1), q(b, 1, 1), q(b, -1, 1), q(a, -1, 1), [0, 1, 0], tint(k, 1.25));
      }
      prev = P;
    }
  };
  fence(SA, -150, edgeS - 2, 1, BLUE); fence(SA, -150, edgeS - 2, -1, BLUE);
  // (J3, F-5: no fence stands on the sward: its thin rails are taken out, and with them the typed place they began at)
  //   // (G5: the rails stop well short of the road's fan and the apron)
  await ctx.yield();
  // the two stone posts and the dry-stone wall along the field's boundary
  const wallLine = [];
  for (const side of [1, -1]) {
    const P = place(edgeS, side * (land.fenceD(edgeS, side) + 0.1)), off = P.z - land.zS(P.x), dirX = -Math.sign(at.tz * side) || 1;
    // THE GAP'S TWO PIERS (streams 'gate-pier' and the side): coursed rough stone like the wall's own, never a plain
    // box: six courses of two stones each, every course laid crosswise to the one below, every stone its own tone,
    // breadth and turn (so each bed and each upright joint casts its line and no face is flat), from 0.2 m under
    // the ground to the cap's foot; over them a weathered cap stone broader than the pier, its top worn to a slope
    // and gone green. The cap's head stands PIER over the ground, the height the eye's law reads.
    const pw = streamOf(ctx, 'gate-pier' + side), pc = Math.cos(P.yaw), ps = Math.sin(P.yaw), COURSES = 6, CAP = 0.24, RISE = (PIER - CAP + 0.2) / COURSES;
    for (let c = 0; c < COURSES; c++) for (let q = -1; q <= 1; q += 2) {
      const t = 0.54 + 0.38 * pw(), o = q * (0.17 + 0.03 * pw()), j = (pw() - 0.5) * 0.05, lx = c & 1 ? o : j, lz = c & 1 ? j : o, thin = 0.33 + 0.07 * pw(), long = 0.66 + 0.1 * pw();
      SA.box(P.x + lx * pc + lz * ps, P.y - 0.2 + c * RISE, P.z - lx * ps + lz * pc, c & 1 ? thin : long, RISE, c & 1 ? long : thin, P.yaw + (pw() - 0.5) * 0.14, tint(STONE, t), tint(STONE, t * 0.5));
    }
    const ct = 0.8 + 0.2 * pw();
    SA.box(P.x, P.y + PIER - CAP, P.z, 0.92, CAP, 0.92, P.yaw + (pw() - 0.5) * 0.1, tint(STONE, ct), [0.36 * ct * 0.8, 0.34 * ct * 0.95, 0.30 * ct * 0.62], CAP - 0.07);
    let px = P.x, pz = P.z;
    for (let k = 1; k <= 74; k++) {
      const x = P.x + dirX * k * 3.4, z = land.zS(x) + off, mx = (x + px) / 2, mz = (z + pz) / 2, len = Math.hypot(x - px, z - pz), yaw = Math.atan2(x - px, z - pz) + Math.PI / 2;
      const c = 0.72 + 0.4 * wr(), h = 1.0 + 0.2 * wr(); road.near(mx, mz, undefined, nr);
      if (nr.dist > 5) SA.box(mx, land.ground(mx, mz) - 0.25, mz, len + 0.15, h + 0.25, 0.6, yaw, tint(STONE, c * 0.7), [0.36 * c * 0.62, 0.34 * c * 0.74, 0.30 * c * 0.5]);   // (weathered stone under a mossy cope, never a pale block)
      wallLine.push([mx, mz, nr.dist]); px = x; pz = z;
    }
  }
  await ctx.yield();
  // the bridge: parapets of grey stone with copings following the hump, a pier at each end, the arch's dark mouth
  const y0 = land.waterY - 0.5;
  for (const side of [1, -1]) {
    for (let s = PL.bridge - PARAPET; s <= PL.bridge + PARAPET + 0.01; s += 0.625) {      // (short stones, so the coping follows the hump)
      const P = place(s, side * 3.06), top = land.roadY(s) + 0.4, c = 0.62 + 0.14 * wr(), pier = Math.abs(Math.abs(s - PL.bridge) - PARAPET) < 0.1;   // (P4: a low weathered stone kerb with an end stone, never two pale walls passing close under the eye)
      SA.box(P.x, y0, P.z, pier ? 0.8 : 0.6, top - y0 + (pier ? 0.25 : 0), pier ? 0.8 : 0.66, P.yaw, tint(STONE, c), [0.36 * c * 0.8, 0.34 * c * 0.92, 0.30 * c * 0.66]);
    }
    for (const [w, h] of [[1.5, 0.75], [1.1, 1.15], [0.6, 1.4]]) { road.at(land.places.bridge, at); const yaw = Math.atan2(-at.tz * side, at.tx * side); panel(SA, at.x, at.z, yaw, 3.42, y0, land.waterY + h, w, DARK); }
  }
  await ctx.yield();
  // G2, THE HOLLOWAY'S EDGING (stream 'gate-edging'; dice before test): a low mossy stone edging at the banks' foot,
  // in runs (by a slow wave along the lane, each hand its own), 3.05 to 3.3 m off the centre line and 0.16 to 0.34 m
  // high: under the eye by 4 m, never on the brick.
  {
    const er = streamOf(ctx, 'gate-edging'), MOSS = [0.15, 0.21, 0.07], ph = [er() * TAU, er() * TAU];
    for (let s = land.lane[0] + 4; s < land.lane[1] - 4; s += 0.82) for (const side of [1, -1]) {
      const js = er(), len = 0.5 + 0.4 * er(), hh = 0.16 + 0.18 * er(), off = 3.05 + 0.25 * er(), c = 0.5 + 0.3 * er(), mossy = 0.45 + 0.55 * er(), turn = (er() - 0.5) * 0.4;
      if (Math.sin(s / 9.5 + ph[side > 0 ? 0 : 1]) + 0.5 * Math.sin(s / 3.7 + ph[side > 0 ? 1 : 0]) < 0.42) continue;
      const P = place(s + (js - 0.5) * 0.2, side * off), k = tint(STONE, c), top = [mix(k[0], MOSS[0], 0.75 * mossy), mix(k[1], MOSS[1], 0.75 * mossy), mix(k[2], MOSS[2], 0.75 * mossy)];
      SA.box(P.x, P.y - 0.15, P.z, 0.32, hh + 0.15, len, P.yaw + turn, [mix(k[0], MOSS[0], 0.3 * mossy), mix(k[1], MOSS[1], 0.3 * mossy), mix(k[2], MOSS[2], 0.3 * mossy)], top);
    }
    await ctx.yield();
  }
  // the farmhouses: each stands at a place dealt before (the farmland's by dealSteads; the sward's two below); its
  // measures are dealt here, every die drawn before any test
  const slot = (S, P, pal, bare, close) => {
    const o = { R: rng.range(3.1, 4.6), wall: rng.range(2.7, 3.4), domeH: 0, pal: { wall: tint(pal.wall, rng.range(0.9, 1.08)), roof: tint(pal.roof, rng.range(0.85, 1.2)), fence: pal.fence },
      wins: rng() < 0.5 ? [0.95, -0.95, 2.2] : [0.8, -1.25], chim: Math.PI + rng.range(-0.8, 0.8), shed: (rng() < 0.5 ? 1 : -1) * rng.range(1.5, 2.1), shedW: rng.range(2.8, 3.8), yard: rng.range(4.5, 7.5), ricks: 1 + Math.floor(rng() * 2.5) };
    if (close) { o.R = 4.2 + 0.4 * (o.R - 3.1) / 1.5; o.wall = 3.2 + 0.2 * (o.wall - 2.7) / 0.7; o.yard = 3.4 + 0.25 * (o.yard - 4.5); }   // (a farmstead by the road: the largest measure, a closer yard)
    o.domeH = o.R * rng.range(0.5, 0.68); o.bare = !!bare; const turn = rng.range(-0.5, 0.5);
    road.near(P.x, P.z, undefined, nr); road.at(nr.s, at);
    const face = Math.atan2(at.x - P.x, at.z - P.z) + turn, r = house(S, land, P.x, P.z, face, o, rng, rk);     // its door looks toward the road, turned a little
    const ca = face + o.chim, chim = [P.x + Math.sin(ca) * o.R * 0.86, land.ground(P.x, P.z) - 0.25 + o.wall + o.domeH + 1.3, P.z + Math.cos(ca) * o.R * 0.86];   // (the chimney's top, for its smoke)
    taken.push([P.x, P.z, r + 2]); return { x: P.x, z: P.z, r, s: nr.s, side: nr.d > 0 ? 1 : -1, dist: nr.dist, chim, green: !!bare };
  };
  const homes = [];
  for (const st of env.steads) { homes.push(slot(SA, st, BLUE, false, st.close)); await ctx.yield(); }
  // THE SWARD'S TWO FARMHOUSES BY A RULE: one either hand, within the sward's band (15 to 60 m inside the cover
  // law's own inner edge, land.zN), 40 to 70 m back from the road; on the hand where the road comes in round its
  // bend the set-back is counted from the chord between the road at the lane's last metre as dealt (where the wall
  // first stands in sight) and the gate, so nothing of it stands between the road and that chord. No rick stands by them.
  const C0 = road.at(PL.lane1, {}), chordX = (z) => Math.min(0, C0.x * (z - RING.z) / (C0.z - RING.z));
  for (const side of [1, -1]) { const z = land.zN() + rng.range(15, 60), back = rng.range(40, 70), x = side > 0 ? back : chordX(z) - back; homes.push(slot(SD, { x, z }, GREEN, true, false)); await ctx.yield(); }
  const mA = SA.mesh(mat), mD = SD.mesh(mat); group.add(mA, mD);
  return { object: group, material: mat, homes, taken, trees, edgeS, chordX, wallLine, place, triangles: (SA.idx.length + SD.idx.length) / 3 };
}

// THE TREES (the kit's oaks, four shapes, one wind; stream 'gate-trees'; every candidate's dice are drawn before any
// test). A: an avenue of great roadside trees from the first farmstead's track to the bridge's approach (crowns 13 to
// 16 m broad: their shadows fall across the brick), great trees along the farmland's road, orchards in rows
// by the farmhouses, lines of trees between far plots, bushes where the brook leaves the road. B: the one great tree
// at the field's edge; a hedge and a line of trees along the dry-stone wall (R7). THE SUNK LANE (R3): thorn trees
// and field maples along both rims and on round the mouth, so that with the banks they close the lane's sight of the
// city. C: thorn trees alone in the deep field (a seeded walk over its whole road), on the road's outer hand. D: three great trees and the green
// orchards on the sward, clear of the ground between the road and its chord to the gate (R9).
// CLEAR AIR and R11: every trunk stands its crown's radius and 4.8 m or more from the centre line; behind the entry
// no tree stands within 60 m of the road.
const GREAT = { per: 2.4, gap: 34 }, THORN = { per: 1.4, gap: 55 }, HEDGE = { per: 100 / 4.6, gap: 3.6 };
export const CROWN_REACH = 1.15, CROWN_CLEAR = 3;     // (J4: a crown reaches 1.15 of its radius with its outer sprigs; 3 m of clear air beyond that, from the flown line)
export function placeTrees(ctx, env, things, rng, variants) {
  const { road, land } = env, L = road.L, pts = [], far = [], nr = {}, at = {};
  let fam = '';                                     // (the family now being dealt: each tree carries its family's name and its road metre)
  const add = (x, z, v, radius, clearRoad, list = pts) => {
    road.near(x, z, undefined, nr);
    if (nr.dist - radius < clearRoad || (nr.s < CROWN_REACH * radius && nr.dist < 60)) return false;   // (R-d: no trunk where its metre along the road less its crown's reach is behind the first metre: no crown hangs back into the entry)
    // J4, NO CROWN OVER THE FLOWN LINE (on every seed): a crown's reach is its radius and the scatter's own stretch
    // (CROWN_REACH of the radius); no trunk stands nearer the flown line than that reach plus CROWN_CLEAR metres. A
    // tree dealt nearer is MOVED straight back from the line to that distance (never dropped for it), so no loose
    // leaf hangs into the eye's way with its tree out of sight.
    const need = CROWN_REACH * radius + CROWN_CLEAR, off0 = nr.d - land.flown(nr.s);
    if (Math.abs(off0) < need) {
      road.at(nr.s, at); const sh = (need + 0.1 - Math.abs(off0)) * (off0 < 0 ? -1 : 1); x -= at.tz * sh; z += at.tx * sh; road.near(x, z, undefined, nr);
      if (Math.abs(nr.d - land.flown(nr.s)) < need - 0.5 || nr.dist - radius < clearRoad) return false;      // (a bend's inner hand, where no such place is: the tree is not grown)
    }
    for (const t of things.taken) if (Math.hypot(x - t[0], z - t[1]) < t[2] + radius * 0.6) return false;
    list.push({ x, z, y: land.ground(x, z), s: radius / variants[v].radius, rot: 0, v, d: nr.dist, u: sat(nr.s / L), r: radius, fam, m: nr.s, h: variants[v].height * radius / variants[v].radius });
    things.taken.push([x, z, radius * 0.5]); return true;
  };
  const by = (s, d) => { road.at(s, at); return [at.x - at.tz * d, at.z + at.tx * d]; };
  // F-1, F-3: the great trees and the thorns each draw from their own name stream and stand by a rule, never by a table of metres
  const gt = streamOf(ctx, 'gate-great-trees'), th = streamOf(ctx, 'gate-thorns');
  // THE AVENUE: pairs of great trees either hand of the road between two places as dealt: the first farmstead's track
  // (the first farmstead of the farmland, by the road or back from it: its track meets the road at its metre) and the
  // bridge's approach (a crown's breadth, AV_CROWN, short of the parapets' end); one pair to every AV_GAP metres (two
  // crowns' breadth: each crown stands clear of the next; BUDGET: a great tree is the heaviest thing by the road), evenly between. Where no farmstead stands before the bridge's approach there is no avenue.
  const PL = land.places, AV_CROWN = 16, AV_GAP = 32, av1 = PL.bridge - PARAPET - AV_CROWN, av0 = env.steads.length ? Math.min(env.steads[0].s, av1) : av1, avN = av1 > av0 ? Math.floor((av1 - av0) / AV_GAP) + 1 : 0;
  fam = 'avenue';
  for (let k = 0; k < avN; k++) for (const side of [1, -1]) { const s = avN > 1 ? av0 + k * (av1 - av0) / (avN - 1) : (av0 + av1) / 2, r = rng.range(6.6, 8.2), d = r + rng.range(5.0, 6.6), v = rng() < 0.5 ? 0 : 1, P = by(s, side * d); add(P[0], P[1], v, r, 4.8); }
  // THE GREAT TREES OF THE FARMLAND: a seeded walk over the whole farmland's road, from the entry to the wall's
  // crossing as dealt, GREAT.per to 100 m and none nearer the last than GREAT.gap (two crowns' breadth); hand, set-back
  // and size dealt. One that falls within a crown's breadth of the avenue or of the bridge is dropped.
  fam = 'great';
  for (const s of walk(gt, 0, PL.edge, GREAT.per, GREAT.gap)) {
    const side = gt() < 0.5 ? 1 : -1, d = gt.range(12.5, 17), r = gt.range(6, 8.2), v = gt() < 0.5 ? 0 : 1, P = by(s, side * d);
    if ((avN > 0 && s > av0 - AV_CROWN && s < av1 + AV_CROWN) || Math.abs(s - PL.bridge) < PARAPET + AV_CROWN) continue;
    add(P[0], P[1], v, r, 4.8);
  }
  // the great tree at the field's edge: one crown's breadth (16 m) past the wall's posts, on the outer hand, TWICE its
  // crown's reach and the clear 3 m from the flown line (the eye flies at its crown's own height there, over the rise)
  fam = 'edge';
  { const sT = PL.edge + AV_CROWN, P = by(sT, land.flown(sT) - (2 * CROWN_REACH * 9 + CROWN_CLEAR)); add(P[0], P[1], 0, 9, 4.8); }
  // T3, THE HEDGEROWS (stream 'gate-hedgerow'; every die before any test; BY PLACE: the plots' own long lines, 44 m
  // apart across the plots' bearing, where they pass 9 to 22 m from the road between the entry and the wall's
  // crossing as dealt, and never past the cover law's boundary off the road): thorn bushes as a seeded walk along
  // each line, HEDGE.per to 100 m (one to 4.6 m) and none nearer the last than HEDGE.gap (BUDGET: few and broad; every one is drawn with the far trees) and a hedgerow tree here and there. add() keeps the flown line's clear air.
  fam = 'hedgerow';
  { const hr = streamOf(ctx, 'gate-hedgerow'), hc = Math.cos(env.look.plotTurn), hs = Math.sin(env.look.plotTurn), hq = {};
    let bx0 = 1e9, bx1 = -1e9, bz0 = 1e9, bz1 = -1e9;
    for (let s = 0; s <= PL.edge; s += 10) { road.at(s, at); bx0 = Math.min(bx0, at.x - 42); bx1 = Math.max(bx1, at.x + 42); bz0 = Math.min(bz0, at.z - 42); bz1 = Math.max(bz1, at.z + 42); }
    for (let k = -24; k <= 24; k++) for (const t of walk(hr, -1000, 1000, HEDGE.per, HEDGE.gap)) {
      const qx = k * 44, x0 = hc * qx - hs * t, z0 = hs * qx + hc * t;
      if (x0 < bx0 || x0 > bx1 || z0 < bz0 || z0 > bz1) continue;                    // (far from the opening's road: no die is drawn there, by place alone)
      const jx = hr.range(-0.5, 0.5), jz = hr.range(-0.5, 0.5), rb = hr.range(2.2, 3.0), vb = hr() < 0.5 ? 2 : 3, treeDie = hr(), rt = hr.range(3.8, 5.4);
      const x = x0 + jx, z = z0 + jz;
      road.near(x, z, undefined, hq);
      if (hq.s < 4 || hq.s > PL.edge || z > land.zS(x) - WALL_BEFORE || hq.dist < 9 || hq.dist > 22 || Math.abs(hq.d - land.flown(hq.s)) < 8.5) continue;      // (no bush within 8.5 m of the flown line: none stands close under the eye)
      if (treeDie < 0.06) add(x, z, vb, rt, 8, far);
      else if (add(x, z, vb, rb, 6.5, far)) { const it = far[far.length - 1]; it.y -= 0.34 * it.h; }      // (a hedge bush: its stem stands in the ground, the crown sits on the bank)
    } }
  // the hedge and the line of trees along the dry-stone wall, on the farmland's side of it
  fam = 'wall';
  things.wallLine.forEach((w, k) => {
    const jx = rng.range(-0.8, 0.8), jz = rng.range(-0.6, 0.6), rb = rng.range(1.5, 2.2), rt = rng.range(3.6, 5.2), vb = rng() < 0.5 ? 2 : 3, vt = rng() < 0.5 ? 2 : 3;
    if (w[2] > 9 && w[2] < 90 && k % 4 === 0) add(w[0] + jx, w[1] - 2.0 + jz, 2, rb, 6.5, far);
    if (w[2] > 16 && w[2] < 200 && k % 6 === 2) add(w[0] + jx, w[1] - 5.2 + jz, 2, rt, 8, far);
  });
  // the sunk lane: thorn trees and field maples on both rims; round its mouth and on past it great trees either hand
  // of the road and a clump on the outer hand of the bend, in the line of the lane's own axis
  const [l0, l1] = land.lane; fam = 'lane';
  for (let s = l0 + 5, k = 0; s <= l1 - 9; s += 8.6, k++) for (const side of [1, -1]) {
    const js = rng.range(-2.4, 2.4), out = rng.range(1.5, 5.5), maple = rng() < 0.66, r = maple ? rng.range(4.4, 5.6) : rng.range(2.5, 3.5), v = maple ? ((k + (side > 0 ? 1 : 0)) % 2 ? 3 : 1) : 2;
    road.at(s + js, at); const depth = Math.max(0, land.h0(at.x - at.tz * side * 21, at.z + at.tx * side * 21) - land.roadY(s + js)), rim = SHOULDER + depth / SLOPE;
    // G2, THE HOLLOWAY: where the bank stands 3 m and more over the brick 10 m off the centre line an OLD OAK grows ON
    // the bank there in the rim tree's place (the same dice), the two hands half a step apart, its crown 21 to 24 m
    // broad, so that the two banks' crowns lean toward each other over the lane and their shade and sun patches lie on the
    // brick; they do NOT meet over the flown line. CLEAR AIR (R-g, from the code below): a trunk stands SHOULDER + 4.6 / SLOPE
    // (9.9 m) off the centre line at the least, and never nearer the flown line than its crown's reach (CROWN_REACH of its
    // radius) and CROWN_CLEAR; an oak is grown only where the bank stands 3 m over the brick and its crown's foot stands 3.4 m and more over the eye's greatest height within 12 m, counted from the oak's own lowest outer leaf (V.low)
    // shortened by the scatter's own stretch; an oak that would hang lower is not grown, and the rim tree stands.
    const so = s + js + (side > 0 ? 0 : 4.3), V = variants[[0, 2, 1, 2][(2 * k + (side > 0 ? 0 : 1)) % 4]], vo = variants.indexOf(V), R = 10.4 + 1.8 * (out - 1.5) / 4, sc = R / V.radius;
    const Q = by(so, side * Math.max(SHOULDER + 4.6 / SLOPE + 0.5 * js, CROWN_REACH * R + CROWN_CLEAR + Math.abs(land.flown(so)))), gy = land.ground(Q[0], Q[1], so),   // (J4: an old oak stands on the bank or its rim, its whole crown clear of the flown line by the same rule)
      eyeTop = Math.max(land.eyeY(so - 12), land.eyeY(so), land.eyeY(so + 12));
    if (gy - land.roadY(so) >= 3.0 && so < l1 - 6 && gy + 0.8 * sc * V.low >= eyeTop + 3.4) {
      road.near(Q[0], Q[1], undefined, nr);
      pts.push({ x: Q[0], z: Q[1], y: gy, s: sc, rot: 0, v: vo, d: nr.dist, u: sat(nr.s / L), r: R, h: V.height * sc, oak: 1 });
      things.taken.push([Q[0], Q[1], 2.4]); continue;
    }
    const P = by(s + js, side * Math.max(rim + out, r + 5.2 + out * 0.4)); add(P[0], P[1], v, r, 4.8, maple ? pts : far);
  }
  fam = 'mouth';
  for (let s = l1 - 4, k = 0; s <= l1 + MOUTH; s += 11.5, k++) for (const side of [1, -1]) {
    const js = rng.range(-2, 2), r = rng.range(6.9, 8.2), d = r + rng.range(5.0, 6.4), v = rng() < 0.5 ? 0 : 1, P = by(s + js, side * d); add(P[0], P[1], v, r, 4.8);
  }
  // THE COPSE ON THE KNOLL, a screen square to the lane's own axis: great trees along the crest, thorn trees before
  // them; and thorn bushes on the inner bank at the mouth. What the lane's slot lets out meets the knoll or the copse.
  {
    const AX = road.at(RIDGE.at - 24, {}), KA = road.at(RIDGE.at + 133, {}), cx = KA.x + KA.tz * 33, cz = KA.z - KA.tx * 33, px = -AX.tz, pz = AX.tx;
    for (let u = -20; u <= 36; u += 11) { const j = rng.range(-1, 1), x = cx + px * u + AX.tx * j, z = cz + pz * u + AX.tz * j; road.near(x, z, undefined, nr); const r = Math.min(rng.range(9.2, 9.8), nr.dist - 4.9); add(x, z, 0, r, 4.8); }
    for (let u = -14.5; u <= 32; u += 11) { const j = 12.5 + rng.range(-1, 1), x = cx + px * u + AX.tx * j, z = cz + pz * u + AX.tz * j; road.near(x, z, undefined, nr); const r = Math.min(rng.range(8.6, 9.4), nr.dist - 4.9); add(x, z, 1, r, 4.8, far); }
    for (let u = -22; u <= 38; u += 6.4) { const r = rng.range(5.3, 5.8), f = 10.4 + rng.range(0, 1.2); add(cx + px * u - AX.tx * f, cz + pz * u - AX.tz * f, 2, r, 4.8, far); }
    for (let s = RIDGE.at + 14; s <= RIDGE.at + 76; s += 5) { const r = rng.range(3.2, 3.6), P = by(s + rng.range(-0.8, 0.8), r + 6.0 + rng.range(0, 0.4)); add(P[0], P[1], 2, r, 4.8, far); }
  }
  // THE THORNS OF THE DEEP FIELD: alone, a seeded walk over the whole deep field's road, from the lane's last metre
  // to the sward's edge, both as dealt: THORN.per to 100 m, none nearer the last than THORN.gap; 20 to 32 m off the
  // brick on the outer hand (the inner hand is the city's: nothing stands between the road and the wall there, R9).
  // add() drops one that falls among the mouth's trees.
  fam = 'thorn';
  for (const s of walk(th, PL.lane1, PL.sward, THORN.per, THORN.gap)) { const d = th.range(20, 32), r = th.range(2.6, 3.4), v = th() < 0.5 ? 2 : 3, P = by(s, -d); add(P[0], P[1], v, r, 4.8); }
  // F-4, THE SWARD'S THREE TREES BY A RULE: each on a dealt hand within the sward's band (from the cover law's inner
  // edge, land.zN, to 70 m inside it), 28 to 75 m back from the road (on the bend's hand: from the chord to the gate,
  // things.chordX); add() keeps them off the farmhouses and each other
  fam = 'sward';
  for (let k = 0; k < 3; k++) { const r = gt.range(6.2, 8), v = gt() < 0.5 ? 0 : 1, side = gt() < 0.5 ? 1 : -1, z = land.zN() + gt.range(0, 70), back = gt.range(28, 75); add(side > 0 ? back : things.chordX(z) - back, z, v, r, 4.8); }
  fam = 'brook';
  for (const d of [30, 37, -30, -38]) { const r = rng.range(2.2, 3.2), v = rng() < 0.5 ? 2 : 3, P = by(land.places.bridge + rng.range(-2, 2), d); add(P[0], P[1], v, r, 4.8); }
  fam = 'orchard';
  for (let hi = 0; hi < things.homes.length; hi++) {                                                         // the orchards, in rows, behind the house as the road sees it (by every other farmhouse of the farmland, and both under the wall)
    const h = things.homes[hi]; road.at(h.s, at); const hx = h.x - at.x, hz = h.z - at.z, ol = Math.hypot(hx, hz) || 1, ux = hx / ol, uz = hz / ol, gx0 = h.x + ux * (h.r + 13), gz0 = h.z + uz * (h.r + 13), keep = h.green || hi % 2 === 1;
    for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { const r = rng.range(2.2, 2.8), v = 2, jx = rng.range(-0.5, 0.5), jz = rng.range(-0.5, 0.5); const lx = (i - 1) * 6.6 + jx, lz = (j - 1) * 6.6 + jz; if (keep) add(gx0 + ux * lz - uz * lx, gz0 + uz * lz + ux * lx, v, r, 9, far); }
  }
  const ct = Math.cos(env.look.plotTurn), st = Math.sin(env.look.plotTurn); fam = 'far lines';
  for (let k = 0; k < 6; k++) {                                                                             // lines of trees between far plots
    const s = rng.range(-140, PL.edge), side = rng() < 0.5 ? 1 : -1, d = rng.range(70, 330), n = 4 + Math.floor(rng() * 4), P = by(s, side * d);
    for (let i = 0; i < n; i++) { const r = rng.range(3.4, 5.6), v = 2, j = rng.range(-2, 2), x = P[0] - st * (i * 13 + j), z = P[1] + ct * (i * 13 + j); if (z < land.zS(x) - 20) add(x, z, v, r, 30, far); }
  }
  return { pts, far };
}
// (the lowest leaf or bough of a shape's OUTER crown, beyond 0.45 of its radius: what can hang over the lane)
const lowOf = (g) => { const p = g.attributes.position, r2 = 0.2 * g.userData.radius * g.userData.radius; let m = 1e9; for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); if (x * x + z * z > r2) m = Math.min(m, p.getY(i)); } return m; };
export async function buildTrees(ctx, env, things) {
  const { land } = env, rng = streamOf(ctx, 'gate-trees');
  await flora.prepareLeafTexture({}, ctx.yield);
  const wind = flora.makeWind({ direction: [env.look.windDir[0], env.look.windDir[1]], strength: env.look.windStrength });
  const mat = flora.windMaterial({ wind }), variants = [];
  for (const [nm, detail, height, full] of TREE_SHAPES) { const g = flora.oakGeometry({ rng: rng.fork(nm), detail, height, fullness: full }); g.userData.height = height; variants.push(g); await ctx.yield(); }
  const { pts, far } = placeTrees(ctx, env, things, rng, variants.map((g) => ({ radius: g.userData.radius, height: g.userData.height, low: lowOf(g) })));
  const turn = streamOf(ctx, 'gate-tree-turn'); for (const p of pts) p.rot = turn() * TAU; for (const p of far) p.rot = turn() * TAU;
  // those by the road cast into the shadow map; the hedges, orchards and far lines lie on the kit's soft ground shadows
  const group = new THREE.Group(), common = { variants, material: mat, wind, receiveShadow: true, tint: 0.14, hue: 0.05, sink: 0.02, tilt: 0.03 };
  const leafy = await buildLeafCrowns(ctx, { variants, points: pts, material: mat, common }); group.add(leafy.object); await ctx.yield();   // (the roadside trees' crowns: the leaf part's)
  const forest = flora.makeScatter({ ...common, rng: rng.fork('scatter'), points: leafy.rest, castShadow: true, chunks: 8 }); group.add(forest.object); await ctx.yield();
  const groves = flora.makeScatter({ ...common, rng: rng.fork('groves'), points: far, chunks: 3, heightAt: (x, z) => land.ground(x, z), groundShadow: { sunDir: env.sun, strength: 0.42 } }); group.add(groves.object);
  return { object: group, count: pts.length + far.length, points: pts, farPoints: far, triangles: forest.triangles + groves.triangles + leafy.triangles, update(dt, time) { flora.updateWind(mat, time); } };
}
export const TREE_SHAPES = [['a', 1, 13, 1], ['b', 1, 12, 1.15], ['c', 0, 11, 1], ['d', 0, 10, 1.12]];

// THE BROOK'S WATER (a few metres either side of the bridge, level; its glitter is by place and the clock, nothing
// of the sight's fall), THE SMOKE of two farmhouse chimneys (fixed crossed quads leaning down the wind, never turned
// to the lens) and P3, THE BLOWN PETALS (the kit's medium in a fixed box low over the field by the road; its near
// fade is the kit's own law).
export async function buildSmall(ctx, env, things) {
  const { road, land, U } = env, group = new THREE.Group(), at = {}, wp = [], wi = [];
  for (const side of [1, -1]) {
    const base = wp.length / 3; let n = 0;
    for (let a = 3.36; a <= 28.01; a += 1.76, n++) {
      const d = side * a, sc = land.places.bridge + 2.5 * Math.sin(d / 9), w = 1.55 * (1 - sstep(20, 28, a)) + 0.05;
      for (const e of [-w, w]) { road.at(sc + e, at); wp.push(at.x - at.tz * d, land.waterY, at.z + at.tx * d); }
      if (n > 0) { const b = base + n * 2; if (side > 0) wi.push(b - 2, b - 1, b, b - 1, b + 1, b); else wi.push(b - 2, b, b - 1, b - 1, b, b + 1); }
    }
  }
  const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute(wp, 3)); wg.setIndex(wi);
  const nn = new Float32Array(wp.length); for (let i = 1; i < nn.length; i += 3) nn[i] = 1; wg.setAttribute('normal', new THREE.BufferAttribute(nn, 3));
  const water = new THREE.Mesh(wg, gateMaterial(U, 'water', { side: THREE.DoubleSide }, '', '', '',
    `\n { vec2 p = vGW.xz; float g = GT(p / 2.6 + uTime * vec2(.05, .03)).r * GT(p / 1.9 - uTime * vec2(.04, .06)).g;
      diffuseColor.rgb = mix(vec3(.105, .19, .235), vec3(.36, .47, .50), smoothstep(.40, .66, g)) * gateCloud(p); }\n`));
  // (the brook's sheet takes the light on its upper face whichever way a triangle winds: without this its far half lay near black)
  water.material.userData.more = (sh) => { sh.fragmentShader = sh.fragmentShader.replace('#include <normal_fragment_begin>', '#include <normal_fragment_begin>\n normal = normalize(vNormal);\n'); };
  water.receiveShadow = true; group.add(water);
  // smoke
  const sp = [], su = [], si = [], wd = env.look.windDir, homes = things.homes.filter((h) => !h.green).sort((a, b) => a.dist - b.dist).slice(0, 2);
  // (R-f: ONE RIBBON to a chimney, laid as its middle line alone: the program sets its two edges square to the eye's bearing about the ribbon's own upright, so it turns about its own place and is never seen edge-on or crossed; its smoke rises by the clock)
  const sw = [];
  for (const h of homes) {
    const y0 = h.chim[1], base = sp.length / 3;
    for (let j = 0; j <= 6; j++) { const t = j / 6, w = 0.5 + 2.6 * t, lean = 7 * t * t, y = y0 + 11 * t; for (const e of [-1, 1]) { sp.push(h.chim[0] + wd[0] * lean, y, h.chim[2] + wd[1] * lean); su.push(e * 0.5 + 0.5, t); sw.push(w * e); } if (j) { const b = base + j * 2; si.push(b - 2, b - 1, b, b - 1, b + 1, b); } }
  }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3)); sg.setAttribute('uv', new THREE.Float32BufferAttribute(su, 2)); sg.setAttribute('aWide', new THREE.Float32BufferAttribute(sw, 1)); sg.setIndex(si);
  if (si.length) { sg.computeBoundingSphere(); sg.boundingSphere.radius += 3.1; }   // (the ribbon's greatest half breadth, which the middle line does not carry)
  const smoke = new THREE.Mesh(sg, new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: true,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: U.uTime, tTone: U.tTone },
    vertexShader: 'attribute float aWide; varying vec2 vUv;\n#include <fog_pars_vertex>\nvoid main() { vUv = uv; vec3 mid = (modelMatrix * vec4(position, 1.)).xyz; vec2 to = cameraPosition.xz - mid.xz; to /= max(length(to), .001); mid.xz += vec2(to.y, -to.x) * aWide; vec4 mvPosition = viewMatrix * vec4(mid, 1.); gl_Position = projectionMatrix * mvPosition;\n#include <fog_vertex>\n}',
    fragmentShader: `uniform sampler2D tTone; uniform float uTime; varying vec2 vUv;
#include <fog_pars_fragment>
void main() {
  float n = texture2D(tTone, vec2(vUv.x * .22, vUv.y * .5 - uTime * .06)).r * .6 + texture2D(tTone, vec2(vUv.x * .55 + .3, vUv.y * 1.1 - uTime * .11)).g * .4;
  float edge = smoothstep(0., .4, vUv.x) * (1. - smoothstep(.6, 1., vUv.x));
  float a = smoothstep(.34, .68, n) * edge * smoothstep(0., .1, vUv.y) * (1. - smoothstep(.4, 1., vUv.y)) * .42;
  gl_FragColor = vec4(vec3(.60, .62, .66), a);
#include <fog_fragment>
}` }));
  smoke.renderOrder = 2; if (si.length) group.add(smoke);
  await ctx.yield();
  // P3, BLOWN PETALS (the kit's particles, kind petal; stream 'gate-petals'): eight boxes standing in the world, one
  // to every eighth of the road from the wall's crossing to the sward's edge, both as dealt, each 18 m wider
  // than its piece of road on every hand and ONE LEVEL SLAB 1.2 m deep, its floor 0.3 m and its top 1.5 m over the MEAN height of
  // the brick along its piece (R-g: where the brick or the land beside it lies lower than that mean the petals fly that much
  // higher over the ground, some metres where the land falls away; where it lies higher they are under it, unseen): scarlet, sparse, carried by the one wind.
  // Each box wraps in itself, so the world may be entered at any clock.
  const wdir = env.look.windDir, pr = streamOf(ctx, 'gate-petals'), petals = [], NB = 8, PS0 = land.places.edge, PS1 = land.places.sward, each = Math.round((env.look.petals || 6000) / NB);
  for (let b = 0; b < NB; b++) {
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9, ys = 0, n = 0;
    for (let s = PS0 + b * (PS1 - PS0) / NB; s <= PS0 + (b + 1) * (PS1 - PS0) / NB + 0.01; s += 4) { road.at(s, at); x0 = Math.min(x0, at.x); x1 = Math.max(x1, at.x); z0 = Math.min(z0, at.z); z1 = Math.max(z1, at.z); ys += land.roadY(s); n++; }
    const P = fx.makeParticles({
      rng: pr, preset: 'petals', follow: false, center: [(x0 + x1) / 2, ys / n + 0.9, (z0 + z1) / 2], box: [x1 - x0 + 36, 1.2, z1 - z0 + 36], count: each,
      colors: ['#c2281a', '#9c1a15', '#d24a2c'], size: [0.06, 0.1], velocity: [wdir[0] * 3.4, -0.2, wdir[1] * 3.4], velocityRandom: [1.2, 0.5, 1.2], intensity: 0.9,
    });
    group.add(P.object); petals.push(P);
    await ctx.yield();
  }
  return { object: group, water, smoke, petals, update(dt, time) { for (const P of petals) P.update(dt, time); } };
}

// ---- THE FIELD PART'S TWO DOORS for the world file.
// prepareField: the road, the land, the tone field, the built textures and the uniforms every paint shares.
// look: { windDir: [x, z] unit, windSpeed m/s, windStrength, cloudDrift: [x, z] m/s, cloudCut, cloudShade, plotTurn radians, petals: their count }.
export async function prepareField(ctx, look) {
  const road = layRoad(); await ctx.yield();
  const tone = await makeTone(ctx); await ctx.yield();
  const land = makeLand(ctx, road, tone); await ctx.yield();
  const steads = dealSteads(ctx, road, land);
  const tBrick = await buildBrick(ctx); await ctx.yield();
  const tBloom = await buildBloom(ctx); await ctx.yield();
  const tGrit = await buildGrit(ctx); await ctx.yield();
  const tCard = await cardTexture(ctx, await buildCards(ctx)); await ctx.yield();
  const U = {
    tTone: { value: tone.texture }, tBrick: { value: tBrick }, tBloom: { value: tBloom }, tGrit: { value: tGrit }, tCard: { value: tCard }, uTime: { value: 0 },
    uWind: { value: new THREE.Vector4(look.windDir[0], look.windDir[1], look.windSpeed, look.windStrength) },
    uEdge: { value: new THREE.Vector4(land.edge[0], land.edge[1], land.drift[0], land.drift[1]) },
    uCloud: { value: new THREE.Vector4(look.cloudDrift[0], look.cloudDrift[1], look.cloudCut, look.cloudShade) },
    uPlot: { value: new THREE.Vector4(Math.cos(look.plotTurn), Math.sin(look.plotTurn), 0, 0) },
    uRoad: { value: new THREE.Vector4(road.L, 0, 0, 0) },
    uLane: { value: new THREE.Vector4(land.lane[0], land.lane[1], land.ridgeU[4], 0) },
    uRidge: { value: new THREE.Vector4(land.ridgeU[0], land.ridgeU[1], land.ridgeU[2], land.ridgeU[3]) },
  };
  // THE ROUTE: the eye over the flown line (the road's centre line and land.flown's offset to its right) at every 6 m,
  // the last point the ring's centre. Its height is land.eyeY.
  const pts = [], at = {};
  for (let s = 0; s < road.L - 3; s += CHORD) { road.at(s, at); const o = land.flown(s); pts.push([at.x - at.tz * o, land.eyeY(s), at.z + at.tx * o]); }
  pts.push([RING.x, RING.y, RING.z]);
  return { ctx, road, land, tone, U, look, steads, places: land.places, routePoints: pts, textures: [tone.texture, tBrick, tBloom, tCard, tGrit] };
}
// buildField: everything of the country, added to root (a group at the world's origin). Returns update and dispose.
export async function buildField(ctx, root, env) {
  const parts = [];
  const ground = await buildLand(ctx, env); root.add(ground.object); env.ground = ground; await ctx.yield();
  const things = await buildThings(ctx, env); root.add(things.object); env.things = things; await ctx.yield();     // (F-8: the farmsteads first, so the ground's dress knows their yards)
  const poppies = await buildPoppies(ctx, env); root.add(poppies.object); await ctx.yield();
  const trees = await buildTrees(ctx, env, things); root.add(trees.object); parts.push(trees); await ctx.yield();
  const small = await buildSmall(ctx, env, things); root.add(small.object); parts.push(small); await ctx.yield();
  return {
    env, ground, poppies, things, trees, small,
    // A LEVEL OF DETAIL BY WHERE THE EYE IS (named at the heads): a chunk of cards farther than its own reach (CARD_FAR,
    // DRESS_FAR, NEAR_FAR or NEAR_OUT metres) from the eye is not drawn (every card in it has faded out by then; the ground's own red law carries the same cover, so
    // nothing shows where they stop). Never what stands where.
    update(dt, time, camera) {
      env.U.uTime.value = time; for (const p of parts) if (p.update) p.update(dt, time, camera);
      if (camera) {
        const e = camera.matrixWorld.elements;
        for (const m of poppies.meshes) { const b = m.geometry.boundingSphere, dx = b.center.x - e[12], dy = b.center.y - e[13], dz = b.center.z - e[14], r = m.userData.far + b.radius; m.visible = dx * dx + dy * dy + dz * dz < r * r; }
      }
    },
    dispose() { for (const t of env.textures) t.dispose(); for (const p of parts) if (p.dispose) p.dispose(); },
  };
}
