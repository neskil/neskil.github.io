// Hero set piece for "emperor-clearing" (The Huddle): four thousand emperor penguins packed into one
// comma-shaped animal on the fast ice, with the steam and breath that the weather tears flat and then lets go.
//
// WHAT IT IS
//   A round body 36 m across at the origin and a 34 m tail trailing toward +Z (downwind, toward the
//   entry). Birds stand in curved lanes that turn as a slow spiral, shuffle waves cross the crowd, files
//   peel off the windward rim and walk round the flanks to the lee, chicks ride feet at the rim and tail.
//   Steam lies torn flat downwind while it blows (with forty strand-like rags and eight broader ones released
//   upwind of the low pass, which thin out before they reach the lens) and rises in pearl-rimmed columns when it stops. When
//   the wind dies a wave of lifting beaks (necks stretch, bills point up, throats show, every bird puffs
//   breath) starts at anchors.beakOrigin and runs away across the body every four seconds.
//
// PLACING IT
//   Origin = centre of the body on the ice (the brief's H), +Y up, +Z = the tail side (the brief's south,
//   toward the entry). No rotation is needed if the world uses the brief's axes: object.position = H.
//   Bearings in this file follow the brief: bearing b points along (sin b, 0, -cos b).
//   The ice under it must be flat to within ~5 cm for 22 m around the origin and along the tail.
//
// opts
//   palette      brief palette (7 hex strings): [0] slate haze, [1] indigo shadow, [2] snow/pearl white,
//                [3] ice blue, [4] shell pink, [5] mint, [6] electric blue
//   season       'august' (comma, chicks on feet) | 'july' (one tight disc, no tail, no chicks) |
//                'september' (chicks in creches at the rim). Default: seeded, mostly august.
//   count        birds in the crowd (default 4000; thinned a little by ctx.quality.detail)
//   duration     seconds the world's path takes (default 42); converts setProgress(u) to brief seconds
//   times        { windStop: 20, beakStart: 19.8, pass: 18, uncover: 21.5 } brief seconds
//   track        [[x, z], ...] local ground track of the low pass; the best-modelled birds stand under it
//   ground       true (default) draws a wind-packed snow patch with the colony's marks (stain ring, grooves,
//                footprints, contact shadow) fading to nothing between 46 and 66 m from (2, 14);
//                'stain' draws only the marks over the world's own snow; false draws nothing (STAIN_GLSL
//                is exported so the world's ground shader can paint the same marks itself)
//   rareBreak    true/false: the overheated huddle breaks open as the wind dies (default: seeded, 6%)
//   fog          { uniforms, parsVertex, vertex, parsFragment, fragment } GLSL that replaces the three.js
//                fog chunks in every material here, so the world's one snow-slab fog can be shared.
//                Available in the chunks: vertex `mvPosition`, `ecWorld` (vec3 world position);
//                fragment `vWp` (vec3 world position) and gl_FragColor. fog.uniforms are shared by reference.
//
// DRIVING IT
//   hero.setProgress(u)   call every frame with the path progress. Everything staged is keyed to it:
//                         spiral angle (so the modelled birds are under the track at the pass), wind/calm,
//                         tucked heads, steam, the beak wave, saturation clamp (act one < 0.15) and the
//                         blend from the blind light to the pearl light. If it is never called the piece
//                         idles in its revealed state with beak waves on a loop (the viewer does this).
//   hero.setLight({ keyDir, keyColor, skyColor, groundColor, rimColor }) overrides the automatic light.
//   hero.set({ calm, tuck, sat, beakT, spread, rime }) overrides single staged values (null = automatic).
//   hero.uniforms         shared uniform objects (uWind, uCalm, uKeyDir, ...).
//   hero.makeBirds(list, tier)  extra birds (tier 0..3) in the same geometry and shading for stragglers and walkers:
//                         list of { x, z, yaw, scale, lean, walk } (walk 1 = waddling on the spot; move
//                         the returned mesh or rewrite its aInst attribute to make them travel).
//
// anchors (local space)
//   gaze            Vector3: where a point-of-interest should aim to hold the whole comma (centre of mass)
//   trackIn         the low pass: tail tip, tail root, centre, north rim (y 3.2: heads are 2 m below)
//   flyThrough      the brief's whole camera line near the hero, entry side to the tangent leaving it
//   theImage        { position, target }: the 26 s frame from the west-south-west
//   portalSeat      { position, facing }: where the brief seats the 14 m ring (in the notch, 124 m east)
//   beakOrigin      where the beak wave starts (under the camera at 19.8 s, north rim)
//   tailTip, rimNorth, windDir (unit, blowing toward), steamColumns (tops of the columns, calm state)
//
// SIZE   body radius 18-19.5 m, tail to z = +53, birds 1.15 m (1.3 m with lifted beaks), steam to 13 m
//        (26 m in the rare break). radius 40, height 14, center (2, 2, 14).
// COST   ~300k triangles, 7 draw calls (four bird tiers, chicks, steam+breath+rags, ground decal), no lights,
//        no textures, build ~150 ms. Tiers by distance to the camera's line (FLY, or opts.track): the nearest
//        400 birds x 225 triangles (10-sided, rounded head, curved bill, ridged flippers), the next 660 (and
//        the peeling files) x 111, the next 1,150 x 57, the far interior x 25; chicks x 42.
//        ctx.quality.detail moves birds down a tier.
// LIGHT  Self-shaded from uniforms (no scene lights needed): a broad key (default the pearl bank, bearing
//        60, 22 degrees up, #E9D8F0), violet sky fill, indigo shadows, pearl rim on rime and steam; a second,
//        warm light (uniforms uEcMoonDir, uEcMoonCol: black unless the world sets them) for a low moon. Albedo
//        stays under 0.7; only breath and steam rims exceed 1 (up to ~1.6) so bloom touches nothing else.
import * as THREE from 'three';
import { clamp, lerp, smoothstep, makeRng, hashSeed } from '../kit/core.js';

const DEFAULT_PALETTE = ['#8E8CA6', '#23233A', '#D6D9EA', '#3F6FA3', '#F3A6C8', '#8FE6C4', '#4AB2FF'];
const DEG = Math.PI / 180;
const bearing = (deg) => new THREE.Vector2(Math.sin(deg * DEG), -Math.cos(deg * DEG));
const WIND = bearing(150);                    // blowing toward bearing 150 (from 330)
const BODY_R = 18, SPACING = 0.535;

// ---------------------------------------------------------------- bird geometry (bird space: 1.15 m tall, +Z front)
// part ids (aPart): 0 body, 1 flipper, 2 bill, 3 feet and tail, 4 chick
function pushLathe(out, rings, seg, apex, part, frontBulge = 1.12) {
  const base = out.pos.length / 3;
  for (let r = 0; r < rings.length; r++) {
    const [y, rx, rz, zc] = rings[r];
    for (let i = 0; i < seg; i++) {
      const a = (i / seg) * Math.PI * 2, c = Math.cos(a);
      out.pos.push(Math.sin(a) * rx, y, c * rz * (c > 0 ? frontBulge : 0.94) + zc); out.part.push(part);
    }
  }
  for (let r = 0; r < rings.length - 1; r++) for (let i = 0; i < seg; i++) {
    const a = base + r * seg + i, b = base + r * seg + (i + 1) % seg, c = a + seg, d = b + seg;
    out.idx.push(a, b, d, a, d, c);
  }
  if (apex) {
    const ai = out.pos.length / 3; out.pos.push(apex[0], apex[1], apex[2]); out.part.push(part);
    const top = base + (rings.length - 1) * seg;
    for (let i = 0; i < seg; i++) out.idx.push(top + i, top + (i + 1) % seg, ai);
  }
}
// loose triangles with their own vertices; oriented away from `ref`
function pushTris(out, verts, tris, part, ref) {
  const base = out.pos.length / 3;
  for (const v of verts) { out.pos.push(v[0], v[1], v[2]); out.part.push(part); }
  for (const t of tris) {
    const A = verts[t[0]], B = verts[t[1]], C = verts[t[2]];
    const ux = B[0] - A[0], uy = B[1] - A[1], uz = B[2] - A[2], vx = C[0] - A[0], vy = C[1] - A[1], vz = C[2] - A[2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const cx = (A[0] + B[0] + C[0]) / 3 - ref[0], cy = (A[1] + B[1] + C[1]) / 3 - ref[1], cz = (A[2] + B[2] + C[2]) / 3 - ref[2];
    if (nx * cx + ny * cy + nz * cz >= 0) out.idx.push(base + t[0], base + t[1], base + t[2]);
    else out.idx.push(base + t[0], base + t[2], base + t[1]);
  }
}
function finishGeo(out) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(out.pos, 3));
  g.setAttribute('aPart', new THREE.Float32BufferAttribute(out.part, 1));
  g.setIndex(out.idx);
  g.computeVertexNormals();
  return g;
}
// a flipper lying on the flank: a blade with a raised ridge, its edges on the body (outer side only)
function flipper(out, s, simple) {
  const T = [s * 0.140, 0.80, 0.0], P = [s * 0.214, 0.30, 0.016];
  if (simple) {
    const F = [s * 0.186, 0.57, 0.062], B = [s * 0.182, 0.59, -0.05], O = [s * 0.224, 0.56, 0.006];
    pushTris(out, [T, F, O, B, P], [[0, 1, 2], [0, 2, 3], [1, 4, 2], [2, 4, 3]], 1, [0, 0.56, 0]);
    return;
  }
  const F1 = [s * 0.174, 0.665, 0.06], O1 = [s * 0.206, 0.66, 0.004], B1 = [s * 0.170, 0.675, -0.05];
  const F2 = [s * 0.198, 0.49, 0.058], O2 = [s * 0.230, 0.48, 0.008], B2 = [s * 0.195, 0.50, -0.04];
  pushTris(out, [T, F1, O1, B1, F2, O2, B2, P], [[0, 1, 2], [0, 2, 3], [1, 4, 5], [1, 5, 2], [2, 5, 6], [2, 6, 3], [4, 7, 5], [5, 7, 6]], 1, [0, 0.56, 0]);
}

