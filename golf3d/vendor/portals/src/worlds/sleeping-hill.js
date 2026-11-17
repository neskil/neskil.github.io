// "What the Hill Is Holding" (sleeping-hill): a winter hill at night seen as a radiograph. Everything is made from the
// one style kit in ../parts/sleeping-hill.js (shells, limb-bright, screen blended; no lights, no depth, no shadows).
// Layout (+Z is the course): the frozen brook z 0-72, the birch wood z 72-136, the hill z 136-216 with the oak on its
// summit at z 236, the swing round the oak, then the dive under the snow into the root loop (the exit portal).
// The first third carries a near layer of its own (buildNear): bank birches as nested tubes 4-7 m from the lens, the brook's
// water as drifting lenses over its stones, curled sleepers and large bulbs in the banks and under the path, lens crystals.
// The opening is three pictures (makeRoute): the arrival over the ice, a dip to a metre above the great trout and its redd, a swing
// to the vole's bank, then up through the birches on a curve past the deer. From afar the oak is a drawing: one firm line per limb.
// Two tones on every seed: cold film and warm life. Hearts are amber points (seeds stay pale gold); from u 0.07 the shared warmth rises (bulbs glow larger,
// sap beads turn amber) and from the climb a front spreads from the oak: sap in its heartwood, gold mycelium down the hill, and
// (round warm oak) the oak's own wood turns amber behind that front (the part's mCrown, mRoot, mSkel): the tree is the second light.
// Round four: the oak is the beacon of every frame of the first third (drawn larger than life while far off, true size before the
// climb; update()), with the hearth under it (the gold of the bulbs in the hill face, seen from the first frame) and warm sap in the
// near birches' roots; the vole's run lies 6 m off the path; the swing ends rising, so its last view looks down across the hill
// (gold lights and large bulbs under the clear snow, the owl upper right, far birches beyond the rim); in the dive the oak's fine
// roots clear away round the lens and the loop wears a wreath of two wound roots. New things draw only from W.r4.
// Round five: every still of the first two thirds has a large subject of its own in front of the oak. u 0.25 the deer between its two
// birches (staged from the still's own eye), u 0.34 a second deer close on the right, u 0.43 a birch leaning in over the path with its
// hanging twig fans and the hedgehog low on the right, u 0.52 the grass snake's knot lower left and the owl gliding across the trunk,
// u 0.61 a great root of the oak arching in from the lower right (buildArchRoot). On the last of the swing the crown's and roots' fine
// limbs thin away round the lens (as in the dive), the dormice lie in a dark hollow of the bole, and the far birches are faint. New
// things draw only from W.r5.
// Round near sap: the warmth is in the opening too. Where a near birch carries its sap vein (buildNear's 25 full trunks along the brook
// and through the wood, the last at z 173), its three cores are drawn in the sap's amber, so warm trunks stand in the film from the first
// frame to about u 0.49; the pair the deer is seen through and the birch leaning over the climb keep cold cores. And the twig ribbons of
// buildBirches (the wood's and the outliers' hanging fans and the outliers' branches), with their hoar frost, are fine matter that the
// film shows only near: whole within about 14 m of the lens and gone by 35 m (twice and five times the 7 m at which the wood's nearest
// trunks stand from its centre line), on every seed and for the whole flight. Beyond that a birch of buildBirches is its trunk and
// boughs and an outlier its trunk alone. The near layer's own fans and the alders' twigs keep the shared fall. No draw of the dice changes.
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import { makeStyle, buildHero } from '../parts/sleeping-hill.js';

const TAU = Math.PI * 2;
const FILMS = {
  steel: ['#05081A', '#1C3557', '#4F7FB0', '#A9C8E6', '#EEF6FF', '#F2D58A'],
  silver: ['#08080C', '#34343C', '#8A8A94', '#C9C9CF', '#F6F4F0', '#F2B59A'],
  green: ['#030B0A', '#103A30', '#3E9A80', '#A6E0CF', '#F1FFFB', '#F2D58A'],
};
// the tone map crushes and blues the darkest tones: lift the film per channel so the frame shows the brief's film black
const filmOnScreen = (c) => new THREE.Color(c.r * 4.6, c.g * 3.5, c.b * 2.1);
const GREAT = { x: 0.35, y: -0.62, z: 33.4 };      // the great trout under the lens at u 0.08
const OX = 0, OZ = 236, OY = 23;             // the oak's foot on the snow line
const V = (x, y, z) => ({ x, y, z });
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// ---- the shared context every builder below works in --------------------------------------------------------------
function makeWorld(ctx) {
  const rng = ctx.rng, vr = rng.fork ? rng.fork('sleeping-hill-vary') : rng;
  const vary = ctx.vary || {};
  // seeded variations: film, weather, season (hour 'day'/'golden' lean to the warm silver plate, 'night' to steel)
  let film = vr.pick(['steel', 'steel', 'silver', 'green']);
  if (vary.hour === 'day' || vary.hour === 'golden') film = 'silver'; else if (vary.hour === 'night') film = 'steel';
  const weather = vr.pick(['slow', 'slow', 'wind', 'hoar']);
  const season = vr.pick(['midwinter', 'midwinter', 'autumn', 'thaw']);
  const cr = ctx.core.makeRng(ctx.core.hashSeed('sleeping-hill-climb:' + ctx.seed));      // a stream of its own for later additions
  const or = ctx.core.makeRng(ctx.core.hashSeed('sleeping-hill-open:' + ctx.seed));
  const r5 = ctx.core.makeRng(ctx.core.hashSeed('sleeping-hill-near5:' + ctx.seed));      // round five's additions (the near subjects of the climb) draw only from here
  const r4 = ctx.core.makeRng(ctx.core.hashSeed('sleeping-hill-hearth:' + ctx.seed));      // round four's additions draw only from here
  const rare = !!vary.rare, density = Math.min(1.3, Math.max(0.7, vary.density ?? 1));
  const detail = Math.min(1, Math.max(0.6, ctx.quality?.detail ?? 1));
  const S = makeStyle(ctx, { palette: FILMS[film], neutral: film === 'silver' ? 0.85 : film === 'green' ? 0.25 : 0 });
  if (film === 'green') S.tints.blue.lerp(new THREE.Vector3(0.9, 1.0, 0.97), 0.62);        // the green plate: ice-white densities
  const scene = new THREE.Scene();
  scene.background = filmOnScreen(S.filmColor);      // lifted so that the tone-mapped frame shows the brief's film black
  const snowDepth = season === 'autumn' ? 0.12 : 1;
  // the snow line: hill + a metre of snow, dipping to the brook ice along x = 0
  const ramp = (t) => { t = Math.min(1, Math.max(0, t)); return 0.5 * (t + t * t * (3 - 2 * t)); };
  const H = (x, z) => {
    const r = Math.hypot(x - OX, z - OZ);
    const hill = 22 * (1 - ramp((r - 27) / 76));
    const dip = (1 - sstep(3.0, 5.6, Math.abs(x))) * (1 - sstep(72, 96, z));
    const roll = 0.35 * ctx.noise.n2(x * 0.045 + 3, z * 0.045) * sstep(7, 22, Math.abs(x));
    return 1 + hill - dip + roll * sstep(28, 44, r);
  };
  const add = (geo, mat, parent = scene) => { const m = new THREE.Mesh(geo, mat); m.frustumCulled = false; parent.add(m); return m; };
  const addPts = (geo, mat, parent = scene) => { const m = new THREE.Points(geo, mat); m.frustumCulled = false; parent.add(m); return m; };
  const tick = async () => { if (ctx.yield) await ctx.yield(); };
  return { ctx, rng, vr, cr, or, r4, r5, bulbList: [], seedRows: [], heartRows: [], S, scene, H, add, addPts, tick, film, weather, season, rare, density, detail, snowDepth, updaters: [], n: ctx.noise };
}

// Catmull-Rom midpoints, n times: a polyline of straight pieces becomes a curve (threads, cracks)
const smoothPts = (pts, n = 1) => {
  for (let it = 0; it < n; it++) {
    const P = [], m = pts.length;
    for (let i = 0; i < m; i++) {
      P.push(pts[i]); if (i === m - 1) break;
      const a = pts[Math.max(i - 1, 0)], b = pts[i], c = pts[i + 1], e = pts[Math.min(i + 2, m - 1)];
      P.push(V((-a.x + 9 * b.x + 9 * c.x - e.x) / 16, (-a.y + 9 * b.y + 9 * c.y - e.y) / 16, (-a.z + 9 * b.z + 9 * c.z - e.z) / 16));
    }
    pts = P;
  }
  return pts;
};

// hero-local point -> world (the hero is turned half round so that its approach side faces the brook)
const toWorld = (p) => new THREE.Vector3(OX - p.x, OY + p.y, OZ - p.z);

function makeRoute(W, hero) {
  const A = hero.anchors, pts = [];
  const yAt = (x, z, up) => W.H(x, z) + up;
  // the opening is three pictures, not one corridor: level in, a dip to a metre over the ice above the great trout (z 27), a swing
  // to the vole's bank (z 55-70), then up through the birches on a curve that meets the deer off the centre line
  pts.push([0, 2.5, 0], [0, 2.35, 12], [0.4, 1.2, 27], [0.2, 1.45, 41], [-2.1, 1.9, 55], [-2.5, 2.5, 69], [-2.8, 3.0, 86], [-2.6, 3.1, 102], [-1.5, 3.0, 116], [0, yAt(0, 132, 2.1), 132], [0, yAt(0, 150, 2), 150], [0, yAt(0, 168, 2), 168],
    [-3.2, yAt(-3.2, 187, 2), 187], [-9.6, yAt(-9.6, 207, 1.8), 207]);
  for (const a of [64, 86, 108, 130, 152, 176, 200]) {
    const r = a * Math.PI / 180;
    pts.push(toWorld(V(Math.sin(r) * 20, a < 70 ? 1.5 : a === 176 ? 3.0 : a === 200 ? 6.3 : 1.2, Math.cos(r) * 20)));      // (the lift begins on the last quarter of the swing)
  }
  for (let i = 8; i < A.flyThrough.length; i++) { const q = toWorld(A.flyThrough[i]); if (i < 11) q.y = OY + [7.4, 7.9, 8][i - 8]; pts.push(q); }      // the turn-in: already high, the hill spread below
  const path = makePath(pts);
  const L = path.length, dive = 60 / L;
  const loop = toWorld(A.loop.center), snowIn = toWorld(A.dive.snowEntry), diveStart = toWorld(A.dive.start);
  const diveDir = new THREE.Vector3(-A.dive.dir.x, A.dive.dir.y, -A.dive.dir.z);
  const uOf = (p) => { const n = path.nearestXZ(p.x, p.z); return n.u; };
  const marks = {
    uBirch: uOf(V(0, 0, 72)), uClimb: uOf(V(0, 0, 138)), uOrbit: uOf(toWorld(V(18, 0, 8.8))),
    uDive: 1 - dive, uSnow: 1 - dive + (diveStart.distanceTo(snowIn) / L),
  };
  // where the gaze rests at the end of the swing: the hill's flank beyond the place we go under, seen from above
  const hd = new THREE.Vector3(diveDir.x, 0, diveDir.z).normalize(), skyLook = new THREE.Vector3(snowIn.x + hd.x * 1 - hd.z * 2.4, 0, snowIn.z + hd.z * 1 + hd.x * 2.4); skyLook.y = W.H(skyLook.x, skyLook.z) - 1;      // (a little right of where we go under: the bole stands in the left third)
  return { path, L, marks, loop, snowIn, diveStart, diveDir, hd, skyLook };
}

// ---- the ground: four sheets that follow the hill (snow line, soil, stony layer, bedrock) and the pebble sparks -----
async function buildGround(W) {
  const { S, H, rng } = W;
  const NX = 100, NZ = 84, xs = [], zs = [];
  for (let i = 0; i <= NX; i++) { const t = i / NX * 2 - 1; xs.push(150 * Math.sign(t) * Math.pow(Math.abs(t), 1.25)); }
  for (let j = 0; j <= NZ; j++) zs.push(-46 + 420 * j / NZ);
  const layers = [
    { d: 0, dens: 0.0095, lift: 0, rough: 0 },
    { d: W.snowDepth, dens: 0.0013, lift: -W.snowDepth, rough: 0.25 },
    { d: 4, dens: 0.0017, lift: -4.2, rough: 1.1 },
    { d: 22, dens: 0.002, lift: -22, rough: 2.6 },
  ];
  const X0 = xs, Z0 = zs;
  for (let k = 0; k < layers.length; k++) {
    const xs = k >= 1 ? X0.filter((_, i) => i % 2 === 0) : X0, zs = k >= 1 ? Z0.filter((_, i) => i % 2 === 0) : Z0,      // the two deep sheets are slow, faint threads: half the grid
      NX = xs.length - 1, NZ = zs.length - 1;
    const Ly = layers[k], P = new Float32Array((NX + 1) * (NZ + 1) * 3), D = new Float32Array((NX + 1) * (NZ + 1) * 4), I = [];
    const G = new Float32Array((NX + 1) * (NZ + 1));
    for (let j = 0; j <= NZ; j++) { if (j % 3 === 2) await W.tick(); for (let i = 0; i <= NX; i++) {
      const x = xs[i], z = zs[j], q = j * (NX + 1) + i;
      let y = H(x, z) + Ly.lift;
      if (k === 1) y = Math.min(y, H(x, z) - 0.02) - (1 - sstep(3, 5.6, Math.abs(x))) * (1 - sstep(72, 96, z)) * 0.6;   // the brook bed
      if (Ly.rough) y += Ly.rough * W.n.fbm2(x * 0.03 + k * 17, z * 0.03, 3);
      if (k === 3) y = Math.min(y, -1.5 + 0.55 * (H(x, z) - 1)) ;
      P[q * 3] = x; P[q * 3 + 1] = y; P[q * 3 + 2] = z;
      D[q * 4] = Ly.d; D[q * 4 + 1] = z; D[q * 4 + 2] = 0; D[q * 4 + 3] = 0;
      if (i < NX && j < NZ) I.push(q, q + NX + 1, q + 1, q + 1, q + NX + 1, q + NX + 2);
    } }
    await W.tick();
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('aData', new THREE.BufferAttribute(D, 4));
    g.setAttribute('aGain', new THREE.BufferAttribute(G, 1)); g.setIndex(I); g.computeVertexNormals();
    await W.tick();
    const mesh = W.add(g, S.shell({ density: Ly.dens, edge: 0.012, sharp: true, flow: k >= 2 ? 0.3 : 0 }));   // the deep sheets swell and thin in slow bands
    if (k === 0) W.snowMesh = mesh;
    await W.tick();
  }
  // soil is empty but for pebble sparks: densest in the stony layer, under the path and the oak
  const n = Math.round(15000 * W.detail), rows = [];
  for (let i = 0; i < n; i++) {
    const near = rng() < 0.6, z = near ? rng.range(110, 300) : rng.range(-20, 330), x = (near ? 70 : 120) * (rng() * 2 - 1) * (0.25 + 0.75 * rng());
    const stony = rng() < 0.55, d = stony ? 4 + rng.gauss() * 0.7 : rng.range(1.2, 30);
    rows.push([x, H(x, z) - Math.max(1.1, d), z, Math.max(1.1, d), stony ? rng.range(0.05, 0.16) : rng.range(0.03, 0.09), 0.6, rng()]);
    if (i % 150 === 149) await W.tick();
  }
  await W.tick();
  W.addPts(S.pointCloud(rows), S.points({ density: 0.42 }));
  await W.tick();
}

