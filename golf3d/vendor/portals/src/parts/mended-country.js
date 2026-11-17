// HERO: "The Last Shard" for the world "mended-country" (The Country Mended with Gold).
// (header continues at HEADER-DOC below the imports; see the block comment there)
import * as THREE from 'three';
import { smoothstep, clamp, lerp } from '../kit/core.js';

/* HEADER-DOC
WHAT IT IS
  A 240 m spearhead of celadon (110 m across the shoulders, 9 m thick, curved to the bowl, glazed and carved on both
  faces) standing tip-up over the spearhead gap it belongs to like a raised lid, plus the "collar": the ring of already-mended wall round the
  gap (about 400 x 300 m, with set gold seams, the open 15 m chip that holds the exit portal, and the lower
  halves of the four carved petals). 40 gold threads run from the Shard's biscuit edge to the gap rim and
  tighten as it sinks; at seating two molten beads race from the tip up both flanks, meet at the base and run on
  round the chip.

FRAME (local space)
  Origin = the TIP of the gap on the bowl surface (world (0, 93.9, 540) in the brief). +Y up. The glazed face
  looks toward +Z and up; the wall climbs toward -Z. The brief's world has +Z north with the camera coming from
  the south, so the world places it with
      hero.object.position.set(0, 93.9, 540); hero.object.rotation.y = Math.PI;
  i.e. local (x, y, z) = world (-x, y - 93.9, 540 - z). The collar lies exactly on the brief's bowl sphere
  (radius 1600, centre world (0,1600,0)), so the world's other shards continue it. anchors.capPoint(x, z)
  returns the local surface point above horizontal (x, z); anchors.collarOutline / gapOutline are closed
  polylines ([x, y, z] local, on the glazed surface) for cutting the world's wall round the piece.

OPTS
  palette  [glaze, rim, deepJade, biscuit, gold, copperRed, peach] hex strings (the brief's by default). Glaze
           absorption is derived from palette[0] over palette[3], so other wares (ivory, sea-green) just work.
  detail   0.6-1 (default ctx.quality.detail or 1): thins the dust only; Shard, seams and threads never thin.
  glowDir  THREE.Vector3, WORLD-space direction TO the afterglow softbox. Default: the brief's azimuth 300,
           elevation 8, held in LOCAL space (-0.857, 0.139, -0.495) and carried through the object's rotation.
  seatU 0.84, meetU 0.945, chipU 0.965, startU 0.03: timing of the event along the world's u.

LIGHT AND TONE (round 3; LIGHT_GLSL is shared with the world)
  litK(N): the afterglow rakes the bowl. The bowl is shallow, so its lean is exaggerated (uBowlEx) and the side
  turned away from the glow falls to uShade: lit celadon against dark jade. uPool deepens pooled glaze (ink green in
  grooves and hollows; the floor is uBiscuit * exp(-1.75 * uAbsorb) * 0.34, never black). Gold glows (uGoldLift): the
  brightest, most saturated thing in the frame, and a far seam holds three pixels (uRes).
  THE LID'S FACE: its underside takes the light of the gap as a gradient climbing from the hinge (deep peach at the base
  edge, cooling to carved, green-pooled celadon at the tip), raking along the face so the carving reads.
  BISCUIT: smooth wall normals; chips are cut in the shader (chips / biscuitN / biscuitShade: shell-shaped scoops at
  1.9 m and 0.42 m, grain, three strata, iron specks), so no mesh triangle shows.
  RELIEF: besides the wall's petal band, the well carries a double lotus (40 petals r 94-196, 16 petals r 26-86) and,
  with uCarve 1 (the bare visits), 36 great petals round the lower wall (r 285-440).

PROGRESS
  hero.setProgress(u): u = the world's path u (0..1), never the clock. The Shard is a lid on its base edge: it
  stands 104 degrees above its seat (leaning out over the bowl, underside toward the arriving flight and lit
  by the gap), hovers up to 34 m clear of its hinge line, and lowers like a drawbridge on its gold threads
  for u startU..seatU, the tip coming down overhead (monotone curves: it lands with no velocity; the pose
  matrix is exactly identity once seated, so nothing can drift). A soft column of light stands out of the
  chip for the whole flight (the exit's beacon; uniform uBeacon). At seatU a puff of gold dust; the two beads run
  tip -> base for seatU..meetU, then along the crack to the chip and round its rim by chipU. The peach
  blades and lips die as the seam closes. Without a setProgress call the piece plays the whole event on a
  44 s loop of `time`, so the stand-alone viewer shows it moving.
  RIVERS: cracks star out from the gap (rays from RIVER_APEX at RIVER_THETA degrees). Across the collar each is a
  fat seam whose gold runs from the collar's outer break to the gap rim; hero.setRiver(k, uAt, speed) times one
  (gold at the outer break at u = uAt, then `speed` metres per unit of u). anchors.rivers gives the apex, the
  site directions (phi) for the wedge shards the world lays so each ray is a real break across the wall, and
  each ray's run across the collar. Stand-alone they run one after another from u 0.5.
  hero.beadPositions(u) -> [[x,y,z],[x,y,z]] local positions of the two beads; hero.pose = the Shard's
  current Matrix4 (local); hero.uniforms = shared uniforms (uUpLight 2.4, uHazeCol/uHazeK = the brief's
  distance haze, uGlowCol, uFillCol, uPeach, uZenith, uRimSky ...) if the world wants to retint.

ANCHORS (local space, plain arrays)
  portalSeat   { position, facing, wallNormal, radius 7, tiltDeg 50 }: the 14 m portal sits 2 m down inside
               the chip (clear opening >= 7.6 m radius); `facing` points back up the 50-degree dive.
  flyThrough   7 points, sections E-H of the brief: up the wall on the chip side of the gap 12-18 m off the
               glaze, a climb, then the last 60 m dead straight into the portal. >= 12 m from anything for
               u >= 0.6 (the Shard is within 12 m of its seat by then and inboard of the line).
  flyBeyond    a point 14 m past the portal on the dive line.
  chip { center, normal, radius }, gapTip, gapBase, shardPivot
  gapOutline, collarOutline   closed polylines on the glazed surface (see FRAME); capPoint(x,z), capNormal(x,z)
  placement    { position:[0,93.9,540], rotationY: PI }
  viewpoints   { entry, wallClimb, gapSide, overview }: good camera positions, look at hero.center / the chip.

SIZE, COST, LIGHT
  radius 185, height 320 (collar spans y -45..165; the open Shard reaches y ~300). ground: false (it hangs
  over the cloud sea). ~73k triangles, 7 draw calls (glaze, biscuit, gold, threads, dust, peach blade, chip beacon), no
  textures, no lights; build ~60 ms. It needs NO scene lights: afterglow key, dove fill and peach up-light
  are analytic in the shaders, per the brief's style. Scene fog is honoured (fog chunks) on the opaque
  parts; with scene.fog = null only the built-in haze applies. Only gold, threads and dust exceed 1.0.

STYLE (so the world can match)
  GLAZE = biscuit seen through absorbing glass: uBiscuit * exp(-t * uAbsorb / max(N.V, 0.6)), 22 percent
  milk of palette[0]; thickness t = (0.46 - 1.6 * relief(p) + run) * smoothstep(0, 2.5 m, edge distance),
  relief() (RELIEF_GLSL: throwing spiral at 6 m pitch + the lotus petal band r 604-776 m) being a function of
  the bowl-space horizontal position only. Under-glaze layers are multiplies sampled at p shifted by the
  tangent view vector: fish at 0.5 m, crackle at 0.3 and 0.12 m (F2-F1 of a warped jittered lattice, 1.9 m
  and 0.45 m). Light = wrapped diffuse squared from key and fill, a 3 m peach lip by edge distance, Fresnel
  analytic sky, one ^25 highlight capped at 0.27; output capped at 0.86. BISCUIT = unshared flat facets,
  value-noise grain, a 0.35 m green glass line at the top, peach up-light growing down the wall. GOLD =
  half-round ribbons, F0 (1, .77, .3) on a warmed, darkened sky, ridge occlusion, ^180 highlight * 6,
  0.25 m sparkle facets, ember emissive only at the molten front. skyCol() in LIGHT_GLSL is the sky to copy.
*/

const R_BOWL = 1600, TIP_R = 540, TIP_Y = R_BOWL - Math.sqrt(R_BOWL * R_BOWL - TIP_R * TIP_R); // 93.9
const LEN = 240, HALF_W = 55, THICK = 9;
const CHIP = { x: -58, z: -250, r: 8.6 };          // world (58, ~212, 790): beside the base's corner on the flight side, level with the base edge
// The rivers: cracks that star out from the gap toward the flight's side of the wall. Rays leave RIVER_APEX (local,
// inside the gap near its tip) at RIVER_THETA degrees (0 = straight down the wall, + toward the flight); the world
// lays one shard site on each RIVER_PHI direction, so every ray is the shared edge of two wedge shards.
const RIVER_APEX = { x: -2, z: -45 }, RIVER_R = 1.55;
const RIVER_PHI = [-80, -50, -25, -6, 5, 11, 17, 23, 29.5, 37, 46, 58, 80, 97, 120, 139];   // closest together where the flight climbs
const RIVER_THETA = RIVER_PHI.slice(1).map((p, i) => (p + RIVER_PHI[i]) / 2);
const DEFAULT_PALETTE = ['#A9C9B4', '#DCE9DC', '#6E9C8A', '#EFE7DA', '#D8A53A', '#A8402E', '#F3C9A8'];

// local surface point of the bowl over horizontal (x, z); n = inward (glazed side) unit normal
function capPoint(x, z, out = new THREE.Vector3()) {
  const zz = TIP_R - z, h = Math.sqrt(Math.max(1, R_BOWL * R_BOWL - x * x - zz * zz));
  return out.set(x, (R_BOWL - TIP_Y) - h, z);
}
function capNormal(x, z, out = new THREE.Vector3()) {
  const zz = TIP_R - z, h = Math.sqrt(Math.max(1, R_BOWL * R_BOWL - x * x - zz * zz));
  return out.set(-x, h, zz).multiplyScalar(1 / R_BOWL); // toward the sphere centre
}
const hash1 = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

// The break line of the gap: one closed polyline in the horizontal plane, built ONCE; the Shard's edge, the
// collar's inner edge, the gold seam and the threads all read it, so the seated edges meet exactly.
function buildOutline(rng) {
  const a1 = rng.range(-1, 1), a2 = rng.range(-1, 1), a3 = rng.range(0, 6.28), a4 = rng.range(0, 6.28);
  const vMax = rng.range(0.66, 0.72), baseW = rng.range(0.6, 0.7), notch = rng.range(4, 11) * rng.sign();
  const tri = (x) => Math.abs(((x % 1) + 1) % 1 - 0.5) * 2 - 0.5;
  const halfW = (v, side) => {
    let w = v < vMax ? Math.sin(Math.PI * 0.5 * Math.pow(v / vMax, 1.25)) : 1 - (1 - baseW) * Math.pow((v - vMax) / (1 - vMax), 1.7);   // a lance: long point, shoulders, a broad base
    w *= HALF_W;
    const env = smoothstep(0.0, 0.16, v);                     // keep the tip a clean point
    w += env * (3.2 * tri(v * 2.3 + a3 * side + 0.3 * side) + 1.8 * tri(v * 6.1 + a4 * side)); // straight runs with kinks
    w += env * 2.5 * (side > 0 ? a1 : a2) * Math.sin(v * 3.1 + 1.0);
    return Math.max(w, 0.0);
  };
  const raw = [];
  const M = 220;
  for (let i = 0; i <= M; i++) { const v = i / M; raw.push([halfW(v, 1), -v * LEN]); }           // +x flank, tip -> base
  const wb = raw[raw.length - 1][0], wb2 = halfW(1, -1);
  for (let i = 1; i < 24; i++) {                                                                  // base edge with a jag
    const t = i / 24, x = lerp(wb, -wb2, t);
    raw.push([x, -LEN + notch * Math.max(0, 1 - Math.abs(t - 0.45) * 3.2) + 2.0 * tri(t * 2.7 + a3)]);
  }
  for (let i = M; i >= 1; i--) { const v = i / M; raw.push([-halfW(v, -1), -v * LEN]); }          // -x flank, base -> tip
  // resample at even spacing, then jitter by a hash of position (never the tip)
  const cum = [0]; for (let i = 1; i <= raw.length; i++) { const a = raw[i - 1], b = raw[i % raw.length]; cum.push(cum[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1])); }
  const total = cum[raw.length], N = Math.round(total / 2.3), pts = [];
  let j = 0;
  for (let i = 0; i < N; i++) {
    const s = (i / N) * total; while (cum[j + 1] < s) j++;
    const a = raw[j], b = raw[(j + 1) % raw.length], t = (s - cum[j]) / Math.max(1e-6, cum[j + 1] - cum[j]);
    let x = lerp(a[0], b[0], t), z = lerp(a[1], b[1], t);
    if (i > 2 && i < N - 2) { const h = x * 3.7 + z * 1.3; x += (hash1(h) - 0.5) * 1.3; z += (hash1(h + 9.1) - 0.5) * 1.3; }
    pts.push({ x, z });
  }
  // arc length along the seam from the tip, each flank separately (s), and which flank
  let iBase = 0, best = 1e9;
  pts.forEach((p, i) => { const d = Math.hypot(p.x - CHIP.x, p.z - CHIP.z); if (d < best) { best = d; iBase = i; } });   // the beads meet at the base corner nearest the chip
  let s = 0; pts[0].s = 0; pts[0].flank = 1;
  for (let i = 1; i <= iBase; i++) { s += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z); pts[i].s = s; pts[i].flank = 1; }
  const L1 = s; s = 0;
  for (let i = N - 1; i > iBase; i--) { const q = pts[(i + 1) % N]; s += Math.hypot(pts[i].x - q.x, pts[i].z - q.z); pts[i].s = s; pts[i].flank = -1; }
  return { pts, N, iBase, L1, L2: s, total };
}