// tier 0: ~225 triangles, the birds right under the lens (10-sided, rounded head, curved bill, ridged flippers, feet, tail)
// tier 1: ~111, the next nearest (8-sided, bill, flippers);  tier 2: 57 (6-sided, bill, painted flippers)
// tier 3: 25, the far interior (5-sided, the apex is the bill tip, no base)
export function penguinGeometry(tier = 0) {
  const out = { pos: [], idx: [], part: [] };
  if (tier === 0) {
    pushLathe(out, [[0.03, 0.145, 0.142, 0.004], [0.30, 0.205, 0.201, 0.026], [0.50, 0.202, 0.195, 0.024], [0.68, 0.176, 0.168, 0.013],
      [0.80, 0.146, 0.138, 0.004], [0.875, 0.106, 0.101, 0.0], [0.935, 0.085, 0.086, 0.005], [1.00, 0.085, 0.094, 0.015],
      [1.07, 0.074, 0.083, 0.018], [1.125, 0.044, 0.052, 0.017]], 10, [0, 1.15, 0.016], 0);
    // bill: four-sided, slightly decurved
    pushTris(out, [[0, 1.052, 0.084], [0.025, 1.022, 0.084], [0, 0.994, 0.084], [-0.025, 1.022, 0.084],
      [0, 1.036, 0.165], [0.014, 1.017, 0.165], [0, 1.001, 0.165], [-0.014, 1.017, 0.165], [0, 1.0, 0.238]],
      [[0, 1, 5], [0, 5, 4], [1, 2, 6], [1, 6, 5], [2, 3, 7], [2, 7, 6], [3, 0, 4], [3, 4, 7], [4, 5, 8], [5, 6, 8], [6, 7, 8], [7, 4, 8]], 2, [0, 1.02, 0.14]);
    flipper(out, 1, false); flipper(out, -1, false);
    for (const s of [1, -1]) pushTris(out, [[s * 0.035, 0.03, 0.08], [s * 0.125, 0.03, 0.09], [s * 0.115, 0.012, 0.235], [s * 0.05, 0.012, 0.225]], [[0, 1, 2], [0, 2, 3]], 3, [s * 0.08, -1, 0.15]);
    pushTris(out, [[0.07, 0.11, -0.14], [-0.07, 0.11, -0.14], [0, 0.012, -0.29], [0, 0.03, -0.12]], [[0, 1, 2], [0, 2, 3], [1, 3, 2]], 3, [0, 0.0, -0.1]);
  } else if (tier === 1) {
    pushLathe(out, [[0.04, 0.15, 0.146, 0.004], [0.34, 0.205, 0.2, 0.025], [0.62, 0.188, 0.18, 0.017], [0.80, 0.146, 0.138, 0.004],
      [0.89, 0.098, 0.095, 0.0], [0.955, 0.084, 0.088, 0.008], [1.05, 0.08, 0.09, 0.018]], 8, [0, 1.15, 0.016], 0);
    pushTris(out, [[0.027, 1.046, 0.082], [-0.027, 1.046, 0.082], [0, 0.994, 0.082], [0, 1.003, 0.232]], [[0, 1, 3], [1, 2, 3], [2, 0, 3]], 2, [0, 1.03, 0.1]);
    flipper(out, 1, true); flipper(out, -1, true);
  } else if (tier === 2) {
    pushLathe(out, [[0.2, 0.196, 0.192, 0.018], [0.52, 0.2, 0.194, 0.024], [0.79, 0.15, 0.141, 0.004], [0.9, 0.095, 0.093, 0.0], [1.03, 0.083, 0.092, 0.016]], 6, [0, 1.15, 0.016], 0);
    pushTris(out, [[0.028, 1.046, 0.08], [-0.028, 1.046, 0.08], [0, 0.994, 0.08], [0, 1.003, 0.23]], [[0, 1, 3], [1, 2, 3], [2, 0, 3]], 2, [0, 1.03, 0.1]);
  } else {
    pushLathe(out, [[0.28, 0.2, 0.196, 0.022], [0.79, 0.154, 0.144, 0.004], [1.02, 0.084, 0.088, 0.018]], 5, [0, 1.09, 0.17], 0);
  }
  return finishGeo(out);
}
// chick in bird space (drawn at ~0.4 scale): round down body, big masked head, 42 triangles
export function chickGeometry() {
  const out = { pos: [], idx: [], part: [] };
  pushLathe(out, [[0.10, 0.25, 0.25, 0.0], [0.42, 0.265, 0.26, 0.02], [0.74, 0.15, 0.15, 0.01], [0.95, 0.165, 0.175, 0.03]], 6, [0, 1.15, 0.03], 4, 1.05);
  return finishGeo(out);
}