// ---- the brook: ice skin, cracks, eleven trout under it, their eggs in the gravel, reeds, alders, the vole's run -----
async function buildBrook(W) {
  const { S, rng, H } = W, thaw = W.season === 'thaw';
  const body = S.batch(), bone = S.batch(), rib = S.ribbons(), ice = S.batch(), gold = [], hearts = [], gravel = [];
  // underside of the ice and the cracks in it (plates seen edge-on)
  {
    const P = [], D = [], G = [], I = [], nz = 60;
    for (let j = 0; j <= nz; j++) for (let i = 0; i <= 4; i++) {
      const z = -40 + 136 * j / nz, x = -3.4 + 6.8 * i / 4;
      P.push(x, -0.16 - 0.05 * W.n.n2(x * 0.5, z * 0.3), z); D.push(0, z, 0, 0); G.push(0);
      if (i < 4 && j < nz) { const q = j * 5 + i; I.push(q, q + 5, q + 1, q + 1, q + 5, q + 6); }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aData', new THREE.Float32BufferAttribute(D, 4));
    g.setAttribute('aGain', new THREE.Float32BufferAttribute(G, 1)); g.setIndex(I); g.computeVertexNormals();
    W.add(g, S.shell({ density: 0.005, edge: 0.012, sharp: true, far: [95, 170, 0.95] }));      // (far: from the summit the whole brook lies end-on in a few pixels and its sheets added up to a white tile; beyond 95 m its matter thins toward film)
    // the edges of the ice plates: thin standing walls through the sheet, bright only where the eye runs along them
    for (let c = 0; c < (thaw ? 26 : 14); c++) {
      let x = rng.range(-2.9, 2.9), z = rng.range(-6, 92), a = rng() * TAU; const pts = [], bend = rng.gauss() * 0.16;
      for (let k = 0; k < 9; k++) { pts.push(V(x, -0.07, z)); a += bend + rng.gauss() * 0.08; const l = rng.range(0.35, 0.8); x = Math.max(-3.2, Math.min(3.2, x + Math.cos(a) * l)); z += Math.sin(a) * l; }
      const sp = smoothPts(pts, 2); ice.tube(sp, sp.map((_, k) => 0.02 + 0.08 * Math.sin(Math.PI * k / (sp.length - 1))), 4, { flat: 0.05, up: V(0, 1, 0), depth: 0, phase: rng() });
    }
  }
  // a trout: body contour, skull, spine, rib fans above and below, tail and fin rays; sway weight grows to the tail
  const trout = (c, L, yaw, roll = 0, rnd = rng) => {
    const cy = Math.cos(yaw), sy = Math.sin(yaw), ph = rnd(), cr = Math.cos(roll), sr = Math.sin(roll), UP = V(sr * cy, cr, -sr * sy);
    const at = (t, u0 = 0, s0 = 0) => { const up = u0 * cr - s0 * sr, side = u0 * sr + s0 * cr; return V(c.x + (t - 0.4) * L * sy + side * cy, c.y + up, c.z + (t - 0.4) * L * cy - side * sy); };   // t 0 nose .. 1 tail; rolled onto a flank
    const prof = (t) => 0.13 * L * Math.pow(Math.sin(Math.PI * Math.min(1, 0.06 + 0.94 * t) ** 0.7), 0.8) * (1 - 0.45 * t);
    const sw = (t) => 0.15 + 0.85 * t * t, pts = [], rr = [], sws = [];
    for (let i = 0; i <= 10; i++) { const t = i / 10 * 0.9; pts.push(at(t)); rr.push(Math.max(0.006, prof(t))); sws.push(sw(t)); }
    body.tube(pts, rr, 8, { depth: 0, sway: sws, phase: ph, flat: 0.5, up: UP });
    body.ball(at(0.4, 0.035 * L), 0.032 * L, { len: 0.11 * L, axis: V(sy, 0, cy), rings: 5, sides: 6, depth: 0, sway: 0.4, phase: ph });     // the swim bladder
    bone.tube([at(0.0), at(0.08), at(0.2)], [0.03 * L, 0.075 * L, 0.05 * L], 6, { depth: 0, phase: ph, sway: 0.15, flat: 0.6, up: UP, gain: 0.3 });
    const sp = []; for (let i = 0; i <= 12; i++) sp.push(at(0.18 + 0.72 * i / 12, 0.02 * L));
    rib.add(sp, 0.022 * L, { depth: 0, phase: ph, sway: sp.map((_, i) => sw(0.18 + 0.72 * i / 12)) });
    for (let i = 0; i < 13; i++) {
      const t = 0.22 + 0.5 * i / 12, h = prof(t) * 0.95, s = sw(t);
      rib.add([at(t, 0.02 * L), at(t + 0.02, 0.02 * L + h * 0.6, h * 0.16), at(t + 0.05, 0.02 * L + h, 0)], 0.008 * L, { depth: 0, phase: ph, sway: s });
      rib.add([at(t, 0.02 * L), at(t + 0.015, -h * 0.5, h * 0.42), at(t + 0.04, -h * 0.95, h * 0.2)], 0.008 * L, { depth: 0, phase: ph, sway: s });
      rib.add([at(t, 0.02 * L), at(t + 0.015, -h * 0.5, -h * 0.42), at(t + 0.04, -h * 0.95, -h * 0.2)], 0.008 * L, { depth: 0, phase: ph, sway: s });
    }
    for (let k = -3; k <= 3; k++) rib.add([at(0.9, 0.02 * L), at(1.04, 0.02 * L + k * 0.035 * L)], 0.007 * L, { depth: 0, phase: ph, sway: [0.9, 1.3] });
    for (let k = 0; k < 4; k++) {
      rib.add([at(0.5 + k * 0.03, prof(0.5)), at(0.56 + k * 0.035, prof(0.5) + 0.07 * L)], 0.006 * L, { depth: 0, phase: ph, sway: 0.5 });
      rib.add([at(0.26, -0.03 * L, 0.05 * L), at(0.33 + k * 0.012, -0.1 * L, (0.1 + k * 0.03) * L)], 0.006 * L, { depth: 0, phase: ph, sway: [0.2, 0.9] });
      rib.add([at(0.26, -0.03 * L, -0.05 * L), at(0.33 + k * 0.012, -0.1 * L, -(0.1 + k * 0.03) * L)], 0.006 * L, { depth: 0, phase: ph, sway: [0.2, 0.9] });
    }
    const hp = at(0.24, -0.03 * L); hearts.push([hp.x, hp.y, hp.z, 0, 0.085 * L, 0, rnd()]);
  };
  // eleven trout. The first three hang under the lens of the entry frame, broadside and rolled onto a flank so that spine,
  // rib fans and heart are read at a glance; each has its redd of gold eggs in the gravel beneath it.
  const lead = [[-0.5, 15.6, 2.9, 1.13, 0.9], [1.25, 19.6, 2.5, -1.0, -0.85], [-1.2, 24.6, 2.3, 0.85, 0.8]];
  for (let i = 0; i < 11; i++) {
    const hero = lead[i], sgn = i % 2 ? 1 : -1;
    const z = hero ? hero[1] : 12.5 + i * 6.3 + rng.range(-1.5, 1.5), x = hero ? hero[0] : sgn * rng.range(0.2, 1.5), L = hero ? hero[2] : rng.range(1.6, 2.2);
    const yaw = Math.PI + (hero ? hero[3] : sgn * rng.range(0.55, 1.1)), roll = hero ? hero[4] : sgn * rng.range(0.5, 0.95), ty = -rng.range(0.5, 0.62);
    // the fourth is the great trout of the second picture (u 0.08): broadside under the lens, its flank turned up to the eye
    if (i === 3) trout(V(GREAT.x, GREAT.y, GREAT.z), 3.3, Math.PI / 2, -0.4); else trout(V(x, ty, z), L, yaw, roll);
    const n = hero ? 70 : rng.int(30, 46), er = hero ? 0.72 : 0.5, ex = x + rng.range(-0.3, 0.3), ez = z + rng.range(-0.5, 0.4);     // a redd of eggs in the gravel
    if (i % 3 === 2) await W.tick();
    if (i === 3) { for (let k = 0; k < 150; k++) { const a = W.or() * TAU, r = 1.25 * Math.sqrt(W.or()); gold.push([GREAT.x + 0.2 + Math.cos(a) * r * 1.35, -0.93 - 0.08 * W.or(), GREAT.z + Math.sin(a) * r * 0.8, 0.3, 0.085, 0.5, W.or()]); } }
    for (let k = 0; k < n; k++) { const a = rng() * TAU, r = er * Math.sqrt(rng()); gold.push([ex + Math.cos(a) * r, -0.92 - 0.08 * rng(), ez + Math.sin(a) * r * 1.3, 0.3, 0.08, 0.5, rng()]); }
  }
  // two more hang where the arrival frame (u 0) looks, so the first thing seen is a fish skeleton at reading size; they
  // draw from the world's own variation stream and are under the lens by the entry beat, so nothing else moves
  for (const [x, z, L, yw, rl] of [[-0.7, 7.4, 2.7, 1.1, 0.9], [1.4, 10.6, 2.3, -1.0, -0.85]]) {
    trout(V(x, -0.56, z), L, Math.PI + yw, rl, W.vr);
    for (let k = 0; k < 60; k++) { const a = W.vr() * TAU, q = 0.7 * Math.sqrt(W.vr()); gold.push([x + Math.cos(a) * q, -0.92 - 0.08 * W.vr(), z + Math.sin(a) * q * 1.3, 0.3, 0.08, 0.5, W.vr()]); }
  }
  for (let i = 0; i < Math.round(2400 * W.detail); i++) { const x = rng.range(-3.1, 3.1), z = rng.range(-20, 92); gravel.push([x, -0.95 - 0.35 * rng() * rng(), z, i % 5 < 2 ? 0.3 : 2.4, rng.range(0.04, 0.11), 0.3, rng()]); }
  await W.tick();
  // reeds standing in the ice, each a hollow stem (two walls) with a drooping plume; alders on the banks with gold cones
  const reed = S.ribbons(), stem = S.batch();
  for (let i = 0; i < Math.round(170 * W.detail * W.density); i++) {
    const side = rng() < 0.5 ? -1 : 1, z = rng.range(-4, 96), x = side * rng.range(2.5, 4.1), h = rng.range(1.1, 2.6), lean = rng.range(-0.25, 0.25), ph = rng();
    const pts = [], sw = [], rr = [], r0 = rng.range(0.026, 0.04);
    for (let k = 0; k <= 4; k++) { const t = k / 4; pts.push(V(x + lean * t * t * h, -0.2 + (h + 0.2) * t, z + 0.3 * lean * t)); sw.push(t * t); rr.push(r0 * (1 - 0.45 * t)); }
    const skip = W.route.path.nearestXZ(x, z).dist < 1.6;                 // none in the flight's own corridor (every draw is still made)
    if (!skip) stem.tube(pts, rr, 5, { depth: 0, sway: sw, phase: ph });            // a hollow stem: its two walls are its own limbs
    const tx = x + lean * h, tz = z + 0.3 * lean, nf = 4;
    for (let f = 0; f < nf; f++) {                                       // the plume: a small fan of fine drooping awns
      const a = rng() * TAU, l = rng.range(0.22, 0.42), pl = [], ps = [];
      for (let k = 0; k <= 3; k++) { const t = k / 3; pl.push(V(tx + Math.cos(a) * l * t, h + 0.14 * t - 0.42 * l * 2.4 * t * t, tz + Math.sin(a) * l * t)); ps.push(1 + t); }
      if (!skip) reed.add(pl, 0.012, { depth: 0, sway: ps, phase: ph });
    }
    if (i % 40 === 39) await W.tick();
  }
  await W.tick();
  // the alders' vault over the brook: up to three long boughs more to an alder, arching toward the centre line and stopping short of
  // it, hung with twigs that end in gold cones; and gold cones in clusters along the outer half of each of the alder's own boughs. Not every alder has three more boughs: a
  // bough or cone that would stand nearer the course's line than 4.05 m is not laid, so the alders that stand nearest the course
  // carry few or none. All its dice come from a stream of its own.
  const ar = W.ctx.core.makeRng(W.ctx.core.hashSeed('sleeping-hill-alders:' + W.ctx.seed));
  const crs = W.route.path, CLEAR = 4, RIDGE = 4.5, FLOOR = 5.5, MAXC = 2400;
  // nothing of the vault stands nearer the course's line than 4.05 m, and nothing is moved to make it so: what would stand nearer is
  // not laid. (The line is measured at its own samples, 1.1 m apart: 0.05 m of room keeps the line between two samples 4 m off as well.)
  const ROOM = CLEAR + 0.05, off = (p) => crs.distanceTo(p.x, p.y, p.z);
  // a cone hangs where its bough or twig puts it and is never moved: the cones along an alder's own boughs hang under their bough
  // wherever that is; a twig's cone that would hang lower than 5.5 m within 4.5 m of the centre line is not laid (the vault's own
  // floor). The cap counts the cones laid.
  let cones = 0;
  const cone = (px, py, pz, twig) => {
    if (cones >= MAXC) return;
    const p = V(px, py, pz); if (twig && Math.abs(p.x) < RIDGE && p.y < FLOOR) return;
    if (off(p) < ROOM) return;
    gold.push([p.x, p.y, p.z, 0, 0.075, 0.6, ar()]); cones++;
  };
  for (let i = 0; i < 14; i++) {
    const side = i % 2 ? -1 : 1, z = 4 + i * 6.4 + rng.range(-2, 2), x = side * rng.range(5.4, 7.2), y0 = H(x, z), ph = rng();
    for (let b = 0; b < 5; b++) {
      const a = rng() * TAU, h = rng.range(2.2, 4.6), out = rng.range(0.6, 1.8), pts = [], sw = [], w = [];
      for (let k = 0; k <= 5; k++) { const t = k / 5; pts.push(V(x + Math.cos(a) * out * t * t - side * 1.4 * t * t, y0 + h * t - 0.5 * t * t * t, z + Math.sin(a) * out * t)); sw.push(t * t); w.push(0.07 * (1 - 0.8 * t)); }
      reed.add(pts, w, { depth: 0, sway: sw, phase: ph });
      const tip = pts[5];
      for (let k = 0; k < 7; k++) gold.push([tip.x + rng.gauss() * 0.12, tip.y - 0.1 - 0.3 * rng(), tip.z + rng.gauss() * 0.12, 0, 0.075, 0.6, rng()]);
      {
        // cones along the outer half of this bough: a cluster to every 0.6 m, hanging 0.1 to 0.3 m under it and up to 0.43 m aside in plan
        const bp = (t) => V(x + Math.cos(a) * out * t * t - side * 1.4 * t * t, y0 + h * t - 0.5 * t * t * t, z + Math.sin(a) * out * t);
        const m = bp(0.5), e = bp(1), half = Math.hypot(e.x - m.x, e.y - m.y, e.z - m.z), nc = Math.max(1, Math.ceil(half / 0.6));
        for (let j = 0; j < nc; j++) {
          const q = bp(0.5 + 0.5 * (j + 0.5) / nc), n = 3 + Math.floor(ar() * 3);
          for (let k = 0; k < n; k++) cone(q.x + ar.gauss() * 0.09, q.y - 0.1 - 0.2 * ar(), q.z + ar.gauss() * 0.09);
        }
      }
    }
    for (let b = 0; b < 3; b++) {
      // (the three stand as a stool, each 0.3 m from the foot's centre and a third of a turn apart; no dice: the alder's own phase turns it)
      const sa = (b / 3 + ph) * TAU, bx = x + Math.cos(sa) * 0.3, bz = z + Math.sin(sa) * 0.3;
      // a bough leaves its foot: where the foot itself stands nearer the course's line than 4.05 m there is no bough, and it takes no dice
      if (off(V(bx, y0, bz)) < ROOM) continue;
      // a vault bough as dealt: it leaves the alder's foot, rises to a crest 6.5 to 9 m over the ice and arches toward the centre line,
      // to end 2.5 to 3.5 m short of it and 1 to 4 m up or down the brook from the alder's centre (a bough that the 4.05 m rule below ends stops
      // where the rule stops it). None crosses the centre line, and no vault bough or twig's cone within 4.5 m of that line is lower than 5.5 m over
      // the ice; the cones along the alder's own boughs hang lower there, under those boughs (2 to 4.8 m over the ice).
      const crest = ar.range(6.5, 9), xe = side * ar.range(2.5, 3.5), ze = z + (ar() < 0.5 ? -1 : 1) * ar.range(1, 4), drop = Math.min(ar.range(0, 0.7), Math.max(0, crest - 6.6));
      let pts = [];
      for (let k = 0; k <= 8; k++) {
        const t = k / 8, s = Math.pow(t, 1.6), up = t < 0.7 ? Math.pow(Math.sin(Math.PI / 2 * t / 0.7), 0.75) : 1;
        pts.push(V(bx + (xe - bx) * s, y0 + (crest - y0) * up - (t > 0.7 ? drop * ((t - 0.7) / 0.3) ** 2 : 0), bz + (ze - bz) * s));
      }
      pts = smoothPts(pts, 1);
      const n = pts.length - 1, sw = [], w = [];
      // the bough ends where its next point, or the middle of the stroke to it, would come nearer the course's line than 4.05 m: the rest is not laid
      let m = 0, len = 0;
      for (; m <= n; m++) {
        const p = pts[m], q = pts[m - 1];
        if (Math.abs(p.x) < RIDGE + 0.1) p.y = Math.max(p.y, FLOOR + 0.1);
        if (off(p) < ROOM || (q && off(V((p.x + q.x) / 2, (p.y + q.y) / 2, (p.z + q.z) / 2)) < ROOM)) break;
        if (q) len += Math.hypot(p.x - q.x, p.y - q.y, p.z - q.z);
      }
      // ...and a bough that would then be shorter than 2 m along its own length, or reach less than 2 m in plan from its foot to its
      // last point (an upright stub), is not laid at all, with its twigs and cones
      if (len < 2 || Math.hypot(pts[m - 1].x - bx, pts[m - 1].z - bz) < 2) continue;
      pts.length = m; const e = m - 1;
      for (let k = 0; k <= e; k++) { const t = k / n; sw.push(t * t); w.push(0.07 * (1 - 0.8 * k / e)); }
      reed.add(pts, w, { depth: 0, sway: sw, phase: ph });
      const nt = 4 + Math.floor(ar() * 3);
      for (let j = 0; j < nt; j++) {
        // a twig 0.4 to 0.9 m long hanging from the bough's outer half, a cluster of four to seven cones at its end; one that would
        // hang from the part not laid, or come nearer the course's line than 4.05 m, is not laid, with its cones
        const f = (0.62 + 0.38 * (j + ar()) / nt) * n; if (f >= e) continue;
        const k0 = Math.floor(f), fr = f - k0, A = pts[k0], B = pts[k0 + 1];
        const at = V(A.x + (B.x - A.x) * fr, A.y + (B.y - A.y) * fr, A.z + (B.z - A.z) * fr), tw = (f / n) ** 2;
        let l = ar.range(0.4, 0.9); if (Math.abs(at.x) < RIDGE + 0.2) l = Math.max(0.2, Math.min(l, at.y - FLOOR - 0.35));
        const dx = ar.range(-0.07, 0.07), dz = ar.range(-0.07, 0.07), tp = [at, V(at.x + dx * 0.4, at.y - l * 0.5, at.z + dz * 0.4), V(at.x + dx, at.y - l, at.z + dz)];
        if (off(tp[1]) < ROOM || off(tp[2]) < ROOM) continue;
        reed.add(tp, [0.03, 0.022, 0.012], { depth: 0, sway: [tw, tw + 0.15, tw + 0.35], phase: ph });
        const nk = 4 + Math.floor(ar() * 4);
        for (let k = 0; k < nk; k++) cone(tp[2].x + ar.gauss() * 0.09, tp[2].y - 0.05 - 0.2 * ar(), tp[2].z + ar.gauss() * 0.09, true);
      }
    }
    if (i % 3 === 2) await W.tick();
  }
  await W.tick();
  W.add(body.build(), S.shell({ density: 0.055, sway: 0.07, far: [95, 170, 0.95] }));
  W.add(bone.build(), S.shell({ tint: 'white', density: 0.12, sway: 0.07, far: [95, 170, 0.95] })); await W.tick();
  W.add(rib.build(), S.line({ tint: 'white', density: 0.75, sway: 0.07 }));
  await W.tick();
  W.add(ice.build(), S.shell({ density: 0.012, edge: 0.05, sharp: true, far: [95, 170, 0.95] }));
  W.add(stem.build(), S.shell({ density: 0.12, sway: 0.05, far: [95, 170, 0.95] }));
  W.add(reed.build(), S.line({ density: 0.3, sway: 0.05 })); await W.tick();
  // (points never shrink below two pixels: from the summit the brook's 2400 gravel sparks fell into a patch 25 pixels across and
  // added up to a solid white tile, so they are gone by 150 m; from anywhere on the brook nothing changes)
  W.addPts(S.pointCloud(gold), S.points({ tint: 'gold', density: 1.0, glow: true, lod: [60, 100, 170] }));
  W.addPts(S.pointCloud(gravel), S.points({ density: 0.5, lod: [60, 95, 150] }));
  W.addPts(S.pointCloud(hearts), S.points({ tint: 'heart', density: 1.0, glow: true, pulse: true, warm: [0, 0.3, 0, 1.0] }));
  await W.tick();
}

// ---- the birch wood: double-walled trunks, hanging twig fans, a shallow plate of roots, and the fungal lace ----------
async function buildBirches(W, route) {
  const { S, rng, H } = W, outer = S.batch(), inner = S.batch(), twig = S.ribbons(), root = S.ribbons(), rootT = S.batch(), lace = S.ribbons(), frost = S.ribbons();
  const trees = [];
  const spot = (x, z, big, pair) => trees.push({ x, z, h: big ? rng.range(14, 18) : rng.range(9, 15), r: (big ? rng.range(0.17, 0.25) : rng.range(0.12, 0.18)) + (pair ? 0.03 : 0), big, pair });
  // round five: the deer of the birch pair is staged for the still at u 0.25 (12 m off, left of centre, a fifth of the frame tall), and a
  // second stands 8 m off on the right of the path at u 0.34, in front of the lit hill face (eye0: where the first used to be staged;
  // what was placed from there keeps its place)
  const eye0 = route.path.pointAt(0.31), eye = route.path.pointAt(0.25), eye2 = route.path.pointAt(0.34);
  const dz = V(eye.x + 3.3, 0, eye.z + 6.7), yawD = 2.525, sD = 2.35;       // deer 0: broadside to the eye
  const chest = V(dz.x + Math.cos(yawD) * 0.2 * sD, 0, dz.z + Math.sin(yawD) * 0.2 * sD);
  const flank = V(dz.x - Math.cos(yawD) * 0.3 * sD, 0, dz.z - Math.sin(yawD) * 0.3 * sD);      // the trunks cross the ribcage's rear half from u 0.29 to 0.32
  const vx = flank.x - eye.x, vz = flank.z - eye.z, vl = Math.hypot(vx, vz), mid = V(eye.x + vx * 0.9, 0, eye.z + vz * 0.9);
  W.deerSpots = [[dz.x, dz.z, yawD, sD], [-8.6, 109, 0.8, 1.7], [12.6, 88, -0.6, 1.4], [14.5, eye0.z + 21, 0.75, 1.4], [eye2.x - 3.2, eye2.z + 5.6, 0.22, 2.25]];
  W.deer2Look = new THREE.Vector3(eye2.x - 2.6, H(eye2.x - 3.2, eye2.z + 5.6) + 1.7, eye2.z + 5.6);
  W.deerLook = new THREE.Vector3(chest.x, H(chest.x, chest.z) + 0.95, chest.z); W.deerU = [0.2, 0.275];
  // the pair the deer is seen through: one trunk crosses its haunch and one its shoulder, the ribcage and both lungs between them, the head clear
  for (const k of [-0.47, 0.43]) { const tx = dz.x + Math.cos(yawD) * k * sD, tz = dz.z + Math.sin(yawD) * k * sD; spot(eye.x + (tx - eye.x) * 0.9, eye.z + (tz - eye.z) * 0.9, true, true); }
  spot(-9.6, eye0.z + 13.5, true); spot(-8.2, eye0.z + 27, true);          // and the birch that fills the right of that frame with its root plate
  for (let i = 0; i < 38; i++) {                                        // the wood proper, nearest trunks 7 m either side
    let x, z, ok, tries = 0;
    do {
      z = 60 + 84 * ((i + rng()) / 38); x = (i % 2 ? -1 : 1) * (7 + 30 * Math.pow(rng(), 1.5));
      ok = trees.every((t) => Math.hypot(t.x - x, t.z - z) > 3.2) && !(x > 0 && x < 10.5 && z > eye0.z - 6 && z < eye0.z + 13);
    } while (!ok && ++tries < 12);
    if (x > -1 && x < 11 && z > eye.z - 3 && z < eye.z + 19) x += 11;      // (none between the lens and the deer; no draw is added or lost)
    if (x < -1 && x > -11.5 && z > eye2.z - 2 && z < eye2.z + 14) x -= 10;      // nor across the second deer
    spot(x, z, true);
  }
  for (const [x, z] of [[-7.4, 22], [8.2, 34], [-8.8, 46], [7.6, 55]]) spot(x, z, true);          // sentinels along the brook
  const nFar = Math.round(46 * W.detail);
  for (let i = 0; i < nFar; i++) {                                      // outliers: the far layer on both flanks and round the hill
    const z = rng.range(-10, 330), x = (rng() < 0.5 ? -1 : 1) * rng.range(26, 120);
    if (Math.hypot(x - OX, z - OZ) > 46) spot(x, z, false);
  }
  for (let ti = 0; ti < trees.length; ti++) {
    const t = trees[ti], y0 = H(t.x, t.z), ph = rng(), wb = t.pair ? 0.3 : 1, lx = rng.range(-0.8, 0.8) * wb, lz = rng.range(-0.8, 0.8) * wb, n = t.big ? 9 : 6;
    const at = (f) => V(t.x + lx * f * f + 0.25 * wb * Math.sin(f * 5 + ph * 9) * f * 4 / (1 + f * 3), y0 - 0.6 + (t.h + 0.6) * f, t.z + lz * f * f + 0.25 * wb * Math.cos(f * 4 + ph * 7) * f * 4 / (1 + f * 3));
    const pts = [], rr = [], sw = [];
    for (let k = 0; k <= n; k++) { const f = k / n; pts.push(at(f)); rr.push(t.r * (1 - 0.86 * f) + 0.012); sw.push(f * f * 0.35); }
    outer.tube(pts, rr, t.big ? 8 : 5, { depth: 0, sway: sw, phase: ph, gain: 0.5 });
    if (t.big) inner.tube(pts, rr.map((r) => r * 0.58), 6, { depth: 0, sway: sw, phase: ph });
    const nb = t.big ? rng.int(7, 10) : 4;
    for (let b = 0; b < nb; b++) {                                      if (b % 4 === 3) await W.tick();   // ascending branches, each ending in a hanging fan of twigs
      const f0 = 0.3 + 0.62 * (b + rng()) / nb, o = at(f0), a = rng() * TAU, L = t.h * rng.range(0.14, 0.28) * (1.15 - f0), bp = [], br = [], bs = [];
      for (let k = 0; k <= 4; k++) { const q = k / 4; bp.push(V(o.x + Math.cos(a) * L * q * 0.75, o.y + L * (0.9 * q - 0.35 * q * q), o.z + Math.sin(a) * L * q * 0.75)); br.push(t.r * 0.3 * (1 - f0) * (1 - 0.75 * q) + 0.012); bs.push(f0 * f0 * 0.35 + q * 0.3); }
      if (t.big) outer.tube(bp, br, 4, { depth: 0, sway: bs, phase: ph }); else twig.add(bp, br.map((r) => r * 2), { depth: 0, sway: bs, phase: ph });
      const nt = t.big ? 5 : 2;
      for (let k = 0; k < nt; k++) {
        const s = bp[2 + (k % 3)], a2 = a + rng.gauss() * 0.9, l2 = rng.range(0.9, 2.3), tp = [], ts = [];
        for (let j = 0; j <= 4; j++) { const q = j / 4; tp.push(V(s.x + Math.cos(a2) * l2 * 0.55 * q, s.y + l2 * (0.35 * q - 1.0 * q * q), s.z + Math.sin(a2) * l2 * 0.55 * q)); ts.push(0.5 + q * 1.6); }
        twig.add(tp, 0.022, { depth: 0, sway: ts, phase: ph + k * 0.13 });
        if (W.weather === 'hoar' && t.big) for (let j = 1; j <= 4; j++) {     // hoar frost: needles furring the twig
          const c = tp[j], a3 = rng() * TAU, l3 = rng.range(0.1, 0.24);
          frost.add([c, V(c.x + Math.cos(a3) * l3, c.y + rng.range(-0.3, 1) * l3, c.z + Math.sin(a3) * l3)], 0.008, { depth: 0, sway: ts[j], phase: ph + k * 0.13 });
        }
      }
    }
    const nearPath = Math.abs(t.x) < 17 && t.z > 20 && t.z < 150;
    if (t.big) for (let k = 0; k < 7; k++) {                             // the plate of roots, 0.3-1.1 m under the snow line
      const a = k * 0.9 + rng(), L = rng.range(2.4, 5.2), rp = [], rw = [], rs = [];
      for (let j = 0; j <= 5; j++) { const q = j / 5, x = t.x + Math.cos(a + 0.4 * q * Math.sin(k)) * L * q, z = t.z + Math.sin(a + 0.4 * q * Math.sin(k)) * L * q; rp.push(V(x, H(x, z) - 0.25 - 0.85 * Math.sqrt(q), z)); rw.push(0.11 * (1 - 0.85 * q) + 0.012); rs.push(q * 0.4); }
      const dep = (p) => 0.25 + 0.5 * (H(p.x, p.z) - p.y - 0.25);
      if (nearPath) { rootT.tube(rp, rw.map((w) => w * (t.pair ? 1.15 : 0.8)), 5, { depth: dep, sway: rs, phase: ph }); if (k % 2 === 0) rootT.tube(rp.slice(0, 4), rw.slice(0, 4).map((w) => w * (t.pair ? 0.55 : 0.38)), 3, { depth: dep, sway: rs.slice(0, 4), phase: ph }); }
      else root.add(rp, rw.map((w) => w * 0.5), { depth: dep, sway: rs, phase: ph });
    }
    await W.tick();
  }
  // fungal lace: the faintest threads from tree to tree and up the hill to the oak, beads of light passing along them
  const big = trees.filter((t) => t.big);
  const strand = (x, z, head, len, sag, gen) => {
    const pts = [], ph = rng(), n = Math.max(4, Math.round(len / 1.6)), forks = [];
    for (let k = 0; k <= n; k++) {
      const q = k / n;
      if (route.path.nearestXZ(x, z).dist < 2.6) break;
      pts.push(V(x, H(x, z) - 0.7 - sag * Math.sin(Math.PI * q), z));
      head += 0.42 * W.n.n2(k * 0.33 + ph * 50, gen * 7.3 + 1.7) + 0.16 * W.n.n2(k * 1.1, ph * 31);
      x += Math.cos(head) * 1.6; z += Math.sin(head) * 1.6;
      if (gen < 2 && k > 1 && k < n - 2 && rng() < 0.14) forks.push([x, z, head + (rng() < 0.5 ? -1 : 1) * rng.range(0.5, 1.1), len * (1 - q) * rng.range(0.5, 0.9)]);
    }
    if (pts.length > 2) lace.add(smoothPts(pts, 1), 0.012, { depth: (p) => Math.min(1.4, 0.5 + 0.3 * (H(p.x, p.z) - p.y)), phase: ph, alongK: 2.2 });
    for (const f of forks) strand(f[0], f[1], f[2], f[3], sag * 0.6, gen + 1);
  };
  for (let i = 0; i < big.length; i++) {
    const near = big.map((t, j) => [Math.hypot(t.x - big[i].x, t.z - big[i].z), j]).filter((e) => e[1] !== i).sort((p, q) => p[0] - q[0]);
    for (let k = 0; k < 2; k++) if (near[k] && near[k][0] < 30) { const o = big[near[k][1]]; strand(big[i].x, big[i].z, Math.atan2(o.z - big[i].z, o.x - big[i].x) + rng.range(-0.5, 0.5), near[k][0] * 1.1, rng.range(0.1, 0.7), 1); }
    if (i % 3 === 2) await W.tick();
  }
  await W.tick();
  for (let i = 0; i < 22; i++) {                                         // and out from the oak's roots over the hill, forking as it goes
    const a = rng() * TAU, r0 = rng.range(5, 14);
    strand(OX + Math.cos(a) * r0, OZ + Math.sin(a) * r0, a + rng.range(-0.7, 0.7), rng.range(22, 44), rng.range(0.3, 2.2), 0);
    if (i % 2 === 1) await W.tick();
  }
  await W.tick();
  W.add(outer.build(), S.shell({ density: 0.055, sway: 0.06, flow: 0.2 })); await W.tick();
  W.add(inner.build(), S.shell({ density: 0.03, inner: true, sway: 0.06, beads: 0.25, warm: [0, 0, 0, 0.01] })); await W.tick();
  W.add(twig.build(), S.line({ density: 0.24, sway: 0.07, lod: [23.3, 38.9, 260] })); await W.tick();      // (round near sap: fine matter is seen near: whole to 14 m, gone by 35 m)
  W.add(root.build(), S.line({ density: 0.17, sway: 0.04 })); await W.tick();
  W.add(rootT.build(), S.shell({ density: 0.085, sway: 0.04 })); await W.tick();
  W.add(lace.build(), S.line({ density: 0.09, beads: 0.7, warm: [0.7, 0.8, 1, 0], near: [1.5, 4, 1.5] }));      // the threads light gold from the oak outward
  await W.tick();
  if (frost.tris) W.add(frost.build(), S.line({ tint: 'white', density: 0.3, sway: 0.07, lod: [23.3, 38.9, 260] }));      // (the frost falls away with its twig)
  W.trees = trees;
  await W.tick();
}

// ---- five roe deer among the birches: skeletons inside faint contours, lungs filling, breath rings, heads turning ----
async function buildDeer(W, route) {
  const { S, rng, H, scene } = W, body = S.batch(), lung = S.batch(), bone = S.batch(), rib = S.ribbons(), hearts = [], deer = [];
  const mSkin = S.shell({ density: 0.095, breath: 0.012 }), mBone = S.shell({ tint: 'white', density: 0.42 });
  const spots = W.deerSpots;                                           // [0] stands behind the birch pair; [4] is the small one on the right of that frame
  for (let di = 0; di < spots.length; di++) {
    const [cx, cz, yaw, s] = spots[di], y0 = H(cx, cz) - 0.22, cy = Math.cos(yaw), sy = Math.sin(yaw), ph = rng();
    const at = (x, y, z = 0) => V(cx + (x * cy - z * sy) * s, y0 + y * s, cz + (x * sy + z * cy) * s);
    const spineY = (x) => 0.80 - 0.05 * Math.cos(x * 3.2) + 0.03 * x;
    // contour of the trunk, the two lungs inside it, the gut as a fainter inner shell
    const tp = [], tr = [], tw = [];
    for (let k = 0; k <= 10; k++) { const x = -0.52 + 1.0 * k / 10, f = k / 10; tp.push(at(x, spineY(x) - 0.19 - 0.03 * Math.sin(f * 3.1))); tr.push(s * (0.05 + 0.2 * Math.pow(Math.sin(Math.PI * (0.06 + 0.9 * f)), 0.6) * (0.85 + 0.25 * f))); tw.push(sstep(0.3, 0.8, f)); }
    body.tube(tp, tr, 9, { depth: 0, sway: tw, phase: ph, flat: 0.72, up: V(0, 1, 0) });
    for (const z of [-0.075, 0.075]) { lung.ball(at(0.18, 0.655, z), 0.1 * s, { len: 0.2 * s, axis: V(cy, 0.15, sy), depth: 0, sway: 1, phase: ph, rings: 6, sides: 8 }); lung.ball(at(0.17, 0.66, z), 0.06 * s, { len: 0.14 * s, axis: V(cy, 0.15, sy), depth: 0, sway: 1, phase: ph, rings: 4, sides: 6 }); }
    body.ball(at(-0.18, 0.6), 0.13 * s, { len: 0.2 * s, axis: V(cy, 0, sy), depth: 0, sway: 0.3, phase: ph, rings: 5, sides: 7 });
    // spine (beaded), ribs, pelvis, shoulder blades, tail
    const sp = [], sr = [];
    for (let k = 0; k <= 22; k++) { const x = -0.5 + 0.92 * k / 22; sp.push(at(x, spineY(x))); sr.push(s * (k % 2 ? 0.024 : 0.013)); }
    bone.tube(sp, sr, 4, { depth: 0 }); rib.add(sp, 0.036 * s, { depth: 0 });
    for (let k = 0; k < 11; k++) {
      const x = 0.34 - 0.5 * k / 10, len = 0.3 * (0.75 + 0.25 * Math.sin(Math.PI * k / 10)), wd = 0.14 * (0.6 + 0.4 * Math.sin(Math.PI * (k + 2) / 13));
      for (const sd of [-1, 1]) {
        const pts = []; for (let j = 0; j <= 5; j++) { const q = j / 5; pts.push(at(x - 0.07 * q * q, spineY(x) - len * q, sd * wd * Math.sin(Math.PI * Math.min(1, q * 0.92)) * 1.05)); }
        rib.add(pts, 0.015 * s, { depth: 0, sway: 0.6, phase: ph });
      }
    }
    for (const sd of [-1, 1]) {
      // pelvis: the ilium blade as a closed rim from the sacrum down to the hip socket, and the socket as a small ring
      const il = [[-0.3, 0.84], [-0.36, 0.86], [-0.44, 0.82], [-0.5, 0.74], [-0.56, 0.66], [-0.6, 0.6], [-0.55, 0.58], [-0.48, 0.62], [-0.42, 0.67], [-0.36, 0.72], [-0.3, 0.78], [-0.3, 0.84]];
      bone.tube(smoothPts(il.map((p) => at(p[0], p[1], sd * (0.05 + 0.5 * (0.84 - p[1]) * 0.3))), 1), 0.011 * s, 4, { depth: 0, gain: 0.5 });
      const so = []; for (let k = 0; k <= 8; k++) { const a = k / 8 * TAU; so.push(at(-0.45 + 0.035 * Math.cos(a), 0.68 + 0.035 * Math.sin(a), sd * 0.095)); }
      bone.tube(so, 0.008 * s, 4, { depth: 0, gain: 0.4 });
      // shoulder blade: a long triangle with its spine, hung from the withers
      const sc = [[0.3, 0.86], [0.4, 0.87], [0.45, 0.8], [0.44, 0.7], [0.43, 0.6], [0.4, 0.6], [0.36, 0.7], [0.31, 0.8], [0.3, 0.86]];
      bone.tube(smoothPts(sc.map((p) => at(p[0], p[1], sd * (0.085 + 0.1 * (0.86 - p[1])))), 1), 0.01 * s, 4, { depth: 0, gain: 0.5 });
      rib.add([at(0.36, 0.86, sd * 0.088), at(0.415, 0.6, sd * 0.11)], 0.012 * s, { depth: 0 });
    }
    rib.add([at(-0.52, 0.8), at(-0.6, 0.78), at(-0.64, 0.7)], 0.02 * s, { depth: 0, phase: ph });
    // legs: long bones as ribbons with knuckles, a faint contour round each
    const leg = (x, sd, fore, step) => {
      const j = fore ? [[x, 0.6], [x + 0.05 + step, 0.36], [x + 0.02 + step, 0.12], [x + 0.05 + step, -0.02]] : [[x, 0.68], [x + 0.1 + step, 0.42], [x - 0.07 + step, 0.2], [x - 0.02 + step, -0.02]];
      const pts = j.map((p) => at(p[0], p[1], sd * 0.085));
      body.tube(pts, [0.07 * s, 0.045 * s, 0.028 * s, 0.03 * s], 5, { depth: 0, phase: ph });
      const mid = (a, b, t) => V(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, a.z + (b.z - a.z) * t), w = [0.019, 0.015, 0.012];
      for (let i = 0; i < 3; i++) bone.tube([pts[i], mid(pts[i], pts[i + 1], 0.12), mid(pts[i], pts[i + 1], 0.5), mid(pts[i], pts[i + 1], 0.88), pts[i + 1]], [w[i] * 1.5 * s, w[i] * s, w[i] * 0.72 * s, w[i] * 0.9 * s, w[i] * 1.4 * s], 5, { depth: 0 });
      bone.tube([pts[3], V(pts[3].x + cy * 0.035 * s, pts[3].y - 0.04 * s, pts[3].z + sy * 0.035 * s)], [0.02 * s, 0.006 * s], 4, { depth: 0 });      // the hoof
    };
    leg(0.4, 1, true, 0.03); leg(0.4, -1, true, -0.04); leg(-0.44, 1, false, -0.03); leg(-0.44, -1, false, 0.05);
    hearts.push({ p: at(0.27, 0.55), r: 0.042 * s, phase: rng() });
    // neck and head: a group of its own, pivoting at the base of the neck (x forward, y up in its own frame)
    const g = new THREE.Group(), nb = at(0.44, 0.78); g.position.set(nb.x, nb.y, nb.z); g.rotation.order = 'YZX';
    const hb = S.batch(), hbone = S.batch(), L = (x, y, z = 0) => V(x * s, y * s, z * s);
    hb.tube([L(-0.04, -0.06), L(0.1, 0.12), L(0.2, 0.3), L(0.27, 0.42)], [0.11 * s, 0.085 * s, 0.065 * s, 0.06 * s], 7, { depth: 0, flat: 0.75 });
    hb.tube([L(0.2, 0.44), L(0.3, 0.46), L(0.42, 0.42), L(0.5, 0.39)], [0.05 * s, 0.07 * s, 0.045 * s, 0.028 * s], 7, { depth: 0 });
    for (const sd of [-1, 1]) hb.tube([L(0.24, 0.5, sd * 0.05), L(0.2, 0.6, sd * 0.1), L(0.17, 0.68, sd * 0.12)], [0.02 * s, 0.035 * s, 0.006 * s], 5, { depth: 0, flat: 0.3 });
    const nk = [], nr = [];
    for (let k = 0; k <= 12; k++) { const q = k / 12; nk.push(L(-0.02 + 0.27 * q + 0.03 * Math.sin(q * 3.1), 0.02 + 0.42 * q)); nr.push(s * (k % 2 ? 0.022 : 0.012)); }
    hbone.tube(nk, nr, 4, { depth: 0 });
    hbone.tube([L(0.22, 0.45), L(0.29, 0.47), L(0.38, 0.43), L(0.49, 0.395)], [0.03 * s, 0.05 * s, 0.03 * s, 0.014 * s], 6, { depth: 0, gain: 0.3 });
    hbone.tube([L(0.3, 0.4), L(0.4, 0.385), L(0.48, 0.375)], [0.012 * s, 0.012 * s, 0.008 * s], 4, { depth: 0 });     // jaw
    for (const sd of [-1, 1]) {                                          // the bone ring of each eye; short antler spikes on the first deer
      const ring = []; for (let k = 0; k <= 10; k++) { const a = k / 10 * TAU; ring.push(L(0.325 + 0.026 * Math.cos(a), 0.465 + 0.026 * Math.sin(a), sd * 0.047)); }
      hbone.tube(ring, 0.006 * s, 4, { depth: 0, gain: 0.6 });
      if (di === 0 || di === 3) hbone.tube([L(0.25, 0.5, sd * 0.03), L(0.22, 0.62, sd * 0.06), L(0.24, 0.72, sd * 0.07)], [0.012 * s, 0.009 * s, 0.003 * s], 4, { depth: 0 });
    }
    W.add(hb.build(), mSkin, g); W.add(hbone.build(), mBone, g); scene.add(g);
    await W.tick();
    deer.push({ g, yaw, x: nb.x, y: nb.y, z: nb.z, s, turn: 0, nod: 0, ph, u: route.path.nearestXZ(cx, cz).u, lifts: di === 0 || di === 2 });
  }
  W.add(body.build(), mSkin); await W.tick();
  W.add(lung.build(), S.shell({ tint: new THREE.Vector3(0.7, 0.86, 1.0), density: 0.4, breath: 0.085 }));
  W.add(bone.build(), mBone);
  W.add(rib.build(), S.line({ tint: 'white', density: 0.75 }));
  const hg = S.batch().ball(V(0, 0, 0), 1, { rings: 5, sides: 8, depth: 0 }).build(), hi = new Float32Array(hearts.length * 4), M = new THREE.Matrix4();
  const hm = new THREE.InstancedMesh(hg, S.shell({ tint: 'heart', density: 0.45, glow: true, pulse: true }), hearts.length);
  hearts.forEach((h, i) => { M.makeScale(h.r, h.r, h.r).setPosition(h.p.x, h.p.y, h.p.z); hm.setMatrixAt(i, M); hi.set([0, h.phase, 0, 0], i * 4); });
  hg.setAttribute('aInst', new THREE.InstancedBufferAttribute(hi, 4)); hm.frustumCulled = false; scene.add(hm);
  W.addPts(S.pointCloud(hearts.map((h) => [h.p.x, h.p.y, h.p.z, 0, h.r * 1.5, 0, h.phase])), S.points({ tint: 'heart', density: 0.9, glow: true, pulse: true, warm: [0, 0.3, 0, 0.25] }));      // a warm point two ribs wide, never a disc
  // breath: three soft rings per deer, leaving the nose, widening and thinning away
  const rg = S.batch(), rp = []; for (let k = 0; k <= 16; k++) { const a = k / 16 * TAU; rp.push(V(0, Math.cos(a), Math.sin(a))); }
  rg.tube(rp, 0.07, 5, { depth: 0 });
  const rgeo = rg.build(), NR = deer.length * 3, ri = new Float32Array(NR * 4);
  rgeo.setAttribute('aInst', new THREE.InstancedBufferAttribute(ri, 4));
  const rings = new THREE.InstancedMesh(rgeo, S.shell({ density: 0.06 }), NR); rings.frustumCulled = false; scene.add(rings);
  const q = new THREE.Quaternion(), e = new THREE.Euler(0, 0, 0, 'YZX'), pos = new THREE.Vector3(), sc = new THREE.Vector3(), nose = new THREE.Vector3();
  await W.tick();
  W.updaters.push((dt, time, camera, u) => {
    const owl = W.owlPos;
    for (let i = 0; i < deer.length; i++) {
      const d = deer[i];
      // heads turn to follow the owl; the nearest lifts its head as we come up; an idle look-about otherwise
      let want = 0.35 * Math.sin(time * 0.23 + d.ph * 9);
      if (owl) { let a = Math.atan2(owl.z - d.z, owl.x - d.x) - d.yaw; a = Math.atan2(Math.sin(a), Math.cos(a)); want = Math.max(-1.25, Math.min(1.25, a)) * sstep(60, 30, Math.hypot(owl.x - d.x, owl.z - d.z)) + want * 0.4; }
      d.turn += (want - d.turn) * Math.min(1, dt * 1.6);
      const lift = d.lifts ? sstep(d.u - 0.11, d.u - 0.05, u) : 0.6;
      d.nod = -0.55 + 0.75 * lift + 0.04 * Math.sin(time * 0.9 + d.ph * 5);
      d.g.rotation.set(0, -(d.yaw + d.turn), d.nod * 0.6);
      e.set(0, -(d.yaw + d.turn), d.nod * 0.6);
      nose.set(0.52 * d.s, 0.38 * d.s, 0).applyEuler(e); nose.x += d.x; nose.y += d.y; nose.z += d.z;
      const fx = Math.cos(d.yaw + d.turn), fz = Math.sin(d.yaw + d.turn);
      for (let k = 0; k < 3; k++) {
        const t = ((time * 0.28 + d.ph + k / 3) % 1), r = 0.05 + 0.5 * Math.sqrt(t), fade = Math.sin(Math.PI * Math.min(1, t * 1.02)) ;
        pos.set(nose.x + fx * 1.5 * t, nose.y + 0.5 * t * t - 0.12 * t, nose.z + fz * 1.5 * t);
        q.setFromEuler(e); sc.set(0.3 + 0.8 * t, r, r); ri[(i * 3 + k) * 4] = S.uniforms.uPen.value - 2 * fade;
        M.compose(pos, q, sc); rings.setMatrixAt(i * 3 + k, M);
      }
    }
    rings.instanceMatrix.needsUpdate = true; rgeo.attributes.aInst.needsUpdate = true;
  });
}

// ---- small runners (the vole, the mole): a skeleton in a faint contour, built along +Z, with two lagging ghosts -------
function critter(W, s, o = {}) {
  const { S } = W, skin = S.batch(), bone = S.batch(), rib = S.ribbons(), fat = o.fat ?? 1, dep = o.depth ?? 0;
  const prof = (t) => s * 0.16 * fat * Math.pow(Math.sin(Math.PI * (0.05 + 0.9 * t)), 0.55) * (0.75 + 0.5 * Math.sin(Math.PI * t * 0.7));
  const P = (z, y = 0, x = 0) => V(x * s, (0.17 * fat + y) * s, (z - 0.5) * s);
  const bp = [], br = []; for (let k = 0; k <= 9; k++) { const t = k / 9; bp.push(P(t)); br.push(prof(t)); }
  skin.tube(bp, br, 8, { depth: dep, sway: 0.4, up: V(0, 1, 0) });
  bone.tube([P(0.78, 0.01), P(0.88, 0.02), P(1.0, -0.02)], [0.07 * s, 0.085 * s, 0.03 * s], 6, { depth: dep, gain: 0.3 });
  const sp = [], sr = []; for (let k = 0; k <= 14; k++) { const t = 0.12 + 0.66 * k / 14; sp.push(P(t, 0.06 + 0.04 * Math.sin(Math.PI * t))); sr.push(s * (k % 2 ? 0.022 : 0.012)); }
  bone.tube(sp, sr, 4, { depth: dep });
  for (let k = 0; k < 7; k++) for (const sd of [-1, 1]) {
    const t = 0.42 + 0.26 * k / 6, r = prof(t) / s * 0.85, pts = [];
    for (let j = 0; j <= 4; j++) { const a = j / 4 * 2.5; pts.push(P(t - 0.02 * j, 0.08 * Math.cos(a) + r * (Math.cos(a) - 1) * 0.6, sd * r * Math.sin(a))); }
    rib.add(pts, 0.012 * s, { depth: dep });
  }
  rib.add([P(0.1, 0.05), P(-0.08, 0.0), P(-0.3, -0.04), P(-0.5, -0.02)], [0.02 * s, 0.014 * s, 0.01 * s, 0.006 * s], { depth: dep });
  const g = new THREE.Group(), legs = [];
  for (const [z, sd, big] of [[0.72, 1, o.hands], [0.72, -1, o.hands], [0.2, 1, 0], [0.2, -1, 0]]) {     // legs swing on their own pivots
    const lr = S.ribbons(), lg = new THREE.Group(), q = P(z, -0.02, sd * 0.09); lg.position.set(q.x, q.y, q.z);
    const out = big ? sd * 0.2 : sd * 0.04;
    lr.add([V(0, 0, 0), V(out * 0.5 * s, -0.08 * s, 0.05 * s), V(out * s, -0.15 * s, -0.02 * s), V(out * 1.2 * s, -0.17 * s, 0.07 * s)], (big ? 0.04 : 0.022) * s, { depth: dep });
    if (big) for (let k = -1; k <= 1; k++) lr.add([V(out * s, -0.15 * s, -0.02 * s), V(out * 1.5 * s, -0.16 * s, (0.06 + k * 0.05) * s)], 0.014 * s, { depth: dep });
    W.add(lr.build(), o.mLine, lg); g.add(lg); legs.push(lg);
  }
  const gs = skin.build(), gb = bone.build(), gr = rib.build();
  W.add(gs, o.mSkin, g); W.add(gb, o.mBone, g); W.add(gr, o.mLine, g);
  const hb = S.batch().ball(V(0, 0, 0), 0.035 * s, { rings: 4, sides: 6, depth: dep }).build(), heart = W.add(hb, o.mHeart, g);
  heart.position.set(0, 0.15 * s * fat, 0.12 * s);
  const ghosts = [1, 2].map(() => { const h = new THREE.Group(); W.add(gs, o.mGhost, h); W.add(gr, o.mGhostLine, h); W.scene.add(h); return h; });
  W.scene.add(g);
  const prev = new THREE.Vector3(), dir = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), m = new THREE.Matrix4(), zero = new THREE.Vector3();
  return {
    g,
    // put it at p heading along d; speed (m/s) drives the gait and how far the ghosts trail
    place(p, d, speed, time, depthAttr) {
      dir.copy(d).normalize(); m.lookAt(dir, zero, up); g.quaternion.setFromRotationMatrix(m); g.position.copy(p);
      const run = Math.min(1, speed / 3), ph = time * (6 + 10 * run);
      g.position.y += 0.02 * s * Math.sin(ph * 2) * run;
      legs.forEach((l, i) => { l.rotation.x = (0.25 + 0.75 * run) * 0.9 * Math.sin(ph + (i === 0 || i === 3 ? 0 : Math.PI)); if (o.hands && i < 2) l.rotation.y = 0.7 * Math.sin(ph + i * Math.PI); });
      const hs = 1 + 0.3 * Math.pow(Math.max(0, Math.sin(time * 9.4)), 4); heart.scale.setScalar(hs);
      ghosts.forEach((h, i) => { h.quaternion.copy(g.quaternion); h.position.copy(g.position).addScaledVector(dir, -(i + 1) * (o.trail ?? 0.022) * speed); h.visible = speed > 0.4; });
      prev.copy(p);
    },
  };
}