// ---------- geometry helpers ----------
class Buf {
  constructor() { this.pos = []; this.nor = []; this.info = []; this.w = []; this.idx = []; this.n = 0; }
  vert(p, n, i0, i1, i2, i3, w) { this.pos.push(p.x, p.y, p.z); this.nor.push(n.x, n.y, n.z); this.info.push(i0, i1, i2, i3); this.w.push(w); return this.n++; }
  quad(a, b, c, d) { this.idx.push(a, b, c, b, d, c); }
  geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3));
    g.setAttribute('aInfo', new THREE.Float32BufferAttribute(this.info, 4));
    g.setAttribute('aW', new THREE.Float32BufferAttribute(this.w, 1));
    g.setIndex(this.idx);
    return g;
  }
  async geometryAsync(tick) {                      // the same, one attribute per step (each is a big array copy)
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3)); await tick();
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3)); await tick();
    g.setAttribute('aInfo', new THREE.Float32BufferAttribute(this.info, 4)); await tick();
    g.setAttribute('aW', new THREE.Float32BufferAttribute(this.w, 1)); await tick();
    g.setIndex(this.idx); await tick();
    return g;
  }
}
// distance from (x, z) to a closed polyline of {x, z}, searched in an index window round a hint
function polyDist(poly, x, z, hint, win) {
  const N = poly.length; let best = 1e9;
  for (let o = -win; o <= win; o++) {
    const a = poly[((hint + o) % N + N) % N], b = poly[((hint + o + 1) % N + N) % N];
    const ex = b.x - a.x, ez = b.z - a.z, t = clamp(((x - a.x) * ex + (z - a.z) * ez) / Math.max(1e-6, ex * ex + ez * ez), 0, 1);
    const d = Math.hypot(x - a.x - ex * t, z - a.z - ez * t); if (d < best) best = d;
  }
  return best;
}

// Glazed skins (top and underside) of the Shard and of the collar, as two structured ring grids that both
// start on the shared outline. aInfo = (edge distance d, distance to the GAP edge, tint hash, side +1 top/-1 under)
async function buildGlaze(outline, rng, glaze, tick) {
  const { pts, N } = outline, P = new THREE.Vector3(), Nn = new THREE.Vector3(), Q = new THREE.Vector3();
  // --- set seams of the collar: columns where two wall shards were already joined
  const seamCols = []; const nSeam = rng.int(7, 9);
  for (let j = 0; j < nSeam; j++) seamCols.push(Math.round(((j + rng.range(0.25, 0.75)) / nSeam) * N) % N);
  seamCols.sort((a, b) => a - b);
  const nearChip = (a, b, r) => {
    const ex = b.x - a.x, ez = b.z - a.z, t = clamp(((CHIP.x - a.x) * ex + (CHIP.z - a.z) * ez) / Math.max(1e-6, ex * ex + ez * ez), 0, 1);
    return Math.hypot(CHIP.x - a.x - ex * t, CHIP.z - a.z - ez * t) < r;
  };
  // --- collar outer outline: each wall shard ends in straight fracture runs between corners (one corner at each
  // seam, one or two kinks between), fanned outward from a short spine. Angular, never rounded.
  const fan = (i, D) => {
    const p = pts[i], sz = clamp(p.z, -168, -72), dx = p.x, dz = p.z - sz, l = Math.max(1e-3, Math.hypot(dx, dz));
    const k = D * (1 - 0.3 * smoothstep(-40, 0, p.z));                // a little shorter below the tip
    return { x: p.x + dx / l * k, z: p.z + dz / l * k };
  };
  const corners = [];
  for (let j = 0; j < nSeam; j++) {
    const c0 = seamCols[j], c1 = seamCols[(j + 1) % nSeam] + (j === nSeam - 1 ? N : 0), nk = rng.int(1, 2);
    corners.push({ i: c0, q: fan(c0, rng.range(62, 118)) });
    for (let m = 1; m <= nk; m++) { const ci = Math.round(lerp(c0, c1, (m + rng.range(-0.25, 0.25)) / (nk + 1))); corners.push({ i: ci, q: fan(ci % N, rng.range(70, 128)) }); }
  }
  const outer = pts.map((p, i) => {
    let a = corners[corners.length - 1], b = corners[0], ia = a.i - N, ib = b.i;
    for (let c = 0; c < corners.length; c++) {
      const c1 = corners[c], c2 = corners[(c + 1) % corners.length], i2 = c + 1 < corners.length ? c2.i : c2.i + N;
      if (i >= c1.i && i < i2) { a = c1; b = c2; ia = c1.i; ib = i2; break; }
    }
    const t = (i - ia) / Math.max(1, ib - ia), h = i * 0.37;
    return { x: lerp(a.q.x, b.q.x, t) + (hash1(h) - 0.5) * 1.5, z: lerp(a.q.z, b.q.z, t) + (hash1(h + 4.2) - 0.5) * 1.5 };
  });
  for (const q of outer) {                                  // the chip lies well inside the collar
    const dx = q.x - CHIP.x, dz = q.z - CHIP.z, l = Math.hypot(dx, dz);
    if (l < 34) { const k = 34 / Math.max(l, 1e-3); q.x = CHIP.x + dx * k; q.z = CHIP.z + dz * k; }
  }
  for (let j = 0; j < nSeam; j++) { let g = 0; while (g++ < 12 && nearChip(pts[seamCols[j]], outer[seamCols[j]], 22)) seamCols[j] = (seamCols[j] + 9) % N; }
  seamCols.sort((a, b) => a - b);
  const sector = (i) => { let s = 0; for (const c of seamCols) if (i >= c) s++; return s % nSeam; };
  const tints = Array.from({ length: nSeam }, () => rng());

  const addRing = async (K, tOf, inner, outerPt, w, dOf, tintOf) => {
    const cache = new Float32Array(N * (K + 1) * 2);          // edge distances, worked out once for both skins
    for (const side of [1, -1]) {
      const base = glaze.n;
      for (let i = 0; i < N; i++) for (let k = 0; k <= K; k++) {
        if (k === 0 && (i & 7) === 0) await tick();
        const t = tOf(k / K), a = inner[i], b = outerPt(i), x = lerp(a.x, b.x, t), z = lerp(a.z, b.z, t);
        capPoint(x, z, P); capNormal(x, z, Nn);
        const ci = (i * (K + 1) + k) * 2; let d, dGap;
        if (side > 0) { [d, dGap] = dOf(x, z, i, t); cache[ci] = d; cache[ci + 1] = dGap; } else { d = cache[ci]; dGap = cache[ci + 1]; }
        if (side < 0) { P.addScaledVector(Nn, -THICK); Nn.multiplyScalar(-1); }
        glaze.vert(P, Nn, d, dGap, tintOf(i), side, w);
      }
      for (let i = 0; i < N; i++) for (let k = 0; k < K; k++) {
        const a = base + i * (K + 1) + k, b = base + ((i + 1) % N) * (K + 1) + k;
        glaze.quad(a, b, a + 1, b + 1);
      }
    }
  };
  // Shard: outline -> spine
  const shardTint = rng();
  await addRing(24, (t) => Math.pow(t, 1.55), pts, (i) => ({ x: 0, z: clamp(pts[i].z, -LEN + 28, -34) }), 1,
    (x, z, i, t) => { const d = t <= 0 ? 0 : polyDist(pts, x, z, i, 46); return [d, d]; }, () => shardTint);
  // Collar: outline -> outer outline (rows gathered at both rims)
  await addRing(26, (t) => { const e = t * t * (3 - 2 * t); return lerp(t, e, 0.72); }, pts, (i) => outer[i], 0,
    (x, z, i, t) => {
      const dIn = t <= 0 ? 0 : polyDist(pts, x, z, i, 30), dOut = t >= 1 ? 0 : polyDist(outer, x, z, i, 30);
      return [Math.min(dIn, dOut), dIn];
    }, (i) => tints[sector(i)]);
  return { outer, seamCols };
}

// chip rim radius (the same expression is in the GLSL: keep them in step)
const chipR = (th) => CHIP.r + 0.45 * Math.sin(3 * th + 1.3) + 0.25 * Math.sin(7 * th + 4.1);

// Biscuit cliffs: every break shows 9 m of thickness. Unshared, flat-shaded, chipped facets.
// aInfo = (depth down the wall 0..9, up-light source 0 gap / 1 always open, facet hash, column hash)
async function buildBiscuit(outline, outer, bis, tick) {
  const DEPTH = [0, 0.45, 1.9, 3.6, 5.4, 7.2, THICK], top = new THREE.Vector3(), n = new THREE.Vector3();
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), fn = new THREE.Vector3(), o = new THREE.Vector3();
  const wall = (ring, outSign, w, flag, salt, taper = 0, cx = 0, cz = 0) => {
    const N = ring.length, grid = [], outs = [];
    for (let i = 0; i < N; i++) {
      const p = ring[i], q0 = ring[(i + N - 1) % N], q1 = ring[(i + 1) % N];
      let tx = q1.x - q0.x, tz = q1.z - q0.z; const tl = Math.max(1e-4, Math.hypot(tx, tz)); tx /= tl; tz /= tl;
      const ox = -tz * outSign, oz = tx * outSign;                  // horizontal direction the cliff faces
      outs.push([ox, oz]);
      const col = [];
      for (let r = 0; r < DEPTH.length; r++) {
        const mid = r > 0 && r < DEPTH.length - 1 ? 1 : 0, h = i * 12.9898 + r * 78.233 + salt;
        // chips: a deep bite now and then plus fine jitter; none on the top row so the glaze rim stays true
        const bite = hash1(h * 0.31) > 0.82 ? -0.5 * hash1(h + 3.3) : 0;
        const j = mid * ((hash1(h) - 0.5) * 0.45 + bite) + (r === 1 ? -0.12 : 0), sl = mid * (hash1(h + 5.7) - 0.5) * 0.5;
        const k = 1 - taper * (DEPTH[r] / THICK);
        const x = cx + (p.x - cx) * k, z = cz + (p.z - cz) * k;
        capPoint(x, z, top); capNormal(x, z, n);
        const pv = new THREE.Vector3(top.x + ox * j + tx * sl - n.x * DEPTH[r], top.y - n.y * DEPTH[r], top.z + oz * j + tz * sl - n.z * DEPTH[r]);
        pv.nrm = new THREE.Vector3(ox, 0.03, oz).normalize();          // a smooth wall normal: the chips are cut in the shader, not by the mesh
        col.push(pv);
      }
      grid.push(col);
    }
    for (let i = 0; i < N; i++) for (let r = 0; r < DEPTH.length - 1; r++) {
      const i1 = (i + 1) % N, flip = (i + r) & 1;
      const tris = flip ? [[grid[i][r], grid[i1][r], grid[i1][r + 1], r, r, r + 1], [grid[i][r], grid[i1][r + 1], grid[i][r + 1], r, r + 1, r + 1]]
        : [[grid[i][r], grid[i1][r], grid[i][r + 1], r, r, r + 1], [grid[i1][r], grid[i1][r + 1], grid[i][r + 1], r, r + 1, r + 1]];
      tris.forEach((t, ti) => {
        a.copy(t[0]); b.copy(t[1]); c.copy(t[2]);
        fn.subVectors(b, a).cross(o.subVectors(c, a));
        if (fn.lengthSq() < 1e-10) fn.set(outs[i][0], 0.1, outs[i][1]);
        fn.normalize(); if (fn.x * outs[i][0] + fn.z * outs[i][1] < 0) fn.multiplyScalar(-1);
        const fh = hash1(i * 3.17 + r * 9.7 + ti * 1.9 + salt), ch = hash1(i * 0.71 + salt);
        const v0 = bis.vert(a, t[0].nrm, DEPTH[t[3]], flag, fh, ch, w), v1 = bis.vert(b, t[1].nrm, DEPTH[t[4]], flag, fh, ch, w), v2 = bis.vert(c, t[2].nrm, DEPTH[t[5]], flag, fh, ch, w);
        bis.idx.push(v0, v1, v2);
      });
    }
  };
  wall(outline.pts, 1, 1, 0, 0.0);          // the Shard's own edge (faces out of the Shard)
  await tick();
  wall(outline.pts, -1, 0, 0, 41.0);        // the gap's wall (faces into the gap)
  await tick();
  wall(outer, 1, 0, 1, 97.0);               // the collar's outer break
  await tick();
  const ring = []; const NC = 44;
  for (let i = 0; i < NC; i++) { const th = (i / NC) * Math.PI * 2, r = chipR(th); ring.push({ x: CHIP.x + Math.cos(th) * r, z: CHIP.z + Math.sin(th) * r }); }
  wall(ring, 1, 0, 1, 133.0, 0.18, CHIP.x, CHIP.z);   // the chip: a spall narrowing with depth
}