// ---------------------------------------------------------------- the crowd's layout
// the camera's line near the hero (local space), used for anchors.flyThrough and to choose which birds are modelled best
const FLY = [[6, 3.2, 52], [3, 3.2, 18], [0, 3.2, 0], [-5, 3.4, -18], [-28, 5.5, -16], [-42, 8, 0], [-38, 11, 27], [-16, 14, 45], [16, 14, 45], [73, 12, 21]];
function distToFly(x, y, z) {
  let best = Infinity;
  for (let i = 0; i < FLY.length - 1; i++) {
    const A = FLY[i], B = FLY[i + 1], dx = B[0] - A[0], dy = B[1] - A[1], dz = B[2] - A[2];
    const t = clamp(((x - A[0]) * dx + (y - A[1]) * dy + (z - A[2]) * dz) / (dx * dx + dy * dy + dz * dz), 0, 1);
    const ex = x - A[0] - dx * t, ey = y - A[1] - dy * t, ez = z - A[2] - dz * t; best = Math.min(best, ex * ex + ey * ey + ez * ez);
  }
  return Math.sqrt(best);
}
function distToPolyline(x, z, pts) {
  let best = Infinity;
  for (let i = 0; i < pts.length - 1; i++) {
    const ax = pts[i][0], az = pts[i][1], bx = pts[i + 1][0], bz = pts[i + 1][1];
    const dx = bx - ax, dz = bz - az, t = clamp(((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1), 0, 1);
    const ex = x - ax - dx * t, ez = z - az - dz * t; best = Math.min(best, ex * ex + ez * ez);
  }
  return Math.sqrt(best);
}

// Y hands the page back (ctx.yield) between slices of the work; the order of every random draw is unchanged
async function makeLayout(rng, noise, L, Y) {
  const birds = [];
  const no = rng.range(0, 50);
  const rimR = (th) => L.bodyR * (1 + 0.055 * noise.n2(Math.cos(th) * 1.25 + no, Math.sin(th) * 1.25) + 0.028 * noise.n2(Math.cos(th) * 3.6 - no, Math.sin(th) * 3.6));
  L.rimR = rimR;
  const TAU = Math.PI * 2, kappa = 0.05 * L.hand;
  // body: jittered rings, squeezed into spiral lanes separated by thin trodden gaps
  for (let k = 1; k * SPACING < L.bodyR * 1.13; k++) {
    if (k % 2 === 0) await Y();
    const r = k * SPACING, n = Math.max(3, Math.round(TAU * r / SPACING)), off = rng() * TAU;
    for (let i = 0; i < n; i++) {
      let th = ((i + 0.5 + rng.range(-0.22, 0.22)) / n) * TAU + off;
      const rr = r + rng.range(-0.1, 0.1);
      if (rr > 3.5) {
        const lanes = L.lanes, s = (((th + kappa * rr) * lanes / TAU) % 1 + 1) % 1;
        const g = Math.min(0.45, 0.36 / (TAU * rr / lanes));
        th += ((g * 0.5 + s * (1 - g)) - s) * TAU / lanes;
      }
      const edge = rimR(th) - rr; if (edge < 0) continue;
      const sx = Math.sin(th), cz = -Math.cos(th), x = sx * rr, z = cz * rr;
      // facing: along the lane in the turning direction, a little inward, backs to the wind
      let fx = Math.cos(th) * L.hand * 0.7 - sx * 0.4 + WIND.x * 0.5, fz = Math.sin(th) * L.hand * 0.7 - cz * 0.4 + WIND.y * 0.5;
      birds.push({ x, z, yaw: Math.atan2(fx, fz) + rng.gauss() * 0.2, edge, spin: 1, walk: -1, side: 0 });
    }
  }
  // tail: a tapering, slightly bowed file of birds trailing downwind from the lee side
  if (L.tail) {
    const ax = L.tailTip[0] - L.tailRoot[0], az = L.tailTip[1] - L.tailRoot[1], len = Math.hypot(ax, az), ux = ax / len, uz = az / len, px = uz, pz = -ux;
    const sp = 0.6;
    for (let a = 0; a < len + 1.5; a += sp * 0.87) {
      const row = Math.round(a / (sp * 0.87));
      if (row % 8 === 0) await Y();
      for (let b = -6; b <= 6; b += sp) {
        const s = clamp(a / len, 0, 1);
        const bb = b + (row % 2) * sp * 0.5 + rng.range(-0.17, 0.17), aa = a + rng.range(-0.17, 0.17);
        const hw = lerp(L.tailW, 1.25, Math.pow(s, 0.8)) * (1 + 0.22 * noise.n2(aa * 0.21 + no, 3.3 + Math.sign(bb) * 2)) * (1 - smoothstep(0.93, 1.04, aa / len));
        const edge = hw - Math.abs(bb); if (edge < 0) continue;
        if (rng() > lerp(0.97, 0.72, s)) continue;
        const bow = L.tailBow * Math.sin(Math.PI * s);
        const x = L.tailRoot[0] + ux * aa + px * (bb + bow), z = L.tailRoot[1] + uz * aa + pz * (bb + bow);
        const rr = Math.hypot(x, z), th = Math.atan2(x, -z);
        if (rr < rimR(th) + 0.28) continue;
        const fx = WIND.x * 0.8 - px * Math.sign(bb) * 0.25, fz = WIND.y * 0.8 - pz * Math.sign(bb) * 0.25;
        birds.push({ x, z, yaw: Math.atan2(fx, fz) + rng.gauss() * 0.32, edge, spin: 0, walk: -1, side: 0, tail: true });
      }
    }
  }
  await Y();
  // trim the interior to the requested head count
  let extra = birds.length + L.walkers - L.count;
  if (extra > 0) {
    const inner = []; for (let i = 0; i < birds.length; i++) if (birds[i].edge > 2 && !birds[i].tail) inner.push(i);
    rng.shuffle(inner); const kill = new Set(inner.slice(0, extra));
    await Y();
    for (let i = birds.length - 1; i >= 0; i--) { if (kill.has(i)) birds.splice(i, 1); if (i % 256 === 0) await Y(); }
  }
  // peeling files: groups of three to six leave the windward rim and walk round a flank to the lee
  let w = 0;
  while (w < L.walkers) {
    const n = Math.min(L.walkers - w, rng.int(3, 6)), side = rng.sign(), ph = rng();
    for (let i = 0; i < n; i++) birds.push({ x: 0, z: 0, yaw: 0, edge: 0, spin: 0, walk: (ph + i * 0.0155 + rng.range(-0.002, 0.002)) % 1, side, lane: rng.range(0.55, 1) });
    w += n;
  }
  // per-bird character and distance to the camera's ground track
  let nb = 0;
  for (const b of birds) {
    if (nb++ % 256 === 0) await Y();
    b.scale = clamp(1 + rng.gauss() * 0.045, 0.88, 1.1); b.girth = rng.range(0.9, 1.13);
    b.r = [rng(), rng(), rng(), rng()];
    b.lean = rng.range(0.03, 0.16); b.open = b.walk >= 0 ? 1 : 1 - smoothstep(0.1, 1.5, b.edge);
    b.headUp = rng.chance(0.06) ? 1 : 0;
    b.dTrack = b.walk >= 0 ? 99 : distToPolyline(b.x, b.z, L.track);
  }
  // tiers by distance to the camera's line: the nearest are modelled best; the peeling files ride in tier 1
  nb = 0;
  for (const b of birds) { if (nb++ % 256 === 0) await Y(); b.dCam = b.walk >= 0 ? 0 : (L.customTrack ? Math.hypot(b.dTrack, 2.1) : distToFly(b.x, 1.0, b.z)); }
  await Y();
  const order = birds.map((b, i) => i).sort((i, j) => birds[i].dCam - birds[j].dCam);
  await Y();
  const tiers = [[], [], [], []];
  for (let i = 0; i < order.length; i++) {
    const b = birds[order[i]];
    if (b.walk >= 0) tiers[1].push(b);
    else if (tiers[0].length < L.nA) tiers[0].push(b);
    else if (tiers[1].length < L.nB + L.walkers) tiers[1].push(b);
    else if (tiers[2].length < L.nC) tiers[2].push(b);
    else tiers[3].push(b);
  }
  await Y();
  // chicks
  const chicks = [];
  if (L.season === 'august') {
    const hosts = birds.filter((b) => b.walk < 0 && (b.tail || b.edge < 1.7));
    rng.shuffle(hosts);
    for (let i = 0; i < Math.min(L.chicks, hosts.length); i++) {
      const h = hosts[i], d = 0.2 * h.scale;
      chicks.push({ x: h.x + Math.sin(h.yaw) * d, z: h.z + Math.cos(h.yaw) * d, yaw: h.yaw + rng.range(-0.5, 0.5), scale: rng.range(0.34, 0.44), girth: rng.range(0.92, 1.1),
        r: [rng(), rng(), rng(), rng()], lean: 0.02, open: 1, headUp: 1, spin: h.spin, walk: -1, side: 0 });
    }
  } else if (L.season === 'september') {
    const per = 30, nC = Math.ceil(L.chicks / per);
    for (let c = 0; c < nC; c++) {
      const th = (c + rng.range(0.1, 0.9)) / nC * TAU, rc = rimR(th) + rng.range(2.2, 4.5), cx = Math.sin(th) * rc, cz = -Math.cos(th) * rc;
      if (L.tail && distToPolyline(cx, cz, [L.tailRoot, L.tailTip]) < L.tailW + 2.5) continue;
      for (let i = 0; i < per; i++) {
        const a = i * 2.39996, rad = 0.2 * Math.sqrt(i + 0.5) * rng.range(0.9, 1.15);
        chicks.push({ x: cx + Math.cos(a) * rad, z: cz + Math.sin(a) * rad, yaw: rng.range(0, TAU), scale: rng.range(0.5, 0.62), girth: rng.range(0.95, 1.15),
          r: [rng(), rng(), rng(), rng()], lean: 0.03, open: 1, headUp: 1, spin: 1, walk: -1, side: 0 });
      }
    }
  }
  return { tiers, chicks, all: birds };
}

function instancedBirds(geo, list, material) {
  const g = new THREE.InstancedBufferGeometry();
  g.index = geo.index; g.setAttribute('position', geo.getAttribute('position')); g.setAttribute('normal', geo.getAttribute('normal')); g.setAttribute('aPart', geo.getAttribute('aPart'));
  const n = list.length, inst = new Float32Array(n * 4), rnd = new Float32Array(n * 4), kind = new Float32Array(n * 4), misc = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
    const b = list[i], o = i * 4;
    inst[o] = b.x; inst[o + 1] = b.z; inst[o + 2] = b.yaw; inst[o + 3] = b.scale ?? 1;
    const r = b.r || [0.5, 0.5, 0.5, 0.5]; rnd[o] = r[0]; rnd[o + 1] = r[1]; rnd[o + 2] = r[2]; rnd[o + 3] = r[3];
    kind[o] = b.spin ?? 0; kind[o + 1] = b.walk ?? -1; kind[o + 2] = (b.side || 0) * (b.lane ?? 1); kind[o + 3] = b.girth ?? 1;
    misc[o] = b.lean ?? 0.08; misc[o + 1] = b.open ?? 1; misc[o + 2] = b.headUp ?? 0; misc[o + 3] = b.waddle ?? 0;
  }
  g.setAttribute('aInst', new THREE.InstancedBufferAttribute(inst, 4));
  g.setAttribute('aRnd', new THREE.InstancedBufferAttribute(rnd, 4));
  g.setAttribute('aKind', new THREE.InstancedBufferAttribute(kind, 4));
  g.setAttribute('aMisc', new THREE.InstancedBufferAttribute(misc, 4));
  g.instanceCount = n;
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(2, 1, 14), 80);
  const m = new THREE.Mesh(g, material); m.frustumCulled = false; m.matrixAutoUpdate = true;
  return m;
}

