// HERO SET PIECE for "thousand-lagoons": THE REVEAL FROM THE 42 m CREST.
//
// What it is
//   A whole sheet of the Lencois Maranhenses, 1320 m wide and 1880 m long, modelled as ~70 analytic barchan
//   crescents (sharp brink, 32 degree slip face toward +Z, long gentle windward back toward -Z, two horns
//   pointing downwind = toward the arriving camera) that overlap like fish scales, each cupping a rain lagoon.
//   Five crescents are authored under the flight line: dune 1 (19 m), dune 2 (21.5 m), THE TALL DUNE (42 m, the
//   hero, its brink 25 m upwind of the origin) and the pair whose horn tips leave the 40 m water gate where the
//   portal stands. Dunes 1 and 2 are STAGGERED to the left of the tall dune (x -411 and -128), so that a route
//   (ROUTE, anchors.routeX(z)) can cross dune 1 over its sunlit right horn, dune 2 over its left horn, and ride the
//   tall dune's brink from its left shoulder to the summit: no slip face is ever met square-on. Around them a seeded field of crescents runs to the haze. Every crest sheds a plume of
//   blown sand toward +Z, grainflow tongues slide down the slip faces, saltation streamers snake over the
//   backs, cloud shadows cross sand and water, and a line of 200 black skimmers (black above, white below,
//   red-based knife bills) hugs the surface line abreast: bills ploughing silver wakes through each lagoon,
//   the whole line flexing up each slip face, pouring over the tall crest and falling away down its back.
//   Camera arrives from +Z flying toward -Z (upwind). Sun on the LEFT (-X), 68 degrees off the nose, 20 degrees up:
//   windward backs blaze white, the slip faces that face the camera turn sky blue (left half of each cup in
//   shadow, right half lit), so every crescent reads as a white scale with a blue edge.
//
// Size and cost
//   radius 110 / height 80 / center (0,30,-150) are FRAMING hints for the viewer (they put the orbit at the
//   reveal position); the sand sheet itself spans x -660..660, z -1160..840, y -3..~46.
//   ~156k triangles (sand+water 109k, skimmers 200 x 188, wakes 8k, plumes 2.8k), 4 draw calls, one
//   336x512 half-float data texture (height, sun shadow), no lights. Build ~0.6 s, in slices.
//
// Lighting it expects
//   NONE from the scene. Every material is a self-lit ShaderMaterial (linear HDR, scene fog supported) using
//   the brief's fixed sun: anchors.sunDir (hero-local, TO the sun). Lit sand = palette[0] x soft-knee sun
//   (never above ~0.8), every shadow / unlit face / ripple trough = palette[1] sky-blue fill. Sun shadows are
//   baked per texel (4 m) from the height field, so each crest throws its 60-110 m blue shadow to +X.
//   Put the world's sun disc at anchors.sunDir; fog colour should be the milk-white horizon (#E9F0F4-ish):
//   the sheet's outer 50 m dissolve into plain lit sand (opts.edgeFade) so horizon rings can take over without a seam.
//   Bloom: only water glitter (up to ~5), wakes (~1.6) and sand sparkle exceed 1.
//
// opts
//   palette     [sand, shadow blue, mint, turquoise, teal, zenith blue, bill red] hex strings (brief default)
//   hour        'afternoon' (default) | 'noon' | 'squall' | 'moon'    sun direction, colours, plume strength
//               (moon: dim silver sand, pools as dark mirrors of the sky, one glitter road toward the moon)
//   season      'july' (default) | 'june' (water +0.9 m, lagoons chain) | 'september' (water -0.7 m, more sand in the air)
//   sunDir      [x,y,z] override of the hero-local direction to the sun
//   birds       200 (120..260)   birdMinPx 6 (skimmers never draw smaller than this many pixels of span)
//   plumes      1400 sprites (x quality.detail)      plumeStrength 1     edgeFade true     autoplay true (see setProgress)
//
// Driving it (all keyed to progress, never to wall-clock)
//   hero.setProgress(p)   p 0..1 along anchors.flyThrough (z 690 -> -345). Places the skimmer line abreast of
//                         the camera, sends it 45 m ahead and lofts it during the reveal/dive (p .60-.90).
//   hero.setLine(z, x, lead, loft)   direct control instead: line z and x (hero-local, camera position),
//                         metres the line runs ahead, 0..1 loft (birds leave the surface, wings half folded).
//   hero.setFlock(camY, k, slope, pairs, fold)   the FLOCK: the `pairs` nearest pairs leave the line (strength k 0..1)
//                         and fly round the camera at its own height camY, 3-14 m ahead, along a line that drops
//                         `slope` metres per metre ahead (negative on a climb); fold 0..1 half folds their wings.
//                         This is what puts 100 px skimmers in the reveal, the dive and the climbs.
//   hero.setBirdMinPx(px, maxScale)  smallest drawn span in pixels and the most a bird may be enlarged for it (default 6
//                         times life size); raise both while seen through a portal, where the camera stands far back.
//   hero.setHeading(hx, hz)  the camera's heading over the ground (unit x,z; default 0,-1): the near birds, the flock
//                         and the wakes turn with it, the far ends of the line keep straight upwind.
//   hero.setWake(len, wide)  wake length (m) and width factor, for a camera high above the water (default 7.5, 1).
//   hero.setPeel(p)       0..1 down the dive: flock pairs peel away ahead and below in turn, outer ones come through.
//   hero.setSkein(k)      0..1: the flock strings out into a V skein 17 to 65 m ahead of the camera (setFlock's slope sets how far
//                         below it flies): the birds seen from above, in the high view over the tall dune.
//   GLSL_BOWL (export)    bowlY(xz): beyond the gate the land rises gently with distance (uniforms.uBowl 0/1,
//                         opts.bowl false to switch off) so far hollows stay in sight from the crest; anything
//                         planted beyond 480 m from the origin and upwind of z = 150 must add it in its vertex shader.
//   hero.progressAtZ(z)   p for a hero-local z, so a world path can call setProgress(progressAtZ(cam.z)).
//   Until one of these is called the piece plays a demo sweep over the crest (opts.autoplay).
//   hero.uniforms.uWater.value  water level (m);  hero.setPlume(k, far) plume strength (far: how much
//   the plumes beyond 140 m swell and trail, 0.75 plain .. 2.2 at the reveal).
//
// anchors (hero-local; multiply by object.matrixWorld)
//   flyThrough    ordered Vector3 list, the safe camera line: 0.5 m over each lagoon, 3 m off each slip face,
//                 2.5 m over the backs, 10 m over the tall crest, level at water+2.5 for the last 60 m.
//                 Verified at build: >= 2.4 m above sand, >= 0.45 m above water. Nothing solid within 6 m but sand.
//   reveal        { position, lookAt }: 10 m above the tall crest, gaze 12 degrees down toward the portal.
//   portalSeat    { position (0, water, -345), normal (0,0,1), width 14 }: base centre of the arch in the water
//                 gate between hornTips.left/right; flyThrough ends 2.5 m above it.
//   hornTips      { left, right } tips of the two crescents flanking the portal.
//   crests        [{ position, height, width }] of the five authored dunes (dune1, dune2, tall, gateL, gateR).
//   lagoons       [{ position, radii:[x,z] }] the four flown lagoons + the oasis pool (egrets, shoals, sedge).
//   grove         position of the oasis pool 150 m right of lagoon 3 (buriti palms).
//   buriedTrunks  position on the back of dune 2, 8 m right of the line.
//   sunDir, windDir (downwind, +Z), waterLevel, bounds {x0,x1,z0,z1}
//   heightAt(x,z) sand height (analytic, exact), waterAt(x,z) water surface y, surfaceAt(x,z) = max of both,
//   depthAt(x,z) water depth (>0 = lagoon), shadeAt(x,z) the baked sun shadow (0 in a crest's shadow .. 1 sunlit).
//   Use these for all planting and for extra birds.
// Round 7: megaripples with blue lee shadows and film-holding troughs on every gentle floor; the water's edge on flat
// floors is feathered (damp, film, sky-mirroring sheet, shallows) with dash glitter along the ripples; setNear(k) brings
// two skimmers a side up beside the camera as wingmates, setEscort(k, slope, bank) holds four round us on the brink ride.
import * as THREE from 'three';

const V3 = THREE.Vector3;
const DEFAULT_PALETTE = ['#F7F3EA', '#86A9D8', '#A6E6D2', '#2EC4BE', '#0E6E7C', '#5E9FDD', '#E8402A'];
const X0 = -660, X1 = 660, Z0 = -1160, Z1 = 840;      // sheet bounds
const TW = 336, TH = 512;                             // baked map (about 3.9 m texels)
const TAN_LEE = Math.tan(32 * Math.PI / 180), BACK = 4.6;
const Z_START = 690, Z_PORTAL = -345;

// ---------------------------------------------------------------------------------------------------------
// The dune model: analytic crescents, max-combined over an undulating floor with lagoon basins scooped out.
// ---------------------------------------------------------------------------------------------------------
// The authored crescents are staggered to the right as we go upwind, so the route can cross every one of them
// obliquely: ROUTE_X(z) is the line the camera follows over the ground (the world's planPath keeps to it).
export const ROUTE = [[840, -220], [630, -270], [442, -317], [397, -311], [316, -254], [264, -227], [130, -220], [63, -197], [14, -130], [-20, -44], [-71, 0], [-1200, 0]];
function routeX(z) { for (let i = 1; i < ROUTE.length; i++) if (z >= ROUTE[i][0]) { const a = ROUTE[i - 1], b = ROUTE[i]; return a[1] + (b[1] - a[1]) * (a[0] - z) / (a[0] - b[0]); } return 0; }
function makeField(rng, noise, water = 1.3) {
  const dunes = [], basins = [], bars = [];
  const D = (x, z, W, H, bow, auth = 0) => {
    const d = { x, z, W, H, bow, auth, back: BACK, sk: rng.range(-0.1, 0.1), ph: rng.range(0, 40),
      wa: rng.range(3, 8), wf: rng.range(0.008, 0.016), ca: rng.range(3, 7) * (auth ? 0.5 : 1), cf: rng.range(0.02, 0.04),
      lump: rng.range(0.03, 0.09), lf: rng.range(0.025, 0.05) };
    dunes.push(d); return d;
  };
  const B = (x, z, a, b, dep) => basins.push({ x, z, a, b, dep });
  const j = (s) => rng.range(-s, s);
  // authored crescents under the flight line
  const d1 = D(-411 + j(4), 494, 150 + j(8), 19 + j(1), 80, 1);
  const d2 = D(-128 + j(4), 280, 160 + j(8), 21.5 + j(1), 86, 1);
  const tall = D(0, -25, 235 + j(8), 42 + j(1.2), 125, 1); tall.back = 3.6;      // the tall dune: a shorter, 15 degree back, so lagoon 4 keeps its length
  const gw = 116 + j(6);
  const gL = D(-(15 + gw), -415, gw, 22 + j(2), 72, 1), gR = D(15 + gw, -415, gw, 23 + j(2), 72, 1);
  for (const d of [d1, d2, tall, gL, gR]) d.sk *= 0.2;
  const auth = [d1, d2, tall, gL, gR];
  B(-291, 634, 124, 132, 2.0); B(-277, 376, 112, 50, 3.4); B(0, 98, 195, 56, 3.9);
  B(0, -265, 180, 128, 3.7); B(gL.x, -343, 74, 44, 2.6); B(gR.x, -343, 74, 44, 2.6);
  B(-153, 150, 60, 42, 6.4);                                                   // oasis pool: three metres deep under the palms, dark teal
  // low white sandbars in lagoon 1, either side of the entry line: the first thing the sun lights
  bars.push({ x: -255, z: 599, a: 15, b: 5.5, c: 0.95, s: 0.3, top: 0.75 }, { x: -307, z: 589, a: 19, b: 6.5, c: 0.9, s: -0.43, top: 0.9 }, { x: -263, z: 573, a: 13, b: 5, c: 1, s: 0.1, top: 0.6 });
  // the seeded field: a jittered, staggered lattice of crescents, skipping the authored corridor
  let row = 0;
  for (let z = 705 + j(20); z > Z0 + 20; z -= rng.range(180, 215), row++) {
    const off = (row % 2) * 118 + j(30);
    for (let x = X0 - 60 + off; x < X1 + 60; x += rng.range(205, 255)) {
      const fx = x + j(34), fz = z + j(38);
      const W = rng.range(98, 150), H = (rng.chance(0.14) ? rng.range(27, 33) : rng.range(15, 25)) * (fz < -480 ? 0.44 : 1);   // low dunes beyond the gate, so the reveal sees into their hollows
      let ok = !(Math.abs(fx - routeX(fz)) < 150 + W * 0.55 && fz > -330 && fz < 760) && !(Math.abs(fx) < 120 && fz > -520 && fz <= -330);
      for (const a of dunes) if (a.auth && Math.abs(fx - a.x) < (a.W + W) * 0.86 && fz - a.z < 150 && a.z - fz < 130 + a.H * 3) ok = false;
      if (!ok) continue;
      const d = D(fx, fz, W, H, W * rng.range(0.5, 0.68));
      { const far = fz < -480, bj = j(12), bo = rng.range(30, 46), ba = rng.range(0.66, 0.9), bb = rng.range(40, 62), bd = rng.range(2.6, 3.9);
        if (far) B(fx + bj, fz + H / TAN_LEE + bb * 1.15 + 6, W * ba * 1.25, bb * 1.5, bd); else B(fx + bj, fz + H / TAN_LEE + bo, W * ba, bb, bd); }
    }
  }
  // beyond the gate: small ponds in the gaps between the crescents, so the far field is pools to the haze
  { const pr = rng.fork ? rng.fork('far-ponds') : rng;
    for (let n = 0, tries = 0; n < 18 && tries < 400; tries++) {
      const x = pr.range(X0 + 40, X1 - 40), z = pr.range(Z0 + 40, -520), a = pr.range(34, 62), b = pr.range(24, 40);
      let ok = true; for (const o of basins) { const ux = (x - o.x) / (o.a * 0.8 + a), uz = (z - o.z) / (o.b * 0.8 + b); if (ux * ux + uz * uz < 1) { ok = false; break; } }
      if (ok) { B(x, z, a, b, pr.range(2.4, 3.2)); n++; }
    } }
  // spatial buckets
  const GX = 12, GZ = 16, cw = (X1 - X0) / GX, ch = (Z1 - Z0) / GZ;
  const dB = Array.from({ length: GX * GZ }, () => []), bB = Array.from({ length: GX * GZ }, () => []);
  const reg = (arr, it, xa, xb, za, zb) => {
    const i0 = Math.max(0, Math.floor((xa - X0) / cw)), i1 = Math.min(GX - 1, Math.floor((xb - X0) / cw));
    const k0 = Math.max(0, Math.floor((za - Z0) / ch)), k1 = Math.min(GZ - 1, Math.floor((zb - Z0) / ch));
    for (let k = k0; k <= k1; k++) for (let i = i0; i <= i1; i++) arr[k * GX + i].push(it);
  };
  for (const d of dunes) reg(dB, d, d.x - d.W * 1.12 - 10, d.x + d.W * 1.12 + 10, d.z - d.H * d.back - 30, d.z + d.bow + d.W * 0.12 + d.H / TAN_LEE + 20);
  for (const b of basins) reg(bB, b, b.x - b.a, b.x + b.a, b.z - b.b, b.z + b.b);

  // each dune's footprint, a little generous: outside it the dune adds nothing and is skipped without any arithmetic
  for (const d of dunes) { const hm = d.H * (1 + d.lump), e = Math.abs(d.sk) * d.W + d.ca + 1; d.bx = d.W + d.wa; d.z0 = d.z - e - hm * d.back - 6; d.z1 = d.z + d.bow + e + hm / TAN_LEE; }
  const o = { dz: 0 };
  function duneH(d, x, z) {
    if (z < d.z0 || z > d.z1 || Math.abs(x - d.x) > d.bx) return 0;
    const lx = x - d.x + d.wa * Math.sin(z * d.wf + d.ph);
    const a = Math.abs(lx) / d.W; if (a >= 1) return 0;
    const hc = d.H * Math.pow(1 - Math.pow(a, 2.4), 0.9) * (1 + d.lump * Math.sin(lx * d.lf + d.ph * 3));
    const zc = d.z + d.bow * a * a + d.sk * lx + d.ca * Math.sin(lx * d.cf + d.ph * 2);
    const dz = z - zc; o.dz = dz;
    if (dz >= 0) return Math.max(0, hc - dz * TAN_LEE);
    const t = -dz / (hc * d.back + 6);
    return t >= 1 ? 0 : hc * Math.pow(1 - t, 1.3);
  }
  const info = { dz: 99, h: 0, d: null, beach: false };
  function heightAt(x, z, wantInfo) {
    const i = Math.min(GX - 1, Math.max(0, Math.floor((x - X0) / cw))), k = Math.min(GZ - 1, Math.max(0, Math.floor((z - Z0) / ch)));
    const ds = dB[k * GX + i], bs = bB[k * GX + i];
    let m = 0, mdz = 99, md = null;
    for (let n = 0; n < ds.length; n++) { const h = duneH(ds[n], x, z); if (h > m) { m = h; mdz = o.dz; md = ds[n]; } }
    let s = 0;
    for (let n = 0; n < bs.length; n++) {
      const b = bs[n], ux = (x - b.x) / b.a, uz = (z - b.z) / b.b, r = ux * ux + uz * uz;
      if (r < 1) s += b.dep * (1 - r) * (1 - r);
    }
    if (wantInfo) { info.dz = mdz; info.h = m; info.d = md; }
    const ax = Math.abs(x - routeX(z)), cor = z < -440 ? 1 : ax >= 260 ? 1 : ax <= 150 ? 0.35 : 0.35 + 0.65 * (ax - 150) / 110;   // calmer floor under the flight line
    const far = z < -520 ? 1 : z > -440 ? cor : cor + (1 - cor) * (-440 - z) / 80;
    const low = z < -520 ? -0.5 : z > -420 ? 0 : -0.5 * (-420 - z) / 100;                         // the far floor lies a little higher: beyond the gate only the scooped basins flood, as separate pools
    const base = 1.4 - low + (0.85 * noise.n2(x * 0.0043 + 7.1, z * 0.0043 - 3.3) + 0.25 * noise.n2(x * 0.017, z * 0.017 + 9.0)) * far;
    let h = base + m - 3.9 * (1 - Math.exp(-s / 3.9));
    // a dry beach at the foot of every authored slip face: where a basin would flood the foot, the floor is lifted into
    // a wedge that stands 0.28 m clear of the water at the foot and shelves under it within three metres (a pale shore
    // line and a band of mint shallows; no 32 degree face ever plunges straight into a lagoon)
    let beach = 0;
    for (let n = 0; n < auth.length; n++) {
      const d = auth[n]; if (z < d.z - 12 || z > d.z1 + 13 || Math.abs(x - d.x) > d.bx) continue;
      const lx = x - d.x + d.wa * Math.sin(z * d.wf + d.ph), a = Math.abs(lx) / d.W; if (a >= 1) continue;
      const dzc = z - (d.z + d.bow * a * a + d.sk * lx + d.ca * Math.sin(lx * d.cf + d.ph * 2)); if (dzc < -7 || dzc > 14 + d.H * 1.9) continue;
      const hc = d.H * Math.pow(1 - Math.pow(a, 2.4), 0.9) * (1 + d.lump * Math.sin(lx * d.lf + d.ph * 3)); if (hc < 1) continue;
      const fd = dzc - hc / TAN_LEE; if (fd < -7 || fd > 12) continue;
      const t1 = Math.min(1, (hc - 1) / 2.5), t2 = fd < 7 ? 1 : 1 - (fd - 7) / 5, lift = t1 * t1 * (3 - 2 * t1) * t2 * t2 * (3 - 2 * t2) * (water + 0.28 - 0.1 * Math.max(fd, 0) - h);
      if (lift > beach) beach = lift;
    }
    h += beach; if (wantInfo) info.beach = beach > 0.03;
    if (z > 555 && z < 625 && x > -335 && x < -232) for (let n = 0; n < bars.length; n++) {
      const b = bars[n], dx = x - b.x, dz = z - b.z, u = (dx * b.c + dz * b.s) / b.a, w = (dz * b.c - dx * b.s) / b.b, r = u * u + w * w;
      if (r < 1.7) { const cap = water + b.top * (1.25 - 1.25 * r) / (1 + 0.6 * r); if (cap > h) h = cap; }
    }
    return h;
  }
  // the dominant dune alone (no floor, no basins): fills info; this is all the sheet builder needs to find slip faces
  function dom(x, z) {
    const i = Math.min(GX - 1, Math.max(0, Math.floor((x - X0) / cw))), k = Math.min(GZ - 1, Math.max(0, Math.floor((z - Z0) / ch))), ds = dB[k * GX + i];
    let m = 0, mdz = 99, md = null;
    for (let n = 0; n < ds.length; n++) { const h = duneH(ds[n], x, z); if (h > m) { m = h; mdz = o.dz; md = ds[n]; } }
    info.dz = mdz; info.h = m; info.d = md; return m;
  }
  return { dunes, basins, heightAt, dom, info, duneH, named: { d1, d2, tall, gL, gR } };
}