function buildRunners(W, route) {
  const { S, rng, H } = W, path = route.path, L = route.L;
  const mats = { mSkin: S.shell({ density: 0.05, breath: 0.006 }), mBone: S.shell({ tint: 'white', density: 0.1 }), mLine: S.line({ tint: 'white', density: 0.5 }),
    mHeart: S.shell({ tint: 'heart', density: 0.5, glow: true }), mGhost: S.shell({ density: 0.02 }), mGhostLine: S.line({ tint: 'white', density: 0.16 }) };
  W.runnerMats = mats;
  // the vole's run in the snow of the right bank, 5 m off: a tunnel as a faint tube, and the vole keeping pace for 3 s
  const tun = S.batch(), vx = (z) => -8.3 + 0.4 * Math.sin(z * 0.21) + 0.25 * Math.sin(z * 0.57), vy = (z) => H(vx(z), z) - 0.5;      // 6 m from the path: 2 m off it was a thick tube across the lens
  const tp = [], tr = []; for (let z = 4; z <= 97; z += 1.5) { tp.push(V(vx(z) - 2.2 * sstep(88, 97, z), vy(z) - 0.5 * sstep(88, 97, z), z)); tr.push(0.24 * (1 - 0.9 * sstep(87, 97, z)) * (0.1 + 0.9 * sstep(4, 10, z))); }
  tun.tube(tp, tr, 7, { depth: 0 });      // it closes to nothing at both ends: no stub is ever cut by the frame
  for (let k = 0; k < 7; k++) {                                          // side runs and a nest of grass
    const z = 10 + k * 12 + rng.range(-3, 3), l = rng.range(2, 5), sd = rng() < 0.5 ? -1 : 1, bp = [];
    for (let j = 0; j <= 5; j++) { const q = j / 5, x = vx(z) - (0.3 + l * q) * (sd > 0 ? 1 : -0.35), zz = z + sd * l * q * 0.6; bp.push(V(x, H(x, zz) - 0.45 - 0.2 * q, zz)); }
    tun.tube(bp, [0.13, 0.13, 0.12, 0.1, 0.07, 0.02], 6, { depth: 0 });
  }
  W.add(tun.build(), S.shell({ density: 0.02 }));
  // (its two ghosts are faint afterimages, not two more animals: a chain of three bright rib baskets read as a worm)
  const vole = critter(W, 1.2, { ...mats, mGhost: S.shell({ density: 0.008 }), mGhostLine: S.line({ tint: 'white', density: 0.045 }), fat: 1.1, trail: 0.085 });
  const LEAD = 3.9, z0 = 0.085 * L + LEAD, z1 = Math.min(90, 0.215 * L + LEAD), p = new THREE.Vector3(), d = new THREE.Vector3();
  let lastZ = z0;
  W.volePos = new THREE.Vector3(vx(z0), vy(z0), z0);
  // the mole, awake, swimming its gallery beside the dive: 5 m to the right of the line, running on ahead of us
  const dd = route.diveDir, side = new THREE.Vector3().crossVectors(dd, new THREE.Vector3(0, 1, 0)).normalize();
  const below = new THREE.Vector3().crossVectors(side, dd).normalize().negate();
  const gal = (s, out = new THREE.Vector3()) => out.copy(route.diveStart).addScaledVector(dd, s).addScaledVector(side, -(4.6 + 1.2 * Math.sin(s * 0.25))).addScaledVector(below, 1.6 + 0.8 * Math.cos(s * 0.31));
  const gb = S.batch(), gp = []; for (let s = 17; s <= 47; s += 1.2) gp.push(gal(s));
  gb.tube(gp, 0.42, 7, { depth: (q) => H(q.x, q.z) - q.y });
  gb.ball(gal(47.5), 0.75, { len: 0.5, rings: 5, sides: 8, depth: OY - gal(47.5).y });       // its larder
  W.add(gb.build(), S.shell({ density: 0.035 }));
  const worms = S.ribbons(), lc = gal(47.5);
  for (let k = 0; k < 14; k++) { const a = rng() * TAU, r = rng.range(0.1, 0.5), wp = []; for (let j = 0; j <= 5; j++) wp.push(V(lc.x + Math.cos(a + j * 0.5) * r, lc.y - 0.3 + 0.08 * j * rng(), lc.z + Math.sin(a + j * 0.5) * r)); worms.add(wp, 0.03, { depth: OY - lc.y }); }
  W.add(worms.build(), S.line({ density: 0.3 }));
  // (far off through the hill the waiting mole and its two ghosts add up to a white smudge: its bones thin out beyond 13 m, and it
  // has no ghosts until it runs)
  const mole = critter(W, 0.9, { ...mats, mBone: S.shell({ tint: 'white', density: 0.1, far: [13, 26, 0.8] }), mLine: S.line({ tint: 'white', density: 0.5, lod: [22, 30, 320] }), fat: 1.3, hands: true, depth: 12 });
  const mp = new THREE.Vector3(), md = new THREE.Vector3(), uD = route.marks.uDive;
  // A runner's speed is its step over the frame's step. On a frame with no step (a pause, the frame of an arrival) it KEEPS the
  // speed it last had: the gait and the ghosts are laid from the speed, so a speed that fell to a fixed figure at dt 0 made the
  // legs jump to another gait and the ghosts jump up to the body on the first paused frame. Until a first step is taken the fixed
  // figures stand, as before (vSp under 0: none taken yet).
  let lastS = 20, vSp = -1, mSp = 0;
  W.updaters.push((dt, time, camera, u) => {
    const cz = u * L, z = Math.max(z0, Math.min(z1, cz + LEAD + 0.5 * Math.sin(u * 60)));
    const sp = dt > 1e-4 ? (vSp = Math.min(12, Math.abs(z - lastZ) / dt)) : vSp < 0 ? (u > 0.085 && u < 0.2 ? 8 : 0) : vSp; lastZ = z;
    p.set(vx(z), vy(z) - 0.16, z); d.set(vx(z + 0.5) - vx(z), vy(z + 0.5) - vy(z), 0.5);
    vole.place(p, d, sp, time); W.volePos.copy(p);
    const s = Math.max(20, Math.min(46, (u - uD) * L + 7));           // it keeps 7 m ahead of us down its gallery, to the larder
    const ms = dt > 1e-4 ? (mSp = Math.min(12, Math.abs(s - lastS) / dt)) : mSp; lastS = s;
    gal(s, mp); gal(s + 0.5, md).sub(mp);
    mole.place(mp, md, u < uD - 0.005 ? 0.39 : Math.max(ms, 0.8), time);
  });
}