// ---------------------------------------------------------------- shading
const FOG_DEFAULT = {
  uniforms: null,
  parsVertex: '#include <fog_pars_vertex>', vertex: '#include <fog_vertex>',
  parsFragment: '#include <fog_pars_fragment>', fragment: '#include <fog_fragment>',
};
const LIGHT_GLSL = /* glsl */`
uniform vec3 uKeyDir, uKeyCol, uSkyCol, uGroundCol, uRimCol, uEcMoonDir, uEcMoonCol;
uniform float uSat;
vec3 ecGrade(vec3 c){ float l = dot(c, vec3(0.2126, 0.7152, 0.0722)); return mix(l*vec3(0.97, 0.96, 1.09), c, uSat); }
`;
const BIRD_VERT = (fog) => /* glsl */`
attribute vec4 aInst, aRnd, aKind, aMisc;
attribute float aPart;
uniform float uTime, uSpin, uTuck, uBeakT, uBeakOn, uShuffle;
uniform vec2 uWind, uSpread;
uniform vec3 uBeakO;
uniform vec4 uPeel;
varying vec3 vWp, vN, vB, vBn;
varying vec4 vRnd, vFx;
${fog.parsVertex}
void main(){
  vec2 xz = aInst.xy; float yaw = aInst.z; float waddle = aMisc.w;
  if (aKind.y >= 0.0) {
    float sd = aKind.z < 0.0 ? -1.0 : 1.0, lane = abs(aKind.z);
    float s = fract(aKind.y + uTime*uPeel.w);
    float th = uPeel.x + sd*s*uPeel.y;
    float r = uPeel.z - 0.5 + (0.9 + 2.3*lane)*sqrt(max(sin(3.14159*s), 0.0));
    xz = vec2(sin(th), -cos(th))*r;
    yaw = atan(cos(th)*sd, sin(th)*sd + 1e-5);
    waddle = 1.0;
  } else {
    float a = uSpin*aKind.x, c = cos(a), s = sin(a);
    xz = vec2(xz.x*c - xz.y*s, xz.x*s + xz.y*c); yaw -= a;
  }
  xz *= 1.0 + 0.5*uSpread.x*(0.8 + 0.4*aRnd.y);
  waddle = max(waddle, uSpread.y);
  vec2 face = vec2(sin(yaw), cos(yaw));
  // shuffle wave: a 3 m band every 9 m running downwind at 1.5 m/s; each bird steps 0.3 m and bobs
  float ph = dot(xz, uWind)/9.0 - uTime/6.0 + (aRnd.y - 0.5)*0.06;
  float k = fract(ph)*3.0, inb = step(k, 1.0);
  float stp = inb > 0.5 ? smoothstep(0.0, 1.0, k) : 1.0 - (k - 1.0)*0.5;
  xz += face*0.3*(stp - 0.5)*uShuffle;
  float bob = 0.04*inb*abs(sin(k*6.2832))*uShuffle;
  float roll = 0.12*inb*sin(k*6.2832)*uShuffle + 0.02*sin(uTime*0.9 + aRnd.z*40.0);
  float wph = uTime*5.6 + aRnd.x*6.2832;
  roll += 0.13*sin(wph)*waddle; bob += 0.022*abs(cos(wph))*waddle;
  // beak wave: a 6 m band running out from uBeakO at uBeakO.z m/s, every 20 m
  float isChick = step(3.5, aPart);
  float d = length(xz - uBeakO.xy) + aRnd.w*1.2;
  float q = (uBeakT*uBeakO.z - d)/20.0, fx = fract(q);
  float lift = step(0.0, q)*smoothstep(0.0, 0.07, fx)*(1.0 - smoothstep(0.2, 0.3, fx))*uBeakOn*(1.0 - isChick)*(1.0 - waddle);
  float tuck = uTuck*(0.65 + 0.35*aRnd.x)*(1.0 - aMisc.z)*(1.0 - 0.8*waddle);
  float pitch = mix(mix(0.06, 0.95, tuck), -1.0, lift);
  float hyaw = (1.0 - tuck)*(1.0 - lift)*(0.55 + 0.6*isChick)*sin(uTime*(0.25 + 0.35*aRnd.y + 0.5*isChick) + aRnd.z*50.0);

  vec3 p = position, n = normal;
  p.xz *= aKind.w;
  float hw = smoothstep(0.80, 0.98, position.y);
  p.y += 0.15*lift*smoothstep(0.45, 0.9, position.y) - 0.05*tuck*hw;
  vec3 pv = vec3(0.0, 0.88 + 0.14*lift, 0.01);
  vec3 h = p - pv;
  float a1 = hyaw*hw, c1 = cos(a1), s1 = sin(a1);
  h.xz = vec2(h.x*c1 + h.z*s1, -h.x*s1 + h.z*c1); n.xz = vec2(n.x*c1 + n.z*s1, -n.x*s1 + n.z*c1);
  float a2 = pitch*hw, c2 = cos(a2), s2 = sin(a2);
  h.yz = vec2(h.y*c2 - h.z*s2, h.y*s2 + h.z*c2); n.yz = vec2(n.y*c2 - n.z*s2, n.y*s2 + n.z*c2);
  p = pv + h;
  float a3 = aMisc.x*(1.0 - lift) + 0.1*waddle, c3 = cos(a3), s3 = sin(a3);
  p.yz = vec2(p.y*c3 - p.z*s3, p.y*s3 + p.z*c3); n.yz = vec2(n.y*c3 - n.z*s3, n.y*s3 + n.z*c3);
  float c4 = cos(roll), s4 = sin(roll);
  p.xy = vec2(p.x*c4 - p.y*s4, p.x*s4 + p.y*c4); n.xy = vec2(n.x*c4 - n.y*s4, n.x*s4 + n.y*c4);
  float c5 = cos(yaw), s5 = sin(yaw);
  p.xz = vec2(p.x*c5 + p.z*s5, -p.x*s5 + p.z*c5); n.xz = vec2(n.x*c5 + n.z*s5, -n.x*s5 + n.z*c5);
  p *= aInst.w;
  p.xz += xz; p.y += bob;
  vec4 wp = modelMatrix*vec4(p, 1.0);
  vec3 ecWorld = wp.xyz;
  vWp = wp.xyz; vN = mat3(modelMatrix)*n; vB = position; vBn = normal; vRnd = aRnd;
  vFx = vec4(lift, aMisc.y, aPart, tuck);
  vec4 mvPosition = viewMatrix*wp;
  gl_Position = projectionMatrix*mvPosition;
  ${fog.vertex}
}`;
const BIRD_FRAG = (fog) => /* glsl */`
uniform vec2 uWind;
uniform float uRime;
uniform vec3 uBelly, uLemon, uGold, uRimeCol, uLilac;
${LIGHT_GLSL}
varying vec3 vWp, vN, vB, vBn;
varying vec4 vRnd, vFx;
${fog.parsFragment}
float bHash(vec2 p){ p = fract(p*vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y)*p.y); }
float bVN(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0 - 2.0*f);
  return mix(mix(bHash(i), bHash(i + vec2(1.0, 0.0)), f.x), mix(bHash(i + vec2(0.0, 1.0)), bHash(i + vec2(1.0, 1.0)), f.x), f.y); }
void main(){
  vec3 N = normalize(vN + vec3(0.0, 1e-4, 0.0)); if (!gl_FrontFacing) N = -N;
  vec3 V = normalize(cameraPosition - vWp + vec3(0.0, 1e-4, 0.0));
  vec3 nb = normalize(vBn + vec3(0.0, 1e-4, 0.0));
  float y = vB.y, front = nb.z, side = abs(nb.x), part = vFx.z, lift = vFx.x;
  float fineB = 1.0 - smoothstep(0.006, 0.03, fwidth(vB.y) + fwidth(vB.x));
  // plumage, painted in bird space: slate-blue back, black head, white belly with a dark border down the flank
  float mott = mix(0.5, bVN(vec2(vB.x*26.0 + vRnd.x*30.0, y*11.0 + vRnd.y*30.0)), fineB);
  vec3 back = mix(vec3(0.115, 0.125, 0.168)*(0.82 + 0.36*mott), vec3(0.018, 0.018, 0.026), smoothstep(0.84, 0.925, y))*(0.8 + 0.4*vRnd.y);
  float belly = smoothstep(-0.14, 0.03, front)*(1.0 - smoothstep(0.885, 0.93, y));
  vec3 bellyCol = mix(uBelly*(0.9 + 0.1*vRnd.x), uLemon, smoothstep(0.6, 0.88, y)*0.85);
  bellyCol *= 0.82 + 0.18*smoothstep(0.05, 0.4, y);
  float throat = lift*smoothstep(-0.8, -0.15, front)*smoothstep(0.62, 0.84, y)*(1.0 - smoothstep(1.0, 1.08, y));
  belly = max(belly, throat);
  vec3 alb = mix(back, mix(bellyCol, uLemon*1.1, throat*0.6), belly);
  float bord = (1.0 - smoothstep(0.02, 0.17, abs(front + 0.06)))*smoothstep(0.3, 0.5, y)*(1.0 - throat);
  alb = mix(alb, vec3(0.02, 0.021, 0.03), bord*0.8);
  float ear = smoothstep(0.3, 0.6, side)*smoothstep(0.885, 0.92, y)*(1.0 - smoothstep(1.035, 1.08, y))*(1.0 - smoothstep(0.35, 0.75, front))*smoothstep(-0.85, -0.45, front);
  alb = mix(alb, uGold*1.5, ear*0.92*(1.0 - 0.5*throat));
  if (part < 0.5) {
    // the flipper's shape painted on the flank: a contact shade under the modelled flipper, the flipper itself on far birds
    float fy = clamp((y - 0.3)/0.5, 0.0, 1.0);
    float fw = 0.014 + 0.052*sin(fy*3.14159)*(0.55 + 0.45*fy);
    float flip = (1.0 - smoothstep(fw, fw + 0.02, abs(vB.z - 0.006)))*smoothstep(0.1, 0.14, abs(vB.x))*step(0.3, y)*(1.0 - smoothstep(0.77, 0.81, y));
    alb = mix(alb, vec3(0.03, 0.032, 0.045), flip*0.85);
  } else if (part < 1.5) alb = mix(vec3(0.021, 0.022, 0.032), vec3(0.06, 0.063, 0.085), smoothstep(0.4, 0.75, y)*0.7);
  else if (part < 2.5) alb = mix(vec3(0.022, 0.02, 0.028), uLilac, (1.0 - smoothstep(1.012, 1.026, y))*smoothstep(0.1, 0.13, vB.z)*(1.0 - smoothstep(0.17, 0.2, vB.z)));
  else if (part < 3.5) alb = vec3(0.028, 0.027, 0.034);
  else {
    // chick: silver down, black cap and collar, white mask
    float hd = smoothstep(0.68, 0.76, y);
    float mask = max(smoothstep(-0.05, 0.3, front), smoothstep(0.45, 0.8, side))*(1.0 - smoothstep(0.99, 1.05, y));
    vec3 down = vec3(0.30, 0.31, 0.35)*(0.85 + 0.3*vRnd.x)*(0.75 + 0.25*smoothstep(0.1, 0.6, y));
    alb = mix(down, mix(vec3(0.02, 0.02, 0.028), uBelly, mask), hd);
  }
  // rime: on the windward side, on anything that faces up, and on the shoulder that faces the key
  vec3 w3 = normalize(vec3(uWind.x, -0.4, uWind.y));
  float grain = mix(0.5, 0.65*bVN(vB.xy*34.0 + vRnd.xy*40.0) + 0.35*bVN(vB.zy*15.0 + vRnd.zw*23.0), fineB);
  float shoulder = smoothstep(0.5, 0.66, y)*(1.0 - smoothstep(0.85, 0.93, y));
  float ndk = dot(N, uKeyDir);
  float rimeW = smoothstep(0.2, 0.9, dot(N, -w3))*(0.3 + 0.7*vRnd.z);
  // the shoulder that looks at the key is frosted, and more plainly on the birds under the lens
  float camD = length(cameraPosition - vWp);
  float rimeK = smoothstep(0.0, 0.6, dot(N, normalize(uKeyDir + vec3(0.0, 0.95, 0.0))))*shoulder*(0.7 + 0.3*vRnd.x)*(1.0 - 0.6*belly)*(2.0 - smoothstep(3.0, 9.0, camD));
  float rime = (max(rimeW, rimeK*1.6) + smoothstep(0.5, 0.96, N.y)*(0.22 + 0.3*shoulder))*uRime;
  rime = clamp(rime*1.4 - 0.32 + (grain - 0.5)*1.3, 0.0, 1.0)*(part > 3.5 ? 0.4 : 1.0)*(part > 1.5 && part < 2.5 ? 0.2 : 1.0);
  rime *= (1.0 - 0.75*smoothstep(0.86, 0.95, y))*(0.55 + 0.45*smoothstep(0.25, 0.7, y));
  alb = mix(alb, uRimeCol, rime*0.8);
  // light: pearl key with a broad wrap on the dark plumage, violet sky, an indigo lee side, crowd occlusion
  // toward the feet, pearl rim
  float open = vFx.y;
  float ao = mix(mix(0.13, 0.6, open), 1.0, smoothstep(0.12, 1.05, y + 0.3*lift));
  ao = mix(ao, 1.0, lift*0.7);
  float kdl = clamp((ndk + 0.3)/1.3, 0.0, 1.0), kd = kdl*kdl;
  vec3 hemi = mix(uGroundCol*ao, uSkyCol, N.y*0.5 + 0.5);
  vec3 col = alb*(hemi*ao + uKeyCol*(kd + 0.5*kdl*(1.0 - belly))*mix(ao, 1.0, 0.3));
  col *= mix(vec3(1.0), vec3(0.5, 0.54, 0.9), (1.0 - smoothstep(-0.55, 0.3, ndk))*0.9);
  float fr1 = 1.0 - clamp(dot(N, V), 0.0, 1.0); float fr = fr1*fr1*fr1;
  float toward = clamp(dot(uKeyDir, -V)*0.6 + 0.65, 0.0, 1.0);
  col += uRimCol*fr*ao*toward*(0.07 + 0.75*rime + 0.22*belly + 0.2*step(3.5, part));
  col += uRimCol*fr1*fr1*kdl*ao*0.16;
  col += uRimCol*lift*0.15*smoothstep(0.55, 0.95, y);
  // a second, warm light (the world's low moon; black when the world sets none): gold on the side that faces it and
  // a warm rim on rime, bellies and down when it stands behind the bird
  float mdl = max(dot(N, uEcMoonDir), 0.0);
  float towardM = clamp(dot(uEcMoonDir, -V)*0.6 + 0.62, 0.0, 1.0);
  col += alb*uEcMoonCol*mdl*2.0*mix(ao, 1.0, 0.4);
  col += uEcMoonCol*fr*ao*towardM*(0.35 + 1.3*rime + 0.7*belly + 0.6*step(3.5, part));
  col += uGold*ear*dot(uEcMoonCol, vec3(0.6))*ao*(0.15 + 0.7*mdl);
  vec3 Hh = normalize(uKeyDir + V + vec3(0.0, 1e-4, 0.0));
  float sp = max(dot(N, Hh), 0.0); sp *= sp; sp *= sp; sp *= sp;
  col += uKeyCol*(sp*sp*0.12 + sp*0.035)*ao*(1.0 - rime);
  col = ecGrade(col);
  gl_FragColor = vec4(col, 1.0);
  ${fog.fragment}
}`;