// crest point of a dune at lateral fraction t (-1..1): [x, crestHeightAboveFloor, z]
function crestPoint(d, t) {
  const lx = t * d.W, a = Math.abs(t);
  const hc = d.H * Math.pow(1 - Math.pow(a, 2.4), 0.9) * (1 + d.lump * Math.sin(lx * d.lf + d.ph * 3));
  const zc = d.z + d.bow * a * a + d.sk * lx + d.ca * Math.sin(lx * d.cf + d.ph * 2);
  return [d.x + lx - d.wa * Math.sin(zc * d.wf + d.ph), hc, zc];
}

// ---------------------------------------------------------------------------------------------------------
// Bake: height + soft sun shadow into a half-float texture (used by sand, water mirror, birds, wakes).
// ---------------------------------------------------------------------------------------------------------
async function bakeHeights(ctx, field) {
  const H = new Float32Array(TW * TH), dx = (X1 - X0) / TW, dz = (Z1 - Z0) / TH;
  for (let k = 0; k < TH; k++) {
    const z = Z0 + (k + 0.5) * dz; for (let i = 0; i < TW; i++) H[k * TW + i] = field.heightAt(X0 + (i + 0.5) * dx, z);
    if ((k & 3) === 3) await ctx.yield?.();      // a few rows per slice
  }
  return H;
}
async function bakeShadow(ctx, H, water, sun) {
  const S = new Float32Array(TW * TH), dx = (X1 - X0) / TW, dz = (Z1 - Z0) / TH;
  const hl = Math.max(1e-4, Math.hypot(sun.x, sun.z)), sx = sun.x / hl / dx, sz = sun.z / hl / dz, tan = Math.max(0.02, sun.y / hl);
  const ts = [], N = 26; for (let n = 1; n <= N; n++) ts.push(3.2 * n * (1 + 0.07 * n));
  for (let k = 0; k < TH; k++) {
    for (let i = 0; i < TW; i++) {
      const h0 = Math.max(H[k * TW + i], water) + 0.25; let s = 1;
      for (let n = 0; n < N; n++) {
        const t = ts[n], ray = h0 + t * tan; if (ray > 48) break;
        const fx = i + sx * t, fz = k + sz * t; if (fx < 0 || fz < 0 || fx > TW - 1.001 || fz > TH - 1.001) break;
        const ix = fx | 0, iz = fz | 0, ax = fx - ix, az = fz - iz, p = iz * TW + ix;
        const hh = (H[p] * (1 - ax) + H[p + 1] * ax) * (1 - az) + (H[p + TW] * (1 - ax) + H[p + TW + 1] * ax) * az;
        // a penumbra that grows with the distance to the crest (open ground must come out at 1: flat sand clears the ray
        // by 1.5 m at the first step); the blur below melts what is left of the 4 m texels
        const v = (ray - hh) / (0.06 * t + 0.6);
        if (v < s) { s = v; if (s <= 0) { s = 0; break; } }
      }
      S[k * TW + i] = s;
    }
    if ((k & 1) === 1) await ctx.yield?.();      // two rows per slice
  }
  // the march leaves 4 m teeth along every shadow edge: two passes of a small blur melt them into a penumbra
  const T = new Float32Array(TW * TH);
  for (let pass = 0; pass < 2; pass++) {
    for (let k = 0; k < TH; k++) { const r = k * TW; for (let i = 0; i < TW; i++) T[r + i] = 0.25 * S[r + Math.max(0, i - 1)] + 0.5 * S[r + i] + 0.25 * S[r + Math.min(TW - 1, i + 1)]; if ((k & 127) === 127) await ctx.yield?.(); }
    await ctx.yield?.();
    for (let k = 0; k < TH; k++) { const r = k * TW, ra = Math.max(0, k - 1) * TW, rb = Math.min(TH - 1, k + 1) * TW; for (let i = 0; i < TW; i++) S[r + i] = 0.25 * T[ra + i] + 0.5 * T[r + i] + 0.25 * T[rb + i]; if ((k & 127) === 127) await ctx.yield?.(); }
    await ctx.yield?.();
  }
  return S;
}
function makeMapTexture(H, S) {
  const data = new Uint16Array(TW * TH * 4), toH = THREE.DataUtils.toHalfFloat, one = toH(1);
  for (let p = 0, q = 0; p < TW * TH; p++, q += 4) { data[q] = toH(H[p]); data[q + 1] = toH(S[p]); data[q + 2] = 0; data[q + 3] = one; }
  const tex = new THREE.DataTexture(data, TW, TH, THREE.RGBAFormat, THREE.HalfFloatType);
  tex.magFilter = tex.minFilter = THREE.LinearFilter; tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.generateMipmaps = false; tex.colorSpace = THREE.NoColorSpace; tex.needsUpdate = true;
  return tex;
}