// ---- the owl: our guide. Skull with the two bone rings of its eyes, keel, wing bones, feather shafts, a quick heart ---
function buildOwl(W, route) {
  const { S } = W, k = 2.3, path = route.path, L = route.L, M = W.runnerMats, r = W.cr;       // k: metres of wingspan
  // The owl is a radiograph like everything else: a hollow contour furred with feather hairs, the skeleton inside it, a warm
  // quick heart, and wings that are fans of separate quills (dim and blue, film showing between them), never a filled shape.
  const mSkin = S.shell({ density: 0.028 }), mBone = S.shell({ tint: 'white', density: 0.3 }), mLine = S.line({ tint: 'white', density: 0.5 });
  const mQuill = S.line({ density: 1.7 }), mHair = S.line({ density: 0.12 });
  const g = new THREE.Group(), P = (x, y, z) => V(x * k, y * k, z * k);
  const skin = S.batch(), bone = S.batch(), rib = S.ribbons(), hair = S.ribbons();
  skin.ball(P(0, 0, -0.03), 0.095 * k, { len: 0.19 * k, axis: V(0, 0.12, 1), rings: 7, sides: 9, depth: 0 });
  skin.ball(P(0, 0.035, 0.14), 0.085 * k, { len: 0.08 * k, axis: V(0, 0, 1), rings: 6, sides: 9, depth: 0 });
  bone.ball(P(0, 0.04, 0.14), 0.052 * k, { len: 0.058 * k, axis: V(0, 0, 1), rings: 5, sides: 8, depth: 0 });
  bone.tube([P(0, 0.02, 0.19), P(0, 0.005, 0.215), P(0, -0.015, 0.222)], [0.014 * k, 0.01 * k, 0.003 * k], 4, { depth: 0 });       // beak
  for (const sd of [-1, 1]) {
    const ring = []; for (let i = 0; i <= 12; i++) { const a = i / 12 * TAU; ring.push(P(sd * 0.036 + 0.028 * Math.cos(a), 0.05 + 0.028 * Math.sin(a), 0.19)); }
    bone.tube(ring, 0.006 * k, 5, { depth: 0, gain: 1.4 });           // the bone ring of the eye, dark inside
    for (let i = 0; i < 11; i++) { const a = i / 11 * TAU + 0.2; hair.add([P(sd * 0.036 + 0.036 * Math.cos(a), 0.05 + 0.036 * Math.sin(a), 0.2), P(sd * 0.036 + 0.075 * Math.cos(a), 0.05 + 0.075 * Math.sin(a), 0.175)], 0.004 * k, { depth: 0 }); }   // the facial disc
  }
  bone.tube([P(0, -0.035, 0.09), P(0, -0.085, 0.03), P(0, -0.07, -0.07), P(0, -0.035, -0.1)], [0.012 * k, 0.03 * k, 0.026 * k, 0.008 * k], 6, { depth: 0, flat: 0.16, up: V(1, 0, 0) });   // keel
  const sp = [], sr = []; for (let i = 0; i <= 12; i++) { const t = i / 12; sp.push(P(0, 0.04 - 0.03 * t, 0.09 - 0.3 * t)); sr.push(k * (i % 2 ? 0.013 : 0.007)); }
  bone.tube(sp, sr, 4, { depth: 0 });
  for (let i = 0; i < 5; i++) for (const sd of [-1, 1]) rib.add([P(0, 0.03, 0.05 - i * 0.03), P(sd * 0.06, 0.0, 0.04 - i * 0.03), P(sd * 0.05, -0.05, 0.03 - i * 0.03)], 0.006 * k, { depth: 0 });
  for (const sd of [-1, 1]) rib.add([P(sd * 0.035, -0.04, -0.06), P(sd * 0.04, -0.09, -0.1), P(sd * 0.04, -0.08, -0.17)], 0.009 * k, { depth: 0 });        // legs tucked back
  for (let i = -2; i <= 2; i++) hair.add([P(i * 0.008, 0.01, -0.2), P(i * 0.03, 0.004, -0.29), P(i * 0.05, 0.0, -0.37 - 0.012 * (2 - Math.abs(i)))], 0.005 * k, { depth: 0 });        // five tail quills
  for (let i = 0; i < 54; i++) {                                         // feather hairs lying back along the body: the hollow shell
    const z = r.range(-0.2, 0.12), a = r() * TAU, f = (z + 0.22) / 0.4, rad = 0.095 * Math.sin(Math.PI * Math.min(1, Math.max(0.12, f * 0.9 + 0.08))), l = r.range(0.035, 0.06);
    hair.add([P(Math.cos(a) * rad, Math.sin(a) * rad * 0.9 + 0.005, z), P(Math.cos(a) * (rad + 0.012), Math.sin(a) * (rad + 0.012) * 0.9 + 0.005, z - l * 0.6), P(Math.cos(a) * (rad + 0.02), Math.sin(a) * (rad + 0.02) * 0.9, z - l)], 0.0035 * k, { depth: 0 });
  }
  W.add(skin.build(), mSkin, g); W.add(bone.build(), mBone, g); W.add(rib.build(), mLine, g); W.add(hair.build(), mHair, g);
  const heart = W.add(S.batch().ball(V(0, 0, 0), 0.026 * k, { rings: 4, sides: 6, depth: 0 }).build(), M.mHeart, g); heart.position.set(0, -0.02 * k, 0.03 * k);
  // wings: shoulder -> wrist (humerus, radius and ulna, five secondaries) and wrist -> tip (the hand and six primaries)
  const wings = [];
  for (const sd of [-1, 1]) {
    const inner = new THREE.Group(), outer = new THREE.Group(), ghost = new THREE.Group();
    inner.position.set(sd * 0.05 * k, 0.03 * k, 0.04 * k); outer.position.set(sd * 0.21 * k, 0, 0.01 * k); ghost.position.copy(outer.position);
    const ib = S.batch(), ir = S.ribbons(), ob = S.batch(), or = S.ribbons();
    ib.tube([P(0, 0, 0), P(sd * 0.09, 0, -0.035)], [0.011 * k, 0.008 * k], 4, { depth: 0 });
    ib.tube([P(sd * 0.09, 0, -0.035), P(sd * 0.21, 0, 0.012)], 0.006 * k, 4, { depth: 0 }); ib.tube([P(sd * 0.09, 0, -0.035), P(sd * 0.21, 0, -0.008)], 0.007 * k, 4, { depth: 0 });
    for (let i = 0; i < 5; i++) { const t = i / 4, x = sd * (0.035 + 0.17 * t); ir.add([P(x, 0, -0.02), P(x + sd * 0.012, -0.004, -0.12), P(x + sd * 0.035 * t, -0.012, -0.22 - 0.03 * t)], [0.006 * k, 0.005 * k, 0.002 * k], { depth: 0 }); }
    ob.tube([P(0, 0, 0), P(sd * 0.08, 0, -0.012), P(sd * 0.13, 0, -0.03)], [0.007 * k, 0.006 * k, 0.003 * k], 4, { depth: 0 });
    for (let i = 0; i < 6; i++) { const t = i / 5, a = -1.5 + 1.75 * t, l = 0.23 + 0.11 * Math.sin(Math.PI * t * 0.8), x0 = sd * 0.13 * t; or.add([P(x0, 0, -0.012 * t * 2), P(x0 + sd * Math.cos(a) * l * 0.5, -0.004, Math.sin(a) * l * 0.5), P(x0 + sd * Math.cos(a) * l, -0.014, Math.sin(a) * l * 1.02)], [0.006 * k, 0.005 * k, 0.002 * k], { depth: 0 }); }
    const og = or.build();
    W.add(ib.build(), mBone, inner); W.add(ir.build(), mQuill, inner); W.add(ob.build(), mBone, outer); W.add(og, mQuill, outer); W.add(og, M.mGhostLine, ghost);
    inner.add(outer); inner.add(ghost); g.add(inner); wings.push({ inner, outer, ghost, sd });
  }
  W.scene.add(g);
  const uO = route.marks.uOrbit, uD = route.marks.uDive, bole = new THREE.Vector3(OX, OY, OZ), cam = new THREE.Vector3(), tmp = new THREE.Vector3(), a = new THREE.Vector3(), b = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0), zero = new THREE.Vector3(), m4 = new THREE.Matrix4(), pos = new THREE.Vector3(), qT = new THREE.Quaternion(), dr = new THREE.Vector3();
  // It leads by 6-12 m, but never holds a place in the frame: it weaves across the path and up and down with u, swings
  // wide out of view through the brook's last bend of birches, goes to the oak for the swing, then leads the stoop and is
  // through the loop before us.
  const where = (u, time, out) => {
    const free = sstep(0.03, 0.1, u), lead = 5 + 2.6 * sstep(0, 0.06, u) + (2.2 * Math.sin(u * 37 + 1) + 1.5 * Math.sin(time * 0.21)) * sstep(0.05, 0.1, u) + 9 * sstep(uD + 0.02, 0.93, u);
    path.posAtDist(Math.min(L, u * L + lead), out); path.tangentAtDist(Math.min(L, u * L + lead), tmp);
    const sx = tmp.z, sz = -tmp.x, sl = Math.hypot(sx, sz) || 1, dv = sstep(uD - 0.03, uD + 0.03, u);
    const wide = 17 * Math.exp(-Math.pow((u - 0.17) / 0.03, 2));
    const side = (1 - dv) * (-2.6 * (1 - sstep(0, 0.06, u)) + (4.2 * Math.sin(u * 29 + 0.4) + 1.1 * Math.sin(time * 0.37 + 1)) * free + wide) + dv * 0.25 * Math.sin(time * 0.9);
    out.x += sx / sl * side; out.z += sz / sl * side;
    out.y += (1 - dv) * (0.5 + (1.5 * Math.sin(u * 21 + 2) + 0.45 * Math.sin(time * 0.29)) * free + 0.6 * (1 - sstep(0, 0.06, u)) + 0.12 * wide);
    const kO = sstep(uO - 0.13, uO - 0.02, u) * (1 - sstep(uD - 0.075, uD - 0.01, u));
    if (kO > 0) {                                                        // against the trunk, then climbing against the crown
      path.pointAt(u, cam); dr.copy(cam).sub(bole); dr.y = 0; const dist = dr.length() || 1; dr.multiplyScalar(1 / dist);
      const rise = sstep(uO + 0.02, uD - 0.05, u), ang = 0.4 * Math.sin(time * 0.33) + 1.1 * (u - uO) * 9 + 0.5, near = Math.max(4, dist - 8.5);
      b.set(bole.x + dr.x * near + -dr.z * 3.4 * Math.sin(ang), OY + 1.8 + 8.5 * rise + 1.2 * Math.sin(u * 60) + 0.5 * Math.sin(time * 0.5), bole.z + dr.z * near + dr.x * 3.4 * Math.sin(ang));
      out.lerp(b, kO);
    }
    const kX = sstep(0.455, 0.5, u) * (1 - sstep(0.555, 0.6, u));
    if (kX > 0) {                                                        // half-way up the climb it crosses the trunk close ahead of us, left to right, both wings open
      path.pointAt(u, cam); dr.copy(bole).sub(cam); dr.y = 0; dr.normalize();
      const sd = -2.0 + 5.8 * sstep(0.46, 0.58, u) + 0.2 * Math.sin(time * 0.7);      // (above the eye line and gliding down: seen from behind and below, both wings are fans)
      b.set(cam.x + dr.x * 5.9 - dr.z * sd, cam.y + 2.9 - 1.0 * sstep(0.47, 0.57, u) + 0.2 * Math.sin(time * 0.9), cam.z + dr.z * 5.9 + dr.x * sd);
      out.lerp(b, kX);
    }
    const kS = sstep(uD - 0.1, uD - 0.06, u) * (1 - sstep(uD - 0.028, uD + 0.012, u));
    if (kS > 0) {                                                        // the end of the swing: large in the upper right of the view down the hill, turning into its stoop
      path.pointAt(u, cam); dr.copy(route.skyLook).sub(cam).normalize(); b.crossVectors(dr, up).normalize();
      b.multiplyScalar(3.6 + 0.3 * Math.sin(time * 0.6)).addScaledVector(dr, 8.2).add(cam); b.y += 3.8 + 0.25 * Math.sin(time * 0.8);
      out.lerp(b, kS);
    }
    return out;
  };
  let flap = 0;
  const b1 = [0, 0, 0], b2 = [0, 0, 0];
  const beat = (t, stoop, o) => { const s = Math.sin(t), c = Math.sin(t - 0.9); o[0] = (0.12 + 0.62 * s) * (1 - stoop) + 0.25 * stoop; o[1] = (0.1 + 0.55 * c - 0.35 * Math.max(0, -Math.cos(t))) * (1 - stoop); o[2] = 0.5 * Math.max(0, -Math.cos(t - 0.4)) * (1 - stoop) + 1.9 * stoop; return o; };
  W.owlPos = new THREE.Vector3(0, 4, 6);
  W.updaters.push((dt, time, camera, u) => {
    where(u, time, pos); where(u + 0.003, time + 0.12, a);
    a.sub(pos); if (a.lengthSq() < 1e-6) a.set(0, 0, 1);
    a.normalize();
    const kX = sstep(0.455, 0.5, u) * (1 - sstep(0.555, 0.6, u)); if (kX > 0) { a.y -= 0.8 * kX; a.normalize(); }
    const kS = sstep(uD - 0.1, uD - 0.06, u) * (1 - sstep(uD - 0.028, uD + 0.012, u));
    if (kS > 0) { tmp.copy(route.skyLook).sub(pos).normalize(); tmp.y *= 0.5; a.lerp(tmp, 0.85 * kS).normalize(); }      // it has turned toward the place we go under: seen from behind, both wings as fans
    m4.lookAt(a, zero, up); qT.setFromRotationMatrix(m4);
    g.quaternion.slerp(qT, 1 - Math.exp(-dt * 17.26)); g.position.copy(pos); W.owlPos.copy(pos);      // by the clock alone (a quarter of the way in a sixtieth of a second, as before at 60 frames a second): a frame drawn at dt 0 turns nothing, and it settles on a heading in the same time on every display
    g.visible = pos.distanceTo(route.loop) > 2.5;                         // through the loop before us
    const stoop = sstep(uD - 0.012, uD + 0.03, u) * (1 - sstep(0.985, 1, u) * 0.5);
    flap = time * TAU * 2;                                               // wing bones fold and open twice a second
    const hs = 1 + 0.35 * Math.pow(Math.max(0, Math.sin(time * 15)), 6); heart.scale.setScalar(hs);
    beat(flap, stoop, b1); beat(flap - 0.55, stoop, b2);
    const r1 = b1[0], r2 = b1[1], fold = b1[2], g2 = b2[1], gf = b2[2];
    mQuill.uniforms.uDens.value = 1.7 * (1 - 0.8 * stoop);               // folded for the stoop the quills lie on each other: thin them, so they never add up to a slab
    for (const w of wings) {
      w.inner.rotation.set(0, w.sd * 0.75 * stoop, w.sd * r1);
      w.outer.rotation.set(0, w.sd * fold, w.sd * r2);
      w.ghost.rotation.set(0, w.sd * gf, w.sd * g2);                      // the wingtip's softness: where it was a moment ago
    }
  });
}