// Gold: half-round ribbons. position = centre line on the glazed surface; the vertex shader swells the
// section. aGold = (s: metres from the seam's low end in "front" units, type 0 set / 1 live, phi, base radius)
async function buildGold(outline, outer, seamCols, rng, tick) {
  const pos = [], nor = [], acr = [], gold = [], idx = []; let n = 0;
  const P = new THREE.Vector3(), Nn = new THREE.Vector3(), T = new THREE.Vector3(), A = new THREE.Vector3(), Pn = new THREE.Vector3();
  const SEG = 8;
  const ribbon = (line, closed) => {     // line: [{x, z, s, type, r}]
    const M = line.length, base = n;
    for (let i = 0; i < M; i++) {
      const p = line[i], a = line[closed ? (i + M - 1) % M : Math.max(0, i - 1)], b = line[closed ? (i + 1) % M : Math.min(M - 1, i + 1)];
      capPoint(p.x, p.z, P); capNormal(p.x, p.z, Nn); capPoint(a.x, a.z, T); capPoint(b.x, b.z, Pn);
      T.subVectors(Pn, T); if (T.lengthSq() < 1e-8) T.set(0, 0, -1); T.normalize();
      A.crossVectors(Nn, T).normalize();
      for (let j = 0; j <= SEG; j++) {
        const phi = (j / SEG - 0.5) * Math.PI;
        pos.push(P.x, P.y, P.z); nor.push(Nn.x, Nn.y, Nn.z); acr.push(A.x, A.y, A.z); gold.push(p.s, p.type, phi, p.r); n++;
      }
    }
    const last = closed ? M : M - 1;
    for (let i = 0; i < last; i++) for (let j = 0; j < SEG; j++) {
      const a = base + i * (SEG + 1) + j, b = base + ((i + 1) % M) * (SEG + 1) + j;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  };
  const { pts, N, L1, L2 } = outline, LM = 300;
  // 1. the live seam round the Shard: both flanks measured from the tip in the same units, so the beads meet
  ribbon(pts.map((p) => ({ x: p.x, z: p.z, s: (p.s / (p.flank > 0 ? L1 : L2)) * LM, type: 1, r: 2.5 })), true);
  // 2. the crack from the seam to the chip, and the chip's rim (it stays open, edged in gold)
  let iNear = 0, best = 1e9;
  pts.forEach((p, i) => { const d = Math.hypot(p.x - CHIP.x, p.z - CHIP.z); if (d < best) { best = d; iNear = i; } });
  const th0 = Math.atan2(pts[iNear].z - CHIP.z, pts[iNear].x - CHIP.x), r0 = chipR(th0) + 0.7, linkLen = Math.max(1, best - r0), link = [];
  const LK = Math.max(3, Math.round(linkLen / 1.2));
  for (let i = 0; i <= LK; i++) {
    const t = i / LK, wob = Math.sin(t * Math.PI) * (hash1(i * 1.7) - 0.5) * 1.6;
    link.push({ x: lerp(pts[iNear].x, CHIP.x + Math.cos(th0) * r0, t) - Math.sin(th0) * wob, z: lerp(pts[iNear].z, CHIP.z + Math.sin(th0) * r0, t) + Math.cos(th0) * wob, s: LM + t * linkLen, type: 1, r: 1.3 });
  }
  await tick(); ribbon(link, false);
  const rim = []; const NR = 56;
  for (let i = 0; i < NR; i++) {
    const th = th0 + (i / NR) * Math.PI * 2, r = chipR(th) + 0.75, arc = Math.min(i, NR - i) / NR * Math.PI * 2 * CHIP.r;
    rim.push({ x: CHIP.x + Math.cos(th) * r, z: CHIP.z + Math.sin(th) * r, s: LM + linkLen + arc, type: 1, r: 1.05 });
  }
  ribbon(rim, true); await tick();
  const sTotal = LM + linkLen + Math.PI * CHIP.r;
  // 3. set seams of the collar (already mended: cold gold, raised and mostly dark)
  for (const c of seamCols) {
    const a = pts[c], b = outer[c], len = Math.hypot(b.x - a.x, b.z - a.z), M = Math.max(4, Math.round(len / 2.6)), line = [];
    const px = -(b.z - a.z) / len, pz = (b.x - a.x) / len, f1 = rng.range(1.2, 2.6), f2 = rng.range(0, 6.28), amp = rng.range(2.5, 6), r = rng.range(0.7, 1.25);
    for (let i = 0; i <= M; i++) {
      const t = i / M, tri = Math.abs(((t * f1 + f2) % 1) - 0.5) * 2 - 0.5;       // straight runs with kinks
      const off = Math.sin(t * Math.PI) * (amp * tri + (hash1(c + i * 0.9) - 0.5) * 1.1);
      line.push({ x: lerp(a.x, b.x, t) + px * off, z: lerp(a.z, b.z, t) + pz * off, s: t * len, type: 0, r: r * (0.85 + 0.3 * hash1(i * 0.37 + c)) * 1.45 * (0.05 + 0.95 * smoothstep(0, 0.09, Math.min(t, 1 - t))) });   // thinning to a point at both ends
    }
    ribbon(line, false); await tick();
  }
  // 4. the rivers: cracks that star out from the gap (rays from RIVER_APEX). Across the collar each is a fat seam
  // whose gold runs from the collar's outer break up to the gap rim in its own window of u (type 2 + k; s is
  // measured from the OUTER end); the world continues each ray across the wall as a real break between shards.
  const hit = (poly, dx, dz, tMin) => {                 // nearest crossing of the ray with a closed polyline beyond tMin
    let best = 1e9;
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length], ex = b.x - a.x, ez = b.z - a.z, den = dx * ez - dz * ex;
      if (Math.abs(den) < 1e-9) continue;
      const t = ((a.x - RIVER_APEX.x) * ez - (a.z - RIVER_APEX.z) * ex) / den, w = ((a.x - RIVER_APEX.x) * dz - (a.z - RIVER_APEX.z) * dx) / den;
      if (w >= 0 && w <= 1 && t > tMin && t < best) best = t;
    }
    return best;
  };
  const rivers = [];
  await tick();
  RIVER_THETA.forEach((deg, k) => {
    const th = deg * Math.PI / 180, dx = -Math.sin(th), dz = Math.cos(th), tG = hit(pts, dx, dz, 0.5), tO = hit(outer, dx, dz, tG + 4);
    if (tG > 1e8 || tO > 1e8) { rivers.push(null); return; }
    const len = tO - tG, M = Math.max(6, Math.round(len / 2.2)), line = [], f1 = 1.3 + 1.2 * hash1(k * 3.1), f2 = hash1(k * 7.7), amp = 1.5 + 2.5 * hash1(k * 1.9);
    for (let i = 0; i <= M; i++) {
      const t = i / M, tri = Math.abs(((t * f1 + f2) % 1) - 0.5) * 2 - 0.5, off = Math.sin(t * Math.PI) * (amp * tri + (hash1(k * 5.3 + i * 0.9) - 0.5) * 0.9), d = lerp(tG, tO, t);
      const mouth = 1 - 0.45 * smoothstep(0.08, 0.0, t);                      // it narrows into the gap rim rather than ending square
      line.push({ x: RIVER_APEX.x + dx * d - dz * off, z: RIVER_APEX.z + dz * d + dx * off, s: (1 - t) * len, type: 2 + k, r: RIVER_R * mouth * (0.92 + 0.16 * hash1(i * 0.37 + k)) });
    }
    ribbon(line, false);
    rivers.push({ theta: deg, len, inner: [RIVER_APEX.x + dx * tG, RIVER_APEX.z + dz * tG], outer: [RIVER_APEX.x + dx * tO, RIVER_APEX.z + dz * tO] });
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('aAcross', new THREE.Float32BufferAttribute(acr, 3));
  g.setAttribute('aGold', new THREE.Float32BufferAttribute(gold, 4));
  g.setIndex(idx);
  return { geometry: g, LM, sTotal, linkLen, iNear, rivers };
}

// 40 gold threads from the Shard's biscuit edge to the gap rim: instanced catenary ribbons.
function buildThreads(outline, rng, count = 40) {
  const SEG = 28, t = [], idx = [];
  for (let i = 0; i <= SEG; i++) { t.push(i / SEG, -1, i / SEG, 1); }
  for (let i = 0; i < SEG; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array((SEG + 1) * 6), 3));
  g.setAttribute('aT', new THREE.Float32BufferAttribute(t, 2));
  g.setIndex(idx);
  const A = [], B = [], rnd = [], P = new THREE.Vector3(), Nn = new THREE.Vector3();
  const { pts, N } = outline;
  // the first 40 draw from the seeded stream as they always did (so the rest of the world's seeded layout is unchanged);
  // the others take their numbers from a hash of their index
  let hk = 0; const rnd01 = (k) => (k < 40 ? rng() : hash1(k * 7.31 + (hk++) * 1.37));
  for (let k = 0; k < count; k++) {
    const r = (a, b) => a + (b - a) * rnd01(k);
    const i = Math.floor(((k < 40 ? (k + r(0.15, 0.85)) / 40 : (k - 40 + r(0.15, 0.85)) / Math.max(1, count - 40)) * N)) % N, p = pts[i];
    capPoint(p.x, p.z, P); capNormal(p.x, p.z, Nn);
    const dA = r(0.3, 1.2), dB = r(1.5, 7.5);
    A.push(P.x - Nn.x * dA, P.y - Nn.y * dA, P.z - Nn.z * dA);          // on the gap wall, just under the glaze
    B.push(P.x - Nn.x * dB, P.y - Nn.y * dB, P.z - Nn.z * dB);          // on the Shard's cliff (posed in the shader)
    rnd.push(rnd01(k), rnd01(k), rnd01(k), rnd01(k));
  }
  g.setAttribute('aA', new THREE.InstancedBufferAttribute(new Float32Array(A), 3));
  g.setAttribute('aB', new THREE.InstancedBufferAttribute(new Float32Array(B), 3));
  g.setAttribute('aRnd', new THREE.InstancedBufferAttribute(new Float32Array(rnd), 4));
  g.instanceCount = count;
  return g;
}