function makeBirdMaterial(U, fog) {
  return new THREE.ShaderMaterial({
    uniforms: U, vertexShader: BIRD_VERT(fog), fragmentShader: BIRD_FRAG(fog), fog: true, side: THREE.DoubleSide,
  });
}

// ---------------------------------------------------------------- the colony's ground (exported for the world's own ground shader)
// uHud = (body radius, tail present 0/1, tail root half width, unused); uTailSeg = (root x, root z, tip x, tip z).
// ecStain(p, px): p = local XZ in metres, px = size of a pixel in metres at that point (take fwidth outside).
//   returns x: trampled grey-umber stain, y: pale tobogganing grooves and footprint files, z: contact shadow under the crowd.
export const STAIN_GLSL = /* glsl */`
uniform vec4 uHud, uTailSeg;
float ecHash(vec2 p){ p = fract(p*vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y)*p.y); }
float ecVN(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0 - 2.0*f);
  return mix(mix(ecHash(i), ecHash(i + vec2(1.0, 0.0)), f.x), mix(ecHash(i + vec2(0.0, 1.0)), ecHash(i + vec2(1.0, 1.0)), f.x), f.y); }
float ecFbm(vec2 p){ return 0.5*ecVN(p) + 0.25*ecVN(p*2.03 + 7.1) + 0.125*ecVN(p*4.1 + 3.3) + 0.0625*ecVN(p*8.3 + 1.7); }
float ecCommaSd(vec2 p){
  float d = length(p) - uHud.x;
  vec2 pa = p - uTailSeg.xy, ba = uTailSeg.zw - uTailSeg.xy;
  float t = clamp(dot(pa, ba)/max(dot(ba, ba), 1e-4), 0.0, 1.0);
  float dt = length(pa - ba*t) - mix(uHud.z, 1.1, t);
  return mix(d, min(d, dt), uHud.y);
}
// one round pock per cell: a hashed centre and radius; lit is the share of cells that hold one
float ecPock(vec2 p, float px, float lit){
  vec2 i = floor(p), f = fract(p);
  float h = ecHash(i + 3.7);
  vec2 c = 0.32 + 0.36*vec2(ecHash(i + 11.1), ecHash(i + 23.9));
  float r = 0.14 + 0.16*fract(h*7.7);
  return (1.0 - smoothstep(r*0.45, r + px, length(f - c)))*step(1.0 - lit, h)*(0.6 + 0.4*fract(h*31.3));
}
vec3 ecStain(vec2 p, float px){
  float sd = ecCommaSd(p) + (ecFbm(p*0.22) - 0.5)*5.0;
  float mott = ecFbm(p*0.45 + 11.0);
  float stain = (1.0 - smoothstep(-3.0, 13.0, sd))*(0.55 + 0.6*mott);
  stain += (1.0 - smoothstep(0.0, 5.0, sd))*0.25;
  float r = length(p), th = atan(p.x, -p.y + 1e-4);
  float fine = 1.0 - smoothstep(0.06, 0.35, px);
  // tobogganing grooves: pale polished lines fanning out from the rim
  float u = th*7.3211 + 2.6*ecVN(vec2(r*0.06, 3.0)) + 0.5*ecVN(vec2(r*0.27, 9.0));
  float cell = floor(u), dm = abs(fract(u) - 0.5)*(r/7.3211);
  float hc = ecHash(vec2(cell, 5.0));
  float east = 0.5 + 0.5*p.x/max(r, 1.0);
  float reach = uHud.x + 4.0 + (8.0 + 26.0*east)*ecHash(vec2(cell, 8.0));
  float groove = (1.0 - smoothstep(0.1, 0.3 + px, dm))*step(0.72 - 0.4*east, hc)*smoothstep(uHud.x - 3.0, uHud.x + 1.0, r)*(1.0 - smoothstep(reach - 6.0, reach, r));
  // files of footprints between the grooves
  float u2 = th*4.7746 + 2.7 + 0.8*ecVN(vec2(r*0.09, 17.0));
  float c2 = floor(u2), d2 = (fract(u2) - 0.5)*(r/4.7746);
  float lr = step(0.5, fract(r*1.15));
  float fp = (1.0 - smoothstep(0.05, 0.11, abs(d2 - (lr - 0.5)*0.26)))*(1.0 - smoothstep(0.12, 0.2, abs(fract(r*2.3) - 0.5)));
  fp *= step(0.35, ecHash(vec2(c2, 2.0)))*smoothstep(uHud.x - 1.0, uHud.x + 2.0, r)*(1.0 - smoothstep(38.0, 52.0, r))*fine;
  // the trodden floor: small round foot pocks (one hashed dot to a cell, on two turned and warped lattices, so no
  // square edge and no row) over soft smears; denser toward the rim, and gone before a pock is under a pixel
  vec2 pw = p + 0.5*(vec2(ecVN(p*1.3 + 5.0), ecVN(p*1.3 + 31.0)) - 0.5);
  float pfade = 1.0 - smoothstep(0.05, 0.15, px);
  float rimK = 1.0 - smoothstep(0.0, 10.0, sd);
  float pocks = (1.1*ecPock(vec2(pw.x*0.8 - pw.y*0.6, pw.x*0.6 + pw.y*0.8)*4.6, px*4.6, 0.25 + 0.5*rimK)
               + 0.8*ecPock(vec2(pw.x*0.47 + pw.y*0.88, pw.y*0.47 - pw.x*0.88)*8.3 + 13.0, px*8.3, 0.2 + 0.45*rimK))*pfade*rimK;
  pocks += 0.45*smoothstep(0.5, 0.8, ecVN(vec2(pw.x*0.8 - pw.y*0.6, pw.x*0.6 + pw.y*0.8)*1.7 + 7.0))*fine*rimK;      // (the same in every direction: stretched 2.4 to 1 along one axis the smears were streaks, all one way)
  float contact = 1.0 - smoothstep(-1.2, 0.5, ecCommaSd(p) + (ecVN(p*1.3) - 0.5)*1.2);
  return vec3(clamp(stain + pocks*0.3, 0.0, 1.0), clamp(groove*0.5 + fp*0.6, 0.0, 1.0), contact);
}
`;
const GROUND_VERT = (fog) => /* glsl */`
varying vec3 vWp; varying vec2 vL;
${fog.parsVertex}
void main(){
  vL = position.xz;
  vec4 wp = modelMatrix*vec4(position, 1.0); vec3 ecWorld = wp.xyz; vWp = wp.xyz;
  vec4 mvPosition = viewMatrix*wp;
  gl_Position = projectionMatrix*mvPosition;
  ${fog.vertex}
}`;
const GROUND_FRAG = (fog) => /* glsl */`
uniform vec2 uWind; uniform vec3 uSnow, uStainCol, uShadowCol, uDecal;
${LIGHT_GLSL}
${STAIN_GLSL}
varying vec3 vWp; varying vec2 vL;
${fog.parsFragment}
float ecRidge(vec2 p){ vec2 w = uWind, c = vec2(-w.y, w.x); vec2 q = vec2(dot(p, c), dot(p, w));
  return ecVN(vec2(q.x*1.3 + 0.6*ecVN(q*0.11), q.y*0.33)) + 0.5*ecVN(vec2(q.x*3.7 + 3.0, q.y*0.8)); }
void main(){
  float px = max(fwidth(vL.x), fwidth(vL.y));
  vec3 st = ecStain(vL, px);
  float fine = 1.0 - smoothstep(0.03, 0.22, px);
  // wind-packed snow: low ridges along the wind, lit from the key side
  vec2 kd = uKeyDir.xz/max(length(uKeyDir.xz), 1e-3);
  float r0 = ecRidge(vL), r1 = ecRidge(vL + kd*0.18);
  float slope = clamp((r0 - r1)*1.3, -1.0, 1.0)*fine;
  vec2 qd = vec2(dot(vL, vec2(-uWind.y, uWind.x)), dot(vL, uWind));
  float drift = ecVN(vec2(qd.x*0.23, qd.y*0.028)) - 0.5;
  float gl = ecVN(vL*0.13 + 4.0);
  vec3 alb = uSnow*(0.84 + 0.16*gl + 0.2*drift + 0.07*(r0 - 0.75)*fine);
  alb = mix(alb, uStainCol*(0.8 + 0.4*ecVN(vL*2.3)), st.x*0.85);
  alb = mix(alb, uSnow*1.08, st.y*0.75);
  alb = mix(alb, uShadowCol*0.5, st.z*0.9);
  float key = max(0.3 + uKeyDir.y*0.9 + slope*0.6, 0.0);
  vec3 col = alb*(uSkyCol*(0.75 + 0.15*slope) + uGroundCol*0.25 + uKeyCol*key);
  col += uRimCol*max(slope, 0.0)*0.10*(1.0 - st.x)*(1.0 - st.z);
  col = ecGrade(col);
  float dc = length(vL - uDecal.xy);
  float a = 1.0 - smoothstep(uDecal.z*0.7, uDecal.z, dc);
  float marks = clamp(max(max(st.x*1.3, st.y), st.z), 0.0, 1.0);
  a *= mix(1.0, marks, step(0.5, uHud.w));
  gl_FragColor = vec4(col, a);
  ${fog.fragment}
}`;