// ---- under the hill: six hundred gold-hearted bulbs, the small sleepers beside the climb, and the rare first flower ---
async function buildHill(W, route) {
  const { S, rng, H, scene } = W, path = route.path, thaw = W.season === 'thaw';
  const n = Math.round(680 * W.detail * W.density), bg = S.bulbGeometry(), inst = new Float32Array(n * 4), rows = [];
  const M = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sc = new THREE.Vector3(), ps = new THREE.Vector3();
  const skin = new THREE.InstancedMesh(bg.skin, S.shell({ density: 0.045, inner: true, lod: [30, 150, 260] }), n);
  const flower = new THREE.InstancedMesh(bg.flower, S.shell({ tint: 'gold', density: 0.2, glow: true, warm: [0, 0.4, 0, 0] }), n);
  let nShell = 0;
  for (let i = 0; i < n; i++) {
    let x, z, y, d, tries = 0;
    do {
      const m = rng();
      if (m < 0.32) { const a = rng() * TAU, r = 3 + 40 * Math.pow(rng(), 0.75); x = OX + Math.cos(a) * r; z = OZ + Math.sin(a) * r; }      // the carpet round the oak
      else if (m < 0.82) { const p = path.pointAt(rng.range(route.marks.uClimb - 0.05, route.marks.uOrbit)); const o = rng.gauss() * 6; x = p.x + o; z = p.z + rng.gauss() * 3; }   // under the climb
      else if (m < 0.86) { const a = rng() * TAU, r = 2.8 + 15 * rng(); x = route.snowIn.x + Math.cos(a) * r; z = route.snowIn.z + Math.sin(a) * r; }   // round where we go under
      else { x = rng.range(-60, 60); z = rng.range(120, 300); }
      d = rng.range(0.35, 1.05) + (W.season === 'autumn' ? 0.25 : 0); y = H(x, z) - d - 0.3;
    } while (path.distanceTo(x, y, z) < 2.6 && ++tries < 10);
    const pd = path.distanceTo(x, y, z), s = rng.range(0.22, 0.34) * (pd < 7 ? 1.75 : pd < 11 ? 1.3 : 1);
    e.set(rng.range(-0.35, 0.35), rng() * TAU, rng.range(-0.35, 0.35)); q.setFromEuler(e);
    const j = pd < 22 ? nShell++ : n - 1;      // (a bulb never within 22 m of the path keeps its gold point but not its shells: at that range the skin is a faint four pixels; this pays for round four's bulbs)
    M.compose(ps.set(x, y, z), q, sc.set(s, s, s)); skin.setMatrixAt(j, M);
    if (thaw) M.compose(ps.set(x, y + s * 0.25, z), q, sc.set(s * 0.8, s * 2.3, s * 0.8));       // the flower already halfway up its shoot
    flower.setMatrixAt(j, M);
    const ph = rng(); inst.set([d + 3.6, ph, 0, 0], j * 4);
    rows.push([x, y + s * (thaw ? 0.9 : 0.42), z, d + 3.6, 0.15, 0.4, rng()]);
    if (i % 2 === 1) await W.tick();
  }
  for (const m of [skin, flower]) { m.geometry.setAttribute('aInst', new THREE.InstancedBufferAttribute(inst, 4)); m.frustumCulled = false; m.count = Math.max(1, nShell); scene.add(m); }
  // the far field: bulbs too distant to show their scales are one gold point each, densest toward the oak (a second night sky)
  for (let i = 0; i < Math.round(1100 * W.detail * W.density); i++) {
    const a = rng() * TAU, r = 5 + 88 * Math.pow(rng(), 1.25), x = OX + Math.cos(a) * r * 1.1, z = OZ + Math.sin(a) * r, d = rng.range(0.35, 1.05);
    if (path.nearestXZ(x, z).dist > 9) rows.push([x, H(x, z) - d - 0.2, z, d + 3.6, rng.range(0.13, 0.2), 0.5, rng()]);
    if (i % 200 === 199) await W.tick();
  }
  W.addPts(S.pointCloud(rows), S.points({ tint: 'gold', density: 1.0, glow: true, min: [2.6, 0.7], warm: [0, -0.25, 0, 0.3] }));
  await W.tick();
  // the hearth: what the hill is holding, seen from the first frame. The bulbs of the face that looks down the brook show through
  // the skin as one warm cluster under the oak (the film has always seen this far into snow), thickest under the trunk
  {
    const r = W.r4, hr = [];
    for (let i = 0; i < Math.round(380 * W.detail); i++) {
      const a = -Math.PI / 2 + r.gauss() * 0.45, rr = 3 + 66 * Math.pow(r(), 1.05), x = OX + Math.cos(a) * rr * 1.15, z = OZ + Math.sin(a) * rr, d = r() < 0.75 ? r.range(0.4, 1.1) : r.range(1.1, 5.5);
      if (path.nearestXZ(x, z).dist > 7.5) hr.push([x, H(x, z) - d, z, 0, r.range(0.24, 0.44), 0.5, r()]);
      if (i % 30 === 29) await W.tick();
    }
    W.hearth = W.addPts(S.pointCloud(hr), S.points({ tint: 'gold', density: 1.0, glow: true, min: [3.7, 0.9], lod: [105, 330, 420], warm: [0, 0, 0, 0.25] }));
  }
  await W.tick();

  // round the dive: pebble sparks and fungal lace strung between the roots, so that the dark has depth to fly through
  {
    const side = new THREE.Vector3().crossVectors(route.diveDir, new THREE.Vector3(0, 1, 0)).normalize(), dn = new THREE.Vector3().crossVectors(side, route.diveDir).normalize();
    const at = (sd, a, r) => new THREE.Vector3().copy(route.diveStart).addScaledVector(route.diveDir, sd).addScaledVector(side, Math.cos(a) * r).addScaledVector(dn, Math.sin(a) * r);
    const peb = [], lace = S.ribbons();
    for (let i = 0; i < Math.round(2600 * W.detail); i++) { if (i % 400 === 399) await W.tick(); const p = at(rng.range(11, 64), rng() * TAU, 3.2 + 16 * Math.pow(rng(), 1.4)), d = H(p.x, p.z) - p.y; if (d > 1.2) peb.push([p.x, p.y, p.z, d, rng.range(0.04, 0.13), 0.6, rng()]); }
    await W.tick();
    W.addPts(S.pointCloud(peb), S.points({ density: 0.5 })); await W.tick();
    for (let i = 0; i < 70; i++) {
      if (i % 6 === 5) await W.tick();
      const s0 = rng.range(12, 56), a0 = rng() * TAU, a1 = a0 + rng.range(0.5, 1.6) * (rng() < 0.5 ? -1 : 1), r0 = rng.range(4.2, 9), r1 = rng.range(4.2, 11), len = rng.range(4, 12), ph = rng(), pts = [];
      // a thread is a vein: one long gentle curve (no straight run, no corner), with a finer fork leaving it part-way
      const N = 20, w1 = W.or.range(0.12, 0.3), w2 = W.or.range(0.05, 0.12), f1 = W.or.range(2.5, 5), dep = (p) => Math.max(1.5, H(p.x, p.z) - p.y);
      const pt = (q) => { const p = at(s0 + len * q, a0 + (a1 - a0) * q, r0 + (r1 - r0) * q + w1 * Math.sin(q * f1 + ph * 20) + w2 * Math.sin(q * 11 + ph * 7)); return V(p.x, p.y - 0.8 * Math.sin(Math.PI * q), p.z); };
      for (let k = 0; k <= N; k++) pts.push(pt(k / N));
      lace.add(pts, pts.map((_, k) => 0.016 * (1 - 0.5 * k / N)), { depth: dep, phase: ph, sway: 0.3, alongK: 2.4 });
      const q0 = W.or.range(0.25, 0.6), o = pt(q0), o2 = pt(q0 + 0.04), fl = len * W.or.range(0.25, 0.45), bend = W.or.range(-0.5, 0.5), sgn = W.or() < 0.5 ? -1 : 1, fp = [];
      let dx = o2.x - o.x, dy = o2.y - o.y, dz = o2.z - o.z; const dl = Math.hypot(dx, dy, dz) || 1; dx /= dl; dy /= dl; dz /= dl;
      // the fork leaves along the thread and bends away from it as it goes
      let nx = dy * 0 - dz * 1, nz = dx * 1 - dy * 0; const nl = Math.hypot(nx, nz) || 1; nx = nx / nl * sgn; nz = nz / nl * sgn;
      for (let k = 0; k <= 8; k++) { const t = k / 8, side = fl * (0.55 * t * t + 0.1 * bend * Math.sin(t * 3)); fp.push(V(o.x + dx * fl * t * 0.8 + nx * side, o.y + dy * fl * t * 0.8 - 0.25 * fl * t * t, o.z + dz * fl * t * 0.8 + nz * side)); }
      lace.add(fp, fp.map((_, k) => 0.011 * (1 - 0.6 * k / 8)), { depth: dep, phase: ph + 0.3, sway: 0.3, alongK: 2.4 });
    }
    W.add(lace.build(), S.line({ density: 0.12, beads: 0.9, sway: 0.05, warm: [0.7, 0.8, 1, 0], near: [1.5, 4.5, 1.5] })); await W.tick();      // fainter than the sap in the roots; never a bar across the lens
    // deep roots crossing the lower half of the dive like rafters, hung with hair roots that sway as we pass
    const raft = S.batch(), hair = S.ribbons(), dep = (p) => Math.max(1.5, H(p.x, p.z) - p.y);
    for (let i = 0; i < 11; i++) {
      const s0 = 24 + i * 3 + rng.range(-1, 1), a0 = rng() * TAU, span = rng.range(1.5, 2.5) * (i % 2 ? -1 : 1), near = rng.range(4.3, 6.4), r0 = rng.range(0.13, 0.3), ph = rng(), pts = [], rr = [];
      for (let k = 0; k <= 12; k++) { const q = k / 12, e = 2 * q - 1, p = at(s0 + 5 * q, a0 + span * q, near + 9 * e * e + 0.5 * Math.sin(q * 7 + ph * 9)); pts.push(V(p.x, p.y, p.z)); rr.push(r0 * (1 - 0.5 * q)); }
      raft.tube(pts, rr, 6, { depth: dep, sway: 0.15, phase: ph, gain: 0.6 });
      for (let k = 2; k < 11; k++) {
        const c = pts[k], l = rng.range(0.7, 2.2), dx = rng.gauss() * 0.3, dz = rng.gauss() * 0.3, hp = [], hs = [];
        for (let j = 0; j <= 4; j++) { const q = j / 4; hp.push(V(c.x + dx * l * q, c.y - l * q * (0.6 + 0.4 * q), c.z + dz * l * q)); hs.push(q); }
        hair.add(hp, [0.05, 0.04, 0.03, 0.02, 0.01], { depth: dep, sway: hs, phase: rng() });
      }
    }
    W.add(raft.build(), S.shell({ density: 0.065, sway: 0.08, flow: 0.3 })); W.add(hair.build(), S.line({ density: 0.21, sway: 0.09, flow: 0.35 }));
  }

  // small sleepers beside the climb, half a metre under the snow: hedgehog, grass snake, queen bumblebee
  const body = S.batch(), bone = S.batch(), rib = S.ribbons(), hearts = [];
  const beside = (u, off) => { const p = path.pointAt(u), t = path.tangentAt(u), x = p.x + t.z * off, z = p.z - t.x * off; return V(x, H(x, z), z); };
  {
    const e43 = path.pointAt(0.43), hx = e43.x - 3.6, hz = e43.z + 6.5, c = V(hx, H(hx, hz), hz), d = 0.7, y = c.y - d - 0.75, r = 1.0;          // the hedgehog under leaf litter: 8-9 m ahead of the lens at u 0.43, low on the right
    body.ball(V(c.x, y, c.z), r, { len: r * 0.85, rings: 6, sides: 10, depth: d, sway: 1 });
    const sp = [], sr = []; for (let k = 0; k <= 14; k++) { const a = -0.6 + 4.6 * k / 14; sp.push(V(c.x + Math.cos(a) * r * 0.62, y + 0.04, c.z + Math.sin(a) * r * 0.62)); sr.push(k % 2 ? 0.03 : 0.017); }
    bone.tube(sp, sr, 4, { depth: d }); bone.ball(sp[14], 0.1, { len: 0.15, axis: V(-Math.sin(4), 0, Math.cos(4)), rings: 4, sides: 6, depth: d });
    for (let k = 0; k < 90; k++) { const a = rng() * TAU, el = rng.range(0.1, 1.5), dx = Math.cos(a) * Math.cos(el), dy = Math.sin(el), dz = Math.sin(a) * Math.cos(el); rib.add([V(c.x + dx * r * 0.9, y + dy * r * 0.8, c.z + dz * r * 0.9), V(c.x + dx * r * 1.35, y + dy * r * 1.25, c.z + dz * r * 1.35)], 0.012, { depth: d }); }
    for (let k = 0; k < 30; k++) { const a = rng() * TAU, rr = rng.range(0.2, 1.1), b = rng() * TAU, l = rng.range(0.15, 0.3); rib.add([V(c.x + Math.cos(a) * rr - Math.cos(b) * l, y + r * 0.9 + 0.12 * rng(), c.z + Math.sin(a) * rr - Math.sin(b) * l), V(c.x + Math.cos(a) * rr + Math.cos(b) * l, y + r * 0.9 + 0.12 * rng(), c.z + Math.sin(a) * rr + Math.sin(b) * l)], 0.05, { depth: d * 0.5 }); }
    hearts.push({ p: V(c.x + 0.05, y, c.z), r: 0.075, depth: d, phase: rng() });
  }
  {
    const e52 = path.pointAt(0.52), sx = e52.x + 3.5, sz = e52.z + 6.0, c = V(sx, H(sx, sz), sz), d = 1.0, y = c.y - d - 0.5, pts = [], rr = [], K = 2.0;      // 7 m from the lens at u 0.52, lower left   // the grass snake in a loose knot
    for (let k = 0; k <= 70; k++) { const t = k / 70, a = t * 11; pts.push(V(c.x + K * (0.5 + 0.16 * Math.sin(a * 0.37)) * Math.cos(a) * (1 - 0.3 * t), y + K * (0.1 * Math.sin(a * 1.5) + 0.12 * t), c.z + K * 0.42 * Math.sin(a * 1.0 + 0.6 * Math.sin(a * 0.5)) * (1 - 0.3 * t))); rr.push(K * 0.066 * Math.pow(Math.sin(Math.PI * (0.03 + 0.94 * t)), 0.4)); }
    body.tube(pts, rr, 6, { depth: d, sway: 0.5 }); rib.add(pts, 0.05, { depth: d });
    for (let k = 3; k < 68; k += 1) { const p = pts[k], n2 = pts[k + 1], tx = n2.x - p.x, tz = n2.z - p.z, l = Math.hypot(tx, tz) || 1, w = rr[k] * 0.9; rib.add([V(p.x - tz / l * w, p.y - w * 0.5, p.z + tx / l * w), V(p.x, p.y + w * 0.4, p.z), V(p.x + tz / l * w, p.y - w * 0.5, p.z - tx / l * w)], 0.022, { depth: d }); }
    bone.ball(pts[70], 0.085, { len: 0.15, axis: V(1, 0, 0), rings: 4, sides: 6, depth: d });
    hearts.push({ p: pts[52], r: 0.055, depth: d, phase: rng() });
  }
  {
    const c = beside(0.56, -4.4), d = 0.6, y = c.y - d - 0.3;                      // the queen bumblebee alone in her cell
    const B = 1.7, b = (x, yy, z) => V(c.x + x * B, y + yy * B, c.z + z * B);
    body.ball(b(0, 0, 0), 0.3 * B, { len: 0.22 * B, rings: 5, sides: 9, depth: d });
    body.ball(b(0, -0.03, 0), 0.09 * B, { len: 0.13 * B, axis: V(1, 0, 0.3), rings: 5, sides: 7, depth: d, sway: 1 });
    body.ball(b(0.15, -0.02, 0.045), 0.06 * B, { len: 0.06 * B, rings: 4, sides: 6, depth: d });
    for (const sd of [-1, 1]) {
      // a folded wing is a flat clear shell with two veins, bright only at its rim (it used to be a broad white ribbon: from the
      // swing it was a solid white tile on the snow)
      const wl = Math.hypot(0.28, 0.07), wa = V(-0.28 / wl, 0, sd * 0.07 / wl);
      body.ball(b(-0.06, 0.06, sd * 0.1), 0.05 * B, { len: 0.15 * B, axis: wa, up: V(wa.z, 0, -wa.x), flat: 0.1, rings: 5, sides: 6, depth: d });
      rib.add([b(0.08, 0.04, sd * 0.04), b(-0.06, 0.065, sd * 0.11), b(-0.2, 0.05, sd * 0.12)], 0.006 * B, { depth: d }); rib.add([b(0.06, 0.04, sd * 0.05), b(-0.08, 0.06, sd * 0.075), b(-0.18, 0.05, sd * 0.085)], 0.005 * B, { depth: d });
      for (let k = 0; k < 3; k++) rib.add([b(0.1 - k * 0.05, -0.06, sd * 0.05), b(0.12 - k * 0.06, -0.15, sd * 0.12)], 0.012 * B, { depth: d }); }
    hearts.push({ p: b(0, -0.02, 0), r: 0.05, depth: d, phase: rng() });
  }
  W.add(body.build(), S.shell({ density: 0.09, breath: 0.012 }));
  W.add(bone.build(), S.shell({ tint: 'white', density: 0.2 }));
  W.add(rib.build(), S.line({ tint: 'white', density: 0.6 }));
  for (const h of hearts) W.heartRows.push([h.p.x, h.p.y, h.p.z, h.depth, h.r * 3, 0, h.phase]);      // (drawn with the bank sleepers' hearts in buildClimb)
  await W.tick();

  // RARE: the first one up. A bulb beside the dive lets go its flower: it climbs its shoot, breaks the snow line and opens.
  if (W.rare) {
    const side = new THREE.Vector3().crossVectors(route.diveDir, new THREE.Vector3(0, 1, 0)).normalize();
    const pb = S.batch(); pb.tube([V(0, 0, 0), V(0, 0.2, 0.05), V(0, 0.42, 0.13), V(0, 0.56, 0.2)], [0.03, 0.1, 0.085, 0.012], 6, { depth: 0, flat: 0.3, up: V(0, 0, 1) });
    const pg = pb.build(), NP = 6, list = [[3.4, 0.6, 1.5, 0], [4.8, -1.9, 0.8, 0.35], [-3.0, 3.3, 0.7, 0.5], [6.0, 2.2, 0.65, 0.62], [-3.6, -3.2, 0.6, 0.7]];
    const petals = new THREE.InstancedMesh(pg, S.shell({ tint: 'gold', density: 0.26, glow: true }), NP * list.length);
    pg.setAttribute('aInst', new THREE.InstancedBufferAttribute(new Float32Array(NP * list.length * 4), 4)); petals.frustumCulled = false; scene.add(petals);
    const shoots = list.map(([sd, al, size]) => {
      const x = route.snowIn.x + side.x * sd + route.diveDir.x * al, z = route.snowIn.z + side.z * sd + route.diveDir.z * al, y = H(x, z);
      const r = S.ribbons(); r.add([V(0, 0, 0), V(0.02, 0.35, 0), V(-0.02, 0.7, 0.02), V(0, 1, 0)], 0.06 * size, { depth: 0 });
      const m = W.add(r.build(), S.line({ density: 0.4 })); m.position.set(x, y - 0.9, z);
      return { m, x, y, z };
    });
    const uA = route.marks.uOrbit + 0.06, uB = route.marks.uSnow + 0.01, eu = new THREE.Euler(0, 0, 0, 'YXZ');
    W.updaters.push((dt, time, camera, u) => {
      for (let i = 0; i < list.length; i++) {
        const size = list[i][2], lag = list[i][3], s = shoots[i], k = sstep(uA + lag * 0.1, uB - 0.05 + lag * 0.06, u) * (i === 0 ? 1 : 0.62), open = i === 0 ? sstep(uB - 0.1, uB, u) : 0;
        const h = 0.15 + (0.9 + 1.35 * size) * k;                          // the flower rides the tip of its shoot
        s.m.scale.set(1, h, 1);
        for (let j = 0; j < NP; j++) {
          eu.set(0.12 + 1.1 * open + 0.05 * Math.sin(time * 1.3 + j), j / NP * TAU + 0.4 * i, 0); q.setFromEuler(eu);
          M.compose(ps.set(s.x, s.y - 0.9 + h, s.z), q, sc.setScalar(size * (0.55 + 0.75 * k)));
          petals.setMatrixAt(i * NP + j, M);
        }
      }
      petals.instanceMatrix.needsUpdate = true;
    });
  }
}