// ---------------------------------------------------------------------------------------------------------
// The sand sheet: a graded grid (2.5 m columns under the line, 5 m rows along it, coarser outward). Every slip
// face is a region S of the plan (the dominant dune is in its lee); wherever a grid edge crosses the outline of S,
// brink or foot, its nearer vertex is moved along that edge onto the crossing, in x or in z, and each quad near
// an outline takes the diagonal that fits the sand. So brinks and feet run along mesh edges whichever way they
// lie, and the fragment shader can tell a slip face from the triangle's own slope (no teeth, no scallops).
// Attributes: normal = the sand's normal seen from outside S, aNs = the same seen from inside (they differ only
// on the outline), aF = (0 at the brink .. 1 at the foot down the face, metres from the nearest brink capped at
// 20, the brink's height above the water over 6 m (how much rim it carries; under 0.4 a horn tip's face, lower than
// a mesh cell is wide, is drawn as plain sand), 1 inside or on the outline of S).
// ---------------------------------------------------------------------------------------------------------
async function buildSheet(ctx, field, water) {
  const xs = [0], zs = [];
  // columns are finest in a 220 m strip centred on the route (which runs between x = -320 and 0) and widen outward
  const XC = -160, xl = [];
  for (let x = 0; x < X1 - XC;) { x += 3.1 + 0.02 * Math.max(0, x - 110); xs.push(Math.min(x, X1 - XC)); }
  for (let x = 0; x < XC - X0;) { x += 3.1 + 0.02 * Math.max(0, x - 110); xl.push(Math.min(x, XC - X0)); }
  const xr = xl.reverse().map((v) => XC - v).concat(xs.map((v) => XC + v));
  for (let z = Z1; z > Z0;) { zs.push(z); z -= z > 722 ? 10 : z > -350 ? 5 : 5 + 0.025 * (-350 - z); }
  zs.push(Z0); zs.reverse();
  const nx = xr.length, nz = zs.length, nv = nx * nz;
  const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), nrs = new Float32Array(nv * 3), aF = new Float32Array(nv * 4);
  const cls = new Uint8Array(nv), snap = new Uint8Array(nv), sdx = new Float32Array(nv), sdz = new Float32Array(nv);
  const hA = field.heightAt, info = field.info, E = 0.25;
  // in the lee of the dominant dune and on its face (near the foot the full height says whether a beach has buried it)
  const inS = (x, z) => { if (!(field.dom(x, z) > 0.05 && info.dz >= 0)) return 0; if (info.h > 6) return 1; hA(x, z, true); return info.beach ? 0 : 1; };
  for (let k = 0; k < nz; k++) {
    for (let i = 0; i < nx; i++) cls[k * nx + i] = inS(xr[i], zs[k]);
    if ((k & 3) === 3) await ctx.yield?.();
  }
  await ctx.yield?.();
  // where the outline of S crosses a grid edge, measured from this vertex as a fraction of the edge (bisection)
  const cross = (x0, z0, x1, z1, c0) => { let a = 0, b = 1; for (let it = 0; it < 9; it++) { const m = (a + b) / 2; if (inS(x0 + (x1 - x0) * m, z0 + (z1 - z0) * m) === c0) a = m; else b = m; } return (a + b) / 2; };
  for (let k = 1; k < nz - 1; k++) {
    for (let i = 1; i < nx - 1; i++) {
      const v = k * nx + i, c = cls[v], x = xr[i], z = zs[k]; let best = 1e9, bx = 0, bz = 0;
      if (cls[v - 1] !== c) { const t = cross(x, z, xr[i - 1], z, c), d = t * (x - xr[i - 1]); if (t <= 0.5 && d < best) { best = d; bx = -d; bz = 0; } }
      if (cls[v + 1] !== c) { const t = cross(x, z, xr[i + 1], z, c), d = t * (xr[i + 1] - x); if (t <= 0.5 && d < best) { best = d; bx = d; bz = 0; } }
      if (cls[v - nx] !== c) { const t = cross(x, z, x, zs[k - 1], c), d = t * (z - zs[k - 1]); if (t <= 0.5 && d < best) { best = d; bx = 0; bz = -d; } }
      if (cls[v + nx] !== c) { const t = cross(x, z, x, zs[k + 1], c), d = t * (zs[k + 1] - z); if (t <= 0.5 && d < best) { best = d; bx = 0; bz = d; } }
      if (best < 1e8) { snap[v] = 1; sdx[v] = bx; sdz[v] = bz; }
    }
    if ((k & 3) === 3) await ctx.yield?.();
  }
  await ctx.yield?.();
  // THE WATERLINE. A flooded vertex is drawn lifted to the water, so a triangle from a dry vertex down to a deep one
  // would carry its shore up a tilted wedge: seen low across a lagoon, a row of teeth. Every flooded vertex next to a
  // dry one therefore slides along that edge onto the shore itself; shores run along mesh edges, as brinks and feet do.
  const hv = new Float32Array(nv), wl = new Uint8Array(nv), idz = new Float32Array(nv), ih = new Float32Array(nv);
  for (let k = 0; k < nz; k++) {
    for (let i = 0; i < nx; i++) { const v = k * nx + i; hv[v] = hA(xr[i] + sdx[v], zs[k] + sdz[v], true); idz[v] = info.dz; ih[v] = info.h; }
    if ((k & 3) === 3) await ctx.yield?.();
  }
  await ctx.yield?.();
  const DI = [-1, 1, 0, 0], DK = [0, 0, -1, 1];
  for (let k = 1; k < nz - 1; k++) {
    for (let i = 1; i < nx - 1; i++) {
      const v = k * nx + i; if (hv[v] >= water) continue;
      const x0 = xr[i] + sdx[v], z0 = zs[k] + sdz[v]; let best = 1e9, bx = 0, bz = 0;
      for (let q = 0; q < 4; q++) {
        const u = v + DK[q] * nx + DI[q]; if (hv[u] <= water + 0.02) continue;
        const ex = xr[i + DI[q]] + sdx[u] - x0, ez = zs[k + DK[q]] + sdz[u] - z0; let a = 0, b = 1;
        for (let it = 0; it < 8; it++) { const m = (a + b) / 2; if (hA(x0 + ex * m, z0 + ez * m) < water) a = m; else b = m; }
        const t = (a + b) / 2, dd = t * Math.hypot(ex, ez); if (dd < best) { best = dd; bx = ex * t; bz = ez * t; }
      }
      if (best < 1e8) { sdx[v] += bx; sdz[v] += bz; hv[v] = water; wl[v] = 1; snap[v] = 0; }
    }
    if ((k & 3) === 3) await ctx.yield?.();
  }
  await ctx.yield?.();
  const normalAt = (x, z, h0, out, p) => { const gx = h0 - hA(x + E, z), gz = h0 - hA(x, z + E), il = 1 / Math.hypot(gx, E, gz); out[p] = gx * il; out[p + 1] = E * il; out[p + 2] = gz * il; };
  for (let k = 0; k < nz; k++) {
    for (let i = 0; i < nx; i++) {
      const v = k * nx + i, p = v * 3, q = v * 4, x = xr[i] + sdx[v], z = zs[k] + sdz[v];
      pos[p] = x; pos[p + 1] = wl[v] ? hA(x, z, true) : hv[v]; pos[p + 2] = z;
      if (!wl[v]) { info.dz = idz[v]; info.h = ih[v]; }
      if (snap[v]) {
        // on the outline: the two normals are taken 0.35 m to either side, the face coordinates just inside S
        const l = Math.hypot(sdx[v], sdz[v]) || 1, sg = cls[v] ? -0.35 / l : 0.35 / l, ix = x + sdx[v] * sg, iz = z + sdz[v] * sg;
        const ox = x - sdx[v] * sg, oz = z - sdz[v] * sg;
        normalAt(ox, oz, hA(ox, oz), nor, p); normalAt(ix, iz, hA(ix, iz, true), nrs, p);
        const dz = Math.max(0, info.dz), run = dz + info.h / TAN_LEE, brink = dz < 0.9 && info.h > 0.05;
        aF[q] = brink ? 0 : run > 1e-3 ? Math.min(1, dz / run) : 1; aF[q + 1] = brink ? 0 : Math.min(20, Math.max(dz, 0.9)); aF[q + 2] = Math.min(1, Math.max(0, (pos[p + 1] + dz * TAN_LEE - water - 0.3) / 6)); aF[q + 3] = 1;
      } else {
        const dz = info.dz, m = info.h, s = wl[v] ? (m > 0.05 && dz >= 0 && !info.beach ? 1 : 0) : cls[v];
        normalAt(x, z, pos[p + 1], nor, p); nrs[p] = nor[p]; nrs[p + 1] = nor[p + 1]; nrs[p + 2] = nor[p + 2];
        const run = s ? dz + m / TAN_LEE : 1;
        aF[q] = s ? Math.min(1, dz / Math.max(run, 1e-3)) : 0; aF[q + 1] = m > 0.05 ? Math.min(20, Math.abs(dz)) : 20; aF[q + 2] = Math.min(1, Math.max(0, (pos[p + 1] + (s ? Math.max(dz, 0) * TAN_LEE : 0) - water - 0.3) / 6)); aF[q + 3] = s;
      }
    }
    if ((k & 3) === 3) await ctx.yield?.();
  }
  await ctx.yield?.();
  const idx = new Uint32Array((nx - 1) * (nz - 1) * 6); let n = 0;
  for (let k = 0; k < nz - 1; k++) {
    for (let i = 0; i < nx - 1; i++) {
      const a = k * nx + i, b = a + 1, c = a + nx, d = c + 1; let ad;
      // across a shore: never a diagonal from a dry corner to a deep one (its two neighbours lie on the waterline)
      const dA = hv[a] > water + 0.02, dB = hv[b] > water + 0.02, dC = hv[c] > water + 0.02, dD = hv[d] > water + 0.02;
      if ((dA && hv[d] < water - 0.02) || (dD && hv[a] < water - 0.02)) ad = false;
      else if ((dB && hv[c] < water - 0.02) || (dC && hv[b] < water - 0.02)) ad = true;
      else if (snap[a] | snap[b] | snap[c] | snap[d] || cls[a] + cls[b] + cls[c] + cls[d] !== 4 * cls[a]) {
        // near an outline: the diagonal whose midpoint lies closer to the true sand
        const eAD = Math.abs((pos[a * 3 + 1] + pos[d * 3 + 1]) / 2 - hA((pos[a * 3] + pos[d * 3]) / 2, (pos[a * 3 + 2] + pos[d * 3 + 2]) / 2));
        const eBC = Math.abs((pos[b * 3 + 1] + pos[c * 3 + 1]) / 2 - hA((pos[b * 3] + pos[c * 3]) / 2, (pos[b * 3 + 2] + pos[c * 3 + 2]) / 2));
        ad = eAD <= eBC;
      } else ad = Math.abs(pos[a * 3 + 1] - pos[d * 3 + 1]) <= Math.abs(pos[b * 3 + 1] - pos[c * 3 + 1]);
      if (ad) { idx[n++] = a; idx[n++] = c; idx[n++] = d; idx[n++] = a; idx[n++] = d; idx[n++] = b; }
      else { idx[n++] = a; idx[n++] = c; idx[n++] = b; idx[n++] = b; idx[n++] = c; idx[n++] = d; }
    }
    if ((k & 7) === 7) await ctx.yield?.();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setAttribute('aNs', new THREE.BufferAttribute(nrs, 3)); g.setAttribute('aF', new THREE.BufferAttribute(aF, 4));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  g.boundingSphere = new THREE.Sphere(new V3(0, 10, (Z0 + Z1) / 2), 1160); g.boundingBox = new THREE.Box3(new V3(X0, -4, Z0), new V3(X1, 50, Z1));
  return g;
}

// The safe camera line down the middle (x = 0): every 3 m, lifted and smoothed, then thinned to ~15 m.
function buildFlyLine(field, water, zCrest) {
  const n = Math.round((Z_START - Z_PORTAL) / 3) + 1, y = new Float32Array(n), lo = new Float32Array(n), ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const S = (z) => { const h = field.heightAt(routeX(z), z); return h > water ? h + 2.5 : water + 0.5; };
  for (let i = 0; i < n; i++) {
    const z = Z_START - i * 3; let m = S(z);
    for (let d = -4.5; d <= 4.5; d += 1.5) m = Math.max(m, S(z + d));
    lo[i] = m; y[i] = m + 7.5 * ss(zCrest + 34, zCrest - 4, z) * ss(-205, -70, z);
    if (z < -255) { const k = ss(-255, -285, z); y[i] = y[i] * (1 - k) + (water + 2.5) * k; lo[i] = Math.min(lo[i], y[i]); }
  }
  const t = new Float32Array(n);
  for (let pass = 0; pass < 10; pass++) {
    for (let i = 0; i < n; i++) t[i] = 0.25 * y[Math.max(0, i - 1)] + 0.5 * y[i] + 0.25 * y[Math.min(n - 1, i + 1)];
    for (let i = 0; i < n; i++) y[i] = Math.max(t[i], lo[i]);
  }
  const pts = [];
  for (let i = 0; i < n; i += 5) pts.push(new V3(routeX(Z_START - i * 3), y[i], Z_START - i * 3));
  const last = pts[pts.length - 1]; if (last.z > Z_PORTAL + 0.5) pts.push(new V3(0, water + 2.5, Z_PORTAL)); else last.set(0, water + 2.5, Z_PORTAL);
  return pts;
}

// ---------------------------------------------------------------------------------------------------------
// GLSL. Everything is computed in HERO-LOCAL space (uCamL = camera in local space), so the piece can be
// rotated/translated by the world. All pow/normalize/divide arguments are guarded (Direct3D-safe).
// ---------------------------------------------------------------------------------------------------------
const GLSL_NOISE = /* glsl */`
float h21(vec2 p){ vec3 p3=fract(vec3(p.xyx)*.1031); p3+=dot(p3,p3.yzx+33.33); return fract((p3.x+p3.y)*p3.z); }
float vn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(h21(i),h21(i+vec2(1.,0.)),f.x), mix(h21(i+vec2(0.,1.)),h21(i+vec2(1.,1.)),f.x), f.y); }
float fbm3(vec2 p){ return vn(p)*.5+vn(p*2.03+17.)*.3+vn(p*4.1+41.)*.2; }
`;
// The far land beyond the gate is laid in a shallow bowl (it rises with distance, up to a 4.3 degree slope), so
// from the tall crest the hollows behind each low dune stay in sight to the haze instead of hiding edge-on.
// Zero everywhere the path goes (within 480 m of the origin, and everywhere upwind of z = 150).
export const GLSL_BOWL = /* glsl */`
uniform float uBowl;
float bowlY(vec2 xz){
  float t=max(length(xz)-480.,0.), w=1.-smoothstep(-350.,150.,xz.y);
  float r=t<900.?t*t*4.1667e-5:33.75+0.075*(t-900.);
  return r*w*uBowl;
}`;
// The clearing squall (hour 'squall') stands at one place in the world: a cloud bank whose rain falls on the dunes under
// it. SQUALL is the middle of that ground (hero-local x, z) and sqK(xz) how much of the shower a point takes, 0..1: an
// oblong 1 km long lying across the line of sight from the flight line, ragged at the edge. uSq = (x, z, strength, -).
// Needs vn() declared before it.
export const SQUALL = { x: 760, z: -820 };
export const GLSL_SQUALL = /* glsl */`
uniform vec4 uSq;
float sqK(vec2 xz){
  vec2 d=xz-uSq.xy; float al=dot(d,vec2(0.7071,0.7071)), ac=dot(d,vec2(0.7071,-0.7071));
  float r=length(vec2(al/540.,ac/290.))+0.3*(vn(xz*0.0045+3.)-.5)+0.12*(vn(xz*0.021)-.5);
  return (1.-smoothstep(0.45,1.05,r))*uSq.z;
}`;
const SHEET_VERT = /* glsl */`
uniform float uWater;
${GLSL_BOWL}
attribute vec3 aNs; attribute vec4 aF;
varying vec3 vL; varying vec3 vN; varying vec3 vNs; varying float vH; varying vec4 vF;
#include <fog_pars_vertex>
void main(){
  vH=position.y; vN=normal; vNs=aNs; vF=aF;
  vec3 p=position; p.y=max(p.y,uWater)+bowlY(p.xz); vL=p;
  vec4 mvPosition=modelViewMatrix*vec4(p,1.);
  gl_Position=projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const SHEET_FRAG = /* glsl */`