// ---------------------------------------------------------------- steam and breath
const PUFF_VERT = (fog) => /* glsl */`
attribute vec4 aS, aS2;
uniform float uTime, uSpin, uCalm, uRise, uSteamClock, uBeakT, uBeakOn, uSteamAmt;
uniform vec2 uWind, uSpread;
uniform vec3 uBeakO, uKeyDir;
varying vec2 vUv, vKeyV; varying vec4 vS; varying vec3 vWp; varying float vY, vTorn;
${fog.parsVertex}
void main(){
  float kind = aS2.y, rnd = aS2.z;
  float ca = cos(uSpin), sa = sin(uSpin);
  vec2 xz = vec2(aS.x*ca - aS.z*sa, aS.x*sa + aS.z*ca)*(1.0 + 0.5*uSpread.x);
  vec3 c; float size; float alpha; float stretch = 0.0; float lo; float tall = 1.0; float rag = 0.0;
  if (kind < 0.5) {
    rag = aS.y;
    float L = fract(aS2.x + uSteamClock*(0.7 + 0.6*rnd));
    float cl = smoothstep(rnd*0.4, rnd*0.4 + 0.6, uCalm);
    vec3 ps = vec3(xz.x, mix(1.45 + rnd*0.7 + L*1.3, 1.55 + rnd*0.5 + L*0.4, aS.y) + 0.25*sin(uTime*2.1 + rnd*60.0), xz.y) + vec3(uWind.x, 0.0, uWind.y)*(L*L*24.0 + L*5.0);
    float yy = uRise*L*sqrt(sqrt(L))*(0.7 + 0.3*rnd);
    vec2 sway = vec2(sin(uTime*0.31 + rnd*40.0 + yy*0.33), cos(uTime*0.27 + rnd*31.0 + yy*0.29))*(0.25 + 0.11*yy)*aS2.w;
    vec3 pc = vec3(xz.x + sway.x, 1.5 + yy, xz.y + sway.y);
    c = mix(ps, pc, cl);
    size = aS.w*mix(0.8 + 2.0*L, 0.75 + 1.7*L, cl);
    stretch = size*(1.5 + 3.0*aS.y)*(1.0 - cl); tall = mix(0.5, 1.8, cl);
    float e1 = 1.0 - L;
    alpha = mix(sin(3.14159*L)*0.52*(0.35 + 0.65*fract(rnd*7.31))*(0.6 + 0.4*sin(uTime*1.7 + rnd*40.0)), smoothstep(0.0, 0.05, L)*e1*(0.13 + 0.1*aS2.w), cl)*uSteamAmt*(1.0 + aS.y*(-0.3 - 0.7*cl));
    lo = 1.15;
  } else {
    float d = length(xz - uBeakO.xy) + rnd*1.2;
    float tt = uBeakT - d/uBeakO.z;
    float life = mod(max(tt, 0.0), 20.0/uBeakO.z);
    float l = clamp((life - 0.3)/2.3, 0.0, 1.0);
    c = vec3(xz.x, aS.y + 0.12 + 0.75*l, xz.y) + vec3(uWind.x, 0.0, uWind.y)*l*(0.35 + 2.5*(1.0 - uCalm));
    size = aS.w*(0.2 + 0.7*l);
    alpha = smoothstep(0.0, 0.1, l)*(1.0 - l)*(1.0 - l)*0.75*uBeakOn*step(0.0, tt);
    lo = 1.02;
  }
  vec3 wind3 = vec3(uWind.x, 0.0, uWind.y);
  float sgn = (viewMatrix*modelMatrix*vec4(wind3, 0.0)).x < 0.0 ? -1.0 : 1.0;
  vec4 wp = modelMatrix*vec4(c + wind3*position.x*stretch*sgn, 1.0);
  vec3 ecWorld = wp.xyz;
  vec4 mvPosition = viewMatrix*wp;
  mvPosition.xy += position.xy*size*2.0*vec2(1.0, tall);
  vY = c.y + position.y*size*2.0*tall;
  alpha *= smoothstep(0.7 + 3.3*rag, 4.0 + 5.0*rag, -mvPosition.z);   // rags thin out before they reach the lens: the nearest birds stay clear
  vUv = position.xy*2.0; vS = vec4(alpha, kind, rnd, lo); vTorn = kind < 0.5 ? (1.0 - uCalm)*(1.0 + rag) : 0.0;
  vKeyV = (viewMatrix*vec4(uKeyDir, 0.0)).xy;
  vWp = wp.xyz;
  gl_Position = projectionMatrix*mvPosition;
  ${fog.vertex}
}`;
const PUFF_FRAG = (fog) => /* glsl */`
uniform vec3 uSteamCol; uniform float uSteamRim, uTime;
${LIGHT_GLSL}
varying vec2 vUv, vKeyV; varying vec4 vS; varying vec3 vWp; varying float vY, vTorn;
${fog.parsFragment}
float pHash(vec2 p){ p = fract(p*vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y)*p.y); }
float pVN(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0 - 2.0*f);
  return mix(mix(pHash(i), pHash(i + vec2(1.0, 0.0)), f.x), mix(pHash(i + vec2(0.0, 1.0)), pHash(i + vec2(1.0, 1.0)), f.x), f.y); }
void main(){
  float r2 = dot(vUv, vUv);
  if (r2 > 1.0 || vS.x < 0.003) discard;
  float n = pVN(vUv*1.7 + vS.z*37.0 + vec2(0.0, -uTime*0.12)) + 0.5*pVN(vUv*4.1 + vS.z*11.0);
  float g = exp(-r2*3.6)*(1.0 - smoothstep(0.55, 1.0, r2));
  // while it blows the steam is torn into rags: finer streaks along the wind and holes between them
  float tornK = min(vTorn, 1.0), ragK = clamp(vTorn - 1.0, 0.0, 1.0);
  n += tornK*0.6*(pVN(vec2(vUv.x*2.2 + vS.z*23.0, vUv.y*3.2 + vS.z*5.0)) - 0.5);
  float a = smoothstep(0.02 + 0.1*tornK, 0.75 - 0.2*tornK, g*(0.35 + 0.95*n) - 0.06)*vS.x;
  // a rag (vTorn = 2) is a bundle of thin strands drawn along the wind inside a soft envelope: its outline is
  // the strands' own, never the sprite's
  float strand = 0.6*pVN(vec2(vUv.x*2.2 + vS.z*23.0, vUv.y*5.5 + vS.z*5.0)) + 0.4*pVN(vec2(vUv.x*5.0 + vS.z*3.0, vUv.y*12.0 + vS.z*9.0));
  a = mix(a, min(g*2.2, 1.0)*smoothstep(0.22, 0.85, strand)*min(vS.x*1.2, 0.42), ragK);
  a *= smoothstep(vS.w, vS.w + 0.45 - 0.15*step(0.5, vS.y), vY);
  float lit = clamp(dot(vUv/max(sqrt(r2), 1e-3), vKeyV/max(length(vKeyV), 1e-3))*0.5 + 0.5, 0.0, 1.0);
  float rim = lit*lit*smoothstep(0.04, 0.4, r2)*(1.0 - smoothstep(0.4, 0.9, r2))*(1.0 - step(0.5, vS.y));
  vec3 col = uSteamCol*(uSkyCol*1.3 + uGroundCol*0.6 + uKeyCol*(0.5 + 0.45*lit))*(1.0 + 0.3*ragK);
  col += uRimCol*(rim*uSteamRim + 0.45*step(0.5, vS.y));
  col = ecGrade(col);
  gl_FragColor = vec4(col, clamp(a, 0.0, 1.0));
  ${fog.fragment}
}`;