// ---- seasons: autumn's skin of fallen leaves and dropping acorns; the thaw's water running under the broken ice ------
async function buildSeason(W, route) {
  const { S, rng, H, scene } = W, path = route.path;
  if (W.season === 'autumn') {
    const P = [0, 0.05, 0], N = [0, 1, 0], D = [0, 0, 0, 0], G = [0], I = [];
    for (let k = 0; k < 6; k++) { const a = k / 6 * TAU, r = k % 2 ? 0.7 : 1; P.push(Math.cos(a) * r, 0, Math.sin(a) * r * 0.7); N.push(Math.cos(a) * 0.35, 0.94, Math.sin(a) * 0.35); D.push(0, 0, 1, 0); G.push(0); I.push(0, 1 + k, 1 + (k + 1) % 6); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
    g.setAttribute('aData', new THREE.Float32BufferAttribute(D, 4)); g.setAttribute('aGain', new THREE.Float32BufferAttribute(G, 1)); g.setIndex(I);
    const n = Math.round(2600 * W.detail), inst = new Float32Array(n * 4), M = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), ps = new THREE.Vector3(), sc = new THREE.Vector3();
    const leaves = new THREE.InstancedMesh(g, S.shell({ density: 0.05, edge: 0.05, sharp: true, sway: 0.01 }), n);
    for (let i = 0; i < n; i++) {
      const p = path.pointAt(rng.range(0.0, route.marks.uDive)), o = rng.gauss() * 9, x = p.x + o + (Math.abs(p.x + o) < 3.4 && p.z < 90 ? 7 * Math.sign(o || 1) : 0), z = p.z + rng.gauss() * 4, s = rng.range(0.14, 0.3);
      e.set(rng.range(-0.5, 0.5), rng() * TAU, rng.range(-0.5, 0.5)); q.setFromEuler(e);
      M.compose(ps.set(x, H(x, z) + 0.03 + 0.05 * rng(), z), q, sc.set(s, s, s)); leaves.setMatrixAt(i, M); inst[i * 4 + 1] = rng();
      if (i % 150 === 149) await W.tick();
    }
    g.setAttribute('aInst', new THREE.InstancedBufferAttribute(inst, 4)); leaves.frustumCulled = false; scene.add(leaves);
    // gold acorns letting go of the crown and dropping through the air
    const ab = S.batch(); ab.ball(V(0, 0, 0), 0.5, { len: 0.8, rings: 4, sides: 6, depth: 0 }); ab.ball(V(0, 0.52, 0), 0.56, { len: 0.34, rings: 3, sides: 6, depth: 0 });
    const ag = ab.build(), NA = 16, drops = [];
    ag.setAttribute('aInst', new THREE.InstancedBufferAttribute(new Float32Array(NA * 4), 4));
    const acorns = new THREE.InstancedMesh(ag, S.shell({ tint: 'gold', density: 0.22, glow: true }), NA); acorns.frustumCulled = false; scene.add(acorns);
    for (let i = 0; i < NA; i++) { const a = rng() * TAU, r = rng.range(3, 12.5); drops.push({ x: OX + Math.cos(a) * r, z: OZ + Math.sin(a) * r, top: OY + rng.range(9, 21), ph: rng(), per: rng.range(3.2, 5.5), sp: rng.range(1, 3) }); }
    W.updaters.push((dt, time) => {
      for (let i = 0; i < NA; i++) {
        const d = drops[i], t = ((time / d.per + d.ph) % 1) * d.per, fall = Math.min(d.top - OY, 0.5 * 5.5 * t * t);     // a slowed fall, so each is seen
        e.set(t * d.sp, d.ph * 6, t * d.sp * 0.7); q.setFromEuler(e);
        M.compose(ps.set(d.x, d.top - fall, d.z), q, sc.setScalar(0.17)); acorns.setMatrixAt(i, M);
      }
      acorns.instanceMatrix.needsUpdate = true;
    });
  }
  if (W.season === 'thaw') {
    const r = S.ribbons();
    for (let i = 0; i < 34; i++) {
      const ph = rng(), len = rng.range(7, 16), amp = rng.range(0.35, 0.8), wl = rng.range(0.5, 0.95), yy = -0.3 - 0.3 * rng(), pts = [];
      let x = rng.range(-2.3, 2.3), z = rng.range(-10, 92);
      for (let k = 0; k <= len / 0.8; k++) { pts.push(V(Math.max(-3, Math.min(3, x + amp * Math.sin(k * 0.8 * wl + ph * 9) + 0.25 * Math.sin(k * 0.8 * 2.3 * wl + i))), yy + 0.05 * Math.sin(k * 0.3 + i), z - k * 0.8)); }
      r.add(pts, pts.map((_, k) => 0.008 + 0.03 * Math.sin(Math.PI * k / (pts.length - 1))), { depth: 0, phase: ph, sway: 0.4 });
    }
    W.add(r.build(), S.line({ density: 0.05, beads: 0.9, sway: 0.06 }));
  }
}