uniform sampler2D uMap; uniform vec4 uRect; uniform vec4 uBounds;
uniform vec3 uCamL,uSun,uSunCol,uFill,uSand,uMint,uTurq,uTeal,uZen,uHor;
uniform float uTime,uWater,uCloud,uEdgeFade,uWet,uPlume,uGlit,uRoad; uniform vec4 uNight,uGrove;
varying vec3 vL; varying vec3 vN; varying vec3 vNs; varying float vH; varying vec4 vF;
#include <fog_pars_fragment>
${GLSL_NOISE}
${GLSL_SQUALL}
vec2 muv(vec2 xz){ return (xz-uRect.xy)*uRect.zw; }
#define BK(k,dx,dy) (1.-smoothstep(1.1,2.7,(k)*((dx)*fwx+(dy)*fwz)))
#define BKS(k,dx,dy) (1.-smoothstep(1.7,3.6,(k)*((dx)*fwx+(dy)*fwz)))
const vec2 KR=vec2(0.5,0.866);             // ripple wave vector: oblique to the wind and square to the low sun, which rakes every band
void main(){
  vec3 Vv=uCamL-vL; float dist=length(Vv); vec3 V=Vv/max(dist,1e-3);
  vec2 xz=vL.xz;
  float fwx=fwidth(xz.x), fwz=fwidth(xz.y), fwh=fwidth(vH);          // a pixel's footprint on the ground: ripple bands fade before they alias
  // the triangle's own slope: slip faces are told by it, so brink and foot are exactly the mesh edges laid along them
  vec3 Pg=vec3(xz.x,vH,xz.y); vec3 Ng=cross(dFdx(Pg),dFdy(Pg)); float ngl=length(Ng);
  Ng=ngl>1e-12?Ng/ngl:vec3(0.,1.,0.); if(Ng.y<0.) Ng=-Ng;
  // ... and by which side of the outline the triangle lies on: aF.w is 1 at all three corners only inside a slip face,
  // so a triangle of the windward back that touches the brink (as steep as 26 degrees on the tall dune's shoulder)
  // is never taken for one; the test widens to a pixel and a half, which antialiases the brink
  float inW=smoothstep(1.-clamp(1.6*fwidth(vF.w),0.012,0.5),0.9995,vF.w);
  // a horn tip's face is lower than a mesh cell is wide: there the blue fades out and the tip is plain pale sand
  float slip0=(1.-smoothstep(0.862,0.895,Ng.y))*inW;
  float slip=slip0*smoothstep(0.55,1.0,vF.z);
  vec3 N=normalize(mix(vN,vNs,slip)+vec3(0.,1e-4,0.));
  vec4 mp=texture2D(uMap,muv(xz));
  float cl=fbm3(vec2(xz.x*0.0052+xz.y*0.0016,xz.y*0.0058-uTime*0.052));
  float cs=1.-uCloud*smoothstep(.60,.72,cl);
  // under the squall the rain takes most of the sun: the dunes there stand in a soft blue shade, and are wet
  float sq=sqK(xz);
  cs*=1.-0.62*sq;
  float sh=clamp(mp.g,0.,1.)*cs;
  float wob=vn(xz*0.11)*5.+vn(xz*0.9)*1.3;
  float bslope=length(vN.xz)/max(vN.y,0.2);                 // the bed's slope: on a flat flooded floor the lapping would draw rings, so it only laps where the bed shelves
  float depth=uWater-vH+0.035*sin(uTime*1.2+vn(xz*0.15)*12.)*smoothstep(0.012,0.05,bslope);
  float f1=(1.-smoothstep(20.,140.,dist));
  float gentle=smoothstep(0.66,0.80,N.y)*(1.-slip0)*smoothstep(0.68,0.80,Ng.y);
  float kp=dot(xz,KR);
  // MEGARIPPLES: sinuous ridges some seven metres apart, square to the low sun. Each has a sharp crest, a short lee flank
  // that stands in its own blue shadow, and a trough where the damp flats hold a film of water. They carry to a few hundred
  // metres and melt away before they can alias.
  float pm=kp*0.92+wob*0.5+2.6*vn(xz*0.013+5.), ms=fract(pm*0.15915);
  float fwM=(0.92*(0.5*fwx+0.866*fwz)+0.05*(fwx+fwz))*0.15915;
  float mAA=(1.-smoothstep(0.2,0.5,fwM))*(1.-smoothstep(280.,720.,dist)), mk=mAA*gentle;
  float me=max(0.03,1.6*fwM);
  float mlee=smoothstep(0.,me,ms)*(1.-smoothstep(0.16,0.42,ms));
  float mtr=smoothstep(0.10,0.30,ms)*(1.-smoothstep(0.44,0.66,ms));
  // between the megaripples a second, finer train (some three metres apart, wandering on its own): on a sunlit back the
  // seven-metre bands alone leave broad blank white between them; with these the whole back is raked. It melts away
  // before it can alias and is gone by 330 m.
  float pf2=kp*2.17+wob*0.9+1.7*vn(xz*0.021+9.), fs2=fract(pf2*0.15915);
  float fwF=2.17*(0.5*fwx+0.866*fwz)*0.15915;
  float fAA=(1.-smoothstep(0.16,0.42,fwF))*(1.-smoothstep(120.,330.,dist));
  float flee=smoothstep(0.,max(0.04,1.6*fwF),fs2)*(1.-smoothstep(0.20,0.50,fs2))*fAA*gentle*(1.-0.7*mlee*mk);
  float pud=vn(xz*0.047+11.)*0.62+vn(xz*0.15+3.)*0.38;
  // THE WATER'S EDGE. Where the bed shelves, the water ends at a line (foam, lapping). On the flat interdune floors it has
  // no edge: the sand runs from damp, to a film standing in every megaripple trough, to a sheet that mirrors the sky, to
  // shallows; there the two shadings are blended across the first hand's depth of water.
  float shoreK=smoothstep(0.012,0.045,bslope);
  // (seen from more than a hundred metres every pool has a clear shoreline: no feathering, no film, a dark wet rim)
  float farK=smoothstep(55.,170.,dist);
  float wk=smoothstep(0.,mix(mix(0.24,0.02,shoreK),0.025,farK),depth+(1.-shoreK)*(1.-farK)*(0.08*(mtr*mk-0.3)+0.07*(pud-.5)));
  // glitter on standing films and sheets: thin bright dashes lying along the ripples (never blobs), band-limited
  float kq=dot(xz,vec2(-0.866,0.5));
  float gstr=smoothstep(0.84,0.98,cos(kp*9.+2.2*vn(xz*0.7+uTime*vec2(0.3,0.2))))*BKS(9.,0.5,0.866)*smoothstep(0.42,0.6,vn(vec2(kq*0.7+uTime*0.6,kp*1.1+3.)));
  vec3 col=vec3(0.), colS=vec3(0.), colW=vec3(0.);
  if(wk<0.999){
    // ------------------------------ SAND ------------------------------
    float f2=(1.-smoothstep(2.5,10.,dist));
    float p1=kp*3.1+wob, p2=kp*50.+wob*7., p0=kp*0.5+vn(xz*0.02)*3.;
    float hi=smoothstep(0.5,0.8,uSun.y);                 // a high sun: softer knee, stronger ripples, deeper blue troughs
    float n1=(cos(p1)+0.35*cos(2.*p1+1.))*f1*BKS(3.1,0.5,0.866);
    float rm=n1*0.17*(1.+0.9*hi)*gentle+(mlee-0.27)*0.22*(1.+0.6*hi)*mk*(1.-0.6*uRoad)+(flee-0.2)*0.09*(1.-uRoad);
    float ro=cos(p2)*0.3*f2*gentle*BKS(50.,0.5,0.866) + (cos(p0)*0.07+(vn(xz*0.045+3.)-.5)*0.15)*(1.+0.5*hi)*gentle*(1.-smoothstep(150.,900.,dist));
    float r=rm+ro;
    // grainflow on the slip faces: narrow avalanche tongues, each a low rounded ridge with a soft toe, sliding
    // down over fine contour ripples; the raking light picks out one flank of every tongue. Close range only.
    float ax=abs(N.x), az=abs(N.z);
    float lat=mix(xz.y,xz.x,step(ax,az)); vec2 acv=mix(vec2(0.,1.),vec2(1.,0.),step(ax,az));
    float seam=smoothstep(0.,0.3,abs(az-ax)/max(az+ax,1e-3));
    float tnear=(1.-smoothstep(22.,70.,dist))*slip*seam;
    float cxw=lat/1.35+0.55*vn(vec2(vH*0.16,lat*0.11));
    float ci=floor(cxw), fx=fract(cxw)-.5, hs=h21(vec2(ci,7.3));
    float ph=vH*0.11+uTime*(0.07+0.06*hs)+hs*9.+0.10*(1.-4.*fx*fx);
    float fp=fract(ph), len=0.24+0.3*h21(vec2(ci,floor(ph)+3.));
    float wm=(1.-smoothstep(0.30,0.5,abs(fx)*(1.+1.3*fp/len)))*step(0.68,hs)*tnear;
    float body=wm*smoothstep(0.,0.045,fp)*(1.-smoothstep(len*0.5,len,fp));
    float front=wm*smoothstep(0.,0.02,fp)*(1.-smoothstep(0.02,0.09,fp));
    float tf=vn(vec2(lat*2.6,vH*0.7+uTime*1.7));
    float crip=cos(vH*34.+vn(xz*0.7)*5.)*(1.-smoothstep(3.,14.,dist))*slip;
    // broad chutes down the fall line, seen from hundreds of metres: old avalanche lanes, some paler, some darker,
    // each with a soft shoulder that the sky's glow picks out; they wander a little and narrow toward the foot
    float chw=lat*0.06+0.8*vn(vec2(lat*0.02,5.))+0.3*vn(vec2(lat*0.3,vF.x*2.+3.))*vF.x;
    float chA=vn(vec2(chw,1.3+vF.x*1.7)), chB=vn(vec2(chw*2.1+17.,vF.x*3.1));        // lanes that start and die out down the face
    float chK=slip*(1.-smoothstep(420.,800.,dist))*(1.-smoothstep(1.2,3.0,0.08*max(fwx,fwz)))*(0.25+0.75*smoothstep(25.,90.,dist));
    float faceSun=smoothstep(-0.03,0.30,dot(N,uSun))*(1.-uRoad);                         // how much of the low sun this face takes
    float chute=((smoothstep(0.28,0.72,chA)-.5)*1.15+(chB-.5)*0.4)*chK*smoothstep(0.,0.10,vF.x)*(1.-0.6*faceSun);
    // a second, coarser train of avalanche tongues that carries to a few hundred metres: pale lobes with a dark flank
    float tfar=(1.-smoothstep(170.,320.,dist))*smoothstep(14.,40.,dist)*slip*seam;
    float cx2=lat/4.4+0.6*vn(vec2(vH*0.07,lat*0.05)), ci2=floor(cx2), fx2=fract(cx2)-.5, hs2=h21(vec2(ci2,3.7));
    float ph2=vH*0.05+uTime*(0.022+0.02*hs2)+hs2*9., fp2=fract(ph2), len2=0.3+0.35*h21(vec2(ci2,floor(ph2)+5.));
    float body2=(1.-smoothstep(0.26,0.5,abs(fx2)*(1.+1.2*fp2/len2)))*step(0.5,hs2)*tfar*(1.-0.7*faceSun)*smoothstep(0.,0.05,fp2)*(1.-smoothstep(len2*0.5,len2,fp2));
    // sand, not a painted plane: wind ripples lie across every face, a fine set and a broader one, each fading before
    // it aliases; at a distance the broader bands read as strata
    float frip=cos(vH*10.5+vn(xz*0.35)*3.+1.5*vn(vec2(lat*0.12,vH*0.3)))*(1.-smoothstep(1.1,2.8,10.5*fwh))*(1.-smoothstep(70.,160.,dist))
              +0.8*cos(vH*3.3+vn(xz*0.12)*4.)*(1.-smoothstep(1.1,2.8,3.3*fwh))*(1.-smoothstep(mix(160.,50.,uRoad),mix(420.,130.,uRoad),dist));
    float cband=frip*slip*(1.-0.95*uRoad);
    float chS=(vn(vec2(chw+0.11,1.3+vF.x*1.7))-chA)*chK;                                   // the lane's cross slope
    vec2 tn=acv*(sin(6.2832*fx)*body*0.15+(tf-.5)*0.10*body+chS*1.5+sin(6.2832*fx2)*body2*0.22)+vec2(N.x,N.z)*(front*0.3+crip*0.12+cband*0.3);
    vec3 Nn=normalize(N+vec3(KR.x*r+0.1*(vn(xz*0.6)-.5)*f1+tn.x,0.,KR.y*r+tn.y));
    float ndl=max(dot(Nn,uSun),0.);
    // slip faces stand in their own shade: none of the grazing sun, half of a high one, so each is a bluer plane
    // (not under the moon, which stands high ahead of us and silvers them)
    // the low sun is true to each face: the half of a crescent that turns from it stands in blue shade, the middle takes
    // a raking light that picks out every chute, the far horn is lit; a high sun gives every face a softened light
    float slipSh=mix(1.-slip*(1.-smoothstep(-0.03,0.30,dot(N,uSun))*mix(0.66,0.5,hi)),1.,uRoad);
    body*=1.-0.6*faceSun; front*=1.-0.6*faceSun;
    float sunT=(1.-exp(-ndl*mix(5.4,2.0,hi)))*sh*slipSh, shade=1.-sunT;
    vec3 alb=uSand*(0.93+0.07*vn(xz*0.035)+0.05*(vn(xz*1.7)-.5)*f1)*mix(0.94,1.,smoothstep(0.2,3.5,-depth))*(1.+0.05*slip);
    // THE INTERDUNE FLATS lie within half a metre of the water table: damp sand a shade darker and bluer (never grey),
    // and wherever it dips, in every ripple trough near us and in broad sheets further off, a thin film of standing
    // water that mirrors the sky; the ripple crests stand out of it dry, white and sunlit
    float damp=(1.-smoothstep(0.05,0.62,-depth))*uWet*gentle;
    // how wet: the troughs fill first (megaripple troughs, and near us the hollows of the wind ripples), so every patch of
    // film has a feathered edge that follows the ripples
    float trf=max(mtr*mk,0.7*smoothstep(0.2,0.9,sin(p1))*f1*BKS(3.1,0.5,0.866)*gentle);
    float film=smoothstep(-0.10,0.28,damp*0.62+(pud-.5)*0.9+(trf-0.35)*0.55-0.36)*smoothstep(0.,0.08,damp)*(1.-farK);
    alb*=mix(vec3(1.),vec3(0.90,0.915,0.94),damp*(1.-film));
    // the wet rim: the hand's breadth of sand above every waterline is soaked, a clear shade darker and bluer
    // (a band a few metres wide in plan, whatever the slope: the flats themselves stay bright)
    float rimD=max(-depth,0.)/max(bslope,0.006), rimWd=2.2+0.022*dist;
    float rimWet=(1.-smoothstep(0.35*rimWd,rimWd,rimD))*uWet;
    alb*=mix(vec3(1.),vec3(0.62,0.74,0.90),rimWet*mix(0.35,0.92,farK));
    float wetK=max(film,0.22*damp);
    alb*=(1.+0.05*body*(0.5+tf)+0.03*crip+0.055*cband+0.2*body2-0.1*body2*smoothstep(0.1,0.45,abs(fx2)))*clamp(1.+chute*0.42,0.72,1.3);
    // the bright sky round the sun rakes every shaded surface too: relief shows where the sun does not reach, each
    // megaripple with a lighter and a darker flank
    vec3 L2=normalize(vec3(uSun.x,0.3,uSun.z)+vec3(1e-4,0.,0.));
    alb*=clamp(1.+1.15*dot(Nn-N,L2)*mix(0.42*shade,1.,slip),0.80,1.30);
    // saltation streamers snaking downwind over the backs: sinuous lines of blown sand in lanes some 7 m apart, each
    // meandering and running in gusts, a soft veil torn into wisps, with its blue shadow half a metre to leeward of the sun
    float lu=xz.x*0.143+0.9*vn(vec2(xz.y*0.02-uTime*0.4,3.7))+0.3*sin(xz.y*0.21-uTime*2.6+vn(xz*0.03)*9.);
    float li=floor(lu), lf=fract(lu)-.5;
    float sgate=step(0.26,h21(vec2(li,9.1)))*smoothstep(0.38,0.62,vn(vec2(li*7.3,xz.y*0.04-uTime*0.6)));
    float swd=0.075+0.09*fwx;                                 // a soft veil 0.7 m wide, torn into wisps along its length
    float strK=gentle*(1.-smoothstep(-1.5,-0.3,depth))*smoothstep(10.,34.,dist)*(1.-smoothstep(80.,380.,dist))*(1.-smoothstep(0.12,0.24,swd))*min(uPlume,1.5)*sgate;
    float wisp=smoothstep(0.15,0.8,vn(vec2(li*3.1+lf*26.,xz.y*0.22-uTime*5.)));
    float stream=exp(-lf*lf/(swd*swd))*wisp*strK;
    float strSh=exp(-(lf-0.09)*(lf-0.09)/(swd*swd*1.6))*(0.2+0.8*wisp)*strK*(1.-stream)*(1.-uRoad);
    // every shadow, unlit face and trough is filled by the sky: clear blue, never slate. Down a slip face the tone
    // runs from deepest just under the brink to pale at the foot, where the lagoon throws a little mint back up
    float tone=mix(1.,mix(0.86,1.2,smoothstep(0.,0.9,vF.x)),slip);
    vec3 amb=uFill*mix(0.26,0.96,shade)*(0.7+0.3*Nn.y)*mix(vec3(1.),vec3(0.97,1.06,1.24),shade*(1.-0.42*slip*(1.-uRoad)))*tone;       // a shaded face is paler and greyer than a cast shadow: sand lit by the whole sky
    amb*=mix(vec3(1.),mix(vec3(0.80,0.92,1.10),vec3(0.98,1.02,1.0),vF.x),slip*shade*(1.-uRoad));       // cobalt under the brink, paler toward the foot
    amb+=uMint*uFill.g*0.34*slip*vF.x*vF.x*(1.-smoothstep(0.5,9.,vH-uWater))*(1.-uRoad);
    // (the sun's share is held where the brightest back sits a little under white: what the tone curve leaves above it
    // goes to the ripples' sunward flanks and the brink rims)
    col=alb*(amb+uSunCol*sunT*mix(0.84,0.94,uRoad));
    // every ripple trough is filled by the sky: on sunlit sand that is what shows the relief (a white this bright
    // flattens anything subtler), in shade the raking sky-glow already does
    // (a back that faces the sun squarely takes no shading from a ripple at all: there the megaripple troughs are filled
    // harder, a white crest and a sky-blue trough to every band, so the windward backs are raked sand, never a blank white)
    vec3 trough=mix(vec3(0.40,0.55,0.93),vec3(0.52,0.66,0.95),hi);
    float leeK=max(max(mlee*mk,0.62*flee*smoothstep(0.25,0.7,sunT)),0.8*smoothstep(0.15,0.8,n1)*gentle);
    col*=mix(vec3(1.),mix(vec3(0.80,0.88,1.0),trough,sunT),leeK*mix(0.5,1.,sunT)*(1.-film)*(1.-0.8*uRoad));
    // ... and the sunward flank of every ripple takes the low sun a little harder than the flat
    col*=1.+0.12*clamp(-r*5.,0.,1.)*sunT*gentle*(1.-uRoad);
    // A SLIP FACE THAT TAKES THE SUN (the far horn of every crescent) would be one blank white plane: the wind ripples
    // that lie across it show as bands with a sky-blue trough each, and its chutes as paler and bluer lanes
    float faceLit=slip*faceSun*(1.-uRoad);
    col*=mix(vec3(1.),mix(vec3(0.80,0.88,1.0),trough,sunT),faceLit*(0.75*smoothstep(0.,1.,frip)+0.3*smoothstep(0.02,0.3,-chute)));
    // the brink catches the sun: a white rim along every crest, never thinner than a couple of pixels
    float rimW=max(0.8,dist*0.012);
    float rimK=(1.-smoothstep(rimW*0.3,rimW,vF.y))*clamp(vF.z,0.,1.)*smoothstep(0.02,0.2,uSun.y)*cs*(0.45+0.55*clamp(mp.g*1.6,0.,1.));
    col=mix(col,uSand*(uSunCol*0.95+uFill*0.24),min(rimK*1.05,1.));
    if(wetK>0.001){
      vec3 Rf=reflect(-V,normalize(vec3(Nn.x-N.x,4.,Nn.z-N.z))); Rf.y=abs(Rf.y)+0.02;
      vec3 skyF=mix(uHor,uZen,uNight.y+(1.-uNight.y)*pow(clamp(Rf.y,0.,1.),0.4))*1.2+vec3(0.05)*(1.-uRoad);
      float frF=mix(0.24,0.46,film)+mix(0.76,0.54,film)*pow(1.-clamp(V.y,0.,1.),3.);
      vec3 wetc=mix(col*vec3(0.66,0.82,0.93),skyF*(0.8+0.2*sh),frF);
      vec2 slF=uSun.xz/max(length(uSun.xz),1e-4); float towF=max(dot(-V.xz/max(length(V.xz),1e-4),slF),0.);
      float tkF=vn(xz*3.3+uTime*vec2(.9,2.3))*vn(xz*5.6-uTime*vec2(1.7,.6)+5.);
      wetc+=uSunCol*smoothstep(.5,.6,tkF)*towF*towF*smoothstep(9.,22.,dist)*(1.-smoothstep(22.,70.,dist))*sh*1.6*uGlit;
      // glitter streaks lying along the ripples, wherever the film stands
      wetc+=uSunCol*gstr*(0.25+0.75*towF*towF)*(1.-smoothstep(30.,110.,dist))*sh*0.9*min(uGlit,1.7)*max(film,0.3*wetK);
      col=mix(col,wetc,wetK);
    }
    col*=mix(vec3(1.),vec3(0.58,0.72,0.97),strSh*0.8*sh);
    col=mix(col,uSand*(uFill*0.35+uSunCol*0.9*sh),stream*0.85);
    col+=uSand*(uFill*0.09+uSunCol*0.10*max(sh,0.3))*front;                              // the pale toe of each tongue
    // sparkle of quartz grains
    float sp=step(0.9935,h21(floor(xz*30.)))*(1.-smoothstep(4.,26.,dist));
    float rv=max(dot(reflect(-uSun,Nn),V),0.);
    col+=uSunCol*sp*sh*slipSh*(0.6+3.4*rv*rv);
    colS=col;
  }
  if(wk>0.001){
    // ------------------------------ WATER ------------------------------
    float d=max(depth,0.);
    float bedR=0.5+0.5*cos(dot(xz,KR)*3.1+wob);
    float ca=vn(xz*0.9+vec2(uTime*0.35,uTime*0.21)), cb=vn(xz*1.18-vec2(uTime*0.28,-uTime*0.17)+7.);
    float caus=1.-smoothstep(0.,0.10,abs(ca-cb));
    float alg=smoothstep(.50,.70,fbm3(vec2(xz.x*0.052+xz.y*0.031,xz.y*0.052-xz.x*0.031)+11.))*smoothstep(.3,1.3,d);
    float nearW=1.-smoothstep(2.,7.,dist);                                              // straight down under the bill
    // at arm's length the metre-wide light net and the 2 m bed ripples are bigger than the frame: there a fine net
    // (cells of 6 to 20 cm) and hand-wide bed ripples take over, each fading before it aliases
    float nearL=1.-smoothstep(2.5,9.,dist), nearM=1.-smoothstep(3.5,13.,dist), fwm=max(fwx,fwz);
    float ca2=vn(xz*13.+vec2(uTime*1.3,uTime*0.8)), cb2=vn(xz*16.7-vec2(uTime*1.0,-uTime*0.65)+3.);
    float ca3=vn(xz*5.3+vec2(uTime*0.8,uTime*0.45)+9.), cb3=vn(xz*6.8-vec2(uTime*0.6,-uTime*0.4)+5.);
    float causN=(1.-smoothstep(0.,0.13,abs(ca2-cb2)))*(1.-smoothstep(0.7,1.9,13.*fwm))*nearL;
    float causM=(1.-smoothstep(0.,0.11,abs(ca3-cb3)))*(1.-smoothstep(0.7,1.9,5.3*fwm))*nearM;
    caus=caus*(1.-0.8*nearM)+max(causN,0.8*causM);
    float bedF=cos(dot(xz,KR)*23.+wob*4.+2.*vn(xz*1.7))*BKS(23.,0.5,0.866)*nearM;
    vec3 bed=uSand*(0.60+0.20*bedR*f1*(1.-0.6*nearM)+0.085*bedF)*(1.-0.5*alg);
    bed*=1.+caus*0.55*(1.-smoothstep(12.,110.,dist))*exp(-d*mix(0.7,0.22,nearW));
    float dr=d*mix(1.,1.8,farK);                          // far pools: mint rim, turquoise, teal heart, each band wide enough to see
    vec3 wc=mix(uMint,uTurq,smoothstep(0.1,0.95,dr)); wc=mix(wc,uTeal,smoothstep(0.8,2.5,dr));
    wc=mix(wc,wc*vec3(0.70,1.10,0.76)+vec3(0.,0.015,0.),smoothstep(0.40,0.66,vn(xz*0.0045+7.3))*0.85*(1.-uRoad));       // some pools run to emerald
    // the oasis pool under the buriti palms: deep, shaded, stained dark teal
    float gk=1.-smoothstep(0.5,1.12,length((xz-uGrove.xy)*uGrove.zw)+0.12*(vn(xz*0.07)-.5));
    wc=mix(wc,uTeal*vec3(0.46,0.60,0.62),gk*smoothstep(0.2,1.3,d)*0.85);
    vec3 body=mix(bed*uMint*1.7,wc*(1.-0.25*alg),1.-exp(-d*mix(0.8,mix(1.6,3.4,farK),smoothstep(2.5,22.,dist))*(1.-0.5*nearW)*(1.+2.5*gk)));      // at arm's length the bed shows through
    body*=mix(vec3(0.44,0.57,0.76),vec3(1.04),sh);                                     // under a dune's shadow: a darker, bluer teal
    // wind ripples and cat's-paws running downwind (+Z)
    float cat=smoothstep(.45,.75,vn(vec2(xz.x*0.035+3.,xz.y*0.02-uTime*0.11)));
    float amp=(0.03+0.075*cat)/(1.+dist*0.01);
    vec2 g=vec2(0.); float q;
    q=dot(xz,vec2(0.29,0.96))*4.1-uTime*3.1+wob;       g+=vec2(0.29,0.96)*cos(q)*BK(4.1,0.29,0.96); float q1=q;
    q=dot(xz,vec2(-0.6,0.8))*7.3-uTime*4.2+wob*1.7;    g+=vec2(-0.6,0.8)*cos(q)*0.7*BK(7.3,0.6,0.8);
    q=dot(xz,vec2(0.87,0.5))*13.+uTime*5.0+wob*2.3;    g+=vec2(0.87,0.5)*cos(q)*0.5*BK(13.,0.87,0.5);
    q=dot(xz,vec2(-0.2,0.98))*1.3-uTime*1.6+wob*0.5;   g+=vec2(-0.2,0.98)*cos(q)*0.8*BK(1.3,0.2,0.98); float q4=q;
    q=dot(xz,vec2(0.12,0.99))*0.42-uTime*0.9+wob*0.3;  g+=vec2(0.12,0.99)*cos(q)*0.55*BK(0.42,0.12,0.99);   // a long slow band that survives at range
    // capillary ripples: at arm's length under the bill the metre-long waves are bigger than the frame (there they are
    // eased off: the noise that breaks them up reads as blurred blotches), and these crisp hand-wide lines are what shows
    float wobc=vn(xz*0.11)*5.+vn(xz*0.43)*2.2, nearC=1.-smoothstep(1.2,7.5,dist);
    vec2 gc=vec2(0.); float qc;
    qc=dot(xz,vec2(0.5,0.866))*37.-uTime*9.+wobc*3.;       gc+=vec2(0.5,0.866)*cos(qc)*0.5*BK(37.,0.5,0.866);
    qc=dot(xz,vec2(-0.37,0.93))*59.+uTime*12.+wobc*4.3;    gc+=vec2(-0.37,0.93)*cos(qc)*0.38*BK(59.,0.37,0.93);
    qc=dot(xz,vec2(0.1,0.995))*21.-uTime*7.+wobc*2.1;      gc+=vec2(0.1,0.995)*cos(qc)*0.62*BK(21.,0.1,0.995);
    vec2 gsl=g*amp*(1.-0.78*nearL)+gc*(amp+0.075*nearC);
    vec3 n=normalize(vec3(-gsl.x,1.,-gsl.y));
    vec3 R=reflect(-V,n); R.y=abs(R.y)+0.015;
    float rl=max(length(R.xz),1e-4); vec2 rd=R.xz/rl; float tanR=R.y/rl;
    vec3 sky=mix(uHor,uZen,uNight.y+(1.-uNight.y)*pow(clamp(R.y,0.,1.),0.4));
    // mirror of the dunes: march the height map along the reflected ray
    float hit=0., hsh=1., ht=0., t=3.;
    for(int i=0;i<10;i++){
      vec4 m=textureLod(uMap,muv(xz+rd*t),0.);
      float c=smoothstep(-0.015,0.015,(m.r-uWater)/t-tanR)*(1.-hit);
      hsh=mix(hsh,m.g,c); ht=mix(ht,t,c); hit+=c; t*=1.6;
    }
    vec3 mcol=uSand*(uFill*0.42+uSunCol*0.8*clamp(hsh,0.,1.)*cs);
    mcol=mix(mcol,uHor,1.-exp(-ht*0.0014));
    vec3 refl=mix(sky,mcol,clamp(hit,0.,1.));
    float sheetK=(1.-shoreK)*(1.-smoothstep(0.1,0.42,d))*(1.-farK);
    refl=mix(refl,mix(uHor,uZen,0.78)*1.05,0.6*sheetK*(1.-clamp(hit,0.,1.))*(1.-uRoad));
    float fr=uNight.x+(1.-uNight.x)*pow(1.-clamp(dot(V,n),0.,1.),5.);
    fr=max(fr,sheetK*(0.36+0.5*pow(1.-clamp(V.y,0.,1.),3.)));      // a sheet of water on a flat floor mirrors the sky
    col=mix(body,refl,fr*uNight.z*(1.-uNight.w*smoothstep(40.,350.,dist)));                 // far pools keep their colour
    col*=1.-0.10*cat*(1.-fr);
    // sun glitter: true specular plus sparse twinkles that gather on the sunward half of each pool
    vec3 Hh=normalize(V+uSun+vec3(0.,1e-3,0.));
    float spec=pow(max(dot(n,Hh),0.),420.)*2.4;
    spec*=mix(1.,0.25+2.2*smoothstep(.45,.8,vn(xz*mix(34.,9.,smoothstep(2.,30.,dist))+uTime*vec2(2.3,3.1))),1.-smoothstep(25.,60.,dist));   // the sun's own glints break into sparkle, not ovals
    vec2 sl=uSun.xz/max(length(uSun.xz),1e-4);
    float toward=dot(-V.xz/max(length(V.xz),1e-4),sl);
    col*=1.+clamp(dot(n.xz,sl)*2.4*(1.+1.6*nearW),-0.16-0.16*nearW,0.2+0.22*nearW)*(1.-smoothstep(8.,70.,dist));           // each ripple has a lit and a shaded flank
    col+=uSunCol*uMint*caus*mix(0.09,0.15,nearL)*nearW*sh;                                 // the light net just under the surface
    float gs=mix(5.,0.35,smoothstep(8.,420.,dist));
    float tk=vn(xz*gs+uTime*vec2(.9,2.3))*vn(xz*gs*1.7-uTime*vec2(1.7,.6)+5.);
    // within a few metres the twinkles are fine streaks lying along the ripple crests, never blobs
    float nearK=1.-smoothstep(6.,16.,dist), gn=mix(44.,11.,smoothstep(1.5,12.,dist));
    vec2 gq=vec2(dot(xz,vec2(0.96,-0.29))*0.55,dot(xz,vec2(0.29,0.96))*1.5)*gn;
    float tkn=vn(gq+uTime*vec2(1.3,2.9))*vn(gq*1.7-uTime*vec2(2.1,.9)+5.);
    float tkk=mix(smoothstep(.5,.6,tk),smoothstep(.46,.56,tkn)*smoothstep(0.15,0.85,0.5+0.5*cos(q1))*smoothstep(0.5,1.8,dist),nearK);
    // where a twinkle is smaller than a pixel it would be static: there the glitter becomes its own mean, a smooth
    // sheen broken only by the long ripple lines
    float sub=smoothstep(0.3,0.85,gs*1.7*max(fwx,fwz))*(1.-nearK);
    float lines=0.62+0.38*cos(q4)*BK(1.3,0.2,0.98)+0.2*cos(q)*BK(0.42,0.12,0.99);
    float tg2=smoothstep(0.05,0.95,toward); float road=smoothstep(0.93,0.998,toward); road*=road;
    float day=mix(tkk,0.045*lines,sub)*tg2*tg2*(0.3+0.7*cat);
    float night=mix(mix(smoothstep(.5-.26*road,.6-.22*road,tk),tkk,nearK),(0.07+0.3*road)*lines,sub)*road*(0.6+0.4*cat);
    float tw=mix(day,night,uRoad);
    tw=mix(tw,gstr*0.3*(0.25+0.75*tg2*tg2)*(1.-smoothstep(30.,110.,dist)),sheetK);
    col+=uSunCol*(spec+tw*3.)*uGlit*sh;
    // lapping foam line and a second, scalloped lap band: only where the bed shelves; on flooded flats the water just ends
    float shore=smoothstep(0.03,0.065,bslope)*mix(1.,0.55,uRoad);
    float foam=((1.-smoothstep(0.0,0.075,d))*0.85+(1.-smoothstep(.0,.03,abs(d-0.16-0.07*vn(xz*.8+uTime*.3))))*0.25)*shore;
    vec3 fmc=vec3(0.86,0.9,0.92)*min(vec3(1.),(uSunCol+uFill)*1.3)*(0.42+0.58*sh);
    col=mix(col,mix(fmc,max(col,fmc),uRoad),clamp(foam,0.,1.));              // (under the moon foam never dims the glitter it lies in)
    colW=col;
  }
  col=mix(colS,colW,wk);
  col*=mix(vec3(1.),vec3(0.80,0.845,0.91),sq);              // rain-wet sand, and water under the shower: a shade darker
  #ifdef USE_FOG
    // the outer 50 m dissolve into plain lit sand (the world's far rings do the same), so no seam shows
    float e=max(max(smoothstep(uBounds.y-50.,uBounds.y,abs(xz.x)),1.-smoothstep(uBounds.z,uBounds.z+50.,xz.y)),smoothstep(uBounds.w-50.,uBounds.w,xz.y));
    float sF=(1.-exp(-max(uSun.y,0.)*5.4))*cs;
    col=mix(col,uSand*0.95*(uFill*mix(0.26,0.96,1.-sF)*mix(vec3(1.),vec3(0.97,1.06,1.24),1.-sF)+uSunCol*sF*0.84)*mix(vec3(1.),vec3(0.80,0.845,0.91),sq),e*uEdgeFade);
  #endif
  gl_FragColor=vec4(col,1.);
  #include <fog_fragment>
}`;

// ---------------------------------------------------------------------------------------------------------
// Black skimmer (Rynchops niger), real size: 0.45 m long, 1.15 m span. Forward = -Z, up = +Y.
// aAnim = (wing side -1/0/1, span fraction, part: 0 body 1 wing 2 lower mandible 3 tail, chord 0..1)
// ---------------------------------------------------------------------------------------------------------
function skimmerGeometry(red) {
  const P = [], N = [], C = [], A = [], I = [];
  const BLACK = [0.022, 0.022, 0.027], WHITE = [0.84, 0.84, 0.82], GREY = [0.3, 0.31, 0.33], RED = [red.r * 1.25, red.g * 1.1, red.b * 1.1];
  const v = (x, y, z, nx, ny, nz, c, a0 = 0, a1 = 0, a2 = 0, a3 = 0) => { P.push(x, y, z); N.push(nx, ny, nz); C.push(c[0], c[1], c[2]); A.push(a0, a1, a2, a3); return P.length / 3 - 1; };
  const quad = (a, b, c, d) => I.push(a, b, c, a, c, d);
  // body: 8 rings x 8 sides, black cap and back, white forehead, cheeks and belly
  const rings = [[-0.204, 0.011, 0.008, 0.004], [-0.182, 0.027, 0.022, 0.012], [-0.145, 0.034, 0.03, 0.015], [-0.1, 0.031, 0.029, 0.007],
    [-0.04, 0.046, 0.045, 0], [0.04, 0.047, 0.046, 0.001], [0.11, 0.032, 0.031, 0.006], [0.172, 0.011, 0.014, 0.011]];
  const SIDES = 8, ringStart = [];
  rings.forEach(([z, ry, rx, y0], ri) => {
    ringStart.push(P.length / 3);
    for (let s = 0; s < SIDES; s++) {
      const a = (s / SIDES) * Math.PI * 2, cx = Math.sin(a), cy = Math.cos(a);
      const top = cy > 0.2 && !(ri <= 1) && !(ri === 2 && cy < 0.6);
      v(cx * rx, y0 + cy * ry, z, cx, cy, ri === 0 ? -0.6 : ri === 7 ? 0.6 : 0, top ? BLACK : WHITE, 0, 0, 0, 0);
    }
  });
  for (let r = 0; r < rings.length - 1; r++) for (let s = 0; s < SIDES; s++) {
    const a = ringStart[r] + s, b = ringStart[r] + (s + 1) % SIDES, c = ringStart[r + 1] + (s + 1) % SIDES, d = ringStart[r + 1] + s;
    quad(a, d, c, b);
  }
  // bill: two knife blades, red base, black tip; the lower mandible a third longer (part 2 hinges open)
  const blade = (len, yTop, yBot, part, drop) => {
    const st = [[0, 1, RED], [0.42, 0.62, RED], [0.5, 0.56, BLACK], [1, 0.12, BLACK]], idx = [];
    for (const [t, k, c] of st) {
      const z = -0.2 - len * t, w = 0.0055 * k + 0.0008, ym = (yTop + yBot) / 2 - drop * t, hh = (yTop - yBot) / 2 * k;
      idx.push([v(0, ym + hh, z, 0, 1, 0, c, 0, 0, part, 0), v(w, ym, z, 1, 0, 0, c, 0, 0, part, 0), v(0, ym - hh, z, 0, -1, 0, c, 0, 0, part, 0), v(-w, ym, z, -1, 0, 0, c, 0, 0, part, 0)]);
    }
    for (let s = 0; s < st.length - 1; s++) for (let q = 0; q < 4; q++) quad(idx[s][q], idx[s][(q + 1) % 4], idx[s + 1][(q + 1) % 4], idx[s + 1][q]);
  };
  blade(0.082, 0.02, 0.003, 0, 0.006); blade(0.112, 0.001, -0.016, 2, -0.002);
  // wings: long, narrow, pointed; 7 stations x 3 chord points, single sheet (top black, underside pale in the shader)
  const S = 0.54, st = [0, 0.16, 0.32, 0.45, 0.63, 0.8, 0.93, 1], chord = [0.118, 0.128, 0.118, 0.105, 0.084, 0.058, 0.032, 0.006];
  for (const side of [-1, 1]) {
    const rows = [];
    st.forEach((r, i) => {
      const le = -0.058 - 0.04 * Math.sin(Math.min(1, r / 0.45) * Math.PI / 2) + 0.42 * Math.pow(Math.max(0, r - 0.45), 1.7);
      const x = side * (0.034 + r * S), c = chord[i], y = 0.022;
      rows.push([v(x, y, le, 0, 1, 0, BLACK, side, r, 1, 0), v(x, y + 0.009 * (1 - r), le + c * 0.4, 0, 1, 0, BLACK, side, r, 1, 0.4), v(x, y - 0.002, le + c, 0, 1, 0, r < 0.5 ? WHITE : BLACK, side, r, 1, 1)]);
    });
    for (let i = 0; i < rows.length - 1; i++) for (let k = 0; k < 2; k++) {
      const a = rows[i][k], b = rows[i + 1][k], c = rows[i + 1][k + 1], d = rows[i][k + 1];
      if (side > 0) quad(a, d, c, b); else quad(a, b, c, d);
    }
  }
  // tail: short and forked
  const t0 = v(0, 0.014, 0.15, 0, 1, 0, BLACK, 0, 0, 3, 0), tl = v(-0.02, 0.012, 0.16, 0, 1, 0, BLACK, 0, 0, 3, 0), tr = v(0.02, 0.012, 0.16, 0, 1, 0, BLACK, 0, 0, 3, 0);
  const fl = v(-0.05, 0.012, 0.262, 0, 1, 0, WHITE, 0, 0, 3, 1), fr = v(0.05, 0.012, 0.262, 0, 1, 0, WHITE, 0, 0, 3, 1), fm = v(0, 0.012, 0.218, 0, 1, 0, GREY, 0, 0, 3, 1);
  I.push(t0, tl, fl, t0, fl, fm, t0, fm, fr, t0, fr, tr);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
  g.setAttribute('aCol', new THREE.Float32BufferAttribute(C, 3)); g.setAttribute('aAnim', new THREE.Float32BufferAttribute(A, 4));
  g.setIndex(I);
  return g;
}

// Shared by birds and wakes: where bird (aBird, aBird2) is right now. Returns centre; fills skim, pitch, scale.
// Two formations, blended per bird: the LINE (abreast on the surface, uLine) and the FLOCK (uFlock: the nearest
// pairs fly round the camera at its own height, a few metres ahead, on climbs, over the crest and in the dive).
const GLSL_BIRD = /* glsl */`
uniform sampler2D uMap; uniform vec4 uRect; uniform vec4 uBounds; uniform vec3 uCamL; uniform vec4 uLine; uniform vec4 uFlock;
uniform float uTime,uWater,uMinSpan,uMaxSc,uFold,uPeel,uTilt,uSkein,uNear; uniform vec2 uHead; uniform vec3 uEsc;
attribute vec4 aBird; attribute vec4 aBird2;
// which way this bird flies: the birds round the camera take its heading, the far ends of the line keep straight upwind
vec2 birdHead(){ vec2 h=mix(uHead,vec2(0.,-1.),smoothstep(30.,170.,abs(aBird.x))); return h/max(length(h),1e-3); }
float surfY(vec2 xz){ return max(textureLod(uMap,(xz-uRect.xy)*uRect.zw,0.).r,uWater); }
float flockW(){ return uFlock.y*clamp(uFlock.w+1.-aBird2.z,0.,1.); }
// WINGMATES (uNear): while we skim, the two nearest pairs close in on either side, each at the head of its own furrow
float nearW(){ return uNear*(1.-step(2.5,aBird2.z)); }
// THE ESCORT (uEsc.x): along the tall brink the two nearest pairs close up on our right, out over the slip face
float escW(){ return uEsc.x*(1.-step(2.5,aBird2.z))*(1.-uSkein); }
// flock slot: x lateral, y metres ahead, z metres below the camera's own line of flight
vec3 flockSlot(){
  float rk=aBird2.z, sd=aBird.x<0.?-1.:1.;
  float a=5.4+0.6*(rk-6.)+2.6*aBird2.y, lat=1.3+aBird.z*(0.78*a+1.2), dn=0.5+aBird2.w*(0.40*a+0.6);
  if(rk<1.5){ a=4.1; lat=2.2; dn=0.55; } else if(rk<2.5){ a=4.4; lat=3.5; dn=0.1; } else if(rk<3.5){ a=5.6; lat=1.5; dn=1.25; }
  else if(rk<4.5){ a=5.3; lat=4.7; dn=1.5; } else if(rk<5.5){ a=6.0; lat=2.7; dn=0.45; } else if(rk<6.5){ a=6.3; lat=6.2; dn=0.6; }
  // THE SKEIN (uSkein): seen from high above, the flock strings out into a V well ahead of us, its leader furthest and lowest
  a=mix(a,17.+(19.-min(rk,19.))*2.5,uSkein); lat=mix(lat,0.8+rk*2.3,uSkein); dn=mix(dn,0.6*sin(rk*1.7),uSkein);
  // every slot drifts on its own slow clock, so the flock never holds a pattern
  lat+=0.35*sin(uTime*0.6+aBird.z*40.)+1.0*sin(uTime*0.23+aBird.z*91.); dn+=0.22*sin(uTime*0.83+aBird.z*23.)+0.45*sin(uTime*0.19+aBird2.y*50.);
  a+=0.4*sin(uTime*0.47+aBird.z*61.)+1.5*sin(uTime*0.15+aBird2.w*44.);
  // the dive (uPeel): pairs peel away ahead and down in turn while the outer ones come through from behind
  float pk=uPeel*1.7-fract(aBird.z*7.31), tt=clamp(pk,0.,1.);
  float bk=step(6.5,rk)*smoothstep(0.,0.25,uPeel)*(1.-smoothstep(0.,0.5,pk+0.45));
  a+=15.*tt-12.*bk; dn+=7.*tt*tt; lat=lat*(1.+0.7*tt)+3.*bk;
  vec3 o=vec3(sd*lat,a,dn); float ek=escW();
  if(ek>0.){
    vec3 es=rk<1.5?(sd<0.?vec3(1.9,5.7,-0.1):vec3(4.4,6.9,-0.9)):(sd<0.?vec3(0.2,7.9,1.2):vec3(6.0,8.6,0.2));
    es+=vec3(0.35*sin(uTime*0.5+aBird.z*40.),0.45*sin(uTime*0.41+aBird.z*61.),0.22*sin(uTime*0.7+aBird.z*23.));
    o=mix(o,es,ek);
  }
  return o;
}
vec2 birdXZ(){
  vec2 hd=birdHead(), rt=vec2(-hd.y,hd.x);
  float lx=aBird.x+sin(uTime*0.23+aBird.z*40.)*0.45;
  float flex=5.*sin(aBird.x*0.021+uTime*0.31)+2.5*sin(aBird.x*0.063-uTime*0.5);
  float ah=uLine.z*(0.5+aBird2.x)-aBird.y-flex*min(1.,abs(aBird.x)*0.05);
  float nk=nearW();
  if(nk>0.){
    float sd=aBird.x<0.?-1.:1., p1=1.-step(1.5,aBird2.z);
    float nl=mix(3.3,1.5,p1)+0.14*sin(uTime*0.5+aBird.z*40.), na=mix(6.6-0.45*sd,4.6+0.35*sd,p1)+0.3*sin(uTime*0.37+aBird.z*61.);
    lx=mix(lx,sd*nl,nk); ah=mix(ah,na,nk);
  }
  vec3 f=flockSlot(); float w=flockW();
  lx=mix(lx,f.x,w); ah=mix(ah,f.y,w);
  vec2 c=vec2(uLine.y,uLine.x)+rt*lx+hd*ah;
  return vec2(clamp(c.x,uBounds.x+12.,uBounds.y-12.),clamp(c.y,uBounds.z+30.,uBounds.w-12.));
}
vec3 birdCentre(vec2 c,out float skim,out float pitch,out float scale,out float loft){
  vec2 hd=birdHead(); float hD=surfY(c+hd*14.), hA=surfY(c+hd*7.), hB=surfY(c), hC=surfY(c-hd*7.);
  float y0=max((hD+2.*hA+2.*hB+hC)/6.,max(hB,hA-2.));
  vec3 f=flockSlot(); float w=flockW();
  skim=(1.-smoothstep(0.02,0.3,hB-uWater))*(1.-smoothstep(0.02,0.3,hA-uWater))*(1.-smoothstep(0.,0.25,w));
  loft=max(uLine.w*aBird.w,w*uFold*0.42); skim*=1.-smoothstep(0.02,0.2,loft);
  float dist=length(uCamL-vec3(c.x,y0+1.,c.y));
  scale=max(clamp(dist*uMinSpan,1.,uMaxSc),1.+0.22*w);
  scale=max(scale,1.+nearW()*(1.-smoothstep(0.,0.25,w))*mix(0.5,0.15,1.-step(1.5,aBird2.z))+0.3*escW()*w);
  float y=y0+mix(1.0+0.7*aBird2.w,0.074*scale,skim)+uLine.w*aBird.w*(3.+9.*aBird2.w)+sin(uTime*0.9+aBird.z*17.)*0.12*(1.-skim);
  float yf=max(uFlock.x-f.y*mix(uFlock.z,uEsc.y,escW())-f.z,max(hB,hA)+0.75);
  y=mix(y,yf,w);
  pitch=clamp(atan((hA-hC)/14.),-0.7,0.7)*(1.-0.5*loft);
  pitch=mix(pitch,clamp(-atan(uFlock.z)*0.85,-0.7,0.7)*(1.-0.8*uSkein),w);
  return vec3(c.x,y,c.y);
}`;
const BIRD_VERT = /* glsl */`
${GLSL_BIRD}
attribute vec4 aAnim; attribute vec3 aCol;
varying vec3 vCol; varying vec3 vNl; varying vec3 vInfo;
#include <fog_pars_vertex>
void main(){
  float skim,pitch,scale,loft; vec2 c=birdXZ(); vec3 ctr=birdCentre(c,skim,pitch,scale,loft);
  vec3 p=position; vec3 n=normal; float part=aAnim.z;
  float ph=uTime*(21.+6.*aBird2.y)+aBird.z*60.;
  float climb=clamp(pitch*2.,0.,1.);
  float amp=mix(0.50,0.27,skim)*(1.-0.6*loft)+0.15*climb, bias=mix(0.10,0.60,skim)+0.2*loft;
  float th1=bias+amp*sin(ph), th2=-0.12+amp*0.85*sin(ph-1.15)-0.55*loft;
  if(part>0.5&&part<1.5){
    float r=aAnim.y, sd=aAnim.x, li=min(r,0.45)*0.54, lo=max(r-0.45,0.)*0.54, a2=th1+th2;
    p.x=sd*(0.034+li*cos(th1)+lo*cos(a2)*(1.-0.3*loft));
    p.y+=li*sin(th1)+lo*sin(a2);
    p.z+=lo*loft*0.8;
    float an=r<0.45?th1:a2;
    n=vec3(-sd*sin(an),cos(an),0.);
  } else if(part>1.5&&part<2.5){
    float a=0.72*skim; vec3 q=p-vec3(0.,-0.004,-0.2);
    p.y=-0.004+q.y*cos(a)+q.z*sin(a); p.z=-0.2+q.z*cos(a)-q.y*sin(a);
  } else { p.y-=0.012*sin(ph); }
  float roll=sin(uTime*0.45+aBird.z*31.)*0.14*(1.-skim)+uEsc.z*flockW()*(0.55+0.9*aBird2.y);
  float cr=cos(roll), sr=sin(roll); p.xy=vec2(p.x*cr-p.y*sr,p.x*sr+p.y*cr); n.xy=vec2(n.x*cr-n.y*sr,n.x*sr+n.y*cr);
  // far birds seen from behind and barely above are edge-on and vanish: uTilt tips their backs toward such a camera
  float pt=pitch+uTilt*smoothstep(12.,35.,length(uCamL-ctr));
  float cp=cos(pt), sp=sin(pt);
  p.yz=vec2(p.y*cp-p.z*sp,p.z*cp+p.y*sp); n.yz=vec2(n.y*cp-n.z*sp,n.z*cp+n.y*sp);
  vec2 hd=birdHead(); p.xz=vec2(-hd.y*p.x-hd.x*p.z,hd.x*p.x-hd.y*p.z); n.xz=vec2(-hd.y*n.x-hd.x*n.z,hd.x*n.x-hd.y*n.z);
  vCol=aCol; vNl=n; vInfo=vec3(part,aAnim.y,aAnim.w);
  vec4 mvPosition=modelViewMatrix*vec4(ctr+p*scale,1.);
  gl_Position=projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const BIRD_FRAG = /* glsl */`
uniform vec3 uSun,uSunCol,uFill;
varying vec3 vCol; varying vec3 vNl; varying vec3 vInfo;
#include <fog_pars_fragment>
void main(){
  vec3 n=normalize(vNl+vec3(0.,1e-4,0.)); vec3 alb=vCol;
  float sheet=step(0.5,vInfo.x)*(1.-step(1.5,vInfo.x))+step(2.5,vInfo.x);
  if(!gl_FrontFacing){
    n=-n;
    vec3 under=mix(vec3(0.82,0.83,0.82),vec3(0.16,0.165,0.18),clamp(smoothstep(0.55,1.,vInfo.z)*0.6+smoothstep(0.55,0.95,vInfo.y)*0.8,0.,1.));
    alb=mix(alb,under,sheet);
  }
  float ndl=max(dot(n,uSun),0.);
  vec3 col=alb*(uFill*(0.62+0.3*n.y)+uSunCol*(1.-exp(-ndl*3.))+vec3(0.30,0.33,0.34)*max(-n.y,0.));
  gl_FragColor=vec4(col,1.);
  #include <fog_fragment>
}`;
// wakes: one ribbon per bird laid on the water behind the bill; position = (side, 0, s along). A narrow V: two
// diverging edges that meander, break up and are gone within 8 m, with the only sparkle where the bill cuts.
const WAKE_VERT = /* glsl */`
${GLSL_BIRD}
uniform float uPx,uWakeLen,uWakeW,uWakeSolid;
varying vec4 vWk; varying vec3 vSh;
#include <fog_pars_vertex>
void main(){
  float skim,pitch,scale,loft; vec2 c=birdXZ(); vec3 ctr=birdCentre(c,skim,pitch,scale,loft);
  float s=position.z, sd=position.x;
  vec2 hd=birdHead(), rt=vec2(-hd.y,hd.x);
  vec2 ctrl=c-hd*(s*uWakeLen-0.22*scale);
  float dist=length(uCamL-vec3(ctrl.x,uWater,ctrl.y));
  float w=max((0.03+0.8*pow(s,0.8))*uWakeW,dist*uPx*0.9);
  float mx=(0.16*sin(s*7.+uTime*1.3+aBird.z*40.)+0.09*sin(s*17.-uTime*2.1+aBird.z*71.))*s*uWakeW;
  vec2 q=ctrl+rt*(mx+sd*w);
  vec4 m=textureLod(uMap,(q-uRect.xy)*uRect.zw,0.);
  float wet=smoothstep(0.03,0.22,uWater-m.r);
  float a=wet*pow(1.-s,1.5)*(1.-smoothstep(0.02,0.25,loft))*(1.-flockW())*smoothstep(0.,0.5,skim+0.5*wet);
  a*=mix(smoothstep(1.3,4.4,dist),1.,uWakeSolid);          // a neighbour's furrow is gone before it reaches us: it never crosses the corner of the frame
  vWk=vec4(sd,s,a,dist); vSh=vec3(clamp(m.g,0.,1.),aBird.z,nearW());
  vec4 mvPosition=modelViewMatrix*vec4(q.x,uWater+0.03+dist*0.0005,q.y,1.);
  gl_Position=projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const WAKE_FRAG = /* glsl */`
uniform vec3 uSunCol,uFill; uniform float uTime,uWakeSolid;
varying vec4 vWk; varying vec3 vSh;
#include <fog_pars_fragment>
${GLSL_NOISE}
void main(){
  float e=abs(vWk.x), s=vWk.y, id=vSh.y*53.;
  float edge=smoothstep(0.78,0.9,e)*(1.-smoothstep(0.93,1.,e));
  float br=smoothstep(0.34,0.62,vn(vec2(s*11.-uTime*1.1+id,e*2.5+id*3.)));
  float fill=(1.-e)*0.10*vn(vec2(s*24.-uTime*2.,vWk.x*3.+id));
  float core=pow(clamp(1.-s,0.,1.),12.)*(1.-e*e);
  // close by: the cut itself, a thin bright furrow soon gone, and two faint broken lines of ripples spreading from it
  float fur=exp(-e*e*46.)*pow(clamp(1.-s,0.,1.),2.2)*(0.5+0.5*br);
  float near=fur*1.25+(edge*br*smoothstep(0.03,0.3,s)+fill)*0.2+core*1.2;
  // a wingmate's furrow at our side stays a thin silver cut, never a white wedge
  float thin=max(smoothstep(60.,220.,vWk.w),uWakeSolid*(1.-vSh.z));
  float I=mix(near,0.5*(0.5+0.5*br)*(1.-0.5*s),thin)*vWk.z;
  vec3 col=(uFill*0.6+uSunCol*(0.4+1.1*vSh.x))*(1.+2.2*core);
  gl_FragColor=vec4(col,clamp(I*mix(0.5+0.35*vSh.z,0.95,thin),0.,1.));
  #include <fog_fragment>
}`;
// crest plumes: soft camera-facing sprites born on the brink lines, streaming downwind (+Z) and sinking
const PLUME_VERT = /* glsl */`
uniform sampler2D uMap; uniform vec4 uRect; uniform float uTime,uPlume,uFar; uniform vec3 uCamL;
${GLSL_BOWL}
attribute vec4 aP; attribute vec4 aQ;
varying vec2 vUv; varying vec3 vPl;
#include <fog_pars_vertex>
void main(){
  float f=fract(uTime*aQ.y+aQ.w);
  float gust=0.55+0.45*sin(uTime*0.35+aP.x*0.013+aP.z*0.02);
  float farK=smoothstep(140.,420.,length(uCamL-aP.xyz))*clamp((uFar-0.75)/2.35,0.,1.);
  vec3 p=aP.xyz+vec3(sin(aP.w*40.)*3.*f,0.5+aQ.z*(3.2*f-2.4*f*f)*(1.+0.6*farK),f*(18.+aQ.x*2.6)*(1.+0.6*farK));
  p.y+=bowlY(p.xz);
  float sh=clamp(textureLod(uMap,(p.xz-uRect.xy)*uRect.zw,0.).g,0.,1.);
  vec4 mvPosition=modelViewMatrix*vec4(p,1.);
  float size=aQ.x*(0.5+1.5*f)*(1.+0.15*farK);
  mvPosition.xy+=position.xy*size*vec2(2.1,0.7);
  float a=smoothstep(0.,0.14,f)*pow(1.-f,mix(1.25,0.75,farK))*gust*uPlume*smoothstep(4.,34.,-mvPosition.z)*mix(1.,uFar,smoothstep(110.,340.,-mvPosition.z));
  vUv=position.xy; vPl=vec3(a,mix(sh,1.,0.8),aP.w);
  gl_Position=projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const PLUME_FRAG = /* glsl */`
uniform vec3 uSunCol,uFill,uSand;
varying vec2 vUv; varying vec3 vPl;
#include <fog_pars_fragment>
${GLSL_NOISE}
void main(){
  float r2=dot(vUv,vUv);
  float a=max(exp(-r2*3.4)-0.033,0.)*(0.55+0.75*vn(vUv*2.3+vPl.z*9.));
  vec3 col=uSand*(uFill*0.42+uSunCol*0.86*vPl.y);         // sunlit white sand in the air (bright against a shaded face), never bright enough to bloom into a glare
  gl_FragColor=vec4(col,clamp(a*vPl.x*0.7,0.,0.92));
  #include <fog_fragment>
}`;

// ---------------------------------------------------------------------------------------------------------
// the low sun's azimuth, degrees left of upwind: 68 puts it ahead of the slip faces (blue faces, white backs). Round 8 tried 102
// (behind the left shoulder, the brief's lit faces): every dune went white on white and the brink streamers vanished, so 68 stays
const AZ_LOW = 68;
const HOURS = {
  // refl = (fresnel floor, how blue the mirrored horizon is, mirror strength, how much far pools drop their mirror)
  afternoon: { az: AZ_LOW, el: 20, sun: [1.0, 0.925, 0.78], sunI: 1.04, fillI: 0.95, cloud: 0.62, plume: 1, glit: 1, wet: 1, hor: '#E6EEF2', sandMul: 1, refl: [0.03, 0.3, 0.56, 0.7], road: 0 },
  noon: { az: 62, el: 52, sun: [1.0, 0.975, 0.92], sunI: 0.96, fillI: 1.0, cloud: 0.4, plume: 0.45, glit: 1.4, wet: 1, hor: '#EAF1F4', sandMul: 1, refl: [0.03, 0.3, 0.56, 0.7], road: 0 },
  squall: { az: AZ_LOW, el: 20, sun: [1.0, 0.925, 0.78], sunI: 1.06, fillI: 0.92, cloud: 0.6, plume: 0.8, glit: 0.9, wet: 1, hor: '#C4D3E2', sandMul: 0.97, refl: [0.03, 0.2, 0.6, 0.6], road: 0 },
  // full moon, 35 degrees up, ahead-right: silver sand at a third of white, pools as dark steel mirrors, one glitter road
  moon: { az: -44, el: 35, sun: [0.66, 0.76, 1.0], sunI: 0.23, fillI: 0.085, water: [0.035, 0.05, 0.075], grey: 0.65, cloud: 0.35, plume: 0.7, glit: 2.6, wet: 0.3, hor: '#2A3A5C', sandMul: 1, refl: [0.3, 0.1, 1.0, 0.1], road: 1 },
};

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('thousand-lagoons-hero') : ctx.rng;
  const noise = ctx.noise || ctx.core.makeNoise(Math.floor(rng() * 1e9));
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE).map((h) => new THREE.Color(h));
  const hour = HOURS[opts.hour] || HOURS.afternoon, season = opts.season || 'july';
  const water = 0.9 + (opts.waterBias ?? 0) + (season === 'june' ? 0.9 : season === 'september' ? -0.7 : 0) + rng.range(-0.08, 0.08);
  const plumeK = (opts.plumeStrength ?? 1) * hour.plume * (season === 'september' ? 1.5 : 1);
  const detail = ctx.quality?.detail ?? 1;
  // direction TO the sun: az degrees to the LEFT of the -Z heading, el degrees up
  const az = hour.az * Math.PI / 180, el = hour.el * Math.PI / 180;
  const sunDir = opts.sunDir ? new V3().fromArray(opts.sunDir).normalize() : new V3(-Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el));
  const v3c = (c, k = 1) => new V3(c.r * k, c.g * k, c.b * k);
  const wLit = new V3().fromArray(hour.water || [1, 1, 1]);   // the water's own colours take the hour's light (moon: dimmed, greyed)
  const wCol = (c) => { const v = v3c(c, 0.95), l = (v.x + v.y + v.z) / 3, g = hour.grey || 0; return v.lerp(new V3(l, l, l), g).multiply(wLit); };

  const object = new THREE.Group(); object.name = 'thousand-lagoons-hero';
  const field = makeField(rng, noise, water);
  await ctx.yield?.();
  const Hmap = await bakeHeights(ctx, field);
  await ctx.yield?.();
  const Smap = await bakeShadow(ctx, Hmap, water, sunDir);
  // the baked sun shadow at a point of the sheet, 0 (in a crest's shadow) .. 1 (sunlit): for whoever plants things
  const shadeAt = (x, z) => {
    const fx = Math.min(TW - 1.001, Math.max(0, (x - X0) / (X1 - X0) * TW - 0.5)), fz = Math.min(TH - 1.001, Math.max(0, (z - Z0) / (Z1 - Z0) * TH - 0.5));
    const ix = fx | 0, iz = fz | 0, ax = fx - ix, az = fz - iz, q = iz * TW + ix;
    return Math.min(1, Math.max(0, (Smap[q] * (1 - ax) + Smap[q + 1] * ax) * (1 - az) + (Smap[q + TW] * (1 - ax) + Smap[q + TW + 1] * ax) * az));
  };
  await ctx.yield?.();
  const map = makeMapTexture(Hmap, Smap);
  await ctx.yield?.();

  const fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
  const shared = {
    uMap: { value: map }, uRect: { value: new THREE.Vector4(X0, Z0, 1 / (X1 - X0), 1 / (Z1 - Z0)) }, uBounds: { value: new THREE.Vector4(X0, X1, Z0, Z1) },
    uCamL: { value: new V3(0, 60, 200) }, uTime: { value: 0 }, uWater: { value: water },
    uSun: { value: sunDir.clone() }, uSunCol: { value: new V3().fromArray(hour.sun).multiplyScalar(hour.sunI * (opts.sunIntensity ?? 1)) },
    uFill: { value: v3c(pal[1], hour.fillI) }, uSand: { value: v3c(pal[0], hour.sandMul) }, uPlume: { value: plumeK },
    uLine: { value: new THREE.Vector4(0, 0, 0, 0) }, uMinSpan: { value: 0.01 }, uPx: { value: 0.003 },
    uFlock: { value: new THREE.Vector4(0, 0, 0, 0) }, uFold: { value: 0 }, uPeel: { value: 0 }, uMaxSc: { value: 6 }, uHead: { value: new THREE.Vector2(0, -1) }, uWakeLen: { value: 7.5 }, uWakeW: { value: 1 }, uWakeSolid: { value: 0 }, uSkein: { value: 0 }, uNear: { value: 0 }, uEsc: { value: new V3(0, 0.1, 0) }, uTilt: { value: 0 }, uFar: { value: 0.6 }, uBowl: { value: opts.bowl === false ? 0 : 1 },
  };
  const pick = (...names) => Object.fromEntries(names.map((n) => [n, shared[n]]));

  // ---- sand + water sheet
  const sheetGeo = await buildSheet(ctx, field, water);
  const sheetMat = new THREE.ShaderMaterial({
    uniforms: { ...fogU(), ...pick('uMap', 'uRect', 'uBounds', 'uCamL', 'uTime', 'uWater', 'uSun', 'uSunCol', 'uFill', 'uSand', 'uPlume', 'uBowl'),
      uMint: { value: wCol(pal[2]) }, uTurq: { value: wCol(pal[3]) }, uTeal: { value: wCol(pal[4]) },
      uNight: { value: new THREE.Vector4().fromArray(hour.refl) }, uRoad: { value: hour.road },
      uZen: { value: v3c(pal[5], opts.hour === 'moon' ? 0.08 : 0.95) }, uHor: { value: v3c(new THREE.Color(hour.hor), opts.hour === 'moon' ? 1 : 0.9) },
      uGrove: { value: new THREE.Vector4(-153, 150, 1 / 60, 1 / 42) }, uSq: { value: new THREE.Vector4(SQUALL.x, SQUALL.z, opts.hour === 'squall' ? 1 : 0, 0) }, uCloud: { value: hour.cloud }, uEdgeFade: { value: opts.edgeFade === false ? 0 : 1 }, uWet: { value: hour.wet }, uGlit: { value: hour.glit } },
    vertexShader: SHEET_VERT, fragmentShader: SHEET_FRAG, fog: true,
  });
  const sheet = new THREE.Mesh(sheetGeo, sheetMat); sheet.name = 'sand-and-lagoons'; sheet.frustumCulled = false; object.add(sheet);
  await ctx.yield?.();

  // ---- the skimmer line
  const nBirds = Math.max(120, Math.min(260, Math.round(opts.birds ?? 200))), half = Math.ceil(nBirds / 2);
  const kq = Math.max(0.004, (560 - 3 * half) / (half * half));
  const aBird = new Float32Array(nBirds * 4), aBird2 = new Float32Array(nBirds * 4);
  for (let i = 0; i < nBirds; i++) {
    const k = (i >> 1) + 1, side = i & 1 ? 1 : -1, far = Math.min(1, k / 30);
    aBird[i * 4] = side * (3 * k + kq * k * k) + rng.range(-0.6, 0.6) * far;
    { const jr = k <= 4 ? rng.range(-0.4, 0.4) : rng.range(-1, 1) * (2 + 8 * far), vk = Math.min(1, Math.max(0, (k - 7) / 8)), lat = 3 * k + kq * k * k;
      aBird[i * 4 + 1] = -((3.0 + 1.12 * lat) * (1 - vk) + 6 * vk) + jr * (k <= 4 ? 1 : 0.35 + 0.65 * vk); }      // the nearest pairs fly a shallow V ahead of us: whole birds inside a wide frame, each at the head of its furrow
    aBird[i * 4 + 2] = rng(); aBird[i * 4 + 3] = k < 3 ? 0.25 : Math.pow(rng(), 1.6);
    aBird2[i * 4] = k < 3 ? 0.15 : rng.range(0, 0.9); aBird2[i * 4 + 1] = rng(); aBird2[i * 4 + 2] = rng(); aBird2[i * 4 + 3] = rng();
    aBird2[i * 4 + 2] = k;                                  // rank outward from the camera: which pairs join the flock
  }
  const birdBase = skimmerGeometry(pal[6]);
  const birdGeo = new THREE.InstancedBufferGeometry();
  birdGeo.index = birdBase.index; for (const n of ['position', 'normal', 'aCol', 'aAnim']) birdGeo.setAttribute(n, birdBase.getAttribute(n));
  birdGeo.setAttribute('aBird', new THREE.InstancedBufferAttribute(aBird, 4)); birdGeo.setAttribute('aBird2', new THREE.InstancedBufferAttribute(aBird2, 4));
  birdGeo.instanceCount = nBirds;
  await ctx.yield?.();
  const birdMat = new THREE.ShaderMaterial({
    uniforms: { ...fogU(), ...pick('uMap', 'uRect', 'uBounds', 'uCamL', 'uTime', 'uWater', 'uLine', 'uFlock', 'uFold', 'uPeel', 'uHead', 'uMinSpan', 'uMaxSc', 'uTilt', 'uSkein', 'uNear', 'uEsc', 'uSun', 'uSunCol', 'uFill') },
    vertexShader: BIRD_VERT, fragmentShader: BIRD_FRAG, fog: true, side: THREE.DoubleSide,
  });
  const birds = new THREE.Mesh(birdGeo, birdMat); birds.name = 'skimmer-line'; birds.frustumCulled = false; object.add(birds);

  // ---- wakes
  const SEG = 10, wp = [], wi = [];
  for (let s = 0; s <= SEG; s++) { const t = Math.pow(s / SEG, 1.6); wp.push(-1, 0, t, 0, 0, t, 1, 0, t); }
  for (let s = 0; s < SEG; s++) for (let c = 0; c < 2; c++) { const a = s * 3 + c, b = a + 1, d = a + 3, e = d + 1; wi.push(a, d, b, b, d, e); }
  const wakeGeo = new THREE.InstancedBufferGeometry();
  wakeGeo.setAttribute('position', new THREE.Float32BufferAttribute(wp, 3)); wakeGeo.setIndex(wi);
  wakeGeo.setAttribute('aBird', new THREE.InstancedBufferAttribute(aBird, 4)); wakeGeo.setAttribute('aBird2', new THREE.InstancedBufferAttribute(aBird2, 4));
  wakeGeo.instanceCount = nBirds;
  const wakeMat = new THREE.ShaderMaterial({
    uniforms: { ...fogU(), ...pick('uMap', 'uRect', 'uBounds', 'uCamL', 'uTime', 'uWater', 'uLine', 'uFlock', 'uFold', 'uPeel', 'uHead', 'uMinSpan', 'uMaxSc', 'uTilt', 'uSkein', 'uNear', 'uEsc', 'uSunCol', 'uFill', 'uPx', 'uWakeLen', 'uWakeW', 'uWakeSolid') },
    vertexShader: WAKE_VERT, fragmentShader: WAKE_FRAG, fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
  });
  const wakes = new THREE.Mesh(wakeGeo, wakeMat); wakes.name = 'wakes'; wakes.frustumCulled = false; wakes.renderOrder = 2; object.add(wakes);
  await ctx.yield?.();

  // ---- crest plumes
  const nPl = Math.max(200, Math.round((opts.plumes ?? 1400) * detail));
  const wts = field.dunes.map((d) => d.W * (d.H / 22) * (d === field.named.tall ? 1.3 : d.auth ? 2.6 : 1)), wSum = wts.reduce((a, b) => a + b, 0);
  const aP = [], aQ = [];
  field.dunes.forEach((d, di) => {
    const n = Math.round(nPl * wts[di] / wSum);
    for (let i = 0; i < n; i++) {
      const [x, hc, z] = crestPoint(d, rng.range(-0.9, 0.9));
      if (hc < 4 || Math.abs(x) > X1 - 30 || z < Z0 + 30 || z > Z1 - 40) continue;
      aP.push(x, field.heightAt(x, z) + 0.15, z, rng());
      aQ.push(rng.range(5.5, 10.5) * (0.7 + 0.016 * hc), rng.range(0.12, 0.22), rng.range(1.5, 4.2), rng());
    }
  });
  const plGeo = new THREE.InstancedBufferGeometry();
  plGeo.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); plGeo.setIndex([0, 1, 2, 0, 2, 3]);
  plGeo.setAttribute('aP', new THREE.InstancedBufferAttribute(new Float32Array(aP), 4)); plGeo.setAttribute('aQ', new THREE.InstancedBufferAttribute(new Float32Array(aQ), 4));
  plGeo.instanceCount = aP.length / 4;
  const plMat = new THREE.ShaderMaterial({
    uniforms: { ...fogU(), ...pick('uMap', 'uRect', 'uTime', 'uPlume', 'uSunCol', 'uFill', 'uSand', 'uBowl', 'uFar', 'uCamL') },
    vertexShader: PLUME_VERT, fragmentShader: PLUME_FRAG, fog: true, transparent: true, depthWrite: false,
  });
  const plumes = new THREE.Mesh(plGeo, plMat); plumes.name = 'crest-plumes'; plumes.frustumCulled = false; plumes.renderOrder = 3; object.add(plumes);
  await ctx.yield?.();

  // ---- anchors
  const { d1, d2, tall, gL, gR } = field.named;
  const hAt = (x, z) => field.heightAt(x, z), depthAt = (x, z) => shared.uWater.value - field.heightAt(x, z);
  const surfaceAt = (x, z) => Math.max(field.heightAt(x, z), shared.uWater.value);
  const cp = (d, t) => { const c = crestPoint(d, t); return new V3(c[0], hAt(c[0], c[2]), c[2]); };
  const tc = cp(tall, 0);
  const flyThrough = buildFlyLine(field, water, tc.z);
  for (const p of flyThrough) { const h = hAt(p.x, p.z); p.y = Math.max(p.y, h > water ? h + 2.4 : water + 0.45); }
  const revealPos = new V3(0, tc.y + 10, tc.z - 2);
  const anchors = {
    flyThrough,
    reveal: { position: revealPos, lookAt: revealPos.clone().add(new V3(0, -Math.tan(12 * Math.PI / 180) * 100, -100)) },
    portalSeat: { position: new V3(0, water, Z_PORTAL), normal: new V3(0, 0, 1), width: 14, height: 7 },
    hornTips: { left: cp(gL, 0.95), right: cp(gR, -0.95) },
    crests: [d1, d2, tall, gL, gR].map((d) => ({ position: cp(d, 0), height: d.H, width: d.W * 2 })),
    lagoons: field.basins.slice(0, 4).concat(field.basins.slice(6, 7)).map((b) => ({ position: new V3(b.x, water, b.z), radii: [b.a, b.b] })),
    grove: new V3(-153, water, 150), buriedTrunks: new V3(routeX(d2.z - 55) + 8, hAt(routeX(d2.z - 55) + 8, d2.z - 55), d2.z - 55), routeX, crestLine: (i, t) => cp([d1, d2, tall, gL, gR][i], t),
    sunDir: sunDir.clone(), windDir: new V3(0, 0, 1), waterLevel: water, bounds: { x0: X0, x1: X1, z0: Z0, z1: Z1 },
    heightAt: hAt, waterAt: () => shared.uWater.value, surfaceAt, depthAt, shadeAt,
  };

  // ---- drive
  const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  let driven = opts.autoplay === false;
  const line = shared.uLine.value;
  const applyProgress = (p) => {
    p = Math.min(1, Math.max(0, p));
    line.set(Z_START + (Z_PORTAL - Z_START) * p, 0, 45 * ss(0.605, 0.70, p) * (1 - ss(0.9, 0.99, p)), ss(0.65, 0.73, p) * (1 - ss(0.80, 0.89, p)));
  };
  applyProgress(0.7);
  const _inv = new THREE.Matrix4(), _cam = new V3(), _sz = new THREE.Vector2(); let minPx = opts.birdMinPx ?? 6;
  return {
    object, radius: 110, height: 80, center: new V3(0, 30, -150), anchors, ground: false, groundY: 0,
    uniforms: shared, sheetUniforms: sheetMat.uniforms, heightAt: hAt, waterAt: anchors.waterAt, surfaceAt, depthAt,
    setProgress(p) { driven = true; applyProgress(p); },
    setLine(z, x = 0, lead = 0, loft = 0) { driven = true; line.set(z, x, lead, loft); },
    // the flock: camera height (hero-local y), strength 0..1, dive slope (metres dropped per metre ahead; negative on a climb),
    // how many pairs leave the line for it, and how far their wings fold (0 beating, 1 half folded for the dive)
    setFlock(camY, k = 0, slope = 0, pairs = 4, fold = 0) { shared.uFlock.value.set(camY, k, slope, pairs); shared.uFold.value = fold; },
    progressAtZ(z) { return Math.min(1, Math.max(0, (Z_START - z) / (Z_START - Z_PORTAL))); },
    // plume strength; far = how much denser (or thinner) the plumes of crests 400 m off are drawn than near ones (0.6 by default)
    setPlume(k, far) { shared.uPlume.value = k; if (far !== undefined) shared.uFar.value = far; },
    setBirdMinPx(px, maxScale = 6) { minPx = px; shared.uMaxSc.value = maxScale; },
    // heading of the camera over the ground (unit x,z): the near birds, the flock and every wake turn with it
    setHeading(hx, hz) { shared.uHead.value.set(hx, hz); },
    // wakes seen from the air: length in metres and a width factor;  setPeel(p) 0..1: the flock peels away down the dive
    // solid 0..1 draws near wakes as the filled silver strokes far ones are;  setTilt(k): radians far birds tip their backs toward a low camera behind them
    setWake(len = 7.5, wide = 1, solid = 0) { shared.uWakeLen.value = len; shared.uWakeW.value = wide; shared.uWakeSolid.value = solid; },
    setTilt(k) { shared.uTilt.value = k; },
    setPeel(p) { shared.uPeel.value = p; },
    // 0..1: the flock leaves the camera's side and strings out into a V skein 17 to 65 m ahead (setFlock's slope sets how far below)
    setSkein(k) { shared.uSkein.value = k; },
    // 0..1: on a skim the two nearest pairs close in beside us (1.6 and 3.9 m out, 4.5 and 6.4 m ahead), each heading its furrow
    setNear(k) { shared.uNear.value = k; },
    // the escort: strength 0..1 (the two nearest flock pairs gather on our right, 6 to 9 m ahead), the slope of the line they hold
    // (metres dropped per metre ahead, whatever the climb), and the bank in radians every flock bird takes in a turn
    setEscort(k, slope = 0.1, bank = 0) { shared.uEsc.value.set(k, slope, bank); },
    update(dt, time, camera) {
      shared.uTime.value = time;
      if (!driven) { const c = ((time + 4) / 28) % 1; applyProgress(0.5 + 0.42 * c); }
      if (camera) {
        object.updateWorldMatrix(true, false);
        // read the matrix: getWorldPosition() would rebuild matrixWorld from .matrix and wreck a portal camera
        shared.uCamL.value.copy(_cam.setFromMatrixPosition(camera.matrixWorld)).applyMatrix4(_inv.copy(object.matrixWorld).invert());
        const pe = Math.max(0.2, camera.projectionMatrix.elements[5]);
        const hpx = ctx.renderer ? ctx.renderer.getDrawingBufferSize(_sz).y : 900;
        shared.uPx.value = 2 / (pe * Math.max(64, hpx)); shared.uMinSpan.value = minPx * shared.uPx.value / 1.08;
      }
    },
    dispose() { map.dispose(); birdBase.dispose(); },
  };
}