// ---------------------------------------------------------------- build
const DBG = null;   // viewer framing override while sculpting: { radius, height, center: [x, y, z], u }

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork('emperor-clearing-hero');
  const noise = ctx.noise;
  const detail = clamp(ctx.quality?.detail ?? 1, 0.5, 1);
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE).map((h) => new THREE.Color(h));
  const duration = opts.duration ?? 42;
  const T = Object.assign({ windStop: 20, beakStart: 19.8, pass: 18, uncover: 21.5 }, opts.times || {});
  const season = opts.season || (() => { const r = rng(); return r < 0.62 ? 'august' : r < 0.86 ? 'september' : 'july'; })();
  const rare = opts.rareBreak ?? rng.chance(0.06);
  const hand = rng.sign();
  const L = {
    season, hand, lanes: rng.int(10, 16), bodyR: season === 'july' ? 19.2 : BODY_R * rng.range(0.98, 1.03), tail: season !== 'july',
    tailRoot: [rng.range(2.4, 3.2), 15.5], tailTip: [6 + rng.range(-0.8, 0.8), 51 + rng.range(0, 2.5)], tailW: rng.range(3.7, 4.6), tailBow: rng.range(-1.3, 1.3),
    count: opts.count ?? 4000, walkers: 56, nA: Math.round(400 * detail), nB: Math.round(660 * detail), nC: Math.round(1150 * detail), customTrack: !!opts.track, chicks: season === 'july' ? 0 : 400,
    track: opts.track || [[6, 58], [6, 52], [3, 18], [0, 0], [-5, -18], [-8, -27]],
  };
  const fogOpt = Object.assign({}, FOG_DEFAULT, opts.fog || {});

  // light presets: the blind half and the open half of the brief
  const dirOf = (bearDeg, elevDeg) => { const b = bearing(bearDeg), c = Math.cos(elevDeg * DEG); return new THREE.Vector3(b.x * c, Math.sin(elevDeg * DEG), b.y * c); };
  const C = (hex, k = 1) => new THREE.Color(hex).multiplyScalar(k);
  const storm = { keyDir: dirOf(50, 12), keyColor: pal[0].clone().multiplyScalar(1.5), skyColor: pal[0].clone().multiplyScalar(0.8), groundColor: pal[0].clone().multiplyScalar(0.42), rimColor: pal[2].clone().multiplyScalar(0.5) };
  const open = { keyDir: dirOf(60, 22), keyColor: C('#E9D8F0', 1.3), skyColor: C('#3A2F6B', 1.6).add(pal[0].clone().multiplyScalar(0.28)), groundColor: pal[2].clone().multiplyScalar(0.2),
    rimColor: pal[2].clone().lerp(pal[4], 0.4).multiplyScalar(1.55) };
  const lightOverride = {};

  const U = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
    uTime: { value: 0 }, uSpin: { value: 0 }, uCalm: { value: 1 }, uTuck: { value: 0.3 }, uBeakT: { value: 0 }, uBeakOn: { value: 1 }, uShuffle: { value: 1 },
    uRime: { value: rng.range(0.8, 1.05) }, uSat: { value: 1 }, uRise: { value: rare ? 25 : 12 }, uSteamClock: { value: 0 }, uSteamAmt: { value: 1 }, uSteamRim: { value: 1.5 },
    uWind: { value: WIND.clone() }, uSpread: { value: new THREE.Vector2(0, 0) },
    uBeakO: { value: new THREE.Vector3(-4, -14, 5) },
    uPeel: { value: new THREE.Vector4(330 * DEG, Math.PI, L.bodyR + 0.3, 1 / 105) },
    uKeyDir: { value: open.keyDir.clone() }, uKeyCol: { value: open.keyColor.clone() }, uSkyCol: { value: open.skyColor.clone() },
    uGroundCol: { value: open.groundColor.clone() }, uRimCol: { value: open.rimColor.clone() },
    uBelly: { value: pal[2].clone().multiplyScalar(0.86).lerp(new THREE.Color(0.62, 0.61, 0.6), 0.35) }, uLemon: { value: new THREE.Color(0.62, 0.56, 0.3) },
    uGold: { value: C('#D2A040', 0.62) },
    uEcMoonDir: { value: new THREE.Vector3(0, 1, 0) }, uEcMoonCol: { value: new THREE.Color(0, 0, 0) }, uRimeCol: { value: pal[2].clone().multiplyScalar(0.84) }, uLilac: { value: pal[4].clone().lerp(pal[6], 0.45).multiplyScalar(0.55) },
    uSnow: { value: pal[2].clone().multiplyScalar(0.8) }, uStainCol: { value: new THREE.Color(0.2, 0.185, 0.19) }, uShadowCol: { value: pal[1].clone() },
    uSteamCol: { value: pal[2].clone().multiplyScalar(0.62) },
    uHud: { value: new THREE.Vector4(L.bodyR, L.tail ? 1 : 0, L.tailW, opts.ground === 'stain' ? 1 : 0) },
    uTailSeg: { value: new THREE.Vector4(L.tailRoot[0], L.tailRoot[1], L.tailTip[0], L.tailTip[1]) },
    uDecal: { value: new THREE.Vector3(2, 14, 66) },
  }]);
  if (fogOpt.uniforms) for (const k of Object.keys(fogOpt.uniforms)) U[k] = fogOpt.uniforms[k];   // shared by reference with the world

  const object = new THREE.Group(); object.name = 'emperor-huddle';
  await ctx.yield?.();
  const lay = await makeLayout(rng, noise, L, () => ctx.yield?.());
  await ctx.yield?.();

  const birdMat = makeBirdMaterial(U, fogOpt);
  await ctx.yield?.();
  const geos = [penguinGeometry(0), penguinGeometry(1), penguinGeometry(2), penguinGeometry(3)], chickGeo = chickGeometry();
  const meshes = [];
  for (let t = 0; t < 4; t++) { await ctx.yield?.(); const m = instancedBirds(geos[t], lay.tiers[t], birdMat); m.name = 'birds-tier' + t; object.add(m); meshes.push(m); }
  await ctx.yield?.();
  if (lay.chicks.length) { const m = instancedBirds(chickGeo, lay.chicks, birdMat); m.name = 'chicks'; object.add(m); meshes.push(m); }
  await ctx.yield?.();

  // trampled-snow decal
  if (opts.ground !== false) {
    const g = new THREE.CircleGeometry(66, 48); g.rotateX(-Math.PI / 2); g.translate(2, 0.03, 14);
    const gm = new THREE.ShaderMaterial({ uniforms: U, vertexShader: GROUND_VERT(fogOpt), fragmentShader: GROUND_FRAG(fogOpt), fog: true, transparent: true, depthWrite: false,
      polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    const decal = new THREE.Mesh(g, gm); decal.name = 'colony-ground'; decal.renderOrder = 1; object.add(decal);
  }

  // steam columns and breath
  const cols = [], nCol = rng.int(7, 10);
  for (let tries = 0; cols.length < nCol && tries < 400; tries++) {
    const a = rng.range(0, Math.PI * 2), r = Math.sqrt(rng()) * L.bodyR * 0.72, x = Math.sin(a) * r, z = -Math.cos(a) * r;
    if (cols.every((c) => Math.hypot(c[0] - x, c[1] - z) > 6.5)) cols.push([x, z, rng.range(0.8, 1.2)]);
  }
  const nSteam = Math.round(300 * detail), nBreath = Math.round(420 * detail), nRag = Math.round(40 * detail) + 8, nP = nSteam + nBreath + nRag;
  const aS = new Float32Array(nP * 4), aS2 = new Float32Array(nP * 4);
  const crowd = lay.all.filter((b) => b.walk < 0);
  for (let i = 0; i < nSteam + nBreath; i++) {
    const o = i * 4;
    if (i < nSteam) {
      if (i < nSteam * 0.72) {
        const c = cols[i % cols.length], a = rng.range(0, Math.PI * 2), r = Math.abs(rng.gauss()) * 1.1;
        aS[o] = c[0] + Math.cos(a) * r; aS[o + 2] = c[1] + Math.sin(a) * r; aS[o + 3] = rng.range(1.0, 1.7) * c[2]; aS2[o + 3] = 1;
      } else {
        const b = rng.pick(crowd); aS[o] = b.x; aS[o + 2] = b.z; aS[o + 3] = rng.range(0.6, 1.1); aS2[o + 3] = 0.5;
      }
      aS[o + 1] = 0; aS2[o] = rng(); aS2[o + 1] = 0; aS2[o + 2] = rng();
    } else {
      const b = rng.pick(crowd);
      aS[o] = b.x + Math.sin(b.yaw) * 0.2; aS[o + 1] = 1.3 * b.scale; aS[o + 2] = b.z + Math.cos(b.yaw) * 0.2; aS[o + 3] = rng.range(0.8, 1.3);
      aS2[o] = rng(); aS2[o + 1] = 1; aS2[o + 2] = b.spin > 0 ? rng() : rng(); aS2[o + 3] = 0;
    }
  }
  // rags: steam torn flat across the low pass while it blows (aS.y = 1: gone once the wind stops). They are
  // released upwind of the camera's line so that they cross it in mid-life. Their own generator: no draw from `rng`.
  const rr = makeRng(hashSeed('ec-rags:' + lay.all.length + ':' + L.lanes + ':' + Math.round(L.tailW * 1e4)));
  for (let i = nSteam + nBreath; i < nP; i++) {
    const o = i * 4, k = rr(), tz = lerp(24, -22, k), tx = tz > 0 ? tz / 6 : tz * 0.28, lat = rr.range(-6, 6), up = rr.range(6.5, 11);
    // the last eight are broader: flat sheets of steam 3 to 5 m across, sliding over the body ahead of the lens
    aS[o] = tx - WIND.x * up - WIND.y * lat; aS[o + 1] = 1; aS[o + 2] = tz - WIND.y * up + WIND.x * lat; aS[o + 3] = i >= nP - 8 ? rr.range(1.4, 1.8) : rr.range(0.85, 1.4);
    aS2[o] = rr(); aS2[o + 1] = 0; aS2[o + 2] = rr(); aS2[o + 3] = 0.5;
  }
  const pg = new THREE.InstancedBufferGeometry();
  pg.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0], 3));
  pg.setIndex([0, 1, 2, 0, 2, 3]);
  pg.setAttribute('aS', new THREE.InstancedBufferAttribute(aS, 4)); pg.setAttribute('aS2', new THREE.InstancedBufferAttribute(aS2, 4));
  pg.instanceCount = nP; pg.boundingSphere = new THREE.Sphere(new THREE.Vector3(2, 6, 14), 90);
  const puffMat = new THREE.ShaderMaterial({ uniforms: U, vertexShader: PUFF_VERT(fogOpt), fragmentShader: PUFF_FRAG(fogOpt), fog: true, transparent: true, depthWrite: false });
  const puffs = new THREE.Mesh(pg, puffMat); puffs.name = 'steam-breath'; puffs.frustumCulled = false; puffs.renderOrder = 3; object.add(puffs);

  // ---- anchors (local space; the brief's world coordinates minus H)
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const exitDir = V(25.5, 16, -10.5).normalize();
  const anchors = {
    gaze: V(1, 1.2, L.tail ? 7 : 0),
    trackIn: [V(6, 3.2, 52), V(3, 3.2, 18), V(0, 3.2, 0), V(-5, 3.4, -18)],
    flyThrough: FLY.map((p) => V(p[0], p[1], p[2])),
    theImage: { position: V(-41, 10, 16), target: V(2, 1.5, 6) },
    portalSeat: { position: V(124, 44, 0), facing: exitDir.clone().negate() },
    beakOrigin: V(U.uBeakO.value.x, 0, U.uBeakO.value.y),
    tailTip: V(L.tailTip[0], 0, L.tailTip[1]), rimNorth: V(-5, 0, -L.bodyR),
    windDir: V(WIND.x, 0, WIND.y),
    steamColumns: cols.map((c) => V(c[0], 1.5 + U.uRise.value, c[1])),
  };

  // ---- staging
  let progress = DBG && DBG.u != null ? DBG.u : null;
  const manual = { calm: null, tuck: null, sat: null, beakT: null, spread: null, rime: null };
  const omega = (Math.PI * 2) / 300;
  const kd = new THREE.Vector3();
  const hero = {
    object, radius: DBG ? DBG.radius : 40, height: DBG ? DBG.height : 14, center: DBG ? V(...DBG.center) : V(2, 2, 14),
    anchors, uniforms: U, season, rare, ground: true, groundY: 0,
    counts: { birds: lay.all.length, tiers: lay.tiers.map((t) => t.length), chicks: lay.chicks.length, steam: nSteam, breath: nBreath, rags: nRag },
    setProgress(u) { progress = u; },
    setLight(l) { Object.assign(lightOverride, l || {}); },
    set(v) { Object.assign(manual, v || {}); },
    makeBirds(list, tier = 0) {
      const r2 = rng.fork('extra-birds');
      const m = instancedBirds(geos[clamp(tier | 0, 0, 3)], list.map((b) => ({ x: b.x, z: b.z, yaw: b.yaw ?? 0, scale: b.scale ?? 1, lean: b.lean ?? 0.1, girth: b.girth ?? r2.range(0.92, 1.1),
        r: [r2(), r2(), r2(), r2()], spin: 0, walk: -1, side: 0, open: 1, headUp: b.headUp ?? 1, waddle: b.walk ? 1 : 0 })), birdMat);
      m.name = 'extra-birds'; return m;
    },
    update(dt, time, camera) {
      const d = Math.min(Math.max(dt || 0, 0), 0.1);
      let calm = 1, tuck = 0.3, sat = 1, beakT = time, spin = hand * omega * time, lb = 1, spread = 0, moving = 0;
      if (progress != null) {
        const t = progress * duration;
        calm = smoothstep(T.windStop, T.windStop + 1.6, t);
        tuck = lerp(1, 0.3, smoothstep(T.windStop, T.windStop + 4, t));
        sat = lerp(0.13, 1, smoothstep(T.windStop + 0.6, T.uncover + 1.5, t));
        beakT = t - T.beakStart;
        spin = hand * omega * (t - T.pass);
        lb = smoothstep(T.windStop + 0.5, T.uncover + 1, t);
        if (rare) { spread = smoothstep(T.windStop + 0.3, T.windStop + 6.3, t); moving = smoothstep(T.windStop + 0.3, T.windStop + 1.2, t) * (1 - smoothstep(T.windStop + 5.4, T.windStop + 6.6, t)); }
      }
      if (manual.calm != null) calm = manual.calm; if (manual.tuck != null) tuck = manual.tuck; if (manual.sat != null) sat = manual.sat;
      if (manual.beakT != null) beakT = manual.beakT; if (manual.spread != null) spread = manual.spread; if (manual.rime != null) U.uRime.value = manual.rime;
      U.uTime.value = time; U.uSpin.value = spin; U.uCalm.value = calm; U.uTuck.value = tuck; U.uSat.value = sat; U.uBeakT.value = beakT;
      U.uSpread.value.set(spread, moving);
      U.uSteamClock.value += d * lerp(0.42, 0.105, calm);
      U.uSteamRim.value = lerp(0.3, 1.5, calm);
      kd.copy(storm.keyDir).lerp(open.keyDir, lb).normalize();
      U.uKeyDir.value.copy(lightOverride.keyDir || kd).normalize();
      const mixC = (target, a, b, o) => { if (o) target.set(o); else target.copy(a).lerp(b, lb); };
      mixC(U.uKeyCol.value, storm.keyColor, open.keyColor, lightOverride.keyColor);
      mixC(U.uSkyCol.value, storm.skyColor, open.skyColor, lightOverride.skyColor);
      mixC(U.uGroundCol.value, storm.groundColor, open.groundColor, lightOverride.groundColor);
      mixC(U.uRimCol.value, storm.rimColor, open.rimColor, lightOverride.rimColor);
    },
    dispose() { for (const g of geos) g.dispose(); chickGeo.dispose(); },
  };
  hero.update(0, 0, null);
  return hero;
}