// ---- the near layer of the first third: matter close to the lens. Bank birches as nested tubes 4-7 m off (outer wall,
// inner walls, heartwood, creeping sap beads, a plate of real root tubes), the brook as layered sheets with its stones,
// and small sleepers under the path. Everything here draws from W.vr, so no other builder's rng sequence moves.
async function buildNear(W, route) {
  const { S, H } = W, wall = S.batch(), core = S.batch(), sapc = S.batch(), fine = S.ribbons(), vein = S.ribbons();
  let r = W.vr;
  const trunk = (x, z, r0, h, o = {}) => {
    const y0 = H(x, z), ph = r(), n = 6, lx = o.lx ?? r.range(-0.7, 0.7), lz = o.lz ?? r.range(-0.6, 0.6), wob = o.wob ?? 0.14;
    const at = (f) => V(x + lx * f * f + wob * Math.sin(f * 4 + ph * 9) * f, y0 - 0.9 + (h + 0.9) * f, z + lz * f * f + wob * Math.cos(f * 3 + ph * 7) * f);
    const pts = [], rr = [], sw = [];
    for (let k = 0; k <= n; k++) { const f = Math.pow(k / n, 1.6); pts.push(at(f)); rr.push((r0 * (1 - 0.72 * f) + 0.02) * (1 + 0.45 * Math.max(0, 1 - f * 14))); sw.push(f * f * 0.3); }
    rr[0] *= 0.3;                                                         // the foot closes to a tap root under the snow
    wall.tube(pts, rr, 10, { depth: 0, sway: sw, phase: ph, gain: 0.25 });
    let q = 0;
    // (round near sap: a trunk that carries the sap vein has its three cores in the sap's own batch; a plain trunk keeps cold cores)
    for (const [k, sides] of [[0.8, 8], [0.57, 7], [0.31, 5]]) (o.plain ? core : sapc).tube(pts, rr.map((v) => v * k), sides, { depth: 0, sway: sw, phase: ph + 0.37 * q, along: 1.7 * q++, alongK: 2.6 });
    if (!o.plain) { const vp = [], vw = []; for (let k = 0; k <= 5; k++) { const f = 0.34 * k / 5; vp.push(at(f)); vw.push(r0 * 0.34 * (1 - 0.9 * k / 5) * (k ? 1 : 0.5)); } vein.add(vp, vw, { depth: 0, phase: ph, alongK: 2.2 }); }      // ...and rising a few metres up the bole
    // boughs: two low stubs that cross the frame, then ascending branches with hanging twig fans
    const nb = o.plain ? 0 : 5;
    for (let b = 0; b < nb; b++) {
      const f0 = b < 2 ? r.range(0.16, 0.3) : 0.3 + 0.5 * (b - 2 + r()) / 3, c = at(f0), a = r() * TAU, L = (b < 2 ? r.range(1.2, 2.2) : h * r.range(0.16, 0.26)), bp = [], br = [], bs = [];
      for (let k = 0; k <= 3; k++) { const t = k / 3; bp.push(V(c.x + Math.cos(a) * L * t * 0.8, c.y + L * (0.75 * t - 0.3 * t * t), c.z + Math.sin(a) * L * t * 0.8)); br.push(r0 * 0.3 * (1 - f0) * (1 - 0.7 * t) + 0.014); bs.push(f0 * f0 * 0.3 + t * 0.3); }
      wall.tube(bp, br, 4, { depth: 0, sway: bs, phase: ph });
      for (let k = 0; k < 2; k++) {
        const s = bp[2 + k], a2 = a + r.gauss() * 0.9, l2 = r.range(1.0, 2.4), tp = [], ts = [];
        for (let j = 0; j <= 4; j++) { const t = j / 4; tp.push(V(s.x + Math.cos(a2) * l2 * 0.5 * t, s.y + l2 * (0.3 * t - 1.0 * t * t), s.z + Math.sin(a2) * l2 * 0.5 * t)); ts.push(0.5 + t * 1.6); }
        fine.add(tp, 0.024, { depth: 0, sway: ts, phase: ph + k * 0.13 });
      }
    }
    // the plate of roots as real tubes, 0.2-1.2 m under the snow line, each with a few hair roots
    for (let k = 0; k < (o.plain ? 0 : 5); k++) {
      const a = k * 1.257 + r.range(-0.3, 0.3), L = r.range(2.6, 4.4), bend = r.range(-0.5, 0.5), rp = [], rw = [], rs = [];
      for (let j = 0; j <= 4; j++) { const t = j / 4, aa = a + bend * t * t, px = x + Math.cos(aa) * L * t, pz = z + Math.sin(aa) * L * t; rp.push(V(px, H(px, pz) - 0.2 - 0.95 * Math.sqrt(t) + 0.08 * Math.sin(t * 9 + k), pz)); rw.push(r0 * 0.4 * (1 - 0.86 * t) + 0.018); rs.push(t * 0.3); }
      wall.tube(rp, rw, 4, { depth: (p) => Math.max(0.2, H(p.x, p.z) - p.y), sway: rs, phase: ph });
      vein.add(rp, rw.map((w, j) => w * (j ? 0.62 : 0.45)), { depth: 0.2, sway: rs, phase: ph + 0.21 * k, alongK: 2.2 });      // warm sap in the root: gold from the first frame
      for (let j = 1; j <= 3; j += 2) { const c = rp[j], l = r.range(0.3, 0.7), dx = r.gauss() * 0.2, dz = r.gauss() * 0.2; fine.add([c, V(c.x + dx * 0.5, c.y - l * 0.5, c.z + dz * 0.5), V(c.x + dx, c.y - l, c.z + dz)], [0.03, 0.02, 0.008], { depth: (p) => Math.max(0.2, H(p.x, p.z) - p.y), sway: [0, 0.4, 1], phase: r() }); }
    }
  };
  // the near layer's hand-set places (unchanged since they were set): the nearest stands 4.9 to 10.8 m from the lens at the first third's
  // moments (camera z about 7, 28, 56, 88, 120), with ones between
  const spots = [[4.4, 5.2, 0.4], [-5.0, 7.8, 0.42], [4.5, 12.5, 0.4], [-10.5, 24.5, 0.43], [5.6, 20.5, 0.36], [8.2, 30.5, 0.38], [-7.4, 45.5, 0.44], [6.4, 43.5, 0.36], [-6.6, 51.5, 0.38],
    [4.9, 62.6, 0.42, -7.5, 1.5], [-7.6, 67.5, 0.44], [5.6, 70.5, 0.36], [3.4, 77.6, 0.4], [-11.5, 78, 0.38], [3.2, 86, 0.36], [3.6, 97.5, 0.4], [-12.5, 99, 0.42], [8.5, 105, 0.36],
    [-10.5, 126.5, 0.4], [7.6, 138.5, 0.42], [-5.6, 136.5, 0.36]];      // (no pair stands either side of the lens: twin columns read as a window)
  for (let i = 0; i < spots.length; i++) { const [x, z, r0, lx, lz] = spots[i]; trunk(x, z, r0 * r.range(0.92, 1.08), r.range(12, 15.5), lx !== undefined ? { lx, lz } : {});   /* one leans out over the brook */ await W.tick(); }
  // the pair the deer is seen through gains its nested walls too, so trunk, ribs and lungs add where they cross
  for (const t of W.trees.slice(0, 2)) trunk(t.x, t.z, 0.2, t.h * 0.9, { lx: 0, lz: 0, wob: 0.04, plain: true });
  await W.tick();
  // the wood's last row, in the flanks of the frame at the foot of the climb (their own random stream)
  r = W.cr;
  for (const [x, z, r0] of [[-9.0, 153, 0.4], [9.6, 158, 0.42], [-10.4, 166, 0.38], [10.8, 173, 0.36]]) { trunk(x, z, r0, r.range(13, 16)); await W.tick(); }
  // round five: one birch at the wood's edge leans in over the foot of the climb. At u 0.43 its trunk crosses the top left corner
  // of the frame and its boughs reach out over the path, their hanging twig fans 4-8 m from the lens across the upper third
  r = W.r5;
  {
    const x0 = 9.6, z0 = 160.6, h = 13.2, lx = -14, lz = 1.4, y0 = H(x0, z0), tat = (f) => V(x0 + lx * f * f, y0 - 0.9 + (h + 0.9) * f, z0 + lz * f * f);
    trunk(x0, z0, 0.37, h, { lx, lz, wob: 0, plain: true });
    // ROUND TWIG CLEAR (a cure of a fault in live, the owner's word of 18:31 UTC on 10-09): the eye climbs through the height of these
    // fans, and a hanging twig passed it at half a metre. A LAW OF PLACE AT THE BUILD: a hanging twig of this birch, as its ribbon is built, with
    // the line shader's sway at its furthest reach (0.07 m by the twig's sway weight, three times that near the lens, both axes at
    // once) and half its breadth, keeps 2.0 m from the flown line in space, in the picture or out of it. A twig that would not is built
    // shorter (and sways less, by its length), and is left out when it would be shorter than 0.45 m or no length keeps the law. Nothing here reads the lens, the
    // gaze, the clock or the seed; every draw of r5 is made as before.
    const flown = []; { const P = route.path, q = new THREE.Vector3(); for (let d = 0; d <= P.length; d += 0.25) { P.posAtDist(d, q); if (Math.hypot(q.x - (x0 + lx * 0.5), q.z - z0) < 26) flown.push(q.x, q.y, q.z); } }
    const offLine = (p) => { let b = Infinity; for (let i = 0; i < flown.length; i += 3) { const ex = flown[i] - p.x, ey = flown[i + 1] - p.y, ez = flown[i + 2] - p.z, d = ex * ex + ey * ey + ez * ez; if (d < b) b = d; } return Math.sqrt(b); };
    const TWIG_CLEAR = 2.0 + 0.013 + 0.01, TWIG_REACH = 0.07 * 3 * Math.SQRT2;      // (0.013: half a twig's breadth; 0.01: the line is taken every quarter metre, the ribbon's pieces at eleven points)
    for (const [f0, dz, L] of [[0.36, -0.3, 8.2], [0.45, -0.05, 10.2], [0.54, 0.25, 9.0], [0.4, -0.9, 5.0]]) {
      const o = tat(f0), dl = Math.hypot(1, dz), bp = [], br = [], bs = [], ph = r();
      for (let k = 0; k <= 8; k++) { const t = k / 8; bp.push(V(o.x - L * t / dl, o.y + L * (0.3 * t - 0.36 * t * t), o.z + dz * L * t / dl)); br.push(0.1 * (1 - 0.82 * t) + 0.014); bs.push(0.1 + 0.4 * t); }
      wall.tube(bp, br, 5, { depth: 0, sway: bs, phase: ph });
      core.tube(bp.slice(0, 6), br.slice(0, 6).map((v) => v * 0.5), 4, { depth: 0, sway: bs.slice(0, 6), phase: ph });
      for (let k = 2; k <= 8; k++) for (let j = 0; j < 3; j++) {           // the fans: twigs leave the bough and hang
        const c = bp[k], a2 = r() * TAU, l2 = r.range(1.8, 3.2) * (Math.abs(c.x) < 1.1 ? 0.55 : 1), tp = [], ts = [];      // (short over the path's own line: the oak's crown stays clear)
        const hang = (s, t) => V(c.x + Math.cos(a2) * l2 * s * 0.42 * t, c.y + l2 * s * (0.22 * t - 0.98 * t * t), c.z + Math.sin(a2) * l2 * s * 0.42 * t);
        let s = offLine(c) > TWIG_CLEAR + TWIG_REACH * 2.3 + l2 ? 1 : 0;      // (out of the line's reach whole: built as it always was)
        if (!s) for (const q of [1, 0.85, 0.7, 0.55, 0.4, 0.25]) {      // the longest of these lengths that keeps the law
          let ok = l2 * q >= 0.45;
          for (let i = 0; ok && i < 5; i++) {      // (the ribbon as built: five straight pieces, the sway weight running straight along each)
            const a = hang(q, i / 5), b = hang(q, (i + 1) / 5);
            for (let m = i ? 1 : 0; ok && m <= 10; m++) ok = offLine(V(a.x + (b.x - a.x) * m / 10, a.y + (b.y - a.y) * m / 10, a.z + (b.z - a.z) * m / 10)) >= TWIG_CLEAR + TWIG_REACH * (0.5 + 1.8 * q * (i + m / 10) / 5);
          }
          if (ok) { s = q; break; }
        }
        if (!s) continue;
        for (let i = 0; i <= 5; i++) { const t = i / 5; tp.push(hang(s, t)); ts.push(0.5 + t * 1.8 * s); }
        fine.add(tp, 0.026, { depth: 0, sway: ts, phase: ph + j * 0.13 + k * 0.07 });
      }
    }
  }
  await W.tick();
  r = W.vr;
  await nearBrook(W); await W.tick();
  await nearSleepers(W, route, fine); await W.tick();      // (the nests' grass rides in the twigs' ribbons: one draw fewer)
  const gw = wall.build(); await W.tick(); const gc = core.build(); await W.tick(); const gs = sapc.build(); await W.tick(); const gf = fine.build(); await W.tick();
  W.add(gw, S.shell({ density: 0.1, sway: 0.05, flow: 0.2 })); await W.tick();
  W.add(gc, S.shell({ density: 0.06, sway: 0.05, beads: 0.6, warm: [0, 0, 0, 0.01] }));      // the plain trunks' cores; their sap beads: cold at the brook, amber once the warmth comes
  await W.tick();
  W.add(gs, S.shell({ tint: 'sap', density: 0.06, sway: 0.05, beads: 0.6, warm: [0, 0, 0, 0.01] }));      // the same matter in the sap's tint: amber cores and beads from the first frame
  await W.tick();
  W.add(gf, S.line({ density: 0.22, sway: 0.07 })); await W.tick();
  W.add(vein.build(), S.line({ tint: 'sap', density: 0.12, sway: 0.05, beads: 0.5, flow: 0.4 })); await W.tick();      // (the vein is dimmer than the redds' gold)
}
// the brook under its ice: three thin sheets of water, corrugated ALONG the stream (nothing alternates under the camera)
// and drifting over each other, and the stones of the bed as nested shells, so that fish, stones and redds are seen through
async function nearBrook(W) {
  const { S } = W, r = W.vr, stone = S.batch();
  {
    // each sheet is a long lens of water lying along the stream, clear at its edges; they lie at different depths and
    // drift, so the bed, the fish and the redds are seen through one, two or three of them and the stack brightens
    const P = [], D = [], G = [], I = [], n = 14;
    for (let k = 0; k < 18; k++) {
      const y0 = -0.24 - 0.6 * ((k % 4) + r()) / 4, x0 = r.range(-1.7, 1.7), z0 = -12 + 92 * ((k + r()) / 18), len = r.range(12, 26), wd = r.range(1.6, 3.4), ph = r(), base = P.length / 3;
      for (let j = 0; j <= n; j++) {
        const t = j / n, z = z0 + len * t, w = 0.5 * wd * Math.pow(Math.sin(Math.PI * t), 0.6), xc = Math.max(-3.0 + w, Math.min(3.0 - w, x0 + 0.55 * Math.sin(z * 0.17 + ph * 9)));
        for (let i = -1; i <= 1; i++) { P.push(xc + i * w, y0 + 0.04 * Math.sin(z * 0.27 + ph * 7) - Math.abs(i) * 0.05, z); D.push(0, z, 0.5 + r() * 0.2, ph); G.push(i === 0 ? -0.5 * sstep(74, 94, z) : -1); }
        if (j < n) { const q = base + j * 3; for (let i = 0; i < 2; i++) I.push(q + i, q + i + 3, q + i + 1, q + i + 1, q + i + 3, q + i + 4); }
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aData', new THREE.Float32BufferAttribute(D, 4));
    g.setAttribute('aGain', new THREE.Float32BufferAttribute(G, 1)); g.setIndex(I); g.computeVertexNormals();
    W.add(g, S.shell({ density: 0.03, edge: 0.3, sway: 0.06, far: [9, 30, 0.93] }));
    await W.tick();
  }
  // stones: the big ones lie where the first three moments look (under the lead trout, at z 34-44 and 62-74)
  const lie = [[1.9, 5.5, 0.55], [-2.2, 8.6, 0.6], [0.3, 11.2, 0.4], [-1.9, 13.5, 0.62], [1.6, 17.2, 0.5], [2.3, 22.5, 0.66], [-2.2, 27.5, 0.55], [0.4, 31, 0.42], [-1.5, 36.5, 0.7], [2.1, 40, 0.58], [-0.3, 45.5, 0.46],
    [1.9, 51, 0.5], [-2.3, 57, 0.52], [1.2, 63.5, 0.68], [-1.7, 67.5, 0.6], [2.4, 72, 0.5], [0.2, 77, 0.44]];
  for (let i = 0; i < Math.round(8 * W.detail); i++) lie.push([r.range(-2.7, 2.7), r.range(4, 90), r.range(0.22, 0.4)]);
  for (const [x, z, rad] of lie) {
    const c = V(x, -1.0 + rad * 0.34, z), ax = V(r.range(-0.3, 0.3), 1, r.range(-0.3, 0.3)), ph = r(), st = 1 + 0.5 * r();
    const al = Math.hypot(ax.x, ax.y, ax.z); ax.x /= al; ax.y /= al; ax.z /= al;
    stone.ball(c, rad, { len: rad * 0.5, axis: ax, rings: 5, sides: 8, depth: 0.3, phase: ph, flat: 1 / st });
    stone.ball(V(c.x + 0.1 * rad, c.y, c.z - 0.08 * rad), rad * 0.58, { len: rad * 0.3, axis: ax, rings: 3, sides: 6, depth: 0.3, phase: ph, flat: 1 / st });
  }
  await W.tick();
  W.add(stone.build(), S.shell({ density: 0.075, far: [95, 170, 0.95] }));
}
// small sleepers in the banks and under the path, half a metre down and near enough to read: curled voles in grass
// nests, hedgehogs with their quills, and clumps of large bulbs with gold hearts. Each has its own slow heart.
async function nearSleepers(W, route, grass) {
  const { S, H } = W, body = S.batch(), bone = S.batch(), rib = S.ribbons(), hearts = [], bulbs = [];
  let r = W.vr;
  // one curled animal: flattened body contour, beaded spine round the curl, skull tucked in, ribs, tail; quills if a hedgehog
  const curl = (c, s, yaw, d, quills) => {
    const ph = r(), cy = Math.cos(yaw), sy = Math.sin(yaw), at = (a, rad, up = 0) => V(c.x + (Math.cos(a) * cy - Math.sin(a) * sy) * rad * s, c.y + up * s, c.z + (Math.cos(a) * sy + Math.sin(a) * cy) * rad * s);
    body.ball(c, 0.5 * s, { len: 0.34 * s, rings: 6, sides: 9, depth: d, sway: 1, phase: ph });
    body.ball(V(c.x, c.y - 0.03 * s, c.z), 0.3 * s, { len: 0.2 * s, rings: 4, sides: 7, depth: d, sway: 1, phase: ph });
    const sp = [], sr = [];
    for (let k = 0; k <= 16; k++) { const a = -0.4 + 4.7 * k / 16; sp.push(at(a, 0.33 - 0.05 * k / 16, 0.06)); sr.push(s * (k % 2 ? 0.03 : 0.016)); }
    bone.tube(sp, sr, 4, { depth: d });
    const hd = at(4.5, 0.2, 0.02), nose = at(5.2, 0.1, -0.02);
    bone.tube([at(4.3, 0.28, 0.06), hd, nose], [0.05 * s, 0.085 * s, 0.02 * s], 6, { depth: d, gain: 0.3 });
    for (let k = 0; k < 8; k++) { const a = 1.5 + 0.2 * k; rib.add([at(a, 0.33, 0.06), at(a + 0.03, 0.26, -0.08), at(a + 0.06, 0.14, -0.14)], 0.014 * s, { depth: d }); rib.add([at(a, 0.33, 0.06), at(a - 0.02, 0.4, -0.06), at(a - 0.03, 0.42, -0.15)], 0.014 * s, { depth: d }); }
    rib.add([sp[0], at(-0.8, 0.36, 0.0), at(-1.3, 0.42, -0.04), at(-1.9, 0.45, -0.06)], [0.022 * s, 0.016 * s, 0.01 * s, 0.006 * s], { depth: d });
    for (const a of [0.9, 3.6]) rib.add([at(a, 0.3, 0.02), at(a + 0.3, 0.2, -0.1), at(a + 0.7, 0.14, -0.14)], 0.024 * s, { depth: d });     // folded legs
    if (quills) for (let k = 0; k < 64; k++) { const a = r() * TAU, el = r.range(0.05, 1.5), q0 = at(a, 0.47 * Math.cos(el), 0.33 * Math.sin(el)), q1 = at(a + 0.12, 0.7 * Math.cos(el), 0.52 * Math.sin(el)); rib.add([q0, q1], 0.011 * s, { depth: d }); }
    const hp = at(2.4, 0.16, -0.04); hearts.push([hp.x, hp.y, hp.z, d, 0.13 * s, 0, r()]);
  };
  // a nest: a ball of woven grass round the sleeper
  const nest = (c, rad, d) => {
    body.ball(c, rad, { len: rad * 0.8, rings: 5, sides: 9, depth: d });
    for (let k = 0; k < 9; k++) {
      const a = r() * TAU, tilt = r.range(-1.2, 1.2), ca = Math.cos(a), sa = Math.sin(a), ct = Math.cos(tilt), stt = Math.sin(tilt), pts = [], rr = rad * r.range(0.82, 1.06), span = TAU * r.range(0.6, 0.85);
      for (let j = 0; j <= 10; j++) { const t = j / 10 * span, u0 = Math.cos(t) * rr, v0 = Math.sin(t) * rr; pts.push(V(c.x + u0 * ca - v0 * stt * sa, c.y + v0 * ct * 0.8, c.z + u0 * sa + v0 * stt * ca)); }
      grass.add(pts, 0.02, { depth: d, phase: r() });
    }
  };
  const under = (x, z, d, rad) => V(x, H(x, z) - d - rad, z);
  const clump = (x, z, n, sc) => { for (let k = 0; k < Math.max(2, Math.round(n * W.detail)); k++) { const a = r() * TAU, q = r.range(0.25, 1.0); bulbs.push([x + Math.cos(a) * q, z + Math.sin(a) * q * 1.4, sc * r.range(0.8, 1.15)]); } };
  // [x, z, kind]: banks along the brook, then under the path through the birches
  const s1 = 0.95;
  nest(under(4.5, 17.5, 0.3, 0.6), 0.6, 0.3); curl(under(4.5, 17.5, 0.42, 0.34), s1, 0.6, 0.3, false); clump(-4.3, 20.5, 4, 0.6); clump(-4.2, 9.6, 3, 0.55); await W.tick();
  curl(under(-4.1, 38.5, 0.3, 0.36), 1.15, 2.1, 0.3, true); clump(4.2, 44, 4, 0.5); clump(-4.5, 30, 3, 0.45); await W.tick();
  nest(under(4.3, 66.5, 0.3, 0.62), 0.62, 0.3); curl(under(4.3, 66.5, 0.44, 0.34), s1, 4.0, 0.3, false); clump(-4.2, 61, 4, 0.5); clump(4.6, 54.5, 3, 0.45);
  await W.tick();
  { const keep = r; r = W.or; nest(under(-6.3, 63.3, 0.12, 0.8), 0.8, 0.2); curl(under(-6.3, 63.3, 0.27, 0.45), 1.3, 2.6, 0.2, false); r = keep; }      // the sleeper of the third picture, in the vole's bank
  curl(under(-1.6, 97.5, 0.4, 0.38), 1.25, 1.2, 0.4, true); nest(under(2.2, 104, 0.35, 0.6), 0.6, 0.35); curl(under(2.2, 104, 0.47, 0.34), s1, 5.1, 0.35, false); await W.tick();
  curl(under(-1.3, 129.5, 0.4, 0.38), 1.2, 3.3, 0.4, false); nest(under(2.3, 133, 0.35, 0.62), 0.62, 0.35); curl(under(2.3, 133, 0.47, 0.34), s1, 0.2, 0.35, false);
  for (const [x, z] of [[1.4, 80], [-2.2, 86], [2.8, 94], [0.6, 102], [-2.8, 108], [1.0, 115], [-0.6, 124], [2.6, 122], [-2.6, 136], [3.2, 99], [3.0, 128]]) clump(x, z, 3, 0.66);
  await W.tick();
  W.add(body.build(), S.shell({ density: 0.085, breath: 0.012 }));
  W.add(bone.build(), S.shell({ tint: 'white', density: 0.2 })); await W.tick();
  W.add(rib.build(), S.line({ tint: 'white', density: 0.55 }));
  for (const h of hearts) W.heartRows.push(h);
  await W.tick();
  // the bulbs are drawn with the climb's, as one instanced pair (buildClimb): here only their places, in this stream's order
  const q = new THREE.Quaternion(), e = new THREE.Euler();
  bulbs.forEach(([x, z, sz]) => {
    const d = r.range(0.3, 0.7), y = H(x, z) - d - sz; e.set(r.range(-0.3, 0.3), r() * TAU, r.range(-0.3, 0.3)); q.setFromEuler(e);
    W.bulbList.push({ x, y, z, q: q.clone(), sz, d, ph: r() });
    W.seedRows.push([x, y + sz * (W.season === 'thaw' ? 0.9 : 0.42), z, d, 0.22 * sz, 0.4, r()]);       // the folded flower's gold, read from a distance
  });
  await W.tick();
}

// ---- round four: bulbs large enough to be read in section (skin, three scales, the folded flower), placed where a still
// needs one crisp thing near the lens. Their own stream (W.r4); they ride in the climb's instanced pair.
async function bigBulbs(W, route) {
  const { H } = W, r = W.r4, q = new THREE.Quaternion(), e = new THREE.Euler();
  const put = (x, z, sz, d, tilt = 0.3) => {
    const y = H(x, z) - d - sz; e.set(r.range(-tilt, tilt), r() * TAU, r.range(-tilt, tilt)); q.setFromEuler(e);
    W.bulbList.push({ x, y, z, q: q.clone(), sz, d, ph: r() });
    W.seedRows.push([x, y + sz * (W.season === 'thaw' ? 0.9 : 0.42), z, d, 0.2 * sz, 0.4, r()]);
  };
  // u 0.16: three in the right bank, 5-8 m ahead of the lens and just under the snow's skin
  put(-5.7, 65.6, 1.7, 0.3, 0.2); put(-7.2, 68.4, 1.1, 0.35); put(-4.5, 69.4, 0.9, 0.3);
  await W.tick();
  // the end of the swing (u 0.79): the hill from above. Round the place we go under and down the flank beyond it, bulbs big enough
  // to show their scales from six to fifteen metres up; none within 3.4 m of the dive line
  const { snowIn, hd, path } = route;
  for (let i = 0; i < Math.round(32 * W.detail); i++) {
    const along = r.range(-17.5, -2.5), side = r.range(-6.5, 9.5), x = snowIn.x + hd.x * along - hd.z * side, z = snowIn.z + hd.z * along + hd.x * side, sz = r.range(0.9, 1.4);
    if (path.distanceTo(x, H(x, z) - 0.8, z) > 3.4) put(x, z, sz, r.range(0.3, 0.6), 0.5);
    if (i % 8 === 7) await W.tick();
  }
  // ...and between them the carpet itself: gold lights under the clear snow, spreading away to the rim
  for (let i = 0; i < Math.round(320 * W.detail); i++) {
    const along = r.range(-23, 7), side = r.range(-11, 17), x = snowIn.x + hd.x * along - hd.z * side, z = snowIn.z + hd.z * along + hd.x * side, d = r.range(0.4, 1.1), y = H(x, z) - d;
    if (path.distanceTo(x, y, z) > 3) W.seedRows.push([x, y, z, d, r.range(0.16, 0.28), 0.5, r()]);
    if (i % 30 === 29) await W.tick();
  }
  await W.tick();
}

// ---- beyond the hill's rim: a far row of birches on the flank the last view of the swing looks down, each one pale contour
// (a trunk line, a few boughs, hanging twigs), so that the second night sky has a far edge
async function buildRim(W, route) {
  const { S, H } = W, r = W.r4, rib = S.ribbons(), c = route.path.pointAt(route.marks.uDive - 0.043);
  const f = new THREE.Vector3(route.skyLook.x - c.x, 0, route.skyLook.z - c.z).normalize();
  for (let i = 0; i < 12; i++) {
    const dist = r.range(72, 150), sd = 2 + 84 * Math.pow((i + r()) / 12, 1.2), x = c.x + f.x * dist - f.z * sd, z = c.z + f.z * dist + f.x * sd, y0 = H(x, z), h = r.range(12, 23), ph = r(), lx = r.range(-2.6, 2.6), lz = r.range(-2.6, 2.6);
    const at = (q) => V(x + lx * q * q + 0.5 * Math.sin(q * 5 + ph * 9), y0 - 0.6 + h * q, z + lz * q * q), tp = [], tw = [];
    for (let k = 0; k <= 6; k++) { const q = k / 6; tp.push(at(q)); tw.push(0.7 * (1 - 0.7 * q)); }
    rib.add(tp, tw, { depth: 0, phase: ph });
    for (let b = 0; b < 6; b++) {
      const f0 = 0.3 + 0.6 * (b + r()) / 6, o = at(f0), ba = r() * TAU, L = h * r.range(0.16, 0.3), e = V(o.x + Math.cos(ba) * L * 0.7, o.y + L * 0.8, o.z + Math.sin(ba) * L * 0.7);
      rib.add([o, V((o.x + e.x) / 2, o.y + L * 0.38, (o.z + e.z) / 2), e, V(e.x + Math.cos(ba) * L * 0.34, e.y + L * 0.08, e.z + Math.sin(ba) * L * 0.34), V(e.x + Math.cos(ba) * L * 0.5, e.y - L * 0.42, e.z + Math.sin(ba) * L * 0.5)], [0.42, 0.38, 0.34, 0.3, 0.26], { depth: 0, sway: [0, 0, 0.2, 0.6, 1], phase: ph });      // (boughs as wide as a pixel at this range, or the trees are a row of posts)
    }
    if (i % 4 === 3) await W.tick();
  }
  W.rim = W.add(rib.build(), S.line({ density: 0.4, sway: 0.1, lod: [270, 340, 420] }));      // (shown only for the last view of the swing: update())
  await W.tick();
}

// ---- round five: one great root of the oak runs out just under the snow toward the path at the end of the climb (u 0.61: it
// arches from the lower right corner of the frame to the bole, 5 m from the lens at its nearest), a whole tube with a rounded
// amber core a third of its width, two finer forks leaving it. It is the oak's own wood: the hero's root and heartwood materials.
function buildArchRoot(W, hero) {
  const { S, H } = W, wall = S.batch(), core = S.batch();
  const lim = (ctl, rc, sides, ph) => {
    let pts = ctl.map((c) => V(c[0], c[1], c[2])), rr = rc.slice();
    for (let it = 0; it < 2; it++) { const r2 = []; rr.forEach((v, i) => { r2.push(v); if (i < rr.length - 1) r2.push((v + rr[i + 1]) / 2); }); rr = r2; pts = smoothPts(pts, 1); }
    const dep = (q) => Math.max(0.2, H(q.x, q.z) - q.y), sw = pts.map((_, i) => 0.25 * i / (pts.length - 1));
    wall.tube(pts, rr, sides, { depth: dep, sway: sw, phase: ph, gain: Math.min(2.4, Math.sqrt(rc[0] / 0.1) - 1) });
    core.tube(pts, rr.map((v) => v * 0.36), 6, { depth: dep, sway: sw, phase: ph, gain: Math.min(2.4, Math.sqrt(rc[0] / 0.1) - 1) });
  };
  lim([[-2.0, 21.3, 233.2], [-6.0, 22.1, 229.0], [-9.6, 22.42, 224.2], [-12.7, 22.3, 218.0], [-14.9, 21.7, 213.5], [-16.0, 20.5, 209.3]], [0.46, 0.42, 0.37, 0.32, 0.2, 0.04], 10, 0.2);
  lim([[-9.6, 22.42, 224.2], [-11.2, 22.2, 225.6], [-13.4, 21.6, 226.2], [-15.6, 20.6, 225.4]], [0.15, 0.14, 0.1, 0.03], 6, 0.5);
  lim([[-6.0, 22.1, 229.0], [-6.2, 21.6, 226.4], [-5.4, 20.8, 223.6], [-3.8, 19.6, 221.4]], [0.17, 0.15, 0.1, 0.03], 6, 0.8);
  W.add(wall.build(), hero.rootMat); W.add(core.build(), hero.heartMat);
}

// ---- the foot of the climb (u 0.36-0.5): a foreground for the reveal. A fan of large bulbs under the path, and gold
// mycelium running down the hill face from the oak to the wood (it lights from the oak outward as the warmth spreads).
// Fixed for every seed and density; draws only from W.cr, so nothing else in the world moves.
async function buildClimb(W, route) {
  const { S, H, scene } = W, r = W.cr, path = route.path;
  const bulbs = [];
  // [x off the path, z, size]: large beside the path, stepping back in size toward the hill and the flanks
  for (const [x, z, sz] of [[-2.1, 138, 0.8], [2.4, 140.5, 0.74], [-4.6, 142, 0.62], [0.5, 144.5, 0.86], [4.9, 145, 0.6], [-2.8, 148.5, 0.8], [2.2, 150.5, 0.84], [-6.2, 151, 0.56], [6.6, 153, 0.56],
    [-0.9, 154.5, 0.8], [3.6, 157, 0.7], [-3.9, 158.5, 0.72], [1.2, 161.5, 0.8], [-6.8, 163, 0.5], [6.2, 164.5, 0.52], [-2.2, 166, 0.74], [3.0, 169.5, 0.7], [-4.8, 172, 0.6], [0.4, 174, 0.72], [5.4, 177, 0.55], [-2.6, 180, 0.66], [2.2, 184, 0.62]]) {
    const px = path.pointAt(path.nearestXZ(0, z).u).x;
    const xo = z > 156 && Math.abs(x) < 4.5 ? x + Math.sign(x) * (3.6 + 0.12 * (z - 156)) : x, zs = z > 156 ? 0.82 : 1;
    for (let k = 0; k < 2; k++) bulbs.push([px + xo + (k ? r.range(-0.9, 0.9) : 0), z + (k ? r.range(0.8, 1.6) : 0), sz * zs * (k ? r.range(0.5, 0.7) : 1)]);
  }
  await W.tick();
  const q = new THREE.Quaternion(), e = new THREE.Euler();
  bulbs.forEach(([x, z, sz]) => {
    const d = r.range(0.25, 0.55), y = H(x, z) - d - sz; e.set(r.range(-0.3, 0.3), r() * TAU, r.range(-0.3, 0.3)); q.setFromEuler(e);
    W.bulbList.push({ x, y, z, q: q.clone(), sz, d, ph: r() });
    W.seedRows.push([x, y + sz * (W.season === 'thaw' ? 0.9 : 0.42), z, d, 0.22 * sz, 0.4, r()]);
  });
  await W.tick();
  await bigBulbs(W, route); await W.tick();
  {
    const bg = S.bulbGeometry(), n = W.bulbList.length, inst = new Float32Array(n * 4), M = new THREE.Matrix4(), ps = new THREE.Vector3(), sc = new THREE.Vector3();
    const skin = new THREE.InstancedMesh(bg.skin, S.shell({ density: 0.05 }), n), flower = new THREE.InstancedMesh(bg.flower, S.shell({ tint: 'gold', density: 0.2, glow: true, warm: [0, 0.4, 0, 0] }), n);
    W.bulbList.forEach((b, i) => {
      M.compose(ps.set(b.x, b.y, b.z), b.q, sc.set(b.sz, b.sz, b.sz)); skin.setMatrixAt(i, M);
      if (W.season === 'thaw') M.compose(ps.set(b.x, b.y + b.sz * 0.25, b.z), b.q, sc.set(b.sz * 0.8, b.sz * 2.3, b.sz * 0.8));
      flower.setMatrixAt(i, M); inst.set([b.d, b.ph, 0, 0], i * 4);
    });
    for (const m of [skin, flower]) { m.geometry.setAttribute('aInst', new THREE.InstancedBufferAttribute(inst, 4)); m.frustumCulled = false; scene.add(m); }
    await W.tick();
    W.addPts(S.pointCloud(W.seedRows), S.points({ tint: 'gold', density: 0.6, glow: true, warm: [0, 0, 0, 0.4] }));
    W.addPts(S.pointCloud(W.heartRows), S.points({ tint: 'heart', density: 1.0, glow: true, pulse: true, warm: [0, 0.3, 0, 0.35] }));      // a warm point, never a disc
  }
  await W.tick();
  // mycelium from the oak's roots down the hill face to the birches: threads half a metre under the snow, forking as they go
  const lace = S.ribbons();
  const strand = (x, z, head, len, gen) => {
    const pts = [], ph = r(), n2 = Math.round(len / 2.2), forks = [];
    for (let k = 0; k <= n2; k++) {
      const near = path.nearestXZ(x, z);
      if (near.dist > 1.6 || z > 205) pts.push(V(x, H(x, z) - 0.55 - 0.25 * Math.sin(k * 0.7 + ph * 9), z)); else if (pts.length > 2) break;
      head += 0.4 * W.n.n2(k * 0.31 + ph * 40, gen * 5.1 + 0.7) + (z < 150 ? 0 : 0.1 * Math.sin(-Math.PI / 2 - head));      // it wanders, and leans downhill toward the wood
      x += Math.cos(head) * 2.2; z += Math.sin(head) * 2.2;
      if (gen < 2 && k > 3 && k < n2 - 4 && r() < 0.1) forks.push([x, z, head + (r() < 0.5 ? -1 : 1) * r.range(0.4, 0.9), len * (1 - k / n2) * r.range(0.5, 0.8)]);
    }
    if (pts.length > 2) { const sp = smoothPts(pts, 1); lace.add(sp, sp.map((_, k) => 0.034 * (1 - 0.5 * k / sp.length) / (1 + gen * 0.4)), { depth: 0.6, phase: ph, alongK: 1.6 }); }
    for (const f of forks) strand(f[0], f[1], f[2], f[3], gen + 1);
  };
  for (let i = 0; i < 13; i++) {
    const a = -Math.PI / 2 + (i - 6) * 0.2 + r.range(-0.06, 0.06), r0 = r.range(7, 12);
    strand(OX + Math.cos(a) * r0, OZ + Math.sin(a) * r0, a + r.range(-0.15, 0.15), r.range(84, 112), 0);
    if (i % 2 === 1) await W.tick();
  }
  W.add(lace.build(), S.line({ density: 0.1, beads: 0.8, warm: [0.7, 0.7, 1, 0], near: [1.5, 4, 1.5] }));
  await W.tick();
}

export default {
  id: 'sleeping-hill',
  name: 'What the Hill Is Holding',
  category: 'wilderness',
  weirdness: 0.65,
  media: ['air'],
  async build(ctx) {
    const W = makeWorld(ctx), { S, scene } = W;
    const dome = S.sky(900); dome.material.color.copy(filmOnScreen(S.filmColor)); scene.add(dome);
    const hero = await buildHero(ctx, { style: S, palette: FILMS[W.film], detail: W.detail, snow: false, bulbs: 0 });
    hero.object.position.set(OX, OY, OZ); hero.object.rotation.y = Math.PI; scene.add(hero.object);
    await W.tick();
    const route = makeRoute(W, hero), { path, marks, L } = route; W.route = route;
    await buildGround(W); await W.tick();
    await buildBrook(W); await W.tick();
    await buildBirches(W, route); await W.tick();
    await buildDeer(W, route); await W.tick();
    await W.tick(); buildRunners(W, route); await W.tick();
    buildOwl(W, route); await W.tick();
    await buildHill(W, route); await W.tick();
    await buildSeason(W, route); await W.tick();
    await buildNear(W, route); await W.tick();
    await buildClimb(W, route); await W.tick();
    await buildRim(W, route); await W.tick();
    buildArchRoot(W, hero); await W.tick();
    const crystals = S.crystals(Math.round(3000 * W.detail), [110, 56, 110], W.rng);
    if (W.weather === 'wind') crystals.material.uniforms.uDrift.value.set(2.8, -0.9, 0.8);
    if (W.weather === 'hoar') crystals.material.uniforms.uDrift.value.set(0, -0.22, 0);
    scene.add(crystals);
    const nearCrystals = S.crystals(Math.round(700 * W.detail), [26, 16, 26], W.rng);       // the nearest drift past within a metre of the lens
    nearCrystals.material.uniforms.uDrift.value.copy(crystals.material.uniforms.uDrift.value); scene.add(nearCrystals);
    // the lens layer: a few dozen within three metres, large enough to be read as hexagon and star contours as they turn
    await W.tick();
    const lensCrystals = S.crystals(Math.round(150 * W.detail), [7, 5, 7], W.vr);
    lensCrystals.material.uniforms.uDrift.value.copy(crystals.material.uniforms.uDrift.value);
    lensCrystals.material.uniforms.uSize.value = 1.35; lensCrystals.material.uniforms.uNear.value = 1; scene.add(lensCrystals);
    S.uniforms.uLod.value.set(105, 200, 320); S.uniforms.uOak.value.set(OX, OY, OZ); S.uniforms.uWarm.value = 0; S.uniforms.uFront.value = 6;
    // The engine's portal is drawn with depth; nothing in this world writes any. A depth-only plate behind the loop keeps
    // the portal from showing through the hill from the brook side (it is seen only from in front, as the loop's eye).
    const plate = new THREE.Mesh(new THREE.CircleGeometry(34, 40), new THREE.MeshBasicMaterial({ colorWrite: false, side: THREE.DoubleSide }));
    plate.position.copy(route.loop).addScaledVector(route.diveDir, 0.6); plate.lookAt(route.loop); plate.renderOrder = -20; scene.add(plate);
    // ...and an iris of the same kind in front of it. Until we tip over, the portal seen slantwise through the hill from the
    // swing is a featureless white tile on the snow; the iris keeps it dark, then opens from the centre as the stoop begins,
    // so the loop's eye is first a point of light at the bottom of the tree and then the whole ring.
    const iris = new THREE.Mesh(new THREE.RingGeometry(1, 260, 48), plate.material);
    iris.position.copy(route.loop).addScaledVector(route.diveDir, -0.45); iris.lookAt(route.loop); iris.renderOrder = -20; iris.frustumCulled = false; scene.add(iris);
    // the silver plate's densities are neutral, and a stack of them is white long before a stack of steel blue is: its oak is drawn thinner
    const thinK = W.film === 'silver' ? 0.7 : 1;
    for (const m of [hero.crownMat, hero.rootMat, hero.twigMat, hero.rootletMat, hero.ringMat]) m.uniforms.uDens.value *= thinK;
    if (W.film === 'silver') { hero.heartMat.uniforms.uWarmP.value.y = 1.9; hero.loopHeartMat.uniforms.uWarmP.value.y = 2.6; }
    const dens = { twig: hero.twigMat.uniforms.uDens.value, rootlet: hero.rootletMat.uniforms.uDens.value, ring: hero.ringMat.uniforms.uDens.value };
    const camP = new THREE.Vector3(), bedLook = new THREE.Vector3(), pen7 = (7 * 8) / L;
    const hex = FILMS[W.film];
    return {
      scene, path, duration: 42,
      pace: (u) => 1 - 0.16 * sstep(marks.uOrbit - 0.06, marks.uOrbit + 0.02, u) * (1 - sstep(marks.uDive - 0.06, marks.uDive, u)) + 0.22 * sstep(marks.uDive - 0.02, marks.uDive + 0.05, u) * (1 - sstep(0.9, 0.97, u)),
      camera: { fov: 60, near: 0.2, far: 1500, lookAhead: 18, sway: 0.5, bank: 0.6 },
      pois: [
        // the second picture: the gaze tips down to the brook bed 8 m ahead, where the great trout hangs under the lens
        { at: (time, u) => bedLook.set(GREAT.x, -0.75, u * L + 8), from: 0.035, to: 0.115, weight: 0.75, fade: 0.3 },
        // the third: toward the vole running its tunnel in the bank beside us
        { at: () => W.volePos, from: 0.118, to: 0.215, weight: 0.26, fade: 0.3 },      // a glance, not a turn: the oak on its hill stays in the frame
        { at: W.deerLook, from: W.deerU[0], to: W.deerU[1], weight: 0.6 },
        { at: W.deer2Look, from: 0.305, to: 0.368, weight: 0.5 },      // the second deer, right of the path at the wood's edge: the oak stands upper left of it
        { at: new THREE.Vector3(OX, OY + 0.5, OZ), from: marks.uClimb - 0.04, to: marks.uDive - 0.015, weight: 0.92, fade: 0.14 },
        // the last view before the stoop: down across the hill, a second night sky of gold lights under the clear snow
        { at: route.skyLook, from: marks.uDive - 0.085, to: marks.uDive + 0.005, weight: 0.8, fade: 0.35 },
      ],
      portal: { shape: 'circle', radius: 7, color: hex[3], glow: 0.4, tilt: true, revealDistance: 150 },
      post: { exposure: 1.3, bloom: { strength: 0.22, radius: 0.55, threshold: 0.92 },
        grade: { saturation: 1.0, contrast: 1.0, tint: '#ffffff', shadowTint: '#000000', vignette: 0.08, grain: 0.03, aberration: 0 } },
      ride: 'none', style: 'none', companion: 'none',
      update(dt, time, camera, u) {
        // the film sees deeper as we climb: 2 m of penetration at the brook, 60 m by the top of the hill
        // (it starts as soon as the hill is in front of us and runs steadily, so the roots are seen lengthening limb by limb)
        const k0 = Math.min(1, Math.max(0, (u - (marks.uClimb - 0.075)) / (pen7 * 1.05))), k = 0.6 * k0 + 0.4 * k0 * k0 * (3 - 2 * k0);
        hero.setPenetration(2 + 2 * sstep(0.01, 0.16, u) + 56 * k);
        // warm life in the cold film: it grows through the flight, and from the climb on a front of sap and gold mycelium spreads
        // out from the oak through the hill
        S.uniforms.uWarm.value = sstep(0.07, 0.36, u); S.uniforms.uFront.value = 6 + 190 * Math.pow(sstep(0.3, 0.85, u), 1.3);
        // from the brook the oak is the beacon of every frame: while it is far off it is drawn larger than life and its far drawing
        // firmer and wider (one tree on the hill, white until the warm front reaches it, about a fifth of the frame tall from the first second); it is its true size
        // again before the climb, when its roots begin to draw themselves
        const farK = 1 - sstep(0.14, 0.44, u), skK = 1 - sstep(0.3, 0.46, u);
        hero.object.scale.setScalar(1 + 1.1 * farK);
        hero.skeleton.uniforms.uWScale.value = 1 + 1.5 * skK; hero.skeleton.uniforms.uDens.value = 0.5 + 0.5 * skK;
        W.hearth.material.uniforms.uDens.value = 1.0 - 0.5 * sstep(0.3, 0.44, u);
        hero.update(dt, time, camera);
        for (const f of W.updaters) f(dt, time, camera, u);
        // the dive: round the lens the oak's rootlets and fine roots clear away, so the great roots pass as whole tubes with their warm cores
        const dv = sstep(marks.uDive - 0.012, marks.uDive + 0.03, u);
        // ...and already on the last of the swing (round five), where the oak stands 8-12 m from the lens: the fine boughs and roots thin
        // away round the lens and the twigs and rootlets fall to a veil, so bole, great limbs and their second forks are followed as tubes
        const kc = sstep(marks.uDive - 0.15, marks.uDive - 0.05, u), kv = Math.max(kc, dv), ks = kc * (1 - dv);
        hero.rootMat.uniforms.uNearF.value.set(6 * dv + 8 * ks, 24 * dv + 34 * ks, 0.2, dv); hero.heartMat.uniforms.uNearF.value.copy(hero.rootMat.uniforms.uNearF.value);
        hero.rootMat.uniforms.uNearA.value.set(6.5 * dv, 12.5 * dv); hero.heartMat.uniforms.uNearA.value.copy(hero.rootMat.uniforms.uNearA.value); hero.ringMat.uniforms.uNearA.value.copy(hero.rootMat.uniforms.uNearA.value);
        const kl = dv * (1 - sstep(0.92, 0.955, u));      // the sinker's upper length too, where it passes on the left under the bole (off again before the ring is near)
        hero.loopMat.uniforms.uNearA.value.set(6.5 * kl, 12.5 * kl); hero.loopHeartMat.uniforms.uNearA.value.copy(hero.loopMat.uniforms.uNearA.value);      // and no root at all against the lens
        hero.rootletMat.uniforms.uNearW.value.set(-2 + 10 * Math.max(dv, 0.8 * kc), -1 + 25 * Math.max(dv, 1.2 * kc), 0);
        hero.rootletMat.uniforms.uDens.value = dens.rootlet * (1 - 0.55 * kv);
        hero.crownMat.uniforms.uNearF.value.set(8 * kc, 34 * kc, 0.2, 0);
        hero.twigMat.uniforms.uNearW.value.set(-2 + 8 * kc, -1 + 31 * kc, 0); hero.twigMat.uniforms.uDens.value = dens.twig * (1 - 0.6 * kc);
        hero.ringMat.uniforms.uDens.value = dens.ring * (1 - 0.45 * kv);      // the growth rings as fine nested lines, not a pale column
        W.rim.material.uniforms.uDens.value = 0.085 * sstep(marks.uDive - 0.1, marks.uDive - 0.055, u);      // faint single contours, dimmer than the snow's edge      // not behind the bole on the swing, not in the wood
        const io = sstep(marks.uDive - 0.04, marks.uDive + 0.02, u); iris.scale.setScalar(0.045 + 9.5 * io * io);
        camera.getWorldPosition(camP);
        lensCrystals.material.uniforms.uDens.value = nearCrystals.material.uniforms.uDens.value = crystals.material.uniforms.uDens.value = 0.5 * sstep(-0.5, 2.5, camP.y - W.H(camP.x, camP.z));
      },
      dispose() { hero.dispose(); },
    };
  },
};