// Gold dust: sprites seeded along the seam. aDust = (s in front units, kind 0 bead wake / 1 seating puff /
// 2 pollen that drifts off the gap rim all the time, outward x, outward z)
function buildDust(outline, LM, rng, count) {
  const pos = [], nor = [], dust = [], rnd = [], P = new THREE.Vector3(), Nn = new THREE.Vector3();
  const { pts, N, L1, L2 } = outline;
  for (let k = 0; k < count; k++) {
    const i = rng.int(0, N - 1), p = pts[i], q = pts[(i + 1) % N], kind = k % 10 < 4 ? 0 : (k % 10 < 8 ? 1 : 2);
    let tx = q.x - p.x, tz = q.z - p.z; const l = Math.max(1e-4, Math.hypot(tx, tz)); tx /= l; tz /= l;
    const off = kind === 2 ? rng.range(-8, 3) : rng.range(-1.5, 1.5);
    capPoint(p.x - tz * off, p.z + tx * off, P); capNormal(p.x, p.z, Nn);
    pos.push(P.x, P.y, P.z); nor.push(Nn.x, Nn.y, Nn.z);
    dust.push((p.s / (p.flank > 0 ? L1 : L2)) * LM, kind, -tz, tx);
    rnd.push(rng(), rng(), rng(), rng());
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('aDust', new THREE.Float32BufferAttribute(dust, 4));
  g.setAttribute('aRnd', new THREE.Float32BufferAttribute(rnd, 4));
  return g;
}

// ---------- shaders ----------
const POSE_GLSL = /* glsl */`
uniform mat4 uPose;                       // open pose of the Shard; identity once seated, so nothing can drift
vec3 posePoint(vec3 p, float w) { return w > 0.5 ? (uPose * vec4(p, 1.0)).xyz : p; }
vec3 poseDir(vec3 d, float w) { return w > 0.5 ? mat3(uPose) * d : d; }
`;
const LIGHT_GLSL = /* glsl */`
uniform vec3 uGlowDir, uGlowCol, uFillCol, uPeach, uDeep, uHazeCol, uZenith, uRimSky;   // uDeep: the cloud sea's deeper colour
uniform float uUpLight, uHazeK, uOpen, uTime;
// analytic sky of the brief: dove zenith, paler rim line, one cream afterglow band, peach cloud sea below
vec3 skyCol(vec3 d) {
  float up = clamp(d.y, -1.0, 1.0);
  vec3 c = mix(uRimSky, uZenith, smoothstep(0.0, 0.7, up));
  vec2 dh = d.xz, gh = uGlowDir.xz;
  float az = dot(dh, gh) / max(length(dh) * length(gh), 1e-4);
  float bc = uGlowDir.y * 0.56, bu = (up - bc) / 0.034;                 // the band hugs the rim line: above it the sky is deep, so what stands up into it (the Shard) is drawn against the dark
  float band = smoothstep(0.3, 1.0, az) * (exp(-bu * bu) + 0.16 * exp(-abs(up - bc) * 12.0));
  c = mix(c, mix(uPeach, uDeep, 0.4) * 0.85, clamp(band * 0.85, 0.0, 1.0)) + uGlowCol * 0.12 * band;   // the afterglow: a warm band low on the sky, never a white haze
  vec3 below = mix(uPeach * 0.95, uDeep * 0.9, (1.0 - smoothstep(-0.9, 0.0, up)));
  return mix(c, below, (1.0 - smoothstep(-0.06, 0.03, up)));
}
vec3 haze(vec3 c, float dist) { return mix(c, uHazeCol, 1.0 - exp(-dist * uHazeK)); }
// THE KEY: the afterglow rakes the bowl, so the side turned toward it is lit celadon and the side turned away falls to
// dark jade. The bowl is shallow, so its lean is exaggerated (uBowlEx) to give the light something to grade across.
uniform float uBowlEx, uPool, uShade;
float litK(vec3 N) {
  vec3 Ne = normalize(vec3(N.x * uBowlEx, N.y, N.z * uBowlEx) + vec3(0.0, 1e-4, 0.0));
  float ndl = dot(Ne, uGlowDir);
  return mix(uShade, 1.0, smoothstep(-0.3, 0.85, ndl));
}
vec3 softCap(vec3 c, vec3 cap) { return cap * (vec3(1.0) - exp(-c / max(cap, vec3(1e-3)))); }
float hash21(vec2 p) { p = fract(p * vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.x); }
vec2 hash22(vec2 p) { vec3 q = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973)); q += dot(q, q.yzx + 33.33); return fract((q.xx + q.yz) * q.zy); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x), mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), f.x), f.y);
}
vec3 hash33(vec3 p) { p = fract(p * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yxz + 33.33); return fract((p.xxy + p.yxx) * p.zyx); }
// Broken fired clay: shell-shaped chips. Nearest of a jittered 3D lattice gives each chip its own tilt (xyz, -0.5..0.5)
// and w = how far inside the chip we are (0 at its edge). No derivatives, no textures: safe inside the loop.
vec4 chips(vec3 q) {
  vec3 ip = floor(q), fp = fract(q), best = vec3(0.0); float f1 = 9.0, f2 = 9.0;
  for (int k = -1; k <= 1; k++) for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec3 g = vec3(float(i), float(j), float(k)), o = hash33(ip + g), d = g + o - fp; float dd = dot(d, d);
    if (dd < f1) { f2 = f1; f1 = dd; best = d; } else if (dd < f2) { f2 = dd; }
  }
  return vec4(best, sqrt(max(f2, 0.0)) - sqrt(max(f1, 0.0)));          // xyz: from here to the middle of this chip
}
// Biscuit albedo and chipped normal in wall coordinates q (metres, seated), depth down the wall, fw = metres per pixel.
vec3 biscuitN(vec3 N, vec3 q, float fw, out float lipK, out float edgeK) {
  float f1 = 1.0 - smoothstep(0.25, 0.9, fw / 1.3), f2 = 1.0 - smoothstep(0.2, 0.7, fw / 0.34);
  vec3 qs = q * vec3(1.0, 1.8, 1.0) + 0.5 * vec3(vnoise(q.xz * 0.7), 0.0, vnoise(q.zx * 0.7 + 9.0));      // shells lie wider than tall, and never in rows
  vec4 c1 = chips(qs / 1.9 + 3.7), c2 = f2 > 0.01 ? chips(qs / 0.42 + 11.0) : vec4(0.0, 0.0, 0.0, 1.0);
  vec4 c0 = chips(qs / 4.7 + 1.3);                                    // the big scoops: a quarter of the wall's height, seen from far off
  float big = step(0.42, hash33(floor(qs / 4.7 + 1.3) + 5.0).x);     // only some of the wall broke that way
  vec3 tl = c1.xyz * 0.95 * f1 + c2.xyz * 0.6 * f2 + c0.xyz * 0.75 * big;                  // each chip is a shallow scoop: its wall leans toward its middle, with a sharp lip where two meet
  tl -= N * dot(tl, N);
  edgeK = max((1.0 - smoothstep(0.0, 0.05 + fw * 0.4, c1.w)) * f1 * step(0.55, c1.x + 0.5), (1.0 - smoothstep(0.0, 0.08 + fw * 1.5, c2.w)) * f2 * 0.5 * step(0.6, c2.x + 0.5));   // only some chips have a dark crack at their edge
  vec3 Nc = normalize(N + tl);
  lipK = clamp(Nc.y - N.y, -1.0, 1.0);
  return Nc;
}
// Fired clay in section: sandy grain, darker strata running the wall's length, iron specks, chips whose upper lips
// catch the sky and whose undersides take the peach of the cloud sea, deepening toward the bottom of the wall.
uniform vec3 uBiscuit;
vec3 biscuitShade(vec3 N, vec3 Nb, vec2 gp, float depth, float fw, float open, float lipK, float edgeK, float fh) {
  float g0 = vnoise(gp * 0.45), g1 = vnoise(gp * 3.3), g2 = vnoise(gp * 26.0) * (1.0 - smoothstep(0.012, 0.04, fw)), g3 = vnoise(gp * 9.0) * (1.0 - smoothstep(0.03, 0.12, fw));
  float sy = depth + 0.5 * g0 + 0.12 * g1;
  float strata = (1.0 - smoothstep(0.07, 0.22, abs(sy - 2.6))) + 0.8 * (1.0 - smoothstep(0.06, 0.18, abs(sy - 5.3))) + 0.7 * (1.0 - smoothstep(0.05, 0.16, abs(sy - 7.4)));
  strata *= 1.0 - smoothstep(0.14, 0.7, fw);
  float speck = step(0.88, vnoise(gp * 11.0)) * (1.0 - smoothstep(0.03, 0.1, fw));
  // THE LIGHT is capped first (the up-light is several times white, and a cap laid over the finished colour would
  // press every layer of the clay into one orange); the clay's own markings are multiplied in afterwards
  vec3 alb = uBiscuit * 0.72;
  float fd = Nb.y * 0.5 + 0.5;
  vec3 col = alb * (uGlowCol * 1.15 * litK(Nb) + uFillCol * (0.25 + 0.75 * fd * fd) * 1.1);
  float dk = clamp(depth / 9.0, 0.0, 1.6), dkc = clamp(dk, 0.0, 1.0);
  float upl = (0.3 + 0.75 * smoothstep(-0.25, 0.75, -Nb.y + 0.25) + 0.55 * dk) * open;      // the lower wall takes the light from below
  col = col * (1.0 - 0.35 * open) + alb * mix(uPeach, uDeep, 0.35 + 0.5 * dkc) * uUpLight * upl * 0.9;
  col = softCap(col, mix(vec3(1.05, 0.98, 0.92), mix(uPeach, uDeep, 0.75) * 0.9, clamp(open, 0.0, 1.0)));
  vec3 rel = vec3(0.84 + 0.13 * g1 + 0.14 * g2 + 0.1 * g3 + 0.06 * (fh - 0.5) - 0.06 * sin(sy * 2.3));
  rel *= 1.0 - 0.38 * clamp(strata, 0.0, 1.0);                        // darker strata running the wall's length
  rel = mix(rel, rel * vec3(0.55, 0.36, 0.28), speck * 0.8);           // iron specks
  rel *= mix(vec3(1.0), vec3(0.9, 0.96, 0.88), g0 * 0.6);
  rel *= 1.0 - 0.14 * edgeK;                                           // the crack between two chips
  rel *= mix(vec3(1.12, 1.1, 1.06), vec3(0.82, 0.68, 0.58), dkc * (0.4 + 0.6 * open));   // pale under the glass line, deep peach at the foot
  rel *= clamp(1.0 - 1.3 * lipK * open + 0.7 * lipK * (1.0 - open), 0.5, 1.5);          // a scoop's underside takes the peach, its upper lip loses it
  col = col * rel + alb * uFillCol * 0.6 * max(lipK, 0.0);             // and the upper lip catches the cooler sky
  return min(col, vec3(0.94));
}
`;

const GLAZE_VS = /* glsl */`
attribute vec4 aInfo; attribute float aW;
varying vec3 vPos, vN, vTx, vTz, vSeat; varying vec4 vInfo; varying float vW;
${POSE_GLSL}
#include <common>
#include <fog_pars_vertex>
void main() {
  vec3 n0 = normal;
  // the glazed top surface this vertex belongs to (undersides sit 9 m down the normal)
  vSeat = aInfo.w < 0.0 ? position - n0 * ${THICK.toFixed(1)} : position;
  vec3 up = aInfo.w < 0.0 ? -n0 : n0;
  vec3 tx = normalize(vec3(1.0, 0.0, 0.0) - up * up.x), tz = normalize(vec3(0.0, 0.0, 1.0) - up * up.z);
  mat3 m3 = mat3(modelMatrix);
  vN = normalize(m3 * poseDir(n0, aW)); vTx = normalize(m3 * poseDir(tx, aW)); vTz = normalize(m3 * poseDir(tz, aW));
  vec4 wp = modelMatrix * vec4(posePoint(position, aW), 1.0);
  vPos = wp.xyz; vInfo = aInfo; vW = aW;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

// relief(p): the carved surface in metres, a function of the unrolled bowl position only, so the petals on
// the Shard and their lower halves on the wall join exactly at seating. p = bowl-space horizontal (x, z).
const RELIEF_GLSL = /* glsl */`
const float PET_R0 = 604.0, PET_R1 = 776.0, PET_DA = 0.0418;
uniform float uCarve;                     // 1 on the bare visits: the lower wall is carved too
// one carved lotus petal band: v 0..1 from root to tip across the band, u = angle in petal widths
float petalH(float v, float u, float ring, float fine) {
  float uc = fract(u) - 0.5;
  float tip = clamp((v - 0.62) / 0.38, 0.0, 1.0);
  float hw = 0.46 * sqrt(max(1.0 - tip * tip, 0.0)) * (1.0 - 0.42 * tip * tip) * smoothstep(-0.02, 0.1, v) * (0.72 + 0.28 * smoothstep(0.0, 0.45, v));
  float e = hw - abs(uc);                                           // + inside the petal (petal widths)
  float inside = smoothstep(0.0, 0.07, e);
  float body = inside * (0.16 + 0.2 * smoothstep(0.0, 0.3, e));     // a low dome
  float groove = exp(-e * e / 0.0011) * step(0.0, v) * step(v, 1.0); // the knife cut round each petal
  float rib = exp(-uc * uc / 0.0007) * inside;
  float comb = (0.5 + 0.5 * cos(6.2831853 * (uc * 9.0 + 0.3 * sin(v * 5.0)))) * inside * smoothstep(0.02, 0.12, e) * fine * (0.4 + 0.6 * smoothstep(0.05, 0.8, v));
  return -0.03 * ring * fine * inside + body - 0.42 * groove + 0.13 * rib - 0.1 * comb;   // carving cuts most of the throwing rings away
}
const float REG_H = 0.5;                  // how deep the register under the gap is cut, against the petal band's own depth
// the lappets lie where the glaze has little to spare over what shows under it, so nothing of a lappet stands proud:
// a lappet is its knife cut alone, an incised outline, and the wall inside it is the wall as it was
// the knife cut alone, round the same outline as petalH draws: negative metres, the band's own depth
float petalCut(float v, float u) {
  float uc = fract(u) - 0.5, tip = clamp((v - 0.62) / 0.38, 0.0, 1.0);
  float e = 0.46 * sqrt(max(1.0 - tip * tip, 0.0)) * (1.0 - 0.42 * tip * tip) * smoothstep(-0.02, 0.1, v) * (0.72 + 0.28 * smoothstep(0.0, 0.45, v)) - abs(uc);
  return -0.42 * exp(-e * e / 0.0011) * step(0.0, v) * step(v, 1.0);
}
float relief(vec2 p, float fine) {
  float r = length(p), a = atan(p.x, max(p.y, 1.0));
  float ring = sin(6.2831853 * (r / 6.0) + a);                        // throwing rings, one spiral, 6 m pitch
  float h = 0.03 * ring * fine * (0.35 + 0.65 * sin(r * 0.037 + 2.0 * sin(a * 9.0)) * sin(r * 0.037 + 2.0 * sin(a * 9.0))) + 0.03 * sin(r * 0.21 + 1.3 + 3.0 * sin(a * 5.0 + r * 0.011));   // a broad swell, wandering so it never reads as even bands
  float v = (r - PET_R0) / (PET_R1 - PET_R0);
  if (v > -0.05 && v < 1.05) h += petalH(v, a / PET_DA, ring, fine);
  // the well of the bowl carries its own ring of forty petals round the centre (the low pass crosses it)
  float v2 = (r - 94.0) / 102.0;
  if (v2 > -0.05 && v2 < 1.05) h += petalH(v2, atan(p.x, p.y) / 0.15707963 + 0.5, ring, fine);
  float v4 = (r - 285.0) / 155.0;                                     // the bare ware: thirty-six great petals round the lower wall
  if (uCarve > 0.5 && v4 > -0.05 && v4 < 1.05) h += petalH(v4, atan(p.x, p.y) / 0.17453293 + 0.25, ring, fine);
  float v3 = (r - 26.0) / 60.0;                                       // and a heart of sixteen: a double lotus under the crossing
  if (v3 > -0.05 && v3 < 1.05) h += petalH(v3, atan(p.x, p.y) / 0.39269908, ring, fine);
  // lappets under the rim: 132 carved petals hanging tip down on the plain wall between the petal band and the rim
  float v5 = (950.0 - r) / 104.0;
  if (v5 > -0.05 && v5 < 1.05) h += petalCut(v5, atan(p.x, p.y) / 0.04759989);   // the knife cut of the band's full depth, nothing inside it
  // and a register of 180 forty-metre petals below the gap, their tips 4 m short of the Shard's own
  float v6 = (r - 496.0) / 40.0;
  if (v6 > -0.05 && v6 < 1.05) h += REG_H * petalH(v6, atan(p.x, p.y) / 0.03490659 + 0.5, 0.0, fine);
  return h;
}`;

const GLAZE_FS = /* glsl */`
precision highp float;
varying vec3 vPos, vN, vTx, vTz, vSeat; varying vec4 vInfo; varying float vW;
uniform vec3 uCopper, uCrackCol, uAbsorb, uMilk, uPig;
uniform float uCraze, uFishScale, uRare, uPigMix;
${LIGHT_GLSL}
${RELIEF_GLSL}
#include <fog_pars_fragment>
// F2 - F1 of a jittered lattice: thin where two crackle cells meet. No derivatives in here.
vec2 crackle(vec2 p) {
  vec2 ip = floor(p), fp = fract(p); float f1 = 9.0, f2 = 9.0, id = 0.0;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 g = vec2(float(i), float(j)), o = hash22(ip + g), d = g + o - fp; float dd = dot(d, d);
    if (dd < f1) { f2 = f1; f1 = dd; id = hash21(ip + g + 7.3); } else if (dd < f2) { f2 = dd; }
  }
  return vec2(sqrt(max(f2, 0.0)) - sqrt(max(f1, 0.0)), id);
}
// copper-red brush dabs living under the glaze: round head, comma tail. q in metres (along shoal flow, across)
vec2 fish(vec2 q, float t) {
  vec2 cell = floor(q / 6.0), f = q / 6.0 - cell; vec2 m = vec2(0.0);
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 g = vec2(float(i), float(j)), c = cell + g, h = hash22(c + 3.1);
    float present = step(0.36, hash21(c * 1.7 + 11.0));
    vec2 ctr = g + 0.2 + 0.6 * h + 0.06 * vec2(sin(t * 0.7 + h.x * 40.0), cos(t * 0.9 + h.y * 40.0));
    vec2 d = (f - ctr) * 6.0;                                   // metres from this fish
    float len = 1.3 + 1.2 * h.y, ang = (h.x - 0.5) * 0.9 + 0.25 * sin(t * 0.5 + h.y * 20.0);
    float ca = cos(ang), sa = sin(ang);
    vec2 l = vec2(ca * d.x + sa * d.y, -sa * d.x + ca * d.y) / len;   // x along the body (head at +0.3), unit = body length
    float bend = 0.16 * sin(l.x * 4.0 - t * 3.2 + h.x * 30.0) * (1.0 - smoothstep(-0.6, 0.25, l.x));
    float w = 0.27 * smoothstep(-0.72, 0.18, l.x) + 0.03 * (1.0 - smoothstep(-0.7, -0.35, l.x)) * smoothstep(-0.78, -0.7, l.x) * 3.0;
    float ay = abs(l.y - bend), ends = smoothstep(-0.82, -0.7, l.x) * (1.0 - step(0.28, l.x));
    float hd = length(vec2(l.x - 0.28, l.y - bend));              // the head: one round press of the brush
    float body = max((1.0 - smoothstep(w - 0.13, w + 0.03, ay)) * ends, 1.0 - smoothstep(0.07, 0.23, hd));
    float halo = max((1.0 - smoothstep(w - 0.05, w + 0.22, ay)) * ends, 1.0 - smoothstep(0.15, 0.42, hd));
    m = max(m, vec2(body, halo) * present);
  }
  return m;
}
void main() {
  float side = vInfo.w, top = step(0.0, side), skin = max(top, step(0.5, vW));   // the Shard is glazed and carved on both faces (a bowl's inside and outside)
  vec3 V = normalize(cameraPosition - vPos + vec3(0.0, 1e-4, 0.0));
  vec3 N0 = normalize(vN);
  float nv0 = dot(N0, V);
  // the chip: a round spall that stays open
  vec2 cq = vSeat.xz - vec2(${CHIP.x.toFixed(1)}, ${CHIP.z.toFixed(1)}); float cr = length(cq);
  float cth = cr > 0.01 ? atan(cq.y, cq.x) : 0.0;
  float crim = ${CHIP.r.toFixed(2)} + 0.45 * sin(3.0 * cth + 1.3) + 0.25 * sin(7.0 * cth + 4.1);
  float dChip = cr - crim * mix(0.82, 1.0, top);
  if (vW < 0.5 && dChip < 0.0) discard;
  float d = min(vInfo.x, mix(dChip, 1e3, step(0.5, vW)));
  float lipD = vInfo.y;
  // unrolled bowl position and the parallax of what lies under the glass
  vec2 pw = vec2(-vSeat.x, ${TIP_R.toFixed(1)} - vSeat.z);
  vec3 Tx = normalize(vTx), Tz = normalize(vTz);
  vec2 par = vec2(dot(V, Tx), dot(V, Tz)) / max(abs(nv0), 0.35);     // local xz slide per metre of depth
  float fw = max(length(fwidth(pw)), 1e-4);
  float fine = skin * (1.0 - smoothstep(0.25, 0.9, fw * 0.33)) * (0.25 + 0.75 * smoothstep(0.12, 0.55, abs(nv0)));   // rings and combing soften at grazing angles
  float h0 = relief(pw, fine) * skin;
  float e = clamp(fw * 1.2, 0.3, 4.0);
  float hx = relief(pw + vec2(e, 0.0), fine) * skin, hz = relief(pw + vec2(0.0, e), fine) * skin;
  vec2 grad = vec2(hx - h0, hz - h0) / e;                             // in pw axes = minus local axes
  vec3 N = normalize(N0 + (Tx * grad.x + Tz * grad.y) * 1.6);
  float nv = max(dot(N, V), 0.0);
  // glaze thickness: pools in grooves and ring troughs, runs out at every rim and break
  float tint = vInfo.z;
  float run = 0.16 * (1.0 - smoothstep(540.0, 800.0, length(pw))) + 0.2 * (vnoise(pw * 0.013 + tint * 9.0) - 0.5);   // glaze ran downhill before it set
  float t = clamp(0.46 - 1.6 * h0 + run + (tint - 0.5) * 0.14 + 0.07 * (vnoise(pw * 0.045) - 0.5), 0.1, 1.4) * smoothstep(0.0, 2.5, d);
  t += 0.5 * exp(-max(dChip, 0.0) / 15.0) * (1.0 - step(0.5, vW)) * smoothstep(0.0, 2.5, d);   // glaze ran thick round the spall: dim jade behind the portal
  float rOut = length(pw);
  t = mix(t, (0.6 + 0.3 * (vnoise(pw * 0.035) - 0.5) + 0.07 * sin(rOut * 1.0472)) * smoothstep(0.0, 2.5, d), 1.0 - skin);   // the outside of the bowl: plain, ring-marked
  float ta = min(t * (1.0 + uPool * smoothstep(0.5, 1.2, t)), 1.75);        // pooled glaze goes deep: dark jade in every groove and hollow
  vec3 base = uBiscuit * exp(-ta * uAbsorb / max(nv, 0.6));
  base = mix(base, uMilk * (0.82 + 0.3 * exp(-t * 1.2)), 0.14 * smoothstep(0.05, 0.4, t) * (1.0 - smoothstep(0.6, 1.1, t)));   // bubbles in the glass: celadon is milky where it lies thin
  // the rare visit: the Shard comes from another bowl, white porcelain painted in cobalt wave scales
  float rareK = uRare * step(0.5, vW);
  if (rareK > 0.5) {
    vec3 white = vec3(0.8, 0.83, 0.86) * exp(-t * vec3(0.3, 0.18, 0.08));
    vec2 pb = pw + vec2(dot(V, Tx), dot(V, Tz)) / max(abs(nv0), 0.35) * 0.4;
    float rb = length(pb), ab = atan(pb.x, max(pb.y, 1.0));
    vec2 sc = vec2(ab * 660.0, rb) / 13.0; float odd = mod(floor(sc.y), 2.0);
    vec2 cf = vec2(fract(sc.x + 0.5 * odd) - 0.5, fract(sc.y));
    float rad = length(cf), fwb = clamp(fw / 13.0, 0.0, 0.2);
    float arcs = (1.0 - smoothstep(0.07, 0.11 + fwb * 3.0, abs(fract(rad * 2.6) - 0.5))) * step(rad, 0.86);
    float wash = smoothstep(0.35, 0.75, vnoise(pb * 0.05 + 3.0)) * 0.45 + 0.25 * (1.0 - smoothstep(0.0, 0.3, rad));
    float bandB = 1.0 - smoothstep(1.2, 2.0, abs(d - 6.0));                       // a painted line 6 m inside the break
    float m = clamp(max(arcs * 0.9, bandB) + wash * 0.5, 0.0, 1.0) * smoothstep(0.12, 0.3, t);
    base = mix(white, vec3(0.045, 0.11, 0.4) * (0.65 + 0.5 * white), m * 0.88);
  }
  // under-glaze layers (multiplies), each at its own depth so they slide against each other
  float under = smoothstep(0.12, 0.3, t);
  vec2 pF = pw + par * 0.5, pC1 = pw + par * 0.3, pC2 = pw + par * 0.12;
  float rr = length(pF), aa = atan(pF.x, max(pF.y, 1.0)), band = floor(rr / 42.0);
  float dirn = mod(band, 2.0) * 2.0 - 1.0;
  vec2 q = vec2(aa * 660.0 + dirn * (uTime * (0.7 + 0.5 * hash21(vec2(band, 3.0)))), rr + 1.5 * sin(aa * 90.0 + uTime * 0.2));
  float shoal = smoothstep(0.37, 0.53, vnoise(q * 0.021 + vec2(band * 3.7, uTime * 0.01)));
  float fishFade = skin * under * (1.0 - smoothstep(0.12, 0.4, fw));
  float fm = 0.0;
  if (fishFade > 0.01 && shoal > 0.01) {
    vec2 qf = q * vec2(1.0, 0.62) / uFishScale;
    vec2 f2 = fish(qf, uTime);
    if (fw < 0.5) f2 = max(f2, fish(qf * 1.31 + vec2(17.3, 41.9), uTime + 3.0));
    f2 *= shoal * fishFade * (1.0 - rareK); fm = f2.x;
    base *= mix(vec3(1.0), vec3(0.84, 0.96, 0.88), f2.y * 0.6);          // the copper bled a little green round each dab
  }
  base = mix(base, mix(base * uCopper * 0.92 + uCopper * vec3(0.07, 0.01, 0.0), uPig * (0.55 + 0.6 * dot(base, vec3(0.3, 0.5, 0.2))), uPigMix), fm * 0.8);   // pigment, not only a multiply: a dab stays copper red on a dark ware
  float crazeOn = smoothstep(0.0, 0.22, uCraze * 0.9 + 0.27 - vnoise(pw * 0.017 + 5.0));
  vec2 warp = (vec2(vnoise(pw * 0.31), vnoise(pw * 0.31 + 37.0)) - 0.5) * 1.5;
  float cf1 = 1.0 - smoothstep(0.2, 0.7, fw / 1.6), cf2 = 1.0 - smoothstep(0.1, 0.36, fw / 0.45);
  vec2 c1 = cf1 > 0.01 ? crackle((pC1 + warp) / 1.9) : vec2(1.0, 0.0);
  float line1 = (1.0 - smoothstep(0.006, 0.018 + fw * 0.55, c1.x)) * cf1;
  float line2 = 0.0;
  if (cf2 > 0.01) { vec2 c2 = crackle((pC2 + warp * 0.6) / 0.45 + 17.0); line2 = (1.0 - smoothstep(0.02, 0.05 + fw * 1.0, c2.x)) * cf2 * 0.4; }
  base *= mix(vec3(1.0), uCrackCol, clamp(line1 * 0.6 + line2 * step(c1.y, 0.45), 0.0, 1.0) * under * crazeOn);
  // light: wrapped diffuse from the afterglow and the dove fill; nothing falls below deep jade
  float kd = dot(N, uGlowDir) * 0.5 + 0.5, fd = N.y * 0.5 + 0.5;
  vec3 light = uGlowCol * 1.2 * (litK(N) - uShade * 0.85) + uFillCol * (0.3 + 0.7 * fd * fd) * 1.2;   // the shaded side keeps only the sky's cool fill
  vec3 col = base * light;
  // peach up-light: only a 3 m lip beside an open crack, and the undersides of what hangs
  float lip = (exp(-lipD / 3.0) + 0.3 * exp(-lipD / 16.0)) * uOpen * top + exp(-max(dChip, 0.0) / 2.5) * (1.0 - step(0.5, vW)) * 0.8;
  float lidUnder = (1.0 - top) * vW;
  col += base * mix(uPeach, uDeep, 0.3) * 1.1 * uUpLight * (0.3 * lip + (1.0 - top) * (1.0 - vW) * (0.16 + 0.2 * max(-N.y, 0.0)));
  // THE LID'S FACE. Its underside hangs over the gap, so the light of the cloud sea climbs it from the hinge: deep peach
  // beside the base edge, cooling through cream to carved, green-pooled celadon at the tip; the light rakes along the
  // face, so every petal groove and comb line has a lit side and a shaded side.
  float gT = smoothstep(-236.0, -24.0, vSeat.z);                          // 0 at the hinge (base edge), 1 at the tip
  float fall = 0.05 + 0.95 * (1.0 - smoothstep(0.04, 0.8, gT));
  float rake = clamp(dot(N, normalize(-Tz * 0.9 + N0 * 0.5)), 0.0, 1.0);
  float lumB = dot(base, vec3(0.3, 0.5, 0.2));
  vec3 dp = max(mix(vec3(dot(uDeep, vec3(0.3, 0.5, 0.2))), uDeep, 1.28), vec3(0.0));     // the cloud sea's deep colour, pushed: the tone map pales it again
  vec3 lidCol = base * uFillCol * 1.5 * (0.55 + 0.45 * smoothstep(0.1, 0.6, rake)) * (1.0 - 0.9 * fall)
    + softCap(mix(base, vec3(lumB), 0.5) * mix(dp, uPeach, 0.8 * gT) * uUpLight * fall * (0.22 + 1.5 * rake) * (0.4 + 0.6 * uOpen) * 0.92, mix(dp, uPeach, 0.15 + 0.55 * gT) * 0.95);   // it saturates to peach, never to cream
  lidCol *= 0.86 + 0.28 * vnoise(vSeat.xz * 0.035 + vec2(uTime * 0.3, -uTime * 0.2));   // the light of the rolling cloud tops drifts across the face
  col += lidCol * lidUnder * (0.35 + 0.65 * uOpen);
  col = max(col, uBiscuit * exp(-1.75 * uAbsorb) * 0.34);                 // the deepest pool is ink green, never black
  // a dab is pigment: on a wall that takes only the fill it keeps its own copper red, never a stain darker than the glaze round it
  col = mix(col, max(col, uPig * (0.3 + dot(uFillCol, vec3(0.33)))), clamp(fm * 1.15, 0.0, 1.0) * top);
  // wet surface: Fresnel sky and the one broad highlight
  vec3 R = reflect(-V, normalize(mix(N0, N, 0.25 + 0.6 * smoothstep(0.15, 0.6, abs(nv0))))); float fres = 0.04 + 0.96 * pow(clamp(1.0 - nv, 0.0, 1.0), 5.0);
  vec3 sk = min(skyCol(R), vec3(1.1));
  col = mix(col, sk, clamp(fres, 0.0, 1.0) * 0.5 * (1.0 - 0.6 * fm));
  float hl = max(dot(R, uGlowDir), 0.0); float hl2 = hl * hl; hl2 *= hl2; hl2 *= hl2; hl2 *= hl2 * hl2 * hl;   // ~ ^25
  col = min(col, vec3(0.86));
  col += uGlowCol * 0.2 * hl2 * (0.8 + 0.4 * vnoise(pw * 0.35));      // the one long wet highlight
  col = haze(min(col, vec3(0.97)), length(cameraPosition - vPos));
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`;

const BISCUIT_VS = /* glsl */`
attribute vec4 aInfo; attribute float aW;
varying vec3 vPos, vN, vSeat; varying vec4 vInfo; varying float vW;
${POSE_GLSL}
#include <fog_pars_vertex>
void main() {
  vN = normalize(mat3(modelMatrix) * poseDir(normal, aW));
  vec4 wp = modelMatrix * vec4(posePoint(position, aW), 1.0);
  vPos = wp.xyz; vSeat = position; vInfo = aInfo; vW = aW;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const BISCUIT_FS = /* glsl */`
precision highp float;
varying vec3 vPos, vN, vSeat; varying vec4 vInfo; varying float vW;
uniform vec3 uGlass;
${LIGHT_GLSL}
#include <fog_pars_fragment>
void main() {
  vec3 N = normalize(vN), V = normalize(cameraPosition - vPos + vec3(0.0, 1e-4, 0.0));
  float depth = vInfo.x, open = mix(uOpen, 1.0, step(0.5, vInfo.y));
  vec2 gp = vSeat.xz * 0.9 + vSeat.y * vec2(0.63, -0.41);
  float fw = max(length(fwidth(gp)), 1e-4);
  float lipK, edgeK; vec3 Nb = N;
  N = biscuitN(Nb, vSeat, fw, lipK, edgeK);
  vec3 col = biscuitShade(N, Nb, gp, depth, fw, open, lipK, edgeK, vInfo.z);
  // the glaze seen in section: a green glass line in the top 0.35 m
  float glassLine = 1.0 - smoothstep(0.42, 0.55 + fw * 0.3, depth);
  vec3 R = reflect(-V, N);
  vec3 glass = uGlass * (0.3 + 0.22 * vnoise(gp * 3.3)) * (uFillCol * 1.3 + uGlowCol * 0.6 * litK(Nb)) + skyCol(R) * 0.05 + uGlass * uPeach * uUpLight * 0.05 * open;
  col = mix(col, min(glass, vec3(0.5)), glassLine);                    // green glass, darker than the clay it lies on
  col = haze(col, length(cameraPosition - vPos));
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`;

const GOLD_VS = /* glsl */`
attribute vec3 aAcross; attribute vec4 aGold;
uniform float uFront, uCool, uU; uniform vec2 uRes;
uniform vec2 uRiv[${RIVER_THETA.length}];                               // per river: (u at which its gold reaches the collar, metres per unit of u)
varying vec3 vPos, vN, vT, vA; varying vec4 vG;    // vG = (s, across metres, heat, crown)
#include <fog_pars_vertex>
void main() {
  float s = aGold.x, kind = aGold.y, phi = aGold.z, baseR = aGold.w;
  float live = kind > 0.5 && kind < 1.5 ? 1.0 : 0.0, river = step(1.5, kind);
  vec2 rw = uRiv[int(clamp(kind - 2.0, 0.0, ${(RIVER_THETA.length - 1).toFixed(1)}) + 0.5)];
  float front = mix(uFront, (uU - rw.x) * rw.y, river), behind = front - s, on = mix(step(0.01, uFront), step(0.01, front), river);
  float flowing = max(live, river);
  float grow = mix(1.0, 1.0 - smoothstep(front - 6.0, front, s), flowing) * mix(1.0, on, flowing);
  float crown = flowing * exp(-behind * behind / 9.0) * on;
  float tail = river > 0.5 ? 55.0 : (s > 300.5 ? 24.0 : 700.0);   // the fresh seam stays hot for a hundred metres and more; the chip's rim sets quickly
  float heat = flowing * (behind > 0.0 ? exp(-behind / tail) : 0.0) * mix(1.0 - uCool, 1.0 - smoothstep(0.05, 0.16, uU - rw.x), river);
  float rad = baseR * grow * (1.0 + 1.55 * crown);
  float pxm = distance(cameraPosition, (modelMatrix * vec4(position, 1.0)).xyz) * 2.0 / max(projectionMatrix[1][1] * uRes.y, 1.0);
  rad = max(rad, 1.6 * pxm * grow);                                   // a far seam holds three pixels: mended with gold reads from across the bowl
  float sp = sin(phi), cp = cos(phi);
  vec3 p = position + aAcross * sp * rad + normal * (cp * rad * (0.5 + 0.25 * crown) - 0.05);
  vec3 n = normalize(aAcross * sp * 0.55 + normal * cp + normal * 0.02);
  mat3 m3 = mat3(modelMatrix);
  vN = normalize(m3 * n); vA = normalize(m3 * aAcross); vT = normalize(m3 * cross(normal, aAcross));
  vec4 wp = modelMatrix * vec4(p, 1.0);
  vPos = wp.xyz; vG = vec4(s, sp * baseR, heat, crown);
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const GOLD_FS = /* glsl */`
precision highp float;
varying vec3 vPos, vN, vT, vA; varying vec4 vG;
uniform vec3 uF0, uEmber, uGoldWarm; uniform float uGoldLift;
${LIGHT_GLSL}
#include <fog_pars_fragment>
float surf(vec2 p, float heat) {
  float molten = vnoise(vec2(p.x * 0.55 - uTime * 2.2, p.y * 1.5)) + 0.5 * vnoise(vec2(p.x * 1.3 - uTime * 4.0, p.y * 3.1));
  float ridges = 0.13 * sin(p.x * 9.0 + 5.0 * vnoise(p * 0.8)) + 0.6 * vnoise(p * vec2(1.1, 2.6)) + 0.25 * vnoise(p * vec2(4.0, 7.0));   // set: fine cross ridges
  return mix(ridges, molten, clamp(heat * 1.4, 0.0, 1.0));
}
void main() {
  vec3 V = normalize(cameraPosition - vPos + vec3(0.0, 1e-4, 0.0));
  vec2 p = vG.xy; float heat = vG.z, crown = vG.w;
  float fw = max(length(fwidth(p)), 1e-4), det = 1.0 - smoothstep(0.15, 0.6, fw);
  float h0 = surf(p, heat), hx = surf(p + vec2(0.12, 0.0), heat), hy = surf(p + vec2(0.0, 0.12), heat);
  vec3 N = normalize(normalize(vN) - (normalize(vT) * (hx - h0) + normalize(vA) * (hy - h0)) * mix(0.75, 1.5, clamp(heat * 1.4, 0.0, 1.0)) * det);
  // sparkle: 0.25 m cells, each a tiny facet with its own tilt
  vec2 sc = floor(p / 0.25); vec2 sh = hash22(sc) - 0.5;
  float glint = 1.0 - smoothstep(0.05, 0.3, length(fract(p / 0.25) - 0.5 - sh * 0.35));   // a round glint inside each cell
  vec3 Ns = normalize(N + (normalize(vT) * sh.x + normalize(vA) * sh.y) * 0.9);
  vec3 R = reflect(-V, N), Rs = reflect(-V, Ns);
  float nv = max(dot(N, V), 0.0);
  vec3 F = uF0 + (vec3(1.0) - uF0) * pow(clamp(1.0 - nv, 0.0, 1.0), 5.0);
  vec3 Re = vec3(R.x, abs(R.y) * 0.8 + 0.04, R.z);                     // the bowl hides the cloud sea from its own seams
  vec3 sk = mix(skyCol(Re), uZenith * vec3(0.5, 0.62, 0.5), 1.0 - smoothstep(-0.25, 0.1, R.y)); sk = mix(sk, vec3(dot(sk, vec3(0.3, 0.5, 0.2))) * uGoldWarm, 0.6);   // gold warms what it mirrors
  float occ = 0.5 + 0.5 * clamp(h0 * 0.9, 0.0, 1.0);                                     // troughs between ridges stay dark
  // METAL: a dark body (it mirrors the dim bowl) and one tight bright streak along the crest, which is the whole
  // pale rim of the sky seen in the half-round: it follows the eye, so every seam has it from every side
  vec3 col = (F * sk * 0.62 + uF0 * (uFillCol + uGlowCol * 0.3) * 0.2) * occ;
  // GOLD GLOWS: against the dark glaze every seam is the brightest, most saturated thing in the frame (it holds the
  // last of the day), ridged and veined so it still reads as raised metal
  col += uF0 * mix(uF0, vec3(1.0), 0.12) * uGoldWarm * (0.2 + 2.7 * uGoldLift) * (0.45 + 0.55 * occ) * (0.75 + 0.5 * vnoise(p * vec2(0.6, 1.7))) * (1.0 - 0.7 * clamp(heat + crown, 0.0, 1.0));
  float azR = dot(R.xz, uGlowDir.xz) / max(length(R.xz) * length(uGlowDir.xz), 1e-4);
  float sw = 0.1 + min(fw, 1.5) * 0.35, sy = (R.y - 0.3) / sw;
  float streak = exp(-sy * sy) * (0.45 + 0.55 * smoothstep(-0.3, 0.9, azR)) * (0.6 + 0.4 * occ) * (0.1 / sw + 0.25);
  float hl = max(dot(R, uGlowDir), 0.0); float hp = pow(hl, 180.0);
  float hs = pow(max(dot(Rs, uGlowDir), 0.0), 40.0) * step(0.66, hash21(sc + 5.0)) * (1.0 - smoothstep(0.25, 0.8, fw)) * glint;
  float hs2 = pow(clamp(Rs.y, 0.0, 1.0), 6.0) * step(0.9, hash21(sc + 9.0)) * (1.0 - smoothstep(0.25, 0.8, fw)) * glint;   // pin sparkles under the open sky
  // set gold is never quite still: a slow sheen slides uphill along every seam, as if it were still finding its level
  float sheen = 0.5 + 0.5 * sin(p.x * 0.11 - uTime * 1.2 + 3.0 * vnoise(vec2(p.x * 0.05, 1.7))); sheen *= sheen; sheen *= sheen;
  streak *= 0.75 + 1.5 * sheen;
  col += uF0 * uGlowCol * (1.9 * streak + 5.0 * hp + 2.4 * hs + 1.6 * hs2 + 0.45 * sheen * occ);
  col += uF0 * uGlowCol * 0.3 * pow(hl, 7.0) * occ;                                       // the softbox seen wide and dim
  float vein = clamp(h0 * 0.75, 0.0, 1.0); vein = 0.25 + 1.5 * vein * vein;                 // molten ripples, brighter in the troughs between skins
  col += uEmber * (1.5 * heat * heat * heat + 3.0 * crown) * vein + vec3(2.6, 2.0, 1.1) * crown * crown * crown;   // a white-orange core at the front
  col = haze(col, length(cameraPosition - vPos));
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`;

const THREAD_VS = /* glsl */`
attribute vec2 aT; attribute vec3 aA, aB; attribute vec4 aRnd;
uniform vec2 uRes; uniform float uTime, uOpen;
varying vec3 vPos; varying vec3 vTR;     // (t, energy kept when widened to the pixel floor, random)
${POSE_GLSL}
#include <fog_pars_vertex>
vec3 curve(float t, vec3 A, vec3 B, float gap) {
  float slack = gap * (0.03 + 0.07 * aRnd.x) * (0.08 + 0.92 * smoothstep(0.0, 0.6, uOpen));   // they tighten as it comes in
  vec3 sway = vec3(sin(uTime * 0.43 + aRnd.y * 6.28), 0.0, cos(uTime * 0.37 + aRnd.z * 6.28)) * (gap * 0.022 + 0.4);   // a long thread bellies in the air off the gap
  float bow = 4.0 * t * (1.0 - t);
  return mix(A, B, t) + (vec3(0.0, -slack, 0.0) + sway) * bow;
}
void main() {
  vec3 A = aA, B = posePoint(aB, 1.0);
  float gap = length(B - A);
  vec3 p = curve(aT.x, A, B, gap), p2 = curve(aT.x + 0.02, A, B, gap);
  vec4 wp = modelMatrix * vec4(p, 1.0); vec3 wt = mat3(modelMatrix) * (p2 - p);
  vec3 toCam = cameraPosition - wp.xyz; float dist = max(length(toCam), 0.1);
  vec3 sd = cross(wt, toCam); float sl = length(sd); sd = sl > 1e-5 ? sd / sl : vec3(1.0, 0.0, 0.0);
  float px = dist * 2.0 / max(projectionMatrix[1][1] * uRes.y, 1.0);     // one pixel in metres at this distance
  float base = 0.07 + 0.05 * aRnd.w, halfW = max(base, 0.75 * px) * smoothstep(0.3, 1.5, gap);
  float pxA = distance(cameraPosition, (modelMatrix * vec4(A, 1.0)).xyz) * 2.0 / max(projectionMatrix[1][1] * uRes.y, 1.0);
  float keep = 0.13 + 0.87 * smoothstep(0.1, 0.55, 0.1 / max(0.75 * pxA, 0.1));   // from far off a few fine bright lines, never a cage of bars
  wp.xyz += sd * aT.y * halfW;
  vPos = wp.xyz; vTR = vec3(aT.x, clamp(base / max(halfW, 1e-4), 0.0, 1.0), aRnd.x);
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  if (aRnd.z > keep) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
  #include <fog_vertex>
}`;
const THREAD_FS = /* glsl */`
precision highp float;
varying vec3 vPos; varying vec3 vTR;
uniform vec3 uF0, uEmber; uniform float uGoldLift;
${LIGHT_GLSL}
#include <fog_pars_fragment>
void main() {
  float t = vTR.x;
  // slow beads of light sliding down each thread toward the seam (never a flash: 0.2 Hz, eased)
  float g = 0.5 + 0.5 * sin(t * 5.0 + uTime * 1.5 + vTR.z * 40.0); g *= g; g *= g; g *= g; g *= g;
  g *= 0.3 + 0.7 * step(0.62, fract(vTR.z * 7.31));                      // every thread carries a glint, some brighter
  vec3 col = uF0 * (uFillCol * 0.4 + uGlowCol * 0.28 + uPeach * uUpLight * 0.15 * uOpen) * mix(0.5, 1.0, vTR.y);
  col += uF0 * mix(uF0, vec3(1.0), 0.3) * (0.12 + 1.5 * uGoldLift) * mix(0.55, 1.0, vTR.y);      // a widened thread stays a bright fine line
  col += uEmber * (0.05 + 1.7 * g) * mix(0.3, 1.0, vTR.y);
  col = mix(col, mix(uF0, vec3(1.0), 0.6) * (uGlowCol * 0.75 + uPeach * 0.35), (1.0 - vTR.y) * 0.8);   // widened to the pixel floor it is a pale bright hairline on any ware, never a dim bar
  col = haze(col, length(cameraPosition - vPos));
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`;

const DUST_VS = /* glsl */`
attribute vec4 aDust, aRnd;
uniform vec2 uRes; uniform float uTime, uFront, uPuff, uOpen;
varying float vA;
void main() {
  float kind = aDust.y; vec3 outw = vec3(aDust.z, 0.0, aDust.w);
  vec3 p = position; float a = 0.0, sizeM = 0.3 + 0.35 * aRnd.z, big = 18.0;
  vec3 swirl = vec3(sin(uTime * 0.31 + aRnd.x * 30.0), sin(uTime * 0.23 + aRnd.y * 30.0), cos(uTime * 0.27 + aRnd.z * 30.0));
  if (kind < 0.5) {                         // wake of the bead: born at the front, lifts and thins behind it
    float age = uFront - aDust.x;
    float lift = 1.0 - exp(-max(age, 0.0) / 14.0);
    p += normal * (0.8 + aRnd.x * 9.0) * lift + outw * (aRnd.y - 0.5) * 7.0 * lift + swirl * 1.2 * lift;
    a = smoothstep(0.0, 3.0, age) * exp(-max(age, 0.0) / 34.0) * step(0.01, uFront);
  } else if (kind < 1.5) {                  // the puff as the Shard seats
    float e = 1.0 - (1.0 - uPuff) * (1.0 - uPuff);
    p += normal * (0.4 + aRnd.x * (2.0 + 11.0 * e)) + outw * (aRnd.y - 0.4) * (5.0 + 12.0 * e) + vec3(aDust.w, 0.0, -aDust.z) * (aRnd.w - 0.5) * 6.0 + swirl * 1.5 * e;
    p += normal * 6.0 * uPuff;
    a = smoothstep(0.0, 0.06, uPuff) * pow(max(1.0 - uPuff, 0.0), 1.3) * 0.4; sizeM = 1.0 + 2.6 * aRnd.z * aRnd.z; big = 56.0;
  } else {                                  // pollen drifting off the rim all the time
    float ph = fract(uTime * 0.022 * (0.5 + aRnd.z) + aRnd.w);
    p += normal * ph * (14.0 + 22.0 * aRnd.x) + outw * (aRnd.y - 0.5) * 12.0 * ph + swirl * 2.0;
    a = sin(3.14159 * ph) * (0.5 + 0.45 * uOpen); sizeM *= 1.05;
  }
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  float dist = max(-mv.z, 0.1);
  float px = sizeM * projectionMatrix[1][1] * uRes.y * 0.5 / dist;
  gl_PointSize = clamp(px, 1.6, big);
  vA = a * clamp(px / 1.6, 0.25, 1.0) * (0.7 + 0.3 * sin(uTime * 1.1 + aRnd.w * 50.0));
  gl_Position = projectionMatrix * mv;
  if (a < 0.003) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
}`;
const DUST_FS = /* glsl */`
precision highp float;
varying float vA; uniform vec3 uEmber;
void main() {
  vec2 c = gl_PointCoord - 0.5; float r2 = dot(c, c) * 4.0;
  float f = max(1.0 - r2, 0.0); f *= f;
  gl_FragColor = vec4(uEmber * 1.9 * f * vA, 1.0);
}`;

// Peach blades: the light of the cloud sea standing up through the open seam, as a soft additive sheet over
// the break line. It narrows and goes out as the Shard seats.
function buildBlade(outline) {
  const pos = [], bl = [], idx = [], P = new THREE.Vector3(), Nn = new THREE.Vector3(), { pts, N } = outline;
  let along = 0;
  for (let i = 0; i <= N; i++) {
    const p = pts[i % N], q = pts[(i + N - 1) % N]; if (i > 0) along += Math.hypot(p.x - q.x, p.z - q.z);
    capPoint(p.x, p.z, P); capNormal(p.x, p.z, Nn); P.addScaledVector(Nn, -THICK * 0.5);
    for (let j = 0; j < 2; j++) { pos.push(P.x, P.y, P.z); bl.push(j, along, hash1(i * 0.173), smoothstep(0, 30, -p.z)); }
    if (i < N) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aBl', new THREE.Float32BufferAttribute(bl, 4));
  g.setIndex(idx);
  return g;
}
const BLADE_VS = /* glsl */`
attribute vec4 aBl; uniform float uK, uTime; varying vec3 vB; varying float vDist;
void main() {
  float hgt = (16.0 + 24.0 * (0.5 + 0.5 * sin(aBl.y * 0.045 + 1.7)) + 8.0 * sin(aBl.y * 0.21 + uTime * 0.11)) * smoothstep(0.0, 0.3, uK) * (0.4 + 0.6 * aBl.w);
  vec4 wp = modelMatrix * vec4(position + vec3(0.0, hgt * aBl.x, 0.0), 1.0);
  vB = vec3(aBl.x, aBl.y, hgt); vDist = distance(cameraPosition, wp.xyz);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const BLADE_FS = /* glsl */`
precision highp float;
varying vec3 vB; varying float vDist;
${LIGHT_GLSL}
uniform float uK;
void main() {
  float t = vB.x, f = (1.0 - t); f = f * f * f * smoothstep(0.0, 0.05, t);
  float streak = 0.55 + 0.45 * vnoise(vec2(vB.y * 0.22 + 0.3 * sin(uTime * 0.07 + vB.y * 0.01), uTime * 0.16));
  float streak2 = 0.62 + 0.38 * vnoise(vec2(vB.y * 0.05, t * 3.0 - uTime * 0.35));
  float a = clamp(f * streak * streak2 * uOpen * (0.62 + 0.3 * (1.0 - uK)) * exp(-vDist * uHazeK) * smoothstep(3.0, 16.0, vDist), 0.0, 0.5);
  gl_FragColor = vec4(mix(uPeach, uDeep, 0.85) * uUpLight * 0.45 * a, a * 0.8);   // premultiplied: it covers what is behind it, so it never adds up to white
}`;

// The chip is the one break that is never mended, so its light never goes out: a soft column standing out of it,
// seen from far down the wall, thinning to nothing as the lens comes to it.
function buildBeacon() {
  const pos = [], bl = [], idx = [], P = new THREE.Vector3(), NC = 48;
  for (let i = 0; i <= NC; i++) {
    const th = (i / NC) * Math.PI * 2, r = chipR(th) * 0.86;
    capPoint(CHIP.x + Math.cos(th) * r, CHIP.z + Math.sin(th) * r, P);
    for (let j = 0; j < 2; j++) { pos.push(P.x, P.y, P.z); bl.push(j, i / NC, Math.cos(th), Math.sin(th)); }
    if (i < NC) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aBl', new THREE.Float32BufferAttribute(bl, 4));
  g.setIndex(idx);
  return g;
}
const BEACON_VS = /* glsl */`
attribute vec4 aBl; uniform vec3 uBeaconDir; uniform float uTime; varying vec3 vB; varying float vDist;
void main() {
  float hgt = 24.0 + 3.0 * sin(aBl.y * 18.85 + uTime * 0.23);
  vec3 p = position + (uBeaconDir * hgt - vec3(aBl.z, 0.0, aBl.w) * 2.5) * aBl.x - uBeaconDir * 2.0;      // a cone that closes as it rises
  vec4 wp = modelMatrix * vec4(p, 1.0);
  vec3 rad = normalize(mat3(modelMatrix) * vec3(aBl.z, 0.0, aBl.w)), vd = cameraPosition - wp.xyz;
  vDist = max(length(vd), 1e-3);
  vB = vec3(aBl.x, aBl.y, abs(dot(rad, vd / vDist)));           // 0 at the column's silhouette, 1 where it faces the lens
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const BEACON_FS = /* glsl */`
precision highp float;
varying vec3 vB; varying float vDist;
${LIGHT_GLSL}
uniform float uBeacon;
void main() {
  float t = vB.x, f = 1.0 - t; f = f * f * smoothstep(0.0, 0.22, t);
  float streak = 0.62 + 0.38 * vnoise(vec2(vB.y * 23.0 + 0.4 * sin(uTime * 0.11), t * 2.5 - uTime * 0.3));
  float edge = smoothstep(0.0, 1.0, vB.z); edge *= edge;                // nothing at the column's silhouette: it has no outline to read as a pane
  float a = clamp(f * streak * uBeacon * 0.62 * edge * smoothstep(30.0, 120.0, vDist), 0.0, 0.34);   // no plateau: it brightens toward its middle and its foot
  gl_FragColor = vec4(mix(uPeach, uDeep, 0.5) * 1.5 * a, a * 0.4);
}`;

const srgbVec = (hex) => { const c = new THREE.Color(hex); return new THREE.Vector3(Math.sqrt(c.r), Math.sqrt(c.g), Math.sqrt(c.b)); }; // a rough sRGB triple, used for multiplies
const linVec = (hex, k = 1) => { const c = new THREE.Color(hex); return new THREE.Vector3(c.r * k, c.g * k, c.b * k); };

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, pal = (opts.palette && opts.palette.length >= 7) ? opts.palette : DEFAULT_PALETTE;
  const detail = clamp(opts.detail ?? ctx.quality?.detail ?? 1, 0.6, 1);
  const seatU = opts.seatU ?? 0.84, meetU = opts.meetU ?? 0.945, chipU = opts.chipU ?? 0.965, startU = opts.startU ?? 0.03;
  const group = new THREE.Group(); group.name = 'mended-country-hero';

  // ----- geometry
  const tick = () => ctx.yield?.();
  await tick();
  const outline = buildOutline(rng);
  await tick();
  const glazeBuf = new Buf();
  const { outer, seamCols } = await buildGlaze(outline, rng, glazeBuf, tick);
  await ctx.yield?.();
  const bisBuf = new Buf();
  await buildBiscuit(outline, outer, bisBuf, tick);
  await ctx.yield?.();
  const gold = await buildGold(outline, outer, seamCols, rng, tick);
  await ctx.yield?.();
  await ctx.yield?.();
  const threadGeo = buildThreads(outline, rng, 60);
  await ctx.yield?.();
  const dustGeo = buildDust(outline, gold.LM, rng, Math.round(3600 * detail));
  await ctx.yield?.();

  // ----- uniforms (lighting is analytic; directions are world space, refreshed in update)
  const biscuit = linVec(pal[3]), glazeC = linVec(pal[0]);
  const absorb = new THREE.Vector3(
    -Math.log(clamp(glazeC.x / Math.max(biscuit.x, 1e-3), 0.05, 0.98)), -Math.log(clamp(glazeC.y / Math.max(biscuit.y, 1e-3), 0.05, 0.98)),
    -Math.log(clamp(glazeC.z / Math.max(biscuit.z, 1e-3), 0.05, 0.98))).multiplyScalar(2.0);   // per unit of thickness (t = 0.5 gives the palette glaze)
  const f0 = srgbVec(pal[4]); f0.multiplyScalar(1 / Math.max(f0.x, f0.y, f0.z, 1e-3));
  const glowLocal = (opts.glowDir ? opts.glowDir.clone() : new THREE.Vector3(-0.857, 0.139, -0.495)).normalize();
  const glowIsWorld = !!opts.glowDir;
  const U = {
    uPose: { value: new THREE.Matrix4() }, uOpen: { value: 1 }, uK: { value: 1 }, uTime: { value: 0 }, uFront: { value: 0 }, uPuff: { value: 1 }, uCool: { value: 0 }, uCraze: { value: 0.3 },
    uGlowDir: { value: glowLocal.clone() }, uGlowCol: { value: linVec('#F6E3CF', 0.9) }, uFillCol: { value: linVec('#9DB5AC', 0.45) },
    uPeach: { value: linVec(pal[6]) }, uDeep: { value: linVec('#E89B6E') }, uUpLight: { value: 2.4 }, uHazeCol: { value: linVec('#8FA9A3') }, uHazeK: { value: 1 / 2600 },
    uZenith: { value: linVec('#6F8E8C') }, uRimSky: { value: linVec('#9DB5AC') },
    uBiscuit: { value: biscuit }, uAbsorb: { value: absorb }, uMilk: { value: linVec(pal[0]) }, uCopper: { value: srgbVec(pal[5]) }, uCrackCol: { value: srgbVec('#8E9A82') },
    uGlass: { value: linVec(pal[2]) }, uF0: { value: f0 }, uEmber: { value: new THREE.Vector3(1.0, 0.5, 0.085) }, uRes: { value: new THREE.Vector2(1280, 720) }, uGoldWarm: { value: new THREE.Vector3(1.08, 1.0, 0.9) }, uRare: { value: 0 }, uGoldLift: { value: 0.3 }, uBowlEx: { value: 2.3 }, uCarve: { value: 0 }, uPool: { value: 0.45 }, uShade: { value: 0.2 }, uFishScale: { value: 1.5 }, uPig: { value: linVec(pal[5], 1.3) }, uPigMix: { value: 0.55 }, uBeacon: { value: 1 }, uBeaconDir: { value: capNormal(CHIP.x, CHIP.z).multiplyScalar(0.62).add(new THREE.Vector3(0, 0.38, 0)).normalize() },
    uU: { value: 0 }, uRiv: { value: RIVER_THETA.map((_, i) => new THREE.Vector2(0.5 + 0.03 * i, 1700)) },   // stand-alone timing; the world sets its own (setRiver)
  };
  const mat = (vs, fs, extra = {}) => new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U }, vertexShader: vs, fragmentShader: fs, fog: true, ...extra });
  const bound = new THREE.Sphere(new THREE.Vector3(0, 120, -110), 420);   // given, so nothing has to be measured at first draw
  const mesh = (geo, m, name) => { geo.boundingSphere = bound; const o = new THREE.Mesh(geo, m); o.name = name; o.frustumCulled = false; group.add(o); return o; };
  await ctx.yield?.();
  mesh(await glazeBuf.geometryAsync(tick), mat(GLAZE_VS, GLAZE_FS, { side: THREE.DoubleSide }), 'glaze');
  await ctx.yield?.();
  mesh(await bisBuf.geometryAsync(tick), mat(BISCUIT_VS, BISCUIT_FS, { side: THREE.DoubleSide }), 'biscuit');
  await ctx.yield?.();
  await ctx.yield?.();
  mesh(gold.geometry, mat(GOLD_VS, GOLD_FS), 'gold');
  mesh(threadGeo, mat(THREAD_VS, THREAD_FS, { side: THREE.DoubleSide }), 'threads');
  const dust = new THREE.Points(dustGeo, new THREE.ShaderMaterial({ uniforms: U, vertexShader: DUST_VS, fragmentShader: DUST_FS,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  dust.name = 'dust'; dust.frustumCulled = false; group.add(dust);
  const blade = new THREE.Mesh(buildBlade(outline), new THREE.ShaderMaterial({ uniforms: U, vertexShader: BLADE_VS, fragmentShader: BLADE_FS,
    transparent: true, depthWrite: false, premultipliedAlpha: true, side: THREE.DoubleSide }));
  blade.name = 'peach-blade'; blade.frustumCulled = false; blade.renderOrder = 2; group.add(blade);
  const beacon = new THREE.Mesh(buildBeacon(), new THREE.ShaderMaterial({ uniforms: U, vertexShader: BEACON_VS, fragmentShader: BEACON_FS,
    transparent: true, depthWrite: false, premultipliedAlpha: true, side: THREE.DoubleSide }));
  beacon.name = 'chip-beacon'; beacon.frustumCulled = false; beacon.renderOrder = 2; group.add(beacon);
  const tris = (glazeBuf.idx.length + bisBuf.idx.length + gold.geometry.index.count) / 3 + 60 * 56 + 96;

  // ----- the Shard's open pose: a raised lid. It stands tip-up on its base edge over the top of the gap, leaning out
  // over the bowl (and over the flight), its underside lit by the gap, hovering a little clear of its hinge line; it
  // lowers toward us like a drawbridge on its gold threads, the tip coming down overhead, and lies into its seat.
  const pivot = capPoint(0, -138), hinge = capPoint(0, -(LEN - 4)), hingeN = capNormal(0, -(LEN - 4));
  const twistSign = rng.sign(), twistDeg = rng.range(7, 10), rockPh = rng.range(0, 6.28);
  const m1 = new THREE.Matrix4(), m2 = new THREE.Matrix4(), q = new THREE.Quaternion(), q2 = new THREE.Quaternion(), X = new THREE.Vector3(1, 0, 0), Z = new THREE.Vector3(0, 0, 1), off = new THREE.Vector3();
  // monotone cubic through (xs, ys): no overshoot, flat at both ends (it leaves and lands with no velocity)
  const curveOf = (xs, ys) => {
    const n = xs.length, m = new Array(n).fill(0);
    for (let i = 1; i < n - 1; i++) { const d0 = (ys[i] - ys[i - 1]) / (xs[i] - xs[i - 1]), d1 = (ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]); m[i] = d0 * d1 <= 0 ? 0 : 2 * d0 * d1 / (d0 + d1); }
    return (x) => {
      if (x <= xs[0]) return ys[0]; if (x >= xs[n - 1]) return ys[n - 1];
      let i = 0; while (x > xs[i + 1]) i++;
      const h = xs[i + 1] - xs[i], t = (x - xs[i]) / h, t2 = t * t, t3 = t2 * t;
      return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1];
    };
  };
  // The lowering, as fractions of the way from startU to seatU: degrees the lid stands above its seat (about the
  // base edge), how far it hovers above the hinge line and out over the bowl, and the turn (spent early).
  const DT = [0, 0.273, 0.478, 0.628, 0.738, 0.847, 0.929, 1].map((f) => lerp(startU, seatU, f));
  const psiOf = curveOf(DT, [104, 96, 74, 50, 35, 19, 7.5, 0]), hoverOf = curveOf(DT, [34, 32, 30, 26, 20, 11, 4, 0]);
  const southOf = curveOf(DT, [30, 30, 34, 36, 28, 14, 4, 0]), twistOf = curveOf(DT, [1, 0.8, 0.4, 0.1, 0, 0, 0, 0]);
  const liftOf = (u) => clamp(psiOf(u) / 45, 0, 1);                 // openness 0..1 (1 until the lid is within 45 degrees)
  // the beads: quick off the tip, then keeping pace with the flight so both are still apart near the end
  const frontOf = curveOf([0, 0.1, 0.164, 0.3, 0.45, 0.88, 1].map((f) => lerp(seatU, meetU, f)), [0, 0.5, 0.655, 0.75, 0.86, 0.955, 1]);
  const setPose = (u, time) => {
    const M = U.uPose.value, psi = psiOf(u), kl = psi / 104, kw = twistOf(u);
    if (u >= seatU || psi <= 1e-4) { M.identity(); return; }
    q.setFromAxisAngle(hingeN, twistSign * twistDeg * Math.PI / 180 * kw);                       // turning to find its fit
    q2.setFromAxisAngle(X, -psi * Math.PI / 180 + 0.02 * kl * Math.sin(time * 0.34 + rockPh)); q.premultiply(q2);
    q2.setFromAxisAngle(Z, kl * (0.028 * Math.sin(time * 0.27 + rockPh * 1.7) + 0.007 * Math.sin(time * 0.59 + rockPh))); q.premultiply(q2); // rocking, scaled by how far it still has to come
    off.set(2.5 * kl * Math.sin(time * 0.2 + rockPh), hoverOf(u) + 1.6 * kl * Math.sin(time * 0.4), southOf(u)).add(hinge);
    m1.makeTranslation(-hinge.x, -hinge.y, -hinge.z); m2.makeRotationFromQuaternion(q); m2.setPosition(off);
    M.multiplyMatrices(m2, m1);
  };

  // ----- anchors (local space, plain arrays unless noted)
  const arr = (v) => [v.x, v.y, v.z];
  const above = (x, z, h) => { const p = capPoint(x, z), n = capNormal(x, z); return arr(p.addScaledVector(n, h)); };
  const chipN = capNormal(CHIP.x, CHIP.z), chipC = capPoint(CHIP.x, CHIP.z).addScaledVector(chipN, -2.0);
  const dive = new THREE.Vector3(0, -Math.sin(50 * Math.PI / 180), -Math.cos(50 * Math.PI / 180));   // the last 52 m, 50 degrees down
  const diveStart = chipC.clone().addScaledVector(dive, -52);
  const anchors = {
    // 14 m portal: centre 2 m down inside the chip; `facing` points back up the dive at the arriving camera
    portalSeat: { position: arr(chipC), facing: [-dive.x, -dive.y, -dive.z], wallNormal: arr(chipN), radius: 7, tiltDeg: 50 },
    // brief sections E-H: along the chip-side edge of the gap 14 m off the glaze, the climb, then the straight dive.
    // Clear by >= 12 m of the seated wall and of the Shard for u >= 0.6 (it is within 12 m of its seat by then).
    flyThrough: [above(-77, 70, 13), above(-71, 0, 14), above(-61, -60, 16), above(-59, -120, 17), above(-58, -165, 34), arr(diveStart), arr(chipC)],   // low beside the seam while the bead passes, then up and over
    flyBeyond: arr(chipC.clone().addScaledVector(dive, 14)),
    chip: { center: arr(capPoint(CHIP.x, CHIP.z)), normal: arr(chipN), radius: CHIP.r },
    gapTip: [0, 0, 0], gapBase: arr(capPoint(0, -LEN)), shardPivot: arr(pivot),
    gapOutline: outline.pts.map((p) => arr(capPoint(p.x, p.z))),       // closed; the seam the Shard seats into
    collarOutline: outer.map((p) => arr(capPoint(p.x, p.z))),          // closed; cut the world's wall to this (leave a 2-6 m crack)
    capPoint: (x, z) => arr(capPoint(x, z)), capNormal: (x, z) => arr(capNormal(x, z)),
    // the rivers (local): apex, the site directions for the world's wedge shards, and each ray's run across the collar
    rivers: { apex: [RIVER_APEX.x, RIVER_APEX.z], phi: RIVER_PHI.slice(), theta: RIVER_THETA.slice(), radius: RIVER_R,
      rays: gold.rivers.map((r) => r && { theta: r.theta, len: r.len, inner: arr(capPoint(r.inner[0], r.inner[1])), outer: arr(capPoint(r.outer[0], r.outer[1])) }) },
    placement: { position: [0, TIP_Y, TIP_R], rotationY: Math.PI },    // how the brief's world seats this piece
    viewpoints: {
      entry: [-60, 10 - TIP_Y, 870],              // the brief's first frame: Shard at 18 percent over its blazing gap
      wallClimb: above(-40, 150, 12),             // section D, looking up at the Shard
      gapSide: above(-84, -20, 14),               // section E/F: biscuit cliff sliding down 12 m to port
      overview: above(-60, -70, 55),              // section G: the whole spearhead outlined in new gold
    },
  };
  // where the two beads are (local), for the world's camera gaze or extra dust
  const beadPositions = (u) => {
    const f = frontOf(u), out = [];
    for (const flank of [1, -1]) {
      const L = flank > 0 ? outline.L1 : outline.L2; let best = outline.pts[0], bd = 1e9;
      for (const p of outline.pts) if (p.flank === flank) { const d = Math.abs(p.s / L - f); if (d < bd) { bd = d; best = p; } }
      out.push(arr(capPoint(best.x, best.z)));
    }
    return out;
  };

  // ----- progress and animation
  let prog = 0, progSet = false; const size = new THREE.Vector2();
  const apply = (u, time) => {
    const k = u >= seatU ? 0 : liftOf(u);
    setPose(u, time);
    U.uOpen.value = Math.max(smoothstep(0.0, 0.1, k), 0.7 * (1 - smoothstep(seatU + 0.006, seatU + 0.045, u)));   // a hairline of light lingers in the seam until the gold has run it
    U.uK.value = k;
    U.uFront.value = gold.LM * frontOf(u) + (gold.sTotal - gold.LM) * clamp((u - meetU) / Math.max(1e-4, chipU - meetU), 0, 1);
    U.uPuff.value = clamp((u - (seatU - 0.004)) / 0.1, 0, 1);
    U.uCool.value = smoothstep(chipU - 0.004, chipU + 0.014, u);
    U.uCraze.value = 0.15 + 0.6 * u;
    U.uU.value = u;
  };
  apply(0, 0);
  return {
    object: group, radius: 185, height: 320, center: new THREE.Vector3(0, 125, -115),
    anchors, uniforms: U, pose: U.uPose.value, beadPositions, triangles: Math.round(tris),
    ground: false, groundY: -60,
    setProgress(u) { progSet = true; prog = clamp(u || 0, 0, 1); },
    // river k: its gold reaches the collar's outer break at u = uAt and runs on to the gap rim at `speed` metres per unit of u
    setRiver(k, uAt, speed) { if (U.uRiv.value[k]) U.uRiv.value[k].set(uAt, speed); },
    update(dt, time, camera) {
      U.uTime.value = time;
      const u = progSet ? prog : (time / 44) % 1;       // stand-alone: the whole event on a 44 s loop
      apply(u, time);
      if (glowIsWorld) U.uGlowDir.value.copy(glowLocal);
      else { group.updateMatrixWorld(); U.uGlowDir.value.copy(glowLocal).transformDirection(group.matrixWorld); }
      if (ctx.renderer?.getDrawingBufferSize) { ctx.renderer.getDrawingBufferSize(size); U.uRes.value.copy(size); }
    },
    dispose() {},
  };
}

// Shared with the world module (src/worlds/mended-country.js) so the rest of the bowl is shaded by the very same
// light, relief, crackle, fish and gold as this piece.
export const UNDER_GLSL = GLAZE_FS.slice(GLAZE_FS.indexOf('// F2 - F1'), GLAZE_FS.indexOf('void main()'));
export { LIGHT_GLSL, RELIEF_GLSL, GOLD_FS, DUST_FS, DEFAULT_PALETTE };
